import hashlib
import html
import json
import math
import shutil
import statistics
import wave
from array import array
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = (
    ROOT
    / "audio-generation"
    / "grade2-round1-to-3-part2-gemini-3.1-flash-batch-20260723"
)
OUTPUT_DIR = (
    ROOT
    / "audio-generation"
    / "cloudflare-publish"
    / "grade2-round1-to-3-part2-gemini31-20260723"
)
KORE_GAIN_DB = -3.0
ACTIVE_THRESHOLD_DBFS = -50.0
REFERENCE_DIRS = {
    "Kore": (
        ROOT
        / "audio-generation"
        / "grade2-sample-part2-kore-minus3db-20260723"
    ),
    "Achird": (
        ROOT
        / "audio-generation"
        / "grade2-sample-part2-gemini-3.1-flash-batch-full-20260723"
    ),
    "Zephyr": (
        ROOT
        / "audio-generation"
        / "grade2-sample-part2-gemini-3.1-flash-batch-zephyr-26-30-20260723"
    ),
}
REFERENCE_NUMBERS = {
    "Kore": range(16, 21),
    "Achird": range(21, 26),
    "Zephyr": range(26, 31),
}


def utc_now():
    return datetime.now(timezone.utc).isoformat()


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
        channels = source.getnchannels()
        sample_width = source.getsampwidth()
        sample_rate = source.getframerate()
        frame_count = source.getnframes()
        compression = source.getcomptype()
        pcm = source.readframes(frame_count)

    if channels != 1 or sample_width != 2 or sample_rate != 24000:
        raise RuntimeError(
            f"Unexpected WAV format for {path}: "
            f"{sample_rate} Hz, {channels} channel(s), {sample_width} bytes"
        )
    if compression != "NONE":
        raise RuntimeError(f"Compressed WAV is not allowed: {path}")

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
    active_rms = (
        math.sqrt(
            sum(sample * sample for sample in active_samples) / len(active_samples)
        )
        if active_samples
        else 0
    )
    return {
        "sampleRate": sample_rate,
        "channels": channels,
        "sampleWidth": sample_width,
        "frameCount": frame_count,
        "durationSeconds": round(frame_count / sample_rate, 3),
        "peakDbfs": dbfs(peak),
        "rmsDbfs": dbfs(rms),
        "activeRmsDbfs": dbfs(active_rms),
        "activeThresholdDbfs": ACTIVE_THRESHOLD_DBFS,
    }


def write_with_gain(source_path, output_path, gain_db):
    with wave.open(str(source_path), "rb") as source:
        params = source.getparams()
        pcm = source.readframes(source.getnframes())
    if (
        params.nchannels != 1
        or params.sampwidth != 2
        or params.framerate != 24000
        or params.comptype != "NONE"
    ):
        raise RuntimeError(f"Unexpected source WAV format: {source_path}")

    factor = 10 ** (gain_db / 20)
    samples = array("h")
    samples.frombytes(pcm)
    for index, sample in enumerate(samples):
        adjusted = round(sample * factor)
        samples[index] = max(-32768, min(32767, adjusted))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output_path), "wb") as destination:
        destination.setparams(params)
        destination.writeframes(samples.tobytes())


def reference_medians():
    result = {}
    for voice, directory in REFERENCE_DIRS.items():
        measurements = []
        for number in REFERENCE_NUMBERS[voice]:
            path = directory / f"No{number:02d}.wav"
            if not path.exists():
                raise RuntimeError(f"Approved reference WAV missing: {path}")
            measurements.append(inspect_wav(path))
        active_values = [
            measurement["activeRmsDbfs"]
            for measurement in measurements
            if measurement["activeRmsDbfs"] is not None
        ]
        result[voice] = {
            "files": len(measurements),
            "medianActiveRmsDbfs": round(statistics.median(active_values), 2),
            "minimumActiveRmsDbfs": round(min(active_values), 2),
            "maximumActiveRmsDbfs": round(max(active_values), 2),
        }
    return result


def validate_source(plan, generation_report):
    items = plan.get("items") or []
    report_items = generation_report.get("items") or []
    if len(items) != 45 or plan.get("requestCount") != 45:
        raise RuntimeError("Batch plan must contain exactly 45 requests")
    if len(report_items) != 45 or generation_report.get("requestCount") != 45:
        raise RuntimeError("Generation report must contain exactly 45 results")
    plan_ids = [item["id"] for item in items]
    report_ids = [item["id"] for item in report_items]
    if plan_ids != report_ids:
        raise RuntimeError("Plan and generation-report item order do not match")
    if len(set(plan_ids)) != 45:
        raise RuntimeError("Duplicate item ids found")


