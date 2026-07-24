import argparse
import base64
import html
import json
import os
import shutil
import sys
import time
from pathlib import Path

import generate_elevenlabs_speechify_trial as audio
import generate_part2_provider_comparison as prior_comparison


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-simba-natural-master-20260717/part2"
PILOT_SOURCE = ROOT / "audio-generation/grade2-sample-part2-pilot.json"
REST_SOURCE = ROOT / "audio-generation/grade2-sample-part2-rest.json"

MODEL = "simba-3.2"
AUDIO_REVISION = "natural-master-v1"
NUMBER_TO_BODY_MS = 1150
BODY_TO_QUESTION_MS = 1300
SENTENCE_BREAK_MS = 420
QUESTION_LABEL_TO_TEXT_MS = 350
RATE_PERCENT = 0
MAX_CALLS = 40
MAX_TOTAL_CHARACTERS = 9000
MAX_REQUEST_CHARACTERS = 2000

VOICE_PLANS = {
    16: {
        "language": "en-US",
        "body": {"id": "geffen_32", "name": "Geffen", "gender": "female"},
        "question": {"id": "dominic_32", "name": "Dominic", "gender": "male"},
        "bodyRatePercent": RATE_PERCENT,
        "questionRatePercent": RATE_PERCENT,
    },
    17: {
        "language": "en-US",
        "body": {"id": "wyatt_32", "name": "Wyatt", "gender": "male"},
        "question": {"id": "harper_32", "name": "Harper", "gender": "female"},
        "bodyRatePercent": RATE_PERCENT,
        "questionRatePercent": RATE_PERCENT,
    },
    18: {
        "language": "en-GB",
        "body": {"id": "imogen_32", "name": "Imogen", "gender": "female"},
        "question": {"id": "hugh_32", "name": "Hugh", "gender": "male"},
        "bodyRatePercent": RATE_PERCENT,
        "questionRatePercent": RATE_PERCENT,
    },
    19: {
        "language": "en-GB",
        "body": {"id": "hugh_32", "name": "Hugh", "gender": "male"},
        "question": {"id": "imogen_32", "name": "Imogen", "gender": "female"},
        "bodyRatePercent": RATE_PERCENT,
        "questionRatePercent": RATE_PERCENT,
    },
    20: {
        "language": "en-US",
        "body": {"id": "harper_32", "name": "Harper", "gender": "female"},
        "question": {"id": "wyatt_32", "name": "Wyatt", "gender": "male"},
        "bodyRatePercent": RATE_PERCENT,
        "questionRatePercent": RATE_PERCENT,
    },
}

ABBREVIATIONS = {
    "mr",
    "mrs",
    "ms",
    "dr",
    "st",
    "a.m",
    "p.m",
}

