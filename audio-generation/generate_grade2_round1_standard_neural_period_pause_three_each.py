from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import generate_azure_hd_minimal_48k_quality_test as direct
import generate_grade2_round1_azure_premium_compare as premium
import generate_grade2_round1_part1 as source
import generate_grade2_round1_part1_azure_dialogue_comparison as azure


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
RANGE_WORKER_SOURCE = ROOT / "audio-generation/cloudflare-wav-range-worker.js"
OUTPUT_DIR = (
    ROOT
    / "audio-generation/grade2-round1-standard-neural-period-pause-three-each-20260719"
)
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-round1-standard-neural-period-pause-three-each-20260719"
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
OUTPUT_FORMAT = "riff-48khz-16bit-mono-pcm"

ARIA = "en-US-AriaNeural"
ANDREW = "en-US-AndrewMultilingualNeural"
EMMA = "en-US-EmmaMultilingualNeural"
APPROVED_VOICES = {ARIA, ANDREW, EMMA}

PART1_VOICES = {"A": ARIA, "B": ANDREW, "narrator": EMMA}
PART2_VOICES = {
    16: {"body": ARIA, "narrator": ANDREW},
    17: {"body": ANDREW, "narrator": EMMA},
    18: {"body": EMMA, "narrator": ANDREW},
}

NUMBER_TO_BODY_MS = 1150
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1100
QUESTION_TO_TEXT_MS = 350
INTERNAL_PERIOD_PAUSE_MS = 180
AUDIO_CACHE_VERSION = "20260719-azure-period1"

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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate Part 1 No.1-3 and Part 2 No.16-18 with the previously "
            "approved Azure Standard Neural voices, direct 48 kHz PCM WAV, "
            "and a short internal pause after periods."
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
    by_number = {int(question["id"]): question for question in questions}
    items = []
    for number in PART1_NUMBERS:
        question = by_number[number]
        turns = source.parse_dialogue(str(question.get("script", "")))
        if len(turns) != 4:
            raise RuntimeError(f"Part 1 No.{number} must contain four turns")
        items.append(
            {
                "id": f"part1-No{number:02d}",
                "part": "Part 1",
                "number": number,
                "turns": turns,
                "questionText": str(question.get("questionText", "")).strip(),
                "voices": PART1_VOICES,
            }
        )
    for number in PART2_NUMBERS:
        question = by_number[number]
        items.append(
            {
                "id": f"part2-No{number:02d}",
                "part": "Part 2",
                "number": number,
                "bodyText": str(question.get("script", "")).strip(),
                "questionText": str(question.get("questionText", "")).strip(),
                "voices": PART2_VOICES[number],
            }
        )
    return items


def safe_text(number: int, text: str) -> str:
    return azure.safe_text(number, text)


def internal_period_count(text: str) -> int:
    return len(re.findall(r"\.(?=\s+\S)", text))


def text_xml(text: str, add_period_pauses: bool) -> str:
    if not add_period_pauses:
        return html.escape(text, quote=False)
    pieces = []
    cursor = 0
    for match in re.finditer(r"\.(?=\s+\S)", text):
        pieces.append(html.escape(text[cursor : match.end()], quote=False))
        pieces.append(f'<break time="{INTERNAL_PERIOD_PAUSE_MS}ms"/>')
        cursor = match.end()
    pieces.append(html.escape(text[cursor:], quote=False))
    return "".join(pieces)


def voice_xml(
    voice_name: str,
    text: str,
    structural_pause_ms: int | None,
    add_period_pauses: bool = False,
) -> str:
    structural_pause = (
        f'<break time="{structural_pause_ms}ms"/>' if structural_pause_ms else ""
    )
    return (
        f'<voice name="{html.escape(voice_name, quote=True)}">'
        f"{text_xml(text, add_period_pauses)}{structural_pause}</voice>"
    )


