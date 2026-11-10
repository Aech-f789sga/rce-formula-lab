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

/* ========================================================================== */
function chip(text) {
  const el = document.createElement("span");
  el.className = "chip";
  el.textContent = text;
  return el;
}
