import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from google import genai
from google.genai import types


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import generate_grade2_sample_part1_gemini_3_1_flash_tts as audio_utils


MODEL = "gemini-3.1-flash-tts-preview"
BATCH_DISPLAY_NAME = "grade2-gemini31-tts-five-20260723"
DEFAULT_OUTPUT_DIR = Path(
    "audio-generation/grade2-gemini-3.1-flash-batch-test-five-20260723"
)
PACE_INSTRUCTIONS = [
    "Maintain a steady pace.",
    "Do not rush, accelerate, over-enunciate, or stretch individual words.",
]
TEST_ASSIGNMENTS = [
    {
        "number": 1,
        "manifest": "audio-generation/grade2-sample-part1-full.json",
        "voices": {"A": "Kore", "B": "Puck"},
    },
    {
        "number": 2,
        "manifest": "audio-generation/grade2-sample-part1-full.json",
        "voices": {"A": "Leda", "B": "Achird"},
    },
    {
        "number": 3,
        "manifest": "audio-generation/grade2-sample-part1-full.json",
        "voices": {"A": "Zephyr", "B": "Puck"},
    },
    {
        "number": 16,
        "manifest": "audio-generation/grade2-sample-part2-pilot.json",
        "voices": {"N": "Kore"},
    },
    {
        "number": 17,
        "manifest": "audio-generation/grade2-sample-part2-rest.json",
        "voices": {"N": "Achird"},
    },
]
TERMINAL_STATES = {
    "JOB_STATE_SUCCEEDED",
    "JOB_STATE_PARTIALLY_SUCCEEDED",
    "JOB_STATE_FAILED",
    "JOB_STATE_CANCELLED",
    "JOB_STATE_EXPIRED",
}
SUCCESS_STATES = {
    "JOB_STATE_SUCCEEDED",
    "JOB_STATE_PARTIALLY_SUCCEEDED",
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Prepare, submit, and collect the five-item Gemini TTS Batch test."
    )
    parser.add_argument("command", choices=("prepare", "submit", "collect", "status"))
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    return parser.parse_args()


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    temporary_path = path.with_suffix(path.suffix + ".tmp")
    temporary_path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary_path.replace(path)


def enum_value(value):
    return value.value if hasattr(value, "value") else str(value)


def load_assigned_item(assignment):
    manifest_path = Path(assignment["manifest"])
    manifest = read_json(manifest_path)
    matching = [
        item
        for item in manifest.get("items", [])
        if int(item.get("number", 0)) == assignment["number"]
    ]
    if len(matching) != 1:
        raise RuntimeError(
            f"Expected one No.{assignment['number']} in {manifest_path}, found {len(matching)}"
        )
    item = matching[0]
    segments = item.get("segments") or []
    if len(segments) < 3:
        raise RuntimeError(f"{item.get('id')} needs number, body, and question segments")
    speakers = {str(segment.get("speaker", "")) for segment in segments}
    expected_speakers = set(assignment["voices"])
    if speakers != expected_speakers:
        raise RuntimeError(
            f"{item.get('id')} speakers {sorted(speakers)} do not match voices "
            f"{sorted(expected_speakers)}"
        )
    return {
        "id": item["id"],
        "number": int(item["number"]),
        "manifest": str(manifest_path),
        "segments": segments,
        "voices": assignment["voices"],
        "mode": "narration" if speakers == {"N"} else "dialogue",
    }


def transcript_for(item):
    if item["mode"] == "narration":
        return "\n".join(segment["text"] for segment in item["segments"])
    return "\n".join(
        f"{segment['speaker']}: {segment['text']}" for segment in item["segments"]
    )


def prompt_for(item):
    transcript = transcript_for(item)
    shared = f"""Use natural American English suitable for Japanese high school learners.
{PACE_INSTRUCTIONS[0]}
{PACE_INSTRUCTIONS[1]}
Pause for about 1.15 seconds after the Number line.
Pause for about 1.1 seconds after the final body line before saying \"Question.\"
After saying \"Question,\" pause briefly before reading the question text.
Use natural intonation without sounding theatrical or robotic.
Do not emphasize any detail in a way that reveals the answer.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything."""
    if item["mode"] == "narration":
        return f"""Synthesize the exact transcript below as audio for an English listening examination.
Do not speak these instructions or the transcript boundary labels.
Use one adult narrator throughout.
{shared}

TRANSCRIPT
{transcript}
END TRANSCRIPT"""
    return f"""Synthesize the exact dialogue below as audio for an English listening examination.
Do not speak these instructions, the speaker labels, or the transcript boundary labels.
Speaker A is an adult woman. Speaker B is an adult man.
Keep the dialogue responsive and realistic, with brief natural turn transitions.
{shared}

TRANSCRIPT
{transcript}
END TRANSCRIPT"""


