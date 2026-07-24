from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import generate_elevenlabs_speechify_trial as audio


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-part2-edge-uncut-five-20260718"
PUBLISH_DIR = (
    ROOT / "audio-generation/cloudflare-publish/grade2-round1-part2-edge-uncut-five-20260718"
)
PILOT_SOURCE = ROOT / "audio-generation/grade2-sample-part2-pilot.json"
REST_SOURCE = ROOT / "audio-generation/grade2-sample-part2-rest.json"

AUDIO_REVISION = "edge-uncut-five-v1-20260718"
EDGE_RATE = "+0%"
EDGE_VOLUME = "+0%"
SAMPLE_RATE = 24000

VOICE_PLANS = {
    16: {
        "id": "en-GB-RyanNeural",
        "name": "Ryan",
        "display": "Ryan（英国男性）",
    },
    17: {
        "id": "en-CA-ClaraNeural",
        "name": "Clara",
        "display": "Clara（カナダ女性）",
    },
    18: {
        "id": "en-US-EmmaMultilingualNeural",
        "name": "Emma",
        "display": "Emma（米国女性）",
        "englishOnly": True,
    },
    19: {
        "id": "en-US-AvaMultilingualNeural",
        "name": "Ava",
        "display": "Ava（米国女性）",
        "englishOnly": True,
    },
    20: {
        "id": "en-US-MichelleNeural",
        "name": "Michelle",
        "display": "Michelle（米国女性）",
    },
}

NUMBER_WORDS = {
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
    19: "nineteen",
    20: "twenty",
}

TTS_REPLACEMENTS = {
    17: {
        "9 a.m.": "nine A M",
        "3 p.m.": "three P M",
    }
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate five uncut Grade 2 Round 1 Part 2 items with Edge voices."
    )
    parser.add_argument("--execute", action="store_true")
    return parser.parse_args()


def load_items() -> list[dict]:
    source_items = []
    for path in (PILOT_SOURCE, REST_SOURCE):
        data = json.loads(path.read_text(encoding="utf-8"))
        source_items.extend(data["items"])

    by_number = {int(item["number"]): item for item in source_items}
    selected = []
    for number in sorted(VOICE_PLANS):
        source = by_number.get(number)
        if not source or len(source.get("segments", [])) != 3:
            raise RuntimeError(f"Part 2 No.{number} source is invalid")
        number_segment, body_segment, question_segment = source["segments"]
        if number_segment["text"] != f"Number {number}.":
            raise RuntimeError(f"Unexpected number label in No.{number}")
        if not question_segment["text"].startswith("Question. "):
            raise RuntimeError(f"Unexpected question label in No.{number}")
        selected.append(
            {
                "id": f"No{number}",
                "number": number,
                "displayText": " ".join(
                    [
                        number_segment["text"],
                        body_segment["text"],
                        question_segment["text"],
                    ]
                ),
                "bodyText": body_segment["text"],
                "questionText": question_segment["text"][len("Question. ") :].strip(),
                "voice": VOICE_PLANS[number],
            }
        )
    return selected


def tts_safe_text(item: dict) -> str:
    number = item["number"]
    body = item["bodyText"]
    question = item["questionText"]
    for original, replacement in TTS_REPLACEMENTS.get(number, {}).items():
        body = body.replace(original, replacement)
        question = question.replace(original, replacement)
    return f"Number {NUMBER_WORDS[number]}. {body} Question. {question}"


def validate_items(items: list[dict]) -> None:
    if len(items) != 5:
        raise RuntimeError("This trial must contain exactly five Part 2 items")
    if len({item["voice"]["id"] for item in items}) != len(items):
        raise RuntimeError("Each item must use a different Edge voice")
    for item in items:
        text = tts_safe_text(item)
        if any(char.isdigit() for char in text):
            raise RuntimeError(f"Unnormalized digit in {item['id']}")
        if item["voice"].get("englishOnly") and not text.isascii():
            raise RuntimeError(f"Non-ASCII text for English-only voice in {item['id']}")


def raw_path(item: dict, text: str) -> Path:
    voice = item["voice"]
    payload = {
        "provider": "edge",
        "mode": "single-call-part2-full-item",
        "voice": voice["id"],
        "rate": EDGE_RATE,
        "volume": EDGE_VOLUME,
        "text": text,
        "audioRevision": AUDIO_REVISION,
    }
    key = audio.cache_key(payload)
    safe_voice = re.sub(r"[^A-Za-z0-9_-]", "_", voice["name"])
    return OUTPUT_DIR / "_cache" / f"{item['id']}-{safe_voice}-{key}.wav"


