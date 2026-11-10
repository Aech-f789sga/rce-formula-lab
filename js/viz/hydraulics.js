/* ==========================================================================
   viz/hydraulics.js — 2.5D models for the hydraulics section
   ========================================================================== */

import {
  THREE, PALETTE, prism, box, cylinder, face, polyline, dashed,
  arrow, dimLine, part, shade, ring,
} from "./scene.js";

const T = (n, d = 2) => Number(n).toFixed(d);

const WATER = 0x7fa9c9;

/* ==========================================================================
   Gravity dam — section with water, uplift and the resultant
   ========================================================================== */
export function dam(api, d) {
  const g = new THREE.Group();
  const { H, B, tw, FH, Ry, xbar, hw } = d;
  const D = 2.2;

  // dam body (trapezoid: vertical upstream face on the left)
  const body = prism(
    [[0, 0], [B, 0], [tw, H], [0, H]],
    D,
    { color: PALETTE.concrete, capColor: shade(PALETTE.concrete, 1.08) }
  );
  part(g, body, { opacity: 0.65 });

  // upstream water
  const water = prism(
    [[-H * 0.55, 0], [0, 0], [0, H], [-H * 0.55, H]],
    D,
    { color: WATER, capColor: shade(WATER, 1.12), opacity: 0.45 }
  );
  part(g, water, { opacity: 0.3 });

  // tailwater
  if (hw > 0.05) {
    const tw2 = prism(
      [[B, 0], [B + hw * 0.7, 0], [B + hw * 0.7, hw], [B, hw]],
      D,
      { color: WATER, opacity: 0.4 }
    );
    part(g, tw2, { opacity: 0.25 });
  }

  // uplift pressure triangle under the base
  const upPts = [[0, 0], [B, 0], [0, -Math.max(H * 0.16, 0.3)]];
  g.add(face(upPts, { color: PALETTE.warn, opacity: 0.3, position: [0, 0, D / 2 + 0.01] }));
  g.add(polyline(upPts.map(([x, y]) => [x, y, D / 2 + 0.02]), { color: PALETTE.warn }));

  // horizontal water force
  const yH = H / 3;
  g.add(arrow([-H * 0.62, yH, D / 2 + 0.02], [-0.06, yH, D / 2 + 0.02], {
    color: PALETTE.accent3, headLen: 0.28, headR: 0.1, shaftR: 0.032,
  }));
  api.label(`F_H = ${T(FH, 0)} kN`, new THREE.Vector3(-H * 0.30, H * 0.92, D / 2 + 0.02), { style: "background:#e9eff9" });

  // resultant (lever arm measured from the toe, so convert back to the heel)
  const xr = Math.min(Math.max(B - xbar, 0.1), B);
  g.add(arrow([xr, H * 0.62, D / 2 + 0.05], [xr, -0.12, D / 2 + 0.05], {
    color: PALETTE.bad, headLen: 0.24, headR: 0.09, shaftR: 0.03,
  }));
  api.label(`R_y = ${T(Ry, 0)} kN`, new THREE.Vector3(xr + 1.6, H * 0.8, D / 2 + 0.05), { style: "background:#fdecec" });

  // foundation pressure arrows — peak at the toe (x = B), minimum at the heel
  const qmax = Math.max(d.qmax || 0, 0);
  const qmin = Math.max(d.qmin || 0, 0);
  const qs = 0.9 / Math.max(qmax, 1);
  for (let i = 0; i <= 6; i++) {
    const x = (i / 6) * B;
    const q = qmin + ((qmax - qmin) * i) / 6;
    if (q * qs < 0.02) continue;
    g.add(arrow([x, -0.02, D / 2 + 0.03], [x, -0.02 - q * qs, D / 2 + 0.03], {
      color: PALETTE.accent, headLen: 0.07, headR: 0.028, shaftR: 0.009,
    }));
  }

  api.label(`B = ${T(B)} m`, new THREE.Vector3(B * 0.5, -1.0, D / 2), { style: "background:#fff" });
  api.label(`H = ${T(H)} m`, new THREE.Vector3(-H * 0.78, H * 0.5, D / 2), { style: "background:#fff" });
  g.add(dimLine([-H * 0.62, 0, 0], [-H * 0.62, H, 0], { tick: 0.1 }));
  g.add(dimLine([0, -0.55, 0], [B, -0.55, 0], { tick: 0.1 }));

  api.add(g);
  api.hud && api.hud.appendChild(chip(`FS_o ${T(d.FSo, 2)} · FS_s ${T(d.FSs, 2)}`));
}