def speech_config_for(item):
    if item["mode"] == "narration":
        voice_name = item["voices"]["N"]
        return types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice_name
                    )
                )
            ),
        )
    return types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                speaker_voice_configs=[
                    types.SpeakerVoiceConfig(
                        speaker=speaker,
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=item["voices"][speaker]
                            )
                        ),
                    )
                    for speaker in ("A", "B")
                ]
            )
        ),
    )


def build_plan():
    items = []
    for assignment in TEST_ASSIGNMENTS:
        item = load_assigned_item(assignment)
        item["prompt"] = prompt_for(item)
        items.append(item)
    return {
        "schemaVersion": 1,
        "createdAt": utc_now(),
        "model": MODEL,
        "billingMode": "Batch API",
        "requestCount": len(items),
        "requestUnit": "one whole listening item per independent request",
        "paceInstructions": PACE_INSTRUCTIONS,
        "pauseInstructions": {
            "afterNumberSeconds": 1.15,
            "beforeQuestionSeconds": 1.1,
            "afterQuestionLabel": "brief natural pause",
        },
        "postProcessing": {
            "speed": "none",
            "loudness": "none",
            "silence": "trim leading and trailing boundaries only",
        },
        "existingAudioPolicy": "never overwrite existing audio",
        "items": items,
    }


def prepare(output_dir):
    if output_dir.exists():
        raise RuntimeError(f"Refusing to overwrite existing output directory: {output_dir}")
    output_dir.mkdir(parents=True, exist_ok=False)
    plan = build_plan()
    plan_path = output_dir / "batch-request-plan.json"
    write_json(plan_path, plan)
    print(f"Prepared {plan_path}")
    print(
        "Assignments: "
        + ", ".join(
            f"{item['id']}=" + "+".join(item["voices"].values())
            for item in plan["items"]
        )
    )


def require_api_key():
    if not os.environ.get("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY is not available to this process")


def submit(output_dir):
    require_api_key()
    plan_path = output_dir / "batch-request-plan.json"
    job_path = output_dir / "batch-job.json"
    if not plan_path.exists():
        raise RuntimeError(f"Prepare the request plan first: {plan_path}")
    if job_path.exists():
        raise RuntimeError(
            f"Batch job record already exists; refusing a duplicate submission: {job_path}"
        )
    plan = read_json(plan_path)
    requests = []
    for item in plan["items"]:
        requests.append(
            types.InlinedRequest(
                contents=item["prompt"],
                metadata={"id": item["id"], "number": str(item["number"])},
                config=speech_config_for(item),
            )
        )
    client = genai.Client()
    try:
        job = client.batches.create(
            model=plan["model"],
            src=requests,
            config=types.CreateBatchJobConfig(
                display_name=BATCH_DISPLAY_NAME
            ),
        )
    finally:
        client.close()
    record = {
        "submittedAt": utc_now(),
        "name": job.name,
        "displayName": job.display_name,
        "model": job.model,
        "state": enum_value(job.state),
        "requestCount": len(requests),
    }
    write_json(job_path, record)
    print(f"Submitted {job.name}")
    print(f"State: {record['state']}")
    print(f"Saved {job_path}")


def get_job(output_dir):
    require_api_key()
    job_path = output_dir / "batch-job.json"
    if not job_path.exists():
        raise RuntimeError(f"Batch job record not found: {job_path}")
    record = read_json(job_path)
    client = genai.Client()
    try:
        job = client.batches.get(name=record["name"])
    finally:
        client.close()
    record.update(
        {
            "checkedAt": utc_now(),
            "state": enum_value(job.state),
            "error": (
                job.error.model_dump(mode="json", by_alias=True, exclude_none=True)
                if job.error
                else None
            ),
        }
    )
    write_json(job_path, record)
    return job, record


def status(output_dir):
    _job, record = get_job(output_dir)
    print(f"Job: {record['name']}")
    print(f"State: {record['state']}")
    if record["error"]:
        print(json.dumps(record["error"], ensure_ascii=False))


def usage_dict(response):
    usage = response.usage_metadata
    if not usage:
        return {
            "promptTokens": 0,
            "outputAudioTokens": 0,
            "totalTokens": 0,
        }
    return {
        "promptTokens": int(usage.prompt_token_count or 0),
        "outputAudioTokens": int(usage.candidates_token_count or 0),
        "totalTokens": int(usage.total_token_count or 0),
    }


