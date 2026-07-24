import json
import math
import wave
from array import array
from datetime import datetime, timezone
from pathlib import Path

import package_grade2_sample_part1_five_gemini_mobile as base


ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "audio-generation" / "grade2-sample-part1-full.json"
OUTPUT_DIR = (
    ROOT
    / "audio-generation"
    / "cloudflare-publish"
    / "grade2-sample-part1-spacing-244-pauses-20260724-final"
)
TARGET_ACTIVE_RMS_DBFS = -18.6
EXTRA_LABEL_PAUSE_MS = 200
SILENCE_THRESHOLD = 200
MINIMUM_SILENCE_MS = 120
QUESTION_GAP_MINIMUM_MS = 500
SELECTIONS = {
    1: {
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-gemini-spacing-244-retry-20260724"
            / "No01.wav"
        ),
        "sourceJob": "first pace retry",
    },
    2: {
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-five-gemini-calm-batch-20260724"
            / "No02.wav"
        ),
        "sourceJob": "previous calm batch",
    },
    3: {
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-five-gemini-calm-batch-20260724"
            / "No03.wav"
        ),
        "sourceJob": "previous calm batch",
    },
    4: {
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-gemini-spacing-244-retry-20260724"
            / "No04.wav"
        ),
        "sourceJob": "first pace retry",
    },
    5: {
        "source": (
            ROOT
            / "audio-generation"
            / "grade2-sample-part1-five-gemini-spacing-244-batch-20260724"
            / "No05.wav"
        ),
        "sourceJob": "initial spacing batch",
    },
}
CURRENT_TURN_COST_REPORTS = [
    (
        ROOT
        / "audio-generation"
        / "grade2-sample-part1-five-gemini-spacing-244-batch-20260724"
        / "generation-report.json"
    ),
    (
        ROOT
        / "audio-generation"
        / "grade2-sample-part1-gemini-spacing-244-retry-20260724"
        / "generation-report.json"
    ),
    (
        ROOT
        / "audio-generation"
        / "grade2-sample-part1-gemini-spacing-244-duration-retry-20260724"
        / "generation-report.json"
    ),
]


def silence_runs(samples, sample_rate):
    minimum_frames = sample_rate * MINIMUM_SILENCE_MS // 1000
    runs = []
    start = None
    for index, sample in enumerate(samples):
        if abs(sample) <= SILENCE_THRESHOLD:
            if start is None:
                start = index
            continue
        if start is not None:
            if index - start >= minimum_frames:
                runs.append((start, index))
            start = None
    if start is not None and len(samples) - start >= minimum_frames:
        runs.append((start, len(samples)))
    return runs


def locate_label_gaps(samples, sample_rate):
    runs = silence_runs(samples, sample_rate)
    if not runs:
        raise RuntimeError("No silence runs were detected")
    number_gap = runs[0]
    question_minimum_frames = sample_rate * QUESTION_GAP_MINIMUM_MS // 1000
    question_candidates = [
        run
        for run in runs
        if run[1] - run[0] >= question_minimum_frames
        and run[0] > len(samples) * 0.7
    ]
    if not question_candidates:
        raise RuntimeError("Question label gap was not detected")
    question_gap = question_candidates[-1]
    if number_gap == question_gap:
        raise RuntimeError("Number and Question gaps must be different")
    return number_gap, question_gap


def write_delivery(source_path, output_path):
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

    samples = array("h")
    samples.frombytes(pcm)
    number_gap, question_gap = locate_label_gaps(samples, params.framerate)
    extra_frames = params.framerate * EXTRA_LABEL_PAUSE_MS // 1000
    insertions = sorted(
        [
            (number_gap[1], "afterNumber"),
            (question_gap[1], "afterQuestion"),
        ],
        reverse=True,
    )
    for position, _label in insertions:
        samples[position:position] = array("h", [0]) * extra_frames

    active_threshold = 32768 * (10 ** (base.ACTIVE_THRESHOLD_DBFS / 20))
    active_samples = [
        sample for sample in samples if abs(sample) >= active_threshold
    ]
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
        "sourceFrameCount": params.nframes,
        "insertedFramesPerGap": extra_frames,
        "insertedMillisecondsPerGap": EXTRA_LABEL_PAUSE_MS,
        "numberGapBeforeMs": round(
            (number_gap[1] - number_gap[0]) * 1000 / params.framerate,
            1,
        ),
        "questionGapBeforeMs": round(
            (question_gap[1] - question_gap[0]) * 1000 / params.framerate,
            1,
        ),
    }


