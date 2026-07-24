from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import generate_grade2_round1_part2_simba_trial as sentence_tools
import generate_grade2_sample_part2_simba_final_fifteen as source


base = source.base
ROOT = source.ROOT
SOURCE_JS = source.SOURCE_JS
OUTPUT_DIR = ROOT / "audio-generation/grade2-sample-part2-16-17-simba-sentence-split-0p90-20260720"
PUBLISH_DIR = ROOT / "audio-generation/cloudflare-publish/grade2-sample-part2-16-17-simba-sentence-split-0p90-20260720"
RANGE_WORKER = source.RANGE_WORKER

NUMBERS = (16, 17)
RATE = "-10%"
SENTENCE_GAP_MS = 150
COMMA_BREAK_MS = 80
GEFFEN = base.GEFFEN
HUGH = source.HUGH


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate sample Part 2 No.16-17 by synthesizing every body "
            "sentence separately and joining direct PCM WAV samples."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def load_questions() -> list[dict]:
    questions = base.source.load_source_questions(SOURCE_JS, "sample")
    selected = []
    for number in NUMBERS:
        question = next(
            (
                row
                for row in questions
                if row.get("part") == "Part 2" and int(row["id"]) == number
            ),
            None,
        )
        if question is None:
            raise RuntimeError(f"Sample Part 2 No.{number} was not found")
        selected.append(question)
    return selected


def comma_ssml(text: str) -> tuple[str, int]:
    escaped = html.escape(text, quote=False)
    escaped, comma_count = re.subn(
        r",(?=\s)",
        f',<break time="{COMMA_BREAK_MS}ms"/>',
        escaped,
    )
    return f'<speak><prosody rate="{RATE}">{escaped}</prosody></speak>', comma_count


def make_item(question: dict) -> tuple[dict, list[dict]]:
    number = int(question["id"])
    body_text = str(question.get("script", "")).strip()
    question_text = str(question.get("questionText", "")).strip()
    body_safe, body_replacements = base.tts_safe_text(number, body_text)
    question_safe, question_replacements = base.tts_safe_text(number, question_text)
    sentences = sentence_tools.split_sentences(body_safe)
    if len(sentences) != 4 or any(not sentence.endswith(".") for sentence in sentences):
        raise RuntimeError(f"No.{number} must split into four complete sentences")
    item = {
        "id": f"part2-No{number:02d}-sentence-split-0p90",
        "part": "Part 2",
        "number": number,
        "bodyText": body_text,
        "questionText": question_text,
        "bodyTtsText": body_safe,
        "bodyTtsOverrides": body_replacements,
        "questionTtsOverrides": question_replacements,
        "sentences": sentences,
    }
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "voice": HUGH,
            "displayText": f"Number {number}.",
            "ttsText": f"Number {source.NUMBER_WORDS[number]}.",
            "input": base.prosody_ssml(
                f"Number {source.NUMBER_WORDS[number]}.", RATE
            ),
            "rate": RATE,
            "gapAfterMs": base.NUMBER_TO_BODY_MS,
        }
    ]
    for index, sentence in enumerate(sentences, start=1):
        marked, comma_count = comma_ssml(sentence)
        rows.append(
            {
                "role": f"bodySentence{index}",
                "speaker": "body",
                "voice": GEFFEN,
                "displayText": sentence,
                "ttsText": sentence,
                "input": marked,
                "rate": RATE,
                "commaBreakCount": comma_count,
                "gapAfterMs": (
                    SENTENCE_GAP_MS if index < len(sentences) else base.BODY_TO_QUESTION_MS
                ),
            }
        )
    rows.append(
        {
            "role": "question",
            "speaker": "narrator",
            "voice": HUGH,
            "displayText": f"Question. {question_text}",
            "ttsText": f"Question. {question_safe}",
            "input": (
                f'<speak><prosody rate="{RATE}">Question.'
                f'<break time="{base.QUESTION_TO_TEXT_MS}ms"/>'
                f"{html.escape(question_safe, quote=False)}</prosody></speak>"
            ),
            "rate": RATE,
            "gapAfterMs": 0,
        }
    )
    return item, rows


