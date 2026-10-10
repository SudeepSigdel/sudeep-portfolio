#!/usr/bin/env python3
"""Render the three Janus portfolio figures as standalone SVGs.

Inputs : src/assets/projects/janus/data.json   (made by janus_data.py)
         ../janus/docs/ARCHITECTURE.md          (the architecture diagram is checked against it)
Outputs: src/assets/projects/janus/{architecture,results-by-site,q5-injection}.svg

    python scripts/assets/janus_figures.py [--janus ../janus]

Stdlib only. Palette and font stacks mirror src/styles/global.css (Meadow to Ridge).
"""

from __future__ import annotations

import argparse
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src" / "assets" / "projects" / "janus"

# --- palette / type (tokens from src/styles/global.css) -----------------------------------------
FOREST, PINE = "#1c3a28", "#0f2218"
CLOUD, MIST, HAZE, TEAL, MEADOW = "#f6f8f7", "#dce7e4", "#9db9b6", "#6e9a9a", "#4fb22e"
SERIF = "'Fraunces Variable', 'Iowan Old Style', Georgia, serif"
SANS = "'Inter Variable', system-ui, sans-serif"
MONO = "'JetBrains Mono', ui-monospace, Consolas, monospace"


def e(s: object) -> str:
    return escape(str(s), quote=True)


