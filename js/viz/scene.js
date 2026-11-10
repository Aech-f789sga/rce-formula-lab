/* ==========================================================================
   scene.js — the 2.5D stage
   Physically-based materials, image-based lighting and a restrained studio
   look, so engineering sections read as models rather than plastic toys.
   ========================================================================== */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { h } from "../core.js";

/* ==========================================================================
   Palette
   ========================================================================== */

export const PALETTE = {
  ink: 0x2b2b24,
  line: 0x3a3a30,
  paper: 0xf3f1ea,
  concrete: 0xb9b6ab,
  concreteDark: 0x8e8b80,
  steel: 0x8b939c,
  steelDark: 0x5f666e,
  soil: 0xb08d63,
  soilDark: 0x8a6c49,
  sand: 0xd6bd8e,
  water: 0x7fa9c9,
  waterDark: 0x5b88ab,
  air: 0xe9e7df,
  wood: 0xb98a55,
  accent: 0x2f7d32,
  accent2: 0xc2185b,
  accent3: 0x0d47a1,
  warn: 0xd08b00,
  bad: 0xc0392b,
  white: 0xffffff,
};

export function shade(hex, k) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l * k)));
  return c.getHex();
}

/* ==========================================================================
   Shared GPU resources — created once, reused by every model
   ========================================================================== */

const TEX_BASE = "vendor/textures/";
const shared = { envMap: null, tex: {}, ready: false };

