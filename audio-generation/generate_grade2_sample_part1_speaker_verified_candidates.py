import argparse
import hashlib
import json
from pathlib import Path

from google.genai import types

import generate_grade2_gemini_batch_test_five as batch


MODEL = "gemini-3.1-flash-tts-preview"
OUTPUT_DIR = Path(
    "audio-generation/grade2-sample-part1-speaker-verified-candidates-20260724"
)
BATCH_DISPLAY_NAME = "grade2-sample-part1-speaker-verified-candidates-20260724"
SOURCE_MANIFEST = Path("audio-generation/grade2-sample-part1-full.json")
NUMBERS = range(1, 6)
CANDIDATES_PER_ITEM = 2
VOICE_CONFIG = {"Woman": "Kore", "Man": "Puck"}
SOURCE_TO_RENDERED_SPEAKER = {"A": "Woman", "B": "Man"}
TARGET_WORDS_PER_SECOND = 2.44
AFTER_NUMBER_SECONDS = 0.8
BETWEEN_TURNS_SECONDS = 0.55
AFTER_QUESTION_SECONDS = 0.6


def word_count(text):
    import re

    return len(re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)?|\d+", text))


def rendered_segments(source_item):
    return [
        {
            "speaker": SOURCE_TO_RENDERED_SPEAKER[segment["speaker"]],
            "text": segment["text"],
        }
        for segment in source_item["segments"]
    ]


def prompt_for(item):
    transcript = "\n".join(
        f"{segment['speaker']}: {segment['text']}"
        for segment in item["segments"]
    )
    return f"""Synthesize the exact two-person dialogue below as audio for an English listening examination.
Do not speak these instructions, the speaker labels, or the transcript boundary labels.
Woman is one adult woman and must always use the assigned Woman voice.
Man is one adult man and must always use the assigned Man voice.
Every Woman-labeled line must use only the same Woman voice.
Every Man-labeled line must use only the same Man voice.
Never merge, substitute, swap, imitate, or transfer the two voices.
Never let either speaker read a line assigned to the other speaker.
The difference between the adult woman and adult man must remain clearly audible in every turn.
Use natural American English suitable for Japanese high school learners.
Aim for a complete rendered duration of approximately {item['targetDurationSeconds']:.1f} seconds, including the requested pauses.
Maintain one steady conversational pace from beginning to end.
Do not rush, accelerate, over-enunciate, or stretch individual words.
After the Number line, pause clearly for about {AFTER_NUMBER_SECONDS:.2f} seconds.
At each change between Woman and Man, use a brief natural pause of about {BETWEEN_TURNS_SECONDS:.2f} seconds.
After saying "Question," pause clearly for about {AFTER_QUESTION_SECONDS:.2f} seconds before reading the question text.
Do not add other deliberate pauses.
Use natural intonation without sounding theatrical or robotic.
Do not emphasize any detail in a way that reveals the answer.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.

TRANSCRIPT
{transcript}
END TRANSCRIPT"""


def speech_config_for(_item):
    return types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                speaker_voice_configs=[
                    types.SpeakerVoiceConfig(
                        speaker="Woman",
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name="Kore"
                            )
                        ),
                    ),
                    types.SpeakerVoiceConfig(
                        speaker="Man",
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name="Puck"
                            )
                        ),
                    ),
                ]
            )
        ),
    )


def build_plan():
    manifest = batch.read_json(SOURCE_MANIFEST)
    source_items = {
        int(item["number"]): item
        for item in manifest["items"]
        if int(item["number"]) in NUMBERS
    }
    if set(source_items) != set(NUMBERS):
        raise RuntimeError("Source manifest must contain Part 1 No.1-5")

    items = []
    for number in NUMBERS:
        source_item = source_items[number]
        segments = rendered_segments(source_item)
        words = sum(word_count(segment["text"]) for segment in segments)
        target_duration = words / TARGET_WORDS_PER_SECOND
        for candidate in range(1, CANDIDATES_PER_ITEM + 1):
            item = {
                "id": f"No{number:02d}-c{candidate}",
                "baseId": f"No{number:02d}",
                "number": number,
                "candidate": candidate,
                "manifest": str(SOURCE_MANIFEST),
                "segments": segments,
                "voices": dict(VOICE_CONFIG),
                "mode": "dialogue",
                "wordCount": words,
                "targetDurationSeconds": round(target_duration, 3),
            }
            item["prompt"] = prompt_for(item)
            items.append(item)

    return {
        "schemaVersion": 1,
        "createdAt": batch.utc_now(),
        "model": MODEL,
        "billingMode": "Batch API",
        "requestCount": len(items),
        "requestUnit": "one whole two-speaker item per independent candidate request",
        "candidatesPerItem": CANDIDATES_PER_ITEM,
        "speakerContract": {
            "Woman": "Kore",
            "Man": "Puck",
            "actualRenderedSpeakerQaRequired": True,
            "plannedVoiceNamesAreNotProofOfRenderedVoiceIdentity": True,
        },
        "targetWordsPerSecond": TARGET_WORDS_PER_SECOND,
        "pauseInstructions": {
            "afterNumberSeconds": AFTER_NUMBER_SECONDS,
            "betweenSpeakerTurnsSeconds": BETWEEN_TURNS_SECONDS,
            "afterQuestionLabelSeconds": AFTER_QUESTION_SECONDS,
        },
        "postProcessingPlan": {
            "speed": "none",
            "speakerIdentity": "measure every complete body turn before selection",
            "loudness": "constant whole-item PCM gain only after speaker QA passes",
        },
        "candidatePriority": [
            "actual speaker correctness",
            "transcript and structural completeness",
            "pace and pauses",
            "loudness",
        ],
        "existingAudioPolicy": "never overwrite existing audio or output directories",
        "items": items,
    }


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate two speaker-verification candidates for Part 1 No.1-5."
    )
    parser.add_argument("command", choices=("prepare", "submit", "status", "collect"))
    return parser.parse_args()


