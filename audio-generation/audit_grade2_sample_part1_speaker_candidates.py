import argparse
import json
import math
import re
import statistics
import wave
from array import array
from pathlib import Path


DEFAULT_SOURCE_DIR = Path(
    "audio-generation/grade2-sample-part1-speaker-verified-candidates-20260724"
)
SILENCE_THRESHOLD = 200
MINIMUM_SILENCE_MS = 120
MINIMUM_BOUNDARY_MS = 250
KORE_REFERENCE_F0_HZ = 190.5
PUCK_REFERENCE_F0_HZ = 142.9
WOMAN_MINIMUM_F0_HZ = 170.0
MAN_MAXIMUM_F0_HZ = 165.0
MINIMUM_WOMAN_MAN_RATIO = 1.18
TARGET_WORDS_PER_SECOND = 2.44
PACE_TOLERANCE = 0.12


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def word_count(text):
    return len(re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)?|\d+", text))


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
        raise RuntimeError(f"Unexpected WAV format: {path}")
    samples = array("h")
    samples.frombytes(pcm)
    return samples, params.framerate


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


def cumulative_active_counts(samples):
    cumulative = [0]
    active = 0
    for sample in samples:
        if abs(sample) > SILENCE_THRESHOLD:
            active += 1
        cumulative.append(active)
    return cumulative


def select_segment_boundaries(samples, sample_rate, segments):
    all_runs = silence_runs(samples, sample_rate)
    minimum_boundary_frames = sample_rate * MINIMUM_BOUNDARY_MS // 1000
    runs = [
        run
        for run in all_runs
        if run[1] - run[0] >= minimum_boundary_frames
        and run[0] > sample_rate * 0.3
        and run[1] < len(samples) - sample_rate * 0.3
    ]
    if len(runs) < 5:
        raise RuntimeError(f"Only {len(runs)} candidate boundary silences found")

    segment_words = [word_count(segment["text"]) for segment in segments]
    total_words = sum(segment_words)
    expected_fractions = []
    running_words = 0
    for words in segment_words[:-1]:
        running_words += words
        expected_fractions.append(running_words / total_words)

    cumulative_active = cumulative_active_counts(samples)
    total_active = cumulative_active[-1]
    candidates = []
    for start, end in runs:
        midpoint = (start + end) // 2
        active_fraction = cumulative_active[midpoint] / total_active
        elapsed_fraction = midpoint / len(samples)
        duration_seconds = (end - start) / sample_rate
        candidates.append(
            {
                "start": start,
                "end": end,
                "activeFraction": active_fraction,
                "elapsedFraction": elapsed_fraction,
                "durationSeconds": duration_seconds,
            }
        )

    states = {(0, -1): (0.0, [])}
    for boundary_index, expected_fraction in enumerate(expected_fractions):
        next_states = {}
        for (_count, previous_index), (previous_cost, chosen) in states.items():
            for candidate_index in range(previous_index + 1, len(candidates)):
                remaining_candidates = len(candidates) - candidate_index - 1
                remaining_boundaries = len(expected_fractions) - boundary_index - 1
                if remaining_candidates < remaining_boundaries:
                    continue
                candidate = candidates[candidate_index]
                distance_cost = (
                    abs(candidate["activeFraction"] - expected_fraction) * 12.0
                    + abs(candidate["elapsedFraction"] - expected_fraction) * 1.5
                )
                duration_reward = min(candidate["durationSeconds"], 1.0) * 0.35
                cost = previous_cost + distance_cost - duration_reward
                key = (boundary_index + 1, candidate_index)
                current = next_states.get(key)
                if current is None or cost < current[0]:
                    next_states[key] = (cost, chosen + [candidate_index])
        states = next_states
    if not states:
        raise RuntimeError("Could not align transcript segments to silence boundaries")

    _key, (_cost, selected_indices) = min(
        states.items(),
        key=lambda item: item[1][0],
    )
    selected = [candidates[index] for index in selected_indices]
    return selected, candidates, expected_fractions


def median(values):
    return statistics.median(values) if values else None


