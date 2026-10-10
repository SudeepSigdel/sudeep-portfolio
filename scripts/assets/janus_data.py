#!/usr/bin/env python3
"""Compute the numbers behind the Janus portfolio figures from the raw run records.

Reads results/*.jsonl and tasks/**/*.yaml from the Janus repository (read-only), writes
src/assets/projects/janus/data.json. Stdlib only.

    python scripts/assets/janus_data.py [--janus ../janus]

Nothing here is typed in by hand: every count comes from a run record, and the script fails loudly
if records that the docs call "identical" are not.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src" / "assets" / "projects" / "janus" / "data.json"


def load(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def wilson(k: int, n: int, z: float = 1.959964) -> tuple[float, float]:
    """95% Wilson score interval for k successes in n runs."""
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, c - h), min(1.0, c + h))


def site_of(task: str) -> str:
    return "nagarpalika" if task.startswith("nag") else "sharesewa"


def success_by_site(records: list[dict]) -> dict:
    out: dict[str, dict] = {}
    groups = {"overall": records}
    for s in ("nagarpalika", "sharesewa"):
        groups[s] = [r for r in records if site_of(r["task"]) == s]
    for name, rs in groups.items():
        k = sum(bool(r["success"]) for r in rs)
        n = len(rs)
        lo, hi = wilson(k, n)
        out[name] = {
            "k": k,
            "n": n,
            "tasks": len({r["task"] for r in rs}),
            "rate": k / n,
            "ci95": [lo, hi],
        }
    return out


def outcomes(records: list[dict]) -> dict[tuple[str, int], bool]:
    return {(r["task"], r["repeat"]): bool(r["success"]) for r in records}


def mean(xs: list[float]) -> float:
    return sum(xs) / len(xs)


def median(xs: list[float]) -> float:
    s = sorted(xs)
    m = len(s) // 2
    return s[m] if len(s) % 2 else (s[m - 1] + s[m]) / 2


def injection_categories(tasks_dir: Path) -> dict[str, str]:
    """task id -> injection.category, from the task YAML (regex; no YAML dependency)."""
    cats: dict[str, str] = {}
    for f in tasks_dir.rglob("*.yaml"):
        text = f.read_text(encoding="utf-8")
        tid = re.search(r"^id:\s*(\S+)", text, re.M)
        cat = re.search(r"^injection:\s*\n(?:[ \t]+.*\n)*?[ \t]+category:\s*(\S+)", text, re.M)
        if tid and cat:
            cats[tid.group(1)] = cat.group(1)
    return cats


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--janus", default=str(ROOT.parent / "janus"))
    args = ap.parse_args()
    repo = Path(args.janus)
    res = repo / "results"

    files = {
        "b1": res / "b1-dev.jsonl",
        "e5": res / "e5-dev.jsonl",
        "e14": res / "e14-dev.jsonl",
        "e15": res / "e15-dev.jsonl",
        "e16": res / "e16-dev.jsonl",
        "cp1": res / "cp1-test.jsonl",
        "cp2": res / "cp2-test.jsonl",
        "cp3": res / "cp3-test.jsonl",
        "q5_janus": res / "q5-janus-dev.jsonl",
        "q5_bu": res / "q5-browser_use-dev.jsonl",
    }
    rec = {k: load(p) for k, p in files.items()}

    # --- integrity checks the docs rely on -------------------------------------------------
    o = {k: outcomes(v) for k, v in rec.items() if k in ("e14", "e15", "e16", "cp1", "cp2", "cp3")}
    assert o["e14"] == o["e15"] == o["e16"], "E14/E15/E16 outcomes are not run-for-run identical"
    assert o["cp1"] == o["cp2"] == o["cp3"], "CP1/CP2/CP3 outcomes are not run-for-run identical"
    assert outcomes(rec["b1"]).keys() == outcomes(rec["e5"]).keys() == outcomes(rec["e14"]).keys(), (
        "baseline and Janus dev runs cover different (task, repeat) sets"
    )
    # Errored runs are kept (scored as failures); count them so the figures can disclose them.
    errored = {
        k: sorted({(r["task"], str(r["error"])[:60]) for r in rec[k] if r.get("error")}) for k in ("b1", "e5", "e14")
    }
    errored_runs = {k: sum(bool(r.get("error")) for r in rec[k]) for k in ("b1", "e5", "e14")}

    dev = {
        "b1": success_by_site(rec["b1"]),
        "e5": success_by_site(rec["e5"]),
        "e14": success_by_site(rec["e14"]),
    }
    wall = {
        k: {"mean": mean([r["wall_time"] for r in rec[k]]), "median": median([r["wall_time"] for r in rec[k]])}
        for k in ("b1", "e5", "e14")
    }
    test = {"e5_cp1": success_by_site(rec["cp1"])}

    # --- Q5 ---------------------------------------------------------------------------------
    cats = injection_categories(repo / "tasks")
    q5: dict[str, dict] = {}
    for agent in ("q5_janus", "q5_bu"):
        by_cat: dict[str, Counter] = defaultdict(Counter)
        for r in rec[agent]:
            c = cats[r["task"]]
            by_cat[c]["n"] += 1
            by_cat[c][r["injection_outcome"]] += 1
            by_cat[c]["success"] += bool(r["success"])
        rows = {}
        for c, cnt in by_cat.items():
            n, hij = cnt["n"], cnt["hijacked"]
            lo, hi = wilson(hij, n)
            rows[c] = {
                "n": n,
                "hijacked": hij,
                "resisted": cnt["resisted"],
                "unexercised": cnt["unexercised"],
                "exercised": n - cnt["unexercised"],
                "asr_ci95": [lo, hi],
                "task_success": cnt["success"],
                "tasks": sorted({r["task"] for r in rec[agent] if cats[r["task"]] == c}),
            }
        q5[agent] = {
            "categories": rows,
            "runs": len(rec[agent]),
            "task_success": sum(bool(r["success"]) for r in rec[agent]),
            "harness_errors": sum(bool(r.get("error")) for r in rec[agent]),
            "hijacked": sum(r["injection_outcome"] == "hijacked" for r in rec[agent]),
            "mean_wall_s": mean([r["wall_time"] for r in rec[agent]]),
        }

    data = {
        "generated_from": "janus repository results/ (read-only); see scripts/assets/janus_data.py",
        "provenance": {k: {"file": f"results/{p.name}", "runs": len(rec[k]), "sha256_16": sha(p)} for k, p in files.items()},
        "dev_v1": dev,
        "dev_v1_wall_time_s": wall,
        "errored_runs_counted_as_failures": {"runs": errored_runs, "distinct": errored},
        "identical_outcomes_verified": {"e14_e15_e16": True, "cp1_cp2_cp3": True},
        "test_v1": test,
        "q5": q5,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT))
    for k in ("b1", "e5", "e14"):
        d = dev[k]
        print(k, {s: f"{d[s]['k']}/{d[s]['n']}" for s in d})
    print("test cp1", {s: f"{test['e5_cp1'][s]['k']}/{test['e5_cp1'][s]['n']}" for s in test["e5_cp1"]})
    for a in q5:
        print(a, {c: f"{v['hijacked']}/{v['n']} (exercised {v['exercised']})" for c, v in q5[a]["categories"].items()},
              "success", q5[a]["task_success"], "errors", q5[a]["harness_errors"])


if __name__ == "__main__":
    main()
