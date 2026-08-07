import argparse
import hashlib
import json
import shutil
import subprocess
import wave
from datetime import datetime, timezone
from pathlib import Path

import audit_grade2_sample_part1_speaker_candidates as speaker_qa
import package_grade2_sample_part1_five_gemini_mobile as audio_metrics
import package_grade2_set01_first_ten_mobile_20260805 as package_tools
import package_grade2_set03_gemini_latest_six as audio_tools


ROOT = Path(__file__).resolve().parent.parent
INITIAL_DIR = ROOT / "audio-generation" / "grade2-set02-full-approved-gemini-20260806"
AUDIT_REPORT = ROOT / "audio-generation" / "grade2-set02-full-approved-candidate-audit-20260806.json"
SELECTED_DIR = ROOT / "audio-generation" / "grade2-set02-full-approved-selected-20260806"
OUTPUT_DIR = ROOT / "audio-generation" / "cloudflare-publish" / "grade2-set02-full-approved-review-20260806"
PACE_TOLERANCE = 0.18
CONTINUOUS_WAV = SELECTED_DIR / "all-30-continuous-lossless.wav"
CONTINUOUS_MP3 = OUTPUT_DIR / "audio" / "all-30-continuous.mp3"
CONTINUOUS_GAP_SECONDS = 1.0


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_dirs():
    retries = sorted((ROOT / "audio-generation").glob("grade2-set02-full-approved-gemini-retry*-20260806"))
    return [INITIAL_DIR, *retries]


def load_inventory():
    directories = source_dirs()
    if not INITIAL_DIR.exists():
        raise RuntimeError(f"Initial generation directory does not exist: {INITIAL_DIR}")
    initial_plan = read_json(INITIAL_DIR / "batch-request-plan.json")
    plans = {}
    generated = {}
    failures = []
    costs = []
    for directory in directories:
        plan_path = directory / "batch-request-plan.json"
        status_path = directory / "collection-status.json"
        if not plan_path.exists() or not status_path.exists():
            continue
        plan = read_json(plan_path)
        status = read_json(status_path)
        plans.update({item["id"]: item for item in plan["items"]})
        generated.update({item["id"]: (directory, item) for item in status["items"]})
        failures.extend({"sourceDir": directory.name, **item} for item in status["failures"])
        costs.append({"sourceDir": directory.name, "estimatedBatchCostUsd": status.get("estimatedBatchCostUsd")})
    return initial_plan, plans, generated, failures, costs


def candidates_for(base_item, plans, generated):
    records = []
    for item_id, item in plans.items():
        if item.get("sourceItemId") != base_item["id"] or item_id not in generated:
            continue
        directory, result = generated[item_id]
        effective_duration = result["durationSeconds"] - item["fixedPauseSeconds"]
        if effective_duration <= 0:
            continue
        effective_wps = item["wordCount"] / effective_duration
        records.append({
            "id": item_id,
            "plan": item,
            "result": result,
            "sourceDir": directory,
            "sourcePath": directory / result["file"],
            "overallWordsPerSecond": round(item["wordCount"] / result["durationSeconds"], 3),
            "effectiveWordsPerSecond": round(effective_wps, 3),
            "paceDelta": round(effective_wps - base_item["targetEffectiveWordsPerSecond"], 3),
            "paceAccepted": abs(effective_wps - base_item["targetEffectiveWordsPerSecond"]) <= PACE_TOLERANCE,
        })
    return sorted(records, key=lambda value: abs(value["paceDelta"]))


def speaker_audit(candidate, base_item, candidate_index):
    normalized_segments = [
        {
            **segment,
            "speaker": "Woman" if segment["speaker"] == "Kore" else "Man" if segment["speaker"] == "Puck" else segment["speaker"],
        }
        for segment in candidate["plan"]["segments"]
    ]
    audit_item = {
        **candidate["plan"],
        "segments": normalized_segments,
        "baseId": base_item["id"],
        "candidate": candidate_index,
    }
    try:
        return {"completed": True, **speaker_qa.audit_candidate(audit_item, candidate["sourcePath"])}
    except Exception as error:
        return {"completed": False, "speakerPassed": False, "error": str(error)}


