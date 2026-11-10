/* ==========================================================================
   data/hydraulics.js — Hydraulics
   Transcribed from FORMULA CARD (Engr. APJO), pages 16–31.
   ========================================================================== */

import { texNum as N, fmt } from "../core.js";

const GW = 9.81;
const G = 9.81;

const hyd = (o) => ({ section: "hydraulics", ...o });

export const HYDRAULICS = [

  /* ---------------------------------------------------------------- 1 */
  hyd({
    id: "hyd-props",
    group: "Fluid Properties",
    title: "Fluid Properties",
    lede: "Unit weight, density, specific gravity, specific volume, dynamic and kinematic viscosity — the set the card opens with.",
    formula: String.raw`\gamma=\rho g \qquad sg=\frac{\rho}{\rho_w}=\frac{\gamma}{\gamma_w} \qquad \nu=\frac{\mu}{\rho}`,
    pages: [16],
    keywords: ["density", "unit weight", "specific gravity", "viscosity", "specific volume"],
    inputs: [
      { k: "rho", label: "Density", sym: "ρ", unit: "kg/m³", def: 1025, step: 1 },
      { k: "mu", label: "Dynamic (absolute) viscosity", sym: "μ", unit: "Pa·s", def: 0.00108, step: 0.00001 },
      { k: "rw", label: "Density of water", sym: "ρ_w", unit: "kg/m³", def: 1000, step: 1 },
    ],
    run(v) {
      const { rho, mu, rw } = v;
      const gamma = rho * G;
      const sg = rho / rw;
      const nu = mu / rho;
      const vs = 1 / rho;
      return {
        results: [
          { label: "Unit weight", sym: "γ", value: gamma, unit: "N/m³", hero: true },
          { label: "Unit weight", sym: "γ", value: gamma / 1000, unit: "kN/m³" },
          { label: "Specific gravity", sym: "sg", value: sg, digits: 5 },
          { label: "Kinematic viscosity", sym: "ν", value: nu, unit: "m²/s", digits: 4 },
          { label: "Kinematic viscosity", sym: "ν", value: nu * 1e6, unit: "mm²/s (cSt)", digits: 4 },
          { label: "Specific volume", sym: "v_s", value: vs, unit: "m³/kg", digits: 4 },
        ],
        steps: [
          { title: "Unit weight", tex: String.raw`\gamma=\rho g=(${N(rho)})(${N(G)})=${N(gamma)}\ \text{N/m}^3=${N(gamma / 1000)}\ \text{kN/m}^3` },
          { title: "Specific gravity", tex: String.raw`sg=\frac{\rho}{\rho_w}=\frac{${N(rho)}}{${N(rw)}}=${N(sg, 5)}` },
          {
            title: "Kinematic viscosity",
            tex: String.raw`\nu=\frac{\mu}{\rho}=\frac{${N(mu, 4)}}{${N(rho)}}=${N(nu, 4)}\ \text{m}^2\text{/s}`,
            note: "Seawater at 20 °C sits near 1.05 × 10⁻⁶ m²/s, so this value is physically sensible.",
          },
          { title: "Specific volume", tex: String.raw`v_s=\frac{1}{\rho}=\frac{1}{${N(rho)}}=${N(vs, 4)}\ \text{m}^3\text{/kg}` },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 2 */
  hyd({
    id: "hyd-plane",
    group: "Hydrostatics",
    title: "Force on a Plane Surface & Centre of Pressure",
    lede: "Total hydrostatic force on an inclined gate, and where it actually acts — the centroid offset e = I_g / (Aȳ).",
    formula: String.raw`F=\gamma\bar{h}A \qquad e=\frac{I_g}{A\bar{y}} \qquad y_p=\bar{y}+e`,
    pages: [17],
    keywords: ["hydrostatic force", "center of pressure", "gate", "inclined", "centroid"],
    viz: "hyd:gate",
    inputs: [
      { k: "b", label: "Width of the surface", sym: "b", unit: "m", def: 2, step: 0.1 },
      { k: "hgt", label: "Height of the surface", sym: "a", unit: "m", def: 3, step: 0.1 },
      { k: "theta", label: "Inclination from horizontal", sym: "θ", unit: "°", def: 60, step: 1 },
      { k: "d", label: "Depth of the top edge", sym: "d", unit: "m", def: 2, step: 0.1 },
      { k: "gw", label: "Unit weight of water", sym: "γ", unit: "kN/m³", def: 9.81, step: 0.01 },
    ],
    run(v) {
      const { b, hgt, d, gw } = v;
      const th = (v.theta * Math.PI) / 180;
      const A = b * hgt;
      const yTop = d / Math.sin(th);           // distance along the plane to the top edge
      const ybar = yTop + hgt / 2;
      const hbar = ybar * Math.sin(th);
      const F = gw * hbar * A;
      const Ig = (b * hgt ** 3) / 12;
      const e = Ig / (A * ybar);
      const yp = ybar + e;

      return {
        results: [
          { label: "Total hydrostatic force", sym: "F", value: F, unit: "kN", hero: true },
          { label: "Depth to centroid", sym: "h̄", value: hbar, unit: "m" },
          { label: "Slant distance to centroid", sym: "ȳ", value: ybar, unit: "m" },
          { label: "Centroidal moment of inertia", sym: "I_g", value: Ig, unit: "m⁴", digits: 4 },
          { label: "Offset of centre of pressure", sym: "e", value: e, unit: "m", digits: 4 },
          { label: "Centre of pressure below the surface", sym: "y_p", value: yp, unit: "m", digits: 4 },
          { label: "Area", sym: "A", value: A, unit: "m²" },
        ],
        steps: [
          {
            title: "Area and centroid depth",
            tex: String.raw`A=ba=(${N(b)})(${N(hgt)})=${N(A)}\ \text{m}^2 \qquad \bar{y}=\frac{d}{\sin\theta}+\frac{a}{2}=${N(yTop, 4)}+${N(hgt / 2, 4)}=${N(ybar, 4)}\ \text{m}`,
          },
          {
            title: "Depth of the centroid below the free surface",
            tex: String.raw`\bar{h}=\bar{y}\sin\theta=(${N(ybar, 4)})\sin${N(v.theta)}^\circ=${N(hbar, 4)}\ \text{m}`,
          },
          {
            title: "Total force",
            tex: String.raw`F=\gamma\bar{h}A=(${N(gw)})(${N(hbar, 4)})(${N(A)})=${N(F, 5)}\ \text{kN}`,
            note: "Force equals the pressure at the centroid times the area — true for any plane shape.",
          },
          {
            title: "Centre of pressure",
            tex: String.raw`e=\frac{I_g}{A\bar{y}}=\frac{\frac{ba^3}{12}}{A\bar{y}}=\frac{${N(Ig, 4)}}{(${N(A)})(${N(ybar, 4)})}=${N(e, 4)}\ \text{m}` +
              String.raw`\\[4pt] y_p=\bar{y}+e=${N(yp, 4)}\ \text{m}`,
            note: "The centre of pressure always lies below the centroid — deeper water pushes harder.",
          },
        ],
        viz: { b, hgt, theta: v.theta, d, F, yp, ybar, hbar },
      };
    },
  }),

  /* ---------------------------------------------------------------- 3 */
  hyd({
    id: "hyd-dam",
    group: "Hydrostatics",
    title: "Gravity Dam Stability",
    lede: "Overturning, sliding and foundation pressure for a concrete gravity dam — the four vertical forces, the two horizontal ones, and the eccentricity check.",
    formula: String.raw`FS_o=\frac{RM}{OM} \qquad FS_s=\frac{\mu R_y}{R_x} \qquad q=\frac{R_y}{B}\left(1\pm\frac{6e}{B}\right)`,
    pages: [18],
    keywords: ["dam", "overturning", "sliding", "foundation pressure", "uplift", "factor of safety"],
    viz: "hyd:dam",
    inputs: [
      { k: "H", label: "Height of water above base", sym: "H", unit: "m", def: 15, step: 0.5 },
      { k: "B", label: "Base width", sym: "B", unit: "m", def: 14, step: 0.5 },
      { k: "tw", label: "Top width", sym: "t", unit: "m", def: 3, step: 0.5 },
      { k: "gc", label: "Unit weight of concrete", sym: "γ_c", unit: "kN/m³", def: 23.5, step: 0.1 },
      { k: "gw", label: "Unit weight of water", sym: "γ_w", unit: "kN/m³", def: 9.81, step: 0.01 },
      { k: "mu", label: "Coefficient of friction at base", sym: "μ", unit: "", def: 0.65, step: 0.05 },
      { k: "up", label: "Uplift as fraction of full hydrostatic", sym: "", unit: "", def: 0.5, step: 0.05, hint: "1.0 = full triangular uplift" },
      { k: "hw", label: "Tailwater depth", sym: "h_w", unit: "m", def: 0, step: 0.5 },
    ],
    run(v) {
      const { H, B, tw, gc, gw, mu, up, hw } = v;

      // All lever arms are measured from the TOE (downstream face), which is
      // where overturning actually happens. x = 0 at the heel (upstream face).
      const FH = 0.5 * gw * H * H;
      const yH = H / 3;

      const A1 = tw * H;                       // rectangular upper part, at the heel
      const W1 = gc * A1;
      const x1 = B - tw / 2;                   // arm from the toe

      const A2 = 0.5 * (B - tw) * H;           // triangular part down to the toe
      const W2 = gc * A2;
      const x2 = B - (tw + (B - tw) / 3);      // arm from the toe

      const U = up * 0.5 * gw * H * B;         // triangular, peak at the heel
      const xU = B / 3;                        // arm from the toe

      const Ry = W1 + W2 - U;
      const Rx = FH;

      const RM = W1 * x1 + W2 * x2;            // resisting (counter-clockwise)
      const OM = FH * yH + U * xU;             // overturning (clockwise)

      const xbar = (RM - OM) / Ry;             // measured from the toe
      const e = Math.abs(B / 2 - xbar);
      const FSo = RM / OM;
      const FSs = (mu * Ry) / Rx;

      let qmax, qmin;
      if (e <= B / 6) {
        qmax = (Ry / B) * (1 + (6 * e) / B);
        qmin = (Ry / B) * (1 - (6 * e) / B);
      } else {
        qmax = (2 * Ry) / (3 * xbar);
        qmin = 0;
      }

      return {
        results: [
          { label: "Factor of safety — overturning", sym: "FS_o", value: FSo, digits: 4, hero: true,
            badge: FSo >= 2 ? "OK (≥ 2)" : FSo >= 1.5 ? "Low" : "Fails",
            badgeTone: FSo >= 2 ? "ok" : FSo >= 1.5 ? "warn" : "bad" },
          { label: "Factor of safety — sliding", sym: "FS_s", value: FSs, digits: 4,
            badge: FSs >= 1.5 ? "OK (≥ 1.5)" : "Low",
            badgeTone: FSs >= 1.5 ? "ok" : "warn" },
          { label: "Resultant vertical force", sym: "R_y", value: Ry, unit: "kN/m" },
          { label: "Horizontal water force", sym: "F_H", value: FH, unit: "kN/m" },
          { label: "Uplift", sym: "U", value: U, unit: "kN/m" },
          { label: "Location of resultant from toe", sym: "x̄", value: xbar, unit: "m", digits: 4 },
          { label: "Eccentricity", sym: "e", value: e, unit: "m", digits: 4, note: `B/6 = ${fmt(B / 6, 3)} m` },
          { label: "Maximum foundation pressure", sym: "q_max", value: qmax, unit: "kPa" },
          { label: "Minimum foundation pressure", sym: "q_min", value: qmin, unit: "kPa" },
        ],
        steps: [
          {
            title: "Horizontal water force",
            tex: String.raw`F_H=\tfrac12\gamma_wH^2=\tfrac12(${N(gw)})(${N(H)})^2=${N(FH, 5)}\ \text{kN/m}`,
            note: "Acting at H/3 above the base.",
          },
          {
            title: "Vertical forces and their lever arms from the toe",
            tex: String.raw`W_1=\gamma_c tH=${N(W1, 5)}\ \text{kN},\; x_1=${N(x1, 4)}\ \text{m}` +
              String.raw`\\[4pt] W_2=\tfrac12\gamma_c(B-t)H=${N(W2, 5)}\ \text{kN},\; x_2=${N(x2, 4)}\ \text{m}` +
              String.raw`\\[4pt] U=${N(U, 5)}\ \text{kN},\; x_U=${N(xU, 4)}\ \text{m}`,
          },
          {
            title: "Resisting and overturning moments about the toe",
            tex: String.raw`RM=W_1x_1+W_2x_2=${N(RM, 5)}\ \text{kN}\cdot\text{m}` +
              String.raw`\\[4pt] OM=F_H\left(\frac{H}{3}\right)+U x_U=${N(OM, 5)}\ \text{kN}\cdot\text{m}`,
            note: "The card's convention: moments about the toe, overturning taken clockwise, resisting counter-clockwise.",
          },
          {
            title: "Factors of safety",
            tex: String.raw`FS_o=\frac{RM}{OM}=\frac{${N(RM, 5)}}{${N(OM, 5)}}=${N(FSo, 4)} \qquad FS_s=\frac{\mu R_y}{R_x}=\frac{(${N(mu)})(${N(Ry, 5)})}{${N(Rx, 5)}}=${N(FSs, 4)}`,
          },
          {
            title: "Location of the resultant and eccentricity",
            tex: String.raw`\bar{x}=\frac{RM-OM}{R_y}=\frac{${N(RM, 5)}-${N(OM, 5)}}{${N(Ry, 5)}}=${N(xbar, 4)}\ \text{m}` +
              String.raw`\\[4pt] e=\left|\frac{B}{2}-\bar{x}\right|=${N(e, 4)}\ \text{m}`,
          },
          {
            title: e <= B / 6 ? "Foundation pressure — e ≤ B/6" : "Foundation pressure — e > B/6, triangular distribution",
            tex: e <= B / 6
              ? String.raw`q_{max}=\frac{R_y}{B}\left(1+\frac{6e}{B}\right)=${N(qmax, 5)}\ \text{kPa}` +
                String.raw`\\[4pt] q_{min}=\frac{R_y}{B}\left(1-\frac{6e}{B}\right)=${N(qmin, 5)}\ \text{kPa}`
              : String.raw`e>B/6 \Rightarrow q_{max}=\frac{2R_y}{3\bar{x}}=${N(qmax, 5)}\ \text{kPa},\quad q_{min}=0`,
            note: e <= B / 6 ? "The resultant stays inside the middle third, so the whole base is in compression." : "The resultant falls outside the middle third — part of the base lifts off and tension is not allowed, so the pressure diagram becomes a triangle.",
          },
        ],
        viz: { H, B, tw, FH, Ry, xbar, e, qmax, qmin, U, W1, W2, FSo, FSs, hw },
      };
    },
  }),

  /* ---------------------------------------------------------------- 4 */
  hyd({
    id: "hyd-buoy",
    group: "Buoyancy & Stability",
    title: "Buoyancy, Metacentre & Righting Moment",
    lede: "How much of a body floats, how deep it sits, and whether it comes back upright after a tilt.",
    formula: String.raw`BF=\gamma V_d \qquad MB_o=\frac{B^2}{12D}\left[1+\tfrac12\tan^2\theta\right] \qquad RM=W\,(MG\sin\theta)`,
    pages: [19],
    keywords: ["buoyancy", "archimedes", "metacenter", "righting moment", "floating", "draft"],
    viz: "hyd:buoy",
    inputs: [
      { k: "L", label: "Body length", sym: "L", unit: "m", def: 6, step: 0.1 },
      { k: "B", label: "Body width", sym: "B", unit: "m", def: 3, step: 0.1 },
      { k: "D", label: "Body depth (height)", sym: "D", unit: "m", def: 2, step: 0.1 },
      { k: "sg", label: "Specific gravity of the body", sym: "sg", unit: "", def: 0.7, step: 0.01 },
      { k: "gbf", label: "Unit weight of the fluid", sym: "γ_f", unit: "kN/m³", def: 9.81, step: 0.01 },
      { k: "theta", label: "Angle of tilt", sym: "θ", unit: "°", def: 10, step: 1 },
      { k: "GB", label: "Distance from centre of gravity to centre of buoyancy", sym: "GB", unit: "m", def: 0.15, step: 0.01, hint: "G above B" },
    ],
    run(v) {
      const { L, B, D, sg, gbf, GB } = v;
      const th = (v.theta * Math.PI) / 180;
      const V = L * B * D;
      const W = sg * gbf * V;
      const Vd = (sg * V);                    // since γ_body = sg·γ_fluid
      const draft = Vd / (L * B);
      const I = (L * B ** 3) / 12;
      const MB = I / Vd;
      const MBrect = (B * B) / (12 * draft) * (1 + 0.5 * Math.tan(th) ** 2);
      const MG = MB - GB;
      const RM = W * MG * Math.sin(th);

      return {
        results: [
          { label: "Metacentric height", sym: "MG", value: MG, unit: "m", digits: 4, hero: true,
            badge: MG > 0 ? "Stable" : "Unstable", badgeTone: MG > 0 ? "ok" : "bad" },
          { label: "Buoyant force", sym: "BF", value: W, unit: "kN" },
          { label: "Volume displaced", sym: "V_d", value: Vd, unit: "m³" },
          { label: "Draft", sym: "D", value: draft, unit: "m", digits: 4 },
          { label: "Metacentric radius (exact)", sym: "MB_o", value: MB, unit: "m", digits: 4, note: "I / V_d" },
          { label: "Metacentric radius (rectangular approx.)", value: MBrect, unit: "m", digits: 4 },
          { label: "Righting moment", sym: "RM", value: RM, unit: "kN·m", digits: 4 },
        ],
        steps: [
          {
            title: "Volume and weight of the body",
            tex: String.raw`V=(${N(L)})(${N(B)})(${N(D)})=${N(V)}\ \text{m}^3 \qquad W=sg\,\gamma_fV=(${N(sg)})(${N(gbf)})(${N(V)})=${N(W, 5)}\ \text{kN}`,
          },
          {
            title: "Volume displaced (floating equilibrium)",
            tex: String.raw`W=BF \Rightarrow V_d=\frac{sg_{body}}{sg_{fluid}}V=${N(Vd, 5)}\ \text{m}^3`,
            note: "sg < 1 floats, sg = 1 is neutrally buoyant, sg > 1 sinks.",
          },
          {
            title: "Draft",
            tex: String.raw`\text{draft}=\frac{V_d}{LB}=\frac{${N(Vd, 5)}}{(${N(L)})(${N(B)})}=${N(draft, 4)}\ \text{m}`,
          },
          {
            title: "Metacentric radius",
            tex: String.raw`I=\frac{LB^3}{12}=${N(I, 4)}\ \text{m}^4 \qquad MB_o=\frac{I}{V_d}=\frac{${N(I, 4)}}{${N(Vd, 5)}}=${N(MB, 4)}\ \text{m}` +
              String.raw`\\[4pt] MB=\frac{B^2}{12D}\left[1+0.5\tan^2\theta\right]=${N(MBrect, 4)}\ \text{m}`,
            note: "The bracketed form is the card's rectangular-section approximation; it converges to I/V_d as θ → 0.",
          },
          {
            title: "Metacentric height and righting moment",
            tex: String.raw`MG=MB-GB=${N(MB, 4)}-${N(GB)}=${N(MG, 4)}\ \text{m}` +
              String.raw`\\[4pt] RM=W(MG\sin\theta)=(${N(W, 5)})(${N(MG, 4)})\sin${N(v.theta)}^\circ=${N(RM, 5)}\ \text{kN}\cdot\text{m}`,
            note: "MG > 0 puts the metacentre above the centre of gravity, which is the condition for stability.",
          },
        ],
        viz: { L, B, D, draft, MG, theta: v.theta, W },
      };
    },
  }),

  /* ---------------------------------------------------------------- 5 */
  hyd({
    id: "hyd-hoop",
    group: "Pipes & Tanks",
    title: "Hoop & Circumferential Stress",
    lede: "Wall thickness needed for a pressure pipe, and the hoop tension it develops.",
    formula: String.raw`t=\frac{pD}{2\sigma_t} \qquad S=\frac{2T}{pD}`,
    pages: [20],
    keywords: ["hoop stress", "circumferential", "pipe", "tank", "pressure vessel"],
    viz: "hyd:pipe",
    inputs: [
      { k: "p", label: "Internal pressure", sym: "p", unit: "MPa", def: 1.2, step: 0.05 },
      { k: "D", label: "Inside diameter", sym: "D", unit: "mm", def: 600, step: 10 },
      { k: "st", label: "Allowable tensile stress", sym: "σ_t", unit: "MPa", def: 120, step: 1 },
      { k: "eff", label: "Joint efficiency", sym: "eff", unit: "", def: 1.0, step: 0.05, hint: "1.0 if not given" },
    ],
    run(v) {
      const { p, D, st, eff } = v;
      const t = (p * D) / (2 * st * eff);
      const S = (2 * (st * eff)) / (p * D) * 0; // placeholder, recomputed below
      const hoopTension = (p * D) / 2;           // N/mm per mm length
      return {
        results: [
          { label: "Required wall thickness", sym: "t", value: t, unit: "mm", hero: true, digits: 4 },
          { label: "Hoop tension per unit length", sym: "T", value: hoopTension, unit: "N/mm", digits: 4 },
          { label: "Longitudinal stress (closed end)", value: (p * D) / (4 * t), unit: "MPa", digits: 4, note: "half the hoop stress" },
          { label: "Hoop stress at this thickness", sym: "σ_t", value: (p * D) / (2 * t), unit: "MPa", digits: 4 },
        ],
        steps: [
          {
            title: "Circumferential (hoop) stress",
            tex: String.raw`\sigma_t=\frac{pD}{2t}\;\Rightarrow\;t=\frac{pD}{2\sigma_t\,eff}`,
            note: "This is the stress that splits a pipe along its length — always twice the longitudinal stress.",
          },
          {
            title: "Solve for thickness",
            tex: String.raw`t=\frac{(${N(p)})(${N(D)})}{2(${N(st)})(${N(eff)})}=${N(t, 4)}\ \text{mm}`,
          },
          {
            title: "Hoop tension",
            tex: String.raw`S=\frac{2T}{pD}\;\Rightarrow\;T=\frac{pD}{2}=${N(hoopTension, 4)}\ \text{N/mm}`,
            note: "T is the force per millimetre of pipe length that the wall must carry.",
          },
        ],
        viz: { p, D, t, st },
      };
    },
  }),

  /* ---------------------------------------------------------------- 6 */
  hyd({
    id: "hyd-hammer",
    group: "Pipes & Tanks",
    title: "Water Hammer & Surge Pressure",
    lede: "Pressure-wave celerity in a rigid or elastic pipe, the critical closure time, and the surge it produces.",
    formula: String.raw`c=\sqrt{\frac{E_c}{\rho}} \qquad P_h=\rho c v \qquad T=\frac{2L}{c}`,
    pages: [29],
    keywords: ["water hammer", "surge", "celerity", "pressure wave", "valve closure"],
    inputs: [
      { k: "Eb", label: "Bulk modulus of water", sym: "E_b", unit: "GPa", def: 2.07, step: 0.01 },
      { k: "E", label: "Modulus of elasticity of the pipe", sym: "E", unit: "GPa", def: 200, step: 1 },
      { k: "d", label: "Internal diameter", sym: "d", unit: "mm", def: 500, step: 10 },
      { k: "t", label: "Wall thickness", sym: "t", unit: "mm", def: 8, step: 0.5 },
      { k: "rho", label: "Density of water", sym: "ρ", unit: "kg/m³", def: 1000, step: 1 },
      { k: "L", label: "Pipe length", sym: "L", unit: "m", def: 1200, step: 10 },
      { k: "vel", label: "Flow velocity", sym: "v", unit: "m/s", def: 2.4, step: 0.1 },
      { k: "tc", label: "Actual closure time", sym: "t_c", unit: "s", def: 3, step: 0.1 },
      { k: "rigid", label: "Pipe", type: "select", def: 0,
        options: [{ value: 0, label: "Elastic (non-rigid) pipe" }, { value: 1, label: "Rigid pipe" }] },
    ],
    run(v) {
      const { Eb, E, d, t, rho, L, vel, tc } = v;
      const EbPa = Eb * 1e9, EPa = E * 1e9;
      const dM = d / 1000, tM = t / 1000;
      const Ec = 1 / (1 / EbPa + dM / (EPa * tM));
      const cRigid = Math.sqrt(EbPa / rho);
      const c = v.rigid ? cRigid : Math.sqrt(Ec / rho);
      const T = (2 * L) / c;
      const rapid = tc <= T;
      const Ph = rho * c * vel;                  // Pa
      const PhSlow = (2 * L * rho * vel) / tc;   // Pa

      return {
        results: [
          { label: "Pressure-wave celerity", sym: "c", value: c, unit: "m/s", hero: true },
          { label: "Critical time 2L/c", sym: "T", value: T, unit: "s", digits: 4 },
          { label: rapid ? "Surge pressure — rapid closure" : "Surge pressure — slow closure",
            sym: rapid ? "P_h" : "P_h′", value: (rapid ? Ph : PhSlow) / 1000, unit: "kPa", digits: 4 },
          { label: "Surge head", value: (rapid ? Ph : PhSlow) / (rho * G), unit: "m", digits: 4 },
          { label: "Composite modulus", sym: "E_c", value: Ec / 1e9, unit: "GPa", digits: 4 },
          { label: "Closure type", value: rapid ? "Rapid (t_c ≤ 2L/c)" : "Slow (t_c > 2L/c)", note: rapid ? "Use P = ρcv" : "Use P = 2Lρv/t_c" },
        ],
        steps: [
          {
            title: "Composite modulus of elasticity",
            tex: String.raw`\frac{1}{E_c}=\frac{1}{E_b}+\frac{d}{Et}\;\Rightarrow\;E_c=${N(Ec / 1e9, 4)}\ \text{GPa}`,
            note: "Pipe elasticity lets the wall expand, which softens the water-hammer wave and lowers c.",
          },
          {
            title: "Celerity",
            tex: v.rigid
              ? String.raw`c=\sqrt{\frac{E_b}{\rho}}=\sqrt{\frac{${N(EbPa, 3)}}{${N(rho)}}}=${N(c, 5)}\ \text{m/s}`
              : String.raw`c=\sqrt{\frac{E_c}{\rho}}=\sqrt{\frac{${N(Ec, 3)}}{${N(rho)}}}=${N(c, 5)}\ \text{m/s}`,
          },
          {
            title: "Critical closure time",
            tex: String.raw`T=\frac{2L}{c}=\frac{2(${N(L)})}{${N(c, 5)}}=${N(T, 4)}\ \text{s}`,
            note: `Actual closure is ${N(tc)} s, so this is <b>${rapid ? "rapid" : "slow"}</b> closure.`,
          },
          rapid ? {
            title: "Rapid closure — full Joukowsky surge",
            tex: String.raw`P_h=\rho c v=(${N(rho)})(${N(c, 5)})(${N(vel)})=${N(Ph / 1000, 4)}\ \text{kPa}`,
          } : {
            title: "Slow closure — Michaud form",
            tex: String.raw`P_h'=\frac{2L\rho v}{t_c}=\frac{2(${N(L)})(${N(rho)})(${N(vel)})}{${N(tc)}}=${N(PhSlow / 1000, 4)}\ \text{kPa}`,
            note: "Closing slower than 2L/c means the reflected wave returns before the valve shuts, so the surge is smaller.",
          },
        ].filter((s) => s.tex),
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 7 */
  hyd({
    id: "hyd-orifice",
    group: "Orifices & Weirs",
    title: "Orifice Flow",
    lede: "Theoretical and actual discharge through a sharp-edged orifice, with contraction and velocity coefficients.",
    formula: String.raw`v=C_v\sqrt{2gh} \qquad Q=CA\sqrt{2gh} \qquad C=C_cC_v`,
    pages: [24],
    keywords: ["orifice", "discharge", "coefficient", "contraction", "velocity"],
    viz: "hyd:orifice",
    inputs: [
      { k: "h", label: "Head above the orifice centre", sym: "h", unit: "m", def: 4, step: 0.1 },
      { k: "d", label: "Orifice diameter", sym: "d", unit: "mm", def: 75, step: 1 },
      { k: "Cv", label: "Coefficient of velocity", sym: "C_v", unit: "", def: 0.98, step: 0.01 },
      { k: "Cc", label: "Coefficient of contraction", sym: "C_c", unit: "", def: 0.62, step: 0.01 },
      { k: "p", label: "Pressure at the surface", sym: "p", unit: "kPa", def: 0, step: 1 },
      { k: "gw", label: "Unit weight of water", sym: "γ", unit: "kN/m³", def: 9.81, step: 0.01 },
    ],
    run(v) {
      const { h, d, Cv, Cc, p, gw } = v;
      const A = (Math.PI * (d / 1000) ** 2) / 4;
      const H = h + p / gw;
      const Cd = Cc * Cv;
      const vth = Math.sqrt(2 * G * H);
      const vact = Cv * vth;
      const Q = Cd * A * vth;
      const HL = (vact * vact) / (2 * G) * (1 / (Cv * Cv) - 1);

      return {
        results: [
          { label: "Actual discharge", sym: "Q", value: Q * 1000, unit: "L/s", hero: true, digits: 4 },
          { label: "Theoretical velocity", sym: "v_t", value: vth, unit: "m/s", digits: 4 },
          { label: "Actual velocity", sym: "v", value: vact, unit: "m/s", digits: 4 },
          { label: "Coefficient of discharge", sym: "C", value: Cd, digits: 4 },
          { label: "Orifice area", sym: "A", value: A, unit: "m²", digits: 4 },
          { label: "Head loss", sym: "HL", value: HL, unit: "m", digits: 4 },
          { label: "Effective head", sym: "H", value: H, unit: "m", digits: 4 },
        ],
        steps: [
          {
            title: "Effective head",
            tex: String.raw`H=h+\frac{p}{\gamma}=${N(h)}+${N(p / gw, 4)}=${N(H, 4)}\ \text{m}`,
            note: "Pressure at the surface adds to the head, as the card notes: h + p/γ.",
          },
          {
            title: "Theoretical and actual velocity",
            tex: String.raw`v_t=\sqrt{2gH}=\sqrt{2(${N(G)})(${N(H, 4)})}=${N(vth, 4)}\ \text{m/s}` +
              String.raw`\\[4pt] v=C_v v_t=(${N(Cv)})(${N(vth, 4)})=${N(vact, 4)}\ \text{m/s}`,
          },
          {
            title: "Coefficient of discharge",
            tex: String.raw`C=C_cC_v=(${N(Cc)})(${N(Cv)})=${N(Cd, 4)}`,
            note: "C_c = a/A is the ratio of the contracted jet area to the orifice area.",
          },
          {
            title: "Discharge",
            tex: String.raw`Q=CA\sqrt{2gH}=(${N(Cd, 4)})(${N(A, 4)})(${N(vth, 4)})=${N(Q, 4)}\ \text{m}^3\text{/s}=${N(Q * 1000, 4)}\ \text{L/s}`,
          },
          {
            title: "Head lost in the orifice",
            tex: String.raw`HL=\frac{v^2}{2g}\left(\frac{1}{C_v^2}-1\right)=${N(HL, 4)}\ \text{m}`,
          },
        ],
        viz: { h, d, H, vact, Q },
      };
    },
  }),

  /* ---------------------------------------------------------------- 8 */
  hyd({
    id: "hyd-weir-rect",
    group: "Orifices & Weirs",
    title: "Rectangular Weir",
    lede: "Francis, the coefficient form, and the contracted-length correction for end contractions.",
    formula: String.raw`Q=\tfrac23C\sqrt{2g}\,LH^{3/2} \qquad Q=1.84\,L'H^{3/2}`,
    pages: [28, 29],
    keywords: ["weir", "francis", "rectangular", "contraction", "crest"],
    viz: "hyd:weir",
    inputs: [
      { k: "L", label: "Crest length", sym: "L", unit: "m", def: 3, step: 0.1 },
      { k: "H", label: "Head over the crest", sym: "H", unit: "m", def: 0.45, step: 0.01 },
      { k: "C", label: "Weir coefficient", sym: "C", unit: "", def: 0.62, step: 0.01 },
      { k: "nc", label: "Number of end contractions", sym: "n", unit: "", def: 0, step: 1 },
      { k: "mode", label: "Method", type: "select", def: "coef",
        options: [
          { value: "coef", label: "Coefficient form (C)" },
          { value: "francis", label: "Francis formula (1.84)" },
          { value: "nocontract", label: "Suppressed — no contractions" },
        ] },
    ],
    run(v) {
      const { L, H, C, nc } = v;
      const Lp = L - 0.1 * nc * H;
      const Qcoef = (2 / 3) * C * Math.sqrt(2 * G) * Lp * Math.pow(H, 1.5);
      const Qfrancis = 1.84 * Lp * Math.pow(H, 1.5);
      const Qfull = 1.84 * L * Math.pow(H, 1.5);
      const Q = v.mode === "francis" ? Qfrancis : v.mode === "nocontract" ? Qfull : Qcoef;

      return {
        results: [
          { label: "Discharge", sym: "Q", value: Q, unit: "m³/s", hero: true, digits: 4 },
          { label: "Effective crest length", sym: "L′", value: Lp, unit: "m", digits: 4, note: nc ? "L′ = L − 0.1nH" : "no end contractions" },
          { label: "Coefficient form", value: Qcoef, unit: "m³/s", digits: 4 },
          { label: "Francis form", value: Qfrancis, unit: "m³/s", digits: 4 },
          { label: "Head ratio H/L", value: H / L, digits: 4 },
        ],
        steps: [
          {
            title: "Contracted length",
            tex: nc
              ? String.raw`L'=L-0.1nH=${N(L)}-0.1(${N(nc)})(${N(H)})=${N(Lp, 4)}\ \text{m}`
              : String.raw`L'=L=${N(L)}\ \text{m}`,
            note: nc ? "Each end contraction shortens the effective crest by 0.1H." : "Suppressed weir — no end contractions to correct for.",
          },
          {
            title: "Coefficient form",
            tex: String.raw`Q=\tfrac23C\sqrt{2g}\,L'H^{3/2}=\tfrac23(${N(C)})\sqrt{2(${N(G)})}(${N(Lp, 4)})(${N(H)})^{1.5}=${N(Qcoef, 4)}\ \text{m}^3\text{/s}`,
          },
          {
            title: "Francis formula",
            tex: String.raw`Q=1.84\,L'H^{3/2}=1.84(${N(Lp, 4)})(${N(H)})^{1.5}=${N(Qfrancis, 4)}\ \text{m}^3\text{/s}`,
            note: "The card's note: when C or m is not given, use the Francis value 1.84.",
          },
          {
            title: "Velocity of approach (optional refinement)",
            tex: String.raw`Q=mL'\left[\left(H+\frac{v_a^2}{2g}\right)^{1.5}-\left(\frac{v_a^2}{2g}\right)^{1.5}\right]`,
            note: "Include this when the approach channel is narrow — it raises Q slightly above the simple H^1.5 form.",
          },
        ],
        viz: { L, H, Q, nc, Lp },
      };
    },
  }),

  /* ---------------------------------------------------------------- 9 */
  hyd({
    id: "hyd-weir-tri",
    group: "Orifices & Weirs",
    title: "Triangular (V-notch) Weir",
    lede: "V-notch discharge — the standard choice for small flows, since the head stays readable at low Q.",
    formula: String.raw`Q=\tfrac{8}{15}C\sqrt{2g}\tan\frac{\theta}{2}\,H^{5/2}`,
    pages: [29],
    keywords: ["v-notch", "triangular weir", "weir", "small flow"],
    viz: "hyd:weir",
    inputs: [
      { k: "theta", label: "Notch angle", sym: "θ", unit: "°", def: 90, step: 1 },
      { k: "H", label: "Head over the notch", sym: "H", unit: "m", def: 0.3, step: 0.01 },
      { k: "C", label: "Coefficient of discharge", sym: "C", unit: "", def: 0.6, step: 0.01 },
    ],
    run(v) {
      const { H, C } = v;
      const th = (v.theta * Math.PI) / 180;
      const Q = (8 / 15) * C * Math.sqrt(2 * G) * Math.tan(th / 2) * Math.pow(H, 2.5);
      const Q90 = 1.4 * Math.pow(H, 2.5);
      return {
        results: [
          { label: "Discharge", sym: "Q", value: Q, unit: "m³/s", hero: true, digits: 4 },
          { label: "Discharge in L/s", value: Q * 1000, unit: "L/s", digits: 4 },
          { label: "Quick form (θ = 90°)", value: Q90, unit: "m³/s", digits: 4, note: "Q = 1.4 H^2.5" },
          { label: "tan(θ/2)", value: Math.tan(th / 2), digits: 4 },
        ],
        steps: [
          {
            title: "V-notch equation",
            tex: String.raw`Q=\frac{8}{15}C\sqrt{2g}\tan\frac{\theta}{2}H^{5/2}=\frac{8}{15}(${N(C)})\sqrt{2(${N(G)})}\tan${N(v.theta / 2)}^\circ(${N(H)})^{2.5}=${N(Q, 4)}\ \text{m}^3\text{/s}`,
            note: "Note the exponent: 5/2, not 3/2 — the wetted width grows with head, unlike a rectangular weir.",
          },
          {
            title: "90° shortcut",
            tex: String.raw`\theta=90^\circ \Rightarrow Q=1.4H^{2.5}=1.4(${N(H)})^{2.5}=${N(Q90, 4)}\ \text{m}^3\text{/s}`,
            note: "The card gives m = 1.4 for a right-angled notch.",
          },
        ],
        viz: { H, Q, L: Math.max(1.2, 4 * H), theta: v.theta, tri: true },
      };
    },
  }),

  /* --------------------------------------------------------------- 10 */
  hyd({
    id: "hyd-manning",
    group: "Open Channels",
    title: "Manning — Trapezoidal Channel",
    lede: "Normal depth flow in a trapezoidal channel: geometry, hydraulic radius, velocity and discharge.",
    formula: String.raw`v=\frac{1}{n}R^{2/3}S^{1/2} \qquad Q=Av`,
    pages: [25],
    keywords: ["manning", "open channel", "trapezoidal", "normal flow", "hydraulic radius", "chezy"],
    viz: "hyd:channel",
    inputs: [
      { k: "b", label: "Bottom width", sym: "b", unit: "m", def: 4, step: 0.1 },
      { k: "d", label: "Flow depth", sym: "d", unit: "m", def: 1.6, step: 0.05 },
      { k: "z", label: "Side slope (H:V)", sym: "z", unit: "", def: 1.5, step: 0.1, hint: "0 = rectangular" },
      { k: "n", label: "Manning roughness", sym: "n", unit: "", def: 0.015, step: 0.001 },
      { k: "S", label: "Bed slope", sym: "S", unit: "m/m", def: 0.0012, step: 0.0001 },
    ],
    run(v) {
      const { b, d, z, n, S } = v;
      const A = d * (b + z * d);
      const P = b + 2 * d * Math.sqrt(1 + z * z);
      const R = A / P;
      const T = b + 2 * z * d;
      const vv = (1 / n) * Math.pow(R, 2 / 3) * Math.sqrt(S);
      const Q = A * vv;
      const E = (vv * vv) / (2 * G) + d;
      const tau = GW * R * S;

      return {
        results: [
          { label: "Discharge", sym: "Q", value: Q, unit: "m³/s", hero: true, digits: 4 },
          { label: "Velocity", sym: "v", value: vv, unit: "m/s", digits: 4 },
          { label: "Flow area", sym: "A", value: A, unit: "m²", digits: 4 },
          { label: "Wetted perimeter", sym: "P", value: P, unit: "m", digits: 4 },
          { label: "Hydraulic radius", sym: "R", value: R, unit: "m", digits: 4 },
          { label: "Top width", sym: "T", value: T, unit: "m", digits: 4 },
          { label: "Specific energy", sym: "E", value: E, unit: "m", digits: 4 },
          { label: "Boundary shear stress", sym: "τ", value: tau, unit: "Pa", digits: 4 },
        ],
        steps: [
          {
            title: "Channel geometry",
            tex: String.raw`A=d(b+zd)=${N(d)}(${N(b)}+${N(z)}\times${N(d)})=${N(A, 4)}\ \text{m}^2` +
              String.raw`\\[4pt] P=b+2d\sqrt{1+z^2}=${N(b)}+2(${N(d)})\sqrt{1+${N(z)}^2}=${N(P, 4)}\ \text{m}`,
          },
          {
            title: "Hydraulic radius",
            tex: String.raw`R=\frac{A}{P}=\frac{${N(A, 4)}}{${N(P, 4)}}=${N(R, 4)}\ \text{m}`,
          },
          {
            title: "Manning velocity",
            tex: String.raw`v=\frac{1}{n}R^{2/3}S^{1/2}=\frac{1}{${N(n)}}(${N(R, 4)})^{2/3}(${N(S)})^{1/2}=${N(vv, 4)}\ \text{m/s}`,
            note: "Manning in SI. The card also lists the Chezy route v = C√(RS) with C = (1/n)R^(1/6).",
          },
          {
            title: "Discharge",
            tex: String.raw`Q=Av=(${N(A, 4)})(${N(vv, 4)})=${N(Q, 4)}\ \text{m}^3\text{/s}`,
          },
          {
            title: "Specific energy and bed shear",
            tex: String.raw`E=\frac{v^2}{2g}+d=\frac{(${N(vv, 4)})^2}{2(${N(G)})}+${N(d)}=${N(E, 4)}\ \text{m}` +
              String.raw`\\[4pt] \tau=\gamma RS=(${N(GW)})(${N(R, 4)})(${N(S)})=${N(tau, 4)}\ \text{Pa}`,
          },
        ],
        viz: { b, d, z, Q, v: vv, R, A, T },
      };
    },
  }),

  /* --------------------------------------------------------------- 11 */
  hyd({
    id: "hyd-mes",
    group: "Open Channels",
    title: "Most Efficient Section",
    lede: "The trapezoid that passes the most flow for the least lining — where the hydraulic radius is exactly half the depth.",
    formula: String.raw`b=2d\left(\sqrt{1+z^2}-z\right) \qquad R=\frac{d}{2}`,
    pages: [26],
    keywords: ["most efficient", "best hydraulic section", "trapezoid", "minimum perimeter"],
    viz: "hyd:channel",
    inputs: [
      { k: "d", label: "Flow depth", sym: "d", unit: "m", def: 1.5, step: 0.05 },
      { k: "z", label: "Side slope (H:V)", sym: "z", unit: "", def: 1, step: 0.05 },
      { k: "n", label: "Manning roughness", sym: "n", unit: "", def: 0.015, step: 0.001 },
      { k: "S", label: "Bed slope", sym: "S", unit: "m/m", def: 0.001, step: 0.0001 },
    ],
    run(v) {
      const { d, z, n, S } = v;
      const b = 2 * d * (Math.sqrt(1 + z * z) - z);
      const A = d * (b + z * d);
      const P = b + 2 * d * Math.sqrt(1 + z * z);
      const R = A / P;
      const vv = (1 / n) * Math.pow(R, 2 / 3) * Math.sqrt(S);
      const Q = A * vv;
      return {
        results: [
          { label: "Most efficient bottom width", sym: "b", value: b, unit: "m", hero: true, digits: 4 },
          { label: "Hydraulic radius", sym: "R", value: R, unit: "m", digits: 4, note: "R = d/2 exactly" },
          { label: "Flow area", sym: "A", value: A, unit: "m²", digits: 4 },
          { label: "Wetted perimeter", sym: "P", value: P, unit: "m", digits: 4 },
          { label: "Discharge", sym: "Q", value: Q, unit: "m³/s", digits: 4 },
        ],
        steps: [
          {
            title: "Best hydraulic section — minimum wetted perimeter",
            tex: String.raw`b=2d\left(\sqrt{1+z^2}-z\right)=2(${N(d)})\left(\sqrt{1+${N(z)}^2}-${N(z)}\right)=${N(b, 4)}\ \text{m}`,
            note: "For a rectangular channel (z = 0) this collapses to the card's b = 2d, and for a circle the best section is the full pipe with R = D/4.",
          },
          {
            title: "Check the hydraulic radius",
            tex: String.raw`R=\frac{A}{P}=\frac{${N(A, 4)}}{${N(P, 4)}}=${N(R, 4)}\ \text{m}=\frac{d}{2}`,
            note: "R = d/2 is the signature of a most-efficient section — it is why this shape needs the least lining for a given discharge.",
          },
          {
            title: "Discharge at this geometry",
            tex: String.raw`Q=A\frac{1}{n}R^{2/3}S^{1/2}=${N(Q, 4)}\ \text{m}^3\text{/s}`,
          },
        ],
        viz: { b, d, z, Q, v: vv, R, A, T: b + 2 * z * d },
      };
    },
  }),

  /* --------------------------------------------------------------- 12 */
  hyd({
    id: "hyd-froude",
    group: "Open Channels",
    title: "Froude Number & Critical Depth",
    lede: "Which regime is the flow in — and at what depth does it become critical?",
    formula: String.raw`N_F=\frac{v}{\sqrt{gd_m}} \qquad d_c=\sqrt[3]{\frac{q^2}{g}}`,
    pages: [26, 27],
    keywords: ["froude", "critical depth", "subcritical", "supercritical", "regime"],
    viz: "hyd:channel",
    inputs: [
      { k: "Q", label: "Discharge", sym: "Q", unit: "m³/s", def: 12, step: 0.5 },
      { k: "b", label: "Channel width", sym: "b", unit: "m", def: 4, step: 0.1 },
      { k: "d", label: "Flow depth", sym: "d", unit: "m", def: 0.9, step: 0.05 },
    ],
    run(v) {
      const { Q, b, d } = v;
      const A = b * d;
      const vv = Q / A;
      const Fr = vv / Math.sqrt(G * d);
      const q = Q / b;
      const dc = Math.cbrt((q * q) / G);
      const vc = Math.sqrt(G * dc);
      const Ec = 1.5 * dc;

      const regime = Fr < 1 ? "Subcritical" : Fr === 1 ? "Critical" : "Supercritical";
      return {
        results: [
          { label: "Froude number", sym: "N_F", value: Fr, digits: 4, hero: true,
            badge: regime, badgeTone: Math.abs(Fr - 1) < 0.05 ? "warn" : "ok" },
          { label: "Critical depth", sym: "d_c", value: dc, unit: "m", digits: 4 },
          { label: "Actual depth", sym: "d", value: d, unit: "m" },
          { label: "Velocity", sym: "v", value: vv, unit: "m/s", digits: 4 },
          { label: "Critical velocity", sym: "v_c", value: vc, unit: "m/s", digits: 4 },
          { label: "Discharge per unit width", sym: "q", value: q, unit: "m²/s", digits: 4 },
          { label: "Minimum specific energy", sym: "E_c", value: Ec, unit: "m", digits: 4, note: "E_c = 1.5 d_c" },
        ],
        steps: [
          {
            title: "Velocity and Froude number",
            tex: String.raw`v=\frac{Q}{bd}=\frac{${N(Q)}}{(${N(b)})(${N(d)})}=${N(vv, 4)}\ \text{m/s}` +
              String.raw`\\[4pt] N_F=\frac{v}{\sqrt{gd}}=\frac{${N(vv, 4)}}{\sqrt{(${N(G)})(${N(d)})}}=${N(Fr, 4)}`,
            note: `<b>${regime}</b> — N_F &lt; 1 subcritical (tranquil), = 1 critical, &gt; 1 supercritical (rapid).`,
          },
          {
            title: "Critical depth",
            tex: String.raw`q=\frac{Q}{b}=${N(q, 4)}\ \text{m}^2\text{/s} \qquad d_c=\sqrt[3]{\frac{q^2}{g}}=${N(dc, 4)}\ \text{m}`,
            note: "The card's general condition is Q²B_c = A_c³ g; for a rectangle this reduces to d_c = (q²/g)^(1/3).",
          },
          {
            title: "Compare the actual depth with d_c",
            tex: String.raw`d=${N(d)}\ ${d > dc ? ">" : "<"}\ d_c=${N(dc, 4)} \;\Rightarrow\; \text{${d > dc ? "subcritical" : "supercritical"}}`,
            note: "Subcritical flow is deep and slow; supercritical is shallow and fast. The same discharge can do both — those are alternate depths.",
          },
        ],
        viz: { b, d, z: 0, Q, v: vv, dc, Fr },
      };
    },
  }),

  /* --------------------------------------------------------------- 13 */
  hyd({
    id: "hyd-jump",
    group: "Open Channels",
    title: "Hydraulic Jump",
    lede: "Conjugate depths across a jump in a rectangular channel, the energy lost, and the power dissipated.",
    formula: String.raw`\frac{q^2}{g}=d_1d_2\frac{d_1+d_2}{2} \qquad HL=\frac{(d_2-d_1)^3}{4d_1d_2}`,
    pages: [28],
    keywords: ["hydraulic jump", "conjugate depth", "sequent depth", "energy loss"],
    viz: "hyd:jump",
    inputs: [
      { k: "Q", label: "Discharge", sym: "Q", unit: "m³/s", def: 9, step: 0.5 },
      { k: "b", label: "Channel width", sym: "b", unit: "m", def: 3, step: 0.1 },
      { k: "d1", label: "Upstream depth", sym: "d_1", unit: "m", def: 0.35, step: 0.01 },
      { k: "gw", label: "Unit weight of water", sym: "γ", unit: "kN/m³", def: 9.81, step: 0.01 },
    ],
    run(v) {
      const { Q, b, d1, gw } = v;
      const q = Q / b;
      const v1 = q / d1;
      const Fr1 = v1 / Math.sqrt(G * d1);
      const d2 = (d1 / 2) * (Math.sqrt(1 + 8 * Fr1 * Fr1) - 1);
      const v2 = q / d2;
      const HL = Math.pow(d2 - d1, 3) / (4 * d1 * d2);
      const E1 = (v1 * v1) / (2 * G) + d1;
      const E2 = (v2 * v2) / (2 * G) + d2;
      const power = gw * Q * HL;

      return {
        results: [
          { label: "Conjugate depth", sym: "d_2", value: d2, unit: "m", hero: true, digits: 4 },
          { label: "Upstream Froude number", sym: "N_{F1}", value: Fr1, digits: 4, badge: Fr1 > 1 ? "Jump forms" : "No jump", badgeTone: Fr1 > 1 ? "ok" : "warn" },
          { label: "Height of the jump", sym: "d_2-d_1", value: d2 - d1, unit: "m", digits: 4 },
          { label: "Head loss", sym: "HL", value: HL, unit: "m", digits: 4 },
          { label: "Power lost", value: power, unit: "kW", digits: 4 },
          { label: "Upstream velocity", sym: "v_1", value: v1, unit: "m/s", digits: 4 },
          { label: "Downstream velocity", sym: "v_2", value: v2, unit: "m/s", digits: 4 },
          { label: "Energy before / after", value: `${fmt(E1, 4)} / ${fmt(E2, 4)} m` },
        ],
        steps: [
          {
            title: "Upstream conditions",
            tex: String.raw`q=\frac{Q}{b}=${N(q, 4)}\ \text{m}^2\text{/s} \qquad v_1=\frac{q}{d_1}=${N(v1, 4)}\ \text{m/s}` +
              String.raw`\\[4pt] N_{F1}=\frac{v_1}{\sqrt{gd_1}}=${N(Fr1, 4)}`,
          },
          {
            title: "Conjugate (sequent) depth",
            tex: String.raw`d_2=\frac{d_1}{2}\left(\sqrt{1+8N_{F1}^2}-1\right)=\frac{${N(d1)}}{2}\left(\sqrt{1+8(${N(Fr1, 4)})^2}-1\right)=${N(d2, 4)}\ \text{m}`,
            note: "This is the momentum equation solved for the second depth — mass and momentum balance, but not energy.",
          },
          {
            title: "Head lost across the jump",
            tex: String.raw`HL=\frac{(d_2-d_1)^3}{4d_1d_2}=\frac{(${N(d2 - d1, 4)})^3}{4(${N(d1)})(${N(d2, 4)})}=${N(HL, 4)}\ \text{m}`,
            note: "A hydraulic jump is deliberately dissipative — that head loss is the whole point of a stilling basin.",
          },
          {
            title: "Power dissipated",
            tex: String.raw`P=\gamma Q\,HL=(${N(gw)})(${N(Q)})(${N(HL, 4)})=${N(power, 4)}\ \text{kW}`,
          },
        ],
        viz: { d1, d2, Q, b, HL, v1, v2 },
      };
    },
  }),

  /* --------------------------------------------------------------- 14 */
  hyd({
    id: "hyd-energy",
    group: "Energy & Flow",
    title: "Bernoulli Energy & Pump Power",
    lede: "Total head between two sections, the head a pump must add, and the power and efficiency that follow.",
    formula: String.raw`\frac{v^2}{2g}+\frac{p}{\gamma}+z \qquad P=Q\gamma H_A \qquad \eta=\frac{P_{out}}{P_{in}}`,
    pages: [23, 24],
    keywords: ["bernoulli", "pump", "turbine", "power", "efficiency", "head", "energy grade"],
    viz: "hyd:egl",
    inputs: [
      { k: "Q", label: "Discharge", sym: "Q", unit: "m³/s", def: 0.085, step: 0.001 },
      { k: "d1", label: "Pipe diameter at 1", sym: "d_1", unit: "mm", def: 200, step: 5 },
      { k: "d2", label: "Pipe diameter at 2", sym: "d_2", unit: "mm", def: 150, step: 5 },
      { k: "p1", label: "Pressure at 1", sym: "p_1", unit: "kPa", def: 120, step: 1 },
      { k: "p2", label: "Pressure at 2", sym: "p_2", unit: "kPa", def: 260, step: 1 },
      { k: "z1", label: "Elevation at 1", sym: "z_1", unit: "m", def: 2, step: 0.1 },
      { k: "z2", label: "Elevation at 2", sym: "z_2", unit: "m", def: 9, step: 0.1 },
      { k: "HL", label: "Head loss between sections", sym: "HL", unit: "m", def: 1.4, step: 0.1 },
      { k: "eff", label: "Pump efficiency", sym: "η", unit: "%", def: 78, step: 1 },
      { k: "gw", label: "Unit weight of water", sym: "γ", unit: "kN/m³", def: 9.81, step: 0.01 },
    ],
    run(v) {
      const { Q, p1, p2, z1, z2, HL, eff, gw } = v;
      const A1 = (Math.PI * (v.d1 / 1000) ** 2) / 4;
      const A2 = (Math.PI * (v.d2 / 1000) ** 2) / 4;
      const v1 = Q / A1;
      const v2 = Q / A2;

      const hv1 = (v1 * v1) / (2 * G);
      const hv2 = (v2 * v2) / (2 * G);
      const hp1 = p1 / gw;
      const hp2 = p2 / gw;

      const E1 = hv1 + hp1 + z1;
      const E2 = hv2 + hp2 + z2;
      const HA = E2 - E1 + HL;

      const Pout = gw * Q * HA;          // kW
      const Pin = Pout / (eff / 100);

      return {
        results: [
          { label: "Head added by the pump", sym: "H_A", value: HA, unit: "m", hero: true },
          { label: "Total head at section 1", sym: "E_1", value: E1, unit: "m", digits: 4 },
          { label: "Total head at section 2", sym: "E_2", value: E2, unit: "m", digits: 4 },
          { label: "Velocity at 1 / 2", value: `${fmt(v1, 4)} / ${fmt(v2, 4)} m/s` },
          { label: "Pump output power", sym: "P", value: Pout, unit: "kW", digits: 4 },
          { label: "Pump input power", value: Pin, unit: "kW", digits: 4 },
          { label: "Pump output in hp", value: Pout / 0.7457, unit: "hp", digits: 4 },
        ],
        steps: [
          {
            title: "Velocities from continuity",
            tex: String.raw`v_1=\frac{Q}{A_1}=\frac{${N(Q)}}{${N(A1, 4)}}=${N(v1, 4)}\ \text{m/s} \qquad v_2=\frac{Q}{A_2}=${N(v2, 4)}\ \text{m/s}`,
            note: "The smaller section must run faster — that is why the velocity head changes.",
          },
          {
            title: "Total head at each section",
            tex: String.raw`E_1=\frac{v_1^2}{2g}+\frac{p_1}{\gamma}+z_1=${N(hv1, 4)}+${N(hp1, 4)}+${N(z1)}=${N(E1, 4)}\ \text{m}` +
              String.raw`\\[4pt] E_2=${N(hv2, 4)}+${N(hp2, 4)}+${N(z2)}=${N(E2, 4)}\ \text{m}`,
          },
          {
            title: "Energy equation with a pump",
            tex: String.raw`E_1+H_A=E_2+HL \;\Rightarrow\; H_A=E_2-E_1+HL=${N(E2, 4)}-${N(E1, 4)}+${N(HL)}=${N(HA, 4)}\ \text{m}`,
            note: "A negative H_A would mean a turbine instead — the head is being extracted, not added.",
          },
          {
            title: "Power",
            tex: String.raw`P=Q\gamma H_A=(${N(Q)})(${N(gw)})(${N(HA, 4)})=${N(Pout, 4)}\ \text{kW}` +
              String.raw`\\[4pt] P_{in}=\frac{P}{\eta}=\frac{${N(Pout, 4)}}{${N(eff / 100)}}=${N(Pin, 4)}\ \text{kW}`,
            note: "The card's caution: pump power is an <em>output</em>; if a motor rating is asked for, that is the input.",
          },
        ],
        viz: { E1, E2, HA, HL, v1, v2, z1, z2, Q },
      };
    },
  }),

  /* --------------------------------------------------------------- 15 */
  hyd({
    id: "hyd-darcy",
    group: "Head Losses",
    title: "Darcy–Weisbach & Reynolds Number",
    lede: "Friction head loss with the correct friction factor for the flow regime, plus the Colebrook check for turbulent flow.",
    formula: String.raw`h_f=\frac{fLv^2}{D\,2g} \qquad N_R=\frac{vD}{\nu}`,
    pages: [29, 30],
    keywords: ["darcy", "weisbach", "friction factor", "reynolds", "head loss", "colebrook"],
    inputs: [
      { k: "L", label: "Pipe length", sym: "L", unit: "m", def: 450, step: 5 },
      { k: "D", label: "Pipe diameter", sym: "D", unit: "mm", def: 250, step: 5 },
      { k: "Q", label: "Discharge", sym: "Q", unit: "m³/s", def: 0.055, step: 0.001 },
      { k: "nu", label: "Kinematic viscosity", sym: "ν", unit: "m²/s", def: 1.004e-6, step: 1e-7 },
      { k: "eps", label: "Absolute roughness", sym: "ε", unit: "mm", def: 0.15, step: 0.01 },
    ],
    run(v) {
      const { L, Q, nu } = v;
      const D = v.D / 1000;
      const eps = v.eps / 1000;
      const A = (Math.PI * D * D) / 4;
      const vel = Q / A;
      const Re = (vel * D) / nu;

      let f;
      if (Re < 2000) {
        f = 64 / Re;
      } else {
        // Colebrook–White, solved by fixed-point iteration
        f = 0.02;
        for (let i = 0; i < 60; i++) {
          const rhs = -2 * Math.log10(eps / (3.7 * D) + 2.51 / (Re * Math.sqrt(f)));
          const fn = 1 / (rhs * rhs);
          if (Math.abs(fn - f) < 1e-10) { f = fn; break; }
          f = fn;
        }
      }
      const hf = (f * L * vel * vel) / (D * 2 * G);
      const hfAlt = (0.0826 * f * L * Q * Q) / Math.pow(D, 5);
      const slope = hf / L;

      return {
        results: [
          { label: "Friction head loss", sym: "h_f", value: hf, unit: "m", hero: true, digits: 4 },
          { label: "Reynolds number", sym: "N_R", value: Re, digits: 5,
            badge: Re < 2000 ? "Laminar" : "Turbulent", badgeTone: Re < 2000 ? "warn" : "ok" },
          { label: "Friction factor", sym: "f", value: f, digits: 5 },
          { label: "Velocity", sym: "v", value: vel, unit: "m/s", digits: 4 },
          { label: "Head loss via Q form", value: hfAlt, unit: "m", digits: 4, note: "0.0826 f L Q² / D⁵" },
          { label: "Hydraulic slope", sym: "S", value: slope, digits: 5 },
          { label: "Relative roughness", sym: "ε/D", value: eps / D, digits: 5 },
        ],
        steps: [
          {
            title: "Velocity and Reynolds number",
            tex: String.raw`v=\frac{Q}{A}=\frac{${N(Q)}}{${N(A, 5)}}=${N(vel, 4)}\ \text{m/s}` +
              String.raw`\\[4pt] N_R=\frac{vD}{\nu}=\frac{(${N(vel, 4)})(${N(D)})}{${N(nu, 4)}}=${N(Re, 5)}`,
            note: `N_R = ${N(Re, 5)} → <b>${Re < 2000 ? "laminar (N_R < 2000)" : "turbulent (N_R > 2000)"}</b>.`,
          },
          {
            title: Re < 2000 ? "Laminar friction factor" : "Turbulent friction factor — Colebrook–White",
            tex: Re < 2000
              ? String.raw`f=\frac{64}{N_R}=\frac{64}{${N(Re, 5)}}=${N(f, 5)}`
              : String.raw`\frac{1}{\sqrt{f}}=-2\log_{10}\left(\frac{\varepsilon/D}{3.7}+\frac{2.51}{N_R\sqrt{f}}\right)\;\Rightarrow\;f=${N(f, 5)}`,
            note: Re < 2000 ? "Hagen–Poiseuille: friction factor depends only on Reynolds number." : "Solved iteratively — the Colebrook equation is implicit in f.",
          },
          {
            title: "Darcy–Weisbach head loss",
            tex: String.raw`h_f=\frac{fLv^2}{D(2g)}=\frac{(${N(f, 5)})(${N(L)})(${N(vel, 4)})^2}{(${N(D)})(2\times${N(G)})}=${N(hf, 4)}\ \text{m}`,
          },
          {
            title: "Cross-check with the discharge form",
            tex: String.raw`h_f=\frac{0.0826fLQ^2}{D^5}=${N(hfAlt, 4)}\ \text{m}`,
            note: "Both forms must agree — if they don't, the diameter is probably still in millimetres.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 16 */
  hyd({
    id: "hyd-hazen",
    group: "Head Losses",
    title: "Hazen–Williams",
    lede: "The empirical water-supply formula, in velocity, discharge and head-loss form.",
    formula: String.raw`v=0.8492CR^{0.63}S^{0.54} \qquad h_f=\frac{10.67LQ^{1.85}}{C^{1.85}D^{4.87}}`,
    pages: [30],
    keywords: ["hazen", "williams", "head loss", "water supply", "empirical"],
    inputs: [
      { k: "Q", label: "Discharge", sym: "Q", unit: "m³/s", def: 0.09, step: 0.001 },
      { k: "D", label: "Pipe diameter", sym: "D", unit: "mm", def: 300, step: 5 },
      { k: "L", label: "Pipe length", sym: "L", unit: "m", def: 800, step: 10 },
      { k: "C", label: "Hazen–Williams coefficient", sym: "C", unit: "", def: 130, step: 1 },
    ],
    run(v) {
      const { Q, L, C } = v;
      const D = v.D / 1000;
      const A = (Math.PI * D * D) / 4;
      const vel = Q / A;
      const hf = (10.67 * L * Math.pow(Q, 1.85)) / (Math.pow(C, 1.85) * Math.pow(D, 4.87));
      const S = hf / L;
      const R = D / 4;
      const vCheck = 0.8492 * C * Math.pow(R, 0.63) * Math.pow(S, 0.54);

      return {
        results: [
          { label: "Friction head loss", sym: "h_f", value: hf, unit: "m", hero: true, digits: 4 },
          { label: "Velocity", sym: "v", value: vel, unit: "m/s", digits: 4 },
          { label: "Hydraulic gradient", sym: "S", value: S, digits: 5 },
          { label: "Hydraulic radius (full pipe)", sym: "R", value: R, unit: "m", digits: 4, note: "R = D/4" },
          { label: "Velocity check via 0.8492 C R^0.63 S^0.54", value: vCheck, unit: "m/s", digits: 4 },
        ],
        steps: [
          {
            title: "Head loss",
            tex: String.raw`h_f=\frac{10.67\,L\,Q^{1.85}}{C^{1.85}D^{4.87}}=\frac{10.67(${N(L)})(${N(Q)})^{1.85}}{(${N(C)})^{1.85}(${N(D)})^{4.87}}=${N(hf, 4)}\ \text{m}`,
            note: "Hazen–Williams is empirical and intended for water near 20 °C in pipes 50 mm and larger.",
          },
          {
            title: "Hydraulic radius of a full pipe",
            tex: String.raw`R=\frac{D}{4}=\frac{${N(D)}}{4}=${N(R, 4)}\ \text{m}`,
            note: "The card's note for non-circular pipes: D = 4R.",
          },
          {
            title: "Velocity form check",
            tex: String.raw`v=0.8492CR^{0.63}S^{0.54}=0.8492(${N(C)})(${N(R, 4)})^{0.63}(${N(S, 5)})^{0.54}=${N(vCheck, 4)}\ \text{m/s}`,
            note: `Continuity gives ${N(vel, 4)} m/s — the two should match closely.`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 17 */
  hyd({
    id: "hyd-minor",
    group: "Head Losses",
    title: "Minor Losses & Pipes in Series/Parallel",
    lede: "Sum the fittings, then decide whether the pipes add head or add discharge.",
    formula: String.raw`h_m=k_m\frac{v^2}{2g} \qquad h_T=h_f+h_m`,
    pages: [30],
    keywords: ["minor loss", "fittings", "series", "parallel", "total head loss"],
    inputs: [
      { k: "Q", label: "Discharge", sym: "Q", unit: "m³/s", def: 0.05, step: 0.001 },
      { k: "D", label: "Pipe diameter", sym: "D", unit: "mm", def: 200, step: 5 },
      { k: "k", label: "Sum of minor-loss coefficients", sym: "Σk", unit: "", def: 4.5, step: 0.1 },
      { k: "hf", label: "Friction head loss", sym: "h_f", unit: "m", def: 6.2, step: 0.1 },
      { k: "L", label: "Pipe length (for slope)", sym: "L", unit: "m", def: 300, step: 10 },
      { k: "n", label: "Pipes in parallel", sym: "n", unit: "", def: 3, step: 1 },
    ],
    run(v) {
      const { Q, k, hf, L, n } = v;
      const D = v.D / 1000;
      const A = (Math.PI * D * D) / 4;
      const vel = Q / A;
      const hm = k * (vel * vel) / (2 * G);
      const hT = hf + hm;
      const slope = hT / L;

      return {
        results: [
          { label: "Minor head loss", sym: "h_m", value: hm, unit: "m", hero: true, digits: 4 },
          { label: "Total head loss", sym: "h_T", value: hT, unit: "m", digits: 4 },
          { label: "Velocity head", sym: "v²/2g", value: (vel * vel) / (2 * G), unit: "m", digits: 4 },
          { label: "Velocity", sym: "v", value: vel, unit: "m/s", digits: 4 },
          { label: "Energy gradient", sym: "S = h_T/L", value: slope, digits: 5 },
          { label: "Discharge per parallel branch", value: Q / n, unit: "m³/s", digits: 4, note: "equal-length branches assumed" },
        ],
        steps: [
          {
            title: "Velocity in the pipe",
            tex: String.raw`v=\frac{Q}{A}=\frac{${N(Q)}}{${N(A, 5)}}=${N(vel, 4)}\ \text{m/s} \qquad \frac{v^2}{2g}=${N((vel * vel) / (2 * G), 4)}\ \text{m}`,
          },
          {
            title: "Minor losses",
            tex: String.raw`h_m=k_m\frac{v^2}{2g}=(${N(k)})(${N((vel * vel) / (2 * G), 4)})=${N(hm, 4)}\ \text{m}`,
            note: "The card's caution: minor losses matter only when the pipe is short — say L/D below about 1000.",
          },
          {
            title: "Total head loss",
            tex: String.raw`h_T=h_f+h_m=${N(hf)}+${N(hm, 4)}=${N(hT, 4)}\ \text{m}`,
          },
          {
            title: "Series vs parallel",
            tex: String.raw`\text{Series: } Q_1=Q_2=Q_3,\;\; h_T=\Sigma h_f` +
              String.raw`\\[4pt] \text{Parallel: } Q=Q_1+Q_2+Q_3,\;\; h_{f1}=h_{f2}=h_{f3}`,
            note: "Series adds head loss at constant discharge; parallel splits discharge at constant head loss.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 18 */
  hyd({
    id: "hyd-jet",
    group: "Momentum",
    title: "Force of a Jet on a Plate or Vane",
    lede: "Momentum change across a jet — stationary or moving plate, flat or curved vane.",
    formula: String.raw`F=\rho QV \qquad F=\rho Q'V' \qquad \Sigma F_x=\rho Q(v_{2x}-v_{1x})`,
    pages: [27, 28],
    keywords: ["jet", "momentum", "vane", "plate", "impulse", "force"],
    viz: "hyd:jet",
    inputs: [
      { k: "d", label: "Jet diameter", sym: "d", unit: "mm", def: 50, step: 1 },
      { k: "v", label: "Jet velocity", sym: "V", unit: "m/s", def: 22, step: 0.5 },
      { k: "rho", label: "Density", sym: "ρ", unit: "kg/m³", def: 1000, step: 1 },
      { k: "u", label: "Plate / vane velocity", sym: "u", unit: "m/s", def: 0, step: 0.5 },
      { k: "beta", label: "Vane deflection angle", sym: "β", unit: "°", def: 180, step: 5, hint: "180° = flat plate" },
    ],
    run(v) {
      const { v: V, rho, u } = v;
      const d = v.d / 1000;
      const A = (Math.PI * d * d) / 4;
      const beta = (v.beta * Math.PI) / 180;
      const Q = A * V;

      const Vrel = V - u;
      const Qrel = A * Vrel;
      const Fstat = rho * Q * V * (1 - Math.cos(beta));
      const Fmove = rho * Qrel * Vrel * (1 - Math.cos(beta));
      const Fplate = rho * Q * V;   // β = 90° flat plate, stationary

      return {
        results: [
          { label: u > 0 ? "Force on the moving vane" : "Force on the stationary vane", value: u > 0 ? Fmove : Fstat, unit: "N", hero: true, digits: 5 },
          { label: "Relative velocity", sym: "V′", value: Vrel, unit: "m/s", digits: 4 },
          { label: "Jet discharge", sym: "Q", value: Q * 1000, unit: "L/s", digits: 4 },
          { label: "Force on a flat plate (90°)", value: Fplate, unit: "N", digits: 5 },
          { label: "Jet area", sym: "A", value: A * 1e4, unit: "cm²", digits: 4 },
          { label: "Work done on the vane", value: Fmove * u / 1000, unit: "kW", digits: 4, note: "zero when the vane is stationary" },
        ],
        steps: [
          {
            title: "Jet area and discharge",
            tex: String.raw`A=\frac{\pi d^2}{4}=${N(A, 5)}\ \text{m}^2 \qquad Q=AV=${N(Q * 1000, 4)}\ \text{L/s}`,
          },
          {
            title: "Relative velocity at the vane",
            tex: String.raw`V'=V-u=${N(V)}-${N(u)}=${N(Vrel, 4)}\ \text{m/s}`,
            note: "For a moving vane the momentum change is measured in the vane's frame — the card's note: use relative velocity.",
          },
          {
            title: "Force by momentum change",
            tex: String.raw`F=\rho Q'V'(1-\cos\beta)=(${N(rho)})(${N(Qrel, 5)})(${N(Vrel, 4)})(1-\cos${N(v.beta)}^\circ)=${N(u > 0 ? Fmove : Fstat, 5)}\ \text{N}`,
            note: "β = 90° gives a flat plate (F = ρQV); β = 180° doubles it, which is why Pelton buckets are split and turned back.",
          },
          {
            title: "Work and power",
            tex: String.raw`P=F\,u=${N(Fmove, 5)}\times${N(u)}=${N(Fmove * u, 5)}\ \text{W}`,
            note: "Maximum power transfer happens near u = V/2, not at the maximum force.",
          },
        ],
        viz: { d, V, u, beta: v.beta, F: u > 0 ? Fmove : Fstat, Q },
      };
    },
  }),

  /* --------------------------------------------------------------- 19 */
  hyd({
    id: "hyd-rotating",
    group: "Relative Equilibrium",
    title: "Rotating Vessel — Paraboloid Surface",
    lede: "The free surface of a spinning container is a paraboloid; find its slope, rise and volume.",
    formula: String.raw`\tan\theta=\frac{\omega^2x}{g} \qquad y=\frac{\omega^2x^2}{2g}`,
    pages: [21, 22],
    keywords: ["rotating vessel", "paraboloid", "relative equilibrium", "spill", "rpm"],
    viz: "hyd:rotating",
    inputs: [
      { k: "rpm", label: "Rotational speed", sym: "N", unit: "rpm", def: 90, step: 1 },
      { k: "R", label: "Vessel radius", sym: "R", unit: "m", def: 0.6, step: 0.01 },
      { k: "H", label: "Initial water depth", sym: "H", unit: "m", def: 0.9, step: 0.01 },
    ],
    run(v) {
      const { rpm, R, H } = v;
      const w = (rpm * 2 * Math.PI) / 60;
      const yEdge = (w * w * R * R) / (2 * G);
      const slopeEdge = (w * w * R) / G;
      const volPara = 0.5 * Math.PI * R * R * yEdge;
      const volCyl = Math.PI * R * R * H;
      const spill = yEdge > H ? volPara - volCyl * 0 : 0;

      return {
        results: [
          { label: "Height of the paraboloid at the wall", sym: "y", value: yEdge, unit: "m", hero: true, digits: 4,
            badge: yEdge > 2 * H ? "Spills" : yEdge > H ? "Near spill" : "Contained",
            badgeTone: yEdge > H ? "bad" : "ok" },
          { label: "Angular velocity", sym: "ω", value: w, unit: "rad/s", digits: 4 },
          { label: "Surface slope at the wall", sym: "tanθ", value: slopeEdge, digits: 4 },
          { label: "Volume of the paraboloid", sym: "V_p", value: volPara, unit: "m³", digits: 4 },
          { label: "Volume of the cylinder", sym: "V_c", value: volCyl, unit: "m³", digits: 4 },
          { label: "Depth at the centre (if unspilled)", value: H - yEdge / 2, unit: "m", digits: 4 },
        ],
        steps: [
          {
            title: "Convert rpm to rad/s",
            tex: String.raw`\omega=\frac{2\pi N}{60}=\frac{2\pi(${N(rpm)})}{60}=${N(w, 4)}\ \text{rad/s}`,
            note: "The card's conversion: 1 rpm = π/30 rad/s.",
          },
          {
            title: "Rise of the free surface at the wall",
            tex: String.raw`y=\frac{\omega^2R^2}{2g}=\frac{(${N(w, 4)})^2(${N(R)})^2}{2(${N(G)})}=${N(yEdge, 4)}\ \text{m}`,
            note: "The surface rises by half this amount at the wall and falls by the same at the axis, conserving volume.",
          },
          {
            title: "Slope at the wall",
            tex: String.raw`\tan\theta=\frac{\omega^2x}{g}\Big|_{x=R}=${N(slopeEdge, 4)}`,
          },
          {
            title: "Volume of the paraboloid",
            tex: String.raw`V_p=\tfrac12\pi R^2y=${N(volPara, 4)}\ \text{m}^3`,
            note: yEdge > H
              ? "The paraboloid is taller than the initial depth — water would spill before this speed is reached."
              : "Fits inside the vessel, so nothing spills and the centre simply drops.",
          },
        ],
        viz: { w, R, H, yEdge, rpm },
      };
    },
  }),

  /* --------------------------------------------------------------- 20 */
  hyd({
    id: "hyd-capillary",
    group: "Fluid Properties",
    title: "Capillary Rise & Surface Tension",
    lede: "How high water climbs a narrow tube, and the pressure it pulls into the soil above the water table.",
    formula: String.raw`h=\frac{4\sigma\cos\theta}{\gamma d}`,
    pages: [16, 7],
    keywords: ["capillary", "surface tension", "rise", "tube", "meniscus"],
    inputs: [
      { k: "sigma", label: "Surface tension", sym: "σ", unit: "N/m", def: 0.0736, step: 0.001 },
      { k: "theta", label: "Contact angle", sym: "θ", unit: "°", def: 0, step: 1 },
      { k: "d", label: "Tube diameter", sym: "d", unit: "mm", def: 2, step: 0.1 },
      { k: "gw", label: "Unit weight of water", sym: "γ", unit: "kN/m³", def: 9.81, step: 0.01 },
    ],
    run(v) {
      const { sigma, gw } = v;
      const th = (v.theta * Math.PI) / 180;
      const d = v.d / 1000;
      const h = (4 * sigma * Math.cos(th)) / (gw * 1000 * d);
      const p = -gw * h;
      return {
        results: [
          { label: "Capillary rise", sym: "h", value: h * 1000, unit: "mm", hero: true, digits: 4 },
          { label: "Capillary rise", value: h, unit: "m", digits: 4 },
          { label: "Capillary pressure (suction)", sym: "P_w", value: p, unit: "kPa", digits: 4, note: "negative — tension" },
          { label: "Equivalent head of water", value: h, unit: "m" },
        ],
        steps: [
          {
            title: "Capillary rise",
            tex: String.raw`h=\frac{4\sigma\cos\theta}{\gamma d}=\frac{4(${N(sigma)})\cos${N(v.theta)}^\circ}{(${N(gw * 1000)})(${N(d)})}=${N(h, 5)}\ \text{m}`,
            note: "Halve the diameter and the rise doubles — that is why silts hold water far above the water table.",
          },
          {
            title: "Negative pore pressure in the capillary zone",
            tex: String.raw`P_w=-S\gamma_w h_w=-(1)(${N(gw)})(${N(h, 5)})=${N(p, 4)}\ \text{kPa}`,
            note: "This suction raises the effective stress — apparent cohesion, which disappears the moment the soil saturates.",
          },
        ],
        viz: null,
      };
    },
  }),
];
