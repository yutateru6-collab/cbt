from __future__ import annotations

import argparse
import html
import json
import os
import shutil
import sys
import time
from array import array
from datetime import datetime, timezone
from pathlib import Path

import generate_grade2_round1_part1 as source
import generate_grade2_round1_part1_simba_3_2_native_wav_lossless as native


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-simba-final-part1-part2-five-20260719"
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-round1-simba-final-part1-part2-five-20260719"
)

SET_KEY = "set-01"
MODEL = "simba-3.2"
LANGUAGE = "en-US"
PART1_NUMBERS = (1, 2, 3, 4, 5)
PART2_NUMBERS = (16, 17, 18, 19, 20)

GEFFEN = {"id": "geffen_32", "name": "Geffen", "gender": "female"}
HARPER = {"id": "harper_32", "name": "Harper", "gender": "female"}
DOMINIC = {"id": "dominic_32", "name": "Dominic", "gender": "male"}
WYATT = {"id": "wyatt_32", "name": "Wyatt", "gender": "male"}
APPROVED_VOICES = {voice["id"] for voice in (GEFFEN, HARPER, DOMINIC, WYATT)}

PART1_NARRATORS = {
    1: HARPER,
    2: WYATT,
    3: HARPER,
    4: WYATT,
    5: HARPER,
}
PART2_VOICE_PLANS = {
    16: {"body": GEFFEN, "narrator": WYATT},
    17: {"body": DOMINIC, "narrator": HARPER},
    18: {"body": HARPER, "narrator": WYATT},
    19: {"body": WYATT, "narrator": GEFFEN},
    20: {"body": GEFFEN, "narrator": DOMINIC},
}

NUMBER_TO_BODY_MS = 1150
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1100
QUESTION_TO_TEXT_MS = 350
PART1_RATE = "-9%"
PART2_RATE = "-10%"
QUESTION_RATE = "-12%"

NUMBER_WORDS = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
    19: "nineteen",
    20: "twenty",
}
TTS_REPLACEMENTS = {3: {"café": "cafe"}}

MAX_CALLS = 50
MAX_TOTAL_INPUT_CHARACTERS = 15000
EXPECTED_SAMPLE_RATE = 48000
EXPECTED_SAMPLE_WIDTH = 2
EXPECTED_CHANNELS = 1
AUDIO_CACHE_VERSION = "20260719-range1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate Grade 2 Round 1 Part 1 No.1-5 and Part 2 No.16-20 "
            "with the canonical SpeechifyAI Simba 3.2 production rules."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def load_items() -> list[dict]:
    questions = source.load_source_questions(SOURCE_JS, SET_KEY)
    selected = []
    for question in questions:
        number = int(question["id"])
        part = question.get("part")
        if part == "Part 1" and number in PART1_NUMBERS:
            turns = source.parse_dialogue(str(question.get("script", "")))
            if len(turns) != 4:
                raise RuntimeError(f"Part 1 No.{number} must contain four complete turns")
            if any(not turn["text"] for turn in turns):
                raise RuntimeError(f"Part 1 No.{number} contains an empty turn")
            if any(turn["speaker"] not in {"A", "B"} for turn in turns):
                raise RuntimeError(f"Part 1 No.{number} contains an unknown speaker")
            if any(
                turns[index]["speaker"] == turns[index - 1]["speaker"]
                for index in range(1, len(turns))
            ):
                raise RuntimeError(f"Part 1 No.{number} speakers do not alternate")
            selected.append(
                {
                    "id": f"part1-No{number:02d}",
                    "part": "Part 1",
                    "number": number,
                    "turns": turns,
                    "questionText": str(question.get("questionText", "")).strip(),
                    "voicePlan": {
                        "A": GEFFEN,
                        "B": DOMINIC,
                        "narrator": PART1_NARRATORS[number],
                    },
                }
            )
        elif part == "Part 2" and number in PART2_NUMBERS:
            body = str(question.get("script", "")).strip()
            if not body:
                raise RuntimeError(f"Part 2 No.{number} has no body")
            selected.append(
                {
                    "id": f"part2-No{number:02d}",
                    "part": "Part 2",
                    "number": number,
                    "bodyText": body,
                    "questionText": str(question.get("questionText", "")).strip(),
                    "voicePlan": PART2_VOICE_PLANS[number],
                }
            )
    selected.sort(key=lambda item: (item["part"], item["number"]))
    part1 = [item["number"] for item in selected if item["part"] == "Part 1"]
    part2 = [item["number"] for item in selected if item["part"] == "Part 2"]
    if part1 != list(PART1_NUMBERS) or part2 != list(PART2_NUMBERS):
        raise RuntimeError(f"Unexpected source selection: Part 1={part1}, Part 2={part2}")
    return selected


