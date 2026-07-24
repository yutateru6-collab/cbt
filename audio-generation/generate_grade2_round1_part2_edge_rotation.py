from __future__ import annotations

import argparse
import html
import json
import re
import shutil
from pathlib import Path

import generate_elevenlabs_speechify_trial as audio


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-part2-edge-rotation-20260718"
PUBLISH_DIR = (
    ROOT / "audio-generation/cloudflare-publish/grade2-round1-part2-edge-rotation-20260718"
)
PILOT_SOURCE = ROOT / "audio-generation/grade2-sample-part2-pilot.json"
REST_SOURCE = ROOT / "audio-generation/grade2-sample-part2-rest.json"

AUDIO_REVISION = "edge-rotation-v1-20260718"
NUMBER_TO_BODY_MS = 1150
BODY_TO_QUESTION_MS = 1300
SENTENCE_BREAK_MS = 420
QUESTION_LABEL_TO_TEXT_MS = 350
EDGE_RATE = "+0%"
EDGE_VOLUME = "+0%"

VOICE_BLOCKS = [
    {
        "start": 16,
        "end": 20,
        "voice": {
            "id": "en-GB-RyanNeural",
            "name": "Ryan",
            "label": "Ryan (British male)",
            "display": "Ryan（英国男性）",
        },
    },
    {
        "start": 21,
        "end": 25,
        "voice": {
            "id": "en-CA-ClaraNeural",
            "name": "Clara",
            "label": "Clara (Canadian female)",
            "display": "Clara（カナダ女性）",
        },
    },
    {
        "start": 26,
        "end": 30,
        "voice": {
            "id": "en-US-EmmaMultilingualNeural",
            "name": "Emma",
            "label": "Emma (US female)",
            "display": "Emma（米国女性）",
            "englishOnly": True,
        },
    },
]

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
    },
    21: {
        "1:45": "one forty-five",
    },
    24: {
        "6:20": "six twenty",
        "Platform 7": "Platform Seven",
        "Platform 4": "Platform Four",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate Grade 2 Round 1 Part 2 with Microsoft Edge voices."
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument(
        "--numbers",
        default="16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
        help="Comma-separated Part 2 question numbers to generate.",
    )
    return parser.parse_args()


def parse_numbers(value: str) -> tuple[int, ...]:
    numbers = tuple(int(part.strip()) for part in value.split(",") if part.strip())
    if not numbers or len(numbers) != len(set(numbers)):
        raise RuntimeError("--numbers must contain unique question numbers")
    unknown = [number for number in numbers if number not in NUMBER_WORDS]
    if unknown:
        raise RuntimeError(f"Unsupported Part 2 question numbers: {unknown}")
    return numbers


def voice_for_number(number: int) -> dict:
    for block in VOICE_BLOCKS:
        if block["start"] <= number <= block["end"]:
            return block["voice"]
    raise RuntimeError(f"No Edge voice plan for No.{number}")


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
                "voice": voice_for_number(item["number"]),
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


def segment_rows(item: dict) -> list[dict]:
    voice = item["voice"]
    rows = [
        {
            "role": "number",
            "plainText": item["numberText"],
            "ttsText": f"Number {NUMBER_WORDS[item['number']]}.",
            "voice": voice,
            "gapAfterMs": NUMBER_TO_BODY_MS,
        }
    ]
    sentences = split_sentences(item["bodyText"])
    if len(sentences) < 2:
        raise RuntimeError(f"Part 2 body was not split into sentences for {item['id']}")
    for index, sentence in enumerate(sentences, start=1):
        rows.append(
            {
                "role": "bodySentence",
                "bodyIndex": index,
                "plainText": sentence,
                "ttsText": tts_safe_text(item, sentence),
                "voice": voice,
                "gapAfterMs": (
                    BODY_TO_QUESTION_MS if index == len(sentences) else SENTENCE_BREAK_MS
                ),
            }
        )
    rows.append(
        {
            "role": "questionLabel",
            "plainText": "Question.",
            "ttsText": "Question.",
            "voice": voice,
            "gapAfterMs": QUESTION_LABEL_TO_TEXT_MS,
        }
    )
    rows.append(
        {
            "role": "questionText",
            "plainText": item["questionText"],
            "ttsText": item["questionText"],
            "voice": voice,
            "gapAfterMs": 0,
        }
    )
    return rows


def raw_path(item: dict, segment: dict) -> Path:
    voice = segment["voice"]
    payload = {
        "provider": "edge",
        "voice": voice["id"],
        "rate": EDGE_RATE,
        "volume": EDGE_VOLUME,
        "role": segment["role"],
        "text": segment["ttsText"],
        "audioRevision": AUDIO_REVISION,
    }
    key = audio.cache_key(payload)
    safe_voice = re.sub(r"[^A-Za-z0-9_-]", "_", voice["name"])
    return OUTPUT_DIR / "_cache" / item["id"] / f"{safe_voice}-{segment['role']}-{key}.wav"


def validate_synthesis_inputs(items: list[dict]) -> None:
    for item in items:
        rows = segment_rows(item)
        if any(char.isdigit() for char in rows[0]["ttsText"]):
            raise RuntimeError(f"Question number contains digits for {item['id']}")
        body_rows = [row for row in rows if row["role"] == "bodySentence"]
        if len(body_rows) != 4:
            raise RuntimeError(f"Expected four body sentences for {item['id']}")
        for index, row in enumerate(body_rows):
            expected_gap = BODY_TO_QUESTION_MS if index == len(body_rows) - 1 else SENTENCE_BREAK_MS
            if row["gapAfterMs"] != expected_gap:
                raise RuntimeError(f"Incorrect body gap for {item['id']} sentence {index + 1}")
            if any(char.isdigit() for char in row["ttsText"]):
                raise RuntimeError(f"Unnormalized digit in {item['id']} sentence {index + 1}")
        if rows[-2]["role"] != "questionLabel" or rows[-2]["ttsText"] != "Question.":
            raise RuntimeError(f"Question label is unsafe for {item['id']}")
        if rows[-2]["gapAfterMs"] != QUESTION_LABEL_TO_TEXT_MS:
            raise RuntimeError(f"Question label gap is incorrect for {item['id']}")
        if len({row["voice"]["id"] for row in rows}) != 1:
            raise RuntimeError(f"Each Part 2 item must use one Edge voice only: {item['id']}")
        for row in rows:
            if row["voice"].get("englishOnly") and not row["ttsText"].isascii():
                raise RuntimeError(f"Non-ASCII text for English-only voice in {item['id']}")
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
            path = raw_path(item, segment)
            cached = audio.valid_wav(path)
            if not cached:
                missing_calls += 1
                missing_characters += len(segment["ttsText"])
            rows.append(
                {
                    "item": item["id"],
                    "role": segment["role"],
                    "voice": segment["voice"]["label"],
                    "ttsText": segment["ttsText"],
                    "inputCharacters": len(segment["ttsText"]),
                    "cached": cached,
                    "gapAfterMs": segment["gapAfterMs"],
                }
            )

    return {
        "items": [item["id"] for item in items],
        "missing": {"calls": missing_calls, "characters": missing_characters},
        "voices": [
            {
                "range": f"No.{block['start']}-No.{block['end']}",
                "voice": block["voice"]["id"],
                "display": block["voice"]["display"],
            }
            for block in VOICE_BLOCKS
        ],
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "sentenceBreakHardSilence": SENTENCE_BREAK_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionLabelToText": QUESTION_LABEL_TO_TEXT_MS,
        },
        "speedPolicy": {"master": 1.0, "reviewPageDefault": 0.87},
        "segments": rows,
    }


