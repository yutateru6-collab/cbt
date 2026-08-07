import argparse
import copy
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

import audit_grade2_sample_part1_speaker_candidates as speaker_qa
import generate_grade2_set02_user_corrections_20260807 as correction
import package_grade2_set02_full_approved_mobile_20260806 as previous


ROOT = Path(__file__).resolve().parent.parent
SOURCE_SELECTED_DIR = ROOT / "audio-generation" / "grade2-set02-full-approved-selected-20260806"
SOURCE_REVIEW_DIR = ROOT / "audio-generation" / "cloudflare-publish" / "grade2-set02-full-approved-review-20260806"
SELECTED_DIR = ROOT / "audio-generation" / "grade2-set02-full-approved-selected-v2-20260807"
OUTPUT_DIR = ROOT / "audio-generation" / "cloudflare-publish" / "grade2-set02-full-approved-review-v2-20260807"
AUDIT_REPORT = ROOT / "audio-generation" / "grade2-set02-user-correction-audit-20260807.json"
CONTINUOUS_WAV = SELECTED_DIR / "all-30-continuous-lossless.wav"
CONTINUOUS_MP3 = OUTPUT_DIR / "audio" / "all-30-continuous.mp3"
PACE_TOLERANCE = 0.18
MIN_NUMBER_GAP_MS = 650.0
TARGET_NUMBER_GAP_MS = 900.0
MAX_NUMBER_GAP_MS = 1300.0
NO01_MAX_PUCK_TURN_F0_HZ = 150.0
NO01_MAX_PUCK_MEDIAN_F0_HZ = 145.0


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def speaker_audit(plan_item, wav_path):
    normalized_segments = [
        {
            **segment,
            "speaker": "Woman" if segment["speaker"] == "Kore" else "Man" if segment["speaker"] == "Puck" else segment["speaker"],
        }
        for segment in plan_item["segments"]
    ]
    audit_item = {
        **plan_item,
        "segments": normalized_segments,
        "baseId": plan_item["sourceItemId"],
        "candidate": plan_item["candidateNumber"],
    }
    return speaker_qa.audit_candidate(audit_item, wav_path)


