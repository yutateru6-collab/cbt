from pathlib import Path

import generate_grade2_sample_part2_gemini_batch_full as full


batch = full.batch
OUTPUT_DIR = Path(
    "audio-generation/grade2-sample-part2-gemini-3.1-flash-batch-zephyr-26-30-20260723"
)
ASSIGNMENTS = [
    {
        "number": number,
        "manifest": "audio-generation/grade2-sample-part2-rest.json",
        "voices": {"N": "Zephyr"},
    }
    for number in range(26, 31)
]


def build_plan():
    items = []
    for assignment in ASSIGNMENTS:
        item = batch.load_assigned_item(assignment)
        item["prompt"] = full.prompt_for(item)
        items.append(item)
    return {
        "schemaVersion": 1,
        "createdAt": batch.utc_now(),
        "model": batch.MODEL,
        "billingMode": "Batch API",
        "requestCount": len(items),
        "requestUnit": "one whole listening item per independent request",
        "voiceBlocks": [{"start": 26, "end": 30, "voice": "Zephyr"}],
        "paceInstructions": batch.PACE_INSTRUCTIONS,
        "pauseInstructions": {
            "afterNumberSeconds": 0.6,
            "beforeQuestion": "ordinary natural sentence-boundary timing only",
            "afterQuestionLabelSeconds": 0.4,
            "otherDeliberatePauses": "none",
        },
        "loudnessInstructions": "none; preserve the native Zephyr output",
        "postProcessing": {
            "speed": "none",
            "loudness": "none",
            "silence": "trim leading and trailing boundaries only",
        },
        "existingAudioPolicy": "never overwrite existing audio",
        "items": items,
    }


batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
batch.BATCH_DISPLAY_NAME = "grade2-sample-part2-zephyr-26-30-20260723"
batch.TEST_ASSIGNMENTS = ASSIGNMENTS
batch.prompt_for = full.prompt_for
batch.build_plan = build_plan


if __name__ == "__main__":
    raise SystemExit(batch.main())
