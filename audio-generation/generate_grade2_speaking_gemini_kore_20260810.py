import argparse
import base64
import hashlib
import json
import os
import time
import wave
from array import array
from datetime import datetime, timezone
from pathlib import Path

from google import genai
from google.genai import types


ROOT = Path(__file__).resolve().parent.parent
MODEL = "gemini-3.1-flash-tts-preview"
VOICE = "Kore"
SAMPLE_RATE = 24_000
CHANNELS = 1
SAMPLE_WIDTH = 2
TRIM_THRESHOLD = 120
TRIM_PADDING_MS = 40
DEFAULT_OUTPUT_DIR = (
    ROOT / "audio-generation" / "grade2-speaking-gemini-kore-20260810-v3"
)
RETRYABLE_MARKERS = (
    "429",
    "500",
    "503",
    "RESOURCE_EXHAUSTED",
    "INTERNAL",
    "UNAVAILABLE",
)


COMMON_ENGLISH = {
    "sound-check": "This is a sound check. Please adjust the volume to a comfortable level.",
    "warmup-2": "What do you enjoy doing on weekends?",
    "silent-reading": "Please read the passage silently for twenty seconds.",
    "read-aloud": "Now, please read the passage aloud.",
    "no-2-preparation": (
        "Now, please look at the picture and describe the situation. "
        "You have twenty seconds to prepare. "
        "Your story should begin with the sentence on the card."
    ),
    "no-2": "Please begin.",
    "turn-card": "Please turn over the card and put it down.",
    "why": "Why?",
    "why-not": "Why not?",
}

SET_ENGLISH = {
    "sample": {
        "warmup-1": "What kind of books do you like to read?",
        "no-1": (
            "According to the passage, how can residents finish repairs "
            "without buying new tools?"
        ),
        "no-3": (
            "Now, No. 3. Some people say that more libraries should lend "
            "useful items besides books. What do you think about that?"
        ),
        "no-4": (
            "Now, No. 4. Do you think children should help with simple "
            "repairs at home?"
        ),
    },
    "set-01": {
        "warmup-1": "Where do you usually go shopping?",
        "no-1": (
            "According to the passage, how can customers buy daily products "
            "without using new plastic containers?"
        ),
        "no-3": (
            "Now, No. 3. Some people say that more stores should offer refill "
            "stations. What do you think about that?"
        ),
        "no-4": (
            "Now, No. 4. Do you think people should bring their own bags when "
            "they go shopping?"
        ),
    },
    "set-02": {
        "warmup-1": "When did you last visit a museum?",
        "no-1": (
            "According to the passage, how can visitors enter museums without "
            "standing in long ticket lines?"
        ),
        "no-3": (
            "Now, No. 3. Some people say that museums should use more digital "
            "services. What do you think about that?"
        ),
        "no-4": (
            "Now, No. 4. Do you think students should visit museums more often?"
        ),
    },
    "set-03": {
        "warmup-1": "Who usually buys groceries in your family?",
        "no-1": (
            "According to the passage, why do supermarkets provide simple "
            "guides and telephone support?"
        ),
        "no-3": (
            "Now, No. 3. Some people say that supermarkets should provide more "
            "support for older customers who shop online. What do you think "
            "about that?"
        ),
        "no-4": (
            "Now, No. 4. Do you think families should eat dinner together more "
            "often?"
        ),
    },
}

