from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import sys
import wave
from array import array
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "audio-generation/grade2-round2-simba-final-full-20260721"
OUTPUT_DIR = (
    ROOT
    / "audio-generation/grade2-round2-simba-final-full-20260721-question-balanced"
)
APP_AUDIO_DIR = ROOT / "assets/audio/grade2/set-02"

# Measured from active 50 ms speech windows. The explicit 350 ms pause inside the
# question segment is excluded by the measurement gate.
PART1_QUESTION_GAIN_DB = {
    1: 3.42,
    2: 2.35,
    3: 1.02,
    4: 0.34,
    5: 1.31,
    6: 2.21,
    7: 0.49,
    8: 1.21,
    9: 1.41,
    10: 0.85,
    11: 1.15,
    12: 2.77,
    13: 1.02,
    14: 1.22,
    15: 1.33,
}

PART1_MEASUREMENTS = {
    1: {"bodyActiveRmsDbfs": -17.63, "questionActiveRmsDbfs": -21.05, "questionPeakDbfs": -7.14},
    2: {"bodyActiveRmsDbfs": -17.36, "questionActiveRmsDbfs": -19.71, "questionPeakDbfs": -3.62},
    3: {"bodyActiveRmsDbfs": -17.33, "questionActiveRmsDbfs": -18.35, "questionPeakDbfs": -5.90},
    4: {"bodyActiveRmsDbfs": -17.89, "questionActiveRmsDbfs": -18.23, "questionPeakDbfs": -4.59},
    5: {"bodyActiveRmsDbfs": -17.11, "questionActiveRmsDbfs": -18.43, "questionPeakDbfs": -5.25},
    6: {"bodyActiveRmsDbfs": -17.33, "questionActiveRmsDbfs": -19.53, "questionPeakDbfs": -7.80},
    7: {"bodyActiveRmsDbfs": -17.57, "questionActiveRmsDbfs": -18.06, "questionPeakDbfs": -4.32},
    8: {"bodyActiveRmsDbfs": -17.14, "questionActiveRmsDbfs": -18.35, "questionPeakDbfs": -3.17},
    9: {"bodyActiveRmsDbfs": -17.46, "questionActiveRmsDbfs": -18.87, "questionPeakDbfs": -5.90},
    10: {"bodyActiveRmsDbfs": -18.19, "questionActiveRmsDbfs": -19.04, "questionPeakDbfs": -4.83},
    11: {"bodyActiveRmsDbfs": -17.41, "questionActiveRmsDbfs": -18.57, "questionPeakDbfs": -3.51},
    12: {"bodyActiveRmsDbfs": -17.47, "questionActiveRmsDbfs": -20.23, "questionPeakDbfs": -6.71},
    13: {"bodyActiveRmsDbfs": -17.42, "questionActiveRmsDbfs": -18.44, "questionPeakDbfs": -3.87},
    14: {"bodyActiveRmsDbfs": -16.60, "questionActiveRmsDbfs": -17.82, "questionPeakDbfs": -4.72},
    15: {"bodyActiveRmsDbfs": -18.21, "questionActiveRmsDbfs": -19.54, "questionPeakDbfs": -4.79},
}

PEAK_LIMIT_DBFS = -1.0
PEAK_LIMIT_SAMPLE = round(32768 * (10 ** (PEAK_LIMIT_DBFS / 20)))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Balance Round 2 Question segments against each item's body."
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--apply-to-app", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    return parser.parse_args()


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_pcm(path: Path) -> tuple[tuple[int, int, int, str], bytes]:
    with wave.open(str(path), "rb") as source:
        parameters = (
            source.getnchannels(),
            source.getsampwidth(),
            source.getframerate(),
            source.getcomptype(),
        )
        pcm = source.readframes(source.getnframes())
    if parameters != (1, 2, 48000, "NONE"):
        raise RuntimeError(f"Unexpected WAV format: {path}: {parameters}")
    return parameters, pcm


