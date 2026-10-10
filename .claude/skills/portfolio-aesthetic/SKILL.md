---
name: portfolio-aesthetic
description: Art direction for this portfolio. Use when designing, building, or reviewing any UI, copy layout, imagery, motion, or styling so the site stays an editorial landscape experience (vivid meadows, towering clouds, misty teal mountains, small figure / vast world) and not a generic developer portfolio.
---

# Portfolio Aesthetic

Source of direction: two reference landscapes.
1. A small figure running through a vivid green meadow under an enormous white cumulus wall against deep blue sky (freedom, wonder).
2. A lone, hatted figure in windswept dark-green grass facing layered teal mountains in haze, with a single word, "DISCIPLINE", set in elegant serif (solitude, resolve).

Never invent personal details, biography, projects, metrics, quotes, or testimonials. Use clearly marked placeholders (`[Project title]`, `[One-sentence summary]`) for anything the owner has not supplied.

## Locked direction: "Meadow to Ridge" (approved; overrides general guidance below where they differ)

The page moves from open field to treeline to ridge. Each section has one fixed mood:

| Section | Mood | Surface |
|---|---|---|
| Hero | Bright, cinematic: a vivid green hillside under open sky, vivid green allowed here. Type is dark `--pine` on the pale sky (no heavy veil, so the photo stays bright) | Image, only a soft top lift for the nav |
| Transition | Deliberate gradient strip from the hero's bottom edge into `--forest` (never a hard cut, never a decorative band) | Gradient to `--forest` |
| About | Dark, atmospheric | `--forest` |
| Work | Light, editorial, optimised for reading | `--cloud` / `--ink` |
| Stack | Dark, atmospheric | `--forest` |
| Closing / Contact | Dark: the misty green slope with small hikers is the closing visual; copy sits top-left over a `--pine` veil, hikers stay clear | Image + `--pine` veil |

Rules:
- Bright only in the hero. Do not add vivid green or sky blue to dark or Work sections beyond the single accent rule.
- Navigation is section-aware: a fixed slim bar, transparent over the hero, solid `--pine` after it. It shows the current section as `NN / Name` and marks the active link with `aria-current`. On mobile the links collapse into a menu button (`aria-expanded`) that closes on link click and Escape; the current section label stays visible.
- Photos are high-resolution (2600 px wide or more), Unsplash-licensed, and credited in the footer and in `src/assets/landscapes/CREDITS.md`. Do not reintroduce low-resolution or watermarked reference images.
- The transparent nav uses dark type over the bright hero and flips to light type on the solid bar and the open menu.
- Project visuals must be real: screenshots, diagrams or research figures the owner supplies. Never invent mockups, charts, metrics or achievements. Projects without a supplied visual stay text-only; no placeholder art. Generated figures live in `src/assets/projects/<project>/` and are produced by `scripts/assets/` from the real repositories and run records; they are inlined in the Work section (first figure open, others collapsed) and scroll sideways inside their frame on narrow screens. Every figure states its split, sample size, uncertainty and limitations on the figure itself; negative results stay in.
- Parallax: hero only, desktop only (wide viewport, fine pointer), disabled for `prefers-reduced-motion: reduce`. Everything else is fade-and-rise reveal.
- Stack stays fixed: Astro, plain CSS tokens, Fraunces / Inter / JetBrains Mono. No new dependencies for visual effects.

## 1. Principles and emotional intent

Feel: solitude, discipline, freedom, wonder, quiet ambition. Calm, confident, unhurried.

- **Small figure, vast world.** Scale contrast is the signature. Content is small and precise inside generous space.
- **Editorial, not template.** Think magazine spread or film title card: one idea per viewport, strong hierarchy, deliberate silence.
- **Restraint.** Two or three elements per view. Whitespace (sky) is a feature.
- **Atmosphere over decoration.** Depth comes from haze, layered tone, and light, never from shadows, gradients-for-their-own-sake, or ornament.
- **Craft in the details.** Technical info (mono) is quiet and exact; it signals discipline.

## 2. Color and typography

### Palette (tokens; tune against the reference images, keep the roles)

| Token | Hex | Role |
|---|---|---|
| `--sky` | `#2F7FD0` | Rare accent, deep-sky blue; sky-only moments |
| `--cloud` | `#F6F8F7` | Light surface, text on dark |
| `--mist` | `#DCE7E4` | Secondary light surface, hairlines on dark |
| `--meadow` | `#4FB22E` | Vivid accent: one per view max (links, active state, key marker) |
| `--grass` | `#5E8F45` | Mid-green, illustrative fills |
| `--forest` | `#1C3A28` | Primary dark surface |
| `--pine` | `#0F2218` | Deepest dark, text on light |
| `--teal-haze` | `#6E9A9A` | Atmospheric mid-tone, secondary text on dark, depth layers |
| `--ink` | `#14201A` | Body text on light |

