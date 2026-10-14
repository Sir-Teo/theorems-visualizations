// Rudin, Functional Analysis — Chapter 8 (part 3): the lemma in several variables, L² solvability,
// Sobolev spaces and the elliptic estimate
//
// Numbering note: recalled, not checked against the book; items carry `verify: true`.

// complex arithmetic on [re, im]
const C = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
  exp: (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; },
  abs: (a) => Math.hypot(a[0], a[1]),
  scale: (a, k) => [a[0] * k, a[1] * k],
};
function span(vals, minSpan = 1, pad = 0.15) {
  let lo = Infinity, hi = -Infinity;
  for (const y of vals) if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  if (!isFinite(lo)) return [-1, 1];
  if (hi - lo < minSpan) { const m = (hi + lo) / 2; lo = m - minSpan / 2; hi = m + minSpan / 2; }
  const p = (hi - lo) * pad; return [lo - p, hi + p];
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const p10 = (k) => (k === 0 ? '1' : k === 1 ? '10' : '10' + (k < 0 ? '⁻' : '') + String(Math.abs(k)).split('').map((d) => SUP[+d]).join(''));
/** Ticks for a log10 axis: decades, or 1–2–5 mantissas when the range is short. */
const logTicks = (lo, hi) => {
  const t = [];
  for (let k = Math.floor(lo); k <= Math.ceil(hi); k++) for (const m of hi - lo < 2.5 ? [1, 2, 5] : [1]) { const y = k + Math.log10(m); if (y >= lo && y <= hi) t.push([y, m === 1 ? p10(k) : String(+(m * 10 ** k).toPrecision(2))]); }
  return t;
};
const decTicks = (lo, hi) => { const t = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) t.push([k, p10(k)]); return t; };
/** C^∞ bump supported in [c − r, c + r], equal to 1 at c. */
const bump = (x, c, r) => { const t = (x - c) / r, s = 1 - t * t; return s > 0 ? Math.E * Math.exp(-1 / s) : 0; };
/** In-place radix-2 FFT (length a power of two), forward sign e^{−2πi jk/n}. */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
/** Log-binned upper envelope of |F(ξ_k)|, ξ_k = k·dξ: returns [[log10 ξ, log10 max|F|], …]. */
function envelope(absF, dxi, t0, t1, dt) {
  const out = [];
  for (let t = t0; t < t1 - 1e-9; t += dt) {
    const k0 = Math.ceil(10 ** t / dxi), k1 = Math.min(absF.length - 1, Math.floor(10 ** (t + dt) / dxi));
    let m = 0; for (let k = k0; k <= k1; k++) m = Math.max(m, absF[k]);
    if (k1 >= k0 && m > 0) out.push([t + dt / 2, Math.log10(m)]);
  }
  return out;
}
/** Least-squares slope of the points with first coordinate in [a, b]. */
function slope(pts, a, b) {
  const q = pts.filter((p) => p[0] >= a && p[0] <= b && isFinite(p[1]));
  if (q.length < 3) return NaN;
  const mx = q.reduce((s, p) => s + p[0], 0) / q.length, my = q.reduce((s, p) => s + p[1], 0) / q.length;
  let sxy = 0, sxx = 0; for (const [x, y] of q) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; }
  return sxy / sxx;
}
/** Smallest eigenpair of a symmetric positive definite pentadiagonal Toeplitz matrix [e, d, c, d, e] of size n (banded Cholesky + inverse iteration). */
function minEigPenta(c, d, e, n) {
  const L0 = new Float64Array(n), L1 = new Float64Array(n), L2 = new Float64Array(n); // L[i][i], L[i][i−1], L[i][i−2]
  for (let i = 0; i < n; i++) {
    const l2 = i >= 2 ? e / L0[i - 2] : 0;
    const l1 = i >= 1 ? (d - (i >= 2 ? l2 * L1[i - 1] : 0)) / L0[i - 1] : 0;
    L2[i] = l2; L1[i] = l1; L0[i] = Math.sqrt(Math.max(c - l1 * l1 - l2 * l2, 1e-300));
  }
  const solve = (b) => {
    const y = new Float64Array(n), x = new Float64Array(n);
    for (let i = 0; i < n; i++) y[i] = (b[i] - (i >= 1 ? L1[i] * y[i - 1] : 0) - (i >= 2 ? L2[i] * y[i - 2] : 0)) / L0[i];
    for (let i = n - 1; i >= 0; i--) x[i] = (y[i] - (i + 1 < n ? L1[i + 1] * x[i + 1] : 0) - (i + 2 < n ? L2[i + 2] * x[i + 2] : 0)) / L0[i];
    return x;
  };
  // the matrix commutes with the flip i ↦ n−1−i, so run inverse iteration separately on even and odd vectors
  const run = (k) => {
    let x = Float64Array.from({ length: n }, (_, i) => Math.sin(k * Math.PI * (i + 1) / (n + 1)));
    for (let it = 0; it < 60; it++) { const y = solve(x); let nr = 0; for (const t of y) nr += t * t; nr = Math.sqrt(nr); x = y.map((t) => t / nr); }
    let num = 0; for (let i = 0; i < n; i++) { let g = c * x[i]; if (i >= 1) g += d * x[i - 1]; if (i + 1 < n) g += d * x[i + 1]; if (i >= 2) g += e * x[i - 2]; if (i + 2 < n) g += e * x[i + 2]; num += x[i] * g; }
    return { lam: num, vec: x };
  };
  const a = run(1), b = run(2);
  return a.lam <= b.lam ? a : b;
}

