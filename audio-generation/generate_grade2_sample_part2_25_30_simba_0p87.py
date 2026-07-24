from __future__ import annotations

import argparse
import html
import json
import shutil
import sys
from pathlib import Path

import generate_grade2_sample_part2_simba_final_fifteen as source


base = source.base
ROOT = source.ROOT
SOURCE_JS = source.SOURCE_JS
OUTPUT_DIR = ROOT / "audio-generation/grade2-sample-part2-25-30-simba-0p87-20260720"
PUBLISH_DIR = ROOT / "audio-generation/cloudflare-publish/grade2-sample-part2-25-30-simba-0p87-20260720"
RANGE_WORKER = source.RANGE_WORKER

NUMBERS = tuple(range(25, 31))
RATE = "-13%"
SPEED_LABEL = "0.87倍"
HUGH = source.HUGH


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate Grade 2 sample Part 2 No.25-30 at 0.87x with "
            "SpeechifyAI Simba 3.2."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def configure_base() -> None:
    base.SOURCE_JS = SOURCE_JS
    base.SET_KEY = "sample"
    base.PART1_NUMBERS = ()
    base.PART2_NUMBERS = NUMBERS
    base.NUMBER_WORDS = source.NUMBER_WORDS
    base.TTS_REPLACEMENTS = source.TTS_REPLACEMENTS
    base.PART2_VOICE_PLANS = {
        number: {
            "body": base.DOMINIC if number == 25 else base.GEFFEN,
            "narrator": HUGH,
        }
        for number in NUMBERS
    }
    base.PART1_RATE = RATE
    base.PART2_RATE = RATE
    base.QUESTION_RATE = RATE
    base.APPROVED_VOICES = {
        base.GEFFEN["id"],
        base.DOMINIC["id"],
        HUGH["id"],
    }
    base.MAX_CALLS = len(NUMBERS) * 3
    base.MAX_TOTAL_INPUT_CHARACTERS = 10000
    base.AUDIO_CACHE_VERSION = "20260720-sample-part2-25-30-0p87"
    base.native.MODEL = base.MODEL
    base.native.LANGUAGE = base.LANGUAGE
    base.native.segment_identity = base.segment_identity
    base.write_page = write_page


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        cards.append(
            f"""
            <article class="question-card">
              <div class="card-head">
                <div>
                  <h2>Number {record['number']}</h2>
                  <p>本文 {html.escape(record['voices']['body']['name'])}／番号・設問 Hugh</p>
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
  <title>英検2級 サンプル問題 Part 2 No.25-30｜Simba 0.87倍</title>
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
  <h1>英検2級 サンプル問題<span>Part 2・No.25〜30</span></h1>
  <p class="lead">No.25はDominic、No.26〜30はGeffen、問題番号・Question・設問はHughです。各問の本文全体を1回で生成し、文単位に切っていません。</p>
  <p class="contract"><strong>Simba 3.2／全発話{SPEED_LABEL}</strong><br>
  生成時SSMLはrate=&quot;{RATE}&quot;です。Speechifyから直接取得した48kHz・16bit・モノラルPCM WAVを使い、速度後処理・再圧縮・リサンプリング・音量加工は行っていません。</p>
  {''.join(cards)}
  <p class="note">間隔：番号後1.15秒／本文後1.10秒／“Question.”後0.35秒。発話PCMのバイト一致を全セグメントで検査しています。</p>
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
    plan["expectedRequestUnits"] = len(items) * 3
    plan["source"] = str(SOURCE_JS.relative_to(ROOT))
    plan["castPlan"] = {
        "body25": base.DOMINIC["id"],
        "body26To30": base.GEFFEN["id"],
        "numberAndQuestionNarrator": HUGH["id"],
    }
    plan["rate"] = RATE
    plan["nominalSpeed"] = 0.87
    return plan


def main() -> int:
    args = parse_args()
    configure_base()
    items = base.load_items()
    plan = preflight(items, args.output_dir)
    if not args.execute:
        print(json.dumps({"mode": "preflight", **plan}, ensure_ascii=False, indent=2))
        return 0

    report = base.execute(items, args.output_dir, args.publish_dir, plan)
    report["source"] = str(SOURCE_JS.relative_to(ROOT))
    report["baseMemo"] = "audio-generation/simba-3-2-final-production-memo.md"
    report["rateOverrideReason"] = "User-requested Part 2 No.25-30 at 0.87x"
    report["castPlan"] = plan["castPlan"]
    report["requestUnitCount"] = len(items) * 3
    report_path = args.output_dir / "generation-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "model": report["model"],
                "rate": RATE,
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
