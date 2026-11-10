/* ==========================================================================
   data/index.js — section metadata + the full calculator registry
   ========================================================================== */

import { GEOTECH } from "./geotech.js";
import { HYDRAULICS } from "./hydraulics.js";
import { STRUCTURAL } from "./structural.js";
import { MATH } from "./math.js";

export const SECTIONS = {
  geotech: {
    id: "geotech",
    name: "Geotechnical Engineering",
    short: "Geotechnical",
    color: "var(--geo)",
    pages: "Source pages 2–14",
    blurb:
      "Phase relationships, classification, permeability, seepage, consolidation, bearing capacity, earth pressure and slope stability. The card's green section — the one with the most formulas per page.",
  },
  hydraulics: {
    id: "hydraulics",
    name: "Hydraulics",
    short: "Hydraulics",
    color: "var(--hyd)",
    pages: "Source pages 16–31",
    blurb:
      "Fluid properties, hydrostatics, dams, buoyancy, pipe flow, orifices and weirs, open channels, water hammer and head losses. Blue section.",
  },
  structural: {
    id: "structural",
    name: "Structural Analysis & Design",
    short: "Structural",
    color: "var(--str)",
    pages: "Source pages 34–85",
    blurb:
      "Strength of materials, beam reactions and deflections, determinacy, steel columns and tension members, reinforced concrete, and foundations. Amber section — the longest in the card.",
  },
  math: {
    id: "math",
    name: "Math, Surveying & Transportation",
    short: "Math / Survey",
    color: "var(--mat)",
    pages: "Source pages 88–137",
    blurb:
      "Trigonometry, analytic geometry, algebra and statistics, engineering economy, vertical and horizontal curves, earthworks and calculus shortcuts. Pink section.",
  },
};

const ALL = [
  ...GEOTECH.map((c) => ({ ...c, section: "geotech" })),
  ...HYDRAULICS.map((c) => ({ ...c, section: "hydraulics" })),
  ...STRUCTURAL.map((c) => ({ ...c, section: "structural" })),
  ...MATH.map((c) => ({ ...c, section: "math" })),
];

export const CALCULATORS = ALL;

export const BY_ID = Object.fromEntries(ALL.map((c) => [c.id, c]));

/* Sanity check during development — surfaces duplicate ids in the console. */
if (import.meta.env?.DEV) {
  const seen = new Set();
  ALL.forEach((c) => {
    if (seen.has(c.id)) console.warn("Duplicate calculator id:", c.id);
    seen.add(c.id);
  });
}
