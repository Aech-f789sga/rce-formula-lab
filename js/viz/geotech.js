/* ==========================================================================
   viz/geotech.js — 2.5D models for the geotechnical section
   ========================================================================== */

import {
  THREE, PALETTE, prism, box, cylinder, face, polyline, dashed,
  arrow, dimLine, part, slab, shade,
} from "./scene.js";

const T = (n, d = 2) => Number(n).toFixed(d);

/* ==========================================================================
   Soil phase diagram — three stacked phases, drawn to scale
   ========================================================================== */
export function phase(api, d) {
  const g = new THREE.Group();
  const Vs = 1;
  const Vw = Math.max(d.Vw, 0.001);
  const Va = Math.max(d.Va, 0.001);
  const Vv = Vw + Va;
  const H = Vs + Vv;
  const W = 1.35;
  const DEPTH = 1.5;

  const ySolidTop = Vs;
  const yWaterTop = Vs + Vw;

  const layers = [
    { y0: 0, y1: ySolidTop, color: PALETTE.soil, cap: shade(PALETTE.soil, 1.12), name: "SOLID" },
    { y0: ySolidTop, y1: yWaterTop, color: PALETTE.water, cap: shade(PALETTE.water, 1.15), name: "WATER" },
    { y0: yWaterTop, y1: H, color: PALETTE.air, cap: 0xf4f2ea, name: "AIR" },
  ];

  layers.forEach((L) => {
    if (L.y1 - L.y0 < 1e-3) return;
    const m = prism(
      [[-W / 2, L.y0], [W / 2, L.y0], [W / 2, L.y1], [-W / 2, L.y1]],
      DEPTH,
      { color: L.color, capColor: L.cap, opacity: L.name === "AIR" ? 0.55 : 1 }
    );
    part(g, m, { opacity: 0.5 });
  });

  // outer frame
  g.add(polyline([
    [-W / 2, 0, DEPTH / 2], [W / 2, 0, DEPTH / 2], [W / 2, H, DEPTH / 2], [-W / 2, H, DEPTH / 2], [-W / 2, 0, DEPTH / 2],
  ], { color: 0x2b2b24, opacity: 0.85 }));

  // phase labels, on the front face
  const zf = DEPTH / 2 + 0.01;
  if (Vw > 0.06) api.label("WATER", new THREE.Vector3(0, (Vs + yWaterTop) / 2, zf), { style: "opacity:.9" });
  if (Va > 0.06) api.label("AIR", new THREE.Vector3(0, (yWaterTop + H) / 2, zf), { style: "opacity:.9" });
  api.label("SOLID", new THREE.Vector3(0, Vs / 2, zf), { style: "opacity:.9" });

  // dimension lines on the right
  const xd = W / 2 + 0.28;
  g.add(dimLine([xd, 0, 0], [xd, Vs, 0], { tick: 0.07 }));
  g.add(dimLine([xd, Vs, 0], [xd, yWaterTop, 0], { tick: 0.07 }));
  g.add(dimLine([xd, yWaterTop, 0], [xd, H, 0], { tick: 0.07 }));

  api.label(`V_s = 1.00`, new THREE.Vector3(xd + 0.55, Vs / 2, 0));
  api.label(`V_w = ${T(Vw)}`, new THREE.Vector3(xd + 0.55, (Vs + yWaterTop) / 2, 0));
  api.label(`V_a = ${T(Va)}`, new THREE.Vector3(xd + 0.55, (yWaterTop + H) / 2, 0));

  // left-hand key values
  const xl = -W / 2 - 0.95;
  api.label(`e = ${T(d.e, 3)}`, new THREE.Vector3(xl, H * 0.86, 0), { style: "background:#eef6ec" });
  api.label(`n = ${T(d.n, 3)}`, new THREE.Vector3(xl, H * 0.66, 0));
  api.label(`S = ${T(d.S * 100, 1)}%`, new THREE.Vector3(xl, H * 0.46, 0), { style: "background:#eaf0f8" });
  api.label(`γ = ${T(d.g, 4)}`, new THREE.Vector3(xl, H * 0.26, 0));
  api.label(`γ_d = ${T(d.gd, 4)}`, new THREE.Vector3(xl, H * 0.10, 0));

  // total height dimension on the left of the block
  g.add(dimLine([-W / 2 - 0.14, 0, 0], [-W / 2 - 0.14, H, 0], { tick: 0.06, color: 0x8c8c80 }));

  api.add(g);
  api.hud && api.hud.appendChild(chip(`V = ${T(H, 3)} (per unit V_s)`));
}

/* ==========================================================================
   Stress profile — layered soil, water table, and the three stresses
   ========================================================================== */
