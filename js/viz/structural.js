/* ==========================================================================
   viz/structural.js — 2.5D models for the structural section
   ========================================================================== */

import {
  THREE, PALETTE, prism, box, cylinder, face, polyline, dashed,
  arrow, dimLine, part, shade, ring,
} from "./scene.js";

const T = (n, d = 2) => Number(n).toFixed(d);

/* ==========================================================================
   Simply supported beam — loads above, moment diagram below
   ========================================================================== */
export function beam(api, d) {
  const g = new THREE.Group();
  const { L, w, P, a, R1, R2, Mx } = d;
  const SPAN = 4.6;
  const s = SPAN / L;
  const bd = 0.26;
  const DEPTH = 0.9;
  const x0 = -SPAN / 2;

  // beam
  const beamMesh = box(SPAN, bd, DEPTH, { color: PALETTE.concrete, position: [0, 0, 0] });
  part(g, beamMesh, { opacity: 0.55 });

  // supports: pin (triangle) at left, roller at right
  const triPts = [[x0, -0.14], [x0 - 0.18, -0.5], [x0 + 0.18, -0.5]];
  const pin = prism(triPts, DEPTH * 0.9, { color: PALETTE.steelDark, capColor: PALETTE.steel });
  part(g, pin, { opacity: 0.5 });
  const triPts2 = [[SPAN / 2, -0.14], [SPAN / 2 - 0.18, -0.5], [SPAN / 2 + 0.18, -0.5]];
  const roller = prism(triPts2, DEPTH * 0.9, { color: PALETTE.steelDark, capColor: PALETTE.steel });
  part(g, roller, { opacity: 0.5 });

  // ground hatch
  g.add(polyline([[x0 - 0.45, -0.5, DEPTH / 2], [SPAN / 2 + 0.45, -0.5, DEPTH / 2]], { color: 0x6b6b60 }));

  // UDL
  const nA = 12;
  for (let i = 0; i <= nA; i++) {
    const x = x0 + (SPAN * i) / nA;
    g.add(arrow([x, 0.95, DEPTH / 2 - 0.12], [x, bd / 2 + 0.03, DEPTH / 2 - 0.12], {
      color: PALETTE.accent2, headLen: 0.1, headR: 0.032, shaftR: 0.009,
    }));
  }
  g.add(polyline([[x0, 0.95, DEPTH / 2 - 0.12], [SPAN / 2, 0.95, DEPTH / 2 - 0.12]], { color: PALETTE.accent2 }));
  api.label(`w = ${T(w, 1)} kN/m`, new THREE.Vector3(SPAN * 0.3, 1.12, DEPTH / 2 - 0.12), { style: "background:#fceaf1" });

  // point load
  const xp = x0 + a * s;
  g.add(arrow([xp, 1.9, DEPTH / 2 - 0.05], [xp, bd / 2 + 0.04, DEPTH / 2 - 0.05], {
    color: PALETTE.bad, headLen: 0.24, headR: 0.085, shaftR: 0.028,
  }));
  api.label(`P = ${T(P, 0)} kN`, new THREE.Vector3(xp, 2.12, DEPTH / 2 - 0.05), { style: "background:#fdecec" });

  // reactions
  g.add(arrow([x0, -0.95, DEPTH / 2], [x0, -0.5, DEPTH / 2], {
    color: PALETTE.accent, headLen: 0.12, headR: 0.045, shaftR: 0.014,
  }));
  g.add(arrow([SPAN / 2, -0.95, DEPTH / 2], [SPAN / 2, -0.5, DEPTH / 2], {
    color: PALETTE.accent, headLen: 0.12, headR: 0.045, shaftR: 0.014,
  }));
  api.label(`R₁ ${T(R1, 0)}`, new THREE.Vector3(x0 - 0.42, -0.72, DEPTH / 2), { style: "background:#eef6ec" });
  api.label(`R₂ ${T(R2, 0)}`, new THREE.Vector3(SPAN / 2 + 0.42, -0.72, DEPTH / 2), { style: "background:#eef6ec" });

  // moment diagram
  const maxM = Math.max(...Mx.map(Math.abs), 1e-6);
  const yBase = -1.75;
  const amp = 1.0;
  const pts = Mx.map((m, i) => [x0 + (SPAN * i) / (Mx.length - 1), yBase - (m / maxM) * amp]);
  const poly = [[x0, yBase], ...pts, [SPAN / 2, yBase]];
  g.add(face(poly, { color: PALETTE.accent3, opacity: 0.22, position: [0, 0, DEPTH / 2] }));
  g.add(polyline(pts.map(([x, y]) => [x, y, DEPTH / 2 + 0.01]), { color: PALETTE.accent3 }));
  g.add(polyline([[x0, yBase, DEPTH / 2 + 0.01], [SPAN / 2, yBase, DEPTH / 2 + 0.01]], { color: 0x6b6b60 }));
  // drop lines tie the diagram to the beam
  g.add(dashed([[x0, -0.5, DEPTH / 2], [x0, yBase, DEPTH / 2]], { color: 0x8c8c80, dashSize: 0.08 }));
  g.add(dashed([[SPAN / 2, -0.5, DEPTH / 2], [SPAN / 2, yBase, DEPTH / 2]], { color: 0x8c8c80, dashSize: 0.08 }));
  api.label(`M_max = ${T(d.Mmax, 1)} kN·m`, new THREE.Vector3(0, yBase - amp - 0.3, DEPTH / 2), { style: "background:#e9eff9" });

  // span dimension, kept clear of the load labels
  g.add(dimLine([x0, -0.72, 0], [SPAN / 2, -0.72, 0], { tick: 0.08 }));
  api.label(`L = ${T(L, 1)} m`, new THREE.Vector3(x0 + 0.55, -0.72, 0), { style: "background:#fff" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`M(x) plotted below · max at x = ${T(d.xM, 2)} m`));
}

