# RCE Formula Lab

An interactive, auto-solving companion to the **RCE Formula Card** by
**Engr. Aleah Pearl Javier Once, RCE (2024)** — the 137-page handwritten formula
card used for the Philippine Civil Engineering board exam.

Pick a topic, type the values you already have, and read the answer together with
the full substitution trail. Every topic that has geometry attached to it also
gets a rotatable **2.5D model** that redraws itself from your numbers.

**77 calculators · 31 models · 4 sections · 137 source pages**

---

## What it does

| | |
|---|---|
| **Auto-calculates** | Every field is pre-filled with a realistic value, so each calculator answers something sensible the moment it opens. Change a number and everything recomputes. |
| **Shows the work** | Each answer comes with a numbered solution: the formula on the card, the numbers substituted into it, the intermediate results, and the notes the card adds in the margin. |
| **Draws the situation** | Soil phase blocks, gravity dams, trapezoidal channels, beams with moment diagrams, RC sections, horizontal and vertical curves — all built from your inputs, in an isometric "laser-cut" style. Drag to orbit, scroll to zoom. |
| **Sorted per section** | Geotechnical, Hydraulics, Structural, and Math / Surveying / Transportation — grouped by sub-topic exactly as the card is. |
| **Searchable** | Press `/` and type. Searches titles, sub-topics and keywords ("void ratio", "weir", "column"). |
| **Offline-capable** | three.js and KaTeX are vendored into `vendor/`. No CDN, no network, no build step. |

---

## Sections

### Geotechnical Engineering — source pages 2–14
Phase relationships · consistency & classification · permeability & seepage ·
stresses in soil · consolidation & settlement · bearing capacity · lateral earth
pressure · slope stability · deep foundations.

*Models:* soil phase block, layered stress profile, Terzaghi failure wedge,
retaining wall with pressure diagram, infinite slope with trial failure plane.

### Hydraulics — source pages 16–31
Fluid properties · hydrostatics · dams · buoyancy & stability · pipes & tanks ·
orifices & weirs · open channels · energy & flow · head losses · momentum ·
relative equilibrium.

*Models:* gravity dam, inclined gate, floating body with metacentre, pressure
pipe, orifice tank, rectangular and V-notch weirs, trapezoidal channel,
hydraulic jump, EGL/HGL diagram, jet on a vane, rotating vessel.

### Structural Analysis & Design — source pages 34–85
Strength of materials · beams & reactions · structural analysis · columns ·
steel design · reinforced concrete · foundations.

*Models:* simply supported beam with moment diagram, cantilever with deflected
shape, column buckling modes, RC section with stress block, isolated footing with
punching perimeter, pile cap plan, belt friction on a pulley.

### Math, Surveying & Transportation — source pages 88–137
Trigonometry & geometry · analytic geometry · algebra & statistics · engineering
economy · surveying · calculus · physics.

*Models:* line between two points, symmetrical vertical curve, horizontal curve
plan, earthwork prismoid, normal distribution.

---

## Running it

No build step, no dependencies to install.

```bash
# any static server works
python -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from the filesystem mostly works, but ES modules
and the WebGL canvas need a proper origin — use a server.

### Deploying

The site is plain static files. On GitHub Pages: **Settings → Pages → Source:
Deploy from a branch → `main` / root**. A `.nojekyll` file is included so the
`vendor/` folder is served as-is.

---

## Project layout

```
index.html               single page, hash router
css/styles.css           design system (paper / ink / four section inks)
js/
  core.js                number formatting, KaTeX rendering, DOM helpers
  app.js                 router, index rail, search, calculator runtime, credits page
  data/
    index.js             section metadata + the calculator registry
    geotech.js           21 calculators
    hydraulics.js        20 calculators
    structural.js        17 calculators
    math.js              19 calculators
  viz/
    index.js             lazy model loader + camera presets
    scene.js             the 2.5D stage: orthographic camera, lighting, primitives
    geotech.js           soil phase, stress profile, footing, wall, slope
    hydraulics.js        dam, gate, buoyancy, pipe, orifice, weir, channel, jump, EGL, jet, vessel
    structural.js        beam, cantilever, column, RC section, footing, pile cap, belt
    math.js              line, vertical curve, horizontal curve, earthwork, normal curve
vendor/
  three/                 three.js r160 (MIT) — the only 3D dependency
  katex/                 KaTeX 0.16 (MIT) + fonts
```

### Adding a calculator

Append an object to the relevant file in `js/data/`:

```js
{
  id: "geo-example",
  group: "Phase Relationships",     // sub-heading in the index rail
  title: "Example",
  lede: "One sentence on what it answers.",
  formula: String.raw`\gamma=\frac{W}{V}`,
  pages: [2],                       // source page badges
  keywords: ["unit weight"],
  viz: "geo:phase",                 // optional — "family:builder"
  inputs: [
    { k: "W", label: "Weight", sym: "W", unit: "kN", def: 18.5, step: 0.1 },
  ],
  run(v) {
    const gamma = v.W / 1.0;
    return {
      results: [{ label: "Unit weight", sym: "γ", value: gamma, unit: "kN/m³", hero: true }],
      steps: [{ title: "Divide", tex: String.raw`\gamma=\frac{${v.W}}{1}=${gamma}` }],
      viz: { /* whatever the model needs */ },
    };
  },
}
```

`run()` returns `{ results, steps, viz }`. A `step` is `{ title, tex, note }`;
`note` accepts inline HTML for emphasis.

---

## Conventions

* Units are the card's units — kN/m³, kPa, mm, m — with **g = 9.81 m/s²**.
  Nothing is silently converted.
* Where the card gives a range table (relative density, plasticity index,
  suitability number, AASHTO group index) the calculator reports the
  **classification** next to the number.
* Where the card lists several equivalent forms — three ways to write `D_r`, four
  Terzaghi footing shapes, two pile-soil cases — the shape or method is an input,
  not a hidden assumption.
* Page badges (`p.2`) point back to the source PDF.

### Deliberate deviations

Two places where the card's shorthand and the closed-form solution differ
slightly; both are flagged in-app rather than silently reconciled:

1. **Terzaghi `N_γ`.** The card gives the K-form (`N_γ = ½tanφ(K_γ tanφ − 1)`).
   The calculator evaluates `N_γ = 2(N_q+1)tanφ`, which is monotonic and matches
   tabulated Terzaghi values within a few percent at moderate φ. The note under
   the step says so.
2. **`ρ_max` for RC beams.** The card writes `ρ_max` two ways. The calculator
   derives it from `c_max = 3d/8` (the tension-controlled limit), which is
   self-consistent with the `a` and `c` it reports.

---

## Credits

Full list with links and licences is in [`CREDITS.md`](CREDITS.md), and in the
app at **Code references & credits**.

* Formula source: **FORMULA CARD (Engr. APJO) — without grid**, Engr. Aleah Pearl
  Javier Once, RCE, 2024.
* 3D: [three.js](https://github.com/mrdoob/three.js) (MIT).
* Math typesetting: [KaTeX](https://github.com/KaTeX/KaTeX) (MIT).
* Type: Inter, Space Grotesk, JetBrains Mono (SIL OFL 1.1).

---

## Disclaimer

A study aid, not a design authority. The formulas are transcribed by hand from a
handwritten card, and the calculators implement one reading of them. Verify
anything that matters against the code, the card, and your references before it
goes into a design, a submission, or an exam answer you are betting on.
