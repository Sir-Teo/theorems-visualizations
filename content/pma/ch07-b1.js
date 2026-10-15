// Rudin, Principles of Mathematical Analysis — Chapter 7 (part b1): 7.18–7.25
// A nowhere differentiable function, pointwise/uniform boundedness, equicontinuity,
// the diagonal process and the Arzelà–Ascoli theorem. The chapter title lives in ch07.js.

/** Largest oscillation (max − min) over all windows of w+1 consecutive samples of a.
 *  Returns {val, lo, hi}: lo/hi are the sample indices of the min and max in the worst window. */
function windowOsc(a, w) {
  const n = a.length;
  w = Math.max(0, Math.min(n - 1, w | 0));
  const qx = new Int32Array(n), qn = new Int32Array(n);
  let hx = 0, tx = 0, hn = 0, tn = 0, best = -1, bi = 0, bj = 0;
  for (let i = 0; i < n; i++) {
    while (tx > hx && a[qx[tx - 1]] <= a[i]) tx--; qx[tx++] = i;
    while (tn > hn && a[qn[tn - 1]] >= a[i]) tn--; qn[tn++] = i;
    if (qx[hx] < i - w) hx++;
    if (qn[hn] < i - w) hn++;
    if (i >= w) { const d = a[qx[hx]] - a[qn[hn]]; if (d > best) { best = d; bi = qn[hn]; bj = qx[hx]; } }
  }
  return { val: Math.max(0, best), lo: bi, hi: bj };
}
/** Largest δ with |a_i − a_j| < eps whenever |i − j|·h < δ (sampled modulus of continuity, inverted). */
function deltaFor(a, eps, h) {
  const n = a.length;
  if (windowOsc(a, n - 1).val < eps) return (n - 1) * h;
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (windowOsc(a, mid).val < eps) lo = mid; else hi = mid; }
  return hi * h;
}
/** Window size (in samples) for "|x − y| < δ" on a grid of spacing h. */
const winFor = (delta, h) => Math.max(0, Math.ceil(delta / h - 1e-9) - 1);