def collect_resilient():
    report_path = OUTPUT_DIR / "generation-report.json"
    if report_path.exists():
        raise RuntimeError(f"Results were already collected: {report_path}")

    job, record = batch.get_job(OUTPUT_DIR)
    print(f"State: {record['state']}")
    if record["state"] not in batch.SUCCESS_STATES:
        raise RuntimeError(f"Batch job did not succeed: {record['state']}")

    responses = (job.dest.inlined_responses if job.dest else None) or []
    plan = batch.read_json(OUTPUT_DIR / "batch-request-plan.json")
    if len(responses) != len(plan["items"]):
        raise RuntimeError(
            f"Expected {len(plan['items'])} inline responses, received {len(responses)}"
        )

    report_items = []
    failures = []
    totals = {"promptTokens": 0, "outputAudioTokens": 0, "totalTokens": 0}
    for expected_item, inline_response in zip(plan["items"], responses):
        response_id = (inline_response.metadata or {}).get("id")
        if response_id and response_id != expected_item["id"]:
            raise RuntimeError(
                f"Response order mismatch: expected {expected_item['id']}, got {response_id}"
            )
        if inline_response.error:
            failure = {
                "id": expected_item["id"],
                "number": expected_item["number"],
                "error": inline_response.error.model_dump(
                    mode="json", by_alias=True, exclude_none=True
                ),
            }
            failures.append(failure)
            print(
                f"Skipped {expected_item['id']}: "
                + json.dumps(failure["error"], ensure_ascii=False)
            )
            continue
        if not inline_response.response:
            failures.append(
                {
                    "id": expected_item["id"],
                    "number": expected_item["number"],
                    "error": {"message": "No response returned"},
                }
            )
            print(f"Skipped {expected_item['id']}: no response returned")
            continue

        output_path = OUTPUT_DIR / f"{expected_item['id']}.wav"
        if output_path.exists():
            wav_info = batch.audio_utils.inspect_wav(output_path)
            mime_type = "audio/pcm"
            trim_report = {"reusedExistingCollectedFile": True}
            print(f"Reused {output_path} ({wav_info['durationSeconds']}s)")
        else:
            pcm_raw, mime_type = batch.audio_utils.extract_pcm(
                inline_response.response
            )
            pcm, trim_report = batch.audio_utils.trim_silence(pcm_raw)
            batch.audio_utils.write_wav(output_path, pcm)
            wav_info = batch.audio_utils.inspect_wav(output_path)
            print(f"Saved {output_path} ({wav_info['durationSeconds']}s)")

        usage = batch.usage_dict(inline_response.response)
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

    estimated_input_usd = totals["promptTokens"] * 0.50 / 1_000_000
    estimated_output_usd = totals["outputAudioTokens"] * 10.00 / 1_000_000
    report = {
        "model": MODEL,
        "billingMode": "Batch API",
        "batchJob": record,
        "requestCount": len(report_items),
        "requestedCount": len(plan["items"]),
        "failedCount": len(failures),
        "failures": failures,
        "format": {
            "sampleRate": batch.audio_utils.SAMPLE_RATE,
            "channels": batch.audio_utils.CHANNELS,
            "sampleWidth": batch.audio_utils.SAMPLE_WIDTH,
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
    batch.write_json(report_path, report)
    print(f"Saved {report_path}")
    print(
        "Estimated Batch cost: "
        f"${report['estimatedBatchCostUsd']['total']:.6f} USD"
    )
    return 0


batch.MODEL = MODEL
batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
batch.build_plan = build_plan
batch.prompt_for = prompt_for
batch.speech_config_for = speech_config_for


def main():
    args = parse_args()
    if args.command == "prepare":
        batch.prepare(OUTPUT_DIR)
        return 0
    if args.command == "submit":
        batch.submit(OUTPUT_DIR)
        return 0
    if args.command == "status":
        batch.status(OUTPUT_DIR)
        return 0
    return collect_resilient()


if __name__ == "__main__":
    raise SystemExit(main())
