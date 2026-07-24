import argparse
import html
import json
import os
import re
import shutil
import sys
import time
from pathlib import Path

import generate_elevenlabs_speechify_trial as audio
import generate_grade2_round1_part1 as part1_source
import generate_grade2_round1_part2_simba_trial as part2_source


ROOT = Path(__file__).resolve().parent.parent
PART1_SOURCE = ROOT / "grade2-listening-part2-sets.js"
PART2_PILOT = ROOT / "audio-generation/grade2-sample-part2-pilot.json"
PART2_REST = ROOT / "audio-generation/grade2-sample-part2-rest.json"
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-openai-natural-master-20260717"

MODEL = "gpt-4o-mini-tts"
SPEED = 1.0
AUDIO_REVISION = "english-learner-unhurried-v1"

PART1_NUMBERS = (1, 2, 3)
PART2_NUMBERS = (16, 17, 18)

PART1_NUMBER_TO_BODY_MS = 1350
PART1_TURN_GAP_MS = 550
PART2_NUMBER_TO_BODY_MS = 1150
PART2_SENTENCE_GAP_MS = 420
BODY_TO_QUESTION_MS = 1300
QUESTION_LABEL_TO_TEXT_MS = 350

MAX_OPENAI_CALLS = 30
MAX_OPENAI_INPUT_CHARACTERS = 6000
MAX_EDGE_CALLS = 24

OPENAI_VOICES = {
    "marin": {"provider": "openai", "id": "marin", "name": "Marin", "gender": "female"},
    "cedar": {"provider": "openai", "id": "cedar", "name": "Cedar", "gender": "male"},
}
EDGE_VOICES = {
    "emma": {
        "provider": "edge",
        "id": "en-US-EmmaMultilingualNeural",
        "name": "Emma",
        "gender": "female",
        "language": "en-US",
    },
    "ryan": {
        "provider": "edge",
        "id": "en-GB-RyanNeural",
        "name": "Ryan",
        "gender": "male",
        "language": "en-GB",
    },
}

NUMBER_WORDS = {
    1: "one",
    2: "two",
    3: "three",
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
}

COMMON_INSTRUCTIONS = (
    "The listeners are English learners. Speak clearly and carefully at a steady, unhurried "
    "pace suitable for English learners. Keep the rhythm natural. Do not rush, stretch words, "
    "over-enunciate, split words into syllables, or insert unnatural pauses. "
)

PART1_INSTRUCTIONS = (
    "Voice: A clear, natural adult speaker using American English. "
    + COMMON_INSTRUCTIONS
    + "Delivery: Speak as one person in a realistic everyday conversation. Use natural, "
    "responsive intonation and light contextual emotion. Do not sound flat, mechanical, "
    "dramatic, commercial, or like a formal announcement. "
    "Exam fairness: Do not emphasize any word or detail that reveals the answer. "
    "Accuracy: Read the supplied text exactly as written. Do not add, omit, repeat, paraphrase, "
    "correct, or explain anything. "
    "Audio quality: Produce a clean studio-quality voice with a full natural tone and no noise, "
    "reverb, clipping, metallic texture, muffling, or compression artifacts."
)

PART2_INSTRUCTIONS = (
    "Voice: A clear, natural adult speaker using American English. "
    + COMMON_INSTRUCTIONS
    + "Delivery: Read as calm, informative narration for an Eiken Grade 2 listening exercise. "
    "Use gentle sentence-level intonation and give the sentence a clear, natural ending. Do not "
    "sound flat, mechanical, dramatic, commercial, or overly emotional. "
    "Exam fairness: Do not emphasize any word or detail that reveals the answer. "
    "Accuracy: Read the supplied text exactly as written. Do not add, omit, repeat, paraphrase, "
    "correct, or explain anything. "
    "Audio quality: Produce a clean studio-quality voice with a full natural tone and no noise, "
    "reverb, clipping, metallic texture, muffling, or compression artifacts."
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate three Part 1 and three Part 2 OpenAI natural-speed comparison items."
    )
    parser.add_argument("--execute", action="store_true")
    return parser.parse_args()