/* ==========================================================================
   Trapezoidal channel — water prism in a cut section
   ========================================================================== */
export function channel(api, d) {
  const g = new THREE.Group();
  const { b, d: dep, z } = d;
  const LEN = 4.2;
  const th = 0.2;          // lining thickness
  const base = 0.14;       // lining thickness under the bed

  // U-shaped lining: outer skin then inner skin, so the opening stays open
  const outerL = -(b / 2 + z * dep + th);
  const outerR = b / 2 + z * dep + th;
  const pts = [
    [outerL, dep + th],       // outer top-left
    [-b / 2 - th, -base],     // outer bottom-left
    [b / 2 + th, -base],      // outer bottom-right
    [outerR, dep + th],       // outer top-right
    [b / 2 + z * dep, dep],   // inner top-right
    [b / 2, 0],               // inner bottom-right
    [-b / 2, 0],              // inner bottom-left
    [-b / 2 - z * dep, dep],  // inner top-left
  ];
  const lining = prism(pts, LEN, { color: PALETTE.concrete, capColor: shade(PALETTE.concrete, 1.06) });
  part(g, lining, { opacity: 0.45 });

  // water prism, sitting inside the lining
  const wpts = [[-b / 2, 0], [b / 2, 0], [b / 2 + z * dep, dep], [-b / 2 - z * dep, dep]];
  const water = prism(wpts, LEN - 0.02, { color: WATER, capColor: shade(WATER, 1.18), opacity: 0.62 });
  part(g, water, { opacity: 0.45 });

  // water surface
  g.add(face([[-b / 2 - z * dep, dep], [b / 2 + z * dep, dep], [b / 2 + z * dep, dep], [-b / 2 - z * dep, dep]], {
    color: 0xa9c6da, opacity: 0.5,
  }));

  api.label(`b = ${T(b)} m`, new THREE.Vector3(0, -0.34, LEN / 2 + 0.05), { style: "background:#e9eff9" });
  api.label(`d = ${T(dep)} m`, new THREE.Vector3(b / 2 + z * dep + 0.85, dep / 2, LEN / 2), { style: "background:#e9eff9" });
  api.label(`z = ${T(z, 1)}H : 1V`, new THREE.Vector3(-(b / 2 + z * dep) - 0.95, dep * 0.6, LEN / 2), { style: "background:#fff" });

  // water surface line on the front face
  g.add(polyline([[-b / 2 - z * dep, dep, LEN / 2 + 0.01], [b / 2 + z * dep, dep, LEN / 2 + 0.01]], {
    color: PALETTE.waterDark,
  }));

  // flow arrow along the channel
  g.add(arrow([0, dep * 0.45, -LEN / 2 + 0.25], [0, dep * 0.45, LEN / 2 - 0.25], {
    color: 0x2f7d32, headLen: 0.38, headR: 0.1, shaftR: 0.028,
  }));

  if (d.dc) {
    g.add(dashed([[-b / 2 - z * d.dc, d.dc, LEN / 2], [b / 2 + z * d.dc, d.dc, LEN / 2]], {
      color: PALETTE.bad, dashSize: 0.12,
    }));
    api.label(`d_c = ${T(d.dc)} m`, new THREE.Vector3(b / 2 + z * d.dc + 0.55, d.dc, LEN / 2), { style: "background:#fdecec" });
  }

  api.add(g);
  api.hud && api.hud.appendChild(chip(`Q ${T(d.Q, 3)} m³/s · v ${T(d.v, 3)} m/s`));
}

/* ==========================================================================
   Pipe with hoop stress
   ========================================================================== */