def render_page(records, usage, reference):
    grouped = {"set-01": [], "set-02": [], "set-03": []}
    for record in records:
        grouped[record["setKey"]].append(record)

    labels = {"set-01": "第1回", "set-02": "第2回", "set-03": "第3回"}
    sections = []
    for set_key, items in grouped.items():
        cards = []
        for record in items:
            source = (
                f"audio/{record['setKey']}/No{record['number']:02d}.wav"
                f"?v={record['sha256'][:12]}"
            )
            cards.append(
                f"""
        <article class="card">
          <div class="meta">
            <span class="number">No. {record['number']}</span>
            <span class="voice">{html.escape(record['voice'])}</span>
          </div>
          <audio controls preload="metadata" playsinline src="{source}"></audio>
          <details>
            <summary>原稿を確認</summary>
            <p>{html.escape(record['script'])}</p>
            <p class="question"><strong>Question.</strong> {html.escape(record['questionText'])}</p>
          </details>
        </article>"""
            )
        sections.append(
            f"""
      <section id="{set_key}" class="round" data-round="{set_key}">
        <div class="round-head">
          <p class="eyebrow">PART 2 · 15 QUESTIONS</p>
          <h2>{labels[set_key]}</h2>
        </div>
        <div class="cards">{''.join(cards)}</div>
      </section>"""
        )

    estimated = usage.get("estimatedBatchCostUsd", {}).get("total")
    cost_text = (
        f"Batch使用量記録：推定 ${estimated:.6f} USD"
        if isinstance(estimated, (int, float))
        else "Batch使用量は生成レポートに記録済み"
    )
    reference_text = " / ".join(
        f"{voice} {values['medianActiveRmsDbfs']:.2f} dBFS"
        for voice, values in reference.items()
    )
    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#102a43">
  <title>英検2級 リスニング Part 2｜第1回〜第3回</title>
  <style>
    :root {{
      color-scheme: light;
      --ink:#102a43;
      --muted:#627d98;
      --line:#d9e2ec;
      --paper:#ffffff;
      --wash:#f0f4f8;
      --accent:#0f766e;
      --accent-soft:#dff4ef;
    }}
    * {{ box-sizing:border-box; }}
    body {{
      margin:0;
      color:var(--ink);
      background:linear-gradient(180deg,#e8f0f6 0,#f7fafc 280px);
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Yu Gothic",sans-serif;
    }}
    main {{ width:min(920px,100%); margin:0 auto; padding:34px 16px 72px; }}
    .hero {{ padding:18px 4px 22px; }}
    .eyebrow {{ margin:0 0 7px; color:var(--accent); font-size:.76rem; font-weight:800; letter-spacing:.12em; }}
    h1 {{ margin:0; font-size:clamp(1.75rem,7vw,3rem); line-height:1.12; letter-spacing:-.035em; }}
    .lead {{ margin:14px 0 0; color:var(--muted); line-height:1.7; }}
    .tabs {{
      position:sticky; top:8px; z-index:5; display:grid; grid-template-columns:repeat(3,1fr);
      gap:7px; margin:12px 0 28px; padding:7px; border:1px solid rgba(217,226,236,.92);
      border-radius:16px; background:rgba(255,255,255,.94); box-shadow:0 9px 28px rgba(16,42,67,.10);
      backdrop-filter:blur(10px);
    }}
    .tab {{
      min-height:44px; border:0; border-radius:11px; color:var(--muted); background:transparent;
      font:inherit; font-weight:800; cursor:pointer;
    }}
    .tab[aria-selected="true"] {{ color:white; background:var(--accent); }}
    .round {{ display:none; }}
    .round.active {{ display:block; }}
    .round-head {{ display:flex; align-items:end; justify-content:space-between; margin:0 2px 14px; }}
    h2 {{ margin:0; font-size:1.6rem; }}
    .cards {{ display:grid; gap:12px; }}
    .card {{
      padding:16px; border:1px solid var(--line); border-radius:17px; background:var(--paper);
      box-shadow:0 5px 17px rgba(16,42,67,.055);
    }}
    .meta {{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:11px; }}
    .number {{ font-size:1.05rem; font-weight:850; }}
    .voice {{
      padding:5px 10px; border-radius:999px; color:var(--accent); background:var(--accent-soft);
      font-size:.79rem; font-weight:800;
    }}
    audio {{ width:100%; display:block; }}
    details {{ margin-top:11px; border-top:1px solid var(--line); padding-top:10px; }}
    summary {{ color:var(--muted); font-size:.86rem; font-weight:750; cursor:pointer; }}
    details p {{ margin:10px 0 0; color:#334e68; font-size:.9rem; line-height:1.65; }}
    .question {{ color:var(--ink); }}
    footer {{ margin-top:30px; padding:18px 3px; border-top:1px solid var(--line); color:var(--muted); font-size:.78rem; line-height:1.7; }}
    @media (min-width:720px) {{
      main {{ padding-left:24px; padding-right:24px; }}
      .cards {{ grid-template-columns:repeat(2,minmax(0,1fr)); }}
    }}
  </style>
</head>
<body>
  <main>
    <header class="hero">
      <p class="eyebrow">GEMINI 3.1 FLASH TTS · BATCH</p>
      <h1>英検2級 リスニング<br>Part 2｜第1回〜第3回</h1>
      <p class="lead">全45問。5問ごとに声を切り替えています。スマートフォンでは上の回を選び、各問題の再生ボタンを押してください。</p>
    </header>
    <nav class="tabs" aria-label="回を選択">
      <button class="tab" data-target="set-01" aria-selected="true">第1回</button>
      <button class="tab" data-target="set-02" aria-selected="false">第2回</button>
      <button class="tab" data-target="set-03" aria-selected="false">第3回</button>
    </nav>
    {''.join(sections)}
    <footer>
      <div>{html.escape(cost_text)}</div>
      <div>承認済みサンプルの基準中央値：{html.escape(reference_text)}</div>
    </footer>
  </main>
  <script>
    const tabs = [...document.querySelectorAll(".tab")];
    const rounds = [...document.querySelectorAll(".round")];
    function activate(id) {{
      document.querySelectorAll("audio").forEach((audio) => audio.pause());
      tabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.target === id)));
      rounds.forEach((round) => round.classList.toggle("active", round.id === id));
      history.replaceState(null, "", `#${{id}}`);
    }}
    tabs.forEach((tab) => tab.addEventListener("click", () => activate(tab.dataset.target)));
    const initial = rounds.some((round) => `#${{round.id}}` === location.hash)
      ? location.hash.slice(1)
      : "set-01";
    activate(initial);
  </script>
