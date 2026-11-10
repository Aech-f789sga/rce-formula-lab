/* ==========================================================================
   data/structural.js — Principles of Structural Analysis and Design
   Transcribed from FORMULA CARD (Engr. APJO), pages 34–85.
   ========================================================================== */

import { texNum as N, fmt } from "../core.js";

const G = 9.81;
const str = (o) => ({ section: "structural", ...o });

export const STRUCTURAL = [

  /* ---------------------------------------------------------------- 1 */
  str({
    id: "str-stress",
    group: "Strength of Materials",
    title: "Axial, Bearing & Shear Stress",
    lede: "The three stresses that start every mechanics problem — and the punching-shear perimeter that decides a footing's depth.",
    formula: String.raw`\sigma=\frac{P}{A} \qquad \tau=\frac{V}{A} \qquad \tau_{punch}=\frac{V}{perimeter\cdot t}`,
    pages: [34],
    keywords: ["stress", "axial", "bearing", "shear", "single", "double", "punching"],
    inputs: [
      { k: "P", label: "Axial load", sym: "P", unit: "kN", def: 250, step: 5 },
      { k: "A", label: "Cross-sectional area", sym: "A", unit: "mm²", def: 3200, step: 10 },
      { k: "mode", label: "Stress type", type: "select", def: "axial",
        options: [
          { value: "axial", label: "Axial (tension / compression)" },
          { value: "bearing", label: "Bearing on a contact area" },
          { value: "single", label: "Single shear" },
          { value: "double", label: "Double shear" },
        ] },
      { k: "per", label: "Punching perimeter", sym: "perimeter", unit: "mm", def: 1600, step: 10 },
      { k: "t", label: "Plate thickness", sym: "t", unit: "mm", def: 200, step: 5 },
    ],
    run(v) {
      const { P, A, per, t } = v;
      const axial = (P * 1000) / A;
      const single = (P * 1000) / A;
      const dbl = (P * 1000) / (2 * A);
      const punch = (P * 1000) / (per * t);

      const map = { axial, bearing: axial, single, double: dbl };
      const val = map[v.mode];
      const names = { axial: "Axial stress", bearing: "Bearing stress", single: "Single shear", double: "Double shear" };

      return {
        results: [
          { label: `${names[v.mode]}`, sym: v.mode === "axial" || v.mode === "bearing" ? "σ" : "τ", value: val, unit: "MPa", hero: true, digits: 4 },
          { label: "Axial / bearing stress", sym: "σ = P/A", value: axial, unit: "MPa", digits: 4 },
          { label: "Single shear", sym: "τ = V/A", value: single, unit: "MPa", digits: 4 },
          { label: "Double shear", sym: "τ = V/2A", value: dbl, unit: "MPa", digits: 4 },
          { label: "Punching shear", sym: "τ", value: punch, unit: "MPa", digits: 4 },
        ],
        steps: [
          {
            title: v.mode === "double" ? "Double shear" : v.mode === "single" ? "Single shear" : "Normal stress",
            tex: v.mode === "double"
              ? String.raw`\tau=\frac{V}{2A}=\frac{(${N(P)}\times10^3)}{2(${N(A)})}=${N(dbl, 4)}\ \text{MPa}`
              : v.mode === "single"
                ? String.raw`\tau=\frac{V}{A}=\frac{(${N(P)}\times10^3)}{${N(A)}}=${N(single, 4)}\ \text{MPa}`
                : String.raw`\sigma=\frac{P}{A}=\frac{(${N(P)}\times10^3)}{${N(A)}}=${N(axial, 4)}\ \text{MPa}`,
            note: "kN → N and mm² keeps the answer in MPa (N/mm²) with no conversion factor.",
          },
          {
            title: "Punching shear",
            tex: String.raw`\tau=\frac{V}{\text{perimeter}\times t}=\frac{(${N(P)}\times10^3)}{(${N(per)})(${N(t)})}=${N(punch, 4)}\ \text{MPa}`,
            note: "The perimeter is the actual failure surface — πD for a round punch, 2(a+b) for a rectangle.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 2 */
  str({
    id: "str-deform",
    group: "Strength of Materials",
    title: "Deformation, Poisson's Ratio & Elastic Constants",
    lede: "Elongation under axial load, then the three elastic constants that must stay consistent with each other.",
    formula: String.raw`\delta=\frac{PL}{AE} \qquad G=\frac{E}{2(1+\nu)} \qquad E_{bulk}=\frac{E}{3(1-2\nu)}`,
    pages: [34],
    keywords: ["deformation", "elongation", "poisson", "modulus of rigidity", "bulk modulus", "hooke"],
    inputs: [
      { k: "P", label: "Axial load", sym: "P", unit: "kN", def: 180, step: 5 },
      { k: "L", label: "Original length", sym: "L", unit: "m", def: 3.5, step: 0.1 },
      { k: "A", label: "Cross-sectional area", sym: "A", unit: "mm²", def: 2400, step: 10 },
      { k: "E", label: "Modulus of elasticity", sym: "E", unit: "GPa", def: 200, step: 1 },
      { k: "nu", label: "Poisson's ratio", sym: "ν", unit: "", def: 0.3, step: 0.01 },
    ],
    run(v) {
      const { P, L, A, E, nu } = v;
      const EPa = E * 1e9;
      const Lm = L;
      const delta = (P * 1000 * Lm) / (A * 1e-6 * EPa);   // m
      const strain = delta / Lm;
      const stress = (P * 1000) / A;                       // MPa
      const Gmod = E / (2 * (1 + nu));
      const Kbulk = E / (3 * (1 - 2 * nu));
      const lateral = -nu * strain;

      return {
        results: [
          { label: "Axial deformation", sym: "δ", value: delta * 1000, unit: "mm", hero: true, digits: 4 },
          { label: "Axial strain", sym: "ε", value: strain, digits: 4 },
          { label: "Axial stress", sym: "σ", value: stress, unit: "MPa", digits: 4 },
          { label: "Modulus of rigidity", sym: "G", value: Gmod, unit: "GPa", digits: 4 },
          { label: "Bulk modulus", sym: "E_bulk", value: Kbulk, unit: "GPa", digits: 4 },
          { label: "Lateral strain", sym: "ε_lat", value: lateral, digits: 4 },
          { label: "Change in width (per unit)", value: lateral * 100, unit: "%", digits: 4 },
        ],
        steps: [
          {
            title: "Axial stress and strain",
            tex: String.raw`\sigma=\frac{P}{A}=\frac{${N(P)}\times10^3}{${N(A)}}=${N(stress, 4)}\ \text{MPa}` +
              String.raw`\\[4pt] \varepsilon=\frac{\sigma}{E}=\frac{${N(stress, 4)}}{${N(E * 1000)}}=${N(strain, 4)}`,
          },
          {
            title: "Deformation",
            tex: String.raw`\delta=\frac{PL}{AE}=\varepsilon L=(${N(strain, 4)})(${N(Lm)})=${N(delta, 4)}\ \text{m}=${N(delta * 1000, 4)}\ \text{mm}`,
          },
          {
            title: "Modulus of rigidity",
            tex: String.raw`G=\frac{E}{2(1+\nu)}=\frac{${N(E)}}{2(1+${N(nu)})}=${N(Gmod, 4)}\ \text{GPa}`,
            note: "ν = 0.5 is rubber-like and incompressible — G would go to zero, which is why G and K blow up together.",
          },
          {
            title: "Bulk modulus",
            tex: String.raw`E_{bulk}=\frac{E}{3(1-2\nu)}=\frac{${N(E)}}{3(1-2\times${N(nu)})}=${N(Kbulk, 4)}\ \text{GPa}`,
          },
          {
            title: "Lateral strain",
            tex: String.raw`\nu=-\frac{\varepsilon_{lat}}{\varepsilon}\;\Rightarrow\;\varepsilon_{lat}=-\nu\varepsilon=${N(lateral, 4)}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 3 */
  str({
    id: "str-beam",
    group: "Beams & Reactions",
    title: "Simply Supported Beam — Reactions & Maximum Moment",
    lede: "Uniform load plus a point load anywhere on the span: both reactions, the maximum moment and where it occurs.",
    formula: String.raw`R_1=\frac{wL}{2}+\frac{Pb}{L} \qquad R_2=\frac{wL}{2}+\frac{Pa}{L}`,
    pages: [44, 46],
    keywords: ["beam", "reactions", "simply supported", "moment", "shear", "udl"],
    viz: "str:beam",
    inputs: [
      { k: "L", label: "Span", sym: "L", unit: "m", def: 8, step: 0.1 },
      { k: "w", label: "Uniform load", sym: "w", unit: "kN/m", def: 12, step: 0.5 },
      { k: "P", label: "Point load", sym: "P", unit: "kN", def: 40, step: 1 },
      { k: "a", label: "Distance of P from left support", sym: "a", unit: "m", def: 3, step: 0.1 },
    ],
    run(v) {
      const { L, w, P, a } = v;
      const b = L - a;
      const R1 = (w * L) / 2 + (P * b) / L;
      const R2 = (w * L) / 2 + (P * a) / L;

      // moment at any x, then scan for the maximum
      const Mx = (x) => R1 * x - (w * x * x) / 2 - (x > a ? P * (x - a) : 0);
      let Mmax = 0, xM = 0;
      for (let i = 0; i <= 400; i++) {
        const x = (i / 400) * L;
        const m = Mx(x);
        if (m > Mmax) { Mmax = m; xM = x; }
      }
      const Vmax = Math.max(R1, Math.abs(R2 - P) < 0 ? R1 : R2, Math.abs(R1 - P - w * L));

      return {
        results: [
          { label: "Reaction at left support", sym: "R_1", value: R1, unit: "kN", hero: true },
          { label: "Reaction at right support", sym: "R_2", value: R2, unit: "kN" },
          { label: "Maximum bending moment", sym: "M_max", value: Mmax, unit: "kN·m" },
          { label: "Location of maximum moment", sym: "x", value: xM, unit: "m", digits: 4 },
          { label: "Maximum shear", sym: "V_max", value: Math.max(R1, R2), unit: "kN" },
          { label: "Check ΣF_y", value: R1 + R2 - (w * L + P), unit: "kN", digits: 4, note: "must be ≈ 0" },
        ],
        steps: [
          {
            title: "Take moments about the right support for R₁",
            tex: String.raw`R_1=\frac{wL}{2}+\frac{Pb}{L}=\frac{(${N(w)})(${N(L)})}{2}+\frac{(${N(P)})(${N(b)})}{${N(L)}}=${N(R1, 5)}\ \text{kN}`,
          },
          {
            title: "Sum of vertical forces for R₂",
            tex: String.raw`R_2=\frac{wL}{2}+\frac{Pa}{L}=${N(R2, 5)}\ \text{kN}` +
              String.raw`\\[4pt] R_1+R_2=${N(R1 + R2, 5)}\ \text{kN}=wL+P=${N(w * L + P, 5)}\ \text{kN}\ \checkmark`,
          },
          {
            title: "Moment expression",
            tex: String.raw`M(x)=R_1x-\frac{wx^2}{2}-P(x-a)\ \ (x>a)`,
            note: "Setting dM/dx = 0 gives the location of the maximum — it is not always under the point load.",
          },
          {
            title: "Maximum moment",
            tex: String.raw`M_{max}=${N(Mmax, 5)}\ \text{kN}\cdot\text{m}\quad\text{at }x=${N(xM, 4)}\ \text{m}`,
          },
        ],
        viz: { L, w, P, a, R1, R2, Mmax, xM, Mx: [...Array(81)].map((_, i) => Mx((i / 80) * L)) },
      };
    },
  }),

  /* ---------------------------------------------------------------- 4 */
  str({
    id: "str-cantilever",
    group: "Beams & Reactions",
    title: "Cantilever — Reactions & Fixed-End Moment",
    lede: "A fixed-end beam with uniform load: the reaction, the fixed-end moment and the tip deflection.",
    formula: String.raw`M=\frac{wL^2}{2} \qquad \delta_{tip}=\frac{wL^4}{8EI}`,
    pages: [46],
    keywords: ["cantilever", "fixed end", "moment", "deflection", "propped"],
    viz: "str:cantilever",
    inputs: [
      { k: "L", label: "Length", sym: "L", unit: "m", def: 4, step: 0.1 },
      { k: "w", label: "Uniform load", sym: "w", unit: "kN/m", def: 15, step: 0.5 },
      { k: "P", label: "Point load at the tip", sym: "P", unit: "kN", def: 20, step: 1 },
      { k: "E", label: "Modulus of elasticity", sym: "E", unit: "GPa", def: 200, step: 1 },
      { k: "I", label: "Moment of inertia", sym: "I", unit: "×10⁶ mm⁴", def: 85, step: 1 },
    ],
    run(v) {
      const { L, w, P, E } = v;
      const Im = v.I * 1e-6;              // m⁴
      const EPa = E * 1e9;
      const R = w * L + P;
      const Mfix = (w * L * L) / 2 + P * L;
      const dTip = (w * Math.pow(L, 4)) / (8 * EPa * Im) + (P * Math.pow(L, 3)) / (3 * EPa * Im);
      const EI = EPa * Im;
      return {
        results: [
          { label: "Fixed-end moment", sym: "M", value: Mfix, unit: "kN·m", hero: true },
          { label: "Vertical reaction", sym: "R", value: R, unit: "kN" },
          { label: "Tip deflection", sym: "δ", value: dTip * 1000, unit: "mm", digits: 4 },
          { label: "Flexural rigidity", sym: "EI", value: EI / 1000, unit: "MN·m²", digits: 4 },
          { label: "Deflection ratio", sym: "L/δ", value: L / dTip, digits: 3 },
        ],
        steps: [
          {
            title: "Reaction and fixed-end moment",
            tex: String.raw`R=wL+P=(${N(w)})(${N(L)})+${N(P)}=${N(R, 5)}\ \text{kN}` +
              String.raw`\\[4pt] M=\frac{wL^2}{2}+PL=${N(Mfix, 5)}\ \text{kN}\cdot\text{m}`,
            note: "Both loads bend the cantilever the same way, so the moments add at the support.",
          },
          {
            title: "Tip deflection",
            tex: String.raw`\delta=\frac{wL^4}{8EI}+\frac{PL^3}{3EI}=${N((w * Math.pow(L, 4)) / (8 * EI), 5)}+${N((P * Math.pow(L, 3)) / (3 * EI), 5)}=${N(dTip, 4)}\ \text{m}`,
            note: `= ${N(dTip * 1000, 4)} mm, which is span/${N(L / dTip, 3)} — well past the usual L/360 serviceability limit.`,
          },
        ],
        viz: { L, w, P, Mfix, R, dTip },
      };
    },
  }),

  /* ---------------------------------------------------------------- 5 */
  str({
    id: "str-deflection",
    group: "Beams & Reactions",
    title: "Midspan Deflection Shortcuts",
    lede: "The card's deflection table — pick a load case, get the coefficient, and read the midspan deflection.",
    formula: String.raw`\delta_{mid}=\frac{5wL^4}{384EI}\times MF \qquad \delta_{mid}=\frac{PL^3}{48EI}\times MF`,
    pages: [46],
    keywords: ["deflection", "midspan", "table", "load case", "serviceability"],
    inputs: [
      { k: "case", label: "Load case", type: "select", def: "udl-ss",
        options: [
          { value: "udl-ss", label: "Simply supported — uniform load (1.0)" },
          { value: "udl-part", label: "Simply supported — partial uniform (0.50)" },
          { value: "tri-ss", label: "Simply supported — triangular (0.50)" },
          { value: "point-ss", label: "Simply supported — point load at midspan" },
          { value: "udl-fix", label: "Fixed-ended — uniform load (0.20)" },
          { value: "point-fix", label: "Fixed-ended — point load at midspan (0.25)" },
        ] },
      { k: "L", label: "Span", sym: "L", unit: "m", def: 7, step: 0.1 },
      { k: "w", label: "Uniform load", sym: "w", unit: "kN/m", def: 14, step: 0.5 },
      { k: "P", label: "Point load", sym: "P", unit: "kN", def: 60, step: 1 },
      { k: "E", label: "Modulus of elasticity", sym: "E", unit: "GPa", def: 200, step: 1 },
      { k: "I", label: "Moment of inertia", sym: "I", unit: "×10⁶ mm⁴", def: 120, step: 1 },
    ],
    run(v) {
      const { L, w, P, E } = v;
      const Im = v.I * 1e-6;
      const EI = E * 1e9 * Im;
      const dU = (5 * w * Math.pow(L, 4)) / (384 * EI);
      const dP = (P * Math.pow(L, 3)) / (48 * EI);
      const map = {
        "udl-ss": { d: dU * 1.0, label: "5wL⁴/384EI × 1.0" },
        "udl-part": { d: dU * 0.5, label: "5wL⁴/384EI × 0.50" },
        "tri-ss": { d: dU * 0.5, label: "5wL⁴/384EI × 0.50" },
        "point-ss": { d: dP, label: "PL³/48EI" },
        "udl-fix": { d: dU * 0.2, label: "5wL⁴/384EI × 0.20" },
        "point-fix": { d: dP * 0.25, label: "PL³/48EI × 0.25" },
      };
      const c = map[v.case];
      const allow360 = L / 360;

      return {
        results: [
          { label: "Midspan deflection", sym: "δ", value: c.d * 1000, unit: "mm", hero: true, digits: 4 },
          { label: "Deflection as L/n", sym: "L/n", value: `L/${fmt(L / c.d, 3)}` },
          { label: "Allowable L/360", value: allow360 * 1000, unit: "mm", digits: 4 },
          { label: "Status", value: c.d <= allow360 ? "Within L/360" : "Exceeds L/360",
            badge: c.d <= allow360 ? "OK" : "Check", badgeTone: c.d <= allow360 ? "ok" : "bad" },
          { label: "Flexural rigidity", sym: "EI", value: EI / 1000, unit: "MN·m²", digits: 4 },
        ],
        steps: [
          {
            title: "Reference values",
            tex: String.raw`\frac{5wL^4}{384EI}=${N(dU, 5)}\ \text{m} \qquad \frac{PL^3}{48EI}=${N(dP, 5)}\ \text{m}`,
            note: "These are the two base cases; every other row of the card's table is one of them times a multiplier.",
          },
          {
            title: "Apply the load-case multiplier",
            tex: String.raw`\delta_{mid}=${c.label}=${N(c.d, 5)}\ \text{m}=${N(c.d * 1000, 4)}\ \text{mm}`,
            note: "Fixed ends roughly quarter the deflection because the support rotation is restrained.",
          },
          {
            title: "Serviceability check",
            tex: String.raw`\frac{L}{360}=\frac{${N(L)}}{360}=${N(allow360 * 1000, 4)}\ \text{mm}\quad\text{vs}\quad\delta=${N(c.d * 1000, 4)}\ \text{mm}`,
          },
        ],
        viz: { L, w, P, d: c.d, case: v.case },
      };
    },
  }),

  /* ---------------------------------------------------------------- 6 */
  str({
    id: "str-determinacy",
    group: "Structural Analysis",
    title: "Stability & Determinacy",
    lede: "Is the structure stable, statically determinate, or indeterminate — and by how many degrees?",
    formula: String.raw`r-3n \quad\text{(beams)} \qquad m+r-2j \quad\text{(trusses)} \qquad 3m+r-(3j+s) \quad\text{(frames)}`,
    pages: [42],
    keywords: ["determinacy", "stability", "degree of indeterminacy", "truss", "frame", "releases"],
    inputs: [
      { k: "type", label: "Structure", type: "select", def: "truss",
        options: [{ value: "beam", label: "Beam" }, { value: "truss", label: "Truss" }, { value: "frame", label: "Frame" }] },
      { k: "m", label: "Number of members", sym: "m", unit: "", def: 9, step: 1 },
      { k: "r", label: "Number of reactions", sym: "r", unit: "", def: 3, step: 1 },
      { k: "j", label: "Number of joints", sym: "j", unit: "", def: 6, step: 1 },
      { k: "n", label: "Number of segments (beams)", sym: "n", unit: "", def: 1, step: 1 },
      { k: "s", label: "Number of releases", sym: "s", unit: "", def: 0, step: 1, hint: "hinge 1, roller 2, slider 1" },
    ],
    run(v) {
      const { m, r, j, n, s } = v;
      let DI, texLine, kind;
      if (v.type === "beam") {
        DI = r - 3 * n;
        texLine = String.raw`DI=r-3n=${N(r)}-3(${N(n)})=${N(DI)}`;
        kind = "beam";
      } else if (v.type === "truss") {
        DI = m + r - 2 * j;
        texLine = String.raw`DI=m+r-2j=${N(m)}+${N(r)}-2(${N(j)})=${N(DI)}`;
        kind = "truss";
      } else {
        DI = 3 * m + r - (3 * j + s);
        texLine = String.raw`DI=3m+r-(3j+s)=3(${N(m)})+${N(r)}-(3(${N(j)})+${N(s)})=${N(DI)}`;
        kind = "frame";
      }
      const state = DI === 0 ? "Statically determinate" : DI > 0 ? `Statically indeterminate to the ${DI}°` : "Unstable";

      return {
        results: [
          { label: "Degree of indeterminacy", sym: "DI", value: DI, hero: true,
            badge: state, badgeTone: DI === 0 ? "ok" : DI > 0 ? "warn" : "bad" },
          { label: "Classification", value: state },
          { label: kind === "truss" ? "m + r − 2j" : kind === "beam" ? "r − 3n" : "3m + r − (3j + s)", value: DI },
        ],
        steps: [
          {
            title: `Formula for a ${kind}`,
            tex: texLine,
          },
          {
            title: "Interpretation",
            tex: String.raw`DI=${N(DI)}\;\Rightarrow\;\text{${state}}`,
            note: "DI < 0 means the structure is a mechanism — it cannot carry general loading, even if it looks fine.",
          },
          {
            title: "Releases, per the card",
            tex: String.raw`\text{internal hinge}=1,\quad\text{internal roller}=2,\quad\text{internal fixed}=0,\quad\text{slider}=1`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 7 */
  str({
    id: "str-euler",
    group: "Columns",
    title: "Euler Buckling & Slenderness",
    lede: "Critical buckling load for a pin-ended or fixed column, and the slenderness ratio that decides whether it applies.",
    formula: String.raw`P_{cr}=\frac{\pi^2EI}{(kL)^2} \qquad \frac{KL}{r}`,
    pages: [54, 74],
    keywords: ["euler", "buckling", "column", "slenderness", "critical load", "effective length"],
    viz: "str:column",
    inputs: [
      { k: "E", label: "Modulus of elasticity", sym: "E", unit: "GPa", def: 200, step: 1 },
      { k: "I", label: "Moment of inertia (weak axis)", sym: "I", unit: "×10⁶ mm⁴", def: 25, step: 0.5 },
      { k: "L", label: "Unbraced length", sym: "L", unit: "m", def: 5, step: 0.1 },
      { k: "A", label: "Cross-sectional area", sym: "A", unit: "mm²", def: 5800, step: 10 },
      { k: "Fy", label: "Yield strength", sym: "F_y", unit: "MPa", def: 250, step: 5 },
      { k: "end", label: "End condition", type: "select", def: 1,
        options: [
          { value: 0.5, label: "Both ends fixed (k = 0.5)" },
          { value: 0.7, label: "One fixed, one hinged (k = 0.7)" },
          { value: 1.0, label: "Both ends hinged (k = 1.0)" },
          { value: 2.0, label: "One fixed, one free (k = 2.0)" },
        ] },
    ],
    run(v) {
      const { L, A, Fy } = v;
      const EPa = v.E * 1e9;
      const Im = v.I * 1e-6;
      const k = Number(v.end);
      const r = Math.sqrt(Im / (A * 1e-6));
      const KLr = (k * L) / r;
      const Pcr = (Math.PI ** 2 * EPa * Im) / Math.pow(k * L, 2);
      const sigmaCr = Pcr / (A * 1e-6);
      const Cc = Math.sqrt((2 * Math.PI ** 2 * EPa) / (Fy * 1e6));
      const isShort = KLr <= Cc;

      return {
        results: [
          { label: "Critical buckling load", sym: "P_cr", value: Pcr / 1000, unit: "kN", hero: true, digits: 5 },
          { label: "Slenderness ratio", sym: "KL/r", value: KLr, digits: 4 },
          { label: "Radius of gyration", sym: "r", value: r * 1000, unit: "mm", digits: 4 },
          { label: "Critical stress", sym: "σ_cr", value: sigmaCr / 1e6, unit: "MPa", digits: 4 },
          { label: "Transition slenderness", sym: "C_c", value: Cc, digits: 4, note: "√(2π²E/Fy)" },
          { label: "Column type", value: isShort ? "Short / intermediate" : "Long / slender",
            badge: isShort ? "Yielding governs" : "Buckling governs", badgeTone: isShort ? "warn" : "ok" },
        ],
        steps: [
          {
            title: "Radius of gyration",
            tex: String.raw`r=\sqrt{\frac{I}{A}}=\sqrt{\frac{${N(Im, 4)}\ \text{m}^4}{${N(A)} \times 10^{-6}\ \text{m}^2}}=${N(r, 4)}\ \text{m}`,
            note: "Always use the weak axis — a column buckles about the axis with the smallest r.",
          },
          {
            title: "Slenderness ratio",
            tex: String.raw`\frac{KL}{r}=\frac{(${N(k)})(${N(L)})}{${N(r, 4)}}=${N(KLr, 4)}`,
          },
          {
            title: "Critical load",
            tex: String.raw`P_{cr}=\frac{\pi^2EI}{(KL)^2}=\frac{\pi^2(${N(EPa, 3)})(${N(Im, 4)})}{\left[(${N(k)})(${N(L)})\right]^2}=${N(Pcr / 1000, 5)}\ \text{kN}`,
          },
          {
            title: "Which behaviour governs",
            tex: String.raw`C_c=\sqrt{\frac{2\pi^2E}{F_y}}=\sqrt{\frac{2\pi^2(${N(EPa, 3)})}{${N(Fy)} \times 10^6}}=${N(Cc, 4)}` +
              String.raw`\\[4pt] \frac{KL}{r}=${N(KLr, 4)}\ ${isShort ? "\\le" : ">"}\ C_c=${N(Cc, 4)}`,
            note: isShort ? "Below C_c the column yields before it buckles — use the parabolic allowable-stress formula." : "Above C_c it buckles elastically — Euler governs, and the allowable stress falls as 1/(KL/r)².",
          },
        ],
        viz: { k, L, Pcr: Pcr / 1000, KLr },
      };
    },
  }),

  /* ---------------------------------------------------------------- 8 */
  str({
    id: "str-steel-col",
    group: "Columns",
    title: "AISC Allowable Compressive Stress",
    lede: "The parabolic and Euler branches of the AISC allowable stress with the transition factor of safety.",
    formula: String.raw`F_a=\left[1-\frac{(KL/r)^2}{2C_c^2}\right]\frac{F_y}{FS} \qquad FS=\frac53+\frac{3(KL/r)}{8C_c}-\frac{(KL/r)^3}{8C_c^3}`,
    pages: [54],
    keywords: ["aisc", "allowable stress", "steel column", "fa", "factor of safety", "cc"],
    inputs: [
      { k: "Fy", label: "Yield strength", sym: "F_y", unit: "MPa", def: 250, step: 5 },
      { k: "E", label: "Modulus of elasticity", sym: "E", unit: "GPa", def: 200, step: 1 },
      { k: "KLr", label: "Slenderness ratio", sym: "KL/r", unit: "", def: 85, step: 1 },
      { k: "A", label: "Cross-sectional area", sym: "A", unit: "mm²", def: 5800, step: 10 },
    ],
    run(v) {
      const { Fy, E, KLr, A } = v;
      const Cc = Math.sqrt((2 * Math.PI ** 2 * E * 1000) / Fy);
      const short = KLr <= Cc;
      let Fa, FS;
      if (short) {
        FS = 5 / 3 + (3 * KLr) / (8 * Cc) - Math.pow(KLr, 3) / (8 * Math.pow(Cc, 3));
        Fa = (1 - (KLr * KLr) / (2 * Cc * Cc)) * (Fy / FS);
      } else {
        FS = 23 / 12;
        Fa = (12 * Math.PI ** 2 * E * 1000) / (23 * KLr * KLr);
      }
      const Pa = Fa * A;

      return {
        results: [
          { label: "Allowable compressive stress", sym: "F_a", value: Fa, unit: "MPa", hero: true, digits: 4 },
          { label: "Allowable axial load", sym: "P_a", value: Pa / 1000, unit: "kN", digits: 5 },
          { label: "Transition slenderness", sym: "C_c", value: Cc, digits: 4 },
          { label: "Factor of safety", sym: "FS", value: FS, digits: 4 },
          { label: "Branch", value: short ? "Short / intermediate (KL/r ≤ C_c)" : "Long (KL/r > C_c)",
            badge: short ? "Parabolic" : "Euler", badgeTone: short ? "warn" : "ok" },
        ],
        steps: [
          {
            title: "Transition slenderness",
            tex: String.raw`C_c=\sqrt{\frac{2\pi^2E}{F_y}}=\sqrt{\frac{2\pi^2(${N(E * 1000)})}{${N(Fy)}}}=${N(Cc, 4)}`,
          },
          short ? {
            title: "Short / intermediate column — parabolic formula",
            tex: String.raw`FS=\frac53+\frac{3(KL/r)}{8C_c}-\frac{(KL/r)^3}{8C_c^3}=${N(FS, 4)}` +
              String.raw`\\[4pt] F_a=\left[1-\frac{(KL/r)^2}{2C_c^2}\right]\frac{F_y}{FS}=${N(Fa, 4)}\ \text{MPa}`,
          } : {
            title: "Long column — Euler branch",
            tex: String.raw`F_a=\frac{12\pi^2E}{23(KL/r)^2}=\frac{12\pi^2(${N(E * 1000)})}{23(${N(KLr)})^2}=${N(Fa, 4)}\ \text{MPa}`,
            note: "FS = 23/12 ≈ 1.92 on the Euler load.",
          },
          {
            title: "Allowable axial load",
            tex: String.raw`P_a=F_aA=(${N(Fa, 4)})(${N(A)})=${N(Pa / 1000, 5)}\ \text{kN}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 9 */
  str({
    id: "str-steel-tension",
    group: "Steel Design",
    title: "Steel Tension Member — Yielding & Rupture",
    lede: "LRFD limit states for a tension member: gross yielding, net-section rupture, and the block-shear check.",
    formula: String.raw`\phi P_n=\phi F_yA_g \quad\text{or}\quad \phi F_uA_e`,
    pages: [58],
    keywords: ["steel", "tension", "yielding", "rupture", "block shear", "lrfd", "net area"],
    inputs: [
      { k: "Fy", label: "Yield strength", sym: "F_y", unit: "MPa", def: 250, step: 5 },
      { k: "Fu", label: "Ultimate strength", sym: "F_u", unit: "MPa", def: 400, step: 5 },
      { k: "Ag", label: "Gross area", sym: "A_g", unit: "mm²", def: 3200, step: 10 },
      { k: "An", label: "Net area", sym: "A_n", unit: "mm²", def: 2750, step: 10 },
      { k: "U", label: "Shear lag factor", sym: "U", unit: "", def: 0.9, step: 0.05 },
    ],
    run(v) {
      const { Fy, Fu, Ag, An, U } = v;
      const Ae = U * An;
      const Py = 0.9 * Fy * Ag;
      const Pr = 0.75 * Fu * Ae;
      const gov = Math.min(Py, Pr);

      return {
        results: [
          { label: "Design strength", sym: "φP_n", value: gov / 1000, unit: "kN", hero: true, digits: 5,
            badge: Py < Pr ? "Yielding governs" : "Rupture governs", badgeTone: "ok" },
          { label: "Gross yielding", sym: "0.90 F_y A_g", value: Py / 1000, unit: "kN", digits: 5 },
          { label: "Net rupture", sym: "0.75 F_u A_e", value: Pr / 1000, unit: "kN", digits: 5 },
          { label: "Effective net area", sym: "A_e", value: Ae, unit: "mm²", digits: 4 },
          { label: "Slenderness limit", sym: "KL/r", value: "≤ 300", note: "tension members, per the card" },
        ],
        steps: [
          {
            title: "Gross yielding on the full section",
            tex: String.raw`\phi P_n=\phi F_yA_g=(0.90)(${N(Fy)})(${N(Ag)})=${N(Py / 1000, 5)}\ \text{kN}`,
            note: "φ = 0.90, Ω = 1.67 in ASD.",
          },
          {
            title: "Rupture on the net section",
            tex: String.raw`A_e=UA_n=(${N(U)})(${N(An)})=${N(Ae, 4)}\ \text{mm}^2` +
              String.raw`\\[4pt] \phi P_n=(0.75)(${N(Fu)})(${N(Ae, 4)})=${N(Pr / 1000, 5)}\ \text{kN}`,
            note: "φ = 0.75, Ω = 2.00. U accounts for shear lag at the connection.",
          },
          {
            title: "Governing strength",
            tex: String.raw`\phi P_n=\min\left(${N(Py / 1000, 5)},\ ${N(Pr / 1000, 5)}\right)=${N(gov / 1000, 5)}\ \text{kN}`,
          },
          {
            title: "Net area with staggered holes",
            tex: String.raw`A_n=A_g-A_{holes}+\sum\frac{s^2t}{4g}`,
            note: "For a staggered bolt pattern, each diagonal gauge line adds s²t/4g back to the net area.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 10 */
  str({
    id: "str-concrete-mat",
    group: "Reinforced Concrete",
    title: "Concrete Properties & Balanced Steel Ratio",
    lede: "Modulus of elasticity, the β₁ stress-block factor, and the balanced and maximum reinforcement ratios.",
    formula: String.raw`E_c=4700\sqrt{f'_c} \qquad \beta_1=0.85-0.05\frac{f'_c-28}{7} \qquad \rho_{bal}=\frac{0.85f'_c\beta_1}{f_y}\frac{600}{600+f_y}`,
    pages: [62],
    keywords: ["concrete", "ec", "beta1", "rho bal", "rho max", "balanced", "aci"],
    inputs: [
      { k: "fc", label: "Concrete strength", sym: "f'_c", unit: "MPa", def: 28, step: 1 },
      { k: "fy", label: "Steel yield strength", sym: "f_y", unit: "MPa", def: 415, step: 5 },
      { k: "d1", label: "Depth to tension steel", sym: "d_1", unit: "mm", def: 540, step: 5 },
      { k: "d", label: "Effective depth", sym: "d", unit: "mm", def: 500, step: 5 },
    ],
    run(v) {
      const { fc, fy, d1, d } = v;
      const Ec = 4700 * Math.sqrt(fc);
      const beta1 = Math.max(0.65, 0.85 - 0.05 * (fc - 28) / 7);
      const rhoBal = (0.85 * fc * beta1) / fy * (600 / (600 + fy)) * (d1 / d);
      const cMax = (3 / 8) * d;
      const aMax = beta1 * cMax;
      const rhoMax = (0.85 * fc * aMax) / (fy * d);
      const fr = 0.62 * Math.sqrt(fc);

      return {
        results: [
          { label: "Modulus of elasticity", sym: "E_c", value: Ec, unit: "MPa", hero: true, digits: 5 },
          { label: "Stress-block factor", sym: "β₁", value: beta1, digits: 4 },
          { label: "Balanced steel ratio", sym: "ρ_bal", value: rhoBal, digits: 4 },
          { label: "Maximum steel ratio", sym: "ρ_max", value: rhoMax, digits: 4, note: "from c_max = 3d/8" },
          { label: "Modulus of rupture", sym: "f_r", value: fr, unit: "MPa", digits: 4, note: "f_r = 0.62λ√f'c" },
          { label: "c_max / a_max", value: `${fmt(cMax, 4)} / ${fmt(aMax, 4)} mm` },
        ],
        steps: [
          {
            title: "Modulus of elasticity",
            tex: String.raw`E_c=4700\sqrt{f'_c}=4700\sqrt{${N(fc)}}=${N(Ec, 5)}\ \text{MPa}`,
            note: "For 1500 ≤ w_c ≤ 2500 kg/m³ the card gives the general form E_c = w_c^1.5 × 0.043√f'c.",
          },
          {
            title: "Stress-block factor",
            tex: String.raw`\beta_1=0.85-0.05\frac{f'_c-28}{7}=0.85-0.05\frac{${N(fc)}-28}{7}=${N(0.85 - 0.05 * (fc - 28) / 7, 4)}` +
              String.raw`\\[4pt] \beta_1=${N(beta1, 4)}\quad(\ge 0.65)`,
          },
          {
            title: "Balanced steel ratio",
            tex: String.raw`\rho_{bal}=\frac{0.85f'_c\beta_1}{f_y}\left(\frac{600}{600+f_y}\right)\left(\frac{d_1}{d}\right)=${N(rhoBal, 4)}`,
            note: "Balanced means concrete crushing and steel yielding happen simultaneously.",
          },
          {
            title: "Maximum steel ratio",
            tex: String.raw`c_{max}=\frac{3}{8}d=${N(cMax, 4)}\ \text{mm},\quad a_{max}=\beta_1c_{max}=${N(aMax, 4)}\ \text{mm}` +
              String.raw`\\[4pt] \rho_{max}=\frac{0.85f'_c a_{max}}{f_y d}=${N(rhoMax, 4)}`,
            note: "The 3/8 factor comes from limiting the tensile strain to 0.005 — a tension-controlled section.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 11 */
  str({
    id: "str-rc-beam",
    group: "Reinforced Concrete",
    title: "Singly Reinforced Beam — Nominal Moment",
    lede: "The Whitney stress block, the nominal moment, and whether the section is tension-controlled.",
    formula: String.raw`a=\frac{A_sf_y}{0.85f'_cb} \qquad M_n=A_sf_y\left(d-\frac{a}{2}\right) \qquad M_u=\phi M_n`,
    pages: [62, 66],
    keywords: ["beam", "moment", "rc", "reinforced concrete", "stress block", "tension controlled", "mu"],
    viz: "str:section",
    inputs: [
      { k: "b", label: "Beam width", sym: "b", unit: "mm", def: 300, step: 10 },
      { k: "d", label: "Effective depth", sym: "d", unit: "mm", def: 500, step: 10 },
      { k: "As", label: "Area of tension steel", sym: "A_s", unit: "mm²", def: 1963, step: 10 },
      { k: "fc", label: "Concrete strength", sym: "f'_c", unit: "MPa", def: 28, step: 1 },
      { k: "fy", label: "Steel yield strength", sym: "f_y", unit: "MPa", def: 415, step: 5 },
      { k: "bar", label: "Bar diameter (for count)", sym: "d_b", unit: "mm", def: 25, step: 1 },
    ],
    run(v) {
      const { b, d, As, fc, fy } = v;
      const beta1 = Math.max(0.65, 0.85 - 0.05 * (fc - 28) / 7);
      const a = (As * fy) / (0.85 * fc * b);
      const c = a / beta1;
      const Mn = As * fy * (d - a / 2);        // N·mm
      const rho = As / (b * d);
      const rhoBal = (0.85 * fc * beta1) / fy * (600 / (600 + fy));
      const cMax = (3 / 8) * d;
      const tensionControlled = c <= cMax;

      const et = 0.003 * (d - c) / c;
      const phi = et >= 0.005 ? 0.90 : et <= 0.002 ? 0.65 : 0.65 + 0.25 * (et - 0.002) / 0.003;
      const Mu = phi * Mn;
      const Ab = (Math.PI * v.bar ** 2) / 4;

      return {
        results: [
          { label: "Nominal moment", sym: "M_n", value: Mn / 1e6, unit: "kN·m", hero: true, digits: 5 },
          { label: "Design moment", sym: "φM_n", value: Mu / 1e6, unit: "kN·m", digits: 5 },
          { label: "Depth of stress block", sym: "a", value: a, unit: "mm", digits: 4 },
          { label: "Neutral axis depth", sym: "c", value: c, unit: "mm", digits: 4 },
          { label: "Steel ratio", sym: "ρ", value: rho, digits: 4 },
          { label: "Balanced ratio", sym: "ρ_bal", value: rhoBal, digits: 4 },
          { label: "Tensile strain", sym: "ε_t", value: et, digits: 4 },
          { label: "φ factor", value: phi, digits: 3 },
          { label: "Bars required", value: As / Ab, digits: 3, note: `A_b = ${fmt(Ab, 4)} mm²` },
        ],
        steps: [
          {
            title: "Stress-block depth",
            tex: String.raw`a=\frac{A_sf_y}{0.85f'_cb}=\frac{(${N(As)})(${N(fy)})}{0.85(${N(fc)})(${N(b)})}=${N(a, 4)}\ \text{mm}`,
            note: "This is the depth over which the concrete is assumed to carry a uniform 0.85f'c.",
          },
          {
            title: "Neutral axis and strain check",
            tex: String.raw`c=\frac{a}{\beta_1}=\frac{${N(a, 4)}}{${N(beta1, 4)}}=${N(c, 4)}\ \text{mm}` +
              String.raw`\\[4pt] \varepsilon_t=0.003\frac{d-c}{c}=${N(et, 4)}`,
            note: tensionControlled
              ? "<b>Tension-controlled</b> (ε_t ≥ 0.005) — φ = 0.90, a ductile failure mode."
              : "<b>Compression-controlled or in transition</b> (ε_t < 0.005) — φ drops, and the section is over-reinforced for a beam.",
          },
          {
            title: "Nominal moment",
            tex: String.raw`M_n=A_sf_y\left(d-\frac{a}{2}\right)=(${N(As)})(${N(fy)})\left(${N(d)}-\frac{${N(a, 4)}}{2}\right)=${N(Mn / 1e6, 5)}\ \text{kN}\cdot\text{m}`,
          },
          {
            title: "Design strength",
            tex: String.raw`M_u=\phi M_n=(${N(phi, 3)})(${N(Mn / 1e6, 5)})=${N(Mu / 1e6, 5)}\ \text{kN}\cdot\text{m}`,
            note: "φ is 0.90 for tension-controlled sections and tapers to 0.65 at ε_t = 0.002.",
          },
          {
            title: "Reinforcement ratio check",
            tex: String.raw`\rho=\frac{A_s}{bd}=\frac{${N(As)}}{(${N(b)})(${N(d)})}=${N(rho, 4)}\quad\text{vs}\quad\rho_{bal}=${N(rhoBal, 4)}`,
          },
        ],
        viz: { b, d, As, a, c, fc, fy, phi, Mu: Mu / 1e6 },
      };
    },
  }),

  /* --------------------------------------------------------------- 12 */
  str({
    id: "str-rc-shear",
    group: "Reinforced Concrete",
    title: "Shear Reinforcement — Stirrup Spacing",
    lede: "How much of the shear the concrete carries, and how closely the stirrups must be spaced for the rest.",
    formula: String.raw`s=\frac{A_vf_{yt}d}{V_s} \qquad V_s=\frac{V_u}{\phi}-V_c`,
    pages: [70],
    keywords: ["shear", "stirrups", "spacing", "av", "vc", "concrete shear"],
    viz: "str:section",
    inputs: [
      { k: "b", label: "Beam width", sym: "b", unit: "mm", def: 300, step: 10 },
      { k: "d", label: "Effective depth", sym: "d", unit: "mm", def: 500, step: 10 },
      { k: "fc", label: "Concrete strength", sym: "f'_c", unit: "MPa", def: 28, step: 1 },
      { k: "fyt", label: "Stirrup yield strength", sym: "f_{yt}", unit: "MPa", def: 275, step: 5 },
      { k: "Vu", label: "Factored shear", sym: "V_u", unit: "kN", def: 180, step: 5 },
      { k: "legs", label: "Number of stirrup legs", sym: "", unit: "", def: 2, step: 1 },
      { k: "bar", label: "Stirrup bar diameter", sym: "", unit: "mm", def: 10, step: 1 },
      { k: "lambda", label: "λ (normal-weight = 1.0)", sym: "λ", unit: "", def: 1.0, step: 0.05 },
    ],
    run(v) {
      const { b, d, fc, fyt, Vu, legs, bar, lambda } = v;
      const phi = 0.75;
      const Av = legs * (Math.PI * bar * bar) / 4;
      const Vc = 0.17 * lambda * Math.sqrt(fc) * b * d / 1000;   // kN
      const VuN = Vu;
      const phiVc = phi * Vc;
      const Vs = Math.max(VuN / phi - Vc, 0);
      const s = Vs > 0 ? (Av * fyt * d) / (Vs * 1000) : Infinity;
      const sMax = Math.min(d / 2, 600);
      const AvMin1 = (0.062 * Math.sqrt(fc) * b) / fyt * 1;
      const AvMin2 = (0.35 * b) / fyt;
      const AvMin = Math.max(AvMin1, AvMin2);
      const VsMax = 0.66 * Math.sqrt(fc) * b * d / 1000;

      return {
        results: [
          { label: "Required stirrup spacing", sym: "s", value: s, unit: "mm", hero: true, digits: 4,
            badge: Vs > VsMax ? "Section too small" : "OK", badgeTone: Vs > VsMax ? "bad" : "ok" },
          { label: "Concrete shear", sym: "V_c", value: Vc, unit: "kN", digits: 4 },
          { label: "φV_c", value: phiVc, unit: "kN", digits: 4 },
          { label: "Shear to be carried by steel", sym: "V_s", value: Vs, unit: "kN", digits: 4 },
          { label: "Stirrup area (all legs)", sym: "A_v", value: Av, unit: "mm²", digits: 4 },
          { label: "Maximum spacing", sym: "s_max", value: sMax, unit: "mm", digits: 4 },
          { label: "Minimum A_v", sym: "A_v,min", value: AvMin, unit: "mm²/mm", digits: 4 },
          { label: "Upper limit on V_s", value: VsMax, unit: "kN", digits: 4 },
        ],
        steps: [
          {
            title: "Concrete shear strength",
            tex: String.raw`V_c=0.17\lambda\sqrt{f'_c}\,bd=(0.17)(${N(lambda)})\sqrt{${N(fc)}}(${N(b)})(${N(d)})=${N(Vc * 1000, 5)}\ \text{N}` +
              String.raw`\\[4pt] \phi V_c=${N(phiVc, 5)}\ \text{kN}`,
          },
          {
            title: "Shear the stirrups must carry",
            tex: String.raw`V_s=\frac{V_u}{\phi}-V_c=\frac{${N(Vu)}}{0.75}-${N(Vc, 4)}=${N(Vs, 4)}\ \text{kN}`,
            note: "Vu ≤ 0.5φVc means stirrups are not required at all; Vu ≤ φVc means only minimum stirrups are needed.",
          },
          {
            title: "Spacing",
            tex: String.raw`s=\frac{A_vf_{yt}d}{V_s}=\frac{(${N(Av, 4)})(${N(fyt)})(${N(d)})}{${N(Vs, 4)}\times10^3}=${N(s, 4)}\ \text{mm}`,
          },
          {
            title: "Governing spacing",
            tex: String.raw`s\le\min\left(\frac{d}{2},\ 600\right)=${N(sMax, 4)}\ \text{mm} \;\Rightarrow\; s=${N(Math.min(s, sMax), 4)}\ \text{mm}`,
          },
          {
            title: "Minimum shear reinforcement",
            tex: String.raw`A_{v,min}=\max\left(\frac{0.062\sqrt{f'_c}\,b}{f_{yt}},\ \frac{0.35b}{f_{yt}}\right)=${N(AvMin, 4)}\ \text{mm}^2\text{/mm}`,
            note: "Vs > 0.66√f'c·bw·d means the section is too small — increase the dimensions rather than the steel.",
          },
        ],
        viz: { b, d, As: Av, a: 0, c: d * 0.4, fc, fy: fyt, phi, stirrup: s },
      };
    },
  }),

  /* --------------------------------------------------------------- 13 */
  str({
    id: "str-tbeam",
    group: "Reinforced Concrete",
    title: "T-Beam Effective Flange Width",
    lede: "How much slab actually works with the web — the governing minimum of the three code limits.",
    formula: String.raw`b_f=\min\left(\frac{L}{4},\ b_w+16h_f,\ b_w+\frac{s_1+s_2}{2}\right)`,
    pages: [66],
    keywords: ["t-beam", "flange width", "effective width", "slab", "web"],
    inputs: [
      { k: "L", label: "Span", sym: "L", unit: "m", def: 7.5, step: 0.1 },
      { k: "bw", label: "Web width", sym: "b_w", unit: "mm", def: 300, step: 10 },
      { k: "hf", label: "Flange (slab) thickness", sym: "h_f", unit: "mm", def: 120, step: 5 },
      { k: "s1", label: "Clear span to the left", sym: "s_1", unit: "mm", def: 2400, step: 50 },
      { k: "s2", label: "Clear span to the right", sym: "s_2", unit: "mm", def: 2400, step: 50 },
    ],
    run(v) {
      const { L, bw, hf, s1, s2 } = v;
      const c1 = (L * 1000) / 4;
      const c2 = bw + 16 * hf;
      const c3 = bw + (s1 + s2) / 2;
      const bf = Math.min(c1, c2, c3);
      const gov = bf === c1 ? "L/4" : bf === c2 ? "b_w + 16h_f" : "b_w + (s₁+s₂)/2";

      return {
        results: [
          { label: "Effective flange width", sym: "b_f", value: bf, unit: "mm", hero: true, digits: 5, badge: gov, badgeTone: "ok" },
          { label: "L/4", value: c1, unit: "mm", digits: 5 },
          { label: "b_w + 16h_f", value: c2, unit: "mm", digits: 5 },
          { label: "b_w + (s₁+s₂)/2", value: c3, unit: "mm", digits: 5 },
          { label: "Flange width in metres", value: bf / 1000, unit: "m", digits: 4 },
        ],
        steps: [
          {
            title: "The three limits",
            tex: String.raw`\frac{L}{4}=${N(c1, 5)}\ \text{mm}\qquad b_w+16h_f=${N(c2, 5)}\ \text{mm}\qquad b_w+\frac{s_1+s_2}{2}=${N(c3, 5)}\ \text{mm}`,
            note: "The 2010 form uses L/4 and 16h_f; the 2015 form uses 8h_f and L_beam/4 — check which code your exam is on.",
          },
          {
            title: "Take the smallest",
            tex: String.raw`b_f=\min=${N(bf, 5)}\ \text{mm}\quad\text{(governed by }${gov}\text{)}`,
            note: "Flange width is a shear-lag allowance: the slab further from the web simply does not reach full stress.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 14 */
  str({
    id: "str-footing",
    group: "Foundations",
    title: "Isolated Footing — Sizing & Punching Shear",
    lede: "Required area from the allowable soil pressure, then the effective depth that survives two-way punching shear.",
    formula: String.raw`A=\frac{P}{q_a} \qquad V_u=q_{u(net)}\left[A-(c+d)^2\right] \qquad \phi V_c=\phi\,0.17\sqrt{f'_c}\,b_o d`,
    pages: [78],
    keywords: ["footing", "isolated", "punching shear", "one way shear", "bearing pressure", "effective depth"],
    viz: "str:footing",
    inputs: [
      { k: "P", label: "Service axial load", sym: "P", unit: "kN", def: 1200, step: 10 },
      { k: "Pu", label: "Factored axial load", sym: "P_u", unit: "kN", def: 1680, step: 10 },
      { k: "qa", label: "Allowable soil pressure", sym: "q_a", unit: "kPa", def: 200, step: 5 },
      { k: "fc", label: "Concrete strength", sym: "f'_c", unit: "MPa", def: 28, step: 1 },
      { k: "c", label: "Column size", sym: "c", unit: "mm", def: 400, step: 10 },
      { k: "h", label: "Assumed footing thickness", sym: "h", unit: "mm", def: 600, step: 10 },
      { k: "cc", label: "Concrete cover", sym: "cc", unit: "mm", def: 75, step: 5 },
      { k: "db", label: "Main bar diameter", sym: "d_b", unit: "mm", def: 20, step: 1 },
    ],
    run(v) {
      const { P, Pu, qa, fc, c, h, cc, db } = v;
      const A = P / qa;
      const B = Math.sqrt(A);
      const Bm = B;                              // square footing, in metres
      const qu = Pu / (Bm * Bm);                 // kPa, factored
      const dEff = h - cc - db / 2 - db;         // mm, two layers assumed

      // punching: solve Vu = phi*Vc for d
      let dReq = dEff;
      for (let i = 0; i < 200; i++) {
        const b0 = 4 * (c + dReq);
        const VuN = qu * (Bm * Bm * 1e6 - Math.pow(c + dReq, 2)) / 1e6;  // kN
        const phiVcN = 0.75 * 0.17 * Math.sqrt(fc) * b0 * dReq / 1000;    // kN
        if (phiVcN >= VuN) break;
        dReq += 5;
      }
      const b0 = 4 * (c + dEff);
      const VuPunch = qu * (Bm * Bm * 1e6 - Math.pow(c + dEff, 2)) / 1e6;
      const phiVc = 0.75 * 0.17 * Math.sqrt(fc) * b0 * dEff / 1000;
      const oneWayX = (Bm * 1000 / 2) - (c / 2) - dEff;
      const VuOne = qu * (oneWayX / 1000) * Bm;

      return {
        results: [
          { label: "Required footing area", sym: "A", value: A, unit: "m²", hero: true, digits: 4 },
          { label: "Square footing side", sym: "B", value: B, unit: "m", digits: 4, note: "round up in practice" },
          { label: "Net factored pressure", sym: "q_u", value: qu, unit: "kPa", digits: 4 },
          { label: "Effective depth", sym: "d", value: dEff, unit: "mm", digits: 4 },
          { label: "Depth needed for punching", value: dReq, unit: "mm", digits: 4,
            badge: dReq <= dEff ? "OK" : "Increase h", badgeTone: dReq <= dEff ? "ok" : "bad" },
          { label: "Punching shear demand", sym: "V_u", value: VuPunch, unit: "kN", digits: 4 },
          { label: "Punching capacity", sym: "φV_c", value: phiVc, unit: "kN", digits: 4 },
          { label: "One-way shear demand", value: VuOne, unit: "kN", digits: 4 },
        ],
        steps: [
          {
            title: "Size the footing from the allowable pressure",
            tex: String.raw`A=\frac{P}{q_a}=\frac{${N(P)}}{${N(qa)}}=${N(A, 4)}\ \text{m}^2 \;\Rightarrow\; B=\sqrt{A}=${N(B, 4)}\ \text{m}`,
            note: "Add the footing's own weight (about 10 %) when the soil pressure is tight.",
          },
          {
            title: "Net factored soil pressure",
            tex: String.raw`q_{u(net)}=\frac{P_u}{B^2}=\frac{${N(Pu)}}{(${N(Bm, 4)})^2}=${N(qu, 4)}\ \text{kPa}`,
          },
          {
            title: "Effective depth",
            tex: String.raw`d=h-cc-d_b-\frac{d_b}{2}=${N(h)}-${N(cc)}-${N(db)}-${N(db / 2)}=${N(dEff, 4)}\ \text{mm}`,
          },
          {
            title: "Punching (two-way) shear",
            tex: String.raw`b_o=4(c+d)=4(${N(c)}+${N(dEff, 4)})=${N(b0, 5)}\ \text{mm}` +
              String.raw`\\[4pt] V_u=q_{u(net)}\left[B^2-(c+d)^2\right]=${N(VuPunch, 5)}\ \text{kN}` +
              String.raw`\\[4pt] \phi V_c=\phi\,0.17\sqrt{f'_c}\,b_od=${N(phiVc, 5)}\ \text{kN}`,
            note: dReq <= dEff
              ? "Capacity exceeds demand — the assumed thickness works."
              : "Capacity is short of demand — thicken the footing or enlarge the column.",
          },
          {
            title: "One-way (wide-beam) shear",
            tex: String.raw`V_u=q_{u(net)}\left(\frac{B-c}{2}-d\right)B=${N(VuOne, 5)}\ \text{kN}`,
            note: "Check this separately — punching often governs, but a wide footing can fail in one-way shear first.",
          },
        ],
        viz: { B: Bm, c, h, d: dEff, qu, Pu },
      };
    },
  }),

  /* --------------------------------------------------------------- 15 */
  str({
    id: "str-pilecap",
    group: "Foundations",
    title: "Pile Cap Reactions",
    lede: "Elastic distribution of an eccentric column load over a pile group.",
    formula: String.raw`R=\frac{P}{n}\pm\frac{M_yx}{\Sigma x^2}\pm\frac{M_xy}{\Sigma y^2}`,
    pages: [82],
    keywords: ["pile cap", "pile group", "reaction", "eccentric", "moment"],
    viz: "str:pilecap",
    inputs: [
      { k: "P", label: "Column load", sym: "P", unit: "kN", def: 3600, step: 50 },
      { k: "n", label: "Number of piles", sym: "n", unit: "", def: 6, step: 1 },
      { k: "Mx", label: "Moment about x-axis", sym: "M_x", unit: "kN·m", def: 180, step: 10 },
      { k: "My", label: "Moment about y-axis", sym: "M_y", unit: "kN·m", def: 240, step: 10 },
      { k: "sx", label: "Pile spacing (x)", sym: "s_x", unit: "m", def: 1.2, step: 0.05 },
      { k: "sy", label: "Pile spacing (y)", sym: "s_y", unit: "m", def: 1.2, step: 0.05 },
      { k: "rows", label: "Rows in the y-direction", sym: "", unit: "", def: 2, step: 1 },
      { k: "cols", label: "Columns in the x-direction", sym: "", unit: "", def: 3, step: 1 },
    ],
    run(v) {
      const { P, n, Mx, My, sx, sy, rows, cols } = v;
      // coordinates symmetric about the centroid
      const xs = [], ys = [];
      for (let i = 0; i < cols; i++) xs.push((i - (cols - 1) / 2) * sx);
      for (let j = 0; j < rows; j++) ys.push((j - (rows - 1) / 2) * sy);
      const Sx2 = xs.reduce((a, x) => a + n / cols * x * x, 0) * 1; // sum over all piles
      const Sy2 = ys.reduce((a, y) => a + n / rows * y * y, 0) * 1;

      const xMax = Math.max(...xs.map(Math.abs));
      const yMax = Math.max(...ys.map(Math.abs));
      const Rmax = P / n + (My * xMax) / Sx2 + (Mx * yMax) / Sy2;
      const Rmin = P / n - (My * xMax) / Sx2 - (Mx * yMax) / Sy2;

      return {
        results: [
          { label: "Maximum pile reaction", sym: "R_max", value: Rmax, unit: "kN", hero: true, digits: 5,
            badge: Rmin < 0 ? "Uplift in some piles" : "All in compression",
            badgeTone: Rmin < 0 ? "bad" : "ok" },
          { label: "Minimum pile reaction", sym: "R_min", value: Rmin, unit: "kN", digits: 5 },
          { label: "Average reaction", sym: "P/n", value: P / n, unit: "kN", digits: 5 },
          { label: "Σx²", value: Sx2, unit: "m²", digits: 4 },
          { label: "Σy²", value: Sy2, unit: "m²", digits: 4 },
        ],
        steps: [
          {
            title: "Pile coordinates and second moments",
            tex: String.raw`\Sigma x^2=${N(Sx2, 4)}\ \text{m}^2 \qquad \Sigma y^2=${N(Sy2, 4)}\ \text{m}^2`,
            note: `Outer piles sit at x = ±${N(xMax, 3)} m and y = ±${N(yMax, 3)} m from the centroid.`,
          },
          {
            title: "Maximum reaction — the corner pile",
            tex: String.raw`R=\frac{P}{n}+\frac{M_yx}{\Sigma x^2}+\frac{M_xy}{\Sigma y^2}=\frac{${N(P)}}{${N(n)}}+\frac{(${N(My)})(${N(xMax, 3)})}{${N(Sx2, 4)}}+\frac{(${N(Mx)})(${N(yMax, 3)})}{${N(Sy2, 4)}}=${N(Rmax, 5)}\ \text{kN}`,
          },
          {
            title: "Minimum reaction",
            tex: String.raw`R_{min}=${N(Rmin, 5)}\ \text{kN}`,
            note: Rmin < 0
              ? "Negative means uplift — the pile would go into tension, which most driven piles cannot take. Increase spacing or reduce the eccentricity."
              : "All piles remain in compression, so the group is fully effective.",
          },
        ],
        viz: { P, n, Mx, My, sx, sy, rows, cols, Rmax, Rmin },
      };
    },
  }),

  /* --------------------------------------------------------------- 16 */
  str({
    id: "str-impact",
    group: "Structural Analysis",
    title: "Impact Factor & Sudden Loading",
    lede: "The dynamic amplification from a dropped weight, and the two special cases the card flags.",
    formula: String.raw`\delta_i=\delta_{st}\left(1+\sqrt{1+\frac{2h}{\delta_{st}}}\right)`,
    pages: [42],
    keywords: ["impact", "dynamic", "sudden load", "drop", "amplification"],
    inputs: [
      { k: "h", label: "Height of fall", sym: "h", unit: "mm", def: 150, step: 5 },
      { k: "P", label: "Weight dropped", sym: "P", unit: "kN", def: 12, step: 0.5 },
      { k: "L", label: "Length of the member", sym: "L", unit: "m", def: 3, step: 0.1 },
      { k: "A", label: "Cross-sectional area", sym: "A", unit: "mm²", def: 1200, step: 10 },
      { k: "E", label: "Modulus of elasticity", sym: "E", unit: "GPa", def: 200, step: 1 },
    ],
    run(v) {
      const { h, P, L, A, E } = v;
      const dst = (P * 1000 * L) / (A * 1e-6 * E * 1e9);   // m
      const hM = h / 1000;
      const di = dst * (1 + Math.sqrt(1 + (2 * hM) / dst));
      const sigmaSt = (P * 1000) / A;
      const sigmaI = sigmaSt * (di / dst);
      const factor = di / dst;

      return {
        results: [
          { label: "Impact deflection", sym: "δ_i", value: di * 1000, unit: "mm", hero: true, digits: 4 },
          { label: "Impact factor", sym: "", value: factor, digits: 4 },
          { label: "Static deflection", sym: "δ_st", value: dst * 1000, unit: "mm", digits: 4 },
          { label: "Impact stress", sym: "σ_i", value: sigmaI, unit: "MPa", digits: 4 },
          { label: "Static stress", sym: "σ_st", value: sigmaSt, unit: "MPa", digits: 4 },
        ],
        steps: [
          {
            title: "Static deflection under the same weight",
            tex: String.raw`\delta_{st}=\frac{PL}{AE}=\frac{(${N(P)}\times10^3)(${N(L)})}{${N(A)}(${N(E * 1000)})}=${N(dst, 5)}\ \text{m}`,
          },
          {
            title: "Impact deflection",
            tex: String.raw`\delta_i=\delta_{st}\left(1+\sqrt{1+\frac{2h}{\delta_{st}}}\right)=${N(dst, 5)}\left(1+\sqrt{1+\frac{2(${N(hM, 4)})}{${N(dst, 5)}}}\right)=${N(di, 5)}\ \text{m}`,
            note: "Equating the lost potential energy to the strain energy gives this — it is a square root, not a straight multiplication.",
          },
          {
            title: "Stress amplification",
            tex: String.raw`\sigma_i=\sigma_{st}\frac{\delta_i}{\delta_{st}}=(${N(sigmaSt, 4)})(${N(factor, 4)})=${N(sigmaI, 4)}\ \text{MPa}`,
            note: "h = 0 (sudden load) gives a factor of 2 — the card's P = W/2 note for self-weight is the same effect in reverse.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 17 */
  str({
    id: "str-belt",
    group: "Engineering Mechanics",
    title: "Belt Friction",
    lede: "Tension ratio across a pulley — the exponential that makes a capstan work.",
    formula: String.raw`\frac{T_1}{T_2}=e^{\mu\beta}`,
    pages: [38],
    keywords: ["belt", "friction", "pulley", "capstan", "tension ratio"],
    viz: "str:belt",
    inputs: [
      { k: "T2", label: "Slack-side tension", sym: "T_2", unit: "kN", def: 2.5, step: 0.1 },
      { k: "mu", label: "Coefficient of friction", sym: "μ", unit: "", def: 0.3, step: 0.01 },
      { k: "turns", label: "Number of turns over the pulley", sym: "n", unit: "", def: 0.5, step: 0.25, hint: "0.5 = half wrap, 1 = full wrap" },
    ],
    run(v) {
      const { T2, mu, turns } = v;
      const beta = 2 * Math.PI * turns;
      const ratio = Math.exp(mu * beta);
      const T1 = T2 * ratio;
      const cap = (T1 - T2) * turns * 0;  // placeholder
      return {
        results: [
          { label: "Tight-side tension", sym: "T_1", value: T1, unit: "kN", hero: true, digits: 5 },
          { label: "Tension ratio", sym: "T₁/T₂", value: ratio, digits: 4 },
          { label: "Wrap angle", sym: "β", value: beta, unit: "rad", digits: 4 },
          { label: "Wrap angle", value: turns * 360, unit: "°", digits: 4 },
          { label: "Transmissible force", sym: "T₁ − T₂", value: T1 - T2, unit: "kN", digits: 4 },
        ],
        steps: [
          {
            title: "Wrap angle in radians",
            tex: String.raw`\beta=2\pi n=2\pi(${N(turns)})=${N(beta, 4)}\ \text{rad}`,
            note: "Half a turn = π rad, one full turn = 2π rad — the card's table of β for 90°, 180° and 360°.",
          },
          {
            title: "Belt friction equation",
            tex: String.raw`\frac{T_1}{T_2}=e^{\mu\beta}=e^{(${N(mu)})(${N(beta, 4)})}=${N(ratio, 4)}`,
          },
          {
            title: "Tight-side tension",
            tex: String.raw`T_1=T_2e^{\mu\beta}=(${N(T2)})(${N(ratio, 4)})=${N(T1, 5)}\ \text{kN}`,
            note: "T₁ > T₂ always, and T₁ is the side being pulled — the card's direction note.",
          },
        ],
        viz: { mu, turns, T1, T2, ratio },
      };
    },
  }),
];
