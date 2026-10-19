// Rudin, Real and Complex Analysis — Chapter 14 (part 3): continuity at the boundary; annuli

const TAU = 2 * Math.PI;
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const csqrt = (a) => { const m = Math.sqrt(Math.hypot(a[0], a[1])), t = Math.atan2(a[1], a[0]) / 2; return [m * Math.cos(t), m * Math.sin(t)]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const hue = (M, s, l = 0.5) => M.hsl2rgb(s / TAU, 0.7, l);

// ---- explicit conformal maps g : U → Ω (normalized g(0) = 0)
// The slit disc Ω = U \ [A, 1):  g = K⁻¹(λK), K(z) = z/(1+z)², λ = 4K(A).
const SLIT_A = 0.25;
const Kf = (z) => { const q = [1 + z[0], z[1]]; return cdiv(z, cmul(q, q)); };
const Kinv = (u) => { // the root of u(1+z)² = z that lies in U (principal square root)
  if (cabs(u) < 1e-9) return u;
  const s = csqrt([1 - 4 * u[0], -4 * u[1]]);
  return cdiv([1 - 2 * u[0] - s[0], -2 * u[1] - s[1]], [2 * u[0], 2 * u[1]]);
};
const LAM = 4 * SLIT_A / (1 + SLIT_A) ** 2;
const slitG = (z) => { const k = Kf(z); return Kinv([LAM * k[0], LAM * k[1]]); };
const slitPhi = (w) => { const k = Kf(w); return Kinv([k[0] / LAM, k[1] / LAM]); }; // g⁻¹ on Ω
// Cardioid-like Jordan region with an inward cusp: g(z) = z + z²/2, inverse −1 + √(1+2w).
const cardG = (z) => { const q = cmul(z, z); return [z[0] + q[0] / 2, z[1] + q[1] / 2]; };
const cardPhi = (w) => { const s = csqrt([1 + 2 * w[0], 2 * w[1]]); return [s[0] - 1, s[1]]; };
// Regular n-gon:  g(z) = ∫₀^z (1 − wⁿ)^{−2/n} dw  (series inside, radial integral near the circle).
function ngon(n) {
  const c = []; let p = 1;
  for (let k = 0; k < 500; k++) { c.push(p / (n * k + 1)); p *= (2 / n + k) / (k + 1); }
  const pw = (x, y) => { let pr = 1, pi = 0; for (let i = 0; i < n; i++) { const t = pr * x - pi * y; pi = pr * y + pi * x; pr = t; } return [pr, pi]; };
  const g = (z) => {
    const x = z[0], y = z[1];
    if (x * x + y * y < 0.985 * 0.985) {
      const [ar, ai] = pw(x, y); let sr = 0, si = 0;
      for (let k = c.length - 1; k >= 0; k--) { const t = sr * ar - si * ai + c[k]; si = sr * ai + si * ar; sr = t; }
      return [sr * x - si * y, sr * y + si * x];
    }
    let sr = 0, si = 0; const N = 200, e = -2 / n;
    for (let q = 0; q < N; q++) {
      const u = (q + 0.5) / N, t = 1 - u ** 4, w = 4 * u ** 3 / N, [tr, ti] = pw(t * x, t * y);
      const br = 1 - tr, bi = -ti, m = Math.pow(br * br + bi * bi, e / 2), a = e * Math.atan2(bi, br);
      sr += w * m * Math.cos(a); si += w * m * Math.sin(a);
    }
    return [sr * x - si * y, sr * y + si * x];
  };
  const C = g([1, 0])[0];
  const verts = Array.from({ length: n }, (_, k) => [C * Math.cos(TAU * k / n), C * Math.sin(TAU * k / n)]);
  return { g, C, verts };
}
const SQUARE = ngon(4), TRI = ngon(3);
// nearest point of a polygon's boundary
function projPoly(P, x, y) {
  let best = null, bd = Infinity;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], ex = b[0] - a[0], ey = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (y - a[1]) * ey) / (ex * ex + ey * ey)));
    const q = [a[0] + t * ex, a[1] + t * ey], d = Math.hypot(q[0] - x, q[1] - y);
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}
// nearest point of ∂(U \ [A,1)) = T ∪ [A,1]
function projSlit(x, y) {
  const m = Math.hypot(x, y) || 1, pc = [x / m, y / m], dc = Math.abs(Math.hypot(x, y) - 1);
  const sx = Math.max(SLIT_A, Math.min(1, x)), ds = Math.hypot(x - sx, y);
  return ds < dc ? [sx, 0] : pc;
}
const cardBoundary = Array.from({ length: 721 }, (_, i) => cardG([Math.cos(TAU * i / 720), Math.sin(TAU * i / 720)]));
function projCurve(B, x, y) { let best = B[0], bd = Infinity; for (const p of B) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = p; } } return best.slice(); }
// Image of a polar grid of U under g.
function polarImage(g, radii, nRays = 16, rmax = 0.995) {
  const circles = radii.map((r) => Array.from({ length: 241 }, (_, i) => g([r * Math.cos(TAU * i / 240), r * Math.sin(TAU * i / 240)])));
  const rays = Array.from({ length: nRays }, (_, k) => Array.from({ length: 121 }, (_, i) => { const r = rmax * (1 - (1 - i / 120) ** 1.6); return g([r * Math.cos(TAU * k / nRays + 1e-3), r * Math.sin(TAU * k / nRays + 1e-3)]); }));
  return { circles, rays };
}

import { nonsimpleExamples } from './univalent-examples.shared.js';

