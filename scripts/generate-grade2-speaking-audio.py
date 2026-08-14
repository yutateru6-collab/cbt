"""Generate the immutable Grade 2 speaking release with Gemini Kore.

The script intentionally has no model or voice fallback. It writes into a staging
directory and publishes the local release directory only after every WAV and hash
has been verified.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import shutil
import sys
import wave
from datetime import datetime, timezone
from pathlib import Path

MODEL = "gemini-3.1-flash-tts-preview"
VOICE = "Kore"
RATE = 24_000
CHANNELS = 1
WIDTH = 2
RELEASE = "20260815-gemini-speaking-kore-v4"

COMMON = {
    "sound-check": "This is a sound check. Please adjust the volume to a comfortable level.",
    "warmup-intro": "We will begin with two warm-up questions. These questions are not scored. Please answer each question in English.",
    "warmup-2": "What do you enjoy doing on weekends?",
    "card-introduction": "Now, we will begin the test. Please look at the card.",
    "silent-reading": "Please read the passage silently for twenty seconds.",
    "read-aloud": "Now, please read the passage aloud.",
    "no-2-preparation": "Now, please look at the picture and describe the situation. You have twenty seconds to prepare. Your story should begin with the sentence on the card.",
    "no-2": "Please begin.",
    "turn-card": "Please turn over the card and put it down.",
    "why": "Why?",
    "why-not": "Why not?",
    "section-finish": "This is the end of the speaking test.",
}

SETS = {
    "sample": {
        "warmup-1": "What kind of books do you like to read?",
        "no-1": "According to the passage, how can residents finish repairs without buying new tools?",
        "no-3": "Now, No. 3. Some people say that borrowing tools from libraries is better than buying tools for small home repairs. What do you think about that?",
        "no-4": "Now, No. 4. Today, some restaurants let customers order meals with tablet computers. Do you think more restaurants will use this system in the future?",
    },
    "set-01": {
        "warmup-1": "Where do you usually go shopping?",
        "no-1": "According to the passage, how can customers buy daily products without using new plastic containers?",
        "no-3": "Now, No. 3. Some people say that local governments should help stores install refill stations. What do you think about that?",
        "no-4": "Now, No. 4. These days, many people post photographs of their daily lives online. Do you think people are careful enough about their personal information when they do this?",
    },
    "set-02": {
        "warmup-1": "When did you last visit a museum?",
        "no-1": "According to the passage, how can visitors enter museums without standing in long ticket lines?",
        "no-3": "Now, No. 3. Some people say that more museums will offer digital tickets and guides in the future. What do you think about that?",
        "no-4": "Now, No. 4. Today, some schools allow students to wear casual clothes instead of uniforms on special days. Do you think this is a good idea?",
    },
    "set-03": {
        "warmup-1": "Who usually buys groceries in your family?",
        "no-1": "According to the passage, why do supermarkets provide simple guides and telephone support?",
        "no-3": "Now, No. 3. Some people say that supermarkets should provide more support for older customers who shop online. What do you think about that?",
        "no-4": "Now, No. 4. Nowadays, some people use their smartphones while walking on busy streets. Do you think people should stop doing this?",
    },
    "set-04": {
        "warmup-1": "What do you usually eat for lunch?",
        "no-1": "According to the passage, how can students leave less food on their plates?",
        "no-3": "Now, No. 3. Some people say that letting students choose from several lunch sizes is better than asking everyone to finish the same amount. What do you think about that?",
        "no-4": "Now, No. 4. Today, many people work or study at cafés. Do you think more people will do this in the future?",
    },
    "set-05": {
        "warmup-1": "Is there a park near your home?",
        "no-1": "According to the passage, why are city workers making paths wider and adding more benches?",
        "no-3": "Now, No. 3. Some people say that cities should spend more money on wide paths and benches than on new playground equipment. What do you think about that?",
        "no-4": "Now, No. 4. These days, many people buy things online after reading customer reviews. Do you think people are careful enough when they trust these reviews?",
    },
}

JAPANESE = {
    "speaking-start-ja": "これから2級スピーキングテストを始めます。はじめに、採点対象外のウォームアップを行います。そのあと、問題カードの黙読、音読、ナンバー1からナンバー4へ進みます。案内や質問の音声が終わってから、マイクに向かって答えてください。質問は2回まで聞き直せます。録音はこの端末内に保存され、テスト終了後にダウンロードできます。",
    "listening-part1-ja": "これから2級リスニングテストを始めます。このテストには第1部と第2部があり、全部で30問です。対話、英文、質問はそれぞれ一度だけ流れます。音声をよく聞き、画面に表示された4つの選択肢から、最も適切な答えを1つ選んでください。各問題の解答時間は10秒です。まず、第1部を始めます。第1部は、対話とその質問を聞いて答える形式です。問題はナンバー1からナンバー15までです。それでは、ナンバー1を始めます。",
    "listening-part2-ja": "これから第2部を始めます。第2部は、英文とその質問を聞いて答える形式です。問題はナンバー16からナンバー30までです。英文と質問はそれぞれ一度だけ流れます。画面に表示された4つの選択肢から、最も適切な答えを1つ選んでください。各問題の解答時間は10秒です。それでは、ナンバー16を始めます。",
}


def items():
    for name, text in COMMON.items():
        yield {"id": f"common/{name}", "language": "en-US", "text": text}
    for set_key, prompts in SETS.items():
        for name, text in prompts.items():
            yield {"id": f"{set_key}/{name}", "language": "en-US", "text": text}
    for name, text in JAPANESE.items():
        yield {"id": f"instructions/{name}", "language": "ja-JP", "text": text}


def synthesis_prompt(item):
    if item["language"] == "ja-JP":
        return f"""Read only the Japanese text below. Use one calm adult female test announcer. Speak clear standard Japanese at a steady, easy-to-follow pace. Do not add, omit, repeat, translate, paraphrase, explain, or read these instructions.\n\n{item['text']}"""
    if item["id"] == "common/no-2":
        return """Speak exactly these two English words, then stop completely. Do not say anything before or after them.\n\nPlease begin."""
    pause = "Pause naturally for about 0.6 seconds after the number announcement. " if item["id"].endswith(("/no-3", "/no-4")) else ""
    return f"""Read only the exact English text below as one calm adult female English examiner. Use clear natural American English for Japanese high school learners and keep one steady pace. {pause}Do not add, omit, repeat, paraphrase, explain, or read these instructions.\n\n{item['text']}"""


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def write_wav(path, pcm):
    if not pcm or len(pcm) % WIDTH:
        raise RuntimeError(f"Invalid 16-bit PCM for {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as target:
        target.setnchannels(CHANNELS)
        target.setsampwidth(WIDTH)
        target.setframerate(RATE)
        target.writeframes(pcm)
    with wave.open(str(path), "rb") as check:
        actual = (check.getframerate(), check.getnchannels(), check.getsampwidth())
        if actual != (RATE, CHANNELS, WIDTH):
            raise RuntimeError(f"WAV format mismatch for {path}: {actual}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", type=Path, default=Path("audio-generation"))
    parser.add_argument("--transcripts-only", action="store_true")
    args = parser.parse_args()
    release_dir = args.output_root / RELEASE
    staging = args.output_root / f".{RELEASE}.staging"
    item_list = list(items())
    if args.transcripts_only:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        print(json.dumps({"model": MODEL, "voice": VOICE, "items": item_list}, ensure_ascii=False, indent=2))
        return
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("GEMINI_API_KEY is not set; release generation stopped.")
    from google import genai

    if release_dir.exists() or staging.exists():
        raise SystemExit(f"Refusing to overwrite an existing release or staging directory: {release_dir}")
    staging.mkdir(parents=True)
    client = genai.Client(api_key=api_key)
    manifest_items = []
    try:
        for item in item_list:
            response = client.interactions.create(
                model=MODEL,
                input=synthesis_prompt(item),
                response_format={"type": "audio"},
                generation_config={"speech_config": [{"voice": VOICE}]},
                extra_headers={"Api-Revision": "2026-05-20"},
            )
            output = response.output_audio
            if not output or not output.data:
                raise RuntimeError(f"Gemini returned no audio for {item['id']}")
            pcm = base64.b64decode(output.data) if isinstance(output.data, str) else bytes(output.data)
            path = staging / f"{item['id']}.wav"
            write_wav(path, pcm)
            manifest_items.append({
                **item,
                "file": f"{item['id']}.wav",
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
            })
        manifest = {
            "release": RELEASE,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "model": MODEL,
            "voice": VOICE,
            "format": {"sampleRate": RATE, "channels": CHANNELS, "bitsPerSample": WIDTH * 8},
            "count": len(manifest_items),
            "items": manifest_items,
        }
        (staging / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        staging.rename(release_dir)
        print(f"Generated and verified {len(manifest_items)} files in {release_dir}")
    except Exception:
        shutil.rmtree(staging, ignore_errors=True)
        raise


if __name__ == "__main__":
    main()
