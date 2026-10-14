// Rudin, Functional Analysis — Chapter 7: Fourier Transforms (part 1: 7.1–7.7)
//
// Conventions used throughout (Rudin's): dm_n(x) = (2π)^{-n/2} dx, so
//   f̂(t) = ∫ f(x) e^{-i t·x} dm_n(x),   (f*g)(x) = ∫ f(x−y) g(y) dm_n(y),   (f*g)^ = f̂ ĝ,
//   e^{-|x|²/2} is its own transform.  D_α = i^{-|α|} ∂^α, so (D_α f)^ = t^α f̂ and (x^α f)^ = (−D)_α f̂;
//   in one variable D = −i d/dx, hence (f')^ = i t f̂ and (x f)^ = i (f̂)'.

// ---------------------------------------------------------------- shared helpers
const RT2PI = Math.sqrt(2 * Math.PI);
/** erfc with fractional error < 1.2e-7 everywhere (Numerical Recipes' erfcc). */
function erfc(x) {
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
const erf = (x) => 1 - erfc(x);
const Phi = (x) => 0.5 * erfc(-x / Math.SQRT2);
/** ∫_{-a}^{a} e^{-ixs} dx = 2 sin(as)/s. */
const sincA = (a, s) => (Math.abs(s) < 1e-9 ? 2 * a : 2 * Math.sin(a * s) / s);
/** ∫_a^b e^{-ixs} dx as [re, im]. */
function E1(a, b, s) {
  if (Math.abs(s) < 1e-9) return [b - a, 0];
  // (e^{-ias} − e^{-ibs}) / (i s)
  const re = (Math.sin(b * s) - Math.sin(a * s)) / s;
  const im = (Math.cos(b * s) - Math.cos(a * s)) / s;
  return [re, im];
}
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];

// --- Taylor-mode automatic differentiation: a jet holds f(x), f'(x), f''(x)/2!, …, f^{(4)}(x)/4!
const JK = 5;
const J = {
  c(a) { const r = new Float64Array(JK); r[0] = a; return r; },
  x(x) { const r = new Float64Array(JK); r[0] = x; r[1] = 1; return r; },
  add(a, b) { const r = new Float64Array(JK); for (let i = 0; i < JK; i++) r[i] = a[i] + b[i]; return r; },
  sub(a, b) { const r = new Float64Array(JK); for (let i = 0; i < JK; i++) r[i] = a[i] - b[i]; return r; },
  scale(a, k) { const r = new Float64Array(JK); for (let i = 0; i < JK; i++) r[i] = a[i] * k; return r; },
  mul(a, b) { const r = new Float64Array(JK); for (let k = 0; k < JK; k++) { let s = 0; for (let j = 0; j <= k; j++) s += a[j] * b[k - j]; r[k] = s; } return r; },
  exp(a) { const r = new Float64Array(JK); r[0] = Math.exp(a[0]); for (let k = 1; k < JK; k++) { let s = 0; for (let j = 1; j <= k; j++) s += j * a[j] * r[k - j]; r[k] = s / k; } return r; },
  sincos(a) {
    const s = new Float64Array(JK), c = new Float64Array(JK); s[0] = Math.sin(a[0]); c[0] = Math.cos(a[0]);
    for (let k = 1; k < JK; k++) { let ss = 0, cc = 0; for (let j = 1; j <= k; j++) { ss += j * a[j] * c[k - j]; cc += j * a[j] * s[k - j]; } s[k] = ss / k; c[k] = -cc / k; }
    return [s, c];
  },
  recip(a) { const r = new Float64Array(JK); r[0] = 1 / a[0]; for (let k = 1; k < JK; k++) { let s = 0; for (let j = 1; j <= k; j++) s += a[j] * r[k - j]; r[k] = -s / a[0]; } return r; },
};
const FACT = [1, 1, 2, 6, 24, 120];
/** j-th derivative from a jet. */
const jd = (jet, j) => jet[j] * FACT[j];

