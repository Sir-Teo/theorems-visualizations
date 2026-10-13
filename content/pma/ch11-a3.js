// Rudin, Principles of Mathematical Analysis — Chapter 11 (part 3): the Lebesgue integral and
// monotone convergence (11.21–11.29).

/** Intervals of [x0,x1] on which f ≥ a (sampled, endpoints refined by bisection). */
function superlevel(f, a, x0, x1, N = 1200) {
  const test = (x) => f(x) >= a;
  const out = []; let start = null, prevX = x0, prevIn = test(x0);
  if (prevIn) start = x0;
  const refine = (lo, hi, inLo) => { for (let i = 0; i < 36; i++) { const m = (lo + hi) / 2; if (test(m) === inLo) lo = m; else hi = m; } return (lo + hi) / 2; };
  for (let i = 1; i <= N; i++) {
    const x = x0 + (x1 - x0) * i / N, inn = test(x);
    if (inn !== prevIn) { const e = refine(prevX, x, prevIn); if (inn) start = e; else { out.push([start, e]); start = null; } }
    prevX = x; prevIn = inn;
  }
  if (start != null) out.push([start, x1]);
  return out;
}
const total = (I) => I.reduce((s, [a, b]) => s + (b - a), 0);
/** Stage-n Cantor-type set in [0,1] (fat: remove 4^{-k} at stage k; else middle thirds). */
function cantorKeep(n, fat) {
  let keep = [[0, 1]];
  for (let k = 1; k <= n; k++) keep = keep.flatMap(([a, b]) => { const L = fat ? Math.pow(4, -k) : (b - a) / 3, m = (a + b) / 2; return [[a, m - L / 2], [m + L / 2, b]]; });
  return keep;
}
/** Dyadic simple approximant of a nonnegative value (Rudin 11.20): floor(2^n y)/2^n, capped at n. */
const sDyadic = (y, n) => (y >= n ? n : Math.floor(y * (1 << n)) / (1 << n));
/** Plot a step function as horizontal pieces. */
function steps(S, s, a, b, st = {}, N = 1600) {
  const pts = []; let prev = s(a);
  for (let i = 0; i <= N; i++) {
    const x = a + (b - a) * i / N, y = s(x);
    if (Math.abs(y - prev) > 1e-12) { pts.push([x, prev], null); prev = y; }
    pts.push([x, y]);
  }
  S.path(pts, st);
}

