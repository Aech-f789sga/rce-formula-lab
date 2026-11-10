/* ==========================================================================
   data/math.js — Math, Surveying and Transportation Engineering
   Transcribed from FORMULA CARD (Engr. APJO), pages 88–137.
   ========================================================================== */

import { texNum as N, fmt, rad, deg } from "../core.js";

const mat = (o) => ({ section: "math", ...o });

export const MATH = [

  /* ---------------------------------------------------------------- 1 */
  mat({
    id: "mat-right-triangle",
    group: "Trigonometry & Geometry",
    title: "Right Triangle Solver",
    lede: "Give it two sides or a side and an angle — it returns the rest of the triangle.",
    formula: String.raw`\sin\theta=\frac{y}{hyp} \qquad \cos\theta=\frac{x}{hyp} \qquad \tan\theta=\frac{y}{x} \qquad hyp^2=x^2+y^2`,
    pages: [88],
    keywords: ["triangle", "sine", "cosine", "tangent", "pythagorean", "right angle"],
    inputs: [
      { k: "mode", label: "Known quantities", type: "select", def: "sides",
        options: [
          { value: "sides", label: "Two sides (x and y)" },
          { value: "hypang", label: "Hypotenuse and angle" },
          { value: "oppang", label: "Opposite side and angle" },
        ] },
      { k: "x", label: "Adjacent side", sym: "x", unit: "", def: 3, step: 0.1 },
      { k: "y", label: "Opposite side", sym: "y", unit: "", def: 4, step: 0.1 },
      { k: "theta", label: "Angle θ", sym: "θ", unit: "°", def: 30, step: 1 },
    ],
    run(v) {
      let x, y, hyp, th;
      if (v.mode === "sides") {
        x = v.x; y = v.y;
        hyp = Math.hypot(x, y);
        th = deg(Math.atan2(y, x));
      } else if (v.mode === "hypang") {
        hyp = v.x; th = v.theta;
        x = hyp * Math.cos(rad(th));
        y = hyp * Math.sin(rad(th));
      } else {
        y = v.y; th = v.theta;
        hyp = y / Math.sin(rad(th));
        x = y / Math.tan(rad(th));
      }
      const other = 90 - th;
      return {
        results: [
          { label: "Hypotenuse", sym: "hyp", value: hyp, hero: true, digits: 6 },
          { label: "Adjacent side", sym: "x", value: x, digits: 6 },
          { label: "Opposite side", sym: "y", value: y, digits: 6 },
          { label: "Angle θ", value: th, unit: "°", digits: 5 },
          { label: "Remaining angle", value: other, unit: "°", digits: 5 },
          { label: "Area", value: (x * y) / 2, digits: 5 },
          { label: "Perimeter", value: x + y + hyp, digits: 5 },
        ],
        steps: [
          {
            title: "Pythagorean check",
            tex: String.raw`hyp^2=x^2+y^2 \;\Rightarrow\; hyp=\sqrt{(${N(x, 4)})^2+(${N(y, 4)})^2}=${N(hyp, 6)}`,
          },
          {
            title: "Angle from the tangent",
            tex: String.raw`\theta=\tan^{-1}\frac{y}{x}=\tan^{-1}\frac{${N(y, 4)}}{${N(x, 4)}}=${N(th, 5)}^\circ`,
          },
          {
            title: "The three primary ratios",
            tex: String.raw`\sin\theta=\frac{y}{hyp}=${N(Math.sin(rad(th)), 5)} \qquad \cos\theta=\frac{x}{hyp}=${N(Math.cos(rad(th)), 5)} \qquad \tan\theta=\frac{y}{x}=${N(Math.tan(rad(th)), 5)}`,
          },
          {
            title: "Reciprocal ratios",
            tex: String.raw`\csc\theta=\frac{hyp}{y}=${N(1 / Math.sin(rad(th)), 5)} \qquad \sec\theta=\frac{hyp}{x}=${N(1 / Math.cos(rad(th)), 5)} \qquad \cot\theta=\frac{x}{y}=${N(1 / Math.tan(rad(th)), 5)}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 2 */
  mat({
    id: "mat-oblique",
    group: "Trigonometry & Geometry",
    title: "Oblique Triangle — Sine & Cosine Law",
    lede: "Two sides and the included angle in, everything else out.",
    formula: String.raw`c^2=a^2+b^2-2ab\cos C \qquad \frac{a}{\sin A}=\frac{b}{\sin B}=\frac{c}{\sin C}`,
    pages: [88],
    keywords: ["oblique", "sine law", "cosine law", "triangle", "included angle"],
    inputs: [
      { k: "a", label: "Side a", sym: "a", unit: "", def: 8, step: 0.1 },
      { k: "b", label: "Side b", sym: "b", unit: "", def: 6, step: 0.1 },
      { k: "C", label: "Included angle C", sym: "C", unit: "°", def: 65, step: 1 },
    ],
    run(v) {
      const { a, b } = v;
      const C = rad(v.C);
      const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C));
      const A = deg(Math.asin((a * Math.sin(C)) / c));
      const B = 180 - v.C - A;
      const s = (a + b + c) / 2;
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      const R = c / (2 * Math.sin(C));
      return {
        results: [
          { label: "Side c", sym: "c", value: c, hero: true, digits: 6 },
          { label: "Angle A", value: A, unit: "°", digits: 5 },
          { label: "Angle B", value: B, unit: "°", digits: 5 },
          { label: "Area", value: area, digits: 5 },
          { label: "Circumradius", sym: "R", value: R, digits: 5 },
          { label: "Perimeter", value: a + b + c, digits: 5 },
        ],
        steps: [
          {
            title: "Cosine law for the third side",
            tex: String.raw`c^2=a^2+b^2-2ab\cos C=(${N(a)})^2+(${N(b)})^2-2(${N(a)})(${N(b)})\cos${N(v.C)}^\circ` +
              String.raw`\\[4pt] c=${N(c, 6)}`,
          },
          {
            title: "Sine law for angle A",
            tex: String.raw`\frac{a}{\sin A}=\frac{c}{\sin C}\;\Rightarrow\;\sin A=\frac{a\sin C}{c}=${N(Math.sin(rad(A)), 5)}\;\Rightarrow\;A=${N(A, 5)}^\circ`,
          },
          {
            title: "Angle sum",
            tex: String.raw`B=180^\circ-A-C=180-${N(A, 5)}-${N(v.C)}=${N(B, 5)}^\circ`,
          },
          {
            title: "Area by Heron's formula",
            tex: String.raw`s=\frac{a+b+c}{2}=${N(s, 5)} \qquad A=\sqrt{s(s-a)(s-b)(s-c)}=${N(area, 5)}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 3 */
  mat({
    id: "mat-polygon",
    group: "Trigonometry & Geometry",
    title: "Regular Polygon",
    lede: "Perimeter, area, interior and exterior angles, and the diagonal count.",
    formula: String.raw`A=\frac{s^2n}{4\tan(180^\circ/n)} \qquad \Sigma\theta=180^\circ(n-2)`,
    pages: [92],
    keywords: ["polygon", "regular", "area", "apothem", "diagonal", "interior angle"],
    inputs: [
      { k: "n", label: "Number of sides", sym: "n", unit: "", def: 6, step: 1 },
      { k: "s", label: "Side length", sym: "s", unit: "", def: 5, step: 0.1 },
    ],
    run(v) {
      const { n, s } = v;
      const P = s * n;
      const A = (s * s * n) / (4 * Math.tan(Math.PI / n));
      const apothem = s / (2 * Math.tan(Math.PI / n));
      const interior = (180 * (n - 2)) / n;
      const exterior = 360 / n;
      const diag = (n * (n - 3)) / 2;
      return {
        results: [
          { label: "Area", sym: "A", value: A, hero: true, digits: 6 },
          { label: "Perimeter", sym: "P", value: P, digits: 5 },
          { label: "Apothem", sym: "a", value: apothem, digits: 5 },
          { label: "Interior angle", value: interior, unit: "°", digits: 5 },
          { label: "Exterior angle", value: exterior, unit: "°", digits: 5 },
          { label: "Number of diagonals", sym: "d", value: diag },
          { label: "Circumradius", sym: "R", value: s / (2 * Math.sin(Math.PI / n)), digits: 5 },
        ],
        steps: [
          {
            title: "Perimeter",
            tex: String.raw`P=sn=(${N(s)})(${N(n)})=${N(P, 5)}`,
          },
          {
            title: "Area from side length",
            tex: String.raw`A=\frac{s^2n}{4\tan(180^\circ/n)}=\frac{(${N(s)})^2(${N(n)})}{4\tan(180^\circ/${N(n)})}=${N(A, 6)}`,
            note: `Equivalent: A = ½ P a with apothem a = ${N(apothem, 5)}.`,
          },
          {
            title: "Angles",
            tex: String.raw`\Sigma\theta=180^\circ(n-2)=${N(180 * (n - 2))}^\circ \;\Rightarrow\;\text{each}=${N(interior, 5)}^\circ` +
              String.raw`\\[4pt] \Sigma\beta=360^\circ \;\Rightarrow\;\text{each exterior}=${N(exterior, 5)}^\circ`,
          },
          {
            title: "Diagonals",
            tex: String.raw`d=\frac{n}{2}(n-3)=\frac{${N(n)}}{2}(${N(n)}-3)=${N(diag)}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 4 */
  mat({
    id: "mat-circle-triangle",
    group: "Trigonometry & Geometry",
    title: "Circle Inscribed in / Circumscribed about a Triangle",
    lede: "Inradius, circumradius and the two areas the card lists for a triangle and its circle.",
    formula: String.raw`A=rs \qquad A=\frac{abc}{4R} \qquad A=r(s-a)`,
    pages: [92],
    keywords: ["inradius", "circumradius", "inscribed circle", "escribed", "triangle area"],
    inputs: [
      { k: "a", label: "Side a", sym: "a", unit: "", def: 8, step: 0.1 },
      { k: "b", label: "Side b", sym: "b", unit: "", def: 7, step: 0.1 },
      { k: "c", label: "Side c", sym: "c", unit: "", def: 5, step: 0.1 },
    ],
    run(v) {
      const { a, b, c } = v;
      const s = (a + b + c) / 2;
      const A = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      const r = A / s;
      const R = (a * b * c) / (4 * A);
      const exA = A / (s - a);
      return {
        results: [
          { label: "Triangle area", sym: "A", value: A, hero: true, digits: 6 },
          { label: "Inradius", sym: "r", value: r, digits: 5 },
          { label: "Circumradius", sym: "R", value: R, digits: 5 },
          { label: "Semi-perimeter", sym: "s", value: s, digits: 5 },
          { label: "Exradius opposite a", value: exA, digits: 5 },
          { label: "Area of the incircle", value: Math.PI * r * r, digits: 5 },
        ],
        steps: [
          {
            title: "Semi-perimeter and area",
            tex: String.raw`s=\frac{a+b+c}{2}=${N(s, 5)} \qquad A=\sqrt{s(s-a)(s-b)(s-c)}=${N(A, 5)}`,
          },
          {
            title: "Inradius",
            tex: String.raw`A=rs \;\Rightarrow\; r=\frac{A}{s}=\frac{${N(A, 5)}}{${N(s, 5)}}=${N(r, 5)}`,
            note: "A = rs is the card's 'inscribed in a circle' form — area equals inradius times semi-perimeter.",
          },
          {
            title: "Circumradius",
            tex: String.raw`A=\frac{abc}{4R} \;\Rightarrow\; R=\frac{abc}{4A}=\frac{(${N(a)})(${N(b)})(${N(c)})}{4(${N(A, 5)})}=${N(R, 5)}`,
          },
          {
            title: "Excircle",
            tex: String.raw`A=r_a(s-a) \;\Rightarrow\; r_a=\frac{A}{s-a}=${N(exA, 5)}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 5 */
  mat({
    id: "mat-line",
    group: "Analytic Geometry",
    title: "Line Between Two Points",
    lede: "Distance, slope, midpoint, both standard forms, and the angle to a second line.",
    formula: String.raw`d=\sqrt{(x_2-x_1)^2+(y_2-y_1)^2} \qquad m=\frac{y_2-y_1}{x_2-x_1} \qquad \theta=\tan^{-1}\frac{m_2-m_1}{1+m_1m_2}`,
    pages: [96],
    keywords: ["distance", "slope", "midpoint", "line equation", "angle between lines", "parallel", "perpendicular"],
    inputs: [
      { k: "x1", label: "x₁", sym: "x_1", unit: "", def: 2, step: 0.5 },
      { k: "y1", label: "y₁", sym: "y_1", unit: "", def: 3, step: 0.5 },
      { k: "x2", label: "x₂", sym: "x_2", unit: "", def: 9, step: 0.5 },
      { k: "y2", label: "y₂", sym: "y_2", unit: "", def: 11, step: 0.5 },
      { k: "m2", label: "Slope of a second line", sym: "m_2", unit: "", def: -0.5, step: 0.1 },
    ],
    run(v) {
      const { x1, y1, x2, y2, m2 } = v;
      const d = Math.hypot(x2 - x1, y2 - y1);
      const m1 = (y2 - y1) / (x2 - x1);
      const bInt = y1 - m1 * x1;
      const th = deg(Math.atan((m2 - m1) / (1 + m1 * m2)));
      const A = y2 - y1, B = -(x2 - x1), Cc = -(A * x1 + B * y1);

      return {
        results: [
          { label: "Distance", sym: "d", value: d, hero: true, digits: 6 },
          { label: "Slope", sym: "m", value: m1, digits: 6 },
          { label: "Midpoint", value: `(${fmt((x1 + x2) / 2, 5)}, ${fmt((y1 + y2) / 2, 5)})` },
          { label: "Slope-intercept form", value: `y = ${fmt(m1, 4)}x ${bInt >= 0 ? "+" : "−"} ${fmt(Math.abs(bInt), 4)}` },
          { label: "General form", value: `${fmt(A, 4)}x ${B >= 0 ? "+" : "−"} ${fmt(Math.abs(B), 4)}y ${Cc >= 0 ? "+" : "−"} ${fmt(Math.abs(Cc), 4)} = 0` },
          { label: "Angle to the second line", sym: "θ", value: th, unit: "°", digits: 5 },
          { label: "Inclination of this line", value: deg(Math.atan(m1)), unit: "°", digits: 5 },
        ],
        steps: [
          {
            title: "Distance and midpoint",
            tex: String.raw`d=\sqrt{(${N(x2)}-${N(x1)})^2+(${N(y2)}-${N(y1)})^2}=${N(d, 6)}` +
              String.raw`\\[4pt] \bar{x}=${N((x1 + x2) / 2, 5)},\quad \bar{y}=${N((y1 + y2) / 2, 5)}`,
          },
          {
            title: "Slope",
            tex: String.raw`m=\frac{y_2-y_1}{x_2-x_1}=\frac{${N(y2)}-${N(y1)}}{${N(x2)}-${N(x1)}}=${N(m1, 6)}`,
            note: m1 === 0 ? "Horizontal line." : !isFinite(m1) ? "Vertical line — slope is undefined." : null,
          },
          {
            title: "Equation of the line",
            tex: String.raw`y-y_1=m(x-x_1) \;\Rightarrow\; y=${N(m1, 5)}x${bInt >= 0 ? "+" : "-"}${N(Math.abs(bInt), 5)}`,
          },
          {
            title: "Angle between two lines",
            tex: String.raw`\theta=\tan^{-1}\frac{m_2-m_1}{1+m_1m_2}=\tan^{-1}\frac{${N(m2)}-${N(m1, 5)}}{1+(${N(m1, 5)})(${N(m2)})}=${N(th, 5)}^\circ`,
            note: "Parallel when m₁ = m₂; perpendicular when m₁m₂ = −1.",
          },
        ],
        viz: "mat:line",
      };
    },
  }),

  /* ---------------------------------------------------------------- 6 */
  mat({
    id: "mat-quadratic",
    group: "Algebra",
    title: "Quadratic Equation",
    lede: "Roots, discriminant, vertex and the sum/product relations.",
    formula: String.raw`x=\frac{-B\pm\sqrt{B^2-4AC}}{2A} \qquad x_1+x_2=-\frac{B}{A} \qquad x_1x_2=\frac{C}{A}`,
    pages: [100],
    keywords: ["quadratic", "roots", "discriminant", "vertex", "parabola"],
    inputs: [
      { k: "A", label: "Coefficient A", sym: "A", unit: "", def: 1, step: 0.5 },
      { k: "B", label: "Coefficient B", sym: "B", unit: "", def: -5, step: 0.5 },
      { k: "C", label: "Constant C", sym: "C", unit: "", def: 6, step: 0.5 },
    ],
    run(v) {
      const { A, B, C } = v;
      const D = B * B - 4 * A * C;
      const re = -B / (2 * A);
      const im = Math.sqrt(Math.abs(D)) / (2 * A);
      const nature = D > 0 ? "Two distinct real roots" : D === 0 ? "Equal real roots" : "Imaginary (complex conjugate) roots";
      const r1 = D >= 0 ? re + Math.sqrt(D) / (2 * A) : re;
      const r2 = D >= 0 ? re - Math.sqrt(D) / (2 * A) : re;

      return {
        results: [
          { label: "Root 1", sym: "x_1", value: r1, hero: true, digits: 6 },
          { label: "Root 2", sym: "x_2", value: r2, digits: 6 },
          { label: "Discriminant", sym: "B²−4AC", value: D, digits: 6, badge: nature, badgeTone: D >= 0 ? "ok" : "warn" },
          { label: D >= 0 ? "Sum of roots" : "Real part", value: -B / A, digits: 6 },
          { label: D >= 0 ? "Product of roots" : "Imaginary part", value: D >= 0 ? C / A : im, digits: 6 },
          { label: "Vertex", value: `(${fmt(re, 5)}, ${fmt(A * re * re + B * re + C, 5)})` },
        ],
        steps: [
          {
            title: "Discriminant",
            tex: String.raw`B^2-4AC=(${N(B)})^2-4(${N(A)})(${N(C)})=${N(D, 6)}`,
            note: "D > 0 → two real roots, D = 0 → equal roots, D < 0 → imaginary. That is the card's roots table.",
          },
          {
            title: "Quadratic formula",
            tex: D >= 0
              ? String.raw`x=\frac{-B\pm\sqrt{B^2-4AC}}{2A}=\frac{${N(-B)}\pm\sqrt{${N(D, 6)}}}{2(${N(A)})} \;\Rightarrow\; x_1=${N(r1, 6)},\ x_2=${N(r2, 6)}`
              : String.raw`x=\frac{${N(-B)}}{2(${N(A)})}\pm i\frac{\sqrt{${N(Math.abs(D), 6)}}}{2(${N(A)})}=${N(re, 5)}\pm${N(im, 5)}i`,
          },
          {
            title: "Sum and product check",
            tex: String.raw`x_1+x_2=-\frac{B}{A}=${N(-B / A, 6)} \qquad x_1x_2=\frac{C}{A}=${N(C / A, 6)}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 7 */
  mat({
    id: "mat-permcomb",
    group: "Algebra & Statistics",
    title: "Permutation & Combination",
    lede: "Arrangements and selections, with the card's eight-case decision table reduced to a single answer.",
    formula: String.raw`{}_nP_r=\frac{n!}{(n-r)!} \qquad {}_nC_r=\frac{n!}{r!(n-r)!}`,
    pages: [104],
    keywords: ["permutation", "combination", "factorial", "arrangement", "probability"],
    inputs: [
      { k: "n", label: "Total objects", sym: "n", unit: "", def: 10, step: 1 },
      { k: "r", label: "Objects taken", sym: "r", unit: "", def: 3, step: 1 },
      { k: "rep", label: "Repetition", type: "select", def: 0,
        options: [{ value: 0, label: "No repetition (distinct objects)" }, { value: 1, label: "With repetition allowed" }] },
    ],
    run(v) {
      const { n, r } = v;
      const fact = (k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
      const P = v.rep ? Math.pow(n, r) : fact(n) / fact(n - r);
      const C = fact(n) / (fact(r) * fact(n - r));
      const circ = fact(n - 1);
      return {
        results: [
          { label: "Permutation", sym: "nPr", value: P, hero: true, digits: 8 },
          { label: "Combination", sym: "nCr", value: C, digits: 8 },
          { label: "n!", value: fact(n), digits: 8 },
          { label: "Circular permutation (n−1)!", value: circ, digits: 8 },
          { label: "Ratio nPr / nCr", value: P / C, digits: 6, note: "always r!" },
        ],
        steps: [
          {
            title: "Permutation — order matters",
            tex: v.rep
              ? String.raw`{}_nP_r=n^r=${N(n)}^{${N(r)}}=${N(P, 8)}`
              : String.raw`{}_nP_r=\frac{n!}{(n-r)!}=\frac{${N(n)}!}{${N(n - r)}!}=${N(P, 8)}`,
            note: v.rep ? "With repetition each of the r positions can be any of n objects." : "The card's L-A-N-U case: linear, all objects, no repetition, unique objects.",
          },
          {
            title: "Combination — order does not matter",
            tex: String.raw`{}_nC_r=\frac{n!}{r!(n-r)!}=\frac{${N(P, 8)}}{${N(r)}!}=${N(C, 8)}`,
          },
          {
            title: "Circular permutation",
            tex: String.raw`{}_nP_n=(n-1)!=${N(circ, 8)}`,
            note: "Rotations of a circle are not new arrangements — fix one object and permute the rest.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 8 */
  mat({
    id: "mat-binomial",
    group: "Algebra & Statistics",
    title: "Binomial Expansion — n-th Term",
    lede: "The general term of (a + b)ⁿ, its coefficient, and the sum of exponents.",
    formula: String.raw`{}_nC_m\,a^{n-m}b^m \quad\text{where } m=r-1`,
    pages: [100],
    keywords: ["binomial", "expansion", "nth term", "coefficient", "pascal"],
    inputs: [
      { k: "n", label: "Exponent n", sym: "n", unit: "", def: 8, step: 1 },
      { k: "r", label: "Term number r", sym: "r", unit: "", def: 4, step: 1 },
      { k: "a", label: "Value of a", sym: "a", unit: "", def: 2, step: 0.5 },
      { k: "b", label: "Value of b", sym: "b", unit: "", def: 3, step: 0.5 },
    ],
    run(v) {
      const { n, r, a, b } = v;
      const fact = (k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
      const m = r - 1;
      const coef = fact(n) / (fact(n - m) * fact(m));
      const term = coef * Math.pow(a, n - m) * Math.pow(b, m);
      const total = Math.pow(a + b, n);
      return {
        results: [
          { label: `Term ${r}`, value: term, hero: true, digits: 8 },
          { label: "Binomial coefficient", sym: "nCm", value: coef, digits: 8 },
          { label: "m = r − 1", value: m },
          { label: "(a + b)ⁿ", value: total, digits: 8 },
          { label: "Sum of exponents", value: n * (n + 1) / 2 * 0, note: "each term carries exponent n; total across the expansion is n(n+1)/2 × (a+b)" },
        ],
        steps: [
          {
            title: "Locate the term",
            tex: String.raw`m=r-1=${N(r)}-1=${N(m)}`,
            note: "The card's warning: term number r uses m = r − 1, not m = r.",
          },
          {
            title: "General term",
            tex: String.raw`{}_nC_m\,a^{n-m}b^m={}_{${N(n)}}C_{${N(m)}}\,(${N(a)})^{${N(n - m)}}(${N(b)})^{${N(m)}}` +
              String.raw`\\[4pt] =(${N(coef)})\,(${N(Math.pow(a, n - m), 6)})\,(${N(Math.pow(b, m), 6)})=${N(term, 8)}`,
          },
          {
            title: "Check against the full expansion",
            tex: String.raw`(a+b)^n=(${N(a)}+${N(b)})^{${N(n)}}=${N(total, 8)}`,
          },
        ],
        viz: null,
      };
    },
  }),

  /* ---------------------------------------------------------------- 9 */
  mat({
    id: "mat-normal",
    group: "Algebra & Statistics",
    title: "Normal Distribution & z-Score",
    lede: "Standardise a value, then read the area under the curve — left, right, or between.",
    formula: String.raw`z=\frac{x-\mu}{\sigma}`,
    pages: [106],
    keywords: ["normal", "z-score", "standard deviation", "probability", "area under curve"],
    viz: "mat:normal",
    inputs: [
      { k: "mu", label: "Mean", sym: "μ", unit: "", def: 68, step: 0.5 },
      { k: "sd", label: "Standard deviation", sym: "σ", unit: "", def: 9, step: 0.5 },
      { k: "x", label: "Value of interest", sym: "x", unit: "", def: 80, step: 0.5 },
      { k: "x2", label: "Second value (for between)", sym: "x_2", unit: "", def: 90, step: 0.5 },
    ],
    run(v) {
      const { mu, sd, x, x2 } = v;
      const erf = (z) => {
        const t = 1 / (1 + 0.5 * Math.abs(z));
        const y = 1 - t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 +
          t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 +
          t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
        return z >= 0 ? y : -y;
      };
      const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
      const z = (x - mu) / sd;
      const z2 = (x2 - mu) / sd;
      const left = Phi(z) * 100;
      const right = (1 - Phi(z)) * 100;
      const between = Math.abs(Phi(z2) - Phi(z)) * 100;

      return {
        results: [
          { label: "z-score", sym: "z", value: z, hero: true, digits: 5 },
          { label: "P(X ≤ x)", value: left, unit: "%", digits: 5 },
          { label: "P(X ≥ x)", value: right, unit: "%", digits: 5 },
          { label: `P(${fmt(x, 4)} ≤ X ≤ ${fmt(x2, 4)})`, value: between, unit: "%", digits: 5 },
          { label: "Second z-score", sym: "z_2", value: z2, digits: 5 },
          { label: "Value at +1σ / −1σ", value: `${fmt(mu + sd, 4)} / ${fmt(mu - sd, 4)}` },
        ],
        steps: [
          {
            title: "Standardise",
            tex: String.raw`z=\frac{x-\mu}{\sigma}=\frac{${N(x)}-${N(mu)}}{${N(sd)}}=${N(z, 5)}`,
            note: "z is how many standard deviations x sits from the mean.",
          },
          {
            title: "Area to the left",
            tex: String.raw`P(X\le x)=\Phi(z)=${N(left / 100, 5)}=${N(left, 4)}\%`,
          },
          {
            title: "Area to the right and between",
            tex: String.raw`P(X\ge x)=1-\Phi(z)=${N(right, 4)}\%` +
              String.raw`\\[4pt] P(x_1\le X\le x_2)=\Phi(z_2)-\Phi(z_1)=${N(between, 4)}\%`,
            note: "The card's Q(z) is the area to the right — the 'tail' beyond the z value.",
          },
        ],
        viz: { mu, sd, z, left },
      };
    },
  }),

  /* --------------------------------------------------------------- 10 */
  mat({
    id: "mat-poisson",
    group: "Algebra & Statistics",
    title: "Poisson & Geometric Probability",
    lede: "Count of rare events in an interval, and the wait for the first success.",
    formula: String.raw`P(x)=\frac{\mu^xe^{-\mu}}{x!} \qquad P(n)=q^{\,n-1}p`,
    pages: [106],
    keywords: ["poisson", "geometric", "probability", "rare events", "distribution"],
    inputs: [
      { k: "mu", label: "Mean rate μ", sym: "μ", unit: "", def: 3.5, step: 0.1 },
      { k: "x", label: "Number of occurrences x", sym: "x", unit: "", def: 2, step: 1 },
      { k: "p", label: "Probability of success p", sym: "p", unit: "", def: 0.2, step: 0.01 },
      { k: "nn", label: "Trial of first success", sym: "n", unit: "", def: 4, step: 1 },
    ],
    run(v) {
      const { mu, x, p, nn } = v;
      const fact = (k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
      const Px = (Math.pow(mu, x) * Math.exp(-mu)) / fact(x);
      const Ple = (() => { let s = 0; for (let i = 0; i <= x; i++) s += (Math.pow(mu, i) * Math.exp(-mu)) / fact(i); return s; })();
      const Pgeo = Math.pow(1 - p, nn - 1) * p;
      return {
        results: [
          { label: `P(X = ${Math.round(x)})`, value: Px, hero: true, digits: 6 },
          { label: `P(X ≤ ${Math.round(x)})`, value: Ple, digits: 6 },
          { label: "Geometric P(n)", value: Pgeo, digits: 6 },
          { label: "Expected value", sym: "μ", value: mu },
          { label: "Standard deviation", sym: "√μ", value: Math.sqrt(mu), digits: 5 },
        ],
        steps: [
          {
            title: "Poisson probability",
            tex: String.raw`P(x)=\frac{\mu^xe^{-\mu}}{x!}=\frac{(${N(mu)})^{${N(x)}}e^{-${N(mu)}}}{${N(x)}!}=${N(Px, 6)}`,
            note: "Poisson is the limit of the binomial for rare events — the mean and variance are both μ.",
          },
          {
            title: "Cumulative probability",
            tex: String.raw`P(X\le ${N(x)})=\sum_{i=0}^{${N(x)}}\frac{\mu^ie^{-\mu}}{i!}=${N(Ple, 6)}`,
          },
          {
            title: "Geometric distribution",
            tex: String.raw`P(n)=q^{n-1}p=(${N(1 - p, 3)})^{${N(nn - 1)}}(${N(p)})=${N(Pgeo, 6)}`,
            note: "The geometric distribution answers 'what is the chance the first success lands on trial n?'",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 11 */
  mat({
    id: "mat-interest",
    group: "Engineering Economy",
    title: "Compound Interest",
    lede: "Future worth, present worth, and the effective rate for any compounding interval.",
    formula: String.raw`F=P(1+i)^n \qquad P=\frac{F}{(1+i)^n} \qquad ER=\left(1+\frac{r}{m}\right)^m-1`,
    pages: [116],
    keywords: ["compound interest", "future worth", "present worth", "effective rate", "nominal"],
    inputs: [
      { k: "P", label: "Present amount", sym: "P", unit: "₱", def: 100000, step: 1000 },
      { k: "r", label: "Nominal annual rate", sym: "r", unit: "%", def: 8, step: 0.25 },
      { k: "m", label: "Compounding periods per year", sym: "m", unit: "", def: 12, step: 1 },
      { k: "t", label: "Number of years", sym: "t", unit: "yr", def: 5, step: 1 },
    ],
    run(v) {
      const { P, r, m, t } = v;
      const i = r / 100 / m;
      const n = m * t;
      const F = P * Math.pow(1 + i, n);
      const ER = (Math.pow(1 + r / 100 / m, m) - 1) * 100;
      const simple = P * (1 + (r / 100) * t);
      return {
        results: [
          { label: "Future worth", sym: "F", value: F, hero: true, digits: 7 },
          { label: "Interest earned", value: F - P, digits: 7 },
          { label: "Effective annual rate", sym: "ER", value: ER, unit: "%", digits: 5 },
          { label: "Periodic rate", sym: "i", value: i * 100, unit: "%", digits: 5 },
          { label: "Total periods", sym: "n", value: n },
          { label: "Simple interest comparison", value: simple, digits: 7, note: "compound − simple = the cost of compounding" },
        ],
        steps: [
          {
            title: "Periodic rate and number of periods",
            tex: String.raw`i=\frac{r}{m}=\frac{${N(r)}\%}{${N(m)}}=${N(i * 100, 5)}\% \qquad n=mt=(${N(m)})(${N(t)})=${N(n)}`,
          },
          {
            title: "Future worth",
            tex: String.raw`F=P(1+i)^n=(${N(P, 7)})(1+${N(i, 6)})^{${N(n)}}=${N(F, 7)}`,
          },
          {
            title: "Effective rate",
            tex: String.raw`ER=\left(1+\frac{r}{m}\right)^m-1=\left(1+\frac{${N(r)}\%}{${N(m)}}\right)^{${N(m)}}-1=${N(ER, 5)}\%`,
            note: "Continuous compounding: ER = e^r − 1.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 12 */
  mat({
    id: "mat-annuity",
    group: "Engineering Economy",
    title: "Annuity — Future & Present Worth",
    lede: "A uniform series: what it grows to, what it is worth today, and the sinking-fund factor.",
    formula: String.raw`F=A\left[\frac{(1+i)^n-1}{i}\right] \qquad P=A\left[\frac{(1+i)^n-1}{i(1+i)^n}\right]`,
    pages: [116],
    keywords: ["annuity", "uniform series", "sinking fund", "capital recovery", "present worth"],
    inputs: [
      { k: "A", label: "Uniform payment", sym: "A", unit: "₱", def: 25000, step: 1000 },
      { k: "r", label: "Nominal annual rate", sym: "r", unit: "%", def: 9, step: 0.25 },
      { k: "m", label: "Compounding periods per year", sym: "m", unit: "", def: 12, step: 1 },
      { k: "t", label: "Number of years", sym: "t", unit: "yr", def: 6, step: 1 },
      { k: "type", label: "Payment timing", type: "select", def: "ordinary",
        options: [{ value: "ordinary", label: "Ordinary — end of each period" }, { value: "due", label: "Annuity due — start of each period" }] },
    ],
    run(v) {
      const { A, r, m, t } = v;
      const i = r / 100 / m;
      const n = m * t;
      const due = v.type === "due" ? 1 + i : 1;
      const F = A * ((Math.pow(1 + i, n) - 1) / i) * due;
      const P = A * ((Math.pow(1 + i, n) - 1) / (i * Math.pow(1 + i, n))) * due;
      const sinking = i / (Math.pow(1 + i, n) - 1);
      const capitalRec = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);

      return {
        results: [
          { label: "Future worth of the series", sym: "F", value: F, hero: true, digits: 7 },
          { label: "Present worth of the series", sym: "P", value: P, digits: 7 },
          { label: "Total payments made", value: A * n, digits: 7 },
          { label: "Interest component", value: F - A * n, digits: 7 },
          { label: "Sinking-fund factor (A/F)", value: sinking, digits: 5 },
          { label: "Capital-recovery factor (A/P)", value: capitalRec, digits: 5 },
          { label: "Periodic rate / periods", value: `${fmt(i * 100, 4)}% / ${n}` },
        ],
        steps: [
          {
            title: "Periodic rate",
            tex: String.raw`i=\frac{${N(r)}\%}{${N(m)}}=${N(i * 100, 5)}\%,\qquad n=(${N(m)})(${N(t)})=${N(n)}`,
          },
          {
            title: "Future worth",
            tex: String.raw`F=A\left[\frac{(1+i)^n-1}{i}\right]=(${N(A, 7)})\left[\frac{(1+${N(i, 6)})^{${N(n)}}-1}{${N(i, 6)}}\right]=${N(F, 7)}`,
            note: "The card's note: F is always at the last payment.",
          },
          {
            title: "Present worth",
            tex: String.raw`P=A\left[\frac{(1+i)^n-1}{i(1+i)^n}\right]=\frac{F}{(1+i)^n}=${N(P, 7)}`,
          },
          v.type === "due" ? {
            title: "Annuity due adjustment",
            tex: String.raw`F_{due}=F(1+i) \qquad P_{due}=P(1+i)`,
            note: "Paying at the start of each period adds one period of interest to every payment.",
          } : null,
        ].filter(Boolean),
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 13 */
  mat({
    id: "mat-payback",
    group: "Engineering Economy",
    title: "Payback Period & Discount Rate",
    lede: "How long until the investment returns itself, and the two ways to express a simple discount.",
    formula: String.raw`\text{Payback}=\frac{\text{fixed capital}}{\text{annual profit}+\text{annual depreciation}} \qquad i_d=\frac{i}{1+i}`,
    pages: [120],
    keywords: ["payback", "payback period", "discount rate", "roi", "capital"],
    inputs: [
      { k: "cap", label: "Depreciable fixed capital", sym: "", unit: "₱", def: 4500000, step: 10000 },
      { k: "profit", label: "Annual profit", sym: "", unit: "₱/yr", def: 620000, step: 5000 },
      { k: "dep", label: "Annual depreciation", sym: "", unit: "₱/yr", def: 380000, step: 5000 },
      { k: "F", label: "Future amount", sym: "F", unit: "₱", def: 120000, step: 1000 },
      { k: "P", label: "Present amount", sym: "P", unit: "₱", def: 100000, step: 1000 },
    ],
    run(v) {
      const { cap, profit, dep, F, P } = v;
      const payback = cap / (profit + dep);
      const iRate = (F - P) / P;
      const id = iRate / (1 + iRate);
      return {
        results: [
          { label: "Payback period", value: payback, unit: "years", hero: true, digits: 5 },
          { label: "Annual cash recovery", value: profit + dep, unit: "₱/yr", digits: 7 },
          { label: "Simple interest rate", sym: "i", value: iRate * 100, unit: "%", digits: 5 },
          { label: "Simple discount rate", sym: "i_d", value: id * 100, unit: "%", digits: 5 },
          { label: "Discount amount", value: F - P, digits: 7 },
        ],
        steps: [
          {
            title: "Payback period",
            tex: String.raw`\text{Payback}=\frac{\text{fixed capital}}{\text{annual profit}+\text{annual depreciation}}=\frac{${N(cap, 7)}}{${N(profit, 7)}+${N(dep, 7)}}=${N(payback, 5)}\ \text{years}`,
            note: "Depreciation is added back because it is a non-cash charge — the cash is already spent.",
          },
          {
            title: "Simple interest rate on the discount",
            tex: String.raw`i=\frac{F-P}{P}=\frac{${N(F, 7)}-${N(P, 7)}}{${N(P, 7)}}=${N(iRate * 100, 5)}\%`,
          },
          {
            title: "Discount rate",
            tex: String.raw`i_d=\frac{F-P}{F}=${N(((F - P) / F) * 100, 5)}\% \qquad i_d=\frac{i}{1+i}=${N(id * 100, 5)}\%`,
            note: "Interest is computed on the present amount; discount on the future amount. That single difference is the whole distinction.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 14 */
  mat({
    id: "mat-vcurve",
    group: "Surveying",
    title: "Symmetrical Vertical Curve",
    lede: "Grade change, the mid-ordinate, and the station and elevation of the turning point.",
    formula: String.raw`H=\frac{L}{8}(g_1-g_2) \qquad x=\frac{g_1L}{g_1-g_2}`,
    pages: [110],
    keywords: ["vertical curve", "parabolic", "grade", "sight distance", "crest", "sag"],
    viz: "mat:vcurve",
    inputs: [
      { k: "g1", label: "Entrance grade", sym: "g_1", unit: "%", def: 3.2, step: 0.1 },
      { k: "g2", label: "Exit grade", sym: "g_2", unit: "%", def: -2.4, step: 0.1 },
      { k: "L", label: "Length of curve", sym: "L", unit: "m", def: 180, step: 5 },
      { k: "staPVC", label: "Station of PVC", sym: "", unit: "m", def: 1000, step: 10 },
      { k: "elevPVC", label: "Elevation of PVC", sym: "", unit: "m", def: 120, step: 0.5 },
      { k: "staQ", label: "Station of interest", sym: "", unit: "m", def: 1080, step: 5 },
    ],
    run(v) {
      const { g1, g2, L, staPVC, elevPVC, staQ } = v;
      const A = g2 - g1;                      // percent
      const Adec = A / 100;                   // decimal grade change
      const H = (L / 8) * ((g1 - g2) / 100);  // mid-ordinate, in metres
      const xTurn = Math.abs(A) < 1e-9 ? L / 2 : (g1 * L) / (g1 - g2);
      const staV = staPVC + xTurn;
      const elevTangentV = elevPVC + (g1 / 100) * xTurn;
      const yV = (Adec / (2 * L)) * xTurn * xTurn;
      const elevV = elevTangentV + yV;

      const xq = Math.min(Math.max(staQ - staPVC, 0), L);
      const elevTangentQ = elevPVC + (g1 / 100) * xq;
      const yq = (Adec / (2 * L)) * xq * xq;
      const elevQ = elevTangentQ + yq;
      const gradeQ = g1 + (A * xq) / L;

      return {
        results: [
          { label: "Algebraic grade change", sym: "A", value: A, unit: "%", hero: true, digits: 4,
            badge: A < 0 ? "Crest" : "Sag", badgeTone: "ok" },
          { label: "Mid-ordinate", sym: "H", value: H, unit: "m", digits: 4 },
          { label: "Station of turning point", sym: "", value: staV, unit: "m", digits: 6 },
          { label: "Elevation of turning point", value: elevV, unit: "m", digits: 6 },
          { label: `Elevation at station ${fmt(staQ, 4)}`, value: elevQ, unit: "m", digits: 6 },
          { label: "Grade at that station", value: gradeQ, unit: "%", digits: 4 },
          { label: "Offset from tangent", sym: "y", value: yq, unit: "m", digits: 4 },
        ],
        steps: [
          {
            title: "Grade change",
            tex: String.raw`A=g_2-g_1=${N(g2)}-${N(g1)}=${N(A)}\%`,
            note: "A < 0 gives a crest curve; A > 0 gives a sag curve.",
          },
          {
            title: "Mid-ordinate",
            tex: String.raw`H=\frac{L}{8}\cdot\frac{g_1-g_2}{100}=\frac{${N(L)}}{8}\cdot\frac{${N(g1)}-${N(g2)}}{100}=${N(H, 4)}\ \text{m}`,
            note: "H is the vertical distance between the curve and the grade intersection at mid-length.",
          },
          {
            title: "Turning point",
            tex: String.raw`x=\frac{g_1L}{g_1-g_2}=\frac{(${N(g1)})(${N(L)})}{${N(g1 - g2)}}=${N(xTurn, 5)}\ \text{m from PVC}` +
              String.raw`\\[4pt] \text{Sta}_V=${N(staPVC)}+${N(xTurn, 5)}=${N(staV, 6)}`,
          },
          {
            title: "Elevation at the turning point",
            tex: String.raw`y=\frac{A/100}{2L}x^2=${N(yV, 4)}\ \text{m},\quad \text{Elev}_V=${N(elevTangentV, 5)}+${N(yV, 4)}=${N(elevV, 5)}\ \text{m}`,
            note: "The curve always lies on the same side of the tangent as the offset y — here it adds to the tangent elevation.",
          },
          {
            title: `Elevation at station ${fmt(staQ, 4)}`,
            tex: String.raw`x=${N(xq, 4)}\ \text{m},\quad y=\frac{A/100}{2L}x^2=${N(yq, 4)}\ \text{m}` +
              String.raw`\\[4pt] \text{Elev}=${N(elevTangentQ, 5)}+${N(yq, 4)}=${N(elevQ, 5)}\ \text{m}`,
          },
        ],
        viz: { g1, g2, L, staPVC, elevPVC, staQ, A, H },
      };
    },
  }),

  /* --------------------------------------------------------------- 15 */
  mat({
    id: "mat-hcurve",
    group: "Surveying",
    title: "Horizontal Curve Elements",
    lede: "Tangent, length, external and middle ordinates, long chord and the degree of curve.",
    formula: String.raw`T=R\tan\frac{I}{2} \qquad L_c=RI_{rad} \qquad E=R\left(\sec\frac{I}{2}-1\right)`,
    pages: [110],
    keywords: ["horizontal curve", "simple curve", "tangent", "degree of curve", "long chord", "external"],
    viz: "mat:hcurve",
    inputs: [
      { k: "R", label: "Radius", sym: "R", unit: "m", def: 280, step: 5 },
      { k: "I", label: "Intersection (central) angle", sym: "I", unit: "°", def: 42, step: 1 },
      { k: "staPI", label: "Station of PI", sym: "", unit: "m", def: 1250, step: 10 },
    ],
    run(v) {
      const { R, I, staPI } = v;
      const half = rad(I / 2);
      const T = R * Math.tan(half);
      const Lc = R * rad(I);
      const E = R * (1 / Math.cos(half) - 1);
      const M = R * (1 - Math.cos(half));
      const LC = 2 * R * Math.sin(half);
      const D = 1145.916 / R;              // arc definition, degree of curve
      const staPC = staPI - T;
      const staPT = staPC + Lc;

      return {
        results: [
          { label: "Tangent distance", sym: "T", value: T, unit: "m", hero: true, digits: 5 },
          { label: "Length of curve", sym: "L_c", value: Lc, unit: "m", digits: 5 },
          { label: "External distance", sym: "E", value: E, unit: "m", digits: 5 },
          { label: "Middle ordinate", sym: "M", value: M, unit: "m", digits: 5 },
          { label: "Long chord", sym: "LC", value: LC, unit: "m", digits: 5 },
          { label: "Degree of curve (arc)", sym: "D", value: D, unit: "°", digits: 4 },
          { label: "Station of PC", value: staPC, unit: "m", digits: 6 },
          { label: "Station of PT", value: staPT, unit: "m", digits: 6 },
        ],
        steps: [
          {
            title: "Tangent distance",
            tex: String.raw`T=R\tan\frac{I}{2}=(${N(R)})\tan\frac{${N(I)}^\circ}{2}=${N(T, 5)}\ \text{m}`,
          },
          {
            title: "Length of curve",
            tex: String.raw`L_c=RI_{rad}=(${N(R)})\left(${N(I)}^\circ\times\frac{\pi}{180}\right)=${N(Lc, 5)}\ \text{m}`,
          },
          {
            title: "External and middle ordinate",
            tex: String.raw`E=R\left(\sec\frac{I}{2}-1\right)=${N(E, 5)}\ \text{m} \qquad M=R\left(1-\cos\frac{I}{2}\right)=${N(M, 5)}\ \text{m}`,
            note: "E is measured from the PI to the curve; M from the long chord to the curve.",
          },
          {
            title: "Stations",
            tex: String.raw`\text{Sta}_{PC}=\text{Sta}_{PI}-T=${N(staPI)}-${N(T, 4)}=${N(staPC, 6)}` +
              String.raw`\\[4pt] \text{Sta}_{PT}=\text{Sta}_{PC}+L_c=${N(staPT, 6)}`,
          },
          {
            title: "Degree of curve",
            tex: String.raw`D=\frac{1145.916}{R}=\frac{1145.916}{${N(R)}}=${N(D, 4)}^\circ`,
            note: "Arc definition: a 100 m arc subtending D degrees. The chord definition uses 1718.9/R.",
          },
        ],
        viz: { R, I, T, Lc, E, M, staPI },
      };
    },
  }),

  /* --------------------------------------------------------------- 16 */
  mat({
    id: "mat-earthwork",
    group: "Surveying",
    title: "Earthwork Volume — End Area & Prismoidal",
    lede: "Volume between two cross-sections, the prismoidal correction, and the net answer.",
    formula: String.raw`V_E=\frac{L}{2}(A_1+A_2) \qquad V_P=\frac{L}{6}(A_1+4A_m+A_2)`,
    pages: [111],
    keywords: ["earthwork", "volume", "end area", "prismoidal", "cross section", "cut and fill"],
    viz: "mat:earthwork",
    inputs: [
      { k: "A1", label: "Area at station 1", sym: "A_1", unit: "m²", def: 12.5, step: 0.1 },
      { k: "A2", label: "Area at station 2", sym: "A_2", unit: "m²", def: 18.2, step: 0.1 },
      { k: "Am", label: "Area at mid-section", sym: "A_m", unit: "m²", def: 15.1, step: 0.1 },
      { k: "L", label: "Distance between sections", sym: "L", unit: "m", def: 20, step: 1 },
      { k: "C1", label: "Centroid distance, section 1", sym: "C_1", unit: "m", def: 3.2, step: 0.1 },
      { k: "C2", label: "Centroid distance, section 2", sym: "C_2", unit: "m", def: 3.8, step: 0.1 },
      { k: "d1", label: "Depth, section 1", sym: "d_1", unit: "m", def: 1.4, step: 0.1 },
      { k: "d2", label: "Depth, section 2", sym: "d_2", unit: "m", def: 1.9, step: 0.1 },
    ],
    run(v) {
      const { A1, A2, Am, L, C1, C2, d1, d2 } = v;
      const VE = (L / 2) * (A1 + A2);
      const VP = (L / 6) * (A1 + 4 * Am + A2);
      const Cp = (L / 12) * (C1 - C2) * (d1 - d2);
      const Vnet = VP - Cp;

      return {
        results: [
          { label: "Volume — end-area method", sym: "V_E", value: VE, unit: "m³", hero: true, digits: 6 },
          { label: "Volume — prismoidal formula", sym: "V_P", value: VP, unit: "m³", digits: 6 },
          { label: "Prismoidal correction", sym: "C_p", value: Cp, unit: "m³", digits: 6 },
          { label: "Corrected volume", value: Vnet, unit: "m³", digits: 6 },
          { label: "Difference end-area vs prismoidal", value: VE - VP, unit: "m³", digits: 6, note: "end-area always overestimates" },
        ],
        steps: [
          {
            title: "End-area method",
            tex: String.raw`V_E=\frac{L}{2}(A_1+A_2)=\frac{${N(L)}}{2}(${N(A1)}+${N(A2)})=${N(VE, 6)}\ \text{m}^3`,
          },
          {
            title: "Prismoidal formula",
            tex: String.raw`V_P=\frac{L}{6}(A_1+4A_m+A_2)=\frac{${N(L)}}{6}\left[${N(A1)}+4(${N(Am)})+${N(A2)}\right]=${N(VP, 6)}\ \text{m}^3`,
            note: "The prismoidal formula is exact for a prismoid — it needs the mid-section area.",
          },
          {
            title: "Prismoidal correction",
            tex: String.raw`C_p=\frac{L}{12}(C_1-C_2)(d_1-d_2)=\frac{${N(L)}}{12}(${N(C1)}-${N(C2)})(${N(d1)}-${N(d2)})=${N(Cp, 6)}\ \text{m}^3`,
            note: "The card's shortcut: correct the end-area volume directly instead of measuring a mid-section.",
          },
          {
            title: "Corrected volume",
            tex: String.raw`V=V_E-C_p=${N(VE, 6)}-${N(Cp, 6)}=${N(VE - Cp, 6)}\ \text{m}^3 \quad\approx\quad V_P=${N(VP, 6)}`,
          },
        ],
        viz: { A1, A2, L, d1, d2 },
      };
    },
  }),

  /* --------------------------------------------------------------- 17 */
  mat({
    id: "mat-area-rules",
    group: "Surveying",
    title: "Area by Offsets — Trapezoidal & Simpson's Rule",
    lede: "Five evenly spaced offsets: two rules, two answers, and the reason they differ.",
    formula: String.raw`A=d\left[\frac{h_1+h_n}{2}+\Sigma h_{mid}\right] \qquad A=\frac{d}{3}\left[h_1+h_n+4\Sigma h_{odd}+2\Sigma h_{even}\right]`,
    pages: [111],
    keywords: ["trapezoidal rule", "simpson rule", "area by offsets", "surveying"],
    inputs: [
      { k: "d", label: "Common interval", sym: "d", unit: "m", def: 10, step: 1 },
      { k: "h1", label: "Offset h₁", sym: "h_1", unit: "m", def: 2.0, step: 0.1 },
      { k: "h2", label: "Offset h₂", sym: "h_2", unit: "m", def: 3.4, step: 0.1 },
      { k: "h3", label: "Offset h₃", sym: "h_3", unit: "m", def: 4.1, step: 0.1 },
      { k: "h4", label: "Offset h₄", sym: "h_4", unit: "m", def: 3.7, step: 0.1 },
      { k: "h5", label: "Offset h₅", sym: "h_5", unit: "m", def: 2.6, step: 0.1 },
    ],
    run(v) {
      const { d, h1, h2, h3, h4, h5 } = v;
      const trap = d * ((h1 + h5) / 2 + h2 + h3 + h4);
      const simp = (d / 3) * (h1 + h5 + 4 * (h2 + h4) + 2 * h3);
      const n = 4;
      return {
        results: [
          { label: "Area — Simpson's 1/3 rule", value: simp, unit: "m²", hero: true, digits: 6 },
          { label: "Area — trapezoidal rule", value: trap, unit: "m²", digits: 6 },
          { label: "Difference", value: trap - simp, unit: "m²", digits: 6 },
          { label: "Number of intervals", sym: "n", value: n, note: "Simpson's 1/3 needs an even number of intervals" },
        ],
        steps: [
          {
            title: "Trapezoidal rule",
            tex: String.raw`A=d\left[\frac{h_1+h_n}{2}+\Sigma h_{mid}\right]=${N(d)}\left[\frac{${N(h1)}+${N(h5)}}{2}+${N(h2)}+${N(h3)}+${N(h4)}\right]=${N(trap, 6)}\ \text{m}^2`,
          },
          {
            title: "Simpson's 1/3 rule",
            tex: String.raw`A=\frac{d}{3}\left[h_1+h_5+4(h_2+h_4)+2h_3\right]=\frac{${N(d)}}{3}\left[${N(h1 + h5)}+4(${N(h2 + h4)})+2(${N(h3)})\right]=${N(simp, 6)}\ \text{m}^2`,
            note: "Simpson's rule fits a parabola through three consecutive points, so it is exact for curved boundaries; the trapezoidal rule joins points with straight lines and under-estimates a convex boundary.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 18 */
  mat({
    id: "mat-optimum",
    group: "Calculus",
    title: "Optimisation — Maximum Volume",
    lede: "The calculus shortcut the card tabulates: cut size for an open box, and the cylinder proportions that maximise volume.",
    formula: String.raw`V=(S-2x)^2x \;\Rightarrow\; x=\frac{S}{6}`,
    pages: [130],
    keywords: ["optimization", "maxima", "minima", "box", "cylinder", "derivative"],
    inputs: [
      { k: "S", label: "Side of the square sheet", sym: "S", unit: "cm", def: 30, step: 1 },
      { k: "mode", label: "Problem", type: "select", def: "box",
        options: [
          { value: "box", label: "Open box from a square sheet" },
          { value: "cyl", label: "Cylinder of given volume — min surface" },
          { value: "cone", label: "Cone from a circle — max volume" },
        ] },
      { k: "Vcyl", label: "Cylinder volume (if used)", sym: "V", unit: "cm³", def: 1000, step: 10 },
    ],
    run(v) {
      const { S, Vcyl } = v;
      const x = S / 6;
      const Vbox = Math.pow(S - 2 * x, 2) * x;
      const rClosed = Math.cbrt(Vcyl / (2 * Math.PI));
      const hClosed = 2 * rClosed;
      const rOpen = Math.cbrt(Vcyl / Math.PI);
      const hOpen = rOpen;
      const theta = Math.asin(1 / 3) * 180 / Math.PI;

      const map = {
        box: { label: "Cut size x", value: x, unit: "cm" },
        cyl: { label: "Radius for min surface (closed)", value: rClosed, unit: "cm" },
        cone: { label: "Cone half-angle θ", value: theta, unit: "°" },
      };
      const main = map[v.mode];

      return {
        results: [
          { label: main.label, value: main.value, unit: main.unit, hero: true, digits: 6 },
          { label: "Maximum box volume", value: Vbox, unit: "cm³", digits: 6 },
          { label: "Box base side", value: S - 2 * x, unit: "cm", digits: 5 },
          { label: "Box height", value: x, unit: "cm", digits: 5 },
          { label: "Closed cylinder: r / h", value: `${fmt(rClosed, 4)} / ${fmt(hClosed, 4)} cm`, note: "D = H for minimum surface" },
          { label: "Open cylinder: r / h", value: `${fmt(rOpen, 4)} / ${fmt(hOpen, 4)} cm`, note: "D = 2H for minimum surface" },
        ],
        steps: [
          {
            title: "Volume as a function of the cut",
            tex: String.raw`V(x)=(S-2x)^2x`,
          },
          {
            title: "Differentiate and set to zero",
            tex: String.raw`\frac{dV}{dx}=(S-2x)^2-4x(S-2x)=(S-2x)(S-6x)=0 \;\Rightarrow\; x=\frac{S}{6}=${N(x, 5)}\ \text{cm}`,
            note: "x = S/2 is the trivial minimum (zero volume); x = S/6 is the maximum.",
          },
          {
            title: "Maximum volume",
            tex: String.raw`V=\left(${N(S)}-2\times${N(x, 4)}\right)^2(${N(x, 4)})=${N(Vbox, 6)}\ \text{cm}^3`,
          },
          {
            title: "Cylinder and cone shortcuts",
            tex: String.raw`\text{closed: }D=H \qquad \text{open: }D=2H \qquad \text{cone from a circle: }\sin\theta=\frac{1}{3}`,
            note: "These are the card's tabulated results for minimum surface and maximum volume — no differentiation needed in the exam.",
          },
        ],
        viz: null,
      };
    },
  }),

  /* --------------------------------------------------------------- 19 */
  mat({
    id: "mat-physics",
    group: "Physics",
    title: "Gravitation, Coulomb & Waves",
    lede: "The four physics relations the card closes on, in one place.",
    formula: String.raw`F=\frac{Gm_1m_2}{r^2} \qquad F=\frac{kq_1q_2}{r^2} \qquad v=\lambda f \qquad dB=10\log\frac{I}{I_0}`,
    pages: [134],
    keywords: ["gravity", "coulomb", "wave", "frequency", "decibel", "sound"],
    inputs: [
      { k: "mode", label: "Relation", type: "select", def: "grav",
        options: [
          { value: "grav", label: "Universal gravitation" },
          { value: "coulomb", label: "Coulomb's law" },
          { value: "wave", label: "Wave velocity" },
          { value: "sound", label: "Sound intensity level" },
        ] },
      { k: "m1", label: "Mass 1", sym: "m_1", unit: "kg", def: 5.972e24, step: 1e22 },
      { k: "m2", label: "Mass 2", sym: "m_2", unit: "kg", def: 70, step: 1 },
      { k: "r", label: "Separation", sym: "r", unit: "m", def: 6.371e6, step: 1000 },
      { k: "q1", label: "Charge 1", sym: "q_1", unit: "C", def: 1e-6, step: 1e-7 },
      { k: "q2", label: "Charge 2", sym: "q_2", unit: "C", def: 1e-6, step: 1e-7 },
      { k: "lam", label: "Wavelength", sym: "λ", unit: "m", def: 0.75, step: 0.01 },
      { k: "f", label: "Frequency", sym: "f", unit: "Hz", def: 440, step: 1 },
      { k: "I", label: "Sound intensity", sym: "I", unit: "W/m²", def: 1e-6, step: 1e-7 },
    ],
    run(v) {
      const { m1, m2, r, q1, q2, lam, f, I } = v;
      const Gm = 6.674e-11, kc = 8.99e9;
      const Fg = (Gm * m1 * m2) / (r * r);
      const Fe = (kc * q1 * q2) / (r * r);
      const vw = lam * f;
      const dB = 10 * Math.log10(I / 1e-12);
      const T = 1 / f;

      const map = {
        grav: { label: "Gravitational force", value: Fg, unit: "N" },
        coulomb: { label: "Electrostatic force", value: Fe, unit: "N" },
        wave: { label: "Wave velocity", value: vw, unit: "m/s" },
        sound: { label: "Sound intensity level", value: dB, unit: "dB" },
      };
      const main = map[v.mode];

      return {
        results: [
          { label: main.label, value: main.value, unit: main.unit, hero: true, digits: 6 },
          { label: "Gravitational force", value: Fg, unit: "N", digits: 5 },
          { label: "Electrostatic force", value: Fe, unit: "N", digits: 5 },
          { label: "Wave velocity", value: vw, unit: "m/s", digits: 5 },
          { label: "Period", sym: "T", value: T, unit: "s", digits: 5 },
          { label: "Intensity level", value: dB, unit: "dB", digits: 5 },
          { label: "Acceleration due to gravity", value: (Gm * m1) / (r * r), unit: "m/s²", digits: 5 },
        ],
        steps: [
          {
            title: "Universal gravitation",
            tex: String.raw`F=\frac{Gm_1m_2}{r^2}=\frac{(6.674\times10^{-11})(${N(m1, 4)})(${N(m2, 4)})}{(${N(r, 4)})^2}=${N(Fg, 5)}\ \text{N}`,
          },
          {
            title: "Coulomb's law",
            tex: String.raw`F=\frac{kq_1q_2}{r^2}=\frac{(8.99\times10^9)(${N(q1, 4)})(${N(q2, 4)})}{(${N(r, 4)})^2}=${N(Fe, 5)}\ \text{N}`,
          },
          {
            title: "Wave relations",
            tex: String.raw`v=\lambda f=(${N(lam)})(${N(f)})=${N(vw, 5)}\ \text{m/s} \qquad T=\frac{1}{f}=${N(T, 5)}\ \text{s}`,
          },
          {
            title: "Sound intensity level",
            tex: String.raw`dB=10\log_{10}\frac{I}{I_0}=10\log_{10}\frac{${N(I, 4)}}{1\times10^{-12}}=${N(dB, 5)}\ \text{dB}`,
            note: "I₀ = 10⁻¹² W/m² is the threshold of hearing; every 10 dB is a tenfold increase in intensity.",
          },
        ],
        viz: null,
      };
    },
  }),
];
