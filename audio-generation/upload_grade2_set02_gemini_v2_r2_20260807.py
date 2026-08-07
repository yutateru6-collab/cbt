import argparse
import hashlib
import json
import subprocess
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
PACKAGE_DIR = ROOT / "audio-generation" / "cloudflare-publish" / "grade2-set02-full-approved-review-v2-20260807"
MANIFEST_PATH = PACKAGE_DIR / "generation-and-publish-report.json"
REPORT_PATH = ROOT / "audio-generation" / "r2-grade2-set02-gemini-v2-20260807-upload-report.json"
WRANGLER = ROOT / "node_modules" / ".bin" / "wrangler.cmd"
BUCKET = "mimilisten-audio"
PREFIX = "scbt/grade2/releases/20260807-gemini-approved-v2"
PUBLIC_BASE = "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev"
MAX_WORKERS = 4


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256_bytes(value):
    return hashlib.sha256(value).hexdigest()


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def remote_get(url):
    request = urllib.request.Request(
        f"{url}?verify={time.time_ns()}",
        headers={"User-Agent": "grade2-set02-v2-r2-verifier/20260807", "Cache-Control": "no-cache"},
    )
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            body = response.read()
            return {
                "status": response.status,
                "contentType": response.headers.get("Content-Type"),
                "contentLength": len(body),
                "sha256": sha256_bytes(body),
                "error": None,
            }
    except urllib.error.HTTPError as error:
        body = error.read()
        return {
            "status": error.code,
            "contentType": error.headers.get("Content-Type"),
            "contentLength": len(body),
            "sha256": sha256_bytes(body) if body else None,
            "error": str(error),
        }
    except Exception as error:
        return {
            "status": None,
            "contentType": None,
            "contentLength": None,
            "sha256": None,
            "error": f"{type(error).__name__}: {error}",
        }


def make_entry(local_path, key, content_type, expected_sha=None):
    local_sha = sha256_file(local_path)
    if expected_sha and local_sha != expected_sha:
        raise RuntimeError(f"Local package hash mismatch: {local_path}")
    if not key.startswith(PREFIX + "/"):
        raise RuntimeError(f"R2 key escaped the approved prefix: {key}")
    return {
        "localFile": str(local_path.relative_to(ROOT)).replace("\\", "/"),
        "localBytes": local_path.stat().st_size,
        "localSha256": local_sha,
        "r2Bucket": BUCKET,
        "r2Key": key,
        "publicUrl": f"{PUBLIC_BASE}/{key}",
        "contentType": content_type,
        "state": "pending",
        "preflight": None,
        "upload": None,
        "verification": None,
    }


def create_report():
    manifest = read_json(MANIFEST_PATH)
    if manifest.get("setKey") != "set-02" or len(manifest.get("items", [])) != 30:
        raise RuntimeError("Expected the approved Set 2 30-item package manifest")
    entries = []
    for item in manifest["items"]:
        part_slug = "part1" if item["part"] == "Part 1" else "part2"
        number = int(item["number"])
        local_path = PACKAGE_DIR / item["file"]
        key = f"{PREFIX}/set-02/listening/{part_slug}/No{number:02d}.wav"
        entries.append(make_entry(local_path, key, "audio/wav", item["sha256"]))

    continuous_path = PACKAGE_DIR / "audio" / "all-30-continuous.mp3"
    continuous_report = read_json(PACKAGE_DIR / "continuous-audio-report.json")
    entries.append(make_entry(
        continuous_path,
        f"{PREFIX}/set-02/listening/continuous/all-30-continuous.mp3",
        "audio/mpeg",
        continuous_report["smartphoneMp3"]["sha256"],
    ))
    expected_keys = {
        f"{PREFIX}/set-02/listening/{'part1' if number <= 15 else 'part2'}/No{number:02d}.wav"
        for number in range(1, 31)
    }
    expected_keys.add(f"{PREFIX}/set-02/listening/continuous/all-30-continuous.mp3")
    actual_keys = {entry["r2Key"] for entry in entries}
    if len(entries) != 31 or actual_keys != expected_keys:
        raise RuntimeError("Upload allowlist is not exactly the approved 30 WAVs plus continuous MP3")
    return {
        "schemaVersion": 1,
        "createdAt": utc_now(),
        "updatedAt": utc_now(),
        "packageManifest": str(MANIFEST_PATH.relative_to(ROOT)).replace("\\", "/"),
        "packageManifestSha256": sha256_file(MANIFEST_PATH),
        "bucket": BUCKET,
        "prefix": PREFIX,
        "publicBase": PUBLIC_BASE,
        "fileCount": len(entries),
        "totalBytes": sum(entry["localBytes"] for entry in entries),
        "entries": entries,
        "allUploaded": False,
        "allVerified": False,
    }


