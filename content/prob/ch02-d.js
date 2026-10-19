// Probability: Theory and Examples (Durrett) — Chapter 2, part D: Glivenko–Cantelli, Shannon, 0-1 laws and random series (§§2.4–2.5)

// ---------- helpers (local to this part) ----------
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
/** Status text pinned to a corner of the data area (inside the gutter). */
function cornerIn(S, str, pos = 'tl', st = {}) {
  const l = S.X(S.xr[0]), r = S.X(S.xr[1]), t = S.Y(S.yr[1]), b = S.Y(S.yr[0]);
  const X = pos[1] === 'l' ? l + 8 : r - 8, Y = pos[0] === 't' ? t + 13 : b - 13;
  const o = { align: pos[1] === 'l' ? 'left' : 'right', color: 'muted', size: 12, ...st };
  if (/\$[^$]+\$/.test(str)) return S.texPx(String(str), X, Y, { ...o, rich: true });
  return S.textPx(String(str), X, Y, o);
}
/** About m log-spaced distinct integers in [n0, n1], always including both ends. */
function logGrid(n0, n1, m = 200) {
  const out = [n0]; const q = Math.pow(n1 / n0, 1 / m);
  for (let x = n0 * q; x < n1; x *= q) { const k = Math.round(x); if (k > out[out.length - 1]) out.push(k); }
  if (out[out.length - 1] !== n1) out.push(n1);
  return out;
}
/** Exact simulation of independent indicators with nonincreasing probabilities p(n) (geometric jumps + thinning). */
function bernTimes(p, n0, nmax, r) {
  const out = []; let n = n0;
  while (n <= nmax) {
    const q = p(n);
    if (q >= 1) { out.push(n); n++; continue; }
    if (!(q > 0)) break;
    const g = Math.floor(Math.log(1 - r()) / Math.log1p(-q));
    n += g; if (n > nmax) break;
    if (r() * q < p(n)) out.push(n);
    n++;
  }
  return out;
}
/** Partial sums of a term generator recorded at the integers of a sorted grid. */
function partial(term, grid) {
  const out = new Float64Array(grid.length); let s = 0, j = 0; const N = grid[grid.length - 1];
  for (let n = 1; n <= N; n++) { s += term(n); if (n === grid[j]) { out[j] = s; j++; } }
  return out;
}
/** Polygon for a band between two arrays over a grid. */
const band = (grid, lo, hi) => [...grid.map((g, k) => [g, hi[k]]), ...grid.map((g, k) => [g, lo[k]]).reverse()];
const sgn = (r) => (r() < 0.5 ? -1 : 1);