function loadTex(loader, file, srgb) {
  const t = loader.load(TEX_BASE + file);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Procedural ripple normal map for water — no external asset needed. */
function makeWaterNormal(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(size, size);

  const TAU = Math.PI * 2;
  const height = (x, y) => {
    const u = (x / size) * TAU;
    const v = (y / size) * TAU;
    return (
      Math.sin(u * 3 + Math.sin(v * 2) * 0.7) * 0.5 +
      Math.sin(v * 4 + Math.cos(u * 3) * 0.6) * 0.35 +
      Math.sin((u + v) * 2.0) * 0.15
    );
  };

  const strength = 1.3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = height(x + 1, y) - height(x - 1, y);
      const dy = height(x, y + 1) - height(x, y - 1);
      const nx = -dx * strength, ny = -dy * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function initShared(renderer) {
  if (shared.ready) return;
  shared.ready = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  shared.envMap = pmrem.fromScene(room, 0.04).texture;
  room.dispose?.();
  pmrem.dispose();

  const loader = new THREE.TextureLoader();
  for (const kind of ["concrete", "soil", "metal"]) {
    shared.tex[kind] = {
      map: loadTex(loader, `${kind}-detail.jpg`, true),
      normalMap: loadTex(loader, `${kind}-normal.jpg`, false),
      roughnessMap: loadTex(loader, `${kind}-rough.jpg`, false),
    };
  }
  shared.tex.water = { normalMap: makeWaterNormal() };
}

/* ==========================================================================
   Material factory
   ========================================================================== */

const KIND_BY_COLOR = new Map([
  [PALETTE.concrete, "concrete"],
  [PALETTE.concreteDark, "concrete"],
  [PALETTE.soil, "soil"],
  [PALETTE.soilDark, "soil"],
  [PALETTE.sand, "soil"],
  [PALETTE.steel, "metal"],
  [PALETTE.steelDark, "metal"],
  [PALETTE.water, "water"],
  [PALETTE.waterDark, "water"],
]);

function resolveKind(color, kind) {
  if (kind) return kind;
  return KIND_BY_COLOR.get(color) || "flat";
}

/* Model scales here run from ~1 unit (a soil sample) to ~30 units (a dam), so
   a fixed repeat would either wash out the small ones or turn the large ones
   into noise. Instead each mesh is re-tiled so the grain reads the same size
   on screen: TILES_ACROSS tiles over the longest dimension. */
const TILES_ACROSS = { concrete: 3.2, soil: 3.6, metal: 4.5, water: 2.4 };

const isMetalKind = (kind) => kind === "metal";

function tilesFor(kind, uvScale) {
  return (TILES_ACROSS[kind] ?? 3) * (uvScale ?? 1);
}

/** Set the repeat on every map of a material. */
function retile(mat, r) {
  for (const key of ["map", "normalMap", "roughnessMap"]) {
    if (mat[key]) mat[key].repeat.set(r, r);
  }
  return mat;
}

/**
 * Build a material. `kind` selects the surface family (and its texture set);
 * `color` tints it. Everything is physically based, so the environment map
 * does most of the work for realism.
 */
export function material(color, opts = {}) {
  const kind = resolveKind(color, opts.kind);
  const tex = shared.tex[kind];
  const opacity = opts.opacity ?? 1;
  const transparent = opacity < 1;
  const normalised = opts.uvNormalised !== false;   // Box / Cylinder default

  if (kind === "water") {
    const n = tex?.normalMap?.clone();
    if (n) {
      n.needsUpdate = true;
      const r = tilesFor("water", opts.uvScale);
      n.repeat.set(r, r);
    }
    return new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.0,
      roughness: 0.1,
      transparent: true,
      opacity: Math.min(opacity, 0.66),
      normalMap: n,
      normalScale: new THREE.Vector2(0.45, 0.45),
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  if (kind === "flat") {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.78,
      metalness: opts.metalness ?? 0.04,
      transparent,
      opacity,
      side: THREE.DoubleSide,
      envMapIntensity: 0.8,
    });
  }

  // textured families — clone the maps so each material keeps its own repeat
  const map = tex?.map?.clone();
  // Normal maps on these surfaces read as noise at model scale and can flip
  // the shading normal, so only brushed metal gets one.
  const normalMap = isMetalKind(kind) ? tex?.normalMap?.clone() : null;
  const roughnessMap = tex?.roughnessMap?.clone();
  const r = tilesFor(kind, opts.uvScale);
  [map, normalMap, roughnessMap].forEach((t) => {
    if (!t) return;
    t.needsUpdate = true;
    t.repeat.set(r, r);
  });

  return new THREE.MeshStandardMaterial({
    color,
    map,
    normalMap,
    roughnessMap,
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughness: opts.roughness ?? (isMetalKind(kind) ? 0.42 : kind === "concrete" ? 0.92 : 1.0),
    metalness: opts.metalness ?? (isMetalKind(kind) ? 0.7 : 0.0),
    transparent,
    opacity,
    side: THREE.DoubleSide,
    envMapIntensity: opts.envMapIntensity ?? (isMetalKind(kind) ? 1.05 : 0.6),
  });
}

/* ==========================================================================
   Scene controller
   ========================================================================== */

export const VIEW_PRESETS = {
  iso: { azimuth: -0.62, elevation: 0.52 },
  hero: { azimuth: -0.95, elevation: 0.36 },
  front: { azimuth: 0, elevation: 0.05 },
  side: { azimuth: -Math.PI / 2, elevation: 0.05 },
  top: { azimuth: 0, elevation: 1.45 },
};

export function createViz(container, opts = {}) {
  const scene = new THREE.Scene();
  const root = new THREE.Group();
  scene.add(root);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  initShared(renderer);
  scene.environment = shared.envMap;
  scene.environmentIntensity = 0.62;

  /* ---- lighting: soft studio key + IBL ---- */
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb8b3a4, 0.42);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff4e2, 2.0);
  key.position.set(6, 11, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 80;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xe8f0ff, 0.55);
  fill.position.set(-8, 5, -6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.25);
  rim.position.set(0, -7, 5);
  scene.add(rim);

  /* ---- shadow catcher ---- */
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.ShadowMaterial({ opacity: 0.2, color: 0x2b2b24 })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  shadowPlane.position.y = -0.001;
  scene.add(shadowPlane);

  /* ---- camera ---- */
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 2000);
  const view = {
    azimuth: opts.azimuth ?? VIEW_PRESETS.iso.azimuth,
    elevation: opts.elevation ?? VIEW_PRESETS.iso.elevation,
    zoom: 1,
    target: new THREE.Vector3(0, 0, 0),
    radius: 26,
    home: {
      azimuth: opts.azimuth ?? VIEW_PRESETS.iso.azimuth,
      elevation: opts.elevation ?? VIEW_PRESETS.iso.elevation,
    },
  };

  const labelsLayer = h("div", { class: "viz__labels" });
  container.appendChild(labelsLayer);
  let labels = [];
  let labelsOn = true;

  /* ---------- camera placement ---------- */
  function placeCamera() {
    const ce = Math.cos(view.elevation);
    const dir = new THREE.Vector3(
      ce * Math.sin(view.azimuth),
      Math.sin(view.elevation),
      ce * Math.cos(view.azimuth)
    );
    camera.position.copy(view.target).addScaledVector(dir, view.radius);
    camera.up.set(0, 1, 0);
    camera.lookAt(view.target);
    camera.updateProjectionMatrix();
  }

  /* ---------- framing ---------- */
  let lastBox = null;

  function fit(padding = 1.34) {
    const box = new THREE.Box3();
    let any = false;
    root.traverse((o) => {
      if ((o.isMesh || o.isLine || o.isPoints) && o.visible && o.geometry) {
        box.expandByObject(o);
        any = true;
      }
    });
    if (!any || !isFinite(box.min.x) || !isFinite(box.max.y)) return;
    lastBox = box.clone();

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.5);

    view.target.copy(center);
    view.radius = maxDim * 6 + 10;

    const rect = container.getBoundingClientRect();
    const aspect = Math.max(rect.width, 1) / Math.max(rect.height, 1);

    // Provisional frustum, then measure the real projected extent of the
    // bounding box in camera space. Using the world box for both axes makes
    // wide, short diagrams tiny, so this is measured, not assumed.
    camera.left = -1; camera.right = 1; camera.top = 1; camera.bottom = -1;
    camera.near = -500;
    camera.far = 1000;
    camera.updateProjectionMatrix();
    placeCamera();
    camera.updateMatrixWorld();
    const inv = camera.matrixWorldInverse;

    const corners = [];
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
      }
    }

    const v = new THREE.Vector3();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of corners) {
      v.copy(c).applyMatrix4(inv);
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    }
    if (!isFinite(minX) || !isFinite(minY)) return;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    let hw = Math.max((maxX - minX) / 2, 0.05) * padding;
    let hh = Math.max((maxY - minY) / 2, 0.05) * padding;
    if (hw / hh > aspect) hh = hw / aspect;
    else hw = hh * aspect;

    camera.left = cx - hw;
    camera.right = cx + hw;
    camera.top = cy + hh;
    camera.bottom = cy - hh;
    camera.updateProjectionMatrix();

    key.shadow.camera.left = -maxDim * 2.4;
    key.shadow.camera.right = maxDim * 2.4;
    key.shadow.camera.top = maxDim * 2.4;
    key.shadow.camera.bottom = -maxDim * 2.4;
    key.shadow.camera.updateProjectionMatrix();
    key.position.copy(center).add(new THREE.Vector3(maxDim * 1.5, maxDim * 2.6, maxDim * 1.7));
    key.target.position.copy(center);
    scene.add(key.target);

    shadowPlane.position.y = box.min.y - 0.02;
  }

  /* ---------- labels ---------- */
  function label(text, pos, opts2 = {}) {
    const el = h("div", { class: "viz__label", text, style: opts2.style || "" });
    if (opts2.className) el.className += " " + opts2.className;
    labelsLayer.appendChild(el);
    labels.push({
      el,
      pos: pos.clone ? pos.clone() : new THREE.Vector3(pos[0], pos[1], pos[2]),
      offset: opts2.offset || null,
    });
    return el;
  }

  function updateLabels() {
    const rect = container.getBoundingClientRect();
    const v = new THREE.Vector3();
    for (const L of labels) {
      v.copy(L.pos);
      if (L.offset) v.add(L.offset);
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * rect.width;
      const y = (-v.y * 0.5 + 0.5) * rect.height;
      const vis = labelsOn && v.z < 1;
      L.el.style.opacity = vis ? "1" : "0";
      L.el.style.left = `${x}px`;
      L.el.style.top = `${y}px`;
    }
  }

  /* ---------- render loop ---------- */
  let running = true;
  let needsFrame = true;
  let spinning = false;
  let dragging = false;

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    if (spinning && !dragging) {
      view.azimuth += 0.0042;
      placeCamera();
      needsFrame = true;
    }
    if (!needsFrame) return;
    needsFrame = false;
    renderer.render(scene, camera);
    updateLabels();
  }

  const invalidate = () => { needsFrame = true; };

  /* ---------- resize ---------- */
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const ht = container.clientHeight;
    if (!w || !ht) return;
    renderer.setSize(w, ht, false);
    const aspect = w / ht;
    const span = camera.top - camera.bottom;
    const cx = (camera.left + camera.right) / 2;
    const cy = (camera.top + camera.bottom) / 2;
    let nh = span, nw = span * aspect;
    if (aspect < (camera.right - camera.left) / span) {
      nw = (camera.right - camera.left);
      nh = nw / aspect;
    }
    camera.left = cx - nw / 2;
    camera.right = cx + nw / 2;
    camera.top = cy + nh / 2;
    camera.bottom = cy - nh / 2;
    camera.updateProjectionMatrix();
    invalidate();
  });
  ro.observe(container);

  /* ---------- interaction: orbit + zoom ---------- */
  let lastX = 0, lastY = 0;
  const el = renderer.domElement;
  el.style.cursor = "grab";

  el.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  });
  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    view.azimuth -= dx * 0.008;
    view.elevation = Math.max(-0.12, Math.min(1.45, view.elevation + dy * 0.006));
    placeCamera(); invalidate();
  });
  const endDrag = (e) => {
    dragging = false;
    el.style.cursor = "grab";
    if (e.pointerId !== undefined && el.hasPointerCapture?.(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  };
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);
  el.addEventListener("pointerleave", () => { if (dragging) endDrag({}); });

  el.addEventListener("wheel", (e) => {
    e.preventDefault();
    view.zoom = Math.max(0.45, Math.min(3.2, view.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
    const spanY = (camera.top - camera.bottom) / view.zoom;
    const spanX = (camera.right - camera.left) / view.zoom;
    const cy = (camera.top + camera.bottom) / 2;
    const cx = (camera.left + camera.right) / 2;
    camera.top = cy + spanY / 2;
    camera.bottom = cy - spanY / 2;
    camera.left = cx - spanX / 2;
    camera.right = cx + spanX / 2;
    camera.updateProjectionMatrix();
    invalidate();
  }, { passive: false });

  /* ---------- wireframe ---------- */
  let wire = false;
  function applyWireframe() {
    root.traverse((o) => {
      if (!o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { if ("wireframe" in m) m.wireframe = wire; });
    });
    invalidate();
  }

  /* ---------- public ---------- */
  const api = {
    scene, root, camera, renderer, view,
    add(obj) { root.add(obj); return obj; },
    remove(obj) { root.remove(obj); },
    clear() {
      while (root.children.length) {
        const c = root.children.pop();
        disposeDeep(c);
      }
      labels.forEach((L) => L.el.remove());
      labels = [];
      invalidate();
    },
    label,
    fit,
    invalidate,
    material,

    setView(name) {
      const p = VIEW_PRESETS[name];
      if (!p) return;
      view.azimuth = p.azimuth;
      view.elevation = p.elevation;
      view.zoom = 1;
      placeCamera();
      if (lastBox) fit();
      invalidate();
    },
    setWireframe(on) { wire = !!on; applyWireframe(); },
    isWireframe() { return wire; },
    setLabels(on) { labelsOn = !!on; invalidate(); },
    labelsOn() { return labelsOn; },
    setSpin(on) { spinning = !!on; },
    isSpinning() { return spinning; },
    reset() {
      view.azimuth = view.home.azimuth;
      view.elevation = view.home.elevation;
      view.zoom = 1;
      spinning = false;
      fit();
      invalidate();
    },
    snapshot() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL("image/png");
    },
    dispose() {
      running = false;
      ro.disconnect();
      disposeDeep(root);
      renderer.dispose();
      renderer.domElement.remove();
      labelsLayer.remove();
    },
  };

  const rect = container.getBoundingClientRect();
  renderer.setSize(rect.width || 600, rect.height || 400, false);
  placeCamera();
  tick();

  return api;
}

function disposeDeep(obj) {
  obj.traverse?.((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => m.dispose?.());
    }
  });
}

