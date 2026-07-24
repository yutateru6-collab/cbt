import html
import json
import math
import wave
from array import array
from datetime import datetime, timezone
from pathlib import Path

import audit_grade2_sample_part1_speaker_candidates as speaker_qa
import package_grade2_sample_part1_five_gemini_mobile as audio_info


ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "audio-generation" / "grade2-sample-part1-full.json"
QA_PLAN_PATH = (
    ROOT
    / "audio-generation"
    / "grade2-sample-part1-speaker-verified-candidates-20260724"
    / "batch-request-plan.json"
)
OUTPUT_DIR = (
    ROOT
    / "audio-generation"
    / "cloudflare-publish"
    / "grade2-sample-part1-speaker-verified-20260724-v3-final"
)
TARGET_ACTIVE_RMS_DBFS = -18.6
MINIMUM_AFTER_NUMBER_MS = 800
MAXIMUM_AFTER_NUMBER_MS = 1100
TARGET_AFTER_NUMBER_MS = 900
MINIMUM_AFTER_QUESTION_MS = 600
MAXIMUM_AFTER_QUESTION_MS = 1000
TARGET_AFTER_QUESTION_MS = 600
QUESTION_GAP_MINIMUM_MS = 180
SHORT_GAP_THRESHOLD = 500
SHORT_GAP_MINIMUM_MS = 20

SELECTIONS = {
    1: {
        "candidateId": "No01-c2",
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-speaker-verified-candidates-20260724"
            / "No01-c2.wav"
        ),
    },
    2: {
        "candidateId": "No02-c1-medium",
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-speaker-verified-retry-no02-medium-20260724"
            / "No02-c1.wav"
        ),
    },
    3: {
        "candidateId": "No03-c2",
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-speaker-verified-candidates-20260724"
            / "No03-c2.wav"
        ),
    },
    4: {
        "candidateId": "No04-verified-prior-candidate",
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-gemini-spacing-244-retry-20260724"
            / "No04.wav"
        ),
    },
    5: {
        "candidateId": "No05-c2",
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-speaker-verified-candidates-20260724"
            / "No05-c2.wav"
        ),
    },
}

COST_REPORTS = [
    (
        ROOT
        / "audio-generation"
        / "grade2-sample-part1-speaker-verified-candidates-20260724"
        / "generation-report.json"
    ),
    (
        ROOT
        / "audio-generation"
        / "grade2-sample-part1-speaker-verified-retry-02-04-20260724"
        / "generation-report.json"
    ),
    (
        ROOT
        / "audio-generation"
        / "grade2-sample-part1-speaker-verified-retry-no02-slow-20260724"
        / "generation-report.json"
    ),
    (
        ROOT
        / "audio-generation"
        / "grade2-sample-part1-speaker-verified-retry-no02-balanced-20260724"
        / "generation-report.json"
    ),
    (
        ROOT
        / "audio-generation"
        / "grade2-sample-part1-speaker-verified-retry-no02-medium-20260724"
        / "generation-report.json"
    ),
]


def read_wav(path):
    with wave.open(str(path), "rb") as source:
        params = source.getparams()
        pcm = source.readframes(source.getnframes())
    if (
        params.nchannels != 1
        or params.sampwidth != 2
        or params.framerate != 24000
        or params.comptype != "NONE"
    ):
        raise RuntimeError(f"Unexpected source WAV format: {path}")
    samples = array("h")
    samples.frombytes(pcm)
    return samples, params


