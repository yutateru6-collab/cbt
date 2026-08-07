import argparse
import copy
import hashlib
import json
from pathlib import Path

from google.genai import types

import generate_grade2_gemini_batch_test_five as batch
import generate_grade2_set01_first_ten_clear_medium_20260805 as helpers


ROOT = Path(__file__).resolve().parent.parent
MODEL = "gemini-3.1-flash-tts-preview"
OUTPUT_DIR = Path("audio-generation/grade2-set02-full-approved-gemini-20260806")
BATCH_DISPLAY_NAME = "grade2-set02-full-approved-gemini-20260806"
PART1_VOICES = {"Kore": "Kore", "Puck": "Puck"}
PART2_VOICE = "Achird"
BANNED_VOICES = {"dominic_32", "geffen_32", "harper_32"}
PART1_TARGET_WPS = 2.30
PART2_TARGET_WPS = 2.45
PART1_PROMPT_WPS = 1.75
PART2_PROMPT_WPS = 2.45
PART1_FIXED_PAUSE_SECONDS = 2.6
PART2_FIXED_PAUSE_SECONDS = 2.7
PART1_CANDIDATES = 4
PART2_CANDIDATES = 2


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def target_duration(item):
    return item["wordCount"] / item["targetEffectiveWordsPerSecond"] + item["fixedPauseSeconds"]


def part1_prompt(item):
    transcript = batch.transcript_for(item)
    duration = target_duration(item)
    return f'''Synthesize the exact transcript below as one continuous English listening-test audio item.
Do not speak these instructions, speaker labels, or boundary labels.
The speaker named Kore must always use the assigned adult-female Kore voice.
The speaker named Puck must always use the assigned adult-male Puck voice at a clearly lower pitch.
Keep each identity unchanged on both of that speaker's dialogue turns. Never blend, imitate, swap, or drift between identities.
Use natural American English suitable for Japanese high school learners.

Read clearly at about {PART1_PROMPT_WPS:.2f} spoken words per second. This deliberately measured instruction is used so that the rendered result lands near the approved natural medium pace of {PART1_TARGET_WPS:.2f} spoken words per second.
Keep natural connected speech. Articulate function words, contractions, consonant endings, and sentence endings.
Do not sound slow, choppy, robotic, theatrical, or word-by-word. Do not stretch vowels or insert extra gaps.

Pause about 0.9 seconds after the Number line, about 1.1 seconds before saying "Question," and about 0.6 seconds after "Question."
Use calm natural turn-taking. Do not emphasize answer clues.
Read every transcript word exactly once without adding, omitting, repeating, paraphrasing, or explaining.
Do not finish the complete item in less than {duration - 1.0:.1f} seconds. Aim for approximately {duration:.1f} seconds including the structural pauses.
Do not create the duration with silence or stretched vowels. Use calm, carefully articulated connected speech throughout every turn.

TRANSCRIPT
{transcript}
END TRANSCRIPT'''


def part2_prompt(item):
    transcript = batch.transcript_for(item)
    duration = target_duration(item)
    return f'''Synthesize the exact transcript below as one continuous audio item for an English listening examination.
Do not speak these instructions or the transcript boundary labels.
Use one adult narrator throughout, using only the assigned Achird voice.
Use natural American English suitable for Japanese high school learners.

Read at a clear, calm-medium, steady pace of about {PART2_PROMPT_WPS:.2f} spoken words per second.
Use a natural clear pace, only a touch quicker than a careful medium reading; never rush.
Articulate all words clearly, including short function words, contractions, consonant endings, and sentence endings.
Keep natural connected speech and natural sentence timing.
Do not isolate each word, insert extra gaps between words, stretch vowels, rush long sentences, or linger on individual words.
Do not sound slow, choppy, robotic, theatrical, or exaggerated.
Maintain the same calm-medium pace through the end of the passage and question.

Pause for about 1.1 seconds after the Number line before beginning the passage.
Pause for about 1.1 seconds after the passage before saying "Question."
After saying "Question," pause for about 0.5 seconds before reading the question text.
Do not emphasize any detail in a way that reveals the answer.
Read every transcript word exactly once. Do not add, omit, repeat, paraphrase, or explain anything.
Aim for approximately {duration:.1f} seconds for the complete item including the structural pauses, without adding unnatural silence or stretching words.

TRANSCRIPT
{transcript}
END TRANSCRIPT'''