def validate(item: dict, rows: list[dict]) -> None:
    expected_roles = [
        "number",
        "bodySentence1",
        "bodySentence2",
        "bodySentence3",
        "bodySentence4",
        "question",
    ]
    if [row["role"] for row in rows] != expected_roles:
        raise RuntimeError(f"Unexpected request units in {item['id']}")
    expected_gaps = [1150, 150, 150, 150, 1100, 0]
    if [row["gapAfterMs"] for row in rows] != expected_gaps:
        raise RuntimeError(f"Unexpected gap plan in {item['id']}")
    for row in rows:
        if row["input"].count(f'<prosody rate="{RATE}">') != 1:
            raise RuntimeError(f"Wrong rate in {item['id']} {row['role']}")
        if "speechify:style" in row["input"]:
            raise RuntimeError(f"Unexpected style in {item['id']} {row['role']}")
        if row["role"].startswith("bodySentence"):
            expected_commas = len(re.findall(r",(?=\s)", row["ttsText"]))
            if row["commaBreakCount"] != expected_commas:
                raise RuntimeError(f"Wrong comma count in {item['id']} {row['role']}")
            if row["input"].count(f'<break time="{COMMA_BREAK_MS}ms"/>') != expected_commas:
                raise RuntimeError(f"Comma breaks missing in {item['id']} {row['role']}")
        elif row["role"] == "question":
            if row["input"].count(
                f'<break time="{base.QUESTION_TO_TEXT_MS}ms"/>'
            ) != 1:
                raise RuntimeError(f"Question break missing in {item['id']}")


def segment_path(output_dir: Path, item: dict, row: dict) -> Path:
    identity = base.segment_identity(item, row)
    key = base.native.speechify.cache_key(identity)
    return output_dir / "segments" / item["id"] / f"{row['role']}-{row['voice']['id']}-{key}.wav"


def preflight(questions: list[dict], output_dir: Path) -> dict:
    item_plans = []
    missing_calls = 0
    missing_characters = 0
    for question in questions:
        item, rows = make_item(question)
        validate(item, rows)
        serialized = []
        for row in rows:
            path = segment_path(output_dir, item, row)
            cached = base.native.speechify.valid_wav(path)
            if not cached:
                missing_calls += 1
                missing_characters += len(row["input"])
            serialized.append(
                {
                    "role": row["role"],
                    "voice": row["voice"]["name"],
                    "rate": row["rate"],
                    "input": row["input"],
                    "gapAfterMs": row["gapAfterMs"],
                    "cached": cached,
                }
            )
        item_plans.append(
            {
                "id": item["id"],
                "number": item["number"],
                "wholeBodyOneRequest": False,
                "sentenceLevelSplit": True,
                "bodySentenceRequestCount": 4,
                "segments": serialized,
            }
        )
    if missing_calls > 12 or missing_characters > 6000:
        raise RuntimeError("Sentence-split preflight exceeds safety ceiling")
    return {
        "provider": "SpeechifyAI",
        "model": base.MODEL,
        "rate": RATE,
        "nominalSpeed": 0.90,
        "missingCalls": missing_calls,
        "missingInputCharacters": missing_characters,
        "maxCalls": 12,
        "maxInputCharacters": 6000,
        "sentenceGapMs": SENTENCE_GAP_MS,
        "commaBreakMs": COMMA_BREAK_MS,
        "items": item_plans,
    }


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        sentence_rows = [
            row for row in record["segments"] if row["role"].startswith("bodySentence")
        ]
        cards.append(
            f"""
            <article>
              <h2>Number {record['number']}</h2>
              <p>本文4文を4回に分けて生成後、PCM結合</p>
              <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}?v=20260720-sentence-split-0p90-r1"></audio>
              <a href="{html.escape(record['publishedWav'])}?v=20260720-sentence-split-0p90-r1" download>WAVを保存</a>
              <details><summary>分割内容を見る</summary>
                {''.join(f'<p><strong>文{index}：</strong>{html.escape(row["displayText"])}</p>' for index, row in enumerate(sentence_rows, start=1))}
              </details>
            </article>
            """
        )
    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>サンプルPart 2 No.16-17｜1文ずつ生成・結合テスト</title>
