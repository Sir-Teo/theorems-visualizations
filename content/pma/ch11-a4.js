// Rudin, Principles of Mathematical Analysis — Chapter 11 (part 4): termwise integration, Fatou, dominated
// convergence, comparison with the Riemann integral, and the first facts about L² (11.30–11.36).

/** Stage-n Cantor-type set in [0,1] (fat: remove 4^{-k} at stage k; else middle thirds). */
function cantorKeep(n, fat) {
  let keep = [[0, 1]];
  for (let k = 1; k <= n; k++) keep = keep.flatMap(([a, b]) => { const L = fat ? Math.pow(4, -k) : (b - a) / 3, m = (a + b) / 2; return [[a, m - L / 2], [m + L / 2, b]]; });
  return keep;
}
/** Rationals of (0,1) by denominator: 1/2, 1/3, 2/3, 1/4, 3/4, … */
function rationals(K) {
  const out = []; const g = (a, b) => (b ? g(b, a % b) : a);
  for (let q = 2; out.length < K; q++) for (let p = 1; p < q && out.length < K; p++) if (g(p, q) === 1) out.push(p / q);
  return out;
}
/** Plot a step function given as cells [[a,b,value],...]. */
function cells(S, list, st) { const pts = []; for (const [a, b, y] of list) pts.push([a, y], [b, y], null); S.path(pts, st); }

