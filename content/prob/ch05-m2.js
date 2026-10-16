// Probability: Theory and Examples (Durrett) — Chapter 5, part M2: §5.4 Recurrence criteria via characteristic functions
import { clampN, fr, LATTICE, LATTICE_OPTS, reInv, shellIntegral } from './ch05-m.shared.js';

const ptsOf = (a, stride = 1) => { const o = []; for (let i = 0; i < a.length; i += stride) o.push([i, a[i]]); return o; };
const pickW = (w, r) => { const u = r(); let c = 0; for (const e of w) { c += e[3]; if (u <= c) return e; } return w[w.length - 1]; };
const LKEYS = ['srw1', 'bias1', 'srw2', 'bias2', 'srw3'];
const LCOL = { srw1: 'accent', bias1: 'orange', srw2: 'green', bias2: 'red', srw3: 'purple' };
const shellCache = new Map();
const shellFor = (k, r) => { const key = `${k}|${r}`; if (!shellCache.has(key)) shellCache.set(key, shellIntegral(LATTICE[k].w, LATTICE[k].d, r)); return shellCache.get(key); };
/** Mean number of returns to 0 of a lattice walk by time n (M walks). */
function latticeReturns(w, M, N, r) {
  const ev = new Float64Array(N + 1);
  for (let k = 0; k < M; k++) {
    let x = 0, y = 0, z = 0;
    for (let n = 1; n <= N; n++) { const e = pickW(w, r); x += e[0]; y += e[1]; z += e[2]; if (!x && !y && !z) ev[n]++; }
  }
  for (let n = 1; n <= N; n++) ev[n] = ev[n - 1] + ev[n] / M;
  return ev;
}

