// Rudin, Principles of Mathematical Analysis — Chapter 6: The Riemann–Stieltjes Integral (part a4)

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
    // ------------------------------------------------------------------ 6.21
    {
      num: '6.21',
      kind: 'Theorem',
      name: 'Fundamental theorem of calculus',
      statement: String.raw`If $f\in\mathscr R$ on $[a,b]$ and there is a differentiable function $F$ on $[a,b]$ with $F'=f$, then
$$\int_a^b f(x)\,dx=F(b)-F(a).$$`,
      idea: String.raw`Given $\eps>0$ take $P$ with $U(P,f)-L(P,f)<\eps$. The mean value theorem gives $t_i\in(x_{i-1},x_i)$ with $F(x_i)-F(x_{i-1})=f(t_i)\Delta x_i$, so the tagged sum $\sum f(t_i)\Delta x_i$ telescopes to exactly $F(b)-F(a)$. By 6.7(c) it is also within $\eps$ of $\int_a^b f$. Note that $f$ need not be continuous — only integrable.`,
      caption: String.raw`Top: in each cell, the chord of $F$ is parallel to the tangent at a mean-value point $t_i$ (gold); the increments $F(x_i)-F(x_{i-1})$ stack up on the right to $F(b)-F(a)$. Bottom: bars of height $f(t_i)$ have exactly that total signed area, for every $n$, and sit between the lower and upper sums. Try $F(x)=x^2\sin(1/x)$, whose derivative exists everywhere but is discontinuous at $0$.`,
      deps: ['pma-5.10', 'pma-6.7', 'pma-6.6'],
      see: ['rca-7.21'],
      tags: ['fundamental theorem', 'mean value theorem'],
      viz(v) {
        const a = -1, b = 1;
        const FN = {
          smooth: { label: '$F(x)=\\tfrac12\\sin\\tfrac{5x}{2}+0.3x^3+0.2x$', F: (x) => 0.5 * Math.sin(2.5 * x) + 0.3 * x ** 3 + 0.2 * x, f: withBreaks((x) => 1.25 * Math.cos(2.5 * x) + 0.9 * x * x + 0.2), fy: [-0.25, 1.65] },
          wild: { label: '$F(x)=x^2\\sin(1/x)$', F: (x) => (x === 0 ? 0 : x * x * Math.sin(1 / x)), f: withBreaks((x) => (x === 0 ? 0 : 2 * x * Math.sin(1 / x) - Math.cos(1 / x)), [0]), fy: [-2.6, 2.6] },
        };
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const nS = v.slider('cells $n$', 1, 16, 4, { int: true });
        const SF = v.stage({ x: [-1.05, 1.32], y: [-1.05, 1.05], height: 250, full: true, xlabel: 'x', title: '$F$, chords, and tangents at mean-value points $t_i$' });
        const Sf = v.stage({ x: [-1.05, 1.32], y: [-0.25, 1.65], height: 240, full: true, xlabel: 'x', title: '$f=F\'$ with bars $f(t_i)$ — their signed area is $F(b)-F(a)$' });
        // a mean-value point of the cell: among the sign changes of f − (chord slope), the root nearest the midpoint
        const mvt = (F, f, u, w) => {
          const slope = (F(w) - F(u)) / (w - u), h = (t) => f(t) - slope, N = 400, mid = (u + w) / 2;
          let best = null, prev = u + (w - u) * 1e-6, hp = h(prev);
          for (let k = 1; k <= N; k++) {
            const t = u + (w - u) * 1e-6 + (w - u) * (1 - 2e-6) * k / N, ht = h(t);
            if (hp * ht <= 0 && !(prev <= 0 && t >= 0 && (f.breaks || []).includes(0))) {
              let lo = prev, hi = t; for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2; if (h(lo) * h(m) <= 0) hi = m; else lo = m; }
              const r = (lo + hi) / 2;
              if (best == null || Math.abs(r - mid) < Math.abs(best - mid)) best = r;
            }
            prev = t; hp = ht;
          }
          return best ?? mid;
        };
        let st = null;
        v.render(() => {
          const o = FN[which.value], F = o.F, f = o.f, n = nS.value, P = uniform(a, b, n);
          Sf.setView(null, o.fy);
          const { U, L, cells } = sums(f, integrator((x) => x, () => 1), P);
          let tagged = 0, cum = F(a);
          SF.fn(F, { domain: [a, b], color: 'ink', width: 2.4, n: 1600 });
          Sf.fn(f, { domain: [a, b], color: 'ink', width: 1.6, n: 2400 });
          cells.forEach((c, i) => {
            const t = mvt(F, f, c.u, c.w), slope = (F(c.w) - F(c.u)) / (c.w - c.u), half = (c.w - c.u) * 0.4;
            SF.line(c.u, F(c.u), c.w, F(c.w), { color: 'muted', width: 1.3, dash: [4, 3] });
            SF.line(t - half, F(t) - slope * half, t + half, F(t) + slope * half, { color: 'gold', width: 2.4 });
            SF.dot(t, F(t), { color: 'gold', r: 3.5 });
            SF.dot(c.u, F(c.u), { color: 'ink', r: 2.5 });
            const inc = F(c.w) - F(c.u);
            SF.line(1.15, cum, 1.15, cum + inc, { color: i % 2 ? 'teal' : 'accent', width: 7, cap: 'butt' });
            cum += inc;
            tagged += f(t) * (c.w - c.u);
            Sf.rect(c.u, 0, c.w, f(t), { fill: 'gold', fillAlpha: 0.3, color: 'gold', width: 1.2 });
            Sf.line(c.u, c.M, c.w, c.M, { color: 'purple', width: 1.6 });
            Sf.line(c.u, c.m, c.w, c.m, { color: 'teal', width: 1.6 });
            Sf.line(t, 0, t, f(t), { color: 'gold', width: 1, dash: [2, 3] });
          });
          for (const x of P) { SF.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.35 }); Sf.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.35 }); }
          SF.tex('F(a)', 1.19, F(a), { color: 'ink', align: 'left', size: 12.5 });
          SF.tex('F(b)', 1.19, F(b), { color: 'ink', align: 'left', size: 12.5 });
          v.legend([['ink', '$F$ and $f$'], ['gold', 'tangent at $t_i$; bars $f(t_i)$'], ['purple', '$M_i$'], ['teal', '$m_i$'], ['accent', 'increments of $F$, stacked']]);
          st = { tagged, diff: F(b) - F(a), U, L };
        });
        v.readout(() => st ? `$\\sum f(t_i)\\Delta x_i=${num(st.tagged, 5)}$ and $F(b)-F(a)=${num(st.diff, 5)}$ (equal for every $n$). $\\;L(P,f)=${num(st.L, 4)}\\le\\int_a^b f\\le U(P,f)=${num(st.U, 4)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.22
    {
      num: '6.22',
      kind: 'Theorem',
      name: 'Integration by parts',
      statement: String.raw`Suppose $F$ and $G$ are differentiable on $[a,b]$, $F'=f\in\mathscr R$ and $G'=g\in\mathscr R$. Then
$$\int_a^b F(x)\,g(x)\,dx=F(b)G(b)-F(a)G(a)-\int_a^b f(x)\,G(x)\,dx .$$`,
      idea: String.raw`Put $H=FG$. By the product rule $H'=fG+Fg$, and $fG$, $Fg$ are integrable (continuous functions are integrable and products of integrable functions are integrable, 6.13). The fundamental theorem 6.21 applied to $H$ gives $\int_a^b(fG+Fg)=H(b)-H(a)$.`,
      caption: String.raw`The curve is $t\mapsto(G(t),F(t))$. The blue region under it is $\int F\,dG=\int Fg\,dt$, the green region to its left is $\int G\,dF=\int fG\,dt$; together they fill the big rectangle $F(b)G(b)$ minus the small grey one $F(a)G(a)$. Drag the gold point to change the upper limit $b$.`,
      deps: ['pma-6.21', 'pma-6.13', 'pma-5.3'],
      tags: ['integration by parts', 'product rule'],
      viz(v) {
        const a = 0, PI = Math.PI;
        const F = (t) => 0.3 + t * t, f = (t) => 2 * t;
        const G = (t) => 0.2 + Math.sin(PI * t / 2), g = (t) => (PI / 2) * Math.cos(PI * t / 2);
        const S = v.stage({ x: [-0.12, 1.5], y: [-0.12, 1.45], height: 340, equal: true, weight: 1.25, xlabel: 'G', ylabel: 'F', title: 'the $(G,F)$-plane' });
        const T = v.stage({ x: [-0.04, 1.04], y: [-0.08, 1.45], height: 340, weight: 1, xlabel: 't', title: '$F$ and $G$ against $t$' });
        const near = (x, y) => { let bt = 1, bd = Infinity; for (let k = 0; k <= 400; k++) { const t = 0.1 + 0.9 * k / 400, d = (G(t) - x) ** 2 + (F(t) - y) ** 2; if (d < bd) { bd = d; bt = t; } } return bt; };
        const hb = S.handle(G(0.85), F(0.85), { color: 'gold', label: 'b', constrain: (x, y) => { const t = near(x, y); return [G(t), F(t)]; } });
        let st = null;
        v.render(() => {
          const bb = near(hb.x, hb.y);
          const pts = v.M.linspace(a, bb, 160).map((t) => [G(t), F(t)]);
          S.rect(0, 0, G(bb), F(bb), { color: 'ink', width: 1.2, dash: [5, 4] });
          S.path([...pts, [G(bb), 0], [G(a), 0]], { fill: 'blue', fillAlpha: 0.22, stroke: false, close: true });
          S.path([...pts, [0, F(bb)], [0, F(a)]], { fill: 'green', fillAlpha: 0.22, stroke: false, close: true });
          S.rect(0, 0, G(a), F(a), { fill: 'gray', fillAlpha: 0.35, color: 'gray', width: 1 });
          S.curve((t) => [G(t), F(t)], a, 1, { color: 'faint', width: 1.6, dash: [4, 4] });
          S.path(pts, { color: 'ink', width: 2.6 });
          S.dot(G(a), F(a), { color: 'ink', r: 4, label: 'a', labelPos: 'se' });
          const mid = pts[Math.round(pts.length * 0.55)];
          S.tex('\\int F\\,dG', (G(a) + G(bb)) / 2 + 0.05, Math.min(F(a), mid[1]) * 0.55 + 0.05, { color: 'blue', size: 15 });
          S.tex('\\int G\\,dF', Math.min(G(a), 0.3) * 0.5 + 0.12, (F(a) + F(bb)) / 2 + 0.08, { color: 'green', size: 15 });
          S.tex('F(a)G(a)', G(a) / 2, F(a) / 2, { color: 'ink', size: 11 });
          // t-panel
          T.fn(F, { domain: [0, 1], color: 'purple', width: 2.2 });
          T.fn(G, { domain: [0, 1], color: 'orange', width: 2.2 });
          T.vband(a, bb, { color: 'gold', alpha: 0.08 });
          T.vline(bb, { color: 'gold', width: 1.4, dash: [4, 3] });
          T.tex('F', 0.55, F(0.55), { color: 'purple', align: 'left', dx: 6, dy: 14, size: 15 });
          T.tex('G', 0.35, G(0.35), { color: 'orange', align: 'right', dx: -6, dy: -12, size: 15 });
          const I1 = simpson((t) => F(t) * g(t), a, bb, 400), I2 = simpson((t) => f(t) * G(t), a, bb, 400);
          v.legend([['blue', '$\\int_a^b F g\\,dt$', { area: true }], ['green', '$\\int_a^b f G\\,dt$', { area: true }], ['gray', '$F(a)G(a)$', { area: true }], ['purple', '$F$'], ['orange', '$G$']]);
          st = { bb, I1, I2, rhs: F(bb) * G(bb) - F(a) * G(a) };
        });
        v.readout(() => st ? `$b=${num(st.bb, 3)}$: $\\;\\int_a^b Fg\\,dt=${num(st.I1, 4)}$, $\\;\\int_a^b fG\\,dt=${num(st.I2, 4)}$; their sum $${num(st.I1 + st.I2, 4)}=F(b)G(b)-F(a)G(a)=${num(st.rhs, 4)}$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.23
    {
      num: '6.23',
      kind: 'Definition',
      name: 'Integrals of vector-valued functions',
      statement: String.raw`Let $f_1,\dots,f_k$ be real functions on $[a,b]$ and $\mathbf f=(f_1,\dots,f_k)$ the corresponding map of $[a,b]$ into $\R^k$. If $\alpha$ increases monotonically on $[a,b]$, we say $\mathbf f\in\mathscr R(\alpha)$ when every $f_j\in\mathscr R(\alpha)$, and then
$$\int_a^b\mathbf f\,d\alpha=\Bigl(\int_a^b f_1\,d\alpha,\ \dots,\ \int_a^b f_k\,d\alpha\Bigr).$$`,
      idea: String.raw`Everything is done coordinate by coordinate, so linearity (6.12(a)), additivity over intervals (6.12(c)), linearity in $\alpha$ (6.12(e)), 6.17 and 6.20 carry over unchanged. What does *not* carry over is the mean value theorem — which is why 6.24 is proved componentwise.`,
      deps: ['pma-6.2'],
      tags: ['vector-valued integral'],
    },
    // ------------------------------------------------------------------ 6.24
    {
      num: '6.24',
      kind: 'Theorem',
      name: 'Fundamental theorem for vector-valued functions',
      statement: String.raw`If $\mathbf f$ and $\mathbf F$ map $[a,b]$ into $\R^k$, $\mathbf f\in\mathscr R$ on $[a,b]$, and $\mathbf F'=\mathbf f$, then
$$\int_a^b\mathbf f(t)\,dt=\mathbf F(b)-\mathbf F(a).$$`,
      idea: String.raw`Apply 6.21 to each coordinate $F_j'=f_j$ and assemble the coordinates using Definition 6.23. One cannot argue directly with a vector mean value theorem: in general no single $t$ satisfies $\mathbf F(b)-\mathbf F(a)=(b-a)\mathbf f(t)$.`,
      caption: String.raw`Left: the velocity vectors $\mathbf f(t_i)\Delta t$ laid head to tail from $\mathbf F(a)$ (gold) — a Riemann sum of $\int\mathbf f$ — end ever closer to $\mathbf F(b)$; the green arrow is $\mathbf F(b)-\mathbf F(a)$. Right: the vectors $(b-a)\,\mathbf f(t)$ trace the gold loop, which misses the green chord entirely: there is no vector mean value theorem, so the proof goes coordinate by coordinate.`,
      deps: ['pma-6.21', 'pma-6.23'],
      tags: ['vector-valued integral', 'fundamental theorem'],
      viz(v) {
        const a = 0, b = 2.5;
        const F = (t) => { const r = 1 - 0.25 * t; return [r * Math.cos(2 * t), r * Math.sin(2 * t)]; };
        const f = (t) => { const r = 1 - 0.25 * t; return [-0.25 * Math.cos(2 * t) - 2 * r * Math.sin(2 * t), -0.25 * Math.sin(2 * t) + 2 * r * Math.cos(2 * t)]; };
        const nS = v.slider('cells $n$', 1, 60, 12, { int: true });
        const tag = v.select('tags', [{ value: 0, label: 'left ends' }, { value: 0.5, label: 'midpoints' }], 0);
        const L = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], height: 340, equal: true, weight: 1, title: 'head-to-tail $\\sum\\mathbf f(t_i)\\Delta t$ from $\\mathbf F(a)$' });
        const R = v.stage({ x: [-5.4, 5.4], y: [-5.4, 5.4], height: 340, equal: true, weight: 1, title: 'no $t$ with $(b-a)\\,\\mathbf f(t)=\\mathbf F(b)-\\mathbf F(a)$' });
        let st = null;
        v.render(() => {
          const n = nS.value, dt = (b - a) / n;
          L.curve(F, a, b, { color: 'ink', width: 2.2, n: 400 });
          let p = F(a);
          for (let i = 0; i < n; i++) {
            const t = a + (i + tag.value) * dt, q = [p[0] + f(t)[0] * dt, p[1] + f(t)[1] * dt];
            L.arrow(p[0], p[1], q[0], q[1], { color: 'gold', width: 1.8, head: Math.min(9, 4 + 40 / n) });
            p = q;
          }
          const A0 = F(a), B0 = F(b);
          L.arrow(A0[0], A0[1], B0[0], B0[1], { color: 'green', width: 2.6 });
          L.dot(A0[0], A0[1], { color: 'ink', r: 4, label: 'F(a)', labelPos: 'e' });
          L.dot(B0[0], B0[1], { color: 'green', r: 4.5, label: 'F(b)', labelPos: 's' });
          L.dot(p[0], p[1], { color: 'gold', r: 4 });
          // hodograph
          R.curve((t) => [(b - a) * f(t)[0], (b - a) * f(t)[1]], a, b, { color: 'gold', width: 2.2, n: 400 });
          const ch = [B0[0] - A0[0], B0[1] - A0[1]];
          R.arrow(0, 0, ch[0], ch[1], { color: 'green', width: 2.6 });
          R.dot(0, 0, { color: 'ink', r: 3 });
          R.tex('\\mathbf F(b)-\\mathbf F(a)', ch[0], ch[1], { color: 'green', align: 'left', baseline: 'top', dx: 6, dy: 4, size: 13 });
          R.tex('(b-a)\\,\\mathbf f(t)', (b - a) * f(0.3)[0], (b - a) * f(0.3)[1], { color: 'gold', align: 'left', dx: 8, size: 13 });
          const minR = Math.min(...v.M.linspace(a, b, 400).map((t) => Math.hypot(...f(t)) * (b - a)));
          v.legend([['ink', 'curve $\\mathbf F$'], ['gold', '$\\mathbf f(t_i)\\Delta t$ head to tail; $(b-a)\\mathbf f(t)$'], ['green', '$\\mathbf F(b)-\\mathbf F(a)$']]);
          st = { err: Math.hypot(p[0] - B0[0], p[1] - B0[1]), chord: Math.hypot(...ch), minR, n };
        });
        v.readout(() => st ? `$n=${st.n}$: the head-to-tail sum misses $\\mathbf F(b)$ by $${num(st.err, 4)}$ $\\to0$. Meanwhile $|\\mathbf F(b)-\\mathbf F(a)|=${num(st.chord, 3)}$ but $(b-a)|\\mathbf f(t)|\\ge ${num(st.minR, 3)}$ for every $t$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.25
    {
      num: '6.25',
      kind: 'Theorem',
      name: 'The norm of an integral is at most the integral of the norm',
      statement: String.raw`If $\mathbf f$ maps $[a,b]$ into $\R^k$ and $\mathbf f\in\mathscr R(\alpha)$ for some monotonically increasing $\alpha$ on $[a,b]$, then $|\mathbf f|\in\mathscr R(\alpha)$ and
$$\Bigl|\int_a^b\mathbf f\,d\alpha\Bigr|\le\int_a^b|\mathbf f|\,d\alpha .$$`,
      idea: String.raw`Each $f_j^2\in\mathscr R(\alpha)$ by 6.13, so $f_1^2+\dots+f_k^2\in\mathscr R(\alpha)$, and its square root $|\mathbf f|$ is integrable by 6.11. For the inequality put $\mathbf y=\int\mathbf f\,d\alpha$. Then $|\mathbf y|^2=\sum_j y_j\int f_j\,d\alpha=\int(\mathbf y\cdot\mathbf f)\,d\alpha\le|\mathbf y|\int|\mathbf f|\,d\alpha$ by the Schwarz inequality $\mathbf y\cdot\mathbf f(t)\le|\mathbf y|\,|\mathbf f(t)|$.`,
      caption: String.raw`The fan shows $\mathbf f(t)$ for $t\in[0,1]$; the two orange vectors carry the point masses of $\alpha$ (jumps $0.4$ and $0.25$). The green arrow is $\mathbf y=\int\mathbf f\,d\alpha$. Each $\mathbf f(t)$ is projected onto the direction of $\mathbf y$: $|\mathbf y|$ is the $\alpha$-integral of these projections, each no longer than $|\mathbf f(t)|$. Reduce the spread of directions to reach equality.`,
      deps: ['pma-6.23', 'pma-6.13', 'pma-6.11', 'pma-1.37'],
      see: ['rca-1.33'],
      tags: ['vector-valued integral', 'Schwarz inequality'],
      viz(v) {
        const a = 0, b = 1, A = ALPHA();
        const spread = v.slider('spread of directions', 0, 1, 0.6, { step: 0.01 });
        const L = v.stage({ x: [-1.05, 1.15], y: [-0.55, 1.15], height: 340, equal: true, weight: 1.5, axes: false, title: 'the vectors $\\mathbf f(t)$ and their projections on $\\mathbf y/|\\mathbf y|$' });
        const B = v.stage({ x: [0.3, 2.7], y: [0, 1.25], height: 340, weight: 0.8, axes: 'box', xticks: [], minWidth: 200, title: 'the two sides' });
        let st = null;
        v.render(() => {
          const sp = spread.value;
          const fv = (t) => { const r = 0.55 + 0.35 * Math.sin(3 * t + 0.5) ** 2, th = 1.2 + sp * Math.PI * (1.5 * t - 0.75); return [r * Math.cos(th), r * Math.sin(th)]; };
          const f1 = withBreaks((t) => fv(t)[0]), f2 = withBreaks((t) => fv(t)[1]), fn = withBreaks((t) => Math.hypot(...fv(t)));
          const y = [rsIntegral(f1, A, a, b), rsIntegral(f2, A, a, b)], ny = Math.hypot(...y), u = ny > 1e-9 ? [y[0] / ny, y[1] / ny] : [1, 0];
          const Inorm = rsIntegral(fn, A, a, b);
          // direction line of y
          L.line(-u[0] * 3, -u[1] * 3, u[0] * 3, u[1] * 3, { color: 'green', width: 1, dash: [5, 4], alpha: 0.7 });
          L.line(-1.05, 0, 1.15, 0, { color: 'grid', width: 1 }); L.line(0, -0.55, 0, 1.15, { color: 'grid', width: 1 });
          for (let k = 0; k <= 18; k++) {
            const t = k / 18, w = fv(t), pr = w[0] * u[0] + w[1] * u[1];
            L.arrow(0, 0, w[0], w[1], { color: v.mix('teal', 'purple', t), width: 1.3, head: 7, alpha: 0.8 });
            L.line(w[0], w[1], pr * u[0], pr * u[1], { color: 'muted', width: 0.8, dash: [2, 3], alpha: 0.5 });
            L.dot(pr * u[0], pr * u[1], { color: 'green', r: 2.2 });
          }
          for (const [p, wj] of A.jumps) {
            const w = fv(p);
            L.arrow(0, 0, w[0], w[1], { color: 'orange', width: 2.6, head: 9 });
            L.tex(`\\times${wj}`, w[0], w[1], { color: 'orange', align: 'left', dx: 6, size: 12.5 });
          }
          L.arrow(0, 0, y[0], y[1], { color: 'green', width: 3, head: 11 });
          L.tex('\\mathbf y', y[0], y[1], { color: 'green', align: 'left', baseline: 'bottom', dx: 6, dy: -2, size: 16 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          // bars
          B.setView([0.3, 2.7], [0, Math.max(1.25, Inorm * 1.15)]);
          B.rect(0.65, 0, 1.35, ny, { fill: 'green', fillAlpha: 0.5, color: 'green', width: 1.2 });
          B.rect(1.65, 0, 2.35, Inorm, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.2 });
          B.tex('|\\int\\mathbf f\\,d\\alpha|', 1.0, ny, { color: 'green', baseline: 'bottom', dy: -4, size: 13 });
          B.tex('\\int|\\mathbf f|\\,d\\alpha', 2.0, Inorm, { color: 'accent', baseline: 'bottom', dy: -4, size: 13 });
          v.legend([['teal', '$\\mathbf f(t)$, $t$ from $0$ (teal) to $1$ (purple)'], ['orange', 'point masses of $\\alpha$'], ['green', '$\\mathbf y=\\int\\mathbf f\\,d\\alpha$ and projections']]);
          st = { ny, Inorm };
        });
        v.readout(() => st ? `$|\\int\\mathbf f\\,d\\alpha|=\\int\\frac{\\mathbf y}{|\\mathbf y|}\\cdot\\mathbf f\\,d\\alpha=${num(st.ny, 4)}\\ \\le\\ \\int|\\mathbf f|\\,d\\alpha=${num(st.Inorm, 4)}$` + (st.Inorm - st.ny < 1e-4 ? ' — equality: all $\\mathbf f(t)$ point the same way.' : '.') : '');
      },
    },
    // ------------------------------------------------------------------ 6.26
    {
      num: '6.26',
      kind: 'Definition',
      name: 'Curves, arcs and rectifiable curves',
      statement: String.raw`A continuous map $\gamma$ of a compact interval $[a,b]$ into $\R^k$ is a **curve** in $\R^k$ (on $[a,b]$); if $\gamma$ is one-to-one it is an **arc**, and if $\gamma(a)=\gamma(b)$ it is a **closed curve**. The curve is the map, not its range. To each partition $P=\{x_0,\dots,x_n\}$ of $[a,b]$ associate the length of the inscribed polygon
$$\Lambda(P,\gamma)=\sum_{i=1}^n|\gamma(x_i)-\gamma(x_{i-1})|,$$
and define the **length** of $\gamma$ as $\Lambda(\gamma)=\sup_P\Lambda(P,\gamma)$. The curve is **rectifiable** if $\Lambda(\gamma)<\infty$.`,
      idea: String.raw`By the triangle inequality, refining $P$ can only lengthen the inscribed polygon, so $\Lambda(\gamma)$ is the limit of ever finer polygons. Continuity alone does not make it finite: a curve can wiggle so much that its polygons grow without bound.`,
      caption: String.raw`Increase $n$. For the smooth arc the inscribed polygons (orange) approach the true length from below (green line, right). For $\gamma(t)=(t,\,t\sin\frac{\pi}{t})$ — continuous, with $\gamma(0)=0$ — the polygons through the successive peaks $t=\frac{2}{2k+1}$ grow like a harmonic series: no finite supremum, so the curve is not rectifiable.`,
      deps: ['pma-6.1'],
      tags: ['curves', 'arc length'],
      viz(v) {
        const CURVES = {
          smooth: { label: 'smooth arc $(t,\\,0.3\\sin 3\\pi t)$', g: (t) => [t, 0.3 * Math.sin(3 * Math.PI * t)], view: [-0.6, 0.6], part: (n) => uniform(0, 1, n) },
          wild: { label: '$(t,\\,t\\sin\\frac{\\pi}{t})$', g: (t) => (t <= 0 ? [0, 0] : [t, t * Math.sin(Math.PI / t)]), view: [-1.05, 1.05], part: (n) => { const pts = [0, 1]; for (let k = 1; k <= n; k++) pts.push(2 / (2 * k + 1)); return pts.sort((x, y) => x - y); } },
        };
        const which = v.select('$\\gamma$', Object.entries(CURVES).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const nS = v.slider('$n$', 1, 120, 6, { int: true });
        const C = v.stage({ x: [-0.05, 1.05], y: [-0.6, 0.6], height: 300, weight: 1.3, title: 'the curve and an inscribed polygon' });
        const Lp = v.stage({ x: [0, Math.log10(130)], y: [0, 4], height: 300, weight: 1, axes: 'box', xticks: [[0, 'n = 1'], [1, '10'], [2, '100']], title: '$\\Lambda(P_n,\\gamma)$ against $n$ (log scale)' });
        const lenOf = (g, P) => { let s = 0; for (let i = 1; i < P.length; i++) { const p = g(P[i - 1]), q = g(P[i]); s += Math.hypot(q[0] - p[0], q[1] - p[1]); } return s; };
        const cache = {};
        let st = null;
        v.render(() => {
          const key = which.value, o = CURVES[key], n = nS.value;
          C.setView(null, o.view);
          const series = cache[key] ||= Array.from({ length: 120 }, (_, i) => [Math.log10(i + 1), lenOf(o.g, o.part(i + 1))]);
          const trueLen = key === 'smooth' ? lenOf(o.g, uniform(0, 1, 20000)) : null;
          const P = o.part(n), Lam = lenOf(o.g, P);
          C.curve(o.g, 0, 1, { color: 'ink', width: 2, n: key === 'wild' ? 6000 : 600 });
          C.path(P.map(o.g), { color: 'orange', width: 2 });
          C.dots(P.map(o.g), { color: 'orange', r: 3 });
          if (key === 'wild') { C.fn((x) => x, { domain: [0, 1], color: 'faint', width: 1, dash: [3, 4] }); C.fn((x) => -x, { domain: [0, 1], color: 'faint', width: 1, dash: [3, 4] }); }
          const top = Math.max(2, ...series.map((s) => s[1])) * 1.12;
          Lp.setView(null, [0, top]);
          if (trueLen) { Lp.hline(trueLen, { color: 'green', width: 1.6, dash: [5, 4] }); Lp.tex('\\Lambda(\\gamma)', Math.log10(120), trueLen, { color: 'green', align: 'right', baseline: 'bottom', dy: -3, size: 13 }); }
          Lp.path(series, { color: key === 'wild' ? 'red' : 'orange', width: 2 });
          Lp.dot(Math.log10(n), Lam, { color: key === 'wild' ? 'red' : 'orange', r: 5 });
          v.legend([['ink', '$\\gamma$'], ['orange', 'inscribed polygon $P_n$'], ['green', '$\\Lambda(\\gamma)$ when finite', { dash: true }]]);
          st = { key, n, Lam, trueLen };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.key === 'smooth') return `$\\Lambda(P_{${st.n}},\\gamma)=${num(st.Lam, 4)}\\le\\Lambda(\\gamma)=${num(st.trueLen, 4)}$ (with $n$ equal cells).`;
          return `Polygon through $0,\\ \\tfrac{2}{2n+1},\\dots,\\tfrac25,\\tfrac23,\\ 1$: $\\Lambda(P_{${st.n}},\\gamma)=${num(st.Lam, 3)}$ — it keeps growing (roughly like $\\tfrac{4}{\\pi}\\cdot$ a harmonic sum), so $\\Lambda(\\gamma)=\\infty$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.27
    {
      num: '6.27',
      kind: 'Theorem',
      name: 'Arc length is the integral of the speed',
      statement: String.raw`If $\gamma'$ is continuous on $[a,b]$, then $\gamma$ is rectifiable and
$$\Lambda(\gamma)=\int_a^b|\gamma'(t)|\,dt .$$`,
      idea: String.raw`For each cell, 6.24 and 6.25 give $|\gamma(x_i)-\gamma(x_{i-1})|=\bigl|\int_{x_{i-1}}^{x_i}\gamma'\bigr|\le\int_{x_{i-1}}^{x_i}|\gamma'|$; summing, $\Lambda(P,\gamma)\le\int_a^b|\gamma'|$ for every $P$. Conversely, $\gamma'$ is uniformly continuous, so on a fine enough partition $\gamma'$ is within $\eps$ of $\gamma'(x_i)$ on each cell; then $\int|\gamma'|$ over a cell is at most $|\gamma(x_i)-\gamma(x_{i-1})|+2\eps\Delta x_i$, and summing gives $\int_a^b|\gamma'|\le\Lambda(P,\gamma)+2\eps(b-a)$.`,
      caption: String.raw`The gold point travels along $\gamma$ while the area under the speed $|\gamma'(t)|$ fills in (right): the area swept equals the distance travelled. The orange bars have height $|\gamma(x_i)-\gamma(x_{i-1})|/\Delta x_i$, so their total area is the length of the inscribed polygon — always below the speed curve's area, and catching up as $n$ grows.`,
      deps: ['pma-6.26', 'pma-6.24', 'pma-6.25', 'pma-4.19'],
      tags: ['arc length', 'curves'],
      viz(v) {
        const a = 0, b = 2 * Math.PI;
        const g = (t) => [Math.cos(t) + 0.3 * Math.cos(3 * t), Math.sin(t) - 0.3 * Math.sin(3 * t)];
        const dg = (t) => [-Math.sin(t) - 0.9 * Math.sin(3 * t), Math.cos(t) - 0.9 * Math.cos(3 * t)];
        const speed = (t) => Math.hypot(...dg(t));
        const total = simpson(speed, a, b, 4000);
        const nS = v.slider('polygon cells $n$', 2, 40, 7, { int: true });
        const C = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], height: 320, equal: true, weight: 1, axes: false, title: '$\\gamma(t)=(\\cos t+0.3\\cos 3t,\\ \\sin t-0.3\\sin 3t)$' });
        const V = v.stage({ x: [-0.1, b + 0.1], y: [-0.1, 2.15], height: 320, weight: 1.25, xlabel: 't', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [3 * Math.PI / 2, '3π/2'], [2 * Math.PI, '2π']], title: 'speed $|\\gamma\'(t)|$; orange area $=\\Lambda(P,\\gamma)$' });
        let st = null;
        v.animate((time) => {
          const n = nS.value, P = uniform(a, b, n), tau = (time / 8) * b;
          // curve panel
          C.curve(g, a, b, { color: 'ink', width: 2, n: 500 });
          C.curve(g, a, tau, { color: 'gold', width: 4.5, n: 300 });
          C.path(P.map(g), { color: 'orange', width: 1.8 });
          C.dots(P.map(g), { color: 'orange', r: 3 });
          const p = g(tau);
          C.dot(p[0], p[1], { color: 'gold', r: 6 });
          // speed panel
          let poly = 0;
          for (let i = 1; i <= n; i++) {
            const u = P[i - 1], w = P[i], A0 = g(u), B0 = g(w), chord = Math.hypot(B0[0] - A0[0], B0[1] - A0[1]);
            poly += chord;
            V.rect(u, 0, w, chord / (w - u), { fill: 'orange', fillAlpha: 0.16, color: 'orange', width: 1.4 });
          }
          V.fn(speed, { domain: [a, tau], fill: 'gold', fillAlpha: 0.45, stroke: false });
          V.fn(speed, { domain: [a, b], color: 'ink', width: 2.2 });
          V.vline(tau, { color: 'gold', width: 1.4, dash: [4, 3] });
          v.legend([['ink', '$\\gamma$ and $|\\gamma\'|$'], ['gold', 'arc travelled $=\\int_0^\\tau|\\gamma\'|$', { area: true }], ['orange', 'inscribed polygon; chord$/\\Delta t$ bars', { area: true }]]);
          st = { tau, done: simpson(speed, a, tau, 600), poly };
        }, { period: 8 });
        v.readout(() => st ? `$\\int_0^{\\tau}|\\gamma'|=${num(st.done, 3)}$ at $\\tau=${num(st.tau, 2)}$. $\\;\\Lambda(P,\\gamma)=${num(st.poly, 4)}\\le\\int_0^{2\\pi}|\\gamma'|\\,dt=${num(total, 4)}=\\Lambda(\\gamma)$.` : '');
      },
    },
  ],
};