/* ==========================================================================
   Cantilever
   ========================================================================== */
export function cantilever(api, d) {
  const g = new THREE.Group();
  const { L, w, P } = d;
  const SPAN = 4.2;
  const s = SPAN / L;
  const DEPTH = 0.8;

  const beamMesh = box(SPAN, 0.26, DEPTH, { color: PALETTE.concrete, position: [SPAN / 2 - SPAN / 2, 0, 0] });
  part(g, beamMesh, { opacity: 0.55 });

  // fixed support: hatched wall
  const wallPts = [[-SPAN / 2, -0.9], [-SPAN / 2 + 0.22, -0.9], [-SPAN / 2 + 0.22, 0.9], [-SPAN / 2, 0.9]];
  const wall = prism(wallPts, DEPTH * 1.15, { color: PALETTE.concreteDark, capColor: PALETTE.concrete });
  part(g, wall, { opacity: 0.5 });
  for (let i = 0; i < 6; i++) {
    const yy = -0.8 + i * 0.32;
    g.add(polyline([[-SPAN / 2, yy, DEPTH / 2], [-SPAN / 2 - 0.22, yy + 0.2, DEPTH / 2]], {
      color: 0x6b6b60, opacity: 0.7,
    }));
  }

  // UDL
  const nA = 10;
  for (let i = 0; i <= nA; i++) {
    const x = -SPAN / 2 + (SPAN * i) / nA;
    g.add(arrow([x, 1.0, DEPTH / 2 - 0.1], [x, 0.16, DEPTH / 2 - 0.1], {
      color: PALETTE.accent2, headLen: 0.09, headR: 0.03, shaftR: 0.008,
    }));
  }
  g.add(polyline([[-SPAN / 2, 1.0, DEPTH / 2 - 0.1], [SPAN / 2, 1.0, DEPTH / 2 - 0.1]], { color: PALETTE.accent2 }));
  api.label(`w = ${T(w, 1)} kN/m`, new THREE.Vector3(0, 1.18, DEPTH / 2 - 0.1), { style: "background:#fceaf1" });

  // tip load
  g.add(arrow([SPAN / 2, 1.9, DEPTH / 2], [SPAN / 2, 0.16, DEPTH / 2], {
    color: PALETTE.bad, headLen: 0.2, headR: 0.07, shaftR: 0.024,
  }));
  api.label(`P = ${T(P, 0)} kN`, new THREE.Vector3(SPAN / 2 + 0.5, 1.5, DEPTH / 2), { style: "background:#fdecec" });

  // deflected shape (exaggerated)
  const defl = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = -SPAN / 2 + t * SPAN;
    const y = -0.55 * Math.pow(t, 2) * (0.7 + 0.3 * t);
    defl.push([x, y, DEPTH / 2 + 0.02]);
  }
  g.add(dashed(defl, { color: PALETTE.accent3, dashSize: 0.1 }));
  api.label(`δ = ${T(d.dTip * 1000, 1)} mm`, new THREE.Vector3(SPAN / 2 + 0.15, -0.85, DEPTH / 2), { style: "background:#e9eff9" });

  // fixed-end moment
  api.label(`M = ${T(d.Mfix, 0)} kN·m`, new THREE.Vector3(-SPAN / 2 + 0.85, 0.42, DEPTH / 2), { style: "background:#eef6ec" });

  g.add(dimLine([-SPAN / 2, 1.45, 0], [SPAN / 2, 1.45, 0], { tick: 0.08 }));
  api.label(`L = ${T(L, 1)} m`, new THREE.Vector3(0, 1.62, 0), { style: "background:#fff" });

  api.add(g);
  api.hud && api.hud.appendChild(chip("deflected shape exaggerated"));
}

