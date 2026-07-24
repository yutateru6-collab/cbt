import argparse
import hashlib
import json
import os
import time
import wave
from array import array
from pathlib import Path

from google import genai
from google.genai import types


MODEL = "gemini-3.1-flash-tts-preview"
SAMPLE_RATE = 24_000
CHANNELS = 1
SAMPLE_WIDTH = 2
VOICE_A = "Aoede"
VOICE_B = "Charon"
VOICE_N = "Charon"
TRIM_THRESHOLD = 120
TRIM_PADDING_MS = 40
LONG_SILENCE_THRESHOLD = 184
LONG_SILENCE_MINIMUM_MS = 800
LONG_SILENCE_KEEP_MS = 550
BOUNDARY_SILENCE_KEEP_MS = 50
DAILY_FREE_TIER_QUOTA_ID = "GenerateRequestsPerDayPerProjectPerModel-FreeTier"
RETRYABLE_MARKERS = (
    "429",
    "500",
    "503",
    "RESOURCE_EXHAUSTED",
    "INTERNAL",
    "UNAVAILABLE",
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate separate Gemini 3.1 Flash TTS comparison WAV files."
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("audio-generation/grade2-sample-part1-full.json"),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(
            "audio-generation/grade2-sample-part1-"
            "gemini-3.1-flash-tts-preview-output"
        ),
    )
    parser.add_argument("--numbers", default="1-5")
    parser.add_argument(
        "--assembly",
        choices=("whole-item", "segmented"),
        default="whole-item",
        help="whole-item uses one request per question and fits the free daily quota",
    )
    parser.add_argument("--delay-seconds", type=float, default=15.0)
    parser.add_argument("--max-attempts", type=int, default=5)
    return parser.parse_args()


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
                raise ValueError(f"Invalid number range: {part}")
            selected.update(range(start, end + 1))
        else:
            selected.add(int(part))
    if not selected:
        raise ValueError("At least one question number is required")
    return selected


def load_items(path, selected_numbers):
    manifest = json.loads(path.read_text(encoding="utf-8"))
    items = [
        item
        for item in manifest.get("items", [])
        if int(item.get("number", 0)) in selected_numbers
    ]
    found = {int(item["number"]) for item in items}
    missing = sorted(selected_numbers - found)
    if missing:
        raise RuntimeError(f"Questions were not found in the manifest: {missing}")

    for item in items:
        segments = item.get("segments")
        if not isinstance(segments, list) or not segments:
            raise RuntimeError(f"{item.get('id')} has no segments")
        speakers = {segment.get("speaker") for segment in segments}
        if speakers not in ({"A", "B"}, {"N"}):
            raise RuntimeError(
                f"{item.get('id')} must use speakers A and B, or single speaker N"
            )
        for segment in segments:
            if not str(segment.get("text", "")).strip():
                raise RuntimeError(f"{item.get('id')} contains an empty segment")
    return sorted(items, key=lambda item: int(item["number"]))


def build_single_speaker_prompt(text):
    return f"""Synthesize the exact transcript below as audio for an English listening examination.
Do not speak these instructions or the transcript boundary labels.
Use clear, natural American English suitable for Japanese high school learners.
Use a neutral listening-test announcer delivery with natural intonation.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.

TRANSCRIPT
{text}
END TRANSCRIPT"""


def build_dialogue_prompt(segments):
    transcript = "\n".join(
        f"{segment['speaker']}: {segment['text']}" for segment in segments
    )
    return f"""Synthesize the exact dialogue below as audio for an English listening examination.
Do not speak these instructions, the speaker labels, or the transcript boundary labels.
Speaker A is an adult woman. Speaker B is an adult man.
Use clear, natural American English suitable for Japanese high school learners.
Keep the dialogue responsive and realistic, with brief natural turn transitions.
Use natural intonation without sounding theatrical or robotic.
Do not emphasize any detail in a way that reveals the answer.
Read every dialogue word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.

TRANSCRIPT
{transcript}
END TRANSCRIPT"""


