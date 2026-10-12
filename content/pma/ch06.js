// Rudin, Principles of Mathematical Analysis — Chapter 6: The Riemann–Stieltjes Integral

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
  book: 'pma',
  chapter: 6,
  title: 'The Riemann–Stieltjes Integral',
  summary: String.raw`Integration is built from upper and lower sums: a bounded function is integrable against an increasing integrator $\alpha$ when refining partitions squeezes the two sums together. Rudin proves the $\eps$-criterion, shows that continuous functions, monotone functions (against continuous $\alpha$) and functions with finitely many discontinuities are integrable, develops linearity and the step-function and density cases of $d\alpha$, and then connects integration with differentiation through the fundamental theorem of calculus. The chapter closes with vector-valued integrals and the length of rectifiable curves.`,
  items: [
    // ------------------------------------------------------------------ 6.1
    {
      num: '6.1',
      kind: 'Definition',
      name: 'Partitions, upper and lower sums, the Riemann integral',
      statement: String.raw`A **partition** $P$ of $[a,b]$ is a finite set of points $a=x_0\le x_1\le\cdots\le x_n=b$; put $\Delta x_i=x_i-x_{i-1}$. For a bounded real function $f$ on $[a,b]$ let $M_i$ and $m_i$ be the supremum and infimum of $f$ on $[x_{i-1},x_i]$, and set
$$U(P,f)=\sum_{i=1}^n M_i\,\Delta x_i,\qquad L(P,f)=\sum_{i=1}^n m_i\,\Delta x_i .$$
The **upper integral** $\overline{\int_a^b} f\,dx$ is the infimum of $U(P,f)$ over all partitions, and the **lower integral** $\underline{\int_a^b} f\,dx$ is the supremum of $L(P,f)$. When the two agree, $f$ is **Riemann-integrable** on $[a,b]$, written $f\in\mathscr R$, and the common value is $\int_a^b f\,dx$. If $m\le f\le M$ then $m(b-a)\le L(P,f)\le U(P,f)\le M(b-a)$ for every $P$, so both integrals are finite for every bounded $f$.`,
      idea: String.raw`The upper sum over-estimates the area by using the tallest value on each cell, the lower sum under-estimates it with the shortest. The least-upper-bound property of $\R$ guarantees that the infimum of all upper sums and the supremum of all lower sums exist. Boundedness is essential — it is what makes every $M_i$ and $m_i$ finite.`,
      caption: String.raw`Drag the orange partition points or change the number of cells. Purple rectangles give $U(P,f)$, teal ones $L(P,f)$; the strip below shows where the two sums sit. For the indicator of the rationals every cell contains both values, so $U=2$ and $L=0$ for every partition — the upper and lower integrals differ.`,
      deps: ['pma-1.19'],
      see: ['pma-11.33'],
      tags: ['Riemann integral', 'partition'],
      viz(v) {
        const a = 0, b = 2, X = IDENT();
        const smooth = withBreaks((x) => 0.9 + 0.55 * Math.sin(2.6 * x + 0.3) + 0.1 * x * x);
        const jump = withBreaks((x) => (x <= 1.2 ? 0.55 + 0.4 * x : 1.45 - 0.35 * (x - 1.2)), [1.2]);
        const dir = withBreaks(() => 0.5); dir.sup = () => [0, 1];
        const FN = { smooth, jump, dir };
        let H = null;
        const which = v.select('$f$', [{ value: 'smooth', label: 'continuous' }, { value: 'jump', label: 'one jump' }, { value: 'dir', label: '$1$ on $\\mathbb Q$, $0$ off $\\mathbb Q$' }], 'smooth');
        const nS = v.slider('cells $n$', 1, 12, 4, { int: true, onChange: (n) => H.reset(n) });
        const S = v.stage({ x: [-0.08, 2.08], y: [-0.2, 1.72], height: 290, full: true, xlabel: 'x' });
        const NL = numStage(v, 'the two sums on the real line');
        H = partitionHandles(S, a, b, 11, 0, 'orange');
        H.reset(nS.value);
        let st = null;
        v.render(() => {
          const key = which.value, f = FN[key];
          const P = H.points();
          const { U, L, cells } = sums(f, X, P);
          drawBars(S, cells);
          for (const x of P) S.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.55 });
          if (key === 'dir') {
            S.fn(() => 1, { domain: [a, b], color: 'ink', width: 2.2, dash: [1.5, 4.5] });
            S.fn(() => 0.004, { domain: [a, b], color: 'ink', width: 2.2, dash: [1.5, 4.5] });
            S.tex('f=1 \\text{ on } \\mathbb Q', 1.0, 1.0, { color: 'ink', baseline: 'bottom', dy: -6, size: 14 });
            S.tex('f=0 \\text{ off } \\mathbb Q', 1.0, 0, { color: 'ink', baseline: 'bottom', dy: -10, size: 14 });
          } else {
            drawF(S, f, a, b);
          }
          const exact = key === 'dir' ? null : rsIntegral(f, X, a, b);
          numLine(NL, -0.15, 3.2);
          if (key !== 'dir') for (let k = 1; k <= 12; k++) {
            const sk = sums(f, X, uniform(a, b, k));
            NL.line(sk.U, 0.5, sk.U, 0.72, { color: 'purple', width: 1.3, alpha: 0.25 + 0.6 * k / 12 });
            NL.line(sk.L, -0.5, sk.L, -0.72, { color: 'teal', width: 1.3, alpha: 0.25 + 0.6 * k / 12 });
          }
          if (key !== 'dir') { NL.text('U for n = 1…12 equal cells', 3.18, 0.62, { color: 'purple', size: 10.5, align: 'right', alpha: 0.85 }); NL.text('L for n = 1…12 equal cells', -0.12, -0.62, { color: 'teal', size: 10.5, align: 'left', alpha: 0.85 }); }
          NL.line(L, 0, U, 0, { color: 'purple', width: 7, alpha: 0.25, cap: 'butt' });
          NL.dot(L, 0, { color: 'teal', r: 5 }); NL.dot(U, 0, { color: 'purple', r: 5 });
          const lEdge = NL.X(L) < 70;
          NL.tex('L(P,f)', L, 0, { color: 'teal', align: lEdge ? 'left' : 'right', dx: lEdge ? 4 : -8, dy: lEdge ? -20 : -16, size: 14 });
          NL.tex('U(P,f)', U, 0, { color: 'purple', align: 'left', dx: 8, dy: -16, size: 14 });
          if (exact != null) {
            NL.line(exact, -0.36, exact, 0.36, { color: 'green', width: 2.4 });
            NL.tex('\\int_0^2 f\\,dx', exact, -0.4, { color: 'green', baseline: 'top', size: 13 });
          } else NL.tex('\\overline{\\textstyle\\int}=2\\ne 0=\\underline{\\textstyle\\int}', 1, 0, { color: 'red', baseline: 'top', dy: 18, size: 14 });
          v.legend([['ink', '$f$'], ['purple', 'upper sum $U(P,f)$', { area: true }], ['teal', 'lower sum $L(P,f)$', { area: true }], ['orange', 'partition points', { dot: true }]]);
          st = { U, L, exact, n: cells.length, key };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.key === 'dir') return `Every cell of positive length contains rationals and irrationals, so $M_i=1$, $m_i=0$ and $U(P,f)=${num(st.U, 0)}$, $L(P,f)=${num(st.L, 0)}$ for **every** $P$. Upper integral $2 \\ne 0$ = lower integral: $f\\notin\\mathscr R$.`;
          return `$n=${st.n}$: $\\;U(P,f)=${num(st.U)}$, $\\;L(P,f)=${num(st.L)}$, $\\;U-L=${num(st.U - st.L)}$. Both sums bracket $\\int_0^2 f\\,dx=${num(st.exact)}$; more cells squeeze them onto it.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.2
    {
      num: '6.2',
      kind: 'Definition',
      name: 'Riemann–Stieltjes sums and the class ℛ(α)',
      statement: String.raw`Let $\alpha$ be monotonically increasing on $[a,b]$; then $\alpha$ is bounded there. For a partition $P$ put $\Delta\alpha_i=\alpha(x_i)-\alpha(x_{i-1})\ \ (\ge 0)$, and for a bounded real $f$ on $[a,b]$ define
$$U(P,f,\alpha)=\sum_{i=1}^n M_i\,\Delta\alpha_i,\qquad L(P,f,\alpha)=\sum_{i=1}^n m_i\,\Delta\alpha_i ,$$
with $M_i,m_i$ the supremum and infimum of $f$ on $[x_{i-1},x_i]$. The upper integral $\overline{\int_a^b} f\,d\alpha$ is the infimum of $U(P,f,\alpha)$ over all $P$ and the lower integral $\underline{\int_a^b} f\,d\alpha$ is the supremum of $L(P,f,\alpha)$. If they are equal, $f$ is said to be integrable with respect to $\alpha$, written $f\in\mathscr R(\alpha)$, and the common value $\int_a^b f\,d\alpha$ is the **Riemann–Stieltjes integral** of $f$ with respect to $\alpha$. The choice $\alpha(x)=x$ gives back Definition 6.1; $\alpha$ is not required to be continuous.`,
      idea: String.raw`Only the weights change: the length $\Delta x_i$ of a cell is replaced by the increase $\Delta\alpha_i$ of $\alpha$ across it. Think of $\alpha$ as a cumulative mass distribution on $[a,b]$ — smooth parts spread mass with density $\alpha'$, and a jump of $\alpha$ is a point mass. The sums then measure $f$ against that mass.`,
      caption: String.raw`Drag the partition points on the top panel. The bottom-left panel shows how much $\alpha$ rises over each cell; the bottom-right panel redraws the same rectangles with width $\Delta\alpha_i$ instead of $\Delta x_i$, so their areas are exactly $U(P,f,\alpha)$ and $L(P,f,\alpha)$. A cell containing a jump of $\alpha$ keeps width at least the jump, however thin it is in $x$.`,
      deps: ['pma-6.1', 'pma-4.28'],
      see: ['rca-2.14'],
      tags: ['Stieltjes integral', 'integrator'],
      viz(v) {
        const a = 0, b = 1, A = ALPHA(), Atot = A(b) - A(a);
        const f = withBreaks((x) => 0.55 + 0.3 * Math.sin(6.5 * x + 0.4) + 0.25 * x);
        let H = null;
        const nS = v.slider('cells $n$', 1, 10, 5, { int: true, onChange: (n) => H.reset(n) });
        const F = v.stage({ x: [-0.04, 1.04], y: [-0.12, 1.14], height: 200, full: true, title: '$x$-axis: the integrand $f$ and the partition $P$' });
        const SA = v.stage({ x: [-0.1, 1.04], y: [-0.08, 1.62], height: 250, xticks: [], yticks: [], title: 'the integrator $\\alpha$; its rise $\\Delta\\alpha_i$ on each cell' });
        const SU = v.stage({ x: [-0.05, Atot + 0.05], y: [-0.12, 1.14], height: 250, xticks: [], title: '$\\alpha$-axis: cell $i$ gets width $\\Delta\\alpha_i$' });
        H = partitionHandles(F, a, b, 9, 0, 'orange');
        H.reset(nS.value);
        let st = null;
        v.render(() => {
          const P = H.points();
          const { U, L, cells } = sums(f, A, P);
          // top: x-space
          drawBars(F, cells, { ua: 0.08, lf: 0.14, la: 0.5 });
          for (const x of P) F.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.5 });
          F.fn(f, { domain: [a, b], color: 'ink', width: 2.4 });
          for (const [p] of A.jumps) { F.vline(p, { color: 'orange', width: 1.4, dash: [2, 3], alpha: 0.8 }); F.text('α jumps', p, 1.1, { color: 'orange', size: 11, dx: 4, align: 'left', baseline: 'top' }); }
          // bottom-left: α and the rises
          drawAlpha(SA, A, a, b);
          cells.forEach((c, i) => {
            const shade = i % 2 ? 0.45 : 1;
            SA.line(-0.06, A(c.u), -0.06, A(c.w), { color: 'orange', width: 7, alpha: shade, cap: 'butt' });
          });
          for (const x of P) {
            SA.line(x, 0, x, A(x), { color: 'muted', width: 1, dash: [3, 4], alpha: 0.6 });
            SA.line(-0.06, A(x), x, A(x), { color: 'muted', width: 1, dash: [2, 4], alpha: 0.45 });
          }
          SA.tex('\\Delta\\alpha_i', -0.06, A(b), { color: 'orange', align: 'left', baseline: 'bottom', dx: 6, dy: -2, size: 13 });
          SA.tex('\\alpha', 0.9, A(0.9), { color: 'orange', align: 'left', baseline: 'top', dx: 4, dy: 6, size: 15 });
          // bottom-right: α-space
          cells.forEach((c, i) => {
            const u0 = A(c.u) - A(a), u1 = A(c.w) - A(a);
            SU.rect(u0, 0, u1, c.M, { fill: 'purple', fillAlpha: 0.13, color: 'purple', width: 1.1, alpha: 0.8 });
            SU.rect(u0, 0, u1, c.m, { fill: 'teal', fillAlpha: 0.26, color: 'teal', width: 1.1, alpha: 0.8 });
            SU.line(u0, -0.06, u1, -0.06, { color: 'orange', width: 7, alpha: i % 2 ? 0.45 : 1, cap: 'butt' });
          });
          // the curve u = α(x) ↦ f(x): jumps of α stretch the single value f(p) over width w
          const js = A.jumps.slice().sort((p, q) => p[0] - q[0]);
          const cuts = [a, ...js.map(([p]) => p), b];
          let off = 0; const pts = [];
          for (let i = 1; i < cuts.length; i++) {
            for (let k = 0; k <= 80; k++) { const x = cuts[i - 1] + (cuts[i] - cuts[i - 1]) * k / 80; pts.push([A.cont(x) + off - A(a), f(x)]); }
            if (i < cuts.length - 1) off += js[i - 1][1];
          }
          SU.path(pts, { color: 'ink', width: 2.4 });
          for (const [p, w] of js) {
            const u0 = A(p) - A(a);
            SU.line(u0, f(p), u0 + w, f(p), { color: 'orange', width: 3.2 });
            SU.tex(`\\text{jump } ${w}`, u0 + w / 2, f(p), { color: 'orange', baseline: 'top', dy: 6, size: 12.5 });
          }
          v.legend([['ink', '$f$'], ['orange', '$\\alpha$ and its rises $\\Delta\\alpha_i$'], ['purple', '$U(P,f,\\alpha)=\\sum M_i\\Delta\\alpha_i$', { area: true }], ['teal', '$L(P,f,\\alpha)=\\sum m_i\\Delta\\alpha_i$', { area: true }]]);
          st = { U, L, exact: rsIntegral(f, A, a, b), jumpPart: js.reduce((s, [p, w]) => s + w * f(p), 0) };
        });
        v.readout(() => st ? `$U(P,f,\\alpha)=${num(st.U)}$, $\\;L(P,f,\\alpha)=${num(st.L)}$ $\\;$(areas on the right). For comparison $\\int_0^1 f\\,d\\alpha=${num(st.exact)}$, of which $${num(st.jumpPart)}$ comes from the two point masses of $\\alpha$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.3
    {
      num: '6.3',
      kind: 'Definition',
      name: 'Refinement and common refinement',
      statement: String.raw`A partition $P^*$ of $[a,b]$ is a **refinement** of the partition $P$ if $P^*\supset P$, that is, every point of $P$ is also a point of $P^*$. Given two partitions $P_1$ and $P_2$, their **common refinement** is $P^*=P_1\cup P_2$.`,
      idea: String.raw`Refining only subdivides cells. The common refinement is the coarsest partition that refines both $P_1$ and $P_2$, and it is the device that lets two arbitrary partitions be compared (Theorems 6.4–6.6).`,
      deps: ['pma-6.1'],
      tags: ['partition'],
    },
    // ------------------------------------------------------------------ 6.4
    {
      num: '6.4',
      kind: 'Theorem',
      name: 'Refining raises L and lowers U',
      statement: String.raw`If $P^*$ is a refinement of $P$, then
$$L(P,f,\alpha)\le L(P^*,f,\alpha)\qquad\text{and}\qquad U(P^*,f,\alpha)\le U(P,f,\alpha).$$`,
      idea: String.raw`It suffices to add a single point $x^*$ to $P$ and then induct. If $x^*$ falls in $[x_{i-1},x_i]$, the infima $w_1,w_2$ of $f$ over the two halves are at least $m_i$, and $\Delta\alpha_i$ splits into the two non-negative pieces $\alpha(x^*)-\alpha(x_{i-1})$ and $\alpha(x_i)-\alpha(x^*)$ because $\alpha$ is increasing. So that cell's contribution to $L$ can only grow; the argument for $U$ is symmetric.`,
      caption: String.raw`Drag the gold point $x^*$: in its cell, the old bars (dashed) are replaced by two bars, and the green slivers are what $U$ loses and $L$ gains, weighted by the two pieces of $\Delta\alpha_i$ shown on $\alpha$ below. Press *Insert* to commit $x^*$ to $P$; the history on the right is monotone, step after step.`,
      deps: ['pma-6.2', 'pma-6.3'],
      tags: ['refinement', 'upper and lower sums'],
      viz(v) {
        const a = 0, b = 1, A = ALPHA();
        const f = withBreaks((x) => 0.52 + 0.36 * Math.sin(5.2 * x - 0.9) + 0.32 * x * x);
        let P = uniform(a, b, 3), hist = [];
        const exact = rsIntegral(f, A, a, b);
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.12, 1.22], height: 270, full: true, xlabel: 'x' });
        const SA = v.stage({ x: [-0.04, 1.04], y: [-0.1, 1.55], height: 170, weight: 1.5, xticks: [], title: 'the integrator $\\alpha$: $\\Delta\\alpha_i$ splits in two' });
        const SH = v.stage({ x: [-0.4, 6.4], y: [0, 1], height: 170, axes: 'box', title: '$U$ and $L$ after each insertion' });
        const xs = S.handle(0.45, 0, { color: 'gold', label: 'x*', constrain: (x) => [clamp(x, a + 0.004, b - 0.004), 0] });
        const cellOf = (x) => { for (let i = 1; i < P.length; i++) if (x <= P[i]) return i; return P.length - 1; };
        const suggest = () => {
          const s = sums(f, A, P);
          let best = -1, bi = 0; s.cells.forEach((c, i) => { const g = (c.M - c.m) * c.da; if (g > best) { best = g; bi = i; } });
          xs.x = s.cells[bi].u + (s.cells[bi].w - s.cells[bi].u) * 0.42;
        };
        const insert = (x) => {
          if (!hist.length) { const s0 = sums(f, A, P); hist.push({ U: s0.U, L: s0.L }); }
          if (P.every((p) => Math.abs(p - x) > 1e-6)) { P.push(x); P.sort((p, q) => p - q); }
          const s = sums(f, A, P); hist.push({ U: s.U, L: s.L });
        };
        const nS = v.slider('cells in $P$', 1, 8, 3, { int: true, onChange: (n) => { P = uniform(a, b, n); hist = []; suggest(); } });
        v.button('Insert $x^*$ into $P$', () => { insert(xs.x); suggest(); });
        v.button('Reset', () => { hist = []; P = uniform(a, b, nS.value); suggest(); });
        // a short head start so the history panel has something to show
        insert(0.85); insert(0.16); suggest();
        let st = null;
        v.render(() => {
          const before = sums(f, A, P);
          const j = cellOf(xs.x), u = P[j - 1], w = P[j];
          const Pstar = P.slice(0, j).concat([xs.x], P.slice(j));
          const after = sums(f, A, Pstar);
          const [m1, M1] = supInf(f, u, xs.x), [m2, M2] = supInf(f, xs.x, w);
          const old = before.cells[j - 1];
          // other cells faint, the active cell in detail
          drawBars(S, before.cells.filter((_, i) => i !== j - 1), { ua: 0.07, lf: 0.12, la: 0.35 });
          S.rect(u, 0, w, old.M, { color: 'purple', width: 1.4, dash: [5, 4] });
          S.rect(u, 0, w, old.m, { color: 'teal', width: 1.4, dash: [5, 4] });
          S.rect(u, 0, xs.x, M1, { fill: 'purple', fillAlpha: 0.14, color: 'purple', width: 1.3 });
          S.rect(xs.x, 0, w, M2, { fill: 'purple', fillAlpha: 0.14, color: 'purple', width: 1.3 });
          S.rect(u, 0, xs.x, m1, { fill: 'teal', fillAlpha: 0.28, color: 'teal', width: 1.3 });
          S.rect(xs.x, 0, w, m2, { fill: 'teal', fillAlpha: 0.28, color: 'teal', width: 1.3 });
          // what U loses, what L gains
          S.rect(u, M1, xs.x, old.M, { fill: 'green', fillAlpha: 0.5, stroke: false });
          S.rect(xs.x, M2, w, old.M, { fill: 'green', fillAlpha: 0.5, stroke: false });
          S.rect(u, old.m, xs.x, m1, { fill: 'green', fillAlpha: 0.5, stroke: false });
          S.rect(xs.x, old.m, w, m2, { fill: 'green', fillAlpha: 0.5, stroke: false });
          for (const x of P) S.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.5 });
          S.vline(xs.x, { color: 'gold', width: 1.6 });
          S.fn(f, { domain: [a, b], color: 'ink', width: 2.4 });
          // α panel
          drawAlpha(SA, A, a, b, { width: 2 });
          for (const x of P) SA.line(x, 0, x, A(x), { color: 'muted', width: 1, dash: [3, 4], alpha: 0.5 });
          SA.line(u, A(u), xs.x, A(u), { color: 'gold', width: 1.2, dash: [3, 3] });
          SA.line(xs.x, A(xs.x), w, A(xs.x), { color: 'gold', width: 1.2, dash: [3, 3] });
          SA.line(xs.x, A(u), xs.x, A(xs.x), { color: 'gold', width: 6, cap: 'butt' });
          SA.line(w, A(xs.x), w, A(w), { color: 'gold', width: 6, cap: 'butt', alpha: 0.55 });
          SA.dot(xs.x, A(xs.x), { color: 'gold', r: 3.5 });
          // history
          const Hs = hist.length ? hist : [{ U: before.U, L: before.L }];
          const K = Math.max(6, Hs.length - 1 + 0.4);
          const lo = Math.min(...Hs.map((h) => h.L), exact), hi = Math.max(...Hs.map((h) => h.U), exact);
          SH.setView([-0.4, K], [lo - (hi - lo) * 0.12 - 0.02, hi + (hi - lo) * 0.12 + 0.02]);
          SH.hline(exact, { color: 'green', dash: [5, 4], width: 1.4 });
          SH.path(Hs.map((h, k) => [k, h.U]), { color: 'purple', width: 2 });
          SH.path(Hs.map((h, k) => [k, h.L]), { color: 'teal', width: 2 });
          Hs.forEach((h, k) => { SH.dot(k, h.U, { color: 'purple', r: 3.5 }); SH.dot(k, h.L, { color: 'teal', r: 3.5 }); });
          SH.tex('\\int f\\,d\\alpha', K, exact, { color: 'green', align: 'right', baseline: 'bottom', dx: -4, dy: -3, size: 12 });
          v.legend([['ink', '$f$'], ['purple', 'upper bars'], ['teal', 'lower bars'], ['green', 'lost by $U$ / gained by $L$', { area: true }], ['gold', '$x^*$ and the split of $\\Delta\\alpha_i$']]);
          st = { before, after, j };
        });
        v.readout(() => {
          if (!st) return '';
          const { before: B, after: Af } = st;
          return `$U(P)=${num(B.U)}\\ \\ge\\ U(P^*)=${num(Af.U)}$ $\\;$(drop $${num(B.U - Af.U)}$), $\\quad L(P)=${num(B.L)}\\ \\le\\ L(P^*)=${num(Af.L)}$ $\\;$(gain $${num(Af.L - B.L)}$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.5
    {
      num: '6.5',
      kind: 'Theorem',
      name: 'Lower integral ≤ upper integral',
      statement: String.raw`For every bounded $f$ and increasing $\alpha$ on $[a,b]$,
$$\underline{\int_a^b} f\,d\alpha\ \le\ \overline{\int_a^b} f\,d\alpha .$$`,
      idea: String.raw`Take any two partitions $P_1,P_2$ and their common refinement $P^*$. By 6.4, $L(P_1)\le L(P^*)\le U(P^*)\le U(P_2)$: **every** lower sum is below **every** upper sum, even for unrelated partitions. Taking the supremum over $P_1$ and then the infimum over $P_2$ gives the claim.`,
      caption: String.raw`$P_1$ (teal ticks) defines the lower step function, $P_2$ (purple ticks) the upper one; they never cross, whatever the two partitions. The strip shows the chain $L(P_1)\le L(P^*)\le U(P^*)\le U(P_2)$ through the common refinement $P^*=P_1\cup P_2$ (dashed steps). Change the sizes or draw new random partitions.`,
      deps: ['pma-6.4', 'pma-6.3'],
      tags: ['upper and lower sums', 'refinement'],
      viz(v) {
        const a = 0, b = 1, A = ALPHA();
        const f = withBreaks((x) => 0.62 + 0.27 * Math.cos(7 * x) * (1 - 0.3 * x) + 0.15 * x);
        const exact = rsIntegral(f, A, a, b);
        let seed = 7;
        const n1 = v.slider('cells of $P_1$', 1, 9, 3, { int: true });
        const n2 = v.slider('cells of $P_2$', 1, 9, 4, { int: true });
        v.button('New random $P_1,P_2$', () => { seed += 1; });
        const randPart = (n, s) => { const r = v.rng(s); const pts = []; for (let k = 0; k < n - 1; k++) pts.push(r.uniform(0.04, 0.96)); return [a, ...pts.sort((x, y) => x - y), b]; };
        const S = v.stage({ x: [-0.1, 1.04], y: [-0.36, 1.14], height: 300, full: true, xlabel: 'x', yticks: [0.2, 0.4, 0.6, 0.8, 1] });
        const NL = numStage(v, 'every lower sum is below every upper sum, through the common refinement');
        const steps = (cells, key) => { const pts = []; for (const c of cells) { pts.push([c.u, c[key]], [c.w, c[key]]); } return pts; };
        let st = null;
        v.render(() => {
          const P1 = randPart(n1.value, seed * 31 + 1), P2 = randPart(n2.value, seed * 57 + 2);
          const Ps = [...new Set([...P1, ...P2])].sort((x, y) => x - y);
          const s1 = sums(f, A, P1), s2 = sums(f, A, P2), ss = sums(f, A, Ps);
          // upper step function of P2, lower step function of P1
          const up = steps(s2.cells, 'M'), lo = steps(s1.cells, 'm');
          S.path([[a, 0], ...up, [b, 0]], { fill: 'purple', fillAlpha: 0.1, stroke: false, close: true });
          S.path([[a, 0], ...lo, [b, 0]], { fill: 'teal', fillAlpha: 0.15, stroke: false, close: true });
          S.path(up, { color: 'purple', width: 2.2 });
          S.path(lo, { color: 'teal', width: 2.2 });
          S.path(steps(ss.cells, 'M'), { color: 'purple', width: 1.2, dash: [4, 4], alpha: 0.8 });
          S.path(steps(ss.cells, 'm'), { color: 'teal', width: 1.2, dash: [4, 4], alpha: 0.8 });
          S.fn(f, { domain: [a, b], color: 'ink', width: 2.4 });
          // tick rows
          const row = (P, y, col, lab) => {
            S.line(a, y, b, y, { color: 'faint', width: 1 });
            for (const x of P) S.line(x, y - 0.035, x, y + 0.035, { color: col, width: 2.2 });
            S.tex(lab, a, y, { color: col, align: 'right', dx: -8, size: 13.5 });
          };
          row(P1, -0.09, 'teal', 'P_1'); row(P2, -0.18, 'purple', 'P_2'); row(Ps, -0.28, 'ink', 'P^*');
          // number line
          const vals = [s1.L, ss.L, ss.U, s2.U];
          const lo2 = Math.min(...vals), hi2 = Math.max(...vals), pad = (hi2 - lo2) * 0.22 + 0.03;
          numLine(NL, lo2 - pad, hi2 + pad);
          NL.line(ss.L, 0, ss.U, 0, { color: 'ink', width: 5, alpha: 0.18, cap: 'butt' });
          NL.line(exact, -0.3, exact, 0.3, { color: 'green', width: 2 });
          NL.tex('\\int f\\,d\\alpha', exact, 0.72, { color: 'green', baseline: 'bottom', size: 12.5 });
          NL.dot(s1.L, 0, { color: 'teal', r: 5.5, hollow: true, width: 2.2 });
          NL.dot(ss.L, 0, { color: 'teal', r: 5 });
          NL.dot(ss.U, 0, { color: 'purple', r: 5 });
          NL.dot(s2.U, 0, { color: 'purple', r: 5.5, hollow: true, width: 2.2 });
          NL.tex('L(P_1)', s1.L, 0, { color: 'teal', align: 'right', dx: -6, dy: -18, size: 13 });
          NL.tex('L(P^*)', ss.L, 0, { color: 'teal', align: 'right', dx: -4, dy: 18, size: 13 });
          NL.tex('U(P^*)', ss.U, 0, { color: 'purple', align: 'left', dx: 4, dy: 18, size: 13 });
          NL.tex('U(P_2)', s2.U, 0, { color: 'purple', align: 'left', dx: 6, dy: -18, size: 13 });
          v.legend([['ink', '$f$'], ['teal', 'lower step function of $P_1$'], ['purple', 'upper step function of $P_2$'], ['muted', 'steps of $P^*=P_1\\cup P_2$', { dash: true }], ['green', '$\\int f\\,d\\alpha$']]);
          st = { L1: s1.L, Ls: ss.L, Us: ss.U, U2: s2.U };
        });
        v.readout(() => st ? `$L(P_1)=${num(st.L1)}\\ \\le\\ L(P^*)=${num(st.Ls)}\\ \\le\\ U(P^*)=${num(st.Us)}\\ \\le\\ U(P_2)=${num(st.U2)}$. Since $P_1,P_2$ were arbitrary: $\\sup_{P_1}L(P_1)\\le\\inf_{P_2}U(P_2)$.` : '');
      },
    },
    // ------------------------------------------------------------------ 6.6
    {
      num: '6.6',
      kind: 'Theorem',
      name: 'The ε-criterion for integrability',
      statement: String.raw`$f\in\mathscr R(\alpha)$ on $[a,b]$ if and only if for every $\eps>0$ there is a partition $P$ of $[a,b]$ with
$$U(P,f,\alpha)-L(P,f,\alpha)<\eps .$$`,
      idea: String.raw`If such $P$ exist, then $L(P)\le\underline{\int}\le\overline{\int}\le U(P)$ (by 6.5) traps the gap between the lower and upper integrals below every $\eps$, so they coincide. Conversely, if $f\in\mathscr R(\alpha)$ pick $P_1$ with $U(P_1)$ within $\eps/2$ of the integral and $P_2$ with $L(P_2)$ within $\eps/2$; by 6.4 their common refinement does both at once.`,
      caption: String.raw`The shaded boxes span $[m_i,M_i]$ on each cell; their weighted heights $(M_i-m_i)\Delta\alpha_i$ are stacked in the right-hand column, whose total is $U-L$. Click the graph to add partition points, or refine the worst cell, until the column drops below $\eps$. Switch to the second $f$, which jumps exactly where $\alpha$ jumps: the column can never go below the red floor.`,
      deps: ['pma-6.4', 'pma-6.5'],
      see: ['pma-11.33'],
      tags: ['integrability', 'ε-criterion'],
      viz(v) {
        const a = 0, b = 1, s = 0.6, wj = 0.4, fj = 0.45;
        const A = integrator((x) => 0.6 * x, () => 0.6, [[s, wj]]);
        const FN = {
          good: withBreaks((x) => 0.55 + 0.3 * Math.sin(7 * x - 0.5) + 0.2 * x),
          bad: withBreaks((x) => 0.32 + 0.22 * Math.sin(4 * x) + (x > s ? fj : 0), [s]),
        };
        let P = uniform(a, b, 4);
        const reset = () => { P = uniform(a, b, 4); };
        const which = v.select('', [{ value: 'good', label: '$f$ continuous' }, { value: 'bad', label: '$f$ jumps where $\\alpha$ jumps' }], 'good', { onChange: reset });
        const eps = v.slider('$\\varepsilon$', 0.02, 0.4, 0.1, { step: 0.005 });
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.1, 1.15], height: 300, minWidth: 440, weight: 1, xlabel: 'x', title: 'boxes $[m_i,M_i]$ on each cell — click to add a point' });
        const C = v.stage({ x: [0, 1], y: [0, 0.8], height: 300, minWidth: 190, weight: 0.25, axes: 'box', xticks: [], title: 'the column $U-L$' });
        const contribs = () => sums(FN[which.value], A, P).cells.map((c) => (c.M - c.m) * c.da);
        v.button('Refine worst cell', () => {
          const g = contribs(); const i = g.indexOf(Math.max(...g));
          P.splice(i + 1, 0, (P[i] + P[i + 1]) / 2);
        });
        v.button('Reset', reset);
        S.onClick((x) => { if (x > a && x < b && P.every((p) => Math.abs(S.X(p) - S.X(x)) > 3)) { P.push(x); P.sort((p, q) => p - q); } });
        let st = null;
        v.render(() => {
          const f = FN[which.value];
          const { U, L, cells } = sums(f, A, P);
          const g = cells.map((c) => (c.M - c.m) * c.da), gmax = Math.max(...g, 1e-9), worst = g.indexOf(gmax);
          const gap = U - L, ok = gap < eps.value;
          cells.forEach((c, i) => {
            S.rect(c.u, c.m, c.w, c.M, { fill: 'accent', fillAlpha: 0.08 + 0.42 * g[i] / gmax, color: i === worst ? 'orange' : 'accent', width: i === worst ? 2 : 1, alpha: i === worst ? 1 : 0.5 });
          });
          for (const x of P) S.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.45 });
          S.vline(s, { color: 'orange', width: 1.4, dash: [2, 3], alpha: 0.8 });
          S.text('α jumps', s, 1.13, { color: 'orange', size: 11, dx: 4, align: 'left', baseline: 'top' });
          drawF(S, f, a, b);
          S.corner(`${cells.length} cells`, 'tl');
          S.corner(ok ? 'U − L < ε  ✓' : 'U − L ≥ ε', 'tr', { color: ok ? 'green' : 'muted', weight: 600 });
          // the column (scale fixed per f: the one-cell partition has the largest gap)
          const s1 = sums(f, A, [a, b]); const top = Math.max(0.42, (s1.U - s1.L) * 1.08);
          C.setView([0, 1], [0, top]);
          let y = 0;
          g.forEach((h, i) => { C.rect(0.28, y, 0.72, y + h, { fill: i === worst ? 'orange' : 'accent', fillAlpha: i === worst ? 0.55 : 0.12 + 0.4 * h / gmax, color: 'panel', width: 1 }); y += h; });
          C.hline(eps.value, { color: 'accent', width: 1.6, dash: [6, 4] });
          C.tex('\\varepsilon', 0.98, eps.value, { color: 'accent', align: 'right', baseline: 'bottom', dy: -2, size: 14 });
          C.line(0.2, gap, 0.8, gap, { color: ok ? 'green' : 'ink', width: 2.2 });
          C.tex('U-L', 0.5, gap, { color: ok ? 'green' : 'ink', baseline: 'bottom', dy: -3, size: 13 });
          if (which.value === 'bad') { C.hline(wj * fj, { color: 'red', width: 1.6 }); C.text('floor', 0.04, wj * fj, { color: 'red', size: 11, baseline: 'top', dy: 3 }); }
          v.legend([['ink', '$f$'], ['accent', 'box $[m_i,M_i]$ (darker = larger $(M_i-m_i)\\Delta\\alpha_i$)', { area: true }], ['orange', 'worst cell', { area: true }]]);
          st = { gap, ok, n: cells.length, bad: which.value === 'bad' };
        });
        v.readout(() => {
          if (!st) return '';
          const head = `$U(P,f,\\alpha)-L(P,f,\\alpha)=${num(st.gap, 4)}$ with ${st.n} cells; $\\;\\varepsilon=${num(eps.value, 3)}$. `;
          if (st.bad) return head + `The cell whose interior contains $0.6$ (or which starts at $0.6$) always has $M_i-m_i\\ge ${fj}$ and $\\Delta\\alpha_i\\ge ${wj}$, so $U-L\\ge ${num(wj * fj, 2)}$ for **every** $P$: $f\\notin\\mathscr R(\\alpha)$.`;
          return head + (st.ok ? 'Found a partition — and every refinement of it works too (6.7a).' : 'Keep refining.');
        });
      },
    },
    // ------------------------------------------------------------------ 6.7
    {
      num: '6.7',
      kind: 'Theorem',
      name: 'Tagged sums are trapped between L and U',
      statement: String.raw`Let $P=\{x_0,\dots,x_n\}$ satisfy $U(P,f,\alpha)-L(P,f,\alpha)<\eps$.
(a) The same inequality, with the same $\eps$, holds for every refinement of $P$.
(b) If $s_i,t_i\in[x_{i-1},x_i]$ are arbitrary, then $\sum_{i=1}^n\abs{f(s_i)-f(t_i)}\,\Delta\alpha_i<\eps$.
(c) If in addition $f\in\mathscr R(\alpha)$, then for any $t_i\in[x_{i-1},x_i]$
$$\Bigl|\sum_{i=1}^n f(t_i)\,\Delta\alpha_i-\int_a^b f\,d\alpha\Bigr|<\eps .$$`,
      idea: String.raw`(a) is 6.4: refining can only shrink $U-L$. For (b), $f(s_i)$ and $f(t_i)$ both lie in $[m_i,M_i]$, so their distance is at most $M_i-m_i$; sum with weights $\Delta\alpha_i$. For (c), both the tagged sum and the integral lie in the interval $[L(P,f,\alpha),U(P,f,\alpha)]$, whose length is less than $\eps$.`,
      caption: String.raw`Drag the gold tags $t_i$ along the graph, each inside its own cell, or randomize them. The gold rectangles are $f(t_i)$ over each cell, weighted by the printed $\Delta\alpha_i$ (two cells contain jumps of $\alpha$). On the strip, the tagged sum never leaves $[L,U]$, so it is never further than $U-L$ from the integral.`,
      deps: ['pma-6.6', 'pma-6.4'],
      tags: ['Riemann–Stieltjes sums', 'tags'],
      viz(v) {
        const a = 0, b = 1, A = ALPHA(), MAXN = 8;
        const f = withBreaks((x) => 0.5 + 0.35 * Math.sin(5.5 * x + 0.6) + 0.2 * x);
        const exact = rsIntegral(f, A, a, b);
        let P = uniform(a, b, 4);
        const S = v.stage({ x: [-0.04, 1.04], y: [-0.12, 1.16], height: 290, full: true, xlabel: 'x' });
        const NL = numStage(v, 'the tagged sum $S=\\sum f(t_i)\\Delta\\alpha_i$ against $[L,U]$');
        const tags = [];
        for (let k = 0; k < MAXN; k++) {
          const h = S.handle(0, 0, { color: 'gold', r: 6.5 });
          h.constrain = (x) => { const i = tags.indexOf(h); const xx = clamp(x, P[i], P[i + 1]); return [xx, f(xx)]; };
          tags.push(h);
        }
        const place = (mode) => {
          const n = P.length - 1;
          tags.forEach((t, k) => {
            t.visible = k < n; if (k >= n) return;
            const u = P[k], w = P[k + 1];
            t.x = mode === 'rand' ? u + (w - u) * Math.random() : u + (w - u) * (0.3 + 0.4 * ((k * 0.618) % 1));
            t.y = f(t.x);
          });
        };
        place('mid');
        v.slider('cells $n$', 1, MAXN, 4, { int: true, onChange: (n) => { P = uniform(a, b, n); place('mid'); } });
        v.button('Random tags', () => place('rand'));
        let st = null;
        v.render(() => {
          const { U, L, cells } = sums(f, A, P);
          let Ssum = 0;
          cells.forEach((c, i) => {
            const t = tags[i], ft = f(t.x);
            Ssum += ft * c.da;
            S.rect(c.u, 0, c.w, ft, { fill: 'gold', fillAlpha: 0.22, stroke: false });
            S.line(c.u, c.M, c.w, c.M, { color: 'purple', width: 1.6 });
            S.line(c.u, c.m, c.w, c.m, { color: 'teal', width: 1.6 });
            S.line(c.u, ft, c.w, ft, { color: 'gold', width: 1.6, dash: [4, 3] });
            if (S.X(c.w) - S.X(c.u) > 70) S.text(`Δα = ${num(c.da, 2)}`, (c.u + c.w) / 2, 0.035, { color: 'muted', size: 11, align: 'center', baseline: 'bottom' });
          });
          for (const x of P) S.vline(x, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.5 });
          for (const [p] of A.jumps) S.vline(p, { color: 'orange', width: 1.4, dash: [2, 3], alpha: 0.8 });
          S.fn(f, { domain: [a, b], color: 'ink', width: 2.4 });
          const lo = Math.min(L, exact), hi = Math.max(U, exact), pad = (hi - lo) * 0.25 + 0.02;
          numLine(NL, lo - pad, hi + pad);
          NL.line(L, 0, U, 0, { color: 'purple', width: 7, alpha: 0.2, cap: 'butt' });
          NL.dot(L, 0, { color: 'teal', r: 5 }); NL.dot(U, 0, { color: 'purple', r: 5 });
          NL.tex('L', L, 0, { color: 'teal', align: 'right', dx: -8, dy: -12, size: 14 });
          NL.tex('U', U, 0, { color: 'purple', align: 'left', dx: 8, dy: -12, size: 14 });
          NL.line(exact, -0.3, exact, 0.3, { color: 'green', width: 2.2 });
          NL.tex('\\int f\\,d\\alpha', exact, 0.36, { color: 'green', baseline: 'bottom', size: 12.5 });
          NL.dot(Ssum, 0, { color: 'gold', r: 6.5 });
          NL.tex('S', Ssum, 0, { color: 'gold', baseline: 'top', dy: 12, size: 15 });
          v.legend([['ink', '$f$'], ['gold', 'tags $t_i$ and values $f(t_i)$'], ['purple', '$M_i$'], ['teal', '$m_i$'], ['orange', 'jumps of $\\alpha$']]);
          st = { U, L, S: Ssum };
        });
        v.readout(() => st ? `$S=\\sum f(t_i)\\Delta\\alpha_i=${num(st.S)}$, $\\;L=${num(st.L)}\\le S\\le U=${num(st.U)}$. $\\;|S-\\int f\\,d\\alpha|=${num(Math.abs(st.S - exact))}\\ \\le\\ U-L=${num(st.U - st.L)}$.` : '');
      },
    },
  ],
};
