import argparse
import copy
from pathlib import Path

import generate_grade2_gemini_batch_test_five as batch
import generate_grade2_set02_full_approved_gemini_20260806 as source
import package_grade2_set02_full_approved_mobile_20260806 as review


RETRY_ROUND = None
OUTPUT_DIR = None
BATCH_DISPLAY_NAME = None
PART1_RETRY_CANDIDATES = 12
PART2_RETRY_CANDIDATES = 4


def configure(retry_round):
    global RETRY_ROUND, OUTPUT_DIR, BATCH_DISPLAY_NAME
    RETRY_ROUND = retry_round
    OUTPUT_DIR = Path(f"audio-generation/grade2-set02-full-approved-gemini-retry{retry_round}-20260806")
    BATCH_DISPLAY_NAME = f"grade2-set02-full-approved-gemini-retry{retry_round}-20260806"
    batch.MODEL = source.MODEL
    batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
    batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
    batch.build_plan = build_plan
    batch.prompt_for = lambda item: item["prompt"]
    batch.speech_config_for = source.speech_config_for


def correction_for(base_item, audit_item):
    candidates = audit_item["candidates"]
    pace_deltas = [value["paceDelta"] for value in candidates]
    mean_delta = sum(pace_deltas) / len(pace_deltas) if pace_deltas else 0.0
    corrections = ["\n\nTARGETED RETRY CORRECTION"]
    if mean_delta > review.PACE_TOLERANCE:
        corrections.append("Previous candidates were too fast. Use a more measured connected delivery and stay near the stated total duration.")
    elif mean_delta < -review.PACE_TOLERANCE:
        corrections.append("Previous candidates were too slow. Read slightly more quickly while remaining calm, clear, natural, and never rushed.")
    else:
        corrections.append("Preserve the approved natural medium pace and stay close to the stated total duration.")
    if base_item["part"] == "Part 1":
        corrections.append("The item still has no candidate that passes both pace and rendered-speaker QA. Keep Kore unmistakably female and Puck unmistakably lower-pitched male on both turns; never swap, blend, imitate, or drift, including short turns and sentence endings.")
        speaker_passing = [
            value for value in candidates
            if bool((value.get("speakerQa") or {}).get("speakerPassed"))
        ]
        if speaker_passing and all(value["paceDelta"] < -review.PACE_TOLERANCE for value in speaker_passing):
            corrections.append("The previous speaker-correct candidate was only slightly too slow. Preserve those strict identities while reading just a touch more quickly.")
    corrections.append("Read every transcript word exactly once and preserve the requested structural pauses.")
    return "\n".join(corrections)


def build_plan():
    initial_plan = review.read_json(review.INITIAL_DIR / "batch-request-plan.json")
    if not review.AUDIT_REPORT.exists():
        raise RuntimeError("Run the review audit before preparing a retry")
    audit = review.read_json(review.AUDIT_REPORT)
    rejected = {item["id"]: item for item in audit["items"] if not item["accepted"]}
    if not rejected:
        raise RuntimeError("All 30 items already pass QA; no retry is needed")
    items = []
    for base_item in initial_plan["baseItems"]:
        audit_item = rejected.get(base_item["id"])
        if not audit_item:
            continue
        count = PART1_RETRY_CANDIDATES if base_item["part"] == "Part 1" else PART2_RETRY_CANDIDATES
        for candidate_number in range(1, count + 1):
            item = copy.deepcopy(base_item)
            item["sourceItemId"] = base_item["id"]
            item["candidateNumber"] = candidate_number
            item["retryRound"] = RETRY_ROUND
            item["id"] = base_item["id"].replace(
                "-approved-gemini-",
                f"-approved-gemini-r{RETRY_ROUND}c{candidate_number}-",
            )
            item["prompt"] += correction_for(base_item, audit_item)
            if base_item["part"] == "Part 2":
                pace_deltas = [value["paceDelta"] for value in audit_item["candidates"]]
                if pace_deltas and sum(pace_deltas) / len(pace_deltas) < -review.PACE_TOLERANCE:
                    item["prompt"] = item["prompt"].replace(
                        "about 2.45 spoken words per second",
                        "about 2.75 spoken words per second",
                    )
                    item["prompt"] += (
                        f"\nFor this retry, do not exceed approximately {base_item['targetDurationSeconds'] + 1.0:.1f} seconds total. "
                        "Reach the duration through clear connected speech, not by removing the required structural pauses."
                    )
            items.append(item)
    configured = {voice for item in items for voice in item["voices"].values()}
    if configured & source.BANNED_VOICES:
        raise RuntimeError("Banned voice configured")
    return {
        **initial_plan,
        "createdAt": batch.utc_now(),
        "requestCount": len(items),
        "retryRound": RETRY_ROUND,
        "retryReason": "only items without a speaker-and-pace passing candidate",
        "sourceAuditAcceptedCount": audit["acceptedCount"],
        "items": items,
    }


def finalize_collection():
    report_path = OUTPUT_DIR / "generation-report.json"
    if report_path.exists():
        raise RuntimeError(f"Refusing to overwrite: {report_path}")
    status = batch.read_json(OUTPUT_DIR / "collection-status.json")
    plan = batch.read_json(OUTPUT_DIR / "batch-request-plan.json")
    batch.write_json(report_path, {
        "model": source.MODEL, "billingMode": "Batch API", "batchJob": status["batchJob"],
        "requestCount": plan["requestCount"], "successfulCount": len(status["items"]),
        "failureCount": len(status["failures"]), "failures": status["failures"],
        "format": {"container": "WAV", "codec": "PCM signed 16-bit", "sampleRate": 24000, "channels": 1},
        "postProcessing": {"speed": "none", "loudness": "none during collection", "silence": "boundary trim only"},
        "usageTotals": status["usageTotals"], "estimatedBatchCostUsd": status["estimatedBatchCostUsd"],
        "items": status["items"],
    })
    print(f"Finalized retry {RETRY_ROUND}: {len(status['items'])} successes, {len(status['failures'])} failures")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--round", type=int, required=True)
    parser.add_argument("command", choices=("prepare", "submit", "status", "collect-resume", "finalize"))
    args = parser.parse_args()
    if args.round < 1:
        raise RuntimeError("Retry round must be at least 1")
    configure(args.round)
    if args.command == "prepare": batch.prepare(OUTPUT_DIR); return 0
    if args.command == "submit": batch.submit(OUTPUT_DIR); return 0
    if args.command == "status": batch.status(OUTPUT_DIR); return 0
    if args.command == "collect-resume": return source.helpers.collect_resume(OUTPUT_DIR)
    finalize_collection(); return 0


if __name__ == "__main__":
    raise SystemExit(main())