def pcm_peak(pcm: bytes) -> int:
    samples = array("h")
    samples.frombytes(pcm)
    if sys.byteorder != "little":
        samples.byteswap()
    return max(abs(sample) for sample in samples)


def apply_gain(pcm: bytes, gain_db: float) -> bytes:
    if gain_db <= 0:
        return pcm
    factor = 10 ** (gain_db / 20)
    source_samples = array("h")
    source_samples.frombytes(pcm)
    if sys.byteorder != "little":
        source_samples.byteswap()
    adjusted_samples = array("h")
    for sample in source_samples:
        adjusted_sample = round(sample * factor)
        if abs(adjusted_sample) > PEAK_LIMIT_SAMPLE:
            peak_dbfs = 20 * math.log10(abs(adjusted_sample) / 32768)
            raise RuntimeError(
                f"Adjusted Question peak exceeds {PEAK_LIMIT_DBFS} dBFS: "
                f"{peak_dbfs:.2f} dBFS"
            )
        adjusted_samples.append(adjusted_sample)
    peak = max(abs(sample) for sample in adjusted_samples)
    if peak > PEAK_LIMIT_SAMPLE:
        peak_dbfs = 20 * math.log10(peak / 32768)
        raise RuntimeError(
            f"Adjusted Question peak exceeds {PEAK_LIMIT_DBFS} dBFS: {peak_dbfs:.2f} dBFS"
        )
    if sys.byteorder != "little":
        adjusted_samples.byteswap()
    return adjusted_samples.tobytes()


