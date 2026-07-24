import argparse
import html
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import generate_grade2_round1_part1 as production


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
SET_KEY = "set-01"
OUTPUT_DIR = ROOT / "audio-generation/grade2-round1-part1-azure-dialogue-comparison-20260718"

NUMBER_TO_BODY_MS = 1350
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1300
QUESTION_LABEL_TO_TEXT_MS = 350

AZURE_OUTPUT_FORMAT = "audio-24khz-160kbitrate-mono-mp3"
USER_AGENT = "scbt-azure-dialogue-comparison"
TARGET_LUFS = -20

NUMBER_WORDS = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
    11: "eleven",
    12: "twelve",
    13: "thirteen",
    14: "fourteen",
    15: "fifteen",
}

MULTI_VOICE_SCENARIO = {
    "key": "azure-multi-voice-hd",
    "label": "Azure 複数voice SSML",
    "description": "1つのSSML内でA/B/ナレーターのvoice要素を切り替える方式。",
    "voices": {
        "A": "en-US-Ava:DragonHDLatestNeural",
        "B": "en-US-Andrew:DragonHDLatestNeural",
        "narrator": "en-US-EmmaMultilingualNeural",
    },
}

MULTITALKER_SCENARIO = {
    "key": "azure-multitalker-ava-andrew",
    "label": "Azure MultiTalker Ava/Andrew",
    "description": "Microsoft公式の会話用MultiTalker voiceを1つのSSMLで使う方式。",
    "voice": "en-US-MultiTalker-Ava-Andrew:DragonHDLatestNeural",
    "speakers": {"A": "ava", "B": "andrew", "narrator": "ava"},
}

BASELINE_CANDIDATES = [
    ROOT / "audio-generation/grade2-round1-simba-production-20260717/part1/audio/No01.mp3",
    ROOT / "audio-generation/grade2-round1-simba-natural-master-20260717/part1/audio/No01.mp3",
]


def windows_env_value(name: str) -> str:
    if os.name != "nt":
        return ""
    try:
        import winreg
    except ImportError:
        return ""
    locations = [
        (winreg.HKEY_CURRENT_USER, "Environment"),
        (
            winreg.HKEY_LOCAL_MACHINE,
            r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment",
        ),
    ]
    for root_key, sub_key in locations:
        try:
            with winreg.OpenKey(root_key, sub_key) as key:
                value, _kind = winreg.QueryValueEx(key, name)
                if value:
                    return str(value).strip()
        except OSError:
            continue
    return ""


def env_value(*names: str) -> str:
    for name in names:
        value = os.environ.get(name, "").strip()
        if value:
            return value
    for name in names:
        value = windows_env_value(name)
        if value:
            return value
    return ""


def parse_args():
    parser = argparse.ArgumentParser(
        description="第1回Part 1をAzure Speechの会話SSMLで比較生成します。"
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--numbers", default="1", help="例: 1 または 1,2")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument(
        "--region",
        default=env_value("AZURE_SPEECH_REGION", "SPEECH_REGION"),
        help="Azure Speech resource region. 未指定時は環境変数を使います。",
    )
    return parser.parse_args()


def parse_numbers(value: str) -> tuple[int, ...]:
    numbers = tuple(int(part.strip()) for part in value.split(",") if part.strip())
    if not numbers:
        raise RuntimeError("--numbers must contain at least one Part 1 number")
    if len(numbers) != len(set(numbers)):
        raise RuntimeError("--numbers must not contain duplicates")
    unknown = [number for number in numbers if number not in NUMBER_WORDS]
    if unknown:
        raise RuntimeError(f"Unsupported Part 1 numbers: {unknown}")
    return numbers


def azure_key() -> str:
    return env_value("AZURE_SPEECH_KEY", "SPEECH_KEY")


def azure_endpoint(region: str) -> str:
    custom = os.environ.get("AZURE_SPEECH_TTS_ENDPOINT", "").strip()
    if custom:
        return custom.rstrip("/")
    if not region:
        raise RuntimeError("AZURE_SPEECH_REGION or SPEECH_REGION is not set")
    return f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"


def safe_text(number: int, text: str) -> str:
    result, _replacements = production.apply_edge_tts_pronunciation_text(text)
    return result


