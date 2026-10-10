#!/usr/bin/env python3
"""Build review/<project>.html: the generated SVGs inline, with the site's real fonts (no site changes).

    python scripts/assets/preview.py janus
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
project = sys.argv[1] if len(sys.argv) > 1 else "janus"
src = ROOT / "src" / "assets" / "projects" / project
nm = "../node_modules"
html = f"""<!doctype html><meta charset="utf-8"><title>{project} figures: review</title>
<link rel="stylesheet" href="{nm}/@fontsource-variable/fraunces/index.css">
<link rel="stylesheet" href="{nm}/@fontsource-variable/inter/index.css">
<link rel="stylesheet" href="{nm}/@fontsource/jetbrains-mono/400.css">
<style>body{{margin:0;background:#f6f8f7;font:16px 'Inter Variable',sans-serif}}figure{{margin:0 auto 48px;max-width:1280px}}
svg{{width:100%;height:auto;display:block}}h1{{font:300 28px 'Fraunces Variable',serif;margin:32px auto;max-width:1280px;padding:0 20px}}</style>
<h1>{project}: generated figures (review only, not on the site)</h1>
"""
for f in sorted(src.glob("*.svg")):
    html += f'<figure id="{f.stem}">{f.read_text(encoding="utf-8")}</figure>\n'
out = ROOT / "review"
out.mkdir(exist_ok=True)
(out / f"{project}.html").write_text(html, encoding="utf-8")
print("wrote", out / f"{project}.html")
