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

/* ==========================================================================
   Triangle — right-angled or oblique, drawn to scale with its own labels
   ========================================================================== */
export function triangle(api, d) {
  const g = new THREE.Group();
  const D = 0.22;
  const oblique = d.C !== undefined && d.a !== undefined && d.b !== undefined;

  let A, B, Cc, names;
  if (oblique) {
    const a = d.a, b = d.b, th = (d.C * Math.PI) / 180;
    A = [0, 0];
    B = [a, 0];
    Cc = [b * Math.cos(th), b * Math.sin(th)];
    names = { AB: "c", BC: "a", CA: "b" };
  } else {
    const x = d.mode === "hypang" ? d.x * Math.cos((d.theta * Math.PI) / 180) : d.x;
    const y = d.mode === "oppang" ? d.y : d.mode === "hypang" ? d.x * Math.sin((d.theta * Math.PI) / 180) : d.y;
    A = [0, 0]; B = [x, 0]; Cc = [0, y];
    names = { AB: "x", BC: "hyp", CA: "y" };
  }
  const len = (p1, p2) => Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  const L = { AB: len(A, B), BC: len(B, Cc), CA: len(Cc, A) };

  const pts = [A, B, Cc];
  const maxV = Math.max(...pts.flat().map(Math.abs), 1);
  const k = 2.6 / maxV;
  const P = pts.map(([x, y]) => [x * k, y * k]);

  part(g, prism(P, D, { color: PALETTE.accent3, capColor: 0x9fb6cf, opacity: 0.35 }), { opacity: 0.35 });
  g.add(polyline([...P, P[0]].map(([x, y]) => [x, y, D / 2 + 0.01]), { color: PALETTE.ink }));

  const mid = (i, j) => [(P[i][0] + P[j][0]) / 2, (P[i][1] + P[j][1]) / 2, D / 2 + 0.01];
  api.label(`${names.AB} = ${T(L.AB, 4)}`, new THREE.Vector3(...mid(0, 1)), { style: "background:#e9eff9" });
  api.label(`${names.BC} = ${T(L.BC, 4)}`, new THREE.Vector3(...mid(1, 2)), { style: "background:#e9eff9" });
  api.label(`${names.CA} = ${T(L.CA, 4)}`, new THREE.Vector3(...mid(2, 0)), { style: "background:#e9eff9" });

  const vlabel = (i, name, ang) => {
    const v = P[i];
    const off = 0.26;
    const cx = P.reduce((s2, p) => s2 + p[0], 0) / 3;
    const cy = P.reduce((s2, p) => s2 + p[1], 0) / 3;
    const dx = Math.sign(v[0] - cx) * off, dy = Math.sign(v[1] - cy) * off;
    api.label(`${name} ${ang}°`, new THREE.Vector3(v[0] + dx, v[1] + dy, D / 2), { style: "background:#fff" });
  };
  if (oblique) {
    vlabel(0, "A", 0); vlabel(1, "B", 0); vlabel(2, "C", d.C);
  } else {
    // right-angle marker at the origin
    const t = 0.16;
    g.add(polyline([[t, 0, D / 2 + 0.01], [t, t, D / 2 + 0.01], [0, t, D / 2 + 0.01]], { color: PALETTE.bad }));
    vlabel(0, "θ", d.theta ?? 0);
    api.label("90°", new THREE.Vector3(t + 0.22, t + 0.1, D / 2), { style: "background:#fdecec" });
  }

  api.legend([
    { color: "#9fb6cf", label: "Triangle" },
    { color: "#c0392b", label: "Right angle / vertex" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip("drawn to scale from the given sides"));
}

/* ==========================================================================
   Regular polygon — apothem, circumradius, interior angle
   ========================================================================== */
export function polygon(api, d) {
  const g = new THREE.Group();
  const n = Math.max(3, Math.min(Math.round(d.n), 14));
  const s = d.s || 1;
  const R = s / (2 * Math.sin(Math.PI / n));
  const apo = s / (2 * Math.tan(Math.PI / n));
  const k = 1.15 / R;
  const D = 0.3;

  const P = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / 2;
    P.push([Math.cos(a) * R * k, Math.sin(a) * R * k]);
  }
  part(g, prism(P, D, { color: PALETTE.accent2, capColor: 0xe9a7c0, opacity: 0.4 }), { opacity: 0.4 });
  g.add(polyline([...P, P[0]].map(([x, y]) => [x, y, D / 2 + 0.01]), { color: PALETTE.ink }));

  // circumradius to one vertex, apothem to one edge midpoint
  g.add(dashed([[0, 0, D / 2], [P[0][0], P[0][1], D / 2]], { color: PALETTE.accent3, dashSize: 0.07 }));
  const m0 = [(P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2];
  g.add(dashed([[0, 0, D / 2], [m0[0], m0[1], D / 2]], { color: PALETTE.accent, dashSize: 0.07 }));

  api.label(`R = ${T(R, 3)}`, new THREE.Vector3(P[0][0] * 0.62, P[0][1] * 0.62, D / 2), { style: "background:#e9eff9" });
  api.label(`a = ${T(apo, 3)}`, new THREE.Vector3(m0[0] * 0.45, m0[1] * 0.45, D / 2), { style: "background:#eef6ec" });
  api.label(`s = ${T(s, 3)}`, new THREE.Vector3(m0[0] * 1.14, m0[1] * 1.14, D / 2), { style: "background:#fceaf1" });
  api.label(`${n} sides · interior ${T((180 * (n - 2)) / n, 2)}°`, new THREE.Vector3(0, -R * k - 0.3, D / 2), {
    style: "background:#fff",
  });

  api.legend([
    { color: "#e9a7c0", label: "Polygon" },
    { color: "#0d47a1", label: "Circumradius R" },
    { color: "#2f7d32", label: "Apothem a" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`A = ½ P a`));
}

/* ==========================================================================
   Triangle with inscribed and circumscribed circles
   ========================================================================== */
export function incircle(api, d) {
  const g = new THREE.Group();
  const { a, b, c } = d;
  const A = [0, 0], B = [c, 0];
  const cosA = (a * a + c * c - b * b) / (2 * a * c);
  const Cc = [b * Math.cos(Math.acos(Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c))))), 0];
  // place C so that AC = b and BC = a
  const x = (b * b + c * c - a * a) / (2 * c);
  const y = Math.sqrt(Math.max(b * b - x * x, 0));
  Cc[0] = x; Cc[1] = y;

  const s2 = (a + b + c) / 2;
  const area = Math.sqrt(Math.max(s2 * (s2 - a) * (s2 - b) * (s2 - c), 0));
  const r = area / s2;
  const R = (a * b * c) / (4 * area);
  const I = [(a * A[0] + b * B[0] + c * Cc[0]) / (a + b + c), (a * A[1] + b * B[1] + c * Cc[1]) / (a + b + c)];

  const k = 2.4 / Math.max(b, c, a);
  const P = [A, B, Cc].map(([px, py]) => [px * k, py * k]);
  const D = 0.18;

  part(g, prism(P, D, { color: PALETTE.accent3, capColor: 0xa8bfd6, opacity: 0.3 }), { opacity: 0.3 });
  g.add(polyline([...P, P[0]].map(([px, py]) => [px, py, D / 2 + 0.01]), { color: PALETTE.ink }));

  // incircle
  const inc = cylinder(r * k, r * k, 0.03, { color: PALETTE.accent, segments: 48, position: [I[0] * k, I[1] * k, D / 2 + 0.02] });
  inc.rotation.x = Math.PI / 2;
  g.add(inc);
  // circumcircle
  const ringGeo = new THREE.RingGeometry(R * k - 0.012, R * k, 72);
  const circ = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: PALETTE.accent2, side: THREE.DoubleSide }));
  circ.position.set(0, 0, D / 2 + 0.015);
  g.add(circ);

  api.label(`r = ${T(r, 3)}`, new THREE.Vector3(I[0] * k + 0.15, I[1] * k + 0.15, D / 2), { style: "background:#eef6ec" });
  api.label(`R = ${T(R, 3)}`, new THREE.Vector3(0, R * k + 0.2, D / 2), { style: "background:#fceaf1" });
  api.label(`A = ${T(area, 3)}`, new THREE.Vector3(P[0][0] + 0.1, P[0][1] + 0.2, D / 2), { style: "background:#e9eff9" });

  api.legend([
    { color: "#2f7d32", label: "Incircle (r)" },
    { color: "#c2185b", label: "Circumcircle (R)" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`A = rs = abc/4R`));
}

