import argparse
import base64
import html
import json
import os
import re
import shutil
import sys
import time
from pathlib import Path

import generate_elevenlabs_speechify_trial as audio
import generate_grade2_round1_part1 as production


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-simba-natural-master-20260717/part1"

MODEL = "simba-3.2"
AUDIO_REVISION = "natural-master-v1"
SET_KEY = "set-01"

NUMBER_TO_BODY_MS = 1350
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1300
QUESTION_LABEL_TO_TEXT_MS = 350

MAX_CALLS = 40
MAX_TOTAL_INPUT_CHARACTERS = 8000
MAX_REQUEST_CHARACTERS = 1000

NUMBER_WORDS = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five"}

VOICES = {
    "geffen": {
        "id": "geffen_32",
        "name": "Geffen",
        "gender": "female",
        "language": "en-US",
        "ratePercent": 0,
    },
    "dominic": {
        "id": "dominic_32",
        "name": "Dominic",
        "gender": "male",
        "language": "en-US",
        "ratePercent": 0,
    },
    "harper": {
        "id": "harper_32",
        "name": "Harper",
        "gender": "female",
        "language": "en-US",
        "ratePercent": 0,
    },
    "wyatt": {
        "id": "wyatt_32",
        "name": "Wyatt",
        "gender": "male",
        "language": "en-US",
        "ratePercent": 0,
    },
    "imogen": {
        "id": "imogen_32",
        "name": "Imogen",
        "gender": "female",
        "language": "en-GB",
        "ratePercent": 0,
    },
    "hugh": {
        "id": "hugh_32",
        "name": "Hugh",
        "gender": "male",
        "language": "en-GB",
        "ratePercent": 0,
    },
}

# A is always female and B is always male in the source scripts.  Number and
# Question use one third voice, which stays the same within an item and has the
# gender opposite the final dialogue turn.
ITEM_PLANS = {
    1: {"A": "geffen", "B": "dominic", "narrator": "hugh"},
    2: {"A": "geffen", "B": "dominic", "narrator": "imogen"},
    3: {"A": "geffen", "B": "dominic", "narrator": "harper"},
    4: {"A": "geffen", "B": "dominic", "narrator": "wyatt"},
    5: {"A": "geffen", "B": "dominic", "narrator": "hugh"},
}

TTS_REPLACEMENTS = {
    3: {"café": "cafe"},
}

