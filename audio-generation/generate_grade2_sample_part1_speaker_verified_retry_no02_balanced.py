import argparse
from pathlib import Path

import generate_grade2_sample_part1_speaker_verified_candidates as verified


OUTPUT_DIR = Path(
    "audio-generation/grade2-sample-part1-speaker-verified-retry-no02-balanced-20260724"
)
BATCH_DISPLAY_NAME = (
    "grade2-sample-part1-speaker-verified-retry-no02-balanced-20260724"
)


def balanced_prompt_for(item):
    transcript = "\n".join(
        f"{segment['speaker']}: {segment['text']}"
        for segment in item["segments"]
    )
    return f"""Synthesize the exact two-person dialogue below as audio for an English listening examination.
Do not speak these instructions, the speaker labels, or the transcript boundary labels.
Woman is one adult woman and must always use the assigned Woman voice.
Man is one adult man and must always use the assigned Man voice.
Every Woman-labeled line must use only the same Woman voice.
Every Man-labeled line must use only the same Man voice.
Never merge, substitute, swap, imitate, or transfer the two voices.
Never let either speaker read a line assigned to the other speaker.
The difference between the adult woman and adult man must remain clearly audible in every turn.
Use natural American English suitable for Japanese high school learners.
Speak each sentence at a calm conversational pace that is only slightly slower than ordinary conversation.
Keep the complete recording between 32.5 and 34.5 seconds.
Do not create long extra pauses to meet the duration; adjust the spoken pace naturally.
Maintain a steady pace.
Do not rush, accelerate, over-enunciate, or stretch individual words.
After the Number line, pause clearly for about {verified.AFTER_NUMBER_SECONDS:.2f} seconds.
At each change between Woman and Man, use a brief natural pause of about {verified.BETWEEN_TURNS_SECONDS:.2f} seconds.
After saying "Question," pause clearly for about {verified.AFTER_QUESTION_SECONDS:.2f} seconds before reading the question text.
Do not add other deliberate pauses.
Use natural intonation without sounding theatrical or robotic.
Do not emphasize any detail in a way that reveals the answer.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.

TRANSCRIPT
{transcript}
END TRANSCRIPT"""


def parse_args():
    parser = argparse.ArgumentParser(
        description="Retry only Part 1 No.2 at the balanced target pace."
    )
    parser.add_argument("command", choices=("prepare", "submit", "status", "collect"))
    return parser.parse_args()


verified.OUTPUT_DIR = OUTPUT_DIR
verified.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
verified.NUMBERS = (2,)
verified.CANDIDATES_PER_ITEM = 1
verified.TARGET_WORDS_PER_SECOND = 2.44
verified.prompt_for = balanced_prompt_for

verified.batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
verified.batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
verified.batch.build_plan = verified.build_plan
verified.batch.prompt_for = balanced_prompt_for
verified.batch.speech_config_for = verified.speech_config_for


def main():
    args = parse_args()
    if args.command == "prepare":
        verified.batch.prepare(OUTPUT_DIR)
        return 0
    if args.command == "submit":
        verified.batch.submit(OUTPUT_DIR)
        return 0
    if args.command == "status":
        verified.batch.status(OUTPUT_DIR)
        return 0
    return verified.collect_resilient()


if __name__ == "__main__":
    raise SystemExit(main())
