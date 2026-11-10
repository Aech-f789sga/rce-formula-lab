/* ==========================================================================
   app.js — router, index, and the calculator runtime
   ========================================================================== */

import { SECTIONS, CALCULATORS, BY_ID } from "./data/index.js";
import { fmt, texNum, tex, h, qs, debounce, toNum } from "./core.js";
import { mountViz, unmountViz } from "./viz/index.js";

const stage = qs("#stage");
const railBody = qs("#railBody");
const railCount = qs("#railCount");
const sectionNav = qs("#sectionNav");
const searchInput = qs("#search");
const searchResults = qs("#searchResults");

/* ==========================================================================
   Chrome: section nav + rail
   ========================================================================== */

function buildSectionNav() {
  sectionNav.innerHTML = "";
  const items = [
    { id: "all", label: "All", color: "var(--ink)" },
    ...Object.values(SECTIONS).map((s) => ({ id: s.id, label: s.short, color: s.color })),
  ];
  items.forEach((it) => {
    const b = h("button", {
      type: "button",
      text: it.label,
      onclick: () => navigate(it.id === "all" ? "#/" : `#/s/${it.id}`),
    });
    b.style.setProperty("--sec-color", it.color);
    b.dataset.sec = it.id;
    sectionNav.appendChild(b);
  });
}

function markSectionNav(secId) {
  [...sectionNav.children].forEach((b) => {
    const on = secId ? b.dataset.sec === secId : b.dataset.sec === "all";
    b.setAttribute("aria-current", on ? "true" : "false");
  });
}

function buildRail() {
  railBody.innerHTML = "";
  let total = 0;

  Object.values(SECTIONS).forEach((sec) => {
    const calcs = CALCULATORS.filter((c) => c.section === sec.id);
    if (!calcs.length) return;
    total += calcs.length;

    const groups = new Map();
    calcs.forEach((c) => {
      if (!groups.has(c.group)) groups.set(c.group, []);
      groups.get(c.group).push(c);
    });

    const secWrap = h("div", { class: "rail__group", dataset: { open: "true" } });
    const secHead = h("button", {
      class: "rail__grouphead",
      type: "button",
      onclick: () => {
        secWrap.dataset.open = secWrap.dataset.open === "true" ? "false" : "true";
      },
    }, [
      h("span", { class: "chev" }),
      h("span", { class: "gname", text: sec.short }),
      h("span", { class: "gcount", text: String(calcs.length) }),
    ]);
    secHead.style.color = sec.color;
    const secList = h("div", { class: "rail__list" });

    groups.forEach((items, gname) => {
      secList.appendChild(h("div", {
        class: "rail__group",
        dataset: { open: "true" },
        style: "margin:0",
      }, [
        h("button", {
          class: "rail__grouphead",
          type: "button",
          onclick: (e) => {
            const w = e.currentTarget.parentElement;
            w.dataset.open = w.dataset.open === "true" ? "false" : "true";
          },
        }, [
          h("span", { class: "chev" }),
          h("span", { class: "gname", text: gname, style: "font-size:10px;letter-spacing:.04em" }),
        ]),
        h("div", { class: "rail__list" },
          items.map((c) => h("a", {
            class: "rail__link",
            href: `#/c/${c.id}`,
            text: c.title,
            dataset: { id: c.id },
          }))
        ),
      ]));
    });

    secWrap.append(secHead, secList);
    railBody.appendChild(secWrap);
  });

  railCount.textContent = `${total} calculators · 137-page source`;
}

