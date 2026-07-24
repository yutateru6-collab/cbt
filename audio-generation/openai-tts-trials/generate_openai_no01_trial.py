import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path


API_URL = "https://api.openai.com/v1/audio/speech"
DEFAULT_INSTRUCTIONS = (
    "Neutral English proficiency exam recording. Clear articulation, steady pace, "
    "no dramatization, and natural pauses. Do not add, omit, or paraphrase any words."
)
PART1_NORMAL_INSTRUCTIONS = (
    "Voice: A clear, natural adult speaker using {accent}, suitable for a Japanese Eiken "
    "Grade 2 listening examination. Sound like a real person in an official language test, "
    "not a voice actor, commercial narrator, or artificial announcement.\n\n"
    "Delivery: Speak only slightly slower than ordinary conversational English, approximately "
    "five percent slower, while preserving natural rhythm, connected speech, and fluent "
    "intonation. Do not sound stretched, sleepy, robotic, or excessively slow.\n\n"
    "Pronunciation: Use clear and accurate pronunciation appropriate to {accent}. Keep "
    "contractions and connected speech natural. Do not over-pronounce every word.\n\n"
    "Punctuation and pauses: Follow punctuation carefully. Use short, natural pauses at commas "
    "and full stops. Leave a clear pause before the final question, but do not insert "
    "unnecessary pauses inside a sentence.\n\n"
    "Exam style: Maintain the neutral, clear, and realistic delivery of an official Eiken Grade "
    "2 listening recording. Use only light, natural emotion. Do not emphasize words or details "
    "in a way that reveals the answer.\n\n"
    "Accuracy: Read the supplied text exactly as written. Do not add, omit, repeat, paraphrase, "
    "correct, or explain any words.\n\n"
    "Audio quality: Produce an ultra-clean, high-resolution studio-quality voice recording with "
    "crisp intelligibility and a full, natural vocal tone. Avoid background noise, hiss, reverb, "
    "distortion, clipping, metallic texture, muffled sound, breathiness, and compression artifacts."
)
PART1_NATURAL_INSTRUCTIONS = (
    "Voice: A clear, natural adult speaker using {accent}, suitable for a Japanese Eiken "
    "Grade 2 listening examination. Sound like a real person in an official language test, "
    "not a voice actor, commercial narrator, or artificial announcement.\n\n"
    "Delivery: Speak at a natural, steady conversational pace appropriate for an official "
    "English proficiency listening test. Preserve natural rhythm, connected speech, and fluent "
    "intonation. Do not rush, drag, stretch, or over-pronounce the words.\n\n"
    "Pronunciation: Use clear and accurate pronunciation appropriate to {accent}. Keep "
    "contractions and connected speech natural. Do not over-pronounce every word.\n\n"
    "Punctuation and pauses: Follow punctuation carefully. Use short, natural pauses at commas "
    "and full stops. Leave a clear pause before the final question, but do not insert "
    "unnecessary pauses inside a sentence.\n\n"
    "Exam style: Maintain the neutral, clear, and realistic delivery of an official Eiken Grade "
    "2 listening recording. Use only light, natural emotion. Do not emphasize words or details "
    "in a way that reveals the answer.\n\n"
    "Accuracy: Read the supplied text exactly as written. Do not add, omit, repeat, paraphrase, "
    "correct, or explain any words.\n\n"
    "Audio quality: Produce an ultra-clean, high-resolution studio-quality voice recording with "
    "crisp intelligibility and a full, natural vocal tone. Avoid background noise, hiss, reverb, "
    "distortion, clipping, metallic texture, muffled sound, breathiness, and compression artifacts."
)
PART2_NORMAL_INSTRUCTIONS = (
    "Voice: A clear, calm adult narrator using {accent}, suitable for a Japanese Eiken Grade 2 "
    "listening examination. Sound like a real official test narrator, not a storyteller, actor, "
    "documentary presenter, or artificial announcement.\n\n"
    "Delivery: Speak only slightly slower than ordinary conversational English, approximately "
    "five percent slower, while preserving natural rhythm and fluent intonation. Maintain an even "
    "pace through the final sentence without sounding stretched, sleepy, robotic, or excessively slow.\n\n"
    "Pronunciation: Use clear and accurate pronunciation appropriate to {accent}. Keep connected "
    "speech natural and do not over-pronounce every word.\n\n"
    "Punctuation and pauses: Follow punctuation carefully. Use natural sentence pauses and leave a "
    "clear pause before the final question. Do not insert unnecessary pauses inside a sentence.\n\n"
    "Exam style: Maintain the neutral, objective, and informative delivery of an official Eiken Grade "
    "2 listening recording. Do not dramatize the passage or emphasize details that reveal the answer.\n\n"
    "Accuracy: Read the supplied text exactly as written. Do not add, omit, repeat, paraphrase, "
    "correct, or explain any words.\n\n"
    "Audio quality: Produce an ultra-clean, high-resolution studio-quality voice recording with "
    "crisp intelligibility and a full, natural vocal tone. Avoid background noise, hiss, reverb, "
    "distortion, clipping, metallic texture, muffled sound, breathiness, and compression artifacts."
)
MAX_TOTAL_CHARACTERS = 2_000
CONSERVATIVE_AUDIO_COST_USD_PER_MINUTE = 0.03
CHARACTER_PRICES_USD_PER_MILLION = {
    "tts-1": 15.0,
    "tts-1-hd": 30.0,
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="OpenAI TTSで2級サンプルの指定問題だけを安全に試作します。"
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("audio-generation/grade2-sample-part1-full.json"),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("audio-generation/openai-tts-trials/no01-marin-cedar-0p9"),
    )
    parser.add_argument("--item-id", default="No01")
    parser.add_argument("--model", default="gpt-4o-mini-tts")
    parser.add_argument("--speaker-a", default="marin")
    parser.add_argument("--speaker-b", default="cedar")
    parser.add_argument("--speaker-n", default="marin")
    parser.add_argument(
        "--instructions-profile",
        choices=("default", "part1-normal", "part1-natural", "part2-normal", "none"),
        default="default",
    )
    parser.add_argument(
        "--accent",
        choices=("American English", "British English", "neutral English"),
        default="neutral English",
    )
    parser.add_argument("--speed", type=float, default=0.9)
    parser.add_argument("--max-api-calls", type=int, default=6)
    parser.add_argument("--max-retries-per-segment", type=int, default=1)
    parser.add_argument("--estimated-cost-cap-usd", type=float, default=0.10)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def load_item(manifest_path, item_id):
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    item = next((value for value in manifest.get("items", []) if value.get("id") == item_id), None)
    if not item:
        raise RuntimeError(f"{item_id} was not found in the manifest")
    segments = item.get("segments")
    if not isinstance(segments, list) or not segments:
        raise RuntimeError(f"{item_id} has no synthesis segments")
    return manifest, item


