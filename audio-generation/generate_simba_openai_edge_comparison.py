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
OUTPUT_DIR = ROOT / "audio-generation/tts-provider-comparison-20260716"
PRIOR_TRIAL_DIR = ROOT / "audio-generation/tts-finalists-trial-20260716"
ROUND1_DIR = ROOT / "audio-generation/grade2-round1/part1"

NUMBER_TO_BODY_MS = 1350
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1100

MAX_SPEECHIFY_CALLS = 16
MAX_SPEECHIFY_CHARACTERS = 1400
MAX_OPENAI_CALLS = 8
MAX_OPENAI_CHARACTERS = 700
MAX_EDGE_CALLS = 8

OPENAI_MODEL = "gpt-4o-mini-tts"
OPENAI_SPEED = 1.0

NARRATOR_VOICES = {
    1: "en-US-EmmaMultilingualNeural",
    2: "en-GB-RyanNeural",
}

VARIANTS = [
    {
        "blindLabel": "A",
        "slug": "simba-geffen-dominic",
        "cacheSlug": "speechify-simba-3-2",
        "displayName": "Speechify Simba 3.2 — Geffen × Dominic",
        "provider": "speechify",
        "model": "simba-3.2",
        "language": "en-US",
        "reusePrior": True,
        "voices": {
            "A": {"id": "geffen_32", "name": "Geffen", "gender": "female"},
            "B": {"id": "dominic_32", "name": "Dominic", "gender": "male"},
        },
    },
    {
        "blindLabel": "B",
        "slug": "simba-harper-wyatt",
        "cacheSlug": "speechify-harper-wyatt",
        "displayName": "Speechify Simba 3.2 — Harper × Wyatt",
        "provider": "speechify",
        "model": "simba-3.2",
        "language": "en-US",
        "reusePrior": False,
        "voices": {
            "A": {"id": "harper_32", "name": "Harper", "gender": "female"},
            "B": {"id": "wyatt_32", "name": "Wyatt", "gender": "male"},
        },
    },
    {
        "blindLabel": "C",
        "slug": "simba-imogen-hugh",
        "cacheSlug": "speechify-imogen-hugh",
        "displayName": "Speechify Simba 3.2 — Imogen × Hugh",
        "provider": "speechify",
        "model": "simba-3.2",
        "language": "en-GB",
        "reusePrior": False,
        "voices": {
            "A": {"id": "imogen_32", "name": "Imogen", "gender": "female"},
            "B": {"id": "hugh_32", "name": "Hugh", "gender": "male"},
        },
    },
    {
        "blindLabel": "D",
        "slug": "openai-marin-cedar",
        "displayName": "OpenAI gpt-4o-mini-tts — marin × cedar",
        "provider": "openai",
        "model": OPENAI_MODEL,
        "voices": {
            "A": {"id": "marin", "name": "marin", "gender": "female"},
            "B": {"id": "cedar", "name": "cedar", "gender": "male"},
        },
    },
    {
        "blindLabel": "E",
        "slug": "edge-emma-ryan",
        "displayName": "Microsoft Edge — Emma × Ryan",
        "provider": "edge",
        "model": "Edge Neural TTS",
        "voices": {
            "A": {
                "id": "en-US-EmmaMultilingualNeural",
                "name": "Emma",
                "gender": "female",
            },
            "B": {"id": "en-GB-RyanNeural", "name": "Ryan", "gender": "male"},
        },
    },
]


