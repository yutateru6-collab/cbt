import argparse
import hashlib
import html
import http.client
import json
import shutil
import sys
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

import generate_grade2_round1_dragon_hd_omni_slow_clear_three as dragon
import generate_grade2_round1_part1_azure_dialogue_comparison as azure
import generate_grade2_round1_azure_premium_compare as premium


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = (
    ROOT
    / "audio-generation/grade2-round1-part1-dragon-hd-omni-48k-wav-direct-20260719"
)
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-round1-part1-dragon-hd-omni-48k-wav-direct-20260719"
)

OUTPUT_FORMAT = "riff-48khz-16bit-mono-pcm"
USER_AGENT = "scbt-dragon-hd-omni-48k-wav-direct"
NUMBERS = (1, 2, 3)

NUMBER_TO_BODY_MS = 1350
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1300
QUESTION_TO_TEXT_MS = 350


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Generate Grade 2 Round 1 Part 1 No.1-3 as direct Azure "
            "48 kHz 16-bit mono PCM WAV files, one request per question."
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


def prompted_voice_with_pause_xml(
    voice_name: str,
    prompt: str,
    content: str,
    pause_after_ms: int | None,
    *,
    block: str = "sentence",
) -> str:
    if block == "paragraph":
        marked_content = f"<p>{dragon.xml_text(content)}</p>"
    else:
        marked_content = f"<s>{dragon.xml_text(content)}</s>"
    pause = f'<break time="{pause_after_ms}ms"/>' if pause_after_ms else ""
    return (
        f'<voice name="{html.escape(voice_name, quote=True)}" '
        f'parameters="{html.escape(dragon.VOICE_PARAMETERS, quote=True)}">'
        f'<mstts:express-as style="{html.escape(prompt, quote=True)}">'
        f"{marked_content}</mstts:express-as>{pause}</voice>"
    )


def item_ssml(item: dict) -> str:
    voices = item["voices"]
    pieces = [
        prompted_voice_with_pause_xml(
            voices["narrator"],
            dragon.NUMBER_PROMPT,
            f"Number {dragon.NUMBER_WORDS[item['number']] }.",
            NUMBER_TO_BODY_MS,
            block="paragraph",
        )
    ]
    for index, turn in enumerate(item["turns"]):
        pieces.append(
            prompted_voice_with_pause_xml(
                voices[turn["speaker"]],
                dragon.DIALOGUE_PROMPT,
                dragon.safe_text(item["number"], turn["text"]),
                BODY_TO_QUESTION_MS
                if index == len(item["turns"]) - 1
                else TURN_GAP_MS,
            )
        )
    pieces.extend(
        [
            prompted_voice_with_pause_xml(
                voices["narrator"],
                dragon.QUESTION_PROMPT,
                "Question.",
                QUESTION_TO_TEXT_MS,
            ),
            prompted_voice_with_pause_xml(
                voices["narrator"],
                dragon.QUESTION_PROMPT,
                dragon.safe_text(item["number"], item["questionText"]),
                None,
            ),
        ]
    )
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        'xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">'
        + "".join(pieces)
        + "</speak>"
    )


def synthesize_direct_wav(
    endpoint: str,
    key: str,
    ssml: str,
    destination: Path,
) -> dict:
    request = urllib.request.Request(
        endpoint,
        data=ssml.encode("utf-8"),
        method="POST",
        headers={
            "Ocp-Apim-Subscription-Key": key,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": OUTPUT_FORMAT,
            "User-Agent": USER_AGENT,
        },
    )
    started = time.time()
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            audio_bytes = response.read()
            if not audio_bytes.startswith(b"RIFF") or audio_bytes[8:12] != b"WAVE":
                raise RuntimeError("Azure response was not a RIFF/WAVE file")
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
            "reason": str(error.reason),
            "detail": detail[:2000],
            "elapsedSeconds": round(time.time() - started, 3),
        }