def prepare_segments(source_segments, default_gap_ms, item_number):
    prepared = [dict(segment) for segment in source_segments]
    if len(prepared) >= 2:
        number_segment = prepared[0]
        first_line = prepared[1]
        number_text = str(number_segment.get("text", "")).strip()
        if (
            number_segment.get("speaker") == first_line.get("speaker")
            and re.fullmatch(rf"Number\s+{item_number}\.", number_text)
        ):
            merged = {
                **first_line,
                "text": f"Number {item_number}... {str(first_line.get('text', '')).strip()}",
                "gapAfterMs": int(first_line.get("gapAfterMs", default_gap_ms)),
                "sourceSegmentCount": 2,
            }
            prepared = [merged, *prepared[2:]]

    for segment in prepared:
        segment["gapAfterMs"] = max(0, int(segment.get("gapAfterMs", default_gap_ms)))
    return prepared


def estimate_plan(segments, speed, model):
    total_text = " ".join(str(segment.get("text", "")).strip() for segment in segments)
    words = len(re.findall(r"\b[\w']+\b", total_text))
    characters = len(total_text)
    speech_seconds = (words / 130.0) * 60.0 / speed
    pause_seconds = sum(int(segment.get("gapAfterMs", 0)) for segment in segments[:-1]) / 1000.0
    estimated_seconds = speech_seconds + pause_seconds
    character_price = CHARACTER_PRICES_USD_PER_MILLION.get(model)
    if character_price is not None:
        estimated_cost = (characters / 1_000_000.0) * character_price
        cost_basis = f"{character_price:g} USD per 1M input characters"
    else:
        estimated_cost = (estimated_seconds / 60.0) * CONSERVATIVE_AUDIO_COST_USD_PER_MINUTE
        cost_basis = "conservative duration estimate"
    return {
        "characters": characters,
        "words": words,
        "estimatedDurationSeconds": round(estimated_seconds, 2),
        "estimatedCostUsd": round(estimated_cost, 4),
        "costBasis": cost_basis,
    }


