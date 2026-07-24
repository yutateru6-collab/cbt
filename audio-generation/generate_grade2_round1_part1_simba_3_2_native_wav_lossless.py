from __future__ import annotations

import argparse
import base64
import hashlib
import html
import json
import os
import shutil
import sys
import time
import wave
from datetime import datetime, timezone
from pathlib import Path

import generate_elevenlabs_speechify_trial as speechify
import generate_grade2_round1_part1 as source


ROOT = Path(__file__).resolve().parent.parent
SOURCE_JS = ROOT / "grade2-listening-part2-sets.js"
OUTPUT_DIR = (
    ROOT
    / "audio-generation/grade2-round1-part1-simba-3-2-native-wav-lossless-20260719"
)
PUBLISH_DIR = (
    ROOT
    / "audio-generation/cloudflare-publish/grade2-round1-part1-simba-3-2-native-wav-lossless-20260719"
)

SET_KEY = "set-01"
NUMBERS = (1, 2, 3)
MODEL = "simba-3.2"
LANGUAGE = "en-US"
VOICE_A = {"id": "geffen_32", "name": "Geffen", "gender": "female"}
VOICE_B = {"id": "dominic_32", "name": "Dominic", "gender": "male"}
VOICE_NARRATOR = {"id": "harper_32", "name": "Harper", "gender": "female"}

NUMBER_TO_BODY_MS = 1150
TURN_GAP_MS = 550
BODY_TO_QUESTION_MS = 1100
QUESTION_TO_TEXT_MS = 350

NUMBER_WORDS = {1: "one", 2: "two", 3: "three"}
TTS_REPLACEMENTS = {3: {"café": "cafe"}}
MAX_CALLS = 24
MAX_TOTAL_INPUT_CHARACTERS = 8000


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate Part 1 No.1-3 with SpeechifyAI Simba 3.2 native WAV, "
            "then join speaker turns by copying PCM samples without DSP."
        )
    )
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--publish-dir", type=Path, default=PUBLISH_DIR)
    return parser.parse_args()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_items() -> list[dict]:
    questions = source.load_source_questions(SOURCE_JS, SET_KEY)
    part1 = {
        int(question["id"]): question
        for question in questions
        if question.get("part") == "Part 1"
    }
    items = []
    for number in NUMBERS:
        question = part1[number]
        turns = source.parse_dialogue(str(question.get("script", "")))
        if len(turns) != 4:
            raise RuntimeError(f"Part 1 No.{number} must contain four turns")
        for index, turn in enumerate(turns):
            if turn["speaker"] not in {"A", "B"}:
                raise RuntimeError(f"Unexpected speaker in No.{number}")
            if index and turn["speaker"] == turns[index - 1]["speaker"]:
                raise RuntimeError(f"Speakers must alternate in No.{number}")
        items.append(
            {
                "id": f"No{number:02d}",
                "number": number,
                "turns": turns,
                "questionText": str(question.get("questionText", "")).strip(),
            }
        )
    return items


def tts_safe_text(number: int, text: str) -> tuple[str, list[dict]]:
    safe = text
    replacements = []
    for original, replacement in TTS_REPLACEMENTS.get(number, {}).items():
        if original in safe:
            safe = safe.replace(original, replacement)
            replacements.append({"from": original, "to": replacement})
    return safe, replacements


def plain_ssml(text: str) -> str:
    return f"<speak>{html.escape(text, quote=False)}</speak>"


def question_ssml(text: str) -> str:
    return (
        "<speak>Question."
        f'<break time="{QUESTION_TO_TEXT_MS}ms"/>'
        f"{html.escape(text, quote=False)}</speak>"
    )


