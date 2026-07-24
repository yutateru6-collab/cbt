from pathlib import Path

import generate_grade2_gemini_batch_test_five as batch


OUTPUT_DIR = Path(
    "audio-generation/grade2-sample-part2-gemini-3.1-flash-batch-full-20260723"
)
VOICE_BLOCKS = (
    (16, 20, "Kore"),
    (21, 25, "Achird"),
    (26, 30, "Leda"),
)


def voice_for(number):
    for start, end, voice in VOICE_BLOCKS:
        if start <= number <= end:
            return voice
    raise RuntimeError(f"No voice assignment for No.{number}")


def manifest_for(number):
    if number == 16:
        return "audio-generation/grade2-sample-part2-pilot.json"
    return "audio-generation/grade2-sample-part2-rest.json"


ASSIGNMENTS = [
    {
        "number": number,
        "manifest": manifest_for(number),
        "voices": {"N": voice_for(number)},
    }
    for number in range(16, 31)
]


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
    items = []
    for assignment in ASSIGNMENTS:
        item = batch.load_assigned_item(assignment)
        item["prompt"] = prompt_for(item)
        items.append(item)
    return {
        "schemaVersion": 1,
        "createdAt": batch.utc_now(),
        "model": batch.MODEL,
        "billingMode": "Batch API",
        "requestCount": len(items),
        "requestUnit": "one whole listening item per independent request",
        "voiceBlocks": [
            {"start": start, "end": end, "voice": voice}
            for start, end, voice in VOICE_BLOCKS
        ],
        "paceInstructions": batch.PACE_INSTRUCTIONS,
        "pauseInstructions": {
            "afterNumberSeconds": 0.6,
            "beforeQuestion": "ordinary natural sentence-boundary timing only",
            "afterQuestionLabelSeconds": 0.4,
            "otherDeliberatePauses": "none",
        },
        "postProcessing": {
            "speed": "none",
            "loudness": "none",
            "silence": "trim leading and trailing boundaries only",
        },
        "existingAudioPolicy": "never overwrite existing audio",
        "items": items,
    }


batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
batch.BATCH_DISPLAY_NAME = "grade2-sample-part2-gemini31-full-20260723"
batch.TEST_ASSIGNMENTS = ASSIGNMENTS
batch.prompt_for = prompt_for
batch.build_plan = build_plan


if __name__ == "__main__":
    raise SystemExit(batch.main())