def cache_key(model, voice, speed, instructions, text):
    value = json.dumps(
        {
            "model": model,
            "voice": voice,
            "speed": speed,
            "instructions": instructions,
            "text": text,
        },
        sort_keys=True,
        ensure_ascii=False,
    )
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:20]


def validate_wav(path):
    if not path.exists() or path.stat().st_size < 44:
        return False
    with path.open("rb") as handle:
        return handle.read(4) == b"RIFF"


def request_speech(api_key, payload, output_path, call_state, max_calls, max_retries):
    last_error = None
    for attempt in range(max_retries + 1):
        if call_state["count"] >= max_calls:
            raise RuntimeError(f"API call limit reached ({max_calls})")
        call_state["count"] += 1
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
                raise RuntimeError("The API response was not a valid WAV file")
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(
                prefix=f"{output_path.stem}-", suffix=".tmp.wav", dir=output_path.parent, delete=False
            ) as temporary:
                temporary.write(audio)
                temporary_path = Path(temporary.name)
            temporary_path.replace(output_path)
            return
        except urllib.error.HTTPError as error:
            body = error.read(2_000).decode("utf-8", errors="replace")
            last_error = RuntimeError(f"OpenAI API HTTP {error.code}: {body}")
            if error.code not in {429, 500, 502, 503, 504}:
                break
        except (urllib.error.URLError, TimeoutError, RuntimeError) as error:
            last_error = error
        if attempt < max_retries:
            time.sleep(1.0)
    raise RuntimeError(f"Speech generation failed: {last_error}")


def run_checked(command):
    subprocess.run(command, check=True, capture_output=True, text=True, encoding="utf-8")


def combine_wav_segments(ffmpeg, segment_records, destination, item_id):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f"openai-{item_id.lower()}-", dir=destination.parent) as temp_text:
        temp_dir = Path(temp_text)
        ordered_paths = []
        silence_cache = {}

        for index, record in enumerate(segment_records, start=1):
            normalized_path = temp_dir / f"segment-{index:02d}.wav"
            run_checked(
                [
                    ffmpeg,
                    "-y",
                    "-loglevel",
                    "error",
                    "-i",
                    str(record["path"]),
                    "-ar",
                    "24000",
                    "-ac",
                    "1",
                    "-c:a",
                    "pcm_s16le",
                    str(normalized_path),
                ]
            )
            ordered_paths.append(normalized_path)

            gap_ms = int(record["gapAfterMs"])
            if index < len(segment_records) and gap_ms > 0:
                silence_path = silence_cache.get(gap_ms)
                if silence_path is None:
                    silence_path = temp_dir / f"silence-{gap_ms}.wav"
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
                            f"{gap_ms / 1000.0:.3f}",
                            "-ar",
                            "24000",
                            "-ac",
                            "1",
                            "-c:a",
                            "pcm_s16le",
                            str(silence_path),
                        ]
                    )
                    silence_cache[gap_ms] = silence_path
                ordered_paths.append(silence_path)

        concat_file = temp_dir / "concat.txt"
        concat_lines = []
        for path in ordered_paths:
            escaped = str(path.resolve()).replace("'", "'\\''")
            concat_lines.append(f"file '{escaped}'")
        concat_file.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")

        combined_path = temp_dir / f"{item_id}-combined.wav"
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
                str(combined_path),
            ]
        )
        shutil.copyfile(combined_path, destination)


def probe_audio(ffprobe, path):
    completed = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=sample_rate,channels,duration,codec_name",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    streams = json.loads(completed.stdout).get("streams") or []
    return streams[0] if streams else {}


