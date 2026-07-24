import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

import generate_grade2_gemini_batch_test_five as batch


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = Path(
    "audio-generation/grade2-round1-to-3-part2-gemini-3.1-flash-batch-20260723"
)
BATCH_DISPLAY_NAME = "grade2-round1-to-3-part2-gemini31-20260723"
SET_KEYS = ("set-01", "set-02", "set-03")
VOICE_ROTATION = {
    "set-01": ((16, 20, "Achird"), (21, 25, "Zephyr"), (26, 30, "Kore")),
    "set-02": ((16, 20, "Zephyr"), (21, 25, "Kore"), (26, 30, "Achird")),
    "set-03": ((16, 20, "Kore"), (21, 25, "Achird"), (26, 30, "Zephyr")),
}
KORE_POST_GAIN_DB = -3.0
RETRY_DIR = Path(str(OUTPUT_DIR) + "-retry-01")
RETRY2_DIR = Path(str(OUTPUT_DIR) + "-retry-02-ascii-apostrophe")


def source_sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_part2_sets():
    node_script = r"""
const fs = require("fs");
const vm = require("vm");
const context = { window: {} };
vm.createContext(context);
for (const file of [
  "grade2-set-01.js",
  "grade2-vocab-sets.js",
  "grade2-listening-part2-sets.js",
  "exam-data.js",
]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}
const keys = ["set-01", "set-02", "set-03"];
const sets = context.window.examData.grades.grade2.sets
  .filter((set) => keys.includes(set.key))
  .sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key))
  .map((set) => ({
    key: set.key,
    label: set.label,
    questions: set.listeningQuestions
      .filter((question) => question.part === "Part 2")
      .map((question) => ({
        id: Number(question.id),
        script: question.script,
        questionText: question.questionText,
      })),
  }));
process.stdout.write(JSON.stringify(sets));
"""
    completed = subprocess.run(
        ["node", "-e", node_script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(completed.stdout)


def voice_for(set_key, number):
    for start, end, voice in VOICE_ROTATION[set_key]:
        if start <= number <= end:
            return voice
    raise RuntimeError(f"No voice assignment for {set_key} No.{number}")


def validate_sets(exam_sets):
    if [exam_set["key"] for exam_set in exam_sets] != list(SET_KEYS):
        raise RuntimeError(
            f"Expected {list(SET_KEYS)}, found {[exam_set['key'] for exam_set in exam_sets]}"
        )

    seen_ids = set()
    for exam_set in exam_sets:
        questions = exam_set["questions"]
        numbers = [question["id"] for question in questions]
        if numbers != list(range(16, 31)):
            raise RuntimeError(
                f"{exam_set['key']}: expected No.16-No.30, found {numbers}"
            )
        for question in questions:
            item_id = f"{exam_set['key']}-No{question['id']:02d}"
            if item_id in seen_ids:
                raise RuntimeError(f"Duplicate item id: {item_id}")
            seen_ids.add(item_id)
            if not str(question["script"]).strip():
                raise RuntimeError(f"{item_id}: script missing")
            if not str(question["questionText"]).strip():
                raise RuntimeError(f"{item_id}: question text missing")

    if len(seen_ids) != 45:
        raise RuntimeError(f"Expected 45 unique items, found {len(seen_ids)}")


def prompt_for(item):
    transcript = batch.transcript_for(item)
    return f"""Synthesize the exact transcript below as audio for an English listening examination.
Do not speak these instructions or the transcript boundary labels.
Use one adult narrator throughout.
Use natural American English suitable for Japanese high school learners.
{batch.PACE_INSTRUCTIONS[0]}
{batch.PACE_INSTRUCTIONS[1]}
After the Number line, pause briefly for about 0.6 seconds before beginning the body.
After saying "Question," pause briefly for about 0.4 seconds before reading the question text.
Otherwise, read continuously with ordinary natural sentence-boundary timing.
Do not add any other deliberate pauses.
Use natural intonation without sounding theatrical or robotic.
Do not emphasize any detail in a way that reveals the answer.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.

TRANSCRIPT
{transcript}
END TRANSCRIPT"""


def build_plan():
    exam_sets = load_part2_sets()
    validate_sets(exam_sets)

    items = []
    for exam_set in exam_sets:
        for question in exam_set["questions"]:
            number = int(question["id"])
            item = {
                "id": f"{exam_set['key']}-No{number:02d}",
                "setKey": exam_set["key"],
                "setLabel": exam_set["label"],
                "number": number,
                "segments": [
                    {
                        "speaker": "N",
                        "text": f"Number {number}.",
                    },
                    {
                        "speaker": "N",
                        "text": str(question["script"]).strip(),
                    },
                    {
                        "speaker": "N",
                        "text": f"Question. {str(question['questionText']).strip()}",
                    },
                ],
                "voices": {"N": voice_for(exam_set["key"], number)},
                "mode": "narration",
            }
            item["prompt"] = prompt_for(item)
            items.append(item)

    source_files = [
        ROOT / "grade2-set-01.js",
        ROOT / "grade2-vocab-sets.js",
        ROOT / "grade2-listening-part2-sets.js",
        ROOT / "exam-data.js",
    ]
    return {
        "schemaVersion": 1,
        "createdAt": batch.utc_now(),
        "model": batch.MODEL,
        "billingMode": "Batch API",
        "requestCount": len(items),
        "requestLimit": 45,
        "requestUnit": "one whole listening item per independent request",
        "sets": list(SET_KEYS),
        "voiceRotation": {
            set_key: [
                {"start": start, "end": end, "voice": voice}
                for start, end, voice in VOICE_ROTATION[set_key]
            ]
            for set_key in SET_KEYS
        },
        "paceInstructions": batch.PACE_INSTRUCTIONS,
        "pauseInstructions": {
            "afterNumberSeconds": 0.6,
            "beforeQuestion": "ordinary natural sentence-boundary timing only",
            "afterQuestionLabelSeconds": 0.4,
            "otherDeliberatePauses": "none",
        },
        "postProcessingPlan": {
            "speed": "none",
            "loudness": {
                "Kore": f"{KORE_POST_GAIN_DB:.1f} dB whole-file gain after collection",
                "Achird": "none",
                "Zephyr": "none",
            },
            "silence": "trim leading and trailing boundaries only during collection",
            "normalization": "none",
            "eq": "none",
            "compression": "none",
        },
        "sourceFiles": [
            {
                "path": str(path.relative_to(ROOT)).replace("\\", "/"),
                "sha256": source_sha256(path),
            }
            for path in source_files
        ],
        "existingAudioPolicy": "never overwrite existing audio or output directories",
        "items": items,
    }


batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
batch.prompt_for = prompt_for
batch.build_plan = build_plan


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate Grade 2 rounds 1-3 Part 2 with Gemini Batch TTS."
    )
    parser.add_argument(
        "command",
        choices=(
            "prepare",
            "submit",
            "status",
            "collect",
            "collect-resume",
            "prepare-retry",
            "submit-retry",
            "status-retry",
            "collect-retry",
            "merge-retry",
            "prepare-retry2",
            "submit-retry2",
            "status-retry2",
            "collect-retry2",
            "merge-retries",
        ),
    )
    return parser.parse_args()


def response_error_dict(inline_response):
    if not inline_response.error:
        return None
    return inline_response.error.model_dump(
        mode="json", by_alias=True, exclude_none=True
    )


def collect_resume(output_dir):
    report_path = output_dir / "generation-report.json"
    if report_path.exists():
        raise RuntimeError(f"Results were already finalized: {report_path}")
    job, record = batch.get_job(output_dir)
    print(f"State: {record['state']}")
    if record["state"] not in batch.TERMINAL_STATES:
        print("Batch job is not finished yet")
        return 3
    if record["state"] not in batch.SUCCESS_STATES:
        raise RuntimeError(f"Batch job did not succeed: {record['state']}")

    responses = (job.dest.inlined_responses if job.dest else None) or []
    plan = batch.read_json(output_dir / "batch-request-plan.json")
    if len(responses) != len(plan["items"]):
        raise RuntimeError(
            f"Expected {len(plan['items'])} inline responses, received {len(responses)}"
        )

    report_items = []
    failures = []
    totals = {"promptTokens": 0, "outputAudioTokens": 0, "totalTokens": 0}
    for expected_item, inline_response in zip(plan["items"], responses):
        response_id = (inline_response.metadata or {}).get("id")
        if response_id and response_id != expected_item["id"]:
            raise RuntimeError(
                f"Response order mismatch: expected {expected_item['id']}, got {response_id}"
            )
        error = response_error_dict(inline_response)
        if error or not inline_response.response:
            failures.append(
                {
                    "id": expected_item["id"],
                    "number": expected_item["number"],
                    "setKey": expected_item["setKey"],
                    "error": error or {"message": "No response returned"},
                }
            )
            print(f"Failed {expected_item['id']}: {json.dumps(failures[-1]['error'])}")
            continue

        output_path = output_dir / f"{expected_item['id']}.wav"
        if output_path.exists():
            wav_info = batch.audio_utils.inspect_wav(output_path)
            print(f"Reused {output_path} ({wav_info['durationSeconds']}s)")
            source_mime_type = "audio/L16;rate=24000"
            trim_report = {"reusedExistingCollectedWav": True}
        else:
            pcm_raw, source_mime_type = batch.audio_utils.extract_pcm(
                inline_response.response
            )
            pcm, trim_report = batch.audio_utils.trim_silence(pcm_raw)
            batch.audio_utils.write_wav(output_path, pcm)
            wav_info = batch.audio_utils.inspect_wav(output_path)
            print(f"Saved {output_path} ({wav_info['durationSeconds']}s)")

        if (
            wav_info["sampleRate"] != batch.audio_utils.SAMPLE_RATE
            or wav_info["channels"] != batch.audio_utils.CHANNELS
            or wav_info["sampleWidth"] != batch.audio_utils.SAMPLE_WIDTH
        ):
            raise RuntimeError(f"Unexpected WAV format: {output_path}")

        usage = batch.usage_dict(inline_response.response)
        for key in totals:
            totals[key] += usage[key]
        report_items.append(
            {
                "id": expected_item["id"],
                "number": expected_item["number"],
                "setKey": expected_item["setKey"],
                "setLabel": expected_item["setLabel"],
                "voices": expected_item["voices"],
                "file": output_path.name,
                "bytes": output_path.stat().st_size,
                "sha256": hashlib.sha256(output_path.read_bytes()).hexdigest(),
                "sourceMimeType": source_mime_type,
                "boundaryTrim": trim_report,
                "usage": usage,
                **wav_info,
            }
        )

    estimated_input_usd = totals["promptTokens"] * 0.50 / 1_000_000
    estimated_output_usd = totals["outputAudioTokens"] * 10.00 / 1_000_000
    status_report = {
        "model": batch.MODEL,
        "billingMode": "Batch API",
        "batchJob": record,
        "plannedRequestCount": len(plan["items"]),
        "successfulRequestCount": len(report_items),
        "failedRequestCount": len(failures),
        "usageTotals": totals,
        "estimatedBatchCostUsd": {
            "input": round(estimated_input_usd, 8),
            "outputAudio": round(estimated_output_usd, 8),
            "total": round(estimated_input_usd + estimated_output_usd, 8),
        },
        "items": report_items,
        "failures": failures,
    }
    batch.write_json(output_dir / "collection-status.json", status_report)
    print(
        f"Collected {len(report_items)} successful item(s); "
        f"{len(failures)} failure(s)"
    )
    return 4 if failures else finalize_without_retry(output_dir, status_report)


def finalize_without_retry(output_dir, status_report):
    final_report = {
        "model": status_report["model"],
        "billingMode": status_report["billingMode"],
        "batchJob": status_report["batchJob"],
        "retryJobs": [],
        "requestCount": len(status_report["items"]),
        "paceInstructions": batch.PACE_INSTRUCTIONS,
        "format": {
            "sampleRate": batch.audio_utils.SAMPLE_RATE,
            "channels": batch.audio_utils.CHANNELS,
            "sampleWidth": batch.audio_utils.SAMPLE_WIDTH,
            "encoding": "PCM signed 16-bit little-endian WAV",
        },
        "postProcessing": {
            "speed": "none",
            "loudness": "none during collection",
            "silence": "leading and trailing boundary trim only",
        },
        "usageTotals": status_report["usageTotals"],
        "estimatedBatchCostUsd": status_report["estimatedBatchCostUsd"],
        "items": status_report["items"],
    }
    batch.write_json(output_dir / "generation-report.json", final_report)
    return 0


def prepare_retry():
    if RETRY_DIR.exists():
        raise RuntimeError(f"Refusing to overwrite retry directory: {RETRY_DIR}")
    status_path = OUTPUT_DIR / "collection-status.json"
    if not status_path.exists():
        raise RuntimeError(f"Collect the original results first: {status_path}")
    status_report = batch.read_json(status_path)
    failure_ids = [failure["id"] for failure in status_report["failures"]]
    if not failure_ids:
        raise RuntimeError("There are no failed requests to retry")
    original_plan = batch.read_json(OUTPUT_DIR / "batch-request-plan.json")
    retry_items = [
        item for item in original_plan["items"] if item["id"] in failure_ids
    ]
    if len(retry_items) != len(failure_ids):
        raise RuntimeError("Retry items do not match the failure list")
    RETRY_DIR.mkdir(parents=True, exist_ok=False)
    retry_plan = {
        **original_plan,
        "createdAt": batch.utc_now(),
        "requestCount": len(retry_items),
        "requestLimit": len(retry_items),
        "retryOf": status_report["batchJob"]["name"],
        "items": retry_items,
    }
    batch.write_json(RETRY_DIR / "batch-request-plan.json", retry_plan)
    print(f"Prepared retry for: {', '.join(failure_ids)}")


def sum_usage(first, second):
    return {
        key: int(first.get(key, 0)) + int(second.get(key, 0))
        for key in ("promptTokens", "outputAudioTokens", "totalTokens")
    }


def sum_cost(first, second):
    return {
        key: round(float(first.get(key, 0)) + float(second.get(key, 0)), 8)
        for key in ("input", "outputAudio", "total")
    }


def merge_retry():
    final_path = OUTPUT_DIR / "generation-report.json"
    if final_path.exists():
        raise RuntimeError(f"Final report already exists: {final_path}")
    status_report = batch.read_json(OUTPUT_DIR / "collection-status.json")
    retry_report = batch.read_json(RETRY_DIR / "generation-report.json")
    original_plan = batch.read_json(OUTPUT_DIR / "batch-request-plan.json")

    records = {item["id"]: item for item in status_report["items"]}
    for item in retry_report["items"]:
        source_path = RETRY_DIR / item["file"]
        destination_path = OUTPUT_DIR / item["file"]
        if destination_path.exists():
            raise RuntimeError(f"Refusing to overwrite retry destination: {destination_path}")
        shutil.copy2(source_path, destination_path)
        records[item["id"]] = {
            **item,
            "setKey": next(
                plan_item["setKey"]
                for plan_item in original_plan["items"]
                if plan_item["id"] == item["id"]
            ),
            "setLabel": next(
                plan_item["setLabel"]
                for plan_item in original_plan["items"]
                if plan_item["id"] == item["id"]
            ),
        }

    ordered_records = [records[item["id"]] for item in original_plan["items"]]
    if len(ordered_records) != 45:
        raise RuntimeError(f"Expected 45 merged results, found {len(ordered_records)}")
    final_report = {
        "model": batch.MODEL,
        "billingMode": "Batch API",
        "batchJob": status_report["batchJob"],
        "retryJobs": [retry_report["batchJob"]],
        "requestCount": len(ordered_records),
        "paceInstructions": batch.PACE_INSTRUCTIONS,
        "format": retry_report["format"],
        "postProcessing": {
            "speed": "none",
            "loudness": "none during collection",
            "silence": "leading and trailing boundary trim only",
        },
        "usageTotals": sum_usage(
            status_report["usageTotals"], retry_report["usageTotals"]
        ),
        "estimatedBatchCostUsd": sum_cost(
            status_report["estimatedBatchCostUsd"],
            retry_report["estimatedBatchCostUsd"],
        ),
        "items": ordered_records,
    }
    batch.write_json(final_path, final_report)
    print(f"Merged {len(ordered_records)} results into {final_path}")


def prepare_retry2():
    if RETRY2_DIR.exists():
        raise RuntimeError(f"Refusing to overwrite retry directory: {RETRY2_DIR}")
    retry1_status_path = RETRY_DIR / "collection-status.json"
    if not retry1_status_path.exists():
        raise RuntimeError(f"Collect retry 1 first: {retry1_status_path}")
    retry1_status = batch.read_json(retry1_status_path)
    failure_ids = [failure["id"] for failure in retry1_status["failures"]]
    if failure_ids != ["set-02-No29"]:
        raise RuntimeError(f"Expected only set-02-No29, found {failure_ids}")

    original_plan = batch.read_json(OUTPUT_DIR / "batch-request-plan.json")
    source_item = next(
        item for item in original_plan["items"] if item["id"] == failure_ids[0]
    )
    retry_item = json.loads(json.dumps(source_item))
    replacements = 0
    for segment in retry_item["segments"]:
        replacements += segment["text"].count("\u2019")
        segment["text"] = segment["text"].replace("\u2019", "'")
    replacements += retry_item["prompt"].count("\u2019")
    retry_item["prompt"] = retry_item["prompt"].replace("\u2019", "'")
    if replacements < 2:
        raise RuntimeError("Expected an apostrophe in both segments and prompt")
    retry_item["ttsCharacterNormalization"] = {
        "from": "U+2019 RIGHT SINGLE QUOTATION MARK",
        "to": "U+0027 APOSTROPHE",
        "spokenContentChanged": False,
    }

    RETRY2_DIR.mkdir(parents=True, exist_ok=False)
    retry_plan = {
        **original_plan,
        "createdAt": batch.utc_now(),
        "requestCount": 1,
        "requestLimit": 1,
        "retryOf": retry1_status["batchJob"]["name"],
        "characterNormalization": retry_item["ttsCharacterNormalization"],
        "items": [retry_item],
    }
    batch.write_json(RETRY2_DIR / "batch-request-plan.json", retry_plan)
    print(f"Prepared retry 2 for: {retry_item['id']}")


def merge_retries():
    final_path = OUTPUT_DIR / "generation-report.json"
    if final_path.exists():
        raise RuntimeError(f"Final report already exists: {final_path}")
    original_status = batch.read_json(OUTPUT_DIR / "collection-status.json")
    retry1_status = batch.read_json(RETRY_DIR / "collection-status.json")
    retry2_report = batch.read_json(RETRY2_DIR / "generation-report.json")
    original_plan = batch.read_json(OUTPUT_DIR / "batch-request-plan.json")

    records = {item["id"]: item for item in original_status["items"]}
    retry_sources = [
        (RETRY_DIR, retry1_status["items"]),
        (RETRY2_DIR, retry2_report["items"]),
    ]
    for source_dir, source_items in retry_sources:
        for item in source_items:
            source_path = source_dir / item["file"]
            destination_path = OUTPUT_DIR / item["file"]
            if destination_path.exists():
                raise RuntimeError(
                    f"Refusing to overwrite retry destination: {destination_path}"
                )
            shutil.copy2(source_path, destination_path)
            plan_item = next(
                candidate
                for candidate in original_plan["items"]
                if candidate["id"] == item["id"]
            )
            records[item["id"]] = {
                **item,
                "setKey": plan_item["setKey"],
                "setLabel": plan_item["setLabel"],
            }

    ordered_records = [records[item["id"]] for item in original_plan["items"]]
    if len(ordered_records) != 45 or len(records) != 45:
        raise RuntimeError(f"Expected 45 merged results, found {len(records)}")
    usage = sum_usage(
        sum_usage(original_status["usageTotals"], retry1_status["usageTotals"]),
        retry2_report["usageTotals"],
    )
    cost = sum_cost(
        sum_cost(
            original_status["estimatedBatchCostUsd"],
            retry1_status["estimatedBatchCostUsd"],
        ),
        retry2_report["estimatedBatchCostUsd"],
    )
    final_report = {
        "model": batch.MODEL,
        "billingMode": "Batch API",
        "batchJob": original_status["batchJob"],
        "retryJobs": [
            retry1_status["batchJob"],
            retry2_report["batchJob"],
        ],
        "requestCount": len(ordered_records),
        "paceInstructions": batch.PACE_INSTRUCTIONS,
        "format": retry2_report["format"],
        "postProcessing": {
            "speed": "none",
            "loudness": "none during collection",
            "silence": "leading and trailing boundary trim only",
            "characterNormalization": {
                "item": "set-02-No29",
                "from": "U+2019 RIGHT SINGLE QUOTATION MARK",
                "to": "U+0027 APOSTROPHE",
                "spokenContentChanged": False,
            },
        },
        "usageTotals": usage,
        "estimatedBatchCostUsd": cost,
        "items": ordered_records,
    }
    batch.write_json(final_path, final_report)
    print(f"Merged {len(ordered_records)} results into {final_path}")


def main():
    args = parse_args()
    if args.command == "prepare":
        batch.prepare(OUTPUT_DIR)
        return 0
    if args.command == "submit":
        batch.submit(OUTPUT_DIR)
        return 0
    if args.command == "status":
        batch.status(OUTPUT_DIR)
        return 0
    if args.command == "collect":
        return batch.collect(OUTPUT_DIR)
    if args.command == "collect-resume":
        return collect_resume(OUTPUT_DIR)
    if args.command == "prepare-retry":
        prepare_retry()
        return 0

    batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME + "-retry-01"
    if args.command == "submit-retry":
        batch.submit(RETRY_DIR)
        return 0
    if args.command == "status-retry":
        batch.status(RETRY_DIR)
        return 0
    if args.command == "collect-retry":
        return batch.collect(RETRY_DIR)
    if args.command == "merge-retry":
        merge_retry()
        return 0
    if args.command == "prepare-retry2":
        prepare_retry2()
        return 0

    batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME + "-retry-02"
    if args.command == "submit-retry2":
        batch.submit(RETRY2_DIR)
        return 0
    if args.command == "status-retry2":
        batch.status(RETRY2_DIR)
        return 0
    if args.command == "collect-retry2":
        return batch.collect(RETRY2_DIR)
    merge_retries()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