JAPANESE_INSTRUCTIONS = {
    "listening-part1-ja": (
        "これからリスニングテスト第1部を始めます。対話を聞き、最後の質問に対する"
        "答えとして最も適切なものを一つ選んでください。音声は一度だけ流れます。"
        "それでは始めます。"
    ),
    "listening-part2-ja": (
        "これから第2部を始めます。英文と、その内容についての質問を聞き、最も適切な"
        "答えを一つ選んでください。音声は一度だけ流れます。それでは始めます。"
    ),
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate Grade 2 speaking examiner and listening instruction WAVs with Gemini Kore."
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--delay-seconds", type=float, default=0.5)
    parser.add_argument("--max-attempts", type=int, default=4)
    return parser.parse_args()


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def build_items():
    items = []
    for key, transcript in COMMON_ENGLISH.items():
        items.append(
            {
                "id": f"common/{key}",
                "language": "en-US",
                "transcript": transcript,
            }
        )
    for set_key, prompts in SET_ENGLISH.items():
        for key, transcript in prompts.items():
            items.append(
                {
                    "id": f"{set_key}/{key}",
                    "language": "en-US",
                    "transcript": transcript,
                }
            )
    for key, transcript in JAPANESE_INSTRUCTIONS.items():
        items.append(
            {
                "id": f"instructions/{key}",
                "language": "ja-JP",
                "transcript": transcript,
            }
        )
    return items


def prompt_for(item):
    transcript = item["transcript"]
    if item["language"] == "ja-JP":
        return f"""以下の日本語だけを、英語試験の落ち着いた成人女性アナウンサーとして音声化してください。
指示文や境界ラベルは読まないでください。
自然で明瞭な標準日本語を使い、急がず、説明を一度で理解できる一定の速さで読んでください。
大げさな演技や不自然な強調は避けてください。
本文の語句を追加、削除、反復、言い換えせず、完全に一度だけ読んでください。

本文開始
{transcript}
本文終了"""

    pause_instruction = ""
    if item["id"].endswith("/no-3") or item["id"].endswith("/no-4"):
        pause_instruction = (
            "After the opening number announcement, pause naturally for about "
            "0.6 seconds before reading the question.\n"
        )
    return f"""Synthesize only the exact transcript below as an English speaking examination prompt.
Do not speak these instructions or the transcript boundary labels.
Use one calm adult female examiner throughout.
Use clear, natural American English suitable for Japanese high school learners.
Maintain the same steady controlled pace as an EIKEN Grade 2 Part 2 listening narrator.
Do not rush, accelerate, over-enunciate, or stretch individual words.
{pause_instruction}Use natural intonation without sounding theatrical, cheerful, or robotic.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.

TRANSCRIPT
{transcript}
END TRANSCRIPT"""


def extract_interaction_pcm(interaction):
    output_audio = interaction.output_audio
    if not output_audio or not output_audio.data:
        raise RuntimeError("Gemini returned no audio data")
    raw_data = output_audio.data
    pcm = base64.b64decode(raw_data) if isinstance(raw_data, str) else bytes(raw_data)
    mime_type = getattr(output_audio, "mime_type", None) or "audio/L16;rate=24000"
    return pcm, mime_type


def synthesize(client, prompt, max_attempts):
    for attempt in range(1, max_attempts + 1):
        try:
            interaction = client.interactions.create(
                model=MODEL,
                input=prompt,
                response_format={"type": "audio"},
                generation_config={"speech_config": [{"voice": VOICE}]},
                extra_headers={"Api-Revision": "2026-05-20"},
            )
            return extract_interaction_pcm(interaction)
        except Exception as error:
            retryable = any(marker in str(error) for marker in RETRYABLE_MARKERS)
            if not retryable or attempt == max_attempts:
                raise
            wait_seconds = min(60, 5 * (2 ** (attempt - 1)))
            print(
                f"Retryable Gemini error on attempt {attempt}/{max_attempts}; "
                f"waiting {wait_seconds}s",
                flush=True,
            )
            time.sleep(wait_seconds)
    raise RuntimeError("Gemini synthesis failed")


def trim_silence(pcm):
    samples = array("h")
    samples.frombytes(pcm)
    if not samples:
        raise RuntimeError("Gemini returned an empty PCM stream")
    voiced = [index for index, sample in enumerate(samples) if abs(sample) > TRIM_THRESHOLD]
    if not voiced:
        raise RuntimeError("Gemini returned only silence")
    padding_frames = SAMPLE_RATE * TRIM_PADDING_MS // 1000
    start = max(0, voiced[0] - padding_frames)
    end = min(len(samples), voiced[-1] + padding_frames + 1)
    return samples[start:end].tobytes(), {
        "leadingTrimMs": round(start * 1000 / SAMPLE_RATE, 3),
        "trailingTrimMs": round((len(samples) - end) * 1000 / SAMPLE_RATE, 3),
    }


def write_wav(path, pcm):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp.wav")
    with wave.open(str(temporary), "wb") as output:
        output.setnchannels(CHANNELS)
        output.setsampwidth(SAMPLE_WIDTH)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm)
    temporary.replace(path)


