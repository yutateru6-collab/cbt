import argparse
import asyncio
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

import edge_tts


ITEM_PLANS = {
    "No03": {
        "report": Path(
            "audio-generation/openai-tts-trials/grade2-natural-master-speed-control-test/part1/No03-report.json"
        ),
        "providers": {"A": "openai", "B": "edge"},
        "edgeVoices": {"B": "en-GB-RyanNeural"},
    },
    "No04": {
        "report": Path(
            "audio-generation/openai-tts-trials/grade2-natural-master-speed-control-test/part1/No04-report.json"
        ),
        "providers": {"A": "edge", "B": "openai"},
        "edgeVoices": {"A": "en-US-MichelleNeural"},
        "gainsDb": {"A": -3.0},
    },
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="既存OpenAI区間WAVとEdge TTSを結合してハイブリッド会話を生成します。"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("audio-generation/hybrid-tts-trials/openai-edge-natural-master/part1"),
    )
    parser.add_argument("--edge-rate", default="+0%")
    parser.add_argument("--edge-volume", default="+0%")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def run_checked(command):
    subprocess.run(command, check=True, capture_output=True, text=True, encoding="utf-8")


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


def resolve_cached_openai_segment(report_path, report, index, segment):
    voice = report["voices"][segment["speaker"]]
    key = cache_key(
        report["model"],
        voice,
        report["speed"],
        report.get("instructions"),
        segment["text"],
    )
    path = report_path.parent / "segments" / (
        f"{index:02d}-{segment['speaker']}-{voice}-{key}.wav"
    )
    if not validate_wav(path):
        raise RuntimeError(f"Cached OpenAI segment was not found: {path}")
    return path, voice


async def generate_edge_wav(text, voice, rate, volume, destination, ffmpeg):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="hybrid-edge-") as temp_dir_text:
        mp3_path = Path(temp_dir_text) / "segment.mp3"
        received_audio = False
        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate=rate,
            volume=volume,
        )
        with mp3_path.open("wb") as output_file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio" and chunk.get("data"):
                    output_file.write(chunk["data"])
                    received_audio = True
        if not received_audio:
            raise RuntimeError(f"No Edge audio received for {voice}: {text[:40]}")
        temporary_wav = destination.with_suffix(".tmp.wav")
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
                str(temporary_wav),
            ]
        )
        temporary_wav.replace(destination)


def generate_silence(ffmpeg, destination, milliseconds):
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
            str(destination),
        ]
    )


def combine_segments(ffmpeg, records, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f"hybrid-{destination.stem.lower()}-") as temp_dir_text:
        temp_dir = Path(temp_dir_text)
        ordered_paths = []
        silence_cache = {}

        for index, record in enumerate(records, start=1):
            normalized_path = temp_dir / f"segment-{index:02d}.wav"
            normalize_command = [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(record["path"]),
            ]
            if record["gainDb"] != 0:
                normalize_command += ["-filter:a", f"volume={record['gainDb']}dB"]
            normalize_command += [
                "-ar",
                "24000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(normalized_path),
            ]
            run_checked(normalize_command)
            ordered_paths.append(normalized_path)

            gap_ms = int(record["gapAfterMs"])
            if index < len(records) and gap_ms > 0:
                silence_path = silence_cache.get(gap_ms)
                if silence_path is None:
                    silence_path = temp_dir / f"silence-{gap_ms}.wav"
                    generate_silence(ffmpeg, silence_path, gap_ms)
                    silence_cache[gap_ms] = silence_path
                ordered_paths.append(silence_path)

        concat_path = temp_dir / "concat.txt"
        concat_lines = []
        for path in ordered_paths:
            escaped = str(path.resolve()).replace("'", "'\\''")
            concat_lines.append(f"file '{escaped}'")
        concat_path.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")

        temporary_output = destination.with_suffix(".tmp.wav")
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
                str(concat_path),
                "-ar",
                "24000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(temporary_output),
            ]
        )
        temporary_output.replace(destination)


def probe_audio(ffprobe, path):
    completed = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_name,sample_rate,channels,bits_per_sample,duration",
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


async def main_async(args):
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    segment_dir = args.output_dir / "segments"
    reports = []

    for item_id, plan in ITEM_PLANS.items():
        report_path = plan["report"]
        report = json.loads(report_path.read_text(encoding="utf-8"))
        destination = args.output_dir / f"{item_id}.wav"
        report_destination = args.output_dir / f"{item_id}-report.json"
        if destination.exists() and not args.force:
            raise RuntimeError(f"Output already exists: {destination}")

        records = []
        openai_cached_segments = 0
        edge_calls = 0
        for index, segment in enumerate(report["segments"], start=1):
            speaker = segment["speaker"]
            provider = plan["providers"][speaker]
            if provider == "openai":
                segment_path, voice = resolve_cached_openai_segment(
                    report_path, report, index, segment
                )
                openai_cached_segments += 1
            else:
                voice = plan["edgeVoices"][speaker]
                segment_path = segment_dir / f"{item_id}-{index:02d}-{speaker}-{voice}.wav"
                if not validate_wav(segment_path):
                    await generate_edge_wav(
                        segment["text"],
                        voice,
                        args.edge_rate,
                        args.edge_volume,
                        segment_path,
                        ffmpeg,
                    )
                    edge_calls += 1

            records.append(
                {
                    "index": index,
                    "speaker": speaker,
                    "provider": provider,
                    "voice": voice,
                    "text": segment["text"],
                    "gapAfterMs": int(segment["gapAfterMs"]),
                    "gainDb": float(plan.get("gainsDb", {}).get(speaker, 0.0)),
                    "path": segment_path,
                }
            )

        combine_segments(ffmpeg, records, destination)
        item_report = {
            "item": item_id,
            "output": str(destination),
            "outputBytes": destination.stat().st_size,
            "outputMetadata": probe_audio(ffprobe, destination),
            "openaiApiCalls": 0,
            "openaiCachedSegments": openai_cached_segments,
            "edgeCalls": edge_calls,
            "edgeRate": args.edge_rate,
            "edgeVolume": args.edge_volume,
            "segments": [
                {**record, "path": str(record["path"])} for record in records
            ],
        }
        report_destination.write_text(
            json.dumps(item_report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        reports.append(item_report)
        print(f"generated {item_id} -> {destination}", flush=True)

    summary_path = args.output_dir.parent / "generation-report.json"
    summary_path.write_text(
        json.dumps(reports, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"report {summary_path}", flush=True)


def main():
    args = parse_args()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
