#!/usr/bin/env python3
"""Render the AegisWeb architecture diagram (src/assets/projects/aegisweb/architecture.svg).

Every module path drawn is checked against the AegisWeb source tree; the script fails rather than
draw a component that does not exist. Reuses the SVG kit and palette from janus_figures.py.

    python scripts/assets/aegisweb_figures.py [--repo ../Alpha-Intellects]
"""

from __future__ import annotations

import argparse
from pathlib import Path

from janus_figures import CLOUD, FOREST, HAZE, MEADOW, MIST, MONO, PINE, TEAL, Svg, frame_header

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src" / "assets" / "projects" / "aegisweb"

# Modules the diagram names, relative to the repo's src/. Checked below.
MODULES = [
    "sidepanel/task-routing.ts", "sidepanel/agent-preflight.ts", "content/page-content-parser.ts",
    "content/hybrid-content-retriever.ts", "content/lexical-content-retriever.ts",
    "content/embedding-content-retriever.ts", "content/content-evidence-selector.ts",
    "model/ContentUnderstandingService.ts", "content/content-highlighter.ts", "content/dom-parser.ts",
    "slm/inference.ts", "security/action-validator.ts", "slm/execution.ts", "security/capability-gate.ts",
    "sidepanel/ExtensionController.ts", "model/WebLLMModel.ts", "model/model-catalog.ts",
    "model/local-embedding-provider.ts", "background/service-worker.ts", "offscreen/inference.worker.ts",
]


def wrap(text: str, n: int) -> list[str]:
    rows, cur = [], ""
    for w in text.split():
        if len(cur) + len(w) + 1 > n and cur:
            rows.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    rows.append(cur)
    return rows


def verify(repo: Path) -> None:
    missing = [m for m in MODULES if not (repo / "src" / m).exists()]
    assert not missing, f"modules not found in the AegisWeb source: {missing}"
    catalog = (repo / "src" / "model" / "model-catalog.ts").read_text(encoding="utf-8")
    consts = (repo / "src" / "shared" / "constants.ts").read_text(encoding="utf-8")
    assert "Qwen3-4B-q4f16_1-MLC" in consts and "PERSON1_MODEL_ID" in catalog, "default model changed"
    emb = (repo / "src" / "model" / "local-embedding-provider.ts").read_text(encoding="utf-8")
    assert "all-MiniLM-L6-v2" in emb, "embedding model changed"
    # authorizeAction must still be called only from the single-action execution path; if that
    # changes, the 'mail composer is not gated' note below is stale and must be re-checked.
    callers = [
        str(p.relative_to(repo / "src")).replace("\\", "/")
        for p in (repo / "src").rglob("*.ts*")
        if "authorizeAction(" in p.read_text(encoding="utf-8") and p.name != "capability-gate.ts"
    ]
    assert callers == ["slm/execution.ts"], f"authorizeAction callers changed: {callers}"
    ui = (repo / "src" / "sidepanel" / "useAgentActions.ts").read_text(encoding="utf-8")
    assert "controller.composeEmail(" in ui, "composeEmail path changed"


