import argparse
import hashlib
import json
import math
import os
import re
import shutil
import statistics
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path


API_URL = "https://api.openai.com/v1/audio/speech"
ALLOWED_OPENAI_VOICES = {"marin", "cedar"}
ALLOWED_EDGE_VOICES = {
    "en-GB-RyanNeural",
    "en-CA-ClaraNeural",
    "en-US-EmmaMultilingualNeural",
    "en-US-AvaMultilingualNeural",
}
EDGE_TTS_PRONUNCIATION_REPLACEMENTS = {
    "café": "cafe",
}
OPENAI_INSTRUCTIONS = (
    "Voice: A clear, natural adult speaker using American English, suitable for a Japanese "
    "Eiken Grade 2 listening examination. Sound like a real person in an official language "
    "test, not a voice actor, commercial narrator, or artificial announcement.\n\n"
    "Delivery: Speak at a natural, steady conversational pace appropriate for an official "
    "English proficiency listening test. Preserve natural rhythm, connected speech, and fluent "
    "intonation. Do not rush, drag, stretch, or over-pronounce the words.\n\n"
    "Pronunciation: Use clear and accurate American English pronunciation. Keep contractions "
    "and connected speech natural. Do not over-pronounce every word.\n\n"
    "Punctuation and pauses: Follow punctuation carefully. Use short, natural pauses at commas "
    "and full stops. Do not insert unnecessary pauses inside a sentence.\n\n"
    "Exam style: Maintain the neutral, clear, and realistic delivery of an official Eiken Grade "
    "2 listening recording. Use only light, natural emotion. Do not emphasize words or details "
    "in a way that reveals the answer.\n\n"
    "Accuracy: Read the supplied text exactly as written. Do not add, omit, repeat, paraphrase, "
    "correct, or explain any words.\n\n"
    "Audio quality: Produce an ultra-clean studio-quality voice recording with crisp "
    "intelligibility and a full, natural vocal tone. Avoid background noise, hiss, reverb, "
    "distortion, clipping, metallic texture, muffled sound, breathiness, and compression artifacts."
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="英検2級SCBT第1回 Part 1を、確定済みのOpenAI/Edge混成ペアで安全に生成します。"
    )
    parser.add_argument(
        "--plan",
        type=Path,
        default=Path("audio-generation/grade2-round1-part1-plan.json"),
    )
    parser.add_argument(
        "--source-js",
        type=Path,
        default=Path("grade2-listening-part2-sets.js"),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("audio-generation/grade2-round1/part1"),
    )
    parser.add_argument(
        "--numbers",
        default="1-15",
        help="例: 1、2-5、1,3,8-10",
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def run_checked(command):
    return subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def parse_number_selection(value):
    selected = set()
    for raw_part in value.split(","):
        part = raw_part.strip()
        if not part:
            continue
        if "-" in part:
            start_text, end_text = part.split("-", 1)
            start = int(start_text)
            end = int(end_text)
            if start > end:
                raise RuntimeError(f"Invalid number range: {part}")
            selected.update(range(start, end + 1))
        else:
            selected.add(int(part))
    if not selected or any(number < 1 or number > 15 for number in selected):
        raise RuntimeError("numbers must select one or more values from 1 through 15")
    return selected


def load_source_questions(source_js, set_key):
    node = shutil.which("node")
    if not node:
        raise RuntimeError("node was not found; it is required to read the authoritative app data")
    source_js = source_js.resolve()
    if not source_js.exists():
        raise RuntimeError(f"Source data was not found: {source_js}")

    code = r"""
const path = require('path');
const source = path.resolve(process.argv[1]);
const setKey = process.argv[2];
global.window = { scbtGrade2VocabSets: [{ key: setKey }] };
require(source);
const target = window.scbtGrade2VocabSets.find((value) => value.key === setKey);
if (!target || !Array.isArray(target.listeningQuestions)) {
  throw new Error(`Listening set not found: ${setKey}`);
}
process.stdout.write(JSON.stringify(target.listeningQuestions));
"""
    completed = run_checked([node, "-e", code, str(source_js), set_key])
    questions = json.loads(completed.stdout)
    if not isinstance(questions, list):
        raise RuntimeError("The source listening questions were not an array")
    return questions


def parse_dialogue(script):
    matches = list(re.finditer(r"(^|\s)([AB]):\s+", script))
    turns = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(script)
        text = script[match.end() : end].strip()
        turns.append({"speaker": match.group(2), "text": text})
    return turns


def pair_for_number(plan, number):
    matches = [
        block
        for block in plan.get("pairBlocks", [])
        if int(block.get("start", 0)) <= number <= int(block.get("end", 0))
    ]
    if len(matches) != 1:
        raise RuntimeError(f"No unique voice pair was configured for No.{number}")
    return matches[0]


def ensure_ascii(text, context):
    non_ascii = sorted({character for character in text if ord(character) > 127})
    if non_ascii:
        rendered = " ".join(f"U+{ord(character):04X}" for character in non_ascii)
        raise RuntimeError(f"Non-ASCII input rejected for {context}: {rendered}")


def apply_edge_tts_pronunciation_text(text):
    result = text
    replacements = []
    for source, target in EDGE_TTS_PRONUNCIATION_REPLACEMENTS.items():
        if source in result:
            result = result.replace(source, target)
            replacements.append({"from": source, "to": target})
    return result, replacements


def validate_voice_config(config, speaker, number):
    provider = config.get("provider")
    voice = config.get("voice")
    gender = config.get("gender")
    expected_gender = "female" if speaker == "A" else "male"
    if gender != expected_gender:
        raise RuntimeError(
            f"No.{number} speaker {speaker} must be {expected_gender}, not {gender}"
        )
    if provider == "openai" and voice not in ALLOWED_OPENAI_VOICES:
        raise RuntimeError(f"Unapproved OpenAI voice for No.{number}: {voice}")
    if provider == "edge" and voice not in ALLOWED_EDGE_VOICES:
        raise RuntimeError(f"Unapproved Edge voice for No.{number}: {voice}")
    if provider not in {"openai", "edge"}:
        raise RuntimeError(f"Unsupported provider for No.{number}: {provider}")


def prepare_items(questions, plan):
    part1 = [question for question in questions if question.get("part") == "Part 1"]
    by_number = {int(question["id"]): question for question in part1}
    if sorted(by_number) != list(range(1, 16)):
        raise RuntimeError("The authoritative set must contain exactly Part 1 No.1 through No.15")

    items = []
    for number in range(1, 16):
        question = by_number[number]
        turns = parse_dialogue(str(question.get("script", "")))
        if len(turns) != 4:
            raise RuntimeError(f"No.{number} must contain exactly four dialogue turns")
        expected = turns[0]["speaker"]
        for turn in turns:
            if turn["speaker"] != expected:
                raise RuntimeError(f"No.{number} dialogue speakers do not alternate")
            if not turn["text"]:
                raise RuntimeError(f"No.{number} contains an empty dialogue turn")
            expected = "B" if expected == "A" else "A"

        block = pair_for_number(plan, number)
        voices = {"A": dict(block["A"]), "B": dict(block["B"])}
        validate_voice_config(voices["A"], "A", number)
        validate_voice_config(voices["B"], "B", number)
        if voices["A"]["provider"] == voices["B"]["provider"]:
            raise RuntimeError(f"No.{number} must use one OpenAI voice and one Edge voice")

        first_speaker = turns[0]["speaker"]
        last_speaker = turns[-1]["speaker"]
        question_speaker = first_speaker
        if question_speaker == last_speaker:
            raise RuntimeError(f"No.{number} question must use the gender opposite the final turn")

        segments = []
        for index, turn in enumerate(turns):
            display_text = turn["text"]
            if index == 0:
                display_text = f"Number {number}... {display_text}"
            gap_after_ms = (
                int(plan["questionGapMs"])
                if index == len(turns) - 1
                else int(plan["normalGapMs"])
            )
            voice_config = voices[turn["speaker"]]
            text = display_text
            tts_overrides = []
            if voice_config["provider"] == "edge":
                text, tts_overrides = apply_edge_tts_pronunciation_text(text)
            if voice_config["provider"] == "edge" and voice_config.get("englishOnly"):
                ensure_ascii(text, f"No.{number} {turn['speaker']}")
            segments.append(
                {
                    "speaker": turn["speaker"],
                    "provider": voice_config["provider"],
                    "voice": voice_config["voice"],
                    "gender": voice_config["gender"],
                    "language": voice_config.get("language"),
                    "englishOnly": bool(voice_config.get("englishOnly", False)),
                    "gainDb": float(voice_config.get("gainDb", 0.0)),
                    "displayText": display_text,
                    "text": text,
                    "ttsOverrides": tts_overrides,
                    "gapAfterMs": gap_after_ms,
                }
            )

        question_text = f"Question. {str(question.get('questionText', '')).strip()}"
        question_voice = voices[question_speaker]
        question_display_text = question_text
        question_tts_overrides = []
        if question_voice["provider"] == "edge":
            question_text, question_tts_overrides = apply_edge_tts_pronunciation_text(
                question_text
            )
        if question_voice["provider"] == "edge" and question_voice.get("englishOnly"):
            ensure_ascii(question_text, f"No.{number} question")
        segments.append(
            {
                "speaker": question_speaker,
                "provider": question_voice["provider"],
                "voice": question_voice["voice"],
                "gender": question_voice["gender"],
                "language": question_voice.get("language"),
                "englishOnly": bool(question_voice.get("englishOnly", False)),
                "gainDb": float(question_voice.get("gainDb", 0.0)),
                "displayText": question_display_text,
                "text": question_text,
                "ttsOverrides": question_tts_overrides,
                "gapAfterMs": 0,
                "role": "question",
            }
        )

        items.append(
            {
                "id": f"No{number:02d}",
                "number": number,
                "displayScript": question["script"],
                "questionText": question["questionText"],
                "choices": question.get("choices", []),
                "correct": question.get("correct"),
                "voices": voices,
                "segments": segments,
            }
        )
    return items


def cache_key(values):
    serialized = json.dumps(values, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:24]


def openai_segment_key(plan, segment):
    return cache_key(
        {
            "provider": "openai",
            "model": plan["model"],
            "voice": segment["voice"],
            "speed": float(plan["openaiSpeed"]),
            "instructions": OPENAI_INSTRUCTIONS,
            "text": segment["text"],
        }
    )


def edge_segment_key(plan, segment):
    return cache_key(
        {
            "provider": "edge",
            "voice": segment["voice"],
            "rate": plan["edgeRate"],
            "volume": plan["edgeVolume"],
            "language": segment.get("language"),
            "englishOnly": segment.get("englishOnly", False),
            "text": segment["text"],
        }
    )


def valid_wav(path):
    if not path.exists() or path.stat().st_size < 44:
        return False
    with path.open("rb") as handle:
        return handle.read(4) == b"RIFF"


def segment_cache_path(output_dir, plan, segment):
    if segment["provider"] == "openai":
        key = openai_segment_key(plan, segment)
    else:
        key = edge_segment_key(plan, segment)
    safe_voice = re.sub(r"[^A-Za-z0-9_-]", "_", segment["voice"])
    return output_dir / "_cache" / segment["provider"] / f"{safe_voice}-{key}.wav"


def estimate(items, selected_numbers, output_dir, plan):
    openai_segments = []
    edge_segments = []
    missing_openai = []
    missing_edge = []
    for item in items:
        if item["number"] not in selected_numbers:
            continue
        for segment in item["segments"]:
            path = segment_cache_path(output_dir, plan, segment)
            if segment["provider"] == "openai":
                openai_segments.append(segment)
                if not valid_wav(path):
                    missing_openai.append(segment)
            else:
                edge_segments.append(segment)
                if not valid_wav(path):
                    missing_edge.append(segment)

    missing_text = " ".join(segment["text"] for segment in missing_openai)
    all_openai_text = " ".join(segment["text"] for segment in openai_segments)
    missing_words = len(re.findall(r"\b[\w']+\b", missing_text))
    estimated_missing_minutes = missing_words / 130.0
    conservative_rate = float(plan["limits"]["conservativeCostUsdPerMinute"])
    return {
        "selectedItems": len(selected_numbers),
        "totalSegments": len(openai_segments) + len(edge_segments),
        "openaiSegments": len(openai_segments),
        "edgeSegments": len(edge_segments),
        "missingOpenaiApiCalls": len(missing_openai),
        "cachedOpenaiSegments": len(openai_segments) - len(missing_openai),
        "missingEdgeCalls": len(missing_edge),
        "cachedEdgeSegments": len(edge_segments) - len(missing_edge),
        "openaiCharacters": len(all_openai_text),
        "missingOpenaiCharacters": len(missing_text),
        "missingOpenaiWords": missing_words,
        "estimatedMissingOpenaiMinutes": round(estimated_missing_minutes, 3),
        "estimatedCostUsd": round(estimated_missing_minutes * conservative_rate, 4),
        "costBasis": f"conservative estimate at ${conservative_rate:.3f} per generated OpenAI minute",
    }


def estimate_full_plan(items, plan):
    openai_segments = [
        segment
        for item in items
        for segment in item["segments"]
        if segment["provider"] == "openai"
    ]
    edge_segments = [
        segment
        for item in items
        for segment in item["segments"]
        if segment["provider"] == "edge"
    ]
    text = " ".join(segment["text"] for segment in openai_segments)
    words = len(re.findall(r"\b[\w']+\b", text))
    minutes = words / 130.0
    conservative_rate = float(plan["limits"]["conservativeCostUsdPerMinute"])
    return {
        "items": len(items),
        "totalSegments": len(openai_segments) + len(edge_segments),
        "openaiSegments": len(openai_segments),
        "edgeSegments": len(edge_segments),
        "openaiCharacters": len(text),
        "openaiWords": words,
        "estimatedOpenaiMinutes": round(minutes, 3),
        "estimatedCostUsd": round(minutes * conservative_rate, 4),
        "costBasis": f"conservative estimate at ${conservative_rate:.3f} per generated OpenAI minute",
    }


def validate_limits(plan, preflight):
    limits = plan["limits"]
    if preflight["missingOpenaiApiCalls"] > int(limits["maxApiCalls"]):
        raise RuntimeError(
            "Missing OpenAI segments exceed maxApiCalls: "
            f"{preflight['missingOpenaiApiCalls']} > {limits['maxApiCalls']}"
        )
    if preflight["missingOpenaiCharacters"] > int(limits["maxOpenAICharacters"]):
        raise RuntimeError("OpenAI input characters exceed the fixed safety limit")
    if preflight["estimatedCostUsd"] > float(limits["estimatedCostCapUsd"]):
        raise RuntimeError("The conservative OpenAI cost estimate exceeds the fixed cost cap")


def request_openai_speech(api_key, payload, destination, state, limits):
    max_calls = int(limits["maxApiCalls"])
    max_retries = int(limits["maxRetriesPerSegment"])
    last_error = None
    for attempt in range(max_retries + 1):
        if state["apiCalls"] >= max_calls:
            raise RuntimeError(f"OpenAI API call limit reached ({max_calls})")
        state["apiCalls"] += 1
        request = urllib.request.Request(
            API_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                audio = response.read()
            if len(audio) < 44 or audio[:4] != b"RIFF":
                raise RuntimeError("OpenAI did not return a valid WAV file")
            destination.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(
                prefix=f"{destination.stem}-",
                suffix=".tmp.wav",
                dir=destination.parent,
                delete=False,
            ) as temporary:
                temporary.write(audio)
                temporary_path = Path(temporary.name)
            temporary_path.replace(destination)
            return
        except urllib.error.HTTPError as error:
            body = error.read(2000).decode("utf-8", errors="replace")
            last_error = RuntimeError(f"OpenAI API HTTP {error.code}: {body}")
            if error.code not in {429, 500, 502, 503, 504}:
                break
        except (urllib.error.URLError, TimeoutError, RuntimeError) as error:
            last_error = error
        if attempt < max_retries:
            time.sleep(1.0)
    raise RuntimeError(f"OpenAI speech generation failed: {last_error}")


def generate_openai_segment(api_key, plan, segment, destination, state):
    payload = {
        "model": plan["model"],
        "voice": segment["voice"],
        "input": segment["text"],
        "speed": float(plan["openaiSpeed"]),
        "response_format": "wav",
        "instructions": OPENAI_INSTRUCTIONS,
    }
    request_openai_speech(api_key, payload, destination, state, plan["limits"])


def generate_edge_segment(plan, segment, destination, ffmpeg, state):
    executable = shutil.which("edge-tts")
    if not executable:
        raise RuntimeError("edge-tts command was not found")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="round1-edge-", dir=destination.parent) as temp_text:
        temp_dir = Path(temp_text)
        mp3_path = temp_dir / "segment.mp3"
        wav_path = temp_dir / "segment.wav"
        subprocess.run(
            [
                executable,
                "--text",
                segment["text"],
                "--voice",
                segment["voice"],
                f"--rate={plan['edgeRate']}",
                f"--volume={plan['edgeVolume']}",
                "--write-media",
                str(mp3_path),
            ],
            check=True,
        )
        run_checked(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(mp3_path),
                "-ar",
                "24000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(wav_path),
            ]
        )
        wav_path.replace(destination)
    state["edgeCalls"] += 1