export default {
  collection: 'pma',
  chapter: 11,
  items: [
    {
      num: '11.30',
      kind: 'Theorem',
      name: 'Termwise integration of series of nonnegative functions',
      statement: String.raw`Let $E\in\mathfrak M$. If $f_n\ge0$ are measurable and $f(x)=\sum_{n=1}^\infty f_n(x)$ for $x\in E$, then
$$\int_Ef\,d\mu=\sum_{n=1}^\infty\int_Ef_n\,d\mu .$$`,
      idea: String.raw`The partial sums $f_1+\dots+f_N$ increase to $f$; their integrals are $\sum_{n\le N}\int f_n$ by additivity (11.29), and monotone convergence (11.28) passes to the limit. Both sides may be $+\infty$. No convergence hypothesis on the series is needed — positivity does all the work.`,
      caption: String.raw`Top: the partial sums $\sum_{n\le N}f_n$ as stacked layers (one colour per term). Bottom: the bars $\int f_n$ and their running sum. For $f_n=-x^{n-1}\log x$ the terms integrate to $1/n^2$ and the sum function to $\pi^2/6$; for spikes $2^{-n}|x-r_n|^{-1/2}$ at the rationals, $f$ is finite almost everywhere yet unbounded on every interval, and its integral is the (finite) sum of the spikes' integrals; for $x^{n-1}$ both sides are $+\infty$.`,
      deps: ['pma-11.28', 'pma-11.29'],
      see: ['rca-1.27'],
      tags: ['integration', 'series', 'convergence theorems'],
      viz(v) {
        const M = v.M;
        const R = rationals(60);
        const FS = {
          zeta: { label: '$-x^{n-1}\\log x$', fn: (n) => (x) => -Math.pow(x, n - 1) * Math.log(x), I: (n) => 1 / (n * n), total: Math.PI * Math.PI / 6, y: [-0.25, 3.2] },
          spikes: { label: 'spikes at the rationals', fn: (n) => (x) => Math.pow(2, -n) / Math.sqrt(Math.abs(x - R[n - 1]) + 1e-12), I: (n) => Math.pow(2, -n) * 2 * (Math.sqrt(R[n - 1]) + Math.sqrt(1 - R[n - 1])), total: null, y: [-0.25, 6] },
          geo: { label: '$x^{n-1}$', fn: (n) => (x) => Math.pow(x, n - 1), I: (n) => 1 / n, total: Infinity, y: [-0.25, 12] },
        };
        FS.spikes.total = M.range(60, 1).reduce((s, n) => s + FS.spikes.I(n), 0);
        const which = v.select('', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'zeta');
        const nS = v.slider('terms $N$', 1, 30, 4, { int: true });
        const T = v.stage({ x: [0, 1], y: [-0.25, 3.2], height: 270, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1] });
        const B = v.stage({ x: [0.3, 30.7], y: [0, 2], height: 170, full: true, axes: 'box', xticks: [1, 5, 10, 15, 20, 25, 30], title: '$\\int f_n$ (bars) and $\\sum_{n\\le N}\\int f_n$ (gold)' });
        const COLS = ['blue', 'teal', 'purple', 'pink', 'orange', 'gold', 'green'];
        let st = {};
        v.render(() => {
          const w = which.value, o = FS[w], N = nS.value;
          T.setView(null, o.y);
          const xs = M.linspace(0.0005, 0.9995, w === 'spikes' ? 4000 : 900);
          let base = xs.map(() => 0);
          for (let n = 1; n <= N; n++) {
            const f = o.fn(n), top = xs.map((x, i) => base[i] + f(x)), c = COLS[(n - 1) % COLS.length];
            const clip = (y) => Math.min(y, o.y[1] * 1.5);
            T.path(xs.map((x, i) => [x, clip(top[i])]).concat(xs.slice().reverse().map((x, j) => [x, clip(base[xs.length - 1 - j])])), { fill: c, fillAlpha: 0.32, stroke: false, close: true });
            T.path(xs.map((x, i) => [x, clip(top[i])]), { color: c, width: 1.1 });
            base = top;
          }
          if (w === 'zeta') T.fn((x) => -Math.log(x) / (1 - x), { color: 'ink', width: 1.6, dash: [6, 4], domain: [0.002, 0.999] });
          if (w === 'geo') T.fn((x) => 1 / (1 - x), { color: 'ink', width: 1.6, dash: [6, 4], domain: [0, 0.95] });
          const Is = M.range(30, 1).map(o.I); let run = 0; const parts = Is.map((y) => (run += y));
          const hi = Math.max(isFinite(o.total) ? o.total : parts[29], 1) * 1.12;
          B.setView(null, [-0.12 * hi, hi]);
          B.bars(Is, { color: (y, i) => (i < N ? COLS[i % COLS.length] : 'faint'), barWidth: 0.6 });
          B.path(parts.map((p, i) => [i + 1, p]), { color: 'gold', width: 2 });
          B.dot(N, parts[N - 1], { color: 'gold', r: 5 });
          if (isFinite(o.total)) B.hline(o.total, { color: 'green', dash: [6, 4], width: 1.4 });
          v.legend([['blue', 'layers $f_1,f_2,\\dots$ of the partial sum', { area: true }], ['ink', 'the sum $f$', { dash: true }], ['gold', 'running sum of integrals'], ['green', '$\\int f$', { dash: true }]]);
          st = { w, N, part: parts[N - 1], total: o.total };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          if (s.w === 'zeta') return `$\\int\\sum_{n\\le ${s.N}}f_n=\\sum_{n\\le ${s.N}}\\frac1{n^2}=${v.fix(s.part, 5)}\\;\\to\\;\\int_0^1\\frac{-\\log x}{1-x}\\,dx=\\frac{\\pi^2}6=${v.fix(s.total, 5)}$.`;
          if (s.w === 'spikes') return `$\\sum_{n\\le ${s.N}}\\int f_n=${v.fix(s.part, 5)}\\to${v.fix(s.total, 4)}$ (60 terms): so $\\int f<\\infty$ and $f<\\infty$ a.e., although $f=\\infty$ at every rational $r_n$.`;
          return `$\\sum_{n\\le ${s.N}}\\frac1n=${v.fix(s.part, 4)}\\to\\infty$, and indeed $\\int_0^1\\frac{dx}{1-x}=\\infty$: the theorem holds with both sides infinite.`;
        });
      },
    },
    {
      num: '11.31',
      kind: 'Theorem',
      name: "Fatou's theorem",
      credit: 'Fatou, 1906',
      statement: String.raw`Let $E\in\mathfrak M$. If $f_n\ge0$ are measurable and $f(x)=\liminf_{n\to\infty}f_n(x)$ for $x\in E$, then
$$\int_Ef\,d\mu\le\liminf_{n\to\infty}\int_Ef_n\,d\mu .$$
Strict inequality can occur.`,
      idea: String.raw`Put $g_n=\inf_{k\ge n}f_k$. Then $g_n$ is measurable (11.17), $0\le g_n\le f_n$, and $g_n\uparrow f$. Monotone convergence gives $\int g_n\to\int f$, while $\int g_n\le\int f_n$; take $\liminf$. The difference $\int(f_n-g_n)$ is mass that $f_n$ carries but the lower envelope never keeps — mass that "escapes".`,
      caption: String.raw`Blue: $f_n$ on $[0,\infty)$; green: $g_n=\inf_{k\ge n}f_k$, which increases to $\liminf f_n$. Below, each bar is $\int f_n$, split into $\int g_n$ (green) and the escaping part $\int(f_n-g_n)$ (red); the dashed line is $\int\liminf f_n$. A bump can escape to infinity, spread out flat, or concentrate into a spike — in each case Fatou's inequality is strict. In the last example nothing escapes.`,
      deps: ['pma-11.28', 'pma-11.17'],
      see: ['rca-1.28'],
      tags: ['integration', 'convergence theorems', 'Fatou'],
      viz(v) {
        const M = v.M;
        const psi = (x) => (x > 0 && x < 3 ? 0.55 * Math.sin(Math.PI * x / 3) ** 2 : 0); // ∫ψ = 0.825
        const bump = (x, c) => (Math.abs(x - c) < 0.5 ? 2 * Math.cos(Math.PI * (x - c)) ** 2 : 0); // mass 1
        const MODES = {
          escape: { label: 'escape to $\\infty$', f: (n) => (x) => psi(x) + bump(x, n + 1.5), g: () => psi, If: () => 0.825 + 1, Ig: () => 0.825, lim: 0.825, x: [0, 14], y: [-0.5, 2.3] },
          spread: { label: 'spreading out', f: (n) => (x) => (x >= 0 && x <= n ? 1 / n : 0), g: () => () => 0, If: () => 1, Ig: () => 0, lim: 0, x: [0, 14], y: [-0.5, 1.15] },
          spike: { label: 'concentrating', f: (n) => (x) => (x > 0 && x < 1 / n ? n : 0), g: () => () => 0, If: () => 1, Ig: () => 0, lim: 0, x: [0, 2], y: [-1, 13] },
          none: { label: 'nothing escapes', f: (n) => (x) => (1 + (n % 2 ? -1 : 1) / (n + 1)) * 1.6 * psi(x), g: (n) => { const k = n % 2 ? n : n + 1; return (x) => (1 - 1 / (k + 1)) * 1.6 * psi(x); }, If: (n) => (1 + (n % 2 ? -1 : 1) / (n + 1)) * 1.32, Ig: (n) => { const k = n % 2 ? n : n + 1; return (1 - 1 / (k + 1)) * 1.32; }, lim: 1.32, x: [0, 4], y: [-0.5, 1.6] },
        };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'escape');
        const nS = v.slider('$n$', 1, 12, 3, { int: true });
        const T = v.stage({ x: [0, 14], y: [-0.5, 2.3], height: 260, full: true, axes: 'box' });
        const B = v.stage({ x: [0.3, 12.7], y: [-0.25, 2.2], height: 180, full: true, axes: 'box', xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], title: '$\\int f_n=\\int g_n$ (green) $+\\int(f_n-g_n)$ (red); dashed: $\\int\\liminf f_n$' });
        let st = {};
        v.render(() => {
          const o = MODES[which.value], n = nS.value;
          T.setView(o.x, o.y); T.setTicks(null, null);
          for (let k = n + 1; k <= n + 3; k++) T.fn(o.f(k), { color: 'blue', width: 1, alpha: 0.35 - 0.08 * (k - n), n: 1600 });
          T.fn(o.f(n), { color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.22, n: 2400 });
          T.fn(o.g(n), { color: 'green', width: 2.4, fill: 'green', fillAlpha: 0.3, n: 1600 });
          if (which.value === 'escape') T.text('→ the bump moves off to +∞', o.x[1] - 0.2, 2.1, { align: 'right', size: 12, color: 'red' });
          if (which.value === 'spike') T.text(`height n = ${n}, width 1/n`, 1.95, o.y[1] - 1, { align: 'right', size: 12, color: 'red' });
          const vals = M.range(12, 1).map((k) => [o.Ig(k), o.If(k) - o.Ig(k)]);
          B.setView(null, [-0.12 * 2.2, Math.max(1.3, ...vals.map(([a, b]) => a + b)) * 1.12]);
          vals.forEach(([a, b], i) => { const x = i + 1, w = 0.3, on = i < n; B.rect(x - w, 0, x + w, a, { fill: on ? 'green' : 'faint', fillAlpha: 0.75, stroke: false }); B.rect(x - w, a, x + w, a + b, { fill: on ? 'red' : 'faint', fillAlpha: on ? 0.6 : 0.4, stroke: false }); });
          B.hline(o.lim, { color: 'green', dash: [6, 4], width: 1.5 });
          v.legend([['blue', '$f_n$ (and the next few, faint)', { area: true }], ['green', '$g_n=\\inf_{k\\ge n}f_k\\uparrow\\liminf f_n$', { area: true }], ['red', 'mass that escapes', { area: true }]]);
          st = { w: which.value, n, If: o.If(n), Ig: o.Ig(n), lim: o.lim };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          const head = `$\\int f_{${s.n}}=${v.fix(s.If, 4)}$, $\\;\\int g_{${s.n}}=${v.fix(s.Ig, 4)}$. `;
          if (s.w === 'none') return head + `$\\liminf\\int f_n=\\int\\liminf f_n=${v.fix(s.lim, 3)}$: equality.`;
          return head + `$\\int\\liminf f_n=${v.fix(s.lim, 3)}<\\liminf\\int f_n=${v.fix(s.lim + 1, 3)}$: a full unit of mass escapes.`;
        });
      },
    },
    {
      num: '11.32',
      kind: 'Theorem',
      name: "Lebesgue's dominated convergence theorem",
      credit: 'Lebesgue, 1908',
      statement: String.raw`Let $E\in\mathfrak M$ and let $\{f_n\}$ be measurable with $f_n(x)\to f(x)$ for $x\in E$. If there is $g\in\mathscr L(\mu)$ on $E$ with $|f_n(x)|\le g(x)$ for all $n$ and $x\in E$, then
$$\lim_{n\to\infty}\int_Ef_n\,d\mu=\int_Ef\,d\mu .$$`,
      idea: String.raw`$f\in\mathscr L$ by 11.27. Apply Fatou (11.31) to the nonnegative functions $g+f_n$ and $g-f_n$: they give $\int(g+f)\le\liminf\int(g+f_n)$ and $\int(g-f)\le\liminf\int(g-f_n)$. Since $\int g<\infty$ it can be cancelled, leaving $\limsup\int f_n\le\int f\le\liminf\int f_n$. The best candidate for $g$ is the least majorant $G=\sup_n|f_n|$: the theorem applies exactly when $\int G<\infty$ is achievable.`,
      caption: String.raw`Top: $f_n$ (blue), the limit $f$ (green dashed) and the least majorant $G=\sup_k|f_k|$ (orange, the smallest possible $g$). Bottom left: $\int f_n$ against $n$ with $\int f$ dashed. Bottom right: $\int_0^RG$ against $R$. When it converges the integrals converge; when it diverges the conclusion can fail — even for $\frac1nK_{[0,n]}$, which tends to $0$ uniformly (Rudin's Exercise 6).`,
      deps: ['pma-11.31', 'pma-11.27', 'pma-11.17b'],
      see: ['rca-1.34'],
      tags: ['integration', 'convergence theorems', 'dominated convergence'],
      viz(v) {
        const M = v.M;
        const MODES = {
          exp: { label: '$(1-\\frac xn)^nK_{[0,n]}$', f: (n) => (x) => (x >= 0 && x <= n ? Math.pow(1 - x / n, n) : 0), lim: (x) => Math.exp(-x), G: (x) => Math.exp(-x), If: (n) => n / (n + 1), I: 1, IG: (R) => 1 - Math.exp(-R), x: [0, 8], y: [-0.15, 1.15], dom: true },
          root: { label: '$\\sqrt n\\,K_{(0,1/n)}$', f: (n) => (x) => (x > 0 && x < 1 / n ? Math.sqrt(n) : 0), lim: () => 0, G: (x) => (x > 0 && x < 1 ? Math.sqrt(Math.floor(1 / x)) : 0), If: (n) => 1 / Math.sqrt(n), I: 0, IG: null, x: [0, 1.2], y: [-0.4, 4.2], dom: true },
          flat: { label: '$\\frac1nK_{[0,n]}$ (uniform!)', f: (n) => (x) => (x >= 0 && x <= n ? 1 / n : 0), lim: () => 0, G: (x) => (x <= 1 ? 1 : 1 / Math.ceil(x)), If: () => 1, I: 0, IG: null, x: [0, 14], y: [-0.15, 1.15], dom: false },
          conc: { label: '$n^2x\\,e^{-nx}$', f: (n) => (x) => n * n * x * Math.exp(-n * x), lim: () => 0, G: null, If: (n) => 1, I: 0, IG: null, x: [0, 2], y: [-0.4, 4.6], dom: false },
        };
        // least majorants where no closed form is used: sup over k ≤ 400
        MODES.conc.G = (x) => { let s = 0; for (let k = 1; k <= 400; k++) s = Math.max(s, k * k * x * Math.exp(-k * x)); return s; };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const nS = v.slider('$n$', 1, 30, 3, { int: true });
        const T = v.stage({ x: [0, 8], y: [-0.15, 1.15], height: 250, full: true, axes: 'box' });
        const B1 = v.stage({ x: [-2, 30.7], y: [-0.15, 1.2], height: 170, axes: 'box', weight: 1, xticks: [1, 10, 20, 30], title: '$\\int f_n$ against $n$' });
        const B2 = v.stage({ x: [-0.1, 3.1], y: [-0.5, 5], height: 170, axes: 'box', weight: 1, xticks: [[0, '1'], [1, '10'], [2, '100'], [3, '1000']], title: '$\\int_0^R G$ against $R$ (log scale)' });
        const CACHE = {};
        const IGcurve = (w) => {
          if (CACHE[w]) return CACHE[w];
          const o = MODES[w]; const ts = M.linspace(0, 3, 120);
          if (o.IG) return (CACHE[w] = ts.map((t) => [t, o.IG(Math.pow(10, t))]));
          // numeric cumulative integral of G on [0, R] (log-spaced grid from 1e-5)
          const xs = [0]; for (let i = 0; i <= 6000; i++) xs.push(Math.pow(10, -5 + 8 * i / 6000));
          const cum = [0]; for (let i = 1; i < xs.length; i++) { const a = xs[i - 1], b = xs[i]; cum.push(cum[i - 1] + 0.5 * (o.G(a + 1e-12) + o.G(b)) * (b - a)); }
          const at = (R) => { let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= R) lo = m; else hi = m; } return cum[lo]; };
          return (CACHE[w] = ts.map((t) => [t, at(Math.pow(10, t))]));
        };
        let st = {};
        v.render(() => {
          const o = MODES[which.value], n = nS.value;
          T.setView(o.x, o.y);
          if (o.G) T.fn(o.G, { color: 'orange', width: 2.2, fill: 'orange', fillAlpha: 0.1, n: 2000, domain: [o.x[0] + 1e-4, o.x[1]] });
          T.fn(o.f(n), { color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.2, n: 2400 });
          T.fn(o.lim, { color: 'green', width: 2, dash: [6, 4] });
          const Is = M.range(30, 1).map(o.If);
          const top = Math.max(1.1, ...Is) * 1.1;
          B1.setView(null, [-0.12 * top, top]);
          B1.hline(o.I, { color: 'green', dash: [6, 4], width: 1.4 });
          Is.forEach((y, i) => B1.dot(i + 1, y, { color: i < n ? 'blue' : 'faint', r: i + 1 === n ? 5 : 3 }));
          const cg = IGcurve(which.value), gtop = Math.max(2, ...cg.map((p) => p[1])) * 1.1;
          B2.setView(null, [-0.12 * gtop, gtop]);
          B2.path(cg, { color: 'orange', width: 2.2 });
          B2.corner(o.dom ? '∫G < ∞: dominated' : '∫G = ∞: no integrable g', 'tl', { color: o.dom ? 'green' : 'red', weight: 600 });
          v.legend([['blue', '$f_n$', { area: true }], ['green', '$f=\\lim f_n$', { dash: true }], ['orange', 'least majorant $G=\\sup_k|f_k|$', { area: true }]]);
          st = { w: which.value, n, In: o.If(n), I: o.I, dom: o.dom, G: cg[cg.length - 1][1] };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          const head = `$\\int f_{${s.n}}=${v.fix(s.In, 4)}$, $\\;\\int f=${v.fix(s.I, 4)}$. `;
          if (s.dom) return head + `$G$ is integrable ($\\int_0^{1000}G=${v.fix(s.G, 4)}$), so the theorem applies and $\\int f_n\\to\\int f$.`;
          return head + `$\\int_0^RG$ grows without bound (like $\\log R$): no integrable dominating function exists, and $\\int f_n=1\\not\\to0$.`;
        });
      },
    },
    {
      num: '11.32a',
      kind: 'Corollary',
      name: 'Bounded convergence on a set of finite measure',
      statement: String.raw`If $\mu(E)<+\infty$, the functions $f_n$ are uniformly bounded on $E$, and $f_n(x)\to f(x)$ for every $x\in E$, then $\int_Ef_n\,d\mu\to\int_Ef\,d\mu$.`,
      idea: String.raw`If $|f_n|\le M$ on $E$, the constant $g=M$ is integrable because $\mu(E)<\infty$ (11.23(a)); apply dominated convergence. Neither uniform convergence nor continuity of the limit is needed — in contrast with Theorem 7.16 for the Riemann integral.`,
      caption: String.raw`The orange box is $E\times[-M,M]$; its area $M\mu(E)$ is finite, so the constant $M$ dominates. For $x^n$ on $[0,1]$ the convergence is not uniform ($\sup|f_n-f|=1$ for all $n$) and the limit is discontinuous, yet $\int x^n=\frac1{n+1}\to0$. Break a hypothesis: on $E=[0,\infty)$ the moving box $K_{[n,n+1]}$ stays bounded but keeps integral $1$; with $nK_{(0,1/n)}$ on $[0,1]$ the bound fails.`,
      deps: ['pma-11.32'],
      see: ['pma-7.16'],
      tags: ['integration', 'convergence theorems'],
      viz(v) {
        const M = v.M;
        const MODES = {
          pow: { label: '$x^n$ on $[0,1]$', f: (n) => (x) => (x >= 0 && x <= 1 ? Math.pow(x, n) : NaN), lim: (x) => (x >= 1 ? 1 : 0), If: (n) => 1 / (n + 1), I: 0, sup: () => 1, x: [-0.05, 1.15], y: [-0.25, 1.4], box: [0, 1, 1], ok: true },
          osc: { label: '$\\cos(\\pi x)^{2n}$ on $[0,2]$', f: (n) => (x) => (x >= 0 && x <= 2 ? Math.pow(Math.cos(Math.PI * x), 2 * n) : NaN), lim: (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? 1 : 0), If: (n) => 2 * M.binom(2 * n, n) / Math.pow(4, n), I: 0, sup: () => 1, x: [-0.08, 2.2], y: [-0.25, 1.4], box: [0, 2, 1], ok: true },
          move: { label: '$K_{[n,n+1]}$ on $[0,\\infty)$', f: (n) => (x) => (x >= n && x <= n + 1 ? 1 : 0), lim: () => 0, If: () => 1, I: 0, sup: () => 1, x: [0, 14], y: [-0.25, 1.4], box: null, ok: false },
          tall: { label: '$nK_{(0,1/n)}$ on $[0,1]$', f: (n) => (x) => (x > 0 && x < 1 / n ? n : 0), lim: () => 0, If: () => 1, I: 0, sup: (n) => n, x: [-0.05, 1.15], y: [-1.5, 13], box: null, ok: false },
        };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'pow');
        const nS = v.slider('$n$', 1, 12, 3, { int: true });
        const T = v.stage({ x: [-0.05, 1.15], y: [-0.25, 1.4], height: 270, axes: 'box', weight: 1.6 });
        const B = v.stage({ x: [-1, 12.7], y: [-0.15, 1.15], height: 270, axes: 'box', weight: 1, minWidth: 220, xticks: [1, 4, 8, 12], title: '$\\int_Ef_n$ against $n$' });
        let st = {};
        v.render(() => {
          const o = MODES[which.value], n = nS.value;
          T.setView(o.x, o.y);
          if (o.box) T.rect(o.box[0], 0, o.box[1], o.box[2], { color: 'orange', width: 1.6, dash: [6, 4], fill: 'orange', fillAlpha: 0.08 });
          for (let k = Math.max(1, n - 3); k < n; k++) T.fn(o.f(k), { color: 'blue', width: 1, alpha: 0.3, n: 1800 });
          T.fn(o.f(n), { color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.2, n: 2400 });
          if (which.value === 'pow') { T.line(0, 0, 0.995, 0, { color: 'green', width: 2.2, dash: [6, 4] }); T.dot(1, 1, { color: 'green', r: 4.5 }); T.dot(1, 0, { color: 'green', r: 4, hollow: true }); }
          else if (which.value === 'osc') { T.line(0, 0, 2, 0, { color: 'green', width: 2.2, dash: [6, 4] }); [0, 1, 2].forEach((x) => { T.dot(x, 1, { color: 'green', r: 4.5 }); T.dot(x, 0, { color: 'green', r: 4, hollow: true }); }); }
          else T.hline(0, { color: 'green', width: 2.2, dash: [6, 4] });
          if (o.box) T.tex('M=1', o.box[1], 1, { color: 'orange', align: 'right', baseline: 'bottom', dy: -3, size: 13 });
          const Is = M.range(12, 1).map(o.If);
          B.hline(o.I, { color: 'green', dash: [6, 4], width: 1.4 });
          Is.forEach((y, i) => B.dot(i + 1, y, { color: i < n ? (o.ok ? 'blue' : 'red') : 'faint', r: i + 1 === n ? 5.5 : 3.5 }));
          v.legend([['blue', '$f_n$', { area: true }], ['green', 'pointwise limit $f$', { dash: true }]].concat(o.box ? [['orange', 'the dominating constant $M$ on $E$', { area: true }]] : []));
          st = { w: which.value, n, In: o.If(n), ok: o.ok, sup: o.sup(n) };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          if (s.w === 'pow') return `$\\int_0^1x^{${s.n}}=\\frac1{${s.n + 1}}=${v.fix(s.In, 4)}\\to0=\\int f$, although $\\sup_{[0,1]}|f_n-f|=1$ for every $n$: no uniform convergence is needed.`;
          if (s.w === 'osc') return `$\\int_0^2\\cos(\\pi x)^{2n}dx=2\\binom{2n}{n}4^{-n}=${v.fix(s.In, 4)}\\to0$, the integral of the limit (which is $1$ only at $0,1,2$).`;
          if (s.w === 'move') return `Bounded by $1$, but $\\mu(E)=\\infty$: $\\int f_n=1$ for all $n$ while $f_n\\to0$.`;
          return `$\\mu(E)=1$, but $\\sup f_n=${s.sup}$ is not bounded in $n$: $\\int f_n=1\\not\\to0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ Riemann vs Lebesgue
    {
      num: '11.33',
      kind: 'Theorem',
      name: 'Riemann integrability is continuity almost everywhere',
      credit: 'Lebesgue, 1902',
      statement: String.raw`(a) If $f\in\mathscr R$ on $[a,b]$, then $f\in\mathscr L$ on $[a,b]$ and its Lebesgue integral equals its Riemann integral.

(b) A bounded function $f$ on $[a,b]$ is Riemann integrable if and only if it is continuous at almost every point of $[a,b]$.`,
      idea: String.raw`Take partitions $P_k$, each refining the last, with mesh $\to0$, and let $U_k$, $L_k$ be the step functions equal to $\sup f$ and $\inf f$ on each cell. Then $L_k$ increases and $U_k$ decreases, to measurable limits $L\le f\le U$, and $\int L_k=L(P_k,f)$, $\int U_k=U(P_k,f)$. Bounded convergence (11.32a) gives $\int L=\lim L(P_k,f)$ and $\int U=\lim U(P_k,f)$. So $f\in\mathscr R$ iff $\int(U-L)=0$ iff $U=L$ a.e. Off the countable set of partition points, $U(x)=L(x)$ exactly when $f$ is continuous at $x$.`,
      caption: String.raw`Dyadic partitions $P_k$ of $[0,1]$: the red steps are $U_k$ (sup on each cell), the blue steps $L_k$ (inf); orange on the axis are the cells where they differ by more than $0.05$, which shrink onto (part of) the set of discontinuities. Below: $U(P_k,f)-L(P_k,f)=\int(U_k-L_k)$. Thomae's function is discontinuous exactly at the rationals and $K_C$ exactly on the Cantor set — both null sets, so the gap tends to $0$. For the fat Cantor set the discontinuities have measure $\frac12$ and the gap never drops below $\frac12$.`,
      deps: ['pma-11.32a', 'pma-6.6', 'pma-6.1', 'pma-11.17', 'pma-11.24a'],
      see: ['pma-6.10'],
      tags: ['Riemann integral', 'Lebesgue integral', 'continuity'],
      viz(v) {
        const M = v.M;
        const which = v.select('$f=$', [{ value: 'thomae', label: 'Thomae' }, { value: 'cantor', label: '$K_C$, Cantor set' }, { value: 'fat', label: '$K_C$, fat Cantor set' }], 'thomae');
        const kS = v.slider('$P_k$: $2^k$ cells, $k$', 1, 10, 4, { int: true });
        const T = v.stage({ x: [0, 1], y: [-0.3, 1.12], height: 290, full: true, axes: 'box', xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0.5, 1] });
        const B = v.stage({ x: [0.3, 10.7], y: [-0.13, 1.08], height: 160, full: true, axes: 'box', xticks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], yticks: [0.5, 1], title: '$U(P_k,f)-L(P_k,f)$ against $k$' });
        const gcd = (a, b) => (b ? gcd(b, a % b) : a);
        const thomaeSup = (a, b) => { for (let q = 1; q <= 4096; q++) if (Math.ceil(a * q - 1e-12) <= Math.floor(b * q + 1e-12)) return 1 / q; return 0; };
        const SETS = { cantor: cantorKeep(12, false), fat: cantorKeep(12, true) };
        const meets = (I, a, b) => { let lo = 0, hi = I.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (I[m][1] < a) lo = m + 1; else hi = m; } return I[lo] && I[lo][0] <= b && I[lo][1] >= a; };
        const cellVals = (w, k) => {
          const N = 1 << k, out = [];
          for (let i = 0; i < N; i++) { const a = i / N, b = (i + 1) / N; out.push([a, b, w === 'thomae' ? thomaeSup(a, b) : (meets(SETS[w], a, b) ? 1 : 0), 0]); }
          return out;
        };
        const CACHE = {}, EPS = 0.05;
        const gaps = (w) => (CACHE[w] ||= M.range(10, 1).map((k) => cellVals(w, k).reduce((s, [a, b, U, L]) => s + (U - L) * (b - a), 0)));
        // Thomae points with small denominators, for drawing
        const TP = []; for (let q = 1; q <= 40; q++) for (let p = 0; p <= q; p++) if (gcd(p, q) === 1) TP.push([p / q, 1 / q]);
        let st = {};
        v.render(() => {
          const w = which.value, k = kS.value, C = cellVals(w, k);
          // the function
          if (w === 'thomae') { T.line(0, 0, 1, 0, { color: 'ink', width: 1.2, alpha: 0.5 }); T.dots(TP, { r: 2.2, color: 'ink' }); }
          else { for (const [a, b] of SETS[w]) T.line(a, 1, b, 1, { color: 'ink', width: 2.4, cap: 'butt' }); T.line(0, 0, 1, 0, { color: 'ink', width: 1.2, alpha: 0.5 }); }
          // U_k and L_k
          cells(T, C.map(([a, b, U]) => [a, b, U]), { color: 'red', width: 2 });
          cells(T, C.map(([a, b, , L]) => [a, b, L + 0.012]), { color: 'blue', width: 2 });
          for (const [a, b, U, L] of C) if (U - L > EPS) T.rect(a, -0.2, b, -0.12, { fill: 'orange', fillAlpha: 0.85, stroke: false });
          T.tex('\\{U_k-L_k>0.05\\}', 1, -0.16, { color: 'orange', align: 'right', baseline: 'bottom', dy: -9, size: 13 });
          const G = gaps(w), lim = w === 'fat' ? 0.5 : 0;
          B.bars(G, { color: (y, i) => (i + 1 === k ? (w === 'fat' ? 'red' : 'blue') : 'faint'), barWidth: 0.6 });
          B.hline(lim, { color: w === 'fat' ? 'red' : 'green', dash: [6, 4], width: 1.4 });
          v.legend([['ink', '$f$'], ['red', '$U_k$ (sup on cells)'], ['blue', '$L_k$ (inf on cells)'], ['orange', 'cells with $U_k-L_k>0.05$', { area: true }]]);
          st = { w, k, gap: G[k - 1], bad: C.filter(([, , U, L]) => U - L > EPS).length / C.length };
        });
        v.readout(() => {
          const s = st; if (!s.w) return '';
          const head = `$U(P_{${s.k}})-L(P_{${s.k}})=${v.fix(s.gap, 4)}$; the cells where the oscillation exceeds $0.05$ have total length $${v.fix(s.bad, 4)}$. `;
          if (s.w === 'thomae') return head + 'Discontinuities: $\\mathbb Q\\cap[0,1]$, a null set — the gap tends to $0$, $f\\in\\mathscr R$, and both integrals are $0$.';
          if (s.w === 'cantor') return head + 'Discontinuities: the Cantor set, uncountable but null — $f\\in\\mathscr R$ with integral $0$.';
          return head + 'Discontinuities: the fat Cantor set, of measure $\\tfrac12$ — the gap stays $\\ge\\tfrac12$, so $f\\notin\\mathscr R$, although $f\\in\\mathscr L$ with $\\int f=\\tfrac12$.';
        });
      },
    },
    // ------------------------------------------------------------------ L²
    {
      num: '11.34',
      kind: 'Definition',
      name: 'The class L²(μ) and its norm',
      statement: String.raw`Let $X$ be a measurable space. A complex function $f$ on $X$ belongs to $\mathscr L^2(\mu)$ if $f$ is measurable and $\int_X|f|^2\,d\mu<+\infty$; for Lebesgue measure one writes $f\in\mathscr L^2$. For $f\in\mathscr L^2(\mu)$ put
$$\|f\|=\Big(\int_X|f|^2\,d\mu\Big)^{1/2},$$
the $\mathscr L^2(\mu)$ norm of $f$.`,
      idea: String.raw`Squaring penalises large values and forgives small ones. On a set of finite measure this makes $\mathscr L^2$ smaller than $\mathscr L$: $|f|\le1+|f|^2$ (Rudin's Exercise 10). On a set of infinite measure neither class contains the other — tails are treated more leniently by $\mathscr L^2$, spikes more harshly.`,
      caption: String.raw`$f(x)=x^{-p}$. Left, near the spike on $(0,1]$: $f\in\mathscr L^2$ iff $p<\frac12$, $f\in\mathscr L$ iff $p<1$. Right, on the tail $[1,\infty)$: $f\in\mathscr L^2$ iff $p>\frac12$, $f\in\mathscr L$ iff $p>1$. The curves below are the truncated integrals of $|f|$ (blue) and $|f|^2$ (purple), which settle or diverge.`,
      deps: ['pma-11.22', 'pma-11.13'],
      see: ['rca-3.6'],
      tags: ['L2', 'function spaces'],
      viz(v) {
        const M = v.M;
        const pS = v.slider('$p$', 0.1, 1.5, 0.75, { step: 0.05 });
        const L = v.stage({ x: [0, 1], y: [-0.2, 6], height: 210, axes: 'box', weight: 1, minWidth: 340, xticks: [0, 0.5, 1], title: 'near $0$: $(0,1]$' });
        const R = v.stage({ x: [1, 20], y: [-0.06, 1.05], height: 210, axes: 'box', weight: 1, minWidth: 340, xticks: [1, 5, 10, 15, 20], title: 'the tail: $[1,\\infty)$' });
        const L2 = v.stage({ x: [-0.1, 6.1], y: [-0.4, 6], height: 170, axes: 'box', weight: 1, minWidth: 340, xticks: [[0, '1'], [2, '10²'], [4, '10⁴'], [6, '10⁶']], title: '$\\int_\\delta^1$ against $1/\\delta$ (log)' });
        const R2 = v.stage({ x: [-0.1, 6.1], y: [-0.4, 6], height: 170, axes: 'box', weight: 1, minWidth: 340, xticks: [[0, '1'], [2, '10²'], [4, '10⁴'], [6, '10⁶']], title: '$\\int_1^R$ against $R$ (log)' });
        // ∫_δ^1 x^{-s} dx and ∫_1^R x^{-s} dx in closed form
        const near = (s, d) => (Math.abs(s - 1) < 1e-9 ? -Math.log(d) : (1 - Math.pow(d, 1 - s)) / (1 - s));
        const tail = (s, R0) => (Math.abs(s - 1) < 1e-9 ? Math.log(R0) : (Math.pow(R0, 1 - s) - 1) / (1 - s));
        let st = {};
        v.render(() => {
          const p = pS.value;
          L.fn((x) => Math.pow(x, -p), { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.12, domain: [0.001, 1] });
          L.fn((x) => Math.pow(x, -2 * p), { color: 'purple', width: 2, domain: [0.001, 1] });
          R.fn((x) => Math.pow(x, -p), { color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.12 });
          R.fn((x) => Math.pow(x, -2 * p), { color: 'purple', width: 2 });
          const ts = M.linspace(0, 6, 200);
          const cap = 6;
          for (const [S, F] of [[L2, near], [R2, tail]]) {
            const c1 = ts.map((t) => [t, F(p, S === L2 ? Math.pow(10, -t) : Math.pow(10, t))]);
            const c2 = ts.map((t) => [t, F(2 * p, S === L2 ? Math.pow(10, -t) : Math.pow(10, t))]);
            S.path(c1.map(([t, y]) => [t, Math.min(y, cap * 1.2)]), { color: 'blue', width: 2 });
            S.path(c2.map(([t, y]) => [t, Math.min(y, cap * 1.2)]), { color: 'purple', width: 2 });
          }
          const inL = { near: p < 1, tail: p > 1 }, inL2 = { near: 2 * p < 1, tail: 2 * p > 1 };
          const tag = (a, b) => `${a ? 'f ∈ 𝓛' : 'f ∉ 𝓛'},  ${b ? 'f ∈ 𝓛²' : 'f ∉ 𝓛²'}`;
          L.corner(tag(inL.near, inL2.near), 'tr', { color: inL2.near ? 'green' : 'red', weight: 600 });
          R.corner(tag(inL.tail, inL2.tail), 'tr', { color: inL2.tail ? 'green' : 'red', weight: 600 });
          v.legend([['blue', '$|f|=x^{-p}$ and its integral'], ['purple', '$|f|^2=x^{-2p}$ and its integral']]);
          st = { p, inL, inL2 };
        });
        v.readout(() => {
          const s = st; if (s.p == null) return '';
          const fin = (q, region) => (region === 'near' ? (q < 1 ? `${v.fix(1 / (1 - q), 3)}` : '\\infty') : (q > 1 ? `${v.fix(1 / (q - 1), 3)}` : '\\infty'));
          return `$p=${v.fix(s.p, 2)}$: $\\;\\int_0^1|f|=${fin(s.p, 'near')}$, $\\int_0^1|f|^2=${fin(2 * s.p, 'near')}$; $\\;\\int_1^\\infty|f|=${fin(s.p, 'tail')}$, $\\int_1^\\infty|f|^2=${fin(2 * s.p, 'tail')}$.` + (s.p > 0.5 && s.p <= 1 ? ' On the tail $f\\in\\mathscr L^2$ but $f\\notin\\mathscr L$.' : s.p < 0.5 ? ' Near $0$, $\\mathscr L^2\\subset\\mathscr L$ (finite measure).' : '');
        });
      },
    },
    {
      num: '11.35',
      kind: 'Theorem',
      name: 'Schwarz inequality in L²',
      credit: 'Cauchy & Schwarz, 1821',
      statement: String.raw`If $f\in\mathscr L^2(\mu)$ and $g\in\mathscr L^2(\mu)$, then $fg\in\mathscr L(\mu)$ and
$$\int|fg|\,d\mu\le\|f\|\,\|g\| .$$`,
      idea: String.raw`For every real $\lambda$, $0\le\int(|f|+\lambda|g|)^2\,d\mu=\|f\|^2+2\lambda\int|fg|\,d\mu+\lambda^2\|g\|^2$ (the middle integral is finite since $2|fg|\le|f|^2+|g|^2$). A quadratic in $\lambda$ that never goes negative has a nonpositive discriminant: $\big(\int|fg|\big)^2\le\|f\|^2\|g\|^2$.`,
      caption: String.raw`Left: $|f|$, $|g|$ and the integrand $(|f|+\lambda|g|)^2$ for the value $\lambda$ chosen on the right. Right: the quadratic $Q(\lambda)=\int(|f|+\lambda|g|)^2$; drag the point along it. It stays $\ge0$, so its discriminant is $\le0$ — which is Schwarz. Slide $t$ toward $1$ to make $|g|$ proportional to $|f|$: the parabola touches $0$ and equality holds.`,
      deps: ['pma-11.34', 'pma-11.27', 'pma-1.35'],
      see: ['rca-3.5', 'rca-4.2'],
      tags: ['L2', 'inequalities'],
      viz(v) {
        const M = v.M;
        const tS = v.slider('$t$ (toward $|g|\\propto|f|$)', 0, 1, 0.3, { step: 0.01 });
        const f = (x) => 0.9 * Math.sin(Math.PI * x) + 0.35 * Math.sin(5 * Math.PI * x);
        const g0 = (x) => 0.8 - 0.7 * x + 0.3 * Math.cos(7 * x);
        const L = v.stage({ x: [0, 1], y: [-0.1, 3.6], height: 300, axes: 'box', weight: 1, xticks: [0.5, 1], title: 'integrands on $[0,1]$' });
        const R = v.stage({ x: [-3, 1.2], y: [-0.1, 1.6], height: 300, axes: true, weight: 1, title: '$Q(\\lambda)=\\int(|f|+\\lambda|g|)^2$' });
        const hl = R.handle(-0.6, 0.5, { color: 'gold', label: 'λ', constrain: (x) => [M.clamp(x, -2.95, 1.15), 0] });
        let st = {};
        v.render(() => {
          const t = tS.value, g = (x) => (1 - t) * Math.abs(g0(x)) + t * 1.4 * Math.abs(f(x));
          const af = (x) => Math.abs(f(x));
          const A = M.integrate((x) => af(x) ** 2, 0, 1, 800), C = M.integrate((x) => g(x) ** 2, 0, 1, 800), Bv = M.integrate((x) => af(x) * g(x), 0, 1, 800);
          const Q = (l) => A + 2 * l * Bv + l * l * C;
          const lmin = -Bv / C, qmin = Q(lmin);
          R.setView(null, [-0.1 * Math.max(1.2, A * 1.6), Math.max(1.2, A * 1.6)]);
          hl.y = Q(hl.x);
          R.fn(Q, { color: 'ink', width: 2.2 });
          R.hline(qmin, { color: 'green', width: 1.2, dash: [4, 4] });
          R.dot(lmin, qmin, { color: 'green', r: 5, label: 'min ≥ 0', labelPos: 's' });
          const l = hl.x, integrand = (x) => (af(x) + l * g(x)) ** 2;
          const ymax = Math.max(...M.linspace(0, 1, 200).map((x) => Math.max(integrand(x), af(x), g(x))));
          L.setView(null, [-0.08 * ymax * 1.1, ymax * 1.1]);
          L.fn(integrand, { color: 'gold', width: 1.6, fill: 'gold', fillAlpha: 0.22 });
          L.fn(af, { color: 'blue', width: 2.2 }); L.fn(g, { color: 'red', width: 2.2 });
          v.legend([['blue', '$|f|$'], ['red', '$|g|$'], ['gold', '$(|f|+\\lambda|g|)^2$, area $Q(\\lambda)$', { area: true }]]);
          st = { A, C, Bv, l, Ql: Q(l), qmin };
        });
        v.readout(() => {
          const s = st; if (s.A == null) return '';
          return `$\\int|fg|=${v.fix(s.Bv, 4)}\\;\\le\\;\\|f\\|\\,\\|g\\|=${v.fix(Math.sqrt(s.A * s.C), 4)}$; $\\;Q(${v.fix(s.l, 2)})=${v.fix(s.Ql, 4)}$, $\\min Q=\\frac{\\|f\\|^2\\|g\\|^2-(\\int|fg|)^2}{\\|g\\|^2}=${v.fix(s.qmin, 5)}\\ge0$.`;
        });
      },
    },
    {
      num: '11.36',
      kind: 'Theorem',
      name: 'Triangle inequality in L²',
      statement: String.raw`If $f\in\mathscr L^2(\mu)$ and $g\in\mathscr L^2(\mu)$, then $f+g\in\mathscr L^2(\mu)$ and
$$\|f+g\|\le\|f\|+\|g\| .$$
Consequently $\|f-g\|$ behaves like a distance on $\mathscr L^2(\mu)$, once functions that agree almost everywhere are identified (Rudin's Remarks 11.37).`,
      idea: String.raw`$|f+g|^2\le(|f|+|g|)^2$, so expanding and using Schwarz (11.35):
$$\|f+g\|^2\le\|f\|^2+2\int|fg|+\|g\|^2\le\|f\|^2+2\|f\|\|g\|+\|g\|^2=(\|f\|+\|g\|)^2 .$$`,
      caption: String.raw`Two functions $f,g$ span a plane inside $\mathscr L^2$, and that plane is an honest Euclidean plane: right, $f$, $g$ and $f+g$ are drawn as vectors with their true lengths and the angle $\theta$ given by $\cos\theta=\int fg/(\|f\|\|g\|)$. The triangle inequality is literally the triangle. Drag the phase of $g$; equality needs $\theta=0$, i.e. $g$ a nonnegative multiple of $f$.`,
      deps: ['pma-11.35'],
      see: ['rca-3.9', 'rca-4.3'],
      tags: ['L2', 'inequalities', 'metric'],
      viz(v) {
        const M = v.M;
        const phS = v.slider('phase of $g$', 0, 2 * Math.PI, 2.1, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const f = (x) => Math.sin(2 * Math.PI * x) + 0.25;
        const L = v.stage({ x: [0, 1], y: [-2.2, 2.2], height: 300, axes: true, weight: 1, xticks: [0.25, 0.5, 0.75, 1], title: '$f$, $g$ and $f+g$ on $[0,1]$' });
        const R = v.stage({ x: [-1.5, 2.2], y: [-1.6, 1.6], equal: true, height: 300, axes: false, weight: 1, title: 'the plane spanned by $f$ and $g$' });
        let st = {};
        v.render(() => {
          const ph = phS.value, g = (x) => 0.8 * Math.sin(2 * Math.PI * x + ph) + 0.15;
          const ip = (a, b) => M.integrate((x) => a(x) * b(x), 0, 1, 600);
          const nf = Math.sqrt(ip(f, f)), ng = Math.sqrt(ip(g, g)), fg = ip(f, g), cos = fg / (nf * ng), th = Math.acos(M.clamp(cos, -1, 1));
          const s = (x) => f(x) + g(x), ns = Math.sqrt(ip(s, s));
          L.fn(f, { color: 'blue', width: 2.2 }); L.fn(g, { color: 'red', width: 2.2 }); L.fn(s, { color: 'purple', width: 2.4 });
          const F = [nf, 0], G = [ng * Math.cos(th), ng * Math.sin(th)], Ssum = [F[0] + G[0], F[1] + G[1]];
          const bx = [0, F[0], G[0], Ssum[0]], by = [0, F[1], G[1], Ssum[1]];
          const span = Math.max(Math.max(...bx) - Math.min(...bx), Math.max(...by) - Math.min(...by), 0.3), pad = 0.28 * span;
          R.setView([Math.min(...bx) - pad, Math.max(...bx) + pad], [Math.min(...by) - pad, Math.max(...by) + pad]);
          R.poly([[0, 0], F, Ssum], { fill: 'purple', fillAlpha: 0.08, stroke: false });
          R.arrow(0, 0, F[0], F[1], { color: 'blue', width: 2.6 });
          R.arrow(F[0], F[1], Ssum[0], Ssum[1], { color: 'red', width: 2.6 });
          R.arrow(0, 0, G[0], G[1], { color: 'red', width: 1.4, alpha: 0.4, dash: [4, 4] });
          R.arrow(0, 0, Ssum[0], Ssum[1], { color: 'purple', width: 2.6 });
          const ra = 0.18 * span;
          R.curve((t) => [ra * Math.cos(t), ra * Math.sin(t)], 0, th, { color: 'muted', width: 1.2 });
          R.tex('\\theta', 1.35 * ra * Math.cos(th / 2), 1.35 * ra * Math.sin(th / 2), { color: 'muted', size: 14 });
          const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L0 = Math.hypot(dx, dy) || 1; return [-dy / L0, dx / L0]; };
          const off = 0.07 * span, nS0 = nrm([0, 0], Ssum), ng2 = nrm(F, Ssum);
          R.tex('f', F[0] / 2, -off, { color: 'blue' });
          R.tex('g', (F[0] + Ssum[0]) / 2 - ng2[0] * off, (F[1] + Ssum[1]) / 2 - ng2[1] * off, { color: 'red' });
          R.tex('f+g', Ssum[0] / 2 - nS0[0] * off * 1.6, Ssum[1] / 2 - nS0[1] * off * 1.6, { color: 'purple' });
          R.dot(0, 0, { r: 3, color: 'ink' });
          v.legend([['blue', '$f$'], ['red', '$g$'], ['purple', '$f+g$']]);
          st = { nf, ng, ns, th };
        });
        v.readout(() => {
          const s = st; if (s.nf == null) return '';
          return `$\\|f+g\\|=${v.fix(s.ns, 4)}\\;\\le\\;\\|f\\|+\\|g\\|=${v.fix(s.nf, 4)}+${v.fix(s.ng, 4)}=${v.fix(s.nf + s.ng, 4)}$, $\\;\\theta=${v.fix(s.th * 180 / Math.PI, 1)}^\\circ$.`;
        });
      },
    },
  ],
};