Rules:
- Default to one mode per section: **light** (cloud/mist, ink text) or **dark** (forest/pine, cloud text). Alternate for rhythm, like moving between meadow and forest.
- Vivid `--meadow` is the "wonder" note: sparing and never a large background.
- Neutrals are green-tinted. No pure `#000` or `#fff`, no grey-blue SaaS slate, no purple/indigo.
- Define as CSS custom properties; never hard-code hex in components.

### Typography

| Role | Style | Suggested families (pick one per role, self-host or Google Fonts) |
|---|---|---|
| Display / headlines | Elegant high-contrast serif, light-to-regular weight, tight tracking, optional all-caps wide-tracked for single-word title cards | Cormorant Garamond, Fraunces, Newsreader, Playfair Display |
| Body / UI | Clean neutral sans | Inter, DM Sans, Manrope |
| Technical details | Monospace, small, uppercase or lowercase with tracking | JetBrains Mono, IBM Plex Mono |

- Fluid scale with `clamp()`. Display: roughly 3rem to 9rem. Body: 1rem to 1.125rem, line-height 1.6, measure 55 to 70ch.
- Mono is only for metadata: dates, stack, coordinates, index numbers, captions. Never for paragraphs or headings.
- One serif, one sans, one mono. No more.
- Single-word title cards (the "DISCIPLINE" move) are encouraged for section openers: large serif, wide tracking, placed in empty sky.

## 3. Landscape imagery

- **Subject:** meadow, clouds, mountains, grass, sky. A small human figure is allowed and encouraged for scale. Only use imagery the owner supplies or has rights to; do not fabricate sources or credits.
- **Cropping:** keep the figure under roughly 10 to 15% of frame height. Put the horizon on a third line, not center. Leave the largest area of calm (sky or haze) for text. Never crop through the figure.
- **Orientation:** the references are portrait; verify EXIF/rotation before use. Provide separate desktop (wide) and mobile (tall) crops with `<picture>` and `object-position`, not one image stretched.
- **Contrast:** text sits on calm regions only (sky, haze, flat meadow). Do not place text over busy grass texture or cloud edges.
- **Overlays:** subtle and tonal.
  - Prefer a gradient from `--pine` at 0 to 55% opacity, aligned to the text edge, fading to transparent.
  - Or a soft multiply with `--forest` at 10 to 25%.
  - No heavy black scrims, blur panels, or glassmorphism cards over photos.
  - Verify contrast after the overlay is applied (see section 6).
- **Grading:** keep greens natural-vivid, keep whites soft, not clipped. Teal haze in the distance for depth. No filters that flatten the scene (no heavy desaturation, no duotone neon).
- **Performance:** AVIF/WebP with JPEG fallback, `srcset`/`sizes`, explicit `width`/`height`, lazy-load below the fold, preload only the hero. Provide a solid `--forest`/`--sky` background color as placeholder.
- **Alt text:** describe the scene honestly ("Small figure running across a green meadow beneath towering clouds"); decorative repeats get `alt=""`.

## 4. Layout and spacing

- 12-column grid, max content width about 1200px; text columns narrower (about 640px). Images may bleed full width.
- Spacing scale on an 8px base: 8, 16, 24, 40, 64, 96, 160. Section vertical padding: `clamp(6rem, 14vw, 12rem)`.
- Asymmetry over centering: anchor text to one side, let the landscape occupy the other. Offset headings from body.
- Full-bleed image sections alternate with narrow, quiet text sections.
- One focal point per viewport. If two things compete, remove one.
- Hairline rules (1px, `--teal-haze` at 30 to 40%) and small mono index numbers (`01`, `02`) for structure instead of cards and boxes.
- Corners square or very slightly rounded (0 to 4px). No pill-heavy UI.

## 5. Section guidance

Sections and content are the owner's; apply the aesthetic only. Use placeholders for unknown copy.

- **Hero:** full-viewport landscape, small figure for scale, one serif headline in the calm sky area, one line of sans, one text link/CTA, mono metadata (e.g. `[Role] / [Location]`). Nothing else.
- **About:** two-column; a tall landscape crop beside a narrow text column. Serif pull-line, sans paragraph. Dark or light, not over a photo.
- **Work / Projects:** editorial index, not a card grid. Each entry: mono index, serif title, one-line sans summary, mono stack tags. Large image per project with generous space; hover reveals a thin line or small shift, not a lift-and-shadow.
- **Skills / Stack:** mono, typeset as a quiet list or columns on a dark section. No progress bars, percent meters, or logo walls.
- **Experience / Timeline (if used):** hairline rule with mono dates; serif role titles. Plain, vertical, scannable.
- **Writing / Notes (if used):** list with mono dates and serif titles, like a table of contents.
- **Contact:** closing "title card": big serif line over sky or haze, a single email/link, minimal footer. Echo the hero landscape at a different time or crop to give the page a sense of arrival.
- **Nav/Footer:** small, mono or sans, transparent over hero then solid `--forest` or `--cloud` on scroll. Few items, no logo-heavy bar.