def synthesize_with_retry(
    endpoint: str,
    key: str,
    ssml: str,
    destination: Path,
    max_attempts: int = 3,
) -> tuple[dict, list[dict]]:
    retryable_statuses = {408, 429, 500, 502, 503, 504}
    attempts = []
    for attempt_number in range(1, max_attempts + 1):
        try:
            result = synthesize_direct_wav(endpoint, key, ssml, destination)
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


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source_file:
        for chunk in iter(lambda: source_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inspect_wave(path: Path) -> dict:
    with wave.open(str(path), "rb") as wav_file:
        return {
            "channels": wav_file.getnchannels(),
            "sampleWidthBytes": wav_file.getsampwidth(),
            "bitsPerSample": wav_file.getsampwidth() * 8,
            "sampleRateHz": wav_file.getframerate(),
            "frameCount": wav_file.getnframes(),
            "durationSeconds": round(
                wav_file.getnframes() / wav_file.getframerate(), 3
            ),
            "compressionType": wav_file.getcomptype(),
        }


def assert_direct_pcm_wav(path: Path) -> dict:
    details = inspect_wave(path)
    expected = {
        "channels": 1,
        "bitsPerSample": 16,
        "sampleRateHz": 48000,
        "compressionType": "NONE",
    }
    mismatches = {
        key: {"expected": value, "actual": details.get(key)}
        for key, value in expected.items()
        if details.get(key) != value
    }
    if mismatches:
        raise RuntimeError(f"Unexpected WAV format for {path.name}: {mismatches}")
    return details


def display_script(item: dict) -> str:
    rows = "".join(
        f'<p><strong>{html.escape(turn["speaker"])}</strong> '
        f'{html.escape(turn["text"])}</p>'
        for turn in item["turns"]
    )
    return rows + (
        f'<p class="question"><strong>Question</strong> '
        f'{html.escape(item["questionText"])}</p>'
    )


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        cards.append(
            f"""
            <section class="question-card">
              <div class="question-head">
                <h2>Number {record['number']}</h2>
                <span>Ava × Andrew／ナレーター Emma</span>
              </div>
              <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}"></audio>
              <div class="format">48kHz · 16bit · PCM · mono · WAV</div>
              <details>
                <summary>英文を見る</summary>
                {record['displayScriptHtml']}
              </details>
            </section>
            """
        )

    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Part 1｜Azure 48kHz PCM WAV直出し</title>
  <style>
    :root {{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#14231b; background:#f3f0e9; }}
    * {{ box-sizing:border-box; }} body {{ margin:0; }}
    main {{ width:min(820px,calc(100% - 24px)); margin:auto; padding:28px 0 60px; }}
    h1 {{ margin:0 0 12px; font-size:clamp(27px,7vw,43px); line-height:1.15; }}
    .lead,.note {{ color:#526158; line-height:1.75; }}
    .direct {{ margin:18px 0; padding:15px 17px; background:#e6f1eb; border:1px solid #b8d1c3; border-radius:15px; line-height:1.7; }}
    .direct strong {{ display:block; color:#125f3e; }}
    .toolbar {{ position:sticky; top:8px; z-index:5; display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:22px 0 28px; padding:12px; background:rgba(255,255,255,.96); border:1px solid #d3d9d5; border-radius:16px; box-shadow:0 8px 25px rgba(29,49,38,.10); }}
    .toolbar strong {{ margin-right:auto; }}
    button {{ appearance:none; border:1px solid #929f97; border-radius:999px; padding:9px 14px; background:#fff; color:#20372a; font-weight:750; }}
    button.active {{ background:#156c47; color:#fff; border-color:#156c47; }}
    .quality-note {{ width:100%; margin:2px 0 0; color:#6b746e; font-size:13px; }}
    .question-card {{ margin:18px 0 25px; padding:19px; background:#fff; border:1px solid #d7ddd8; border-radius:19px; }}
    .question-head {{ display:flex; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:14px; }}
    h2 {{ margin:0; font-size:24px; }} .question-head span {{ color:#156c47; font-size:14px; font-weight:750; }}
    audio {{ display:block; width:100%; }}
    .format {{ display:inline-block; margin-top:10px; padding:5px 9px; border-radius:999px; background:#eef3f0; color:#4f6056; font-size:12px; font-weight:700; }}
    details {{ margin-top:15px; padding-top:13px; border-top:1px solid #e2e6e3; }}
    summary {{ cursor:pointer; font-weight:750; }} details p {{ line-height:1.65; }} details strong {{ display:inline-block; min-width:28px; }}
    .question {{ margin-top:16px; }}
    @media (max-width:680px) {{
      main {{ width:min(100% - 16px,820px); padding-top:20px; }}
      .toolbar strong {{ width:100%; margin:0; }} .question-card {{ padding:14px; }}
    }}
  </style>
</head>
<body><main>
  <h1>Part 1<br>48kHz PCM WAV 直出し</h1>
  <p class="lead">Dragon HD Omni（Ava／Andrew／Emma）で3問作成。ゆっくり・はっきり・丁寧に読むようAzureへ指示しています。</p>
  <div class="direct">
    <strong>Azureの返却WAVをそのまま配信</strong>
    MP3変換なし／再圧縮なし／EQなし／リマスターなし／後からの音源連結なし。各問題は、番号から最後の質問まで1回のAzureリクエストで生成しています。
  </div>
  <div class="toolbar">
    <strong>再生速度</strong>
    <button type="button" data-rate="0.87">0.87</button>
    <button type="button" data-rate="0.90">0.90</button>
    <button type="button" data-rate="1.00" class="active">1.00</button>
    <p class="quality-note">音質を判断するときは1.00で聴いてください。0.87／0.90はスマホ側の再生速度変更です。</p>
  </div>
  {''.join(cards)}
  <p class="note">間隔：問題番号後1.35秒／会話ターン間0.55秒／会話後1.3秒／“Question.”後0.35秒。すべて同じ1つのSSML内で指定しています。</p>
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
    items = [item for item in dragon.load_items() if item["part"] == "part1"]
    if tuple(item["number"] for item in items) != NUMBERS:
        raise RuntimeError("Expected Part 1 No.1, No.2, and No.3")
    dragon.assert_safe_inputs(items)

    endpoint = azure.azure_endpoint(args.region) if args.execute else ""
    key = azure.azure_key() if args.execute else ""
    if args.execute and not key:
        raise RuntimeError("AZURE_SPEECH_KEY or SPEECH_KEY is not set")

    records = []
    for item in items:
        track_id = f"part1-{item['id']}-dragon-hd-omni-48k-pcm-direct"
        ssml = item_ssml(item)
        ssml_path = output_dir / "ssml" / f"{track_id}.ssml"
        wav_path = output_dir / "audio" / f"{track_id}.wav"
        published_path = publish_dir / "audio" / wav_path.name
        ssml_path.parent.mkdir(parents=True, exist_ok=True)
        ssml_path.write_text(ssml + "\n", encoding="utf-8")
        record = {
            "id": item["id"],
            "number": item["number"],
            "voices": item["voices"],
            "questionText": item["questionText"],
            "displayScriptHtml": display_script(item),
            "ssml": ssml_path.relative_to(output_dir).as_posix(),
            "outputFormatRequested": OUTPUT_FORMAT,
            "oneAzureRequest": True,
            "sentenceLevelGeneration": False,
            "postSynthesisConcatenation": False,
            "postSynthesisConversion": False,
            "lossyEncodingApplied": False,
            "remasterApplied": False,
            "ok": False,
        }
        if args.execute:
            result, attempts = synthesize_with_retry(
                endpoint, key, ssml, wav_path
            )
            record["azure"] = result
            record["attempts"] = attempts
            if not result.get("ok"):
                raise RuntimeError(
                    f"Azure synthesis failed for {track_id}: "
                    + str(result.get("detail") or result.get("reason"))
                )
            record["wave"] = assert_direct_pcm_wav(wav_path)
            record["probe"] = azure.probe_audio(wav_path)
            record["loudness"] = premium.measure_loudness(wav_path)
            record["silenceIntervals"] = premium.detect_silence(wav_path)
            record["sha256"] = sha256(wav_path)
            published_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(wav_path, published_path)
            record["publishedSha256"] = sha256(published_path)
            if record["sha256"] != record["publishedSha256"]:
                raise RuntimeError(f"Published copy differs for {track_id}")
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
        "provider": "Azure Speech",
        "region": args.region,
        "part": "Part 1",
        "numbers": list(NUMBERS),
        "trackCount": len(records),
        "apiRequestCount": len(records) if args.execute else 0,
        "outputFormat": OUTPUT_FORMAT,
        "sourceDeliveryContract": {
            "azureDirectWav": True,
            "sampleRateHz": 48000,
            "bitsPerSample": 16,
            "channels": 1,
            "codec": "PCM",
            "postSynthesisConversion": False,
            "lossyEncodingApplied": False,
            "remasterApplied": False,
        },
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "turnGap": TURN_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionToText": QUESTION_TO_TEXT_MS,
        },
        "naturalLanguagePrompt": dragon.DIALOGUE_PROMPT,
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