def ensure_ascii(text: str, context: str) -> None:
    if not text.isascii():
        points = sorted({f"U+{ord(char):04X}" for char in text if not char.isascii()})
        raise RuntimeError(f"Non-ASCII input in {context}: {' '.join(points)}")


def normalize_part1_text(text: str) -> tuple[str, list[dict]]:
    replacements = []
    result = text
    if "café" in result:
        result = result.replace("café", "cafe")
        replacements.append({"from": "café", "to": "cafe"})
    return result, replacements


def voice_for_speaker(speaker: str) -> dict:
    if speaker == "A":
        return OPENAI_VOICES["marin"]
    if speaker == "B":
        return OPENAI_VOICES["cedar"]
    raise RuntimeError(f"Unsupported Part 1 speaker: {speaker}")


def edge_narrator_for_first_speaker(speaker: str) -> dict:
    return EDGE_VOICES["emma"] if speaker == "A" else EDGE_VOICES["ryan"]


def load_part1_items() -> list[dict]:
    questions = part1_source.load_source_questions(PART1_SOURCE, "set-01")
    by_number = {
        int(question["id"]): question
        for question in questions
        if question.get("part") == "Part 1"
    }
    items = []
    for number in PART1_NUMBERS:
        question = by_number.get(number)
        if not question:
            raise RuntimeError(f"Part 1 No.{number} was not found")
        turns = part1_source.parse_dialogue(str(question.get("script", "")))
        if len(turns) != 4:
            raise RuntimeError(f"Part 1 No.{number} must contain four dialogue turns")
        if any(turn["speaker"] not in {"A", "B"} for turn in turns):
            raise RuntimeError(f"Unexpected speaker in Part 1 No.{number}")
        if any(turns[index]["speaker"] == turns[index - 1]["speaker"] for index in range(1, 4)):
            raise RuntimeError(f"Speakers must alternate in Part 1 No.{number}")
        narrator = edge_narrator_for_first_speaker(turns[0]["speaker"])
        last_voice = voice_for_speaker(turns[-1]["speaker"])
        if narrator["gender"] == last_voice["gender"]:
            raise RuntimeError(f"Narrator gender is invalid in Part 1 No.{number}")
        items.append(
            {
                "part": "part1",
                "id": f"No{number:02d}",
                "number": number,
                "turns": turns,
                "questionText": str(question.get("questionText", "")).strip(),
                "narrator": narrator,
            }
        )
    return items


def load_part2_items() -> list[dict]:
    source_items = []
    for path in (PART2_PILOT, PART2_REST):
        source_items.extend(json.loads(path.read_text(encoding="utf-8"))["items"])
    by_number = {int(item["number"]): item for item in source_items}
    body_plan = {16: "marin", 17: "cedar", 18: "marin"}
    items = []
    for number in PART2_NUMBERS:
        source = by_number.get(number)
        if not source or len(source.get("segments", [])) != 3:
            raise RuntimeError(f"Part 2 No.{number} source is invalid")
        number_segment, body_segment, question_segment = source["segments"]
        if number_segment["text"] != f"Number {number}.":
            raise RuntimeError(f"Unexpected number label in Part 2 No.{number}")
        if not question_segment["text"].startswith("Question. "):
            raise RuntimeError(f"Unexpected question label in Part 2 No.{number}")
        body_voice = OPENAI_VOICES[body_plan[number]]
        narrator = EDGE_VOICES["ryan"] if body_voice["gender"] == "female" else EDGE_VOICES["emma"]
        sentences = part2_source.split_sentences(body_segment["text"])
        if len(sentences) != 4:
            raise RuntimeError(f"Part 2 No.{number} must contain four sentences")
        safe_sentences = [part2_source.tts_safe_text({"number": number}, sentence) for sentence in sentences]
        items.append(
            {
                "part": "part2",
                "id": f"No{number:02d}",
                "number": number,
                "bodySentences": safe_sentences,
                "displayBodySentences": sentences,
                "questionText": question_segment["text"][len("Question. ") :].strip(),
                "bodyVoice": body_voice,
                "narrator": narrator,
            }
        )
    return items