function markRail(activeId) {
  [...railBody.querySelectorAll(".rail__link")].forEach((a) => {
    if (a.dataset.id === activeId) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (activeId) {
    const link = railBody.querySelector(`.rail__link[aria-current]`);
    if (link) {
      const r = link.getBoundingClientRect();
      const rb = railBody.getBoundingClientRect();
      if (r.top < rb.top || r.bottom > rb.bottom) {
        link.scrollIntoView({ block: "nearest" });
      }
    }
  }
}

/* ==========================================================================
   Router
   ========================================================================== */

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  if (!parts.length) return { view: "home" };
  if (parts[0] === "s" && parts[1]) return { view: "section", id: parts[1] };
  if (parts[0] === "c" && parts[1]) return { view: "calc", id: parts[1] };
  if (parts[0] === "references") return { view: "references" };
  return { view: "home" };
}

let currentCalcCleanup = null;

function render() {
  const route = parseRoute();
  if (currentCalcCleanup) { currentCalcCleanup(); currentCalcCleanup = null; }
  unmountViz();

  stage.innerHTML = "";
  document.body.dataset.view = route.view;

  if (route.view === "calc") {
    const calc = BY_ID[route.id];
    if (calc) {
      renderCalc(calc);
      markRail(calc.id);
      markSectionNav(calc.section);
      setAccent(calc.section);
      document.title = `${calc.title} · RCE Formula Lab`;
      return;
    }
  }

  if (route.view === "section" && SECTIONS[route.id]) {
    renderSection(SECTIONS[route.id]);
    markRail(null);
    markSectionNav(route.id);
    setAccent(route.id);
    document.title = `${SECTIONS[route.id].name} · RCE Formula Lab`;
    return;
  }

  if (route.view === "references") {
    renderReferences();
    markRail(null);
    markSectionNav(null);
    setAccent(null);
    document.title = `Code references · RCE Formula Lab`;
    return;
  }

  renderHome();
  markRail(null);
  markSectionNav(null);
  setAccent(null);
  document.title = "RCE Formula Lab — Auto-Solving Civil Engineering Formula Card";
}

function setAccent(sectionId) {
  const root = document.documentElement;
  const map = {
    geotech: ["--geo", "--geo-tint"],
    hydraulics: ["--hyd", "--hyd-tint"],
    structural: ["--str", "--str-tint"],
    math: ["--mat", "--mat-tint"],
  };
  const pair = map[sectionId];
  if (pair) {
    root.style.setProperty("--accent", `var(${pair[0]})`);
    root.style.setProperty("--accent-tint", `var(${pair[1]})`);
  } else {
    root.style.setProperty("--accent", "var(--ink)");
    root.style.setProperty("--accent-tint", "var(--paper-2)");
  }
}

/* ==========================================================================
   Home
   ========================================================================== */

function renderHome() {
  const total = CALCULATORS.length;
  const vizCount = CALCULATORS.filter((c) => c.viz).length;

  const hero = h("div", { class: "hero anim" }, [
    h("div", { class: "eyebrow" }, [
      h("span", { class: "sec", text: "Companion edition" }),
      h("span", { class: "dot" }),
      h("span", { text: "RCE Formula Card · Engr. Aleah Pearl Javier Once, 2024" }),
    ]),
    h("h1", { text: "Every formula on the card, wired to a solver." }),
    h("p", {
      text:
        "Pick a topic, type what you know, and read the answer with the full substitution " +
        "trail. Engineering sections that have geometry get a rotatable 2.5D model that " +
        "redraws itself from your numbers.",
    }),
    h("div", { class: "hero__meta" }, [
      h("div", { class: "stat" }, [h("b", { text: String(total) }), h("span", { text: "Calculators" })]),
      h("div", { class: "stat" }, [h("b", { text: String(vizCount) }), h("span", { text: "3D models" })]),
      h("div", { class: "stat" }, [h("b", { text: "4" }), h("span", { text: "Sections" })]),
      h("div", { class: "stat" }, [h("b", { text: "137" }), h("span", { text: "Source pages" })]),
    ]),
  ]);
  stage.appendChild(hero);

  Object.values(SECTIONS).forEach((sec) => {
    const calcs = CALCULATORS.filter((c) => c.section === sec.id);
    const groups = new Set(calcs.map((c) => c.group));

    const head = h("div", { class: "section-head" }, [
      h("h2", { text: sec.name }),
      h("span", { class: "count", text: `${calcs.length} calculators · ${groups.size} groups` }),
    ]);
    head.querySelector("h2").style.color = sec.color;
    stage.appendChild(head);

    const cards = h("div", { class: "cards" });
    [...groups].forEach((gname) => {
      const items = calcs.filter((c) => c.group === gname);
      const card = h("a", {
        class: "card",
        href: `#/c/${items[0].id}`,
        style: `--c:${sec.color}`,
      }, [
        h("h3", { text: gname }),
        h("p", { text: items.slice(0, 3).map((i) => i.title).join(" · ") + (items.length > 3 ? " …" : "") }),
        h("span", { class: "card__count", text: `${items.length} calculator${items.length > 1 ? "s" : ""} →` }),
      ]);
      cards.appendChild(card);
    });
    stage.appendChild(cards);
  });

  stage.appendChild(h("div", { class: "section-head" }, [h("h2", { text: "How it works" })]));
  stage.appendChild(h("div", { class: "cards" }, [
    h("div", { class: "card", style: "--c:#8c8c80" }, [
      h("h3", { text: "1 · Type what you know" }),
      h("p", { text: "Fields are pre-filled with typical values so every calculator answers something sensible the moment it opens." }),
    ]),
    h("div", { class: "card", style: "--c:#8c8c80" }, [
      h("h3", { text: "2 · Read the substitution" }),
      h("p", { text: "Each answer comes with the formula, the numbers plugged in, and the intermediate results — the same trail you'd write on scratch paper." }),
    ]),
    h("div", { class: "card", style: "--c:#8c8c80" }, [
      h("h3", { text: "3 · Turn the model" }),
      h("p", { text: "Drag to orbit, scroll to zoom. The 2.5D model is driven by the same numbers as the answer." }),
    ]),
  ]));
}

/* ==========================================================================
   Section landing
   ========================================================================== */

function renderSection(sec) {
  const calcs = CALCULATORS.filter((c) => c.section === sec.id);
  const groups = new Map();
  calcs.forEach((c) => {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group).push(c);
  });

  const head = h("div", { class: "pagehead anim" }, [
    h("div", { class: "eyebrow" }, [
      h("span", { class: "sec", text: sec.name }),
      h("span", { class: "dot" }),
      h("span", { text: sec.pages }),
    ]),
    h("h1", { text: sec.name }),
    h("p", { class: "lede", text: sec.blurb }),
  ]);
  stage.appendChild(head);

  groups.forEach((items, gname) => {
    stage.appendChild(h("div", { class: "section-head" }, [
      h("h2", { text: gname, style: `color:${sec.color}` }),
      h("span", { class: "count", text: `${items.length}` }),
    ]));
    stage.appendChild(h("div", { class: "cards" },
      items.map((c) => h("a", {
        class: "card",
        href: `#/c/${c.id}`,
        style: `--c:${sec.color}`,
      }, [
        h("h3", { text: c.title }),
        h("p", { text: c.lede }),
        h("span", { class: "card__count", text: `p.${c.pages.join(", ")}` }),
      ]))
    ));
  });
}

