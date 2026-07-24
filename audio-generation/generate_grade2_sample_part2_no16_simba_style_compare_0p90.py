from __future__ import annotations

import argparse
import base64
import html
import json
import os
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import generate_grade2_sample_part2_simba_final_fifteen as source


base = source.base
ROOT = source.ROOT
SOURCE_JS = source.SOURCE_JS
OUTPUT_DIR = ROOT / "audio-generation/grade2-sample-part2-no16-simba-style-compare-0p90-20260720"
PUBLISH_DIR = ROOT / "audio-generation/cloudflare-publish/grade2-sample-part2-no16-simba-style-compare-0p90-20260720"
RANGE_WORKER = source.RANGE_WORKER

RATE = "-10%"
NOMINAL_SPEED = 0.90
NUMBER = 16
GEFFEN = base.GEFFEN
HUGH = source.HUGH
VARIANTS = (
    {"id": "plain", "label": "スタイルなし", "emotion": None},
    {"id": "direct", "label": "direct（明瞭・率直）", "emotion": "direct"},
    {"id": "calm", "label": "calm（落ち着いた）", "emotion": "calm"},
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate three Simba 3.2 style variants for sample Part 2 No.16 at 0.90x."
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def load_question() -> dict:
    questions = base.source.load_source_questions(SOURCE_JS, "sample")
    question = next(
        (
            row
            for row in questions
            if row.get("part") == "Part 2" and int(row["id"]) == NUMBER
        ),
        None,
    )
    if question is None:
        raise RuntimeError("Sample Part 2 No.16 was not found")
    return question


def styled_ssml(text: str, emotion: str | None, *, question: bool = False) -> str:
    escaped = html.escape(text, quote=False)
    content = (
        f'Question.<break time="{base.QUESTION_TO_TEXT_MS}ms"/>{escaped}'
        if question
        else escaped
    )
    marked = f'<prosody rate="{RATE}">{content}</prosody>'
    if emotion:
        marked = f'<speechify:style emotion="{emotion}">{marked}</speechify:style>'
    return f"<speak>{marked}</speak>"


def segments(question: dict, variant: dict) -> tuple[dict, list[dict]]:
    body_text = str(question.get("script", "")).strip()
    question_text = str(question.get("questionText", "")).strip()
    if not body_text or not question_text:
        raise RuntimeError("Sample Part 2 No.16 has incomplete text")
    item = {
        "id": f"part2-No16-{variant['id']}-0p90",
        "part": "Part 2",
        "number": NUMBER,
        "bodyText": body_text,
        "questionText": question_text,
        "voicePlan": {"body": GEFFEN, "narrator": HUGH},
        "variant": variant,
    }
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "voice": HUGH,
            "displayText": "Number 16.",
            "ttsText": "Number sixteen.",
            "input": styled_ssml("Number sixteen.", variant["emotion"]),
            "rate": RATE,
            "gapAfterMs": base.NUMBER_TO_BODY_MS,
        },
        {
            "role": "body",
            "speaker": "body",
            "voice": GEFFEN,
            "displayText": body_text,
            "ttsText": body_text,
            "input": styled_ssml(body_text, variant["emotion"]),
            "rate": RATE,
            "gapAfterMs": base.BODY_TO_QUESTION_MS,
        },
        {
            "role": "question",
            "speaker": "narrator",
            "voice": HUGH,
            "displayText": f"Question. {question_text}",
            "ttsText": f"Question. {question_text}",
            "input": styled_ssml(question_text, variant["emotion"], question=True),
            "rate": RATE,
            "gapAfterMs": 0,
        },
    ]
    return item, rows