export function stress(api, d) {
  const g = new THREE.Group();
  const { H1, H2, z, PT, Pw, PE } = d;
  const Htot = H1 + H2;
  const W = 2.6;
  const D = 2.0;

  // dry layer
  part(g, prism([[-W / 2, 0], [W / 2, 0], [W / 2, -H1], [-W / 2, -H1]], D,
    { color: PALETTE.sand, capColor: shade(PALETTE.sand, 1.1) }), { opacity: 0.5 });

  // saturated layer
  part(g, prism([[-W / 2, -H1], [W / 2, -H1], [W / 2, -Htot], [-W / 2, -Htot]], D,
    { color: PALETTE.soil, capColor: shade(PALETTE.soil, 1.12) }), { opacity: 0.5 });

  // water table
  g.add(dashed([[-W / 2 - 0.25, -H1, D / 2], [W / 2 + 0.25, -H1, D / 2]], { color: PALETTE.waterDark, dashSize: 0.12 }));
  api.label("▽ water table", new THREE.Vector3(W / 2 + 0.75, -H1 - 0.05, D / 2), { style: "background:#eaf0f8" });

  // ground surface
  g.add(polyline([[-W / 2 - 0.25, 0, D / 2], [W / 2 + 0.25, 0, D / 2]], { color: 0x2b2b24 }));

  // depth marker
  const xm = W / 2 + 0.55;
  g.add(dimLine([xm, 0, 0], [xm, -z, 0], { tick: 0.08, color: PALETTE.accent }));
  api.label(`z = ${T(z)} m`, new THREE.Vector3(xm + 0.5, -z * 0.55, 0), { style: "background:#eef6ec" });

  // stress profiles to the left, scaled to the largest value
  const maxS = Math.max(PT, 1e-6);
  const sx = -W / 2 - 0.45;
  const scale = 1.7 / maxS;

  const prof = (val, color, name, zOff, yLab) => {
    const w = val * scale;
    const pts = [[sx, 0, zOff], [sx, -z, zOff], [sx - w, -z, zOff], [sx, 0, zOff]];
    g.add(face(pts, { color, opacity: 0.16 }));
    g.add(polyline(pts, { color }));
    api.label(`${name} ${T(val, 1)}`, new THREE.Vector3(sx - w - 0.5, yLab, zOff), { style: "background:#fff" });
  };
  prof(PT, 0xb3261e, "σ", -0.3, -z * 0.98);
  prof(PE, 0x2f7d32, "σ′", 0, -z * 0.74);
  if (Pw > 0.01) prof(Pw, 0x0d47a1, "u", 0.3, -z * 0.5);

  // horizontal depth ticks
  for (let i = 1; i <= 4; i++) {
    const yy = (-z * i) / 4;
    g.add(dashed([[sx, yy, 0], [sx - 0.12, yy, 0]], { color: 0x8c8c80, dashSize: 0.04, gapSize: 0.04 }));
  }

  api.add(g);
  api.hud && api.hud.appendChild(chip(`σ_v ${T(PT, 1)} · u ${T(Pw, 1)} · σ′ ${T(PE, 1)} kPa`));
}

/* ==========================================================================
   Footing with Terzaghi failure wedge
   ========================================================================== */
export function footing(api, d) {
  const g = new THREE.Group();
  const { B, Df, phi } = d;
  const L = d.L || B;
  const s = Math.max(B, L);
  const W = 3.2 * s;
  const D = 2.4 * s;

  // soil block (cut away at the front so the wedge shows)
  const soil = prism(
    [[-W / 2, 0], [W / 2, 0], [W / 2, -Df * 1.6], [-W / 2, -Df * 1.6]],
    D,
    { color: PALETTE.sand, capColor: shade(PALETTE.sand, 1.1), opacity: 0.5 }
  );
  part(g, soil, { opacity: 0.4 });

  // ground line
  g.add(polyline([[-W / 2 - 0.3, 0, D / 2], [W / 2 + 0.3, 0, D / 2]], { color: 0x2b2b24 }));

  // footing
  const ft = box(B, 0.35 * s, L, { color: PALETTE.concrete, position: [0, -0.175 * s, 0] });
  part(g, ft, { opacity: 0.6 });

  // column
  const col = box(B * 0.4, 1.4 * s, L * 0.4, { color: PALETTE.concreteDark, position: [0, 0.7 * s, 0] });
  part(g, col, { opacity: 0.6 });

  // failure wedge (Rankine passive wedges + central elastic zone)
  const yBase = -0.35 * s;
  const p = (phi * Math.PI) / 180;
  const wedgeW = (B / 2) * Math.tan(Math.PI / 4 + p / 2);
  const wedgePts = [
    [-B / 2, yBase], [B / 2, yBase],
    [B / 2 + wedgeW, yBase - wedgeW], [B / 2, yBase - 1.9 * wedgeW],
    [-B / 2, yBase - 1.9 * wedgeW], [-B / 2 - wedgeW, yBase - wedgeW],
  ];
  const wedge = face(wedgePts, { color: PALETTE.warn, opacity: 0.18, position: [0, 0, 0] });
  g.add(wedge);
  g.add(polyline([...wedgePts, wedgePts[0]].map(([x, y]) => [x, y, 0.01]), { color: PALETTE.warn, opacity: 0.9 }));
  // slip lines
  g.add(dashed([[0, yBase, 0.01], [0, yBase - 1.9 * wedgeW, 0.01]], { color: PALETTE.warn, dashSize: 0.1 }));

  api.label(`B = ${T(B)} m`, new THREE.Vector3(0, yBase - 0.12, D / 2 + 0.05), { style: "background:#fdf4dd" });
  api.label(`φ = ${T(phi, 0)}°`, new THREE.Vector3(B / 2 + wedgeW + 0.5, yBase - wedgeW, 0.02), { style: "background:#fdf4dd" });
  api.label(`D_f = ${T(Df)} m`, new THREE.Vector3(-W / 2 - 0.05, -Df / 2, D / 2), { style: "background:#fff" });

  const xd = W / 2 + 0.35;
  g.add(dimLine([xd, 0, 0], [xd, -Df, 0], { tick: 0.07 }));

  api.add(g);
  api.hud && api.hud.appendChild(chip(`failure wedge at ${T(phi, 0)}°`));
}