def audit_inventory(initial_plan, plans, generated, failures, costs):
    previous_candidates = {}
    if AUDIT_REPORT.exists():
        previous = read_json(AUDIT_REPORT)
        previous_candidates = {
            candidate["id"]: candidate
            for item in previous.get("items", [])
            for candidate in item.get("candidates", [])
        }
    items = []
    for base_item in initial_plan["baseItems"]:
        candidates = candidates_for(base_item, plans, generated)
        audited = []
        for index, candidate in enumerate(candidates, 1):
            speaker = None
            if base_item["part"] == "Part 1":
                previous = previous_candidates.get(candidate["id"])
                if previous and previous.get("sourceDir") == candidate["sourceDir"].name:
                    speaker = previous.get("speakerQa")
                else:
                    speaker = speaker_audit(candidate, base_item, index)
            accepted = candidate["paceAccepted"] and (
                base_item["part"] == "Part 2" or bool((speaker or {}).get("speakerPassed"))
            )
            audited.append({
                "id": candidate["id"],
                "sourceDir": candidate["sourceDir"].name,
                "file": candidate["result"]["file"],
                "durationSeconds": candidate["result"]["durationSeconds"],
                "effectiveWordsPerSecond": candidate["effectiveWordsPerSecond"],
                "paceDelta": candidate["paceDelta"],
                "paceAccepted": candidate["paceAccepted"],
                "speakerQa": speaker,
                "accepted": accepted,
            })
        passing = [candidate for candidate in audited if candidate["accepted"]]
        selected = min(passing, key=lambda value: abs(value["paceDelta"])) if passing else None
        items.append({
            "id": base_item["id"],
            "part": base_item["part"],
            "number": base_item["number"],
            "candidateCount": len(audited),
            "selectedCandidateId": selected["id"] if selected else None,
            "accepted": selected is not None,
            "candidates": audited,
        })
    return {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "model": initial_plan["model"],
        "setKey": "set-02",
        "selectionPolicy": "Part 1 requires actual speaker QA and effective pace; Part 2 requires effective pace; closest passing pace wins",
        "paceToleranceWordsPerSecond": PACE_TOLERANCE,
        "allAccepted": all(item["accepted"] for item in items),
        "acceptedCount": sum(item["accepted"] for item in items),
        "part1SpeakerAcceptedCount": sum(item["accepted"] for item in items if item["part"] == "Part 1"),
        "failedApiCandidates": failures,
        "batchCosts": costs,
        "items": items,
    }


