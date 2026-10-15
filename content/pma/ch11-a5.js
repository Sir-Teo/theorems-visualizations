// Rudin, Principles of Mathematical Analysis — Chapter 11 (part 5): L², orthonormal systems,
// completeness, Riesz–Fischer and Parseval (11.38–11.45).

const PI = Math.PI, TAU = 2 * Math.PI;
const PI_TICKS = [[-PI, '−π'], [-PI / 2, '−π/2'], [PI / 2, 'π/2'], [PI, 'π']];
/** Stage-n Cantor-type set in [0,1] (fat: remove 4^{-k} at stage k; else middle thirds). */
function cantorKeep(n, fat) {
  let keep = [[0, 1]];
  for (let k = 1; k <= n; k++) keep = keep.flatMap(([a, b]) => { const L = fat ? Math.pow(4, -k) : (b - a) / 3, m = (a + b) / 2; return [[a, m - L / 2], [m + L / 2, b]]; });
  return keep;
}
function mergeIntervals(list) {
  const s = list.filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]); const out = [];
  for (const [a, b] of s) { if (out.length && a <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], b); else out.push([a, b]); }
  return out;
}
/** Distance from x to a sorted list of disjoint closed intervals (0 inside). */
function distTo(I, x) {
  let lo = 0, hi = I.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (I[m][1] < x) lo = m + 1; else hi = m; }
  let d = Infinity;
  for (const j of [lo - 1, lo, lo + 1]) { const J = I[j]; if (!J) continue; d = Math.min(d, x < J[0] ? J[0] - x : x > J[1] ? x - J[1] : 0); }
  return d;
}
const inIntervals = (I, x) => distTo(I, x) === 0;
/** Rademacher r_k (k ≥ 1) and Walsh w_n (Paley order) on [0,1). */
const rad = (k, x) => (Math.floor(x * Math.pow(2, k)) % 2 ? -1 : 1);
function walsh(n, x) { let s = 1, k = 1; while (n) { if (n & 1) s *= rad(k, x); n >>= 1; k++; } return s; }
/** Typewriter: n = 2^k + j (0 ≤ j < 2^k) ↦ indicator of [j/2^k, (j+1)/2^k]. */
function tw(n) { const k = Math.floor(Math.log2(n)), j = n - (1 << k); return [j / (1 << k), (j + 1) / (1 << k), k]; }

