import argparse
import asyncio
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

try:
    import edge_tts
except ModuleNotFoundError:
    edge_tts = None


def load_manifest(path):
    with path.open("r", encoding="utf-8") as file:
        manifest = json.load(file)
    if not isinstance(manifest, dict) or not isinstance(manifest.get("items"), list):
        raise ValueError("manifest must contain an items array")
    return manifest


def item_number(item):
    explicit = item.get("number")
    if isinstance(explicit, int):
        return explicit
    match = re.search(r"\d+", str(item.get("id", "")))
    return int(match.group(0)) if match else None


def normalize_tts_text(text):
    return re.sub(r"^\s*No\.\s*(\d+)\.?\s*$", r"Number \1.", text)


def resolve_item_plan(item, manifest_voices, manifest_rates, voice_pair_plan):
    item_voices = item.get("voices")
    item_rates = item.get("rates")
    base_rates = manifest_rates if isinstance(manifest_rates, dict) else {}
    if isinstance(item_voices, dict):
        return {
            "voices": {**manifest_voices, **item_voices},
            "rates": {**base_rates, **(item_rates if isinstance(item_rates, dict) else {})},
        }

    number = item_number(item)
    if number is not None:
        for plan in voice_pair_plan:
            start = int(plan.get("start", 0))
            end = int(plan.get("end", 0))
            voices = plan.get("voices")
            if start <= number <= end and isinstance(voices, dict):
                rates = plan.get("rates")
                return {
                    "voices": {**manifest_voices, **voices},
                    "rates": {
                        **base_rates,
                        **(rates if isinstance(rates, dict) else {}),
                        **(item_rates if isinstance(item_rates, dict) else {}),
                    },
                }

    return {
        "voices": manifest_voices,
        "rates": {**base_rates, **(item_rates if isinstance(item_rates, dict) else {})},
    }


async def write_edge_audio(text, voice, rate, volume, output_path):
    text = normalize_tts_text(text)
    if edge_tts is None:
        executable = shutil.which("edge-tts")
        if not executable:
            raise RuntimeError("edge_tts module and edge-tts command were not found")
        subprocess.run(
            [
                executable,
                "--text",
                text,
                "--voice",
                voice,
                f"--rate={rate}",
                f"--volume={volume}",
                "--write-media",
                str(output_path),
            ],
            check=True,
        )
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise RuntimeError(f"No audio received for {voice}: {text[:40]}")
        return

    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, volume=volume)
    received_audio = False
    with output_path.open("wb") as output_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio" and chunk.get("data"):
                output_file.write(chunk["data"])
                received_audio = True
    if not received_audio:
        raise RuntimeError(f"No audio received for {voice}: {text[:40]}")


def generate_silence(ffmpeg, path, milliseconds, bitrate):
    subprocess.run(
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
            f"{milliseconds / 1000:.3f}",
            "-ac",
            "1",
            "-c:a",
            "libmp3lame",
            "-b:a",
            bitrate,
            str(path),
        ],
        check=True,
    )


def decode_segment_to_pcm(ffmpeg, source, destination, post_tempo=None):
    command = [
        ffmpeg,
        "-y",
        "-loglevel",
        "error",
        "-i",
        str(source),
    ]
    if post_tempo is not None:
        command += ["-filter:a", f"atempo={post_tempo:.6f}"]
    command += [
        "-ar",
        "24000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        str(destination),
    ]
    subprocess.run(command, check=True)


def generate_pcm_silence(ffmpeg, path, milliseconds):
    subprocess.run(
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
            f"{milliseconds / 1000:.3f}",
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            str(path),
        ],
        check=True,
    )


def concat_pcm_audio(ffmpeg, sources, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="edge-listening-pcm-") as temp_dir_text:
        temp_dir = Path(temp_dir_text)
        ordered = []
        silences = {}
        for index, (source, gap_after_ms) in enumerate(sources):
            ordered.append(source)
            if index < len(sources) - 1 and gap_after_ms > 0:
                silence = silences.get(gap_after_ms)
                if silence is None:
                    silence = temp_dir / f"silence-{gap_after_ms}.wav"
                    generate_pcm_silence(ffmpeg, silence, gap_after_ms)
                    silences[gap_after_ms] = silence
                ordered.append(silence)

        concat_file = temp_dir / "concat.txt"
        concat_lines = []
        for path in ordered:
            escaped = str(path.resolve()).replace("'", "'\\''")
            concat_lines.append(f"file '{escaped}'")
        concat_file.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")

        temporary_output = destination.with_suffix(".tmp.wav")
        if temporary_output.exists():
            temporary_output.unlink()
        subprocess.run(
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
                str(temporary_output),
            ],
            check=True,
        )
        temporary_output.replace(destination)


def concat_audio(ffmpeg, sources, destination, bitrate, concat_mode, output_format):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="edge-listening-") as temp_dir_text:
        temp_dir = Path(temp_dir_text)
        ordered = []
        silences = {}
        for index, (source, gap_after_ms) in enumerate(sources):
            ordered.append(source)
            if index < len(sources) - 1 and gap_after_ms > 0:
                silence = silences.get(gap_after_ms)
                if silence is None:
                    silence = temp_dir / f"silence-{gap_after_ms}.mp3"
                    generate_silence(ffmpeg, silence, gap_after_ms, bitrate)
                    silences[gap_after_ms] = silence
                ordered.append(silence)

        concat_file = temp_dir / "concat.txt"
        concat_lines = []
        for path in ordered:
            escaped = str(path.resolve()).replace("'", "'\\''")
            concat_lines.append(f"file '{escaped}'")
        concat_file.write_text("\n".join(concat_lines) + "\n", encoding="utf-8")

        temporary_output = destination.with_suffix(f".tmp.{output_format}")
        if temporary_output.exists():
            temporary_output.unlink()
        command = [
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
        ]
        if output_format == "wav":
            command += [
                "-ar",
                "24000",
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
            ]
        elif concat_mode == "copy":
            command += ["-c", "copy"]
        else:
            command += [
                "-ar",
                "24000",
                "-ac",
                "1",
                "-c:a",
                "libmp3lame",
                "-b:a",
                bitrate,
            ]
        command.append(str(temporary_output))
        subprocess.run(command, check=True)
        temporary_output.replace(destination)


