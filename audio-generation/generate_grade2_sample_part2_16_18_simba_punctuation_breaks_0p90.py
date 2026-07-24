from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
from pathlib import Path

import generate_grade2_sample_part2_simba_final_fifteen as source


base = source.base
ROOT = source.ROOT
SOURCE_JS = source.SOURCE_JS
OUTPUT_DIR = ROOT / "audio-generation/grade2-sample-part2-16-18-simba-punctuation-breaks-0p90-20260720"
PUBLISH_DIR = ROOT / "audio-generation/cloudflare-publish/grade2-sample-part2-16-18-simba-punctuation-breaks-0p90-20260720"
RANGE_WORKER = source.RANGE_WORKER

NUMBERS = (16, 17, 18)
RATE = "-10%"
PERIOD_BREAK_MS = 150
COMMA_BREAK_MS = 80
HUGH = source.HUGH
ORIGINAL_ASSERT_INPUT_CONTRACT = base.assert_input_contract


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate sample Part 2 No.16-18 at 0.90x with explicit "
            "internal-period and comma pauses, without sentence splitting."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def body_ssml(text: str) -> tuple[str, int, int]:
    escaped = html.escape(text, quote=False)
    escaped, comma_count = re.subn(
        r",(?=\s)",
        f',<break time="{COMMA_BREAK_MS}ms"/>',
        escaped,
    )
    escaped, period_count = re.subn(
        r"\.(?=\s)",
        f'.<break time="{PERIOD_BREAK_MS}ms"/>',
        escaped,
    )
    return (
        f'<speak><prosody rate="{RATE}">{escaped}</prosody></speak>',
        period_count,
        comma_count,
    )


def part2_segments_with_punctuation_breaks(item: dict) -> list[dict]:
    number = item["number"]
    narrator = item["voicePlan"]["narrator"]
    body_safe, body_replacements = base.tts_safe_text(number, item["bodyText"])
    question_safe, question_replacements = base.tts_safe_text(
        number, item["questionText"]
    )
    marked_body, period_count, comma_count = body_ssml(body_safe)
    return [
        {
            "role": "number",
            "speaker": "narrator",
            "voice": narrator,
            "displayText": f"Number {number}.",
            "ttsText": f"Number {source.NUMBER_WORDS[number]}.",
            "ttsOverrides": [
                {"from": str(number), "to": source.NUMBER_WORDS[number]}
            ],
            "rate": RATE,
            "gapAfterMs": base.NUMBER_TO_BODY_MS,
            "input": base.prosody_ssml(
                f"Number {source.NUMBER_WORDS[number]}.", RATE
            ),
        },
        {
            "role": "body",
            "speaker": "body",
            "voice": item["voicePlan"]["body"],
            "displayText": item["bodyText"],
            "ttsText": body_safe,
            "ttsOverrides": body_replacements,
            "rate": RATE,
            "gapAfterMs": base.BODY_TO_QUESTION_MS,
            "input": marked_body,
            "internalPeriodBreakCount": period_count,
            "commaBreakCount": comma_count,
        },
        {
            "role": "question",
            "speaker": "narrator",
            "voice": narrator,
            "displayText": f"Question. {item['questionText']}",
            "ttsText": f"Question. {question_safe}",
            "ttsOverrides": question_replacements,
            "rate": RATE,
            "gapAfterMs": 0,
            "input": base.question_ssml(question_safe),
        },
    ]


def assert_input_contract(item: dict, rows: list[dict]) -> None:
    shadow_rows = [{**row} for row in rows]
    shadow_rows[1]["input"] = base.prosody_ssml(rows[1]["ttsText"], RATE)
    ORIGINAL_ASSERT_INPUT_CONTRACT(item, shadow_rows)

    body = rows[1]
    marked = body["input"]
    expected_periods = len(re.findall(r"\.(?=\s)", body["ttsText"]))
    expected_commas = len(re.findall(r",(?=\s)", body["ttsText"]))
    if body["internalPeriodBreakCount"] != expected_periods:
        raise RuntimeError(f"Wrong period break count in {item['id']}")
    if body["commaBreakCount"] != expected_commas:
        raise RuntimeError(f"Wrong comma break count in {item['id']}")
    if marked.count(f'<break time="{PERIOD_BREAK_MS}ms"/>') != expected_periods:
        raise RuntimeError(f"Period breaks missing in {item['id']}")
    if marked.count(f'<break time="{COMMA_BREAK_MS}ms"/>') != expected_commas:
        raise RuntimeError(f"Comma breaks missing in {item['id']}")
    if marked.rstrip().endswith(f'<break time="{PERIOD_BREAK_MS}ms"/>'):
        raise RuntimeError(f"Final period has a duplicate structural break in {item['id']}")