export default {
  book: 'pma',
  chapter: 11,
  items: [
    // ------------------------------------------------------------------ the integral
    {
      num: '11.21',
      kind: 'Definition',
      name: 'The Lebesgue integral of a nonnegative function',
      statement: String.raw`Let $E\in\mathfrak M$. For a measurable simple function $s=\sum_{i=1}^nc_iK_{E_i}$ with $c_i>0$ put
$$I_E(s)=\sum_{i=1}^nc_i\,\mu(E\cap E_i).$$
For a measurable $f\ge0$ define the **Lebesgue integral**
$$\int_Ef\,d\mu=\sup I_E(s),$$
the supremum over all measurable simple $s$ with $0\le s\le f$. It may equal $+\infty$; for nonnegative measurable simple $s$ one has $\int_Es\,d\mu=I_E(s)$.`,
      idea: String.raw`Riemann cuts the domain into intervals and needs $f$ to vary little on each; Lebesgue cuts the **range** into levels and measures the sets $\{f\ge y\}$, however scattered they are. The simple functions below $f$ are exactly the "horizontal layer cakes" under its graph, and the integral is the best such inner approximation — no upper approximation is needed.`,
      caption: String.raw`Raise $N$. Lebesgue: horizontal slabs of height $1/N$ over the sets $\{f\ge k/N\}$ build the simple function $s_N\le f$. Riemann: vertical strips with $\inf$ and $\sup$ of $f$ on each cell. For a smooth $f$ both agree in the limit. For $f=x^2$ off $\mathbb Q$ and $f=1$ on $\mathbb Q$ (gold dots: rationals with small denominators), every cell contains a rational, so the upper sums stay at $1$, while the Lebesgue sums ignore the null set $\mathbb Q$ and converge to $\tfrac13$.`,
      deps: ['pma-11.20', 'pma-11.19', 'pma-11.12'],
      see: ['rca-1.23', 'pma-6.1'],
      tags: ['integration', 'Lebesgue integral'],
      viz(v) {
        const M = v.M;
        const FS = {
          smooth: { label: 'smooth $f$', f: (x) => 0.5 + 0.33 * Math.sin(2 * Math.PI * x) + 0.12 * Math.sin(6 * Math.PI * x + 1), sup: null, inf: null, I: 0.5 + 0.12 * (Math.cos(1) - Math.cos(6 * Math.PI + 1)) / (6 * Math.PI) },
          rat: { label: '$x^2$ off $\\mathbb Q$, $1$ on $\\mathbb Q$', f: (x) => x * x, sup: () => 1, inf: (a) => a * a, I: 1 / 3 },
        };
        const which = v.select('$f$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const how = v.select('', [{ value: 'leb', label: 'horizontal slabs (Lebesgue)' }, { value: 'rie', label: 'vertical strips (Riemann)' }], 'leb');
        const kS = v.slider('$N=2^k$, $k$', 1, 7, 3, { int: true });
        const S = v.stage({ x: [0, 1], y: [-0.08, 1.08], height: 330, axes: 'box', weight: 1.6, xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0.25, 0.5, 0.75, 1] });
        const R = v.stage({ x: [0.5, 7.5], y: [0, 1.08], height: 330, axes: 'box', weight: 1, minWidth: 220, xticks: [1, 2, 3, 4, 5, 6, 7], yticks: [0.25, 0.5, 0.75, 1], title: 'sums against $k$' });
        const RAT = []; { const g = (a, b) => (b ? g(b, a % b) : a); for (let q = 1; q <= 14; q++) for (let p = 0; p <= q; p++) if (g(p, q) === 1) RAT.push([p / q, 1]); }
        // Lebesgue lower sum Σ_k (1/N) m({f ≥ k/N}); Riemann lower/upper with N cells
        const lebSum = (o, N) => { let s = 0; for (let k = 1; k <= N; k++) s += total(superlevel(o.f, k / N, 0, 1, 1500)) / N; return s; };
        const cellInf = (o, a, b) => (o.inf ? o.inf(a, b) : Math.min(...M.linspace(a, b, 40).map(o.f)));
        const cellSup = (o, a, b) => (o.sup ? o.sup(a, b) : Math.max(...M.linspace(a, b, 40).map(o.f)));
        const rie = (o, N) => { let L = 0, U = 0; for (let i = 0; i < N; i++) { const a = i / N, b = (i + 1) / N; L += cellInf(o, a, b) / N; U += cellSup(o, a, b) / N; } return [L, U]; };
        const CACHE = {};
        const sums = (w) => (CACHE[w] ||= M.range(7, 1).map((k) => { const N = 1 << k; const [L, U] = rie(FS[w], N); return { leb: lebSum(FS[w], N), L, U }; }));
        let st = {};
        v.render(() => {
          const o = FS[which.value], k = kS.value, N = 1 << k, f = o.f;
          if (how.value === 'leb') {
            for (let j = 1; j <= N; j++) {
              const y0 = (j - 1) / N, y1 = j / N;
              for (const [a, b] of superlevel(f, y1, 0, 1, 1500)) S.rect(a, y0, b, y1, { fill: j % 2 ? 'blue' : 'teal', fillAlpha: 0.38, color: 'panel', width: 0.6 });
            }
            for (let j = 1; j < N; j++) S.hline(j / N, { color: 'orange', width: 0.6, alpha: 0.5 });
          } else {
            for (let i = 0; i < N; i++) {
              const a = i / N, b = (i + 1) / N, lo = cellInf(o, a, b), hi = cellSup(o, a, b);
              S.rect(a, 0, b, lo, { fill: 'blue', fillAlpha: 0.35, color: 'panel', width: 0.6 });
              S.rect(a, lo, b, hi, { fill: 'red', fillAlpha: 0.16, color: 'red', width: 0.6, alpha: 0.6 });
            }
          }
          S.fn(f, { color: 'ink', width: 2, n: 800 });
          if (which.value === 'rat') S.dots(RAT, { r: 2.3, color: 'gold' });
          const T = sums(which.value), I = o.I;
          R.hline(I, { color: 'green', dash: [6, 4], width: 1.4 });
          R.path(T.map((t, i) => [i + 1, t.leb]), { color: 'blue', width: 1.6 });
          R.path(T.map((t, i) => [i + 1, t.L]), { color: 'purple', width: 1.2, dash: [4, 3] });
          R.path(T.map((t, i) => [i + 1, t.U]), { color: 'red', width: 1.2, dash: [4, 3] });
          T.forEach((t, i) => { R.dot(i + 1, t.leb, { color: 'blue', r: i + 1 === k ? 5.5 : 3 }); R.dot(i + 1, t.U, { color: 'red', r: i + 1 === k ? 4.5 : 2.5 }); R.dot(i + 1, t.L, { color: 'purple', r: i + 1 === k ? 4.5 : 2.5 }); });
          v.legend([['blue', 'Lebesgue: $I(s_N)=\\sum_k\\frac1N\\,m(\\{f\\ge\\frac kN\\})$'], ['purple', 'Riemann lower sum', { dash: true }], ['red', 'Riemann upper sum', { dash: true }], ['green', '$\\int_0^1 f\\,dm$', { dash: true }]]);
          st = { N, t: T[k - 1], I, rat: which.value === 'rat' };
        });
        v.readout(() => {
          const s = st; if (!s.t) return '';
          return `$N=${s.N}$: Lebesgue $I(s_N)=${v.fix(s.t.leb, 4)}$; Riemann $L=${v.fix(s.t.L, 4)}$, $U=${v.fix(s.t.U, 4)}$; $\\;\\int_0^1f\\,dm=${v.fix(s.I, 4)}$.` + (s.rat ? ' The upper sums are stuck at $1$: $f$ is not Riemann integrable, yet its Lebesgue integral is $\\tfrac13$.' : '');
        });
      },
    },
    {
      num: '11.22',
      kind: 'Definition',
      name: 'Integral of a signed function; the class L(μ)',
      statement: String.raw`Let $f$ be measurable on $E\in\mathfrak M$. If at least one of $\int_Ef^+\,d\mu$ and $\int_Ef^-\,d\mu$ is finite, define
$$\int_Ef\,d\mu=\int_Ef^+\,d\mu-\int_Ef^-\,d\mu .$$
If both are finite, $f$ is **integrable** (summable) on $E$ in the sense of Lebesgue, written $f\in\mathscr L(\mu)$ on $E$. The integral may thus exist and equal $\pm\infty$ without $f$ being integrable.

Immediate properties (Rudin's Remarks 11.23): a bounded measurable $f$ on a set of finite measure is integrable, with $a\mu(E)\le\int_Ef\,d\mu\le b\mu(E)$ when $a\le f\le b$; the integral is monotone and homogeneous; $\int_Ef\,d\mu=0$ if $\mu(E)=0$; and $f\in\mathscr L(\mu)$ on $E$ implies $f\in\mathscr L(\mu)$ on measurable subsets of $E$.`,
      idea: String.raw`Splitting $f=f^+-f^-$ reduces everything to nonnegative integrals, which are always defined. The price is that cancellation is not allowed: the Lebesgue integral is an absolutely convergent integral, so $\frac{\sin x}{x}$ on $(0,\infty)$ — whose improper Riemann integral is $\frac\pi2$ — is not Lebesgue integrable, because $\int f^+=\int f^-=\infty$.`,
      caption: String.raw`Top: $f^+$ (blue) and $f^-$ (red) on $(0,30]$. Bottom: $\int_0^Rf^+$ and $\int_0^Rf^-$ against $R$ (log scale); move $R$ to see whether they settle. The first $f$ is integrable. For $\frac{\sin x}{x}$ both grow like $\frac1\pi\log R$: no Lebesgue integral, although the difference converges to $\frac\pi2$. For the third, $\int f^-$ is finite and $\int f^+=\infty$: the integral exists and equals $+\infty$, but $f\notin\mathscr L$.`,
      deps: ['pma-11.21', 'pma-11.17a'],
      see: ['rca-1.30', 'rca-1.31'],
      tags: ['integration', 'integrable functions'],
      viz(v) {
        const M = v.M;
        const FS = {
          L: { label: '$e^{-x/6}\\sin x$', f: (x) => Math.exp(-x / 6) * Math.sin(x) },
          sinc: { label: '$\\frac{\\sin x}{x}$', f: (x) => (x === 0 ? 1 : Math.sin(x) / x) },
          plus: { label: '$\\frac{1}{1+x}-2e^{-x}$', f: (x) => 1 / (1 + x) - 2 * Math.exp(-x) },
        };
        const which = v.select('$f$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'sinc');
        const rS = v.slider('$R$', 1, 1000, 30, { log: true, fmt: (x) => v.fmt(x, 3) });
        const T = v.stage({ x: [0, 30], y: [-1.1, 1.1], height: 230, full: true, axes: true, xticks: [5, 10, 15, 20, 25, 30], yticks: [-1, -0.5, 0.5, 1] });
        const B = v.stage({ x: [-0.05, 3.05], y: [-0.4, 3.2], height: 200, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], yticks: [0, 1, 2, 3], title: '$\\int_0^R f^+$ (blue) and $\\int_0^R f^-$ (red) against $R$' });
        const H = 0.005, NX = Math.round(1000 / H);
        const CACHE = {};
        const cum = (w) => {
          if (CACHE[w]) return CACHE[w];
          const f = FS[w].f, P = new Float64Array(NX + 1), Q = new Float64Array(NX + 1);
          let prev = f(0);
          for (let i = 1; i <= NX; i++) { const y = f(i * H), ym = f((i - 0.5) * H); const p = (Math.max(prev, 0) + 4 * Math.max(ym, 0) + Math.max(y, 0)) * H / 6, q = (Math.max(-prev, 0) + 4 * Math.max(-ym, 0) + Math.max(-y, 0)) * H / 6; P[i] = P[i - 1] + p; Q[i] = Q[i - 1] + q; prev = y; }
          return (CACHE[w] = { P, Q });
        };
        let st = {};
        v.render(() => {
          const w = which.value, f = FS[w].f, R = rS.value, { P, Q } = cum(w);
          T.fn((x) => Math.max(f(x), 0), { color: 'blue', width: 1.8, fill: 'blue', fillAlpha: 0.25, n: 1500 });
          T.fn((x) => Math.min(f(x), 0), { color: 'red', width: 1.8, fill: 'red', fillAlpha: 0.25, n: 1500 });
          if (R <= 30) T.vline(R, { color: 'gold', width: 1.4 });
          const idx = (r) => Math.min(NX, Math.round(r / H));
          const pts = (A) => M.linspace(0, 3, 240).map((t) => [t, A[idx(Math.pow(10, t))]]);
          const pp = pts(P), qq = pts(Q);
          const top = Math.max(3.2, ...pp.map((p) => p[1]), ...qq.map((p) => p[1])) * 1.05;
          B.setView(null, [-0.12 * top, top]);
          B.path(pp, { color: 'blue', width: 2 }); B.path(qq, { color: 'red', width: 2 });
          const t = Math.log10(R), ip = P[idx(R)], iq = Q[idx(R)];
          B.vline(t, { color: 'gold', width: 1.2 });
          B.dot(t, ip, { color: 'blue', r: 5 }); B.dot(t, iq, { color: 'red', r: 5 });
          v.legend([['blue', '$f^+$', { area: true }], ['red', '$f^-$', { area: true }], ['gold', 'cut-off $R$']]);
          st = { w, R, ip, iq };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          const base = `$\\int_0^{${v.fmt(s.R, 3)}}f^+=${v.fix(s.ip, 4)}$, $\\;\\int_0^{${v.fmt(s.R, 3)}}f^-=${v.fix(s.iq, 4)}$, difference $${v.fix(s.ip - s.iq, 4)}$. `;
          if (s.w === 'L') return base + 'Both converge: $f\\in\\mathscr L$ on $(0,\\infty)$.';
          if (s.w === 'sinc') return base + 'Both diverge (slowly): $\\int f$ is undefined and $f\\notin\\mathscr L$, though the difference tends to $\\pi/2\\approx1.5708$.';
          return base + '$\\int f^-$ converges, $\\int f^+$ diverges: $\\int_0^\\infty f\\,dm=+\\infty$ exists, but $f\\notin\\mathscr L$.';
        });
      },
    },
    {
      num: '11.24',
      kind: 'Theorem',
      name: 'The indefinite integral is countably additive',
      statement: String.raw`(a) Let $f\ge0$ be measurable on $X$, and for $A\in\mathfrak M$ put $\varphi(A)=\int_Af\,d\mu$. Then $\varphi$ is countably additive on $\mathfrak M$.

(b) The same holds if $f\in\mathscr L(\mu)$ on $X$.`,
      idea: String.raw`For a simple $f=\sum c_iK_{E_i}$, $\varphi(A)=\sum_ic_i\mu(A\cap E_i)$ is countably additive because $\mu$ is. For general $f\ge0$ and disjoint $A_n$ with union $A$, any simple $s\le f$ gives $\int_As=\sum_n\int_{A_n}s\le\sum_n\varphi(A_n)$, hence $\varphi(A)\le\sum\varphi(A_n)$; the reverse inequality follows by choosing simple functions close to $f$ on $A_1,\dots,A_n$ simultaneously. Part (b) applies (a) to $f^+$ and $f^-$.`,
      caption: String.raw`The pieces $A_k$ (alternating colours) are disjoint with union $(0,1]$. The bars are $\varphi(A_k)=\int_{A_k}f$, the gold curve their partial sums, and the green line $\varphi\big((0,1]\big)$. For $f=\frac1{2\sqrt x}$ and $A_k=(4^{-k},4^{1-k}]$ each piece carries $2^{-k}$; the signed $f=\frac{\sin(1/x)}{\sqrt x}$ is integrable and its pieces' signed masses add up as well; for $f=\frac1x$ every piece carries $\log2$ and both sides are $+\infty$.`,
      deps: ['pma-11.21', 'pma-11.22', 'pma-11.2'],
      see: ['rca-1.29'],
      tags: ['integration', 'measure'],
      viz(v) {
        const M = v.M;
        const FS = {
          sq: { label: '$\\frac{1}{2\\sqrt x}$', f: (x) => 0.5 / Math.sqrt(x), piece: (k) => [Math.pow(4, -k), Math.pow(4, 1 - k)], mass: (k) => Math.pow(2, -k), total: 1, y: [-1.0, 6], strip: -0.4, lo: 0.002 },
          osc: { label: '$\\frac{\\sin(1/x)}{\\sqrt x}$', f: (x) => Math.sin(1 / x) / Math.sqrt(x), piece: (k) => [1 / (k + 1), 1 / k], mass: (k) => M.integrate((u) => Math.sin(u) * Math.pow(u, -1.5), k, k + 1, 200), total: null, y: [-7.6, 6], strip: -6.4, lo: 0.035 },
          inv: { label: '$\\frac1x$', f: (x) => 1 / x, piece: (k) => [Math.pow(2, -k), Math.pow(2, 1 - k)], mass: () => Math.LN2, total: Infinity, y: [-2, 12], strip: -0.8, lo: 0.002 },
        };
        // ∫_0^1 sin(1/x)/√x dx = ∫_1^∞ sin u · u^{-3/2} du (converges absolutely)
        FS.osc.total = M.integrate((u) => Math.sin(u) * Math.pow(u, -1.5), 1, 4000, 400000); // tail beyond 4000 is < 1e-5
        const which = v.select('$f$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const nS = v.slider('pieces $n$', 1, 16, 4, { int: true });
        const T = v.stage({ x: [0, 1], y: [-0.3, 6], height: 250, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const B = v.stage({ x: [0.3, 16.7], y: [0, 1.1], height: 180, full: true, axes: 'box', xticks: [1, 2, 4, 6, 8, 10, 12, 14, 16], title: '$\\varphi(A_k)$ (bars) and $\\sum_{k\\le n}\\varphi(A_k)$ (gold)' });
        const CACHE = {};
        let st = {};
        v.render(() => {
          const w = which.value, o = FS[w], n = nS.value;
          T.setView(null, o.y);
          const masses = CACHE[w] ||= M.range(16, 1).map(o.mass);
          for (let k = 1; k <= n; k++) {
            const [a, b] = o.piece(k), c = k % 2 ? 'blue' : 'teal';
            T.fn(o.f, { domain: [Math.max(a, o.lo), b], color: c, width: 1.4, fill: c, fillAlpha: 0.3, n: w === 'osc' ? 600 : 200 });
            T.line(a, o.strip, b, o.strip, { color: c, width: 6, cap: 'butt' });
          }
          T.fn(o.f, { domain: [o.lo, 1], color: 'ink', width: 1.4, n: w === 'osc' ? 5000 : 800 });
          let run = 0; const parts = masses.map((m) => (run += m));
          const tot = o.total;
          const hi = Math.max(...masses, ...parts.slice(0, 16), isFinite(tot) ? tot : 0, 0.2) * 1.12, lo = Math.min(0, ...masses, ...parts) * 1.12;
          B.setView(null, [lo - 0.12 * (hi - lo), hi]);
          B.bars(masses, { color: (y, i) => (i < n ? (i % 2 ? 'teal' : 'blue') : 'faint'), barWidth: 0.55 });
          B.path(parts.map((p, i) => [i + 1, p]), { color: 'gold', width: 2 });
          parts.forEach((p, i) => B.dot(i + 1, p, { color: i < n ? 'gold' : 'muted', r: i + 1 === n ? 5 : 2.5 }));
          if (isFinite(tot)) B.hline(tot, { color: 'green', dash: [6, 4], width: 1.4 });
          B.hline(0, { color: 'muted', width: 1 });
          v.legend([['blue', '$\\int_{A_k}f$ over disjoint pieces $A_k$', { area: true }], ['gold', 'partial sums'], ['green', '$\\varphi(A)=\\int_0^1f$', { dash: true }]]);
          st = { w, n, sum: parts[n - 1], tot };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          if (s.w === 'inv') return `$\\sum_{k\\le ${s.n}}\\varphi(A_k)=${s.n}\\log2=${v.fix(s.sum, 4)}\\to\\infty=\\int_0^1\\frac{dx}x$: countable additivity holds with value $+\\infty$.`;
          return `$\\sum_{k\\le ${s.n}}\\varphi(A_k)=${v.fix(s.sum, 5)}$ $\\;\\to\\;\\varphi\\big((0,1]\\big)=${v.fix(s.tot, 5)}$` + (s.w === 'osc' ? ' (the series of signed masses converges absolutely, since $\\sum\\int_{A_k}|f|=\\int|f|<\\infty$).' : '.');
        });
      },
    },
    {
      num: '11.24a',
      kind: 'Corollary',
      name: 'Sets of measure zero do not affect integrals',
      statement: String.raw`If $A\in\mathfrak M$, $B\subset A$ and $\mu(A-B)=0$, then $\int_Af\,d\mu=\int_Bf\,d\mu$.

Consequently functions that agree almost everywhere — off a set of measure zero — have the same integral over every measurable set (Rudin's Remarks 11.25).`,
      idea: String.raw`$A$ is the disjoint union of $B$ and $A-B$, so by 11.24 $\int_Af=\int_Bf+\int_{A-B}f$, and an integral over a set of measure zero vanishes (every simple function below $f$ has $I_{A-B}(s)=0$).`,
      caption: String.raw`$A=[0,1]$ and $B=A-N$. Shaded red is $\int_{N_n}f$ over the stage-$n$ approximation $N_n\supset N$. For a finite set or the middle-thirds Cantor set it tends to $0$, so $\int_Bf=\int_Af$ — even though the Cantor set is uncountable. For the fat Cantor set, $m(N)=\frac12$, the hypothesis fails and removing $N$ changes the integral.`,
      deps: ['pma-11.24'],
      see: ['rca-1.35', 'rca-1.39'],
      verify: true,
      tags: ['integration', 'null sets'],
      viz(v) {
        const M = v.M;
        const which = v.select('$N=A-B$', [{ value: 'fin', label: 'a finite set' }, { value: 'std', label: 'Cantor set' }, { value: 'fat', label: 'fat Cantor set' }], 'std');
        const nS = v.slider('stage $n$', 0, 10, 3, { int: true });
        const f = (x) => 1 + 0.6 * Math.sin(2 * Math.PI * x) + 0.8 * x;
        const T = v.stage({ x: [0, 1], y: [-0.35, 2.3], height: 300, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0.5, 1, 1.5, 2] });
        const B = v.stage({ x: [-0.6, 10.6], y: [0, 1.2], height: 160, full: true, axes: 'box', xticks: [0, 2, 4, 6, 8, 10], title: '$\\int_{N_n}f$ against the stage $n$' });
        const IA = 1 + 0.4;
        const PTS = [0.13, 0.31, 0.5, 0.77, 0.9];
        const setN = (w, n) => (w === 'fin' ? PTS.map((p) => [p - 0.06 * Math.pow(2, -n), p + 0.06 * Math.pow(2, -n)]) : cantorKeep(n, w === 'fat'));
        const intOver = (I) => I.reduce((s, [a, b]) => s + M.integrate(f, a, b, 16), 0);
        const CACHE = {};
        let st = {};
        v.render(() => {
          const w = which.value, n = nS.value, I = setN(w, n);
          const prof = CACHE[w] ||= M.range(11).map((k) => intOver(setN(w, k)));
          T.fn(f, { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.18 });
          for (const [a, b] of I) { T.fn(f, { domain: [a, b], fill: 'red', fillAlpha: 0.45, color: 'red', width: 1, n: 30 }); T.line(a, -0.18, b, -0.18, { color: 'red', width: 7, cap: 'butt' }); }
          if (w === 'fin') T.dots(PTS.map((p) => [p, -0.18]), { r: 3.5, color: 'ink' });
          T.tex('N_n', 1, -0.18, { color: 'red', align: 'right', baseline: 'bottom', dy: -7, size: 13 });
          const lim = w === 'fat' ? prof[10] : 0;
          B.setView(null, [-0.12 * Math.max(...prof) * 1.1, Math.max(...prof) * 1.1]);
          B.bars(prof, { x0: 0, color: (y, i) => (i === n ? 'red' : 'faint'), barWidth: 0.6 });
          B.hline(lim, { color: w === 'fat' ? 'red' : 'green', dash: [6, 4], width: 1.4 });
          v.legend([['blue', '$\\int_B f$', { area: true }], ['red', '$\\int_{N_n}f$, $N_n\\downarrow N$', { area: true }]]);
          st = { w, n, iN: prof[n], lim, mN: I.reduce((s, [a, b]) => s + b - a, 0) };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          const head = `$m(N_{${s.n}})=${v.fix(s.mN, 5)}$, $\\;\\int_{N_{${s.n}}}f=${v.fix(s.iN, 5)}$. `;
          if (s.w === 'fat') return head + `Here $m(N)=\\tfrac12>0$: $\\int_Bf=\\int_Af-\\int_Nf\\approx${v.fix(IA - s.lim, 3)}\\ne\\int_Af=${v.fix(IA, 3)}$.`;
          return head + `In the limit $m(N)=0$ and $\\int_Nf=0$, so $\\int_Bf=\\int_Af=${v.fix(IA, 3)}$; redefining $f$ on $N$ in any way changes nothing.`;
        });
      },
    },
    {
      num: '11.26',
      kind: 'Theorem',
      name: 'Integrable functions are absolutely integrable',
      statement: String.raw`If $f\in\mathscr L(\mu)$ on $E$, then $|f|\in\mathscr L(\mu)$ on $E$ and
$$\Big|\int_Ef\,d\mu\Big|\le\int_E|f|\,d\mu .$$
The same holds for complex $f=u+iv$, which Rudin calls integrable when $u,v$ are measurable and $\int_E|f|\,d\mu<\infty$, with $\int f=\int u+i\int v$.`,
      idea: String.raw`Real case: split $E=A\cup B$ with $f\ge0$ on $A$ and $f<0$ on $B$; by 11.24, $\int_E|f|=\int_Af^++\int_Bf^-<\infty$, and $\pm\int f\le\int|f|$. Complex case: pick $c$ with $|c|=1$ and $c\int f=|\int f|$; then $|\int f|=\int\Re(cf)\le\int|cf|=\int|f|$ because $\Re(cf)\le|cf|$ pointwise.`,
      caption: String.raw`Left: the running integral $t\mapsto\int_0^tf$ of a complex $f$ traced in $\C$; its length is $\int_0^1|f|$, its endpoint has modulus $|\int f|$ — a path is never shorter than its chord. The rotation $c$ sends the endpoint to the positive real axis (dashed copy). Right: the proof, pointwise — $\Re(cf)\le|f|$, and the areas are $|\int f|$ and $\int|f|$. Turn the winding down to $0$ ($f$ of constant argument) for equality.`,
      deps: ['pma-11.24', 'pma-11.22'],
      see: ['rca-1.33'],
      tags: ['integration', 'inequalities', 'complex functions'],
      viz(v) {
        const M = v.M;
        const wS = v.slider('phase winding $\\omega$', 0, 12, 4, { step: 0.1 });
        const L = v.stage({ x: [-0.4, 1.6], y: [-0.9, 0.9], equal: true, height: 330, axes: true, weight: 1, title: 'running integral $\\int_0^tf$ in $\\C$' });
        const R = v.stage({ x: [0, 1], y: [-1.7, 1.9], height: 330, axes: true, weight: 1.15, xticks: [0.25, 0.5, 0.75, 1], title: '$|f(t)|$ and $\\Re\\big(cf(t)\\big)$' });
        const r = (t) => 1 + 0.45 * Math.sin(5 * t + 0.4);
        const th = (t, w) => w * (t * t - 0.3 * t) + 0.5;
        let st = {};
        v.render(() => {
          const w = wS.value, N = 800;
          const pts = [[0, 0]]; let re = 0, im = 0, len = 0;
          for (let i = 0; i < N; i++) { const t = (i + 0.5) / N, rr = r(t), a = th(t, w); re += rr * Math.cos(a) / N; im += rr * Math.sin(a) / N; len += rr / N; pts.push([re, im]); }
          const mod = Math.hypot(re, im), phi = Math.atan2(im, re), c = -phi;
          const span = Math.max(1.6, len * 0.75);
          L.setView([-span * 0.45, span * 1.05], [-span * 0.62, span * 0.62]);
          const rot = pts.map(([x, y]) => [x * Math.cos(c) - y * Math.sin(c), x * Math.sin(c) + y * Math.cos(c)]);
          L.path(rot, { color: 'muted', width: 1.2, dash: [4, 4] });
          L.path(pts, { color: 'gold', width: 2.6 });
          L.line(0, 0, re, im, { color: 'green', width: 2.2 });
          L.dot(re, im, { color: 'green', r: 5, label: '∫f', labelPos: 'ne' });
          L.dot(mod, 0, { color: 'muted', r: 4, label: 'c∫f = |∫f|', labelPos: 'ne' });
          L.dot(0, 0, { color: 'ink', r: 3.5 });
          // right: |f| and Re(c f)
          R.fn((t) => r(t), { color: 'orange', width: 2, fill: 'orange', fillAlpha: 0.15 });
          R.fn((t) => r(t) * Math.cos(th(t, w) + c), { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.25 });
          R.fn((t) => -r(t), { color: 'orange', width: 1, dash: [4, 4] });
          v.legend([['gold', 'path $t\\mapsto\\int_0^tf$ (length $\\int|f|$)'], ['green', 'chord: $|\\int f|$'], ['orange', '$|f|$', { area: true }], ['blue', '$\\Re(cf)$, $|c|=1$', { area: true }]]);
          st = { mod, len, w };
        });
        v.readout(() => `$\\big|\\int_0^1f\\big|=\\int_0^1\\Re(cf)=${v.fix(st.mod ?? 0, 4)}\\;\\le\\;\\int_0^1|f|=${v.fix(st.len ?? 0, 4)}$` + ((st.w ?? 1) === 0 ? ' — equality, since $f$ has constant argument.' : '.'));
      },
    },
    {
      num: '11.27',
      kind: 'Theorem',
      name: 'A measurable function dominated by an integrable one is integrable',
      statement: String.raw`If $f$ is measurable on $E$, $|f|\le g$ on $E$, and $g\in\mathscr L(\mu)$ on $E$, then $f\in\mathscr L(\mu)$ on $E$.`,
      idea: String.raw`$f^+\le g$ and $f^-\le g$, so by monotonicity of the integral of nonnegative functions $\int_Ef^\pm\le\int_Eg<\infty$. This is how integrability is usually verified in practice — and it is the hypothesis of the dominated convergence theorem.`,
      caption: String.raw`$f(x)=\frac{\sin(1/x)}{x^p}$ oscillates infinitely often near $0$ inside the envelope $\pm g$, $g=x^{-p}$ (orange). Bottom: $\int_\delta^1f^+$, $\int_\delta^1f^-$ and $\int_\delta^1g$ as $\delta\to0$. For $p<1$, $g$ is integrable and caps both parts of $f$; at $p\ge1$ the envelope fails and so does $f$: $\int f^\pm=\infty$.`,
      deps: ['pma-11.22', 'pma-11.17a'],
      tags: ['integration', 'domination'],
      viz(v) {
        const M = v.M;
        const pS = v.slider('$p$', 0.3, 1.2, 0.6, { step: 0.05 });
        const dS = v.slider('$\\delta$', 1e-4, 0.5, 0.02, { log: true, fmt: (x) => v.fmt(x, 2) });
        const T = v.stage({ x: [0, 1], y: [-6, 6], height: 250, full: true, axes: true, xticks: [0.25, 0.5, 0.75, 1], yticks: [-4, -2, 2, 4] });
        const B = v.stage({ x: [-0.1, 4.1], y: [-0.5, 5], height: 200, full: true, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000'], [4, '10⁴']], title: 'integrals over $[\\delta,1]$ against $1/\\delta$ (log scale)' });
        const CACHE = {};
        // substitution u = 1/x: ∫_δ^1 h(x) dx with h = sin(1/x)^± x^{-p}  =  ∫_1^{1/δ} sin(u)^± u^{p-2} du
        const prof = (p) => {
          const key = p.toFixed(3); if (CACHE[key]) return CACHE[key];
          const U = 1e4, H = 0.02, n = Math.round((U - 1) / H), P = [0], Q = [0], G = [0];
          let a = 0, b = 0, g = 0;
          for (let i = 0; i < n; i++) {
            const u0 = 1 + i * H, u1 = u0 + H, um = u0 + H / 2;
            const w = (u) => Math.pow(u, p - 2);
            const sp = (u) => Math.max(Math.sin(u), 0) * w(u), sn = (u) => Math.max(-Math.sin(u), 0) * w(u);
            a += (sp(u0) + 4 * sp(um) + sp(u1)) * H / 6; b += (sn(u0) + 4 * sn(um) + sn(u1)) * H / 6; g += (w(u0) + 4 * w(um) + w(u1)) * H / 6;
            P.push(a); Q.push(b); G.push(g);
          }
          return (CACHE[key] = { P, Q, G, H });
        };
        let st = {};
        v.render(() => {
          const p = Math.round(pS.value * 20) / 20, d = dS.value, f = (x) => Math.sin(1 / x) * Math.pow(x, -p), g = (x) => Math.pow(x, -p);
          T.vband(0, d, { color: 'muted', alpha: 0.08 });
          T.fn(g, { domain: [0.003, 1], color: 'orange', width: 2 });
          T.fn((x) => -g(x), { domain: [0.003, 1], color: 'orange', width: 2 });
          T.fn(f, { domain: [0.003, 1], color: 'ink', width: 1.1, n: 8000 });
          T.vline(d, { color: 'gold', width: 1.3 });
          const { P, Q, G, H } = prof(p);
          const at = (A, inv) => A[Math.min(A.length - 1, Math.round((inv - 1) / H))];
          const ts = M.linspace(0, 4, 200);
          const curve = (A) => ts.map((t) => [t, at(A, Math.pow(10, t))]);
          const cg = curve(G), cp = curve(P), cq = curve(Q);
          const top = Math.min(30, Math.max(5, ...cg.map((q) => q[1]))) * 1.05;
          B.setView(null, [-0.1 * top, top]);
          B.path(cg, { color: 'orange', width: 2 }); B.path(cp, { color: 'blue', width: 2 }); B.path(cq, { color: 'red', width: 2 });
          const t = Math.log10(1 / d);
          B.vline(t, { color: 'gold', width: 1.2 });
          const vals = { ig: at(G, 1 / d), ip: at(P, 1 / d), iq: at(Q, 1 / d) };
          B.dot(t, Math.min(vals.ig, top), { color: 'orange', r: 4.5 }); B.dot(t, vals.ip, { color: 'blue', r: 4.5 }); B.dot(t, vals.iq, { color: 'red', r: 4.5 });
          v.legend([['ink', '$f=\\sin(1/x)\\,x^{-p}$'], ['orange', '$\\pm g=\\pm x^{-p}$ and $\\int_\\delta^1 g$'], ['blue', '$\\int_\\delta^1f^+$'], ['red', '$\\int_\\delta^1f^-$']]);
          st = { p, d, ...vals };
        });
        v.readout(() => {
          const s = st; if (s.p == null) return '';
          const head = `$p=${v.fix(s.p, 2)}$, $\\delta=${v.sci(s.d, 2)}$: $\\;\\int_\\delta^1f^+=${v.fix(s.ip, 3)}$, $\\int_\\delta^1f^-=${v.fix(s.iq, 3)}$, $\\int_\\delta^1g=${v.fix(s.ig, 3)}$. `;
          return head + (s.p < 1 - 1e-9 ? `As $\\delta\\to0$, $\\int g\\to\\frac1{1-p}=${v.fix(1 / (1 - s.p), 3)}<\\infty$, and both parts of $f$ stay below it: $f\\in\\mathscr L$.` : 'Now $g\\notin\\mathscr L$, and indeed $\\int f^+$ and $\\int f^-$ grow without bound: $f\\notin\\mathscr L$.');
        });
      },
    },
    {
      num: '11.28',
      kind: 'Theorem',
      name: "Lebesgue's monotone convergence theorem",
      statement: String.raw`Let $E\in\mathfrak M$ and let $\{f_n\}$ be measurable functions with
$$0\le f_1(x)\le f_2(x)\le\cdots\qquad(x\in E).$$
If $f_n(x)\to f(x)$ for every $x\in E$, then
$$\int_Ef_n\,d\mu\;\longrightarrow\;\int_Ef\,d\mu\qquad(n\to\infty).$$`,
      idea: String.raw`The integrals increase to some $\alpha\le\int_Ef$. For the reverse inequality fix $c\in(0,1)$ and a simple $s$ with $0\le s\le f$, and put $E_n=\{x\in E:f_n(x)\ge c\,s(x)\}$. These sets increase to $E$, and $\int_Ef_n\ge\int_{E_n}f_n\ge c\int_{E_n}s$. Since $A\mapsto\int_As$ is countably additive (11.24), continuity from below (11.3) gives $\int_{E_n}s\to\int_Es$, so $\alpha\ge c\int_Es$; let $c\to1$ and take the supremum over $s$ (11.21).`,
      caption: String.raw`The proof, live. Blue: $f_n$, increasing to $f$ (green dashed). Orange: $c\,s$ for a fixed simple $s\le f$. Gold on the axis: $E_n=\{f_n\ge cs\}$, which grows to all of $[0,1]$. Below: $\int f_n$ (blue) climbs to $\int f$ and always dominates $c\int_{E_n}s$ (orange), which tends to $c\int s$. In the last example the sequence is monotone but **decreasing** ($K_{[n,\infty)}$): every integral is $+\infty$ while the limit is $0$.`,
      deps: ['pma-11.24', 'pma-11.3', 'pma-11.21'],
      see: ['rca-1.26'],
      tags: ['integration', 'convergence theorems'],
      viz(v) {
        const M = v.M;
        const FS = {
          trunc: { label: '$f_n=\\min(1/\\sqrt x,\\,n)$', f: (x) => 1 / Math.sqrt(Math.max(x, 1e-12)), fn: (x, n) => Math.min(1 / Math.sqrt(Math.max(x, 1e-12)), n), If: 2, In: (n) => 2 - 1 / n, y: [-1.0, 4.6] },
          simple: { label: '$f_n=s_n(f)$ (11.20)', f: (x) => 1.3 + 0.75 * Math.sin(2 * Math.PI * x) + 0.3 * Math.sin(9 * x), fn: (x, n) => sDyadic(1.3 + 0.75 * Math.sin(2 * Math.PI * x) + 0.3 * Math.sin(9 * x), n), If: null, In: null, y: [-0.62, 2.6] },
          dec: { label: 'decreasing: $K_{[n,\\infty)}$', y: [-0.4, 1.5] },
        };
        const which = v.select('', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'trunc');
        const nS = v.slider('$n$', 1, 12, 2, { int: true });
        const cS = v.slider('$c$', 0.5, 0.99, 0.85, { step: 0.01 });
        const T = v.stage({ x: [0, 1], y: [-0.5, 4.6], height: 270, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const B = v.stage({ x: [0.3, 12.7], y: [0, 2.2], height: 170, full: true, axes: 'box', xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], title: '$\\int f_n$ (blue) and $c\\int_{E_n}s$ (orange) against $n$' });
        const NG = 20000, XS = M.range(NG).map((i) => (i + 0.5) / NG);
        const sOf = (o) => (x) => 0.25 * Math.floor(Math.min(o.f(x), 2.4) / 0.25);
        const CACHE = {};
        const data = (w) => {
          if (CACHE[w]) return CACHE[w];
          const o = FS[w], s = sOf(o), sv = XS.map(s), fv = XS.map(o.f);
          const If = o.If ?? fv.reduce((a, b) => a + b, 0) / NG;
          const Is = sv.reduce((a, b) => a + b, 0) / NG;
          const In = M.range(12, 1).map((n) => (o.In ? o.In(n) : XS.reduce((a, x) => a + o.fn(x, n), 0) / NG));
          return (CACHE[w] = { s, sv, If, Is, In });
        };
        let st = {};
        v.render(() => {
          const w = which.value, o = FS[w], n = nS.value, c = cS.value;
          cS.el.hidden = w === 'dec';
          if (w === 'dec') {
            T.setView([0, 12], o.y); T.setTicks([0, 2, 4, 6, 8, 10, 12], [0.5, 1]);
            T.rect(n, 0, 12, 1, { fill: 'blue', fillAlpha: 0.3, stroke: false });
            T.line(0, 0, n, 0, { color: 'blue', width: 2.4 }); T.line(n, 1, 12, 1, { color: 'blue', width: 2.4 });
            T.dot(n, 1, { r: 4, color: 'blue' }); T.dot(n, 0, { r: 4, hollow: true, color: 'blue' });
            T.arrow(11, 0.5, 11.9, 0.5, { color: 'blue', width: 1.6 });
            T.text('… continues to ∞', 11.8, 1.25, { align: 'right', size: 12, color: 'blue' });
            T.hline(0, { color: 'green', width: 2, dash: [6, 4] });
            B.setView(null, [-0.3, 2.2]);
            for (let k = 1; k <= 12; k++) { B.arrow(k, 0, k, 2.05, { color: k <= n ? 'blue' : 'faint', width: 3, head: 8 }); }
            B.text('∫ fₙ = ∞ for every n', 6.5, 1.0, { align: 'center', size: 13, color: 'red', weight: 600 });
            B.hline(0, { color: 'green', dash: [6, 4], width: 1.4 });
            v.legend([['blue', '$f_n=K_{[n,\\infty)}\\downarrow0$', { area: true }], ['green', 'limit $f=0$, $\\int f=0$', { dash: true }]]);
            st = { w };
            return;
          }
          T.setView([0, 1], o.y); T.setTicks([0, 0.25, 0.5, 0.75, 1], null);
          const D = data(w), s = D.s;
          for (let k = Math.max(1, n - 3); k < n; k++) T.fn((x) => o.fn(x, k), { color: 'blue', width: 1, alpha: 0.25 + 0.15 * (k - n + 4), n: 1600, domain: [0.0005, 1] });
          T.fn((x) => o.fn(x, n), { color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.16, n: 2000, domain: [0.0005, 1] });
          T.fn(o.f, { color: 'green', width: 1.8, dash: [6, 4], n: 1200, domain: [0.002, 1] });
          steps(T, (x) => c * s(x), 0.0005, 1, { color: 'orange', width: 2.2 }, 2000);
          // E_n = {f_n ≥ c s}
          const inE = XS.map((x, i) => o.fn(x, n) >= c * D.sv[i]);
          let runStart = null; const yE = o.y[0] * 0.33;
          XS.forEach((x, i) => { if (inE[i] && runStart == null) runStart = x; if ((!inE[i] || i === NG - 1) && runStart != null) { T.line(runStart, yE, x, yE, { color: 'gold', width: 7, cap: 'butt' }); runStart = null; } });
          T.tex('E_n', 1, yE, { color: 'gold', align: 'right', baseline: 'bottom', dy: -6, size: 13 });
          // bottom: integrals
          const cEs = M.range(12, 1).map((k) => { let a = 0; XS.forEach((x, i) => { if (o.fn(x, k) >= c * D.sv[i]) a += c * D.sv[i]; }); return a / NG; });
          const top = D.If * 1.12;
          B.setView(null, [-0.1 * top, top]);
          B.hline(D.If, { color: 'green', dash: [6, 4], width: 1.4 });
          B.hline(c * D.Is, { color: 'orange', dash: [4, 4], width: 1.2 });
          D.In.forEach((y, i) => B.dot(i + 1, y, { color: i < n ? 'blue' : 'faint', r: i + 1 === n ? 5.5 : 3.5 }));
          cEs.forEach((y, i) => B.dot(i + 1, y, { color: i < n ? 'orange' : 'faint', r: i + 1 === n ? 5 : 3 }));
          v.legend([['blue', '$f_n$', { area: true }], ['green', '$f=\\lim f_n$', { dash: true }], ['orange', '$c\\,s$, with $s\\le f$ simple'], ['gold', '$E_n=\\{f_n\\ge cs\\}$', { area: true }]]);
          st = { w, n, c, In: D.In[n - 1], If: D.If, cE: cEs[n - 1], cs: c * D.Is, mE: inE.filter(Boolean).length / NG };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          if (s.w === 'dec') return 'Monotone decreasing is not enough: $\\int K_{[n,\\infty)}\\,dm=\\infty$ for all $n$, but the limit function is $0$. (Decreasing sequences need $\\int f_1<\\infty$, via dominated convergence.)';
          return `$\\int f_{${s.n}}=${v.fix(s.In, 4)}\\;\\ge\\;c\\int_{E_{${s.n}}}s=${v.fix(s.cE, 4)}$, $\\;m(E_{${s.n}})=${v.fix(s.mE, 3)}$. As $n\\to\\infty$: $\\int f_n\\to\\int f=${v.fix(s.If, 4)}$ and $c\\int_{E_n}s\\to c\\int s=${v.fix(s.cs, 4)}$.`;
        });
      },
    },
    {
      num: '11.29',
      kind: 'Theorem',
      name: 'The integral is additive',
      statement: String.raw`If $f=f_1+f_2$ with $f_1,f_2\in\mathscr L(\mu)$ on $E$, then $f\in\mathscr L(\mu)$ on $E$ and
$$\int_Ef\,d\mu=\int_Ef_1\,d\mu+\int_Ef_2\,d\mu .$$`,
      idea: String.raw`For $f_1,f_2\ge0$: when both are simple, $f$ is simple with level sets $E'_i\cap E''_j$ and the identity is additivity of $\mu$. In general take increasing simple $s'_n\uparrow f_1$, $s''_n\uparrow f_2$ (11.20); then $s'_n+s''_n\uparrow f$ and monotone convergence (11.28) passes to the limit. For arbitrary signs, split $E$ into the pieces where $f_1,f_2,f$ have fixed signs; on each, move the negative terms to the other side to get an identity between nonnegative functions, and add the pieces up with 11.24.`,
      caption: String.raw`Nonnegative case: $f_1$ (blue) with $f_2$ stacked on top (red), and the simple approximants $s'_n$, $s''_n$ stacked the same way; the strip shows the common refinement into the sets where $(s'_n,s''_n)$ is constant, on which the sum is again simple. Signed case: the strip shows the sign pattern of $(f_1,f_2,f)$ on each piece; on every piece the identity involves only nonnegative functions.`,
      deps: ['pma-11.28', 'pma-11.20', 'pma-11.24'],
      see: ['rca-1.32'],
      tags: ['integration', 'linearity'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'pos', label: '$f_1,f_2\\ge0$' }, { value: 'sgn', label: 'arbitrary signs' }], 'pos');
        const nS = v.slider('$n$', 1, 6, 2, { int: true });
        const T = v.stage({ x: [0, 1], y: [-0.55, 2.2], height: 300, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const f1 = (x) => 0.55 + 0.3 * Math.sin(2 * Math.PI * x + 0.4), f2 = (x) => 0.5 + 0.4 * Math.cos(3 * Math.PI * x);
        const g1 = (x) => 0.75 + 0.45 * Math.sin(2 * Math.PI * x), g2 = (x) => -0.55 + 1.1 * Math.cos(3 * Math.PI * x + 0.6);
        const NG = 8000, XS = M.range(NG).map((i) => (i + 0.5) / NG);
        const I = (h) => XS.reduce((a, x) => a + h(x), 0) / NG;
        const PAL = ['blue', 'teal', 'purple', 'orange', 'pink', 'gold', 'green'];
        let st = {};
        v.render(() => {
          const n = nS.value;
          nS.el.hidden = mode.value !== 'pos';
          if (mode.value === 'pos') {
            T.setView(null, [-0.6, 2.2]); T.setTicks(undefined, [0.5, 1, 1.5, 2]);
            const s1 = (x) => sDyadic(f1(x), n), s2 = (x) => sDyadic(f2(x), n), sum = (x) => s1(x) + s2(x);
            T.between(f1, (x) => 0, 0, 1, { fill: 'blue', fillAlpha: 0.12 });
            T.between((x) => f1(x) + f2(x), f1, 0, 1, { fill: 'red', fillAlpha: 0.1 });
            // stacked simple functions as rectangles over runs where (s1, s2) is constant
            let a = 0, key = `${s1(XS[0])}|${s2(XS[0])}`, runs = [];
            for (let i = 1; i <= NG; i++) { const x = i < NG ? XS[i] : 1, k = i < NG ? `${s1(x)}|${s2(x)}` : null; if (k !== key) { runs.push([a, i < NG ? (XS[i - 1] + XS[i]) / 2 : 1, key]); a = runs[runs.length - 1][1]; key = k; } }
            runs.forEach(([p, q, k], i) => {
              const [u, w] = k.split('|').map(Number);
              T.rect(p, 0, q, u, { fill: 'blue', fillAlpha: 0.4, stroke: false });
              T.rect(p, u, q, u + w, { fill: 'red', fillAlpha: 0.38, stroke: false });
              T.line(p, -0.18, q, -0.18, { color: PAL[i % PAL.length], width: 8, cap: 'butt' });
            });
            T.fn(f1, { color: 'blue', width: 1.6 }); T.fn((x) => f1(x) + f2(x), { color: 'red', width: 1.6 });
            T.tex("\\text{pieces where }(s'_n,s''_n)\\text{ is constant}", 0.005, -0.18, { color: 'ink', align: 'left', baseline: 'bottom', dy: -6, size: 12.5 });
            v.legend([['blue', "$f_1$ and $s'_n$", { area: true }], ['red', "$f_2$ and $s''_n$, stacked on top", { area: true }]]);
            st = { mode: 'pos', n, runs: runs.length, i1: I(s1), i2: I(s2), is: I(sum), F1: I(f1), F2: I(f2) };
          } else {
            T.setView(null, [-2.35, 2.0]); T.setTicks(undefined, [-1.5, -1, -0.5, 0.5, 1, 1.5]);
            const f = (x) => g1(x) + g2(x);
            T.hline(0, { color: 'muted', width: 1 });
            T.fn(g1, { color: 'blue', width: 2 }); T.fn(g2, { color: 'red', width: 2 }); T.fn(f, { color: 'ink', width: 2.4 });
            const sg = (y) => (y >= 0 ? '+' : '−');
            let a = 0, key = sg(g1(0)) + sg(g2(0)) + sg(f(0)); const runs = [];
            for (let i = 1; i <= 2000; i++) { const x = i / 2000, k = i < 2000 ? sg(g1(x)) + sg(g2(x)) + sg(f(x)) : null; if (k !== key) { runs.push([a, x, key]); a = x; key = k; } }
            const types = [...new Set(runs.map((r) => r[2]))];
            runs.forEach(([p, q, k]) => { T.line(p, -1.95, q, -1.95, { color: PAL[types.indexOf(k) % PAL.length], width: 9, cap: 'butt' }); if (q - p > 0.07) T.text(`(${k.split('').join(',')})`, (p + q) / 2, -1.95, { dy: -12, align: 'center', size: 10.5, color: 'ink' }); });
            v.legend([['blue', '$f_1$'], ['red', '$f_2$'], ['ink', '$f=f_1+f_2$'], ['purple', 'pieces with fixed signs of $(f_1,f_2,f)$', { area: true }]]);
            st = { mode: 'sgn', F1: I(g1), F2: I(g2), F: I(f), types: types.length };
          }
        });
        v.readout(() => {
          const s = st; if (!s.mode) return '';
          if (s.mode === 'pos') return `$I(s'_${s.n})+I(s''_${s.n})=${v.fix(s.i1, 4)}+${v.fix(s.i2, 4)}=${v.fix(s.i1 + s.i2, 4)}=I(s'_${s.n}+s''_${s.n})$ exactly (${s.runs} pieces); in the limit $\\int f_1+\\int f_2=${v.fix(s.F1, 4)}+${v.fix(s.F2, 4)}=\\int(f_1+f_2)$.`;
          return `${s.types} sign patterns occur. E.g. where $f_1\\ge0$, $f_2<0$, $f\\ge0$ we use $f_1=f+(-f_2)$, a sum of nonnegative functions. Adding up: $\\int f_1+\\int f_2=${v.fix(s.F1, 4)}+(${v.fix(s.F2, 4)})=${v.fix(s.F1 + s.F2, 4)}=\\int f$.`;
        });
      },
    },
  ],
};
