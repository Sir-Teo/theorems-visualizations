// Rudin, Real and Complex Analysis — Chapter 2, part 5: continuity properties of measurable
// functions — Lusin's theorem and the Vitali–Carathéodory theorem (2.24–2.25).

function tnum(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const k = Math.floor(Math.log10(a)), m = x / Math.pow(10, k);
  return `${Number(m.toPrecision(d))}\\times 10^{${k}}`;
}
/** Smith–Volterra–Cantor set: intervals of A_n and the gaps removed at each step (with their step number) */
function fatCantor(level) {
  let I = [[0, 1]]; const gaps = [];
  for (let k = 1; k <= level; k++) {
    const g = Math.pow(4, -k);
    I = I.flatMap(([a, b]) => { const m = (a + b) / 2; gaps.push([m - g / 2, m + g / 2, k]); return [[a, m - g / 2], [m + g / 2, b]]; });
  }
  return { I, gaps };
}
const DEEP = fatCantor(11);
const sub = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');
/**
 * Lusin's g: equal to fOff off the open set `bad` (sorted disjoint intervals [a, b, f(a), f(b)]),
 * and linear across each bad interval between the values of f at its endpoints.
 */
function lusinG(fOff, bad) {
  return (x) => {
    let lo = 0, hi = bad.length - 1;
    while (lo <= hi) { const m = (lo + hi) >> 1, [a, b, fa, fb] = bad[m]; if (x <= a) hi = m - 1; else if (x >= b) lo = m + 1; else return fa + (fb - fa) * (x - a) / (b - a); }
    return fOff(x);
  };
}
/** Lusin data for χ_A: given ε, choose stage n and ramp width η; return {n, eta, bad (drawn up to DEEP), measure} */
function lusinFat(eps) {
  let n = 1; while (Math.pow(2, -n - 1) >= eps / 2 && n < 10) n++;
  const { I } = fatCantor(n);
  const eta = Math.min(Math.pow(4, -n) / 3, (eps / 2) / (2 * I.length + 2) * 0.9);
  const bad = [];
  for (const [a, b] of I) { bad.push([a - eta, a, 0, 1]); bad.push([b, b + eta, 1, 0]); }
  for (const [a, b, k] of DEEP.gaps) if (k > n) bad.push([a, b, 1, 1]); // both ends lie in A
  bad.sort((p, q) => p[0] - q[0]);
  const measure = Math.pow(2, -n - 1) + 2 * I.length * eta;
  // off the bad set, f = χ_A = χ_{A_n} (every later gap of A_n is inside the bad set)
  const fOff = (x) => { for (const [a, b] of I) if (x >= a && x <= b) return 1; return 0; };
  return { n, eta, bad, measure, I, fOff };
}
/** jump points of sgn(sin(1/x)) in (0,1] */
const JUMPS = Array.from({ length: 5000 }, (_, i) => 1 / ((i + 1) * Math.PI)).filter((x) => x <= 1);
const fSgn = (x) => (x <= 0 || x > 1 ? 0 : Math.sign(Math.sin(1 / x)) || 0);
/** Lusin data for sgn(sin 1/x) on (0,1]: remove (0,δ), small intervals about the jumps, and a ramp after 1 */
function lusinSgn(eps) {
  const delta = eps / 3;
  const bad = [];
  let tot = 0, lo = delta;
  JUMPS.forEach((x, k) => {
    if (x <= delta * 1.05) return;
    const sp = Math.min(x - (JUMPS[k + 1] ?? 0), k > 0 ? JUMPS[k - 1] - x : 1);
    const r = Math.min(eps / 3 * Math.pow(2, -Math.min(k, 40) - 2), sp / 3);
    bad.push([x - r, x + r, fSgn(x - r), fSgn(x + r)]); tot += 2 * r;
    lo = Math.min(lo, x - r);
  });
  const d = Math.min(delta, lo * 0.98);
  bad.push([0, d, 0, fSgn(d)]); tot += d;
  const ramp = eps / 4; bad.push([1, 1 + ramp, fSgn(1), 0]); tot += ramp;
  bad.sort((p, q) => p[0] - q[0]);
  return { bad, measure: tot, fOff: fSgn };
}