/* ==========================================================================
   Retaining wall + pressure diagram
   ========================================================================== */
export function wall(api, d) {
  const g = new THREE.Group();
  const { H, pa, pq } = d;
  const tTop = Math.max(H * 0.14, 0.25);
  const tBot = Math.max(H * 0.24, 0.38);
  const D = 1.5;
  const bw = H * 0.75;          // backfill wedge width

  // backfill — deliberately faint so the wall reads as the subject
  const back = prism(
    [[0, 0], [bw, 0], [0, H]],
    D,
    { color: PALETTE.sand, capColor: shade(PALETTE.sand, 1.06), opacity: 0.3 }
  );
  part(g, back, { opacity: 0.12 });

  // hatch lines in the backfill
  for (let i = 1; i < 7; i++) {
    const t = i / 7;
    g.add(polyline([[bw * t * 0.55, 0, D / 2], [bw * t * 0.15, H * (1 - t) * 0.9, D / 2]], {
      color: 0x9a9689, opacity: 0.4,
    }));
  }

  // wall section
  const wallMesh = prism(
    [[-tBot, 0], [0, 0], [0, H], [-tTop, H]],
    D,
    { color: PALETTE.concrete, capColor: shade(PALETTE.concrete, 1.12) }
  );
  part(g, wallMesh, { opacity: 0.6 });

  // pressure diagram on the wall's back face
  const scale = 1.25 / Math.max(pa + (pq || 0), 1e-6);
  const xb = 0.03;
  const zf = D / 2 + 0.02;
  const pts = [[xb, 0], [xb + pa * scale, 0], [xb, H], [xb, 0]];
  g.add(face(pts, { color: PALETTE.accent3, opacity: 0.3, position: [0, 0, zf] }));
  g.add(polyline(pts.map(([x, y]) => [x, y, zf]), { color: PALETTE.accent3 }));

  const n = 6;
  for (let i = 0; i <= n; i++) {
    const y = (i / n) * H;
    const p = (y / H) * pa + (pq || 0);
    g.add(arrow([xb + p * scale, y, zf], [xb + 0.02, y, zf], {
      color: PALETTE.accent3, headLen: 0.09, headR: 0.03, shaftR: 0.008,
    }));
  }

  // thrust resultant at H/3
  const yR = H / 3;
  g.add(arrow([xb + pa * scale + 0.85, yR, zf], [xb + pa * scale + 0.12, yR, zf], {
    color: PALETTE.accent2, headLen: 0.16, headR: 0.055, shaftR: 0.018,
  }));
  api.label("P_a", new THREE.Vector3(xb + pa * scale + 1.05, yR + 0.12, zf), { style: "background:#fceaf1;color:#8c1245" });

  api.label(`p_a = ${T(pa, 1)} kPa`, new THREE.Vector3(xb + pa * scale * 0.55, 0.18, zf), { style: "background:#e9eff9" });
  api.label(`H = ${T(H)} m`, new THREE.Vector3(-tBot - 0.45, H * 0.5, zf), { style: "background:#fff" });
  api.label("backfill", new THREE.Vector3(bw * 0.42, H * 0.16, D / 2), { style: "opacity:.85" });

  g.add(dimLine([-tBot - 0.25, 0, 0], [-tBot - 0.25, H, 0], { tick: 0.08 }));

  api.add(g);
  api.hud && api.hud.appendChild(chip(`thrust acts at H/3 · k_a governs`));
}

/* ==========================================================================
   Infinite slope with trial failure plane
   ========================================================================== */