NUMBER_WORDS = {
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

BODY_TTS_REPLACEMENTS = {
    17: {
        "9 a.m.": "nine A M",
        "3 p.m.": "three P M",
    }
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate Part 2 No.16-No.20 with Simba 3.2."
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument(
        "--numbers",
        default="16,17,18,19,20",
        help="Comma-separated Part 2 question numbers to generate.",
    )
    return parser.parse_args()


def parse_numbers(value: str) -> tuple[int, ...]:
    numbers = tuple(int(part.strip()) for part in value.split(",") if part.strip())
    if not numbers or len(numbers) != len(set(numbers)):
        raise RuntimeError("--numbers must contain unique question numbers")
    unknown = [number for number in numbers if number not in VOICE_PLANS]
    if unknown:
        raise RuntimeError(f"Unsupported Part 2 question numbers: {unknown}")
    return numbers


def load_items(numbers: tuple[int, ...]) -> list[dict]:
    source_items = []
    for path in (PILOT_SOURCE, REST_SOURCE):
        data = json.loads(path.read_text(encoding="utf-8"))
        source_items.extend(data["items"])

    selected = []
    for item in source_items:
        if item["number"] not in numbers:
            continue
        if len(item["segments"]) != 3:
            raise RuntimeError(f"Unexpected segment count for {item['id']}")
        number, body, question = item["segments"]
        expected_number = f"Number {item['number']}."
        if number["text"] != expected_number:
            raise RuntimeError(f"Unexpected number text for {item['id']}")
        if not question["text"].startswith("Question. "):
            raise RuntimeError(f"Unexpected question text for {item['id']}")
        selected.append(
            {
                "id": item["id"],
                "number": item["number"],
                "numberText": number["text"],
                "bodyText": body["text"],
                "questionText": question["text"][len("Question. ") :].strip(),
                "voicePlan": VOICE_PLANS[item["number"]],
            }
        )

    selected.sort(key=lambda row: row["number"])
    if [item["number"] for item in selected] != sorted(numbers):
        raise RuntimeError(f"Could not load requested Part 2 items: {numbers}")
    return selected


def is_sentence_period(text: str, index: int) -> bool:
    if text[index] != ".":
        return False
    previous = text[index - 1] if index > 0 else ""
    following = text[index + 1] if index + 1 < len(text) else ""
    if previous.isdigit() and following.isdigit():
        return False

    start = index - 1
    while start >= 0 and (text[start].isalpha() or text[start] == "."):
        start -= 1
    token = text[start + 1 : index].lower().strip(".")
    if token in ABBREVIATIONS or (len(token) == 1 and token.isalpha()):
        return False

    cursor = index + 1
    while cursor < len(text) and text[cursor] in "\"')]} ":
        cursor += 1
    return cursor >= len(text) or text[cursor].isupper()


def split_sentences(text: str) -> list[str]:
    sentences = []
    start = 0
    for index, char in enumerate(text):
        if char == "." and is_sentence_period(text, index):
            sentence = text[start : index + 1].strip()
            if sentence:
                sentences.append(sentence)
            start = index + 1
    remainder = text[start:].strip()
    if remainder:
        sentences.append(remainder)
    return sentences


def tts_safe_text(item: dict, text: str) -> str:
    result = text
    for original, replacement in BODY_TTS_REPLACEMENTS.get(item["number"], {}).items():
        result = result.replace(original, replacement)
    return result


def body_sentence_ssml(item: dict, sentence: str) -> tuple[str, str]:
    safe_text = tts_safe_text(item, sentence)
    marked_text = html.escape(safe_text, quote=False)
    rate = item["voicePlan"]["bodyRatePercent"]
    if rate:
        marked_text = f'<prosody rate="{rate:+d}%">{marked_text}</prosody>'
    return safe_text, (
        '<speak><speechify:style emotion="warm">'
        f"{marked_text}"
        "</speechify:style></speak>"
    )


def neutral_ssml(text: str, rate_percent: int) -> str:
    escaped = html.escape(text, quote=False)
    if rate_percent == 0:
        return f"<speak>{escaped}</speak>"
    return f'<speak><prosody rate="{rate_percent:+d}%">{escaped}</prosody></speak>'


def segment_rows(item: dict) -> list[dict]:
    plan = item["voicePlan"]
    number_tts = f"Number {NUMBER_WORDS[item['number']]}."
    rows = [
        {
            "role": "number",
            "voiceRole": "body",
            "plainText": item["numberText"],
            "ttsText": number_tts,
            "input": neutral_ssml(number_tts, RATE_PERCENT),
            "gapAfterMs": NUMBER_TO_BODY_MS,
            "ssml": True,
            "ratePercent": RATE_PERCENT,
        },
    ]
    sentences = split_sentences(item["bodyText"])
    if len(sentences) < 2:
        raise RuntimeError(f"Part 2 body was not split into sentences for {item['id']}")
    for index, sentence in enumerate(sentences, start=1):
        safe_text, ssml = body_sentence_ssml(item, sentence)
        rows.append(
            {
                "role": "bodySentence",
                "bodyIndex": index,
                "voiceRole": "body",
                "plainText": sentence,
                "ttsText": safe_text,
                "input": ssml,
                "gapAfterMs": (
                    BODY_TO_QUESTION_MS if index == len(sentences) else SENTENCE_BREAK_MS
                ),
                "ssml": True,
                "ratePercent": plan["bodyRatePercent"],
                "style": "warm",
            }
        )
    rows.append(
        {
            "role": "questionLabel",
            "voiceRole": "question",
            "plainText": "Question.",
            "ttsText": "Question.",
            "input": neutral_ssml("Question.", plan["questionRatePercent"]),
            "gapAfterMs": QUESTION_LABEL_TO_TEXT_MS,
            "ssml": True,
            "ratePercent": plan["questionRatePercent"],
        }
    )
    rows.append(
        {
            "role": "questionText",
            "voiceRole": "question",
            "plainText": item["questionText"],
            "ttsText": item["questionText"],
            "input": neutral_ssml(item["questionText"], plan["questionRatePercent"]),
            "gapAfterMs": 0,
            "ssml": True,
            "ratePercent": plan["questionRatePercent"],
        }
    )
    return rows


def prior_path(item: dict, segment: dict) -> Path | None:
    if item["number"] != 16 or segment["role"] != "question":
        return None
    prior_variant = next(
        row for row in prior_comparison.VARIANTS if row["provider"] == "speechify"
    )
    prior_segment = next(
        row
        for row in prior_comparison.SEGMENTS
        if row["role"] == segment["role"] and row["text"] == segment["plainText"]
    )
    path = prior_comparison.raw_path(prior_variant, prior_segment)
    return path if audio.valid_wav(path) else None


def raw_path(item: dict, segment: dict) -> Path:
    reused = prior_path(item, segment)
    if reused:
        return reused
    plan = item["voicePlan"]
    voice = plan[segment["voiceRole"]]
    payload = {
        "provider": "speechify",
        "version": audio.SPEECHIFY_VERSION,
        "model": MODEL,
        "language": plan["language"],
        "voice": voice["id"],
        "role": segment["role"],
        "input": segment["input"],
        "audioFormat": "wav",
    }
    key = audio.cache_key(payload)
    return OUTPUT_DIR / "_cache" / item["id"] / f"{voice['name']}-{key}.wav"


def validate_synthesis_inputs(items: list[dict]):
    for item in items:
        rows = segment_rows(item)
        number = rows[0]
        if any(char.isdigit() for char in number["ttsText"]):
            raise RuntimeError(f"Question number contains digits for {item['id']}")
        body_rows = [row for row in rows if row["role"] == "bodySentence"]
        if len(body_rows) != 4:
            raise RuntimeError(f"Expected four body sentences for {item['id']}")
        for index, row in enumerate(body_rows):
            expected_gap = BODY_TO_QUESTION_MS if index == len(body_rows) - 1 else SENTENCE_BREAK_MS
            if row["gapAfterMs"] != expected_gap:
                raise RuntimeError(f"Incorrect body gap for {item['id']} sentence {index + 1}")
            if "<break" in row["input"]:
                raise RuntimeError(f"SSML break must not be used for {item['id']}")
            if any(char.isdigit() for char in row["ttsText"]):
                raise RuntimeError(f"Unnormalized digit in {item['id']} sentence {index + 1}")
        if rows[-2]["role"] != "questionLabel" or rows[-2]["ttsText"] != "Question.":
            raise RuntimeError(f"Question label is unsafe for {item['id']}")
        if rows[-2]["gapAfterMs"] != QUESTION_LABEL_TO_TEXT_MS:
            raise RuntimeError(f"Question label gap is incorrect for {item['id']}")
        if item["voicePlan"]["body"]["gender"] == item["voicePlan"]["question"]["gender"]:
            raise RuntimeError(f"Part 2 body and question must use opposite genders for {item['id']}")
        for row in rows:
            if row.get("ratePercent") != RATE_PERCENT:
                raise RuntimeError(f"Unexpected speed in {item['id']} {row['role']}")
            if "<prosody" in row["input"]:
                raise RuntimeError(
                    f"Natural-speed input contains prosody rate in {item['id']} {row['role']}"
                )
        if item["number"] == 17:
            combined = " ".join(row["ttsText"] for row in body_rows)
            if "a.m." in combined or "p.m." in combined:
                raise RuntimeError("Time abbreviation was not normalized for No17")
            if "nine A M" not in combined or "three P M" not in combined:
                raise RuntimeError("Expected spoken time forms are missing for No17")


def preflight(items: list[dict]) -> dict:
    validate_synthesis_inputs(items)
    missing_calls = 0
    missing_characters = 0
    rows = []
    for item in items:
        for segment in segment_rows(item):
            if not segment["plainText"].isascii() or not segment["input"].isascii():
                raise RuntimeError(f"Non-ASCII TTS input in {item['id']} {segment['role']}")
            if len(segment["input"]) > MAX_REQUEST_CHARACTERS:
                raise RuntimeError(f"Speechify request too long for {item['id']} {segment['role']}")
            path = raw_path(item, segment)
            cached = audio.valid_wav(path)
            if not cached:
                missing_calls += 1
                missing_characters += len(segment["input"])
            rows.append(
                {
                    "item": item["id"],
                    "role": segment["role"],
                    "voice": item["voicePlan"][segment["voiceRole"]]["name"],
                    "ttsText": segment["ttsText"],
                    "inputCharacters": len(segment["input"]),
                    "cached": cached,
                    "gapAfterMs": segment["gapAfterMs"],
                    "ratePercent": segment.get("ratePercent", 0),
                }
            )

    if missing_calls > MAX_CALLS:
        raise RuntimeError("Speechify call ceiling exceeded before generation")
    if missing_characters > MAX_TOTAL_CHARACTERS:
        raise RuntimeError("Speechify character ceiling exceeded before generation")

    return {
        "items": [item["id"] for item in items],
        "missing": {"calls": missing_calls, "characters": missing_characters},
        "ceilings": {
            "calls": MAX_CALLS,
            "totalCharacters": MAX_TOTAL_CHARACTERS,
            "requestCharacters": MAX_REQUEST_CHARACTERS,
        },
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "sentenceBreakHardSilence": SENTENCE_BREAK_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionLabelToText": QUESTION_LABEL_TO_TEXT_MS,
        },
        "speedPolicy": {"master": 1.0, "reviewPageDefault": 0.87},
        "segments": rows,
    }


def generate_segment(api_key: str, item: dict, segment: dict, path: Path) -> dict:
    plan = item["voicePlan"]
    voice = plan[segment["voiceRole"]]
    request_identity = {
        "provider": "speechify",
        "version": audio.SPEECHIFY_VERSION,
        "model": MODEL,
        "language": plan["language"],
        "voice": voice["id"],
        "role": segment["role"],
        "input": segment["input"],
    }
    payload = {
        "input": segment["input"],
        "voice_id": voice["id"],
        "audio_format": "wav",
        "language": plan["language"],
        "model": MODEL,
    }
    body, headers = audio.request_bytes(
        audio.SPEECHIFY_API_URL,
        payload,
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Speechify-Version": audio.SPEECHIFY_VERSION,
            "Idempotency-Key": audio.cache_key(request_identity),
        },
    )
    response = json.loads(body.decode("utf-8"))
    audio.atomic_write(path, base64.b64decode(response["audio_data"]))
    if not audio.valid_wav(path):
        raise RuntimeError("Speechify did not return a valid WAV file")
    return {
        "item": item["id"],
        "role": segment["role"],
        "voice": voice["id"],
        "inputCharacters": len(segment["input"]),
        "billableCharacters": response.get("billable_characters_count"),
        "requestId": headers.get("x-request-id") or headers.get("X-Request-ID"),
    }