def part1_segments(item: dict) -> list[dict]:
    narrator = item["narrator"]
    rows = [
        {
            "role": "number",
            "provider": "edge",
            "voice": narrator,
            "displayText": f"Number {item['number']}.",
            "ttsText": f"Number {NUMBER_WORDS[item['number']] }.",
            "instructions": None,
            "gapAfterMs": PART1_NUMBER_TO_BODY_MS,
        }
    ]
    for index, turn in enumerate(item["turns"], start=1):
        safe_text, replacements = normalize_part1_text(turn["text"])
        rows.append(
            {
                "role": f"turn{index}",
                "provider": "openai",
                "voice": voice_for_speaker(turn["speaker"]),
                "displayText": turn["text"],
                "ttsText": safe_text,
                "ttsOverrides": replacements,
                "instructions": PART1_INSTRUCTIONS,
                "gapAfterMs": BODY_TO_QUESTION_MS if index == 4 else PART1_TURN_GAP_MS,
            }
        )
    rows.extend(
        [
            {
                "role": "questionLabel",
                "provider": "edge",
                "voice": narrator,
                "displayText": "Question.",
                "ttsText": "Question.",
                "instructions": None,
                "gapAfterMs": QUESTION_LABEL_TO_TEXT_MS,
            },
            {
                "role": "questionText",
                "provider": "edge",
                "voice": narrator,
                "displayText": item["questionText"],
                "ttsText": normalize_part1_text(item["questionText"])[0],
                "instructions": None,
                "gapAfterMs": 0,
            },
        ]
    )
    return rows


def part2_segments(item: dict) -> list[dict]:
    rows = [
        {
            "role": "number",
            "provider": "edge",
            "voice": item["narrator"],
            "displayText": f"Number {item['number']}.",
            "ttsText": f"Number {NUMBER_WORDS[item['number']] }.",
            "instructions": None,
            "gapAfterMs": PART2_NUMBER_TO_BODY_MS,
        }
    ]
    for index, (display, safe) in enumerate(
        zip(item["displayBodySentences"], item["bodySentences"]), start=1
    ):
        rows.append(
            {
                "role": f"bodySentence{index}",
                "provider": "openai",
                "voice": item["bodyVoice"],
                "displayText": display,
                "ttsText": safe,
                "instructions": PART2_INSTRUCTIONS,
                "gapAfterMs": BODY_TO_QUESTION_MS if index == 4 else PART2_SENTENCE_GAP_MS,
            }
        )
    rows.extend(
        [
            {
                "role": "questionLabel",
                "provider": "edge",
                "voice": item["narrator"],
                "displayText": "Question.",
                "ttsText": "Question.",
                "instructions": None,
                "gapAfterMs": QUESTION_LABEL_TO_TEXT_MS,
            },
            {
                "role": "questionText",
                "provider": "edge",
                "voice": item["narrator"],
                "displayText": item["questionText"],
                "ttsText": item["questionText"],
                "instructions": None,
                "gapAfterMs": 0,
            },
        ]
    )
    return rows


def segments_for(item: dict) -> list[dict]:
    return part1_segments(item) if item["part"] == "part1" else part2_segments(item)


def validate(items: list[dict]) -> None:
    for item in items:
        rows = segments_for(item)
        for segment in rows:
            ensure_ascii(segment["ttsText"], f"{item['id']} {segment['role']}")
            if re.search(r"\d", segment["ttsText"]):
                raise RuntimeError(f"Unnormalized digit in {item['id']} {segment['role']}")
            if segment["provider"] == "openai" and segment["instructions"] is None:
                raise RuntimeError(f"OpenAI instructions missing in {item['id']} {segment['role']}")
            if segment["provider"] == "edge" and segment["instructions"] is not None:
                raise RuntimeError(f"Edge segment unexpectedly has instructions in {item['id']}")
        if rows[-2]["role"] != "questionLabel" or rows[-2]["gapAfterMs"] != QUESTION_LABEL_TO_TEXT_MS:
            raise RuntimeError(f"Question segmentation is invalid in {item['id']}")


