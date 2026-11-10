/* ==========================================================================
   viz/math.js — 2.5D / 2D models for math, surveying and transportation
   ========================================================================== */

import {
  THREE, PALETTE, prism, box, cylinder, face, polyline, dashed,
  arrow, dimLine, part, shade,
} from "./scene.js";

const T = (n, d = 2) => Number(n).toFixed(d);

/* ==========================================================================
   Analytic geometry — line between two points
   ========================================================================== */
export function line(api, d) {
  const g = new THREE.Group();
  const { x1, y1, x2, y2 } = d;
  const spanX = Math.max(Math.abs(x1), Math.abs(x2), 1) * 2.4;
  const spanY = Math.max(Math.abs(y1), Math.abs(y2), 1) * 2.4;

  // axes
  g.add(polyline([[-spanX, 0, 0], [spanX, 0, 0]], { color: 0x2b2b24, opacity: 0.85 }));
  g.add(polyline([[0, -spanY, 0], [0, spanY, 0]], { color: 0x2b2b24, opacity: 0.85 }));
  api.label("x", new THREE.Vector3(spanX - 0.15, -0.35, 0), { style: "opacity:.75" });
  api.label("y", new THREE.Vector3(0.35, spanY - 0.1, 0), { style: "opacity:.75" });

  // the line, extended
  const m = (y2 - y1) / (x2 - x1 || 1e-9);
  const ext = spanX * 0.9;
  const yA = y1 + m * (-ext - x1);
  const yB = y1 + m * (ext - x1);
  g.add(polyline([[-ext, yA, 0], [ext, yB, 0]], { color: PALETTE.accent2, opacity: 0.9 }));

  // the segment
  g.add(polyline([[x1, y1, 0], [x2, y2, 0]], { color: PALETTE.accent3 }));

  // points
  const dot = (x, y, color) => {
    const c = cylinder(0.075, 0.075, 0.07, { color, segments: 20, position: [x, y, 0] });
    c.rotation.x = Math.PI / 2;
    return c;
  };
  g.add(dot(x1, y1, PALETTE.accent));
  g.add(dot(x2, y2, PALETTE.accent));

  // rise/run triangle
  g.add(dashed([[x1, y1, 0], [x2, y1, 0], [x2, y2, 0]], { color: 0x8c8c80, dashSize: 0.1 }));

  api.label(`(${T(x1, 2)}, ${T(y1, 2)})`, new THREE.Vector3(x1 - 0.55, y1 - 0.3, 0), { style: "background:#eef6ec" });
  api.label(`(${T(x2, 2)}, ${T(y2, 2)})`, new THREE.Vector3(x2 + 0.6, y2 + 0.28, 0), { style: "background:#eef6ec" });
  api.label(`d = ${T(Math.hypot(x2 - x1, y2 - y1), 3)}`, new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2 + 0.35, 0), {
    style: "background:#e9eff9",
  });
  api.label(`m = ${T(m, 3)}`, new THREE.Vector3(ext * 0.6, yB * 0.7 + 0.2, 0), { style: "background:#fceaf1" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`rise / run · θ = ${T((Math.atan(m) * 180) / Math.PI, 1)}°`));
}

/* ==========================================================================
   Symmetrical vertical curve
   ========================================================================== */
export function vcurve(api, d) {
  const g = new THREE.Group();
  const { g1, g2, L, A, H } = d;
  const SPAN = 4.4;
  const s = SPAN / L;
  const yScale = 10;                       // vertical exaggeration, so a 3 % grade reads
  const x0 = -SPAN / 2;

  const g1d = g1 / 100, g2d = g2 / 100, Ad = A / 100;
  // elevation of the tangent (grade line) at distance u from the PVC
  const tangent = (u) => (u <= L / 2 ? g1d * u : g1d * (L / 2) + g2d * (u - L / 2));
  const elev = (u) => tangent(u) + (Ad * u * (L - u)) / (2 * L);
  const toY = (m) => m * yScale * s;

  // the curve
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const u = (L * i) / 60;
    pts.push([x0 + (SPAN * i) / 60, toY(elev(u)), 0]);
  }
  g.add(polyline(pts, { color: PALETTE.accent2 }));

  // the two tangents, meeting at the PVI
  const yPVI = toY(g1d * (L / 2));
  const yPVT = toY(g1d * (L / 2) + g2d * (L / 2));
  g.add(dashed([[x0, 0, 0], [0, yPVI, 0]], { color: 0x8c8c80, dashSize: 0.12 }));
  g.add(dashed([[0, yPVI, 0], [SPAN / 2, yPVT, 0]], { color: 0x8c8c80, dashSize: 0.12 }));

  // PVC / PVI / PVT
  const mark = (x, y, color) => cylinder(0.055, 0.055, 0.06, { color, segments: 16, position: [x, y, 0] });
  g.add(mark(x0, 0, PALETTE.accent3));
  g.add(mark(0, yPVI, PALETTE.accent3));
  g.add(mark(SPAN / 2, yPVT, PALETTE.accent3));

  api.label("PVC", new THREE.Vector3(x0 - 0.45, 0.02, 0), { style: "background:#e9eff9" });
  api.label("PVI", new THREE.Vector3(0, yPVI + 0.3, 0), { style: "background:#e9eff9" });
  api.label("PVT", new THREE.Vector3(SPAN / 2 + 0.45, yPVT, 0), { style: "background:#e9eff9" });

  // mid-ordinate: curve to grade intersection at mid-length
  const yMidCurve = toY(elev(L / 2));
  const yMidTan = yPVI;
  g.add(dashed([[0, yMidCurve, 0], [0, yMidTan, 0]], { color: PALETTE.accent, dashSize: 0.06 }));
  api.label(`H = ${T(H, 2)} m`, new THREE.Vector3(0.62, (yMidCurve + yMidTan) / 2, 0), { style: "background:#eef6ec" });

  api.label(`g₁ = ${T(g1, 2)}%`, new THREE.Vector3(x0 + 0.55, toY(elev(L * 0.12)) - 0.3, 0), { style: "background:#fff" });
  api.label(`g₂ = ${T(g2, 2)}%`, new THREE.Vector3(SPAN / 2 - 0.75, toY(elev(L * 0.86)) - 0.3, 0), { style: "background:#fff" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(A < 0 ? "crest curve" : "sag curve"));
}

