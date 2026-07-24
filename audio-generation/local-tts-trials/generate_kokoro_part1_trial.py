import argparse
import json
import os
import re
from pathlib import Path

import numpy as np
import soundfile as sf


SPOKEN_TEXT_REPLACEMENTS = (
    (re.compile(r"\bMs\.(?=\s+[A-Z])"), "Miz"),
    (re.compile(r"\bMrs\.(?=\s+[A-Z])"), "Missus"),
)


def item_number(item):
    explicit = item.get("number")
    if isinstance(explicit, int):
        return explicit
    match = re.search(r"\d+", str(item.get("id", "")))
    return int(match.group(0)) if match else None


def normalize_peak(audio, target=0.70794578):
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak <= 0:
        return audio, peak, 1.0
    scale = target / peak
    return audio * scale, peak, scale


def normalize_spoken_text(text):
    normalized = text
    replacements = []
    for pattern, replacement in SPOKEN_TEXT_REPLACEMENTS:
        updated, count = pattern.subn(replacement, normalized)
        if count:
            replacements.append({"from": pattern.pattern, "to": replacement, "count": count})
            normalized = updated
    return normalized, replacements


def prepare_segments(segments, merge_leading_number):
    prepared = [dict(segment) for segment in segments]
    if not merge_leading_number or len(prepared) < 2:
        return prepared, False

    number_segment = prepared[0]
    first_line = prepared[1]
    number_text = str(number_segment.get("text", "")).strip()
    if (
        number_segment.get("speaker") != first_line.get("speaker")
        or not re.fullmatch(r"Number\s+\d+\.", number_text)
    ):
        return prepared, False

    merged_number = re.sub(r"\.$", "...", number_text)
    merged = {
        **first_line,
        "speaker": number_segment["speaker"],
        "text": f"{merged_number} {str(first_line.get('text', '')).strip()}",
        "sourceSegmentCount": 2,
    }
    return [merged, *prepared[2:]], True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--voices", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--numbers", default="1,2,3")
    parser.add_argument("--speaker-a", default="af_heart")
    parser.add_argument("--speaker-b", default="am_michael")
    parser.add_argument("--speed", type=float, default=0.87)
    parser.add_argument("--lang", default="en-us")
    parser.add_argument("--merge-leading-number", action="store_true")
    args = parser.parse_args()

    requested = {int(value) for value in args.numbers.split(",") if value.strip()}
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    default_gap_ms = int(manifest.get("gapMs", 180))
    speaker_voices = {"A": args.speaker_a, "B": args.speaker_b}

    import espeakng_loader

    espeakng_loader.make_library_available()
    os.environ.setdefault("PHONEMIZER_ESPEAK_LIBRARY", espeakng_loader.get_library_path())
    os.environ.setdefault("PHONEMIZER_ESPEAK_DATA_PATH", espeakng_loader.get_data_path())

    # phonemizer-fork repeatedly initializes espeak during availability checks.
    # On this Windows setup that makes valid English voices disappear, so keep
    # the actual voice setup but bypass the duplicate preflight checks here.
    from phonemizer.backend.base import BaseBackend
    from phonemizer.backend.espeak.base import BaseEspeakBackend
    from phonemizer.backend.espeak.wrapper import EspeakWrapper

    EspeakWrapper.set_library(espeakng_loader.get_library_path())
    EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
    BaseBackend._init_language = classmethod(lambda cls, language: language)
    BaseEspeakBackend.is_available = classmethod(lambda cls: True)
    BaseEspeakBackend.version = classmethod(lambda cls: (1, 52, 0))

    from kokoro_onnx import Kokoro

    kokoro = Kokoro(str(args.model), str(args.voices))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)

    report = []
    for item in manifest["items"]:
        number = item_number(item)
        if number not in requested:
            continue

        chunks = []
        sample_rate = None
        segment_count = 0
        title_replacements = []
        segments, merged_leading_number = prepare_segments(
            item["segments"], args.merge_leading_number
        )
        for segment in segments:
            speaker = str(segment.get("speaker", "")).strip()
            text = str(segment.get("text", "")).strip()
            voice = speaker_voices.get(speaker)
            if not voice or not text:
                raise ValueError(f"Invalid segment in {item.get('id')}: {segment}")

            spoken_text, replacements = normalize_spoken_text(text)
            if replacements:
                title_replacements.append(
                    {"sourceText": text, "spokenText": spoken_text, "replacements": replacements}
                )
            samples, sr = kokoro.create(
                spoken_text, voice=voice, speed=args.speed, lang=args.lang
            )
            audio = np.asarray(samples, dtype=np.float32)
            if audio.ndim > 1:
                audio = audio.mean(axis=1)
            chunks.append(audio)
            sample_rate = int(sr)
            segment_count += 1

            gap_ms = int(segment.get("gapAfterMs", default_gap_ms))
            if gap_ms > 0:
                chunks.append(np.zeros(round(sample_rate * gap_ms / 1000), dtype=np.float32))

        combined = np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)
        combined, source_peak, scale = normalize_peak(combined)
        output_path = args.output_dir / f"{item['id']}.wav"
        sf.write(output_path, combined, sample_rate, subtype="PCM_16")

        entry = {
            "id": item["id"],
            "number": number,
            "engine": "kokoro-onnx",
            "speakerA": args.speaker_a,
            "speakerB": args.speaker_b,
            "speed": args.speed,
            "lang": args.lang,
            "sampleRate": sample_rate,
            "sourceSegments": len(item["segments"]),
            "synthesisSegments": segment_count,
            "mergeLeadingNumber": merged_leading_number,
            "titleReplacements": title_replacements,
            "duration": round(len(combined) / sample_rate, 6) if sample_rate else None,
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
