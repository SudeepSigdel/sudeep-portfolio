# Portfolio asset scripts

Figures are generated, not drawn by hand. Python 3 standard library only; no new dependencies.

    python scripts/assets/janus_data.py        # raw Janus run records -> src/assets/projects/janus/data.json
    python scripts/assets/janus_figures.py     # data.json + ARCHITECTURE.md -> three SVGs
    python scripts/assets/aegisweb_figures.py  # AegisWeb source tree -> architecture.svg
    python scripts/assets/preview.py janus     # review/janus.html (inline SVGs, real fonts); same for aegisweb

Each script checks its inputs and fails rather than draw something the source does not support
(identical-outcome claims, module paths, the default model, which function calls the authorization gate).
Default source paths are ../janus and ../Alpha-Intellects; override with --janus / --repo.
Outputs are not wired into the site; `review/` is for review only.