def build_html(records):
    cards = []
    for record in records:
        cards.append(f'''<article class="card" data-part="{record['part']}">
  <div><strong>{record['part']}　{record['displayNumber']}番</strong><span>{record['voiceLabel']}</span></div>
  <audio controls preload="metadata" src="{record['file']}"></audio>
  <a href="{record['file']}" download>ダウンロード</a>
</article>''')
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>英検2級 第2回 リスニング全30問</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#f4f7f5;color:#17231e;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}
main{{width:min(100% - 24px,700px);margin:auto;padding:22px 0 60px}}h1{{font-size:1.35rem;margin:0 0 8px}}.note{{color:#506158;line-height:1.6;margin:0 0 14px}}
.tabs{{display:flex;gap:8px;position:sticky;top:0;background:#f4f7f5;padding:8px 0;z-index:2}}button{{flex:1;border:0;border-radius:999px;padding:12px;background:#dfe8e3;font-weight:700}}button.on{{background:#126b4b;color:#fff}}
.card{{background:#fff;border:1px solid #dce6e0;border-radius:16px;padding:16px;margin:12px 0;box-shadow:0 5px 18px #173c2b0d}}.card div{{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px}}.card div span{{color:#687970;font-size:.85rem}}audio{{width:100%;height:44px;display:block}}a{{display:inline-block;margin-top:9px;color:#126b4b}}
</style></head><body><main><h1>英検2級 第2回・リスニング全30問</h1>
<p class="note">Part 1・Part 2 各15問／一問丸ごと生成／生成後の速度加工なし</p>
<article class="card">
  <div><strong>全30問を連続再生</strong><span>Part 1 → Part 2</span></div>
  <audio controls preload="metadata" src="audio/all-30-continuous.mp3"></audio>
  <a href="audio/all-30-continuous.mp3" download>MP3をダウンロード</a>
</article>
<div class="tabs"><button class="on" data-show="Part 1">Part 1（1〜15）</button><button data-show="Part 2">Part 2（1〜15）</button></div>
<section>{''.join(cards)}</section></main><script>
const bs=[...document.querySelectorAll('button')],cs=[...document.querySelectorAll('.card[data-part]')];function show(p){{bs.forEach(b=>b.classList.toggle('on',b.dataset.show===p));cs.forEach(c=>c.hidden=c.dataset.part!==p)}}bs.forEach(b=>b.onclick=()=>show(b.dataset.show));document.querySelectorAll('audio').forEach(a=>a.onplay=()=>document.querySelectorAll('audio').forEach(x=>{{if(x!==a)x.pause()}}));show('Part 1');
</script></body></html>'''


def build_continuous_audio():
    report_path = OUTPUT_DIR / "generation-and-publish-report.json"
    if not report_path.exists():
        raise RuntimeError("Package the 30 accepted items before building continuous audio")
    if CONTINUOUS_WAV.exists() or CONTINUOUS_MP3.exists():
        raise RuntimeError("Refusing to overwrite existing continuous audio")
    report = read_json(report_path)
    items = report["items"]
    if len(items) != 30:
        raise RuntimeError(f"Expected 30 packaged items, found {len(items)}")

    expected_format = None
    total_audio_frames = 0
    gap_frames = None
    with wave.open(str(CONTINUOUS_WAV), "wb") as output:
        for index, item in enumerate(items):
            source_path = OUTPUT_DIR / item["file"]
            with wave.open(str(source_path), "rb") as source:
                current_format = (
                    source.getnchannels(), source.getsampwidth(),
                    source.getframerate(), source.getcomptype(),
                )
                if expected_format is None:
                    expected_format = current_format
                    output.setnchannels(current_format[0])
                    output.setsampwidth(current_format[1])
                    output.setframerate(current_format[2])
                    gap_frames = round(current_format[2] * CONTINUOUS_GAP_SECONDS)
                elif current_format != expected_format:
                    raise RuntimeError(f"WAV format mismatch: {source_path}")
                if index:
                    output.writeframes(b"\x00" * gap_frames * expected_format[0] * expected_format[1])
                frames = source.readframes(source.getnframes())
                output.writeframes(frames)
                total_audio_frames += source.getnframes()

    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(CONTINUOUS_WAV), "-codec:a", "libmp3lame",
        "-b:a", "128k", "-ar", "24000", "-ac", "1", str(CONTINUOUS_MP3),
    ], check=True)
    total_frames = total_audio_frames + gap_frames * (len(items) - 1)
    continuous_report = {
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "sourceItemCount": len(items),
        "order": "Part 1 No.1-15, then Part 2 No.1-15",
        "gapSecondsBetweenItems": CONTINUOUS_GAP_SECONDS,
        "losslessWav": {
            "file": str(CONTINUOUS_WAV.relative_to(ROOT)).replace("\\", "/"),
            "sha256": sha256(CONTINUOUS_WAV),
            "bytes": CONTINUOUS_WAV.stat().st_size,
            "durationSeconds": round(total_frames / expected_format[2], 3),
            "sampleRate": expected_format[2],
            "channels": expected_format[0],
            "sampleWidth": expected_format[1],
            "reencoded": False,
        },
        "smartphoneMp3": {
            "file": str(CONTINUOUS_MP3.relative_to(OUTPUT_DIR)).replace("\\", "/"),
            "sha256": sha256(CONTINUOUS_MP3),
            "bytes": CONTINUOUS_MP3.stat().st_size,
            "bitrateKbps": 128,
        },
        "sourceAudioChanged": False,
    }
    write_json(OUTPUT_DIR / "continuous-audio-report.json", continuous_report)
    (OUTPUT_DIR / "index.html").write_text(build_html(items), encoding="utf-8")
    print(f"Created {CONTINUOUS_WAV}")
    print(f"Created {CONTINUOUS_MP3}")
    print(f"Duration: {continuous_report['losslessWav']['durationSeconds']} seconds")


def package(initial_plan, plans, generated, failures, costs, audit):
    if not audit["allAccepted"]:
        rejected = [item["id"] for item in audit["items"] if not item["accepted"]]
        raise RuntimeError(f"Cannot package until every item passes QA: {rejected}")
    if SELECTED_DIR.exists() or OUTPUT_DIR.exists():
        raise RuntimeError("Refusing to overwrite an existing selected or publish directory")

    by_base_id = {item["id"]: item for item in audit["items"]}
    SELECTED_DIR.mkdir(parents=True)
    (SELECTED_DIR / "part1").mkdir()
    (SELECTED_DIR / "part2").mkdir()
    OUTPUT_DIR.mkdir(parents=True)
    (OUTPUT_DIR / "audio").mkdir()
    records = []
    for base_item in initial_plan["baseItems"]:
        audit_item = by_base_id[base_item["id"]]
        selected_id = audit_item["selectedCandidateId"]
        candidate = next(value for value in candidates_for(base_item, plans, generated) if value["id"] == selected_id)
        selected_audit = next(value for value in audit_item["candidates"] if value["id"] == selected_id)
        part_slug = "part1" if base_item["part"] == "Part 1" else "part2"
        canonical_name = f"{part_slug}-no{base_item['number']:02d}.wav"
        native_path = SELECTED_DIR / part_slug / canonical_name
        shutil.copy2(candidate["sourcePath"], native_path)
        samples, params = audio_tools.read_wav(native_path)
        adjusted, gain = package_tools.whole_file_gain(samples, base_item["part"])
        review_path = OUTPUT_DIR / "audio" / canonical_name
        audio_tools.write_wav(review_path, adjusted, params)
        metrics = audio_metrics.inspect_wav(review_path)
        if metrics["sampleRate"] != 24000 or metrics["channels"] != 1 or metrics["sampleWidth"] != 2:
            raise RuntimeError(f"Unexpected WAV format: {base_item['id']}")
        peak_limit = -2.5 if base_item["part"] == "Part 1" else -0.85
        if metrics["peakDbfs"] > peak_limit + 0.05:
            raise RuntimeError(f"Peak headroom failed: {base_item['id']}")
        records.append({
            "id": base_item["id"], "part": base_item["part"], "number": base_item["number"],
            "displayNumber": base_item["number"] if base_item["part"] == "Part 1" else base_item["number"] - 15,
            "voiceLabel": "Kore ＋ Puck" if base_item["part"] == "Part 1" else "Achird",
            "voices": base_item["voices"], "selectedCandidateId": selected_id,
            "file": str(review_path.relative_to(OUTPUT_DIR)).replace("\\", "/"),
            "nativeFile": str(native_path.relative_to(SELECTED_DIR)).replace("\\", "/"),
            "sha256": sha256(review_path), "nativeSha256": sha256(native_path),
            "bytes": review_path.stat().st_size, "durationSeconds": metrics["durationSeconds"],
            "wordCount": base_item["wordCount"],
            "overallWordsPerSecond": candidate["overallWordsPerSecond"],
            "effectiveWordsPerSecond": candidate["effectiveWordsPerSecond"],
            "targetEffectiveWordsPerSecond": base_item["targetEffectiveWordsPerSecond"],
            "paceDelta": candidate["paceDelta"], "paceAccepted": True,
            "speakerQa": selected_audit["speakerQa"],
            "processing": {"speedChange": False, "wholeFileConstantGain": gain},
            "metrics": metrics,
        })
    if len(records) != 30:
        raise RuntimeError(f"Expected 30 selected items, found {len(records)}")
    report = {
        "createdAt": datetime.now(timezone.utc).isoformat(), "model": initial_plan["model"],
        "setKey": "set-02", "itemCount": 30, "part1Count": 15, "part2Count": 15,
        "selectionPolicy": audit["selectionPolicy"],
        "paceToleranceWordsPerSecond": PACE_TOLERANCE,
        "failedApiCandidates": failures, "batchCosts": costs,
        "productionR2Overwritten": False, "manualListeningRequired": True,
        "items": records, "candidateAudit": audit["items"],
    }
    write_json(SELECTED_DIR / "selection-report.json", report)
    write_json(OUTPUT_DIR / "generation-and-publish-report.json", report)
    (OUTPUT_DIR / "index.html").write_text(build_html(records), encoding="utf-8")
    (OUTPUT_DIR / "_headers").write_text(
        "/audio/*.wav\n  Content-Type: audio/wav\n  Cache-Control: public, max-age=31536000, immutable\n/index.html\n  Cache-Control: no-store\n",
        encoding="utf-8",
    )
    print("Selected and packaged 30 accepted items")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("audit", "package", "continuous"))
    command = parser.parse_args().command
    if command == "continuous":
        build_continuous_audio()
        return
    initial_plan, plans, generated, failures, costs = load_inventory()
    audit = audit_inventory(initial_plan, plans, generated, failures, costs)
    write_json(AUDIT_REPORT, audit)
    print(f"Accepted {audit['acceptedCount']}/30; Part 1 speaker+pace {audit['part1SpeakerAcceptedCount']}/15")
    print(f"Saved {AUDIT_REPORT}")
    if command == "package":
        package(initial_plan, plans, generated, failures, costs, audit)


if __name__ == "__main__":
    main()
