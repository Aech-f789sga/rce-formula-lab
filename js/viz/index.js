/* ==========================================================================
   viz/index.js — model loader + the interactive panel around it
   ========================================================================== */

const MODULES = {
  geo: () => import("./geotech.js"),
  hyd: () => import("./hydraulics.js"),
  str: () => import("./structural.js"),
  mat: () => import("./math.js"),
};

/**
 * Per-model camera overrides. Subjects that are genuinely flat (graphs, plans,
 * cross-sections) get a lower elevation so the geometry stays readable; solid
 * subjects keep the default isometric three-quarter view.
 */
const VIEWS = {
  "mat:line": { elevation: 0.1, azimuth: 0 },
  "mat:vcurve": { elevation: 0.14, azimuth: 0 },
  "mat:normal": { elevation: 0.08, azimuth: 0 },
  "mat:hcurve": { elevation: 1.15, azimuth: -0.32 },
  "mat:earthwork": { elevation: 0.3, azimuth: -0.72 },
  "geo:slope": { elevation: 0.3, azimuth: -0.85 },
  "geo:wall": { elevation: 0.36, azimuth: -0.78 },
  "hyd:jump": { elevation: 0.2, azimuth: -0.95 },
  "hyd:egl": { elevation: 0.12, azimuth: 0 },
  "hyd:jet": { elevation: 0.28, azimuth: -0.5 },
  "str:beam": { elevation: 0.44, azimuth: -0.66 },
  // flat diagrams read best nearly straight-on
  "mat:triangle": { elevation: 0.06, azimuth: 0 },
  "mat:polygon": { elevation: 0.06, azimuth: 0 },
  "mat:incircle": { elevation: 0.05, azimuth: 0 },
  "mat:parabola": { elevation: 0.05, azimuth: 0 },
  "mat:pascal": { elevation: 0.05, azimuth: 0 },
  "mat:pmf": { elevation: 0.1, azimuth: 0 },
  "mat:growth": { elevation: 0.05, azimuth: 0 },
  "mat:cashflow": { elevation: 0.08, azimuth: 0 },
  "mat:offsets": { elevation: 0.05, azimuth: 0 },
  "mat:box3d": { elevation: 0.55, azimuth: -0.7 },
  "mat:wave": { elevation: 0.05, azimuth: 0 },
  "geo:gradation": { elevation: 0.05, azimuth: 0 },
  "geo:proctor": { elevation: 0.05, azimuth: 0 },
  "geo:flowcurve": { elevation: 0.05, azimuth: 0 },
  "geo:elogp": { elevation: 0.05, azimuth: 0 },
  "geo:flownet": { elevation: 0.95, azimuth: -0.25 },
  "hyd:friction": { elevation: 0.1, azimuth: 0 },
  "hyd:hammer": { elevation: 0.12, azimuth: 0 },
  "hyd:capillary": { elevation: 0.06, azimuth: 0 },
  "str:truss": { elevation: 0.1, azimuth: 0 },
  "str:plate": { elevation: 0.2, azimuth: -0.4 },
  "geo:consistency": { elevation: 0.07, azimuth: 0 },
  "str:tbeam": { elevation: 0.05, azimuth: 0 },
  "str:impact": { elevation: 0.14, azimuth: -0.5 },
  "geo:pile": { elevation: 0.1, azimuth: -0.3 },
};

let active = null;

