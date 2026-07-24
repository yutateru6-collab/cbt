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
from datetime import datetime, timezone
from pathlib import Path

import generate_grade2_round1_part1_azure_dialogue_comparison as azure
import generate_grade2_round1_azure_premium_compare as premium


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "audio-generation/azure-hd-minimal-48k-quality-test-20260719"
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/azure-hd-minimal-48k-quality-test-20260719"
)

OUTPUT_FORMAT = "riff-48khz-16bit-mono-pcm"
USER_AGENT = "scbt-azure-hd-minimal-48k-quality-test"
TEST_TEXT = "I should have told you earlier, but I didn't know how."

# The order is intentionally mixed so the first listening pass can be blind.
CONDITIONS = [
    {
        "blindLabel": "A",
        "key": "aria-standard-neural",
        "voice": "en-US-AriaNeural",
        "modelFamily": "Standard Neural",
        "parameters": None,
    },
    {
        "blindLabel": "B",
        "key": "andrew-hd-omni-t03",
        "voice": "en-US-Andrew:DragonHDOmniLatestNeural",
        "modelFamily": "Dragon HD Omni",
        "parameters": "temperature=0.3",
    },
    {
        "blindLabel": "C",
        "key": "emma2-dragon-hd-t03",
        "voice": "en-US-Emma2:DragonHDLatestNeural",
        "modelFamily": "Dragon HD",
        "parameters": "temperature=0.3",
    },
    {
        "blindLabel": "D",
        "key": "ava-hd-omni-t03",
        "voice": "en-US-Ava:DragonHDOmniLatestNeural",
        "modelFamily": "Dragon HD Omni",
        "parameters": "temperature=0.3",
    },
    {
        "blindLabel": "E",
        "key": "andrew2-dragon-hd-t03",
        "voice": "en-US-Andrew2:DragonHDLatestNeural",
        "modelFamily": "Dragon HD",
        "parameters": "temperature=0.3",
    },
]

FORBIDDEN_SSML_FRAGMENTS = (
    "<break",
    "express-as",
    "<prosody",
    "<emphasis",
    "<p>",
    "<s>",
    "enhancePronunciation",
    "top_p",
    "top_k",
    "cfg_scale",
)


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Generate a five-condition Azure TTS quality isolation test using "
            "minimal SSML and direct 48 kHz 16-bit mono PCM WAV output."
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


def minimal_ssml(condition: dict) -> str:
    parameter_attribute = ""
    if condition["parameters"]:
        parameter_attribute = (
            f' parameters="{html.escape(condition["parameters"], quote=True)}"'
        )
    return (
        '<speak version="1.0" '
        'xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">'
        f'<voice name="{html.escape(condition["voice"], quote=True)}"'
        f"{parameter_attribute}>"
        f"{html.escape(TEST_TEXT, quote=False)}"
        "</voice></speak>"
    )