export function pipe(api, d) {
  const g = new THREE.Group();
  const scale = 2.4 / Math.max(d.D, 1);
  const R = (d.D / 2) * scale;
  const t = Math.max(d.t * scale, 0.05);
  const LEN = 3.4;

  const outer = cylinder(R + t, R + t, LEN, { color: PALETTE.steel, metalness: 0.35, roughness: 0.45, open: true });
  outer.rotation.x = Math.PI / 2;
  part(g, outer, { opacity: 0.5 });

  const inner = cylinder(R, R, LEN + 0.02, { color: 0x9fb6c6, open: true, opacity: 0.9 });
  inner.rotation.x = Math.PI / 2;
  g.add(inner);

  // water core
  const core = cylinder(R * 0.97, R * 0.97, LEN * 0.98, { color: WATER, opacity: 0.4, open: true });
  core.rotation.x = Math.PI / 2;
  g.add(core);

  // hoop stress arrows around the circumference
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * (R + t + 0.06);
    const y = Math.sin(a) * (R + t + 0.06);
    const x2 = Math.cos(a) * (R + t + 0.42);
    const y2 = Math.sin(a) * (R + t + 0.42);
    g.add(arrow([x, y, 0], [x2, y2, 0], {
      color: PALETTE.accent2, headLen: 0.1, headR: 0.04, shaftR: 0.012,
    }));
  }

  api.label(`D = ${T(d.D, 0)} mm`, new THREE.Vector3(0, -R - t - 0.4, LEN / 2), { style: "background:#e9eff9" });
  api.label(`t = ${T(d.t, 2)} mm`, new THREE.Vector3(R + t + 0.55, 0, LEN / 2), { style: "background:#fceaf1" });
  api.label(`p = ${T(d.p, 2)} MPa`, new THREE.Vector3(0, R + t + 0.45, LEN / 2), { style: "background:#fff" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`hoop tension splits the pipe along its length`));
}

/* ==========================================================================
   Floating body — metacenter and righting moment
   ========================================================================== */
