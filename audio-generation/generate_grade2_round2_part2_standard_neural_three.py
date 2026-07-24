from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import sys
from pathlib import Path

import generate_grade2_round1_standard_neural_period_pause_three_each as base


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
OUTPUT_DIR = (
    ROOT
    / "audio-generation/grade2-round2-part2-standard-neural-three-20260721"
)
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-round2-part2-standard-neural-three-20260721"
)
SET_KEY = "set-02"
NUMBERS = (16, 17, 18)
NUMBER_WORDS = {16: "sixteen", 17: "seventeen", 18: "eighteen"}

ARIA = "en-US-AriaNeural"
ANDREW = "en-US-AndrewMultilingualNeural"
EMMA = "en-US-EmmaMultilingualNeural"
BODY_VOICES = {16: ARIA, 17: ANDREW, 18: EMMA}
NARRATOR = EMMA
APPROVED_VOICES = {ARIA, ANDREW, EMMA}

RATE = "-10%"
NUMBER_TO_BODY_MS = 1150
BODY_TO_QUESTION_MS = 1100
QUESTION_TO_TEXT_MS = 350
PERIOD_PAUSE_MS = 150
COMMA_PAUSE_MS = 80
OUTPUT_FORMAT = "riff-48khz-16bit-mono-pcm"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate Grade 2 Round 2 Part 2 No.16-18 with the preferred "
            "Azure Standard Neural voices and the finalized Part 2 timing."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    parser.add_argument(
        "--region",
        default=base.azure.env_value("AZURE_SPEECH_REGION", "SPEECH_REGION"),
    )
    return parser.parse_args()


def configure_base() -> None:
    base.SOURCE_JS = SOURCE_JS
    base.SET_KEY = SET_KEY
    base.PART1_NUMBERS = ()
    base.PART2_NUMBERS = NUMBERS
    base.NUMBER_WORDS = NUMBER_WORDS
    base.PART2_VOICES = {
        number: {"body": BODY_VOICES[number], "narrator": NARRATOR}
        for number in NUMBERS
    }
    base.APPROVED_VOICES = APPROVED_VOICES
    base.OUTPUT_FORMAT = OUTPUT_FORMAT
    base.NUMBER_TO_BODY_MS = NUMBER_TO_BODY_MS
    base.BODY_TO_QUESTION_MS = BODY_TO_QUESTION_MS
    base.QUESTION_TO_TEXT_MS = QUESTION_TO_TEXT_MS
    base.INTERNAL_PERIOD_PAUSE_MS = PERIOD_PAUSE_MS
    base.RANGE_WORKER_SOURCE = ROOT / "audio-generation/cloudflare-wav-range-worker.js"
    base.write_page = write_page


def marked_body_xml(text: str) -> tuple[str, int, int]:
    pieces = []
    cursor = 0
    period_count = 0
    comma_count = 0
    for match in re.finditer(r"[.,](?=\s+\S)", text):
        pieces.append(html.escape(text[cursor : match.end()], quote=False))
        if match.group() == ".":
            pieces.append(f'<break time="{PERIOD_PAUSE_MS}ms"/>')
            period_count += 1
        else:
            pieces.append(f'<break time="{COMMA_PAUSE_MS}ms"/>')
            comma_count += 1
        cursor = match.end()
    pieces.append(html.escape(text[cursor:], quote=False))
    return "".join(pieces), period_count, comma_count


def voice_xml(
    voice_name: str,
    content_xml: str,
    structural_pause_ms: int | None,
) -> str:
    structural_pause = (
        f'<break time="{structural_pause_ms}ms"/>'
        if structural_pause_ms
        else ""
    )
    return (
        f'<voice name="{html.escape(voice_name, quote=True)}">'
        f'<prosody rate="{RATE}">{content_xml}</prosody>'
        f"{structural_pause}</voice>"
    )


def item_ssml(item: dict) -> tuple[str, dict]:
    number = int(item["number"])
    body_text = base.safe_text(number, item["bodyText"])
    question_text = base.safe_text(number, item["questionText"])
    body_xml, period_count, comma_count = marked_body_xml(body_text)
    pieces = [
        voice_xml(
            NARRATOR,
            html.escape(f"Number {NUMBER_WORDS[number]}.", quote=False),
            NUMBER_TO_BODY_MS,
        ),
        voice_xml(BODY_VOICES[number], body_xml, BODY_TO_QUESTION_MS),
        voice_xml(NARRATOR, "Question.", QUESTION_TO_TEXT_MS),
        voice_xml(NARRATOR, html.escape(question_text, quote=False), None),
    ]
    ssml = (
        '<speak version="1.0" '
        'xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">'
        + "".join(pieces)
        + "</speak>"
    )
    return ssml, {
        "rate": RATE,
        "periodPauseMs": PERIOD_PAUSE_MS,
        "periodBreakCount": period_count,
        "commaPauseMs": COMMA_PAUSE_MS,
        "commaBreakCount": comma_count,
    }


