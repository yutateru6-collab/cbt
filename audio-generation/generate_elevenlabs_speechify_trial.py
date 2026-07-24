from __future__ import annotations

import argparse
import base64
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_MANIFEST = ROOT / "audio-generation/grade2-round1/part1/resolved-manifest.json"
OUTPUT_DIR = ROOT / "audio-generation/tts-finalists-trial-20260716"

ELEVEN_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"
SPEECHIFY_API_URL = "https://api.speechify.ai/v1/audio/speech"
SPEECHIFY_VERSION = "2026-07-07"

SAMPLE_RATE = 24000
NUMBER_TO_BODY_MS = 1150
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1100

# Fixed trial ceilings. They intentionally fit inside the key-level limits selected by the user.
MAX_ELEVEN_CHARACTERS = 1500
MAX_SPEECHIFY_CHARACTERS = 750
MAX_ELEVEN_CALLS = 16
MAX_SPEECHIFY_CALLS = 8

NARRATOR_VOICES = {
    1: "en-US-EmmaMultilingualNeural",
    2: "en-GB-RyanNeural",
}

VARIANTS = [
    {
        "blindLabel": "A",
        "slug": "eleven-v2",
        "provider": "elevenlabs",
        "model": "eleven_multilingual_v2",
        "displayName": "ElevenLabs Multilingual v2",
        "voices": {
            "A": {"id": "cgSgspJ2msm6clMCkdW9", "name": "Jessica", "gender": "female"},
            "B": {"id": "cjVigY5qzO86Huf0OWal", "name": "Eric", "gender": "male"},
        },
        "voiceSettings": {
            "stability": 0.65,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
            "speed": 1.0,
        },
    },
    {
        "blindLabel": "B",
        "slug": "eleven-v3",
        "provider": "elevenlabs",
        "model": "eleven_v3",
        "displayName": "ElevenLabs v3 Natural",
        "voices": {
            "A": {"id": "cgSgspJ2msm6clMCkdW9", "name": "Jessica", "gender": "female"},
            "B": {"id": "cjVigY5qzO86Huf0OWal", "name": "Eric", "gender": "male"},
        },
        "voiceSettings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
            "speed": 1.0,
        },
    },
    {
        "blindLabel": "C",
        "slug": "speechify-simba-3-2",
        "provider": "speechify",
        "model": "simba-3.2",
        "displayName": "SpeechifyAI Simba 3.2",
        "voices": {
            "A": {"id": "geffen_32", "name": "Geffen", "gender": "female"},
            "B": {"id": "dominic_32", "name": "Dominic", "gender": "male"},
        },
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Part 1 No.1・No.2をElevenLabsとSpeechifyAIで安全に比較生成します。"
    )
    parser.add_argument("--execute", action="store_true", help="実際にAPIとEdge TTSを実行する")
    return parser.parse_args()


