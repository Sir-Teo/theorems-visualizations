// Classical Mechanics — Chapter 12: Hamiltonian mechanics (part b: 12.10–12.17)

import { TAU, DEG, clamp, memo, sci, num, rk4, wrap, pendH, pendInfo, pendStep, shoelace, perimeter, makeLoop, drawCyl, piTicks, rightAngle, arrowPx, series } from './ch12.shared.js';

/** A cat’s head (Arnold’s favourite phase-space blob): outline, eyes and nose, centred at the origin, size ≈ 1. */
function catParts() {
  const out = [];
  const ear = (s) => [[s * 0.18, 0.42], [s * 0.42, 0.95], [s * 0.62, 0.3]];
  const head = (t) => { const a = TAU * t; return [0.62 * Math.cos(a), 0.5 * Math.sin(a) - 0.02]; };
  // outline: head ellipse with two ears spliced in, counter-clockwise from the right
  for (let k = 0; k <= 200; k++) {
    const t = k / 200, a = TAU * t;
    if (a > 0.6 && a < 1.25) { if (!out.r) { out.r = 1; out.push(...ear(1).slice().reverse()); } continue; }
    if (a > 1.89 && a < 2.54) { if (!out.l) { out.l = 1; out.push(...ear(-1)); } continue; }
    out.push(head(t));
  }
  const circ = (cx, cy, r, n = 24) => Array.from({ length: n }, (_, k) => [cx + r * Math.cos((TAU * k) / n), cy + r * Math.sin((TAU * k) / n)]);
  return { outline: densify(out, 0.02), eyes: [circ(-0.23, 0.08, 0.09), circ(0.23, 0.08, 0.09)], nose: [[-0.07, -0.12], [0.07, -0.12], [0, -0.21]], mouth: [[-0.18, -0.3], [-0.09, -0.27], [0, -0.21], [0.09, -0.27], [0.18, -0.3]] };
}
/** Insert points so that consecutive points of a closed polygon are at most h apart. */
function densify(pts, h) {
  const out = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / h)); for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); }
  return out;
}
/** Jacobian determinant of a planar map by central differences. */
function jdet(F, q, p, h = 1e-5) {
  const a = F(q + h, p), b = F(q - h, p), c = F(q, p + h), d = F(q, p - h);
  return { det: ((a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0])) / (4 * h * h), Qq: (a[0] - b[0]) / (2 * h), Pq: (a[1] - b[1]) / (2 * h), Qp: (c[0] - d[0]) / (2 * h), Pp: (c[1] - d[1]) / (2 * h) };
}
/** Draw the image of a (q, p) grid under F on stage s, cells shaded by log det(DF) (neutral = area preserved). */
function drawGridImage(v, s, F, xr, yr, n, st = {}) {
  const dx = (xr[1] - xr[0]) / n, dy = (yr[1] - yr[0]) / n, sub = 6;
  let worst = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const q0 = xr[0] + i * dx, p0 = yr[0] + j * dy, poly = [];
    for (let k = 0; k < sub; k++) poly.push(F(q0 + (dx * k) / sub, p0));
    for (let k = 0; k < sub; k++) poly.push(F(q0 + dx, p0 + (dy * k) / sub));
    for (let k = 0; k < sub; k++) poly.push(F(q0 + dx - (dx * k) / sub, p0 + dy));
    for (let k = 0; k < sub; k++) poly.push(F(q0, p0 + dy - (dy * k) / sub));
    if (poly.some((z) => !isFinite(z[0]) || !isFinite(z[1]))) continue;
    const ratio = shoelace(poly) / (dx * dy), l = Math.log(Math.abs(ratio));
    worst = Math.max(worst, Math.abs(ratio - 1));
    const c = clamp(l / Math.log(3), -1, 1), col = Math.abs(c) < 0.004 ? null : c > 0 ? 'red' : 'blue';
    s.poly(poly, { fill: col || ((i + j) % 2 ? 'teal' : 'faint'), fillAlpha: col ? 0.12 + 0.45 * Math.abs(c) : 0.13, color: 'muted', width: 0.6, alpha: 0.55 });
  }
  return worst;
}

