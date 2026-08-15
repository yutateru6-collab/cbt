"""Normalize only two silence gaps in existing PCM WAV listening files.

Speech frames are copied byte-for-byte. Ambiguous automatic detection produces no
output file; add exact frame ranges to the manual-boundaries JSON and rerun.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import struct
import urllib.request
import wave
from pathlib import Path


TARGET_GAPS = (0.8, 0.6)
SILENCE_THRESHOLD = 350
MIN_SILENCE_SECONDS = 0.15
MIN_BODY_QUESTION_GAP_SECONDS = 0.35
MIN_QUESTION_WORD_SECONDS = 0.20
MAX_QUESTION_WORD_SECONDS = 1.20
MIN_QUESTION_TEXT_REMAINDER_SECONDS = 1.20


def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def load_pcm(path):
    with wave.open(str(path), "rb") as source:
        params = source.getparams()
        if params.comptype != "NONE" or params.sampwidth != 2 or params.nchannels not in (1, 2):
            raise ValueError("Only uncompressed 16-bit mono/stereo WAV is supported")
        frames = source.readframes(params.nframes)
    return params, frames


def frame_levels(params, frames):
    values = struct.unpack(f"<{len(frames) // 2}h", frames)
    if params.nchannels == 1:
        return [abs(value) for value in values]
    return [max(abs(values[i]), abs(values[i + 1])) for i in range(0, len(values), 2)]


def find_silence_runs(params, frames):
    levels = frame_levels(params, frames)
    minimum = round(params.framerate * MIN_SILENCE_SECONDS)
    start_limit = len(levels) // 2
    runs = []
    start = None
    for index, level in enumerate(levels):
        if level <= SILENCE_THRESHOLD and start is None:
            start = index
        if level > SILENCE_THRESHOLD and start is not None:
            if start >= start_limit and index - start >= minimum:
                runs.append([start, index])
            start = None
    if start is not None and start >= start_limit and len(levels) - start >= minimum:
        runs.append([start, len(levels)])
    return runs


def choose_boundaries(params, frames, manual):
    if manual:
        pairs = [manual.get("bodyQuestionGap"), manual.get("questionTextGap")]
        if all(isinstance(pair, list) and len(pair) == 2 for pair in pairs):
            return pairs, "manual", []
        return None, "invalid-manual", []
    candidates = find_silence_runs(params, frames)
    structural_matches = []
    for index in range(len(candidates) - 1):
        first, second = candidates[index : index + 2]
        first_gap_seconds = (first[1] - first[0]) / params.framerate
        question_word_seconds = (second[0] - first[1]) / params.framerate
        question_text_remainder_seconds = (params.nframes - second[1]) / params.framerate
        if (
            first_gap_seconds >= MIN_BODY_QUESTION_GAP_SECONDS
            and MIN_QUESTION_WORD_SECONDS <= question_word_seconds <= MAX_QUESTION_WORD_SECONDS
            and question_text_remainder_seconds >= MIN_QUESTION_TEXT_REMAINDER_SECONDS
        ):
            structural_matches.append(index)
    if len(structural_matches) == 1:
        index = structural_matches[0]
        return candidates[index : index + 2], "automatic-question-structure", candidates
    if structural_matches:
        return None, "ambiguous-question-structure", candidates
    # Strict by design: uncertainty must stop the release instead of altering speech.
    if len(candidates) != 2:
        return None, "ambiguous-auto", candidates
    if candidates[0][1] >= candidates[1][0]:
        return None, "overlapping-auto", candidates
    return candidates, "automatic", candidates


def replace_gaps(params, frames, boundaries):
    frame_width = params.sampwidth * params.nchannels
    output = frames
    for (start, end), seconds in reversed(list(zip(boundaries, TARGET_GAPS))):
        if not (0 <= start < end <= params.nframes):
            raise ValueError(f"Invalid frame range: {start}-{end}")
        replacement = b"\x00" * (round(params.framerate * seconds) * frame_width)
        output = output[: start * frame_width] + replacement + output[end * frame_width :]
    first_target = round(params.framerate * TARGET_GAPS[0])
    second_target = round(params.framerate * TARGET_GAPS[1])
    first_delta = first_target - (boundaries[0][1] - boundaries[0][0])
    normalized_boundaries = [
        [boundaries[0][0], boundaries[0][0] + first_target],
        [boundaries[1][0] + first_delta, boundaries[1][0] + first_delta + second_target],
    ]
    return output, normalized_boundaries


def write_wav(path, params, frames):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as target:
        target.setparams(params._replace(nframes=0))
        target.writeframes(frames)


def write_review_clip(path, params, frames, boundary, padding_seconds=1.25):
    frame_width = params.sampwidth * params.nchannels
    padding = round(params.framerate * padding_seconds)
    start = max(0, boundary[0] - padding)
    end = min(len(frames) // frame_width, boundary[1] + padding)
    write_wav(path, params, frames[start * frame_width : end * frame_width])


def acquire(item, cache):
    source_path = item.get("sourcePath")
    if source_path:
        return Path(source_path)
    url = item["sourceUrl"]
    path = cache / f"{item['id'].replace('/', '__')}.wav"
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 Grade2AudioNormalizer/1.0"})
        with urllib.request.urlopen(request, timeout=60) as response, path.open("wb") as target:
            shutil.copyfileobj(response, target)
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--manual-boundaries", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--cache-dir", type=Path, default=Path("work/listening-source-cache"))
    parser.add_argument("--expected-count", type=int, default=180)
    args = parser.parse_args()
    if args.output_dir.exists():
        raise SystemExit(f"Refusing to overwrite output directory: {args.output_dir}")
    data = json.loads(args.manifest.read_text(encoding="utf-8"))
    manual = json.loads(args.manual_boundaries.read_text(encoding="utf-8"))
    items = data["items"]
    if len(items) != args.expected_count:
        raise SystemExit(f"Expected {args.expected_count} files, got {len(items)}")
    staging = args.output_dir.with_name(f".{args.output_dir.name}.staging")
    if staging.exists():
        raise SystemExit(f"Staging directory already exists: {staging}")
    staging.mkdir(parents=True)
    report = []
    failures = []
    try:
        for item in items:
            source = acquire(item, args.cache_dir)
            params, frames = load_pcm(source)
            boundaries, method, candidates = choose_boundaries(params, frames, manual.get(item["id"]))
            if not boundaries:
                failures.append(item["id"])
                report.append({"id": item["id"], "status": "needs-review", "method": method, "candidates": candidates})
                continue
            normalized, normalized_boundaries = replace_gaps(params, frames, boundaries)
            destination = staging / item["outputRelativePath"]
            write_wav(destination, params, normalized)
            # Review clips deliberately include speech on both sides of each normalized boundary.
            for number, boundary in enumerate(normalized_boundaries, 1):
                write_review_clip(staging / "review-clips" / f"{item['id'].replace('/', '__')}-gap{number}.wav", params, normalized, boundary)
            report.append({
                "id": item["id"],
                "status": "normalized",
                "method": method,
                "sampleRate": params.framerate,
                "channels": params.nchannels,
                "sourceFrames": params.nframes,
                "boundaries": {
                    "bodyQuestionGap": boundaries[0],
                    "questionTextGap": boundaries[1],
                },
                "normalizedBoundaries": {
                    "bodyQuestionGap": normalized_boundaries[0],
                    "questionTextGap": normalized_boundaries[1],
                },
                "targetGapFrames": [round(params.framerate * value) for value in TARGET_GAPS],
                "sourceSha256": sha256(source),
                "outputSha256": sha256(destination),
                "outputBytes": destination.stat().st_size,
            })
        (staging / "normalization-manifest.json").write_text(json.dumps({"count": len(report), "failures": failures, "items": report}, indent=2) + "\n", encoding="utf-8")
        if failures:
            raise RuntimeError(f"{len(failures)} files need manual boundaries; no release directory published")
        staging.rename(args.output_dir)
        print(f"Normalized and verified {len(report)} files in {args.output_dir}")
    except Exception:
        # Keep the manifest for diagnosis but never expose a partial release directory.
        diagnostic = args.output_dir.with_name(f"{args.output_dir.name}-failed-report.json")
        diagnostic.write_text(json.dumps({"failures": failures, "items": report}, indent=2) + "\n", encoding="utf-8")
        shutil.rmtree(staging, ignore_errors=True)
        raise


if __name__ == "__main__":
    main()
