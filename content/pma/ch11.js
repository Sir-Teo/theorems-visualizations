// Rudin, Principles of Mathematical Analysis — Chapter 11: The Lebesgue Theory
// Part 1: set functions and the construction of Lebesgue measure (11.1–11.10).
// Further parts: ch11-a2.js (measure spaces, measurable and simple functions), ch11-a3.js (the integral,
// monotone convergence), ch11-a4.js (Fatou, dominated convergence, Riemann vs Lebesgue, L² basics),
// ch11-a5.js (L², orthonormal systems, Riesz–Fischer, Parseval).

/** Error function (Abramowitz–Stegun 7.1.26, |error| < 1.5e-7). */
function erf(x) {
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
}
const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
const boxArea = (b) => (b[2] - b[0]) * (b[3] - b[1]);
const inBox = (b, x, y) => x > b[0] && x < b[2] && y > b[1] && y < b[3];

/**
 * Split the region {inside} of the breakpoint grid of `boxes` into pairwise disjoint boxes:
 * horizontal strips ('rows'), vertical strips ('cols') or single grid cells ('cells').
 */
function decompose(boxes, inside, how = 'rows') {
  const uniq = (a) => [...new Set(a)].sort((p, q) => p - q);
  const xs = uniq(boxes.flatMap((b) => [b[0], b[2]])), ys = uniq(boxes.flatMap((b) => [b[1], b[3]]));
  const nx = xs.length - 1, ny = ys.length - 1, out = [];
  const cell = (i, j) => xs[i + 1] - xs[i] > 1e-12 && ys[j + 1] - ys[j] > 1e-12 && inside((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2);
  if (how === 'cells') {
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) if (cell(i, j)) out.push([xs[i], ys[j], xs[i + 1], ys[j + 1]]);
    return out;
  }
  const rows = how === 'rows', A = rows ? ny : nx, B = rows ? nx : ny;
  for (let a = 0; a < A; a++) {
    let start = -1;
    for (let b = 0; b <= B; b++) {
      const on = b < B && (rows ? cell(b, a) : cell(a, b));
      if (on && start < 0) start = b;
      if (!on && start >= 0) { out.push(rows ? [xs[start], ys[a], xs[b], ys[a + 1]] : [xs[a], ys[start], xs[a + 1], ys[b]]); start = -1; }
    }
  }
  return out;
}

/** Stage-n construction of a Cantor-type set in [0,1]: kept closed intervals, removed open gaps [a,b,stage]. */
function cantorStages(n, fat) {
  let keep = [[0, 1]]; const gaps = [];
  for (let k = 1; k <= n; k++) {
    const next = [];
    for (const [a, b] of keep) {
      const L = fat ? Math.pow(4, -k) : (b - a) / 3, m = (a + b) / 2;
      gaps.push([m - L / 2, m + L / 2, k]); next.push([a, m - L / 2], [m + L / 2, b]);
    }
    keep = next;
  }
  return { keep, gaps };
}

/** A star-shaped blob in polar form about (cx, cy): radius R(θ), membership, polygon, exact area. */
function radialBlob(M, cx, cy, r, seed, wobble = 0.22) {
  const R0 = M.rng(seed), modes = [0, 1, 2, 3].map((k) => [R0.uniform(-1, 1) * wobble / (k + 1), R0.uniform(0, 2 * Math.PI), k + 2]);
  const R = (t) => r * (1 + modes.reduce((s, [a, ph, k]) => s + a * Math.cos(k * t + ph), 0));
  const inside = (x, y) => Math.hypot(x - cx, y - cy) < R(Math.atan2(y - cy, x - cx));
  const poly = M.range(240).map((i) => { const t = 2 * Math.PI * i / 240; return [cx + R(t) * Math.cos(t), cy + R(t) * Math.sin(t)]; });
  const area = M.integrate((t) => 0.5 * R(t) ** 2, 0, 2 * Math.PI, 2000);
  /** points on the boundary at spacing ≤ h */
  const boundary = (h) => { const out = []; const n = Math.ceil(2 * Math.PI * r * 1.6 / h) + 8; for (let i = 0; i < n; i++) { const t = 2 * Math.PI * i / n; out.push([cx + R(t) * Math.cos(t), cy + R(t) * Math.sin(t)]); } return out; };
  return { R, inside, poly, area, boundary };
}

/** Rationals of [0,1] ordered by denominator: 0, 1, 1/2, 1/3, 2/3, 1/4, 3/4, … (first K). */
function rationals01(K) {
  const out = [0, 1]; const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  for (let q = 2; out.length < K; q++) for (let p = 1; p < q && out.length < K; p++) if (gcd(p, q) === 1) out.push(p / q);
  return out.slice(0, K);
}

/** Merge open intervals [a,b] into a sorted disjoint list. */
function mergeIntervals(list) {
  const s = list.filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]); const out = [];
  for (const [a, b] of s) { if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b); else out.push([a, b]); }
  return out;
}

