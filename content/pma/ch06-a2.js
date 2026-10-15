// Rudin, Principles of Mathematical Analysis — Chapter 6: The Riemann–Stieltjes Integral (part a2)

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

/** Largest oscillation of the samples ys over any window of w consecutive steps (monotone deques). */
function windowOsc(ys, w) {
  const n = ys.length;
  if (w <= 0) return 0;
  if (w >= n - 1) return Math.max(...ys) - Math.min(...ys);
  const mx = new Int32Array(n), mn = new Int32Array(n);
  let h1 = 0, t1 = 0, h2 = 0, t2 = 0, best = 0;
  for (let i = 0; i < n; i++) {
    while (t1 > h1 && ys[mx[t1 - 1]] <= ys[i]) t1--; mx[t1++] = i;
    while (t2 > h2 && ys[mn[t2 - 1]] >= ys[i]) t2--; mn[t2++] = i;
    while (mx[h1] < i - w) h1++;
    while (mn[h2] < i - w) h2++;
    if (i >= w) best = Math.max(best, ys[mx[h1]] - ys[mn[h2]]);
  }
  return best;
}
/** Sampled modulus of continuity of g on [lo, hi]: {omega(δ), deltaFor(η)} with N grid steps. */
function modulus(g, lo, hi, N = 2000) {
  const ys = Array.from({ length: N + 1 }, (_, i) => g(lo + (hi - lo) * i / N));
  const step = (hi - lo) / N;
  return {
    omega: (d) => windowOsc(ys, Math.round(d / step)),
    /** largest δ (on the grid) whose window oscillation stays below η */
    deltaFor(eta) {
      let lo2 = 0, hi2 = N;
      if (windowOsc(ys, N) < eta) return hi - lo;
      while (hi2 - lo2 > 1) { const mid = (lo2 + hi2) >> 1; if (windowOsc(ys, mid) < eta) lo2 = mid; else hi2 = mid; }
      return lo2 * step;
    },
  };
}
/** Points (α(x) − α(lo), f(x)) for x in [lo, hi]: a jump of α becomes a flat run at height f(p). */
function alphaCurve(A, f, lo, hi, a, n = 160) {
  const js = A.jumps.filter(([p]) => p >= lo && p < hi).sort((x, y) => x[0] - y[0]);
  const cuts = [lo, ...js.map(([p]) => p), hi];
  const pts = [];
  for (let i = 1; i < cuts.length; i++) {
    const u = cuts[i - 1], w = cuts[i], k = Math.max(8, Math.round(n * (w - u)));
    if (i > 1) pts.push([A(u) + js[i - 2][1] - A(a), f(u)]);
    for (let j = i > 1 ? 1 : 0; j <= k; j++) { const x = u + (w - u) * j / k; pts.push([A(x) - A(a), f(x)]); }
  }
  return pts;
}

