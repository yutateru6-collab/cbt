from __future__ import annotations

import argparse
import html
import json
import shutil
from pathlib import Path

import generate_grade2_round1_simba_final_part1_part2_five as base


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-simba-part2-pair-hugh-three-20260719"
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-round1-simba-part2-pair-hugh-three-20260719"
)
RANGE_WORKER = ROOT / "audio-generation/cloudflare-wav-range-worker.js"

GEFFEN = {**base.GEFFEN, "language": "en-US"}
DOMINIC = {**base.DOMINIC, "language": "en-US"}
HUGH = {
    "id": "hugh_32",
    "name": "Hugh",
    "gender": "male",
    "language": "en-US",
}

PART2_NUMBERS = (16, 17, 18)
PART2_VOICE_PLANS = {
    16: {"body": GEFFEN, "narrator": HUGH},
    17: {"body": DOMINIC, "narrator": HUGH},
    18: {"body": GEFFEN, "narrator": HUGH},
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate Part 2 No.16-18 with Geffen and Dominic for the whole "
            "body and Hugh fixed for Number and Question."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def configure_base() -> None:
    base.LANGUAGE = "en-US"
    base.PART1_NUMBERS = ()
    base.PART2_NUMBERS = PART2_NUMBERS
    base.PART2_VOICE_PLANS = PART2_VOICE_PLANS
    base.APPROVED_VOICES = {GEFFEN["id"], DOMINIC["id"], HUGH["id"]}
    base.AUDIO_CACHE_VERSION = "20260719-part2-pair-hugh-three1"

    original_part2_segments = base.part2_segments

    def part2_segments_with_slow_number(item: dict) -> list[dict]:
        rows = original_part2_segments(item)
        number = rows[0]
        number["rate"] = base.QUESTION_RATE
        number["input"] = base.prosody_ssml(number["ttsText"], base.QUESTION_RATE)
        return rows

    def assert_input_contract_with_slow_number(item: dict, rows: list[dict]) -> None:
        if [row["role"] for row in rows] != ["number", "body", "question"]:
            raise RuntimeError(f"Unexpected request units in {item['id']}")
        if [row["gapAfterMs"] for row in rows] != [
            base.NUMBER_TO_BODY_MS,
            base.BODY_TO_QUESTION_MS,
            0,
        ]:
            raise RuntimeError(f"Unexpected gap plan in {item['id']}")
        if rows[0]["voice"]["id"] != HUGH["id"] or rows[2]["voice"]["id"] != HUGH["id"]:
            raise RuntimeError(f"Hugh is not fixed for Number and Question in {item['id']}")
        if rows[1]["voice"]["id"] not in {GEFFEN["id"], DOMINIC["id"]}:
            raise RuntimeError(f"Unexpected body voice in {item['id']}")
        expected_rates = {
            "number": base.QUESTION_RATE,
            "body": base.PART2_RATE,
            "question": base.QUESTION_RATE,
        }
        for row in rows:
            if row["voice"]["id"] not in base.APPROVED_VOICES:
                raise RuntimeError(f"Unapproved voice in {item['id']}: {row['voice']['id']}")
            lowered = row["input"].lower()
            expected_rate = expected_rates[row["role"]]
            if lowered.count("<prosody ") != 1 or f'rate="{expected_rate}"' not in lowered:
                raise RuntimeError(f"Wrong prosody rate in {item['id']} {row['role']}")
            for forbidden in ("speechify:style", "<emphasis", "pitch=", "volume="):
                if forbidden in lowered:
                    raise RuntimeError(
                        f"Forbidden SSML in {item['id']} {row['role']}: {forbidden}"
                    )
            if row["role"] == "question":
                if lowered.count(f'<break time="{base.QUESTION_TO_TEXT_MS}ms"/>') != 1:
                    raise RuntimeError(f"Question break missing in {item['id']}")
            elif "<break " in lowered:
                raise RuntimeError(f"Unexpected break in {item['id']} {row['role']}")

    base.part2_segments = part2_segments_with_slow_number
    base.assert_input_contract = assert_input_contract_with_slow_number


def configure_page() -> None:
    original_write_page = base.write_page

    def part2_three_page(publish_dir: Path, records: list[dict]) -> None:
        original_write_page(publish_dir, records)
        page_path = publish_dir / "index.html"
        page = page_path.read_text(encoding="utf-8")
        page = page.replace(
            "SCBT Part 1・Part 2｜Simba 3.2 最終ルール",
            "SCBT Part 2｜Geffen・Dominic＋Hugh 3問",
        ).replace(
            "SCBTリスニング<span>Simba 3.2 最終ルール</span>",
            "SCBT Part 2<span>Geffen・Dominic＋Hugh 3問</span>",
        ).replace(
            "Part 1を5問、Part 2を5問。4人の確定キャストと確定速度・間隔で作成しました。",
            "本文はGeffen・Dominic・Geffen。NumberとQuestionは、ゆっくり聞きやすいHughで固定しました。",
        ).replace(
            "Part 1の番号・会話0.91x／Part 2の番号・本文0.90x／Questionと設問0.88x。",
            "Part 2本文0.90x／Number・Question・設問0.88x。",
        ).replace("Part 1・5問", "Part 1・0問").replace("Part 2・5問", "Part 2・3問")
        empty_part1 = (
            '<section class="part"><h2>Part 1・0問</h2>'
            '<p class="part-note">発言ターン単位で生成。1ターン内は文で切っていません。</p></section>'
        )
        page = page.replace(empty_part1, "")
        page_path.write_text(page, encoding="utf-8")
        if RANGE_WORKER.exists():
            shutil.copy2(RANGE_WORKER, publish_dir / "_worker.js")

    base.write_page = part2_three_page


def main() -> int:
    args = parse_args()
    configure_base()
    configure_page()
    items = [item for item in base.load_items() if item["part"] == "Part 2"]
    plan = base.preflight(items, args.output_dir)
    plan["expectedRequestUnits"] = 9
    plan["fixedNumberAndQuestionNarrator"] = HUGH
    plan["bodyVoiceOrder"] = [PART2_VOICE_PLANS[number]["body"] for number in PART2_NUMBERS]
    if not args.execute:
        print(json.dumps({"mode": "preflight", **plan}, ensure_ascii=False, indent=2))
        return 0

    report = base.execute(items, args.output_dir, args.publish_dir, plan)
    report["parts"] = {"Part 1": [], "Part 2": list(PART2_NUMBERS)}
    report["rates"]["part2Number"] = base.QUESTION_RATE
    report["rates"]["part2Body"] = base.PART2_RATE
    report["fixedNumberAndQuestionNarrator"] = HUGH
    report["bodyVoiceOrder"] = [
        PART2_VOICE_PLANS[number]["body"] for number in PART2_NUMBERS
    ]
    report_path = args.output_dir / "generation-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "mode": "completed",
                "trackCount": len(report["items"]),
                "apiRequestCount": report["apiRequestCount"],
                "billableCharacters": report["billableCharacters"],
                "bodyVoices": [
                    item["voices"]["body"]["name"] for item in report["items"]
                ],
                "narrator": HUGH["name"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