/* ==========================================================================
   Column buckling mode
   ========================================================================== */
export function column(api, d) {
  const g = new THREE.Group();
  const { k, Pcr } = d;
  const H = 3.2;
  const W = 0.34;
  const DEPTH = 0.34;

  const col = box(W, H, DEPTH, { color: PALETTE.steel, position: [0, H / 2, 0] });
  part(g, col, { opacity: 0.5 });

  // buckled shape depending on end condition
  const shape = (t) => {
    if (k <= 0.55) return Math.sin(Math.PI * t) * 0.55;            // fixed-fixed
    if (k <= 0.8) return Math.sin(Math.PI * t * 0.86) * 0.5;        // fixed-pinned
    if (k <= 1.2) return Math.sin(Math.PI * t) * 0.62;              // pinned-pinned
    return Math.sin((Math.PI * t) / 2) * 0.75;                      // fixed-free
  };
  const pts = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    pts.push([shape(t), t * H, DEPTH / 2 + 0.02]);
  }
  g.add(polyline(pts, { color: PALETTE.accent2 }));

  // supports
  if (k <= 0.55) {
    g.add(polyline([[-0.5, 0, 0], [0.5, 0, 0]], { color: 0x2b2b24 }));
    g.add(polyline([[-0.5, H, 0], [0.5, H, 0]], { color: 0x2b2b24 }));
  } else if (k <= 1.2) {
    g.add(polyline([[-0.45, 0, 0], [0.45, 0, 0]], { color: 0x2b2b24 }));
    g.add(polyline([[-0.45, H, 0], [0.45, H, 0]], { color: 0x2b2b24 }));
  } else {
    g.add(polyline([[-0.55, 0, 0], [0.45, 0, 0]], { color: 0x2b2b24 }));
  }

  // load arrow
  g.add(arrow([0, H + 0.85, 0], [0, H + 0.05, 0], {
    color: PALETTE.bad, headLen: 0.18, headR: 0.07, shaftR: 0.024,
  }));
  api.label(`P_cr = ${T(Pcr, 0)} kN`, new THREE.Vector3(0.55, H + 0.65, 0), { style: "background:#fdecec" });
  api.label(`k = ${T(k, 1)}`, new THREE.Vector3(-0.62, H / 2, 0), { style: "background:#e9eff9" });
  api.label(`KL/r = ${T(d.KLr, 0)}`, new THREE.Vector3(0.55, H * 0.55, 0), { style: "background:#eef6ec" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(k >= 2 ? "cantilever — k = 2.0" : `effective length ${T(k, 1)}L`));
}

/* ==========================================================================
   RC beam section with stress block
   ========================================================================== */
