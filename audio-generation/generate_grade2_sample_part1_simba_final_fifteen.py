from __future__ import annotations

import argparse
import html
import json
import shutil
import sys
from pathlib import Path

import generate_grade2_round1_simba_final_part1_part2_five as base


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JSON = ROOT / "audio-generation/grade2-sample-part1-full.json"
OUTPUT_DIR = ROOT / "audio-generation/grade2-sample-part1-simba-final-fifteen-20260719"
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-sample-part1-simba-final-fifteen-20260719"
)
RANGE_WORKER = ROOT / "audio-generation/cloudflare-wav-range-worker.js"

NUMBERS = tuple(range(1, 16))
NUMBER_WORDS = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
    11: "eleven",
    12: "twelve",
    13: "thirteen",
    14: "fourteen",
    15: "fifteen",
}
TTS_REPLACEMENTS = {
    2: {"Ms. Green": "Miss Green"},
    13: {"Mr. Clark": "Mister Clark"},
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate Grade 2 sample Part 1 No.1-15 with the canonical "
            "SpeechifyAI Simba 3.2 production rules."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def configure_base() -> None:
    base.SET_KEY = "sample"
    base.PART1_NUMBERS = NUMBERS
    base.PART2_NUMBERS = ()
    base.NUMBER_WORDS = NUMBER_WORDS
    base.TTS_REPLACEMENTS = TTS_REPLACEMENTS
    base.PART1_NARRATORS = {number: base.HARPER for number in NUMBERS}
    base.PART1_RATE = "-8%"
    base.PART2_RATE = "-8%"
    base.QUESTION_RATE = "-8%"
    base.APPROVED_VOICES = {
        base.GEFFEN["id"],
        base.HARPER["id"],
        base.DOMINIC["id"],
    }
    base.MAX_CALLS = 90
    base.MAX_TOTAL_INPUT_CHARACTERS = 20000
    base.AUDIO_CACHE_VERSION = "20260719-sample-part1-final15"
    base.native.MODEL = base.MODEL
    base.native.LANGUAGE = base.LANGUAGE
    base.native.segment_identity = base.segment_identity
    base.write_page = write_page


def load_items() -> list[dict]:
    source = json.loads(SOURCE_JSON.read_text(encoding="utf-8"))
    raw_items = source.get("items")
    if not isinstance(raw_items, list):
        raise RuntimeError("Sample Part 1 source has no items array")

    by_number = {int(item["number"]): item for item in raw_items}
    items = []
    for number in NUMBERS:
        raw = by_number.get(number)
        if not raw:
            raise RuntimeError(f"Sample Part 1 No.{number} is missing")
        segments = raw.get("segments")
        if not isinstance(segments, list) or len(segments) != 6:
            raise RuntimeError(
                f"Sample Part 1 No.{number} must have Number, four turns, and Question"
            )

        number_segment, *dialogue_segments, question_segment = segments
        if len(dialogue_segments) != 4:
            raise RuntimeError(f"Sample Part 1 No.{number} must contain four complete turns")
        if not str(number_segment.get("text", "")).startswith("Number "):
            raise RuntimeError(f"Sample Part 1 No.{number} has an invalid Number line")
        if any(segment.get("speaker") not in {"A", "B"} for segment in dialogue_segments):
            raise RuntimeError(f"Sample Part 1 No.{number} has an unknown dialogue speaker")
        if any(
            dialogue_segments[index]["speaker"]
            == dialogue_segments[index - 1]["speaker"]
            for index in range(1, len(dialogue_segments))
        ):
            raise RuntimeError(f"Sample Part 1 No.{number} speakers do not alternate")
        if any(not str(segment.get("text", "")).strip() for segment in dialogue_segments):
            raise RuntimeError(f"Sample Part 1 No.{number} contains an empty turn")

        question_line = str(question_segment.get("text", "")).strip()
        prefix = "Question. "
        if not question_line.startswith(prefix) or not question_line[len(prefix) :].strip():
            raise RuntimeError(f"Sample Part 1 No.{number} has an invalid Question line")
        question_text = question_line[len(prefix) :].strip()

        items.append(
            {
                "id": f"part1-No{number:02d}",
                "part": "Part 1",
                "number": number,
                "turns": [
                    {
                        "speaker": str(segment["speaker"]),
                        "text": str(segment["text"]).strip(),
                    }
                    for segment in dialogue_segments
                ],
                "questionText": question_text,
                "voicePlan": {
                    "A": base.GEFFEN,
                    "B": base.DOMINIC,
                    "narrator": base.HARPER,
                },
            }
        )
    return items


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        cards.append(
            f"""
            <article class="question-card">
              <div class="card-head">
                <div>
                  <h2>Number {record['number']}</h2>
                  <p>Geffen × Dominic／番号・設問 Harper</p>
                </div>
                <a class="download" href="{html.escape(record['publishedWav'])}?v={base.AUDIO_CACHE_VERSION}" download>WAVを保存</a>
              </div>
              <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}?v={base.AUDIO_CACHE_VERSION}"></audio>
              <details><summary>英文を見る</summary>{record['scriptHtml']}</details>
            </article>
            """
        )

    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>英検2級 サンプル問題 Part 1｜Simba 3.2</title>
  <style>
    :root{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18211c;background:#f3f1eb}}
    *{{box-sizing:border-box}}body{{margin:0}}main{{width:min(780px,calc(100% - 24px));margin:auto;padding:28px 0 52px}}
    h1{{font-size:clamp(27px,7vw,43px);line-height:1.08;margin:0 0 14px}}h1 span{{display:block;color:#35644a}}
    h2{{font-size:22px;margin:0 0 4px}}.lead,.contract,.note{{line-height:1.7;color:#4d5a51}}
    .contract{{background:#e4f0e8;border:1px solid #b9d2c1;border-radius:14px;padding:12px 14px}}
    .question-card{{background:#fff;border:1px solid #d7ddd8;border-radius:18px;padding:17px;margin:15px 0;box-shadow:0 5px 22px rgba(35,50,41,.06)}}
    .card-head{{display:flex;align-items:start;justify-content:space-between;gap:12px}}.card-head p{{margin:0 0 13px;color:#637067}}
    .download{{color:#285e40;font-weight:700;white-space:nowrap}}audio{{display:block;width:100%;margin:8px 0 13px}}
    details{{border-top:1px solid #e4e8e5;padding-top:11px}}summary{{cursor:pointer;font-weight:700}}details p{{line-height:1.65;margin:.7em 0}}.question{{color:#244f36}}.note{{font-size:14px}}
    @media(max-width:460px){{.card-head{{display:block}}.download{{display:inline-block;margin-bottom:10px}}}}
  </style>
</head>
<body><main>
  <h1>英検2級 サンプル問題<span>Part 1・15問</span></h1>
  <p class="lead">GeffenとDominicの会話、Harperの問題番号・Question・設問で作成しました。1発言に複数文があっても、文単位に切っていません。</p>
  <p class="contract"><strong>Simba 3.2／全発話0.92倍</strong><br>
  48kHz・16bit・モノラルPCM WAV。MP3化・再圧縮・リサンプリング・速度後処理・音量加工は行っていません。通常再生は1.00倍です。</p>
  {''.join(cards)}
  <p class="note">間隔：番号後1.15秒／話者交代0.55秒／会話後1.10秒／“Question.”後0.35秒。発話PCMのバイト一致を全セグメントで検査しています。</p>
</main>
<script>
  const players=[...document.querySelectorAll('audio')];
  players.forEach(player=>{{
    player.defaultPlaybackRate=1;
    player.playbackRate=1;
    player.addEventListener('play',()=>players.forEach(other=>{{if(other!==player)other.pause()}}));
  }});
</script>
</body></html>
"""
    publish_dir.mkdir(parents=True, exist_ok=True)
    (publish_dir / "index.html").write_text(page, encoding="utf-8")
    (publish_dir / "_headers").write_text(
        "/audio/*.wav\n  Content-Type: audio/wav\n  Cache-Control: public, max-age=31536000, immutable\n",
        encoding="utf-8",
    )
    if RANGE_WORKER.exists():
        shutil.copy2(RANGE_WORKER, publish_dir / "_worker.js")


def preflight(items: list[dict], output_dir: Path) -> dict:
    plan = base.preflight(items, output_dir)
    plan["expectedRequestUnits"] = len(items) * 6
    plan["source"] = str(SOURCE_JSON.relative_to(ROOT))
    plan["castPlan"] = {
        "dialogue": [base.GEFFEN["id"], base.DOMINIC["id"]],
        "numberAndQuestionNarrator": base.HARPER["id"],
    }
    plan["rate"] = "-8%"
    return plan


def main() -> int:
    args = parse_args()
    configure_base()
    items = load_items()
    plan = preflight(items, args.output_dir)
    if not args.execute:
        print(json.dumps({"mode": "preflight", **plan}, ensure_ascii=False, indent=2))
        return 0

    report = base.execute(items, args.output_dir, args.publish_dir, plan)
    report["source"] = str(SOURCE_JSON.relative_to(ROOT))
    report["canonicalMemo"] = "audio-generation/simba-3-2-final-production-memo.md"
    report["castPlan"] = plan["castPlan"]
    report["requestUnitCount"] = len(items) * 6
    report_path = args.output_dir / "generation-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "model": report["model"],
                "trackCount": len(report["items"]),
                "apiRequestCount": report["apiRequestCount"],
                "billableCharacters": report["billableCharacters"],
                "allPcmExact": all(
                    item["pcmVerification"]["pcmExactMatch"]
                    and item["pcmVerification"]["allSpeechSlicesExact"]
                    and item["publishedCopyHashMatch"]
                    for item in report["items"]
                ),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
