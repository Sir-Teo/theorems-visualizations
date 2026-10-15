// Classical Mechanics — Chapter 10: Rigid bodies (part b: 10.8–10.14)

import {
  TAU, DEG, clamp, memo, rk4, rk4rec, idxAt, span, sci, num, series, ellK,
  add, sub, scl, madd, dot, crs, nrm, unit, angle, perp, I3, mm, mv, mT, fro, rotAxis,
  qmul, qmat, qnormalize, eulerRHS, eulerPost, topRHS, topPost, topEnergy,
  drawBox, circlePts, ellipsoidWire, tube, AXC, spherePath, sphereFrame,
} from './ch10.shared.js';

/** Inertia tensor about the centre of mass of point masses → {I, c}. */
function pointTensor(ms, ps) {
  const M = ms.reduce((a, b) => a + b, 0), c = [0, 1, 2].map((j) => ps.reduce((s, p, i) => s + ms[i] * p[j], 0) / M);
  const I = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  ps.forEach((p0, i) => { const p = sub(p0, c), r2 = dot(p, p); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) I[a][b] += ms[i] * ((a === b ? r2 : 0) - p[a] * p[b]); });
  return { I, c };
}
/** Principal moments ascending with their axes (right-handed). */
function principal(v, I) {
  const E = v.M.eigSym(I), vals = E.values.slice().reverse(), vecs = E.vecs.slice().reverse().map((e) => e.slice());
  if (dot(crs(vecs[0], vecs[1]), vecs[2]) < 0) vecs[2] = scl(vecs[2], -1);
  return { vals, vecs };
}
/** Exact period of the torque-free motion (Landau & Lifshitz §37) for moments I1 < I2 < I3, |L|² = L2 and energy E. */
function freePeriod(Id, L2, E) {
  const [I1, I2, I3] = Id, s = 2 * E;
  if (L2 > s * I2) { const k2 = ((I2 - I1) * (s * I3 - L2)) / ((I3 - I2) * (L2 - s * I1)); return 4 * ellK(k2) * Math.sqrt((I1 * I2 * I3) / ((I3 - I2) * (L2 - s * I1))); }
  const k2 = ((I3 - I2) * (L2 - s * I1)) / ((I2 - I1) * (s * I3 - L2)); return 4 * ellK(k2) * Math.sqrt((I1 * I2 * I3) / ((I2 - I1) * (s * I3 - L2)));
}
/** Upward zero crossings of the series ys (linear interpolation) → times. */
function upCross(ts, ys) { const out = []; for (let i = 1; i < ys.length; i++) if (ys[i - 1] < 0 && ys[i] >= 0) out.push(ts[i - 1] + ((ts[i] - ts[i - 1]) * -ys[i - 1]) / (ys[i] - ys[i - 1])); return out; }
const meanGap = (c) => (c.length >= 2 ? (c[c.length - 1] - c[0]) / (c.length - 1) : NaN);
/** Box inertia (full side lengths a, b, c; mass m). */
const boxI = (m, a, b, c) => [(m * (b * b + c * c)) / 12, (m * (a * a + c * c)) / 12, (m * (a * a + b * b)) / 12];
/** Integrate a free (or torqued) body: Euler's equations + quaternion, RK4. */
function runEuler(Id, w0, T, n, every, torque = null, q0 = [1, 0, 0, 0]) {
  return rk4rec(eulerRHS(Id, torque), [...q0, ...w0], T, n, every, eulerPost);
}
/** Draw the six polhodes families etc. on a body-frame sphere: great circles through ±e2 (separatrices). */
function separatrices(Id) {
  const [I1, I2, I3] = Id, c = Math.sqrt((1 / I1 - 1 / I2) / (1 / I2 - 1 / I3)), out = [];
  for (const sg of [1, -1]) { const nrmv = unit([1, 0, sg * c]); out.push({ a: nrmv, b: [0, 1, 0] }); }
  return out;
}