export default {
  book: 'fa',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.4
    {
      num: '8.4',
      kind: 'Lemma',
      name: 'The mean-value bound in several variables',
      statement: String.raw`Let $P$ be a polynomial in $n$ variables of degree $N$ with principal part $P_N$, and let $\eta\in\R^n$ satisfy $P_N(\eta)\ne0$. If $f$ is an entire function on $\C^n$, then for every $\zeta\in\C^n$
$$|P_N(\eta)\,f(\zeta)|\le\frac1{2\pi}\int_{-\pi}^{\pi}\big|f(\zeta+e^{i\theta}\eta)\,P(\zeta+e^{i\theta}\eta)\big|\,d\theta .$$`,
      idea: String.raw`Restrict everything to the complex line through $\zeta$ in the direction $\eta$. There $w\mapsto P(\zeta+w\eta)$ is a polynomial in one variable of degree $N$ whose leading coefficient is $P_N(\eta)$, and $w\mapsto f(\zeta+w\eta)$ is entire, so Lemma 8.3 applies verbatim at $w=0$. The point is that $|f(\zeta)|$ is controlled by $|fP|$ on a small circle around $\zeta$, even when $P(\zeta)=0$: this is what lets the proof of 8.5 divide $\hat\varphi$ by $P$.`,
      caption: String.raw`$n=2$, $f(\zeta)=e^{-(\zeta_1^2+\zeta_2^2)/4}$ (the Fourier transform of a Gaussian). Left: the real zero set of $P$ (red) and its characteristic directions ($P_N=0$, faint red lines). Drag the point $\xi$ (it may sit right on the zero set) and the direction $\eta$ on the unit circle. The complex circle $\xi+e^{i\theta}\eta$ lies over the dashed segment. Right: $|fP|$ around that circle, its mean (purple) and the bound $|P_N(\eta)f(\xi)|$ (orange). When $\eta$ approaches a characteristic direction, the bound degenerates to $0$.`,
      deps: ['fa-8.3', 'fa-8.1'],
      tags: ['polynomials', 'fundamental solutions'],
      verify: true,
      viz(v) {
        const M = v.M;
        const sq = (z) => C.mul(z, z);
        const PRE = {
          hyp: { label: '$\\xi_1^2-\\xi_2^2-\\frac12$', P: (a, b) => C.sub(C.sub(sq(a), sq(b)), [0.5, 0]), PN: (a, b) => a * a - b * b },
          circ: { label: '$\\xi_1^2+\\xi_2^2-1$', P: (a, b) => C.sub(C.add(sq(a), sq(b)), [1, 0]), PN: (a, b) => a * a + b * b },
          prod: { label: '$\\xi_1\\xi_2-\\frac12$', P: (a, b) => C.sub(C.mul(a, b), [0.5, 0]), PN: (a, b) => a * b },
        };
        const pre = v.select('$P(\\xi)=$', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'hyp');
        const L = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, height: 340, axes: true, ticks: false, title: 'real $\\xi$-plane: $P=0$ (red), direction $\\eta$' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [0, 1], height: 340, axes: 'box', xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], xlabel: 'θ', title: '$|f P|$ on the circle $\\xi+e^{i\\theta}\\eta$' });
        const hx = L.handle(-1.05, 0.72, { color: 'blue', label: 'ξ' });
        const he = L.handle(Math.cos(0.3), Math.sin(0.3), { color: 'purple', label: 'η', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        const f = (a, b) => C.exp(C.scale(C.add(sq(a), sq(b)), -0.25));
        let st = {};
        v.legend([['ink', '$|f(\\xi+e^{i\\theta}\\eta)P(\\xi+e^{i\\theta}\\eta)|$'], ['purple', 'its mean'], ['orange', '$|P_N(\\eta)f(\\xi)|$', { dash: true }]]);
        v.render(() => {
          const pr = PRE[pre.value], P = pr.P, ex = he.x, ey = he.y, x = hx.x, y = hx.y;
          const Pr = (a, b) => P([a, 0], [b, 0])[0];
          L.raster((a, b) => (Pr(a, b) > 0 ? [60, 110, 220, 30] : [230, 130, 40, 30]), { key: pre.value, res: 3 });
          const n = 200, h = 5.2 / n, zs = [];
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            const a = -2.6 + i * h, b = -2.6 + j * h, p00 = Pr(a, b), p10 = Pr(a + h, b), p01 = Pr(a, b + h);
            if (p00 * p10 < 0) zs.push([a + h * p00 / (p00 - p10), b]);
            if (p00 * p01 < 0) zs.push([a, b + h * p00 / (p00 - p01)]);
          }
          L.dots(zs, { color: 'red', r: 1.5 });
          // characteristic directions: P_N(cos t, sin t) = 0
          for (let i = 0; i < 360; i++) { const t0 = Math.PI * i / 360, t1 = Math.PI * (i + 1) / 360, q0 = pr.PN(Math.cos(t0), Math.sin(t0)), q1 = pr.PN(Math.cos(t1), Math.sin(t1)); if (q0 === 0 || q0 * q1 < 0) { const t = t0 + (t1 - t0) * q0 / (q0 - q1 || 1); L.line(-4 * Math.cos(t), -4 * Math.sin(t), 4 * Math.cos(t), 4 * Math.sin(t), { color: 'red', width: 1, alpha: 0.35, dash: [5, 4] }); } }
          L.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 3] });
          L.arrow(0, 0, ex, ey, { color: 'purple', width: 2 });
          L.line(x - ex, y - ey, x + ex, y + ey, { color: 'purple', width: 2.4, dash: [6, 4] });
          L.dot(x - ex, y - ey, { color: 'purple', r: 3 }); L.dot(x + ex, y + ey, { color: 'purple', r: 3 });
          const ths = M.linspace(-Math.PI, Math.PI, 721);
          const vals = ths.map((t) => { const w = [Math.cos(t), Math.sin(t)], a = C.add([x, 0], C.scale(w, ex)), b = C.add([y, 0], C.scale(w, ey)); return C.abs(C.mul(f(a, b), P(a, b))); });
          const mean = vals.slice(0, -1).reduce((s, q) => s + q, 0) / (vals.length - 1);
          const PNe = pr.PN(ex, ey), fx = C.abs(f([x, 0], [y, 0])), bound = Math.abs(PNe) * fx;
          R.setView(null, [0, Math.max(...vals, mean, bound) * 1.12 + 1e-9]);
          R.path(ths.map((t, i) => [t, vals[i]]), { color: 'ink', width: 2.2 });
          R.hline(mean, { color: 'purple', width: 2.2 });
          R.hline(bound, { color: 'orange', width: 2, dash: [6, 4] });
          st = { mean, bound, PNe, Px: Pr(x, y), fx };
        });
        v.readout(() => {
          const s = st;
          return `$P_N(\\eta)=${v.fix(s.PNe, 3)}$, $P(\\xi)=${v.fix(s.Px, 3)}$. Mean of $|fP|$ on the circle $=${v.fix(s.mean, 4)}\\;\\ge\\;|P_N(\\eta)f(\\xi)|=${v.fix(s.bound, 4)}$` + (Math.abs(s.Px) < 0.05 ? ' — although $P(\\xi)\\approx0$, $|f(\\xi)|$ is still controlled.' : Math.abs(s.PNe) < 0.05 ? ' — $\\eta$ is (nearly) characteristic, so the bound says almost nothing.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 8.6
    {
      num: '8.6',
      kind: 'Theorem',
      name: 'L² estimates and solvability on bounded sets',
      statement: String.raw`Let $P(D)\ne0$ have order $N$ and let $\Omega\subset\R^n$ be bounded and open. There is a constant $c>0$, depending only on $P$ and on the size of $\Omega$, such that
$$\norm{P(D)\varphi}_2\ge c\,\norm{\varphi}_2\qquad(\varphi\in\mathscr D(\Omega)).$$
Consequently, for every $v\in L^2(\Omega)$ there is a $u\in L^2(\Omega)$ with $P(D)u=v$ in $\mathscr D'(\Omega)$.`,
      idea: String.raw`Translate so that $\Omega$ lies in the ball of radius $r$ about $0$, and pick $\eta$ with $|\eta|=1$, $P_N(\eta)\ne0$. Apply Lemma 8.4 to $\hat\varphi$ (entire, by Paley–Wiener 7.22) on circles of radius $\rho$, square, and integrate over $\xi\in\R^n$. Moving $\hat\psi$ to $\operatorname{Im}\zeta=y$ multiplies $\psi$ by $e^{y\cdot x}$, which costs at most $e^{\rho r}$ in $L^2$ by Plancherel (7.9). Hence $\norm{P(D)\varphi}\ge|P_N(\eta)|\rho^Ne^{-\rho r}\norm\varphi$, which is best at $\rho=N/r$. For the equation, apply the estimate to the transposed operator: $P(-D)\varphi\mapsto\int v\varphi$ is then a bounded functional on a subspace of $L^2(\Omega)$, and the Riesz representation (12.3) of an extension produces $u$.`,
      caption: String.raw`$n=1$, $\Omega=(-r,r)$. Choose $P(D)\varphi=\varphi'$ or $\varphi''+k^2\varphi$. The black curve is the **best** constant $c(r)=\inf_\varphi\norm{P(D)\varphi}/\norm\varphi$, computed as the smallest singular value of a finite-difference matrix acting on functions that vanish outside $\Omega$. The orange dashed curve is the constant the proof gives, $(N/er)^N$. Both decay as $\Omega$ grows, and the black one always stays above the orange one. For $\varphi''+k^2\varphi$ the near-extremal $\varphi$ (bottom, blue) is a wave $\cos kx$ under a long envelope, which almost solves $P(D)\varphi=0$. Its defect $P(D)\varphi$ (green) shrinks like $k\pi/r$ as $\Omega$ grows, but it is never zero: a compactly supported $\varphi$ cannot solve the equation exactly.`,
      deps: ['fa-8.4', 'fa-7.22', 'fa-7.9', 'fa-12.3'],
      tags: ['differential equations', 'a priori estimates', 'L² theory'],
      verify: true,
      viz(v) {
        const M = v.M;
        const op = v.select('$P(D)\\varphi=$', [{ value: 'd1', label: "$\\varphi'$" }, { value: 'helm', label: "$\\varphi''+k^2\\varphi$" }], 'helm', { onChange: (val) => { kS.el.hidden = val !== 'helm'; } });
        const kS = v.slider('$k$', 0, 4, 2.2, { step: 0.01 });
        const rS = v.slider('half-length $r$ of $\\Omega=(-r,r)$', 0.3, 6, 2.5, { step: 0.01 });
        const T = v.stage({ x: [0.3, 6], y: [-2.5, 1.5], height: 250, full: true, axes: 'box', xlabel: 'r', yticks: decTicks(-2, 1), title: 'best constant $c(r)$ (log scale) and the constant from the proof' });
        const B = v.stage({ x: [-6, 6], y: [-1.2, 1.2], height: 200, full: true, axes: true, title: 'near-extremal $\\varphi\\in\\mathscr D(\\Omega)$ and $P(D)\\varphi$' });
        const n = 160;
        const best = (kind, k, r) => {
          const h = 2 * r / (n + 1);
          if (kind === 'd1') { const res = minEigPenta(2 / (h * h), -1 / (h * h), 0, n); return { c: Math.sqrt(res.lam), vec: res.vec, h }; }
          const dd = -2 / (h * h) + k * k;
          const res = minEigPenta(2 / h ** 4 + dd * dd, 2 * dd / (h * h), 1 / h ** 4, n);
          return { c: Math.sqrt(res.lam), vec: res.vec, h };
        };
        let curve = { key: '' }, st = {};
        v.legend([['ink', 'best $c(r)$'], ['orange', 'proof: $(N/er)^N$', { dash: true }], ['blue', '$\\varphi$'], ['green', '$P(D)\\varphi$ (same scale)']]);
        v.render(() => {
          const kind = op.value, k = kS.value, r = rS.value, N = kind === 'd1' ? 1 : 2;
          const key = `${kind}|${kind === 'helm' ? k : ''}`;
          if (curve.key !== key) { const rs = M.linspace(0.3, 6, 115); curve = { key, pts: rs.map((rr) => [rr, Math.log10(best(kind, k, rr).c)]) }; }
          T.path(curve.pts, { color: 'ink', width: 2.4 });
          T.fn((rr) => N * Math.log10(N / (Math.E * rr)), { color: 'orange', width: 2, dash: [6, 4] });
          const cur = best(kind, k, r), proof = (N / (Math.E * r)) ** N;
          T.vline(r, { color: 'muted', width: 1, dash: [3, 3] });
          T.dot(r, Math.log10(cur.c), { color: 'ink', r: 4.5 });
          // extremal φ and Lφ on the grid x_j = −r + j h
          const h = cur.h, phi = [0, ...cur.vec, 0], xs = phi.map((_, j) => -r + j * h);
          const mx = Math.max(...phi.map(Math.abs)), sg = phi[Math.floor(phi.length / 2)] < 0 ? -1 : 1;
          const ph = phi.map((p) => sg * p / mx);
          const Lp = ph.map((p, j) => (kind === 'd1' ? (j + 1 < ph.length ? (ph[j + 1] - p) / h : 0) : ((j ? ph[j - 1] : 0) - 2 * p + (j + 1 < ph.length ? ph[j + 1] : 0)) / (h * h) + k * k * p));
          B.setView([-Math.max(r * 1.08, 1), Math.max(r * 1.08, 1)], span([...ph, ...Lp, -1, 1], 1, 0.1));
          B.vband(-r, r, { color: 'orange', alpha: 0.07 });
          B.path(xs.map((x, j) => [x, Lp[j]]), { color: 'green', width: 1.8 });
          B.path(xs.map((x, j) => [x, ph[j]]), { color: 'blue', width: 2.6 });
          st = { c: cur.c, proof, r, kind, k };
        });
        v.readout(() => {
          const s = st;
          const dir = s.kind === 'd1' ? ` The sharp constant is $\\pi/2r=${v.fix(Math.PI / (2 * s.r), 4)}$ (Wirtinger).` : s.k < 0.3 ? ` For $k=0$ the sharp constant is $(4.730/2r)^2=${v.fix((4.730 / (2 * s.r)) ** 2, 4)}$ (the clamped beam).` : ` For large $r$, $c(r)\\approx k\\pi/r=${v.fix(s.k * Math.PI / s.r, 4)}$ (a wave under an envelope).`;
          return `$r=${v.fix(s.r, 2)}$: best $c=${v.fix(s.c, 4)}\\;\\ge\\;(N/er)^N=${v.fix(s.proof, 4)}$.` + dir;
        });
      },
    },
    // ------------------------------------------------------------------ 8.9
    {
      num: '8.9',
      kind: 'Definition',
      name: 'Sobolev spaces Hˢ and Hˢ_loc',
      statement: String.raw`For real $s$, $H^s(\R^n)$ is the space of tempered distributions $u$ whose Fourier transform is a function with
$$\norm u_{(s)}^2=\int_{\R^n}(1+|\xi|^2)^s\,|\hat u(\xi)|^2\,dm_n(\xi)<\infty .$$
If $\Omega\subset\R^n$ is open, $u\in\mathscr D'(\Omega)$ belongs to $H^s_{loc}(\Omega)$ if $\psi u\in H^s$ for every $\psi\in\mathscr D(\Omega)$. Thus $H^0=L^2$, $H^t\subset H^s$ for $s<t$, and for an integer $p\ge0$, $H^p$ consists of the $f\in L^2$ with $D^\alpha f\in L^2$ for $|\alpha|\le p$.`,
      idea: String.raw`The weight $(1+|\xi|^2)^{s/2}$ measures smoothness by the decay of $\hat u$: by Plancherel (7.9) and $(D^\alpha u)^\wedge=\xi^\alpha\hat u$, having $p$ derivatives in $L^2$ means $(1+|\xi|^2)^{p/2}\hat u\in L^2$. Real and negative $s$ interpolate and extend this scale. $\delta\in H^s$ exactly when $s<-n/2$. Sobolev's lemma (7.25) says that $H^s_{loc}\subset C^{(r)}$ when $s>r+\frac n2$.`,
      caption: String.raw`One variable. Choose $u$ and the order $s$. Middle: $\xi\,(1+\xi^2)^s|\hat u(\xi)|^2$ (locally averaged over the oscillations) against $\log_{10}\xi$. The area under this curve is $\norm u_{(s)}^2$, so $u\in H^s$ exactly when the curve eventually goes down (dashed: the borderline, slope $0$). Right: the truncated norm $\int_{|\xi|<\Xi}(1+\xi^2)^s|\hat u|^2$ against $\Xi$. It levels off for $s<s^*$ and keeps growing for $s\ge s^*$.`,
      deps: ['fa-7.15', 'fa-7.9'],
      see: ['fa-7.25'],
      tags: ['Sobolev spaces', 'Fourier transform'],
      verify: true,
      viz(v) {
        const M = v.M;
        const sinc = (t) => (Math.abs(t) < 1e-8 ? 1 : Math.sin(t) / t);
        const U = {
          delta: { label: '$\\delta$', u2: () => 1, s: -0.5, x: null },
          ddelta: { label: "$\\delta'$", u2: (x) => x * x, s: -1.5, x: null },
          box: { label: '$\\chi_{[-1,1]}$', u2: (x) => 4 * sinc(x) ** 2, s: 0.5, x: (t) => (Math.abs(t) <= 1 ? 1 : 0) },
          tent: { label: '$(1-|x|)^+$', u2: (x) => sinc(x / 2) ** 4, s: 1.5, x: (t) => Math.max(0, 1 - Math.abs(t)) },
          gauss: { label: '$e^{-x^2/2}$', u2: (x) => 2 * Math.PI * Math.exp(-x * x), s: Infinity, x: (t) => Math.exp(-t * t / 2) },
        };
        const which = v.select('$u=$', Object.entries(U).map(([value, o]) => ({ value, label: o.label })), 'box');
        const sS = v.slider('order $s$', -3, 3, 0.25, { step: 0.05 });
        const X = v.stage({ x: [-2.5, 2.5], y: [-1.4, 1.6], height: 140, full: true, axes: true, ticks: false, title: '' });
        const A = v.stage({ x: [-1, 4], y: [-6, 3], height: 300, axes: 'box', xticks: decTicks(-1, 4), yticks: decTicks(-6, 3), xlabel: 'ξ', title: '$\\xi(1+\\xi^2)^s|\\hat u(\\xi)|^2$ (log–log)' });
        const B = v.stage({ x: [-1, 4], y: [-1, 4], height: 300, axes: 'box', xticks: decTicks(-1, 4), xlabel: 'Ξ', title: '$\\int_{|\\xi|<\\Xi}(1+\\xi^2)^s|\\hat u|^2\\,d\\xi$ (log scale)' });
        let st = {};
        v.legend([['blue', 'local average of $\\xi(1+\\xi^2)^s|\\hat u|^2$'], ['muted', 'borderline (slope 0)', { dash: true }], ['green', 'truncated norm: converges'], ['red', 'truncated norm: diverges']]);
        v.render(() => {
          const o = U[which.value], s = sS.value, g = (x) => (1 + x * x) ** s * o.u2(x);
          // u in x-space
          X.setTitle(`$u=${o.label.slice(1, -1)}$`);
          if (o.x) X.fn(o.x, { color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.12, n: 600 });
          else if (which.value === 'delta') X.arrow(0, 0, 0, 1.4, { color: 'blue', width: 2.6 });
          else { X.arrow(-0.06, 0, -0.06, 1.4, { color: 'blue', width: 2.6 }); X.arrow(0.06, 0, 0.06, -1.3, { color: 'blue', width: 2.6 }); }
          // binned local averages on log10 ξ ∈ [−1, 4]
          const dt = 0.01, pts = [], cum = []; let tot = 0;
          tot += 2 * M.integrate(g, 0, 0.1, 40);
          for (let t = -1; t < 4 - 1e-9; t += dt) {
            const a = 10 ** t, b = 10 ** (t + dt); let m = 0; const K = 40;
            for (let i = 0; i < K; i++) m += g(a + (b - a) * (i + 0.5) / K);
            m /= K; tot += 2 * m * (b - a);
            // for display, average over at least one full period of the oscillation
            const q = 10 ** (t + dt / 2), w = Math.max((b - a) / 2, Math.PI), lo = Math.max(0, q - w);
            let ma = 0; for (let i = 0; i < K; i++) ma += g(lo + (q + w - lo) * (i + 0.5) / K);
            pts.push([t + dt / 2, Math.log10(Math.max(1e-300, q * ma / K))]);
            cum.push([t + dt, Math.log10(tot)]);
          }
          A.setView(null, span(pts.map((p) => Math.max(p[1], -12)), 3, 0.08));
          A.setTicks(decTicks(-1, 4), decTicks(...A.bounds.y));
          const tail = pts.slice(-60), sl = slope(tail, 3.4, 4);
          const yEnd = pts[pts.length - 1][1];
          A.hline(yEnd, { color: 'muted', width: 1.4, dash: [6, 4] });
          A.path(pts, { color: 'blue', width: 2.4 });
          const conv = s < o.s;
          B.setView(null, span(cum.map((p) => p[1]), 1, 0.1));
          B.setTicks(decTicks(-1, 4), logTicks(...B.bounds.y));
          B.path(cum, { color: conv ? 'green' : 'red', width: 2.6 });
          st = { s, star: o.s, conv, last: tot, sl };
        });
        v.readout(() => {
          const S = st, star = S.star === Infinity ? '\\infty' : v.fix(S.star, 1);
          return `$u\\in H^s$ iff $s<s^*=${star}$. Now $s=${v.fix(S.s, 2)}$: ` + (S.conv ? `**$u\\in H^s$**, $\\int(1+\\xi^2)^s|\\hat u|^2d\\xi\\approx${v.fix(S.last, 3)}$ (the integrand falls off with slope $${v.fix(S.sl, 2)}$).` : `**$u\\notin H^s$** — the integrand falls off too slowly (slope $${v.fix(S.sl, 2)}\\ge0$), and the truncated norms grow without bound.`);
        });
      },
    },
    // ------------------------------------------------------------------ 8.10
    {
      num: '8.10',
      kind: 'Lemma',
      name: 'Basic properties of Sobolev spaces',
      statement: String.raw`(a) Every distribution with compact support in $\R^n$ belongs to $H^s$ for some $s$.
(b) If $\psi\in\mathscr S_n$ and $u\in H^s$, then $\psi u\in H^s$, and $\norm{\psi u}_{(s)}\le C\norm u_{(s)}$ with $C$ depending on $\psi$ and $s$.
(c) $D^\alpha$ maps $H^s$ into $H^{s-|\alpha|}$, and $H^s_{loc}(\Omega)$ into $H^{s-|\alpha|}_{loc}(\Omega)$.`,
      idea: String.raw`(a) By the Paley–Wiener–Schwartz theorem (7.23), $\hat u$ grows at most like $(1+|\xi|)^N$, so $s<-N-\frac n2$ works. (b) $(\psi u)^\wedge$ is the convolution of $\hat\psi$ with $\hat u$. **Peetre's inequality**
$$(1+|\xi|^2)^{s/2}\le2^{|s|/2}(1+|\xi-\eta|^2)^{|s|/2}(1+|\eta|^2)^{s/2}$$
moves the weight from $\xi$ to $\eta$ at the price of a polynomial factor in $\xi-\eta$, which the rapidly decreasing $\hat\psi(\xi-\eta)$ absorbs. Then Young's inequality bounds the convolution in $L^2$. (c) $|\xi^\alpha|\le(1+|\xi|^2)^{|\alpha|/2}$.`,
      caption: String.raw`Left: Peetre's ratio $(1+\xi^2)^{s/2}/\big[(1+(\xi-\eta)^2)^{|s|/2}(1+\eta^2)^{s/2}\big]$ on the $(\xi,\eta)$-plane, in $\log_2$, coloured from $-6$ (dark) up to the bound $|s|/2$ (bright). Its actual maximum, in the corner, stays below the bound. Drag the point to read off the factors. Right: $u=\chi_{[-1,1]}\in H^s$ for $s<\frac12$ and $\psi u$ for a bump $\psi$ (drag its centre). $|\widehat{\psi u}|$ never decays slower than $|\hat u|\sim\xi^{-1}$. It decays faster when $\psi$ vanishes at both jumps: multiplication by $\psi$ can only improve membership in $H^s$.`,
      deps: ['fa-8.9', 'fa-7.23', 'fa-7.19'],
      tags: ['Sobolev spaces', 'Fourier transform'],
      verify: true,
      viz(v) {
        const M = v.M;
        const sS = v.slider('$s$', -3, 3, 1.5, { step: 0.05 });
        const cS = v.slider('centre of $\\psi$', -2.5, 2.5, 0.7, { step: 0.01 });
        const rS = v.slider('radius of $\\psi$', 0.3, 2, 0.8, { step: 0.01 });
        const L = v.stage({ x: [-20, 20], y: [-20, 20], equal: true, height: 330, axes: true, xlabel: 'ξ', ylabel: 'η', title: '$\\log_2$ of Peetre’s ratio' });
        const R = v.stage({ x: [0, 2.3], y: [-6, 1], height: 330, axes: 'box', xticks: decTicks(0, 2), yticks: decTicks(-6, 1), xlabel: 'ξ', title: '$|\\hat u|$ and $|\\widehat{\\psi u}|$ (envelopes, log–log)' });
        const hp = L.handle(12, 6, { color: 'ink', label: '(ξ,η)' });
        let st = {}, cache = { key: '' };
        v.legend([['gold', '$\\psi$ on $[-1,1]$ (inset)'], ['blue', '$|\\hat u|$, $u=\\chi_{[-1,1]}$'], ['green', '$|\\widehat{\\psi u}|$']]);
        v.render(() => {
          const s = sS.value, c = cS.value, r = rS.value;
          const lr = (x, y) => (s / 2) * Math.log2(1 + x * x) - (Math.abs(s) / 2) * Math.log2(1 + (x - y) ** 2) - (s / 2) * Math.log2(1 + y * y);
          L.heat(lr, { range: [-6, Math.abs(s) / 2 + 1e-6], cmap: 'viridis', res: 3, key: `p${s}` });
          let mx = -Infinity; for (let i = 0; i <= 80; i++) for (let j = 0; j <= 80; j++) mx = Math.max(mx, lr(-20 + i / 2, -20 + j / 2));
          L.corner(`max = ${v.fix(mx, 3)} ≤ |s|/2 = ${v.fix(Math.abs(s) / 2, 3)}`, 'tl', { color: 'ink', weight: 700, size: 12 });
          L.dot(hp.x, hp.y, { color: 'ink', r: 2 });
          // Fourier transforms on [−1, 1] by Simpson (ψ smooth inside, so the only roughness is at ±1)
          const key = `${c}|${r}`;
          if (cache.key !== key) {
            const NX = 1200, hx = 2 / NX, xi = [], U1 = [], U2 = [];
            const w = (j) => (j === 0 || j === NX ? 1 : j % 2 ? 4 : 2) * hx / 3;
            for (let t = 0; t <= 2.3; t += 0.004) {
              const q = 10 ** t; let a = 0, b = 0, a2 = 0, b2 = 0;
              for (let j = 0; j <= NX; j++) { const x = -1 + j * hx, co = Math.cos(q * x), si = Math.sin(q * x), p = bump(x, c, r), wj = w(j); a += wj * co; b -= wj * si; a2 += wj * p * co; b2 -= wj * p * si; }
              xi.push(t); U1.push(Math.hypot(a, b)); U2.push(Math.hypot(a2, b2));
            }
            const env = (Y) => { const out = []; for (let i = 0; i < xi.length; i += 12) { let m = 0; for (let k = i; k < Math.min(xi.length, i + 12); k++) m = Math.max(m, Y[k]); out.push([xi[Math.min(xi.length - 1, i + 6)], Math.log10(Math.max(m, 1e-7))]); } return out; };
            cache = { key, e1: env(U1), e2: env(U2) };
          }
          const ys = [...cache.e1, ...cache.e2].map((p) => p[1]), ylo = Math.max(-7, Math.min(...ys) - 0.3);
          R.setView(null, [ylo, 1]); R.setTicks(decTicks(0, 2), decTicks(ylo, 1));
          R.path(cache.e1, { color: 'blue', width: 2.4 });
          R.path(cache.e2, { color: 'green', width: 2.4 });
          // inset: ψ and the interval
          const yb = R.bounds.y, ix = (x) => 1.25 + 0.42 * (x + 2.5) / 5 * 2.2, iy = (y) => yb[1] - (yb[1] - yb[0]) * (0.3 - 0.22 * y);
          R.rect(ix(-2.5), iy(-0.1), ix(2.5), iy(1.15), { color: 'muted', width: 1 });
          R.line(ix(-1), iy(0), ix(1), iy(0), { color: 'blue', width: 3 });
          R.path(M.linspace(-2.5, 2.5, 200).map((x) => [ix(x), iy(bump(x, c, r))]), { color: 'gold', width: 2 });
          const sl1 = slope(cache.e1, 1.3, 2.3), sl2 = slope(cache.e2, 1.3, 2.3);
          const x = hp.x, y = hp.y;
          st = { s, r1: (1 + x * x) ** (s / 2), r2: (1 + (x - y) ** 2) ** (Math.abs(s) / 2), r3: (1 + y * y) ** (s / 2), sl1, sl2, edge: Math.max(bump(-1, c, r), bump(1, c, r)) };
        });
        v.readout(() => {
          const S = st, q = S.r1 / (S.r2 * S.r3);
          return `At the point: $(1+\\xi^2)^{s/2}=${v.fmt(S.r1, 4)}$, $(1+(\\xi-\\eta)^2)^{|s|/2}(1+\\eta^2)^{s/2}=${v.fmt(S.r2 * S.r3, 4)}$, ratio $${v.fix(q, 3)}\\le2^{|s|/2}=${v.fix(2 ** (Math.abs(S.s) / 2), 3)}$. Decay rates: $|\\hat u|\\sim\\xi^{${v.fix(S.sl1, 2)}}$, $|\\widehat{\\psi u}|\\sim\\xi^{${v.fix(S.sl2, 2)}}$` + (S.edge < 1e-9 ? ' — $\\psi$ vanishes at both jumps, so $\\psi u$ is smooth.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 8.11
    {
      num: '8.11',
      kind: 'Theorem',
      name: 'Elliptic operators gain N derivatives',
      statement: String.raw`Suppose $P(D)$ is elliptic of order $N$, $\Omega\subset\R^n$ is open, $s\in\R$, $u\in\mathscr D'(\Omega)$, and $P(D)u\in H^s_{loc}(\Omega)$. Then $u\in H^{s+N}_{loc}(\Omega)$.`,
      idea: String.raw`For compactly supported $u$ this is division by $P$. By 8.8, $(1+|\xi|^2)^{N/2}\le C|P(\xi)|$ for $|\xi|\ge R$, so $(1+|\xi|^2)^{(s+N)/2}|\hat u|\le C(1+|\xi|^2)^{s/2}|P\hat u|$ there, and the ball $|\xi|<R$ costs nothing because $\hat u$ is continuous. In general, localise: with $\psi\in\mathscr D(\Omega)$, $P(D)(\psi u)=\psi P(D)u+\sum(\text{derivatives of }\psi)\cdot(\text{derivatives of }u\text{ of order}<N)$. If $u\in H^t_{loc}$, the commutator terms lie in $H^{t-N+1}_{loc}$ (8.10), so $\psi u\in H^{\min(s,\,t-N+1)+N}$. Starting from the local order given by 8.10(a) and gaining one derivative per step reaches $s+N$ after finitely many steps.`,
      caption: String.raw`$P(D)u=-u''+u$ on $\R$ ($N=2$), with $f=-u''+u$ a box on $[-0.6,0.6]$ plus $c\,\delta_{x_0}$, and $u=\frac12e^{-|x|}*f$. Drag the window $\psi$ (green; set its radius with the slider). Right: the decay of $|\widehat{\psi f}|$ (orange) and $|\widehat{\psi u}|$ (purple), computed by an FFT on $2^{16}$ points. The window's own smooth transform dominates at first, and the power laws take over at high frequency, where the slopes are fitted (the grey strip is the rounding floor). Over a jump of $f$ they decay like $\xi^{-1}$ and $\xi^{-3}$. Over the $\delta$ they decay like $\xi^{0}$ and $\xi^{-2}$. Away from both, everything decays rapidly. In each case $u$ is two orders smoother than $f$ — locally, wherever you look.`,
      deps: ['fa-8.8', 'fa-8.9', 'fa-8.10'],
      tags: ['elliptic operators', 'regularity', 'Sobolev spaces'],
      verify: true,
      viz(v) {
        const M = v.M;
        const a = 0.6;
        const cS = v.slider('strength $c$ of $\\delta_{x_0}$', 0, 1, 0.7, { step: 0.01 });
        const rS = v.slider('radius of the window $\\psi$', 0.3, 1.5, 0.45, { step: 0.01 });
        const L = v.stage({ x: [-3, 3], y: [-0.25, 1.35], height: 320, axes: true, title: '$f=-u\'\'+u$ (orange), $u$ (purple), window $\\psi$ (green)' });
        const R = v.stage({ x: [1, 3.9], y: [-15, 0], height: 320, axes: 'box', xticks: decTicks(1, 4), yticks: decTicks(-15, 0), xlabel: 'ξ', title: '$|\\widehat{\\psi f}|$ and $|\\widehat{\\psi u}|$ (envelopes, log–log)' });
        const hx = L.handle(0.6, 0, { color: 'green', label: 'ψ', labelPos: 's', constrain: (x) => [M.clamp(x, -2.6, 2.6), 0] });
        const hd = L.handle(1.7, 1.15, { color: 'orange', label: 'x₀', constrain: (x) => [M.clamp(x, -2.6, 2.6), 1.15] });
        const NF = 65536, X0 = -4.8, LEN = 9.6, h = LEN / NF, dxi = 2 * Math.PI / LEN;
        let st = {}, cache = { key: '' };
        v.legend([['orange', '$\\widehat{\\psi f}$'], ['purple', '$\\widehat{\\psi u}$'], ['muted', 'reference slopes $0,-1,-2,-3$', { dash: true }]]);
        v.render(() => {
          const c = cS.value, r = rS.value, xc = hx.x, x0 = hd.x;
          const ub = (x) => (Math.abs(x) <= a ? 1 - Math.exp(-a) * Math.cosh(x) : Math.sinh(a) * Math.exp(-Math.abs(x)));
          const u = (x) => ub(x) + c * 0.5 * Math.exp(-Math.abs(x - x0));
          // left panel
          L.vband(xc - r, xc + r, { color: 'green', alpha: 0.08 });
          L.fn((x) => bump(x, xc, r) * 1.2, { color: 'green', width: 1.6, domain: [xc - r, xc + r] });
          L.fn((x) => (Math.abs(x) <= a ? 1 : 0), { color: 'orange', width: 2.2, fill: 'orange', fillAlpha: 0.12, n: 1200 });
          if (c > 0) L.arrow(x0, 0, x0, 0.2 + c, { color: 'orange', width: 2.6 });
          L.fn(u, { color: 'purple', width: 2.6, n: 900 });
          // spectra by FFT
          const key = `${c}|${r}|${xc}|${x0}`;
          if (cache.key !== key) {
            const re1 = new Float64Array(NF), im1 = new Float64Array(NF), re2 = new Float64Array(NF), im2 = new Float64Array(NF);
            for (let j = 0; j < NF; j++) { const x = X0 + j * h, p = bump(x, xc, r); re1[j] = p * (Math.abs(x) <= a ? (Math.abs(Math.abs(x) - a) < h / 2 ? 0.5 : 1) : 0); re2[j] = p * u(x); }
            fft(re1, im1); fft(re2, im2);
            const pd = c * bump(x0, xc, r);
            const A1 = new Float64Array(NF / 2), A2 = new Float64Array(NF / 2);
            for (let k = 0; k < NF / 2; k++) {
              const xi = k * dxi, co = Math.cos(X0 * xi), si = Math.sin(X0 * xi);   // F(ξ) ≈ h e^{−i X0 ξ} Σ_j g_j e^{−2πi jk/n}
              const fr = h * (re1[k] * co + im1[k] * si), fi = h * (im1[k] * co - re1[k] * si);
              A1[k] = Math.hypot(fr + pd * Math.cos(x0 * xi), fi - pd * Math.sin(x0 * xi));
              A2[k] = h * Math.hypot(re2[k], im2[k]);
            }
            const e1 = envelope(A1, dxi, 1, 3.9, 0.05), e2 = envelope(A2, dxi, 1, 3.9, 0.05);
            cache = { key, e1, e2, s1: slope(e1, 3.0, 3.85), s2: slope(e2, 3.0, 3.85) };
          }
          const clip = (e) => e.map(([x, y]) => [x, Math.max(y, -14.5)]);
          const hi = Math.max(...[...cache.e1, ...cache.e2].map((p) => p[1])) + 0.6;
          R.setView(null, [-15, hi]); R.setTicks(decTicks(1, 3), decTicks(-15, hi).filter((t) => t[0] % 2 === 0));
          R.hband(-15, -14, { color: 'muted', alpha: 0.12 });
          for (let m = 0; m <= 3; m++) R.line(1, hi - 0.4, 3.9, hi - 0.4 - m * 2.9, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.6 });
          R.path(clip(cache.e1), { color: 'orange', width: 2.4 });
          R.path(clip(cache.e2), { color: 'purple', width: 2.6 });
          const covers = (p) => Math.abs(p - xc) < r;
          st = { s1: cache.s1, s2: cache.s2, edge: covers(-a) || covers(a), del: c > 0 && covers(x0) };
        });
        v.readout(() => {
          const S = st, smooth = !S.edge && !S.del;
          if (smooth) return `The window sees neither a jump nor the $\\delta$: both $\\psi f$ and $\\psi u$ are smooth, and their transforms decay faster than any power (fitted slopes $${v.fix(S.s1, 1)}$, $${v.fix(S.s2, 1)}$).`;
          return `$|\\widehat{\\psi f}|\\sim\\xi^{${v.fix(S.s1, 2)}}$, so $\\psi f\\in H^s$ for $s<${v.fix(-S.s1 - 0.5, 1)}$; $|\\widehat{\\psi u}|\\sim\\xi^{${v.fix(S.s2, 2)}}$, so $\\psi u\\in H^{s}$ for $s<${v.fix(-S.s2 - 0.5, 1)}$. Gain: $${v.fix(S.s1 - S.s2, 2)}\\approx N=2$.`;
        });
      },
    },
  ],
};