def run_checked(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def parse_dialogue(script: str) -> list[dict[str, str]]:
    matches = list(re.finditer(r"(^|\s)([AB]):\s+", script))
    turns = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(script)
        turns.append({"speaker": match.group(2), "text": script[match.end() : end].strip()})
    return turns


def load_items() -> list[dict]:
    manifest = json.loads(SOURCE_MANIFEST.read_text(encoding="utf-8"))
    selected = []
    for item in manifest["items"]:
        if int(item["number"]) not in {1, 2}:
            continue
        turns = parse_dialogue(item["displayScript"])
        if len(turns) != 4:
            raise RuntimeError(f"{item['id']} must contain exactly four dialogue turns")
        if any(not turn["text"] for turn in turns):
            raise RuntimeError(f"{item['id']} contains an empty turn")
        selected.append(
            {
                "id": item["id"],
                "number": int(item["number"]),
                "turns": turns,
                "questionText": item["questionText"],
            }
        )
    if [item["number"] for item in selected] != [1, 2]:
        raise RuntimeError("The source manifest must contain Part 1 No.1 and No.2")
    return selected


def cache_key(value: dict) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()[:24]


def valid_wav(path: Path) -> bool:
    if not path.exists() or path.stat().st_size < 44:
        return False
    with path.open("rb") as handle:
        return handle.read(4) == b"RIFF"


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_bytes(data)
    temporary.replace(path)


def write_pcm_wav(path: Path, pcm: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp.wav")
    with wave.open(str(temporary), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm)
    temporary.replace(path)


def request_bytes(url: str, payload: dict, headers: dict[str, str]) -> tuple[bytes, dict]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            return response.read(), dict(response.headers.items())
    except urllib.error.HTTPError as error:
        body = error.read(2000).decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code}: {body}") from error


def eleven_raw_path(variant: dict, speaker: str, text: str) -> Path:
    voice = variant["voices"][speaker]
    key = cache_key(
        {
            "provider": "elevenlabs",
            "model": variant["model"],
            "voice": voice["id"],
            "voiceSettings": variant["voiceSettings"],
            "text": text,
            "outputFormat": "pcm_24000",
        }
    )
    return OUTPUT_DIR / "_cache" / variant["slug"] / f"{voice['name']}-{key}.wav"


def speechify_raw_path(variant: dict, speaker: str, text: str) -> Path:
    voice = variant["voices"][speaker]
    key = cache_key(
        {
            "provider": "speechify",
            "model": variant["model"],
            "voice": voice["id"],
            "text": text,
            "audioFormat": "wav",
            "language": "en-US",
        }
    )
    return OUTPUT_DIR / "_cache" / variant["slug"] / f"{voice['name']}-{key}.wav"


def edge_raw_path(voice: str, text: str) -> Path:
    key = cache_key({"provider": "edge", "voice": voice, "rate": "+0%", "text": text})
    safe_voice = re.sub(r"[^A-Za-z0-9_-]", "_", voice)
    return OUTPUT_DIR / "_cache" / "edge" / f"{safe_voice}-{key}.wav"


def preflight(items: list[dict]) -> dict:
    rows = []
    eleven_characters = 0
    speechify_characters = 0
    eleven_calls = 0
    speechify_calls = 0
    for variant in VARIANTS:
        for item in items:
            for turn in item["turns"]:
                if variant["provider"] == "elevenlabs":
                    path = eleven_raw_path(variant, turn["speaker"], turn["text"])
                    if not valid_wav(path):
                        eleven_characters += len(turn["text"])
                        eleven_calls += 1
                else:
                    path = speechify_raw_path(variant, turn["speaker"], turn["text"])
                    if not valid_wav(path):
                        speechify_characters += len(turn["text"])
                        speechify_calls += 1
        rows.append(
            {
                "label": variant["blindLabel"],
                "variant": variant["displayName"],
                "provider": variant["provider"],
                "model": variant["model"],
                "voices": variant["voices"],
            }
        )
    result = {
        "items": [item["id"] for item in items],
        "variants": rows,
        "elevenLabs": {
            "missingCalls": eleven_calls,
            "missingCharacters": eleven_characters,
            "maxCalls": MAX_ELEVEN_CALLS,
            "maxCharacters": MAX_ELEVEN_CHARACTERS,
        },
        "speechify": {
            "missingCalls": speechify_calls,
            "missingCharacters": speechify_characters,
            "maxCalls": MAX_SPEECHIFY_CALLS,
            "maxCharacters": MAX_SPEECHIFY_CHARACTERS,
        },
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "turnGap": TURN_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
        },
    }
    if eleven_calls > MAX_ELEVEN_CALLS or eleven_characters > MAX_ELEVEN_CHARACTERS:
        raise RuntimeError("ElevenLabs preflight exceeds the fixed trial ceiling")
    if speechify_calls > MAX_SPEECHIFY_CALLS or speechify_characters > MAX_SPEECHIFY_CHARACTERS:
        raise RuntimeError("Speechify preflight exceeds the fixed trial ceiling")
    return result