/* ==========================================================================
   Horizontal curve — plan view
   ========================================================================== */
export function hcurve(api, d) {
  const g = new THREE.Group();
  const { R, I, T: Tt, Lc } = d;
  const s = 2.2 / Math.max(Tt, 1);
  const r = R * s;
  const th = (I * Math.PI) / 180;

  // PI at the origin, back tangent along −x, curve centre at (−T, r)
  const pcX = -Tt * s;
  const ptX = pcX + r * Math.sin(th);
  const ptZ = r - r * Math.cos(th);
  const cx = pcX;
  const cz = r;

  // tangents
  g.add(polyline([[pcX - 0.9, 0, 0], [0.15, 0, 0]], { color: 0x2b2b24, opacity: 0.65 }));
  const dirX = Math.cos(th), dirZ = Math.sin(th);
  g.add(polyline([[0, 0, 0], [ptX + 0.9 * dirX, 0, ptZ + 0.9 * dirZ]], { color: 0x2b2b24, opacity: 0.65 }));

  // arc from PC to PT
  const arc = [];
  for (let i = 0; i <= 64; i++) {
    const a = (th * i) / 64;
    arc.push([cx + r * Math.sin(a), 0, cz - r * Math.cos(a)]);
  }
  g.add(polyline(arc, { color: PALETTE.accent2 }));

  // a short radius stub from the arc midpoint toward the centre
  const am = th / 2;
  const mx = cx + r * Math.sin(am), mz = cz - r * Math.cos(am);
  const stubX = cx + (r - r * 0.55) * Math.sin(am), stubZ = cz - (r - r * 0.55) * Math.cos(am);
  g.add(dashed([[mx, 0, mz], [stubX, 0, stubZ]], { color: PALETTE.accent3, dashSize: 0.1 }));

  const mark = (x, z, color) => cylinder(0.06, 0.06, 0.06, { color, segments: 16, position: [x, 0, z] });
  g.add(mark(pcX, 0, PALETTE.accent));
  g.add(mark(ptX, ptZ, PALETTE.accent));
  g.add(mark(0, 0, PALETTE.bad));

  api.label("PC", new THREE.Vector3(pcX - 0.28, 0.05, -0.2), { style: "background:#eef6ec" });
  api.label("PT", new THREE.Vector3(ptX + 0.18, 0.05, ptZ + 0.22), { style: "background:#eef6ec" });
  api.label("PI", new THREE.Vector3(0.12, 0.05, -0.26), { style: "background:#fdecec" });
  api.label(`R = ${T(R, 0)} m`, new THREE.Vector3((mx + stubX) / 2 + 0.3, 0.05, (mz + stubZ) / 2), {
    style: "background:#e9eff9",
  });
  api.label(`T = ${T(Tt, 1)} m`, new THREE.Vector3(pcX / 2, 0.05, -0.24), { style: "background:#fff" });
  api.label(`I = ${T(I, 0)}°`, new THREE.Vector3(cx + 0.45, 0.05, cz - r * 0.5), { style: "background:#fceaf1" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`L_c = ${T(Lc, 1)} m · arc definition`));
}

/* ==========================================================================
   Earthwork — two cross-sections joined into a prismoid
   ========================================================================== */