export function slope(api, d) {
  const g = new THREE.Group();
  const { beta, H, phi, FS, seep } = d;
  const b = (beta * Math.PI) / 180;
  const D = 3.0;
  const run = H / Math.tan(b);

  // slope body
  const body = prism(
    [[-run * 0.25, 0], [run * 0.75, H], [run * 1.5, H], [run * 1.5, 0]],
    D,
    { color: PALETTE.soil, capColor: shade(PALETTE.soil, 1.1) }
  );
  part(g, body, { opacity: 0.45 });

  // slope face
  g.add(polyline([[-run * 0.25, 0, D / 2], [run * 0.75, H, D / 2]], { color: 0x2b2b24 }));

  // trial failure plane at theta = (beta+phi)/2
  const theta = ((beta + phi) / 2) * (Math.PI / 180);
  const x0 = -run * 0.25;
  const x1 = x0 + (H / Math.tan(theta));
  g.add(polyline([[x0, 0, D / 2 + 0.01], [x1, H, D / 2 + 0.01]], { color: PALETTE.bad, opacity: 0.9 }));
  api.label(`θ_cr = ${T(theta * 180 / Math.PI, 1)}°`, new THREE.Vector3((x0 + x1) / 2 - 0.1, H * 0.55, D / 2 + 0.06), { style: "background:#fdecec;color:#a3231c" });

  // seepage arrows
  if (seep) {
    for (let i = 0; i < 5; i++) {
      const xx = -run * 0.1 + i * 0.45;
      const yy = H * 0.15 + i * 0.05;
      g.add(arrow([xx, yy, D / 2 - 0.2], [xx + 0.34, yy - 0.34 * Math.tan(b), D / 2 - 0.2], {
        color: PALETTE.waterDark, headLen: 0.1, headR: 0.035, shaftR: 0.012,
      }));
    }
    api.label("seepage ∥ slope", new THREE.Vector3(-run * 0.05, H * 0.42, D / 2), { style: "background:#eaf0f8" });
  }

  api.label(`β = ${T(beta)}°`, new THREE.Vector3(-run * 0.15, 0.22, D / 2), { style: "background:#fceaf1" });
  api.label(`H = ${T(H)} m`, new THREE.Vector3(run * 1.42, H * 0.5, D / 2), { style: "background:#fff" });
  api.label(`FS = ${T(FS, 2)}`, new THREE.Vector3(run * 0.45, H + 0.4, 0), {
    style: FS >= 1.5 ? "background:#e9f5ea;color:#1e6b23" : "background:#fdecec;color:#b3261e",
  });

  // water table hint
  g.add(dashed([[-run * 0.3, H * 0.15, D / 2], [run * 1.55, H * 0.15, D / 2]], {
    color: PALETTE.waterDark, dashSize: 0.14, opacity: 0.6,
  }));

  api.add(g);
  api.hud && api.hud.appendChild(chip(`β ${T(beta, 0)}° · φ ${T(phi, 0)}°`));
}

/* ==========================================================================
   Consistency states — where SL, PL, LL and the natural w fall
   ========================================================================== */