def tts_safe_text(number: int, text: str) -> tuple[str, list[dict]]:
    safe = text
    replacements = []
    for original, replacement in TTS_REPLACEMENTS.get(number, {}).items():
        if original in safe:
            safe = safe.replace(original, replacement)
            replacements.append({"from": original, "to": replacement})
    return safe, replacements


def prosody_ssml(text: str, rate: str) -> str:
    return (
        f'<speak><prosody rate="{rate}">'
        f"{html.escape(text, quote=False)}"
        "</prosody></speak>"
    )


def question_ssml(text: str) -> str:
    return (
        f'<speak><prosody rate="{QUESTION_RATE}">'
        "Question."
        f'<break time="{QUESTION_TO_TEXT_MS}ms"/>'
        f"{html.escape(text, quote=False)}"
        "</prosody></speak>"
    )


def part1_segments(item: dict) -> list[dict]:
    narrator = item["voicePlan"]["narrator"]
    number = item["number"]
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "voice": narrator,
            "displayText": f"Number {number}.",
            "ttsText": f"Number {NUMBER_WORDS[number]}.",
            "ttsOverrides": [{"from": str(number), "to": NUMBER_WORDS[number]}],
            "rate": PART1_RATE,
            "gapAfterMs": NUMBER_TO_BODY_MS,
        }
    ]
    for index, turn in enumerate(item["turns"]):
        safe, replacements = tts_safe_text(number, turn["text"])
        rows.append(
            {
                "role": f"turn{index + 1}",
                "speaker": turn["speaker"],
                "voice": item["voicePlan"][turn["speaker"]],
                "displayText": turn["text"],
                "ttsText": safe,
                "ttsOverrides": replacements,
                "rate": PART1_RATE,
                "gapAfterMs": (
                    BODY_TO_QUESTION_MS
                    if index == len(item["turns"]) - 1
                    else TURN_GAP_MS
                ),
            }
        )
    question_safe, replacements = tts_safe_text(number, item["questionText"])
    rows.append(
        {
            "role": "question",
            "speaker": "narrator",
            "voice": narrator,
            "displayText": f"Question. {item['questionText']}",
            "ttsText": f"Question. {question_safe}",
            "ttsOverrides": replacements,
            "rate": QUESTION_RATE,
            "gapAfterMs": 0,
        }
    )
    for row in rows:
        row["input"] = (
            question_ssml(question_safe)
            if row["role"] == "question"
            else prosody_ssml(row["ttsText"], row["rate"])
        )
    return rows


def part2_segments(item: dict) -> list[dict]:
    number = item["number"]
    narrator = item["voicePlan"]["narrator"]
    body_safe, body_replacements = tts_safe_text(number, item["bodyText"])
    question_safe, question_replacements = tts_safe_text(number, item["questionText"])
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "voice": narrator,
            "displayText": f"Number {number}.",
            "ttsText": f"Number {NUMBER_WORDS[number]}.",
            "ttsOverrides": [{"from": str(number), "to": NUMBER_WORDS[number]}],
            "rate": PART2_RATE,
            "gapAfterMs": NUMBER_TO_BODY_MS,
        },
        {
            "role": "body",
            "speaker": "body",
            "voice": item["voicePlan"]["body"],
            "displayText": item["bodyText"],
            "ttsText": body_safe,
            "ttsOverrides": body_replacements,
            "rate": PART2_RATE,
            "gapAfterMs": BODY_TO_QUESTION_MS,
        },
        {
            "role": "question",
            "speaker": "narrator",
            "voice": narrator,
            "displayText": f"Question. {item['questionText']}",
            "ttsText": f"Question. {question_safe}",
            "ttsOverrides": question_replacements,
            "rate": QUESTION_RATE,
            "gapAfterMs": 0,
        },
    ]
    rows[0]["input"] = prosody_ssml(rows[0]["ttsText"], PART2_RATE)
    rows[1]["input"] = prosody_ssml(rows[1]["ttsText"], PART2_RATE)
    rows[2]["input"] = question_ssml(question_safe)
    return rows