RISKY_ABBREVIATION_PATTERN = re.compile(
    r"\b(?:Mr|Mrs|Ms|Dr)\.|\b(?:a\.m\.|p\.m\.)",
    re.IGNORECASE,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate Grade 2 round 1 Part 1 No.1-No.5 with Simba 3.2."
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument(
        "--numbers",
        default="1,2,3,4,5",
        help="Comma-separated Part 1 question numbers to generate.",
    )
    return parser.parse_args()


def parse_numbers(value: str) -> tuple[int, ...]:
    numbers = tuple(int(part.strip()) for part in value.split(",") if part.strip())
    if not numbers or len(numbers) != len(set(numbers)):
        raise RuntimeError("--numbers must contain unique question numbers")
    unknown = [number for number in numbers if number not in ITEM_PLANS]
    if unknown:
        raise RuntimeError(f"Unsupported Part 1 question numbers: {unknown}")
    return numbers


def voice(key: str) -> dict:
    if key not in VOICES:
        raise RuntimeError(f"Unknown voice key: {key}")
    return VOICES[key]


def ensure_ascii(text: str, context: str) -> None:
    non_ascii = sorted({character for character in text if ord(character) > 127})
    if non_ascii:
        rendered = " ".join(f"U+{ord(character):04X}" for character in non_ascii)
        raise RuntimeError(f"Non-ASCII TTS input rejected for {context}: {rendered}")


def tts_safe_text(number: int, text: str) -> tuple[str, list[dict]]:
    result = text
    replacements = []
    for original, replacement in TTS_REPLACEMENTS.get(number, {}).items():
        if original in result:
            result = result.replace(original, replacement)
            replacements.append({"from": original, "to": replacement})
    return result, replacements


def rate_ssml(voice_config: dict, safe_text: str) -> str:
    escaped = html.escape(safe_text, quote=False)
    rate = int(voice_config["ratePercent"])
    if rate == 0:
        return f"<speak>{escaped}</speak>"
    return f'<speak><prosody rate="{rate:+d}%">{escaped}</prosody></speak>'


def load_items(numbers: tuple[int, ...]) -> list[dict]:
    questions = production.load_source_questions(SOURCE_JS, SET_KEY)
    part1 = {
        int(question["id"]): question
        for question in questions
        if question.get("part") == "Part 1"
    }

    items = []
    for number in numbers:
        if number not in part1:
            raise RuntimeError(f"Part 1 No.{number} was not found in {SET_KEY}")
        question = part1[number]
        turns = production.parse_dialogue(str(question.get("script", "")))
        if len(turns) != 4:
            raise RuntimeError(f"No.{number} must contain exactly four dialogue turns")
        for index, turn in enumerate(turns):
            if turn["speaker"] not in {"A", "B"}:
                raise RuntimeError(f"Unexpected speaker in No.{number}")
            if index and turn["speaker"] == turns[index - 1]["speaker"]:
                raise RuntimeError(f"Speakers must alternate in No.{number}")

        plan = ITEM_PLANS[number]
        a_voice = voice(plan["A"])
        b_voice = voice(plan["B"])
        narrator = voice(plan["narrator"])
        if a_voice["gender"] != "female" or b_voice["gender"] != "male":
            raise RuntimeError(f"No.{number} dialogue must be female A and male B")
        if len({a_voice["id"], b_voice["id"], narrator["id"]}) != 3:
            raise RuntimeError(f"No.{number} narrator must be separate from the dialogue pair")
        last_voice = a_voice if turns[-1]["speaker"] == "A" else b_voice
        first_voice = a_voice if turns[0]["speaker"] == "A" else b_voice
        if narrator["gender"] == last_voice["gender"]:
            raise RuntimeError(f"No.{number} narrator must be opposite the final dialogue turn")
        if narrator["gender"] != first_voice["gender"]:
            raise RuntimeError(f"No.{number} narrator must match the first-speaker gender")

        items.append(
            {
                "id": f"No{number:02d}",
                "number": number,
                "turns": turns,
                "questionText": str(question.get("questionText", "")).strip(),
                "plan": plan,
            }
        )
    return items


def segment_rows(item: dict) -> list[dict]:
    number = item["number"]
    plan = item["plan"]
    narrator = voice(plan["narrator"])
    number_safe = f"Number {NUMBER_WORDS[number]}."
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "voiceKey": plan["narrator"],
            "displayText": f"Number {number}.",
            "ttsText": number_safe,
            "ttsOverrides": [{"from": str(number), "to": NUMBER_WORDS[number]}],
            "input": rate_ssml(narrator, number_safe),
            "gapAfterMs": NUMBER_TO_BODY_MS,
        }
    ]

    for index, turn in enumerate(item["turns"]):
        voice_key = plan[turn["speaker"]]
        voice_config = voice(voice_key)
        safe_text, replacements = tts_safe_text(number, turn["text"])
        rows.append(
            {
                "role": f"turn{index + 1}",
                "speaker": turn["speaker"],
                "voiceKey": voice_key,
                "displayText": turn["text"],
                "ttsText": safe_text,
                "ttsOverrides": replacements,
                "input": rate_ssml(voice_config, safe_text),
                "gapAfterMs": (
                    BODY_TO_QUESTION_MS
                    if index == len(item["turns"]) - 1
                    else TURN_GAP_MS
                ),
            }
        )

    question_label = "Question."
    rows.append(
        {
            "role": "questionLabel",
            "speaker": "narrator",
            "voiceKey": plan["narrator"],
            "displayText": question_label,
            "ttsText": question_label,
            "ttsOverrides": [],
            "input": rate_ssml(narrator, question_label),
            "gapAfterMs": QUESTION_LABEL_TO_TEXT_MS,
        }
    )
    question_safe, replacements = tts_safe_text(number, item["questionText"])
    rows.append(
        {
            "role": "questionText",
            "speaker": "narrator",
            "voiceKey": plan["narrator"],
            "displayText": item["questionText"],
            "ttsText": question_safe,
            "ttsOverrides": replacements,
            "input": rate_ssml(narrator, question_safe),
            "gapAfterMs": 0,
        }
    )
    return rows