/* ==========================================================================
   Geometry helpers
   ========================================================================== */

/** Extrude a 2D outline (array of [x,y]) along +Z by `depth`. */
export function prism(pts, depth, opts = {}) {
  const shape = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: !!opts.bevel,
    bevelSize: opts.bevelSize ?? 0.02,
    bevelThickness: opts.bevelThickness ?? 0.02,
    bevelSegments: 1,
    curveSegments: 24,
  });
  geo.translate(0, 0, -depth / 2);

  const base = opts.color ?? PALETTE.concrete;
  // Resolve the family from the *base* colour: capColor/sideColor are tinted
  // variants and would otherwise fall through to an untextured material.
  const kind = resolveKind(base, opts.kind);
  const cap = material(opts.capColor ?? base, { ...opts, kind });
  const side = material(opts.sideColor ?? shade(base, 0.8), { ...opts, kind });

  // ExtrudeGeometry emits UVs in shape coordinates, so the repeat has to be
  // divided by the model's own size to keep the grain consistent.
  geo.computeBoundingBox();
  const gs = geo.boundingBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(gs.x, gs.y, gs.z, 0.25);
  const r = tilesFor(kind, opts.uvScale) / maxDim;
  retile(cap, r);
  retile(side, r);

  const mesh = new THREE.Mesh(geo, [cap, side]);
  // transparent parts must not cast solid shadows — an air or water layer
  // above the soil would black it out completely
  mesh.castShadow = opts.castShadow !== false && (opts.opacity ?? 1) > 0.9;
  mesh.receiveShadow = true;
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  if (opts.position) mesh.position.set(...opts.position);
  return mesh;
}

