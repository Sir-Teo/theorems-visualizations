"""Audit original preparation fixtures; never decide legal entitlement or clinical status."""
from datetime import date, timedelta
from fractions import Fraction
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read(name):
    return json.loads((ROOT / name).read_text())


def counting(trace, window):
    lo, hi = window
    if not all(type(v) is int for v in window) or hi <= lo:
        return {"error": "invalid-window"}
    if lo < trace[0][0] or hi > trace[-1][2]:
        return {"error": "outside-trace"}
    complete = [i for i, (a, _, b) in enumerate(trace, 1) if a >= lo and b <= hi]
    intersecting = [i for i, (a, _, b) in enumerate(trace, 1) if a < hi and b > lo]
    onset = [i for i, (a, _, _) in enumerate(trace, 1) if lo <= a < hi]
    return {
        "completeIds": complete,
        "partialIds": [i for i in intersecting if i not in complete],
        "onsetIds": onset,
        "expectedCompleteRate": str(Fraction(60000 * len(complete), hi - lo)),
        "expectedOnsetRate": str(Fraction(60000 * len(onset), hi - lo)),
    }


def audit():
    sources, law, health = map(read, ["sources.json", "law-cases.json", "health-traces.json"])
    source_ids = [s["id"] for s in sources["sources"]]
    require(len(set(source_ids)) == len(source_ids), "Duplicate source IDs")
    require(sources["professionalApprovals"] == [], "This packet does not validate professional approvals")
    for record in [law, health]:
        require(record["status"] == "review-input-only" and record["runtimeId"] is None,
                "Preparation fixture promoted into a runtime lesson")
        require(record["qualifiedReviewer"] is None and record["authoredLesson"] is False
                and record["acceptedLesson"] is False, "Unobserved review/lesson status changed")
    require(law["legalEffectiveDate"] is None, "No certified legal-effective snapshot is supplied")
    require(health["patientData"] is False and health["units"] == "milliseconds", "Unsupported trace scope")
    require(len({b["id"] for b in law["branches"]}) == len(law["branches"]), "Duplicate branch IDs")
    for b in law["branches"]:
        require(b["professionalDecision"] is None and set(b["authority"]) <= set(source_ids), b["id"])
        require(all(b[k].strip() for k in ["facts", "reviewQuestion", "proposedFeedback"]), b["id"])

    dates = []
    for f in law["calendarFixtures"]:
        if f["kind"] == "short-term-calendar":
            condition = date.fromisoformat(f["conditionsComplete"])
            first, last = condition + timedelta(days=1), condition + timedelta(days=30)
            observed = date.fromisoformat(f["observation"])
            position = ("before-counting-start-not-a-rejection-bar" if observed < first else
                        "within-window" if observed < last else
                        "last-day" if observed == last else "after-window")
            require(first.isoformat() == f["expectedDay1"] and last.isoformat() == f["expectedLastDay"]
                    and position == f["expectedPosition"], "Calendar mismatch " + f["id"])
            require((last - first).days + 1 == 30, "Inclusive-day count")
        elif f["kind"] == "refund-calendar":
            first = date.fromisoformat(f["agreement"])
            last = first + timedelta(days=13)
            require(last.isoformat() == f["expectedLastDay"] and (last-first).days+1 == 14,
                    "Separate refund calendar mismatch " + f["id"])
        else:
            raise ValueError("Unknown calendar kind")
        dates.append({"id": f["id"], "lastDay": last.isoformat()})
    require(len({f["id"] for f in law["calendarFixtures"]}) == len(dates), "Duplicate date IDs")

    traces = {t["id"]: t["cycles"] for t in health["traces"]}
    require(len(traces) == len(health["traces"]), "Duplicate trace IDs")
    for name, cycles in traces.items():
        require(cycles and all(len(c) == 3 and all(type(v) is int for v in c) and
                              0 <= c[0] < c[1] < c[2] for c in cycles), "Invalid phases " + name)
        require(all(a[2] == b[0] for a, b in zip(cycles, cycles[1:])), "Unlabelled gap/overlap " + name)
    counts = []
    for f in health["fixtures"]:
        result = counting(traces[f["trace"]], f["windowMs"])
        expected = ({"error": f["expectedError"]} if "expectedError" in f else
                    {k: f[k] for k in ["completeIds", "partialIds", "onsetIds", "expectedCompleteRate", "expectedOnsetRate"]})
        require(result == expected, "Counting mismatch " + f["id"])
        counts.append({"id": f["id"], **result})
    require(len({f["id"] for f in health["fixtures"]}) == len(counts), "Duplicate counting fixture IDs")
    a, b = traces["H-REGULAR"], traces["H-VARIED"]
    require(len(a) == len(b) and a[0][0] == b[0][0] and a[-1][2] == b[-1][2], "Full-window comparison")
    require([e-s for s, _, e in a] != [e-s for s, _, e in b], "Different rhythm is not demonstrated")
    return {"result": "PASS", "scope": "Preparation arithmetic and metadata only; no legal/clinical or lesson approval",
            "sourceReceipts": len(source_ids), "openLegalBranches": len(law["branches"]),
            "calendarFixtures": dates, "countingFixtures": counts,
            "inputs": {name: hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
                       for name in ["sources.json", "law-cases.json", "health-traces.json", "audit.py"]}}


if __name__ == "__main__":
    print(json.dumps(audit(), indent=2))
