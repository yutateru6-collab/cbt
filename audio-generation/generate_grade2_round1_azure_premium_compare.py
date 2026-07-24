import argparse
import html
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

import generate_grade2_round1_part1 as source
import generate_grade2_round1_part1_azure_dialogue_comparison as azure
import generate_grade2_round1_part1_azure_favorite_cast as favorite


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-azure-premium-compare-20260718"
SET_KEY = "set-01"

PART1_NUMBERS = (1, 2)
PART2_NUMBERS = (16, 17)
NUMBER_WORDS = {1: "one", 2: "two", 16: "sixteen", 17: "seventeen"}

PART1_NUMBER_TO_BODY_MS = 1350
PART2_NUMBER_TO_BODY_MS = 1150
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1300
QUESTION_TO_TEXT_MS = 350

NARRATORS = {
    1: "en-GB-RyanNeural",
    2: "en-US-EmmaMultilingualNeural",
    16: "en-GB-RyanNeural",
    17: "en-US-EmmaMultilingualNeural",
}

SCENARIOS = (
    {
        "key": "standard-neural",
        "blindLabel": "B",
        "label": "通常Neural",
        "description": "現在の通常Neural／Multilingual品質の比較基準。",
        "part1Mode": "multi-voice",
        "voices": {
            "A": "en-US-AvaMultilingualNeural",
            "B": "en-US-AndrewMultilingualNeural",
        },
    },
    {
        "key": "dragon-hd",
        "blindLabel": "C",
        "label": "Dragon HD",
        "description": "Part 1は公式MultiTalker、Part 2は単独Dragon HD音声。",
        "part1Mode": "multitalker",
        "part1Voice": "en-US-MultiTalker-Ava-Andrew:DragonHDLatestNeural",
        "voices": {
            "A": "en-US-Ava:DragonHDLatestNeural",
            "B": "en-US-Andrew:DragonHDLatestNeural",
        },
    },
    {
        "key": "mai-voice-1",
        "blindLabel": "D",
        "label": "MAI-Voice-1",
        "description": "表現豊かな米国英語向けMAI-Voice-1。スタイル強制なし。",
        "part1Mode": "multi-voice",
        "voices": {
            "A": "en-US-Iris:MAI-Voice-1",
            "B": "en-US-Grant:MAI-Voice-1",
        },
    },
    {
        "key": "mai-voice-2",
        "blindLabel": "A",
        "label": "MAI-Voice-2",
        "description": "最新の多言語・長文・複数話者向けMAI-Voice-2。スタイル強制なし。",
        "part1Mode": "multi-voice",
        "voices": {
            "A": "en-US-Iris:MAI-Voice-2",
            "B": "en-US-Grant:MAI-Voice-2",
        },
    },
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="第1回Part 1・Part 2をAzureの4方式で1問1リクエスト比較します。"
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument(
        "--region",
        default=azure.env_value("AZURE_SPEECH_REGION", "SPEECH_REGION"),
    )
    return parser.parse_args()


def safe_text(number: int, text: str) -> str:
    return azure.safe_text(number, text)


def load_items() -> list[dict]:
    questions = source.load_source_questions(SOURCE_JS, SET_KEY)
    by_number = {int(question["id"]): question for question in questions}
    items = []
    for number in PART1_NUMBERS + PART2_NUMBERS:
        question = by_number[number]
        part = "part1" if question.get("part") == "Part 1" else "part2"
        item = {
            "id": f"No{number:02d}",
            "number": number,
            "part": part,
            "displayScript": str(question.get("script", "")).strip(),
            "questionText": str(question.get("questionText", "")).strip(),
            "narrator": NARRATORS[number],
        }
        if part == "part1":
            turns = source.parse_dialogue(item["displayScript"])
            if len(turns) != 4:
                raise RuntimeError(f"Part 1 No.{number} must have four turns")
            item["turns"] = turns
        else:
            item["body"] = item["displayScript"]
            item["bodySpeaker"] = "A" if number == 16 else "B"
        items.append(item)
    return items


def item_parts(item: dict) -> list[dict]:
    number_gap = (
        PART1_NUMBER_TO_BODY_MS if item["part"] == "part1" else PART2_NUMBER_TO_BODY_MS
    )
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "text": f"Number {NUMBER_WORDS[item['number']] }.",
            "gapAfterMs": number_gap,
        }
    ]
    if item["part"] == "part1":
        for index, turn in enumerate(item["turns"]):
            rows.append(
                {
                    "role": f"turn{index + 1}",
                    "speaker": turn["speaker"],
                    "text": safe_text(item["number"], turn["text"]),
                    "gapAfterMs": (
                        BODY_TO_QUESTION_MS
                        if index == len(item["turns"]) - 1
                        else TURN_GAP_MS
                    ),
                }
            )
    else:
        rows.append(
            {
                "role": "body",
                "speaker": item["bodySpeaker"],
                "text": safe_text(item["number"], item["body"]),
                "gapAfterMs": BODY_TO_QUESTION_MS,
            }
        )
    rows.extend(
        [
            {
                "role": "questionLabel",
                "speaker": "narrator",
                "text": "Question.",
                "gapAfterMs": QUESTION_TO_TEXT_MS,
            },
            {
                "role": "questionText",
                "speaker": "narrator",
                "text": safe_text(item["number"], item["questionText"]),
                "gapAfterMs": 0,
            },
        ]
    )
    return rows


