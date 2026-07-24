from __future__ import annotations

import argparse
import copy
import json
import os
import re
import shutil
import time
from pathlib import Path

import generate_grade2_round1_simba_five_question_block_trial as block


base = block.base
ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-simba-part2-careful-voice-five-20260719"
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-round1-simba-part2-careful-voice-five-20260719"
)
REUSE_REPORT = (
    ROOT
    / "audio-generation/grade2-round1-simba-five-question-block-trial-20260719/generation-report.json"
)
RANGE_WORKER = ROOT / "audio-generation/cloudflare-wav-range-worker.js"

HARPER = {**base.HARPER, "language": "en-US"}
BEATRICE = {
    "id": "beatrice_32",
    "name": "Beatrice",
    "gender": "female",
    "language": "en-US",
}
EDMUND = {
    "id": "edmund_32",
    "name": "Edmund",
    "gender": "male",
    "language": "en-US",
}
CANDIDATES = (BEATRICE, EDMUND)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Compare the two unused Simba 3.2 voices on Part 2 No.16, select "
            "the slower stable reader, and generate Part 2 No.16-20 with that "
            "voice while keeping Harper fixed for Number and Question."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def configure_base() -> None:
    base.LANGUAGE = "en-US"
    base.HARPER = HARPER
    base.APPROVED_VOICES = {
        HARPER["id"],
        BEATRICE["id"],
        EDMUND["id"],
    }
    base.AUDIO_CACHE_VERSION = "20260719-part2-careful1"
    base.segment_identity = block.localized_segment_identity
    base.native.request_segment = block.localized_request_segment


def load_part2_with_body(body_voice: dict) -> list[dict]:
    base.PART2_VOICE_PLANS = {
        number: {"body": body_voice, "narrator": HARPER}
        for number in base.PART2_NUMBERS
    }
    return [item for item in base.load_items() if item["part"] == "Part 2"]


def compare_candidates(
    api_key: str, output_dir: Path
) -> tuple[dict, list[dict], int, int]:
    source_item = next(
        item for item in load_part2_with_body(BEATRICE) if item["number"] == 16
    )
    results = []
    request_count = 0
    billed_characters = 0
    for voice in CANDIDATES:
        item = copy.deepcopy(source_item)
        item["voicePlan"] = {"body": voice, "narrator": HARPER}
        body_row = next(row for row in base.part2_segments(item) if row["role"] == "body")
        path = base.segment_path(output_dir, item, body_row)
        api = None
        if not base.native.speechify.valid_wav(path):
            if not api_key:
                raise RuntimeError("SPEECHIFY_API_KEY is not set")
            api = base.native.request_segment(api_key, item, body_row, path)
            request_count += 1
            billed_characters += api.get("billableCharacters") or 0
            time.sleep(0.35)
        wave_info, _ = base.native.read_pcm(path)
        base.assert_wave_contract(wave_info, f"candidate {voice['id']}")
        peak = base.pcm_sample_stats(path)
        results.append(
            {
                "voice": voice,
                "durationSeconds": wave_info["durationSeconds"],
                "wordCount": len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", item["bodyText"])),
                "wave": wave_info,
                "samplePeak": peak,
                "sourceWav": str(path.relative_to(ROOT)),
                "fileSha256": base.native.sha256_file(path),
                "api": api,
            }
        )
    stable = [row for row in results if row["samplePeak"]["noFullScalePlateau"]]
    if not stable:
        raise RuntimeError("Both new candidate voices produced consecutive full-scale samples")
    selected = max(stable, key=lambda row: row["durationSeconds"])
    for row in results:
        row["wordsPerMinute"] = round(
            row["wordCount"] / row["durationSeconds"] * 60, 1
        )
        row["selected"] = row["voice"]["id"] == selected["voice"]["id"]
    return selected["voice"], results, request_count, billed_characters


def prior_segment_index() -> dict[tuple[str, str, str, str], Path]:
    if not REUSE_REPORT.exists():
        return {}
    report = json.loads(REUSE_REPORT.read_text(encoding="utf-8"))
    index = {}
    for item in report.get("items", []):
        if item.get("part") != "Part 2":
            continue
        for segment in item.get("segments", []):
            source = ROOT / segment["sourceWav"]
            key = (
                item["id"],
                segment["role"],
                segment["voiceId"],
                segment["input"],
            )
            if source.exists() and base.native.speechify.valid_wav(source):
                index[key] = source
    return index


def seed_harper_segments(items: list[dict], output_dir: Path) -> list[dict]:
    prior = prior_segment_index()
    reused = []
    for item in items:
        for row in base.segments_for(item):
            if row["voice"]["id"] != HARPER["id"]:
                continue
            key = (item["id"], row["role"], row["voice"]["id"], row["input"])
            source = prior.get(key)
            if not source:
                continue
            destination = base.segment_path(output_dir, item, row)
            if not base.native.speechify.valid_wav(destination):
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, destination)
            source_hash = base.native.sha256_file(source)
            destination_hash = base.native.sha256_file(destination)
            if source_hash != destination_hash:
                raise RuntimeError(f"Reused Harper segment differs: {destination}")
            reused.append(
                {
                    "item": item["id"],
                    "role": row["role"],
                    "voiceId": HARPER["id"],
                    "source": str(source.relative_to(ROOT)),
                    "destination": str(destination.relative_to(ROOT)),
                    "fileSha256": destination_hash,
                }
            )
    return reused