def write_page(items: list[dict]) -> None:
    cards = []
    for item in items:
        voice = item["voice"]
        cards.append(
            f"""
            <article>
              <h3>No.{item["number"]}</h3>
              <p>{html.escape(voice["display"])} / 問題番号・本文・Question・設問を同じ声で読み上げ</p>
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
  <title>第1回 Part 2 Edge音声チェック</title>
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
    <h1>第1回 Part 2 Edge音声チェック</h1>
    <p class="lead">No.16〜30をMicrosoft Edge TTSだけで作成した試聴版です。Ryan、Clara、Emmaを5問ずつ割り当て、各問題は一人の声で通して読みます。</p>
    <p class="notice">音声ファイル自体は自然速度のままです。ページ側の初期再生速度だけ0.87倍にし、ピッチを保ったまま0.90倍、1.00倍へ切り替えられます。</p>
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
      Edge rate +0%。問題番号は英単語読み。問題番号→本文 1150ms、文間 420ms、本文→Question 1300ms、Question→設問 350ms。WAV masterは24kHz/mono/16-bit、MP3試聴版は44.1kHz/128kbps。
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
    audio.OUTPUT_DIR = OUTPUT_DIR

    actual = {"calls": 0, "inputCharacters": 0}
    records = []
    outputs = []
    for item in items:
        rows = segment_rows(item)
        for segment in rows:
            path = raw_path(item, segment)
            if audio.valid_wav(path):
                continue
            audio.generate_edge_segment(segment["voice"]["id"], segment["ttsText"], path, ffmpeg)
            actual["calls"] += 1
            actual["inputCharacters"] += len(segment["ttsText"])
            records.append(
                {
                    "item": item["id"],
                    "role": segment["role"],
                    "voice": segment["voice"]["id"],
                    "inputCharacters": len(segment["ttsText"]),
                }
            )

        ordered = []
        segment_report = []
        for segment in rows:
            raw = raw_path(item, segment)
            processed = audio.trim_segment(ffmpeg, raw, f"{item['id']}-{segment['role']}")
            ordered.append((processed, segment["gapAfterMs"]))
            segment_report.append(
                {
                    "role": segment["role"],
                    "voice": segment["voice"],
                    "plainText": segment["plainText"],
                    "ttsText": segment["ttsText"],
                    "gapAfterMs": segment["gapAfterMs"],
                }
            )

        wav_destination = OUTPUT_DIR / "wav-master" / f"{item['id']}.wav"
        mp3_destination = OUTPUT_DIR / "audio" / f"{item['id']}.mp3"
        audio.combine_item(ffmpeg, ordered, wav_destination, mp3_destination)
        outputs.append(
            {
                "item": item["id"],
                "number": item["number"],
                "voice": item["voice"],
                "wav": str(wav_destination.relative_to(ROOT)),
                "mp3": str(mp3_destination.relative_to(ROOT)),
                "wavProbe": audio.probe_audio(ffprobe, wav_destination),
                "mp3Probe": audio.probe_audio(ffprobe, mp3_destination),
                "segments": segment_report,
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
    }
    (OUTPUT_DIR / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    prepare_publish_folder()
    return report


def main() -> None:
    args = parse_args()
    items = load_items(parse_numbers(args.numbers))
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