export function buoy(api, d) {
  const g = new THREE.Group();
  const { L, B, D, draft, MG, theta } = d;
  const s = 2.6 / Math.max(L, B, D);
  const l = L * s, w = B * s, h = D * s, dr = draft * s;

  // water volume
  const water = prism([[-l, -1.4], [l, -1.4], [l, 0], [-l, 0]], 2.2, {
    color: WATER, capColor: shade(WATER, 1.1), opacity: 0.35,
  });
  part(g, water, { opacity: 0.22 });

  // body, tilted about its long axis. Water surface is y = 0 and the body
  // sinks by `draft`, so its underside sits at y = −draft.
  const tilt = THREE.MathUtils.degToRad(theta || 0);
  const bodyGrp = new THREE.Group();
  const body = box(w, h, l, { color: 0xe0d6c3, position: [0, h / 2 - dr, 0] });
  part(bodyGrp, body, { opacity: 0.6 });
  bodyGrp.rotation.z = tilt;
  g.add(bodyGrp);

  // centre of gravity, centre of buoyancy, metacentre
  const cgY = h / 2 - dr;
  const cbY = -dr / 2;
  const mY = cgY + MG * s;

  const dot = (y, color, r = 0.06) => {
    const m = cylinder(r, r, 0.05, { color, segments: 20, position: [0, y, l / 2 + 0.02] });
    m.rotation.x = Math.PI / 2;
    return m;
  };
  g.add(dot(cgY, PALETTE.bad));
  g.add(dot(cbY, PALETTE.accent3));
  g.add(dot(mY, PALETTE.accent, 0.048));

  api.label("G", new THREE.Vector3(-0.22, cgY, l / 2 + 0.02), { style: "background:#fdecec" });
  api.label("B", new THREE.Vector3(-0.22, cbY, l / 2 + 0.02), { style: "background:#e9eff9" });
  api.label("M", new THREE.Vector3(-0.22, mY, l / 2 + 0.02), { style: "background:#eef6ec" });

  // waterline
  g.add(polyline([[-l - 0.2, 0, 1.12], [l + 0.2, 0, 1.12]], { color: PALETTE.waterDark }));
  api.label("waterline", new THREE.Vector3(l + 0.55, 0, 1.12), { style: "background:#eaf0f8" });

  api.label(`MG = ${T(MG, 3)} m`, new THREE.Vector3(w / 2 + 0.6, (mY + cgY) / 2, l / 2), {
    style: MG > 0 ? "background:#e9f5ea" : "background:#fdecec",
  });
  api.label(`draft ${T(draft, 2)} m`, new THREE.Vector3(0, -0.35, l / 2), { style: "background:#fff" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(MG > 0 ? "stable — M above G" : "unstable — M below G"));
}

/* ==========================================================================
   Inclined gate with pressure prism
   ========================================================================== */
export function gate(api, d) {
  const g = new THREE.Group();
  const { b, hgt, theta, d: dep } = d;
  const th = THREE.MathUtils.degToRad(theta);
  const S = 2.0 / Math.max(hgt, dep, 1);       // one scale for the whole scene
  const gw = hgt * S;                          // gate length along the incline
  const gd = Math.min(b * S, 2.2);             // gate width into the screen
  const topY = dep * S + gw * Math.sin(th);
  const hingeX = -Math.max(gw * Math.cos(th) * 0.55, 0.4);

  // water body behind the gate
  const water = prism(
    [[-2.6, 0], [hingeX + 0.05, 0], [hingeX + 0.05, topY], [-2.6, topY]],
    gd * 1.1,
    { color: WATER, capColor: shade(WATER, 1.12), opacity: 0.4 }
  );
  part(g, water, { opacity: 0.22 });

  // free surface
  g.add(polyline([[-2.6, topY, gd * 0.56], [hingeX + 0.05, topY, gd * 0.56]], { color: PALETTE.waterDark }));

  // the gate: a thin inclined slab from the hinge
  const dx = Math.cos(th), dy = Math.sin(th);
  const nx = -dy * 0.045, ny = dx * 0.045;      // slab thickness normal
  const A = [hingeX, dep * S], B = [hingeX + gw * dx, dep * S + gw * dy];
  const gateMesh = prism(
    [
      [A[0] + nx, A[1] + ny], [B[0] + nx, B[1] + ny],
      [B[0] - nx, B[1] - ny], [A[0] - nx, A[1] - ny],
    ],
    gd,
    { color: PALETTE.steel, capColor: shade(PALETTE.steel, 1.15) }
  );
  part(g, gateMesh, { opacity: 0.5 });

  // hinge pin
  const pin = cylinder(0.05, 0.05, gd * 1.05, { color: PALETTE.steelDark, segments: 16, position: [A[0], A[1], 0] });
  pin.rotation.x = Math.PI / 2;
  g.add(pin);

  // force, acting perpendicular to the gate at the centre of pressure
  const cx = A[0] + gw * dx * 0.5, cy = A[1] + gw * dy * 0.5;
  const fLen = 0.85;
  g.add(arrow([cx - dy * (fLen + 0.1), cy + dx * (fLen + 0.1), gd * 0.58],
              [cx - dy * 0.12, cy + dx * 0.12, gd * 0.58], {
    color: PALETTE.accent3, headLen: 0.16, headR: 0.055, shaftR: 0.018,
  }));

  api.label(`F = ${T(d.F, 1)} kN`, new THREE.Vector3(cx + 0.62, cy - 0.34, gd * 0.58), {
    style: "background:#e9eff9",
  });
  api.label(`y_p = ${T(d.yp, 2)} m`, new THREE.Vector3(B[0] + 0.55, B[1] + 0.1, gd * 0.58), { style: "background:#fceaf1" });
  api.label(`θ = ${T(theta, 0)}°`, new THREE.Vector3(A[0] - 0.45, A[1] + 0.22, gd * 0.58), { style: "background:#fff" });
  api.label(`d = ${T(dep, 1)} m`, new THREE.Vector3(-2.35, topY + 0.22, gd * 0.58), { style: "background:#fff" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`plane surface · force at the centroid depth`));
}

/* ==========================================================================
   Orifice — tank and jet
   ========================================================================== */
export function orifice(api, d) {
  const g = new THREE.Group();
  const { h } = d;
  const s = 2.2 / Math.max(h * 1.4, 1);
  const H = h * s;
  const W = 1.5;

  const water = prism([[-W / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]], 1.6, {
    color: WATER, capColor: shade(WATER, 1.1), opacity: 0.42,
  });
  part(g, water, { opacity: 0.25 });

  // tank walls
  g.add(polyline([[-W / 2, 0, 0.81], [-W / 2, H + 0.1, 0.81]], { color: 0x2b2b24 }));
  g.add(polyline([[W / 2, 0, 0.81], [W / 2, H + 0.1, 0.81]], { color: 0x2b2b24 }));
  g.add(polyline([[-W / 2, 0, 0.81], [W / 2, 0, 0.81]], { color: 0x2b2b24 }));

  // jet: parabola-ish arc leaving the orifice
  const jetPts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = W / 2 + t * 1.7;
    const y = 0.12 - 1.25 * t * t;
    jetPts.push([x, y, 0.81]);
  }
  g.add(polyline(jetPts, { color: PALETTE.accent3 }));
  api.label(`v = ${T(d.vact, 2)} m/s`, new THREE.Vector3(W / 2 + 0.9, 0.55, 0.81), { style: "background:#e9eff9" });

  api.label(`h = ${T(h)} m`, new THREE.Vector3(-W / 2 - 0.45, H / 2, 0.81), { style: "background:#fff" });
  g.add(dimLine([-W / 2 - 0.25, 0, 0], [-W / 2 - 0.25, H, 0], { tick: 0.08 }));

  api.add(g);
  api.hud && api.hud.appendChild(chip(`Q ${T(d.Q * 1000, 2)} L/s`));
}

