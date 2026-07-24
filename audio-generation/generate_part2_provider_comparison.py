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
import generate_grade2_round1_part1 as production


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "audio-generation/part2-provider-comparison-20260716"

ITEM_ID = "No16"
ITEM_NUMBER = 16
BODY_TEXT = (
    "During her first month as a volunteer at a local museum, Nina had trouble answering "
    "visitors' questions about an old bridge. She knew the basic facts, but she often forgot "
    "important dates during busy tours. Instead of memorizing a long guidebook, she made a "
    "small timeline and reviewed it before each shift. She can now explain the bridge's history "
    "more clearly."
)
QUESTION_TEXT = "What helped Nina explain the bridge's history better?"

NUMBER_TO_BODY_MS = 1150
BODY_TO_QUESTION_MS = 1100
OPENAI_MODEL = "gpt-4o-mini-tts"
OPENAI_SPEED = 1.0

MAX_CALLS = {"edge": 3, "openai": 3, "speechify": 3}
MAX_CHARACTERS = {"edge": 500, "openai": 500, "speechify": 500}

OPENAI_BODY_INSTRUCTIONS = (
    "Voice: A clear, natural adult woman using American English.\n\n"
    "Delivery: Read as calm, steady narration for an official Eiken Grade 2 listening test. "
    "Use natural speed and light sentence-level intonation. Do not sound flat, rushed, dramatic, "
    "commercial, or overly emotional.\n\n"
    "Pronunciation: Use accurate, easy-to-follow American English with clear consonants and "
    "natural connected speech. Do not split words into syllables or over-pronounce each word.\n\n"
    "Exam fairness: Do not emphasize the detail that answers the question.\n\n"
    "Accuracy: Read the supplied text exactly as written. Do not add, omit, repeat, paraphrase, "
    "correct, or explain anything.\n\n"
    "Audio: Produce a clean studio-style recording without background noise, reverb, clipping, "
    "metallic artifacts, or muffled sound."
)

OPENAI_QUESTION_INSTRUCTIONS = (
    "Voice: A clear, natural adult man using American English.\n\n"
    "Delivery: Read one concise question for an official Eiken Grade 2 listening test at natural "
    "speed. Sound neutral, clear, and professional, with a natural question contour. Do not sound "
    "dramatic or emphasize any clue.\n\n"
    "Pronunciation: Use accurate American English with clear consonants and natural rhythm.\n\n"
    "Accuracy: Read the supplied text exactly as written. Do not add, omit, repeat, paraphrase, "
    "correct, or explain anything.\n\n"
    "Audio: Produce a clean studio-style recording without background noise, reverb, clipping, "
    "metallic artifacts, or muffled sound."
)

SEGMENTS = [
    {
        "role": "number",
        "voiceRole": "body",
        "text": f"Number {ITEM_NUMBER}.",
        "gapAfterMs": NUMBER_TO_BODY_MS,
    },
    {
        "role": "body",
        "voiceRole": "body",
        "text": BODY_TEXT,
        "gapAfterMs": BODY_TO_QUESTION_MS,
    },
    {
        "role": "question",
        "voiceRole": "question",
        "text": f"Question. {QUESTION_TEXT}",
        "gapAfterMs": 0,
    },
]

VARIANTS = [
    {
        "blindLabel": "A",
        "slug": "edge-emma-ryan",
        "displayName": "Microsoft Edge — Emma → Ryan",
        "provider": "edge",
        "model": "Edge Neural TTS",
        "voices": {
            "body": {
                "id": "en-US-EmmaMultilingualNeural",
                "name": "Emma",
                "gender": "female",
                "language": "en-US",
                "englishOnly": True,
            },
            "question": {
                "id": "en-GB-RyanNeural",
                "name": "Ryan",
                "gender": "male",
                "language": "en-GB",
                "englishOnly": True,
            },
        },
    },
    {
        "blindLabel": "B",
        "slug": "openai-marin-cedar",
        "displayName": "OpenAI gpt-4o-mini-tts — marin → cedar",
        "provider": "openai",
        "model": OPENAI_MODEL,
        "voices": {
            "body": {"id": "marin", "name": "marin", "gender": "female"},
            "question": {"id": "cedar", "name": "cedar", "gender": "male"},
        },
    },
    {
        "blindLabel": "C",
        "slug": "simba-geffen-dominic",
        "displayName": "SpeechifyAI Simba 3.2 — Geffen → Dominic",
        "provider": "speechify",
        "model": "simba-3.2",
        "language": "en-US",
        "voices": {
            "body": {"id": "geffen_32", "name": "Geffen", "gender": "female"},
            "question": {
                "id": "dominic_32",
                "name": "Dominic",
                "gender": "male",
            },
        },
    },
]


