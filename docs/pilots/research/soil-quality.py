"""Reproduce the bounded P05 source audit using downloaded, pinned CSV files.

Usage: python3 docs/pilots/research/soil-quality.py /path/to/downloaded/files
Reads only local files; prints JSON; no network or repository writes.
Exact source URLs and licences: docs/coverage/sources.json, receipt reesh-data.
This profile supports a brief, not certification of the underlying measurements.
"""
import collections
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import sys

FILES = {
    "US_DFC_SoilCharacteristics.csv": "6a7d182505f3eafb1854ecccb229aca15ddc8754c8830b9880f73afee49647d4",
    "US_DFC_SoilWaterRetentionCurves.csv": "41308fba78d50d96152f40b85af43f45a9aed4d53e23568db483889c8ed744b1",
}


def inspect(directory):
    tables = {}
    for name, expected in FILES.items():
        raw = (directory / name).read_bytes()
        if hashlib.sha256(raw).hexdigest() != expected:
            raise ValueError(name + ": snapshot hash mismatch; review a new version explicitly")
        tables[name] = list(csv.DictReader(io.StringIO(raw.decode("utf-8"))))
    a, b = (tables[name] for name in FILES)
    sample_counts = collections.Counter(r["Sample_ID"] for r in a)
    measures = {}
    for key in ["MPa_Abs", "Vol_Water", "Bulk_Den_g_m3", "Depth_cm"]:
        missing = sum(r[key] in ("", "NA", "NaN") for r in b)
        numbers = [float(r[key]) for r in b if r[key] not in ("", "NA", "NaN")]
        finite = [x for x in numbers if math.isfinite(x)]
        measures[key] = {
            "missing": missing, "nonfinite": len(numbers) - len(finite),
            "min": min(finite) if finite else None, "max": max(finite) if finite else None,
        }
    return {
        "sourceRecord": "https://zenodo.org/api/records/18273606",
        "inspectedOn": "2026-10-22",
        "scope": "Single-site snapshot; sample-level characteristics and repeated retention measurements. No time-trend or causal claim.",
        "fileSha256": FILES,
        "characteristics_rows": len(a),
        "retention_rows": len(b),
        "unique_characteristics_samples": len(sample_counts),
        "unique_retention_samples": len({r["Sample_ID"] for r in b}),
        "duplicate_characteristics_sample_ids": sorted(k for k, n in sample_counts.items() if n > 1),
        "orphan_sample_ids": sorted({r["Sample_ID"] for r in b} - set(sample_counts)),
        "retention_exact_duplicate_rows": len(b) - len({tuple(r.items()) for r in b}),
        "retention_dates": sorted({r["Sampling_Date"] for r in b}),
        "depths_cm": sorted({float(r["Depth_cm"]) for r in b}),
        "retention_instruments": dict(collections.Counter(r["Hypropfilter"] for r in b)),
        "conductivity_flags": dict(collections.Counter(r["KS_Soil_Flag"] for r in a)),
        "measures": measures,
        "interpretation": {
            "density": "Unresolved unit conflict: documentation says g m^-3 but values are near 1. Exclude density-derived calculations; do not silently substitute g cm^-3.",
            "conductivity": "Flag 1 is documented as suspect/use with caution. Exclude conductivity comparisons from P05; do not transfer this flag automatically to retention.",
            "retention": "Vol_Water is documented as percent. MPa_Abs holds positive magnitudes; make the pressure-sign convention explicit and obtain soil-science review.",
            "sampling": "Rows within a retention curve are repeated measurements, not independent field samples; row-weighted averaging across curves is not justified.",
            "limits": "No calibration, laboratory protocol, representativeness or instrument-error audit performed. No model fit or inferred field-capacity/wilting-point values.",
        },
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 soil-quality.py /directory/containing/the/two/pinned/CSVs")
    print(json.dumps(inspect(Path(sys.argv[1])), indent=2) + "\n", end="")
