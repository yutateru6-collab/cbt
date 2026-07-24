import argparse
import html
import http.client
import json
import shutil
import subprocess
import sys
import time
import urllib.error
from pathlib import Path

import generate_grade2_round1_part1 as source
import generate_grade2_round1_part1_azure_dialogue_comparison as azure
import generate_grade2_round1_part1_azure_favorite_cast as favorite
import generate_grade2_round1_azure_premium_compare as premium


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
OUTPUT_DIR = (
    ROOT
    / "audio-generation/grade2-round1-dragon-hd-omni-slow-clear-three-20260719"
)
SET_KEY = "set-01"

PART1_NUMBERS = (1, 2, 3)
PART2_NUMBERS = (16, 17, 18)
NUMBER_WORDS = {
    1: "one",
    2: "two",
    3: "three",
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
}

AVA = "en-us-ava:DragonHDOmniLatestNeural"
ANDREW = "en-US-Andrew:DragonHDOmniLatestNeural"
EMMA = "en-us-emma:DragonHDOmniLatestNeural"

PART1_VOICES = {"A": AVA, "B": ANDREW, "narrator": EMMA}
PART2_VOICES = {
    16: {"body": AVA, "narrator": ANDREW},
    17: {"body": ANDREW, "narrator": EMMA},
    18: {"body": EMMA, "narrator": ANDREW},
}

# Dragon HD Omni supports natural-language style descriptions in mstts:express-as.
# cfg_scale=1.1 is kept on the slower/neutral side of Microsoft's documented range.
VOICE_PARAMETERS = (
    "temperature=0.6;top_p=0.6;top_k=15;cfg_scale=1.1;"
    "enhancePronunciation=true"
)

NUMBER_PROMPT = (
    "Speak slowly, clearly, and carefully as a neutral English listening "
    "examination narrator. Use precise pronunciation and an unhurried but "
    "natural pace. After the number, leave a short pause before the next speaker. "
    "Do not separate individual words or sound robotic."
)

DIALOGUE_PROMPT = (
    "Speak slowly, clearly, and carefully for an English listening examination. "
    "Use precise pronunciation and an unhurried but natural pace. Keep the "
    "conversation responsive and human, with a brief natural pause after each "
    "turn. Do not separate individual words, sound robotic, or overemphasize "
    "information that could reveal the answer."
)

PASSAGE_PROMPT = (
    "Read this passage slowly, clearly, and carefully for an English listening "
    "examination. Use precise pronunciation, an unhurried natural rhythm, and "
    "brief natural pauses at sentence boundaries. Keep the tone calm and neutral. "
    "Do not separate individual words, sound dramatic, or emphasize information "
    "that could reveal the answer."
)

QUESTION_PROMPT = (
    "Speak slowly, clearly, and carefully as a neutral English listening "
    "examination narrator. Say Question, pause briefly, and then read the final "
    "question with precise pronunciation. Do not emphasize any possible answer clue."
)


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Grade 2 Round 1 Part 1 and Part 2: generate three questions each "
            "with prompted Dragon HD Omni voices in one Azure request per question."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument(
        "--reuse-raw",
        action="store_true",
        help="Reuse the six existing raw Azure MP3 files without another API call.",
    )
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
        }
        if part == "part1":
            turns = source.parse_dialogue(item["displayScript"])
            if len(turns) != 4:
                raise RuntimeError(f"Part 1 No.{number} must have four turns")
            item["turns"] = turns
            item["voices"] = PART1_VOICES
        else:
            item["body"] = item["displayScript"]
            item["voices"] = PART2_VOICES[number]
        items.append(item)
    return items


