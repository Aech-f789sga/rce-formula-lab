/* ==========================================================================
   data/geotech.js — Geotechnical Engineering
   Transcribed from FORMULA CARD (Engr. APJO), pages 2–14.
   ========================================================================== */

import { texNum as N, fmt } from "../core.js";

const GAMMA_W = 9.81; // kN/m³

const geo = (o) => ({ section: "geotech", ...o });

export const GEOTECH = [

  /* ---------------------------------------------------------------- 1 */
  geo({
    id: "geo-phase",
    group: "Phase Relationships",
    title: "Phase Diagram & Unit Weights",
    lede: "One block, three phases. Enter specific gravity, water content and void ratio — everything else (S, n, γ, γd, γsat, γ′) falls out of the same diagram.",
    formula: String.raw`\gamma=\frac{G_s(1+w)}{1+e}\gamma_w \qquad \gamma_{sat}=\frac{G_s+e}{1+e}\gamma_w \qquad \gamma'=\gamma_{sat}-\gamma_w`,
    pages: [2],
    keywords: ["unit weight", "void ratio", "porosity", "saturation", "phase diagram", "bulk", "dry", "submerged", "moisture"],
    viz: "geo:phase",
    inputs: [
      { k: "Gs", label: "Specific gravity of solids", sym: "G_s", unit: "", def: 2.65, step: 0.01 },
      { k: "w", label: "Water content", sym: "w", unit: "%", def: 12, step: 0.5 },
      { k: "e", label: "Void ratio", sym: "e", unit: "", def: 0.65, step: 0.01, hint: "0 < e < ∞" },
      { k: "gw", label: "Unit weight of water", sym: "γ_w", unit: "kN/m³", def: 9.81, step: 0.01 },
    ],
    run(v) {
      const { Gs, e, gw } = v;
      const w = v.w / 100;
      const S = (w * Gs) / e;                 // Se = wGs
      const n = e / (1 + e);
      const gd = (Gs * gw) / (1 + e);
      const g = gd * (1 + w);
      const gsat = ((Gs + e) * gw) / (1 + e);
      const gsub = gsat - gw;
      const ac = n * (1 - S);

      // volumes per unit volume of solids
      const Vs = 1, Vv = e, V = 1 + e, Vw = w * Gs, Va = Vv - Vw;
      const Ws = Gs * gw, Ww = w * Ws, W = Ws + Ww;

      return {
        results: [
          { label: "Moist unit weight", sym: "γ", value: g, unit: "kN/m³", hero: true },
          { label: "Dry unit weight", sym: "γ_d", value: gd, unit: "kN/m³" },
          { label: "Saturated unit weight", sym: "γ_sat", value: gsat, unit: "kN/m³" },
          { label: "Submerged unit weight", sym: "γ′", value: gsub, unit: "kN/m³" },
          { label: "Degree of saturation", sym: "S", value: S * 100, unit: "%", digits: 4 },
          { label: "Porosity", sym: "n", value: n, digits: 4 },
          { label: "Air content", sym: "a_c", value: ac * 100, unit: "%", digits: 4 },
        ],
        steps: [
          {
            title: "Degree of saturation — from Se = wG_s",
            tex: String.raw`S=\frac{wG_s}{e}=\frac{(${N(w)})(${N(Gs)})}{${N(e)}}=${N(S)} \;=\; ${N(S * 100)}\%`,
            note: S > 1 ? "<b>Check:</b> S cannot exceed 100 % — the soil is fully saturated, so the water content given is above saturation for this void ratio." : null,
          },
          {
            title: "Porosity from void ratio",
            tex: String.raw`n=\frac{e}{1+e}=\frac{${N(e)}}{1+${N(e)}}=${N(n)}`,
          },
          {
            title: "Dry unit weight",
            tex: String.raw`\gamma_d=\frac{G_s\gamma_w}{1+e}=\frac{(${N(Gs)})(${N(gw)})}{1+${N(e)}}=${N(gd)}\ \text{kN/m}^3`,
          },
          {
            title: "Moist unit weight",
            tex: String.raw`\gamma=\frac{G_s(1+w)\gamma_w}{1+e}=\gamma_d(1+w)=${N(gd)}(1+${N(w)})=${N(g)}\ \text{kN/m}^3`,
          },
          {
            title: "Saturated and submerged unit weight",
            tex: String.raw`\gamma_{sat}=\frac{(G_s+e)\gamma_w}{1+e}=\frac{(${N(Gs)}+${N(e)})(${N(gw)})}{1+${N(e)}}=${N(gsat)}` +
              String.raw`\\[4pt] \gamma'=\gamma_{sat}-\gamma_w=${N(gsat)}-${N(gw)}=${N(gsub)}\ \text{kN/m}^3`,
          },
          {
            title: "Phase quantities (per unit volume of solids)",
            tex: String.raw`V_s=1,\; V_v=${N(Vv)},\; V_w=${N(Vw)},\; V_a=${N(Va)},\; V=${N(V)}` +
              String.raw`\\[4pt] W_s=${N(Ws)},\; W_w=${N(Ww)},\; W=${N(W)}\ \text{kN}`,
            note: `Total weight ÷ total volume = ${fmt(W / V, 4)} kN/m³ — matches γ above.`,
          },
        ],
        viz: { Vs, Vv, Vw, Va, S, e, n, g, gd, gsat },
      };
    },
  }),

  /* ---------------------------------------------------------------- 2 */
  geo({
    id: "geo-compaction",
    group: "Phase Relationships",
    title: "Relative Density & Relative Compaction",
    lede: "How dense is the field soil compared with its loosest and densest possible states — and how close is the field dry unit weight to the laboratory maximum?",
    formula: String.raw`D_r=\frac{e_{max}-e}{e_{max}-e_{min}}\times100\% \qquad R=\frac{\gamma_{d(field)}}{\gamma_{d(max)}}\times100\%`,
    pages: [3],
    keywords: ["relative density", "relative compaction", "density index", "loose", "dense", "proctor"],
    inputs: [
      { k: "gmax", label: "Maximum dry unit weight", sym: "γ_d(max)", unit: "kN/m³", def: 19.5, step: 0.1 },
      { k: "gmin", label: "Minimum dry unit weight", sym: "γ_d(min)", unit: "kN/m³", def: 14.8, step: 0.1 },
      { k: "gfield", label: "Field dry unit weight", sym: "γ_d", unit: "kN/m³", def: 18.2, step: 0.1 },
      { k: "Gs", label: "Specific gravity of solids", sym: "G_s", unit: "", def: 2.65, step: 0.01 },
      { k: "gw", label: "Unit weight of water", sym: "γ_w", unit: "kN/m³", def: 9.81, step: 0.01 },
    ],
    run(v) {
      const { gmax, gmin, gfield, Gs, gw } = v;
      const emax = (Gs * gw) / gmin - 1;
      const emin = (Gs * gw) / gmax - 1;
      const e = (Gs * gw) / gfield - 1;
      const Dr = ((emax - e) / (emax - emin)) * 100;
      const R = (gfield / gmax) * 100;

      const table = [
        [0, 20, "Very loose"], [20, 40, "Loose"], [40, 70, "Medium dense"],
        [70, 85, "Dense"], [85, 100, "Very dense"],
      ];
      const cls = Dr > 100 ? "Very dense" : (table.find(([a, b]) => Dr >= a && Dr < b)?.[2] ?? "Very loose");

      return {
        results: [
          { label: "Relative density", sym: "D_r", value: Dr, unit: "%", hero: true, badge: cls, badgeTone: Dr >= 70 ? "ok" : Dr >= 40 ? "warn" : "bad" },
          { label: "Relative compaction", sym: "R", value: R, unit: "%" },
          { label: "Void ratio in the field", sym: "e", value: e, digits: 4 },
          { label: "e_max / e_min", value: `${fmt(emax, 4)} / ${fmt(emin, 4)}` },
        ],
        steps: [
          {
            title: "Convert the three dry unit weights to void ratios",
            tex: String.raw`e=\frac{G_s\gamma_w}{\gamma_d}-1 \;\Rightarrow\; e_{max}=${N(emax)},\quad e_{min}=${N(emin)},\quad e=${N(e)}`,
            note: "A lower dry unit weight means a looser packing, hence a higher void ratio.",
          },
          {
            title: "Relative density",
            tex: String.raw`D_r=\frac{e_{max}-e}{e_{max}-e_{min}}\times100=\frac{${N(emax)}-${N(e)}}{${N(emax)}-${N(emin)}}\times100=${N(Dr)}\%`,
            note: `<b>${cls}</b> — per the card's table: 0–20 very loose, 20–40 loose, 40–70 medium dense, 70–85 dense, 85–100 very dense.`,
          },
          {
            title: "Relative compaction",
            tex: String.raw`R=\frac{\gamma_{d}}{\gamma_{d(max)}}\times100=\frac{${N(gfield)}}{${N(gmax)}}\times100=${N(R)}\%`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 3 */
  geo({
    id: "geo-atterberg",
    group: "Consistency & Classification",
    title: "Atterberg Limits & Consistency Indices",
    lede: "Plasticity index, liquidity index, consistency index and activity — plus the card's consistency classification for each.",
    formula: String.raw`PI=LL-PL \qquad LI=\frac{w-PL}{LL-PL} \qquad CI=\frac{LL-w}{LL-PL} \qquad A_c=\frac{PI}{\%\text{clay}}`,
    pages: [4],
    keywords: ["atterberg", "liquid limit", "plastic limit", "plasticity index", "liquidity", "consistency", "activity", "shrinkage"],
    inputs: [
      { k: "LL", label: "Liquid limit", sym: "LL", unit: "%", def: 48, step: 1 },
      { k: "PL", label: "Plastic limit", sym: "PL", unit: "%", def: 24, step: 1 },
      { k: "w", label: "Natural water content", sym: "w", unit: "%", def: 32, step: 1 },
      { k: "SL", label: "Shrinkage limit", sym: "SL", unit: "%", def: 16, step: 1 },
      { k: "clay", label: "Clay fraction", sym: "% clay", unit: "%", def: 35, step: 1 },
    ],
    run(v) {
      const { LL, PL, w, SL, clay } = v;
      const PI = LL - PL;
      const LI = (w - PL) / PI;
      const CI = (LL - w) / PI;
      const Ac = PI / clay;
      const SI = PL - SL;

      const liCls = LI < 0 ? "Brittle solid" : LI <= 1 ? "Plastic" : "Liquid";
      const ciCls = CI > 1 ? "Brittle solid" : CI >= 0 ? "Plastic" : "Liquid";
      const acCls = Ac < 0.7 ? "Inactive" : Ac <= 1.2 ? "Normal" : "Active";
      const piCls = PI < 5 ? "Slightly plastic" : PI < 10 ? "Low plasticity"
        : PI < 20 ? "Medium plasticity" : PI < 40 ? "High plasticity" : "Very high plasticity";

      return {
        results: [
          { label: "Plasticity index", sym: "PI", value: PI, unit: "%", hero: true, badge: piCls, badgeTone: PI > 20 ? "warn" : "ok" },
          { label: "Liquidity index", sym: "LI", value: LI, digits: 4, badge: liCls, badgeTone: LI > 1 ? "bad" : "ok" },
          { label: "Consistency index", sym: "CI", value: CI, digits: 4, badge: ciCls, badgeTone: CI < 0 ? "bad" : "ok" },
          { label: "Activity", sym: "A_c", value: Ac, digits: 4, badge: acCls, badgeTone: Ac > 1.2 ? "warn" : "ok" },
          { label: "Shrinkage index", sym: "SI", value: SI, unit: "%" },
        ],
        steps: [
          {
            title: "Plasticity index",
            tex: String.raw`PI=LL-PL=${N(LL)}-${N(PL)}=${N(PI)}`,
            note: `<b>${piCls}</b> — 0 non-plastic, 1–5 slightly, 5–10 low, 10–20 medium, 20–40 high, > 40 very high.`,
          },
          {
            title: "Liquidity index",
            tex: String.raw`LI=\frac{w-PL}{LL-PL}=\frac{${N(w)}-${N(PL)}}{${N(PI)}}=${N(LI)}`,
            note: `<b>${liCls}</b> — LI &lt; 0 brittle solid, 0–1 plastic, &gt; 1 liquid.`,
          },
          {
            title: "Consistency index",
            tex: String.raw`CI=\frac{LL-w}{LL-PL}=\frac{${N(LL)}-${N(w)}}{${N(PI)}}=${N(CI)}`,
            note: `<b>${ciCls}</b> — CI &gt; 1 brittle solid, 0–1 plastic, &lt; 0 liquid.`,
          },
          {
            title: "Activity",
            tex: String.raw`A_c=\frac{PI}{\%\text{clay}}=\frac{${N(PI)}}{${N(clay)}}=${N(Ac)}`,
            note: `<b>${acCls}</b> — &lt; 0.7 inactive, 0.7–1.2 normal, &gt; 1.2 active.`,
          },
          {
            title: "Shrinkage index",
            tex: String.raw`SI=PL-SL=${N(PL)}-${N(SL)}=${N(SI)}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 4 */
  geo({
    id: "geo-shrinkage",
    group: "Consistency & Classification",
    title: "Shrinkage Limit & Shrinkage Ratio",
    lede: "Mercury-bath shrinkage limit from wet and dry masses and volumes, with the shrinkage ratio and the specific gravity it implies.",
    formula: String.raw`SL=\left[\frac{M_i-M_e}{M_e}-\frac{(V_i-V_e)\rho_w}{M_e}\right]\times100`,
    pages: [4],
    keywords: ["shrinkage limit", "shrinkage ratio", "linear shrinkage", "volumetric shrinkage"],
    inputs: [
      { k: "Mi", label: "Initial (wet) mass", sym: "M_i", unit: "g", def: 44.6, step: 0.1 },
      { k: "Me", label: "Dry (oven-dry) mass", sym: "M_e", unit: "g", def: 32.8, step: 0.1 },
      { k: "Vi", label: "Initial volume", sym: "V_i", unit: "cm³", def: 24.5, step: 0.1 },
      { k: "Ve", label: "Dry volume", sym: "V_e", unit: "cm³", def: 18.9, step: 0.1 },
      { k: "rw", label: "Density of water", sym: "ρ_w", unit: "g/cm³", def: 1.0, step: 0.01 },
    ],
    run(v) {
      const { Mi, Me, Vi, Ve, rw } = v;
      const wi = ((Mi - Me) / Me) * 100;
      const dw = (((Vi - Ve) * rw) / Me) * 100;
      const SL = wi - dw;
      const SR = Ve > 0 ? Me / (Ve * rw) : NaN;       // = γd/γw
      const Gs = SR > 0 && isFinite(SR) ? 1 / (1 / SR - SL / 100) : NaN;
      const VS = SR * (wi / 100 - SL / 100);
      const LS = 1 - Math.cbrt(1 / (VS + 1));

      return {
        results: [
          { label: "Shrinkage limit", sym: "SL", value: SL, unit: "%", hero: true },
          { label: "Initial water content", sym: "w_i", value: wi, unit: "%" },
          { label: "Change in water content", sym: "Δw", value: dw, unit: "%" },
          { label: "Shrinkage ratio", sym: "SR", value: SR, digits: 4 },
          { label: "Specific gravity of solids", sym: "G_s", value: Gs, digits: 4, note: "from G_s = 1/(1/SR − SL/100)" },
          { label: "Volumetric shrinkage", sym: "VS", value: VS * 100, unit: "%", digits: 4 },
          { label: "Linear shrinkage", sym: "LS", value: LS * 100, unit: "%", digits: 4 },
        ],
        steps: [
          {
            title: "Initial water content",
            tex: String.raw`w_i=\frac{M_i-M_e}{M_e}\times100=\frac{${N(Mi)}-${N(Me)}}{${N(Me)}}\times100=${N(wi)}\%`,
          },
          {
            title: "Water lost per unit dry mass (volume change)",
            tex: String.raw`\Delta w=\frac{(V_i-V_e)\rho_w}{M_e}\times100=\frac{(${N(Vi)}-${N(Ve)})(${N(rw)})}{${N(Me)}}\times100=${N(dw)}\%`,
          },
          {
            title: "Shrinkage limit",
            tex: String.raw`SL=w_i-\Delta w=${N(wi)}-${N(dw)}=${N(SL)}\%`,
            note: "At the shrinkage limit the soil stops shrinking: further drying removes water without reducing volume, so S = 100 % and SL = w.",
          },
          {
            title: "Shrinkage ratio and implied G_s",
            tex: String.raw`SR=\frac{M_e}{V_e\rho_w}=\frac{${N(Me)}}{(${N(Ve)})(${N(rw)})}=${N(SR)}` +
              String.raw`\\[4pt] G_s=\frac{1}{\dfrac{1}{SR}-\dfrac{SL}{100}}=${N(Gs)}`,
            note: "SR equals the dry unit weight expressed in g/cm³ — the card writes it as V_w/V_d.",
          },
          {
            title: "Volumetric and linear shrinkage",
            tex: String.raw`VS=SR\,(w_i-SL)=${N(VS * 100)}\% \qquad LS=1-\sqrt[3]{\frac{1}{VS+1}}=${N(LS * 100)}\%`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 5 */
  geo({
    id: "geo-grainsize",
    group: "Consistency & Classification",
    title: "Gradation Coefficients",
    lede: "Uniformity, curvature, sorting and suitability from the grain-size distribution curve.",
    formula: String.raw`C_u=\frac{D_{60}}{D_{10}} \qquad C_c=\frac{D_{30}^2}{D_{60}D_{10}} \qquad S_o=\sqrt{\frac{D_{75}}{D_{25}}}`,
    pages: [3],
    keywords: ["cu", "cc", "gradation", "uniformity", "curvature", "sorting", "suitability", "d10", "d60"],
    inputs: [
      { k: "D60", label: "D₆₀", sym: "D_{60}", unit: "mm", def: 1.2, step: 0.01 },
      { k: "D30", label: "D₃₀", sym: "D_{30}", unit: "mm", def: 0.42, step: 0.01 },
      { k: "D10", label: "D₁₀ (effective size)", sym: "D_{10}", unit: "mm", def: 0.15, step: 0.01 },
      { k: "D75", label: "D₇₅", sym: "D_{75}", unit: "mm", def: 2.4, step: 0.01 },
      { k: "D25", label: "D₂₅", sym: "D_{25}", unit: "mm", def: 0.32, step: 0.01 },
      { k: "D50", label: "D₅₀", sym: "D_{50}", unit: "mm", def: 0.55, step: 0.01 },
      { k: "D20", label: "D₂₀", sym: "D_{20}", unit: "mm", def: 0.24, step: 0.01 },
    ],
    run(v) {
      const { D60, D30, D10, D75, D25, D50, D20 } = v;
      const Cu = D60 / D10;
      const Cc = (D30 * D30) / (D60 * D10);
      const So = Math.sqrt(D75 / D25);
      const Sn = 1.7 * Math.sqrt(3 / (D50 * D50) + 1 / (D20 * D20) + 1 / (D10 * D10));

      const wellGraded = Cu >= 6 && Cc >= 1 && Cc <= 3;
      const snCls = Sn <= 10 ? "Excellent" : Sn <= 20 ? "Good" : Sn <= 30 ? "Fair" : "Poor";
      const soCls = So < 2.5 ? "Very uniform" : So < 4.5 ? "Uniform" : So < 6.5 ? "Medium" : "Well sorted";

      return {
        results: [
          { label: "Coefficient of uniformity", sym: "C_u", value: Cu, digits: 4, hero: true, badge: Cu >= 6 ? "Uniformity OK" : "Uniform soil", badgeTone: Cu >= 6 ? "ok" : "warn" },
          { label: "Coefficient of curvature", sym: "C_c", value: Cc, digits: 4, badge: Cc >= 1 && Cc <= 3 ? "1 ≤ Cc ≤ 3" : "Outside 1–3", badgeTone: Cc >= 1 && Cc <= 3 ? "ok" : "warn" },
          { label: "Sorting coefficient", sym: "S_o", value: So, digits: 4, badge: soCls },
          { label: "Suitability number", sym: "S_n", value: Sn, digits: 4, badge: snCls, badgeTone: Sn <= 20 ? "ok" : Sn <= 30 ? "warn" : "bad" },
          { label: "USCS gradation", value: wellGraded ? "Well graded" : "Poorly graded", note: "Cu ≥ 6 and 1 ≤ Cc ≤ 3 for gravels/sands" },
        ],
        steps: [
          {
            title: "Coefficient of uniformity",
            tex: String.raw`C_u=\frac{D_{60}}{D_{10}}=\frac{${N(D60)}}{${N(D10)}}=${N(Cu)}`,
          },
          {
            title: "Coefficient of curvature",
            tex: String.raw`C_c=\frac{D_{30}^2}{D_{60}D_{10}}=\frac{(${N(D30)})^2}{(${N(D60)})(${N(D10)})}=${N(Cc)}`,
          },
          {
            title: "Sorting coefficient",
            tex: String.raw`S_o=\sqrt{\frac{D_{75}}{D_{25}}}=\sqrt{\frac{${N(D75)}}{${N(D25)}}}=${N(So)}`,
          },
          {
            title: "Suitability number",
            tex: String.raw`S_n=1.7\sqrt{\frac{3}{D_{50}^2}+\frac{1}{D_{20}^2}+\frac{1}{D_{10}^2}}=${N(Sn)}`,
            note: `<b>${snCls}</b> — 0–10 excellent, 10–20 good, 20–30 fair, 30–50 poor (as a filter material).`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 6 */
  geo({
    id: "geo-flowindex",
    group: "Consistency & Classification",
    title: "Flow Index & Toughness Index",
    lede: "Slope of the flow curve between two blows–water-content pairs, and the toughness index that follows from it.",
    formula: String.raw`FI=\frac{w_1-w_2}{\log(N_2/N_1)} \qquad TI=\frac{PI}{FI}`,
    pages: [5],
    keywords: ["flow index", "toughness index", "flow curve", "liquid limit"],
    inputs: [
      { k: "w1", label: "Water content, trial 1", sym: "w_1", unit: "%", def: 52, step: 0.5 },
      { k: "N1", label: "Blows, trial 1", sym: "N_1", unit: "", def: 18, step: 1 },
      { k: "w2", label: "Water content, trial 2", sym: "w_2", unit: "%", def: 44, step: 0.5 },
      { k: "N2", label: "Blows, trial 2", sym: "N_2", unit: "", def: 32, step: 1 },
      { k: "PI", label: "Plasticity index", sym: "PI", unit: "%", def: 24, step: 0.5 },
    ],
    run(v) {
      const { w1, N1, w2, N2, PI } = v;
      const FI = (w1 - w2) / Math.log10(N2 / N1);
      const TI = PI / FI;
      const LL25 = w1 + (FI * Math.log10(25 / N1));

      return {
        results: [
          { label: "Flow index", sym: "FI", value: FI, digits: 4, hero: true },
          { label: "Toughness index", sym: "TI", value: TI, digits: 4 },
          { label: "Liquid limit at 25 blows", sym: "LL", value: LL25, unit: "%", note: "from the same flow line" },
        ],
        steps: [
          {
            title: "Flow index",
            tex: String.raw`FI=\frac{w_1-w_2}{\log\left(\dfrac{N_2}{N_1}\right)}=\frac{${N(w1)}-${N(w2)}}{\log\left(\dfrac{${N(N2)}}{${N(N1)}}\right)}=${N(FI)}`,
          },
          {
            title: "Liquid limit by extrapolating to 25 blows",
            tex: String.raw`LL=w_1+FI\log\left(\frac{25}{N_1}\right)=${N(w1)}+(${N(FI)})\log\left(\frac{25}{${N(N1)}}\right)=${N(LL25)}\%`,
          },
          {
            title: "Toughness index",
            tex: String.raw`TI=\frac{PI}{FI}=\frac{${N(PI)}}{${N(FI)}}=${N(TI)}`,
            note: "TI typically falls between 1 and 3 for most clays; higher values indicate a more brittle, heavily over-consolidated soil.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 7 */
  geo({
    id: "geo-aashto",
    group: "Consistency & Classification",
    title: "AASHTO Group Index",
    lede: "The group index used to rank soils within an AASHTO group — and the note about dropping the second term for A-2-6 and A-2-7 soils.",
    formula: String.raw`GI=(F_{200}-35)\,(0.005\,LL)+0.01\,(F_{200}-15)\,(PI-10)`,
    pages: [6],
    keywords: ["aashto", "group index", "gi", "classification", "f200"],
    inputs: [
      { k: "F200", label: "Percent passing No. 200", sym: "F_{200}", unit: "%", def: 62, step: 1 },
      { k: "LL", label: "Liquid limit", sym: "LL", unit: "%", def: 45, step: 1 },
      { k: "PI", label: "Plasticity index", sym: "PI", unit: "%", def: 21, step: 1 },
      { k: "a26", label: "A-2-6 / A-2-7 soil?", type: "select", def: 0,
        options: [{ value: 0, label: "No — use both terms" }, { value: 1, label: "Yes — 2nd term only" }] },
    ],
    run(v) {
      const { F200, LL, PI } = v;
      const f = Math.max(F200, 0);
      const t1 = Math.max(f - 35, 0) * (0.005 * LL);
      const t2 = Math.max(f - 15, 0) * Math.max(PI - 10, 0) * 0.01;
      const GI = v.a26 ? t2 : t1 + t2;
      const rounded = Math.round(GI);

      return {
        results: [
          { label: "Group index", sym: "GI", value: GI, digits: 3, hero: true },
          { label: "Reported as whole number", value: String(rounded), note: "AASHTO reports GI rounded to the nearest integer" },
          { label: "Term 1 — (F₂₀₀−35)(0.005 LL)", value: t1, digits: 4 },
          { label: "Term 2 — 0.01(F₂₀₀−15)(PI−10)", value: t2, digits: 4 },
        ],
        steps: [
          {
            title: "First term",
            tex: String.raw`(F_{200}-35)(0.005\,LL)=(${N(f)}-35)(0.005\times${N(LL)})=${N(t1)}`,
            note: "Terms are clamped at zero — a negative contribution is not allowed.",
          },
          {
            title: "Second term",
            tex: String.raw`0.01\,(F_{200}-15)(PI-10)=0.01\,(${N(f)}-15)(${N(PI)}-10)=${N(t2)}`,
          },
          {
            title: v.a26 ? "A-2-6 / A-2-7 — second term only" : "Sum both terms",
            tex: v.a26 ? String.raw`GI=${N(t2)}` : String.raw`GI=${N(t1)}+${N(t2)}=${N(GI)}`,
            note: v.a26 ? "The card's special note: for A-2-6 and A-2-7 sub-groups use the second term only." : null,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 8 */
  geo({
    id: "geo-perm-ch",
    group: "Permeability & Seepage",
    title: "Constant-Head Permeability Test",
    lede: "Falling volume through a specimen under a fixed head — the laboratory workhorse.",
    formula: String.raw`k=\frac{Vol\cdot L}{A\,h\,t}`,
    pages: [7],
    keywords: ["permeability", "hydraulic conductivity", "constant head", "lab test"],
    inputs: [
      { k: "Vol", label: "Volume of discharge", sym: "Vol", unit: "cm³", def: 640, step: 1 },
      { k: "L", label: "Length of specimen", sym: "L", unit: "cm", def: 12.5, step: 0.1 },
      { k: "A", label: "Cross-sectional area", sym: "A", unit: "cm²", def: 78.5, step: 0.1 },
      { k: "h", label: "Constant head difference", sym: "h", unit: "cm", def: 42, step: 0.1 },
      { k: "t", label: "Duration", sym: "t", unit: "s", def: 180, step: 1 },
    ],
    run(v) {
      const { Vol, L, A, h, t } = v;
      const k = (Vol * L) / (A * h * t);
      const q = Vol / t;
      const vel = k * (h / L);
      return {
        results: [
          { label: "Coefficient of permeability", sym: "k", value: k, unit: "cm/s", hero: true, digits: 4 },
          { label: "Discharge", sym: "Q", value: q, unit: "cm³/s", digits: 4 },
          { label: "Hydraulic gradient", sym: "i", value: h / L, digits: 4 },
          { label: "Discharge velocity", sym: "v = ki", value: vel, unit: "cm/s", digits: 4 },
        ],
        steps: [
          { title: "Hydraulic gradient", tex: String.raw`i=\frac{h}{L}=\frac{${N(h)}}{${N(L)}}=${N(h / L)}` },
          {
            title: "Coefficient of permeability",
            tex: String.raw`k=\frac{Vol\cdot L}{A\,h\,t}=\frac{(${N(Vol)})(${N(L)})}{(${N(A)})(${N(h)})(${N(t)})}=${N(k)}\ \text{cm/s}`,
          },
          {
            title: "Check with Darcy's law",
            tex: String.raw`Q=kiA \;\Rightarrow\; v=ki=${N(k)}(${N(h / L)})=${N(vel)}\ \text{cm/s},\quad Q=${N(q)}\ \text{cm}^3\text{/s}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 9 */
  geo({
    id: "geo-perm-fh",
    group: "Permeability & Seepage",
    title: "Falling-Head Permeability Test",
    lede: "Head decays through a standpipe — the right test for silts and fine sands where discharge is too small to measure.",
    formula: String.raw`k=\frac{aL}{At}\ln\frac{h_1}{h_2}`,
    pages: [7],
    keywords: ["permeability", "falling head", "variable head", "standpipe"],
    inputs: [
      { k: "a", label: "Standpipe area", sym: "a", unit: "cm²", def: 1.25, step: 0.01 },
      { k: "L", label: "Specimen length", sym: "L", unit: "cm", def: 10, step: 0.1 },
      { k: "A", label: "Specimen area", sym: "A", unit: "cm²", def: 78.5, step: 0.1 },
      { k: "t", label: "Elapsed time", sym: "t", unit: "s", def: 300, step: 1 },
      { k: "h1", label: "Initial head", sym: "h_1", unit: "cm", def: 90, step: 0.1 },
      { k: "h2", label: "Final head", sym: "h_2", unit: "cm", def: 42, step: 0.1 },
    ],
    run(v) {
      const { a, L, A, t, h1, h2 } = v;
      const k = ((a * L) / (A * t)) * Math.log(h1 / h2);
      return {
        results: [
          { label: "Coefficient of permeability", sym: "k", value: k, unit: "cm/s", hero: true, digits: 4 },
          { label: "Head ratio", sym: "h₁/h₂", value: h1 / h2, digits: 4 },
          { label: "ln(h₁/h₂)", value: Math.log(h1 / h2), digits: 4 },
        ],
        steps: [
          {
            title: "Falling-head equation",
            tex: String.raw`k=\frac{aL}{At}\ln\frac{h_1}{h_2}=\frac{(${N(a)})(${N(L)})}{(${N(A)})(${N(t)})}\ln\frac{${N(h1)}}{${N(h2)}}=${N(k)}\ \text{cm/s}`,
            note: "Use ln, not log₁₀ — the derivation integrates dh/h.",
          },
          {
            title: "Equivalent constant-head check",
            tex: String.raw`k=\frac{aL}{At}\times2.303\log_{10}\frac{h_1}{h_2}=${N(((a * L) / (A * t)) * 2.302585 * Math.log10(h1 / h2))}\ \text{cm/s}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 10 */
  geo({
    id: "geo-perm-pump",
    group: "Permeability & Seepage",
    title: "Field Pumping Test",
    lede: "Steady-state drawdown in an observation well — unconfined (Dupuit) or confined (Thiem) aquifer.",
    formula: String.raw`k=\frac{Q\ln(r_1/r_2)}{\pi(h_1^2-h_2^2)} \quad\text{or}\quad k=\frac{Q\ln(r_1/r_2)}{2\pi t(h_1-h_2)}`,
    pages: [7],
    keywords: ["pumping test", "well", "aquifer", "unconfined", "confined", "drawdown"],
    inputs: [
      { k: "type", label: "Aquifer", type: "select", def: "u",
        options: [{ value: "u", label: "Unconfined" }, { value: "c", label: "Confined" }] },
      { k: "Q", label: "Pumping rate", sym: "Q", unit: "m³/s", def: 0.028, step: 0.001 },
      { k: "r1", label: "Radius, observation well 1", sym: "r_1", unit: "m", def: 30, step: 0.5 },
      { k: "r2", label: "Radius, observation well 2", sym: "r_2", unit: "m", def: 8, step: 0.5 },
      { k: "h1", label: "Head at r₁", sym: "h_1", unit: "m", def: 14.2, step: 0.1 },
      { k: "h2", label: "Head at r₂", sym: "h_2", unit: "m", def: 11.6, step: 0.1 },
      { k: "t", label: "Thickness of confined aquifer", sym: "t", unit: "m", def: 6.5, step: 0.1, hint: "confined case only" },
    ],
    run(v) {
      const { Q, r1, r2, h1, h2, t } = v;
      const ln = Math.log(r1 / r2);
      const unconf = v.type === "u";
      const k = unconf
        ? (Q * ln) / (Math.PI * (h1 * h1 - h2 * h2))
        : (Q * ln) / (2 * Math.PI * t * (h1 - h2));
      return {
        results: [
          { label: "Coefficient of permeability", sym: "k", value: k, unit: "m/s", hero: true, digits: 4 },
          { label: "ln(r₁/r₂)", value: ln, digits: 4 },
          { label: unconf ? "π(h₁² − h₂²)" : "2πt(h₁ − h₂)",
            value: unconf ? Math.PI * (h1 * h1 - h2 * h2) : 2 * Math.PI * t * (h1 - h2), digits: 4 },
        ],
        steps: [
          {
            title: unconf ? "Unconfined aquifer (Dupuit)" : "Confined aquifer (Thiem)",
            tex: unconf
              ? String.raw`k=\frac{Q\ln(r_1/r_2)}{\pi(h_1^2-h_2^2)}=\frac{(${N(Q)})\ln(${N(r1)}/${N(r2)})}{\pi\left[(${N(h1)})^2-(${N(h2)})^2\right]}=${N(k)}\ \text{m/s}`
              : String.raw`k=\frac{Q\ln(r_1/r_2)}{2\pi t(h_1-h_2)}=\frac{(${N(Q)})\ln(${N(r1)}/${N(r2)})}{2\pi(${N(t)})(${N(h1)}-${N(h2)})}=${N(k)}\ \text{m/s}`,
            note: unconf ? "The unconfined form integrates over the full saturated thickness, hence the squares." : "The confined form uses the constant aquifer thickness t.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 11 */
  geo({
    id: "geo-perm-eq",
    group: "Permeability & Seepage",
    title: "Equivalent Permeability (Layered Soil)",
    lede: "Flow parallel to the bedding planes averages k by thickness; flow across them averages the reciprocal.",
    formula: String.raw`k_{eq,\parallel}=\frac{\sum kh}{H} \qquad k_{eq,\perp}=\frac{H}{\sum (h/k)}`,
    pages: [7],
    keywords: ["equivalent permeability", "layered", "parallel", "perpendicular", "stratified"],
    inputs: [
      { k: "h1", label: "Layer 1 thickness", sym: "h_1", unit: "m", def: 2, step: 0.1 },
      { k: "k1", label: "Layer 1 permeability", sym: "k_1", unit: "cm/s", def: 1e-3, step: 1e-4 },
      { k: "h2", label: "Layer 2 thickness", sym: "h_2", unit: "m", def: 3, step: 0.1 },
      { k: "k2", label: "Layer 2 permeability", sym: "k_2", unit: "cm/s", def: 5e-4, step: 1e-4 },
      { k: "h3", label: "Layer 3 thickness", sym: "h_3", unit: "m", def: 1.5, step: 0.1 },
      { k: "k3", label: "Layer 3 permeability", sym: "k_3", unit: "cm/s", def: 2e-3, step: 1e-4 },
    ],
    run(v) {
      const { h1, h2, h3, k1, k2, k3 } = v;
      const H = h1 + h2 + h3;
      const kpar = (k1 * h1 + k2 * h2 + k3 * h3) / H;
      const kper = H / (h1 / k1 + h2 / k2 + h3 / k3);
      return {
        results: [
          { label: "Equivalent k — parallel to layers", sym: "k_eq,∥", value: kpar, unit: "cm/s", hero: true, digits: 4 },
          { label: "Equivalent k — perpendicular", sym: "k_eq,⊥", value: kper, unit: "cm/s", digits: 4 },
          { label: "Total thickness", sym: "H", value: H, unit: "m" },
          { label: "Ratio k∥ / k⊥", value: kpar / kper, digits: 3 },
        ],
        steps: [
          {
            title: "Parallel flow — weighted arithmetic mean",
            tex: String.raw`k_{eq,\parallel}=\frac{\sum kh}{H}=\frac{(${N(k1, 3)})(${N(h1)})+(${N(k2, 3)})(${N(h2)})+(${N(k3, 3)})(${N(h3)})}{${N(H)}}=${N(kpar, 4)}`,
            note: "Parallel flow: every layer sees the same hydraulic gradient, so the discharges add.",
          },
          {
            title: "Perpendicular flow — weighted harmonic mean",
            tex: String.raw`k_{eq,\perp}=\frac{H}{\sum \frac{h}{k}}=\frac{${N(H)}}{\frac{${N(h1)}}{${N(k1, 3)}}+\frac{${N(h2)}}{${N(k2, 3)}}+\frac{${N(h3)}}{${N(k3, 3)}}}=${N(kper, 4)}`,
            note: "Perpendicular flow: the same discharge passes through every layer, so the head losses add.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 12 */
  geo({
    id: "geo-seepage",
    group: "Permeability & Seepage",
    title: "Flow Net Seepage",
    lede: "Seepage quantity and unit head drop from a drawn flow net — isotropic or anisotropic soil.",
    formula: String.raw`Q=kH\frac{N_f}{N_d} \qquad Q=\sqrt{k_xk_z}\,H\frac{N_f}{N_d} \qquad d=\frac{H}{N_d}`,
    pages: [9],
    keywords: ["flow net", "seepage", "equipotential", "flow line", "phreatic"],
    inputs: [
      { k: "k", label: "Permeability (isotropic)", sym: "k", unit: "m/s", def: 2e-5, step: 1e-6 },
      { k: "kx", label: "k_x (anisotropic)", sym: "k_x", unit: "m/s", def: 4e-5, step: 1e-6 },
      { k: "kz", label: "k_z (anisotropic)", sym: "k_z", unit: "m/s", def: 1e-5, step: 1e-6 },
      { k: "H", label: "Head difference", sym: "H", unit: "m", def: 6, step: 0.1 },
      { k: "Nf", label: "Number of flow channels", sym: "N_f", unit: "", def: 4, step: 1 },
      { k: "Nd", label: "Number of equipotential drops", sym: "N_d", unit: "", def: 12, step: 1 },
      { k: "aniso", label: "Soil condition", type: "select", def: 0,
        options: [{ value: 0, label: "Isotropic" }, { value: 1, label: "Non-isotropic (use kx, kz)" }] },
    ],
    run(v) {
      const { k, kx, kz, H, Nf, Nd } = v;
      const ke = v.aniso ? Math.sqrt(kx * kz) : k;
      const Q = ke * H * (Nf / Nd);
      const d = H / Nd;
      return {
        results: [
          { label: "Seepage quantity", sym: "Q", value: Q, unit: "m³/s per m", hero: true, digits: 4 },
          { label: "Governing permeability", sym: "k", value: ke, unit: "m/s", digits: 4, note: v.aniso ? "geometric mean √(kx·kz)" : "isotropic input" },
          { label: "Unit head drop", sym: "d", value: d, unit: "m", digits: 4 },
          { label: "Shape factor", sym: "N_f/N_d", value: Nf / Nd, digits: 4 },
        ],
        steps: [
          {
            title: "Shape factor from the flow net",
            tex: String.raw`\frac{N_f}{N_d}=\frac{${N(Nf)}}{${N(Nd)}}=${N(Nf / Nd)}`,
          },
          v.aniso ? {
            title: "Transform the anisotropic permeability",
            tex: String.raw`k=\sqrt{k_xk_z}=\sqrt{(${N(kx, 3)})(${N(kz, 3)})}=${N(ke, 4)}\ \text{m/s}`,
            note: "The card's note: for non-isotropic soil, replace k with √(kx·kz) and draw the net on a transformed section.",
          } : null,
          {
            title: "Seepage quantity",
            tex: String.raw`Q=kH\frac{N_f}{N_d}=(${N(ke, 4)})(${N(H)})\left(\frac{${N(Nf)}}{${N(Nd)}}\right)=${N(Q, 4)}\ \text{m}^3\text{/s per metre width}`,
          },
          {
            title: "Unit drop between equipotential lines",
            tex: String.raw`d=\frac{H}{N_d}=\frac{${N(H)}}{${N(Nd)}}=${N(d)}\ \text{m}`,
            note: "Multiplying d by the number of drops from the entry face gives the head at any point in the net.",
          },
        ].filter(Boolean),
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 13 */
  geo({
    id: "geo-stress",
    group: "Stresses in Soil",
    title: "Total, Pore & Effective Vertical Stress",
    lede: "A layered profile with a water table: total stress, pore pressure, and the effective stress that actually controls strength.",
    formula: String.raw`P_T=\Sigma\gamma h \qquad P_w=\gamma_w h_w \qquad P_E=P_T-P_w`,
    pages: [7],
    keywords: ["effective stress", "pore pressure", "total stress", "water table", "capillary", "overburden"],
    viz: "geo:stress",
    inputs: [
      { k: "H1", label: "Dry layer thickness", sym: "H_1", unit: "m", def: 3, step: 0.1 },
      { k: "g1", label: "Unit weight above water table", sym: "γ_1", unit: "kN/m³", def: 17.5, step: 0.1 },
      { k: "H2", label: "Saturated layer thickness", sym: "H_2", unit: "m", def: 5, step: 0.1 },
      { k: "g2", label: "Saturated unit weight", sym: "γ_sat", unit: "kN/m³", def: 20.1, step: 0.1 },
      { k: "z", label: "Depth of interest below ground", sym: "z", unit: "m", def: 6, step: 0.1 },
      { k: "gw", label: "Unit weight of water", sym: "γ_w", unit: "kN/m³", def: 9.81, step: 0.01 },
    ],
    run(v) {
      const { H1, g1, H2, g2, z, gw } = v;
      const Htot = H1 + H2;
      const zc = Math.min(Math.max(z, 0), Htot);

      const dryPart = Math.min(zc, H1);
      const satPart = Math.max(0, zc - H1);
      const PT = g1 * dryPart + g2 * satPart;
      const hw = satPart;              // water table at H1
      const Pw = gw * hw;
      const PE = PT - Pw;

      const gsat1 = g1;                // above WT the soil is at its natural (moist) weight
      const gsub = g2 - gw;

      return {
        results: [
          { label: "Total vertical stress", sym: "P_T", value: PT, unit: "kPa", hero: true },
          { label: "Pore water pressure", sym: "P_w", value: Pw, unit: "kPa" },
          { label: "Effective vertical stress", sym: "P_E", value: PE, unit: "kPa" },
          { label: "Submerged unit weight", sym: "γ′", value: gsub, unit: "kN/m³" },
          { label: "Water table depth", value: H1, unit: "m", note: "assumed at the base of the dry layer" },
        ],
        steps: [
          {
            title: "Total stress at the depth",
            tex: String.raw`P_T=\Sigma\gamma h=(${N(g1)})(${N(dryPart)})+(${N(g2)})(${N(satPart)})=${N(PT)}\ \text{kPa}`,
            note: zc > Htot ? `The depth asked for (${N(z)} m) is below the profile — the stress shown is at the base, ${N(Htot)} m.` : null,
          },
          {
            title: "Pore water pressure",
            tex: String.raw`P_w=\gamma_w h_w=(${N(gw)})(${N(hw)})=${N(Pw)}\ \text{kPa}`,
            note: hw === 0 ? "Above the water table the pore pressure is zero (capillary tension is neglected here)." : null,
          },
          {
            title: "Effective stress",
            tex: String.raw`P_E=P_T-P_w=${N(PT)}-${N(Pw)}=${N(PE)}\ \text{kPa}`,
            note: "The same answer comes from Σγ′h below the water table — the two routes must agree.",
          },
          {
            title: "Check via submerged unit weight",
            tex: String.raw`P_E=(${N(g1)})(${N(dryPart)})+(${N(gsub)})(${N(satPart)})=${N(g1 * dryPart + gsub * satPart)}\ \text{kPa}`,
          },
        ],
        viz: { H1, H2, g1, g2, z: zc, PT, Pw, PE, gw },
      };
    },
  }),

  /* --------------------------------------------------------------- 14 */
  geo({
    id: "geo-boussinesq",
    group: "Stresses in Soil",
    title: "Stress Increase from a Surface Load",
    lede: "Boussinesq for a point load or a circular uniform load, plus the Westergaard point-load form the card also lists.",
    formula: String.raw`\Delta P=\frac{3Pz^3}{2\pi(z^2+r^2)^{5/2}}`,
    pages: [12],
    keywords: ["boussinesq", "westergaard", "stress increase", "point load", "circular load", "influence"],
    inputs: [
      { k: "P", label: "Point load", sym: "P", unit: "kN", def: 900, step: 10 },
      { k: "q", label: "Uniform pressure", sym: "q", unit: "kPa", def: 150, step: 5 },
      { k: "r", label: "Horizontal distance", sym: "r", unit: "m", def: 2, step: 0.1 },
      { k: "z", label: "Depth below footing", sym: "z", unit: "m", def: 4, step: 0.1 },
      { k: "mode", label: "Load type", type: "select", def: "point",
        options: [
          { value: "point", label: "Point load (Boussinesq)" },
          { value: "unif", label: "Uniform load over area" },
          { value: "west", label: "Point load (Westergaard)" },
        ] },
    ],
    run(v) {
      const { P, q, r, z } = v;
      const R2 = z * z + r * r;
      const bouss = (3 * P * z ** 3) / (2 * Math.PI * R2 ** 2.5);
      const unif = (2 * q * z ** 3) / (Math.PI * R2 * R2);
      const Nn = 1 / Math.pow(1 + 2 * (r / z) ** 2, 1.5);
      const west = (0.318 * P * Nn) / (z * z);

      const map = { point: bouss, unif, west };
      const val = map[v.mode];
      const name = v.mode === "point" ? "Boussinesq point load" : v.mode === "unif" ? "Uniform load" : "Westergaard point load";

      return {
        results: [
          { label: `ΔP — ${name}`, value: val, unit: "kPa", hero: true, digits: 4 },
          { label: "Boussinesq (point)", value: bouss, unit: "kPa", digits: 4 },
          { label: "Uniform area load", value: unif, unit: "kPa", digits: 4 },
          { label: "Westergaard (point)", value: west, unit: "kPa", digits: 4 },
          { label: "Westergaard N", value: Nn, digits: 4, note: "N = 1/[1+2(r/z)²]^1.5" },
        ],
        steps: [
          {
            title: "Boussinesq — point load",
            tex: String.raw`\Delta P=\frac{3Pz^3}{2\pi(z^2+r^2)^{5/2}}=\frac{3(${N(P)})(${N(z)})^3}{2\pi\left[(${N(z)})^2+(${N(r)})^2\right]^{5/2}}=${N(bouss, 4)}\ \text{kPa}`,
          },
          {
            title: "Uniform load over an area",
            tex: String.raw`\Delta P=\frac{2qz^3}{\pi(z^2+r^2)^{2}}=\frac{2(${N(q)})(${N(z)})^3}{\pi\left[(${N(z)})^2+(${N(r)})^2\right]^{2}}=${N(unif, 4)}\ \text{kPa}`,
          },
          {
            title: "Westergaard — point load",
            tex: String.raw`N=\frac{1}{\left[1+2\left(\frac{r}{z}\right)^2\right]^{1.5}}=${N(Nn, 4)}` +
              String.raw`\\[4pt] P=\frac{0.318\,Q\,N}{z^2}=\frac{0.318(${N(P)})(${N(Nn, 4)})}{(${N(z)})^2}=${N(west, 4)}\ \text{kPa}`,
            note: "Westergaard's solution assumes thin horizontal layers with slip between them — it gives a smaller stress increase than Boussinesq at the same depth.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 15 */
  geo({
    id: "geo-consol",
    group: "Consolidation & Settlement",
    title: "Primary Consolidation Settlement",
    lede: "Normally consolidated, over-consolidated, or crossing the preconsolidation pressure — the card's three cases.",
    formula: String.raw`S_c=\frac{C_cH}{1+e_0}\log\frac{P_0+\Delta P}{P_0}`,
    pages: [8],
    keywords: ["settlement", "consolidation", "cc", "ocr", "preconsolidation", "swell"],
    inputs: [
      { k: "Cc", label: "Compression index", sym: "C_c", unit: "", def: 0.32, step: 0.01 },
      { k: "H", label: "Thickness of clay layer", sym: "H", unit: "m", def: 6, step: 0.1 },
      { k: "e0", label: "Initial void ratio", sym: "e_0", unit: "", def: 0.92, step: 0.01 },
      { k: "P0", label: "Initial effective overburden", sym: "P_0", unit: "kPa", def: 110, step: 1 },
      { k: "dP", label: "Stress increase", sym: "ΔP", unit: "kPa", def: 55, step: 1 },
      { k: "Pc", label: "Preconsolidation pressure", sym: "P_c", unit: "kPa", def: 140, step: 1, hint: "leave 0 for normally consolidated" },
    ],
    run(v) {
      const { Cc, H, e0, P0, dP, Pc } = v;
      const Cs = Cc / 5;
      const OCR = Pc > 0 ? Pc / P0 : 1;
      const Pf = P0 + dP;

      let Sc, kase, texLine, note;
      if (!(Pc > P0)) {
        kase = "Normally consolidated";
        Sc = (Cc * H) / (1 + e0) * Math.log10(Pf / P0);
        texLine = String.raw`S_c=\frac{C_cH}{1+e_0}\log\frac{P_0+\Delta P}{P_0}=\frac{(${N(Cc)})(${N(H)})}{1+${N(e0)}}\log\frac{${N(Pf)}}{${N(P0)}}=${N(Sc, 4)}\ \text{m}`;
        note = "The soil has never carried more than its present load, so the whole compression follows the virgin Cc line.";
      } else if (Pf < Pc) {
        kase = "Over-consolidated — stays on the recompression line";
        Sc = (Cs * H) / (1 + e0) * Math.log10(Pf / P0);
        texLine = String.raw`S_c=\frac{C_sH}{1+e_0}\log\frac{P_0+\Delta P}{P_0},\quad C_s=\frac{C_c}{5}=${N(Cs, 3)}` +
          String.raw`\\[4pt] S_c=\frac{(${N(Cs, 3)})(${N(H)})}{1+${N(e0)}}\log\frac{${N(Pf)}}{${N(P0)}}=${N(Sc, 4)}\ \text{m}`;
        note = "Because P₀+ΔP is still below P_c, the soil only recompresses — it uses C_s, not C_c.";
      } else {
        kase = "Over-consolidated — crosses P_c";
        Sc = (Cs * H) / (1 + e0) * Math.log10(Pc / P0) + (Cc * H) / (1 + e0) * Math.log10(Pf / Pc);
        texLine = String.raw`S_c=\frac{C_sH}{1+e_0}\log\frac{P_c}{P_0}+\frac{C_cH}{1+e_0}\log\frac{P_0+\Delta P}{P_c}` +
          String.raw`\\[4pt] S_c=${N(Sc, 4)}\ \text{m}`;
        note = "Two segments: recompression up to P_c, then virgin compression beyond it.";
      }

      return {
        results: [
          { label: "Primary consolidation settlement", sym: "S_c", value: Sc * 1000, unit: "mm", hero: true, badge: kase, badgeTone: "warn" },
          { label: "Settlement", value: Sc, unit: "m", digits: 5 },
          { label: "Overconsolidation ratio", sym: "OCR", value: OCR, digits: 4 },
          { label: "Swell index", sym: "C_s", value: Cs, digits: 4, note: "C_s = C_c/5" },
          { label: "Final pressure", sym: "P_0+ΔP", value: Pf, unit: "kPa" },
        ],
        steps: [
          {
            title: "Compare the final pressure with P_c",
            tex: String.raw`P_0+\Delta P=${N(P0)}+${N(dP)}=${N(Pf)}\ \text{kPa}\quad\text{vs}\quad P_c=${N(Pc)}\ \text{kPa}`,
            note: `<b>${kase}.</b> ${note}`,
          },
          {
            title: "Swell (recompression) index",
            tex: String.raw`C_s=\frac{C_c}{5}=\frac{${N(Cc)}}{5}=${N(Cs, 4)}`,
          },
          { title: "Settlement", tex: texLine },
          {
            title: "Sanity check — strain",
            tex: String.raw`\varepsilon=\frac{S_c}{H}=\frac{${N(Sc, 5)}}{${N(H)}}=${N((Sc / H) * 100, 3)}\%`,
            note: "Anything beyond a few percent for a stiff clay is worth double-checking against the load.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 16 */
  geo({
    id: "geo-cv",
    group: "Consolidation & Settlement",
    title: "Coefficient of Consolidation & Time Rate",
    lede: "Cv from the drainage path and time factor, then the permeability it implies.",
    formula: String.raw`C_v=\frac{H_{dr}^2T_v}{t} \qquad k=C_vm_v\gamma_w`,
    pages: [8],
    keywords: ["cv", "time factor", "consolidation rate", "drainage path", "mv"],
    inputs: [
      { k: "Hdr", label: "Drainage path length", sym: "H_{dr}", unit: "m", def: 3, step: 0.1, hint: "H one-way, H/2 for double drainage" },
      { k: "Tv", label: "Time factor", sym: "T_v", unit: "", def: 0.197, step: 0.001, hint: "T_v = 0.197 at U = 50 %" },
      { k: "t", label: "Time to reach that degree of consolidation", sym: "t", unit: "days", def: 240, step: 1 },
      { k: "mv", label: "Coefficient of volume compressibility", sym: "m_v", unit: "m²/kN", def: 0.00028, step: 0.00001 },
      { k: "gw", label: "Unit weight of water", sym: "γ_w", unit: "kN/m³", def: 9.81, step: 0.01 },
    ],
    run(v) {
      const { Hdr, Tv, t, mv, gw } = v;
      const tsec = t * 86400;
      const cv = (Hdr * Hdr * Tv) / tsec;
      const k = cv * mv * gw;
      const U = Tv <= 0.197
        ? Math.sqrt((4 * Tv) / Math.PI) * 100
        : (1 - Math.pow(10, -(0.9332 * Tv + 0.0851) / 0.9332)) * 100;

      return {
        results: [
          { label: "Coefficient of consolidation", sym: "C_v", value: cv, unit: "m²/s", hero: true, digits: 4 },
          { label: "C_v in cm²/min", value: cv * 1e4 * 60, digits: 4 },
          { label: "Permeability implied", sym: "k", value: k, unit: "m/s", digits: 4 },
          { label: "Degree of consolidation", sym: "U", value: U, unit: "%", digits: 3 },
        ],
        steps: [
          {
            title: "Convert the time to seconds",
            tex: String.raw`t=${N(t)}\ \text{days}\times86400=${N(tsec)}\ \text{s}`,
          },
          {
            title: "Coefficient of consolidation",
            tex: String.raw`C_v=\frac{H_{dr}^2T_v}{t}=\frac{(${N(Hdr)})^2(${N(Tv)})}{${N(tsec)}}=${N(cv, 4)}\ \text{m}^2\text{/s}`,
            note: "The drainage path is the longest route water must travel: H for one-way drainage, H/2 for a doubly drained layer.",
          },
          {
            title: "Permeability from C_v",
            tex: String.raw`k=C_vm_v\gamma_w=(${N(cv, 4)})(${N(mv)})(${N(gw)})=${N(k, 4)}\ \text{m/s}`,
          },
          {
            title: "Degree of consolidation at that T_v",
            tex: String.raw`U\approx\sqrt{\frac{4T_v}{\pi}}\ \ (T_v\le0.197) \;\Rightarrow\; U=${N(U, 3)}\%`,
            note: "T_v = 0.197 corresponds to U = 50 %; T_v = 0.848 corresponds to U = 90 %.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 17 */
  geo({
    id: "geo-terzaghi",
    group: "Bearing Capacity",
    title: "Terzaghi Ultimate Bearing Capacity",
    lede: "Strip, square, circular or rectangular footing — general shear, with the local-shear reduction available.",
    formula: String.raw`q_u=cN_c+qN_q+\tfrac12\gamma BN_\gamma`,
    pages: [12],
    keywords: ["terzaghi", "bearing capacity", "footing", "qu", "nc", "nq", "ngamma", "local shear"],
    viz: "geo:footing",
    inputs: [
      { k: "shape", label: "Footing shape", type: "select", def: "strip",
        options: [
          { value: "strip", label: "Strip" }, { value: "square", label: "Square" },
          { value: "circ", label: "Circular" }, { value: "rect", label: "Rectangular" },
        ] },
      { k: "c", label: "Cohesion", sym: "c", unit: "kPa", def: 18, step: 1 },
      { k: "phi", label: "Angle of internal friction", sym: "φ", unit: "°", def: 28, step: 1 },
      { k: "B", label: "Footing width", sym: "B", unit: "m", def: 1.8, step: 0.1 },
      { k: "L", label: "Footing length", sym: "L", unit: "m", def: 2.6, step: 0.1, hint: "rectangular only" },
      { k: "Df", label: "Depth of footing", sym: "D_f", unit: "m", def: 1.5, step: 0.1 },
      { k: "g", label: "Unit weight of soil", sym: "γ", unit: "kN/m³", def: 18.5, step: 0.1 },
      { k: "local", label: "Shear failure mode", type: "select", def: 0,
        options: [{ value: 0, label: "General shear" }, { value: 1, label: "Local shear" }] },
      { k: "FS", label: "Factor of safety", sym: "FS", unit: "", def: 3, step: 0.1 },
    ],
    run(v) {
      const { B, L, Df, g, FS } = v;
      const local = !!v.local;
      const phi = (v.phi * Math.PI) / 180;
      const c = local ? (2 / 3) * v.c : v.c;
      const phiU = local ? Math.atan((2 / 3) * Math.tan(phi)) : phi;

      const Nq = Math.exp(Math.PI * Math.tan(phiU)) * Math.tan(Math.PI / 4 + phiU / 2) ** 2;
      const Nc = phiU > 1e-6 ? (Nq - 1) / Math.tan(phiU) : 5.7;
      const Ng = 2 * (Nq + 1) * Math.tan(phiU);
      const q = g * Df;

      let qu, shapeTex, shapeName;
      const shape = v.shape;
      if (shape === "strip") {
        qu = c * Nc + q * Nq + 0.5 * g * B * Ng;
        shapeTex = String.raw`q_u=cN_c+qN_q+0.5\gamma BN_\gamma`;
        shapeName = "Strip footing";
      } else if (shape === "square") {
        qu = 1.3 * c * Nc + q * Nq + 0.4 * g * B * Ng;
        shapeTex = String.raw`q_u=1.3cN_c+qN_q+0.4\gamma BN_\gamma`;
        shapeName = "Square footing";
      } else if (shape === "circ") {
        qu = 1.3 * c * Nc + q * Nq + 0.3 * g * B * Ng;
        shapeTex = String.raw`q_u=1.3cN_c+qN_q+0.3\gamma BN_\gamma`;
        shapeName = "Circular footing (B = diameter)";
      } else {
        const bl = B / L;
        qu = (1 + 0.3 * bl) * c * Nc + q * Nq + (0.5 - 0.1 * bl) * g * B * Ng;
        shapeTex = String.raw`q_u=\left(1+\frac{0.3B}{L}\right)cN_c+qN_q+\left(0.5-\frac{0.1B}{L}\right)\gamma BN_\gamma`;
        shapeName = "Rectangular footing";
      }

      const qall = qu / FS;
      return {
        results: [
          { label: "Ultimate bearing capacity", sym: "q_u", value: qu, unit: "kPa", hero: true, badge: shapeName, badgeTone: "ok" },
          { label: "Allowable bearing capacity", sym: "q_all", value: qall, unit: "kPa" },
          { label: "Surcharge at footing level", sym: "q = γD_f", value: q, unit: "kPa" },
          { label: "N_c", value: Nc, digits: 4 },
          { label: "N_q", value: Nq, digits: 4 },
          { label: "N_γ", value: Ng, digits: 4 },
          { label: "Friction angle used", sym: "φ", value: (phiU * 180) / Math.PI, unit: "°", digits: 4, note: local ? "local shear: tanφ′ = ⅔ tanφ" : null },
        ],
        steps: [
          {
            title: local ? "Local shear — reduce the strength parameters" : "Read the strength parameters",
            tex: local
              ? String.raw`c'=\frac{2}{3}c=${N((2 / 3) * v.c, 4)}\ \text{kPa},\qquad \tan\phi'=\frac{2}{3}\tan\phi \Rightarrow \phi'=${N((phiU * 180) / Math.PI, 4)}^\circ`
              : String.raw`c=${N(v.c)}\ \text{kPa},\qquad \phi=${N(v.phi)}^\circ`,
            note: local ? "The card's note: for local shear failure use c′ = ⅔c and tanφ′ = ⅔tanφ, then the same equations." : null,
          },
          {
            title: "Bearing capacity factors",
            tex: String.raw`N_q=e^{\pi\tan\phi}\tan^2\left(45+\frac{\phi}{2}\right)=${N(Nq, 4)}` +
              String.raw`\\[4pt] N_c=\frac{N_q-1}{\tan\phi}=${N(Nc, 4)}` +
              String.raw`\\[4pt] N_\gamma=2(N_q+1)\tan\phi=${N(Ng, 4)}`,
            note: "The card also gives the equivalent K-form: N_c = tanφ(K_c+1), N_q = K_q tanφ, N_γ = ½tanφ(K_γ tanφ − 1). Tabulated Terzaghi N_γ runs a little higher at large φ.",
          },
          {
            title: "Surcharge at the base level",
            tex: String.raw`q=\gamma D_f=(${N(g)})(${N(Df)})=${N(q)}\ \text{kPa}`,
          },
          {
            title: `${shapeName} — ultimate capacity`,
            tex: shapeTex + String.raw`\\[4pt] q_u=${N(qu, 5)}\ \text{kPa}`,
          },
          {
            title: "Allowable bearing capacity",
            tex: String.raw`q_{all}=\frac{q_u}{FS}=\frac{${N(qu, 5)}}{${N(FS)}}=${N(qall, 5)}\ \text{kPa}`,
          },
        ],
        viz: { B, L, Df, phi: (phiU * 180) / Math.PI, qu, shape: v.shape },
      };
    },
  }),

  /* --------------------------------------------------------------- 18 */
  geo({
    id: "geo-mat",
    group: "Bearing Capacity",
    title: "Mat Foundation Bearing Capacity",
    lede: "The card's net-bearing-capacity forms: saturated clay (φ = 0) and granular soil from SPT resistance.",
    formula: String.raw`q_{u(net)}=5.14c_u\left(1+\frac{0.195B}{L}\right)\left(1+\frac{0.4D_f}{B}\right)`,
    pages: [13],
    keywords: ["mat", "raft", "net bearing", "clay", "granular", "spt", "n60"],
    inputs: [
      { k: "kind", label: "Soil", type: "select", def: "clay",
        options: [{ value: "clay", label: "Saturated clay (φ = 0)" }, { value: "sand", label: "Granular soil (SPT)" }] },
      { k: "cu", label: "Undrained cohesion", sym: "c_u", unit: "kPa", def: 60, step: 1 },
      { k: "N60", label: "SPT resistance", sym: "N_60", unit: "blows/300mm", def: 18, step: 1 },
      { k: "Se", label: "Settlement", sym: "S_e", unit: "mm", def: 25, step: 1 },
      { k: "B", label: "Mat width", sym: "B", unit: "m", def: 8, step: 0.1 },
      { k: "L", label: "Mat length", sym: "L", unit: "m", def: 12, step: 0.1 },
      { k: "Df", label: "Depth of mat", sym: "D_f", unit: "m", def: 2.5, step: 0.1 },
    ],
    run(v) {
      const { cu, N60, Se, B, L, Df } = v;
      const clay = v.kind === "clay";
      const quClay = 5.14 * cu * (1 + (0.195 * B) / L) * (1 + (0.4 * Df) / B);
      const qSand = (N60 / 0.08) * (1 + (0.33 * Df) / B) * (Se / 25);
      const cap = 16.63 * N60 * (Se / 25);
      const qu = clay ? quClay : Math.min(qSand, cap);
      return {
        results: [
          { label: "Net ultimate bearing capacity", sym: "q_u(net)", value: qu, unit: "kPa", hero: true, badge: clay ? "Clay, φ = 0" : "Granular" },
          { label: clay ? "5.14 c_u" : "N₆₀/0.08", value: clay ? 5.14 * cu : N60 / 0.08, unit: "kPa", digits: 4 },
          { label: "Width factor", value: 1 + (0.195 * B) / L, digits: 4 },
          { label: "Depth factor", value: 1 + (0.4 * Df) / B, digits: 4 },
          { label: clay ? "—" : "Upper limit 16.63 N₆₀ (Se/25)", value: clay ? "—" : cap, unit: "kPa", digits: 4 },
        ],
        steps: [
          clay ? {
            title: "Saturated clay — φ = 0",
            tex: String.raw`q_{u(net)}=5.14c_u\left(1+\frac{0.195B}{L}\right)\left(1+\frac{0.4D_f}{B}\right)` +
              String.raw`\\[4pt] =5.14(${N(cu)})\left(1+\frac{0.195(${N(B)})}{${N(L)}}\right)\left(1+\frac{0.4(${N(Df)})}{${N(B)}}\right)=${N(qu, 5)}\ \text{kPa}`,
            note: "For φ = 0 the N_q and N_γ terms vanish, leaving N_c = 5.14.",
          } : {
            title: "Granular soil — SPT form",
            tex: String.raw`q_{u(net)}=\frac{N_{60}}{0.08}\left(1+\frac{0.33D_f}{B}\right)\left(\frac{S_e}{25}\right)\le16.63N_{60}\left(\frac{S_e}{25}\right)` +
              String.raw`\\[4pt] =${N(qSand, 5)}\ \text{kPa}\quad\le\quad${N(cap, 5)}\ \text{kPa}`,
          },
          {
            title: "Governing value",
            tex: String.raw`q_{u(net)}=${N(qu, 5)}\ \text{kPa}`,
            note: clay ? null : "The cap controls when the settlement term is generous — the smaller of the two governs.",
          },
        ].filter((s) => s.tex),
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 19 */
  geo({
    id: "geo-lateral",
    group: "Lateral Earth Pressure",
    title: "Lateral Earth Pressure Coefficients",
    lede: "Rankine active, passive and at-rest coefficients — level or sloping backfill — with the pressure at any depth.",
    formula: String.raw`k_a=\frac{1-\sin\phi}{1+\sin\phi} \qquad k_p=\frac{1+\sin\phi}{1-\sin\phi} \qquad k_o=1-\sin\phi`,
    pages: [11],
    keywords: ["earth pressure", "rankine", "active", "passive", "at rest", "retaining wall", "ka", "kp"],
    viz: "geo:wall",
    inputs: [
      { k: "phi", label: "Angle of internal friction", sym: "φ", unit: "°", def: 30, step: 1 },
      { k: "beta", label: "Backfill slope angle", sym: "β", unit: "°", def: 0, step: 1 },
      { k: "g", label: "Unit weight of backfill", sym: "γ", unit: "kN/m³", def: 18, step: 0.1 },
      { k: "H", label: "Wall height", sym: "H", unit: "m", def: 5, step: 0.1 },
      { k: "q", label: "Surcharge", sym: "q", unit: "kPa", def: 0, step: 1 },
      { k: "c", label: "Cohesion", sym: "c", unit: "kPa", def: 0, step: 1 },
    ],
    run(v) {
      const { g, H, q, c } = v;
      const phi = (v.phi * Math.PI) / 180;
      const beta = (v.beta * Math.PI) / 180;

      let ka, kp;
      if (Math.abs(beta) < 1e-9) {
        ka = (1 - Math.sin(phi)) / (1 + Math.sin(phi));
        kp = (1 + Math.sin(phi)) / (1 - Math.sin(phi));
      } else {
        const cb = Math.cos(beta), cp = Math.cos(phi);
        const root = Math.sqrt(Math.max(cb * cb - cp * cp, 0));
        ka = cb * (cb - root) / (cb + root);
        kp = cb * (cb + root) / (cb - root);
      }
      const ko = 1 - Math.sin(phi);

      const pa = ka * g * H;
      const pq = ka * q;
      const pc = 2 * c * Math.sqrt(ka);
      const Pa = 0.5 * pa * H + pq * H;         // total active thrust per metre

      return {
        results: [
          { label: "Active earth pressure coefficient", sym: "k_a", value: ka, digits: 4, hero: true },
          { label: "Passive earth pressure coefficient", sym: "k_p", value: kp, digits: 4 },
          { label: "At-rest coefficient", sym: "k_o", value: ko, digits: 4, note: "k_o = 1 − sinφ, cohesion neglected" },
          { label: "Active pressure at base", sym: "p_a = k_aγH", value: pa, unit: "kPa" },
          { label: "Surcharge pressure", sym: "p_q = k_a q", value: pq, unit: "kPa" },
          { label: "Cohesion relief", sym: "p_c = 2c√k_a", value: pc, unit: "kPa" },
          { label: "Total active thrust", sym: "P_a", value: Pa, unit: "kN/m" },
        ],
        steps: [
          {
            title: v.beta ? "Sloping backfill — Rankine with β" : "Level backfill (β = 0)",
            tex: v.beta
              ? String.raw`k_a=\cos\beta\frac{\cos\beta-\sqrt{\cos^2\beta-\cos^2\phi}}{\cos\beta+\sqrt{\cos^2\beta-\cos^2\phi}}=${N(ka, 4)}` +
                String.raw`\\[4pt] k_p=\cos\beta\frac{\cos\beta+\sqrt{\cos^2\beta-\cos^2\phi}}{\cos\beta-\sqrt{\cos^2\beta-\cos^2\phi}}=${N(kp, 4)}`
              : String.raw`k_a=\frac{1-\sin\phi}{1+\sin\phi}=\frac{1-\sin${N(v.phi)}^\circ}{1+\sin${N(v.phi)}^\circ}=${N(ka, 4)}` +
                String.raw`\\[4pt] k_p=\frac{1+\sin\phi}{1-\sin\phi}=${N(kp, 4)}`,
            note: v.beta ? "With β ≠ 0 the coefficient is measured on the sloping face, not vertically." : null,
          },
          {
            title: "Pressure at the base of the wall",
            tex: String.raw`p_a=k_a\gamma H=(${N(ka, 4)})(${N(g)})(${N(H)})=${N(pa)}\ \text{kPa}`,
            note: `The card's pressure diagram: a triangle from k_aγH at the base, a rectangle k_a q for surcharge, and a constant 2c√k_a pulled the other way.`,
          },
          q > 0 ? {
            title: "Surcharge contribution",
            tex: String.raw`p_q=k_a q=(${N(ka, 4)})(${N(q)})=${N(pq)}\ \text{kPa}`,
          } : null,
          c > 0 ? {
            title: "Cohesion contribution",
            tex: String.raw`p_c=2c\sqrt{k_a}=2(${N(c)})\sqrt{${N(ka, 4)}}=${N(pc)}\ \text{kPa}`,
          } : null,
          {
            title: "Total active thrust per metre of wall",
            tex: String.raw`P_a=\tfrac12p_aH+p_qH=\tfrac12(${N(pa)})(${N(H)})+(${N(pq)})(${N(H)})=${N(Pa)}\ \text{kN/m}`,
            note: "Acting at H/3 above the base for the triangular part and H/2 for the rectangular part.",
          },
        ].filter(Boolean),
        viz: { ka, kp, g, H, pa, pq, pc, phi: v.phi },
      };
    },
  }),

  /* --------------------------------------------------------------- 20 */
  geo({
    id: "geo-slope",
    group: "Slope Stability",
    title: "Infinite Slope Factor of Safety",
    lede: "With and without seepage, plus the critical angle of failure the card writes as θ_cr = (β + φ_d)/2.",
    formula: String.raw`FS=\frac{c}{\gamma H\cos^2\beta\tan\beta}+\frac{\tan\phi}{\tan\beta}`,
    pages: [14],
    keywords: ["slope", "factor of safety", "infinite slope", "seepage", "stability"],
    viz: "geo:slope",
    inputs: [
      { k: "c", label: "Cohesion", sym: "c", unit: "kPa", def: 12, step: 1 },
      { k: "phi", label: "Angle of internal friction", sym: "φ", unit: "°", def: 26, step: 1 },
      { k: "beta", label: "Slope angle", sym: "β", unit: "°", def: 22, step: 1 },
      { k: "H", label: "Depth of the slip surface", sym: "H", unit: "m", def: 4, step: 0.1 },
      { k: "g", label: "Unit weight (moist)", sym: "γ", unit: "kN/m³", def: 18, step: 0.1 },
      { k: "gsat", label: "Saturated unit weight", sym: "γ_sat", unit: "kN/m³", def: 20.5, step: 0.1 },
      { k: "gw", label: "Unit weight of water", sym: "γ_w", unit: "kN/m³", def: 9.81, step: 0.01 },
      { k: "seep", label: "Seepage", type: "select", def: 0,
        options: [{ value: 0, label: "No seepage" }, { value: 1, label: "With seepage (parallel to slope)" }] },
    ],
    run(v) {
      const { c, H, g, gsat, gw } = v;
      const phi = (v.phi * Math.PI) / 180;
      const beta = (v.beta * Math.PI) / 180;
      const gsub = gsat - gw;

      const base = c / (g * H * Math.cos(beta) ** 2 * Math.tan(beta));
      const fric = Math.tan(phi) / Math.tan(beta);
      const FSdry = base + fric;

      const baseWet = c / (gsat * H * Math.cos(beta) ** 2 * Math.tan(beta));
      const fricWet = (gsub / gsat) * (Math.tan(phi) / Math.tan(beta));
      const FSwet = baseWet + fricWet;

      const FS = v.seep ? FSwet : FSdry;
      const thetaCr = ((v.beta + v.phi) / 2);

      return {
        results: [
          { label: "Factor of safety", sym: "FS", value: FS, digits: 4, hero: true,
            badge: FS >= 1.5 ? "Stable" : FS >= 1 ? "Marginal" : "Unstable",
            badgeTone: FS >= 1.5 ? "ok" : FS >= 1 ? "warn" : "bad" },
          { label: "Cohesion term", value: v.seep ? baseWet : base, digits: 4 },
          { label: "Friction term", value: v.seep ? fricWet : fric, digits: 4 },
          { label: "FS without seepage", value: FSdry, digits: 4 },
          { label: "FS with seepage", value: FSwet, digits: 4 },
          { label: "Critical failure angle", sym: "θ_cr", value: thetaCr, unit: "°", note: "θ_cr = (β + φ_d)/2" },
        ],
        steps: [
          {
            title: v.seep ? "With seepage — the effective unit weight reduces friction" : "Without seepage",
            tex: v.seep
              ? String.raw`FS=\frac{c}{\gamma_{sat}H\cos^2\beta\tan\beta}+\frac{\gamma'}{\gamma_{sat}}\cdot\frac{\tan\phi}{\tan\beta}`
              : String.raw`FS=\frac{c}{\gamma H\cos^2\beta\tan\beta}+\frac{\tan\phi}{\tan\beta}`,
            note: v.seep ? "Seepage parallel to the slope adds a destabilising seepage force, so the friction term is scaled by γ′/γ_sat." : "Dry or moist slope — the full unit weight and full friction both act.",
          },
          {
            title: "Cohesion term",
            tex: String.raw`\frac{c}{\gamma H\cos^2\beta\tan\beta}=\frac{${N(c)}}{(${N(v.seep ? gsat : g)})(${N(H)})\cos^2${N(v.beta)}^\circ\tan${N(v.beta)}^\circ}=${N(v.seep ? baseWet : base, 4)}`,
          },
          {
            title: "Friction term",
            tex: v.seep
              ? String.raw`\frac{\gamma'}{\gamma_{sat}}\cdot\frac{\tan\phi}{\tan\beta}=\frac{${N(gsub)}}{${N(gsat)}}\cdot\frac{\tan${N(v.phi)}^\circ}{\tan${N(v.beta)}^\circ}=${N(fricWet, 4)}`
              : String.raw`\frac{\tan\phi}{\tan\beta}=\frac{\tan${N(v.phi)}^\circ}{\tan${N(v.beta)}^\circ}=${N(fric, 4)}`,
          },
          {
            title: "Factor of safety",
            tex: String.raw`FS=${N(v.seep ? baseWet : base, 4)}+${N(v.seep ? fricWet : fric, 4)}=${N(FS, 4)}`,
            note: "FS ≥ 1.5 is the usual target for permanent slopes.",
          },
          {
            title: "Critical angle of the failure plane",
            tex: String.raw`\theta_{cr}=\frac{\beta+\phi_d}{2}=\frac{${N(v.beta)}^\circ+${N(v.phi)}^\circ}{2}=${N(thetaCr, 3)}^\circ`,
            note: "Measured from the horizontal, for the trial plane that gives the minimum factor of safety.",
          },
        ],
        viz: { beta: v.beta, H, phi: v.phi, FS, seep: v.seep },
      };
    },
  }),

  /* --------------------------------------------------------------- 21 */
  geo({
    id: "geo-pile",
    group: "Deep Foundations",
    title: "Pile Capacity & Group Efficiency",
    lede: "Tip resistance plus shaft friction — sand or clay — then the allowable load and group efficiency.",
    formula: String.raw`Q_u=Q_{tip}+Q_f \qquad Q_{all}=\frac{Q_u}{FS}`,
    pages: [13],
    keywords: ["pile", "capacity", "skin friction", "tip", "group efficiency", "deep foundation"],
    inputs: [
      { k: "soil", label: "Soil", type: "select", def: "clay",
        options: [{ value: "clay", label: "Clay" }, { value: "sand", label: "Sand" }] },
      { k: "D", label: "Pile diameter", sym: "D", unit: "m", def: 0.4, step: 0.05 },
      { k: "L", label: "Pile length", sym: "L", unit: "m", def: 12, step: 0.5 },
      { k: "cu", label: "Undrained cohesion", sym: "c_u", unit: "kPa", def: 75, step: 1 },
      { k: "alpha", label: "Adhesion factor", sym: "α", unit: "", def: 1, step: 0.05, hint: "α = 1 if not given" },
      { k: "Nc", label: "Tip factor", sym: "N_c", unit: "", def: 9, step: 0.5 },
      { k: "q", label: "Effective overburden at tip", sym: "q", unit: "kPa", def: 190, step: 5 },
      { k: "Nq", label: "Tip factor", sym: "N_q", unit: "", def: 40, step: 1 },
      { k: "K", label: "Lateral earth pressure coefficient", sym: "K", unit: "", def: 1.1, step: 0.05 },
      { k: "delta", label: "Soil–pile friction angle", sym: "δ", unit: "°", def: 24, step: 1 },
      { k: "FS", label: "Factor of safety", sym: "FS", unit: "", def: 3, step: 0.1 },
      { k: "n", label: "Number of piles in group", sym: "n", unit: "", def: 4, step: 1 },
    ],
    run(v) {
      const { D, L, cu, alpha, Nc, q, Nq, K, FS, n } = v;
      const Ap = (Math.PI * D * D) / 4;
      const P = Math.PI * D;
      const clay = v.soil === "clay";
      const delta = (v.delta * Math.PI) / 180;

      const Qtip = clay ? cu * Nc * Ap : q * Nq * Ap;
      const Qf = clay ? alpha * cu * P * L : K * Ap * Math.tan(delta) * (q / 2) * 2;
      const QfSand = K * (q / 2) * Math.tan(delta) * P * L;
      const QfUse = clay ? Qf : QfSand;
      const Qu = Qtip + QfUse;
      const Qall = Qu / FS;
      const eff = (2 * (n - 1) + 2) / (2 * n) * 100;   // simple edge-to-edge row heuristic

      return {
        results: [
          { label: "Ultimate pile capacity", sym: "Q_u", value: Qu, unit: "kN", hero: true },
          { label: "Allowable capacity", sym: "Q_all", value: Qall, unit: "kN" },
          { label: "Tip resistance", sym: "Q_tip", value: Qtip, unit: "kN" },
          { label: "Shaft friction", sym: "Q_f", value: QfUse, unit: "kN" },
          { label: "Tip area", sym: "A_tip", value: Ap, unit: "m²", digits: 4 },
          { label: "Perimeter", sym: "P", value: P, unit: "m", digits: 4 },
          { label: "Group efficiency (row estimate)", sym: "Q_eff", value: eff, unit: "%", digits: 3 },
        ],
        steps: [
          {
            title: "Pile geometry",
            tex: String.raw`A_{tip}=\frac{\pi D^2}{4}=\frac{\pi(${N(D)})^2}{4}=${N(Ap, 4)}\ \text{m}^2 \qquad P=\pi D=${N(P, 4)}\ \text{m}`,
          },
          clay ? {
            title: "Tip resistance in clay",
            tex: String.raw`Q_{tip}=c_uN_cA_{tip}=(${N(cu)})(${N(Nc)})(${N(Ap, 4)})=${N(Qtip, 5)}\ \text{kN}`,
          } : {
            title: "Tip resistance in sand",
            tex: String.raw`Q_{tip}=qN_qA_{tip}=(${N(q)})(${N(Nq)})(${N(Ap, 4)})=${N(Qtip, 5)}\ \text{kN}`,
          },
          clay ? {
            title: "Shaft friction in clay",
            tex: String.raw`Q_f=\alpha\,c_u\,P\,L=(${N(alpha)})(${N(cu)})(${N(P, 4)})(${N(L)})=${N(QfUse, 5)}\ \text{kN}`,
            note: "α = 1 when the adhesion factor is not given — the card's default.",
          } : {
            title: "Shaft friction in sand",
            tex: String.raw`Q_f=K\,(q/2)\tan\delta\,P\,L=(${N(K)})\left(\frac{${N(q)}}{2}\right)\tan${N(v.delta)}^\circ(${N(P, 4)})(${N(L)})=${N(QfUse, 5)}\ \text{kN}`,
            note: "Average effective overburden along the shaft is taken as q/2.",
          },
          {
            title: "Ultimate and allowable capacity",
            tex: String.raw`Q_u=Q_{tip}+Q_f=${N(Qtip, 5)}+${N(QfUse, 5)}=${N(Qu, 5)}\ \text{kN}` +
              String.raw`\\[4pt] Q_{all}=\frac{Q_u}{FS}=\frac{${N(Qu, 5)}}{${N(FS)}}=${N(Qall, 5)}\ \text{kN}`,
          },
          {
            title: "Group efficiency",
            tex: String.raw`Q_{eff}\approx\frac{2(n-1)+2}{2n}\times100=${N(eff, 3)}\%`,
            note: "A simple row-based estimate. For the card's proper group check, compare block (edge-to-edge) capacity with n × single-pile capacity and take the smaller.",
          },
        ].filter((s) => s.tex),
        viz: null,
      };
    },
  }),
];