def generate_eleven_segment(
    api_key: str,
    variant: dict,
    speaker: str,
    text: str,
    destination: Path,
) -> dict:
    voice = variant["voices"][speaker]
    url = (
        f"{ELEVEN_API_URL}/{urllib.parse.quote(voice['id'])}"
        "?output_format=pcm_24000"
    )
    payload = {
        "text": text,
        "model_id": variant["model"],
        "voice_settings": variant["voiceSettings"],
    }
    audio, response_headers = request_bytes(
        url,
        payload,
        {
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/pcm",
        },
    )
    if audio[:4] == b"RIFF":
        atomic_write(destination, audio)
    else:
        write_pcm_wav(destination, audio)
    if not valid_wav(destination):
        raise RuntimeError("ElevenLabs did not return valid PCM audio")
    return {
        "provider": "elevenlabs",
        "model": variant["model"],
        "voice": voice,
        "characters": len(text),
        "requestId": response_headers.get("request-id") or response_headers.get("Request-Id"),
    }


def generate_speechify_segment(
    api_key: str,
    variant: dict,
    speaker: str,
    text: str,
    destination: Path,
) -> dict:
    voice = variant["voices"][speaker]
    idempotency_key = cache_key(
        {"provider": "speechify", "model": variant["model"], "voice": voice["id"], "text": text}
    )
    payload = {
        "input": text,
        "voice_id": voice["id"],
        "audio_format": "wav",
        "language": "en-US",
        "model": variant["model"],
    }
    body, response_headers = request_bytes(
        SPEECHIFY_API_URL,
        payload,
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Speechify-Version": SPEECHIFY_VERSION,
            "Idempotency-Key": idempotency_key,
        },
    )
    response = json.loads(body.decode("utf-8"))
    audio = base64.b64decode(response["audio_data"])
    atomic_write(destination, audio)
    if not valid_wav(destination):
        raise RuntimeError("Speechify did not return a valid WAV file")
    return {
        "provider": "speechify",
        "model": variant["model"],
        "voice": voice,
        "characters": len(text),
        "billableCharacters": response.get("billable_characters_count"),
        "requestId": response_headers.get("x-request-id") or response_headers.get("X-Request-ID"),
    }


def generate_edge_segment(voice: str, text: str, destination: Path, ffmpeg: str) -> None:
    executable = shutil.which("edge-tts")
    if not executable:
        raise RuntimeError("edge-tts command was not found")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="tts-trial-edge-") as temporary_text:
        temporary = Path(temporary_text)
        mp3 = temporary / "edge.mp3"
        wav_path = temporary / "edge.wav"
        subprocess.run(
            [
                executable,
                "--text",
                text,
                "--voice",
                voice,
                "--rate=+0%",
                "--volume=+0%",
                "--write-media",
                str(mp3),
            ],
            check=True,
        )
        run_checked(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(mp3),
                "-ar",
                str(SAMPLE_RATE),
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(wav_path),
            ]
        )
        shutil.copyfile(wav_path, destination)


def trimmed_path(source: Path, variant_slug: str) -> Path:
    key = cache_key({"source": str(source.resolve()), "size": source.stat().st_size, "trim": "-60dB-v1"})
    return OUTPUT_DIR / "_processed" / variant_slug / f"{source.stem}-{key}.wav"


def trim_segment(ffmpeg: str, source: Path, variant_slug: str) -> Path:
    destination = trimmed_path(source, variant_slug)
    if valid_wav(destination):
        return destination
    destination.parent.mkdir(parents=True, exist_ok=True)
    run_checked(
        [
            ffmpeg,
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(source),
            "-af",
            (
                "silenceremove="
                "start_periods=1:start_duration=0.02:start_threshold=-60dB:"
                "stop_periods=-1:stop_duration=0.05:stop_threshold=-60dB"
            ),
            "-ar",
            str(SAMPLE_RATE),
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            str(destination),
        ]
    )
    if not valid_wav(destination):
        raise RuntimeError(f"Silence trimming failed: {source}")
    return destination