def validate_rows(item: dict, rows: list[dict]) -> None:
    if [row["role"] for row in rows] != ["number", "body", "question"]:
        raise RuntimeError(f"Unexpected segments for {item['id']}")
    if [row["gapAfterMs"] for row in rows] != [1150, 1100, 0]:
        raise RuntimeError(f"Unexpected gap plan for {item['id']}")
    emotion = item["variant"]["emotion"]
    for row in rows:
        marked = row["input"]
        if marked.count(f'<prosody rate="{RATE}">') != 1:
            raise RuntimeError(f"Wrong rate in {item['id']} {row['role']}")
        expected_styles = 1 if emotion else 0
        if marked.count("<speechify:style ") != expected_styles:
            raise RuntimeError(f"Wrong style count in {item['id']} {row['role']}")
        if emotion and f'emotion="{emotion}"' not in marked:
            raise RuntimeError(f"Wrong emotion in {item['id']} {row['role']}")
        if row["role"] == "question":
            if marked.count(f'<break time="{base.QUESTION_TO_TEXT_MS}ms"/>') != 1:
                raise RuntimeError(f"Question pause missing in {item['id']}")
        elif "<break " in marked:
            raise RuntimeError(f"Unexpected internal break in {item['id']} {row['role']}")


def segment_path(output_dir: Path, item: dict, row: dict) -> Path:
    identity = base.segment_identity(item, row)
    key = base.native.speechify.cache_key(identity)
    return output_dir / "segments" / item["id"] / f"{row['role']}-{row['voice']['id']}-{key}.wav"


def preflight(question: dict, output_dir: Path) -> dict:
    items = []
    missing_calls = 0
    missing_characters = 0
    for variant in VARIANTS:
        item, rows = segments(question, variant)
        validate_rows(item, rows)
        segment_plans = []
        for row in rows:
            path = segment_path(output_dir, item, row)
            cached = base.native.speechify.valid_wav(path)
            if not cached:
                missing_calls += 1
                missing_characters += len(row["input"])
            segment_plans.append(
                {
                    "role": row["role"],
                    "voice": row["voice"]["name"],
                    "rate": RATE,
                    "emotion": variant["emotion"],
                    "gapAfterMs": row["gapAfterMs"],
                    "input": row["input"],
                    "cached": cached,
                }
            )
        items.append(
            {
                "id": item["id"],
                "variant": variant,
                "wholeBodyOneRequest": True,
                "sentenceLevelSplit": False,
                "segments": segment_plans,
            }
        )
    if missing_calls > 9 or missing_characters > 6000:
        raise RuntimeError("Comparison preflight exceeds safety ceiling")
    return {
        "provider": "SpeechifyAI",
        "model": base.MODEL,
        "number": NUMBER,
        "rate": RATE,
        "nominalSpeed": NOMINAL_SPEED,
        "missingCalls": missing_calls,
        "missingInputCharacters": missing_characters,
        "maxCalls": 9,
        "maxInputCharacters": 6000,
        "items": items,
    }


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        variant = record["variant"]
        cards.append(
            f"""
            <article>
              <h2>{html.escape(variant['label'])}</h2>
              <p>本文 Geffen／番号・設問 Hugh／全発話0.90倍</p>
              <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}?v=20260720-no16-style-0p90-r2"></audio>
              <a href="{html.escape(record['publishedWav'])}?v=20260720-no16-style-0p90-r2" download>WAVを保存</a>
            </article>
            """
        )
    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>サンプルPart 2 No.16｜Simba読み方比較</title>