def segments_for(item: dict) -> list[dict]:
    number = item["number"]
    rows = [
        {
            "role": "number",
            "speaker": "narrator",
            "voice": VOICE_NARRATOR,
            "displayText": f"Number {number}.",
            "ttsText": f"Number {NUMBER_WORDS[number]}.",
            "ttsOverrides": [{"from": str(number), "to": NUMBER_WORDS[number]}],
            "gapAfterMs": NUMBER_TO_BODY_MS,
        }
    ]
    for index, turn in enumerate(item["turns"]):
        safe, replacements = tts_safe_text(number, turn["text"])
        rows.append(
            {
                "role": f"turn{index + 1}",
                "speaker": turn["speaker"],
                "voice": VOICE_A if turn["speaker"] == "A" else VOICE_B,
                "displayText": turn["text"],
                "ttsText": safe,
                "ttsOverrides": replacements,
                "gapAfterMs": (
                    BODY_TO_QUESTION_MS
                    if index == len(item["turns"]) - 1
                    else TURN_GAP_MS
                ),
            }
        )
    question_safe, replacements = tts_safe_text(number, item["questionText"])
    rows.append(
        {
            "role": "question",
            "speaker": "narrator",
            "voice": VOICE_NARRATOR,
            "displayText": f"Question. {item['questionText']}",
            "ttsText": f"Question. {question_safe}",
            "ttsOverrides": replacements,
            "gapAfterMs": 0,
        }
    )
    for row in rows:
        row["input"] = (
            question_ssml(question_safe)
            if row["role"] == "question"
            else plain_ssml(row["ttsText"])
        )
    return rows


def assert_input_contract(item: dict, rows: list[dict]) -> None:
    if len(rows) != 6:
        raise RuntimeError(f"{item['id']} must contain six turn-level requests")
    if [row["gapAfterMs"] for row in rows] != [
        NUMBER_TO_BODY_MS,
        TURN_GAP_MS,
        TURN_GAP_MS,
        TURN_GAP_MS,
        BODY_TO_QUESTION_MS,
        0,
    ]:
        raise RuntimeError(f"Unexpected gap plan in {item['id']}")
    for row in rows:
        lowered = row["input"].lower()
        for forbidden in ("<prosody", "speechify:style", "<emphasis", "rate=", "pitch="):
            if forbidden in lowered:
                raise RuntimeError(f"Forbidden SSML in {item['id']} {row['role']}: {forbidden}")
        if row["role"] == "question":
            if lowered.count("<break ") != 1:
                raise RuntimeError(f"Question break missing in {item['id']}")
        elif "<break " in lowered:
            raise RuntimeError(f"Unexpected break in {item['id']} {row['role']}")


def segment_identity(item: dict, row: dict) -> dict:
    return {
        "provider": "SpeechifyAI",
        "apiVersion": speechify.SPEECHIFY_VERSION,
        "model": MODEL,
        "language": LANGUAGE,
        "audioFormat": "wav",
        "item": item["id"],
        "role": row["role"],
        "voiceId": row["voice"]["id"],
        "input": row["input"],
    }


def segment_path(output_dir: Path, item: dict, row: dict) -> Path:
    key = speechify.cache_key(segment_identity(item, row))
    return (
        output_dir
        / "segments"
        / item["id"]
        / f"{row['role']}-{row['voice']['id']}-{key}.wav"
    )


def read_pcm(path: Path) -> tuple[dict, bytes]:
    with wave.open(str(path), "rb") as handle:
        declared_frame_count = handle.getnframes()
        channels = handle.getnchannels()
        sample_width = handle.getsampwidth()
        sample_rate = handle.getframerate()
        pcm = handle.readframes(declared_frame_count)
        bytes_per_frame = channels * sample_width
        if not bytes_per_frame or len(pcm) % bytes_per_frame:
            raise RuntimeError(f"PCM data is not aligned to complete frames: {path}")
        actual_frame_count = len(pcm) // bytes_per_frame
        info = {
            "channels": channels,
            "sampleWidthBytes": sample_width,
            "bitsPerSample": sample_width * 8,
            "sampleRateHz": sample_rate,
            "frameCount": actual_frame_count,
            "declaredFrameCount": declared_frame_count,
            "sourceHeaderOpenEnded": declared_frame_count == 0x7FFFFFFF,
            "compressionType": handle.getcomptype(),
            "durationSeconds": round(actual_frame_count / sample_rate, 3),
        }
    if info["compressionType"] != "NONE":
        raise RuntimeError(f"Speechify returned compressed WAV: {path}")
    if info["channels"] != 1 or info["sampleWidthBytes"] != 2:
        raise RuntimeError(f"Unexpected Speechify WAV parameters: {info}")
    expected_bytes = info["frameCount"] * info["channels"] * info["sampleWidthBytes"]
    if len(pcm) != expected_bytes:
        raise RuntimeError(f"PCM byte count mismatch: {path}")
    return info, pcm