def probe_audio(ffprobe, path):
    completed = run_checked(
        [
            ffprobe,
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_name,sample_fmt,sample_rate,channels,bits_per_sample,duration",
            "-of",
            "json",
            str(path),
        ]
    )
    streams = json.loads(completed.stdout).get("streams") or []
    return streams[0] if streams else {}


def volume_stats(ffmpeg, path):
    completed = subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-nostats",
            "-i",
            str(path),
            "-af",
            "volumedetect",
            "-f",
            "null",
            "-",
        ],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    output = f"{completed.stdout}\n{completed.stderr}"

    def read_value(name):
        match = re.search(rf"{name}:\s*(-?inf|[-+]?\d+(?:\.\d+)?)\s*dB", output)
        if not match or match.group(1) == "-inf":
            return None
        return float(match.group(1))

    return {
        "meanVolumeDb": read_value("mean_volume"),
        "maxVolumeDb": read_value("max_volume"),
    }


def generate_silence(ffmpeg, path, milliseconds):
    run_checked(
        [
            ffmpeg,
            "-y",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-t",
            f"{milliseconds / 1000.0:.3f}",
            "-ar",
            "24000",
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            str(path),
        ]
    )


def combine_item(ffmpeg, records, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix=f"{destination.stem.lower()}-combine-", dir=destination.parent
    ) as temp_text:
        temp_dir = Path(temp_text)
        ordered = []
        silence_cache = {}
        for index, record in enumerate(records, start=1):
            normalized = temp_dir / f"segment-{index:02d}.wav"
            command = [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(record["path"]),
            ]
            if float(record["gainDb"]) != 0.0:
                command += ["-filter:a", f"volume={float(record['gainDb']):.3f}dB"]
            command += [
                "-ar",
                "24000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(normalized),
            ]
            run_checked(command)
            ordered.append(normalized)
            gap_ms = int(record["gapAfterMs"])
            if index < len(records) and gap_ms > 0:
                silence = silence_cache.get(gap_ms)
                if silence is None:
                    silence = temp_dir / f"silence-{gap_ms}.wav"
                    generate_silence(ffmpeg, silence, gap_ms)
                    silence_cache[gap_ms] = silence
                ordered.append(silence)

        concat_file = temp_dir / "concat.txt"
        lines = []
        for path in ordered:
            escaped = str(path.resolve()).replace("'", "'\\''")
            lines.append(f"file '{escaped}'")
        concat_file.write_text("\n".join(lines) + "\n", encoding="utf-8")

        initial = temp_dir / "initial.wav"
        run_checked(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_file),
                "-ar",
                "24000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(initial),
            ]
        )
        initial_volume = volume_stats(ffmpeg, initial)
        max_volume = initial_volume["maxVolumeDb"]
        attenuation_db = 0.0
        final_temp = temp_dir / "final.wav"
        if max_volume is not None and max_volume > -1.0:
            attenuation_db = round(-1.25 - max_volume, 3)
            run_checked(
                [
                    ffmpeg,
                    "-y",
                    "-loglevel",
                    "error",
                    "-i",
                    str(initial),
                    "-filter:a",
                    f"volume={attenuation_db:.3f}dB",
                    "-ar",
                    "24000",
                    "-ac",
                    "1",
                    "-c:a",
                    "pcm_s16le",
                    str(final_temp),
                ]
            )
        else:
            shutil.copyfile(initial, final_temp)

        temporary_destination = destination.with_suffix(".tmp.wav")
        if temporary_destination.exists():
            temporary_destination.unlink()
        shutil.copyfile(final_temp, temporary_destination)
        temporary_destination.replace(destination)
        return {
            "initialVolume": initial_volume,
            "globalAttenuationDb": attenuation_db,
            "finalVolume": volume_stats(ffmpeg, destination),
        }