def create_silence(ffmpeg: str, destination: Path, milliseconds: int) -> None:
    run_checked(
        [
            ffmpeg,
            "-y",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            f"anullsrc=r={SAMPLE_RATE}:cl=mono",
            "-t",
            f"{milliseconds / 1000.0:.3f}",
            "-c:a",
            "pcm_s16le",
            str(destination),
        ]
    )


def combine_item(
    ffmpeg: str,
    ordered_segments: list[tuple[Path, int]],
    wav_destination: Path,
    mp3_destination: Path,
) -> None:
    wav_destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="tts-trial-combine-") as temporary_text:
        temporary = Path(temporary_text)
        concat_entries = []
        silence_files: dict[int, Path] = {}
        for index, (segment, gap_after_ms) in enumerate(ordered_segments):
            concat_entries.append(segment)
            if index < len(ordered_segments) - 1 and gap_after_ms > 0:
                silence = silence_files.get(gap_after_ms)
                if silence is None:
                    silence = temporary / f"silence-{gap_after_ms}.wav"
                    create_silence(ffmpeg, silence, gap_after_ms)
                    silence_files[gap_after_ms] = silence
                concat_entries.append(silence)

        concat_file = temporary / "concat.txt"
        lines = []
        for path in concat_entries:
            escaped = str(path.resolve()).replace("'", "'\\''")
            lines.append(f"file '{escaped}'")
        concat_file.write_text("\n".join(lines) + "\n", encoding="utf-8")

        joined = temporary / "joined.wav"
        normalized = temporary / "normalized.wav"
        run_checked(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_file),
                "-ar",
                str(SAMPLE_RATE),
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(joined),
            ]
        )
        run_checked(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(joined),
                "-af",
                "loudnorm=I=-20:TP=-1.5:LRA=7",
                "-ar",
                str(SAMPLE_RATE),
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(normalized),
            ]
        )
        shutil.copyfile(normalized, wav_destination)
        run_checked(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(normalized),
                "-ar",
                "44100",
                "-ac",
                "1",
                "-c:a",
                "libmp3lame",
                "-b:a",
                "128k",
                str(mp3_destination),
            ]
        )


def probe_audio(ffprobe: str, path: Path) -> dict:
    completed = run_checked(
        [
            ffprobe,
            "-v",
            "error",
            "-select_streams",
            "a:0",
            "-show_entries",
            "stream=codec_name,sample_rate,channels,duration",
            "-of",
            "json",
            str(path),
        ]
    )
    streams = json.loads(completed.stdout).get("streams") or []
    return streams[0] if streams else {}


