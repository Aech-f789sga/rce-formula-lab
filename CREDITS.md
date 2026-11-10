# Code references & credits

This project is a calculator layer on top of someone else's formula card, built
with a small number of open-source libraries. Everything used is listed here —
including what each one actually does in this codebase, not just a name.

The same list is rendered in the app at **Code references & credits**.

---

## Rendering & 3D

### three.js
<https://github.com/mrdoob/three.js> · **MIT**

The WebGL renderer behind every 2.5D model: orthographic camera, `ExtrudeGeometry`
for the laser-cut sections, shadow maps and PCF soft shadows. Vendored at
`vendor/three/three.module.js` (r160) so the site runs with no CDN.

### three.js — ExtrudeGeometry
<https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry> · **MIT**

Turns the 2D engineering outlines — soil phase block, dam section, channel
lining, beam profile — into solid 2.5D parts. Each part is given two materials
(cap and side wall) so the depth reads without any texture work.

### three.js — OrbitControls (reference only)
<https://github.com/mrdoob/three.js/blob/dev/examples/jsm/controls/OrbitControls.js> · **MIT**

The spherical-coordinate orbit and dolly interaction was **reimplemented** in
about forty lines in `js/viz/scene.js` rather than imported, to keep the bundle
small and to clamp the elevation the way an engineering drawing wants
(−7° to +77°). No OrbitControls code is vendored.

### EdgesGeometry
<https://threejs.org/docs/#api/en/geometries/EdgesGeometry> · **MIT**

Used by `outline()` in `js/viz/scene.js` to draw the silhouette of each part, so
the models read like technical illustrations rather than flat plastic.

---

## Mathematics typesetting

### KaTeX
<https://github.com/KaTeX/KaTeX> · **MIT**

Renders every formula ribbon and every line of the substitution trail. Bundled
locally in `vendor/katex` with its woff2 fonts, so the site works offline.

---

## Engineering formula sources

### FORMULA CARD (Engr. APJO) — without grid
**Primary source.** Every formula, symbol convention, special note and range
table on this site is transcribed from this 137-page handwritten card by
**Engr. Aleah Pearl Javier Once, RCE (2024)**. Page badges (`p.2`, `p.46`, …)
point back to it.

### Terzaghi bearing-capacity factors
<https://en.wikipedia.org/wiki/Bearing_capacity> · reference

Used to sanity-check the `N_c` / `N_q` / `N_γ` expressions as written on the card
(`N_c = tanφ(K_c+1)` form) and to choose the closed forms the calculator
evaluates.

### Manning / Chezy open-channel relations
<https://en.wikipedia.org/wiki/Manning_formula> · reference

Cross-checked the Kutter, Bazin and Manning `C`-coefficient forms on the
hydraulics pages, and the most-efficient-section result `R = d/2`.

### ACI 318 / NSCP 2015 notation
<https://en.wikipedia.org/wiki/ACI_318> · reference

φ-factors, `β₁`, `ρ_max` and the `0.85f'c` stress block follow the code notation
the card uses.

### Normal distribution CDF
The `Φ(z)` values behind the z-score calculator use the Abramowitz & Stegun
7.1.26 error-function approximation (maximum absolute error 1.5 × 10⁻⁷),
implemented inline in `js/data/math.js` — no library.

### Colebrook–White friction factor
Solved by fixed-point iteration in `js/data/hydraulics.js`, seeded at `f = 0.02`
and iterated to 1 × 10⁻¹⁰.

---

## Typography & UI

| Typeface | Source | Licence |
|---|---|---|
| **Inter** | <https://github.com/rsms/inter> | SIL OFL 1.1 |
| **Space Grotesk** | <https://github.com/floriankarsten/space-grotesk> | SIL OFL 1.1 |
| **JetBrains Mono** | <https://github.com/JetBrains/JetBrainsMono> | SIL OFL 1.1 |

Loaded from Google Fonts with a system-font fallback stack; the site degrades
gracefully without them.

---

## Method notes

The source card is a **scanned, handwritten** 137-page PDF with no text layer, so
every formula here was read off the page and re-derived symbol by symbol.

Where the card gives a range table the calculator reports the classification
alongside the number. Where the card lists several equivalent forms, the shape or
method is exposed as an input rather than hidden.

Two places where the card's shorthand and the closed-form solution differ are
flagged in-app instead of silently reconciled:

* **Terzaghi `N_γ`** — the card gives a K-form; the calculator evaluates
  `N_γ = 2(N_q+1)tanφ` and says so in the step note.
* **`ρ_max`** — the card writes it two ways; the calculator derives it from
  `c_max = 3d/8`, consistent with the `a` and `c` it reports.

Units are the card's units: kN/m³, kPa, mm, m, with `g = 9.81 m/s²`. Nothing is
silently converted.

---

## Licence

Code in this repository: **MIT** (see `LICENSE`).
The formula card itself remains the work of its author and is not relicensed
here — this project cites it, it does not redistribute it.
