// Classical Mechanics — Chapter 10: Rigid bodies (part a: 10.1–10.7)

import {
  TAU, DEG, clamp, memo, rk4rec, idxAt, span, sci, num, series, ellK,
  add, sub, scl, madd, dot, crs, nrm, unit, angle, I3, mm, mv, mT, msub, fro, det3, rotAxis, axisAngle,
  drawBox, letterF, circlePts, AXC,
} from './ch10.shared.js';

// ── plane laminas: exact moments of polygons (10.2–10.4) ──────────────────────
/** Exact integrals over a union of polygons (counter-clockwise = +, clockwise holes = −), each with a density:
 *  {A: ∫dA, Sx: ∫x, Sy: ∫y, Xx: ∫x², Yy: ∫y², Xy: ∫xy}, all weighted by density. */
function polyMoments(parts) {
  const m = { A: 0, Sx: 0, Sy: 0, Xx: 0, Yy: 0, Xy: 0 };
  for (const { pts, rho = 1 } of parts) for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length], c = (x0 * y1 - x1 * y0) * rho;
    m.A += c / 2; m.Sx += ((x0 + x1) * c) / 6; m.Sy += ((y0 + y1) * c) / 6;
    m.Xx += ((x0 * x0 + x0 * x1 + x1 * x1) * c) / 12; m.Yy += ((y0 * y0 + y0 * y1 + y1 * y1) * c) / 12;
    m.Xy += ((x0 * y1 + 2 * x0 * y0 + 2 * x1 * y1 + x1 * y0) * c) / 24;
  }
  return m;
}
/** Polar moment ∫|r − P|² dm from the exact moments. */
const polarAt = (m, px, py) => m.Xx + m.Yy - 2 * (px * m.Sx + py * m.Sy) + m.A * (px * px + py * py);
/** Even–odd point-in-polygon test. */
function inPoly(x, y, P) {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; }
  return c;
}
/** Density at (x, y) of a union of parts (holes by even–odd counting within each density group). */
function densityAt(parts, x, y) { let r = 0; for (const { pts, rho = 1, hole } of parts) if (inPoly(x, y, pts)) r += hole ? -rho : rho; return r; }
/** Midpoint-rule cells of a lamina on an N×N grid over [−B, B]² → {x, y, m (mass per cell, total normalised to M), h}. */
function cells(parts, N, B, M = 1) {
  const h = (2 * B) / N, xs = [], ys = [], ms = []; let tot = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = -B + (i + 0.5) * h, y = -B + (j + 0.5) * h, r = densityAt(parts, x, y);
    if (r > 1e-12) { xs.push(x); ys.push(y); ms.push(r * h * h); tot += r * h * h; }
  }
  return { x: xs, y: ys, m: ms.map((q) => (q * M) / tot), h, raw: tot };
}
const circ = (r, n, cx = 0, cy = 0, cw = false) => { const p = []; for (let k = 0; k < n; k++) { const t = ((cw ? -1 : 1) * TAU * k) / n; p.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return p; };
const rot2 = (x, y, a, cx = 0, cy = 0) => { const c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - cy; return [cx + c * dx - s * dy, cy + s * dx + c * dy]; };

export default {
  collection: 'mech',
  chapter: 10,
  title: 'Rigid bodies',
  summary: String.raw`A rigid body that keeps one point fixed can only turn, and every such displacement is a single rotation about some axis. How hard a body is to turn is measured by its moment of inertia, which shifts with the axis by the parallel-axis rule and, for the full three-dimensional story, becomes a symmetric tensor. Its eigenvectors, the principal axes, are the directions where angular momentum and angular velocity line up. Euler’s equations then govern free and torqued rotation. Spin about the intermediate axis is unstable, a free symmetric body wobbles (Earth does so with a fourteen-month period), a heavy top precesses and nutates, gyroscopes respond to torques sideways, and Earth’s axis circles the sky once in about 25,800 years. The chapter closes with the geometry of motion itself: every rigid displacement is a screw, unit quaternions cover the rotations twice, and a falling cat turns over with zero angular momentum.`,
  items: [
    // ───────────────────────────────────────────────────────────── 10.1
    {
      num: '10.1',
      kind: 'Theorem',
      name: 'Euler’s rotation theorem',
      statement: String.raw`Let $\mathsf R$ be a real $3\times3$ matrix with $\mathsf R^{\mathsf T}\mathsf R = \mathsf I$ and $\det\mathsf R = +1$: a displacement of a rigid body that keeps the point $O$ fixed and preserves orientation. Then $\mathsf R$ has an eigenvector $\mathbf n$ with eigenvalue $1$. Every point of the line through $O$ along $\mathbf n$ stays put, and $\mathsf R$ is a rotation about that line by an angle $\theta$ with
$$\cos\theta = \tfrac12\left(\operatorname{tr}\mathsf R - 1\right).$$
The other two eigenvalues are $e^{\pm i\theta}$. In particular, two rotations about different axes through $O$, applied one after the other, are equivalent to a **single** rotation about a third axis through $O$. The hypothesis $\det\mathsf R = +1$ cannot be dropped: an orthogonal matrix with $\det = -1$ (a reflection, or a rotation followed by a reflection) has eigenvalue $-1$ instead, and in general it fixes no line at all.`,
      idea: String.raw`Since $\det\mathsf R = 1$ and determinants multiply (pma-9.35), $\det(\mathsf R - \mathsf I) = \det(\mathsf R - \mathsf R\mathsf R^{\mathsf T}) = \det\mathsf R\,\det(\mathsf I - \mathsf R^{\mathsf T}) = \det(\mathsf I - \mathsf R)$. A determinant is unchanged by transposition and changes by $(-1)^3$ when all three rows change sign (pma-9.34), so $\det(\mathsf I - \mathsf R) = -\det(\mathsf R - \mathsf I)$. Hence $\det(\mathsf R - \mathsf I) = 0$, and $1$ is an eigenvalue. The plane perpendicular to the fixed axis is carried to itself isometrically and without flipping, so $\mathsf R$ turns it by some angle $\theta$. In the basis $(\mathbf n, \mathbf e, \mathbf n\times\mathbf e)$ the trace is $1 + 2\cos\theta$. If $\det\mathsf R = -1$, the same computation gives $\det(\mathsf R + \mathsf I) = 0$: the eigenvalue is $-1$, and that line is reversed rather than fixed.`,
      caption: String.raw`Drag the tips of the axes $\mathbf a_1$ (blue) and $\mathbf a_2$ (orange) and set the two angles; drag the background to rotate the view. The book turns by $\theta_1$ about $\mathbf a_1$ and then by $\theta_2$ about $\mathbf a_2$, and its gold corner traces two circular arcs. At the same time a green outline makes the single turn about the axis $\mathbf n$, the eigenvector of $\mathsf R_2\mathsf R_1$ for the eigenvalue $1$. Its corner follows one arc, and both arrive at the same pose. Right: the three eigenvalues of the composite on the unit circle. Switch on the reflection to break the hypothesis: the eigenvalue $1$ moves to $-1$, no single rotation reaches the red pose, and the letter F on the book comes out mirrored.`,
      deps: ['pma-9.34', 'pma-9.35'],
      see: ['mech-9.4', 'robot-2.3', 'mfd-5.2', 'ladr-7.29'],
      refs: ['Goldstein §4.6'],
      tags: ['rotation', 'rigid body', 'eigenvalue'],
      credit: 'Euler, 1775',
      viz(v) {
        const H = [0.8, 0.52, 0.16], RA = 1.2;
        const t1S = v.slider('first turn $\\theta_1$ about $\\mathbf a_1$ (°)', -180, 180, 90, { step: 1 });
        const t2S = v.slider('second turn $\\theta_2$ about $\\mathbf a_2$ (°)', -180, 180, 120, { step: 1 });
        const mir = v.toggle('then reflect in the plane $\\perp\\mathbf a_2$ ($\\det = -1$)', false);
        const S = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 350, title: 'two turns (solid) and one turn about $\\mathbf n$ (green outline)' });
        const sc = v.scene3(S, { yaw: 0.8, pitch: 0.3, axes: false, lim: 1.4, hint: false });
        const E = v.stage({ x: [-1.55, 1.55], y: [-1.55, 1.55], equal: true, axes: false, height: 350, weight: 0.62, minWidth: 230, title: 'eigenvalues of the composite in $\\mathbb C$' });
        const a1 = sc.handle([0.1, -0.2, RA], { color: 'blue', label: '$\\mathbf a_1$', snap: (p) => scl(unit(p), RA) });
        const a2 = sc.handle([-RA * 0.866, RA * 0.5, 0], { color: 'orange', label: '$\\mathbf a_2$', snap: (p) => scl(unit(p), RA) });
        const MARK = 7, ease = v.M.smoothstep;
        let cur = null;
        v.animate((t) => {
          const n1 = unit(a1.p), n2 = unit(a2.p), th1 = t1S.value * DEG, th2 = t2S.value * DEG;
          const R1 = rotAxis(n1, th1), R2 = rotAxis(n2, th2), R = mm(R2, R1);
          const F = I3().map((r, i) => r.map((x, j) => x - 2 * n2[i] * n2[j])), Mc = mir.value ? mm(F, R) : R;
          // the single rotation: for det = +1 the axis of R; for det = −1 the axis of −M (M = reflection ∘ rotation)
          const aa = mir.value ? axisAngle(Mc.map((r) => r.map((x) => -x))) : axisAngle(R);
          const n = aa.n, th = mir.value ? aa.th + Math.PI : aa.th;
          const s = clamp(t / 8, 0, 1);
          const Rtwo = s < 0.5 ? rotAxis(n1, th1 * ease(2 * s)) : mm(rotAxis(n2, th2 * ease(2 * s - 1)), R1);
          const Rone = rotAxis(n, th * ease(s));
          const corner = [H[0], H[1], H[2]];
          sc.begin();
          drawBox(sc, I3(), H, { ghost: true, color: 'faint', alpha: 0.9 });
          // the fixed axis
          sc.line(scl(n, -1.4), scl(n, 1.4), { color: mir.value ? 'red' : 'green', width: 2.2, dash: [8, 5] });
          sc.dot(scl(n, 1.4), { r: 3.5, color: mir.value ? 'red' : 'green' }); sc.dot(scl(n, -1.4), { r: 3.5, color: mir.value ? 'red' : 'green' });
          // planned corner paths, then the parts already travelled
          const pathTwo = [], pathOne = [];
          for (let k = 0; k <= 40; k++) pathTwo.push(mv(rotAxis(n1, (th1 * k) / 40), corner));
          for (let k = 0; k <= 40; k++) pathTwo.push(mv(mm(rotAxis(n2, (th2 * k) / 40), R1), corner));
          for (let k = 0; k <= 60; k++) pathOne.push(mv(rotAxis(n, (th * k) / 60), corner));
          sc.path(pathTwo, { color: 'blue', width: 1, alpha: 0.3 }); sc.path(pathOne, { color: 'green', width: 1, alpha: 0.3 });
          const kTwo = Math.round((s < 0.5 ? ease(2 * s) * 40 : 41 + ease(2 * s - 1) * 40)), kOne = Math.round(ease(s) * 60);
          sc.path(pathTwo.slice(0, kTwo + 1), { color: 'blue', width: 2.2 }); sc.path(pathOne.slice(0, kOne + 1), { color: 'green', width: 2.2 });
          if (mir.value) {
            drawBox(sc, Mc, H, { ghost: true, color: 'red', width: 1.8, alpha: 0.95 });
            for (const L of letterF(H)) sc.path(L.map((p) => mv(Mc, p)), { color: 'red', width: 2.2 });
          }
          drawBox(sc, Rtwo, H, { fillAlpha: 0.32 });
          for (const L of letterF(H)) sc.path(L.map((p) => mv(Rtwo, p)), { color: 'ink', width: 2.4 });
          drawBox(sc, Rone, H, { ghost: true, color: 'green', width: 1.8, alpha: 0.95, dash: [5, 3] });
          for (const L of letterF(H)) sc.path(L.map((p) => mv(Rone, p)), { color: 'green', width: 2 });
          sc.arrow([0, 0, 0], a1.p, { color: 'blue', width: 2.2 }); sc.arrow([0, 0, 0], a2.p, { color: 'orange', width: 2.2 });
          sc.dot(mv(Rtwo, corner), { r: 5.5, color: 'gold' });
          sc.tex(mir.value ? "\\mathbf n'" : '\\mathbf n', scl(n, 1.55), { color: mir.value ? 'red' : 'green', size: 16 });
          sc.flush();
          S.corner(s < 0.5 ? `turn 1 of 2 · ${v.fix(t1S.value * ease(2 * s), 0)}° about a₁` : s < 1 ? `turn 2 of 2 · ${v.fix(t2S.value * ease(2 * s - 1), 0)}° about a₂` : 'both arrive', 'tl');
          // eigenvalues
          const ev = v.M.eig(Mc, { vectors: false }).values;
          E.circle(0, 0, 1, { color: 'faint', width: 1.2 });
          E.line(-1.45, 0, 1.45, 0, { color: 'faint', width: 0.8 }); E.line(0, -1.45, 0, 1.45, { color: 'faint', width: 0.8 });
          const phi = mir.value ? Math.PI - aa.th : aa.th;
          if (phi > 0.02) { const arc = []; for (let k = 0; k <= 40; k++) arc.push([0.42 * Math.cos((phi * k) / 40), 0.42 * Math.sin((phi * k) / 40)]); E.path(arc, { color: 'accent', width: 1.5 }); E.tex(mir.value ? '\\varphi' : '\\theta', 0.55 * Math.cos(phi / 2), 0.55 * Math.sin(phi / 2), { color: 'accent', size: 15 }); }
          for (const z of ev) {
            const real = Math.abs(z.im) < 1e-9, col = real ? (z.re > 0 ? 'green' : 'red') : 'accent';
            E.dot(z.re, z.im, { r: 6.5, color: col });
          }
          const lab = (z, s2) => E.tex(s2, z.re * 1.25, z.im * 1.25 + (Math.abs(z.im) < 1e-9 ? 0.17 : 0), { color: Math.abs(z.im) < 1e-9 ? (z.re > 0 ? 'green' : 'red') : 'accent', size: 15 });
          for (const z of ev) { if (Math.abs(z.im) < 1e-9) lab(z, z.re > 0 ? '1' : '-1'); else lab(z, z.im > 0 ? (mir.value ? 'e^{i\\varphi}' : 'e^{i\\theta}') : (mir.value ? 'e^{-i\\varphi}' : 'e^{-i\\theta}')); }
          E.corner(`det = ${v.fix(det3(Mc), 6)}`, 'bl', { color: mir.value ? 'red' : 'green' });
          cur = { R, Mc, n, th, aa, Rtwo };
        }, { period: 11, still: 9.5 });
        v.legend([['blue', 'axis $\\mathbf a_1$, and the corner’s path for two turns'], ['orange', 'axis $\\mathbf a_2$'], ['green', 'axis $\\mathbf n$ of $\\mathsf R_2\\mathsf R_1$, one turn about it', { dash: true }], ['red', 'mirrored pose / eigenvalue $-1$']]);
        v.readout(() => {
          if (!cur) return '';
          const { R, Mc, n, th, aa } = cur, f3 = (p) => `(${p.map((c) => v.fix(c, 3)).join(',\\ ')})`;
          if (!mir.value) {
            if (aa.th < 1e-9) return String.raw`$\mathsf R_2\mathsf R_1 = \mathsf I$: every direction is fixed`;
            const err = nrm(sub(mv(R, n), n)), rec = fro(rotAxis(n, th), R);
            return String.raw`$\det\mathsf R = ${v.fix(det3(R), 6)}$ · axis $\mathbf n = ${f3(n)}$ (eigenvector for $\lambda = 1$), $\theta = \arccos\frac{\operatorname{tr}\mathsf R - 1}{2} = ${v.fix(th / DEG, 2)}°$ · $|\mathsf R\mathbf n - \mathbf n| = ${sci(v, err)}$ · one turn about $\mathbf n$ vs the two turns: $\|\mathsf R_{\mathbf n}(\theta) - \mathsf R_2\mathsf R_1\| = ${sci(v, rec)}$ · $\det(\mathsf R - \mathsf I) = ${sci(v, det3(msub(R, I3())))}$`;
          }
          const dMI = det3(msub(Mc, I3())), fixed = Math.abs(aa.th - Math.PI) < 1e-6;
          return String.raw`$\det\mathsf M = ${v.fix(det3(Mc), 6)}$ · $\mathsf M\mathbf n' = -\mathbf n'$ for $\mathbf n' = ${f3(n)}$ · $\det(\mathsf M - \mathsf I) = ${num(v, dMI, 4)}$` + (fixed ? ' (here $\\mathsf M$ is a pure reflection and fixes a whole plane)' : String.raw` $\neq 0$: no direction is fixed, so no rotation about any axis gives this pose · $\mathsf M$ is a turn by ${v.fix(((((th / DEG) + 180) % 360) + 360) % 360 - 180, 1)}° about $\mathbf n'$ followed by the reflection in the plane $\perp\mathbf n'$ — the green outline makes the turn, and its F reads backwards relative to the red pose`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.2
    {
      num: '10.2',
      kind: 'Definition',
      name: 'Moment of inertia about an axis',
      statement: String.raw`The **moment of inertia** of a body about a fixed axis is
$$I = \int r_\perp^2\,dm = \sum_i m_i\,r_{\perp,i}^2 ,$$
where $r_\perp$ is the distance of the mass element from the axis. For rotation about that axis with angular velocity $\omega$, the angular momentum along the axis is $L = I\omega$, the kinetic energy is $T = \tfrac12 I\omega^2$, and a torque $\tau$ along the axis gives the angular acceleration $\dot\omega = \tau/I$, the rotational form of $F = ma$. The **radius of gyration** $k = \sqrt{I/M}$ is the distance at which the whole mass $M$, concentrated on a thin ring, would have the same moment. Standard values about an axis through the centre: a thin ring $MR^2$, a disc $\tfrac12 MR^2$, a rod of length $\ell$ (perpendicular axis) $\tfrac1{12}M\ell^2$, an $a\times b$ plate (normal axis) $\tfrac1{12}M(a^2+b^2)$.`,
      idea: String.raw`Each mass element moves on a circle of radius $r_\perp$ with speed $\omega r_\perp$, so its angular momentum about the axis is $r_\perp\cdot dm\,\omega r_\perp$ and its kinetic energy is $\tfrac12 dm\,\omega^2 r_\perp^2$. Summing gives $L = I\omega$ and $T = \tfrac12 I\omega^2$. The spin angular momentum of 2.12 thus becomes a single number times $\omega$ once the axis is fixed, and the theorem that torque changes angular momentum (2.9) becomes $\tau = I\dot\omega$. Since $r_\perp^2$ grows quadratically, mass far from the axis dominates. The integral is an ordinary multiple integral over the body (pma-10.1) and can be computed by summing over small cells.`,
      caption: String.raw`Choose a shape (a uniform lamina of mass 1 kg) and drag the gold axis point; the axis is perpendicular to the page. Left: each cell is shaded by its contribution $r_\perp^2\,dm$, and the dashed green circle has the radius of gyration $k$. Use the slider to refine the grid of cells; the sum converges to the exact value from the polygon formula. Right: the same torque of 0.5 N·m spins the body up from rest, about your axis (blue) and about the centre of mass (green outline). The farther the axis is from the mass, the slower the start.`,
      deps: ['mech-2.12', 'mech-2.9', 'pma-10.1'],
      refs: ['Taylor §10.2'],
      tags: ['moment of inertia', 'rotation', 'integration'],
      credit: 'Euler, 1765 (Theoria motus corporum solidorum)',
      viz(v) {
        const SH = {
          plate: [{ pts: [[-1, -0.5], [1, -0.5], [1, 0.5], [-1, 0.5]] }],
          L: [{ pts: [[-1, -0.85], [1.05, -0.85], [1.05, -0.35], [-0.5, -0.35], [-0.5, 0.95], [-1, 0.95]] }],
          tri: [{ pts: [[-1, -0.75], [1.15, -0.75], [-0.35, 1]] }],
          ring: [{ pts: circ(1, 96) }, { pts: circ(0.62, 96, 0, 0, true), hole: true }],
          rod: [{ pts: [[-1.2, -0.06], [1.2, -0.06], [1.2, 0.06], [-1.2, 0.06]] }],
        };
        const shape = v.select('shape', [{ value: 'plate', label: 'plate' }, { value: 'L', label: 'L-plate' }, { value: 'tri', label: 'triangle' }, { value: 'ring', label: 'ring' }, { value: 'rod', label: 'rod' }], 'plate');
        const nS = v.slider('cells across the grid', 6, 64, 24, { int: true });
        const TAUQ = 0.5, TS = 4, B = 1.3;
        const sE = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, axes: false, height: 320, title: 'cells shaded by $r_\\perp^2\\,dm$ (axis $\\perp$ page)' });
        const sR = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: false, height: 320, title: 'the same torque, two axes' });
        const sT = v.stage({ x: [0, TS], y: [0, 2], axes: 'box', gutter: true, height: 150, full: true, xlabel: 't (s)', title: 'angle turned (turns) under $\\tau = 0.5$ N·m from rest' });
        const P = sE.handle(0.6, 0.25, { color: 'gold', label: 'axis', constrain: (x, y) => [clamp(x, -1.35, 1.35), clamp(y, -1.35, 1.35)] });
        const cacheC = memo(); let cur = null;
        const data = () => cacheC(shape.value + '|' + nS.value, () => {
          const parts = SH[shape.value], mo = polyMoments(parts.map((p) => ({ pts: p.pts, rho: 1 }))), C = cells(parts, nS.value, B);
          return { parts, mo, C, cx: mo.Sx / mo.A, cy: mo.Sy / mo.A };
        });
        v.animate((t) => {
          const D = data(), { parts, mo, C } = D, sig = 1 / mo.A;
          const Iex = sig * polarAt(mo, P.x, P.y), Icm = sig * polarAt(mo, D.cx, D.cy);
          let In = 0, rmax = 0; for (let k = 0; k < C.m.length; k++) { const r2 = (C.x[k] - P.x) ** 2 + (C.y[k] - P.y) ** 2; In += C.m[k] * r2; rmax = Math.max(rmax, r2); }
          // left: cells
          const h = C.h;
          for (let k = 0; k < C.m.length; k++) {
            const r2 = (C.x[k] - P.x) ** 2 + (C.y[k] - P.y) ** 2;
            sE.rect(C.x[k] - h / 2, C.y[k] - h / 2, C.x[k] + h / 2, C.y[k] + h / 2, { fill: 'accent', fillAlpha: 0.06 + (0.8 * r2) / rmax, stroke: false });
          }
          if (nS.value <= 32) for (let k = 0; k < C.m.length; k++) sE.rect(C.x[k] - h / 2, C.y[k] - h / 2, C.x[k] + h / 2, C.y[k] + h / 2, { color: 'panel', width: 0.6, alpha: 0.7 });
          for (const p of parts) sE.poly(p.pts, { color: 'ink', width: 1.6 });
          const k = Math.sqrt(Iex);
          sE.circle(P.x, P.y, k, { color: 'green', width: 1.6, dash: [6, 4] });
          sE.line(D.cx, D.cy, P.x, P.y, { color: 'muted', width: 1, dash: [3, 3] });
          sE.dot(D.cx, D.cy, { r: 4, color: 'ink', label: 'CM', labelPos: 'sw' });
          sE.text('k', P.x + k * Math.cos(-0.7), P.y + k * Math.sin(-0.7), { color: 'green', math: true, size: 15, dx: 8, dy: 6 });
          // right: spin-up about the axis and about the CM
          const tt = Math.min(t, TS), thP = (0.5 * TAUQ * tt * tt) / Iex, thC = (0.5 * TAUQ * tt * tt) / Icm;
          const dPC = Math.hypot(P.x - D.cx, P.y - D.cy); let RV = 0.3;
          for (const p of parts) for (const [x, y] of p.pts) RV = Math.max(RV, Math.hypot(x - P.x, y - P.y), Math.hypot(x - D.cx, y - D.cy) + dPC);
          sR.setView([P.x - RV * 1.06, P.x + RV * 1.06], [P.y - RV * 1.06, P.y + RV * 1.06]);
          sR.circle(P.x, P.y, RV, { color: 'faint', width: 1, dash: [2, 4] });
          for (const p of parts) sR.poly(p.pts.map(([x, y]) => rot2(x, y, thP, P.x, P.y)), { color: 'accent', width: 2, fill: p.hole ? 'panel' : 'accent', fillAlpha: p.hole ? 1 : 0.25 });
          for (const p of parts) sR.poly(p.pts.map(([x, y]) => rot2(x, y, thC, D.cx, D.cy)), { color: 'green', width: 1.4, dash: [5, 3] });
          const far = parts[0].pts.reduce((a, q) => (Math.hypot(q[0] - P.x, q[1] - P.y) > Math.hypot(a[0] - P.x, a[1] - P.y) ? q : a));
          const fp = rot2(far[0], far[1], thP, P.x, P.y); sR.line(P.x, P.y, fp[0], fp[1], { color: 'accent', width: 2 });
          sR.dot(P.x, P.y, { r: 5, color: 'gold' }); sR.dot(D.cx, D.cy, { r: 4, color: 'green' });
          sR.corner(`about the axis: ${v.fix(thP / TAU, 2)} turns · about the CM: ${v.fix(thC / TAU, 2)} turns`, 'tl');
          // bottom: angle vs time
          const ymax = Math.max(0.3, (0.5 * TAUQ * TS * TS) / Icm / TAU) * 1.08;
          sT.setView([0, TS], [0, ymax]);
          sT.fn((x) => (0.5 * TAUQ * x * x) / Icm / TAU, { color: 'green', width: 2, dash: [6, 4] });
          sT.fn((x) => (0.5 * TAUQ * x * x) / Iex / TAU, { color: 'accent', width: 2.4 });
          sT.dot(tt, thP / TAU, { r: 4.5, color: 'accent' }); sT.dot(tt, thC / TAU, { r: 4, color: 'green' });
          cur = { In, Iex, Icm, k, n: C.m.length };
        }, { period: TS + 1.2, still: 3 });
        v.legend([['accent', 'about the chosen axis'], ['green', 'about the centre of mass', { dash: true }], ['gold', 'axis', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { In, Iex, Icm, k, n } = cur;
          return String.raw`sum over ${n} cells $\sum r_\perp^2\,\Delta m = ${v.fix(In, 5)}$ kg·m², exact (polygon formula) $${v.fix(Iex, 5)}$ kg·m² (error ${v.fix((100 * (In - Iex)) / Iex, 3)}%) · radius of gyration $k = \sqrt{I/M} = ${v.fix(k, 3)}$ m · torque $0.5$ N·m gives $\dot\omega = \tau/I = ${v.fix(TAUQ / Iex, 3)}$ rad/s², ${v.fix(Iex / Icm, 3)} times slower than about the centre of mass, where $I_{\rm cm} = ${v.fix(Icm, 4)}$ kg·m²`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.3
    {
      num: '10.3',
      kind: 'Theorem',
      name: 'Parallel-axis (Huygens–Steiner) theorem',
      statement: String.raw`Let $I_{\rm cm}$ be the moment of inertia of a body of mass $M$ about an axis through its centre of mass, and let $I_P$ be its moment about a parallel axis a distance $d$ away. Then
$$I_P = I_{\rm cm} + M d^2 .$$
So among all parallel axes, the one through the centre of mass has the smallest moment, and the moment grows as a parabola in the distance. The reference axis must pass through the centre of mass. For two arbitrary parallel axes through points $A$ and $P$, the general relation is $I_P = I_A + M|AP|^2 + 2M\,(\mathbf A - \mathbf P)\cdot(\mathbf C - \mathbf A)$, with all points projected onto a plane perpendicular to the axes and $\mathbf C$ the centre of mass. The cross term vanishes only when $A = C$.`,
      idea: String.raw`Measure positions in the plane perpendicular to the axes from the centre of mass (2.3), and let the axis through $P$ sit at $\mathbf d$. Then $|\mathbf r - \mathbf d|^2 = |\mathbf r|^2 - 2\,\mathbf r\cdot\mathbf d + d^2$, and integrating over the mass (10.2) gives $I_{\rm cm} - 2\,\mathbf d\cdot\int\mathbf r\,dm + Md^2$. The middle integral is $M$ times the position of the centre of mass, which is zero by the choice of origin. Huygens used the result in 1673 to locate the centre of oscillation of a compound pendulum (10.5).`,
      caption: String.raw`Drag the gold axis point over the body; the faint circles are the contours of $I_P$, all centred at the centre of mass. Right: the moment along the line from the centre of mass through your point. Dots are computed directly by summing $|\mathbf r - \mathbf P|^2\,\Delta m$ over thousands of 1 cm cells; the blue curve is the parabola $I_{\rm cm} + Md^2$, lowest exactly at $d = 0$. Switch the reference to another point $A$ (red, draggable) to see the naive formula $I_A + M|AP|^2$ (red dashed) miss.`,
      deps: ['mech-10.2', 'mech-2.3'],
      refs: ['Tong §3.2', 'Taylor §10.3'],
      tags: ['moment of inertia', 'centre of mass', 'parallel axis'],
      credit: 'Huygens, 1673; Steiner, 1840',
      viz(v) {
        const SH = {
          hammer: [{ pts: [[-1.35, -0.07], [0.75, -0.07], [0.75, 0.07], [-1.35, 0.07]], rho: 1 }, { pts: [[0.75, -0.5], [1.15, -0.5], [1.15, 0.5], [0.75, 0.5]], rho: 3.5 }],
          boom: [{ pts: [[-1.2, 0.55], [-1.0, 0.75], [0.15, -0.35], [1.3, 0.75], [1.5, 0.55], [0.15, -0.75]], rho: 1 }],
          holed: [{ pts: [[-1, -1], [1, -1], [1, 1], [-1, 1]], rho: 1 }, { pts: circ(0.5, 80, 0.38, 0.32, true), rho: 1, hole: true }],
        };
        const shape = v.select('body', [{ value: 'hammer', label: 'hammer' }, { value: 'boom', label: 'boomerang' }, { value: 'holed', label: 'plate with a hole' }], 'hammer');
        const ref = v.select('reference axis', [{ value: 'cm', label: 'through the centre of mass' }, { value: 'A', label: 'through another point A' }], 'cm');
        const B = 1.55, N = 310;   // 1 cm cells, aligned with the hammer's edges
        const sE = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 330, title: 'contours of $I_P$ as the axis point moves' });
        const sP = v.stage({ x: [-1.7, 1.7], y: [0, 1], axes: 'box', gutter: true, height: 330, title: '$I$ (kg·m²) against $d$ (m) along the dashed line' });
        const P = sE.handle(0.95, 0.55, { color: 'gold', label: 'P', constrain: (x, y) => [clamp(x, -1.5, 1.5), clamp(y, -1.5, 1.5)] });
        const A = sE.handle(-0.45, -0.4, { color: 'red', label: 'A', constrain: (x, y) => [clamp(x, -1.5, 1.5), clamp(y, -1.5, 1.5)] });
        const cache = memo(); let cur = null;
        const data = () => cache(shape.value, () => {
          const parts = SH[shape.value], mo = polyMoments(parts), C = cells(parts, N, B), sig = 1 / mo.A;
          const cx = mo.Sx / mo.A, cy = mo.Sy / mo.A, Icm = sig * polarAt(mo, cx, cy);
          return { parts, mo, C, sig, cx, cy, Icm };
        });
        const sumI = (C, px, py) => { let s = 0; for (let k = 0; k < C.m.length; k++) s += C.m[k] * ((C.x[k] - px) ** 2 + (C.y[k] - py) ** 2); return s; };
        v.render(() => {
          const D = data(), { parts, C, cx, cy, Icm } = D, useA = ref.value === 'A';
          A.visible = useA;
          const Iex = (x, y) => D.sig * polarAt(D.mo, x, y);
          // left
          for (const p of parts) sE.poly(p.pts, { color: 'ink', width: 1.5, fill: p.hole ? 'panel' : 'accent', fillAlpha: p.hole ? 1 : 0.12 + 0.1 * (p.rho - 1) });
          const lev = [0.1, 0.2, 0.35, 0.5, 0.7, 0.95, 1.25].map((d) => Icm + d * d * 4);
          sE.contour((x, y) => Iex(x, y), lev, { color: 'muted', width: 1, alpha: 0.55 });
          let ux = P.x - cx, uy = P.y - cy; const dP = Math.hypot(ux, uy); if (dP < 1e-6) { ux = 1; uy = 0; } else { ux /= dP; uy /= dP; }
          sE.line(cx - 3 * ux, cy - 3 * uy, cx + 3 * ux, cy + 3 * uy, { color: 'accent', width: 1, dash: [5, 4], alpha: 0.7 });
          sE.measure(cx, cy, P.x, P.y, 'd');
          sE.dot(cx, cy, { r: 4.5, color: 'ink', label: 'CM', labelPos: 'sw' });
          if (useA) { sE.line(A.x, A.y, P.x, P.y, { color: 'red', width: 1.2, dash: [3, 3] }); }
          // right: the parabola and directly summed samples
          const IP = sumI(C, P.x, P.y), IA = sumI(C, A.x, A.y);
          const naiveAt = (d) => IA + (cx + d * ux - A.x) ** 2 + (cy + d * uy - A.y) ** 2;
          const ys = [Icm, IP, Icm + 1.7 * 1.7]; if (useA) ys.push(naiveAt(-1.7), naiveAt(1.7), naiveAt(0)); const top = Math.max(...ys) * 1.08;
          sP.setView([-1.7, 1.7], [0, top]);
          sP.fn((d) => Icm + d * d, { color: 'accent', width: 2.4 });
          sP.hline(Icm, { color: 'faint', dash: [4, 4] });
          sP.tex('I_{\\rm cm}', 0.08, Icm, { color: 'muted', align: 'left', baseline: 'top', dy: 4, size: 13 });
          for (let j = -8; j <= 8; j++) { const d = (1.6 * j) / 8; sP.dot(d, sumI(C, cx + d * ux, cy + d * uy), { r: 3.4, color: 'ink' }); }
          if (useA) {
            // the naive formula along the same line, with A as the reference
            sP.fn(naiveAt, { color: 'red', width: 2, dash: [7, 4] });
          }
          sP.dot(dP, IP, { r: 6, color: 'gold' });
          sP.vline(0, { color: 'faint', width: 1 });
          cur = { IP, Icm, dP, IA, useA, cx, cy, ex: Iex(P.x, P.y) };
        });
        v.legend([['accent', '$I_{\\rm cm} + Md^2$'], ['ink', 'summed over the cells', { dot: true }], ['gold', 'the axis through P', { dot: true }], ['red', '$I_A + M|AP|^2$ (wrong reference)', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { IP, Icm, dP, IA, useA, cx, cy, ex } = cur;
          let out = String.raw`$M = 1$ kg · $d = |CP| = ${v.fix(dP, 3)}$ m · summed $I_P = ${v.fix(IP, 5)}$ kg·m², $I_{\rm cm} + Md^2 = ${v.fix(Icm, 5)} + ${v.fix(dP * dP, 5)} = ${v.fix(Icm + dP * dP, 5)}$ (exact polygon value ${v.fix(ex, 5)}) · smallest at the centre of mass`;
          if (useA) {
            const naive = IA + (P.x - A.x) ** 2 + (P.y - A.y) ** 2, cross = 2 * ((A.x - P.x) * (cx - A.x) + (A.y - P.y) * (cy - A.y));
            out += String.raw` · with $A$: $I_A + M|AP|^2 = ${v.fix(naive, 4)}$ misses $I_P$ by $${num(v, naive - IP, 4)}$; the cross term $2M(\mathbf A - \mathbf P)\cdot(\mathbf C - \mathbf A) = ${num(v, cross, 4)}$ accounts for it exactly`;
          }
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.4
    {
      num: '10.4',
      kind: 'Theorem',
      name: 'Perpendicular-axis theorem',
      statement: String.raw`For a flat lamina lying in the $xy$-plane, the moment of inertia about the $z$-axis (normal to the lamina) is the sum of the moments about two perpendicular axes in its plane that meet the $z$-axis:
$$I_z = I_x + I_y .$$
This holds for every pair of perpendicular in-plane axes through the same point, so $I_{x'} + I_{y'}$ does not depend on how the pair is turned. The lamina must be flat. For a slab of thickness $h$ the two sides differ by $2\int z^2\,dm$, which for a uniform slab is $Mh^2/6$.`,
      idea: String.raw`The distance of a point from the $z$-axis is $\sqrt{x^2+y^2}$, from the $x$-axis $\sqrt{y^2+z^2}$, from the $y$-axis $\sqrt{x^2+z^2}$. So by the definition (10.2), $I_x + I_y - I_z = 2\int z^2\,dm$, which vanishes exactly when all the mass has $z = 0$. Rotating the in-plane axes does not change $x^2 + y^2$, so their sum is fixed. With the parallel-axis theorem (10.3) this gives quick results: a disc has $I_z = \frac12MR^2$, so by symmetry each diameter has $\frac14MR^2$.`,
      caption: String.raw`Drag the five corners to draw a lamina (1 kg). Turn the in-plane axes $x'$ and $y'$ with the slider: their moments change, but the stacked bar $I_{x'} + I_{y'}$ always matches $I_z$. All three are summed over the same cells, here about 2,000 cells in the plane. Now give the lamina a thickness: it becomes a slab (right, drag to rotate), each cell is split into 12 layers, and the theorem fails by $2\sum z^2\,\Delta m \approx Mh^2/6$.`,
      deps: ['mech-10.2'],
      refs: ['Taylor §10.2'],
      tags: ['moment of inertia', 'lamina'],
      viz(v) {
        const phS = v.slider("in-plane axes turned by $\\varphi$ (°)", 0, 180, 25, { step: 1 });
        const hS = v.slider('thickness $h$ (m)', 0, 1.2, 0, { step: 0.01 });
        const sE = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 320, title: 'drag the corners of the lamina' });
        const S3 = v.stage({ x: [-1.65, 1.65], y: [-1.65, 1.65], equal: true, axes: false, height: 320, title: 'the slab and the three axes (drag to rotate)' });
        const sc = v.scene3(S3, { yaw: -0.55, pitch: 0.42, axes: false, hint: false });
        const sB = v.stage({ x: [0, 4], y: [0, 1], axes: false, height: 170, full: true, title: 'moments of inertia (kg·m²)' });
        const init = [[-1.05, -0.6], [0.9, -0.85], [1.15, 0.35], [0.1, 1.05], [-0.9, 0.55]];
        const Hs = init.map(([x, y], i) => sE.handle(x, y, { color: 'accent', constrain: (a, b) => [clamp(a, -1.4, 1.4), clamp(b, -1.4, 1.4)] }));
        let cur = null;
        v.render(() => {
          const poly = Hs.map((h) => [h.x, h.y]), ph = phS.value * DEG, hh = hS.value, NZ = 12, N = 56;
          const c = Math.cos(ph), s = Math.sin(ph);
          // cells in the plane (even–odd), then layers in z
          let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
          for (const [x, y] of poly) { xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); }
          const dx = (xmax - xmin) / N, dy = (ymax - ymin) / N, pts = [];
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x = xmin + (i + 0.5) * dx, y = ymin + (j + 0.5) * dy; if (inPoly(x, y, poly)) pts.push([x, y]); }
          const zs = hh > 0 ? Array.from({ length: NZ }, (_, k) => -hh / 2 + ((k + 0.5) * hh) / NZ) : [0];
          const dm = 1 / (pts.length * zs.length);
          let Ix = 0, Iy = 0, Iz = 0, Z2 = 0;
          for (const [x, y] of pts) {
            const xp = c * x + s * y, yp = -s * x + c * y;
            for (const z of zs) { Ix += dm * (yp * yp + z * z); Iy += dm * (xp * xp + z * z); Iz += dm * (x * x + y * y); Z2 += dm * z * z; }
          }
          const mo = polyMoments([{ pts: poly }]), IzEx = (mo.Xx + mo.Yy) / mo.A, simple = Math.abs(Math.abs(mo.A) - pts.length * dx * dy) < 0.02 * Math.abs(mo.A) + 4 * dx * dy;
          // left: the lamina and the axes
          sE.poly(poly, { color: 'ink', width: 1.6, fill: 'accent', fillAlpha: 0.18 });
          for (const [sg, colr, lab] of [[0, 'teal', "x'"], [1, 'gold', "y'"]]) {
            const ux = sg ? -s : c, uy = sg ? c : s;
            sE.line(-1.6 * ux, -1.6 * uy, 1.6 * ux, 1.6 * uy, { color: colr, width: 2 });
            sE.text(lab, 1.42 * ux, 1.42 * uy, { color: colr, math: true, size: 16, dx: 10, dy: -8 });
          }
          sE.dot(0, 0, { r: 5, color: 'pink' });
          sE.text('z (out of the page)', 0, 0, { color: 'pink', size: 11, dx: 8, dy: 13 });
          // right: the slab
          sc.begin();
          const top = poly.map(([x, y]) => [x, y, hh / 2]), bot = poly.map(([x, y]) => [x, y, -hh / 2]);
          sc.poly(bot, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 1 });
          if (hh > 0) for (let i = 0; i < poly.length; i++) { const j = (i + 1) % poly.length; sc.poly([bot[i], bot[j], top[j], top[i]], { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 0.8, alpha: 0.6 }); }
          sc.poly(top, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.4 });
          sc.arrow([-1.5 * c, -1.5 * s, 0], [1.5 * c, 1.5 * s, 0], { color: 'teal', width: 2 });
          sc.arrow([1.5 * s, -1.5 * c, 0], [-1.5 * s, 1.5 * c, 0], { color: 'gold', width: 2 });
          sc.arrow([0, 0, -1.2], [0, 0, 1.3], { color: 'pink', width: 2 });
          sc.tex("x'", [1.62 * c, 1.62 * s, 0], { color: 'teal' }); sc.tex("y'", [-1.62 * s, 1.62 * c, 0], { color: 'gold' }); sc.tex('z', [0, 0, 1.45], { color: 'pink' });
          sc.flush();
          // bars
          const mx = Math.max(Iz, Ix + Iy) * 1.18 || 1;
          sB.setView([0, 4.2], [0, mx]);
          const bar = (x0, lo, hi, colr, lab) => { sB.rect(x0, lo, x0 + 0.6, hi, { fill: colr, fillAlpha: 0.55, color: colr, width: 1.4 }); if (lab) sB.tex(lab, x0 + 0.3, hi, { color: colr, baseline: 'bottom', dy: -3, size: 14 }); };
          bar(0.25, 0, Ix, 'teal', "I_{x'}"); bar(1.15, 0, Iy, 'gold', "I_{y'}");
          bar(2.2, 0, Ix, 'teal', null); bar(2.2, Ix, Ix + Iy, 'gold', "I_{x'} + I_{y'}");
          bar(3.25, 0, Iz, 'pink', 'I_z');
          sB.line(2.05, Iz, 4.0, Iz, { color: 'pink', width: 1.2, dash: [4, 3] });
          cur = { Ix, Iy, Iz, Z2, hh, IzEx, n: pts.length, simple };
        });
        v.readout(() => {
          if (!cur) return '';
          const { Ix, Iy, Iz, Z2, hh, IzEx, n, simple } = cur;
          const head = String.raw`${n} cells · $I_{x'} = ${v.fix(Ix, 4)}$, $I_{y'} = ${v.fix(Iy, 4)}$, $I_{x'} + I_{y'} = ${v.fix(Ix + Iy, 5)}$, $I_z = ${v.fix(Iz, 5)}$ kg·m² (exact polygon formula ${v.fix(IzEx, 5)})`;
          const warn = simple ? '' : ' · the outline crosses itself, so the cells and the polygon formula disagree';
          if (hh === 0) return head + String.raw` · flat: $I_{x'} + I_{y'} - I_z = ${sci(v, Ix + Iy - Iz)}$ for every $\varphi$` + warn;
          return head + String.raw` · slab of thickness ${v.fix(hh, 2)} m: $I_{x'} + I_{y'} - I_z = ${v.fix(Ix + Iy - Iz, 5)} = 2\sum z^2\Delta m = ${v.fix(2 * Z2, 5)}$, vs $Mh^2/6 = ${v.fix((hh * hh) / 6, 5)}$ for a continuous slab — the theorem fails` + warn;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.5
    {
      num: '10.5',
      kind: 'Model',
      name: 'Physical pendulum',
      statement: String.raw`A rigid body of mass $M$ swinging under gravity about a horizontal axis through a pivot $P$, a distance $d$ from its centre of mass, obeys
$$I_P\,\ddot\varphi = -Mgd\sin\varphi, \qquad I_P = M\left(k^2 + d^2\right),$$
where $k$ is the radius of gyration about the centre of mass. The motion is exactly that of a simple pendulum of length $L = d + k^2/d$, so for small swings the period is
$$T = 2\pi\sqrt{\frac{k^2 + d^2}{g\,d}} .$$
As a function of $d$ the period is shortest at $d = k$. Every other value of $T$ is reached at two pivot distances $d$ and $d' = k^2/d$. The point at $d'$ on the far side of the centre of mass is the **centre of oscillation**: hanging the body from it gives the same period. Kater’s reversible pendulum (1817) uses this to measure $g = 4\pi^2 L/T^2$ from a period and the measurable distance $L = d + d'$ between two knife edges.`,
      idea: String.raw`Torque about the pivot is $-Mgd\sin\varphi$ and angular momentum is $I_P\dot\varphi$ (10.2), with $I_P = M(k^2+d^2)$ by the parallel-axis theorem (10.3). Dividing by $Md$ gives $L\ddot\varphi = -g\sin\varphi$ with $L = (k^2+d^2)/d$, the simple-pendulum equation (4.4) at every amplitude. So the large-amplitude period is the pendulum’s, $T = \frac{4}{\omega_0}K(\sin^2\frac{\varphi_0}{2})$ with $\omega_0^2 = g/L$. Since $L(d) = L(k^2/d)$, the length, and with it the period, is unchanged when $d$ is replaced by $k^2/d$; and $L$ is smallest, $2k$, at $d = k$.`,
      caption: String.raw`Drag the gold handle along the period curve, or use the slider, to move the pivot along a 1 m bar. The bar swings beside the equivalent simple pendulum (green): they move together at every amplitude. The hollow ring on the bar is the centre of oscillation, $d' = k^2/d$ below the centre of mass. Tick the box to hang the bar from that ring instead, and the measured period stays the same. Raise the amplitude to see the period grow above the small-angle value.`,
      deps: ['mech-10.3', 'mech-4.4'],
      refs: ['Taylor §10.2'],
      tags: ['pendulum', 'moment of inertia', 'Kater'],
      credit: 'Huygens, 1673; Kater, 1817',
      scope: String.raw`Holds for a rigid body on a frictionless horizontal axis in uniform gravity; the small-angle period needs amplitudes of a few degrees for 0.1% accuracy.`,
      viz(v) {
        const g = 9.81, ELL = 1, k = ELL / Math.sqrt(12), T_SIM = 12, DT = 0.002;
        const dS = v.slider('pivot distance $d$ (m)', 0.03, 0.5, 0.42, { step: 0.001 });
        const aS = v.slider('amplitude $\\varphi_0$ (°)', 2, 170, 20, { step: 1 });
        const flip = v.toggle('hang it from the centre of oscillation', false);
        const PX = 0.62;   // the equivalent simple pendulum hangs from its own support at x = PX
        const sW = v.stage({ x: [-0.62, 1.12], y: [-1.12, 0.56], equal: true, axes: false, height: 340, title: 'the bar and its equivalent simple pendulum' });
        const sT = v.stage({ x: [0, 0.8], y: [1.4, 3.6], axes: 'box', gutter: true, height: 340, title: 'small-angle period $T$ (s) against the pivot distance $d$ (m)' });
        const Tof = (d) => TAU * Math.sqrt((k * k + d * d) / (g * d));
        const Hd = sT.handle(dS.value, Tof(dS.value), { color: 'gold', constrain: (x) => { const d = clamp(x, 0.03, 0.5); return [d, Tof(d)]; }, onDrag: () => dS.set(+Hd.x.toFixed(3)) });
        const cache = memo(); let cur = null;
        const run = () => cache([dS.value, aS.value, flip.value].join('|'), () => {
          const d0 = dS.value, dc = (k * k) / d0, d = flip.value ? dc : d0, L = (k * k + d * d) / d, a0 = aS.value * DEG;
          const R = rk4rec((t, y) => [y[1], -(g / L) * Math.sin(y[0])], [a0, 0], T_SIM, Math.round(T_SIM / DT), 5);
          const ups = []; for (let i = 1; i < R.y.length; i++) { const a = R.y[i - 1][0], b = R.y[i][0]; if (a < 0 && b >= 0) ups.push(R.t[i - 1] + (R.dt * -a) / (b - a)); }
          const per = ups.length >= 2 ? (ups[ups.length - 1] - ups[0]) / (ups.length - 1) : NaN;
          const T0 = TAU * Math.sqrt(L / g), Tex = (4 / Math.sqrt(g / L)) * ellK(Math.sin(a0 / 2) ** 2);
          return { R, d0, dc, d, L, per, T0, Tex };
        });
        v.animate((t) => {
          const B = run(), R = B.R, i = idxAt(R, t % T_SIM), ph = R.y[i][0];
          if (!Hd.dragging) { Hd.x = dS.value; Hd.y = Tof(dS.value); }
          const u = [Math.sin(ph), -Math.cos(ph)], pt = (s2) => [s2 * u[0], s2 * u[1]];   // distance s2 along the bar, measured from the pivot toward the CM
          // the bar runs from s = d − ℓ/2 to s = d + ℓ/2 (CM at s = d)
          const s0 = B.d - ELL / 2, s1 = B.d + ELL / 2, w = 0.035, nx = -u[1], ny = u[0];
          const corners = [[s0, -w], [s1, -w], [s1, w], [s0, w]].map(([s2, o]) => [s2 * u[0] + o * nx, s2 * u[1] + o * ny]);
          sW.clip(() => {
            // equivalent simple pendulum, on its own support
            const bob = pt(B.L);
            sW.line(PX, 0, PX + bob[0], bob[1], { color: 'green', width: 1.6 });
            sW.dot(PX + bob[0], bob[1], { r: 7, color: 'green' });
            // a light arm when the pivot lies beyond the bar
            if (s0 > 0) sW.line(0, 0, s0 * u[0], s0 * u[1], { color: 'muted', width: 1.4 });
            sW.poly(corners, { fill: 'accent', fillAlpha: 0.28, color: 'accent', width: 1.6 });
            for (let j = 0; j <= 20; j++) { const q = pt(s0 + (ELL * j) / 20); sW.circle(q[0], q[1], 0.008, { color: 'accent', width: 1, alpha: 0.6 }); }
            const cm = pt(B.d); sW.dot(cm[0], cm[1], { r: 4, color: 'ink' });
            const oc = pt(B.d + (k * k) / B.d); sW.circle(oc[0], oc[1], 0.035, { color: 'gold', width: 2.2 });
          });
          for (const x0 of [0, PX]) { sW.line(x0 - 0.12, 0.07, x0 + 0.12, 0.07, { color: 'muted', width: 3 }); sW.poly([[x0, 0], [x0 - 0.06, 0.07], [x0 + 0.06, 0.07]], { fill: 'muted', fillAlpha: 0.6, color: 'muted' }); }
          sW.dot(0, 0, { r: 4, color: 'gold' }); sW.dot(PX, 0, { r: 3, color: 'green' });
          sW.text('bar', -0.15, 0.07, { color: 'accent', size: 11, align: 'right' }); sW.text('simple pendulum', PX, 0.07, { color: 'green', size: 11, dy: -10, align: 'center' });
          sW.corner(B.L > 1.05 ? `length ${v.fix(B.L, 2)} m: bob below the panel` : `length d + k²/d = ${v.fix(B.L, 3)} m`, 'br', { color: 'green' });
          // period curve
          sT.fn(Tof, { domain: [0.02, 0.8], color: 'accent', width: 2.4 });
          sT.vline(k, { color: 'faint', dash: [4, 4] }); sT.text('k', k, 1.48, { color: 'muted', math: true, dx: 6 });
          const T0 = Tof(B.d0);
          if (B.dc <= 0.8) { sT.line(B.d0, T0, B.dc, T0, { color: 'gold', width: 1.2, dash: [4, 3] }); sT.dot(B.dc, T0, { r: 6, color: 'gold', hollow: true }); }
          if (isFinite(B.per)) sT.dot(B.d, B.per, { r: 4.5, color: Math.abs(B.per / B.T0 - 1) > 0.005 ? 'red' : 'ink' });
          cur = B;
        }, { period: T_SIM, still: 0.6 });
        v.legend([['accent', 'bar and $T(d)$'], ['green', 'simple pendulum of length $d + k^2/d$'], ['gold', 'pivot / centre of oscillation', { dot: true }], ['red', 'measured period at this amplitude', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur;
          const where = flip.value ? String.raw`hanging from the centre of oscillation, $d' = k^2/d = ${v.fix(B.dc, 4)}$ m${B.dc > 0.5 ? ' (beyond the bar, on a light arm)' : ''}` : String.raw`pivot $d = ${v.fix(B.d0, 3)}$ m from the centre of mass, centre of oscillation $d' = k^2/d = ${v.fix(B.dc, 4)}$ m on the other side`;
          return where + String.raw` · $I_P = M(k^2 + d^2)$ with $k = \ell/\sqrt{12} = ${v.fix(k, 4)}$ m · measured period ${isFinite(B.per) ? v.fix(B.per, 4) : '—'} s; small-angle $2\pi\sqrt{(k^2+d^2)/gd} = ${v.fix(B.T0, 4)}$ s; exact for $\varphi_0 = ${aS.value}°$: $${v.fix(B.Tex, 4)}$ s · $d + d' = ${v.fix(B.d0 + B.dc, 4)}$ m $= L$, and $4\pi^2L/T_0^2 = ${v.fix((4 * Math.PI ** 2 * B.L) / B.T0 ** 2, 4)}$ m/s² recovers $g$ · shortest period ${v.fix(Tof(k), 4)} s at $d = k$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.6
    {
      num: '10.6',
      kind: 'Model',
      name: 'Rolling without slipping',
      statement: String.raw`A round body of mass $M$, radius $R$ and moment of inertia $I = \beta MR^2$ about its axis rolls without slipping when its contact point is momentarily at rest, $v = \omega R$. On an incline of angle $\theta$ it then accelerates at
$$a = \frac{g\sin\theta}{1 + I/MR^2} = \frac{g\sin\theta}{1+\beta},$$
independently of its mass and size. So a solid sphere ($\beta = \tfrac25$) beats a disc ($\tfrac12$), which beats a hoop ($1$), and all lose to a frictionless sliding block. Static friction supplies the torque. Rolling requires a friction force $f = Mg\sin\theta\,\beta/(1+\beta)$, which is possible only if
$$\mu \ge \frac{\beta}{1+\beta}\tan\theta .$$
Otherwise the body skids: it accelerates at $g(\sin\theta - \mu\cos\theta)$ while kinetic friction spins it up more slowly, and energy is dissipated. While it rolls, the friction does no work, and a fraction $\beta/(1+\beta)$ of the kinetic energy is rotational.`,
      idea: String.raw`Newton’s law for the centre of mass, $Ma = Mg\sin\theta - f$, and the torque law about it, $I\dot\omega = fR$ (2.9 with 10.2), together with the constraint $a = R\dot\omega$, give $f = Ia/R^2$ and the acceleration above. Energy says the same: by König’s theorem (3.7) the kinetic energy splits into $\tfrac12Mv^2 + \tfrac12I\omega^2 = \tfrac12(1+\beta)Mv^2$, and the drop in height must pay for both. The friction law (1.15) caps $f$ at $\mu N = \mu Mg\cos\theta$, which gives the condition for rolling.`,
      caption: String.raw`Four bodies start together (slowed down 2.5 times). A frictionless block (grey), a solid sphere, a disc and a hoop run on identical inclines, each in its own lane. The spokes show the spin. Change the slope and the friction coefficient: with enough friction the finishing order follows $1 + I/MR^2$ and the measured accelerations match the formula. Lower $\mu$ below a body’s threshold and it skids: it goes faster, its spokes lag behind the rolling rate, and part of its energy goes into heat. Right: distance against time, with dashed curves for ideal rolling.`,
      deps: ['mech-10.2', 'mech-3.7', 'mech-1.15'],
      refs: ['Goldstein §2.4', 'Taylor ch. 10'],
      tags: ['rolling', 'friction', 'moment of inertia'],
      credit: 'Galileo’s inclined-plane experiments, 1604–1638',
      scope: String.raw`Holds for rigid bodies on a rigid incline; real rolling also loses a little energy to rolling resistance from the deformation of the contact.`,
      viz(v) {
        const g = 9.81, D = 2, R = 0.13, GAP = 0.5;
        const BODIES = [{ name: 'frictionless block', beta: 0, color: 'muted' }, { name: 'solid sphere', beta: 0.4, color: 'blue' }, { name: 'disc', beta: 0.5, color: 'teal' }, { name: 'hoop', beta: 1, color: 'orange' }];
        const thS = v.slider('incline angle $\\theta$ (°)', 3, 60, 25, { step: 0.5 });
        const muS = v.slider('friction coefficient $\\mu$', 0, 0.8, 0.4, { step: 0.005 });
        const sL = v.stage({ x: [-0.6, 3], y: [-1.5, 1.6], equal: true, axes: false, height: 330, title: 'four lanes, one incline angle' });
        const sX = v.stage({ x: [0, 2], y: [0, D * 1.08], axes: 'box', gutter: true, height: 330, xlabel: 't (s)', title: 'distance down the slope (m)' });
        const motion = () => {
          const th = thS.value * DEG, mu = muS.value;
          return BODIES.map((b) => {
            const muc = b.beta === 0 ? 0 : (b.beta / (1 + b.beta)) * Math.tan(th);
            let a, al, rolls;
            if (b.beta === 0) { a = g * Math.sin(th); al = 0; rolls = false; }
            else if (mu >= muc) { a = (g * Math.sin(th)) / (1 + b.beta); al = a / R; rolls = true; }
            else { a = g * (Math.sin(th) - mu * Math.cos(th)); al = (mu * g * Math.cos(th)) / (b.beta * R); rolls = false; }
            const tf = Math.sqrt((2 * D) / a), aRoll = (g * Math.sin(th)) / (1 + b.beta);
            const v1 = a * tf, w1 = al * tf, KEt = 0.5 * v1 * v1, KEr = 0.5 * b.beta * R * R * w1 * w1, drop = g * D * Math.sin(th);
            return { ...b, muc, a, al, rolls, tf, aRoll, KEt, KEr, heat: b.beta === 0 ? 0 : drop - KEt - KEr, drop };
          });
        };
        let cur = null;
        v.animate((t) => {
          const th = thS.value * DEG, Bs = motion(), tmax = Math.max(...Bs.map((b) => b.tf));
          const u = [Math.cos(th), -Math.sin(th)], nv = [Math.sin(th), Math.cos(th)];
          // fit the lanes into the view
          const ptsBB = []; for (let k = 0; k < 4; k++) for (const s of [-0.25, D + 0.3]) for (const o of [-0.12, 2 * R + 0.15]) ptsBB.push([s * u[0] + (k * GAP + o) * nv[0], s * u[1] + (k * GAP + o) * nv[1]]);
          ptsBB.push([-0.25 * u[0] - 1.05, -0.25 * u[1]]);   // room for the lane names
          const xs = ptsBB.map((p) => p[0]), ys = ptsBB.map((p) => p[1]);
          sL.setView([Math.min(...xs) - 0.1, Math.max(...xs) + 0.1], [Math.min(...ys) - 0.1, Math.max(...ys) + 0.12]);
          const at = (k, s, o) => [s * u[0] + (k * GAP + o) * nv[0], s * u[1] + (k * GAP + o) * nv[1]];
          Bs.forEach((b, k) => {
            const A0 = at(k, -0.2, 0), A1 = at(k, D + 0.25, 0), A2 = at(k, D + 0.25, -0.06), A3 = at(k, -0.2, -0.06);
            sL.poly([A0, A1, A2, A3], { fill: 'faint', fillAlpha: 0.35, stroke: false });
            sL.line(A0[0], A0[1], A1[0], A1[1], { color: 'muted', width: 1.6 });
            const lab = at(k, -0.24, 0.02); sL.text(b.name.replace('frictionless ', ''), lab[0], lab[1], { color: b.color, size: 11.5, align: 'right', dx: -4 });
            const tt = Math.min(t, b.tf), s = 0.5 * b.a * tt * tt, phi = 0.5 * b.al * tt * tt, c = at(k, s, R);
            if (b.beta === 0) {
              const q = [[-R, 0], [R, 0], [R, 2 * R], [-R, 2 * R]].map(([p, o]) => at(k, s + p, o));
              sL.poly(q, { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1.5 });
            } else {
              sL.circle(c[0], c[1], R, { fill: b.color, fillAlpha: b.beta === 1 ? 0.06 : 0.28, color: b.color, width: b.beta === 1 ? 3.2 : 1.6 });
              for (let j = 0; j < 3; j++) { const a2 = -phi + (j * TAU) / 3 + th; sL.line(c[0], c[1], c[0] + R * Math.cos(a2), c[1] + R * Math.sin(a2), { color: b.color, width: 1.6 }); }
              if (!b.rolls && tt > 0) sL.text('skids', c[0], c[1], { color: 'red', size: 10.5, dy: -(R * (sL.X(1) - sL.X(0)) + 11), align: 'center' });
            }
          });
          const F0 = at(0, D + R, -0.1), F1 = at(3, D + R, 2 * R + 0.1);
          sL.line(F0[0], F0[1], F1[0], F1[1], { color: 'gold', width: 2, dash: [6, 4] });
          // angle mark at the bottom lane
          const o0 = at(0, D + 0.25, 0);
          const arc = []; for (let j = 0; j <= 20; j++) { const a2 = Math.PI - (th * j) / 20; arc.push([o0[0] + 0.32 * Math.cos(a2), o0[1] + 0.32 * Math.sin(a2)]); }
          sL.line(o0[0], o0[1], o0[0] - 0.55, o0[1], { color: 'faint', width: 1 }); sL.path(arc, { color: 'muted', width: 1.2 });
          // distance vs time
          sX.setView([0, tmax * 1.05], [0, D * 1.08]);
          sX.hline(D, { color: 'gold', dash: [6, 4] });
          for (const b of Bs) {
            if (b.beta > 0) sX.fn((x) => Math.min(D, 0.5 * b.aRoll * x * x), { domain: [0, tmax * 1.05], color: b.color, width: 1.2, dash: [5, 4], alpha: 0.8 });
            sX.fn((x) => (x <= b.tf ? 0.5 * b.a * x * x : NaN), { domain: [0, b.tf], color: b.color, width: 2.4 });
            const tt = Math.min(t, b.tf); sX.dot(tt, 0.5 * b.a * tt * tt, { r: 4.5, color: b.color });
          }
          cur = { Bs, t };
        }, { period: 4.5, speed: 0.4, still: 1.25 });
        v.legend(BODIES.map((b) => [b.color, `${b.name}${b.beta ? ` ($I = ${b.beta === 0.4 ? '\\tfrac25' : b.beta === 0.5 ? '\\tfrac12' : ''}MR^2$)` : ''}`]).concat([['ink', 'ideal rolling', { dash: true }]]));
        v.readout(() => {
          if (!cur) return '';
          const { Bs } = cur, mu = muS.value, order = Bs.slice().sort((a, b) => a.tf - b.tf).map((b) => b.name.replace('frictionless ', '')).join(' → ');
          const parts = Bs.filter((b) => b.beta > 0).map((b) => String.raw`${b.name}: $a = ${v.fix(b.a, 3)}$ m/s² (${b.rolls ? String.raw`rolls; $g\sin\theta/(1+\beta) = ${v.fix(b.aRoll, 3)}$` : String.raw`skids, since $\mu < ${v.fix(b.muc, 3)}$; heat ${v.fix((100 * b.heat) / b.drop, 1)}% of $Mgh$`}, rotational share ${v.fix((100 * b.KEr) / (b.KEt + b.KEr), 1)}%)`);
          return String.raw`finishing order: ${order} · block $a = g\sin\theta = ${v.fix(Bs[0].a, 3)}$ m/s² · ` + parts.join(' · ') + String.raw` · rolling needs $\mu \ge \frac{\beta}{1+\beta}\tan\theta$; here $\mu = ${v.fix(mu, 3)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 10.7
    {
      num: '10.7',
      kind: 'Definition',
      name: 'Inertia tensor',
      statement: String.raw`For a rigid body turning with angular velocity $\boldsymbol\omega$ about a fixed point $O$ (or about its centre of mass), the angular momentum $\mathbf L = \sum m\,\mathbf r\times(\boldsymbol\omega\times\mathbf r)$ is a linear function of $\boldsymbol\omega$:
$$\mathbf L = \mathsf I\,\boldsymbol\omega, \qquad I_{jk} = \sum m\left(r^2\delta_{jk} - r_j r_k\right).$$
The **inertia tensor** $\mathsf I$ is a symmetric $3\times3$ matrix. Its diagonal entries $I_{xx} = \sum m(y^2+z^2)$, … are the moments of inertia about the coordinate axes (10.2), and its off-diagonal entries $I_{xy} = -\sum mxy$, … are the products of inertia. In general $\mathbf L$ is **not** parallel to $\boldsymbol\omega$. The kinetic energy is $T = \tfrac12\boldsymbol\omega\cdot\mathsf I\boldsymbol\omega$, and the moment about any axis $\hat{\mathbf n}$ through $O$ is $\hat{\mathbf n}\cdot\mathsf I\hat{\mathbf n}$. If the body turns, its tensor in fixed axes changes as $\mathsf I(t) = \mathsf R\,\mathsf I_0\,\mathsf R^{\mathsf T}$. So even at constant $\boldsymbol\omega$ the vector $\mathbf L$ turns, and the bearings must supply the torque $\boldsymbol\tau = \boldsymbol\omega\times\mathbf L$.`,
      idea: String.raw`Every point of the body moves with velocity $\boldsymbol\omega\times\mathbf r$ (9.4). Expanding the triple product, $\mathbf r\times(\boldsymbol\omega\times\mathbf r) = r^2\boldsymbol\omega - (\mathbf r\cdot\boldsymbol\omega)\mathbf r$, which is linear in $\boldsymbol\omega$ with matrix $r^2\mathsf I - \mathbf r\mathbf r^{\mathsf T}$; summing over the masses gives $\mathsf I$. The second term is why $\mathbf L$ tilts away from $\boldsymbol\omega$: mass off the axis but not symmetric about it contributes angular momentum sideways. A vector carried by the body changes at the rate $\boldsymbol\omega\times\mathbf L$, and by the torque law (2.9) something must supply that rate. That is why an unbalanced wheel shakes its axle.`,
      caption: String.raw`Drag the tip of $\boldsymbol\omega$ (blue). The body spins about that axis, held by bearings (the two grey rings); the right panel looks straight down the axis. Purple: $\mathbf L$ summed directly over the masses, $\sum m\,\mathbf r\times\mathbf v$; it generally points away from $\boldsymbol\omega$, sweeps a cone (faint purple) and needs the bearing torque $\boldsymbol\omega\times\mathbf L$ (orange), which keeps turning the sideways part $\mathbf L_\perp$ around with the body. Green arrows are the velocities of the masses. Try the three bodies and look for directions where $\mathbf L$ and $\boldsymbol\omega$ line up: there the cone collapses and the torque vanishes (10.8).`,
      deps: ['mech-10.2', 'mech-9.4', 'mech-2.9'],
      refs: ['Taylor §10.3', 'Goldstein §5.3'],
      tags: ['inertia tensor', 'angular momentum', 'rigid body'],
      viz(v) {
        const body = v.select('body', [{ value: 'dumb', label: 'tilted dumbbell' }, { value: 'frame', label: 'bent frame' }, { value: 'book', label: 'book' }], 'dumb');
        const S = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, axes: false, height: 360, title: 'spinning about $\\boldsymbol\\omega$ on fixed bearings (drag to rotate)' });
        const sc = v.scene3(S, { yaw: -0.2, pitch: 0.22, axis: 1.3, lim: 1.7, hint: false });
        const sD = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 360, title: 'looking down $\\boldsymbol\\omega$: the sideways part $\\mathbf L_\\perp$' });
        const W = sc.handle([0.25, -0.15, 1.15], { color: 'accent', label: '$\\boldsymbol\\omega$' });
        const BH = [0.95, 0.62, 0.16], RT = rotAxis(unit([1, 2, 0.6]), 0.75);
        const BODY = {
          dumb: () => { const e = unit([Math.cos(0.6), 0.25, Math.sin(0.6)]); return { m: [1, 1], r: [scl(e, 0.85), scl(e, -0.85)], rods: [[0, 1]] }; },
          frame: () => { const r = [[-0.7, -0.35, -0.15], [0.55, -0.35, -0.15], [0.55, 0.45, -0.15], [0.55, 0.45, 0.7]], m = [1, 0.7, 0.7, 1.2]; const M = m.reduce((a, b) => a + b, 0); const c = [0, 1, 2].map((j) => r.reduce((s, p, i) => s + m[i] * p[j], 0) / M); return { m, r: r.map((p) => sub(p, c)), rods: [[0, 1], [1, 2], [2, 3]] }; },
          book: () => { const r = [], m = []; for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) for (let k = 0; k < 2; k++) { r.push(mv(RT, [BH[0] * (-1 + (2 * i + 1) / 7), BH[1] * (-1 + (2 * j + 1) / 5), BH[2] * (-1 + (2 * k + 1) / 2)])); m.push(2 / 70); } return { m, r, rods: [] }; },
        };
        const drawBoxPts = (R, h) => { const c = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) c.push(mv(R, [x * h[0], y * h[1], z * h[2]])); return c; };
        const tensor = (B, R) => { const T = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; B.r.forEach((p0, i) => { const p = mv(R, p0), r2 = dot(p, p); for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) T[a][b] += B.m[i] * ((a === b ? r2 : 0) - p[a] * p[b]); }); return T; };
        const Ldirect = (B, R, w) => B.r.reduce((L, p0, i) => { const p = mv(R, p0); return madd(L, crs(p, crs(w, p)), B.m[i]); }, [0, 0, 0]);
        let cur = null;
        v.animate((t) => {
          const B = BODY[body.value](), w = W.p, wn = nrm(w), wh = unit(w), R = rotAxis(wh, wn * t);
          const L = Ldirect(B, R, w), It = tensor(B, R), Lm = mv(It, w), tq = crs(w, L);
          const h = 1e-4, Lp = Ldirect(B, rotAxis(wh, wn * (t + h)), w), Lq = Ldirect(B, rotAxis(wh, wn * (t - h)), w), dL = scl(sub(Lp, Lq), 1 / (2 * h));
          const KL = 0.75 / Math.max(0.6, nrm(Lm) / Math.max(wn, 1e-9));
          sc.begin();
          // bearings and axis
          sc.line(scl(wh, -1.75), scl(wh, 1.75), { color: 'accent', width: 1, dash: [6, 5], alpha: 0.6 });
          const a = unit(crs(wh, Math.abs(wh[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0])), b = crs(wh, a);
          for (const sgn of [-1, 1]) sc.path(circlePts(scl(wh, 1.55 * sgn), a, b, 0.11, 24), { color: 'muted', width: 2.5 });
          // L cone over one turn
          const cone = []; for (let j = 0; j <= 48; j++) cone.push(scl(Ldirect(B, rotAxis(wh, (TAU * j) / 48), w), KL));
          sc.path(cone, { color: 'purple', width: 1.1, alpha: 0.45 });
          if (body.value === 'book') drawBox(sc, mm(R, RT), BH, { fillAlpha: 0.22 });
          for (const [i, j] of B.rods) sc.line(mv(R, B.r[i]), mv(R, B.r[j]), { color: 'ink', width: 2.4, alpha: 0.75 });
          B.r.forEach((p0, i) => {
            const p = mv(R, p0);
            if (body.value !== 'book') { sc.dot(p, { r: 5 + 4 * B.m[i], color: 'ink', top: false }); sc.arrow(p, madd(p, crs(w, p), 0.35), { color: 'green', width: 1.8, head: 7 }); }
            else if (i % 9 === 0) sc.arrow(p, madd(p, crs(w, p), 0.35), { color: 'green', width: 1.4, head: 6 });
          });
          sc.arrow([0, 0, 0], w, { color: 'accent', width: 3 });
          sc.arrow([0, 0, 0], scl(L, KL), { color: 'purple', width: 3 });
          sc.tex('\\mathbf L', scl(L, KL * 1.12), { color: 'purple', size: 16 });
          if (nrm(tq) * KL > 0.02) { sc.arrow([0, 0, 0], scl(tq, KL * 0.8), { color: 'orange', width: 2.6 }); sc.tex('\\boldsymbol\\tau', scl(tq, KL * 0.92), { color: 'orange', size: 15, dx: 8 }); }
          sc.flush();
          // looking down the axis: components in the plane ⟂ ω
          const pa = (p) => [dot(p, a), dot(p, b)], Lq2 = pa(L), Lperp = Math.hypot(Lq2[0], Lq2[1]), KD = 0.85 / Math.max(0.35, nrm(L));
          sD.circle(0, 0, Lperp * KD, { color: 'purple', width: 1, dash: [4, 4], alpha: 0.7 });
          for (const [i, j] of B.rods) { const p = pa(mv(R, B.r[i])), q = pa(mv(R, B.r[j])); sD.line(p[0], p[1], q[0], q[1], { color: 'ink', width: 2, alpha: 0.6 }); }
          if (body.value === 'book') sD.poly(v.M.hull(drawBoxPts(mm(R, RT), BH).map(pa)), { color: 'muted', width: 1.4, fill: 'accent', fillAlpha: 0.1 });
          B.r.forEach((p0, i) => { const q = pa(mv(R, p0)); if (body.value !== 'book') sD.dot(q[0], q[1], { r: 4 + 3 * B.m[i], color: 'ink' }); });
          sD.dot(0, 0, { r: 4, color: 'accent' });
          sD.arrow(0, 0, Lq2[0] * KD, Lq2[1] * KD, { color: 'purple', width: 2.8 });
          const tp = pa(tq);
          if (Math.hypot(tp[0], tp[1]) * KD > 0.02) sD.arrow(Lq2[0] * KD, Lq2[1] * KD, (Lq2[0] + 0.5 * tp[0]) * KD, (Lq2[1] + 0.5 * tp[1]) * KD, { color: 'orange', width: 2.4 });
          sD.tex('\\mathbf L_\\perp', Lq2[0] * KD * 0.55, Lq2[1] * KD * 0.55, { color: 'purple', dx: 12, dy: -10, size: 15 });
          sD.corner(`$|\\mathbf L_\\perp| = ${v.fix(Lperp, 3)}$, turning with the body`, 'bl', { color: 'purple' });
          cur = { It, L, Lm, w, tq, dL };
        }, { period: 1e9, still: 2.8 });
        v.legend([['accent', '$\\boldsymbol\\omega$'], ['purple', '$\\mathbf L = \\sum m\\,\\mathbf r\\times\\mathbf v$ and its cone'], ['orange', 'bearing torque $\\boldsymbol\\omega\\times\\mathbf L$'], ['green', 'velocities $\\boldsymbol\\omega\\times\\mathbf r$']]);
        v.readout(() => {
          if (!cur) return '';
          const { It, L, Lm, w, tq, dL } = cur, f = (x) => v.fix(x, 3);
          const mat = String.raw`\begin{pmatrix} ${It.map((r) => r.map(f).join(' & ')).join(String.raw` \\ `)} \end{pmatrix}`;
          return String.raw`$\mathsf I = ${mat}$ kg·m² (now, in fixed axes) · $\mathbf L$ summed over the masses vs $\mathsf I\boldsymbol\omega$: difference $${sci(v, nrm(sub(L, Lm)))}$ · angle between $\mathbf L$ and $\boldsymbol\omega$: ${v.fix(angle(L, w) / DEG, 2)}° · bearing torque $|\boldsymbol\omega\times\mathbf L| = ${v.fix(nrm(tq), 4)}$ N·m; measured $|d\mathbf L/dt|$ (finite difference) $= ${v.fix(nrm(dL), 4)}$ N·m`;
        });
      },
    },
  ],
};