def build_whole_item_prompt(segments):
    transcript = "\n".join(
        f"{segment['speaker']}: {segment['text']}" for segment in segments
    )
    return f"""Synthesize the exact transcript below as audio for an English listening examination.
Do not speak these instructions, the speaker labels, or the transcript boundary labels.
Speaker A is an adult woman. Speaker B is an adult man.
Use clear, natural American English suitable for Japanese high school learners.
Keep the dialogue responsive and realistic, with brief natural turn transitions.
Maintain a steady, moderate pace from beginning to end. Do not rush or accelerate.
Pause for about 1.15 seconds after the Number line and about 1.1 seconds before the Question line.
Keep all other dialogue turn transitions brief and natural.
Use natural intonation without sounding theatrical or robotic.
Do not emphasize any detail in a way that reveals the answer.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.

TRANSCRIPT
{transcript}
END TRANSCRIPT"""


def build_whole_narration_prompt(segments):
    transcript = "\n".join(segment["text"] for segment in segments)
    return f"""Synthesize the exact transcript below as audio for an English listening examination.
Do not speak these instructions or the transcript boundary labels.
Use one adult male narrator throughout.
Use clear, natural American English suitable for Japanese high school learners.
Use a neutral listening-test delivery with natural intonation.
Maintain a steady, moderate pace from beginning to end. Do not rush or accelerate.
Pause for about 1.15 seconds after the Number line and about 1.1 seconds before the Question line.
Do not emphasize any detail in a way that reveals the answer.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.

TRANSCRIPT
{transcript}
END TRANSCRIPT"""


def extract_pcm(response):
    candidates = response.candidates or []
    for candidate in candidates:
        content = candidate.content
        for part in (content.parts if content else []) or []:
            inline_data = part.inline_data
            if inline_data and inline_data.data:
                return bytes(inline_data.data), inline_data.mime_type
    raise RuntimeError("Gemini returned no audio data")


def single_speaker_config(voice_name):
    return types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name=voice_name
                )
            )
        ),
    )


def dialogue_config():
    return types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                speaker_voice_configs=[
                    types.SpeakerVoiceConfig(
                        speaker="A",
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=VOICE_A
                            )
                        ),
                    ),
                    types.SpeakerVoiceConfig(
                        speaker="B",
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=VOICE_B
                            )
                        ),
                    ),
                ]
            )
        ),
    )


def synthesize(client, prompt, config, max_attempts):
    for attempt in range(1, max_attempts + 1):
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=config,
            )
            return extract_pcm(response)
        except Exception as error:
            message = str(error)
            if DAILY_FREE_TIER_QUOTA_ID in message:
                raise RuntimeError(
                    "Gemini free-tier daily request limit was reached; try again after "
                    "the quota resets or choose fewer question numbers"
                ) from error
            retryable = any(marker in message for marker in RETRYABLE_MARKERS)
            if not retryable or attempt == max_attempts:
                raise
            wait_seconds = min(60, 10 * (2 ** (attempt - 1)))
            print(
                f"Retryable Gemini error on attempt {attempt}/{max_attempts}; "
                f"waiting {wait_seconds}s",
                flush=True,
            )
            time.sleep(wait_seconds)
    raise RuntimeError("Gemini synthesis failed")


def write_wav(path, pcm):
    temporary_path = path.with_suffix(".tmp.wav")
    with wave.open(str(temporary_path), "wb") as output:
        output.setnchannels(CHANNELS)
        output.setsampwidth(SAMPLE_WIDTH)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm)
    temporary_path.replace(path)


def trim_silence(pcm):
    samples = array("h")
    samples.frombytes(pcm)
    if not samples:
        raise RuntimeError("Gemini returned an empty PCM stream")
    first = next(
        (index for index, sample in enumerate(samples) if abs(sample) > TRIM_THRESHOLD),
        None,
    )
    if first is None:
        raise RuntimeError("Gemini returned only silence")
    last = next(
        index
        for index in range(len(samples) - 1, -1, -1)
        if abs(samples[index]) > TRIM_THRESHOLD
    )
    padding_frames = SAMPLE_RATE * TRIM_PADDING_MS // 1000
    start = max(0, first - padding_frames)
    end = min(len(samples), last + padding_frames + 1)
    trimmed = samples[start:end].tobytes()
    return trimmed, {
        "leadingTrimMs": round(start * 1000 / SAMPLE_RATE, 3),
        "trailingTrimMs": round((len(samples) - end) * 1000 / SAMPLE_RATE, 3),
    }


def pcm_silence(milliseconds):
    frames = SAMPLE_RATE * milliseconds // 1000
    return b"\x00" * frames * SAMPLE_WIDTH