def parse_args():
    parser = argparse.ArgumentParser(
        description="Compare three Simba 3.2 pairs with the approved OpenAI and Edge pairs."
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument(
        "--speechify-only",
        action="store_true",
        help="Generate and assemble only the three Speechify variants.",
    )
    return parser.parse_args()


def configure_audio_helpers():
    audio.OUTPUT_DIR = OUTPUT_DIR
    audio.NUMBER_TO_BODY_MS = NUMBER_TO_BODY_MS
    audio.TURN_GAP_MS = TURN_GAP_MS
    audio.BODY_TO_QUESTION_MS = BODY_TO_QUESTION_MS


def cache_path(folder: Path, provider: str, voice: str, payload: dict) -> Path:
    key = audio.cache_key(payload)
    return folder / f"{voice}-{key}.wav"


def speechify_path(variant: dict, speaker: str, text: str) -> Path:
    voice = variant["voices"][speaker]
    payload = {
        "provider": "speechify",
        "model": variant["model"],
        "voice": voice["id"],
        "text": text,
        "audioFormat": "wav",
        "language": variant["language"],
    }
    if variant.get("reusePrior"):
        prior = cache_path(
            PRIOR_TRIAL_DIR / "_cache" / variant["cacheSlug"],
            "speechify",
            voice["name"],
            payload,
        )
        if audio.valid_wav(prior):
            return prior
    return cache_path(
        OUTPUT_DIR / "_cache" / variant["cacheSlug"],
        "speechify",
        voice["name"],
        payload,
    )


def openai_path(variant: dict, speaker: str, text: str) -> Path:
    voice = variant["voices"][speaker]
    payload = {
        "provider": "openai",
        "model": OPENAI_MODEL,
        "voice": voice["id"],
        "speed": OPENAI_SPEED,
        "instructions": production.OPENAI_INSTRUCTIONS,
        "text": text,
        "format": "wav",
    }
    return cache_path(
        OUTPUT_DIR / "_cache" / variant["slug"],
        "openai",
        voice["name"],
        payload,
    )


def edge_path(variant: dict, speaker: str, text: str) -> Path:
    voice = variant["voices"][speaker]
    payload = {"provider": "edge", "voice": voice["id"], "rate": "+0%", "text": text}
    return cache_path(
        OUTPUT_DIR / "_cache" / variant["slug"],
        "edge",
        voice["name"],
        payload,
    )


def narrator_path(voice: str, text: str) -> Path:
    payload = {"provider": "edge", "voice": voice, "rate": "+0%", "text": text}
    safe_voice = voice.replace("/", "_")
    prior = cache_path(PRIOR_TRIAL_DIR / "_cache" / "edge", "edge", safe_voice, payload)
    if audio.valid_wav(prior):
        return prior
    return cache_path(OUTPUT_DIR / "_cache" / "narrator", "edge", safe_voice, payload)


def load_prior_segment_index() -> dict[tuple[str, str, str], Path]:
    index = {}
    for item_id in ("No01", "No02"):
        report_path = ROUND1_DIR / f"{item_id}-report.json"
        report = json.loads(report_path.read_text(encoding="utf-8"))
        for segment in report.get("segments", []):
            path = ROOT / Path(segment["path"])
            if audio.valid_wav(path):
                index[(segment["provider"], segment["voice"], segment["text"])] = path
    return index


def raw_path(variant: dict, speaker: str, text: str, prior_index: dict) -> Path:
    provider = variant["provider"]
    voice_id = variant["voices"][speaker]["id"]
    prior = prior_index.get((provider, voice_id, text))
    if prior and audio.valid_wav(prior):
        return prior
    if provider == "speechify":
        return speechify_path(variant, speaker, text)
    if provider == "openai":
        return openai_path(variant, speaker, text)
    return edge_path(variant, speaker, text)


def preflight(items: list[dict], prior_index: dict) -> dict:
    missing = {
        "speechify": {"calls": 0, "characters": 0},
        "openai": {"calls": 0, "characters": 0},
        "edge": {"calls": 0, "characters": 0},
    }
    for variant in VARIANTS:
        for item in items:
            for turn in item["turns"]:
                path = raw_path(variant, turn["speaker"], turn["text"], prior_index)
                if not audio.valid_wav(path):
                    row = missing[variant["provider"]]
                    row["calls"] += 1
                    row["characters"] += len(turn["text"])

    for item in items:
        narrator = NARRATOR_VOICES[item["number"]]
        for text in (f"Number {item['number']}.", f"Question. {item['questionText']}"):
            if not audio.valid_wav(narrator_path(narrator, text)):
                missing["edge"]["calls"] += 1
                missing["edge"]["characters"] += len(text)

    if missing["speechify"]["calls"] > MAX_SPEECHIFY_CALLS:
        raise RuntimeError("Speechify call ceiling exceeded before generation")
    if missing["speechify"]["characters"] > MAX_SPEECHIFY_CHARACTERS:
        raise RuntimeError("Speechify character ceiling exceeded before generation")
    if missing["openai"]["calls"] > MAX_OPENAI_CALLS:
        raise RuntimeError("OpenAI call ceiling exceeded before generation")
    if missing["openai"]["characters"] > MAX_OPENAI_CHARACTERS:
        raise RuntimeError("OpenAI character ceiling exceeded before generation")
    if missing["edge"]["calls"] > MAX_EDGE_CALLS:
        raise RuntimeError("Edge call ceiling exceeded before generation")

    return {
        "items": [item["id"] for item in items],
        "variants": [
            {
                "label": variant["blindLabel"],
                "name": variant["displayName"],
                "provider": variant["provider"],
                "voices": variant["voices"],
            }
            for variant in VARIANTS
        ],
        "missing": missing,
        "ceilings": {
            "speechify": {
                "calls": MAX_SPEECHIFY_CALLS,
                "characters": MAX_SPEECHIFY_CHARACTERS,
            },
            "openai": {"calls": MAX_OPENAI_CALLS, "characters": MAX_OPENAI_CHARACTERS},
            "edge": {"calls": MAX_EDGE_CALLS},
        },
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "turnGap": TURN_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
        },
    }


