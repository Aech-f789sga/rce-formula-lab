/* ==========================================================================
   scene.js — the 2.5D stage
   A deliberately flat-lit, isometric-ish Three.js scene so engineering
   sections read like a laser-cut model rather than a video game.
   ========================================================================== */

import * as THREE from "three";
import { h } from "../core.js";

export const PALETTE = {
  ink: 0x2b2b24,
  line: 0x3a3a30,
  paper: 0xf3f1ea,
  concrete: 0xb9b6ab,
  concreteDark: 0x8e8b80,
  steel: 0x7c8794,
  steelDark: 0x5a636e,
  soil: 0xb08d63,
  soilDark: 0x8a6c49,
  sand: 0xd6bd8e,
  water: 0x7fa9c9,
  waterDark: 0x5b88ab,
  air: 0xe9e7df,
  accent: 0x2f7d32,
  accent2: 0xc2185b,
  accent3: 0x0d47a1,
  warn: 0xd08b00,
  bad: 0xc0392b,
  white: 0xffffff,
};

const CAP = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.82,
    metalness: opts.metalness ?? 0.02,
    flatShading: false,
    transparent: opts.opacity !== undefined && opts.opacity < 1,
    opacity: opts.opacity ?? 1,
    side: THREE.DoubleSide,
  });

const SIDE = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: (opts.roughness ?? 0.82) * 0.96,
    metalness: opts.metalness ?? 0.02,
    transparent: opts.opacity !== undefined && opts.opacity < 1,
    opacity: opts.opacity ?? 1,
    side: THREE.DoubleSide,
  });

function shade(hex, k) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l * k)));
  return c.getHex();
}