def find_question_label_gap(samples, sample_rate, source_qa):
    question_segment_start = round(
        source_qa["selectedBoundaries"][-1]["endSeconds"] * sample_rate
    )
    minimum_frames = sample_rate * QUESTION_GAP_MINIMUM_MS // 1000
    candidates = [
        run
        for run in speaker_qa.silence_runs(samples, sample_rate)
        if run[0] > question_segment_start + sample_rate * 0.15
        and run[1] - run[0] >= minimum_frames
    ]
    if candidates:
        return candidates[-1]

    search_start = question_segment_start + round(sample_rate * 0.30)
    search_end = min(
        len(samples),
        question_segment_start + round(sample_rate * 0.90),
    )
    short_minimum_frames = sample_rate * SHORT_GAP_MINIMUM_MS // 1000
    short_candidates = []
    start = None
    for index in range(search_start, search_end):
        if abs(samples[index]) <= SHORT_GAP_THRESHOLD:
            if start is None:
                start = index
            continue
        if start is not None:
            if index - start >= short_minimum_frames:
                short_candidates.append((start, index))
            start = None
    if start is not None and search_end - start >= short_minimum_frames:
        short_candidates.append((start, search_end))
    if not short_candidates:
        raise RuntimeError("Question-label gap was not detected")

    expected_gap_center = question_segment_start + round(sample_rate * 0.50)
    return min(
        short_candidates,
        key=lambda run: abs(((run[0] + run[1]) // 2) - expected_gap_center),
    )


def write_delivery(source_path, output_path, source_qa):
    samples, params = read_wav(source_path)
    sample_rate = params.framerate

    number_boundary = source_qa["selectedBoundaries"][0]
    number_gap = (
        round(number_boundary["startSeconds"] * sample_rate),
        round(number_boundary["endSeconds"] * sample_rate),
    )
    question_gap = find_question_label_gap(samples, sample_rate, source_qa)

    requested_gaps = [
        (
            "afterNumber",
            number_gap,
            MINIMUM_AFTER_NUMBER_MS,
            MAXIMUM_AFTER_NUMBER_MS,
            TARGET_AFTER_NUMBER_MS,
        ),
        (
            "afterQuestion",
            question_gap,
            MINIMUM_AFTER_QUESTION_MS,
            MAXIMUM_AFTER_QUESTION_MS,
            TARGET_AFTER_QUESTION_MS,
        ),
    ]
    edits = []
    pause_report = {}
    for label, gap, minimum_ms, maximum_ms, target_ms in requested_gaps:
        gap_frames = gap[1] - gap[0]
        minimum_frames = sample_rate * minimum_ms // 1000
        maximum_frames = sample_rate * maximum_ms // 1000
        target_frames = sample_rate * target_ms // 1000
        added_frames = 0
        removed_frames = 0
        if gap_frames < minimum_frames:
            added_frames = target_frames - gap_frames
            edits.append(("add", gap[1], added_frames))
        elif gap_frames > maximum_frames:
            removed_frames = gap_frames - target_frames
            edits.append(("remove", gap[0] + target_frames, gap[1]))
        pause_report[label] = {
            "beforeMs": round(gap_frames * 1000 / sample_rate, 1),
            "minimumMs": minimum_ms,
            "maximumMs": maximum_ms,
            "targetWhenAdjustedMs": target_ms,
            "addedMs": round(added_frames * 1000 / sample_rate, 1),
            "removedMs": round(removed_frames * 1000 / sample_rate, 1),
            "afterMs": round(
                (gap_frames + added_frames - removed_frames)
                * 1000
                / sample_rate,
                1,
            ),
        }

    for edit in sorted(edits, key=lambda value: value[1], reverse=True):
        if edit[0] == "add":
            _operation, position, added_frames = edit
            samples[position:position] = array("h", [0]) * added_frames
        else:
            _operation, start, end = edit
            del samples[start:end]

    active_threshold = 32768 * (
        10 ** (audio_info.ACTIVE_THRESHOLD_DBFS / 20)
    )
    active_samples = [
        sample for sample in samples if abs(sample) >= active_threshold
    ]
    if not active_samples:
        raise RuntimeError(f"No active audio samples found: {source_path}")
    active_rms = math.sqrt(
        sum(sample * sample for sample in active_samples) / len(active_samples)
    )
    source_active_dbfs = 20 * math.log10(active_rms / 32768)
    gain_db = round(TARGET_ACTIVE_RMS_DBFS - source_active_dbfs, 2)
    gain_factor = 10 ** (gain_db / 20)

    clipped = 0
    for index, sample in enumerate(samples):
        adjusted = round(sample * gain_factor)
        if adjusted < -32768 or adjusted > 32767:
            clipped += 1
        samples[index] = max(-32768, min(32767, adjusted))
    if clipped:
        raise RuntimeError(f"Gain would clip {clipped} samples in {source_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(output_path), "wb") as destination:
        destination.setparams(
            (
                params.nchannels,
                params.sampwidth,
                params.framerate,
                len(samples),
                params.comptype,
                params.compname,
            )
        )
        destination.writeframes(samples.tobytes())

    return {
        "gainDb": gain_db,
        "sourceActiveRmsDbfs": round(source_active_dbfs, 2),
        "pauseProcessing": pause_report,
        "speedProcessing": False,
        "equalization": False,
        "compression": False,
        "resampling": False,
    }


def rendered_transcript(manifest_item):
    names = {"A": "Kore", "B": "Puck"}
    return "\n".join(
        f"{names[segment['speaker']]}: {segment['text']}"
        for segment in manifest_item["segments"]
    )


def render_page(records):
    cards = []
    for record in records:
        source = f"{record['file']}?v={record['sha256'][:12]}"
        transcript = html.escape(record["transcript"])
        turns = " / ".join(
            f"{turn['speaker']} {turn['medianF0Hz']:.1f}Hz"
            for turn in record["speakerQa"]["bodyTurns"]
        )
        cards.append(
            f"""
      <article class="card">
        <div class="card-head">
          <div>
            <p class="number">No.{record['number']}</p>
            <p class="voices">Kore（女性）＋ Puck（男性）</p>
          </div>
          <span class="qa">話者検査済み</span>
        </div>
        <audio controls playsinline preload="metadata" src="{source}"></audio>
        <div class="meta">
          <span>{record['durationSeconds']:.1f}秒</span>
          <span>{record['wordsPerSecond']:.2f}語/秒</span>
          <a href="{source}" download>音声を保存</a>
        </div>
        <details>
          <summary>検査値とスクリプト</summary>
          <p class="turns">{html.escape(turns)}</p>
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
  <title>英検2級 サンプル Part 1｜話者検査済み</title>
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
      background: linear-gradient(180deg, #17261f 0 270px, #edf1ed 270px);
    }}
    main {{
      width: min(calc(100% - 20px), 720px);
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
    }}
    h1 {{ margin: 0; font-size: clamp(28px, 8vw, 43px); line-height: 1.15; }}
    .lead {{ margin: 14px 0 0; color: #d6e4dc; font-size: 15px; line-height: 1.75; }}
    .list {{ display: grid; gap: 13px; }}
    .card {{
      padding: 18px;
      border: 1px solid #d8e0da;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 9px 30px rgba(23, 38, 31, .08);
    }}
    .card-head {{ display: flex; align-items: start; justify-content: space-between; gap: 12px; }}
    .number {{ margin: 0; font-size: 23px; font-weight: 850; }}
    .voices {{ margin: 4px 0 13px; color: #5c6c63; font-size: 13px; font-weight: 700; }}
    .qa {{
      border-radius: 999px;
      background: #e0f5e8;
      color: #176241;
      padding: 6px 9px;
      font-size: 11px;
      font-weight: 850;
      white-space: nowrap;
    }}
    audio {{ display: block; width: 100%; min-height: 44px; }}
    .meta {{
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 10px;
      color: #6b7971;
      font-size: 12px;
    }}
    .meta a {{ margin-left: auto; color: #176241; font-size: 13px; font-weight: 800; }}
    details {{ margin-top: 13px; border-top: 1px solid #e8ece9; padding-top: 12px; }}
    summary {{ cursor: pointer; color: #42534a; font-size: 13px; font-weight: 750; }}
    .turns {{ color: #52645a; font-size: 12px; line-height: 1.6; }}
    pre {{
      margin: 12px 0 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      border-radius: 12px;
      background: #f5f7f5;
      padding: 13px;
      font: 13px/1.65 ui-monospace, SFMono-Regular, Consolas, monospace;
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <p class="eyebrow">GEMINI 3.1 FLASH TTS / PART 1</p>
      <h1>英検2級 サンプル<br>Part 1 No.1〜5</h1>
      <p class="lead">KoreとPuckの2人会話です。全問で4つの会話ターンを実測し、女性・男性の声が正しく切り替わっていることを確認しています。</p>
    </header>
    <section class="list">
      {''.join(cards)}
    </section>
  </main>
</body>
</html>
"""


def main():
    if OUTPUT_DIR.exists():
        raise RuntimeError(f"Refusing to overwrite existing output directory: {OUTPUT_DIR}")

    manifest = audio_info.read_json(MANIFEST_PATH)
    manifest_items = {
        int(item["number"]): item
        for item in manifest["items"]
        if 1 <= int(item["number"]) <= 5
    }
    plan = audio_info.read_json(QA_PLAN_PATH)
    qa_items = {}
    for item in plan["items"]:
        qa_items.setdefault(int(item["number"]), item)
    if set(manifest_items) != set(SELECTIONS) or set(qa_items) != set(SELECTIONS):
        raise RuntimeError("Exactly No.1-5 are required")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=False)
    records = []
    for number, selection in SELECTIONS.items():
        source_path = selection["source"]
        if not source_path.exists():
            raise RuntimeError(f"Selected source WAV is missing: {source_path}")

        qa_item = dict(qa_items[number])
        qa_item["id"] = selection["candidateId"]
        source_qa = speaker_qa.audit_candidate(qa_item, source_path)
        if not source_qa["speakerPassed"]:
            raise RuntimeError(f"Rendered speaker QA failed for No.{number}")
        if not source_qa["pacePassed"]:
            raise RuntimeError(
                f"Natural pace QA failed for No.{number}: "
                f"{source_qa['wordsPerSecond']} words/second"
            )

        output_path = OUTPUT_DIR / "audio" / (
            f"sample-part1-no{number:02d}-kore-puck-speaker-verified-v20260724.wav"
        )
        processing = write_delivery(source_path, output_path, source_qa)
        delivery_metrics = audio_info.inspect_wav(output_path)
        if abs(delivery_metrics["activeRmsDbfs"] - TARGET_ACTIVE_RMS_DBFS) > 0.25:
            raise RuntimeError(f"Loudness target was not reached for No.{number}")

        final_qa = speaker_qa.audit_candidate(qa_item, output_path)
        if not final_qa["speakerPassed"]:
            raise RuntimeError(f"Final rendered speaker QA failed for No.{number}")
        if not final_qa["pacePassed"]:
            raise RuntimeError(
                f"Final pace QA failed for No.{number}: "
                f"{final_qa['wordsPerSecond']} words/second"
            )

        manifest_item = manifest_items[number]
        word_count = int(qa_item["wordCount"])
        records.append(
            {
                "id": f"No{number:02d}",
                "number": number,
                "candidateId": selection["candidateId"],
                "voices": {"Woman": "Kore", "Man": "Puck"},
                "sourceFile": str(source_path.relative_to(ROOT)).replace("\\", "/"),
                "sourceSha256": audio_info.sha256(source_path),
                "file": str(output_path.relative_to(OUTPUT_DIR)).replace("\\", "/"),
                "sha256": audio_info.sha256(output_path),
                "wordCount": word_count,
                "sourceWordsPerSecond": source_qa["wordsPerSecond"],
                "wordsPerSecond": round(
                    word_count / delivery_metrics["durationSeconds"], 3
                ),
                "transcript": rendered_transcript(manifest_item),
                "speakerQa": final_qa,
                "processing": processing,
                **delivery_metrics,
            }
        )

    reports = [audio_info.read_json(path) for path in COST_REPORTS]
    estimated_cost = round(
        sum(report["estimatedBatchCostUsd"]["total"] for report in reports),
        8,
    )
    report = {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "model": "gemini-3.1-flash-tts-preview",
        "billingMode": "Batch API",
        "estimatedBatchCostThisRemakeUsd": estimated_cost,
        "speakerQaPolicy": {
            "plannedVoiceNamesAreNotProof": True,
            "allFourBodyTurnsMustPass": True,
            "minimumWomanManMedianF0Ratio": speaker_qa.MINIMUM_WOMAN_MAN_RATIO,
            "manualListeningStillRecommended": True,
        },
        "paceQaPolicy": {
            "targetWordsPerSecond": speaker_qa.TARGET_WORDS_PER_SECOND,
            "tolerance": speaker_qa.PACE_TOLERANCE,
            "speedPostProcessing": False,
        },
        "pausePolicy": {
            "minimumAfterNumberMs": MINIMUM_AFTER_NUMBER_MS,
            "maximumAfterNumberMs": MAXIMUM_AFTER_NUMBER_MS,
            "targetAfterNumberWhenAdjustedMs": TARGET_AFTER_NUMBER_MS,
            "minimumAfterQuestionMs": MINIMUM_AFTER_QUESTION_MS,
            "maximumAfterQuestionMs": MAXIMUM_AFTER_QUESTION_MS,
            "targetAfterQuestionWhenAdjustedMs": TARGET_AFTER_QUESTION_MS,
            "method": (
                "edit only detected silence when a label gap is outside "
                "the accepted interval"
            ),
        },
        "loudnessPolicy": {
            "targetActiveRmsDbfs": TARGET_ACTIVE_RMS_DBFS,
            "method": "one constant linear PCM gain per complete item",
            "normalization": False,
            "equalization": False,
            "compression": False,
            "resampling": False,
        },
        "items": records,
    }
    audio_info.write_json(
        OUTPUT_DIR / "generation-and-publish-report.json",
        report,
    )
    (OUTPUT_DIR / "index.html").write_text(render_page(records), encoding="utf-8")
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
    for record in records:
        turns = ", ".join(
            f"{turn['speaker']}={turn['medianF0Hz']:.1f}Hz"
            for turn in record["speakerQa"]["bodyTurns"]
        )
        print(
            f"{record['id']}: {record['wordsPerSecond']:.3f} words/s, "
            f"{record['activeRmsDbfs']:.2f} dBFS, {turns}"
        )
    print(f"Estimated Batch cost this remake: ${estimated_cost:.6f} USD")


if __name__ == "__main__":
    main()