export default {
  collection: 'mech',
  chapter: 10,
  items: [
    // ───────────────────────────────────────────────────────────── 10.8
    {
      num: '10.8',
      kind: 'Theorem',
      name: 'Principal axes of inertia',
      statement: String.raw`The inertia tensor $\mathsf I$ of a rigid body about any point is real, symmetric and positive semidefinite; it is definite unless all the mass lies on one line through the point. Hence there is an orthonormal basis $\mathbf e_1, \mathbf e_2, \mathbf e_3$ of eigenvectors, the **principal axes**, with real eigenvalues $0 \le I_1 \le I_2 \le I_3$, the **principal moments**. In this basis
$$\mathsf I = \operatorname{diag}(I_1, I_2, I_3), \qquad \mathbf L = (I_1\omega_1,\ I_2\omega_2,\ I_3\omega_3), \qquad T = \tfrac12\left(I_1\omega_1^2 + I_2\omega_2^2 + I_3\omega_3^2\right).$$
Angular momentum is parallel to angular velocity exactly when $\boldsymbol\omega$ lies along a principal axis. If the three moments are distinct, these are the six directions $\pm\mathbf e_i$ and nothing else. If two moments coincide (a symmetric top), every direction in their plane qualifies; if all three coincide (a spherical top), every direction does. The moments obey the triangle inequalities, for instance $I_1 + I_2 \ge I_3$, with equality only for a flat body. Any axis of rotational symmetry of the body is a principal axis.`,
      idea: String.raw`$I_{jk} = \sum m(r^2\delta_{jk} - r_jr_k)$ is visibly symmetric (10.7), and $\boldsymbol\omega\cdot\mathsf I\boldsymbol\omega = \sum m|\boldsymbol\omega\times\mathbf r|^2 \ge 0$, which vanishes only if every $\mathbf r$ is parallel to $\boldsymbol\omega$. The real spectral theorem (ladr-7.29, the finite-dimensional case of fa-12.30) then gives an orthonormal eigenbasis with real eigenvalues. $\mathbf L \parallel \boldsymbol\omega$ means $\mathsf I\boldsymbol\omega = \lambda\boldsymbol\omega$, which is the eigenvalue equation itself. In principal coordinates $I_1 + I_2 - I_3 = 2\sum m z^2 \ge 0$, the perpendicular-axis computation of 10.4.`,
      caption: String.raw`Drag the five equal masses and the tip of $\boldsymbol\omega$ (blue); drag the background to rotate. The tensor is diagonalised live, and the three principal axes are drawn through the centre of mass, coloured teal, gold and pink from the smallest moment to the largest. Right: for every direction of $\boldsymbol\omega$ (longitude and latitude), the angle between $\boldsymbol\omega$ and $\mathbf L = \mathsf I\boldsymbol\omega$. It is zero only at the six dots $\pm\mathbf e_i$. Drag the blue handle on the map, or press *Slide ω until L ∥ ω*, and it always ends on one of them. *Make it symmetric* sets two moments equal, and the zeros then fill a whole circle.`,
      deps: ['mech-10.7', 'ladr-7.29', 'fa-12.30'],
      refs: ['Taylor §10.4', 'Goldstein §5.4'],
      tags: ['principal axes', 'spectral theorem', 'inertia tensor'],
      credit: 'Segner, 1755; Euler, 1758',
      viz(v) {
        const S = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 340, title: 'five masses, principal axes, $\\boldsymbol\\omega$ and $\\mathbf L$' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axes: false, lim: 1.5, hint: false });
        const sm = v.stage({ x: [-180, 180], y: [-90, 90], axes: 'box', height: 340, xticks: [-180, -90, 0, 90, 180], yticks: [-90, -45, 0, 45, 90], title: 'angle between $\\boldsymbol\\omega$ and $\\mathbf L$ for each direction of $\\boldsymbol\\omega$' });
        const START = [[0.9, 0.35, 0.2], [-0.75, 0.55, -0.1], [0.15, -0.85, 0.35], [-0.35, -0.2, 0.95], [0.25, 0.4, -0.9]];
        const Hm = START.map((p) => sc.handle(p, { color: 'ink', r: 6 }));
        const W = sc.handle([0.55, -0.5, 1.0], { color: 'accent', label: '$\\boldsymbol\\omega$' });
        const lonlat = (d) => [Math.atan2(d[1], d[0]) / DEG, Math.asin(clamp(d[2], -1, 1)) / DEG];
        const fromLL = (lo, la) => [Math.cos(la * DEG) * Math.cos(lo * DEG), Math.cos(la * DEG) * Math.sin(lo * DEG), Math.sin(la * DEG)];
        const state = () => { const ps = Hm.map((h) => h.p), T = pointTensor([1, 1, 1, 1, 1], ps); return { ps, ...T }; };
        const MH = sm.handle(0, 0, { color: 'accent', onDrag: () => { const st = state(), wn = Math.max(0.3, nrm(sub(W.p, st.c))); W.set(add(st.c, scl(fromLL(MH.x, MH.y), wn))); } });
        let seed = 3;
        v.button('New random body', () => { const r = v.rng(++seed); for (const h of Hm) h.set([r.uniform(-1.1, 1.1), r.uniform(-1.1, 1.1), r.uniform(-1.1, 1.1)]); });
        v.button('Make it symmetric', () => { const a0 = 0.4, rr = 0.95; Hm.forEach((h, k) => h.set(k < 3 ? [rr * Math.cos(a0 + (TAU * k) / 3), rr * Math.sin(a0 + (TAU * k) / 3), -0.25] : [0, 0, k === 3 ? 0.95 : -1.1])); });
        v.button('Slide ω until L ∥ ω', () => {
          const st = state(), wn = Math.max(0.3, nrm(sub(W.p, st.c))); let d = unit(sub(W.p, st.c));
          const f = (x) => { const u = unit(x), L = mv(st.I, u); return 1 - dot(u, L) ** 2 / Math.max(1e-30, dot(L, L)); };
          for (let k = 0; k < 600; k++) {
            const h = 1e-6, g = [0, 1, 2].map((j) => { const e = [0, 0, 0]; e[j] = h; return (f(add(d, e)) - f(sub(d, e))) / (2 * h); });
            const gt = madd(g, d, -dot(g, d)); if (nrm(gt) < 1e-13) break;
            d = unit(madd(d, gt, -0.25 / Math.max(1, nrm(gt))));
          }
          W.set(add(st.c, scl(d, wn)));
        });
        const cacheH = memo(); let cur = null;
        v.render(() => {
          const st = state(), { ps, I, c } = st, P = principal(v, I);
          const w = sub(W.p, c), L = mv(I, w), ang = angle(w, L);
          // 3D
          sc.begin();
          ps.forEach((p) => sc.line(c, p, { color: 'faint', width: 1.2 }));
          P.vecs.forEach((e, i) => { sc.line(madd(c, e, -1.45), madd(c, e, 1.45), { color: AXC[i], width: 2.4, alpha: 0.9 }); sc.tex(`\\mathbf e_${i + 1}`, madd(c, e, 1.58), { color: AXC[i], size: 15 }); });
          ps.forEach((p) => sc.dot(p, { r: 7, color: 'ink' }));
          sc.dot(c, { r: 3.5, color: 'muted' });
          sc.arrow(c, add(c, w), { color: 'accent', width: 3 });
          const KL = nrm(w) / Math.max(1e-9, nrm(L));
          sc.arrow(c, madd(c, L, KL * 0.95), { color: 'purple', width: 3 });
          sc.tex('\\mathbf L', madd(c, L, KL * 1.08), { color: 'purple', size: 16 });
          sc.flush();
          // map of the angle between ω and Iω
          const key = I.flat().map((x) => x.toFixed(4)).join(',');
          const amax = cacheH(key, () => { let m = 0; for (let la = -88; la <= 88; la += 4) for (let lo = -180; lo < 180; lo += 4) { const d = fromLL(lo, la); m = Math.max(m, angle(d, mv(I, d))); } return Math.max(m / DEG, 1); });
          sm.heat((lo, la) => { const d = fromLL(lo, la); return angle(d, mv(I, d)) / DEG; }, { range: [0, amax], cmap: 'viridis', key, res: 3 });
          sm.axes();
          P.vecs.forEach((e, i) => { for (const sg of [1, -1]) { const [lo, la] = lonlat(scl(e, sg)); sm.dot(lo, la, { r: 5.5, color: AXC[i] }); sm.text((sg > 0 ? '+' : '−') + 'e' + (i + 1), lo, la, { color: AXC[i], size: 11, dx: 9, dy: -11, plate: true }); } });
          const [lw, aw] = lonlat(unit(w));
          if (!MH.dragging) { MH.x = lw; MH.y = aw; }
          sm.corner(`dark = 0°, bright = ${v.fix(amax, 1)}° · longitude across, latitude up`, 'bl', { color: 'ink', size: 11, plate: true });
          cur = { P, w, L, ang };
        });
        v.legend([['teal', '$\\mathbf e_1$ (smallest moment)'], ['gold', '$\\mathbf e_2$'], ['pink', '$\\mathbf e_3$ (largest)'], ['accent', '$\\boldsymbol\\omega$'], ['purple', '$\\mathbf L = \\mathsf I\\boldsymbol\\omega$']]);
        v.readout(() => {
          if (!cur) return '';
          const { P, w, L, ang } = cur, [I1, I2, I3v] = P.vals, e = P.vecs;
          const orth = Math.max(Math.abs(dot(e[0], e[1])), Math.abs(dot(e[0], e[2])), Math.abs(dot(e[1], e[2])));
          let out = String.raw`principal moments $I_1 = ${v.fix(I1, 4)}$, $I_2 = ${v.fix(I2, 4)}$, $I_3 = ${v.fix(I3v, 4)}$ kg·m² · axes orthonormal: $\max|\mathbf e_i\cdot\mathbf e_j| = ${sci(v, orth)}$ · $I_1 + I_2 - I_3 = ${v.fix(I1 + I2 - I3v, 4)} \ge 0$ · angle between $\boldsymbol\omega$ and $\mathbf L$: ${v.fix(ang / DEG, 3)}°`;
          if (ang < 0.5 * DEG) { const k = [0, 1, 2].reduce((a, b) => (Math.abs(dot(unit(w), e[b])) > Math.abs(dot(unit(w), e[a])) ? b : a), 0); out += String.raw` — $\boldsymbol\omega$ lies along $\pm\mathbf e_${k + 1}$ and $|\mathbf L - I_${k + 1}\boldsymbol\omega| = ${sci(v, nrm(madd(L, w, -P.vals[k])))}$`; }
          if (Math.abs(I2 - I1) < 1e-3 * I3v || Math.abs(I3v - I2) < 1e-3 * I3v) out += ' · two moments coincide: a whole circle of directions is principal';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.9
    {
      num: '10.9',
      kind: 'Definition',
      name: 'Rotational energy and the inertia ellipsoid',
      statement: String.raw`The kinetic energy of a body turning about a fixed point (or about its centre of mass) is the quadratic form
$$T = \tfrac12\,\boldsymbol\omega\cdot\mathsf I\boldsymbol\omega = \tfrac12\,\boldsymbol\omega\cdot\mathbf L = \tfrac12\sum_i I_i\omega_i^2 .$$
At fixed energy, the possible angular velocities fill the **energy (inertia) ellipsoid** $\boldsymbol\omega\cdot\mathsf I\boldsymbol\omega = 2T$, fixed in the body. Its axes are the principal axes, with semi-axes $\sqrt{2T/I_i}$, so it is longest along the axis of smallest moment. Since $\nabla_{\boldsymbol\omega}T = \mathsf I\boldsymbol\omega = \mathbf L$, the angular momentum is **normal to the ellipsoid** at the tip of $\boldsymbol\omega$. (Poinsot’s version, $\mathbf x\cdot\mathsf I\mathbf x = 1$, is the same ellipsoid scaled by $1/\sqrt{2T}$.) The moment about an axis $\hat{\mathbf n}$ is read off from the radius in that direction: $I_{\hat{\mathbf n}} = 2T/\rho(\hat{\mathbf n})^2$.`,
      idea: String.raw`Every mass element has velocity $\boldsymbol\omega\times\mathbf r$, so $T = \tfrac12\sum m|\boldsymbol\omega\times\mathbf r|^2$. Expanding with $|\mathbf a\times\mathbf b|^2 = a^2b^2 - (\mathbf a\cdot\mathbf b)^2$ gives $\tfrac12\boldsymbol\omega\cdot\mathsf I\boldsymbol\omega$ with the tensor of 10.7. In principal coordinates (10.8) it is $\tfrac12\sum I_i\omega_i^2$, and a level set of a positive definite quadratic form is an ellipsoid. The gradient of a quadratic form $\tfrac12\boldsymbol\omega\cdot\mathsf I\boldsymbol\omega$ is $\mathsf I\boldsymbol\omega$, and gradients are normal to level sets. König’s theorem (3.7) adds $\tfrac12Mv_{\rm cm}^2$ when the centre of mass also moves.`,
      caption: String.raw`Set the three side lengths $a, b, c$ (along $x, y, z$) of a 1 kg box; the ellipsoid of all $\boldsymbol\omega$ with $T = \tfrac12$ J is drawn around it, in $\boldsymbol\omega$-space with the body’s axes. Drag the tip of $\boldsymbol\omega$ (blue); it stays on the ellipsoid. $\mathbf L$ (purple) is normal to the ellipsoid there: it is perpendicular to the small tangent patch. The right panel cuts the ellipsoid by the plane containing $\boldsymbol\omega$ and $\mathbf L$, and the right angle between $\mathbf L$ and the tangent line shows up undistorted. Lengthen one side and the ellipsoid shrinks along the axes perpendicular to it.`,
      deps: ['mech-10.8', 'mech-3.7'],
      refs: ['Arnold §28', 'Goldstein §5.6'],
      tags: ['kinetic energy', 'inertia ellipsoid', 'quadratic form'],
      viz(v) {
        const aS = v.slider('side $a$ (m)', 0.2, 2, 1.6, { step: 0.01 });
        const bS = v.slider('side $b$ (m)', 0.2, 2, 1.0, { step: 0.01 });
        const cS = v.slider('side $c$ (m)', 0.2, 2, 0.45, { step: 0.01 });
        const T2 = 1;
        const S = v.stage({ x: [-3.6, 3.6], y: [-3.6, 3.6], equal: true, axes: false, height: 360, title: '$\\boldsymbol\\omega\\cdot\\mathsf I\\boldsymbol\\omega = 2T$ (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.85, pitch: 0.3, axis: 2.9, lim: 4, labels: ['ωx', 'ωy', 'ωz'], hint: false });
        const sX = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: false, height: 360, weight: 0.8, minWidth: 240, title: 'the cut through $\\boldsymbol\\omega$ and $\\mathbf L$' });
        const Id = () => boxI(1, aS.value, bS.value, cS.value);
        const onE = (p) => { const I = Id(), q = I[0] * p[0] ** 2 + I[1] * p[1] ** 2 + I[2] * p[2] ** 2; return q > 1e-12 ? scl(p, Math.sqrt(T2 / q)) : p; };
        const W = sc.handle(onE([1, 0.8, 0.9]), { color: 'accent', label: '$\\boldsymbol\\omega$', snap: onE });
        let cur = null;
        v.render(() => {
          const I = Id(), ax = I.map((x) => Math.sqrt(T2 / x)), w = onE(W.p);
          if (!W.dragging && nrm(sub(w, W.p)) > 1e-9) W.set(w);
          const L = [I[0] * w[0], I[1] * w[1], I[2] * w[2]], n = unit(L);
          // numerical normal from finite differences of f(ω) = ωᵀIω
          const f = (p) => I[0] * p[0] ** 2 + I[1] * p[1] ** 2 + I[2] * p[2] ** 2, h = 1e-6;
          const g = [0, 1, 2].map((j) => { const e = [0, 0, 0]; e[j] = h; return (f(add(w, e)) - f(sub(w, e))) / (2 * h); });
          // kinetic energy summed over mass points of the box (12³ midpoint cells)
          const N = 12, dm = 1 / N ** 3; let Tm = 0, wL = 0;
          const Lm = [0, 0, 0];
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) {
            const r = [aS.value * ((i + 0.5) / N - 0.5), bS.value * ((j + 0.5) / N - 0.5), cS.value * ((k + 0.5) / N - 0.5)], vel = crs(w, r);
            Tm += 0.5 * dm * dot(vel, vel); const lr = crs(r, vel); Lm[0] += dm * lr[0]; Lm[1] += dm * lr[1]; Lm[2] += dm * lr[2];
          }
          wL = 0.5 * dot(w, Lm);
          sc.begin();
          ellipsoidWire(sc, I3(), ax, { color: 'accent', alpha: 0.32, lat: 9, lon: 14 });
          drawBox(sc, I3(), [aS.value / 2, bS.value / 2, cS.value / 2], { fillAlpha: 0.22 });
          // tangent patch at ω
          const t1 = perp(n), t2 = crs(n, t1);
          sc.disc(t1, t2, 0.75, { fill: 'purple', fillAlpha: 0.12, color: 'purple', grid: true }, w);
          sc.arrow([0, 0, 0], w, { color: 'accent', width: 3 });
          sc.arrow(w, madd(w, n, 1.3), { color: 'purple', width: 3 });
          sc.tex('\\mathbf L', madd(w, n, 1.5), { color: 'purple', size: 16 });
          ax.forEach((r, i) => { const e = [0, 0, 0]; e[i] = r; sc.dot(e, { r: 3.5, color: AXC[i] }); });
          sc.flush();
          // the planar cut
          let u = unit(w), q = madd(n, u, -dot(n, u)); if (nrm(q) < 1e-6) q = perp(u); q = unit(q);
          const ell = []; for (let k = 0; k <= 180; k++) { const ph = (TAU * k) / 180, d = madd(scl(u, Math.cos(ph)), q, Math.sin(ph)), r = Math.sqrt(T2 / f(d)); ell.push([r * Math.cos(ph), r * Math.sin(ph)]); }
          const R0 = Math.max(...ell.map((p) => Math.hypot(p[0], p[1])));
          sX.setView([-1.15 * R0, 1.15 * R0], [-1.15 * R0, 1.15 * R0]);
          sX.poly(ell, { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.06 });
          const wr = nrm(w), Lc = [dot(n, u), dot(n, q)], tg = [-Lc[1], Lc[0]];
          sX.line(wr - 0.6 * R0 * tg[0], -0.6 * R0 * tg[1], wr + 0.6 * R0 * tg[0], 0.6 * R0 * tg[1], { color: 'purple', width: 1.4, dash: [6, 4] });
          sX.arrow(0, 0, wr, 0, { color: 'accent', width: 2.6 });
          sX.arrow(wr, 0, wr + 0.32 * R0 * Lc[0], 0.32 * R0 * Lc[1], { color: 'purple', width: 2.6 });
          const sq = 0.08 * R0, A1 = [wr + sq * Lc[0], sq * Lc[1]], A2 = [wr + sq * (Lc[0] + tg[0]), sq * (Lc[1] + tg[1])], A3 = [wr + sq * tg[0], sq * tg[1]];
          sX.path([A1, A2, A3], { color: 'purple', width: 1.4 });
          sX.dot(0, 0, { r: 3, color: 'muted' });
          sX.tex('\\boldsymbol\\omega', wr / 2, 0, { color: 'accent', dy: 12, size: 15 });
          sX.tex('\\mathbf L', wr + 0.32 * R0 * Lc[0], 0.32 * R0 * Lc[1], { color: 'purple', size: 15, dy: -14 });
          cur = { I, ax, w, L, g, Tm, wL };
        });
        v.legend([['accent', '$\\boldsymbol\\omega$ and the energy ellipsoid'], ['purple', '$\\mathbf L = \\mathsf I\\boldsymbol\\omega$, normal to it'], ['teal', 'semi-axis $\\sqrt{2T/I_1}$', { dot: true }], ['gold', '$\\sqrt{2T/I_2}$', { dot: true }], ['pink', '$\\sqrt{2T/I_3}$', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { I, ax, w, L, g, Tm, wL } = cur;
          return String.raw`$I = (${I.map((x) => v.fix(x, 4)).join(',\ ')})$ kg·m², semi-axes $\sqrt{2T/I_i} = (${ax.map((x) => v.fix(x, 3)).join(',\ ')})$ rad/s · $\tfrac12\boldsymbol\omega\cdot\mathsf I\boldsymbol\omega = ${v.fix(0.5 * (I[0] * w[0] ** 2 + I[1] * w[1] ** 2 + I[2] * w[2] ** 2), 6)}$ J · summed over $12^3$ mass cells: $\tfrac12\sum m|\boldsymbol\omega\times\mathbf r|^2 = ${v.fix(Tm, 6)}$ J $= \tfrac12\boldsymbol\omega\cdot\mathbf L_{\rm cells} = ${v.fix(wL, 6)}$ J (midpoint rule, error $1/N^2$) · angle between $\mathbf L$ and the numerical normal $\nabla(\boldsymbol\omega\cdot\mathsf I\boldsymbol\omega)$: $${sci(v, angle(L, g) / DEG)}°$ · between $\boldsymbol\omega$ and the normal: ${v.fix(angle(w, L) / DEG, 2)}°`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.10
    {
      num: '10.10',
      kind: 'Phenomenon',
      name: 'Gyroscopic precession',
      statement: String.raw`A gyroscope (a wheel spinning fast about its axle) supported at one end of the axle does not fall. Its axle swings slowly around the vertical, sideways to the pull of gravity. With spin angular momentum $L_3 = I_3\omega_3$ and gravity’s torque $Mgl$ about the pivot (axle horizontal, wheel a distance $l$ from the pivot), the axle turns at the **precession rate**
$$\Omega = \frac{Mgl}{I_3\,\omega_3}.$$
So faster spin gives slower precession. For a horizontal axle this steady precession is an exact solution, provided the gyroscope is launched with exactly that rate. Released from rest instead, it dips and **nutates** about the steady motion with a dip of about $2MglI_1/(I_3\omega_3)^2$ and a mean rate close to $\Omega$. Both corrections are small only when the spin energy dominates, $I_3\omega_3^2 \gg Mgl$; at low spin the gyroscope simply falls.`,
      idea: String.raw`Torque changes angular momentum (2.9): $d\mathbf L/dt = \boldsymbol\tau$. Gravity acting at the wheel produces a horizontal torque, perpendicular to the axle. For a fast wheel $\mathbf L$ is almost $I_3\omega_3$ along the axle (10.8), so the torque changes the direction of $\mathbf L$ rather than its size, and the axle follows. In a time $dt$, $\mathbf L$ turns through the angle $\tau\,dt/L_3$, which gives $\Omega = Mgl/(I_3\omega_3)$. The full heavy-top analysis (10.16) shows what the approximation leaves out: released at rest, the axle must first fall a little to pick up the horizontal angular momentum $I_1\Omega$ of the precession itself.`,
      caption: String.raw`The wheel spins at $\omega_3$ (the spokes are slowed for display); the gold trail is the end of the axle. Purple is $\mathbf L$, orange is gravity’s torque $\mathbf r\times M\mathbf g$, always horizontal and perpendicular to the axle, so $\mathbf L$ turns sideways. Right, on log scales: the prediction $\Omega = Mgl/(I_3\omega_3)$ (line) and the measured mean precession rate of full simulations released from rest (dots). They agree for fast spin and part company as you lower the spin, when the wheel dips far below horizontal. Choose *launched with Ω* to start it on the exact steady precession: no nutation at all.`,
      deps: ['mech-2.9', 'mech-10.8'],
      see: ['em-7.20'],
      refs: ['Taylor §10.6'],
      tags: ['gyroscope', 'precession', 'torque'],
      credit: 'Foucault’s gyroscope, 1852',
      scope: String.raw`The formula Ω = Mgl/(I₃ω₃) assumes fast spin, $I_3\omega_3^2 \gg Mgl$, and a frictionless pivot.`,
      viz(v) {
        const g = 9.81, Mw = 1, rw = 0.3, l = 0.5, I3w = 0.5 * Mw * rw * rw, I1w = 0.25 * Mw * rw * rw + Mw * l * l, mgl = Mw * g * l, TS = 12;
        const wS = v.slider('spin $\\omega_3$ (rad/s)', 6, 250, 90, { log: true });
        const mode = v.select('start', [{ value: 'rest', label: 'released from rest' }, { value: 'steady', label: 'launched with Ω' }], 'rest');
        const S = v.stage({ x: [-0.95, 0.95], y: [-0.85, 1.05], equal: true, axes: false, height: 350, title: 'a gyroscope on a post (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -1.0, pitch: 0.3, axes: false, hint: false });
        const sp = v.stage({ x: [5, 300], y: [0.01, 30], xlog: true, ylog: true, axes: 'box', height: 350, xlabel: 'spin ω₃ (rad/s)', title: 'precession rate $\\Omega$ (rad/s)' });
        const sim = (w3, steady) => {
          const W0 = steady ? mgl / (I3w * w3) : 0, n0 = [1, 0, 0];
          const y0 = [...n0, 0, 0, 1, I3w * w3, 0, I1w * W0];
          const dt = Math.min(0.002, 0.15 / ((I3w * w3) / I1w + 5));
          const R = rk4rec(topRHS(I1w, I3w, mgl), y0, TS, Math.ceil(TS / dt), Math.max(1, Math.round(0.01 / dt)), topPost);
          let ph = 0, prev = 0, zmin = 1; const phis = [0];
          for (let i = 1; i < R.y.length; i++) { const a = Math.atan2(R.y[i][1], R.y[i][0]); let d = a - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; ph += d; prev = a; phis.push(ph); zmin = Math.min(zmin, R.y[i][2]); }
          return { R, phis, rate: ph / TS, dip: -Math.asin(clamp(zmin, -1, 1)), E0: topEnergy(I1w, I3w, mgl, R.y[0]), E1: topEnergy(I1w, I3w, mgl, R.y[R.y.length - 1]) };
        };
        const cache = memo(), cacheS = memo(); let cur = null;
        const run = () => cache(wS.value + '|' + mode.value, () => sim(wS.value, mode.value === 'steady'));
        const sweep = () => cacheS(mode.value, () => [8, 12, 18, 27, 40, 60, 90, 135, 200].map((w3) => ({ w3, rate: sim(w3, mode.value === 'steady').rate })));
        v.animate((t) => {
          const B = run(), R = B.R, i = idxAt(R, t % TS), y = R.y[i], n = [y[0], y[1], y[2]], L = [y[6], y[7], y[8]];
          const cw = scl(n, l), e1 = unit(crs([0, 0, 1], n)), e2 = crs(n, e1);
          sc.begin();
          sc.disc([1, 0, 0], [0, 1, 0], 0.7, { fill: 'faint', fillAlpha: 0.18, color: 'faint', grid: true }, [0, 0, -0.8]);
          tube(sc, [0, 0, -0.8], [0, 0, -0.03], 0.025, { color: 'muted' });
          const trail = R.y.slice(Math.max(0, i - 400), i + 1).map((q) => [q[0] * l * 1.25, q[1] * l * 1.25, q[2] * l * 1.25]);
          sc.path(trail, { color: 'gold', width: 1.8 });
          sc.line([0, 0, 0], scl(n, l * 1.25), { color: 'ink', width: 3 });
          sc.disc(e1, e2, rw, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.6 }, cw);
          const sv = t * Math.min(wS.value, 7);
          for (let k = 0; k < 6; k++) { const a = sv + (k * TAU) / 6; sc.line(cw, add(cw, add(scl(e1, rw * Math.cos(a)), scl(e2, rw * Math.sin(a)))), { color: 'accent', width: 1.3 }); }
          sc.dot([0, 0, 0], { r: 4, color: 'ink' });
          const KL = 0.55 / Math.max(nrm(L), 1e-9);
          sc.arrow([0, 0, 0], scl(L, KL), { color: 'purple', width: 2.8 }); sc.tex('\\mathbf L', scl(L, KL * 1.15), { color: 'purple', size: 15 });
          const tq = [-mgl * n[1], mgl * n[0], 0];
          sc.arrow(cw, madd(cw, tq, 0.06), { color: 'orange', width: 2.6 }); sc.tex('\\boldsymbol\\tau', madd(cw, tq, 0.075), { color: 'orange', size: 15 });
          sc.arrow(cw, add(cw, [0, 0, -0.32]), { color: 'ink', width: 1.8, head: 8 }); sc.tex('M\\mathbf g', add(cw, [0, 0, -0.38]), { color: 'ink', size: 13 });
          sc.flush();
          S.corner(`t = ${v.fix(t % TS, 1)} s · axle ${v.fix(Math.asin(clamp(n[2], -1, 1)) / DEG, 1)}° from horizontal`, 'tl');
          // Ω against spin
          const Wp = (w3) => mgl / (I3w * w3);
          sp.fn(Wp, { color: 'accent', width: 2.4 });
          for (const s of sweep()) sp.dot(s.w3, Math.max(s.rate, 1e-3), { r: 4, color: Math.abs(s.rate / Wp(s.w3) - 1) < 0.05 ? 'green' : 'red' });
          sp.vline(wS.value, { color: 'gold', width: 1.2, dash: [4, 4] });
          sp.dot(wS.value, Math.max(B.rate, 1e-3), { r: 6, color: 'gold' });
          cur = { B, Wp: Wp(wS.value) };
        }, { period: TS, still: 7 });
        v.legend([['accent', '$\\Omega = Mgl/(I_3\\omega_3)$'], ['green', 'simulated mean rate (within 5%)', { dot: true }], ['red', 'simulated (off by more)', { dot: true }], ['purple', '$\\mathbf L$'], ['orange', 'torque'], ['gold', 'axle tip / current spin']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, Wp } = cur, w3 = wS.value, dipPred = (2 * mgl * I1w) / (I3w * w3) ** 2;
          const ratio = (I3w * w3 * w3) / mgl;
          return String.raw`$I_3 = ${v.fix(I3w, 4)}$, $I_1 = ${v.fix(I1w, 4)}$ kg·m² (about the pivot), $Mgl = ${v.fix(mgl, 3)}$ N·m · predicted $\Omega = ${v.fix(Wp, 4)}$ rad/s, measured mean rate over ${TS} s: $${v.fix(B.rate, 4)}$ rad/s (${v.fix((100 * (B.rate - Wp)) / Wp, 2)}%) · deepest dip below horizontal ${v.fix(B.dip / DEG, 2)}°` + (mode.value === 'rest' ? String.raw` vs $2MglI_1/(I_3\omega_3)^2 = ${v.fix(Math.min(dipPred, 9) / DEG, 2)}°$` : ' (steady precession: none)') + String.raw` · spin energy / $Mgl$ $= ${v.fix(ratio, 1)}$ · energy drift $${sci(v, Math.abs(B.E1 - B.E0) / Math.abs(B.E0 || 1))}$ (relative)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.11
    {
      num: '10.11',
      kind: 'Theorem',
      name: 'Euler’s equations',
      statement: String.raw`Let $\omega_1, \omega_2, \omega_3$ be the components of a rigid body’s angular velocity along its principal axes, which turn with the body, and $\tau_1, \tau_2, \tau_3$ those of the external torque about the centre of mass (or about a fixed point). Then
$$I_1\dot\omega_1 = (I_2 - I_3)\,\omega_2\omega_3 + \tau_1,\qquad I_2\dot\omega_2 = (I_3 - I_1)\,\omega_3\omega_1 + \tau_2,\qquad I_3\dot\omega_3 = (I_1 - I_2)\,\omega_1\omega_2 + \tau_3 .$$
In vector form, $\mathsf I\dot{\boldsymbol\omega} + \boldsymbol\omega\times\mathsf I\boldsymbol\omega = \boldsymbol\tau$ in body components. Without torque, $|\mathbf L|^2 = \sum I_i^2\omega_i^2$ and $2T = \sum I_i\omega_i^2$ are conserved, and the body’s orientation then follows from $\dot{\mathsf R} = \mathsf R[\boldsymbol\omega]_\times$.`,
      idea: String.raw`In an inertial frame $d\mathbf L/dt = \boldsymbol\tau$ (2.9). The principal axes turn with the body at $\boldsymbol\omega$, so by the rule for derivatives in a rotating frame (9.5), $(d\mathbf L/dt)_{\rm space} = (d\mathbf L/dt)_{\rm body} + \boldsymbol\omega\times\mathbf L$. In the body frame the tensor is constant and diagonal (10.8), so $(d\mathbf L/dt)_{\rm body} = (I_1\dot\omega_1, I_2\dot\omega_2, I_3\dot\omega_3)$. Writing out $\boldsymbol\omega\times\mathbf L$ componentwise gives the three equations. Their right-hand sides are quadratic, which is the source of all the rich behaviour of free rotation (10.12–10.14).`,
      caption: String.raw`A book with moments 1 : 2.3 : 2.9 tumbles. The body-frame components of $\boldsymbol\omega$ are integrated from Euler’s equations (solid curves). Separately, the orientation is integrated in the space frame from $\mathbf L$ and $\boldsymbol\omega = \mathsf R\mathsf I^{-1}\mathsf R^{\mathsf T}\mathbf L$, without Euler’s equations, and its $\boldsymbol\omega$ is converted to body components (dots). They agree to about $10^{-10}$. Without torque, $\mathbf L$ (purple) stays fixed in space while $\boldsymbol\omega$ (blue) wanders. Switch on a thruster fixed to the book or a push fixed in space and watch the components respond, still matched by the space-frame run.`,
      deps: ['mech-10.8', 'mech-9.5', 'mech-2.9'],
      refs: ['Taylor §10.7', 'Goldstein §5.5'],
      tags: ['Euler equations', 'rigid body', 'rotation'],
      credit: 'Euler, 1758 (published 1765)',
      viz(v) {
        const BS = [1.6, 1.0, 0.5], Id = boxI(1, ...BS), TS = 24, N = 12000, EV = 20, TQ = 0.03;
        const start = v.select('initial ω', [{ value: 'gen', label: 'general' }, { value: 'e1', label: 'near e₁' }, { value: 'e2', label: 'near e₂' }, { value: 'e3', label: 'near e₃' }], 'gen');
        const tq = v.select('torque', [{ value: 'none', label: 'none' }, { value: 'body', label: 'thruster on the book (along e₁)' }, { value: 'space', label: 'push fixed in space (along z)' }], 'none');
        const S = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 330, title: 'the book, $\\boldsymbol\\omega$ and $\\mathbf L$ in space (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.3, axis: 1.35, lim: 1.5, hint: false });
        const sw = v.stage({ x: [0, TS], y: [-2, 2], axes: 'box', height: 330, xlabel: 't (s)', title: 'body components $\\omega_1, \\omega_2, \\omega_3$ (rad/s)' });
        const W0 = { gen: [0.9, 0.7, 0.6], e1: [1.5, 0.05, 0.05], e2: [0.03, 1.4, 0.03], e3: [0.05, 0.05, 1.3] };
        const cache = memo(); let cur = null;
        const run = () => cache(start.value + '|' + tq.value, () => {
          const w0 = W0[start.value], tqs = tq.value, L0s = [Id[0] * w0[0], Id[1] * w0[1], Id[2] * w0[2]];
          const torqueB = tqs === 'body' ? () => [TQ, 0, 0] : tqs === 'space' ? (t, y) => mv(mT(qmat(y.slice(0, 4))), [0, 0, TQ]) : null;
          const A = runEuler(Id, w0, TS, N, EV, torqueB);
          // space-frame run: y = [q, Ls]; Ls' = τ_space; ω_s = R I⁻¹ Rᵀ Ls; q' = ½ ω_s ⊗ q
          const fB = (t, y) => {
            const q = y.slice(0, 4), R = qmat(q), Ls = [y[4], y[5], y[6]], Lb = mv(mT(R), Ls), ws = mv(R, [Lb[0] / Id[0], Lb[1] / Id[1], Lb[2] / Id[2]]);
            const dq = qmul([0, ...ws], q), ts = tqs === 'body' ? mv(R, [TQ, 0, 0]) : tqs === 'space' ? [0, 0, TQ] : [0, 0, 0];
            return [dq[0] / 2, dq[1] / 2, dq[2] / 2, dq[3] / 2, ts[0], ts[1], ts[2]];
          };
          const Bq = rk4rec(fB, [1, 0, 0, 0, ...L0s], TS, N, EV, (y) => { const q = qnormalize(y.slice(0, 4)); return [...q, y[4], y[5], y[6]]; });
          const wB = Bq.y.map((y) => { const R = qmat(y.slice(0, 4)), Lb = mv(mT(R), [y[4], y[5], y[6]]); return [Lb[0] / Id[0], Lb[1] / Id[1], Lb[2] / Id[2]]; });
          let gap = 0; A.y.forEach((y, i) => { gap = Math.max(gap, Math.hypot(y[4] - wB[i][0], y[5] - wB[i][1], y[6] - wB[i][2])); });
          const Lsp = A.y.map((y) => mv(qmat(y.slice(0, 4)), [Id[0] * y[4], Id[1] * y[5], Id[2] * y[6]]));
          const Ts = A.y.map((y) => 0.5 * (Id[0] * y[4] ** 2 + Id[1] * y[5] ** 2 + Id[2] * y[6] ** 2));
          const yr = span([A.y.map((y) => y[4]), A.y.map((y) => y[5]), A.y.map((y) => y[6])], 0.08, 0.5);
          return { A, wB, gap, Lsp, Ts, yr };
        });
        v.animate((t) => {
          const B = run(), A = B.A, i = idxAt(A, (t * 2) % TS), y = A.y[i], R = qmat(y.slice(0, 4)), wb = [y[4], y[5], y[6]], ws = mv(R, wb), Ls = B.Lsp[i];
          sc.begin();
          drawBox(sc, R, BS.map((x) => x / 2), { fillAlpha: 0.26 });
          [0, 1, 2].forEach((k) => { const e = [0, 0, 0]; e[k] = 1; sc.line([0, 0, 0], mv(R, scl(e, [1.05, 0.75, 0.5][k])), { color: AXC[k], width: 1.4, alpha: 0.9 }); });
          const tr = A.y.slice(Math.max(0, i - 120), i + 1).map((q) => scl(mv(qmat(q.slice(0, 4)), [q[4], q[5], q[6]]), 0.75));
          sc.path(tr, { color: 'accent', width: 1.2, alpha: 0.5 });
          sc.arrow([0, 0, 0], scl(ws, 0.75), { color: 'accent', width: 3 });
          sc.arrow([0, 0, 0], scl(Ls, 2.6), { color: 'purple', width: 3 });
          sc.tex('\\boldsymbol\\omega', scl(ws, 0.85), { color: 'accent', size: 15 }); sc.tex('\\mathbf L', scl(Ls, 2.85), { color: 'purple', size: 15 });
          if (tq.value !== 'none') { const ts = tq.value === 'body' ? mv(R, [1, 0, 0]) : [0, 0, 1]; sc.arrow([0, 0, 0], scl(ts, 0.6), { color: 'orange', width: 2.4 }); }
          sc.flush();
          sw.setView([0, TS], B.yr);
          sw.hline(0, { color: 'faint' });
          const ts = A.t;
          ['teal', 'gold', 'pink'].forEach((c, k) => {
            series(sw, ts, A.y.map((q) => q[4 + k]), A.y.length, { color: c, width: 2.2 });
            const dots = []; for (let j = 0; j < ts.length; j += 12) dots.push([ts[j], B.wB[j][k]]);
            sw.dots(dots, { r: 2.2, color: 'ink' });
          });
          sw.vline(A.t[i], { color: 'muted', width: 1, dash: [3, 3] });
          cur = { B, i };
        }, { period: TS / 2, still: 5 });
        v.legend([['teal', '$\\omega_1$'], ['gold', '$\\omega_2$'], ['pink', '$\\omega_3$ (Euler’s equations)'], ['ink', 'space-frame integration', { dot: true }], ['purple', '$\\mathbf L$'], ['orange', 'torque']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, A = B.A, y = A.y[i], Lb = [Id[0] * y[4], Id[1] * y[5], Id[2] * y[6]];
          let dev = 0, devT = 0; for (const L of B.Lsp) dev = Math.max(dev, nrm(sub(L, B.Lsp[0]))); for (const T of B.Ts) devT = Math.max(devT, Math.abs(T - B.Ts[0]));
          const head = String.raw`$I = (${Id.map((x) => v.fix(x, 4)).join(',\ ')})$ kg·m² · largest gap between the body-frame and space-frame integrations: $${sci(v, B.gap)}$ rad/s`;
          if (tq.value === 'none') return head + String.raw` · torque-free: $\mathbf L$ in space drifts by $${sci(v, dev)}$, $T$ by $${sci(v, devT)}$ J, while $|\mathbf L| = ${v.fix(nrm(Lb), 5)}$ and the components of $\boldsymbol\omega$ keep changing`;
          const Lend = B.Lsp[B.Lsp.length - 1], dL = sub(Lend, B.Lsp[0]);
          return head + String.raw` · with torque ${TQ} N·m ${tq.value === 'body' ? 'along the book’s $\\mathbf e_1$' : 'along the fixed $z$-axis'}: $\Delta\mathbf L$ over ${TS} s $= (${dL.map((c) => v.fix(c, 3)).join(',\ ')})$${tq.value === 'space' ? String.raw` vs $\boldsymbol\tau\,\Delta t = (0,\ 0,\ ${v.fix(TQ * TS, 3)})$` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.12
    {
      num: '10.12',
      kind: 'Theorem',
      name: 'Intermediate-axis (tennis-racket) theorem',
      statement: String.raw`Let a rigid body have distinct principal moments $I_1 < I_2 < I_3$ and move freely. Steady rotation about the axis of the smallest or of the largest moment is **stable**: a slightly perturbed rotation stays close, with $\boldsymbol\omega$ circling the axis at the frequency
$$\omega\sqrt{\frac{(I_2 - I_1)(I_3 - I_1)}{I_2 I_3}}\ \text{ about }\mathbf e_1, \qquad \omega\sqrt{\frac{(I_3 - I_1)(I_3 - I_2)}{I_1 I_2}}\ \text{ about }\mathbf e_3 .$$
Rotation about the **intermediate** axis $\mathbf e_2$ is **unstable**. Perturbations grow like $e^{\lambda t}$ with
$$\lambda = \omega\sqrt{\frac{(I_2 - I_1)(I_3 - I_2)}{I_1 I_3}},$$
and the body flips over periodically: $\omega_2$ reverses sign over and over while $\mathbf L$ stays fixed in space. On the sphere $|\mathbf L| = $ const in the body frame, the motion follows the curves cut out by the energy ellipsoids. Those around $\pm\mathbf e_1$ and $\pm\mathbf e_3$ are small loops, while the two great circles through $\pm\mathbf e_2$ are separatrices.`,
      idea: String.raw`Linearise Euler’s equations (10.11) about $\boldsymbol\omega = \omega\mathbf e_k$. The two transverse components satisfy $\ddot\omega_i = -\omega^2\frac{(I_k - I_i)(I_k - I_j)}{I_iI_j}\,\omega_i$. The product $(I_k - I_i)(I_k - I_j)$ is positive when $I_k$ is the largest or smallest moment (oscillation) and negative for the middle one (exponential growth). Globally, $L^2 = \sum I_i^2\omega_i^2$ and $2T = \sum I_i\omega_i^2$ are both conserved, so in body coordinates $\mathbf L$ moves on the intersection of a sphere with an ellipsoid (10.9). Near $\pm\mathbf e_1$ and $\pm\mathbf e_3$ the intersections are small closed curves; at the energy $L^2/2I_2$ they become two great circles crossing at $\pm\mathbf e_2$, and a body started near $\mathbf e_2$ is carried along them to $-\mathbf e_2$ and back.`,
      caption: String.raw`A T-handle, like the wing nut that Vladimir Dzhanibekov saw flip on Salyut 7 in 1985, is spun about one principal axis with a small wobble added (transverse components $\varepsilon$ times the spin). Left: the T-handle in space. Middle: $\mathbf L$ seen from the body, on the sphere $|\mathbf L| = $ const, with the polhodes (faint), the two separatrices (red) and the actual path (gold). About $\mathbf e_1$ or $\mathbf e_3$ the path is a small loop; about $\mathbf e_2$ it runs along the separatrix to the opposite side and back, and the handle flips. Bottom: the body components of $\boldsymbol\omega$. Shrink the wobble: the flips come later but never stop.`,
      deps: ['mech-10.11', 'mech-10.9'],
      see: ['aero-10.3'],
      refs: ['Taylor §10.8', 'Tong §3.4'],
      tags: ['stability', 'Dzhanibekov effect', 'free rotation'],
      credit: 'Euler, 1765; Poinsot, 1834; Dzhanibekov, 1985 (observation in orbit)',
      viz(v) {
        // T-handle: a stem along x and a crossbar along y at its end (two boxes)
        const parts = [{ m: 0.55, c: [0.0, 0, 0], s: [1.0, 0.12, 0.12] }, { m: 0.45, c: [0.56, 0, 0], s: [0.12, 1.2, 0.12] }];
        const M = parts.reduce((a, p) => a + p.m, 0), cm = [0, 1, 2].map((j) => parts.reduce((s, p) => s + p.m * p.c[j], 0) / M);
        const Ibox = [0, 0, 0]; for (const p of parts) { const b = boxI(p.m, ...p.s), d = sub(p.c, cm); Ibox[0] += b[0] + p.m * (d[1] ** 2 + d[2] ** 2); Ibox[1] += b[1] + p.m * (d[0] ** 2 + d[2] ** 2); Ibox[2] += b[2] + p.m * (d[0] ** 2 + d[1] ** 2); }
        const order = [0, 1, 2].sort((a, b) => Ibox[a] - Ibox[b]), Id = order.map((k) => Ibox[k]);
        // body axes: principal axis k is the box axis order[k]
        const toP = (p) => order.map((k) => p[k]);
        const axisSel = v.select('spin about', [{ value: '0', label: 'e₁ (smallest I)' }, { value: '1', label: 'e₂ (intermediate)' }, { value: '2', label: 'e₃ (largest I)' }], '1');
        const epsS = v.slider('wobble $\\varepsilon$', 0.0005, 0.2, 0.01, { log: true });
        const W = 6, TS = 16, N = 16000, EV = 10;
        const S = v.stage({ x: [-1.05, 1.05], y: [-1.05, 1.05], equal: true, axes: false, height: 300, title: 'the T-handle in space' });
        const sc = v.scene3(S, { yaw: -0.5, pitch: 0.35, axes: false, hint: false });
        const SP = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 300, title: '$\\mathbf L$ in the body frame (drag to rotate)' });
        const sp = v.scene3(SP, { yaw: -0.75, pitch: 0.4, axes: false, hint: false });
        const st = v.stage({ x: [0, TS], y: [-7, 7], axes: 'box', height: 170, full: true, xlabel: 't (s)', title: 'body components of $\\boldsymbol\\omega$ (rad/s)' });
        const cacheP = memo(), cache = memo(); let cur = null;
        const polhodes = () => cacheP('p', () => {
          const out = [];
          const sepA = Math.atan(Math.sqrt((1 / Id[0] - 1 / Id[1]) / (1 / Id[1] - 1 / Id[2]))) / DEG;   // separatrix angle from e₁ in the e₁e₃-plane
          for (const [k, angs] of [[0, [0.22, 0.45, 0.68, 0.88].map((f) => f * sepA)], [2, [0.3, 0.6, 0.86].map((f) => f * (90 - sepA))]]) for (const a of angs) {
            const d = k === 0 ? [Math.cos(a * DEG), 0, Math.sin(a * DEG)] : [Math.sin(a * DEG), 0, Math.cos(a * DEG)];
            const w0 = [d[0] / Id[0], d[1] / Id[1], d[2] / Id[2]], wn = 3 / nrm(w0), ww = scl(w0, wn);
            const T = freePeriod(Id, dot(ww.map((x, i) => Id[i] * x), ww.map((x, i) => Id[i] * x)), 0.5 * (Id[0] * ww[0] ** 2 + Id[1] * ww[1] ** 2 + Id[2] * ww[2] ** 2));
            const R = runEuler(Id, ww, T * 1.02, 400, 1);
            for (const sg of [1, -1]) out.push(R.y.map((y) => scl(unit([Id[0] * y[4], Id[1] * y[5], Id[2] * y[6]]), sg)));
          }
          return out;
        });
        const run = () => cache(axisSel.value + '|' + epsS.value, () => {
          const k = +axisSel.value, eps = epsS.value, w0 = [eps * W * 0.8, eps * W * 0.6, eps * W * 0.7]; w0[k] = W;
          const R = runEuler(Id, w0, TS, N, EV);
          const Lb = R.y.map((y) => [Id[0] * y[4], Id[1] * y[5], Id[2] * y[6]]);
          const L2 = dot(Lb[0], Lb[0]), E = 0.5 * (Id[0] * w0[0] ** 2 + Id[1] * w0[1] ** 2 + Id[2] * w0[2] ** 2);
          const Tex = freePeriod(Id, L2, E);
          const Tm = meanGap(upCross(R.t, R.y.map((y) => y[5])));   // ω₂ crosses zero once per period in every case
          const [I1, I2, I3v] = Id;
          const lin = k === 0 ? W * Math.sqrt(((I2 - I1) * (I3v - I1)) / (I2 * I3v)) : k === 2 ? W * Math.sqrt(((I3v - I1) * (I3v - I2)) / (I1 * I2)) : NaN;
          const lam = W * Math.sqrt(((I2 - I1) * (I3v - I2)) / (I1 * I3v));
          // measured growth rate: slope of log|ω_perp| while it stays small (spin about e₂)
          let grow = NaN;
          if (k === 1) {
            const xs = [], ys = []; for (let i = 0; i < R.y.length; i++) { const p = Math.hypot(R.y[i][4], R.y[i][6]); if (p > 0.2 * W) break; if (R.t[i] > 0.3) { xs.push(R.t[i]); ys.push(Math.log(p)); } }
            if (xs.length > 5) grow = v.M.linreg(xs, ys).slope;
          }
          const Ls = R.y.map((y, i) => mv(qmat(y.slice(0, 4)), Lb[i]));
          let drift = 0; for (const L of Ls) drift = Math.max(drift, nrm(sub(L, Ls[0])));
          return { R, Lb, Tex, Tm, lin, lam, grow, k, drift, L0: nrm(Lb[0]) };
        });
        v.animate((t) => {
          const B = run(), R = B.R, tt = (t * 1.0) % TS, i = idxAt(R, tt), y = R.y[i], Q = qmat(y.slice(0, 4));
          // the T-handle in space (body coordinates → principal order → space)
          sc.begin();
          for (const p of parts) {
            const c = toP(sub(p.c, cm)), h = toP(p.s.map((x) => x / 2)), Rb = Q;
            drawBox(sc, Rb, h, { center: mv(Rb, c), colors: ['accent', 'accent', 'accent'], fillAlpha: 0.28, color: 'accent', width: 1 });
          }
          const Lsp = mv(Q, B.Lb[i]);
          sc.arrow([0, 0, 0], scl(unit(Lsp), 0.95), { color: 'purple', width: 2.6 }); sc.tex('\\mathbf L', scl(unit(Lsp), 1.04), { color: 'purple', size: 14 });
          [0, 1, 2].forEach((k) => { const e = [0, 0, 0]; e[k] = 0.85; sc.line([0, 0, 0], mv(Q, e), { color: AXC[k], width: 1.6 }); });
          sc.flush();
          // the momentum sphere
          sp.begin();
          sphereFrame(sp, 1, { lat: false });
          for (const P of polhodes()) spherePath(sp, P, { color: 'muted', width: 1.1, alpha: 0.75, backAlpha: 0.15 });
          for (const s2 of separatrices(Id)) spherePath(sp, circlePts([0, 0, 0], s2.a, s2.b, 1, 90), { color: 'red', width: 1.8, alpha: 0.9, backAlpha: 0.25 });
          const path = B.Lb.slice(0, i + 1).map((L) => scl(L, 1 / B.L0));
          spherePath(sp, path, { color: 'gold', width: 2.4, backAlpha: 0.35 });
          sp.dot(scl(B.Lb[i], 1 / B.L0), { r: 5.5, color: 'gold' });
          [0, 1, 2].forEach((k) => { for (const sg of [1, -1]) { const e = [0, 0, 0]; e[k] = sg * 1.12; sp.dot(scl(e, 1 / 1.12), { r: 3.5, color: AXC[k] }); if (sg > 0) sp.tex(`\\mathbf e_${k + 1}`, e, { color: AXC[k], size: 14 }); } });
          sp.flush();
          // ω components
          st.setView([0, TS], [-W * 1.15, W * 1.15]);
          st.hline(0, { color: 'faint' });
          ['teal', 'gold', 'pink'].forEach((c, k) => series(st, R.t, R.y.map((q) => q[4 + k]), i, { color: c, width: 2 }));
          cur = { B };
        }, { period: TS, still: 11 });
        v.legend([['teal', '$\\omega_1$ / $\\mathbf e_1$'], ['gold', '$\\omega_2$ / $\\mathbf e_2$'], ['pink', '$\\omega_3$ / $\\mathbf e_3$'], ['red', 'separatrices'], ['purple', '$\\mathbf L$ (fixed in space)']]);
        v.readout(() => {
          if (!cur) return '';
          const { B } = cur, ax = B.k + 1;
          const head = String.raw`principal moments $I_1 : I_2 : I_3 = 1 : ${v.fix(Id[1] / Id[0], 3)} : ${v.fix(Id[2] / Id[0], 3)}$ · spin ${W} rad/s about $\mathbf e_${ax}$ · exact period of the motion (elliptic integral) ${v.fix(B.Tex, 3)} s, measured ${isFinite(B.Tm) ? v.fix(B.Tm, 3) : '—'} s`;
          const tail = String.raw` · $\mathbf L$ fixed in space to $${sci(v, B.drift / B.L0)}$ (relative)`;
          if (B.k === 1) return head + String.raw` (the handle flips twice per period) · growth rate $\lambda = \omega\sqrt{(I_2-I_1)(I_3-I_2)/I_1I_3} = ${v.fix(B.lam, 3)}$ /s, measured from the early growth of the wobble ${isFinite(B.grow) ? v.fix(B.grow, 3) : '—'} /s` + tail;
          return head + String.raw` · linearised wobble period $2\pi/\Omega = ${v.fix(TAU / B.lin, 3)}$ s: stable, the wobble stays at $\varepsilon$` + tail;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.13
    {
      num: '10.13',
      kind: 'Model',
      name: 'Poinsot’s construction',
      statement: String.raw`The torque-free motion of a rigid body about its centre of mass can be pictured without solving any equations. Attach to the body its **Poinsot ellipsoid** $\mathbf x\cdot\mathsf I\mathbf x = 1$ centred at the centre of mass. Then the ellipsoid **rolls without slipping** on a fixed plane, the **invariable plane**, perpendicular to $\mathbf L$ at the distance $\sqrt{2T}/|\mathbf L|$ from the centre. The point of contact is $\boldsymbol\omega/\sqrt{2T}$, so the instantaneous axis always passes through it. The contact point traces the **polhode** on the ellipsoid, a closed curve, and the **herpolhode** on the plane, which in general never closes.`,
      idea: String.raw`The point $\mathbf x = \boldsymbol\omega/\sqrt{2T}$ lies on the ellipsoid because $\boldsymbol\omega\cdot\mathsf I\boldsymbol\omega = 2T$. The normal there is $\mathsf I\mathbf x \propto \mathbf L$ (10.9), a fixed direction, and the distance of the tangent plane from the centre is $\mathbf x\cdot\hat{\mathbf L} = \boldsymbol\omega\cdot\mathbf L/(\sqrt{2T}|\mathbf L|) = \sqrt{2T}/|\mathbf L|$. That distance is constant because $T$ and $\mathbf L$ are conserved, so the tangent plane is the same plane at every instant. The contact point lies on the instantaneous axis, so its velocity $\boldsymbol\omega\times\mathbf x$ is zero: rolling without slipping. Euler’s equations (10.11) conserve exactly these quantities.`,
      caption: String.raw`The Poinsot ellipsoid of a body with moments $1 : 2 : 3$ rolls on the fixed grey plane below it, perpendicular to $\mathbf L$ (purple). The contact point is where $\boldsymbol\omega$ (blue) pierces the ellipsoid. The green curve on the ellipsoid is the polhode, which turns with the body; the gold curve on the plane is the herpolhode. Choose where $\boldsymbol\omega$ starts: near $\mathbf e_1$ or $\mathbf e_3$ the polhode is a small loop, and near the separatrix it reaches round toward $-\mathbf e_2$. Switch on a small torque to break the hypothesis: $\mathbf L$ turns, the plane is no longer invariable, and the readout shows its distance drifting.`,
      deps: ['mech-10.11', 'mech-10.9'],
      refs: ['Arnold §29', 'Goldstein §5.6'],
      tags: ['Poinsot', 'free rotation', 'geometry'],
      credit: 'Poinsot, 1834',
      viz(v) {
        const Id = [1, 2, 3], TS = 40, N = 16000, EV = 8;
        const start = v.select('ω starts', [{ value: 'a1', label: 'near e₁' }, { value: 'sep', label: 'near the separatrix' }, { value: 'a3', label: 'near e₃' }], 'sep');
        const tqT = v.toggle('apply a small torque', false);
        const S = v.stage({ x: [-1.3, 1.3], y: [-1.1, 1.3], equal: true, axes: false, height: 360, title: 'the ellipsoid rolling on the invariable plane (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.7, pitch: 0.28, axes: false, hint: false });
        const sh = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: false, height: 360, weight: 0.8, minWidth: 240, title: 'the plane seen from above: the herpolhode' });
        const W0 = { a1: [1.6, 0.25, 0.3], sep: [0.9, 0.25, 0.55], a3: [0.25, 0.3, 1.1] };
        const cache = memo(); let cur = null;
        const run = () => cache(start.value + '|' + tqT.value, () => {
          const w0 = W0[start.value], L0 = w0.map((x, i) => Id[i] * x);
          // orient the body so that L points straight down (−z): the plane is then a floor
          const Ld = unit(L0), axis = crs(Ld, [0, 0, -1]), sa = nrm(axis), ca = dot(Ld, [0, 0, -1]);
          const q0 = sa < 1e-9 ? [1, 0, 0, 0] : (() => { const a = Math.atan2(sa, ca), n = scl(axis, 1 / sa); return [Math.cos(a / 2), ...scl(n, Math.sin(a / 2))]; })();
          const torque = tqT.value ? (t, y) => mv(mT(qmat(y.slice(0, 4))), [0.06, 0.03, 0]) : null;
          const R = runEuler(Id, w0, TS, N, EV, torque, q0);
          const rec = R.y.map((y) => {
            const Q = qmat(y.slice(0, 4)), w = [y[4], y[5], y[6]], T2 = Id[0] * w[0] ** 2 + Id[1] * w[1] ** 2 + Id[2] * w[2] ** 2, Lb = w.map((x, i) => Id[i] * x);
            const xb = scl(w, 1 / Math.sqrt(T2)), xs = mv(Q, xb), Ls = mv(Q, Lb);
            return { Q, w, xb, xs, Ls, h: dot(xs, unit(Ls)), T2 };
          });
          return { rec, h0: rec[0].h };
        });
        v.animate((t) => {
          const B = run(), rec = B.rec, i = Math.min(rec.length - 1, Math.round((t % TS) / (TS / (rec.length - 1)))), r = rec[i], Q = r.Q;
          const ax = Id.map((x) => 1 / Math.sqrt(x)), zc = -B.h0;
          sc.begin();
          // the invariable plane (initial position)
          const pc = [0, 0, zc];
          sc.disc([1, 0, 0], [0, 1, 0], 1.45, { fill: 'faint', fillAlpha: 0.22, color: 'muted', grid: true }, pc);
          // herpolhode
          sc.path(rec.slice(0, i + 1).map((q) => q.xs), { color: 'gold', width: 1.8 });
          // ellipsoid (body frame → space)
          ellipsoidWire(sc, Q, ax, { color: 'accent', alpha: 0.35, lat: 8, lon: 12 });
          // polhode, drawn on the body
          const pol = rec.slice(0, Math.min(rec.length, i + 1)).map((q) => mv(Q, q.xb));
          sc.path(pol, { color: 'green', width: 2 });
          [0, 1, 2].forEach((k) => { const e = [0, 0, 0]; e[k] = ax[k]; sc.line(mv(Q, scl(e, -1)), mv(Q, e), { color: AXC[k], width: 1.3, alpha: 0.8 }); });
          sc.arrow([0, 0, 0], scl(r.xs, 1.25), { color: 'accent', width: 2.8 });
          sc.arrow([0, 0, 0], scl(unit(r.Ls), 0.6), { color: 'purple', width: 2.8 });
          sc.tex('\\mathbf L', scl(unit(r.Ls), 0.72), { color: 'purple', size: 15, dx: 10 });
          sc.tex('\\boldsymbol\\omega', scl(r.xs, 1.38), { color: 'accent', size: 15 });
          sc.dot(r.xs, { r: 5.5, color: 'gold' });
          sc.flush();
          // top view of the plane
          let R0 = 0.2; for (const q of rec) R0 = Math.max(R0, Math.hypot(q.xs[0], q.xs[1]));
          sh.setView([-1.15 * R0, 1.15 * R0], [-1.15 * R0, 1.15 * R0]);
          sh.circle(0, 0, R0, { color: 'faint', width: 1, dash: [3, 4] });
          sh.path(rec.map((q) => [q.xs[0], q.xs[1]]), { color: 'gold', width: 1, alpha: 0.3 });
          sh.path(rec.slice(0, i + 1).map((q) => [q.xs[0], q.xs[1]]), { color: 'gold', width: 1.8 });
          sh.dot(r.xs[0], r.xs[1], { r: 5, color: 'gold' }); sh.dot(0, 0, { r: 3.5, color: 'purple', label: 'foot of L', labelPos: 's', math: false });
          cur = { B, r, i };
        }, { period: TS, still: 22 });
        v.legend([['accent', 'ellipsoid $\\mathbf x\\cdot\\mathsf I\\mathbf x = 1$ and $\\boldsymbol\\omega$'], ['green', 'polhode (on the body)'], ['gold', 'herpolhode (on the plane)'], ['purple', '$\\mathbf L$']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, r } = cur, Ib = r.xb.map((x, k) => Id[k] * x);
          let hmin = Infinity, hmax = -Infinity, amax = 0; for (const q of B.rec) { hmin = Math.min(hmin, q.h); hmax = Math.max(hmax, q.h); amax = Math.max(amax, angle(q.Ls, B.rec[0].Ls)); }
          const onE = dot(r.xb, Ib), i0 = Math.max(1, Math.min(B.rec.length - 2, cur.i)), dt = TS / (B.rec.length - 1);
          // velocity of the material point now at the contact: (Q(t+dt) − Q(t−dt)) x_b / 2dt
          const vel = scl(sub(mv(B.rec[i0 + 1].Q, B.rec[i0].xb), mv(B.rec[i0 - 1].Q, B.rec[i0].xb)), 1 / (2 * dt)), vref = nrm(B.rec[i0].w) * nrm(B.rec[i0].xb);
          const head = String.raw`contact point $\mathbf x = \boldsymbol\omega/\sqrt{2T}$: $\mathbf x\cdot\mathsf I\mathbf x = ${v.fix(onE, 10)}$ (on the ellipsoid) · angle between the normal $\mathsf R\,\mathsf I\mathbf x$ and the initial $\mathbf L$: ${num(v, angle(mv(r.Q, Ib), B.rec[0].Ls) / DEG, 3)}° · speed of the material point at the contact (finite difference) $${sci(v, nrm(vel))}$, against $|\boldsymbol\omega||\mathbf x| = ${v.fix(vref, 3)}$ for a point as far out at right angles: rolling without slipping`;
          if (!tqT.value) return head + String.raw` · distance of the tangent plane $\sqrt{2T}/|\mathbf L|$: from ${v.fix(hmin, 8)} to ${v.fix(hmax, 8)} over ${TS} s — the plane is invariable`;
          return head + String.raw` · with the torque, $\mathbf L$ turns by up to ${v.fix(amax / DEG, 1)}° and the plane’s distance ranges from ${v.fix(hmin, 4)} to ${v.fix(hmax, 4)}: no invariable plane`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.14
    {
      num: '10.14',
      kind: 'Model',
      name: 'Free symmetric top and the Chandler wobble',
      statement: String.raw`For a free body with an axis of symmetry ($I_1 = I_2$), Euler’s equations give $\omega_3 = $ const, and the transverse part of $\boldsymbol\omega$ turns about the symmetry axis $\mathbf e_3$, as seen from the body, at the rate
$$\Omega_b = \frac{I_3 - I_1}{I_1}\,\omega_3 ,$$
in the sense of the spin for an oblate body ($I_3 > I_1$) and against it for a prolate one. In space, $\mathbf e_3$ and $\boldsymbol\omega$ precess together about the fixed $\mathbf L$ at the rate $|\mathbf L|/I_1$. The cone traced by $\boldsymbol\omega$ in the body (body cone, around $\mathbf e_3$) rolls without slipping on the cone it traces in space (space cone, around $\mathbf L$). **Earth** is slightly oblate, with dynamical flattening $H = (C - A)/C = 0.0032738$. Euler (1765) predicted that, if it were rigid, its rotation pole would wander around the figure axis with period $A/(C - A) = 304.5$ sidereal days, about 304 solar days (often quoted as ten months, or 305 days). Chandler (1891) found the wobble in latitude records, with a period near 427 days; the modern value is about **433 days**. The difference is due to Earth not being rigid. Its elastic mantle partly re-forms the equatorial bulge around the instantaneous axis, and the oceans and the fluid core also respond, all of which weakens the restoring torque.`,
      idea: String.raw`With $I_1 = I_2$, the third Euler equation (10.11) gives $\dot\omega_3 = 0$, and the first two become $\dot\omega_1 = -\Omega_b\omega_2$, $\dot\omega_2 = \Omega_b\omega_1$, uniform rotation of $(\omega_1, \omega_2)$. In space $\mathbf L = I_1\boldsymbol\omega + (I_3 - I_1)\omega_3\mathbf e_3$, so $\mathbf L$, $\boldsymbol\omega$ and $\mathbf e_3$ are coplanar, and $\dot{\mathbf e}_3 = \boldsymbol\omega\times\mathbf e_3 = (\mathbf L/I_1)\times\mathbf e_3$, a precession about $\mathbf L$. For Earth, $\omega_3$ is one turn per sidereal day and $(C - A)/A = H/(1 - H)$. A simple model of elastic yielding replaces $C - A$ by $(C - A)(1 - k/k_s)$, where $k$ is the effective Love number and $k_s \approx 0.94$ is its fluid limit. The observed 433 days needs $k/k_s \approx 0.30$, the same order as the elastic Love number measured from tides.`,
      caption: String.raw`**Symmetric top:** choose the shape (oblate disc to prolate cigar) and the initial tilt of $\boldsymbol\omega$ from the symmetry axis. Left: the body with its body cone (pink, carried by the body) rolling on the space cone (purple, fixed around $\mathbf L$); $\boldsymbol\omega$ lies along their line of contact. Right: $(\omega_1, \omega_2)$ as seen from the body, circling at the measured rate. **Earth:** the right panel becomes the path of the rotation pole across the ground over 7 years, the sum of the free Chandler wobble and a yearly wobble driven by the seasons (typical sizes 0.15″ and 0.09″; 1″ is about 31 m at the pole). The elastic yielding starts at the value that gives the observed 433 days, with its 6.4-year beat between the two wobbles; slide it to zero for Euler’s rigid Earth, whose 304-day wobble would beat every 4.9 years.`,
      deps: ['mech-10.11'],
      refs: ['Taylor §10.8', 'Tong §3.4'],
      tags: ['symmetric top', 'Chandler wobble', 'Earth rotation'],
      credit: 'Euler, 1765 (prediction); Chandler, 1891 (discovery); Newcomb, 1891 (elasticity)',
      scope: String.raw`The rigid-body result holds for a free rigid body; for Earth it gives the Euler period only, and the elastic correction is a one-parameter model that lumps together the mantle, oceans and core.`,
      viz(v) {
        const H = 3.2737949e-3, SID = 0.99726957, TE = (1 - H) / H, TEsol = TE * SID;
        const mode = v.select('body', [{ value: 'top', label: 'symmetric top' }, { value: 'earth', label: 'Earth' }], 'top');
        const rS = v.slider('shape $I_3/I_1$ (<1 prolate, >1 oblate)', 0.3, 1.9, 1.5, { step: 0.01 });
        const aS = v.slider('tilt of $\\boldsymbol\\omega$ from $\\mathbf e_3$ (°)', 2, 40, 18, { step: 0.5 });
        const kS = v.slider('elastic yielding $k/k_s$', 0, 0.4, 0.299, { step: 0.001 });
        const S = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 340, title: ' ' });
        const sc = v.scene3(S, { yaw: -0.6, pitch: 0.25, axes: false, hint: false });
        const sb = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 340, title: ' ' });
        const sT = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', height: 150, full: true, xlabel: 't', title: ' ' });
        const cache = memo(); let cur = null;
        const runTop = () => cache([rS.value, aS.value].join('|'), () => {
          const ratio = rS.value, rc = 0.55, hc = Math.max(0.05, Math.sqrt(Math.max(0, 3 * rc * rc * (2 / ratio - 1)))), I3v = 0.5 * rc * rc, I1v = I3v / ratio;
          const al = aS.value * DEG, wm = 2.2, w0 = [wm * Math.sin(al), 0, wm * Math.cos(al)], Id = [I1v, I1v, I3v];
          const Ob = ((I3v - I1v) / I1v) * w0[2], Tb = TAU / Math.abs(Ob), TSim = clamp(2.5 * Tb, 8, 60);
          const n = Math.ceil(TSim / 0.002), R = runEuler(Id, w0, TSim, n, Math.max(1, Math.round(n / 3000)));
          const ph = R.y.map((y) => Math.atan2(y[5], y[4])); let un = [ph[0]]; for (let i = 1; i < ph.length; i++) { let d = ph[i] - ph[i - 1]; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; un.push(un[i - 1] + d); }
          const ObM = v.M.linreg(R.t, un).slope;
          const L0 = [I1v * w0[0], 0, I3v * w0[2]], Ls = R.y.map((y) => mv(qmat(y.slice(0, 4)), [I1v * y[4], I1v * y[5], I3v * y[6]]));
          // space precession of e3 about L: angle of the component of e3 perpendicular to L
          const Lh = unit(L0), a = perp(Lh), b = crs(Lh, a);
          const ps = R.y.map((y) => { const e3 = mv(qmat(y.slice(0, 4)), [0, 0, 1]); return Math.atan2(dot(e3, b), dot(e3, a)); });
          let us = [ps[0]]; for (let i = 1; i < ps.length; i++) { let d = ps[i] - ps[i - 1]; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; us.push(us[i - 1] + d); }
          const OsM = v.M.linreg(R.t, us).slope;
          return { R, Id, ratio, rc, hc, w0, Ob, ObM, Os: nrm(L0) / I1v, OsM, Lh, TSim };
        });
        v.animate((t) => {
          const earth = mode.value === 'earth';
          rS.el.hidden = earth; aS.el.hidden = earth; kS.el.hidden = !earth;
          if (!earth) {
            S.setTitle('body cone rolling on the space cone (drag to rotate)'); sb.setTitle('$(\\omega_1, \\omega_2)$ seen from the body'); sT.setTitle('$\\omega_1$ (rad/s) against $t$ (s)');
            const B = runTop(), R = B.R, i = idxAt(R, t % B.TSim), y = R.y[i], Q = qmat(y.slice(0, 4)), wb = [y[4], y[5], y[6]], ws = mv(Q, wb), e3 = mv(Q, [0, 0, 1]);
            const sz = 0.6 / Math.max(B.rc, B.hc / 2);
            sc.begin();
            // body: a cylinder of radius rc, height hc (scaled)
            const a1 = mv(Q, [1, 0, 0]), a2 = mv(Q, [0, 1, 0]), hh = (B.hc / 2) * sz, rr = B.rc * sz;
            for (const sg of [-1, 1]) sc.disc(a1, a2, rr, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 1.2 }, scl(e3, sg * hh));
            for (let k = 0; k < 16; k++) { const ang = (TAU * k) / 16, p = add(scl(a1, rr * Math.cos(ang)), scl(a2, rr * Math.sin(ang))); sc.line(madd(p, e3, -hh), madd(p, e3, hh), { color: 'accent', width: 0.8, alpha: k % 4 ? 0.3 : 0.8 }); }
            // cones
            const Lh = B.Lh, wh = unit(ws), CL = 1.35;
            const ab = angle(wb, [0, 0, 1]), as = angle(ws, Lh);
            const bodyCone = circlePts(scl(e3, CL * Math.cos(ab)), a1, a2, CL * Math.sin(ab), 48);
            const la = perp(Lh), lb = crs(Lh, la), spaceCone = circlePts(scl(Lh, CL * Math.cos(as)), la, lb, CL * Math.sin(as), 48);
            sc.path(bodyCone, { color: 'pink', width: 1.6 }); sc.path(spaceCone, { color: 'purple', width: 1.6 });
            for (let k = 0; k < 48; k += 6) { sc.line([0, 0, 0], bodyCone[k], { color: 'pink', width: 0.7, alpha: 0.6 }); sc.line([0, 0, 0], spaceCone[k], { color: 'purple', width: 0.7, alpha: 0.6 }); }
            sc.line(scl(e3, -1.3), scl(e3, 1.5), { color: 'pink', width: 1.4, dash: [5, 4] });
            sc.arrow([0, 0, 0], scl(wh, CL), { color: 'accent', width: 3 }); sc.arrow([0, 0, 0], scl(Lh, 1.05), { color: 'purple', width: 3 });
            sc.tex('\\boldsymbol\\omega', scl(wh, CL + 0.12), { color: 'accent', size: 15 }); sc.tex('\\mathbf L', scl(Lh, 1.17), { color: 'purple', size: 15 }); sc.tex('\\mathbf e_3', scl(e3, 1.62), { color: 'pink', size: 15 });
            sc.flush();
            // body-frame view of (ω1, ω2)
            const wp = Math.hypot(B.w0[0], B.w0[1]) * 1.25;
            sb.setView([-wp, wp], [-wp, wp]);
            sb.circle(0, 0, Math.hypot(B.w0[0], B.w0[1]), { color: 'faint', width: 1, dash: [3, 4] });
            series(sb, R.y.map((q) => q[4]), R.y.map((q) => q[5]), i, { color: 'accent', width: 1.6 });
            sb.arrow(0, 0, y[4], y[5], { color: 'accent', width: 2.6 }); sb.dot(0, 0, { r: 4, color: 'pink', label: 'e₃', labelPos: 'se' });
            sb.corner(B.ratio > 1 ? 'oblate: turns with the spin' : B.ratio < 1 ? 'prolate: turns against the spin' : 'sphere: no wobble', 'tl');
            sT.setView([0, B.TSim], [-wp, wp]); sT.hline(0, { color: 'faint' });
            series(sT, R.t, R.y.map((q) => q[4]), R.y.length, { color: 'accent', width: 1.6, alpha: 0.4 });
            series(sT, R.t, R.y.map((q) => q[4]), i, { color: 'accent', width: 2.2 });
            v.legend([['accent', '$\\boldsymbol\\omega$'], ['purple', '$\\mathbf L$ and the space cone'], ['pink', 'symmetry axis $\\mathbf e_3$ and the body cone']]);
            cur = { earth, B };
            return;
          }
          // Earth
          S.setTitle('Earth-fixed view: the rotation axis circles the figure axis'); sb.setTitle('path of the rotation pole over 7 years (m)'); sT.setTitle('pole displacement $x$ (m) against time (years)');
          const Tc = TEsol / (1 - kS.value), AC = 0.15, AA = 0.09, ARC = 30.87, YRS = 7, days = (t * 120) % (YRS * 365.25);
          const pole = (d) => [ARC * (AC * Math.cos((TAU * d) / Tc) + AA * Math.cos((TAU * d) / 365.25 + 0.7)), ARC * (AC * Math.sin((TAU * d) / Tc) + AA * Math.sin((TAU * d) / 365.25 + 0.7))];
          v.legend([['accent', 'rotation axis $\\boldsymbol\\omega$ (Earth-fixed view)'], ['pink', 'figure axis'], ['gold', 'pole now', { dot: true }]]);
          sc.begin();
          const fl = 0.06;   // flattening exaggerated ×20
          ellipsoidWire(sc, I3(), [0.85, 0.85, 0.85 * (1 - fl)], { color: 'teal', alpha: 0.35, lat: 9, lon: 12 });
          const wob = (TAU * days) / Tc, tilt = 0.12;
          const wdir = [Math.sin(tilt) * Math.cos(wob), Math.sin(tilt) * Math.sin(wob), Math.cos(tilt)];
          sc.line([0, 0, -1.15], [0, 0, 1.25], { color: 'pink', width: 1.6, dash: [5, 4] });
          const cone = []; for (let k = 0; k <= 60; k++) { const a = (TAU * k) / 60; cone.push([1.15 * Math.sin(tilt) * Math.cos(a), 1.15 * Math.sin(tilt) * Math.sin(a), 1.15 * Math.cos(tilt)]); }
          sc.path(cone, { color: 'accent', width: 1.2, alpha: 0.6 });
          sc.arrow([0, 0, 0], scl(wdir, 1.15), { color: 'accent', width: 3 });
          sc.tex('\\boldsymbol\\omega', scl(wdir, 1.27), { color: 'accent', size: 15, dx: -12 }); sc.tex('\\text{figure axis}', [0, 0, 1.25], { color: 'pink', size: 12, align: 'left', dx: 8 });
          sc.flush();
          S.corner('wobble angle exaggerated ~10⁵ times', 'bl', { size: 11 });
          // pole path
          const lim = ARC * (AC + AA) * 1.2;
          sb.setView([-lim, lim], [-lim, lim]);
          for (const rr of [2, 4, 6, 8]) if (rr < lim) { sb.circle(0, 0, rr, { color: 'faint', width: 0.8 }); sb.text(`${rr} m`, rr * 0.71, -rr * 0.71, { color: 'muted', size: 10, dx: 3, dy: 6 }); }
          sb.line(-lim, 0, lim, 0, { color: 'faint', width: 0.8 }); sb.line(0, -lim, 0, lim, { color: 'faint', width: 0.8 });
          const pts = []; for (let d = 0; d <= days; d += 3) pts.push(pole(d));
          sb.path(pts, { color: 'accent', width: 1.6 });
          const pnow = pole(days); sb.dot(pnow[0], pnow[1], { r: 5, color: 'gold' });
          sb.corner(`year ${v.fix(days / 365.25, 2)}`, 'tl');
          sT.setView([0, YRS], [-lim, lim]); sT.hline(0, { color: 'faint' });
          sT.fn((yr) => pole(yr * 365.25)[0], { domain: [0, YRS], color: 'accent', width: 1.2, alpha: 0.35, n: 900 });
          sT.fn((yr) => pole(yr * 365.25)[0], { domain: [0, days / 365.25], color: 'accent', width: 2, n: 900 });
          const beat = 1 / Math.abs(1 / 365.25 - 1 / Tc);
          cur = { earth, Tc, beat };
        }, { period: 1e6, still: 6 });
        v.readout(() => {
          if (!cur) return '';
          if (cur.earth) {
            const { Tc, beat } = cur;
            return String.raw`$H = (C - A)/C = ${H}$ · rigid Earth (Euler): $A/(C-A) = (1-H)/H = ${v.fix(TE, 1)}$ sidereal days $= ${v.fix(TEsol, 1)}$ solar days · with elastic yielding $k/k_s = ${v.fix(kS.value, 3)}$: $T = ${v.fix(Tc, 1)}$ days (observed Chandler period ≈ 433 days, reached at $k/k_s = ${v.fix(1 - TEsol / 433, 3)}$) · beat with the annual wobble every $1/|1/365.25 - 1/T| = ${v.fix(beat / 365.25, 2)}$ years`;
          }
          const B = cur.B;
          return String.raw`$I_3/I_1 = ${v.fix(B.ratio, 3)}$, $\omega_3 = ${v.fix(B.w0[2], 4)}$ rad/s · body frame: measured turning rate of $(\omega_1,\omega_2)$ $${v.fix(B.ObM, 4)}$ rad/s vs $(I_3 - I_1)\omega_3/I_1 = ${v.fix(B.Ob, 4)}$ · space frame: $\mathbf e_3$ precesses about $\mathbf L$ at ${v.fix(B.OsM, 4)} rad/s vs $|\mathbf L|/I_1 = ${v.fix(B.Os, 4)}$ · largest change of $\omega_3$: $${sci(v, Math.max(...B.R.y.map((q) => Math.abs(q[6] - B.w0[2]))))}$ (exactly constant when $I_1 = I_2$)`;
        });
      },
    },
  ],
};
