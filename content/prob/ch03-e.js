// Probability: Theory and Examples (Durrett) — Chapter 3, part E: stable laws, infinitely divisible laws, limit theorems in ℝᵈ (§§3.8–3.10)

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
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const sampleExp = (r) => -Math.log(1 - r());
function samplePois(r, lam) { if (lam <= 0) return 0; let k = 0, p = Math.exp(-lam), c = p; const u = r(); while (u > c && k < 2000) { k++; p *= lam / k; c += p; } return k; }
function poisPmf(lam, K) { const out = new Float64Array(K + 1); let p = Math.exp(-lam); for (let k = 0; k <= K; k++) { out[k] = p; p *= lam / (k + 1); } return out; }
function tvd(a, b) { const K = Math.max(a.length, b.length); let s = 0, ma = 0, mb = 0; for (let k = 0; k < K; k++) { const x = a[k] || 0, y = b[k] || 0; s += Math.abs(x - y); ma += x; mb += y; } return 0.5 * (s + Math.max(0, 1 - ma) + Math.max(0, 1 - mb)); }
function conv(a, b, K = Infinity) { const L = Math.min(K + 1, a.length + b.length - 1), out = new Float64Array(L); for (let i = 0; i < a.length && i < L; i++) if (a[i]) for (let j = 0; j < b.length && i + j < L; j++) out[i + j] += a[i] * b[j]; return out; }
/** n-fold convolution power of a pmf on consecutive lattice points via one FFT. */
function convPow(M, p, n) {
  const K = p.length, L = n * (K - 1) + 1, N = M.nextPow2(L), re = new Float64Array(N), im = new Float64Array(N);
  for (let i = 0; i < K; i++) re[i] = p[i];
  M.fft(re, im);
  for (let k = 0; k < N; k++) { const r = Math.hypot(re[k], im[k]), th = Math.atan2(im[k], re[k]), rn = Math.pow(r, n); re[k] = rn * Math.cos(n * th); im[k] = rn * Math.sin(n * th); }
  M.ifft(re, im);
  const out = new Float64Array(L); for (let i = 0; i < L; i++) out[i] = re[i] > 0 ? re[i] : 0; return out;
}
/** Kolmogorov distance between two samples. */
function ks2(a0, b0) { const a = Float64Array.from(a0).sort(), b = Float64Array.from(b0).sort(); let i = 0, j = 0, d = 0; while (i < a.length && j < b.length) { if (a[i] <= b[j]) i++; else j++; d = Math.max(d, Math.abs(i / a.length - j / b.length)); } return d; }
// ----- stable laws
/** K_α = ∫₀^∞ (e^{iu} − 1 − iu·1(u<1)) u^{−α−1} du = Γ(−α)e^{−iπα/2} − i/(1−α)  (α ≠ 1); K₁ = −π/2 + i(1 − γ). */
function stableK(M, a) { if (Math.abs(a - 1) < 1e-9) return [-Math.PI / 2, 1 - 0.5772156649015329]; const g = M.gamma(-a); return [g * Math.cos((Math.PI * a) / 2), -g * Math.sin((Math.PI * a) / 2) - 1 / (1 - a)]; }
/**
 * log of the limit ch.f. of (S_n − b_n)/n^{1/α} for P(X > x) = θx^{−α}, P(X < −x) = (1−θ)x^{−α} (x ≥ 1), t > 0:
 * θ·I(t) + (1−θ)·conj I(t) with I(t) = α t^α [K_α − i (t^{1−α} − 1)/(1−α)] (−i log t when α = 1).
 */