export default {
  collection: 'prob',
  chapter: 5,
  items: [
    // ======================================================================== 5.4.9
    {
      num: '5.4.9',
      kind: 'Theorem',
      name: 'Planar walks with a CLT are recurrent',
      statement: String.raw`Let $S_n$ be a random walk in $\R^2$ such that $S_n/\sqrt n$ converges in distribution to a nondegenerate normal law (for instance, steps with mean $0$ and a finite, nondegenerate covariance matrix $\Gamma$). Then $S_n$ is recurrent.`,
      idea: String.raw`Take $n=tm^2$. The central limit theorem says $P(\|S_n\|<m)\approx P(\|Z\|<t^{-1/2})\approx c/t$ for $t\ge1$, where $c$ is the normal density at $0$ times a constant. Summing over $n\le\theta m^2$ gives about $c\,m^2\ln\theta$, and dividing by $(2m)^2$ (the covering bound 5.4.6) leaves $\tfrac c4\ln\theta$, which tends to $\infty$ with $\theta$. So $\sum_nP(\|S_n\|<1)=\infty$ and 5.4.7 applies.`,
      caption: String.raw`Choose the step shape and the correlation $\rho$ of the two coordinates (unit variances). Left: one seeded path, 4000 steps, with the disc of radius $r$. Right: the expected number of visits to that disc by time $n$ (300 walks, log $n$ axis) is a straight line of slope $r^2/(2\sqrt{1-\rho^2})$ per unit of $\ln n$ (dashed), so the visit count grows like $\log n$ for every one of these step laws.`,
      deps: ['prob-5.4.7', 'prob-3.10.7'],
      tags: ['random walk', 'recurrence'],
      scope: String.raw`The slope formula is the CLT approximation for large $r$ and $n$; with $\pm1$ coordinates and a small disc lattice effects shift the intercept and the slope.`,
      viz(v) {
        const shape = v.select('steps', [{ value: 'g', label: 'Gaussian' }, { value: 'u', label: 'uniform square' }, { value: 'c', label: '$\\pm1$ coins' }], 'u');
        const rhoS = v.slider('correlation $\\rho$', -0.9, 0.9, 0.6, { step: 0.05 });
        const rS = v.slider('disc radius $r$', 2, 6, 3, { step: 0.5 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 4000, M = 300;
        const A = v.stage({ x: [-30, 30], y: [-30, 30], equal: true, axes: 'box', gutter: true, height: 320, title: 'one path' });
        const B = v.stage({ x: [1, N], y: [0, 10], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: 'visits to the disc by time $n$' });
        let cache = null, st = null;
        v.render(() => {
          const rho = rhoS.value, key = `${shape.value}|${rho}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 7 + shape.value.length), nr = new Float32Array(M * (N + 1)), px = new Float64Array(N + 1), py = new Float64Array(N + 1), q = Math.sqrt(1 - rho * rho);
            const coord = () => (shape.value === 'g' ? r.normal() : shape.value === 'u' ? (2 * r() - 1) * Math.sqrt(3) : r() < 0.5 ? -1 : 1);
            for (let w = 0; w < M; w++) {
              let x = 0, y = 0;
              for (let n = 1; n <= N; n++) {
                let a, b;
                if (shape.value === 'c') { a = coord(); b = r() < (1 + rho) / 2 ? a : -a; } else { a = coord(); b = rho * a + q * coord(); }
                x += a; y += b; nr[w * (N + 1) + n] = Math.hypot(x, y);
                if (w === 0) { px[n] = x; py[n] = y; }
              }
            }
            cache = { key, nr, px, py };
          }
          const { nr, px, py } = cache, rad = rS.value, H = new Float64Array(N + 1);
          for (let w = 0; w < M; w++) for (let n = 1; n <= N; n++) if (nr[w * (N + 1) + n] < rad) H[n]++;
          for (let n = 1; n <= N; n++) H[n] = H[n - 1] + H[n] / M;
          const P = []; let ext = 6;
          for (let n = 0; n <= N; n += 2) { P.push([px[n], py[n]]); ext = Math.max(ext, Math.abs(px[n]), Math.abs(py[n])); }
          ext = Math.min(ext * 1.08, 400); A.setView([-ext, ext], [-ext, ext]);
          A.path(P, { color: 'accent', width: 1, alpha: 0.65 });
          A.circle(0, 0, Math.max(rad, ext / 60), { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.6 });
          const th = (rad * rad) / (2 * Math.sqrt(1 - rho * rho)), n0 = 200;
          B.setView([1, N], [0, Math.max(1, H[N]) * 1.12]);
          B.path(ptsOf(H, 8).slice(1), { color: 'accent', width: 2 });
          B.path([[n0, H[n0]], [N, H[n0] + th * Math.log(N / n0)]], { color: 'orange', width: 1.5, dash: [5, 4] });
          st = { th, emp: (H[N] - H[n0]) / Math.log(N / n0) };
        });
        v.readout(() => st && `Growth of the expected visit count per unit of $\\ln n$ (from $n=200$ to $4000$): **${fr(st.emp, 2)}**. Prediction $r^2/(2\\sqrt{1-\\rho^2})=${fr(st.th, 2)}$.\nThe count has no limit: the planar walk keeps returning, though ever more slowly.`);
      },
    },
    // ======================================================================== 5.4.10
    {
      num: '5.4.10',
      kind: 'Theorem',
      name: 'Chung–Fuchs integral criterion',
      statement: String.raw`Let $\varphi$ be the characteristic function of the step distribution of a random walk $S_n$ in $\R^d$ and $\delta>0$. If
$$\int_{(-\delta,\delta)^d}\operatorname{Re}\frac1{1-\varphi(y)}\,dy=\infty,$$
then $S_n$ is recurrent. (With the regularised integral of 5.4.11 the criterion is an equivalence.)`,
      idea: String.raw`The integrand $\operatorname{Re}\frac1{1-r\varphi}$ is nonnegative and tends to $\operatorname{Re}\frac1{1-\varphi}$ as $r\uparrow1$ wherever $\varphi\ne1$. Fatou's lemma gives $\int\operatorname{Re}\frac1{1-\varphi}\le\liminf_{r\uparrow1}\int\operatorname{Re}\frac1{1-r\varphi}$, so divergence of the first integral forces the supremum in 5.4.11 to be infinite, and 5.4.11 gives recurrence.`,
      caption: String.raw`Pick a lattice walk. Top left: the integrand $\operatorname{Re}\frac1{1-\varphi(y)}$ along a coordinate axis, log–log. Top right: the truncated integral $I(\eta)=\int_{\eta<|y|<1}\operatorname{Re}\frac1{1-\varphi}$ against $\eta$: it blows up as $\eta\downarrow0$ exactly for the symmetric walks with $d\le2$. Bottom: the simulated mean number of returns, which grows (or stalls) accordingly.`,
      deps: ['prob-5.4.7', 'prob-3.3.11'],
      see: ['prob-5.4.11'],
      tags: ['random walk', 'characteristic functions'],
      credit: 'K. L. Chung & W. H. J. Fuchs, 1951',
      verify: true,
      scope: String.raw`The statement given is the Fatou half; whether finiteness of the plain integral characterises transience in full generality is not claimed here. The truncated integrals are computed over a ball of radius $1$ rather than the cube, with polar quadrature; the integrand is evaluated for the lattice walks listed.`,
      viz(v) {
        const wS = v.select('walk', LATTICE_OPTS, 'srw2');
        let seed = 1; v.button('Resample', () => { seed++; });
        const A = v.stage({ x: [1e-3, 1], y: [0.1, 1e7], xlog: true, ylog: true, axes: 'box', gutter: true, height: 270, xlabel: '$|y|$', title: '$\\operatorname{Re}\\,1/(1-\\varphi)$ along an axis' });
        const B = v.stage({ x: [1e-4, 1], y: [1, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 270, xlabel: '$\\eta$', title: '$I(\\eta)$' });
        const C = v.stage({ x: [1, 3000], y: [0, 10], xlog: true, axes: 'box', gutter: true, height: 230, xlabel: '$n$', title: 'simulated mean number of returns', full: true });
        let cache = null, st = null;
        v.render(() => {
          const k = wS.value, L = LATTICE[k], key = `${k}|${seed}`;
          if (!cache || cache.key !== key) cache = { key, ev: latticeReturns(L.w, 250, 3000, v.rng(seed * 5 + k.length * 3)) };
          const sh = shellFor(k, 1), prof = [];
          for (let i = 0; i <= 120; i++) { const y = 10 ** (-3 + (3 * i) / 120); prof.push([y, reInv(L.w, 1, y)]); }
          A.path(prof, { color: LCOL[k], width: 2 });
          const I = [];
          for (let i = 0; i < sh.rad.length; i++) if (sh.rad[i] >= 1e-4) I.push([sh.rad[i], Math.max(1e-3, sh.tail[i])]);
          const lo = Math.min(...I.map((p) => p[1])), hi = Math.max(...I.map((p) => p[1]));
          B.setView([1e-4, 1], [Math.max(1e-3, lo * 0.5), hi * 2]);
          B.path(I, { color: LCOL[k], width: 2 });
          C.setView([1, 3000], [0, Math.max(1, cache.ev[3000]) * 1.12]);
          C.path(ptsOf(cache.ev, 6).slice(1), { color: 'gold', width: 2 });
          const at = (e) => sh.tail[sh.rad.findIndex((x) => x >= e)];
          st = { a: at(1e-2), b: at(1e-4), ret: cache.ev[3000] };
        });
        v.readout(() => st && `$I(10^{-2})=${fr(st.a, 1)}$, $I(10^{-4})=${fr(st.b, 1)}$ (ratio ${fr(st.b / st.a, 2)}). ${st.b / st.a > 1.4 ? 'The integral keeps growing as $\\eta\\downarrow0$: it diverges, so the walk is recurrent.' : 'The integral has settled: finite, and the walk is transient.'}\nSimulated mean returns by $n=3000$: ${fr(st.ret, 2)}.`);
      },
    },
    // ======================================================================== 5.4.11
    {
      num: '5.4.11',
      kind: 'Theorem',
      name: 'Recurrence via sup_{r<1} ∫ Re 1/(1 − rφ)',
      statement: String.raw`Let $\varphi$ be the characteristic function of the steps of a random walk $S_n$ in $\R^d$ and $\delta>0$. Then $S_n$ is recurrent if and only if
$$\sup_{0<r<1}\int_{(-\delta,\delta)^d}\operatorname{Re}\frac1{1-r\varphi(y)}\,dy=\infty .$$`,
      idea: String.raw`Weight the visits by $r^n$ to get something computable: $\sum_nr^nP(\|S_n\|<\eps)$ is, by the Parseval relation 5.4.12 applied to a triangle-type kernel, comparable to $\int\operatorname{Re}\frac1{1-r\varphi(y)}\psi(y)\,dy$, where $\psi$ is a nonnegative kernel concentrated at scale $1/\eps$. The elementary bound 5.4.13 ($1-\cos x\ge x^2/4$ for $|x|\le\pi/3$) compares the kernel with the indicator of a cube. As $r\uparrow1$ the left side tends to $\sum_nP(\|S_n\|<\eps)$ by monotone convergence, and 5.4.7 turns this into recurrence versus transience.`,
      caption: String.raw`Left: $J(r)=\int_{|y|<1}\operatorname{Re}\frac1{1-r\varphi}$ against $s=1-r$ (log–log) for all five lattice walks; the one chosen below is drawn heavy and the slider marks $s$. The curves of the recurrent walks (symmetric $d=1,2$) blow up as $s\downarrow0$; the others converge. Right: the integrand for the chosen walk along an axis at $r=1-s$ (solid) and at $r=1$ (dashed): the peak at the origin is what grows.`,
      deps: ['prob-5.4.7', 'prob-3.3.1a'],
      see: ['prob-5.4.10'],
      tags: ['random walk', 'characteristic functions'],
      credit: 'K. L. Chung & W. H. J. Fuchs, 1951',
      verify: true,
      scope: String.raw`Integrals are over the unit ball (equivalent to a cube of any fixed size, since the integrand is positive and bounded away from the origin), evaluated by polar quadrature for the lattice walks listed.`,
      viz(v) {
        const wS = v.select('walk', LATTICE_OPTS, 'srw2');
        const sS = v.slider('$s=1-r$', 1e-5, 0.5, 0.01, { log: true, sig: 2 });
        const SV = Array.from({ length: 22 }, (_, i) => 10 ** (-5 + (i * Math.log10(0.5 / 1e-5)) / 21));
        const A = v.stage({ x: [1e-5, 0.5], y: [1, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$s=1-r$', ylabel: '$J(r)$', title: '$\\int_{|y|<1}\\operatorname{Re}\\,1/(1-r\\varphi)$' });
        const B = v.stage({ x: [1e-3, 1], y: [0.1, 1e7], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$|y|$', title: 'integrand along an axis' });
        let curves = null;
        v.render(() => {
          if (!curves) { curves = {}; for (const k of LKEYS) curves[k] = SV.map((s) => [s, shellFor(k, 1 - s).total]); }
          const k = wS.value, L = LATTICE[k], s = sS.value;
          let lo = Infinity, hi = 0;
          for (const kk of LKEYS) for (const p of curves[kk]) { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
          A.setView([1e-5, 0.5], [lo * 0.7, hi * 1.5]);
          for (const kk of LKEYS) A.path(curves[kk], { color: LCOL[kk], width: kk === k ? 3 : 1.2, alpha: kk === k ? 1 : 0.45 });
          const Js = shellFor(k, 1 - s).total;
          A.vline(s, { color: 'faint', dash: [4, 4] });
          A.dot(s, Js, { r: 5, color: LCOL[k] });
          const p1 = [], p0 = [];
          for (let i = 0; i <= 120; i++) { const y = 10 ** (-3 + (3 * i) / 120); p1.push([y, reInv(L.w, 1 - s, y)]); p0.push([y, reInv(L.w, 1, y)]); }
          B.path(p0, { color: 'faint', width: 1.4, dash: [5, 4] });
          B.path(p1, { color: LCOL[k], width: 2 });
          v.J = { Js, J10: shellFor(k, 1 - Math.min(0.5, 10 * s)).total };
        });
        v.legend(LKEYS.map((k) => [LCOL[k], LATTICE[k].label]));
        v.readout(() => v.J && `$J(1-s)=${fr(v.J.Js, 2)}$ at $s=${sS.value.toPrecision(2)}$, and $${fr(v.J.J10, 2)}$ at $10s$. ${v.J.Js / v.J.J10 > 1.5 ? 'It rises a lot every time $s$ shrinks tenfold: the supremum is infinite (recurrent).' : 'It barely changes: it stays bounded as $r\\uparrow1$ (transient).'}`);
      },
    },
    // ======================================================================== 5.4.12
    {
      num: '5.4.12',
      kind: 'Lemma',
      name: 'Parseval relation for characteristic functions',
      statement: String.raw`Let $\mu,\nu$ be probability measures on $\R$ with characteristic functions $\varphi(t)=\int e^{itx}\,\mu(dx)$ and $\psi(t)=\int e^{itx}\,\nu(dx)$. Then
$$\int\varphi(t)\,\nu(dt)=\int\psi(x)\,\mu(dx).$$`,
      idea: String.raw`Both sides equal the double integral $\iint e^{itx}\,\mu(dx)\,\nu(dt)$. The integrand has modulus $1$, so the integral is absolutely convergent against the product measure and Fubini's theorem (1.7.2) lets us integrate in either order.`,
      caption: String.raw`Choose a law for $\mu$ and one for $\nu$ (each a normal, uniform, Laplace or Cauchy law with a scale). Left: $\varphi$ (blue) against the density of $\nu$ (orange); the green area is $\int\varphi\,d\nu$. Right: $\psi$ against the density of $\mu$, area $\int\psi\,d\mu$. The two numbers, computed by independent quadratures, agree.`,
      deps: ['prob-3.3.1a', 'prob-1.7.2'],
      see: ['prob-5.4.11'],
      tags: ['characteristic functions'],
      scope: String.raw`Needs only that $\mu,\nu$ are probability measures; the pictures use laws with densities, real even characteristic functions and a quadrature on $\theta=\arctan x$.`,
      viz(v) {
        const SQ = Math.sqrt(2 * Math.PI);
        const FAM = {
          n: { label: 'normal', pdf: (s) => (x) => Math.exp(-x * x / (2 * s * s)) / (s * SQ), phi: (s) => (t) => Math.exp(-s * s * t * t / 2) },
          u: { label: 'uniform', pdf: (a) => (x) => (Math.abs(x) <= a ? 1 / (2 * a) : 0), phi: (a) => (t) => (Math.abs(a * t) < 1e-9 ? 1 : Math.sin(a * t) / (a * t)) },
          l: { label: 'Laplace', pdf: (b) => (x) => Math.exp(-Math.abs(x) / b) / (2 * b), phi: (b) => (t) => 1 / (1 + b * b * t * t) },
          c: { label: 'Cauchy', pdf: (g) => (x) => g / (Math.PI * (x * x + g * g)), phi: (g) => (t) => Math.exp(-g * Math.abs(t)) },
        };
        const opts = Object.keys(FAM).map((k) => ({ value: k, label: FAM[k].label }));
        const mS = v.select('$\\mu$', opts, 'u'), nS = v.select('$\\nu$', opts, 'l');
        const aS = v.slider('scale of $\\mu$', 0.3, 3, 1.5, { step: 0.05 }), bS = v.slider('scale of $\\nu$', 0.3, 3, 0.8, { step: 0.05 });
        const mk = () => ({ f: FAM[mS.value].pdf(aS.value), p: FAM[mS.value].phi(aS.value), g: FAM[nS.value].pdf(bS.value), q: FAM[nS.value].phi(bS.value) });
        const A = v.stage({ x: [-6, 6], y: [-0.4, 1.1], axes: 'box', gutter: true, height: 290, xlabel: '$t$', title: '$\\varphi\\cdot f_\\nu$' });
        const B = v.stage({ x: [-6, 6], y: [-0.4, 1.1], axes: 'box', gutter: true, height: 290, xlabel: '$x$', title: '$\\psi\\cdot f_\\mu$' });
        const quad = (h) => { const K = 40000; let s = 0; for (let i = 0; i < K; i++) { const th = -Math.PI / 2 + ((i + 0.5) * Math.PI) / K, x = Math.tan(th); s += h(x) * (1 + x * x); } return (s * Math.PI) / K; };
        v.render(() => {
          const { f, p, g, q } = mk();
          A.fn(p, { color: 'accent', width: 2 }); A.fn(g, { color: 'orange', width: 2 }); A.fn((t) => p(t) * g(t), { color: 'green', fill: true, fillAlpha: 0.35, width: 1 });
          B.fn(q, { color: 'accent', width: 2 }); B.fn(f, { color: 'orange', width: 2 }); B.fn((x) => q(x) * f(x), { color: 'green', fill: true, fillAlpha: 0.35, width: 1 });
          v.res = { l: quad((t) => p(t) * g(t)), r: quad((x) => q(x) * f(x)) };
        });
        v.legend([['accent', 'characteristic function'], ['orange', 'density'], ['green', 'product']]);
        v.readout(() => v.res && `$\\int\\varphi\\,d\\nu=${fr(v.res.l, 5)}$ and $\\int\\psi\\,d\\mu=${fr(v.res.r, 5)}$; difference $${(v.res.l - v.res.r).toExponential(1)}$ (quadrature error).`);
      },
    },
    // ======================================================================== 5.4.13
    {
      num: '5.4.13',
      kind: 'Lemma',
      name: '1 − cos x ≥ x²/4 for |x| ≤ π/3',
      statement: String.raw`For all real $x$ with $|x|\le\pi/3$,
$$1-\cos x\ \ge\ \frac{x^2}{4}.$$`,
      idea: String.raw`The alternating Taylor series gives $1-\cos x\ge\frac{x^2}2-\frac{x^4}{24}=\frac{x^2}{2}\bigl(1-\frac{x^2}{12}\bigr)$, and for $|x|\le\pi/3$ the bracket is at least $1-\pi^2/108>\tfrac12$.`,
      caption: String.raw`Left: $1-\cos x$ (blue) and $x^2/4$ (orange); the green band is $|x|\le\pi/3$. Drag the handle. Right: the ratio $(1-\cos x)/x^2$ against the constant $1/4$. It stays above $1/4$ not only on the band but a good deal further, until about $|x|\approx2.78$: the constant $\pi/3$ is what the textbook needs, not the sharp range.`,
      deps: [],
      see: ['prob-5.4.11'],
      tags: ['estimates'],
      viz(v) {
        const A = v.stage({ x: [-3.4, 3.4], y: [-0.1, 2.2], axes: 'box', gutter: true, height: 300, xlabel: '$x$', title: '$1-\\cos x$ and $x^2/4$', xticks: [[-Math.PI / 3, '−π/3'], [0, '0'], [Math.PI / 3, 'π/3'], [Math.PI, 'π'], [-Math.PI, '−π']] });
        const B = v.stage({ x: [-3.4, 3.4], y: [0, 0.55], axes: 'box', gutter: true, height: 300, xlabel: '$x$', title: '$(1-\\cos x)/x^2$ against $1/4$' });
        const h = A.handle(1.0, 0, { color: 'gold', constrain: 'x', label: 'x' });
        const ratio = (x) => (Math.abs(x) < 1e-6 ? 0.5 : (1 - Math.cos(x)) / (x * x));
        const cross = v.M.bisect((x) => ratio(x) - 0.25, 2, 3.1);
        v.render(() => {
          A.vband(-Math.PI / 3, Math.PI / 3, { color: 'green', alpha: 0.1 });
          A.fn((x) => 1 - Math.cos(x), { color: 'accent', width: 2.2 });
          A.fn((x) => x * x / 4, { color: 'orange', width: 2, domain: [-3.4, 3.4] });
          const x = h.x;
          A.segment([x, x * x / 4], [x, 1 - Math.cos(x)], { color: 'green', width: 3 });
          B.vband(-Math.PI / 3, Math.PI / 3, { color: 'green', alpha: 0.1 });
          B.fn(ratio, { color: 'accent', width: 2.2 });
          B.hline(0.25, { color: 'orange', dash: [5, 4], width: 1.6 });
          B.dot(x, ratio(x), { r: 5, color: 'gold' });
          v.cur = x;
        });
        v.readout(() => `At $x=${fr(v.cur, 3)}$: $1-\\cos x=${fr(1 - Math.cos(v.cur), 4)}$, $x^2/4=${fr(v.cur * v.cur / 4, 4)}$, difference **${fr(1 - Math.cos(v.cur) - v.cur * v.cur / 4, 4)}** ${Math.abs(v.cur) <= Math.PI / 3 + 1e-9 ? '(inside the band: $\\ge0$)' : Math.abs(v.cur) <= cross ? '(outside the band, but still $\\ge0$)' : '(beyond $2.78$: the inequality fails)'}.\nThe ratio first drops to $1/4$ at $|x|=${fr(cross, 3)}$.`);
      },
    },
    // ======================================================================== 5.4.14
    {
      num: '5.4.14',
      kind: 'Theorem',
      name: 'No truly three-dimensional random walk is recurrent',
      statement: String.raw`Let $S_n$ be a random walk in $\R^3$ whose step $X$ is **truly three-dimensional**: $P(\theta\cdot X\ne0)>0$ for every $\theta\ne0$ (the steps do not lie in a plane through $0$ with probability one). Then $S_n$ is transient.`,
      idea: String.raw`Truly three-dimensional means $\operatorname{Re}(1-\varphi(y))=E(1-\cos y\cdot X)>0$ for $y\ne0$, and by 5.4.13 it is at least $\tfrac14E\bigl[(y\cdot X)^2;\,|y\cdot X|\le\pi/3\bigr]\ge c|y|^2$ for small $y$. Hence $\operatorname{Re}\frac1{1-r\varphi}$ is bounded by $C/|y|^2$ uniformly in $r<1$, and $\int_{|y|<\delta}|y|^{-2}dy<\infty$ in $\R^3$. The supremum in 5.4.11 is finite, so the walk is not recurrent.`,
      caption: String.raw`Gaussian steps with covariance $\operatorname{diag}(1,1,c^2)$; $c=0$ is a planar walk, $c>0$ is truly three-dimensional. The right panel is a side view of one path ($x$ against $z$). The left panel shows the expected number of visits to the unit ball by time $n$ (300 seeded walks): the planar walk (red) keeps climbing, the thick walk with the chosen $c$ follows it until about $n\approx1/c^2$ and then flattens out.`,
      deps: ['prob-5.4.11', 'prob-5.4.13'],
      tags: ['random walk', 'recurrence'],
      scope: String.raw`The theorem needs the steps to span all of $\R^3$; nothing is claimed about the time scale on which transience shows (it is of order $1/c^2$ here).`,
      viz(v) {
        const cS = v.slider('thickness $c$', 0, 1, 0.3, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const N = 4000, M = 300;
        const A = v.stage({ x: [1, N], y: [0, 10], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: 'expected visits to the unit ball' });
        const B = v.stage({ x: [-60, 60], y: [-60, 60], equal: true, axes: 'box', gutter: true, height: 320, xlabel: '$x$', ylabel: '$z$', title: 'side view of one path' });
        let cache = null;
        v.render(() => {
          if (!cache || cache.seed !== seed) {
            const r = v.rng(seed * 3 + 11), X = new Float32Array(M * (N + 1)), Y = new Float32Array(M * (N + 1)), Z = new Float32Array(M * (N + 1));
            for (let w = 0; w < M; w++) { let x = 0, y = 0, z = 0; for (let n = 1; n <= N; n++) { x += r.normal(); y += r.normal(); z += r.normal(); const i = w * (N + 1) + n; X[i] = x; Y[i] = y; Z[i] = z; } }
            cache = { seed, X, Y, Z };
          }
          const { X, Y, Z } = cache, c = cS.value, H = new Float64Array(N + 1), H0 = new Float64Array(N + 1);
          for (let w = 0; w < M; w++) for (let n = 1; n <= N; n++) {
            const i = w * (N + 1) + n, p2 = X[i] * X[i] + Y[i] * Y[i];
            if (p2 < 1) { H0[n]++; if (p2 + c * c * Z[i] * Z[i] < 1) H[n]++; }
          }
          for (let n = 1; n <= N; n++) { H[n] = H[n - 1] + H[n] / M; H0[n] = H0[n - 1] + H0[n] / M; }
          A.setView([1, N], [0, Math.max(0.5, H0[N]) * 1.12]);
          A.path(ptsOf(H0, 8).slice(1), { color: 'red', width: 1.6, dash: [5, 4] });
          A.path(ptsOf(H, 8).slice(1), { color: 'accent', width: 2.4 });
          if (c > 0) A.vline(1 / (c * c), { color: 'faint', dash: [3, 4] });
          const P = []; let ext = 6;
          for (let n = 0; n <= N; n += 2) { const a = X[n], b = c * Z[n]; P.push([a, b]); ext = Math.max(ext, Math.abs(a), Math.abs(b)); }
          ext *= 1.1; B.setView([-ext, ext], [-ext, ext]);
          B.path(P, { color: 'accent', width: 1, alpha: 0.7 });
          B.setLabels('$x$', '$cz$');
          v.res = { h: H[N], h0: H0[N], h1: H[Math.min(N, Math.round(1 / (c * c + 1e-9)))] };
        });
        v.legend([['accent', 'chosen $c$'], ['red', '$c=0$ (planar)', { dash: true }]]);
        v.readout(() => v.res && `Expected visits by $n=4000$: **${fr(v.res.h, 2)}** for $c=${v.fix(cS.value, 2)}$, against ${fr(v.res.h0, 2)} for the planar walk.\n${cS.value === 0 ? 'The steps lie in a plane: not truly three-dimensional, and the walk is recurrent.' : cS.value < 0.1 ? `Truly three-dimensional, hence transient, but the flattening only starts near $n\\approx1/c^2=${Math.round(1 / (cS.value ** 2))}$.` : 'Truly three-dimensional: the visit count saturates.'}`);
      },
    },
  ],
};