export default {
  book: 'pma',
  chapter: 11,
  title: 'The Lebesgue Theory',
  summary: String.raw`Rudin builds Lebesgue measure from the ground up: an additive, regular set function on finite unions of boxes is extended through an outer measure to the $\sigma$-ring of sets that elementary sets approximate in the metric $d(A,B)=\mu^*(A\,\triangle\,B)$, where it becomes countably additive. Measurable and simple functions then lead to the Lebesgue integral, the monotone and dominated convergence theorems and Fatou's lemma, and a sharp comparison with the Riemann integral: a bounded function is Riemann integrable exactly when it is continuous almost everywhere. The chapter closes with $L^2$ — its completeness, the Riesz–Fischer theorem and Parseval's identity for complete orthonormal systems.`,
  items: [
    // ------------------------------------------------------------------ set functions
    {
      num: '11.1',
      kind: 'Definition',
      name: 'Rings and σ-rings of sets',
      statement: String.raw`A family $\mathscr R$ of sets is a **ring** if $A\cup B\in\mathscr R$ and $A-B\in\mathscr R$ whenever $A\in\mathscr R$ and $B\in\mathscr R$. A ring is a **$\sigma$-ring** if, in addition, $\bigcup_{n=1}^\infty A_n\in\mathscr R$ for every sequence $\{A_n\}$ of members of $\mathscr R$.

Intersections come for free: $A\cap B=A-(A-B)$ lies in any ring, and $\bigcap_n A_n=A_1-\bigcup_n(A_1-A_n)$ lies in any $\sigma$-ring.`,
      idea: String.raw`A set function can only be manipulated on a family that is stable under the operations a proof performs. Finite unions and differences are enough for additivity; limit arguments need countable unions. The elementary sets of 11.4 (finite unions of boxes) form a ring but not a $\sigma$-ring — an open disc is a countable union of boxes and not a finite one — and closing that gap is what the construction of $\mathfrak M(\mu)$ in 11.9–11.10 achieves.`,
      caption: String.raw`Drag the four boxes ($A$ = two blue boxes, $B$ = two red boxes) and choose an operation: the green result always splits into finitely many disjoint boxes, so finite unions of boxes form a ring. "A countable union" fills the open unit disc with dyadic squares, level by level: every stage is a finite union of boxes, the union of all of them is the disc, which is not.`,
      deps: [],
      see: ['rca-1.3'],
      tags: ['set algebra', 'measure'],
      viz(v) {
        const op = v.select('', [
          { value: 'cup', label: '$A\\cup B$' },
          { value: 'minus', label: '$A-B$' },
          { value: 'cap', label: '$A\\cap B=A-(A-B)$' },
          { value: 'sigma', label: 'a countable union' },
        ], 'cup');
        const lev = v.slider('squares of side $2^{-j}$, $j\\le n$', 1, 7, 3, { int: true });
        const S = v.stage({ x: [0, 4], y: [0, 2.5], equal: true, height: 340, axes: false });
        const SIZE = [[1.3, 0.9], [0.8, 1.3], [1.2, 0.8], [0.7, 1.1]];
        const H = [[1.0, 0.95, 'blue'], [1.6, 1.5, 'blue'], [2.35, 1.05, 'red'], [2.95, 1.6, 'red']].map(([x, y, c]) => S.handle(x, y, { color: c, r: 6 }));
        const box = (i) => { const [w, h] = SIZE[i]; return [H[i].x - w / 2, H[i].y - h / 2, H[i].x + w / 2, H[i].y + h / 2]; };
        // Whitney-type dyadic squares inside the open unit disc, grouped by level
        const inDisc = (x0, y0, h) => Math.max(x0 * x0, (x0 + h) ** 2) + Math.max(y0 * y0, (y0 + h) ** 2) < 1 - 1e-12;
        const DISC = [];
        for (let j = 1; j <= 7; j++) {
          const h = Math.pow(2, -j), N = Math.pow(2, j), L = [];
          for (let i = -N; i < N; i++) for (let k = -N; k < N; k++) {
            if (!inDisc(i * h, k * h, h)) continue;
            if (j > 1 && inDisc(Math.floor(i / 2) * 2 * h, Math.floor(k / 2) * 2 * h, 2 * h)) continue;
            L.push([i * h, k * h, (i + 1) * h, (k + 1) * h]);
          }
          DISC.push(L);
        }
        const COLS = ['blue', 'teal', 'green', 'gold', 'orange', 'pink', 'purple'];
        let st = {};
        v.render(() => {
          const sig = op.value === 'sigma';
          lev.el.hidden = !sig; H.forEach((h) => { h.visible = !sig; });
          if (sig) {
            S.setView([-1.25, 1.25], [-1.1, 1.1]);
            let cnt = 0, area = 0;
            for (let j = 0; j < lev.value; j++) for (const b of DISC[j]) { S.rect(b[0], b[1], b[2], b[3], { fill: COLS[j], fillAlpha: 0.5, color: 'panel', width: j < 4 ? 1.2 : 0.6 }); cnt++; area += boxArea(b); }
            S.circle(0, 0, 1, { color: 'ink', width: 1.6, dash: [5, 4] });
            S.corner(`stage n = ${lev.value}: ${cnt} boxes`, 'tl', { color: 'ink', weight: 600 });
            v.legend([['ink', 'open unit disc $D$', { dash: true }], ['teal', 'dyadic squares inside $D$ (colour = level $j$)', { area: true }]]);
            st = { sig, cnt, area };
            return;
          }
          S.setView([0, 4], [0, 2.5]);
          const A = [box(0), box(1)], B = [box(2), box(3)];
          const inA = (x, y) => A.some((b) => inBox(b, x, y)), inB = (x, y) => B.some((b) => inBox(b, x, y));
          const pred = { cup: (x, y) => inA(x, y) || inB(x, y), minus: (x, y) => inA(x, y) && !inB(x, y), cap: (x, y) => inA(x, y) && inB(x, y) }[op.value];
          if (op.value === 'cap') for (const p of decompose([...A, ...B], (x, y) => inA(x, y) && !inB(x, y))) S.rect(p[0], p[1], p[2], p[3], { fill: 'orange', fillAlpha: 0.16, stroke: false });
          const pieces = decompose([...A, ...B], pred);
          pieces.forEach((p, i) => S.rect(p[0], p[1], p[2], p[3], { fill: 'green', fillAlpha: i % 2 ? 0.45 : 0.25, color: 'green', width: 1, alpha: 0.75 }));
          for (const b of A) S.rect(b[0], b[1], b[2], b[3], { color: 'blue', width: 2.2 });
          for (const b of B) S.rect(b[0], b[1], b[2], b[3], { color: 'red', width: 2.2, dash: [6, 4] });
          const a0 = A[0], b1 = B[1];
          S.tex('A', a0[0], a0[3], { color: 'blue', align: 'left', baseline: 'bottom', dx: 3, dy: -2 });
          S.tex('B', b1[2], b1[3], { color: 'red', align: 'right', baseline: 'bottom', dx: -3, dy: -2 });
          S.corner(`${pieces.length} disjoint boxes`, 'tl', { color: 'green', weight: 600 });
          const lg = [['blue', '$A$'], ['red', '$B$', { dash: true }], ['green', { cup: '$A\\cup B$', minus: '$A-B$', cap: '$A\\cap B$' }[op.value] + ' as disjoint boxes', { area: true }]];
          if (op.value === 'cap') lg.push(['orange', '$A-B$ (removed from $A$)', { area: true }]);
          v.legend(lg);
          st = { sig, n: pieces.length, area: pieces.reduce((s, b) => s + boxArea(b), 0) };
        });
        v.readout(() => {
          if (st.sig) return `${st.cnt} squares of total area $${v.fix(st.area, 4)}$, against $m(D)=\\pi\\approx3.1416$. Each stage is a finite union of boxes, but $D$ itself is not: the elementary sets form a ring, **not** a $\\sigma$-ring.`;
          const nm = { cup: 'A\\cup B', minus: 'A-B', cap: 'A\\cap B' }[op.value];
          return `$${nm}$ is the union of ${st.n} pairwise disjoint boxes (total area $${v.fix(st.area, 3)}$) — again a finite union of boxes, so it stays in the ring.`;
        });
      },
    },
    {
      num: '11.2',
      kind: 'Definition',
      name: 'Additive and countably additive set functions',
      statement: String.raw`A **set function** $\varphi$ on a ring $\mathscr R$ assigns to each $A\in\mathscr R$ a value $\varphi(A)$ in the extended reals (never taking both values $+\infty$ and $-\infty$, and not identically $\pm\infty$). It is **additive** if $\varphi(A\cup B)=\varphi(A)+\varphi(B)$ whenever $A\cap B=\emptyset$, and **countably additive** if
$$\varphi\Big(\bigcup_{n=1}^\infty A_n\Big)=\sum_{n=1}^\infty\varphi(A_n)$$
whenever the $A_n$ are pairwise disjoint and their union is again in $\mathscr R$.

An additive $\varphi$ satisfies $\varphi(\emptyset)=0$, $\varphi(A\cup B)+\varphi(A\cap B)=\varphi(A)+\varphi(B)$, and $\varphi(A-B)=\varphi(A)-\varphi(B)$ when $B\subset A$ and $|\varphi(B)|<\infty$; if moreover $\varphi\ge0$, then $A\subset B$ implies $\varphi(A)\le\varphi(B)$.`,
      idea: String.raw`All the listed identities come from cutting sets into disjoint pieces: $A\cup B=(A-B)\cup(A\cap B)\cup(B-A)$ and $A=(A-B)\cup(A\cap B)$. Since the left side of the countable additivity equation does not depend on the order of the $A_n$, the series on the right must converge regardless of order — hence absolutely, by the rearrangement theorem (3.55).`,
      caption: String.raw`Here $\varphi(E)$ is the mass a density $w$ puts on a box $E$ (blue = positive mass, red = negative). Drag the corners of the boxes $A$ and $B$. The right panel stacks $\varphi(A)+\varphi(B)$ and $\varphi(A\cup B)+\varphi(A\cap B)$, with $\varphi(A\cup B)$ computed honestly as a sum over disjoint pieces: the two totals always agree. With a signed density, enlarging a set can decrease $\varphi$.`,
      deps: ['pma-11.1', 'pma-1.23', 'pma-3.55'],
      see: ['rca-1.18'],
      tags: ['measure', 'set functions'],
      viz(v) {
        const mode = v.select('', [{ value: 'pos', label: 'nonnegative $\\varphi$' }, { value: 'signed', label: 'signed $\\varphi$' }], 'pos');
        const L = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 330, axes: false, weight: 1.25, title: 'density $w$; $\\;\\varphi(E)=\\iint_E w$' });
        const R = v.stage({ x: [0, 3], y: [0, 1], height: 330, axes: 'box', weight: 1, minWidth: 230, xticks: [[0.85, 'φ(A)+φ(B)'], [2.15, 'φ(A∪B)+φ(A∩B)']], title: 'additivity, checked' });
        const BUMPS = {
          pos: [[0.3, 0.36, 0.11, 0.42], [0.72, 0.7, 0.12, 0.38], [0.52, 0.14, 0.09, 0.2]],
          signed: [[0.3, 0.36, 0.11, 0.55], [0.72, 0.7, 0.12, -0.5], [0.52, 0.14, 0.09, 0.3]],
        };
        const phi = (b) => {
          if (!b || b[2] <= b[0] || b[3] <= b[1]) return 0;
          let s = 0; for (const [cx, cy, sg, m] of BUMPS[mode.value]) s += m * (Phi((b[2] - cx) / sg) - Phi((b[0] - cx) / sg)) * (Phi((b[3] - cy) / sg) - Phi((b[1] - cy) / sg));
          return s;
        };
        const w = (x, y) => { let s = 0; for (const [cx, cy, sg, m] of BUMPS[mode.value]) s += m / (2 * Math.PI * sg * sg) * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * sg * sg)); return s; };
        const a1 = L.handle(0.12, 0.18, { color: 'blue', r: 6 }), a2 = L.handle(0.58, 0.6, { color: 'blue', r: 6 });
        const b1 = L.handle(0.42, 0.44, { color: 'red', r: 6 }), b2 = L.handle(0.9, 0.9, { color: 'red', r: 6 });
        const rectOf = (p, q) => [Math.min(p.x, q.x), Math.min(p.y, q.y), Math.max(p.x, q.x), Math.max(p.y, q.y)];
        v.legend([['blue', '$\\varphi(A)$'], ['red', '$\\varphi(B)$'], ['green', '$\\varphi(A\\cup B)$, summed over disjoint pieces'], ['purple', '$\\varphi(A\\cap B)$']]);
        let st = {};
        v.render(() => {
          const A = rectOf(a1, a2), B = rectOf(b1, b2);
          const pc = v.rgb('accent'), nc = v.rgb('red');
          L.raster((x, y) => { const z = w(x, y), t = Math.min(1, Math.abs(z) / 7); if (t < 0.001) return null; const c = z > 0 ? pc : nc; return [c[0], c[1], c[2], Math.round(255 * 0.6 * Math.sqrt(t))]; }, { key: mode.value + v.color('accent') + v.color('red'), res: 3 });
          const inA = (x, y) => inBox(A, x, y), inB = (x, y) => inBox(B, x, y);
          const uni = decompose([A, B], (x, y) => inA(x, y) || inB(x, y));
          const dif = decompose([A, B], (x, y) => inA(x, y) && !inB(x, y));
          const I = [Math.max(A[0], B[0]), Math.max(A[1], B[1]), Math.min(A[2], B[2]), Math.min(A[3], B[3])];
          const pA = phi(A), pB = phi(B), pI = phi(I), pU = uni.reduce((s, b) => s + phi(b), 0), pD = dif.reduce((s, b) => s + phi(b), 0);
          for (const p of uni) L.rect(p[0], p[1], p[2], p[3], { color: 'green', width: 0.8, alpha: 0.6 });
          if (I[2] > I[0] && I[3] > I[1]) L.rect(I[0], I[1], I[2], I[3], { fill: 'purple', fillAlpha: 0.14, stroke: false });
          L.rect(A[0], A[1], A[2], A[3], { color: 'blue', width: 2.2 });
          L.rect(B[0], B[1], B[2], B[3], { color: 'red', width: 2.2, dash: [6, 4] });
          L.tex('A', A[0], A[3], { color: 'blue', align: 'left', baseline: 'bottom', dx: 3, dy: -2 });
          L.tex('B', B[2], B[1], { color: 'red', align: 'right', baseline: 'top', dx: -3, dy: 3 });
          // right: waterfall bars
          const lo = Math.min(0, pA, pA + pB, pU, pU + pI), hi = Math.max(0.25, pA, pA + pB, pU, pU + pI);
          R.setView(null, [lo - 0.08 - (lo < 0 ? 0.05 : 0), hi + 0.12]);
          const bar = (x, y0, y1, col) => R.rect(x - 0.2, y0, x + 0.2, y1, { fill: col, fillAlpha: 0.72, stroke: false });
          bar(0.6, 0, pA, 'blue'); bar(1.1, pA, pA + pB, 'red'); bar(1.9, 0, pU, 'green'); bar(2.4, pU, pU + pI, 'purple');
          R.line(0.3, pA + pB, 2.7, pA + pB, { color: 'ink', dash: [5, 4], width: 1.3 });
          R.line(0, 0, 3, 0, { color: 'muted', width: 1 });
          R.text(v.fmt(pA + pB, 3), 1.5, pA + pB, { dy: -9, align: 'center', size: 11.5, color: 'ink' });
          st = { pA, pB, pI, pU, pD };
        });
        v.readout(() => {
          const { pA, pB, pI, pU, pD } = st; if (pA == null) return '';
          let t = `$\\varphi(A)+\\varphi(B)=${v.fix(pA + pB, 4)}$ and $\\varphi(A\\cup B)+\\varphi(A\\cap B)=${v.fix(pU + pI, 4)}$; $\\;\\varphi(A-B)=${v.fix(pD, 4)}=\\varphi(A)-\\varphi(A\\cap B)$. `;
          if (pU < pA - 1e-4) t += `Here $A\\subset A\\cup B$ yet $\\varphi(A\\cup B)=${v.fix(pU, 3)}<\\varphi(A)$: monotonicity needs $\\varphi\\ge0$.`;
          else if (mode.value === 'pos') t += 'Since $\\varphi\\ge0$, also $\\varphi(A\\cap B)\\le\\varphi(A)\\le\\varphi(A\\cup B)$.';
          else t += 'Move $B$ over the red mass to see monotonicity fail.';
          return t;
        });
      },
    },
    {
      num: '11.3',
      kind: 'Theorem',
      name: 'Countably additive set functions are continuous from below',
      statement: String.raw`Let $\varphi$ be countably additive on a ring $\mathscr R$. If $A_1\subset A_2\subset A_3\subset\cdots$ are sets in $\mathscr R$ whose union $A$ also belongs to $\mathscr R$, then $\varphi(A_n)\to\varphi(A)$ as $n\to\infty$.`,
      idea: String.raw`Peel the increasing sequence into disjoint rings: $B_1=A_1$ and $B_n=A_n-A_{n-1}$. Then $A_n=B_1\cup\dots\cup B_n$ and $A=\bigcup B_n$, so additivity gives $\varphi(A_n)=\sum_{k\le n}\varphi(B_k)$ while countable additivity gives $\varphi(A)=\sum_{k=1}^\infty\varphi(B_k)$ — the partial sums of a convergent series converge to its sum.`,
      caption: String.raw`Top: the distribution function of the set function, the increasing sets $A_n$ on the axis and the pieces $B_k$ in alternating colours; the rise over each $B_k$ is $\varphi(B_k)$, stacked on the right. For the Lebesgue–Stieltjes $\mu_\alpha$ the stack climbs to $\varphi(A)$ — and $A=[0,1)$ correctly omits the jump of $\alpha$ at $1$. The second set function (Rudin's Exercise 15) is additive but hides a unit of mass "at $0^+$" that no $B_k$ contains: $\varphi(A_n)\to1\neq2=\varphi(A)$.`,
      deps: ['pma-11.2'],
      see: ['rca-1.19'],
      tags: ['measure', 'limits'],
      viz(v) {
        const mode = v.select('', [{ value: 'mu', label: '$\\mu_\\alpha$ (countably additive)' }, { value: 'phi', label: '$\\varphi$ of Exercise 15 (only additive)' }], 'mu');
        const nS = v.slider('$n$', 1, 12, 4, { int: true });
        const T = v.stage({ x: [-0.08, 1.2], y: [-0.22, 1.12], height: 300, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0.5, 1, 1.5, 2] });
        const Bt = v.stage({ x: [0.3, 12.7], y: [-0.16, 1.1], height: 170, full: true, axes: 'box', xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], yticks: [0.5, 1, 1.5, 2], title: '$\\varphi(A_n)$ against $n$' });
        const alpha = (x) => (x < 0 ? 0 : 0.15 + 0.5 * x + (x >= 0.5 ? 0.2 : 0) + (x >= 1 ? 0.15 : 0));
        const KC = ['blue', 'teal'];
        let st = {};
        v.render(() => {
          const mu = mode.value === 'mu', n = nS.value;
          // pieces B_k = A_k − A_{k−1} and the values φ(A_k)
          const B = [], val = [];
          for (let k = 1; k <= 12; k++) {
            if (mu) { const b = 1 - Math.pow(2, -k), a = k === 1 ? 0 : 1 - Math.pow(2, 1 - k); B.push([a, b]); val.push(alpha(b)); }
            else { const a = Math.pow(2, -k), b = k === 1 ? 1 : Math.pow(2, 1 - k); B.push([a, b]); val.push(1 - Math.pow(2, -k)); }
          }
          const target = mu ? 0.85 : 2;
          T.setView(null, mu ? [-0.22, 1.12] : [-0.4, 2.2]);
          Bt.setView(null, mu ? [-0.16, 1.1] : [-0.32, 2.2]);
          if (mu) {
            for (const [a, b] of [[-0.08, 0], [0, 0.5], [0.5, 1], [1, 1.2]]) T.fn(alpha, { domain: [a, b - 1e-9], color: 'ink', width: 2 });
            for (const [x, lo, hi] of [[0, 0, 0.15], [0.5, 0.4, 0.6], [1, 0.85, 1]]) { T.dot(x, lo, { hollow: true, r: 3.5, color: 'ink' }); T.dot(x, hi, { r: 3.5, color: 'ink' }); }
            T.line(-0.08, 1, 1.2, 1, { color: 'muted', dash: [2, 4], width: 1 });
            T.text('φ([0,1]) = 1', 0.3, 1, { dy: -9, size: 11, color: 'muted' });
          } else {
            T.fn((x) => 1 + x, { domain: [1e-6, 1], color: 'ink', width: 2 });
            T.line(-0.08, 0, 0, 0, { color: 'ink', width: 2 });
            T.dot(0, 0, { r: 3.5, color: 'ink' }); T.dot(0, 1, { hollow: true, r: 3.5, color: 'ink' });
            T.arrow(0.035, 0.05, 0.035, 0.95, { color: 'red', width: 1.6, head: 7 });
            T.tex('\\text{unit of mass at }0^+\\text{, in no }B_k', 0.06, 0.55, { color: 'red', align: 'left', size: 13 });
          }
          // pieces on the axis and the stacked rises
          const y0 = mu ? -0.06 : -0.11, xs = 1.11;
          let prev = mu ? 0 : 0;
          for (let k = 0; k < n; k++) {
            const [a, b] = B[k], c = KC[k % 2];
            T.line(a, y0, b, y0, { color: c, width: 6, cap: 'butt' });
            const top = mu ? val[k] : val[k];
            T.line(xs, prev, xs, top, { color: c, width: 9, cap: 'butt' });
            if (mu) T.line(b, top, xs - 0.02, top, { color: c, width: 1, dash: [2, 3], alpha: 0.7 });
            prev = top;
          }
          T.line(-0.08, target, 1.2, target, { color: mu ? 'green' : 'red', dash: [6, 4], width: 1.4 });
          T.tex('\\sum_{k\\le n}\\varphi(B_k)', xs - 0.02, prev * 0.35, { color: 'gold', align: 'right', size: 13 });
          T.text(mu ? 'φ(A) = φ([0,1)) = 0.85' : 'φ(A) = φ((0,1]) = 2', 0.62, target, { dy: -9, size: 11.5, color: mu ? 'green' : 'red', weight: 600 });
          T.tex(`A_{${n}}`, mu ? 0.01 : B[n - 1][0] + 0.01, y0, { color: 'blue', align: 'left', baseline: 'bottom', dy: -4, size: 13 });
          // bottom: φ(A_n)
          Bt.bars(val, { color: (x, i) => (i < n ? 'gold' : 'faint'), barWidth: 0.6 });
          Bt.hline(target, { color: mu ? 'green' : 'red', dash: [6, 4], width: 1.4 });
          v.legend([['ink', mu ? 'distribution function $\\alpha$' : '$x\\mapsto\\varphi((0,x])$'], ['blue', 'pieces $B_k=A_k-A_{k-1}$, alternating colours', { area: true }], ['gold', '$\\varphi(A_n)=\\sum_{k\\le n}\\varphi(B_k)$', { area: true }]]);
          st = { mu, n, val: val[n - 1], target };
        });
        v.readout(() => {
          const s = st; if (s.val == null) return '';
          return s.mu
            ? `$\\varphi(A_${s.n})=${v.fix(s.val, 4)}$, increasing to $\\varphi(A)=0.85$ (gap $${v.sci(s.target - s.val, 2)}$). The sets $A_n=[0,1-2^{-n}]$ exhaust $A=[0,1)$, whose measure leaves out the jump of $\\alpha$ at $1$.`
            : `$\\varphi(A_${s.n})=1-2^{-${s.n}}=${v.fix(s.val, 4)}\\to1$, but $\\varphi\\big(\\bigcup A_n\\big)=\\varphi((0,1])=2$. Additivity holds, countable additivity fails, and so does the conclusion of 11.3.`;
        });
      },
    },
    // ------------------------------------------------------------------ construction of Lebesgue measure
    {
      num: '11.4',
      kind: 'Definition',
      name: 'Intervals, elementary sets and their measure m',
      statement: String.raw`An **interval** in $\R^p$ is a set of points $\mathbf x=(x_1,\dots,x_p)$ with $a_i\le x_i\le b_i$ for each $i$, where any of the inequalities may be strict (the case $a_i=b_i$, and hence $\emptyset$, is allowed). Its measure is $m(I)=\prod_{i=1}^p(b_i-a_i)$, whichever inequalities are strict. A finite union of intervals is an **elementary set**; $\mathscr E$ denotes the family of elementary subsets of $\R^p$. If $A=I_1\cup\dots\cup I_n$ with pairwise disjoint intervals, put $m(A)=m(I_1)+\dots+m(I_n)$.

One checks that $\mathscr E$ is a ring but not a $\sigma$-ring, that every $A\in\mathscr E$ is a finite disjoint union of intervals, that $m(A)$ does not depend on the decomposition chosen, and that $m$ is additive on $\mathscr E$.`,
      idea: String.raw`Take all the coordinates at which some interval begins or ends. They cut $\R^p$ into a grid, and every elementary set is a union of grid cells (up to boundary pieces of measure $0$). Any two disjoint decompositions of $A$ have a common refinement by such a grid, and on a grid the product formula for $m$ is additive cell by cell — that is why every decomposition gives the same $m(A)$.`,
      caption: String.raw`Drag the corners of the three dashed intervals $I_1,I_2,I_3$. Their union $A$ is decomposed into disjoint intervals in three different ways (choose above); the readout shows that all three give the same $m(A)$, while $\sum m(I_k)$ overcounts the overlaps.`,
      deps: ['pma-11.1', 'pma-11.2', 'pma-2.17'],
      see: ['rca-2.19'],
      tags: ['measure', 'elementary sets'],
      viz(v) {
        const how = v.select('disjoint decomposition', [{ value: 'rows', label: 'horizontal strips' }, { value: 'cols', label: 'vertical strips' }, { value: 'cells', label: 'grid cells' }], 'rows');
        const S = v.stage({ x: [0, 3.2], y: [0, 2.2], equal: true, height: 340, axes: false, grid: true });
        const INIT = [[0.25, 0.35, 1.45, 1.3, 'blue'], [0.95, 0.85, 2.15, 1.95, 'teal'], [1.75, 0.2, 2.9, 1.15, 'purple']];
        const HS = INIT.map(([x0, y0, x1, y1, c]) => [S.handle(x0, y0, { color: c, r: 6 }), S.handle(x1, y1, { color: c, r: 6 })]);
        v.legend([['orange', 'disjoint intervals whose union is $A$', { area: true }], ['blue', 'the given intervals $I_1,I_2,I_3$', { dash: true }]]);
        let st = {};
        v.render(() => {
          const boxes = HS.map(([p, q]) => [Math.min(p.x, q.x), Math.min(p.y, q.y), Math.max(p.x, q.x), Math.max(p.y, q.y)]);
          const inU = (x, y) => boxes.some((b) => inBox(b, x, y));
          const D = { rows: decompose(boxes, inU, 'rows'), cols: decompose(boxes, inU, 'cols'), cells: decompose(boxes, inU, 'cells') };
          const P = D[how.value];
          P.forEach((b, i) => S.rect(b[0], b[1], b[2], b[3], { fill: i % 2 ? 'orange' : 'gold', fillAlpha: 0.4, color: 'orange', width: 1.1 }));
          boxes.forEach((b, i) => {
            S.rect(b[0], b[1], b[2], b[3], { color: INIT[i][4], width: 2, dash: [6, 4] });
            S.tex(`I_${i + 1}`, b[0], b[3], { color: INIT[i][4], align: 'left', baseline: 'bottom', dx: 3, dy: -1, size: 14 });
          });
          const m = (L) => L.reduce((s, b) => s + boxArea(b), 0);
          st = { k: P.length, m: m(P), rows: m(D.rows), cols: m(D.cols), cells: m(D.cells), naive: boxes.reduce((s, b) => s + boxArea(b), 0), kr: D.rows.length, kc: D.cols.length, kg: D.cells.length };
          S.corner(`${P.length} disjoint pieces, m(A) = ${v.fix(st.m, 4)}`, 'tl', { color: 'orange', weight: 600 });
        });
        v.readout(() => {
          const s = st; if (s.m == null) return '';
          return `Horizontal strips (${s.kr} pieces): $${v.fix(s.rows, 4)}$; vertical strips (${s.kc}): $${v.fix(s.cols, 4)}$; grid cells (${s.kg}): $${v.fix(s.cells, 4)}$ — one value of $m(A)$. By contrast $\\sum_k m(I_k)=${v.fix(s.naive, 4)}$ counts the overlaps twice.`;
        });
      },
    },
    {
      num: '11.5',
      kind: 'Definition',
      name: 'Regular set functions',
      statement: String.raw`A nonnegative additive set function $\varphi$ on $\mathscr E$ is **regular** if for every $A\in\mathscr E$ and every $\eps>0$ there are sets $F,G\in\mathscr E$ with $F$ closed, $G$ open, $F\subset A\subset G$, and
$$\varphi(G)-\eps\le\varphi(A)\le\varphi(F)+\eps.$$
Lebesgue measure $m$ on $\mathscr E$ is regular, and so is the set function $\mu_\alpha$ of an increasing function $\alpha$ on $\R$, defined on intervals by $\mu_\alpha([a,b))=\alpha(b-)-\alpha(a-)$, $\mu_\alpha([a,b])=\alpha(b+)-\alpha(a-)$, $\mu_\alpha((a,b])=\alpha(b+)-\alpha(a+)$, $\mu_\alpha((a,b))=\alpha(b-)-\alpha(a+)$.`,
      idea: String.raw`Regularity says $\varphi$ is pinned down by compact sets from inside and open sets from outside. It is exactly what makes the outer measure of 11.7 agree with $\varphi$ on $\mathscr E$ (11.8): open covers can be compared with $\varphi(G)$, and a closed $F$ is compact, so a cover of $F$ has a finite subcover. For $\mu_\alpha$ the one-sided limits of $\alpha$ make each endpoint count its jump exactly when the endpoint belongs to the interval, so shrinking or enlarging slightly changes $\mu_\alpha$ only a little.`,
      caption: String.raw`Drag the endpoints $a,b$ and choose which ends belong to $A$. The graph is an increasing $\alpha$ with two jumps; the rows show the largest admissible closed $F\subset A$ (green) and open $G\supset A$ (orange) for the given $\eps$, and the bars on the right compare $\mu_\alpha(F)\le\mu_\alpha(A)\le\mu_\alpha(G)$ with the $\eps$-band. The second set function is additive but not regular: on $A=(0,b]$ it carries an extra unit at $0^+$ that no closed subset can see.`,
      deps: ['pma-11.4', 'pma-4.29'],
      see: ['rca-2.15'],
      tags: ['measure', 'regularity'],
      viz(v) {
        const meas = v.select('', [{ value: 'mu', label: '$\\mu_\\alpha$ (regular)' }, { value: 'phi', label: '$\\varphi$ of Exercise 15 (not regular)' }], 'mu');
        const kind = v.select('$A=$', ['[a,b]', '[a,b)', '(a,b]', '(a,b)'].map((s) => ({ value: s, label: `$${s}$` })), '[a,b)');
        const eps = v.slider('$\\varepsilon$', 0.02, 0.3, 0.06, { step: 0.01 });
        const S = v.stage({ x: [-0.04, 1.08], y: [-0.36, 1.18], height: 360, axes: false, weight: 2.4 });
        const R = v.stage({ x: [0, 3], y: [-0.13, 1.2], height: 360, axes: 'box', weight: 1, minWidth: 150, xticks: [[0.5, 'F'], [1.5, 'A'], [2.5, 'G']], yticks: [0, 0.5, 1, 1.5, 2], title: 'values' });
        const ROW = { G: -0.06, A: -0.13, F: -0.2, H: -0.29 };
        const ha = S.handle(0.3, ROW.H, { color: 'blue', label: 'a', labelPos: 'e', constrain: (x) => [v.M.clamp(x, 0.02, 0.98), ROW.H] });
        const hb = S.handle(0.56, ROW.H, { color: 'blue', label: 'b', labelPos: 'e', constrain: (x) => [v.M.clamp(x, 0.02, 0.98), ROW.H] });
        const J = [[0.3, 0.15], [0.62, 0.15]];
        const alpha = (x) => 0.7 * x + (x >= 0.3 ? 0.15 : 0) + (x > 0.62 ? 0.15 : 0); // right-continuous at 0.3, left-continuous at 0.62
        const am = (x) => 0.7 * x + J.reduce((s, [p, h]) => s + (x > p ? h : 0), 0);
        const ap = (x) => 0.7 * x + J.reduce((s, [p, h]) => s + (x >= p ? h : 0), 0);
        const muI = (l, r, lo, ro) => (r < l || (r === l && (lo || ro)) ? 0 : (ro ? am(r) : ap(r)) - (lo ? ap(l) : am(l)));
        const ivs = (l, r, lo, ro) => `${lo ? '(' : '['}${v.fix(l, 3)},\\,${v.fix(r, 3)}${ro ? ')' : ']'}`;
        let st = {};
        v.render(() => {
          const mu = meas.value === 'mu', e = eps.value;
          kind.el.hidden = !mu; ha.visible = mu;
          S.setView(null, mu ? [-0.36, 1.18] : [-0.5, 2.1]);
          R.setView(null, mu ? [-0.13, 1.2] : [-0.25, 2.2]);
          if (mu) S.line(ha.x, ROW.H, ha.x, ROW.G + 0.03, { color: 'blue', width: 1, dash: [2, 3], alpha: 0.6 });
          S.line(hb.x, ROW.H, hb.x, ROW.G + 0.03, { color: 'blue', width: 1, dash: [2, 3], alpha: 0.6 });
          let a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x);
          if (mu) {
            for (const [p, q] of [[0, 0.3], [0.3, 0.62], [0.62, 1]]) S.fn(alpha, { domain: [p + 1e-9, q - 1e-9], color: 'ink', width: 2 });
            for (const [p] of J) { S.dot(p, alpha(p), { r: 3.5, color: 'ink' }); S.dot(p, alpha(p) === am(p) ? ap(p) : am(p), { r: 3.5, hollow: true, color: 'ink' }); }
            S.tex('\\alpha', 0.96, alpha(0.96), { color: 'ink', dx: -10, dy: -12 });
            const lo = kind.value[0] === '(', ro = kind.value[4] === ')';
            const muA = muI(a, b, lo, ro);
            const dmax = Math.max(1e-4, Math.min(0.3, (b - a) / 2 - 1e-6));
            let dF = 0, dG = 0;
            if (lo || ro) { for (let i = 800; i >= 1; i--) { const d = dmax * i / 800; if (muI(a + (lo ? d : 0), b - (ro ? d : 0), false, false) >= muA - e) { dF = d; break; } } }
            if (!lo || !ro) { for (let i = 800; i >= 1; i--) { const d = 0.3 * i / 800; if (muI(a - (lo ? 0 : d), b + (ro ? 0 : d), true, true) <= muA + e) { dG = d; break; } } }
            const F = [a + (lo ? dF : 0), b - (ro ? dF : 0)], G = [a - (lo ? 0 : dG), b + (ro ? 0 : dG)];
            const muF = muI(F[0], F[1], false, false), muG = muI(G[0], G[1], true, true);
            S.interval(G[0], G[1], ROW.G, { color: 'orange', open: [true, true], width: 4, r: 3.5 });
            S.interval(a, b, ROW.A, { color: 'blue', open: [lo, ro], width: 4, r: 3.5 });
            S.interval(F[0], F[1], ROW.F, { color: 'green', width: 4, r: 3.5 });
            S.tex('G', 1.03, ROW.G, { color: 'orange', size: 14 }); S.tex('A', 1.03, ROW.A, { color: 'blue', size: 14 }); S.tex('F', 1.03, ROW.F, { color: 'green', size: 14 });
            for (const [p] of J) S.vline(p, { color: 'muted', dash: [2, 4], width: 1 });
            st = { mu, muA, muF, muG, F, G, lo, ro, a, b };
          } else {
            a = 0;
            S.fn((x) => 1 + x, { domain: [1e-6, 1], color: 'ink', width: 2 });
            S.dot(0, 0, { r: 3.5, color: 'ink' }); S.dot(0, 1, { r: 3.5, hollow: true, color: 'ink' });
            S.tex('x\\mapsto\\varphi((0,x])', 0.55, 1.55, { color: 'ink', align: 'right', size: 14, dy: -14 });
            const muA = 1 + b, eta = Math.min(0.02, b / 4), muF = b - eta, dG = Math.min(0.3, 0.98 - b, e * 0.999), muG = 1 + b + dG;
            S.interval(0, b + dG, ROW.G, { color: 'orange', open: [true, true], width: 4, r: 3.5 });
            S.interval(0, b, ROW.A, { color: 'blue', open: [true, false], width: 4, r: 3.5 });
            S.interval(eta, b, ROW.F, { color: 'red', width: 4, r: 3.5 });
            S.tex('G', 1.03, ROW.G, { color: 'orange', size: 14 }); S.tex('A', 1.03, ROW.A, { color: 'blue', size: 14 }); S.tex('F', 1.03, ROW.F, { color: 'red', size: 14 });
            st = { mu, muA, muF, muG, b };
          }
          const s = st;
          R.hband(s.muA - e, s.muA + e, { color: 'blue', alpha: 0.12, edges: true });
          R.rect(0.25, 0, 0.75, s.muF, { fill: mu ? 'green' : 'red', fillAlpha: 0.7, stroke: false });
          R.rect(1.25, 0, 1.75, s.muA, { fill: 'blue', fillAlpha: 0.7, stroke: false });
          R.rect(2.25, 0, 2.75, s.muG, { fill: 'orange', fillAlpha: 0.7, stroke: false });
          const ok = s.muF >= s.muA - e - 1e-12;
          R.corner(ok ? 'F and G exist' : 'no closed F works', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          v.legend([['ink', mu ? 'increasing $\\alpha$ with two jumps' : 'distribution of $\\varphi$'], ['orange', 'open $G\\supset A$', { area: true }], ['blue', '$A$', { area: true }], [mu ? 'green' : 'red', 'closed $F\\subset A$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (s.muA == null) return '';
          if (s.mu) return `$\\mu_\\alpha(A)=${v.fix(s.muA, 4)}$. Closed $F=${ivs(s.F[0], s.F[1], false, false)}$ gives $\\mu_\\alpha(F)=${v.fix(s.muF, 4)}\\ge\\mu_\\alpha(A)-\\varepsilon$; open $G=${ivs(s.G[0], s.G[1], true, true)}$ gives $\\mu_\\alpha(G)=${v.fix(s.muG, 4)}\\le\\mu_\\alpha(A)+\\varepsilon$. A jump of $\\alpha$ at an endpoint counts exactly when the endpoint lies in the interval.`;
          return `$\\varphi(A)=\\varphi((0,${v.fix(s.b, 3)}])=${v.fix(s.muA, 3)}$, but every closed elementary $F\\subset A$ stays away from $0$ and has $\\varphi(F)\\le${v.fix(s.b, 3)}$: the inequality $\\varphi(A)\\le\\varphi(F)+\\varepsilon$ fails for every $\\varepsilon<1$.`;
        });
      },
    },
    {
      num: '11.7',
      kind: 'Definition',
      name: 'Outer measure',
      statement: String.raw`Let $\mu$ be additive, regular, nonnegative and finite on $\mathscr E$. For any $E\subset\R^p$ put
$$\mu^*(E)=\inf\sum_{n=1}^\infty\mu(A_n),$$
the infimum over all countable covers $E\subset\bigcup_n A_n$ of $E$ by **open** elementary sets $A_n$. This is the **outer measure** of $E$ corresponding to $\mu$. Clearly $\mu^*(E)\ge0$, and $E_1\subset E_2$ implies $\mu^*(E_1)\le\mu^*(E_2)$.`,
      idea: String.raw`Every subset of $\R^p$ gets a size — at the price of additivity. Countable covers are what make the definition strong: a countable set is covered by boxes of total size $\eps\sum2^{-k}=\eps$, so it has outer measure $0$, while a "fat" set forces every cover to be at least as large as the set. Openness of the $A_n$ is what will let compactness enter in 11.8.`,
      caption: String.raw`Cover a set by countably many open boxes and add up their areas. For the blob, the boxes are the dyadic squares of level $n$ that meet it, slightly enlarged to be open (factor $1.02^2$); the sums (bottom) decrease toward its area. A segment is covered by boxes of total area $\to0$. For the rational points, the $k$-th one gets a box of area $\eps2^{-k}$, so $\mu^*\le\eps$ for every $\eps$.`,
      deps: ['pma-11.5', 'pma-1.8'],
      see: ['rca-2.20'],
      verify: true,
      tags: ['measure', 'outer measure'],
      viz(v) {
        const M = v.M;
        const which = v.select('$E=$', [{ value: 'blob', label: 'a blob' }, { value: 'seg', label: 'a segment' }, { value: 'rat', label: 'the rational points' }], 'blob');
        const lev = v.slider('dyadic level $n$', 1, 7, 3, { int: true });
        const eps = v.slider('$\\varepsilon$', 0.002, 0.5, 0.2, { log: true, fmt: (x) => v.fmt(x, 2) });
        const S = v.stage({ x: [-0.05, 1.05], y: [-0.05, 1.05], equal: true, height: 340, axes: false, weight: 1.3 });
        const B = v.stage({ x: [-0.5, 7.6], y: [0, 1], height: 340, axes: 'box', weight: 1, minWidth: 220, xticks: [1, 2, 3, 4, 5, 6, 7], title: 'total area of the cover' });
        const blob = radialBlob(M, 0.5, 0.52, 0.3, 7);
        const P0 = [0.1, 0.18], P1 = [0.9, 0.8];
        const segPts = (h) => { const n = Math.ceil(Math.hypot(P1[0] - P0[0], P1[1] - P0[1]) / h * 3) + 2; return M.range(n + 1).map((i) => [P0[0] + (P1[0] - P0[0]) * i / n, P0[1] + (P1[1] - P0[1]) * i / n]); };
        const ENL = 1.02;
        // squares of level n meeting E (exact for these sets: contains a boundary point, or lies inside)
        const cover = (w, n) => {
          const N = 1 << n, h = 1 / N, hit = new Set();
          const pts = w === 'blob' ? blob.boundary(h / 3) : segPts(h);
          for (const [x, y] of pts) { const i = Math.floor(x * N), j = Math.floor(y * N); if (i >= 0 && j >= 0 && i < N && j < N) hit.add(i * N + j); }
          if (w === 'blob') for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (blob.inside((i + 0.5) * h, (j + 0.5) * h)) hit.add(i * N + j);
          return [...hit].map((c) => [Math.floor(c / N) * h, (c % N) * h, h]);
        };
        const CACHE = {};
        const sums = (w) => (CACHE[w] ||= M.range(7, 1).map((n) => cover(w, n).length * (ENL / (1 << n)) ** 2));
        // rational points of [0,1]², ordered by denominator
        const RP = []; { const seen = new Set(); for (let q = 1; q <= 9; q++) for (let a = 0; a <= q; a++) for (let b = 0; b <= q; b++) { const k = `${(a / q).toFixed(9)},${(b / q).toFixed(9)}`; if (!seen.has(k)) { seen.add(k); RP.push([a / q, b / q]); } } }
        let st = {};
        v.render(() => {
          const w = which.value, rat = w === 'rat';
          lev.el.hidden = rat; eps.el.hidden = !rat;
          if (!rat) {
            const n = lev.value, C = cover(w, n), h = 1 / (1 << n), e = (ENL - 1) * h / 2;
            if (w === 'blob') S.poly(blob.poly, { fill: 'blue', fillAlpha: 0.3, stroke: false });
            for (const [x, y] of C) S.rect(x - e, y - e, x + h + e, y + h + e, { fill: 'orange', fillAlpha: 0.13, color: 'orange', width: n >= 6 ? 0.4 : 1, alpha: 0.8 });
            if (w === 'blob') S.poly(blob.poly, { color: 'blue', width: 2.2 });
            if (w === 'seg') S.line(P0[0], P0[1], P1[0], P1[1], { color: 'blue', width: 2.4 });
            const sm = sums(w), mE = w === 'blob' ? blob.area : 0;
            B.setView(null, [-Math.max(...sm) * 0.08, Math.max(...sm) * 1.12]);
            B.hline(mE, { color: 'green', dash: [6, 4], width: 1.5 });
            B.path(sm.map((s, i) => [i + 1, s]), { color: 'orange', width: 1.5 });
            sm.forEach((s, i) => B.dot(i + 1, s, { color: i + 1 === n ? 'orange' : 'muted', r: i + 1 === n ? 5.5 : 3.5 }));
            B.setTitle('total area of the cover against $n$');
            v.legend([['blue', '$E$'], ['orange', 'open boxes covering $E$', { area: true }], ['green', w === 'blob' ? '$m(E)$' : '$0$', { dash: true }]]);
            st = { w, n, cnt: C.length, sum: sm[n - 1], mE };
          } else {
            const e = eps.value; let tot = 0; const partial = [];
            RP.forEach(([x, y], k) => { const s = Math.sqrt(e * Math.pow(2, -(k + 1))); tot += s * s; if (k < 40) partial.push(tot); if (s > 0.004) S.rect(x - s / 2, y - s / 2, x + s / 2, y + s / 2, { fill: 'orange', fillAlpha: 0.15, color: 'orange', width: 1 }); });
            S.dots(RP, { r: 2.2, color: 'gold' });
            B.setView(null, [-e * 0.1, e * 1.15]);
            B.hline(e, { color: 'green', dash: [6, 4], width: 1.5 });
            B.bars(partial.slice(0, 7), { color: 'orange', barWidth: 0.55 });
            B.setTitle('$\\sum_{k\\le K}\\varepsilon 2^{-k}$ for $K=1,\\dots,7$');
            v.legend([['gold', `rational points with denominator $\\le 9$ (${RP.length} shown)`, { dot: true }], ['orange', 'box of area $\\varepsilon2^{-k}$ around the $k$-th point', { area: true }], ['green', '$\\varepsilon$', { dash: true }]]);
            st = { w, e, tot };
          }
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          if (s.w === 'rat') return `Total area of the cover $=\\sum_k\\varepsilon2^{-k}<\\varepsilon=${v.fmt(s.e, 2)}$. The same works for all (countably many) rational points, so $\\mu^*(\\mathbb Q^2\\cap[0,1]^2)=0$ — although these points are dense.`;
          if (s.w === 'seg') return `${s.cnt} boxes of side $2^{-${s.n}}$, total area $${v.fix(s.sum, 4)}$, of order $2^{-n}$: the segment has outer measure $0$ in the plane.`;
          return `${s.cnt} open boxes, total area $${v.fix(s.sum, 4)}$ $\\ge\\mu^*(E)$; finer covers come down toward $m(E)=${v.fix(s.mE, 4)}$, and no cover can do better (11.8).`;
        });
      },
    },
    {
      num: '11.8',
      kind: 'Theorem',
      name: 'Outer measure extends μ and is countably subadditive',
      statement: String.raw`Let $\mu$ be as in 11.7. Then

(a) $\mu^*(A)=\mu(A)$ for every $A\in\mathscr E$;

(b) if $E=\bigcup_{n=1}^\infty E_n$, then $\mu^*(E)\le\sum_{n=1}^\infty\mu^*(E_n)$.`,
      idea: String.raw`(a) Regularity gives an open $G\supset A$ with $\mu(G)\le\mu(A)+\eps$, so $\mu^*(A)\le\mu(A)$. Conversely, given any open cover $\{A_n\}$ of $A$, regularity gives a closed $F\subset A$ with $\mu(F)\ge\mu(A)-\eps$; $F$ is closed and bounded, hence compact (2.41), so finitely many $A_n$ cover it and additivity gives $\mu(A)\le\mu(F)+\eps\le\sum_n\mu(A_n)+\eps$. (b) Cover each $E_n$ to within $\eps2^{-n}$ and put all the covers together.`,
      caption: String.raw`Open intervals $J_k$ (drawn lower as $k$ grows) are centred at the rationals $r_1=0,\ r_2=1,\ r_3=\tfrac12,\dots$ with lengths $\ell_k=c\cdot\frac{6}{\pi^2k^2}$, so $\sum\ell_k=c$. Below the axis: the part of $[0,1]$ they cover (orange) and miss (red). If $c<1$ they can never cover $[0,1]$ — some measure $\ge1-c$ is always left — and if they do cover, finitely many already do. Switch to $\mathbb Q\cap[0,1]$: the same intervals cover every rational, so its outer measure is at most $c$, however small.`,
      deps: ['pma-11.7', 'pma-11.5', 'pma-2.41'],
      see: ['rca-2.20'],
      tags: ['measure', 'compactness', 'outer measure'],
      viz(v) {
        const which = v.select('', [{ value: 'int', label: '$A=[0,1]$ (elementary)' }, { value: 'rat', label: '$\\mathbb Q\\cap[0,1]$' }], 'int');
        const cS = v.slider('total length $c$', 0.2, 3, 0.8, { step: 0.01 });
        const kS = v.slider('intervals used $K$', 1, 2000, 200, { log: true, int: true });
        const T = v.stage({ x: [-0.12, 1.12], y: [-0.2, 1.05], height: 300, full: true, axes: false });
        const Bt = v.stage({ x: [0, Math.log10(2000)], y: [0, 1], height: 160, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], title: 'uncovered measure $m\\big([0,1]-\\bigcup_{k\\le K}J_k\\big)$ against $K$ (log scale)' });
        const KMAX = 2000, R = rationals01(KMAX), Z = 6 / (Math.PI * Math.PI);
        const covered = (c, K) => { const J = []; for (let k = 0; k < K; k++) { const l = c * Z / ((k + 1) * (k + 1)); J.push([R[k] - l / 2, R[k] + l / 2]); } return mergeIntervals(J); };
        const uncov = (U) => { let s = 0, x = 0; for (const [a, b] of U) { if (b <= 0 || a >= 1) continue; s += Math.max(0, Math.max(a, 0) - x); x = Math.max(x, Math.min(b, 1)); } return s + Math.max(0, 1 - x); };
        let cacheKey = null, curve = [], firstN = null;
        let st = {};
        v.render(() => {
          const c = cS.value, K = kS.value, rat = which.value === 'rat';
          if (cacheKey !== c) {
            cacheKey = c; curve = []; firstN = null;
            const J = [];
            for (let k = 0; k < KMAX; k++) {
              const l = c * Z / ((k + 1) * (k + 1)); J.push([R[k] - l / 2, R[k] + l / 2]);
              const kk = k + 1;
              if (kk <= 12 || kk % Math.max(1, Math.floor(kk / 25)) === 0 || kk === KMAX) { const u = uncov(mergeIntervals(J)); curve.push([Math.log10(kk), u]); if (u <= 1e-12 && firstN == null) firstN = kk; }
              else if (firstN == null && kk < 200) { const u = uncov(mergeIntervals(J)); if (u <= 1e-12) firstN = kk; }
            }
          }
          const U = covered(c, K), u = uncov(U);
          const tail = c * (1 - Z * Array.from({ length: K }, (_, k) => 1 / ((k + 1) * (k + 1))).reduce((s, x) => s + x, 0));
          // intervals drawn at heights by log k
          const yk = (k) => 0.95 - 0.82 * Math.log(k) / Math.log(Math.max(K, 8));
          const show = Math.min(K, 400);
          for (let k = 1; k <= show; k++) {
            const l = c * Z / (k * k), x = R[k - 1];
            const fin = firstN != null && k <= firstN;
            T.line(Math.max(-0.12, x - l / 2), yk(k), Math.min(1.12, x + l / 2), yk(k), { color: fin && !rat ? 'green' : 'orange', width: k <= 8 ? 3 : 1.4, alpha: k <= 8 ? 0.9 : 0.6, cap: 'butt' });
          }
          // the axis: [0,1], covered parts, uncovered parts
          T.line(0, -0.03, 1, -0.03, { color: 'blue', width: 3, cap: 'butt' });
          for (const [a, b] of U) { const p = Math.max(a, -0.12), q = Math.min(b, 1.12); if (q > p) T.rect(p, -0.1, q, -0.06, { fill: 'orange', fillAlpha: 0.75, stroke: false }); }
          { let x = 0; for (const [a, b] of U) { if (b <= 0 || a >= 1) continue; if (a > x) T.rect(x, -0.17, Math.min(a, 1), -0.12, { fill: 'red', fillAlpha: 0.85, stroke: false }); x = Math.max(x, Math.min(b, 1)); } if (x < 1) T.rect(x, -0.17, 1, -0.12, { fill: 'red', fillAlpha: 0.85, stroke: false }); }
          if (rat) T.dots(R.slice(0, Math.min(K, 300)).map((r) => [r, -0.03]), { r: 2.3, color: 'gold' });
          T.text('0', 0, -0.03, { dx: -12, size: 11, color: 'muted' }); T.text('1', 1, -0.03, { dx: 6, size: 11, color: 'muted' });
          // bottom: uncovered measure against K
          Bt.path(curve, { color: 'red', width: 2 });
          if (c < 1) Bt.hline(1 - c, { color: 'red', dash: [6, 4], width: 1.2, alpha: 0.7 });
          Bt.vline(Math.log10(K), { color: 'gold', width: 1.4 });
          Bt.dot(Math.log10(K), u, { color: 'gold', r: 5 });
          v.legend([['orange', 'open intervals $J_k$, length $\\ell_k$', { area: true }], ['red', 'points of $[0,1]$ not yet covered', { area: true }], ['green', 'finite subcover', { area: true }]].concat(rat ? [['gold', 'rationals $r_k$, each inside its $J_k$', { dot: true }]] : []));
          st = { c, K, u, tail, rat, firstN };
        });
        v.readout(() => {
          const s = st; if (s.c == null) return '';
          if (s.rat) return `Every rational $r_k$ lies in $J_k$, so $\\mathbb Q\\cap[0,1]\\subset\\bigcup J_k$ and $\\mu^*(\\mathbb Q\\cap[0,1])\\le c=${v.fix(s.c, 2)}$ — for every $c>0$. No finite subfamily can cover this dense set when $c<1$: it is not compact, and it is not elementary.`;
          if (s.firstN != null && s.firstN <= s.K) return `$J_1,\\dots,J_{${s.firstN}}$ already cover $[0,1]$ (green) — as compactness promises — and their lengths add up to at least $1=m([0,1])$.`;
          const lb = s.u - s.tail;
          return `After $K=${s.K}$ intervals the uncovered measure is $${v.fix(s.u, 4)}$; the remaining intervals have total length $${v.fix(s.tail, 4)}$` + (lb > 0 ? `, so at least $${v.fix(lb, 4)}$ of $[0,1]$ is never covered.` : '.') + (s.c < 1 ? ` Since $\\sum\\ell_k=c<1$, subadditivity forces at least $1-c=${v.fix(1 - s.c, 2)}$ to stay uncovered: $\\mu^*([0,1])=1$.` : '');
        });
      },
    },
    {
      num: '11.9',
      kind: 'Definition',
      name: 'Symmetric difference metric; finitely μ-measurable and μ-measurable sets',
      statement: String.raw`For $A,B\subset\R^p$ let $S(A,B)=(A-B)\cup(B-A)$ be their symmetric difference and put $d(A,B)=\mu^*(S(A,B))$. Write $A_n\to A$ if $d(A,A_n)\to0$.

If there is a sequence of **elementary** sets $A_n$ with $A_n\to A$, then $A$ is **finitely $\mu$-measurable**, $A\in\mathfrak M_F(\mu)$. If $A$ is a countable union of finitely $\mu$-measurable sets, it is **$\mu$-measurable**, $A\in\mathfrak M(\mu)$.

$d$ behaves like a distance: $d(A,B)=d(B,A)$, $d(A,C)\le d(A,B)+d(B,C)$, $d(A_1\cup A_2,B_1\cup B_2)$, $d(A_1\cap A_2,B_1\cap B_2)$ and $d(A_1-A_2,B_1-B_2)$ are all $\le d(A_1,B_1)+d(A_2,B_2)$, and $|\mu^*(A)-\mu^*(B)|\le d(A,B)$ when one of $\mu^*(A),\mu^*(B)$ is finite.`,
      idea: String.raw`Measurable sets are those that elementary sets approximate in the pseudometric $d$, so $\mathfrak M_F(\mu)$ is the closure of $\mathscr E$. The inequalities all follow from inclusions such as $S(A_1\cup A_2,B_1\cup B_2)\subset S(A_1,B_1)\cup S(A_2,B_2)$ and subadditivity (11.8). The last one says that $\mu^*$ is continuous for $d$; it is why $\mu^*$ inherits additivity from $\mu$ on the closure (11.10). $d(A,B)=0$ does not force $A=B$ — sets differing by a null set are at distance $0$.`,
      caption: String.raw`$A$ is a blob (or an annulus), $A_n$ the union of the dyadic squares of level $n$ whose centres lie in $A$. Orange: $A-A_n$; red: $A_n-A$; together they form $S(A,A_n)$, whose area $d(A,A_n)$ is plotted below on a log scale. It tends to $0$, so $A\in\mathfrak M_F(\mu)$, and $|m(A)-m(A_n)|\le d(A,A_n)$ makes the measures converge too.`,
      deps: ['pma-11.7', 'pma-11.8', 'pma-11.4'],
      see: ['rca-2.20'],
      tags: ['measure', 'metric', 'approximation'],
      viz(v) {
        const M = v.M;
        const shape = v.select('$A=$', [{ value: 'blob', label: 'a blob' }, { value: 'ann', label: 'an annulus' }], 'blob');
        const lev = v.slider('level $n$', 1, 6, 3, { int: true });
        const S = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 360, axes: false, weight: 1.3 });
        const Bt = v.stage({ x: [0.4, 6.6], y: [-2.5, 0.9], height: 360, axes: 'box', weight: 1, minWidth: 220, xticks: [1, 2, 3, 4, 5, 6], yticks: [[-2, '0.01'], [-1, '0.1'], [0, '1']], title: '$d(A,A_n)$ (log scale)' });
        const blob = radialBlob(M, 0, 0, 0.82, 11, 0.25);
        const SH = {
          blob: { inside: blob.inside, area: blob.area, draw: () => S.poly(blob.poly, { color: 'ink', width: 2 }) },
          ann: { inside: (x, y) => { const r = Math.hypot(x, y); return r < 1.02 && r > 0.48; }, area: Math.PI * (1.02 ** 2 - 0.48 ** 2), draw: () => { S.circle(0, 0, 1.02, { color: 'ink', width: 2 }); S.circle(0, 0, 0.48, { color: 'ink', width: 2 }); } },
        };
        const L0 = 2.5; // grid covers [-1.25, 1.25]
        const approx = (inside, n) => {
          const N = 1 << n, h = L0 / N, sq = [];
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = -1.25 + i * h, y = -1.25 + j * h; if (inside(x + h / 2, y + h / 2)) sq.push([x, y, x + h, y + h]); }
          return { sq, h, N };
        };
        // d(A, A_n) by sampling each square on a 24×24 sub-grid
        const dist = (inside, n) => {
          const { h, N } = approx(inside, n); const g = 24; let out = 0, inn = 0;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const x = -1.25 + i * h, y = -1.25 + j * h, c = inside(x + h / 2, y + h / 2); let k = 0;
            for (let a = 0; a < g; a++) for (let b = 0; b < g; b++) if (inside(x + (a + 0.5) * h / g, y + (b + 0.5) * h / g)) k++;
            if (c) out += (1 - k / (g * g)) * h * h; else inn += k / (g * g) * h * h;
          }
          return { d: out + inn, out, inn };
        };
        const CACHE = {};
        const prof = (w) => (CACHE[w] ||= M.range(6, 1).map((n) => dist(SH[w].inside, n)));
        let st = {};
        v.render(() => {
          const w = shape.value, n = lev.value, A = SH[w];
          const { sq, h } = approx(A.inside, n);
          const inAn = (x, y) => { const i = Math.floor((x + 1.25) / h), j = Math.floor((y + 1.25) / h); return A.inside(-1.25 + (i + 0.5) * h, -1.25 + (j + 0.5) * h); };
          const oc = v.rgb('orange'), rc = v.rgb('red');
          for (const b of sq) S.rect(b[0], b[1], b[2], b[3], { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: n <= 4 ? 0.8 : 0.4, alpha: 0.5 });
          S.raster((x, y) => { const a = A.inside(x, y), b = inAn(x, y); if (a === b) return null; const c = a ? oc : rc; return [c[0], c[1], c[2], 200]; }, { key: `${w}|${n}|${v.color('orange')}`, res: 1 });
          A.draw();
          const P = prof(w), D = P[n - 1];
          P.forEach((p, i) => Bt.dot(i + 1, Math.log10(p.d), { color: i + 1 === n ? 'orange' : 'muted', r: i + 1 === n ? 5.5 : 3.5 }));
          Bt.path(P.map((p, i) => [i + 1, Math.log10(p.d)]), { color: 'orange', width: 1.4 });
          v.legend([['ink', '$\\partial A$'], ['blue', '$A_n$ (elementary)', { area: true }], ['orange', '$A-A_n$', { area: true }], ['red', '$A_n-A$', { area: true }]]);
          st = { n, D, mA: A.area, mAn: sq.length * h * h };
        });
        v.readout(() => {
          const s = st; if (!s.D) return '';
          return `$d(A,A_${s.n})=m(A-A_${s.n})+m(A_${s.n}-A)=${v.fix(s.D.out, 4)}+${v.fix(s.D.inn, 4)}=${v.fix(s.D.d, 4)}$ (computed on a fine sub-grid). $\\;m(A)=${v.fix(s.mA, 4)}$, $m(A_${s.n})=${v.fix(s.mAn, 4)}$, and indeed $|m(A)-m(A_${s.n})|=${v.fix(Math.abs(s.mA - s.mAn), 4)}\\le d(A,A_${s.n})$.`;
        });
      },
    },
    {
      num: '11.10',
      kind: 'Theorem',
      name: 'M(μ) is a σ-ring on which μ* is countably additive',
      statement: String.raw`$\mathfrak M(\mu)$ is a $\sigma$-ring, and $\mu^*$ is countably additive on $\mathfrak M(\mu)$.

Writing $\mu$ for $\mu^*$ on $\mathfrak M(\mu)$, the regular set function $\mu$ on $\mathscr E$ is thereby extended to a countably additive set function on a $\sigma$-ring containing $\mathscr E$ — a **measure**. For $\mu=m$ this is **Lebesgue measure** on $\R^p$.`,
      idea: String.raw`If $A_n\to A$ and $B_n\to B$ with elementary $A_n,B_n$, then $A_n\cup B_n\to A\cup B$ etc. by the inequalities of 11.9, so $\mathfrak M_F$ is a ring, and $\mu^*$ is additive on it because $\mu$ is additive on $\mathscr E$ and $\mu^*$ is $d$-continuous. Countable additivity: $\mu^*(\bigcup A_n)\le\sum\mu^*(A_n)$ by subadditivity (11.8), and $\ge\sum_{n\le N}\mu^*(A_n)$ for every $N$ by additivity and monotonicity. Finally a set of $\mathfrak M$ is a disjoint countable union of sets of $\mathfrak M_F$, which yields the $\sigma$-ring property.`,
      caption: String.raw`A fat Cantor set: from $[0,1]$ remove at stage $k$ an open middle interval of length $4^{-k}$ from each of the $2^{k-1}$ remaining intervals. The set $C$ that survives is $[0,1]$ minus a countable union of open intervals, so $C\in\mathfrak M(m)$ because $\mathfrak M(m)$ is a $\sigma$-ring; countable additivity gives $m(\bigcup\text{gaps})=\sum_k2^{k-1}4^{-k}=\tfrac12$, so $m(C)=\tfrac12$ although $C$ contains no interval. Compare the middle-thirds Cantor set, where the gaps have total length $1$.`,
      deps: ['pma-11.9', 'pma-11.8', 'pma-11.1', 'pma-11.2'],
      see: ['rca-2.20', 'rca-1.19'],
      tags: ['measure', 'Lebesgue measure', 'Cantor set'],
      viz(v) {
        const kind = v.select('', [{ value: 'fat', label: 'fat Cantor set' }, { value: 'std', label: 'middle-thirds Cantor set' }], 'fat');
        const nS = v.slider('stages shown $n$', 1, 9, 5, { int: true });
        const T = v.stage({ x: [-0.03, 1.03], y: [-9.6, 0.8], height: 300, full: true, axes: false, title: 'stage $k$: kept closed intervals $C_k$ (blue) and the open gaps removed at that stage (red)' });
        const Bt = v.stage({ x: [0.3, 9.7], y: [-0.14, 1.08], height: 180, full: true, axes: 'box', xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9], yticks: [0, 0.5, 1], title: 'by stage: total length removed (red) and $m(C_k)$ (blue)' });
        let st = {};
        v.render(() => {
          const fat = kind.value === 'fat', n = nS.value;
          T.setView(null, [-n - 0.6, 0.8]);
          const removed = [], kept = [];
          for (let k = 0; k <= n; k++) {
            const { keep, gaps } = cantorStages(k, fat);
            for (const [a, b] of keep) T.line(a, -k, b, -k, { color: 'blue', width: 5, cap: 'butt' });
            for (const [a, b, s] of gaps) if (s === k) T.line(a, -k, b, -k, { color: 'red', width: 5, cap: 'butt', alpha: 0.8 });
            T.text(`k = ${k}`, -0.03, -k, { dy: -10, size: 10.5, color: 'muted' });
            if (k >= 1) { const tot = gaps.reduce((s, [a, b]) => s + (b - a), 0); removed.push(tot); kept.push(keep.reduce((s, [a, b]) => s + (b - a), 0)); }
          }
          const lim = fat ? 0.5 : 1;
          Bt.bars(removed, { color: 'red', barWidth: 0.35, x0: 0.8 });
          Bt.bars(kept, { color: 'blue', barWidth: 0.35, x0: 1.2 });
          Bt.hline(lim, { color: 'red', dash: [6, 4], width: 1.3 });
          Bt.hline(1 - lim, { color: 'blue', dash: [6, 4], width: 1.3 });
          v.legend([['red', `gaps: total $\\to\\sum_k ${fat ? '2^{k-1}4^{-k}=\\tfrac12' : '2^{k-1}3^{-k}=1'}$`, { area: true }], ['blue', `$m(C_k)\\downarrow m(C)=${fat ? '\\tfrac12' : '0'}$`, { area: true }]]);
          st = { fat, n, rem: removed[n - 1], kept: kept[n - 1], gaps: Math.pow(2, n) - 1 };
        });
        v.readout(() => {
          const s = st; if (s.rem == null) return '';
          return `After ${s.n} stages: ${s.gaps} disjoint open gaps of total length $${v.fix(s.rem, 5)}$, and $m(C_${s.n})=${v.fix(s.kept, 5)}$. The limit set $C=[0,1]-\\bigcup(\\text{gaps})$ is in $\\mathfrak M(m)$ and, by countable additivity, $m(C)=1-${s.fat ? '\\tfrac12=\\tfrac12' : '1=0'}$. Also $d(C,C_n)=m(C_n)-m(C)\\to0$: $C\\in\\mathfrak M_F(m)$.`;
        });
      },
    },
  ],
};
