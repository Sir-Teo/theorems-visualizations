// Rudin, Real and Complex Analysis — Chapter 11: Harmonic Functions

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
/** Poisson kernel P_r(t) = (1 − r²)/(1 − 2r cos t + r²). */
const Pk = (r, t) => (1 - r * r) / (1 - 2 * r * Math.cos(t) + r * r);
/** P(z, e^{it}) = (1 − |z|²)/|e^{it} − z|² at z = x + iy. */
const Pz = (x, y, t) => { const dx = Math.cos(t) - x, dy = Math.sin(t) - y; return (1 - x * x - y * y) / (dx * dx + dy * dy); };
/** ∫₀ᵗ P_r(s) ds for |t| ≤ π, in closed form: 2 arctan((1+r)/(1−r)·tan(t/2)). */
function Pint(r, t) {
  if (t >= Math.PI) return Math.PI;
  if (t <= -Math.PI) return -Math.PI;
  return 2 * Math.atan(((1 + r) / (1 - r)) * Math.tan(t / 2));
}
/** Harmonic measure at z = x+iy of the arc {e^{it} : a < t < b} (0 < b − a < 2π) = P[χ_arc](z), exact. */
function arcMeasure(x, y, a, b) {
  const d = Math.atan2(Math.sin(b) - y, Math.cos(b) - x) - Math.atan2(Math.sin(a) - y, Math.cos(a) - x);
  return (((d % TAU) + TAU) % TAU) / Math.PI - (b - a) / TAU;
}
/** Evaluate Σ c_n w^n (parallel re/im arrays) at w = x + iy by Horner's rule → [re, im]. */
function hornerXY(cr, ci, x, y) {
  let sr = 0, si = 0;
  for (let n = cr.length - 1; n >= 0; n--) { const t = sr * x - si * y + cr[n]; si = sr * y + si * x + ci[n]; sr = t; }
  return [sr, si];
}
/**
 * Herglotz coefficients of a real 2π-periodic f (sampled at M points): c_0 = f̂(0), c_n = 2 f̂(n).
 * Then H(z) = Σ c_n zⁿ is holomorphic in U, P[f] = Re H and Im H is the harmonic conjugate with Im H(0) = 0.
 */
function herglotz(f, N = 48, M = 512) {
  const cr = new Float64Array(N + 1), ci = new Float64Array(N + 1);
  const vals = Array.from({ length: M }, (_, j) => f(-Math.PI + (TAU * j) / M));
  for (let n = 0; n <= N; n++) {
    let re = 0, im = 0;
    for (let j = 0; j < M; j++) { const t = -Math.PI + (TAU * j) / M; re += vals[j] * Math.cos(n * t); im -= vals[j] * Math.sin(n * t); }
    const k = n ? 2 / M : 1 / M; cr[n] = re * k; ci[n] = im * k;
  }
  return { cr, ci };
}
/** Cell weights of the Poisson kernel at radius r for M equal cells: w[m] = (1/2π)∫_{cell at offset m} P_r. Exact; Σ w = 1. */
function ringWeights(r, M, w = new Float64Array(M)) {
  const h = TAU / M; let tot = 0;
  for (let m = 0; m < M; m++) {
    const mm = m <= M / 2 ? m : m - M;
    if (mm === M / 2) continue;
    w[m] = (Pint(r, mm * h + h / 2) - Pint(r, mm * h - h / 2)) / TAU; tot += w[m];
  }
  if (M % 2 === 0) w[M / 2] = 1 - tot;
  return w;
}
/** Circular convolution out[j] = Σ_m w[m] f[j−m]. */
function convolve(f, w, out = new Float64Array(f.length)) {
  const M = f.length, f2 = new Float64Array(2 * M); f2.set(f); f2.set(f, M);
  for (let j = 0; j < M; j++) { let s = 0; for (let m = 0; m < M; m++) s += w[m] * f2[j - m + M]; out[j] = s; }
  return out;
}
/**
 * Exact Poisson extension of the step function equal to f[j] on the j-th of M equal arcs
 * (centres t_j = −π + (j+½)·2π/M), tabulated on rings R_k = 1 − (1 − k/nr)², k = 0..nr (ring nr = the data).
 */