def segments_for(item: dict) -> list[dict]:
    return part1_segments(item) if item["part"] == "Part 1" else part2_segments(item)


def assert_input_contract(item: dict, rows: list[dict]) -> None:
    expected_roles = (
        ["number", "turn1", "turn2", "turn3", "turn4", "question"]
        if item["part"] == "Part 1"
        else ["number", "body", "question"]
    )
    if [row["role"] for row in rows] != expected_roles:
        raise RuntimeError(f"Unexpected request units in {item['id']}")
    expected_gaps = (
        [NUMBER_TO_BODY_MS, TURN_GAP_MS, TURN_GAP_MS, TURN_GAP_MS, BODY_TO_QUESTION_MS, 0]
        if item["part"] == "Part 1"
        else [NUMBER_TO_BODY_MS, BODY_TO_QUESTION_MS, 0]
    )
    if [row["gapAfterMs"] for row in rows] != expected_gaps:
        raise RuntimeError(f"Unexpected gap plan in {item['id']}")
    if item["part"] == "Part 1":
        dialogue_voices = {
            row["voice"]["gender"] for row in rows if row["role"].startswith("turn")
        }
        if dialogue_voices != {"female", "male"}:
            raise RuntimeError(f"Part 1 must use one female and one male in {item['id']}")
    narrator_ids = {
        row["voice"]["id"] for row in rows if row["role"] in {"number", "question"}
    }
    if len(narrator_ids) != 1:
        raise RuntimeError(f"Number and question narrator differ in {item['id']}")
    for row in rows:
        if row["voice"]["id"] not in APPROVED_VOICES:
            raise RuntimeError(f"Unapproved voice in {item['id']}: {row['voice']['id']}")
        lowered = row["input"].lower()
        expected_rate = (
            QUESTION_RATE
            if row["role"] == "question"
            else PART1_RATE if item["part"] == "Part 1" else PART2_RATE
        )
        if lowered.count("<prosody ") != 1 or f'rate="{expected_rate}"' not in lowered:
            raise RuntimeError(f"Wrong prosody rate in {item['id']} {row['role']}")
        for forbidden in ("speechify:style", "<emphasis", "pitch=", "volume="):
            if forbidden in lowered:
                raise RuntimeError(f"Forbidden SSML in {item['id']} {row['role']}: {forbidden}")
        if row["role"] == "question":
            if lowered.count(f'<break time="{QUESTION_TO_TEXT_MS}ms"/>') != 1:
                raise RuntimeError(f"Question break missing in {item['id']}")
        elif "<break " in lowered:
            raise RuntimeError(f"Unexpected break in {item['id']} {row['role']}")


def segment_identity(item: dict, row: dict) -> dict:
    return {
        "provider": "SpeechifyAI",
        "apiVersion": native.speechify.SPEECHIFY_VERSION,
        "model": MODEL,
        "language": LANGUAGE,
        "audioFormat": "wav",
        "item": item["id"],
        "role": row["role"],
        "voiceId": row["voice"]["id"],
        "input": row["input"],
    }


def segment_path(output_dir: Path, item: dict, row: dict) -> Path:
    key = native.speechify.cache_key(segment_identity(item, row))
    return (
        output_dir
        / "segments"
        / item["id"]
        / f"{row['role']}-{row['voice']['id']}-{key}.wav"
    )


def assert_wave_contract(info: dict, context: str) -> None:
    if (
        info["sampleRateHz"] != EXPECTED_SAMPLE_RATE
        or info["sampleWidthBytes"] != EXPECTED_SAMPLE_WIDTH
        or info["channels"] != EXPECTED_CHANNELS
        or info["compressionType"] != "NONE"
    ):
        raise RuntimeError(f"Unexpected WAV format for {context}: {info}")


