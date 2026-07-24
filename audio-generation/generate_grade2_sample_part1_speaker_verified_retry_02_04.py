import argparse
from pathlib import Path

import generate_grade2_sample_part1_speaker_verified_candidates as verified


OUTPUT_DIR = Path(
    "audio-generation/grade2-sample-part1-speaker-verified-retry-02-04-20260724"
)
BATCH_DISPLAY_NAME = "grade2-sample-part1-speaker-verified-retry-02-04-20260724"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Retry only Part 1 No.2 and No.4 with a slower generation target."
    )
    parser.add_argument("command", choices=("prepare", "submit", "status", "collect"))
    return parser.parse_args()


verified.OUTPUT_DIR = OUTPUT_DIR
verified.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
verified.NUMBERS = (2, 4)
verified.CANDIDATES_PER_ITEM = 2
# The first Batch rendered these items about 9-10% faster than instructed.
# This compensating prompt target is only for generation; final acceptance
# remains based on the measured 2.44 words/second target.
verified.TARGET_WORDS_PER_SECOND = 2.25

verified.batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
verified.batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
verified.batch.build_plan = verified.build_plan
verified.batch.prompt_for = verified.prompt_for
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
