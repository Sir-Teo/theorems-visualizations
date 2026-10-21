// Rudin, Real and Complex Analysis — Chapter 15 (part 4): the Blaschke condition, boundary values, Müntz–Szász

// ---------------------------------------------------------------- helpers shared by this file
function ring(v, S, x, y, px, color, width = 2.2) {
  const c = S.ctx, X = S.X(x), Y = S.Y(y);
  c.save();
  for (const [col, w] of [['panel', width + 2.5], [color, width]]) { c.beginPath(); c.arc(X, Y, px, 0, 2 * Math.PI); c.strokeStyle = v.color(col); c.lineWidth = w; c.stroke(); }
  c.restore();
}
function colorBar(S, M, cmap, labLo, labHi) {
  const c = S.ctx, x0 = 12, y0 = S.height - 20, w = 110, h = 8;
  for (let i = 0; i < w; i++) { const col = M.cmap(i / (w - 1), cmap); c.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`; c.fillRect(x0 + i, y0, 1, h); }
  S.textPx(labLo, x0, y0 - 8, { size: 10.5, color: 'muted' }); S.textPx(labHi, x0 + w, y0 - 8, { size: 10.5, color: 'muted', align: 'right' });
}
function circleMean(g, J = 2048) { let s = 0; for (let j = 0; j < J; j++) s += g(-Math.PI + 2 * Math.PI * (j + 0.5) / J); return s / J; }
// log |b_α(z)| for the Blaschke factor b_α(z) = (|α|/α)(α − z)/(1 − ᾱz)
function logBlaschke(ar, ai, x, y) { const nr = ar - x, ni = ai - y, dr = 1 - (ar * x + ai * y), di = -(ar * y - ai * x); return 0.5 * Math.log((nr * nr + ni * ni) / (dr * dr + di * di)); }
const GOLD = Math.PI * (3 - Math.sqrt(5));
const SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
const sup = (n) => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((d) => SUP[+d]).join('');
const logTicks = (lo, hi, step = 1) => { const out = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) if (k % step === 0) out.push([k, k === 0 ? '1' : `10${sup(k)}`]); return out; };

export default {
  collection: 'rca',
  chapter: 15,
  items: [
    {
      num: '15.23',
      kind: 'Theorem',
      name: 'Zeros of functions in $N$ satisfy the Blaschke condition',
      statement: String.raw`Let $f\in N$ (in particular, $f\in H^\infty$), $f\not\equiv0$, and let $\alpha_1,\alpha_2,\alpha_3,\dots$ be the zeros of $f$ in $U$, listed according to multiplicity. Then
$$\sum_{n=1}^\infty(1-|\alpha_n|)<\infty .$$`,
      idea: String.raw`Dividing by a power of $z$ we may assume $f(0)\ne0$. Let $C$ bound $\exp\big(\frac1{2\pi}\int\log^+|f(re^{i\theta})|\,d\theta\big)$ for all $r$. Jensen's formula (15.18) with $\log\le\log^+$ gives, for every $k$ and every $r$ with at least $k$ zeros in $\overline D(0;r)$,
$$|f(0)|\prod_{n=1}^k\frac{r}{|\alpha_n|}\le C,\quad\text{i.e.}\quad\prod_{n=1}^k|\alpha_n|\ge\frac{|f(0)|}{C}\,r^k .$$
Let $r\to1$, then $k\to\infty$: $\prod|\alpha_n|\ge|f(0)|/C>0$, and Theorem 15.5 turns this into $\sum(1-|\alpha_n|)<\infty$.`,
      caption: String.raw`Zeros $\alpha_n=(1-\frac{1}{2n^s})e^{in\phi}$, shown left in boundary coordinates (angle against $\frac1{1-|\alpha_n|}$ on a log scale): those below the gold line lie in $|z|\le r$. Jensen's sum $J(r)=\sum_{|\alpha_n|\le r}\log\frac{r}{|\alpha_n|}=\mu_r(f)-\log|f(0)|$ is plotted against $\log_{10}\frac1{1-r}$; for any $f\in N$ with these zeros it would have to stay below $\log\frac{C}{|f(0)|}$. For $s>1$ it levels off at $\sum\log\frac1{|\alpha_n|}$ (green), the value attained by the Blaschke product of 15.21. For $s\le1$ it grows without bound and crosses every proposed ceiling (red): no function in $N$ — bounded or not — can vanish at all these points.`,
      deps: ['rca-15.18', 'rca-15.5', 'rca-15.22'],
      see: ['rca-15.21'],
      tags: ['Blaschke condition', 'Jensen', 'Nevanlinna class'],
      viz(v) {
        const sS = v.slider('exponent $s$', 0.7, 2.2, 0.9, { step: 0.01 });
        const cS = v.slider('a ceiling $\\log\\frac{C}{|f(0)|}$', 1, 12, 5, { step: 0.1 });
        const L = v.stage({ x: [-Math.PI, Math.PI], y: [0, 4], height: 330, axes: 'box', weight: 0.9, xlabel: 'arg α', xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], yticks: [[0, '1'], [1, '10'], [2, '10²'], [3, '10³'], [4, '10⁴']], title: 'zeros in boundary coordinates: $\\arg\\alpha_n$ vs $\\frac{1}{1-|\\alpha_n|}$ (log)' });
        const R = v.stage({ x: [0, 4], y: [0, 10], height: 330, axes: 'box', xlabel: '1/(1 − r)', xticks: [[0, '1'], [1, '10'], [2, '10²'], [3, '10³'], [4, '10⁴']], title: "Jensen's sum $J(r)$" });
        const rS = v.slider('$r$', 0.5, 0.9999, 0.99, { step: 0.0001, fmt: (x) => x.toFixed(4) });
        let cache = null;
        const build = (s) => { // cumulative Σ log(1/|α_n|) up to the last zero inside r = 1 − 1e−4
          const nmax = Math.ceil(Math.pow(0.5 / 1e-4, 1 / s)) + 2, cum = new Float64Array(nmax + 1);
          for (let n = 1; n <= nmax; n++) cum[n] = cum[n - 1] - Math.log1p(-0.5 * Math.pow(n, -s));
          return { s, nmax, cum };
        };
        const nIn = (s, r) => Math.floor(Math.pow(0.5 / (1 - r), 1 / s)); // #{n : 1 − |α_n| ≥ 1 − r}
        let st = null;
        v.render(() => {
          const s = sS.value, ceil = cS.value, r = rS.value;
          if (!cache || cache.s !== s) cache = build(s);
          const J = (rr) => { const n = Math.min(nIn(s, rr), cache.nmax); return n * Math.log(rr) + cache.cum[n]; };
          // left: zeros
          const yr = Math.log10(1 / (1 - r)), inside = [], outside = [];
          for (let n = 1; n <= Math.min(cache.nmax, 20000); n++) { const th = Math.atan2(Math.sin(n * GOLD), Math.cos(n * GOLD)), y = Math.log10(2 * Math.pow(n, s)); if (y > 4) break; (y <= yr ? inside : outside).push([th, y]); }
          L.hband(0, yr, { color: 'green', alpha: 0.07 });
          L.dots(outside, { color: 'muted', r: 1.1, alpha: 0.3 });
          L.dots(inside, { color: 'green', r: 2 });
          L.hline(yr, { color: 'gold', width: 1.8, dash: [6, 4] });
          L.text('|z| = r', Math.PI - 0.08, yr, { color: 'gold', size: 12, align: 'right', dy: -10, math: true });
          // right: J(r) against log10(1/(1−r))
          const curve = []; for (let i = 0; i <= 400; i++) { const x = 4 * i / 400, rr = 1 - Math.pow(10, -x); curve.push([x, J(rr)]); }
          if (cache.lim === undefined) cache.lim = s > 1 ? (() => { let t = 0; for (let n = 1; n <= 2e6; n++) { const u = 0.5 * Math.pow(n, -s); t -= Math.log1p(-u); if (u < 1e-12) break; } return t + 0.5 * Math.pow(2e6, 1 - s) / (s - 1); })() : Infinity;
          const lim = cache.lim;
          const top = Math.max(ceil * 1.25, Math.min(curve[curve.length - 1][1] * 1.08, 40), isFinite(lim) ? lim * 1.2 : 0, 2);
          R.setView(null, [0, top]);
          R.hline(ceil, { color: 'red', width: 1.6, dash: [6, 4] });
          R.text('a ceiling log(C/|f(0)|)', 0.3, ceil, { color: 'red', size: 11.5, dy: -9 });
          if (isFinite(lim)) { R.hline(lim, { color: 'green', width: 1.8, dash: [3, 3] }); R.text('Σ log(1/|αₙ|)', 3.94, lim, { color: 'green', size: 11.5, align: 'right', dy: 10 }); }
          R.path(curve, { color: 'blue', width: 2.8 });
          const xr = Math.log10(1 / (1 - r));
          R.vline(xr, { color: 'gold', width: 1.2, dash: [4, 4] });
          R.dot(xr, J(r), { color: 'blue', r: 5 });
          let cross = null; for (const [x, y] of curve) if (y > ceil) { cross = x; break; }
          if (cross != null) R.dot(cross, ceil, { color: 'red', r: 5 });
          st = { s, r, Jr: J(r), n: nIn(s, r), lim, cross, ceil };
          v.legend([['green', 'zeros inside $|z|\\le r$', { dot: true }], ['blue', '$J(r)=\\sum_{|\\alpha_n|\\le r}\\log\\frac{r}{|\\alpha_n|}$'], ['red', 'a proposed bound for $f\\in N$', { dash: true }]]);
        });
        v.readout(() => {
          const q = st; if (!q) return '';
          const tail = isFinite(q.lim) ? `$J$ increases to $\\sum\\log\\frac{1}{|\\alpha_n|} = ${v.fix(q.lim, 3)}$: finite, as $\\sum(1-|\\alpha_n|)<\\infty$.` : `$\\sum(1-|\\alpha_n|)=\\infty$, so $J(r)\\to\\infty$${q.cross != null ? ` and passes the ceiling $${v.fix(q.ceil, 1)}$ once $1/(1-r)\\approx10^{${v.fix(q.cross, 2)}}$` : ''}.`;
          return `$s=${v.fix(q.s, 2)}$, $r=${q.r.toFixed(4)}$: ${q.n} zeros inside, $J(r) = ${v.fix(q.Jr, 3)}$. ${tail}`;
        });
      },
    },
    {
      num: '15.23a',
      kind: 'Corollary',
      name: 'Too many zeros force $f\\equiv0$',
      verify: true,
      statement: String.raw`If $f\in H^\infty$ (or merely $f\in N$), $\alpha_1,\alpha_2,\dots$ are zeros of $f$ in $U$, and $\sum(1-|\alpha_n|)=\infty$, then $f\equiv0$. For instance, no bounded holomorphic function in $U$ other than $0$ vanishes at every point $\frac{n-1}{n}$, $n=1,2,3,\dots$`,
      idea: String.raw`It is the contrapositive of 15.23. For $f\in H^\infty$ there is also a direct picture: if $f$ vanishes at $\alpha_1,\dots,\alpha_N$, then $f/B_N$ is holomorphic, where $B_N$ is the finite Blaschke product with those zeros; since $|B_N|\to1$ at the boundary, the maximum modulus theorem gives $|f|\le\|f\|_\infty|B_N|$ in $U$. When $\sum(1-|\alpha_n|)=\infty$, $B_N\to0$ locally uniformly (15.5), squeezing $f$ to $0$.`,
      caption: String.raw`Real zeros $\alpha_n=1-\frac{1}{(n+1)^s}$ approaching $1$; $s=1$ gives $\alpha_n=\frac{n}{n+1}$ — the points $\frac{n-1}{n}$ ($n\ge2$) of the corollary. Left: $|B_N|$ on the disc, an upper bound for $|f|/\|f\|_\infty$ for any bounded $f$ vanishing at $\alpha_1,\dots,\alpha_N$. Right: $B_N(x)$ on $(-1,1)$ for $N=1,2,4,\dots,512$ (faint) and the chosen $N$ (bold). For $s\le1$ the graphs collapse to $0$ everywhere ($B_N(0)=\prod\alpha_n\to0$); for $s>1$ they converge to a nonzero limit.`,
      deps: ['rca-15.23'],
      see: ['rca-15.26'],
      tags: ['Blaschke condition', 'uniqueness', 'H-infinity'],
      viz(v) {
        const sS = v.slider('exponent $s$', 0.5, 2, 1, { step: 0.01 });
        const Ns = v.slider('zeros used $N$', 1, 512, 64, { int: true, log: true, fmt: (x) => String(Math.round(x)) });
        const L = v.stage({ x: [-1.06, 1.06], y: [-1.06, 1.06], equal: true, height: 320, axes: false, weight: 0.8, title: '$|B_N(z)|$ — a bound for $|f|/\\|f\\|_\\infty$' });
        const R = v.stage({ x: [-1, 1], y: [-1.05, 1.05], height: 320, axes: true, xlabel: 'x', title: '$B_N(x)=\\prod_{n\\le N}\\frac{\\alpha_n-x}{1-\\alpha_nx}$' });
        const al = (s, n) => 1 - Math.pow(n + 1, -s);
        const BN = (s, N, x) => { let p = 1; for (let n = 1; n <= N; n++) { const a = al(s, n); p *= (a - x) / (1 - a * x); } return p; };
        let st = null;
        v.legend([['blue', '$B_N(x)$ for the chosen $N$'], ['faint', '$N=1,2,4,\\dots,512$'], ['ink', 'zeros $\\alpha_n$', { dot: true }]]);
        v.render(() => {
          const s = sS.value, N = Ns.value;
          const A = Array.from({ length: N }, (_, i) => al(s, i + 1));
          L.heat((x, y) => { if (x * x + y * y >= 1) return NaN; let l = 0; for (const a of A) l += 0.5 * Math.log(((a - x) ** 2 + y * y) / ((1 - a * x) ** 2 + (a * y) ** 2)); return Math.exp(l); }, { range: [0, 1], cmap: 'viridis', key: `${s},${N}`, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.8 });
          L.dots(A.slice(0, 60).map((a) => [a, 0]), { color: 'panel', r: 2.4 });
          ring(v, L, 0, 0, 5, 'gold', 1.6);
          colorBar(L, v.M, 'viridis', '0', '1');
          for (let k = 0; k <= 9; k++) { const M = 1 << k; if (M !== N) R.fn((x) => BN(s, M, x), { color: 'faint', width: 1.2, n: 900 }); }
          R.fn((x) => BN(s, N, x), { color: 'blue', width: 2.8, n: 1400 });
          R.dots(A.slice(0, 40).map((a) => [a, 0]), { color: 'ink', r: 2.4 });
          const b0 = BN(s, N, 0); let sum = 0; for (let n = 1; n <= N; n++) sum += 1 - al(s, n);
          R.dot(0, b0, { color: 'gold', r: 5, label: 'B_N(0)', labelPos: 'ne', tex: true });
          st = { s, N, b0, sum, max05: Math.max(...v.M.linspace(-0.5, 0.5, 201).map((x) => Math.abs(BN(s, N, x)))) };
        });
        v.readout(() => {
          const q = st; if (!q) return '';
          return `$s=${v.fix(q.s, 2)}$, $N=${q.N}$: $\\sum_{n\\le N}(1-\\alpha_n) = ${v.fix(q.sum, 3)}$, $\\;B_N(0)=\\prod_{n\\le N}\\alpha_n = ${v.sci(q.b0, 3)}$, $\\;\\max_{|x|\\le1/2}|B_N(x)| = ${v.sci(q.max05, 3)}$. ${q.s <= 1 ? 'Both tend to $0$: any bounded $f$ with all these zeros satisfies $|f|\\le\\|f\\|_\\infty|B_N|\\to0$.' : 'The Blaschke sum converges, so $B_N\\to B\\not\\equiv0$.'}`;
        });
      },
    },
    {
      num: '15.24',
      kind: 'Theorem',
      name: 'Blaschke products have unimodular boundary values',
      verify: true,
      statement: String.raw`If $B$ is a Blaschke product, then its radial limits satisfy $|B^*(e^{i\theta})|=1$ for almost every $\theta$, and
$$\lim_{r\to1}\frac1{2\pi}\int_{-\pi}^{\pi}\log\big|B(re^{i\theta})\big|\,d\theta=0 .$$`,
      idea: String.raw`The limit exists because the integrals increase with $r$ (15.19). Write $B=B_N\cdot R_N$ where $B_N$ holds the first $N$ factors; $\log|B_N|$ is continuous near the circle with $|B_N|=1$ there, so it does not affect the limit. Applying 15.19 to the tail $R_N$: $\log|R_N(0)|\le\lim_r\mu_r(R_N)\le\mu^*(R_N)\le0$. As $N\to\infty$, $|R_N(0)|=\prod_{n>N}|\alpha_n|\to1$, so the limit is $0$; and $\mu^*(B)=0$ with $|B^*|\le1$ forces $|B^*|=1$ a.e.`,
      caption: String.raw`A Blaschke product with $600$ zeros, $1-|\alpha_n|=\frac{1}{2n^s}$, either spread around the circle or crowding at $z=1$. Left: $|B|$ in the disc and the circle $|z|=r$. Right: $|B(re^{i\theta})|$ against $\theta$ — as $r\to1$ it is close to $1$ except in ever narrower dips near the zeros. Bottom: $\mu_r(B)$ rising to $0$ against $\frac1{1-r}$ on a log scale; the readout reports the fraction of the circle where $|B(re^{i\theta})|<0.9$. Convergence is slow when many zeros hug the circle — lower $s$ and watch.`,
      deps: ['rca-15.19', 'rca-15.21', 'rca-11.32'],
      see: ['rca-17.15'],
      tags: ['Blaschke products', 'boundary values', 'inner functions'],
      viz(v) {
        const NZ = 600;
        const MODES = {
          spread: { label: 'zeros spread over the circle', a: (s, n) => { const m = 1 - 0.5 * Math.pow(n, -s); return [m * Math.cos(n * GOLD), m * Math.sin(n * GOLD)]; } },
          one: { label: 'zeros crowding at $1$', a: (s, n) => { const t = 0.5 * Math.pow(n, -s), th = (n % 2 ? 1 : -1) * 2.2 * Math.sqrt(t); const m = 1 - t; return [m * Math.cos(th), m * Math.sin(th)]; } },
        };
        const which = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'spread');
        const sS = v.slider('exponent $s$', 1.1, 3, 2.2, { step: 0.01 });
        const rS = v.slider('$r$', 0.5, 0.9995, 0.99, { step: 0.0005, fmt: (x) => x.toFixed(4) });
        const L = v.stage({ x: [-1.06, 1.06], y: [-1.06, 1.06], equal: true, height: 290, axes: false, weight: 0.75, title: '$|B|$ in $U$' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [0, 1.08], height: 290, axes: 'box', xlabel: 'θ', xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], title: '$|B(re^{i\\theta})|$ on the circle $|z|=r$' });
        const Bt = v.stage({ x: [0.3, 3.3], y: [-1, 0.05], height: 160, full: true, axes: 'box', xlabel: '1/(1 − r)', xticks: [[0.5, '3'], [1, '10'], [1.5, '30'], [2, '100'], [2.5, '300'], [3, '10³']], title: '$\\mu_r(B)=\\frac1{2\\pi}\\int\\log|B(re^{i\\theta})|\\,d\\theta\\to0$ against $\\frac1{1-r}$ (log scale)' });
        let cache = null;
        v.render(() => {
          const s = sS.value, r = rS.value, key = `${which.value},${s}`;
          if (!cache || cache.key !== key) {
            const A = Array.from({ length: NZ }, (_, i) => MODES[which.value].a(s, i + 1));
            const lB = (x, y) => { let l = 0; for (const [a, b] of A) l += logBlaschke(a, b, x, y); return l; };
            const mu = [];
            for (let i = 0; i <= 36; i++) {
              const x = 0.3 + 3 * i / 36, rr = 1 - Math.pow(10, -x);
              mu.push([x, circleMean((t) => lB(rr * Math.cos(t), rr * Math.sin(t)), 2048)]);
            }
            cache = { key, A, lB, mu };
          }
          const { A, lB } = cache;
          L.heat((x, y) => (x * x + y * y < 1 ? Math.exp(lB(x, y)) : NaN), { range: [0, 1], cmap: 'viridis', key, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          L.circle(0, 0, r, { color: 'panel', width: 3.5 }); L.circle(0, 0, r, { color: 'gold', width: 1.8 });
          colorBar(L, v.M, 'viridis', '|B| = 0', '1');
          // right: |B(re^{iθ})|
          R.hline(1, { color: 'green', width: 1.2, dash: [5, 4] });
          R.hline(0.9, { color: 'orange', width: 1, dash: [2, 4] });
          R.fn((t) => Math.exp(lB(r * Math.cos(t), r * Math.sin(t))), { color: 'blue', width: 1.8, n: 2400 });
          // bottom: μ_r and the bad fraction
          Bt.setView(null, [Math.min(-1, ...cache.mu.map((p) => p[1])) - 0.05, 0.05]);
          Bt.hline(0, { color: 'green', width: 1.2, dash: [5, 4] });
          Bt.path(cache.mu, { color: 'blue', width: 2.8 });
          const xr = Math.log10(1 / (1 - r));
          Bt.vline(xr, { color: 'gold', width: 1.2, dash: [4, 4] });
          let bad = 0; const mr = circleMean((t) => { const l = lB(r * Math.cos(t), r * Math.sin(t)); if (l < Math.log(0.9)) bad++; return l; }, 4096);
          Bt.dot(xr, mr, { color: 'blue', r: 4.5 });
          cache.now = { r, mr, frac: bad / 4096, s };
          v.legend([['blue', '$|B(re^{i\\theta})|$ / $\\mu_r(B)$'], ['orange', 'level $0.9$', { dash: true }], ['green', 'level $1$ / $0$', { dash: true }], ['gold', 'circle $|z|=r$']]);
        });
        v.readout(() => {
          const q = cache?.now; if (!q) return '';
          return `$r=${v.fix(q.r, 3)}$: $\\;\\mu_r(B) = ${v.fix(q.mr, 4)}$ and $|B(re^{i\\theta})|<0.9$ on ${v.fix(100 * q.frac, 1)}% of the circle — both shrink to $0$ as $r\\to1$, so $|B^*|=1$ almost everywhere.`;
        });
      },
    },
    // ------------------------------------------------------------------ Müntz–Szász
    {
      num: '15.26',
      kind: 'Theorem',
      name: 'Müntz–Szász theorem',
      credit: 'Müntz & Szász, 1914',
      statement: String.raw`Let $0<\lambda_1<\lambda_2<\lambda_3<\cdots$ and let $X$ be the closure in $C(I)$, $I=[0,1]$, of the linear span of $1,t^{\lambda_1},t^{\lambda_2},t^{\lambda_3},\dots$
(a) If $\sum_n1/\lambda_n=\infty$, then $X=C(I)$.
(b) If $\sum_n1/\lambda_n<\infty$ and $\lambda>0$ is not one of the $\lambda_n$, then $t^\lambda\notin X$.`,
      idea: String.raw`By Hahn–Banach (5.19) and the Riesz representation theorem (6.19), (a) amounts to: a complex measure $\mu$ on $I$ that annihilates $1$ and every $t^{\lambda_n}$ annihilates every $t^k$ (then $X$ contains all polynomials, which are dense). Put $f(z)=\int_{(0,1]}t^z\,d\mu(t)$, bounded and holomorphic in $\Re z>0$ and zero at each $\lambda_n$. Under $z=\frac{1+w}{1-w}$ the zeros move to $\alpha_n=\frac{\lambda_n-1}{\lambda_n+1}\in U$ with $1-|\alpha_n|\approx\frac2{\lambda_n}$, so $\sum(1-|\alpha_n|)=\infty$ and 15.23 forces $f\equiv0$. For (b), a convergent Blaschke-type product in a half-plane vanishing exactly at $0$ and the $\lambda_n$ can be written as $\int_0^1t^zg(t)\,dt$ with $g\in L^1$; the measure $g\,dt$ kills $X$ but not $t^\lambda$.`,
      caption: String.raw`Approximate $t^\lambda$ from the span of $1,t^{\lambda_1},\dots,t^{\lambda_N}$. The gold curve is the best approximation in $L^2(0,1)$, from exact product formulas for its coefficients (it is not the uniform best approximation; its sup error is reported too). Right: the exact $L^2$ distance $d_N=\frac{1}{\sqrt{2\lambda+1}}\prod_{k=0}^{N}\frac{|\lambda-\lambda_k|}{\lambda+\lambda_k+1}$ ($\lambda_0=0$) for $N$ up to $200$ and every exponent sequence (selected one bold). When $\sum1/\lambda_k=\infty$ — integers, even integers, even the primes — $d_N\to0$ (for the primes only at the pace of $\sum_{p\le x}1/p\approx\log\log x$); for $k^{1.5}$, $k^2$, $2^k$ it levels off at a positive value.`,
      deps: ['rca-15.23a', 'rca-5.19', 'rca-6.19', 'pma-7.26'],
      see: ['pma-7.26', 'fa-3.5'],
      tags: ['approximation', 'Müntz–Szász', 'Blaschke condition'],
      viz(v) {
        const primes = []; for (let n = 2; primes.length < 200; n++) { let ok = true; for (const p of primes) { if (p * p > n) break; if (n % p === 0) { ok = false; break; } } if (ok) primes.push(n); }
        const SEQ = {
          int: { label: '$k$', txt: 'k', l: (k) => k, div: true, col: 'blue' },
          even: { label: '$2k$', txt: '2k', l: (k) => 2 * k, div: true, col: 'teal' },
          prime: { label: 'primes', txt: 'primes', l: (k) => primes[k - 1], div: true, col: 'purple' },
          k15: { label: '$k^{1.5}$', txt: 'k¹·⁵', l: (k) => Math.pow(k, 1.5), div: false, col: 'orange' },
          sq: { label: '$k^2$', txt: 'k²', l: (k) => k * k, div: false, col: 'red' },
          pow: { label: '$2^k$', txt: '2ᵏ', l: (k) => Math.pow(2, k), div: false, col: 'pink' },
        };
        const which = v.select('$\\lambda_k=$', Object.entries(SEQ).map(([value, o]) => ({ value, label: o.label })), 'even');
        const lamS = v.slider('target $t^\\lambda$, $\\lambda$', 0.2, 3.5, 0.5, { step: 0.05 });
        const Ns = v.slider('exponents used $N$', 1, 9, 5, { int: true });
        const T = v.stage({ x: [0, 1], y: [-0.08, 1.08], height: 230, full: true, axes: 'box', xlabel: 't', title: '$t^\\lambda$ and its best $L^2$ approximation $P_N$ from $\\mathrm{span}\\{1,t^{\\lambda_1},\\dots,t^{\\lambda_N}\\}$' });
        const E = v.stage({ x: [0, 1], y: [-0.05, 0.05], height: 260, axes: 'box', xlabel: 't', title: 'the error $t^\\lambda-P_N(t)$' });
        const R = v.stage({ x: [0, 2.35], y: [-6, 0], height: 260, weight: 1.25, axes: 'box', xlabel: 'N', xticks: [[0, '1'], [1, '10'], [2, '100']], title: '$L^2$ distance $d_N$ for every sequence (log–log)' });
        const dist = (lam, ex) => { let l = -0.5 * Math.log(2 * lam + 1); for (const a of ex) l += Math.log(Math.abs(lam - a) / (lam + a + 1)); return l / Math.LN10; };
        let st = null;
        v.render(() => {
          const S = SEQ[which.value], lam = lamS.value, N = Ns.value;
          const ex = [0]; for (let k = 1; k <= N; k++) ex.push(S.l(k));
          const hit = ex.some((a) => Math.abs(a - lam) < 1e-9);
          // error e(t) = t^λ + Σ β_k t^{a_k}; β_k from the partial-fraction identity (exact products)
          let P = null, errSup = 0;
          if (!hit) {
            const logC = ex.reduce((s, a) => s + Math.log(Math.abs(a - lam)) - Math.log(lam + 1 + a), 0);
            const sgnC = ex.reduce((s, a) => s * Math.sign(a - lam) * -1, 1);
            const beta = ex.map((ak, k) => {
              let l = logC, sg = sgnC;
              for (const aj of ex) { l += Math.log(ak + aj + 1); sg *= -1; }
              l -= Math.log(Math.abs(lam - ak)); sg *= Math.sign(lam - ak);
              ex.forEach((ai, i) => { if (i !== k) { l -= Math.log(Math.abs(ai - ak)); sg *= Math.sign(ai - ak); } });
              return sg * Math.exp(l);
            });
            P = (t) => -beta.reduce((s, b, k) => s + b * Math.pow(t, ex[k]), 0);
            for (let i = 0; i <= 400; i++) { const t = i / 400; errSup = Math.max(errSup, Math.abs(Math.pow(t, lam) - P(t))); }
          }
          T.fn((t) => Math.pow(t, lam), { color: 'ink', width: 2.4, domain: [0, 1] });
          if (P) T.fn(P, { color: 'gold', width: 2.6, domain: [0, 1] });
          const eMax = Math.max(1e-6, errSup) * 1.25;
          E.setView(null, [-eMax, eMax]);
          if (P) E.fn((t) => Math.pow(t, lam) - P(t), { color: 'red', width: 2, domain: [0, 1], fill: 'red', fillAlpha: 0.12 });
          // distances for every sequence
          let lo = 0;
          const curves = {};
          for (const [key, o] of Object.entries(SEQ)) {
            const pts = []; let l = -0.5 * Math.log(2 * lam + 1) + Math.log(lam / (lam + 1));
            for (let n = 1; n <= 200; n++) { const a = o.l(n); l += Math.log(Math.abs(lam - a) / (lam + a + 1) + 1e-300); pts.push([Math.log10(n), Math.max(-16, l / Math.LN10)]); }
            curves[key] = pts; lo = Math.min(lo, pts[pts.length - 1][1]);
          }
          lo = Math.max(-16, Math.floor(lo) - 0.3);
          R.setView(null, [lo, 0.2]);
          R.setTicks(undefined, logTicks(lo, 0, lo < -8 ? 2 : 1));
          for (const [key, o] of Object.entries(SEQ)) if (key !== which.value) R.path(curves[key], { color: o.col, width: 1.3, alpha: 0.5 });
          const ends = Object.entries(SEQ).map(([key, o]) => [o, curves[key][199][1]]).filter(([, y]) => y > lo + 0.2).sort((a, b) => b[1] - a[1]);
          let prevY = Infinity; const gap = 14 / R.sy;
          for (const [o, y] of ends) { const yy = Math.min(y, prevY - gap); prevY = yy; R.text(o.txt, 2.33, yy, { color: o.col, size: 11, align: 'right', dy: -7, weight: o === S ? 700 : 500 }); }
          R.path(curves[which.value], { color: S.col, width: 3 });
          const dN = dist(lam, ex);
          if (isFinite(dN)) { R.vline(Math.log10(N), { color: 'gold', width: 1.2, dash: [4, 4] }); R.dot(Math.log10(N), dN, { color: S.col, r: 5 }); }
          let harm = 0; for (let k = 1; k <= 200; k++) harm += 1 / S.l(k);
          st = { S, lam, N, hit, dN, errSup, harm, d200: Math.pow(10, curves[which.value][199][1]) };
          v.legend([['ink', '$t^\\lambda$'], ['gold', 'best $L^2$ approximation $P_N$'], ['red', 'error (bottom panel)'], [S.col, '$d_N$ for the chosen sequence']]);
        });
        v.readout(() => {
          const q = st; if (!q) return '';
          if (q.hit) return `$\\lambda=${v.fix(q.lam, 2)}$ is one of the exponents, so $t^\\lambda$ lies in the span itself. Pick another $\\lambda$.`;
          return `$\\lambda=${v.fix(q.lam, 2)}$, $N=${q.N}$: $\\;d_N = ${v.sci(Math.pow(10, q.dN), 3)}$, $\\;\\sup_I|t^\\lambda-P_N| = ${v.sci(q.errSup, 3)}$; $\\;d_{200} = ${v.sci(q.d200, 3)}$. $\\sum_{k\\le200}1/\\lambda_k = ${v.fix(q.harm, 3)}$ ${q.S.div ? '(diverges: $X=C(I)$)' : '(converges: $t^\\lambda\\notin X$)'}.`;
        });
      },
    },
  ],
};
