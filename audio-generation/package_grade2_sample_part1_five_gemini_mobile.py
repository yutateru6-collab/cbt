import hashlib
import html
import json
import math
import re
import wave
from array import array
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = (
    ROOT
    / "audio-generation"
    / "grade2-sample-part1-five-gemini-calm-batch-20260724"
)
OUTPUT_DIR = (
    ROOT
    / "audio-generation"
    / "cloudflare-publish"
    / "grade2-sample-part1-five-gemini-calm-20260724-final"
)
MANIFEST_PATH = ROOT / "audio-generation" / "grade2-sample-part1-full.json"
TARGET_ACTIVE_RMS_DBFS = -18.6
ACTIVE_THRESHOLD_DBFS = -50.0
PACE_REFERENCE_MEDIAN_WPS = 2.219
PACE_MIN_WPS = 1.85
PACE_MAX_WPS = 2.55
PACE_MAX_MEDIAN_WPS = 2.42


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def dbfs(value):
    if value <= 0:
        return None
    return round(20 * math.log10(value / 32768), 2)


def inspect_wav(path):
    with wave.open(str(path), "rb") as source:
        params = source.getparams()
        pcm = source.readframes(source.getnframes())
    if (
        params.nchannels != 1
        or params.sampwidth != 2
        or params.framerate != 24000
        or params.comptype != "NONE"
    ):
        raise RuntimeError(f"Unexpected WAV format: {path}")

    samples = array("h")
    samples.frombytes(pcm)
    if not samples:
        raise RuntimeError(f"Empty WAV: {path}")
    peak = max(abs(sample) for sample in samples)
    rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples))
    active_threshold = 32768 * (10 ** (ACTIVE_THRESHOLD_DBFS / 20))
    active_samples = [
        sample for sample in samples if abs(sample) >= active_threshold
    ]
    active_rms = math.sqrt(
        sum(sample * sample for sample in active_samples) / len(active_samples)
    )
    return {
        "sampleRate": params.framerate,
        "channels": params.nchannels,
        "sampleWidth": params.sampwidth,
        "frameCount": params.nframes,
        "durationSeconds": round(params.nframes / params.framerate, 3),
        "peakDbfs": dbfs(peak),
        "rmsDbfs": dbfs(rms),
        "activeRmsDbfs": dbfs(active_rms),
        "activeThresholdDbfs": ACTIVE_THRESHOLD_DBFS,
    }