def assert_safe_inputs(items: list[dict]) -> None:
    problems = []
    for item in items:
        for row in item_parts(item):
            if not row["text"].isascii():
                problems.append(f"{item['id']} {row['role']}: non-ASCII")
    if problems:
        raise RuntimeError("TTS preflight failed: " + "; ".join(problems))


def multi_voice_ssml(item: dict, scenario: dict) -> str:
    pieces = []
    for row in item_parts(item):
        voice_name = (
            item["narrator"]
            if row["speaker"] == "narrator"
            else scenario["voices"][row["speaker"]]
        )
        pieces.append(azure.voice_xml(voice_name, row["text"], row["gapAfterMs"]))
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">'
        + "".join(pieces)
        + "</speak>"
    )


def multitalker_ssml(item: dict, scenario: dict) -> str:
    rows = item_parts(item)
    number_row = rows[0]
    question_rows = rows[-2:]
    turns = rows[1:-2]
    dialog = []
    for row in turns:
        speaker = "ava" if row["speaker"] == "A" else "andrew"
        dialog.append(azure.turn_xml(speaker, row["text"], row["gapAfterMs"]))
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        'xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">'
        + azure.voice_xml(item["narrator"], number_row["text"], number_row["gapAfterMs"])
        + f'<voice name="{html.escape(scenario["part1Voice"], quote=True)}">'
        + "<mstts:dialog>"
        + "".join(dialog)
        + "</mstts:dialog></voice>"
        + "".join(
            azure.voice_xml(item["narrator"], row["text"], row["gapAfterMs"])
            for row in question_rows
        )
        + "</speak>"
    )


def scenario_ssml(item: dict, scenario: dict) -> str:
    if item["part"] == "part1" and scenario["part1Mode"] == "multitalker":
        return multitalker_ssml(item, scenario)
    return multi_voice_ssml(item, scenario)


def measure_loudness(path: Path) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return {"available": False, "reason": "ffmpeg not found"}
    command = [
        ffmpeg,
        "-hide_banner",
        "-nostats",
        "-i",
        str(path),
        "-af",
        "loudnorm=I=-20:TP=-1.5:LRA=11:print_format=summary",
        "-f",
        "null",
        "NUL" if sys.platform == "win32" else "/dev/null",
    ]
    completed = subprocess.run(command, capture_output=True, text=True)
    combined = completed.stdout + "\n" + completed.stderr
    integrated = re.search(r"Input Integrated:\s*([-+\d.]+) LUFS", combined)
    peak = re.search(r"Input True Peak:\s*([-+\d.]+) dBTP", combined)
    return {
        "available": completed.returncode == 0,
        "integratedLufs": float(integrated.group(1)) if integrated else None,
        "truePeakDbtp": float(peak.group(1)) if peak else None,
    }