def collect(output_dir):
    report_path = output_dir / "generation-report.json"
    if report_path.exists():
        raise RuntimeError(f"Results were already collected: {report_path}")
    job, record = get_job(output_dir)
    print(f"State: {record['state']}")
    if record["state"] not in TERMINAL_STATES:
        print("Batch job is not finished yet")
        return 3
    if record["state"] not in SUCCESS_STATES:
        raise RuntimeError(f"Batch job did not succeed: {record['state']}")
    responses = (job.dest.inlined_responses if job.dest else None) or []
    plan = read_json(output_dir / "batch-request-plan.json")
    if len(responses) != len(plan["items"]):
        raise RuntimeError(
            f"Expected {len(plan['items'])} inline responses, received {len(responses)}"
        )

    report_items = []
    totals = {"promptTokens": 0, "outputAudioTokens": 0, "totalTokens": 0}
    for expected_item, inline_response in zip(plan["items"], responses):
        response_id = (inline_response.metadata or {}).get("id")
        if response_id and response_id != expected_item["id"]:
            raise RuntimeError(
                f"Response order mismatch: expected {expected_item['id']}, got {response_id}"
            )
        if inline_response.error:
            raise RuntimeError(
                f"{expected_item['id']} failed: "
                + json.dumps(
                    inline_response.error.model_dump(
                        mode="json", by_alias=True, exclude_none=True
                    ),
                    ensure_ascii=False,
                )
            )
        if not inline_response.response:
            raise RuntimeError(f"{expected_item['id']} returned no response")
        pcm_raw, mime_type = audio_utils.extract_pcm(inline_response.response)
        pcm, trim_report = audio_utils.trim_silence(pcm_raw)
        output_path = output_dir / f"{expected_item['id']}.wav"
        if output_path.exists():
            raise RuntimeError(f"Refusing to overwrite: {output_path}")
        audio_utils.write_wav(output_path, pcm)
        wav_info = audio_utils.inspect_wav(output_path)
        if (
            wav_info["sampleRate"] != audio_utils.SAMPLE_RATE
            or wav_info["channels"] != audio_utils.CHANNELS
            or wav_info["sampleWidth"] != audio_utils.SAMPLE_WIDTH
        ):
            raise RuntimeError(f"Unexpected WAV format: {output_path}")
        usage = usage_dict(inline_response.response)
        for key in totals:
            totals[key] += usage[key]
        report_items.append(
            {
                "id": expected_item["id"],
                "number": expected_item["number"],
                "voices": expected_item["voices"],
                "file": output_path.name,
                "bytes": output_path.stat().st_size,
                "sha256": hashlib.sha256(output_path.read_bytes()).hexdigest(),
                "sourceMimeType": mime_type,
                "boundaryTrim": trim_report,
                "usage": usage,
                **wav_info,
            }
        )
        print(f"Saved {output_path} ({wav_info['durationSeconds']}s)")

    estimated_input_usd = totals["promptTokens"] * 0.50 / 1_000_000
    estimated_output_usd = totals["outputAudioTokens"] * 10.00 / 1_000_000
    report = {
        "model": MODEL,
        "billingMode": "Batch API",
        "batchJob": record,
        "requestCount": len(report_items),
        "paceInstructions": PACE_INSTRUCTIONS,
        "format": {
            "sampleRate": audio_utils.SAMPLE_RATE,
            "channels": audio_utils.CHANNELS,
            "sampleWidth": audio_utils.SAMPLE_WIDTH,
            "encoding": "PCM signed 16-bit little-endian WAV",
        },
        "postProcessing": {
            "speed": "none",
            "loudness": "none",
            "silence": "leading and trailing boundary trim only",
        },
        "usageTotals": totals,
        "estimatedBatchCostUsd": {
            "input": round(estimated_input_usd, 8),
            "outputAudio": round(estimated_output_usd, 8),
            "total": round(estimated_input_usd + estimated_output_usd, 8),
        },
        "items": report_items,
    }
    write_json(report_path, report)
    print(f"Saved {report_path}")
    print(
        "Estimated Batch cost: "
        f"${report['estimatedBatchCostUsd']['total']:.6f} USD"
    )
    return 0


def main():
    args = parse_args()
    if args.command == "prepare":
        prepare(args.output_dir)
        return 0
    if args.command == "submit":
        submit(args.output_dir)
        return 0
    if args.command == "status":
        status(args.output_dir)
        return 0
    return collect(args.output_dir)


if __name__ == "__main__":
    raise SystemExit(main())