const ICON = {
  labels: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4V3h5v1M5 3v10M3.6 13h2.8" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M9 7.2c.5-1 1.3-1.5 2.2-1.5 1.3 0 2.1.9 2.1 2.4V13" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M13.4 10.2c-2.4 0-3.9.5-3.9 1.7 0 .8.6 1.3 1.5 1.3 1.2 0 2.2-.8 2.2-2.1" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`,
  wire: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.6 14 5v6L8 14.4 2 11V5z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/><path d="M2 5l6 3.4L14 5M8 8.4V14.4" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>`,
  spin: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.2 8a5.2 5.2 0 1 1-1.6-3.7" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M13.6 2.2v3.1h-3.1" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  shot: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v7.4M5 6.6 8 9.6l3-3" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.6 11v2.2h10.8V11" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`,
  full: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2.4H2.4V6M10 2.4h3.6V6M6 13.6H2.4V10M10 13.6h3.6V10" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  close: `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.6 3.6l8.8 8.8M12.4 3.6l-8.8 8.8" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`,
};

/* ==========================================================================
   Mount / update
   ========================================================================== */

export async function mountViz(host, id, data) {
  if (active && active.host === host && active.id === id) {
    active.update(data);
    return active;
  }
  disposeActive();

  const [prefix, name] = id.split(":");
  const loader = MODULES[prefix];
  if (!loader) throw new Error(`Unknown viz family: ${prefix}`);

  let mod, sceneMod;
  try {
    [mod, sceneMod] = await Promise.all([loader(), import("./scene.js")]);
  } catch (err) {
    console.error("viz load failed", err);
    host.innerHTML = `<div class="viz__empty"><span>Model unavailable</span><span style="font-size:11px">${err.message}</span></div>`;
    return { update() {}, dispose() {} };
  }

  const builder = mod[name];
  if (typeof builder !== "function") {
    host.innerHTML = `<div class="viz__empty"><span>No model named “${name}”</span></div>`;
    return { update() {}, dispose() {} };
  }

  const panel = host.closest(".vizpanel");
  const bar = panel?.querySelector(".viz-toolbar");
  const legendBox = panel?.querySelector(".viz-legend");

  let api;
  try {
    api = sceneMod.createViz(host, VIEWS[id] || builder.view || {});
  } catch (err) {
    console.error("WebGL init failed", err);
    host.innerHTML = `<div class="viz__empty"><span>WebGL is not available in this browser</span><span style="font-size:11px">The calculator still works.</span></div>`;
    return { update() {}, dispose() {} };
  }

  const hud = document.createElement("div");
  hud.className = "viz__hud";
  host.appendChild(hud);
  api.hud = hud;

  const hint = document.createElement("div");
  hint.className = "viz__hint";
  hint.textContent = "drag to orbit · scroll to zoom";
  host.appendChild(hint);

  /* ---- legend ---- */
  let legendItems = [];
  api.legend = (items) => { legendItems = items || []; };

  function paintLegend() {
    if (!legendBox) return;
    if (!legendItems.length) { legendBox.hidden = true; legendBox.innerHTML = ""; return; }
    legendBox.hidden = false;
    legendBox.innerHTML = legendItems
      .map((it) => `<span class="lg"><i style="background:${it.color}"></i>${it.label}</span>`)
      .join("");
  }

  /* ---- toolbar ---- */
  let currentView = VIEWS[id] ? "custom" : "iso";

  function buildBar() {
    if (!bar) return;
    bar.innerHTML = `
      <div class="seg" role="group" aria-label="Camera view">
        <button type="button" data-view="iso">Iso</button>
        <button type="button" data-view="front">Front</button>
        <button type="button" data-view="side">Side</button>
        <button type="button" data-view="top">Top</button>
      </div>
      <div class="viz-tools">
        <button type="button" data-act="labels" aria-pressed="true" title="Toggle labels">${ICON.labels}</button>
        <button type="button" data-act="wire" aria-pressed="false" title="Wireframe">${ICON.wire}</button>
        <button type="button" data-act="spin" aria-pressed="false" title="Auto-rotate">${ICON.spin}</button>
        <button type="button" data-act="shot" title="Save as PNG">${ICON.shot}</button>
        <button type="button" data-act="full" title="Expand">${ICON.full}</button>
      </div>`;

    bar.querySelectorAll("[data-view]").forEach((b) => {
      b.addEventListener("click", () => {
        currentView = b.dataset.view;
        api.setView(currentView);
        syncBar();
      });
    });

    bar.querySelector('[data-act="labels"]').addEventListener("click", (e) => {
      const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
      api.setLabels(on);
      e.currentTarget.setAttribute("aria-pressed", String(on));
    });

    bar.querySelector('[data-act="wire"]').addEventListener("click", (e) => {
      const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
      api.setWireframe(on);
      e.currentTarget.setAttribute("aria-pressed", String(on));
    });

    bar.querySelector('[data-act="spin"]').addEventListener("click", (e) => {
      const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
      api.setSpin(on);
      e.currentTarget.setAttribute("aria-pressed", String(on));
    });

    bar.querySelector('[data-act="shot"]').addEventListener("click", () => savePNG(api));
    bar.querySelector('[data-act="full"]').addEventListener("click", () => toggleFull(panel, api));
    syncBar();
  }

  function syncBar() {
    if (!bar) return;
    bar.querySelectorAll("[data-view]").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.view === currentView);
    });
  }

  buildBar();
  if (typeof window !== 'undefined') window.__vizApi = api;

  /* ---- draw ---- */
  let first = true;

  const draw = (d) => {
    api.clear();
    hud.innerHTML = "";
    legendItems = [];
    try {
      builder(api, d || {}, hud);
    } catch (err) {
      console.error("viz build failed", err);
    }
    paintLegend();
    api.fit();
    api.invalidate();
    if (first) {
      first = false;
      if (VIEWS[id]) currentView = "custom";
    }
  };

  draw(data);

  active = {
    host, id, api,
    update(d) { draw(d); },
    dispose() {
      api.dispose();
      hud.remove();
      hint.remove();
      if (bar) bar.innerHTML = "";
      if (legendBox) { legendBox.innerHTML = ""; legendBox.hidden = true; }
      if (panel?.classList.contains("is-full")) toggleFull(panel, api, true);
    },
  };
  return active;
}

/* ==========================================================================
   Panel actions
   ========================================================================== */

function toggleFull(panel, api, forceClose = false) {
  if (!panel) return;
  const on = forceClose ? false : !panel.classList.contains("is-full");
  panel.classList.toggle("is-full", on);
  document.body.classList.toggle("viz-full", on);
  const btn = panel.querySelector('[data-act="full"]');
  if (btn) btn.innerHTML = on ? ICON.close : ICON.full;
  setTimeout(() => api.invalidate(), 80);
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const panel = document.querySelector(".vizpanel.is-full");
  if (panel && active) toggleFull(panel, active.api, true);
});

/** Render the canvas over the panel's paper colour and download it. */
function savePNG(api) {
  const raw = api.snapshot();
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#eeece4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0);
    const a = document.createElement("a");
    a.download = `rce-formula-lab-${active ? active.id.replace(":", "-") : "model"}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  };
  img.src = raw;
}

function disposeActive() {
  if (active) {
    try { active.dispose(); } catch (e) { /* ignore */ }
    active = null;
  }
}

export function unmountViz() {
  disposeActive();
}