export function section(api, d) {
  const g = new THREE.Group();
  const { b, d: dep, a, c, fc } = d;
  const s = 2.4 / Math.max(b, dep);
  const w = b * s, hh = dep * s;
  const DEPTH = 1.1;

  // concrete section
  const sec = prism([[-w / 2, -hh], [w / 2, -hh], [w / 2, 0], [-w / 2, 0]], DEPTH, {
    color: PALETTE.concrete, capColor: shade(PALETTE.concrete, 1.12),
  });
  part(g, sec, { opacity: 0.45 });

  // rebar
  const nBars = 3;
  const yBar = -hh + 0.12;
  for (let i = 0; i < nBars; i++) {
    const x = -w / 2 + (w * (i + 0.5)) / nBars;
    const bar = cylinder(0.055, 0.055, DEPTH + 0.02, { color: 0xb0552b, segments: 16 });
    bar.rotation.x = Math.PI / 2;
    bar.position.set(x, yBar, 0);
    g.add(bar);
  }

  // neutral axis and stress block
  const yNA = -hh + (c / dep) * hh;
  g.add(dashed([[-w / 2 - 0.3, yNA, DEPTH / 2], [w / 2 + 0.3, yNA, DEPTH / 2]], {
    color: PALETTE.accent3, dashSize: 0.1,
  }));
  api.label("N.A.", new THREE.Vector3(w / 2 + 0.55, yNA, DEPTH / 2), { style: "background:#e9eff9" });

  // Whitney block on the right side
  const yTop = 0;
  const yBot = -(Math.max(a, dep * 0.06) / dep) * hh;
  const blockPts = [[w / 2 + 0.1, yTop], [w / 2 + 0.1, yBot], [w / 2 + 0.1 + 0.55, yBot], [w / 2 + 0.1 + 0.55, yTop]];
  g.add(face(blockPts, { color: PALETTE.accent2, opacity: 0.3, position: [0, 0, DEPTH / 2] }));
  g.add(polyline(blockPts.map(([x, y]) => [x, y, DEPTH / 2 + 0.01]), { color: PALETTE.accent2 }));
  api.label(`0.85f'c = ${T(0.85 * fc, 1)}`, new THREE.Vector3(w / 2 + 1.35, (yTop + yBot) / 2, DEPTH / 2), {
    style: "background:#fceaf1",
  });

  // compression arrows pushing back into the section
  for (let i = 0; i < 5; i++) {
    const yy = yTop + ((yBot - yTop) * (i + 0.5)) / 5;
    g.add(arrow([w / 2 + 0.62, yy, DEPTH / 2], [w / 2 + 0.14, yy, DEPTH / 2], {
      color: PALETTE.accent2, headLen: 0.06, headR: 0.022, shaftR: 0.007,
    }));
  }

  api.label(`a = ${T(a, 1)} mm`, new THREE.Vector3(w / 2 + 0.42, yBot - 0.22, DEPTH / 2), { style: "background:#fff" });
  api.label(`b = ${T(b, 0)} mm`, new THREE.Vector3(0, -hh - 0.3, DEPTH / 2), { style: "background:#fff" });
  api.label(`d = ${T(dep, 0)} mm`, new THREE.Vector3(-w / 2 - 0.95, -hh / 2, DEPTH / 2), { style: "background:#fff" });

  g.add(dimLine([-w / 2, -hh - 0.1, 0], [w / 2, -hh - 0.1, 0], { tick: 0.07 }));
  g.add(dimLine([-w / 2 - 0.28, -hh, 0], [-w / 2 - 0.28, 0, 0], { tick: 0.07 }));

  api.add(g);
  api.hud && api.hud.appendChild(chip(`φ = ${T(d.phi, 2)} · M_u = ${T(d.Mu, 0)} kN·m`));
}

/* ==========================================================================
   Isolated footing with punching perimeter
   ========================================================================== */
export function footing(api, d) {
  const g = new THREE.Group();
  const { B, c, h, qu } = d;
  const s = 2.6 / Math.max(B, 1);
  const w = B * s;
  const th = Math.max((h / 1000) * s * 0.6, 0.18);   // h is in mm
  const cw = (c / 1000) * s;                          // c is in mm

  // soil pad
  const soil = prism([[-w / 2 - 0.4, -1.1], [w / 2 + 0.4, -1.1], [w / 2 + 0.4, 0], [-w / 2 - 0.4, 0]], w * 0.9, {
    color: PALETTE.sand, capColor: shade(PALETTE.sand, 1.08), opacity: 0.4,
  });
  part(g, soil, { opacity: 0.25 });

  // footing
  const pad = box(w, th, w, { color: PALETTE.concrete, position: [0, -th / 2, 0] });
  part(g, pad, { opacity: 0.55 });

  // column
  const col = box(cw, 1.5, cw, { color: PALETTE.concreteDark, position: [0, 0.75, 0] });
  part(g, col, { opacity: 0.5 });

  // punching perimeter
  const dp = (d.d / 1000) * s;
  const per = cw + 2 * dp;
  const perPts = [[-per / 2, -th], [per / 2, -th], [per / 2, -th - 0.02], [-per / 2, -th - 0.02]];
  g.add(polyline([[-per / 2, 0.02, per / 2], [per / 2, 0.02, per / 2], [per / 2, 0.02, -per / 2], [-per / 2, 0.02, -per / 2], [-per / 2, 0.02, per / 2]], {
    color: PALETTE.bad, opacity: 0.9,
  }));
  g.add(dashed([[-per / 2, -th, per / 2], [-per / 2, -th - 0.7, per / 2]], { color: PALETTE.bad, dashSize: 0.08 }));

  // pressure arrows
  const qs = 0.5 / Math.max(qu, 1);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const x = -w / 2 + (w * (i + 0.5)) / 5;
      const z = -w / 2 + (w * (j + 0.5)) / 5;
      g.add(arrow([x, -th - 0.02, z], [x, -th - 0.02 - qu * qs, z], {
        color: PALETTE.accent, headLen: 0.06, headR: 0.022, shaftR: 0.007,
      }));
    }
  }

  api.label(`B = ${T(B, 2)} m`, new THREE.Vector3(0, -th - 0.95, w / 2 + 0.2), { style: "background:#fff" });
  api.label(`c = ${T(c, 0)} mm`, new THREE.Vector3(cw / 2 + 0.55, 0.55, 0), { style: "background:#fff" });
  api.label(`q_u = ${T(qu, 0)} kPa`, new THREE.Vector3(-w / 2 - 0.9, -th - 0.3, 0), { style: "background:#eef6ec" });
  api.label("punching perimeter b₀", new THREE.Vector3(0, 0.18, per / 2 + 0.45), { style: "background:#fdecec" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`d = ${T(d.d, 0)} mm`));
}