def generate_speechify(api_key: str, variant: dict, speaker: str, text: str, path: Path):
    voice = variant["voices"][speaker]
    idempotency_key = audio.cache_key(
        {"provider": "speechify", "model": variant["model"], "voice": voice["id"], "text": text}
    )
    payload = {
        "input": text,
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
        "voice": voice["id"],
        "characters": len(text),
        "billableCharacters": response.get("billable_characters_count"),
        "requestId": headers.get("x-request-id") or headers.get("X-Request-ID"),
    }


def generate_openai(api_key: str, variant: dict, speaker: str, text: str, path: Path):
    voice = variant["voices"][speaker]
    payload = {
        "model": OPENAI_MODEL,
        "voice": voice["id"],
        "input": text,
        "speed": OPENAI_SPEED,
        "response_format": "wav",
        "instructions": production.OPENAI_INSTRUCTIONS,
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
        "voice": voice["id"],
        "characters": len(text),
        "requestId": headers.get("x-request-id") or headers.get("X-Request-ID"),
    }


def write_page(items: list[dict]):
    blocks = []
    for item in items:
        samples = []
        for variant in VARIANTS:
            source = f"{variant['slug']}/{item['id']}.mp3"
            samples.append(
                f'<article class="sample-card"><span class="badge">比較 {variant["blindLabel"]}</span>'
                f'<audio controls preload="metadata" src="{html.escape(source)}"></audio></article>'
            )
        blocks.append(
            f'<section class="question-block"><h2>{item["id"]}</h2>'
            f'<div class="samples">{"".join(samples)}</div></section>'
        )
    mapping = "".join(
        f'<li><strong>{variant["blindLabel"]}</strong>：{html.escape(variant["displayName"])}</li>'
        for variant in VARIANTS
    )
    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SCBT TTS最終比較</title>