def load_base_items():
    part1_set = next(value for value in helpers.part1_source.load_sets() if value["key"] == "set-02")
    part2_set = next(value for value in helpers.part2_source.load_part2_sets() if value["key"] == "set-02")
    part1_questions = {int(value["id"]): value for value in part1_set["questions"]}
    part2_questions = {int(value["id"]): value for value in part2_set["questions"]}
    if sorted(part1_questions) != list(range(1, 16)):
        raise RuntimeError(f"Unexpected Part 1 IDs: {sorted(part1_questions)}")
    if sorted(part2_questions) != list(range(16, 31)):
        raise RuntimeError(f"Unexpected Part 2 IDs: {sorted(part2_questions)}")

    items = []
    for number in range(1, 16):
        question = part1_questions[number]
        body = helpers.audio_text.parse_dialogue(str(question["script"]))
        if len(body) != 4:
            raise RuntimeError(f"Part 1 No.{number} must contain exactly four dialogue turns")
        named_body = [
            {**segment, "speaker": "Kore" if segment["speaker"] == "Woman" else "Puck"}
            for segment in body
        ]
        first_speaker = named_body[0]["speaker"]
        segments = [
            {"speaker": first_speaker, "text": f"Number {number}."},
            *named_body,
            {"speaker": first_speaker, "text": f"Question. {str(question['questionText']).strip()}"},
        ]
        item = {
            "id": f"set-02-part1-No{number:02d}-approved-gemini-20260806",
            "setKey": "set-02", "setLabel": part1_set["label"], "part": "Part 1", "number": number,
            "segments": segments, "voices": dict(PART1_VOICES), "mode": "dialogue",
            "wordCount": sum(helpers.audio_text.word_count(value["text"]) for value in segments),
            "fixedPauseSeconds": PART1_FIXED_PAUSE_SECONDS,
            "targetEffectiveWordsPerSecond": PART1_TARGET_WPS,
        }
        item["targetDurationSeconds"] = round(target_duration(item), 2)
        item["prompt"] = part1_prompt(item)
        items.append(item)

    for number in range(16, 31):
        question = part2_questions[number]
        segments = [
            {"speaker": "N", "text": f"Number {number}."},
            {"speaker": "N", "text": str(question["script"]).strip()},
            {"speaker": "N", "text": f"Question. {str(question['questionText']).strip()}"},
        ]
        item = {
            "id": f"set-02-part2-No{number:02d}-approved-gemini-20260806",
            "setKey": "set-02", "setLabel": part2_set["label"], "part": "Part 2", "number": number,
            "segments": segments, "voices": {"N": PART2_VOICE}, "mode": "narration",
            "wordCount": sum(helpers.audio_text.word_count(value["text"]) for value in segments),
            "fixedPauseSeconds": PART2_FIXED_PAUSE_SECONDS,
            "targetEffectiveWordsPerSecond": PART2_TARGET_WPS,
        }
        item["targetDurationSeconds"] = round(target_duration(item), 2)
        item["prompt"] = part2_prompt(item)
        items.append(item)
    return items


def candidate_items(base_items):
    items = []
    for original in base_items:
        count = PART1_CANDIDATES if original["part"] == "Part 1" else PART2_CANDIDATES
        for candidate_number in range(1, count + 1):
            item = copy.deepcopy(original)
            item["sourceItemId"] = original["id"]
            item["candidateNumber"] = candidate_number
            item["id"] = original["id"].replace(
                "-approved-gemini-", f"-approved-gemini-c{candidate_number}-"
            )
            items.append(item)
    return items