def raw_path(item: dict, segment: dict) -> Path:
    voice_config = voice(segment["voiceKey"])
    identity = {
        "provider": "speechify",
        "version": audio.SPEECHIFY_VERSION,
        "model": MODEL,
        "language": voice_config["language"],
        "voice": voice_config["id"],
        "role": segment["role"],
        "input": segment["input"],
        "audioFormat": "wav",
    }
    key = audio.cache_key(identity)
    return OUTPUT_DIR / "_cache" / voice_config["id"] / f"{item['id']}-{segment['role']}-{key}.wav"


def validate_segment(item: dict, segment: dict) -> None:
    voice_config = voice(segment["voiceKey"])
    safe_text = segment["ttsText"]
    context = f"{item['id']} {segment['role']}"
    ensure_ascii(segment["input"], context)
    if re.search(r"\d", safe_text):
        raise RuntimeError(f"Unnormalized digit remains in {context}: {safe_text}")
    risky = RISKY_ABBREVIATION_PATTERN.search(safe_text)
    if risky:
        raise RuntimeError(f"Risky abbreviation remains in {context}: {risky.group(0)}")
    expected_rate = 0
    if voice_config["ratePercent"] != expected_rate:
        raise RuntimeError(f"Unexpected speed for {voice_config['name']}")
    if "<prosody" in segment["input"]:
        raise RuntimeError(f"Natural-speed input must not contain prosody rate in {context}")
    if len(segment["input"]) > MAX_REQUEST_CHARACTERS:
        raise RuntimeError(f"Request is too long in {context}")


def preflight(items: list[dict]) -> dict:
    missing_calls = 0
    missing_characters = 0
    item_rows = []
    for item in items:
        rows = segment_rows(item)
        if len(rows) != 7:
            raise RuntimeError(f"{item['id']} must have seven audio segments")
        if [row["gapAfterMs"] for row in rows] != [
            NUMBER_TO_BODY_MS,
            TURN_GAP_MS,
            TURN_GAP_MS,
            TURN_GAP_MS,
            BODY_TO_QUESTION_MS,
            QUESTION_LABEL_TO_TEXT_MS,
            0,
        ]:
            raise RuntimeError(f"Unexpected gap plan in {item['id']}")
        if len({rows[0]["voiceKey"], rows[-2]["voiceKey"], rows[-1]["voiceKey"]}) != 1:
            raise RuntimeError(f"Number and Question narrator differ in {item['id']}")
        if rows[0]["ttsText"] != f"Number {NUMBER_WORDS[item['number']]}.":
            raise RuntimeError(f"Unsafe number narration in {item['id']}")
        if rows[-2]["ttsText"] != "Question.":
            raise RuntimeError(f"Question label is unsafe in {item['id']}")

        serialized_rows = []
        for segment in rows:
            validate_segment(item, segment)
            path = raw_path(item, segment)
            cached = audio.valid_wav(path)
            if not cached:
                missing_calls += 1
                missing_characters += len(segment["input"])
            voice_config = voice(segment["voiceKey"])
            serialized_rows.append(
                {
                    "role": segment["role"],
                    "speaker": segment["speaker"],
                    "voice": voice_config["name"],
                    "voiceId": voice_config["id"],
                    "language": voice_config["language"],
                    "ratePercent": voice_config["ratePercent"],
                    "displayText": segment["displayText"],
                    "ttsText": segment["ttsText"],
                    "ttsOverrides": segment["ttsOverrides"],
                    "gapAfterMs": segment["gapAfterMs"],
                    "cached": cached,
                }
            )
        item_rows.append({"item": item["id"], "segments": serialized_rows})

    if missing_calls > MAX_CALLS:
        raise RuntimeError(f"Call ceiling exceeded: {missing_calls} > {MAX_CALLS}")
    if missing_characters > MAX_TOTAL_INPUT_CHARACTERS:
        raise RuntimeError(
            "Input character ceiling exceeded: "
            f"{missing_characters} > {MAX_TOTAL_INPUT_CHARACTERS}"
        )

    return {
        "setKey": SET_KEY,
        "model": MODEL,
        "stylePolicy": "Reuse the approved plain Simba conversational delivery at native speed.",
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "turnGap": TURN_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionLabelToText": QUESTION_LABEL_TO_TEXT_MS,
        },
        "speedPolicy": {"master": 1.0, "reviewPageDefault": 0.87},
        "missing": {"calls": missing_calls, "inputCharacters": missing_characters},
        "ceilings": {"calls": MAX_CALLS, "inputCharacters": MAX_TOTAL_INPUT_CHARACTERS},
        "items": item_rows,
    }


