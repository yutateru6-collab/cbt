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
SOURCE_DIR = ROOT / "audio-generation" / "grade2-speaking-gemini-kore-20260810-v3"
MANIFEST_PATH = SOURCE_DIR / "generation-report.json"
REPORT_PATH = ROOT / "audio-generation" / "r2-grade2-speaking-gemini-kore-20260810-upload-report.json"
WRANGLER = ROOT / "node_modules" / ".bin" / "wrangler.cmd"
BUCKET = "mimilisten-audio"
PREFIX = "scbt/grade2/releases/20260810-gemini-speaking-kore-v1"
PUBLIC_BASE = "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev"
MAX_WORKERS = 4


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def sha256_bytes(value):
    return hashlib.sha256(value).hexdigest()


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def request_url(url, range_header=None):
    headers = {
        "User-Agent": "grade2-speaking-r2-verifier/20260810",
        "Cache-Control": "no-cache",
    }
    if range_header:
        headers["Range"] = range_header
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            body = response.read()
            return {
                "status": response.status,
                "contentType": response.headers.get("Content-Type"),
                "contentRange": response.headers.get("Content-Range"),
                "contentLength": len(body),
                "sha256": sha256_bytes(body),
                "error": None,
            }
    except urllib.error.HTTPError as error:
        body = error.read()
        return {
            "status": error.code,
            "contentType": error.headers.get("Content-Type"),
            "contentRange": error.headers.get("Content-Range"),
            "contentLength": len(body),
            "sha256": sha256_bytes(body) if body else None,
            "error": str(error),
        }
    except Exception as error:
        return {
            "status": None,
            "contentType": None,
            "contentRange": None,
            "contentLength": None,
            "sha256": None,
            "error": f"{type(error).__name__}: {error}",
        }


def load_manifest():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if manifest.get("state") != "generated" or manifest.get("itemCount") != 27:
        raise RuntimeError("Expected a completed 27-file generation report")
    return manifest


def build_entries(manifest):
    entries = []
    for item in manifest["items"]:
        local_path = SOURCE_DIR / item["file"]
        if not local_path.is_file():
            raise RuntimeError(f"Missing local file: {local_path}")
        local_sha = sha256_file(local_path)
        if local_sha != item["sha256"]:
            raise RuntimeError(f"Local hash mismatch: {item['file']}")
        r2_key = f"{PREFIX}/{item['file']}"
        entries.append(
            {
                "id": item["id"],
                "localFile": str(local_path.relative_to(ROOT)).replace("\\", "/"),
                "localBytes": local_path.stat().st_size,
                "localSha256": local_sha,
                "r2Key": r2_key,
                "publicUrl": f"{PUBLIC_BASE}/{r2_key}",
                "state": "pending",
                "preflight": None,
                "upload": None,
                "verification": None,
            }
        )
    if len(entries) != 27 or len({entry["r2Key"] for entry in entries}) != 27:
        raise RuntimeError("Expected exactly 27 unique upload entries")
    return entries


def save_report(report):
    report["updatedAt"] = utc_now()
    report["allVerified"] = all(entry["state"] == "verified" for entry in report["entries"])
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def preflight(entry):
    result = request_url(entry["publicUrl"])
    mime = (result["contentType"] or "").split(";", 1)[0].lower()
    if result["status"] == 404:
        return "upload", result
    if (
        result["status"] == 200
        and mime == "audio/wav"
        and result["contentLength"] == entry["localBytes"]
        and result["sha256"] == entry["localSha256"]
    ):
        return "matching", result
    return "conflict", result


def upload(entry):
    command = [
        str(WRANGLER),
        "r2",
        "object",
        "put",
        f"{BUCKET}/{entry['r2Key']}",
        "--file",
        str(ROOT / entry["localFile"]),
        "--content-type",
        "audio/wav",
        "--cache-control",
        "public, max-age=31536000, immutable",
        "--remote",
    ]
    completed = subprocess.run(
        command,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=240,
    )
    return {
        "returnCode": completed.returncode,
        "stdout": (completed.stdout or "").strip(),
        "stderr": (completed.stderr or "").strip(),
    }


def verify(entry):
    for attempt in range(1, 5):
        full = request_url(entry["publicUrl"])
        partial = request_url(entry["publicUrl"], "bytes=0-127")
        mime = (full["contentType"] or "").split(";", 1)[0].lower()
        passed = (
            full["status"] == 200
            and mime == "audio/wav"
            and full["contentLength"] == entry["localBytes"]
            and full["sha256"] == entry["localSha256"]
            and partial["status"] == 206
            and partial["contentLength"] == 128
            and str(partial["contentRange"] or "").startswith("bytes 0-127/")
        )
        result = {"attempt": attempt, "passed": passed, "full": full, "range": partial}
        if passed:
            return result
        time.sleep(3 * attempt)
    return result


def main():
    if not WRANGLER.is_file():
        raise RuntimeError(f"Wrangler not found: {WRANGLER}")
    manifest = load_manifest()
    report = {
        "schemaVersion": 1,
        "createdAt": utc_now(),
        "updatedAt": utc_now(),
        "bucket": BUCKET,
        "prefix": PREFIX,
        "publicBase": PUBLIC_BASE,
        "manifest": str(MANIFEST_PATH.relative_to(ROOT)).replace("\\", "/"),
        "manifestSha256": sha256_file(MANIFEST_PATH),
        "fileCount": 27,
        "entries": build_entries(manifest),
        "allVerified": False,
    }

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(preflight, entry): entry for entry in report["entries"]}
        conflicts = []
        for future in as_completed(futures):
            entry = futures[future]
            action, result = future.result()
            entry["preflight"] = {"action": action, **result}
            if action == "matching":
                entry["state"] = "uploaded"
            elif action == "conflict":
                entry["state"] = "conflict"
                conflicts.append(entry["r2Key"])
    save_report(report)
    if conflicts:
        raise RuntimeError("Refusing to overwrite conflicting R2 objects: " + ", ".join(conflicts))

    pending = [entry for entry in report["entries"] if entry["state"] == "pending"]
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(upload, entry): entry for entry in pending}
        failures = []
        for future in as_completed(futures):
            entry = futures[future]
            result = future.result()
            entry["upload"] = result
            if result["returnCode"] == 0:
                entry["state"] = "uploaded"
                print(f"Uploaded {entry['r2Key']}", flush=True)
            else:
                entry["state"] = "failed"
                failures.append(entry["r2Key"])
            save_report(report)
    if failures:
        raise RuntimeError("R2 uploads failed: " + ", ".join(failures))

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(verify, entry): entry for entry in report["entries"]}
        failures = []
        for future in as_completed(futures):
            entry = futures[future]
            result = future.result()
            entry["verification"] = result
            if result["passed"]:
                entry["state"] = "verified"
                print(f"Verified {entry['publicUrl']}", flush=True)
            else:
                entry["state"] = "verification-failed"
                failures.append(entry["r2Key"])
            save_report(report)
    if failures or not report["allVerified"]:
        raise RuntimeError("R2 verification failed: " + ", ".join(failures))
    print(f"Uploaded and verified 27 R2 objects under {PREFIX}")
    print(f"Saved {REPORT_PATH}")


if __name__ == "__main__":
    main()