/* ==========================================================================
   Weir — crest, head and nappe
   ========================================================================== */
export function weir(api, d) {
  const g = new THREE.Group();
  const { H, L } = d;
  const tri = !!d.tri;
  const s = 2.6 / Math.max(L, H * 4, 1);
  const w = L * s;
  const hh = H * s;

  // weir wall
  const wallPts = tri
    ? [[-w / 2, 0], [w / 2, 0], [w / 2, 1.5], [0.18, 1.5], [0, 1.5 - 0.5], [-0.18, 1.5], [-w / 2, 1.5]]
    : [[-w / 2, 0], [w / 2, 0], [w / 2, 1.5], [-w / 2, 1.5]];
  const wall = prism(wallPts, 1.4, { color: PALETTE.concrete, capColor: shade(PALETTE.concrete, 1.08) });
  part(g, wall, { opacity: 0.6 });

  // upstream water
  const water = prism([[-w / 2 - 0.5, 0], [-w / 2, 0], [-w / 2, 1.5 + hh], [-w / 2 - 0.5, 1.5 + hh]], 1.4, {
    color: WATER, opacity: 0.45,
  });
  part(g, water, { opacity: 0.25 });

  // head dimension
  g.add(dimLine([-w / 2 - 0.22, 1.5, 0], [-w / 2 - 0.22, 1.5 + hh, 0], { tick: 0.07, color: PALETTE.accent2 }));
  api.label(`H = ${T(H, 3)} m`, new THREE.Vector3(-w / 2 - 0.75, 1.5 + hh / 2, 0.71), { style: "background:#fceaf1" });

  // nappe
  const nappe = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    nappe.push([-w / 2 + t * (w * 0.9), 1.5 + hh * (1 - t * t) * 0.9 + 0.02, 0.71]);
  }
  g.add(polyline(nappe, { color: PALETTE.waterDark }));

  api.label(`L = ${T(L, 2)} m`, new THREE.Vector3(0, 0.35, 0.71), { style: "background:#e9eff9" });
  api.label(`Q = ${T(d.Q, 4)} m³/s`, new THREE.Vector3(w / 2 + 0.55, 1.5 + hh * 0.4, 0.71), { style: "background:#eef6ec" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(tri ? "V-notch · Q ∝ H^2.5" : "rectangular · Q ∝ H^1.5"));
}

/* ==========================================================================
   Hydraulic jump
   ========================================================================== */
export function jump(api, d) {
  const g = new THREE.Group();
  const { d1, d2, b } = d;
  const LEN = 4.4;                        // drawn channel length
  const metres = 9 * d2;                  // metres represented by LEN
  const sc = LEN / metres;                // one common scale, so the profile is true
  const h1 = Math.max(d1 * sc, 0.04);
  const h2 = d2 * sc;
  const W = Math.min(Math.max(b * sc * 1.6, 0.5), 1.6);

  // water profile: shallow supercritical flow, then the jump, then subcritical
  const x0 = -LEN / 2;
  const xj = x0 + LEN * 0.34;
  const prof = [
    [x0, 0],
    [x0, h1],
    [xj, h1],
    [xj + LEN * 0.06, h2 * 0.92],
    [LEN / 2, h2],
    [LEN / 2, 0],
  ];
  const mesh = prism(prof, W, { color: WATER, capColor: shade(WATER, 1.12), opacity: 0.55 });
  part(g, mesh, { opacity: 0.4 });

  // surface line
  g.add(polyline(prof.slice(1, 5).map(([x, y]) => [x, y, W / 2 + 0.01]), { color: PALETTE.waterDark }));

  // surface roller at the toe of the jump
  const roller = cylinder(h1 * 0.8, h1 * 0.8, W * 0.55, { color: 0xffffff, opacity: 0.55, segments: 20 });
  roller.rotation.x = Math.PI / 2;
  roller.position.set(xj - h1 * 0.6, h1 * 0.9, 0);
  g.add(roller);

  // bed
  g.add(polyline([[x0 - 0.2, 0, W / 2], [LEN / 2 + 0.2, 0, W / 2]], { color: 0x2b2b24 }));

  api.label(`d₁ = ${T(d1, 2)} m`, new THREE.Vector3(x0 + 0.35, h1 + 0.28, W / 2), { style: "background:#e9eff9" });
  api.label(`d₂ = ${T(d2, 2)} m`, new THREE.Vector3(LEN / 2 - 0.35, h2 + 0.28, W / 2), { style: "background:#e9eff9" });
  api.label(`HL = ${T(d.HL, 3)} m`, new THREE.Vector3(0.1, h2 + 0.62, W / 2), { style: "background:#fdecec" });
  api.label("jump", new THREE.Vector3(xj + 0.15, h2 * 0.55, W / 2 + 0.01), { style: "background:#fff" });

  // upstream velocity
  g.add(arrow([x0 + 0.15, h1 * 0.5, W / 2], [xj - 0.5, h1 * 0.5, W / 2], {
    color: 0x2f7d32, headLen: 0.22, headR: 0.07, shaftR: 0.02,
  }));

  api.add(g);
  api.hud && api.hud.appendChild(chip(`N_F1 ${T(d.v1 / Math.sqrt(9.81 * d1), 2)} · subcritical after`));
}

