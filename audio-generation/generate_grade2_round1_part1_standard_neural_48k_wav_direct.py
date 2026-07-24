import argparse
import hashlib
import html
import json
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import generate_azure_hd_minimal_48k_quality_test as direct
import generate_grade2_round1_part1 as source
import generate_grade2_round1_part1_azure_dialogue_comparison as azure
import generate_grade2_round1_azure_premium_compare as premium


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
OUTPUT_DIR = (
    ROOT
    / "audio-generation/grade2-round1-part1-standard-neural-48k-wav-direct-20260719"
)
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-round1-part1-standard-neural-48k-wav-direct-20260719"
)

SET_KEY = "set-01"
NUMBERS = (1, 2, 3)
NUMBER_WORDS = {1: "one", 2: "two", 3: "three"}
OUTPUT_FORMAT = "riff-48khz-16bit-mono-pcm"

VOICE_A = "en-US-AriaNeural"
VOICE_B = "en-US-AndrewMultilingualNeural"
VOICE_NARRATOR = "en-US-EmmaMultilingualNeural"

NUMBER_TO_BODY_MS = 1150
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1100
QUESTION_TO_TEXT_MS = 350

FORBIDDEN_SSML_FRAGMENTS = (
    "express-as",
    "<prosody",
    "<emphasis",
    "<p>",
    "<s>",
    "parameters=",
    "enhancePronunciation",
    "top_p",
    "top_k",
    "cfg_scale",
)


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Generate Grade 2 Round 1 Part 1 No.1-3 using only Standard "
            "Neural voices and direct Azure 48 kHz PCM WAV output."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    parser.add_argument(
        "--region",
        default=azure.env_value("AZURE_SPEECH_REGION", "SPEECH_REGION"),
    )
    return parser.parse_args()


def load_items() -> list[dict]:
    questions = source.load_source_questions(SOURCE_JS, SET_KEY)
    part1 = {
        int(question["id"]): question
        for question in questions
        if question.get("part") == "Part 1"
    }
    items = []
    for number in NUMBERS:
        question = part1[number]
        turns = source.parse_dialogue(str(question.get("script", "")))
        if len(turns) != 4:
            raise RuntimeError(f"Part 1 No.{number} must contain four turns")
        items.append(
            {
                "id": f"No{number:02d}",
                "number": number,
                "turns": turns,
                "questionText": str(question.get("questionText", "")).strip(),
            }
        )
    return items


def voice_xml(voice_name: str, text: str, pause_after_ms: int | None) -> str:
    pause = f'<break time="{pause_after_ms}ms"/>' if pause_after_ms else ""
    return (
        f'<voice name="{html.escape(voice_name, quote=True)}">'
        f"{html.escape(text, quote=False)}{pause}</voice>"
    )


def item_ssml(item: dict) -> str:
    pieces = [
        voice_xml(
            VOICE_NARRATOR,
            f"Number {NUMBER_WORDS[item['number']] }.",
            NUMBER_TO_BODY_MS,
        )
    ]
    for index, turn in enumerate(item["turns"]):
        pieces.append(
            voice_xml(
                VOICE_A if turn["speaker"] == "A" else VOICE_B,
                turn["text"],
                BODY_TO_QUESTION_MS
                if index == len(item["turns"]) - 1
                else TURN_GAP_MS,
            )
        )
    pieces.extend(
        [
            voice_xml(VOICE_NARRATOR, "Question.", QUESTION_TO_TEXT_MS),
            voice_xml(VOICE_NARRATOR, item["questionText"], None),
        ]
    )
    return (
        '<speak version="1.0" '
        'xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">'
        + "".join(pieces)
        + "</speak>"
    )


def assert_ssml_contract(ssml: str) -> None:
    lowered = ssml.lower()
    forbidden = [
        fragment
        for fragment in FORBIDDEN_SSML_FRAGMENTS
        if fragment.lower() in lowered
    ]
    if forbidden:
        raise RuntimeError(f"Forbidden SSML fragments found: {forbidden}")
    if lowered.count("<voice ") != 7 or lowered.count("</voice>") != 7:
        raise RuntimeError("Each Part 1 item must contain exactly seven voice blocks")
    if lowered.count("<break ") != 6:
        raise RuntimeError("Each Part 1 item must contain exactly six structural breaks")