def cache_path(item: dict, segment: dict) -> Path:
    identity = {
        "revision": AUDIO_REVISION,
        "provider": segment["provider"],
        "model": MODEL if segment["provider"] == "openai" else "edge-neural-tts",
        "voice": segment["voice"]["id"],
        "role": segment["role"],
        "text": segment["ttsText"],
        "speed": SPEED if segment["provider"] == "openai" else "+0%",
        "instructions": segment["instructions"],
        "format": "wav",
    }
    key = audio.cache_key(identity)
    return OUTPUT_DIR / "_cache" / item["id"] / f"{segment['voice']['name']}-{segment['role']}-{key}.wav"


def preflight(items: list[dict]) -> dict:
    validate(items)
    missing = {
        "openai": {"calls": 0, "inputCharacters": 0},
        "edge": {"calls": 0, "inputCharacters": 0},
    }
    item_rows = []
    for item in items:
        serialized = []
        for segment in segments_for(item):
            cached = audio.valid_wav(cache_path(item, segment))
            if not cached:
                row = missing[segment["provider"]]
                row["calls"] += 1
                row["inputCharacters"] += len(segment["ttsText"])
            serialized.append(
                {
                    "role": segment["role"],
                    "provider": segment["provider"],
                    "voice": segment["voice"]["name"],
                    "ttsText": segment["ttsText"],
                    "gapAfterMs": segment["gapAfterMs"],
                    "cached": cached,
                }
            )
        item_rows.append({"item": item["id"], "part": item["part"], "segments": serialized})
    if missing["openai"]["calls"] > MAX_OPENAI_CALLS:
        raise RuntimeError("OpenAI call ceiling exceeded before generation")
    if missing["openai"]["inputCharacters"] > MAX_OPENAI_INPUT_CHARACTERS:
        raise RuntimeError("OpenAI input character ceiling exceeded before generation")
    if missing["edge"]["calls"] > MAX_EDGE_CALLS:
        raise RuntimeError("Edge call ceiling exceeded before generation")
    return {
        "model": MODEL,
        "speedPolicy": {"master": SPEED, "reviewPageDefault": 0.87},
        "deliveryPolicy": COMMON_INSTRUCTIONS.strip(),
        "missing": missing,
        "ceilings": {
            "openaiCalls": MAX_OPENAI_CALLS,
            "openaiInputCharacters": MAX_OPENAI_INPUT_CHARACTERS,
            "edgeCalls": MAX_EDGE_CALLS,
        },
        "timingMs": {
            "part1NumberToBody": PART1_NUMBER_TO_BODY_MS,
            "part1TurnGap": PART1_TURN_GAP_MS,
            "part2NumberToBody": PART2_NUMBER_TO_BODY_MS,
            "part2SentenceGap": PART2_SENTENCE_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionLabelToText": QUESTION_LABEL_TO_TEXT_MS,
        },
        "items": item_rows,
    }