def generate_segment(api_key: str, item: dict, segment: dict, destination: Path) -> dict:
    voice_config = voice(segment["voiceKey"])
    request_identity = {
        "provider": "speechify",
        "version": audio.SPEECHIFY_VERSION,
        "model": MODEL,
        "language": voice_config["language"],
        "voice": voice_config["id"],
        "role": segment["role"],
        "input": segment["input"],
    }
    payload = {
        "input": segment["input"],
        "voice_id": voice_config["id"],
        "audio_format": "wav",
        "language": voice_config["language"],
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
    audio.atomic_write(destination, base64.b64decode(response["audio_data"]))
    if not audio.valid_wav(destination):
        raise RuntimeError(f"Invalid WAV returned for {item['id']} {segment['role']}")
    return {
        "item": item["id"],
        "role": segment["role"],
        "voice": voice_config["id"],
        "inputCharacters": len(segment["input"]),
        "billableCharacters": response.get("billable_characters_count"),
        "requestId": headers.get("x-request-id") or headers.get("X-Request-ID"),
    }


def write_page(items: list[dict], outputs: list[dict]) -> None:
    output_by_number = {row["number"]: row for row in outputs}
    cards = []
    for item in items:
        output = output_by_number[item["number"]]
        plan = item["plan"]
        cards.append(
            '<article><h2>{item_id}</h2>'
            '<p>{a} × {b}／番号・Question：{narrator}</p>'
            '<audio controls preload="metadata" src="audio/{filename}"></audio></article>'.format(
                item_id=item["id"],
                a=html.escape(voice(plan["A"])["name"]),
                b=html.escape(voice(plan["B"])["name"]),
                narrator=html.escape(voice(plan["narrator"])["name"]),
                filename=Path(output["mp3"]).name,
            )
        )

    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SCBT 第1回 Part 1 Simba No.1～5</title>
<style>
:root{{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
*{{box-sizing:border-box}}body{{margin:0;background:#f4f1ea;color:#17211c}}
main{{width:calc(100% - 24px);max-width:720px;margin:auto;padding:28px 0 48px}}
h1{{font-size:clamp(23px,6vw,34px);line-height:1.2;margin:0 0 10px}}
.lead,.meta{{line-height:1.65;color:#566159}}article{{background:#fff;border:1px solid #d9ddd8;border-radius:16px;padding:16px;margin:16px 0}}
h2{{margin:0 0 8px;font-size:20px}}article p{{margin:0 0 12px;line-height:1.55}}audio{{display:block;width:100%}}
</style></head><body><main>
<h1>SCBT 第1回 Part 1・本番確認 No.1～5</h1>
<p class="lead">SIMBAは自然な等倍で生成。試聴ページ側の初期再生速度を0.87にします。</p>
{''.join(cards)}
<p class="meta">番号→会話1350ms／話者交代550ms／会話→Question 1300ms／Question→設問350ms／-20 LUFS／MP3 44.1kHz・128kbps。問題番号は英単語読み。</p>
</main></body></html>"""
    (OUTPUT_DIR / "index.html").write_text(page, encoding="utf-8")


def execute(items: list[dict], preflight_data: dict) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")
    api_key = (
        os.environ.get("SPEECHIFY_API_KEY", "").strip()
        or os.environ.get("SPEECHFY_API_KEY", "").strip()
    )
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
            if actual["inputCharacters"] + len(segment["input"]) > MAX_TOTAL_INPUT_CHARACTERS:
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
            voice_config = voice(segment["voiceKey"])
            segment_report.append(
                {
                    "role": segment["role"],
                    "speaker": segment["speaker"],
                    "voice": voice_config["name"],
                    "voiceId": voice_config["id"],
                    "language": voice_config["language"],
                    "ratePercent": voice_config["ratePercent"],
                    "displayText": segment["displayText"],
                    "ttsText": segment["ttsText"],
                    "ttsOverrides": segment["ttsOverrides"],
                    "gapAfterMs": segment["gapAfterMs"],
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
        "mode": "completed",
        "preflight": preflight_data,
        "actual": actual,
        "records": records,
        "outputs": outputs,
    }
    (OUTPUT_DIR / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return report


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    items = load_items(parse_numbers(args.numbers))
    preflight_data = preflight(items)
    if not args.execute:
        print(json.dumps({"mode": "preflight", **preflight_data}, ensure_ascii=False, indent=2))
        return 0
    report = execute(items, preflight_data)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