def main():
    args = parse_args()
    if not 0.25 <= args.speed <= 4.0:
        raise RuntimeError("speed must be between 0.25 and 4.0")
    if args.max_api_calls < 1 or args.max_api_calls > 12:
        raise RuntimeError("max-api-calls must be between 1 and 12 for this trial")
    if args.max_retries_per_segment not in {0, 1}:
        raise RuntimeError("max-retries-per-segment must be 0 or 1")

    manifest, item = load_item(args.manifest, args.item_id)
    default_gap_ms = int(manifest.get("gapMs", 180))
    item_number = int(item.get("number", re.sub(r"\D", "", args.item_id)))
    segments = prepare_segments(item["segments"], default_gap_ms, item_number)
    voices = {"A": args.speaker_a, "B": args.speaker_b, "N": args.speaker_n}
    for segment in segments:
        if segment.get("speaker") not in voices:
            raise RuntimeError(f"Unsupported speaker: {segment.get('speaker')}")
    estimate = estimate_plan(segments, args.speed, args.model)
    if args.model in {"tts-1", "tts-1-hd"} or args.instructions_profile == "none":
        instructions = None
    elif args.instructions_profile == "part1-normal":
        instructions = PART1_NORMAL_INSTRUCTIONS.format(accent=args.accent)
    elif args.instructions_profile == "part1-natural":
        instructions = PART1_NATURAL_INSTRUCTIONS.format(accent=args.accent)
    elif args.instructions_profile == "part2-normal":
        instructions = PART2_NORMAL_INSTRUCTIONS.format(accent=args.accent)
    else:
        instructions = DEFAULT_INSTRUCTIONS

    if len(segments) > args.max_api_calls:
        raise RuntimeError("The base segment count exceeds max-api-calls")
    if estimate["characters"] > MAX_TOTAL_CHARACTERS:
        raise RuntimeError("The trial text is larger than the fixed character limit")
    if estimate["estimatedCostUsd"] > args.estimated_cost_cap_usd:
        raise RuntimeError("The conservative estimated cost exceeds the configured cap")

    plan = {
        "mode": "execute" if args.execute else "dry-run",
        "item": args.item_id,
        "model": args.model,
        "voices": voices,
        "speed": args.speed,
        "responseFormat": "wav",
        "sourceSegments": len(item["segments"]),
        "synthesisSegments": len(segments),
        "maxApiCalls": args.max_api_calls,
        "maxRetriesPerSegment": args.max_retries_per_segment,
        "estimatedCostCapUsd": args.estimated_cost_cap_usd,
        "instructionsProfile": args.instructions_profile,
        "accent": args.accent,
        "instructions": instructions,
        "estimate": estimate,
        "output": str(args.output_dir / f"{args.item_id}.wav"),
        "segments": [
            {
                "speaker": segment["speaker"],
                "voice": voices[segment["speaker"]],
                "text": segment["text"],
                "gapAfterMs": segment["gapAfterMs"],
            }
            for segment in segments
        ],
    }
    print(json.dumps(plan, ensure_ascii=False, indent=2))
    if not args.execute:
        print("DRY RUN ONLY: no API request was sent and no charge was incurred.")
        return

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")

    destination = args.output_dir / f"{args.item_id}.wav"
    report_path = args.output_dir / f"{args.item_id}-report.json"
    if destination.exists() and not args.force:
        raise RuntimeError(f"Output already exists: {destination}. Use --force only after review.")

    segment_dir = args.output_dir / "segments"
    call_state = {"count": 0}
    segment_records = []
    cached_count = 0

    for index, segment in enumerate(segments, start=1):
        speaker = str(segment["speaker"])
        voice = voices[speaker]
        text = str(segment["text"])
        key = cache_key(args.model, voice, args.speed, instructions, text)
        segment_path = segment_dir / f"{index:02d}-{speaker}-{voice}-{key}.wav"
        cached = validate_wav(segment_path)
        if cached:
            cached_count += 1
        else:
            payload = {
                "model": args.model,
                "voice": voice,
                "input": text,
                "speed": args.speed,
                "response_format": "wav",
            }
            if instructions:
                payload["instructions"] = instructions
            request_speech(
                api_key,
                payload,
                segment_path,
                call_state,
                args.max_api_calls,
                args.max_retries_per_segment,
            )
        segment_records.append(
            {
                "speaker": speaker,
                "voice": voice,
                "text": text,
                "gapAfterMs": int(segment["gapAfterMs"]),
                "path": segment_path,
                "cached": cached,
            }
        )

    combine_wav_segments(ffmpeg, segment_records, destination, args.item_id)
    metadata = probe_audio(ffprobe, destination)
    report = {
        **plan,
        "mode": "completed",
        "apiCalls": call_state["count"],
        "cachedSegments": cached_count,
        "outputBytes": destination.stat().st_size,
        "outputMetadata": metadata,
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