export default {
  book: 'rca',
  chapter: 2,
  items: [
    // ------------------------------------------------------------ 2.24
    {
      num: '2.24',
      kind: 'Theorem',
      name: "Lusin's theorem",
      statement: String.raw`Let $X$ be a locally compact Hausdorff space and $\mu$ a measure on $X$ with the properties listed in the Riesz representation theorem 2.14. Let $f$ be a complex measurable function on $X$ and $A\subset X$ with $\mu(A)<\infty$ and $f=0$ off $A$, and let $\eps>0$. Then there is a $g\in C_c(X)$ such that
$$\mu(\{x: f(x)\ne g(x)\})<\eps,$$
and $g$ can be chosen with $\sup_X|g|\le\sup_X|f|$.`,
      idea: String.raw`Start with $0\le f<1$ and $A$ compact, and expand $f=\sum_n 2^{-n}\chi_{T_n}$ in binary (via 1.17). Regularity puts each $T_n$ between a compact $K_n$ and an open $V_n$ with $\mu(V_n-K_n)<2^{-n}\eps$. Urysohn gives $K_n\prec h_n\prec V_n$, and $g=\sum 2^{-n}h_n$ is a uniform limit of continuous functions that agrees with $f$ outside $\bigcup(V_n-K_n)$. Bounded, then general $f$ follow by cutting away sets of small measure. Composing with the radial retraction onto the disc of radius $\sup|f|$ gives the bound on $g$.`,
      caption: String.raw`$f=\chi_A$ for a fat Cantor set $A$ of measure $\tfrac12$. It is discontinuous at *every* point of $A$, yet Lusin's theorem applies. For a given $\eps$, the red open set (later gaps of $A$, plus short ramps) has measure $<\eps$. Off it, the continuous $g$ (green: $1$ on the stage-$n$ intervals, sloping to $0$) equals $f$. Shrink $\eps$ and drag the gold window to inspect. The second function has jumps accumulating at $0$.`,
      deps: ['rca-2.14', 'rca-2.12', 'rca-2.7', 'rca-1.17'],
      see: ['rca-3.14', 'rca-2.24a'],
      tags: ['Lusin', 'measurable functions', 'continuity'],
      viz(v) {
        const M = v.M;
        const which = v.select('$f$', [{ value: 'fat', label: String.raw`$\chi_A$, $A$ fat Cantor` }, { value: 'sgn', label: String.raw`$\operatorname{sgn}\sin(1/x)$ on $(0,1]$` }], 'fat');
        const eps = v.slider('$\\varepsilon$', 0.004, 0.5, 0.06, { log: true, fmt: (x) => x.toFixed(3) });
        const T = v.stage({ x: [-0.06, 1.12], y: [-0.75, 1.3], height: 260, full: true, axes: false, title: '$f$ (ink), the continuous $g$ (green) and the small open set $\\{f\\neq g\\}$ (red, shaded by local density)' });
        const Z = v.stage({ x: [0, 1], y: [-0.75, 1.3], height: 230, full: true, axes: false, title: 'magnified window' });
        let yH = -0.65;
        const c = T.handle(0.3, yH, { color: 'gold', r: 6, constrain: (x) => [Math.max(0.02, Math.min(1.0, x)), yH] });
        let st = {};
        const drawF = (S, fat, x0, x1) => {
          const px = (x1 - x0) / S.width;
          if (fat) {
            // f = 1 on A (deep intervals), 0 on the gaps
            const segs1 = [], segs0 = [];
            for (const [a, b] of DEEP.I) if (b >= x0 && a <= x1) segs1.push([a, b]);
            for (const [a, b] of DEEP.gaps) if (b >= x0 && a <= x1 && b - a > px * 0.3) segs0.push([a, b]);
            for (const [a, b] of segs1) S.line(a, 1, Math.max(b, a + px * 0.6), 1, { color: 'ink', width: 2.6, cap: 'butt' });
            for (const [a, b] of segs0) S.line(a, 0, b, 0, { color: 'ink', width: 2.6, cap: 'butt' });
            S.line(x0 - 1, 0, Math.min(0, x1), 0, { color: 'ink', width: 2.6, cap: 'butt' }); if (x1 > 1) S.line(1, 0, x1 + 1, 0, { color: 'ink', width: 2.6, cap: 'butt' });
          } else S.fn(fSgn, { color: 'ink', width: 1.6, n: 3000 });
        };
        // the bad set drawn honestly: each pixel column shaded by the fraction of it that the set covers
        const drawBad = (S, bad, x0, x1, y0, y1) => {
          const W = Math.ceil(S.width), px = (x1 - x0) / W, cov = new Float64Array(W);
          for (const [a, b] of bad) {
            if (b < x0 || a > x1) continue;
            const i0 = Math.max(0, Math.floor((a - x0) / px)), i1 = Math.min(W - 1, Math.floor((b - x0) / px));
            for (let i = i0; i <= i1; i++) { const l = x0 + i * px; cov[i] += Math.max(0, Math.min(b, l + px) - Math.max(a, l)) / px; }
          }
          for (let i = 0; i < W; i++) if (cov[i] > 1e-4) S.rect(x0 + i * px, y0, x0 + (i + 1) * px, y1, { fill: 'red', fillAlpha: Math.min(1, 0.12 + Math.sqrt(cov[i])), stroke: false });
        };
        v.render(() => {
          const fat = which.value === 'fat', e = eps.value;
          const L = fat ? lusinFat(e) : lusinSgn(e);
          const g = lusinG(L.fOff, L.bad);
          const w = fat ? 0.03 : 0.035, a0 = c.x - w, a1 = c.x + w;
          const yb = fat ? [-0.75, 1.3] : [-1.75, 1.35], r0 = fat ? -0.42 : -1.45, r1 = fat ? -0.27 : -1.27;
          yH = fat ? -0.62 : -1.62; c.y = yH;
          T.setView(null, yb); Z.setView([a0, a1], yb);
          for (const [S, x0, x1] of [[T, -0.06, 1.12], [Z, a0, a1]]) {
            S.hline(0, { color: 'faint', width: 1 }); S.hline(1, { color: 'faint', width: 1, dash: [3, 4] }); if (!fat) S.hline(-1, { color: 'faint', width: 1, dash: [3, 4] });
            for (const [a, b] of L.bad) if (b >= x0 && a <= x1 && (b - a) / ((x1 - x0) / S.width) > 3) S.vband(a, b, { color: 'red', alpha: 0.07 });
            drawBad(S, L.bad, x0, x1, r0, r1);
            S.fn(g, { domain: [x0, x1], color: 'green', width: 3.2, alpha: 0.75, n: 2400, connect: true });
            drawF(S, fat, x0, x1);
          }
          T.rect(a0, r1 + 0.08, a1, yb[1] - 0.06, { color: 'gold', width: 1.2, dash: [4, 3] });
          T.text('{f ≠ g}', -0.058, (r0 + r1) / 2, { color: 'red', size: 11, weight: 600 });
          st = { ...L, fat };
        });
        v.legend([['ink', '$f$'], ['green', '$g\\in C_c(\\R)$'], ['red', 'open set where $f\\ne g$', { area: true }], ['gold', 'magnified window']]);
        v.readout(() => (st.fat ? `Stage $n=${st.n}$, ramps of width $${tnum(st.eta)}$: $\\;m(\\{f\\ne g\\})\\le 2^{-${st.n + 1}}+${2 * st.I.length}\\eta=${tnum(st.measure)}<\\varepsilon$.`
          : `$m(\\{f\\ne g\\})\\le ${tnum(st.measure)}<\\varepsilon$: an interval $(0,\\delta)$, shrinking intervals about the jumps $1/(k\\pi)>\\delta$, and a ramp after $1$.`) + ' Off this set $g=f$, and $\\sup|g|=\\sup|f|=1$.');
      },
    },
    // ------------------------------------------------------------ 2.24a
    {
      num: '2.24a',
      kind: 'Corollary',
      name: 'Measurable functions are a.e. limits of C_c functions',
      statement: String.raw`Under the hypotheses of Lusin's theorem, suppose in addition that $|f|\le1$. Then there are $g_n\in C_c(X)$ with $|g_n|\le1$ such that $g_n(x)\to f(x)$ for almost every $x$.`,
      idea: String.raw`Apply Lusin's theorem with $\eps=2^{-n}$ to get $g_n$ with $|g_n|\le1$ and $\mu(E_n)<2^{-n}$, where $E_n=\{f\ne g_n\}$. Since $\sum\mu(E_n)<\infty$, almost every $x$ lies in only finitely many $E_n$ (1.41), and for such $x$ we have $g_n(x)=f(x)$ for all large $n$.`,
      caption: String.raw`$f=\operatorname{sgn}\sin(1/x)$ on $(0,1]$. The $n$-th Lusin approximant $g_n$ (green) differs from $f$ only on the red set $E_n$, of measure $<2^{-n}$. The right panel follows $g_n(x)$ for the gold sample points as $n$ grows: each sequence locks onto $f(x)=\pm1$. The jump point $1/\pi$ lies in every $E_n$, so there $g_n=0$ forever. It belongs to the null set on which convergence may fail.`,
      deps: ['rca-2.24', 'rca-1.41'],
      tags: ['Lusin', 'almost everywhere'],
      viz(v) {
        const M = v.M;
        const n = v.slider('$n$', 1, 12, 3, { int: true });
        const L = v.stage({ x: [-0.04, 1.08], y: [-1.75, 1.35], height: 320, axes: false, minWidth: 330, weight: 1.35, title: '$f$, $g_n$ and $E_n=\\{f\\neq g_n\\}$' });
        const R = v.stage({ x: [0.5, 12.5], y: [-1.25, 1.25], height: 320, axes: 'box', minWidth: 250, title: '$g_k(x_j)$ against $k$', xticks: [1, 3, 5, 7, 9, 11], yticks: [-1, 0, 1] });
        const samples = [0.9, 0.62, 0.45, 0.27, 0.2, 0.135, 0.083, 1 / Math.PI];
        const COLS = ['accent', 'orange', 'purple', 'teal', 'pink', 'green', 'gold', 'red'];
        const data = M.range(12).map((k) => { const Ld = lusinSgn(Math.pow(2, -(k + 1))); return { ...Ld, g: lusinG(Ld.fOff, Ld.bad) }; });
        let st = {};
        v.render(() => {
          const D = data[n.value - 1];
          const px = 1.12 / L.width;
          L.hline(0, { color: 'faint', width: 1 }); L.hline(1, { color: 'faint', width: 1, dash: [3, 4] }); L.hline(-1, { color: 'faint', width: 1, dash: [3, 4] });
          for (const [a, b] of D.bad) L.rect(a, -1.6, Math.max(b, a + px), -1.4, { fill: 'red', fillAlpha: 0.85, stroke: false });
          L.fn(fSgn, { color: 'ink', width: 1.8, n: 3000 });
          L.fn(D.g, { color: 'green', width: 2.2, n: 3000, connect: true });
          samples.forEach((x, j) => { L.line(x, -1.35, x, 1.25, { color: COLS[j], width: 1, alpha: 0.5, dash: [2, 3] }); L.dot(x, D.g(x), { color: COLS[j], r: 4 }); });
          // sequences
          R.hline(1, { color: 'faint', width: 1, dash: [3, 4] }); R.hline(-1, { color: 'faint', width: 1, dash: [3, 4] });
          samples.forEach((x, j) => {
            const seq = data.map((d, k) => [k + 1, d.g(x) + (j - 3.5) * 0.012]);
            R.path(seq, { color: COLS[j], width: 1.6, alpha: 0.85 });
            R.dot(n.value, data[n.value - 1].g(x), { color: COLS[j], r: 3.6 });
          });
          R.vline(n.value, { color: 'muted', width: 1, dash: [4, 4] });
          st = { meas: D.measure, n: n.value, settled: samples.slice(0, 7).filter((x) => Math.abs(D.g(x) - fSgn(x)) < 1e-12).length };
        });
        v.legend([['ink', '$f$'], ['green', '$g_n$'], ['red', '$E_n$', { area: true }]]);
        v.readout(() => `$m(E_{${st.n}})\\le ${tnum(st.meas)}<2^{-${st.n}}$; ${st.settled} of the 7 generic sample points already have $g_n(x)=f(x)$. The point $x=1/\\pi$ (red) stays in every $E_n$, a null exceptional set.`);
      },
    },
    // ------------------------------------------------------------ 2.25
    {
      num: '2.25',
      kind: 'Theorem',
      name: 'Vitali–Carathéodory theorem',
      statement: String.raw`Let $X$ be a locally compact Hausdorff space and $\mu$ a measure on $X$ with the properties listed in 2.14. Let $f\in L^1(\mu)$ be real-valued and $\eps>0$. Then there are functions $u$ and $v$ on $X$ with $u\le f\le v$, $u$ upper semicontinuous and bounded above, $v$ lower semicontinuous and bounded below, and
$$\int_X(v-u)\,d\mu<\eps.$$`,
      idea: String.raw`For $f\ge0$, write $f=\sum_i c_i\chi_{E_i}$ with $c_i>0$ (differences of the simple functions of 1.17). By regularity choose compact $K_i\subset E_i\subset V_i$ open with $c_i\mu(V_i-K_i)<2^{-i-1}\eps$. Then $v=\sum_i c_i\chi_{V_i}$ is lower semicontinuous, being a sum of such functions (2.8), possibly with value $+\infty$. The finite sum $u=\sum_{i\le N}c_i\chi_{K_i}$ is upper semicontinuous and bounded, and $N$ is chosen to make the tail $\sum_{i>N}c_i\mu(E_i)$ small. For general $f$, apply this to $f^+$ and $f^-$.`,
      caption: String.raw`First: $f=x^{-1/2}$ on $(0,1]$, unbounded but integrable, cut into layers $c_i\chi_{E_i}$ of height $h$. Each layer is squeezed between a compact $K_i$ and an open $V_i$. The orange $v$ (lsc, $=+\infty$ at $0$) and the blue $u$ (usc, bounded) enclose $f$ in a gold region of area $<\eps$. Second: $f=\chi_U$ for the dense open complement $U$ of a fat Cantor set. Here $v=f$ already, and $u$ keeps finitely many closed gap intervals.`,
      deps: ['rca-2.8', 'rca-2.14', 'rca-1.17', 'rca-1.27'],
      see: ['rca-7.21'],
      tags: ['semicontinuity', 'integration', 'approximation'],
      viz(v) {
        const M = v.M;
        const which = v.select('$f$', [{ value: 'root', label: String.raw`$x^{-1/2}$ on $(0,1]$` }, { value: 'gap', label: String.raw`$\chi_U$, $U=[0,1]\setminus A$` }], 'root');
        const eps = v.slider('$\\varepsilon$', 0.2, 1.5, 0.8, { step: 0.01 });
        const S = v.stage({ x: [-0.06, 1.1], y: [-0.4, 6.4], height: 380, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        let st = {};
        v.render(() => {
          const e = eps.value;
          if (which.value === 'root') {
            const h = 0.25, f = (x) => (x > 0 && x <= 1 ? 1 / Math.sqrt(x) : 0);
            // layers E_i = {f >= i h} = (0, a_i] with a_i = min(1, (ih)^-2); the tail beyond N has integral < ε/4
            const N = Math.ceil(4 / (h * e)) + 1;
            const ymax = Math.max(6, N * h * 1.12);
            S.setView(null, [-ymax * 0.06, ymax]);
            const a = (i) => Math.min(1, 1 / (i * h) ** 2);
            const tol = (i) => e * Math.pow(2, -i - 1) / (4 * h); // c_i·μ(V_i − K_i) ≤ 4h·tol = ε 2^{-i-1}
            const Kint = (i) => [tol(i), a(i) - (i * h <= 1 ? 0 : tol(i))];
            const Vint = (i) => [-tol(i), a(i) + tol(i)];
            const u = (x) => { let s = 0; for (let i = 1; i <= N; i++) { const [p, q] = Kint(i); if (x >= p && x <= q) s += h; } return s; };
            const vf = (x) => { let s = 0; for (let i = 1; i <= 4000; i++) { const [p, q] = Vint(i); if (x > p && x < q) s += h; else if (i * h > 1 && x >= q) break; } return s; };
            const xs = M.linspace(-0.06, 1.1, 1400);
            S.poly(xs.map((x) => [x, Math.min(vf(x), ymax * 1.2)]).concat(xs.slice().reverse().map((x) => [x, u(x)])), { fill: 'gold', fillAlpha: 0.32, stroke: false });
            S.path(xs.map((x) => [x, Math.min(vf(x), ymax * 1.2)]), { color: 'orange', width: 2 });
            S.path(xs.map((x) => [x, u(x)]), { color: 'accent', width: 2 });
            S.fn(f, { domain: [0.002, 1], color: 'ink', width: 2.2 });
            S.dot(1, 1, { color: 'ink', r: 3.5 });
            S.text('v(0) = +∞', 0.015, ymax * 0.95, { color: 'orange', size: 12, weight: 600 });
            S.hline(N * h, { color: 'accent', width: 1, dash: [3, 4] });
            S.tex(String.raw`\sup u=${v.fix(N * h, 2)}`, 1.08, N * h, { color: 'accent', align: 'right', dy: -11, size: 13 });
            // exact ∫(v−u) = Σ_{i≤N} h(m(V_i) − m(K_i)) + Σ_{i>N} h m(V_i)
            let I = 0;
            for (let i = 1; i <= N; i++) { const [p, q] = Kint(i), [r, s] = Vint(i); I += h * ((s - r) - (q - p)); }
            for (let i = N + 1; i <= 200000; i++) { const [r, s] = Vint(i); I += h * (s - r); }
            st = { I, e, N, h, root: true };
          } else {
            S.setView(null, [-0.25, 1.4]);
            // U = union of the gaps of the fat Cantor set; keep the gaps of steps ≤ n, shrunk by τ at each end
            let n = 1; while (Math.pow(2, -n - 1) >= e / 8 && n < 10) n++;
            const kept = DEEP.gaps.filter(([, , k]) => k <= n);
            const tau = Math.min(Math.pow(4, -n) / 6, (e / 2) / (2 * kept.length) * 0.9);
            const px = 1.16 / S.width;
            // f = χ_U drawn as a barcode, v = f, u = χ_K
            S.line(-0.06, 0, 0, 0, { color: 'ink', width: 2.4 }); S.line(1, 0, 1.1, 0, { color: 'ink', width: 2.4 });
            for (const [a, b, k] of DEEP.gaps) { if (k > n && b - a > px * 0.25) S.rect(a, 0, Math.max(b, a + px * 0.6), 1, { fill: 'gold', fillAlpha: 0.45, stroke: false }); }
            for (const [a, b] of kept) { S.rect(a, 0, a + tau, 1, { fill: 'gold', fillAlpha: 0.45, stroke: false }); S.rect(b - tau, 0, b, 1, { fill: 'gold', fillAlpha: 0.45, stroke: false }); }
            for (const [a, b] of DEEP.gaps) if (b - a > px * 0.25) S.line(a, 1, b, 1, { color: 'orange', width: 3.2, cap: 'butt' });
            for (const [a, b] of DEEP.I) S.line(a, 0, Math.max(b, a + px * 0.5), 0, { color: 'ink', width: 2.4, cap: 'butt' });
            for (const [a, b] of kept) { S.line(a + tau, 1, b - tau, 1, { color: 'accent', width: 3.2, cap: 'butt' }); S.dot(a + tau, 1, { color: 'accent', r: 2.6 }); S.dot(b - tau, 1, { color: 'accent', r: 2.6 }); }
            S.text('f = v = χ_U (orange) is lower semicontinuous;  u = χ_K (blue), K = finitely many closed intervals', 0.0, 1.27, { color: 'muted', size: 11.5 });
            const I = Math.pow(2, -n - 1) + 2 * kept.length * tau;
            st = { I, e, n, kept: kept.length, root: false };
          }
        });
        v.legend([['ink', '$f$'], ['orange', '$v$ — lower semicontinuous, $v\\ge f$'], ['accent', '$u$ — upper semicontinuous, $u\\le f$'], ['gold', '$v-u$, total area $<\\varepsilon$', { area: true }]]);
        v.readout(() => st.root ? `Layers of height $h=${st.h}$, $N=${st.N}$ kept in $u$: $\\;\\int(v-u)\\,dm=${v.fix(st.I, 4)}<\\varepsilon=${v.fix(st.e, 2)}$, though $v(0)=+\\infty$ and $f$ is unbounded.`
          : `$u=\\chi_K$ where $K$ is the ${st.kept} gaps removed in the first ${st.n} steps, each shrunk to a closed interval: $\\int(v-u)\\,dm=2^{-${st.n + 1}}+\\text{(trimmed ends)}=${tnum(st.I)}<\\varepsilon$.`);
      },
    },
  ],
};