def detect_silence(path: Path) -> list[dict]:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return []
    command = [
        ffmpeg,
        "-hide_banner",
        "-nostats",
        "-i",
        str(path),
        "-af",
        "silencedetect=noise=-42dB:d=0.25",
        "-f",
        "null",
        "NUL" if sys.platform == "win32" else "/dev/null",
    ]
    completed = subprocess.run(command, capture_output=True, text=True)
    combined = completed.stdout + "\n" + completed.stderr
    starts = [float(value) for value in re.findall(r"silence_start: ([\d.]+)", combined)]
    ends = [
        (float(end), float(duration))
        for end, duration in re.findall(
            r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", combined
        )
    ]
    intervals = []
    for index, (end, duration) in enumerate(ends):
        start = starts[index] if index < len(starts) else max(0.0, end - duration)
        intervals.append(
            {"start": round(start, 3), "end": round(end, 3), "duration": round(duration, 3)}
        )
    return intervals


def display_script(item: dict) -> str:
    if item["part"] == "part1":
        return "".join(
            f'<p><strong>{html.escape(row["speaker"])}</strong> {html.escape(row["text"])}</p>'
            for row in item["parts"]
            if row["speaker"] in {"A", "B"}
        )
    body = next(row["text"] for row in item["parts"] if row["role"] == "body")
    return f'<p>{html.escape(body)}</p>'