def relative_path(path):
    try:
        return str(path.resolve().relative_to(Path.cwd().resolve()))
    except ValueError:
        return str(path.resolve())


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def average(values):
    finite = [value for value in values if value is not None and math.isfinite(value)]
    return round(statistics.fmean(finite), 2) if finite else None


def write_aggregate_report(output_dir, plan, preflight, full_plan_estimate, state):
    item_reports = []
    for path in sorted(output_dir.glob("No??-report.json")):
        item_reports.append(json.loads(path.read_text(encoding="utf-8")))

    provider_means = {"openai": [], "edge": []}
    voice_means = {}
    total_duration = 0.0
    for report in item_reports:
        metadata = report.get("outputMetadata", {})
        total_duration += float(metadata.get("duration", 0) or 0)
        for segment in report.get("segments", []):
            mean_db = segment.get("effectiveVolume", segment.get("volume", {})).get(
                "meanVolumeDb"
            )
            provider_means.setdefault(segment["provider"], []).append(mean_db)
            voice_means.setdefault(segment["voice"], []).append(mean_db)

    aggregate = {
        "setKey": plan["setKey"],
        "label": plan["label"],
        "part": plan["part"],
        "model": plan["model"],
        "openaiSpeed": plan["openaiSpeed"],
        "edgeRate": plan["edgeRate"],
        "normalGapMs": plan["normalGapMs"],
        "questionGapMs": plan["questionGapMs"],
        "pairBlocks": plan["pairBlocks"],
        "safetyLimits": plan["limits"],
        "fullProductionEstimate": full_plan_estimate,
        "latestRunPreflight": preflight,
        "latestRunApiCalls": state["apiCalls"],
        "latestRunEdgeCalls": state["edgeCalls"],
        "completedItems": [report["item"] for report in item_reports],
        "completedItemCount": len(item_reports),
        "totalDurationSeconds": round(total_duration, 3),
        "averageSegmentMeanVolumeDbByProvider": {
            provider: average(values) for provider, values in provider_means.items()
        },
        "averageSegmentMeanVolumeDbByVoice": {
            voice: average(values) for voice, values in sorted(voice_means.items())
        },
        "items": [
            {
                "item": report["item"],
                "output": report["output"],
                "duration": report.get("outputMetadata", {}).get("duration"),
                "finalVolume": report.get("finalVolume"),
                "globalAttenuationDb": report.get("globalAttenuationDb", 0.0),
            }
            for report in item_reports
        ],
    }
    write_json(output_dir / "generation-report.json", aggregate)
    return aggregate


