// Rudin, Functional Analysis — Chapter 8 (part 3): solutions with compact support, Sobolev spaces,
// distributions that are locally Hˢ
//
// Numbering checked against Google Books snippet view of the 2nd edition (1991); items still carry `verify: true`.

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
export default {
  book: 'fa',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.4
    {
      num: '8.4',
      kind: 'Theorem',
      name: 'Solutions with compact support',
      statement: String.raw`Suppose $P$ is a polynomial in $n$ variables, $v\in\mathscr D'(\R^n)$, and $v$ has compact support. Then the equation
$$P(D)u=v$$
has a solution $u$ with compact support if and only if there is an entire function $g$ on $\C^n$ such that $Pg=\hat v$, where $\hat v$ is the entire extension of the Fourier transform of $v$ (7.23). Such a solution is unique, and its support lies in the convex hull of the support of $v$.`,
      idea: String.raw`If $u$ has compact support, then $\hat u$ is entire (Paley–Wiener–Schwartz 7.23) and $P\hat u=\hat v$, so $g=\hat u$ works. Conversely, if $Pg=\hat v$ with $g$ entire, Lemma 8.3 bounds $|g(z)|$ by an average of $|\hat v|=|Pg|$ over a torus around $z$. So $g$ inherits from $\hat v$ the growth estimate $|g(z)|\le\gamma(1+|z|)^Ne^{r|\operatorname{Im}z|}$ of 7.23, and the converse half of 7.23 makes $g$ the transform of a distribution $u$ with support in $rB$; then $P(D)u=v$. Two compactly supported solutions differ by $w$ with $P\hat w=0$, hence $w=0$. In one variable the condition says that $\hat v$ vanishes at every zero of $P$, to at least the same order.`,
      caption: String.raw`$n=1$. Choose $P(D)$; its zeros are the red rings in the complex $\zeta$-plane (right). $v$ is a sum of three bumps (drag their tops). Left: $v$ (orange) and the solution $u_0$ (purple) that vanishes to the left of $\operatorname{supp}v$, computed by convolution with the forward Green's function. To the right of $\operatorname{supp}v$, $u_0$ is a solution of $P(D)u=0$, and it vanishes there exactly when $\hat v$ vanishes at the zeros of $P$. Right: $\log_{10}|\hat v(\zeta)|$, so the zeros of $\hat v$ are the dark spots. Press the button to adjust the heights so that $\hat v$ vanishes at the zeros of $P$: then $\hat v/P$ is entire and $u_0$ is the compactly supported solution, inside the convex hull of $\operatorname{supp}v$ (shaded).`,
      deps: ['fa-8.3', 'fa-7.23', 'fa-8.1'],
      tags: ['differential equations', 'Paley–Wiener', 'compact support'],
      verify: true,
      viz(v) {
        const M = v.M;
        const OPS = {
          d1: { label: "$u'$", zeros: [[0, 0]], G: (x) => (x > 0 ? 1 : 0) },
          osc: { label: "$u''+u$", zeros: [[1, 0], [-1, 0]], G: (x) => (x > 0 ? Math.sin(x) : 0) },
          hyp: { label: "$u''-u$", zeros: [[0, 1], [0, -1]], G: (x) => (x > 0 ? Math.sinh(x) : 0) },
        };
        const op = v.select('$P(D)u=$', Object.entries(OPS).map(([value, o]) => ({ value, label: o.label })), 'osc');
        const r = 0.55;
        const L = v.stage({ x: [-3.5, 6.5], y: [-1.6, 1.6], height: 330, axes: true, title: '$v$ (orange) and the solution $u_0$ with $u_0=0$ left of $\\operatorname{supp}v$ (purple)' });
        const R = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 330, axes: true, title: '$\\log_{10}|\\hat v(\\zeta)|$, zeros of $P$ (red)' });
        const H = [[-1.6, 0.9], [-0.2, -0.6], [1.3, 0.7]].map(([x, y]) => L.handle(x, y, { color: 'orange', r: 6, constrain: (a, b) => [M.clamp(a, -2.6, 2.6), M.clamp(b, -1.4, 1.4)] }));
        const NQ = 120, bq = M.linspace(-r, r, NQ + 1), wq = bq.map((_, j) => (j === 0 || j === NQ ? 1 : j % 2 ? 4 : 2) * (2 * r / NQ) / 3);
        // ∫ bump(y − c) e^{−iyζ} dy for complex ζ = (a, b): e^{−iyζ} = e^{yb}(cos ya − i sin ya)
        const bumpHat = (c, z) => { let re = 0, im = 0; for (let j = 0; j <= NQ; j++) { const y = c + bq[j], w = wq[j] * bump(y, c, r), e = Math.exp(y * z[1]); re += w * e * Math.cos(y * z[0]); im -= w * e * Math.sin(y * z[0]); } return [re, im]; };
        const vhat = (z) => H.reduce((s, h) => C.add(s, C.scale(bumpHat(h.x, z), h.y)), [0, 0]);
        v.button('make $\\hat v$ vanish at the zeros of $P$', () => {
          const zs = OPS[op.value].zeros, rows = [];
          zs.forEach((z) => { const b = H.map((h) => bumpHat(h.x, z)); rows.push(b.map((q) => q[0]), b.map((q) => q[1])); });
          const Mx = rows.filter((row) => row.some((q) => Math.abs(q) > 1e-12));
          const a = H.map((h) => h.y), m = Mx.length;
          if (!m) return;
          const G = Mx.map((ri) => Mx.map((rj) => ri.reduce((s, q, k) => s + q * rj[k], 0))), rhs = Mx.map((ri) => ri.reduce((s, q, k) => s + q * a[k], 0));
          const sol = m === 1 ? [rhs[0] / G[0][0]] : (() => { const det = G[0][0] * G[1][1] - G[0][1] * G[1][0]; return [(rhs[0] * G[1][1] - rhs[1] * G[0][1]) / det, (G[0][0] * rhs[1] - G[1][0] * rhs[0]) / det]; })();
          H.forEach((h, k) => { const na = a[k] - Mx.reduce((s, ri, i) => s + ri[k] * sol[i], 0); h.set(h.x, M.clamp(na, -1.4, 1.4)); });
        });
        let st = {};
        v.legend([['orange', '$v$'], ['purple', '$u_0$'], ['red', 'zeros of $P$']]);
        v.render(() => {
          const o = OPS[op.value];
          const lo = Math.min(...H.map((h) => h.x)) - r, hi = Math.max(...H.map((h) => h.x)) + r;
          L.vband(lo, hi, { color: 'orange', alpha: 0.08 });
          const vf = (x) => H.reduce((s, h) => s + h.y * bump(x, h.x, r), 0);
          const xs = M.linspace(-3.5, 6.5, 501);
          const u0 = xs.map((x) => H.reduce((s, h) => { let q = 0; for (let j = 0; j <= NQ; j++) { const y = h.x + bq[j]; q += wq[j] * o.G(x - y) * bump(y, h.x, r); } return s + h.y * q; }, 0));
          const right = xs.map((x, i) => (x > hi + 0.05 ? Math.abs(u0[i]) : 0)), tail = Math.max(...right);
          const vis = u0.map((y) => M.clamp(y, -3, 3));
          L.setView(null, span([...vis, 1.5, -1.5], 2, 0.08));
          L.fn(vf, { color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.15, n: 800 });
          L.path(xs.map((x, i) => [x, vis[i]]), { color: 'purple', width: 2.6 });
          H.forEach((h) => L.line(h.x, 0, h.x, h.y, { color: 'orange', width: 1, dash: [2, 3] }));
          const key = H.map((h) => `${h.x.toFixed(3)},${h.y.toFixed(3)}`).join('|');
          R.heat((a, b) => Math.log10(C.abs(vhat([a, b])) + 1e-12), { range: [-3, 1], cmap: 'viridis', res: 6, key });
          R.axes();
          o.zeros.forEach((z) => R.dot(z[0], z[1], { color: 'red', r: 8, hollow: true }));
          const vals = o.zeros.map((z) => C.abs(vhat(z)));
          st = { vals, tail, ok: Math.max(...vals) < 2e-4, lo, hi, op: op.value };
        });
        v.readout(() => {
          const s = st;
          const vz = s.vals.map((q) => v.sci(q + 1e-17, 1)).join(', ');
          return `$|\\hat v|$ at the zeros of $P$: $${vz}$. $\\max|u_0|$ to the right of $\\operatorname{supp}v$: $${v.fix(s.tail, 4)}$. ` + (s.ok ? '**$\\hat v/P$ is entire**, and $u_0$ is the solution with compact support, inside the hull $[' + v.fix(s.lo, 2) + ',' + v.fix(s.hi, 2) + ']$.' : 'Here $\\hat v/P$ has a pole, and no solution of $P(D)u=v$ has compact support.');
        });
      },
    },
    // ------------------------------------------------------------------ 8.8
    {
      num: '8.8',
      kind: 'Definition',
      name: 'Sobolev spaces Hˢ',
      statement: String.raw`To each real number $s$ associate the positive measure $d\mu_s(y)=(1+|y|^2)^s\,dm_n(y)$ on $\R^n$. $H^s$ is the space of tempered distributions $u$ whose Fourier transform is a function with
$$\norm u_s=\Big(\int_{\R^n}|\hat u|^2\,d\mu_s\Big)^{1/2}<\infty ,$$
that is, $\hat u\in L^2(\mu_s)$. So $H^0=L^2$, $H^t\subset H^s$ when $s<t$, and for an integer $p\ge0$, $H^p$ consists of the $f\in L^2$ with $D^\alpha f\in L^2$ for $|\alpha|\le p$.`,
      idea: String.raw`The weight $(1+|\xi|^2)^{s/2}$ measures smoothness by the decay of $\hat u$: by Plancherel (7.9) and $(D^\alpha u)^\wedge=\xi^\alpha\hat u$, having $p$ derivatives in $L^2$ means $(1+|\xi|^2)^{p/2}\hat u\in L^2$. Real and negative $s$ interpolate and extend this scale. $\delta\in H^s$ exactly when $s<-n/2$. Sobolev's lemma (7.25) says that elements of $H^s$ are $C^{(r)}$ functions when $s>r+\frac n2$.`,
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
    // ------------------------------------------------------------------ 8.9
    {
      num: '8.9',
      kind: 'Theorem',
      name: 'Properties of the Sobolev spaces Hˢ',
      statement: String.raw`(a) Every distribution with compact support lies in some $H^s$.
(b) If $-\infty<t<\infty$, the mapping $u\mapsto v$ given by $\hat v=(1+|y|^2)^{t/2}\hat u$ is a linear isometry of $H^s$ onto $H^{s-t}$.
(d) Every $D^\alpha$ maps $H^s$ into $H^{s-|\alpha|}$.
(e) If $\psi\in\mathscr S_n$ and $u\in H^s$, then $\psi u\in H^s$.
(Rudin's part (c) is not reproduced here.)`,
      idea: String.raw`(a) By the Paley–Wiener–Schwartz theorem (7.23), $\hat u$ grows at most like $(1+|\xi|)^N$, so $s<-N-\frac n2$ works. (b) is immediate from the definition, since $|\hat v|^2d\mu_{s-t}=|\hat u|^2d\mu_s$. (d) $|y^\alpha|\le(1+|y|^2)^{|\alpha|/2}$. (e) $(\psi u)^\wedge$ is the convolution of $\hat\psi$ with $\hat u$. **Peetre's inequality**
$$(1+|\xi|^2)^{s/2}\le2^{|s|/2}(1+|\xi-\eta|^2)^{|s|/2}(1+|\eta|^2)^{s/2}$$
moves the weight from $\xi$ to $\eta$ at the price of a polynomial factor in $\xi-\eta$, which the rapidly decreasing $\hat\psi(\xi-\eta)$ absorbs. Then Young's inequality bounds the convolution in $L^2$. Parts (d) and (e) are what the proof of 8.12 uses to control the commutator terms.`,
      caption: String.raw`Left: Peetre's ratio $(1+\xi^2)^{s/2}/\big[(1+(\xi-\eta)^2)^{|s|/2}(1+\eta^2)^{s/2}\big]$ on the $(\xi,\eta)$-plane, in $\log_2$, coloured from $-6$ (dark) up to the bound $|s|/2$ (bright). Its actual maximum, in the corner, stays below the bound. Drag the point to read off the factors. Right: $u=\chi_{[-1,1]}\in H^s$ for $s<\frac12$ and $\psi u$ for a bump $\psi$ (drag its centre). $|\widehat{\psi u}|$ never decays slower than $|\hat u|\sim\xi^{-1}$. It decays faster when $\psi$ vanishes at both jumps: multiplication by $\psi$ can only improve membership in $H^s$.`,
      deps: ['fa-8.8', 'fa-7.23', 'fa-7.19'],
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
    // ------------------------------------------------------------------ 8.10
    {
      num: '8.10',
      kind: 'Definition',
      name: 'Distributions that are locally Hˢ',
      statement: String.raw`Let $\Omega\subset\R^n$ be open. A distribution $u\in\mathscr D'(\Omega)$ is **locally $H^s$** if to each point $x\in\Omega$ there corresponds a distribution $v\in H^s$ such that $u=v$ in some neighbourhood of $x$.`,
      idea: String.raw`Membership in $H^s$ is a global condition, both on smoothness and on decay at infinity, and it does not even make sense for a distribution on $\Omega$. The local version keeps only the smoothness: near each point $u$ must agree with some element of $H^s$. Theorem 8.11 shows that this is the same as asking $\psi u\in H^s$ for every $\psi\in\mathscr D(\Omega)$.`,
      deps: ['fa-8.8'],
      tags: ['Sobolev spaces', 'localization'],
      verify: true,
    },
    // ------------------------------------------------------------------ 8.11
    {
      num: '8.11',
      kind: 'Theorem',
      name: 'Locally Hˢ ⇔ ψu ∈ Hˢ for every test function ψ',
      statement: String.raw`If $u\in\mathscr D'(\Omega)$ and $-\infty<s<\infty$, the following two statements are equivalent:
(a) $u$ is locally $H^s$;
(b) $\psi u\in H^s$ for every $\psi\in\mathscr D(\Omega)$.`,
      idea: String.raw`(a)$\Rightarrow$(b): the support of $\psi$ is compact, so finitely many neighbourhoods $\omega_i$, on which $u=v_i\in H^s$, cover it. Choose a partition of unity $\psi_i\in\mathscr D(\omega_i)$ with $\sum\psi_i=1$ on $\operatorname{supp}\psi$. Then $\psi u=\sum\psi_i\psi v_i$, and each term lies in $H^s$ by 8.9(e). (b)$\Rightarrow$(a): given $x$, take $\psi\in\mathscr D(\Omega)$ equal to $1$ near $x$. Then $v=\psi u\in H^s$ and $u=v$ near $x$.`,
      caption: String.raw`One variable, and $u$ with three singularities that you can drag: a jump (orange), a kink (purple), and a jump of $u''$ (teal). Drag the window $\psi$ and set its radius. Right: the decay of $|\widehat{\psi u}|$ (FFT, $2^{16}$ points), with the slope fitted at high frequency. If $|\widehat{\psi u}|\sim\xi^{-k}$, then $\psi u\in H^s$ exactly for $s<k-\frac12$. The three singularities give $s<\frac12$, $s<\frac32$ and $s<\frac52$. Bottom: the open set $\Omega$ (drag its ends). $u$ is locally $H^s$ in $\Omega$ exactly when $s$ is below the smallest of these thresholds over the singularities inside $\Omega$. That is also the worst decay over all windows inside $\Omega$, as (b) says.`,
      deps: ['fa-8.10', 'fa-8.9', 'fa-6.20'],
      tags: ['Sobolev spaces', 'localization', 'partitions of unity'],
      verify: true,
      viz(v) {
        const M = v.M;
        const rS = v.slider('radius of the window $\\psi$', 0.3, 1.5, 0.5, { step: 0.01 });
        const L = v.stage({ x: [-3, 3], y: [-0.7, 1.9], height: 300, axes: true, title: '$u$ (blue) and the window $\\psi$ (green)' });
        const R = v.stage({ x: [1, 3.9], y: [-15, 0], height: 300, axes: 'box', xticks: decTicks(1, 3), yticks: decTicks(-15, 0), xlabel: 'ξ', title: '$|\\widehat{\\psi u}|$ (envelope, log–log)' });
        const B = v.stage({ x: [-3, 3], y: [0, 3.25], height: 160, full: true, axes: 'box', yticks: [[0.5, '½'], [1.5, '3/2'], [2.5, '5/2']], title: 'threshold $s^*$ of each singularity and the set $\\Omega$' });
        const SG = [{ c: 'orange', k: 1, x: -1.6, name: 'jump' }, { c: 'purple', k: 2, x: 0.3, name: 'kink' }, { c: 'teal', k: 3, x: 1.7, name: "u'' jump" }];
        const HS = SG.map((g) => L.handle(g.x, -0.45, { color: g.c, r: 6, constrain: (x) => [M.clamp(x, -2.7, 2.7), -0.45] }));
        const hw = L.handle(-1.4, 0, { color: 'green', label: 'ψ', labelPos: 's', constrain: (x) => [M.clamp(x, -2.6, 2.6), 0] });
        const ha = B.handle(-2.4, 2.95, { color: 'ink', label: 'Ω', labelPos: 'e', constrain: (x) => [M.clamp(x, -2.9, 2.9), 2.95] });
        const hb = B.handle(0.9, 2.95, { color: 'ink', constrain: (x) => [M.clamp(x, -2.9, 2.9), 2.95] });
        const NF = 65536, X0 = -4.8, LEN = 9.6, h = LEN / NF, dxi = 2 * Math.PI / LEN;
        let cache = { key: '' }, st = {};
        v.render(() => {
          const r = rS.value, xc = hw.x, X = HS.map((q) => q.x);
          const u = (x) => 0.8 * (x > X[0] ? 1 : 0) + 0.7 * Math.abs(x - X[1]) * Math.exp(-((x - X[1]) ** 2)) + 1.5 * (x > X[2] ? (x - X[2]) ** 2 * Math.exp(-(x - X[2])) : 0);
          L.vband(xc - r, xc + r, { color: 'green', alpha: 0.08 });
          L.fn((x) => bump(x, xc, r) * 1.6, { color: 'green', width: 1.6, domain: [xc - r, xc + r] });
          L.fn(u, { color: 'blue', width: 2.6, n: 1200 });
          SG.forEach((g, i) => L.vline(X[i], { color: g.c, width: 1, dash: [3, 3] }));
          const key = `${r}|${xc}|${X.join(',')}`;
          if (cache.key !== key) {
            const re = new Float64Array(NF), im = new Float64Array(NF);
            for (let j = 0; j < NF; j++) { const x = X0 + j * h; re[j] = bump(x, xc, r) * u(x); }
            fft(re, im);
            const A = new Float64Array(NF / 2); for (let k = 0; k < NF / 2; k++) A[k] = h * Math.hypot(re[k], im[k]);
            const e = envelope(A, dxi, 1, 3.9, 0.05);
            cache = { key, e, s: slope(e, 3.0, 3.85) };
          }
          const hi = Math.max(...cache.e.map((p) => p[1])) + 0.6;
          R.setView(null, [-15, hi]); R.setTicks(decTicks(1, 3), decTicks(-15, hi).filter((t) => t[0] % 2 === 0));
          R.hband(-15, -14, { color: 'muted', alpha: 0.12 });
          for (let m = 1; m <= 3; m++) R.line(1, hi - 0.4, 3.9, hi - 0.4 - m * 2.9, { color: SG[m - 1].c, width: 1, dash: [3, 4], alpha: 0.6 });
          R.path(cache.e.map(([x, y]) => [x, Math.max(y, -14.5)]), { color: 'green', width: 2.6 });
          // bottom: thresholds and Ω
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x);
          B.vband(a, b, { color: 'ink', alpha: 0.07 });
          B.line(a, 2.95, b, 2.95, { color: 'ink', width: 3 });
          SG.forEach((g, i) => { B.line(X[i], 0, X[i], g.k - 0.5, { color: g.c, width: 4 }); B.dot(X[i], g.k - 0.5, { color: g.c, r: 4 }); });
          const inside = SG.map((g, i) => (X[i] > a && X[i] < b ? g.k - 0.5 : Infinity)), sO = Math.min(...inside);
          if (isFinite(sO)) B.hline(sO, { color: 'red', width: 1.6, dash: [6, 4] });
          const covered = SG.map((g, i) => (Math.abs(X[i] - xc) < r ? g.k - 0.5 : Infinity)), sW = Math.min(...covered);
          st = { sl: cache.s, sW, sO, winIn: xc - r > a && xc + r < b, names: SG.filter((g, i) => Math.abs(X[i] - xc) < r).map((g) => g.name) };
        });
        v.readout(() => {
          const s = st;
          const win = s.names.length ? `The window covers: ${s.names.join(', ')}. ` : 'The window covers no singularity, so $\\psi u$ is smooth. ';
          const fit = isFinite(s.sW) ? `Fitted decay $\\xi^{${v.fix(s.sl, 2)}}$, so $\\psi u\\in H^s$ for $s<${v.fix(-s.sl - 0.5, 1)}$ (theory: $s<${v.fix(s.sW, 1)}$). ` : `Fitted slope $${v.fix(s.sl, 1)}$: faster than any power. `;
          const om = isFinite(s.sO) ? `$u$ is locally $H^s$ in $\\Omega$ iff $s<${v.fix(s.sO, 1)}$.` : '$\\Omega$ contains no singularity: $u$ is locally $H^s$ in $\\Omega$ for every $s$.';
          return win + fit + om + (s.winIn ? ' (This $\\psi$ lies in $\\mathscr D(\\Omega)$.)' : '');
        });
      },
    },
  ],
};