## 6. Motion, responsive, accessibility

### Motion
- Slow and atmospheric: 600 to 1200ms, ease-out curves (`cubic-bezier(.2,.7,.2,1)`). Never bouncy or springy.
- Allowed: gentle parallax on distant layers (clouds slower than grass), fade-and-rise on text (12 to 24px), slow image scale (1.00 to 1.04), subtle grass-sway style drift on a hero layer.
- Animate only `transform` and `opacity`. No layout-shifting animation, no scroll-jacking, no cursor-follower gimmicks, no autoplay sound.
- One motion idea per section. Stagger sparingly.

### Reduced motion
- Wrap all non-essential motion in `@media (prefers-reduced-motion: no-preference)`. Under `reduce`: no parallax, no autoplay video/loops, no scale or drift; fades may become instant or very short opacity changes. Content must be fully readable and visible without JS animation.
- Provide a static poster for any video background.

### Responsive
- Mobile first. Separate portrait crops for hero and feature images; verify the figure and the text zone still read.
- Fluid type with `clamp()`; no horizontal scroll at 320px.
- On mobile, stack image above or below text rather than overlaying where contrast is marginal. Reduce section padding but keep generous air (min about 4rem).
- Disable parallax on touch and small screens.

### Accessibility
- Body text contrast at least 4.5:1, large text at least 3:1, measured on the final composited background (overlay included). Check hover/focus states too.
- Visible focus ring (2px `--meadow` or `--cloud` with offset); never remove outlines.
- Semantic landmarks, single `h1`, logical heading order, skip link.
- Hit targets at least 44px. Links distinguishable beyond color.
- Don't convey meaning via the green accent alone.
- Respect `prefers-color-scheme` only if a coherent light/dark mapping is designed; otherwise keep the section-based light/dark rhythm.

## 7. Anti-patterns

- Generic developer-portfolio tropes: terminal/typing animations, "Hi, I'm ... 👋", matrix or code-rain, glowing neon, gradient-text headlines, dark-mode-by-default blue/purple glow.
- Card grids with drop shadows, bento boxes, glassmorphism, emoji icons, skill-percentage bars, tech-logo walls.
- Stock-photo mashups, mismatched color grades, or imagery that isn't a coherent landscape world; cartoon and photo styles mixed arbitrarily.
- Text over busy texture; heavy black overlays; low-contrast pale-on-pale.
- More than three type families, or serif used for UI micro-copy and mono used for paragraphs.
- Saturated meadow green used as a large fill or on multiple elements at once.
- Centered-everything layouts, uniform spacing, every section a different style.
- Motion for its own sake: bounce, spin, marquee, scroll hijack, cursor trails, simultaneous animations.
- Filler copy, fake stats, invented testimonials, or made-up project details.
- Visual noise: borders, shadows, badges, and icons stacked around content that should simply breathe.

## 8. Evaluation checklist

Run against any UI change; all should be "yes" before shipping.

**Intent**
- [ ] Does it feel calm, vast, and deliberate (small subject, large space)?
- [ ] Does it read as editorial/art-directed rather than a template?
- [ ] Is there one clear focal point per viewport?

**Palette and type**
- [ ] Only palette tokens used; vivid green appears at most once per view?
- [ ] Serif for headlines, sans for body, mono only for technical details?
- [ ] Type scale is fluid; line length is 55 to 70ch?

**Imagery**
- [ ] Image is landscape-coherent, well cropped, with the figure small and uncut?
- [ ] Text sits on a calm region; overlay is subtle?
- [ ] Separate mobile crop, responsive sources, dimensions set, alt text honest?

**Layout**
- [ ] Spacing from the scale, generous, asymmetrical where appropriate?
- [ ] Structure via hairlines and mono indices, not cards and shadows?

**Motion and accessibility**
- [ ] Motion is slow, transform/opacity only, one idea per section?
- [ ] `prefers-reduced-motion` handled; works without animation?
- [ ] Contrast measured on the composited background; focus visible; keyboard works; no horizontal scroll at 320px?

**Content integrity**
- [ ] No invented personal details, projects, metrics, or quotes (placeholders used)?
- [ ] Anything that could appear on any developer's site has been removed or reworked?
