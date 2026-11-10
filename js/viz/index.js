/* ==========================================================================
   viz/index.js — lazy viz module loader + lifecycle
   ========================================================================== */

const MODULES = {
  geo: () => import("./geotech.js"),
  hyd: () => import("./hydraulics.js"),
  str: () => import("./structural.js"),
  mat: () => import("./math.js"),
};

let active = null;

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
};

/**
 * Mount (or update) a 2.5D model into `host`.
 * `id` is "prefix:builderName", e.g. "geo:phase".
 */
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

  if (typeof window !== 'undefined') window.__vizApi = api;

  let first = true;

  const draw = (d) => {
    api.clear();
    hud.innerHTML = "";
    try {
      builder(api, d || {}, hud);
    } catch (err) {
      console.error("viz build failed", err);
    }
    api.fit();
    api.invalidate();
    if (first) { first = false; }
  };

  draw(data);

  active = {
    host, id, api,
    update(d) { draw(d); },
    dispose() {
      api.dispose();
      hud.remove();
      hint.remove();
    },
  };
  return active;
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
