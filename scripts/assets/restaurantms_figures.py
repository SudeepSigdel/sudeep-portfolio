#!/usr/bin/env python3
"""Render the RestaurantMS architecture diagram (src/assets/projects/restaurantms/architecture.svg).

Structure only, drawn from the repository's settings, routing, Compose files and docs. It reads no
source code bodies beyond those, and never touches media, .env files, credentials or tenant data.
Every named component is checked against the repository; the script fails rather than draw one that
is not there.

    python scripts/assets/restaurantms_figures.py [--repo ../RestaurantMS]
"""

from __future__ import annotations

import argparse
from pathlib import Path

from aegisweb_figures import wrap
from janus_figures import CLOUD, FOREST, HAZE, MEADOW, MIST, MONO, PINE, TEAL, Svg, frame_header

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src" / "assets" / "projects" / "restaurantms"

APPS = [
    "tables", "orders", "reservations", "rooms", "billing", "ledger", "expenses", "payroll", "menu", "inventory",
    "reports", "reviews", "activity_logs", "chatbot", "core", "auth_users", "notifications", "websockets",
]
ROUTE_GROUPS = ["(waiter)", "(app)", "(kitchen)", "(public)", "(server)", "[tenantSlug]"]


def verify(repo: Path) -> None:
    apps = repo / "backend" / "apps"
    missing = [a for a in APPS if not (apps / a).is_dir()]
    assert not missing, f"apps not found: {missing}"
    extra = sorted(p.name for p in apps.iterdir() if p.is_dir() and not p.name.startswith("__") and p.name not in APPS)
    assert not extra, f"apps present in the repo but missing from the diagram: {extra}"
    routing = (apps / "websockets" / "routing.py").read_text(encoding="utf-8")
    for p in ("ws/tables/", "ws/kds/", "ws/notifications/"):
        assert p in routing, f"websocket path {p} not found"
    base = (repo / "backend" / "config" / "settings" / "base.py").read_text(encoding="utf-8")
    assert "RedisChannelLayer" in base and "RedisCache" in base, "Redis roles changed"
    assert "JWTAuthentication" in base, "JWT auth changed"
    compose = (repo / "docker" / "docker-compose.base.yml").read_text(encoding="utf-8")
    for svc in ("db:", "redis:", "backend:", "frontend:"):
        assert svc in compose, f"compose service {svc} not found"
    assert "postgres:16" in compose and "redis:7" in compose, "datastore versions changed"
    for g in ROUTE_GROUPS:
        assert (repo / "frontend" / "app" / g).exists(), f"route group {g} not found"
    ci = (repo / ".github" / "workflows" / "ci.yml").read_text(encoding="utf-8")
    for tool in ("Ruff", "Black", "Pytest", "ESLint", "TypeScript"):
        assert tool in ci, f"CI step {tool} not found"