def audit_candidates():
    plan = read_json(ROOT / correction.OUTPUT_DIR / "batch-request-plan.json")
    status = read_json(ROOT / correction.OUTPUT_DIR / "collection-status.json")
    plan_items = {item["id"]: item for item in plan["items"]}
    results = {item["id"]: item for item in status["items"]}
    audited = []
    for item_id, result in results.items():
        plan_item = plan_items[item_id]
        wav_path = ROOT / correction.OUTPUT_DIR / result["file"]
        effective_duration = result["durationSeconds"] - plan_item["fixedPauseSeconds"]
        effective_wps = plan_item["wordCount"] / effective_duration
        pace_delta = effective_wps - plan_item["targetEffectiveWordsPerSecond"]
        try:
            speaker = speaker_audit(plan_item, wav_path)
        except Exception as error:
            audited.append({
                "id": item_id,
                "number": plan_item["number"],
                "file": result["file"],
                "durationSeconds": result["durationSeconds"],
                "effectiveWordsPerSecond": round(effective_wps, 3),
                "paceDelta": round(pace_delta, 3),
                "pacePassed": abs(pace_delta) <= PACE_TOLERANCE,
                "speakerPassed": False,
                "numberGapMs": None,
                "numberGapPassed": False,
                "puckTurnMedianF0Hz": [],
                "puckMeanMedianF0Hz": None,
                "strictNo01VoicePassed": False,
                "accepted": False,
                "speakerQa": None,
                "auditError": f"{type(error).__name__}: {error}",
                "sha256": sha256(wav_path),
            })
            continue
        number_gap_ms = speaker["selectedBoundaries"][0]["durationMs"]
        man_turns = [turn["medianF0Hz"] for turn in speaker["bodyTurns"] if turn["speaker"] == "Man"]
        max_man_f0 = max(man_turns)
        median_man_f0 = sum(man_turns) / len(man_turns)
        gap_passed = MIN_NUMBER_GAP_MS <= number_gap_ms <= MAX_NUMBER_GAP_MS
        strict_no01_voice_passed = (
            plan_item["number"] != 1
            or (
                max_man_f0 <= NO01_MAX_PUCK_TURN_F0_HZ
                and median_man_f0 <= NO01_MAX_PUCK_MEDIAN_F0_HZ
            )
        )
        passed = (
            abs(pace_delta) <= PACE_TOLERANCE
            and speaker["speakerPassed"]
            and gap_passed
            and strict_no01_voice_passed
        )
        audited.append({
            "id": item_id,
            "number": plan_item["number"],
            "file": result["file"],
            "durationSeconds": result["durationSeconds"],
            "effectiveWordsPerSecond": round(effective_wps, 3),
            "paceDelta": round(pace_delta, 3),
            "pacePassed": abs(pace_delta) <= PACE_TOLERANCE,
            "speakerPassed": speaker["speakerPassed"],
            "numberGapMs": number_gap_ms,
            "numberGapPassed": gap_passed,
            "puckTurnMedianF0Hz": man_turns,
            "puckMeanMedianF0Hz": round(median_man_f0, 2),
            "strictNo01VoicePassed": strict_no01_voice_passed,
            "accepted": passed,
            "speakerQa": speaker,
            "sha256": sha256(wav_path),
        })

    selections = {}
    for number in correction.TARGET_NUMBERS:
        passing = [item for item in audited if item["number"] == number and item["accepted"]]
        if number == 1:
            passing.sort(key=lambda item: (
                abs(item["paceDelta"]),
                max(item["puckTurnMedianF0Hz"]),
                abs(item["numberGapMs"] - TARGET_NUMBER_GAP_MS),
            ))
        else:
            passing.sort(key=lambda item: (
                abs(item["paceDelta"]),
                abs(item["numberGapMs"] - TARGET_NUMBER_GAP_MS),
            ))
        selections[f"No{number:02d}"] = passing[0]["id"] if passing else None

    report = {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "model": plan["model"],
        "setKey": "set-02",
        "scope": {"part": "Part 1", "numbers": list(correction.TARGET_NUMBERS)},
        "policy": {
            "paceTargetWordsPerSecond": 2.30,
            "paceToleranceWordsPerSecond": PACE_TOLERANCE,
            "numberGapMs": {"minimum": MIN_NUMBER_GAP_MS, "target": TARGET_NUMBER_GAP_MS, "maximum": MAX_NUMBER_GAP_MS},
            "No01Puck": {"maximumTurnMedianF0Hz": NO01_MAX_PUCK_TURN_F0_HZ, "maximumMeanMedianF0Hz": NO01_MAX_PUCK_MEDIAN_F0_HZ},
            "speedPostProcessing": "none",
        },
        "estimatedBatchCostUsd": status.get("estimatedBatchCostUsd"),
        "failures": status.get("failures", []),
        "selections": selections,
        "allCorrectionsAccepted": all(selections.values()),
        "candidates": audited,
    }
    write_json(AUDIT_REPORT, report)
    print(f"Saved {AUDIT_REPORT}")
    print(json.dumps(selections, ensure_ascii=False))
    return report