def item_ssml(item: dict) -> tuple[str, dict]:
    number = item["number"]
    pieces = [
        voice_xml(
            item["voices"]["narrator"],
            f"Number {NUMBER_WORDS[number]}.",
            NUMBER_TO_BODY_MS,
        )
    ]
    internal_breaks = 0
    if item["part"] == "Part 1":
        for index, turn in enumerate(item["turns"]):
            rendered = safe_text(number, turn["text"])
            internal_breaks += internal_period_count(rendered)
            pieces.append(
                voice_xml(
                    item["voices"][turn["speaker"]],
                    rendered,
                    BODY_TO_QUESTION_MS
                    if index == len(item["turns"]) - 1
                    else TURN_GAP_MS,
                    add_period_pauses=True,
                )
            )
    else:
        rendered = safe_text(number, item["bodyText"])
        internal_breaks = internal_period_count(rendered)
        pieces.append(
            voice_xml(
                item["voices"]["body"],
                rendered,
                BODY_TO_QUESTION_MS,
                add_period_pauses=True,
            )
        )
    pieces.extend(
        [
            voice_xml(
                item["voices"]["narrator"],
                "Question.",
                QUESTION_TO_TEXT_MS,
            ),
            voice_xml(
                item["voices"]["narrator"],
                safe_text(number, item["questionText"]),
                None,
            ),
        ]
    )
    ssml = (
        '<speak version="1.0" '
        'xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">'
        + "".join(pieces)
        + "</speak>"
    )
    return ssml, {
        "internalPeriodPauseMs": INTERNAL_PERIOD_PAUSE_MS,
        "internalPeriodBreakCount": internal_breaks,
        "finalPeriodsUseStructuralPause": True,
    }


def assert_ssml_contract(item: dict, ssml: str, pause_plan: dict) -> None:
    lowered = ssml.lower()
    forbidden = [fragment for fragment in FORBIDDEN_SSML_FRAGMENTS if fragment in lowered]
    if forbidden:
        raise RuntimeError(f"Forbidden SSML in {item['id']}: {forbidden}")
    expected_voices = 7 if item["part"] == "Part 1" else 4
    if lowered.count("<voice ") != expected_voices:
        raise RuntimeError(f"Unexpected voice-block count in {item['id']}")
    expected_structural_breaks = 6 if item["part"] == "Part 1" else 3
    expected_breaks = expected_structural_breaks + pause_plan["internalPeriodBreakCount"]
    if lowered.count("<break ") != expected_breaks:
        raise RuntimeError(f"Unexpected break count in {item['id']}")
    if lowered.count(f'<break time="{INTERNAL_PERIOD_PAUSE_MS}ms"/>') != pause_plan[
        "internalPeriodBreakCount"
    ]:
        raise RuntimeError(f"Internal period breaks differ in {item['id']}")
    if lowered.count(f'<break time="{NUMBER_TO_BODY_MS}ms"/>') != 1:
        raise RuntimeError(f"Number break missing in {item['id']}")
    if lowered.count(f'<break time="{BODY_TO_QUESTION_MS}ms"/>') != 1:
        raise RuntimeError(f"Body-to-question break missing in {item['id']}")
    if lowered.count(f'<break time="{QUESTION_TO_TEXT_MS}ms"/>') != 1:
        raise RuntimeError(f"Question break missing in {item['id']}")
    expected_turn_breaks = 3 if item["part"] == "Part 1" else 0
    if lowered.count(f'<break time="{TURN_GAP_MS}ms"/>') != expected_turn_breaks:
        raise RuntimeError(f"Turn breaks differ in {item['id']}")
    for voice in APPROVED_VOICES:
        if voice in ssml:
            continue
    used_voices = set(re.findall(r'<voice name="([^"]+)"', ssml))
    if not used_voices <= APPROVED_VOICES:
        raise RuntimeError(f"Unapproved voice in {item['id']}: {used_voices}")


def assert_wave_contract(wave_info: dict, item_id: str) -> None:
    if (
        wave_info.get("sampleRateHz") != 48000
        or wave_info.get("bitsPerSample") != 16
        or wave_info.get("channels") != 1
        or wave_info.get("compressionType") != "NONE"
    ):
        raise RuntimeError(f"Unexpected WAV format for {item_id}: {wave_info}")


def script_html(item: dict) -> str:
    if item["part"] == "Part 1":
        body = "".join(
            f'<p><strong>{html.escape(turn["speaker"])}</strong> '
            f'{html.escape(turn["text"])}</p>'
            for turn in item["turns"]
        )
    else:
        body = f'<p>{html.escape(item["bodyText"])}</p>'
    return body + (
        f'<p class="question"><strong>Question</strong> '
        f'{html.escape(item["questionText"])}</p>'
    )


def voice_label(item: dict) -> str:
    if item["part"] == "Part 1":
        return "Aria × Andrew／案内 Emma"
    body_name = {ARIA: "Aria", ANDREW: "Andrew", EMMA: "Emma"}[item["voices"]["body"]]
    narrator_name = {ARIA: "Aria", ANDREW: "Andrew", EMMA: "Emma"}[
        item["voices"]["narrator"]
    ]
    return f"本文 {body_name}／案内 {narrator_name}"