export default {
  collection: 'rca',
  chapter: 14,
  items: [
    nonsimpleExamples,
    // ------------------------------------------------------------------ continuity at the boundary
    {
      num: '14.16',
      kind: 'Definition',
      name: 'Simple boundary point',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Definition 14.16, p. 289'],
      statement: String.raw`Let $\Omega$ be a simply connected plane region. A point $\beta\in\partial\Omega$ is a **simple boundary point** of $\Omega$ if for every sequence $\{\alpha_n\}$ in $\Omega$ with $\alpha_n\to\beta$ there are a continuous curve $\gamma:[0,1]\to\C$ and numbers $0<t_1<t_2<\cdots\to1$ such that $\gamma(t_n)=\alpha_n$ for all $n$, $\gamma(t)\in\Omega$ for $0\le t<1$, and $\gamma(1)=\beta$.`,
      idea: String.raw`A simple boundary point can be reached by a curve inside $\Omega$ through *any* sequence converging to it — in particular the region does not approach $\beta$ from two "sides" that are only connected far away. Points of a smooth or polygonal boundary, and even the tip of an inward cusp, are simple. A point in the middle of a slit is not: a sequence alternating between the two banks of the slit can only be threaded by a curve that runs around the end of the slit each time, so the curve cannot converge.`,
      caption: String.raw`Drag the boundary point $\beta$ (it stays on $\partial\Omega$). The gold points $\alpha_n\to\beta$ alternate between the two sides; the blue curve threads them, built as the image of a polygon through the preimages $g^{-1}(\alpha_n)$ in the disc (middle panel). Right: the diameter of the tail of the curve after $\alpha_n$. It tends to $0$ at every point of the circle, at the tip of the slit and at the cusp — but on the slit itself it stays above the distance to the tip.`,
      deps: ['rca-14.7'],
      tags: ['boundary behaviour', 'conformal mapping'],
      viz(v) {
        const REG = {
          slit: { label: 'slit disc', g: slitG, view: [[-1.15, 1.15], [-1.15, 1.15]], proj: projSlit, start: [0.62, 0] },
          card: { label: 'cardioid (cusp)', g: cardG, view: [[-1.0, 1.7], [-1.35, 1.35]], proj: (x, y) => projCurve(cardBoundary, x, y), start: [-0.5, 0] },
        };
        const which = v.select('$\\Omega$', Object.entries(REG).map(([value, o]) => ({ value, label: o.label })), 'slit');
        const O = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 290, axes: false, minWidth: 230, title: '$\\Omega$: a curve through $\\alpha_n\\to\\beta$' });
        const D = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 290, axes: false, minWidth: 230, title: 'preimages in $U$' });
        const P = v.stage({ x: [-1, 13.8], y: [0, 1.2], height: 290, axes: 'box', minWidth: 230, xlabel: 'n', title: 'diameter of $\\gamma([t_n,1))$' });
        const b = O.handle(0.62, 0, { color: 'ink', label: 'β', labelPos: 'ne', constrain: (x, y) => REG[which.value].proj(x, y) });
        const NSEQ = 14, cache = {};
        let last = null, st = null;
        v.render(() => {
          const key = which.value, R = REG[key], g = R.g;
          if (last !== key) { last = key; O.setView(...R.view); b.x = R.start[0]; b.y = R.start[1]; }
          const beta = [b.x, b.y];
          // preimage(s) of β on the circle
          let pre;
          if (key === 'card') { const z = cardPhi(beta); const m = cabs(z) || 1; pre = [[z[0] / m, z[1] / m]]; }
          else if (Math.abs(beta[1]) < 1e-9 && beta[0] > SLIT_A + 1e-6 && beta[0] < 1 - 1e-9) { const z = slitPhi([beta[0], 1e-12]); const m = cabs(z); pre = [[z[0] / m, Math.abs(z[1] / m)], [z[0] / m, -Math.abs(z[1] / m)]]; }
          else { const z = slitPhi([beta[0] * 0.999999, beta[1] * 0.999999 + (Math.abs(beta[1]) < 1e-9 ? 1e-12 : 0)]); const m = cabs(z) || 1; pre = [[z[0] / m, z[1] / m]]; }
          // a sequence w_n → preimage(s), alternating sides; α_n = g(w_n)
          const w = [];
          for (let n = 1; n <= NSEQ; n++) {
            const d = 0.32 * 0.72 ** n, zeta = pre.length > 1 ? pre[n % 2] : pre[0], sgn = n % 2 ? 1 : -1;
            const a = Math.atan2(zeta[1], zeta[0]) + (pre.length > 1 ? 0 : sgn * 0.9 * d);
            w.push([(1 - d) * Math.cos(a), (1 - d) * Math.sin(a)]);
          }
          const alpha = w.map(g);
          const segs = [];
          for (let n = 0; n + 1 < NSEQ; n++) segs.push(Array.from({ length: 41 }, (_, i) => { const t = i / 40; return g([w[n][0] + (w[n + 1][0] - w[n][0]) * t, w[n][1] + (w[n + 1][1] - w[n][1]) * t]); }));
          // tail diameters: sup distance from β of the curve after α_n
          const tail = []; let mx = 0;
          for (let n = NSEQ - 2; n >= 0; n--) { for (const p of segs[n]) mx = Math.max(mx, Math.hypot(p[0] - beta[0], p[1] - beta[1])); tail[n] = mx; }
          // ---- Ω
          if (!cache[key]) cache[key] = polarImage(g, [0.3, 0.6, 0.85, 0.95], 16);
          const G = cache[key];
          G.circles.forEach((c) => O.path(c, { color: 'teal', width: 1, alpha: 0.35 }));
          G.rays.forEach((c) => O.path(c, { color: 'purple', width: 1, alpha: 0.3 }));
          if (key === 'slit') { O.circle(0, 0, 1, { color: 'ink', width: 2 }); O.line(SLIT_A, 0, 1, 0, { color: 'ink', width: 2.6 }); }
          else O.path(cardBoundary, { color: 'ink', width: 2 });
          segs.forEach((s) => O.path(s, { color: 'accent', width: 1.8 }));
          O.dots(alpha, { color: 'gold', r: 3.2 });
          O.dot(alpha[0][0], alpha[0][1], { color: 'gold', r: 4.5, label: 'α₁', labelPos: 'nw' });
          // ---- U
          D.circle(0, 0, 1, { color: 'ink', width: 2 });
          for (let n = 0; n + 1 < NSEQ; n++) D.line(w[n][0], w[n][1], w[n + 1][0], w[n + 1][1], { color: 'accent', width: 1.6 });
          D.dots(w, { color: 'gold', r: 3.2 });
          pre.forEach((z, k) => D.dot(z[0], z[1], { color: pre.length > 1 ? 'red' : 'green', r: 6, label: k ? "ζ′" : 'ζ', labelPos: z[1] >= 0 ? 'ne' : 'se' }));
          // ---- tail diameters
          const lim = pre.length > 1 ? Math.hypot(beta[0] - SLIT_A, beta[1]) : 0;
          P.setView(null, [0, Math.max(0.3, ...tail) * 1.15]);
          if (lim > 0) P.hline(lim, { color: 'red', width: 1.4, dash: [5, 4] });
          P.bars(tail, { x0: 1, color: pre.length > 1 ? 'red' : 'accent', fillAlpha: 0.7 });
          st = { simple: pre.length === 1, lim, last: tail[NSEQ - 2], key, beta };
          v.legend([['gold', '$\\alpha_n$ and $w_n=g^{-1}(\\alpha_n)$', { dot: true }], ['accent', 'the curve $\\gamma$ and its preimage'], [pre.length > 1 ? 'red' : 'green', pre.length > 1 ? 'the two preimages of $\\beta$' : 'the preimage $\\zeta$ of $\\beta$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.simple) return `$\\beta$ lies inside the slit: it has two preimages $\\zeta\\ne\\zeta'$ on the circle, the curve must go round the end of the slit between consecutive $\\alpha_n$, and its tail never gets smaller than $|\\beta-${SLIT_A}| = ${v.fix(s.lim, 3)}$. Not a simple boundary point.`;
          return `The tail of $\\gamma$ shrinks (diameter $${v.sci(s.last, 2)}$ after $\\alpha_{13}$), so $\\gamma(t)\\to\\beta$: ${s.key === 'card' && Math.hypot(s.beta[0] + 0.5, s.beta[1]) < 1e-3 ? 'even the tip of the cusp is a simple boundary point.' : 'a simple boundary point.'}`;
        });
      },
    },
    {
      num: '14.17a',
      kind: 'Lemma',
      name: 'A bounded function vanishing on an arc of T is 0',
      refs: ['Editorial lemma: consequence of Rudin, Real and Complex Analysis, 3rd ed., Schwarz reflection 11.14, pp. 237–239, and identity theorem 10.18; boundary-arc uniqueness used in 14.18, p. 290'],
      statement: String.raw`Let $V=U\cap D(\beta;r)$ for some $\beta\in T$ and $r>0$, and let $J=T\cap D(\beta;r)$. If $f$ is bounded and holomorphic in $V$ and $f(z_n)\to0$ for every sequence $\{z_n\}$ in $V$ that converges to a point of $J$, then $f(z)=0$ for every $z\in V$.`,
      idea: String.raw`Choose a smaller circular boundary arc contained in $J$, and use a Möbius map to straighten it to a real interval. The assumed zero boundary limits give a continuous extension there with value0. Schwarz reflection (11.14) extends $f$ holomorphically across the interval. The extension vanishes on an interval inside its domain, so the identity theorem (10.18) forces it, and hence $f$ on the connected lune $V$, to be zero. The harmonic-measure bound in the illustration is a quantitative version after normalizing $|f|\le1$ throughout $V$. This is an editorial lemma, not the book's numbered14.17.`,
      caption: String.raw`The lune $V$ (move $r$) with the arc $J$ in green. Shown is the extremal bounded function $f_\eps=\eps^{\Phi}$, $\Re\Phi=\omega$: $|f_\eps|\le1$ in $V$ and $|f_\eps|=\eps$ on $J$; colour = $|f_\eps|$, curves = level sets of $\omega$. Drag $z$ and push $\eps\to0$: every holomorphic $f$ with $|f|\le1$ throughout $V$ and boundary modulus at most $\eps$ on $J$ satisfies $|f(z)|\le\eps^{\omega(z)}$, which goes to $0$ at every point of $V$.`,
      deps: ['rca-11.14', 'rca-10.18', 'rca-14.3'],
      tags: ['boundary behaviour', 'maximum principle'],
      viz(v) {
        const rS = v.slider('$r$', 0.35, 1.5, 0.95, { step: 0.01 });
        const eS = v.slider('$\\varepsilon$', 1e-8, 0.5, 0.05, { log: true, fmt: (x) => v.fmt(x, 2) });
        const L = v.stage({ x: [-0.4, 1.4], y: [-1.05, 1.05], equal: true, height: 340, axes: false, title: '$|f_\\varepsilon|$ on the lune $V=U\\cap D(1;r)$ and level sets of $\\omega$' });
        const Rt = v.stage({ x: [0, 1], y: [0, 1.05], height: 340, axes: 'box', xlabel: 'ω(z)', title: 'the bound $|f(z)|\\le\\varepsilon^{\\omega(z)}$' });
        const z = L.handle(0.62, 0.28, { color: 'gold', label: 'z', labelPos: 'ne', constrain: (x, y) => { const r = rS.value; let p = [x, y]; const m = Math.hypot(x, y); if (m > 0.995) p = [x * 0.995 / m, y * 0.995 / m]; const d = Math.hypot(p[0] - 1, p[1]); if (d > r * 0.995) p = [1 + (p[0] - 1) * r * 0.995 / d, p[1] * r * 0.995 / d]; return p; } });
        let st = null;
        v.render(() => {
          const r = rS.value, eps = eS.value;
          // the two circles meet at p, p̄ with Re p = 1 − r²/2
          const x0 = 1 - r * r / 2, y0 = Math.sqrt(Math.max(0, 1 - x0 * x0)), p = [x0, y0], q = [x0, -y0];
          const T = (w) => cdiv([w[0] - p[0], w[1] - p[1]], [w[0] - q[0], w[1] - q[1]]);
          const aJ = Math.atan2(...T([1, 0]).reverse()), aO = Math.atan2(...T([1 - r, 0]).reverse());
          const wrap = (a) => a - TAU * Math.round(a / TAU);
          const D = wrap(aJ - aO);
          const inV = (x, y) => x * x + y * y < 1 && (x - 1) ** 2 + y * y < r * r;
          const omega = (x, y) => Math.max(0, Math.min(1, wrap(Math.atan2(...T([x, y]).reverse()) - aO) / D));
          const le = Math.log(eps);
          if (!inV(z.x, z.y)) { z.x = 1 - 0.45 * r; z.y = 0.12 * r; }
          L.raster((x, y) => { if (!inV(x, y)) return null; const om = omega(x, y); return v.M.cmap(Math.exp(le * om), 'viridis'); }, { key: `${r}|${eps}`, res: 2 });
          // level sets of ω: circular arcs through p and q (images of rays under T⁻¹), drawn by marching along ω = c
          for (const c of [0.1, 0.25, 0.5, 0.75, 0.9]) {
            const a = aO + c * D, dir = [Math.cos(a), Math.sin(a)];
            const pts = [];
            for (let i = 1; i < 300; i++) { const s = Math.tan(Math.PI / 2 * i / 300); const u = [s * dir[0], s * dir[1]]; const wv = cdiv([p[0] - u[0] * q[0] + u[1] * q[1], p[1] - u[0] * q[1] - u[1] * q[0]], [1 - u[0], -u[1]]); pts.push(inV(wv[0], wv[1]) || Math.hypot(wv[0] - p[0], wv[1] - p[1]) < 1e-3 ? wv : null); }
            L.path(pts, { color: 'panel', width: 1.2, alpha: 0.75, dash: [4, 3] });
          }
          // boundary arcs
          const tJ = Math.atan2(y0, x0);
          L.path(Array.from({ length: 121 }, (_, i) => { const t = -tJ + 2 * tJ * i / 120; return [Math.cos(t), Math.sin(t)]; }), { color: 'green', width: 4 });
          const tO = Math.atan2(y0, x0 - 1);
          L.path(Array.from({ length: 121 }, (_, i) => { const t = tO + (TAU - 2 * tO) * i / 120; return [1 + r * Math.cos(t), r * Math.sin(t)]; }), { color: 'ink', width: 2 });
          L.circle(0, 0, 1, { color: 'muted', width: 1, dash: [3, 4] });
          L.tex('J', Math.cos(0.35 * tJ) + 0.06, Math.sin(0.35 * tJ), { color: 'green', size: 16, align: 'left' });
          const om = omega(z.x, z.y), bound = Math.exp(le * om);
          // right: ε^ω as a function of ω, for several ε
          for (const e of [0.5, 0.1, 1e-2, 1e-4]) Rt.fn((w) => e ** w, { domain: [0, 1], color: 'muted', width: 1, alpha: 0.6 });
          Rt.fn((w) => eps ** w, { domain: [0, 1], color: 'accent', width: 2.6 });
          Rt.vline(om, { color: 'gold', width: 1.2, dash: [4, 4] });
          Rt.dot(om, bound, { color: 'gold', r: 6 });
          Rt.text('smaller ε', 0.06, 0.06, { color: 'muted', size: 12 });
          st = { om, bound, eps };
          v.legend([['green', 'the arc $J$ where $f\\to0$'], ['accent', '$\\varepsilon^{\\omega}$ for the current $\\varepsilon$'], ['gold', 'the point $z$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\omega(z) = ${v.fix(s.om, 3)}$ (harmonic measure of $J$ seen from $z$), so $|f(z)|\\le\\varepsilon^{\\omega(z)} = ${v.sci(s.bound, 3)}$ for $\\varepsilon=${v.sci(s.eps, 2)}$. As $\\varepsilon\\to0$ the bound forces $f(z)=0$.`;
        });
      },
    },
    {
      num: '14.18',
      kind: 'Theorem',
      name: 'Boundary extension at simple boundary points',
      statement: String.raw`Let $\Omega$ be a bounded simply connected region in the plane, and suppose every boundary point of $\Omega$ is simple. Then every conformal mapping of $\Omega$ onto $U$ extends to a homeomorphism of $\overline\Omega$ onto $\overline U$.`,
      idea: String.raw`Let $f:\Omega\to U$ be the map and $g=f^{-1}$. First, $f$ has a limit at each $\beta\in\partial\Omega$: otherwise two sequences $\alpha_n,\alpha_n'\to\beta$ have $f$-images tending to different points of $T$; a curve through both sequences (simplicity) is mapped onto a curve that crosses the whole region between them infinitely often, along which $g$ tends to $\beta$; by Lemma 14.17 the bounded function $g-\beta$ would vanish identically. So $f$ extends continuously to $\overline\Omega$, with $f(\partial\Omega)\subset T$. The extension is one-to-one on $\partial\Omega$ (two boundary points with the same image would let $g$ be constant on an arc, again by 14.17), and onto by compactness; a continuous bijection of compact spaces is a homeomorphism.`,
      caption: String.raw`Drag $\beta$ along $\partial\Omega$ and shrink $\delta$. Left: the set $\Omega\cap D(\beta;\delta)$ (green). Right: where it comes from in $U$, i.e. $f(\Omega\cap D(\beta;\delta))$, computed by mapping a fine mesh of $U$ with $g=f^{-1}$. For the polygons every boundary point is simple and the set shrinks to one point $f(\beta)\in T$ — $f$ is continuous at $\beta$. On the slit, $\Omega\cap D(\beta;\delta)$ has two pieces whose preimages stay apart: $f$ has no limit at $\beta$.`,
      deps: ['rca-14.16', 'rca-14.17', 'rca-14.8'],
      see: ['rca-14.19'],
      tags: ['boundary behaviour', 'conformal mapping', 'Carathéodory'],
      viz(v) {
        const REG = {
          sq: { label: 'square', g: SQUARE.g, view: 1.45, proj: (x, y) => projPoly(SQUARE.verts, x, y), start: [0.66, 0.66] },
          tri: { label: 'triangle', g: TRI.g, view: 1.95, proj: (x, y) => projPoly(TRI.verts, x, y), start: [TRI.C * Math.cos(TAU / 3), TRI.C * Math.sin(TAU / 3) * 0.999] },
          slit: { label: 'slit disc', g: slitG, view: 1.15, proj: projSlit, start: [0.6, 0] },
        };
        const which = v.select('$\\Omega$', Object.entries(REG).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const dS = v.slider('$\\delta$', 0.01, 0.4, 0.12, { log: true, fmt: (x) => v.fmt(x, 2) });
        const O = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, height: 330, axes: false, title: '$\\Omega$ and $\\Omega\\cap D(\\beta;\\delta)$' });
        const D = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 330, axes: false, title: 'its preimage $f(\\Omega\\cap D(\\beta;\\delta))\\subset U$' });
        const b = O.handle(0.66, 0.66, { color: 'ink', label: 'β', labelPos: 'ne', constrain: (x, y) => REG[which.value].proj(x, y) });
        const NA = 480, J = 44;
        const rj = (j) => 1 - (1 - j / J) ** 2.2;
        const cache = {};
        const mesh = (key) => {
          if (cache[key]) return cache[key];
          const g = REG[key].g, U = new Float64Array(2 * NA * J), W = new Float64Array(2 * NA * J);
          let k = 0;
          for (let j = 1; j <= J; j++) for (let i = 0; i < NA; i++) {
            const r = j === J ? 1 - 1e-9 : rj(j), t = TAU * (i + 0.5 * (j % 2)) / NA, z = [r * Math.cos(t), r * Math.sin(t)], w = g(z);
            U[2 * k] = z[0]; U[2 * k + 1] = z[1]; W[2 * k] = w[0]; W[2 * k + 1] = w[1]; k++;
          }
          const NBD = 4 * NA, bnd = Array.from({ length: NBD + 1 }, (_, i) => { const t = TAU * i / NBD; return [hue(v.M, t), g([(1 - 1e-9) * Math.cos(t), (1 - 1e-9) * Math.sin(t)])]; });
          return (cache[key] = { U, W, n: k, G: polarImage(g, [0.3, 0.6, 0.85], 16), bnd });
        };
        let last = null, st = null;
        v.render(() => {
          const key = which.value, R = REG[key], m = mesh(key), del = dS.value;
          if (last !== key) { last = key; O.setView([-R.view, R.view], [-R.view, R.view]); b.x = R.start[0]; b.y = R.start[1]; }
          const beta = [b.x, b.y];
          m.G.circles.forEach((c) => O.path(c, { color: 'teal', width: 1, alpha: 0.35 }));
          m.G.rays.forEach((c) => O.path(c, { color: 'purple', width: 1, alpha: 0.3 }));
          // boundary coloured by the boundary correspondence
          const NBD = m.bnd.length - 1;
          for (let i = 0; i < NBD; i++) { const [c0, p0] = m.bnd[i], [, p1] = m.bnd[i + 1]; if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 0.06) O.line(p0[0], p0[1], p1[0], p1[1], { color: c0, width: 3.5 }); }
          for (let i = 0; i < NBD; i += 4) { const t0 = TAU * i / NBD, t1 = TAU * (i + 4) / NBD; D.line(Math.cos(t0), Math.sin(t0), Math.cos(t1), Math.sin(t1), { color: m.bnd[i][0], width: 4 }); }
          O.circle(beta[0], beta[1], del, { color: 'green', width: 1.8, fill: 'green', fillAlpha: 0.15 });
          // mesh points that g sends into D(β, δ)
          const hitU = [], hitW = [];
          for (let k = 0; k < m.n; k++) { const wx = m.W[2 * k], wy = m.W[2 * k + 1]; if ((wx - beta[0]) ** 2 + (wy - beta[1]) ** 2 < del * del) { hitU.push([m.U[2 * k], m.U[2 * k + 1]]); hitW.push([wx, wy]); } }
          O.dots(hitW, { color: 'green', r: 1.6 });
          D.dots(hitU, { color: 'green', r: 2.2 });
          D.circle(0, 0, 1, { color: 'ink', width: 1, alpha: 0.4 });
          // diameter of the preimage set (and whether it splits into two clusters)
          let diam = 0; const sub = hitU.filter((_, i) => i % Math.max(1, Math.floor(hitU.length / 300)) === 0);
          for (let i = 0; i < sub.length; i++) for (let j = i + 1; j < sub.length; j++) diam = Math.max(diam, Math.hypot(sub[i][0] - sub[j][0], sub[i][1] - sub[j][1]));
          const onSlit = key === 'slit' && Math.abs(beta[1]) < 1e-9 && beta[0] > SLIT_A + 1e-6 && beta[0] < 1 - 1e-6;
          if (onSlit) { const z = slitPhi([beta[0], 1e-12]); const mm = cabs(z); for (const s of [1, -1]) D.dot(z[0] / mm, s * Math.abs(z[1] / mm), { color: 'red', r: 6, label: s > 0 ? 'ζ' : "ζ′", labelPos: s > 0 ? 'ne' : 'se' }); }
          st = { diam, n: hitU.length, onSlit, del };
          v.legend([['green', '$\\Omega\\cap D(\\beta;\\delta)$ and its preimage', { area: true }], ['muted', 'boundary colours: matching points of $\\partial\\Omega$ and $T$']].concat(onSlit ? [['red', 'the two preimages of $\\beta$', { dot: true }]] : []));
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (!s.n) return 'Move $\\beta$ or enlarge $\\delta$.';
          return s.onSlit
            ? `$\\beta$ is on the slit (not simple): the preimage of $\\Omega\\cap D(\\beta;${v.fix(s.del, 2)})$ has diameter $${v.fix(s.diam, 3)}$, and it does not shrink as $\\delta\\to0$ — it splits around the two points $\\zeta,\\zeta'$ that the two banks come from.`
            : `The preimage of $\\Omega\\cap D(\\beta;${v.fix(s.del, 2)})$ has diameter $${v.fix(s.diam, 3)}$, which tends to $0$ with $\\delta$: $f$ is continuous at $\\beta$, and the boundary colours show the correspondence $\\partial\\Omega\\leftrightarrow T$ is one-to-one.`;
        });
      },
    },
    {
      num: '14.19',
      kind: 'Theorem',
      name: 'Simple boundary points give a homeomorphism of the closures',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 14.19 and proof, pp. 290–291; Jordan-curve converse in Remark 14.20(a), p. 291'],
      statement: String.raw`If $\Omega$ is a bounded simply connected plane region and every boundary point is simple, every conformal map $f:\Omega\to U$ onto $U$ extends to a homeomorphism $\overline\Omega\to\overline U$. In particular this holds when $\partial\Omega$ is a Jordan curve: Remark14.20(a) states the converse topological fact that every point of such a boundary is simple.`,
      idea: String.raw`Theorem14.18 gives a continuous extension at each boundary point and says that distinct simple boundary points have distinct images. To show continuity on the whole closure, approximate each point of a convergent boundary sequence by a nearby interior point, also with nearby image. The extension's image is compact, contains $U$, and lies in $\overline U$, so it is all of $\overline U$. A continuous bijection from a compact space to a Hausdorff space has continuous inverse. The Jordan-boundary case then uses the topological converse stated in14.20(a).`,
      caption: String.raw`Drag $\zeta$ around $T$. Middle: the extended map $g=f^{-1}$ sends it to $g(\zeta)\in\partial\Omega$; the boundary is coloured by the angle of its preimage. Right: the boundary correspondence $\arg\zeta\mapsto\arg g(\zeta)$. For the Jordan regions (a cardioid with a cusp, a triangle) it is strictly increasing — a homeomorphism of $T$ onto $\partial\Omega$, even at the cusp and at the corners. For the slit disc a whole arc of $T$ is folded onto the slit (flat red part): each slit point has two preimages.`,
      deps: ['rca-14.18', 'rca-14.16'],
      tags: ['boundary behaviour', 'Jordan curves', 'Carathéodory'],
      viz(v) {
        const REG = {
          card: { label: 'cardioid', g: cardG, view: [[-0.9, 1.65], [-1.3, 1.3]] },
          tri: { label: 'triangle', g: TRI.g, view: [[-1.05, 1.95], [-1.5, 1.5]] },
          slit: { label: 'slit disc', g: slitG, view: [[-1.12, 1.12], [-1.12, 1.12]] },
        };
        const which = v.select('$\\Omega$', Object.entries(REG).map(([value, o]) => ({ value, label: o.label })), 'card');
        const D = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, height: 270, axes: false, minWidth: 220, title: '$\\overline U$' });
        const O = v.stage({ x: [-0.9, 1.65], y: [-1.3, 1.3], equal: true, height: 270, axes: false, minWidth: 220, title: '$\\overline\\Omega$, $\\;g(\\zeta)$' });
        const P = v.stage({ x: [-Math.PI, Math.PI], y: [-Math.PI, Math.PI], height: 270, axes: 'box', minWidth: 220, xlabel: 'arg ζ', ylabel: 'arg g(ζ)', xticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], yticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], title: 'boundary correspondence' });
        const zh = D.handle(Math.cos(2.2), Math.sin(2.2), { color: 'ink', label: 'ζ', labelPos: 'nw', constrain: (x, y) => { const m = Math.hypot(x, y) || 1; return [x / m, y / m]; } });
        const NB = 1440, cache = {};
        const corr = (key) => {
          if (cache[key]) return cache[key];
          const g = REG[key].g;
          const pts = Array.from({ length: NB + 1 }, (_, i) => { const s = -Math.PI + TAU * i / NB; return { s, w: g([(1 - 1e-9) * Math.cos(s), (1 - 1e-9) * Math.sin(s)]) }; });
          return (cache[key] = { pts, G: polarImage(g, [0.3, 0.6, 0.85], 16) });
        };
        let st = null;
        v.render(() => {
          const key = which.value, R = REG[key], C = corr(key);
          O.setView(...R.view);
          const s = Math.atan2(zh.y, zh.x);
          // U with the hue-coloured circle
          for (let i = 0; i < 360; i++) { const t0 = TAU * i / 360, t1 = TAU * (i + 1) / 360; D.line(Math.cos(t0), Math.sin(t0), Math.cos(t1), Math.sin(t1), { color: hue(v.M, t0), width: 5 }); }
          for (const r of [0.3, 0.6, 0.85]) D.circle(0, 0, r, { color: 'teal', width: 1, alpha: 0.4 });
          for (let k = 0; k < 16; k++) D.line(0, 0, Math.cos(TAU * k / 16 + 1e-3), Math.sin(TAU * k / 16 + 1e-3), { color: 'purple', width: 1, alpha: 0.35 });
          D.line(0, 0, zh.x, zh.y, { color: 'ink', width: 1.4, dash: [4, 3] });
          // Ω with hue-coloured boundary
          C.G.circles.forEach((c) => O.path(c, { color: 'teal', width: 1, alpha: 0.4 }));
          C.G.rays.forEach((c) => O.path(c, { color: 'purple', width: 1, alpha: 0.35 }));
          for (let i = 0; i < NB; i++) { const a = C.pts[i], b2 = C.pts[i + 1]; if (Math.hypot(b2.w[0] - a.w[0], b2.w[1] - a.w[1]) < 0.2) O.line(a.w[0], a.w[1], b2.w[0], b2.w[1], { color: hue(v.M, (a.s + TAU) % TAU), width: key === 'slit' && Math.abs(a.w[1]) < 1e-6 ? 3 : 4.5, alpha: key === 'slit' && Math.abs(a.w[1]) < 1e-6 ? 0.85 : 1 }); }
          const gz = REG[key].g([(1 - 1e-9) * Math.cos(s), (1 - 1e-9) * Math.sin(s)]);
          const radial = Array.from({ length: 81 }, (_, i) => REG[key].g([(i / 80) * (1 - 1e-9) * Math.cos(s), (i / 80) * (1 - 1e-9) * Math.sin(s)]));
          O.path(radial, { color: 'ink', width: 1.4, dash: [4, 3] });
          O.dot(gz[0], gz[1], { color: 'ink', r: 6, label: 'g(ζ)', labelPos: 'ne' });
          let twin = null;
          if (key === 'slit' && Math.abs(gz[1]) < 1e-6 && gz[0] > SLIT_A) { twin = -s; D.dot(Math.cos(twin), Math.sin(twin), { color: 'red', r: 6, label: "ζ′", labelPos: 'sw' }); }
          // the correspondence plot (arguments unwrapped along T)
          const ys = []; let prev = null, off = 0;
          for (const p of C.pts) { let a = Math.atan2(p.w[1], p.w[0]); if (Math.abs(p.w[1]) < 1e-9 && p.w[0] > 0) a = 0; if (prev != null) { const d = a + off - prev; if (d > Math.PI) off -= TAU; if (d < -Math.PI) off += TAU; } ys.push([p.s, a + off]); prev = a + off; }
          const shift = ys[NB >> 1][1]; // centre so that arg g(1) = 0
          const pts = ys.map(([x, y]) => [x, y - shift]);
          P.path([[-Math.PI, -Math.PI], [Math.PI, Math.PI]], { color: 'grid', width: 1.2 });
          P.path(pts, { color: 'accent', width: 2.4 });
          if (key === 'slit') { const flat = pts.filter((q) => Math.abs(q[1]) < 1e-6); if (flat.length) P.path(flat, { color: 'red', width: 5 }); }
          const i0 = Math.round((s + Math.PI) / TAU * NB);
          P.dot(s, pts[i0][1], { color: 'ink', r: 5.5 });
          let minSlope = Infinity; for (let i = 0; i + 4 < pts.length; i += 4) minSlope = Math.min(minSlope, (pts[i + 4][1] - pts[i][1]) / (pts[i + 4][0] - pts[i][0]));
          st = { key, twin, s, minSlope, gz };
          v.legend([['ink', '$\\zeta$, the radius to it, and their images', { dot: true }], ['accent', '$\\arg\\zeta\\mapsto\\arg g(\\zeta)$'], ['red', 'an arc of $T$ folded onto the slit']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          if (s.key === 'slit') return s.twin != null ? `$g(\\zeta) = ${v.fix(s.gz[0], 3)}$ lies on the slit and is also $g(\\zeta')$ with $\\zeta'=\\bar\\zeta\\ne\\zeta$: the extension is continuous but not one-to-one — the slit disc is not a Jordan region, and its slit points are not simple.` : `This $\\zeta$ lands on the outer circle. Move it near $1$: the arc of $T$ around $1$ is folded onto the slit, two points to each slit point.`;
          return s.key === 'card'
            ? `$\\arg g(\\zeta)$ is strictly increasing in $\\arg\\zeta$; its slope vanishes only at $\\zeta=-1$, which goes to the cusp. The boundary correspondence is a homeomorphism $T\\to\\partial\\Omega$.`
            : `$\\arg g(\\zeta)$ is strictly increasing in $\\arg\\zeta$ (smallest slope $\\approx ${v.fix(Math.max(0, s.minSlope), 3)}>0$; it is steepest at the prevertices of the corners). The boundary correspondence is a homeomorphism $T\\to\\partial\\Omega$.`;
        });
      },
    },
    // ------------------------------------------------------------------ conformal mapping of an annulus
    {
      num: '14.22',
      kind: 'Theorem',
      name: 'Annuli of different moduli are not conformally equivalent',
      statement: String.raw`For $0<r_1<r_2$ let $A(r_1,r_2)=\{z:r_1<|z|<r_2\}$. Then $A(r_1,r_2)$ and $A(s_1,s_2)$ are conformally equivalent if and only if $r_2/r_1=s_2/s_1$.`,
      idea: String.raw`If the ratios agree, $z\mapsto(s_1/r_1)z$ is a conformal equivalence. Conversely, scale to $A(1,R)$ and $A(1,S)$ and let $f$ be a conformal map between them; composing with $z\mapsto S/z$ if necessary, $|f(z)|\to1$ as $|z|\to1$ and $|f(z)|\to S$ as $|z|\to R$ (the inner boundary must go to one of the two boundary circles). With $\alpha=\log S/\log R$, $u=\log|f|-\alpha\log|z|$ is harmonic with boundary values $0$, so $u\equiv0$ by the maximum principle. Then $f'/f=\alpha/z$; integrating around $|z|=\sqrt R$ gives $\alpha=\frac1{2\pi i}\oint f'/f\in\Z$, so $f(z)=cz^\alpha$ with $\alpha$ a positive integer, and injectivity forces $\alpha=1$, i.e. $S=R$.`,
      caption: String.raw`Set the outer radii $R$ (left annulus $A(1,R)$) and $S$ (right annulus $A(1,S)$); the cells on the left are conformal squares in log-polar coordinates. A conformal map would have to satisfy $|f(z)|=|z|^\alpha$, $\alpha=\log S/\log R$. The power map $z^\alpha$ keeps the cells square but does not close up: unless $\alpha=1$ the last sector overlaps or misses the first (red seam). The radial stretch $z|z|^{\alpha-1}$ closes up but turns squares into rectangles of aspect $\alpha$ — not conformal. Only $S=R$ satisfies both.`,
      deps: ['rca-14.7', 'rca-11.3', 'rca-10.24'],
      see: ['rca-14.8'],
      tags: ['annulus', 'conformal equivalence', 'modulus'],
      viz(v) {
        const mode = v.select('candidate map', [{ value: 'pow', label: 'power $z^{\\alpha}$' }, { value: 'str', label: 'radial stretch $z|z|^{\\alpha-1}$' }], 'pow');
        const RS = v.slider('$R$', 1.6, 4, 2.6, { step: 0.01 });
        const SS = v.slider('$S$', 1.6, 4, 3.4, { step: 0.01 });
        const L = v.stage({ x: [-4.2, 4.2], y: [-4.2, 4.2], equal: true, height: 320, axes: false, title: '$A(1,R)$: conformal squares' });
        const Rt = v.stage({ x: [-4.2, 4.2], y: [-4.2, 4.2], equal: true, height: 320, axes: false, title: 'image in $A(1,S)$' });
        const K = 24, h = TAU / K;
        const sector = (r0, r1, t0, t1) => { const pts = []; const n = 10; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; pts.push([r0 * Math.cos(t), r0 * Math.sin(t)]); } for (let i = n; i >= 0; i--) { const t = t0 + (t1 - t0) * i / n; pts.push([r1 * Math.cos(t), r1 * Math.sin(t)]); } return pts; };
        let st = null;
        v.render(() => {
          const R = RS.value, S = SS.value, a = Math.log(S) / Math.log(R), lr = Math.log(R), m = Math.ceil(lr / h - 1e-9);
          const V = Math.max(R, S) * 1.2;
          L.setView([-V, V], [-V, V]); Rt.setView([-V, V], [-V, V]);
          const col = (i, j) => ((i + j) % 2 ? 'teal' : 'gold');
          for (let i = 0; i < m; i++) for (let j = 0; j < K; j++) {
            const l0 = i * h, l1 = Math.min(lr, (i + 1) * h);
            L.poly(sector(Math.exp(l0), Math.exp(l1), j * h, (j + 1) * h), { fill: col(i, j), fillAlpha: 0.45, color: 'panel', width: 0.6 });
            if (mode.value === 'pow') Rt.poly(sector(Math.exp(a * l0), Math.exp(a * l1), a * j * h, a * (j + 1) * h), { fill: col(i, j), fillAlpha: 0.45, color: 'panel', width: 0.6 });
            else Rt.poly(sector(Math.exp(a * l0), Math.exp(a * l1), j * h, (j + 1) * h), { fill: col(i, j), fillAlpha: 0.45, color: 'panel', width: 0.6 });
          }
          for (const [S2, rr] of [[L, R], [Rt, S]]) { S2.circle(0, 0, 1, { color: 'ink', width: 1.8 }); S2.circle(0, 0, rr, { color: 'ink', width: 1.8 }); }
          if (mode.value === 'pow') {
            // the first ray and the image of the last one
            Rt.line(1, 0, S, 0, { color: 'red', width: 2.6 });
            Rt.line(Math.cos(TAU * a), Math.sin(TAU * a), S * Math.cos(TAU * a), S * Math.sin(TAU * a), { color: 'red', width: 2.6, dash: [6, 4] });
            const mis = TAU * (a - Math.round(a));
            const rr = (1 + S) / 2, pts = Array.from({ length: 41 }, (_, i) => { const t = TAU * Math.round(a) + mis * i / 40; return [rr * Math.cos(t), rr * Math.sin(t)]; });
            if (Math.abs(mis) > 1e-3) Rt.path(pts, { color: 'red', width: 2 });
            Rt.corner(Math.abs(a - 1) < 0.005 ? 'closes up: α = 1' : `seam mismatch 2π(α−1) = ${v.fix(TAU * (a - 1), 2)}`, 'bl', { color: Math.abs(a - 1) < 0.005 ? 'green' : 'red', weight: 600 });
          } else {
            Rt.corner(Math.abs(a - 1) < 0.005 ? 'cells stay square: α = 1' : `cells have aspect ratio α = ${v.fix(a, 3)}`, 'bl', { color: Math.abs(a - 1) < 0.005 ? 'green' : 'red', weight: 600 });
          }
          L.tex('R', R * Math.cos(0.8), R * Math.sin(0.8), { color: 'ink', size: 15, dx: 10, dy: -8 });
          Rt.tex('S', S * Math.cos(0.8), S * Math.sin(0.8), { color: 'ink', size: 15, dx: 10, dy: -8 });
          st = { a, R, S, mode: mode.value };
          v.legend([['gold', 'checkerboard of conformal squares', { area: true }]].concat(mode.value === 'pow' ? [['red', 'image of the ray $\\arg z=0$: at the start (solid), after one turn (dashed)']] : []));
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const eq = Math.abs(s.a - 1) < 0.005;
          return `$\\alpha=\\log S/\\log R = ${v.fix(s.a, 3)}$. ${eq ? 'With $S=R$ the identity map works: the annuli are conformally equivalent.' : s.mode === 'pow' ? '$z^\\alpha$ is conformal but not single-valued on the annulus ($\\alpha\\notin\\Z$, or $\\alpha\\ge2$ and not one-to-one).' : 'The stretch is a homeomorphism onto $A(1,S)$, but it is not conformal.'} Moduli: $\\log R = ${v.fix(Math.log(s.R), 3)}$, $\\log S = ${v.fix(Math.log(s.S), 3)}$.`;
        });
      },
    },
  ],
};
