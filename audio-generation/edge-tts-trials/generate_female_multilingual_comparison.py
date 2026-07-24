import argparse
import asyncio
import hashlib
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.generate_edge_listening_audio import (
    concat_pcm_audio,
    decode_segment_to_pcm,
    ffprobe_audio,
    load_manifest,
    resolve_item_plan,
    write_edge_audio,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="英語のみの本文で、共通発話を再利用した声の比較音源を生成します。"
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("audio-generation/edge-female-multilingual-english-only-test.json"),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("audio-generation/edge-tts-trials/female-multilingual-english-only"),
    )
    parser.add_argument("--rate", default="+0%")
    parser.add_argument("--volume", default="+0%")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def validate_english_only(manifest):
    if not manifest.get("englishOnly") or manifest.get("language") != "en-US":
        raise RuntimeError("Manifest must explicitly set englishOnly=true and language=en-US")
    for item in manifest["items"]:
        for segment in item.get("segments", []):
            text = str(segment.get("text", ""))
            if not text or any(ord(character) > 127 for character in text):
                raise RuntimeError(
                    f"Non-English characters found in {item.get('id')}: {text[:60]}"
                )


def segment_key(voice, rate, volume, text):
    value = json.dumps(
        {"voice": voice, "rate": rate, "volume": volume, "text": text},
        sort_keys=True,
        ensure_ascii=True,
    )
    return hashlib.sha256(value.encode("ascii")).hexdigest()[:16]


def safe_voice_name(voice):
    return re.sub(r"[^A-Za-z0-9_-]+", "-", voice)


async def main_async(args):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg or not shutil.which("ffprobe"):
        raise RuntimeError("ffmpeg and ffprobe are required")

    manifest = load_manifest(args.manifest)
    validate_english_only(manifest)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    segment_dir = args.output_dir / "segments"
    segment_dir.mkdir(parents=True, exist_ok=True)

    manifest_voices = manifest.get("voices") or {}
    manifest_rates = manifest.get("rates") or {}
    voice_pair_plan = manifest.get("voicePairPlan") or []
    default_gap_ms = int(manifest.get("gapMs", 180))
    generated_keys = set()
    report = []

    for item in manifest["items"]:
        item_id = str(item["id"])
        plan = resolve_item_plan(item, manifest_voices, manifest_rates, voice_pair_plan)
        sources = []
        segment_records = []

        for index, segment in enumerate(item["segments"], start=1):
            speaker = str(segment["speaker"])
            text = str(segment["text"])
            voice = plan["voices"][speaker]
            rate = str(segment.get("rate") or plan["rates"].get(speaker) or args.rate)
            key = segment_key(voice, rate, args.volume, text)
            segment_path = segment_dir / f"{safe_voice_name(voice)}-{key}.wav"
            was_generated = False

            if not segment_path.exists():
                with tempfile.TemporaryDirectory(prefix="edge-voice-compare-") as temp_dir_text:
                    mp3_path = Path(temp_dir_text) / "segment.mp3"
                    await write_edge_audio(text, voice, rate, args.volume, mp3_path)
                    decode_segment_to_pcm(ffmpeg, mp3_path, segment_path)
                was_generated = True
                generated_keys.add(key)

            gap_after_ms = max(0, int(segment.get("gapAfterMs", default_gap_ms)))
            sources.append((segment_path, gap_after_ms))
            segment_records.append(
                {
                    "index": index,
                    "speaker": speaker,
                    "voice": voice,
                    "rate": rate,
                    "text": text,
                    "gapAfterMs": gap_after_ms,
                    "path": str(segment_path),
                    "generatedThisRun": was_generated,
                }
            )

        destination = args.output_dir / f"{item_id}.wav"
        if destination.exists() and not args.force:
            raise RuntimeError(f"Output already exists: {destination}")
        concat_pcm_audio(ffmpeg, sources, destination)
        report.append(
            {
                "id": item_id,
                "path": str(destination),
                "bytes": destination.stat().st_size,
                "metadata": ffprobe_audio(destination),
                "segments": segment_records,
            }
        )
        print(f"generated {item_id} -> {destination}", flush=True)

    summary = {
        "language": manifest["language"],
        "englishOnly": manifest["englishOnly"],
        "edgeCallsThisRun": len(generated_keys),
        "uniqueSegmentsGeneratedThisRun": len(generated_keys),
        "items": report,
    }
    report_path = args.output_dir / "generation-report.json"
    report_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"report {report_path}", flush=True)


def main():
    args = parse_args()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