def preflight(items: list[dict]) -> dict:
    validate_items(items)
    rows = []
    missing_calls = 0
    missing_characters = 0
    for item in items:
        text = tts_safe_text(item)
        cached = audio.valid_wav(raw_path(item, text))
        if not cached:
            missing_calls += 1
            missing_characters += len(text)
        rows.append(
            {
                "item": item["id"],
                "number": item["number"],
                "voice": item["voice"]["display"],
                "edgeVoiceId": item["voice"]["id"],
                "mode": "one Edge TTS call for the whole question",
                "inputCharacters": len(text),
                "cached": cached,
                "ttsText": text,
            }
        )
    return {
        "items": [item["id"] for item in items],
        "missing": {"calls": missing_calls, "characters": missing_characters},
        "speedPolicy": {"master": 1.0, "reviewPageDefault": 0.87},
        "segmentPolicy": {
            "singleEdgeCallPerQuestion": True,
            "sentenceLevelSplit": False,
            "concatAfterSynthesis": False,
        },
        "itemsDetail": rows,
    }


def run_checked(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def normalize_whole_file(ffmpeg: str, source: Path, wav_destination: Path, mp3_destination: Path) -> None:
    wav_destination.parent.mkdir(parents=True, exist_ok=True)
    mp3_destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="edge-uncut-normalize-") as temporary_text:
        temporary = Path(temporary_text)
        normalized = temporary / "normalized.wav"
        run_checked(
            [
                ffmpeg,
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(source),
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


def write_page(items: list[dict]) -> None:
    cards = []
    for item in items:
        voice = item["voice"]
        cards.append(
            f"""
            <article>
              <h3>No.{item["number"]}</h3>
              <p>{html.escape(voice["display"])} / 1問まるごと1回のEdge TTS生成</p>
              <audio controls preload="metadata" src="audio/{html.escape(item["id"])}.mp3?v={AUDIO_REVISION}"></audio>
            </article>
            """
        )

    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>第1回 Part 2 Edge 5問・一括録音チェック</title>
  <style>
    :root {{
      color-scheme: light;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #17211c;
      background: #f3f1eb;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; }}
    main {{ width: min(760px, calc(100% - 24px)); margin: 0 auto; padding: 28px 0 56px; }}
    h1 {{ margin: 0 0 10px; font-size: clamp(24px, 6vw, 36px); line-height: 1.2; }}
    .lead, .notice {{ color: #526058; line-height: 1.75; }}
    .notice {{ padding: 12px 14px; border-radius: 12px; background: #e9f3ed; }}
    .speed-panel {{
      display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
      margin: 18px 0 20px; padding: 12px 14px;
      border: 1px solid #d9ddd8; border-radius: 14px; background: #fff;
    }}
    .speed-panel strong {{ margin-right: 4px; }}
    .speed-button {{
      padding: 8px 13px; border: 1px solid #aeb8b1; border-radius: 999px;
      color: #26362d; background: #fff; font: inherit; font-weight: 700; cursor: pointer;
    }}
    .speed-button[aria-pressed="true"] {{ border-color: #216a45; color: #fff; background: #216a45; }}
    .grid {{ display: grid; gap: 12px; }}
    article {{
      padding: 15px; border: 1px solid #d9ddd8; border-radius: 16px; background: #fff;
      box-shadow: 0 7px 22px rgba(31, 52, 41, .06);
    }}
    h3 {{ margin: 0 0 5px; font-size: 19px; }}
    article p {{ margin: 0 0 11px; color: #5d6861; font-size: 14px; line-height: 1.55; }}
    audio {{ display: block; width: 100%; min-width: 0; }}
    footer {{ margin-top: 28px; color: #6a746e; font-size: 13px; line-height: 1.7; }}
    @media (max-width: 560px) {{
      main {{ width: 100%; padding: 20px 5px 52px; }}
      article {{ padding: 12px 7px; border-radius: 12px; }}
      audio::-webkit-media-controls-mute-button,
      audio::-webkit-media-controls-volume-slider {{ display: none; }}
    }}
  </style>
</head>
<body>
  <main>
    <h1>第1回 Part 2 Edge 5問・一括録音チェック</h1>
    <p class="lead">No.16〜20を、各問1回のEdge TTS生成で作った試聴版です。本文を1文ずつ切らず、あとから文単位でつないでいません。</p>
    <p class="notice">音声本体は自然速度です。ページ側だけ0.87倍を初期値にし、ピッチを保ったまま0.90倍、1.00倍へ切り替えられます。</p>
    <div class="speed-panel" aria-label="再生速度">
      <strong>再生速度</strong>
      <button class="speed-button" type="button" data-rate="0.87" aria-pressed="true">0.87倍</button>
      <button class="speed-button" type="button" data-rate="0.90" aria-pressed="false">0.90倍</button>
      <button class="speed-button" type="button" data-rate="1.00" aria-pressed="false">1.00倍</button>
    </div>
    <section class="grid">
      {"".join(cards)}
    </section>
    <footer>
      Edge rate +0%。各問は「Number + 本文 + Question + 設問」を1つのTTS入力として生成。後処理は全体音量の正規化とMP3変換のみです。
    </footer>
  </main>
  <script>
    const audioElements = [...document.querySelectorAll("audio")];
    const speedButtons = [...document.querySelectorAll("[data-rate]")];
    let selectedRate = 0.87;

    function applyPlaybackRate(audio) {{
      audio.preservesPitch = true;
      audio.webkitPreservesPitch = true;
      audio.defaultPlaybackRate = selectedRate;
      audio.playbackRate = selectedRate;
    }}

    audioElements.forEach((audio) => {{
      applyPlaybackRate(audio);
      audio.addEventListener("loadedmetadata", () => applyPlaybackRate(audio));
      audio.addEventListener("play", () => applyPlaybackRate(audio));
    }});

    speedButtons.forEach((button) => {{
      button.addEventListener("click", () => {{
        selectedRate = Number(button.dataset.rate);
        speedButtons.forEach((candidate) => {{
          candidate.setAttribute("aria-pressed", String(candidate === button));
        }});
        audioElements.forEach((audio) => applyPlaybackRate(audio));
      }});
    }});
  </script>
</body>
</html>
"""
    (OUTPUT_DIR / "index.html").write_text(page, encoding="utf-8")


def write_headers() -> None:
    (OUTPUT_DIR / "_headers").write_text(
        """/*
  Cache-Control: no-cache, no-store, must-revalidate
  X-Robots-Tag: noindex, nofollow

/audio/*
  Cache-Control: public, max-age=31536000, immutable
  X-Robots-Tag: noindex, nofollow
""",
        encoding="utf-8",
    )


def prepare_publish_folder() -> None:
    PUBLISH_DIR.mkdir(parents=True, exist_ok=True)
    (PUBLISH_DIR / "audio").mkdir(parents=True, exist_ok=True)
    for name in ("index.html", "_headers", "generation-report.json"):
        shutil.copy2(OUTPUT_DIR / name, PUBLISH_DIR / name)
    for item_mp3 in (OUTPUT_DIR / "audio").glob("*.mp3"):
        shutil.copy2(item_mp3, PUBLISH_DIR / "audio" / item_mp3.name)


def execute(items: list[dict], preflight_data: dict) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("ffmpeg and ffprobe are required")
    if not shutil.which("edge-tts"):
        raise RuntimeError("edge-tts command was not found")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "audio").mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "wav-master").mkdir(parents=True, exist_ok=True)

    actual = {"calls": 0, "inputCharacters": 0}
    records = []
    outputs = []
    for item in items:
        text = tts_safe_text(item)
        raw = raw_path(item, text)
        if not audio.valid_wav(raw):
            audio.generate_edge_segment(item["voice"]["id"], text, raw, ffmpeg)
            actual["calls"] += 1
            actual["inputCharacters"] += len(text)
            records.append(
                {
                    "item": item["id"],
                    "voice": item["voice"]["id"],
                    "inputCharacters": len(text),
                }
            )

        wav_destination = OUTPUT_DIR / "wav-master" / f"{item['id']}.wav"
        mp3_destination = OUTPUT_DIR / "audio" / f"{item['id']}.mp3"
        normalize_whole_file(ffmpeg, raw, wav_destination, mp3_destination)
        outputs.append(
            {
                "item": item["id"],
                "number": item["number"],
                "voice": item["voice"],
                "ttsText": text,
                "displayText": item["displayText"],
                "wav": str(wav_destination.relative_to(ROOT)),
                "mp3": str(mp3_destination.relative_to(ROOT)),
                "wavProbe": probe_audio(ffprobe, wav_destination),
                "mp3Probe": probe_audio(ffprobe, mp3_destination),
            }
        )

    write_page(items)
    write_headers()
    report = {
        "sourceFiles": [
            str(PILOT_SOURCE.relative_to(ROOT)),
            str(REST_SOURCE.relative_to(ROOT)),
        ],
        "outputDirectory": str(OUTPUT_DIR.relative_to(ROOT)),
        "publishDirectory": str(PUBLISH_DIR.relative_to(ROOT)),
        "provider": "Microsoft Edge TTS",
        "audioRevision": AUDIO_REVISION,
        "preflight": preflight_data,
        "actualEdgeCalls": actual,
        "generationRecords": records,
        "outputs": outputs,
        "secretsIncluded": False,
        "segmentPolicy": {
            "singleEdgeCallPerQuestion": True,
            "sentenceLevelSplit": False,
            "concatAfterSynthesis": False,
            "postProcessing": "whole-file loudness normalization and MP3 conversion only",
        },
    }
    (OUTPUT_DIR / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    prepare_publish_folder()
    return report


def main() -> None:
    args = parse_args()
    items = load_items()
    preflight_data = preflight(items)
    print(json.dumps(preflight_data, ensure_ascii=False, indent=2))
    if not args.execute:
        print("Preflight only. No Edge TTS calls were made. Add --execute to generate audio.")
        return
    report = execute(items, preflight_data)
    print(
        json.dumps(
            {
                "actualEdgeCalls": report["actualEdgeCalls"],
                "index": str((OUTPUT_DIR / "index.html").relative_to(ROOT)),
                "publishDirectory": report["publishDirectory"],
                "outputs": len(report["outputs"]),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