<style>
:root{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18211c;background:#f3f1eb}}
*{{box-sizing:border-box}}body{{margin:0}}main{{width:min(720px,calc(100% - 24px));margin:auto;padding:28px 0 48px}}
h1{{font-size:clamp(27px,7vw,42px);line-height:1.12;margin:0 0 14px}}.lead{{line-height:1.7;color:#4d5a51}}
article{{background:#fff;border:1px solid #d7ddd8;border-radius:18px;padding:18px;margin:16px 0;box-shadow:0 5px 22px rgba(35,50,41,.06)}}
h2{{margin:0 0 6px}}article p{{color:#637067}}audio{{display:block;width:100%;margin:12px 0}}a{{color:#285e40;font-weight:700}}
.contract{{background:#e4f0e8;border:1px solid #b9d2c1;border-radius:14px;padding:13px 15px;line-height:1.65}}
</style></head><body><main>
<h1>サンプルPart 2 No.16<br>Simba 3.2 読み方比較</h1>
<p class="lead">同じ本文・同じ声・同じ0.90倍で、スタイル指定だけを変えています。</p>
<p class="contract">48kHz・16bit・モノラルPCM WAV。本文は分割せず一括生成。速度後処理・再圧縮・リサンプリング・音量加工なし。</p>
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


def execute(question: dict, output_dir: Path, publish_dir: Path, plan: dict) -> dict:
    api_key = (
        os.environ.get("SPEECHIFY_API_KEY", "").strip()
        or os.environ.get("SPEECHFY_API_KEY", "").strip()
    )
    if plan["missingCalls"] and not api_key:
        raise RuntimeError("SPEECHIFY_API_KEY is not set")
    (output_dir / "audio").mkdir(parents=True, exist_ok=True)
    (publish_dir / "audio").mkdir(parents=True, exist_ok=True)
    request_count = 0
    billed_characters = 0
    records = []
    for variant in VARIANTS:
        item, rows = segments(question, variant)
        validate_rows(item, rows)
        inputs = []
        segment_reports = []
        for row in rows:
            path = segment_path(output_dir, item, row)
            api = None
            if not base.native.speechify.valid_wav(path):
                api = base.native.request_segment(api_key, item, row, path)
                request_count += 1
                billed_characters += api.get("billableCharacters") or 0
                time.sleep(0.35)
            info, pcm = base.native.read_pcm(path)
            base.assert_wave_contract(info, f"{item['id']} {row['role']}")
            inputs.append((row, path))
            segment_reports.append(
                {
                    "role": row["role"],
                    "voice": row["voice"]["name"],
                    "voiceId": row["voice"]["id"],
                    "input": row["input"],
                    "rate": RATE,
                    "emotion": variant["emotion"],
                    "gapAfterMs": row["gapAfterMs"],
                    "sourceWav": str(path.relative_to(ROOT)),
                    "sourceFileSha256": base.native.sha256_file(path),
                    "sourcePcmSha256": base.native.sha256_bytes(pcm),
                    "wave": info,
                    "api": api,
                }
            )
        filename = f"part2-16-simba-3-2-0p90-{variant['id']}.wav"
        master = output_dir / "audio" / filename
        pcm_summary, slices = base.native.write_lossless_combined(master, inputs)
        base.assert_wave_contract(pcm_summary["wave"], f"final {item['id']}")
        published = publish_dir / "audio" / filename
        shutil.copyfile(master, published)
        master_hash = base.native.sha256_file(master)
        published_hash = base.native.sha256_file(published)
        if master_hash != published_hash:
            raise RuntimeError(f"Published copy differs for {variant['id']}")
        records.append(
            {
                "id": item["id"],
                "variant": variant,
                "segments": segment_reports,
                "pcmVerification": pcm_summary,
                "sliceVerification": slices,
                "masterWav": str(master.relative_to(ROOT)),
                "publishedWav": f"audio/{filename}",
                "masterSha256": master_hash,
                "publishedSha256": published_hash,
                "publishedCopyHashMatch": True,
                "fileBytes": master.stat().st_size,
            }
        )
    write_page(publish_dir, records)
    report = {
        "mode": "completed",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "provider": "SpeechifyAI",
        "model": base.MODEL,
        "language": base.LANGUAGE,
        "number": NUMBER,
        "rate": RATE,
        "nominalSpeed": NOMINAL_SPEED,
        "apiRequestCount": request_count,
        "billableCharacters": billed_characters,
        "comparisonOnly": True,
        "productionStyleFinalized": False,
        "deliveryContract": {
            "wholeBodyOneRequest": True,
            "sentenceLevelSplit": False,
            "speechifyDirectWav": True,
            "losslessPcmConcatenation": True,
            "postSynthesisReencoding": False,
            "postSynthesisResampling": False,
            "lossyEncoding": False,
        },
        "preflight": plan,
        "items": records,
    }
    (output_dir / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return report


def main() -> int:
    args = parse_args()
    base.native.MODEL = base.MODEL
    base.native.LANGUAGE = base.LANGUAGE
    base.native.segment_identity = base.segment_identity
    question = load_question()
    plan = preflight(question, args.output_dir)
    if not args.execute:
        print(json.dumps({"mode": "preflight", **plan}, ensure_ascii=False, indent=2))
        return 0
    report = execute(question, args.output_dir, args.publish_dir, plan)
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "rate": report["rate"],
                "variants": [item["variant"]["id"] for item in report["items"]],
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