def write_with_gain(source_path, output_path, gain_db):
    with wave.open(str(source_path), "rb") as source:
        params = source.getparams()
        pcm = source.readframes(source.getnframes())
    factor = 10 ** (gain_db / 20)
    samples = array("h")
    samples.frombytes(pcm)
    clipped = 0
    for index, sample in enumerate(samples):
        adjusted = round(sample * factor)
        if adjusted < -32768 or adjusted > 32767:
            clipped += 1
        samples[index] = max(-32768, min(32767, adjusted))
    if clipped:
        raise RuntimeError(f"Gain would clip {clipped} samples in {source_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output_path), "wb") as destination:
        destination.setparams(params)
        destination.writeframes(samples.tobytes())


def word_count(text):
    return len(re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)?|\d+", text))


def transcript_text(item):
    return "\n".join(
        f"{segment['speaker']}: {segment['text']}" for segment in item["segments"]
    )


def render_page(
    records,
    cost,
    lead_text=(
        "KoreとPuckの2人会話。Part 2に近い落ち着いた速度で、"
        "5問の音量を揃えた確認版です。"
    ),
):
    cards = []
    for record in records:
        source = f"{record['file']}?v={record['sha256'][:12]}"
        transcript = html.escape(record["transcript"])
        cards.append(
            f"""
        <article class="card">
          <div class="card-head">
            <div>
              <p class="number">No.{record['number']}</p>
              <p class="voices">Kore ＋ Puck</p>
            </div>
            <p class="duration">{record['durationSeconds']:.1f}秒</p>
          </div>
          <audio controls playsinline preload="metadata" src="{source}"></audio>
          <div class="actions">
            <a href="{source}" download>音声を保存</a>
            <span>{record['wordsPerSecond']:.2f}語/秒</span>
          </div>
          <details>
            <summary>スクリプトを見る</summary>
            <pre>{transcript}</pre>
          </details>
        </article>"""
        )
    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow">
  <meta name="theme-color" content="#17261f">
  <title>2級サンプル Part 1｜No.1〜5</title>
  <style>
    :root {{
      color-scheme: light;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", sans-serif;
      background: #edf1ed;
      color: #17211c;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      background: linear-gradient(180deg, #17261f 0 250px, #edf1ed 250px);
    }}
    main {{
      width: min(100% - 20px, 700px);
      margin: 0 auto;
      padding: max(28px, env(safe-area-inset-top)) 0 max(48px, env(safe-area-inset-bottom));
    }}
    header {{ color: #fff; padding: 4px 5px 28px; }}
    .eyebrow {{
      margin: 0 0 10px;
      color: #9fd9ba;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }}
    h1 {{ margin: 0; font-size: clamp(28px, 8vw, 44px); line-height: 1.13; }}
    .lead {{ margin: 14px 0 0; color: #d6e4dc; font-size: 15px; line-height: 1.7; }}
    .list {{ display: grid; gap: 13px; }}
    .card {{
      padding: 18px;
      border: 1px solid #d8e0da;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 9px 30px rgba(23, 38, 31, .08);
    }}
    .card-head {{ display: flex; align-items: start; justify-content: space-between; gap: 16px; }}
    .number {{ margin: 0; font-size: 23px; font-weight: 850; }}
    .voices {{ margin: 4px 0 13px; color: #5c6c63; font-size: 13px; font-weight: 700; }}
    .duration {{ margin: 4px 0 0; color: #66756d; font-size: 13px; font-variant-numeric: tabular-nums; }}
    audio {{ display: block; width: 100%; min-height: 44px; }}
    .actions {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 10px;
      color: #6b7971;
      font-size: 12px;
    }}
    .actions a {{ color: #176241; font-size: 14px; font-weight: 800; text-underline-offset: 3px; }}
    details {{ margin-top: 13px; border-top: 1px solid #e8ece9; padding-top: 12px; }}
    summary {{ cursor: pointer; color: #42534a; font-size: 13px; font-weight: 750; }}
    pre {{
      margin: 12px 0 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      color: #435048;
      font: 13px/1.7 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    .note {{
      margin: 20px 1px 0;
      padding: 15px 17px;
      border-radius: 14px;
      background: #dfe8e1;
      color: #415047;
      font-size: 13px;
      line-height: 1.7;
    }}
    .foot {{ margin: 15px 4px 0; color: #69766f; font-size: 11px; line-height: 1.7; }}
    @media (max-width: 480px) {{
      .card {{ padding: 15px 12px; border-radius: 15px; }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">S-CBT Listening Sample</p>
      <h1>2級 Part 1<br>No.1〜5</h1>
      <p class="lead">{html.escape(lead_text)}</p>
    </header>
    <section class="list">
      {''.join(cards)}
    </section>
    <p class="note">再生すると、ほかの問題は自動で一時停止します。スマホでは「音声を保存」から端末に保存できます。</p>
    <p class="foot">Gemini 3.1 Flash TTS Preview／Batch API／24kHz・16bit・mono WAV／速度・音程・EQ・圧縮変更なし／推定生成料金 ${cost:.5f}</p>
  </main>
  <script>
    const players = Array.from(document.querySelectorAll("audio"));
    players.forEach((player) => {{
      player.addEventListener("play", () => {{
        players.forEach((other) => {{
          if (other !== player) other.pause();
        }});
      }});
    }});
  </script>
</body>
</html>
"""


def main():
    if OUTPUT_DIR.exists():
        raise RuntimeError(f"Refusing to overwrite existing output directory: {OUTPUT_DIR}")
    plan = read_json(SOURCE_DIR / "batch-request-plan.json")
    generation = read_json(SOURCE_DIR / "generation-report.json")
    manifest = read_json(MANIFEST_PATH)
    manifest_items = {
        item["id"]: item
        for item in manifest["items"]
        if 1 <= int(item["number"]) <= 5
    }
    if [item["id"] for item in plan["items"]] != [
        item["id"] for item in generation["items"]
    ]:
        raise RuntimeError("Batch plan and generation report do not match")
    if len(plan["items"]) != 5 or len(manifest_items) != 5:
        raise RuntimeError("Exactly five Part 1 items are required")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=False)
    records = []
    for plan_item in plan["items"]:
        item_id = plan_item["id"]
        number = int(plan_item["number"])
        source_path = SOURCE_DIR / f"{item_id}.wav"
        source_metrics = inspect_wav(source_path)
        gain_db = round(
            TARGET_ACTIVE_RMS_DBFS - source_metrics["activeRmsDbfs"],
            2,
        )
        output_path = OUTPUT_DIR / "audio" / (
            f"sample-part1-no{number:02d}-kore-puck-v20260724-final.wav"
        )
        write_with_gain(source_path, output_path, gain_db)
        delivery_metrics = inspect_wav(output_path)
        if delivery_metrics["frameCount"] != source_metrics["frameCount"]:
            raise RuntimeError(f"Frame count changed for {item_id}")
        if delivery_metrics["durationSeconds"] != source_metrics["durationSeconds"]:
            raise RuntimeError(f"Duration changed for {item_id}")
        if (
            round(
                abs(delivery_metrics["activeRmsDbfs"] - TARGET_ACTIVE_RMS_DBFS),
                2,
            )
            > 0.25
        ):
            raise RuntimeError(f"Loudness target was not reached for {item_id}")

        manifest_item = manifest_items[item_id]
        transcript = transcript_text(manifest_item)
        words = sum(
            word_count(segment["text"])
            for segment in manifest_item["segments"]
        )
        words_per_second = round(
            words / delivery_metrics["durationSeconds"],
            3,
        )
        records.append(
            {
                "id": item_id,
                "number": number,
                "voices": plan_item["voices"],
                "sourceFile": source_path.name,
                "sourceSha256": sha256(source_path),
                "file": str(output_path.relative_to(OUTPUT_DIR)).replace("\\", "/"),
                "sha256": sha256(output_path),
                "gainDb": gain_db,
                "wordCount": words,
                "wordsPerSecond": words_per_second,
                "paceInApprovedPart2ObservedRange": (
                    PACE_MIN_WPS <= words_per_second <= PACE_MAX_WPS
                ),
                "transcript": transcript,
                "sourceMetrics": source_metrics,
                **delivery_metrics,
            }
        )

    median_wps = sorted(record["wordsPerSecond"] for record in records)[2]
    if any(not record["paceInApprovedPart2ObservedRange"] for record in records):
        raise RuntimeError("At least one Part 1 item is outside the Part 2 pace range")
    if median_wps > PACE_MAX_MEDIAN_WPS:
        raise RuntimeError(
            f"Part 1 median pace is still too fast: {median_wps} words/second"
        )

    cost = generation["estimatedBatchCostUsd"]["total"]
    report = {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "model": plan["model"],
        "billingMode": plan["billingMode"],
        "requestCount": len(records),
        "sourceBatchJob": generation["batchJob"],
        "usageTotals": generation["usageTotals"],
        "estimatedBatchCostUsd": generation["estimatedBatchCostUsd"],
        "voiceBlock": plan["voiceBlock"],
        "paceValidation": {
            "approvedPart2MedianWordsPerSecond": PACE_REFERENCE_MEDIAN_WPS,
            "approvedPart2ObservedRangeWordsPerSecond": [
                PACE_MIN_WPS,
                PACE_MAX_WPS,
            ],
            "part1MedianWordsPerSecond": median_wps,
            "maximumAcceptedPart1MedianWordsPerSecond": PACE_MAX_MEDIAN_WPS,
            "speedProcessing": False,
        },
        "loudnessProcessing": {
            "targetActiveRmsDbfs": TARGET_ACTIVE_RMS_DBFS,
            "method": "one constant linear PCM gain per complete item",
            "nativeProviderFilesPreserved": True,
            "normalization": False,
            "eq": False,
            "compression": False,
            "resampling": False,
        },
        "items": records,
    }
    write_json(OUTPUT_DIR / "generation-and-publish-report.json", report)
    (OUTPUT_DIR / "index.html").write_text(
        render_page(records, cost),
        encoding="utf-8",
    )
    (OUTPUT_DIR / "_headers").write_text(
        """/
  Cache-Control: no-cache

/index.html
  Cache-Control: no-cache

/audio/*
  Content-Type: audio/wav
  Accept-Ranges: bytes
  Cache-Control: public, max-age=31536000, immutable
""",
        encoding="utf-8",
    )
    print(f"Packaged {len(records)} WAV files in {OUTPUT_DIR}")
    print(f"Median pace: {median_wps:.3f} words/second")
    print(
        "Delivery active RMS: "
        + ", ".join(
            f"{record['id']}={record['activeRmsDbfs']:.2f} dBFS"
            for record in records
        )
    )
    print(f"Estimated Batch cost: ${cost:.6f} USD")


if __name__ == "__main__":
    main()
