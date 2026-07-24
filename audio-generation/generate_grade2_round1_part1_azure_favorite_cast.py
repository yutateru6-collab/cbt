import argparse
import html
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

import generate_grade2_round1_part1_azure_dialogue_comparison as azure


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = (
    ROOT
    / "audio-generation/grade2-round1-part1-azure-favorite-cast-three-20260718"
)
TARGET_LUFS = -20

CAST = {
    1: {
        "A": "en-US-AvaMultilingualNeural",
        "B": "en-GB-RyanNeural",
        "narrator": "en-US-EmmaMultilingualNeural",
        "label": "Ava + Ryan / 案内 Emma",
    },
    2: {
        "A": "en-US-EmmaMultilingualNeural",
        "B": "en-GB-RyanNeural",
        "narrator": "en-CA-ClaraNeural",
        "label": "Emma + Ryan / 案内 Clara",
    },
    3: {
        "A": "en-CA-ClaraNeural",
        "B": "en-GB-RyanNeural",
        "narrator": "en-US-AvaMultilingualNeural",
        "label": "Clara + Ryan / 案内 Ava",
    },
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="第1回 Part 1の1〜3番を、採用済みAzure音声で1問1リクエスト生成します。"
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument(
        "--region",
        default=azure.env_value("AZURE_SPEECH_REGION", "SPEECH_REGION"),
    )
    return parser.parse_args()


def assert_safe_tts_text(items: list[dict]) -> None:
    problems = []
    for item in items:
        for row in azure.item_parts(item):
            text = row["text"]
            if not text.isascii():
                problems.append(f"{item['id']} {row['role']}: non-ASCII text")
    if problems:
        raise RuntimeError("TTS preflight failed: " + "; ".join(problems))


def build_ssml(item: dict, voices: dict) -> str:
    pieces = []
    for row in azure.item_parts(item):
        speaker = row["speaker"] if row["speaker"] in {"A", "B"} else "narrator"
        pieces.append(
            azure.voice_xml(voices[speaker], row["text"], row["gapAfterMs"])
        )
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        'xml:lang="en-US">'
        + "".join(pieces)
        + "</speak>"
    )


def create_master_and_delivery(raw_mp3: Path, master_wav: Path, delivery_mp3: Path) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg was not found")
    master_wav.parent.mkdir(parents=True, exist_ok=True)
    delivery_mp3.parent.mkdir(parents=True, exist_ok=True)

    master_command = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(raw_mp3),
        "-af",
        f"loudnorm=I={TARGET_LUFS}:TP=-1.5:LRA=11",
        "-ar",
        "24000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        str(master_wav),
    ]
    completed = subprocess.run(master_command, capture_output=True, text=True)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "WAV master conversion failed")

    delivery_command = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(master_wav),
        "-c:a",
        "libmp3lame",
        "-b:a",
        "128k",
        str(delivery_mp3),
    ]
    completed = subprocess.run(delivery_command, capture_output=True, text=True)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "MP3 delivery conversion failed")

    return {
        "targetLufs": TARGET_LUFS,
        "truePeakLimitDb": -1.5,
        "master": azure.probe_audio(master_wav),
        "delivery": azure.probe_audio(delivery_mp3),
    }


def script_rows(item: dict) -> str:
    labels = {"A": "A", "B": "B", "narrator": "案内"}
    return "".join(
        f'<p><strong>{labels.get(row["speaker"], row["speaker"])}</strong> '
        f'{html.escape(row["text"])}</p>'
        for row in item["parts"]
    )


