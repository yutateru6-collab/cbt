"""Upload an immutable WAV directory to R2, then verify every object.

This script does not edit application URLs or deploy the Worker. A failed upload or
verification therefore leaves the production app on its previous release.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import subprocess
import urllib.request
from pathlib import Path


PUBLIC_ORIGIN = "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev"
BUCKET = "mimilisten-audio"


def digest_bytes(data):
    return hashlib.sha256(data).hexdigest()


def digest_file(path):
    h = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def request(url, *, method="GET", headers=None):
    return urllib.request.urlopen(urllib.request.Request(url, method=method, headers=headers or {}), timeout=60)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("--release", required=True)
    parser.add_argument("--expected-count", type=int, required=True)
    parser.add_argument("--skip-upload", action="store_true")
    args = parser.parse_args()
    files = sorted(args.directory.rglob("*.wav"))
    # Review clips are QA artifacts, not production objects.
    files = [path for path in files if "review-clips" not in path.parts]
    if len(files) != args.expected_count:
        raise SystemExit(f"Expected {args.expected_count} WAV files, got {len(files)}")
    local = []
    for path in files:
        relative = path.relative_to(args.directory).as_posix()
        local.append({"path": path, "relative": relative, "size": path.stat().st_size, "sha256": digest_file(path)})
    if not args.skip_upload:
        for item in local:
            object_key = f"scbt/grade2/releases/{args.release}/{item['relative']}"
            subprocess.run(
                ["npx", "wrangler", "r2", "object", "put", f"{BUCKET}/{object_key}", "--file", str(item["path"]), "--content-type", "audio/wav", "--remote"],
                check=True,
            )
    verified = []
    for item in local:
        url = f"{PUBLIC_ORIGIN}/scbt/grade2/releases/{args.release}/{item['relative']}"
        with request(url, method="HEAD") as response:
            if response.status != 200:
                raise RuntimeError(f"HEAD failed for {url}: {response.status}")
            content_type = response.headers.get_content_type()
            size = int(response.headers.get("Content-Length", "-1"))
            if content_type not in {"audio/wav", "audio/x-wav", "audio/wave"} or size != item["size"]:
                raise RuntimeError(f"Metadata mismatch for {url}: {content_type}, {size}")
        with request(url, headers={"Range": "bytes=0-31"}) as response:
            if response.status != 206 or len(response.read()) != min(32, item["size"]):
                raise RuntimeError(f"Range verification failed for {url}")
        with request(url) as response:
            body = response.read()
            if response.status != 200 or digest_bytes(body) != item["sha256"]:
                raise RuntimeError(f"SHA-256 verification failed for {url}")
        verified.append({"url": url, "bytes": item["size"], "sha256": item["sha256"], "mime": mimetypes.guess_type(item["relative"])[0]})
    report = args.directory / "r2-verification.json"
    report.write_text(json.dumps({"release": args.release, "count": len(verified), "items": verified}, indent=2) + "\n", encoding="utf-8")
    print(f"Uploaded and verified {len(verified)} immutable R2 objects. Application URLs were not changed.")


if __name__ == "__main__":
    main()