def load_items(numbers: tuple[int, ...]) -> list[dict]:
    questions = production.load_source_questions(SOURCE_JS, SET_KEY)
    part1 = {
        int(question["id"]): question
        for question in questions
        if question.get("part") == "Part 1"
    }
    items = []
    for number in numbers:
        if number not in part1:
            raise RuntimeError(f"Part 1 No.{number} was not found")
        question = part1[number]
        turns = production.parse_dialogue(str(question.get("script", "")))
        if len(turns) != 4:
            raise RuntimeError(f"No.{number} must contain exactly four dialogue turns")
        items.append(
            {
                "id": f"No{number:02d}",
                "number": number,
                "turns": turns,
                "questionText": str(question.get("questionText", "")).strip(),
            }
        )
    return items


def xml_text(text: str) -> str:
    return html.escape(text, quote=False)


def break_xml(milliseconds: int) -> str:
    return "" if milliseconds <= 0 else f'<break time="{milliseconds}ms"/>'


def voice_xml(voice_name: str, text: str, gap_after_ms: int) -> str:
    return (
        f'<voice name="{html.escape(voice_name, quote=True)}">'
        f"{xml_text(text)}{break_xml(gap_after_ms)}</voice>"
    )


def turn_xml(speaker: str, text: str, gap_after_ms: int) -> str:
    return (
        f'<mstts:turn speaker="{html.escape(speaker, quote=True)}">'
        f"{xml_text(text)}{break_xml(gap_after_ms)}</mstts:turn>"
    )


def item_parts(item: dict) -> list[dict]:
    number = item["number"]
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "text": f"Number {NUMBER_WORDS[number]}.",
            "gapAfterMs": NUMBER_TO_BODY_MS,
        }
    ]
    for index, turn in enumerate(item["turns"]):
        rows.append(
            {
                "role": f"turn{index + 1}",
                "speaker": turn["speaker"],
                "text": safe_text(number, turn["text"]),
                "gapAfterMs": (
                    BODY_TO_QUESTION_MS
                    if index == len(item["turns"]) - 1
                    else TURN_GAP_MS
                ),
            }
        )
    rows.append(
        {
            "role": "questionLabel",
            "speaker": "narrator",
            "text": "Question.",
            "gapAfterMs": QUESTION_LABEL_TO_TEXT_MS,
        }
    )
    rows.append(
        {
            "role": "questionText",
            "speaker": "narrator",
            "text": safe_text(number, item["questionText"]),
            "gapAfterMs": 0,
        }
    )
    return rows


def multi_voice_ssml(item: dict) -> str:
    pieces = []
    voices = MULTI_VOICE_SCENARIO["voices"]
    for row in item_parts(item):
        speaker = row["speaker"]
        voice_key = speaker if speaker in {"A", "B"} else "narrator"
        pieces.append(voice_xml(voices[voice_key], row["text"], row["gapAfterMs"]))
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        'xml:lang="en-US">'
        + "".join(pieces)
        + "</speak>"
    )


def multitalker_ssml(item: dict) -> str:
    pieces = []
    speakers = MULTITALKER_SCENARIO["speakers"]
    for row in item_parts(item):
        speaker = row["speaker"]
        speaker_key = speaker if speaker in {"A", "B"} else "narrator"
        pieces.append(turn_xml(speakers[speaker_key], row["text"], row["gapAfterMs"]))
    return (
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' "
        "xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='en-US'>"
        f"<voice name='{MULTITALKER_SCENARIO['voice']}'>"
        "<mstts:dialog>"
        + "".join(pieces)
        + "</mstts:dialog></voice></speak>"
    )


def scenario_ssml(scenario_key: str, item: dict) -> str:
    if scenario_key == MULTI_VOICE_SCENARIO["key"]:
        return multi_voice_ssml(item)
    if scenario_key == MULTITALKER_SCENARIO["key"]:
        return multitalker_ssml(item)
    raise RuntimeError(f"Unknown scenario: {scenario_key}")


def synthesize_azure(endpoint: str, key: str, ssml: str, destination: Path) -> dict:
    body = ssml.encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": AZURE_OUTPUT_FORMAT,
            "User-Agent": USER_AGENT,
        },
    )
    started = time.time()
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            audio_bytes = response.read()
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(audio_bytes)
            return {
                "ok": True,
                "httpStatus": response.status,
                "contentType": response.headers.get("Content-Type"),
                "requestId": response.headers.get("X-RequestId")
                or response.headers.get("x-requestid"),
                "bytes": len(audio_bytes),
                "elapsedSeconds": round(time.time() - started, 3),
            }
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        return {
            "ok": False,
            "httpStatus": error.code,
            "reason": error.reason,
            "detail": detail[:2000],
            "elapsedSeconds": round(time.time() - started, 3),
        }