/* ==========================================================================
   Pile cap plan with reactions
   ========================================================================== */
export function pilecap(api, d) {
  const g = new THREE.Group();
  const { rows, cols, sx, sy, Rmax, Rmin, P, n } = d;
  const w = (cols - 1) * sx;
  const hgt = (rows - 1) * sy;
  const s = 2.6 / Math.max(w + sx, hgt + sy, 1);
  const W = (w + sx) * s, Hh = (hgt + sy) * s;
  const th = 0.42;

  // cap
  const cap = box(W, th, Hh, { color: PALETTE.concrete, position: [0, 0, 0] });
  part(g, cap, { opacity: 0.45 });

  // column
  const col = box(Math.min(W * 0.28, 0.8), 1.1, Math.min(Hh * 0.28, 0.8), {
    color: PALETTE.concreteDark, position: [0, th / 2 + 0.55, 0],
  });
  part(g, col, { opacity: 0.5 });

  // piles
  const qs = 0.55 / Math.max(Rmax, 1);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = ((i - (cols - 1) / 2) * sx) * s;
      const z = ((j - (rows - 1) / 2) * sy) * s;
      const pile = cylinder(0.09, 0.09, 0.9, { color: PALETTE.steel, segments: 20, position: [x, -th / 2 - 0.45, z] });
      part(g, pile, { opacity: 0.4 });

      const isMax = Math.abs(x) === Math.max(...[...Array(cols)].map((_, k) => Math.abs((k - (cols - 1) / 2) * sx) * s))
        && Math.abs(z) === Math.max(...[...Array(rows)].map((_, k) => Math.abs((k - (rows - 1) / 2) * sy) * s));
      const R = isMax ? Rmax : P / n;
      g.add(arrow([x, -th / 2 - 0.92, z], [x, -th / 2 - 0.92 - R * qs, z], {
        color: isMax ? PALETTE.bad : PALETTE.accent, headLen: 0.08, headR: 0.03, shaftR: 0.01,
      }));
    }
  }

  api.label(`R_max = ${T(Rmax, 0)} kN`, new THREE.Vector3(W / 2 + 0.6, -th / 2 - 0.6, Hh / 2), {
    style: "background:#fdecec",
  });
  api.label(`${rows} × ${cols} = ${n} piles`, new THREE.Vector3(0, th / 2 + 0.1, Hh / 2 + 0.45), {
    style: "background:#fff",
  });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`Σx² Σy² elastic distribution`));
}

/* ==========================================================================
   Belt friction on a pulley
   ========================================================================== */