def write_pcm(path: Path, pcm: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp.wav")
    with wave.open(str(temporary), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(48000)
        output.writeframes(pcm)
    temporary.replace(path)


def load_records() -> list[dict]:
    records = []
    for part in ("part1", "part2"):
        report_path = SOURCE_DIR / part / "generation-report.json"
        report = json.loads(report_path.read_text(encoding="utf-8"))
        for record in report["items"]:
            copied = dict(record)
            copied["sourcePart"] = part
            records.append(copied)
    records.sort(key=lambda record: int(record["number"]))
    if [int(record["number"]) for record in records] != list(range(1, 31)):
        raise RuntimeError("Round 2 report must contain Number 1 through Number 30")
    return records


def reuse_completed_track(
    record: dict, output_path: Path, gain_db: float
) -> dict:
    number = int(record["number"])
    _, final_pcm = read_pcm(output_path)
    slices = []
    question_peak_after = None
    for source_slice in record["sliceVerification"]:
        start = int(source_slice["finalPcmStartByte"])
        end = int(source_slice["finalPcmEndByte"])
        output_pcm = final_pcm[start:end]
        output_hash = sha256_bytes(output_pcm)
        unchanged = output_hash == source_slice["sourcePcmSha256"]
        is_adjusted_question = source_slice["role"] == "question" and gain_db > 0
        if source_slice["role"] != "question" and not unchanged:
            raise RuntimeError(
                f"Cached non-Question PCM differs: No{number:02d} {source_slice['role']}"
            )
        if is_adjusted_question:
            if unchanged:
                raise RuntimeError(f"Cached Question was not adjusted: No{number:02d}")
            peak = pcm_peak(output_pcm)
            question_peak_after = 20 * math.log10(peak / 32768)
            if peak > PEAK_LIMIT_SAMPLE:
                raise RuntimeError(f"Cached Question exceeds peak limit: No{number:02d}")
        elif not unchanged:
            raise RuntimeError(
                f"Cached unadjusted PCM differs: No{number:02d} {source_slice['role']}"
            )
        slices.append(
            {
                "role": source_slice["role"],
                "sourceWav": source_slice["sourceWav"],
                "gainDb": gain_db if is_adjusted_question else 0.0,
                "sourcePcmSha256": source_slice["sourcePcmSha256"],
                "outputPcmSha256": output_hash,
                "pcmUnchanged": unchanged,
                "finalPcmStartByte": start,
                "finalPcmEndByte": end,
                "gapAfterMs": source_slice["gapAfterMs"],
            }
        )

    source_master = ROOT / record["masterWav"]
    source_master_hash = sha256_file(source_master)
    output_hash = sha256_file(output_path)
    if number > 15 and output_hash != source_master_hash:
        raise RuntimeError(f"Cached Part 2 changed unexpectedly: No{number:02d}")
    if number <= 15 and output_hash == source_master_hash:
        raise RuntimeError(f"Cached Part 1 was not adjusted: No{number:02d}")
    measurement = PART1_MEASUREMENTS.get(number)
    return {
        "number": number,
        "part": "Part 1" if number <= 15 else "Part 2",
        "changed": gain_db > 0,
        "reusedExistingOutput": True,
        "questionGainDb": gain_db,
        "bodyActiveRmsBeforeDbfs": measurement["bodyActiveRmsDbfs"] if measurement else None,
        "questionActiveRmsBeforeDbfs": measurement["questionActiveRmsDbfs"] if measurement else None,
        "questionActiveRmsAfterDbfs": (
            round(measurement["questionActiveRmsDbfs"] + gain_db, 2)
            if measurement
            else None
        ),
        "questionPeakBeforeDbfs": measurement["questionPeakDbfs"] if measurement else None,
        "questionPeakAfterDbfs": round(question_peak_after, 2) if question_peak_after is not None else None,
        "sourceMasterWav": str(source_master.relative_to(ROOT)),
        "sourceMasterSha256": source_master_hash,
        "outputWav": str(output_path.relative_to(ROOT)),
        "outputSha256": output_hash,
        "fileBytes": output_path.stat().st_size,
        "nonQuestionPcmUnchanged": all(
            segment["pcmUnchanged"]
            for segment in slices
            if segment["role"] != "question"
        ),
        "slices": slices,
    }


def build_track(record: dict, output_dir: Path) -> dict:
    number = int(record["number"])
    part = "part1" if number <= 15 else "part2"
    gain_db = PART1_QUESTION_GAIN_DB.get(number, 0.0)
    output_path = output_dir / part / f"No{number:02d}.wav"
    if output_path.exists():
        return reuse_completed_track(record, output_path, gain_db)
    combined = bytearray()
    slices = []
    question_peak_after = None

    for segment in record["segments"]:
        source_path = ROOT / segment["sourceWav"]
        _, source_pcm = read_pcm(source_path)
        output_pcm = source_pcm
        adjusted = segment["role"] == "question" and gain_db > 0
        if adjusted:
            output_pcm = apply_gain(source_pcm, gain_db)
            peak = pcm_peak(output_pcm)
            question_peak_after = 20 * math.log10(peak / 32768)

        start = len(combined)
        combined.extend(output_pcm)
        end = len(combined)
        slices.append(
            {
                "role": segment["role"],
                "sourceWav": segment["sourceWav"],
                "gainDb": gain_db if adjusted else 0.0,
                "sourcePcmSha256": sha256_bytes(source_pcm),
                "outputPcmSha256": sha256_bytes(output_pcm),
                "pcmUnchanged": output_pcm == source_pcm,
                "finalPcmStartByte": start,
                "finalPcmEndByte": end,
                "gapAfterMs": segment["gapAfterMs"],
            }
        )
        if segment["gapAfterMs"]:
            silence_frames = round(48000 * segment["gapAfterMs"] / 1000)
            combined.extend(bytes(silence_frames * 2))

    write_pcm(output_path, bytes(combined))
    _, final_pcm = read_pcm(output_path)
    if final_pcm != bytes(combined):
        raise RuntimeError(f"Final PCM verification failed: {output_path}")

    source_master = ROOT / record["masterWav"]
    source_master_hash = sha256_file(source_master)
    output_hash = sha256_file(output_path)
    if number > 15 and output_hash != source_master_hash:
        raise RuntimeError(f"Unadjusted Part 2 changed unexpectedly: No{number:02d}")
    if number <= 15 and output_hash == source_master_hash:
        raise RuntimeError(f"Adjusted Part 1 did not change: No{number:02d}")

    measurement = PART1_MEASUREMENTS.get(number)
    return {
        "number": number,
        "part": "Part 1" if number <= 15 else "Part 2",
        "changed": gain_db > 0,
        "reusedExistingOutput": False,
        "questionGainDb": gain_db,
        "bodyActiveRmsBeforeDbfs": measurement["bodyActiveRmsDbfs"] if measurement else None,
        "questionActiveRmsBeforeDbfs": measurement["questionActiveRmsDbfs"] if measurement else None,
        "questionActiveRmsAfterDbfs": (
            round(measurement["questionActiveRmsDbfs"] + gain_db, 2)
            if measurement
            else None
        ),
        "questionPeakBeforeDbfs": measurement["questionPeakDbfs"] if measurement else None,
        "questionPeakAfterDbfs": round(question_peak_after, 2) if question_peak_after is not None else None,
        "sourceMasterWav": str(source_master.relative_to(ROOT)),
        "sourceMasterSha256": source_master_hash,
        "outputWav": str(output_path.relative_to(ROOT)),
        "outputSha256": output_hash,
        "fileBytes": output_path.stat().st_size,
        "nonQuestionPcmUnchanged": all(
            segment["pcmUnchanged"]
            for segment in slices
            if segment["role"] != "question"
        ),
        "slices": slices,
    }


def apply_to_app(records: list[dict]) -> None:
    for record in records:
        if not record["changed"]:
            continue
        number = int(record["number"])
        part = "part1" if number <= 15 else "part2"
        source = ROOT / record["outputWav"]
        destination = APP_AUDIO_DIR / part / "simba-3.2-final" / f"No{number:02d}.wav"
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix(".tmp.wav")
        shutil.copyfile(source, temporary)
        temporary.replace(destination)
        if sha256_file(source) != sha256_file(destination):
            raise RuntimeError(f"App audio copy differs: {destination}")


def main() -> int:
    args = parse_args()
    plan = {
        "mode": "preflight",
        "sourceDir": str(SOURCE_DIR.relative_to(ROOT)),
        "outputDir": str(args.output_dir.relative_to(ROOT)),
        "tracks": 30,
        "questionSegmentsAdjusted": len(PART1_QUESTION_GAIN_DB),
        "partsAdjusted": ["Part 1"],
        "partsUnchanged": ["Part 2"],
        "minimumGainDb": min(PART1_QUESTION_GAIN_DB.values()),
        "maximumGainDb": max(PART1_QUESTION_GAIN_DB.values()),
        "peakLimitDbfs": PEAK_LIMIT_DBFS,
        "applyToApp": args.apply_to_app,
    }
    if not args.execute:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return 0

    records = [build_track(record, args.output_dir) for record in load_records()]
    if args.apply_to_app:
        apply_to_app(records)

    report = {
        **plan,
        "mode": "completed",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "quality": {
            "sampleRateHz": 48000,
            "sampleWidthBits": 16,
            "channels": 1,
            "lossyEncoding": False,
            "resampling": False,
            "speedOrPitchChange": False,
            "timingChange": False,
            "bodyAndNumberPcmUnchanged": all(
                record["nonQuestionPcmUnchanged"] for record in records
            ),
            "part2MastersUnchanged": all(
                record["sourceMasterSha256"] == record["outputSha256"]
                for record in records
                if record["part"] == "Part 2"
            ),
            "adjustedQuestionPeaksBelowLimit": all(
                record["questionPeakAfterDbfs"] <= PEAK_LIMIT_DBFS
                for record in records
                if record["changed"]
            ),
        },
        "items": records,
    }
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "tracks": len(records),
                "changed": sum(record["changed"] for record in records),
                "appliedToApp": args.apply_to_app,
                "quality": report["quality"],
                "report": str(
                    (args.output_dir / "generation-report.json").relative_to(ROOT)
                ),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