/** Rectangular slab, centred on origin, extruded in Z. */
export function slab(w, hgt, depth, opts = {}) {
  return prism(
    [[-w / 2, -hgt / 2], [w / 2, -hgt / 2], [w / 2, hgt / 2], [-w / 2, hgt / 2]],
    depth,
    opts
  );
}

/** Box with independent dimensions, centred. */
export function box(w, hgt, d, opts = {}) {
  const geo = new THREE.BoxGeometry(w, hgt, d);
  const mesh = new THREE.Mesh(geo, material(opts.color ?? PALETTE.concrete, opts));
  mesh.castShadow = opts.castShadow !== false && (opts.opacity ?? 1) > 0.9;
  mesh.receiveShadow = true;
  if (opts.position) mesh.position.set(...opts.position);
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  return mesh;
}

/** Cylinder / tube along +Y by default. */
export function cylinder(rTop, rBot, hgt, opts = {}) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, hgt, opts.segments ?? 40, 1, !!opts.open);
  const mesh = new THREE.Mesh(geo, material(opts.color ?? PALETTE.steel, opts));
  mesh.castShadow = opts.castShadow !== false && (opts.opacity ?? 1) > 0.9;
  mesh.receiveShadow = true;
  if (opts.position) mesh.position.set(...opts.position);
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  return mesh;
}