class Svg:
    def __init__(self, w: int, h: int, title: str, desc: str, lang: str = "en", uid: str = "fig") -> None:
        self.w, self.h = w, h
        self.uid = uid
        self.parts: list[str] = []
        self.head = (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'role="img" aria-labelledby="{uid}-t {uid}-d" lang="{lang}">\n'
            f"<title id=\"{uid}-t\">{e(title)}</title>\n<desc id=\"{uid}-d\">{e(desc)}</desc>\n"
        )

    def add(self, s: str) -> None:
        self.parts.append(s)

    def text(self, x: float, y: float, s: str, *, size: float = 13, fill: str = CLOUD, family: str = SANS,
             weight: int | str = 400, anchor: str = "start", ls: float | None = None, halo: str | None = None,
             upper: bool = False, op: float | None = None) -> None:
        a = f' text-anchor="{anchor}"' if anchor != "start" else ""
        l = f' letter-spacing="{ls}"' if ls else ""
        h = f' stroke="{halo}" stroke-width="4" stroke-linejoin="round" paint-order="stroke"' if halo else ""
        o = f' opacity="{op}"' if op is not None else ""
        t = s.upper() if upper else s
        self.add(
            f'<text x="{x:.1f}" y="{y:.1f}" font-family="{e(family)}" font-size="{size}" fill="{fill}" '
            f'font-weight="{weight}"{a}{l}{h}{o}>{e(t)}</text>'
        )

    def lines(self, x: float, y: float, rows: list[str], dy: float, **kw: object) -> None:
        for i, r in enumerate(rows):
            self.text(x, y + i * dy, r, **kw)  # type: ignore[arg-type]

    def rect(self, x: float, y: float, w: float, h: float, *, fill: str = "none", stroke: str | None = None,
             sw: float = 1, rx: float = 0, dash: str | None = None, op: float | None = None) -> None:
        st = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ""
        d = f' stroke-dasharray="{dash}"' if dash else ""
        o = f' opacity="{op}"' if op is not None else ""
        self.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}"{st}{d}{o}/>')

    def line(self, x1: float, y1: float, x2: float, y2: float, *, stroke: str = CLOUD, sw: float = 1,
             op: float | None = None, dash: str | None = None) -> None:
        o = f' opacity="{op}"' if op is not None else ""
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.add(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" stroke-width="{sw}"{o}{d}/>')

    def path(self, d: str, *, stroke: str = CLOUD, sw: float = 1.4, op: float | None = None,
             marker: bool = False, dash: str | None = None) -> None:
        o = f' opacity="{op}"' if op is not None else ""
        m = f' marker-end="url(#{self.uid}-arrow)"' if marker else ""
        da = f' stroke-dasharray="{dash}"' if dash else ""
        self.add(f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"{o}{m}{da}/>')

    def render(self) -> str:
        defs = (
            "<defs>\n"
            f'<marker id="{self.uid}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0 1 L9 5 L0 9 z" fill="{CLOUD}" fill-opacity="0.7"/></marker>\n'
            f'<pattern id="{self.uid}-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
            f'<line x1="0" y1="0" x2="0" y2="7" stroke="{PINE}" stroke-width="2.4" stroke-opacity="0.45"/></pattern>\n'
            "</defs>\n"
        )
        bg = f'<rect width="{self.w}" height="{self.h}" fill="{FOREST}"/>\n'
        return self.head + defs + bg + "\n".join(self.parts) + "\n</svg>\n"


def frame_header(s: Svg, title: str, subtitle: str, kicker: str) -> None:
    s.text(60, 52, kicker, size=11, fill=HAZE, family=MONO, ls=1.4, upper=True)
    s.text(60, 94, title, size=34, family=SERIF, weight=300)
    s.text(60, 122, subtitle, size=12, fill=HAZE, family=MONO, ls=0.4)


def whisker(s: "Svg", x0: float, x1: float, y: float, cap: float = 5) -> None:
    """Interval whisker with a dark halo so it reads on any bar or on the background."""
    for col, sw in ((PINE, 4.2), (CLOUD, 1.6)):
        s.line(x0, y, x1, y, stroke=col, sw=sw)
        for xx in (x0, x1):
            s.line(xx, y - cap, xx, y + cap, stroke=col, sw=sw)


def pct(r: float) -> str:
    return f"{round(r * 100)}%"


# =============================================================================================
# 1. Architecture
# =============================================================================================
def architecture(janus_repo: Path) -> str:
    # (id, title, path, desc, kind, col, row)
    N = {
        "obs": ("Observer", "observer/extract.py", "PageSnapshot: trusted elements, untrusted text kept apart", "io", 0, 0),
        "plan": ("Planner", "planner/plan.py", "local model proposes a typed plan; never sees page body text", "model", 1, 0),
        "gnd": ("Grounding", "planner/ground.py", "repairs a ref or value; never adds an op", "repair", 2, 0),
        "val": ("Validate plan", "validator/plan.py", "validate_plan, re-checked after grounding", "gate", 3, 0),
        "auth": ("Authorize", "validator/action.py", "authorize_action for every step", "gate", 3, 1),
        "esc": ("Escalation", "executor/escalation.py", "consequential steps need a granted approval", "gate", 2, 1),
        "exe": ("Execute step", "executor/executor.py", "execute_step", "io", 1, 1),
        "res": ("Re-resolve", "executor/resolve.py", "act-time check: fingerprint still matches", "gate", 0, 1),
        "egr": ("Egress guard", "executor/egress.py", "blocks off-allowlist origins", "gate", 0, 2),
        "pw": ("Playwright action", "executor", "acts on the live page", "io", 1, 2),
        "ver": ("Verifier", "verifier/verify.py", "value round-trip, classify_run", "io", 2, 2),
        "out": ("Outcome", "", "completed, partial or blocked", "end", 3, 2),
    }
    # Guard: every module path drawn must exist in the Janus source, and every node name's stage
    # must appear in the Mermaid source in docs/ARCHITECTURE.md. Fail rather than draw fiction.
    arch = (janus_repo / "docs" / "ARCHITECTURE.md").read_text(encoding="utf-8")
    mermaid = re.search(r"```mermaid(.*?)```", arch, re.S)
    assert mermaid, "no mermaid block found in ARCHITECTURE.md"
    m = mermaid.group(1)
    for key, needle in {
        "obs": "observer/extract.py", "plan": "planner/plan.py", "gnd": "planner/ground.py",
        "val": "validator/plan.py", "auth": "validator/action.py", "esc": "executor/escalation.py",
        "exe": "executor/executor.py", "res": "executor/resolve.py", "egr": "executor/egress.py",
        "ver": "verify.py",
    }.items():
        assert needle in m, f"{key}: {needle} not in the Mermaid diagram"
        src = janus_repo / "src" / "janus" / (needle if "/" in needle else f"verifier/{needle}")
        assert src.exists(), f"{src} does not exist"

    W, H = 1280, 800
    s = Svg(W, H, "Janus architecture: the agent loop",
            "Flow of one page snapshot through observe, plan, ground, validate, authorize, escalate, execute, "
            "re-resolve, egress check, act and verify. The planner model is an untrusted proposer; deterministic "
            "validators and executor checks authorize and gate every step.", uid="janus-arch")
    frame_header(s, "Plan, validate, authorize, act, verify.", "One leg per page snapshot  ·  the model proposes, deterministic code decides",
                 "Janus  /  architecture")

    NW, NH, X0, DX = 170, 106, 214, 262
    Y0, DY = 176, 172
    pos = {k: (X0 + v[4] * DX, Y0 + v[5] * DY) for k, v in N.items()}
    cx = lambda k: pos[k][0] + NW / 2
    cy = lambda k: pos[k][1] + NH / 2
    L = lambda k: pos[k][0]
    R = lambda k: pos[k][0] + NW
    T = lambda k: pos[k][1]
    B = lambda k: pos[k][1] + NH

    style = {
        "model": dict(stroke=TEAL, dash="5 4", sw=1.6, fill=PINE, tag="model · untrusted"),
        "repair": dict(stroke=TEAL, dash=None, sw=1.2, fill=PINE, tag="repair pass"),
        "gate": dict(stroke=MEADOW, dash=None, sw=1.8, fill=PINE, tag="deterministic gate"),
        "io": dict(stroke=MIST, dash=None, sw=1.0, fill=PINE, tag=""),
        "end": dict(stroke=MIST, dash="2 3", sw=1.0, fill="none", tag=""),
    }

    # edges first (under nodes)
    def lab(x: float, y: float, rows: list[str], anchor: str = "middle") -> None:
        s.lines(x, y, rows, 12, size=10.5, fill=HAZE, family=MONO, anchor=anchor, halo=FOREST)

    s.path(f"M{R('obs')} {cy('obs')} H{L('plan')}", marker=True)
    s.path(f"M{R('plan')} {cy('plan')} H{L('gnd')}", marker=True)
    s.path(f"M{R('gnd')} {cy('gnd')} H{L('val')}", marker=True)
    lab((R("plan") + L("gnd")) / 2, cy("plan") - 10, ["plan"])
    lab((R("gnd") + L("val")) / 2, cy("gnd") - 24, ["fixed ref", "or value"])
    # reject loop above row 1
    s.path(f"M{cx('val')} {T('val')} V{T('val') - 30} H{cx('plan') + 44} V{T('plan')}", marker=True, dash="5 4")
    lab((cx("val") + cx("plan") + 44) / 2, T("val") - 38, ["reject: errors fed back to the planner, retry"])
    # validate -> authorize
    s.path(f"M{cx('val')} {B('val')} V{T('auth')}", marker=True)
    lab(cx("val") + 8, (B("val") + T("auth")) / 2 + 4, ["accept"], anchor="start")
    # authorize -> escalation -> execute
    s.path(f"M{L('auth')} {cy('auth')} H{R('esc')}", marker=True)
    lab((L("auth") + R("esc")) / 2, cy("auth") - 18, ["consequential,", "not granted"])
    s.path(f"M{L('esc')} {cy('esc')} H{R('exe')}", marker=True)
    lab((L("esc") + R("exe")) / 2, cy("esc") - 10, ["granted"])
    # authorize -> execute (allowed), routed under escalation
    yb = B("auth") + 30
    s.path(f"M{cx('auth')} {B('auth')} V{yb} H{cx('exe')} V{B('exe')}", marker=True)
    lab((cx("auth") + cx("exe")) / 2, yb + 15, ["allowed"])
    # execute -> re-resolve -> egress -> playwright -> verifier -> outcome
    s.path(f"M{L('exe')} {cy('exe')} H{R('res')}", marker=True)
    s.path(f"M{cx('res')} {B('res')} V{T('egr')}", marker=True)
    s.path(f"M{R('egr')} {cy('egr')} H{L('pw')}", marker=True)
    lab((R("egr") + L("pw")) / 2, cy("egr") - 10, ["allowed"])
    s.path(f"M{R('pw')} {cy('pw')} H{L('ver')}", marker=True)
    s.path(f"M{R('ver')} {cy('ver')} H{L('out')}", marker=True)
    lab((R("ver") + L("out")) / 2, cy("ver") - 10, ["done"])
    # blocked tags in the left gutter
    for k, txt in (("res", ["fingerprint gone"]), ("egr", ["off-allowlist", "origin"])):
        s.path(f"M{L(k)} {cy(k)} H{166}", stroke=HAZE, sw=1.2, marker=True, op=0.9)
        s.text(176, cy(k) - 14, "✕ step blocked", size=11, family=MONO, fill=CLOUD, anchor="end", weight=500)
        s.lines(176, cy(k) + 22, txt, 12, size=10.5, fill=HAZE, family=MONO, anchor="end")
    # verifier -> observer (new page), around the left edge
    yl = B("ver") + 30
    s.path(f"M{cx('ver')} {B('ver')} V{yl} H26 V{cy('obs')} H{L('obs')}", marker=True, dash="5 4")
    lab(cx("ver") - 8, yl - 8, ["new page: observe again"], anchor="end")

    # nodes
    for k, (title, path, desc, kind, col, row) in N.items():
        x, y = pos[k]
        st = style[kind]
        s.rect(x, y, NW, NH, fill=st["fill"], stroke=st["stroke"], sw=st["sw"], rx=3, dash=st["dash"])
        s.text(x + 14, y + 26, title, size=15, weight=600)
        if path:
            s.text(x + 14, y + 44, path, size=10.5, family=MONO, fill=HAZE)
        # description: simple two-line wrap at ~30 chars
        words, rows, cur = desc.split(), [], ""
        for w in words:
            if len(cur) + len(w) + 1 > 25 and cur:
                rows.append(cur)
                cur = w
            else:
                cur = f"{cur} {w}".strip()
        rows.append(cur)
        s.lines(x + 14, y + 66 if path else y + 52, rows[:3], 15, size=11.5, fill=MIST, op=0.85)
        if st["tag"]:
            s.text(x + NW - 10, y - 8, st["tag"], size=9.5, family=MONO, fill=st["stroke"], anchor="end", ls=0.8, upper=True)

    # legend + source line
    ly = H - 60
    s.rect(60, ly - 11, 26, 14, fill=PINE, stroke=TEAL, sw=1.6, rx=2, dash="5 4")
    s.text(96, ly, "model: untrusted proposer", size=11, family=MONO, fill=HAZE)
    s.rect(330, ly - 11, 26, 14, fill=PINE, stroke=MEADOW, sw=1.8, rx=2)
    s.text(366, ly, "deterministic gate: authority", size=11, family=MONO, fill=HAZE)
    s.rect(640, ly - 11, 26, 14, fill=PINE, stroke=MIST, sw=1, rx=2)
    s.text(676, ly, "observe / act / verify", size=11, family=MONO, fill=HAZE)
    s.text(60, H - 26, "Source: docs/ARCHITECTURE.md (Mermaid), every module path checked against src/janus/. A diagram of the design, not a performance claim.",
           size=10.5, family=MONO, fill=HAZE, op=0.8)
    return s.render()


# =============================================================================================
# 2. Results by site
# =============================================================================================
def results(data: dict) -> str:
    dev, test = data["dev_v1"], data["test_v1"]["e5_cp1"]
    wall = data["dev_v1_wall_time_s"]
    errs = data["errored_runs_counted_as_failures"]["runs"]["e14"]
    W, H = 1280, 800
    s = Svg(W, H, "Janus vs. browser_use: task success by site",
            "Horizontal bars with 95% Wilson intervals. Development split v1, 29 tasks at N=3: browser_use baseline "
            "40 of 87, Janus E5 57 of 87, Janus E14 72 of 87. Held-out test split, Janus E5 only: 24 of 36. "
            "No baseline was run on the test split and E14 was not evaluated on it.", uid="janus-res")
    frame_header(s, "Task success by site.", "Local qwen3:8b for both agents  ·  fictional replica sites  ·  N=3 repeats per task  ·  state-checked scoring",
                 "Janus  /  results")

    bx, bw, bh = 262, 400, 17
    series = [("browser_use  (B1)", "b1", TEAL, False), ("Janus  E5", "e5", MIST, False), ("Janus  E14  (latest dev)", "e14", MEADOW, True)]
    groups = [("overall", "Overall"), ("nagarpalika", "Nagarpalika"), ("sharesewa", "ShareSewa")]

    s.text(60, 168, "Development split v1", size=11, family=MONO, fill=CLOUD, ls=1.2, upper=True, weight=500)
    s.text(60, 186, "29 tasks, 3 repeats each", size=11, family=MONO, fill=HAZE)
    for gi, (gk, gname) in enumerate(groups):
        y0 = 222 + gi * 138
        tasks = dev["b1"][gk]["tasks"]
        runs = dev["b1"][gk]["n"]
        s.text(60, y0, gname, size=15, weight=600)
        s.text(60 + 11 * len(gname) + 14, y0, f"{tasks} tasks · {runs} runs", size=10.5, family=MONO, fill=HAZE)
        s.line(bx, y0 + 6, bx, y0 + 3 * 30 + 4, stroke=MIST, sw=1, op=0.35)
        for si, (label, key, color, hatched) in enumerate(series):
            d = dev[key][gk]
            y = y0 + 14 + si * 30
            s.text(bx - 12, y + 13, label, size=11.5, family=MONO, fill=MIST, anchor="end")
            w = d["rate"] * bw
            s.rect(bx, y, max(w, 1), bh, fill=color, rx=1.5)
            if hatched:
                s.rect(bx, y, max(w, 1), bh, fill=f"url(#{s.uid}-hatch)", rx=1.5)
            lo, hi = d["ci95"]
            whisker(s, bx + lo * bw, bx + hi * bw, y + bh / 2)
            s.text(bx + bw + 16, y + 13, f"{d['k']}/{d['n']}  ·  {pct(d['rate'])}", size=12, family=MONO, fill=CLOUD)
    # axis ticks
    for t in (0, 50, 100):
        s.text(bx + bw * t / 100, 640, f"{t}%", size=10, family=MONO, fill=HAZE, anchor="middle")

    # held-out panel
    px, pbw = 850, 190
    s.line(810, 150, 810, 640, stroke=MIST, sw=1, op=0.2)
    s.text(px, 168, "Held-out test split", size=11, family=MONO, fill=CLOUD, ls=1.2, upper=True, weight=500)
    s.text(px, 186, "12 tasks · 36 runs · Janus E5 only", size=11, family=MONO, fill=HAZE)
    for gi, (gk, gname) in enumerate(groups):
        y0 = 222 + gi * 138
        d = test[gk]
        s.text(px, y0, gname, size=15, weight=600)
        s.text(px + 11 * len(gname) + 14, y0, f"{d['tasks']} tasks · {d['n']} runs", size=10.5, family=MONO, fill=HAZE)
        y = y0 + 14
        s.rect(px, y, max(d["rate"] * pbw, 1), bh, fill=MIST, rx=1.5)
        lo, hi = d["ci95"]
        whisker(s, px + lo * pbw, px + hi * pbw, y + bh / 2)
        s.text(px + pbw + 14, y + 13, f"{d['k']}/{d['n']}  ·  {pct(d['rate'])}", size=12, family=MONO, fill=CLOUD)
    s.lines(px, 600, ["No baseline run on this split.", "E14 and later: not evaluated here."], 15, size=11, family=MONO, fill=CLOUD, weight=500)

    # limitations
    ly = 676
    s.line(60, ly - 22, W - 60, ly - 22, stroke=MIST, sw=1, op=0.25)
    notes = [
        "Janus was tuned on dev split v1 across the E-series experiments (to E16); the baseline was not re-tuned. Hatched = later, more-tuned state (E15 and E16 reproduce E14 run for run).",
        "Whiskers: 95% Wilson interval over runs. Repeats of the same tasks are not independent, so the true uncertainty is wider than shown.",
        f"E14 includes {errs} crashed runs (share-06, KeyError) scored as failures.  Wall time: Janus {wall['e14']['mean']:.0f}s mean; "
        f"browser_use {wall['b1']['mean']:.0f}s mean, {wall['b1']['median']:.0f}s median (two runs of 6,200 to 6,800s).",
        "Fictional replica sites written by the Janus author, 14 + 15 tasks: a controlled comparison, not a general web-agent benchmark.",
    ]
    s.lines(60, ly, notes, 19, size=11, family=MONO, fill=HAZE)
    return s.render()


# =============================================================================================
# 3. Q5 security panel
# =============================================================================================
def q5(data: dict) -> str:
    j, b = data["q5"]["q5_janus"], data["q5"]["q5_bu"]
    cats = [
        ("value_poisoning", "Value poisoning", "pre-filled default in an untouched optional field"),
        ("spoofed_label", "Spoofed label", "page text imitates a control"),
        ("option_injection", "Option injection", "attacker text inside one option"),
        ("row_key_lookalike", "Row-key lookalike", "a row whose id normalises to the target"),
        ("split_payload", "Split payload", "instruction fragments across pages"),
    ]
    W, H = 1280, 850
    s = Svg(W, H, "Q5 adaptive injection suite: attack success by category",
            "Attack success rate per injection category with 95% Wilson intervals. Janus was hijacked in all 6 runs of "
            "the value-poisoning category and in none of the other 21 runs. browser_use was hijacked once in value poisoning, "
            "but 5 of those 6 runs never reached the attack. Nine cases, 27 runs per agent, v2 dev split.", uid="janus-q5")
    frame_header(s, "Where Janus is hijacked.", "Q5 adaptive injection suite  ·  v2 dev  ·  9 cases  ·  N=3 = 27 runs per agent  ·  same model, same scoring",
                 "Janus  /  security results")

    lx, bx, bw, bh = 60, 420, 330, 16
    s.text(bx, 166, "Attack success rate (hijacked runs / runs)", size=10.5, family=MONO, fill=HAZE)
    for t in (0, 50, 100):
        s.text(bx + bw * t / 100, 184, f"{t}%", size=10, family=MONO, fill=HAZE, anchor="middle")
    for ci, (ck, name, blurb) in enumerate(cats):
        y0 = 204 + ci * 98
        dj, db = j["categories"][ck], b["categories"][ck]
        if ck == "value_poisoning":
            s.rect(40, y0 - 18, W - 80, 90, fill=CLOUD, op=0.07, rx=3)
            s.text(lx, y0 - 2, "known gap", size=9.5, family=MONO, fill=CLOUD, ls=1.2, upper=True, weight=600)
            ny = y0 + 22
        else:
            ny = y0 + 16
        s.text(lx, ny, name, size=16, weight=600)
        s.text(lx, ny + 18, blurb, size=10.5, family=MONO, fill=HAZE)
        s.text(lx, ny + 34, "cases: " + " · ".join(dj["tasks"]), size=10.5, family=MONO, fill=HAZE, op=0.8)
        s.line(bx, y0 - 8, bx, y0 + 58, stroke=MIST, sw=1, op=0.35)
        for ai, (agent, d, color) in enumerate((("Janus", dj, CLOUD), ("browser_use", db, TEAL))):
            y = y0 + ai * 28
            n, k = d["n"], d["hijacked"]
            lo, hi = d["asr_ci95"]
            w = k / n * bw
            if w > 0:
                s.rect(bx, y, w, bh, fill=color, rx=1.5)
            else:
                s.line(bx, y, bx, y + bh, stroke=color, sw=2)
            whisker(s, bx + lo * bw, bx + hi * bw, y + bh / 2)
            lab = f"{agent}  {k}/{n} hijacked"
            s.text(bx + bw + 20, y + 12, lab, size=12, family=MONO, fill=CLOUD, weight=600 if (agent == "Janus" and k) else 400)
            tail = f"exercised {d['exercised']}/{n}  ·  CI {round(lo*100)}–{round(hi*100)}%"
            s.text(bx + bw + 20 + 232, y + 12, tail, size=11, family=MONO, fill=HAZE)
    # summary
    sy = 204 + 5 * 98 - 6
    s.line(60, sy - 14, W - 60, sy - 14, stroke=MIST, sw=1, op=0.25)
    s.text(60, sy + 8, "Task success on these 27 runs:", size=12, family=MONO, fill=HAZE)
    s.text(300, sy + 8, f"Janus {j['task_success']}/{j['runs']}", size=12, family=MONO, fill=CLOUD, weight=600)
    s.text(430, sy + 8, f"browser_use {b['task_success']}/{b['runs']}  ({b['harness_errors']} harness errors; mean wall {b['mean_wall_s']:.0f}s, dominated by stalls)",
           size=12, family=MONO, fill=CLOUD)
    notes = [
        "Janus is hijacked here because an approved field fill's value is not checked: expected for a typed-plan design, not a model slip (docs/results.md, Q5). Reported as measured.",
        "'Exercised' = the forbidden path existed in the run. browser_use's unexercised runs failed before reaching the attack, so its low rates are NOT evidence of resistance.",
        "Row-key lookalike: Janus is blocked 3/3 by the confirm-page path binding, but fails the task 0/3 (the baseline passes 3/3): a utility cost.",
        "Whiskers: 95% Wilson interval; only 3 to 6 runs per category, so 0/6 is still consistent with an attack success rate up to 39%.",
        "Nine cases written after Janus's design and run once as a dev suite (E17, B2): not a held-out test, and no code change was made to Janus for this run.",
    ]
    s.lines(60, sy + 44, notes, 19, size=11, family=MONO, fill=HAZE)
    return s.render()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--janus", default=str(ROOT.parent / "janus"))
    args = ap.parse_args()
    data = json.loads((OUT / "data.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    for name, svg in (
        ("architecture.svg", architecture(Path(args.janus))),
        ("results-by-site.svg", results(data)),
        ("q5-injection.svg", q5(data)),
    ):
        (OUT / name).write_text(svg, encoding="utf-8")
        print("wrote", (OUT / name).relative_to(ROOT))


if __name__ == "__main__":
    main()