def write_page(items: list[dict], outputs: list[dict]):
    cards = []
    for item in items:
        plan = item["voicePlan"]
        rate_note = "・自然な等倍マスター"
        cards.append(
            '<article class="sample-card">'
            f'<h2>{html.escape(item["id"])}</h2>'
            f'<p>{html.escape(plan["body"]["name"])}（本文）→ '
            f'{html.escape(plan["question"]["name"])}（設問）{rate_note}</p>'
            f'<audio controls preload="metadata" src="audio/{html.escape(item["id"])}.mp3"></audio>'
            "</article>"
        )
    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SCBT 第1回 Part 2 Simba No.16～20</title>
<style>
:root{{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
*,*::before,*::after{{box-sizing:border-box}}html,body{{max-width:100%;overflow-x:hidden}}
body{{margin:0;background:#f4f1ea;color:#17211c}}main{{width:calc(100% - 24px);max-width:760px;margin:0 auto;padding:30px 0 56px}}
h1{{font-size:clamp(24px,6vw,36px);line-height:1.2;margin:0 0 12px}}.lead{{color:#546058;line-height:1.75;margin:0 0 24px}}
.samples{{display:grid;gap:14px}}.sample-card{{background:#fff;border:1px solid #d9ddd8;border-radius:18px;padding:18px;box-shadow:0 8px 26px rgba(31,52,41,.07)}}
h2{{margin:0 0 6px;font-size:20px}}.sample-card p{{margin:0 0 13px;color:#526059;line-height:1.55}}audio{{display:block;width:100%;max-width:100%;min-width:0}}
.meta{{margin-top:22px;color:#6b746e;font-size:13px;line-height:1.75}}
@media(max-width:560px){{main{{width:100%;padding:20px 5px 56px}}.sample-card{{padding:12px 8px;border-radius:12px}}audio::-webkit-media-controls-mute-button,audio::-webkit-media-controls-volume-slider{{display:none}}}}
</style></head><body><main>
<h1>SCBT 第1回 Part 2・本番確認 No.16～20</h1>
<p class="lead">SIMBAは自然な等倍で生成。試聴ページ側の初期再生速度を0.87にします。</p>
<section class="samples">{"".join(cards)}</section>
<p class="meta">本文：warmナレーション／自然な等倍マスター。文ごとに生成し、文間へ実音声420ms。問題番号は英単語読み。問題番号→本文1150ms、本文→Question 1300ms、Question→設問350ms、-20 LUFS、MP3 44.1kHz/128kbps。</p>
</main></body></html>"""
    (OUTPUT_DIR / "index.html").write_text(page, encoding="utf-8")


def execute(items: list[dict], preflight_data: dict) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")
    api_key = os.environ.get("SPEECHIFY_API_KEY", "").strip()
    if preflight_data["missing"]["calls"] and not api_key:
        raise RuntimeError("SPEECHIFY_API_KEY is not set")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    audio.OUTPUT_DIR = OUTPUT_DIR
    actual = {"calls": 0, "inputCharacters": 0, "billableCharacters": 0}
    records = []
    outputs = []
    for item in items:
        rows = segment_rows(item)
        for segment in rows:
            path = raw_path(item, segment)
            if audio.valid_wav(path):
                continue
            if actual["calls"] >= MAX_CALLS:
                raise RuntimeError("Speechify runtime call ceiling reached")
            if actual["inputCharacters"] + len(segment["input"]) > MAX_TOTAL_CHARACTERS:
                raise RuntimeError("Speechify runtime character ceiling reached")
            record = generate_segment(api_key, item, segment, path)
            actual["calls"] += 1
            actual["inputCharacters"] += len(segment["input"])
            actual["billableCharacters"] += record.get("billableCharacters") or 0
            records.append(record)
            time.sleep(1.05)

        ordered = []
        segment_report = []
        for segment in rows:
            raw = raw_path(item, segment)
            processed = audio.trim_segment(ffmpeg, raw, f"{item['id']}-{segment['role']}")
            ordered.append((processed, segment["gapAfterMs"]))
            voice = item["voicePlan"][segment["voiceRole"]]
            segment_report.append(
                {
                    "role": segment["role"],
                    "voice": voice,
                    "plainText": segment["plainText"],
                    "ttsText": segment["ttsText"],
                    "synthesisInput": segment["input"],
                    "gapAfterMs": segment["gapAfterMs"],
                    "ratePercent": segment["ratePercent"],
                    "style": segment.get("style", "neutral"),
                    "reused": False,
                }
            )

        audio_dir = OUTPUT_DIR / "audio"
        wav_path = audio_dir / f"{item['id']}.wav"
        mp3_path = audio_dir / f"{item['id']}.mp3"
        audio.combine_item(ffmpeg, ordered, wav_path, mp3_path)
        outputs.append(
            {
                "item": item["id"],
                "number": item["number"],
                "segments": segment_report,
                "wav": str(wav_path.relative_to(ROOT)),
                "mp3": str(mp3_path.relative_to(ROOT)),
                "wavProbe": audio.probe_audio(ffprobe, wav_path),
                "mp3Probe": audio.probe_audio(ffprobe, mp3_path),
            }
        )

    write_page(items, outputs)
    report = {
        "sources": [str(PILOT_SOURCE.relative_to(ROOT)), str(REST_SOURCE.relative_to(ROOT))],
        "outputDirectory": str(OUTPUT_DIR.relative_to(ROOT)),
        "preflight": preflight_data,
        "actual": actual,
        "records": records,
        "outputs": outputs,
    }
    (OUTPUT_DIR / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return report


def main():
    args = parse_args()
    items = load_items(parse_numbers(args.numbers))
    preflight_data = preflight(items)
    if not args.execute:
        print(json.dumps(preflight_data, ensure_ascii=False, indent=2))
        return 0
    report = execute(items, preflight_data)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