/** A flat filled polygon lying in the XY plane (no thickness). */
export function face(pts, opts = {}) {
  const shape = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshBasicMaterial({
    color: opts.color ?? PALETTE.water,
    transparent: true,
    opacity: opts.opacity ?? 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  if (opts.position) mesh.position.set(...opts.position);
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  return mesh;
}

/** Poly-line in 3D from an array of [x,y,z]. */
export function polyline(pts, opts = {}) {
  const geo = new THREE.BufferGeometry().setFromPoints(
    pts.map((p) => new THREE.Vector3(p[0], p[1], p[2] ?? 0))
  );
  const mat = new THREE.LineBasicMaterial({
    color: opts.color ?? PALETTE.ink,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1,
  });
  return new THREE.Line(geo, mat);
}

/** Dashed line — centre lines and extension lines. */
export function dashed(pts, opts = {}) {
  const geo = new THREE.BufferGeometry().setFromPoints(
    pts.map((p) => new THREE.Vector3(p[0], p[1], p[2] ?? 0))
  );
  const mat = new THREE.LineDashedMaterial({
    color: opts.color ?? PALETTE.line,
    dashSize: opts.dashSize ?? 0.16,
    gapSize: opts.gapSize ?? 0.12,
    transparent: true,
    opacity: opts.opacity ?? 0.7,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return line;
}

/** Solid arrow (shaft + cone head) pointing from `from` to `to`. */
export function arrow(from, to, opts = {}) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  if (len < 1e-6) return new THREE.Group();

  const color = opts.color ?? PALETTE.ink;
  const headLen = Math.min(opts.headLen ?? len * 0.28, len * 0.5);
  const headR = opts.headR ?? headLen * 0.34;
  const shaftR = opts.shaftR ?? Math.max(headR * 0.22, 0.006);

  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: 0.55, metalness: 0.08, envMapIntensity: 0.9,
  });

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftR, shaftR, len - headLen, 12), mat);
  shaft.position.y = (len - headLen) / 2;
  shaft.castShadow = false;

  const head = new THREE.Mesh(new THREE.ConeGeometry(headR, headLen, 18), mat);
  head.position.y = len - headLen / 2;
  head.castShadow = false;

  g.add(shaft, head);
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return g;
}