def pcm_sample_stats(path: Path) -> dict:
    _, pcm = native.read_pcm(path)
    samples = array("h")
    samples.frombytes(pcm)
    if sys.byteorder != "little":
        samples.byteswap()
    full_scale_samples = 0
    current_run = 0
    max_run = 0
    for sample in samples:
        if sample in (-32768, 32767):
            full_scale_samples += 1
            current_run += 1
            max_run = max(max_run, current_run)
        else:
            current_run = 0
    return {
        "minimumSample": min(samples),
        "maximumSample": max(samples),
        "fullScaleSampleCount": full_scale_samples,
        "maxConsecutiveFullScaleSamples": max_run,
        "noFullScalePlateau": max_run <= 1,
    }


def script_html(item: dict) -> str:
    if item["part"] == "Part 1":
        body = "".join(
            f'<p><strong>{html.escape(turn["speaker"])}</strong> '
            f'{html.escape(turn["text"])}</p>'
            for turn in item["turns"]
        )
    else:
        body = f'<p>{html.escape(item["bodyText"])}</p>'
    return body + (
        f'<p class="question"><strong>Question</strong> '
        f'{html.escape(item["questionText"])}</p>'
    )


def voice_label(record: dict) -> str:
    if record["part"] == "Part 1":
        return (
            f"Geffen × Dominic／ナレーター "
            f"{record['voices']['narrator']['name']}"
        )
    return (
        f"本文 {record['voices']['body']['name']}／ナレーター "
        f"{record['voices']['narrator']['name']}"
    )


