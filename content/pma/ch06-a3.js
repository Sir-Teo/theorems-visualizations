// Rudin, Principles of Mathematical Analysis — Chapter 6: The Riemann–Stieltjes Integral (part a3)

// ---------------------------------------------------------------- shared helpers
// (each part file of this chapter carries its own copy — content modules cannot import)

/** Simpson's rule on [a, b]. */
function simpson(f, a, b, n = 240) {
  if (!(b > a)) return 0;
  if (n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3;
}
/**
 * An increasing integrator α(x) = cont(x) + Σ w·I(x − p) with Rudin's unit step
 * I(t) = 0 for t ≤ 0, 1 for t > 0 (Definition 6.14). dens = cont'.
 */
function integrator(cont, dens, jumps = []) {
  const A = (x) => { let s = cont(x); for (const [p, w] of jumps) if (x > p) s += w; return s; };
  A.cont = cont; A.dens = dens; A.jumps = jumps;
  return A;
}
/** Attach the list of discontinuities of f so that sup/inf see both one-sided values. */
function withBreaks(f, breaks = []) { f.breaks = breaks; return f; }
/** [inf, sup] of f on [u, w]: endpoints, n interior samples, and both sides of every break. */
function supInf(f, u, w, n = 64) {
  if (f.sup) return f.sup(u, w);
  let m = Infinity, M = -Infinity;
  const at = (x) => { const y = f(x); if (y < m) m = y; if (y > M) M = y; };
  for (let k = 0; k <= n; k++) at(u + (w - u) * k / n);
  for (const p of f.breaks || []) if (p >= u && p <= w) { at(p); if (p - 1e-9 >= u) at(p - 1e-9); if (p + 1e-9 <= w) at(p + 1e-9); }
  return [m, M];
}
/** Upper and lower Stieltjes sums of f over partition P: {U, L, cells:[{u, w, m, M, da}]}. */
function sums(f, A, P) {
  let U = 0, L = 0; const cells = [];
  for (let i = 1; i < P.length; i++) {
    const u = P[i - 1], w = P[i]; const [m, M] = supInf(f, u, w); const da = A(w) - A(u);
    U += M * da; L += m * da; cells.push({ u, w, m, M, da });
  }
  return { U, L, cells };
}
/** ∫ f dα for f continuous (from the right) at the jumps of α:  ∫ f·cont' dx + Σ w·f(p). */
function rsIntegral(f, A, a, b) {
  const cuts = [a, ...(f.breaks || []).filter((x) => x > a && x < b), b];
  let s = 0;
  for (let i = 1; i < cuts.length; i++) s += simpson((x) => f(x) * A.dens(x), cuts[i - 1] + 1e-10, cuts[i] - 1e-10, 600);
  for (const [p, w] of A.jumps) if (p >= a && p < b) s += w * f(p);
  return s;
}
const uniform = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const num = (x, d = 3) => x.toFixed(d).replace('-', '−');
/** num(), parenthesised when negative (for sums like 0.3 + (−0.2)). */
const par = (x, d = 3) => (x < 0 ? `(${num(x, d)})` : num(x, d));
/** Graph of an integrator, with filled/hollow dots at its jumps (α is left-continuous there). */
function drawAlpha(S, A, a, b, st = {}) {
  const col = st.color || 'orange';
  const js = A.jumps.filter(([p]) => p > a && p < b).sort((x, y) => x[0] - y[0]);
  const cuts = [a, ...js.map(([p]) => p), b];
  let off = 0;
  for (let i = 1; i < cuts.length; i++) {
    const o = off;
    S.fn((x) => A.cont(x) + o, { domain: [cuts[i - 1], cuts[i]], color: col, width: st.width ?? 2.2 });
    if (i < cuts.length - 1) off += js[i - 1][1];
  }
  for (const [p, w] of js) {
    const y0 = A(p);
    S.line(p, y0, p, y0 + w, { color: col, width: 1.2, dash: [3, 3] });
    S.dot(p, y0, { color: col, r: 3.5 });
    S.dot(p, y0 + w, { color: col, r: 3.5, hollow: true });
  }
}
/** Graph of f split at its breaks (no vertical connector), with filled/hollow dots at the jumps. */
function drawF(S, f, a, b, st = {}) {
  const br = (f.breaks || []).filter((p) => p > a && p < b).sort((x, y) => x - y);
  const cuts = [a, ...br, b];
  for (let i = 1; i < cuts.length; i++) S.fn(f, { color: 'ink', width: 2.4, ...st, domain: [cuts[i - 1] + (i > 1 ? 1e-9 : 0), cuts[i] - (i < cuts.length - 1 ? 1e-9 : 0)] });
  for (const p of br) {
    const l = f(p - 1e-9), r = f(p + 1e-9), v = f(p);
    S.dot(p, Math.abs(v - l) < 1e-6 ? r : l, { color: st.color || 'ink', r: 4, hollow: true });
    S.dot(p, v, { color: st.color || 'ink', r: 4 });
  }
}
/** Upper (purple) and lower (teal) rectangles over the x-cells. */
function drawBars(S, cells, st = {}) {
  for (const c of cells) {
    if (st.upper !== false) S.rect(c.u, 0, c.w, c.M, { fill: 'purple', fillAlpha: st.ua ?? 0.12, color: 'purple', width: 1.1, alpha: st.la ?? 0.8 });
    if (st.lower !== false) S.rect(c.u, 0, c.w, c.m, { fill: 'teal', fillAlpha: st.lf ?? 0.24, color: 'teal', width: 1.1, alpha: st.la ?? 0.8 });
  }
}
/** A horizontal number line at y = 0 on a stage made with numStage (scale drawn by the box axis). */
function numLine(S, lo, hi) {
  S.setView([lo, hi], [-1, 1]);
  S.line(lo, 0, hi, 0, { color: 'faint', width: 1.2 });
}
/** A short stage for numLine: box axis at the bottom carries the scale. */
const numStage = (v, title, st = {}) => v.stage({ x: [0, 1], y: [-1, 1], height: 120, axes: 'box', yticks: [], full: true, title, ...st });
/** Draggable interior partition points on the line y = y0 (max of them; reset(n) shows n−1). */
function partitionHandles(S, a, b, max, y0, color = 'orange') {
  const H = [];
  for (let k = 0; k < max; k++) {
    const h = S.handle(a, y0, { color, r: 6 });
    h.constrain = (x) => {
      const i = H.indexOf(h); const g = (b - a) * 0.012;
      const lo = i > 0 ? H[i - 1].x : a;
      const hi = i < H.length - 1 && H[i + 1].visible ? H[i + 1].x : b;
      return [clamp(x, lo + g, hi - g), y0];
    };
    H.push(h);
  }
  return {
    H,
    reset(n) { H.forEach((h, k) => { h.visible = k < n - 1; h.x = a + (b - a) * (k + 1) / n; h.y = y0; }); },
    points() { return [a, ...H.filter((h) => h.visible).map((h) => h.x), b]; },
  };
}
/** The chapter's standard integrator on [0, 1]: smooth part plus jumps at 0.32 and 0.70. */
const ALPHA = () => integrator((x) => 0.5 * x + 0.3 * x * x, (x) => 0.5 + 0.6 * x, [[0.32, 0.4], [0.7, 0.25]]);
const IDENT = () => integrator((x) => x, () => 1);


export default {
  collection: 'pma',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.14
    {
      num: '6.14',
      kind: 'Definition',
      name: 'The unit step function I',
      statement: String.raw`The **unit step function** $I$ is defined by $I(x)=0$ for $x\le0$ and $I(x)=1$ for $x>0$. For $s\in\R$, the translate $I(x-s)$ jumps from $0$ to $1$ just after $s$; it is increasing and continuous from the left.`,
      idea: String.raw`As an integrator, $I(x-s)$ puts a unit point mass at $s$: every cell not containing $s$ gets weight $\Delta\alpha_i=0$. The convention $I(0)=0$ decides which cell carries the mass when $s$ is a partition point.`,
      deps: [],
      tags: ['step function', 'integrator'],
    },
    // ------------------------------------------------------------------ 6.15
    {
      num: '6.15',
      kind: 'Theorem',
      name: 'Integrating against a unit step samples f',
      statement: String.raw`If $a<s<b$, $f$ is bounded on $[a,b]$, $f$ is continuous at $s$, and $\alpha(x)=I(x-s)$, then
$$\int_a^b f\,d\alpha=f(s).$$`,
      idea: String.raw`For any partition, $\Delta\alpha_i=I(x_i-s)-I(x_{i-1}-s)$ is $1$ for the single cell with $x_{i-1}\le s<x_i$ and $0$ for all others, so $U(P,f,\alpha)=M_i$ and $L(P,f,\alpha)=m_i$ for that cell. Using partitions $\{a,s,x_2,b\}$ with $x_2\downarrow s$, continuity of $f$ at $s$ squeezes $M_i$ and $m_i$ onto $f(s)$.`,
      caption: String.raw`Drag $s$ and change the number of cells. Only the highlighted cell has $\Delta\alpha_i\neq0$, so $U$ and $L$ are just the top and bottom of its box; the right panel shows both collapsing onto $f(s)$ as $n$ grows. If $f$ jumps at $s$, the box never shrinks below the jump and the integral does not exist.`,
      deps: ['pma-6.14', 'pma-6.2'],
      tags: ['step function', 'point mass'],
      viz(v) {
        const a = 0, b = 1, jump = 0.35;
        const g = (x) => 0.45 + 0.3 * Math.sin(5 * x + 0.5) + 0.15 * x;
        const which = v.select('$f$', [{ value: 'cont', label: 'continuous at $s$' }, { value: 'jump', label: 'jumps at $s$' }], 'cont');
        const nS = v.slider('cells $n$', 2, 40, 6, { int: true });
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.1, 1.2], height: 260, full: true, xlabel: 'x', title: '$f$ and the only cell that counts' });
        const SA = v.stage({ x: [-0.04, 1.04], y: [-0.15, 1.25], height: 180, weight: 1, xticks: [], title: '$\\alpha(x)=I(x-s)$' });
        const SC = v.stage({ x: [0, 41], y: [0, 1.2], height: 180, weight: 1.3, axes: 'box', title: '$U$ and $L$ for $n=2,\\dots,40$ equal cells' });
        const sh = S.handle(0.43, 0, { color: 'gold', label: 's', constrain: (x) => [clamp(x, 0.05, 0.95), 0] });
        let st = null;
        v.render(() => {
          const s = sh.x, jumpy = which.value === 'jump';
          const f = jumpy ? withBreaks((x) => g(x) + (x > s ? jump : 0), [s]) : withBreaks(g);
          const A = integrator(() => 0, () => 0, [[s, 1]]);
          const n = nS.value, P = uniform(a, b, n);
          const { U, L, cells } = sums(f, A, P);
          const j = cells.findIndex((c) => c.da > 0.5), c = cells[j];
          for (const x of P) S.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.4 });
          S.vband(c.u, c.w, { color: 'gold', alpha: 0.12 });
          S.rect(c.u, c.m, c.w, c.M, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1.6 });
          S.line(c.u, c.M, c.w, c.M, { color: 'purple', width: 2.4 });
          S.line(c.u, c.m, c.w, c.m, { color: 'teal', width: 2.4 });
          drawF(S, f, a, b);
          S.dot(s, f(s), { color: 'green', r: 5 });
          S.tex('f(s)', s, f(s), { color: 'green', align: 'right', dx: -8, dy: -12, size: 14 });
          S.tex('M_j', c.w, c.M, { color: 'purple', align: 'left', dx: 5, size: 13 });
          S.tex('m_j', c.w, c.m, { color: 'teal', align: 'left', dx: 5, size: 13 });
          if (n <= 12) cells.forEach((q, i) => { if (i !== j) S.text('Δα = 0', (q.u + q.w) / 2, 0.06, { color: 'muted', size: 10.5, align: 'center' }); });
          // α panel
          drawAlpha(SA, A, a, b);
          SA.vband(c.u, c.w, { color: 'gold', alpha: 0.14 });
          for (const x of P) SA.line(x, -0.1, x, 1.1, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.35 });
          SA.tex('\\Delta\\alpha_j=1', c.w, 0.5, { color: 'orange', align: 'left', dx: 5, size: 13 });
          // U and L against n
          const ns = []; for (let k = 2; k <= 40; k++) ns.push(k);
          const UL = ns.map((k) => { const q = sums(f, A, uniform(a, b, k)); return [k, q.U, q.L]; });
          const lo = Math.min(...UL.map((r) => r[2])), hi = Math.max(...UL.map((r) => r[1]));
          SC.setView([0, 41], [lo - 0.08, hi + 0.08]);
          SC.hline(f(s), { color: 'green', width: 1.5, dash: [5, 4] });
          SC.path(UL.map((r) => [r[0], r[1]]), { color: 'purple', width: 1.6 });
          SC.path(UL.map((r) => [r[0], r[2]]), { color: 'teal', width: 1.6 });
          SC.dot(n, U, { color: 'purple', r: 4.5 }); SC.dot(n, L, { color: 'teal', r: 4.5 });
          SC.tex('f(s)', 40.5, f(s), { color: 'green', align: 'right', baseline: 'bottom', dy: -3, size: 13 });
          v.legend([['ink', '$f$'], ['accent', 'box $[m_j,M_j]$ of the cell containing $s$', { area: true }], ['purple', '$U=M_j$'], ['teal', '$L=m_j$'], ['green', '$f(s)$']]);
          st = { s, U, L, fs: f(s), jumpy };
        });
        v.readout(() => {
          if (!st) return '';
          const head = `$s=${num(st.s, 2)}$: $\\;U=M_j=${num(st.U)}$, $\\;L=m_j=${num(st.L)}$, $\\;f(s)=${num(st.fs)}$. `;
          return head + (st.jumpy ? `The jump of $f$ just after $s$ sits in the cell with weight $1$, so $U-L\\ge ${jump}$ for every partition: $f\\notin\\mathscr R(\\alpha)$.` : 'Both converge to $f(s)$, which is therefore the integral.');
        });
      },
    },
    // ------------------------------------------------------------------ 6.16
    {
      num: '6.16',
      kind: 'Theorem',
      name: 'Integrating against a series of steps',
      statement: String.raw`Suppose $c_n\ge0$ for $n=1,2,3,\dots$, $\sum c_n$ converges, $\{s_n\}$ is a sequence of distinct points of $(a,b)$, and
$$\alpha(x)=\sum_{n=1}^\infty c_n\,I(x-s_n).$$
If $f$ is continuous on $[a,b]$, then $\displaystyle\int_a^b f\,d\alpha=\sum_{n=1}^\infty c_n f(s_n)$.`,
      idea: String.raw`By comparison the series defining $\alpha$ converges at every $x$, and $\alpha$ is increasing with $\alpha(a)=0$, $\alpha(b)=\sum c_n$. Given $\eps$, pick $N$ with $\sum_{n>N}c_n<\eps$ and split $\alpha=\alpha_1+\alpha_2$ into the first $N$ steps and the tail. By 6.12(e) and 6.15, $\int f\,d\alpha_1=\sum_{n\le N}c_nf(s_n)$, while 6.12(d) bounds $\bigl|\int f\,d\alpha_2\bigr|\le M\eps$ with $M=\sup|f|$.`,
      caption: String.raw`Point masses $c_n=0.4\cdot0.6^{\,n-1}$ sit at the points $s_n$ (stems below the axis); the gold dots are the sampled values $f(s_n)$, sized by mass. With the rationals as $s_n$, $\alpha$ jumps on a dense set, yet the partial sums $\sum_{n\le N}c_nf(s_n)$ (right) run into the band $[L,U]$ computed from a fine partition, inside the error envelope $\pm M\sum_{n>N}c_n$.`,
      deps: ['pma-6.15', 'pma-6.12', 'pma-3.25'],
      verify: true,
      tags: ['step function', 'series'],
      viz(v) {
        const a = 0, b = 1, r = 0.6, K = 80;
        const gcd = (p, q) => (q ? gcd(q, p % q) : p);
        const rats = []; for (let q = 2; rats.length < K; q++) for (let p = 1; p < q && rats.length < K; p++) if (gcd(p, q) === 1) rats.push(p / q);
        const SEQ = { rat: rats, acc: Array.from({ length: K }, (_, n) => 1 - 1 / (n + 2)) };
        const c = Array.from({ length: K }, (_, n) => (1 - r) * r ** n);
        const f = withBreaks((x) => 0.25 + 0.5 * Math.sin(4 * x + 0.2) ** 2 + 0.2 * x);
        const Mf = Math.max(...v.M.linspace(0, 1, 400).map((x) => Math.abs(f(x))));
        const which = v.select('$s_n$', [{ value: 'rat', label: '$\\tfrac12,\\tfrac13,\\tfrac23,\\tfrac14,\\tfrac34,\\dots$ (all rationals)' }, { value: 'acc', label: '$s_n=1-\\frac1{n+1}$' }], 'rat');
        const nS = v.slider('terms $N$', 1, 25, 6, { int: true });
        const S = v.stage({ x: [-0.03, 1.03], y: [-0.48, 1.05], height: 270, full: true, xlabel: 'x', yticks: [0.2, 0.4, 0.6, 0.8, 1], title: '$f$, the masses $c_n$ at $s_n$ (stems) and the samples $f(s_n)$' });
        const SA = v.stage({ x: [-0.03, 1.03], y: [-0.05, 1.08], height: 200, weight: 1, title: '$\\alpha=\\sum c_n I(x-s_n)$' });
        const SC = v.stage({ x: [0, 26], y: [0, 1], height: 200, weight: 1.2, axes: 'box', title: 'partial sums $\\sum_{n\\le N}c_n f(s_n)$' });
        const cache = {};
        const fine = (key) => cache[key] ||= (() => {
          const s = SEQ[key], A = integrator(() => 0, () => 0, s.map((p, n) => [p, c[n]]));
          const q = sums(f, A, uniform(a, b, 3000));
          let tot = 0; s.forEach((p, n) => { tot += c[n] * f(p); });
          return { A, U: q.U, L: q.L, series: tot };
        })();
        let st = null;
        v.render(() => {
          const key = which.value, s = SEQ[key], N = nS.value, F = fine(key);
          // masses below the axis, samples on the graph
          for (let n = K - 1; n >= 0; n--) {
            const on = n < N;
            S.line(s[n], 0, s[n], -0.8 * c[n], { color: on ? 'orange' : 'faint', width: on ? 2.4 : 1.2 });
            if (on) S.dot(s[n], -0.8 * c[n], { color: 'orange', r: 3 });
          }
          S.fn(f, { domain: [a, b], color: 'ink', width: 2.4 });
          for (let n = 0; n < N; n++) S.dot(s[n], f(s[n]), { color: 'gold', r: 2.5 + 9 * Math.sqrt(c[n]) });
          S.text('masses cₙ', 0.005, -0.4, { color: 'orange', size: 11.5, align: 'left' });
          // α staircase
          const js = s.map((p, n) => [p, c[n]]).sort((p, q) => p[0] - q[0]);
          let y = 0, prev = a; const pts = [];
          for (const [p, w] of js) { pts.push([prev, y], [p, y], null); y += w; prev = p; }
          pts.push([prev, y], [b, y]);
          SA.path(pts, { color: 'orange', width: 2 });
          for (let n = 0; n < N; n++) SA.dot(s[n], F.A(s[n]) + c[n], { color: 'orange', r: 2.5, hollow: true });
          // partial sums
          const ps = []; let acc = 0; for (let n = 0; n < 25; n++) { acc += c[n] * f(s[n]); ps.push([n + 1, acc]); }
          const env = ps.map(([n, v2]) => [n, v2, Mf * r ** n]);
          SC.setView([0, 26], [Math.min(0, F.L - 0.05), Math.max(F.U, ...ps.map((p) => p[1])) + 0.12]);
          SC.path(env.map(([n, v2, e]) => [n, v2 + e]).concat(env.slice().reverse().map(([n, v2, e]) => [n, v2 - e])), { fill: 'accent', fillAlpha: 0.1, stroke: false, close: true });
          SC.hband(F.L, F.U, { color: 'green', alpha: 0.25 });
          SC.hline(F.series, { color: 'green', width: 1.2 });
          SC.tex('\\int f\\,d\\alpha', 25.6, F.U, { color: 'green', align: 'right', baseline: 'bottom', dy: -4, size: 13 });
          SC.path(ps, { color: 'gold', width: 1.6 });
          SC.dots(ps, { color: 'gold', r: 2.6 });
          SC.dot(N, ps[N - 1][1], { color: 'gold', r: 5.5 });
          v.legend([['ink', '$f$'], ['orange', 'masses $c_n$ and $\\alpha$'], ['gold', 'samples $f(s_n)$, partial sums'], ['green', '$[L,U]$, 3000 cells', { area: true }], ['accent', '$\\pm M\\sum_{n>N}c_n$', { area: true }]]);
          st = { N, SN: ps[N - 1][1], F, tail: Mf * r ** N };
        });
        v.readout(() => st ? `$\\sum_{n\\le ${st.N}}c_nf(s_n)=${num(st.SN, 4)}$; $\\;$ a partition into 3000 equal cells gives $L=${num(st.F.L, 4)}\\le\\int f\\,d\\alpha\\le U=${num(st.F.U, 4)}$, $\\;\\sum_{n}c_nf(s_n)=${num(st.F.series, 4)}$. Error bound $M\\sum_{n>N}c_n=${num(st.tail, 4)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.17
    {
      num: '6.17',
      kind: 'Theorem',
      name: 'When dα = α′ dx',
      statement: String.raw`Assume $\alpha$ increases monotonically and $\alpha'\in\mathscr R$ on $[a,b]$, and let $f$ be a bounded real function on $[a,b]$. Then $f\in\mathscr R(\alpha)$ if and only if $f\alpha'\in\mathscr R$, and in that case
$$\int_a^b f\,d\alpha=\int_a^b f(x)\,\alpha'(x)\,dx .$$`,
      idea: String.raw`Choose $P$ with $U(P,\alpha')-L(P,\alpha')<\eps$ (6.6). The mean value theorem gives $t_i$ in each cell with $\Delta\alpha_i=\alpha'(t_i)\Delta x_i$, and by 6.7(b) $\sum|\alpha'(s_i)-\alpha'(t_i)|\Delta x_i<\eps$ for any tags $s_i$. Hence the Stieltjes sum $\sum f(s_i)\Delta\alpha_i$ and the Riemann sum $\sum f(s_i)\alpha'(s_i)\Delta x_i$ differ by at most $M\eps$, $M=\sup|f|$; taking suprema over tags, $U(P,f,\alpha)$ and $U(P,f\alpha')$ are within $M\eps$, and likewise the lower sums. So the two upper integrals agree, and so do the lower ones.`,
      caption: String.raw`Left: on each cell of $\alpha$ the chord is parallel to the tangent at a mean-value point $t_i$ (gold), so $\Delta\alpha_i=\alpha'(t_i)\Delta x_i$. Right: the gold bars have height $f(s_i)\alpha'(t_i)$ — their total area is exactly the Stieltjes sum — and they hug the graph of $f\alpha'$. Move the tags or add cells and compare the two sums.`,
      deps: ['pma-6.6', 'pma-6.7', 'pma-5.10'],
      tags: ['Stieltjes integral', 'mean value theorem'],
      viz(v) {
        const a = 0, b = 1, PI = Math.PI;
        const al = (x) => (1 - Math.cos(PI * x)) / 2 + 0.1 * x, dal = (x) => (PI / 2) * Math.sin(PI * x) + 0.1;
        const A = integrator(al, dal), DA = withBreaks(dal);
        const FN = {
          cont: { label: 'continuous $f$', f: withBreaks((x) => 0.45 + 0.35 * Math.cos(5 * x)) },
          jump: { label: '$f$ with a jump', f: withBreaks((x) => (x <= 0.6 ? 0.25 + 0.6 * x : 0.95 - 0.5 * (x - 0.6)), [0.6]) },
        };
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'cont');
        const nS = v.slider('cells $n$', 1, 16, 3, { int: true });
        const tS = v.slider('tag $s_i$ within its cell', 0, 1, 0.3, { step: 0.01 });
        const SA = v.stage({ x: [-0.04, 1.04], y: [-0.06, 1.18], height: 300, weight: 1, title: '$\\alpha$: chord slope $=\\alpha\'(t_i)$ (mean value theorem)' });
        const SF = v.stage({ x: [-0.04, 1.04], y: [-0.06, 1.2], height: 300, weight: 1, title: '$f\\alpha\'$ and bars of height $f(s_i)\\,\\alpha\'(t_i)$' });
        const mvt = (u, w) => {
          const slope = (al(w) - al(u)) / (w - u), h = (t) => dal(t) - slope;
          let prev = u, hp = h(u);
          for (let k = 1; k <= 60; k++) { const t = u + (w - u) * k / 60, ht = h(t); if (hp === 0) return prev; if (hp * ht <= 0) { let lo = prev, hi = t; for (let it = 0; it < 50; it++) { const m = (lo + hi) / 2; if (h(lo) * h(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; } prev = t; hp = ht; }
          return (u + w) / 2;
        };
        let st = null;
        v.render(() => {
          const f = FN[which.value].f, fa = withBreaks((x) => f(x) * dal(x), f.breaks);
          const n = nS.value, P = uniform(a, b, n);
          const top = Math.max(...v.M.linspace(0, 1, 200).map((x) => fa(x))) * 1.3;
          SF.setView(null, [-0.05 * top, top]);
          let Sst = 0, Sri = 0;
          // α panel
          SA.fn(al, { domain: [a, b], color: 'orange', width: 2.6 });
          // fα' panel
          const cuts = [a, ...(f.breaks || []), b];
          for (let k = 1; k < cuts.length; k++) SF.fn(fa, { domain: [cuts[k - 1] + (k > 1 ? 1e-9 : 0), cuts[k] - (k < cuts.length - 1 ? 1e-9 : 0)], color: 'purple', width: 2.4, fill: 'purple', fillAlpha: 0.08 });
          for (let i = 1; i <= n; i++) {
            const u = P[i - 1], w = P[i], t = mvt(u, w), si = u + (w - u) * tS.value;
            const slope = (al(w) - al(u)) / (w - u), half = (w - u) * 0.42;
            SA.line(u, al(u), w, al(w), { color: 'muted', width: 1.2, dash: [4, 3] });
            SA.line(t - half, al(t) - slope * half, t + half, al(t) + slope * half, { color: 'gold', width: 2.4 });
            SA.dot(t, al(t), { color: 'gold', r: 3.5 });
            SA.dot(u, al(u), { color: 'orange', r: 2.5 });
            const hgt = f(si) * dal(t);
            Sst += f(si) * (al(w) - al(u)); Sri += f(si) * dal(si) * (w - u);
            SF.rect(u, 0, w, hgt, { fill: 'gold', fillAlpha: 0.28, color: 'gold', width: 1.2 });
            SF.dot(si, f(si) * dal(si), { color: 'ink', r: 3 });
            SF.line(si, 0, si, f(si) * dal(si), { color: 'ink', width: 1, dash: [2, 3], alpha: 0.6 });
          }
          for (const x of P) SA.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.35 });
          SA.tex('\\alpha', 0.93, al(0.93), { color: 'orange', align: 'right', dx: -8, dy: -6, size: 16 });
          const exact = rsIntegral(fa, integrator((x) => x, () => 1), a, b);
          const q = sums(DA, integrator((x) => x, () => 1), P);
          const Mf = Math.max(...v.M.linspace(0, 1, 300).map((x) => Math.abs(f(x))));
          v.legend([['orange', '$\\alpha$'], ['gold', 'tangent at $t_i$; bars $f(s_i)\\alpha\'(t_i)$'], ['purple', '$f\\alpha\'$', { area: true }], ['ink', 'Riemann value $f(s_i)\\alpha\'(s_i)$', { dot: true }]]);
          st = { Sst, Sri, exact, bound: Mf * (q.U - q.L) };
        });
        v.readout(() => st ? `Stieltjes $\\sum f(s_i)\\Delta\\alpha_i=${num(st.Sst, 4)}$, $\\;$ Riemann $\\sum f(s_i)\\alpha'(s_i)\\Delta x_i=${num(st.Sri, 4)}$; their gap $${num(Math.abs(st.Sst - st.Sri), 4)}\\le M\\,[U(P,\\alpha')-L(P,\\alpha')]=${num(st.bound, 4)}$. $\\;\\int f\\alpha'\\,dx=${num(st.exact, 4)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.19
    {
      num: '6.19',
      kind: 'Theorem',
      name: 'Change of variable',
      statement: String.raw`Let $\varphi$ be a strictly increasing continuous function mapping an interval $[A,B]$ onto $[a,b]$. Let $\alpha$ be monotonically increasing on $[a,b]$ and $f\in\mathscr R(\alpha)$ on $[a,b]$. Define $\beta(y)=\alpha(\varphi(y))$ and $g(y)=f(\varphi(y))$ for $A\le y\le B$. Then $g\in\mathscr R(\beta)$ and
$$\int_A^B g\,d\beta=\int_a^b f\,d\alpha .$$`,
      idea: String.raw`Because $\varphi$ is a strictly increasing bijection, partitions $Q=\{y_i\}$ of $[A,B]$ and $P=\{x_i\}$ of $[a,b]$ correspond via $x_i=\varphi(y_i)$, and every partition of either interval arises this way. Corresponding cells carry the same weight, $\Delta\beta_i=\Delta\alpha_i$, and $g$ on $[y_{i-1},y_i]$ takes exactly the values of $f$ on $[x_{i-1},x_i]$. So $U(Q,g,\beta)=U(P,f,\alpha)$ and $L(Q,g,\beta)=L(P,f,\alpha)$, and the infima and suprema agree. With $\alpha(x)=x$ and $\varphi\in\mathscr R'$ this is the usual substitution rule $\int_A^B f(\varphi(y))\varphi'(y)\,dy=\int_a^b f\,dx$ (via 6.17).`,
      caption: String.raw`Drag the partition points of $Q$ on the left. The bottom panel shows $\varphi$ carrying them to the points of $P$ on the right. Numbered cells correspond; the readout computes the sums on both sides independently — they are equal, partition by partition. The jumps of $\alpha$ (orange) become jumps of $\beta$ at $\varphi^{-1}$ of the same points.`,
      deps: ['pma-6.2', 'pma-6.6'],
      tags: ['change of variable', 'substitution'],
      viz(v) {
        const A0 = 0, B0 = 2, a = 0, b = 1;
        const phi = (y) => 0.5 * (y / 2) + 0.5 * (y / 2) ** 3, dphi = (y) => 0.25 + 0.75 * (y / 2) ** 2;
        const phiInv = (x) => { let lo = A0, hi = B0; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (phi(m) < x) lo = m; else hi = m; } return (lo + hi) / 2; };
        const Al = ALPHA();
        const Be = integrator((y) => Al.cont(phi(y)), (y) => Al.dens(phi(y)) * dphi(y), Al.jumps.map(([p, w]) => [phiInv(p), w]));
        const f = withBreaks((x) => 0.5 + 0.3 * Math.sin(6 * x) + 0.2 * x);
        const g = withBreaks((y) => f(phi(y)));
        let H = null;
        v.slider('cells $n$', 1, 8, 4, { int: true, onChange: (n) => H.reset(n) });
        const SG = v.stage({ x: [-0.08, 2.08], y: [-0.1, 1.12], height: 230, weight: 1, title: '$g=f\\circ\\varphi$ on $[A,B]=[0,2]$, partition $Q$' });
        const SF = v.stage({ x: [-0.04, 1.04], y: [-0.1, 1.12], height: 230, weight: 1, title: '$f$ on $[a,b]=[0,1]$, partition $P=\\varphi(Q)$' });
        const SP = v.stage({ x: [-0.08, 2.08], y: [-0.08, 1.08], height: 200, full: true, xlabel: 'y', title: '$x=\\varphi(y)$ carries $Q$ to $P$' });
        H = partitionHandles(SG, A0, B0, 7, 0, 'orange');
        H.reset(4);
        let st = null;
        v.render(() => {
          const Q = H.points(), P = Q.map(phi);
          const sg = sums(g, Be, Q), sf = sums(f, Al, P);
          const draw = (St, cells, fn, lo, hi, jumps) => {
            cells.forEach((c, i) => {
              St.rect(c.u, 0, c.w, c.M, { fill: 'purple', fillAlpha: 0.12, color: 'purple', width: 1.1, alpha: 0.8 });
              St.rect(c.u, 0, c.w, c.m, { fill: 'teal', fillAlpha: 0.24, color: 'teal', width: 1.1, alpha: 0.8 });
              if (St.X(c.w) - St.X(c.u) > 16) St.text(String(i + 1), (c.u + c.w) / 2, 0.05, { color: 'ink', size: 12, align: 'center', weight: 600 });
            });
            for (const [p] of jumps) St.vline(p, { color: 'orange', width: 1.3, dash: [2, 3], alpha: 0.8 });
            St.fn(fn, { domain: [lo, hi], color: 'ink', width: 2.4 });
          };
          draw(SG, sg.cells, g, A0, B0, Be.jumps);
          draw(SF, sf.cells, f, a, b, Al.jumps);
          // φ panel
          SP.fn(phi, { domain: [A0, B0], color: 'ink', width: 2.4 });
          Q.forEach((y, i) => {
            const x = phi(y);
            SP.line(y, -0.08, y, x, { color: 'orange', width: 1, dash: [3, 3], alpha: 0.8 });
            SP.line(-0.08, x, y, x, { color: 'accent', width: 1, dash: [3, 3], alpha: 0.8 });
            SP.dot(y, x, { color: 'orange', r: 3.5 });
          });
          for (const [p] of Al.jumps) { const y = phiInv(p); SP.dot(y, p, { color: 'orange', r: 5, hollow: true }); }
          SP.tex('\\varphi', 1.85, phi(1.85), { color: 'ink', align: 'right', dx: -10, dy: -4, size: 16 });
          v.legend([['ink', '$g$, $f$, $\\varphi$'], ['purple', 'upper sums', { area: true }], ['teal', 'lower sums', { area: true }], ['orange', 'points of $Q$; jumps of $\\beta$, $\\alpha$', { dash: true }]]);
          st = { sg, sf, Ig: rsIntegral(g, Be, A0, B0), If: rsIntegral(f, Al, a, b) };
        });
        v.readout(() => st ? `$U(Q,g,\\beta)=${num(st.sg.U, 4)}$, $U(P,f,\\alpha)=${num(st.sf.U, 4)}$; $\\;L(Q,g,\\beta)=${num(st.sg.L, 4)}$, $L(P,f,\\alpha)=${num(st.sf.L, 4)}$. $\\;\\int_A^B g\\,d\\beta=${num(st.Ig, 4)}$, $\\int_a^b f\\,d\\alpha=${num(st.If, 4)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.20
    {
      num: '6.20',
      kind: 'Theorem',
      name: 'The integral as a function of its upper limit',
      statement: String.raw`Let $f\in\mathscr R$ on $[a,b]$ and put $F(x)=\int_a^x f(t)\,dt$ for $a\le x\le b$. Then $F$ is continuous on $[a,b]$. Moreover, if $f$ is continuous at a point $x_0$ of $[a,b]$, then $F$ is differentiable at $x_0$ and $F'(x_0)=f(x_0)$.`,
      idea: String.raw`With $|f|\le M$, parts (c) and (d) of 6.12 give $|F(y)-F(x)|=\bigl|\int_x^y f\bigr|\le M|y-x|$, so $F$ is even uniformly (Lipschitz) continuous. If $f$ is continuous at $x_0$, choose $\delta$ with $|f(u)-f(x_0)|<\eps$ for $|u-x_0|<\delta$; a difference quotient of $F$ over $[s,t]\ni x_0$ is the average of $f$ over $[s,t]$, so it lies within $\eps$ of $f(x_0)$.`,
      caption: String.raw`Drag $x_0$ along the axis (it snaps to the two special points) and shrink $h$. The secant slopes of $F$ over $[x_0,x_0+h]$ and $[x_0-h,x_0]$ tend to $f(x_0)$ where $f$ is continuous. At the jump ($0.6$) they tend to different one-sided values — $F$ has a corner, though the grey Lipschitz cone keeps it continuous. At $0.25$, where $f$ has a removable discontinuity, $F'$ exists but is not $f(0.25)$.`,
      deps: ['pma-6.12'],
      see: ['rca-7.11'],
      tags: ['fundamental theorem', 'area function'],
      viz(v) {
        const a = 0, b = 1, xj = 0.6, xr = 0.25, jump = 0.4, bump = 0.45;
        const base = (x) => 0.35 + 0.25 * Math.sin(6 * x) + 0.3 * x;
        const f = withBreaks((x) => (x === xr ? base(x) + bump : base(x) + (x > xj ? jump : 0)), [xr, xj]);
        const F = (x) => simpson(base, a, x, 200) + (x > xj ? jump * (x - xj) : 0);
        const Mf = Math.max(...v.M.linspace(0, 1, 400).map((x) => Math.abs(f(x))));
        const hS = v.slider('$h$', 0.003, 0.3, 0.12, { log: true, fmt: (x) => x.toFixed(3) });
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.08, 1.3], height: 220, full: true, xlabel: 't', title: '$f$ and the area $F(x_0)=\\int_a^{x_0}f$' });
        const SF = v.stage({ x: [-0.04, 1.04], y: [-0.08, 0.75], height: 250, full: true, xlabel: 'x', title: '$F$, the secants over $[x_0,x_0\\pm h]$, and the cone $|F(x)-F(x_0)|\\le M|x-x_0|$' });
        const xh = S.handle(0.42, 0, { color: 'gold', label: 'x₀', constrain: (x) => { let xx = clamp(x, 0.02, 0.98); for (const p of [xr, xj]) if (Math.abs(xx - p) < 0.015) xx = p; return [xx, 0]; } });
        let st = null;
        v.render(() => {
          const x0 = xh.x, h = hS.value;
          // top: f and the area up to x0
          S.fn((t) => (Math.abs(t - xr) < 1e-9 ? base(t) : f(t)), { domain: [a, Math.min(x0, xj)], fill: 'accent', fillAlpha: 0.18, stroke: false });
          if (x0 > xj) S.fn(f, { domain: [xj + 1e-9, x0], fill: 'accent', fillAlpha: 0.18, stroke: false });
          drawF(S, f, a, b);
          S.vline(x0, { color: 'gold', width: 1.3, dash: [4, 3] });
          // bottom: F, cone and secants
          const F0 = F(x0);
          SF.path([[x0 - 1, F0 - Mf], [x0, F0], [x0 + 1, F0 - Mf], [x0 + 1, F0 + Mf], [x0, F0], [x0 - 1, F0 + Mf]], { fill: 'gray', fillAlpha: 0.1, stroke: false, close: true });
          SF.fn(F, { domain: [a, b], color: 'ink', width: 2.4, n: 300 });
          const xr2 = Math.min(b, x0 + h), xl2 = Math.max(a, x0 - h);
          const qr = (F(xr2) - F0) / (xr2 - x0), ql = (F0 - F(xl2)) / (x0 - xl2);
          const ext = 0.22;
          SF.line(x0 - ext, F0 - qr * ext, x0 + ext + h, F0 + qr * (ext + h), { color: 'green', width: 1.8 });
          SF.line(x0 - ext - h, F0 - ql * (ext + h), x0 + ext, F0 + ql * ext, { color: 'purple', width: 1.8 });
          SF.dot(xr2, F(xr2), { color: 'green', r: 4 }); SF.dot(xl2, F(xl2), { color: 'purple', r: 4 });
          SF.dot(x0, F0, { color: 'gold', r: 5 });
          v.legend([['ink', '$f$ and $F$'], ['green', 'right secant, slope $\\frac{F(x_0+h)-F(x_0)}{h}$'], ['purple', 'left secant'], ['gray', 'Lipschitz cone, slopes $\\pm M$', { area: true }]]);
          st = { x0, qr, ql, fx: f(x0), fl: f(x0 - 1e-9), fr: f(x0 + 1e-9) };
        });
        v.readout(() => {
          if (!st) return '';
          const head = `$x_0=${num(st.x0, 3)}$: $\\;$right quotient $${num(st.qr, 4)}$, left quotient $${num(st.ql, 4)}$, $\\;f(x_0)=${num(st.fx, 4)}$. `;
          if (Math.abs(st.x0 - xj) < 1e-9) return head + `Jump of $f$: the quotients tend to $f(x_0+)=${num(st.fr, 3)}$ and $f(x_0-)=${num(st.fl, 3)}$ — $F$ is continuous but has no derivative here.`;
          if (Math.abs(st.x0 - xr) < 1e-9) return head + `Both tend to $${num(st.fl, 3)}$, the limit of $f$ — so $F'(x_0)$ exists, yet differs from $f(x_0)$: continuity of $f$ at $x_0$ was needed for $F'=f$.`;
          return head + '$f$ is continuous here, so both tend to $f(x_0)=F\'(x_0)$.';
        });
      },
    },
  ],
};