def item_parts(item: dict) -> list[dict]:
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "text": f"Number {NUMBER_WORDS[item['number']] }.",
            "prompt": NUMBER_PROMPT,
        }
    ]
    if item["part"] == "part1":
        rows.extend(
            {
                "role": f"turn{index + 1}",
                "speaker": turn["speaker"],
                "text": safe_text(item["number"], turn["text"]),
                "prompt": DIALOGUE_PROMPT,
            }
            for index, turn in enumerate(item["turns"])
        )
    else:
        rows.append(
            {
                "role": "body",
                "speaker": "body",
                "text": safe_text(item["number"], item["body"]),
                "prompt": PASSAGE_PROMPT,
            }
        )
    rows.extend(
        [
            {
                "role": "questionLabel",
                "speaker": "narrator",
                "text": "Question.",
                "prompt": QUESTION_PROMPT,
            },
            {
                "role": "questionText",
                "speaker": "narrator",
                "text": safe_text(item["number"], item["questionText"]),
                "prompt": QUESTION_PROMPT,
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


def xml_text(text: str) -> str:
    return html.escape(text, quote=False)


def prompted_voice_xml(
    voice_name: str,
    prompt: str,
    content: str,
    *,
    block: str = "sentence",
) -> str:
    if block == "paragraph":
        marked_content = f"<p>{xml_text(content)}</p>"
    else:
        marked_content = f"<s>{xml_text(content)}</s>"
    return (
        f'<voice name="{html.escape(voice_name, quote=True)}" '
        f'parameters="{html.escape(VOICE_PARAMETERS, quote=True)}">'
        f'<mstts:express-as style="{html.escape(prompt, quote=True)}">'
        f"{marked_content}</mstts:express-as></voice>"
    )


def prompted_question_xml(voice_name: str, question_text: str) -> str:
    return (
        f'<voice name="{html.escape(voice_name, quote=True)}" '
        f'parameters="{html.escape(VOICE_PARAMETERS, quote=True)}">'
        f'<mstts:express-as style="{html.escape(QUESTION_PROMPT, quote=True)}">'
        f"<p><s>Question.</s><s>{xml_text(question_text)}</s></p>"
        "</mstts:express-as></voice>"
    )


def item_ssml(item: dict) -> str:
    voices = item["voices"]
    pieces = [
        prompted_voice_xml(
            voices["narrator"],
            NUMBER_PROMPT,
            f"Number {NUMBER_WORDS[item['number']] }.",
            block="paragraph",
        )
    ]
    if item["part"] == "part1":
        for turn in item["turns"]:
            pieces.append(
                prompted_voice_xml(
                    voices[turn["speaker"]],
                    DIALOGUE_PROMPT,
                    safe_text(item["number"], turn["text"]),
                )
            )
    else:
        pieces.append(
            prompted_voice_xml(
                voices["body"],
                PASSAGE_PROMPT,
                safe_text(item["number"], item["body"]),
                block="paragraph",
            )
        )
    pieces.append(
        prompted_question_xml(
            voices["narrator"],
            safe_text(item["number"], item["questionText"]),
        )
    )
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        'xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">'
        + "".join(pieces)
        + "</speak>"
    )


def display_script(item: dict) -> str:
    if item["part"] == "part1":
        return "".join(
            f'<p><strong>{html.escape(row["speaker"])}</strong> '
            f'{html.escape(row["text"])}</p>'
            for row in item["parts"]
            if row["speaker"] in {"A", "B"}
        )
    body = next(row["text"] for row in item["parts"] if row["role"] == "body")
    return f'<p>{html.escape(body)}</p>'


def voice_label(item: dict) -> str:
    if item["part"] == "part1":
        return "Ava × Andrew／試験ナレーター Emma"

    def display_name(voice_name: str) -> str:
        lowered = voice_name.lower()
        for candidate in ("Ava", "Andrew", "Emma"):
            if candidate.lower() in lowered:
                return candidate
        return voice_name.split(":", 1)[0].split("-")[-1]

    body = display_name(item["voices"]["body"])
    narrator = display_name(item["voices"]["narrator"])
    return f"本文 {body}／試験ナレーター {narrator}"


def write_page(output_dir: Path, report: dict) -> None:
    sections = []
    for part, title in (("part1", "Part 1 会話"), ("part2", "Part 2 ナレーション")):
        cards = []
        for item in [row for row in report["items"] if row["part"] == part]:
            audio_html = (
                f'<audio controls preload="metadata" src="{html.escape(item["deliveryMp3"])}"></audio>'
                if item.get("ok")
                else '<p class="pending">音声は未生成です。</p>'
            )
            cards.append(
                f"""
                <section class="question-card">
                  <div class="question-head"><h3>Number {item['number']}</h3><span>{html.escape(item['voiceLabel'])}</span></div>
                  {audio_html}
                  <details><summary>原稿を見る</summary>{display_script(item)}<p><strong>Question</strong> {html.escape(item['questionText'])}</p></details>
                </section>
                """
            )
        sections.append(
            f'<section id="{part}" class="part-section"><h2>{title}</h2>{"".join(cards)}</section>'
        )

    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Dragon HD Omni ゆっくり明瞭読み</title>
  <style>
    :root {{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#16231c; background:#f2efe8; }}
    * {{ box-sizing:border-box; }} body {{ margin:0; }}
    main {{ width:min(820px,calc(100% - 24px)); margin:auto; padding:28px 0 56px; }}
    h1 {{ margin:0 0 10px; font-size:clamp(27px,7vw,42px); line-height:1.16; }}
    .lead,.note {{ color:#536159; line-height:1.75; }}
    .prompt-box {{ margin:18px 0; padding:14px 16px; background:#e8f1ec; border:1px solid #bfd3c7; border-radius:14px; }}
    .prompt-box strong {{ display:block; margin-bottom:5px; }} .prompt-box code {{ white-space:normal; line-height:1.55; }}
    .toolbar {{ position:sticky; top:8px; z-index:5; display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding:12px; margin:20px 0 28px; background:rgba(255,255,255,.96); border:1px solid #d6dbd5; border-radius:16px; box-shadow:0 8px 26px rgba(32,48,39,.10); }}
    .toolbar strong {{ margin-right:auto; }}
    button,a.tab {{ appearance:none; border:1px solid #97a39c; border-radius:999px; background:#fff; color:#20352a; padding:9px 13px; font-weight:700; text-decoration:none; }}
    button.active {{ background:#176b47; color:#fff; border-color:#176b47; }}
    .part-section {{ scroll-margin-top:90px; margin-top:36px; }} h2 {{ font-size:26px; }}
    .question-card {{ margin:18px 0 24px; padding:18px; background:#fff; border:1px solid #d9ddd8; border-radius:18px; }}
    .question-head {{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:14px; }}
    h3 {{ margin:0; font-size:23px; }} .question-head span {{ color:#176b47; font-weight:750; font-size:14px; }}
    audio {{ display:block; width:100%; }}
    details {{ margin-top:15px; border-top:1px solid #e2e5e1; padding-top:12px; }}
    summary {{ cursor:pointer; font-weight:750; }} details p {{ line-height:1.65; }} details strong {{ display:inline-block; min-width:28px; }}
    .pending {{ color:#9a3d2d; }}
    @media (max-width:680px) {{
      main {{ width:min(100% - 16px,820px); padding-top:20px; }}
      .toolbar strong {{ width:100%; margin:0; }} .question-card {{ padding:14px; }}
    }}
  </style>
</head>
<body><main>
  <h1>Dragon HD Omni<br>ゆっくり・明瞭・丁寧</h1>
  <p class="lead">Part 1を3問、Part 2を3問作りました。各問題は最初から最後までAzureへの1回のリクエストで生成し、文・発話ごとの音源生成や後結合はしていません。</p>
  <div class="prompt-box"><strong>読み方プロンプトの中心文</strong><code>Speak slowly, clearly, and carefully for an English listening examination. Use precise pronunciation and an unhurried but natural pace.</code></div>
  <div class="toolbar">
    <strong>再生速度</strong>
    <button type="button" data-rate="0.87">0.87</button>
    <button type="button" data-rate="0.90">0.90</button>
    <button type="button" data-rate="1.00" class="active">1.00</button>
    <a class="tab" href="#part1">Part 1</a><a class="tab" href="#part2">Part 2</a>
  </div>
  {''.join(sections)}
  <p class="note">今回はプロンプト自体による読み方を確認するため、初期再生速度は1.00です。0.87・0.90へ切り替える場合も音程保持を指定します。</p>
</main>
<script>
  let selectedRate = 1.0;
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
</script>
</body></html>
"""
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "index.html").write_text(page, encoding="utf-8")
    (output_dir / "_headers").write_text(
        "/audio/*\n  Cache-Control: public, max-age=3600\n",
        encoding="utf-8",
    )


def synthesize_with_retry(
    endpoint: str,
    key: str,
    ssml: str,
    destination: Path,
    max_attempts: int = 3,
) -> tuple[dict, list[dict]]:
    attempts = []
    retryable_statuses = {408, 429, 500, 502, 503, 504}
    for attempt_number in range(1, max_attempts + 1):
        try:
            result = azure.synthesize_azure(endpoint, key, ssml, destination)
        except (
            http.client.IncompleteRead,
            TimeoutError,
            ConnectionError,
            urllib.error.URLError,
        ) as error:
            result = {
                "ok": False,
                "reason": type(error).__name__,
                "detail": str(error)[:500],
                "transient": True,
            }
        attempts.append(
            {
                "attempt": attempt_number,
                "ok": bool(result.get("ok")),
                "httpStatus": result.get("httpStatus"),
                "reason": result.get("reason"),
                "transient": bool(result.get("transient")),
            }
        )
        if result.get("ok"):
            return result, attempts
        retryable = bool(result.get("transient")) or result.get(
            "httpStatus"
        ) in retryable_statuses
        if not retryable or attempt_number == max_attempts:
            return result, attempts
        time.sleep(1.25 * attempt_number)
    return result, attempts


def fine_tune_loudness(master_path: Path, delivery_path: Path) -> dict:
    before = premium.measure_loudness(master_path)
    if not before.get("available") or before.get("integratedLufs") is None:
        return {"applied": False, "before": before, "reason": "measurement unavailable"}
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg was not found")

    target_lufs = -20.0
    gain_db = target_lufs - float(before["integratedLufs"])
    tuned_path = master_path.with_name(master_path.stem + ".loudness-tuned.wav")
    tune_command = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(master_path),
        "-af",
        f"volume={gain_db:.3f}dB,alimiter=limit=0.80:attack=5:release=50:level=false",
        "-ar",
        "24000",
        "-ac",
        "1",
        "-c:a",
        "pcm_s16le",
        str(tuned_path),
    ]
    completed = subprocess.run(tune_command, capture_output=True, text=True)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "Loudness fine tuning failed")
    tuned_path.replace(master_path)

    delivery_command = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(master_path),
        "-c:a",
        "libmp3lame",
        "-b:a",
        "128k",
        str(delivery_path),
    ]
    completed = subprocess.run(delivery_command, capture_output=True, text=True)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "MP3 delivery re-encode failed")
    after = premium.measure_loudness(master_path)
    return {
        "applied": True,
        "targetLufs": target_lufs,
        "gainDb": round(gain_db, 3),
        "limiterLinearLimit": 0.80,
        "before": before,
        "after": after,
    }


def generate_item(
    item: dict,
    output_dir: Path,
    execute: bool,
    endpoint: str,
    key: str,
    reuse_raw: bool,
    previous_record: dict | None,
) -> dict:
    track_id = f"{item['part']}-{item['id']}-dragon-hd-omni-prompted"
    ssml = item_ssml(item)
    ssml_path = output_dir / "ssml" / f"{track_id}.ssml"
    raw_path = output_dir / "_raw" / f"{track_id}.mp3"
    master_path = output_dir / "master" / f"{track_id}.wav"
    delivery_path = output_dir / "audio" / f"{track_id}.mp3"
    ssml_path.parent.mkdir(parents=True, exist_ok=True)
    ssml_path.write_text(ssml + "\n", encoding="utf-8")

    record = {
        "id": item["id"],
        "number": item["number"],
        "part": item["part"],
        "displayScript": item["displayScript"],
        "questionText": item["questionText"],
        "parts": item_parts(item),
        "voices": item["voices"],
        "voiceLabel": voice_label(item),
        "model": "DragonHDOmniLatestNeural",
        "stylePromptApplied": True,
        "voiceParameters": VOICE_PARAMETERS,
        "oneAzureRequest": True,
        "sentenceLevelGeneration": False,
        "postSynthesisConcatenation": False,
        "unsupportedBreakTagUsed": False,
        "unsupportedProsodyTagUsed": False,
        "structuralPauseMethod": "prompted natural pauses plus SSML paragraph/sentence boundaries",
        "ssml": ssml_path.relative_to(output_dir).as_posix(),
        "ok": False,
    }
    if not execute:
        record["ssmlCharacters"] = len(ssml)
        return record

    if reuse_raw:
        if not raw_path.exists():
            raise RuntimeError(f"Raw audio was not found for {track_id}")
        if not previous_record or not previous_record.get("azure", {}).get("ok"):
            raise RuntimeError(f"Previous Azure result was not found for {track_id}")
        result = previous_record["azure"]
        attempts = previous_record.get("azureAttempts", [])
        record["sourceAudioReused"] = True
    else:
        result, attempts = synthesize_with_retry(endpoint, key, ssml, raw_path)
    record["azure"] = result
    record["azureAttempts"] = attempts
    record["azureRequestAttempts"] = len(attempts)
    if not result["ok"]:
        raise RuntimeError(
            f"Azure synthesis failed for {track_id}: "
            + str(result.get("detail") or result.get("reason"))
        )
    record["processing"] = favorite.create_master_and_delivery(
        raw_path, master_path, delivery_path
    )
    record["loudnessFineTune"] = fine_tune_loudness(master_path, delivery_path)
    record["processing"]["master"] = azure.probe_audio(master_path)
    record["processing"]["delivery"] = azure.probe_audio(delivery_path)
    record["loudness"] = premium.measure_loudness(master_path)
    record["silenceIntervals"] = premium.detect_silence(master_path)
    record["masterWav"] = master_path.relative_to(output_dir).as_posix()
    record["deliveryMp3"] = delivery_path.relative_to(output_dir).as_posix()
    record["ok"] = True
    time.sleep(0.35)
    return record


def build_report(
    items: list[dict],
    output_dir: Path,
    region: str,
    execute: bool,
    reuse_raw: bool,
    previous_records: dict[str, dict],
) -> dict:
    endpoint = azure.azure_endpoint(region) if execute else ""
    key = azure.azure_key() if execute else ""
    if execute and not key:
        raise RuntimeError("AZURE_SPEECH_KEY or SPEECH_KEY is not set")
    records = [
        generate_item(
            item,
            output_dir,
            execute,
            endpoint,
            key,
            reuse_raw,
            previous_records.get(item["id"]),
        )
        for item in items
    ]
    return {
        "mode": "completed" if execute else "preflight",
        "provider": "Azure Speech",
        "region": region,
        "sourceSet": SET_KEY,
        "model": "Dragon HD Omni",
        "modelId": "DragonHDOmniLatestNeural",
        "stylePromptApplied": True,
        "prompts": {
            "number": NUMBER_PROMPT,
            "dialogue": DIALOGUE_PROMPT,
            "passage": PASSAGE_PROMPT,
            "question": QUESTION_PROMPT,
        },
        "voiceParameters": VOICE_PARAMETERS,
        "naturalMasterPlaybackRate": 1.0,
        "defaultReviewRate": 1.0,
        "reviewRates": [0.87, 0.9, 1.0],
        "preservesPitchRequested": True,
        "questionCount": len(records),
        "part1Count": sum(row["part"] == "part1" for row in records),
        "part2Count": sum(row["part"] == "part2" for row in records),
        "trackCount": len(records),
        "apiRequestCount": (
            sum(row.get("azureRequestAttempts", 0) for row in records)
            if execute
            else 0
        ),
        "apiRequestCountThisRun": 0 if reuse_raw else (
            sum(row.get("azureRequestAttempts", 0) for row in records)
            if execute
            else 0
        ),
        "sourceAudioReused": bool(reuse_raw),
        "items": records,
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    output_dir = args.output_dir.resolve()
    items = load_items()
    assert_safe_inputs(items)
    report_path = output_dir / "generation-report.json"
    previous_records = {}
    if args.reuse_raw:
        if not args.execute:
            raise RuntimeError("--reuse-raw requires --execute")
        if not report_path.exists():
            raise RuntimeError("Existing generation-report.json was not found")
        previous_report = json.loads(report_path.read_text(encoding="utf-8"))
        previous_records = {row["id"]: row for row in previous_report.get("items", [])}
    report = build_report(
        items,
        output_dir,
        args.region.strip(),
        args.execute,
        args.reuse_raw,
        previous_records,
    )
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_page(output_dir, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