def configure_base() -> None:
    base.SOURCE_JS = SOURCE_JS
    base.SET_KEY = "sample"
    base.PART1_NUMBERS = ()
    base.PART2_NUMBERS = NUMBERS
    base.NUMBER_WORDS = source.NUMBER_WORDS
    base.TTS_REPLACEMENTS = source.TTS_REPLACEMENTS
    base.PART2_VOICE_PLANS = {
        number: {"body": base.GEFFEN, "narrator": HUGH} for number in NUMBERS
    }
    base.PART1_RATE = RATE
    base.PART2_RATE = RATE
    base.QUESTION_RATE = RATE
    base.APPROVED_VOICES = {base.GEFFEN["id"], HUGH["id"]}
    base.MAX_CALLS = len(NUMBERS) * 3
    base.MAX_TOTAL_INPUT_CHARACTERS = 8000
    base.AUDIO_CACHE_VERSION = "20260720-sample-part2-16-18-punctuation-0p90"
    base.native.MODEL = base.MODEL
    base.native.LANGUAGE = base.LANGUAGE
    base.native.segment_identity = base.segment_identity
    base.part2_segments = part2_segments_with_punctuation_breaks
    base.assert_input_contract = assert_input_contract
    base.write_page = write_page


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        body_segment = next(
            segment for segment in record["segments"] if segment["role"] == "body"
        )
        period_count = body_segment["input"].count(
            f'<break time="{PERIOD_BREAK_MS}ms"/>'
        )
        comma_count = body_segment["input"].count(
            f'<break time="{COMMA_BREAK_MS}ms"/>'
        )
        cards.append(
            f"""
            <article>
              <h2>Number {record['number']}</h2>
              <p>本文 Geffen／番号・設問 Hugh</p>
              <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}?v={base.AUDIO_CACHE_VERSION}"></audio>
              <a href="{html.escape(record['publishedWav'])}?v={base.AUDIO_CACHE_VERSION}" download>WAVを保存</a>
              <details><summary>英文と間の数を見る</summary>
                {record['scriptHtml']}
                <p>内部ピリオド後：{period_count}か所 × {PERIOD_BREAK_MS}ms<br>
                コンマ後：{comma_count}か所 × {COMMA_BREAK_MS}ms</p>
              </details>
            </article>
            """
        )
    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>サンプルPart 2 No.16-18｜文末・コンマ間テスト</title>
<style>
:root{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18211c;background:#f3f1eb}}
*{{box-sizing:border-box}}body{{margin:0}}main{{width:min(720px,calc(100% - 24px));margin:auto;padding:28px 0 48px}}
h1{{font-size:clamp(27px,7vw,42px);line-height:1.12;margin:0 0 14px}}.lead{{line-height:1.7;color:#4d5a51}}
article{{background:#fff;border:1px solid #d7ddd8;border-radius:18px;padding:18px;margin:16px 0;box-shadow:0 5px 22px rgba(35,50,41,.06)}}
h2{{margin:0 0 6px}}article p{{color:#637067;line-height:1.6}}audio{{display:block;width:100%;margin:12px 0}}a{{color:#285e40;font-weight:700}}
.contract{{background:#e4f0e8;border:1px solid #b9d2c1;border-radius:14px;padding:13px 15px;line-height:1.65}}details{{margin-top:13px;border-top:1px solid #e4e8e5;padding-top:11px}}
</style></head><body><main>
<h1>サンプルPart 2<br>No.16〜18 間のテスト</h1>
<p class="lead">本文全体を切らずに生成し、内部のピリオド後に{PERIOD_BREAK_MS}ms、コンマ後に{COMMA_BREAK_MS}msを追加しました。</p>
<p class="contract">Simba 3.2／全発話0.90倍／スタイルなし<br>48kHz・16bit・モノラルPCM WAV。速度後処理・再圧縮・リサンプリング・音量加工なし。</p>
{''.join(cards)}
</main><script>
const players=[...document.querySelectorAll('audio')];players.forEach(p=>{{p.playbackRate=1;p.addEventListener('play',()=>players.forEach(o=>{{if(o!==p)o.pause()}}))}});
</script></body></html>"""
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
    body_rows = [
        next(row for row in base.part2_segments(item) if row["role"] == "body")
        for item in items
    ]
    plan["expectedRequestUnits"] = len(items) * 3
    plan["rate"] = RATE
    plan["nominalSpeed"] = 0.90
    plan["punctuationPauses"] = {
        "internalPeriodMs": PERIOD_BREAK_MS,
        "commaMs": COMMA_BREAK_MS,
        "finalPeriodUsesStructuralBodyGap": True,
        "counts": {
            str(item["number"]): {
                "internalPeriods": row["internalPeriodBreakCount"],
                "commas": row["commaBreakCount"],
            }
            for item, row in zip(items, body_rows)
        },
    }
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
    report["rateOverrideReason"] = "Part 2 default 0.90x"
    report["punctuationPauses"] = plan["punctuationPauses"]
    report["style"] = None
    report["requestUnitCount"] = len(items) * 3
    report_path = args.output_dir / "generation-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "rate": RATE,
                "trackCount": len(report["items"]),
                "apiRequestCount": report["apiRequestCount"],
                "billableCharacters": report["billableCharacters"],
                "punctuationPauses": plan["punctuationPauses"],
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