def write_page(publish_dir: Path, records: list[dict]) -> None:
    sections = []
    for part in ("Part 1", "Part 2"):
        cards = []
        for record in records:
            if record["part"] != part:
                continue
            audio_url = f"{record['publishedWav']}?v={AUDIO_CACHE_VERSION}"
            cards.append(
                f"""
                <article class="card" data-part="{part}">
                  <div class="card-head">
                    <div><h3>Number {record['number']}</h3><p>{html.escape(record['voiceLabel'])}</p></div>
                    <a href="{html.escape(audio_url)}" download>WAVを保存</a>
                  </div>
                  <audio controls preload="metadata" src="{html.escape(audio_url)}"></audio>
                  <details><summary>英文を見る</summary>{record['scriptHtml']}</details>
                </article>
                """
            )
        sections.append(f'<section><h2>{part}・3問</h2>{"".join(cards)}</section>')
    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Azure Standard Neural｜ピリオド後に短い間</title>
  <style>
    :root{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17231c;background:#f3f0e8}}
    *{{box-sizing:border-box}}body{{margin:0}}main{{width:min(780px,calc(100% - 24px));margin:auto;padding:28px 0 54px}}
    h1{{font-size:clamp(28px,7vw,43px);line-height:1.12;margin:0 0 12px}}h1 span{{display:block;color:#176b47}}
    h2{{margin:34px 0 10px;font-size:27px}}h3{{margin:0;font-size:22px}}.lead,.note{{line-height:1.7;color:#526158}}
    .contract{{padding:14px 16px;border:1px solid #b8d1c3;border-radius:15px;background:#e6f1eb;line-height:1.7}}
    .card{{margin:15px 0;padding:17px;border:1px solid #d7ddd8;border-radius:18px;background:#fff;box-shadow:0 5px 20px rgba(29,48,38,.06)}}
    .card-head{{display:flex;justify-content:space-between;align-items:start;gap:12px}}.card-head p{{margin:5px 0 11px;color:#5c6b61}}
    a{{color:#176b47;font-weight:750;white-space:nowrap}}audio{{display:block;width:100%;margin:8px 0 13px}}
    details{{border-top:1px solid #e2e6e3;padding-top:11px}}summary{{cursor:pointer;font-weight:750}}details p{{line-height:1.65}}.question{{color:#24543a}}
    @media(max-width:460px){{.card-head{{display:block}}.card-head>a{{display:inline-block;margin-bottom:9px}}}}
  </style>
</head>
<body><main>
  <h1>Azure Standard Neural<span>ピリオド後に短い間</span></h1>
  <p class="lead">以前いちばんクリアだった通常Neuralで、Part 1とPart 2を3問ずつ作成しました。</p>
  <p class="contract"><strong>Azure 48kHz PCM WAVを直接配信</strong><br>
  同じ話者が続けて読む本文内のピリオド後に180msを追加。各問はAzureへの1リクエストで、文ごとの音源分割・MP3化・速度変更・リマスターはしていません。</p>
  {''.join(sections)}
  <p class="note">構造間隔：番号後1.15秒／Part 1話者交代0.55秒／本文後1.10秒／“Question.”後0.35秒。通常再生は1.00xです。</p>
</main>
<script>
  const players=[...document.querySelectorAll('audio')];
  players.forEach(player=>{{
    player.defaultPlaybackRate=1;
    player.playbackRate=1;
    player.addEventListener('play',()=>players.forEach(other=>{{if(other!==player)other.pause()}}));
  }});
</script>
</body></html>
"""
    publish_dir.mkdir(parents=True, exist_ok=True)
    (publish_dir / "index.html").write_text(page, encoding="utf-8")
    (publish_dir / "_headers").write_text(
        "/audio/*.wav\n  Content-Type: audio/wav\n  Cache-Control: public, max-age=31536000, immutable\n",
        encoding="utf-8",
    )
    shutil.copy2(RANGE_WORKER_SOURCE, publish_dir / "_worker.js")


def build_plan(items: list[dict]) -> dict:
    planned = []
    for item in items:
        ssml, pause_plan = item_ssml(item)
        assert_ssml_contract(item, ssml, pause_plan)
        planned.append(
            {
                "id": item["id"],
                "part": item["part"],
                "number": item["number"],
                "voices": item["voices"],
                "oneAzureRequest": True,
                "sentenceLevelAudioSplit": False,
                "pausePlan": pause_plan,
                "ssml": ssml,
            }
        )
    return {
        "provider": "Azure Speech REST API",
        "voiceFamily": "Standard Neural only",
        "outputFormat": OUTPUT_FORMAT,
        "trackCount": len(planned),
        "apiRequestCount": len(planned),
        "items": planned,
    }


def execute(
    items: list[dict], plan: dict, output_dir: Path, publish_dir: Path, region: str
) -> dict:
    endpoint = azure.azure_endpoint(region)
    key = azure.azure_key()
    if not key:
        raise RuntimeError("AZURE_SPEECH_KEY or SPEECH_KEY is not set")
    records = []
    for item, planned in zip(items, plan["items"]):
        ssml = planned["ssml"]
        stem = f"{item['id']}-standard-neural-period-pause-48k"
        ssml_path = output_dir / "ssml" / f"{stem}.ssml"
        wav_path = output_dir / "audio" / f"{stem}.wav"
        publish_path = publish_dir / "audio" / wav_path.name
        ssml_path.parent.mkdir(parents=True, exist_ok=True)
        ssml_path.write_text(ssml + "\n", encoding="utf-8")
        result, attempts = direct.synthesize_with_retry(endpoint, key, ssml, wav_path)
        if not result.get("ok"):
            raise RuntimeError(
                f"Azure synthesis failed for {item['id']}: "
                + str(result.get("detail") or result.get("reason"))
            )
        wave_info = direct.inspect_wav(wav_path)
        assert_wave_contract(wave_info, item["id"])
        publish_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(wav_path, publish_path)
        local_hash = direct.sha256(wav_path)
        published_hash = direct.sha256(publish_path)
        if local_hash != published_hash:
            raise RuntimeError(f"Published copy differs for {item['id']}")
        records.append(
            {
                "id": item["id"],
                "part": item["part"],
                "number": item["number"],
                "voices": item["voices"],
                "voiceLabel": voice_label(item),
                "scriptHtml": script_html(item),
                "ssml": ssml_path.relative_to(output_dir).as_posix(),
                "ssmlSha256": hashlib.sha256(ssml.encode("utf-8")).hexdigest(),
                "pausePlan": planned["pausePlan"],
                "azure": result,
                "attempts": attempts,
                "wave": wave_info,
                "probe": azure.probe_audio(wav_path),
                "loudness": premium.measure_loudness(wav_path),
                "masterWav": wav_path.relative_to(output_dir).as_posix(),
                "publishedWav": publish_path.relative_to(publish_dir).as_posix(),
                "masterSha256": local_hash,
                "publishedSha256": published_hash,
                "publishedCopyHashMatch": local_hash == published_hash,
                "fileBytes": wav_path.stat().st_size,
                "oneAzureRequest": True,
                "postSynthesisConcatenation": False,
                "postSynthesisConversion": False,
            }
        )
        time.sleep(0.35)
    write_page(publish_dir, records)
    report = {
        "mode": "completed",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "provider": "Azure Speech REST API",
        "region": region,
        "voiceFamily": "Standard Neural only",
        "parts": {"Part 1": list(PART1_NUMBERS), "Part 2": list(PART2_NUMBERS)},
        "sourceSet": SET_KEY,
        "outputFormat": OUTPUT_FORMAT,
        "trackCount": len(records),
        "apiRequestCount": len(records),
        "internalPeriodPauseMs": INTERNAL_PERIOD_PAUSE_MS,
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
            "part2WholeBodyOneRequest": True,
            "sentenceLevelAudioSplit": False,
            "postSynthesisConcatenation": False,
            "postSynthesisConversion": False,
            "lossyEncoding": False,
            "remaster": False,
            "playbackRate": 1.0,
            "rangeWorkerIncluded": True,
        },
        "preflight": plan,
        "items": records,
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / "generation-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (output_dir / "index.html").write_text(
        (publish_dir / "index.html").read_text(encoding="utf-8"), encoding="utf-8"
    )
    return report


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    items = load_items()
    plan = build_plan(items)
    if not args.execute:
        print(json.dumps({"mode": "preflight", **plan}, ensure_ascii=False, indent=2))
        return 0
    report = execute(
        items,
        plan,
        args.output_dir.resolve(),
        args.publish_dir.resolve(),
        args.region,
    )
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "trackCount": report["trackCount"],
                "apiRequestCount": report["apiRequestCount"],
                "internalPeriodBreaks": sum(
                    item["pausePlan"]["internalPeriodBreakCount"]
                    for item in report["items"]
                ),
                "items": [
                    {
                        "id": item["id"],
                        "wave": item["wave"],
                        "publishedCopyHashMatch": item["publishedCopyHashMatch"],
                        "fileBytes": item["fileBytes"],
                    }
                    for item in report["items"]
                ],
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
