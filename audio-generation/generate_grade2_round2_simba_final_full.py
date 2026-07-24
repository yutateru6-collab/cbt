from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import generate_grade2_round1_part1 as source
import generate_grade2_round1_simba_final_part1_part2_five as base
import generate_grade2_round1_part2_simba_trial as sentence_tools
import generate_grade2_sample_part2_16_17_simba_sentence_split_0p90 as split_base


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
OUTPUT_DIR = ROOT / "audio-generation/grade2-round2-simba-final-full-20260721"
PUBLISH_DIR = (
    ROOT / "audio-generation/cloudflare-publish/grade2-round2-simba-final-full-20260721"
)
RANGE_WORKER = ROOT / "audio-generation/cloudflare-wav-range-worker.js"

SET_KEY = "set-02"
PART1_NUMBERS = tuple(range(1, 16))
PART2_NUMBERS = tuple(range(16, 31))
PART1_RATE = "-8%"
PART2_RATE = "-10%"
SENTENCE_GAP_MS = 150
COMMA_BREAK_MS = 80

HUGH = {"id": "hugh_32", "name": "Hugh", "gender": "male"}
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
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
    19: "nineteen",
    20: "twenty",
    21: "twenty-one",
    22: "twenty-two",
    23: "twenty-three",
    24: "twenty-four",
    25: "twenty-five",
    26: "twenty-six",
    27: "twenty-seven",
    28: "twenty-eight",
    29: "twenty-nine",
    30: "thirty",
}
TTS_REPLACEMENTS = {
    1: {"Mr. Evans": "Mister Evans"},
    25: {"route 18": "route eighteen"},
}
PART2_BODY_VOICES = {
    number: (
        base.GEFFEN if 16 <= number <= 20 or 26 <= number <= 30 else base.DOMINIC
    )
    for number in PART2_NUMBERS
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate all 30 Grade 2 Round 2 listening items using the approved "
            "SpeechifyAI Simba 3.2 mass-production rules."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def configure_base() -> None:
    base.SOURCE_JS = SOURCE_JS
    base.SET_KEY = SET_KEY
    base.PART1_NUMBERS = PART1_NUMBERS
    base.PART2_NUMBERS = ()
    base.NUMBER_WORDS = NUMBER_WORDS
    base.TTS_REPLACEMENTS = TTS_REPLACEMENTS
    base.PART1_NARRATORS = {number: base.HARPER for number in PART1_NUMBERS}
    base.PART1_RATE = PART1_RATE
    base.PART2_RATE = PART2_RATE
    base.QUESTION_RATE = PART1_RATE
    base.APPROVED_VOICES = {
        base.GEFFEN["id"],
        base.DOMINIC["id"],
        base.HARPER["id"],
    }
    base.MAX_CALLS = len(PART1_NUMBERS) * 6
    base.MAX_TOTAL_INPUT_CHARACTERS = 50000
    base.AUDIO_CACHE_VERSION = "20260721-round2-simba-final"
    base.native.MODEL = base.MODEL
    base.native.LANGUAGE = base.LANGUAGE
    base.native.segment_identity = base.segment_identity
    base.write_page = write_stage_page


def configure_part2_split() -> None:
    base.PART2_RATE = PART2_RATE
    base.QUESTION_RATE = PART2_RATE
    base.NUMBER_WORDS = NUMBER_WORDS
    base.TTS_REPLACEMENTS = TTS_REPLACEMENTS
    base.APPROVED_VOICES = {
        base.GEFFEN["id"],
        base.DOMINIC["id"],
        HUGH["id"],
    }
    split_base.NUMBERS = PART2_NUMBERS
    split_base.RATE = PART2_RATE
    split_base.SENTENCE_GAP_MS = SENTENCE_GAP_MS
    split_base.COMMA_BREAK_MS = COMMA_BREAK_MS
    split_base.HUGH = HUGH
    split_base.make_item = make_part2_item
    split_base.write_page = write_stage_page


def load_part1_items() -> list[dict]:
    items = base.load_items()
    if [item["number"] for item in items] != list(PART1_NUMBERS):
        raise RuntimeError("Round 2 Part 1 source selection is incomplete")
    return items


def load_part2_questions() -> list[dict]:
    questions = source.load_source_questions(SOURCE_JS, SET_KEY)
    selected = [
        question
        for question in questions
        if question.get("part") == "Part 2"
        and int(question["id"]) in PART2_NUMBERS
    ]
    selected.sort(key=lambda question: int(question["id"]))
    if [int(question["id"]) for question in selected] != list(PART2_NUMBERS):
        raise RuntimeError("Round 2 Part 2 source selection is incomplete")
    return selected


def comma_ssml(text: str) -> tuple[str, int]:
    escaped = html.escape(text, quote=False)
    escaped, comma_count = re.subn(
        r",(?=\s)",
        f',<break time="{COMMA_BREAK_MS}ms"/>',
        escaped,
    )
    return (
        f'<speak><prosody rate="{PART2_RATE}">{escaped}</prosody></speak>',
        comma_count,
    )


def make_part2_item(question: dict) -> tuple[dict, list[dict]]:
    number = int(question["id"])
    body_text = str(question.get("script", "")).strip()
    question_text = str(question.get("questionText", "")).strip()
    body_safe, body_replacements = base.tts_safe_text(number, body_text)
    question_safe, question_replacements = base.tts_safe_text(number, question_text)
    sentences = sentence_tools.split_sentences(body_safe)
    if len(sentences) != 4 or any(not sentence.endswith(".") for sentence in sentences):
        raise RuntimeError(f"Round 2 Part 2 No.{number} must contain four complete sentences")

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
        "voicePlan": {
            "body": PART2_BODY_VOICES[number],
            "narrator": HUGH,
        },
    }
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "voice": HUGH,
            "displayText": f"Number {number}.",
            "ttsText": f"Number {NUMBER_WORDS[number]}.",
            "input": base.prosody_ssml(
                f"Number {NUMBER_WORDS[number]}.", PART2_RATE
            ),
            "rate": PART2_RATE,
            "gapAfterMs": base.NUMBER_TO_BODY_MS,
        }
    ]
    for index, sentence in enumerate(sentences, start=1):
        marked, comma_count = comma_ssml(sentence)
        rows.append(
            {
                "role": f"bodySentence{index}",
                "speaker": "body",
                "voice": PART2_BODY_VOICES[number],
                "displayText": sentence,
                "ttsText": sentence,
                "input": marked,
                "rate": PART2_RATE,
                "commaBreakCount": comma_count,
                "gapAfterMs": (
                    SENTENCE_GAP_MS
                    if index < len(sentences)
                    else base.BODY_TO_QUESTION_MS
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
                f'<speak><prosody rate="{PART2_RATE}">Question.'
                f'<break time="{base.QUESTION_TO_TEXT_MS}ms"/>'
                f"{html.escape(question_safe, quote=False)}</prosody></speak>"
            ),
            "rate": PART2_RATE,
            "gapAfterMs": 0,
        }
    )
    return item, rows


