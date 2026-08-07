import argparse
import copy
import hashlib
from pathlib import Path

import generate_grade2_gemini_batch_test_five as batch
import generate_grade2_set02_full_approved_gemini_20260806 as source


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = Path("audio-generation/grade2-set02-user-corrections-20260807")
BATCH_DISPLAY_NAME = "grade2-set02-user-corrections-20260807"
CANDIDATES_PER_ITEM = 12
TARGET_NUMBERS = (1, 10)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def correction_prompt(base_item):
    prompt = source.part1_prompt(base_item)
    number = base_item["number"]
    correction = f'''\n\nUSER-LISTENING CORRECTION FOR NUMBER {number}
Begin the first dialogue turn 0.75 to 1.05 seconds after finishing the Number line.
The pause after the Number line must never exceed 1.30 seconds. A long opening silence is an error.
Keep the requested calm-medium pace in the spoken words themselves; never use silence to reach the target duration.
Puck must sound unmistakably like a low-pitched adult man throughout both of his turns, with a stable, grounded male register around 125 to 145 Hz. Never let Puck drift toward Kore's brighter female register.
Kore must remain an unmistakable adult woman throughout both of her turns.
Preserve natural connected speech and the previously approved speed: clear, calm-medium, and only a touch quicker than a careful reading.'''
    if number == 1:
        correction += "\nThis correction especially prioritizes a clearly masculine Puck voice on both male turns."
    if number == 10:
        correction += "\nThis correction especially prioritizes a short, natural pause immediately after saying Number 10."
    return prompt + correction


def build_plan():
    base_items = [
        item for item in source.load_base_items()
        if item["part"] == "Part 1" and item["number"] in TARGET_NUMBERS
    ]
    if [item["number"] for item in base_items] != list(TARGET_NUMBERS):
        raise RuntimeError(f"Unexpected correction items: {[item['number'] for item in base_items]}")

    items = []
    for base_item in base_items:
        corrected_base = copy.deepcopy(base_item)
        corrected_base["prompt"] = correction_prompt(corrected_base)
        for candidate_number in range(1, CANDIDATES_PER_ITEM + 1):
            item = copy.deepcopy(corrected_base)
            item["sourceItemId"] = base_item["id"]
            item["candidateNumber"] = candidate_number
            item["id"] = (
                f"set-02-part1-No{base_item['number']:02d}-user-correction-"
                f"c{candidate_number:02d}-20260807"
            )
            items.append(item)

    sources = [
        ROOT / "grade2-listening-part2-sets.js",
        ROOT / "audio-generation" / "listening-voice-notes.md",
        ROOT / "audio-generation" / "generate_grade2_set02_full_approved_gemini_20260806.py",
    ]
    return {
        "schemaVersion": 1,
        "createdAt": batch.utc_now(),
        "model": source.MODEL,
        "billingMode": "Batch API",
        "requestCount": len(items),
        "requestUnit": "one whole Part 1 item per request",
        "scope": {"set": "set-02", "part1": list(TARGET_NUMBERS)},
        "candidateCountPerItem": CANDIDATES_PER_ITEM,
        "voices": source.PART1_VOICES,
        "bannedVoices": sorted(source.BANNED_VOICES),
        "acceptanceIntent": {
            "effectiveWordsPerSecond": source.PART1_TARGET_WPS,
            "paceTolerance": 0.18,
            "afterNumberPauseSeconds": {"minimum": 0.65, "target": 0.90, "maximum": 1.30},
            "No01PuckMaximumTurnMedianF0Hz": 150.0,
            "No01PuckTargetMedianF0Hz": 145.0,
            "speedPostProcessing": "none",
        },
        "sourceFiles": [
            {"path": str(path.relative_to(ROOT)).replace("\\", "/"), "sha256": sha256(path)}
            for path in sources
        ],
        "existingAudioPolicy": "never overwrite prior generation or production R2 audio",
        "baseItems": base_items,
        "items": items,
    }


batch.MODEL = source.MODEL
batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
batch.build_plan = build_plan
batch.prompt_for = lambda item: item["prompt"]
batch.speech_config_for = source.speech_config_for


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("prepare", "submit", "status", "collect-resume"))
    command = parser.parse_args().command
    if command == "prepare":
        batch.prepare(OUTPUT_DIR)
        return 0
    if command == "submit":
        batch.submit(OUTPUT_DIR)
        return 0
    if command == "status":
        batch.status(OUTPUT_DIR)
        return 0
    return source.helpers.collect_resume(OUTPUT_DIR)


if __name__ == "__main__":
    raise SystemExit(main())