export function belt(api, d) {
  const g = new THREE.Group();
  const { mu, turns, T1, T2 } = d;
  const R = 1.0;
  const DEPTH = 0.5;

  // pulley
  const pul = cylinder(R, R, DEPTH, { color: PALETTE.steel, metalness: 0.35, segments: 48 });
  pul.rotation.x = Math.PI / 2;
  part(g, pul, { opacity: 0.4 });

  const hub = cylinder(0.16, 0.16, DEPTH + 0.05, { color: PALETTE.steelDark, segments: 24 });
  hub.rotation.x = Math.PI / 2;
  g.add(hub);

  // wrap arc
  const beta = 2 * Math.PI * turns;
  const arc = [];
  for (let i = 0; i <= 48; i++) {
    const a = (beta * i) / 48 - Math.PI / 2;
    arc.push([R * Math.cos(a), R * Math.sin(a), DEPTH / 2 + 0.02]);
  }
  g.add(polyline(arc, { color: 0x2b2b24, opacity: 0.9 }));

  // two straight runs
  const a0 = -Math.PI / 2;
  const a1 = -Math.PI / 2 + beta;
  g.add(polyline([[R * Math.cos(a0), R * Math.sin(a0), DEPTH / 2 + 0.02], [R * Math.cos(a0), -2.4, DEPTH / 2 + 0.02]], {
    color: 0x2b2b24,
  }));
  g.add(polyline([[R * Math.cos(a1), R * Math.sin(a1), DEPTH / 2 + 0.02], [R * Math.cos(a1), -2.4, DEPTH / 2 + 0.02]], {
    color: 0x2b2b24,
  }));

  const x1 = R * Math.cos(a1);
  const x2 = R * Math.cos(a0);

  g.add(arrow([x2, -2.1, DEPTH / 2 + 0.02], [x2, -1.0, DEPTH / 2 + 0.02], {
    color: PALETTE.bad, headLen: 0.16, headR: 0.06, shaftR: 0.02,
  }));
  g.add(arrow([x1, -1.6, DEPTH / 2 + 0.02], [x1, -0.7, DEPTH / 2 + 0.02], {
    color: PALETTE.accent3, headLen: 0.16, headR: 0.06, shaftR: 0.02,
  }));

  api.label(`T₁ = ${T(T1, 2)}`, new THREE.Vector3(x2 + 0.42, -1.9, DEPTH / 2), { style: "background:#fdecec" });
  api.label(`T₂ = ${T(T2, 2)}`, new THREE.Vector3(x1 - 0.45, -1.4, DEPTH / 2), { style: "background:#e9eff9" });
  api.label(`β = ${T(turns, 2)} × 2π`, new THREE.Vector3(0, R + 0.3, DEPTH / 2), { style: "background:#fff" });
  api.label(`μ = ${T(mu, 2)}`, new THREE.Vector3(-R - 0.35, 0, DEPTH / 2), { style: "background:#fff" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`T₁/T₂ = e^μβ`));
}

/* ==========================================================================
   Truss — members, joints and reactions, counted
   ========================================================================== */