def write_page(output_dir: Path, report: dict) -> None:
    cards = []
    for item in report["items"]:
        audio = (
            f'<audio controls preload="metadata" src="{html.escape(item["deliveryMp3"])}"></audio>'
            if item.get("ok")
            else '<p class="error">音声はまだ生成されていません。</p>'
        )
        cards.append(
            f"""
            <section class="card">
              <div class="card-head"><h2>Number {item['number']}</h2><span>{html.escape(item['castLabel'])}</span></div>
              {audio}
              <details><summary>読み上げ原稿を見る</summary>{script_rows(item)}</details>
            </section>
            """
        )

    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>第1回 Part 1 採用キャラ3問</title>
  <style>
    :root {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #17211c; background: #f3f0e8; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; }}
    main {{ width: min(760px, calc(100% - 24px)); margin: 0 auto; padding: 28px 0 52px; }}
    h1 {{ font-size: clamp(24px, 7vw, 36px); line-height: 1.25; margin: 0 0 10px; }}
    .lead {{ color: #556159; line-height: 1.7; margin-bottom: 22px; }}
    .speed-panel {{ position: sticky; top: 8px; z-index: 2; display: flex; gap: 8px; align-items: center; padding: 12px; border: 1px solid #d5dad4; border-radius: 14px; background: rgba(255,255,255,.95); box-shadow: 0 6px 22px rgba(29,48,38,.08); }}
    .speed-panel strong {{ margin-right: auto; }}
    button {{ border: 1px solid #9aa79f; border-radius: 999px; background: #fff; color: #25352c; font-weight: 700; padding: 8px 12px; }}
    button.active {{ color: #fff; background: #176b47; border-color: #176b47; }}
    .card {{ margin-top: 18px; padding: 18px; background: #fff; border: 1px solid #d9ddd8; border-radius: 18px; }}
    .card-head {{ display: flex; gap: 10px; align-items: baseline; justify-content: space-between; flex-wrap: wrap; }}
    h2 {{ margin: 0 0 12px; font-size: 22px; }}
    .card-head span {{ color: #59675f; font-size: 14px; }}
    audio {{ width: 100%; display: block; margin: 8px 0 14px; }}
    details {{ border-top: 1px solid #e4e6e3; padding-top: 12px; }}
    summary {{ cursor: pointer; font-weight: 700; }}
    details p {{ line-height: 1.65; margin: 10px 0; }}
    details strong {{ display: inline-block; min-width: 42px; }}
    .note {{ margin-top: 24px; color: #5b675f; font-size: 14px; line-height: 1.7; }}
    .error {{ color: #a83d2c; }}
  </style>
</head>
<body><main>
  <h1>第1回 Part 1<br>採用キャラ3問</h1>
  <p class="lead">Ryan・Clara・Emma・Avaを使用。各問題はAzureへ1回だけ送信し、会話を1文ずつ生成して後から接続していません。音声マスターは自然な等倍です。</p>
  <div class="speed-panel" aria-label="再生速度">
    <strong>再生速度</strong>
    <button type="button" data-rate="0.87" class="active">0.87</button>
    <button type="button" data-rate="0.90">0.90</button>
    <button type="button" data-rate="1.00">1.00</button>
  </div>
  {''.join(cards)}
  <p class="note">間隔：Number後 1.35秒／話者交代 0.55秒／会話後 1.30秒／Question後 0.35秒。速度変更時は音程を保ちます。</p>
</main>
<script>
  let selectedRate = 0.87;
  const applyRate = (audio) => {{
    audio.playbackRate = selectedRate;
    audio.defaultPlaybackRate = selectedRate;
    audio.preservesPitch = true;
    audio.webkitPreservesPitch = true;
  }};
  const audios = [...document.querySelectorAll('audio')];
  audios.forEach((audio) => {{
    applyRate(audio);
    ['loadedmetadata', 'canplay', 'play', 'playing'].forEach((eventName) =>
      audio.addEventListener(eventName, () => applyRate(audio))
    );
  }});
  document.querySelectorAll('[data-rate]').forEach((button) => {{
    button.addEventListener('click', () => {{
      selectedRate = Number(button.dataset.rate);
      document.querySelectorAll('[data-rate]').forEach((other) => other.classList.toggle('active', other === button));
      audios.forEach(applyRate);
    }});
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


def build_report(items: list[dict], output_dir: Path, region: str, execute: bool) -> dict:
    endpoint = azure.azure_endpoint(region) if execute else ""
    key = azure.azure_key() if execute else ""
    if execute and not key:
        raise RuntimeError("AZURE_SPEECH_KEY or SPEECH_KEY is not set")

    report_items = []
    for item in items:
        voices = CAST[item["number"]]
        ssml = build_ssml(item, voices)
        item_id = item["id"]
        ssml_path = output_dir / "ssml" / f"{item_id}.ssml"
        raw_path = output_dir / "_raw" / f"{item_id}.mp3"
        master_path = output_dir / "master" / f"{item_id}.wav"
        delivery_path = output_dir / "audio" / f"{item_id}.mp3"
        ssml_path.parent.mkdir(parents=True, exist_ok=True)
        ssml_path.write_text(ssml + "\n", encoding="utf-8")

        record = {
            "id": item_id,
            "number": item["number"],
            "castLabel": voices["label"],
            "voices": {key: voices[key] for key in ("A", "B", "narrator")},
            "oneAzureRequest": True,
            "sentenceLevelGeneration": False,
            "postSynthesisConcatenation": False,
            "ssml": ssml_path.relative_to(output_dir).as_posix(),
            "parts": azure.item_parts(item),
            "ok": False,
        }
        if execute:
            result = azure.synthesize_azure(endpoint, key, ssml, raw_path)
            record["azure"] = result
            if not result["ok"]:
                report_items.append(record)
                raise RuntimeError(
                    f"Azure synthesis failed for {item_id}: "
                    + str(result.get("detail") or result.get("reason"))
                )
            record["processing"] = create_master_and_delivery(
                raw_path, master_path, delivery_path
            )
            record["masterWav"] = master_path.relative_to(output_dir).as_posix()
            record["deliveryMp3"] = delivery_path.relative_to(output_dir).as_posix()
            record["ok"] = True
            time.sleep(0.4)
        report_items.append(record)

    return {
        "mode": "completed" if execute else "preflight",
        "provider": "Azure Speech multi-voice SSML",
        "isOfficialMultiTalkerModel": False,
        "reason": "採用済みのRyan・Clara・Emma・Avaを自由に組み合わせるため",
        "region": region,
        "naturalMasterRate": 1.0,
        "reviewRates": [0.87, 0.9, 1.0],
        "defaultReviewRate": 0.87,
        "preservesPitch": True,
        "timingMs": {
            "numberToBody": azure.NUMBER_TO_BODY_MS,
            "turnGap": azure.TURN_GAP_MS,
            "bodyToQuestion": azure.BODY_TO_QUESTION_MS,
            "questionLabelToText": azure.QUESTION_LABEL_TO_TEXT_MS,
        },
        "items": report_items,
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    output_dir = args.output_dir.resolve()
    items = azure.load_items((1, 2, 3))
    assert_safe_tts_text(items)
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
