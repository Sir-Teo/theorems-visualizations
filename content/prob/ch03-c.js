// Probability: Theory and Examples (Durrett) — Chapter 3, part C: central limit theorems and local limit theorems (§§3.4–3.5)

// ---------- helpers (local to this part) ----------
const clampN = (x, a, b) => Math.min(b, Math.max(a, x));
const SQ2PI = Math.sqrt(2 * Math.PI);
const PHI = (x) => Math.exp(-x * x / 2) / SQ2PI;
const PhiN = (M, z) => 0.5 * M.erfc(-z / Math.SQRT2);
/** Status text pinned to a corner of the data area (inside the gutter). */
function cornerIn(S, str, pos = 'tl', st = {}) {
  const l = S.X(S.xr[0]), r = S.X(S.xr[1]), t = S.Y(S.yr[1]), b = S.Y(S.yr[0]);
  const X = pos[1] === 'l' ? l + 8 : r - 8, Y = pos[0] === 't' ? t + 13 : b - 13;
  const o = { align: pos[1] === 'l' ? 'left' : 'right', color: 'muted', size: 12, ...st };
  if (/\$[^$]+\$/.test(str)) return S.texPx(String(str), X, Y, { ...o, rich: true });
  return S.textPx(String(str), X, Y, o);
}
/** Composite Simpson rule. */
function simpson(f, a, b, n = 400) { if (a === b) return 0; if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; }
/** About m log-spaced distinct integers in [n0, n1]. */
function logGrid(n0, n1, m = 60) {
  const out = [n0]; const q = Math.pow(n1 / n0, 1 / m);
  for (let x = n0 * q; x < n1; x *= q) { const k = Math.round(x); if (k > out[out.length - 1]) out.push(k); }
  if (out[out.length - 1] !== n1) out.push(n1);
  return out;
}
/** n-fold convolution power of a pmf p[0..K−1] on consecutive lattice points, via one FFT (characteristic function to the n-th power). */
function convPow(M, p, n) {
  const K = p.length, L = n * (K - 1) + 1, N = M.nextPow2(L);
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < K; i++) re[i] = p[i];
  M.fft(re, im);
  for (let k = 0; k < N; k++) { const r = Math.hypot(re[k], im[k]), th = Math.atan2(im[k], re[k]), rn = Math.pow(r, n); re[k] = rn * Math.cos(n * th); im[k] = rn * Math.sin(n * th); }
  M.ifft(re, im);
  const out = new Float64Array(L); for (let i = 0; i < L; i++) out[i] = re[i] > 0 ? re[i] : 0;
  return out;
}
/** Sine integral Si(x) = ∫₀ˣ sin t / t dt (power series for |x| ≤ 20, asymptotic series beyond). */
function Si(x) {
  const ax = Math.abs(x); let s;
  if (ax <= 20) { let term = ax; s = ax; const x2 = ax * ax; for (let k = 1; k < 90; k++) { term *= -x2 / ((2 * k) * (2 * k + 1)); const add = term / (2 * k + 1); s += add; if (Math.abs(add) < 1e-17) break; } }
  else { const x2 = ax * ax; let f = 0, g = 0, t = 1; for (let k = 0; k < 8; k++) { f += t; t *= -(2 * k + 1) * (2 * k + 2) / x2; } t = 1; for (let k = 0; k < 8; k++) { g += t; t *= -(2 * k + 2) * (2 * k + 3) / x2; } s = Math.PI / 2 - (f / ax) * Math.cos(ax) - (g / x2) * Math.sin(ax); }
  return x < 0 ? -s : s;
}
/** Distribution function of Pólya's law with ch.f. (1 − |t|)⁺: H₁(u) = ½ + (Si(u) − (1 − cos u)/u)/π. Then H_L(x) = H₁(Lx). */
const H1 = (u) => 0.5 + (Si(u) - (Math.abs(u) < 1e-8 ? u / 2 : (1 - Math.cos(u)) / u)) / Math.PI;
/** Binomial(n, p) pmf as an array (log-space, stable for large n). */
function binomPmf(M, n, p) {
  const out = new Float64Array(n + 1), lp = Math.log(p), lq = Math.log1p(-p), ln1 = M.lgamma(n + 1);
  for (let k = 0; k <= n; k++) out[k] = Math.exp(ln1 - M.lgamma(k + 1) - M.lgamma(n - k + 1) + k * lp + (n - k) * lq);
  return out;
}
/** sup |F − Φ| for a lattice law with atoms z[k] (increasing) and masses q[k]; also where it happens. */
function ksLattice(M, z, q) {
  let c = 0, best = 0, at = 0, lo = 0, hi = 0;
  for (let k = 0; k < z.length; k++) {
    const P = PhiN(M, z[k]), a = Math.abs(c - P); if (a > best) { best = a; at = z[k]; lo = c; hi = P; }
    c += q[k]; const b = Math.abs(c - P); if (b > best) { best = b; at = z[k]; lo = c; hi = P; }
  }
  return { d: best, at, F: lo, G: hi };
}
/** Polyline of x ↦ (lattice distribution function at x) − g(x) on [lo, hi], broken at the jumps. */
function stepPts(z, q, lo, hi, g = () => 0) {
  const pts = []; let c = 0, prev = lo;
  const seg = (a, b) => { if (b <= a) return; for (let i = 0; i <= 10; i++) { const x = a + ((b - a) * i) / 10; pts.push([x, c - g(x)]); } pts.push(null); };
  for (let k = 0; k < z.length; k++) { if (z[k] > hi) break; if (z[k] > prev) { seg(prev, z[k]); prev = z[k]; } c += q[k]; }
  seg(prev, hi);
  return pts;
}
/** Sorted-sample Kolmogorov distance to Φ. */
function ksSample(M, xs) {
  const a = Float64Array.from(xs).sort(), n = a.length; let d = 0;
  for (let i = 0; i < n; i++) { const P = PhiN(M, a[i]); d = Math.max(d, Math.abs((i + 1) / n - P), Math.abs(i / n - P)); }
  return d;
}
// complex helpers on [re, im]
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
const clog = (a) => [Math.log(Math.hypot(a[0], a[1])), Math.atan2(a[1], a[0])];
const cabs = (a) => Math.hypot(a[0], a[1]);
/** (1 + c/n)^n by the principal logarithm (exact for integer n). */
const cpowN = (c, n) => { const L = clog([1 + c[0] / n, c[1] / n]); return cexp([n * L[0], n * L[1]]); };

/** Laws for the i.i.d. CLT: continuous ones as cell masses on a fine grid (for the FFT convolution), exponential exactly via the gamma law. */
const CLAW = {
  unif: { label: 'uniform', mu: 0.5, sd: Math.sqrt(1 / 12), draw: (r) => r(), F: (x) => clampN(x, 0, 1), a: 0, b: 1, K: 80 },
  arcs: { label: 'arcsine (bimodal)', mu: 0.5, sd: Math.sqrt(1 / 8), draw: (r) => Math.sin((Math.PI * r()) / 2) ** 2, F: (x) => (2 / Math.PI) * Math.asin(Math.sqrt(clampN(x, 0, 1))), a: 0, b: 1, K: 80 },
  expo: { label: 'exponential', mu: 1, sd: 1, draw: (r) => -Math.log(1 - r()), exact: true },
  bern: { label: 'Bernoulli$(0.2)$', mu: 0.2, sd: 0.4, draw: (r) => (r() < 0.2 ? 1 : 0), lattice: true, p: 0.2 },
};