export function truss(api, d) {
  const g = new THREE.Group();
  const m = Math.max(1, Math.round(d.m ?? 9));
  const j = Math.max(4, Math.round(d.j ?? 6));
  const r = Math.max(1, Math.round(d.r ?? 3));

  // 2(n+1) joints, 4n+1 members → pick n from the joint count
  const n = Math.max(1, Math.round(j / 2) - 1);
  const span = 4.2;
  const hgt = 1.15;
  const dx = span / n;

  const B = [], T = [];
  for (let i = 0; i <= n; i++) {
    const x = -span / 2 + i * dx;
    B.push([x, 0]);
    T.push([x, hgt]);
  }

  const members = [];
  for (let i = 0; i < n; i++) {
    members.push([B[i], B[i + 1]]);   // bottom chord
    members.push([T[i], T[i + 1]]);   // top chord
    members.push([B[i], T[i + 1]]);   // diagonal
  }
  for (let i = 0; i <= n; i++) members.push([B[i], T[i]]);  // verticals

  const D = 0.14;
  members.forEach(([A, C]) => {
    const len = Math.hypot(C[0] - A[0], C[1] - A[1]);
    const bar = box(len, 0.085, D, {
      color: PALETTE.steel,
      position: [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2, 0],
    });
    bar.rotation.z = Math.atan2(C[1] - A[1], C[0] - A[0]);
    part(g, bar, { opacity: 0.35 });
  });

  let idx = 1;
  const pinAt = (p, label) => {
    const pin = cylinder(0.055, 0.055, D * 1.4, { color: PALETTE.steelDark, segments: 14, position: [p[0], p[1], 0] });
    pin.rotation.x = Math.PI / 2;
    g.add(pin);
    if (label) api.label(String(idx++), new THREE.Vector3(p[0], p[1] - 0.22, D / 2), { style: "background:#fff" });
  };
  B.forEach((p) => pinAt(p, true));
  T.forEach((p) => pinAt(p, true));

  // supports under the end joints
  [-span / 2, span / 2].forEach((x) => {
    g.add(arrow([x, -0.62, 0], [x, -0.07, 0], {
      color: PALETTE.accent, headLen: 0.13, headR: 0.05, shaftR: 0.015,
    }));
  });
  api.label("R", new THREE.Vector3(-span / 2 - 0.4, -0.5, 0), { style: "background:#eef6ec" });
  api.label("R", new THREE.Vector3(span / 2 + 0.4, -0.5, 0), { style: "background:#eef6ec" });

  // applied load at midspan, so the truss reads as a structure
  g.add(arrow([0, hgt + 0.7, 0], [0, hgt + 0.06, 0], {
    color: PALETTE.bad, headLen: 0.15, headR: 0.055, shaftR: 0.018,
  }));
  api.label("P", new THREE.Vector3(0.28, hgt + 0.62, 0), { style: "background:#fdecec" });

  api.label(`${m} members · ${j} joints · ${r} reactions`, new THREE.Vector3(0, -1.0, 0), {
    style: "background:#e9eff9",
  });

  api.legend([
    { color: "#8b939c", label: "members" },
    { color: "#5f666e", label: "joints" },
    { color: "#2f7d32", label: "reactions" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`m + r − 2j = ${m + r - 2 * j}`));
}

/* ==========================================================================
   Steel plate in tension — bolt holes and the net section
   ========================================================================== */
export function plate(api, d) {
  const g = new THREE.Group();
  const W = 4.0, Hh = 1.0, D = 0.16;
  const holes = 3;

  part(g, prism([[-W / 2, -Hh / 2], [W / 2, -Hh / 2], [W / 2, Hh / 2], [-W / 2, Hh / 2]], D,
    { color: PALETTE.steel, opacity: 0.9 }), { opacity: 0.45 });

  // bolt holes on the critical line
  const xh = -0.5;
  for (let i = 0; i < holes; i++) {
    const y = -Hh / 2 + (Hh * (i + 0.5)) / holes;
    const hole = cylinder(0.1, 0.1, D * 1.4, { color: 0x2b2b24, segments: 20, position: [xh, y, 0] });
    hole.rotation.x = Math.PI / 2;
    g.add(hole);
  }

  // net section plane
  g.add(dashed([[xh, -Hh / 2 - 0.16, D / 2], [xh, Hh / 2 + 0.16, D / 2]], { color: PALETTE.bad, dashSize: 0.07 }));
  api.label("net section", new THREE.Vector3(xh, Hh / 2 + 0.34, D / 2), { style: "background:#fdecec" });

  // tension
  g.add(arrow([-W / 2 - 0.7, 0, 0], [-W / 2 - 0.05, 0, 0], { color: PALETTE.accent, headLen: 0.14, headR: 0.05, shaftR: 0.016 }));
  g.add(arrow([W / 2 + 0.7, 0, 0], [W / 2 + 0.05, 0, 0], { color: PALETTE.accent, headLen: 0.14, headR: 0.05, shaftR: 0.016 }));
  api.label("T", new THREE.Vector3(-W / 2 - 0.55, 0.28, 0), { style: "background:#eef6ec" });
  api.label("T", new THREE.Vector3(W / 2 + 0.55, 0.28, 0), { style: "background:#eef6ec" });

  api.label(`A_g = ${T(d.Ag, 0)} mm²`, new THREE.Vector3(0.7, Hh / 2 + 0.3, 0), { style: "background:#e9eff9" });
  api.label(`A_n = ${T(d.An, 0)} mm²`, new THREE.Vector3(0.7, -Hh / 2 - 0.3, 0), { style: "background:#fceaf1" });

  api.legend([
    { color: "#8b939c", label: "gross section A_g" },
    { color: "#c0392b", label: "net section through the holes" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`φP_n = ${T(Math.min(0.9 * d.Fy * d.Ag, 0.75 * d.Fu * d.U * d.An) / 1000, 0)} kN`));
}

/* ==========================================================================
   T-beam section — flange and web to scale
   ========================================================================== */
export function tbeam(api, d) {
  const g = new THREE.Group();
  const bw = d.bw ?? 300, hf = d.hf ?? 120;
  const bf = Math.min((d.L ?? 7.5) * 1000 / 4, bw + 16 * hf, bw + ((d.s1 ?? 2400) + (d.s2 ?? 2400)) / 2);
  const dEff = hf + 420;
  const k = 2.8 / Math.max(bf, dEff);
  const W = bf * k, wb = bw * k, hfl = hf * k, H = dEff * k;
  const D = 1.0;

  const pts = [
    [-W / 2, 0], [W / 2, 0], [W / 2, -hfl], [wb / 2, -hfl],
    [wb / 2, -H], [-wb / 2, -H], [-wb / 2, -hfl], [-W / 2, -hfl],
  ];
  part(g, prism(pts, D, { color: PALETTE.concrete, capColor: shade(PALETTE.concrete, 1.1) }), { opacity: 0.45 });

  // reinforcement in the web
  for (let i = 0; i < 3; i++) {
    const bar = cylinder(0.05, 0.05, D + 0.02, { color: 0xb0552b, segments: 14 });
    bar.rotation.x = Math.PI / 2;
    bar.position.set(-wb / 2 + (wb * (i + 0.5)) / 3, -H + 0.12, 0);
    g.add(bar);
  }

  // effective flange width bracket
  g.add(dimLine([-W / 2, 0.28, 0], [W / 2, 0.28, 0], { tick: 0.08, color: PALETTE.accent2 }));
  api.label(`b_f = ${T(bf, 0)} mm`, new THREE.Vector3(0, 0.52, 0), { style: "background:#fceaf1" });
  api.label(`b_w = ${T(bw, 0)}`, new THREE.Vector3(wb / 2 + 0.55, -H * 0.6, 0), { style: "background:#fff" });
  api.label(`h_f = ${T(hf, 0)}`, new THREE.Vector3(-W / 2 - 0.6, -hfl / 2, 0), { style: "background:#eef6ec" });

  api.legend([
    { color: "#b9b6ab", label: "concrete section" },
    { color: "#b0552b", label: "tension steel" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`flange + web`));
}

/* ==========================================================================
   Impact — a weight dropped onto a member
   ========================================================================== */
export function impact(api, d) {
  const g = new THREE.Group();
  const h = Math.min(d.h ?? 100, 400);
  const barH = 2.4;
  const drop = 0.4 + (h / 400) * 1.2;
  // recompute the two deflections here so the model is self-contained
  const dst = ((d.P ?? 10) * 1e3 * (d.L ?? 3)) / ((d.A ?? 1200) * (d.E ?? 200) * 1e3);
  const di = dst * (1 + Math.sqrt(1 + (2 * (h / 1000)) / dst));
  const factor = di / dst;

  // member
  const bar = box(0.16, barH, 0.16, { color: PALETTE.steel, position: [0, -barH / 2, 0] });
  part(g, bar, { opacity: 0.45 });

  // base
  part(g, prism([[-0.6, -barH], [0.6, -barH], [0.6, -barH - 0.16], [-0.6, -barH - 0.16]], 0.9,
    { color: PALETTE.concreteDark }), { opacity: 0.4 });

  // falling weight
  const w = box(0.34, 0.22, 0.34, { color: PALETTE.bad, position: [0, drop, 0] });
  part(g, w, { opacity: 0.4 });

  // drop height
  g.add(dimLine([0.42, drop, 0], [0.42, 0, 0], { tick: 0.07, color: PALETTE.accent2 }));
  api.label(`h = ${T(h, 0)} mm`, new THREE.Vector3(1.05, drop / 2, 0), { style: "background:#fceaf1" });

  g.add(arrow([0, drop + 0.45, 0], [0, drop + 0.2, 0], { color: PALETTE.accent, headLen: 0.1, headR: 0.04, shaftR: 0.012 }));
  api.label(`P = ${T(d.P, 1)} kN`, new THREE.Vector3(0.5, drop + 0.42, 0), { style: "background:#eef6ec" });

  // deflected position
  g.add(dashed([[0, 0, 0], [0, -0.35, 0]], { color: PALETTE.accent3, dashSize: 0.06 }));
  api.label(`δ_i = ${T(di * 1000, 2)} mm`, new THREE.Vector3(-0.75, -0.2, 0), { style: "background:#e9eff9" });

  api.legend([
    { color: "#c0392b", label: "dropped weight" },
    { color: "#8b939c", label: "member" },
  ]);
  api.add(g);
  api.hud && api.hud.appendChild(chip(`impact factor ${T(factor, 2)}`));
}

/* ========================================================================== */
function chip(text) {
  const el = document.createElement("span");
  el.className = "chip";
  el.textContent = text;
  return el;
}