/* ==========================================================================
   EGL / HGL energy diagram
   ========================================================================== */
export function egl(api, d) {
  const g = new THREE.Group();
  const { E1, E2, HA, HL } = d;
  const LEN = 3.8;
  const maxE = Math.max(E1, E2, 1);
  const k = 1.35 / maxE;              // vertical scale for the energy lines

  const e1 = E1 * k, e2 = E2 * k, hl = HL * k;

  // pipe, drawn to its own scale so it stays a pipe
  const pipeMesh = cylinder(0.075, 0.075, LEN, { color: PALETTE.steel, metalness: 0.3, segments: 24 });
  pipeMesh.rotation.z = Math.PI / 2;
  pipeMesh.position.y = 0.075;
  part(g, pipeMesh, { opacity: 0.4 });

  // datum
  g.add(polyline([[-LEN / 2 - 0.2, 0, 0], [LEN / 2 + 0.3, 0, 0]], { color: 0x2b2b24, opacity: 0.7 }));
  api.label("datum", new THREE.Vector3(LEN / 2 + 0.5, 0, 0), { style: "opacity:.8" });

  const xp = LEN * 0.06;
  // energy grade line
  const egPts = [
    [-LEN / 2, e1, 0],
    [xp, e1, 0],
    [xp, e2, 0],
    [LEN / 2, e2 - hl, 0],
  ];
  g.add(polyline(egPts, { color: PALETTE.accent2 }));

  // hydraulic grade line, one velocity head below
  const vh = Math.max(e1 * 0.06, 0.04);
  const hgPts = egPts.map(([x, y]) => [x, y - vh, 0]);
  g.add(polyline(hgPts, { color: PALETTE.accent3 }));

  api.label("EGL", new THREE.Vector3(-LEN / 2 - 0.55, e1 + 0.1, 0), { style: "background:#fceaf1" });
  api.label("HGL", new THREE.Vector3(-LEN / 2 - 0.55, e1 - vh - 0.1, 0), { style: "background:#e9eff9" });

  // pump symbol on the pipe
  const pump = cylinder(0.13, 0.13, 0.1, { color: PALETTE.accent, segments: 24, position: [xp, 0.075, 0] });
  pump.rotation.z = Math.PI / 2;
  g.add(pump);

  // head-added dimension
  g.add(dimLine([xp - 0.28, e1, 0], [xp - 0.28, e2, 0], { tick: 0.07, color: PALETTE.accent }));
  api.label(`H_A = ${T(HA, 2)} m`, new THREE.Vector3(xp - 0.55, (e1 + e2) / 2, 0), { style: "background:#eef6ec" });
  api.label(`HL = ${T(HL, 2)} m`, new THREE.Vector3(LEN / 2 - 0.5, e2 - hl - 0.16, 0), { style: "background:#fdecec" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(`E₁ ${T(E1, 1)} m → E₂ ${T(E2, 1)} m`));
}

/* ==========================================================================
   Jet on a vane
   ========================================================================== */
export function jet(api, d) {
  const g = new THREE.Group();
  const { V, u, beta } = d;
  const s = 2.0 / Math.max(V, 1);

  // nozzle
  const noz = cylinder(0.1, 0.22, 0.7, { color: PALETTE.steel });
  noz.rotation.z = -Math.PI / 2;
  noz.position.set(-1.7, 0, 0);
  part(g, noz, { opacity: 0.5 });

  // jet
  const jetPts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    jetPts.push([-1.2 + t * 1.2, 0, 0]);
  }
  g.add(polyline(jetPts, { color: PALETTE.accent3 }));

  // vane
  const b = THREE.MathUtils.degToRad(beta);
  const curve = [];
  const R = 0.5;
  for (let i = 0; i <= 20; i++) {
    const a = -b / 2 + (b * i) / 20;
    curve.push([0.05 + R * Math.cos(a) - R, R * Math.sin(a), 0]);
  }
  g.add(polyline(curve, { color: PALETTE.ink }));

  // leaving jet
  g.add(polyline([[0.05, 0, 0], [0.05 - 0.9 * Math.cos(b / 2), 0.9 * Math.sin(b / 2), 0]], { color: PALETTE.accent3, opacity: 0.7 }));
  g.add(polyline([[0.05, 0, 0], [0.05 - 0.9 * Math.cos(b / 2), -0.9 * Math.sin(b / 2), 0]], { color: PALETTE.accent3, opacity: 0.7 }));

  api.label(`V = ${T(V, 1)} m/s`, new THREE.Vector3(-0.9, 0.2, 0), { style: "background:#e9eff9" });
  api.label(`F = ${T(d.F, 0)} N`, new THREE.Vector3(0.55, 0.1, 0), { style: "background:#fceaf1" });
  api.label(`β = ${T(beta, 0)}°`, new THREE.Vector3(0.1, -0.6, 0), { style: "background:#fff" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(u > 0 ? `moving vane, u = ${T(u, 1)} m/s` : "stationary vane"));
}

/* ==========================================================================
   Rotating vessel — paraboloid of revolution
   ========================================================================== */
export function rotating(api, d) {
  const g = new THREE.Group();
  const { R, H, yEdge, w } = d;
  const s = 2.2 / Math.max(R * 2, H);
  const r = R * s, hh = H * s, y = Math.min(yEdge * s, hh * 1.6);

  // vessel
  const vessel = cylinder(r, r, hh, { color: 0xd9d5c8, open: true, opacity: 0.5 });
  vessel.position.y = hh / 2;
  part(g, vessel, { opacity: 0.3 });

  // water body: cylinder minus paraboloid → approximate with a lathe
  const pts = [];
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const rr = (i / N) * r;
    pts.push(new THREE.Vector2(rr, hh - (y / 2) + (y / 2) * Math.pow(rr / r, 2)));
  }
  pts.push(new THREE.Vector2(r, 0));
  pts.push(new THREE.Vector2(0, 0));
  const lathe = new THREE.LatheGeometry(pts, 48);
  const mesh = new THREE.Mesh(lathe, new THREE.MeshStandardMaterial({
    color: WATER, transparent: true, opacity: 0.45, roughness: 0.4, side: THREE.DoubleSide,
  }));
  mesh.castShadow = true;
  g.add(mesh);

  // free-surface parabola
  const surf = [];
  for (let i = 0; i <= 40; i++) {
    const rr = -r + (2 * r * i) / 40;
    surf.push([rr, hh - (y / 2) + (y / 2) * Math.pow(rr / r, 2), 0]);
  }
  g.add(polyline(surf, { color: PALETTE.waterDark }));

  // rotation arrow
  const ringM = ring(r * 0.92, r * 0.97, { color: PALETTE.accent2, opacity: 0.9 });
  ringM.position.y = hh + 0.02;
  g.add(ringM);
  api.label(`ω = ${T(w, 2)} rad/s`, new THREE.Vector3(r + 0.55, hh + 0.1, 0), { style: "background:#fceaf1" });
  api.label(`y = ${T(yEdge, 3)} m`, new THREE.Vector3(r + 0.5, hh - y / 2, 0), { style: "background:#e9eff9" });

  api.add(g);
  api.hud && api.hud.appendChild(chip(yEdge > H ? "would spill" : "contained"));
}

/* ========================================================================== */
function chip(text) {
  const el = document.createElement("span");
  el.className = "chip";
  el.textContent = text;
  return el;
}