<style>
:root{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18211c;background:#f3f1eb}}
*{{box-sizing:border-box}}body{{margin:0}}main{{width:min(720px,calc(100% - 24px));margin:auto;padding:28px 0 48px}}
h1{{font-size:clamp(27px,7vw,42px);line-height:1.12;margin:0 0 14px}}.lead{{line-height:1.7;color:#4d5a51}}
article{{background:#fff;border:1px solid #d7ddd8;border-radius:18px;padding:18px;margin:16px 0;box-shadow:0 5px 22px rgba(35,50,41,.06)}}
h2{{margin:0 0 6px}}article p{{color:#637067;line-height:1.6}}audio{{display:block;width:100%;margin:12px 0}}a{{color:#285e40;font-weight:700}}
.contract{{background:#f2e8dc;border:1px solid #dbc7ae;border-radius:14px;padding:13px 15px;line-height:1.65}}details{{margin-top:13px;border-top:1px solid #e4e8e5;padding-top:11px}}
</style></head><body><main>
<h1>サンプルPart 2<br>No.16・17 文ごと生成テスト</h1>
<p class="lead">本文を1文ずつ別々にSimba生成し、文間へ{SENTENCE_GAP_MS}msを入れてPCM WAVのまま結合しました。</p>
<p class="contract">Simba 3.2／全発話0.90倍／スタイルなし／コンマ後{COMMA_BREAK_MS}ms<br>48kHz・16bit・モノラルPCM WAV。再圧縮・リサンプリング・無音トリミング・音量加工なし。</p>
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


def execute(
    questions: list[dict], output_dir: Path, publish_dir: Path, plan: dict
) -> dict:
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
    for question in questions:
        item, rows = make_item(question)
        validate(item, rows)
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
                    "displayText": row["displayText"],
                    "ttsText": row["ttsText"],
                    "input": row["input"],
                    "rate": RATE,
                    "gapAfterMs": row["gapAfterMs"],
                    "sourceWav": str(path.relative_to(ROOT)),
                    "sourceFileSha256": base.native.sha256_file(path),
                    "sourcePcmSha256": base.native.sha256_bytes(pcm),
                    "wave": info,
                    "api": api,
                }
            )
        filename = f"part2-{item['number']:02d}-simba-3-2-0p90-sentence-split.wav"
        master = output_dir / "audio" / filename
        pcm_summary, slices = base.native.write_lossless_combined(master, inputs)
        base.assert_wave_contract(pcm_summary["wave"], f"final {item['id']}")
        published = publish_dir / "audio" / filename
        shutil.copyfile(master, published)
        master_hash = base.native.sha256_file(master)
        published_hash = base.native.sha256_file(published)
        if master_hash != published_hash:
            raise RuntimeError(f"Published copy differs for No.{item['number']}")
        records.append(
            {
                "id": item["id"],
                "number": item["number"],
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
        "numbers": list(NUMBERS),
        "rate": RATE,
        "nominalSpeed": 0.90,
        "apiRequestCount": request_count,
        "billableCharacters": billed_characters,
        "comparisonOnly": True,
        "wholeBodyOneRequest": False,
        "sentenceLevelSplit": True,
        "sentenceGapMs": SENTENCE_GAP_MS,
        "commaBreakMs": COMMA_BREAK_MS,
        "deliveryContract": {
            "directPcmSentenceConcatenation": True,
            "speechPcmSamplesChanged": False,
            "silenceInsertionOnly": True,
            "postSynthesisReencoding": False,
            "postSynthesisResampling": False,
            "silenceTrimming": False,
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
    base.TTS_REPLACEMENTS = source.TTS_REPLACEMENTS
    base.native.MODEL = base.MODEL
    base.native.LANGUAGE = base.LANGUAGE
    base.native.segment_identity = base.segment_identity
    questions = load_questions()
    plan = preflight(questions, args.output_dir)
    if not args.execute:
        print(json.dumps({"mode": "preflight", **plan}, ensure_ascii=False, indent=2))
        return 0
    report = execute(questions, args.output_dir, args.publish_dir, plan)
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "rate": RATE,
                "trackCount": len(report["items"]),
                "apiRequestCount": report["apiRequestCount"],
                "billableCharacters": report["billableCharacters"],
                "sentenceLevelSplit": report["sentenceLevelSplit"],
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
