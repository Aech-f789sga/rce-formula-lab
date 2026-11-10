/* ==========================================================================
   core.js — formatting, math rendering, small helpers
   ========================================================================== */

/* ---------- numbers ---------- */

/**
 * Human-friendly number formatting with significant-figure control.
 * Large/small magnitudes fall back to exponential notation.
 */
export function fmt(x, sig = 5) {
  if (x === null || x === undefined) return "—";
  if (typeof x !== "number") return String(x);
  sig = Math.min(100, Math.max(1, Math.round(sig)));
  if (!isFinite(x)) return x > 0 ? "∞" : "−∞";
  if (x === 0) return "0";

  const a = Math.abs(x);
  if (a >= 1e7 || a < 1e-4) {
    let s = x.toExponential(Math.min(sig - 1, 6));
    s = s.replace(/\.?0+e/, "e").replace("e+", "e");
    return s.replace("-", "−");
  }

  let s = x.toPrecision(sig);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s.replace("-", "−");
}

/** Format a number for use inside a LaTeX string. */
export function texNum(x, sig = 4) {
  if (x === null || x === undefined) return "\\text{—}";
  if (!isFinite(x)) return "\\infty";
  const a = Math.abs(x);
  if (a !== 0 && (a >= 1e6 || a < 1e-3)) {
    const [m, e] = x.toExponential(Math.min(sig - 1, 5)).split("e");
    const mm = m.replace(/\.?0+$/, "");
    return `${mm.replace("-", "-")}\\times 10^{${Number(e)}}`;
  }
  let s = x.toPrecision(sig);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

/** Pretty unit string with the right superscripts. */
export function texUnit(u) {
  if (!u) return "";
  return u
    .replace(/\^?2\b/g, "^{2}")
    .replace(/\^?3\b/g, "^{3}")
    .replace(/\*/g, "\\cdot ");
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const deg = (r) => (r * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;

/* ---------- LaTeX rendering ---------- */

let katexReady = false;
function ensureKatex() {
  if (window.katex) { katexReady = true; return true; }
  return false;
}

/**
 * Render TeX into an element. Falls back to the raw string if KaTeX is
 * unavailable (e.g. opened from the filesystem without network for fonts).
 */
export function tex(el, src, display = false) {
  if (!el) return;
  if (ensureKatex()) {
    try {
      window.katex.render(src, el, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: true,
        output: "html",
      });
      return;
    } catch (e) { /* fall through */ }
  }
  el.textContent = src;
}

/** Build a detached element containing rendered TeX. */
export function texEl(src, display = false, tag = "div") {
  const el = document.createElement(tag);
  tex(el, src, display);
  return el;
}

/* ---------- DOM ---------- */

export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const qs = (s, r = document) => r.querySelector(s);
export const qsa = (s, r = document) => [...r.querySelectorAll(s)];

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export function debounce(fn, ms = 130) {
  let t;
  const wrapped = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  wrapped.flush = (...a) => { clearTimeout(t); fn(...a); };
  return wrapped;
}

/* ---------- validation ---------- */

/** Coerce an input string to a number; returns NaN when unusable. */
export function toNum(raw) {
  if (raw === "" || raw === null || raw === undefined) return NaN;
  const s = String(raw).replace(/,/g, "").replace(/−/g, "-").trim();
  if (s === "") return NaN;
  const v = Number(s);
  return Number.isFinite(v) ? v : NaN;
}