def normalize_mp3(source: Path, destination: Path) -> dict:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        shutil.copy2(source, destination)
        return {"normalized": False, "reason": "ffmpeg was not found"}
    destination.parent.mkdir(parents=True, exist_ok=True)
    command = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(source),
        "-af",
        f"loudnorm=I={TARGET_LUFS}:TP=-2:LRA=11",
        "-ar",
        "44100",
        "-ac",
        "1",
        "-b:a",
        "128k",
        str(destination),
    ]
    completed = subprocess.run(command, capture_output=True, text=True)
    if completed.returncode != 0:
        shutil.copy2(source, destination)
        return {
            "normalized": False,
            "reason": completed.stderr.strip()[:1000] or "ffmpeg failed",
        }
    return {"normalized": True, "targetLufs": TARGET_LUFS}


def probe_audio(path: Path) -> dict:
    ffprobe = shutil.which("ffprobe")
    if not ffprobe or not path.exists():
        return {"available": False}
    command = [
        ffprobe,
        "-v",
        "error",
        "-show_entries",
        "format=duration,bit_rate:stream=codec_name,sample_rate,channels",
        "-of",
        "json",
        str(path),
    ]
    completed = subprocess.run(command, capture_output=True, text=True)
    if completed.returncode != 0:
        return {"available": False, "error": completed.stderr.strip()[:1000]}
    return json.loads(completed.stdout)


def copy_baseline(output_dir: Path) -> list[dict]:
    records = []
    audio_dir = output_dir / "audio"
    for candidate in BASELINE_CANDIDATES:
        if candidate.exists():
            destination = audio_dir / "No01-baseline-current-method.mp3"
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(candidate, destination)
            records.append(
                {
                    "key": "baseline-current-method",
                    "label": "既存方式（役割別生成→結合）",
                    "description": "現在のPart 1確認用音源。番号・各発話・Questionを役割別に生成して結合した比較基準。",
                    "ok": True,
                    "source": str(candidate.relative_to(ROOT)),
                    "mp3": destination.relative_to(output_dir).as_posix(),
                    "probe": probe_audio(destination),
                }
            )
            break
    return records


def write_page(output_dir: Path, report: dict) -> None:
    cards = []
    for item in report.get("items", []):
        rows = []
        for output in item.get("outputs", []):
            if output.get("ok") and output.get("mp3"):
                rows.append(
                    "<article><h3>{label}</h3><p>{desc}</p>"
                    '<audio controls preload="metadata" src="{src}"></audio></article>'.format(
                        label=html.escape(output["label"]),
                        desc=html.escape(output.get("description", "")),
                        src=html.escape(output["mp3"]),
                    )
                )
            else:
                rows.append(
                    "<article><h3>{label}</h3><p class=\"error\">生成未完了: {reason}</p></article>".format(
                        label=html.escape(output.get("label", "unknown")),
                        reason=html.escape(
                            output.get("reason")
                            or output.get("detail")
                            or "Azure設定後に --execute で生成"
                        ),
                    )
                )
        script_preview = "<br>".join(
            html.escape(f'{row["speaker"]}: {row["text"]}')
            for row in item.get("parts", [])
        )
        cards.append(
            "<section><h2>{item_id}</h2>{rows}<details><summary>読み上げ内容</summary>"
            '<p class="script">{script}</p></details></section>'.format(
                item_id=html.escape(item["id"]),
                rows="".join(rows),
                script=script_preview,
            )
        )

    page = f"""<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>第1回 Part 1 Azure会話TTS比較</title>
<style>
:root{{color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
*{{box-sizing:border-box}}body{{margin:0;background:#f4f1ea;color:#17211c}}
main{{width:calc(100% - 24px);max-width:780px;margin:auto;padding:28px 0 48px}}
h1{{font-size:clamp(23px,6vw,34px);line-height:1.2;margin:0 0 10px}}
.lead,.meta{{line-height:1.65;color:#566159}}section{{margin:20px 0 28px}}
article{{background:#fff;border:1px solid #d9ddd8;border-radius:16px;padding:16px;margin:14px 0}}
h2{{font-size:22px}}h3{{margin:0 0 8px;font-size:18px}}article p{{margin:0 0 12px;line-height:1.55}}
audio{{display:block;width:100%}}.error{{color:#a33b2c}}details{{background:#fffdf8;border:1px solid #e0dccf;border-radius:12px;padding:12px}}
.script{{line-height:1.7}}code{{background:#ece7dc;border-radius:5px;padding:1px 5px}}
</style></head><body><main>
<h1>第1回 Part 1 Azure会話TTS比較</h1>
<p class="lead">既存方式と、Azure Speechの「複数voice SSML」「MultiTalker」を聞き比べるためのページです。</p>
<p class="meta">Azure音声は1問につき各方式1回のTTSリクエストで作ります。話者ごとの文を後から切って結合する方式ではありません。</p>
{''.join(cards)}
<p class="meta">Azureを使うには <code>AZURE_SPEECH_KEY</code> と <code>AZURE_SPEECH_REGION</code> をこのPCの環境変数に設定してから、生成スクリプトを <code>--execute</code> 付きで実行します。</p>
</main></body></html>"""
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "index.html").write_text(page, encoding="utf-8")


