import hashlib
import json
from pathlib import Path

import package_grade2_round1_to_3_part2_gemini_mobile as mobile


REPORT_PATH = mobile.OUTPUT_DIR / "generation-and-publish-report.json"
INDEX_PATH = mobile.OUTPUT_DIR / "index.html"
EXPECTED_OUTLIERS = {"set-03-No27", "set-03-No30"}


def main():
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    outliers = [
        item for item in report["items"] if item.get("reviewVolumeOutlier")
    ]
    if {item["id"] for item in outliers} != EXPECTED_OUTLIERS:
        raise RuntimeError(
            f"Unexpected volume outliers: {[item['id'] for item in outliers]}"
        )

    index_html = INDEX_PATH.read_text(encoding="utf-8")
    adjustments = []
    for item in outliers:
        source_path = mobile.OUTPUT_DIR / item["file"]
        balanced_name = f"No{item['number']:02d}-volume-balanced.wav"
        output_path = source_path.with_name(balanced_name)
        if output_path.exists():
            raise RuntimeError(f"Refusing to overwrite: {output_path}")

        gain_db = round(-float(item["differenceFromReferenceDb"]), 2)
        mobile.write_with_gain(source_path, output_path, gain_db)
        measurement = mobile.inspect_wav(output_path)
        if measurement["peakDbfs"] is not None and measurement["peakDbfs"] > -1.0:
            raise RuntimeError(
                f"Balanced peak is too high for {item['id']}: "
                f"{measurement['peakDbfs']} dBFS"
            )
        balanced_sha = hashlib.sha256(output_path.read_bytes()).hexdigest()
        original_url = (
            f"audio/{item['setKey']}/No{item['number']:02d}.wav"
            f"?v={item['sha256'][:12]}"
        )
        balanced_url = (
            f"audio/{item['setKey']}/{balanced_name}"
            f"?v={balanced_sha[:12]}"
        )
        if original_url not in index_html:
            raise RuntimeError(f"Audio URL not found in index: {original_url}")
        index_html = index_html.replace(original_url, balanced_url, 1)

        item["deliveryFile"] = str(
            output_path.relative_to(mobile.OUTPUT_DIR)
        ).replace("\\", "/")
        item["deliverySha256"] = balanced_sha
        item["deliveryBytes"] = output_path.stat().st_size
        item["deliveryAdditionalGainDb"] = gain_db
        item["deliveryActiveRmsDbfs"] = measurement["activeRmsDbfs"]
        item["deliveryPeakDbfs"] = measurement["peakDbfs"]
        item["deliveryDifferenceFromReferenceDb"] = round(
            measurement["activeRmsDbfs"]
            - item["referenceMedianActiveRmsDbfs"],
            2,
        )
        adjustments.append(
            {
                "id": item["id"],
                "sourceFile": item["file"],
                "deliveryFile": item["deliveryFile"],
                "additionalGainDb": gain_db,
                "beforeActiveRmsDbfs": item["activeRmsDbfs"],
                "afterActiveRmsDbfs": measurement["activeRmsDbfs"],
                "referenceActiveRmsDbfs": item[
                    "referenceMedianActiveRmsDbfs"
                ],
                "afterPeakDbfs": measurement["peakDbfs"],
                "speedChanged": False,
                "eqApplied": False,
                "compressionApplied": False,
            }
        )

    report["deliveryVolumeBalancing"] = {
        "method": "whole-file linear gain only",
        "originalFilesPreserved": True,
        "adjustedFileCount": len(adjustments),
        "items": adjustments,
    }
    report["deliveryVolumeOutlierCount"] = sum(
        abs(
            float(
                item.get(
                    "deliveryDifferenceFromReferenceDb",
                    item["differenceFromReferenceDb"],
                )
            )
        )
        > 3.0
        for item in report["items"]
    )
    REPORT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    INDEX_PATH.write_text(index_html, encoding="utf-8")
    print(f"Created {len(adjustments)} balanced delivery WAV files")
    print(f"Remaining delivery volume outliers: {report['deliveryVolumeOutlierCount']}")
    for adjustment in adjustments:
        print(
            f"{adjustment['id']}: {adjustment['additionalGainDb']:+.2f} dB, "
            f"active RMS {adjustment['afterActiveRmsDbfs']:.2f} dBFS"
        )


if __name__ == "__main__":
    main()