def build(repo: Path) -> str:
    verify(repo)
    W, H = 1280, 880
    s = Svg(W, H, "RestaurantMS architecture",
            "Five client roles use one Next.js app. It talks to a Django REST API and to Django Channels WebSockets, both "
            "authenticated with JWT. Domain apps sit inside a tenant boundary with server-side permissions. PostgreSQL stores "
            "data; Redis serves the cache and the WebSocket channel layer. Docker Compose and GitHub Actions deliver and test it.",
            uid="rms-arch")
    frame_header(s, "One tenant at a time.",
                 "Multi-tenant restaurant and lodge operations  ·  permissions enforced on the server  ·  live updates are signals, not data",
                 "RestaurantMS  /  architecture")

    def box(x: float, y: float, w: float, h: float, title: str, lines: list[str], *, stroke: str = MIST, dash: str | None = None,
            sw: float = 1.0, mono_lines: bool = False) -> None:
        s.rect(x, y, w, h, fill=PINE, stroke=stroke, sw=sw, rx=3, dash=dash)
        s.text(x + 14, y + 25, title, size=14, weight=600)
        if mono_lines:
            s.lines(x + 14, y + 44, lines, 14, size=10.5, family=MONO, fill=HAZE)
        else:
            s.lines(x + 14, y + 44, lines, 14, size=11, fill=MIST, op=0.88)

    # ---- clients -----------------------------------------------------------------------
    ay = 152
    s.text(60, ay, "Clients  ·  one Next.js app (App Router), TanStack Query, a route group per role", size=11, family=MONO, fill=CLOUD,
           weight=500, ls=1.0, upper=True)
    clients = [
        ("Waiter", "mobile-first", "(waiter)"),
        ("Manager and front desk", "desktop-first", "(app)"),
        ("Kitchen display", "KDS queue", "(kitchen)"),
        ("Guests", "QR menu, reviews", "(public)  [tenantSlug]"),
        ("Platform admin", "tenants and plans", "(server)"),
    ]
    cw, gap = 220, 20
    for i, (t, d, g) in enumerate(clients):
        x = 60 + i * (cw + gap)
        s.rect(x, ay + 16, cw, 70, fill=PINE, stroke=MIST, sw=1, rx=3)
        s.text(x + 14, ay + 40, t, size=13.5, weight=600)
        s.text(x + 14, ay + 58, d, size=11, fill=MIST, op=0.88)
        s.text(x + 14, ay + 74, g, size=10, family=MONO, fill=HAZE)

    # ---- transports --------------------------------------------------------------------
    by = ay + 128
    rest_x, rest_w = 60, 700
    ws_x, ws_w = 800, 440
    s.path(f"M{rest_x + rest_w / 2} {ay + 86} V{by}", marker=True)
    s.path(f"M{ws_x + ws_w / 2} {ay + 86} V{by}", marker=True)
    bh = 92
    box(rest_x, by, rest_w, bh, "REST API  ·  /api/v1/", ["Django 5, Django REST Framework.", "JWT access and refresh tokens, refresh blacklist on logout."],
        stroke=MEADOW, sw=1.6)
    box(ws_x, by, ws_w, bh, "WebSocket  ·  ASGI, Channels",
        ["ws/tables · ws/kds · ws/notifications", "JWT in the query string, checked on connect", "events are signals: clients re-fetch over REST"],
        stroke=MEADOW, sw=1.6, mono_lines=True)

    # ---- tenant boundary ---------------------------------------------------------------
    ty = by + bh + 38
    th = 222
    s.rect(44, ty, W - 88, th, fill=MEADOW, op=0.05, rx=4)
    s.rect(44, ty, W - 88, th, fill="none", stroke=CLOUD, sw=1, rx=4, dash="3 5", op=0.5)
    s.text(60, ty + 24, "Tenant boundary", size=11, family=MONO, fill=CLOUD, weight=600, ls=1.2, upper=True)
    s.text(206, ty + 24, "every row belongs to a tenant; permissions and queryset scoping are enforced server-side, not in the UI",
           size=10.5, family=MONO, fill=HAZE)
    s.path(f"M{rest_x + rest_w / 2} {by + bh} V{ty}", marker=True)
    s.path(f"M{ws_x + ws_w / 2} {ty} V{by + bh}", marker=True, dash="5 4")
    s.text(ws_x + ws_w / 2 - 10, ty - 12, "broadcast after commit", size=10, family=MONO, fill=HAZE, anchor="end", halo=FOREST)

    groups = [
        ("Floor and orders", ["tables · orders", "reservations · rooms"], "Table state machine, kitchen sends, bookings, folios for the lodge add-on."),
        ("Billing and money", ["billing · ledger", "expenses · payroll"], "Sequential bill numbers, VAT and PAN, print payloads; expense review; pay runs."),
        ("Menu and stock", ["menu · inventory"], "Categories, variants, combos and specials; stock adjustments."),
        ("Insight", ["reports · reviews", "activity_logs · chatbot"], "Reports and CSV export, review funnel, audit log, LangGraph assistant on premium plans."),
        ("Platform", ["core · auth_users", "notifications · websockets"], "Tenants, plans, settings, roles; WebSocket broadcast helpers."),
    ]
    gw, gg = 216, 20
    gx0, gy, gh = 60, ty + 44, 158
    for i, (t, names, d) in enumerate(groups):
        x = gx0 + i * (gw + gg)
        s.rect(x, gy, gw, gh, fill=PINE, stroke=MIST, sw=1, rx=3)
        s.text(x + 14, gy + 25, t, size=14, weight=600)
        s.lines(x + 14, gy + 45, names, 14, size=10.5, family=MONO, fill=CLOUD)
        s.lines(x + 14, gy + 45 + 14 * len(names) + 8, wrap(d, 31)[:5], 14, size=11, fill=MIST, op=0.88)

    # ---- stores --------------------------------------------------------------------------
    sy = ty + th + 40
    s.path(f"M{300} {ty + th} V{sy}", marker=True)
    s.path(f"M{940} {ty + th} V{sy}", marker=True)
    box(60, sy, 480, 66, "PostgreSQL 16", ["system of record for every tenant"], stroke=TEAL)
    box(700, sy, 540, 66, "Redis 7", ["response cache and the Channels layer behind the WebSockets"], stroke=TEAL)

    # ---- delivery ------------------------------------------------------------------------
    dy = sy + 96
    s.text(60, dy, "Delivery  ·  Docker Compose: db, redis, backend, frontend (dev and prod overlays)  ·  GitHub Actions CI: ruff, black, pytest, ESLint, tsc, unit tests",
           size=10.5, family=MONO, fill=HAZE)

    # ---- attribution -----------------------------------------------------------------------
    notes = [
        "Team project built at Technest Innovation; Sudeep works on it as an intern (since August) and it is in production. Drawn from the repository's own docs, settings, routing and Compose files.",
        "Structure only: no tenant data, credentials, customer information, media or source code is shown.",
    ]
    rows: list[str] = []
    for n in notes:
        rows += wrap(n, 168)
    s.lines(60, dy + 30, rows, 16, size=10.5, family=MONO, fill=HAZE, op=0.95)
    return s.render()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=str(ROOT.parent / "RestaurantMS"))
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "architecture.svg").write_text(build(Path(args.repo)), encoding="utf-8")
    print("wrote", (OUT / "architecture.svg").relative_to(ROOT))


if __name__ == "__main__":
    main()