def package_v2(audit):
    if not audit["allCorrectionsAccepted"]:
        raise RuntimeError(f"No accepted correction candidate: {audit['selections']}")
    if SELECTED_DIR.exists() or OUTPUT_DIR.exists():
        raise RuntimeError("Refusing to overwrite an existing v2 selected or review directory")

    source_report = read_json(SOURCE_REVIEW_DIR / "generation-and-publish-report.json")
    generation_plan = read_json(ROOT / correction.OUTPUT_DIR / "batch-request-plan.json")
    generation_status = read_json(ROOT / correction.OUTPUT_DIR / "collection-status.json")
    plan_items = {item["id"]: item for item in generation_plan["items"]}
    result_items = {item["id"]: item for item in generation_status["items"]}
    audit_items = {item["id"]: item for item in audit["candidates"]}

    (SELECTED_DIR / "part1").mkdir(parents=True)
    (SELECTED_DIR / "part2").mkdir()
    (OUTPUT_DIR / "audio").mkdir(parents=True)
    records = []
    for old_record in source_report["items"]:
        record = copy.deepcopy(old_record)
        part_slug = "part1" if record["part"] == "Part 1" else "part2"
        canonical_name = f"{part_slug}-no{record['number']:02d}.wav"
        native_path = SELECTED_DIR / part_slug / canonical_name
        review_path = OUTPUT_DIR / "audio" / canonical_name
        selection_key = f"No{record['number']:02d}"
        selected_id = audit["selections"].get(selection_key) if record["part"] == "Part 1" else None
        if selected_id:
            selected_result = result_items[selected_id]
            generated_path = ROOT / correction.OUTPUT_DIR / selected_result["file"]
            shutil.copy2(generated_path, native_path)
            samples, params = previous.audio_tools.read_wav(native_path)
            adjusted, gain = previous.package_tools.whole_file_gain(samples, record["part"])
            previous.audio_tools.write_wav(review_path, adjusted, params)
            metrics = previous.audio_metrics.inspect_wav(review_path)
            selected_plan = plan_items[selected_id]
            selected_audit = audit_items[selected_id]
            effective_duration = selected_result["durationSeconds"] - selected_plan["fixedPauseSeconds"]
            record.update({
                "selectedCandidateId": selected_id,
                "sha256": sha256(review_path),
                "nativeSha256": sha256(native_path),
                "bytes": review_path.stat().st_size,
                "durationSeconds": metrics["durationSeconds"],
                "overallWordsPerSecond": round(selected_plan["wordCount"] / selected_result["durationSeconds"], 3),
                "effectiveWordsPerSecond": round(selected_plan["wordCount"] / effective_duration, 3),
                "paceDelta": selected_audit["paceDelta"],
                "speakerQa": selected_audit["speakerQa"],
                "userCorrectionQa": {
                    "numberGapMs": selected_audit["numberGapMs"],
                    "puckTurnMedianF0Hz": selected_audit["puckTurnMedianF0Hz"],
                    "strictNo01VoicePassed": selected_audit["strictNo01VoicePassed"],
                },
                "processing": {"speedChange": False, "wholeFileConstantGain": gain},
                "metrics": metrics,
            })
        else:
            shutil.copy2(SOURCE_SELECTED_DIR / record["nativeFile"], native_path)
            shutil.copy2(SOURCE_REVIEW_DIR / record["file"], review_path)
        records.append(record)

    report = {
        **source_report,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "version": "v2-20260807-user-corrected",
        "sourceVersion": "grade2-set02-full-approved-review-20260806",
        "manualCorrectionScope": ["Part 1 No.1 male voice", "Part 1 No.10 pause after Number"],
        "correctionAudit": str(AUDIT_REPORT.relative_to(ROOT)).replace("\\", "/"),
        "productionR2Overwritten": False,
        "manualListeningRequired": True,
        "items": records,
    }
    write_json(SELECTED_DIR / "selection-report.json", report)
    write_json(OUTPUT_DIR / "generation-and-publish-report.json", report)
    (OUTPUT_DIR / "index.html").write_text(previous.build_html(records), encoding="utf-8")
    (OUTPUT_DIR / "_headers").write_text(
        "/audio/*.wav\n  Content-Type: audio/wav\n  Cache-Control: public, max-age=31536000, immutable\n"
        "/audio/*.mp3\n  Content-Type: audio/mpeg\n  Cache-Control: public, max-age=31536000, immutable\n"
        "/index.html\n  Cache-Control: no-store\n",
        encoding="utf-8",
    )
    print(f"Packaged corrected 30-item v2 at {OUTPUT_DIR}")


def build_continuous():
    previous.SELECTED_DIR = SELECTED_DIR
    previous.OUTPUT_DIR = OUTPUT_DIR
    previous.CONTINUOUS_WAV = CONTINUOUS_WAV
    previous.CONTINUOUS_MP3 = CONTINUOUS_MP3
    previous.build_continuous_audio()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("audit", "package", "continuous"))
    command = parser.parse_args().command
    audit = audit_candidates() if command == "audit" or not AUDIT_REPORT.exists() else read_json(AUDIT_REPORT)
    if command == "audit":
        return 0
    if command == "package":
        package_v2(audit)
        return 0
    build_continuous()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