def write_page(output_dir: Path, report: dict) -> None:
    part_sections = []
    for part, title in (("part1", "Part 1 会話"), ("part2", "Part 2 ナレーション")):
        item_cards = []
        for item in [row for row in report["items"] if row["part"] == part]:
            players = []
            for output in sorted(item["outputs"], key=lambda row: row["blindLabel"]):
                if output.get("ok"):
                    audio_html = (
                        f'<audio controls preload="metadata" src="{html.escape(output["deliveryMp3"])}"></audio>'
                    )
                else:
                    audio_html = '<p class="pending">音声は未生成です。</p>'
                players.append(
                    f"""
                    <article class="player-card">
                      <div class="player-title">
                        <strong>音声 {html.escape(output['blindLabel'])}</strong>
                        <span class="model-name" hidden>{html.escape(output['label'])}</span>
                      </div>
                      {audio_html}
                      <p class="model-detail" hidden>{html.escape(output['description'])}</p>
                    </article>
                    """
                )
            item_cards.append(
                f"""
                <section class="question-card">
                  <h3>Number {item['number']}</h3>
                  <div class="players">{''.join(players)}</div>
                  <details><summary>原稿を見る</summary>{display_script(item)}<p><strong>Question</strong> {html.escape(item['questionText'])}</p></details>
                </section>
                """
            )
        part_sections.append(
            f'<section id="{part}" class="part-section"><h2>{title}</h2>{"".join(item_cards)}</section>'
        )

    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Azure高品質音声 4方式比較</title>
  <style>
    :root {{ font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#17211c; background:#f2efe8; }}
    * {{ box-sizing:border-box; }} body {{ margin:0; }}
    main {{ width:min(920px,calc(100% - 24px)); margin:auto; padding:28px 0 56px; }}
    h1 {{ margin:0 0 10px; font-size:clamp(26px,7vw,40px); line-height:1.2; }}
    .lead,.note {{ color:#566159; line-height:1.7; }}
    .toolbar {{ position:sticky; top:8px; z-index:5; display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding:12px; margin:18px 0 26px; background:rgba(255,255,255,.96); border:1px solid #d6dbd5; border-radius:16px; box-shadow:0 8px 26px rgba(32,48,39,.10); }}
    .toolbar strong {{ margin-right:auto; }}
    button,a.tab {{ appearance:none; border:1px solid #97a39c; border-radius:999px; background:#fff; color:#20352a; padding:9px 13px; font-weight:700; text-decoration:none; }}
    button.active {{ background:#176b47; color:#fff; border-color:#176b47; }}
    .part-section {{ scroll-margin-top:90px; margin-top:34px; }}
    h2 {{ font-size:26px; }}
    .question-card {{ margin:18px 0 28px; padding:18px; background:#fff; border:1px solid #d9ddd8; border-radius:18px; }}
    h3 {{ margin:0 0 14px; font-size:22px; }}
    .players {{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }}
    .player-card {{ padding:14px; border:1px solid #e0e4df; border-radius:14px; background:#fbfcfa; }}
    .player-title {{ display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:10px; }}
    .model-name {{ color:#176b47; font-weight:800; }}
    .model-detail {{ color:#5d6861; font-size:13px; line-height:1.55; margin:8px 0 0; }}
    audio {{ display:block; width:100%; }}
    details {{ margin-top:14px; border-top:1px solid #e2e5e1; padding-top:12px; }}
    summary {{ cursor:pointer; font-weight:750; }} details p {{ line-height:1.65; }} details strong {{ display:inline-block; min-width:28px; }}
    .pending {{ color:#9a3d2d; }}
    @media (max-width:680px) {{
      main {{ width:min(100% - 16px,920px); padding-top:20px; }}
      .players {{ grid-template-columns:1fr; }}
      .toolbar strong {{ width:100%; margin:0; }}
      .question-card {{ padding:14px; }}
    }}
  </style>
</head>
<body><main>
  <h1>Azure高品質音声<br>4方式比較</h1>
  <p class="lead">同じ問題を、通常Neural・Dragon HD・MAI-Voice-1・MAI-Voice-2で比較します。各音源は1問1リクエストで生成し、文・発話ごとの音源生成や後結合はしていません。</p>
  <div class="toolbar">
    <strong>再生速度</strong>
    <button type="button" data-rate="0.87" class="active">0.87</button>
    <button type="button" data-rate="0.90">0.90</button>
    <button type="button" data-rate="1.00">1.00</button>
    <button type="button" id="reveal-models">モデル名を表示</button>
    <a class="tab" href="#part1">Part 1</a><a class="tab" href="#part2">Part 2</a>
  </div>
  {''.join(part_sections)}
  <p class="note">等倍マスターは加工していません。0.87・0.90は試聴時だけ音程保持を指定して再生します。最初はA〜Dを先入観なしで聴き、あとからモデル名を表示できます。</p>
</main>
<script>
  let selectedRate = 0.87;
  const audios = [...document.querySelectorAll('audio')];
  const applyRate = audio => {{
    audio.playbackRate = selectedRate;
    audio.defaultPlaybackRate = selectedRate;
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
  }};
  audios.forEach(audio => {{
    applyRate(audio);
    ['loadedmetadata','canplay','play','playing'].forEach(name => audio.addEventListener(name, () => applyRate(audio)));
  }});
  document.querySelectorAll('[data-rate]').forEach(button => button.addEventListener('click', () => {{
    selectedRate = Number(button.dataset.rate);
    document.querySelectorAll('[data-rate]').forEach(other => other.classList.toggle('active', other === button));
    audios.forEach(applyRate);
  }}));
  const revealButton = document.querySelector('#reveal-models');
  let revealed = false;
  revealButton.addEventListener('click', () => {{
    revealed = !revealed;
    document.querySelectorAll('.model-name,.model-detail').forEach(node => node.hidden = !revealed);
    revealButton.textContent = revealed ? 'モデル名を隠す' : 'モデル名を表示';
  }});
</script>
</body></html>
"""
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "index.html").write_text(page, encoding="utf-8")
    (output_dir / "_headers").write_text(
        "/audio/*\n  Cache-Control: public, max-age=3600\n",
        encoding="utf-8",
    )


def scenario_record(item: dict, scenario: dict, output_dir: Path, execute: bool, endpoint: str, key: str) -> dict:
    track_id = f"{item['part']}-{item['id']}-{scenario['key']}"
    ssml = scenario_ssml(item, scenario)
    ssml_path = output_dir / "ssml" / f"{track_id}.ssml"
    raw_path = output_dir / "_raw" / f"{track_id}.mp3"
    master_path = output_dir / "master" / f"{track_id}.wav"
    delivery_path = output_dir / "audio" / f"{track_id}.mp3"
    ssml_path.parent.mkdir(parents=True, exist_ok=True)
    ssml_path.write_text(ssml + "\n", encoding="utf-8")
    record = {
        "key": scenario["key"],
        "blindLabel": scenario["blindLabel"],
        "label": scenario["label"],
        "description": scenario["description"],
        "oneAzureRequest": True,
        "sentenceLevelGeneration": False,
        "postSynthesisConcatenation": False,
        "styleForced": False,
        "rateForced": False,
        "ssml": ssml_path.relative_to(output_dir).as_posix(),
        "ok": False,
    }
    if not execute:
        record["ssmlCharacters"] = len(ssml)
        return record
    result = azure.synthesize_azure(endpoint, key, ssml, raw_path)
    record["azure"] = result
    if not result["ok"]:
        raise RuntimeError(
            f"Azure synthesis failed for {track_id}: "
            + str(result.get("detail") or result.get("reason"))
        )
    record["processing"] = favorite.create_master_and_delivery(raw_path, master_path, delivery_path)
    record["loudness"] = measure_loudness(master_path)
    record["silenceIntervals"] = detect_silence(master_path)
    record["masterWav"] = master_path.relative_to(output_dir).as_posix()
    record["deliveryMp3"] = delivery_path.relative_to(output_dir).as_posix()
    record["ok"] = True
    time.sleep(0.35)
    return record


def build_report(items: list[dict], output_dir: Path, region: str, execute: bool) -> dict:
    endpoint = azure.azure_endpoint(region) if execute else ""
    key = azure.azure_key() if execute else ""
    if execute and not key:
        raise RuntimeError("AZURE_SPEECH_KEY or SPEECH_KEY is not set")
    report_items = []
    for item in items:
        outputs = []
        for scenario in SCENARIOS:
            outputs.append(scenario_record(item, scenario, output_dir, execute, endpoint, key))
        report_items.append(
            {
                "id": item["id"],
                "number": item["number"],
                "part": item["part"],
                "narrator": item["narrator"],
                "displayScript": item["displayScript"],
                "questionText": item["questionText"],
                "parts": item_parts(item),
                "outputs": outputs,
            }
        )
    return {
        "mode": "completed" if execute else "preflight",
        "provider": "Azure Speech",
        "region": region,
        "sourceSet": SET_KEY,
        "naturalMasterRate": 1.0,
        "defaultReviewRate": 0.87,
        "reviewRates": [0.87, 0.9, 1.0],
        "preservesPitchRequested": True,
        "trackCount": len(report_items) * len(SCENARIOS),
        "apiRequestCount": len(report_items) * len(SCENARIOS) if execute else 0,
        "timingMs": {
            "part1NumberToBody": PART1_NUMBER_TO_BODY_MS,
            "part2NumberToBody": PART2_NUMBER_TO_BODY_MS,
            "part1TurnGap": TURN_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionToText": QUESTION_TO_TEXT_MS,
        },
        "items": report_items,
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    output_dir = args.output_dir.resolve()
    items = load_items()
    assert_safe_inputs(items)
    report = build_report(items, output_dir, args.region.strip(), args.execute)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_page(output_dir, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