def pitch_metrics(samples, sample_rate, start_frame, end_frame):
    raw = samples[start_frame:end_frame:6]
    downsampled_rate = sample_rate // 6
    frame_size = int(0.050 * downsampled_rate)
    hop_size = int(0.020 * downsampled_rate)
    minimum_lag = int(downsampled_rate / 320)
    maximum_lag = int(downsampled_rate / 70)
    pitches = []
    correlations = []

    for position in range(0, max(0, len(raw) - frame_size + 1), hop_size):
        frame = [float(value) for value in raw[position : position + frame_size]]
        frame_mean = sum(frame) / len(frame)
        frame = [value - frame_mean for value in frame]
        rms = math.sqrt(sum(value * value for value in frame) / len(frame))
        if rms < 350:
            continue
        best_correlation = 0.0
        best_lag = None
        for lag in range(minimum_lag, maximum_lag + 1):
            left = frame[:-lag]
            right = frame[lag:]
            numerator = sum(a * b for a, b in zip(left, right))
            denominator = math.sqrt(
                sum(value * value for value in left)
                * sum(value * value for value in right)
            )
            correlation = numerator / denominator if denominator else 0.0
            if correlation > best_correlation:
                best_correlation = correlation
                best_lag = lag
        if best_lag is not None and best_correlation >= 0.42:
            pitches.append(downsampled_rate / best_lag)
            correlations.append(best_correlation)

    if len(pitches) < 30:
        raise RuntimeError(
            f"Only {len(pitches)} reliable pitch frames in "
            f"{start_frame / sample_rate:.3f}-{end_frame / sample_rate:.3f}s"
        )
    ordered = sorted(pitches)
    return {
        "medianF0Hz": round(statistics.median(pitches), 2),
        "p10F0Hz": round(ordered[len(ordered) // 10], 2),
        "p90F0Hz": round(ordered[min(len(ordered) - 1, len(ordered) * 9 // 10)], 2),
        "medianCorrelation": round(statistics.median(correlations), 3),
        "reliableFrameCount": len(pitches),
    }


def classify_turn(role, metrics):
    f0 = metrics["medianF0Hz"]
    distance_to_kore = abs(f0 - KORE_REFERENCE_F0_HZ)
    distance_to_puck = abs(f0 - PUCK_REFERENCE_F0_HZ)
    if role == "Woman":
        passed = (
            f0 >= WOMAN_MINIMUM_F0_HZ
            and distance_to_kore < distance_to_puck
        )
        observed = "Kore-like" if distance_to_kore < distance_to_puck else "Puck-like"
    elif role == "Man":
        passed = (
            f0 <= MAN_MAXIMUM_F0_HZ
            and distance_to_puck < distance_to_kore
        )
        observed = "Puck-like" if distance_to_puck < distance_to_kore else "Kore-like"
    else:
        raise RuntimeError(f"Unknown role: {role}")
    return {
        "expectedRole": role,
        "observedClass": observed,
        "distanceToKoreHz": round(distance_to_kore, 2),
        "distanceToPuckHz": round(distance_to_puck, 2),
        "turnPassed": passed,
    }


def audit_candidate(item, wav_path):
    samples, sample_rate = read_wav(wav_path)
    boundaries, all_candidates, expected_fractions = select_segment_boundaries(
        samples,
        sample_rate,
        item["segments"],
    )
    body_segments = item["segments"][1:5]
    body_windows = []
    for body_index, segment in enumerate(body_segments):
        start_frame = boundaries[body_index]["end"]
        end_frame = boundaries[body_index + 1]["start"]
        metrics = pitch_metrics(samples, sample_rate, start_frame, end_frame)
        classification = classify_turn(segment["speaker"], metrics)
        body_windows.append(
            {
                "bodyTurn": body_index + 1,
                "speaker": segment["speaker"],
                "text": segment["text"],
                "startSeconds": round(start_frame / sample_rate, 3),
                "endSeconds": round(end_frame / sample_rate, 3),
                **metrics,
                **classification,
            }
        )

    woman_values = [
        turn["medianF0Hz"]
        for turn in body_windows
        if turn["speaker"] == "Woman"
    ]
    man_values = [
        turn["medianF0Hz"]
        for turn in body_windows
        if turn["speaker"] == "Man"
    ]
    woman_median = statistics.median(woman_values)
    man_median = statistics.median(man_values)
    ratio = woman_median / man_median
    all_turns_passed = all(turn["turnPassed"] for turn in body_windows)
    separation_passed = ratio >= MINIMUM_WOMAN_MAN_RATIO
    speaker_passed = all_turns_passed and separation_passed

    words = int(item["wordCount"])
    duration_seconds = len(samples) / sample_rate
    words_per_second = words / duration_seconds
    pace_passed = (
        abs(words_per_second - TARGET_WORDS_PER_SECOND) <= PACE_TOLERANCE
    )
    selected_boundaries = [
        {
            "startSeconds": round(boundary["start"] / sample_rate, 3),
            "endSeconds": round(boundary["end"] / sample_rate, 3),
            "durationMs": round(boundary["durationSeconds"] * 1000, 1),
            "activeFraction": round(boundary["activeFraction"], 4),
            "expectedActiveFraction": round(expected_fractions[index], 4),
        }
        for index, boundary in enumerate(boundaries)
    ]
    return {
        "id": item["id"],
        "baseId": item["baseId"],
        "number": int(item["number"]),
        "candidate": int(item["candidate"]),
        "file": wav_path.name,
        "durationSeconds": round(duration_seconds, 3),
        "wordCount": words,
        "wordsPerSecond": round(words_per_second, 3),
        "paceDeltaFromTarget": round(words_per_second - TARGET_WORDS_PER_SECOND, 3),
        "pacePassed": pace_passed,
        "speakerPassed": speaker_passed,
        "allTurnsPassed": all_turns_passed,
        "separationPassed": separation_passed,
        "womanMedianF0Hz": round(woman_median, 2),
        "manMedianF0Hz": round(man_median, 2),
        "womanManRatio": round(ratio, 3),
        "bodyTurns": body_windows,
        "selectedBoundaries": selected_boundaries,
        "detectedBoundaryCandidateCount": len(all_candidates),
        "candidatePassed": speaker_passed and pace_passed,
    }


def parse_args():
    parser = argparse.ArgumentParser(
        description="Audit actual rendered speakers and pace for Part 1 candidates."
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=DEFAULT_SOURCE_DIR,
        help="Directory containing the Batch plan, report, and WAV candidates.",
    )
    return parser.parse_args()


def main(source_dir):
    plan_path = source_dir / "batch-request-plan.json"
    generation_report_path = source_dir / "generation-report.json"
    qa_report_path = source_dir / "speaker-qa-report.json"
    if qa_report_path.exists():
        raise RuntimeError(f"Refusing to overwrite existing QA report: {qa_report_path}")
    if not plan_path.exists() or not generation_report_path.exists():
        raise RuntimeError("Collect Batch results before running speaker QA")
    plan = read_json(plan_path)
    generation = read_json(generation_report_path)
    generated_ids = [item["id"] for item in generation["items"]]
    planned_by_id = {item["id"]: item for item in plan["items"]}
    unknown_ids = [item_id for item_id in generated_ids if item_id not in planned_by_id]
    if unknown_ids:
        raise RuntimeError(f"Generation report contains unknown IDs: {unknown_ids}")

    results = []
    for generated_item in generation["items"]:
        item = planned_by_id[generated_item["id"]]
        wav_path = source_dir / generated_item["file"]
        results.append(audit_candidate(item, wav_path))

    selections = {}
    for number in range(1, 6):
        candidates = [result for result in results if result["number"] == number]
        passing = [result for result in candidates if result["candidatePassed"]]
        speaker_passing = [result for result in candidates if result["speakerPassed"]]
        pool = passing or speaker_passing
        if pool:
            selected = min(
                pool,
                key=lambda result: (
                    not result["candidatePassed"],
                    abs(result["paceDeltaFromTarget"]),
                ),
            )
            selections[f"No{number:02d}"] = {
                "selectedCandidateId": selected["id"],
                "fullyPassed": selected["candidatePassed"],
                "speakerPassed": selected["speakerPassed"],
                "pacePassed": selected["pacePassed"],
            }
        else:
            selections[f"No{number:02d}"] = {
                "selectedCandidateId": None,
                "fullyPassed": False,
                "speakerPassed": False,
                "pacePassed": False,
            }

    report = {
        "sourceBatchJob": generation["batchJob"],
        "model": generation["model"],
        "speakerReferences": {
            "KoreMedianF0Hz": KORE_REFERENCE_F0_HZ,
            "PuckMedianF0Hz": PUCK_REFERENCE_F0_HZ,
            "WomanMinimumF0Hz": WOMAN_MINIMUM_F0_HZ,
            "ManMaximumF0Hz": MAN_MAXIMUM_F0_HZ,
            "MinimumWomanManRatio": MINIMUM_WOMAN_MAN_RATIO,
        },
        "paceTarget": {
            "wordsPerSecond": TARGET_WORDS_PER_SECOND,
            "tolerance": PACE_TOLERANCE,
        },
        "selectionPolicy": (
            "actual speaker correctness first; pace second; "
            "manual listening remains required before release"
        ),
        "excludedFailedCandidates": generation.get("failures", []),
        "results": results,
        "selections": selections,
        "allNumbersHaveSpeakerPassingCandidate": all(
            selection["speakerPassed"] for selection in selections.values()
        ),
        "allNumbersHaveFullyPassingCandidate": all(
            selection["fullyPassed"] for selection in selections.values()
        ),
    }
    write_json(qa_report_path, report)

    for result in results:
        turns = ", ".join(
            f"{turn['speaker']}={turn['medianF0Hz']:.1f}Hz/"
            f"{'PASS' if turn['turnPassed'] else 'FAIL'}"
            for turn in result["bodyTurns"]
        )
        print(
            f"{result['id']}: speaker={'PASS' if result['speakerPassed'] else 'FAIL'}, "
            f"pace={result['wordsPerSecond']:.3f}/"
            f"{'PASS' if result['pacePassed'] else 'FAIL'}, "
            f"ratio={result['womanManRatio']:.2f}; {turns}"
        )
    print("Selections:")
    for base_id, selection in selections.items():
        print(
            f"  {base_id}: {selection['selectedCandidateId']} "
            f"(speaker={selection['speakerPassed']}, pace={selection['pacePassed']})"
        )
    print(f"Saved {qa_report_path}")


if __name__ == "__main__":
    main(parse_args().source_dir)