def script_html(item: dict) -> str:
    dialogue = "".join(
        f'<p><strong>{html.escape(turn["speaker"])}</strong> '
        f'{html.escape(turn["text"])}</p>'
        for turn in item["turns"]
    )
    return dialogue + (
        f'<p class="question"><strong>Question</strong> '
        f'{html.escape(item["questionText"])}</p>'
    )


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        cards.append(
            f"""
            <section class="question-card">
              <div class="card-head">
                <h2>Number {record['number']}</h2>
                <span>Aria × Andrew／ナレーター Emma</span>
              </div>
              <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}"></audio>
              <a class="download" href="{html.escape(record['publishedWav'])}" download>WAVをそのまま保存</a>
              <details>
                <summary>英文を見る</summary>
                {record['scriptHtml']}
              </details>
            </section>
            """
        )

    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Part 1｜Standard Neural 48kHz WAV</title>
  <style>
    :root {{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#16231c; background:#f2efe8; }}
    * {{ box-sizing:border-box; }} body {{ margin:0; }}
    main {{ width:min(820px,calc(100% - 24px)); margin:auto; padding:28px 0 60px; }}
    h1 {{ margin:0 0 12px; font-size:clamp(28px,7vw,43px); line-height:1.15; }}
    .lead,.note {{ color:#526158; line-height:1.75; }}
    .contract {{ margin:18px 0 26px; padding:15px 17px; background:#e6f1eb; border:1px solid #b8d1c3; border-radius:15px; line-height:1.7; }}
    .contract strong {{ display:block; color:#125f3e; }}
    .question-card {{ margin:18px 0 25px; padding:19px; background:#fff; border:1px solid #d7ddd8; border-radius:19px; }}
    .card-head {{ display:flex; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px; }}
    h2 {{ margin:0; font-size:24px; }} .card-head span {{ color:#156c47; font-size:14px; font-weight:750; }}
    audio {{ display:block; width:100%; }}
    .download {{ display:inline-block; margin-top:10px; color:#156c47; font-size:13px; font-weight:700; }}
    details {{ margin-top:15px; padding-top:13px; border-top:1px solid #e2e6e3; }}
    summary {{ cursor:pointer; font-weight:750; }} details p {{ line-height:1.65; }} details strong {{ display:inline-block; min-width:28px; }}
    .question {{ margin-top:16px; }}
    @media (max-width:680px) {{
      main {{ width:min(100% - 16px,820px); padding-top:20px; }}
      .question-card {{ padding:14px; }}
    }}
  </style>
</head>
<body><main>
  <h1>Part 1<br>Standard Neural</h1>
  <p class="lead">比較で最もクリアだったStandard Neuralだけで、Part 1を3問作成しました。</p>
  <div class="contract">
    <strong>Azure原音をそのまま配信</strong>
    48kHz・16bit・mono PCM WAV／1問につきAzureへの1リクエスト／MP3・FFmpeg・速度変更・リマスター・後からの音源連結なし。
  </div>
  {''.join(cards)}
  <p class="note">間隔：問題番号後1.15秒／会話ターン間0.55秒／会話後1.10秒／“Question.”後0.35秒。Standard Neuralが対応するbreakだけを使っています。</p>
</main>
<script>
  const audios = [...document.querySelectorAll('audio')];
  audios.forEach(audio => audio.addEventListener('play', () => {{
    audios.forEach(other => {{ if (other !== audio) other.pause(); }});
  }}));
</script>
</body></html>
"""
    publish_dir.mkdir(parents=True, exist_ok=True)
    (publish_dir / "index.html").write_text(page, encoding="utf-8")
    (publish_dir / "_headers").write_text(
        "/audio/*\n"
        "  Cache-Control: public, max-age=3600\n"
        "  Content-Type: audio/wav\n",
        encoding="utf-8",
    )


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    output_dir = args.output_dir.resolve()
    publish_dir = args.publish_dir.resolve()
    items = load_items()
    endpoint = azure.azure_endpoint(args.region) if args.execute else ""
    key = azure.azure_key() if args.execute else ""
    if args.execute and not key:
        raise RuntimeError("AZURE_SPEECH_KEY or SPEECH_KEY is not set")

    records = []
    for item in items:
        ssml = item_ssml(item)
        assert_ssml_contract(ssml)
        stem = f"part1-{item['id']}-standard-neural-48k-pcm-direct"
        ssml_path = output_dir / "ssml" / f"{stem}.ssml"
        wav_path = output_dir / "audio" / f"{stem}.wav"
        published_path = publish_dir / "audio" / wav_path.name
        ssml_path.parent.mkdir(parents=True, exist_ok=True)
        ssml_path.write_text(ssml + "\n", encoding="utf-8")
        record = {
            "id": item["id"],
            "number": item["number"],
            "voices": {"A": VOICE_A, "B": VOICE_B, "narrator": VOICE_NARRATOR},
            "questionText": item["questionText"],
            "scriptHtml": script_html(item),
            "ssml": ssml_path.relative_to(output_dir).as_posix(),
            "ssmlSha256": hashlib.sha256(ssml.encode("utf-8")).hexdigest(),
            "outputFormatRequested": OUTPUT_FORMAT,
            "oneAzureRequest": True,
            "postSynthesisConcatenation": False,
            "postSynthesisConversion": False,
            "lossyEncodingApplied": False,
            "remasterApplied": False,
            "playbackRateModification": False,
            "ok": False,
        }
        if args.execute:
            result, attempts = direct.synthesize_with_retry(
                endpoint, key, ssml, wav_path
            )
            record["azure"] = result
            record["attempts"] = attempts
            if not result.get("ok"):
                raise RuntimeError(
                    f"Azure synthesis failed for {stem}: "
                    + str(result.get("detail") or result.get("reason"))
                )
            record["wave"] = direct.inspect_wav(wav_path)
            record["probe"] = azure.probe_audio(wav_path)
            record["loudness"] = premium.measure_loudness(wav_path)
            record["sha256"] = direct.sha256(wav_path)
            published_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(wav_path, published_path)
            record["publishedSha256"] = direct.sha256(published_path)
            if record["sha256"] != record["publishedSha256"]:
                raise RuntimeError(f"Published copy differs for {stem}")
            record["directWav"] = wav_path.relative_to(output_dir).as_posix()
            record["publishedWav"] = published_path.relative_to(
                publish_dir
            ).as_posix()
            record["ok"] = True
            time.sleep(0.35)
        records.append(record)

    if args.execute:
        write_page(publish_dir, records)
    report = {
        "mode": "completed" if args.execute else "preflight",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "provider": "Azure Speech REST API",
        "region": args.region,
        "part": "Part 1",
        "numbers": list(NUMBERS),
        "sourceSet": SET_KEY,
        "outputFormat": OUTPUT_FORMAT,
        "trackCount": len(records),
        "apiRequestCount": len(records) if args.execute else 0,
        "voiceFamily": "Standard Neural only",
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "turnGap": TURN_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionToText": QUESTION_TO_TEXT_MS,
        },
        "deliveryContract": {
            "azureDirectWav": True,
            "sampleRateHz": 48000,
            "bitsPerSample": 16,
            "channels": 1,
            "oneAzureRequestPerQuestion": True,
            "postSynthesisConcatenation": False,
            "postSynthesisConversion": False,
            "lossyEncoding": False,
            "remaster": False,
            "playbackRateModification": False,
            "prosody": False,
            "expressAs": False,
        },
        "items": records,
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / "generation-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "trackCount": len(records),
                "apiRequestCount": report["apiRequestCount"],
                "outputDir": str(output_dir),
                "publishDir": str(publish_dir),
                "report": str(report_path),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