</body>
</html>
"""


def main():
    plan_path = SOURCE_DIR / "batch-request-plan.json"
    generation_report_path = SOURCE_DIR / "generation-report.json"
    if OUTPUT_DIR.exists():
        raise RuntimeError(f"Refusing to overwrite existing output directory: {OUTPUT_DIR}")
    if not plan_path.exists() or not generation_report_path.exists():
        raise RuntimeError("Collect the successful Batch results before packaging")

    plan = read_json(plan_path)
    generation_report = read_json(generation_report_path)
    validate_source(plan, generation_report)
    references = reference_medians()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=False)
    records = []
    for item in plan["items"]:
        source_path = SOURCE_DIR / f"{item['id']}.wav"
        if not source_path.exists():
            raise RuntimeError(f"Collected WAV missing: {source_path}")
        voice = item["voices"]["N"]
        set_key = item["setKey"]
        number = int(item["number"])
        output_path = OUTPUT_DIR / "audio" / set_key / f"No{number:02d}.wav"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        gain_db = KORE_GAIN_DB if voice == "Kore" else 0.0
        if gain_db:
            write_with_gain(source_path, output_path, gain_db)
        else:
            shutil.copy2(source_path, output_path)

        measurement = inspect_wav(output_path)
        reference_value = references[voice]["medianActiveRmsDbfs"]
        difference = round(measurement["activeRmsDbfs"] - reference_value, 2)
        records.append(
            {
                "id": item["id"],
                "setKey": set_key,
                "setLabel": item["setLabel"],
                "number": number,
                "voice": voice,
                "gainDb": gain_db,
                "sourceFile": source_path.name,
                "file": str(output_path.relative_to(OUTPUT_DIR)).replace("\\", "/"),
                "bytes": output_path.stat().st_size,
                "sha256": sha256(output_path),
                "script": item["segments"][1]["text"],
                "questionText": item["segments"][2]["text"].removeprefix("Question. "),
                "referenceMedianActiveRmsDbfs": reference_value,
                "differenceFromReferenceDb": difference,
                "reviewVolumeOutlier": abs(difference) > 3.0,
                **measurement,
            }
        )

    report = {
        "createdAt": utc_now(),
        "model": plan["model"],
        "billingMode": plan["billingMode"],
        "requestCount": len(records),
        "sourceBatchJob": generation_report["batchJob"],
        "usageTotals": generation_report["usageTotals"],
        "estimatedBatchCostUsd": generation_report["estimatedBatchCostUsd"],
        "voiceRotation": plan["voiceRotation"],
        "postProcessing": {
            "KoreGainDb": KORE_GAIN_DB,
            "AchirdGainDb": 0.0,
            "ZephyrGainDb": 0.0,
            "normalization": False,
            "eq": False,
            "compression": False,
            "speedChange": False,
        },
        "approvedSampleReference": references,
        "volumeOutlierThresholdDb": 3.0,
        "volumeOutlierCount": sum(record["reviewVolumeOutlier"] for record in records),
        "items": records,
    }
    write_json(OUTPUT_DIR / "generation-and-publish-report.json", report)
    (OUTPUT_DIR / "index.html").write_text(
        render_page(records, generation_report, references),
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
    print(f"Volume outliers: {report['volumeOutlierCount']}")
    print(
        "Estimated Batch cost: "
        f"${report['estimatedBatchCostUsd']['total']:.6f} USD"
    )


if __name__ == "__main__":
    main()