def main():
    args = parse_args()
    selected_numbers = parse_number_selection(args.numbers)
    plan = json.loads(args.plan.read_text(encoding="utf-8"))
    questions = load_source_questions(args.source_js, plan["setKey"])
    items = prepare_items(questions, plan)
    full_plan_estimate = estimate_full_plan(items, plan)
    preflight = estimate(items, selected_numbers, args.output_dir, plan)
    validate_limits(plan, preflight)

    resolved = {
        "source": relative_path(args.source_js),
        "setKey": plan["setKey"],
        "label": plan["label"],
        "part": plan["part"],
        "model": plan["model"],
        "openaiSpeed": plan["openaiSpeed"],
        "edgeRate": plan["edgeRate"],
        "normalGapMs": plan["normalGapMs"],
        "questionGapMs": plan["questionGapMs"],
        "pairBlocks": plan["pairBlocks"],
        "items": items,
    }
    summary = {
        "mode": "execute" if args.execute else "dry-run",
        "selectedNumbers": sorted(selected_numbers),
        "fullProductionEstimate": full_plan_estimate,
        "preflight": preflight,
        "limits": plan["limits"],
        "pairs": [
            {
                "range": f"{block['start']}-{block['end']}",
                "A": f"{block['A']['provider']}:{block['A']['voice']} ({block['A']['gender']})",
                "B": f"{block['B']['provider']}:{block['B']['voice']} ({block['B']['gender']})",
            }
            for block in plan["pairBlocks"]
        ],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    if not args.execute:
        print("DRY RUN ONLY: API and Edge TTS were not called; no charge was incurred.")
        return

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")
    if not shutil.which("edge-tts"):
        raise RuntimeError("edge-tts command is required")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    write_json(args.output_dir / "resolved-manifest.json", resolved)
    state = {"apiCalls": 0, "edgeCalls": 0}

    for item in items:
        if item["number"] not in selected_numbers:
            continue
        destination = args.output_dir / f"{item['id']}.wav"
        report_path = args.output_dir / f"{item['id']}-report.json"
        if destination.exists() and not args.force:
            raise RuntimeError(f"Output already exists: {destination}")

        item_api_start = state["apiCalls"]
        item_edge_start = state["edgeCalls"]
        records = []
        for index, segment in enumerate(item["segments"], start=1):
            path = segment_cache_path(args.output_dir, plan, segment)
            cached = valid_wav(path)
            if not cached:
                if segment["provider"] == "openai":
                    generate_openai_segment(api_key, plan, segment, path, state)
                else:
                    generate_edge_segment(plan, segment, path, ffmpeg, state)
            if not valid_wav(path):
                raise RuntimeError(f"Invalid cached segment after generation: {path}")
            raw_volume = volume_stats(ffmpeg, path)
            gain_db = float(segment["gainDb"])
            effective_volume = {
                "meanVolumeDb": (
                    round(raw_volume["meanVolumeDb"] + gain_db, 2)
                    if raw_volume["meanVolumeDb"] is not None
                    else None
                ),
                "maxVolumeDb": (
                    round(raw_volume["maxVolumeDb"] + gain_db, 2)
                    if raw_volume["maxVolumeDb"] is not None
                    else None
                ),
            }
            records.append(
                {
                    **segment,
                    "index": index,
                    "path": path,
                    "cached": cached,
                    "metadata": probe_audio(ffprobe, path),
                    "volume": raw_volume,
                    "effectiveVolume": effective_volume,
                }
            )

        combination = combine_item(ffmpeg, records, destination)
        output_metadata = probe_audio(ffprobe, destination)
        if output_metadata.get("codec_name") != "pcm_s16le":
            raise RuntimeError(f"Unexpected output codec for {item['id']}")
        if output_metadata.get("sample_rate") != "24000":
            raise RuntimeError(f"Unexpected sample rate for {item['id']}")
        if int(output_metadata.get("channels", 0)) != 1:
            raise RuntimeError(f"Unexpected channel count for {item['id']}")
        final_peak = combination["finalVolume"]["maxVolumeDb"]
        if final_peak is None or final_peak > -1.0:
            raise RuntimeError(f"Unsafe final peak for {item['id']}: {final_peak}")

        item_report = {
            "item": item["id"],
            "number": item["number"],
            "sourceScript": item["displayScript"],
            "questionText": item["questionText"],
            "voices": item["voices"],
            "output": relative_path(destination),
            "outputBytes": destination.stat().st_size,
            "outputMetadata": output_metadata,
            "openaiSegments": sum(
                1 for segment in item["segments"] if segment["provider"] == "openai"
            ),
            "edgeSegments": sum(
                1 for segment in item["segments"] if segment["provider"] == "edge"
            ),
            "openaiApiCallsThisRun": state["apiCalls"] - item_api_start,
            "edgeCallsThisRun": state["edgeCalls"] - item_edge_start,
            "initialVolume": combination["initialVolume"],
            "globalAttenuationDb": combination["globalAttenuationDb"],
            "finalVolume": combination["finalVolume"],
            "segments": [
                {
                    **{key: value for key, value in record.items() if key != "path"},
                    "path": relative_path(record["path"]),
                }
                for record in records
            ],
        }
        write_json(report_path, item_report)
        print(
            f"generated {item['id']} | API {item_report['openaiApiCallsThisRun']} | "
            f"Edge {item_report['edgeCallsThisRun']} | {output_metadata.get('duration')} sec",
            flush=True,
        )

    aggregate = write_aggregate_report(
        args.output_dir, plan, preflight, full_plan_estimate, state
    )
    print(
        json.dumps(
            {
                "completedItemCount": aggregate["completedItemCount"],
                "completedItems": aggregate["completedItems"],
                "latestRunApiCalls": aggregate["latestRunApiCalls"],
                "latestRunEdgeCalls": aggregate["latestRunEdgeCalls"],
                "totalDurationSeconds": aggregate["totalDurationSeconds"],
                "generationReport": relative_path(args.output_dir / "generation-report.json"),
            },
            ensure_ascii=False,
            indent=2,
        ),
        flush=True,
    )


if __name__ == "__main__":
    main()
