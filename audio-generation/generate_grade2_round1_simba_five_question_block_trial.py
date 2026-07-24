from __future__ import annotations

import argparse
import base64
import json
import os
import shutil
import time
from pathlib import Path

import generate_grade2_round1_simba_final_part1_part2_five as base


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-simba-five-question-block-trial-20260719"
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-round1-simba-five-question-block-trial-20260719"
)
REUSE_REPORT = (
    ROOT
    / "audio-generation/grade2-round1-simba-final-part1-part2-five-20260719/generation-report.json"
)
RANGE_WORKER = ROOT / "audio-generation/cloudflare-wav-range-worker.js"

IMOGEN = {
    "id": "imogen_32",
    "name": "Imogen",
    "gender": "female",
    "language": "en-GB",
}
GEFFEN = {**base.GEFFEN, "language": "en-US"}
HARPER = {**base.HARPER, "language": "en-US"}
DOMINIC = {**base.DOMINIC, "language": "en-US"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate a Simba 3.2 five-question-block trial: Part 1 Geffen and "
            "Dominic, Part 2 Imogen, with Harper fixed for Number and Question."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def voice_language(row: dict) -> str:
    return str(row["voice"].get("language") or "en-US")


def localized_segment_identity(item: dict, row: dict) -> dict:
    return {
        "provider": "SpeechifyAI",
        "apiVersion": base.native.speechify.SPEECHIFY_VERSION,
        "model": base.MODEL,
        "language": voice_language(row),
        "audioFormat": "wav",
        "item": item["id"],
        "role": row["role"],
        "voiceId": row["voice"]["id"],
        "input": row["input"],
    }


def localized_request_segment(
    api_key: str, item: dict, row: dict, destination: Path
) -> dict:
    identity = localized_segment_identity(item, row)
    payload = {
        "input": row["input"],
        "voice_id": row["voice"]["id"],
        "audio_format": "wav",
        "language": voice_language(row),
        "model": base.MODEL,
    }
    started = time.monotonic()
    body, headers = base.native.speechify.request_bytes(
        base.native.speechify.SPEECHIFY_API_URL,
        payload,
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Speechify-Version": base.native.speechify.SPEECHIFY_VERSION,
            "Idempotency-Key": base.native.speechify.cache_key(identity),
        },
    )
    response = json.loads(body.decode("utf-8"))
    encoded = response.get("audio_data")
    if not isinstance(encoded, str) or not encoded:
        raise RuntimeError(
            f"Speechify response has no audio_data for {item['id']} {row['role']}"
        )
    base.native.speechify.atomic_write(destination, base64.b64decode(encoded))
    if not base.native.speechify.valid_wav(destination):
        raise RuntimeError(f"Invalid WAV for {item['id']} {row['role']}")
    return {
        "httpStatus": 200,
        "elapsedSeconds": round(time.monotonic() - started, 3),
        "billableCharacters": response.get("billable_characters_count"),
        "requestId": headers.get("x-request-id") or headers.get("X-Request-ID"),
        "language": voice_language(row),
    }


def configure_base() -> None:
    base.LANGUAGE = "en-US/en-GB"
    base.GEFFEN = GEFFEN
    base.HARPER = HARPER
    base.DOMINIC = DOMINIC
    base.APPROVED_VOICES = {
        GEFFEN["id"],
        HARPER["id"],
        DOMINIC["id"],
        IMOGEN["id"],
    }
    base.PART1_NARRATORS = {number: HARPER for number in base.PART1_NUMBERS}
    base.PART2_VOICE_PLANS = {
        number: {"body": IMOGEN, "narrator": HARPER}
        for number in base.PART2_NUMBERS
    }
    base.AUDIO_CACHE_VERSION = "20260719-five-block1"
    base.segment_identity = localized_segment_identity
    base.native.request_segment = localized_request_segment


def prior_segment_index() -> dict[tuple[str, str, str, str, str], Path]:
    if not REUSE_REPORT.exists():
        return {}
    report = json.loads(REUSE_REPORT.read_text(encoding="utf-8"))
    index = {}
    for item in report.get("items", []):
        for segment in item.get("segments", []):
            source = ROOT / segment["sourceWav"]
            key = (
                item["id"],
                segment["role"],
                segment["voiceId"],
                segment["input"],
                "en-US",
            )
            if source.exists() and base.native.speechify.valid_wav(source):
                index[key] = source
    return index


def seed_identical_segments(items: list[dict], output_dir: Path) -> list[dict]:
    prior = prior_segment_index()
    reused = []
    for item in items:
        for row in base.segments_for(item):
            destination = base.segment_path(output_dir, item, row)
            key = (
                item["id"],
                row["role"],
                row["voice"]["id"],
                row["input"],
                voice_language(row),
            )
            source = prior.get(key)
            if source:
                if not base.native.speechify.valid_wav(destination):
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source, destination)
                if base.native.sha256_file(source) != base.native.sha256_file(destination):
                    raise RuntimeError(f"Reused segment copy differs: {destination}")
                reused.append(
                    {
                        "item": item["id"],
                        "role": row["role"],
                        "voiceId": row["voice"]["id"],
                        "source": str(source.relative_to(ROOT)),
                        "destination": str(destination.relative_to(ROOT)),
                        "fileSha256": base.native.sha256_file(destination),
                    }
                )
    return reused


def main() -> int:
    args = parse_args()
    configure_base()
    original_write_page = base.write_page

    def configured_page(publish_dir: Path, records: list[dict]) -> None:
        original_write_page(publish_dir, records)
        page_path = publish_dir / "index.html"
        page = page_path.read_text(encoding="utf-8")
        page = page.replace(
            "SCBT Part 1・Part 2｜Simba 3.2 最終ルール",
            "SCBT Part 1・Part 2｜Simba 3.2 5問固定キャスト試聴",
        ).replace(
            "SCBTリスニング<span>Simba 3.2 最終ルール</span>",
            "SCBTリスニング<span>5問ごと固定キャスト試聴</span>",
        ).replace(
            "Part 1を5問、Part 2を5問。4人の確定キャストと確定速度・間隔で作成しました。",
            "Part 1はGeffen × Dominicを5問固定、Part 2本文はImogenを5問固定。NumberとQuestionは全10問Harper固定です。",
        )
        page_path.write_text(page, encoding="utf-8")
        shutil.copy2(RANGE_WORKER, publish_dir / "_worker.js")

    base.write_page = configured_page
    items = base.load_items()
    reused = seed_identical_segments(items, args.output_dir)
    plan = base.preflight(items, args.output_dir)
    plan["reusedIdenticalSegments"] = reused
    plan["reusedSegmentCount"] = len(reused)
    plan["castPlan"] = {
        "part1Dialogue": [GEFFEN["id"], DOMINIC["id"]],
        "part2BodyNumbers16To20": IMOGEN["id"],
        "fixedNumberAndQuestionNarrator": HARPER["id"],
    }
    if not args.execute:
        print(json.dumps({"mode": "preflight", **plan}, ensure_ascii=False, indent=2))
        return 0
    report = base.execute(items, args.output_dir, args.publish_dir, plan)
    report["trialPurpose"] = "Five-question voice blocks and fixed Harper narrator"
    report["castPlan"] = plan["castPlan"]
    report["reusedIdenticalSegments"] = reused
    report["reusedSegmentCount"] = len(reused)
    (args.output_dir / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "mode": "completed",
                "model": report["model"],
                "trackCount": len(report["items"]),
                "apiRequestCount": report["apiRequestCount"],
                "reusedSegmentCount": len(reused),
                "billableCharacters": report["billableCharacters"],
                "castPlan": report["castPlan"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