/** Cardinal B-spline of order k (box convolved with itself k times, centred, ∫ = 1). */
function bspline(k, x) {
  if (k === 1) return Math.abs(x) < 0.5 ? 1 : Math.abs(x) === 0.5 ? 0.5 : 0;
  let s = 0;
  for (let m = 0; m <= k; m++) { const u = x + k / 2 - m; if (u > 0) s += (m % 2 ? -1 : 1) * binom(k, m) * u ** (k - 1); }
  return s / FACT[k - 1];
}
function binom(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
/** Probabilists' Hermite polynomial He_n. */
function hermite(n, x) { let a = 1, b = x; if (n === 0) return 1; for (let k = 1; k < n; k++) { const c = x * b - k * a; a = b; b = c; } return b; }

export default {
  book: 'fa',
  chapter: 7,
  title: 'Fourier Transforms',
  summary: String.raw`The Fourier transform on $\R^n$, normalised by $dm_n=(2\pi)^{-n/2}dx$. Its natural home is the Schwartz space $\mathscr S_n$ of rapidly decreasing smooth functions, a Fréchet space that the transform maps onto itself with period 4 (the inversion theorem); by density this yields the Plancherel isometry of $L^2$. Duality then extends the transform to tempered distributions, where differentiation and multiplication by polynomials trade places and convolution becomes multiplication. The Paley–Wiener theorems characterise transforms of compactly supported test functions and distributions as entire functions of exponential type, and Sobolev's lemma turns $L^2$ control of enough derivatives into classical smoothness.`,
  items: [
    // ------------------------------------------------------------------ 7.1
    {
      num: '7.1',
      kind: 'Definition',
      name: 'The Fourier transform on $L^1(\\R^n)$',
      statement: String.raw`Write $m_n$ for Lebesgue measure on $\R^n$ divided by $(2\pi)^{n/2}$, $L^p=L^p(m_n)$, and $e_t(x)=e^{i\,t\cdot x}$ for $t,x\in\R^n$. The **Fourier transform** of $f\in L^1$ is the function
$$\hat f(t)=\int_{\R^n} f\,e_{-t}\,dm_n=\int_{\R^n}f(x)\,e^{-i\,t\cdot x}\,dm_n(x)\qquad(t\in\R^n).$$
Convolution is $(f*g)(x)=\int f(x-y)g(y)\,dm_n(y)$, translation is $(\tau_xf)(y)=f(y-x)$, and for a multi-index $\alpha$ one sets $D_\alpha=i^{-|\alpha|}\,\partial^\alpha$, so that $D_\alpha e_t=t^\alpha e_t$.`,
      idea: String.raw`The normalisation of $m_n$ is chosen so that the formulas of this chapter carry no stray constants: $\int e^{-|x|^2/2}\,dm_n=1$, the Gaussian $e^{-|x|^2/2}$ is its own transform, $(f*g)^\wedge=\hat f\hat g$ and the inversion formula has the same shape as the definition. The factor $i^{-|\alpha|}$ in $D_\alpha$ makes the characters $e_t$ eigenfunctions with eigenvalue $t^\alpha$, which is why differentiation will become multiplication by polynomials.`,
      caption: String.raw`$n=2$. Drag the frequency $t$ in the right panel. Left: $\Re\big(f(x)e^{-i\,t\cdot x}\big)$ (blue $>0$, red $<0$); the plane wave $e_{-t}$ is constant along the faint lines $t\cdot x\in 2\pi\Z$, perpendicular to $t$ and $2\pi/|t|$ apart. Right: the whole transform $\hat f$ on the $t$-plane (blue $>0$, red $<0$; all three $f$ are even, so $\hat f$ is real). The readout integrates $f\,e_{-t}\,dm_2$ numerically and compares with the closed form.`,
      deps: [],
      see: ['rca-9.1'],
      tags: ['Fourier transform', 'normalisation'],
      verify: true,
      viz(v) {
        const M = v.M;
        const A = 1.3, B = 0.55, S1 = 1.15, S2 = 0.42, TH = 0.5, P = [0.95, 0.55], SB = 0.42;
        const cT = Math.cos(TH), sT = Math.sin(TH);
        const F = {
          rect: {
            label: 'rectangle', f: (x, y) => (Math.abs(x) <= A && Math.abs(y) <= B ? 1 : 0),
            ft: (s, t) => sincA(A, s) * sincA(B, t) / (2 * Math.PI), box: [A, B], l1: 4 * A * B / (2 * Math.PI),
          },
          gauss: {
            label: 'tilted Gaussian',
            f: (x, y) => { const u = cT * x + sT * y, w = -sT * x + cT * y; return Math.exp(-(u * u / (S1 * S1) + w * w / (S2 * S2)) / 2); },
            ft: (s, t) => { const u = cT * s + sT * t, w = -sT * s + cT * t; return S1 * S2 * Math.exp(-(S1 * S1 * u * u + S2 * S2 * w * w) / 2); },
            box: [5 * S1, 5 * S1], l1: S1 * S2,
          },
          blobs: {
            label: 'two blobs',
            f: (x, y) => Math.exp(-((x - P[0]) ** 2 + (y - P[1]) ** 2) / (2 * SB * SB)) + Math.exp(-((x + P[0]) ** 2 + (y + P[1]) ** 2) / (2 * SB * SB)),
            ft: (s, t) => 2 * Math.cos(P[0] * s + P[1] * t) * SB * SB * Math.exp(-SB * SB * (s * s + t * t) / 2),
            box: [P[0] + 5 * SB, P[1] + 5 * SB], l1: 2 * SB * SB,
          },
        };
        const which = v.select('$f=$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'rect');
        const L = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 330, title: '$x$-plane: $\\Re\\,f(x)e^{-i\\,t\\cdot x}$' });
        const R = v.stage({ x: [-9, 9], y: [-6.6, 6.6], equal: true, height: 330, title: '$t$-plane: $\\hat f(t)$' });
        const th = R.handle(2.6, 1.4, { color: 'gold', label: 't' });
        const cb = v.rgb('blue'), cr = v.rgb('red');
        const signCol = (val, m) => { const a = Math.min(1, Math.abs(val) / m) ** 0.7; const c = val >= 0 ? cb : cr; return [c[0], c[1], c[2], Math.round(235 * a)]; };
        let st = {};
        v.render(() => {
          const o = F[which.value];
          const t1 = th.x, t2 = th.y;
          // left: the integrand
          L.raster((x, y) => { const fv = o.f(x, y); if (fv < 2e-3) return null; return signCol(fv * Math.cos(t1 * x + t2 * y), 1); }, { res: 2, key: `${which.value}|${t1.toFixed(4)}|${t2.toFixed(4)}`, id: 'ig' });
          const tn = Math.hypot(t1, t2);
          if (tn > 0.15) {
            const ux = t1 / tn, uy = t2 / tn, sp = 2 * Math.PI / tn;
            for (let k = -Math.ceil(5 / sp); k <= Math.ceil(5 / sp); k++) {
              const c0 = k * sp;
              L.line(c0 * ux - 6 * uy, c0 * uy + 6 * ux, c0 * ux + 6 * uy, c0 * uy - 6 * ux, { color: 'muted', width: 1, alpha: 0.55, dash: [3, 4] });
            }
            L.arrow(-2.55, -1.75, -2.55 + 0.7 * ux, -1.75 + 0.7 * uy, { color: 'gold', width: 2, head: 8 });
            L.tex('t/|t|', -2.55 + 0.7 * ux, -1.75 + 0.7 * uy, { color: 'gold', size: 13, dx: ux >= 0 ? 16 : -16, dy: -8 });
          }
          if (which.value === 'rect') L.rect(-A, -B, A, B, { color: 'ink', width: 1.4 });
          // right: the transform
          const mx = o.ft(0, 0);
          R.raster((s, t) => signCol(o.ft(s, t), mx * 0.6), { res: 2, key: which.value, id: 'ft' });
          R.axes();
          // quadrature of ∫ f e_{-t} dm_2 (midpoint rule on the support box)
          const [bx, by] = o.box, n = 200, hx = 2 * bx / n, hy = 2 * by / n;
          let re = 0, im = 0;
          for (let i = 0; i < n; i++) {
            const x = -bx + (i + 0.5) * hx;
            for (let j = 0; j < n; j++) {
              const y = -by + (j + 0.5) * hy, fv = o.f(x, y); if (!fv) continue;
              const ph = t1 * x + t2 * y; re += fv * Math.cos(ph); im -= fv * Math.sin(ph);
            }
          }
          const w = hx * hy / (2 * Math.PI);
          st = { re: re * w, im: im * w, ex: o.ft(t1, t2), l1: o.l1, t1, t2, sp: tn > 1e-9 ? 2 * Math.PI / tn : Infinity };
        });
        v.legend([['blue', 'positive values', { area: true }], ['red', 'negative values', { area: true }], ['muted', 'wavefronts $t\\cdot x\\in2\\pi\\Z$', { dash: true }]]);
        v.readout(() => {
          const s = st;
          return `$t=(${v.fix(s.t1, 2)},\\,${v.fix(s.t2, 2)})$, wavelength $2\\pi/|t|=${isFinite(s.sp) ? v.fix(s.sp, 2) : '\\infty'}$. Quadrature: $\\int f\\,e_{-t}\\,dm_2 = ${v.fix(s.re, 4)} ${s.im < 0 ? '-' : '+'} ${v.fix(Math.abs(s.im), 4)}\\,i$; closed form $\\hat f(t)=${v.fix(s.ex, 4)}$. Always $|\\hat f(t)|\\le\\|f\\|_1=${v.fix(s.l1, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.2
    {
      num: '7.2',
      kind: 'Theorem',
      name: 'Translation, modulation, convolution and dilation',
      statement: String.raw`Let $f,g\in L^1(\R^n)$ and $x,t\in\R^n$. Then
(a) $(\tau_x f)^\wedge=e_{-x}\hat f$;
(b) $(e_x f)^\wedge=\tau_x\hat f$;
(c) $(f*g)^\wedge=\hat f\,\hat g$;
(d) if $\lambda>0$ and $h(y)=f(y/\lambda)$, then $\hat h(t)=\lambda^n\hat f(\lambda t)$.`,
      idea: String.raw`Each identity is one change of variables in the defining integral: substitute $y\mapsto y+x$ for (a), multiply the exponentials for (b), use Fubini and the translation invariance of $m_n$ for (c), and substitute $y=\lambda u$ (Jacobian $\lambda^n$) for (d). Moving $f$ only twists the phase of $\hat f$; twisting the phase of $f$ moves $\hat f$; spreading $f$ out concentrates $\hat f$.`,
      caption: String.raw`$n=2$, $f=$ the indicator of an L-shaped set. Right: phase portrait of the transform (hue $=\arg$, brightness $=|\cdot|$). Choose an operation and drag its handle or slider. Translating $f$ by $x$ leaves $|\hat f|$ alone and adds the phase ramp $e^{-i\,x\cdot t}$ (stripes of colour); modulating by $e_x$ slides the picture; dilating by $\lambda$ shrinks it by $1/\lambda$ and multiplies it by $\lambda^2$; convolving with a Gaussian damps it. Drag the probe $q$: the readout compares the formula with an independent quadrature of the new function.`,
      deps: ['fa-7.1'],
      see: ['rca-9.2'],
      tags: ['Fourier transform', 'convolution', 'symmetries'],
      viz(v) {
        const M = v.M;
        const RECTS = [[-1, 1, -1, 0], [-1, 0, 0, 1]];         // [a, b] × [c, d]
        const fL = (x, y) => (RECTS.some(([a, b, c, d]) => x >= a && x <= b && y >= c && y <= d) ? 1 : 0);
        const fLhat = (s, t) => { let re = 0, im = 0; for (const [a, b, c, d] of RECTS) { const p = cmul(E1(a, b, s), E1(c, d, t)); re += p[0]; im += p[1]; } return [re / (2 * Math.PI), im / (2 * Math.PI)]; };
        const conv = (x, y, sg) => { let s = 0; for (const [a, b, c, d] of RECTS) s += (Phi((x - a) / sg) - Phi((x - b) / sg)) * (Phi((y - c) / sg) - Phi((y - d) / sg)); return s; };
        const op = v.select('operation', [
          { value: 'none', label: '$f$' }, { value: 'tr', label: '(a) $\\tau_x f$' }, { value: 'mod', label: '(b) $e_x f$' },
          { value: 'conv', label: '(c) $f*g_\\sigma$' }, { value: 'dil', label: '(d) $f(\\cdot/\\lambda)$' }], 'tr');
        const lamS = v.slider('$\\lambda$', 0.4, 2.2, 1.6, { step: 0.01 });
        const sgS = v.slider('$\\sigma$ (Gaussian $g_\\sigma$)', 0.03, 0.6, 0.18, { step: 0.01 });
        const L = v.stage({ x: [-3, 3], y: [-2.6, 2.6], equal: true, height: 330, title: 'the function on the $x$-plane' });
        const R = v.stage({ x: [-9, 9], y: [-7.8, 7.8], equal: true, height: 330, title: 'its transform on the $t$-plane: hue $=\\arg$, brightness $=|\\cdot|$' });
        const ph = L.handle(1.1, 0.8, { color: 'orange', label: 'x' });
        const mh = R.handle(2.2, -1.6, { color: 'orange', label: 'x' });
        const q = R.handle(-3.3, 2.4, { color: 'gold', label: 'q' });
        const peak = 3 / (2 * Math.PI); // |f̂(0)| = area/2π
        function model() {
          const o = op.value, lam = lamS.value, sg = sgS.value, px = ph.x, py = ph.y, mx = mh.x, my = mh.y;
          if (o === 'tr') return { f: (x, y) => [fL(x - px, y - py), 0], ft: (s, t) => cmul([Math.cos(px * s + py * t), -Math.sin(px * s + py * t)], fLhat(s, t)), box: [-1 + px, 1 + px, -1 + py, 1 + py], key: `tr${px.toFixed(3)},${py.toFixed(3)}`, sc: 1 };
          if (o === 'mod') return { f: (x, y) => { const v0 = fL(x, y); return [v0 * Math.cos(mx * x + my * y), v0 * Math.sin(mx * x + my * y)]; }, ft: (s, t) => fLhat(s - mx, t - my), box: [-1, 1, -1, 1], key: `mod${mx.toFixed(3)},${my.toFixed(3)}`, sc: 1 };
          if (o === 'dil') return { f: (x, y) => [fL(x / lam, y / lam), 0], ft: (s, t) => { const z = fLhat(lam * s, lam * t); return [lam * lam * z[0], lam * lam * z[1]]; }, box: [-lam, lam, -lam, lam], key: `dil${lam}`, sc: lam * lam };
          if (o === 'conv') return { f: (x, y) => [conv(x, y, sg), 0], ft: (s, t) => { const z = fLhat(s, t), g = Math.exp(-sg * sg * (s * s + t * t) / 2); return [z[0] * g, z[1] * g]; }, box: [-1 - 5 * sg, 1 + 5 * sg, -1 - 5 * sg, 1 + 5 * sg], key: `conv${sg}`, sc: 1 };
          return { f: (x, y) => [fL(x, y), 0], ft: fLhat, box: [-1, 1, -1, 1], key: 'none', sc: 1 };
        }
        const cb = v.rgb('blue'), cr = v.rgb('red');
        let st = {};
        v.render(() => {
          const o = op.value, m = model();
          lamS.el.hidden = o !== 'dil'; sgS.el.hidden = o !== 'conv';
          ph.visible = o === 'tr'; mh.visible = o === 'mod';
          // left: the function (real part; modulation shows Re with sign)
          L.raster((x, y) => {
            const [re] = m.f(x, y); if (Math.abs(re) < 4e-3) return null;
            const c = re >= 0 ? cb : cr; return [c[0], c[1], c[2], Math.round(225 * Math.min(1, Math.abs(re)) ** 0.8)];
          }, { res: 2, key: m.key, id: 'f' });
          if (o !== 'conv') {
            const tf = o === 'tr' ? (p) => [p[0] + ph.x, p[1] + ph.y] : o === 'dil' ? (p) => [p[0] * lamS.value, p[1] * lamS.value] : (p) => p;
            L.poly([[-1, -1], [1, -1], [1, 0], [0, 0], [0, 1], [-1, 1]].map(tf), { color: 'ink', width: 1.3 });
          }
          if (o === 'tr') { L.arrow(0, 0, ph.x, ph.y, { color: 'orange', width: 1.6, head: 8, dash: [4, 3] }); L.dot(0, 0, { color: 'muted', r: 3 }); }
          if (o === 'mod') L.corner('Re(e_x f) shown', 'tl', { color: 'muted' });
          // right: phase portrait
          const ref = peak * m.sc;
          R.raster((s, t) => {
            const [re, im] = m.ft(s, t), mod = Math.hypot(re, im);
            const l = 0.08 + 0.62 * Math.min(1, mod / ref) ** 0.45;
            return M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.75, l);
          }, { res: 2, key: m.key, id: 'ft' });
          R.axes();
          if (o === 'mod') { R.arrow(0, 0, mh.x, mh.y, { color: 'orange', width: 1.6, head: 8, dash: [4, 3] }); }
          // probe: formula vs quadrature of the transformed function
          const [x0, x1, y0, y1] = m.box, n = 170, hx = (x1 - x0) / n, hy = (y1 - y0) / n;
          let re = 0, im = 0;
          for (let i = 0; i < n; i++) {
            const x = x0 + (i + 0.5) * hx;
            for (let j = 0; j < n; j++) {
              const y = y0 + (j + 0.5) * hy, [fr, fi] = m.f(x, y); if (!fr && !fi) continue;
              const c = Math.cos(q.x * x + q.y * y), s = Math.sin(q.x * x + q.y * y);
              re += fr * c + fi * s; im += fi * c - fr * s;
            }
          }
          const w = hx * hy / (2 * Math.PI);
          st = { o, quad: [re * w, im * w], form: m.ft(q.x, q.y), base: fLhat(q.x, q.y), q: [q.x, q.y] };
        });
        v.legend([['gold', 'probe $q$', { dot: true }], ['orange', 'shift $x$ (handles)', { dot: true }]]);
        v.readout(() => {
          const s = st; const c = (z) => `${v.fix(z[0], 4)} ${z[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(z[1]), 4)}\\,i`;
          const rule = { none: '\\hat f(q)', tr: 'e^{-i\\,x\\cdot q}\\,\\hat f(q)', mod: '\\hat f(q-x)', conv: '\\hat f(q)\\,\\hat g_\\sigma(q)', dil: '\\lambda^2\\hat f(\\lambda q)' }[s.o];
          return `At $q=(${v.fix(s.q[0], 2)},${v.fix(s.q[1], 2)})$: formula $${rule}=${c(s.form)}$; quadrature of the new function: $${c(s.quad)}$. (For comparison $|\\hat f(q)|=${v.fix(Math.hypot(...s.base), 4)}$, now $${v.fix(Math.hypot(...s.form), 4)}$.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.3
    {
      num: '7.3',
      kind: 'Definition',
      name: 'The Schwartz space $\\mathscr S_n$ of rapidly decreasing functions',
      statement: String.raw`$\mathscr S_n$ is the set of all $f\in C^\infty(\R^n)$ such that
$$\|f\|_N=\max_{|\alpha|\le N}\ \sup_{x\in\R^n}\,(1+|x|^2)^N\,|(D_\alpha f)(x)|<\infty\qquad(N=0,1,2,\dots).$$
Equivalently, $P\cdot D_\alpha f$ is bounded on $\R^n$ for every polynomial $P$ and every multi-index $\alpha$: $f$ and all its derivatives decay faster than every power of $|x|$. $\mathscr S_n$ carries the locally convex topology defined by the norms $\|\cdot\|_N$.`,
      idea: String.raw`Decay alone is not enough — every derivative must decay as well — and smoothness alone is not enough either. The space contains $\mathscr D(\R^n)$ and the Gaussians, and it is built so that both multiplication by $x_j$ and differentiation $D_j$ leave it invariant; under the Fourier transform these two operations are exchanged, which is why $\mathscr S_n$ will turn out to be mapped onto itself.`,
      caption: String.raw`Click a cell of the table to choose the weight power $N$ and the derivative order $j$; drag the orange handle to set the window $|x|\le R$. Top: $\log_{10}\big[(1+x^2)^N|f^{(j)}(x)|\big]$. Table: $\sup_{|x|\le R}(1+x^2)^N|f^{(j)}(x)|$ (shade = $\log_{10}$ of the value); an arrow marks a supremum attained in the outer 15% of the window, i.e. still growing with $R$ and possibly unbounded. For $f\in\mathscr S_1$ every cell settles as $R$ grows; $1/(1+x^2)$ fails for $N\ge2$, and $\operatorname{sech}x\,\sin(e^x)$ decays like $e^{-x}$ while its derivatives do not decay at all.`,
      deps: ['fa-1.46', 'fa-1.37'],
      tags: ['Schwartz space', 'seminorms'],
      viz(v) {
        const M = v.M;
        const sech = (X) => J.recip(J.scale(J.add(J.exp(X), J.exp(J.scale(X, -1))), 0.5));
        const FN = {
          gauss: { label: '$e^{-x^2/2}$', S: true, jet: (X) => J.exp(J.scale(J.mul(X, X), -0.5)) },
          sech: { label: '$\\operatorname{sech}x$', S: true, jet: sech },
          bump: { label: 'bump $\\in\\mathscr D$', S: true, jet: (X) => (Math.abs(X[0]) >= 1 ? J.c(0) : J.exp(J.scale(J.recip(J.sub(J.c(1), J.mul(X, X))), -1))) },
          lor: { label: '$\\frac1{1+x^2}$', S: false, jet: (X) => J.recip(J.add(J.c(1), J.mul(X, X))) },
          wig: { label: '$\\operatorname{sech}x\\,\\sin(e^x)$', S: false, jet: (X) => J.mul(sech(X), J.sincos(J.exp(X))[0]) },
        };
        const which = v.select('$f=$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'gauss');
        const XM = 12, NG = 2400;
        const top = v.stage({ x: [-0.3, XM], y: [-9, 7], height: 250, full: true, axes: 'box', xlabel: 'x', yticks: [-8, -6, -4, -2, 0, 2, 4, 6], title: 'log' });
        const tab = v.stage({ x: [-1.4, 5.2], y: [-0.9, 5.25], height: 250, full: true, axes: false, title: 'table of $\\sup_{|x|\\le R}(1+x^2)^N|f^{(j)}(x)|$ (click a cell)' });
        const Rh = top.handle(9, -8.2, { color: 'orange', label: 'R', constrain: (x) => [M.clamp(x, 0.5, XM), -8.2] });
        let selN = 2, selJ = 1;
        tab.onClick((x, y) => { const j = Math.floor(x + 0.5), N = 4 - Math.floor(y - 0.25 + 0.5); if (j >= 0 && j <= 4 && N >= 0 && N <= 4) { selN = N; selJ = j; } });
        const cache = {};
        function data(key) {
          if (cache[key]) return cache[key];
          const xs = M.linspace(0, XM, NG + 1);
          // |f^{(j)}(x)| on x ≥ 0 and x ≤ 0 combined into g(x) = max(|f^{(j)}(x)|, |f^{(j)}(−x)|) for the symmetric window
          const der = [0, 1, 2, 3, 4].map(() => new Float64Array(NG + 1));
          xs.forEach((x, i) => {
            const a = FN[key].jet(J.x(x)), b = FN[key].jet(J.x(-x));
            for (let j = 0; j <= 4; j++) der[j][i] = Math.max(Math.abs(jd(a, j)), Math.abs(jd(b, j)));
          });
          // prefix maxima of (1+x²)^N |f^{(j)}| and the index where they were attained
          const pm = [];
          for (let N = 0; N <= 4; N++) { pm.push([]); for (let j = 0; j <= 4; j++) { const m = new Float64Array(NG + 1), at = new Int32Array(NG + 1); let best = -1, bi = 0; xs.forEach((x, i) => { const w = (1 + x * x) ** N * der[j][i]; if (w > best * (1 + 1e-9) + 1e-300) { best = w; bi = i; } m[i] = Math.max(best, w); at[i] = bi; }); pm[N].push({ m, at }); } }
          return (cache[key] = { xs, der, pm });
        }
        let st = {};
        v.render(() => {
          const key = which.value, D = data(key), F = FN[key];
          const iR = Math.round(Rh.x / XM * NG);
          // top: log-weighted derivative
          top.vband(0, Rh.x, { color: 'orange', alpha: 0.07 });
          top.vline(Rh.x, { color: 'orange', width: 1.2, dash: [5, 4] });
          const pts = D.xs.map((x, i) => { const w = (1 + x * x) ** selN * D.der[selJ][i]; return [x, w > 0 ? Math.max(-12, Math.log10(w)) : -12]; });
          const pts0 = D.xs.map((x, i) => [x, D.der[0][i] > 0 ? Math.max(-12, Math.log10(D.der[0][i])) : -12]);
          top.path(pts0, { color: 'faint', width: 1.4 });
          top.path(pts, { color: F.S ? 'blue' : 'red', width: 2 });
          const cell = D.pm[selN][selJ], sup = cell.m[iR], at = D.xs[cell.at[iR]];
          if (sup > 0) { top.hline(Math.log10(sup), { color: 'green', width: 1.2, dash: [3, 3] }); top.dot(at, Math.log10(sup), { color: 'green', r: 4.5 }); }
          top.setTitle(`$\\log_{10}\\big[(1+x^2)^{${selN}}\\,|f^{(${selJ})}(x)|\\big]$ for $0\\le x\\le ${XM}$ (grey: $\\log_{10}|f|$)`);
          // table
          const lo = -6, hi = 8;
          for (let N = 0; N <= 4; N++) for (let j = 0; j <= 4; j++) {
            const c = D.pm[N][j], val = c.m[iR], edge = c.at[iR] >= 0.85 * iR && iR < NG && val > 1e-300;
            const y = 4 - N + 0.25, t = M.clamp((Math.log10(Math.max(val, 1e-300)) - lo) / (hi - lo), 0, 1);
            tab.rect(j - 0.46, y - 0.42, j + 0.46, y + 0.42, { fill: edge ? 'red' : 'blue', fillAlpha: 0.08 + 0.55 * t, stroke: false });
            if (N === selN && j === selJ) tab.rect(j - 0.48, y - 0.44, j + 0.48, y + 0.44, { color: 'gold', width: 2.6 });
            tab.text((val < 1e-3 || val >= 1e5 ? val.toExponential(1) : v.fmt(val, 3)) + (edge ? ' ↑' : ''), j, y, { align: 'center', size: 11.5, color: 'ink' });
          }
          for (let j = 0; j <= 4; j++) tab.text(`j = ${j}`, j, 4.95, { align: 'center', size: 11.5, color: 'muted' });
          for (let N = 0; N <= 4; N++) tab.text(`N = ${N}`, -0.62, 4 - N + 0.25, { align: 'right', size: 11.5, color: 'muted' });
          tab.text(`window |x| ≤ ${v.fix(Rh.x, 2)}`, 4.9, -0.55, { align: 'right', size: 11.5, color: 'orange' });
          let rudin = []; for (let N = 0; N <= 4; N++) { let m = 0; for (let j = 0; j <= N; j++) m = Math.max(m, D.pm[N][j].m[iR]); rudin.push(m); }
          let edges = 0; for (let N = 0; N <= 4; N++) for (let j = 0; j <= 4; j++) { const c = D.pm[N][j]; if (c.at[iR] >= 0.85 * iR && iR < NG && c.m[iR] > 1e-300) edges++; }
          st = { S: F.S, rudin, edges, R: Rh.x, sup, at };
        });
        v.legend([['blue', 'weighted derivative (in $\\mathscr S$)'], ['red', 'weighted derivative (not in $\\mathscr S$)'], ['faint', '$\\log_{10}|f|$'], ['green', 'its sup on the window', { dash: true }]]);
        v.readout(() => {
          const s = st;
          const norms = s.rudin.map((m, N) => `\\|f\\|_${N}\\approx${v.sci(m, 3)}`).join(',\\ ');
          return `On $|x|\\le ${v.fix(s.R, 2)}$: $${norms}$. ` + (s.S ? (s.edges ? `${s.edges} cell(s) still grow with $R$ — widen the window; for $f\\in\\mathscr S_1$ all of them settle.` : 'Every supremum is attained inside the window and stays put as $R$ grows: $f\\in\\mathscr S_1$.') : `${s.edges} cell(s) keep growing with $R$: some $\\|f\\|_N=\\infty$, so $f\\notin\\mathscr S_1$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 7.4
    {
      num: '7.4',
      kind: 'Theorem',
      name: '$\\mathscr S_n$ is a Fréchet space invariant under $D_\\alpha$, $P$ and $\\mathcal F$',
      statement: String.raw`(a) $\mathscr S_n$ is a Fréchet space with the norms $\|\cdot\|_N$.
(b) If $P$ is a polynomial, $g\in\mathscr S_n$ and $\alpha$ is a multi-index, then $f\mapsto Pf$, $f\mapsto gf$ and $f\mapsto D_\alpha f$ are continuous linear maps of $\mathscr S_n$ into $\mathscr S_n$.
(c) If $f\in\mathscr S_n$ and $P$ is a polynomial, then $(P(D)f)^\wedge=P\,\hat f$ and $(Pf)^\wedge=P(-D)\hat f$.
(d) The Fourier transform is a continuous linear map of $\mathscr S_n$ into $\mathscr S_n$.`,
      idea: String.raw`Completeness: a $\|\cdot\|_N$-Cauchy sequence converges uniformly with all derivatives, and the weighted bounds pass to the limit. Part (b) is the Leibniz rule plus the fact that $(1+|x|^2)^N$ dominates $|P|$ up to a constant. For (c) differentiate under the integral sign, or integrate by parts — this uses only that $f$ and its derivatives decay fast. Then (d): $P\cdot D_\alpha\hat f$ is the transform of $D_\alpha$-derivatives of polynomial multiples of $f$, which lie in $\mathscr S_n\subset L^1$, so it is bounded by an $L^1$ norm that is in turn controlled by some $\|f\|_M$.`,
      caption: String.raw`Why the transform turns smoothness into decay. The B-splines $B_k$ ($k$-fold convolution powers of the box) are $C^{k-2}$, their transforms are $(2\pi)^{-1/2}\big(\tfrac{\sin(t/2)}{t/2}\big)^k$. Raise $N$: left, $f^{(N)}$ (for $N=k$ it is a combination of point masses, drawn as arrows); right, $\log_{10}|t^N\hat f(t)|$ on log–log axes, which by (c) is $|\widehat{f^{(N)}}|$. It decays while $N<k$, stays bounded at $N=k$, and grows beyond. For the Gaussian, which lies in $\mathscr S_1$, every $t^N\hat f$ decays.`,
      deps: ['fa-7.3', 'fa-1.46', 'fa-1.37'],
      see: ['pma-8.14'],
      tags: ['Schwartz space', 'smoothness and decay'],
      viz(v) {
        const M = v.M;
        const SG = Math.sqrt(1 / 3);
        const FN = {
          b1: { label: '$B_1$ (jump)', k: 1 }, b2: { label: '$B_2$ (kink)', k: 2 }, b3: { label: '$B_3\\in C^1$', k: 3 }, b4: { label: '$B_4\\in C^2$', k: 4 },
          g: { label: 'Gaussian $\\in\\mathscr S$', k: Infinity },
        };
        const which = v.select('$f=$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'b2');
        const NS = v.slider('$N$', 0, 5, 1, { int: true });
        const L = v.stage({ x: [-3, 3], y: [-1.5, 1.5], height: 300, axes: true, title: 'the derivative $f^{(N)}$' });
        const R = v.stage({ x: [-0.05, 2.5], y: [-8, 3], height: 300, axes: 'box', xticks: [[0, '1'], [1, '10'], [2, '100']], yticks: [-8, -6, -4, -2, 0, 2], title: '$\\log_{10}|t^N\\hat f(t)|$ against $t$ (log scale)' });
        const fhat = (k, t) => (k === Infinity ? SG * Math.exp(-SG * SG * t * t / 2) : (Math.abs(t) < 1e-9 ? 1 : (Math.sin(t / 2) / (t / 2)) ** k) / RT2PI);
        function dN(k, N, x) {
          if (k === Infinity) return (N % 2 ? -1 : 1) * SG ** (-N) * hermite(N, x / SG) * Math.exp(-x * x / (2 * SG * SG));
          let s = 0; for (let m = 0; m <= N; m++) s += (m % 2 ? -1 : 1) * binom(N, m) * bspline(k - N, x + N / 2 - m); return s;
        }
        let st = {};
        v.render(() => {
          const F = FN[which.value], k = F.k, N = NS.value;
          // left panel
          if (k !== Infinity && N >= k) {
            if (N === k) {
              const ws = M.range(k + 1).map((m) => [m - k / 2, (m % 2 ? -1 : 1) * binom(k, m)]);
              const mx = Math.max(...ws.map((w) => Math.abs(w[1])));
              L.setView(null, [-mx * 1.35, mx * 1.35]);
              for (const [x, w] of ws) { L.arrow(x, 0, x, w, { color: 'purple', width: 2.4, head: 9 }); L.text((w > 0 ? '+' : '') + w, x, w, { dy: w > 0 ? -12 : 12, align: 'center', color: 'purple', size: 12 }); }
              L.corner('f^(N) = a sum of point masses (a measure, not a function)', 'tl', { color: 'purple' });
            } else {
              L.setView(null, [-1.5, 1.5]);
              L.corner('f^(N) involves derivatives of point masses', 'tl', { color: 'red', weight: 600 });
            }
          } else {
            let mx = 0; for (let i = 0; i <= 300; i++) mx = Math.max(mx, Math.abs(dN(k, N, -3 + 6 * i / 300)));
            mx = Math.max(mx, 0.2) * 1.2; L.setView(null, [-mx, mx]);
            if (N > 0) L.fn((x) => dN(k, 0, x) * mx / 1.2 / Math.max(1e-9, dN(k, 0, 0)) * 0.5, { color: 'faint', width: 1.4, dash: [4, 3] });
            L.fn((x) => dN(k, N, x), { color: 'blue', width: 2.4, n: 1200 });
          }
          // right panel: log-log
          const pts = []; let maxTail = 0;
          for (let i = 0; i <= 1600; i++) {
            const u = 2.5 * i / 1600, t = 10 ** u, y = Math.abs(t ** N * fhat(k, t));
            pts.push([u, y > 0 ? Math.max(-12, Math.log10(y)) : -12]);
            if (u > 2) maxTail = Math.max(maxTail, y);
          }
          if (k !== Infinity) R.fn((u) => Math.log10((2 / 10 ** u) ** k * (10 ** u) ** N / RT2PI), { color: 'orange', width: 1.4, dash: [6, 4], domain: [0.4, 2.5] });
          R.path(pts, { color: 'blue', width: 1.6 });
          const slope = k === Infinity ? null : N - k;
          R.corner(k === Infinity ? 'decays faster than every power' : `envelope slope N − k = ${slope}: ${slope < 0 ? 'decays' : slope === 0 ? 'bounded, not → 0' : 'grows'}`, 'tr', { color: k === Infinity || slope < 0 ? 'green' : slope === 0 ? 'orange' : 'red', weight: 600 });
          // numerical check of (c): ∫ f^{(N)} e^{-ixt} dm vs (it)^N f̂ at t = 2.7
          let chk = null;
          if (k === Infinity || N < k) {
            const t0 = 2.7, a = k === Infinity ? -6 : -k / 2, b = -a, nq = k === Infinity ? 4000 : 2400 * k; // jumps of f^{(N)} fall on Simpson panel ends
            const re = M.integrate((x) => dN(k, N, x) * Math.cos(t0 * x), a, b, nq) / RT2PI, im = -M.integrate((x) => dN(k, N, x) * Math.sin(t0 * x), a, b, nq) / RT2PI;
            const mag = t0 ** N * fhat(k, t0); const ph = [[1, 0], [0, 1], [-1, 0], [0, -1]][N % 4];
            chk = { quad: [re, im], form: [ph[0] * mag, ph[1] * mag] };
          }
          st = { k, N, maxTail, chk };
        });
        v.legend([['blue', '$f^{(N)}$ and $|t^N\\hat f|$'], ['faint', '$f$ (rescaled)', { dash: true }], ['orange', 'envelope $(2/t)^k t^N/\\sqrt{2\\pi}$', { dash: true }], ['purple', 'point masses']]);
        v.readout(() => {
          const s = st;
          const c = s.chk ? ` Check of (c) at $t=2.7$: $\\int f^{(N)}e^{-ixt}dm=${v.fix(s.chk.quad[0], 4)}${s.chk.quad[1] < 0 ? '-' : '+'}${v.fix(Math.abs(s.chk.quad[1]), 4)}i$ and $(it)^N\\hat f(t)=${v.fix(s.chk.form[0], 4)}${s.chk.form[1] < 0 ? '-' : '+'}${v.fix(Math.abs(s.chk.form[1]), 4)}i$.` : '';
          return `$\\max_{100\\le t\\le 316}|t^{${s.N}}\\hat f(t)| = ${v.sci(s.maxTail, 3)}$.` + c;
        });
      },
    },
    // ------------------------------------------------------------------ 7.5
    {
      num: '7.5',
      kind: 'Theorem',
      name: 'Riemann–Lebesgue: $\\hat f\\in C_0(\\R^n)$ for $f\\in L^1$',
      statement: String.raw`If $f\in L^1(\R^n)$, then $\hat f\in C_0(\R^n)$ and $\|\hat f\|_\infty\le\|f\|_1$.`,
      idea: String.raw`The inequality is immediate from $|e_{-t}|=1$. For the rest, choose $g_i\in\mathscr D(\R^n)\subset\mathscr S_n$ with $\|f-g_i\|_1\to0$. By 7.4(d) each $\hat g_i$ lies in $\mathscr S_n\subset C_0(\R^n)$, and the inequality applied to $f-g_i$ gives $\|\hat f-\hat g_i\|_\infty\le\|f-g_i\|_1\to0$. A uniform limit of functions in $C_0$ is in $C_0$.`,
      caption: String.raw`Take $g=f*\rho_\varepsilon$, a Gaussian smoothing of $f$ ($\hat\rho_\varepsilon(t)=e^{-\varepsilon^2t^2/2}$), and shrink $\varepsilon$ (log scale). Top: $f$ and $g$. Bottom: $|\hat f|$ (black) under the bound $\|f\|_1$, and $|\hat g|$ (blue), which dies off like a Gaussian; the orange curve is $|\hat f-\hat g|$, which never rises above the green line $\|f-g\|_1$. So $\hat f$ is a uniform limit of transforms of smooth rapidly decreasing functions. The third $f$ is unbounded and $\hat f$ decays only like $t^{-1/2}$ — still in $C_0$.`,
      deps: ['fa-7.4', 'fa-7.1'],
      see: ['rca-9.6'],
      tags: ['Riemann–Lebesgue', 'Fourier transform'],
      verify: true,
      viz(v) {
        const M = v.M;
        const FN = {
          box: {
            label: '$\\chi_{[-1,1]}$', f: (x) => (Math.abs(x) <= 1 ? 1 : 0), ft: (t) => sincA(1, t) / RT2PI, y: [-0.2, 1.2],
            g: (x, e) => Phi((x + 1) / e) - Phi((x - 1) / e), l1: 2 / RT2PI,
          },
          exp: {
            label: '$e^{-|x|}$', f: (x) => Math.exp(-Math.abs(x)), ft: (t) => Math.sqrt(2 / Math.PI) / (1 + t * t), y: [-0.2, 1.15],
            g: (x, e) => 0.5 * Math.exp(e * e / 2) * (Math.exp(-x) * (1 - erf((e * e - x) / (e * Math.SQRT2))) + Math.exp(x) * (1 - erf((e * e + x) / (e * Math.SQRT2)))), l1: 2 / RT2PI,
          },
          sing: {
            label: '$|x|^{-1/2}e^{-|x|}$', f: (x) => Math.exp(-Math.abs(x)) / Math.sqrt(Math.abs(x)), ft: (t) => { const r = Math.sqrt(Math.hypot(1, t)), th = Math.atan(t) / 2; return Math.SQRT2 * Math.cos(th) / r; }, y: [-0.3, 3.2],
            g: null, l1: 2 * Math.sqrt(Math.PI) / RT2PI,
          },
        };
        const which = v.select('$f=$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'box');
        const eS = v.slider('$\\varepsilon$', 0.01, 0.6, 0.15, { log: true, fmt: (x) => v.fix(x, 3) });
        const top = v.stage({ x: [-3, 3], y: [-0.15, 1.25], height: 220, full: true, axes: 'box', xlabel: 'x' });
        const bot = v.stage({ x: [0, 60], y: [-0.08, 0.9], height: 230, full: true, axes: 'box', xlabel: 't', title: '$|\\hat f|$, $|\\hat g|$ and $|\\hat f-\\hat g|$ on $[0,60]$' });
        const cache = {};
        // g for the singular f, by inverse transform of f̂·e^{-ε²t²/2} (smooth, rapidly decaying integrand)
        function gSing(e) {
          const key = e.toFixed(5); if (cache[key]) return cache[key];
          const T = Math.min(4000, 9 / e), n = Math.ceil(T * 10) * 2;
          const ts = M.linspace(0, T, n + 1), w = ts.map((t, i) => (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * (T / n) / 3 * FN.sing.ft(t) * Math.exp(-e * e * t * t / 2));
          const xs = M.linspace(0, 6, 241), gs = xs.map((x) => { let s = 0; for (let i = 0; i <= n; i++) s += w[i] * Math.cos(x * ts[i]); return 2 * s / RT2PI; });
          return (cache[key] = { xs, gs });
        }
        let st = {};
        v.render(() => {
          const F = FN[which.value], e = eS.value;
          top.setView(null, F.y);
          let gfun;
          if (F.g) gfun = (x) => F.g(x, e);
          else { const G = gSing(e); gfun = (x) => { const ax = Math.abs(x), i = Math.min(239, Math.floor(ax / 6 * 240)), u = ax / 6 * 240 - i; return G.gs[i] * (1 - u) + G.gs[i + 1] * u; }; }
          top.fn(F.f, { color: 'ink', width: 2, n: 1400, fill: 'ink', fillAlpha: 0.06 });
          top.fn(gfun, { color: 'blue', width: 2.2, n: 800 });
          // ‖f − g‖₁ in dm (for the singular f substitute x = u² near 0)
          let l1;
          if (which.value === 'sing') {
            const near = M.integrate((u) => Math.abs(Math.exp(-u * u) - u * gfun(u * u)) * 2, 0, 1, 800);
            const far = M.integrate((x) => Math.abs(F.f(x) - gfun(x)), 1, 6, 1000);
            l1 = 2 * (near + far) / RT2PI;
          } else if (which.value === 'box') l1 = 2 * (M.integrate((x) => Math.abs(1 - gfun(x)), 0, 1, 1000) + M.integrate((x) => Math.abs(gfun(x)), 1, 8, 4000)) / RT2PI;
          else l1 = 2 * M.integrate((x) => Math.abs(F.f(x) - gfun(x)), 0, 8, 6000) / RT2PI;
          // bottom
          const hiY = Math.max(F.l1, l1) * 1.12;
          bot.setView(null, [-0.09 * hiY, hiY]);
          bot.hline(F.l1, { color: 'muted', width: 1.4, dash: [6, 4] });
          bot.text('‖f‖₁', 59.5, F.l1, { align: 'right', dy: -9, color: 'muted', size: 12 });
          bot.fn((t) => Math.abs(F.ft(t)), { color: 'ink', width: 1.6, n: 2400 });
          bot.fn((t) => Math.abs(F.ft(t)) * Math.exp(-e * e * t * t / 2), { color: 'blue', width: 2, n: 2400 });
          bot.fn((t) => Math.abs(F.ft(t)) * (1 - Math.exp(-e * e * t * t / 2)), { color: 'orange', width: 1.6, n: 2400 });
          bot.hline(l1, { color: 'green', width: 1.8, dash: [5, 4] });
          bot.text('‖f − g‖₁', 59.5, l1, { align: 'right', dy: l1 < hiY * 0.85 ? -9 : 11, color: 'green', size: 12 });
          let supD = 0; for (let i = 0; i <= 6000; i++) { const t = 400 * i / 6000; supD = Math.max(supD, Math.abs(F.ft(t)) * (1 - Math.exp(-e * e * t * t / 2))); }
          st = { l1, supD, f60: Math.abs(F.ft(60)), sup: Math.abs(F.ft(0)), nf: F.l1 };
        });
        v.legend([['ink', '$f$, $|\\hat f|$'], ['blue', '$g=f*\\rho_\\varepsilon$, $|\\hat g|$'], ['orange', '$|\\hat f-\\hat g|$'], ['green', '$\\|f-g\\|_1$', { dash: true }]]);
        v.readout(() => {
          const s = st;
          return `$\\|\\hat f\\|_\\infty=${v.fix(s.sup, 4)}\\le\\|f\\|_1=${v.fix(s.nf, 4)}$. $\\ \\sup_t|\\hat f(t)-\\hat g(t)|=${v.fix(s.supD, 4)}\\le\\|f-g\\|_1=${v.fix(s.l1, 4)}$, and $\\hat g\\in\\mathscr S_1$ vanishes at infinity; $|\\hat f(60)|=${v.sci(s.f60, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.6
    {
      num: '7.6',
      kind: 'Lemma',
      name: 'The Gaussian $e^{-|x|^2/2}$ is its own Fourier transform',
      statement: String.raw`Let $\varphi_n(x)=\exp\!\big(-\tfrac12|x|^2\big)$ on $\R^n$. Then $\varphi_n\in\mathscr S_n$, $\hat\varphi_n=\varphi_n$, and $\varphi_n(0)=\int_{\R^n}\hat\varphi_n\,dm_n$.`,
      idea: String.raw`For $n=1$, $\varphi=\varphi_1$ solves $y'+xy=0$. Transforming this equation with 7.4(c) — $(y')^\wedge=it\hat y$ and $(xy)^\wedge=i(\hat y)'$ — shows that $\hat\varphi$ solves the same equation $y'+ty=0$, so $\hat\varphi=c\,\varphi$; and $c=\hat\varphi(0)=\int\varphi\,dm_1=1$. For $n>1$, $\varphi_n(x)=\prod_j\varphi_1(x_j)$ and the integral factors. The last identity is then $\int\varphi_n\,dm_n=1=\varphi_n(0)$.`,
      caption: String.raw`Rescale: $f_\sigma(x)=e^{-x^2/2\sigma^2}$ has $\hat f_\sigma(t)=\sigma e^{-\sigma^2t^2/2}$ (by 7.2(d)), wide in $x$ means narrow in $t$, and the product of the widths is always $1$. Left: $f_\sigma$ (blue) and $\hat f_\sigma$ (green, gold dots computed by quadrature) on the same axis — they coincide exactly at $\sigma=1$. Right: the proof. $\hat f_\sigma$ must solve the transformed equation $y'=-\sigma^2ty$ (direction field), starting from $y(0)=\int f_\sigma\,dm=\sigma$; at $\sigma=1$ this is the equation $f$ itself solves.`,
      deps: ['fa-7.4', 'fa-7.2'],
      see: ['rca-9.11', 'pma-8.21'],
      tags: ['Gaussian', 'fixed point', 'uncertainty'],
      verify: true,
      viz(v) {
        const M = v.M;
        const sS = v.slider('$\\sigma$', 0.35, 2.6, 1.6, { step: 0.01 });
        const L = v.stage({ x: [-4.2, 4.2], y: [-0.25, 2.8], height: 300, axes: true, title: '$f_\\sigma$ and $\\hat f_\\sigma$ on one axis' });
        const R = v.stage({ x: [-3.2, 3.2], y: [-0.25, 2.8], height: 300, axes: true, title: 'direction field of $y\'=-\\sigma^2 t\\,y$' });
        let st = {};
        v.render(() => {
          const s = sS.value;
          const f = (x) => Math.exp(-x * x / (2 * s * s)), fh = (t) => s * Math.exp(-s * s * t * t / 2);
          L.fn(f, { color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.1 });
          L.fn(fh, { color: 'green', width: 2.4 });
          // quadrature dots
          let err = 0;
          const tq = M.linspace(-4, 4, 25).map((t) => { const val = M.integrate((x) => f(x) * Math.cos(t * x), -9 * s, 9 * s, 600) / RT2PI; err = Math.max(err, Math.abs(val - fh(t))); return [t, val]; });
          L.dots(tq, { color: 'gold', r: 3.4 });
          // width markers at height e^{-1/2}
          const h1 = Math.exp(-0.5);
          const h2 = fh(1 / s), blueUp = h1 >= h2;
          L.measure(-s, h1, s, h1, '', { color: 'blue' });
          L.tex('2\\sigma', 0, h1, { color: 'blue', dy: blueUp ? -12 : 13, size: 14 });
          L.measure(-1 / s, h2, 1 / s, h2, '', { color: 'green' });
          L.tex('2/\\sigma', 0, h2, { color: 'green', dy: blueUp ? 13 : -12, size: 14 });
          // right: direction field and solution
          R.field((t, y) => [1, -s * s * t * y], { spacing: 30, color: 'faint', alpha: 0.9 });
          for (const C of [0.5, 1, 1.5, 2, 2.5]) R.fn((t) => C * Math.exp(-s * s * t * t / 2), { color: 'muted', width: 1, alpha: 0.6 });
          R.fn(fh, { color: 'green', width: 2.8 });
          R.fn((x) => Math.exp(-x * x / 2), { color: 'blue', width: 1.6, dash: [6, 4] });
          R.dot(0, s, { color: 'green', r: 5, label: 'y(0) = σ', labelPos: 'ne' });
          R.dots(tq.filter((p) => Math.abs(p[0]) <= 3.2), { color: 'gold', r: 3 });
          st = { s, err };
        });
        v.legend([['blue', '$f_\\sigma$ (right: $\\varphi=f_1$, dashed)'], ['green', '$\\hat f_\\sigma=\\sigma e^{-\\sigma^2t^2/2}$'], ['gold', 'quadrature of $\\int f_\\sigma e^{-ixt}dm$', { dot: true }]]);
        v.readout(() => {
          const s = st;
          return `$\\sigma=${v.fix(s.s, 2)}$: width of $f_\\sigma$ is $${v.fix(s.s, 3)}$, width of $\\hat f_\\sigma$ is $${v.fix(1 / s.s, 3)}$, product $1$. Max quadrature error $${v.sci(s.err, 2)}$. ` + (Math.abs(s.s - 1) < 0.005 ? '$\\sigma=1$: both curves are $e^{-x^2/2}$ — the fixed point.' : 'Move $\\sigma$ to $1$: the two equations, and the two initial values, coincide.');
        });
      },
    },
    // ------------------------------------------------------------------ 7.7
    {
      num: '7.7',
      kind: 'Theorem',
      name: 'The inversion theorem',
      statement: String.raw`(a) If $g\in\mathscr S_n$, then $g(x)=\int_{\R^n}\hat g\,e_x\,dm_n$ for every $x\in\R^n$.
(b) The Fourier transform is a continuous, linear, one-to-one map of $\mathscr S_n$ onto $\mathscr S_n$, of period $4$, whose inverse is also continuous.
(c) If $f\in L^1(\R^n)$ and $\hat f\in L^1(\R^n)$, and $f_0(x)=\int\hat f\,e_x\,dm_n$, then $f(x)=f_0(x)$ for almost every $x$.`,
      idea: String.raw`Fubini gives $\int f\hat g\,dm_n=\int\hat f g\,dm_n$ for $f,g\in L^1$. Apply it with $f(x)=\varphi_n(x/\lambda)$, whose transform is $\lambda^n\varphi_n(\lambda t)$ (7.2(d), 7.6), substitute, and let $\lambda\to\infty$: dominated convergence yields $g(0)\int\varphi_n\,dm_n=\varphi_n(0)\int\hat g\,dm_n$, which is (a) at $x=0$; translate for general $x$. Formula (a) says the inverse map is $g\mapsto\hat g(-\,\cdot)$, so applying $\mathcal F$ twice reflects, $\mathcal F^2g(x)=g(-x)$, and $\mathcal F^4=I$. Continuity of $\mathcal F$ (7.4) and $\mathcal F^{-1}=\mathcal F^3$ give (b). Part (c) follows the same route using the $L^1$ density arguments of 7.5.`,
      caption: String.raw`The four powers of $\mathcal F$ on $\mathscr S_1$, applied to $f(x)=e^{ibx}h(x-a)$ (real part blue, imaginary part orange). The curves are closed forms; the dots are obtained by applying the quadrature $\int(\cdot)\,e^{-ixt}dm$ to the previous panel's *samples*, four times in a row. Move the shift $a$ and the modulation $b$: in $\hat f$ they swap roles, $\mathcal F^2$ reflects $x\mapsto -x$, and the readout confirms that a fourth transform returns $f$ (inversion: $\mathcal F^{-1}=\mathcal F^3$).`,
      deps: ['fa-7.4', 'fa-7.6', 'fa-7.2', 'fa-7.5'],
      see: ['rca-9.11'],
      tags: ['inversion', 'Schwartz space'],
      viz(v) {
        const M = v.M;
        const H = {
          lin: { label: '$(1+x)e^{-x^2/2}$', h: (x) => [(1 + x) * Math.exp(-x * x / 2), 0], hh: (t) => [Math.exp(-t * t / 2), -t * Math.exp(-t * t / 2)] },
          cub: { label: '$(x^3-x)e^{-x^2/2}$', h: (x) => [(x ** 3 - x) * Math.exp(-x * x / 2), 0], hh: (t) => [0, (t ** 3 - 2 * t) * Math.exp(-t * t / 2)] },
          sech: { label: '$\\operatorname{sech}x$', h: (x) => [1 / Math.cosh(x), 0], hh: (t) => [Math.sqrt(Math.PI / 2) / Math.cosh(Math.PI * t / 2), 0] },
        };
        const which = v.select('$h=$', Object.entries(H).map(([value, o]) => ({ value, label: o.label })), 'lin');
        const aS = v.slider('shift $a$', -2, 2, 1.1, { step: 0.01 });
        const bS = v.slider('modulation $b$', -2.5, 2.5, 1.2, { step: 0.01 });
        const TT = ['$f$', '$\\mathcal F f=\\hat f$', '$\\mathcal F^2 f=f(-x)$', '$\\mathcal F^3 f=\\mathcal F^{-1}f$'];
        const S = TT.map((t, k) => v.stage({ x: [-6, 6], y: [-1.6, 1.6], height: 190, minWidth: 380, axes: true, title: t }));
        // quadrature grid shared by all transforms (trapezoid on [−LG, LG])
        const LG = 14, NGd = 561, hG = 2 * LG / (NGd - 1), xs = M.linspace(-LG, LG, NGd);
        let CS = null;
        const table = () => { if (CS) return CS; const c = new Float64Array(NGd * NGd), s = new Float64Array(NGd * NGd); for (let i = 0; i < NGd; i++) for (let j = 0; j < NGd; j++) { c[i * NGd + j] = Math.cos(xs[i] * xs[j]); s[i * NGd + j] = Math.sin(xs[i] * xs[j]); } return (CS = { c, s }); };
        function ft(re, im) { // samples → samples of ∫ (re + i im) e^{-ixt} dm
          const { c, s } = table(), oR = new Float64Array(NGd), oI = new Float64Array(NGd), w = hG / RT2PI;
          for (let j = 0; j < NGd; j++) { let a = 0, b = 0; for (let i = 0; i < NGd; i++) { const k = i * NGd + j, wi = i === 0 || i === NGd - 1 ? 0.5 : 1; a += wi * (re[i] * c[k] + im[i] * s[k]); b += wi * (im[i] * c[k] - re[i] * s[k]); } oR[j] = a * w; oI[j] = b * w; }
          return [oR, oI];
        }
        let st = {};
        v.render(() => {
          const o = H[which.value], a = aS.value, b = bS.value;
          // closed forms: f(x) = e^{ibx} h(x−a);  f̂(t) = e^{-ia(t−b)} ĥ(t−b)
          const f0 = (x) => cmul([Math.cos(b * x), Math.sin(b * x)], o.h(x - a));
          const f1 = (t) => cmul([Math.cos(a * (t - b)), -Math.sin(a * (t - b))], o.hh(t - b));
          const forms = [f0, f1, (x) => f0(-x), (t) => f1(-t)];
          // numerical iteration
          let re = new Float64Array(NGd), im = new Float64Array(NGd);
          xs.forEach((x, i) => { const z = f0(x); re[i] = z[0]; im[i] = z[1]; });
          const iters = [[re, im]];
          for (let k = 0; k < 4; k++) { [re, im] = ft(re, im); iters.push([re, im]); }
          let err4 = 0, err2 = 0;
          xs.forEach((x, i) => { const z = f0(x), w = f0(-x); err4 = Math.max(err4, Math.hypot(iters[4][0][i] - z[0], iters[4][1][i] - z[1])); err2 = Math.max(err2, Math.hypot(iters[2][0][i] - w[0], iters[2][1][i] - w[1])); });
          let top = 0.5; for (let k = 0; k < 4; k++) for (let i = 0; i < NGd; i += 4) top = Math.max(top, Math.hypot(iters[k][0][i], iters[k][1][i]));
          S.forEach((Sk, k) => {
            Sk.setView(null, [-top * 1.15, top * 1.15]);
            Sk.fn((x) => forms[k](x)[0], { color: 'blue', width: 2, n: 600 });
            Sk.fn((x) => forms[k](x)[1], { color: 'orange', width: 2, n: 600 });
            const dr = [], di = [];
            for (let i = 0; i < NGd; i += 14) if (Math.abs(xs[i]) <= 6) { dr.push([xs[i], iters[k][0][i]]); di.push([xs[i], iters[k][1][i]]); }
            Sk.dots(dr, { color: 'blue', r: 2.6 }); Sk.dots(di, { color: 'orange', r: 2.6 });
            Sk.corner(k === 0 ? `a = ${v.fix(a, 2)}, b = ${v.fix(b, 2)}` : k === 2 ? 'mirror image of f' : k === 1 ? 'shift ↔ modulation swapped' : 'one more 𝓕 gives f back', 'tl', { color: 'muted' });
          });
          st = { err4, err2 };
        });
        v.legend([['blue', 'real part'], ['orange', 'imaginary part'], ['muted', 'dots: iterated numerical transform', { dot: true }]]);
        v.readout(() => `After four numerical transforms, $\\max_x|\\mathcal F^4f(x)-f(x)|=${v.sci(st.err4, 2)}$; after two, $\\max_x|\\mathcal F^2f(x)-f(-x)|=${v.sci(st.err2, 2)}$. So $\\mathcal F$ is invertible on $\\mathscr S_1$ with $\\mathcal F^{-1}=\\mathcal F^3$, i.e. $g(x)=\\int\\hat g\\,e_x\\,dm$.`);
      },
    },
  ],
};