export default {
  collection: 'mech',
  chapter: 12,
  items: [
    // ───────────────────────────────────────────────────────────── 12.10
    {
      num: '12.10',
      kind: 'Definition',
      name: 'Canonical transformations',
      statement: String.raw`A change of phase-space coordinates $(q, p) \mapsto (Q, P)$ is **canonical** if it preserves the Poisson brackets of the coordinates,
$$\{Q_i, Q_j\} = 0, \qquad \{P_i, P_j\} = 0, \qquad \{Q_i, P_j\} = \delta_{ij},$$
equivalently if its Jacobian matrix $M$ satisfies $M^{\mathsf T}JM = J$ with $J = \begin{pmatrix}0 & I\\ -I & 0\end{pmatrix}$ (it is **symplectic**). Then every bracket is preserved, and Hamilton’s equations keep their form: $\dot Q = \partial K/\partial P$, $\dot P = -\partial K/\partial Q$ with $K(Q, P) = H(q, p)$ (plus $\partial F/\partial t$ if the transformation depends on time). In one degree of freedom, canonical means exactly $\{Q, P\} = \det M = 1$: the map preserves area and orientation. Examples are point transformations $Q = f(q)$, $P = p/f'(q)$, rotations of the $(q, p)$ plane, the squeeze $Q = \lambda q$, $P = p/\lambda$, and the time-$t$ map of any Hamiltonian flow.`,
      idea: String.raw`For a time-independent change of variables, the chain rule gives $\dot Q = \{Q, H\}$ and $\dot P = \{P, H\}$, while the inverse-function theorem gives $\partial K/\partial P = \{Q, H\}/\{Q, P\}$ and $-\partial K/\partial Q = \{P, H\}/\{Q,P\}$. So the true velocity in the new variables and the vector field that $K$ would predict differ exactly by the factor $\{Q,P\}$, which is the Jacobian determinant: the equations survive precisely when it equals 1. Area preservation is the same determinant read as the change-of-variables factor.`,
      caption: String.raw`Left: the $(q, p)$ plane, a checkerboard of cells and Arnold’s cat. Right: their images under the chosen map, with each cell tinted by how its area changed (red grown, blue shrunk, untinted preserved) and the cat’s area measured from its outline. The canonical maps (rotation, kick, pendulum flow, squeeze) distort the cat, sometimes wildly, but keep every area. The non-canonical ones do not, and then the dynamics breaks too. At the handle’s image, the green arrow is the true velocity of the oscillator $H = (q^2+p^2)/2$ seen in the new variables, and the dashed orange arrow is what Hamilton’s equations with $K(Q,P) = H$ predict. They agree only when $\{Q, P\} = 1$.`,
      deps: ['mech-12.7'],
      refs: ['Goldstein §9.1', 'Tong §4.4'],
      tags: ['canonical transformation', 'symplectic map', 'area preservation'],
      viz(v) {
        const MAPS = {
          rot: { lab: 'rotation', can: true, F: (q, p, m) => { const a = 1.4 * m, c = Math.cos(a), s = Math.sin(a); return [c * q + s * p, -s * q + c * p]; } },
          kick: { lab: 'kick $P = p + \\mu\\sin 2q$', can: true, F: (q, p, m) => [q, p + 1.1 * m * Math.sin(2 * q)] },
          pend: { lab: 'pendulum flow', can: true, F: (q, p, m) => { const y = [q, p], n = Math.round(120 * m); for (let k = 0; k < n; k++) pendStep(y, 0.025); return y; } },
          sq: { lab: 'squeeze', can: true, F: (q, p, m) => [Math.exp(0.7 * m) * q, Math.exp(-0.7 * m) * p] },
          sc: { lab: 'scale (not canonical)', can: false, F: (q, p, m) => [(1 + 0.4 * m) * q, (1 + 0.4 * m) * p] },
          tw: { lab: '$P = pe^{\\mu q}$ (not canonical)', can: false, F: (q, p, m) => [q, p * Math.exp(0.7 * m * q)] },
        };
        const mapS = v.select('map', Object.entries(MAPS).map(([value, M]) => ({ value, label: M.lab })), 'pend');
        const mS = v.slider('strength $\\mu$', 0, 1, 0.7, { step: 0.01 });
        const R0 = 2, R1 = 2.6;
        const sA = v.stage({ x: [-R0, R0], y: [-R0, R0], equal: true, axes: 'box', gutter: true, height: 360, xlabel: 'q', ylabel: 'p', title: 'before: $(q, p)$' });
        const sB = v.stage({ x: [-R1, R1], y: [-R1, R1], equal: true, axes: 'box', gutter: true, height: 360, xlabel: 'Q', ylabel: 'P', title: 'after: $(Q, P)$' });
        const pr = sA.handle(0.9, -0.9, { color: 'gold', r: 7 });
        const C = catParts(), CX = 0.2, CY = 0.35, CS = 1.15, place = (z) => [CX + CS * z[0], CY + CS * z[1]];
        const A0 = shoelace(C.outline.map(place));
        let cur = null;
        v.render(() => {
          const M = MAPS[mapS.value], m = mS.value, F = (q, p) => M.F(q, p, m);
          // before
          drawGridImage(v, sA, (q, p) => [q, p], [-1.6, 1.6], [-1.6, 1.6], 8);
          const cat = (s, G, col) => {
            s.poly(C.outline.map(place).map((z) => G(...z)), { fill: col, fillAlpha: 0.35, color: col, width: 2 });
            for (const e of C.eyes) s.poly(e.map(place).map((z) => G(...z)), { fill: 'ink', fillAlpha: 0.8, color: 'ink', width: 1 });
            s.poly(C.nose.map(place).map((z) => G(...z)), { fill: 'pink', fillAlpha: 0.9, color: 'pink', width: 1 });
            s.path(densify(C.mouth, 0.03).slice(0, -1).map(place).map((z) => G(...z)), { color: 'ink', width: 1.4 });
          };
          cat(sA, (q, p) => [q, p], 'orange');
          // after
          const worst = drawGridImage(v, sB, F, [-1.6, 1.6], [-1.6, 1.6], 8);
          cat(sB, F, 'orange');
          const A1 = shoelace(C.outline.map(place).map((z) => F(...z)));
          // dynamics at the probe: true velocity vs the field that K = H∘F⁻¹ generates
          const q = pr.x, p = pr.y, J = jdet(F, q, p), Q = F(q, p);
          const Qdot = J.Qq * p + J.Qp * -q, Pdot = J.Pq * p + J.Pp * -q; // {Q,H}, {P,H} for H = (q²+p²)/2
          const XK = [Qdot / J.det, Pdot / J.det];
          sA.circle(0, 0, Math.hypot(q, p), { color: 'gold', width: 1, dash: [3, 4], alpha: 0.8 });
          arrowPx(sA, q, p, [p, -q], 40, { color: 'green' });
          sB.dot(Q[0], Q[1], { r: 5.5, color: 'gold' });
          const sc = 40 / Math.max(1e-9, Math.hypot(Qdot * sB.sx, Pdot * sB.sy)) ;
          const [ex, ey] = sB.inv(sB.X(Q[0]) + Qdot * sB.sx * sc, sB.Y(Q[1]) - Pdot * sB.sy * sc);
          sB.arrow(Q[0], Q[1], ex, ey, { color: 'green', width: 2.6, head: 9 });
          const [kx, ky] = sB.inv(sB.X(Q[0]) + XK[0] * sB.sx * sc, sB.Y(Q[1]) - XK[1] * sB.sy * sc);
          sB.arrow(Q[0], Q[1], kx, ky, { color: 'orange', width: 2, head: 9, dash: [5, 3] });
          sB.corner(M.can ? 'canonical' : 'not canonical', 'tr', { color: M.can ? 'green' : 'red', plate: true, weight: 600 });
          cur = { A1, worst, J, M, Qdot, Pdot, XK };
        });
        v.legend([['orange', 'the cat (area measured from its outline)'], ['red', 'cell area grew', { area: true }], ['blue', 'cell area shrank', { area: true }], ['green', 'true velocity of the oscillator'], ['orange', 'velocity predicted by $K = H$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { A1, worst, J } = cur;
          return String.raw`cat’s area: before ${v.fix(A0, 4)}, after ${v.fix(A1, 4)} (ratio ${v.fix(A1 / A0, 4)}) · largest change of a cell’s area: ${v.fix(100 * worst, 2)}% · at the handle $\{Q, P\} = ${v.fix(J.det, 5)}$ · true $(\dot Q, \dot P) = (${v.fix(cur.Qdot, 3)}, ${v.fix(cur.Pdot, 3)})$, predicted $(\partial K/\partial P, -\partial K/\partial Q) = (${v.fix(cur.XK[0], 3)}, ${v.fix(cur.XK[1], 3)})$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.11
    {
      num: '12.11',
      kind: 'Theorem',
      name: 'Generating functions',
      statement: String.raw`Let $F_2(q, P, t)$ be a smooth function with $\det\big(\partial^2F_2/\partial q_i\partial P_j\big) \ne 0$. Then the equations
$$p_i = \frac{\partial F_2}{\partial q_i}(q, P, t), \qquad Q_i = \frac{\partial F_2}{\partial P_i}(q, P, t)$$
define, locally, a canonical transformation $(q, p) \mapsto (Q, P)$: solve the first set for $P$ (possible by the inverse function theorem, pma-9.24), then read off $Q$. The new Hamiltonian is $K = H + \partial F_2/\partial t$. Similarly $F_1(q, Q, t)$ with $p = \partial F_1/\partial q$, $P = -\partial F_1/\partial Q$ generates one (and so do the types $F_3$, $F_4$), and conversely every canonical transformation near the identity has a generating function. Examples: $F_2 = q\cdot P$ is the identity; $F_2 = f(q)\cdot P$ is a point transformation; $F_1 = \tfrac12 m\omega q^2\cot Q$ turns the oscillator $H = p^2/2m + \tfrac12m\omega^2q^2$ into $K = \omega P$, with $P$ its action and $Q$ its angle.`,
      idea: String.raw`A transformation is canonical when $p\,dq - P\,dQ$ is an exact differential (up to $K - H$ times $dt$). Then the two forms of Hamilton’s principle, in old and new variables, differ only by a total derivative, which does not change the motion (6.16). Writing that differential as $dF_1$ gives the $F_1$ relations; a Legendre transform in $Q$, $F_2 = F_1 + P\cdot Q$, gives the $F_2$ relations. The non-degeneracy of the mixed second derivatives is exactly what lets the implicit equation $p = \partial F_2/\partial q$ be solved for $P$.`,
      caption: String.raw`Choose a generating function, or type your own $F_2(q, P)$. For each point the implicit equation $p = \partial F_2/\partial q$ is solved for $P$ by Newton’s method, and then $Q = \partial F_2/\partial P$. Left: the new coordinate lines, levels of $Q$ (purple) and $P$ (green), drawn in the old plane. Right: the image of the old grid, with cells tinted where the area changed; for every generating function they stay untinted. The gold point runs around an oscillator orbit. Pick the oscillator’s $F_1$ and the circle becomes a horizontal line run at constant speed: the angle grows uniformly and the action stays fixed. Type an $F_2$ with $\partial^2F_2/\partial q\,\partial P = 0$ somewhere and watch the solver fail there (red).`,
      deps: ['mech-12.10', 'pma-9.24', 'mech-6.16'],
      refs: ['Goldstein §9.1', 'Arnold §48'],
      tags: ['generating function', 'canonical transformation'],
      viz(v) {
        const PRE = { id: 'q P', shear: 'q P + 0.3 q^3', imp: 'q P + 0.25 q^2 P^2', sq: 'exp(0.5) q P' };
        const kind = v.select('generating function', [{ value: 'id', label: '$qP$' }, { value: 'shear', label: '$qP + 0.3q^3$' }, { value: 'imp', label: '$qP + \\tfrac14 q^2P^2$' }, { value: 'sq', label: '$e^{1/2}qP$' }, { value: 'osc', label: 'oscillator $F_1 = \\tfrac12q^2\\cot Q$' }, { value: 'own', label: 'type your own' }], 'imp', { onChange: (k) => { if (PRE[k]) fI.set(PRE[k]); fI.el.hidden = k !== 'own'; } });
        const fI = v.input('$F_2(q, P) =$', PRE.imp, { vars: ['q', 'P'] });
        fI.el.hidden = true;
        const sA = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, axes: 'box', gutter: true, height: 360, xlabel: 'q', ylabel: 'p', title: 'new coordinate lines in the old plane' });
        const sB = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], axes: 'box', gutter: true, height: 360, xlabel: 'Q', ylabel: 'P', title: 'image of the old grid' });
        const F2 = (q, P) => (fI.fn ? fI.fn(q, P) : NaN);
        const d1 = (f, a, b, h = 1e-4) => (f(a + h, b) - f(a - h, b)) / (2 * h), d2 = (f, a, b, h = 1e-4) => (f(a, b + h) - f(a, b - h)) / (2 * h);
        const solve = (q, p) => {
          if (kind.value === 'osc') { const Q = Math.atan2(q, p), P = 0.5 * (q * q + p * p); return [Q, P, 0, Math.abs(p - q / Math.tan(Q)) < 1e-9 || Math.abs(Math.sin(Q)) < 1e-12 ? 0 : Math.abs(p - q / Math.tan(Q))]; }
          let P = p, it = 0;
          for (; it < 40; it++) { const g = d1(F2, q, P) - p, gp = (d1(F2, q, P + 1e-4) - d1(F2, q, P - 1e-4)) / 2e-4; if (!(Math.abs(gp) > 1e-6)) return [NaN, NaN, it, NaN]; const dP = g / gp; P -= clamp(dP, -1, 1); if (Math.abs(dP) < 1e-12) break; }
          const res = Math.abs(d1(F2, q, P) - p);
          return res > 1e-7 ? [NaN, NaN, it, res] : [d2(F2, q, P), P, it, res];
        };
        const Fmap = (q, p) => { const r = solve(q, p); return [r[0], r[1]]; };
        let cur = null;
        v.animate((tt) => {
          const osc = kind.value === 'osc';
          if (osc) sB.setView([-Math.PI, Math.PI], [-0.1, 2.2]); else sB.setView([-2.2, 2.2], [-2.2, 2.2]);
          sB.setTicks(osc ? piTicks(-Math.PI, Math.PI) : null, null);
          sB.setLabels(osc ? 'Q (angle)' : 'Q', osc ? 'P (action)' : 'P');
          // left: levels of Q and P, failures in red
          sA.raster((q, p) => (isFinite(solve(q, p)[0]) ? null : v.rgb('red').slice(0, 3).concat([60])), { key: kind.value + '|' + fI.value, res: 5 });
          const lq = osc ? piTicks(-Math.PI, Math.PI, 0.25).map((t) => t[0]) : [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
          sA.contour((q, p) => solve(q, p)[0], lq, { color: 'purple', width: 1.4, alpha: 0.85, res: 90 });
          sA.contour((q, p) => solve(q, p)[1], osc ? [0.1, 0.3, 0.6, 1, 1.5] : [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2], { color: 'green', width: 1.4, alpha: 0.85, res: 90 });
          // right: image of the old grid
          const worst = drawGridImage(v, sB, Fmap, osc ? [-1.5, 1.5] : [-1.4, 1.4], osc ? [-1.5, 1.5] : [-1.4, 1.4], 10);
          // the oscillator orbit
          const a = 0.6 * tt, r0 = 1.1, q = r0 * Math.sin(a), p = r0 * Math.cos(a);
          sA.circle(0, 0, r0, { color: 'gold', width: 1.4, dash: [4, 4] });
          sA.dot(q, p, { r: 6, color: 'gold' });
          const orb = []; for (let k = 0; k <= 200; k++) { const b = (TAU * k) / 200, z = Fmap(r0 * Math.sin(b), r0 * Math.cos(b)); orb.push(isFinite(z[0]) ? z : null); }
          const br = []; for (let k = 0; k < orb.length; k++) { if (k && orb[k] && orb[k - 1] && Math.abs(orb[k][0] - orb[k - 1][0]) > 2) br.push(null); br.push(orb[k]); }
          sB.path(br, { color: 'gold', width: 2.2 });
          const Z = solve(q, p);
          if (isFinite(Z[0])) sB.dot(Z[0], Z[1], { r: 6, color: 'gold' });
          const J = jdet(Fmap, q, p);
          cur = { worst, Z, J, osc };
        }, { period: TAU / 0.6, still: 4 });
        v.legend([['purple', 'levels of $Q$'], ['green', 'levels of $P$'], ['gold', 'an oscillator orbit'], ['red', 'implicit equation not solvable', { area: true }]]);
        v.readout(() => {
          if (!fI.fn) return 'type a valid formula in $q$ and $P$';
          if (!cur) return '';
          const { worst, Z, J, osc } = cur;
          const pt = isFinite(Z[0]) ? String.raw`at the gold point: $Q = ${v.fix(Z[0], 4)}$, $P = ${v.fix(Z[1], 4)}$, residual $|p - \partial F/\partial q| = $ $${sci(v, Z[3])}$ after ${Z[2]} Newton steps, $\{Q, P\} = ${v.fix(J.det, 5)}$` : 'at the gold point the implicit equation has no solution';
          return pt + String.raw` · largest change of a cell’s area: ${v.fix(100 * worst, 3)}%` + (osc ? String.raw` · along the orbit $P = J = ${v.fix(0.5 * 1.21, 4)}$ stays fixed and $Q$ advances at the rate $\omega = 1$` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.12
    {
      num: '12.12',
      kind: 'Theorem',
      name: 'Conserved quantities generate symmetries',
      statement: String.raw`Let $G(q, p)$ be a function on phase space and $\varphi^G_s$ the flow of its Hamiltonian vector field, $dq/ds = \partial G/\partial p$, $dp/ds = -\partial G/\partial q$ (a one-parameter family of canonical transformations). Then
$$\frac{d}{dt}G\big(\text{motion}\big) = \{G, H\} = -\frac{d}{ds}H\big(\varphi^G_s\big).$$
Hence $G$ is conserved if and only if $H$ is invariant under the flow of $G$. In that case $\varphi^G_s$ maps solutions to solutions, since the two flows commute. This is the Hamiltonian form of Noether’s theorem (7.3), and it runs both ways: momentum $p_x$ generates translations, angular momentum $L_z$ rotations, $H$ itself time translation, and less obvious conserved quantities (the energy of one oscillator of a separable pair, the Runge–Lenz vector of 12.9) generate less obvious symmetries.`,
      idea: String.raw`The rate of change of any function along the flow of a Hamiltonian is its bracket with that Hamiltonian (12.7): $dG/dt = \{G, H\}$ along the motion, and $dH/ds = \{H, G\}$ along the flow of $G$. Antisymmetry of the bracket ties the two together. When $\{G,H\} = 0$ everywhere, the Jacobi identity (12.8) shows that the vector fields of $G$ and $H$ commute, so transforming the initial condition by $\varphi^G_s$ and then evolving gives the same as evolving and then transforming.`,
      caption: String.raw`A particle moves in the plane (blue: its trajectory, over equipotentials). Pick a generator $G$ and slide $s$: the orange dashed curve is the blue trajectory carried by the flow of $G$, and the green curve is the true motion that starts from the transformed initial state. When $G$ is conserved they coincide: the flow of $G$ is a symmetry. When it is not, they separate. Right: $H$ along the flow of $G$ (orange) and $G$ along the motion (blue); the two are flat together or not at all. Try $L_z$ with an isotropic and then an anisotropic oscillator, and the $x$-energy $H_x$, which is conserved in both.`,
      deps: ['mech-12.10', 'mech-7.3'],
      refs: ['Tong §4.4', 'Goldstein §9.6'],
      tags: ['symmetry', 'Noether’s theorem', 'Poisson bracket'],
      viz(v) {
        const POT = {
          iso: { lab: 'isotropic oscillator', V: (x, y) => 0.5 * (x * x + y * y) },
          ani: { lab: 'anisotropic ($\\omega_y = 1.5\\,\\omega_x$)', V: (x, y) => 0.5 * (x * x + 2.25 * y * y) },
          quart: { lab: 'central quartic', V: (x, y) => 0.25 * (x * x + y * y) ** 2 + 0.2 * (x * x + y * y) },
          grav: { lab: 'uniform gravity', V: (x, y) => 0.8 * y },
        };
        const GEN = {
          Lz: { lab: '$L_z$ (rotation)', G: (y) => y[0] * y[3] - y[1] * y[2] },
          px: { lab: '$p_x$ (translation)', G: (y) => y[2] },
          Hx: { lab: '$H_x = \\tfrac12(p_x^2 + x^2)$', G: (y) => 0.5 * (y[2] * y[2] + y[0] * y[0]) },
        };
        const potS = v.select('potential', Object.entries(POT).map(([value, P]) => ({ value, label: P.lab })), 'iso');
        const genS = v.select('generator $G$', Object.entries(GEN).map(([value, P]) => ({ value, label: P.lab })), 'Lz');
        const sS = v.slider('flow parameter $s$ of $G$', -1.5, 1.5, 0.9, { step: 0.01 });
        const sC = v.stage({ x: [-2, 2], y: [-1.6, 1.8], equal: true, axes: 'box', gutter: true, height: 360, xlabel: 'x', ylabel: 'y' });
        const sR = v.stage({ x: [-1.5, 1.5], y: [-1, 1], axes: 'box', gutter: true, height: 360, xlabel: 's  (flow of G)   ·   t/5  (motion)', title: 'change of $H$ along the flow of $G$, and of $G$ along the motion' });
        const grad = (f, y) => { const g = [], h = 1e-5; for (let k = 0; k < 4; k++) { const a = y.slice(), b = y.slice(); a[k] += h; b[k] -= h; g.push((f(a) - f(b)) / (2 * h)); } return g; };
        const hamV = (f) => (t, y) => { const g = grad(f, y); return [g[2], g[3], -g[0], -g[1]]; };
        const flow = (f, y0, T, n) => { const out = [y0.slice()]; let y = y0.slice(); const h = T / n; for (let k = 0; k < n; k++) { y = rk4(hamV(f), 0, y, h); out.push(y); } return out; };
        const cache = memo(); let cur = null;
        v.render(() => {
          const P = POT[potS.value], G = GEN[genS.value].G, s = sS.value;
          const H = (y) => 0.5 * (y[2] * y[2] + y[3] * y[3]) + P.V(y[0], y[1]);
          const D = cache([potS.value, genS.value, s].join('|'), () => {
            const y0 = potS.value === 'grav' ? [-0.6, -0.8, 0.5, 1.2] : [0.9, 0.2, 0.15, 0.75], TT = 10, n = 500;
            const traj = flow(H, y0, TT, n);
            const moved = traj.filter((_, k) => k % 4 === 0).map((y) => flow(G, y, s, Math.max(4, Math.round(Math.abs(s) * 60))).pop());
            const y1 = flow(G, y0, s, Math.max(4, Math.round(Math.abs(s) * 60))).pop();
            const traj2 = flow(H, y1, TT, n);
            let defect = 0; moved.forEach((z, k) => { defect = Math.max(defect, Math.hypot(z[0] - traj2[4 * k][0], z[1] - traj2[4 * k][1])); });
            const Hs = []; for (let k = -30; k <= 30; k++) { const z = flow(G, y0, (1.5 * k) / 30, Math.max(2, Math.abs(k) * 2)).pop(); Hs.push([(1.5 * k) / 30, H(z) - H(y0)]); }
            const Gt = traj.map((y, k) => [(k / n) * TT / 5 - 1, G(y) - G(y0)]).map((z) => [z[0] + 0, z[1]]);
            const gH = grad(H, y0), gG = grad(G, y0), br = gG[0] * gH[2] + gG[1] * gH[3] - gG[2] * gH[0] - gG[3] * gH[1];
            return { traj, moved, traj2, defect, Hs, Gt, br, y0, y1 };
          });
          sC.contour((x, y) => P.V(x, y), [0.1, 0.3, 0.6, 1, 1.5, 2.1, 2.8].map((e) => (potS.value === 'grav' ? e - 1.2 : e)), { color: 'muted', alpha: 0.35, width: 1, res: 90 });
          sC.path(D.traj.map((y) => [y[0], y[1]]), { color: 'blue', width: 1.8 });
          sC.path(D.traj2.map((y) => [y[0], y[1]]), { color: 'green', width: 4, alpha: 0.45 });
          sC.path(D.moved.map((y) => [y[0], y[1]]), { color: 'orange', width: 1.8, dash: [6, 4] });
          sC.dot(D.y0[0], D.y0[1], { r: 5, color: 'blue', label: 'start', labelPos: 'sw' });
          sC.dot(D.y1[0], D.y1[1], { r: 5, color: 'green', label: 'transformed start', labelPos: 'ne' });
          // right panel
          let a = 0.05; for (const z of D.Hs) a = Math.max(a, Math.abs(z[1])); for (const z of D.Gt) a = Math.max(a, Math.abs(z[1]));
          sR.setView([-1.5, 1.5], [-1.15 * a, 1.15 * a]);
          sR.hline(0, { color: 'faint', width: 1 });
          sR.path(D.Hs, { color: 'orange', width: 2.4 });
          sR.path(D.Gt.filter((z) => z[0] <= 1.5), { color: 'blue', width: 2.4 });
          sR.vline(s, { color: 'gold', dash: [4, 4] });
          cur = D;
        });
        v.legend([['blue', 'trajectory / $G$ along it'], ['orange', 'trajectory carried by the flow of $G$ / $H$ along that flow', { dash: true }], ['green', 'true motion from the transformed start']]);
        v.readout(() => {
          if (!cur) return '';
          const D = cur, cons = Math.abs(D.br) < 1e-6 && D.defect < 1e-3;
          return String.raw`$\{G, H\}$ at the start: $${num(v, D.br, 5)}$ · largest distance between the carried trajectory and the true one: $${sci(v, D.defect)}$ · ` + (cons ? '**symmetry**: $G$ is conserved and its flow maps motions to motions' : '**no symmetry**: $G$ changes along the motion, $H$ changes along the flow of $G$, and the carried curve is not a motion');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.13
    {
      num: '12.13',
      kind: 'Theorem',
      name: 'Liouville’s theorem',
      statement: String.raw`The flow $\varphi_t$ of Hamilton’s equations preserves phase-space volume: for every measurable region $D$ of phase space and every $t$,
$$\operatorname{vol}\big(\varphi_t(D)\big) = \operatorname{vol}(D).$$
More generally, a flow $\dot x = f(x)$ changes volumes at the rate $\frac{d}{dt}\operatorname{vol}(\varphi_t D) = \int_{\varphi_t D}\nabla\!\cdot f\,dV$, and for a Hamiltonian vector field $\nabla\!\cdot X_H = \sum_i(\partial^2H/\partial q_i\partial p_i - \partial^2H/\partial p_i\partial q_i) = 0$. The theorem fails for dissipative systems: with linear friction $\dot p = -\partial H/\partial q - \gamma p$, the divergence is $-n\gamma$ and volumes shrink like $e^{-n\gamma t}$. Liouville’s theorem is the foundation of equilibrium statistical mechanics and of Poincaré recurrence (13.1).`,
      idea: String.raw`By the change-of-variables formula (pma-10.9), $\operatorname{vol}(\varphi_tD) = \int_D\det D\varphi_t\,dV$. Differentiating, $\frac{d}{dt}\det D\varphi_t = (\nabla\!\cdot f)\det D\varphi_t$; equivalently, by the divergence theorem (pma-10.51), the rate of change of volume is the flux of $f$ through the boundary. For a Hamiltonian field the divergence vanishes because mixed partial derivatives commute, so the determinant stays 1. Shapes are not preserved: nearby trajectories with different periods shear the region into ever longer, thinner filaments of unchanged area.`,
      caption: String.raw`A disc of 2,500 pendulum states (gold) flows in the phase plane, here a cylinder, since $q$ is an angle. Its boundary (blue) is a loop of states integrated with a symplectic leapfrog and refined adaptively: whenever two neighbours drift apart, a new boundary state is started from the initial circle, so the polygon tracks the exact image of the disc. Points near the separatrix lag behind and the disc winds into a filament. Right: its area, measured from the polygon, stays at 1 while its perimeter grows. Drag the centre, change the radius, or turn on friction: then the area decays exactly as $e^{-\gamma t}$.`,
      deps: ['mech-12.3', 'pma-10.9', 'pma-10.51'],
      refs: ['Taylor §13.7', 'Arnold §16'],
      tags: ['Liouville’s theorem', 'phase-space volume'],
      credit: 'Liouville, 1838',
      viz(v) {
        const rS = v.slider('radius of the disc', 0.15, 0.6, 0.38, { step: 0.01, onChange: () => v.restart() });
        const gS = v.slider('friction $\\gamma$', 0, 0.3, 0, { step: 0.005, onChange: () => v.restart() });
        const TT = 36, DT = 0.02, NP = 2500;
        const sP = v.stage({ x: [-Math.PI, Math.PI], y: [-2.8, 2.8], axes: 'box', gutter: true, height: 380, weight: 1.5, xlabel: 'q', ylabel: 'p', xticks: piTicks(-Math.PI, Math.PI) });
        const sA = v.stage({ x: [0, TT], y: [0.02, 60], ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, xlabel: 't', title: 'area and perimeter ÷ initial (log scale)' });
        const hc = sP.handle(-1.2, 0.9, { color: 'ink', r: 7, constrain: (x, y) => [clamp(x, -2.8, 2.8), clamp(y, -2.2, 2.2)] });
        hc.onDrag = () => v.restart();
        const sim = v.sim(() => {
          const R = rS.value, g = gS.value, cx = hc.x, cy = hc.y, r = v.rng(11), q = new Float64Array(NP), p = new Float64Array(NP);
          for (let k = 0; k < NP; k++) { const a = TAU * r(), rr = R * Math.sqrt(r()); q[k] = cx + rr * Math.cos(a); p[k] = cy + rr * Math.sin(a); }
          const L = makeLoop({ init: (s) => [cx + R * Math.cos(TAU * s), cy + R * Math.sin(TAU * s)], step: (y, h) => pendStep(y, h, g), h: DT, n0: 200, tol: 0.045, maxPts: 9000 });
          const A0 = shoelace(L.Y), P0 = perimeter(L.Y);
          return { q, p, L, g, A0: Math.PI * R * R, Apoly0: A0, P0, hist: [[0, A0 / (Math.PI * R * R), 1]], n: 0 };
        }, (st, dt) => {
          const y = [0, 0];
          for (let k = 0; k < NP; k++) { y[0] = st.q[k]; y[1] = st.p[k]; pendStep(y, dt, st.g); st.q[k] = y[0]; st.p[k] = y[1]; }
          st.L.advance(); st.n++;
          if (st.n % 5 === 0) { st.L.refine(600); st.hist.push([st.n * dt, shoelace(st.L.Y) / st.A0, perimeter(st.L.Y) / st.P0]); }
        }, { dt: DT });
        let cur = null;
        v.animate((tt) => {
          const st = sim.advance(Math.min(3 * tt, TT)), t = st.n * DT;
          drawCyl(sP, st.L.Y, { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 1.3 });
          sP.contour(pendH, [1], { color: 'red', width: 1.2, alpha: 0.6, res: 140 });
          const pts = []; for (let k = 0; k < NP; k++) pts.push([wrap(st.q[k]), st.p[k]]);
          sP.dots(pts, { r: 1.2, color: 'gold', alpha: 0.85 });
          sP.corner(`t = ${v.fix(t, 1)}`, 'tr', { color: 'ink', plate: true });
          // area and perimeter
          sA.hline(1, { color: 'faint', width: 1 });
          if (st.g > 0) sA.fn((x) => Math.exp(-st.g * x), { color: 'red', width: 1.4, dash: [5, 4] });
          sA.path(st.hist.map((h) => [h[0], h[2]]), { color: 'purple', width: 2 });
          sA.path(st.hist.map((h) => [h[0], h[1]]), { color: 'accent', width: 2.6 });
          sA.vline(t, { color: 'gold' });
          cur = { st, t };
        }, { period: TT / 3 + 1.5, still: 9 });
        v.legend([['gold', 'sample states'], ['accent', 'boundary polygon / its area'], ['purple', 'perimeter'], ['red', 'separatrix; $e^{-\\gamma t}$ prediction', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { st, t } = cur, A = shoelace(st.L.Y);
          const pred = st.A0 * Math.exp(-st.g * t);
          return String.raw`area of the disc $\pi r^2 = ${v.fix(st.A0, 5)}$ (initial polygon ${v.fix(st.Apoly0, 5)}) · now: ${v.fix(A, 5)}` + (st.g > 0 ? String.raw`, predicted $\pi r^2 e^{-\gamma t} = ${v.fix(pred, 5)}$` : ` (ratio ${v.fix(A / st.A0, 5)})`) + ` · perimeter ×${v.fix(perimeter(st.L.Y) / st.P0, 1)} · boundary states: ${st.L.S.length}` + (st.L.capped ? ' (refinement capped)' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.14
    {
      num: '12.14',
      kind: 'Theorem',
      name: 'Poincaré’s integral invariant',
      statement: String.raw`Let $\gamma$ be a closed curve in phase space and $\gamma_t = \varphi_t(\gamma)$ its image under the Hamiltonian flow. Then
$$\oint_{\gamma_t} p\cdot dq = \oint_\gamma p\cdot dq = \sum_{i=1}^n \oint_\gamma p_i\,dq_i .$$
By Stokes’ theorem (pma-10.33) this says the sum of the oriented areas of the projections of any surface spanning $\gamma$ onto the planes $(q_i, p_i)$ is invariant: the flow preserves the symplectic form $\sum dp_i\wedge dq_i$. The individual projected areas are not invariant and can trade back and forth. Liouville’s theorem (12.13) is the top exterior power of this statement. More generally $\oint(p\cdot dq - H\,dt)$ is the same around any two loops that encircle the same tube of trajectories in extended phase space (the Poincaré–Cartan invariant).`,
      idea: String.raw`Parametrise the loop by $s$ and differentiate $I(t) = \oint p\cdot\partial_s q\,ds$ in $t$. Using $\dot q = H_p$ and $\dot p = -H_q$, the integrand changes by $-H_q\cdot\partial_s q + p\cdot\partial_s H_p$. Integrating the second term by parts gives $-\partial_s p\cdot H_p$, and $-(H_q\cdot\partial_s q + H_p\cdot\partial_s p) = -\partial_s H$ is a total $s$-derivative, which integrates to zero around a closed loop. Friction adds $-\gamma p\cdot\partial_s q$, which does not integrate to zero: the invariant decays like $e^{-\gamma t}$.`,
      caption: String.raw`Two coupled anharmonic oscillators. A loop of initial states lies at first entirely in the $(q_1, p_1)$ plane, a circle, so its shadow on the $(q_2, p_2)$ plane is a single point. The flow carries every state, with adaptive refinement as in 12.13. The two shadows (left and middle) twist and swell; the shading shows their oriented areas. Right: area 1, area 2 and their sum $\oint p\cdot dq$, measured from the polygons. The individual areas trade back and forth while the sum stays flat. Raise the coupling or the anharmonicity, or turn on friction, which breaks the invariant.`,
      deps: ['mech-12.13', 'pma-10.33'],
      refs: ['Arnold §44'],
      tags: ['integral invariant', 'symplectic form'],
      credit: 'Poincaré, 1890; Cartan, 1922',
      viz(v) {
        const kS = v.slider('coupling $\\kappa$', 0, 0.5, 0.25, { step: 0.01, onChange: () => v.restart() });
        const bS = v.slider('anharmonicity $\\beta$', 0, 0.6, 0.3, { step: 0.01, onChange: () => v.restart() });
        const fT = v.toggle('friction (break it)', false, { onChange: () => v.restart() });
        const TT = 40, DT = 0.02;
        const sA = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: 'box', gutter: true, height: 300, xlabel: 'q₁', ylabel: 'p₁', title: 'shadow on $(q_1, p_1)$' });
        const sB = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: 'box', gutter: true, height: 300, xlabel: 'q₂', ylabel: 'p₂', title: 'shadow on $(q_2, p_2)$' });
        const sT = v.stage({ x: [0, TT], y: [-0.4, 1.3], axes: 'box', gutter: true, height: 190, full: true, xlabel: 't', title: 'oriented areas $\\oint p_1\\,dq_1$, $\\oint p_2\\,dq_2$ and their sum' });
        const sim = v.sim(() => {
          const k = kS.value, b = bS.value, g = fT.value ? 0.06 : 0;
          const acc = (y) => [-(y[0] + k * y[2] + b * y[0] ** 3), -(y[2] + k * y[0] + b * y[2] ** 3)];
          const step = (y, h) => { // leapfrog on (q1, p1, q2, p2), friction split exactly around it
            if (g) { y[1] *= Math.exp(-g * h / 2); y[3] *= Math.exp(-g * h / 2); }
            let a = acc(y); y[1] += 0.5 * h * a[0]; y[3] += 0.5 * h * a[1]; y[0] += h * y[1]; y[2] += h * y[3]; a = acc(y); y[1] += 0.5 * h * a[0]; y[3] += 0.5 * h * a[1];
            if (g) { y[1] *= Math.exp(-g * h / 2); y[3] *= Math.exp(-g * h / 2); }
          };
          const L = makeLoop({ init: (s) => [0.9 + 0.55 * Math.cos(TAU * s), 0.55 * Math.sin(TAU * s), 0, 0], step, h: DT, n0: 160, tol: 0.05, maxPts: 6000, dist: (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2], a[3] - c[3]) });
          const area = () => [-shoelace(L.Y, 0, 1), -shoelace(L.Y, 2, 3)]; // ∮p dq = −(shoelace in (q, p))
          const a0 = area();
          return { L, area, I0: a0[0] + a0[1], hist: [[0, ...a0]], n: 0, g };
        }, (st, dt) => { st.L.advance(); st.n++; if (st.n % 5 === 0) { st.L.refine(400); st.hist.push([st.n * dt, ...st.area()]); } }, { dt: DT });
        let cur = null;
        v.animate((tt) => {
          const st = sim.advance(Math.min(3 * tt, TT)), t = st.n * DT, A = st.area();
          const sh = (s, i, j, a) => { s.poly(st.L.Y.map((y) => [y[i], y[j]]), { fill: a >= 0 ? 'blue' : 'red', fillAlpha: 0.2, color: a >= 0 ? 'blue' : 'red', width: 1.6 }); s.corner(`∮p dq = ${v.fix(a, 4)}`, 'tr', { color: 'ink', plate: true }); };
          sh(sA, 0, 1, A[0]); sh(sB, 2, 3, A[1]);
          const I0 = st.I0;
          sT.setView([0, TT], [-0.25 * I0, 1.3 * I0]);
          sT.hline(0, { color: 'faint', width: 1 });
          sT.path(st.hist.map((h) => [h[0], h[1]]), { color: 'blue', width: 2 });
          sT.path(st.hist.map((h) => [h[0], h[2]]), { color: 'orange', width: 2 });
          sT.path(st.hist.map((h) => [h[0], h[1] + h[2]]), { color: 'green', width: 3 });
          if (st.g) sT.fn((x) => I0 * Math.exp(-st.g * x), { color: 'red', dash: [5, 4], width: 1.3 });
          sT.vline(t, { color: 'gold' });
          cur = { st, A, t };
        }, { period: TT / 3 + 1.5, still: 8 });
        v.legend([['blue', '$\\oint p_1\\,dq_1$'], ['orange', '$\\oint p_2\\,dq_2$'], ['green', 'sum $\\oint p\\cdot dq$'], ['red', 'friction prediction $e^{-\\gamma t}$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { st, A, t } = cur, S = A[0] + A[1];
          return String.raw`$\oint p_1dq_1 = ${v.fix(A[0], 4)}$, $\oint p_2dq_2 = ${v.fix(A[1], 4)}$, sum ${v.fix(S, 5)} (initial $\pi r^2 = ${v.fix(st.I0, 5)}$)` + (st.g ? String.raw`, friction predicts ${v.fix(st.I0 * Math.exp(-st.g * t), 5)}` : String.raw`, relative change $${sci(v, Math.abs(S / st.I0 - 1))}$`) + ` · loop states: ${st.L.S.length}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.15
    {
      num: '12.15',
      kind: 'Method',
      name: 'Symplectic integrators',
      statement: String.raw`A one-step method $y_{n+1} = \Phi_h(y_n)$ for Hamilton’s equations is **symplectic** if each step $\Phi_h$ is a canonical transformation (12.10). The **leapfrog** (Störmer–Verlet) method for $H = p^2/2m + U(q)$,
$$p_{n+1/2} = p_n - \tfrac h2\nabla U(q_n),\quad q_{n+1} = q_n + \tfrac hm\,p_{n+1/2},\quad p_{n+1} = p_{n+1/2} - \tfrac h2\nabla U(q_{n+1}),$$
is symplectic, time-reversible and second order. It is the composition of the exact flows of $p^2/2m$ and $U$. Symplectic methods preserve phase-space area exactly (12.13), and backward error analysis shows that they follow the exact flow of a nearby **modified Hamiltonian** $\tilde H = H + O(h^2)$ for exponentially long times. So the energy error stays bounded, $|H(y_n) - H(y_0)| = O(h^2)$, with no drift. Non-symplectic methods, even high-order ones such as classical RK4, generally make the energy drift steadily. Explicit Euler, which expands area, makes it grow without bound.`,
      idea: String.raw`Each half-step of leapfrog is the exact time-$h$ flow of a Hamiltonian ($U$ alone, then $p^2/2m$ alone), and compositions of canonical maps are canonical. The Baker–Campbell–Hausdorff formula combines the two flows into the flow of a single nearby Hamiltonian $\tilde H$. The numerical solution therefore conserves $\tilde H$ exactly, and $H$ stays within $O(h^2)$ of it. RK4 is not the flow of any Hamiltonian: its one-step map slightly contracts phase-space area, and the errors accumulate secularly. For the harmonic oscillator, $|R(ih\omega)|^2 = 1 - (h\omega)^6/72 + \dots < 1$ per step.`,
      caption: String.raw`A Kepler orbit is integrated for up to 1,000 periods by four methods at the same step size. Left: each method’s last two orbits (the dashed ellipse is the exact one). Right: the energy error $|\Delta E/E|$ on a log scale, as the largest value in each time bin. Explicit Euler (red) gains energy and spirals out. RK4 (orange) starts tiny but drifts steadily. Leapfrog (blue) and symplectic Euler (teal) oscillate in bounded bands forever; their orbits precess, but they do not decay. Use fewer steps per period or a more eccentric orbit and watch RK4’s drift overtake the symplectic band.`,
      deps: ['mech-12.13', 'mech-12.10'],
      refs: ['Goldstein §9.4'],
      tags: ['numerical integration', 'symplectic integrator', 'energy drift'],
      credit: 'Störmer, 1907; Verlet, 1967; de Vogelaere, 1956; Ruth, 1983',
      viz(v) {
        const nS = v.slider('steps per period', 20, 1000, 100, { log: true, int: true });
        const eS = v.slider('eccentricity', 0, 0.8, 0.5, { step: 0.01 });
        const pS = v.slider('number of periods', 10, 1000, 1000, { log: true, int: true });
        const sO = v.stage({ x: [-2.3, 0.9], y: [-1.3, 1.3], equal: true, axes: false, height: 340, title: 'the last two orbits of each method' });
        const sE = v.stage({ x: [0, 1000], y: [1e-12, 10], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.2, xlabel: 'time (periods)', title: 'energy error $|\\Delta E/E|$' });
        const METHODS = [{ k: 'euler', lab: 'explicit Euler', col: 'red' }, { k: 'seuler', lab: 'symplectic Euler', col: 'teal' }, { k: 'rk4', lab: 'RK4', col: 'orange' }, { k: 'leap', lab: 'leapfrog', col: 'blue' }];
        const cache = memo(); let cur = null;
        const run = () => cache([nS.value, eS.value, pS.value].join('|'), () => {
          const e = eS.value, N = nS.value, P = pS.value, h = TAU / N, steps = N * P, rp = 1 - e, y0 = [rp, 0, 0, Math.sqrt((1 + e) / rp)];
          const E = (y) => 0.5 * (y[2] * y[2] + y[3] * y[3]) - 1 / Math.hypot(y[0], y[1]), E0 = E(y0), L0 = y0[0] * y0[3];
          const acc = (x, y) => { const r = Math.hypot(x, y), k = -1 / (r * r * r); return [k * x, k * y]; };
          const F = (y) => { const a = acc(y[0], y[1]); return [y[2], y[3], a[0], a[1]]; };
          const NB = 400, bin = Math.max(1, Math.floor(steps / NB));
          return METHODS.map((M) => {
            let y = y0.slice(); const err = [], tail = [], keep = 2 * N; let mx = 0, dead = false, Lmax = 0;
            for (let n = 1; n <= steps; n++) {
              if (M.k === 'euler') { const f = F(y); for (let i = 0; i < 4; i++) y[i] += h * f[i]; }
              else if (M.k === 'seuler') { const a = acc(y[0], y[1]); y[2] += h * a[0]; y[3] += h * a[1]; y[0] += h * y[2]; y[1] += h * y[3]; }
              else if (M.k === 'leap') { let a = acc(y[0], y[1]); y[2] += 0.5 * h * a[0]; y[3] += 0.5 * h * a[1]; y[0] += h * y[2]; y[1] += h * y[3]; a = acc(y[0], y[1]); y[2] += 0.5 * h * a[0]; y[3] += 0.5 * h * a[1]; }
              else { const k1 = F(y), y2 = y.map((c, i) => c + 0.5 * h * k1[i]), k2 = F(y2), y3 = y.map((c, i) => c + 0.5 * h * k2[i]), k3 = F(y3), y4 = y.map((c, i) => c + h * k3[i]), k4 = F(y4); y = y.map((c, i) => c + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); }
              const de = Math.abs((E(y) - E0) / E0); mx = Math.max(mx, de);
              if (M.k === 'leap') Lmax = Math.max(Lmax, Math.abs(y[0] * y[3] - y[1] * y[2] - L0));
              tail.push([y[0], y[1]]); if (tail.length > keep) tail.shift();
              if (n % bin === 0) { err.push([n / N, Math.max(mx, 1e-16)]); mx = 0; }
              if (!(de < 2) || Math.hypot(y[0], y[1]) < 1e-3) { dead = n / N; err.push([n / N, Math.max(de, 1e-16)]); break; }
            }
            return { ...M, err, tail, dead, final: err.length ? err[err.length - 1][1] : 0, Lmax };
          });
        });
        v.render(() => {
          const R = run(), e = eS.value, P = pS.value;
          sE.setView([0, P], [1e-12, 10]);
          const a = 1, b = Math.sqrt(1 - e * e);
          sO.curve((t) => [a * Math.cos(t) - a * e, b * Math.sin(t)], 0, TAU, { color: 'ink', width: 1.2, dash: [4, 4], n: 200 });
          for (const M of R) {
            if (M.tail.length > 1) sO.path(M.tail, { color: M.col, width: M.k === 'leap' ? 2.4 : 1.6, alpha: 0.85 });
            sE.path(M.err, { color: M.col, width: M.k === 'leap' ? 2.4 : 1.6 });
            if (M.dead) sE.dot(M.dead, M.final, { r: 4.5, color: M.col, label: 'escaped', labelPos: 'n' });
          }
          sO.dot(0, 0, { r: 6, color: 'gold' });
          cur = R;
        });
        v.legend(METHODS.map((M) => [M.col, M.lab]).concat([['ink', 'exact orbit', { dash: true }]]));
        v.readout(() => {
          if (!cur) return '';
          const f = (M) => (M.dead ? `escaped after ${v.fix(M.dead, 1)} periods` : `final $|\\Delta E/E| = ${sci(v, M.final)}$`);
          return cur.map((M) => `**${M.lab}**: ${f(M)}`).join(' · ') + String.raw` · leapfrog keeps the angular momentum to $${sci(v, cur[3].Lmax)}$ (it is exactly conserved by the scheme) · RK4 costs 4 force evaluations per step, the others 1`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.16
    {
      num: '12.16',
      kind: 'Method',
      name: 'Hamilton–Jacobi equation',
      statement: String.raw`**Hamilton’s principal function** $S(q, t)$, the action along the actual motion that ends at $q$ at time $t$ (from fixed initial data), satisfies the **Hamilton–Jacobi equation**
$$\frac{\partial S}{\partial t} + H\Big(q, \frac{\partial S}{\partial q}, t\Big) = 0, \qquad p = \frac{\partial S}{\partial q}.$$
Conversely, a **complete integral** $S(q, \alpha, t)$, depending on $n$ independent constants $\alpha$, is the type-2 generating function (12.11) of a canonical transformation to constant new momenta $\alpha$ and constant new coordinates $\beta = \partial S/\partial\alpha$; solving $\beta = \partial S/\partial\alpha$ for $q$ gives every motion. For time-independent $H$, $S = W(q, \alpha) - Et$, where **Hamilton’s characteristic function** $W$ solves $H(q, \partial W/\partial q) = E$. For $H = p^2/2m + U$ this is the eikonal equation $|\nabla W|^2 = 2m(E - U)$. The level sets of $W$ are wavefronts, and the trajectories are the rays orthogonal to them, $m\dot q = \nabla W$, exactly as light rays are orthogonal to wavefronts in geometrical optics.`,
      idea: String.raw`Vary the endpoint of the action integral: the first-variation formula gives $dS = p\,dq - H\,dt$ along a family of actual motions, which is the Hamilton–Jacobi equation together with $p = \partial S/\partial q$. Choosing $S$ as a type-2 generating function with $K = H + \partial S/\partial t = 0$ makes all new variables constant (12.11). Along a ray of fixed energy, $dW = p\cdot dq = 2T\,dt$, so $W$ can be computed by integrating rays and accumulating $2T$. Beyond a caustic, where neighbouring rays cross, $W$ becomes many-valued: the Hamilton–Jacobi equation has only local smooth solutions.`,
      caption: String.raw`Rays are integrated from Hamilton’s equations at fixed energy, and $W = \int 2T\,dt$ is accumulated along each one. The coloured curves join the points of equal $W$: the wavefronts. Choose projectiles fired from one point in all directions (the dashed parabola is their envelope, a caustic), a parallel beam scattered by a repulsive Coulomb centre (Rutherford), or a beam focused by an attractive well. Drag the probe: at the nearest wavefront point the ray and the wavefront are drawn with their measured angle, which is a right angle everywhere, even past caustics, where the fronts fold and cusp.`,
      deps: ['mech-12.11'],
      refs: ['Goldstein §10.1', 'Tong §4.7'],
      tags: ['Hamilton–Jacobi equation', 'wavefronts', 'eikonal'],
      credit: 'Hamilton, 1834; Jacobi, 1837',
      viz(v) {
        const PRE = {
          proj: { lab: 'projectiles from a point', x: [-2.3, 2.3], y: [-2.2, 0.85], U: (x, y) => y, dU: (x, y) => [0, 1], E: 0.5, n: 121, dW: 0.16, T: 3 },
          ruth: { lab: 'Rutherford scattering', x: [-3, 3], y: [-2.1, 2.1], U: (x, y) => 0.25 / Math.hypot(x, y), dU: (x, y) => { const r = Math.hypot(x, y), k = -0.25 / (r * r * r); return [k * x, k * y]; }, E: 0.5, n: 141, dW: 0.3, T: 7.5 },
          lens: { lab: 'focusing well', x: [-3, 3], y: [-2.1, 2.1], U: (x, y) => -0.32 * Math.exp(-(x * x + y * y) / 0.6), dU: (x, y) => { const g = 0.32 * Math.exp(-(x * x + y * y) / 0.6) / 0.3; return [g * x, g * y]; }, E: 0.5, n: 141, dW: 0.3, T: 7.5 },
        };
        const pre = v.select('situation', Object.entries(PRE).map(([value, P]) => ({ value, label: P.lab })), 'ruth', { onChange: (k) => { s.setView(PRE[k].x, PRE[k].y); hp.set(...(k === 'proj' ? [1, -0.5] : [1.2, 0.8])); } });
        const s = v.stage({ x: PRE.ruth.x, y: PRE.ruth.y, equal: true, axes: 'box', gutter: true, height: 420, xlabel: 'x', ylabel: 'y' });
        const hp = s.handle(1.2, 0.8, { color: 'gold', r: 7, label: 'probe', labelPos: 'ne' });
        const cache = memo(); let cur = null;
        const rays = () => cache(pre.value, () => {
          const P = PRE[pre.value], out = [], dt = 0.01;
          for (let i = 0; i < P.n; i++) {
            let y, W;
            if (pre.value === 'proj') { const a = (TAU * (i + 0.5)) / P.n, sp = Math.sqrt(2 * P.E); y = [0, 0, sp * Math.cos(a), sp * Math.sin(a)]; W = 0; }
            else { const b = -2.4 + (4.8 * i) / (P.n - 1), x0 = -3.2, sp = Math.sqrt(2 * (P.E - P.U(x0, b))); y = [x0, b, sp, 0]; W = sp * x0; }
            const pts = [[y[0], y[1], W, y[2], y[3]]];
            for (let k = 0; k < P.T / dt; k++) {
              y = rk4((t, z) => { const g = P.dU(z[0], z[1]); return [z[2], z[3], -g[0], -g[1]]; }, 0, y, dt);
              W += (y[2] * y[2] + y[3] * y[3]) * dt;
              pts.push([y[0], y[1], W, y[2], y[3]]);
              if (y[0] < P.x[0] - 1 || y[0] > P.x[1] + 1 || y[1] < P.y[0] - 1 || y[1] > P.y[1] + 1) break;
            }
            out.push(pts);
          }
          let wmin = Infinity, wmax = -Infinity; for (const r of out) for (const z of r) { if (z[0] < P.x[0] || z[0] > P.x[1] || z[1] < P.y[0] || z[1] > P.y[1]) continue; wmin = Math.min(wmin, z[2]); wmax = Math.max(wmax, z[2]); }
          const levels = []; for (let c = Math.ceil(wmin / P.dW) * P.dW; c < wmax; c += P.dW) levels.push(c);
          // crossing of each ray with each level
          const cross = levels.map((c) => out.map((r) => { for (let k = 1; k < r.length; k++) if (r[k - 1][2] < c && r[k][2] >= c) { const f = (c - r[k - 1][2]) / (r[k][2] - r[k - 1][2]), A = r[k - 1], B = r[k]; return [A[0] + f * (B[0] - A[0]), A[1] + f * (B[1] - A[1]), A[3] + f * (B[3] - A[3]), A[4] + f * (B[4] - A[4])]; } return null; }));
          return { P, out, levels, cross, wmin, wmax };
        });
        v.render(() => {
          const D = rays(), P = D.P;
          if (pre.value === 'ruth') s.dot(0, 0, { r: 6, color: 'red', label: '+', labelPos: 'ne' });
          if (pre.value === 'lens') s.circle(0, 0, 0.55, { fill: 'teal', fillAlpha: 0.1, color: 'teal', width: 1, dash: [3, 3] });
          for (const r of D.out) s.path(r.map((z) => [z[0], z[1]]), { color: 'muted', width: 0.8, alpha: 0.4 });
          D.cross.forEach((row, li) => {
            const col = v.ramp(0.35 + 0.65 * (li / Math.max(1, D.levels.length - 1)), 'purple');
            const pts = [];
            for (let i = 0; i < row.length; i++) { const z = row[i], w = i ? row[i - 1] : null; if (z && w && Math.hypot(z[0] - w[0], z[1] - w[1]) > 0.5) pts.push(null); pts.push(z ? [z[0], z[1]] : null); }
            s.path(pts, { color: col, width: 2 });
          });
          if (pre.value === 'proj') { s.fn((x) => 0.5 - 0.5 * x * x, { color: 'red', width: 1.4, dash: [6, 4] }); s.dot(0, 0, { r: 5, color: 'ink' }); }
          // probe: nearest wavefront point with neighbours on both sides
          let best = null;
          D.cross.forEach((row, li) => row.forEach((z, i) => { if (!z || i === 0 || i === row.length - 1 || !row[i - 1] || !row[i + 1]) return; const d = Math.hypot(z[0] - hp.x, z[1] - hp.y); if (!best || d < best.d) best = { d, z, li, i }; }));
          if (best) {
            const row = D.cross[best.li], a = row[best.i - 1], b = row[best.i + 1], t = [b[0] - a[0], b[1] - a[1]], r = [best.z[2], best.z[3]];
            const ang = Math.acos(clamp(Math.abs(t[0] * r[0] + t[1] * r[1]) / (Math.hypot(...t) * Math.hypot(...r)), 0, 1)) / DEG;
            arrowPx(s, best.z[0], best.z[1], r, 44, { color: 'blue' });
            const tn = Math.hypot(...t); s.line(best.z[0] - (0.35 * t[0]) / tn, best.z[1] - (0.35 * t[1]) / tn, best.z[0] + (0.35 * t[0]) / tn, best.z[1] + (0.35 * t[1]) / tn, { color: 'ink', width: 2.4 });
            rightAngle(s, best.z[0], best.z[1], r, t, 10, { color: 'ink' });
            s.dot(best.z[0], best.z[1], { r: 4, color: 'ink' });
            cur = { ang, W: D.levels[best.li], spd: Math.hypot(...r), Uv: P.U(best.z[0], best.z[1]), E: P.E, nlev: D.levels.length };
          } else cur = null;
        });
        v.legend([['purple', 'wavefronts $W = $ const'], ['muted', 'rays (trajectories)'], ['blue', 'ray direction $\\nabla W$'], ['ink', 'wavefront tangent'], ['red', 'envelope of the projectiles', { dash: true }]]);
        v.readout(() => {
          if (!cur) return 'move the probe near a wavefront';
          return String.raw`at the probe’s wavefront ($W = ${v.fix(cur.W, 2)}$): angle between the ray and the wavefront = ${v.fix(cur.ang, 2)}° · $|\nabla W| = |p| = ${v.fix(cur.spd, 4)}$ against $\sqrt{2m(E - U)} = ${v.fix(Math.sqrt(2 * (cur.E - cur.Uv)), 4)}$ (the eikonal equation) · ${cur.nlev} wavefronts, spaced by equal steps of $W$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.17
    {
      num: '12.17',
      kind: 'Definition',
      name: 'Action–angle variables',
      statement: String.raw`For a one-degree-of-freedom system with a closed orbit of energy $E$, the **action** is
$$J(E) = \frac1{2\pi}\oint p\,dq = \frac{\text{area enclosed by the orbit}}{2\pi}$$
(for a rotation, the area between the orbit and $p = 0$ over one turn). Solving for $E = K(J)$, the type-2 generating function $W(q, J) = \int^q p(q', J)\,dq'$ gives a canonical transformation to $(\theta, J)$ with the **angle** $\theta = \partial W/\partial J$, defined modulo $2\pi$. In these variables $H = K(J)$, so
$$\dot J = 0, \qquad \dot\theta = \omega(J) = \frac{dK}{dJ}:$$
every orbit becomes uniform rotation, and the frequency is the slope of $E(J)$. For the oscillator, $J = E/\omega$. For the pendulum, $J$ is given by complete elliptic integrals, and $\omega \to 0$ logarithmically as the orbit approaches the separatrix.`,
      idea: String.raw`The action is a function of the energy alone, so it is constant along each orbit. The angle comes from a generating function (12.11), so the pair $(\theta, J)$ is canonical. Its increment around one orbit is $\Delta\theta = \partial(\oint p\,dq)/\partial J = \partial(2\pi J)/\partial J = 2\pi$, which is why it is an angle. The equation $\dot\theta = dK/dJ$ is then Hamilton’s equation. The same fact read geometrically: the area between two neighbouring orbits is $2\pi\,dJ$, and it is swept in one period $T$, so $dE/dJ = 2\pi/T = \omega$.`,
      caption: String.raw`Drag the handle up the $p$ axis to choose a pendulum orbit (inside the separatrix it librates, outside it rotates). Its area, shaded and measured from the integrated orbit, is $2\pi J$. The 24 gold points are equally spaced in the angle $\theta$, that is, in time: on the orbit they bunch up near the turning points, while in the action–angle plane (middle) they sit evenly on the line $J = $ const and slide along it at the constant rate $\omega$. Bottom: $E$ against $J$ for libration and for rotation, with the tangent at the current orbit; its slope matches the frequency measured from the simulation.`,
      deps: ['mech-12.11', 'mech-12.4'],
      refs: ['Goldstein §10.6', 'Tong §4.5'],
      tags: ['action–angle variables', 'pendulum', 'frequency'],
      viz(v) {
        const sP = v.stage({ x: [-Math.PI, Math.PI], y: [-2.9, 2.9], axes: 'box', gutter: true, height: 330, weight: 1.25, xlabel: 'q', ylabel: 'p', xticks: piTicks(-Math.PI, Math.PI), title: 'phase plane: area $= 2\\pi J$' });
        const sA = v.stage({ x: [0, TAU], y: [0, 3.2], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'θ', ylabel: 'J', xticks: piTicks(0, TAU), title: 'action–angle plane' });
        const sE = v.stage({ x: [0, 3.2], y: [-1.05, 3.2], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'J', ylabel: 'E', title: 'energy against action: the slope is the frequency' });
        const hp = sP.handle(0, 1.35, { color: 'ink', r: 7, constrain: (x, y) => [0, clamp(y, 0.08, 2.75)] });
        const cache = memo(); let cur = null;
        const orbit = () => cache(hp.y.toFixed(5), () => {
          const E = pendH(0, hp.y), I = pendInfo(E), y = [0, hp.y], dt = 0.002, pts = [[0, hp.y]], ts = [0];
          // integrate one full period (to the next return to q ≡ 0 with p > 0)
          let t = 0, prevq = 0;
          for (let k = 0; k < 400000; k++) {
            pendStep(y, dt); t += dt; pts.push([y[0], y[1]]); ts.push(t);
            const crossed = I.kind === 'rotation' ? y[0] >= TAU : prevq < 0 && y[0] >= 0 && k > 10;
            if (crossed) break; prevq = y[0];
          }
          const n = pts.length - 1, f = I.kind === 'rotation' ? (TAU - pts[n - 1][0]) / (pts[n][0] - pts[n - 1][0]) : (0 - pts[n - 1][0]) / (pts[n][0] - pts[n - 1][0]), Tm = ts[n - 1] + f * dt;
          const poly = I.kind === 'rotation' ? [...pts.map((z) => [z[0] - Math.PI, z[1]]).filter((z) => z[0] <= Math.PI), [Math.PI, 0], [-Math.PI, 0]] : pts;
          // for a rotation the orbit is a graph p(q) over one turn; shift to q ∈ [−π, π] by symmetry
          const Jm = I.kind === 'rotation' ? Math.abs(shoelace(pts.concat([[TAU, 0], [0, 0]]))) / TAU : Math.abs(shoelace(pts)) / TAU;
          return { E, I, pts, ts, Tm, Jm, poly };
        });
        const branch = (lo, hi, rot) => { const out = []; for (let k = 0; k <= 200; k++) { const E = lo + ((hi - lo) * k) / 200; const I = pendInfo(E); if (isFinite(I.J)) out.push([I.J, E]); } return out; };
        const lib = branch(-0.99999, 0.99999), rot = branch(1.00001, 3.2);
        v.animate((tt) => {
          const O = orbit(), I = O.I, T = O.Tm, w = TAU / T;
          // phase plane
          sP.contour(pendH, [1], { color: 'red', width: 1.3, alpha: 0.7, res: 150 });
          if (I.kind === 'rotation') { const top = O.pts.filter((z) => z[0] <= TAU).map((z) => [wrap(z[0]), z[1]]).sort((a, b) => a[0] - b[0]); sP.poly([...top, [Math.PI, 0], [-Math.PI, 0]], { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 }); }
          else sP.poly(O.pts, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2 });
          const pos = (th) => { const tq = (((th / TAU) % 1) + 1) % 1 * T; let k = Math.min(O.ts.length - 1, Math.round(tq / 0.002)); return O.pts[k]; };
          const th0 = (w * tt) % TAU;
          for (let k = 0; k < 24; k++) { const z = pos(th0 + (TAU * k) / 24); sP.dot(wrap(z[0]), z[1], { r: k ? 3.6 : 5.5, color: k ? 'gold' : 'orange' }); }
          // action–angle plane
          const J = O.Jm;
          sA.hline(8 / Math.PI, { color: 'red', width: 1, dash: [4, 4], alpha: 0.7 }); sA.text('separatrix (libration side)', TAU, 8 / Math.PI, { color: 'red', align: 'right', dy: -9, size: 11 });
          sA.hline(4 / Math.PI, { color: 'red', width: 1, dash: [2, 4], alpha: 0.5 }); sA.text('separatrix (rotation side)', TAU, 4 / Math.PI, { color: 'red', align: 'right', dy: 10, size: 11, alpha: 0.8 });
          sA.hline(J, { color: 'accent', width: 2.4 });
          for (let k = 0; k < 24; k++) { const th = (th0 + (TAU * k) / 24) % TAU; sA.dot(th, J, { r: k ? 3.6 : 5.5, color: k ? 'gold' : 'orange' }); }
          // E(J)
          sE.path(lib, { color: 'blue', width: 2.4 }); sE.path(rot, { color: 'teal', width: 2.4 });
          sE.hline(1, { color: 'red', width: 1, dash: [4, 4], alpha: 0.6 });
          const sl = I.kind === 'rotation' ? (pendInfo(O.E + 1e-4).J - pendInfo(O.E - 1e-4).J) : pendInfo(O.E + 1e-4).J - pendInfo(O.E - 1e-4).J, dEdJ = 2e-4 / sl;
          sE.line(J - 0.6, O.E - 0.6 * dEdJ, J + 0.6, O.E + 0.6 * dEdJ, { color: 'orange', width: 1.8, dash: [6, 4] });
          sE.dot(J, O.E, { r: 6, color: 'gold' });
          sE.text('libration', 1.2, -0.25, { color: 'blue', size: 12 }); sE.text('rotation (per turn)', 2.2, 2.45, { color: 'teal', size: 12 });
          cur = { O, J, dEdJ, w };
        }, { period: 60, still: 3 });
        v.legend([['accent', 'orbit and its area $2\\pi J$'], ['gold', 'points equally spaced in $\\theta$'], ['blue', '$E(J)$, libration'], ['teal', '$E(J)$, rotation'], ['orange', 'tangent: slope $dE/dJ$', { dash: true }], ['red', 'separatrix', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { O, J, dEdJ, w } = cur;
          return String.raw`${O.I.kind}: $E = ${v.fix(O.E, 4)}$ · action from the measured area: $J = ${v.fix(J, 5)}$; from elliptic integrals: ${v.fix(O.I.J, 5)} · frequency: $dE/dJ = ${v.fix(dEdJ, 5)}$, measured $2\pi/T = ${v.fix(w, 5)}$ (small oscillations: 1)`;
        });
      },
    },
  ],
};