def build_plan():
    base_items = load_base_items()
    items = candidate_items(base_items)
    configured = {voice for item in items for voice in item["voices"].values()}
    if configured & BANNED_VOICES:
        raise RuntimeError(f"Banned voices configured: {sorted(configured & BANNED_VOICES)}")
    sources = [
        ROOT / "grade2-set-01.js",
        ROOT / "grade2-listening-part2-sets.js",
        ROOT / "audio-generation" / "listening-voice-notes.md",
    ]
    return {
        "schemaVersion": 1, "createdAt": batch.utc_now(), "model": MODEL,
        "billingMode": "Batch API", "requestCount": len(items),
        "requestUnit": "one whole listening item per request",
        "scope": {"set": "set-02", "part1": list(range(1, 16)), "part2": list(range(16, 31))},
        "candidateCountPerItem": {"part1": PART1_CANDIDATES, "part2": PART2_CANDIDATES},
        "voices": {"part1": PART1_VOICES, "part2": PART2_VOICE},
        "bannedVoices": sorted(BANNED_VOICES),
        "deliveryPolicy": {
            "approvedEffectiveWordsPerSecond": {"part1": PART1_TARGET_WPS, "part2": PART2_TARGET_WPS},
            "promptWordsPerSecond": {"part1": PART1_PROMPT_WPS, "part2": PART2_PROMPT_WPS},
            "fixedPauseSeconds": {"part1": PART1_FIXED_PAUSE_SECONDS, "part2": PART2_FIXED_PAUSE_SECONDS},
            "speedPostProcessing": "none", "normalization": "none", "equalization": "none",
            "compression": "none", "resampling": "none",
            "loudness": "whole-file constant linear gain only during review packaging",
        },
        "sourceFiles": [
            {"path": str(path.relative_to(ROOT)).replace("\\", "/"), "sha256": sha256(path)}
            for path in sources
        ],
        "existingAudioPolicy": "never overwrite existing generation or production R2 audio",
        "baseItems": base_items,
        "items": items,
    }


def speech_config_for(item):
    if item["part"] == "Part 2":
        return types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=PART2_VOICE)
                )
            ),
        )
    return types.GenerateContentConfig(
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                speaker_voice_configs=[
                    types.SpeakerVoiceConfig(
                        speaker=name,
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=name)
                        ),
                    )
                    for name in ("Kore", "Puck")
                ]
            )
        ),
    )


def finalize_collection():
    report_path = OUTPUT_DIR / "generation-report.json"
    if report_path.exists():
        raise RuntimeError(f"Refusing to overwrite: {report_path}")
    status = batch.read_json(OUTPUT_DIR / "collection-status.json")
    plan = batch.read_json(OUTPUT_DIR / "batch-request-plan.json")
    batch.write_json(report_path, {
        "model": MODEL, "billingMode": "Batch API", "batchJob": status["batchJob"],
        "requestCount": plan["requestCount"], "successfulCount": len(status["items"]),
        "failureCount": len(status["failures"]), "failures": status["failures"],
        "format": {"container": "WAV", "codec": "PCM signed 16-bit", "sampleRate": 24000, "channels": 1},
        "postProcessing": {"speed": "none", "loudness": "none during collection", "silence": "boundary trim only"},
        "usageTotals": status["usageTotals"], "estimatedBatchCostUsd": status["estimatedBatchCostUsd"],
        "items": status["items"],
    })
    print(f"Finalized {len(status['items'])} successful candidates and {len(status['failures'])} failures")


batch.MODEL = MODEL
batch.DEFAULT_OUTPUT_DIR = OUTPUT_DIR
batch.BATCH_DISPLAY_NAME = BATCH_DISPLAY_NAME
batch.build_plan = build_plan
batch.prompt_for = lambda item: item["prompt"]
batch.speech_config_for = speech_config_for


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("prepare", "submit", "status", "collect-resume", "finalize"))
    command = parser.parse_args().command
    if command == "prepare": batch.prepare(OUTPUT_DIR); return 0
    if command == "submit": batch.submit(OUTPUT_DIR); return 0
    if command == "status": batch.status(OUTPUT_DIR); return 0
    if command == "collect-resume": return helpers.collect_resume(OUTPUT_DIR)
    finalize_collection(); return 0


if __name__ == "__main__":
    raise SystemExit(main())