def ffprobe_audio(path):
    completed = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=sample_rate,channels,duration,bit_rate",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    data = json.loads(completed.stdout)
    streams = data.get("streams") or []
    return streams[0] if streams else {}


async def synthesize_item(
    item,
    voices,
    rates,
    output_dir,
    ffmpeg,
    default_gap_ms,
    default_rate,
    volume,
    bitrate,
    concat_mode,
    output_format,
    force_rate,
    pcm_pipeline,
    post_tempo,
):
    item_id = str(item.get("id", "")).strip()
    segments = item.get("segments")
    if not item_id or not isinstance(segments, list) or not segments:
        raise ValueError(f"Invalid item: {item}")

    with tempfile.TemporaryDirectory(prefix=f"{item_id}-segments-") as temp_dir_text:
        temp_dir = Path(temp_dir_text)
        sources = []
        for index, segment in enumerate(segments, start=1):
            speaker = str(segment.get("speaker", "")).strip()
            text = str(segment.get("text", "")).strip()
            voice = voices.get(speaker)
            segment_rate = str(force_rate or segment.get("rate") or rates.get(speaker) or default_rate)
            if not speaker or not voice or not text:
                raise ValueError(f"{item_id} has an invalid segment")
            segment_path = temp_dir / f"{item_id}-{index:02d}-{speaker}.mp3"
            await write_edge_audio(text, voice, segment_rate, volume, segment_path)
            gap_after = int(segment.get("gapAfterMs", default_gap_ms))
            if pcm_pipeline:
                pcm_path = temp_dir / f"{item_id}-{index:02d}-{speaker}.wav"
                decode_segment_to_pcm(ffmpeg, segment_path, pcm_path, post_tempo)
                sources.append((pcm_path, max(0, gap_after)))
            else:
                sources.append((segment_path, max(0, gap_after)))

        destination = output_dir / f"{item_id}.{output_format}"
        if pcm_pipeline:
            concat_pcm_audio(ffmpeg, sources, destination)
        else:
            concat_audio(ffmpeg, sources, destination, bitrate, concat_mode, output_format)

    metadata = ffprobe_audio(destination)
    return {
        "id": item_id,
        "number": item_number(item),
        "path": str(destination),
        "bytes": destination.stat().st_size,
        "duration": metadata.get("duration"),
        "bitRate": metadata.get("bit_rate"),
        "sampleRate": metadata.get("sample_rate"),
        "channels": metadata.get("channels"),
        "rates": rates,
        "defaultRate": default_rate,
        "volume": volume,
        "bitrateSetting": bitrate,
        "concatMode": concat_mode,
        "outputFormat": output_format,
        "forceRate": force_rate,
        "pcmPipeline": pcm_pipeline,
        "postTempo": post_tempo,
    }


async def main_async(args):
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg was not found")

    manifest = load_manifest(args.manifest)
    output_dir = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    requested_numbers = {int(value) for value in args.numbers.split(",") if value.strip()}
    manifest_voices = manifest.get("voices") or {}
    manifest_rates = manifest.get("rates") or {}
    voice_pair_plan = manifest.get("voicePairPlan") or []
    default_gap_ms = int(manifest.get("gapMs", 180))

    report = []
    for item in manifest["items"]:
        number = item_number(item)
        if number not in requested_numbers:
            continue
        plan = resolve_item_plan(item, manifest_voices, manifest_rates, voice_pair_plan)
        result = await synthesize_item(
            item=item,
            voices=plan["voices"],
            rates=plan["rates"],
            output_dir=output_dir,
            ffmpeg=ffmpeg,
            default_gap_ms=default_gap_ms,
            default_rate=args.rate,
            volume=args.volume,
            bitrate=args.bitrate,
            concat_mode=args.concat_mode,
            output_format=args.output_format,
            force_rate=args.force_rate,
            pcm_pipeline=args.pcm_pipeline,
            post_tempo=args.post_tempo,
        )
        report.append(result)
        print(f"generated {result['id']} -> {result['path']}", flush=True)

    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"report {args.report}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Generate Edge TTS listening audio from a manifest.")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--numbers", default="1,2,3")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--rate", default="+0%")
    parser.add_argument("--volume", default="+0%")
    parser.add_argument("--bitrate", default="48k")
    parser.add_argument("--concat-mode", choices=["copy", "reencode"], default="copy")
    parser.add_argument("--output-format", choices=["mp3", "wav"], default="mp3")
    parser.add_argument("--force-rate")
    parser.add_argument("--pcm-pipeline", action="store_true")
    parser.add_argument("--post-tempo", type=float)
    args = parser.parse_args()
    if args.pcm_pipeline and args.output_format != "wav":
        parser.error("--pcm-pipeline requires --output-format wav")
    if args.post_tempo is not None and not args.pcm_pipeline:
        parser.error("--post-tempo requires --pcm-pipeline")
    if args.post_tempo is not None and not 0.5 <= args.post_tempo <= 2.0:
        parser.error("--post-tempo must be between 0.5 and 2.0")
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