def compress_long_silence(pcm):
    samples = array("h")
    samples.frombytes(pcm)
    if not samples:
        raise RuntimeError("Gemini returned an empty PCM stream")

    minimum_frames = SAMPLE_RATE * LONG_SILENCE_MINIMUM_MS // 1000
    internal_keep_frames = SAMPLE_RATE * LONG_SILENCE_KEEP_MS // 1000
    boundary_keep_frames = SAMPLE_RATE * BOUNDARY_SILENCE_KEEP_MS // 1000
    output = array("h")
    compressed_runs = 0
    index = 0
    while index < len(samples):
        if abs(samples[index]) > LONG_SILENCE_THRESHOLD:
            output.append(samples[index])
            index += 1
            continue
        end = index + 1
        while end < len(samples) and abs(samples[end]) <= LONG_SILENCE_THRESHOLD:
            end += 1
        run_length = end - index
        if run_length < minimum_frames:
            output.extend(samples[index:end])
        elif index == 0:
            output.extend(samples[max(index, end - boundary_keep_frames) : end])
            compressed_runs += 1
        elif end == len(samples):
            output.extend(samples[index : min(end, index + boundary_keep_frames)])
            compressed_runs += 1
        else:
            before = internal_keep_frames // 2
            after = internal_keep_frames - before
            output.extend(samples[index : index + before])
            output.extend(samples[end - after : end])
            compressed_runs += 1
        index = end

    return output.tobytes(), {
        "compressedRuns": compressed_runs,
        "beforeDurationSeconds": round(len(samples) / SAMPLE_RATE, 3),
        "afterDurationSeconds": round(len(output) / SAMPLE_RATE, 3),
        "minimumSilenceMs": LONG_SILENCE_MINIMUM_MS,
        "internalKeepMs": LONG_SILENCE_KEEP_MS,
        "boundaryKeepMs": BOUNDARY_SILENCE_KEEP_MS,
    }


def inspect_wav(path):
    with wave.open(str(path), "rb") as audio:
        frames = audio.getnframes()
        return {
            "sampleRate": audio.getframerate(),
            "channels": audio.getnchannels(),
            "sampleWidth": audio.getsampwidth(),
            "frames": frames,
            "durationSeconds": round(frames / audio.getframerate(), 3),
        }