def assert_contract(item: dict, ssml: str, pause_plan: dict) -> None:
    lowered = ssml.lower()
    if lowered.count("<voice ") != 4 or lowered.count("</voice>") != 4:
        raise RuntimeError(f"No.{item['number']} must contain four voice blocks")
    if lowered.count(f'<prosody rate="{RATE}">') != 4:
        raise RuntimeError(f"No.{item['number']} rate is not applied to every role")
    for milliseconds, expected in (
        (NUMBER_TO_BODY_MS, 1),
        (BODY_TO_QUESTION_MS, 1),
        (QUESTION_TO_TEXT_MS, 1),
        (PERIOD_PAUSE_MS, pause_plan["periodBreakCount"]),
        (COMMA_PAUSE_MS, pause_plan["commaBreakCount"]),
    ):
        actual = lowered.count(f'<break time="{milliseconds}ms"/>')
        if actual != expected:
            raise RuntimeError(
                f"No.{item['number']} break {milliseconds}ms differs: {actual} != {expected}"
            )
    used_voices = set(re.findall(r'<voice name="([^"]+)"', ssml))
    if not used_voices <= APPROVED_VOICES:
        raise RuntimeError(f"No.{item['number']} uses an unapproved voice: {used_voices}")
    for fragment in ("express-as", "<emphasis", "parameters=", "cfg_scale"):
        if fragment in lowered:
            raise RuntimeError(f"No.{item['number']} contains unsupported SSML: {fragment}")


def build_plan(items: list[dict]) -> dict:
    planned = []
    for item in items:
        ssml, pause_plan = item_ssml(item)
        assert_contract(item, ssml, pause_plan)
        planned.append(
            {
                "id": item["id"],
                "part": "Part 2",
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
        "sourceSet": SET_KEY,
        "rate": RATE,
        "outputFormat": OUTPUT_FORMAT,
        "trackCount": len(planned),
        "apiRequestCount": len(planned),
        "items": planned,
    }


def voice_label(record: dict) -> str:
    names = {ARIA: "Aria", ANDREW: "Andrew", EMMA: "Emma"}
    return (
        f"本文 {names[record['voices']['body']]}／"
        f"Number・Question {names[record['voices']['narrator']]}"
    )


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        cards.append(
            f"""
            <article><div class="head"><div><h2>Number {record['number']}</h2>
            <p>{html.escape(voice_label(record))}</p></div>
            <a href="{html.escape(record['publishedWav'])}" download>WAVを保存</a></div>
            <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}"></audio>
            <details><summary>英文を見る</summary>{record['scriptHtml']}</details></article>
            """
        )
    page = f"""<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Azure Standard Neural｜第2回 Part 2・3問</title>
<style>:root{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18211c;background:#f3f1eb}}*{{box-sizing:border-box}}body{{margin:0}}main{{width:min(760px,calc(100% - 24px));margin:auto;padding:28px 0 48px}}h1{{font-size:clamp(27px,7vw,42px);line-height:1.1;margin:0 0 12px}}h1 span{{display:block;color:#35644a}}.contract{{line-height:1.7;background:#e4f0e8;border:1px solid #b9d2c1;border-radius:14px;padding:13px 15px}}article{{background:#fff;border:1px solid #d7ddd8;border-radius:18px;padding:17px;margin:16px 0;box-shadow:0 5px 22px rgba(35,50,41,.06)}}.head{{display:flex;justify-content:space-between;gap:12px}}h2{{margin:0}}.head p{{margin:4px 0 12px;color:#637067}}a{{color:#285e40;font-weight:700}}audio{{width:100%;margin:8px 0 13px}}details{{border-top:1px solid #e4e8e5;padding-top:11px}}details p{{line-height:1.65}}@media(max-width:460px){{.head{{display:block}}}}</style>
</head><body><main><h1>Azure Standard Neural<span>第2回 Part 2・3問</span></h1>
<p class="contract"><strong>全役割0.90倍・48kHz PCM WAV</strong><br>
番号後1.15秒／ピリオド後0.15秒／コンマ後0.08秒／本文後1.10秒／Question後0.35秒。各問はAzureで通し生成し、後結合・再圧縮・速度後処理はしていません。</p>
{''.join(cards)}</main><script>const players=[...document.querySelectorAll('audio')];players.forEach(p=>p.addEventListener('play',()=>players.forEach(o=>{{if(o!==p)o.pause()}})));</script></body></html>"""
    publish_dir.mkdir(parents=True, exist_ok=True)
    (publish_dir / "index.html").write_text(page, encoding="utf-8")
    (publish_dir / "_headers").write_text(
        "/audio/*.wav\n  Content-Type: audio/wav\n  Cache-Control: public, max-age=31536000, immutable\n",
        encoding="utf-8",
    )
    if base.RANGE_WORKER_SOURCE.exists():
        shutil.copy2(base.RANGE_WORKER_SOURCE, publish_dir / "_worker.js")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    configure_base()
    items = base.load_items()
    plan = build_plan(items)
    if not args.execute:
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return 0
    report = base.execute(items, plan, args.output_dir, args.publish_dir, args.region)
    report.update(
        {
            "sourceSet": SET_KEY,
            "rate": RATE,
            "periodPauseMs": PERIOD_PAUSE_MS,
            "commaPauseMs": COMMA_PAUSE_MS,
            "preferredCast": {
                "body": [ARIA, ANDREW, EMMA],
                "numberAndQuestion": NARRATOR,
            },
        }
    )
    report["deliveryContract"].update(
        {
            "rateAppliedToEveryRole": True,
            "periodBreaks": True,
            "commaBreaks": True,
        }
    )
    (args.output_dir / "generation-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "mode": report["mode"],
                "sourceSet": SET_KEY,
                "numbers": list(NUMBERS),
                "trackCount": report["trackCount"],
                "apiRequestCount": report["apiRequestCount"],
                "rate": RATE,
                "all48kPcm": all(
                    item["wave"]["sampleRateHz"] == 48000
                    and item["wave"]["bitsPerSample"] == 16
                    and item["wave"]["channels"] == 1
                    for item in report["items"]
                ),
                "outputDir": str(args.output_dir),
                "publishDir": str(args.publish_dir),
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