function stableLogPsi(K, a, th, t) {
  const ta = Math.pow(t, a), corr = Math.abs(a - 1) < 1e-9 ? Math.log(t) : (Math.pow(t, 1 - a) - 1) / (1 - a);
  return [a * ta * K[0], (2 * th - 1) * a * ta * (K[1] - corr)];
}
/** Density of that stable law at the points xs, by Fourier inversion (substitution t = u^p tames slow decay when α < 1). */
function stableDensity(M, a, th, xs) {
  const K = stableK(M, a), c = -a * K[0], p = Math.max(1, 1 / a), U = Math.pow(32 / c, 1 / (a * p)), N = 3000, h = U / N;
  const ts = new Float64Array(N + 1), w = new Float64Array(N + 1), re = new Float64Array(N + 1), ph = new Float64Array(N + 1);
  for (let i = 0; i <= N; i++) { const u = i * h, t = Math.pow(u, p); ts[i] = t; const jac = p === 1 ? 1 : u === 0 ? 0 : p * Math.pow(u, p - 1); w[i] = ((i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * h * jac) / 3; if (t > 0) { const L = stableLogPsi(K, a, th, t); re[i] = Math.exp(L[0]); ph[i] = L[1]; } else { re[i] = 1; ph[i] = 0; } }
  return xs.map((x) => { let s = 0; for (let i = 0; i <= N; i++) s += w[i] * re[i] * Math.cos(ph[i] - ts[i] * x); return Math.max(0, s / Math.PI); });
}
/** Symmetric α-stable with ch.f. exp(−|t|^α): Chambers–Mallows–Stuck sampler and density by inversion. */
function sampleSymStable(r, a) { const V = Math.PI * (r() - 0.5), W = -Math.log(1 - r()); if (Math.abs(a - 1) < 1e-9) return Math.tan(V); return (Math.sin(a * V) / Math.pow(Math.cos(V), 1 / a)) * Math.pow(Math.cos(V - a * V) / W, (1 - a) / a); }
function symStableDensity(a, xs) {
  const p = Math.max(1, 1 / a), U = Math.pow(34, 1 / (a * p)), N = 2400, h = U / N;
  const ts = [], w = [];
  for (let i = 0; i <= N; i++) { const u = i * h, t = Math.pow(u, p), jac = p === 1 ? 1 : u === 0 ? 0 : p * Math.pow(u, p - 1); ts.push(t); w.push(((i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * h * jac * Math.exp(-Math.pow(t, a))) / 3); }
  return xs.map((x) => { let s = 0; for (let i = 0; i <= N; i++) s += w[i] * Math.cos(ts[i] * x); return Math.max(0, s / Math.PI); });
}
/** Sine integral Si(x). */
function Si(x) {
  const ax = Math.abs(x); let s;
  if (ax <= 20) { let term = ax; s = ax; const x2 = ax * ax; for (let k = 1; k < 90; k++) { term *= -x2 / ((2 * k) * (2 * k + 1)); const add = term / (2 * k + 1); s += add; if (Math.abs(add) < 1e-17) break; } }
  else { const x2 = ax * ax; let f = 0, g = 0, t = 1; for (let k = 0; k < 8; k++) { f += t; t *= -(2 * k + 1) * (2 * k + 2) / x2; } t = 1; for (let k = 0; k < 8; k++) { g += t; t *= -(2 * k + 2) * (2 * k + 3) / x2; } s = Math.PI / 2 - (f / ax) * Math.cos(ax) - (g / x2) * Math.sin(ax); }
  return x < 0 ? -s : s;
}
// ----- 2-D helpers
/** Eigen-decomposition of a symmetric 2×2 [[a, b], [b, c]]: [λ1 ≥ λ2, angle of the first axis]. */
function eig2s(a, b, c) { const m = (a + c) / 2, d = Math.sqrt(((a - c) / 2) ** 2 + b * b); return [m + d, Math.max(0, m - d), 0.5 * Math.atan2(2 * b, a - c)]; }
/** k-sigma ellipse of a covariance matrix [[a, b], [b, c]] centred at (x0, y0). */
function ellipse(S, x0, y0, a, b, c, k, st) { const [l1, l2, th] = eig2s(a, b, c), u = [Math.cos(th), Math.sin(th)], w = [-Math.sin(th), Math.cos(th)]; S.curve((s) => [x0 + k * (Math.sqrt(l1) * Math.cos(s) * u[0] + Math.sqrt(l2) * Math.sin(s) * w[0]), y0 + k * (Math.sqrt(l1) * Math.cos(s) * u[1] + Math.sqrt(l2) * Math.sin(s) * w[1])], 0, 2 * Math.PI, { n: 120, ...st }); }
function sampleCov(P) { let mx = 0, my = 0; P.forEach(([x, y]) => { mx += x; my += y; }); mx /= P.length; my /= P.length; let a = 0, b = 0, c = 0; P.forEach(([x, y]) => { a += (x - mx) ** 2; b += (x - mx) * (y - my); c += (y - my) ** 2; }); const n = P.length - 1; return { mx, my, a: a / n, b: b / n, c: c / n }; }
/** Modified Bessel I0 by its power series. */
function besselI0(z) { let s = 1, t = 1; const q = (z * z) / 4; for (let k = 1; k < 200; k++) { t *= q / (k * k); s += t; if (t < 1e-16 * s) break; } return s; }

export default {
  collection: 'prob',
  chapter: 3,
  items: [
    // ======================================================================== §3.8 stable laws
    {
      num: '3.8.1',
      kind: 'Lemma',
      name: 'Diagonal choice of εₙ → 0',
      statement: String.raw`If $h_n(\eps)\to g(\eps)$ as $n\to\infty$ for each $\eps>0$, and $g(\eps)\to g(0)$ as $\eps\to0$, then there are $\eps_n\to0$ with $h_n(\eps_n)\to g(0)$.`,
      idea: String.raw`As in 3.4.15: pick $N_m$ increasing with $|h_n(1/m)-g(1/m)|\le1/m$ for $n\ge N_m$, and set $\eps_n=1/m$ on $[N_m,N_{m+1})$. Then $|h_n(\eps_n)-g(0)|\le1/m+|g(1/m)-g(0)|\to0$. In the proof of 3.8.2, $h_n(\eps)$ is the characteristic function of the sum of the terms larger than $\eps a_n$, and $g(\eps)$ its compound-Poisson limit.`,
      caption: String.raw`A model family: $h_n(\eps)=g(\eps)(1-e^{-n\eps^2})$ with $g(\eps)=1-\eps$, so $h_n(\eps)\to g(\eps)$ for fixed $\eps$ but not uniformly. Left: the error $|h_n(\eps)-g(0)|$ over the $(n,\eps)$ plane on log axes; the valley of small error is where $\eps$ is small but $n\eps^2$ large. The diagonal staircase $\eps_n$ (gold) walks down the valley; the path $\eps_n=c/\sqrt n$ (red) goes to $0$ too fast and stays on the slope. Right: the errors along both paths.`,
      deps: [],
      see: ['prob-3.4.15'],
      tags: ['analysis'],
      viz(v) {
        const cS = v.slider('too-fast path $c$', 0.2, 2.5, 1, { step: 0.05 });
        const g = (e) => 1 - e, h = (n, e) => g(e) * (1 - Math.exp(-n * e * e)), err = (n, e) => Math.abs(h(n, e) - g(0));
        const L = v.stage({ x: [0, 8], y: [-4, 0], height: 340, weight: 1.2, axes: 'box', gutter: true, xlabel: '$\\log_{10}n$', ylabel: '$\\log_{10}\\eps$', title: '$|h_n(\\eps)-g(0)|$' });
        const R = v.stage({ x: [1, 1e8], xlog: true, y: [1e-3, 1.5], ylog: true, height: 340, axes: 'box', gutter: true, xlabel: '$n$', title: 'error along the paths' });
        // thresholds N_m: g(1/m) e^{−n/m²} ≤ 1/m  ⇔  n ≥ m² log(m g(1/m))
        const Nm = []; for (let m = 1; m <= 400; m++) { const t = m * g(1 / m); Nm.push(t <= 1 ? 1 : Math.ceil(m * m * Math.log(t))); }
        for (let m = 1; m < Nm.length; m++) Nm[m] = Math.max(Nm[m], Nm[m - 1]);
        const epsDiag = (n) => { let m = 1; while (m < Nm.length && Nm[m] <= n) m++; return 1 / m; };
        let st = null;
        v.render(() => {
          const c = cS.value;
          L.heat((x, y) => Math.log10(Math.max(1e-4, err(10 ** x, 10 ** y))), { range: [-3.2, 0], cmap: 'theme', key: 'err', res: 3 });
          L.axes();
          const stair = [], fast = [], e1 = [], e2 = [];
          for (let i = 0; i <= 400; i++) { const lx = (8 * i) / 400, n = 10 ** lx, ed = epsDiag(n), ef = Math.min(1, c / Math.sqrt(n)); stair.push([lx, Math.log10(ed)]); fast.push([lx, Math.log10(ef)]); e1.push([n, Math.max(1e-3, err(n, ed))]); e2.push([n, Math.max(1e-3, err(n, ef))]); }
          L.path(stair, { color: 'gold', width: 2.6 });
          L.path(fast, { color: 'red', width: 2.2, dash: [6, 4] });
          L.colorbar([-3.2, 0], (u) => v.ramp(u), { pos: 'right', length: 0.45, label: 'log₁₀ error' });
          R.path(e1, { color: 'gold', width: 2.4 });
          R.path(e2, { color: 'red', width: 2, dash: [6, 4] });
          R.hline(Math.exp(-c * c), { color: 'muted', width: 1, dash: [2, 3] });
          v.legend([['gold', 'diagonal $\\eps_n$ (Lemma 3.8.1)'], ['red', '$\\eps_n=c/\\sqrt n$', { dash: true }], ['muted', '$e^{-c^2}$', { dash: true }]]);
          st = { ed: epsDiag(1e8), e1: err(1e8, epsDiag(1e8)), e2: err(1e8, Math.min(1, c / 1e4)), c };
        });
        v.readout(() => st && `At $n=10^8$: diagonal $\\eps_n=1/${Math.round(1 / st.ed)}$ gives $|h_n(\\eps_n)-g(0)|=${v.fix(st.e1, 4)}$; the fast path gives $${v.fix(st.e2, 4)}\\approx e^{-c^2}=${v.fix(Math.exp(-st.c * st.c), 4)}$, which never goes away.`);
      },
    },
    {
      num: '3.8.2',
      kind: 'Theorem',
      name: 'Convergence to stable laws (heavy tails)',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. with
(i) $P(X_1>x)/P(|X_1|>x)\to\theta\in[0,1]$ as $x\to\infty$, and
(ii) $P(|X_1|>x)=x^{-\alpha}L(x)$ with $0<\alpha<2$ and $L$ slowly varying ($L(tx)/L(x)\to1$ for all $t>0$).
Put $a_n=\inf\{x:P(|X_1|>x)\le1/n\}$ and $b_n=nE(X_11(|X_1|\le a_n))$. Then $(S_n-b_n)/a_n\Rightarrow Y$, a nondegenerate law with characteristic function
$$\exp\big(itc-b|t|^\alpha\{1+i\kappa\operatorname{sgn}(t)w_\alpha(t)\}\big),\quad\kappa=2\theta-1,\ w_\alpha(t)=\tan(\pi\alpha/2)\ (\alpha\ne1),\ \tfrac2\pi\log|t|\ (\alpha=1).$$`,
      idea: String.raw`The rescaled points $\{X_m/a_n\}$ converge to a Poisson process with mean measure $\theta\alpha x^{-\alpha-1}dx$ on $(0,\infty)$ and $(1-\theta)\alpha|x|^{-\alpha-1}dx$ on $(-\infty,0)$ (3.6.1, via $nP(X_1>xa_n)\to\theta x^{-\alpha}$). Split the sum at $\eps a_n$: the big terms form a compound Poisson sum with an explicit characteristic function, while the centred small terms have second moment at most $C\eps^{2-\alpha}$ (Lemma 3.8.3 justifies the limit). Lemma 3.8.1 lets $\eps\to0$ along with $n$, and the converging-together lemma assembles the limit.`,
      caption: String.raw`Pareto-type steps: $P(X>x)=\theta x^{-\alpha}$, $P(X<-x)=(1-\theta)x^{-\alpha}$ for $x\ge1$, so $a_n=n^{1/\alpha}$. Left: 3000 seeded values of $(S_n-b_n)/a_n$ against the limit density, computed by numerically inverting its characteristic function. The tail-balance slider $\theta$ skews the law; $\theta=\frac12$ is symmetric. Right: the empirical tails $P(Y>y)$ (accent) and $P(Y<-y)$ (orange) on log axes, against $\theta y^{-\alpha}$ and $(1-\theta)y^{-\alpha}$. (Convergence slows as $\alpha\to2$, where the small jumps take over.)`,
      deps: ['prob-3.3.17', 'prob-3.8.1', 'prob-3.8.3', 'prob-3.6.1'],
      tags: ['stable laws', 'heavy tails'],
      credit: 'Lévy 1925; Gnedenko & Kolmogorov 1949',
      viz(v) {
        const M = v.M;
        const aS = v.slider('$\\alpha$', 0.4, 1.7, 1.2, { step: 0.05 });
        const tS = v.slider('$\\theta$', 0, 1, 0.75, { step: 0.05 });
        const nS = v.slider('$n$', 10, 2000, 400, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-6, 8], y: [0, 0.5], height: 320, weight: 1.25, axes: 'box', gutter: true, xlabel: '$(S_n-b_n)/a_n$', title: 'normalized sums vs the stable limit' });
        const R = v.stage({ x: [0.5, 200], xlog: true, y: [1e-4, 1], ylog: true, height: 320, axes: 'box', gutter: true, xlabel: '$y$', title: 'tails of the limit' });
        let dc = null, sm = null, st = null;
        v.render(() => {
          const a = aS.value, th = tS.value, n = nS.value, an = Math.pow(n, 1 / a);
          const bn = Math.abs(a - 1) < 1e-9 ? n * (2 * th - 1) * Math.log(an) : (n * (2 * th - 1) * a * (Math.pow(an, 1 - a) - 1)) / (1 - a);
          const xs = Array.from({ length: 141 }, (_, i) => -6 + (14 * i) / 140);
          if (!dc || dc.a !== a || dc.th !== th) dc = { a, th, d: stableDensity(M, a, th, xs) };
          if (!sm || sm.a !== a || sm.th !== th || sm.n !== n || sm.seed !== seed) {
            const r = v.rng(seed * 61 + 7), ys = new Float64Array(3000), ia = -1 / a;
            for (let i = 0; i < ys.length; i++) { let s = 0; for (let j = 0; j < n; j++) { const x = Math.pow(1 - r(), ia); s += r() < th ? x : -x; } ys[i] = (s - bn) / an; }
            sm = { a, th, n, seed, ys };
          }
          const H = M.histogram(Array.from(sm.ys), { bins: Array.from({ length: 71 }, (_, i) => -6 + (14 * i) / 70) });
          const dens = { edges: H.edges, counts: H.counts, density: H.counts.map((c) => c / (sm.ys.length * 0.2)) };
          L.setView(null, [0, Math.max(...dens.density, ...dc.d) * 1.15]);
          L.hist(dens, { density: true, color: 'gold', fillAlpha: 0.3, width: 1 });
          L.path(xs.map((x, i) => [x, dc.d[i]]), { color: 'accent', width: 2.4 });
          const ys = Array.from(sm.ys), N = ys.length, gr = logGrid(1, 400, 50).map((k) => 0.5 * Math.pow(400, (k - 1) / 399));
          const right = [], left = []; for (const y of gr) { const pr = ys.filter((x) => x > y).length / N, pl = ys.filter((x) => x < -y).length / N; if (pr > 0) right.push([y, pr]); if (pl > 0) left.push([y, pl]); }
          if (th > 0) R.fn((y) => th * Math.pow(y, -a), { color: 'accent', width: 1.4, dash: [6, 4] });
          if (th < 1) R.fn((y) => (1 - th) * Math.pow(y, -a), { color: 'orange', width: 1.4, dash: [6, 4] });
          R.path(right, { color: 'accent', width: 2.2 }); R.path(left, { color: 'orange', width: 2.2 });
          v.legend([['gold', 'seeded sample', { area: true }], ['accent', 'limit density; $P(Y>y)$'], ['orange', '$P(Y<-y)$'], ['muted', '$\\theta y^{-\\alpha}$, $(1-\\theta)y^{-\\alpha}$', { dash: true }]]);
          const inWin = ys.filter((x) => x > -6 && x < 8).length / N;
          st = { a, th, out: 1 - inWin, kappa: 2 * th - 1, b: -a * stableK(M, a)[0] };
        });
        v.readout(() => st && `$\\alpha=${v.fix(st.a, 2)}$, skewness parameter $\\kappa=2\\theta-1=${v.fix(st.kappa, 2)}$, scale $b=${v.fix(st.b, 3)}$ in $\\exp(-b|t|^\\alpha\\cdots)$. ${v.fix(100 * st.out, 1)}% of the sample lies outside the window (heavy tails).`);
      },
    },
    {
      num: '3.8.3',
      kind: 'Lemma',
      name: 'Uniform bound for regularly varying tails',
      statement: String.raw`If $P(|X_1|>x)=x^{-\alpha}L(x)$ with $L$ slowly varying, then for every $\delta>0$ there are $C<\infty$ and $t_0$ such that
$$\frac{P(|X_1|>yt)}{P(|X_1|>t)}\le Cy^{-\alpha-\delta}\qquad\text{for all }t\ge t_0,\ 0<y\le1.$$`,
      idea: String.raw`Regular variation gives $P(|X|>t/2)/P(|X|>t)\to2^\alpha$, so for $t\ge t_0$ the ratio is at most $2^{\alpha+\delta}$. Halving $t$ repeatedly, as long as one stays above $t_0$, multiplies the bound by $2^{\alpha+\delta}$ each time, i.e. by about $y^{-\alpha-\delta}$ after reaching $yt$; below $t_0$ the crude bound $1/P(|X|>t_0)$ takes over. The extra $\delta$ absorbs the slowly varying factor, which may grow like any power of $\log$; with $\delta=0$ the bound can fail.`,
      caption: String.raw`Tail $P(|X|>x)=x^{-\alpha}(\log(e+x)/\log(e+1))^\kappa$ for $x\ge1$, so $L$ is a power of a logarithm. Left: the ratio $P(|X|>yt)/P(|X|>t)$ against $y$ for $t=10^2,10^3,\dots,10^8$ (log axes), with $y^{-\alpha}$ (dashed) and the bound $Cy^{-\alpha-\delta}$ (red), $C$ the smallest constant that works for $t\le10^8$. Right: $\sup_{y\le1}y^{\alpha+\delta}\times$ratio as $t$ grows: bounded for $\delta>0$; for $\delta=0$ and $\kappa<0$ it creeps up without bound.`,
      deps: [],
      see: ['prob-3.8.2'],
      tags: ['stable laws', 'estimates'],
      viz(v) {
        const aS = v.slider('$\\alpha$', 0.5, 1.9, 1.2, { step: 0.05 });
        const kS = v.slider('$\\kappa$ (power of log)', -2, 1, -1.5, { step: 0.1 });
        const dS = v.slider('$\\delta$', 0, 0.5, 0.15, { step: 0.01 });
        const L = v.stage({ x: [1e-9, 1], xlog: true, y: [1, 1e18], ylog: true, height: 330, weight: 1.15, axes: 'box', gutter: true, xlabel: '$y$', title: 'ratios $P(|X|>yt)/P(|X|>t)$' });
        const R = v.stage({ x: [1e2, 1e16], xlog: true, y: [0.1, 1000], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: '$t$', title: '$\\sup_{y\\le1}\\,y^{\\alpha+\\delta}\\,P(|X|>yt)/P(|X|>t)$' });
        let st = null;
        v.render(() => {
          const a = aS.value, k = kS.value, d = dS.value, L1 = Math.log(Math.E + 1) ** k;
          const G = (x) => (x <= 1 ? 1 : Math.min(1, (Math.pow(x, -a) * Math.log(Math.E + x) ** k) / L1));
          const ratio = (t, y) => G(y * t) / G(t);
          const supC = (t) => { let s = 0; for (let i = 0; i <= 300; i++) { const y = Math.pow(10, -Math.log10(t) - 1 + ((Math.log10(t) + 1) * i) / 300); s = Math.max(s, ratio(t, y) * Math.pow(y, a + d)); } return s; };
          const ts = [1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8];
          const C = Math.max(...ts.map(supC));
          ts.forEach((t, j) => L.fn((y) => ratio(t, y), { color: 'accent', width: 1.4, alpha: 0.35 + 0.09 * j, n: 300 }));
          L.fn((y) => Math.pow(y, -a), { color: 'muted', width: 1.3, dash: [6, 4] });
          L.fn((y) => C * Math.pow(y, -a - d), { color: 'red', width: 2 });
          const tg = []; for (let i = 0; i <= 70; i++) { const t = Math.pow(10, 2 + (14 * i) / 70); tg.push([t, supC(t)]); }
          R.path(tg, { color: d > 0 ? 'green' : 'red', width: 2.4 });
          R.vline(1e8, { color: 'muted', width: 1, dash: [3, 3] });
          v.legend([['accent', 'ratio for $t=10^2,\\dots,10^8$'], ['muted', '$y^{-\\alpha}$', { dash: true }], ['red', '$Cy^{-\\alpha-\\delta}$'], [d > 0 ? 'green' : 'red', 'sup as $t$ grows']]);
          st = { C, s8: supC(1e8), s16: supC(1e16), d, k };
        });
        v.readout(() => st && `$C=${v.fix(st.C, 3)}$ works for $10^2\\le t\\le10^8$. The sup at $t=10^8$ is $${v.fix(st.s8, 3)}$, at $t=10^{16}$ it is $${v.fix(st.s16, 3)}$` + (st.d === 0 && st.k < 0 ? ' — with $\\delta=0$ no constant works for all $t$.' : '.'));
      },
    },
    {
      num: '3.8.3a',
      kind: 'Definition',
      name: 'Stable law',
      verify: true,
      statement: String.raw`A random variable $Y$ has a **stable law** if for every integer $k>0$ there are constants $a_k>0$ and $b_k$ such that, for i.i.d. copies $Y_1,\dots,Y_k$ of $Y$,
$$\frac{Y_1+\dots+Y_k-b_k}{a_k}\overset d=Y.$$
Necessarily $a_k=k^{1/\alpha}$ for an index $\alpha\in(0,2]$ (Exercise 3.8.5); $\alpha=2$ is the normal law, $\alpha=1$ with symmetry the Cauchy law.`,
      idea: String.raw`Stability says the shape of the law survives summation; only location and scale change. In terms of characteristic functions, $\varphi(t)^k=e^{itb_k}\varphi(a_kt)$. For the symmetric laws $\varphi(t)=e^{-|t|^\alpha}$, $\varphi(t)^k=e^{-k|t|^\alpha}=\varphi(k^{1/\alpha}t)$, so $a_k=k^{1/\alpha}$ and $b_k=0$. A uniform law fails: a sum of two uniforms is triangular.`,
      caption: String.raw`Pick a law and $k$. Left: the histogram of $Y$ (accent) and of $(Y_1+\dots+Y_k)/k^{1/\alpha}$ (orange outline), 6000 seeded values each, with the exact symmetric stable density (green, computed by inverting $e^{-|t|^\alpha}$). Right: a quantile–quantile plot of the scaled sum against $Y$; stability means the points sit on the diagonal. The uniform law (with the normal scaling $\sqrt k$) bends away from it, and so does a Pareto law, which is only in a domain of attraction.`,
      deps: ['prob-3.3.1a'],
      tags: ['stable laws'],
      viz(v) {
        const M = v.M;
        const law = v.select('law', [{ value: 'stab', label: 'symmetric $\\alpha$-stable' }, { value: 'unif', label: 'uniform' }, { value: 'par', label: 'Pareto, $\\alpha$ tails' }], 'stab');
        const aS = v.slider('$\\alpha$', 0.6, 2, 1.3, { step: 0.05 });
        const kS = v.slider('$k$ copies', 2, 10, 2, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-6, 6], y: [0, 0.5], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$y$', title: '$Y$ and $(Y_1+\\dots+Y_k)/k^{1/\\alpha}$' });
        const R = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, height: 320, axes: 'box', gutter: true, xlabel: 'quantiles of $Y$', ylabel: 'scaled sum', title: 'Q–Q plot' });
        let dc = null, st = null;
        v.render(() => {
          const md = law.value, a = md === 'unif' ? 2 : aS.value, k = kS.value, r = v.rng(seed * 67 + 3);
          aS.el.hidden = md === 'unif';
          const draw = md === 'stab' ? () => sampleSymStable(r, a) : md === 'unif' ? () => Math.sqrt(3) * (2 * r() - 1) : () => (r() < 0.5 ? 1 : -1) * (Math.pow(1 - r(), -1 / a) - 1);
          const Y = [], S = [], sc = Math.pow(k, 1 / a);
          for (let i = 0; i < 6000; i++) { Y.push(draw()); let s = 0; for (let j = 0; j < k; j++) s += draw(); S.push(s / sc); }
          const xs = Array.from({ length: 121 }, (_, i) => -6 + (12 * i) / 120);
          if (md === 'stab' && (!dc || dc.a !== a)) dc = { a, d: symStableDensity(a, xs) };
          const edges = Array.from({ length: 61 }, (_, i) => -6 + (12 * i) / 60), HY = M.histogram(Y, { bins: edges }), HS = M.histogram(S, { bins: edges });
          const dn = (H) => ({ edges: H.edges, counts: H.counts, density: H.counts.map((c) => c / (6000 * 0.2)) });
          const dY = dn(HY), dS = dn(HS);
          L.setView(null, [0, Math.max(...dY.density, ...dS.density) * 1.15]);
          L.hist(dY, { density: true, color: 'accent', fillAlpha: 0.3, width: 1 });
          L.hist(dS, { density: true, color: 'orange', fillAlpha: 0, width: 2 });
          if (md === 'stab') L.path(xs.map((x, i) => [x, dc.d[i]]), { color: 'green', width: 2, dash: [6, 4] });
          const qs = Array.from({ length: 99 }, (_, i) => 0.01 * (i + 1)), qY = M.quantile(Y, qs), qS = M.quantile(S, qs);
          R.line(-4, -4, 4, 4, { color: 'green', width: 1.5, dash: [5, 4] });
          qY.forEach((q, i) => R.dot(q, qS[i], { r: 3, color: 'purple' }));
          v.legend([['accent', '$Y$', { area: true }], ['orange', 'scaled sum'], ...(md === 'stab' ? [['green', 'stable density', { dash: true }]] : []), ['purple', 'quantile pairs', { dot: true }]]);
          st = { ks: ks2(Y, S), md, a, k };
        });
        v.readout(() => st && `Two-sample Kolmogorov distance between $Y$ and $(Y_1+\\dots+Y_${st.k})/${st.k}^{1/${v.fix(st.a, 2)}}$: $${v.fix(st.ks, 4)}$ (noise level $\\approx0.025$) — ` + (st.md === 'stab' ? 'the same law: stable.' : 'the law changed: not stable.'));
      },
    },
    {
      num: '3.8.8',
      kind: 'Theorem',
      name: 'Stable laws are the limits of normalized i.i.d. sums',
      statement: String.raw`$Y$ is the weak limit of $(X_1+\dots+X_k-b_k)/a_k$ for some i.i.d. sequence $X_i$ and constants $a_k>0$, $b_k$, if and only if $Y$ has a stable law. (Nondegenerate limits are meant; with 3.8.2 and its converse, these are exactly the laws with characteristic functions (3.8.11), together with the normal laws.)`,
      idea: String.raw`A stable $Y$ is its own limit. Conversely, let $Z_n=(S_n-b_n)/a_n\Rightarrow Y$ and cut $S_{nk}$ into $k$ blocks of length $n$. Then
$$\frac{a_{nk}}{a_n}Z_{nk}-\frac{kb_n-b_{nk}}{a_n}=\sum_{j=1}^k\frac{S_n^{(j)}-b_n}{a_n},$$
whose right side converges to $Y_1+\dots+Y_k$ with i.i.d. $Y_j\sim Y$, while $Z_{nk}\Rightarrow Y$. The convergence of types theorem (3.8.9) forces the affine maps to converge, so $Y_1+\dots+Y_k\overset d=\alpha_kY+\beta_k$: $Y$ is stable.`,
      caption: String.raw`Choose a step law. Left: 2000 seeded values of $Z_n=(S_n-b_n)/a_n$ (accent; approximately the limit $Y$) and of the sum of $k$ independent copies, rescaled by $a_{nk}/a_n$ and recentred as in the proof (orange outline). They agree, so the limit reproduces itself under summation. Right: for $k=2,\dots,6$, the Kolmogorov distance between the two samples with the correct exponent $a_{nk}/a_n=k^{1/\alpha}$ (green) and with the normal exponent $\sqrt k$ (red): only the right index passes the test for heavy tails.`,
      deps: ['prob-3.8.2', 'prob-3.8.3a', 'prob-3.8.9'],
      see: ['prob-3.8.9'],
      tags: ['stable laws'],
      viz(v) {
        const M = v.M;
        const LAWS = {
          p15: { label: 'Pareto $\\alpha=1.5$, symmetric', a: 1.5, th: 0.5 },
          p07: { label: 'Pareto $\\alpha=0.7$, one-sided', a: 0.7, th: 1 },
          p12: { label: 'Pareto $\\alpha=1.2$, skewed', a: 1.2, th: 0.8 },
          expo: { label: 'exponential (normal limit)', a: 2 },
        };
        const law = v.select('steps', Object.keys(LAWS).map((k) => ({ value: k, label: LAWS[k].label })), 'p15');
        const kS = v.slider('$k$ blocks', 2, 6, 3, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const n = 200;
        const L = v.stage({ x: [-6, 6], y: [0, 0.5], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$z$', title: '$Z_n$ and the rescaled sum of $k$ copies' });
        const R = v.stage({ x: [1.4, 6.6], y: [0, 0.4], height: 320, axes: 'box', gutter: true, xlabel: '$k$', title: 'stability test' });
        const norm = (Lw, m) => { if (Lw.a === 2) return { a: Math.sqrt(m), b: m }; const a = Math.pow(m, 1 / Lw.a); return { a, b: Math.abs(Lw.a - 1) < 1e-9 ? m * (2 * Lw.th - 1) * Math.log(a) : (m * (2 * Lw.th - 1) * Lw.a * (Math.pow(a, 1 - Lw.a) - 1)) / (1 - Lw.a) }; };
        let sim = null, st = null;
        v.render(() => {
          const Lw = LAWS[law.value], k = kS.value;
          if (!sim || sim.key !== law.value || sim.seed !== seed) {
            const r = v.rng(seed * 71 + 5), step = Lw.a === 2 ? () => sampleExp(r) : () => { const x = Math.pow(1 - r(), -1 / Lw.a); return r() < Lw.th ? x : -x; };
            const { a, b } = norm(Lw, n), Z = []; for (let i = 0; i < 2000 * 7; i++) { let s = 0; for (let j = 0; j < n; j++) s += step(); Z.push((s - b) / a); }
            sim = { key: law.value, seed, Z };
          }
          const Z0 = sim.Z.slice(0, 2000);
          const test = (kk, expo) => { const { a: an, b: bn } = norm(Lw, n), { a: ank, b: bnk } = norm(Lw, n * kk), alpha = expo === 'right' ? ank / an : Math.sqrt(kk); const out = []; for (let i = 0; i < 2000; i++) { let s = 0; for (let j = 0; j < kk; j++) s += sim.Z[2000 * (1 + j) + i]; out.push((s - (bnk - kk * bn) / an) / alpha); } return out; };
          const Sk = test(k, 'right');
          const edges = Array.from({ length: 61 }, (_, i) => -6 + (12 * i) / 60), dn = (xs) => { const H = M.histogram(xs, { bins: edges }); return { edges, counts: H.counts, density: H.counts.map((c) => c / (2000 * 0.2)) }; };
          const d0 = dn(Z0), d1 = dn(Sk);
          L.setView(null, [0, Math.max(...d0.density, ...d1.density) * 1.15]);
          L.hist(d0, { density: true, color: 'accent', fillAlpha: 0.3, width: 1 });
          L.hist(d1, { density: true, color: 'orange', fillAlpha: 0, width: 2 });
          const good = [], bad = []; for (let kk = 2; kk <= 6; kk++) { good.push(ks2(Z0, test(kk, 'right'))); bad.push(ks2(Z0, test(kk, 'normal'))); }
          R.setView(null, [0, Math.max(0.1, ...bad, ...good) * 1.2]);
          R.hband(0, 0.043, { color: 'muted', alpha: 0.12 });
          for (let kk = 2; kk <= 6; kk++) { R.rect(kk - 0.32, 0, kk - 0.02, good[kk - 2], { fill: 'green', fillAlpha: 0.75, stroke: false }); R.rect(kk + 0.02, 0, kk + 0.32, bad[kk - 2], { fill: 'red', fillAlpha: 0.75, stroke: false }); }
          R.vline(k, { color: 'gold', width: 1, dash: [3, 3] });
          v.legend([['accent', '$Z_n$', { area: true }], ['orange', 'rescaled sum of $k$ copies'], ['green', 'exponent $1/\\alpha$', { area: true }], ['red', 'exponent $1/2$', { area: true }], ['muted', 'noise level', { area: true }]]);
          st = { a: Lw.a, k, g: good[k - 2], b: bad[k - 2] };
        });
        v.readout(() => st && `$n=${n}$, index $\\alpha=${st.a}$: with $a_{nk}/a_n=k^{1/\\alpha}=${v.fix(Math.pow(st.k, 1 / st.a), 3)}$ the distance is $${v.fix(st.g, 3)}$; with $\\sqrt k$ it is $${v.fix(st.b, 3)}$.`);
      },
    },
    {
      num: '3.8.9',
      kind: 'Theorem',
      name: 'Convergence of types',
      statement: String.raw`If $W_n\Rightarrow W$ and there are constants $\alpha_n>0$, $\beta_n$ with $W'_n=\alpha_nW_n+\beta_n\Rightarrow W'$, where $W$ and $W'$ are nondegenerate, then there are $\alpha\in(0,\infty)$ and $\beta$ with $\alpha_n\to\alpha$ and $\beta_n\to\beta$ (and $W'\overset d=\alpha W+\beta$).`,
      idea: String.raw`Work with characteristic functions: $\psi_n(t)=e^{it\beta_n}\varphi_n(\alpha_nt)$. If $\alpha_n\to0$ along a subsequence, then $|\psi_n(t)|=|\varphi_n(\alpha_nt)|\to1$ by uniform convergence near $0$, so $|\psi|\equiv1$ and $W'$ would be degenerate (3.5.2); symmetrically $\alpha_n\to\infty$ is impossible. Two different subsequential limits $\alpha'<\alpha$ would give $|\varphi(u)|=|\varphi(u\alpha'/\alpha)|=\dots\to1$, again degenerate. Finally $e^{it\beta_n}=\psi_n(t)/\varphi_n(\alpha_nt)$ converges near $0$, which pins down $\beta_n$.`,
      caption: String.raw`$W_n=(\Gamma_n-n)/\sqrt n$ with $\Gamma_n$ a gamma$(n)$ variable, computed exactly ($W_n\Rightarrow\chi$). Choose the affine maps. Left: distribution functions of $W'_n=\alpha_nW_n+\beta_n$ for $n=2,4,8,\dots,1024$ (darker = larger $n$). Right: $|\psi_n(t)|=|\varphi_n(\alpha_nt)|$. Converging constants give a nondegenerate limit; oscillating $\alpha_n$ leaves two candidate limits; $\alpha_n\to0$ flattens $|\psi_n|$ to $1$ (a degenerate limit); drifting $\beta_n$ pushes the mass away.`,
      deps: ['prob-3.3.17', 'prob-3.5.2'],
      tags: ['weak convergence'],
      viz(v) {
        const M = v.M;
        const MODES = {
          conv: { label: '$\\alpha_n\\to2,\\ \\beta_n\\to1$', a: (n) => 2 + 2 / Math.sqrt(n), b: (n) => 1 - 3 / n },
          osc: { label: '$\\alpha_n=1+\\frac12(-1)^{\\log_2n}$', a: (n) => 1 + 0.5 * (Math.round(Math.log2(n)) % 2 ? -1 : 1), b: () => 0 },
          zero: { label: '$\\alpha_n=4/\\sqrt n$', a: (n) => 4 / Math.sqrt(n), b: () => 0.5 },
          drift: { label: '$\\beta_n=\\log n$', a: () => 1, b: (n) => Math.log(n) / 2 },
        };
        const mode = v.select('constants', Object.keys(MODES).map((k) => ({ value: k, label: MODES[k].label })), 'conv');
        const L = v.stage({ x: [-6, 6], y: [0, 1], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$x$', title: '$P(W_n\'\\le x)$' });
        const R = v.stage({ x: [0, 6], y: [0, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$t$', title: '$|\\psi_n(t)|=|\\varphi_n(\\alpha_nt)|$' });
        let st = null;
        v.render(() => {
          const Md = MODES[mode.value], ns = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
          ns.forEach((n, j) => {
            const a = Md.a(n), b = Md.b(n), sn = Math.sqrt(n), col = v.mix('faint', 'accent', 0.15 + (0.85 * j) / (ns.length - 1));
            L.fn((x) => M.gammaP(n, n + (sn * (x - b)) / a), { color: col, width: j === ns.length - 1 ? 2.4 : 1.4, n: 240 });
            R.fn((t) => Math.pow(1 + (a * a * t * t) / n, -n / 2), { color: col, width: j === ns.length - 1 ? 2.4 : 1.4 });
          });
          v.legend([['accent', 'larger $n$'], ['faint', 'smaller $n$']]);
          const last = ns[ns.length - 1], prev = ns[ns.length - 2];
          let d = 0; for (let i = 0; i <= 200; i++) { const x = -6 + (12 * i) / 200; d = Math.max(d, Math.abs(M.gammaP(last, last + (Math.sqrt(last) * (x - Md.b(last))) / Md.a(last)) - M.gammaP(prev, prev + (Math.sqrt(prev) * (x - Md.b(prev))) / Md.a(prev)))); }
          st = { a: Md.a(last), b: Md.b(last), a2: Md.a(prev), b2: Md.b(prev), d };
        });
        v.readout(() => st && `$\\alpha_{512}=${v.fix(st.a2, 3)}$, $\\beta_{512}=${v.fix(st.b2, 3)}$; $\\ \\alpha_{1024}=${v.fix(st.a, 3)}$, $\\beta_{1024}=${v.fix(st.b, 3)}$. Sup distance between the last two distribution functions: $${v.fix(st.d, 4)}$ ${st.d < 0.02 ? '(settling down)' : '(not converging to a nondegenerate law)'}.`);
      },
    },
    // ======================================================================== §3.9 infinitely divisible distributions
    {
      num: '3.9.1a',
      kind: 'Definition',
      name: 'Infinitely divisible distribution',
      verify: true,
      statement: String.raw`A random variable $Z$ (or its law) is **infinitely divisible** if for every $n$ there are i.i.d. $Y_{n,1},\dots,Y_{n,n}$ with $Z\overset d=Y_{n,1}+\dots+Y_{n,n}$; equivalently its characteristic function has an $n$-th root that is again a characteristic function, for every $n$.`,
      idea: String.raw`Normal, Poisson, gamma, Cauchy and all stable and compound Poisson laws qualify: Poisson$(\lambda)$ is the sum of $n$ Poisson$(\lambda/n)$, gamma$(k)$ of $n$ gamma$(k/n)$. An infinitely divisible characteristic function never vanishes (Exercise 3.9.3): $|\varphi|^{2/n}$ is a characteristic function tending to $1(\varphi\ne0)$, which must be continuous. So a uniform law ($\varphi(t)=\sin t/t$) or any bounded nonconstant law (Exercise 3.9.2) is not infinitely divisible.`,
      caption: String.raw`Left: the law of $Z$ (accent), the law of one $n$-th piece (orange) and the $n$-fold convolution of the piece, computed numerically (green dots), which rebuilds $Z$. Right: $|\varphi_Z(t)|^{1/n}$ for $n=1,\dots,$ your $n$ (darker = larger). For Poisson and gamma these rise smoothly toward $1$. For the uniform and Bernoulli laws $\varphi$ has zeros, the roots converge to a discontinuous function, and no $n$-th piece exists.`,
      deps: ['prob-3.3.1a'],
      tags: ['infinitely divisible'],
      viz(v) {
        const M = v.M;
        const law = v.select('law', [{ value: 'pois', label: 'Poisson$(3)$' }, { value: 'gam', label: 'gamma$(2)$' }, { value: 'unif', label: 'uniform$(-1,1)$' }, { value: 'bern', label: 'Bernoulli$(\\frac12)$' }], 'gam');
        const nS = v.slider('$n$ pieces', 2, 12, 4, { int: true });
        const L = v.stage({ x: [-0.5, 10], y: [0, 0.6], height: 320, weight: 1.2, axes: 'box', gutter: true, xlabel: '$x$', title: '$Z$, one piece, and the rebuilt sum' });
        const R = v.stage({ x: [0, 12], y: [0, 1.05], height: 320, axes: 'box', gutter: true, xlabel: '$t$', title: '$|\\varphi_Z(t)|^{1/n}$' });
        const PHIS = { pois: (t) => Math.exp(3 * (Math.cos(t) - 1)), gam: (t) => Math.pow(1 + t * t, -1), unif: (t) => (Math.abs(t) < 1e-9 ? 1 : Math.abs(Math.sin(t) / t)), bern: (t) => Math.abs(Math.cos(t / 2)) };
        let st = null;
        v.render(() => {
          const md = law.value, n = nS.value;
          let info = '';
          if (md === 'pois') {
            L.setView([-0.6, 10.6], [0, 0.6]);
            const Z = poisPmf(3, 40), Y = poisPmf(3 / n, 40), Yn = convPow(M, Array.from(Y.slice(0, 30)), n);
            for (let k = 0; k <= 10; k++) { L.rect(k - 0.38, 0, k - 0.02, Z[k], { fill: 'accent', fillAlpha: 0.6, stroke: false }); L.rect(k + 0.02, 0, k + 0.38, Y[k], { fill: 'orange', fillAlpha: 0.6, stroke: false }); L.dot(k - 0.2, Yn[k], { r: 4, color: 'green' }); }
            info = `rebuilt vs $Z$: total variation $${v.sci(tvd(Yn.slice(0, 41), Z) + 1e-17, 1)}$`;
          } else if (md === 'gam') {
            L.setView([-0.2, 8], [0, 1.2]);
            const h = 0.01, K = 3000, cell = (k) => Array.from({ length: K }, (_, j) => M.gammaP(k, (j + 1) * h) - M.gammaP(k, j * h));
            const Y = cell(2 / n), Yn = convPow(M, Y, n);
            L.fn((x) => x * Math.exp(-x), { domain: [0, 8], color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.15 });
            L.fn((x) => (x <= 0 ? NaN : Math.exp((2 / n - 1) * Math.log(x) - x - M.lgamma(2 / n))), { domain: [0.003, 8], color: 'orange', width: 2 });
            for (let i = 1; i <= 32; i++) { const x = i * 0.25, j = Math.round(x / h - n / 2); L.dot(x, (Yn[j] || 0) / h, { r: 3.6, color: 'green' }); }
            info = `piece: gamma$(2/${n})$, density unbounded at $0$ once $n>2$`;
          } else {
            const unif = md === 'unif';
            L.setView(unif ? [-1.6, 1.6] : [-0.6, 1.6], [0, 1.1]);
            if (unif) L.fn((x) => (Math.abs(x) <= 1 ? 0.5 : 0), { domain: [-1.6, 1.6], color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.15 });
            else { L.rect(-0.3, 0, 0.3, 0.5, { fill: 'accent', fillAlpha: 0.6, stroke: false }); L.rect(0.7, 0, 1.3, 0.5, { fill: 'accent', fillAlpha: 0.6, stroke: false }); }
            cornerIn(L, `no ${n}-th piece: φ vanishes at t = ${unif ? 'π' : 'π'}`, 'tr', { color: 'red', plate: true });
            info = `$\\varphi_Z(\\pi)=0$, so $Z$ is not infinitely divisible`;
          }
          const f = PHIS[md];
          for (let k = 1; k <= n; k++) R.fn((t) => Math.pow(f(t), 1 / k), { domain: [0, 12], color: v.mix('faint', 'accent', 0.2 + (0.8 * (k - 1)) / Math.max(1, n - 1)), width: k === n ? 2.4 : 1.2, n: 600 });
          R.hline(1, { color: 'muted', width: 1, dash: [3, 3] });
          if (md === 'unif' || md === 'bern') for (let j = 1; j * Math.PI <= 12; j++) if (md === 'bern' ? j % 2 === 1 : true) R.vline(j * Math.PI, { color: 'red', width: 1, dash: [4, 4] });
          v.legend(md === 'pois' || md === 'gam' ? [['accent', 'law of $Z$', { area: true }], ['orange', 'one piece $Y_{n,1}$', { area: true }], ['green', 'piece convolved $n$ times', { dot: true }]] : [['accent', 'law of $Z$', { area: true }], ['red', 'zeros of $\\varphi_Z$', { dash: true }]]);
          st = { info, n };
        });
        v.readout(() => st && `$n=${st.n}$: ${st.info}.`);
      },
    },
    {
      num: '3.9.1',
      kind: 'Theorem',
      name: 'Limits of i.i.d. triangular sums are infinitely divisible',
      statement: String.raw`$Z$ is a weak limit of row sums $S_n=X_{n,1}+\dots+X_{n,n}$ of triangular arrays with i.i.d. entries in each row if and only if $Z$ is infinitely divisible.`,
      idea: String.raw`If $Z$ is infinitely divisible, take $X_{n,m}\sim Y_{n,m}$ from the definition. Conversely, split a row of length $2n$ into two halves: $S_{2n}=Y_n+Y'_n$ with $Y_n,Y'_n$ i.i.d. Since $P(Y_n>y)^2\le P(S_{2n}>2y)$, the halves form a tight family (3.2.13); along a subsequence $Y_n\Rightarrow Y$, so $Z\overset d=Y+Y'$. Splitting into $k$ blocks the same way gives a $k$-th root for every $k$.`,
      caption: String.raw`Integer-valued arrays, all computed exactly. Left: the laws of $S_n$ for $n/4$, $n/2$ and $n$ (darker = larger) approaching the compound-Poisson limit $Z$ (green dots, Panjer recursion). Right: the proof's split of a row into $k$ equal blocks: the law of one block (orange), its $k$-fold convolution (accent outline), which is exactly the row sum, and the $k$-th root of $Z$ (green dots), which the block law approaches.`,
      deps: ['prob-3.9.1a', 'prob-3.2.13', 'prob-3.3.17'],
      tags: ['infinitely divisible'],
      viz(v) {
        const ARR = {
          bern: { label: 'Bernoulli$(\\lambda/n)$', jumps: [0, 1], lam: 2.5 },
          two: { label: 'jumps $1$ or $2$', jumps: [0, 0.6, 0.4], lam: 3 },
          geo: { label: 'geometric jumps', jumps: [0, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625, 0.0078125, 0.0078125], lam: 2 },
        };
        const arr = v.select('array', Object.keys(ARR).map((k) => ({ value: k, label: ARR[k].label })), 'two');
        const nS = v.slider('row length $n$', 12, 600, 48, { int: true, log: true });
        const kS = v.slider('$k$ blocks', 2, 6, 3, { int: true });
        const L = v.stage({ x: [-0.6, 16.6], y: [0, 0.3], height: 320, weight: 1.1, axes: 'box', gutter: true, xlabel: '$j$', title: 'row sums $S_n$ and the limit $Z$' });
        const R = v.stage({ x: [-0.6, 10.6], y: [0, 0.6], height: 320, axes: 'box', gutter: true, xlabel: '$j$', title: 'one block, its $k$-fold sum, and $Z$\'s $k$-th root' });
        const K = 60;
        const entry = (A, n) => { const p = new Float64Array(A.jumps.length); A.jumps.forEach((f, j) => { if (j > 0) p[j] = (A.lam / n) * f; }); p[0] = 1 - p.reduce((a, b) => a + b, 0); return p; };
        const rowLaw = (A, n, m) => { let out = new Float64Array([1]), base = entry(A, n), e = m; while (e > 0) { if (e & 1) out = conv(out, base, K); base = conv(base, base, K); e >>= 1; } return out; };
        const panjer = (A, lam) => { const f = A.jumps, g = new Float64Array(K + 1); g[0] = Math.exp(-lam); for (let k = 1; k <= K; k++) { let s = 0; for (let j = 1; j <= Math.min(k, f.length - 1); j++) s += j * f[j] * g[k - j]; g[k] = (lam / k) * s; } return g; };
        let st = null;
        v.render(() => {
          const A = ARR[arr.value], n0 = nS.value, k = kS.value, nb = Math.max(1, Math.floor(n0 / k)), n = nb * k;
          const Z = panjer(A, A.lam), Zk = panjer(A, A.lam / k);
          const top = Math.max(...Z) * 1.3; L.setView(null, [0, top]);
          [Math.max(k, Math.round(n / 4)), Math.round(n / 2), n].forEach((m, j) => { const S = rowLaw(A, m, m); for (let i = 0; i <= 16; i++) L.rect(i - 0.36 + 0.24 * j, 0, i - 0.14 + 0.24 * j, S[i] || 0, { fill: 'accent', fillAlpha: 0.25 + 0.3 * j, stroke: false }); });
          for (let i = 0; i <= 16; i++) L.dot(i, Z[i], { r: 4, color: 'green' });
          const Y = rowLaw(A, n, nb), Yk = rowLaw(A, n, n);
          let Yconv = new Float64Array([1]); for (let j = 0; j < k; j++) Yconv = conv(Yconv, Y, K);
          R.setView(null, [0, Math.max(...Y, ...Zk) * 1.18]);
          for (let i = 0; i <= 10; i++) { R.rect(i - 0.36, 0, i + 0.02, Y[i] || 0, { fill: 'orange', fillAlpha: 0.6, stroke: false }); R.rect(i + 0.02, 0, i + 0.36, Yconv[i] || 0, { color: 'accent', width: 1.5 }); R.dot(i - 0.17, Zk[i], { r: 4, color: 'green' }); }
          v.legend([['accent', 'law of $S_n$ / $k$-fold block sum'], ['orange', 'one block of $n/k$ entries', { area: true }], ['green', '$Z$; $k$-th root of $Z$', { dot: true }]]);
          st = { n, k, tvZ: tvd(Yk, Z), tvSplit: tvd(Yconv, Yk), tvRoot: tvd(Y, Zk) };
        });
        v.readout(() => st && `Row length $n=${st.n}$: $\\|S_n-Z\\|=${v.fix(st.tvZ, 4)}$. Block split: $\\|Y^{*${st.k}}-S_n\\|=${v.sci(st.tvSplit + 1e-17, 1)}$ (an identity), and the block law is $${v.fix(st.tvRoot, 4)}$ from the ${st.k}-th root of $Z$.`);
      },
    },
    {
      num: '3.9.6',
      kind: 'Theorem',
      name: 'Lévy–Khinchin formula',
      credit: 'Lévy 1934; Khinchin 1937',
      statement: String.raw`$Z$ is infinitely divisible if and only if its characteristic function satisfies
$$\log\varphi(t)=ict-\frac{\sigma^2t^2}2+\int\Big(e^{itx}-1-\frac{itx}{1+x^2}\Big)\,\mu(dx)$$
for some $c\in\R$, $\sigma\ge0$ and a measure $\mu$ (the **Lévy measure**) with $\mu(\{0\})=0$ and $\int\frac{x^2}{1+x^2}\,\mu(dx)<\infty$. (Durrett states it with references to Breiman and Feller for the proof.)`,
      idea: String.raw`The three pieces are a drift, a Gaussian part and jumps. For a finite $\mu$, the jump part is a compound Poisson sum: a Poisson number of jumps with distribution $\mu/\mu(\R)$, i.e. summing the points of a Poisson process with mean measure $\mu$ (3.9.5, 3.7.7); the term $itx/(1+x^2)$ is a centring that keeps the integral finite when $\mu$ has infinite mass near $0$, as for stable laws, where $\mu(dx)=\theta\alpha x^{-\alpha-1}dx$ on $(0,\infty)$ (compare 3.8.2).`,
      caption: String.raw`Build an infinitely divisible law. Drag the bars of the Lévy measure $\mu$ on the jump sizes $\pm0.5,\pm1,\pm1.5,\pm2$ (left) and set the drift $c$ and the Gaussian part $\sigma$. Right: 6000 seeded samples $Z=c'+\sigma N+\sum_jx_jN_j$ with independent $N_j\sim$ Poisson$(\mu_j)$ (gold), against the density obtained by inverting $\varphi$ from the formula (accent). The readout compares the empirical characteristic function with the formula.`,
      deps: ['prob-3.9.1', 'prob-3.9.1a', 'prob-3.3.17'],
      tags: ['infinitely divisible'],
      viz(v) {
        const M = v.M;
        const cS = v.slider('drift $c$', -2, 2, 0, { step: 0.05 });
        const sS = v.slider('Gaussian $\\sigma$', 0.15, 1.5, 0.35, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const xs = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2], m0 = [0.1, 0.2, 0.35, 0.6, 0.9, 0.5, 0.3, 0.2];
        const A = v.stage({ x: [-2.5, 2.5], y: [0, 2.2], height: 320, axes: 'box', gutter: true, xlabel: 'jump size $x$', title: 'Lévy measure $\\mu$ (drag the bars)' });
        const B = v.stage({ x: [-6, 8], y: [0, 0.5], height: 320, weight: 1.35, axes: 'box', gutter: true, xlabel: '$z$', title: 'samples of $Z$ and the inverted density' });
        const Hs = xs.map((x, i) => A.handle(x, m0[i], { color: x < 0 ? 'orange' : 'accent', constrain: (_, y) => [x, clampN(y, 0, 2)] }));
        let st = null;
        v.render(() => {
          const c = cS.value, s = sS.value, mu = Hs.map((h) => h.y);
          xs.forEach((x, i) => A.rect(x - 0.18, 0, x + 0.18, mu[i], { fill: x < 0 ? 'orange' : 'accent', fillAlpha: 0.55, stroke: false }));
          A.hline(0, { color: 'muted', width: 1 });
          const comp = xs.reduce((acc, x, i) => acc + (mu[i] * x) / (1 + x * x), 0), cp = c - comp;
          const logphi = (t) => { let re = -0.5 * s * s * t * t, im = c * t; xs.forEach((x, i) => { re += mu[i] * (Math.cos(t * x) - 1); im += mu[i] * (Math.sin(t * x) - (t * x) / (1 + x * x)); }); return [re, im]; };
          const r = v.rng(seed * 73 + 1), Z = [];
          for (let i = 0; i < 6000; i++) { let z = cp + s * r.normal(); xs.forEach((x, j) => { z += x * samplePois(r, mu[j]); }); Z.push(z); }
          const T = 34 / s, N = 1600, zs = Array.from({ length: 141 }, (_, i) => -6 + (14 * i) / 140);
          const tt = [], ww = [], pr = []; for (let i = 0; i <= N; i++) { const t = (T * i) / N; tt.push(t); ww.push(((i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * T) / N / 3); pr.push(logphi(t)); }
          const dens = zs.map((z) => { let a = 0; for (let i = 0; i <= N; i++) { const e = Math.exp(pr[i][0]); a += ww[i] * e * Math.cos(pr[i][1] - tt[i] * z); } return Math.max(0, a / Math.PI); });
          const H = M.histogram(Z, { bins: Array.from({ length: 71 }, (_, i) => -6 + (14 * i) / 70) }), dd = { edges: H.edges, counts: H.counts, density: H.counts.map((k) => k / (6000 * 0.2)) };
          B.setView(null, [0, Math.max(...dd.density, ...dens) * 1.15]);
          B.hist(dd, { density: true, color: 'gold', fillAlpha: 0.3, width: 1 });
          B.path(zs.map((z, i) => [z, dens[i]]), { color: 'accent', width: 2.4 });
          let er = 0, ei = 0; Z.forEach((z) => { er += Math.cos(z); ei += Math.sin(z); }); er /= Z.length; ei /= Z.length;
          const f1 = cexp(logphi(1));
          v.legend([['accent', 'positive jumps / inverted density'], ['orange', 'negative jumps', { area: true }], ['gold', 'seeded samples', { area: true }]]);
          st = { er, ei, f1, tot: mu.reduce((a, b) => a + b, 0) };
        });
        v.readout(() => st && `Total jump rate $\\mu(\\mathbb R)=${v.fix(st.tot, 2)}$. At $t=1$: empirical $Ee^{iZ}=${v.fix(st.er, 3)}${st.ei < 0 ? '-' : '+'}${v.fix(Math.abs(st.ei), 3)}i$, formula $\\varphi(1)=${v.fix(st.f1[0], 3)}${st.f1[1] < 0 ? '-' : '+'}${v.fix(Math.abs(st.f1[1]), 3)}i$.`);
      },
    },
    {
      num: '3.9.7',
      kind: 'Theorem',
      name: 'Kolmogorov’s formula (finite variance)',
      credit: 'Kolmogorov, 1932',
      statement: String.raw`$Z$ is infinitely divisible with mean $0$ and finite variance if and only if
$$\log\varphi(t)=\int\big(e^{itx}-1-itx\big)\,x^{-2}\,\nu(dx)$$
for a finite measure $\nu$ (the **canonical measure**), where the integrand is read as $-t^2/2$ at $x=0$. Then $\operatorname{var}(Z)=\nu(\R)$.`,
      idea: String.raw`Each atom of $\nu$ is a building block. If $Z_\lambda$ is Poisson$(\lambda)$, then $x(Z_\lambda-\lambda)$ has $\log\varphi(t)=\lambda(e^{itx}-1-itx)$, i.e. canonical measure $\lambda x^2\delta_x$ and variance $\lambda x^2$; an atom at $0$ is a centred normal with variance $\nu(\{0\})$. Independent sums add canonical measures and variances, and general $\nu$ are limits of finite combinations.`,
      caption: String.raw`Drag the bars of the canonical measure $\nu$ at $x=0,\pm0.5,\pm1,\pm2$; the bar at $0$ is the Gaussian part. Middle: 6000 seeded samples of $Z=\sqrt{\nu_0}\,N+\sum_{x\ne0}x\,(P_x-\nu_x/x^2)$ with $P_x\sim$ Poisson$(\nu_x/x^2)$, against the density from Fourier inversion. Right: the variance contributed by each atom (stacked, it is exactly the bar height), next to the sample variance.`,
      deps: ['prob-3.9.6'],
      tags: ['infinitely divisible'],
      viz(v) {
        const M = v.M;
        let seed = 1; v.button('Resample', () => { seed++; });
        const xs = [-2, -1, -0.5, 0, 0.5, 1, 2], n0 = [0.15, 0.25, 0.2, 0.3, 0.1, 0.5, 0.6], COL = ['orange', 'orange', 'orange', 'green', 'accent', 'accent', 'accent'];
        const A = v.stage({ x: [-2.6, 2.6], y: [0, 1.6], height: 320, axes: 'box', gutter: true, xlabel: '$x$', title: 'canonical measure $\\nu$' });
        const B = v.stage({ x: [-5, 6], y: [0, 0.5], height: 320, weight: 1.3, axes: 'box', gutter: true, xlabel: '$z$', title: 'samples of $Z$ and the density' });
        const C = v.stage({ x: [0, 2], y: [0, 3], height: 320, weight: 0.55, axes: 'box', gutter: true, title: '$\\operatorname{var}(Z)$', xticks: [[0.5, 'ν(ℝ)'], [1.5, 'sample']] });
        const Hs = xs.map((x, i) => A.handle(x, n0[i], { color: COL[i], constrain: (_, y) => [x, clampN(y, x === 0 ? 0.04 : 0, 1.5)] }));
        let st = null;
        v.render(() => {
          const nu = Hs.map((h) => h.y);
          xs.forEach((x, i) => A.rect(x - 0.14, 0, x + 0.14, nu[i], { fill: COL[i], fillAlpha: 0.55, stroke: false }));
          const logphi = (t) => { let re = 0, im = 0; xs.forEach((x, i) => { if (x === 0) re -= (nu[i] * t * t) / 2; else { re += (nu[i] * (Math.cos(t * x) - 1)) / (x * x); im += (nu[i] * (Math.sin(t * x) - t * x)) / (x * x); } }); return [re, im]; };
          const r = v.rng(seed * 79 + 3), Z = [];
          for (let i = 0; i < 6000; i++) { let z = 0; xs.forEach((x, j) => { if (x === 0) z += Math.sqrt(nu[j]) * r.normal(); else { const lam = nu[j] / (x * x); z += x * (samplePois(r, lam) - lam); } }); Z.push(z); }
          const s0 = Math.sqrt(nu[3]), T = 30 / s0, N = 1600, zs = Array.from({ length: 111 }, (_, i) => -5 + (11 * i) / 110);
          const tt = [], ww = [], pr = []; for (let i = 0; i <= N; i++) { const t = (T * i) / N; tt.push(t); ww.push(((i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * T) / N / 3); pr.push(logphi(t)); }
          const dens = zs.map((z) => { let a = 0; for (let i = 0; i <= N; i++) a += ww[i] * Math.exp(pr[i][0]) * Math.cos(pr[i][1] - tt[i] * z); return Math.max(0, a / Math.PI); });
          const H = M.histogram(Z, { bins: Array.from({ length: 56 }, (_, i) => -5 + (11 * i) / 55) }), dd = { edges: H.edges, counts: H.counts, density: H.counts.map((k) => k / (6000 * 0.2)) };
          B.setView(null, [0, Math.max(...dd.density, ...dens) * 1.15]);
          B.hist(dd, { density: true, color: 'gold', fillAlpha: 0.3, width: 1 });
          B.path(zs.map((z, i) => [z, dens[i]]), { color: 'ink', width: 2.2 });
          const tot = nu.reduce((a, b) => a + b, 0), m = Z.reduce((a, b) => a + b, 0) / Z.length, vs = Z.reduce((a, b) => a + (b - m) ** 2, 0) / (Z.length - 1);
          C.setView(null, [0, Math.max(tot, vs) * 1.2]);
          let y0 = 0; xs.forEach((x, i) => { C.rect(0.15, y0, 0.85, y0 + nu[i], { fill: COL[i], fillAlpha: 0.35 + 0.1 * Math.abs(x), stroke: false }); y0 += nu[i]; });
          C.rect(1.15, 0, 1.85, vs, { fill: 'gold', fillAlpha: 0.75, stroke: false });
          v.legend([['green', 'Gaussian atom at $0$', { area: true }], ['accent', 'positive jumps', { area: true }], ['orange', 'negative jumps', { area: true }], ['ink', 'inverted density']]);
          st = { tot, vs, m };
        });
        v.readout(() => st && `$\\nu(\\mathbb R)=${v.fix(st.tot, 3)}$; sample variance $${v.fix(st.vs, 3)}$, sample mean $${v.fix(st.m, 3)}$ (theory: $0$).`);
      },
    },
    // ======================================================================== §3.10 limit theorems in ℝᵈ
    {
      num: '3.10.1',
      kind: 'Theorem',
      name: 'Portmanteau theorem in ℝᵈ',
      statement: String.raw`For random elements of a metric space $(S,\rho)$ the following are equivalent:
(i) $Ef(X_n)\to Ef(X_\infty)$ for all bounded continuous $f$ (this is $X_n\Rightarrow X_\infty$);
(ii) the same for all bounded Lipschitz $f$;
(iii) $\limsup_nP(X_n\in K)\le P(X_\infty\in K)$ for all closed $K$;
(iv) $\liminf_nP(X_n\in G)\ge P(X_\infty\in G)$ for all open $G$;
(v) $P(X_n\in A)\to P(X_\infty\in A)$ for all $A$ with $P(X_\infty\in\partial A)=0$;
(vi) $Ef(X_n)\to Ef(X_\infty)$ for all bounded $f$ whose discontinuity set has $P(X_\infty\in D_f)=0$.`,
      idea: String.raw`(ii)$\Rightarrow$(iii): approximate $1_K$ from above by the Lipschitz functions $(1-j\rho(x,K))^+$. (iii)$\Leftrightarrow$(iv) by complements. (iii)+(iv)$\Rightarrow$(v) by squeezing $A$ between its interior and closure, which have the same limit mass. (v)$\Rightarrow$(vi): slice the range of $f$ at levels $\alpha_i$ carrying no mass under $f(X_\infty)$, which leaves only countably many exceptions. The other implications are trivial.`,
      caption: String.raw`$X_n=S_n/\sqrt{n/2}$ for the simple random walk on $\Z^2$, whose exact law (dots, area $\propto$ mass) converges to the standard normal on $\R^2$. Drag the centre and the radius of the disc (snapped to a grid of $0.05$). Right: $P(X_n\in G)$ for the open disc and $P(X_n\in K)$ for its closure, for every $n\le150$, against the Gaussian mass (green). The two differ exactly when lattice points sit on the circle (red), yet both converge, because the limit puts no mass on the boundary.`,
      deps: ['prob-3.2.11', 'prob-1.1.11'],
      tags: ['weak convergence', 'multivariate'],
      viz(v) {
        const nS = v.slider('$n$', 1, 150, 16, { int: true });
        const S = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 340, axes: true, title: 'law of $X_n$ and the disc' });
        const R = v.stage({ x: [1, 150], y: [0, 1], height: 340, weight: 1.2, axes: 'box', gutter: true, xlabel: '$n$', title: 'open and closed disc probabilities' });
        const snap = (x, y) => [Math.round(x * 20) / 20, Math.round(y * 20) / 20];
        const Cc = S.handle(0, 0, { color: 'accent', constrain: snap }), Rr = S.handle(1, 0, { color: 'accent', label: 'r', labelPos: 'ne', constrain: snap });
        const binom = (n) => { const out = new Float64Array(n + 1); let lp = -n * Math.LN2; out[0] = Math.exp(lp); for (let k = 1; k <= n; k++) { lp += Math.log((n - k + 1) / k); out[k] = Math.exp(lp); } return out; };
        const discProb = (n, cx, cy, r) => {
          const b = binom(n), sc = Math.sqrt(n / 2); let open = 0, closed = 0; const pts = [];
          for (let i = 0; i <= n; i++) { if (b[i] < 1e-13) continue; const a = 2 * i - n; for (let j = 0; j <= n; j++) { if (b[j] < 1e-13) continue; const d = 2 * j - n, x = (a + d) / 2 / sc, y = (a - d) / 2 / sc, p = b[i] * b[j], q = (x - cx) ** 2 + (y - cy) ** 2 - r * r; if (q < -1e-9) open += p; if (q < 1e-9) closed += p; pts.push([x, y, p, Math.abs(q) < 1e-9]); } }
          return { open, closed, pts };
        };
        const gauss = (cx, cy, r) => { const d = Math.hypot(cx, cy); return simpson((rho) => rho * Math.exp(-(rho * rho + d * d) / 2) * besselI0(rho * d), 0, r, 400); };
        let cache = null, st = null;
        v.render(() => {
          const n = nS.value, cx = Cc.x, cy = Cc.y, r = Math.max(0.05, Math.hypot(Rr.x - cx, Rr.y - cy));
          const key = `${cx},${cy},${r.toFixed(6)}`;
          if (!cache || cache.key !== key) { const seq = []; for (let m = 1; m <= 150; m++) { const d = discProb(m, cx, cy, r); seq.push([m, d.open, d.closed]); } cache = { key, seq, g: gauss(cx, cy, r) }; }
          const D = discProb(n, cx, cy, r), pmax = Math.max(...D.pts.map((p) => p[2]));
          D.pts.forEach(([x, y, p, on]) => { if (Math.abs(x) < 3.1 && Math.abs(y) < 3.1) S.dot(x, y, { r: 1 + 6 * Math.sqrt(p / pmax), color: on ? 'red' : 'ink', alpha: on ? 1 : 0.55 }); });
          S.circle(cx, cy, r, { color: 'accent', fill: 'accent', fillAlpha: 0.1, width: 2 });
          R.hline(cache.g, { color: 'green', width: 2, dash: [6, 4] });
          R.path(cache.seq.map(([m, o]) => [m, o]), { color: 'accent', width: 1.6 });
          R.path(cache.seq.map(([m, , c]) => [m, c]), { color: 'orange', width: 1.6 });
          cache.seq.forEach(([m, o, c]) => { if (c - o > 1e-9) R.line(m, o, m, c, { color: 'red', width: 2 }); });
          R.vline(n, { color: 'gold', width: 1, dash: [3, 3] });
          v.legend([['accent', 'open disc $G$'], ['orange', 'closed disc $K$'], ['red', 'mass on the circle'], ['green', 'Gaussian mass', { dash: true }]]);
          st = { n, open: D.open, closed: D.closed, g: cache.g, r };
        });
        v.readout(() => st && `$n=${st.n}$, $r=${v.fix(st.r, 2)}$: $P(X_n\\in G)=${v.fix(st.open, 4)}$, $P(X_n\\in K)=${v.fix(st.closed, 4)}$; limit $P(\\chi\\in\\bar G)=${v.fix(st.g, 4)}$, and $P(\\chi\\in\\partial G)=0$.`);
      },
    },
    {
      num: '3.10.2',
      kind: 'Theorem',
      name: 'Weak convergence through distribution functions in ℝᵈ',
      statement: String.raw`On $\R^d$, with $F(x)=P(X\le x)$ (coordinatewise), say $F_n\Rightarrow F$ if $F_n(x)\to F(x)$ at every continuity point $x$ of $F$. This is equivalent to weak convergence $X_n\Rightarrow X$ in the sense of 3.10.1. The continuity points include every $x$ none of whose coordinates is an atom of the corresponding hyperplane mass, $P(X_i=x_i)=0$.`,
      idea: String.raw`If $F$ is continuous at $x$, the orthant $(-\infty,x]$ has boundary of $X$-mass $0$, so (v) of 3.10.1 gives $F_n(x)\to F(x)$. Conversely, rectangles whose sides avoid the countably many charged hyperplanes are "good": their probabilities are signed sums of $F$ at the corners, so they converge; open sets are increasing unions of finite disjoint unions of good rectangles, which gives (iv). Note that $F$ can be discontinuous where there is no atom: for $X=(0,Y)$ with $Y$ uniform, $F$ jumps across the whole half-line $\{0\}\times(0,\infty)$.`,
      caption: String.raw`Left: the error $|F_n(x,y)-F(x,y)|$ over the plane for your $n$, with the discontinuity set of $F$ in red. Drag the gold point and watch $F_n$ at that point against $n$ on the right. For Durrett's example $X_n=(1/n,Y)\to(0,Y)$ the error lives on the half-line $x=0$, $y>0$, where convergence fails; for $X_n=(1/n,1/n)\to(0,0)$ on two half-lines; for independent standardized binomial coordinates the limit is continuous and convergence holds everywhere.`,
      deps: ['prob-3.10.1'],
      tags: ['weak convergence', 'multivariate'],
      viz(v) {
        const M = v.M;
        const mode = v.select('sequence', [{ value: 'dur', label: '$(1/n,Y)\\to(0,Y)$' }, { value: 'atom', label: '$(1/n,1/n)\\to(0,0)$' }, { value: 'bin', label: 'binomial pair $\\to N(0,I)$' }], 'dur');
        const nS = v.slider('$n$', 1, 200, 5, { int: true, log: true });
        const L = v.stage({ x: [-1, 1.5], y: [-1, 1.5], equal: true, height: 340, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$y$', title: '$|F_n-F|$' });
        const R = v.stage({ x: [1, 1000], xlog: true, y: [-0.05, 1.05], height: 340, axes: 'box', gutter: true, xlabel: '$n$', title: '$F_n$ at the gold point' });
        const P = L.handle(0, 0.6, { color: 'gold', constrain: (x, y) => [Math.round(clampN(x, -0.95, 1.45) * 50) / 50, Math.round(clampN(y, -0.95, 1.45) * 50) / 50] });
        const binCdf = (n, z) => { const p = 0.5, s = Math.sqrt(n * p * (1 - p)), k = Math.floor(n * p + z * s + 1e-9); if (k < 0) return 0; if (k >= n) return 1; return 1 - M.betaI(k + 1, n - k, p); };
        const Fn = (md, n, x, y) => md === 'dur' ? (x >= 1 / n ? clampN(y, 0, 1) : 0) : md === 'atom' ? (x >= 1 / n && y >= 1 / n ? 1 : 0) : binCdf(n, x * 2) * binCdf(n, y * 2);
        const F = (md, x, y) => md === 'dur' ? (x >= 0 ? clampN(y, 0, 1) : 0) : md === 'atom' ? (x >= 0 && y >= 0 ? 1 : 0) : PhiN(M, x * 2) * PhiN(M, y * 2);
        let st = null;
        v.render(() => {
          const md = mode.value, n = nS.value;
          L.heat((x, y) => Math.abs(Fn(md, n, x, y) - F(md, x, y)), { range: [0, 1], cmap: 'theme', key: `${md}|${n}`, res: 2 });
          L.axes();
          if (md === 'dur') L.line(0, 0, 0, 1.5, { color: 'red', width: 3 });
          if (md === 'atom') { L.line(0, 0, 0, 1.5, { color: 'red', width: 3 }); L.line(0, 0, 1.5, 0, { color: 'red', width: 3 }); }
          const ns = logGrid(1, 1000, 80), seq = ns.map((m) => [m, Fn(md, m, P.x, P.y)]), lim = F(md, P.x, P.y);
          R.hline(lim, { color: 'green', width: 2, dash: [6, 4] });
          R.path(seq, { color: 'accent', width: 2 });
          R.dot(n, Fn(md, n, P.x, P.y), { r: 5, color: 'gold' });
          v.legend([['red', 'discontinuity set of $F$'], ['accent', '$F_n$ at the point'], ['green', '$F$ at the point', { dash: true }]]);
          st = { x: P.x, y: P.y, fn: Fn(md, 1000, P.x, P.y), f: lim };
        });
        v.readout(() => st && `At $(${v.fix(st.x, 2)},${v.fix(st.y, 2)})$: $F_{1000}=${v.fix(st.fn, 4)}$, $F=${v.fix(st.f, 4)}$ ${Math.abs(st.fn - st.f) > 0.01 ? '— no convergence here: a discontinuity point of $F$.' : '— converging.'}`);
      },
    },
    {
      num: '3.10.3',
      kind: 'Theorem',
      name: 'Tightness gives convergent subsequences in ℝᵈ',
      statement: String.raw`A sequence of probability measures $\mu_n$ on $\R^d$ is **tight** if for every $\eps>0$ there is $M$ with $\liminf_n\mu_n([-M,M]^d)\ge1-\eps$. Every tight sequence has a weakly convergent subsequence.`,
      idea: String.raw`Diagonalize over the countable set $\Q^d$ as in Helly's theorem (3.2.12): find a subsequence with $F_{n(k)}(q)\to G(q)$ for every rational point $q$, and put $F(x)=\inf\{G(q):q>x\}$. Rectangle increments of $F_n$ are nonnegative and stay so in the limit, so $F$ is a distribution function except possibly for its total mass, and tightness guarantees that no mass escapes to infinity.`,
      caption: String.raw`Two families of Gaussian clouds (400 seeded points shown for your $n$). *Tight*: the centre goes round the unit circle, $m_n=(\cos n,\sin n)$, and the ellipse turns by $n$ radians; the family never settles, but along the subsequence of $n$ with $n\bmod2\pi\to0$ (gold dots: $44, 333, 710,\dots$) it converges. *Escaping*: the centre spirals out. Drag the corner of the box $[-M,M]^2$. Right: $\mu_n([-M,M]^2)$ for all $n\le400$ in both families.`,
      deps: ['prob-3.2.12', 'prob-3.10.1'],
      tags: ['tightness', 'multivariate'],
      viz(v) {
        const mode = v.select('family', [{ value: 'tight', label: 'tight' }, { value: 'esc', label: 'escaping' }], 'tight');
        const nS = v.slider('$n$', 1, 400, 44, { int: true });
        const S = v.stage({ x: [-12, 12], y: [-12, 12], equal: true, height: 340, axes: true, title: 'the cloud of $\\mu_n$' });
        const R = v.stage({ x: [1, 400], y: [0, 1.05], height: 340, weight: 1.1, axes: 'box', gutter: true, xlabel: '$n$', title: '$\\mu_n([-M,M]^2)$' });
        const Hm = S.handle(2.5, 2.5, { color: 'red', label: 'M', labelPos: 'ne', constrain: (x, y) => { const m = clampN(Math.max(Math.abs(x), Math.abs(y)), 0.2, 11.5); return [m, m]; } });
        const zr = v.rng(91), Z = Array.from({ length: 1500 }, () => [zr.normal(), zr.normal()]);
        const mean = (md, n) => { const rad = md === 'tight' ? 1 : n / 40; return [rad * Math.cos(n), rad * Math.sin(n)]; };
        const pt = (md, n, z) => { const [mx, my] = mean(md, n), c = Math.cos(n), s = Math.sin(n), u = 0.6 * z[0], w = 0.15 * z[1]; return [mx + c * u - s * w, my + s * u + c * w]; };
        const sub = []; for (let n = 1; n <= 2000; n++) { const r = ((n % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), d = Math.min(r, 2 * Math.PI - r); if (d < 0.02) sub.push(n); }
        let cache = null, st = null;
        v.render(() => {
          const md = mode.value, n = nS.value, Mv = Hm.x;
          const view = md === 'tight' ? 2.6 : 12; S.setView([-view, view], [-view, view]);
          const traj = []; for (let k = 1; k <= Math.min(400, n); k++) traj.push(mean(md, k));
          S.path(traj, { color: 'faint', width: 1 });
          sub.filter((k) => k <= 400).forEach((k) => { const [x, y] = mean(md, k); S.dot(x, y, { r: 4, color: 'gold' }); });
          for (let i = 0; i < 400; i++) { const [x, y] = pt(md, n, Z[i]); S.dot(x, y, { r: 2, color: 'accent', alpha: 0.5 }); }
          S.rect(-Mv, -Mv, Mv, Mv, { color: 'red', width: 1.8 });
          const key = `${Mv}`;
          if (!cache || cache.key !== key) { const f = (mm) => Array.from({ length: 400 }, (_, k) => { let c = 0; for (const z of Z) { const [x, y] = pt(mm, k + 1, z); if (Math.abs(x) <= Mv && Math.abs(y) <= Mv) c++; } return [k + 1, c / Z.length]; }); cache = { key, t: f('tight'), e: f('esc') }; }
          R.path(cache.t, { color: 'accent', width: md === 'tight' ? 2.2 : 1.2, alpha: md === 'tight' ? 1 : 0.4 });
          R.path(cache.e, { color: 'red', width: md === 'esc' ? 2.2 : 1.2, alpha: md === 'esc' ? 1 : 0.4 });
          R.vline(n, { color: 'gold', width: 1, dash: [3, 3] });
          v.legend([['accent', 'tight family'], ['red', 'escaping family / box'], ['gold', 'subsequence $n_k$', { dot: true }]]);
          const series = md === 'tight' ? cache.t : cache.e;
          st = { inf: Math.min(...series.map((p) => p[1])), M: Mv, sub: sub.slice(0, 5), md, cur: series[n - 1][1] };
        });
        v.readout(() => st && `$M=${v.fix(st.M, 2)}$: $\\mu_n([-M,M]^2)=${v.fix(st.cur, 3)}$ now; $\\min_{n\\le400}=${v.fix(st.inf, 3)}$ ${st.md === 'tight' ? '(stays near 1 once $M\\gtrsim2$: tight)' : '(tends to 0 for every $M$: not tight)'}. Subsequence: ${st.sub.join(', ')}, …`);
      },
    },
    {
      num: '3.10.4',
      kind: 'Theorem',
      name: 'Inversion formula in ℝᵈ',
      statement: String.raw`Let $\mu$ be a probability measure on $\R^d$ with characteristic function $\varphi(t)=\int e^{it\cdot x}\mu(dx)$, and let $A=[a_1,b_1]\times\dots\times[a_d,b_d]$ with $\mu(\partial A)=0$. Then
$$\mu(A)=\lim_{T\to\infty}(2\pi)^{-d}\int_{[-T,T]^d}\prod_{j=1}^d\psi_j(t_j)\,\varphi(t)\,dt,\qquad\psi_j(s)=\frac{e^{-isa_j}-e^{-isb_j}}{is}.$$`,
      idea: String.raw`Write $\varphi$ as an integral over $\mu$ and use Fubini: the $d$-fold integral factors into one-dimensional integrals $\int_{-T}^T\psi_j(t)e^{itx_j}dt=2\{\mathrm{Si}(T(x_j-a_j))-\mathrm{Si}(T(x_j-b_j))\}$, which are bounded and tend to $\pi(1_{(a_j,b_j)}+1_{[a_j,b_j]})(x_j)$, exactly as in the one-dimensional proof (3.3.11). Bounded convergence finishes. Points on the boundary would be counted with weight $\frac12$ (edges) or $\frac14$ (corners), which is why $\mu(\partial A)=0$ is assumed.`,
      caption: String.raw`A law with five atoms (drag them; they snap to a grid of $0.5$, sizes show the masses $0.3,0.25,0.2,0.15,0.1$) and a rectangle $A$ (drag its corners; grid $0.25$). Right: the truncated inversion integral against $T$ on a log axis, each one-dimensional factor integrated exactly through the sine integral. It converges to $\mu(A)$ (green) when no atom sits on $\partial A$; put an atom on an edge or a corner and the limit picks up only half or a quarter of it.`,
      deps: ['prob-3.3.11'],
      tags: ['characteristic functions', 'multivariate'],
      viz(v) {
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 340, axes: true, title: 'atoms and the rectangle $A$' });
        const R = v.stage({ x: [0.1, 1000], xlog: true, y: [-0.1, 1], height: 340, weight: 1.2, axes: 'box', gutter: true, xlabel: '$T$', title: 'truncated inversion integral' });
        const W = [0.3, 0.25, 0.2, 0.15, 0.1], P0 = [[-1, -0.5], [0.5, 0.5], [1, -1], [-1.5, 1.5], [0, -2]];
        const sn = (g) => (x, y) => [clampN(Math.round(x / g) * g, -2.5, 2.5), clampN(Math.round(y / g) * g, -2.5, 2.5)];
        const At = P0.map((p, i) => S.handle(p[0], p[1], { color: 'accent', r: 5 + 10 * W[i], constrain: sn(0.5) }));
        const C1 = S.handle(-1.25, -1.25, { color: 'orange', constrain: sn(0.25) }), C2 = S.handle(1.25, 1, { color: 'orange', constrain: sn(0.25) });
        let st = null;
        v.render(() => {
          const a = [Math.min(C1.x, C2.x), Math.min(C1.y, C2.y)], b = [Math.max(C1.x, C2.x), Math.max(C1.y, C2.y)];
          S.rect(a[0], a[1], b[0], b[1], { color: 'orange', fill: 'orange', fillAlpha: 0.1, width: 2 });
          const eps = 1e-9; let inside = 0, closed = 0, limit = 0;
          const pos = At.map((h) => [h.x, h.y]);
          pos.forEach(([x, y], i) => {
            const fx = x > a[0] + eps && x < b[0] - eps ? 1 : Math.abs(x - a[0]) < eps || Math.abs(x - b[0]) < eps ? 0.5 : 0;
            const fy = y > a[1] + eps && y < b[1] - eps ? 1 : Math.abs(y - a[1]) < eps || Math.abs(y - b[1]) < eps ? 0.5 : 0;
            if (fx === 1 && fy === 1) inside += W[i]; if (fx > 0 && fy > 0) closed += W[i]; limit += W[i] * fx * fy;
            S.dot(x, y, { r: 0, color: 'accent' });
            if (fx > 0 && fy > 0 && fx * fy < 1) S.circle(x, y, 0.18, { color: 'red', width: 2.2 });
          });
          const V = (T) => pos.reduce((acc, [x, y], i) => acc + W[i] * ((Si(T * (x - a[0])) - Si(T * (x - b[0]))) / Math.PI) * ((Si(T * (y - a[1])) - Si(T * (y - b[1]))) / Math.PI), 0);
          const pts = []; for (let i = 0; i <= 300; i++) { const T = Math.pow(10, -1 + (4 * i) / 300); pts.push([T, V(T)]); }
          R.hline(closed, { color: 'green', width: 2, dash: [6, 4] });
          if (Math.abs(limit - closed) > 1e-9) { R.hline(inside, { color: 'muted', width: 1.2, dash: [3, 3] }); R.hline(limit, { color: 'red', width: 1.6, dash: [5, 3] }); }
          R.path(pts, { color: 'accent', width: 2.2 });
          v.legend([['accent', 'truncated integral'], ['green', '$\\mu(A)$ ($A$ closed)', { dash: true }], ...(Math.abs(limit - closed) > 1e-9 ? [['red', 'actual limit: boundary atoms halved/quartered', { dash: true }], ['muted', '$\\mu(A^\\circ)$', { dash: true }]] : [])]);
          st = { closed, inside, limit, v1000: V(1000) };
        });
        v.readout(() => st && `At $T=1000$ the integral is $${v.fix(st.v1000, 4)}$. $\\mu(A)=${v.fix(st.closed, 3)}$, $\\mu(A^\\circ)=${v.fix(st.inside, 3)}$` + (Math.abs(st.limit - st.closed) > 1e-9 ? `; atoms on $\\partial A$ (circled): the limit is $${v.fix(st.limit, 3)}$, so the hypothesis $\\mu(\\partial A)=0$ matters.` : '; no atom on $\\partial A$, so the limit is $\\mu(A)$.'));
      },
    },
    {
      num: '3.10.5',
      kind: 'Theorem',
      name: 'Continuity theorem in ℝᵈ',
      statement: String.raw`Let $X_n$, $1\le n\le\infty$, be random vectors in $\R^d$ with characteristic functions $\varphi_n$. Then $X_n\Rightarrow X_\infty$ if and only if $\varphi_n(t)\to\varphi_\infty(t)$ for every $t\in\R^d$. More generally, if $\varphi_n\to\varphi$ pointwise with $\varphi$ continuous at $0$, then $\varphi$ is the characteristic function of some $X_\infty$ and $X_n\Rightarrow X_\infty$.`,
      idea: String.raw`Necessity: $x\mapsto e^{it\cdot x}$ is bounded and continuous. Sufficiency: along each line, $s\mapsto\varphi_n(s\theta)$ is the characteristic function of $\theta\cdot X_n$, so the one-dimensional theorem (3.3.17) makes each projection tight; taking $\theta=e_1,\dots,e_d$ makes the vectors tight (3.10.3). Every subsequential limit has characteristic function $\varphi_\infty$, hence the same law by the inversion formula (3.10.4), so the whole sequence converges.`,
      caption: String.raw`Steps to the three cube roots of unity in $\R^2$ (mean $0$, covariance $\frac12I$), standardized: $X_n=S_n/\sqrt{n/2}$. Left: the surface $\operatorname{Re}\varphi_n(t)$, $t\in[-4,4]^2$ (drag to rotate), coloured by the error $|\varphi_n(t)-e^{-|t|^2/2}|$; the Gaussian limit is the faint wireframe. For small $n$ the lattice shows up as ripples, which flatten as $n$ grows. Right: 800 seeded $X_n$ with the unit and $2$-sigma circles of the limit.`,
      deps: ['prob-3.3.17', 'prob-3.10.3', 'prob-3.10.4'],
      tags: ['characteristic functions', 'multivariate'],
      viz(v) {
        const nS = v.slider('$n$', 1, 100, 3, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const S3 = v.stage3d({ range: 4.6, height: 360, yaw: -0.6, pitch: 0.5, labels: ['t₁', 't₂', 'Re φ'] });
        const P = v.stage({ x: [-3.2, 3.2], y: [-3.2, 3.2], equal: true, height: 360, axes: true, title: 'samples of $X_n$' });
        const E = [0, 1, 2].map((k) => [Math.cos((2 * Math.PI * k) / 3), Math.sin((2 * Math.PI * k) / 3)]);
        const phiN = (n, t1, t2) => { const sc = Math.sqrt(n / 2); let re = 0, im = 0; E.forEach(([a, b]) => { const ph = (t1 * a + t2 * b) / sc; re += Math.cos(ph) / 3; im += Math.sin(ph) / 3; }); const r = Math.hypot(re, im), th = Math.atan2(im, re), rn = Math.pow(r, n); return [rn * Math.cos(n * th), rn * Math.sin(n * th)]; };
        let st = null;
        v.render(() => {
          const n = nS.value; let sup = 0;
          S3.surface((u, w) => [u, w, 1.8 * Math.exp(-(u * u + w * w) / 2)], [-4, 4], [-4, 4], { n: 18, color: 'faint', alpha: 0.12, wire: true });
          S3.surface((u, w) => { const f = phiN(n, u, w); return [u, w, 1.8 * f[0]]; }, [-4, 4], [-4, 4], { n: 34, alpha: 0.88, colorFn: (u, w) => { const f = phiN(n, u, w), e = Math.hypot(f[0] - Math.exp(-(u * u + w * w) / 2), f[1]); sup = Math.max(sup, e); return v.mix('accent', 'red', Math.min(1, e * 2)); } });
          const r = v.rng(seed * 97 + n), sc = Math.sqrt(n / 2);
          for (let i = 0; i < 800; i++) { let x = 0, y = 0; for (let j = 0; j < n; j++) { const e = E[Math.floor(3 * r())]; x += e[0]; y += e[1]; } P.dot(x / sc, y / sc, { r: 1.8, color: 'accent', alpha: 0.45 }); }
          P.circle(0, 0, 1, { color: 'green', width: 1.8 }); P.circle(0, 0, 2, { color: 'green', width: 1.4, dash: [5, 4] });
          v.legend([['accent', '$\\operatorname{Re}\\varphi_n$ (small error) / samples'], ['red', 'large $|\\varphi_n-\\varphi_\\infty|$'], ['green', '1- and 2-sigma circles of $N(0,I)$']]);
          st = { n, sup };
        });
        v.readout(() => st && `$n=${st.n}$: $\\max_{t\\in[-4,4]^2}|\\varphi_n(t)-e^{-|t|^2/2}|=${v.fix(st.sup, 4)}$ on the plotted grid.`);
      },
    },
    {
      num: '3.10.6',
      kind: 'Theorem',
      name: 'Cramér–Wold device',
      credit: 'Cramér & Wold, 1936',
      statement: String.raw`If $\theta\cdot X_n\Rightarrow\theta\cdot X_\infty$ for every $\theta\in\R^d$, then $X_n\Rightarrow X_\infty$. Weak convergence of random vectors is decided by their one-dimensional projections.`,
      idea: String.raw`$E\exp(i\theta\cdot X_n)$ is the characteristic function of $\theta\cdot X_n$ evaluated at $1$; convergence of all projections therefore gives $\varphi_n(\theta)\to\varphi_\infty(\theta)$ for every $\theta$, and the continuity theorem 3.10.5 applies. Projections onto the coordinate axes alone would not suffice: they only see the marginals.`,
      caption: String.raw`$X_n=S_n/\sqrt n$ for i.i.d. skewed, correlated steps $X=(E_1-1,\,E_1+E_2-2)$ with $E_i$ exponential, covariance $\Gamma=\begin{pmatrix}1&1\\1&2\end{pmatrix}$. Drag the gold point to choose a direction $\theta$. Left: 1500 seeded $X_n$ and the projection line. Middle: the histogram of $\theta\cdot X_n$ against $N(0,\theta^\top\Gamma\theta)$. Right: the Kolmogorov distance of the projection to its normal limit for all directions; as $n$ grows it shrinks in every direction at once.`,
      deps: ['prob-3.10.5'],
      tags: ['multivariate', 'weak convergence'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$', 1, 200, 4, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [-4, 4], y: [-5, 5], equal: true, height: 320, axes: true, title: 'cloud and direction $\\theta$' });
        const B = v.stage({ x: [-4, 4], y: [0, 0.5], height: 320, axes: 'box', gutter: true, xlabel: '$\\theta\\cdot X_n/\\sqrt{\\theta^\\top\\Gamma\\theta}$', title: 'one projection' });
        const C = v.stage({ x: [0, 180], y: [0, 0.2], height: 320, axes: 'box', gutter: true, xlabel: 'angle of $\\theta$ (degrees)', title: 'distance, all directions', xticks: [0, 45, 90, 135, 180] });
        const H = A.handle(Math.cos(1.1) * 3, Math.sin(1.1) * 3, { color: 'gold', label: 'θ', labelPos: 'ne', constrain: (x, y) => { const t = Math.atan2(y, x); return [3 * Math.cos(t), 3 * Math.sin(t)]; } });
        let sim = null, st = null;
        const ksN = (zs) => { const a = Float64Array.from(zs).sort(); let d = 0; for (let i = 0; i < a.length; i++) { const P = PhiN(M, a[i]); d = Math.max(d, Math.abs((i + 1) / a.length - P), Math.abs(i / a.length - P)); } return d; };
        v.render(() => {
          const n = nS.value;
          if (!sim || sim.n !== n || sim.seed !== seed) {
            const r = v.rng(seed * 101 + n), P = []; for (let i = 0; i < 1500; i++) { let x = 0, y = 0; for (let j = 0; j < n; j++) { const e1 = sampleExp(r) - 1, e2 = sampleExp(r) - 1; x += e1; y += e1 + e2; } P.push([x / Math.sqrt(n), y / Math.sqrt(n)]); }
            const curve = []; for (let deg = 0; deg <= 180; deg += 5) { const t = (deg * Math.PI) / 180, u = [Math.cos(t), Math.sin(t)], s = Math.sqrt(u[0] * u[0] + 2 * u[0] * u[1] + 2 * u[1] * u[1]); curve.push([deg, ksN(P.map((p) => (u[0] * p[0] + u[1] * p[1]) / s))]); }
            sim = { n, seed, P, curve };
          }
          const t = Math.atan2(H.y, H.x), u = [Math.cos(t), Math.sin(t)], s = Math.sqrt(u[0] * u[0] + 2 * u[0] * u[1] + 2 * u[1] * u[1]);
          sim.P.forEach(([x, y]) => A.dot(x, y, { r: 1.6, color: 'accent', alpha: 0.35 }));
          A.line(-6 * u[0], -6 * u[1], 6 * u[0], 6 * u[1], { color: 'gold', width: 1.5, dash: [5, 4] });
          ellipse(A, 0, 0, 1, 1, 2, 2, { color: 'green', width: 1.6 });
          const z = sim.P.map(([x, y]) => (u[0] * x + u[1] * y) / s);
          const Hd = M.histogram(z, { bins: Array.from({ length: 41 }, (_, i) => -4 + (8 * i) / 40) });
          B.setView(null, [0, Math.max(0.5, ...Hd.density) * 1.1]);
          B.hist(Hd, { density: true, color: 'accent', fillAlpha: 0.3, width: 1 });
          B.fn(PHI, { color: 'green', width: 2.2 });
          let deg = ((t * 180) / Math.PI + 360) % 180;
          C.setView(null, [0, Math.max(0.06, ...sim.curve.map((p) => p[1])) * 1.2]);
          C.hband(0, 0.035, { color: 'muted', alpha: 0.12 });
          C.path(sim.curve, { color: 'accent', width: 2.2 });
          C.vline(deg, { color: 'gold', width: 1.5 });
          v.legend([['accent', 'samples / projection / distance'], ['green', 'limit: 2-sigma ellipse, normal density'], ['muted', 'noise level', { area: true }]]);
          st = { n, deg, d: ksN(z), mx: Math.max(...sim.curve.map((p) => p[1])) };
        });
        v.readout(() => st && `$n=${st.n}$, direction $${v.fix(st.deg, 0)}^\\circ$: Kolmogorov distance of $\\theta\\cdot X_n$ to its normal limit $=${v.fix(st.d, 3)}$; worst direction: $${v.fix(st.mx, 3)}$.`);
      },
    },
    {
      num: '3.10.7',
      kind: 'Theorem',
      name: 'Multivariate central limit theorem',
      statement: String.raw`Let $X_1,X_2,\dots$ be i.i.d. random vectors in $\R^d$ with $EX_n=\mu$ and finite covariances $\Gamma_{ij}=E\big((X_{n,i}-\mu_i)(X_{n,j}-\mu_j)\big)$. Then $(S_n-n\mu)/\sqrt n\Rightarrow\chi$, where $\chi$ is multivariate normal with mean $0$ and covariance $\Gamma$:
$$E\exp(i\theta\cdot\chi)=\exp\Big(-\tfrac12\sum_{i,j}\theta_i\theta_j\Gamma_{ij}\Big).$$`,
      idea: String.raw`For each $\theta$, $\theta\cdot X_n$ is a real random variable with mean $0$ (after centring) and variance $\theta^\top\Gamma\theta$, so the one-dimensional CLT (3.4.1) gives $\theta\cdot S_n/\sqrt n\Rightarrow N(0,\theta^\top\Gamma\theta)$, which is the law of $\theta\cdot\chi$. The Cramér–Wold device (3.10.6) turns this into convergence of the vectors. Such a $\chi$ exists for every nonnegative definite $\Gamma$: write $\Gamma=A^\top A$ and take $\chi=YA$ with $Y$ standard normal.`,
      caption: String.raw`Steps $X=A(E-\mathbf1)$ with $E=(E_1,E_2)$ i.i.d. exponential (skewed), so $\Gamma=AA^\top$; drag the tips of the two columns of $A$ (orange arrows). Left: 1500 seeded standardized sums with the limiting 1- and 2-sigma ellipses of $\Gamma$ (green) and the sample covariance ellipse (orange, dashed). Right: the squared Mahalanobis lengths $x^\top\Gamma^{-1}x$ against the $\chi^2_2$ density $\frac12e^{-u/2}$; the fraction inside the 2-sigma ellipse should approach $1-e^{-2}\approx0.865$.`,
      deps: ['prob-3.10.6', 'prob-3.4.1'],
      see: ['stat-1.19'],
      tags: ['central limit theorem', 'multivariate'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n$', 1, 200, 3, { int: true, log: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const S = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, height: 360, weight: 1.2, axes: true, title: 'standardized sums $S_n/\\sqrt n$' });
        const R = v.stage({ x: [0, 12], y: [0, 0.55], height: 360, axes: 'box', gutter: true, xlabel: '$u=x^\\top\\Gamma^{-1}x$', title: 'Mahalanobis lengths vs $\\chi^2_2$' });
        const a1 = S.handle(1, 0.3, { color: 'orange', label: 'a₁', labelPos: 'e', constrain: (x, y) => [clampN(x, -2, 2), clampN(y, -2, 2)] });
        const a2 = S.handle(0.6, 1.1, { color: 'orange', label: 'a₂', labelPos: 'n', constrain: (x, y) => [clampN(x, -2, 2), clampN(y, -2, 2)] });
        let st = null;
        v.render(() => {
          const n = nS.value, A = [[a1.x, a2.x], [a1.y, a2.y]];
          const g11 = A[0][0] ** 2 + A[0][1] ** 2, g12 = A[0][0] * A[1][0] + A[0][1] * A[1][1], g22 = A[1][0] ** 2 + A[1][1] ** 2, det = g11 * g22 - g12 * g12;
          const r = v.rng(seed * 103 + n), P = [];
          for (let i = 0; i < 1500; i++) { let x = 0, y = 0; for (let j = 0; j < n; j++) { const e1 = sampleExp(r) - 1, e2 = sampleExp(r) - 1; x += A[0][0] * e1 + A[0][1] * e2; y += A[1][0] * e1 + A[1][1] * e2; } P.push([x / Math.sqrt(n), y / Math.sqrt(n)]); }
          P.forEach(([x, y]) => S.dot(x, y, { r: 1.6, color: 'accent', alpha: 0.35 }));
          if (det > 1e-6) { ellipse(S, 0, 0, g11, g12, g22, 1, { color: 'green', width: 2 }); ellipse(S, 0, 0, g11, g12, g22, 2, { color: 'green', width: 2 }); }
          const C = sampleCov(P); ellipse(S, C.mx, C.my, C.a, C.b, C.c, 2, { color: 'orange', width: 1.8, dash: [6, 4] });
          S.arrow(0, 0, a1.x, a1.y, { color: 'orange', width: 2 }); S.arrow(0, 0, a2.x, a2.y, { color: 'orange', width: 2 });
          let inside = 0; const u = det > 1e-6 ? P.map(([x, y]) => (g22 * x * x - 2 * g12 * x * y + g11 * y * y) / det) : [];
          u.forEach((q) => { if (q <= 4) inside++; });
          if (u.length) { const H = M.histogram(u, { bins: Array.from({ length: 41 }, (_, i) => (12 * i) / 40) }); R.hist(H, { density: true, color: 'accent', fillAlpha: 0.3, width: 1 }); }
          R.fn((q) => 0.5 * Math.exp(-q / 2), { domain: [0, 12], color: 'green', width: 2.2 });
          R.vline(4, { color: 'muted', width: 1, dash: [4, 4] });
          v.legend([['accent', 'samples'], ['green', 'limit: ellipses of $\\Gamma$, $\\chi^2_2$ density'], ['orange', 'columns of $A$; sample 2-sigma ellipse', { dash: true }]]);
          st = { n, frac: u.length ? inside / u.length : NaN, g: [g11, g12, g22], c: C, det };
        });
        v.readout(() => st && (st.det > 1e-6 ? `$\\Gamma=\\begin{pmatrix}${v.fix(st.g[0], 2)}&${v.fix(st.g[1], 2)}\\\\${v.fix(st.g[1], 2)}&${v.fix(st.g[2], 2)}\\end{pmatrix}$, sample covariance $\\begin{pmatrix}${v.fix(st.c.a, 2)}&${v.fix(st.c.b, 2)}\\\\${v.fix(st.c.b, 2)}&${v.fix(st.c.c, 2)}\\end{pmatrix}$. Inside the 2-sigma ellipse: $${v.fix(st.frac, 3)}$ (limit $0.865$).` : 'The columns of $A$ are parallel: $\\Gamma$ is singular and the limit lives on a line (a degenerate normal).'));
      },
    },
  ],
};