export default {
  collection: 'pma',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.18
    {
      num: '7.18',
      kind: 'Theorem',
      name: 'A continuous, nowhere differentiable function',
      credit: 'Weierstrass, 1872',
      statement: String.raw`There is a real-valued continuous function on $\R$ which fails to be differentiable at every point of $\R$. Rudin's example: let $\varphi(x)=|x|$ for $-1\le x\le 1$, extend $\varphi$ to all of $\R$ by $\varphi(x+2)=\varphi(x)$, and set
$$f(x)=\sum_{n=0}^{\infty}\Big(\tfrac34\Big)^{n}\varphi(4^{n}x).$$`,
      idea: String.raw`Since $0\le\varphi\le1$, the Weierstrass M-test (7.10) makes the series converge uniformly, so $f$ is continuous (7.12). Fix $x$ and an integer $m$, and step by $\delta_m=\pm\tfrac12 4^{-m}$, the sign chosen so that no integer lies strictly between $4^m x$ and $4^m(x+\delta_m)$. For $n>m$, $4^n\delta_m$ is an even integer, so those terms do not move at all; the $m$-th term moves with slope exactly $\pm4^m$, i.e. contributes $3^m$ after the weight $(3/4)^m$; the earlier terms contribute at most $3^n$ each because $|\varphi(s)-\varphi(t)|\le|s-t|$. Hence
$$\Big|\frac{f(x+\delta_m)-f(x)}{\delta_m}\Big|\ \ge\ 3^m-\sum_{n<m}3^n=\frac{3^m+1}{2}\to\infty,$$
while $\delta_m\to0$, so $f'(x)$ cannot exist.`,
      caption: String.raw`Drag $x$ along the partial sum $f_N$ (top). Lower left: a zoom to scale $4^{-m}$ around $x$ with the secant over $\delta_m$. Lower right: the difference quotients $|\Delta_m|$ on a log scale against Rudin's lower bound $(3^m+1)/2$. For $m\le N$ every bar clears the bound, and the quotient is exactly that of $f$ itself. For $m>N$ the bars stall under the Lipschitz constant of the finite sum: each $f_N$ is Lipschitz, and only the full series is nowhere differentiable.`,
      deps: ['pma-7.10', 'pma-7.12', 'pma-5.1'],
      tags: ['differentiation', 'uniform convergence', 'counterexample'],
      viz(v) {
        const M = v.M;
        const phi = (x) => Math.abs(x - 2 * Math.round(x / 2));
        const F = (x, N) => { let s = 0, a = 1, b = 1; for (let n = 0; n <= N; n++) { s += a * phi(b * x); a *= 0.75; b *= 4; } return s; };
        const stepFor = (x, m) => (M.fract(Math.pow(4, m) * x) < 0.5 ? 1 : -1) * 0.5 * Math.pow(4, -m);
        const Nsl = v.slider('terms $N$', 0, 12, 9, { int: true });
        const msl = v.slider('scale $m$', 0, 9, 3, { int: true });
        const A = v.stage({ x: [-0.03, 2.03], y: [-0.18, 3.4], height: 220, full: true, title: 'partial sum $f_N(x)=\\sum_{n\\le N}(3/4)^n\\varphi(4^n x)$ over one period $[0,2]$' });
        const B = v.stage({ x: [0, 1], y: [0, 1], height: 270, axes: false, title: 'zoom: width $2.5\\cdot4^{-m}$ around $x$, secant over $\\delta_m$' });
        const LOGT = [[0, '1'], [1, '10'], [2, '10²'], [3, '10³'], [4, '10⁴'], [5, '10⁵'], [6, '10⁶']];
        const C = v.stage({ x: [-0.7, 10.7], y: [-1.25, 6.75], height: 270, axes: 'box', xticks: M.range(11), yticks: LOGT, title: '$|\\Delta_m|$ on a log scale, $m=0,\\dots,10$' });
        const p = A.handle(0.6180, F(0.6180, 9), { color: 'accent', label: 'x', constrain: (x) => { const xx = M.clamp(x, 0.01, 1.99); return [xx, F(xx, Nsl.value)]; } });
        let st = null;
        v.render(() => {
          const N = Nsl.value, m = msl.value, x = p.x;
          p.y = F(x, N);
          // --- top: the partial sum, with the zoom window marked
          const w = 1.25 * Math.pow(4, -m);
          A.vband(x - w, x + w, { color: 'orange', alpha: 0.22 });
          A.fn((t) => F(t, N), { domain: [0, 2], color: 'ink', width: 1.3, n: 2600 });
          // --- zoom panel
          const d = stepFor(x, m), f0 = F(x, N), f1 = F(x + d, N), slope = (f1 - f0) / d;
          const xs = M.linspace(x - w, x + w, 900), ys = xs.map((t) => F(t, N));
          let lo = Math.min(...ys), hi = Math.max(...ys); if (hi - lo < 1e-12) { lo -= 1e-3; hi += 1e-3; }
          const pad = (hi - lo) * 0.16;
          B.setView([x - w, x + w], [lo - 2.3 * pad, hi + pad]);
          B.vband(Math.min(x, x + d), Math.max(x, x + d), { color: 'orange', alpha: 0.12 });
          B.path(xs.map((t, i) => [t, ys[i]]), { color: 'ink', width: 1.7 });
          B.line(x - w, f0 - slope * w, x + w, f0 + slope * w, { color: 'gold', width: 1.3, dash: [5, 4] });
          B.line(x, f0, x + d, f1, { color: 'gold', width: 3.2 });
          B.dot(x + d, f1, { color: 'gold', r: 4.5 });
          B.dot(x, f0, { color: 'accent', r: 5.5, label: 'x', labelPos: d > 0 ? 'w' : 'e' });
          B.measure(Math.min(x, x + d), lo - 1.7 * pad, Math.max(x, x + d), lo - 1.7 * pad, 'δₘ', { color: 'orange', offset: -12 });
          B.corner(`secant slope ${v.fmt(slope, 4)}`, 'tr', { color: 'gold', weight: 600 });
          // --- quotient bars
          const q = M.range(11).map((k) => { const dk = stepFor(x, k); return Math.abs((F(x + dk, N) - f0) / dk); });
          const lg = (y) => Math.max(-0.55, Math.log10(Math.max(y, 1e-9)));
          const lip = (Math.pow(3, N + 1) - 1) / 2;
          C.hline(Math.log10(lip), { color: 'orange', width: 1.6, dash: [6, 4] });
          C.text(`Lip(f_N) = ${v.fmt(lip, 4)}`, 10.55, Math.log10(lip), { color: 'orange', dy: -10, size: 11.5, align: 'right' });
          q.forEach((y, k) => {
            const col = k === m ? 'accent' : k <= N ? 'gold' : 'faint';
            C.rect(k - 0.32, -0.6, k + 0.32, lg(y), { fill: col, fillAlpha: k <= N ? 0.8 : 0.55, stroke: false });
          });
          const bnd = M.range(11).map((k) => [k, Math.log10((Math.pow(3, k) + 1) / 2)]);
          C.path(bnd, { color: 'green', width: 2 });
          C.dots(bnd, { color: 'green', r: 3.2 });
          st = { x, m, N, d, q: q[m], bound: (Math.pow(3, m) + 1) / 2, lip };
        });
        v.legend([['ink', '$f_N$'], ['gold', '$|\\Delta_m|=|f_N(x+\\delta_m)-f_N(x)|/|\\delta_m|$', { area: true }], ['green', 'bound $(3^m+1)/2$ for $f$'], ['orange', 'Lipschitz constant of $f_N$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const ok = s.m <= s.N;
          return `$x=${v.fix(s.x, 4)}$, $\\delta_m=${s.d > 0 ? '+' : '-'}\\tfrac12\\cdot4^{-${s.m}}$: $\\;|\\Delta_m| = ${v.fmt(s.q, 5)}$ ` +
            (ok ? `$\\ge (3^{${s.m}}+1)/2 = ${v.fmt(s.bound, 5)}$ — exact for $f$, since terms $n>m$ do not move.`
              : `but $m>N$: the finite sum $f_N$ is Lipschitz with constant $${v.fmt(s.lip, 5)}$, so its quotients stay bounded.`);
        });
      },
    },

    // ------------------------------------------------------------------ 7.19
    {
      num: '7.19',
      kind: 'Definition',
      name: 'Pointwise bounded and uniformly bounded sequences',
      statement: String.raw`Let $\{f_n\}$ be a sequence of (real or complex) functions on a set $E$.
(a) $\{f_n\}$ is **pointwise bounded** on $E$ if for each $x\in E$ the sequence of numbers $\{f_n(x)\}$ is bounded; equivalently, some finite-valued $\phi$ on $E$ satisfies $|f_n(x)|<\phi(x)$ for all $x\in E$ and all $n$.
(b) $\{f_n\}$ is **uniformly bounded** on $E$ if a single number $M$ satisfies $|f_n(x)|<M$ for all $x\in E$ and all $n$.`,
      idea: String.raw`Uniform boundedness implies pointwise boundedness, not conversely: a pointwise bound $\phi(x)$ may be forced to blow up somewhere. Neither property, nor both together, gives convergent subsequences: $\sin nx$ is uniformly bounded but no subsequence converges at every point of $[0,2\pi]$ (Rudin's Example 7.20). Equicontinuity (7.22) is the missing ingredient in the Arzelà–Ascoli theorem (7.25).`,
      caption: String.raw`Drag $x_0$. Left: the graphs of $f_1,\dots,f_N$ and their envelope $\max_{n\le N}|f_n|$. Right: the numbers $|f_n(x_0)|$, the pointwise bound $\phi(x_0)=\sup_n|f_n(x_0)|$ (green) and the best uniform bound so far, $\max_{n\le N}\sup_x|f_n|$ (orange). For $n^2xe^{-nx}$ the green line is finite at each $x_0$ but the orange one grows with $N$. For $nx^n$ the pointwise bound itself is infinite at $x_0=1$.`,
      deps: [],
      see: ['rca-5.8', 'fa-2.5'],
      tags: ['boundedness', 'sequences of functions'],
      viz(v) {
        const M = v.M;
        const FAM = {
          pw: { label: '$n^2x\\,e^{-nx}$ on $[0,1]$', dom: [0, 1], f: (n, x) => n * n * x * Math.exp(-n * x), x0: 0.22 },
          sin: { label: '$\\sin nx$ on $[0,2\\pi]$', dom: [0, 2 * Math.PI], f: (n, x) => Math.sin(n * x), x0: 1.3 },
          nxn: { label: '$n\\,x^{n}$ on $[0,1]$', dom: [0, 1], f: (n, x) => n * Math.pow(x, n), x0: 0.9 },
        };
        const fam = v.select('$f_n(x)=$', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'pw');
        const Nsl = v.slider('show $n\\le N$', 1, 40, 20, { int: true });
        const L = v.stage({ x: [0, 1], y: [-0.5, 8], height: 300, title: '$f_1,\\dots,f_N$ and the envelope $\\max_{n\\le N}|f_n|$' });
        const R = v.stage({ x: [0, 21], y: [0, 2], height: 300, axes: 'box', title: 'the numbers $|f_n(x_0)|$, $n=1,\\dots,N$' });
        const h = L.handle(0.22, 0, { color: 'accent', label: 'x₀', constrain: (x) => { const F = FAM[fam.value]; return [M.clamp(x, F.dom[0], F.dom[1]), 0]; } });
        h.labelPos = 'e';
        let last = null, st = null;
        const supX = (F, n) => { let s = 0; for (const x of M.linspace(F.dom[0], F.dom[1], 4001)) s = Math.max(s, Math.abs(F.f(n, x))); return s; };
        const supN = (F, x) => { if (fam.value === 'nxn' && x >= 1 - 1e-12) return Infinity; let s = 0; for (let n = 1; n <= 5000; n++) s = Math.max(s, Math.abs(F.f(n, x))); return s; };
        v.render(() => {
          const F = FAM[fam.value], N = Nsl.value;
          if (last !== fam.value) { last = fam.value; h.x = F.x0; }
          const xs = M.linspace(F.dom[0], F.dom[1], 700);
          const env = xs.map((x) => { let s = 0; for (let n = 1; n <= N; n++) s = Math.max(s, Math.abs(F.f(n, x))); return s; });
          const top = Math.max(...env);
          const ylo = fam.value === 'sin' ? -1.25 : -0.13 * top;
          L.setView([F.dom[0] - 0.1 * (F.dom[1] - F.dom[0]), F.dom[1] + 0.03 * (F.dom[1] - F.dom[0])], [ylo, top * 1.1]);
          L.path(xs.map((x, i) => [x, env[i]]).concat([[F.dom[1], 0], [F.dom[0], 0]]), { fill: 'orange', fillAlpha: 0.13, stroke: false, close: true });
          for (let n = 1; n <= N; n++) L.fn((x) => F.f(n, x), { domain: F.dom, color: v.mix('faint', 'accent', n / N), width: n === N ? 2.2 : 1.1, n: 600 });
          L.path(xs.map((x, i) => [x, env[i]]), { color: 'orange', width: 1.6 });
          L.vline(h.x, { color: 'accent', width: 1, dash: [4, 4] });
          // right: the numbers |f_n(x0)|
          const x0 = h.x;
          const vals = M.range(N, 1).map((n) => Math.abs(F.f(n, x0)));
          const phi = supN(F, x0), MN = supX(F, N) > 0 ? Math.max(...M.range(N, 1).map((n) => supX(F, n))) : 0;
          const yTop = Math.max(...vals, isFinite(phi) ? phi : 0, MN, 1e-3) * 1.14;
          R.setView([0, N + 1], [-0.08 * yTop, yTop]);
          R.bars(vals, { x0: 1, color: 'accent', fillAlpha: 0.7, barWidth: N > 25 ? 0.75 : 0.6 });
          R.hline(MN, { color: 'orange', width: 1.8, dash: [6, 4] });
          R.text(`max sup|fₙ| = ${v.fmt(MN, 3)}`, N + 0.6, MN, { align: 'right', dy: -9, color: 'orange', size: 11.5 });
          if (isFinite(phi)) {
            R.hline(phi, { color: 'green', width: 2 });
            R.text(`φ(x₀) = ${v.fmt(phi, 3)}`, 0.4, phi, { dy: phi > MN * 0.92 && phi < MN * 1.08 ? 10 : -9, color: 'green', size: 11.5 });
          } else R.corner('φ(1) = ∞: not pointwise bounded', 'tl', { color: 'red', weight: 600 });
          st = { x0, phi, MN, N, fam: fam.value };
        });
        v.legend([['accent', '$f_n$ (darker = larger $n$)'], ['orange', 'envelope / best uniform bound', { area: true }], ['green', 'pointwise bound $\\phi(x_0)=\\sup_n|f_n(x_0)|$']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$x_0=${v.fix(s.x0, 3)}$: $\\phi(x_0)=${isFinite(s.phi) ? v.fmt(s.phi, 4) : '\\infty'}$, $\\;\\max_{n\\le ${s.N}}\\sup_x|f_n| = ${v.fmt(s.MN, 4)}$. `;
          if (s.fam === 'pw') return head + 'Pointwise bounded ($\\phi(x)\\approx 4e^{-2}/x$ is finite for each $x$), but $\\sup_x|f_n| = n/e\\to\\infty$: **not uniformly bounded**.';
          if (s.fam === 'sin') return head + '**Uniformly bounded** by $M=1$ — yet no subsequence converges at every point (Example 7.20).';
          return head + 'Bounded at every $x_0<1$, but $f_n(1)=n$: **not even pointwise bounded** on $[0,1]$.';
        });
      },
    },

    // ------------------------------------------------------------------ 7.22
    {
      num: '7.22',
      kind: 'Definition',
      name: 'Equicontinuous family',
      credit: 'Ascoli, 1884',
      statement: String.raw`A family $\mathscr F$ of complex functions defined on a set $E$ in a metric space $X$ is **equicontinuous** on $E$ if for every $\eps>0$ there is a $\delta>0$ such that
$$|f(x)-f(y)|<\eps\quad\text{whenever } x,y\in E,\ d(x,y)<\delta,\ f\in\mathscr F .$$
So a single $\delta$ must serve every point and every member of the family at once.`,
      idea: String.raw`Each member of an equicontinuous family is uniformly continuous (4.18), with one common modulus of continuity. Equicontinuity fails when members oscillate faster and faster ($\sin nx$, Example 7.20) or steepen near a point ($x^n$ near $1$). Bounded slopes are sufficient but not necessary: $\sqrt{x+1/n}$ has slopes $\tfrac12\sqrt n\to\infty$ at $0$, yet $\delta=\eps^2$ works for every $n$ because $|\sqrt a-\sqrt b|\le\sqrt{|a-b|}$.`,
      caption: String.raw`Pick $\eps$ and try a $\delta$. The bars show, for each member, the worst change $\omega_n(\delta)=\sup_{|x-y|<\delta}|f_n(x)-f_n(y)|$ (computed on a fine grid); red bars break the $\eps$-line. On top, the worst member is drawn thick and its worst pair $x,y$ is marked. The button picks the largest $\delta$ that works for all $n\le N$. For $\sqrt{x+1/n}$ that $\delta$ never drops below $\eps^2$, however large $N$ is; for $\sin nx$ and $x^n$ it shrinks to $0$ as $N$ grows.`,
      deps: ['pma-4.18'],
      see: ['fa-2.4', 'fa-2.5'],
      tags: ['equicontinuity', 'uniform continuity'],
      viz(v) {
        const M = v.M;
        const FAM = {
          sq: { label: '$\\sqrt{x+1/n}$', dom: [0, 1], f: (n, x) => Math.sqrt(x + 1 / n), y: [-0.05, 1.55] },
          sin: { label: '$\\sin nx$', dom: [0, Math.PI], f: (n, x) => Math.sin(n * x), y: [-1.3, 1.3] },
          pow: { label: '$x^n$', dom: [0, 1], f: (n, x) => Math.pow(x, n), y: [-0.08, 1.12] },
        };
        const fam = v.select('$f_n(x)=$', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'sin');
        const eps = v.slider('$\\varepsilon$', 0.05, 1, 0.3, { step: 0.01 });
        const del = v.slider('$\\delta$', 0.002, 1, 0.08, { log: true, fmt: (x) => v.fmt(x, 3) });
        const Nsl = v.slider('family $n\\le N$', 4, 60, 30, { int: true });
        const G = 1500;
        let cache = {};
        function data() {
          const key = `${fam.value}|${Nsl.value}`;
          if (cache.key !== key) {
            const F = FAM[fam.value], xs = M.linspace(F.dom[0], F.dom[1], G);
            cache = { key, xs, h: (F.dom[1] - F.dom[0]) / (G - 1), vals: M.range(Nsl.value, 1).map((n) => Float64Array.from(xs, (x) => F.f(n, x))) };
          }
          const ek = eps.value;
          if (cache.eps !== ek) { cache.eps = ek; cache.dstar = Math.min(...cache.vals.map((a) => deltaFor(a, ek, cache.h))); }
          return cache;
        }
        v.button('largest common $\\delta$', () => { const c = data(); del.set(M.clamp(c.dstar, 0.002, 1)); });
        const T = v.stage({ x: [0, 1], y: [-0.1, 1.5], height: 270, full: true, title: 'some members of the family; thick: the member with the largest $\\omega_n(\\delta)$' });
        const B = v.stage({ x: [0, 31], y: [0, 2.1], height: 190, axes: 'box', full: true, title: '$\\omega_n(\\delta)=\\sup_{|x-y|<\\delta}|f_n(x)-f_n(y)|$ for each member, against $\\varepsilon$' });
        let st = null;
        v.render(() => {
          const F = FAM[fam.value], N = Nsl.value, e = eps.value, dl = del.value;
          const c = data();
          T.setView([F.dom[0] - 0.06 * (F.dom[1] - F.dom[0]), F.dom[1] + 0.02 * (F.dom[1] - F.dom[0])], F.y);
          const w = winFor(dl, c.h);
          const osc = c.vals.map((a) => windowOsc(a, w));
          const worst = M.argmax(osc, (o) => o.val);
          const stride = Math.max(1, Math.ceil(N / 8));
          for (let i = 0; i < N; i += stride) if (i !== worst) T.fn((x) => F.f(i + 1, x), { domain: F.dom, color: v.mix('faint', 'accent', 0.25 + 0.5 * (i + 1) / N), width: 1.1, alpha: 0.75, n: 900 });
          const bad = osc[worst].val >= e;
          const col = bad ? 'red' : 'green';
          T.fn((x) => F.f(worst + 1, x), { domain: F.dom, color: col, width: 2.6, n: 1400 });
          const o = osc[worst], xa = c.xs[o.lo], xb = c.xs[o.hi], ya = c.vals[worst][o.lo], yb = c.vals[worst][o.hi];
          T.vband(Math.min(xa, xb), Math.min(xa, xb) + dl, { color: 'orange', alpha: 0.16 });
          T.line(xa, ya, xb, yb, { color: col, width: 1, dash: [3, 3] });
          T.dot(xa, ya, { color: col, r: 4.5 }); T.dot(xb, yb, { color: col, r: 4.5 });
          T.measure(Math.max(xa, xb) + 0.025 * (F.dom[1] - F.dom[0]), ya, Math.max(xa, xb) + 0.025 * (F.dom[1] - F.dom[0]), yb, `${v.fmt(o.val, 2)}`, { color: col, offset: 16, math: false, size: 11.5 });
          T.corner(`worst: n = ${worst + 1}`, 'tr', { color: col, weight: 600 });
          // bars
          const top = Math.max(e * 1.35, ...osc.map((q) => q.val)) * 1.1;
          B.setView([0, N + 1], [-0.1 * top, top]);
          B.bars(osc.map((q) => q.val), { x0: 1, color: (val) => (val >= e ? 'red' : 'green'), fillAlpha: 0.7, barWidth: 0.68 });
          B.hline(e, { color: 'accent', width: 2 });
          B.text('ε', N + 0.7, e, { color: 'accent', math: true, dy: -10, align: 'right' });
          const nb = osc.filter((q) => q.val >= e).length;
          st = { nb, N, dstar: c.dstar, dl, worst: worst + 1, wv: o.val, e };
        });
        v.legend([['green', '$\\omega_n(\\delta)<\\varepsilon$', { area: true }], ['red', '$\\omega_n(\\delta)\\ge\\varepsilon$', { area: true }], ['orange', 'a window of width $\\delta$', { area: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = s.nb === 0 ? `$\\delta=${v.fmt(s.dl, 3)}$ works for **every** $n\\le ${s.N}$.` : `$\\delta=${v.fmt(s.dl, 3)}$ fails for ${s.nb} of the ${s.N} members (worst $n=${s.worst}$, change $${v.fmt(s.wv, 3)}\\ge\\varepsilon$).`;
          return `${head} Largest $\\delta$ that works for all $n\\le ${s.N}$: $\\delta^*=${v.fmt(s.dstar, 3)}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.23
    {
      num: '7.23',
      kind: 'Theorem',
      name: 'Diagonal process on a countable set',
      statement: String.raw`Let $\{f_n\}$ be a sequence of complex functions that is pointwise bounded on a countable set $E$. Then some subsequence $\{f_{n_k}\}$ has the property that $\{f_{n_k}(x)\}$ converges for every $x\in E$.`,
      idea: String.raw`List $E=\{x_1,x_2,\dots\}$. Because $\{f_n(x_1)\}$ is bounded, some subsequence $S_1$ makes it converge (3.6). Inside $S_1$ pick a further subsequence $S_2$ along which $f_n(x_2)$ converges, and so on, so that $S_1\supset S_2\supset S_3\supset\cdots$. No single $S_k$ serves all points, and $\bigcap_k S_k$ may well be empty. Instead take the **diagonal**: the $k$-th term of $S_k$. For each $j$, all terms of the diagonal from the $j$-th on lie in $S_j$, so the diagonal converges at $x_j$.`,
      caption: String.raw`Here $f_n(x)=\sin nx$ and $E$ consists of the rational multiples $x_k=\pi p/q$ listed on the right. Then $n\mapsto f_n(x_k)$ is periodic, so each $S_k$ can be an arithmetic progression on which $f_n(x_k)$ is constant (any bounded sequence would do, using Bolzano–Weierstrass). Row $k$ lists the first terms of $S_k$, and the gold cells form the diagonal. Pick a point $x_j$ below: the original sequence $f_n(x_j)$ keeps jumping, while the diagonal settles from position $j$ on. "Reshuffle" makes different choices of subsequences.`,
      deps: ['pma-7.19', 'pma-3.6', 'pma-2.4'],
      tags: ['diagonal argument', 'subsequences'],
      viz(v) {
        const M = v.M;
        const E = [[1, 2], [1, 3], [1, 4], [2, 9], [3, 8], [1, 16], [5, 32]];
        const K = E.length, COLS = 12;
        const gcd = (a, b) => (b ? gcd(b, a % b) : a);
        const xlab = ([p, q]) => `${p === 1 ? '' : p}\\pi/${q}`;
        let seed = 4, rows = [];
        function build() {
          const R = M.rng(seed);
          let a = 1, L = 1; rows = [];
          for (const [p, q] of E) {
            const P = 2 * q, g = gcd(L, P);
            const opts = M.range(P / g).map((t) => a + L * t); // one representative per reachable residue mod P
            const nz = opts.filter((n) => Math.abs(Math.sin((n * Math.PI * p) / q)) > 0.2);
            a = R.pick(nz.length ? nz : opts); L = (L * P) / g;
            const c = Math.sin((a * Math.PI * p) / q);
            rows.push({ a, L, p, q, c: Math.abs(c) < 1e-9 ? 0 : c });
          }
        }
        build();
        v.button('Reshuffle choices', () => { seed += 1; build(); });
        const jsel = v.select('point $x_j$:', E.map((pq, i) => ({ value: i, label: `$x_{${i + 1}}$` })), 1);
        const A = v.stage({ x: [-1.25, 17.1], y: [-7.65, 0.85], height: 300, axes: false, full: true, title: 'nested subsequences $S_1\\supset S_2\\supset\\cdots$ (first 12 indices of each) and the diagonal' });
        const B = v.stage({ x: [0.3, 16.7], y: [-1.35, 1.35], height: 210, axes: 'box', full: true, xticks: M.range(16, 1), title: 'values at $x_j$: original sequence $f_n(x_j)$ vs. diagonal sequence $f_{n_k}(x_j)$' });
        const diag = () => rows.map((r, k) => r.a + k * r.L);
        v.render(() => {
          const j = jsel.value, nk = diag();
          // header row: n = 1, 2, 3, ...
          A.tex('n', -0.45, 0, { color: 'muted' });
          for (let c = 0; c < COLS; c++) A.text(String(c + 1), c + 1, 0, { align: 'center', color: 'muted', size: 12 });
          A.line(0.45, -0.5, COLS + 0.55, -0.5, { color: 'grid', width: 1 });
          A.path(nk.map((n, k) => [k + 1, -(k + 1)]), { color: 'gold', width: 2.4, alpha: 0.65 });
          rows.forEach((r, k) => {
            const y = -(k + 1), hl = k === j;
            if (hl) A.rect(0.45, y - 0.45, COLS + 0.55, y + 0.45, { fill: 'green', fillAlpha: 0.1, stroke: false });
            A.tex(`S_{${k + 1}}`, -0.45, y, { color: hl ? 'green' : 'ink' });
            for (let c = 0; c < COLS; c++) {
              const n = r.a + c * r.L;
              if (c === k) A.dot(c + 1, y, { color: 'gold', r: 15, alpha: 0.35, ring: false });
              A.text(String(n), c + 1, y, { align: 'center', size: n > 999 ? 11 : 12, color: c === k ? 'ink' : 'muted', weight: c === k ? 700 : 500 });
            }
            A.tex(`x_{${k + 1}}=${xlab(E[k])}`, 12.95, y, { align: 'left', size: 13.5, color: hl ? 'green' : 'ink' });
            A.text(`value ${v.fix(r.c + 0, 3)}`, 15.25, y, { align: 'left', size: 11.5, color: hl ? 'green' : 'muted' });
          });
          // values at x_j
          const [p, q] = E[j], xj = (Math.PI * p) / q, cj = rows[j].c;
          B.vband(j + 0.6, K + 0.4, { color: 'green', alpha: 0.1 });
          B.hline(cj, { color: 'green', width: 1.4, dash: [5, 4] });
          const orig = M.range(16, 1).map((n) => [n, Math.sin(n * xj)]);
          B.path(orig, { color: 'faint', width: 1.2 }); B.dots(orig, { color: 'muted', r: 3 });
          const dg = nk.map((n, k) => [k + 1, Math.sin(n * xj)]);
          B.path(dg, { color: 'gold', width: 2 });
          dg.forEach(([k, y]) => B.dot(k, y, { color: k >= j + 1 ? 'green' : 'gold', r: 5.5 }));
          B.text(`k ≥ ${j + 1}: every n_k lies in S${'₀₁₂₃₄₅₆₇₈₉'[j + 1]}`, j + 0.8, 1.2, { color: 'green', size: 11.5 });
        });
        v.legend([['gold', 'diagonal $n_k$ = $k$-th term of $S_k$', { dot: true }], ['muted', 'original $f_n(x_j)$, $n=1,2,\\dots$', { dot: true }], ['green', 'limit $\\lim_k f_{n_k}(x_j)$', { dash: true }]]);
        v.readout(() => {
          const nk = diag(), j = jsel.value;
          return `Diagonal: $n_k = ${nk.join(',\\,')},\\dots$ — each $n_k$ lies in $S_j$ for all $j\\le k$. First terms of $S_1,\\dots,S_7$: $${rows.map((r) => r.a).join(',\\,')}$; the spacings $${rows.map((r) => r.L).join(',')}$ grow without bound, so no single progression serves all of $E$. At $x_{${j + 1}}$ the diagonal is constant $=${v.fix(rows[j].c, 3)}$ from $k=${j + 1}$ on.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.24
    {
      num: '7.24',
      kind: 'Theorem',
      name: 'Uniformly convergent sequences on compact sets are equicontinuous',
      statement: String.raw`Let $K$ be a compact metric space, $f_n\in\mathscr C(K)$ for $n=1,2,3,\dots$, and suppose $\{f_n\}$ converges uniformly on $K$. Then $\{f_n\}$ is equicontinuous on $K$.`,
      idea: String.raw`Given $\eps$, the Cauchy criterion (7.8) gives $N$ with $\|f_n-f_N\|<\eps/3$ for $n>N$. The finitely many functions $f_1,\dots,f_N$ are uniformly continuous on the compact $K$ (4.19), so one $\delta$ makes each of them move by less than $\eps/3$ over distances $<\delta$. For $n>N$, insert $f_N$:
$$|f_n(x)-f_n(y)|\le|f_n(x)-f_N(x)|+|f_N(x)-f_N(y)|+|f_N(y)-f_n(y)|<\eps .$$
Finitely many members are handled by compactness, and the infinite tail by uniform closeness.`,
      caption: String.raw`Choose $\eps$. The viz finds an index $N$ beyond which every $f_n$ is within $\eps/6$ of the limit, so $\|f_n-f_N\|<\eps/3$; the top panel shows the $\eps/3$-tube around $f_N$ containing all later members. The bars give each member's largest admissible $\delta_n(\eps)$. Orange bars ($n\le N$) are handled by 4.19 and blue bars ($n>N$) by the tube. The green line $\delta=\min_{i\le N}\delta_i(\eps/3)$ lies under every bar. For $x^n$ or Example 7.21 the convergence is not uniform, no $N$ exists, and $\delta_n\to0$.`,
      deps: ['pma-7.22', 'pma-7.8', 'pma-4.19', 'pma-7.14'],
      tags: ['equicontinuity', 'uniform convergence', 'compactness'],
      viz(v) {
        const M = v.M;
        const NMAX = 30, G = 5000;
        const FAM = {
          osc: { label: '$\\tfrac12\\sin 2\\pi x+\\frac{\\sin n^2x}{n}$', f: (n, x) => 0.5 * Math.sin(2 * Math.PI * x) + Math.sin(n * n * x) / n, lim: (x) => 0.5 * Math.sin(2 * Math.PI * x), y: [-0.95, 1.3] },
          pow: { label: '$x^n$', f: (n, x) => Math.pow(x, n), lim: (x) => (x < 1 ? 0 : 1), y: [-0.12, 1.15] },
          bump: { label: '$\\frac{x^2}{x^2+(1-nx)^2}$ (7.21)', f: (n, x) => (x * x) / (x * x + (1 - n * x) ** 2), lim: () => 0, y: [-0.12, 1.15] },
        };
        const fam = v.select('$f_n(x)=$', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'osc');
        const eps = v.slider('$\\varepsilon$', 0.3, 1.2, 0.6, { step: 0.01 });
        const T = v.stage({ x: [-0.065, 1.02], y: [-1.15, 1.25], height: 250, full: true, title: '$f_N$ with its $\\varepsilon/3$-tube; later members $f_n$, $n>N$, in the background' });
        const B = v.stage({ x: [0, NMAX + 1], y: [0, 1], height: 210, axes: 'box', full: true, title: 'largest admissible $\\delta_n(\\varepsilon)$ for each $f_n$ on $[0,1]$' });
        let cache = {};
        function data() {
          if (cache.fam !== fam.value) {
            const F = FAM[fam.value], xs = M.linspace(0, 1, G);
            cache = { fam: fam.value, xs, h: 1 / (G - 1), vals: M.range(NMAX, 1).map((n) => Float64Array.from(xs, (x) => F.f(n, x))) };
            // sup-distance of each member to the (pointwise) limit
            const fl = Float64Array.from(xs, F.lim);
            cache.toLim = cache.vals.map((a) => { let s = 0; for (let i = 0; i < G; i++) s = Math.max(s, Math.abs(a[i] - fl[i])); return s; });
          }
          const e = eps.value;
          if (cache.eps !== e) {
            cache.eps = e;
            // Cauchy index: ‖f_m − f‖ < ε/6 for all m ≥ N, hence ‖f_m − f_N‖ < ε/3
            let N = null;
            for (let k = NMAX - 1; k >= 0 && cache.toLim[k] < e / 6; k--) N = k + 1;
            if (N != null && N > NMAX - 5) N = null;
            cache.N = N;
            cache.dn = cache.vals.map((a) => deltaFor(a, e, cache.h));
            cache.d3 = N ? Math.min(...cache.vals.slice(0, N).map((a) => deltaFor(a, e / 3, cache.h))) : null;
          }
          return cache;
        }
        let st = null;
        v.render(() => {
          const F = FAM[fam.value], e = eps.value, c = data(), N = c.N;
          T.setView(null, F.y);
          const Nshow = N || NMAX;
          for (let n = Nshow + 1; n <= NMAX; n++) T.fn((x) => F.f(n, x), { domain: [0, 1], color: 'faint', width: 1, n: 2400 });
          const fN = (x) => F.f(Nshow, x);
          T.between((x) => fN(x) + e / 3, (x) => fN(x) - e / 3, 0, 1, { fill: N ? 'accent' : 'red', fillAlpha: 0.13, n: 1600 });
          T.fn(F.lim, { domain: [0, 1], color: 'green', width: 2, dash: [6, 4] });
          T.fn(fN, { domain: [0, 1], color: N ? 'accent' : 'red', width: 2.2, n: 2400 });
          T.corner(N ? `N = ${N}: ‖fₙ − f‖ < ε/6 for n ≥ N, so ‖fₙ − f_N‖ < ε/3` : 'no N works: ‖fₙ − f‖ does not tend to 0', 'tr', { color: N ? 'accent' : 'red', weight: 600 });
          // bars
          const top = Math.min(1.25, Math.max(...c.dn) * 1.38);
          B.setView(null, [-0.09 * top, top]);
          B.bars(c.dn, { x0: 1, barWidth: 0.68, fillAlpha: 0.72, color: (val, i) => (N == null ? 'red' : i < N ? 'orange' : 'blue') });
          if (N) {
            B.vline(N + 0.5, { color: 'muted', width: 1, dash: [3, 3] });
            B.hline(c.d3, { color: 'green', width: 2, dash: [6, 4] });
            B.corner(`green: δ = min over i ≤ N of δᵢ(ε/3) = ${v.fmt(c.d3, 3)}`, 'tr', { color: 'green', weight: 600 });
          }
          st = { N, d3: c.d3, minAll: Math.min(...c.dn), e, last: c.dn[NMAX - 1] };
        });
        v.legend([['accent', '$f_N$ and its $\\varepsilon/3$-tube', { area: true }], ['green', 'limit $f$', { dash: true }], ['orange', '$\\delta_n$, $n\\le N$ (4.19)', { area: true }], ['blue', '$\\delta_n$, $n>N$ (via $f_N$)', { area: true }]]);
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.N) return `No Cauchy index: the convergence is not uniform. The admissible $\\delta_n(\\varepsilon)$ collapse (down to $${v.fmt(s.last, 3)}$ at $n=30$), so there is no common $\\delta$ — the family is not equicontinuous.`;
          return `$N=${s.N}$, $\\;\\delta=\\min_{i\\le N}\\delta_i(\\varepsilon/3)=${v.fmt(s.d3, 4)}\\;\\le\\;\\min_{n\\le30}\\delta_n(\\varepsilon)=${v.fmt(s.minAll, 4)}$ ✓ — one $\\delta$ serves the whole sequence, although $f_n$ has slope up to $n$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 7.25
    {
      num: '7.25',
      kind: 'Theorem',
      name: 'Arzelà–Ascoli theorem',
      credit: 'Arzelà & Ascoli, 1884',
      statement: String.raw`Let $K$ be a compact metric space, $f_n\in\mathscr C(K)$ for $n=1,2,3,\dots$, and suppose $\{f_n\}$ is pointwise bounded and equicontinuous on $K$. Then
(a) $\{f_n\}$ is uniformly bounded on $K$;
(b) $\{f_n\}$ has a subsequence that converges uniformly on $K$.`,
      idea: String.raw`(a) Take the $\delta$ belonging to $\eps=1$; finitely many $\delta$-balls around $p_1,\dots,p_r$ cover $K$, and a bound at those $r$ points spreads to all of $K$. (b) A compact metric space has a countable dense subset $E$. The diagonal process (7.23) yields a subsequence $\{g_i\}$ converging at every point of $E$. Given $\eps$, equicontinuity gives $\delta$; by compactness finitely many points $x_1,\dots,x_m\in E$ have $\delta$-neighbourhoods covering $K$, and beyond some index the $g_i$ agree within $\eps$ at all of them. Every $x$ is within $\delta$ of some $x_s$, so $|g_i(x)-g_j(x)|<3\eps$, and $\{g_i\}$ is uniformly Cauchy (7.8).`,
      caption: String.raw`A finite version of the proof. At level $k$ the pool of functions is filtered so that the survivors $S_k$ agree, within the orange windows, at the first $k$ points of the dense set $E=\{0,1,\tfrac12,\tfrac14,\tfrac34,\tfrac18,\dots\}$. The windows shrink with $k$ (Bolzano–Weierstrass, then 7.23), and gold-to-green curves are the diagonal picks $g_k\in S_k$. For an equicontinuous family, agreement on $E$ forces agreement everywhere, and the sup-spread of $S_k$ falls to $0$. For Example 7.21 every $f_n\to0$ at each point of $E$, yet the spikes at $1/n$ keep the spread at $1$: equicontinuity fails, and no subsequence converges uniformly.`,
      deps: ['pma-7.23', 'pma-7.22', 'pma-7.19', 'pma-7.8', 'pma-2.32'],
      see: ['rca-14.6', 'fa-3.15'],
      tags: ['compactness', 'equicontinuity', 'Arzelà–Ascoli'],
      viz(v) {
        const M = v.M;
        const KMAX = 9, GX = 200;
        const EPTS = [0, 1, 0.5, 0.25, 0.75, 0.125, 0.375, 0.625, 0.875];
        const halfW = (k) => 0.5 * Math.pow(0.74, k - 1);
        const fam = v.select('family', [{ value: 'eq', label: 'equicontinuous: $a_n\\sin(\\pi b_n x+c_n)$' }, { value: 'bump', label: 'Example 7.21: $\\frac{x^2}{x^2+(1-nx)^2}$' }], 'eq');
        const lev = v.slider('level $k$', 1, KMAX, 7, { int: true });
        let seed = 11;
        v.button('Resample family', () => { seed += 1; cache = {}; });
        const T = v.stage({ x: [-0.02, 1.02], y: [-1.2, 1.2], height: 300, full: true, title: 'survivors $S_k$ (thin), diagonal picks $g_1,\\dots,g_k$ (gold → green), windows at the points of $E$ (orange)' });
        const B = v.stage({ x: [0.3, KMAX + 0.7], y: [0, 2.2], height: 190, axes: 'box', full: true, xticks: M.range(KMAX, 1), title: 'sup-spread $\\max_{n,m\\in S_k}\\|f_n-f_m\\|$ at each level $k$' });
        let cache = {};
        function build() {
          const key = `${fam.value}|${seed}`;
          if (cache.key === key) return cache;
          const R = M.rng(seed);
          let P, f, peaks = null;
          if (fam.value === 'eq') {
            P = 24000;
            const prm = M.range(P).map(() => [R.uniform(0.25, 1), R.uniform(0.5, 1.6), R.uniform(0, 2 * Math.PI)]);
            f = (i, x) => { const [a, b, c] = prm[i]; return a * Math.sin(Math.PI * b * x + c); };
          } else {
            P = 400;
            f = (i, x) => { const n = i + 1; return (x * x) / (x * x + (1 - n * x) ** 2); };
            peaks = (i) => 1 / (i + 1);
          }
          const valsE = EPTS.map((x) => Float64Array.from({ length: P }, (_, i) => f(i, x)));
          const levels = [];
          let S = M.range(P);
          let prevPick = -1; const picks = [];
          for (let k = 1; k <= KMAX; k++) {
            const w = halfW(k); const wins = [];
            for (let i = 0; i < k; i++) {
              // Bolzano–Weierstrass, finite form: keep the densest window of half-width w
              const vals = S.map((n) => valsE[i][n]).sort((a, b) => a - b);
              let best = 0, bc = vals[0], r = 0;
              for (let l = 0; l < vals.length; l++) { while (r < vals.length && vals[r] <= vals[l] + 2 * w) r++; if (r - l > best) { best = r - l; bc = vals[l] + w; } }
              S = S.filter((n) => Math.abs(valsE[i][n] - bc) <= w);
              wins.push([EPTS[i], bc - w, bc + w]);
            }
            const pick = S.find((n) => n > prevPick) ?? S[S.length - 1];
            prevPick = pick; picks.push(pick);
            // sup-spread over S on a grid (plus spike locations for the bump family);
            // very large S are subsampled, which can only under-estimate the spread
            let xsS = M.linspace(0, 1, GX);
            if (peaks) xsS = xsS.concat(S.slice(0, 120).map(peaks));
            const Ssub = S.length > 4000 ? S.filter((_, i) => i % Math.ceil(S.length / 4000) === 0) : S;
            let spread = 0;
            for (const x of xsS) { let lo = Infinity, hi = -Infinity; for (const n of Ssub) { const y = f(n, x); if (y < lo) lo = y; if (y > hi) hi = y; } spread = Math.max(spread, hi - lo); }
            levels.push({ S: S.slice(), wins, spread, w, sub: Ssub !== S });
          }
          cache = { key, P, f, peaks, levels, picks };
          return cache;
        }
        // sample a member for drawing; spikes of the bump family need extra points near 1/n
        function curvePts(c, n) {
          let xs = M.linspace(0, 1, 500);
          if (c.peaks) { const p = c.peaks(n), s = p * p; xs = xs.concat([-8, -3, -1.5, -0.7, -0.3, 0, 0.3, 0.7, 1.5, 3, 8].map((t) => p + t * s)).filter((x) => x >= 0 && x <= 1).sort((a, b) => a - b); }
          return xs.map((x) => [x, c.f(n, x)]);
        }
        let st = null;
        v.render(() => {
          const c = build(), k = lev.value, L = c.levels[k - 1];
          T.setView(null, fam.value === 'eq' ? [-1.15, 1.15] : [-0.1, 1.12]);
          // pool background: first 40 members
          if (fam.value === 'eq') for (let n = 0; n < 24; n++) T.path(curvePts(c, n), { color: 'faint', width: 0.8, alpha: 0.6 });
          // survivors (subsampled for clarity)
          const S = L.S, step = Math.max(1, Math.floor(S.length / 45));
          for (let i = 0; i < S.length; i += step) T.path(curvePts(c, S[i]), { color: 'accent', width: 1, alpha: 0.45 });
          // windows at points of E
          for (const [x, a, b] of L.wins) { T.vline(x, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.7 }); T.line(x, a, x, b, { color: 'orange', width: 6, alpha: 0.75, cap: 'butt' }); }
          // diagonal picks
          for (let i = 0; i < k; i++) T.path(curvePts(c, c.picks[i]), { color: v.mix('gold', 'green', k === 1 ? 1 : i / (k - 1)), width: i === k - 1 ? 3 : 1.5, alpha: i === k - 1 ? 1 : 0.4 + 0.5 * i / k });
          // spread bars
          const sp = c.levels.map((l) => l.spread);
          const top = Math.max(2.05, ...sp) * 1.12;
          B.setView(null, [-0.1 * top, top]);
          const good = fam.value === 'eq' ? 'green' : 'red';
          sp.forEach((s, i) => B.rect(i + 0.72, 0, i + 1.28, s, { fill: good, fillAlpha: i === k - 1 ? 0.85 : i < k ? 0.45 : 0.15, stroke: false }));
          sp.forEach((s, i) => B.text((c.levels[i].sub ? '≥' : '') + v.fmt(s, 2), i + 1, s, { align: 'center', dy: -10, size: 11, color: i === k - 1 ? good : 'muted', weight: i === k - 1 ? 700 : 500 }));
          st = { k, n: S.length, P: c.P, spread: L.spread, w: L.w, picks: c.picks.slice(0, k).map((n) => n + 1) };
        });
        v.legend([['accent', 'survivors $S_k$'], ['orange', 'windows $\\pm w_k$ at points of $E$'], ['green', 'diagonal picks $g_k\\in S_k$']]);
        v.readout(() => {
          const s = st; if (!s) return '';
          const base = `Level $k=${s.k}$: windows $\\pm${v.fmt(s.w, 2)}$ at $${s.k}$ points of $E$; $|S_k|=${s.n}$ of $${s.P}$; picks $n_1<\\dots<n_k$: $${s.picks.join(',\\,')}$. `;
          return base + (fam.value === 'eq' ? `Sup-spread of $S_k$: $${v.fmt(s.spread, 3)}\\to0$, so the $g_k$ are uniformly Cauchy.` : `Sup-spread stays $${v.fmt(s.spread, 3)}$: the survivors agree on $E$ but not uniformly.`);
        });
      },
    },
  ],
};