def request_segment(api_key: str, item: dict, row: dict, destination: Path) -> dict:
    identity = segment_identity(item, row)
    payload = {
        "input": row["input"],
        "voice_id": row["voice"]["id"],
        "audio_format": "wav",
        "language": LANGUAGE,
        "model": MODEL,
    }
    started = time.monotonic()
    body, headers = speechify.request_bytes(
        speechify.SPEECHIFY_API_URL,
        payload,
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Speechify-Version": speechify.SPEECHIFY_VERSION,
            "Idempotency-Key": speechify.cache_key(identity),
        },
    )
    response = json.loads(body.decode("utf-8"))
    encoded = response.get("audio_data")
    if not isinstance(encoded, str) or not encoded:
        raise RuntimeError(f"Speechify response has no audio_data for {item['id']} {row['role']}")
    speechify.atomic_write(destination, base64.b64decode(encoded))
    if not speechify.valid_wav(destination):
        raise RuntimeError(f"Invalid WAV for {item['id']} {row['role']}")
    return {
        "httpStatus": 200,
        "elapsedSeconds": round(time.monotonic() - started, 3),
        "billableCharacters": response.get("billable_characters_count"),
        "requestId": headers.get("x-request-id") or headers.get("X-Request-ID"),
    }


def write_lossless_combined(
    destination: Path, segment_inputs: list[tuple[dict, Path]]
) -> tuple[dict, list[dict]]:
    expected_pcm = bytearray()
    verification = []
    reference = None
    byte_offset = 0
    for row, path in segment_inputs:
        info, pcm = read_pcm(path)
        parameters = (
            info["channels"],
            info["sampleWidthBytes"],
            info["sampleRateHz"],
            info["compressionType"],
        )
        if reference is None:
            reference = parameters
        elif parameters != reference:
            raise RuntimeError(
                f"WAV parameters differ before concatenation: {parameters} != {reference}"
            )
        start = byte_offset
        expected_pcm.extend(pcm)
        byte_offset += len(pcm)
        end = byte_offset
        verification.append(
            {
                "role": row["role"],
                "sourceWav": str(path.relative_to(ROOT)),
                "sourceFileSha256": sha256_file(path),
                "sourcePcmSha256": sha256_bytes(pcm),
                "finalPcmStartByte": start,
                "finalPcmEndByte": end,
                "gapAfterMs": row["gapAfterMs"],
                "wave": info,
            }
        )
        if row["gapAfterMs"]:
            assert reference is not None
            channels, sample_width, sample_rate, _ = reference
            silence_frames = round(sample_rate * row["gapAfterMs"] / 1000)
            silence_bytes = silence_frames * channels * sample_width
            expected_pcm.extend(bytes(silence_bytes))
            byte_offset += silence_bytes

    if reference is None:
        raise RuntimeError("No PCM segments to combine")
    channels, sample_width, sample_rate, _ = reference
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(".tmp.wav")
    with wave.open(str(temporary), "wb") as output:
        output.setnchannels(channels)
        output.setsampwidth(sample_width)
        output.setframerate(sample_rate)
        output.writeframes(bytes(expected_pcm))
    temporary.replace(destination)

    final_info, final_pcm = read_pcm(destination)
    if final_pcm != bytes(expected_pcm):
        raise RuntimeError(f"Final PCM differs from expected bytes: {destination}")
    for row in verification:
        final_slice = final_pcm[row["finalPcmStartByte"] : row["finalPcmEndByte"]]
        row["finalSlicePcmSha256"] = sha256_bytes(final_slice)
        row["pcmSliceMatch"] = row["finalSlicePcmSha256"] == row["sourcePcmSha256"]
        if not row["pcmSliceMatch"]:
            raise RuntimeError(f"PCM slice changed for {row['role']} in {destination.name}")

    summary = {
        "wave": final_info,
        "expectedPcmSha256": sha256_bytes(bytes(expected_pcm)),
        "finalPcmSha256": sha256_bytes(final_pcm),
        "pcmExactMatch": final_pcm == bytes(expected_pcm),
        "allSpeechSlicesExact": all(row["pcmSliceMatch"] for row in verification),
    }
    return summary, verification