export function earthwork(api, d) {
  const g = new THREE.Group();
  const { A1, A2, L, d1, d2 } = d;
  const SPAN = 3.6;
  const s = 1.1 / Math.max(Math.sqrt(A1), Math.sqrt(A2), d1, d2, 1);
  const w1 = Math.sqrt(A1) * s;
  const w2 = Math.sqrt(A2) * s;
  const h1 = d1 * s;
  const h2 = d2 * s;

  // section 1 (trapezoid cut)
  const sec1 = [
    [-w1, 0], [-w1 * 0.45, h1], [w1 * 0.45, h1], [w1, 0],
  ];
  const m1 = prism(sec1, 0.18, { color: PALETTE.sand, capColor: shade(PALETTE.sand, 1.1), position: [-SPAN / 2, 0, 0] });
  part(g, m1, { opacity: 0.5 });

  // section 2
  const sec2 = [
    [-w2, 0], [-w2 * 0.45, h2], [w2 * 0.45, h2], [w2, 0],
  ];
  const m2 = prism(sec2, 0.18, { color: PALETTE.sand, capColor: shade(PALETTE.sand, 1.1), position: [SPAN / 2, 0, 0] });
  part(g, m2, { opacity: 0.5 });

  // connecting edges (the prismoid)
  const edge = { color: 0x8a6c49, opacity: 0.7 };
  g.add(polyline([[-SPAN / 2, 0, 0.09], [SPAN / 2, 0, 0.09]], edge));
  g.add(polyline([[-SPAN / 2, h1, 0.09], [SPAN / 2, h2, 0.09]], edge));
  g.add(polyline([[-SPAN / 2 - w1, 0, 0.09], [SPAN / 2 - w2, 0, 0.09]], edge));
  g.add(polyline([[-SPAN / 2 + w1, 0, 0.09], [SPAN / 2 + w2, 0, 0.09]], edge));

  // translucent volume skin
  const skin = [
    [-SPAN / 2 - w1, 0, 0.09], [-SPAN / 2 + w1, 0, 0.09],
    [SPAN / 2 + w2, 0, 0.09], [SPAN / 2 - w2, 0, 0.09],
  ];
  g.add(face(skin, { color: PALETTE.warn, opacity: 0.12 }));

  api.label(`A₁ = ${T(A1, 1)} m²`, new THREE.Vector3(-SPAN / 2, -0.3, 0.12), { style: "background:#fff" });
  api.label(`A₂ = ${T(A2, 1)} m²`, new THREE.Vector3(SPAN / 2, -0.3, 0.12), { style: "background:#fff" });
  g.add(dimLine([-SPAN / 2, -0.12, 0], [SPAN / 2, -0.12, 0], { tick: 0.08 }));
  api.label(`L = ${T(L, 1)} m`, new THREE.Vector3(0, -0.42, 0), { style: "background:#e9eff9" });

  api.add(g);
  api.hud && api.hud.appendChild(chip("end-area vs prismoidal"));
}

/* ==========================================================================
   Normal distribution with shaded tail
   ========================================================================== */
export function normal(api, d) {
  const g = new THREE.Group();
  const { mu, sd, z } = d;
  const SPAN = 4.6;
  const x0 = -SPAN / 2;
  const scale = 1.35;

  const pdf = (zz) => Math.exp((-zz * zz) / 2) / Math.sqrt(2 * Math.PI);
  const xAt = (zz) => x0 + ((zz + 3.2) / 6.4) * SPAN;
  const yAt = (zz) => pdf(zz) * scale;

  // baseline
  g.add(polyline([[x0, 0, 0], [-x0, 0, 0]], { color: 0x2b2b24, opacity: 0.6 }));

  // curve
  const pts = [];
  for (let i = 0; i <= 90; i++) {
    const zz = -3.2 + (6.4 * i) / 90;
    pts.push([xAt(zz), yAt(zz), 0]);
  }
  g.add(polyline(pts, { color: PALETTE.accent2 }));

  // shaded tail to the right of z
  const zc = Math.max(-3.2, Math.min(3.2, z));
  const tail = [[xAt(zc), 0, 0]];
  for (let i = 0; i <= 40; i++) {
    const zz = zc + ((3.2 - zc) * i) / 40;
    tail.push([xAt(zz), yAt(zz), 0]);
  }
  tail.push([xAt(3.2), 0, 0]);
  g.add(face(tail, { color: PALETTE.accent3, opacity: 0.25 }));

  // mean line
  g.add(dashed([[xAt(0), 0, 0], [xAt(0), yAt(0) + 0.1, 0]], { color: 0x8c8c80, dashSize: 0.08 }));
  api.label("μ", new THREE.Vector3(xAt(0), -0.24, 0), { style: "opacity:.8" });

  // z marker
  g.add(dashed([[xAt(zc), 0, 0], [xAt(zc), yAt(zc), 0]], { color: PALETTE.accent3, dashSize: 0.08 }));
  api.label(`z = ${T(z, 2)}`, new THREE.Vector3(xAt(zc) + 0.3, yAt(zc) + 0.16, 0), { style: "background:#e9eff9" });
  api.label(`P(X ≥ x) = ${T((1 - d.left / 100) * 100, 1)}%`, new THREE.Vector3(xAt(2.2), yAt(1.4) + 0.2, 0), {
    style: "background:#e9eff9",
  });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`μ ${T(mu, 1)} · σ ${T(sd, 1)}`));
}

/* ========================================================================== */
function chip(text) {
  const el = document.createElement("span");
  el.className = "chip";
  el.textContent = text;
  return el;
}