<style>
:root{{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
*,*::before,*::after{{box-sizing:border-box}}html,body{{max-width:100%;overflow-x:hidden}}
body{{margin:0;background:#f4f1ea;color:#17211c}}main{{width:calc(100% - 24px);max-width:780px;margin:0 auto;padding:34px 0 56px}}
h1{{font-size:clamp(24px,6vw,36px);line-height:1.15;margin:0 0 12px}}.lead{{color:#546058;line-height:1.7;margin:0 0 28px;overflow-wrap:anywhere}}
.question-block{{background:#fff;border:1px solid #d9ddd8;border-radius:18px;padding:20px;margin:18px 0;box-shadow:0 8px 26px rgba(31,52,41,.07)}}
h2{{margin:0 0 14px;font-size:20px}}.samples{{display:grid;gap:12px}}.sample-card{{display:grid;grid-template-columns:88px minmax(0,1fr);align-items:center;gap:12px;padding:12px;border-radius:13px;background:#f7f8f6}}
.badge{{font-weight:750;color:#19583a}}audio{{display:block;width:100%;max-width:100%;min-width:0}}details{{margin-top:26px;background:#17211c;color:#fff;padding:18px 20px;border-radius:16px}}summary{{cursor:pointer;font-weight:750}}li{{margin:.65em 0;line-height:1.5}}.meta{{margin-top:24px;color:#6b746e;font-size:13px;line-height:1.6}}
@media(max-width:560px){{main{{width:100%;padding:20px 4px 56px}}.question-block{{padding:8px;border-radius:12px}}.sample-card{{grid-template-columns:minmax(0,1fr);padding:6px 0}}.badge{{padding:0 8px}}audio::-webkit-media-controls-mute-button,audio::-webkit-media-controls-volume-slider{{display:none}}}}
</style></head><body><main>
<h1>SCBT TTS最終ブラインド比較</h1>
<p class="lead">A～Eを先入観なしで聞き、英検2級の会話として最も自然で聞きやすい声を選んでください。</p>
{"".join(blocks)}
<details><summary>比較A～Eの正体を見る</summary><ul>{mapping}</ul></details>
<p class="meta">全候補共通：速度1.0、問題番号→会話1350ms、発言間550ms、会話→Question 1100ms、-20 LUFS、MP3 44.1kHz/128kbps。</p>
</main></body></html>"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "index.html").write_text(page, encoding="utf-8")


def execute(items: list[dict], prior_index: dict, preflight_data: dict):
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")

    speechify_key = os.environ.get("SPEECHIFY_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if preflight_data["missing"]["speechify"]["calls"] and not speechify_key:
        raise RuntimeError("SPEECHIFY_API_KEY is not set")
    if preflight_data["missing"]["openai"]["calls"] and not openai_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    records = []
    actual = {
        "speechify": {"calls": 0, "characters": 0},
        "openai": {"calls": 0, "characters": 0},
        "edge": {"calls": 0, "characters": 0},
    }
    for variant in VARIANTS:
        for item in items:
            for turn in item["turns"]:
                path = raw_path(variant, turn["speaker"], turn["text"], prior_index)
                if audio.valid_wav(path):
                    continue
                provider = variant["provider"]
                expected = actual[provider]
                if provider == "speechify":
                    if expected["calls"] >= MAX_SPEECHIFY_CALLS:
                        raise RuntimeError("Speechify runtime call ceiling reached")
                    if expected["characters"] + len(turn["text"]) > MAX_SPEECHIFY_CHARACTERS:
                        raise RuntimeError("Speechify runtime character ceiling reached")
                    records.append(
                        generate_speechify(
                            speechify_key, variant, turn["speaker"], turn["text"], path
                        )
                    )
                    time.sleep(1.05)
                elif provider == "openai":
                    if expected["calls"] >= MAX_OPENAI_CALLS:
                        raise RuntimeError("OpenAI runtime call ceiling reached")
                    if expected["characters"] + len(turn["text"]) > MAX_OPENAI_CHARACTERS:
                        raise RuntimeError("OpenAI runtime character ceiling reached")
                    records.append(
                        generate_openai(openai_key, variant, turn["speaker"], turn["text"], path)
                    )
                else:
                    if expected["calls"] >= MAX_EDGE_CALLS:
                        raise RuntimeError("Edge runtime call ceiling reached")
                    audio.generate_edge_segment(
                        variant["voices"][turn["speaker"]]["id"], turn["text"], path, ffmpeg
                    )
                expected["calls"] += 1
                expected["characters"] += len(turn["text"])

    outputs = []
    for item in items:
        narrator = NARRATOR_VOICES[item["number"]]
        number_text = f"Number {item['number']}."
        question_text = f"Question. {item['questionText']}"
        number_raw = narrator_path(narrator, number_text)
        question_raw = narrator_path(narrator, question_text)
        for text, path in ((number_text, number_raw), (question_text, question_raw)):
            if not audio.valid_wav(path):
                audio.generate_edge_segment(narrator, text, path, ffmpeg)
                actual["edge"]["calls"] += 1
                actual["edge"]["characters"] += len(text)
        number_processed = audio.trim_segment(ffmpeg, number_raw, "shared-narrator")
        question_processed = audio.trim_segment(ffmpeg, question_raw, "shared-narrator")

        for variant in VARIANTS:
            ordered = [(number_processed, NUMBER_TO_BODY_MS)]
            for turn_index, turn in enumerate(item["turns"]):
                raw = raw_path(variant, turn["speaker"], turn["text"], prior_index)
                processed = audio.trim_segment(ffmpeg, raw, variant["slug"])
                gap = BODY_TO_QUESTION_MS if turn_index == len(item["turns"]) - 1 else TURN_GAP_MS
                ordered.append((processed, gap))
            ordered.append((question_processed, 0))
            variant_dir = OUTPUT_DIR / variant["slug"]
            wav_path = variant_dir / f"{item['id']}.wav"
            mp3_path = variant_dir / f"{item['id']}.mp3"
            audio.combine_item(ffmpeg, ordered, wav_path, mp3_path)
            outputs.append(
                {
                    "item": item["id"],
                    "label": variant["blindLabel"],
                    "variant": variant["displayName"],
                    "wav": str(wav_path.relative_to(ROOT)),
                    "mp3": str(mp3_path.relative_to(ROOT)),
                    "wavProbe": audio.probe_audio(ffprobe, wav_path),
                    "mp3Probe": audio.probe_audio(ffprobe, mp3_path),
                }
            )

    write_page(items)
    report = {
        "source": str(audio.SOURCE_MANIFEST.relative_to(ROOT)),
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
    global VARIANTS
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    if args.speechify_only:
        VARIANTS = [variant for variant in VARIANTS if variant["provider"] == "speechify"]
    configure_audio_helpers()
    items = audio.load_items()
    prior_index = load_prior_segment_index()
    preflight_data = preflight(items, prior_index)
    print(json.dumps(preflight_data, ensure_ascii=False, indent=2), flush=True)
    if not args.execute:
        print("PREFLIGHT ONLY: no TTS API or Edge calls were made.")
        return
    report = execute(items, prior_index, preflight_data)
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