/* ==========================================================================
   Calculator view
   ========================================================================== */

function renderCalc(calc) {
  const sec = SECTIONS[calc.section];

  /* ---- header ---- */
  const head = h("div", { class: "pagehead anim" }, [
    h("div", { class: "eyebrow" }, [
      h("a", { class: "sec", href: `#/s/${sec.id}`, text: sec.name, style: "text-decoration:none" }),
      h("span", { class: "dot" }),
      h("span", { text: calc.group }),
      h("span", { class: "dot" }),
      ...calc.pages.map((p) => h("span", { class: "pgref", text: `p.${p}` })),
    ]),
    h("h1", { text: calc.title }),
    h("p", { class: "lede", text: calc.lede }),
  ]);

  if (calc.formula) {
    const ribbon = h("div", { class: "formula-ribbon" }, [
      h("div", { class: "formula-ribbon__label", text: "Formula on the card" }),
      h("div", { class: "formula-ribbon__math" }),
    ]);
    tex(ribbon.querySelector(".formula-ribbon__math"), calc.formula, true);
    head.appendChild(ribbon);
  }
  stage.appendChild(head);

  /* ---- panels ---- */
  const inputsPanel = h("section", { class: "panel" }, [
    h("div", { class: "panel__head" }, [
      h("h2", { text: "Given" }),
      h("span", { class: "spacer" }),
      h("span", { class: "autoflag", text: "auto" }),
    ]),
    h("div", { class: "panel__body", id: "inputBody" }),
    h("div", { class: "input-foot" }, [
      h("button", {
        class: "btn btn--ghost", type: "button", text: "Reset",
        onclick: () => { state.values = defaultValues(calc); paintInputs(); compute(); },
      }),
      h("span", { class: "spacer", style: "flex:1" }),
      h("button", {
        class: "btn", type: "button", text: "Copy solution",
        onclick: (e) => copySolution(e.currentTarget),
      }),
    ]),
  ]);

  const answersPanel = h("section", { class: "panel" }, [
    h("div", { class: "panel__head" }, [h("h2", { text: "Answer" })]),
    h("div", { class: "panel__body" }, [h("div", { class: "answers", id: "answerBody" })]),
  ]);

  const vizPanel = h("section", { class: "panel vizpanel" }, [
    h("div", { class: "panel__head panel__head--viz" }, [
      h("h2", { text: calc.viz ? "2.5D model" : "Model" }),
      h("span", { class: "spacer" }),
      calc.viz ? h("div", { class: "viz-toolbar" }) : null,
    ]),
    h("div", { class: "viz", id: "vizHost" }),
    h("div", { class: "viz-legend", hidden: true }),
  ]);

  const stepsPanel = h("section", { class: "panel" }, [
    h("div", { class: "panel__head" }, [h("h2", { text: "Solution" })]),
    h("div", { class: "panel__body" }, [h("div", { class: "steps", id: "stepBody" })]),
  ]);

  const left = h("div", { class: "wb-col" }, [inputsPanel, answersPanel]);
  const right = h("div", { class: "wb-col" }, [vizPanel, stepsPanel]);
  stage.appendChild(h("div", { class: "workbench anim" }, [left, right]));

  /* ---- state ---- */
  const state = {
    values: defaultValues(calc),
    calc,
    out: null,
  };

  const answerBody = qs("#answerBody");
  const stepBody = qs("#stepBody");
  const inputBody = qs("#inputBody");
  const vizHost = qs("#vizHost");

  let vizApi = null;
  let vizToken = 0;

  function defaultValues(c) {
    const v = {};
    (c.inputs || []).forEach((inp) => { v[inp.k] = inp.def; });
    return v;
  }

  function paintInputs() {
    inputBody.innerHTML = "";
    (calc.inputs || []).forEach((inp) => {
      const id = `in-${calc.id}-${inp.k}`;
      const wrap = h("div", { class: "field" });
      wrap.appendChild(h("label", { class: "field__label", for: id }, [
        h("span", { text: inp.label }),
        inp.sym ? h("span", { class: "sym", text: inp.sym }) : null,
      ]));

      if (inp.type === "select") {
        const sel = h("select", { id });
        inp.options.forEach((o) => {
          const opt = h("option", { value: String(o.value), text: o.label });
          if (String(state.values[inp.k]) === String(o.value)) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.addEventListener("change", () => {
          state.values[inp.k] = isNaN(Number(sel.value)) ? sel.value : Number(sel.value);
          compute();
        });
        wrap.appendChild(h("div", { class: "field__wrap" }, [sel]));
      } else {
        const input = h("input", {
          id,
          type: "number",
          value: String(state.values[inp.k]),
          step: inp.step ?? "any",
          inputmode: "decimal",
          autocomplete: "off",
        });
        if (inp.min !== undefined) input.min = inp.min;
        if (inp.max !== undefined) input.max = inp.max;

        const unitEl = inp.unit ? h("span", { class: "field__unit", text: inp.unit }) : null;
        const row = h("div", { class: "field__wrap" }, [input, unitEl]);
        if (!inp.unit) input.style.paddingRight = "11px";

        input.addEventListener("input", () => {
          const n = toNum(input.value);
          state.values[inp.k] = Number.isNaN(n) ? "" : n;
          input.classList.toggle("is-bad", input.value !== "" && Number.isNaN(n));
          compute();
        });
        wrap.appendChild(row);
      }

      if (inp.hint) wrap.appendChild(h("div", { class: "field__hint", text: inp.hint }));
      inputBody.appendChild(wrap);
    });
  }

  /* ---- compute ---- */
  const compute = debounce(() => {
    const vals = {};
    let bad = false;
    (calc.inputs || []).forEach((inp) => {
      const raw = state.values[inp.k];
      if (inp.type === "select") { vals[inp.k] = raw; return; }
      const n = typeof raw === "number" ? raw : toNum(raw);
      if (Number.isNaN(n)) bad = true;
      vals[inp.k] = n;
    });

    if (bad) {
      answerBody.innerHTML = "";
      answerBody.appendChild(h("div", { class: "callout", text: "Fill in every field with a number to see the answer." }));
      stepBody.innerHTML = "";
      return;
    }

    let out;
    try {
      out = calc.run(vals);
    } catch (err) {
      console.error(err);
      answerBody.innerHTML = "";
      answerBody.appendChild(h("div", { class: "callout", text: "These inputs produce an undefined result — check the values (division by zero, negative under a root, or an out-of-range angle)." }));
      stepBody.innerHTML = "";
      return;
    }
    state.out = out;

    paintAnswers(out.results || []);
    paintSteps(out.steps || []);
    // Models get the raw inputs plus whatever extra data run() supplied, so a
    // builder can derive anything it needs without a bespoke payload.
    updateViz({ ...vals, ...(out.viz || {}) });
  }, 90);

  function paintAnswers(results) {
    answerBody.innerHTML = "";
    if (!results.length) {
      answerBody.appendChild(h("div", { class: "callout", text: "No result." }));
      return;
    }
    results.forEach((r) => {
      const val = typeof r.value === "number" ? fmt(r.value, r.digits ?? 5) : r.value;
      const row = h("div", { class: `answer${r.hero ? " answer--hero" : ""}` }, [
        h("div", { class: "answer__label" }, [
          h("span", { text: r.label }),
          r.sym ? h("span", { class: "sym", text: ` ${r.sym}` }) : null,
        ]),
        h("div", { class: "answer__val" }, [
          h("span", { text: val }),
          r.unit ? h("span", { class: "answer__unit", text: r.unit }) : null,
        ]),
        r.note ? h("div", { class: "answer__note", text: r.note }) : null,
      ]);
      if (r.badge) {
        const b = h("span", {
          class: `badge ${r.badgeTone ? `badge--${r.badgeTone}` : ""}`,
          text: r.badge,
        });
        row.querySelector(".answer__label").appendChild(b);
      }
      answerBody.appendChild(row);
    });
  }

  function paintSteps(steps) {
    stepBody.innerHTML = "";
    if (!steps.length) return;
    steps.forEach((s, i) => {
      const isLast = i === steps.length - 1;
      const el = h("div", { class: `step${isLast ? " step--final" : ""}` }, [
        h("h3", { class: "step__title", text: s.title }),
      ]);
      const body = h("div", { class: "step__body" });
      if (s.text) body.appendChild(h("p", { text: s.text }));
      if (s.tex) {
        const m = h("div", { class: "step__math" });
        tex(m, s.tex, true);
        body.appendChild(m);
      }
      if (s.note) body.appendChild(h("div", { class: "step__note", html: s.note }));
      el.appendChild(body);
      stepBody.appendChild(el);
    });
  }

  /* ---- viz ---- */
  async function updateViz(data) {
    if (!calc.viz) {
      vizHost.innerHTML = `<div class="viz__empty"><span>No model for this topic</span><span style="font-size:11px">The formula is scalar — nothing to draw.</span></div>`;
      return;
    }
    const my = ++vizToken;
    if (!vizApi) {
      vizHost.innerHTML = "";
      vizApi = await mountViz(vizHost, calc.viz, data);
      if (my !== vizToken) return;
      return;
    }
    if (my !== vizToken) return;
    vizApi.update(data);
  }

  /* ---- copy ---- */
  function copySolution(btn) {
    const out = state.out;
    if (!out) return;
    const lines = [`${calc.title}  (${sec.name} · ${calc.group})`, ""];
    (calc.inputs || []).forEach((inp) => {
      lines.push(`  ${inp.label}${inp.sym ? ` [${inp.sym}]` : ""} = ${state.values[inp.k]} ${inp.unit || ""}`.trimEnd());
    });
    lines.push("", "Solution:");
    (out.steps || []).forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s.title}`);
      if (s.tex) lines.push(`     ${texToText(s.tex)}`);
    });
    lines.push("", "Answers:");
    (out.results || []).forEach((r) => {
      lines.push(`  ${r.label} = ${typeof r.value === "number" ? fmt(r.value, r.digits ?? 5) : r.value} ${r.unit || ""}`.trimEnd());
    });
    lines.push("", "— RCE Formula Lab · source: FORMULA CARD (Engr. APJO), p." + calc.pages.join(", "));
    navigator.clipboard?.writeText(lines.join("\n")).then(() => {
      const old = btn.textContent;
      btn.textContent = "Copied ✓";
      setTimeout(() => (btn.textContent = old), 1400);
    });
  }

  paintInputs();
  compute.flush();

  currentCalcCleanup = () => {
    if (vizApi) { vizApi.dispose(); vizApi = null; }
  };
}

/** Crude TeX → text, good enough for the clipboard. */
function texToText(s) {
  return s
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\left|\\right/g, "")
    .replace(/\\,|\\;|\\!|\\quad|\\qquad/g, " ")
    .replace(/\\text\{([^{}]*)\}/g, "$1")
    .replace(/\\mathrm\{([^{}]*)\}/g, "$1")
    .replace(/\\gamma/g, "γ").replace(/\\phi/g, "φ").replace(/\\theta/g, "θ")
    .replace(/\\sigma/g, "σ").replace(/\\tau/g, "τ").replace(/\\rho/g, "ρ")
    .replace(/\\mu/g, "μ").replace(/\\Delta/g, "Δ").replace(/\\pi/g, "π")
    .replace(/\\alpha/g, "α").replace(/\\beta/g, "β").replace(/\\lambda/g, "λ")
    .replace(/\\omega/g, "ω").replace(/\\eta/g, "η").replace(/\\nu/g, "ν")
    .replace(/\\psi/g, "ψ").replace(/\\varepsilon|\\epsilon/g, "ε")
    .replace(/\\infty/g, "∞").replace(/\\approx/g, "≈").replace(/\\ge/g, "≥")
    .replace(/\\le/g, "≤").replace(/\\pm/g, "±").replace(/\\%|\\%/g, "%")
    .replace(/[{}]/g, "")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ==========================================================================
   References
   ========================================================================== */

const REFS = [
  {
    group: "Rendering & 3D",
    items: [
      {
        name: "three.js",
        url: "https://github.com/mrdoob/three.js",
        what: "WebGL renderer powering every 2.5D model — orthographic camera, ExtrudeGeometry for the laser-cut sections, shadow maps and PCF soft shadows.",
        lic: "MIT",
      },
      {
        name: "three.js — ExtrudeGeometry",
        url: "https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry",
        what: "Turns the 2D engineering outlines (soil phase block, dam section, beam profile) into solid 2.5D parts with separate cap and side-wall materials.",
        lic: "MIT",
      },
      {
        name: "three.js — RoomEnvironment",
        url: "https://github.com/mrdoob/three.js/blob/dev/examples/jsm/environments/RoomEnvironment.js",
        what: "A small studio of emissive boxes, pre-filtered with PMREMGenerator into an environment map. This is what gives the concrete, soil and steel their image-based reflections and keeps shadowed faces from going flat.",
        lic: "MIT",
      },
      {
        name: "three.js — OrbitControls (reference for the drag maths)",
        url: "https://github.com/mrdoob/three.js/blob/dev/examples/jsm/controls/OrbitControls.js",
        what: "The spherical-coordinate orbit + dolly interaction was reimplemented in ~40 lines in js/viz/scene.js rather than imported, to keep the bundle small.",
        lic: "MIT",
      },
    ],
  },
  {
    group: "Surface textures",
    items: [
      {
        name: "ambientCG — Concrete034",
        url: "https://ambientcg.com/view?id=Concrete034",
        what: "Concrete surface for the dam, retaining wall, footings, channel lining and RC sections. Downscaled to 512 px and converted to a neutral detail map so the section palette can tint it.",
        lic: "CC0 1.0",
      },
      {
        name: "ambientCG — Ground054",
        url: "https://ambientcg.com/view?id=Ground054",
        what: "Soil and sand grain for the phase block, layered profiles and backfill.",
        lic: "CC0 1.0",
      },
      {
        name: "ambientCG — Metal032",
        url: "https://ambientcg.com/view?id=Metal032",
        what: "Brushed metal for pipes, piles, steel members and plates. The only surface that keeps its normal map — at model scale the others read as noise.",
        lic: "CC0 1.0",
      },
      {
        name: "Procedural water ripple normal",
        url: "#",
        what: "Generated in js/viz/scene.js as a sum of sines written into a canvas, with the gradient encoded as a tangent-space normal map. No external asset.",
        lic: "This project",
      },
    ],
  },
  {
    group: "Mathematics typesetting",
    items: [
      {
        name: "KaTeX",
        url: "https://github.com/KaTeX/KaTeX",
        what: "Renders every formula and every line of the substitution trail. Bundled locally in vendor/katex (with fonts) so the site works offline.",
        lic: "MIT",
      },
    ],
  },
  {
    group: "Engineering formula sources",
    items: [
      {
        name: "FORMULA CARD (Engr. APJO) — without grid",
        url: "#",
        what: "The primary source. Every formula, symbol convention, special note and range table on this site is transcribed from this 137-page handwritten card by Engr. Aleah Pearl Javier Once, RCE (2024). Page badges point back to it.",
        lic: "Author's work",
      },
      {
        name: "Terzaghi bearing-capacity factors",
        url: "https://en.wikipedia.org/wiki/Bearing_capacity",
        what: "Used to sanity-check the Nc / Nq / Nγ expressions as written on the card (Nc = tanφ(Kc+1) form).",
        lic: "Reference",
      },
      {
        name: "Manning / Chezy open-channel relations",
        url: "https://en.wikipedia.org/wiki/Manning_formula",
        what: "Cross-checked the Kutter, Bazin and Manning C-coefficient forms on the hydraulics pages.",
        lic: "Reference",
      },
      {
        name: "NSCP 2015 / ACI 318 notation",
        url: "https://en.wikipedia.org/wiki/ACI_318",
        what: "φ-factors, β₁, ρ_max and the 0.85f'c stress block follow the code notation the card uses.",
        lic: "Reference",
      },
    ],
  },
  {
    group: "Typography & UI",
    items: [
      {
        name: "Inter",
        url: "https://github.com/rsms/inter",
        what: "Interface text.",
        lic: "OFL 1.1",
      },
      {
        name: "Space Grotesk",
        url: "https://github.com/floriankarsten/space-grotesk",
        what: "Headings and step titles.",
        lic: "OFL 1.1",
      },
      {
        name: "JetBrains Mono",
        url: "https://github.com/JetBrains/JetBrainsMono",
        what: "All numerals, units and page references.",
        lic: "OFL 1.1",
      },
    ],
  },
];

function renderReferences() {
  const wrap = h("div", { class: "refs anim" }, [
    h("div", { class: "pagehead" }, [
      h("div", { class: "eyebrow" }, [h("span", { class: "sec", text: "Colophon" })]),
      h("h1", { text: "Code references & credits" }),
      h("p", {
        class: "lede",
        text:
          "This project is a calculator layer on top of someone else's formula card, built with a small number of open-source libraries. Everything is listed here — including what each one actually does in this codebase, not just a name-drop.",
      }),
    ]),
  ]);

  REFS.forEach((g) => {
    wrap.appendChild(h("h2", { text: g.group }));
    wrap.appendChild(h("ul", { class: "reflist" },
      g.items.map((it) => h("li", { class: "refitem" }, [
        h("h4", {}, [
          it.url === "#"
            ? h("span", { text: it.name })
            : h("a", { href: it.url, target: "_blank", rel: "noopener", text: it.name }),
        ]),
        h("p", { text: it.what }),
        h("span", { class: "lic", text: it.lic }),
      ]))
    ));
  });

  wrap.appendChild(h("h2", { text: "Method notes" }));
  wrap.appendChild(h("div", { class: "callout" }, [
    h("p", {
      html:
        "The source card is a <strong>scanned, handwritten</strong> 137-page PDF, so every formula here was read off the page and re-derived symbol by symbol. " +
        "Where the card gives a range table (relative density, plasticity index, suitability number, AASHTO group index) the calculator reports the <em>classification</em> alongside the number. " +
        "Where the card lists several equivalent forms — three ways to write D<sub>r</sub>, four Terzaghi footing shapes — the calculator exposes the shape or method as an input rather than hiding it.",
    }),
    h("p", {
      style: "margin-top:8px",
      html:
        "Units are the card's units: kN/m³, kPa, mm, m, and <em>g</em> = 9.81 m/s². Nothing is silently converted.",
    }),
  ]));

  stage.appendChild(wrap);
}

/* ==========================================================================
   Search
   ========================================================================== */

function buildSearchIndex() {
  return CALCULATORS.map((c) => ({
    c,
    hay: [
      c.title,
      c.group,
      SECTIONS[c.section].name,
      c.lede,
      ...(c.keywords || []),
    ].join(" ").toLowerCase(),
  }));
}

const SEARCH_INDEX = buildSearchIndex();

function runSearch(q) {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) {
    searchResults.hidden = true;
    searchResults.innerHTML = "";
    return;
  }
  const terms = needle.split(/\s+/);
  const hits = SEARCH_INDEX
    .map((e) => {
      let score = 0;
      for (const t of terms) {
        const inTitle = e.c.title.toLowerCase().includes(t);
        const inHay = e.hay.includes(t);
        if (!inHay) return null;
        score += inTitle ? 4 : 1;
        if (e.c.title.toLowerCase().startsWith(t)) score += 3;
      }
      return { ...e, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 9);

  searchResults.innerHTML = "";
  if (!hits.length) {
    searchResults.appendChild(h("div", { class: "search__empty", text: `Nothing matches “${q}”.` }));
    searchResults.hidden = false;
    return;
  }
  hits.forEach((hit) => {
    searchResults.appendChild(h("a", {
      href: `#/c/${hit.c.id}`,
      onclick: () => { searchResults.hidden = true; searchInput.blur(); },
    }, [
      h("span", { class: "sr-t", text: hit.c.title }),
      h("span", { class: "sr-m", text: `${SECTIONS[hit.c.section].short} · ${hit.c.group}` }),
    ]));
  });
  searchResults.hidden = false;
}

/* ==========================================================================
   Boot
   ========================================================================== */

buildSectionNav();
buildRail();

searchInput.addEventListener("input", debounce((e) => runSearch(e.target.value), 110));
searchInput.addEventListener("focus", (e) => { if (e.target.value.length >= 2) runSearch(e.target.value); });
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search")) searchResults.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === "Escape") {
    searchResults.hidden = true;
    searchInput.blur();
  }
});

qs("#railToggle").addEventListener("click", (e) => {
  const body = qs("#railBody");
  const open = body.style.display !== "none";
  body.style.display = open ? "none" : "";
  e.currentTarget.textContent = open ? "Expand" : "Collapse";
  e.currentTarget.setAttribute("aria-expanded", String(!open));
});

window.addEventListener("hashchange", () => {
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
});

render();