def parse_args():
    parser = argparse.ArgumentParser(
        description="Create one Part 2 provider comparison with different body and question voices."
    )
    parser.add_argument("--execute", action="store_true")
    return parser.parse_args()


def configure_helpers():
    audio.OUTPUT_DIR = OUTPUT_DIR


def instructions_for(segment: dict) -> str:
    if segment["role"] == "question":
        return OPENAI_QUESTION_INSTRUCTIONS
    return OPENAI_BODY_INSTRUCTIONS


def raw_path(variant: dict, segment: dict) -> Path:
    voice = variant["voices"][segment["voiceRole"]]
    provider = variant["provider"]
    payload = {
        "provider": provider,
        "model": variant["model"],
        "voice": voice["id"],
        "role": segment["role"],
        "text": segment["text"],
    }
    if provider == "edge":
        payload.update({"rate": "+0%", "language": voice["language"]})
    elif provider == "openai":
        payload.update(
            {
                "speed": OPENAI_SPEED,
                "instructions": instructions_for(segment),
                "responseFormat": "wav",
            }
        )
    else:
        payload.update({"audioFormat": "wav", "language": variant["language"]})
    key = audio.cache_key(payload)
    return OUTPUT_DIR / "_cache" / variant["slug"] / f"{voice['name']}-{key}.wav"


def preflight() -> dict:
    if not all(segment["text"].isascii() for segment in SEGMENTS):
        raise RuntimeError("All TTS input must be ASCII English for this comparison")

    missing = {
        provider: {"calls": 0, "characters": 0}
        for provider in ("edge", "openai", "speechify")
    }
    for variant in VARIANTS:
        for segment in SEGMENTS:
            path = raw_path(variant, segment)
            if not audio.valid_wav(path):
                row = missing[variant["provider"]]
                row["calls"] += 1
                row["characters"] += len(segment["text"])

    for provider, row in missing.items():
        if row["calls"] > MAX_CALLS[provider]:
            raise RuntimeError(f"{provider} call ceiling exceeded before generation")
        if row["characters"] > MAX_CHARACTERS[provider]:
            raise RuntimeError(f"{provider} character ceiling exceeded before generation")

    return {
        "item": ITEM_ID,
        "variants": [
            {
                "label": variant["blindLabel"],
                "name": variant["displayName"],
                "provider": variant["provider"],
                "bodyVoice": variant["voices"]["body"],
                "questionVoice": variant["voices"]["question"],
            }
            for variant in VARIANTS
        ],
        "missing": missing,
        "ceilings": {
            provider: {
                "calls": MAX_CALLS[provider],
                "characters": MAX_CHARACTERS[provider],
            }
            for provider in MAX_CALLS
        },
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
        },
    }