/* ==========================================================================
   Scene controller
   ========================================================================== */

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // ---- lighting: soft studio, no drama ----
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9b5a6, 1.05);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(6, 11, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 60;
  key.shadow.bias = -0.0012;
  key.shadow.radius = 3;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.55);
  fill.position.set(-7, 5, -6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.35);
  rim.position.set(0, -6, 4);
  scene.add(rim);

  // ---- shadow catcher ----
  const shadowGeo = new THREE.PlaneGeometry(200, 200);
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.13 });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  shadowPlane.position.y = -0.001;
  scene.add(shadowPlane);

  // ---- camera ----
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 2000);
  const view = {
    azimuth: opts.azimuth ?? -0.62,
    elevation: opts.elevation ?? 0.52,
    zoom: 1,
    target: new THREE.Vector3(0, 0, 0),
    radius: 26,
  };

  const labelsLayer = h("div", { class: "viz__labels" });
  container.appendChild(labelsLayer);
  let labels = [];

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
  function fit(padding = 1.2) {
    const box = new THREE.Box3();
    let any = false;
    root.traverse((o) => {
      if ((o.isMesh || o.isLine || o.isPoints) && o.visible && o.geometry) {
        box.expandByObject(o);
        any = true;
      }
    });
    if (!any || !isFinite(box.min.x) || !isFinite(box.max.y)) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.5);

    view.target.copy(center);
    view.radius = maxDim * 6 + 10;

    const rect = container.getBoundingClientRect();
    const aspect = Math.max(rect.width, 1) / Math.max(rect.height, 1);
    const half = (maxDim * padding) / 2;
    let w, hgt;
    if (aspect >= 1) { hgt = half * 2; w = hgt * aspect; }
    else { w = half * 2; hgt = w / aspect; }

    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = hgt / 2;
    camera.bottom = -hgt / 2;
    camera.near = -500;
    camera.far = 1000;

    key.shadow.camera.left = -maxDim * 2.2;
    key.shadow.camera.right = maxDim * 2.2;
    key.shadow.camera.top = maxDim * 2.2;
    key.shadow.camera.bottom = -maxDim * 2.2;
    key.shadow.camera.updateProjectionMatrix();
    key.position.copy(center).add(new THREE.Vector3(maxDim * 1.6, maxDim * 2.6, maxDim * 1.8));
    key.target.position.copy(center);
    scene.add(key.target);

    shadowPlane.position.y = box.min.y - 0.02;
    placeCamera();

    // The world bounding box is not the same as what lands on screen once the
    // camera is tilted, so project the eight corners and grow the frustum
    // until everything (plus a little margin) is inside.
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    const corners = [];
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
      }
    }
    let k = 0;
    const v = new THREE.Vector3();
    for (const c of corners) {
      v.copy(c).project(camera);
      k = Math.max(k, Math.abs(v.x), Math.abs(v.y));
    }
    if (isFinite(k) && k > 0.9) {
      const grow = k / 0.88;
      const cx2 = (camera.left + camera.right) / 2;
      const cy2 = (camera.top + camera.bottom) / 2;
      const hw = ((camera.right - camera.left) / 2) * grow;
      const hh = ((camera.top - camera.bottom) / 2) * grow;
      camera.left = cx2 - hw;
      camera.right = cx2 + hw;
      camera.top = cy2 + hh;
      camera.bottom = cy2 - hh;
      camera.updateProjectionMatrix();
    }
  }

  /* ---------- labels ---------- */
  function label(text, pos, opts2 = {}) {
    const el = h("div", {
      class: "viz__label",
      text,
      style: opts2.style || "",
    });
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
      const vis = v.z < 1;
      L.el.style.opacity = vis ? "1" : "0";
      L.el.style.left = `${x}px`;
      L.el.style.top = `${y}px`;
    }
  }

  /* ---------- render loop ---------- */
  let running = true;
  let needsFrame = true;
  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
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
  let dragging = false, lastX = 0, lastY = 0;
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
    view.elevation = Math.max(-0.12, Math.min(1.35, view.elevation + dy * 0.006));
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
    reset() {
      view.azimuth = opts.azimuth ?? -0.62;
      view.elevation = opts.elevation ?? 0.52;
      view.zoom = 1;
      fit();
      invalidate();
    },
    snapshot() { renderer.render(scene, camera); },
    dispose() {
      running = false;
      ro.disconnect();
      disposeDeep(root);
      renderer.dispose();
      renderer.domElement.remove();
      labelsLayer.remove();
    },
  };

  // kick off
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
   Geometry helpers — build "laser-cut" 2.5D parts
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
  const cap = CAP(opts.capColor ?? base, opts);
  const side = SIDE(opts.sideColor ?? shade(base, 0.78), opts);

  const mesh = new THREE.Mesh(geo, [cap, side]);
  mesh.castShadow = opts.castShadow !== false;
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
  const base = opts.color ?? PALETTE.concrete;
  const mat = new THREE.MeshStandardMaterial({
    color: base,
    roughness: opts.roughness ?? 0.8,
    metalness: opts.metalness ?? 0.03,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = opts.castShadow !== false;
  mesh.receiveShadow = true;
  if (opts.position) mesh.position.set(...opts.position);
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  return mesh;
}

/** Cylinder / tube along +Y by default. */
export function cylinder(rTop, rBot, hgt, opts = {}) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, hgt, opts.segments ?? 40, 1, !!opts.open);
  const mat = new THREE.MeshStandardMaterial({
    color: opts.color ?? PALETTE.steel,
    roughness: opts.roughness ?? 0.6,
    metalness: opts.metalness ?? 0.25,
    transparent: opts.opacity !== undefined,
    opacity: opts.opacity ?? 1,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = opts.castShadow !== false;
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
  const line = new THREE.Line(geo, mat);
  return line;
}

/** Dashed line — useful for centre lines / extension lines. */
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

/** Solid arrow (shaft + cone head) pointing along +Y by default. */
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
    color, roughness: 0.6, metalness: 0.05,
  });

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(shaftR, shaftR, len - headLen, 12),
    mat
  );
  shaft.position.y = (len - headLen) / 2;
  shaft.castShadow = false;

  const head = new THREE.Mesh(
    new THREE.ConeGeometry(headR, headLen, 16),
    mat
  );
  head.position.y = len - headLen / 2;
  head.castShadow = false;

  g.add(shaft, head);
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return g;
}

/** Dimension line with a label anchor at its midpoint. */
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

/** Text-free "hatch" group: parallel lines inside a rect, for section cuts. */
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

/**
 * Technical-illustration outline: draws the silhouette edges of a mesh so the
 * 2.5D parts read like an engineering drawing rather than flat plastic.
 */
export function outline(mesh, opts = {}) {
  const geo = new THREE.EdgesGeometry(mesh.geometry, opts.threshold ?? 24);
  const mat = new THREE.LineBasicMaterial({
    color: opts.color ?? 0x3d3d33,
    transparent: true,
    opacity: opts.opacity ?? 0.55,
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

/** Ground plane (subtle grid) for site-like scenes. */
export function ground(size = 12, opts = {}) {
  const g = new THREE.Group();
  const grid = new THREE.GridHelper(size, opts.divisions ?? 12, 0xc9c5b7, 0xdedacd);
  grid.material.transparent = true;
  grid.material.opacity = opts.opacity ?? 0.5;
  grid.position.y = opts.y ?? 0;
  g.add(grid);
  return g;
}

export { THREE, shade };