/** Dimension line with ticks at both ends. */
export function dimLine(a, b, opts = {}) {
  const g = new THREE.Group();
  g.add(polyline([a, b], { color: opts.color ?? 0x6b6b60, opacity: 0.9 }));
  const t = opts.tick ?? 0.12;
  const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], (b[2] ?? 0) - (a[2] ?? 0)).normalize();
  const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(t);
  [a, b].forEach((p) => {
    const p1 = new THREE.Vector3(...p).add(perp);
    const p2 = new THREE.Vector3(...p).sub(perp);
    g.add(polyline([[p1.x, p1.y, p1.z], [p2.x, p2.y, p2.z]], { color: opts.color ?? 0x6b6b60 }));
  });
  return g;
}

/** Ring / annulus disc in the XZ plane. */
export function ring(inner, outer, opts = {}) {
  const geo = new THREE.RingGeometry(inner, outer, opts.segments ?? 48);
  const mat = new THREE.MeshBasicMaterial({
    color: opts.color ?? PALETTE.line,
    transparent: true,
    opacity: opts.opacity ?? 0.8,
    side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  if (opts.position) m.position.set(...opts.position);
  return m;
}

/** Parallel hatch lines inside a rect, for section cuts. */
export function hatch(x0, y0, w, hgt, opts = {}) {
  const g = new THREE.Group();
  const step = opts.step ?? 0.14;
  const n = Math.ceil((w + hgt) / step);
  for (let i = 0; i < n; i++) {
    const t = i * step;
    const a = [x0 + Math.max(0, t - hgt), y0 + Math.min(t, hgt), opts.z ?? 0];
    const b = [x0 + Math.min(t, w), y0 + Math.max(0, t - w), opts.z ?? 0];
    if (a[0] > x0 + w || b[1] < y0) continue;
    g.add(polyline([a, b], { color: opts.color ?? 0x9a9689, opacity: opts.opacity ?? 0.55 }));
  }
  return g;
}

/** Technical-illustration outline: silhouette edges of a mesh. */
export function outline(mesh, opts = {}) {
  const geo = new THREE.EdgesGeometry(mesh.geometry, opts.threshold ?? 24);
  const mat = new THREE.LineBasicMaterial({
    color: opts.color ?? 0x3d3d33,
    transparent: true,
    opacity: opts.opacity ?? 0.42,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  lines.scale.copy(mesh.scale);
  return lines;
}

/** Add a mesh plus its outline to a group in one call. */
export function part(group, mesh, opts = {}) {
  group.add(mesh);
  if (opts.outline !== false) group.add(outline(mesh, opts));
  return mesh;
}

/** Ground grid for site-like scenes. */
export function ground(size = 12, opts = {}) {
  const g = new THREE.Group();
  const grid = new THREE.GridHelper(size, opts.divisions ?? 12, 0xc9c5b7, 0xdedacd);
  grid.material.transparent = true;
  grid.material.opacity = opts.opacity ?? 0.5;
  grid.position.y = opts.y ?? 0;
  g.add(grid);
  return g;
}

export { THREE };