export default {
  collection: 'pma',
  chapter: 11,
  items: [
    {
      num: '11.38',
      kind: 'Theorem',
      name: 'Continuous functions are dense in L²[a,b]',
      statement: String.raw`For every $f\in\mathscr L^2$ on $[a,b]$ and every $\eps>0$ there is a function $g$, continuous on $[a,b]$, with
$$\|f-g\|=\Big(\int_a^b|f-g|^2\,dx\Big)^{1/2}<\eps .$$`,
      idea: String.raw`Split $f$ into real and imaginary, positive and negative parts, approximate each by simple functions (11.20; the $\mathscr L^2$ error tends to $0$ by dominated convergence), and so reduce to $f=K_E$ with $E\subset[a,b]$ measurable. Choose a closed $F$ and an open $V$ with $F\subset E\subset V$ and $m(V-F)<\eps$, and put
$$g(x)=\frac{d(x,V^c)}{d(x,V^c)+d(x,F)} .$$
Then $g$ is continuous, $g=1$ on $F$, $g=0$ off $V$, and $|g-K_E|\le K_{V-F}$, so $\|g-K_E\|^2\le m(V-F)$.`,
      caption: String.raw`$f=K_E$ (black). The green $g$ is the proof's continuous function for a closed $F\subset E$ and an open $V\supset E$ (orange band: $V-F$). Shrink $\eta$, which controls $m(V-F)$: the $\mathscr L^2$ error (red area $=|g-K_E|^2$) goes to $0$ while the sup error stays near $1$ — density holds in $\mathscr L^2$, not uniformly. For the fat Cantor set, $E$ is closed and nowhere dense, yet it too is approximated.`,
      deps: ['pma-11.20', 'pma-11.32', 'pma-11.10', 'pma-11.36', 'pma-11.34'],
      see: ['rca-3.14', 'rca-2.12'],
      tags: ['L2', 'density', 'approximation'],
      viz(v) {
        const M = v.M;
        const which = v.select('$E=$', [{ value: 'int', label: 'two intervals' }, { value: 'fat', label: 'fat Cantor set' }], 'int');
        const eS = v.slider('$\\eta$', 0.0005, 0.12, 0.05, { log: true, fmt: (x) => v.fmt(x, 2) });
        const T = v.stage({ x: [0, 1], y: [-0.3, 1.2], height: 280, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0.5, 1] });
        const B = v.stage({ x: [-3.4, -0.9], y: [-0.08, 1.12], height: 170, full: true, axes: 'box', xticks: [[-3, '0.001'], [-2, '0.01'], [-1, '0.1']], yticks: [0, 0.5, 1], title: '$\\|g-K_E\\|$ (red) and $\\sup|g-K_E|$ (grey) against $\\eta$ (log scale)' });
        const SETS = { int: [[0.15, 0.4], [0.55, 0.85]], fat: cantorKeep(9, true) };
        // E for 'int' is open (a,b); F = shrunk closed intervals, V = enlarged open intervals. For the fat Cantor set E = F is closed.
        const build = (w, eta) => {
          const E = SETS[w];
          const F = w === 'int' ? E.map(([a, b]) => [a + eta, b - eta]).filter(([a, b]) => b > a) : E;
          const V = mergeIntervals(E.map(([a, b]) => [a - eta, b + eta]));
          const g = (x) => { const J = V.find(([a, b]) => x > a && x < b); const dv = J ? Math.min(x - J[0], J[1] - x) : 0; const df = distTo(F, x); return dv + df > 0 ? dv / (dv + df) : 0; };
          return { E, F, V, g };
        };
        const errs = (w, eta) => {
          const { E, g } = build(w, eta); const N = 20000; let l2 = 0, sup = 0;
          for (let i = 0; i < N; i++) { const x = (i + 0.5) / N, d = Math.abs(g(x) - (inIntervals(E, x) ? 1 : 0)); l2 += d * d / N; sup = Math.max(sup, d); }
          return { l2: Math.sqrt(l2), sup };
        };
        const CACHE = {};
        const curve = (w) => (CACHE[w] ||= M.linspace(-3.3, -0.92, 26).map((t) => { const e = errs(w, Math.pow(10, t)); return [t, e.l2, e.sup]; }));
        let st = {};
        v.render(() => {
          const w = which.value, eta = eS.value, { E, F, V, g } = build(w, eta);
          for (const [a, b] of V) T.rect(Math.max(0, a), -0.2, Math.min(1, b), -0.12, { fill: 'orange', fillAlpha: 0.6, stroke: false });
          for (const [a, b] of F) T.rect(a, -0.2, b, -0.12, { fill: 'blue', fillAlpha: 0.85, stroke: false });
          T.text('F', 0.005, -0.16, { color: 'blue', size: 11, dy: -12 });
          T.text('V − F', 0.06, -0.16, { color: 'orange', size: 11, dy: -12 });
          // |g − K_E|^2 shaded
          const N = 3000, pts = [];
          for (let i = 0; i <= N; i++) { const x = i / N; pts.push([x, (g(x) - (inIntervals(E, x) ? 1 : 0)) ** 2]); }
          T.path(pts.concat([[1, 0], [0, 0]]), { fill: 'red', fillAlpha: 0.3, stroke: false, close: true });
          // K_E
          for (const [a, b] of E) T.line(a, 1, b, 1, { color: 'ink', width: 2.6, cap: 'butt' });
          T.line(0, 0, 1, 0, { color: 'ink', width: 1.2, alpha: 0.5 });
          T.fn(g, { color: 'green', width: 2.2, n: 3000 });
          const C = curve(w), t = Math.log10(eta);
          B.path(C.map(([x, l2]) => [x, l2]), { color: 'red', width: 2 });
          B.path(C.map(([x, , s]) => [x, s]), { color: 'muted', width: 2, dash: [5, 4] });
          const e = errs(w, eta);
          B.vline(t, { color: 'gold', width: 1.2 });
          B.dot(t, e.l2, { color: 'red', r: 5 }); B.dot(t, e.sup, { color: 'muted', r: 4 });
          const mVF = V.reduce((s, [a, b]) => s + b - a, 0) - F.reduce((s, [a, b]) => s + b - a, 0);
          v.legend([['ink', '$K_E$'], ['green', 'continuous $g$'], ['red', '$|g-K_E|^2$', { area: true }], ['orange', '$V-F$', { area: true }]]);
          st = { eta, l2: e.l2, sup: e.sup, mVF };
        });
        v.readout(() => {
          const s = st; if (s.l2 == null) return '';
          return `$\\eta=${v.fmt(s.eta, 2)}$: $\\;\\|g-K_E\\|=${v.fix(s.l2, 4)}\\le\\sqrt{m(V-F)}=${v.fix(Math.sqrt(s.mVF), 4)}$, while $\\sup|g-K_E|=${v.fix(s.sup, 3)}$ does not shrink.`;
        });
      },
    },
    {
      num: '11.39',
      kind: 'Definition',
      name: 'Orthonormal sets and Fourier coefficients',
      statement: String.raw`A sequence $\{\varphi_n\}$ of complex functions on a measurable space $X$ is an **orthonormal set** if
$$\int_X\varphi_n\bar\varphi_m\,d\mu=\begin{cases}0&(n\ne m)\\1&(n=m).\end{cases}$$
For $f\in\mathscr L^2(\mu)$ the numbers $c_n=\int_Xf\bar\varphi_n\,d\mu$ are its **Fourier coefficients**, and one writes $f\sim\sum c_n\varphi_n$. The best-approximation property and Bessel's inequality (8.11, 8.12) hold for every $f\in\mathscr L^2(\mu)$, with the same proofs.`,
      idea: String.raw`Orthonormality is what makes coefficients computable one at a time: if $f=\sum c_n\varphi_n$ then pairing with $\bar\varphi_m$ kills every term but one. The Gram matrix $\big(\int\varphi_n\bar\varphi_m\big)$ of an orthonormal set is the identity; that of a merely independent family is not, and its coefficients interact.`,
      caption: String.raw`Left: the first functions of a family on an interval. Right: their Gram matrix $G_{nm}=\int\varphi_n\bar\varphi_m$, computed numerically (colour and number in each cell). The trigonometric, normalised Legendre and Haar systems give the identity matrix; the monomials $x^{n}$ give the badly conditioned Hilbert matrix.`,
      deps: ['pma-11.34', 'pma-8.10'],
      see: ['rca-4.13'],
      tags: ['L2', 'orthonormal systems'],
      viz(v) {
        const M = v.M;
        const leg = [(x) => 1, (x) => x, (x) => (3 * x * x - 1) / 2, (x) => (5 * x ** 3 - 3 * x) / 2, (x) => (35 * x ** 4 - 30 * x * x + 3) / 8, (x) => (63 * x ** 5 - 70 * x ** 3 + 15 * x) / 8];
        const haar = (n) => (x) => { if (n === 0) return 1; const k = Math.floor(Math.log2(n)), j = n - (1 << k), a = j / (1 << k), b = (j + 1) / (1 << k), m = (a + b) / 2, h = Math.pow(2, k / 2); return x >= a && x < m ? h : x >= m && x < b ? -h : 0; };
        const SYS = {
          trig: { label: 'trigonometric', I: [-PI, PI], f: [(x) => 1 / Math.sqrt(TAU), (x) => Math.cos(x) / Math.sqrt(PI), (x) => Math.sin(x) / Math.sqrt(PI), (x) => Math.cos(2 * x) / Math.sqrt(PI), (x) => Math.sin(2 * x) / Math.sqrt(PI), (x) => Math.cos(3 * x) / Math.sqrt(PI)], names: ['\\frac{1}{\\sqrt{2\\pi}}', '\\frac{\\cos x}{\\sqrt\\pi}', '\\frac{\\sin x}{\\sqrt\\pi}', '\\frac{\\cos 2x}{\\sqrt\\pi}', '\\frac{\\sin 2x}{\\sqrt\\pi}', '\\frac{\\cos 3x}{\\sqrt\\pi}'] },
          leg: { label: 'Legendre', I: [-1, 1], f: leg.map((P, n) => (x) => P(x) * Math.sqrt((2 * n + 1) / 2)) },
          haar: { label: 'Haar', I: [0, 1], f: [0, 1, 2, 3, 4, 5].map(haar) },
          mono: { label: 'monomials $x^n$', I: [0, 1], f: [0, 1, 2, 3, 4, 5].map((n) => (x) => Math.pow(x, n)) },
        };
        const which = v.select('', Object.entries(SYS).map(([value, o]) => ({ value, label: o.label })), 'trig');
        const L = v.stage({ x: [-PI, PI], y: [-1.6, 1.6], height: 320, axes: true, weight: 1.2, title: '$\\varphi_0,\\dots,\\varphi_5$' });
        const R = v.stage({ x: [-0.6, 6.1], y: [-0.6, 6.1], equal: true, height: 320, axes: false, weight: 1, minWidth: 250, title: 'Gram matrix $\\int\\varphi_n\\bar\\varphi_m$' });
        const COLS = ['blue', 'red', 'green', 'orange', 'purple', 'teal'];
        const CACHE = {};
        let st = {};
        v.render(() => {
          const o = SYS[which.value], [a, b] = o.I;
          L.setView(o.I, which.value === 'haar' ? [-2.3, 2.3] : which.value === 'leg' ? [-2.6, 2.6] : [-1.2, 1.2]);
          L.setTicks(which.value === 'trig' ? PI_TICKS : null, null);
          o.f.forEach((f, i) => L.fn(f, { color: COLS[i], width: 1.8, n: 1200 }));
          const G = CACHE[which.value] ||= o.f.map((f) => o.f.map((g) => M.integrate((x) => f(x) * g(x), a, b, which.value === 'haar' ? 4096 : 1200)));
          for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
            const val = G[i][j], t = M.clamp(Math.abs(val), 0, 1), x = j, y = 5 - i;
            R.rect(x, y, x + 1, y + 1, { fill: i === j ? 'green' : 'red', fillAlpha: 0.08 + 0.7 * t, color: 'panel', width: 1.5 });
            R.text(Math.abs(val) < 5e-4 ? '0' : v.fmt(val, 2), x + 0.5, y + 0.5, { align: 'center', size: 11.5, color: 'ink' });
          }
          for (let i = 0; i < 6; i++) { R.text(String(i), -0.3, 5.5 - i, { align: 'center', size: 11, color: COLS[i], weight: 600 }); R.text(String(i), i + 0.5, -0.3, { align: 'center', size: 11, color: COLS[i], weight: 600 }); }
          let off = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) off = Math.max(off, Math.abs(G[i][j] - (i === j ? 1 : 0)));
          v.legend(o.f.map((f, i) => [COLS[i], `$\\varphi_${i}$`]));
          st = { off, w: which.value };
        });
        v.readout(() => (st.w === 'mono' ? `$\\max_{n,m}|G_{nm}-\\delta_{nm}|=${v.fix(st.off, 3)}$: the monomials are independent but far from orthonormal (their Gram matrix is the Hilbert matrix $\\frac1{n+m+1}$).` : `$\\max_{n,m}|G_{nm}-\\delta_{nm}|=${v.sci(Math.max(st.off ?? 0, 1e-12), 2)}$ — the identity matrix up to quadrature error: an orthonormal set.`));
      },
    },
    {
      num: '11.40',
      kind: 'Theorem',
      name: 'Fourier series of an L² function converge in L² (Parseval)',
      statement: String.raw`Let $f\in\mathscr L^2$ on $[-\pi,\pi]$, $f(x)\sim\sum_{-\infty}^{\infty}c_ne^{inx}$, and let $s_N$ be the $N$-th partial sum. Then
$$\lim_{N\to\infty}\|f-s_N\|=0,\qquad\sum_{n=-\infty}^{\infty}|c_n|^2=\frac1{2\pi}\int_{-\pi}^{\pi}|f(x)|^2\,dx .$$`,
      idea: String.raw`By 11.38 there is a continuous $g$ with $\|f-g\|<\eps$ (and $g(-\pi)=g(\pi)$ may be arranged). Parseval for $g$ (8.16) makes $\|g-s_N(g)\|<\eps$ for large $N$, and Bessel's inequality applied to $f-g$ gives $\|s_N(g)-s_N(f)\|=\|s_N(g-f)\|\le\|f-g\|$. Hence $\|f-s_N(f)\|<3\eps$. The identity for $\sum|c_n|^2$ follows from $\|s_N\|^2=2\pi\sum_{|n|\le N}|c_n|^2$.`,
      caption: String.raw`Two functions in $\mathscr L^2$ that are not Riemann integrable: $|x|^{-1/3}$ (unbounded) and the indicator of a fat Cantor set (discontinuous on a set of positive measure). Top: $f$, its partial sum $s_N$ and the proof's continuous approximant $g$ (dashed). Bottom: the mean-square error $\big(\frac1{2\pi}\int|f-s_N|^2\big)^{1/2}$ (blue) under the proof's bound $2\|f-g\|+\|g-s_N(g)\|$ (orange), both computed from Fourier coefficients. Improve $g$ and the floor $2\|f-g\|$ of the bound (dashed) drops: for every $\eps$ the error is eventually below $3\eps$.`,
      deps: ['pma-11.38', 'pma-8.16', 'pma-8.12', 'pma-11.39', 'pma-11.36'],
      see: ['rca-4.26'],
      verify: true,
      tags: ['L2', 'Fourier series', 'Parseval'],
      viz(v) {
        const M = v.M;
        const NMAX = 80;
        const which = v.select('$f=$', [{ value: 'root', label: '$|x|^{-1/3}$' }, { value: 'fat', label: 'fat Cantor indicator' }], 'root');
        const nS = v.slider('$N$', 0, NMAX, 8, { int: true });
        const qS = v.slider('quality of $g$', 0, 1, 0.4, { step: 0.05 });
        const T = v.stage({ x: [-PI, PI], y: [-0.6, 3.6], height: 260, full: true, axes: true, xticks: PI_TICKS });
        const B = v.stage({ x: [-2, NMAX + 2], y: [-0.03, 0.5], height: 170, full: true, axes: 'box', xticks: [0, 20, 40, 60, 80], title: 'normalised errors against $N$' });
        // ---- f = |x|^{-1/3} (even): c_n = (1/π)∫_0^π x^{-1/3} cos(nx) dx = (1/π)∫_0^{π^{1/3}} 3u cos(n u^3) du
        const U = Math.cbrt(PI);
        const rootF = (x) => Math.pow(Math.abs(x), -1 / 3);
        // ---- fat Cantor set, scaled to [-π, π]
        const KC = cantorKeep(10, true).map(([a, b]) => [-PI + TAU * a, -PI + TAU * b]);
        const fatF = (x) => (inIntervals(KC, x) ? 1 : 0);
        const FC = {};
        const fData = (w) => {
          if (FC[w]) return FC[w];
          if (w === 'root') return (FC[w] = { cf: M.range(NMAX + 1).map((n) => M.integrate((u) => 3 * u * Math.cos(n * u * u * u), 0, U, 6000) / PI), sf: M.range(NMAX + 1).map(() => 0), nf2: 3 / Math.pow(PI, 2 / 3) });
          // c_n = (1/2π)∫_C e^{-inx}: cf = Re c_n, sf = −Im c_n (zero here by symmetry, computed anyway)
          return (FC[w] = {
            cf: M.range(NMAX + 1).map((n) => KC.reduce((s0, [a, b]) => s0 + (n === 0 ? b - a : (Math.sin(n * b) - Math.sin(n * a)) / n), 0) / TAU),
            sf: M.range(NMAX + 1).map((n) => KC.reduce((s0, [a, b]) => s0 + (n === 0 ? 0 : (Math.cos(n * a) - Math.cos(n * b)) / n), 0) / TAU),
            nf2: KC.reduce((s0, [a, b]) => s0 + b - a, 0) / TAU,
          });
        };
        const GC = {};
        const gData = (w, q) => {
          const key = `${w}|${q}`; if (GC[key]) return GC[key];
          if (w === 'root') {
            const T0 = q, xT = Math.pow(T0, -3);
            return (GC[key] = { g: (x) => Math.min(rootF(x), T0), cg: M.range(NMAX + 1).map((n) => (T0 * (n === 0 ? xT : Math.sin(n * xT) / n) + M.integrate((u) => 3 * u * Math.cos(n * u * u * u), 1 / T0, U, 6000)) / PI), nfg2: 1 / (PI * T0), ng2: (3 * Math.cbrt(PI) - 2 / T0) / PI });
          }
          const eta = q, g = (x) => { const d = distTo(KC, x); return d === 0 ? 1 : Math.max(0, 1 - d / eta); };
          const NG = 1 << 14, xs = M.range(NG).map((i) => -PI + TAU * (i + 0.5) / NG), gv = xs.map(g);
          return (GC[key] = { g, cg: M.range(NMAX + 1).map((n) => xs.reduce((s0, x, i) => s0 + gv[i] * Math.cos(n * x), 0) / NG), nfg2: xs.reduce((s0, x, i) => s0 + (gv[i] - fatF(x)) ** 2, 0) / NG, ng2: gv.reduce((s0, y) => s0 + y * y, 0) / NG });
        };
        let st = {};
        v.render(() => {
          const w = which.value, N = nS.value, F0 = fData(w);
          const q = w === 'root' ? Math.round(1.6 * Math.pow(12.5, qS.value) * 10) / 10 : Math.round(0.25 * Math.pow(0.02, qS.value) * 1e4) / 1e4; // T for min(f,T), η for the ramps
          const G0 = gData(w, q), D = { ...F0, ...G0 };
          const cn = (n) => D.cf[n], sn = (n) => D.sf[n];
          const S = (x) => { let s = cn(0); for (let n = 1; n <= N; n++) s += 2 * (cn(n) * Math.cos(n * x) + sn(n) * Math.sin(n * x)); return s; };
          const gC = (n) => D.cg[n];
          const Sg = (x) => { let s = gC(0); for (let n = 1; n <= N; n++) s += 2 * gC(n) * Math.cos(n * x); return s; };
          if (w === 'root') {
            T.setView(null, [-0.6, 3.6]);
            T.fn(rootF, { color: 'ink', width: 2, n: 2000 });
            T.fn(D.g, { color: 'green', width: 1.8, dash: [6, 4], n: 1500 });
          } else {
            T.setView(null, [-0.45, 1.45]);
            for (const [a, b] of KC) T.line(a, 1, b, 1, { color: 'ink', width: 2.2, cap: 'butt' });
            T.line(-PI, 0, PI, 0, { color: 'ink', width: 1.2, alpha: 0.5 });
            T.fn(D.g, { color: 'green', width: 1.6, dash: [6, 4], n: 3000 });
          }
          T.fn(S, { color: 'blue', width: 2.2, n: 1500 });
          // errors from coefficients: (1/2π)∫|f - s_N|² = (1/2π)∫|f|² − Σ_{|n|≤N}|c_n|²
          const errs = M.range(NMAX + 1).map((K) => {
            let ef = 0, eg = 0;
            for (let n = 0; n <= K; n++) { const m = n === 0 ? 1 : 2; ef += m * (cn(n) ** 2 + sn(n) ** 2); eg += m * gC(n) ** 2; }
            const gTail = Math.max(0, D.ng2 - eg); // ‖g − s_K(g)‖² = ‖g‖² − Σ_{|n|≤K}|c_n(g)|²
            return [Math.sqrt(Math.max(0, D.nf2 - ef)), 2 * Math.sqrt(D.nfg2) + Math.sqrt(gTail)];
          });
          const top = Math.max(...errs.map((e) => e[1])) * 1.1;
          B.setView(null, [-0.1 * top, top]);
          B.path(errs.map((e, K) => [K, e[1]]), { color: 'orange', width: 2 });
          B.path(errs.map((e, K) => [K, e[0]]), { color: 'blue', width: 2.2 });
          B.hline(2 * Math.sqrt(D.nfg2), { color: 'orange', width: 1, dash: [4, 4] });
          B.vline(N, { color: 'gold', width: 1.2 });
          B.dot(N, errs[N][0], { color: 'blue', r: 5 });
          v.legend([['ink', '$f$'], ['blue', '$s_N(f)$ and $\\|f-s_N\\|$'], ['green', 'continuous $g$ with small $\\|f-g\\|$', { dash: true }], ['orange', 'bound $2\\|f-g\\|+\\|g-s_N(g)\\|$']]);
          let ef = 0; for (let n = 0; n <= N; n++) ef += (n === 0 ? 1 : 2) * (cn(n) ** 2 + sn(n) ** 2);
          st = { N, err: errs[N][0], ef, nf2: D.nf2, w, q, fg: Math.sqrt(D.nfg2) };
        });
        v.readout(() => {
          const s = st; if (s.N == null) return '';
          return (s.w === 'root' ? `$g=\\min(f,${v.fix(s.q, 1)})$` : `$g$ = ramps of width $${v.fmt(s.q, 2)}$`) + `, $\\|f-g\\|=${v.fix(s.fg, 4)}$. ` + `$\\sum_{|n|\\le ${s.N}}|c_n|^2=${v.fix(s.ef, 5)}$, $\\;\\frac1{2\\pi}\\int|f|^2=${v.fix(s.nf2, 5)}$, so $\\big(\\frac1{2\\pi}\\int|f-s_{${s.N}}|^2\\big)^{1/2}=${v.fix(s.err, 4)}\\to0$.` + (s.w === 'root' ? ' Note $s_N(0)\\to\\infty$: the convergence is in mean, not pointwise everywhere.' : ' The partial sums never converge uniformly, and $f$ is not Riemann integrable.');
        });
      },
    },
    {
      num: '11.40a',
      kind: 'Corollary',
      name: 'L² functions are determined by their Fourier coefficients',
      statement: String.raw`If $f\in\mathscr L^2$ on $[-\pi,\pi]$ and $\int_{-\pi}^{\pi}f(x)e^{-inx}\,dx=0$ for every integer $n$, then $\|f\|=0$. Hence two functions in $\mathscr L^2$ with the same Fourier series differ only on a set of measure zero.`,
      idea: String.raw`All $c_n=0$, so Parseval (11.40) gives $\frac1{2\pi}\int|f|^2=\sum|c_n|^2=0$. Equivalently, the trigonometric system is complete in the sense of 11.44.`,
      caption: String.raw`$\tilde f=f+2K_N$ changes $f(x)=x$ on a set $N$, shown at stage $k$ of its construction. Bars: the differences $|c_n(\tilde f)-c_n(f)|=|c_n(2K_{N_k})|$ for $|n|\le20$, and the readout their total energy. For the middle-thirds Cantor set (measure $0$) everything tends to $0$: the limit has the same Fourier series as $f$. For the fat Cantor set the differences persist, as Parseval demands, since $m(N)>0$.`,
      deps: ['pma-11.40'],
      see: ['rca-4.24'],
      verify: true,
      tags: ['L2', 'Fourier series', 'uniqueness'],
      viz(v) {
        const M = v.M;
        const which = v.select('$N=$', [{ value: 'std', label: 'Cantor set' }, { value: 'fat', label: 'fat Cantor set' }], 'std');
        const kS = v.slider('stage $k$', 0, 10, 3, { int: true });
        const T = v.stage({ x: [-PI, PI], y: [-3.6, 4.4], height: 230, full: true, axes: true, xticks: PI_TICKS });
        const B = v.stage({ x: [-21, 21], y: [-0.02, 0.7], height: 180, full: true, axes: 'box', xticks: [-20, -10, 0, 10, 20], title: '$|c_n(\\tilde f)-c_n(f)|$ for $|n|\\le20$' });
        const setN = (w, k) => cantorKeep(k, w === 'fat').map(([a, b]) => [-PI + TAU * a, -PI + TAU * b]);
        const coef = (I, n) => { let re = 0, im = 0; for (const [a, b] of I) { if (n === 0) re += b - a; else { re += (Math.sin(n * b) - Math.sin(n * a)) / n; im += (Math.cos(n * b) - Math.cos(n * a)) / n; } } return [2 * re / TAU, 2 * im / TAU]; };
        let st = {};
        v.render(() => {
          const w = which.value, k = kS.value, I = setN(w, k);
          T.fn((x) => x, { color: 'blue', width: 2 });
          for (const [a, b] of I) T.line(a, a + 2, b, b + 2, { color: 'red', width: 2.4 });
          for (const [a, b] of I) T.line(a, -3.2, b, -3.2, { color: 'red', width: 6, cap: 'butt' });
          T.tex('N_k', PI, -3.2, { color: 'red', align: 'right', baseline: 'bottom', dy: -6, size: 13 });
          const C = M.range(41).map((j) => { const n = j - 20, [re, im] = coef(I, n); return [n, Math.hypot(re, im)]; });
          const mN = I.reduce((s, [a, b]) => s + b - a, 0);
          const total = 4 * mN / TAU; // Σ_n |c_n(2K_N)|² = (1/2π)∫|2K_N|² (Parseval)
          const shown = C.reduce((s, [, c]) => s + c * c, 0);
          const cmax = Math.max(0.3, ...C.map(([, c]) => c)) * 1.1;
          B.setView(null, [-0.1 * cmax, cmax]);
          C.forEach(([n, c]) => B.rect(n - 0.35, 0, n + 0.35, c, { fill: w === 'fat' ? 'red' : 'purple', fillAlpha: 0.75, stroke: false }));
          v.legend([['blue', '$f(x)=x$'], ['red', '$\\tilde f=f+2$ on $N_k$', { area: true }]]);
          st = { w, k, mN, total, shown };
        });
        v.readout(() => {
          const s = st; if (s.k == null) return '';
          return `$m(N_{${s.k}})=${v.fix(s.mN, 4)}$; Parseval: $\\sum_n|c_n(\\tilde f)-c_n(f)|^2=\\frac1{2\\pi}\\int|2K_{N_{${s.k}}}|^2=${v.fix(s.total, 4)}$ (the $41$ bars carry $${v.fix(s.shown, 4)}$). ` + (s.w === 'std' ? 'As $k\\to\\infty$ this tends to $0$: changing $f$ on a null set leaves every coefficient unchanged.' : `It tends to $\\frac{4m(N)}{2\\pi}=1$: on a set of positive measure the change is seen by the coefficients.`);
        });
      },
    },
    {
      num: '11.41',
      kind: 'Definition',
      name: 'Convergence and Cauchy sequences in L²',
      statement: String.raw`Let $f,f_n\in\mathscr L^2(\mu)$. The sequence $\{f_n\}$ **converges to $f$ in $\mathscr L^2(\mu)$** if $\|f_n-f\|\to0$. It is a **Cauchy sequence in $\mathscr L^2(\mu)$** if for every $\eps>0$ there is an $N$ such that $\|f_n-f_m\|\le\eps$ whenever $n,m\ge N$.`,
      idea: String.raw`This is convergence in the metric $\|f-g\|$ of 11.36–11.37. It is quite different from pointwise convergence: a sequence can converge in $\mathscr L^2$ without converging at any single point, and converge pointwise everywhere without converging in $\mathscr L^2$.`,
      caption: String.raw`Right: the matrix of distances $\|f_n-f_m\|$ for $n,m\le64$ (strong blue = small distance, faint = large); the sequence is Cauchy when the lower-right corner beyond $N$ (gold square) becomes uniformly strong blue. The typewriter sequence $K_{[j2^{-k},(j+1)2^{-k}]}$ is Cauchy and tends to $0$ in $\mathscr L^2$, yet every $x$ is hit infinitely often, so $f_n(x)$ converges nowhere. $\sqrt n\,K_{(0,1/n)}\to0$ pointwise, but $\|f_n\|=1$ and the sequence is not Cauchy.`,
      deps: ['pma-11.34', 'pma-3.8'],
      see: ['rca-3.10'],
      tags: ['L2', 'convergence'],
      viz(v) {
        const M = v.M;
        const which = v.select('', [{ value: 'tw', label: 'typewriter' }, { value: 'sq', label: '$\\sqrt n\\,K_{(0,1/n)}$' }], 'tw');
        const nS = v.slider('$n$', 1, 64, 11, { int: true });
        const NS = v.slider('$N$', 1, 64, 24, { int: true });
        const L = v.stage({ x: [0, 1], y: [-0.3, 2.2], height: 300, axes: 'box', weight: 1, xticks: [0, 0.5, 1], title: '$f_n$' });
        const R = v.stage({ x: [0.5, 64.5], y: [0.5, 64.5], equal: true, height: 300, axes: false, weight: 1, minWidth: 260, title: '$\\|f_n-f_m\\|$, $1\\le n,m\\le64$' });
        const dist = (w, n, m) => {
          if (n === m) return 0;
          if (w === 'tw') { const [a, b] = tw(n), [c, d] = tw(m); const ov = Math.max(0, Math.min(b, d) - Math.max(a, c)); return Math.sqrt((b - a) + (d - c) - 2 * ov); }
          const p = Math.min(n, m), q = Math.max(n, m); return Math.sqrt(2 - 2 * Math.sqrt(p / q));
        };
        let st = {};
        v.render(() => {
          const w = which.value, n = nS.value, N = NS.value;
          const bc = v.rgb('blue');
          R.raster((x, y) => { const i = Math.round(x), j = Math.round(65 - y); if (i < 1 || j < 1 || i > 64 || j > 64) return null; const t = Math.min(1, dist(w, i, j) / 0.9); return [bc[0], bc[1], bc[2], Math.round(20 + 225 * (1 - t))]; }, { key: w + v.color('blue'), res: 2 });
          R.rect(N - 0.5, 0.5, 64.5, 65 - N + 0.5, { color: 'gold', width: 2 });
          R.dot(n, 65 - n, { color: 'blue', r: 4 });
          let sup = 0; for (let i = N; i <= 64; i++) for (let j = N; j <= 64; j++) sup = Math.max(sup, dist(w, i, j));
          // left: f_n
          if (w === 'tw') { const [a, b] = tw(n); L.setView(null, [-0.3, 1.4]); L.rect(a, 0, b, 1, { fill: 'blue', fillAlpha: 0.3, color: 'blue', width: 2 }); L.line(0, 0, 1, 0, { color: 'blue', width: 2 }); }
          else { L.setView(null, [-0.6, 8.6]); L.rect(0, 0, 1 / n, Math.sqrt(n), { fill: 'blue', fillAlpha: 0.3, color: 'blue', width: 2 }); L.line(1 / n, 0, 1, 0, { color: 'blue', width: 2 }); }
          v.legend([['blue', '$f_n$', { area: true }], ['gold', 'the block $n,m\\ge N$']]);
          st = { w, n, N, sup, norm: dist(w, n, n) === 0 ? (w === 'tw' ? Math.sqrt(tw(n)[1] - tw(n)[0]) : 1) : 0 };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          if (s.w === 'tw') return `$\\|f_{${s.n}}\\|=${v.fix(s.norm, 4)}$; $\\;\\sup_{n,m\\ge${s.N}}\\|f_n-f_m\\|\\le${v.fix(s.sup, 4)}$ (over $n,m\\le64$) — Cauchy, with $\\mathscr L^2$ limit $0$, but no pointwise limit anywhere.`;
          return `$\\|f_n\\|=1$ for all $n$; $\\;\\sup_{n,m\\ge${s.N}}\\|f_n-f_m\\|=${v.fix(s.sup, 4)}$ does not tend to $0$ (it approaches $\\sqrt2$): not Cauchy, although $f_n(x)\\to0$ for every $x$.`;
        });
      },
    },
    {
      num: '11.42',
      kind: 'Theorem',
      name: 'L²(μ) is complete',
      statement: String.raw`If $\{f_n\}$ is a Cauchy sequence in $\mathscr L^2(\mu)$, there is $f\in\mathscr L^2(\mu)$ such that $f_n\to f$ in $\mathscr L^2(\mu)$. In other words, $\mathscr L^2(\mu)$ is a complete metric space.`,
      idea: String.raw`Extract $n_1<n_2<\cdots$ with $\|f_{n_{k+1}}-f_{n_k}\|<2^{-k}$. For every $g\in\mathscr L^2$, Schwarz gives $\int|g|\,|f_{n_{k+1}}-f_{n_k}|\le\|g\|2^{-k}$, and termwise integration (11.30) shows $\sum_k|f_{n_{k+1}}(x)-f_{n_k}(x)|<\infty$ almost everywhere. So $f=\lim f_{n_k}$ exists a.e.; Fatou (11.31) gives $\|f-f_{n_k}\|\le\liminf_i\|f_{n_i}-f_{n_k}\|$, which is small, and the Cauchy property passes the convergence to the whole sequence.`,
      caption: String.raw`$f_n=h+$ typewriter bump: a Cauchy sequence with $\mathscr L^2$ limit $h$ (green), whose values $f_n(x)$ converge at no point $x$. Drag $x$ on the axis: the lower panel shows $f_n(x)-h(x)\in\{0,1\}$ for $n\le256$, flickering forever. The proof's fast subsequence (gold, $n_k=4^{k+1}$, chosen so that $\|f_{n_{k+1}}-f_{n_k}\|<2^{-k}$) settles at $0$ for every $x>0$ — it converges almost everywhere, as the proof requires.`,
      deps: ['pma-11.41', 'pma-11.35', 'pma-11.30', 'pma-11.31'],
      see: ['rca-3.11', 'rca-3.12'],
      tags: ['L2', 'completeness'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$', 1, 256, 23, { int: true });
        const h = (x) => 0.6 + 0.25 * Math.sin(2 * Math.PI * x);
        const T = v.stage({ x: [0, 1], y: [-0.25, 1.95], height: 250, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0.5, 1, 1.5] });
        const B = v.stage({ x: [-4, 260], y: [-0.35, 1.35], height: 180, full: true, axes: 'box', xticks: [1, 4, 16, 64, 128, 256], yticks: [0, 1], title: '$f_n(x)-h(x)$ for $n\\le256$; gold: the subsequence $n_k$' });
        const hx = T.handle(0.37, -0.15, { color: 'red', label: 'x', labelPos: 'e', constrain: (x) => [M.clamp(x, 0.001, 0.999), -0.15] });
        const SUB = [4, 16, 64, 256]; // n_k = 4^{k+1}: first index of block 2k+2
        let st = {};
        v.render(() => {
          const n = nS.value, x0 = hx.x, [a, b, k] = tw(n);
          T.fn(h, { color: 'green', width: 2, dash: [6, 4] });
          T.fn((x) => h(x) + (x >= a && x <= b ? 1 : 0), { color: 'blue', width: 2.2, n: 3000 });
          T.vline(x0, { color: 'red', width: 1, dash: [3, 3] });
          const vals = M.range(256, 1).map((m) => { const [p, q] = tw(m); return x0 >= p && x0 <= q ? 1 : 0; });
          vals.forEach((y, i) => B.line(i + 1, 0, i + 1, y, { color: y ? 'blue' : 'faint', width: 1.2 }));
          vals.forEach((y, i) => { if (y) B.dot(i + 1, 1, { color: 'blue', r: 2.4 }); });
          SUB.forEach((m) => B.dot(m, vals[m - 1], { color: 'gold', r: 5.5 }));
          B.vline(n, { color: 'muted', width: 1, dash: [3, 3] });
          const hits = vals.filter(Boolean).length;
          v.legend([['blue', '$f_n=h+K_{I_n}$'], ['green', '$\\mathscr L^2$ limit $h$', { dash: true }], ['gold', 'fast subsequence $f_{n_k}$', { dot: true }]]);
          st = { n, k, nrm: Math.sqrt(b - a), hits, x0 };
        });
        v.readout(() => {
          const s = st; if (s.n == null) return '';
          return `$\\|f_{${s.n}}-h\\|=2^{-${s.k}/2}=${v.fix(s.nrm, 4)}\\to0$. At $x=${v.fix(s.x0, 3)}$ the bump passes $${s.hits}$ times among the first 256 terms (once in every block), so $f_n(x)$ diverges; along $n_k$ the values are eventually $0$, and $\\sum_k\\|f_{n_{k+1}}-f_{n_k}\\|\\le\\sum_k\\big(2^{-k-1}+2^{-k-2}\\big)<\\infty$.`;
        });
      },
    },
    {
      num: '11.43',
      kind: 'Theorem',
      name: 'Riesz–Fischer theorem',
      statement: String.raw`Let $\{\varphi_n\}$ be orthonormal on $X$. If $\sum|c_n|^2<\infty$ and $s_n=c_1\varphi_1+\dots+c_n\varphi_n$, then there is $f\in\mathscr L^2(\mu)$ such that $s_n\to f$ in $\mathscr L^2(\mu)$ and $f\sim\sum c_n\varphi_n$.`,
      idea: String.raw`For $n>m$, orthonormality gives $\|s_n-s_m\|^2=|c_{m+1}|^2+\dots+|c_n|^2$, the tail of a convergent series — so $\{s_n\}$ is Cauchy and converges to some $f$ by completeness (11.42). For $n\ge k$, $\int f\bar\varphi_k-c_k=\int(f-s_n)\bar\varphi_k$, which is at most $\|f-s_n\|$ by Schwarz; letting $n\to\infty$ gives $c_k=\int f\bar\varphi_k$.`,
      caption: String.raw`The orthonormal sines $\varphi_n=\sin(nx)/\sqrt\pi$ with prescribed coefficients $c_n$. Top: $s_N$ (blue) and a much later partial sum (faint). Bottom: the tail $\big(\sum_{n>N}|c_n|^2\big)^{1/2}$, which bounds $\|s_m-s_N\|$ for all $m>N$. With $c_n=\sqrt\pi/n$ the limit is the sawtooth; with $c_n=n^{-0.6}$ it is an unbounded function that exists only as an $\mathscr L^2$ limit ($\sum|c_n|=\infty$, so no uniform convergence). With $c_n=n^{-1/2}$ the series $\sum|c_n|^2$ diverges and $\|s_N\|\to\infty$.`,
      deps: ['pma-11.42', 'pma-11.39', 'pma-11.35'],
      see: ['rca-4.26', 'rca-3.11'],
      tags: ['L2', 'Riesz–Fischer', 'orthonormal systems'],
      viz(v) {
        const M = v.M;
        const SEQ = {
          saw: { label: '$c_n=\\sqrt\\pi/n$', c: (n) => Math.sqrt(PI) / n, l2: true, lim: (x) => (x > 0 ? (PI - x) / 2 : x < 0 ? -(PI + x) / 2 : 0), y: [-2.2, 2.2] },
          p6: { label: '$c_n=n^{-0.6}$', c: (n) => Math.pow(n, -0.6), l2: true, lim: null, y: [-4.5, 4.5] },
          half: { label: '$c_n=n^{-1/2}$ (not $\\ell^2$)', c: (n) => 1 / Math.sqrt(n), l2: false, lim: null, y: [-9, 9] },
        };
        const which = v.select('', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'p6');
        const nS = v.slider('$N$', 1, 200, 12, { int: true });
        const T = v.stage({ x: [-PI, PI], y: [-4.5, 4.5], height: 250, full: true, axes: true, xticks: PI_TICKS });
        const B = v.stage({ x: [-0.1, 4.1], y: [-0.2, 2], height: 170, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000'], [4, '10⁴']], title: 'tail $(\\sum_{n>N}|c_n|^2)^{1/2}$ (blue) and $\\|s_N\\|$ (purple) against $N$' });
        const BIG = 1500;
        const sN = (o, N) => (x) => { let s = 0; for (let n = 1; n <= N; n++) s += o.c(n) * Math.sin(n * x) / Math.sqrt(PI); return s; };
        const CACHE = {};
        const curves = (w) => {
          if (CACHE[w]) return CACHE[w];
          const o = SEQ[w], K = 10000, c2 = M.range(K, 1).map((n) => o.c(n) ** 2);
          const cum = []; let s = 0; for (const q of c2) { s += q; cum.push(s); }
          const totalTail = o.l2 ? (w === 'saw' ? PI * PI * PI / 6 : null) : Infinity;
          // tail beyond K estimated by the integral of c(t)^2 (for n^{-1.2}: ∫_K^∞ t^{-1.2} dt = 5 K^{-0.2})
          const tailBeyond = w === 'saw' ? PI / K : w === 'p6' ? 5 * Math.pow(K, -0.2) : Infinity;
          const tot = s + tailBeyond;
          const ts = M.linspace(0, 4, 160);
          return (CACHE[w] = { tail: ts.map((t) => { const N = Math.max(1, Math.round(Math.pow(10, t))); return [t, isFinite(tot) ? Math.sqrt(Math.max(0, tot - cum[Math.min(K, N) - 1])) : NaN]; }), norm: ts.map((t) => { const N = Math.max(1, Math.round(Math.pow(10, t))); return [t, Math.sqrt(cum[Math.min(K, N) - 1])]; }), tot, cum });
        };
        let st = {};
        v.render(() => {
          const w = which.value, o = SEQ[w], N = nS.value;
          T.setView(null, o.y);
          T.fn(sN(o, BIG), { color: 'muted', width: 1, alpha: 0.5, n: 3000 });
          if (o.lim) T.fn(o.lim, { color: 'green', width: 2, dash: [6, 4] });
          T.fn(sN(o, N), { color: 'blue', width: 2.2, n: 1500 });
          const C = curves(w);
          const top = Math.max(2, ...C.norm.map((p) => p[1])) * 1.08;
          B.setView(null, [-0.1 * top, top]);
          if (o.l2) B.path(C.tail, { color: 'blue', width: 2.2 });
          B.path(C.norm, { color: 'purple', width: 2 });
          const t = Math.log10(N);
          B.vline(t, { color: 'gold', width: 1.2 });
          v.legend([['blue', '$s_N$'], ['muted', `$s_{${BIG}}$`], ...(o.lim ? [['green', 'limit $f=\\frac{\\pi-x}{2}$ on $(0,\\pi]$, odd', { dash: true }]] : [])]);
          const tailN = o.l2 ? Math.sqrt(Math.max(0, C.tot - C.cum[N - 1])) : Infinity;
          st = { w, N, tailN, normN: Math.sqrt(C.cum[N - 1]), l2: o.l2, tot: C.tot };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          if (!s.l2) return `$\\|s_{${s.N}}\\|^2=\\sum_{n\\le${s.N}}\\frac1n=${v.fix(s.normN ** 2, 3)}\\to\\infty$: the hypothesis $\\sum|c_n|^2<\\infty$ fails and there is no $\\mathscr L^2$ limit.`;
          return `For all $m>${s.N}$: $\\|s_m-s_{${s.N}}\\|\\le\\big(\\sum_{n>${s.N}}|c_n|^2\\big)^{1/2}=${v.fix(s.tailN, 4)}$ — Cauchy. The limit $f$ has $\\|f\\|^2=\\sum|c_n|^2\\approx${v.fix(s.tot, 4)}$ and Fourier coefficients exactly $c_n$.`;
        });
      },
    },
    {
      num: '11.44',
      kind: 'Definition',
      name: 'Complete orthonormal set',
      statement: String.raw`An orthonormal set $\{\varphi_n\}$ is **complete** if the only $f\in\mathscr L^2(\mu)$ orthogonal to all of it — $\int f\bar\varphi_n\,d\mu=0$ for every $n$ — are those with $\|f\|=0$.`,
      idea: String.raw`Completeness means no direction of $\mathscr L^2$ is missing from the system. The trigonometric system is complete by the corollary to 11.40; dropping even one member destroys completeness, since the dropped function is orthogonal to all the others.`,
      caption: String.raw`On $[0,1]$: the Rademacher functions $r_k$ (square waves of frequency $2^{k-1}$) are orthonormal, but $w=r_1r_2$ (black) is orthogonal to every one of them although $\|w\|=1$ — the bars of its coefficients are all $0$. The Walsh system (all finite products of Rademacher functions) contains $w$ and is complete. Similarly, the sines and cosines without the constant miss $f=1$.`,
      deps: ['pma-11.39'],
      see: ['rca-4.18'],
      tags: ['L2', 'orthonormal systems', 'completeness'],
      viz(v) {
        const M = v.M;
        const which = v.select('system', [{ value: 'rad', label: 'Rademacher $r_k$' }, { value: 'wal', label: 'Walsh $w_n$' }, { value: 'trig', label: '$\\cos nx,\\sin nx$, $n\\ge1$' }], 'rad');
        const L = v.stage({ x: [0, 1], y: [-5.1, 1.55], height: 340, axes: false, weight: 1.3, title: 'the test function and the first four system functions' });
        const R = v.stage({ x: [-0.6, 8.6], y: [-0.15, 1.15], height: 330, axes: 'box', weight: 1, minWidth: 230, xticks: [0, 2, 4, 6, 8], yticks: [0, 0.5, 1], title: 'coefficients $|\\int f\\bar\\varphi_n|$' });
        const COLS = ['blue', 'teal', 'purple', 'orange', 'pink', 'green'];
        let st = {};
        v.render(() => {
          const w = which.value;
          let f, sys, names, I = [0, 1];
          if (w === 'trig') { I = [-PI, PI]; f = () => 1 / Math.sqrt(TAU); sys = [1, 2, 3, 4].flatMap((n) => [(x) => Math.cos(n * x) / Math.sqrt(PI), (x) => Math.sin(n * x) / Math.sqrt(PI)]); }
          else if (w === 'rad') { f = (x) => rad(1, x) * rad(2, x); sys = M.range(9, 1).map((k) => (x) => rad(k, x)); }
          else { f = (x) => rad(1, x) * rad(2, x); sys = M.range(9).map((n) => (x) => walsh(n, x)); }
          L.setView(I, [-5.1, 1.55]);
          // test function on top, system below
          L.fn(f, { color: 'ink', width: 2.4, n: 2000, domain: I });
          L.hline(0, { color: 'faint', width: 1 });
          L.text(w === 'trig' ? 'f = 1/√(2π)' : 'w = r₁r₂', I[0] + 0.01 * (I[1] - I[0]), 1.35, { size: 12, color: 'ink' });
          const lab = w === 'rad' ? (i) => `r_${i + 1}` : w === 'wal' ? (i) => `w_${i}` : (i) => ['\\cos x', '\\sin x', '\\cos 2x', '\\sin 2x'][i];
          for (let i = 0; i < 4; i++) {
            const y0 = -1.65 - i * 1.0, g = sys[i];
            L.hline(y0, { color: 'faint', width: 1 });
            L.fn((x) => y0 + 0.3 * g(x) / (w === 'trig' ? 1 / Math.sqrt(PI) : 1), { color: COLS[i], width: 1.6, n: 2000, domain: I });
            L.tex(lab(i), I[0], y0 + 0.33, { color: COLS[i], align: 'left', baseline: 'bottom', size: 13, dx: 4 });
          }
          const coefs = sys.map((g) => Math.abs(M.integrate((x) => f(x) * g(x), I[0], I[1], 8192)));
          R.bars(coefs, { x0: 0, color: (c) => (c > 1e-3 ? 'green' : 'red'), barWidth: 0.6 });
          R.hline(0, { color: 'red', width: 1.5 });
          const nf = Math.sqrt(M.integrate((x) => f(x) ** 2, I[0], I[1], 4096));
          v.legend([['ink', w === 'trig' ? 'test function $f$, constant' : 'test function $w=r_1r_2$'], ['blue', w === 'trig' ? 'the first system functions (scaled)' : 'the first system functions']]);
          st = { w, nf, maxc: Math.max(...coefs) };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          if (s.w === 'wal') return `$w=r_1r_2$ is the Walsh function $w_3$: its coefficient vector is $(0,0,0,1,0,\\dots)$. Walsh functions are complete, so only null functions are orthogonal to all of them.`;
          return `All coefficients vanish (max $${v.sci(Math.max(s.maxc, 1e-12), 1)}$), yet $\\|f\\|=${v.fix(s.nf, 3)}\\ne0$: this orthonormal set is **not complete**.`;
        });
      },
    },
    {
      num: '11.45',
      kind: 'Theorem',
      name: 'Parseval identity for complete orthonormal sets',
      statement: String.raw`Let $\{\varphi_n\}$ be a complete orthonormal set. If $f\in\mathscr L^2(\mu)$ and $f\sim\sum c_n\varphi_n$, then
$$\int_X|f|^2\,d\mu=\sum_{n=1}^\infty|c_n|^2 .$$`,
      idea: String.raw`Bessel's inequality makes $\sum|c_n|^2$ finite, so Riesz–Fischer (11.43) gives $g\in\mathscr L^2$ with $g\sim\sum c_n\varphi_n$ and $\|g-s_n\|\to0$; hence $\|g\|^2=\lim\|s_n\|^2=\sum|c_n|^2$. Now $f-g$ is orthogonal to every $\varphi_n$, so completeness forces $\|f-g\|=0$ and $\|f\|=\|g\|$. Conversely, Parseval for every $f$ implies completeness.`,
      caption: String.raw`$f(x)=x^2$ on $[0,1]$. Left: $f$ and its Walsh partial sum $s_{2^m}$ — the averages of $f$ over dyadic intervals of length $2^{-m}$. Right: the cumulative energy $\sum|c_n|^2$ in the Walsh system (green) climbs to $\int|f|^2=\frac15$, while the incomplete Rademacher system (red) stalls far below: Bessel's inequality is strict there, and the missing energy is exactly what completeness supplies.`,
      deps: ['pma-11.43', 'pma-11.44', 'pma-8.12'],
      see: ['rca-4.18', 'pma-8.16'],
      tags: ['L2', 'Parseval', 'orthonormal systems'],
      viz(v) {
        const M = v.M;
        const mS = v.slider('$m$ (Walsh partial sum $s_{2^m}$)', 0, 7, 3, { int: true });
        const f = (x) => x * x;
        const L = v.stage({ x: [0, 1], y: [-0.08, 1.08], height: 300, axes: 'box', weight: 1, xticks: [0, 0.5, 1], yticks: [0.5, 1], title: '$f$ and its Walsh partial sum' });
        const R = v.stage({ x: [-0.3, 7.3], y: [-0.025, 0.225], height: 300, axes: 'box', weight: 1, xticks: [[0, '1'], [1, '2'], [2, '4'], [3, '8'], [4, '16'], [5, '32'], [6, '64'], [7, '128']], yticks: [0, 0.1, 0.2], title: 'energy captured by the first $n$ terms' });
        const K = 7, NC = 1 << K, CELL = 1 << 10;
        // exact cell integrals of f on dyadic cells of length 2^{-10}; Walsh w_n (n < 128) is constant on them
        const cellInt = M.range(CELL).map((i) => { const a = i / CELL, b = (i + 1) / CELL; return (b ** 3 - a ** 3) / 3; });
        const coef = (g) => cellInt.reduce((s, I, i) => s + I * g((i + 0.5) / CELL), 0);
        const cW = M.range(NC).map((n) => coef((x) => walsh(n, x)));
        const cR = M.range(K, 1).map((k) => coef((x) => rad(k, x)));
        const nf2 = 1 / 5;
        let st = {};
        v.render(() => {
          const m = mS.value, n = 1 << m;
          const s = (x) => { let y = 0; for (let j = 0; j < n; j++) y += cW[j] * walsh(j, x); return y; };
          L.fn(f, { color: 'ink', width: 2 });
          const pts = []; for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n, y = s((a + b) / 2); pts.push([a, y], [b, y], null); }
          L.path(pts, { color: 'blue', width: 2.6 });
          // cumulative energies on a log2 axis
          const cumW = [], cumR = []; let sw = 0, sr = 0;
          for (let j = 0; j < NC; j++) { sw += cW[j] ** 2; cumW.push(sw); }
          cR.forEach((c) => { sr += c * c; cumR.push(sr); });
          R.hline(nf2, { color: 'ink', width: 1.4, dash: [6, 4] });
          R.path(M.range(K + 1).map((t) => [t, cumW[(1 << t) - 1]]), { color: 'green', width: 2.2 });
          M.range(K + 1).forEach((t) => R.dot(t, cumW[(1 << t) - 1], { color: 'green', r: t === m ? 5.5 : 3 }));
          R.path(cumR.map((c, i) => [Math.log2(i + 1), c]), { color: 'red', width: 2 });
          cumR.forEach((c, i) => R.dot(Math.log2(i + 1), c, { color: 'red', r: 3 }));
          R.tex('\\int|f|^2=\\tfrac15', 1.4, nf2, { color: 'ink', align: 'right', baseline: 'bottom', dy: -4, size: 13 });
          v.legend([['ink', '$f(x)=x^2$'], ['blue', 'Walsh partial sum $s_{2^m}$'], ['green', 'Walsh energy (complete)'], ['red', 'Rademacher energy (incomplete)']]);
          st = { m, n, ew: cumW[n - 1], er: cumR[K - 1], err: Math.sqrt(Math.max(0, nf2 - cumW[n - 1])) };
        });
        v.readout(() => {
          const s = st; if (s.n == null) return '';
          return `Walsh: $\\sum_{j<${s.n}}|c_j|^2=${v.fix(s.ew, 5)}\\to\\frac15$ and $\\|f-s_{${s.n}}\\|=${v.fix(s.err, 4)}\\to0$. Rademacher: $\\sum_k|\\langle f,r_k\\rangle|^2=${v.fix(s.er, 5)}<\\frac15$ — Bessel without Parseval, because $\\{r_k\\}$ is not complete.`;
        });
      },
    },
  ],
};