/* ==========================================================================
   Parabola y = Ax² + Bx + C — roots, vertex, axis of symmetry
   ========================================================================== */
export function parabola(api, d) {
  const g = new THREE.Group();
  const { A, B, C } = d;
  const disc = B * B - 4 * A * C;
  const vx = -B / (2 * A);
  const vy = A * vx * vx + B * vx + C;

  const xs = [];
  if (disc >= 0) { xs.push((-B - Math.sqrt(disc)) / (2 * A), (-B + Math.sqrt(disc)) / (2 * A)); }
  xs.push(vx);
  const xmin = Math.min(...xs) - 1.6, xmax = Math.max(...xs) + 1.6;
  const span = xmax - xmin || 2;

  const ys = [];
  for (let i = 0; i <= 60; i++) { const x = xmin + (span * i) / 60; ys.push(A * x * x + B * x + C); }
  ys.push(0, vy);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const yspan = ymax - ymin || 1;
  const k = 3.4 / Math.max(span, yspan);
  const ox = -(xmin + xmax) / 2 * k, oy = -(ymin + ymax) / 2 * k;

  const X = (x) => x * k + ox;
  const Y = (y) => y * k + oy;

  // axes
  g.add(polyline([[X(xmin), 0, 0], [X(xmax), 0, 0]], { color: 0x2b2b24, opacity: 0.75 }));
  g.add(polyline([[X(0), Y(ymin), 0], [X(0), Y(ymax), 0]], { color: 0x2b2b24, opacity: 0.75 }));
  api.label("x", new THREE.Vector3(X(xmax) - 0.1, -0.22, 0), { style: "opacity:.7" });
  api.label("y", new THREE.Vector3(0.22, Y(ymax) - 0.1, 0), { style: "opacity:.7" });

  const pts = [];
  for (let i = 0; i <= 80; i++) { const x = xmin + (span * i) / 80; pts.push([X(x), Y(A * x * x + B * x + C), 0]); }
  g.add(polyline(pts, { color: PALETTE.accent2 }));

  // axis of symmetry
  g.add(dashed([[X(vx), Y(ymin), 0], [X(vx), Y(ymax), 0]], { color: PALETTE.accent3, dashSize: 0.09 }));

  if (disc >= 0) {
    [-1, 1].forEach((sg) => {
      const x = (-B + sg * Math.sqrt(disc)) / (2 * A);
      const dot = cylinder(0.055, 0.055, 0.05, { color: PALETTE.bad, segments: 16, position: [X(x), 0, 0] });
      dot.rotation.x = Math.PI / 2;
      g.add(dot);
      api.label(`x = ${T(x, 3)}`, new THREE.Vector3(X(x), -0.34, 0), { style: "background:#fdecec" });
    });
  }
  const vdot = cylinder(0.06, 0.06, 0.05, { color: PALETTE.accent, segments: 16, position: [X(vx), Y(vy), 0] });
  vdot.rotation.x = Math.PI / 2;
  g.add(vdot);
  api.label(`vertex (${T(vx, 2)}, ${T(vy, 2)})`, new THREE.Vector3(X(vx) + 0.1, Y(vy) + (A > 0 ? -0.34 : 0.34), 0), {
    style: "background:#eef6ec",
  });

  api.legend([
    { color: "#c2185b", label: "y = Ax² + Bx + C" },
    { color: "#0d47a1", label: "Axis of symmetry" },
    { color: "#c0392b", label: "Roots" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(disc >= 0 ? "two real roots" : "no real roots"));
}

/* ==========================================================================
   Pascal's triangle — the binomial expansion
   ========================================================================== */
export function pascal(api, d) {
  const g = new THREE.Group();
  const n = Math.max(1, Math.min(Math.round(d.n), 9));
  const r = Math.max(1, Math.min(Math.round(d.r), n + 1));
  const rows = [];
  for (let i = 0; i <= n; i++) {
    const row = [];
    for (let j = 0; j <= i; j++) {
      row.push(j === 0 || j === i ? 1 : rows[i - 1][j - 1] + rows[i - 1][j]);
    }
    rows.push(row);
  }

  const dy = 0.52, dx = 0.44;
  const D = 0.14;
  const y0 = -((n * dy) / 2);
  rows.forEach((row, i) => {
    row.forEach((val, j) => {
      const x = (j - i / 2) * dx;
      const y = y0 + i * dy;
      const hit = i === n && j === r - 1;
      const disc = cylinder(0.16, 0.16, D, {
        color: hit ? PALETTE.accent : PALETTE.concrete,
        segments: 20,
        position: [x, y, 0],
      });
      disc.rotation.x = Math.PI / 2;
      g.add(disc);
      api.label(String(val), new THREE.Vector3(x, y, D / 2 + 0.02), {
        style: hit ? "background:#eef6ec;color:#1e6b23;font-weight:600" : "background:#fff",
      });
    });
  });

  api.label(`row n = ${n}`, new THREE.Vector3(0, y0 - 0.42, 0), { style: "background:#e9eff9" });
  api.legend([
    { color: "#2f7d32", label: `term r = ${r} (m = r−1 = ${r - 1})` },
    { color: "#b9b6ab", label: "binomial coefficients" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`nCm = ${rows[n][r - 1] ?? 0}`));
}

/* ==========================================================================
   Poisson PMF — bars up to x, the tail beyond
   ========================================================================== */
export function pmf(api, d) {
  const g = new THREE.Group();
  const mu = Math.max(d.mu ?? 1, 0.01);
  const x = Math.max(0, Math.round(d.x ?? 0));
  const fact = (k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
  const P = (k) => (Math.pow(mu, k) * Math.exp(-mu)) / fact(k);

  const nmax = Math.max(x + 2, Math.ceil(mu + 4 * Math.sqrt(mu)), 5);
  const bars = [];
  for (let k = 0; k <= nmax; k++) bars.push({ k, p: P(k) });
  const pmax = Math.max(...bars.map((b) => b.p), 0.02);

  const bw = Math.min(0.46, 4.2 / (nmax + 1));
  const H = 2.2;
  const D = bw * 0.8;
  const x0 = -((nmax + 1) * bw) / 2;

  g.add(polyline([[-2.4, 0, 0], [2.4, 0, 0]], { color: 0x2b2b24, opacity: 0.7 }));

  bars.forEach(({ k, p }) => {
    const h = (p / pmax) * H;
    const cx = x0 + (k + 0.5) * bw;
    const hit = k === x;
    if (h > 0.004) {
      part(g, box(bw * 0.86, h, D, {
        color: hit ? PALETTE.accent : PALETTE.accent3,
        position: [cx, h / 2, 0],
        opacity: hit ? 1 : 0.55,
      }), { opacity: 0.4 });
    }
    api.label(String(k), new THREE.Vector3(cx, -0.22, 0), { style: "background:#fff" });
    if (hit) {
      api.label(`P = ${T(p, 4)}`, new THREE.Vector3(cx, h + 0.24, 0), { style: "background:#eef6ec" });
    }
  });

  api.label("x", new THREE.Vector3(2.3, -0.5, 0), { style: "opacity:.7" });
  api.label(`μ = ${T(mu, 2)}`, new THREE.Vector3(-2.3, H + 0.2, 0), { style: "background:#e9eff9" });

  api.legend([
    { color: "#2f7d32", label: `P(X = ${x})` },
    { color: "#0d47a1", label: "other outcomes" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`Poisson, mean ${T(mu, 2)}`));
}

/* ==========================================================================
   Compound vs simple interest growth
   ========================================================================== */
export function growth(api, d) {
  const g = new THREE.Group();
  const P0 = d.P ?? 1000;
  const r = (d.r ?? 8) / 100;
  const m = Math.max(1, Math.round(d.m ?? 1));
  const t = Math.max(1, d.t ?? 1);

  const i = r / m;
  const n = m * t;
  const comp = (k) => P0 * Math.pow(1 + i, k);
  const simple = (k) => P0 * (1 + (r * k) / m);
  const maxV = comp(n);
  const base = P0 * 0.94;          // start just below P so the growth is visible

  const W = 4.2, H = 2.2;
  const X = (k) => -W / 2 + (W * k) / n;
  const Y = (v) => ((v - base) / (maxV - base)) * H;

  g.add(polyline([[-W / 2 - 0.2, 0, 0], [W / 2 + 0.3, 0, 0]], { color: 0x2b2b24, opacity: 0.7 }));

  const cp = [], sp = [];
  for (let k = 0; k <= n; k++) {
    cp.push([X(k), Y(comp(k)), 0]);
    sp.push([X(k), Y(simple(k)), 0]);
  }
  // filled area under the compound curve
  g.add(face([[-W / 2, 0], ...cp, [W / 2, 0]], { color: PALETTE.accent, opacity: 0.12 }));
  g.add(polyline(sp, { color: PALETTE.accent3 }));
  g.add(polyline(cp, { color: PALETTE.accent }));

  const dot = (x, y, c) => { const m2 = cylinder(0.055, 0.055, 0.05, { color: c, segments: 16, position: [x, y, 0] }); m2.rotation.x = Math.PI / 2; return m2; };
  g.add(dot(W / 2, Y(comp(n)), PALETTE.accent));
  g.add(dot(W / 2, Y(simple(n)), PALETTE.accent3));

  api.label(`F = ${T(comp(n), 6)}`, new THREE.Vector3(W / 2 - 0.1, Y(comp(n)) + 0.3, 0), { style: "background:#eef6ec" });
  api.label(`simple = ${T(simple(n), 6)}`, new THREE.Vector3(W / 2 - 0.5, Y(simple(n)) - 0.3, 0), { style: "background:#e9eff9" });
  api.label(`P = ${T(P0, 6)}`, new THREE.Vector3(-W / 2 + 0.55, 0.3, 0), { style: "background:#fff" });
  api.label(`${n} periods @ ${T(i * 100, 3)}%`, new THREE.Vector3(0, -0.42, 0), { style: "background:#fff" });

  api.legend([
    { color: "#2f7d32", label: "compound" },
    { color: "#0d47a1", label: "simple" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`F/P = ${T(comp(n) / P0, 3)}`));
}

/* ==========================================================================
   Cash-flow diagram — one arrow per payment
   ========================================================================== */
export function cashflow(api, d) {
  const g = new THREE.Group();
  const A = d.A ?? d.profit ?? 1000;
  const m = Math.max(1, Math.round(d.m ?? 1));
  const t = Math.max(1, d.t ?? 1);
  const n = Math.min(m * t, 18);
  const due = d.type === "due";

  const W = 4.4, H = 1.6;
  const X = (k) => -W / 2 + (W * k) / Math.max(n, 1);
  const step = W / Math.max(n, 1);
  const D = 0.1;

  // timeline
  g.add(polyline([[-W / 2 - 0.35, 0, 0], [W / 2 + 0.4, 0, 0]], { color: 0x2b2b24 }));

  for (let k = 1; k <= n; k++) {
    const x = X(k);
    const h = (A / Math.max(A, 1)) * H;
    g.add(arrow([x, 0, 0], [x, h, 0], {
      color: PALETTE.accent3, headLen: 0.13, headR: 0.05, shaftR: 0.016,
    }));
    g.add(polyline([[x, -0.08, 0], [x, 0.08, 0]], { color: 0x2b2b24 }));
  }

  // future worth at the end
  g.add(arrow([W / 2 + 0.15, 0, 0], [W / 2 + 0.15, H * 1.35, 0], {
    color: PALETTE.accent, headLen: 0.16, headR: 0.06, shaftR: 0.02,
  }));

  api.label(`A = ${T(A, 6)}`, new THREE.Vector3(X(Math.max(1, Math.ceil(n / 2))), H + 0.26, 0), { style: "background:#e9eff9" });
  api.label("F", new THREE.Vector3(W / 2 + 0.15, H * 1.35 + 0.22, 0), { style: "background:#eef6ec" });
  api.label("P", new THREE.Vector3(-W / 2 - 0.3, 0.24, 0), { style: "background:#fff" });
  api.label(`n = ${n}${due ? " · due" : ""}`, new THREE.Vector3(0, -0.34, 0), { style: "background:#fff" });

  api.legend([
    { color: "#0d47a1", label: "uniform payment A" },
    { color: "#2f7d32", label: "future worth F" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(due ? "annuity due — payment at period start" : "ordinary annuity"));
}

/* ==========================================================================
   Offsets — trapezoidal vs Simpson strips
   ========================================================================== */
export function offsets(api, d) {
  const g = new THREE.Group();
  const step = d.d ?? 10;
  const hs = [d.h1, d.h2, d.h3, d.h4, d.h5].map((v) => Math.max(v ?? 0, 0));
  const n = hs.length - 1;
  const W = 4.2;
  const maxH = Math.max(...hs, 0.5);
  const kx = W / n;
  const ky = 2.0 / maxH;

  // baseline
  g.add(polyline([[-W / 2 - 0.2, 0, 0], [W / 2 + 0.2, 0, 0]], { color: 0x2b2b24, opacity: 0.7 }));

  const P = hs.map((h, i) => [-W / 2 + i * kx, h * ky]);

  // trapezoids
  for (let i = 0; i < n; i++) {
    const poly = [[P[i][0], 0], [P[i + 1][0], 0], P[i + 1], P[i]];
    g.add(face(poly, { color: PALETTE.accent3, opacity: 0.14, position: [0, 0, 0] }));
    g.add(polyline([...poly, poly[0]].map(([x, y]) => [x, y, 0.005]), { color: PALETTE.accent3, opacity: 0.5 }));
  }

  // measured offsets
  P.forEach(([x, y], i) => {
    g.add(polyline([[x, 0, 0], [x, y, 0]], { color: PALETTE.ink, opacity: 0.8 }));
    const dot = cylinder(0.045, 0.045, 0.04, { color: PALETTE.accent2, segments: 14, position: [x, y, 0.01] });
    dot.rotation.x = Math.PI / 2;
    g.add(dot);
    api.label(`h${i + 1} ${T(hs[i], 2)}`, new THREE.Vector3(x, y + 0.22, 0), { style: "background:#fff" });
  });

  // smooth boundary through the offsets
  g.add(polyline(P.map(([x, y]) => [x, y, 0.02]), { color: PALETTE.accent2 }));

  api.label(`d = ${T(step, 2)}`, new THREE.Vector3(0, -0.3, 0), { style: "background:#e9eff9" });
  api.legend([
    { color: "#c2185b", label: "measured offsets" },
    { color: "#0d47a1", label: "trapezoidal strips" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip("5 offsets · 4 intervals"));
}

/* ==========================================================================
   Open box from a square sheet
   ========================================================================== */
export function box3d(api, d) {
  const g = new THREE.Group();
  const S = d.S ?? 30;
  const x = S / 6;
  const side = S - 2 * x;

  // flat sheet with the corner cuts, laid out in the XY plane
  const k = 2.6 / S;
  const W = S * k;
  const c = x * k;
  const D = 0.08;

  part(g, prism([[-W / 2, -W / 2], [W / 2, -W / 2], [W / 2, W / 2], [-W / 2, W / 2]], D,
    { color: PALETTE.sand, capColor: 0xe4d3ae, opacity: 0.55 }), { opacity: 0.45 });

  // cut-out corners, drawn as darker squares
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
    const cx = sx * (W / 2 - c / 2);
    const cy = sy * (W / 2 - c / 2);
    g.add(face([[cx - c / 2, cy - c / 2], [cx + c / 2, cy - c / 2], [cx + c / 2, cy + c / 2], [cx - c / 2, cy + c / 2]],
      { color: PALETTE.bad, opacity: 0.22, position: [0, 0, D / 2 + 0.005] }));
    g.add(polyline([[cx - c / 2, cy - c / 2, D / 2 + 0.01], [cx + c / 2, cy - c / 2, D / 2 + 0.01],
      [cx + c / 2, cy + c / 2, D / 2 + 0.01], [cx - c / 2, cy + c / 2, D / 2 + 0.01], [cx - c / 2, cy - c / 2, D / 2 + 0.01]],
      { color: PALETTE.bad }));
  });

  // fold lines
  const inner = W / 2 - c;
  g.add(dashed([[-inner, -inner, D / 2 + 0.01], [inner, -inner, D / 2 + 0.01], [inner, inner, D / 2 + 0.01], [-inner, inner, D / 2 + 0.01], [-inner, -inner, D / 2 + 0.01]],
    { color: PALETTE.accent, dashSize: 0.09 }));

  api.label(`cut x = ${T(x, 3)}`, new THREE.Vector3(0, -W / 2 - 0.24, D / 2), { style: "background:#fdecec" });
  api.label(`base ${T(side, 3)}`, new THREE.Vector3(0, 0, D / 2 + 0.02), { style: "background:#eef6ec" });
  api.label(`S = ${T(S, 3)}`, new THREE.Vector3(0, W / 2 + 0.2, D / 2), { style: "background:#fff" });

  api.legend([
    { color: "#d6bd8e", label: "sheet" },
    { color: "#c0392b", label: "corners removed" },
    { color: "#2f7d32", label: "fold lines" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`x = S/6 maximises V`));
}

/* ==========================================================================
   Wave — wavelength and frequency
   ========================================================================== */
export function wave(api, d) {
  const g = new THREE.Group();
  const lam = d.lam ?? 1;
  const f = d.f ?? 1;
  const W = 4.2, H = 1.5;
  const cycles = 3;
  const k = W / (cycles * lam);

  g.add(polyline([[-W / 2 - 0.2, 0, 0], [W / 2 + 0.3, 0, 0]], { color: 0x2b2b24, opacity: 0.6 }));

  const pts = [];
  for (let i = 0; i <= 160; i++) {
    const x = -W / 2 + (W * i) / 160;
    pts.push([x, Math.sin((x / k) * Math.PI * 2) * H * 0.5, 0]);
  }
  g.add(polyline(pts, { color: PALETTE.accent3 }));

  // one wavelength bracket
  const x1 = -W / 2, x2 = -W / 2 + lam * k;
  g.add(dimLine([x1, H * 0.78, 0], [x2, H * 0.78, 0], { tick: 0.08, color: PALETTE.accent2 }));
  api.label(`λ = ${T(lam, 3)} m`, new THREE.Vector3((x1 + x2) / 2, H * 0.78 + 0.2, 0), { style: "background:#fceaf1" });
  api.label(`f = ${T(f, 3)} Hz`, new THREE.Vector3(W / 2 - 0.5, H * 0.55, 0), { style: "background:#e9eff9" });
  api.label(`v = λf = ${T(lam * f, 4)} m/s`, new THREE.Vector3(0, -H * 0.75, 0), { style: "background:#eef6ec" });

  api.legend([{ color: "#0d47a1", label: "waveform" }]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`T = ${T(1 / f, 4)} s`));
}

/* ========================================================================== */
function chip(text) {
  const el = document.createElement("span");
  el.className = "chip";
  el.textContent = text;
  return el;
}