def main():
    args = parse_args()
    if not os.environ.get("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY is not available to this process")
    if args.output_dir.exists():
        raise RuntimeError(
            f"Output directory already exists; refusing to overwrite: {args.output_dir}"
        )
    if args.delay_seconds < 0:
        raise ValueError("--delay-seconds must be zero or greater")
    if args.max_attempts < 1:
        raise ValueError("--max-attempts must be at least 1")

    selected_numbers = parse_number_selection(args.numbers)
    items = load_items(args.manifest, selected_numbers)
    args.output_dir.mkdir(parents=True, exist_ok=False)

    client = genai.Client()
    report_items = []
    requests_per_item = 1 if args.assembly == "whole-item" else 3
    total_requests = len(items) * requests_per_item
    request_number = 0

    def request_audio(prompt, config):
        nonlocal request_number
        request_number += 1
        pcm, mime_type = synthesize(client, prompt, config, args.max_attempts)
        if request_number < total_requests and args.delay_seconds:
            time.sleep(args.delay_seconds)
        return pcm, mime_type

    try:
        for item in items:
            segments = item["segments"]
            speakers = {segment["speaker"] for segment in segments}
            if len(segments) < 3:
                raise RuntimeError(f"{item['id']} needs number, body, and question segments")
            print(f"Generating {item['id']} with {MODEL}...", flush=True)
            started_at = time.monotonic()
            if args.assembly == "whole-item":
                if speakers == {"N"}:
                    prompt = build_whole_narration_prompt(segments)
                    config = single_speaker_config(VOICE_N)
                    assembly_mode = "one single-speaker request"
                else:
                    prompt = build_whole_item_prompt(segments)
                    config = dialogue_config()
                    assembly_mode = "one multi-speaker request"
                pcm_raw, item_mime = request_audio(
                    prompt,
                    config,
                )
                pcm, boundary_trim = trim_silence(pcm_raw)
                silence_processing = {
                    "mode": "preserve model-generated internal pauses",
                    "boundaryTrim": boundary_trim,
                }
                source_mime_types = {"item": item_mime}
                item_assembly = {
                    "mode": assembly_mode,
                    "silenceProcessing": silence_processing,
                }
            else:
                if speakers == {"N"}:
                    raise RuntimeError(
                        "Segmented assembly is not supported for single-speaker items"
                    )
                number_segment = segments[0]
                dialogue_segments = segments[1:-1]
                question_segment = segments[-1]
                number_gap_ms = int(number_segment.get("gapAfterMs", 0))
                question_gap_ms = int(dialogue_segments[-1].get("gapAfterMs", 0))
                voice_for = {"A": VOICE_A, "B": VOICE_B}
                number_pcm_raw, number_mime = request_audio(
                    build_single_speaker_prompt(number_segment["text"]),
                    single_speaker_config(voice_for[number_segment["speaker"]]),
                )
                dialogue_pcm_raw, dialogue_mime = request_audio(
                    build_dialogue_prompt(dialogue_segments),
                    dialogue_config(),
                )
                question_pcm_raw, question_mime = request_audio(
                    build_single_speaker_prompt(question_segment["text"]),
                    single_speaker_config(voice_for[question_segment["speaker"]]),
                )
                number_pcm, number_trim = trim_silence(number_pcm_raw)
                dialogue_pcm, dialogue_trim = trim_silence(dialogue_pcm_raw)
                question_pcm, question_trim = trim_silence(question_pcm_raw)
                pcm = b"".join(
                    [
                        number_pcm,
                        pcm_silence(number_gap_ms),
                        dialogue_pcm,
                        pcm_silence(question_gap_ms),
                        question_pcm,
                    ]
                )
                source_mime_types = {
                    "number": number_mime,
                    "dialogue": dialogue_mime,
                    "question": question_mime,
                }
                item_assembly = {
                    "mode": "three requests with exact structural gaps",
                    "numberGapMs": number_gap_ms,
                    "questionGapMs": question_gap_ms,
                    "numberTrim": number_trim,
                    "dialogueTrim": dialogue_trim,
                    "questionTrim": question_trim,
                }
            output_path = args.output_dir / f"{item['id']}.wav"
            write_wav(output_path, pcm)
            audio_info = inspect_wav(output_path)
            if (
                audio_info["sampleRate"] != SAMPLE_RATE
                or audio_info["channels"] != CHANNELS
                or audio_info["sampleWidth"] != SAMPLE_WIDTH
            ):
                raise RuntimeError(f"Unexpected WAV format: {output_path}")
            report_items.append(
                {
                    "id": item["id"],
                    "number": int(item["number"]),
                    "file": output_path.name,
                    "bytes": output_path.stat().st_size,
                    "sha256": hashlib.sha256(output_path.read_bytes()).hexdigest(),
                    "sourceMimeTypes": source_mime_types,
                    "generationSeconds": round(time.monotonic() - started_at, 3),
                    "assembly": item_assembly,
                    **audio_info,
                }
            )
            print(
                f"Saved {output_path} ({audio_info['durationSeconds']}s)",
                flush=True,
            )

        report = {
            "model": MODEL,
            "sourceManifest": str(args.manifest),
            "numbers": sorted(selected_numbers),
            "voices": {
                "A": {"voice": VOICE_A, "role": "adult woman"},
                "B": {"voice": VOICE_B, "role": "adult man"},
                "N": {"voice": VOICE_N, "role": "adult male narrator"},
            },
            "format": {
                "sampleRate": SAMPLE_RATE,
                "channels": CHANNELS,
                "sampleWidth": SAMPLE_WIDTH,
                "encoding": "PCM signed 16-bit little-endian WAV",
            },
            "assembly": {
                "mode": args.assembly,
                "requestsPerItem": requests_per_item,
                "trimThreshold": TRIM_THRESHOLD,
                "trimPaddingMs": TRIM_PADDING_MS,
                "speedProcessing": "none",
                "loudnessProcessing": "none",
            },
            "items": report_items,
        }
        report_path = args.output_dir / "generation-report.json"
        report_path.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Saved {report_path}", flush=True)
    except Exception:
        failure_path = args.output_dir / "GENERATION_FAILED.txt"
        failure_path.write_text(
            "Generation stopped before all requested files were completed.\n",
            encoding="utf-8",
        )
        raise
    finally:
        client.close()


if __name__ == "__main__":
    main()