def generate_openai(api_key: str, item: dict, segment: dict, destination: Path) -> dict:
    payload = {
        "model": MODEL,
        "voice": segment["voice"]["id"],
        "input": segment["ttsText"],
        "instructions": segment["instructions"],
        "speed": SPEED,
        "response_format": "wav",
    }
    body, headers = audio.request_bytes(
        part1_source.API_URL,
        payload,
        {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    audio.atomic_write(destination, body)
    if not audio.valid_wav(destination):
        raise RuntimeError(f"OpenAI returned invalid WAV for {item['id']} {segment['role']}")
    return {
        "provider": "openai",
        "model": MODEL,
        "item": item["id"],
        "role": segment["role"],
        "voice": segment["voice"]["id"],
        "inputCharacters": len(segment["ttsText"]),
        "requestId": headers.get("x-request-id") or headers.get("X-Request-ID"),
    }


def generate_edge(ffmpeg: str, item: dict, segment: dict, destination: Path) -> dict:
    audio.generate_edge_segment(segment["voice"]["id"], segment["ttsText"], destination, ffmpeg)
    if not audio.valid_wav(destination):
        raise RuntimeError(f"Edge returned invalid WAV for {item['id']} {segment['role']}")
    return {
        "provider": "edge",
        "model": "edge-neural-tts",
        "item": item["id"],
        "role": segment["role"],
        "voice": segment["voice"]["id"],
        "inputCharacters": len(segment["ttsText"]),
    }


def write_page(items: list[dict], outputs: list[dict]) -> None:
    output_by_id = {output["item"]: output for output in outputs}
    sections = []
    for part, title in (("part1", "Part 1"), ("part2", "Part 2")):
        cards = []
        for item in [row for row in items if row["part"] == part]:
            output = output_by_id[item["id"]]
            if part == "part1":
                voices = f"Marin × Cedar／番号・設問：{item['narrator']['name']}"
            else:
                voices = f"本文：{item['bodyVoice']['name']}／番号・設問：{item['narrator']['name']}"
            cards.append(
                f'<article><h3>No.{item["number"]}</h3><p>{html.escape(voices)}</p>'
                f'<audio controls preload="metadata" src="{html.escape(output["mp3Relative"])}?v={AUDIO_REVISION}"></audio></article>'
            )
        sections.append(f'<section><h2>{title}</h2><div class="grid">{"".join(cards)}</div></section>')
    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>OpenAI版 リスニング音声確認</title>
<style>
:root{{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17211c;background:#f3f1eb}}*{{box-sizing:border-box}}body{{margin:0}}main{{width:min(760px,calc(100% - 24px));margin:auto;padding:28px 0 56px}}h1{{font-size:clamp(24px,6vw,36px)}}.lead,.notice{{color:#526058;line-height:1.75}}.notice{{padding:12px 14px;border-radius:12px;background:#e9f3ed}}.compare-link{{margin:12px 0 0}}.compare-link a{{color:#145d3a;font-weight:700}}.speed-panel{{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:18px 0;padding:12px 14px;border:1px solid #d9ddd8;border-radius:14px;background:#fff}}.speed-button{{padding:8px 13px;border:1px solid #aeb8b1;border-radius:999px;background:#fff;font:inherit;font-weight:700}}.speed-button[aria-pressed="true"]{{border-color:#216a45;color:#fff;background:#216a45}}section{{margin-top:30px}}.grid{{display:grid;gap:12px}}article{{padding:15px;border:1px solid #d9ddd8;border-radius:16px;background:#fff}}h3{{margin:0 0 5px}}article p{{margin:0 0 11px;color:#5d6861;font-size:14px}}audio{{display:block;width:100%}}footer{{margin-top:28px;color:#6a746e;font-size:13px;line-height:1.7}}@media(max-width:560px){{main{{width:100%;padding:20px 5px 52px}}article{{padding:12px 7px}}}}
</style></head><body><main><h1>OpenAI版 リスニング音声確認</h1>
<p class="lead">gpt-4o-mini-ttsの自然な等倍マスターです。Part 1を3問、Part 2を3問確認できます。</p>
<p class="notice">初期再生速度は0.87倍です。音源自体に速度加工をせず、ページ側で再生速度を変更します。</p>
<p class="compare-link"><a href="https://scbt-grade2-round1-simba-production.pages.dev/" target="_blank" rel="noopener">Simba 3.2版を別画面で開く</a></p>
<div class="speed-panel" aria-label="再生速度"><strong>再生速度</strong><button class="speed-button" type="button" data-rate="0.87" aria-pressed="true">0.87倍</button><button class="speed-button" type="button" data-rate="0.90" aria-pressed="false">0.90倍</button><button class="speed-button" type="button" data-rate="1.00" aria-pressed="false">1.00倍</button></div>
{"".join(sections)}
<footer>本文・会話：OpenAI Marin／Cedar。問題番号・Question・設問：Edge Emma／Ryan。<br>マスター速度1.00、24kHz・16bit・mono WAV。公開用MP3は44.1kHz・128kbps。</footer>
</main><script>const audios=[...document.querySelectorAll("audio")],buttons=[...document.querySelectorAll("[data-rate]")];let selectedRate=.87;function apply(a){{a.preservesPitch=true;a.webkitPreservesPitch=true;a.defaultPlaybackRate=selectedRate;a.playbackRate=selectedRate}}const mediaEvents=["loadstart","loadedmetadata","loadeddata","canplay","play","playing"];audios.forEach(a=>{{apply(a);mediaEvents.forEach(eventName=>a.addEventListener(eventName,()=>apply(a)))}});setTimeout(()=>audios.forEach(apply),0);setTimeout(()=>audios.forEach(apply),250);buttons.forEach(b=>b.addEventListener("click",()=>{{selectedRate=Number(b.dataset.rate);buttons.forEach(c=>c.setAttribute("aria-pressed",String(c===b)));audios.forEach(apply)}}));</script></body></html>"""
    (OUTPUT_DIR / "index.html").write_text(page, encoding="utf-8")


def execute(items: list[dict], preflight_data: dict) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")
    if not shutil.which("edge-tts"):
        raise RuntimeError("edge-tts is required")
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if preflight_data["missing"]["openai"]["calls"] and not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    audio.OUTPUT_DIR = OUTPUT_DIR
    actual = {
        "openai": {"calls": 0, "inputCharacters": 0},
        "edge": {"calls": 0, "inputCharacters": 0},
    }
    records = []
    outputs = []
    for item in items:
        segments = segments_for(item)
        for segment in segments:
            destination = cache_path(item, segment)
            if audio.valid_wav(destination):
                continue
            destination.parent.mkdir(parents=True, exist_ok=True)
            provider = segment["provider"]
            if provider == "openai":
                if actual[provider]["calls"] >= MAX_OPENAI_CALLS:
                    raise RuntimeError("OpenAI runtime call ceiling reached")
                if actual[provider]["inputCharacters"] + len(segment["ttsText"]) > MAX_OPENAI_INPUT_CHARACTERS:
                    raise RuntimeError("OpenAI runtime character ceiling reached")
                records.append(generate_openai(api_key, item, segment, destination))
                time.sleep(0.15)
            else:
                if actual[provider]["calls"] >= MAX_EDGE_CALLS:
                    raise RuntimeError("Edge runtime call ceiling reached")
                records.append(generate_edge(ffmpeg, item, segment, destination))
            actual[provider]["calls"] += 1
            actual[provider]["inputCharacters"] += len(segment["ttsText"])

        ordered = []
        segment_report = []
        for segment in segments:
            raw = cache_path(item, segment)
            processed = audio.trim_segment(ffmpeg, raw, f"{item['id']}-{segment['role']}")
            ordered.append((processed, segment["gapAfterMs"]))
            segment_report.append(
                {
                    "role": segment["role"],
                    "provider": segment["provider"],
                    "voice": segment["voice"],
                    "displayText": segment["displayText"],
                    "ttsText": segment["ttsText"],
                    "instructions": segment["instructions"],
                    "speed": SPEED if segment["provider"] == "openai" else 1.0,
                    "gapAfterMs": segment["gapAfterMs"],
                }
            )
        audio_dir = OUTPUT_DIR / item["part"] / "audio"
        wav_path = audio_dir / f"{item['id']}.wav"
        mp3_path = audio_dir / f"{item['id']}.mp3"
        audio.combine_item(ffmpeg, ordered, wav_path, mp3_path)
        outputs.append(
            {
                "item": item["id"],
                "number": item["number"],
                "part": item["part"],
                "segments": segment_report,
                "wav": str(wav_path.relative_to(ROOT)),
                "mp3": str(mp3_path.relative_to(ROOT)),
                "mp3Relative": str(mp3_path.relative_to(OUTPUT_DIR)).replace("\\", "/"),
                "wavProbe": audio.probe_audio(ffprobe, wav_path),
                "mp3Probe": audio.probe_audio(ffprobe, mp3_path),
            }
        )
    write_page(items, outputs)
    report = {
        "mode": "completed",
        "model": MODEL,
        "audioRevision": AUDIO_REVISION,
        "preflight": preflight_data,
        "actual": actual,
        "records": records,
        "outputs": outputs,
        "secretsIncluded": False,
    }
    (OUTPUT_DIR / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return report


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    items = load_part1_items() + load_part2_items()
    preflight_data = preflight(items)
    if not args.execute:
        print(json.dumps({"mode": "preflight", **preflight_data}, ensure_ascii=False, indent=2))
        return 0
    report = execute(items, preflight_data)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