function poissonGrid(f, nr = 64) {
  const M = f.length, U = new Float64Array((nr + 1) * M), R = new Float64Array(nr + 1), w = new Float64Array(M), row = new Float64Array(M);
  for (let k = 0; k <= nr; k++) {
    const r = 1 - (1 - k / nr) ** 2; R[k] = r;
    if (k === nr) { U.set(f, k * M); continue; }
    convolve(f, ringWeights(r, M, w), row); U.set(row, k * M);
  }
  return { f: Float64Array.from(f), M, nr, h: TAU / M, R, U };
}
/** Bilinear lookup in a poissonGrid at z = x+iy (NaN outside the closed disc). */
function gridEval(G, x, y) {
  const r = Math.hypot(x, y); if (r > 1) return NaN;
  const { M, nr, U } = G;
  const kf = nr * (1 - Math.sqrt(1 - r)), k0 = Math.min(nr - 1, Math.floor(kf)), a = kf - k0;
  const jf = (Math.atan2(y, x) + Math.PI) / G.h - 0.5, j0 = Math.floor(jf), b = jf - j0;
  const ja = ((j0 % M) + M) % M, jb = (ja + 1) % M, r0 = k0 * M, r1 = r0 + M;
  return (1 - a) * ((1 - b) * U[r0 + ja] + b * U[r0 + jb]) + a * ((1 - b) * U[r1 + ja] + b * U[r1 + jb]);
}
/** A cached colour-mapped scalar field with iso-lines on stage S; call the returned function inside render. */
function fieldLayer(v, S) {
  let cache = null;
  return (fn, { key, res = 2, range = [-1, 1], cmap = 'diverging', step = 0, lines = 0.35, alpha = 1 }) => {
    const W = Math.ceil(S.width / res), H = Math.ceil(S.height / res), ink = v.rgb('ink');
    const k = `${W}x${H}|${S.bounds.x}|${S.bounds.y}|${key}|${range}|${step}|${cmap}|${ink}`;
    if (!cache || cache.k !== k) {
      const val = new Float64Array(W * H);
      for (let j = 0; j < H; j++) { const y = S.invY((j + 0.5) * res); for (let i = 0; i < W; i++) val[j * W + i] = fn(S.invX((i + 0.5) * res), y); }
      const cols = new Array(W * H);
      for (let p = 0; p < W * H; p++) {
        const z = val[p]; if (!isFinite(z)) { cols[p] = null; continue; }
        let c = v.M.cmap((z - range[0]) / (range[1] - range[0]), cmap);
        if (step && z >= range[0] && z <= range[1]) {
          const L = Math.floor(z / step), i = p % W, q1 = i + 1 < W ? val[p + 1] : NaN, q2 = p + W < W * H ? val[p + W] : NaN;
          if ((isFinite(q1) && Math.floor(q1 / step) !== L) || (isFinite(q2) && Math.floor(q2 / step) !== L)) c = c.map((x, m) => x + (ink[m] - x) * lines);
        }
        cols[p] = c;
      }
      cache = { k, cols };
    }
    let n = 0; const cols = cache.cols;
    S.raster(() => cols[n++], { key: cache.k, res, alpha, id: 'field' });
  };
}
/** Draw the unit circle coloured by g(t) (a colour array, or null to leave a gap) as a thick ring. */
function colourRing(S, g, { width = 7, n = 180 } = {}) {
  const segs = [];
  for (let k = 0; k < n; k++) {
    const t0 = -Math.PI + (TAU * k) / n, t1 = t0 + TAU / n, c = g((t0 + t1) / 2);
    if (c) segs.push([t0, t1, c]);
  }
  for (const [t0, t1, c] of segs) S.line(Math.cos(t0), Math.sin(t0), Math.cos(t1), Math.sin(t1), { color: c, width, cap: 'butt' });
}
/** Complex number [re, im] as TeX. */
const cxTeX = (v, p, d = 3) => `${v.fix(p[0], d)} ${p[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(p[1]), d)}\\,i`;
/** Partial derivatives of F: (x,y) → [re, im] by central differences → {fx, fy} (complex pairs). */
function partials(F, x, y, d = 1e-5) {
  const p1 = F(x + d, y), m1 = F(x - d, y), p2 = F(x, y + d), m2 = F(x, y - d);
  return { fx: [(p1[0] - m1[0]) / (2 * d), (p1[1] - m1[1]) / (2 * d)], fy: [(p2[0] - m2[0]) / (2 * d), (p2[1] - m2[1]) / (2 * d)] };
}
const PI_TICKS = [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']];

export default {
  book: 'rca',
  chapter: 11,
  title: 'Harmonic Functions',
  summary: String.raw`Harmonic functions are the real parts of holomorphic functions, and the Poisson kernel is the bridge. After the Cauchy–Riemann equations in the language of $\partial$ and $\bar\partial$, Rudin solves the Dirichlet problem in the disc by Poisson integrals, derives the mean value property, Harnack's theorem and the converse (continuous functions with the mean value property are harmonic, which yields the Schwarz reflection principle). The chapter ends with the boundary behaviour of Poisson integrals — nontangential maximal functions and Fatou-type limits a.e. — and the representation of harmonic functions with bounded $L^p$ means as Poisson integrals.`,
  items: [
    // ------------------------------------------------------------------ the Cauchy–Riemann equations
    {
      num: '11.1',
      kind: 'Definition',
      name: 'The operators ∂ and ∂̄',
      statement: String.raw`Let $f$ be a complex function in a plane open set $\Omega$ whose partial derivatives $f_x$, $f_y$ exist. Put
$$\partial f=\tfrac12\,(f_x-i\,f_y),\qquad \bar\partial f=\tfrac12\,(f_x+i\,f_y).$$
If $f$, regarded as a map of $\Omega\subset\R^2$ into $\R^2$, has a differential at $z_0$ (Definition 7.22), then with $\alpha=(\partial f)(z_0)$ and $\beta=(\bar\partial f)(z_0)$
$$f(z_0+h)=f(z_0)+\alpha\,h+\beta\,\bar h+o(|h|)\qquad(h\to0):$$
the differential is the real-linear map $h\mapsto\alpha h+\beta\bar h$, split into a complex-linear and a conjugate-linear part.`,
      idea: String.raw`The differential is $h=x+iy\mapsto f_x\,x+f_y\,y$. Substituting $x=\frac12(h+\bar h)$ and $y=\frac1{2i}(h-\bar h)$ regroups it as $\alpha h+\beta\bar h$. Geometrically $h\mapsto\alpha h$ rotates and scales, while $h\mapsto\beta\bar h$ reflects first; a circle $|h|=\eps$ is therefore carried (to first order) onto the sum of two circular motions turning in opposite senses — an ellipse with semi-axes $\eps(|\alpha|+|\beta|)$ and $\eps\,\big||\alpha|-|\beta|\big|$, and Jacobian $|\alpha|^2-|\beta|^2$.`,
      caption: String.raw`Drag $z_0$ and set $\eps$. While the gold point $z_0+\eps e^{i\varphi}$ runs round the circle, the right panel draws the rescaled image $\big(f(z_0+\eps e^{i\varphi})-f(z_0)\big)/\eps$ (gold) and its first-order part as a teal arrow $\alpha e^{i\varphi}$ (turning with $\varphi$) followed by a red arrow $\beta e^{-i\varphi}$ (turning against it). Their sum traces the blue ellipse; it is a circle run in the same direction exactly when $\bar\partial f(z_0)=0$.`,
      deps: ['rca-7.22', 'rca-10.2'],
      see: ['pma-9.11'],
      tags: ['Cauchy–Riemann', 'differential'],
      viz(v) {
        const FN = {
          sq: { label: '$z^2$', f: (x, y) => [x * x - y * y, 2 * x * y] },
          exp: { label: '$e^z$', f: (x, y) => { const e = Math.exp(x); return [e * Math.cos(y), e * Math.sin(y)]; } },
          stretch: { label: '$x+2iy$', f: (x, y) => [x, 2 * y] },
          conj: { label: '$\\bar z$', f: (x, y) => [x, -y] },
          abs2: { label: '$|z|^2$', f: (x, y) => [x * x + y * y, 0] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'stretch');
        const epsS = v.slider('radius $\\varepsilon$', 0.02, 0.8, 0.4, { step: 0.01 });
        const L = v.stage({ x: [-1.6, 1.6], y: [-1.25, 1.25], equal: true, height: 330, grid: true, title: 'domain: the circle $z_0+\\varepsilon e^{i\\varphi}$' });
        const R = v.stage({ x: [-3, 3], y: [-2.3, 2.3], equal: true, height: 330, title: 'rescaled image $\\big(f(z_0+\\varepsilon e^{i\\varphi})-f(z_0)\\big)/\\varepsilon$' });
        const z0 = L.handle(0.45, 0.3, { color: 'ink', label: 'z₀', labelPos: 'sw' });
        const cmul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
        let st = null;
        v.animate((t) => {
          const F = FN[which.value].f, eps = epsS.value, phi = t;
          const [a0, b0] = F(z0.x, z0.y);
          const { fx, fy } = partials(F, z0.x, z0.y);
          const al = [(fx[0] + fy[1]) / 2, (fx[1] - fy[0]) / 2], be = [(fx[0] - fy[1]) / 2, (fx[1] + fy[0]) / 2];
          const A = Math.hypot(al[0], al[1]), B = Math.hypot(be[0], be[1]);
          const lin = (ph) => { const u = cmul(al, [Math.cos(ph), Math.sin(ph)]), w = cmul(be, [Math.cos(ph), -Math.sin(ph)]); return [u, w]; };
          const img = (ph) => { const q = F(z0.x + eps * Math.cos(ph), z0.y + eps * Math.sin(ph)); return [(q[0] - a0) / eps, (q[1] - b0) / eps]; };
          // ---- domain
          L.circle(z0.x, z0.y, eps, { color: 'accent', width: 2.4 });
          for (const s of [0.6, 2.7, 4.8]) {
            const p = [z0.x + eps * Math.cos(s), z0.y + eps * Math.sin(s)], q = [z0.x + eps * Math.cos(s + 0.05), z0.y + eps * Math.sin(s + 0.05)];
            L.arrow(p[0], p[1], q[0], q[1], { color: 'accent', head: 9 });
          }
          const P = [z0.x + eps * Math.cos(phi), z0.y + eps * Math.sin(phi)];
          L.line(z0.x, z0.y, P[0], P[1], { color: 'gold', width: 1.5, dash: [4, 3] });
          L.dot(P[0], P[1], { color: 'gold', r: 5.5 });
          L.tex('\\varphi', z0.x + 0.55 * eps * Math.cos(phi / 2), z0.y + 0.55 * eps * Math.sin(phi / 2), { color: 'gold', size: 13 });
          // ---- image
          let ext = Math.max(0.9, (A + B) * 1.18);
          for (let k = 0; k < 24; k++) { const q = img((TAU * k) / 24); ext = Math.max(ext, Math.abs(q[0]) / 1.3 * 1.1, Math.abs(q[1]) * 1.1); }
          R.setView([-ext * 1.3, ext * 1.3], [-ext, ext]);
          R.circle(0, 0, A, { color: 'teal', width: 1, dash: [3, 4], alpha: 0.7 });
          R.curve((ph) => { const [u, w] = lin(ph); return [u[0] + w[0], u[1] + w[1]]; }, 0, TAU, { color: 'accent', width: 3 });
          R.curve(img, 0, TAU, { color: 'gold', width: 1.8 });
          const [u, w] = lin(phi), q = img(phi);
          R.arrow(0, 0, u[0], u[1], { color: 'teal', width: 2.4 });
          if (B > 1e-6) { R.circle(u[0], u[1], B, { color: 'red', width: 1, dash: [3, 4], alpha: 0.7 }); R.arrow(u[0], u[1], u[0] + w[0], u[1] + w[1], { color: 'red', width: 2.4, head: Math.min(9, 40 * B / ext) }); }
          R.dot(q[0], q[1], { color: 'gold', r: 5 });
          R.dot(u[0] + w[0], u[1] + w[1], { color: 'accent', r: 4.5 });
          R.dot(0, 0, { color: 'ink', r: 3 });
          R.tex('\\alpha e^{i\\varphi}', u[0] * 0.55, u[1] * 0.55, { color: 'teal', size: 14, dx: -14 * Math.sign(u[1] || 1), dy: 12 * Math.sign(u[0] || 1) });
          if (B > 0.05 * ext) R.tex('\\beta e^{-i\\varphi}', u[0] + w[0] * 0.5, u[1] + w[1] * 0.5, { color: 'red', size: 14, dx: 16, dy: -12 });
          const conf = B < 1e-6 * Math.max(1, A);
          R.corner(conf ? '∂̄f(z₀) = 0: first-order image is a circle' : (A > B ? 'orientation kept: |α| > |β|' : A < B ? 'orientation reversed: |β| > |α|' : 'degenerate: |α| = |β|'), 'tl', { color: conf ? 'green' : 'muted', weight: 600 });
          st = { al, be, A, B, conf };
          v.legend([['accent', 'first order: $\\alpha e^{i\\varphi}+\\beta e^{-i\\varphi}$'], ['gold', 'actual rescaled image'], ['teal', '$\\alpha e^{i\\varphi}$, $\\alpha=\\partial f(z_0)$'], ['red', '$\\beta e^{-i\\varphi}$, $\\beta=\\bar\\partial f(z_0)$']]);
        }, { period: TAU, still: 1.0 });
        v.readout(() => {
          const s = st; if (!s) return '';
          const tail = s.conf ? `Here $\\bar\\partial f(z_0)=0$, so $f'(z_0)$ exists and equals $\\partial f(z_0)$.` : `Since $\\bar\\partial f(z_0)\\ne0$, the quotient $(f(z_0+h)-f(z_0))/h\\approx\\alpha+\\beta\\bar h/h$ depends on the direction of $h$: no complex derivative.`;
          return `$\\partial f(z_0)=${cxTeX(v, s.al)}$, $\\;\\bar\\partial f(z_0)=${cxTeX(v, s.be)}$; semi-axes $|\\alpha|+|\\beta| = ${v.fix(s.A + s.B, 3)}$, $\\big||\\alpha|-|\\beta|\\big| = ${v.fix(Math.abs(s.A - s.B), 3)}$, Jacobian $|\\alpha|^2-|\\beta|^2=${v.fix(s.A * s.A - s.B * s.B, 3)}$. ${tail}`;
        });
      },
    },
    {
      num: '11.2',
      kind: 'Theorem',
      name: 'The Cauchy–Riemann equations',
      statement: String.raw`Let $f$ be a complex function in an open set $\Omega\subset\C$ and assume that $f$, as a map of $\Omega\subset\R^2$ into $\R^2$, is differentiable at every point. Then the following are equivalent:
(a) $f\in H(\Omega)$;
(b) $\bar\partial f=0$ at every point of $\Omega$ (the Cauchy–Riemann equation).
When they hold, $f'=\partial f$ throughout $\Omega$. For $f=u+iv$ with $u,v$ real, condition (b) is the pair $u_x=v_y$, $\;u_y=-v_x$.`,
      idea: String.raw`By 11.1, $f(z_0+h)-f(z_0)=\alpha h+\beta\bar h+o(|h|)$. Dividing by $h$ gives $\alpha+\beta\,\bar h/h+o(1)$, and $\bar h/h=e^{-2i\arg h}$ runs over the whole unit circle as $h\to0$ in different directions; so the difference quotient has a limit if and only if $\beta=\bar\partial f(z_0)=0$, and the limit is $\alpha=\partial f(z_0)$. Separating real and imaginary parts of $2\bar\partial f=(u_x-v_y)+i(v_x+u_y)$ gives the classical pair. The hypothesis that $f$ is differentiable as a map of $\R^2$ is essential: the equations at a single point say nothing about directions other than the axes.`,
      caption: String.raw`Drag $z_0$ and resize the gold grid. Right: the grid's image under $f$, translated to $0$ and rescaled by the grid size $s$, against the green grid $h\mapsto\partial f(z_0)\,h/s$. Holomorphic maps send small squares to squares; $\bar z$ and $|z|^2$ do not, and their CR residuals are nonzero. For $\sqrt{|xy|}$ at $z_0=0$ both residuals vanish, yet the image never approaches the green grid: there is no differential, and no derivative.`,
      deps: ['rca-11.1', 'rca-10.2', 'rca-7.22'],
      see: ['pma-9.17'],
      tags: ['Cauchy–Riemann', 'holomorphic'],
      viz(v) {
        const FN = {
          cube: { label: '$z^3$', f: (x, y) => [x ** 3 - 3 * x * y * y, 3 * x * x * y - y ** 3], z0: [0.55, 0.35], sp: 0.45 },
          inv: { label: '$1/z$', f: (x, y) => { const q = x * x + y * y; return [x / q, -y / q]; }, z0: [0.7, 0.45], sp: 0.4 },
          conj: { label: '$\\bar z$', f: (x, y) => [x, -y], z0: [0.5, 0.3], sp: 0.2 },
          abs2: { label: '$|z|^2$', f: (x, y) => [x * x + y * y, 0], z0: [0.5, 0.3], sp: 0.2 },
          rt: { label: '$\\sqrt{|xy|}$', f: (x, y) => [Math.sqrt(Math.abs(x * y)), 0], z0: [0, 0], sp: 0.12 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'cube');
        const sS = v.slider('grid half-width $s$', 0.01, 0.5, 0.12, { step: 0.005 });
        const L = v.stage({ x: [-1.5, 1.5], y: [-1.2, 1.2], equal: true, height: 330, title: 'level curves of $u=\\operatorname{Re} f$ (blue) and $v=\\operatorname{Im} f$ (red)' });
        const R = v.stage({ x: [-2.2, 2.2], y: [-1.7, 1.7], equal: true, height: 330, title: 'image of the grid, $\\big(f(z_0+h)-f(z_0)\\big)/s$' });
        const z0 = L.handle(0.55, 0.35, { color: 'ink', label: 'z₀', labelPos: 'sw', constrain: (x, y) => {
          const k = which.value; if (k === 'inv' && Math.hypot(x, y) < 0.3) { const m = Math.hypot(x, y) || 1; return [0.3 * x / m || 0.3, 0.3 * y / m]; }
          if (k === 'rt' && Math.hypot(x, y) < 0.12) return [0, 0];
          return [x, y];
        } });
        let last = null, st = null;
        // background: the two level-curve families, cached per function
        let net = null;
        const netFor = (k) => {
          const res = 2, W = Math.ceil(L.width / res), H = Math.ceil(L.height / res), key = `${k}|${W}x${H}|${L.bounds.x}|${v.rgb('blue')}`;
          if (net && net.key === key) return net;
          const F = FN[k].f, U = new Float64Array(W * H), V = new Float64Array(W * H);
          for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const q = F(L.invX((i + 0.5) * res), L.invY((j + 0.5) * res)); U[j * W + i] = q[0]; V[j * W + i] = q[1]; }
          const blue = v.rgb('blue'), red = v.rgb('red'), cols = new Array(W * H), sp = FN[k].sp;
          const cross = (A, p, i) => { const l = Math.floor(A[p] / sp); return (i + 1 < W && Math.floor(A[p + 1] / sp) !== l && Math.abs(A[p + 1] - A[p]) < 2) || (p + W < W * H && Math.floor(A[p + W] / sp) !== l && Math.abs(A[p + W] - A[p]) < 2); };
          for (let p = 0; p < W * H; p++) { const i = p % W; cols[p] = cross(U, p, i) ? [blue[0], blue[1], blue[2], 125] : cross(V, p, i) ? [red[0], red[1], red[2], 125] : null; }
          net = { key, cols }; return net;
        };
        v.render(() => {
          const k = which.value, Fn = FN[k], F = Fn.f, s = sS.value;
          if (last !== k) { last = k; z0.x = Fn.z0[0]; z0.y = Fn.z0[1]; }
          const N = netFor(k); let n = 0; L.raster(() => N.cols[n++], { key: N.key, id: 'net' });
          // the grid at z0
          const n4 = 4, gl = [];
          for (let a = 0; a <= n4; a++) { const c = -s + (2 * s * a) / n4; gl.push([[c, -s], [c, s]], [[-s, c], [s, c]]); }
          for (const [p, q] of gl) L.line(z0.x + p[0], z0.y + p[1], z0.x + q[0], z0.y + q[1], { color: 'gold', width: 1.6 });
          // derivatives at z0
          const { fx, fy } = partials(F, z0.x, z0.y);
          const al = [(fx[0] + fy[1]) / 2, (fx[1] - fy[0]) / 2], be = [(fx[0] - fy[1]) / 2, (fx[1] + fy[0]) / 2];
          const f0 = F(z0.x, z0.y);
          const img = (w) => { const q = F(z0.x + w[0], z0.y + w[1]); return [(q[0] - f0[0]) / s, (q[1] - f0[1]) / s]; };
          const lin = (w) => [(al[0] * w[0] - al[1] * w[1]) / s, (al[0] * w[1] + al[1] * w[0]) / s];
          let ext = 1.2, mis = 0;
          const imgLines = gl.map(([p, q]) => Array.from({ length: 41 }, (_, i) => { const w = [p[0] + (q[0] - p[0]) * i / 40, p[1] + (q[1] - p[1]) * i / 40]; const a = img(w), b = lin(w); mis = Math.max(mis, Math.hypot(a[0] - b[0], a[1] - b[1])); ext = Math.max(ext, Math.abs(a[0]) / 1.3, Math.abs(a[1]), Math.abs(b[0]) / 1.3, Math.abs(b[1])); return a; }));
          ext *= 1.12; R.setView([-ext * 1.3, ext * 1.3], [-ext, ext]);
          for (const [p, q] of gl) { const a = lin(p), b = lin(q); R.line(a[0], a[1], b[0], b[1], { color: 'green', width: 1.4, dash: [5, 4] }); }
          for (const pts of imgLines) R.path(pts, { color: 'gold', width: 2 });
          // shade one cell to show the shape of a small square
          const cell = [[-s, -s], [-s / 2, -s], [-s / 2, -s / 2], [-s, -s / 2]];
          const cellPts = [];
          for (let e = 0; e < 4; e++) for (let i = 0; i < 10; i++) { const p = cell[e], q = cell[(e + 1) % 4]; cellPts.push(img([p[0] + (q[0] - p[0]) * i / 10, p[1] + (q[1] - p[1]) * i / 10])); }
          R.poly(cellPts, { fill: 'gold', fillAlpha: 0.3, stroke: false });
          L.rect(z0.x - s, z0.y - s, z0.x - s / 2, z0.y - s / 2, { fill: 'gold', fillAlpha: 0.3, stroke: false });
          R.dot(0, 0, { color: 'ink', r: 3 });
          if (Math.hypot(al[0], al[1]) < 1e-9) R.dot(0, 0, { color: 'green', r: 7, hollow: true, width: 2.2, label: 'green grid = {0}', labelPos: 'nw', labelSize: 12, math: false });
          const r1 = fx[0] - fy[1], r2 = fy[0] + fx[1];
          const cr = Math.hypot(r1, r2) < 1e-6 * Math.max(1, Math.hypot(...fx));
          const hol = cr && k !== 'rt';
          R.corner(hol ? 'small squares → squares' : (cr ? 'CR holds at z₀, but no differential' : 'squares → parallelograms'), 'tl', { color: hol ? 'green' : 'red', weight: 600 });
          st = { fx, fy, r1, r2, al, be, cr, hol, mis, k, s };
          v.legend([['gold', 'grid at $z_0$ and its image'], ['green', 'complex-linear part $h\\mapsto\\partial f(z_0)h$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const J = `$\\begin{pmatrix}u_x&u_y\\\\v_x&v_y\\end{pmatrix}=\\begin{pmatrix}${v.fix(s.fx[0], 3)}&${v.fix(s.fy[0], 3)}\\\\${v.fix(s.fx[1], 3)}&${v.fix(s.fy[1], 3)}\\end{pmatrix}$`;
          const res = `$u_x-v_y=${v.fix(s.r1, 3)}$, $\\;u_y+v_x=${v.fix(s.r2, 3)}$`;
          let tail;
          if (s.k === 'rt') tail = `The CR equations hold at $0$, yet the image of the grid stays at distance $${v.fix(s.mis, 3)}$ from the green one for **every** $s$ — $\\sqrt{|xy|}$ has no differential at $0$, so the theorem does not apply.`;
          else if (s.hol) tail = `CR holds, so $f'(z_0)=\\partial f(z_0)=${cxTeX(v, s.al)}$; the mismatch $${v.fix(s.mis, 3)}$ shrinks with $s$.`;
          else tail = `CR fails: $\\bar\\partial f(z_0)=${cxTeX(v, s.be)}\\ne0$.`;
          return `${J}; $\\;$ ${res}. ${tail}`;
        });
      },
    },
    {
      num: '11.3',
      kind: 'Definition',
      name: 'The Laplacian; harmonic functions',
      statement: String.raw`Let $f$ be a complex function in a plane open set $\Omega$ such that $f_{xx}$ and $f_{yy}$ exist at every point of $\Omega$. Its **Laplacian** is $\Delta f=f_{xx}+f_{yy}$. If $f$ is continuous in $\Omega$ and $\Delta f=0$ at every point of $\Omega$, then $f$ is **harmonic** in $\Omega$. A complex function is harmonic if and only if its real and imaginary parts are.

When $f\in C^2(\Omega)$, the mixed partials agree and $\Delta f=4\,\partial\bar\partial f$. In particular every $f\in H(\Omega)$ is harmonic (as are $\operatorname{Re}f$ and $\operatorname{Im}f$), since $\bar\partial f=0$ and $f$ has derivatives of all orders.`,
      idea: String.raw`Expanding $4\partial\bar\partial=(\partial_x-i\partial_y)(\partial_x+i\partial_y)=\partial_x^2+\partial_y^2$ needs $f_{xy}=f_{yx}$, i.e. $C^2$. A holomorphic $f$ is $C^\infty$ (10.16) and satisfies $\bar\partial f=0$ (11.2), hence $\Delta f=4\partial(\bar\partial f)=0$. The second-order Taylor expansion shows what $\Delta$ measures: the average of $u$ over four points at distance $h$ exceeds $u(p)$ by $\tfrac{h^2}{4}\Delta u(p)+O(h^4)$, so harmonic functions are "balanced" — every point sits at the average of its neighbours.`,
      caption: String.raw`Drag $p$ and change the stencil arm $h$. The four gold neighbours of $p$ and their average (green bar in 3D) are compared with $u(p)$: the discrete Laplacian $\frac{1}{h^2}\big(\sum u(\text{neighbours})-4u(p)\big)$ matches $\Delta u(p)$, which is identically $0$ for the harmonic examples (saddles, never bumps) and not for the others.`,
      deps: ['rca-11.1', 'rca-11.2', 'rca-10.16'],
      see: ['rca-10.6a'],
      tags: ['harmonic', 'Laplacian'],
      viz(v) {
        const C = [1.35, 1.2];
        const FN = {
          cube: { label: '$\\operatorname{Re} z^3$', u: (x, y) => x ** 3 - 3 * x * y * y, lap: () => 0, harm: true },
          log: { label: '$\\log|z-c|$', u: (x, y) => 0.5 * Math.log((x - C[0]) ** 2 + (y - C[1]) ** 2), lap: () => 0, harm: true },
          exp: { label: '$e^{x}\\sin y$', u: (x, y) => Math.exp(x) * Math.sin(y), lap: () => 0, harm: true },
          abs2: { label: '$x^2+y^2$', u: (x, y) => x * x + y * y, lap: () => 4 },
          mix: { label: '$x^2-y^2+xy^2$', u: (x, y) => x * x - y * y + x * y * y, lap: (x) => 2 * x },
        };
        const which = v.select('$u$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'cube');
        const hS = v.slider('stencil arm $h$', 0.02, 0.5, 0.3, { step: 0.01 });
        const L = v.stage({ x: [-1.05, 1.05], y: [-1.05, 1.22], equal: true, height: 340, axes: false, title: 'heat map of $u$ with level curves; the 5-point stencil at $p$' });
        const S3 = v.stage3d({ range: 1.55, height: 340, yaw: -0.75, pitch: 0.5, labels: ['x', 'y', 'u'] });
        const p = L.handle(0.35, -0.25, { color: 'accent', label: 'p', labelPos: 'nw', constrain: (x, y) => [v.M.clamp(x, -0.98, 0.98), v.M.clamp(y, -0.98, 0.98)] });
        const heat = fieldLayer(v, L);
        let last = null, rng = [-1, 1], st = null;
        v.render(() => {
          const k = which.value, F = FN[k], u = F.u, h = hS.value;
          if (last !== k) { last = k; let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) { const z = u(-1 + i / 20, -1 + j / 20); lo = Math.min(lo, z); hi = Math.max(hi, z); } const m = Math.max(Math.abs(lo), Math.abs(hi)); rng = [lo, hi, m]; }
          const m = rng[2];
          heat((x, y) => (Math.abs(x) <= 1 && Math.abs(y) <= 1 ? u(x, y) : NaN), { key: k, range: [-m, m], step: m / 6 });
          L.rect(-1, -1, 1, 1, { color: 'muted', width: 1 });
          const nb = [[h, 0], [-h, 0], [0, h], [0, -h]].map(([a, b]) => [p.x + a, p.y + b]);
          for (const q of nb) { L.line(p.x, p.y, q[0], q[1], { color: 'ink', width: 1.2 }); L.dot(q[0], q[1], { color: 'gold', r: 4.5 }); }
          const u0 = u(p.x, p.y), avg = nb.reduce((s, q) => s + u(q[0], q[1]), 0) / 4;
          const disc = (4 * (avg - u0)) / (h * h), lap = F.lap(p.x, p.y);
          // 3D
          const sc = 0.75 / m;
          S3.surface((a, b) => [a, b, sc * u(a, b)], [-1, 1], [-1, 1], { n: 26, colorFn: (a, b, P) => v.M.cmap(0.5 + P[2] / (2 * sc * m), 'diverging'), alpha: 0.9 });
          const lift = (q) => [q[0], q[1], sc * u(q[0], q[1])];
          for (const q of nb) { S3.line(lift([p.x, p.y]), lift(q), { color: 'ink', width: 1.4, bias: -0.05 }); S3.dot(lift(q), { color: 'gold', r: 4.5, bias: -0.06 }); }
          S3.dot(lift([p.x, p.y]), { color: 'accent', r: 5, bias: -0.07 });
          const P0 = [p.x, p.y, sc * avg];
          S3.line([p.x - 0.12, p.y, P0[2]], [p.x + 0.12, p.y, P0[2]], { color: 'green', width: 3, bias: -0.08 });
          S3.line([p.x, p.y, sc * u0], P0, { color: 'green', width: 1.5, dash: true, bias: -0.08 });
          L.corner(F.harm ? 'Δu ≡ 0: harmonic' : `Δu = ${F.lap === FN.abs2.lap ? '4' : '2x'}: not harmonic`, 'tl', { color: F.harm ? 'green' : 'red', weight: 600 });
          st = { u0, avg, disc, lap, h };
          v.legend([['accent', '$u(p)$', { dot: true }], ['gold', 'neighbours $u(p\\pm h)$, $u(p\\pm ih)$', { dot: true }], ['green', 'their average']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$u(p)=${v.fix(s.u0, 4)}$, average of neighbours $=${v.fix(s.avg, 4)}$. Discrete Laplacian $\\frac{4}{h^2}(\\text{avg}-u(p)) = ${v.fix(s.disc, 4)}$; exact $\\Delta u(p)=4\\,\\partial\\bar\\partial u(p) = ${v.fix(s.lap, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ the Poisson integral
    {
      num: '11.4',
      kind: 'Definition',
      name: 'The Poisson kernel',
      statement: String.raw`The **Poisson kernel** is
$$P_r(t)=\sum_{n=-\infty}^{\infty}r^{|n|}e^{int}\qquad(0\le r<1,\ t\in\R).$$
For $z=re^{i\theta}$ one has
$$P_r(\theta-t)=\operatorname{Re}\frac{e^{it}+z}{e^{it}-z}=\frac{1-r^2}{1-2r\cos(\theta-t)+r^2}=\frac{1-|z|^2}{|e^{it}-z|^2},$$
and the kernel has the properties
(a) $\frac{1}{2\pi}\int_{-\pi}^{\pi}P_r(t)\,dt=1$;
(b) $P_r(t)>0$, $P_r(-t)=P_r(t)$, and $P_r(t)<P_r(\delta)$ whenever $0<\delta<|t|\le\pi$;
(c) $P_r(\delta)\to0$ as $r\to1$, for every $0<\delta\le\pi$.`,
      idea: String.raw`The series converges absolutely for $r<1$; summing the two geometric series gives $\operatorname{Re}\frac{1+re^{it}}{1-re^{it}}$, which simplifies to the closed form. Integrating the series term by term kills every $n\ne0$, giving (a). The closed form is positive, even and decreasing in $|t|$ on $[0,\pi]$, which is (b), and for fixed $\delta>0$ its numerator $1-r^2\to0$ while the denominator stays $\ge(1-\cos\delta)\cdot 2r$, which is (c). These three facts make $\{P_r\}$ an approximate identity — the engine of every boundary result in the chapter. (The same kernel already appeared in 5.25.)`,
      caption: String.raw`Drag $z=re^{i\theta}$ in the disc. Left: $P_r(s)$ for $s=\theta-t\in[-\pi,\pi]$ (faint curves: $r=0.25,0.5,0.75$); the red tail $|s|\ge\delta$ carries less and less mass and the orange line $P_r(\delta)$ drops to $0$ as $r\to1$, while the total mass stays $1$. Right: the same weights seen on the circle — the blue petal is $1+0.5\,P_r(\theta-t)/P_r(0)$, the orange arc is $|t-\theta|<\delta$.`,
      deps: ['rca-5.25', 'rca-4.23'],
      see: ['pma-8.13'],
      tags: ['Poisson kernel', 'approximate identity'],
      viz(v) {
        const dS = v.slider('$\\delta$', 0.05, 1.6, 0.45, { step: 0.01 });
        const L = v.stage({ x: [-Math.PI, Math.PI], y: [-0.4, 10], height: 330, axes: 'box', xticks: PI_TICKS, xlabel: 's', title: '$P_r(s)=(1-r^2)/(1-2r\\cos s+r^2)$, $\\;s=\\theta-t$' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, height: 330, axes: false, title: 'the weights $P_r(\\theta-t)$ on the circle' });
        const z = R.handle(0.55, 0.32, { color: 'accent', label: 'z', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 0.97 ? [0.97 * x / m, 0.97 * y / m] : [x, y]; } });
        let st = null;
        v.render(() => {
          const r = Math.hypot(z.x, z.y), th = Math.atan2(z.y, z.x), d = dS.value, peak = (1 + r) / (1 - r);
          // ---- left: kernel graph
          for (const r0 of [0.25, 0.5, 0.75]) L.fn((s) => Pk(r0, s), { color: 'faint', width: 1.2, domain: [-Math.PI, Math.PI] });
          for (const sgn of [1, -1]) {
            const a = sgn > 0 ? d : -Math.PI, b = sgn > 0 ? Math.PI : -d;
            L.fn((s) => Pk(r, s), { domain: [a, b], fill: 'red', fillAlpha: 0.25, color: 'red', width: 0 });
          }
          L.fn((s) => Pk(r, s), { domain: [-d, d], fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 0 });
          L.fn((s) => Pk(r, s), { color: 'accent', width: 2.6, n: 900 });
          L.hline(Pk(r, d), { color: 'orange', width: 1.4, dash: [6, 4] });
          L.vline(d, { color: 'orange', width: 1, dash: [2, 3] }); L.vline(-d, { color: 'orange', width: 1, dash: [2, 3] });
          L.tex('P_r(\\delta)', Math.PI, Pk(r, d), { color: 'orange', size: 13, align: 'right', baseline: 'bottom', dx: -4, dy: -2 });
          if (peak > 10) { L.text(`peak ${v.fmt(peak, 3)} ↑`, 0, 9.6, { color: 'accent', size: 12, align: 'left', dx: 8 }); }
          L.tex('r=0.25', 2.4, Pk(0.25, 2.4), { color: 'muted', size: 11, dy: -10 });
          L.tex('r=0.75', 0, 7, { color: 'muted', size: 11, align: 'left', dx: 6, dy: -4 });
          // ---- right: weights on the circle
          const scl = 0.5 / peak;
          R.curve((t) => { const w = 1 + scl * Pk(r, th - t); return [w * Math.cos(t), w * Math.sin(t)]; }, -Math.PI, Math.PI, { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.12, n: 720 });
          R.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          R.curve((t) => [Math.cos(t), Math.sin(t)], th + d, th + TAU - d, { color: 'red', width: 2.5, alpha: 0.6 });
          R.curve((t) => [Math.cos(t), Math.sin(t)], th - d, th + d, { color: 'orange', width: 6 });
          R.line(z.x, z.y, Math.cos(th + d), Math.sin(th + d), { color: 'orange', width: 1, dash: [3, 3] });
          R.line(z.x, z.y, Math.cos(th - d), Math.sin(th - d), { color: 'orange', width: 1, dash: [3, 3] });
          R.dot(0, 0, { color: 'muted', r: 3 });
          R.tex('T', -0.78, -0.78, { color: 'muted', size: 15 });
          const tail = 1 - Pint(r, d) / Math.PI;
          const tot = v.M.integrate((s) => Pk(r, s), -Math.PI, Math.PI, 4000) / TAU;
          st = { r, d, peak, tail, tot, Pd: Pk(r, d) };
          v.legend([['accent', '$P_r$, mass $\\frac{1}{2\\pi}\\int P_r = 1$', { area: true }], ['red', 'tail $|s|\\ge\\delta$', { area: true }], ['orange', '$P_r(\\delta)=\\sup_{|s|\\ge\\delta}P_r$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$r=${v.fix(s.r, 3)}$: $\\;\\frac{1}{2\\pi}\\int_{-\\pi}^{\\pi}P_r = ${v.fix(s.tot, 6)}$, $\\;P_r(0)=\\frac{1+r}{1-r}=${v.fix(s.peak, 2)}$, $\\;P_r(\\delta)=${v.fix(s.Pd, 4)}$, $\\;$ tail mass $\\frac{1}{2\\pi}\\int_{|s|\\ge\\delta}P_r = ${v.fix(s.tail, 4)}$.`;
        });
      },
    },
    {
      num: '11.5',
      kind: 'Definition',
      name: 'Poisson integrals P[f] and P[dμ]',
      statement: String.raw`If $f\in L^1(T)$, its **Poisson integral** $P[f]$ is the function on $U$ given by
$$P[f](re^{i\theta})=\frac{1}{2\pi}\int_{-\pi}^{\pi}P_r(\theta-t)\,f(t)\,dt .$$
More generally, for a complex Borel measure $\mu$ on $T$,
$$P[d\mu](re^{i\theta})=\int_{T}P_r(\theta-t)\,d\mu(e^{it}),$$
so $P[f]=P[f\,d\sigma]$ with $\sigma$ the normalised Lebesgue measure. For real $\mu$, $P[d\mu]=\operatorname{Re}\int_T\frac{e^{it}+z}{e^{it}-z}\,d\mu(e^{it})$ is the real part of a holomorphic function of $z\in U$; hence every $P[d\mu]$ is harmonic in $U$. In Fourier terms, $P[d\mu](re^{i\theta})=\sum_n\hat\mu(n)\,r^{|n|}e^{in\theta}$.`,
      idea: String.raw`The Herglotz integral $\int\frac{e^{it}+z}{e^{it}-z}\,d\mu$ is $2\int\frac{e^{it}\,d\mu}{e^{it}-z}-\mu(T)$, a Cauchy-type integral, so it is holomorphic in $U$ by 10.7; its real part is $P[d\mu]$ because $\operatorname{Re}\frac{e^{it}+z}{e^{it}-z}=P_r(\theta-t)$. Real parts of holomorphic functions are harmonic (11.3), and complex $\mu$ splits into real and imaginary parts. Expanding $P_r$ as $\sum r^{|n|}e^{in(\theta-t)}$ and integrating term by term shows that $P$ multiplies the $n$-th Fourier coefficient by $r^{|n|}$.`,
      caption: String.raw`Choose $\mu$: a smooth density, the indicator of an arc, a point mass, or a signed sum of point masses (drawn on $T$: densities as a coloured ring, atoms as spikes). The disc shows $u=P[d\mu]$. Drag $z$: on the right the coefficients $|\hat\mu(n)|$ (faint) are damped to $r^{|n|}|\hat\mu(n)|$, and the readout computes $u(z)$ twice — by the kernel and by the Fourier series — and checks $\Delta u(z)=0$.`,
      deps: ['rca-11.4', 'rca-10.7', 'rca-11.3', 'rca-6.1'],
      see: ['rca-5.25', 'rca-5.24'],
      tags: ['Poisson integral', 'harmonic', 'measures'],
      viz(v) {
        const a0 = 1.5;
        const MU = {
          smooth: { label: 'density $e^{a\\cos(t-1)}\\cos(a\\sin(t-1))$', range: 3.2, dens: (t) => Math.exp(a0 * Math.cos(t - 1)) * Math.cos(a0 * Math.sin(t - 1)), atoms: [],
            u: (x, y) => { const w = [a0 * Math.cos(1), -a0 * Math.sin(1)], ez = [w[0] * x - w[1] * y, w[0] * y + w[1] * x]; return Math.exp(ez[0]) * Math.cos(ez[1]); },
            hat: (n) => { if (n === 0) return [1, 0]; const k = Math.abs(n); let m = 0.5; for (let i = 1; i <= k; i++) m *= a0 / i; return [m * Math.cos(k), -Math.sign(n) * m * Math.sin(k)]; } },
          arc: { label: 'arc $\\chi_{(0.3,\\,2.2)}\\,d\\sigma$', range: 1, arc: [0.3, 2.2], atoms: [], u: (x, y) => arcMeasure(x, y, 0.3, 2.2),
            hat: (n) => (n === 0 ? [(2.2 - 0.3) / TAU, 0] : [(Math.sin(n * 2.2) - Math.sin(n * 0.3)) / (TAU * n), (Math.cos(n * 2.2) - Math.cos(n * 0.3)) / (TAU * n)]) },
          atom: { label: 'point mass $\\delta_{\\zeta}$', range: 4, atoms: [[-0.6, 1]] },
          signed: { label: 'signed atoms', range: 3, atoms: [[1.2, 1], [-2.4, -1], [2.8, 0.6]] },
        };
        for (const k of ['atom', 'signed']) {
          const A = MU[k].atoms;
          MU[k].u = (x, y) => A.reduce((s, [t, w]) => s + w * Pz(x, y, t), 0);
          MU[k].hat = (n) => A.reduce((s, [t, w]) => [s[0] + w * Math.cos(n * t), s[1] - w * Math.sin(n * t)], [0, 0]);
        }
        const which = v.select('$\\mu$', Object.entries(MU).map(([value, o]) => ({ value, label: o.label })), 'arc');
        const L = v.stage({ x: [-1.35, 1.35], y: [-1.35, 1.35], equal: true, height: 340, axes: false, title: '$u=P[d\\mu]$ in $U$; $\\mu$ drawn on $T$' });
        const R = v.stage({ x: [-16.8, 16.8], y: [0, 0.55], height: 340, axes: 'box', xlabel: 'n', title: '$|\\hat\\mu(n)|$ and $r^{|n|}|\\hat\\mu(n)|$, $\\;r=|z|$' });
        const z = L.handle(0.45, 0.35, { color: 'ink', label: 'z', labelPos: 'ne', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 0.95 ? [0.95 * x / m, 0.95 * y / m] : [x, y]; } });
        const heat = fieldLayer(v, L);
        let st = null;
        v.render(() => {
          const k = which.value, mu = MU[k], m = mu.range;
          heat((x, y) => (x * x + y * y < 1 ? mu.u(x, y) : NaN), { key: k, range: [-m, m], step: m / 8 });
          // the measure on T
          if (mu.dens) colourRing(L, (t) => v.M.cmap(0.5 + mu.dens(t) / (2 * m), 'diverging'));
          else if (mu.arc) colourRing(L, (t) => (t > mu.arc[0] && t < mu.arc[1] ? v.M.cmap(0.5 + 0.5 / m, 'diverging') : null), { width: 7 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          for (const [t, w] of mu.atoms) {
            const c = w > 0 ? 'red' : 'blue', len = 0.12 + 0.2 * Math.abs(w);
            L.arrow(Math.cos(t), Math.sin(t), (1 + len) * Math.cos(t), (1 + len) * Math.sin(t), { color: c, width: 2.6, head: 8 });
            L.dot(Math.cos(t), Math.sin(t), { color: c, r: 4.5 });
            L.text(`${w > 0 ? '+' : '−'}${v.fmt(Math.abs(w), 2)}`, (1.2 + len) * Math.cos(t), (1.2 + len) * Math.sin(t), { color: c, size: 12, align: 'center' });
          }
          const r = Math.hypot(z.x, z.y), th = Math.atan2(z.y, z.x);
          L.circle(0, 0, r, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.6 });
          // Fourier side
          const NB = 16, hats = [], damp = [];
          let maxH = 0;
          for (let n = -NB; n <= NB; n++) { const h = mu.hat(n), a = Math.hypot(h[0], h[1]); hats.push(a); damp.push(a * r ** Math.abs(n)); maxH = Math.max(maxH, a); }
          R.setView(null, [-0.07 * maxH, maxH * 1.18]);
          R.bars(hats, { x0: -NB, color: 'faint', barWidth: 0.75, fillAlpha: 0.55 });
          R.bars(damp, { x0: -NB, color: 'accent', barWidth: 0.45, fillAlpha: 0.9 });
          // u(z) twice + Laplacian
          const uK = mu.u(z.x, z.y);
          let uF = 0;
          for (let n = -400; n <= 400; n++) { const h = mu.hat(n), rn = r ** Math.abs(n); if (rn < 1e-17) continue; uF += rn * (h[0] * Math.cos(n * th) - h[1] * Math.sin(n * th)); }
          const e = 1e-3, lap = (mu.u(z.x + e, z.y) + mu.u(z.x - e, z.y) + mu.u(z.x, z.y + e) + mu.u(z.x, z.y - e) - 4 * uK) / (e * e);
          st = { uK, uF, lap, r };
          v.legend([['faint', '$|\\hat\\mu(n)|$', { area: true }], ['accent', '$r^{|n|}|\\hat\\mu(n)|$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$u(z)=\\int P\\,d\\mu = ${v.fix(s.uK, 6)}$; $\\;\\sum_n\\hat\\mu(n)r^{|n|}e^{in\\theta} = ${v.fix(s.uF, 6)}$; $\\;$ 5-point Laplacian at $z$: $${v.fix(s.lap, 4)}$ (round-off) — $u$ is harmonic.`;
        });
      },
    },
    {
      num: '11.8',
      kind: 'Theorem',
      name: 'The Dirichlet problem for the disc',
      verify: true,
      statement: String.raw`Let $f\in C(T)$ and define $Hf$ on the closed unit disc $\bar U$ by
$$(Hf)(re^{i\theta})=\begin{cases}f(e^{i\theta}) & r=1,\\ P[f](re^{i\theta}) & 0\le r<1.\end{cases}$$
Then $Hf\in C(\bar U)$. Thus $Hf$ is continuous on $\bar U$, harmonic in $U$, and equal to $f$ on $T$; moreover $\|Hf\|_\infty=\|f\|_\infty$ and $P[f]_r\to f$ uniformly on $T$ as $r\to1$.`,
      idea: String.raw`Harmonicity in $U$ is 11.5; the point is continuity at $T$. Since $\frac{1}{2\pi}\int P_r=1$ (11.4a),
$$P[f](re^{i\theta})-f(\theta)=\frac{1}{2\pi}\int P_r(\theta-t)\,\big(f(t)-f(\theta)\big)\,dt .$$
Split the integral at $|t-\theta|=\delta$: uniform continuity of $f$ makes the near part small for small $\delta$, and the far part is at most $2\|f\|_\infty P_r(\delta)$, which tends to $0$ as $r\to1$ by (b), (c). The estimate is uniform in $\theta$, which gives continuity of $Hf$ at every boundary point.`,
      caption: String.raw`Pick boundary data — or **draw** your own in the bottom strip (drag across it). The disc and the surface show the solution $Hf$; the bottom strip compares $f$ (ink) with the gold restriction $u_r(t)=P[f](re^{it})$ to the dashed ring. Push $r\to1$: for continuous data $\|u_r-f\|_\infty\to0$. The step data violate $f\in C(T)$ — near the jumps the error never drops below about half the jump, and $Hf$ is discontinuous there.`,
      deps: ['rca-11.5', 'rca-11.4'],
      see: ['pma-8.15'],
      tags: ['Dirichlet problem', 'Poisson integral', 'harmonic'],
      viz(v) {
        const M = 256, h = TAU / M, tj = (j) => -Math.PI + (j + 0.5) * h;
        const PRE = {
          smooth: { label: 'smooth', f: (t) => 0.55 * Math.cos(t) + 0.35 * Math.sin(2 * t - 0.4) + 0.25 * Math.cos(5 * t + 1) },
          tent: { label: 'tent $1-\\frac{2}{\\pi}|t|$', f: (t) => 1 - (2 / Math.PI) * Math.abs(t) },
          step: { label: 'step (discontinuous)', f: (t) => (Math.abs(t - 0.4) < Math.PI / 2 ? 1 : -1) },
          draw: { label: 'draw your own' },
        };
        let drawn = new Float64Array(M), seed = 3;
        const randomCurve = () => { const r = v.rng(seed++); const c = Array.from({ length: 6 }, (_, n) => [r.normal() / (n + 1.2), r.normal() / (n + 1.2)]); for (let j = 0; j < M; j++) { let s = 0; c.forEach(([a, b], n) => { s += a * Math.cos((n + 1) * tj(j)) + b * Math.sin((n + 1) * tj(j)); }); drawn[j] = s; } let mx = 0; for (const x of drawn) mx = Math.max(mx, Math.abs(x)); for (let j = 0; j < M; j++) drawn[j] *= 1 / mx; };
        randomCurve();
        let version = 0;
        const which = v.select('$f$', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'smooth', { onChange: () => version++ });
        const rS = v.slider('ring $r$', 0, 0.995, 0.8, { step: 0.005, decimals: 3 });
        v.button('New random curve', () => { randomCurve(); which.set('draw'); version++; });
        const D = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 320, axes: false, title: 'the solution $Hf$ on $\\bar U$' });
        const S3 = v.stage3d({ range: 1.2, height: 320, yaw: -0.55, pitch: 0.62, labels: ['', '', ''], axes: false });
        const B = v.stage({ x: [-Math.PI, Math.PI], y: [-1.45, 1.45], height: 180, full: true, axes: 'box', xticks: PI_TICKS, title: 'boundary data $f(t)$ (drag to draw) and $u_r(t)=P[f](re^{it})$' });
        const heat = fieldLayer(v, D);
        let lastJ = null;
        B.onDrag((x, y, phase) => {
          if (which.value !== 'draw') { const F = PRE[which.value].f; for (let j = 0; j < M; j++) drawn[j] = F(tj(j)); which.set('draw'); }
          const j = Math.max(0, Math.min(M - 1, Math.round((x + Math.PI) / h - 0.5))), yy = v.M.clamp(y, -1.3, 1.3);
          if (phase === 'start' || lastJ == null) { drawn[j] = yy; lastJ = [j, yy]; }
          else { const [j0, y0] = lastJ, n = Math.abs(j - j0); for (let i = 0; i <= n; i++) { const jj = j0 + Math.sign(j - j0) * i; drawn[jj] = n ? y0 + (yy - y0) * (i / n) : yy; } lastJ = [j, yy]; }
          if (phase === 'end') lastJ = null;
          version++;
        });
        let G = null, gKey = null, st = null;
        v.render(() => {
          const k = which.value;
          const key = `${k}|${version}`;
          if (gKey !== key) {
            gKey = key;
            const data = k === 'draw' ? Float64Array.from(drawn) : Float64Array.from({ length: M }, (_, j) => PRE[k].f(tj(j)));
            G = poissonGrid(data, 64);
          }
          const f = G.f, r = rS.value;
          // ---- disc
          heat((x, y) => gridEval(G, x, y), { key, range: [-1.3, 1.3], step: 0.2 });
          colourRing(D, (t) => { const j = Math.min(M - 1, Math.floor((t + Math.PI) / h)); return v.M.cmap(0.5 + f[j] / 2.6, 'diverging'); }, { width: 6, n: 256 });
          D.circle(0, 0, r, { color: 'gold', width: 2, dash: [5, 4] });
          // ---- ring values and error
          const ur = r > 0.9999 ? Float64Array.from(f) : convolve(f, ringWeights(r, M));
          let err = 0, at = 0;
          for (let j = 0; j < M; j++) { const e = Math.abs(ur[j] - f[j]); if (e > err) { err = e; at = j; } }
          let fmax = 0; for (const x of f) fmax = Math.max(fmax, Math.abs(x));
          // ---- 3D
          const sc = 0.55;
          S3.surface((rho, t) => { const x = rho * Math.cos(t), y = rho * Math.sin(t); return [x, y, sc * gridEval(G, x * 0.9999, y * 0.9999)]; }, [0, 1], [-Math.PI, Math.PI], { nu: 18, nv: 56, colorFn: (a, b, P) => v.M.cmap(0.5 + P[2] / (sc * 2.6), 'diverging'), alpha: 0.92 });
          const bnd = [], ring = [];
          for (let j = 0; j <= M; j += 2) { const jj = j % M, t = tj(jj); bnd.push([Math.cos(t), Math.sin(t), sc * f[jj]]); ring.push([r * Math.cos(t), r * Math.sin(t), sc * ur[jj]]); }
          S3.curve((t) => [Math.cos(t), Math.sin(t), -0.62], -Math.PI, Math.PI, { color: 'faint', width: 1, n: 90 });
          S3.path(bnd, { color: 'ink', width: 2.2, bias: -0.02 });
          S3.path(ring, { color: 'gold', width: 2.2, bias: -0.03 });
          // ---- strip
          B.hband(-fmax, fmax, { color: 'muted', alpha: 0.05 });
          const pts = (arr) => Array.from({ length: M }, (_, j) => [tj(j), arr[j]]);
          B.path(pts(f), { color: 'ink', width: 2.6 });
          B.path(pts(ur), { color: 'gold', width: 2.2 });
          B.line(tj(at), f[at], tj(at), ur[at], { color: 'red', width: 2 });
          B.dot(tj(at), ur[at], { color: 'red', r: 3.5 });
          B.text(`max |u_r − f| = ${v.fmt(err, 3)}`, tj(at), (f[at] + ur[at]) / 2, { color: 'red', size: 12, align: tj(at) > 1.5 ? 'right' : 'left', dx: tj(at) > 1.5 ? -8 : 8 });
          st = { r, err, fmax, k };
          v.legend([['ink', 'data $f$ on $T$'], ['gold', '$u_r$ on the ring $|z|=r$'], ['red', 'largest gap $\\|u_r-f\\|_\\infty$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const verdict = s.k === 'step' ? 'the data jump, so $f\\notin C(T)$: the gap at the jumps stays near half the jump size however close $r$ is to $1$, and $Hf$ is not continuous there.' : 'as $r\\to1$ the gap tends to $0$ uniformly, i.e. $Hf$ is continuous on $\\bar U$.';
          return `$r=${v.fix(s.r, 3)}$: $\\;\\|u_r-f\\|_\\infty=${v.fix(s.err, 4)}$, $\\;\\|f\\|_\\infty=${v.fix(s.fmax, 3)}$ bounds $|Hf|$ everywhere; ${verdict}`;
        });
      },
    },
    {
      num: '11.9',
      kind: 'Theorem',
      name: 'Harmonic functions continuous on Ū are Poisson integrals',
      verify: true,
      statement: String.raw`Let $u$ be a continuous real function on the closed unit disc $\bar U$ that is harmonic in $U$. Then in $U$, $u$ is the Poisson integral of its restriction to $T$, $u=P[u|_T]$, and $u$ is the real part of the holomorphic function
$$f(z)=\frac{1}{2\pi}\int_{-\pi}^{\pi}\frac{e^{it}+z}{e^{it}-z}\,u(e^{it})\,dt\qquad(z\in U).$$
More generally, if $u$ is continuous on a closed disc $\bar D(a;R)$ and harmonic in $D(a;R)$, then $u(a+re^{i\theta})=\frac{1}{2\pi}\int_{-\pi}^{\pi}\frac{R^2-r^2}{R^2-2Rr\cos(\theta-t)+r^2}\,u(a+Re^{it})\,dt$ for $0\le r<R$.`,
      idea: String.raw`By 11.8, $h=u-H(u|_T)$ is continuous on $\bar U$, harmonic in $U$, and $0$ on $T$. If $h(z_0)>0$ somewhere, then for small $\eps>0$ the function $g=h+\eps|z|^2$ is still positive at $z_0$ but at most $\eps$ on $T$, so it attains its maximum at an interior point — where $g_{xx}\le0$ and $g_{yy}\le0$. But $\Delta g=\Delta h+4\eps=4\eps>0$. So $h\le0$; likewise $-h\le0$. The holomorphic $f$ is the Herglotz integral of 11.5, with real part $P[u|_T]$. The general disc follows by the change of variables $z\mapsto a+Rz$.`,
      caption: String.raw`Choose $u$ and drag the ring handle. Right: $u$ on the ring (ink) and the Poisson integral of the boundary values of $u$, computed from $T$ alone (blue dashes) — they coincide. Purple curves in the disc are level lines of $v=\operatorname{Im}f$, the conjugate produced by the Herglotz integral. Breaking the hypotheses: drag the singularity $p$ of $\log|z-p|$ into $U$, or take $u=\operatorname{Re}\frac{1+z}{1-z}$, which is harmonic in $U$ and $0$ on $T\setminus\{1\}$ but not continuous on $\bar U$ — its boundary values produce $P[u|_T]=0\ne u$.`,
      deps: ['rca-11.8', 'rca-11.5', 'rca-11.3'],
      see: ['rca-5.25'],
      tags: ['Poisson integral', 'harmonic', 'maximum principle'],
      viz(v) {
        const MT = 1024;
        const sampleT = (u) => Float64Array.from({ length: MT }, (_, j) => { const w = u(Math.cos((TAU * j) / MT), Math.sin((TAU * j) / MT)); return isFinite(w) ? w : 0; });
        const poissonAt = (vals, x, y) => { let s = 0; for (let j = 0; j < MT; j++) s += Pz(x, y, (TAU * j) / MT) * vals[j]; return s / MT; };
        const which = v.select('$u$', [{ value: 'poly', label: '$\\operatorname{Re}(z^3-0.8z)+\\operatorname{Im}z^2$' }, { value: 'pole', label: '$\\log|z-p|$' }, { value: 'kernel', label: '$\\operatorname{Re}\\frac{1+z}{1-z}$' }], 'pole');
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.3, 1.3], equal: true, height: 340, axes: false, title: '$u$ (dark level lines) and its conjugate $v$ (purple)' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [-2, 2], height: 340, axes: 'box', xticks: PI_TICKS, xlabel: 'θ', title: 'on the ring $|z|=\\rho$: $u$ versus $P[u|_T]$' });
        const p = L.handle(1.35, 0.45, { color: 'red', label: 'p', labelPos: 'e', constrain: (x, y) => { const m = Math.hypot(x, y); if (m > 0.93 && m < 1.07) { const s = m < 1 ? 0.93 / m : 1.07 / m; return [x * s, y * s]; } return [x, y]; } });
        const ringH = L.handle(0.0, -0.75, { color: 'gold', r: 6, label: 'ρ', labelPos: 'se', constrain: (x, y) => { const m = Math.hypot(x, y) || 1, c = v.M.clamp(m, 0.08, 0.97); return [x * c / m, y * c / m]; } });
        const heat = fieldLayer(v, L);
        let st = null;
        const cache = { key: null };
        v.render(() => {
          const k = which.value; p.visible = k === 'pole';
          const P = [p.x, p.y], inside = Math.hypot(P[0], P[1]) < 1;
          let U, F;
          if (k === 'poly') { U = (x, y) => x ** 3 - 3 * x * y * y - 0.8 * x + 2 * x * y; F = (x, y) => [U(x, y), 3 * x * x * y - y ** 3 - 0.8 * y - (x * x - y * y)]; }
          else if (k === 'pole') {
            U = (x, y) => 0.5 * Math.log((x - P[0]) ** 2 + (y - P[1]) ** 2);
            // Herglotz integral of the boundary values: log(1 − z/p) + log|p| (p outside) or log(1 − p̄ z) (p inside)
            F = (x, y) => {
              let a, b;
              if (!inside) { const q = P[0] * P[0] + P[1] * P[1]; a = 1 - (x * P[0] + y * P[1]) / q; b = -(y * P[0] - x * P[1]) / q; return [Math.log(Math.hypot(a, b)) + 0.5 * Math.log(q), Math.atan2(b, a)]; }
              a = 1 - (P[0] * x + P[1] * y); b = -(P[0] * y - P[1] * x); return [Math.log(Math.hypot(a, b)), Math.atan2(b, a)];
            };
          } else { U = (x, y) => (1 - x * x - y * y) / ((1 - x) ** 2 + y * y); F = () => [0, 0]; }
          const key = `${k}|${k === 'pole' ? P.join(',') : ''}`;
          if (cache.key !== key) { cache.key = key; cache.vals = sampleT(U); }
          heat((x, y) => (x * x + y * y < 1 ? U(x, y) : NaN), { key, range: [-2, 2], step: 0.25 });
          // conjugate level lines (from the Herglotz integral)
          if (k !== 'kernel') {
            const res = 2, W = Math.ceil(L.width / res), H = Math.ceil(L.height / res), pc = v.rgb('purple');
            const ck = `${key}|${W}x${H}|${L.bounds.x}|${pc}`;
            if (cache.ck !== ck) {
              const V = new Float64Array(W * H), sp = 0.25;
              for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = L.invX((i + 0.5) * res), y = L.invY((j + 0.5) * res); V[j * W + i] = x * x + y * y < 1 ? F(x, y)[1] : NaN; }
              cache.ck = ck; cache.cols = Array.from(V, (a, q) => {
                if (!isFinite(a)) return null; const i = q % W, l = Math.floor(a / sp), b = i + 1 < W ? V[q + 1] : NaN, c = q + W < W * H ? V[q + W] : NaN;
                return (isFinite(b) && Math.floor(b / sp) !== l && Math.abs(b - a) < 1) || (isFinite(c) && Math.floor(c / sp) !== l && Math.abs(c - a) < 1) ? [pc[0], pc[1], pc[2], 210] : null;
              });
            }
            let n = 0; L.raster(() => cache.cols[n++], { key: ck, id: 'conj' });
          }
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          const rho = Math.hypot(ringH.x, ringH.y);
          L.circle(0, 0, rho, { color: 'gold', width: 2, dash: [5, 4] });
          if (k === 'pole') { L.dot(P[0], P[1], { color: 'red', r: 3 }); L.corner(inside ? 'p ∈ U: u is not harmonic in U' : 'p ∉ Ū: u is harmonic near Ū', 'tl', { color: inside ? 'red' : 'green', weight: 600 }); }
          if (k === 'kernel') { L.dot(1, 0, { color: 'red', r: 5 }); L.corner('harmonic in U, not continuous on Ū', 'tl', { color: 'red', weight: 600 }); }
          // ---- ring comparison
          const n = 160, uu = [], pp = [], bd = [];
          let diff = 0, lo = Infinity, hi = -Infinity;
          for (let i = 0; i <= n; i++) {
            const t = -Math.PI + (TAU * i) / n, x = rho * Math.cos(t), y = rho * Math.sin(t);
            const a = U(x, y), b = poissonAt(cache.vals, x, y), c = U(Math.cos(t), Math.sin(t));
            uu.push([t, a]); pp.push([t, b]); bd.push([t, isFinite(c) ? c : NaN]);
            diff = Math.max(diff, Math.abs(a - b)); lo = Math.min(lo, a, b); hi = Math.max(hi, a, b);
          }
          const pad = 0.15 * Math.max(0.5, hi - lo), top = Math.min(hi + pad, Math.max(lo + 1, 6));
          R.setView(null, [lo - pad, top]);
          R.path(bd, { color: 'faint', width: 1.4, dash: [2, 3] });
          R.path(uu, { color: 'ink', width: 2.6 });
          R.path(pp, { color: 'accent', width: 2.4, dash: [7, 5] });
          const fz = F(ringH.x, ringH.y);
          st = { k, diff, rho, inside, fz, u: U(ringH.x, ringH.y) };
          v.legend([['ink', '$u$ on $|z|=\\rho$'], ['accent', '$P[u|_T]$ on $|z|=\\rho$', { dash: true }], ['faint', 'boundary values $u|_T$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$\\max_{|z|=\\rho}|u-P[u|_T]| = ${v.sci(s.diff, 2)}$.`;
          if (s.k === 'kernel') return `${head} The boundary values vanish except at $z=1$, so $P[u|_T]=0$, while $u>0$: without continuity on $\\bar U$ the representation fails.`;
          if (s.k === 'pole' && s.inside) return `${head} With $p\\in U$, $P[u|_T]=\\log|1-\\bar p z|$ is the harmonic function with the same boundary values; $u-P[u|_T]=\\log\\left|\\frac{z-p}{1-\\bar pz}\\right|\\le0$.`;
          return `${head} At the ring handle $u=${v.fix(s.u, 4)}$ and $f=u+iv=${cxTeX(v, s.fz, 4)}$ — $u$ is the real part of the Herglotz integral of its boundary values.`;
        });
      },
    },
  ],
};