def run_execute(items: list[dict], output_dir: Path, region: str) -> dict:
    key = azure_key()
    if not key:
        raise RuntimeError("AZURE_SPEECH_KEY or SPEECH_KEY is not set")
    endpoint = azure_endpoint(region)
    report_items = []
    for item in items:
        outputs = copy_baseline(output_dir) if item["number"] == 1 else []
        for scenario in (MULTI_VOICE_SCENARIO, MULTITALKER_SCENARIO):
            scenario_key = scenario["key"]
            raw_path = output_dir / "_raw" / f"{item['id']}-{scenario_key}.mp3"
            mp3_path = output_dir / "audio" / f"{item['id']}-{scenario_key}.mp3"
            ssml_path = output_dir / "ssml" / f"{item['id']}-{scenario_key}.ssml"
            ssml = scenario_ssml(scenario_key, item)
            ssml_path.parent.mkdir(parents=True, exist_ok=True)
            ssml_path.write_text(ssml + "\n", encoding="utf-8")
            result = synthesize_azure(endpoint, key, ssml, raw_path)
            output = {
                "key": scenario_key,
                "label": scenario["label"],
                "description": scenario["description"],
                "ssml": str(ssml_path.relative_to(output_dir)),
                **result,
            }
            if result["ok"]:
                output["normalization"] = normalize_mp3(raw_path, mp3_path)
                output["mp3"] = mp3_path.relative_to(output_dir).as_posix()
                output["rawMp3"] = raw_path.relative_to(output_dir).as_posix()
                output["probe"] = probe_audio(mp3_path)
            outputs.append(output)
            time.sleep(0.5)
        report_items.append(
            {
                "id": item["id"],
                "number": item["number"],
                "parts": item_parts(item),
                "outputs": outputs,
            }
        )
    return {
        "mode": "completed",
        "provider": "azure-speech",
        "region": region,
        "endpointHost": endpoint.split("/")[2] if "://" in endpoint else endpoint,
        "outputFormat": AZURE_OUTPUT_FORMAT,
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "turnGap": TURN_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionLabelToText": QUESTION_LABEL_TO_TEXT_MS,
        },
        "items": report_items,
    }


def run_preflight(items: list[dict], output_dir: Path, region: str) -> dict:
    report_items = []
    for item in items:
        outputs = copy_baseline(output_dir) if item["number"] == 1 else []
        for scenario in (MULTI_VOICE_SCENARIO, MULTITALKER_SCENARIO):
            outputs.append(
                {
                    "key": scenario["key"],
                    "label": scenario["label"],
                    "description": scenario["description"],
                    "ok": False,
                    "reason": "Azureキー/リージョン設定後に --execute で生成",
                    "ssmlCharacters": len(scenario_ssml(scenario["key"], item)),
                }
            )
        report_items.append(
            {
                "id": item["id"],
                "number": item["number"],
                "parts": item_parts(item),
                "outputs": outputs,
            }
        )
    return {
        "mode": "preflight",
        "provider": "azure-speech",
        "readyToExecute": bool(azure_key() and region),
        "hasKey": bool(azure_key()),
        "hasRegion": bool(region),
        "outputFormat": AZURE_OUTPUT_FORMAT,
        "items": report_items,
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    args = parse_args()
    output_dir = args.output_dir.resolve()
    items = load_items(parse_numbers(args.numbers))
    report = (
        run_execute(items, output_dir, args.region.strip())
        if args.execute
        else run_preflight(items, output_dir, args.region.strip())
    )
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