export default {
  collection: 'prob',
  chapter: 2,
  items: [
    {
      num: '2.4.9',
      kind: 'Theorem',
      name: 'Glivenko–Cantelli theorem',
      credit: 'Glivenko and Cantelli, 1933',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with distribution function $F$, and let
$$F_n(x)=\frac1n\sum_{m=1}^n1(X_m\le x)$$
be the empirical distribution function. Then $\sup_x|F_n(x)-F(x)|\to0$ almost surely.`,
      idea: String.raw`For each fixed $x$, $F_n(x)\to F(x)$ and $F_n(x-)\to F(x-)$ a.s. by the strong law (2.4.1) applied to indicators. Uniformity comes from monotonicity: put $x_{j,k}=\inf\{y:F(y)\ge j/k\}$ for $1\le j<k$. Between consecutive grid points both $F_n$ and $F$ rise by little ($F$ by at most $1/k$ once left limits are used), so $\sup_x|F_n-F|\le\max_j\big(|F_n(x_{j,k})-F(x_{j,k})|,|F_n(x_{j,k}-)-F(x_{j,k}-)|\big)+1/k$. Finitely many points converge together, then let $k\to\infty$.`,
      caption: String.raw`Left: the empirical distribution function of $n$ seeded samples (blue steps) over the true $F$ (ink); the red bar marks where the gap is largest, $D_n=\sup_x|F_n-F|$. Faint vertical lines are the grid $x_{j,8}$ of the proof. Right (log–log): $D_n$ along one growing seeded sample, with the typical size $0.87/\sqrt n$ (dashed). Atoms (binomial) and heavy tails (Cauchy) make no difference: the theorem needs no assumption on $F$.`,
      deps: ['prob-2.4.1'],
      see: ['stat-1.5', 'stat-1.4'],
      tags: ['empirical distribution', 'law of large numbers'],
      viz(v) {
        const M = v.M;
        const LAWS = {
          norm: { label: 'normal', F: (x) => 0.5 * M.erfc(-x / Math.SQRT2), draw: (r) => r.normal(), x: [-3.5, 3.5], disc: false, Q: (p) => M.dist.normal(0, 1).quantile(p) },
          exp: { label: 'exponential', F: (x) => (x < 0 ? 0 : 1 - Math.exp(-x)), draw: (r) => -Math.log(1 - r()), x: [-0.3, 5], disc: false, Q: (p) => -Math.log(1 - p) },
          bin: { label: 'binomial$(5,0.4)$', F: (x) => M.dist.binomial(5, 0.4).cdf(Math.floor(x + 1e-9)), draw: (r) => { let c = 0; for (let i = 0; i < 5; i++) if (r() < 0.4) c++; return c; }, x: [-0.8, 5.8], disc: true, Q: (p) => { for (let k = 0; k <= 5; k++) if (M.dist.binomial(5, 0.4).cdf(k) >= p) return k; return 5; } },
          cau: { label: 'Cauchy', F: (x) => 0.5 + Math.atan(x) / Math.PI, draw: (r) => Math.tan(Math.PI * (r() - 0.5)), x: [-8, 8], disc: false, Q: (p) => Math.tan(Math.PI * (p - 0.5)) },
        };
        const law = v.select('law', Object.entries(LAWS).map(([value, o]) => ({ value, label: o.label })), 'norm');
        const nS = v.slider('$n$', 10, 10000, 50, { log: true, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 10000, grid = logGrid(10, NMAX, 40);
        const L = v.stage({ x: [-3.5, 3.5], y: [-0.03, 1.03], height: 330, weight: 1.35, axes: 'box', gutter: true, xlabel: '$x$', title: '$F_n$ against $F$' });
        const R = v.stage({ x: [10, NMAX], y: [3e-3, 0.5], xlog: true, ylog: true, height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: '$D_n=\\sup_x|F_n(x)-F(x)|$' });
        let cache = null, st = null;
        const Dn = (Lw, xs) => {
          const s = xs.slice().sort((a, b) => a - b), n = s.length; let D = 0, at = s[0], y0 = 0, y1 = 0;
          if (Lw.disc) { for (let k = 0; k <= 5; k++) { let c = 0; for (const x of s) if (x <= k) c++; const d = Math.abs(c / n - Lw.F(k)); if (d > D) { D = d; at = k; y0 = c / n; y1 = Lw.F(k); } } return { D, at, y0, y1 }; }
          for (let i = 0; i < n; i++) { const Fx = Lw.F(s[i]); const a = (i + 1) / n - Fx, b = Fx - i / n; if (a > D) { D = a; at = s[i]; y0 = (i + 1) / n; y1 = Fx; } if (b > D) { D = b; at = s[i]; y0 = i / n; y1 = Fx; } }
          return { D, at, y0, y1 };
        };
        v.render(() => {
          const Lw = LAWS[law.value], key = law.value + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 17 + 3), xs = Array.from({ length: NMAX }, () => Lw.draw(r));
            cache = { key, xs, path: grid.map((n) => [n, Dn(Lw, xs.slice(0, n)).D]) };
          }
          const n = nS.value, xs = cache.xs.slice(0, n), s = xs.slice().sort((a, b) => a - b);
          L.setView(Lw.x, [-0.03, 1.03]);
          for (let j = 1; j < 8; j++) L.vline(Lw.Q(j / 8), { color: 'muted', width: 1, alpha: 0.35, dash: [3, 3] });
          L.fn(Lw.F, { color: 'ink', width: 2.2, n: 800 });
          const pts = [[Lw.x[0] - 1, 0]]; s.forEach((x, i) => { pts.push([x, i / n], [x, (i + 1) / n]); }); pts.push([Lw.x[1] + 1, 1]);
          L.path(pts, { color: 'accent', width: 1.8 });
          const d = Dn(Lw, xs);
          L.line(d.at, d.y0, d.at, d.y1, { color: 'red', width: 4 });
          L.text('Dₙ', d.at, (d.y0 + d.y1) / 2, { color: 'red', size: 13, dx: 8, plate: true });
          R.fn((x) => 0.87 / Math.sqrt(x), { color: 'muted', dash: [6, 4], width: 1.5 });
          R.path(cache.path, { color: 'accent', width: 2.2 });
          R.dot(n, d.D, { r: 5, color: 'red' });
          v.legend([['ink', '$F$'], ['accent', '$F_n$'], ['red', '$D_n$'], ['muted', '$0.87/\\sqrt n$', { dash: true }]]);
          st = { n, D: d.D, at: d.at, end: cache.path[cache.path.length - 1][1] };
        });
        v.readout(() => st && `$n=${st.n}$: $D_n=${v.fix(st.D, 4)}$ at $x=${v.fix(st.at, 3)}$; $\\ \\sqrt n\\,D_n=${v.fix(Math.sqrt(st.n) * st.D, 3)}$. Along the sample: $D_{10^4}=${v.fix(st.end, 4)}$.`);
      },
    },
    {
      num: '2.4.10',
      kind: 'Theorem',
      name: 'Shannon’s theorem (asymptotic equipartition)',
      credit: 'Shannon, 1948',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. taking values in $\{1,\dots,r\}$ with $P(X_i=k)=p(k)>0$, and let $\pi_n(\omega)=p(X_1(\omega))\cdots p(X_n(\omega))$ be the probability of the observed string. Then
$$-\frac1n\log\pi_n\to H=-\sum_{k=1}^rp(k)\log p(k)\quad\text{a.s.},$$
the **entropy** of the distribution.`,
      idea: String.raw`$-\frac1n\log\pi_n=\frac1n\sum_{i\le n}\big(-\log p(X_i)\big)$ is an average of i.i.d. bounded variables with mean $H$, so the strong law (2.4.1) applies. The consequence is "equipartition": almost all the probability sits on about $e^{nH}$ strings, each of probability about $e^{-nH}$.`,
      caption: String.raw`A loaded die with $p(k)\propto\theta^k$. Left: $-\frac1n\log\pi_n$ (in nats) for 20 seeded strings, settling on $H$ (green). Right: the histogram of the same quantity for 2000 seeded strings of length $n$; it piles up in the band $H\pm0.05$, whose strings number at most $e^{n(H+0.05)}$ although there are $6^n$ strings in all. At $\theta=1$ the die is fair and every string has $\pi_n=6^{-n}$ exactly.`,
      deps: ['prob-2.4.1'],
      see: ['info-3.1'],
      tags: ['information', 'law of large numbers'],
      viz(v) {
        const tS = v.slider('load $\\theta$', 0.3, 1, 0.6, { step: 0.02 });
        const nS = v.slider('right panel: $n$', 10, 1000, 100, { log: true, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 10000, grid = logGrid(1, NMAX, 200);
        const L = v.stage({ x: [1, NMAX], y: [0, 2.6], xlog: true, height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$n$', title: '$-\\frac1n\\log\\pi_n$ along 20 strings' });
        const R = v.stage({ x: [0, 2.6], y: [0, 10], height: 320, axes: 'box', gutter: true, xlabel: '$-\\frac1n\\log\\pi_n$', title: 'its distribution at length $n$' });
        let cache = null, cache2 = null, st = null;
        v.render(() => {
          const th = tS.value, w = [1, 2, 3, 4, 5, 6].map((k) => th ** k), Z = w.reduce((a, b) => a + b, 0), p = w.map((x) => x / Z), cum = [];
          p.reduce((a, b, i) => (cum[i] = a + b), 0);
          const lp = p.map((x) => -Math.log(x)), H = p.reduce((a, x, i) => a + x * lp[i], 0);
          const draw = (r) => { const u = r(); let k = 0; while (k < 5 && u > cum[k]) k++; return k; };
          const key = th + '|' + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 23 + 1), paths = [];
            for (let i = 0; i < 20; i++) { const out = partial(() => lp[draw(r)], grid); paths.push(grid.map((g, k) => out[k] / g)); }
            cache = { key, paths };
          }
          const n = nS.value, key2 = key + '|' + n;
          if (!cache2 || cache2.key !== key2) {
            const r = v.rng(seed * 5 + 77), vals = [];
            for (let i = 0; i < 2000; i++) { let s = 0; for (let j = 0; j < n; j++) s += lp[draw(r)]; vals.push(s / n); }
            cache2 = { key: key2, vals };
          }
          L.hband(H - 0.05, H + 0.05, { color: 'green', alpha: 0.13 });
          L.hline(H, { color: 'green', width: 2, dash: [7, 4] });
          L.hline(Math.log(6), { color: 'muted', width: 1, dash: [3, 3] });
          L.text('log 6', 7000, Math.log(6), { color: 'muted', size: 11, align: 'right', baseline: 'bottom', dy: -3, plate: true });
          cache.paths.forEach((pp) => L.path(grid.map((g, k) => [g, pp[k]]), { color: 'accent', width: 1.1, alpha: 0.6 }));
          const vals = cache2.vals, lo = Math.min(...lp), hi = Math.max(...lp);
          const spread = th === 1 ? 0.05 : Math.max(0.1, Math.max(...vals) - Math.min(...vals));
          const x0 = Math.max(0, Math.min(H - 0.6 * spread - 0.05, Math.min(...vals) - 0.02)), x1 = Math.max(H + 0.6 * spread + 0.05, Math.max(...vals) + 0.02);
          const Hh = v.M.histogram(vals, { bins: 40, range: th === 1 ? [H - 0.1, H + 0.1] : [x0, x1] });
          const ymax = Math.max(...Hh.density) * 1.15;
          R.setView(th === 1 ? [H - 0.1, H + 0.1] : [x0, x1], [0, ymax]);
          R.vband(H - 0.05, H + 0.05, { color: 'green', alpha: 0.13 });
          R.hist(Hh, { density: true, color: 'accent', fillAlpha: 0.4 });
          R.vline(H, { color: 'green', width: 2, dash: [7, 4] });
          const inside = vals.filter((x) => Math.abs(x - H) < 0.05).length / vals.length;
          v.legend([['accent', '$-\\frac1n\\log\\pi_n$'], ['green', '$H$ and the band $H\\pm0.05$', { area: true }]]);
          st = { H, p, inside, n, lo, hi };
        });
        v.readout(() => st && `$p=(${st.p.map((x) => v.fix(x, 3)).join(',')})$, $\\ H=${v.fix(st.H, 4)}$ nats ($\\log6=1.7918$). At $n=${st.n}$: $${v.fix(st.inside * 100, 1)}\\%$ of strings fall in $H\\pm0.05$; such strings number at most $e^{n(H+0.05)}=e^{${v.fix(st.n * (st.H + 0.05), 0)}}$ out of $6^n=e^{${v.fix(st.n * Math.log(6), 0)}}$.`);
      },
    },
    // ======================================================================== §2.5 Convergence of random series
    {
      num: '2.5.1a',
      kind: 'Definition',
      name: 'Tail σ-field',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §2.5, p. 81 (tail field and Examples 2.5.1–2.5.2)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`Given random variables $X_1,X_2,\dots$, let $\mathcal F_n'=\sigma(X_n,X_{n+1},\dots)$ be the information in the future after time $n$. The **tail σ-field** is
$$\mathcal T=\bigcap_{n\ge1}\mathcal F_n'.$$
Its events are those whose occurrence is not changed by altering any finite number of the $X_i$. Examples, with $S_n=X_1+\dots+X_n$: $\{X_n\in B_n\text{ i.o.}\}$, $\{\lim_nS_n\text{ exists}\}$, $\{\limsup_nS_n/c_n>x\}$ when $c_n\to\infty$. Not tail: $\{S_{10}>0\}$, and in general $\{\limsup S_n>0\}$.`,
      idea: String.raw`An event belongs to $\mathcal F_n'$ when it can be decided from $X_n,X_{n+1},\dots$ alone; it belongs to $\mathcal T$ when this holds for every $n$. Changing $X_1,\dots,X_k$ shifts every later partial sum by the same constant, which is invisible to anything divided by $c_n\to\infty$, or to convergence, but not to the sign of $S_n$ itself.`,
      caption: String.raw`Top: the first 60 coin values of $\omega$ (upper row) and of $\omega'$, which agrees with $\omega$ except that its first $k$ coins are resampled (orange). Bottom: the walks $S_n(\omega)$ and $S_n(\omega')$ run parallel from time $k$ on, a constant apart. The readout evaluates a few events on both, with $N=4000$. The tail events are judged by proxies that read only $X_n$ for $n\ge N/2$, as a tail event must be decidable from the far future, so they always agree; the others need not, and $\{S_n>0\text{ i.o.}\}$ can flip because the shift moves the walk across $0$.`,
      deps: ['prob-1.3.1a'],
      tags: ['zero-one laws', 'sigma-fields'],
      viz(v) {
        const kS = v.slider('resample the first $k$ coins', 0, 60, 20, { int: true });
        let seed = 3; v.button('Resample', () => { seed++; });
        const N = 4000;
        const T = v.stage({ x: [0, 60], y: [0, 2.3], height: 120, full: true, axes: false, title: 'coins of $\\omega$ (top) and $\\omega\'$ (bottom)' });
        const B = v.stage({ x: [0, N], y: [-120, 120], height: 280, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: '$S_n(\\omega)$ (blue) and $S_n(\\omega\')$ (orange)' });
        let st = null;
        v.render(() => {
          const k = kS.value, r = v.rng(seed * 101), r2 = v.rng(seed * 7 + 5);
          const X = Array.from({ length: N }, () => sgn(r)), Y = X.map((x, i) => (i < k ? sgn(r2) : x));
          for (let i = 0; i < 60; i++) {
            T.rect(i + 0.1, 1.25, i + 0.9, 2.15, { fill: X[i] > 0 ? 'accent' : 'faint', fillAlpha: 0.8, stroke: false, radius: 2 });
            T.rect(i + 0.1, 0.15, i + 0.9, 1.05, { fill: Y[i] > 0 ? 'accent' : 'faint', fillAlpha: 0.8, stroke: i < k, color: 'orange', width: 2, radius: 2 });
          }
          const S = [0], S2 = [0]; for (let i = 0; i < N; i++) { S.push(S[i] + X[i]); S2.push(S2[i] + Y[i]); }
          const ext = Math.max(40, ...S.map(Math.abs), ...S2.map(Math.abs)) * 1.1;
          B.setView(null, [-ext, ext]);
          B.hline(0, { color: 'muted', width: 1 });
          if (k) B.vband(0, k, { color: 'orange', alpha: 0.12 });
          B.path(S.map((s, i) => [i, s]), { color: 'accent', width: 1.4 });
          B.path(S2.map((s, i) => [i, s]), { color: 'orange', width: 1.4 });
          const c = S2[N] - S[N];
          const ev = (A) => [A(S, X), A(S2, Y)];
          const H2 = N / 2;
          const lim = (SS) => Math.abs((SS[N] - SS[H2]) / N) < 0.05;
          const io = (SS, XX) => XX.slice(H2).some((x) => x > 0);
          const ser = (SS, XX) => { let t = 0, m = 0; for (let n = H2; n < N; n++) { t += XX[n] / (n + 1); m = Math.max(m, Math.abs(t)); } return m < 0.05; };
          st = { k, c, e10: ev((SS) => SS[10] > 0), e1: ev((SS, XX) => XX[0] > 0), elim: ev(lim), eio: ev(io), eser: ev(ser), epos: ev((SS) => { for (let n = H2; n <= N; n++) if (SS[n] > 0) return true; return false; }) };
          v.legend([['accent', '$\\omega$'], ['orange', '$\\omega\'$ (first $k$ coins resampled)']]);
        });
        const yn = (b) => (b ? '\\text{yes}' : '\\text{no}');
        const row = (name, e, tail) => `${name}: $${yn(e[0])}$ / $${yn(e[1])}$${e[0] === e[1] ? '' : ' (differ)'}${tail ? ' — tail' : ''}`;
        v.readout(() => st && `After time $k=${st.k}$ the walks differ by the constant $${st.c}$. Event: $\\omega$ / $\\omega'$\n` + [row('$\\{S_{10}>0\\}$', st.e10, false), row('$\\{X_1=+1\\}$', st.e1, false), row('$\\{S_n>0$ i.o.$\\}$ (some $S_n>0$, $n\\in[N/2,N]$)', st.epos, false), row('$\\{X_n=+1$ i.o.$\\}$ (some $X_n=+1$, $n\\in[N/2,N]$)', st.eio, true), row('$\\{S_n/n\\to0\\}$ ($|S_N-S_{N/2}|/N<0.05$)', st.elim, true), row('$\\{\\sum X_n/n$ converges$\\}$ (tail moves $<0.05$ on $[N/2,N]$)', st.eser, true)].join('\n'));
      },
    },
    {
      num: '2.5.3',
      kind: 'Theorem',
      name: 'Kolmogorov’s 0-1 law',
      credit: 'Kolmogorov, 1933',
      statement: String.raw`If $X_1,X_2,\dots$ are independent and $A$ belongs to the tail σ-field $\mathcal T$, then $P(A)=0$ or $P(A)=1$.`,
      idea: String.raw`Show $A$ is independent of itself, so $P(A)=P(A)^2$. For each $k$, $A\in\sigma(X_{k+1},\dots)$, which is independent of $\sigma(X_1,\dots,X_k)$ (grouping, Theorem 2.1.9's corollaries). Hence $A$ is independent of the union of the $\sigma(X_1,\dots,X_k)$, a π-system generating $\sigma(X_1,X_2,\dots)$, so by the π-λ theorem (2.1.7) it is independent of $\sigma(X_1,X_2,\dots)$, which contains $A$ itself.`,
      caption: String.raw`The random series $\sum_n\pm n^{-s}$ with independent fair signs; convergence is a tail event, so it has probability $0$ or $1$ for each $s$ (by 2.5.6 and its converse, the switch is at $s=1/2$). Left: 30 seeded partial-sum paths for the chosen $s$. Right: for each $s$, the fraction of 120 seeded series that already look settled at scale $N$ (largest move of the partial sums between $N$ and $4N$ below $1$). As $N$ grows the curves steepen and slide towards the step at $s=1/2$; no intermediate value survives.`,
      deps: ['prob-2.5.1a', 'prob-2.1.9', 'prob-2.1.7'],
      see: ['prob-2.5.6'],
      tags: ['zero-one laws'],
      viz(v) {
        const sS = v.slider('$s$', 0.2, 1.2, 0.45, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 16384, P = 120, SV = Array.from({ length: 21 }, (_, i) => 0.2 + 0.05 * i), NS = [16, 128, 1024, 4096], grid = logGrid(1, NMAX, 200);
        const L = v.stage({ x: [1, NMAX], y: [-4, 4], xlog: true, height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', title: 'partial sums of $\\sum\\pm n^{-s}$' });
        const R = v.stage({ x: [0.2, 1.2], y: [-0.03, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$s$', title: 'fraction settled at scale $N$' });
        let cache = null, st = null;
        v.render(() => {
          if (!cache || cache.seed !== seed) {
            const r = v.rng(seed * 59 + 3), signs = Array.from({ length: P }, () => { const a = new Int8Array(NMAX + 1); for (let n = 1; n <= NMAX; n++) a[n] = sgn(r); return a; });
            const frac = NS.map(() => new Float64Array(SV.length));
            SV.forEach((s, si) => {
              const pw = new Float64Array(NMAX + 1); for (let n = 1; n <= NMAX; n++) pw[n] = n ** -s;
              for (const sg of signs) {
                let S = 0; const Sn = new Float64Array(NMAX + 1);
                for (let n = 1; n <= NMAX; n++) { S += sg[n] * pw[n]; Sn[n] = S; }
                NS.forEach((N, j) => { let m = 0; for (let n = N + 1; n <= 4 * N; n++) m = Math.max(m, Math.abs(Sn[n] - Sn[N])); if (m < 1) frac[j][si] += 1 / P; });
              }
            });
            cache = { seed, signs, frac };
          }
          const s = sS.value;
          cache.signs.slice(0, 30).forEach((sg) => { const out = partial((n) => sg[n] * n ** -s, grid); L.path(grid.map((g, k) => [g, clampN(out[k], -4.4, 4.4)]), { color: s > 0.5 ? 'accent' : 'red', width: 1, alpha: 0.55 }); });
          L.hline(0, { color: 'muted', width: 1 });
          R.vline(0.5, { color: 'muted', dash: [5, 4], width: 1.4 });
          R.path([[0.2, 0], [0.5, 0], [0.5, 1], [1.2, 1]], { color: 'green', width: 1.5, dash: [3, 3] });
          const cols = ['faint', 'purple', 'orange', 'accent'];
          NS.forEach((N, j) => R.path(SV.map((x, i) => [x, cache.frac[j][i]]), { color: cols[j], width: 2.2 }));
          R.vline(s, { color: 'gold', width: 1.5 });
          v.legend([...NS.map((N, j) => [cols[j], `$N=${N}$`]), ['green', 'limit: $1\\{s>1/2\\}$', { dash: true }]]);
          const si = Math.round((s - 0.2) / 0.05);
          st = { s, f: NS.map((N, j) => cache.frac[j][si]), sum: s > 0.5 ? 'converges' : 'diverges' };
        });
        v.readout(() => st && `$s=${v.fix(st.s, 2)}$: $\\sum n^{-2s}$ ${st.s > 0.5 ? 'converges, so the series converges a.s.' : 'diverges, so the series diverges a.s.'} Fraction settled at $N=16,128,1024,4096$: ${st.f.map((x) => v.fix(x, 2)).join(', ')}.`);
      },
    },
    {
      num: '2.5.3a',
      kind: 'Definition',
      name: 'Exchangeable σ-field',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), §2.5, p. 82 (permutable events and exchangeable field)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`A **finite permutation** of $\mathbb N$ is a bijection $\pi$ with $\pi(i)\ne i$ for only finitely many $i$. An event $A\in\sigma(X_1,X_2,\dots)$ is **permutable** (exchangeable) if rearranging finitely many of the $X_i$ never changes whether it occurs: $A=\{(X_{\pi(1)},X_{\pi(2)},\dots)\in B\}$ whenever $A=\{(X_1,X_2,\dots)\in B\}$, for every finite permutation $\pi$. The permutable events form the **exchangeable σ-field** $\mathcal E$. Every tail event is permutable, so $\mathcal T\subset\mathcal E$, but not conversely: $\{S_n\ge0\text{ i.o.}\}$ is permutable and not a tail event.`,
      idea: String.raw`A permutation of the first $n$ coordinates leaves $S_m$ unchanged for every $m\ge n$, so anything decided by the tail of the sequence $S_m$ is permutable. Changing coordinates (as in the tail σ-field) moves all later $S_m$ by a constant, which can flip an event like $\{S_m\ge0\text{ i.o.}\}$.`,
      caption: String.raw`A seeded $\pm1$ walk (blue) and the walk after an operation on its first $n$ steps (orange). Shuffling them changes the path only before time $n$: from $n$ on the two coincide, so $\{S_m\ge0\text{ i.o.}\}$ (proxy: some $S_m\ge0$ with $m\in[3000,4000]$) is decided identically. Setting the first $n$ steps to $-1$ instead shifts the whole future down, and that event can flip, so it is not a tail event, whereas $\{S_m/m\to0\}$ survives both operations.`,
      deps: ['prob-2.2.3a', 'prob-2.5.1a'],
      tags: ['zero-one laws', 'exchangeability'],
      viz(v) {
        const op = v.select('operation on the first $n$ steps', [{ value: 'perm', label: 'shuffle them' }, { value: 'set', label: 'set them to $-1$' }], 'perm');
        const nS = v.slider('$n$', 10, 1000, 300, { int: true, log: true });
        let seed = 11; v.button('Resample', () => { seed++; });
        const N = 4000;
        const S = v.stage({ x: [0, N], y: [-100, 100], height: 340, full: true, axes: 'box', gutter: true, xlabel: '$m$', title: 'the walk $S_m$ before (blue) and after (orange) the operation' });
        let st = null;
        v.render(() => {
          const n = nS.value, r = v.rng(seed * 13 + 1), X = Array.from({ length: N }, () => sgn(r));
          let Y;
          if (op.value === 'perm') { const rr = v.rng(seed * 3 + 9); Y = [...rr.shuffle(X.slice(0, n)), ...X.slice(n)]; } else Y = X.map((x, i) => (i < n ? -1 : x));
          const A = [0], B = [0]; for (let i = 0; i < N; i++) { A.push(A[i] + X[i]); B.push(B[i] + Y[i]); }
          const ext = Math.max(50, ...A.map(Math.abs), ...B.map(Math.abs)) * 1.08;
          S.setView(null, [-ext, ext]);
          S.hband(0, ext * 2, { color: 'green', alpha: 0.06 });
          S.vband(3000, 4000, { color: 'gold', alpha: 0.1 });
          S.vband(0, n, { color: 'orange', alpha: 0.1 });
          S.hline(0, { color: 'muted', width: 1 });
          S.path(B.map((s, i) => [i, s]), { color: 'orange', width: 1.6 });
          S.path(A.map((s, i) => [i, s]), { color: 'accent', width: 1.3, alpha: op.value === 'perm' ? 0.85 : 1 });
          S.text('window for "i.o."', 3500, -ext * 0.9, { color: 'gold', size: 11, align: 'center' });
          const pos = (SS) => { for (let m = 3000; m <= N; m++) if (SS[m] >= 0) return true; return false; };
          st = { n, same: A.slice(n).every((x, i) => x === B[n + i]), pa: pos(A), pb: pos(B), la: Math.abs((A[N] - A[N / 2]) / N) < 0.05, lb: Math.abs((B[N] - B[N / 2]) / N) < 0.05, shift: B[N] - A[N] };
          v.legend([['accent', 'original walk'], ['orange', op.value === 'perm' ? 'first $n$ steps shuffled' : 'first $n$ steps set to $-1$'], ['gold', 'window $[3000,4000]$', { area: true }]]);
        });
        const yn = (b) => (b ? 'yes' : 'no');
        v.readout(() => st && (st.same ? `The two walks coincide from $m=${st.n}$ on.` : `From $m=${st.n}$ on the second walk is shifted by $${st.shift}$.`) + ` "$S_m\\ge0$ i.o." (proxy): ${yn(st.pa)} / ${yn(st.pb)}${st.pa === st.pb ? '' : ' (flipped!)'}. "$S_m/m\\to0$" (proxy $|S_N-S_{N/2}|/N<0.05$, reading only the second half): ${yn(st.la)} / ${yn(st.lb)}.`);
      },
    },
    {
      num: '2.5.4',
      kind: 'Theorem',
      name: 'Hewitt–Savage 0-1 law',
      credit: 'Hewitt and Savage, 1956 (Durrett bibliography)',
      refs: ['Durrett, Probability: Theory and Examples, version 5 (11 January 2019), Theorem 2.5.4 and proof, pp. 82–83; bibliography (Hewitt and Savage, 1956)'],
      links: { source: 'https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf' },
      statement: String.raw`If $X_1,X_2,\dots$ are i.i.d. and $A$ belongs to the exchangeable σ-field $\mathcal E$, then $P(A)\in\{0,1\}$.`,
      idea: String.raw`Approximate $A$ by an event $A_n\in\sigma(X_1,\dots,X_n)$ with $P(A\,\triangle\,A_n)\to0$. Let $\pi$ swap the blocks $1,\dots,n$ and $n+1,\dots,2n$; since the $X_i$ are i.i.d. the swap preserves $P$, it fixes $A$ (permutable), and it turns $A_n$ into an event $A_n'\in\sigma(X_{n+1},\dots,X_{2n})$ independent of $A_n$ with $P(A\triangle A_n')=P(A\triangle A_n)$. Then $P(A)\approx P(A_n\cap A_n')=P(A_n)^2\approx P(A)^2$, so $P(A)=P(A)^2$. Kolmogorov's law (2.5.3) cannot be used directly because $\{S_n\ge0\text{ i.o.}\}$ is not a tail event.`,
      caption: String.raw`Gaussian steps with drift $d$. Left: 20 seeded walks for the chosen $d$. Right: the estimated probability of $\{S_m\ge0$ for some $m\in[N,64N]\}$, a finite-window proxy for the exchangeable event $\{S_m\ge0\text{ i.o.}\}$, from 200 seeded walks, as a function of $d$. As $N$ grows the curve sharpens towards a jump from $0$ to $1$ at $d=0$ (at $d=0$ the walk is recurrent and the event has probability $1$).`,
      deps: ['prob-2.5.3a', 'prob-2.5.3'],
      tags: ['zero-one laws', 'exchangeability'],
      viz(v) {
        const dS = v.slider('drift $d$', -0.3, 0.3, -0.05, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const H = 16384, P = 200, NS = [4, 16, 64, 256], DV = Array.from({ length: 41 }, (_, i) => -0.3 + 0.015 * i);
        const L = v.stage({ x: [0, 1024], y: [-60, 60], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$m$', title: 'walks with drift $d$' });
        const R = v.stage({ x: [-0.3, 0.3], y: [-0.03, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$d$', title: 'P($S_m\\ge0$ for some $m\\in[N,64N]$)' });
        let cache = null, st = null;
        v.render(() => {
          if (!cache || cache.seed !== seed) {
            const r = v.rng(seed * 37 + 5), W = [];
            for (let p = 0; p < P; p++) { const w = new Float64Array(H + 1); for (let m = 1; m <= H; m++) w[m] = w[m - 1] + r.normal(); W.push(w); }
            // the event {W_m + d m >= 0 for some m in [N, 64N]} is increasing in d: it holds iff d >= min_m (-W_m/m)
            const est = NS.map((N) => { const th = W.map((w) => { let t = Infinity; for (let m = N; m <= 64 * N; m++) t = Math.min(t, -w[m] / m); return t; }); return th; });
            const ths = est.slice(); for (let j = 0; j < est.length; j++) est[j] = DV.map((d) => ths[j].filter((t) => d >= t).length / P);
            cache = { seed, W, est, ths };
          }
          const d = dS.value;
          L.hband(0, 200, { color: 'green', alpha: 0.07 });
          L.hline(0, { color: 'muted', width: 1 });
          cache.W.slice(0, 20).forEach((w) => { const pts = []; for (let m = 0; m <= 1024; m += 4) pts.push([m, clampN(w[m] + d * m, -70, 70)]); L.path(pts, { color: 'accent', width: 1, alpha: 0.55 }); });
          L.fn((m) => d * m, { color: 'orange', width: 2, dash: [6, 4] });
          R.path([[-0.3, 0], [0, 0], [0, 1], [0.3, 1]], { color: 'green', width: 1.5, dash: [3, 3] });
          const cols = ['faint', 'purple', 'orange', 'accent'];
          NS.forEach((N, j) => R.path(DV.map((x, i) => [x, cache.est[j][i]]), { color: cols[j], width: 2.3 }));
          R.vline(d, { color: 'gold', width: 1.5 });
          v.legend([['orange', 'drift line $dm$', { dash: true }], ...NS.map((N, j) => [cols[j], `$N=${N}$`]), ['green', 'limit', { dash: true }]]);
          st = { d, est: cache.ths.map((th) => th.filter((t) => d >= t).length / P) };
        });
        v.readout(() => st && `$d=${v.fix(st.d, 2)}$: estimates for $N=4,16,64,256$: ${st.est.map((x) => v.fix(x, 2)).join(', ')}. The true probability of $\\{S_m\\ge0\\text{ i.o.}\\}$ is $${st.d < 0 ? 0 : 1}$` + (st.d < 0 ? ' (the walk drifts to $-\\infty$).' : st.d > 0 ? ' (it drifts to $+\\infty$).' : ' (recurrence of a mean-zero walk).'));
      },
    },
    {
      num: '2.5.5',
      kind: 'Theorem',
      name: 'Kolmogorov’s maximal inequality',
      credit: 'Kolmogorov, 1928',
      statement: String.raw`Let $X_1,\dots,X_n$ be independent with $EX_i=0$ and $\operatorname{var}(X_i)<\infty$, and $S_k=X_1+\dots+X_k$. Then for $x>0$
$$P\Big(\max_{1\le k\le n}|S_k|\ge x\Big)\le\frac{\operatorname{var}(S_n)}{x^2}.$$
The bound is the same as Chebyshev's for $|S_n|$ alone, yet it controls the whole path.`,
      idea: String.raw`Split according to the first time $k$ with $|S_k|\ge x$: $A_k=\{|S_k|\ge x,\ |S_j|<x\text{ for }j<k\}$. Then $ES_n^2\ge\sum_kE(S_n^2;A_k)$, and writing $S_n=S_k+(S_n-S_k)$ the cross term $E\big(S_k1_{A_k}(S_n-S_k)\big)$ vanishes by independence (Theorem 2.1.13's product rule) and mean zero. So $E(S_n^2;A_k)\ge E(S_k^2;A_k)\ge x^2P(A_k)$; sum over $k$.`,
      caption: String.raw`Left: 60 of 4000 seeded walks of $n$ steps with the barrier $\pm x$ (drag the gold handle); walks whose running maximum of $|S_k|$ reaches $x$ are red, with the first crossing marked. Right, as functions of $x$: the fraction of walks whose maximum crosses (gold), the fraction with $|S_n|\ge x$ at the end only (teal), and the bound $\operatorname{var}(S_n)/x^2$ (blue). Gold always lies under blue, even though it is up to twice teal. The last option has unequal variances.`,
      deps: ['prob-2.1.13', 'prob-1.6.4'],
      tags: ['maximal inequalities'],
      viz(v) {
        const STEP = {
          coin: { label: '$\\pm1$', draw: (r) => sgn(r), var: () => 1 },
          unif: { label: 'uniform', draw: (r) => (2 * r() - 1) * Math.sqrt(3), var: () => 1 },
          grow: { label: 'growing variances', draw: (r, k, n) => r.normal() * Math.sqrt((2 * k) / n), var: (k, n) => (2 * k) / n },
        };
        const law = v.select('steps', Object.entries(STEP).map(([value, o]) => ({ value, label: o.label })), 'coin');
        const nS = v.slider('$n$', 10, 400, 100, { int: true });
        const W = 4000;
        const L = v.stage({ x: [0, 100], y: [-30, 30], height: 330, weight: 1.3, axes: 'box', gutter: true, xlabel: '$k$', title: 'walks and the barrier $\\pm x$' });
        const R = v.stage({ x: [0, 3.5], y: [0, 1.05], height: 330, axes: 'box', gutter: true, xlabel: '$x/\\mathrm{sd}(S_n)$', title: 'probabilities against the bound' });
        const Hd = L.handle(100, 15, { color: 'gold', label: 'x', labelPos: 'e', constrain: (x, y) => [L.xr[1], clampN(y, 0.5, 200)] });
        let cache = null, st = null;
        v.render(() => {
          const Lw = STEP[law.value], n = nS.value, key = law.value + n;
          let vS = 0; for (let k = 1; k <= n; k++) vS += Lw.var(k, n);
          const sd = Math.sqrt(vS);
          if (!cache || cache.key !== key) {
            const r = v.rng(71), mx = new Float64Array(W), en = new Float64Array(W), paths = [];
            for (let w = 0; w < W; w++) { let s = 0, m = 0; const pth = w < 60 ? [[0, 0]] : null; for (let k = 1; k <= n; k++) { s += Lw.draw(r, k, n); m = Math.max(m, Math.abs(s)); if (pth) pth.push([k, s]); } mx[w] = m; en[w] = Math.abs(s); if (pth) paths.push(pth); }
            cache = { key, mx: Array.from(mx).sort((a, b) => a - b), en: Array.from(en).sort((a, b) => a - b), paths };
            Hd.set(n, 1.5 * sd);
          }
          const ylim = 4 * sd; L.setView([0, n], [-ylim, ylim]);
          const x = clampN(Hd.y, 0.05 * sd, ylim); Hd.x = n;
          if (x < ylim) { L.rect(0, x, n, ylim, { fill: 'red', fillAlpha: 0.07, stroke: false }); L.rect(0, -ylim, n, -x, { fill: 'red', fillAlpha: 0.07, stroke: false }); }
          L.hline(x, { color: 'gold', width: 1.6 }); L.hline(-x, { color: 'gold', width: 1.6 });
          let crossed = 0;
          cache.paths.forEach((pth) => { const i = pth.findIndex((p) => Math.abs(p[1]) >= x); if (i >= 0) crossed++; L.path(pth, { color: i >= 0 ? 'red' : 'accent', width: 1, alpha: i >= 0 ? 0.75 : 0.35 }); if (i >= 0) L.dot(pth[i][0], pth[i][1], { r: 2.6, color: 'red' }); });
          const surv = (arr, t) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < t) lo = m + 1; else hi = m; } return (arr.length - lo) / arr.length; };
          R.fn((u) => Math.min(1.2, 1 / (u * u)), { domain: [0.3, 3.5], color: 'accent', width: 2.4 });
          R.fn((u) => surv(cache.mx, u * sd), { domain: [0, 3.5], color: 'gold', width: 2.4, n: 300 });
          R.fn((u) => surv(cache.en, u * sd), { domain: [0, 3.5], color: 'teal', width: 2, n: 300 });
          R.vline(x / sd, { color: 'gold', dash: [4, 3], width: 1 });
          v.legend([['gold', '$P(\\max_k|S_k|\\ge x)$'], ['teal', '$P(|S_n|\\ge x)$'], ['accent', '$\\operatorname{var}(S_n)/x^2$']]);
          st = { x, sd, pm: surv(cache.mx, x), pe: surv(cache.en, x), b: vS / (x * x), crossed };
        });
        v.readout(() => st && `$x=${v.fix(st.x, 2)}$ ($=${v.fix(st.x / st.sd, 2)}$ s.d.): $P(\\max|S_k|\\ge x)\\approx${v.fix(st.pm, 3)}\\le\\operatorname{var}(S_n)/x^2=${v.fix(st.b, 3)}$; for comparison $P(|S_n|\\ge x)\\approx${v.fix(st.pe, 3)}$. Red walks: ${st.crossed} of 60.`);
      },
    },
    {
      num: '2.5.6',
      kind: 'Theorem',
      name: 'Σ var(Xₙ) < ∞ ⇒ Σ Xₙ converges a.s.',
      statement: String.raw`Let $X_1,X_2,\dots$ be independent with $EX_n=0$. If $\sum_n\operatorname{var}(X_n)<\infty$, then $\sum_nX_n(\omega)$ converges for almost every $\omega$.`,
      idea: String.raw`Show the partial sums are Cauchy a.s. Kolmogorov's maximal inequality (2.5.5) applied to $X_{M+1},\dots,X_N$ gives $P\big(\max_{M<m\le N}|S_m-S_M|>\eps\big)\le\eps^{-2}\sum_{m>M}\operatorname{var}(X_m)$; let $N\to\infty$, then $M\to\infty$. So $w_M=\sup_{m,n>M}|S_m-S_n|\to0$ in probability; since $w_M$ decreases, it tends to $0$ a.s.`,
      caption: String.raw`Random signs: $X_n=\pm n^{-s}$, so $\operatorname{var}(X_n)=n^{-2s}$ and the sum is finite exactly when $s>1/2$ ($s=1$ is the random harmonic series). Left: 30 seeded partial-sum paths. Right (log–log), against $M$: the maximal-inequality bound for a move of more than $\eps$ after time $M$ (purple) and the observed fraction of 100 seeded paths that make such a move before $2^{15}$ (gold). For $s\le1/2$ the bound is infinite and the paths keep wandering.`,
      deps: ['prob-2.5.5'],
      see: ['prob-2.5.8'],
      tags: ['random series'],
      viz(v) {
        const sS = v.slider('$s$ in $X_n=\\pm n^{-s}$', 0.3, 1.2, 0.8, { step: 0.02 });
        const eS = v.slider('$\\eps$', 0.05, 1, 0.2, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 32768, P = 100, grid = logGrid(1, NMAX, 200), Ms = logGrid(1, NMAX / 4, 40);
        const L = v.stage({ x: [1, NMAX], y: [-3, 3], xlog: true, height: 320, weight: 1.25, axes: 'box', gutter: true, xlabel: '$n$', title: 'partial sums $S_n$' });
        const R = v.stage({ x: [1, NMAX / 4], y: [1e-3, 10], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$M$', title: 'P(a move $>\\eps$ after $M$)' });
        let cache = null, st = null;
        v.render(() => {
          const s = sS.value, eps = eS.value, key = s + '|' + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 43 + 1), paths = [], osc = [];
            for (let p = 0; p < P; p++) {
              const Sn = new Float64Array(NMAX + 1); for (let n = 1; n <= NMAX; n++) Sn[n] = Sn[n - 1] + sgn(r) * n ** -s;
              if (p < 30) paths.push(grid.map((g) => Sn[g]));
              // suffix max/min of S beyond each M
              const sup = new Float64Array(NMAX + 2).fill(-Infinity), inf = new Float64Array(NMAX + 2).fill(Infinity);
              for (let n = NMAX; n >= 1; n--) { sup[n] = Math.max(sup[n + 1], Sn[n]); inf[n] = Math.min(inf[n + 1], Sn[n]); }
              osc.push(Ms.map((M) => Math.max(sup[M + 1] - Sn[M], Sn[M] - inf[M + 1])));
            }
            cache = { key, paths, osc };
          }
          const ext = Math.max(1, ...cache.paths.map((pp) => Math.max(...pp.map(Math.abs)))) * 1.1;
          L.setView(null, [-Math.min(ext, 8), Math.min(ext, 8)]);
          L.hline(0, { color: 'muted', width: 1 });
          cache.paths.forEach((pp) => L.path(grid.map((g, k) => [g, pp[k]]), { color: s > 0.5 ? 'accent' : 'red', width: 1, alpha: 0.55 }));
          const tail = (M) => { if (s <= 0.5) return Infinity; let t = 0; const K = 100000; for (let n = M + 1; n <= K; n++) t += n ** (-2 * s); return t + K ** (1 - 2 * s) / (2 * s - 1); };
          if (s > 0.5) { R.path(Ms.map((M) => [M, tail(M) / (eps * eps)]), { color: 'purple', width: 2.4 }); R.hline(1, { color: 'muted', dash: [4, 4], width: 1 }); }
          else cornerIn(R, '$\\sum\\operatorname{var}(X_n)=\\infty$: no bound', 'tr', { color: 'red' });
          const frac = Ms.map((M, j) => [M, cache.osc.filter((o) => o[j] > eps).length / P]);
          R.path(frac.map(([M, f]) => [M, f > 0 ? f : null]), { color: 'gold', width: 2.2 });
          v.legend([[s > 0.5 ? 'accent' : 'red', '$S_n$'], ['purple', '$\\eps^{-2}\\sum_{n>M}\\operatorname{var}(X_n)$'], ['gold', 'observed fraction']]);
          st = { s, tot: s > 0.5 ? tail(0) : Infinity, f: frac[Math.floor(Ms.length / 2)], spread: Math.max(...cache.paths.map((pp) => pp[pp.length - 1])) - Math.min(...cache.paths.map((pp) => pp[pp.length - 1])) };
        });
        v.readout(() => st && `$\\sum_n\\operatorname{var}(X_n)=\\sum n^{-2s}=${isFinite(st.tot) ? v.fix(st.tot, 3) : '\\infty'}$. Observed chance of a move $>\\eps$ after $M=${st.f[0]}$: $${v.fix(st.f[1], 2)}$. Spread of the 30 limits $S_{32768}$: $${v.fix(st.spread, 2)}$` + (st.s > 0.5 ? ' (each path has its own random limit).' : ' (and growing like $n^{1/2-s}$).'));
      },
    },
    {
      num: '2.5.8',
      kind: 'Theorem',
      name: 'Kolmogorov’s three-series theorem',
      credit: 'Kolmogorov, 1928',
      statement: String.raw`Let $X_1,X_2,\dots$ be independent, fix $A>0$ and let $Y_n=X_n1(|X_n|\le A)$. Then $\sum_nX_n$ converges a.s. if and only if all three series converge:

(i) $\sum_nP(|X_n|>A)$; (ii) $\sum_nEY_n$; (iii) $\sum_n\operatorname{var}(Y_n)$.

(If the three series converge for one $A$, the series $\sum X_n$ converges; the converse is proved later in Durrett with the central limit theorem.)`,
      idea: String.raw`Sufficiency: by (iii) and Theorem 2.5.6, $\sum(Y_n-EY_n)$ converges a.s.; adding (ii) makes $\sum Y_n$ converge; by (i) and Borel–Cantelli (2.3.1), $X_n=Y_n$ for all large $n$, so $\sum X_n$ converges too. Necessity: if (i) fails, $|X_n|>A$ infinitely often by the second Borel–Cantelli lemma, and the terms do not tend to $0$; if (iii) fails, a central-limit argument shows the centred sums of the $Y_n$ cannot converge.`,
      caption: String.raw`Choose a family and the exponent $s$. Right (log–log): the three series computed exactly (with $A=1$, or $A=2$ for the shifted signs) as partial sums up to $N$: a curve that flattens is a convergent series, one that keeps climbing diverges. Left: 20 seeded partial-sum paths of $\sum X_n$. Random signs $\pm1/n$ (the random harmonic series, $s=1$) converge; Cauchy terms $C_n n^{-s}$ need $s>1$ through series (i) and (iii); the shifted signs $\pm1/n+n^{-s}$ fail through series (ii) alone when $s\le1$.`,
      deps: ['prob-2.5.6', 'prob-2.3.1'],
      see: ['prob-3.4.10'],
      tags: ['random series'],
      viz(v) {
        const FAM = {
          sign: { label: 'signs $\\pm n^{-s}$', A: 1, draw: (r, n, s) => sgn(r) * n ** -s, ser: (n, s) => [0, 0, n ** (-2 * s)] },
          cau: { label: 'Cauchy $C_n n^{-s}$', A: 1, draw: (r, n, s) => Math.tan(Math.PI * (r() - 0.5)) * n ** -s, ser: (n, s) => { const c = n ** -s, b = 1 / c; return [1 - (2 / Math.PI) * Math.atan(b), 0, c * c * (2 / Math.PI) * (b - Math.atan(b))]; } },
          shift: { label: 'shifted signs $\\pm\\frac1n+n^{-s}$', A: 2, draw: (r, n, s) => sgn(r) / n + n ** -s, ser: (n, s) => [0, n ** -s, 1 / (n * n)] },
          bern: { label: 'coins: $1$ w.p. $n^{-s}$', A: 0.5, draw: (r, n, s) => (r() < n ** -s ? 1 : 0), ser: (n, s) => [n ** -s, 0, 0] },
        };
        const fam = v.select('terms', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'sign');
        const sS = v.slider('$s$', 0.3, 1.6, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 100000, grid = logGrid(1, NMAX, 160);
        const L = v.stage({ x: [1, NMAX], y: [-3, 3], xlog: true, height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', title: 'partial sums of $\\sum X_n$' });
        const R = v.stage({ x: [1, NMAX], y: [1e-3, 1e3], xlog: true, ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$N$', title: 'the three series up to $N$' });
        let cache = null, st = null;
        v.render(() => {
          const F = FAM[fam.value], s = sS.value, key = fam.value + s + '|' + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 31 + 17), paths = [];
            for (let p = 0; p < 20; p++) paths.push(partial((n) => F.draw(r, n, s), grid));
            const sers = [[], [], []], acc = [0, 0, 0]; let j = 0;
            for (let n = 1; n <= NMAX; n++) { const t = F.ser(n, s); for (let i = 0; i < 3; i++) acc[i] += t[i]; if (n === grid[j]) { for (let i = 0; i < 3; i++) sers[i].push(acc[i]); j++; } }
            cache = { key, paths, sers };
          }
          const fin = cache.paths.map((pp) => pp[pp.length - 1]), ext = Math.max(2, ...cache.paths.map((pp) => Math.max(...pp.map(Math.abs))));
          L.setView(null, [-Math.min(ext * 1.1, 60), Math.min(ext * 1.1, 60)]);
          L.hline(0, { color: 'muted', width: 1 });
          cache.paths.forEach((pp) => L.path(grid.map((g, k) => [g, pp[k]]), { color: 'accent', width: 1, alpha: 0.55 }));
          const cols = ['red', 'orange', 'purple'];
          cache.sers.forEach((ss, i) => { if (ss[ss.length - 1] > 0) R.path(grid.map((g, k) => [g, ss[k] > 0 ? ss[k] : null]), { color: cols[i], width: 2.4 }); });
          // verdicts from the exact asymptotics
          const conv = { sign: [true, true, s > 0.5], cau: [s > 1, true, s > 1], shift: [true, s > 1, true], bern: [s > 1, true, true] }[fam.value];
          const zero = cache.sers.map((ss) => ss[ss.length - 1] === 0);
          v.legend([['accent', 'paths of $\\sum X_n$'], ['red', '(i) $\\sum P(|X_n|>A)$'], ['orange', '(ii) $\\sum EY_n$'], ['purple', '(iii) $\\sum\\operatorname{var}(Y_n)$']]);
          cornerIn(R, conv.every(Boolean) ? 'all three converge: Σ Xₙ converges a.s.' : 'a series diverges: Σ Xₙ diverges a.s.', 'tl', { color: conv.every(Boolean) ? 'green' : 'red' });
          st = { conv, zero, A: F.A, spread: Math.max(...fin) - Math.min(...fin) };
        });
        const w = (c, z) => (z ? '$0$' : c ? 'converges' : '**diverges**');
        v.readout(() => st && `$A=${st.A}$. (i) ${w(st.conv[0], st.zero[0])}; (ii) ${w(st.conv[1], st.zero[1])}; (iii) ${w(st.conv[2], st.zero[2])}. Verdict: $\\sum X_n$ ${st.conv.every(Boolean) ? 'converges' : 'diverges'} a.s. Spread of the 20 simulated sums at $n=10^5$: $${v.fix(st.spread, 2)}$.`);
      },
    },
    {
      num: '2.5.9',
      kind: 'Theorem',
      name: 'Kronecker’s lemma',
      credit: 'Kronecker',
      statement: String.raw`If $a_n\uparrow\infty$ and $\sum_{n=1}^\infty x_n/a_n$ converges, then
$$\frac1{a_n}\sum_{m=1}^nx_m\to0.$$`,
      idea: String.raw`Let $b_m=\sum_{k\le m}x_k/a_k$ with $b_0=0$, so $x_m=a_m(b_m-b_{m-1})$. Summation by parts gives $\frac1{a_n}\sum_{m\le n}x_m=b_n-\sum_{m=1}^{n}\frac{a_m-a_{m-1}}{a_n}\,b_{m-1}$ (with $a_0=0$). The weights $(a_m-a_{m-1})/a_n$ are nonnegative and sum to $1$, and those for any fixed $m$ tend to $0$, so the weighted average of the $b_{m-1}$ tends to $\lim b_n$, and the difference tends to $0$.`,
      caption: String.raw`Pick a convergent series $\sum c_n$ and put $x_n=a_nc_n$ with $a_n=n^p$. Left: the partial sums $b_n=\sum_{m\le n}c_m$, converging. Right: the normalized sums $\frac1{a_n}\sum_{m\le n}x_m$, pulled to $0$. Break a hypothesis: take $c_n=1/n$ (divergent) and the right side tends to $1/p$, not $0$; take $p=0$ (no growth) and the right side is just $b_n$.`,
      deps: [],
      see: ['prob-2.5.10'],
      tags: ['random series', 'analysis'],
      viz(v) {
        const cS = v.select('$c_n=x_n/a_n$', [{ value: 'alt', label: '$(-1)^n/\\sqrt n$' }, { value: 'rand', label: '$\\pm1/n$ random' }, { value: 'harm', label: '$1/n$ (diverges)' }], 'alt');
        const pS = v.slider('$p$ in $a_n=n^p$', 0, 1.5, 1, { step: 0.05 });
        const NMAX = 100000, grid = [...new Set(logGrid(1, NMAX, 220).map((g) => 2 * Math.ceil(g / 2)))]; // even n: no aliasing of the alternating series
        const L = v.stage({ x: [1, NMAX], y: [-1.5, 1.5], xlog: true, height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: '$b_n=\\sum_{m\\le n}x_m/a_m$' });
        const R = v.stage({ x: [1, NMAX], y: [-1.5, 1.5], xlog: true, height: 300, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\frac1{a_n}\\sum_{m\\le n}x_m$' });
        let st = null;
        v.render(() => {
          const p = pS.value, r = v.rng(9), signs = new Int8Array(NMAX + 1); for (let n = 1; n <= NMAX; n++) signs[n] = sgn(r);
          const c = { alt: (n) => (n % 2 ? -1 : 1) / Math.sqrt(n), rand: (n) => signs[n] / n, harm: (n) => 1 / n }[cS.value];
          const bs = [], av = []; let b = 0, sx = 0, j = 0;
          for (let n = 1; n <= NMAX; n++) { const cn = c(n), an = n ** p; b += cn; sx += an * cn; if (n === grid[j]) { bs.push([n, b]); av.push([n, sx / an]); j++; } }
          const ymax = Math.max(1.2, ...bs.map((q) => Math.abs(q[1])), ...av.map((q) => Math.abs(q[1]))) * 1.08;
          L.setView(null, [-Math.min(ymax, 14), Math.min(ymax, 14)]); R.setView(null, [-Math.min(ymax, 14), Math.min(ymax, 14)]);
          L.hline(0, { color: 'muted', width: 1 }); R.hline(0, { color: 'green', width: 1.8, dash: [6, 4] });
          L.path(bs, { color: cS.value === 'harm' ? 'red' : 'accent', width: 2 });
          R.path(av, { color: cS.value === 'harm' || p === 0 ? 'red' : 'gold', width: 2 });
          v.legend([['accent', '$b_n$'], ['gold', '$\\frac1{a_n}\\sum x_m$'], ['green', 'Kronecker limit $0$', { dash: true }]]);
          st = { b: bs[bs.length - 1][1], a: av[av.length - 1][1], p };
        });
        v.readout(() => st && `At $n=10^5$: $b_n=${v.fix(st.b, 4)}$, $\\ \\frac1{a_n}\\sum_{m\\le n}x_m=${v.fix(st.a, 4)}$.` + (cS.value === 'harm' ? ' The series diverges, so Kronecker promises nothing' + (st.p > 0 ? ` (here the limit is $1/p=${v.fix(1 / st.p, 3)}$).` : '.') : st.p === 0 ? ' With $a_n\\equiv1$ the normalized sum is $b_n$ itself.' : ''));
      },
    },
    {
      num: '2.5.10',
      kind: 'Theorem',
      name: 'Strong law via random series',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $E|X_1|<\infty$ and $EX_1=\mu$. Then $S_n/n\to\mu$ a.s. — proved this time by random series: with $Y_k=X_k1(|X_k|\le k)$, the series $\sum_k(Y_k-EY_k)/k$ converges a.s., and Kronecker's lemma converts this into the strong law.`,
      idea: String.raw`The terms $(Y_k-EY_k)/k$ are independent with mean $0$ and $\sum_k\operatorname{var}(Y_k)/k^2\le4E|X_1|<\infty$ (Lemma 2.4.3), so Theorem 2.5.6 makes the series converge. Kronecker's lemma (2.5.9) with $a_k=k$ gives $\frac1n\sum_{k\le n}(Y_k-EY_k)\to0$. Dominated convergence gives $EY_k\to\mu$, hence $\frac1n\sum_{k\le n}EY_k\to\mu$, and $X_k=Y_k$ eventually (Lemma 2.4.2).`,
      caption: String.raw`Left: the random series $\sum_{k\le n}(Y_k-EY_k)/k$ for 20 seeded sequences, each settling on its own random limit (the centring $EY_k$ is computed exactly). Right: what Kronecker makes of it, $\frac1n\sum_{k\le n}(Y_k-EY_k)$ (blue), and the plain average error $S_n/n-\mu$ (gold), both tending to $0$. Heavier tails (Pareto $\alpha=1.1$) make everything slower but not different.`,
      deps: ['prob-2.5.6', 'prob-2.5.9', 'prob-2.4.3'],
      see: ['prob-2.4.1'],
      tags: ['law of large numbers', 'random series'],
      viz(v) {
        const LAW = {
          p15: { label: 'Pareto $\\alpha=1.5$', a: 1.5 },
          p11: { label: 'Pareto $\\alpha=1.1$', a: 1.1 },
          exp: { label: 'exponential', a: null },
        };
        const law = v.select('law', Object.entries(LAW).map(([value, o]) => ({ value, label: o.label })), 'p15');
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 100000, grid = logGrid(1, NMAX, 200);
        const L = v.stage({ x: [1, NMAX], y: [-3, 3], xlog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\sum_{k\\le n}(Y_k-EY_k)/k$' });
        const R = v.stage({ x: [1, NMAX], y: [-1.5, 1.5], xlog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'Kronecker: averages tend to $0$' });
        let cache = null, st = null;
        v.render(() => {
          const Lw = LAW[law.value], key = law.value + seed, a = Lw.a;
          const mu = a ? a / (a - 1) : 1, draw = a ? (r) => (1 - r()) ** (-1 / a) : (r) => -Math.log(1 - r());
          const EY = a ? (k) => (a / (1 - a)) * (k ** (1 - a) - 1) : (k) => 1 - Math.exp(-k) * (k + 1);
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 47 + 2), ser = [], kro = [], err = [];
            for (let p = 0; p < 20; p++) {
              let s1 = 0, s2 = 0, s3 = 0, j = 0; const A = [], B = [], C = [];
              for (let k = 1; k <= NMAX; k++) { const x = draw(r), y = x <= k ? x : 0, e = EY(k); s1 += (y - e) / k; s2 += y - e; s3 += x; if (k === grid[j]) { A.push(s1); B.push(s2 / k); C.push(s3 / k - mu); j++; } }
              ser.push(A); kro.push(B); err.push(C);
            }
            cache = { key, ser, kro, err };
          }
          const ext = Math.max(1, ...cache.ser.map((A) => Math.max(...A.map(Math.abs)))) * 1.1, ext2 = a === 1.1 ? 6 : a ? 2.5 : 1;
          L.setView(null, [-ext, ext]); R.setView(null, [-ext2, ext2]);
          L.hline(0, { color: 'muted', width: 1 }); R.hline(0, { color: 'green', width: 1.8, dash: [6, 4] });
          cache.ser.forEach((A) => L.path(grid.map((g, k) => [g, A[k]]), { color: 'purple', width: 1, alpha: 0.6 }));
          cache.err.forEach((C) => R.path(grid.map((g, k) => [g, clampN(C[k], -ext2 * 1.1, ext2 * 1.1)]), { color: 'gold', width: 1, alpha: 0.45 }));
          cache.kro.forEach((B) => R.path(grid.map((g, k) => [g, clampN(B[k], -ext2 * 1.1, ext2 * 1.1)]), { color: 'accent', width: 1, alpha: 0.6 }));
          v.legend([['purple', 'random series'], ['accent', '$\\frac1n\\sum(Y_k-EY_k)$'], ['gold', '$S_n/n-\\mu$']]);
          const last = (arrs) => Math.max(...arrs.map((A) => Math.abs(A[A.length - 1])));
          st = { mu, k: last(cache.kro), e: last(cache.err), lims: cache.ser.slice(0, 4).map((A) => A[A.length - 1]) };
        });
        v.readout(() => st && `$\\mu=${v.fix(st.mu, 3)}$. Some limits of the random series: ${st.lims.map((x) => v.fix(x, 2)).join(', ')}. At $n=10^5$: $\\max|\\frac1n\\sum(Y_k-EY_k)|=${v.fix(st.k, 4)}$, $\\ \\max|S_n/n-\\mu|=${v.fix(st.e, 4)}$ over the 20 sequences.`);
      },
    },
    {
      num: '2.5.11',
      kind: 'Theorem',
      name: 'Rate in the strong law: o(√n (log n)^{1/2+ε})',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $EX_i=0$ and $EX_i^2=\sigma^2<\infty$. Then for every $\eps>0$
$$\frac{S_n}{\sqrt n\,(\log n)^{1/2+\eps}}\to0\quad\text{a.s.}$$`,
      idea: String.raw`Put $a_n=\sqrt n(\log n)^{1/2+\eps}$ for $n\ge2$ (and $a_1>0$). Then $\sum_n\operatorname{var}(X_n/a_n)=\sigma^2\big(a_1^{-2}+\sum_{n\ge2}\frac1{n(\log n)^{1+2\eps}}\big)<\infty$, so $\sum X_n/a_n$ converges a.s. by Theorem 2.5.6, and Kronecker's lemma (2.5.9) gives $S_n/a_n\to0$. The truth is sharper: the law of the iterated logarithm puts $\limsup S_n/\sqrt{2n\log\log n}=\sigma$.`,
      caption: String.raw`Left: 12 seeded $\pm1$ walks up to $n=2^{17}$ (log scale in $n$), divided by $\sqrt n$, against three envelopes (also divided by $\sqrt n$): $\pm\sqrt n$, which the walks keep crossing; $\pm\sqrt{2n\log\log n}$, the exact law-of-the-iterated-logarithm size; and $\pm\sqrt n(\log n)^{1/2+\eps}$, which they eventually never touch. Right: the ratios $|S_n|/(\sqrt n(\log n)^{1/2+\eps})$, drifting to $0$ (slowly, like a power of $1/\log n$).`,
      deps: ['prob-2.5.6', 'prob-2.5.9'],
      see: ['prob-8.5.1'],
      tags: ['law of large numbers', 'rates'],
      viz(v) {
        const eS = v.slider('$\\eps$', 0.02, 0.6, 0.1, { step: 0.02 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 2 ** 17, grid = logGrid(3, NMAX, 260);
        const L = v.stage({ x: [3, NMAX], y: [-4, 4], xlog: true, height: 330, weight: 1.35, axes: 'box', gutter: true, xlabel: '$n$', title: '$S_n/\\sqrt n$ and the envelopes divided by $\\sqrt n$' });
        const R = v.stage({ x: [3, NMAX], y: [0, 1.2], xlog: true, height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: '$|S_n|/(\\sqrt n(\\log n)^{1/2+\\eps})$' });
        let cache = null, st = null;
        v.render(() => {
          const eps = eS.value;
          if (!cache || cache.seed !== seed) { const r = v.rng(seed * 89 + 4), paths = []; for (let p = 0; p < 12; p++) paths.push(partial(() => sgn(r), grid)); cache = { seed, paths }; }
          const env = (n) => Math.sqrt(n) * Math.log(n) ** (0.5 + eps);
          const e1 = (n) => Math.log(n) ** (0.5 + eps), e2 = (n) => Math.sqrt(2 * Math.log(Math.log(n))), e3 = () => 1;
          const top = e1(NMAX) * 1.08; L.setView(null, [-top, top]);
          L.between((n) => e1(n), (n) => -e1(n), 3, NMAX, { fill: 'green', fillAlpha: 0.09 });
          [[e1, 'green', 2.2, null], [e2, 'orange', 1.8, [6, 4]], [e3, 'muted', 1.4, [3, 3]]].forEach(([f, c, w, d]) => { L.fn(f, { domain: [3, NMAX], color: c, width: w, dash: d }); L.fn((n) => -f(n), { domain: [3, NMAX], color: c, width: w, dash: d }); });
          cache.paths.forEach((pp) => L.path(grid.map((g, k) => [g, pp[k] / Math.sqrt(g)]), { color: 'accent', width: 1, alpha: 0.6 }));
          cache.paths.forEach((pp) => R.path(grid.map((g, k) => [g, Math.abs(pp[k]) / env(g)]), { color: 'accent', width: 1, alpha: 0.55 }));
          R.hline(0, { color: 'green', width: 1.8, dash: [6, 4] });
          v.legend([['accent', '$S_n/\\sqrt n$'], ['muted', '$\\pm1$', { dash: true }], ['orange', '$\\pm\\sqrt{2\\log\\log n}$', { dash: true }], ['green', '$\\pm(\\log n)^{1/2+\\eps}$']]);
          const half = grid.map((g, k) => [g, k]).filter(([g]) => g >= NMAX / 2);
          let crossS = 0, maxR = 0;
          cache.paths.forEach((pp) => { if (half.some(([g, k]) => Math.abs(pp[k]) > Math.sqrt(g))) crossS++; half.forEach(([g, k]) => (maxR = Math.max(maxR, Math.abs(pp[k]) / env(g)))); });
          st = { crossS, maxR };
        });
        v.readout(() => st && `On $[2^{16},2^{17}]$: ${st.crossS} of 12 walks are outside $\\pm\\sqrt n$ somewhere, while the largest ratio to $\\sqrt n(\\log n)^{1/2+\\eps}$ is $${v.fix(st.maxR, 3)}$.`);
      },
    },
    {
      num: '2.5.12',
      kind: 'Theorem',
      name: 'Marcinkiewicz–Zygmund strong law',
      credit: 'Marcinkiewicz and Zygmund, 1937',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $EX_1=0$ and $E|X_1|^p<\infty$ for some $1<p<2$. Then
$$\frac{S_n}{n^{1/p}}\to0\quad\text{a.s.}$$`,
      idea: String.raw`Truncate at the level of the normalizer: $Y_k=X_k1(|X_k|\le k^{1/p})$. Then $\sum_kP(|X_k|>k^{1/p})=\sum_kP(|X_1|^p>k)\le E|X_1|^p<\infty$, so $X_k=Y_k$ eventually. The tail formula (Lemma 2.2.13) bounds $\sum_k\operatorname{var}(Y_k)/k^{2/p}$ by a constant times $E|X_1|^p$, so $\sum(Y_k-EY_k)/k^{1/p}$ converges (Theorem 2.5.6) and Kronecker's lemma (2.5.9) gives $\frac1{n^{1/p}}\sum_{k\le n}(Y_k-EY_k)\to0$; the centring terms are handled using $EX_1=0$.`,
      caption: String.raw`Symmetric Pareto steps with tail index $\alpha$, so $E|X|^p<\infty$ exactly for $p<\alpha$. The 15 seeded paths of $S_n/n^{1/p}$ (log scale in $n$) shrink to $0$ when $p<\alpha$ (green verdict) and blow up like $n^{1/\alpha-1/p}$ when $p>\alpha$ (red): the normalizer $n^{1/p}$ is then too small for the big jumps, as in Theorem 2.3.8.`,
      deps: ['prob-2.5.6', 'prob-2.5.9', 'prob-2.2.13', 'prob-2.3.8'],
      tags: ['law of large numbers', 'rates'],
      viz(v) {
        const aS = v.slider('tail index $\\alpha$', 1.1, 2, 1.6, { step: 0.05 });
        const pS = v.slider('$p$', 1, 1.95, 1.3, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NMAX = 100000, grid = logGrid(1, NMAX, 220);
        const S = v.stage({ x: [1, NMAX], y: [-3, 3], xlog: true, height: 360, full: true, axes: 'box', gutter: true, xlabel: '$n$', title: '$S_n/n^{1/p}$ for symmetric Pareto steps' });
        let cache = null, st = null;
        v.render(() => {
          const a = aS.value, p = pS.value, key = a + '|' + seed;
          if (!cache || cache.key !== key) { const r = v.rng(seed * 67 + 8), paths = []; for (let i = 0; i < 15; i++) paths.push(partial(() => sgn(r) * (1 - r()) ** (-1 / a), grid)); cache = { key, paths }; }
          const vals = cache.paths.map((pp) => grid.map((g, k) => pp[k] / g ** (1 / p)));
          const late = vals.map((vv) => Math.max(...vv.slice(-40).map(Math.abs)));
          const ext = clampN(Math.max(...vals.map((vv) => Math.max(...vv.slice(90).map(Math.abs)))) * 1.15, 1, 200);
          S.setView(null, [-ext, ext]);
          S.hline(0, { color: 'muted', width: 1 });
          const ok = p < a;
          vals.forEach((vv) => S.path(grid.map((g, k) => [g, vv[k]]), { color: ok ? 'accent' : 'red', width: 1.1, alpha: 0.6 }));
          cornerIn(S, ok ? `p = ${p.toFixed(2)} < α = ${a.toFixed(2)}: E|X|ᵖ < ∞, paths → 0` : `p = ${p.toFixed(2)} ≥ α = ${a.toFixed(2)}: E|X|ᵖ = ∞`, 'tr', { color: ok ? 'green' : 'red' });
          v.legend([[ok ? 'accent' : 'red', '$S_n/n^{1/p}$, 15 paths']]);
          st = { ok, late: Math.max(...late), a, p };
        });
        v.readout(() => st && `Largest $|S_n/n^{1/p}|$ over $n\\in[5\\cdot10^4,10^5]$ among the 15 paths: $${v.fix(st.late, 3)}$. ` + (st.ok ? `With $p<\\alpha$ the theorem applies; the decay is slow when $p$ is close to $\\alpha$.` : `With $p\\ge\\alpha$ the typical size is $n^{1/\\alpha-1/p}=${v.fix(1e5 ** (1 / st.a - 1 / st.p), 2)}$ at $n=10^5$.`));
      },
    },
    {
      num: '2.5.13',
      kind: 'Theorem',
      name: 'Infinite mean: lim sup |Sₙ|/aₙ is 0 or ∞',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $E|X_1|=\infty$, and let $a_n>0$ with $a_n/n$ increasing. Then
$$\limsup_{n\to\infty}\frac{|S_n|}{a_n}=\begin{cases}0&\text{if }\sum_nP(|X_1|\ge a_n)<\infty,\\ \infty&\text{if }\sum_nP(|X_1|\ge a_n)=\infty.\end{cases}$$
No normalization makes $S_n$ settle at a nonzero finite size.`,
      idea: String.raw`If the sum diverges, so does $\sum_nP(|X_1|\ge Ka_n)$ for every $K$ (use $a_{kn}\ge ka_n$), so $|X_n|\ge Ka_n$ infinitely often by the second Borel–Cantelli lemma (2.3.7); then $|S_n|$ or $|S_{n-1}|$ exceeds $Ka_n/2$ infinitely often. If the sum converges, truncate at $a_n$: Borel–Cantelli (2.3.1) removes the big terms, and a variance bound with Theorem 2.5.6 and Kronecker's lemma (2.5.9) shows $S_n/a_n\to0$; the hypothesis $E|X_1|=\infty$ forces $a_n/n\to\infty$, which takes care of the centring.`,
      caption: String.raw`Cauchy steps with $a_n=n(\log(n+2))^s$, so $\sum P(|X|\ge a_n)\approx\sum\frac2{\pi n(\log n)^s}$ converges exactly when $s>1$. Left: in each seeded row a dot marks an $n\le10^{12}$ with $|X_n|\ge a_n$ (exact simulation of these independent events); for $s\le1$ the dots never stop, if only at a $\log\log$ pace at $s=1$. Right: one honest Cauchy walk, $|S_n|/a_n$ on log axes, with red dots at those big jumps: each such jump lifts the ratio to about $1$ or more, so infinitely many jumps mean $\limsup=\infty$ (since $a_n/n$ grows, so do the bigger multiples $Ka_n$).`,
      deps: ['prob-2.3.1', 'prob-2.3.7', 'prob-2.5.6', 'prob-2.5.9'],
      tags: ['law of large numbers'],
      viz(v) {
        const sS = v.slider('$s$ in $a_n=n(\\log(n+2))^s$', 0.2, 2, 0.6, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const NB = 1e12, ROWS = 25, NW = 200000, grid = logGrid(1, NW, 300);
        const L = v.stage({ x: [1, NB], y: [0.3, ROWS + 0.7], xlog: true, height: 330, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', yticks: [], title: 'times with $|X_n|\\ge a_n$' });
        const R = v.stage({ x: [1, NW], y: [1e-4, 100], xlog: true, ylog: true, height: 330, axes: 'box', gutter: true, xlabel: '$n$', title: '$|S_n|/a_n$, one Cauchy walk' });
        let cache = null, cacheW = null, st = null;
        v.render(() => {
          const s = sS.value, a = (n) => n * Math.log(n + 2) ** s, p = (n) => 1 - (2 / Math.PI) * Math.atan(a(n)), key = s + '|' + seed;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 53 + 6), rows = []; for (let i = 0; i < ROWS; i++) rows.push(bernTimes(p, 1, NB, r));
            const r2 = v.rng(seed * 11 + 1), xs = new Float64Array(NW + 1); for (let n = 1; n <= NW; n++) xs[n] = Math.tan(Math.PI * (r2() - 0.5));
            let S = 0, j = 0; const ratio = [], jumps = [];
            for (let n = 1; n <= NW; n++) { S += xs[n]; if (Math.abs(xs[n]) >= a(n)) jumps.push([n, Math.abs(S) / a(n)]); if (n === grid[j]) { ratio.push([n, Math.max(1e-5, Math.abs(S) / a(n))]); j++; } }
            let E = 0; for (let n = 1; n <= 1e6; n++) E += p(n);
            cache = { key, rows, ratio, jumps, E };
          }
          cache.rows.forEach((rw, i) => L.dots(rw.map((n) => [n, i + 1]), { r: 2.4, color: s > 1 ? 'accent' : 'red' }));
          [1e3, 1e6, 1e9].forEach((x) => L.vline(x, { color: 'grid', width: 1 }));
          R.hline(1, { color: 'muted', dash: [5, 4], width: 1.2 });
          R.path(cache.ratio, { color: 'accent', width: 1.4 });
          R.dots(cache.jumps, { r: 4, color: 'red' });
          v.legend([[s > 1 ? 'accent' : 'red', '$|X_n|\\ge a_n$', { dot: true }], ['accent', '$|S_n|/a_n$']]);
          const late = cache.rows.filter((rw) => rw.some((n) => n > 1e6)).length;
          st = { s, late, E: cache.E, jumps: cache.jumps.length };
        });
        v.readout(() => st && `$\\sum_{n\\le10^6}P(|X|\\ge a_n)=${v.fix(st.E, 2)}$, and the full sum ${st.s > 1 ? 'converges' : 'diverges'} ($s${st.s > 1 ? '>' : '\\le'}1$): $\\limsup|S_n|/a_n=${st.s > 1 ? '0' : '\\infty'}$. Rows with a big jump after $n=10^6$: ${st.late} of ${25}. Big jumps in the walk up to $2\\cdot10^5$: ${st.jumps}.`);
      },
    },
  ],
};