def write_page(publish_dir: Path, records: list[dict]) -> None:
    sections = []
    for part in ("Part 1", "Part 2"):
        cards = []
        for record in records:
            if record["part"] != part:
                continue
            cards.append(
                f"""
                <article class="question-card" data-part="{html.escape(part)}">
                  <div class="card-head">
                    <div>
                      <h3>Number {record['number']}</h3>
                      <p>{html.escape(voice_label(record))}</p>
                    </div>
                    <a class="download" href="{html.escape(record['publishedWav'])}?v={AUDIO_CACHE_VERSION}" download>WAVを保存</a>
                  </div>
                  <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}?v={AUDIO_CACHE_VERSION}"></audio>
                  <details><summary>英文を見る</summary>{record['scriptHtml']}</details>
                </article>
                """
            )
        description = (
            "発言ターン単位で生成。1ターン内は文で切っていません。"
            if part == "Part 1"
            else "本文全体を1回で生成。文単位へ分割していません。"
        )
        sections.append(
            f'<section class="part"><h2>{part}・5問</h2>'
            f'<p class="part-note">{description}</p>{"".join(cards)}</section>'
        )
    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SCBT Part 1・Part 2｜Simba 3.2 最終ルール</title>
  <style>
    :root{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18211c;background:#f3f1eb}}
    *{{box-sizing:border-box}}body{{margin:0}}main{{width:min(780px,calc(100% - 24px));margin:auto;padding:28px 0 52px}}
    h1{{font-size:clamp(27px,7vw,43px);line-height:1.08;margin:0 0 14px}}h1 span{{display:block;color:#35644a}}
    h2{{margin:34px 0 4px;font-size:27px}}h3{{font-size:22px;margin:0 0 4px}}
    .lead,.contract,.note,.part-note{{line-height:1.7;color:#4d5a51}}.part-note{{margin:0 0 14px}}
    .contract{{background:#e4f0e8;border:1px solid #b9d2c1;border-radius:14px;padding:12px 14px}}
    .question-card{{background:#fff;border:1px solid #d7ddd8;border-radius:18px;padding:17px;margin:15px 0;box-shadow:0 5px 22px rgba(35,50,41,.06)}}
    .card-head{{display:flex;align-items:start;justify-content:space-between;gap:12px}}.card-head p{{margin:0 0 13px;color:#637067}}
    .download{{color:#285e40;font-weight:700;white-space:nowrap}}audio{{display:block;width:100%;margin:8px 0 13px}}
    details{{border-top:1px solid #e4e8e5;padding-top:11px}}summary{{cursor:pointer;font-weight:700}}details p{{line-height:1.65;margin:.7em 0}}.question{{color:#244f36}}.note{{font-size:14px}}
    @media(max-width:460px){{.card-head{{display:block}}.download{{display:inline-block;margin-bottom:10px}}}}
  </style>
</head>
<body><main>
  <h1>SCBTリスニング<span>Simba 3.2 最終ルール</span></h1>
  <p class="lead">Part 1を5問、Part 2を5問。4人の確定キャストと確定速度・間隔で作成しました。</p>
  <p class="contract"><strong>48kHz・16bit・モノラルPCM WAV</strong><br>
  Part 1の番号・会話0.91x／Part 2の番号・本文0.90x／Questionと設問0.88x。MP3化・再圧縮・リサンプリング・速度後処理・音量加工は行っていません。通常再生は1.00xです。</p>
  {''.join(sections)}
  <p class="note">間隔：番号後1.15秒／Part 1話者交代0.55秒／本文後1.10秒／“Question.”後0.35秒。発話PCMのバイト一致を全セグメントで検査しています。</p>
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


def preflight(items: list[dict], output_dir: Path) -> dict:
    item_plans = []
    missing_calls = 0
    missing_characters = 0
    for item in items:
        rows = segments_for(item)
        assert_input_contract(item, rows)
        serialized = []
        for row in rows:
            path = segment_path(output_dir, item, row)
            cached = native.speechify.valid_wav(path)
            if not cached:
                missing_calls += 1
                missing_characters += len(row["input"])
            serialized.append(
                {
                    "role": row["role"],
                    "speaker": row["speaker"],
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
                "part": item["part"],
                "wholeBodyOneRequest": item["part"] == "Part 2",
                "sentenceLevelSplit": False,
                "segments": serialized,
            }
        )
    if missing_calls > MAX_CALLS or missing_characters > MAX_TOTAL_INPUT_CHARACTERS:
        raise RuntimeError("Speechify preflight exceeds the fixed safety ceiling")
    return {
        "provider": "SpeechifyAI",
        "model": MODEL,
        "language": LANGUAGE,
        "apiVersion": native.speechify.SPEECHIFY_VERSION,
        "audioFormat": "wav",
        "expectedRequestUnits": 45,
        "missingCalls": missing_calls,
        "missingInputCharacters": missing_characters,
        "maxCalls": MAX_CALLS,
        "maxInputCharacters": MAX_TOTAL_INPUT_CHARACTERS,
        "items": item_plans,
    }


def execute(items: list[dict], output_dir: Path, publish_dir: Path, plan: dict) -> dict:
    api_key = (
        os.environ.get("SPEECHIFY_API_KEY", "").strip()
        or os.environ.get("SPEECHFY_API_KEY", "").strip()
    )
    if plan["missingCalls"] and not api_key:
        raise RuntimeError("SPEECHIFY_API_KEY is not set")
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "audio").mkdir(parents=True, exist_ok=True)
    (publish_dir / "audio").mkdir(parents=True, exist_ok=True)

    request_count = 0
    billed_characters = 0
    records = []
    for item in items:
        segment_inputs = []
        segment_reports = []
        for row in segments_for(item):
            path = segment_path(output_dir, item, row)
            api = None
            if not native.speechify.valid_wav(path):
                api = native.request_segment(api_key, item, row, path)
                request_count += 1
                billed_characters += api.get("billableCharacters") or 0
                time.sleep(0.35)
            info, pcm = native.read_pcm(path)
            assert_wave_contract(info, f"{item['id']} {row['role']}")
            segment_inputs.append((row, path))
            segment_reports.append(
                {
                    "role": row["role"],
                    "speaker": row["speaker"],
                    "voice": row["voice"]["name"],
                    "voiceId": row["voice"]["id"],
                    "displayText": row["displayText"],
                    "ttsText": row["ttsText"],
                    "ttsOverrides": row["ttsOverrides"],
                    "rate": row["rate"],
                    "input": row["input"],
                    "gapAfterMs": row["gapAfterMs"],
                    "sourceWav": str(path.relative_to(ROOT)),
                    "sourceFileSha256": native.sha256_file(path),
                    "sourcePcmSha256": native.sha256_bytes(pcm),
                    "wave": info,
                    "api": api,
                }
            )

        filename = f"{item['part'].lower().replace(' ', '')}-{item['number']:02d}-simba-3-2-final.wav"
        master_path = output_dir / "audio" / filename
        pcm_summary, slice_verification = native.write_lossless_combined(
            master_path, segment_inputs
        )
        assert_wave_contract(pcm_summary["wave"], f"final {item['id']}")
        published_path = publish_dir / "audio" / filename
        shutil.copyfile(master_path, published_path)
        master_hash = native.sha256_file(master_path)
        published_hash = native.sha256_file(published_path)
        if master_hash != published_hash:
            raise RuntimeError(f"Published copy differs from master: {filename}")
        voices = (
            item["voicePlan"]
            if item["part"] == "Part 1"
            else {"body": item["voicePlan"]["body"], "narrator": item["voicePlan"]["narrator"]}
        )
        records.append(
            {
                "id": item["id"],
                "part": item["part"],
                "number": item["number"],
                "voices": voices,
                "scriptHtml": script_html(item),
                "segments": segment_reports,
                "pcmVerification": pcm_summary,
                "sliceVerification": slice_verification,
                "masterWav": str(master_path.relative_to(ROOT)),
                "publishedWav": f"audio/{filename}",
                "masterSha256": master_hash,
                "publishedSha256": published_hash,
                "publishedCopyHashMatch": master_hash == published_hash,
                "fileBytes": master_path.stat().st_size,
                "samplePeak": pcm_sample_stats(master_path),
            }
        )

    write_page(publish_dir, records)
    report = {
        "mode": "completed",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "provider": "SpeechifyAI",
        "endpoint": native.speechify.SPEECHIFY_API_URL,
        "apiVersion": native.speechify.SPEECHIFY_VERSION,
        "model": MODEL,
        "language": LANGUAGE,
        "parts": {"Part 1": list(PART1_NUMBERS), "Part 2": list(PART2_NUMBERS)},
        "sourceSet": SET_KEY,
        "apiRequestCount": request_count,
        "billableCharacters": billed_characters,
        "rates": {
            "part1NumberAndDialogue": PART1_RATE,
            "part2NumberAndBody": PART2_RATE,
            "questionAndText": QUESTION_RATE,
        },
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "turnGap": TURN_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionToText": QUESTION_TO_TEXT_MS,
        },
        "deliveryContract": {
            "approvedVoicesOnly": sorted(APPROVED_VOICES),
            "part1FemaleMalePair": True,
            "part1CompleteTurnRequests": True,
            "part2WholeBodyOneRequest": True,
            "sentenceLevelSplit": False,
            "questionAndQuestionTextOneRequest": True,
            "speechifyDirectWav": True,
            "losslessPcmConcatenation": True,
            "speechPcmSamplesChanged": False,
            "silenceInsertionOnly": True,
            "ffmpegProcessing": False,
            "postSynthesisReencoding": False,
            "postSynthesisResampling": False,
            "lossyEncoding": False,
            "silenceTrimming": False,
            "loudnessNormalization": False,
            "eqDenoiseRemaster": False,
            "playbackRate": 1.0,
        },
        "preflight": plan,
        "items": records,
    }
    report_path = output_dir / "generation-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (output_dir / "index.html").write_text(
        (publish_dir / "index.html").read_text(encoding="utf-8"), encoding="utf-8"
    )
    return report


def main() -> int:
    args = parse_args()
    items = load_items()
    plan = preflight(items, args.output_dir)
    if not args.execute:
        print(json.dumps({"mode": "preflight", **plan}, ensure_ascii=False, indent=2))
        return 0
    report = execute(items, args.output_dir, args.publish_dir, plan)
    summary = {
        "mode": report["mode"],
        "model": report["model"],
        "apiRequestCount": report["apiRequestCount"],
        "billableCharacters": report["billableCharacters"],
        "items": [
            {
                "id": item["id"],
                "wave": item["pcmVerification"]["wave"],
                "pcmExactMatch": item["pcmVerification"]["pcmExactMatch"],
                "allSpeechSlicesExact": item["pcmVerification"]["allSpeechSlicesExact"],
                "publishedCopyHashMatch": item["publishedCopyHashMatch"],
                "noFullScalePlateau": item["samplePeak"]["noFullScalePlateau"],
                "fileBytes": item["fileBytes"],
            }
            for item in report["items"]
        ],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
