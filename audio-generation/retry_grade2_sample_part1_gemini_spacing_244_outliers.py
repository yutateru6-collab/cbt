import argparse
from pathlib import Path

import generate_grade2_gemini_batch_test_five as batch


MODEL = "gemini-3.1-flash-tts-preview"
OUTPUT_DIR = Path(
    "audio-generation/grade2-sample-part1-gemini-spacing-244-retry-20260724"
)
BATCH_DISPLAY_NAME = "grade2-sample-part1-spacing-244-retry-20260724"
SOURCE_MANIFEST = "audio-generation/grade2-sample-part1-full.json"
VOICE_PAIR = {"A": "Kore", "B": "Puck"}
FINAL_TARGET_WORDS_PER_SECOND = 2.44
AFTER_NUMBER_SECONDS = 0.8
AFTER_QUESTION_SECONDS = 0.6
CALIBRATION_TARGETS = {
    1: 2.56,
    2: 2.30,
    4: 2.20,
}


def prompt_for(item):
    calibration_target = CALIBRATION_TARGETS[item["number"]]
    transcript = batch.transcript_for(item)
    return f"""Synthesize the exact dialogue below as audio for an English listening examination.
Do not speak these instructions, the speaker labels, or the transcript boundary labels.
Speaker A is an adult woman. Speaker B is an adult man.
Use natural American English suitable for Japanese high school learners.
Aim for an average spoken pace of approximately {calibration_target:.2f} words per second, excluding the two requested pauses.
Keep every speaker turn at that same steady pace. Do not let turn-taking make either speaker speed up or slow down.
{batch.PACE_INSTRUCTIONS[0]}
{batch.PACE_INSTRUCTIONS[1]}
After the Number line, pause clearly for about {AFTER_NUMBER_SECONDS:.1f} seconds before beginning the dialogue.
After saying "Question," pause clearly for about {AFTER_QUESTION_SECONDS:.1f} seconds before reading the question text.
Otherwise, keep the dialogue responsive and realistic with ordinary natural turn transitions.
Do not add any other deliberate pauses.
Use natural intonation without sounding theatrical or robotic.
Do not emphasize any detail in a way that reveals the answer.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.

TRANSCRIPT
{transcript}
END TRANSCRIPT"""


def build_plan():
    items = []
    for number in sorted(CALIBRATION_TARGETS):
        assignment = {
            "number": number,
            "manifest": SOURCE_MANIFEST,
            "voices": dict(VOICE_PAIR),
        }
        item = batch.load_assigned_item(assignment)
        item["prompt"] = prompt_for(item)
        item["calibrationTargetWordsPerSecond"] = CALIBRATION_TARGETS[number]
        items.append(item)
    return {
        "schemaVersion": 1,
        "createdAt": batch.utc_now(),
        "model": MODEL,
        "billingMode": "Batch API",
        "requestCount": len(items),
        "requestUnit": "one whole two-speaker listening item per independent request",
        "finalPaceTargetWordsPerSecond": FINAL_TARGET_WORDS_PER_SECOND,
        "calibrationTargetsWordsPerSecond": CALIBRATION_TARGETS,
        "pauseInstructions": {
            "afterNumberSeconds": AFTER_NUMBER_SECONDS,
            "afterQuestionLabelSeconds": AFTER_QUESTION_SECONDS,
        },
        "postProcessingPlan": {
            "speed": "none",
            "loudness": "measure after selection; constant whole-file gain only",
        },
        "existingAudioPolicy": "never overwrite existing audio or output directories",
        "items": items,
    }


def parse_args():
    parser = argparse.ArgumentParser(
        description="Retry only the Part 1 pace outliers without speed post-processing."
    )
    parser.add_argument("command", choices=("prepare", "submit", "status", "collect"))
    return parser.parse_args()


batch.MODEL = MODEL
batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
batch.prompt_for = prompt_for
batch.build_plan = build_plan


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
    return batch.collect(OUTPUT_DIR)


if __name__ == "__main__":
    raise SystemExit(main())