def preflight_part1(items: list[dict], output_dir: Path) -> dict:
    plan = base.preflight(items, output_dir)
    plan["expectedRequestUnits"] = len(items) * 6
    plan["source"] = str(SOURCE_JS.relative_to(ROOT))
    plan["sourceSet"] = SET_KEY
    plan["rate"] = PART1_RATE
    return plan


def preflight_part2(questions: list[dict], output_dir: Path) -> dict:
    item_plans = []
    missing_calls = 0
    missing_characters = 0
    for question in questions:
        item, rows = make_part2_item(question)
        split_base.validate(item, rows)
        serialized = []
        for row in rows:
            path = split_base.segment_path(output_dir, item, row)
            cached = base.native.speechify.valid_wav(path)
            if not cached:
                missing_calls += 1
                missing_characters += len(row["input"])
            serialized.append(
                {
                    "role": row["role"],
                    "voice": row["voice"]["name"],
                    "voiceId": row["voice"]["id"],
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
    max_calls = len(questions) * 6
    max_characters = 50000
    if missing_calls > max_calls or missing_characters > max_characters:
        raise RuntimeError("Round 2 Part 2 preflight exceeds the safety ceiling")
    return {
        "provider": "SpeechifyAI",
        "model": base.MODEL,
        "language": base.LANGUAGE,
        "source": str(SOURCE_JS.relative_to(ROOT)),
        "sourceSet": SET_KEY,
        "rate": PART2_RATE,
        "nominalSpeed": 0.90,
        "expectedRequestUnits": len(questions) * 6,
        "missingCalls": missing_calls,
        "missingInputCharacters": missing_characters,
        "maxCalls": max_calls,
        "maxInputCharacters": max_characters,
        "sentenceGapMs": SENTENCE_GAP_MS,
        "commaBreakMs": COMMA_BREAK_MS,
        "items": item_plans,
    }


def write_stage_page(publish_dir: Path, records: list[dict]) -> None:
    publish_dir.mkdir(parents=True, exist_ok=True)
    cards = "".join(
        f'<article><h2>Number {record["number"]}</h2>'
        f'<audio controls src="{html.escape(record["publishedWav"])}"></audio></article>'
        for record in records
    )
    (publish_dir / "index.html").write_text(
        "<!doctype html><html lang=\"ja\"><meta charset=\"utf-8\">"
        f"<body><main>{cards}</main></body></html>",
        encoding="utf-8",
    )


def combined_script_html(record: dict) -> str:
    if record.get("part") == "Part 1":
        return record["scriptHtml"]
    body_rows = [
        row for row in record["segments"] if row["role"].startswith("bodySentence")
    ]
    question_row = next(row for row in record["segments"] if row["role"] == "question")
    body = " ".join(row["displayText"] for row in body_rows)
    question = question_row["displayText"].removeprefix("Question. ")
    return (
        f"<p>{html.escape(body)}</p>"
        f'<p class="question"><strong>Question</strong> {html.escape(question)}</p>'
    )


def billable_characters(ssml: str) -> int:
    plain_text = html.unescape(re.sub(r"<[^>]+>", "", ssml))
    return len(plain_text)


def write_combined_page(
    publish_dir: Path, part1_records: list[dict], part2_records: list[dict]
) -> None:
    audio_dir = publish_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    sections = []
    for part, records in (("Part 1", part1_records), ("Part 2", part2_records)):
        cards = []
        for record in records:
            source_wav = ROOT / record["masterWav"]
            target_wav = audio_dir / source_wav.name
            shutil.copyfile(source_wav, target_wav)
            if base.native.sha256_file(source_wav) != base.native.sha256_file(target_wav):
                raise RuntimeError(f"Final publish copy differs: {source_wav.name}")
            if part == "Part 1":
                voice = "Geffen × Dominic／番号・設問 Harper"
            else:
                body_voice = next(
                    row["voice"]
                    for row in record["segments"]
                    if row["role"] == "bodySentence1"
                )
                voice = f"本文 {body_voice}／番号・設問 Hugh"
            cards.append(
                f"""
                <article class="question-card">
                  <div class="card-head"><div><h3>Number {record['number']}</h3><p>{html.escape(voice)}</p></div>
                  <a class="download" href="audio/{html.escape(source_wav.name)}?v=20260721-round2-final" download>WAVを保存</a></div>
                  <audio controls preload="metadata" src="audio/{html.escape(source_wav.name)}?v=20260721-round2-final"></audio>
                  <details><summary>英文を見る</summary>{combined_script_html(record)}</details>
                </article>
                """
            )
        note = (
            "発言ターン単位で生成。1ターン内は文で切っていません。"
            if part == "Part 1"
            else "本文を1文ずつ生成。途中のピリオド後150ms、コンマ後80msです。"
        )
        sections.append(
            f'<section><h2>{part}・15問</h2><p class="part-note">{note}</p>{"".join(cards)}</section>'
        )

    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>英検2級 第2回 Part 1・Part 2｜Simba 3.2</title>
<style>
:root{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18211c;background:#f3f1eb}}*{{box-sizing:border-box}}body{{margin:0}}
main{{width:min(780px,calc(100% - 24px));margin:auto;padding:28px 0 52px}}h1{{font-size:clamp(27px,7vw,43px);line-height:1.1;margin:0 0 14px}}h1 span{{display:block;color:#35644a}}
h2{{margin:34px 0 4px;font-size:28px}}h3{{font-size:22px;margin:0 0 4px}}.lead,.contract,.part-note,.note{{line-height:1.7;color:#4d5a51}}
.contract{{background:#e4f0e8;border:1px solid #b9d2c1;border-radius:14px;padding:13px 15px}}.question-card{{background:#fff;border:1px solid #d7ddd8;border-radius:18px;padding:17px;margin:15px 0;box-shadow:0 5px 22px rgba(35,50,41,.06)}}
.card-head{{display:flex;align-items:start;justify-content:space-between;gap:12px}}.card-head p{{margin:0 0 13px;color:#637067}}.download{{color:#285e40;font-weight:700;white-space:nowrap}}audio{{display:block;width:100%;margin:8px 0 13px}}
details{{border-top:1px solid #e4e8e5;padding-top:11px}}summary{{cursor:pointer;font-weight:700}}details p{{line-height:1.65}}.question{{color:#244f36}}.note{{font-size:14px}}@media(max-width:460px){{.card-head{{display:block}}.download{{display:inline-block;margin-bottom:10px}}}}
</style></head><body><main>
<h1>英検2級 第2回<span>Part 1・Part 2 全30問</span></h1>
<p class="lead">確定したSpeechifyAI Simba 3.2量産ルールで作成しました。</p>
<p class="contract"><strong>48kHz・16bit・モノラルPCM WAV</strong><br>Part 1は0.92倍、Part 2は0.90倍。再圧縮・リサンプリング・速度後処理・音量加工・無音トリミングなし。通常再生は1.00倍です。</p>
{"".join(sections)}
<p class="note">番号後1.15秒／Part 1話者交代0.55秒／本文後1.10秒／“Question.”後0.35秒。全セグメントのPCM一致を検査しています。</p>
</main><script>const players=[...document.querySelectorAll('audio')];players.forEach(p=>{{p.defaultPlaybackRate=1;p.playbackRate=1;p.addEventListener('play',()=>players.forEach(o=>{{if(o!==p)o.pause()}}))}});</script></body></html>"""
    publish_dir.mkdir(parents=True, exist_ok=True)
    (publish_dir / "index.html").write_text(page, encoding="utf-8")
    (publish_dir / "_headers").write_text(
        "/audio/*.wav\n  Content-Type: audio/wav\n  Cache-Control: public, max-age=31536000, immutable\n",
        encoding="utf-8",
    )
    if RANGE_WORKER.exists():
        shutil.copy2(RANGE_WORKER, publish_dir / "_worker.js")


def preflight(output_dir: Path) -> tuple[list[dict], list[dict], dict, dict]:
    configure_base()
    part1_items = load_part1_items()
    part1_plan = preflight_part1(part1_items, output_dir / "part1")
    configure_part2_split()
    part2_questions = load_part2_questions()
    part2_plan = preflight_part2(part2_questions, output_dir / "part2")
    return part1_items, part2_questions, part1_plan, part2_plan


def execute(
    output_dir: Path,
    publish_dir: Path,
    part1_items: list[dict],
    part2_questions: list[dict],
    part1_plan: dict,
    part2_plan: dict,
) -> dict:
    configure_base()
    part1_output = output_dir / "part1"
    part1_report = base.execute(
        part1_items, part1_output, output_dir / "_stage-part1", part1_plan
    )
    configure_part2_split()
    part2_output = output_dir / "part2"
    part2_report = split_base.execute(
        part2_questions, part2_output, output_dir / "_stage-part2", part2_plan
    )
    part2_report["comparisonOnly"] = False
    part2_report["source"] = str(SOURCE_JS.relative_to(ROOT))
    part2_report["sourceSet"] = SET_KEY
    part2_report["canonicalMemo"] = "audio-generation/simba-3-2-final-production-memo.md"
    part2_report["deliveryContract"]["productionApprovedSentenceSplit"] = True
    (part2_output / "generation-report.json").write_text(
        json.dumps(part2_report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_combined_page(publish_dir, part1_report["items"], part2_report["items"])

    all_records = part1_report["items"] + part2_report["items"]
    all_segments = [segment for record in all_records for segment in record["segments"]]
    request_count_this_run = (
        part1_report["apiRequestCount"] + part2_report["apiRequestCount"]
    )
    billable_characters_this_run = (
        part1_report["billableCharacters"] + part2_report["billableCharacters"]
    )
    combined = {
        "mode": "completed",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "provider": "SpeechifyAI",
        "model": base.MODEL,
        "language": base.LANGUAGE,
        "source": str(SOURCE_JS.relative_to(ROOT)),
        "sourceSet": SET_KEY,
        "canonicalMemo": "audio-generation/simba-3-2-final-production-memo.md",
        "parts": {"Part 1": list(PART1_NUMBERS), "Part 2": list(PART2_NUMBERS)},
        "rates": {"Part 1": PART1_RATE, "Part 2": PART2_RATE},
        "uniqueRequestUnits": len(all_segments),
        "billableCharactersForUniqueUnits": sum(
            billable_characters(segment["input"]) for segment in all_segments
        ),
        "ssmlInputCharactersForUniqueUnits": sum(
            len(segment["input"]) for segment in all_segments
        ),
        "resumeRun": {
            "apiRequestCountThisRun": request_count_this_run,
            "billableCharactersThisRun": billable_characters_this_run,
            "note": (
                "The production resumed from cached PCM segments. Unique-unit totals do "
                "not prove the final provider-billed request count across interrupted runs."
            ),
        },
        "timingMs": {
            "numberToBody": base.NUMBER_TO_BODY_MS,
            "part1TurnGap": base.TURN_GAP_MS,
            "part2SentenceGap": SENTENCE_GAP_MS,
            "part2CommaBreak": COMMA_BREAK_MS,
            "bodyToQuestion": base.BODY_TO_QUESTION_MS,
            "questionToText": base.QUESTION_TO_TEXT_MS,
        },
        "quality": {
            "trackCount": len(all_records),
            "allPcmExact": all(
                record["pcmVerification"]["pcmExactMatch"]
                and record["pcmVerification"]["allSpeechSlicesExact"]
                and record["publishedCopyHashMatch"]
                for record in all_records
            ),
            "native48kHz16BitMonoPcm": all(
                record["pcmVerification"]["wave"]["sampleRateHz"] == 48000
                and record["pcmVerification"]["wave"]["sampleWidthBytes"] == 2
                and record["pcmVerification"]["wave"]["channels"] == 1
                for record in all_records
            ),
            "lossyEncoding": False,
            "resampling": False,
            "postSpeedChange": False,
            "silenceTrimming": False,
            "loudnessOrEqProcessing": False,
        },
        "preflight": {"Part 1": part1_plan, "Part 2": part2_plan},
        "reports": {
            "Part 1": str((part1_output / "generation-report.json").relative_to(ROOT)),
            "Part 2": str((part2_output / "generation-report.json").relative_to(ROOT)),
        },
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "generation-report.json").write_text(
        json.dumps(combined, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "index.html").write_text(
        (publish_dir / "index.html").read_text(encoding="utf-8"), encoding="utf-8"
    )
    return combined


def main() -> int:
    args = parse_args()
    part1_items, part2_questions, part1_plan, part2_plan = preflight(args.output_dir)
    summary = {
        "mode": "preflight",
        "sourceSet": SET_KEY,
        "trackCount": len(part1_items) + len(part2_questions),
        "expectedRequestUnits": (
            part1_plan["expectedRequestUnits"] + part2_plan["expectedRequestUnits"]
        ),
        "missingCalls": part1_plan["missingCalls"] + part2_plan["missingCalls"],
        "missingInputCharacters": (
            part1_plan["missingInputCharacters"]
            + part2_plan["missingInputCharacters"]
        ),
        "part1": {
            "numbers": list(PART1_NUMBERS),
            "rate": PART1_RATE,
            "missingCalls": part1_plan["missingCalls"],
        },
        "part2": {
            "numbers": list(PART2_NUMBERS),
            "rate": PART2_RATE,
            "sentenceLevelSplit": True,
            "sentenceGapMs": SENTENCE_GAP_MS,
            "commaBreakMs": COMMA_BREAK_MS,
            "missingCalls": part2_plan["missingCalls"],
        },
    }
    if not args.execute:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0
    report = execute(
        args.output_dir,
        args.publish_dir,
        part1_items,
        part2_questions,
        part1_plan,
        part2_plan,
    )
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "trackCount": report["quality"]["trackCount"],
                "uniqueRequestUnits": report["uniqueRequestUnits"],
                "billableCharactersForUniqueUnits": report[
                    "billableCharactersForUniqueUnits"
                ],
                "apiRequestCountThisRun": report["resumeRun"]["apiRequestCountThisRun"],
                "allPcmExact": report["quality"]["allPcmExact"],
                "native48kHz16BitMonoPcm": report["quality"]["native48kHz16BitMonoPcm"],
                "outputDir": str(args.output_dir),
                "publishDir": str(args.publish_dir),
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