export default {
  collection: 'prob',
  chapter: 3,
  items: [
    // ======================================================================== §3.4.1 i.i.d. sequences
    {
      num: '3.4.1',
      kind: 'Theorem',
      name: 'Central limit theorem (i.i.d.)',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $EX_i=\mu$ and $\operatorname{var}(X_i)=\sigma^2\in(0,\infty)$, and let $S_n=X_1+\dots+X_n$. Then
$$\frac{S_n-n\mu}{\sigma\sqrt n}\Rightarrow\chi,$$
where $\chi$ has the standard normal distribution: $P\big((S_n-n\mu)/\sigma\sqrt n\le x\big)\to\Phi(x)$ for every $x$.`,
      idea: String.raw`Centre so that $\mu=0$. The second-order expansion of the characteristic function (3.3.20) gives $\varphi(t)=1-\sigma^2t^2/2+o(t^2)$, so the characteristic function of $S_n/\sigma\sqrt n$ is
$$\varphi\big(t/\sigma\sqrt n\big)^n=\Big(1-\frac{t^2}{2n}+o(n^{-1})\Big)^n\to e^{-t^2/2}$$
by the complex version of $(1+c_n/n)^n\to e^c$ (3.4.2). Since $e^{-t^2/2}$ is the normal characteristic function, Lévy's continuity theorem (3.3.17) turns this into weak convergence.`,
      caption: String.raw`Pick a step law (skewed, bimodal, discrete) and the number of terms $n$. Left: histogram of 4000 seeded standardized sums, the exact density of $(S_n-n\mu)/\sigma\sqrt n$ (accent) and the normal curve (green). Right: the error $F_n(x)-\Phi(x)$ of the exact distribution function; the gold bar marks the Kolmogorov distance $\sup_x|F_n(x)-\Phi(x)|$, which shrinks like $n^{-1/2}$ (see 3.4.17).`,
      deps: ['prob-3.3.20', 'prob-3.3.17', 'prob-3.4.2'],
      see: ['prob-8.1.3', 'prob-3.4.17'],
      tags: ['central limit theorem'],
      credit: 'de Moivre 1733, Laplace 1812; Lindeberg 1922 and Lévy 1925 in this generality',
      viz(v) {
        const M = v.M;
        const law = v.select('step law', Object.keys(CLAW).map((k) => ({ value: k, label: CLAW[k].label })), 'expo');
        const nS = v.slider('$n$', 1, 300, 6, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-4, 4], y: [0, 0.6], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$(S_n-n\\mu)/\\sigma\\sqrt n$', title: 'standardized sums against the normal curve' });
        const R = v.stage({ x: [-4, 4], y: [-0.1, 0.1], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: 'error $F_n(x)-\\Phi(x)$' });
        let ex = null, sm = null, st = null;
        const exact = (key, n) => {
          const C = CLAW[key], s = C.sd * Math.sqrt(n), m = C.mu * n;
          if (C.lattice) {
            const q = binomPmf(M, n, C.p), z = Array.from(q, (_, k) => (k - m) / s);
            return { lattice: true, z, q, h: 1 / s, ks: ksLattice(M, z, q), err: null };
          }
          if (C.exact) {
            const D = M.dist.gamma(n, 1), dens = (x) => s * D.pdf(m + x * s), cdf = (x) => M.gammaP(n, m + x * s);
            let best = { d: 0, at: 0 };
            for (let i = 0; i <= 2000; i++) { const x = -6 + (14 * i) / 2000, d = Math.abs(cdf(x) - PhiN(M, x)); if (d > best.d) best = { d, at: x }; }
            return { dens, cdf, ks: best };
          }
          const h = (C.b - C.a) / C.K, p = Array.from({ length: C.K }, (_, j) => C.F(C.a + (j + 1) * h) - C.F(C.a + j * h));
          const q = convPow(M, p, n), x0 = n * (C.a + h / 2); // atom j sits at x0 + j h
          const zs = Array.from(q, (_, j) => (x0 + j * h - m) / s), bz = zs.map((z) => z + h / (2 * s)), cum = new Float64Array(q.length);
          let c = 0, best = { d: 0, at: 0 }; for (let j = 0; j < q.length; j++) { c += q[j]; cum[j] = c; const d = Math.abs(c - PhiN(M, bz[j])); if (d > best.d) best = { d, at: bz[j] }; }
          const cdf = (x) => { const j = Math.floor((x * s + m - x0 - h / 2) / h); if (j < 0) return 0; if (j >= q.length - 1) return 1; const t = (x - bz[j]) / (bz[j + 1] - bz[j]); return cum[j] + t * (cum[j + 1] - cum[j]); };
          const dens = (x) => { const u = (x * s + m - x0) / h, j = Math.floor(u), t = u - j; if (j < 0 || j >= q.length - 1) return 0; return ((1 - t) * q[j] + t * q[j + 1]) * (s / h); };
          return { dens, cdf, ks: best };
        };
        v.render(() => {
          const key = law.value, n = nS.value, C = CLAW[key];
          if (!ex || ex.key !== key || ex.n !== n) ex = { key, n, E: exact(key, n) };
          if (!sm || sm.key !== key || sm.n !== n || sm.seed !== seed) {
            const r = v.rng(seed * 101 + 7), xs = new Float64Array(4000), s = C.sd * Math.sqrt(n), m = C.mu * n;
            for (let i = 0; i < xs.length; i++) { let t = 0; for (let j = 0; j < n; j++) t += C.draw(r); xs[i] = (t - m) / s; }
            sm = { key, n, seed, xs };
          }
          const E = ex.E;
          let edges;
          if (E.lattice) { const w = E.h * Math.max(1, Math.ceil(0.12 / E.h)), z0 = E.z[0] - E.h / 2; const k0 = Math.floor((-4.2 - z0) / w); edges = []; for (let k = k0; z0 + k * w <= 4.2; k++) edges.push(z0 + k * w); }
          else edges = Array.from({ length: 49 }, (_, i) => -4.2 + (8.4 * i) / 48);
          const Hd = M.histogram(Array.from(sm.xs), { bins: edges });
          const top = Math.max(0.5, ...Hd.density) * 1.12; L.setView(null, [0, top]);
          L.hist(Hd, { density: true, color: 'gold', fillAlpha: 0.3, width: 1 });
          if (E.lattice) { const sc = 1 / E.h; E.z.forEach((z, k) => { if (Math.abs(z) < 4.2 && E.q[k] > 1e-5) L.line(z, 0, z, E.q[k] * sc, { color: 'accent', width: 1.6 }); }); }
          else L.fn(E.dens, { color: 'accent', width: 2.2, n: 500 });
          L.fn(PHI, { color: 'green', width: 2, dash: [6, 4] });
          // right: error curve
          let pts = [];
          if (E.lattice) pts = stepPts(E.z, E.q, -4.2, 4.2, (x) => PhiN(M, x));
          else for (let i = 0; i <= 600; i++) { const x = -4.2 + (8.4 * i) / 600; pts.push([x, E.cdf(x) - PhiN(M, x)]); }
          const D = E.ks.d, yr = Math.max(0.004, D * 1.25); R.setView(null, [-yr, yr]);
          R.hband(-D, D, { color: 'gold', alpha: 0.08 });
          R.hline(D, { color: 'gold', dash: [5, 4], width: 1.1 }); R.hline(-D, { color: 'gold', dash: [5, 4], width: 1.1 }); R.hline(0, { color: 'muted', width: 1 });
          R.path(pts, { color: 'accent', width: 2 });
          const sgn = E.lattice ? Math.sign(E.ks.F - E.ks.G) || 1 : Math.sign(E.cdf(E.ks.at) - PhiN(M, E.ks.at)) || 1;
          R.line(E.ks.at, 0, E.ks.at, sgn * D, { color: 'gold', width: 4 });
          cornerIn(R, `sup = ${v.fix(D, 4)}`, sgn > 0 ? 'br' : 'tr', { color: 'ink' });
          v.legend([['gold', 'seeded sample', { area: true }], ['accent', 'exact law of the standardized sum'], ['green', 'normal density / $\\Phi$', { dash: true }]]);
          st = { n, D, kss: ksSample(M, sm.xs) };
        });
        v.readout(() => st && `$n=${st.n}$: exact Kolmogorov distance $\\sup_x|F_n(x)-\\Phi(x)|=${v.fix(st.D, 4)}$, so $\\sqrt n\\cdot\\sup=${v.fix(st.D * Math.sqrt(st.n), 3)}$ (it levels off: the $n^{-1/2}$ rate of 3.4.17). Sample of 4000: distance to $\\Phi$ $=${v.fix(st.kss, 4)}$ (sampling noise is about $0.014$).`);
      },
    },
    {
      num: '3.4.2',
      kind: 'Theorem',
      name: '(1 + cₙ/n)ⁿ → e^c for complex cₙ',
      statement: String.raw`If $c_n\to c$ in $\C$, then $(1+c_n/n)^n\to e^c$.`,
      idea: String.raw`Compare the product of $n$ copies of $z=1+c_n/n$ with the product of $n$ copies of $w=e^{c_n/n}$, whose product is $e^{c_n}$. Both have modulus at most $e^{\gamma/n}$ once $|c_n|<\gamma$, so Lemma 3.4.3 bounds the difference by $n\,e^{\gamma(n-1)/n}|z-w|$, and Lemma 3.4.4 gives $|z-w|\le|c_n/n|^2$. Altogether $|(1+c_n/n)^n-e^{c_n}|\le e^\gamma\gamma^2/n\to0$, and $e^{c_n}\to e^c$.`,
      caption: String.raw`Drag $c$ in the plane. Left: the points $(1+c_n/n)^n$ for $n=1,2,\dots,80$ (gold, fading) close in on $e^c$ (green). For the chosen $n$, the polygon $k\mapsto(1+c_n/n)^k$, $k=0,\dots,n$, hugs the exponential arc $s\mapsto e^{sc_n}$. Switch on the perturbation $c_n=c+(1+i)/\sqrt n$ to make $c_n$ genuinely move. Right: the error and the bound $e^\gamma\gamma^2/n$ from the proof on log axes.`,
      deps: ['prob-3.1.1', 'prob-3.4.3', 'prob-3.4.4'],
      tags: ['analysis', 'limits'],
      viz(v) {
        const nS = v.slider('$n$', 1, 200, 6, { int: true, log: true });
        const pert = v.toggle('perturb: $c_n=c+(1+i)/\\sqrt n$', false);
        const S = v.stage({ x: [-3, 3], y: [-2.6, 2.6], equal: true, height: 360, weight: 1.15, axes: true, grid: true, title: 'the complex plane' });
        const R = v.stage({ x: [1, 1e4], xlog: true, y: [1e-6, 100], ylog: true, height: 360, axes: 'box', gutter: true, xlabel: '$n$', title: 'error against the proof’s bound' });
        const H = S.handle(0.3, 2.2, { color: 'accent', label: 'c', labelPos: 'ne', constrain: (x, y) => [clampN(x, -1.6, 1.1), clampN(y, -2.5, 2.5)] });
        let st = null;
        v.render(() => {
          const c = [H.x, H.y], n = nS.value;
          const cn = (k) => (pert.value ? [c[0] + 1 / Math.sqrt(k), c[1] + 1 / Math.sqrt(k)] : c);
          const ec = cexp(c);
          S.circle(0, 0, 1, { color: 'faint', width: 1 });
          const seq = []; for (let k = 1; k <= 80; k++) seq.push(cpowN(cn(k), k));
          S.path(seq, { color: 'gold', width: 1, alpha: 0.5 });
          seq.forEach((p, i) => { if (i + 1 !== n) S.dot(p[0], p[1], { r: 2.6, color: 'gold' }); });
          const c0 = cn(n), arc = []; for (let i = 0; i <= 120; i++) arc.push(cexp([(c0[0] * i) / 120, (c0[1] * i) / 120]));
          S.path(arc, { color: 'green', width: 2, dash: [5, 4] });
          const poly = [[1, 0]]; let z = [1, 0]; const step = [1 + c0[0] / n, c0[1] / n]; for (let k = 1; k <= n; k++) { z = cmul(z, step); poly.push(z); }
          S.path(poly, { color: 'accent', width: 1.8 }); if (n <= 40) S.dots(poly, { r: 2.2, color: 'accent' });
          const zn = poly[n];
          S.dot(1, 0, { r: 3, color: 'ink' });
          S.dot(ec[0], ec[1], { r: 6, color: 'green', label: '$e^c$', labelPos: 'sw' });
          S.dot(zn[0], zn[1], { r: 5, color: 'gold', label: '$(1+c_n/n)^n$', labelPos: zn[0] > 0 ? 'e' : 'w' });
          // right panel
          const ns = logGrid(1, 1e4, 90), e1 = [], e2 = [], bd = [];
          for (const k of ns) { const ck = cn(k), w = cpowN(ck, k), eck = cexp(ck), g = cabs(ck); e1.push([k, cabs([w[0] - eck[0], w[1] - eck[1]])]); e2.push([k, cabs([w[0] - ec[0], w[1] - ec[1]])]); bd.push([k, (Math.exp(g) * g * g) / k]); }
          R.path(bd, { color: 'red', width: 1.8, dash: [6, 4] });
          R.path(e2, { color: 'green', width: 1.6 });
          R.path(e1, { color: 'accent', width: 2.2 });
          R.vline(n, { color: 'gold', width: 1, dash: [3, 3] });
          v.legend([['accent', '$|(1+c_n/n)^n-e^{c_n}|$'], ['red', 'bound $e^{\\gamma}\\gamma^2/n$, $\\gamma=|c_n|$', { dash: true }], ['green', '$|(1+c_n/n)^n-e^{c}|$'], ['gold', '$(1+c_n/n)^n$, $n=1..80$', { dot: true }]]);
          const g = cabs(c0), w = cpowN(c0, n), e = cexp(c0);
          st = { n, err: cabs([w[0] - e[0], w[1] - e[1]]), bnd: (Math.exp(g) * g * g) / n, err2: cabs([w[0] - ec[0], w[1] - ec[1]]), c };
        });
        v.readout(() => st && `$c=${v.fix(st.c[0], 2)}${st.c[1] < 0 ? '-' : '+'}${v.fix(Math.abs(st.c[1]), 2)}i$, $n=${st.n}$: $|(1+c_n/n)^n-e^{c_n}|=${v.fix(st.err, 5)}\\le e^\\gamma\\gamma^2/n=${v.fix(st.bnd, 5)}$; distance to $e^c$: $${v.fix(st.err2, 5)}$.`);
      },
    },
    {
      num: '3.4.3',
      kind: 'Lemma',
      name: 'Comparing products of complex numbers',
      statement: String.raw`Let $z_1,\dots,z_n$ and $w_1,\dots,w_n$ be complex numbers of modulus at most $\theta$. Then
$$\Big|\prod_{m=1}^nz_m-\prod_{m=1}^nw_m\Big|\le\theta^{\,n-1}\sum_{m=1}^n|z_m-w_m|.$$`,
      idea: String.raw`Swap the factors one at a time. The hybrid products $H_k=z_1\cdots z_k\,w_{k+1}\cdots w_n$ run from $H_0=\prod w_m$ to $H_n=\prod z_m$, and consecutive ones differ by $z_1\cdots z_{k-1}(z_k-w_k)w_{k+1}\cdots w_n$, of modulus at most $\theta^{n-1}|z_k-w_k|$. The triangle inequality along the chain gives the bound (Durrett phrases this as an induction on $n$).`,
      caption: String.raw`Drag the four $z_m$ (accent) and $w_m$ (orange) inside the disc of radius $\theta$. Right: the chain of hybrid products from $\prod w_m$ to $\prod z_m$; each hop stays inside its circle of radius $\theta^{n-1}|z_k-w_k|$, so the gap between the two products is at most the sum of the radii. Push a point outside the unit disc by raising $\theta$ above $1$ and watch the factor $\theta^{n-1}$ grow.`,
      deps: [],
      see: ['prob-3.4.2'],
      tags: ['estimates'],
      viz(v) {
        const th = v.slider('$\\theta$', 0.4, 1.3, 0.95, { step: 0.01 });
        const L = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, height: 340, axes: true, title: 'factors in the disc $|z|\\le\\theta$' });
        const R = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 340, axes: false, title: 'hybrid products $H_k=z_1\\cdots z_kw_{k+1}\\cdots w_n$' });
        const proj = (x, y) => { const r = Math.hypot(x, y), t = th.value; return r > t ? [(x * t) / r, (y * t) / r] : [x, y]; };
        const Z0 = [[0.85, 0.2], [0.3, 0.8], [-0.6, 0.55], [0.7, -0.5]], W0 = [[0.7, 0.45], [0.05, 0.85], [-0.75, 0.25], [0.8, -0.2]];
        const Zh = Z0.map((p, i) => L.handle(p[0], p[1], { color: 'accent', label: `z${'₁₂₃₄'[i]}`, labelPos: 'ne', constrain: proj }));
        const Wh = W0.map((p, i) => L.handle(p[0], p[1], { color: 'orange', label: `w${'₁₂₃₄'[i]}`, labelPos: 'sw', constrain: proj }));
        let st = null;
        v.render(() => {
          const t = th.value, n = 4;
          [...Zh, ...Wh].forEach((h) => { const [x, y] = proj(h.x, h.y); if (x !== h.x || y !== h.y) h.set(x, y); });
          L.circle(0, 0, t, { color: 'accent', fill: 'accent', fillAlpha: 0.06, width: 1.5 });
          L.circle(0, 0, 1, { color: 'faint', dash: [4, 4], width: 1 });
          Zh.forEach((h, i) => L.line(h.x, h.y, Wh[i].x, Wh[i].y, { color: 'muted', width: 1, dash: [3, 3] }));
          const z = Zh.map((h) => [h.x, h.y]), w = Wh.map((h) => [h.x, h.y]);
          const Hk = []; for (let k = 0; k <= n; k++) { let p = [1, 0]; for (let m = 0; m < n; m++) p = cmul(p, m < k ? z[m] : w[m]); Hk.push(p); }
          const rad = z.map((zz, m) => t ** (n - 1) * cabs([zz[0] - w[m][0], zz[1] - w[m][1]]));
          let ext = 0.1; Hk.forEach((p, k) => { ext = Math.max(ext, Math.abs(p[0]) + (rad[k] || 0), Math.abs(p[1]) + (rad[k] || 0)); });
          ext = Math.max(ext, t ** n) * 1.1; R.setView([-ext, ext], [-ext, ext]);
          R.circle(0, 0, t ** n, { color: 'faint', dash: [4, 4], width: 1 });
          R.line(-ext * 0.06, 0, ext * 0.06, 0, { color: 'muted', width: 1 }); R.line(0, -ext * 0.06, 0, ext * 0.06, { color: 'muted', width: 1 }); R.text('0', 0, 0, { dx: 7, dy: 9, size: 11, color: 'muted' });
          for (let k = 1; k <= n; k++) R.circle(Hk[k - 1][0], Hk[k - 1][1], rad[k - 1], { color: 'red', fill: 'red', fillAlpha: 0.05, width: 1 });
          R.path(Hk, { color: 'ink', width: 1.6 });
          Hk.forEach((p, k) => R.dot(p[0], p[1], { r: k === 0 || k === n ? 6 : 3.5, color: k === 0 ? 'orange' : k === n ? 'accent' : 'ink' }));
          R.text('∏ w', Hk[0][0], Hk[0][1], { dx: 14, dy: 0, align: 'left', size: 13, color: 'orange', plate: true });
          R.text('∏ z', Hk[n][0], Hk[n][1], { dx: -14, dy: 0, align: 'right', size: 13, color: 'accent', plate: true });
          v.legend([['red', 'circle of radius $\\theta^{n-1}|z_k-w_k|$ about $H_{k-1}$'], ['faint', 'radius $\\theta^n$', { dash: true }]]);
          const gap = cabs([Hk[n][0] - Hk[0][0], Hk[n][1] - Hk[0][1]]); let hops = 0; for (let k = 1; k <= n; k++) hops += cabs([Hk[k][0] - Hk[k - 1][0], Hk[k][1] - Hk[k - 1][1]]);
          st = { gap, hops, bound: rad.reduce((a, b) => a + b, 0), t };
        });
        v.readout(() => st && `$|\\prod z_m-\\prod w_m|=${v.fix(st.gap, 4)}\\ \\le$ total hop length $${v.fix(st.hops, 4)}\\ \\le\\ \\theta^{3}\\sum|z_m-w_m|=${v.fix(st.bound, 4)}$ $(\\theta=${v.fix(st.t, 2)})$.`);
      },
    },
    {
      num: '3.4.4',
      kind: 'Lemma',
      name: '|e^b − (1 + b)| ≤ |b|² for |b| ≤ 1',
      statement: String.raw`If $b\in\C$ and $|b|\le1$, then $|e^b-(1+b)|\le|b|^2$.`,
      idea: String.raw`The tail of the exponential series is $e^b-1-b=\sum_{k\ge2}b^k/k!$. For $|b|\le1$ each term satisfies $|b|^k/k!\le\frac{|b|^2}{2}\,2^{-(k-2)}$, and the geometric series sums to $|b|^2$. The sharper truth, $|e^b-1-b|\le e^{|b|}-1-|b|$, is attained on the positive real axis.`,
      caption: String.raw`Left: the ratio $|e^b-1-b|/|b|^2$ coloured over the plane, with its level-$1$ contour (ink) and the unit circle (green). Drag $b$: inside the unit disc the ratio never exceeds $e-2\approx0.718$. Right: the ratio along the ray through $b$ (accent), the worst case $(e^r-1-r)/r^2$ over all directions (orange) and Durrett's geometric-series bound (red), which is $1$ at $r=1$.`,
      deps: [],
      see: ['prob-3.4.2'],
      tags: ['estimates'],
      viz(v) {
        const L = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, height: 340, axes: true, title: 'ratio $|e^b-1-b|/|b|^2$' });
        const R = v.stage({ x: [0, 2.4], y: [0, 1.6], height: 340, axes: 'box', gutter: true, xlabel: '$r=|b|$', title: 'along the ray through $b$' });
        const ratio = (x, y) => { const r2 = x * x + y * y; if (r2 < 1e-12) return 0.5; const e = cexp([x, y]); return cabs([e[0] - 1 - x, e[1] - y]) / r2; };
        const H = L.handle(0.62, 0.55, { color: 'gold', label: 'b', labelPos: 'ne', constrain: (x, y) => [clampN(x, -2.3, 2.3), clampN(y, -2.3, 2.3)] });
        let st = null;
        v.render(() => {
          L.heat(ratio, { range: [0, 2], cmap: 'theme', key: 'r', res: 2 });
          L.axes();
          L.contour(ratio, [1], { color: 'ink', width: 1.8 });
          L.circle(0, 0, 1, { color: 'green', width: 2, dash: [6, 4] });
          L.colorbar([0, 2], (u) => v.ramp(u), { pos: 'left', length: 0.45 });
          const r0 = Math.hypot(H.x, H.y), ph = Math.atan2(H.y, H.x);
          L.line(0, 0, 2.6 * Math.cos(ph), 2.6 * Math.sin(ph), { color: 'gold', width: 1, dash: [3, 3] });
          R.vband(0, 1, { color: 'green', alpha: 0.07 });
          R.hline(1, { color: 'muted', width: 1, dash: [4, 4] });
          R.fn((r) => (r < 1e-6 ? 0.5 : (Math.exp(r) - 1 - r) / (r * r)), { color: 'orange', width: 1.8 });
          R.fn((r) => (r <= 1 ? 0.5 / (1 - r / 2) : NaN), { domain: [0, 1], color: 'red', width: 1.8, dash: [6, 4] });
          R.fn((r) => ratio(r * Math.cos(ph), r * Math.sin(ph)), { color: 'accent', width: 2.2 });
          R.dot(r0, ratio(H.x, H.y), { r: 5, color: 'gold' });
          v.legend([['accent', 'ratio along the ray'], ['orange', '$(e^r-1-r)/r^2$ (positive axis)'], ['red', '$\\tfrac12\\sum_k(r/2)^k$', { dash: true }], ['green', '$|b|\\le1$', { area: true }]]);
          st = { r0, q: ratio(H.x, H.y) };
        });
        v.readout(() => st && `$|b|=${v.fix(st.r0, 3)}$: $|e^b-1-b|=${v.fix(st.q * st.r0 * st.r0, 4)}$, $|b|^2=${v.fix(st.r0 * st.r0, 4)}$, ratio $${v.fix(st.q, 3)}$ ${st.r0 <= 1 ? '$\\le1$ as the lemma promises' : st.q > 1 ? '$>1$: outside the unit disc the bound can fail' : '(outside the disc the lemma says nothing)'}.`);
      },
    },
    // ======================================================================== §3.4.2 triangular arrays
    {
      num: '3.4.10',
      kind: 'Theorem',
      name: 'Lindeberg–Feller central limit theorem',
      credit: 'Lindeberg 1922; Feller 1935 (necessity)',
      statement: String.raw`For each $n$ let $X_{n,1},\dots,X_{n,n}$ be independent with $EX_{n,m}=0$. Suppose
(i) $\sum_{m=1}^nEX_{n,m}^2\to\sigma^2>0$, and
(ii) for every $\eps>0$, $\lim_{n\to\infty}\sum_{m=1}^nE\big(X_{n,m}^2;|X_{n,m}|>\eps\big)=0$ (the Lindeberg condition).
Then $S_n=X_{n,1}+\dots+X_{n,n}\Rightarrow\sigma\chi$, with $\chi$ standard normal.`,
      idea: String.raw`Compare $\prod_m\varphi_{n,m}(t)$ with $\prod_m(1-t^2\sigma_{n,m}^2/2)$ using Lemma 3.4.3 with $\theta=1$. The Taylor bound $|\varphi_{n,m}(t)-1+t^2\sigma^2_{n,m}/2|\le E\min(|tX|^3,2|tX|^2)$ (3.3.19) splits at $|X|=\eps$: the small values contribute at most $\eps|t|^3\sigma_{n,m}^2$, the large ones are the Lindeberg sum. Condition (ii) also forces $\max_m\sigma^2_{n,m}\to0$, so $\prod(1-t^2\sigma^2_{n,m}/2)\to e^{-t^2\sigma^2/2}$, and Lévy's continuity theorem (3.3.17) finishes.`,
      caption: String.raw`Three arrays, all with row variance $1$. *i.i.d.*: uniform terms of size $n^{-1/2}$. *One big term*: $X_{n,1}=\pm\sqrt s$ carries a fixed share $s$ of the variance. *Rare big jumps*: each term jumps by $\pm\sqrt s$ with probability $1/n$, so jumps carry share $s$. Left: 4000 seeded row sums against $N(0,1)$ (green) and the actual limit (orange, dashed). Right: the Lindeberg sum $L_n(\eps)$ for this $n$ and for $n/4$, $n/16$ (fainter); it dies only for the i.i.d. array, and only then is the limit normal.`,
      deps: ['prob-3.3.17', 'prob-3.4.3', 'prob-3.3.19'],
      tags: ['central limit theorem', 'triangular arrays'],
      viz(v) {
        const M = v.M;
        const mode = v.select('array', [{ value: 'iid', label: 'i.i.d. $Y_m/\\sqrt n$' }, { value: 'big', label: 'one big term' }, { value: 'rare', label: 'rare big jumps' }], 'rare');
        const nS = v.slider('$n$', 4, 400, 100, { int: true, log: true });
        const sS = v.slider('share $s$', 0.05, 0.95, 0.85, { step: 0.01 });
        const eS = v.slider('$\\eps$', 0.05, 1.2, 0.3, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const Lst = v.stage({ x: [-4, 4], y: [0, 0.6], height: 320, weight: 1.15, axes: 'box', gutter: true, xlabel: '$S_n$', title: 'row sums $S_n$' });
        const R = v.stage({ x: [0, 1.2], y: [0, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$\\eps$', title: 'Lindeberg sum $L_n(\\eps)=\\sum_mE(X_{n,m}^2;|X_{n,m}|>\\eps)$' });
        // E((u+c)^2; |u+c|>e) for u uniform on [−a, a]
        const I3 = (lo, hi) => (hi > lo ? (hi ** 3 - lo ** 3) / 3 : 0);
        const g = (c, a, e) => (I3(c - a, c + a) - I3(Math.max(c - a, -e), Math.min(c + a, e))) / (2 * a);
        const lind = (md, n, s, e) => {
          if (md === 'iid') { const a = Math.sqrt(3 / n); return n * g(0, a, e); }
          if (md === 'big') { const a = Math.sqrt((3 * (1 - s)) / (n - 1)); return (Math.sqrt(s) > e ? s : 0) + (n - 1) * g(0, a, e); }
          const a = Math.sqrt((3 * (1 - s)) / n), b = Math.sqrt(s); return n * ((1 - 1 / n) * g(0, a, e) + (g(b, a, e) + g(-b, a, e)) / (2 * n));
        };
        const limitDens = (md, s) => {
          if (md === 'iid') return PHI;
          const sd = Math.sqrt(1 - s), b = Math.sqrt(s), nd = (x) => PHI(x / sd) / sd;
          if (md === 'big') return (x) => 0.5 * (nd(x - b) + nd(x + b));
          // N(0,1−s) + √s · (signed sum of a Poisson(1) number of ±1)
          const w = []; let pk = Math.exp(-1);
          for (let k = 0; k <= 12; k++) { if (k > 0) pk /= k; for (let j = 0; j <= k; j++) w.push([b * (2 * j - k), pk * Math.exp(M.lgamma(k + 1) - M.lgamma(j + 1) - M.lgamma(k - j + 1) - k * Math.LN2)]); }
          return (x) => w.reduce((acc, [c, p]) => acc + p * nd(x - c), 0);
        };
        let sm = null, st = null;
        v.render(() => {
          const md = mode.value, n = nS.value, s = sS.value, e = eS.value;
          sS.el.hidden = md === 'iid';
          if (!sm || sm.md !== md || sm.n !== n || sm.s !== s || sm.seed !== seed) {
            const r = v.rng(seed * 31 + 5), xs = new Float64Array(4000);
            for (let i = 0; i < xs.length; i++) {
              let t = 0;
              if (md === 'iid') { const a = Math.sqrt(3 / n); for (let m = 0; m < n; m++) t += a * (2 * r() - 1); }
              else if (md === 'big') { const a = Math.sqrt((3 * (1 - s)) / (n - 1)); t = (r() < 0.5 ? 1 : -1) * Math.sqrt(s); for (let m = 1; m < n; m++) t += a * (2 * r() - 1); }
              else { const a = Math.sqrt((3 * (1 - s)) / n), b = Math.sqrt(s); for (let m = 0; m < n; m++) { t += a * (2 * r() - 1); const u = r(); if (u < 1 / n) t += u < 0.5 / n ? b : -b; } }
              xs[i] = t;
            }
            sm = { md, n, s, seed, xs };
          }
          const Hd = M.histogram(Array.from(sm.xs), { bins: Array.from({ length: 57 }, (_, i) => -4.2 + (8.4 * i) / 56) });
          const ld = limitDens(md, s);
          const top = Math.max(0.5, ...Hd.density, ld(0), ld(Math.sqrt(s))) * 1.12; Lst.setView(null, [0, top]);
          Lst.hist(Hd, { density: true, color: 'gold', fillAlpha: 0.3, width: 1 });
          Lst.fn(PHI, { color: 'green', width: 2.2 });
          if (md !== 'iid') Lst.fn(ld, { color: 'orange', width: 2, dash: [6, 4], n: 400 });
          // right panel
          [n / 16, n / 4, n].forEach((nn, j) => { const k = Math.max(md === 'big' ? 2 : 1, Math.round(nn)); R.fn((x) => lind(md, k, s, x), { domain: [0.002, 1.2], color: 'accent', width: j === 2 ? 2.4 : 1.2, alpha: j === 2 ? 1 : 0.35 + 0.2 * j, n: 300 }); });
          const Le = lind(md, n, s, e);
          R.vline(e, { color: 'gold', width: 1.2, dash: [4, 3] });
          R.dot(e, Le, { r: 5, color: 'gold' });
          v.legend([['gold', 'seeded row sums', { area: true }], ['green', '$N(0,1)$'], ...(md !== 'iid' ? [['orange', 'actual limit', { dash: true }]] : []), ['accent', '$L_n(\\eps)$ for $n/16,\\ n/4,\\ n$']]);
          let mx; if (md === 'iid') mx = 1 / n; else if (md === 'big') mx = s; else mx = 1 / n;
          st = { Le, mx, ks: ksSample(M, sm.xs), e, md };
        });
        v.readout(() => st && `$L_n(${v.fix(st.e, 2)})=${v.fix(st.Le, 4)}$; $\\max_m EX_{n,m}^2=${v.fix(st.mx, 4)}$${st.md === 'rare' ? ' (each variance is small, yet the Lindeberg sum is not)' : ''}. Kolmogorov distance of the sample to $N(0,1)$: $${v.fix(st.ks, 3)}$ (noise level $\\approx0.014$).`);
      },
    },
    {
      num: '3.4.14',
      kind: 'Theorem',
      name: 'Domain of attraction of the normal law',
      credit: 'Lévy 1935; Feller; Khinchin',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. and $S_n=X_1+\dots+X_n$. There are constants $a_n$ and $b_n>0$ with $(S_n-a_n)/b_n\Rightarrow\chi$ (standard normal) if and only if
$$\frac{y^2P(|X_1|>y)}{E(X_1^2;|X_1|\le y)}\to0\qquad(y\to\infty).$$
Finite variance is sufficient but not necessary. (Durrett states this without proof and refers to Gnedenko and Kolmogorov.)`,
      idea: String.raw`The ratio compares the variance that a truncation at level $y$ throws away (the tail term $y^2P(|X|>y)$) with the variance it keeps. When it tends to $0$, truncating at a level $c_n$ with $nP(|X|>c_n)\to0$ changes $S_n$ with vanishing probability while the truncated summands satisfy the Lindeberg condition, so Lindeberg–Feller applies, as in Example 3.4.13 where $P(|X|>x)=x^{-2}$ and $S_n/\sqrt{n\log n}\Rightarrow\chi$. When the ratio stays positive, a few large terms keep dominating and the limit is a non-normal stable law (§3.8).`,
      caption: String.raw`Symmetric Pareto tails $P(|X|>y)=y^{-\alpha}$, $y\ge1$. Left: the ratio for your $\alpha$ (accent) and for the borderline $\alpha=2$ (gold), on a log $y$ axis: it tends to $0$ for $\alpha\ge2$ (at $\alpha=2$ only like $1/2\log y$) and to $(2-\alpha)/\alpha$ for $\alpha<2$. Right: 2000 seeded sums $S_n$ scaled by their interquartile range against the normal curve, with the fraction beyond $\pm3$ (normal: $0.0027$).`,
      deps: ['prob-3.4.10', 'prob-3.4.1', 'prob-3.2.1a'],
      tags: ['central limit theorem', 'heavy tails'],
      viz(v) {
        const M = v.M;
        const aS = v.slider('tail index $\\alpha$', 1.2, 3, 2, { step: 0.05 });
        const nS = v.slider('$n$', 10, 2000, 400, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [1, 1e12], xlog: true, y: [0, 1.4], height: 320, axes: 'box', gutter: true, xlabel: '$y$', title: '$y^2P(|X|>y)\\,/\\,E(X^2;|X|\\le y)$' });
        const R = v.stage({ x: [-5, 5], y: [0, 0.6], height: 320, weight: 1.1, axes: 'box', gutter: true, xlabel: '$S_n/(\\mathrm{IQR}/1.349)$', title: 'sums scaled by a robust spread' });
        const ratio = (a, y) => { if (y <= 1) return NaN; const t = y ** (2 - a); const kept = Math.abs(a - 2) < 1e-9 ? 2 * Math.log(y) : 1 + (2 * (t - 1)) / (2 - a) - t; return t / kept; };
        let sm = null, st = null;
        v.render(() => {
          const a = aS.value, n = nS.value;
          const f = (y) => ratio(a, y);
          L.hline(0, { color: 'muted', width: 1 });
          if (a < 2 - 1e-9) L.hline((2 - a) / a, { color: 'red', dash: [5, 4], width: 1.3 });
          L.fn((y) => ratio(2, y), { domain: [1.5, 1e12], color: 'gold', width: 1.6, dash: [6, 4], n: 300 });
          L.fn(f, { domain: [1.5, 1e12], color: 'accent', width: 2.4, n: 300 });
          if (!sm || sm.a !== a || sm.n !== n || sm.seed !== seed) {
            const r = v.rng(seed * 17 + 3), xs = new Float64Array(2000), ia = -1 / a;
            for (let i = 0; i < xs.length; i++) { let t = 0; for (let j = 0; j < n; j++) { const u = r(); t += (u < 0.5 ? 1 : -1) * Math.pow(1 - r(), ia); } xs[i] = t; }
            const q = M.quantile(Array.from(xs), [0.25, 0.75]), sc = (q[1] - q[0]) / 1.349;
            const z = Array.from(xs, (x) => x / sc); sm = { a, n, seed, z, out: z.filter((x) => Math.abs(x) > 3).length / z.length };
          }
          const Hd = M.histogram(sm.z, { bins: Array.from({ length: 51 }, (_, i) => -5 + (10 * i) / 50) });
          R.setView(null, [0, Math.max(0.5, ...Hd.density) * 1.12]);
          R.vband(-5, -3, { color: 'red', alpha: 0.06 }); R.vband(3, 5, { color: 'red', alpha: 0.06 });
          R.hist(Hd, { density: true, color: 'accent', fillAlpha: 0.3, width: 1 });
          R.fn(PHI, { color: 'green', width: 2.2 });
          v.legend([['accent', `$\\alpha=${v.fix(a, 2)}$`], ['gold', '$\\alpha=2$', { dash: true }], ...(a < 2 - 1e-9 ? [['red', 'limit $(2-\\alpha)/\\alpha$', { dash: true }]] : []), ['green', 'normal density']]);
          st = { a, r6: f(1e6), r12: f(1e12), out: sm.out };
        });
        v.readout(() => st && `$\\alpha=${v.fix(st.a, 2)}$: ratio at $y=10^6$ is $${v.fix(st.r6, 4)}$, at $y=10^{12}$ it is $${v.fix(st.r12, 4)}$ — ${st.a >= 2 - 1e-9 ? 'tending to $0$: normal domain of attraction' + (Math.abs(st.a - 2) < 1e-9 ? ' (infinite variance, yet normal after scaling by $\\sqrt{n\\log n}$)' : '') : 'bounded away from $0$: no normalization makes $S_n$ normal'}. Fraction of scaled sums beyond $\\pm3$: $${v.fix(st.out, 4)}$ (normal $0.0027$).`);
      },
    },
    {
      num: '3.4.15',
      kind: 'Lemma',
      name: 'Choosing εₙ → 0 slowly',
      statement: String.raw`If $h_n(\eps)\to0$ as $n\to\infty$ for each fixed $\eps>0$, then there are $\eps_n\to0$ with $h_n(\eps_n)\to0$.`,
      idea: String.raw`Diagonalize. For each $m$ choose $N_m$, increasing in $m$, with $h_n(1/m)\le1/m$ for all $n\ge N_m$, and put $\eps_n=1/m$ for $N_m\le n<N_{m+1}$. Then $h_n(\eps_n)\le1/m$ on that block, and $m\to\infty$ as $n\to\infty$. The price is that $\eps_n$ may have to decrease extremely slowly. In the second proof of Lindeberg–Feller, $h_n$ is the Lindeberg sum, and the lemma lets one truncate at a level $\eps_n$ that itself tends to $0$.`,
      caption: String.raw`The family is the Lindeberg sum of the array $Y_m/\sqrt n$: $h_n(\eps)=E(Y^2;|Y|>\eps\sqrt n)$ with $P(|Y|>y)=y^{-\beta}$, which has finite variance for $\beta>2$. Left: $h_n(\eps)$ for $n=10^2,10^4,\dots$; the dots are the chosen $(\eps_n,h_n(\eps_n))$. Right: the staircase $\eps_n$ (orange) and $h_n(\eps_n)$ (accent) against $n$ on log axes, with the thresholds $N_m$ marked. Push $\beta$ toward $2$: the tail gets heavier and $N_m$ explodes.`,
      deps: [],
      tags: ['analysis'],
      viz(v) {
        const bS = v.slider('tail exponent $\\beta$', 2.2, 4, 3, { step: 0.05 });
        const mS = v.slider('steps $m$', 1, 8, 6, { int: true });
        const L = v.stage({ x: [1e-3, 1], xlog: true, y: [1e-4, 20], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: '$\\eps$', title: 'the family $h_n(\\eps)$' });
        const R = v.stage({ x: [1, 1e30], xlog: true, y: [1e-3, 20], ylog: true, height: 330, weight: 1.15, axes: 'box', gutter: true, xlabel: '$n$', title: 'diagonal choice $\\eps_n$ and $h_n(\\eps_n)$' });
        let st = null;
        v.render(() => {
          const b = bS.value, mm = mS.value, EY2 = b / (b - 2);
          const h = (n, e) => EY2 * Math.min(1, (e * Math.sqrt(n)) ** (2 - b));
          const N = []; for (let m = 1; m <= mm + 1; m++) N.push(Math.max(1, m * m * Math.pow((m * b) / (b - 2), 2 / (b - 2))));
          const top = Math.max(1e6, N[mm] * 30); R.setView([1, top], null);
          const sup = { 2: '²', 4: '⁴', 8: '⁸', 16: '¹⁶', 32: '³²' };
          [2, 4, 8, 16, 32].forEach((k, j) => { const n = 10 ** k; if (n > top * 1e3) return; L.fn((e) => h(n, e), { color: 'accent', width: 1.4, alpha: 0.4 + 0.12 * j, n: 200 }); const e0 = 2e-3, y0 = h(n, e0); if (y0 > 1.2e-4 && y0 < EY2 * 0.9) L.text(`n = 10${sup[k]}`, e0, y0, { size: 10.5, color: 'muted', dy: -9, align: 'left' }); });
          for (let m = 1; m <= mm; m++) { L.vline(1 / m, { color: 'orange', width: 0.8, alpha: 0.4, dash: [3, 3] }); L.dot(1 / m, h(N[m - 1], 1 / m), { r: 4, color: 'gold' }); L.hline(1 / m, { color: 'faint', width: 0.6 }); }
          // staircase
          const ep = [], hn = [];
          const seg = (n0, n1, e) => { const k = 24; for (let i = 0; i <= k; i++) { const n = n0 * (n1 / n0) ** (i / k); ep.push([n, e]); hn.push([n, h(n, e)]); } ep.push(null); hn.push(null); };
          seg(1, N[0], 1);
          for (let m = 1; m <= mm; m++) seg(N[m - 1], m < mm ? N[m] : top, 1 / m);
          for (let m = 1; m <= mm; m++) { R.vline(N[m - 1], { color: 'muted', width: 0.8, dash: [3, 3] }); }
          R.path(ep, { color: 'orange', width: 2.4 });
          R.path(hn, { color: 'accent', width: 2 });
          for (let m = 1; m <= mm; m++) R.hline(1 / m, { color: 'faint', width: 0.6 });
          v.legend([['accent', '$h_n(\\eps)$ and $h_n(\\eps_n)$'], ['orange', '$\\eps_n=1/m$ on $[N_m,N_{m+1})$'], ['gold', '$(1/m,\\,h_{N_m}(1/m))$', { dot: true }]]);
          st = { N: N.slice(0, mm), b };
        });
        v.readout(() => st && `Thresholds: ` + st.N.map((n, i) => `$N_{${i + 1}}\\approx10^{${v.fix(Math.log10(n), 1)}}$`).join(', ') + `. On each block $h_n(\\eps_n)\\le1/m$, yet $\\eps_n$ reaches $1/${st.N.length}$ only at $n\\approx10^{${v.fix(Math.log10(st.N[st.N.length - 1]), 0)}}$.`);
      },
    },
    {
      num: '3.4.16',
      kind: 'Theorem',
      name: 'Erdős–Kac theorem',
      credit: 'Erdős & Kac, 1940',
      statement: String.raw`Let $g(m)$ be the number of distinct prime divisors of $m$ and let $P_n$ be the uniform distribution on $\{1,\dots,n\}$. Then for every $x$,
$$P_n\big(m:\ g(m)-\log\log n\le x\sqrt{\log\log n}\big)\to P(\chi\le x),$$
so a typical integer of size $n$ has about $\log\log n+\chi\sqrt{\log\log n}$ prime factors.`,
      idea: String.raw`Divisibility by distinct primes behaves like independent events: the density of multiples of $pq$ is $1/pq$. So $g$ is modelled by $\sum_{p\le n}X_p$ with independent $X_p\sim$ Bernoulli$(1/p)$, whose mean and variance are $\log\log n+O(1)$ by Mertens' estimate $\sum_{p\le n}1/p=\log\log n+O(1)$; Lindeberg–Feller (3.4.10) makes the model normal. To transfer this to the integers, drop the primes above $\alpha_n=n^{1/\log\log n}$ (they matter little, Lemma 3.4.15's spirit) and compare moments: products of few small primes divide a uniform integer with probability within $1/n$ of the model, and the method of moments (3.3.26) concludes.`,
      caption: String.raw`Drag $N$ up to $2\times10^6$ (prime factors counted exactly by a sieve). Left: the frequencies of $g(m)$ for $m\le N$ (accent bars) against the normal curve with mean and variance $\log\log N$ (green). The orange bars count only the primes $p\le\alpha_N=N^{1/\log\log N}$, as in the proof, and the orange dots are the independent model $\sum_{p\le\alpha_N}X_p$ computed exactly: they have the same mean, nearly the same variance and similar shapes, which is what the moment comparison exploits. Right: the Kolmogorov distance of the standardized $g$ to $\Phi$; the convergence is famously slow, since $\log\log(2\times10^6)\approx2.68$.`,
      deps: ['prob-3.4.10', 'prob-3.3.26', 'prob-3.4.15'],
      see: ['nt-10.16'],
      tags: ['central limit theorem', 'number theory'],
      viz(v) {
        const M = v.M;
        const NMAX = 2000000;
        const nS = v.slider('$N$', 100, NMAX, 100000, { log: true, int: true });
        const L = v.stage({ x: [-0.6, 8.6], y: [0, 0.5], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$k$ = number of distinct prime factors', title: 'distribution of $g(m)$, $m\\le N$' });
        const R = v.stage({ x: [100, NMAX], xlog: true, y: [0, 0.4], height: 320, axes: 'box', gutter: true, xlabel: '$N$', title: 'distance of $(g-\\log\\log N)/\\sqrt{\\log\\log N}$ to $\\Phi$' });
        let pre = null, cur = null, st = null;
        const prep = () => {
          const w = new Uint8Array(NMAX + 1), comp = new Uint8Array(NMAX + 1), primes = [];
          for (let p = 2; p <= NMAX; p++) { if (comp[p]) continue; primes.push(p); for (let q = p; q <= NMAX; q += p) { w[q]++; if (q > p) comp[q] = 1; } }
          const checks = logGrid(100, NMAX, 50), ks = [], counts = new Float64Array(16); let j = 0;
          for (let m = 1; m <= NMAX && j < checks.length; m++) {
            counts[w[m]]++;
            if (m === checks[j]) { const ll = Math.log(Math.log(m)), s = Math.sqrt(ll); let c = 0, d = 0; for (let k = 0; k < 16; k++) { const P = PhiN(M, (k - ll) / s); d = Math.max(d, Math.abs(c / m - P)); c += counts[k]; d = Math.max(d, Math.abs(c / m - P)); } ks.push([m, d]); j++; }
          }
          return { w, primes, ks };
        };
        const mom = (fr) => { let a = 0, b = 0; fr.forEach((f, k) => { a += k * f; b += k * k * f; }); return [a, b - a * a]; };
        v.render(() => {
          if (!pre) pre = prep();
          const N = nS.value, ll = Math.log(Math.log(N)), alpha = Math.pow(N, 1 / ll);
          if (!cur || cur.N !== N) {
            const counts = new Float64Array(16); for (let m = 1; m <= N; m++) counts[pre.w[m]]++;
            const g = new Uint8Array(N + 1), small = pre.primes.filter((p) => p <= alpha);
            for (const p of small) for (let q = p; q <= N; q += p) g[q]++;
            const cg = new Float64Array(16); for (let m = 1; m <= N; m++) cg[g[m]]++;
            const dp = new Float64Array(16); dp[0] = 1; let mean = 0, vr = 0;
            for (const p of small) { const q = 1 / p; mean += q; vr += q * (1 - q); for (let k = 15; k >= 1; k--) dp[k] = dp[k] * (1 - q) + dp[k - 1] * q; dp[0] *= 1 - q; }
            cur = { N, fr: Array.from(counts, (c) => c / N), fg: Array.from(cg, (c) => c / N), dp, mean, vr, np: small.length };
          }
          const top = Math.max(...cur.fr, ...cur.fg, ...cur.dp) * 1.15; L.setView(null, [0, top]);
          for (let k = 0; k <= 8; k++) {
            if (cur.fr[k] > 0) L.rect(k - 0.36, 0, k - 0.02, cur.fr[k], { fill: 'accent', fillAlpha: 0.6, stroke: false });
            if (cur.fg[k] > 0) L.rect(k + 0.02, 0, k + 0.36, cur.fg[k], { color: 'orange', fill: 'orange', fillAlpha: 0.12, width: 1.6 });
            L.dot(k + 0.19, cur.dp[k], { r: 4, color: 'orange' });
          }
          L.fn((x) => PHI((x - ll) / Math.sqrt(ll)) / Math.sqrt(ll), { domain: [-0.6, 8.6], color: 'green', width: 2.2 });
          L.vline(ll, { color: 'green', width: 1, dash: [4, 4] });
          const last = pre.ks[pre.ks.length - 1], c0 = last[1] * Math.sqrt(Math.log(Math.log(last[0])));
          R.fn((x) => c0 / Math.sqrt(Math.log(Math.log(x))), { domain: [100, NMAX], color: 'muted', width: 1.2, dash: [5, 4] });
          R.path(pre.ks, { color: 'accent', width: 2.2 });
          const near = pre.ks.reduce((b, p) => (Math.abs(Math.log(p[0] / N)) < Math.abs(Math.log(b[0] / N)) ? p : b));
          R.vline(N, { color: 'gold', width: 1.2, dash: [3, 3] }); R.dot(near[0], near[1], { r: 4.5, color: 'gold' });
          v.legend([['accent', 'frequency of $g(m)=k$', { area: true }], ['orange', 'primes $\\le\\alpha_N$ only; model $\\sum_{p\\le\\alpha_N}X_p$ (dots)', { area: true }], ['green', 'normal, mean & variance $\\log\\log N$'], ['muted', '$\\propto(\\log\\log N)^{-1/2}$', { dash: true }]]);
          const [em, ev] = mom(cur.fr), [gm, gv] = mom(cur.fg);
          st = { N, ll, em, ev, gm, gv, mean: cur.mean, vr: cur.vr, alpha, d: near[1] };
        });
        v.readout(() => st && `$N=${st.N}$, $\\log\\log N=${v.fix(st.ll, 3)}$. All primes: mean of $g$ $=${v.fix(st.em, 3)}$, variance $${v.fix(st.ev, 3)}$. Primes $\\le\\alpha_N=${v.fix(st.alpha, 1)}$: mean $${v.fix(st.gm, 3)}$, variance $${v.fix(st.gv, 3)}$; model: $${v.fix(st.mean, 3)}$, $${v.fix(st.vr, 3)}$. Kolmogorov distance to $\\Phi$: $${v.fix(st.d, 3)}$.`);
      },
    },
    // ======================================================================== §3.4.4 rates of convergence
    {
      num: '3.4.17',
      kind: 'Theorem',
      name: 'Berry–Esseen theorem',
      credit: 'Berry 1941; Esseen 1942',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $EX_i=0$, $EX_i^2=\sigma^2$ and $E|X_i|^3=\rho<\infty$. If $F_n$ is the distribution function of $(X_1+\dots+X_n)/\sigma\sqrt n$ and $\Phi$ the standard normal one, then for all $n$ and $x$
$$|F_n(x)-\Phi(x)|\le\frac{3\rho}{\sigma^3\sqrt n}.$$
The rate $n^{-1/2}$ cannot be improved in general (coin tossing), and the constant $3$ is not optimal.`,
      idea: String.raw`Smooth both distribution functions with Pólya's kernel, whose characteristic function vanishes outside $[-L,L]$. The smoothing inequality (3.4.18) says this loses at most $24\lambda/\pi L$ with $\lambda=\sup\Phi'$, and Esseen's inequality (3.4.19) bounds the smoothed difference by $\frac1\pi\int_{-L}^L|\varphi^n(\theta/\sqrt n)-e^{-\theta^2/2}|\,d\theta/|\theta|$. With $L=4\sqrt n/3\rho$ the third-moment Taylor estimate (3.3.20) controls the integrand by $e^{-\theta^2/4}(\theta^2/9+|\theta|^3/18)/L$, and the two pieces add up to less than $3\rho/\sqrt n$.`,
      caption: String.raw`Bernoulli$(p)$ summands, computed exactly. Left: the distribution function $F_n$ of the standardized binomial against $\Phi$ at your $n$, with the largest gap in gold. Right: $\sup_x|F_n-\Phi|$ for all $n$ up to $10^4$ on log axes, under Durrett's bound $3\rho/\sigma^3\sqrt n$ (red) and van Beek's constant $0.8$ (orange, dashed). Small $p$ makes $\rho/\sigma^3$ large and the approach slow; at $p=1/2$, $\sqrt n\sup|F_n-\Phi|\to(2\pi)^{-1/2}$.`,
      deps: ['prob-3.3.20', 'prob-3.3.11', 'prob-3.4.18', 'prob-3.4.19'],
      tags: ['central limit theorem', 'rates'],
      viz(v) {
        const M = v.M;
        const pS = v.slider('$p$', 0.02, 0.5, 0.2, { step: 0.01 });
        const nS = v.slider('$n$', 1, 5000, 30, { int: true, log: true });
        const L = v.stage({ x: [-3.5, 3.5], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: '$F_n$ (staircase) and $\\Phi$' });
        const R = v.stage({ x: [1, 1e4], xlog: true, y: [1e-3, 3], ylog: true, height: 320, weight: 1.15, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\sup_x|F_n(x)-\\Phi(x)|$' });
        let cache = null, st = null;
        const ksBin = (n, p) => { const q = binomPmf(M, n, p), s = Math.sqrt(n * p * (1 - p)); return ksLattice(M, Array.from(q, (_, k) => (k - n * p) / s), q); };
        v.render(() => {
          const p = pS.value, n = nS.value, sig = Math.sqrt(p * (1 - p)), rho = p * (1 - p) * (p * p + (1 - p) * (1 - p)), c = rho / sig ** 3;
          if (!cache || cache.p !== p) cache = { p, pts: logGrid(1, 1e4, 140).map((k) => [k, ksBin(k, p).d]) };
          const q = binomPmf(M, n, p), s = sig * Math.sqrt(n), z = Array.from(q, (_, k) => (k - n * p) / s), K = ksLattice(M, z, q);
          L.fn((x) => PhiN(M, x), { color: 'green', width: 2.2 });
          const stair = stepPts(z, q, -3.6, 3.6);
          L.path(stair, { color: 'accent', width: 2 });
          L.line(K.at, K.F, K.at, K.G, { color: 'gold', width: 4 });
          L.dot(K.at, K.F, { r: 3.5, color: 'gold' });
          R.fn((k) => (3 * c) / Math.sqrt(k), { color: 'red', width: 1.8 });
          R.fn((k) => (0.8 * c) / Math.sqrt(k), { color: 'orange', width: 1.6, dash: [6, 4] });
          if (Math.abs(p - 0.5) < 1e-9) R.fn((k) => 1 / Math.sqrt(2 * Math.PI * k), { color: 'muted', width: 1.2, dash: [3, 3] });
          R.path(cache.pts, { color: 'accent', width: 2 });
          R.dot(n, K.d, { r: 5, color: 'gold' });
          v.legend([['accent', 'exact distance'], ['red', '$3\\rho/\\sigma^3\\sqrt n$'], ['orange', '$0.8\\,\\rho/\\sigma^3\\sqrt n$', { dash: true }], ['green', '$\\Phi$'], ...(Math.abs(p - 0.5) < 1e-9 ? [['muted', '$(2\\pi n)^{-1/2}$', { dash: true }]] : [])]);
          st = { n, d: K.d, bnd: (3 * c) / Math.sqrt(n), c };
        });
        v.readout(() => st && `$\\rho/\\sigma^3=${v.fix(st.c, 3)}$. At $n=${st.n}$: $\\sup|F_n-\\Phi|=${v.fix(st.d, 4)}\\le3\\rho/\\sigma^3\\sqrt n=${v.fix(st.bnd, 4)}$ (ratio $${v.fix(st.d / st.bnd, 3)}$); $\\sqrt n\\cdot\\sup=${v.fix(st.d * Math.sqrt(st.n), 3)}$.`);
      },
    },
    {
      num: '3.4.18',
      kind: 'Lemma',
      name: 'Smoothing inequality for distribution functions',
      statement: String.raw`Let $F$ and $G$ be distribution functions with $G'(x)\le\lambda<\infty$. Put $\Delta=F-G$, $\eta=\sup|\Delta|$, $\Delta_L=\Delta*H_L$ where $H_L$ is Pólya's distribution with density $h_L(x)=(1-\cos Lx)/\pi Lx^2$, and $\eta_L=\sup|\Delta_L|$. Then
$$\eta_L\ge\frac\eta2-\frac{12\lambda}{\pi L},\qquad\text{equivalently}\qquad\eta\le2\eta_L+\frac{24\lambda}{\pi L}.$$`,
      idea: String.raw`Suppose $\Delta(x_0)=\eta$. Because $F$ cannot decrease and $G$ rises at slope at most $\lambda$, $\Delta$ stays above $\eta/2$ on a whole interval of length $\delta=\eta/2\lambda$ to the right of $x_0$, and the linear part of the lower bound averages out against the symmetric kernel. Pólya's kernel puts mass at most $4/\pi L\delta$ outside $[-\delta,\delta]$, where $\Delta\ge-\eta$. Evaluating $\Delta_L$ at the centre of the interval gives $\eta_L\ge\frac\eta2(1-\frac4{\pi L\delta})-\frac{4\eta}{\pi L\delta}=\frac\eta2-\frac{12\lambda}{\pi L}$.`,
      caption: String.raw`$F$ is a standardized Binomial$(n,0.3)$, $G=\Phi$ (so $\lambda=(2\pi)^{-1/2}$). Left: $\Delta=F-\Phi$ (accent, with jumps) and the smoothed $\Delta_L$ (orange), computed by convolving with Pólya's kernel in closed form (sine integral) and, for $\Phi*H_L$, by Fourier inversion. Right: as $L$ varies, $\eta$ (accent) always lies below $2\eta_L+24\lambda/\pi L$ (red); for small $L$ the additive term does the work, for large $L$ smoothing barely changes $\Delta$.`,
      deps: [],
      see: ['prob-3.4.17'],
      tags: ['estimates'],
      viz(v) {
        const M = v.M, lam = 1 / SQ2PI, p = 0.3;
        const nS = v.slider('binomial $n$', 2, 60, 8, { int: true });
        const LS = v.slider('$L$', 0.5, 100, 15, { log: true, sig: 2 });
        const A = v.stage({ x: [-4, 4], y: [-0.2, 0.2], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$x$', title: '$\\Delta=F-\\Phi$ and $\\Delta_L=\\Delta*H_L$' });
        const B = v.stage({ x: [0.5, 100], xlog: true, y: [1e-3, 10], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$L$', title: 'the inequality across $L$' });
        const GL = (x, Lv) => { const T = Math.min(Lv, 10); return 0.5 - simpson((t) => (t < 1e-9 ? -x : Math.sin(-t * x) * Math.exp(-t * t / 2) * (1 - t / Lv) / t), 0, T, 300) / Math.PI; }; // Φ*H_L by Gil-Pelaez inversion
        const setup = (n) => { const q = binomPmf(M, n, p), s = Math.sqrt(n * p * (1 - p)); return { q, z: Array.from(q, (_, k) => (k - n * p) / s) }; };
        const DL = (B0, x, Lv) => { let f = 0; for (let k = 0; k < B0.z.length; k++) if (B0.q[k] > 1e-14) f += B0.q[k] * H1(Lv * (x - B0.z[k])); return f - GL(x, Lv); };
        const etaL = (B0, Lv) => { let best = 0, at = 0; for (let i = 0; i <= 160; i++) { const x = -4 + (8 * i) / 160, d = Math.abs(DL(B0, x, Lv)); if (d > best) { best = d; at = x; } } const w = 8 / 160; for (let i = -10; i <= 10; i++) { const x = at + (w * i) / 10, d = Math.abs(DL(B0, x, Lv)); if (d > best) best = d; } return best; };
        let cache = null, st = null;
        v.render(() => {
          const n = nS.value, Lv = LS.value, B0 = setup(n), K = ksLattice(M, B0.z, B0.q), eta = K.d;
          if (!cache || cache.n !== n) cache = { n, curve: logGrid(1, 200, 22).map((k) => { const l = k / 2; return [l, etaL(B0, l)]; }) };
          const yr = eta * 1.3; A.setView(null, [-yr, yr]);
          const pts = stepPts(B0.z, B0.q, -4.2, 4.2, (x) => PhiN(M, x));
          A.hline(0, { color: 'muted', width: 1 });
          A.hline(eta, { color: 'accent', dash: [5, 4], width: 1 }); A.hline(-eta, { color: 'accent', dash: [5, 4], width: 1 });
          A.path(pts, { color: 'accent', width: 1.8 });
          const sm = []; let eL = 0; for (let i = 0; i <= 240; i++) { const x = -4 + (8 * i) / 240, d = DL(B0, x, Lv); sm.push([x, d]); eL = Math.max(eL, Math.abs(d)); }
          A.path(sm, { color: 'orange', width: 2.4 });
          A.hline(eL, { color: 'orange', dash: [2, 3], width: 1 }); A.hline(-eL, { color: 'orange', dash: [2, 3], width: 1 });
          const ub = cache.curve.map(([l, e]) => [l, 2 * e + (24 * lam) / (Math.PI * l)]);
          B.hline(eta, { color: 'accent', width: 2.2 });
          B.path(cache.curve, { color: 'orange', width: 1.8 });
          B.path(ub, { color: 'red', width: 2 });
          B.vline(Lv, { color: 'gold', width: 1.2, dash: [3, 3] });
          v.legend([['accent', '$\\Delta$ and $\\eta=\\sup|\\Delta|$'], ['orange', '$\\Delta_L$ and $\\eta_L$'], ['red', '$2\\eta_L+24\\lambda/\\pi L$']]);
          st = { eta, eL, Lv, ub: 2 * eL + (24 * lam) / (Math.PI * Lv) };
        });
        v.readout(() => st && `$L=${v.fix(st.Lv, 2)}$: $\\eta=${v.fix(st.eta, 4)}$, $\\eta_L=${v.fix(st.eL, 4)}$; $\\ 2\\eta_L+24\\lambda/\\pi L=${v.fix(st.ub, 4)}\\ge\\eta$ ✓; $\\ \\eta/2-12\\lambda/\\pi L=${v.fix(st.eta / 2 - (12 / SQ2PI) / (Math.PI * st.Lv), 4)}\\le\\eta_L$.`);
      },
    },
    {
      num: '3.4.19',
      kind: 'Lemma',
      name: 'Esseen’s inequality via characteristic functions',
      statement: String.raw`Let $K_1,K_2$ be distribution functions with mean $0$ whose characteristic functions $\kappa_1,\kappa_2$ are integrable. Then
$$K_1(x)-K_2(x)=-\frac1{2\pi}\int e^{-itx}\,\frac{\kappa_1(t)-\kappa_2(t)}{it}\,dt,$$
and in particular $\sup_x|K_1(x)-K_2(x)|\le\frac1{2\pi}\int|\kappa_1(t)-\kappa_2(t)|\,\frac{dt}{|t|}$. Applied to $F*H_L$ and $G*H_L$ (characteristic functions vanishing off $[-L,L]$) and combined with 3.4.18: $\sup|F-G|\le\frac1\pi\int_{-L}^L|\varphi_F-\varphi_G|\frac{dt}{|t|}+\frac{24\lambda}{\pi L}$.`,
      idea: String.raw`Integrable characteristic functions give densities by the inversion formula (3.3.14). Subtract the two inversion formulas, integrate the density difference from $a$ to $x$ and use Fubini, then let $a\to-\infty$ with the Riemann–Lebesgue lemma. The factor $1/it$ is harmless near $0$ because both laws have mean $0$, so $(\kappa_1-\kappa_2)(t)/t\to0$.`,
      caption: String.raw`$K_1$: the standardized sum of $n$ exponentials smoothed by Pólya's kernel $H_L$; $K_2=\Phi*H_L$. Left: the integrand $|\kappa_1-\kappa_2|/|t|$ on $[-L,L]$; its integral over $2\pi$ is the bound (gold). Right: $K_1-K_2$ from the inversion formula (accent curve) and from direct numerical convolution of the densities with $H_L$ (orange dots): they agree, and both stay inside the gold band.`,
      deps: ['prob-3.3.11', 'prob-3.3.14', 'prob-3.4.18'],
      see: ['prob-3.4.17'],
      tags: ['estimates', 'characteristic functions'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$ exponentials', 1, 40, 3, { int: true });
        const LS = v.slider('$L$', 1, 25, 6, { step: 0.5 });
        const A = v.stage({ x: [-6, 6], y: [0, 0.3], height: 320, axes: 'box', gutter: true, xlabel: '$t$', title: 'integrand $|\\kappa_1(t)-\\kappa_2(t)|/|t|$' });
        const B = v.stage({ x: [-4, 4], y: [-0.1, 0.1], height: 320, weight: 1.15, axes: 'box', gutter: true, xlabel: '$x$', title: '$K_1(x)-K_2(x)$ two ways' });
        // ch.f. of (Gamma(n) − n)/√n: (1 − it/√n)^(−n) e^(−it√n)
        const phiN = (n, t) => { const r = Math.sqrt(n); const l = clog([1, -t / r]); return cexp([-n * l[0], -n * l[1] - t * r]); };
        let cache = null, st = null;
        v.render(() => {
          const n = nS.value, Lv = LS.value, rn = Math.sqrt(n);
          const D = (t) => { const a = phiN(n, t), w = Math.max(0, 1 - Math.abs(t) / Lv), g = Math.exp(-t * t / 2); return [(a[0] - g) * w, a[1] * w]; };
          const integrand = (t) => (Math.abs(t) < 1e-9 ? 0 : cabs(D(t)) / Math.abs(t));
          const bound = (2 * simpson(integrand, 1e-7, Lv, 1200)) / (2 * Math.PI);
          A.setView([-Lv * 1.05, Lv * 1.05], null);
          let mx = 0; for (let i = 1; i <= 300; i++) mx = Math.max(mx, integrand((Lv * i) / 300)); A.setView(null, [0, mx * 1.15 + 1e-9]);
          A.fn(integrand, { domain: [-Lv, Lv], color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.18, n: 500 });
          // inversion: K1 − K2 = −(1/π) ∫_0^L Re[ e^{−itx} D(t)/(it) ] dt
          const inv = (x) => -(1 / Math.PI) * simpson((t) => { if (t < 1e-9) return 0; const d = D(t), c = Math.cos(t * x), s = -Math.sin(t * x); const re = c * d[0] - s * d[1], im = c * d[1] + s * d[0]; return im / t; }, 1e-7, Lv, 800);
          if (!cache || cache.n !== n || cache.L !== Lv) {
            // direct: ∫ f(z) H1(L(x − z)) dz for both laws
            const G = M.dist.gamma(n, 1), f1 = (z) => rn * G.pdf(n + z * rn), z0 = -rn, step = Math.min(0.02, 0.25 / Lv);
            const conv = (x, f, a, b) => { const k = Math.ceil((b - a) / step / 2) * 2; return simpson((z) => f(z) * H1(Lv * (x - z)), a, b, k); };
            const dots = []; for (let i = 0; i <= 24; i++) { const x = -3.6 + (7.2 * i) / 24; dots.push([x, conv(x, f1, z0, 14) - conv(x, PHI, -9, 9)]); }
            cache = { n, L: Lv, dots };
          }
          const curve = []; let mxd = 0; for (let i = 0; i <= 160; i++) { const x = -4 + (8 * i) / 160, y = inv(x); curve.push([x, y]); mxd = Math.max(mxd, Math.abs(y)); }
          const yr = Math.max(bound, mxd) * 1.2 + 1e-6; B.setView(null, [-yr, yr]);
          B.hband(-bound, bound, { color: 'gold', alpha: 0.1 }); B.hline(bound, { color: 'gold', dash: [5, 4], width: 1.2 }); B.hline(-bound, { color: 'gold', dash: [5, 4], width: 1.2 });
          B.hline(0, { color: 'muted', width: 1 });
          B.path(curve, { color: 'accent', width: 2.2 });
          cache.dots.forEach(([x, y]) => B.dot(x, y, { r: 3.5, color: 'orange' }));
          v.legend([['accent', 'inversion formula'], ['orange', 'direct convolution', { dot: true }], ['gold', '$\\pm\\frac1{2\\pi}\\int|\\kappa_1-\\kappa_2|\\,dt/|t|$', { area: true }]]);
          let agree = 0; cache.dots.forEach(([x, y]) => { agree = Math.max(agree, Math.abs(inv(x) - y)); });
          st = { bound, mxd, agree };
        });
        v.readout(() => st && `$\\sup_x|K_1-K_2|=${v.fix(st.mxd, 5)}\\le\\frac1{2\\pi}\\int|\\kappa_1-\\kappa_2|\\,\\frac{dt}{|t|}=${v.fix(st.bound, 5)}$. Largest disagreement between the two computations: $${v.sci(st.agree, 2)}$.`);
      },
    },
    // ======================================================================== §3.5 local limit theorems
    {
      num: '3.5.1a',
      kind: 'Definition',
      name: 'Lattice distribution and span',
      verify: true,
      statement: String.raw`A random variable $X$ has a **lattice distribution** if there are constants $b$ and $h>0$ with $P(X\in b+h\Z)=1$. The largest such $h$ is the **span**. (By 3.5.2, lattice laws are by convention nondegenerate.) If one can take $b=0$, the law is **arithmetic**, and then its characteristic function is periodic with period $2\pi/h$.`,
      idea: String.raw`If $P(X\in b+h\Z)=1$, then $\varphi(2\pi/h)=e^{2\pi ib/h}\sum P(X=b+hk)e^{2\pi ik}$ has modulus $1$: the characteristic function returns to the unit circle at $t=2\pi/h$. For finitely many atoms $x_1,\dots,x_r$, the law is lattice exactly when all differences $x_j-x_1$ are integer multiples of a common $h$, and the span is their greatest common divisor; one irrational ratio destroys it.`,
      caption: String.raw`Drag the three atoms (left/right = position on a grid of $0.25$, up/down = weight). Top: the atoms and the lattice $b+h\Z$ with the span $h$ (the gcd of the differences). Bottom: $|\varphi(t)|$ returns to $1$ exactly at the multiples of $2\pi/h$ (dashed). Toggle the irrational shift: the third atom moves by $\sqrt2/10$, the law becomes nonlattice and $|\varphi|$ never quite gets back to $1$.`,
      deps: ['prob-1.2.6a', 'prob-3.3.1a'],
      tags: ['local limit', 'distributions'],
      viz(v) {
        const irr = v.toggle('irrational shift of atom 3', false);
        const T = v.stage({ x: [-3.2, 3.2], y: [0, 1.1], height: 210, axes: 'box', gutter: true, xlabel: '$x$', full: true, title: 'atoms and the lattice $b+h\\mathbb Z$' });
        const B = v.stage({ x: [0, 30], y: [0, 1.08], height: 230, axes: 'box', gutter: true, xlabel: '$t$', full: true, title: '$|\\varphi(t)|$' });
        const snap = (x, y) => [clampN(Math.round(x * 4) / 4, -3, 3), clampN(y, 0.08, 1)];
        const Hs = [[-1, 0.6], [0.5, 0.9], [1.5, 0.45]].map((p, i) => T.handle(p[0], p[1], { color: ['accent', 'teal', 'purple'][i], constrain: snap }));
        const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
        let st = null;
        v.render(() => {
          const shift = irr.value ? Math.SQRT2 / 10 : 0;
          const xs = Hs.map((h, i) => h.x + (i === 2 ? shift : 0)), ws0 = Hs.map((h) => h.y), W = ws0.reduce((a, b) => a + b, 0), ws = ws0.map((w) => w / W);
          const ks = Hs.map((h) => Math.round(h.x * 4)); let g = 0; for (let i = 1; i < 3; i++) g = gcd(g, ks[i] - ks[0]);
          const lattice = !irr.value && g > 0, degenerate = !irr.value && g === 0, h = g / 4;
          if (lattice) { for (let k = -40; k <= 40; k++) { const x = xs[0] + k * h; if (x >= -3.2 && x <= 3.2) T.line(x, 0, x, 0.05, { color: 'muted', width: 1.2 }); } }
          T.hline(0, { color: 'muted', width: 1 });
          xs.forEach((x, i) => { T.line(x, 0, x, Hs[i].y, { color: ['accent', 'teal', 'purple'][i], width: 3 }); T.text(`${v.fix(ws[i], 2)}`, x, Hs[i].y, { dy: -14, size: 11, color: 'ink', plate: true }); });
          if (irr.value) T.text('+√2/10', xs[2], 0.12, { size: 10.5, color: 'purple', dx: 22 });
          const phi = (t) => { let re = 0, im = 0; for (let i = 0; i < 3; i++) { re += ws[i] * Math.cos(t * xs[i]); im += ws[i] * Math.sin(t * xs[i]); } return Math.hypot(re, im); };
          if (lattice) for (let k = 1; (2 * Math.PI * k) / h <= 30; k++) B.vline((2 * Math.PI * k) / h, { color: 'green', dash: [5, 4], width: 1.3 });
          B.hline(1, { color: 'muted', width: 1, dash: [3, 3] });
          B.fn(phi, { domain: [0, 30], color: 'accent', width: 2, n: 1500 });
          let mx = 0; for (let i = 1; i <= 40000; i++) { const t = 1 + (199 * i) / 40000; mx = Math.max(mx, phi(t)); }
          cornerIn(B, degenerate ? 'degenerate: |φ| ≡ 1' : lattice ? `lattice: span h = ${v.fix(h, 2)}, 2π/h = ${v.fix((2 * Math.PI) / h, 3)}` : 'nonlattice', 'bl', { color: lattice ? 'green' : 'red', plate: true });
          v.legend([['accent', '$|\\varphi(t)|$'], ['green', 'multiples of $2\\pi/h$', { dash: true }]]);
          st = { lattice, degenerate, h, b: xs[0], mx };
        });
        v.readout(() => st && (st.degenerate ? 'All atoms coincide: a point mass, $|\\varphi|\\equiv1$ (degenerate, not called lattice).' : st.lattice ? `Lattice with span $h=${v.fix(st.h, 2)}$ (one choice: $b=${v.fix(st.b, 2)}$); $|\\varphi(2\\pi k/h)|=1$ for every integer $k$.` : `Nonlattice: $\\max_{1\\le t\\le200}|\\varphi(t)|=${v.fix(st.mx, 5)}<1$ — close returns, never a full one.`));
      },
    },
    {
      num: '3.5.2',
      kind: 'Theorem',
      name: 'Three possibilities for |φ|',
      statement: String.raw`Let $\varphi(t)=Ee^{itX}$. Exactly one of the following holds:
(i) $|\varphi(t)|<1$ for all $t\ne0$ (**nonlattice**);
(ii) there is $\lambda>0$ with $|\varphi(\lambda)|=1$ and $|\varphi(t)|<1$ for $0<t<\lambda$; then $X$ has a lattice distribution with span $2\pi/\lambda$ (**lattice**);
(iii) $|\varphi(t)|=1$ for all $t$; then $X=b$ a.s. for some $b$ (**degenerate**).`,
      idea: String.raw`$|\varphi(t)|=1$ means equality in $|Ee^{itX}|\le E|e^{itX}|$, which forces $e^{itX}$ to be a.s. constant, i.e. $X\in b+(2\pi/t)\Z$ a.s.; conversely that lattice gives $|\varphi(t)|=1$. If $|\varphi|=1$ along $t_n\downarrow0$, then $X$ lives on lattices whose spacing $2\pi/t_n$ goes to infinity, which squeezes all mass onto one point.`,
      caption: String.raw`Pick a law. Left: the curve $t\mapsto\varphi(t)$ in the complex plane for $0\le t\le T$, with the unit circle. Right: $|\varphi(t)|$; drag the gold point along $t$. Uniform: the curve spirals into $0$. Poisson$+\frac12$: it returns to the circle at $t=2\pi$, but at $-1$, not at $1$ (lattice, not arithmetic). Point mass: the curve runs around the circle forever. Atoms $\{0,1,\sqrt2\}$: near misses, never a touch.`,
      deps: ['prob-3.5.1a', 'prob-3.3.1'],
      tags: ['local limit', 'characteristic functions'],
      viz(v) {
        const LAWS = {
          unif: { label: 'uniform$(0,1)$', phi: (t) => (Math.abs(t) < 1e-9 ? [1, 0] : [Math.sin(t) / t, (1 - Math.cos(t)) / t]) },
          pois: { label: 'Poisson$(1.5)+\\tfrac12$', phi: (t) => cmul([Math.cos(t / 2), Math.sin(t / 2)], cexp([1.5 * (Math.cos(t) - 1), 1.5 * Math.sin(t)])) },
          point: { label: 'point mass at $0.7$', phi: (t) => [Math.cos(0.7 * t), Math.sin(0.7 * t)] },
          irr: { label: 'atoms $0,1,\\sqrt2$', phi: (t) => [(1 + Math.cos(t) + Math.cos(Math.SQRT2 * t)) / 3, (Math.sin(t) + Math.sin(Math.SQRT2 * t)) / 3] },
        };
        const law = v.select('law', Object.keys(LAWS).map((k) => ({ value: k, label: LAWS[k].label })), 'pois');
        const TS = v.slider('$T$', 8, 60, 20, { step: 1 });
        const C = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 330, axes: true, title: '$\\varphi(t)$, $0\\le t\\le T$' });
        const R = v.stage({ x: [0, 20], y: [0, 1.08], height: 330, weight: 1.3, axes: 'box', gutter: true, xlabel: '$t$', title: '$|\\varphi(t)|$' });
        const H = R.handle(2 * Math.PI, 1, { color: 'gold', label: 't', labelPos: 'n' });
        let st = null;
        const classify = (phi, T) => {
          const a = (t) => cabs(phi(t)); let allOne = true;
          for (let i = 1; i <= 2000; i++) if (a((T * i) / 2000) < 1 - 1e-12) { allOne = false; break; }
          if (allOne) return { kind: 'deg' };
          const step = 0.004; let best = 0, prev2 = a(0.05), prev = a(0.05 + step);
          for (let t = 0.05 + 2 * step; t <= T; t += step) {
            const cur = a(t);
            if (prev >= prev2 && prev >= cur) { // refine a local maximum by golden section
              let lo = t - 2 * step, hi = t; const g = 0.618;
              for (let k = 0; k < 60; k++) { const m1 = hi - g * (hi - lo), m2 = lo + g * (hi - lo); if (a(m1) < a(m2)) lo = m1; else hi = m2; }
              const tm = (lo + hi) / 2, am = a(tm); best = Math.max(best, am);
              if (am > 1 - 1e-10) return { kind: 'lat', lam: tm };
            }
            prev2 = prev; prev = cur;
          }
          return { kind: 'non', best };
        };
        v.render(() => {
          const L = LAWS[law.value], T = TS.value;
          R.setView([0, T], null);
          const t0 = clampN(H.x, 0, T); if (H.y !== cabs(L.phi(t0)) || H.x !== t0) H.set(t0, cabs(L.phi(t0)));
          C.circle(0, 0, 1, { color: 'muted', width: 1.2 });
          C.curve((t) => L.phi(t), 0, T, { color: 'accent', width: 1.6, n: Math.round(T * 60) });
          const z = L.phi(t0); C.dot(z[0], z[1], { r: 5, color: 'gold' }); C.dot(1, 0, { r: 3.5, color: 'ink' });
          R.hline(1, { color: 'muted', width: 1, dash: [3, 3] });
          R.fn((t) => cabs(L.phi(t)), { domain: [0, T], color: 'accent', width: 2, n: 1500 });
          const c = classify(L.phi, T);
          if (c.kind === 'lat') for (let k = 1; k * c.lam <= T + 1e-9; k++) R.vline(k * c.lam, { color: 'green', dash: [5, 4], width: 1.2 });
          cornerIn(R, c.kind === 'deg' ? '(iii) degenerate' : c.kind === 'lat' ? `(ii) lattice: λ = ${v.fix(c.lam, 4)}` : '(i) nonlattice', 'bl', { color: c.kind === 'non' ? 'red' : 'green', plate: true });
          st = { c, t0, z };
        });
        v.readout(() => st && `$t=${v.fix(st.t0, 3)}$: $\\varphi(t)=${v.fix(st.z[0], 4)}${st.z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(st.z[1]), 4)}i$, $|\\varphi(t)|=${v.fix(cabs(st.z), 5)}$. ` + (st.c.kind === 'lat' ? `First return to the circle at $\\lambda=${v.fix(st.c.lam, 4)}$: span $2\\pi/\\lambda=${v.fix((2 * Math.PI) / st.c.lam, 4)}$.` : st.c.kind === 'deg' ? '$|\\varphi|\\equiv1$: the law is a point mass.' : `Largest local maximum of $|\\varphi|$ on $(0,T]$: $${v.fix(st.c.best, 5)}<1$.`));
      },
    },
    {
      num: '3.5.3',
      kind: 'Theorem',
      name: 'Local limit theorem (lattice case)',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $EX_i=0$, $EX_i^2=\sigma^2\in(0,\infty)$ and a lattice distribution of span $h$, $P(X_i\in b+h\Z)=1$. Let $p_n(x)=P(S_n/\sqrt n=x)$ for $x\in\mathcal L_n=\{(nb+hz)/\sqrt n:z\in\Z\}$ and $n(x)=(2\pi\sigma^2)^{-1/2}e^{-x^2/2\sigma^2}$. Then
$$\sup_{x\in\mathcal L_n}\Big|\frac{\sqrt n}{h}\,p_n(x)-n(x)\Big|\to0.$$`,
      idea: String.raw`Write the point probabilities by Fourier inversion on a lattice: $\frac{\sqrt n}hp_n(x)=\frac1{2\pi}\int_{|t|\le\pi\sqrt n/h}e^{-itx}\varphi^n(t/\sqrt n)\,dt$, and $n(x)$ is the full-line inversion of $e^{-\sigma^2t^2/2}$ (3.3.14). The difference is bounded uniformly in $x$ by $\int|\varphi^n(t/\sqrt n)-e^{-\sigma^2t^2/2}|$ plus a Gaussian tail. Split: on $|t|\le A$ the CLT expansion (3.3.20) gives pointwise convergence; on $A<|t|\le\delta\sqrt n$ the bound $|\varphi(u)|\le e^{-\sigma^2u^2/4}$ dominates; and on $\delta\le|u|\le\pi/h$, $|\varphi|\le\eta<1$ because the span is exactly $h$ (3.5.2), so $\eta^n$ kills that piece.`,
      caption: String.raw`Exact probabilities of $S_n$ for four lattice step laws. Left: $\frac{\sqrt n}hP(S_n/\sqrt n=x)$ at the lattice points (dots) against the normal density $n(x)$ (green). Switch off "divide by $h$" to see why the span matters: the points of $\mathcal L_n$ are $h/\sqrt n$ apart, so without the factor $1/h$ the dots settle at $h\,n(x)$ instead of $n(x)$. Right: the sup error over the lattice against $n$, on log axes, with reference slopes $n^{-1/2}$ and $n^{-1}$ (symmetric steps converge faster).`,
      deps: ['prob-3.5.2', 'prob-3.3.11', 'prob-3.3.20'],
      tags: ['local limit'],
      viz(v) {
        const M = v.M;
        const STEPS = {
          srw: { label: '$\\pm1$ ($h=2$)', vals: [-1, 1], p: [0.5, 0.5], h: 2 },
          skew: { label: '$\\{-1,0,2\\}$ ($h=1$)', vals: [-1, 0, 2], p: [0.5, 0.25, 0.25], h: 1 },
          three: { label: '$\\{-3,0,3\\}$ ($h=3$)', vals: [-3, 0, 3], p: [1 / 6, 2 / 3, 1 / 6], h: 3 },
          die: { label: 'die $-3.5$ ($h=1$)', vals: [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5], p: [1, 1, 1, 1, 1, 1].map((x) => x / 6), h: 1 },
        };
        const law = v.select('steps', Object.keys(STEPS).map((k) => ({ value: k, label: STEPS[k].label })), 'skew');
        const nS = v.slider('$n$', 1, 1000, 12, { int: true, log: true });
        const divH = v.toggle('divide by $h$', true);
        const L = v.stage({ x: [-4, 4], y: [0, 0.5], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$x$', title: 'scaled point probabilities vs $n(x)$' });
        const R = v.stage({ x: [1, 1000], xlog: true, y: [1e-5, 2], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\sup_x|\\frac{\\sqrt n}{h}p_n(x)-n(x)|$' });
        const dist = (S, n) => { const lo = S.vals[0], g = S.vals.length > 1 ? Math.min(...S.vals.slice(1).map((x, i) => x - S.vals[i])) : 1; const K = Math.round((S.vals[S.vals.length - 1] - lo) / g) + 1; const p = new Float64Array(K); S.vals.forEach((x, i) => { p[Math.round((x - lo) / g)] += S.p[i]; }); return { q: n === 1 ? p : convPow(M, p, n), x0: n * lo, g }; };
        const sigOf = (S) => Math.sqrt(S.vals.reduce((a, x, i) => a + x * x * S.p[i], 0));
        // the grid step of the pmf array equals the span h for all four laws, so every grid point lies in L_n = (nb + hZ)/√n
        const supErr = (S, n, sc) => { const D = dist(S, n), s = sigOf(S), rn = Math.sqrt(n); let e = 0; for (let j = 0; j < D.q.length; j++) { const x = (D.x0 + j * D.g) / rn; e = Math.max(e, Math.abs((rn / sc) * D.q[j] - PHI(x / s) / s)); } return e; };
        let cache = null, st = null;
        v.render(() => {
          const S = STEPS[law.value], n = nS.value, s = sigOf(S), sc = divH.value ? S.h : 1, rn = Math.sqrt(n);
          if (!cache || cache.k !== law.value || cache.sc !== sc) cache = { k: law.value, sc, pts: logGrid(1, 1000, 45).map((m) => [m, Math.max(1e-6, supErr(S, m, sc))]) };
          const D = dist(S, n);
          L.setView([-4 * s, 4 * s], [0, (Math.max(1, S.h / sc) * 1.25) / (s * SQ2PI)]);
          L.fn((x) => PHI(x / s) / s, { color: 'green', width: 2.2 });
          for (let j = 0; j < D.q.length; j++) {
            const x = (D.x0 + j * D.g) / rn; if (Math.abs(x) > 4.1 * s) continue;
            const y = (rn / sc) * D.q[j];
            if (n <= 120) L.line(x, 0, x, y, { color: 'accent', width: 1, alpha: 0.45 });
            L.dot(x, y, { r: n <= 120 ? 3 : 1.8, color: 'accent' });
          }
          const e = supErr(S, n, sc);
          const p0 = cache.pts[0];
          R.fn((m) => p0[1] / Math.sqrt(m), { color: 'muted', width: 1.2, dash: [6, 4] });
          R.fn((m) => p0[1] / m, { color: 'muted', width: 1.2, dash: [2, 3] });
          R.path(cache.pts, { color: divH.value ? 'accent' : 'red', width: 2.2 });
          R.dot(n, Math.max(1e-6, e), { r: 5, color: 'gold' });
          v.legend([['accent', divH.value ? '$\\frac{\\sqrt n}{h}P(S_n/\\sqrt n=x)$' : '$\\sqrt n\\,P(S_n/\\sqrt n=x)$'], ['green', '$n(x)$, variance $\\sigma^2$'], ['muted', 'slopes $n^{-1/2}$, $n^{-1}$', { dash: true }]]);
          st = { n, e, h: S.h, s2: s * s, div: divH.value };
        });
        v.readout(() => st && `Span $h=${st.h}$, $\\sigma^2=${v.fix(st.s2, 4)}$, $n=${st.n}$: sup error over the lattice $=${v.fix(st.e, 5)}$` + (!st.div && st.h !== 1 ? ' — without the factor $1/h$ the error does not go to $0$.' : '.'));
      },
    },
    {
      num: '3.5.4',
      kind: 'Theorem',
      name: 'Local limit theorem (nonlattice case)',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with $EX_i=0$, $EX_i^2=\sigma^2\in(0,\infty)$ and $|\varphi(t)|<1$ for all $t\ne0$ (nonlattice). If $x_n/\sqrt n\to x$ and $a<b$, then
$$\sqrt n\,P\big(S_n\in(x_n+a,x_n+b)\big)\to(b-a)\,n(x),\qquad n(x)=(2\pi\sigma^2)^{-1/2}e^{-x^2/2\sigma^2}.$$
The interval has *fixed* length: $S_n$ is examined at the scale of single steps, not of $\sqrt n$.`,
      idea: String.raw`The characteristic function may be badly behaved at infinity, so smooth with Pólya's density $h_0$, whose Fourier transform has compact support, and its modulations $e^{i\theta x}h_0(x)$. For these test functions, $\sqrt n\,Eh_\theta(S_n-x_n)$ is a Fourier integral over a bounded set of frequencies: near $0$ the CLT gives the normal limit, and away from $0$ the nonlattice hypothesis gives $|\varphi|\le\eta<1$. This identifies the limit of the measures $h_0(y)\sqrt nP(S_n-x_n\in dy)$ through their characteristic functions (3.3.17), and dividing by $h_0$ recovers intervals (3.2.10).`,
      caption: String.raw`Steps $\pm1$ and $\pm c$, each with probability $\frac14$, computed exactly (the walk is a rotated pair of independent $\pm1$ walks). With $c=\sqrt2$ the law is nonlattice; with $c=2$ it is lattice of span $1$. Left: $\sqrt n\,P(S_n\in(x\sqrt n,x\sqrt n+w))/w$ as a function of $x$, against $n(x)$. Right: the same quantity at your $x$ as $n$ grows. For $c=\sqrt2$ both settle on $n(x)$; for $c=2$ and $w<1$ the window catches $0$ or $1$ lattice points and the values keep jumping.`,
      deps: ['prob-3.5.2', 'prob-3.3.14', 'prob-3.3.20'],
      tags: ['local limit'],
      viz(v) {
        const M = v.M;
        const cs = v.select('steps', [{ value: 'irr', label: '$\\pm1,\\pm\\sqrt2$ (nonlattice)' }, { value: 'lat', label: '$\\pm1,\\pm2$ (lattice)' }], 'irr');
        const nS = v.slider('$n$', 4, 400, 60, { int: true, log: true });
        const wS = v.slider('window $w=b-a$', 0.05, 2, 0.4, { step: 0.01 });
        const xS = v.slider('$x$', -2, 2, 0.5, { step: 0.05 });
        const L = v.stage({ x: [-3, 3], y: [0, 0.6], height: 320, weight: 1.25, axes: 'box', gutter: true, xlabel: '$x$', title: '$\\sqrt n\\,P(S_n\\in(x\\sqrt n,x\\sqrt n+w))/w$' });
        const R = v.stage({ x: [4, 400], xlog: true, y: [0, 0.6], height: 320, axes: 'box', gutter: true, xlabel: '$n$', title: 'at the chosen $x$' });
        const atomsCache = new Map();
        const atoms = (c, n) => {
          const key = `${c}|${n}`; if (atomsCache.has(key)) return atomsCache.get(key);
          const pa = [], span = Math.min(n, Math.ceil(7 * Math.sqrt(n)));
          for (let a = -n; a <= n; a += 2) { if (Math.abs(a) > span) continue; pa.push([a, Math.exp(M.lgamma(n + 1) - M.lgamma((n + a) / 2 + 1) - M.lgamma((n - a) / 2 + 1) - n * Math.LN2)]); }
          const list = []; for (const [a, p] of pa) for (const [d, q] of pa) list.push([(a + d) / 2 + (c * (a - d)) / 2, p * q]);
          list.sort((u, w) => u[0] - w[0]);
          const xs = Float64Array.from(list, (e) => e[0]), cum = new Float64Array(list.length + 1); for (let i = 0; i < list.length; i++) cum[i + 1] = cum[i] + list[i][1];
          const out = { xs, cum }; atomsCache.set(key, out); if (atomsCache.size > 200) atomsCache.delete(atomsCache.keys().next().value); return out;
        };
        const lb = (xs, v0) => { let lo = 0, hi = xs.length; while (lo < hi) { const m = (lo + hi) >> 1; if (xs[m] <= v0) lo = m + 1; else hi = m; } return lo; }; // first index with xs > v0
        const lbStrict = (xs, v0) => { let lo = 0, hi = xs.length; while (lo < hi) { const m = (lo + hi) >> 1; if (xs[m] < v0) lo = m + 1; else hi = m; } return lo; }; // first index with xs ≥ v0
        const win = (A, a, b) => A.cum[lbStrict(A.xs, b - 1e-12)] - A.cum[lb(A.xs, a + 1e-12)]; // P(a < S < b)
        let st = null;
        v.render(() => {
          const c = cs.value === 'irr' ? Math.SQRT2 : 2, n = nS.value, w = wS.value, x = xS.value, s = Math.sqrt((1 + c * c) / 2), rn = Math.sqrt(n);
          const nd = (u) => PHI(u / s) / s, A = atoms(c, n);
          const g = (u) => (rn * win(A, u * rn, u * rn + w)) / w;
          const pts = []; let top = 0; for (let i = 0; i <= 900; i++) { const u = -3 + (6 * i) / 900, y = g(u); pts.push([u, y]); top = Math.max(top, y); }
          L.setView(null, [0, Math.max(0.5, Math.min(3, top * 1.05))]);
          L.path(pts, { color: 'accent', width: 1.2 });
          L.fn(nd, { color: 'green', width: 2.4 });
          L.vline(x, { color: 'gold', width: 1.2, dash: [3, 3] }); L.dot(x, g(x), { r: 5, color: 'gold' });
          const ns = logGrid(4, 400, 40), seq = ns.map((m) => { const B = atoms(c, m), r = Math.sqrt(m); return [m, (r * win(B, x * r, x * r + w)) / w]; });
          R.setView(null, [0, Math.max(0.5, Math.min(3, Math.max(...seq.map((p) => p[1])) * 1.1))]);
          R.hline(nd(x), { color: 'green', width: 2, dash: [6, 4] });
          R.path(seq, { color: 'accent', width: 1.8 }); seq.forEach(([m, y]) => R.dot(m, y, { r: 2.6, color: 'accent' }));
          R.dot(n, g(x), { r: 5, color: 'gold' });
          v.legend([['accent', 'exact $\\sqrt n\\,P(\\cdot)/w$'], ['green', '$n(x)$, $\\sigma^2=(1+c^2)/2$']]);
          st = { n, w, x, val: g(x), lim: nd(x), c };
        });
        v.readout(() => st && `$n=${st.n}$, $w=${v.fix(st.w, 2)}$, $x=${v.fix(st.x, 2)}$: $\\sqrt n\\,P(S_n\\in(x\\sqrt n,x\\sqrt n+w))/w=${v.fix(st.val, 4)}$ vs $n(x)=${v.fix(st.lim, 4)}$` + (st.c === 2 && st.w < 1 ? ' — lattice steps: no fixed-window limit.' : '.'));
      },
    },
  ],
};