def script_html(item: dict) -> str:
    turns = "".join(
        f'<p><strong>{html.escape(turn["speaker"])}</strong> '
        f'{html.escape(turn["text"])}</p>'
        for turn in item["turns"]
    )
    return turns + (
        f'<p class="question"><strong>Question</strong> '
        f'{html.escape(item["questionText"])}</p>'
    )


def write_page(publish_dir: Path, records: list[dict]) -> None:
    cards = []
    for record in records:
        cards.append(
            f"""
            <section class="question-card">
              <div class="card-head">
                <div>
                  <h2>Number {record['number']}</h2>
                  <p>Geffen × Dominic／ナレーター Harper</p>
                </div>
                <a class="download" href="{html.escape(record['publishedWav'])}" download>WAVを保存</a>
              </div>
              <audio controls preload="metadata" src="{html.escape(record['publishedWav'])}"></audio>
              <details><summary>英文を見る</summary>{record['scriptHtml']}</details>
            </section>
            """
        )
    page = f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Part 1｜SpeechifyAI Simba 3.2 無劣化WAV</title>
  <style>
    :root{{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#18211c;background:#f3f1eb}}
    *{{box-sizing:border-box}}body{{margin:0}}main{{width:min(760px,calc(100% - 24px));margin:auto;padding:28px 0 52px}}
    h1{{font-size:clamp(27px,7vw,42px);line-height:1.08;margin:0 0 14px}}h1 span{{display:block;color:#35644a}}
    .lead,.contract,.note{{line-height:1.7;color:#4d5a51}}.contract{{background:#e4f0e8;border:1px solid #b9d2c1;border-radius:14px;padding:12px 14px}}
    .question-card{{background:#fff;border:1px solid #d7ddd8;border-radius:18px;padding:17px;margin:17px 0;box-shadow:0 5px 22px rgba(35,50,41,.06)}}
    .card-head{{display:flex;align-items:start;justify-content:space-between;gap:12px}}h2{{font-size:22px;margin:0 0 4px}}.card-head p{{margin:0 0 13px;color:#637067}}
    .download{{color:#285e40;font-weight:700;white-space:nowrap}}audio{{display:block;width:100%;margin:8px 0 13px}}details{{border-top:1px solid #e4e8e5;padding-top:11px}}summary{{cursor:pointer;font-weight:700}}
    details p{{line-height:1.65;margin:.7em 0}}.question{{color:#244f36}}.note{{font-size:14px}}
    @media(max-width:460px){{.card-head{{display:block}}.download{{display:inline-block;margin-bottom:10px}}}}
  </style>
</head>
<body><main>
  <h1>Part 1<span>SpeechifyAI Simba 3.2</span></h1>
  <p class="lead">同じPart 1の3問を、話者の発言ターン単位で生成しました。1発言に複数文あっても文単位に分割していません。</p>
  <p class="contract"><strong>Speechify原音のPCMをそのまま使用</strong><br>
  WAV直接取得／MP3化なし／FFmpegなし／無音トリミングなし／音量正規化なし／速度変更なし／リサンプリングなし。</p>
  {''.join(cards)}
  <p class="note">間隔：問題番号後1.15秒／会話ターン間0.55秒／会話後1.10秒／“Question.”後0.35秒。完成WAVの各発話PCMがSpeechify直後のPCMとバイト単位で一致することを検査済みです。</p>
</main>
<script>
  const players=[...document.querySelectorAll('audio')];
  players.forEach(player=>player.addEventListener('play',()=>players.forEach(other=>{{if(other!==player)other.pause()}})));
</script>
</body></html>
"""
    publish_dir.mkdir(parents=True, exist_ok=True)
    (publish_dir / "index.html").write_text(page, encoding="utf-8")
    (publish_dir / "_headers").write_text(
        "/audio/*.wav\n  Content-Type: audio/wav\n  Cache-Control: public, max-age=31536000, immutable\n",
        encoding="utf-8",
    )


def preflight(items: list[dict], output_dir: Path) -> dict:
    rows = []
    missing_calls = 0
    missing_characters = 0
    for item in items:
        segments = segments_for(item)
        assert_input_contract(item, segments)
        serialized = []
        for row in segments:
            path = segment_path(output_dir, item, row)
            cached = speechify.valid_wav(path)
            if not cached:
                missing_calls += 1
                missing_characters += len(row["input"])
            serialized.append(
                {
                    "role": row["role"],
                    "speaker": row["speaker"],
                    "voice": row["voice"]["name"],
                    "voiceId": row["voice"]["id"],
                    "input": row["input"],
                    "gapAfterMs": row["gapAfterMs"],
                    "cached": cached,
                }
            )
        rows.append({"id": item["id"], "segments": serialized})
    if missing_calls > MAX_CALLS or missing_characters > MAX_TOTAL_INPUT_CHARACTERS:
        raise RuntimeError("Speechify preflight exceeds the fixed safety ceiling")
    return {
        "provider": "SpeechifyAI",
        "model": MODEL,
        "language": LANGUAGE,
        "apiVersion": speechify.SPEECHIFY_VERSION,
        "audioFormat": "wav",
        "missingCalls": missing_calls,
        "missingInputCharacters": missing_characters,
        "maxCalls": MAX_CALLS,
        "maxInputCharacters": MAX_TOTAL_INPUT_CHARACTERS,
        "items": rows,
    }


def execute(items: list[dict], output_dir: Path, publish_dir: Path, plan: dict) -> dict:
    api_key = (
        os.environ.get("SPEECHIFY_API_KEY", "").strip()
        or os.environ.get("SPEECHFY_API_KEY", "").strip()
    )
    if plan["missingCalls"] and not api_key:
        raise RuntimeError("SPEECHIFY_API_KEY is not set")
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "audio").mkdir(parents=True, exist_ok=True)
    (publish_dir / "audio").mkdir(parents=True, exist_ok=True)

    request_count = 0
    billed_characters = 0
    records = []
    for item in items:
        segment_inputs = []
        segment_reports = []
        for row in segments_for(item):
            path = segment_path(output_dir, item, row)
            api = None
            if not speechify.valid_wav(path):
                api = request_segment(api_key, item, row, path)
                request_count += 1
                billed_characters += api.get("billableCharacters") or 0
                time.sleep(0.35)
            info, pcm = read_pcm(path)
            segment_inputs.append((row, path))
            segment_reports.append(
                {
                    "role": row["role"],
                    "speaker": row["speaker"],
                    "voice": row["voice"]["name"],
                    "voiceId": row["voice"]["id"],
                    "displayText": row["displayText"],
                    "ttsText": row["ttsText"],
                    "ttsOverrides": row["ttsOverrides"],
                    "input": row["input"],
                    "gapAfterMs": row["gapAfterMs"],
                    "sourceWav": str(path.relative_to(ROOT)),
                    "sourceFileSha256": sha256_file(path),
                    "sourcePcmSha256": sha256_bytes(pcm),
                    "wave": info,
                    "api": api,
                }
            )

        filename = f"part1-{item['id']}-simba-3-2-native-pcm-lossless.wav"
        master_path = output_dir / "audio" / filename
        pcm_summary, slice_verification = write_lossless_combined(master_path, segment_inputs)
        published_path = publish_dir / "audio" / filename
        shutil.copyfile(master_path, published_path)
        master_hash = sha256_file(master_path)
        published_hash = sha256_file(published_path)
        if master_hash != published_hash:
            raise RuntimeError(f"Published copy differs from master: {filename}")
        records.append(
            {
                "id": item["id"],
                "number": item["number"],
                "voices": {
                    "A": VOICE_A,
                    "B": VOICE_B,
                    "narrator": VOICE_NARRATOR,
                },
                "scriptHtml": script_html(item),
                "segments": segment_reports,
                "pcmVerification": pcm_summary,
                "sliceVerification": slice_verification,
                "masterWav": str(master_path.relative_to(ROOT)),
                "publishedWav": f"audio/{filename}",
                "masterSha256": master_hash,
                "publishedSha256": published_hash,
                "publishedCopyHashMatch": master_hash == published_hash,
                "fileBytes": master_path.stat().st_size,
            }
        )

    write_page(publish_dir, records)
    report = {
        "mode": "completed",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "provider": "SpeechifyAI",
        "endpoint": speechify.SPEECHIFY_API_URL,
        "apiVersion": speechify.SPEECHIFY_VERSION,
        "model": MODEL,
        "part": "Part 1",
        "numbers": list(NUMBERS),
        "sourceSet": SET_KEY,
        "apiRequestCount": request_count,
        "billableCharacters": billed_characters,
        "timingMs": {
            "numberToBody": NUMBER_TO_BODY_MS,
            "turnGap": TURN_GAP_MS,
            "bodyToQuestion": BODY_TO_QUESTION_MS,
            "questionToText": QUESTION_TO_TEXT_MS,
        },
        "deliveryContract": {
            "speechifyDirectWav": True,
            "speakerTurnRequests": True,
            "sentenceLevelSplit": False,
            "questionAndQuestionTextOneRequest": True,
            "losslessPcmConcatenation": True,
            "speechPcmSamplesChanged": False,
            "silenceInsertionOnly": True,
            "ffmpeg": False,
            "postSynthesisReencoding": False,
            "postSynthesisResampling": False,
            "lossyEncoding": False,
            "silenceTrimming": False,
            "loudnessNormalization": False,
            "remaster": False,
            "playbackRateModification": False,
            "prosody": False,
            "emotionStyle": False,
        },
        "preflight": plan,
        "items": records,
    }
    report_path = output_dir / "generation-report.json"
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_dir / "index.html").write_text(
        (publish_dir / "index.html").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    return report


def main() -> int:
    args = parse_args()
    items = load_items()
    plan = preflight(items, args.output_dir)
    if not args.execute:
        print(json.dumps({"mode": "preflight", **plan}, ensure_ascii=False, indent=2))
        return 0
    report = execute(items, args.output_dir, args.publish_dir, plan)
    summary = {
        "mode": report["mode"],
        "model": report["model"],
        "apiRequestCount": report["apiRequestCount"],
        "billableCharacters": report["billableCharacters"],
        "items": [
            {
                "id": item["id"],
                "wave": item["pcmVerification"]["wave"],
                "pcmExactMatch": item["pcmVerification"]["pcmExactMatch"],
                "allSpeechSlicesExact": item["pcmVerification"]["allSpeechSlicesExact"],
                "publishedCopyHashMatch": item["publishedCopyHashMatch"],
                "fileBytes": item["fileBytes"],
            }
            for item in report["items"]
        ],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
