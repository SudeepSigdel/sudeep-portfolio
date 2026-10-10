# RestaurantMS: proposed asset plan (not started)

Status: **plan only.** No screenshots, diagrams or copies of company material have been made. The
repository (`RestaurantMS`) belongs to a company organisation, so nothing below is produced until the
approvals in section 1 are given in writing.

## 1. Approvals needed from the company before anything is published

| # | Decision | Why it needs approval | What I will do until it is answered |
|---|---|---|---|
| 1 | **Employer / organisation name** to show. The repo is under `TechWorldConsultingService`; the portfolio currently says "Technest Innovation". | The two names differ and I must not guess which is correct or public. | Keep the current card text; do not add the repo owner's name. |
| 2 | **Product name and branding.** The UI and `frontend/public` carry the product name "MithoServe" and its logo; the repo is called RestaurantMS. | Brand assets and the product name belong to the company. | Use no logos, no login hero image, and no product name beyond what you approve. |
| 3 | **Whether the project may be named publicly** and described as "in production". | The repo shows prod Docker files but no deploy workflow, so "in production" is your statement, not something I can verify. | Keep wording as supplied by you; flag it as unverified. |
| 4 | **Screenshots of the running app** (even of fictional demo data). | Screens show the company's UI design, layout and workflows. | Capture nothing. |
| 5 | **Architecture detail level.** Module names, the list of Django apps, real-time channels, tenancy model, infra (Postgres, Redis, Channels, Docker). | Reveals internal structure. Some of it is already in the README, some is not. | Draw nothing beyond what the approved level allows. |
| 6 | **Your role wording.** First commit is 2026-06-14, before your August start; you have the most commits (about 190, under two author names) but it is a team repository. | Accuracy of attribution. | Say "work on", not "built", unless you confirm otherwise. |
| 7 | **Demo-data provenance.** The seed (`populate_demo`) creates a fictional tenant, but its 15 menu photos have unknown licensing. | Third-party image rights. | Use only seed text and layout; no menu photos until licensing is confirmed. |

## 2. Hard exclusions (will not be inspected, copied or published)

- `backend/media/` and anything under it: it holds uploaded images (thousands of files, over a thousand
  tracked in git) whose origin I cannot establish, so it may include real tenant uploads. I have not opened
  any of them and will not.
- `.env` files, credentials, and the demo password listed in `populate.md`.
- Real tenant, customer, staff or payroll data; any production URL or admin screen.
- Company logos, login hero image, and the Postman collection.
- Source code excerpts. Diagrams are drawn from structure, not pasted code.

## 3. Proposed assets (in priority order, each gated on the approvals above)

1. **Architecture diagram**: the backend apps, the real-time layer, the data stores and the two
   front-end contexts, as boxes and arrows only. Derived from `backend/apps/`, the Django settings and
   URL routing, and `docker/*.yml`, none of which I have read yet. Needs approvals 1, 3 and 5.
2. **Three to four screenshots from an isolated local demo tenant** (seeded fictional "Daal Bhat
   Kitchen"; never production, never real media):
   - table floor board (desktop),
   - waiter order entry (mobile width),
   - kitchen display screen,
   - bill preview with totals (fictional order).
   Captured from a fresh Docker run with `populate_demo --flush` on a throwaway database, with menu
   photos blanked or omitted, and with the demo password never shown. Needs approvals 1, 2, 4 and 7.
3. **Optional: tenant and permission flow diagram** (server-side queryset scoping, role-based access),
   drawn from the backend docs. Needs approval 5.

## 3a. How the screenshots will be made, once approved

- Fresh containers and a throwaway database; nothing from the developer's existing local data.
- Seed data only, reviewed before capture; capture at fixed viewport sizes.
- Redact or omit any URL bar, tenant slug, account name or email that is not part of the seed.
- Every screenshot reviewed by you (and the company, if required) before it enters `src/assets/`.

## 4. Claims to keep out of the portfolio copy until verified

- "In production": unverifiable from the repository.
- Any usage numbers (tenants, orders, users): none exist in the repo, so none will be written.
- Test coverage: about 564 backend and 59 frontend test files exist by filename; I have not run them,
  so I will not state a pass count.

## 5. What I need from you

Answers to items 1 to 7 in section 1 (at minimum 1, 2, 3 and 6), and whether the company wants to
review assets before publication. If approvals are partial, I will do only the diagram and describe the
rest in words.