def inspect_wav(path):
    with wave.open(str(path), "rb") as audio:
        frames = audio.getnframes()
        result = {
            "sampleRate": audio.getframerate(),
            "channels": audio.getnchannels(),
            "sampleWidth": audio.getsampwidth(),
            "frames": frames,
            "durationSeconds": round(frames / audio.getframerate(), 3),
        }
    if result["sampleRate"] != SAMPLE_RATE or result["channels"] != CHANNELS or result["sampleWidth"] != SAMPLE_WIDTH:
        raise RuntimeError(f"Unexpected WAV format: {path} {result}")
    return result


def main():
    args = parse_args()
    if not os.environ.get("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY is not available to this process")
    if args.output_dir.exists():
        raise RuntimeError(f"Output directory already exists; refusing to overwrite: {args.output_dir}")
    if args.delay_seconds < 0:
        raise ValueError("--delay-seconds must be zero or greater")
    if args.max_attempts < 1:
        raise ValueError("--max-attempts must be at least 1")

    items = build_items()
    if len(items) != 27 or len({item["id"] for item in items}) != 27:
        raise RuntimeError("Expected exactly 27 unique audio prompts")

    args.output_dir.mkdir(parents=True, exist_ok=False)
    client = genai.Client()
    report_items = []
    try:
        for index, item in enumerate(items):
            output_path = args.output_dir / f"{item['id']}.wav"
            prompt = prompt_for(item)
            print(f"Generating {item['id']} with {MODEL}/{VOICE}...", flush=True)
            started = time.monotonic()
            pcm_raw, source_mime_type = synthesize(client, prompt, args.max_attempts)
            pcm, trim_report = trim_silence(pcm_raw)
            write_wav(output_path, pcm)
            wav = inspect_wav(output_path)
            report_items.append(
                {
                    **item,
                    "file": str(output_path.relative_to(args.output_dir)).replace("\\", "/"),
                    "bytes": output_path.stat().st_size,
                    "sha256": hashlib.sha256(output_path.read_bytes()).hexdigest(),
                    "promptSha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
                    "sourceMimeType": source_mime_type,
                    "boundaryTrim": trim_report,
                    "generationSeconds": round(time.monotonic() - started, 3),
                    **wav,
                }
            )
            print(f"Saved {output_path} ({wav['durationSeconds']}s)", flush=True)
            if index < len(items) - 1 and args.delay_seconds:
                time.sleep(args.delay_seconds)
    except Exception:
        failure_report = {
            "schemaVersion": 1,
            "createdAt": utc_now(),
            "model": MODEL,
            "voice": VOICE,
            "state": "failed",
            "completedItems": report_items,
        }
        (args.output_dir / "generation-report.json").write_text(
            json.dumps(failure_report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        raise

    report = {
        "schemaVersion": 1,
        "createdAt": utc_now(),
        "model": MODEL,
        "voice": VOICE,
        "audioContract": {
            "sampleRate": SAMPLE_RATE,
            "channels": CHANNELS,
            "sampleWidth": SAMPLE_WIDTH,
            "postSpeedProcessing": False,
        },
        "state": "generated",
        "itemCount": len(report_items),
        "items": report_items,
    }
    (args.output_dir / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Generated {len(report_items)} files in {args.output_dir}", flush=True)


if __name__ == "__main__":
    main()
