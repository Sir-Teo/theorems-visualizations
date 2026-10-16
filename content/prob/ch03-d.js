// Probability: Theory and Examples (Durrett) — Chapter 3, part D: Poisson convergence and Poisson processes (§§3.6–3.7)

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
/** About m log-spaced distinct integers in [n0, n1]. */
function logGrid(n0, n1, m = 60) {
  const out = [n0]; const q = Math.pow(n1 / n0, 1 / m);
  for (let x = n0 * q; x < n1; x *= q) { const k = Math.round(x); if (k > out[out.length - 1]) out.push(k); }
  if (out[out.length - 1] !== n1) out.push(n1);
  return out;
}
/** Poisson(λ) pmf on {0, …, K}. */
function poisPmf(lam, K) { const out = new Float64Array(K + 1); let p = Math.exp(-lam); for (let k = 0; k <= K; k++) { out[k] = p; p *= lam / (k + 1); } return out; }
/** Binomial(n, p) pmf (log-space). */
function binomPmf(M, n, p) {
  const out = new Float64Array(n + 1); if (p <= 0) { out[0] = 1; return out; } if (p >= 1) { out[n] = 1; return out; }
  const lp = Math.log(p), lq = Math.log1p(-p), ln1 = M.lgamma(n + 1);
  for (let k = 0; k <= n; k++) out[k] = Math.exp(ln1 - M.lgamma(k + 1) - M.lgamma(n - k + 1) + k * lp + (n - k) * lq);
  return out;
}
/** Law of a sum of independent Bernoulli(p_m) (Poisson-binomial), truncated to {0, …, K}. */
function poisBinom(ps, K) {
  const dp = new Float64Array(K + 1); dp[0] = 1;
  for (const p of ps) { for (let k = K; k >= 1; k--) dp[k] = dp[k] * (1 - p) + dp[k - 1] * p; dp[0] *= 1 - p; }
  return dp;
}
/** Total variation ½Σ|a − b| of two pmfs on {0, 1, …} (missing mass of each counted as sitting outside both supports). */
function tvd(a, b) {
  const K = Math.max(a.length, b.length); let s = 0, ma = 0, mb = 0;
  for (let k = 0; k < K; k++) { const x = a[k] || 0, y = b[k] || 0; s += Math.abs(x - y); ma += x; mb += y; }
  return 0.5 * (s + Math.max(0, 1 - ma) + Math.max(0, 1 - mb));
}
/** Direct convolution of two pmfs. */
function conv(a, b) { const out = new Float64Array(a.length + b.length - 1); for (let i = 0; i < a.length; i++) if (a[i]) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j]; return out; }
const sampleExp = (r, rate = 1) => -Math.log(1 - r()) / rate;
/** Poisson sample by inversion (fine for the moderate means used here). */
function samplePois(r, lam) { let k = 0, p = Math.exp(-lam), c = p; const u = r(); while (u > c && k < 1000) { k++; p *= lam / k; c += p; } return k; }
/** Arrival times of a rate-λ Poisson process on [0, T] from exponential gaps. */
function arrivals(r, lam, T) { const out = []; let t = sampleExp(r, lam); while (t <= T) { out.push(t); t += sampleExp(r, lam); } return out; }
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const varr = (xs) => { const m = mean(xs); return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1); };
const corr = (xs, ys) => { const mx = mean(xs), my = mean(ys); let a = 0, b = 0, c = 0; for (let i = 0; i < xs.length; i++) { a += (xs[i] - mx) * (ys[i] - my); b += (xs[i] - mx) ** 2; c += (ys[i] - my) ** 2; } return b && c ? a / Math.sqrt(b * c) : 0; };
/** Bars for a pmf on {0..K} offset by dx, with an optional outline style. */
function pmfBars(S, p, K, st = {}) {
  const w = st.w ?? 0.36, dx = st.dx ?? 0;
  for (let k = 0; k <= K; k++) { const y = p[k] || 0; if (y <= 0) continue; S.rect(k + dx - w / 2, 0, k + dx + w / 2, y, st.outline ? { color: st.color || 'accent', fill: st.color || 'accent', fillAlpha: 0.1, width: 1.6 } : { fill: st.color || 'accent', fillAlpha: st.alpha ?? 0.6, stroke: false }); }
}
const pmfDots = (S, p, K, color = 'green', dx = 0, r = 4) => { for (let k = 0; k <= K; k++) if ((p[k] || 0) > 1e-5) S.dot(k + dx, p[k], { r, color }); };