def generate_openai(api_key: str, variant: dict, segment: dict, path: Path) -> dict:
    voice = variant["voices"][segment["voiceRole"]]
    payload = {
        "model": OPENAI_MODEL,
        "voice": voice["id"],
        "input": segment["text"],
        "speed": OPENAI_SPEED,
        "response_format": "wav",
        "instructions": instructions_for(segment),
    }
    body, headers = audio.request_bytes(
        production.API_URL,
        payload,
        {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    audio.atomic_write(path, body)
    if not audio.valid_wav(path):
        raise RuntimeError("OpenAI did not return a valid WAV file")
    return {
        "provider": "openai",
        "model": OPENAI_MODEL,
        "role": segment["role"],
        "voice": voice["id"],
        "characters": len(segment["text"]),
        "requestId": headers.get("x-request-id") or headers.get("X-Request-ID"),
    }


def generate_speechify(api_key: str, variant: dict, segment: dict, path: Path) -> dict:
    voice = variant["voices"][segment["voiceRole"]]
    idempotency_key = audio.cache_key(
        {
            "provider": "speechify",
            "model": variant["model"],
            "voice": voice["id"],
            "role": segment["role"],
            "text": segment["text"],
        }
    )
    payload = {
        "input": segment["text"],
        "voice_id": voice["id"],
        "audio_format": "wav",
        "language": variant["language"],
        "model": variant["model"],
    }
    body, headers = audio.request_bytes(
        audio.SPEECHIFY_API_URL,
        payload,
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Speechify-Version": audio.SPEECHIFY_VERSION,
            "Idempotency-Key": idempotency_key,
        },
    )
    response = json.loads(body.decode("utf-8"))
    audio.atomic_write(path, base64.b64decode(response["audio_data"]))
    if not audio.valid_wav(path):
        raise RuntimeError("Speechify did not return a valid WAV file")
    return {
        "provider": "speechify",
        "model": variant["model"],
        "role": segment["role"],
        "voice": voice["id"],
        "characters": len(segment["text"]),
        "billableCharacters": response.get("billable_characters_count"),
        "requestId": headers.get("x-request-id") or headers.get("X-Request-ID"),
    }


def write_page():
    cards = []
    for variant in VARIANTS:
        cards.append(
            f'<article class="sample-card"><span class="badge">比較 {variant["blindLabel"]}</span>'
            f'<audio controls preload="metadata" src="{html.escape(variant["slug"] + "/No16.mp3")}"></audio></article>'
        )
    mapping = "".join(
        f'<li><strong>{variant["blindLabel"]}</strong>：{html.escape(variant["displayName"])}'
        f'（本文 {html.escape(variant["voices"]["body"]["name"])}／設問 '
        f'{html.escape(variant["voices"]["question"]["name"])}）</li>'
        for variant in VARIANTS
    )
    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SCBT Part 2 TTS比較</title>
<style>
:root{{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
*,*::before,*::after{{box-sizing:border-box}}html,body{{max-width:100%;overflow-x:hidden}}
body{{margin:0;background:#f4f1ea;color:#17211c}}main{{width:calc(100% - 24px);max-width:760px;margin:0 auto;padding:34px 0 56px}}
h1{{font-size:clamp(24px,6vw,36px);line-height:1.15;margin:0 0 12px}}.lead{{color:#546058;line-height:1.7;margin:0 0 26px}}
.question-block{{background:#fff;border:1px solid #d9ddd8;border-radius:18px;padding:20px;box-shadow:0 8px 26px rgba(31,52,41,.07)}}
h2{{margin:0 0 14px;font-size:20px}}.samples{{display:grid;gap:12px}}.sample-card{{display:grid;grid-template-columns:88px minmax(0,1fr);align-items:center;gap:12px;padding:12px;border-radius:13px;background:#f7f8f6}}
.badge{{font-weight:750;color:#19583a}}audio{{display:block;width:100%;max-width:100%;min-width:0}}details{{margin-top:24px;background:#17211c;color:#fff;padding:18px 20px;border-radius:16px}}summary{{cursor:pointer;font-weight:750}}li{{margin:.65em 0;line-height:1.5}}.meta{{margin-top:22px;color:#6b746e;font-size:13px;line-height:1.7}}
@media(max-width:560px){{main{{width:100%;padding:20px 4px 56px}}.question-block{{padding:8px;border-radius:12px}}.sample-card{{grid-template-columns:minmax(0,1fr);padding:8px 0}}.badge{{padding:0 8px}}audio::-webkit-media-controls-mute-button,audio::-webkit-media-controls-volume-slider{{display:none}}}}
</style></head><body><main>
<h1>SCBT Part 2・3社比較</h1>
<p class="lead">同じNo.16を聞き、本文の読みやすさ、設問への声の切り替わり、音質を比較してください。</p>
<section class="question-block"><h2>No16</h2><div class="samples">{"".join(cards)}</div></section>
<details><summary>比較A～Cの正体を見る</summary><ul>{mapping}</ul></details>
<p class="meta">全候補共通：本文は女性、設問は男性、速度1.0、問題番号→本文1150ms、本文→Question 1100ms、-20 LUFS、MP3 44.1kHz/128kbps。</p>
</main></body></html>"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "index.html").write_text(page, encoding="utf-8")


def execute(preflight_data: dict) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")

    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    speechify_key = os.environ.get("SPEECHIFY_API_KEY", "").strip()
    if preflight_data["missing"]["openai"]["calls"] and not openai_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    if preflight_data["missing"]["speechify"]["calls"] and not speechify_key:
        raise RuntimeError("SPEECHIFY_API_KEY is not set")

    actual = {
        provider: {"calls": 0, "characters": 0}
        for provider in ("edge", "openai", "speechify")
    }
    records = []
    for variant in VARIANTS:
        provider = variant["provider"]
        for segment in SEGMENTS:
            path = raw_path(variant, segment)
            if audio.valid_wav(path):
                continue
            row = actual[provider]
            if row["calls"] >= MAX_CALLS[provider]:
                raise RuntimeError(f"{provider} runtime call ceiling reached")
            if row["characters"] + len(segment["text"]) > MAX_CHARACTERS[provider]:
                raise RuntimeError(f"{provider} runtime character ceiling reached")

            voice = variant["voices"][segment["voiceRole"]]
            if provider == "edge":
                audio.generate_edge_segment(voice["id"], segment["text"], path, ffmpeg)
                records.append(
                    {
                        "provider": "edge",
                        "model": variant["model"],
                        "role": segment["role"],
                        "voice": voice["id"],
                        "characters": len(segment["text"]),
                    }
                )
            elif provider == "openai":
                records.append(generate_openai(openai_key, variant, segment, path))
            else:
                records.append(generate_speechify(speechify_key, variant, segment, path))
                time.sleep(1.05)
            row["calls"] += 1
            row["characters"] += len(segment["text"])

    outputs = []
    for variant in VARIANTS:
        ordered = []
        for segment in SEGMENTS:
            raw = raw_path(variant, segment)
            processed = audio.trim_segment(ffmpeg, raw, variant["slug"])
            ordered.append((processed, segment["gapAfterMs"]))
        variant_dir = OUTPUT_DIR / variant["slug"]
        wav_path = variant_dir / f"{ITEM_ID}.wav"
        mp3_path = variant_dir / f"{ITEM_ID}.mp3"
        audio.combine_item(ffmpeg, ordered, wav_path, mp3_path)
        outputs.append(
            {
                "item": ITEM_ID,
                "label": variant["blindLabel"],
                "variant": variant["displayName"],
                "wav": str(wav_path.relative_to(ROOT)),
                "mp3": str(mp3_path.relative_to(ROOT)),
                "wavProbe": audio.probe_audio(ffprobe, wav_path),
                "mp3Probe": audio.probe_audio(ffprobe, mp3_path),
            }
        )

    write_page()
    report = {
        "source": "audio-generation/grade2-sample-part2-pilot.json",
        "outputDirectory": str(OUTPUT_DIR.relative_to(ROOT)),
        "item": {
            "id": ITEM_ID,
            "number": ITEM_NUMBER,
            "bodyText": BODY_TEXT,
            "questionText": QUESTION_TEXT,
            "segments": SEGMENTS,
        },
        "preflight": preflight_data,
        "actual": actual,
        "records": records,
        "outputs": outputs,
        "secretsIncluded": False,
    }
    (OUTPUT_DIR / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return report


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    configure_helpers()
    preflight_data = preflight()
    print(json.dumps(preflight_data, ensure_ascii=False, indent=2), flush=True)
    if not args.execute:
        print("PREFLIGHT ONLY: no TTS calls were made.")
        return
    report = execute(preflight_data)
    print(
        json.dumps(
            {
                "actual": report["actual"],
                "index": str(OUTPUT_DIR / "index.html"),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