def assert_minimal_ssml(ssml: str) -> None:
    lowered = ssml.lower()
    present = [fragment for fragment in FORBIDDEN_SSML_FRAGMENTS if fragment.lower() in lowered]
    if present:
        raise RuntimeError(f"Forbidden SSML fragments found: {present}")
    if lowered.count("<voice ") != 1 or lowered.count("</voice>") != 1:
        raise RuntimeError("Minimal SSML must contain exactly one voice element")
    if TEST_TEXT not in ssml:
        raise RuntimeError("Test text is missing from SSML")


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
        return {
            "ok": False,
            "httpStatus": error.code,
            "reason": str(error.reason),
            "detail": error.read().decode("utf-8", errors="replace")[:2000],
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


def inspect_wav(path: Path) -> dict:
    with wave.open(str(path), "rb") as wav_file:
        details = {
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


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        parameter_text = record["parameters"] or "なし"
        cards.append(
            f"""
            <section class="voice-card">
              <div class="card-head">
                <h2>{html.escape(record['blindLabel'])}</h2>
                <span class="format">48kHz · 16bit · PCM WAV</span>
              </div>
              <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}"></audio>
              <a class="download" href="{html.escape(record['publishedWav'])}" download>WAVをそのまま保存</a>
              <div class="identity" hidden>
                <strong>{html.escape(record['modelFamily'])}</strong>
                <code>{html.escape(record['voice'])}</code>
                <span>parameters: {html.escape(parameter_text)}</span>
              </div>
            </section>
            """
        )

    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Azure HD 最小SSML音質テスト</title>
  <style>
    :root {{ font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; color:#17231c; background:#f1eee7; }}
    * {{ box-sizing:border-box; }} body {{ margin:0; }}
    main {{ width:min(780px,calc(100% - 24px)); margin:auto; padding:28px 0 60px; }}
    h1 {{ margin:0 0 12px; font-size:clamp(28px,7vw,43px); line-height:1.15; }}
    .lead,.note {{ color:#526057; line-height:1.75; }}
    .contract {{ margin:18px 0; padding:15px 17px; background:#e5f0e9; border:1px solid #b9d0c2; border-radius:15px; line-height:1.7; }}
    .contract strong {{ display:block; color:#12603e; }}
    .sentence {{ margin:20px 0; padding:16px; background:#fff; border:1px solid #d7dcd8; border-radius:15px; font-size:18px; line-height:1.6; }}
    .toolbar {{ position:sticky; top:8px; z-index:5; display:flex; align-items:center; justify-content:space-between; gap:12px; margin:22px 0 28px; padding:12px 14px; background:rgba(255,255,255,.97); border:1px solid #d1d8d3; border-radius:16px; box-shadow:0 8px 25px rgba(29,49,38,.10); }}
    button {{ appearance:none; border:1px solid #176c49; border-radius:999px; padding:10px 15px; background:#176c49; color:#fff; font-weight:750; }}
    .voice-card {{ margin:18px 0; padding:18px; background:#fff; border:1px solid #d6dcd8; border-radius:18px; }}
    .card-head {{ display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px; }}
    h2 {{ margin:0; display:grid; place-items:center; width:42px; height:42px; border-radius:50%; background:#17231c; color:#fff; font-size:22px; }}
    .format {{ color:#176c49; font-size:13px; font-weight:750; }}
    audio {{ display:block; width:100%; }}
    .download {{ display:inline-block; margin-top:10px; color:#176c49; font-size:13px; font-weight:700; }}
    .identity {{ margin-top:14px; padding:12px; background:#f3f6f4; border-radius:12px; }}
    .identity strong,.identity code,.identity span {{ display:block; overflow-wrap:anywhere; }}
    .identity code {{ margin:5px 0; color:#294d39; }} .identity span {{ color:#657169; font-size:13px; }}
    @media (max-width:600px) {{
      main {{ width:min(100% - 16px,780px); padding-top:20px; }}
      .toolbar {{ align-items:flex-start; flex-direction:column; }}
      .voice-card {{ padding:14px; }}
    }}
  </style>
</head>
<body><main>
  <h1>Azure HD<br>最小SSML音質テスト</h1>
  <p class="lead">A〜Eを、まず声名を見ずに1.00倍で聴いてください。最もクリアなものと、ノイズ・金属感・こもりを感じるものを選びます。</p>
  <div class="contract">
    <strong>音質以外の変数を外しました</strong>
    同一1文／Azure REST直出し／48kHz・16bit・mono PCM WAV／速度変更なし／FFmpegなし／break・express-as・prosody・p・sなし。
  </div>
  <p class="sentence" lang="en">{html.escape(TEST_TEXT)}</p>
  <div class="toolbar">
    <span>① A〜Eを聴く　② 一番良い声を決める　③ 最後に答えを見る</span>
    <button id="reveal" type="button">声名を表示</button>
  </div>
  {''.join(cards)}
  <p class="note">音量はAzure原音のままで、正規化していません。1つ再生すると、ほかの音声は自動停止します。WAV保存リンクもブラウザ再生と同じファイルです。</p>
</main>
<script>
  const audios = [...document.querySelectorAll('audio')];
  audios.forEach(audio => audio.addEventListener('play', () => {{
    audios.forEach(other => {{ if (other !== audio) other.pause(); }});
  }}));
  const reveal = document.querySelector('#reveal');
  let shown = false;
  reveal.addEventListener('click', () => {{
    shown = !shown;
    document.querySelectorAll('.identity').forEach(node => node.hidden = !shown);
    reveal.textContent = shown ? '声名を隠す' : '声名を表示';
  }});
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
    endpoint = azure.azure_endpoint(args.region) if args.execute else ""
    key = azure.azure_key() if args.execute else ""
    if args.execute and not key:
        raise RuntimeError("AZURE_SPEECH_KEY or SPEECH_KEY is not set")

    records = []
    for condition in CONDITIONS:
        ssml = minimal_ssml(condition)
        assert_minimal_ssml(ssml)
        stem = f"{condition['blindLabel']}-{condition['key']}"
        ssml_path = output_dir / "ssml" / f"{stem}.ssml"
        wav_path = output_dir / "audio" / f"{stem}.wav"
        published_path = publish_dir / "audio" / wav_path.name
        ssml_path.parent.mkdir(parents=True, exist_ok=True)
        ssml_path.write_text(ssml + "\n", encoding="utf-8")
        record = {
            **condition,
            "text": TEST_TEXT,
            "ssml": ssml_path.relative_to(output_dir).as_posix(),
            "ssmlSha256": hashlib.sha256(ssml.encode("utf-8")).hexdigest(),
            "outputFormatRequested": OUTPUT_FORMAT,
            "oneAzureRequest": True,
            "singleVoice": True,
            "forbiddenSsmlPresent": False,
            "postSynthesisConversion": False,
            "lossyEncodingApplied": False,
            "remasterApplied": False,
            "playbackRateModification": False,
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
                    f"Azure synthesis failed for {stem}: "
                    + str(result.get("detail") or result.get("reason"))
                )
            record["wave"] = inspect_wav(wav_path)
            record["probe"] = azure.probe_audio(wav_path)
            record["loudness"] = premium.measure_loudness(wav_path)
            record["sha256"] = sha256(wav_path)
            published_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(wav_path, published_path)
            record["publishedSha256"] = sha256(published_path)
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
        "testText": TEST_TEXT,
        "textSha256": hashlib.sha256(TEST_TEXT.encode("utf-8")).hexdigest(),
        "outputFormat": OUTPUT_FORMAT,
        "trackCount": len(records),
        "apiRequestCount": len(records) if args.execute else 0,
        "qualityIsolationContract": {
            "sameText": True,
            "minimalSsml": True,
            "singleVoicePerFile": True,
            "temperatureOnlyForHd": 0.3,
            "break": False,
            "expressAs": False,
            "prosody": False,
            "paragraphTag": False,
            "sentenceTag": False,
            "ffmpeg": False,
            "postSynthesisConversion": False,
            "lossyEncoding": False,
            "remaster": False,
            "playbackRateModification": False,
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