export default {
  collection: 'prob',
  chapter: 3,
  items: [
    // ======================================================================== §3.6.1 the basic limit theorem
    {
      num: '3.6.1',
      kind: 'Theorem',
      name: 'Poisson convergence (law of rare events)',
      credit: 'Poisson, 1837',
      statement: String.raw`For each $n$ let $X_{n,1},\dots,X_{n,n}$ be independent with $P(X_{n,m}=1)=p_{n,m}$ and $P(X_{n,m}=0)=1-p_{n,m}$. If
(i) $\sum_{m=1}^np_{n,m}\to\lambda\in(0,\infty)$ and
(ii) $\max_{1\le m\le n}p_{n,m}\to0$,
then $S_n=X_{n,1}+\dots+X_{n,n}\Rightarrow Z$, where $Z$ is Poisson$(\lambda)$: $P(Z=k)=e^{-\lambda}\lambda^k/k!$.`,
      idea: String.raw`The characteristic function of $S_n$ is $\prod_m\big(1+p_{n,m}(e^{it}-1)\big)$, and the Poisson$(\lambda)$ one is $\exp(\lambda(e^{it}-1))$. All factors have modulus at most $1$, so Lemma 3.4.3 and Lemma 3.4.4 bound the difference between $\prod(1+p_{n,m}(e^{it}-1))$ and $\exp(\sum p_{n,m}(e^{it}-1))$ by $\sum p_{n,m}^2|e^{it}-1|^2\le4\max_mp_{n,m}\sum_mp_{n,m}\to0$. Lévy's continuity theorem (3.3.17) concludes. Unlike Lindeberg–Feller, each term is not small when it occurs; it is just rare.`,
      caption: String.raw`Choose a row of Bernoulli probabilities with total $\lambda$. Left: the exact law of $S_n$ (bars) against Poisson$(\lambda)$ (green dots). Right: the row $p_{n,1},\dots,p_{n,n}$, with the largest in red. With equal or graded $p$'s the fit improves as $n$ grows; with one large $p_{n,1}=q$ it does not, since condition (ii) fails: the limit is Bernoulli$(q)$ plus Poisson$(\lambda-q)$.`,
      deps: ['prob-3.3.17', 'prob-3.4.3', 'prob-3.4.4', 'prob-1.6.13'],
      see: ['stoch-9.4', 'prob-3.6.7'],
      tags: ['poisson'],
      viz(v) {
        const mode = v.select('row', [{ value: 'eq', label: 'equal $\\lambda/n$' }, { value: 'grad', label: 'graded $\\propto m$' }, { value: 'big', label: 'one large $q$' }], 'eq');
        const nS = v.slider('$n$', 2, 1000, 20, { int: true, log: true });
        const lS = v.slider('$\\lambda$', 0.5, 6, 2, { step: 0.1 });
        const qS = v.slider('large $q$', 0.1, 0.9, 0.6, { step: 0.01 });
        const L = v.stage({ x: [-0.6, 12.6], y: [0, 0.45], height: 320, weight: 1.25, axes: 'box', gutter: true, xlabel: '$k$', title: 'law of $S_n$ vs Poisson$(\\lambda)$' });
        const R = v.stage({ x: [0, 20], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: '$m$', title: 'the row $p_{n,m}$' });
        let st = null;
        v.render(() => {
          const md = mode.value, n = nS.value, lam = lS.value, q = Math.min(qS.value, lam * 0.95);
          qS.el.hidden = md !== 'big';
          let ps;
          if (md === 'eq') ps = Array(n).fill(lam / n);
          else if (md === 'grad') ps = Array.from({ length: n }, (_, m) => (2 * lam * (m + 1)) / (n * (n + 1)));
          else ps = [q, ...Array(n - 1).fill((lam - q) / (n - 1))];
          if (ps.some((p) => p > 1)) ps = ps.map((p) => Math.min(1, p));
          const K = 40, S = poisBinom(ps, K), P = poisPmf(ps.reduce((a, b) => a + b, 0), K), Kd = Math.max(8, Math.ceil(lam + 4 * Math.sqrt(lam) + 1));
          L.setView([-0.6, Kd + 0.6], [0, Math.max(...S, ...P) * 1.15]);
          pmfBars(L, S, Kd, { w: 0.62 });
          pmfDots(L, P, Kd, 'green', 0, 4.5);
          const pm = Math.max(...ps), im = ps.indexOf(pm);
          R.setView([0, n + 1], [0, Math.max(pm * 1.15, 0.02)]);
          if (n <= 120) ps.forEach((p, m) => R.rect(m + 0.6, 0, m + 1.4, p, { fill: m === im ? 'red' : 'accent', fillAlpha: 0.6, stroke: false }));
          else { R.path(ps.map((p, m) => [m + 1, p]), { color: 'accent', width: 1.6 }); R.dot(im + 1, pm, { r: 4, color: 'red' }); }
          v.legend([['accent', 'exact $P(S_n=k)$', { area: true }], ['green', 'Poisson$(\\sum_mp_{n,m})$', { dot: true }], ['red', '$\\max_mp_{n,m}$', { area: true }]]);
          const s2 = ps.reduce((a, p) => a + p * p, 0);
          st = { tv: tvd(S, P), s2, pm, lam: ps.reduce((a, b) => a + b, 0) };
        });
        v.readout(() => st && `Total variation to Poisson$(${v.fix(st.lam, 2)})$: $${v.fix(st.tv, 5)}$; Le Cam's bound $\\sum p_{n,m}^2=${v.fix(st.s2, 5)}$, Stein's $\\sum p_{n,m}^2/(\\lambda\\vee1)=${v.fix(st.s2 / Math.max(1, st.lam), 5)}$. $\\max_mp_{n,m}=${v.fix(st.pm, 4)}$.`);
      },
    },
    {
      num: '3.6.3a',
      kind: 'Definition',
      name: 'Total variation distance',
      verify: true,
      statement: String.raw`For probability measures $\mu,\nu$ on a countable set $S$, the **total variation distance** is
$$\|\mu-\nu\|=\frac12\sum_{z\in S}|\mu(z)-\nu(z)|=\sup_{A\subset S}|\mu(A)-\nu(A)|.$$`,
      idea: String.raw`For any $A$, $\sum_z|\mu(z)-\nu(z)|\ge|\mu(A)-\nu(A)|+|\mu(A^c)-\nu(A^c)|=2|\mu(A)-\nu(A)|$, because the two differences are equal and opposite. Equality holds for $A=\{z:\mu(z)\ge\nu(z)\}$, which collects exactly the excess of $\mu$ over $\nu$. Geometrically, $\|\mu-\nu\|$ is the area of the part of one bar chart not covered by the other.`,
      caption: String.raw`$\mu$ = Binomial$(N,p)$ and $\nu$ = Poisson$(\lambda)$. Left: the common part $\min(\mu,\nu)$ (grey), the excess of $\mu$ (accent) and of $\nu$ (orange); the two excess areas are equal and each is the distance. The set $A=\{\mu\ge\nu\}$ is ticked under the axis. Right: $\mu(A)-\nu(A)$ for 400 seeded random sets $A$ (dots); none gets past $\pm\|\mu-\nu\|$, and $A$ and $A^c$ reach the two ends.`,
      deps: ['prob-1.2.1b'],
      see: ['stoch-5.1'],
      tags: ['poisson', 'metrics'],
      viz(v) {
        const M = v.M;
        const NS = v.slider('$N$', 1, 30, 6, { int: true });
        const pS = v.slider('$p$', 0.02, 0.98, 0.35, { step: 0.01 });
        const lS = v.slider('$\\lambda$', 0.2, 10, 2.6, { step: 0.1 });
        const L = v.stage({ x: [-0.6, 12.6], y: [0, 0.45], height: 320, weight: 1.35, axes: 'box', gutter: true, xlabel: '$z$', title: 'overlap of two bar charts' });
        const R = v.stage({ x: [-0.6, 0.6], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: '$\\mu(A)-\\nu(A)$', title: 'random sets $A$', yticks: [] });
        let st = null;
        v.render(() => {
          const N = NS.value, p = pS.value, lam = lS.value, K = 60;
          const mu = binomPmf(M, N, p), nu = poisPmf(lam, K), Kd = Math.max(8, Math.min(40, Math.ceil(Math.max(N * p + 4 * Math.sqrt(N * p * (1 - p)) + 1, lam + 4 * Math.sqrt(lam) + 1))));
          const m = (k) => mu[k] || 0, top = Math.max(...Array.from({ length: Kd + 1 }, (_, k) => Math.max(m(k), nu[k])));
          L.setView([-0.6, Kd + 0.6], [-top * 0.08, top * 1.15]);
          let ex = 0, ey = 0; const A = [];
          for (let k = 0; k <= Kd; k++) {
            const a = m(k), b = nu[k], lo = Math.min(a, b);
            if (lo > 0) L.rect(k - 0.36, 0, k + 0.36, lo, { fill: 'muted', fillAlpha: 0.35, stroke: false });
            if (a > b) L.rect(k - 0.36, lo, k + 0.36, a, { fill: 'accent', fillAlpha: 0.75, stroke: false });
            if (b > a) L.rect(k - 0.36, lo, k + 0.36, b, { fill: 'orange', fillAlpha: 0.75, stroke: false });
            if (a >= b && a > 0) { A.push(k); L.rect(k - 0.36, -top * 0.065, k + 0.36, -top * 0.025, { fill: 'accent', fillAlpha: 0.9, stroke: false }); }
          }
          L.hline(0, { color: 'muted', width: 1 });
          for (let k = 0; k <= K; k++) { const d = m(k) - nu[k]; if (d > 0) ex += d; else ey -= d; }
          const tv = 0.5 * (ex + ey);
          R.setView([-Math.max(0.05, tv * 1.25), Math.max(0.05, tv * 1.25)], [0, 1]);
          R.vband(-tv, tv, { color: 'gold', alpha: 0.08 });
          R.vline(tv, { color: 'gold', width: 1.8 }); R.vline(-tv, { color: 'gold', width: 1.8 });
          const r = v.rng(11);
          for (let i = 0; i < 400; i++) { let d = 0; for (let k = 0; k <= K; k++) if (r() < 0.5) d += m(k) - nu[k]; R.dot(d, 0.06 + 0.88 * r(), { r: 2.2, color: 'accent', alpha: 0.55 }); }
          R.dot(tv, 0.5, { r: 6, color: 'accent', label: '$A$', labelPos: 'w' }); R.dot(-tv, 0.5, { r: 6, color: 'orange', label: '$A^c$', labelPos: 'e' });
          v.legend([['muted', '$\\min(\\mu,\\nu)$', { area: true }], ['accent', '$(\\mu-\\nu)^+$; ticks: $A=\\{\\mu\\ge\\nu\\}$', { area: true }], ['orange', '$(\\nu-\\mu)^+$', { area: true }], ['gold', '$\\pm\\|\\mu-\\nu\\|$']]);
          st = { tv, ex, ey, A };
        });
        v.readout(() => st && `$\\frac12\\sum|\\mu-\\nu|=${v.fix(st.tv, 5)}$; $\\ \\sum(\\mu-\\nu)^+=\\mu(A)-\\nu(A)=${v.fix(st.ex, 5)}$; $\\ \\sum(\\nu-\\mu)^+=${v.fix(st.ey, 5)}$. $A=\\{${st.A.join(',')}\\}$.`);
      },
    },
    {
      num: '3.6.4',
      kind: 'Lemma',
      name: 'Total variation: a metric, convergence pointwise',
      statement: String.raw`(i) $d(\mu,\nu)=\|\mu-\nu\|$ is a metric on the probability measures on $\Z$.
(ii) $\|\mu_n-\mu\|\to0$ if and only if $\mu_n(x)\to\mu(x)$ for every $x\in\Z$, which is equivalent to $\mu_n\Rightarrow\mu$.`,
      idea: String.raw`(i) Symmetry and $d=0\iff\mu=\nu$ are clear; the triangle inequality follows from the one for real numbers, summed over $x$. (ii) Pointwise convergence is necessary. Conversely, since both are probability measures, $\sum_x|\mu_n(x)-\mu(x)|=2\sum_x(\mu(x)-\mu_n(x))^+$, and the summands are dominated by $\mu(x)$, so dominated convergence sends the sum to $0$. Total mass $1$ for the limit is essential: without it mass can escape to infinity.`,
      caption: String.raw`Left: $\mu_n$ (bars) and the limit $\mu$ (green) with the pointwise errors (red stems). Right: the total variation distance (accent) and the largest pointwise error on the window $x\le12$ (orange) against $n$, on log axes. For Binomial$(n,\lambda/n)\to$ Poisson$(\lambda)$ both vanish together. Switch to $\mu_n=\frac12\delta_0+\frac12\delta_n$: every point mass converges (to $\frac12\delta_0$), but half the mass runs off to infinity and the total variation to $\delta_0$ stays at $\frac12$.`,
      deps: ['prob-3.6.3a', 'prob-1.5.8'],
      tags: ['metrics'],
      viz(v) {
        const M = v.M;
        const mode = v.select('sequence', [{ value: 'bin', label: 'Binomial$(n,\\lambda/n)$' }, { value: 'esc', label: '$\\frac12\\delta_0+\\frac12\\delta_n$' }], 'bin');
        const nS = v.slider('$n$', 2, 500, 8, { int: true, log: true });
        const lam = 2;
        const L = v.stage({ x: [-0.6, 12.6], y: [0, 0.6], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$x$', title: '$\\mu_n$ and $\\mu$' });
        const R = v.stage({ x: [2, 500], xlog: true, y: [1e-4, 1], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'distance and pointwise error' });
        const law = (md, n) => { if (md === 'bin') return binomPmf(M, n, lam / n); const a = new Float64Array(n + 1); a[0] += 0.5; a[n] += 0.5; return a; };
        const lim = (md) => (md === 'bin' ? poisPmf(lam, 600) : Float64Array.from({ length: 601 }, (_, k) => (k === 0 ? 1 : 0)));
        const errs = (md, n) => { const a = law(md, n), b = lim(md), pw = md === 'esc' ? Float64Array.from(b, (x) => x / 2) : b; let mx = 0; for (let k = 0; k <= 12; k++) mx = Math.max(mx, Math.abs((a[k] || 0) - pw[k])); return [tvd(a, b), mx]; };
        let cache = null, st = null;
        v.render(() => {
          const md = mode.value, n = nS.value;
          if (!cache || cache.md !== md) { const ns = logGrid(2, 500, 60); cache = { md, d: ns.map((k) => [k, errs(md, k)[0]]), p: ns.map((k) => [k, Math.max(1e-9, errs(md, k)[1])]) }; }
          const a = law(md, n), b = lim(md), Kd = 12;
          L.setView([-0.6, Kd + 0.6], [0, md === 'bin' ? 0.45 : 1.08]);
          pmfBars(L, a, Kd, { w: 0.62 });
          if (md === 'bin') pmfDots(L, b, Kd, 'green', 0, 4.5); else { L.dot(0, 0.5, { r: 5, color: 'green', label: 'pointwise limit ½δ₀', labelPos: 'e' }); L.dot(0, 1, { r: 5, color: 'green', hollow: true, label: 'δ₀', labelPos: 'e' }); }
          const pw = md === 'esc' ? Float64Array.from(b, (x) => x / 2) : b;
          for (let k = 0; k <= Kd; k++) { const x = a[k] || 0, y = pw[k]; if (Math.abs(x - y) > 1e-4) L.line(k + 0.42, Math.min(x, y), k + 0.42, Math.max(x, y), { color: 'red', width: 2.4 }); }
          if (md === 'esc' && n > Kd) L.text(`mass ½ at n = ${n} →`, Kd - 0.2, 0.55, { align: 'right', size: 12, color: 'accent', plate: true });
          R.path(cache.d, { color: 'accent', width: 2.2 });
          R.path(cache.p, { color: 'orange', width: 1.8 });
          const [d, p] = errs(md, n);
          R.dot(n, d, { r: 5, color: 'gold' });
          v.legend([['accent', '$\\|\\mu_n-\\mu\\|$'], ['orange', '$\\max_{x\\le12}|\\mu_n(x)-\\mu(x)|$'], ['red', 'pointwise errors'], ['green', 'limit']]);
          const a2 = law(md, 2 * n);
          st = { md, n, d, p, tri: [tvd(a, a2), tvd(a2, b)] };
        });
        v.readout(() => st && (st.md === 'bin' ? `$n=${st.n}$: $\\|\\mu_n-\\mu\\|=${v.fix(st.d, 5)}$, largest pointwise error $${v.fix(st.p, 5)}$. Triangle inequality: $${v.fix(st.d, 5)}\\le\\|\\mu_n-\\mu_{2n}\\|+\\|\\mu_{2n}-\\mu\\|=${v.fix(st.tri[0], 5)}+${v.fix(st.tri[1], 5)}$.` : `$n=${st.n}$: largest pointwise error against $\\frac12\\delta_0$ on $x\\le12$ is $${v.fix(st.p, 4)}$ (it vanishes once $n>12$), but $\\|\\mu_n-\\delta_0\\|=${v.fix(st.d, 3)}$ for every $n$: the pointwise limit is not a probability measure.`));
      },
    },
    {
      num: '3.6.5',
      kind: 'Lemma',
      name: 'Total variation of product measures',
      statement: String.raw`For probability measures on $\Z$, with $\mu_1\times\mu_2$ the product measure on $\Z\times\Z$,
$$\|\mu_1\times\mu_2-\nu_1\times\nu_2\|\le\|\mu_1-\nu_1\|+\|\mu_2-\nu_2\|.$$`,
      idea: String.raw`Insert the hybrid $\nu_1(x)\mu_2(y)$: $|\mu_1(x)\mu_2(y)-\nu_1(x)\nu_2(y)|\le\mu_2(y)|\mu_1(x)-\nu_1(x)|+\nu_1(x)|\mu_2(y)-\nu_2(y)|$. Summing over $(x,y)$, the factors $\mu_2(y)$ and $\nu_1(x)$ sum to $1$, leaving $2\|\mu_1-\nu_1\|+2\|\mu_2-\nu_2\|$. The same swap-one-factor trick as Lemma 3.4.3.`,
      caption: String.raw`Two pairs of Poisson laws, means $a_1,b_1$ and $a_2,b_2$. The grid shows the signed difference $\mu_1(x)\mu_2(y)-\nu_1(x)\nu_2(y)$ (blue: the $\mu$ product is larger; red: the $\nu$ product is), with the marginal pairs along the top and the right. Half the total absolute mass of the grid is the product distance; the bars on the right compare it with the sum of the two marginal distances.`,
      deps: ['prob-3.6.3a'],
      tags: ['metrics', 'coupling'],
      viz(v) {
        const a1 = v.slider('$a_1$', 0.2, 5, 1.5, { step: 0.05 }), b1 = v.slider('$b_1$', 0.2, 5, 2.2, { step: 0.05 });
        const a2 = v.slider('$a_2$', 0.2, 5, 3, { step: 0.05 }), b2 = v.slider('$b_2$', 0.2, 5, 2.5, { step: 0.05 });
        const K = 9;
        const G = v.stage({ x: [-0.9, 13.4], y: [-0.9, 13.1], equal: true, height: 400, weight: 1.3, axes: false, title: 'signed differences on $\\{0,\\dots,9\\}^2$' });
        const B = v.stage({ x: [0, 3], y: [0, 1], height: 400, axes: 'box', gutter: true, title: 'distances', xticks: [[0.75, 'marginals'], [2.25, 'product']] });
        let st = null;
        v.render(() => {
          const m1 = poisPmf(a1.value, 60), n1 = poisPmf(b1.value, 60), m2 = poisPmf(a2.value, 60), n2 = poisPmf(b2.value, 60);
          let mx = 1e-9; for (let x = 0; x <= K; x++) for (let y = 0; y <= K; y++) mx = Math.max(mx, Math.abs(m1[x] * m2[y] - n1[x] * n2[y]));
          for (let x = 0; x <= K; x++) for (let y = 0; y <= K; y++) {
            const d = m1[x] * m2[y] - n1[x] * n2[y], u = clampN(0.5 + (0.5 * d) / mx, 0, 1);
            G.rect(x - 0.47, y - 0.47, x + 0.47, y + 0.47, { fill: v.diverge(2 * u - 1, 'red', 'blue'), fillAlpha: 1, stroke: false, radius: 2 });
          }
          for (let k = 0; k <= K; k++) { G.text(String(k), k, -0.75, { size: 10, color: 'muted', baseline: 'top' }); G.text(String(k), -0.75, k, { size: 10, color: 'muted', align: 'right' }); }
          const sc = 2.6 / Math.max(...m1.slice(0, K + 1), ...n1.slice(0, K + 1), ...m2.slice(0, K + 1), ...n2.slice(0, K + 1));
          for (let k = 0; k <= K; k++) {
            G.rect(k - 0.4, 10.2, k - 0.02, 10.2 + m1[k] * sc, { fill: 'blue', fillAlpha: 0.7, stroke: false });
            G.rect(k + 0.02, 10.2, k + 0.4, 10.2 + n1[k] * sc, { fill: 'red', fillAlpha: 0.7, stroke: false });
            G.rect(10.2, k - 0.4, 10.2 + m2[k] * sc, k - 0.02, { fill: 'blue', fillAlpha: 0.7, stroke: false });
            G.rect(10.2, k + 0.02, 10.2 + n2[k] * sc, k + 0.4, { fill: 'red', fillAlpha: 0.7, stroke: false });
          }
          G.text('top: pair 1 (x)', 10.3, 12.2, { size: 11, color: 'ink', align: 'left' }); G.text('right: pair 2 (y)', 10.3, 11.3, { size: 11, color: 'ink', align: 'left' });
          const d1 = tvd(m1, n1), d2 = tvd(m2, n2);
          let s = 0, tm = 0, tn = 0; for (let x = 0; x <= 60; x++) for (let y = 0; y <= 60; y++) { const p = m1[x] * m2[y], q = n1[x] * n2[y]; s += Math.abs(p - q); tm += p; tn += q; }
          const dp = 0.5 * (s + Math.max(0, 1 - tm) + Math.max(0, 1 - tn));
          B.setView(null, [0, Math.max(0.1, (d1 + d2) * 1.2)]);
          B.rect(0.3, 0, 1.2, d1, { fill: 'teal', fillAlpha: 0.7, stroke: false });
          B.rect(0.3, d1, 1.2, d1 + d2, { fill: 'purple', fillAlpha: 0.7, stroke: false });
          B.rect(1.8, 0, 2.7, dp, { fill: 'accent', fillAlpha: 0.8, stroke: false });
          B.hline(d1 + d2, { color: 'muted', dash: [5, 4], width: 1.2 });
          v.legend([['blue', '$\\mu$ larger / $\\mu_i$', { area: true }], ['red', '$\\nu$ larger / $\\nu_i$', { area: true }], ['teal', '$\\|\\mu_1-\\nu_1\\|$', { area: true }], ['purple', '$\\|\\mu_2-\\nu_2\\|$', { area: true }], ['accent', '$\\|\\mu_1\\times\\mu_2-\\nu_1\\times\\nu_2\\|$', { area: true }]]);
          st = { d1, d2, dp };
        });
        v.readout(() => st && `$\\|\\mu_1\\times\\mu_2-\\nu_1\\times\\nu_2\\|=${v.fix(st.dp, 4)}\\ \\le\\ \\|\\mu_1-\\nu_1\\|+\\|\\mu_2-\\nu_2\\|=${v.fix(st.d1, 4)}+${v.fix(st.d2, 4)}=${v.fix(st.d1 + st.d2, 4)}$.`);
      },
    },
    {
      num: '3.6.6',
      kind: 'Lemma',
      name: 'Total variation of convolutions',
      statement: String.raw`For probability measures on $\Z$, with $(\mu_1*\mu_2)(x)=\sum_y\mu_1(x-y)\mu_2(y)$,
$$\|\mu_1*\mu_2-\nu_1*\nu_2\|\le\|\mu_1\times\mu_2-\nu_1\times\nu_2\|.$$`,
      idea: String.raw`The convolution is the image of the product measure under $(x,y)\mapsto x+y$: its mass at $k$ is the sum of the product along the anti-diagonal $x+y=k$. Summing first and then taking absolute values can only lose (triangle inequality), so the distance cannot grow. Combined with 3.6.5, $\|\mu_1*\mu_2-\nu_1*\nu_2\|\le\|\mu_1-\nu_1\|+\|\mu_2-\nu_2\|$: this is how Le Cam's argument handles a sum term by term.`,
      caption: String.raw`$\mu_1$ = Binomial$(3,p_1)$ against $\nu_1$ = Poisson$(3p_1)$, and $\mu_2$ = Bernoulli$(p_2)$ against $\nu_2$ = Poisson$(p_2)$. Left: the signed product difference on the grid, with the anti-diagonals $x+y=k$; within a diagonal blue and red cells partly cancel. Right: the convolution difference $(\mu_1*\mu_2-\nu_1*\nu_2)(k)$ (bars), i.e. the diagonal sums. The readout chains the three distances.`,
      deps: ['prob-3.6.3a', 'prob-3.6.5'],
      tags: ['metrics', 'convolution'],
      viz(v) {
        const M = v.M;
        const p1 = v.slider('$p_1$', 0.02, 0.9, 0.35, { step: 0.01 }), p2 = v.slider('$p_2$', 0.02, 0.9, 0.5, { step: 0.01 });
        const K = 5;
        const G = v.stage({ x: [-0.9, 5.7], y: [-0.9, 5.7], equal: true, height: 360, axes: false, title: 'product difference and anti-diagonals' });
        const C = v.stage({ x: [-0.6, 9.6], y: [-0.2, 0.2], height: 360, weight: 1.1, axes: 'box', gutter: true, xlabel: '$k$', title: 'convolution difference = diagonal sums' });
        let st = null;
        v.render(() => {
          const m1 = binomPmf(M, 3, p1.value), n1 = poisPmf(3 * p1.value, 40), m2 = binomPmf(M, 1, p2.value), n2 = poisPmf(p2.value, 40);
          const D = (x, y) => (m1[x] || 0) * (m2[y] || 0) - n1[x] * n2[y];
          let mx = 1e-9; for (let x = 0; x <= K; x++) for (let y = 0; y <= K; y++) mx = Math.max(mx, Math.abs(D(x, y)));
          for (let x = 0; x <= K; x++) for (let y = 0; y <= K; y++) { const u = clampN(D(x, y) / mx, -1, 1); G.rect(x - 0.46, y - 0.46, x + 0.46, y + 0.46, { fill: v.diverge(u, 'red', 'blue'), fillAlpha: 1, stroke: false, radius: 2 }); }
          for (let k = 1; k <= 2 * K; k++) G.line(Math.max(-0.5, k - K - 0.5) - 0.0, Math.min(K + 0.5, k + 0.5), Math.min(K + 0.5, k + 0.5), Math.max(-0.5, k - K - 0.5), { color: 'faint', width: 1 });
          for (let k = 0; k <= K; k++) { G.text(String(k), k, -0.75, { size: 10, color: 'muted', baseline: 'top' }); G.text(String(k), -0.75, k, { size: 10, color: 'muted', align: 'right' }); }
          G.text('x', 5.5, -0.75, { size: 11, color: 'muted', baseline: 'top' }); G.text('y', -0.75, 5.5, { size: 11, color: 'muted', align: 'right' });
          const cm = conv(m1, m2), cn = conv(n1, n2), cd = Array.from({ length: 10 }, (_, k) => (cm[k] || 0) - cn[k]);
          const yr = Math.max(0.02, ...cd.map(Math.abs)) * 1.25; C.setView(null, [-yr, yr]);
          C.hline(0, { color: 'muted', width: 1 });
          cd.forEach((d, k) => C.rect(k - 0.35, Math.min(0, d), k + 0.35, Math.max(0, d), { fill: d > 0 ? 'blue' : 'red', fillAlpha: 0.75, stroke: false }));
          let sp = 0, tm = 0, tn = 0; for (let x = 0; x <= 40; x++) for (let y = 0; y <= 40; y++) { const a = (m1[x] || 0) * (m2[y] || 0), b = n1[x] * n2[y]; sp += Math.abs(a - b); tm += a; tn += b; }
          const dprod = 0.5 * (sp + Math.max(0, 1 - tm) + Math.max(0, 1 - tn));
          v.legend([['blue', '$\\mu$ side larger', { area: true }], ['red', '$\\nu$ side larger', { area: true }]]);
          st = { dconv: tvd(cm, cn), dprod, dsum: tvd(m1, n1) + tvd(m2, n2) };
        });
        v.readout(() => st && `$\\|\\mu_1*\\mu_2-\\nu_1*\\nu_2\\|=${v.fix(st.dconv, 4)}\\ \\le\\ \\|\\mu_1\\times\\mu_2-\\nu_1\\times\\nu_2\\|=${v.fix(st.dprod, 4)}\\ \\le\\ \\|\\mu_1-\\nu_1\\|+\\|\\mu_2-\\nu_2\\|=${v.fix(st.dsum, 4)}$.`);
      },
    },
    {
      num: '3.6.7',
      kind: 'Lemma',
      name: 'Bernoulli versus Poisson in total variation (Le Cam)',
      credit: 'Hodges & Le Cam, 1960',
      statement: String.raw`Let $\mu$ be Bernoulli$(p)$ ($\mu(1)=p$, $\mu(0)=1-p$) and $\nu$ Poisson$(p)$. Then $\|\mu-\nu\|\le p^2$. Consequently, for independent Bernoulli$(p_{n,m})$ with sum $S_n$ and $\lambda_n=\sum_mp_{n,m}$,
$$\sup_A\big|P(S_n\in A)-P(\text{Poisson}(\lambda_n)\in A)\big|\le\sum_{m=1}^np_{n,m}^2.$$`,
      idea: String.raw`Directly, $2\|\mu-\nu\|=|1-p-e^{-p}|+|p-pe^{-p}|+(1-e^{-p}-pe^{-p})=2p(1-e^{-p})\le2p^2$, using $1-x\le e^{-x}\le1$. For the sum, the law of $S_n$ is the convolution of the Bernoulli laws and Poisson$(\lambda_n)$ is the convolution of the Poisson$(p_{n,m})$, so 3.6.6 and 3.6.5 bound the distance by $\sum_m\|\mu_{n,m}-\nu_{n,m}\|\le\sum_mp_{n,m}^2$: a second proof of 3.6.1 with a rate.`,
      caption: String.raw`Left: the exact distance $p(1-e^{-p})$ between Bernoulli$(p)$ and Poisson$(p)$ (accent) under $p^2$ (red); drag $p$. Right: for $n$ equal probabilities $\lambda/n$, the exact distance between Binomial$(n,\lambda/n)$ and Poisson$(\lambda)$ on log axes, below the sum of the single-term distances (orange) and Le Cam's $\lambda^2/n$ (red); Stein's sharper $\lambda^2/(n(\lambda\vee1))$ is dashed. At $\lambda=1$ the exact distance behaves like $3/(4en)$ (dotted).`,
      deps: ['prob-3.6.5', 'prob-3.6.6', 'prob-1.6.13'],
      tags: ['poisson', 'metrics'],
      viz(v) {
        const M = v.M;
        const lS = v.slider('$\\lambda$', 0.2, 5, 2, { step: 0.1 });
        const L = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: '$p$', title: '$\\|\\mathrm{Bernoulli}(p)-\\mathrm{Poisson}(p)\\|$' });
        const R = v.stage({ x: [1, 2000], xlog: true, y: [1e-5, 10], ylog: true, height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', title: 'Binomial$(n,\\lambda/n)$ vs Poisson$(\\lambda)$' });
        const H = L.handle(0.5, 0.5 * (1 - Math.exp(-0.5)), { color: 'gold', label: 'p', labelPos: 'nw', constrain: (x) => { const p = clampN(x, 0.005, 1); return [p, p * (1 - Math.exp(-p))]; } });
        const exactBP = (p) => tvd(binomPmf(M, 1, p), poisPmf(p, 30));
        let cache = null, st = null;
        v.render(() => {
          const lam = lS.value;
          L.fn((p) => p * p, { color: 'red', width: 2, dash: [6, 4] });
          L.fn((p) => p * (1 - Math.exp(-p)), { color: 'accent', width: 2.4 });
          const p = H.x, ex = exactBP(p);
          L.line(p, ex, p, p * p, { color: 'muted', width: 1, dash: [2, 3] });
          if (!cache || cache.lam !== lam) {
            const ns = logGrid(Math.max(1, Math.ceil(lam)), 2000, 70);
            cache = { lam, pts: ns.map((n) => [n, tvd(binomPmf(M, n, lam / n), poisPmf(lam, Math.max(n, 80)))]), n0: ns[0] };
          }
          R.fn((n) => (n >= lam ? (lam * lam) / n : NaN), { color: 'red', width: 1.8 });
          R.fn((n) => (n >= lam ? (lam * lam) / (n * Math.max(1, lam)) : NaN), { color: 'red', width: 1.3, dash: [6, 4] });
          R.fn((n) => (n >= lam ? n * (lam / n) * (1 - Math.exp(-lam / n)) : NaN), { color: 'orange', width: 1.8 });
          if (Math.abs(lam - 1) < 1e-9) R.fn((n) => 3 / (4 * Math.E * n), { color: 'muted', width: 1.3, dash: [2, 3] });
          R.path(cache.pts, { color: 'accent', width: 2.4 });
          v.legend([['accent', 'exact distance'], ['red', '$p^2$; Le Cam $\\sum p^2$'], ['orange', '$\\sum_m p(1-e^{-p})$'], ['red', 'Stein', { dash: true }], ...(Math.abs(lam - 1) < 1e-9 ? [['muted', '$3/(4en)$', { dash: true }]] : [])]);
          const last = cache.pts[cache.pts.length - 1];
          st = { p, ex, lam, last };
        });
        v.readout(() => st && `$p=${v.fix(st.p, 3)}$: $\\|\\mu-\\nu\\|=${v.fix(st.ex, 5)}=p(1-e^{-p})\\le p^2=${v.fix(st.p * st.p, 5)}$. At $n=2000$, $\\lambda=${v.fix(st.lam, 1)}$: exact $${v.sci(st.last[1], 3)}$ vs Le Cam $${v.sci((st.lam * st.lam) / 2000, 3)}$.`);
      },
    },
    // ======================================================================== §3.6.2 two examples with dependence
    {
      num: '3.6.8',
      kind: 'Theorem',
      name: 'Matching problem: fixed points are asymptotically Poisson',
      credit: 'Montmort, 1708',
      statement: String.raw`Let $\pi$ be a uniformly random permutation of $\{1,\dots,n\}$ and $S_n$ its number of fixed points. Then
$$P(S_n=0)=\sum_{m=0}^n\frac{(-1)^m}{m!},\qquad P(S_n=k)=\frac1{k!}P(S_{n-k}=0)\to\frac{e^{-1}}{k!},$$
so $S_n\Rightarrow$ Poisson$(1)$, and $|P(S_n=0)-e^{-1}|\le\frac1{(n+1)!}\big(1-\frac1{n+2}\big)^{-1}$.`,
      idea: String.raw`The events $A_m=\{\pi(m)=m\}$ are dependent, but weakly. Inclusion–exclusion with $P(A_{m_1}\cap\dots\cap A_{m_k})=(n-k)!/n!$ gives $P(S_n>0)=\sum_{m=1}^n(-1)^{m-1}/m!$, a partial sum of the series for $1-e^{-1}$, with an alternating tail that is tiny. Choosing which $k$ points are fixed and requiring no further fixed points on the rest gives $P(S_n=k)=\binom nk\frac{(n-k)!}{n!}P(S_{n-k}=0)$. The convergence is much faster than the $1/n$ of independent rare events.`,
      caption: String.raw`Left: one seeded permutation as the points $(i,\pi(i))$; the fixed points on the diagonal are green (Reshuffle for another). Right: the exact law of $S_n$ (bars), 5000 seeded shuffles (gold outline) and Poisson$(1)$ (green dots). Already at $n=5$ the exact law is within $10^{-3}$ of Poisson.`,
      deps: ['prob-1.6.13', 'prob-3.2.1a'],
      see: ['comb-3.4'],
      tags: ['poisson', 'permutations'],
      viz(v) {
        const nS = v.slider('$n$', 2, 30, 8, { int: true });
        let seed = 1; v.button('Reshuffle', () => { seed++; });
        const L = v.stage({ x: [0.3, 8.7], y: [0.3, 8.7], equal: true, height: 330, axes: 'box', gutter: true, xlabel: '$i$', ylabel: '$\\pi(i)$', title: 'a random permutation' });
        const R = v.stage({ x: [-0.6, 6.6], y: [0, 0.6], height: 330, weight: 1.25, axes: 'box', gutter: true, xlabel: '$k$', title: 'number of fixed points' });
        const shuffle = (r, n) => { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
        const d0 = (m) => { let s = 0, t = 1; for (let j = 0; j <= m; j++) { s += t; t *= -1 / (j + 1); } return s; };
        let st = null;
        v.render(() => {
          const n = nS.value, r = v.rng(seed * 7 + 1), pi = shuffle(r, n);
          L.setView([0.3, n + 0.7], [0.3, n + 0.7]);
          L.line(0.5, 0.5, n + 0.5, n + 0.5, { color: 'green', width: 1, dash: [4, 4] });
          pi.forEach((j, i) => L.dot(i + 1, j + 1, { r: n <= 15 ? 5 : 3.5, color: j === i ? 'green' : 'accent' }));
          const fixedNow = pi.filter((j, i) => i === j).length;
          const exact = Array.from({ length: 7 }, (_, k) => { if (k > n) return 0; let f = 1; for (let j = 2; j <= k; j++) f *= j; return d0(n - k) / f; });
          const counts = new Float64Array(7), r2 = v.rng(seed * 13 + 5); for (let s = 0; s < 5000; s++) { const q = shuffle(r2, n); const f = q.filter((j, i) => i === j).length; counts[Math.min(6, f)]++; }
          const emp = Array.from(counts, (c) => c / 5000), pois = poisPmf(1, 6);
          pmfBars(R, exact, 6, { w: 0.6 });
          for (let k = 0; k <= 6; k++) if (emp[k] > 0) R.rect(k - 0.3, 0, k + 0.3, emp[k], { color: 'gold', width: 1.8 });
          pmfDots(R, pois, 6, 'green', 0, 5);
          v.legend([['accent', 'exact $P(S_n=k)$', { area: true }], ['gold', '5000 seeded shuffles'], ['green', 'Poisson$(1)$', { dot: true }]]);
          let fact = 1; for (let j = 2; j <= n + 1; j++) fact *= j;
          st = { n, p0: exact[0], err: Math.abs(exact[0] - Math.exp(-1)), bnd: 1 / fact / (1 - 1 / (n + 2)), fixedNow, tv: tvd(exact, pois) };
        });
        v.readout(() => st && `This shuffle has ${st.fixedNow} fixed point${st.fixedNow === 1 ? '' : 's'}. $P(S_{${st.n}}=0)=${v.fix(st.p0, 7)}$ vs $e^{-1}=0.3678794$: error $${v.sci(st.err, 2)}\\le\\frac1{(n+1)!}(1-\\frac1{n+2})^{-1}=${v.sci(st.bnd, 2)}$. Total variation to Poisson$(1)$ (on $k\\le6$): $${v.sci(st.tv, 2)}$.`);
      },
    },
    {
      num: '3.6.10',
      kind: 'Theorem',
      name: 'Empty boxes in the occupancy problem',
      statement: String.raw`Place $r$ balls independently and uniformly into $n$ boxes. If $n\to\infty$ and $r$ varies with $n$ so that $ne^{-r/n}\to\lambda\in[0,\infty)$, then the number of empty boxes converges in distribution to Poisson$(\lambda)$. (Example: the coupon collector's time $T_n$ satisfies $P(T_n-n\log n\le nx)\to\exp(-e^{-x})$.)`,
      idea: String.raw`A given box is empty with probability $(1-1/n)^r\approx e^{-r/n}\approx\lambda/n$, so if boxes were independent 3.6.1 would apply. They are not, so compute: by inclusion–exclusion $P(\text{no empty box})=\sum_k(-1)^k\binom nk(1-k/n)^r$, and $\binom nk(1-k/n)^r\to\lambda^k/k!$ by careful estimates using $r=n\log n-n\log\lambda+o(n)$; dominated convergence gives $e^{-\lambda}$. Choosing which $m$ boxes are empty, $P(m\text{ empty})=\binom nm(1-m/n)^rP(\text{no empty among }n-m\text{ boxes})\to e^{-\lambda}\lambda^m/m!$.`,
      caption: String.raw`$r=n\log(n/\lambda)$ balls go into $n$ boxes. Left: one seeded throw, boxes shaded by their count, empty ones in red (up to $900$ boxes drawn). Right: the exact law of the number of empty boxes (computed by a Markov chain on the number of occupied boxes) against Poisson$(\lambda)$. The fit is already good for $n$ in the tens.`,
      deps: ['prob-3.6.1'],
      tags: ['poisson', 'occupancy'],
      viz(v) {
        const nS = v.slider('$n$ boxes', 10, 900, 100, { int: true, log: true });
        const lS = v.slider('$\\lambda$', 0.2, 5, 1.5, { step: 0.1 });
        let seed = 1; v.button('Throw again', () => { seed++; });
        const L = v.stage({ x: [-0.04, 1.04], y: [-0.04, 1.04], equal: true, height: 330, axes: false, title: 'one throw' });
        const R = v.stage({ x: [-0.6, 10.6], y: [0, 0.6], height: 330, weight: 1.25, axes: 'box', gutter: true, xlabel: '$m$ = number of empty boxes', title: 'law of the number of empty boxes' });
        const exactEmpty = (n, r, K) => {
          let lo = 0, p = new Float64Array([1]); // p[i] = P(occupied = lo + i)
          for (let s = 0; s < r; s++) {
            const q = new Float64Array(p.length + 1);
            for (let i = 0; i < p.length; i++) { const j = lo + i, up = (n - j) / n; q[i] += p[i] * (1 - up); q[i + 1] += p[i] * up; }
            let a = 0, b = q.length - 1; while (a < b && q[a] < 1e-17) a++; while (b > a && q[b] < 1e-17) b--;
            lo += a; p = q.slice(a, b + 1);
          }
          const out = new Float64Array(K + 1); for (let i = 0; i < p.length; i++) { const m = n - (lo + i); if (m <= K) out[m] += p[i]; } return out;
        };
        let cache = null, st = null;
        v.render(() => {
          const n = nS.value, lam = lS.value, r = Math.max(1, Math.round(n * Math.log(n / lam)));
          if (!cache || cache.n !== n || cache.r !== r) cache = { n, r, E: exactEmpty(n, r, 20) };
          const rg = v.rng(seed * 3 + 2), cnt = new Uint16Array(n); for (let i = 0; i < r; i++) cnt[Math.floor(rg() * n)]++;
          const side = Math.ceil(Math.sqrt(n)), w = 1 / side, cmax = Math.max(...cnt);
          for (let i = 0; i < n; i++) { const x = (i % side) * w, y = 1 - (Math.floor(i / side) + 1) * w, c = cnt[i]; L.rect(x + w * 0.06, y + w * 0.06, x + w * 0.94, y + w * 0.94, { fill: c === 0 ? 'red' : 'accent', fillAlpha: c === 0 ? 0.95 : 0.15 + (0.75 * c) / cmax, stroke: false }); }
          const empty = cnt.filter((c) => c === 0).length, P = poisPmf(lam, 20);
          R.setView(null, [0, Math.max(...cache.E, ...P) * 1.18]);
          pmfBars(R, cache.E, 10, { w: 0.6 });
          pmfDots(R, P, 10, 'green', 0, 5);
          R.vline(empty, { color: 'red', width: 1.2, dash: [3, 3] });
          v.legend([['accent', 'exact law', { area: true }], ['green', 'Poisson$(\\lambda)$', { dot: true }], ['red', 'empty boxes in this throw']]);
          st = { n, r, empty, p0: cache.E[0], tv: tvd(cache.E, P), lam };
        });
        v.readout(() => st && `$n=${st.n}$, $r=${st.r}$ balls ($ne^{-r/n}=${v.fix(st.n * Math.exp(-st.r / st.n), 3)}$); this throw left ${st.empty} empty. $P(\\text{no empty box})=${v.fix(st.p0, 4)}$ vs $e^{-\\lambda}=${v.fix(Math.exp(-st.lam), 4)}$; total variation to Poisson: $${v.fix(st.tv, 4)}$.`);
      },
    },
    // ======================================================================== §3.7 Poisson processes
    {
      num: '3.7.1',
      kind: 'Theorem',
      name: 'Poisson convergence for integer-valued arrays',
      statement: String.raw`For each $n$ let $X_{n,1},\dots,X_{n,n}$ be independent nonnegative integer-valued with $P(X_{n,m}=1)=p_{n,m}$ and $P(X_{n,m}\ge2)=\eps_{n,m}$. If (i) $\sum_mp_{n,m}\to\lambda\in(0,\infty)$, (ii) $\max_mp_{n,m}\to0$ and (iii) $\sum_m\eps_{n,m}\to0$, then $S_n=X_{n,1}+\dots+X_{n,n}\Rightarrow$ Poisson$(\lambda)$.`,
      idea: String.raw`Replace each $X_{n,m}$ by the indicator $X'_{n,m}=1(X_{n,m}=1)$. Theorem 3.6.1 handles $S'_n=\sum X'_{n,m}$, and $P(S_n\ne S'_n)\le\sum_m\eps_{n,m}\to0$ by (iii), so the converging-together lemma (Exercise 3.2.13) transfers the limit.`,
      caption: String.raw`Each term is $1$ with probability $\lambda/n$ and $2$ with probability $\eps_n$. With $\eps_n=c/n^2$ the double hits are negligible and the exact law of $S_n$ (bars) approaches Poisson$(\lambda)$ (green dots). With $\eps_n=c/n$, condition (iii) fails: double hits survive in the limit, which is Poisson$(\lambda)+2\,$Poisson$(c)$ (orange dots), not Poisson. Right: the total variation to Poisson$(\lambda)$ against $n$ for both choices.`,
      deps: ['prob-3.6.1', 'prob-3.2.10'],
      tags: ['poisson'],
      viz(v) {
        const sc = v.select('$\\eps_n$', [{ value: 'n2', label: '$c/n^2$ (negligible)' }, { value: 'n1', label: '$c/n$ (not negligible)' }], 'n2');
        const nS = v.slider('$n$', 4, 2000, 40, { int: true, log: true });
        const lS = v.slider('$\\lambda$', 0.5, 5, 2, { step: 0.1 });
        const cS = v.slider('$c$', 0.1, 2, 0.6, { step: 0.05 });
        const L = v.stage({ x: [-0.6, 12.6], y: [0, 0.4], height: 320, weight: 1.25, axes: 'box', gutter: true, xlabel: '$k$', title: 'law of $S_n$' });
        const R = v.stage({ x: [4, 2000], xlog: true, y: [1e-4, 1], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'distance to Poisson$(\\lambda)$' });
        const lawS = (n, lam, eps, K) => { let p = new Float64Array([1 - lam / n - eps, lam / n, eps]); let out = new Float64Array([1]); let m = n; let base = p; while (m > 0) { if (m & 1) out = conv(out, base).slice(0, K + 1); base = conv(base, base).slice(0, K + 1); m >>= 1; } return out; };
        let cache = null, st = null;
        v.render(() => {
          const md = sc.value, n = nS.value, lam = lS.value, c = cS.value, K = 40;
          const epsOf = (m, mode) => Math.min(0.5, mode === 'n2' ? c / (m * m) : c / m);
          const S = lawS(n, lam, epsOf(n, md), K), P = poisPmf(lam, K), comp = conv(P, Float64Array.from({ length: K + 1 }, (_, k) => (k % 2 ? 0 : poisPmf(c, K)[k / 2]))).slice(0, K + 1);
          if (!cache || cache.lam !== lam || cache.c !== c) { const ns = logGrid(Math.max(4, Math.ceil(lam + 2 * c + 2)), 2000, 40); cache = { lam, c, a: ns.map((m) => [m, tvd(lawS(m, lam, epsOf(m, 'n2'), K), P)]), b: ns.map((m) => [m, tvd(lawS(m, lam, epsOf(m, 'n1'), K), P)]) }; }
          const Kd = Math.max(8, Math.ceil(lam + 2 * c + 4 * Math.sqrt(lam + 4 * c) + 1));
          L.setView([-0.6, Kd + 0.6], [0, Math.max(...S, ...P) * 1.15]);
          pmfBars(L, S, Kd, { w: 0.6 });
          pmfDots(L, P, Kd, 'green', -0.12, 4.5);
          if (md === 'n1') pmfDots(L, comp, Kd, 'orange', 0.12, 4.5);
          R.path(cache.a, { color: 'accent', width: 2.2 });
          R.path(cache.b, { color: 'red', width: 2.2 });
          R.dot(n, tvd(S, P), { r: 5, color: 'gold' });
          v.legend([['accent', 'exact law / distance, $\\eps_n=c/n^2$'], ['red', 'distance, $\\eps_n=c/n$'], ['green', 'Poisson$(\\lambda)$', { dot: true }], ...(md === 'n1' ? [['orange', 'Poisson$(\\lambda)+2\\,$Poisson$(c)$', { dot: true }]] : [])]);
          st = { tv: tvd(S, P), seps: n * epsOf(n, md), tvc: tvd(S, comp) };
        });
        v.readout(() => st && `$\\sum_m\\eps_{n,m}=${v.fix(st.seps, 4)}$; total variation to Poisson$(\\lambda)$: $${v.fix(st.tv, 4)}$; to Poisson$(\\lambda)+2\\,$Poisson$(c)$: $${v.fix(st.tvc, 4)}$.`);
      },
    },
    {
      num: '3.7.2',
      kind: 'Theorem',
      name: 'Axioms for counting processes give Poisson counts',
      statement: String.raw`Let $N(s,t)$ count arrivals in $(s,t]$, and suppose
(i) counts in disjoint intervals are independent;
(ii) the law of $N(s,t)$ depends only on $t-s$;
(iii) $P(N(0,h)=1)=\lambda h+o(h)$;
(iv) $P(N(0,h)\ge2)=o(h)$ as $h\to0$.
Then $N(0,t)$ has the Poisson distribution with mean $\lambda t$.`,
      idea: String.raw`Chop $(0,t]$ into $n$ slots of length $t/n$ and let $X_{n,m}$ be the count in slot $m$. By (i)–(ii) these are i.i.d.; by (iii) $\sum_mP(X_{n,m}=1)\to\lambda t$ with each term small; by (iv) $\sum_mP(X_{n,m}\ge2)=n\,o(t/n)\to0$. Theorem 3.7.1 gives $N(0,t)=\sum_mX_{n,m}\Rightarrow$ Poisson$(\lambda t)$, and $N(0,t)$ does not depend on $n$.`,
      caption: String.raw`Top: 24 seeded runs on $[0,t]$ split into $n$ slots, each slot holding an arrival with probability $\lambda t/n$ (slot grid drawn when $n\le60$). Bottom: the exact law of the count (bars) against Poisson$(\lambda t)$ (green). Switch to *clumps*: arrivals come in pairs with probability $\lambda t/2n$ per slot, which keeps the mean but breaks axiom (iv); the count is then twice a Poisson variable, with variance twice the mean.`,
      deps: ['prob-3.7.1'],
      tags: ['poisson process'],
      viz(v) {
        const M = v.M;
        const md = v.select('slots', [{ value: 'single', label: 'single arrivals' }, { value: 'pair', label: 'clumps of 2 (breaks iv)' }], 'single');
        const nS = v.slider('$n$ slots', 1, 500, 12, { int: true, log: true });
        const lS = v.slider('$\\lambda t$', 0.5, 8, 3, { step: 0.1 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const T = v.stage({ x: [0, 1], y: [0, 24.5], height: 230, full: true, axes: 'box', gutter: true, xlabel: 'time $s/t$', title: 'seeded runs', yticks: [] });
        const B = v.stage({ x: [-0.6, 14.6], y: [0, 0.4], height: 230, full: true, axes: 'box', gutter: true, xlabel: '$k$', title: 'law of $N(0,t)$' });
        let st = null;
        v.render(() => {
          const pair = md.value === 'pair', n = nS.value, mu = lS.value, p = Math.min(1, pair ? mu / (2 * n) : mu / n), r = v.rng(seed * 19 + 3);
          if (n <= 60) for (let j = 0; j <= n; j++) T.vline(j / n, { color: 'grid', width: 1 });
          const totals = [];
          for (let row = 0; row < 24; row++) {
            let c = 0; const y = 23.6 - row;
            for (let j = 0; j < n; j++) if (r() < p) { const x = (j + 0.5) / n; if (pair) { T.dot(x, y + 0.18, { r: 2.6, color: 'red' }); T.dot(x, y - 0.18, { r: 2.6, color: 'red' }); c += 2; } else { T.dot(x, y, { r: 3, color: 'accent' }); c++; } }
            totals.push(c);
          }
          const K = 40, bn = binomPmf(M, n, p), law = new Float64Array(K + 1); for (let k = 0; k <= n; k++) { const idx = pair ? 2 * k : k; if (idx <= K) law[idx] += bn[k]; }
          const P = poisPmf(mu, K), Kd = Math.min(K, Math.ceil(mu + 4 * Math.sqrt(pair ? 2 * mu : mu) + 2));
          B.setView([-0.6, Kd + 0.6], [0, Math.max(...law, ...P) * 1.15]);
          pmfBars(B, law, Kd, { w: 0.6, color: pair ? 'red' : 'accent' });
          pmfDots(B, P, Kd, 'green', 0, 4.5);
          v.legend([[pair ? 'red' : 'accent', 'arrivals / exact law of $N(0,t)$'], ['green', 'Poisson$(\\lambda t)$', { dot: true }]]);
          const m = law.reduce((a, q, k) => a + k * q, 0), m2 = law.reduce((a, q, k) => a + k * k * q, 0);
          st = { tv: tvd(law, P), m, vr: m2 - m * m, p2: pair ? p : 0, n };
        });
        v.readout(() => st && `Mean $${v.fix(st.m, 3)}$, variance $${v.fix(st.vr, 3)}$ (Poisson: equal). Total variation to Poisson$(\\lambda t)$: $${v.fix(st.tv, 4)}$. ` + (st.p2 ? `Here $P(N(0,h)\\ge2)/h$ stays at $\\lambda/2$ as $h=t/n\\to0$: axiom (iv) fails.` : 'Axiom (iv) holds: no slot ever has two arrivals.'));
      },
    },
    {
      num: '3.7.2a',
      kind: 'Definition',
      name: 'Poisson process',
      verify: true,
      statement: String.raw`A family $(N_t)_{t\ge0}$ is a **Poisson process with rate $\lambda$** if
(i) for $0=t_0<t_1<\dots<t_n$ the increments $N(t_k)-N(t_{k-1})$, $1\le k\le n$, are independent, and
(ii) $N(t)-N(s)$ is Poisson$(\lambda(t-s))$ for $s<t$.
**Construction:** with $\xi_1,\xi_2,\dots$ i.i.d. exponential$(\lambda)$ and $T_n=\xi_1+\dots+\xi_n$, the counting process $N_t=\sup\{n:T_n\le t\}$ is a Poisson process; $T_n$ is the $n$-th arrival time.`,
      idea: String.raw`$T_n$ has the gamma density $\lambda^ns^{n-1}e^{-\lambda s}/(n-1)!$, so $P(N_t=n)=P(T_n\le t<T_{n+1})=\int_0^tf_{T_n}(s)e^{-\lambda(t-s)}ds=e^{-\lambda t}(\lambda t)^n/n!$. Independence of increments comes from the lack of memory of the exponential: given $N_t=n$, the wait from $t$ to the next arrival is again exponential$(\lambda)$ and independent of the past, so the process starts afresh at every fixed time.`,
      caption: String.raw`Top: 14 seeded paths built from exponential gaps; drag the four handles to set two windows $I_1$ (accent) and $I_2$ (orange). Bottom left: the count in $I_1$ over 4000 seeded paths against Poisson$(\lambda|I_1|)$. Bottom right: the joint frequencies of the two counts. For disjoint windows the correlation is near $0$; slide them to overlap and it turns positive.`,
      deps: ['prob-3.7.2', 'prob-2.1.18'],
      see: ['stoch-9.3'],
      tags: ['poisson process'],
      viz(v) {
        const lS = v.slider('rate $\\lambda$', 0.3, 3, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const T = v.stage({ x: [0, 10], y: [-1.6, 14.5], height: 280, full: true, axes: 'box', gutter: true, xlabel: '$t$', title: 'arrival times of 14 paths', yticks: [] });
        const B = v.stage({ x: [-0.6, 12.6], y: [0, 0.4], height: 280, weight: 1.2, axes: 'box', gutter: true, xlabel: '$N(I_1)$', title: 'count in $I_1$ over 4000 paths' });
        const J = v.stage({ x: [-0.5, 10.5], y: [-0.5, 10.5], height: 280, axes: 'box', gutter: true, xlabel: '$N(I_1)$', ylabel: '$N(I_2)$', title: 'joint counts' });
        const hy = -1; const mk = (x, c) => T.handle(x, hy, { color: c, constrain: (xx) => [clampN(xx, 0, 10), hy] });
        const a1 = mk(1, 'accent'), b1 = mk(4, 'accent'), a2 = mk(5.5, 'orange'), b2 = mk(9, 'orange');
        let sim = null, st = null;
        v.render(() => {
          const lam = lS.value, I1 = [Math.min(a1.x, b1.x), Math.max(a1.x, b1.x)], I2 = [Math.min(a2.x, b2.x), Math.max(a2.x, b2.x)];
          T.vband(I1[0], I1[1], { color: 'accent', alpha: 0.1 }); T.vband(I2[0], I2[1], { color: 'orange', alpha: 0.1 });
          T.line(I1[0], hy, I1[1], hy, { color: 'accent', width: 4 }); T.line(I2[0], hy, I2[1], hy, { color: 'orange', width: 4 });
          if (!sim || sim.lam !== lam || sim.seed !== seed) { const r = v.rng(seed * 23 + 1); sim = { lam, seed, paths: Array.from({ length: 4000 }, () => arrivals(r, lam, 10)) }; }
          for (let i = 0; i < 14; i++) { const y = 13.8 - i; T.hline(y, { color: 'grid', width: 1 }); sim.paths[i].forEach((t) => T.dot(t, y, { r: 2.8, color: t >= I1[0] && t <= I1[1] ? 'accent' : t >= I2[0] && t <= I2[1] ? 'orange' : 'ink' })); }
          const c1 = [], c2 = []; for (const p of sim.paths) { let u = 0, w = 0; for (const t of p) { if (t > I1[0] && t <= I1[1]) u++; if (t > I2[0] && t <= I2[1]) w++; } c1.push(u); c2.push(w); }
          const mu1 = lam * (I1[1] - I1[0]), P = poisPmf(mu1, 40), Kd = Math.max(6, Math.min(30, Math.ceil(mu1 + 4 * Math.sqrt(mu1) + 2)));
          const emp = new Float64Array(Kd + 1); c1.forEach((c) => { if (c <= Kd) emp[c] += 1 / c1.length; });
          B.setView([-0.6, Kd + 0.6], [0, Math.max(...emp, ...P.slice(0, Kd + 1)) * 1.15]);
          pmfBars(B, emp, Kd, { w: 0.6 });
          pmfDots(B, P, Kd, 'green', 0, 4.5);
          const K2 = Math.max(6, Math.ceil(Math.max(...c1, ...c2) * 0.8)); J.setView([-0.5, K2 + 0.5], [-0.5, K2 + 0.5]);
          const tab = new Map(); c1.forEach((u, i) => { const k = `${u},${c2[i]}`; tab.set(k, (tab.get(k) || 0) + 1); });
          let mxc = 1; tab.forEach((c) => { mxc = Math.max(mxc, c); });
          tab.forEach((c, k) => { const [u, w] = k.split(',').map(Number); if (u <= K2 && w <= K2) J.rect(u - 0.45, w - 0.45, u + 0.45, w + 0.45, { fill: 'purple', fillAlpha: 0.08 + 0.85 * Math.sqrt(c / mxc), stroke: false }); });
          v.legend([['accent', '$I_1$ / sample of $N(I_1)$', { area: true }], ['orange', '$I_2$', { area: true }], ['green', 'Poisson$(\\lambda|I_1|)$', { dot: true }]]);
          const ov = Math.max(0, Math.min(I1[1], I2[1]) - Math.max(I1[0], I2[0]));
          st = { m: mean(c1), vr: varr(c1), mu1, rho: corr(c1, c2), ov, theo: ov > 0 ? (lam * ov) / Math.sqrt(mu1 * lam * (I2[1] - I2[0])) : 0 };
        });
        v.readout(() => st && `$N(I_1)$: mean $${v.fix(st.m, 3)}$, variance $${v.fix(st.vr, 3)}$ (Poisson: both $\\lambda|I_1|=${v.fix(st.mu1, 3)}$). Correlation of $N(I_1),N(I_2)$: $${v.fix(st.rho, 3)}$` + (st.ov > 0 ? ` — the windows overlap by $${v.fix(st.ov, 2)}$ (theory: $\\lambda|I_1\\cap I_2|/\\sqrt{\\lambda|I_1|\\lambda|I_2|}=${v.fix(st.theo, 3)}$).` : ' (disjoint windows: independent counts).'));
      },
    },
    {
      num: '3.7.3',
      kind: 'Theorem',
      name: 'Mean and variance of a random sum',
      statement: String.raw`Let $Y_1,Y_2,\dots$ be i.i.d., $N$ an independent nonnegative integer-valued random variable, and $S=Y_1+\dots+Y_N$ ($S=0$ if $N=0$).
(i) If $E|Y_i|,EN<\infty$, then $ES=EN\cdot EY_i$.
(ii) If $EY_i^2,EN^2<\infty$, then $\operatorname{var}(S)=EN\operatorname{var}(Y_i)+\operatorname{var}(N)(EY_i)^2$.
(iii) If $N$ is Poisson$(\lambda)$, then $\operatorname{var}(S)=\lambda EY_i^2$.`,
      idea: String.raw`Condition on $N$: given $N=n$, $S$ has mean $nEY$ and second moment $n\operatorname{var}(Y)+n^2(EY)^2$. Averaging over $N$ gives $ES=EN\,EY$ and $ES^2=EN\operatorname{var}(Y)+EN^2(EY)^2$, and subtracting $(ES)^2$ leaves the two variance contributions: one from the spread of the $Y$'s, one from the spread of $N$. For Poisson $N$, $EN=\operatorname{var}N=\lambda$ and the two combine into $\lambda EY^2$.`,
      caption: String.raw`Cars arrive ($N$ of them) carrying $Y$ people each. Pick the laws of $N$ and $Y$. Left: histogram of 6000 seeded totals $S$. Right: the variance split into $EN\operatorname{var}(Y)$ (accent) and $\operatorname{var}(N)(EY)^2$ (orange), next to the empirical variance (gold). The geometric $N$ has the same mean as the others but a large variance, and its share dominates.`,
      deps: ['prob-2.1.13', 'prob-1.6.9a'],
      tags: ['random sums'],
      viz(v) {
        const NL = {
          pois: { label: 'Poisson$(4)$', m: 4, v: 4, draw: (r) => samplePois(r, 4) },
          bin: { label: 'Binomial$(8,\\frac12)$', m: 4, v: 2, draw: (r) => { let k = 0; for (let i = 0; i < 8; i++) if (r() < 0.5) k++; return k; } },
          geo: { label: 'geometric, mean 4', m: 4, v: 20, draw: (r) => Math.floor(Math.log(1 - r()) / Math.log(0.8)) },
        };
        const YL = {
          exp: { label: 'exponential, mean 2', m: 2, v: 4, draw: (r) => -2 * Math.log(1 - r()) },
          die: { label: 'uniform $\\{1,\\dots,5\\}$', m: 3, v: 2, draw: (r) => 1 + Math.floor(5 * r()) },
        };
        const nl = v.select('$N$', Object.keys(NL).map((k) => ({ value: k, label: NL[k].label })), 'pois');
        const yl = v.select('$Y$', Object.keys(YL).map((k) => ({ value: k, label: YL[k].label })), 'die');
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 50], y: [0, 0.1], height: 320, weight: 1.4, axes: 'box', gutter: true, xlabel: '$S=Y_1+\\dots+Y_N$', title: '6000 seeded random sums' });
        const R = v.stage({ x: [0, 2], y: [0, 100], height: 320, axes: 'box', gutter: true, title: '$\\operatorname{var}(S)$', xticks: [[0.5, 'formula'], [1.5, 'sample']] });
        let st = null;
        const M_q = (xs, q) => v.M.quantile(xs, q);
        v.render(() => {
          const N = NL[nl.value], Y = YL[yl.value], r = v.rng(seed * 29 + 11), xs = [];
          for (let i = 0; i < 6000; i++) { const n = N.draw(r); let s = 0; for (let j = 0; j < n; j++) s += Y.draw(r); xs.push(s); }
          const mE = mean(xs), vE = varr(xs), mT = N.m * Y.m, a = N.m * Y.v, b = N.v * Y.m * Y.m;
          const hi = Math.max(10, Math.ceil(M_q(xs, 0.995))); L.setView([-0.5, hi], null);
          const disc = yl.value === 'die', H = v.M.histogram(xs, { bins: disc ? Array.from({ length: hi + 2 }, (_, i) => i - 0.5) : Array.from({ length: 41 }, (_, i) => (hi * i) / 40) });
          L.setView(null, [0, Math.max(...H.density) * 1.15]);
          L.hist(H, { density: true, color: 'accent', fillAlpha: 0.35, width: 1 });
          L.vline(mT, { color: 'green', width: 2, dash: [6, 4] }); L.vline(mE, { color: 'gold', width: 1.5 });
          R.setView(null, [0, Math.max(a + b, vE) * 1.18]);
          R.rect(0.15, 0, 0.85, a, { fill: 'accent', fillAlpha: 0.75, stroke: false });
          R.rect(0.15, a, 0.85, a + b, { fill: 'orange', fillAlpha: 0.75, stroke: false });
          R.rect(1.15, 0, 1.85, vE, { fill: 'gold', fillAlpha: 0.75, stroke: false });
          v.legend([['green', '$EN\\cdot EY$', { dash: true }], ['gold', 'sample mean / variance'], ['accent', '$EN\\operatorname{var}(Y)$', { area: true }], ['orange', '$\\operatorname{var}(N)(EY)^2$', { area: true }]]);
          st = { mE, mT, vE, a, b, pois: nl.value === 'pois', ey2: Y.v + Y.m * Y.m };
        });
        v.readout(() => st && `Mean: sample $${v.fix(st.mE, 3)}$ vs $EN\\cdot EY=${v.fix(st.mT, 3)}$. Variance: sample $${v.fix(st.vE, 2)}$ vs $${v.fix(st.a, 2)}+${v.fix(st.b, 2)}=${v.fix(st.a + st.b, 2)}$` + (st.pois ? ` $=\\lambda EY^2=4\\times${v.fix(st.ey2, 2)}$.` : '.'));
      },
    },
    {
      num: '3.7.4',
      kind: 'Theorem',
      name: 'Colouring a Poisson process: independent Poisson processes',
      statement: String.raw`Let $N(t)$ be a Poisson process with rate $\lambda$ and give the $i$-th arrival an independent label $Y_i$ with $P(Y_i=j)=p_j$. Let $N_j(t)$ count the arrivals up to time $t$ with label $j$. Then $N_1,N_2,\dots$ are **independent** Poisson processes with rates $\lambda p_1,\lambda p_2,\dots$.`,
      idea: String.raw`For two labels with probabilities $p$ and $1-p$, if $j$ red and $k$ blue arrivals occur in a window of length $t$, there were $j+k$ arrivals and a binomial split:
$$P(X_1=j,X_2=k)=e^{-\lambda t}\frac{(\lambda t)^{j+k}}{(j+k)!}\binom{j+k}jp^j(1-p)^k=e^{-\lambda pt}\frac{(\lambda pt)^j}{j!}\cdot e^{-\lambda(1-p)t}\frac{(\lambda(1-p)t)^k}{k!}.$$
The joint law factors, so the counts are independent Poissons; independent increments of $N$ extend this to the whole processes, and the multinomial does the same for more labels. The surprise is the independence: a busy hour for red says nothing about blue.`,
      caption: String.raw`Top: one seeded path on $[0,10]$, each arrival red with probability $p$, and the red and blue processes split onto their own lines. Right: the pair (red count, blue count) on $[0,10]$ for 1500 seeded paths (jittered), with the sample correlation. Switch on "fix the total" to condition on $N(10)=\lceil10\lambda\rceil$: the split becomes binomial with a fixed total and the counts are perfectly negatively correlated. Independence needs the Poisson total.`,
      deps: ['prob-3.7.2a'],
      see: ['stoch-9.6'],
      tags: ['poisson process', 'thinning'],
      viz(v) {
        const lS = v.slider('rate $\\lambda$', 0.5, 4, 2, { step: 0.05 });
        const pS = v.slider('$p$ = P(red)', 0.05, 0.95, 0.4, { step: 0.01 });
        const fix = v.toggle('fix the total $N(10)$', false);
        let seed = 1; v.button('Resample', () => { seed++; });
        const T = v.stage({ x: [0, 10], y: [0.5, 3.5], height: 330, weight: 1.3, axes: 'box', gutter: true, xlabel: '$t$', title: 'thinning one path', yticks: [[3, 'all'], [2, 'red'], [1, 'blue']] });
        const S = v.stage({ x: [0, 30], y: [0, 30], height: 330, axes: 'box', gutter: true, xlabel: 'red count', ylabel: 'blue count', title: '1500 paths' });
        let st = null;
        v.render(() => {
          const lam = lS.value, p = pS.value, r = v.rng(seed * 31 + 7), Tm = 10, n0 = Math.ceil(lam * Tm);
          const path = arrivals(r, lam, Tm).map((t) => [t, r() < p]);
          T.hline(3, { color: 'grid', width: 1 }); T.hline(2, { color: 'grid', width: 1 }); T.hline(1, { color: 'grid', width: 1 });
          path.forEach(([t, red]) => { T.dot(t, 3, { r: 3.4, color: red ? 'red' : 'blue' }); T.line(t, 3, t, red ? 2 : 1, { color: red ? 'red' : 'blue', width: 0.8, alpha: 0.35 }); T.dot(t, red ? 2 : 1, { r: 3.4, color: red ? 'red' : 'blue' }); });
          const R = [], B = [], r2 = v.rng(seed * 37 + 3);
          for (let i = 0; i < 1500; i++) { const n = fix.value ? n0 : samplePois(r2, lam * Tm); let k = 0; for (let j = 0; j < n; j++) if (r2() < p) k++; R.push(k); B.push(n - k); }
          const top = Math.max(10, Math.ceil(Math.max(...R, ...B) * 1.05)); S.setView([-0.5, top], [-0.5, top]);
          const rj = v.rng(5); R.forEach((x, i) => S.dot(x + (rj() - 0.5) * 0.6, B[i] + (rj() - 0.5) * 0.6, { r: 2, color: 'purple', alpha: 0.35 }));
          S.dot(lam * p * Tm, lam * (1 - p) * Tm, { r: 6, color: 'gold' });
          S.text('(λpt, λ(1−p)t)', lam * p * Tm, lam * (1 - p) * Tm, { dx: 12, dy: -14, align: 'left', size: 12, color: 'ink', plate: true });
          v.legend([['red', 'red arrivals'], ['blue', 'blue arrivals'], ['purple', '(red, blue) counts', { dot: true }]]);
          st = { rho: corr(R, B), mr: mean(R), vr: varr(R), mb: mean(B), lam, p, fix: fix.value, n0 };
        });
        v.readout(() => st && `Red count: mean $${v.fix(st.mr, 2)}$, variance $${v.fix(st.vr, 2)}$ (Poisson$(\\lambda pt)$: both $${v.fix(st.lam * st.p * 10, 2)}$). Correlation(red, blue) $=${v.fix(st.rho, 3)}$` + (st.fix ? ` — with the total fixed at ${st.n0} the counts are tied together.` : ' — independent, as the theorem says.'));
      },
    },
    {
      num: '3.7.5',
      kind: 'Theorem',
      name: 'Time-dependent thinning: a nonhomogeneous Poisson process',
      statement: String.raw`In a Poisson process with rate $\lambda$, keep an arrival at time $s$ with probability $p(s)$, independently of everything else. The kept points form a nonhomogeneous Poisson process with rate $\lambda p(s)$: counts in disjoint intervals are independent, and the number kept in $[0,t]$ is Poisson with mean $\lambda\int_0^tp(s)\,ds$.`,
      idea: String.raw`Cut $[0,t]$ into short intervals on which $p$ is nearly constant. On each, thinning with a constant probability gives a Poisson count with mean $\approx\lambda p(s)\,\Delta s$ (3.7.4), and counts on disjoint intervals are independent because the original process has independent increments. Sums of independent Poissons are Poisson, with mean $\approx\sum\lambda p(s)\Delta s\to\lambda\int_0^tp(s)ds$.`,
      caption: String.raw`Drag the five handles to draw the keep-probability $p(s)$ on $[0,10]$ (piecewise linear). Left: $\lambda p(s)$ (accent), one seeded path with kept arrivals (green) and discarded ones (grey), and the histogram of kept times pooled over 3000 paths, which follows $\lambda p(s)$. Right: the number kept over 3000 paths against Poisson$(\lambda\int_0^{10}p)$.`,
      deps: ['prob-3.7.4'],
      see: ['stoch-9.9'],
      tags: ['poisson process', 'thinning'],
      viz(v) {
        const lS = v.slider('rate $\\lambda$', 0.5, 4, 2, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 10], y: [-0.9, 4.2], height: 330, weight: 1.35, axes: 'box', gutter: true, xlabel: '$s$', title: 'rate $\\lambda p(s)$ and kept arrivals' });
        const R = v.stage({ x: [-0.6, 20.6], y: [0, 0.25], height: 330, axes: 'box', gutter: true, xlabel: 'number kept in $[0,10]$', title: 'count of kept points' });
        const xs0 = [0, 2.5, 5, 7.5, 10], ys0 = [0.1, 0.9, 0.3, 0.7, 1];
        const Hs = xs0.map((x, i) => L.handle(x, ys0[i] * 2, { color: 'accent', constrain: (_, y) => [x, clampN(y, 0, 4)] }));
        let st = null;
        v.render(() => {
          const lam = lS.value; Hs.forEach((h, i) => { const y = clampN(h.y, 0, lam); if (y !== h.y) h.set(xs0[i], y); });
          const pf = (s) => { const i = Math.min(3, Math.floor(s / 2.5)), t = (s - xs0[i]) / 2.5; return clampN(((1 - t) * Hs[i].y + t * Hs[i + 1].y) / lam, 0, 1); };
          L.setView(null, [-0.9, Math.max(2.2, lam * 1.05)]);
          const r = v.rng(seed * 41 + 9), kept = [], allKeptTimes = [];
          for (let i = 0; i < 3000; i++) { let k = 0; for (const t of arrivals(r, lam, 10)) if (r() < pf(t)) { k++; allKeptTimes.push(t); } kept.push(k); }
          const H = v.M.histogram(allKeptTimes, { bins: Array.from({ length: 26 }, (_, i) => (10 * i) / 25) });
          const dens = { edges: H.edges, counts: H.counts, density: H.counts.map((c) => c / (3000 * 0.4)) };
          L.hist(dens, { density: true, color: 'green', fillAlpha: 0.18, width: 1 });
          L.hline(lam, { color: 'muted', dash: [4, 4], width: 1 });
          L.fn((s) => lam * pf(s), { color: 'accent', width: 2.4 });
          const r1 = v.rng(seed * 43 + 1);
          for (const t of arrivals(r1, lam, 10)) { const keep = r1() < pf(t); L.dot(t, -0.5, { r: 3.4, color: keep ? 'green' : 'faint' }); }
          L.text('one path:', 0.1, -0.5, { dy: -14, size: 11, color: 'muted', align: 'left' });
          const integ = (() => { let s = 0; for (let i = 0; i < 1000; i++) s += pf((i + 0.5) / 100) / 100; return s; })(), mu = lam * integ;
          const P = poisPmf(mu, 60), Kd = Math.max(8, Math.min(40, Math.ceil(mu + 4 * Math.sqrt(mu) + 2)));
          const emp = new Float64Array(Kd + 1); kept.forEach((k) => { if (k <= Kd) emp[k] += 1 / kept.length; });
          R.setView([-0.6, Kd + 0.6], [0, Math.max(...emp, ...P.slice(0, Kd + 1)) * 1.15]);
          pmfBars(R, emp, Kd, { w: 0.6, color: 'green' });
          pmfDots(R, P, Kd, 'accent', 0, 4.5);
          v.legend([['accent', '$\\lambda p(s)$; Poisson$(\\lambda\\int p)$'], ['green', 'kept points / their counts', { area: true }], ['muted', '$\\lambda$', { dash: true }]]);
          st = { m: mean(kept), vr: varr(kept), mu };
        });
        v.readout(() => st && `Kept count over 3000 paths: mean $${v.fix(st.m, 3)}$, variance $${v.fix(st.vr, 3)}$; $\\lambda\\int_0^{10}p(s)\\,ds=${v.fix(st.mu, 3)}$ (a Poisson law has mean = variance).`);
      },
    },
    // ======================================================================== §3.7.3 conditioning
    {
      num: '3.7.9',
      kind: 'Theorem',
      name: 'Given N(t) = n, the arrivals are uniform order statistics',
      statement: String.raw`Let $T_1<T_2<\dots$ be the arrival times of a rate-$\lambda$ Poisson process, and let $V_1^n<\dots<V_n^n$ be the order statistics of $n$ independent uniforms on $(0,t)$. Conditionally on $N(t)=n$, the vector $(T_1,\dots,T_n)$ has the same distribution as $(V_1^n,\dots,V_n^n)$. In particular the conditional law does not depend on $\lambda$.`,
      idea: String.raw`On $\{N(t)=n\}$ the joint density of the arrivals is $\prod_{m=1}^n\lambda e^{-\lambda(t_m-t_{m-1})}\cdot e^{-\lambda(t-t_n)}=\lambda^ne^{-\lambda t}$ for $0<t_1<\dots<t_n<t$: constant! Dividing by $P(N(t)=n)=e^{-\lambda t}(\lambda t)^n/n!$ leaves $n!/t^n$, the density of sorted uniforms.`,
      caption: String.raw`Seeded paths on $[0,1]$ are kept only when exactly $n$ arrivals fall in $[0,1]$ (rejection). Left: 30 kept paths. Right: the histograms of $T_1,\dots,T_n$ over the kept paths (step outlines) against the densities of the uniform order statistics, Beta$(k,n+1-k)$ (curves). Change $\lambda$: the acceptance rate changes, the conditional picture does not.`,
      deps: ['prob-3.7.2a'],
      see: ['stoch-9.7', 'prob-3.7.11'],
      tags: ['poisson process', 'order statistics'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$', 1, 6, 3, { int: true });
        const lS = v.slider('rate $\\lambda$', 0.5, 8, 3, { step: 0.1 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 1], y: [0, 30.5], height: 330, axes: 'box', gutter: true, xlabel: '$t$', title: 'paths with $N(1)=n$', yticks: [] });
        const R = v.stage({ x: [0, 1], y: [0, 4], height: 330, weight: 1.3, axes: 'box', gutter: true, xlabel: '$t$', title: 'laws of $T_1,\\dots,T_n$ given $N(1)=n$' });
        const COLS = ['accent', 'orange', 'green', 'purple', 'red', 'teal'];
        let sim = null, st = null;
        v.render(() => {
          const n = nS.value, lam = lS.value;
          if (!sim || sim.n !== n || sim.lam !== lam || sim.seed !== seed) {
            const r = v.rng(seed * 47 + n * 3), acc = []; let tries = 0;
            while (acc.length < 2000 && tries < 400000) { tries++; const a = arrivals(r, lam, 1); if (a.length === n) acc.push(a); }
            sim = { n, lam, seed, acc, tries };
          }
          sim.acc.slice(0, 30).forEach((a, i) => { const y = 29.8 - i; L.hline(y, { color: 'grid', width: 1 }); a.forEach((t, k) => L.dot(t, y, { r: 3, color: COLS[k] })); });
          let top = 0; const curves = [];
          for (let k = 1; k <= n; k++) { const f = (x) => Math.exp(M.lgamma(n + 1) - M.lgamma(k) - M.lgamma(n - k + 1) + (k - 1) * Math.log(Math.max(x, 1e-300)) + (n - k) * Math.log(Math.max(1 - x, 1e-300))); curves.push(f); top = Math.max(top, f((k - 1) / Math.max(1, n - 1)), n === 1 ? 1 : 0); }
          R.setView(null, [0, Math.max(1.5, top * 1.3)]);
          for (let k = 1; k <= n; k++) {
            if (sim.acc.length) { const H = M.histogram(sim.acc.map((a) => a[k - 1]), { bins: Array.from({ length: 26 }, (_, i) => i / 25) }); R.hist(H, { density: true, color: COLS[k - 1], fillAlpha: 0.06, width: 1.2 }); }
            R.fn(curves[k - 1], { domain: [0.001, 0.999], color: COLS[k - 1], width: 2.2 });
          }
          v.legend(Array.from({ length: n }, (_, k) => [COLS[k], `$T_${k + 1}$`]));
          const pooled = sim.acc.flat().sort((a, b) => a - b); let ks = 0; pooled.forEach((x, i) => { ks = Math.max(ks, Math.abs((i + 1) / pooled.length - x), Math.abs(i / pooled.length - x)); });
          st = { acc: sim.acc.length, tries: sim.tries, p: Math.exp(-lam + n * Math.log(lam) - M.lgamma(n + 1)), ks, m: sim.acc.length ? mean(sim.acc.map((a) => a[0])) : NaN, n };
        });
        v.readout(() => st && `Kept ${st.acc} of ${st.tries} paths (rate $${v.fix(st.acc / st.tries, 4)}$; $P(N(1)=n)=${v.fix(st.p, 4)}$). Pooled kept arrival times vs uniform: Kolmogorov distance $${v.fix(st.ks, 4)}$. $E(T_1\\mid N(1)=n)$: sample $${v.fix(st.m, 4)}$, theory $1/(n+1)=${v.fix(1 / (st.n + 1), 4)}$.`);
      },
    },
    {
      num: '3.7.10',
      kind: 'Corollary',
      name: 'Conditional counts of a Poisson process are binomial',
      statement: String.raw`For $0<s<t$ and $0\le m\le n$,
$$P\big(N(s)=m\mid N(t)=n\big)=\binom nm\Big(\frac st\Big)^m\Big(1-\frac st\Big)^{n-m}.$$`,
      idea: String.raw`By 3.7.9, given $N(t)=n$ the arrival set is that of $n$ independent uniforms on $(0,t)$, so $N(s)$ counts how many of $n$ independent uniforms land in $(0,s]$, each with probability $s/t$.`,
      caption: String.raw`Seeded paths on $[0,1]$ conditioned on $N(1)=n$. Left: 24 kept paths; drag the gold line to set $s$. Right: the frequency of $N(s)$ over the kept paths (bars) against Binomial$(n,s)$ (green); the unconditional Poisson$(\lambda s)$ (grey dots) is a different law. The rate $\lambda$ drops out once we condition.`,
      deps: ['prob-3.7.9'],
      tags: ['poisson process'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$', 1, 14, 6, { int: true });
        const lS = v.slider('rate $\\lambda$', 1, 14, 6, { step: 0.1 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [0, 1], y: [-1.5, 24.5], height: 330, axes: 'box', gutter: true, xlabel: '$t$', title: 'paths with $N(1)=n$', yticks: [] });
        const R = v.stage({ x: [-0.6, 14.6], y: [0, 0.5], height: 330, weight: 1.2, axes: 'box', gutter: true, xlabel: '$m$', title: '$N(s)$ given $N(1)=n$' });
        const H = L.handle(0.4, -0.8, { color: 'gold', label: 's', labelPos: 'e', constrain: (x) => [clampN(x, 0.02, 0.98), -0.8] });
        let sim = null, st = null;
        v.render(() => {
          const n = nS.value, lam = lS.value, s = H.x;
          if (!sim || sim.n !== n || sim.lam !== lam || sim.seed !== seed) { const r = v.rng(seed * 53 + n), acc = []; let tries = 0; while (acc.length < 3000 && tries < 300000) { tries++; const a = arrivals(r, lam, 1); if (a.length === n) acc.push(a); } sim = { n, lam, seed, acc, tries }; }
          L.vband(0, s, { color: 'gold', alpha: 0.08 }); L.vline(s, { color: 'gold', width: 1.6 });
          sim.acc.slice(0, 24).forEach((a, i) => { const y = 23.8 - i; L.hline(y, { color: 'grid', width: 1 }); a.forEach((t) => L.dot(t, y, { r: 2.8, color: t <= s ? 'accent' : 'ink' })); });
          const emp = new Float64Array(n + 1); sim.acc.forEach((a) => { emp[a.filter((t) => t <= s).length] += 1 / sim.acc.length; });
          const bn = binomPmf(M, n, s), P = poisPmf(lam * s, 40), Kd = Math.max(n, 6);
          R.setView([-0.6, Kd + 0.6], [0, Math.max(...emp, ...bn) * 1.18]);
          pmfBars(R, emp, n, { w: 0.6 });
          pmfDots(R, bn, n, 'green', 0, 5);
          pmfDots(R, P, Kd, 'muted', 0.25, 3);
          v.legend([['accent', 'frequency over kept paths', { area: true }], ['green', 'Binomial$(n,s)$', { dot: true }], ['muted', 'Poisson$(\\lambda s)$, unconditional', { dot: true }]]);
          st = { s, tv: tvd(emp, bn), k: sim.acc.length, n };
        });
        v.readout(() => st && `$s=${v.fix(st.s, 3)}$: total variation between the ${st.k} conditioned samples and Binomial$(${st.n},${v.fix(st.s, 3)})$: $${v.fix(st.tv, 4)}$ (sampling noise only).`);
      },
    },
    {
      num: '3.7.11',
      kind: 'Theorem',
      name: 'Uniform spacings via exponential partial sums',
      statement: String.raw`Let $T_k=\xi_1+\dots+\xi_k$ with $\xi_i$ i.i.d. exponential, and let $V_1^n<\dots<V_n^n$ be the order statistics of $n$ independent uniforms on $(0,1)$. Then
$$(V_1^n,\dots,V_n^n)\overset d=\Big(\frac{T_1}{T_{n+1}},\dots,\frac{T_n}{T_{n+1}}\Big).$$
Equivalently, the $n+1$ spacings of $n$ sorted uniforms have the law of $(\xi_1,\dots,\xi_{n+1})/(\xi_1+\dots+\xi_{n+1})$.`,
      idea: String.raw`Change variables $v_i=t_i/t_{n+1}$ ($i\le n$), $v_{n+1}=t_{n+1}$; the Jacobian is $v_{n+1}^n$. The joint density of $T_1,\dots,T_{n+1}$ is $\lambda^{n+1}e^{-\lambda t_{n+1}}$ on $0<t_1<\dots<t_{n+1}$, so the new density is $\lambda^{n+1}v_{n+1}^ne^{-\lambda v_{n+1}}$, and integrating out $v_{n+1}$ leaves the constant $n!$ on $0<v_1<\dots<v_n<1$: sorted uniforms.`,
      caption: String.raw`Top: for one seed, $n$ sorted uniforms (accent) and the normalized exponential partial sums $T_k/T_{n+1}$ (orange). Bottom: for the $k$ you choose, the empirical distribution functions of $V_k^n$ and of $T_k/T_{n+1}$ over 3000 seeded draws, minus the exact Beta$(k,n+1-k)$ distribution function. Both wiggle inside the 95% sampling band (Dvoretzky–Kiefer–Wolfowitz): the two constructions are indistinguishable.`,
      deps: ['prob-3.7.9'],
      tags: ['order statistics', 'poisson process'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$', 2, 30, 8, { int: true });
        const kS = v.slider('$k$', 1, 30, 3, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const T = v.stage({ x: [0, 1], y: [0, 3], height: 150, full: true, axes: 'box', gutter: true, xlabel: '', title: 'one draw of each', yticks: [[2, 'Vₖ'], [1, 'Tₖ/Tₙ₊₁']] });
        const B = v.stage({ x: [0, 1], y: [-0.05, 0.05], height: 280, full: true, axes: 'box', gutter: true, xlabel: '$x$', title: 'empirical minus exact distribution function of the $k$-th point' });
        let sim = null, st = null;
        v.render(() => {
          const n = nS.value, k = Math.min(kS.value, n); if (kS.value > n) kS.set(n);
          if (!sim || sim.n !== n || sim.seed !== seed) {
            const r = v.rng(seed * 59 + n), U = [], E = [];
            for (let i = 0; i < 3000; i++) { U.push(Array.from({ length: n }, () => r()).sort((a, b) => a - b)); const c = []; let s = 0; for (let j = 0; j <= n; j++) { s += sampleExp(r); c.push(s); } E.push(c.slice(0, n).map((x) => x / s)); }
            sim = { n, seed, U, E };
          }
          T.hline(2, { color: 'grid', width: 1 }); T.hline(1, { color: 'grid', width: 1 });
          sim.U[0].forEach((x, j) => T.dot(x, 2, { r: j === k - 1 ? 6 : 3.6, color: 'accent' }));
          sim.E[0].forEach((x, j) => T.dot(x, 1, { r: j === k - 1 ? 6 : 3.6, color: 'orange' }));
          const a = sim.U.map((u) => u[k - 1]).sort((x, y) => x - y), b = sim.E.map((e) => e[k - 1]).sort((x, y) => x - y);
          const F = (x) => M.betaI(k, n + 1 - k, x);
          const diff = (xs) => { const pts = [[0, 0]]; xs.forEach((x, i) => { const f = F(x); pts.push([x, i / xs.length - f], [x, (i + 1) / xs.length - f]); }); pts.push([1, 0]); return pts; };
          const dkw = 1.36 / Math.sqrt(3000);
          B.hband(-dkw, dkw, { color: 'green', alpha: 0.1 }); B.hline(0, { color: 'green', width: 2 });
          B.path(diff(a), { color: 'accent', width: 1.4 });
          B.path(diff(b), { color: 'orange', width: 1.4 });
          let ks = 0, i = 0, j = 0; while (i < a.length && j < b.length) { if (a[i] < b[j]) i++; else j++; ks = Math.max(ks, Math.abs(i / a.length - j / b.length)); }
          v.legend([['accent', 'sorted uniforms $V_k^n$'], ['orange', '$T_k/T_{n+1}$'], ['green', '$0$ = exact Beta$(k,n+1-k)$; band: 95% DKW', { area: true }]]);
          st = { k, n, ks, ma: mean(a), mb: mean(b) };
        });
        v.readout(() => st && `$k=${st.k}$, $n=${st.n}$: means $${v.fix(st.ma, 4)}$ and $${v.fix(st.mb, 4)}$ vs $k/(n+1)=${v.fix(st.k / (st.n + 1), 4)}$. Two-sample Kolmogorov distance between the constructions: $${v.fix(st.ks, 4)}$ (noise level for 3000 + 3000 draws $\\approx0.035$).`);
      },
    },
  ],
};