export default {
  collection: 'pma',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.8
    {
      num: '6.8',
      kind: 'Theorem',
      name: 'Continuous functions are integrable',
      statement: String.raw`If $f$ is continuous on $[a,b]$, then $f\in\mathscr R(\alpha)$ on $[a,b]$ (for every monotonically increasing $\alpha$, continuous or not).`,
      idea: String.raw`Given $\eps>0$ choose $\eta>0$ with $[\alpha(b)-\alpha(a)]\,\eta<\eps$. Since $[a,b]$ is compact, $f$ is uniformly continuous (4.19): some $\delta>0$ makes $|f(x)-f(t)|<\eta$ whenever $|x-t|<\delta$. On any partition whose cells are shorter than $\delta$ we get $M_i-m_i\le\eta$ in every cell, hence $U-L\le\eta\,[\alpha(b)-\alpha(a)]<\eps$, and 6.6 applies.`,
      caption: String.raw`Choose $\eps$: the viz computes $\eta=\eps/[\alpha(1)-\alpha(0)]$, reads off a $\delta$ from the modulus of continuity $\omega$ (lower panel), and uses equal cells shorter than $\delta$. Every box $[m_i,M_i]$ is then at most $\eta$ tall (the ruler on the right). The steep $\sqrt x$ needs a much smaller $\delta$ — but one still exists.`,
      deps: ['pma-6.6', 'pma-4.19'],
      tags: ['integrability', 'uniform continuity'],
      viz(v) {
        const a = 0, b = 1, A = ALPHA(), Atot = A(b) - A(a);
        const FN = {
          wave: { label: '$\\tfrac12+0.3\\sin 7x$', f: withBreaks((x) => 0.5 + 0.3 * Math.sin(7 * x) + 0.1 * x) },
          root: { label: '$\\sqrt{x}$', f: withBreaks((x) => Math.sqrt(Math.max(0, x))) },
        };
        const mods = {};
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'wave');
        const eps = v.slider('$\\varepsilon$', 0.08, 0.6, 0.3, { step: 0.01 });
        const S = v.stage({ x: [-0.04, 1.08], y: [-0.08, 1.12], height: 290, full: true, xlabel: 'x' });
        const W = v.stage({ x: [0, 0.25], y: [0, 0.7], height: 170, axes: 'box', full: true, xlabel: 'δ', title: 'modulus of continuity $\\omega(\\delta)=\\sup\\{|f(s)-f(t)|:|s-t|\\le\\delta\\}$' });
        let st = null;
        v.render(() => {
          const key = which.value, f = FN[key].f;
          const md = mods[key] ||= modulus(f, a, b, 2000);
          const eta = 0.98 * eps.value / Atot;
          const delta = Math.max(1e-4, md.deltaFor(eta));
          const n = Math.min(900, Math.floor((b - a) / delta) + 1);
          const P = uniform(a, b, n);
          const { U, L, cells } = sums(f, A, P);
          const maxOsc = Math.max(...cells.map((c) => c.M - c.m));
          for (const c of cells) S.rect(c.u, c.m, c.w, c.M, n > 60 ? { fill: 'green', fillAlpha: 0.3, stroke: false } : { fill: 'green', fillAlpha: 0.28, color: 'green', width: 1, alpha: 0.7 });
          if (n <= 60) for (const x of P) S.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.35 });
          for (const [p] of A.jumps) S.vline(p, { color: 'orange', width: 1.4, dash: [2, 3], alpha: 0.8 });
          S.fn(f, { domain: [a, b], color: 'ink', width: 2.4 });
          // η ruler and δ measure
          S.line(1.045, 0.08, 1.045, 0.08 + eta, { color: 'accent', width: 5, cap: 'butt' });
          S.tex('\\eta', 1.045, 0.08 + eta, { color: 'accent', baseline: 'bottom', dy: -3, size: 15 });
          const d0 = 0.02;
          S.measure(d0, 1.06, d0 + Math.max(delta, 0.004), 1.06, null, { color: 'orange' });
          S.tex(`\\delta=${num(delta, 4)}`, d0 + Math.max(delta, 0.004), 1.06, { color: 'orange', align: 'left', dx: 6, size: 13 });
          S.corner(`${n} equal cells`, 'tr');
          // modulus of continuity
          const xmax = Math.max(0.25, delta * 2.2);
          const ys = v.M.linspace(0, xmax, 140).map((d) => [d, md.omega(d)]);
          const wTop = Math.max(eta * 1.6, ys[ys.length - 1][1] * 1.08);
          W.setView([0, xmax], [-0.06 * wTop, wTop]);
          W.path(ys, { color: 'ink', width: 2.2 });
          W.hline(eta, { color: 'accent', dash: [6, 4], width: 1.5 });
          W.tex('\\eta', xmax, eta, { color: 'accent', align: 'right', baseline: 'bottom', dx: -6, dy: -2, size: 14 });
          W.vline(delta, { color: 'orange', width: 1.5 });
          W.dot(delta, md.omega(delta), { color: 'orange', r: 4.5 });
          v.legend([['ink', '$f$'], ['green', 'boxes $[m_i,M_i]$, each of height $\\le\\eta$', { area: true }], ['orange', 'jumps of $\\alpha$; $\\delta$', { dash: true }], ['accent', '$\\eta=\\varepsilon/[\\alpha(1)-\\alpha(0)]$']]);
          st = { eta, delta, n, maxOsc, gap: U - L };
        });
        v.readout(() => st ? `$\\eta=${num(st.eta)}$, $\\delta=${num(st.delta, 4)}$, $n=${st.n}$ cells shorter than $\\delta$: $\\max_i(M_i-m_i)=${num(st.maxOsc)}\\le\\eta$, so $U-L=${num(st.gap, 4)}\\le\\eta[\\alpha(1)-\\alpha(0)]<\\varepsilon$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.9
    {
      num: '6.9',
      kind: 'Theorem',
      name: 'Monotone f against continuous α is integrable',
      statement: String.raw`If $f$ is monotonic on $[a,b]$ and $\alpha$ is continuous on $[a,b]$ (and, as always, monotonically increasing), then $f\in\mathscr R(\alpha)$.`,
      idea: String.raw`Because $\alpha$ is continuous, the intermediate value theorem lets us pick $x_0<x_1<\dots<x_n$ with every $\Delta\alpha_i$ equal to $[\alpha(b)-\alpha(a)]/n$. For increasing $f$ we have $M_i=f(x_i)$ and $m_i=f(x_{i-1})$, so the sum telescopes:
$$U-L=\frac{\alpha(b)-\alpha(a)}{n}\sum_{i=1}^n\bigl[f(x_i)-f(x_{i-1})\bigr]=\frac{[\alpha(b)-\alpha(a)]\,[f(b)-f(a)]}{n},$$
which is $<\eps$ for large $n$. Note that $f$ may have many jumps.`,
      caption: String.raw`Left: equal slices of the range of $\alpha$ are pulled back to $x$, so the cells are unequal but all carry the same weight $\Delta\alpha_i$. Right: the boxes $[f(x_{i-1}),f(x_i)]$ of a jumpy increasing $f$ stack, without overlap, into the strip $[f(a),f(b)]$ — that is the telescoping. Switch to an $\alpha$ that jumps where $f$ does: equal slices are impossible and $U-L$ stalls.`,
      deps: ['pma-6.6', 'pma-4.23'],
      tags: ['integrability', 'monotone functions'],
      viz(v) {
        const a = 0, b = 1, s = 0.45;
        const AS = {
          cont: integrator((x) => x * x * x + 0.3 * x, (x) => 3 * x * x + 0.3),
          jump: integrator((x) => 0.6 * x, () => 0.6, [[s, 0.7]]),
        };
        const f = withBreaks((x) => 0.12 + 0.3 * x + 0.12 * x * x + 0.2 * (x > 0.2) + 0.25 * (x > s) + 0.1 * (x > 0.75), [0.2, s, 0.75]);
        const which = v.select('$\\alpha$', [{ value: 'cont', label: 'continuous: $x^3+0.3x$' }, { value: 'jump', label: 'jumps by $0.7$ at $0.45$' }], 'cont');
        const nS = v.slider('$n$', 1, 30, 7, { int: true });
        const SA = v.stage({ x: [-0.06, 1.04], y: [-0.08, 1.38], height: 320, weight: 1, title: 'equal slices of $\\alpha$, pulled back to $x$' });
        const SF = v.stage({ x: [-0.04, 1.3], y: [-0.06, 1.24], height: 320, weight: 1, title: 'boxes $[f(x_{i-1}),f(x_i)]$, stacked on the right' });
        const inv = (A, y) => { let lo = a, hi = b; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (A(m) >= y) hi = m; else lo = m; } return hi; };
        let st = null;
        v.render(() => {
          const A = AS[which.value], n = nS.value, A0 = A(a), A1 = A(b);
          const levels = uniform(A0, A1, n);
          const P = levels.map((y, i) => (i === 0 ? a : i === n ? b : inv(A, y)));
          const { U, L, cells } = sums(f, A, P);
          // α panel
          levels.forEach((y, i) => {
            const x = P[i];
            SA.line(-0.03, y, x, y, { color: 'orange', width: 1, alpha: 0.55, dash: [3, 3] });
            SA.line(x, y, x, 0, { color: 'muted', width: 1, alpha: 0.6, dash: [3, 3] });
          });
          drawAlpha(SA, A, a, b);
          levels.forEach((y, i) => SA.dot(P[i], A(P[i]), { color: 'orange', r: 3 }));
          for (let i = 1; i <= n; i++) SA.line(-0.03, levels[i - 1], -0.03, levels[i], { color: 'orange', width: 6, cap: 'butt', alpha: i % 2 ? 1 : 0.45 });
          // f panel
          const span = f(b) - f(a);
          cells.forEach((c, i) => {
            const col = i % 2 ? 'teal' : 'accent';
            SF.rect(c.u, c.m, c.w, c.M, { fill: col, fillAlpha: 0.3, color: col, width: 1, alpha: 0.7 });
            SF.rect(1.08, c.m, 1.16, c.M, { fill: col, fillAlpha: 0.45, color: 'panel', width: 0.8 });
          });
          for (const x of P) SF.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.4 });
          drawF(SF, f, a, b);
          SF.tex('f(b)', 1.17, f(b), { color: 'ink', align: 'left', dx: 2, size: 12.5 });
          SF.tex('f(a)', 1.17, f(a), { color: 'ink', align: 'left', dx: 2, size: 12.5 });
          if (which.value === 'jump') SF.vline(s, { color: 'red', width: 1.4, dash: [2, 3] });
          const formula = (A1 - A0) * span / n;
          v.legend([['ink', 'increasing $f$ (three jumps)'], ['orange', '$\\alpha$ and equal slices $\\Delta\\alpha_i$'], ['accent', 'boxes $[m_i,M_i]$, alternating colours', { area: true }]]);
          st = { U, L, formula, n, A1, A0, span, jump: which.value === 'jump' };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.jump) return `With a jump of $\\alpha$ at $0.45$ the slices inside the jump all land on $x=0.45$, so the cells cannot have equal $\\Delta\\alpha_i$. The cell starting at $0.45$ carries weight $\\ge 0.7$ and contains the jump $0.25$ of $f$: $U-L=${num(st.U - st.L)}\\ge 0.175$ for every $n$.`;
          return `$\\Delta\\alpha_i=${num((st.A1 - st.A0) / st.n, 4)}$ for every $i$. $\\;U-L=${num(st.U - st.L, 4)}$, $\\;\\frac{[\\alpha(b)-\\alpha(a)][f(b)-f(a)]}{n}=${num(st.formula, 4)}$ — equal, and $\\to0$ as $n\\to\\infty$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.10
    {
      num: '6.10',
      kind: 'Theorem',
      name: 'Finitely many discontinuities, away from jumps of α',
      statement: String.raw`Suppose $f$ is bounded on $[a,b]$, has only finitely many points of discontinuity there, and $\alpha$ is continuous at every point where $f$ is discontinuous. Then $f\in\mathscr R(\alpha)$.`,
      idea: String.raw`Let $\eps>0$ and $M=\sup|f|$. Because $\alpha$ is continuous at each discontinuity $e_j$ of $f$, we can enclose the $e_j$ in finitely many small disjoint intervals $[u_j,v_j]$ whose total $\alpha$-mass $\sum[\alpha(v_j)-\alpha(u_j)]$ is below $\eps$. On the compact set left over, $f$ is continuous, hence uniformly continuous, and fine cells there have oscillation below $\eps$. A partition using the $u_j,v_j$ then gives $U-L\le[\alpha(b)-\alpha(a)]\eps+2M\eps$.`,
      caption: String.raw`$f$ jumps at $0.30$ and $0.65$ (red covers around them). Drag the gold point to move the jump of $\alpha$. Away from the jumps of $f$, the covers carry little $\alpha$-mass and $U-L\to0$ (lower right, log scale, equal cells). Drop it onto a jump of $f$ (it snaps): the cover's mass can no longer be made small and $U-L$ levels off at the red floor.`,
      deps: ['pma-6.6', 'pma-4.19'],
      see: ['pma-11.33'],
      tags: ['integrability', 'discontinuities'],
      viz(v) {
        const a = 0, b = 1, E = [0.3, 0.65], wj = 0.5;
        const f = withBreaks((x) => (x <= 0.3 ? 0.35 + 0.3 * Math.sin(6 * x) : x <= 0.65 ? 0.95 - 0.5 * (x - 0.3) : 0.25 + 0.35 * (x - 0.65) + 0.1 * Math.sin(14 * x)), E);
        const jumpOf = (e) => Math.abs(f(e + 1e-9) - f(e));
        const r = v.slider('cover radius $r$', 0.005, 0.08, 0.03, { step: 0.001 });
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.1, 1.12], height: 270, full: true, xlabel: 'x', title: '$f$, the covers $[e_j-r,e_j+r]$ of its discontinuities, and the jump of $\\alpha$' });
        const SA = v.stage({ x: [-0.04, 1.04], y: [-0.08, 1.3], height: 190, weight: 1, xticks: [], title: 'the integrator $\\alpha=0.7x+0.5\\,I(x-s)$' });
        const SG = v.stage({ x: [0.2, 2.5], y: [-3.55, 0.25], height: 190, weight: 1.2, axes: 'box', xticks: [[Math.log10(2), '2'], [1, '10'], [2, '100']], yticks: [[-3, '0.001'], [-2, '0.01'], [-1, '0.1'], [0, '1']], title: '$U-L$ for $n$ equal cells (log–log)' });
        const sh = S.handle(0.84, 0, { color: 'gold', label: 's', constrain: (x) => { let xx = clamp(x, 0.03, 0.97); for (const e of E) if (Math.abs(xx - e) < 0.02) xx = e; return [xx, 0]; } });
        const NS = [2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256];
        let st = null;
        v.render(() => {
          const s = sh.x;
          const A = integrator((x) => 0.7 * x, () => 0.7, [[s, wj]]);
          const hit = E.find((e) => Math.abs(e - s) < 1e-9);
          // covers
          let mass = 0;
          for (const e of E) {
            const u = e - r.value, w = e + r.value;
            S.vband(u, w, { color: 'red', alpha: 0.13 });
            mass += A(w) - A(u);
          }
          S.vline(s, { color: 'gold', width: 1.5, dash: [4, 3] });
          drawF(S, f, a, b);
          for (const e of E) S.tex(`e=${e.toFixed(2)}`, e, 1.1, { color: 'red', baseline: 'top', size: 12.5 });
          // α panel
          drawAlpha(SA, A, a, b);
          for (const e of E) SA.vband(e - r.value, e + r.value, { color: 'red', alpha: 0.13 });
          // U − L against n
          const pts = NS.map((n) => { const q = sums(f, A, uniform(a, b, n)); return [Math.log10(n), Math.log10(Math.max(1e-6, q.U - q.L))]; });
          SG.path(pts, { color: hit != null ? 'red' : 'green', width: 2.2 });
          SG.dots(pts, { color: hit != null ? 'red' : 'green', r: 3 });
          if (hit != null) { const fl = wj * jumpOf(hit); SG.hline(Math.log10(fl), { color: 'red', dash: [5, 4], width: 1.4 }); SG.text(`floor ${num(fl, 3)}`, 2.45, Math.log10(fl), { color: 'red', size: 11, align: 'right', baseline: 'bottom', dy: -3 }); }
          v.legend([['ink', '$f$'], ['red', 'covers of the discontinuities', { area: true }], ['gold', 'jump of $\\alpha$ at $s$', { dash: true }], [hit != null ? 'red' : 'green', '$U-L$ vs $n$']]);
          st = { s, hit, mass, last: Math.pow(10, pts[pts.length - 1][1]) };
        });
        v.readout(() => {
          if (!st) return '';
          const m = `$\\alpha$-mass of the covers $=${num(st.mass, 3)}$`;
          if (st.hit != null) return `$s=${num(st.s, 2)}$ is a discontinuity of $f$: the hypothesis fails. ${m}, never below $0.5$ however small $r$ is; $U-L$ at $n=256$ is $${num(st.last, 3)}$ and stays there.`;
          return `$s=${num(st.s, 2)}$: $\\alpha$ is continuous at both $e_j$. ${m} $\\to 0$ as $r\\to0$, and $U-L=${num(st.last, 4)}$ at $n=256$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.11
    {
      num: '6.11',
      kind: 'Theorem',
      name: 'A continuous function of an integrable function',
      statement: String.raw`Suppose $f\in\mathscr R(\alpha)$ on $[a,b]$, $m\le f\le M$, $\varphi$ is continuous on $[m,M]$, and $h(x)=\varphi(f(x))$ on $[a,b]$. Then $h\in\mathscr R(\alpha)$ on $[a,b]$.`,
      idea: String.raw`Fix $\eps>0$ and use uniform continuity of $\varphi$ to get $\delta<\eps$ with $|\varphi(s)-\varphi(t)|<\eps$ whenever $|s-t|\le\delta$. Take $P$ with $U(P,f,\alpha)-L(P,f,\alpha)<\delta^2$. On *good* cells ($M_i-m_i<\delta$) the oscillation of $h$ is at most $\eps$. The *bad* cells satisfy $\delta\sum_B\Delta\alpha_i\le\sum_B(M_i-m_i)\Delta\alpha_i<\delta^2$, so their total weight is below $\delta$, and there $h$ oscillates by at most $2K$, $K=\sup|\varphi|$. Altogether $U(P,h,\alpha)-L(P,h,\alpha)<\eps[\alpha(b)-\alpha(a)]+2K\delta$.`,
      caption: String.raw`Pick $\varphi$ and $\eps$. The viz finds $\delta$ for $\varphi$ (right), refines a partition until $U(P,f)-L(P,f)<\delta^2$, and colours cells good (green) or bad (red). Bottom: the boxes of $h=\varphi\circ f$ — tall only on the few bad cells near the jump of $f$, whose total $\alpha$-weight is below $\delta$.`,
      deps: ['pma-6.6', 'pma-4.19'],
      tags: ['integrability', 'composition'],
      viz(v) {
        const a = 0, b = 1;
        const A = integrator((x) => 0.5 * x + 0.3 * x * x, (x) => 0.5 + 0.6 * x, [[0.78, 0.3]]);
        const f = withBreaks((x) => (x <= 0.42 ? 0.35 + 0.3 * Math.sin(7 * x + 0.3) : 0.95 - 1.5 * (x - 0.42) ** 2), [0.42]);
        const PHI = {
          sin: { label: '$\\varphi(y)=\\tfrac12+0.45\\sin 9y$', g: (y) => 0.5 + 0.45 * Math.sin(9 * y) },
          root: { label: '$\\varphi(y)=1.2\\sqrt{|y-\\frac12|}$', g: (y) => 1.2 * Math.sqrt(Math.abs(y - 0.5)) },
          abs: { label: '$\\varphi(y)=|2y-1|$', g: (y) => Math.abs(2 * y - 1) },
        };
        const mods = {};
        const which = v.select('', Object.entries(PHI).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const eps = v.slider('$\\varepsilon$', 0.15, 0.6, 0.4, { step: 0.01 });
        const SF = v.stage({ x: [-0.04, 1.04], y: [-0.06, 1.06], height: 300, weight: 1, title: '$f\\in\\mathscr R(\\alpha)$: good cells and bad cells' });
        const SP = v.stage({ x: [-0.06, 1.06], y: [-0.06, 1.06], height: 300, weight: 1, xlabel: 'y', title: '$\\varphi$ on $[0,1]$: a $\\delta$-window (orange) maps into a band of height $<\\varepsilon$' });
        const SH = v.stage({ x: [-0.04, 1.04], y: [-0.06, 1.06], height: 230, full: true, title: '$h=\\varphi\\circ f$ and its boxes $[m_i^*,M_i^*]$' });
        let st = null, cacheKey = '', cache = null;
        const refine = (target) => {
          const P = [a, b]; let cells = sums(f, A, P).cells;
          let gap = cells.reduce((s, c) => s + (c.M - c.m) * c.da, 0);
          while (gap >= target && cells.length < 900) {
            let bi = 0, bg = -1; cells.forEach((c, i) => { const g = (c.M - c.m) * c.da; if (g > bg) { bg = g; bi = i; } });
            const c = cells[bi], mid = (c.u + c.w) / 2;
            const l = sums(f, A, [c.u, mid]).cells[0], r = sums(f, A, [mid, c.w]).cells[0];
            cells.splice(bi, 1, l, r);
            gap += (l.M - l.m) * l.da + (r.M - r.m) * r.da - bg;
          }
          return cells;
        };
        v.render(() => {
          const phi = PHI[which.value].g;
          const md = mods[which.value] ||= modulus(phi, 0, 1, 2000);
          const delta = Math.min(0.99 * eps.value, md.deltaFor(eps.value));
          const key = which.value + '|' + eps.value;
          if (key !== cacheKey) { cacheKey = key; cache = refine(delta * delta); }
          const cells = cache;
          const K = Math.max(...v.M.linspace(0, 1, 400).map((y) => Math.abs(phi(y))));
          const H = withBreaks((x) => phi(f(x)), f.breaks);
          let gapF = 0, badW = 0, U = 0, L = 0;
          const hcells = cells.map((c) => {
            const [hm, hM] = supInf(H, c.u, c.w, 32);
            const bad = c.M - c.m >= delta;
            gapF += (c.M - c.m) * c.da; if (bad) badW += c.da;
            U += hM * c.da; L += hm * c.da;
            return { ...c, hm, hM, bad };
          });
          // f panel: partition ticks show where the refinement went; bad cells get a minimum visible width
          const badBand = (St, c) => { const mid = (c.u + c.w) / 2, hw = Math.max((c.w - c.u) / 2, 3.5 / St.scale); St.vband(mid - hw, mid + hw, { color: 'red', alpha: 0.28 }); };
          for (const c of hcells) {
            if (c.bad) badBand(SF, c);
            else SF.rect(c.u, c.m, c.w, c.M, { fill: 'green', fillAlpha: 0.35, stroke: false });
          }
          for (const c of hcells) SF.line(c.u, -0.06, c.u, -0.025, { color: c.bad ? 'red' : 'muted', width: 1, alpha: 0.7 });
          drawF(SF, f, a, b);
          for (const [p] of A.jumps) SF.vline(p, { color: 'orange', width: 1.3, dash: [2, 3], alpha: 0.8 });
          SF.corner(`${cells.length} cells`, 'tr');
          const firstBad = hcells.find((c) => c.bad);
          if (firstBad) SF.text('bad', (firstBad.u + firstBad.w) / 2, 0.08, { color: 'red', size: 11.5, weight: 600, align: 'left', dx: 7 });
          // φ panel: the steepest δ-window
          const ys = v.M.linspace(0, 1 - delta, 200);
          let y0 = 0, best = -1;
          for (const y of ys) { const o = Math.abs(phi(y + delta) - phi(y)); if (o > best) { best = o; y0 = y; } }
          SP.vband(y0, y0 + delta, { color: 'orange', alpha: 0.2, edges: true });
          SP.hband(Math.min(phi(y0), phi(y0 + delta)), Math.max(phi(y0), phi(y0 + delta)), { color: 'accent', alpha: 0.12 });
          SP.fn(phi, { domain: [0, 1], color: 'purple', width: 2.4 });
          SP.tex(`\\delta=${num(delta, 3)}`, y0 + delta, 1.0, { color: 'orange', align: 'left', baseline: 'top', dx: 4, size: 12.5 });
          // h panel
          for (const c of hcells) {
            if (c.bad) badBand(SH, c);
            else SH.rect(c.u, c.hm, c.w, c.hM, { fill: 'green', fillAlpha: 0.35, stroke: false });
          }
          SH.fn((x) => phi(f(x)), { domain: [a, 0.42 - 1e-9], color: 'purple', width: 2.4 });
          SH.fn((x) => phi(f(x)), { domain: [0.42 + 1e-9, b], color: 'purple', width: 2.4 });
          v.legend([['ink', '$f$'], ['purple', '$\\varphi$ and $h=\\varphi\\circ f$'], ['green', 'good cells: $M_i-m_i<\\delta$', { area: true }], ['red', 'bad cells', { area: true }]]);
          st = { delta, n: cells.length, gapF, badW, gapH: U - L, bound: eps.value * (A(b) - A(a)) + 2 * K * delta };
        });
        v.readout(() => st ? `$\\delta=${num(st.delta, 3)}$; $\\;U(P,f)-L(P,f)=${num(st.gapF, 5)}<\\delta^2=${num(st.delta ** 2, 5)}$ with ${st.n} cells. Bad weight $\\sum_B\\Delta\\alpha_i=${num(st.badW, 4)}<\\delta$. $\\;U(P,h)-L(P,h)=${num(st.gapH, 4)}\\le\\varepsilon[\\alpha(b)-\\alpha(a)]+2K\\delta=${num(st.bound, 3)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.12
    {
      num: '6.12',
      kind: 'Theorem',
      name: 'Linearity, order, additivity and bounds',
      statement: String.raw`(a) If $f_1,f_2\in\mathscr R(\alpha)$ on $[a,b]$, then $f_1+f_2\in\mathscr R(\alpha)$ and $cf\in\mathscr R(\alpha)$ for every constant $c$ and $f\in\mathscr R(\alpha)$, with $\int(f_1+f_2)\,d\alpha=\int f_1\,d\alpha+\int f_2\,d\alpha$ and $\int cf\,d\alpha=c\int f\,d\alpha$.
(b) If moreover $f_1\le f_2$ on $[a,b]$, then $\int f_1\,d\alpha\le\int f_2\,d\alpha$.
(c) If $f\in\mathscr R(\alpha)$ on $[a,b]$ and $a<c<b$, then $f\in\mathscr R(\alpha)$ on $[a,c]$ and on $[c,b]$, and $\int_a^c f\,d\alpha+\int_c^b f\,d\alpha=\int_a^b f\,d\alpha$.
(d) If $f\in\mathscr R(\alpha)$ and $|f|\le M$ on $[a,b]$, then $\bigl|\int_a^b f\,d\alpha\bigr|\le M[\alpha(b)-\alpha(a)]$.
(e) If $f\in\mathscr R(\alpha_1)$ and $f\in\mathscr R(\alpha_2)$, then $f\in\mathscr R(\alpha_1+\alpha_2)$ and $\int f\,d(\alpha_1+\alpha_2)=\int f\,d\alpha_1+\int f\,d\alpha_2$; if $c>0$ is constant, $f\in\mathscr R(c\alpha)$ and $\int f\,d(c\alpha)=c\int f\,d\alpha$.`,
      idea: String.raw`Each part comes from an inequality for sums. For (a): on every cell $\sup(f_1+f_2)\le\sup f_1+\sup f_2$ and similarly for infima, so $L(P,f_1)+L(P,f_2)\le L(P,f)\le U(P,f)\le U(P,f_1)+U(P,f_2)$; choosing $P$ by 6.6 for both $f_1,f_2$ squeezes everything. (c) follows by always including $c$ in the partition, (b) and (d) by comparing sums term by term, and (e) because $\Delta(\alpha_1+\alpha_2)_i=\Delta\alpha_{1,i}+\Delta\alpha_{2,i}$.`,
      caption: String.raw`Choose a part. (a) Slide $c$: the integral of $f_1+cf_2$ always equals the same combination of integrals. (c) Drag the split point $c$; on the right the integral is drawn as an area over the $\alpha$-axis (a jump of $\alpha$ becomes a flat stretch of width equal to the jump), cut at $\alpha(c)$. (d) The signed area sits inside the box $M[\alpha(b)-\alpha(a)]$. (e) A smooth $\alpha_1$ plus a pure-jump $\alpha_2$.`,
      deps: ['pma-6.6', 'pma-6.4', 'pma-6.5'],
      see: ['rca-2.14'],
      tags: ['linearity', 'properties of the integral'],
      viz(v) {
        const a = 0, b = 1, A = ALPHA(), A0 = A(a), Atot = A(b) - A(a);
        const A1 = integrator((x) => 0.5 * x + 0.3 * x * x, (x) => 0.5 + 0.6 * x);
        const A2 = integrator(() => 0, () => 0, [[0.32, 0.4], [0.7, 0.25]]);
        const f = withBreaks((x) => 0.15 + 0.55 * Math.sin(6 * x + 0.5));
        const f1 = withBreaks((x) => 0.45 + 0.3 * Math.sin(5 * x));
        const f2 = withBreaks((x) => 0.1 + 0.3 * Math.cos(8 * x));
        const part = v.select('part', [{ value: 'a', label: '(a)$\\;f_1+cf_2$' }, { value: 'c', label: '(c)$\\;$split at $c$' }, { value: 'd', label: '(d)$\\;$bound' }, { value: 'e', label: '(e)$\\;\\alpha_1+\\alpha_2$' }], 'c');
        const cS = v.slider('$c$ in (a)', -2, 2, 1, { step: 0.05 });
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.75, 1.15], height: 280, weight: 1, xlabel: 'x', title: 'the integrand(s) on $[a,b]$' });
        const R = v.stage({ x: [-0.05, Atot + 0.05], y: [-0.75, 1.15], height: 280, weight: 1, title: ' ' });
        const ch = S.handle(0.55, -0.62, { color: 'gold', label: 'c', constrain: (x) => [clamp(x, 0.03, 0.97), -0.62] });
        let st = null;
        const area = (fn, lo, hi, col, alpha = 0.3) => {
          const pts = alphaCurve(A, fn, lo, hi, a);
          R.path([[pts[0][0], 0], ...pts, [pts[pts.length - 1][0], 0]], { fill: col, fillAlpha: alpha, stroke: false, close: true });
          return pts;
        };
        v.render(() => {
          const p = part.value; ch.visible = p === 'c'; cS.el.hidden = p !== 'a';
          const aView = p === 'a' || p === 'e';
          R.setView(aView ? [-0.04, 1.04] : [-0.05, Atot + 0.05], aView ? [-0.1, 1.6] : [-0.75, 1.15]);
          if (p !== 'a') S.setView(null, [-0.75, 1.15]);
          if (p === 'a') {
            const c = cS.value, g = withBreaks((x) => f1(x) + c * f2(x));
            const lo = Math.min(-0.75, ...v.M.linspace(0, 1, 60).map((x) => g(x) - 0.1)), hi = Math.max(1.15, ...v.M.linspace(0, 1, 60).map((x) => g(x) + 0.1));
            S.setView(null, [lo, hi]);
            S.fn(f1, { domain: [a, b], color: 'blue', width: 2 });
            S.fn(f2, { domain: [a, b], color: 'purple', width: 2 });
            S.fn(g, { domain: [a, b], color: 'ink', width: 2.8 });
            R.setTitle('the integrator $\\alpha$');
            drawAlpha(R, A, a, b);
            const I1 = rsIntegral(f1, A, a, b), I2 = rsIntegral(f2, A, a, b), Ig = rsIntegral(g, A, a, b);
            v.legend([['blue', '$f_1$'], ['purple', '$f_2$'], ['ink', '$f_1+cf_2$'], ['orange', '$\\alpha$']]);
            st = { p, I1, I2, Ig, c };
          } else if (p === 'c') {
            const c = ch.x;
            S.fn(f, { domain: [a, c], fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 2.4 });
            S.fn(f, { domain: [c, b], fill: 'green', fillAlpha: 0.2, color: 'green', width: 2.4 });
            S.vline(c, { color: 'gold', width: 1.4, dash: [4, 3] });
            for (const [q] of A.jumps) S.vline(q, { color: 'orange', width: 1.3, dash: [2, 3], alpha: 0.8 });
            R.setTitle('the same integrals as areas over the $\\alpha$-axis');
            area(f, a, c, 'blue'); area(f, c, b, 'green');
            R.path(alphaCurve(A, f, a, b, a), { color: 'ink', width: 2.2 });
            R.vline(A(c) - A0, { color: 'gold', width: 1.4, dash: [4, 3] });
            R.tex('\\alpha(c)', A(c) - A0, -0.62, { color: 'gold', align: 'left', dx: 4, size: 13 });
            const I1 = rsIntegral(f, A, a, c), I2 = rsIntegral(f, A, c, b), I = rsIntegral(f, A, a, b);
            v.legend([['blue', '$\\int_a^c f\\,d\\alpha$', { area: true }], ['green', '$\\int_c^b f\\,d\\alpha$', { area: true }], ['orange', 'jumps of $\\alpha$', { dash: true }]]);
            st = { p, I1, I2, I, c };
          } else if (p === 'd') {
            const Mx = Math.max(...v.M.linspace(0, 1, 400).map((x) => Math.abs(f(x))));
            S.hband(-Mx, Mx, { color: 'accent', alpha: 0.08, edges: true });
            S.fn(f, { domain: [a, b], color: 'ink', width: 2.4 });
            S.tex('M', 1.0, Mx, { color: 'accent', align: 'right', baseline: 'bottom', dy: -2, size: 14 });
            S.tex('-M', 1.0, -Mx, { color: 'accent', align: 'right', baseline: 'top', dy: 2, size: 14 });
            R.setTitle('$\\int f\\,d\\alpha$ as a signed area inside the box $M[\\alpha(b)-\\alpha(a)]$');
            R.rect(0, -Mx, Atot, Mx, { fill: 'accent', fillAlpha: 0.07, color: 'accent', width: 1.2, dash: [5, 4] });
            const pts = alphaCurve(A, f, a, b, a);
            R.path([[0, 0], ...pts.map(([u, y]) => [u, Math.max(0, y)]), [Atot, 0]], { fill: 'green', fillAlpha: 0.3, stroke: false, close: true });
            R.path([[0, 0], ...pts.map(([u, y]) => [u, Math.min(0, y)]), [Atot, 0]], { fill: 'red', fillAlpha: 0.3, stroke: false, close: true });
            R.path(pts, { color: 'ink', width: 2.2 });
            v.legend([['ink', '$f$'], ['accent', '$|f|\\le M$', { area: true }], ['green', 'positive part', { area: true }], ['red', 'negative part', { area: true }]]);
            st = { p, I: rsIntegral(f, A, a, b), Mx };
          } else {
            S.fn(f, { domain: [a, b], color: 'ink', width: 2.4 });
            for (const [q] of A.jumps) S.vline(q, { color: 'orange', width: 1.3, dash: [2, 3], alpha: 0.8 });
            R.setTitle('$\\alpha_1$ (smooth), $\\alpha_2$ (pure jumps) and $\\alpha_1+\\alpha_2$');
            R.fn(A1, { domain: [a, b], color: 'teal', width: 2 });
            drawAlpha(R, A2, a, b, { color: 'pink', width: 2 });
            drawAlpha(R, A, a, b, { color: 'orange', width: 2.4 });
            const J1 = rsIntegral(f, A1, a, b), J2 = rsIntegral(f, A2, a, b), J = rsIntegral(f, A, a, b);
            v.legend([['ink', '$f$'], ['teal', '$\\alpha_1$'], ['pink', '$\\alpha_2$'], ['orange', '$\\alpha_1+\\alpha_2$']]);
            st = { p, J1, J2, J };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.p === 'a') return `$\\int f_1\\,d\\alpha=${num(st.I1)}$, $\\;\\int f_2\\,d\\alpha=${num(st.I2)}$, $\\;\\int(f_1+cf_2)\\,d\\alpha=${num(st.Ig)}=${num(st.I1)}+(${num(st.c, 2)})\\cdot(${num(st.I2)})$.`;
          if (st.p === 'c') return `$c=${num(st.c, 2)}$: $\\;\\int_a^c f\\,d\\alpha+\\int_c^b f\\,d\\alpha=${num(st.I1)}+${par(st.I2)}=${num(st.I1 + st.I2)}=\\int_a^b f\\,d\\alpha=${num(st.I)}$.`;
          if (st.p === 'd') return `$M=\\sup|f|=${num(st.Mx)}$: $\\;\\bigl|\\int f\\,d\\alpha\\bigr|=${num(Math.abs(st.I))}\\le M[\\alpha(b)-\\alpha(a)]=${num(st.Mx * Atot)}$.`;
          return `$\\int f\\,d\\alpha_1+\\int f\\,d\\alpha_2=${num(st.J1)}+${par(st.J2)}=${num(st.J1 + st.J2)}=\\int f\\,d(\\alpha_1+\\alpha_2)=${num(st.J)}$. (The jump part is $0.4f(0.32)+0.25f(0.7)$, by 6.15.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.13
    {
      num: '6.13',
      kind: 'Theorem',
      name: 'Products and absolute values',
      statement: String.raw`If $f\in\mathscr R(\alpha)$ and $g\in\mathscr R(\alpha)$ on $[a,b]$, then
(a) $fg\in\mathscr R(\alpha)$;
(b) $|f|\in\mathscr R(\alpha)$ and $\displaystyle\Bigl|\int_a^b f\,d\alpha\Bigr|\le\int_a^b|f|\,d\alpha$.`,
      idea: String.raw`Apply 6.11 with $\varphi(t)=t^2$: squares of integrable functions are integrable, and the polarization identity $4fg=(f+g)^2-(f-g)^2$ gives (a). With $\varphi(t)=|t|$, 6.11 gives $|f|\in\mathscr R(\alpha)$. Pick $c=\pm1$ with $c\int f\,d\alpha\ge0$; since $cf\le|f|$, part (b) of 6.12 yields $\bigl|\int f\,d\alpha\bigr|=\int cf\,d\alpha\le\int|f|\,d\alpha$.`,
      caption: String.raw`(b): shift $f$ up and down. Over the $\alpha$-axis (right), $\int f\,d\alpha$ is green area minus red area, while $\int|f|\,d\alpha$ adds them; the two agree exactly when $f$ does not change sign. (a): drag $x_0$ to check $fg=\frac14[(f+g)^2-(f-g)^2]$ pointwise; integrating gives the integral of $fg$.`,
      deps: ['pma-6.11', 'pma-6.12'],
      see: ['rca-1.33'],
      tags: ['products', 'absolute value'],
      viz(v) {
        const a = 0, b = 1, A = ALPHA(), A0 = A(a), Atot = A(b) - A(a);
        const part = v.select('part', [{ value: 'b', label: '(b)$\\;|f|$' }, { value: 'a', label: '(a)$\\;fg$' }], 'b');
        const shift = v.slider('shift of $f$ in (b)', -0.6, 0.6, 0.08, { step: 0.01 });
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.9, 1.1], height: 280, weight: 1, xlabel: 'x', title: ' ' });
        const R = v.stage({ x: [-0.05, Atot + 0.05], y: [-0.9, 1.1], height: 280, weight: 1, title: ' ' });
        const x0 = S.handle(0.3, 0, { color: 'gold', label: 'x₀', constrain: (x) => [clamp(x, 0.01, 0.99), 0] });
        const F = withBreaks((x) => 0.6 * Math.sin(5 * x + 0.4) + 0.1);
        const G = withBreaks((x) => 0.55 * Math.cos(9 * x + 0.3) - 0.05);
        let st = null;
        v.render(() => {
          const p = part.value; x0.visible = p === 'a'; shift.el.hidden = p !== 'b';
          if (p === 'b') {
            const f = withBreaks((x) => 0.5 * Math.sin(7 * x - 0.6) + shift.value);
            const af = withBreaks((x) => Math.abs(f(x)));
            S.setView(null, [-1.15, 1.15]); R.setView([-0.05, Atot + 0.05], [-1.15, 1.15]);
            S.fn(af, { domain: [a, b], color: 'muted', width: 1.6, dash: [5, 4] });
            S.fn(f, { domain: [a, b], color: 'ink', width: 2.4 });
            for (const [q] of A.jumps) S.vline(q, { color: 'orange', width: 1.3, dash: [2, 3], alpha: 0.8 });
            S.setTitle('$f$ (solid) and $|f|$ (dashed)');
            R.setTitle('over the $\\alpha$-axis: $\\int f\\,d\\alpha$ = green − red');
            const pts = alphaCurve(A, f, a, b, a);
            R.path([[0, 0], ...pts.map(([u, y]) => [u, Math.max(0, y)]), [Atot, 0]], { fill: 'green', fillAlpha: 0.32, stroke: false, close: true });
            R.path([[0, 0], ...pts.map(([u, y]) => [u, Math.min(0, y)]), [Atot, 0]], { fill: 'red', fillAlpha: 0.32, stroke: false, close: true });
            R.path(pts.map(([u, y]) => [u, Math.abs(y)]), { color: 'muted', width: 1.6, dash: [5, 4] });
            R.path(pts, { color: 'ink', width: 2.2 });
            const I = rsIntegral(f, A, a, b), Iabs = rsIntegral(af, A, a, b);
            v.legend([['ink', '$f$'], ['muted', '$|f|$', { dash: true }], ['green', 'where $f>0$', { area: true }], ['red', 'where $f<0$', { area: true }]]);
            st = { p, I, Iabs };
          } else {
            const fg = (x) => F(x) * G(x), sp = (x) => (F(x) + G(x)) ** 2 / 4, sm = (x) => (F(x) - G(x)) ** 2 / 4;
            S.setView(null, [-0.9, 1.1]);
            S.setTitle('$f$, $g$ and the pointwise identity at $x_0$');
            S.fn(F, { domain: [a, b], color: 'blue', width: 2.2 });
            S.fn(G, { domain: [a, b], color: 'purple', width: 2.2 });
            S.vline(x0.x, { color: 'gold', width: 1.2, dash: [4, 3] });
            S.dot(x0.x, F(x0.x), { color: 'blue', r: 4 }); S.dot(x0.x, G(x0.x), { color: 'purple', r: 4 });
            R.setTitle('$fg=\\frac14(f+g)^2-\\frac14(f-g)^2$');
            R.setView([-0.04, 1.04], [-0.9, 1.1]);
            R.fn(sp, { domain: [a, b], color: 'green', width: 2, fill: 'green', fillAlpha: 0.12 });
            R.fn((x) => -sm(x), { domain: [a, b], color: 'red', width: 2, fill: 'red', fillAlpha: 0.12 });
            R.fn(fg, { domain: [a, b], color: 'ink', width: 2.6 });
            R.vline(x0.x, { color: 'gold', width: 1.2, dash: [4, 3] });
            R.dot(x0.x, sp(x0.x), { color: 'green', r: 4 }); R.dot(x0.x, -sm(x0.x), { color: 'red', r: 4 }); R.dot(x0.x, fg(x0.x), { color: 'ink', r: 4.5 });
            const W = withBreaks(fg), Sp = withBreaks(sp), Sm = withBreaks(sm);
            const q = sums(W, A, uniform(a, b, 64));
            v.legend([['blue', '$f$'], ['purple', '$g$'], ['green', '$\\frac14(f+g)^2$'], ['red', '$-\\frac14(f-g)^2$'], ['ink', '$fg$']]);
            st = { p, x: x0.x, fx: F(x0.x), gx: G(x0.x), Ifg: rsIntegral(W, A, a, b), Ip: rsIntegral(Sp, A, a, b), Im: rsIntegral(Sm, A, a, b), gap: q.U - q.L };
          }
        });
        v.readout(() => {
          if (!st) return '';
          if (st.p === 'b') return `$\\int f\\,d\\alpha=${num(st.I)}$, $\\;\\bigl|\\int f\\,d\\alpha\\bigr|=${num(Math.abs(st.I))}\\ \\le\\ \\int|f|\\,d\\alpha=${num(st.Iabs)}$` + (Math.abs(Math.abs(st.I) - st.Iabs) < 1e-6 ? ' — equality: $f$ has one sign.' : ' — the difference is twice the cancelled area.');
          return `At $x_0=${num(st.x, 2)}$: $f g=${num(st.fx * st.gx, 4)}=\\tfrac14(${num(st.fx + st.gx, 3)})^2-\\tfrac14(${num(st.fx - st.gx, 3)})^2$. Integrated: $\\int fg\\,d\\alpha=${num(st.Ifg, 4)}=${num(st.Ip, 4)}-${num(st.Im, 4)}$; and $U-L$ for $fg$ with 64 cells is $${num(st.gap, 4)}$.`;
        });
      },
    },
  ],
};