def main():
    if OUTPUT_DIR.exists():
        raise RuntimeError(f"Refusing to overwrite existing output directory: {OUTPUT_DIR}")
    manifest = base.read_json(MANIFEST_PATH)
    manifest_items = {
        int(item["number"]): item
        for item in manifest["items"]
        if 1 <= int(item["number"]) <= 5
    }
    if set(manifest_items) != set(SELECTIONS):
        raise RuntimeError("Exactly No.1-5 are required")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=False)
    records = []
    for number, selection in SELECTIONS.items():
        source_path = selection["source"]
        if not source_path.exists():
            raise RuntimeError(f"Selected source WAV is missing: {source_path}")
        source_metrics = base.inspect_wav(source_path)
        manifest_item = manifest_items[number]
        transcript = base.transcript_text(manifest_item)
        word_count = sum(
            base.word_count(segment["text"])
            for segment in manifest_item["segments"]
        )
        selected_words_per_second = round(
            word_count / source_metrics["durationSeconds"],
            3,
        )
        output_path = OUTPUT_DIR / "audio" / (
            f"sample-part1-no{number:02d}-kore-puck-spacing244-v20260724.wav"
        )
        processing = write_delivery(source_path, output_path)
        delivery_metrics = base.inspect_wav(output_path)
        expected_frames = (
            processing["sourceFrameCount"]
            + processing["insertedFramesPerGap"] * 2
        )
        if delivery_metrics["frameCount"] != expected_frames:
            raise RuntimeError(f"Unexpected frame count for No.{number}")
        if abs(delivery_metrics["activeRmsDbfs"] - TARGET_ACTIVE_RMS_DBFS) > 0.25:
            raise RuntimeError(f"Loudness target was not reached for No.{number}")
        records.append(
            {
                "id": f"No{number:02d}",
                "number": number,
                "voices": {"A": "Kore", "B": "Puck"},
                "sourceJob": selection["sourceJob"],
                "sourceFile": str(source_path.relative_to(ROOT)).replace("\\", "/"),
                "sourceSha256": base.sha256(source_path),
                "file": str(output_path.relative_to(OUTPUT_DIR)).replace("\\", "/"),
                "sha256": base.sha256(output_path),
                "gainDb": processing["gainDb"],
                "wordCount": word_count,
                "selectedWordsPerSecondBeforeExtraPauses": selected_words_per_second,
                "wordsPerSecond": round(
                    word_count / delivery_metrics["durationSeconds"],
                    3,
                ),
                "transcript": transcript,
                "sourceMetrics": source_metrics,
                "pauseProcessing": {
                    "method": "insert zero PCM only inside detected label gaps",
                    "addedAfterNumberMs": EXTRA_LABEL_PAUSE_MS,
                    "addedAfterQuestionMs": EXTRA_LABEL_PAUSE_MS,
                    "numberGapBeforeMs": processing["numberGapBeforeMs"],
                    "questionGapBeforeMs": processing["questionGapBeforeMs"],
                },
                **delivery_metrics,
            }
        )

    selected_speeds = sorted(
        record["selectedWordsPerSecondBeforeExtraPauses"]
        for record in records
    )
    delivery_speeds = sorted(record["wordsPerSecond"] for record in records)
    selected_median = selected_speeds[2]
    delivery_median = delivery_speeds[2]
    if not 2.33 <= selected_speeds[0] or not selected_speeds[-1] <= 2.50:
        raise RuntimeError("Selected natural speech pace is outside the accepted range")

    current_turn_cost = sum(
        base.read_json(path)["estimatedBatchCostUsd"]["total"]
        for path in CURRENT_TURN_COST_REPORTS
    )
    report = {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "model": "gemini-3.1-flash-tts-preview",
        "billingMode": "Batch API",
        "requestCount": 5,
        "targetWordsPerSecond": 2.44,
        "selectedNaturalSpeech": {
            "minimumWordsPerSecond": selected_speeds[0],
            "medianWordsPerSecond": selected_median,
            "maximumWordsPerSecond": selected_speeds[-1],
            "speedPostProcessing": False,
        },
        "deliveryIncludingExtraLabelPauses": {
            "medianWordsPerSecond": delivery_median,
            "extraAfterNumberMs": EXTRA_LABEL_PAUSE_MS,
            "extraAfterQuestionMs": EXTRA_LABEL_PAUSE_MS,
        },
        "loudnessProcessing": {
            "targetActiveRmsDbfs": TARGET_ACTIVE_RMS_DBFS,
            "method": "one constant linear PCM gain per complete item",
            "normalization": False,
            "eq": False,
            "compression": False,
            "resampling": False,
        },
        "additionalBatchCostThisRevisionUsd": round(current_turn_cost, 6),
        "items": records,
    }
    base.write_json(OUTPUT_DIR / "generation-and-publish-report.json", report)
    (OUTPUT_DIR / "index.html").write_text(
        base.render_page(
            records,
            current_turn_cost,
            lead_text=(
                "KoreとPuckの2人会話。約2.44語/秒を目安に自然音声を選び、"
                "NumberとQuestionの後をそれぞれ200ms長くした修正版です。"
            ),
        ),
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
    print(f"Selected natural pace median: {selected_median:.3f} words/second")
    print(f"Delivery pace median: {delivery_median:.3f} words/second")
    print(
        "Delivery active RMS: "
        + ", ".join(
            f"{record['id']}={record['activeRmsDbfs']:.2f} dBFS"
            for record in records
        )
    )
    print(f"Additional Batch cost this revision: ${current_turn_cost:.6f} USD")


if __name__ == "__main__":
    main()