export function consistency(api, d) {
  const g = new THREE.Group();
  const SL = d.SL ?? 15, PL = d.PL ?? 25, LL = d.LL ?? 50, w = d.w ?? 32;
  const lo = Math.min(SL, w) - 8;
  const hi = Math.max(LL, w) + 8;
  const W = 4.6, H = 0.9;

  const X = (v) => -W / 2 + ((v - lo) / (hi - lo)) * W;

  // the four states as bands
  const bands = [
    { a: lo, b: SL, c: 0xb9b6ab, name: "solid" },
    { a: SL, b: PL, c: 0xd6bd8e, name: "semi-solid" },
    { a: PL, b: LL, c: 0xb08d63, name: "plastic" },
    { a: LL, b: hi, c: 0x7fa9c9, name: "liquid" },
  ];
  bands.forEach((b) => {
    const x0 = X(b.a), x1 = X(b.b);
    const m = prism([[x0, 0], [x1, 0], [x1, H], [x0, H]], 0.5, { color: b.c, capColor: shade(b.c, 1.08) });
    part(g, m, { opacity: 0.3 });
    api.label(b.name, new THREE.Vector3((x0 + x1) / 2, H / 2, 0.26), { style: "background:rgba(255,255,255,.85)" });
  });

  // limit markers
  const mark = (v, name, color, up) => {
    const x = X(v);
    g.add(polyline([[x, -0.1, 0.26], [x, H + 0.1, 0.26]], { color }));
    api.label(`${name} ${T(v, 1)}`, new THREE.Vector3(x, up ? H + 0.34 : -0.34, 0.26), { style: "background:#fff" });
  };
  mark(SL, "SL", PALETTE.accent3, false);
  mark(PL, "PL", PALETTE.accent3, true);
  mark(LL, "LL", PALETTE.accent2, true);

  // natural water content
  const xw = X(w);
  g.add(arrow([xw, -0.55, 0.26], [xw, -0.06, 0.26], { color: PALETTE.bad, headLen: 0.14, headR: 0.05, shaftR: 0.016 }));
  api.label(`w = ${T(w, 1)}`, new THREE.Vector3(xw, -0.8, 0.26), { style: "background:#fdecec" });

  // PI bracket
  g.add(dimLine([X(PL), H + 0.62, 0.26], [X(LL), H + 0.62, 0.26], { tick: 0.07, color: PALETTE.accent }));
  api.label(`PI = ${T(LL - PL, 1)}`, new THREE.Vector3((X(PL) + X(LL)) / 2, H + 0.86, 0.26), {
    style: "background:#eef6ec",
  });

  api.legend([
    { color: "#b9b6ab", label: "solid" },
    { color: "#d6bd8e", label: "semi-solid" },
    { color: "#b08d63", label: "plastic" },
    { color: "#7fa9c9", label: "liquid" },
    { color: "#c0392b", label: "natural w" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`LI = ${T((w - PL) / (LL - PL), 2)}`));
}

/* ==========================================================================
   Gradation curve — semi-log, through the D-values that define it
   ========================================================================== */
export function gradation(api, d) {
  const g = new THREE.Group();
  // each Dxx value *is* a point on the curve: D60 = 60 % passing, etc.
  const known = [
    [d.D10, 10, "D₁₀"], [d.D20, 20, "D₂₀"], [d.D25, 25, "D₂₅"],
    [d.D30, 30, "D₃₀"], [d.D50, 50, "D₅₀"], [d.D60, 60, "D₆₀"], [d.D75, 75, "D₇₅"],
  ].filter(([v]) => v > 0).sort((a, b) => a[0] - b[0]);

  if (known.length < 2) return;
  const lx = (v) => Math.log10(v);
  const xmin = lx(known[0][0]) - 0.35;
  const xmax = lx(known[known.length - 1][0]) + 0.35;
  const W = 4.4, H = 2.6;

  const X = (v) => -W / 2 + ((lx(v) - xmin) / (xmax - xmin)) * W;
  const Y = (p) => -H / 2 + (p / 100) * H;

  // axes
  g.add(polyline([[-W / 2, -H / 2, 0], [W / 2, -H / 2, 0]], { color: 0x2b2b24, opacity: 0.8 }));
  g.add(polyline([[-W / 2, -H / 2, 0], [-W / 2, H / 2, 0]], { color: 0x2b2b24, opacity: 0.8 }));

  // decade grid + labels
  for (let e = Math.floor(xmin); e <= Math.ceil(xmax); e++) {
    for (const m of [1, 2, 5]) {
      const v = m * Math.pow(10, e);
      const l = lx(v);
      if (l < xmin || l > xmax) continue;
      g.add(dashed([[X(v), -H / 2, 0], [X(v), H / 2, 0]], { color: 0xcfcabb, dashSize: 0.05, gapSize: 0.05 }));
      if (m === 1) api.label(`${v < 1 ? v.toFixed(2) : v}`, new THREE.Vector3(X(v), -H / 2 - 0.26, 0), { style: "background:#fff" });
    }
  }
  for (const p of [0, 25, 50, 75, 100]) {
    g.add(polyline([[-W / 2 - 0.08, Y(p), 0], [-W / 2, Y(p), 0]], { color: 0x2b2b24 }));
    api.label(`${p}`, new THREE.Vector3(-W / 2 - 0.32, Y(p), 0), { style: "background:#fff" });
  }

  // curve
  const pts = known.map(([v, p]) => [X(v), Y(p), 0]);
  g.add(polyline(pts, { color: PALETTE.accent, opacity: 0.9 }));
  known.forEach(([v, p, name]) => {
    const dot = cylinder(0.045, 0.045, 0.04, { color: PALETTE.accent2, segments: 14, position: [X(v), Y(p), 0.01] });
    dot.rotation.x = Math.PI / 2;
    g.add(dot);
    api.label(name, new THREE.Vector3(X(v) + 0.02, Y(p) + 0.2, 0), { style: "background:#fceaf1" });
  });

  api.label("% passing", new THREE.Vector3(-W / 2 + 0.3, H / 2 + 0.34, 0), { style: "background:#fff" });
  api.label("grain size, mm (log scale)", new THREE.Vector3(W / 2 - 0.85, -H / 2 - 0.72, 0), { style: "background:#fff" });

  api.legend([
    { color: "#2f7d32", label: "gradation curve" },
    { color: "#c2185b", label: "D-values from the card" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`C_u ${T(d.D60 / d.D10, 3)} · C_c ${T((d.D30 ** 2) / (d.D60 * d.D10), 3)}`));
}

/* ==========================================================================
   Compaction curve with the field point and the line of optimums
   ========================================================================== */
export function proctor(api, d) {
  const g = new THREE.Group();
  const gmax = d.gmax ?? 19;
  const gmin = d.gmin ?? 15;
  const gf = d.gfield ?? 18;
  const wopt = 13;
  const W = 4.2, H = 2.4;

  const wMin = 5, wMax = 24;
  const yMin = Math.min(gmin * 0.94, gf * 0.94);
  const yMax = gmax * 1.06;

  const X = (w) => -W / 2 + ((w - wMin) / (wMax - wMin)) * W;
  const Y = (v) => -H / 2 + ((v - yMin) / (yMax - yMin)) * H;

  // axes
  g.add(polyline([[-W / 2, -H / 2, 0], [W / 2, -H / 2, 0]], { color: 0x2b2b24, opacity: 0.8 }));
  g.add(polyline([[-W / 2, -H / 2, 0], [-W / 2, H / 2, 0]], { color: 0x2b2b24, opacity: 0.8 }));

  // compaction curve
  const curve = [];
  for (let i = 0; i <= 60; i++) {
    const w = wMin + ((wMax - wMin) * i) / 60;
    const v = gmax - 0.032 * Math.pow(w - wopt, 2);
    if (v < yMin) continue;
    curve.push([X(w), Y(v), 0]);
  }
  g.add(face([[-W / 2, -H / 2], ...curve, [W / 2, -H / 2]], { color: PALETTE.accent, opacity: 0.1 }));
  g.add(polyline(curve, { color: PALETTE.accent }));

  // peak
  const pk = cylinder(0.055, 0.055, 0.05, { color: PALETTE.accent, segments: 16, position: [X(wopt), Y(gmax), 0.01] });
  pk.rotation.x = Math.PI / 2;
  g.add(pk);
  g.add(dashed([[X(wopt), -H / 2, 0], [X(wopt), Y(gmax), 0]], { color: PALETTE.accent, dashSize: 0.07 }));
  api.label(`γ_d(max) = ${T(gmax, 3)}`, new THREE.Vector3(X(wopt) + 0.1, Y(gmax) + 0.24, 0), { style: "background:#eef6ec" });
  api.label(`w_opt ≈ ${T(wopt, 1)}%`, new THREE.Vector3(X(wopt), -H / 2 - 0.22, 0), { style: "background:#fff" });

  // field point + relative compaction line
  g.add(dashed([[-W / 2, Y(gf), 0], [X(wMax - 3), Y(gf), 0]], { color: PALETTE.accent3, dashSize: 0.08 }));
  const fp = cylinder(0.06, 0.06, 0.05, { color: PALETTE.bad, segments: 16, position: [X(wMax - 4), Y(gf), 0.01] });
  fp.rotation.x = Math.PI / 2;
  g.add(fp);
  api.label(`field γ_d = ${T(gf, 3)}`, new THREE.Vector3(X(wMax - 6.5), Y(gf) + 0.22, 0), { style: "background:#fdecec" });
  api.label(`R = ${T((gf / gmax) * 100, 1)}%`, new THREE.Vector3(X(wMax - 6.5), Y(gf) - 0.24, 0), { style: "background:#e9eff9" });

  api.label("water content %", new THREE.Vector3(W / 2 - 0.85, -H / 2 - 0.34, 0), { style: "background:#fff" });
  api.label("γ_d", new THREE.Vector3(-W / 2 + 0.18, H / 2 - 0.16, 0), { style: "background:#fff" });
  for (const wv of [5, 10, 15, 20]) {
    api.label(String(wv), new THREE.Vector3(X(wv), -H / 2 - 0.2, 0), { style: "background:#fff" });
  }

  api.legend([
    { color: "#2f7d32", label: "compaction curve" },
    { color: "#c0392b", label: "field point" },
    { color: "#0d47a1", label: "R = γd / γd(max)" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`R = ${T((gf / gmax) * 100, 1)} %`));
}

/* ==========================================================================
   Flow curve — water content against blows, liquid limit at 25
   ========================================================================== */
export function flowcurve(api, d) {
  const g = new THREE.Group();
  const w1 = d.w1 ?? 50, N1 = d.N1 ?? 18, w2 = d.w2 ?? 44, N2 = d.N2 ?? 32;
  const W = 4.2, H = 2.4;
  const lx = (n) => Math.log10(n);
  const nMin = Math.min(N1, N2, 25) * 0.5;
  const nMax = Math.max(N1, N2, 25) * 2;
  const wMin = Math.min(w1, w2) - 6;
  const wMax = Math.max(w1, w2) + 6;

  const X = (n) => -W / 2 + ((lx(n) - lx(nMin)) / (lx(nMax) - lx(nMin))) * W;
  const Y = (w) => -H / 2 + ((w - wMin) / (wMax - wMin)) * H;

  g.add(polyline([[-W / 2, -H / 2, 0], [W / 2, -H / 2, 0]], { color: 0x2b2b24, opacity: 0.8 }));
  g.add(polyline([[-W / 2, -H / 2, 0], [-W / 2, H / 2, 0]], { color: 0x2b2b24, opacity: 0.8 }));

  for (const n of [10, 15, 20, 25, 30, 40, 50]) {
    if (n < nMin || n > nMax) continue;
    g.add(dashed([[X(n), -H / 2, 0], [X(n), H / 2, 0]], { color: 0xcfcabb, dashSize: 0.05, gapSize: 0.05 }));
    api.label(String(n), new THREE.Vector3(X(n), -H / 2 - 0.2, 0), { style: "background:#fff" });
  }

  // flow line
  g.add(polyline([[X(N1), Y(w1), 0], [X(N2), Y(w2), 0]], { color: PALETTE.accent2 }));

  // extrapolate to 25 blows
  const FI = (w1 - w2) / Math.log10(N2 / N1);
  const LL = w1 + FI * Math.log10(25 / N1);
  g.add(dashed([[X(25), -H / 2, 0], [X(25), Y(LL), 0]], { color: PALETTE.accent3, dashSize: 0.07 }));

  const mk = (n, w, c, label, dy) => {
    const dot = cylinder(0.05, 0.05, 0.05, { color: c, segments: 14, position: [X(n), Y(w), 0.01] });
    dot.rotation.x = Math.PI / 2;
    g.add(dot);
    api.label(label, new THREE.Vector3(X(n), Y(w) + dy, 0), { style: "background:#fff" });
  };
  mk(N1, w1, PALETTE.accent2, `(${T(N1, 0)}, ${T(w1, 1)}%)`, 0.22);
  mk(N2, w2, PALETTE.accent2, `(${T(N2, 0)}, ${T(w2, 1)}%)`, -0.26);
  mk(25, LL, PALETTE.accent, `LL = ${T(LL, 1)}%`, 0.24);

  api.label("blows, N (log)", new THREE.Vector3(W / 2 - 0.7, -H / 2 - 0.45, 0), { style: "background:#fff" });
  api.label("w %", new THREE.Vector3(-W / 2 + 0.35, H / 2 + 0.2, 0), { style: "background:#fff" });

  api.legend([
    { color: "#c2185b", label: "flow line" },
    { color: "#2f7d32", label: "liquid limit at 25 blows" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`FI = ${T(FI, 3)}`));
}

/* ==========================================================================
   Layered strata — flow parallel vs perpendicular
   ========================================================================== */
export function strata(api, d) {
  const g = new THREE.Group();
  const layers = [
    { h: d.h1, k: d.k1 },
    { h: d.h2, k: d.k2 },
    { h: d.h3, k: d.k3 },
  ].filter((l) => l.h > 0);
  const H = layers.reduce((a, l) => a + l.h, 0);
  const k = 2.4 / H;
  const W = 2.6, D = 1.6;

  let y = 0;
  const cols = [PALETTE.sand, PALETTE.soil, PALETTE.soilDark];
  layers.forEach((l, i) => {
    const hh = l.h * k;
    const m = prism([[-W / 2, y], [W / 2, y], [W / 2, y - hh], [-W / 2, y - hh]], D,
      { color: cols[i % cols.length] });
    part(g, m, { opacity: 0.45 });
    api.label(`h${i + 1} = ${T(l.h, 2)} m · k = ${T(l.k, 6)}`, new THREE.Vector3(W / 2 + 0.55, y - hh / 2, D / 2), {
      style: "background:#fff",
    });
    y -= hh;
  });

  // parallel flow arrows (along the bedding)
  for (let i = 0; i < layers.length; i++) {
    const yy = -((layers.slice(0, i).reduce((a, l) => a + l.h, 0) + layers[i].h / 2) * k);
    g.add(arrow([-W / 2 + 0.1, yy, D / 2 + 0.01], [W / 2 - 0.1, yy, D / 2 + 0.01], {
      color: PALETTE.accent, headLen: 0.16, headR: 0.055, shaftR: 0.018,
    }));
  }
  api.label("flow ∥ layers", new THREE.Vector3(0, 0.28, D / 2), { style: "background:#eef6ec" });

  api.legend([
    { color: "#2f7d32", label: "flow parallel (k∥ = Σkh/H)" },
    { color: "#b08d63", label: "soil layers" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`H = ${T(H, 2)} m`));
}

/* ==========================================================================
   Flow net under a sheet pile
   ========================================================================== */
export function flownet(api, d) {
  const g = new THREE.Group();
  const Nf = Math.max(2, Math.round(d.Nf || 4));
  const Nd = Math.max(4, Math.round(d.Nd || 12));
  const W = 4.0, H = 2.6;

  // ground line and sheet pile
  g.add(polyline([[-W / 2, 0, 0], [W / 2, 0, 0]], { color: 0x2b2b24 }));
  g.add(polyline([[0, 0.1, 0], [0, -1.5, 0]], { color: PALETTE.steelDark }));

  // upstream / downstream water levels
  g.add(polyline([[-W / 2, 0.55, 0], [0, 0.55, 0]], { color: PALETTE.waterDark }));
  g.add(polyline([[0, 0.1, 0], [W / 2, 0.1, 0]], { color: PALETTE.waterDark }));
  api.label("upstream", new THREE.Vector3(-W / 2 + 0.55, 0.72, 0), { style: "background:#eaf0f8" });
  api.label("downstream", new THREE.Vector3(W / 2 - 0.6, 0.26, 0), { style: "background:#eaf0f8" });

  // flow lines: quarter-ellipses sweeping under the pile
  for (let i = 1; i <= Nf; i++) {
    const t = i / (Nf + 1);
    const pts = [];
    for (let j = 0; j <= 40; j++) {
      const a = (j / 40) * Math.PI;
      const rx = 0.55 + t * 1.25;
      const ry = 0.55 + t * 0.85;
      pts.push([-Math.cos(a) * rx, 0.05 - Math.sin(a) * ry, 0]);
    }
    g.add(polyline(pts, { color: PALETTE.accent3, opacity: 0.75 }));
  }

  // equipotential drops
  for (let i = 1; i < Nd; i++) {
    const t = i / Nd;
    const x = -1.35 + 2.7 * t;
    const depth = 1.35 * Math.sin(Math.PI * t) + 0.12;
    g.add(polyline([[x, 0.05, 0], [x * 0.55, 0.05 - depth, 0]], { color: PALETTE.accent2, opacity: 0.45 }));
  }

  api.label(`${Nf} flow channels`, new THREE.Vector3(-1.5, -1.75, 0), { style: "background:#e9eff9" });
  api.label(`${Nd} drops`, new THREE.Vector3(1.4, -1.75, 0), { style: "background:#fceaf1" });

  api.legend([
    { color: "#0d47a1", label: "flow lines" },
    { color: "#c2185b", label: "equipotential lines" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`Q = kH·Nf/Nd`));
}

/* ==========================================================================
   e–log p curve — normally consolidated vs over-consolidated
   ========================================================================== */
export function elogp(api, d) {
  const g = new THREE.Group();
  const Cc = d.Cc ?? 0.3, e0 = d.e0 ?? 0.9, P0 = d.P0 ?? 100, Pc = d.Pc ?? 0, dP = d.dP ?? 50;
  const Cs = Cc / 5;
  const W = 4.2, H = 2.4;
  const pMin = Math.max(2, P0 / 3);
  const pMax = (P0 + dP) * 2.5;
  const lx = (p) => Math.log10(p);

  const eMax = e0 + 0.1, eMin = e0 - 0.22;
  const X = (p) => -W / 2 + ((lx(p) - lx(pMin)) / (lx(pMax) - lx(pMin))) * W;
  const Y = (e) => -H / 2 + ((e - eMin) / (eMax - eMin)) * H;

  g.add(polyline([[-W / 2, -H / 2, 0], [W / 2, -H / 2, 0]], { color: 0x2b2b24, opacity: 0.8 }));
  g.add(polyline([[-W / 2, -H / 2, 0], [-W / 2, H / 2, 0]], { color: 0x2b2b24, opacity: 0.8 }));

  const eAt = (p) => {
    if (Pc > P0 && p <= Pc) return e0 - Cs * lx(p / P0);
    const eC = Pc > P0 ? e0 - Cs * lx(Pc / P0) : e0;
    return eC - Cc * lx(p / (Pc > P0 ? Pc : P0));
  };

  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const p = pMin * Math.pow(pMax / pMin, i / 80);
    pts.push([X(p), Y(eAt(p)), 0]);
  }
  g.add(polyline(pts, { color: PALETTE.accent }));

  const mk = (p, e, c, label, dy) => {
    const dot = cylinder(0.045, 0.045, 0.04, { color: c, segments: 14, position: [X(p), Y(e), 0.01] });
    dot.rotation.x = Math.PI / 2;
    g.add(dot);
    if (label) api.label(label, new THREE.Vector3(X(p), Y(e) + dy, 0), { style: "background:#fff" });
  };
  mk(P0, eAt(P0), PALETTE.bad, `P₀ = ${T(P0, 0)}`, -0.3);
  if (Pc > P0) mk(Pc, eAt(Pc), PALETTE.accent2, `P_c = ${T(Pc, 0)}`, 0.3);
  mk(P0 + dP, eAt(P0 + dP), PALETTE.accent3, `P₀+ΔP = ${T(P0 + dP, 0)}`, -0.3);

  api.label("void ratio e", new THREE.Vector3(-W / 2 + 0.45, H / 2 - 0.12, 0), { style: "background:#fff" });
  api.label("pressure, kPa (log)", new THREE.Vector3(W / 2 - 0.9, -H / 2 - 0.34, 0), { style: "background:#fff" });

  api.legend([
    { color: "#2f7d32", label: "e–log p curve" },
    { color: "#c0392b", label: "P₀ / P_c" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(Pc > P0 ? "over-consolidated" : "normally consolidated"));
}

/* ==========================================================================
   Pile — skin friction along the shaft, tip resistance at the base
   ========================================================================== */
export function pile(api, d) {
  const g = new THREE.Group();
  const Dp = d.D ?? 0.4;
  const L = d.L ?? 12;
  const k = 2.6 / Math.max(L, 4);
  const dia = Math.max(Dp * k, 0.12);
  const depth = L * k;

  // soil block
  part(g, prism([[-1.5, 0], [1.5, 0], [1.5, -depth], [-1.5, -depth]], 1.4,
    { color: PALETTE.soil, opacity: 0.5 }), { opacity: 0.3 });
  g.add(polyline([[-1.5, 0, 0.71], [1.5, 0, 0.71]], { color: 0x2b2b24 }));

  // pile
  const pl = cylinder(dia / 2, dia / 2, depth + 0.3, {
    color: PALETTE.concrete, segments: 24, position: [0, -depth / 2 + 0.15, 0],
  });
  part(g, pl, { opacity: 0.5 });

  // skin friction arrows along the shaft
  for (let i = 1; i <= 5; i++) {
    const y = -(depth * i) / 6;
    g.add(arrow([dia / 2 + 0.34, y, 0], [dia / 2 + 0.04, y, 0], {
      color: PALETTE.accent3, headLen: 0.1, headR: 0.035, shaftR: 0.011,
    }));
    g.add(arrow([-dia / 2 - 0.34, y, 0], [-dia / 2 - 0.04, y, 0], {
      color: PALETTE.accent3, headLen: 0.1, headR: 0.035, shaftR: 0.011,
    }));
  }
  api.label("skin friction Q_f", new THREE.Vector3(0.95, -depth * 0.45, 0), { style: "background:#e9eff9" });

  // tip resistance
  g.add(arrow([0, -depth - 0.55, 0], [0, -depth - 0.06, 0], {
    color: PALETTE.bad, headLen: 0.16, headR: 0.06, shaftR: 0.02,
  }));
  api.label("tip Q_tip", new THREE.Vector3(0.55, -depth - 0.45, 0), { style: "background:#fdecec" });

  // load
  g.add(arrow([0, 0.9, 0], [0, 0.18, 0], { color: PALETTE.accent, headLen: 0.16, headR: 0.06, shaftR: 0.02 }));
  api.label(`Q_u`, new THREE.Vector3(0.5, 0.8, 0), { style: "background:#eef6ec" });

  api.legend([
    { color: "#0d47a1", label: "shaft friction" },
    { color: "#c0392b", label: "tip resistance" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`D ${T(Dp, 2)} m · L ${T(L, 1)} m`));
}

/* ========================================================================== */
function chip(text) {
  const el = document.createElement("span");
  el.className = "chip";
  el.textContent = text;
  return el;
}
