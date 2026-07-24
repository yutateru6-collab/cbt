import argparse
import json
import os
import re
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
import torch


def item_number(item):
    explicit = item.get("number")
    if isinstance(explicit, int):
        return explicit
    match = re.search(r"\d+", str(item.get("id", "")))
    return int(match.group(0)) if match else None


def write_wav(path, audio, sample_rate):
    clipped = np.clip(audio, -1.0, 1.0)
    pcm = (clipped * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm.tobytes())


def read_wav(path):
    with wave.open(str(path), "rb") as wav_file:
        sample_rate = wav_file.getframerate()
        channels = wav_file.getnchannels()
        raw = wav_file.readframes(wav_file.getnframes())
    audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if channels > 1:
        audio = audio.reshape(-1, channels).mean(axis=1)
    return audio, sample_rate


def apply_tempo(ffmpeg, audio, sample_rate, speed):
    if abs(speed - 1.0) < 0.001:
        return audio
    with tempfile.TemporaryDirectory(prefix="pocket-tempo-") as temp_dir_text:
        temp_dir = Path(temp_dir_text)
        source = temp_dir / "source.wav"
        output = temp_dir / "output.wav"
        write_wav(source, audio, sample_rate)
        subprocess.run(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(source),
                "-filter:a",
                f"atempo={speed:.6f}",
                "-ar",
                str(sample_rate),
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(output),
            ],
            check=True,
        )
        slowed, slowed_rate = read_wav(output)
        if slowed_rate != sample_rate:
            raise RuntimeError(f"Unexpected sample rate: {slowed_rate}")
        return slowed


def normalize_peak(audio, target=0.70794578):
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak <= 0:
        return audio, peak, 1.0
    scale = target / peak
    return audio * scale, peak, scale


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--hf-home", type=Path)
    parser.add_argument("--numbers", default="1,2,3")
    parser.add_argument("--speaker-a", default="alba")
    parser.add_argument("--speaker-b", default="charles")
    parser.add_argument("--language", default="english")
    parser.add_argument("--speed", type=float, default=0.87)
    parser.add_argument("--quantize", action="store_true")
    args = parser.parse_args()

    if args.hf_home:
        args.hf_home.mkdir(parents=True, exist_ok=True)
        os.environ.setdefault("HF_HOME", str(args.hf_home.resolve()))

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg was not found")

    requested = {int(value) for value in args.numbers.split(",") if value.strip()}
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    default_gap_ms = int(manifest.get("gapMs", 180))
    speaker_voices = {"A": args.speaker_a, "B": args.speaker_b}

    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)

    from pocket_tts import TTSModel

    model = TTSModel.load_model(language=args.language, quantize=args.quantize)
    model.to("cpu")
    sample_rate = int(model.sample_rate)
    states = {
        speaker: model.get_state_for_audio_prompt(voice)
        for speaker, voice in speaker_voices.items()
    }

    report = []
    for item in manifest["items"]:
        number = item_number(item)
        if number not in requested:
            continue

        chunks = []
        segment_count = 0
        for segment in item["segments"]:
            speaker = str(segment.get("speaker", "")).strip()
            text = str(segment.get("text", "")).strip()
            if speaker not in states or not text:
                raise ValueError(f"Invalid segment in {item.get('id')}: {segment}")

            with torch.no_grad():
                generated = model.generate_audio(
                    states[speaker],
                    text_to_generate=text,
                    copy_state=True,
                )
            audio = generated.squeeze().detach().cpu().numpy().astype(np.float32)
            audio = apply_tempo(ffmpeg, audio, sample_rate, args.speed)
            chunks.append(audio)
            segment_count += 1

            gap_ms = int(segment.get("gapAfterMs", default_gap_ms))
            if gap_ms > 0:
                chunks.append(np.zeros(round(sample_rate * gap_ms / 1000), dtype=np.float32))

        combined = np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)
        combined, source_peak, scale = normalize_peak(combined)
        output_path = args.output_dir / f"{item['id']}.wav"
        write_wav(output_path, combined, sample_rate)

        entry = {
            "id": item["id"],
            "number": number,
            "engine": "pocket-tts",
            "speakerA": args.speaker_a,
            "speakerB": args.speaker_b,
            "language": args.language,
            "speed": args.speed,
            "quantize": args.quantize,
            "sampleRate": sample_rate,
            "segments": segment_count,
            "duration": round(len(combined) / sample_rate, 6),
            "sourcePeak": source_peak,
            "peakScale": scale,
            "path": str(output_path),
            "bytes": output_path.stat().st_size,
        }
        report.append(entry)
        print(f"generated {entry['id']} -> {output_path}", flush=True)

    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"report {args.report}", flush=True)


if __name__ == "__main__":
    main()