def configure_page() -> None:
    original_write_page = base.write_page

    def part2_only_page(publish_dir: Path, records: list[dict]) -> None:
        original_write_page(publish_dir, records)
        page_path = publish_dir / "index.html"
        page = page_path.read_text(encoding="utf-8")
        page = re.sub(
            r'<section class="part"><h2>Part 1・5問</h2>.*?</section>',
            "",
            page,
            count=1,
            flags=re.DOTALL,
        )
        selected_name = records[0]["voices"]["body"]["name"]
        page = page.replace(
            "SCBT Part 1・Part 2｜Simba 3.2 最終ルール",
            "SCBT Part 2｜Simba 3.2 新キャスト5問試聴",
        ).replace(
            "SCBTリスニング<span>Simba 3.2 最終ルール</span>",
            "SCBT Part 2<span>ゆっくり丁寧な新キャスト試聴</span>",
        ).replace(
            "Part 1を5問、Part 2を5問。4人の確定キャストと確定速度・間隔で作成しました。",
            f"Part 2のNo.16～20は本文を{selected_name}に5問固定。NumberとQuestionはHarper固定です。",
        ).replace(
            "Part 1の番号・会話0.91x／Part 2の番号・本文0.90x／Questionと設問0.88x。",
            "Part 2の番号・本文0.90x／Questionと設問0.88x。",
        )
        page_path.write_text(page, encoding="utf-8")
        shutil.copy2(RANGE_WORKER, publish_dir / "_worker.js")

    base.write_page = part2_only_page


def main() -> int:
    args = parse_args()
    configure_base()
    if not args.execute:
        print(
            json.dumps(
                {
                    "mode": "preflight",
                    "model": base.MODEL,
                    "part": "Part 2",
                    "numbers": list(base.PART2_NUMBERS),
                    "candidateVoices": [voice["id"] for voice in CANDIDATES],
                    "selectionRule": "longer No.16 duration among stable candidates",
                    "part2Rate": base.PART2_RATE,
                    "questionRate": base.QUESTION_RATE,
                    "fixedNarrator": HARPER["id"],
                    "maxCandidateCalls": 2,
                    "maxFinalBodyCalls": 4,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0

    api_key = (
        os.environ.get("SPEECHIFY_API_KEY", "").strip()
        or os.environ.get("SPEECHFY_API_KEY", "").strip()
    )
    selected, comparison, selection_calls, selection_billed = compare_candidates(
        api_key, args.output_dir
    )
    items = load_part2_with_body(selected)
    reused = seed_harper_segments(items, args.output_dir)
    plan = base.preflight(items, args.output_dir)
    plan["candidateComparison"] = comparison
    plan["selectionRule"] = "Longest stable No.16 reading at identical -10% rate"
    plan["selectedBodyVoice"] = selected
    plan["fixedNarrator"] = HARPER
    plan["reusedHarperSegmentCount"] = len(reused)
    configure_page()
    report = base.execute(items, args.output_dir, args.publish_dir, plan)
    final_calls = report["apiRequestCount"]
    final_billed = report["billableCharacters"]
    report["parts"] = {"Part 1": [], "Part 2": list(base.PART2_NUMBERS)}
    report["trialPurpose"] = "Replace fast Imogen body with a slower unused Simba 3.2 voice"
    report["candidateComparison"] = comparison
    report["selectionRule"] = plan["selectionRule"]
    report["selectedBodyVoice"] = selected
    report["fixedNumberAndQuestionNarrator"] = HARPER
    report["selectionApiRequestCount"] = selection_calls
    report["finalGenerationApiRequestCount"] = final_calls
    report["apiRequestCount"] = selection_calls + final_calls
    report["selectionBillableCharacters"] = selection_billed
    report["finalBillableCharacters"] = final_billed
    report["billableCharacters"] = selection_billed + final_billed
    report["reusedHarperSegments"] = reused
    report["reusedHarperSegmentCount"] = len(reused)
    (args.output_dir / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "mode": "completed",
                "selectedBodyVoice": selected,
                "candidateComparison": [
                    {
                        "voice": row["voice"]["name"],
                        "durationSeconds": row["durationSeconds"],
                        "wordsPerMinute": row["wordsPerMinute"],
                        "selected": row["selected"],
                    }
                    for row in comparison
                ],
                "trackCount": len(report["items"]),
                "apiRequestCount": report["apiRequestCount"],
                "reusedHarperSegmentCount": len(reused),
                "billableCharacters": report["billableCharacters"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