def build(repo: Path) -> str:
    verify(repo)
    W, H = 1280, 1000
    s = Svg(W, H, "AegisWeb architecture: page understanding is separate from browser-action authority",
            "A task router sends a request to a page-understanding pipeline, a browser-action pipeline, or both. "
            "Understanding retrieves evidence and may only highlight validated content blocks. Actions are proposed by a local "
            "model, strictly validated, re-checked against a fresh page snapshot, authorized by a deterministic capability gate "
            "and then executed. A trust boundary keeps content block IDs from becoming action targets. Mail-composer pages use "
            "a separate adapter that does not pass through the authorization gate.", uid="aegis-arch")
    frame_header(s, "Understanding has no authority.",
                 "Page understanding and browser actions are separate pipelines  ·  only the action pipeline touches the page, and only through the gate",
                 "AegisWeb  /  architecture")

    NW, NH, DX = 152, 126, 172
    X0 = 232
    xs = [X0 + i * DX for i in range(6)]

    def split_path(path: str) -> list[str]:
        if len(path) <= 22 or "/" not in path:
            return [path]
        d, f = path.rsplit("/", 1)
        return [d + "/", f]

    def node(x: float, y: float, title: str, path: str, desc: str, kind: str) -> None:
        col, dash, sw = {"model": (TEAL, "5 4", 1.6), "gate": (MEADOW, None, 1.8), "io": (MIST, None, 1.0)}[kind]
        s.rect(x, y, NW, NH, fill=PINE, stroke=col, sw=sw, rx=3, dash=dash)
        s.text(x + 12, y + 24, title, size=14, weight=600)
        pr = split_path(path)
        s.lines(x + 12, y + 41, pr, 11, size=8.4, family=MONO, fill=HAZE)
        s.lines(x + 12, y + 41 + 11 * len(pr) + 14, wrap(desc, 22)[:4], 14, size=11, fill=MIST, op=0.88)

    def arrow(x1: float, y1: float, x2: float, y2: float) -> None:
        s.path(f"M{x1} {y1} L{x2} {y2}", marker=True)

    # ---- vertical layout ---------------------------------------------------------------
    ay = 150
    a_h = 34 + NH + 18
    ty = ay + a_h                      # start of boundary strip
    strip = 118
    by = ty + strip
    nb = by + 34
    loop_y = nb + NH + 26
    mail_y = loop_y + 22
    mail_h = 64
    b_h = (mail_y + mail_h + 16) - by
    rt_y = by + b_h + 40

    s.rect(40, ay, W - 80, a_h, fill=CLOUD, op=0.04, rx=4)
    s.text(X0, ay + 22, "Page understanding", size=11, family=MONO, fill=CLOUD, weight=500, ls=1.2, upper=True)
    s.text(X0 + 190, ay + 22, "no authority: can read, retrieve and highlight; cannot act", size=10.5, family=MONO, fill=HAZE)
    s.rect(40, by, W - 80, b_h, fill=MEADOW, op=0.06, rx=4)
    s.text(X0, by + 22, "Browser action", size=11, family=MONO, fill=CLOUD, weight=500, ls=1.2, upper=True)
    s.text(X0 + 190, by + 22, "authority: every proposal is validated, re-checked and authorized before it runs", size=10.5, family=MONO, fill=HAZE)

    # ---- router (tall) -----------------------------------------------------------------
    r_top, r_bot = ay + 34, nb + NH
    s.rect(60, r_top, 138, r_bot - r_top, fill=PINE, stroke=MIST, sw=1, rx=3)
    s.text(72, r_top + 26, "Task router", size=14, weight=600)
    s.lines(72, r_top + 43, ["sidepanel/", "task-routing.ts"], 11, size=9, family=MONO, fill=HAZE)
    s.lines(72, r_top + 84, ["Deterministic", "keyword rules.", "No model call."], 14, size=11, fill=MIST, op=0.88)
    s.lines(72, r_top + 150, ["CONTENT_ONLY", "BROWSER_ACTION", "MIXED"], 15, size=10, family=MONO, fill=CLOUD)

    # ---- lane A ------------------------------------------------------------------------
    ny = ay + 34
    la = [
        ("Content snapshot", "content/page-content-parser.ts", "PageContentSnapshot: text blocks with IDs", "io"),
        ("Retrieval", "content/hybrid-content-retriever.ts", "lexical, embedding or hybrid; lexical fallback", "io"),
        ("Evidence", "content/content-evidence-selector.ts", "selects the blocks an answer may cite", "io"),
        ("Local model", "model/ContentUnderstandingService.ts", "summary, find or answer; output validated", "model"),
        ("Highlight", "content/content-highlighter.ts", "validated block IDs only; stale snapshots rejected", "io"),
    ]
    for i, (t, pth, d, k) in enumerate(la):
        node(xs[i], ny, t, pth, d, k)
        if i:
            arrow(xs[i - 1] + NW, ny + NH / 2, xs[i], ny + NH / 2)
    arrow(198, ny + NH / 2, xs[0], ny + NH / 2)

    # ---- trust boundary ----------------------------------------------------------------
    s.text(X0, ty + 30, "trust boundary", size=10, family=MONO, fill=CLOUD, weight=600, ls=1.2, upper=True)
    s.text(X0 + 120, ty + 30, "content block IDs never become action targets", size=10.5, family=MONO, fill=HAZE)
    s.line(60, ty + 40, W - 60, ty + 40, stroke=CLOUD, sw=1.2, dash="3 5", op=0.7)
    gx = xs[3] + NW / 2
    cross_y = ty + 90
    s.path(f"M{gx} {ny + NH} V{cross_y} H{xs[0] + NW / 2} V{by + 34}", marker=True, dash="5 4")
    s.lines(gx - 14, cross_y - 26, ["MIXED only: the preflight (sidepanel/agent-preflight.ts) either lets", "the browser stage start, or blocks it with INSUFFICIENT_EVIDENCE"],
            14, size=10, family=MONO, fill=MIST, anchor="end", halo=FOREST)

    # ---- lane B ------------------------------------------------------------------------
    lb = [
        ("DOM snapshot", "content/dom-parser.ts", "interactive elements with IDs; the only source of targets", "io"),
        ("Local model", "slm/inference.ts", "proposes one structured action (ActionProposal)", "model"),
        ("validateAction", "security/action-validator.ts", "strict schema: exact keys, enums, safe URLs", "gate"),
        ("Fresh snapshot", "slm/execution.ts", "re-read the page; reject if it changed (STALE_SNAPSHOT)", "gate"),
        ("authorizeAction", "security/capability-gate.ts", "capability and task policy from the DOM; no model", "gate"),
        ("Execute", "sidepanel/ExtensionController.ts", "CLICK, TYPE, SELECT, SCROLL, NAVIGATE in the page", "io"),
    ]
    for i, (t, pth, d, k) in enumerate(lb):
        node(xs[i], nb, t, pth, d, k)
        if i:
            arrow(xs[i - 1] + NW, nb + NH / 2, xs[i], nb + NH / 2)
    arrow(198, nb + NH / 2, xs[0], nb + NH / 2)
    s.path(f"M{xs[5] + NW / 2} {nb + NH} V{loop_y} H{xs[0] + NW / 2} V{nb + NH}", marker=True, dash="5 4")
    s.text(xs[3] + 10, loop_y - 7, "re-observe after every action  ·  stops after 8 model steps (PARTIAL)", size=10.5, family=MONO, fill=HAZE, anchor="middle", halo=FOREST)
    mx, mw = xs[1], DX * 4 + NW - DX
    s.rect(mx, mail_y, mw, mail_h, fill=PINE, stroke=CLOUD, sw=1.2, rx=3, dash="2 3")
    s.text(mx + 12, mail_y + 22, "Exception: mail-composer pages", size=12.5, weight=600)
    s.text(mx + 12, mail_y + 40, "useAgentActions.ts calls controller.composeEmail directly; it does not pass through authorizeAction.", size=10, family=MONO, fill=MIST)
    s.text(mx + 12, mail_y + 54, "authorizeAction is called only from slm/execution.ts (re-checked every time this diagram is built).", size=10, family=MONO, fill=HAZE)

    # ---- runtime contexts --------------------------------------------------------------
    s.text(60, rt_y, "Where it runs  ·  Chrome MV3 extension", size=11, family=MONO, fill=CLOUD, weight=500, ls=1.2, upper=True)
    ctx = [
        ("Side panel (React)", "routing, preflight, orchestration, validation, authorization"),
        ("Service worker", "relays extract, execute and highlight messages between panel and page"),
        ("Page (content script)", "builds both snapshots, performs the approved action, draws highlights"),
        ("Offscreen document + worker", "WebLLM inference, default Qwen3-4B (about 4.5 GB GPU); embeddings: all-MiniLM-L6-v2"),
    ]
    cw = 283
    for i, (t, d) in enumerate(ctx):
        x = 60 + i * (cw + 16)
        s.rect(x, rt_y + 14, cw, 92, fill="none", stroke=MIST, sw=1, rx=3, op=0.9)
        s.text(x + 12, rt_y + 38, t, size=13, weight=600)
        s.lines(x + 12, rt_y + 58, wrap(d, 44)[:3], 14, size=10.5, fill=HAZE)

    # ---- legend + attribution ----------------------------------------------------------
    fy = rt_y + 142
    s.rect(60, fy - 11, 26, 14, fill=PINE, stroke=TEAL, sw=1.6, rx=2, dash="5 4")
    s.text(96, fy, "local model: untrusted proposer", size=10.5, family=MONO, fill=HAZE)
    s.rect(330, fy - 11, 26, 14, fill=PINE, stroke=MEADOW, sw=1.8, rx=2)
    s.text(366, fy, "deterministic check (no model)", size=10.5, family=MONO, fill=HAZE)
    s.rect(640, fy - 11, 26, 14, fill=PINE, stroke=MIST, sw=1, rx=2)
    s.text(676, fy, "extract / retrieve / act", size=10.5, family=MONO, fill=HAZE)
    notes = [
        "Team project: Codefest Chitwan 2026 repository, four or more contributors. Drawn from the source tree and checked against it; paths are relative to src/.",
        "Sudeep's commits (14 to 16 Aug): local model adapter and Qwen3-4B WebLLM setup, DOM snapshot extraction and model-context adapter, Playwright browser controller, shared action and security contracts, runtime-stage reporting.",
        "Most capability-gate commits are a teammate's. Planned latency, security-gate and adversarial benchmarks are not completed; no benchmark is claimed here.",
    ]
    rows: list[str] = []
    for n in notes:
        rows += wrap(n, 168)
    s.lines(60, fy + 28, rows, 16, size=10.5, family=MONO, fill=HAZE, op=0.95)
    return s.render()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=str(ROOT.parent / "Alpha-Intellects"))
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "architecture.svg").write_text(build(Path(args.repo)), encoding="utf-8")
    print("wrote", (OUT / "architecture.svg").relative_to(ROOT))


if __name__ == "__main__":
    main()