def write_comparison_page(items: list[dict]) -> None:
    cards = []
    for item in items:
        buttons = []
        for variant in VARIANTS:
            relative = f"{variant['slug']}/{item['id']}.mp3"
            buttons.append(
                f"""
                <article class="sample-card">
                  <span class="badge">比較 {html.escape(variant['blindLabel'])}</span>
                  <audio controls preload="metadata" src="{html.escape(relative)}"></audio>
                </article>
                """
            )
        cards.append(
            f"""
            <section class="question-block">
              <h2>{html.escape(item['id'])}</h2>
              <div class="samples">{''.join(buttons)}</div>
            </section>
            """
        )

    mapping_rows = "".join(
        f"<li><strong>{html.escape(variant['blindLabel'])}</strong>: "
        f"{html.escape(variant['displayName'])} — "
        f"{html.escape(variant['voices']['A']['name'])} × "
        f"{html.escape(variant['voices']['B']['name'])}</li>"
        for variant in VARIANTS
    )
    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SCBT Part 1 TTSブラインド比較</title>
  <style>
    :root {{ color-scheme: light; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }}
    *, *::before, *::after {{ box-sizing:border-box; }}
    html, body {{ max-width:100%; overflow-x:hidden; }}
    body {{ margin:0; background:#f4f1ea; color:#17211c; }}
    main {{ width:calc(100% - 24px); max-width:780px; margin:0 auto; padding:34px 0 56px; }}
    h1 {{ font-size:clamp(24px,6vw,38px); line-height:1.15; margin:0 0 12px; }}
    .lead {{ color:#546058; line-height:1.7; margin:0 0 28px; overflow-wrap:anywhere; }}
    .question-block {{ background:white; border:1px solid #d9ddd8; border-radius:18px; padding:20px; margin:18px 0; box-shadow:0 8px 26px rgba(31,52,41,.07); }}
    h2 {{ margin:0 0 14px; font-size:20px; }}
    .samples {{ display:grid; gap:12px; }}
    .sample-card {{ display:grid; grid-template-columns:88px 1fr; align-items:center; gap:12px; padding:12px; border-radius:13px; background:#f7f8f6; }}
    .badge {{ font-weight:750; color:#19583a; }}
    audio {{ display:block; width:100%; max-width:100%; min-width:0; }}
    details {{ margin-top:26px; background:#17211c; color:white; padding:18px 20px; border-radius:16px; }}
    summary {{ cursor:pointer; font-weight:750; }}
    li {{ margin:.65em 0; line-height:1.5; }}
    .meta {{ margin-top:24px; color:#6b746e; font-size:13px; line-height:1.6; }}
    @media(max-width:560px) {{
      main {{ width:100%; padding:20px 4px 56px; }}
      .question-block {{ padding:8px; border-radius:12px; }}
      .sample-card {{ grid-template-columns:minmax(0,1fr); padding:6px 0; }}
      .badge {{ padding:0 8px; }}
      audio::-webkit-media-controls-mute-button,
      audio::-webkit-media-controls-volume-slider {{ display:none; }}
    }}
  </style>
</head>
<body>
  <main>
    <h1>Part 1 TTSブラインド比較</h1>
    <p class="lead">先にA・B・Cを聞き、一番自然で聞きやすいものを選んでください。名前は最後に確認できます。</p>
    {''.join(cards)}
    <details>
      <summary>比較A・B・Cの正体を見る</summary>
      <ul>{mapping_rows}</ul>
    </details>
    <p class="meta">全バージョン共通: 速度1.0、問題番号→本文1150ms、発言間550ms、本文→Question 1100ms、-20 LUFS、MP3 44.1kHz/128kbps。</p>
  </main>
</body>
</html>
"""
    (OUTPUT_DIR / "index.html").write_text(page, encoding="utf-8")


def execute(items: list[dict], preflight_data: dict) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")

    eleven_api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    speechify_api_key = os.environ.get("SPEECHIFY_API_KEY", "").strip()
    if not eleven_api_key:
        raise RuntimeError("ELEVENLABS_API_KEY is not set")
    if not speechify_api_key:
        raise RuntimeError("SPEECHIFY_API_KEY is not set")

    generation_records = []
    api_calls = {"elevenlabs": 0, "speechify": 0}
    generated_characters = {"elevenlabs": 0, "speechify": 0}

    for variant in VARIANTS:
        for item in items:
            for turn in item["turns"]:
                if variant["provider"] == "elevenlabs":
                    raw = eleven_raw_path(variant, turn["speaker"], turn["text"])
                    if not valid_wav(raw):
                        if api_calls["elevenlabs"] >= MAX_ELEVEN_CALLS:
                            raise RuntimeError("ElevenLabs runtime call ceiling reached")
                        if generated_characters["elevenlabs"] + len(turn["text"]) > MAX_ELEVEN_CHARACTERS:
                            raise RuntimeError("ElevenLabs runtime character ceiling reached")
                        record = generate_eleven_segment(
                            eleven_api_key, variant, turn["speaker"], turn["text"], raw
                        )
                        api_calls["elevenlabs"] += 1
                        generated_characters["elevenlabs"] += len(turn["text"])
                        generation_records.append(record)
                else:
                    raw = speechify_raw_path(variant, turn["speaker"], turn["text"])
                    if not valid_wav(raw):
                        if api_calls["speechify"] >= MAX_SPEECHIFY_CALLS:
                            raise RuntimeError("Speechify runtime call ceiling reached")
                        if generated_characters["speechify"] + len(turn["text"]) > MAX_SPEECHIFY_CHARACTERS:
                            raise RuntimeError("Speechify runtime character ceiling reached")
                        record = generate_speechify_segment(
                            speechify_api_key, variant, turn["speaker"], turn["text"], raw
                        )
                        api_calls["speechify"] += 1
                        generated_characters["speechify"] += len(turn["text"])
                        generation_records.append(record)
                        # Free tier is limited to one sustained request per second.
                        time.sleep(1.05)

    outputs = []
    for item in items:
        narrator_voice = NARRATOR_VOICES[item["number"]]
        number_text = f"Number {item['number']}."
        question_text = f"Question. {item['questionText']}"
        number_raw = edge_raw_path(narrator_voice, number_text)
        question_raw = edge_raw_path(narrator_voice, question_text)
        if not valid_wav(number_raw):
            generate_edge_segment(narrator_voice, number_text, number_raw, ffmpeg)
        if not valid_wav(question_raw):
            generate_edge_segment(narrator_voice, question_text, question_raw, ffmpeg)
        number_processed = trim_segment(ffmpeg, number_raw, "edge")
        question_processed = trim_segment(ffmpeg, question_raw, "edge")

        for variant in VARIANTS:
            ordered = [(number_processed, NUMBER_TO_BODY_MS)]
            for index, turn in enumerate(item["turns"]):
                if variant["provider"] == "elevenlabs":
                    raw = eleven_raw_path(variant, turn["speaker"], turn["text"])
                else:
                    raw = speechify_raw_path(variant, turn["speaker"], turn["text"])
                processed = trim_segment(ffmpeg, raw, variant["slug"])
                gap = BODY_TO_QUESTION_MS if index == len(item["turns"]) - 1 else TURN_GAP_MS
                ordered.append((processed, gap))
            ordered.append((question_processed, 0))

            variant_dir = OUTPUT_DIR / variant["slug"]
            wav_destination = variant_dir / f"{item['id']}.wav"
            mp3_destination = variant_dir / f"{item['id']}.mp3"
            combine_item(ffmpeg, ordered, wav_destination, mp3_destination)
            outputs.append(
                {
                    "item": item["id"],
                    "blindLabel": variant["blindLabel"],
                    "variant": variant["displayName"],
                    "wav": str(wav_destination.relative_to(ROOT)),
                    "mp3": str(mp3_destination.relative_to(ROOT)),
                    "wavProbe": probe_audio(ffprobe, wav_destination),
                    "mp3Probe": probe_audio(ffprobe, mp3_destination),
                }
            )

    write_comparison_page(items)
    report = {
        "sourceManifest": str(SOURCE_MANIFEST.relative_to(ROOT)),
        "outputDirectory": str(OUTPUT_DIR.relative_to(ROOT)),
        "preflight": preflight_data,
        "actualApiCalls": api_calls,
        "actualGeneratedCharacters": generated_characters,
        "generationRecords": generation_records,
        "outputs": outputs,
        "secretsIncluded": False,
    }
    (OUTPUT_DIR / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return report


def main() -> None:
    args = parse_args()
    items = load_items()
    preflight_data = preflight(items)
    print(json.dumps(preflight_data, ensure_ascii=False, indent=2))
    if not args.execute:
        print("Preflight only. No API calls were made. Add --execute to generate audio.")
        return
    report = execute(items, preflight_data)
    print(json.dumps({
        "actualApiCalls": report["actualApiCalls"],
        "actualGeneratedCharacters": report["actualGeneratedCharacters"],
        "index": str((OUTPUT_DIR / "index.html").relative_to(ROOT)),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