def load_or_create_report():
    manifest_sha = sha256_file(MANIFEST_PATH)
    if REPORT_PATH.exists():
        report = read_json(REPORT_PATH)
        if (
            report.get("packageManifestSha256") != manifest_sha
            or report.get("bucket") != BUCKET
            or report.get("prefix") != PREFIX
            or report.get("fileCount") != 31
        ):
            raise RuntimeError("Existing upload report does not match this immutable release")
        return report
    report = create_report()
    write_json(REPORT_PATH, report)
    return report


def persist(report):
    report["updatedAt"] = utc_now()
    report["allUploaded"] = all(entry["state"] in {"uploaded", "verified"} for entry in report["entries"])
    report["allVerified"] = all(entry["state"] == "verified" for entry in report["entries"])
    write_json(REPORT_PATH, report)


def preflight(entry):
    remote = remote_get(entry["publicUrl"])
    content_type = (remote["contentType"] or "").split(";", 1)[0].lower()
    if remote["status"] == 404:
        return {"action": "upload", "remote": remote}
    if (
        remote["status"] == 200
        and content_type == entry["contentType"]
        and remote["contentLength"] == entry["localBytes"]
        and remote["sha256"] == entry["localSha256"]
    ):
        return {"action": "already-matching", "remote": remote}
    return {"action": "conflict", "remote": remote}


def upload(entry):
    local_path = ROOT / entry["localFile"]
    command = [
        str(WRANGLER), "r2", "object", "put", f"{BUCKET}/{entry['r2Key']}",
        "--file", str(local_path), "--content-type", entry["contentType"],
        "--cache-control", "public, max-age=31536000, immutable", "--remote",
    ]
    started = time.monotonic()
    completed = subprocess.run(
        command, check=False, capture_output=True, text=True,
        encoding="utf-8", errors="replace", timeout=300,
    )
    return {
        "returnCode": completed.returncode,
        "elapsedSeconds": round(time.monotonic() - started, 3),
        "stdout": (completed.stdout or "").strip(),
        "stderr": (completed.stderr or "").strip(),
    }


def verify(entry):
    attempts = []
    for attempt in range(1, 5):
        remote = remote_get(entry["publicUrl"])
        content_type = (remote["contentType"] or "").split(";", 1)[0].lower()
        passed = (
            remote["status"] == 200
            and content_type == entry["contentType"]
            and remote["contentLength"] == entry["localBytes"]
            and remote["sha256"] == entry["localSha256"]
        )
        attempts.append({"attempt": attempt, "checkedAt": utc_now(), **remote, "passed": passed})
        if passed:
            return {"passed": True, "attempts": attempts}
        time.sleep(2 * attempt)
    return {"passed": False, "attempts": attempts}


def execute_upload():
    if not WRANGLER.exists():
        raise RuntimeError(f"Wrangler not found: {WRANGLER}")
    report = load_or_create_report()
    pending = [entry for entry in report["entries"] if entry["state"] != "verified"]
    conflicts = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(preflight, entry): entry for entry in pending}
        for future in as_completed(futures):
            entry = futures[future]
            result = future.result()
            entry["preflight"] = {"checkedAt": utc_now(), "action": result["action"], **result["remote"]}
            if result["action"] == "already-matching":
                entry["state"] = "verified"
                entry["verification"] = {"passed": True, "source": "preflight", "attempts": []}
            elif result["action"] == "conflict":
                conflicts.append(entry["r2Key"])
    persist(report)
    if conflicts:
        raise RuntimeError("Refusing to overwrite conflicting immutable R2 keys: " + ", ".join(conflicts))

    uploadable = [entry for entry in report["entries"] if entry["state"] == "pending"]
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(upload, entry): entry for entry in uploadable}
        for future in as_completed(futures):
            entry = futures[future]
            result = future.result()
            entry["upload"] = {"uploadedAt": utc_now(), **result}
            if result["returnCode"] != 0:
                persist(report)
                raise RuntimeError(f"R2 upload failed for {entry['r2Key']}: {result['stderr']}")
            entry["state"] = "uploaded"
    persist(report)

    uploaded = [entry for entry in report["entries"] if entry["state"] == "uploaded"]
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(verify, entry): entry for entry in uploaded}
        for future in as_completed(futures):
            entry = futures[future]
            result = future.result()
            entry["verification"] = result
            if result["passed"]:
                entry["state"] = "verified"
    persist(report)
    if not report["allVerified"]:
        failed = [entry["r2Key"] for entry in report["entries"] if entry["state"] != "verified"]
        raise RuntimeError("Public R2 verification failed: " + ", ".join(failed))
    print(f"Verified {len(report['entries'])}/31 objects at {PUBLIC_BASE}/{PREFIX}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("plan", "upload"))
    command = parser.parse_args().command
    if command == "plan":
        report = load_or_create_report()
        print(f"Prepared {REPORT_PATH} with {report['fileCount']} allowlisted objects")
        return 0
    execute_upload()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
