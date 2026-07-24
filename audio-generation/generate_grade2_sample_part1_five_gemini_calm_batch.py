import argparse
from pathlib import Path

import generate_grade2_gemini_batch_test_five as batch


MODEL = "gemini-3.1-flash-tts-preview"
OUTPUT_DIR = Path(
    "audio-generation/grade2-sample-part1-five-gemini-calm-batch-20260724"
)
BATCH_DISPLAY_NAME = "grade2-sample-part1-five-calm-20260724"
SOURCE_MANIFEST = "audio-generation/grade2-sample-part1-full.json"
VOICE_PAIR = {"A": "Kore", "B": "Puck"}
NUMBERS = range(1, 6)


def prompt_for(item):
    transcript = batch.transcript_for(item)
    return f"""Synthesize the exact dialogue below as audio for an English listening examination.
Do not speak these instructions, the speaker labels, or the transcript boundary labels.
Speaker A is an adult woman. Speaker B is an adult man.
Use natural American English suitable for Japanese high school learners.
Use a calm, measured listening-exam pace comparable to a single-speaker narration.
Keep every speaker turn at the same calm pace. Do not let turn-taking make either speaker speed up.
{batch.PACE_INSTRUCTIONS[0]}
{batch.PACE_INSTRUCTIONS[1]}
After the Number line, pause briefly for about 0.6 seconds before beginning the dialogue.
After saying "Question," pause briefly for about 0.4 seconds before reading the question text.
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
    for number in NUMBERS:
        assignment = {
            "number": number,
            "manifest": SOURCE_MANIFEST,
            "voices": dict(VOICE_PAIR),
        }
        item = batch.load_assigned_item(assignment)
        item["prompt"] = prompt_for(item)
        items.append(item)
    return {
        "schemaVersion": 1,
        "createdAt": batch.utc_now(),
        "model": MODEL,
        "billingMode": "Batch API",
        "requestCount": len(items),
        "requestUnit": "one whole two-speaker listening item per independent request",
        "voiceBlock": {
            "numbers": [1, 2, 3, 4, 5],
            "voices": VOICE_PAIR,
            "reason": "keep one pair for the five-question block",
        },
        "paceInstructions": [
            "Use a calm, measured listening-exam pace comparable to a single-speaker narration.",
            "Keep every speaker turn at the same calm pace. Do not let turn-taking make either speaker speed up.",
            *batch.PACE_INSTRUCTIONS,
        ],
        "paceReference": {
            "approvedPart2MedianWordsPerSecond": 2.219,
            "priorFastPart1RangeWordsPerSecond": [2.466, 2.830],
            "priorImprovedPart1WordsPerSecond": 2.341,
        },
        "pauseInstructions": {
            "afterNumberSeconds": 0.6,
            "beforeQuestion": "ordinary natural sentence-boundary timing only",
            "afterQuestionLabelSeconds": 0.4,
            "otherDeliberatePauses": "none",
        },
        "postProcessingPlan": {
            "speed": "none; regenerate an outlier instead of time-stretching",
            "loudness": (
                "preserve native files, measure speech-active RMS, then create separate "
                "constant-gain delivery copies near -18.6 dBFS"
            ),
            "normalization": "none",
            "eq": "none",
            "compression": "none",
        },
        "existingAudioPolicy": "never overwrite existing audio or output directories",
        "items": items,
    }


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate sample Grade 2 Part 1 No.1-5 with calm Gemini Batch TTS."
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
