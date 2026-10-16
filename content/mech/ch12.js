// Classical Mechanics — Chapter 12: Hamiltonian mechanics (part a: 12.2–12.9)

import { TAU, DEG, clamp, memo, sci, num, rk4, rk4rec, idxAt, wrap, upCrossings, pendH, pendInfo, pendStep, piTicks, rightAngle, arrowPx, series, drawPendulum } from './ch12.shared.js';

/** Break a (q, p) path into pieces where the wrapped angle jumps across the window edge. */
function wrappedPath(pts) {
  const out = []; let prev = null;
  for (const [q, p] of pts) { const w = wrap(q); if (prev !== null && Math.abs(w - prev) > Math.PI) out.push(null); out.push([w, p]); prev = w; }
  return out;
}
/** Central-difference partial derivatives of f(q, p). */
const dq = (f, q, p, h = 1e-4) => (f(q + h, p) - f(q - h, p)) / (2 * h);
const dp = (f, q, p, h = 1e-4) => (f(q, p + h) - f(q, p - h)) / (2 * h);

// polynomials in (q, p) as coefficient grids c[i][j] of qⁱpʲ (used by 12.8)
const PN = 12;
const pz = () => Array.from({ length: PN }, () => new Array(PN).fill(0));
const pD = (A, wrt) => { const B = pz(); for (let i = 0; i < PN; i++) for (let j = 0; j < PN; j++) { if (!A[i][j]) continue; if (wrt === 'q' && i) B[i - 1][j] += i * A[i][j]; if (wrt === 'p' && j) B[i][j - 1] += j * A[i][j]; } return B; };
const pMul = (A, B) => { const C = pz(); for (let i = 0; i < PN; i++) for (let j = 0; j < PN; j++) if (A[i][j]) for (let k = 0; i + k < PN; k++) for (let l = 0; j + l < PN; l++) if (B[k][l]) C[i + k][j + l] += A[i][j] * B[k][l]; return C; };
const pLin = (A, B, s = 1) => A.map((r, i) => r.map((x, j) => x + s * B[i][j]));
const pEval = (A, q, p) => { let s = 0; for (let i = PN - 1; i >= 0; i--) { let r = 0; for (let j = PN - 1; j >= 0; j--) r = r * p + A[i][j]; s = s * q + r; } return s; };

export default {
  collection: 'mech',
  chapter: 12,
  title: 'Hamiltonian mechanics',
  summary: String.raw`The Legendre transform trades velocities for momenta and the Lagrangian for the Hamiltonian, turning the dynamics into a first-order flow on phase space. Poisson brackets encode that flow algebraically, canonical transformations change coordinates without spoiling it, and conserved quantities generate symmetries. Liouville’s theorem — the flow preserves phase-space volume — underlies statistical mechanics and the good long-time behaviour of symplectic integrators. For integrable systems, action–angle variables turn the motion into uniform rotation on invariant tori, separation of variables in the Hamilton–Jacobi equation finds them, the action is an adiabatic invariant (with a geometric Hannay angle left over), and canonical perturbation theory computes how the frequencies shift. Routh’s procedure and Liouville’s equation for densities round out the toolkit.`,
  items: [
    // ───────────────────────────────────────────────────────────── 12.2
    {
      num: '12.2',
      kind: 'Definition',
      name: 'The Hamiltonian',
      statement: String.raw`Let $L(q, \dot q, t)$ be a Lagrangian whose Hessian $\partial^2L/\partial\dot q_i\partial\dot q_j$ is non-singular, so that the generalized momenta $p_i = \partial L/\partial\dot q_i$ (6.8) can be solved for the velocities, $\dot q = \dot q(q, p, t)$. The **Hamiltonian** is the Legendre transform of $L$ in the velocities,
$$H(q, p, t) = \sum_i p_i\dot q_i - L(q, \dot q, t)\Big|_{\dot q = \dot q(q,p,t)} .$$
When $L$ is convex in $\dot q$ this is $H(q,p,t) = \max_{\dot q}\,\big(p\cdot\dot q - L\big)$, and the transform is an involution: $\dot q = \partial H/\partial p$ and $L = p\cdot\dot q - H$. As a number, $H$ equals the energy function of 7.6. For $L = \tfrac12 m\dot{\mathbf r}^2 - U$ it is $H = \mathbf p^2/2m + U$. For a charge in a magnetic field, $L = \tfrac12 m\dot{\mathbf r}^2 + q\dot{\mathbf r}\cdot\mathbf A - q\phi$ gives $\mathbf p = m\dot{\mathbf r} + q\mathbf A$, which is not $m\dot{\mathbf r}$, and $H = (\mathbf p - q\mathbf A)^2/2m + q\phi$. For a free relativistic particle, $L = -mc^2\sqrt{1-v^2/c^2}$ gives $H = \sqrt{p^2c^2 + m^2c^4}$.`,
      idea: String.raw`For each fixed $p$, the function $v \mapsto pv - L(v)$ measures how far the line of slope $p$ through the origin rises above the graph of $L$. If $L$ is strictly convex, this gap has a single maximum, at the point where the tangent to $L$ has slope $p$, that is, where $\partial L/\partial v = p$. The maximum value is $H(p)$, and the tangent line there meets the vertical axis at $-H$. Differentiating $H(p) = pv(p) - L(v(p))$ and using $L' = p$ leaves $H'(p) = v$: the same construction run backwards returns $L$. If $L$ is not convex, several velocities share one momentum and $H$ forgets all but the outermost ones. The Hamiltonian description then breaks down, which is why the Hessian condition is needed.`,
      caption: String.raw`Left: the Lagrangian as a function of one velocity component, at a fixed position. Drag the gold handle to tilt the line $pv$ (slope $p$). The vertical bars are the gaps $pv - L(v)$; the largest one, in green, is $H(p)$, found where the tangent to $L$ is parallel to the line, and that tangent meets the axis at $-H$. Right: the resulting $H(p)$; its slope at the current $p$ is the velocity again. Switch on the magnetic term and the minimum of $H$ moves to $p = qA$, so that $p$ and $mv$ separate. Try the relativistic Lagrangian, whose velocities are capped at $c$ while $p$ is not, and then a non-convex one, where one momentum belongs to several velocities.`,
      deps: ['pde-8.11', 'mech-6.8', 'mech-7.6'],
      refs: ['Goldstein §8.1', 'Taylor §13.1'],
      tags: ['Hamiltonian', 'Legendre transform'],
      credit: 'Hamilton, 1834–35',
      viz(v) {
        const mode = v.select('Lagrangian', [{ value: 'pot', label: '$\\tfrac12mv^2 - U$' }, { value: 'mag', label: 'with $qAv$' }, { value: 'rel', label: 'relativistic' }, { value: 'nc', label: 'non-convex' }], 'pot');
        const Us = v.slider('potential energy $U$ at this point', -1, 1, 0.3, { step: 0.01 });
        const As = v.slider('magnetic term $qA$', -1.2, 1.2, 0.7, { step: 0.01 });
        const cs = v.slider('speed of light $c$', 0.8, 3, 1.4, { step: 0.01 });
        const VX = 2.4, VH = 1.9;
        const sL = v.stage({ x: [-VX, VX], y: [-3, 3.4], axes: true, height: 360, xlabel: 'v', ylabel: 'L', title: 'the Lagrangian $L(v)$ and the line $pv$' });
        const sH = v.stage({ x: [-1.9, 1.9], y: [-1, 3], axes: true, height: 360, xlabel: 'p', ylabel: 'H', title: 'its Legendre transform $H(p)$' });
        const hp = sL.handle(VH, 0.9 * VH, { color: 'gold', constrain: (x, y) => [VH, clamp(y, -3.2, 3.2)] });
        const Lf = () => {
          const U = Us.value, A = As.value, c = cs.value, m = mode.value;
          if (m === 'pot') return { L: (w) => 0.5 * w * w - U, lo: -VX, hi: VX };
          if (m === 'mag') return { L: (w) => 0.5 * w * w + A * w - U, lo: -VX, hi: VX };
          if (m === 'rel') return { L: (w) => -c * c * Math.sqrt(Math.max(0, 1 - (w * w) / (c * c))) - U, lo: -c * 0.99999, hi: c * 0.99999 };
          return { L: (w) => 0.25 * w ** 4 - 0.9 * w * w - U, lo: -VX, hi: VX };
        };
        // H(p) = max_v (pv − L(v)) by a fine grid plus parabolic refinement; also every local maximum (for the non-convex case)
        const legendre = (F, p) => {
          const n = 2400, dv = (F.hi - F.lo) / n; let best = -Infinity, bi = 0; const g = new Float64Array(n + 1);
          for (let i = 0; i <= n; i++) { const w = F.lo + i * dv; g[i] = p * w - F.L(w); if (g[i] > best) { best = g[i]; bi = i; } }
          const loc = [];
          for (let i = 1; i < n; i++) if (g[i] >= g[i - 1] && g[i] > g[i + 1]) { const den = g[i - 1] - 2 * g[i] + g[i + 1], d = den < 0 ? (0.5 * (g[i - 1] - g[i + 1])) / den : 0; loc.push(F.lo + (i + d) * dv); }
          let vs = F.lo + bi * dv;
          if (bi > 0 && bi < n) { const den = g[bi - 1] - 2 * g[bi] + g[bi + 1]; if (den < 0) vs += (0.5 * (g[bi - 1] - g[bi + 1]) / den) * dv; }
          return { v: vs, H: p * vs - F.L(vs), loc, edge: bi === 0 || bi === n };
        };
        const cache = memo(); let cur = null;
        const curveH = () => cache([mode.value, Us.value, As.value, cs.value].join('|'), () => {
          const F = Lf(), ps = [], Hs = [];
          for (let i = 0; i <= 160; i++) { const p = -1.9 + (3.8 * i) / 160, r = legendre(F, p); ps.push(p); Hs.push(r.edge ? NaN : r.H); }
          return { ps, Hs };
        });
        v.render(() => {
          const F = Lf(), p = hp.y / VH, r = legendre(F, p), m = mode.value;
          As.el.hidden = m !== 'mag'; cs.el.hidden = m !== 'rel';
          // gap bars between the line pv and the graph
          for (let w = F.lo + 0.1; w < F.hi; w += 0.16) { const gap = p * w - F.L(w); if (gap > -6) sL.line(w, F.L(w), w, p * w, { color: gap > 0 ? 'orange' : 'faint', width: 1.4, alpha: gap > 0 ? 0.5 : 0.35 }); }
          if (m === 'rel') { sL.vband(-VX, -cs.value, { color: 'red', alpha: 0.07 }); sL.vband(cs.value, VX, { color: 'red', alpha: 0.07 }); }
          sL.fn((w) => (w > F.lo && w < F.hi ? F.L(w) : NaN), { color: 'accent', width: 2.6, n: 400 });
          sL.line(-VX, -VX * p, VX, VX * p, { color: 'gold', width: 1.8 });
          if (!r.edge) {
            sL.line(-VX, F.L(r.v) + p * (-VX - r.v), VX, F.L(r.v) + p * (VX - r.v), { color: 'green', width: 1.3, dash: [6, 4] });
            sL.line(r.v, F.L(r.v), r.v, p * r.v, { color: 'green', width: 3.4 });
            sL.text('H(p)', r.v, (F.L(r.v) + p * r.v) / 2, { color: 'green', math: true, dx: r.v > 0 ? 8 : -8, align: r.v > 0 ? 'left' : 'right', size: 15 });
            sL.dot(0, -r.H, { r: 4.5, color: 'green', label: '−H', labelPos: r.v > 0 ? 'w' : 'e' });
            sL.dot(r.v, F.L(r.v), { r: 5, color: 'green' });
          }
          if (m === 'nc') for (const w of r.loc) if (Math.abs(w - r.v) > 0.05) sL.dot(w, F.L(w), { r: 5, color: 'red', hollow: true });
          sL.text('pv', VH, hp.y, { color: 'gold', math: true, dx: -10, dy: -14, align: 'right', size: 15 });
          // the transform
          const C = curveH();
          let lo = Infinity, hi = -Infinity; for (const h of C.Hs) if (isFinite(h)) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
          const padv = Math.max(0.3, (hi - lo) * 0.12); sH.setView([-1.9, 1.9], [Math.min(-0.4, lo - padv), hi + padv]);
          sH.path(C.ps.map((q, i) => [q, C.Hs[i]]), { color: 'purple', width: 2.6 });
          if (m === 'mag') { sH.vline(As.value, { color: 'teal', dash: [4, 4], width: 1.2 }); sH.text('p = qA', As.value, lo, { color: 'teal', math: true, dx: 5, dy: -10, size: 14 }); }
          if (!r.edge) {
            sH.line(p - 0.7, r.H - 0.7 * r.v, p + 0.7, r.H + 0.7 * r.v, { color: 'green', width: 1.6, dash: [6, 4] });
            sH.dot(p, r.H, { r: 5.5, color: 'gold', label: `slope v = ${v.fix(r.v, 3)}`, labelPos: r.v > 0 ? 'nw' : 'ne' });
          }
          cur = { p, r, F };
        });
        v.legend([['accent', '$L(v)$'], ['gold', 'line $pv$'], ['orange', 'gap $pv - L$'], ['green', 'largest gap $= H(p)$ and the tangent'], ['purple', '$H(p)$']]);
        v.readout(() => {
          if (!cur) return '';
          const { p, r, F } = cur, m = mode.value, U = Us.value, A = As.value, c = cs.value;
          if (r.edge) return 'the line is steeper than the graph can follow: the supremum runs off the edge of the velocity range';
          const dLdv = (F.L(r.v + 1e-5) - F.L(r.v - 1e-5)) / 2e-5;
          let s = String.raw`maximiser $v^* = ${v.fix(r.v, 4)}$, where $\partial L/\partial v = ${v.fix(dLdv, 4)}$ (should equal $p = ${v.fix(p, 4)}$) · $H(p) = pv^* - L(v^*) = ${v.fix(r.H, 4)}$`;
          if (m === 'pot') s += String.raw` · energy $\tfrac12mv^{*2} + U = ${v.fix(0.5 * r.v * r.v + U, 4)}$, and $p = mv^*$`;
          if (m === 'mag') s += String.raw` · kinetic momentum $mv^* = ${v.fix(r.v, 4)}$, so $p - mv^* = ${v.fix(p - r.v, 4)} = qA$; energy $\tfrac12mv^{*2}+U = ${v.fix(0.5 * r.v * r.v + U, 4)}$: the magnetic term carries momentum but no energy`;
          if (m === 'rel') s += String.raw` · closed form $\sqrt{p^2c^2 + c^4} + U = ${v.fix(Math.sqrt(p * p * c * c + c ** 4) + U, 4)}$ ($m = 1$); $|v^*| < c$ however large $p$ is`;
          if (m === 'nc') s += r.loc.length > 1 ? String.raw` · **${r.loc.length} velocities** have tangent slope $p$ (red rings mark the losers): $p$ does not determine $v$, and $H$ is the transform of the convex hull of $L$` : ' · for this $p$ only one tangent point survives; tilt the line toward zero to see several';
          return s;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.3
    {
      num: '12.3',
      kind: 'Theorem',
      name: 'Hamilton’s equations',
      statement: String.raw`If $q(t)$ satisfies Lagrange’s equations (6.6) for a Lagrangian with non-singular velocity Hessian, then $(q(t), p(t))$ with $p = \partial L/\partial\dot q$ satisfies the $2n$ first-order equations
$$\dot q_i = \frac{\partial H}{\partial p_i}, \qquad \dot p_i = -\frac{\partial H}{\partial q_i}, \qquad \frac{\partial H}{\partial t} = -\frac{\partial L}{\partial t},$$
and conversely. In one degree of freedom the velocity of the phase point is the **Hamiltonian vector field** $X_H = (\partial H/\partial p, -\partial H/\partial q)$, the gradient $\nabla H$ turned through a right angle. It is therefore tangent to the level curves of $H$, so a time-independent $H$ is constant along every motion, and the orbits are the level curves themselves. For the pendulum $H = p^2/2ml^2 - mgl\cos q$, and $\dot q = p/ml^2$, $\dot p = -mgl\sin q$.`,
      idea: String.raw`Take the differential of $H = p\dot q - L$: the terms $p\,d\dot q$ and $-(\partial L/\partial\dot q)\,d\dot q$ cancel, because $p$ is defined as $\partial L/\partial\dot q$. What is left is $dH = \dot q\,dp - (\partial L/\partial q)\,dq - (\partial L/\partial t)\,dt$. Reading off the coefficients gives $\partial H/\partial p = \dot q$, and Lagrange’s equation $\tfrac{d}{dt}\partial L/\partial\dot q = \partial L/\partial q$ turns $-\partial H/\partial q = \partial L/\partial q$ into $\dot p$. Tangency follows from $X_H\cdot\nabla H = H_pH_q - H_qH_p = 0$; the minus sign in $\dot p$ is what makes the rotation a right angle rather than an ascent.`,
      caption: String.raw`Left: the pendulum’s phase plane, with level curves of $H$ (the red curve is the separatrix $H = mgl$) and the faint field $X_H$. Drag the dark handle to choose a starting point. The gold point then moves by Hamilton’s equations: the orange arrow is $\nabla H$ and the blue arrow, the velocity, is at right angles to it, so the point slides along its level curve, swinging back and forth inside the eye (libration) or going over the top outside it (rotation). Right: the same motion in real space; below, $q(t)$ and $p(t)$. Switch to gradient flow and the point climbs straight across the level curves instead: without the quarter turn, energy is not conserved.`,
      deps: ['mech-12.2', 'mech-6.6'],
      refs: ['Taylor §13.3', 'Goldstein §8.1'],
      tags: ['Hamilton’s equations', 'phase space', 'pendulum'],
      credit: 'Hamilton, 1834–35',
      viz(v) {
        const flow = v.select('flow', [{ value: 'ham', label: 'Hamiltonian $X_H$' }, { value: 'grad', label: 'gradient $\\nabla H$ (break it)' }], 'ham');
        const sP = v.stage({ x: [-Math.PI, Math.PI], y: [-2.6, 2.6], equal: true, axes: 'box', gutter: true, height: 380, weight: 1.45, xlabel: 'q (rad)', ylabel: 'p', xticks: piTicks(-Math.PI, Math.PI) });
        const sR = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 380, weight: 1, title: 'the pendulum in real space' });
        const sT = v.stage({ x: [0, 20], y: [-3.4, 3.4], axes: 'box', gutter: true, height: 150, full: true, xlabel: 't  (units of 1/ω₀)' });
        const h0 = sP.handle(-0.4, 1.35, { color: 'ink', r: 7, constrain: (x, y) => [clamp(x, -Math.PI + 0.02, Math.PI - 0.02), clamp(y, -2.5, 2.5)] });
        h0.onDrag = () => v.restart();
        const cache = memo(); let cur = null;
        const run = () => cache([h0.x, h0.y, flow.value].join('|'), () => {
          const E0 = pendH(h0.x, h0.y), info = pendInfo(E0), ham = flow.value === 'ham';
          const T = ham ? clamp(isFinite(info.T) ? 3 * info.T : 40, 12, 40) : 20, dt = 0.005, every = 4, n = Math.round(T / dt);
          const t = [0], q = [h0.x], p = [h0.y], y = [h0.x, h0.y];
          for (let k = 1; k <= n; k++) {
            if (ham) pendStep(y, dt);
            else { const f = (tt, z) => [Math.sin(z[0]), z[1]], z = rk4(f, 0, y, dt); y[0] = z[0]; y[1] = z[1]; }
            if (k % every === 0) { t.push(k * dt); q.push(y[0]); p.push(y[1]); }
            if (!ham && Math.abs(y[1]) > 2.55) break;
          }
          let drift = 0; for (let i = 0; i < q.length; i++) drift = Math.max(drift, Math.abs(pendH(q[i], p[i]) - E0));
          let Tm = NaN;
          if (ham) {
            if (info.kind === 'libration') { const c = upCrossings(t, p); if (c.length > 1) Tm = (c[c.length - 1] - c[0]) / (c.length - 1); }
            else if (info.kind === 'rotation') { const c = []; for (let i = 1; i < q.length; i++) { const a = Math.floor((q[i - 1] - h0.x) / TAU), b = Math.floor((q[i] - h0.x) / TAU); if (a !== b) c.push(t[i]); } if (c.length > 1) Tm = (c[c.length - 1] - c[0]) / (c.length - 1); }
          }
          return { t, q, p, E0, info, drift, Tm, T: t[t.length - 1], dt: dt * every, ham };
        });
        v.animate((tt) => {
          const B = run(), tau = Math.min(1.6 * tt, B.T), i = Math.min(B.t.length - 1, Math.round(tau / B.dt)), q = B.q[i], p = B.p[i];
          // phase plane
          sP.field((x, y) => [y, -Math.sin(x)], { spacing: 34, color: 'faint', alpha: 0.7 });
          sP.contour(pendH, [-0.8, -0.45, -0.05, 0.4, 1.6, 2.3], { color: 'muted', alpha: 0.45, width: 1, res: 140 });
          sP.contour(pendH, [1], { color: 'red', width: 1.6, alpha: 0.75, res: 160 });
          const pts = []; for (let k = 0; k <= i; k++) pts.push([B.q[k], B.p[k]]);
          sP.path(wrappedPath(pts), { color: 'gold', width: 2.4 });
          const g = [Math.sin(q), p], X = B.ham ? [p, -Math.sin(q)] : g, w = wrap(q);
          if (Math.hypot(g[0], g[1]) > 0.04) {
            arrowPx(sP, w, p, g, 46, { color: 'orange' });
            arrowPx(sP, w, p, X, 46, { color: 'blue' });
            if (B.ham) rightAngle(sP, w, p, g, X, 10);
            sP.text('∇H', w, p, { color: 'orange', dx: 52 * g[0] / Math.hypot(g[0] * 1, g[1]), dy: -52 * g[1] / Math.hypot(g[0], g[1]), size: 13, align: 'center' });
          }
          sP.dot(w, p, { r: 6, color: 'gold' });
          sP.corner(B.info.kind === 'libration' ? 'libration' : B.info.kind === 'rotation' ? 'rotation' : B.info.kind, 'tr', { color: 'ink', plate: true });
          // real space
          sR.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          const bt = []; for (let k = Math.max(0, i - 60); k <= i; k++) bt.push([Math.sin(B.q[k]), -Math.cos(B.q[k])]);
          sR.path(bt, { color: 'gold', width: 2, alpha: 0.6 });
          sR.line(0, 0, 0, -1.15, { color: 'faint', dash: [2, 4], width: 1 });
          drawPendulum(sR, q, 1, { color: 'gold' });
          sR.corner(`q = ${v.fix(w / DEG, 0)}°`, 'tl', { color: 'ink' });
          // time series
          sT.setView([0, B.T], [-3.4, 3.4]);
          series(sT, B.t, B.q.map(wrap), i, { color: 'blue', width: 1.8 });
          series(sT, B.t, B.p, i, { color: 'orange', width: 1.8 });
          sT.vline(tau, { color: 'gold' });
          cur = { B, i };
        }, { period: 26, still: 6 });
        v.legend([['gold', 'phase point and its path'], ['orange', '$\\nabla H$ / $p(t)$'], ['blue', 'velocity $X_H$ / $q(t)$ (wrapped)'], ['red', 'separatrix $H = mgl$']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, i } = cur, q = B.q[i], p = B.p[i], H = pendH(q, p);
          if (!B.ham) return String.raw`gradient flow: $H$ went from ${v.fix(B.E0, 3)} to ${v.fix(H, 3)} — along $\nabla H$ it can only grow ($dH/dt = |\nabla H|^2$), so these are not motions of the pendulum`;
          const g = [Math.sin(q), p], X = [p, -Math.sin(q)], ang = Math.atan2(Math.abs(g[0] * X[1] - g[1] * X[0]), g[0] * X[0] + g[1] * X[1]) / DEG;
          const per = B.info.kind === 'libration' ? String.raw` · period: measured ${num(v, B.Tm, 4)}, exact $4K(k^2) = ${v.fix(B.info.T, 4)}$ with $k = \sin(q_{\max}/2)$` : B.info.kind === 'rotation' ? String.raw` · time per revolution: measured ${num(v, B.Tm, 4)}, exact ${v.fix(B.info.T, 4)}` : '';
          return String.raw`$H = ${v.fix(H, 5)}$ (start ${v.fix(B.E0, 5)}; largest leapfrog drift $${sci(v, B.drift)}$) · angle between $X_H$ and $\nabla H$: ${v.fix(ang, 2)}°` + per;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.4
    {
      num: '12.4',
      kind: 'Definition',
      name: 'Phase space and phase portraits',
      statement: String.raw`The **phase space** of a system with $n$ degrees of freedom is the $2n$-dimensional space of its states $(q, p)$. A state determines the whole motion (1.9), so through each point passes exactly one **trajectory** of Hamilton’s equations, and distinct trajectories never cross. Equilibria are the points where $\nabla H = 0$. The **phase portrait** is the family of all trajectories. For $H = p^2/2m + U(q)$ in one degree of freedom it is the set of level curves $p = \pm\sqrt{2m(E - U(q))}$: closed curves around minima of $U$ (oscillations), curves running to infinity (unbounded or rotating motion), and **separatrices** through the saddle points at maxima of $U$, which divide these kinds of motion and take infinite time to traverse.`,
      idea: String.raw`Uniqueness of solutions of first-order ODEs with smooth right-hand side (1.9) is what forbids crossings: two trajectories through the same point would be two solutions with the same initial data. Energy conservation (12.3) puts each trajectory on a level curve, and $p = \pm\sqrt{2m(E-U)}$ can be read off the potential: turning points where $E = U$, speed greatest at the bottom of a well. Near a minimum, $H$ is a positive quadratic form and its levels are ellipses (centres); near a maximum of $U$ it is indefinite and its levels are hyperbolas (saddles). The time to reach a saddle, $\int dq/\sqrt{2(E-U)}$, diverges logarithmically on the separatrix.`,
      caption: String.raw`Choose a system. Top: the potential $U(q)$, with the energy line of the dark handle’s orbit and its turning points; the gold ball rolls in the well. Bottom: the phase portrait, aligned with the potential, with level curves of $H$ (separatrices in red). The cloud of dots, each with a short tail, flows by Hamilton’s equations: the tails trace the portrait, and no two of them ever cross. Drag the handle to pick any orbit and read its period.`,
      deps: ['mech-12.3', 'mech-1.9'],
      refs: ['Taylor §13.6'],
      tags: ['phase portrait', 'separatrix'],
      viz(v) {
        const SYS = {
          osc: { U: (q) => 0.5 * q * q, dU: (q) => q, x: [-3, 3], y: [-2.6, 2.6], u: [-0.2, 3.2], E: [0.2, 0.6, 1.1, 1.7, 2.4, 3.2], sep: [], h: [1.2, 0.8], wrap: 0, eq: [[0, 'centre']] },
          pend: { U: (q) => -Math.cos(q), dU: (q) => Math.sin(q), x: [-2 * Math.PI, 2 * Math.PI], y: [-2.8, 2.8], u: [-1.3, 2.4], E: [-0.7, -0.2, 0.4, 1.6, 2.4], sep: [1], h: [0.6, 1.2], wrap: 4 * Math.PI, eq: [[0, 'centre'], [Math.PI, 'saddle'], [-Math.PI, 'saddle']] },
          dw: { U: (q) => 0.25 * q ** 4 - q * q, dU: (q) => q ** 3 - 2 * q, x: [-2.6, 2.6], y: [-2.6, 2.6], u: [-1.4, 2.2], E: [-0.8, -0.4, 0.5, 1.2, 2], sep: [0], h: [1.4, 0.5], wrap: 0, eq: [[-Math.SQRT2, 'centre'], [Math.SQRT2, 'centre'], [0, 'saddle']] },
          morse: { U: (q) => (1 - Math.exp(-q)) ** 2, dU: (q) => 2 * (1 - Math.exp(-q)) * Math.exp(-q), x: [-0.9, 5], y: [-1.6, 1.6], u: [-0.1, 1.6], E: [0.15, 0.4, 0.7, 1.2], sep: [1], h: [0.4, 0.7], wrap: 0, eq: [[0, 'centre']] },
        };
        const sysS = v.select('system', [{ value: 'osc', label: 'oscillator' }, { value: 'pend', label: 'pendulum' }, { value: 'dw', label: 'double well' }, { value: 'morse', label: 'Morse' }], 'pend', { onChange: (k) => { const S = SYS[k]; sU.setView(S.x, S.u); sP.setView(S.x, S.y); hd.set(S.h[0], S.h[1]); v.restart(); } });
        const S0 = SYS.pend;
        const sU = v.stage({ x: S0.x, y: S0.u, axes: 'box', gutter: { l: 42, r: 12, t: 26, b: 10 }, height: 150, full: true, title: 'potential $U(q)$ and the energy of the chosen orbit', xticks: [] });
        const sP = v.stage({ x: S0.x, y: S0.y, axes: 'box', gutter: true, height: 330, full: true, xlabel: 'q', ylabel: 'p' });
        const hd = sP.handle(S0.h[0], S0.h[1], { color: 'ink', r: 7 });
        hd.onDrag = () => v.restart();
        const NP = 280, TAIL = 12;
        const sim = v.sim(() => {
          const S = SYS[sysS.value], r = v.rng(7), q = new Float64Array(NP), p = new Float64Array(NP), tr = [];
          for (let k = 0; k < NP; k++) { q[k] = r.uniform(S.x[0], S.x[1]); p[k] = r.uniform(S.y[0], S.y[1]); }
          return { S, q, p, tr: [], n: 0, r };
        }, (st, dt) => {
          const S = st.S;
          for (let k = 0; k < NP; k++) {
            st.p[k] -= 0.5 * dt * S.dU(st.q[k]); st.q[k] += dt * st.p[k]; st.p[k] -= 0.5 * dt * S.dU(st.q[k]);
            if (S.wrap) st.q[k] -= S.wrap * Math.floor((st.q[k] - S.x[0]) / S.wrap);
          }
          if (++st.n % 3 === 0) { st.tr.push([Float64Array.from(st.q), Float64Array.from(st.p)]); if (st.tr.length > TAIL) st.tr.shift(); }
        }, { dt: 0.02 });
        const cache = memo(); let cur = null;
        const orbit = () => cache([sysS.value, hd.x, hd.y].join('|'), () => {
          const S = SYS[sysS.value], E = 0.5 * hd.y * hd.y + S.U(hd.x), y = [hd.x, hd.y], dt = 0.004, t = [0], q = [y[0]], p = [y[1]];
          let tc = []; let prevp = y[1];
          for (let k = 1; k < 60000; k++) {
            y[1] -= 0.5 * dt * S.dU(y[0]); y[0] += dt * y[1]; y[1] -= 0.5 * dt * S.dU(y[0]);
            if (k % 3 === 0) { t.push(k * dt); q.push(y[0]); p.push(y[1]); }
            if (prevp < 0 && y[1] >= 0) tc.push(k * dt); prevp = y[1];
            if (tc.length >= 2 || y[0] < S.x[0] - 0.5 || y[0] > S.x[1] + 0.5 || (S.wrap && Math.abs(y[0] - hd.x) > TAU + 0.01) || k * dt > 60) break;
          }
          const T = tc.length >= 2 ? tc[1] - tc[0] : S.wrap && Math.abs(y[0] - hd.x) > TAU ? t[t.length - 1] : NaN;
          // turning points: where U = E on either side of the start
          const turn = (dir) => { let a = hd.x; for (let s = 0; s < 4000; s++) { const b = a + dir * 0.004; if (S.U(b) > E) { let lo = a, hi = b; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (S.U(m) > E) hi = m; else lo = m; } return (lo + hi) / 2; } a = b; if (a < S.x[0] - 2 || a > S.x[1] + 2) return NaN; } return NaN; };
          return { S, E, t, q, p, T, ql: turn(-1), qr: turn(1), closed: tc.length >= 2 };
        });
        v.animate((tt) => {
          const O = orbit(), S = O.S, st = sim.advance(tt);
          const H = (q, p) => 0.5 * p * p + S.U(q);
          // potential panel
          sU.fn(S.U, { color: 'accent', width: 2.4 });
          for (const e of S.sep) sU.hline(e, { color: 'red', width: 1, dash: [4, 4], alpha: 0.6 });
          const ql = isFinite(O.ql) ? O.ql : S.x[0], qr = isFinite(O.qr) ? O.qr : S.x[1];
          sU.line(ql, O.E, qr, O.E, { color: 'gold', width: 2 });
          for (const z of [O.ql, O.qr]) if (isFinite(z)) { sU.line(z, O.E, z, S.u[0], { color: 'gold', width: 1, dash: [3, 3], alpha: 0.7 }); sP.vline(z, { color: 'gold', width: 1, dash: [3, 3], alpha: 0.5 }); }
          const k = O.t.length ? Math.floor(((tt * 1.3) % (O.t[O.t.length - 1] || 1)) / (O.t[1] || 1)) : 0, qb = O.q[Math.min(k, O.q.length - 1)];
          const qbw = S.wrap ? qb - S.wrap * Math.floor((qb - S.x[0]) / S.wrap) : qb;
          sU.dot(qbw, S.U(qbw), { r: 7, color: 'gold' });
          sU.text('E', S.x[1], O.E, { color: 'gold', math: true, dx: -6, dy: -10, align: 'right' });
          // phase portrait
          sP.contour(H, S.E, { color: 'muted', alpha: 0.4, width: 1, res: 150 });
          if (S.sep.length) sP.contour(H, S.sep, { color: 'red', width: 1.6, alpha: 0.8, res: 180 });
          for (let j = 0; j < st.tr.length - 1; j++) {
            const a = st.tr[j], b = st.tr[j + 1], c = sP.ctx, al = (j + 1) / st.tr.length;
            c.save(); c.strokeStyle = v.color('accent', 0.55 * al); c.lineWidth = 1.4; c.beginPath();
            for (let m = 0; m < NP; m++) { if (Math.abs(b[0][m] - a[0][m]) > 1) continue; c.moveTo(sP.X(a[0][m]), sP.Y(a[1][m])); c.lineTo(sP.X(b[0][m]), sP.Y(b[1][m])); }
            c.stroke(); c.restore();
          }
          const ds = []; for (let m = 0; m < NP; m++) ds.push([st.q[m], st.p[m]]);
          sP.dots(ds, { r: 1.9, color: 'accent' });
          const op = O.q.map((q, j) => [S.wrap ? q - S.wrap * Math.floor((q - S.x[0]) / S.wrap) : q, O.p[j]]);
          const br = []; for (let j = 0; j < op.length; j++) { if (j && Math.abs(op[j][0] - op[j - 1][0]) > 1) br.push(null); br.push(op[j]); }
          sP.path(br, { color: 'gold', width: 2.6 });
          for (const [qe, kind] of S.eq) sP.dot(qe, 0, kind === 'centre' ? { r: 4.5, color: 'green' } : { r: 5, color: 'red', hollow: true });
          sP.dot(qbw, O.p[Math.min(k, O.p.length - 1)], { r: 5.5, color: 'gold' });
          cur = O;
        }, { period: 40, still: 9 });
        v.legend([['accent', 'cloud of phase points with tails'], ['gold', 'chosen orbit'], ['red', 'separatrix'], ['green', 'centre (stable)', { dot: true }], ['red', 'saddle (unstable)', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const O = cur, kind = O.closed ? (O.S.wrap && !(isFinite(O.ql) && isFinite(O.qr)) ? 'rotation' : 'closed orbit (oscillation)') : 'unbounded (or on a separatrix)';
          const tp = isFinite(O.ql) && isFinite(O.qr) ? String.raw` · turning points $q = ${v.fix(O.ql, 3)}$ and $${v.fix(O.qr, 3)}$, where $U = E$` : '';
          return String.raw`chosen orbit: $E = ${v.fix(O.E, 4)}$, ${kind}` + tp + (isFinite(O.T) ? String.raw` · period ${v.fix(O.T, 3)}` : ' · no return within the window') + ` · the ${NP} cloud points move on level curves of $H$ that never intersect`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.5
    {
      num: '12.5',
      kind: 'Theorem',
      name: 'Conservation laws in Hamiltonian form',
      statement: String.raw`Along any solution of Hamilton’s equations,
$$\frac{dH}{dt} = \frac{\partial H}{\partial t}, \qquad \frac{dp_i}{dt} = -\frac{\partial H}{\partial q_i}.$$
So $H$ is conserved exactly when it does not depend explicitly on time, and the momentum $p_i$ is conserved exactly when $q_i$ is **cyclic**, absent from $H$ (7.1). A cyclic coordinate then drops out completely: with $p_i$ fixed at its initial value, the remaining coordinates obey Hamilton’s equations of a system with one fewer degree of freedom, and $q_i(t)$ follows afterwards by a quadrature of $\dot q_i = \partial H/\partial p_i$. For a central force,
$$H = \frac{p_r^2}{2m} + \frac{p_\theta^2}{2mr^2} + U(r),$$
$\theta$ is cyclic, $p_\theta = mr^2\dot\theta$ is the angular momentum, and the radial motion is a one-dimensional Hamiltonian flow in the $(r, p_r)$ plane.`,
      idea: String.raw`By the chain rule, $dH/dt = \sum_i(H_{q_i}\dot q_i + H_{p_i}\dot p_i) + \partial H/\partial t$, and Hamilton’s equations make the sum $\sum(H_{q_i}H_{p_i} - H_{p_i}H_{q_i})$ vanish term by term. The momentum statement is one of Hamilton’s equations read backwards. In the Lagrangian picture a cyclic coordinate still leaves its velocity in the equations; in the Hamiltonian picture $p_i$ is a constant parameter and $q_i$ appears nowhere, which is why the reduction is immediate here (compare 7.12).`,
      caption: String.raw`Left: an orbit in a $-k/r$ potential. Middle: the reduced phase plane $(r, p_r)$, with level curves of $H$ at the current $p_\theta$; the gold point stays on one of them. Bottom: the two sides of a conservation law, measured from the simulation (solid) and predicted (dashed). With the static central force, $H$ and $p_\theta$ are constant. Let the strength $k$ pulse in time: $p_\theta$ is still conserved, but $H$ is not, and its rate of change matches $\partial H/\partial t$ at every instant while the level curves breathe. Add a uniform sideways field instead: now $H$ is conserved, but $\theta$ is no longer cyclic, and $dp_\theta/dt$ follows $-\partial H/\partial\theta$.`,
      deps: ['mech-12.3', 'mech-7.1'],
      refs: ['Goldstein §8.2', 'Taylor §13.4'],
      tags: ['conservation laws', 'cyclic coordinate', 'central force'],
      viz(v) {
        const mode = v.select('potential', [{ value: 'st', label: 'central, static' }, { value: 'pul', label: 'central, pulsing $k(t)$' }, { value: 'side', label: 'plus sideways field' }], 'st', { onChange: () => v.restart() });
        const sO = v.stage({ x: [-2.3, 1.5], y: [-1.6, 1.6], equal: true, axes: false, height: 320, weight: 1, title: 'orbit in the plane' });
        const sR = v.stage({ x: [0.3, 2.6], y: [-1.25, 1.25], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: 'r', ylabel: 'pᵣ', title: 'reduced phase plane $(r, p_r)$' });
        const sT = v.stage({ x: [0, 60], y: [-1, 1], axes: 'box', gutter: true, height: 170, full: true, xlabel: 't' });
        const EPS = 0.3, OM = 1.3, F = 0.06, TT = 60, DT = 0.004, EV = 5;
        const kf = (t, m) => (m === 'pul' ? 1 + EPS * Math.sin(OM * t) : 1), kd = (t, m) => (m === 'pul' ? EPS * OM * Math.cos(OM * t) : 0);
        const cache = memo(); let cur = null;
        const run = () => cache(mode.value, () => {
          const m = mode.value, Fx = m === 'side' ? F : 0;
          const f = (t, y) => { const r = Math.hypot(y[0], y[1]), k = kf(t, m), a = -k / (r * r * r); return [y[2], y[3], a * y[0] - Fx, a * y[1]]; };
          const R = rk4rec(f, [1, 0, 0, 1.15], TT, Math.round(TT / DT), EV);
          const H = (t, y) => { const r = Math.hypot(y[0], y[1]); return 0.5 * (y[2] ** 2 + y[3] ** 2) - kf(t, m) / r + Fx * y[0]; };
          const rec = R.y.map((y, i) => { const t = R.t[i], r = Math.hypot(y[0], y[1]); return { r, pr: (y[0] * y[2] + y[1] * y[3]) / r, L: y[0] * y[3] - y[1] * y[2], H: H(t, y), dHt: kd(t, m) * -1 / r, dLp: Fx * y[1] }; });
          const n = rec.length, dt = R.dt;
          for (let i = 0; i < n; i++) { const a = rec[Math.max(0, i - 1)], b = rec[Math.min(n - 1, i + 1)], w = (Math.min(n - 1, i + 1) - Math.max(0, i - 1)) * dt; rec[i].dH = (b.H - a.H) / w; rec[i].dL = (b.L - a.L) / w; }
          let dL = 0, dH = 0, mis = 0; for (const q of rec) { dL = Math.max(dL, Math.abs(q.L - rec[0].L)); dH = Math.max(dH, Math.abs(q.H - rec[0].H)); }
          for (let i = 1; i < n - 1; i++) mis = Math.max(mis, m === 'side' ? Math.abs(rec[i].dL - rec[i].dLp) : Math.abs(rec[i].dH - rec[i].dHt));
          return { R, rec, m, dL, dH, mis, Fx };
        });
        v.animate((tt) => {
          const B = run(), tau = Math.min(2.5 * tt, TT), i = idxAt(B.R, tau), y = B.R.y[i], q = B.rec[i], m = B.m;
          // orbit
          if (B.Fx) for (let yy = -1.4; yy <= 1.41; yy += 0.7) sO.arrow(1.35, yy, 1.05, yy, { color: 'teal', width: 1.4, head: 7, alpha: 0.7 });
          sO.path(B.R.y.slice(0, i + 1).map((z) => [z[0], z[1]]), { color: 'accent', width: 1.5, alpha: 0.8 });
          const kk = kf(B.R.t[i], m);
          sO.circle(0, 0, 0.05 + 0.04 * kk, { fill: 'orange', fillAlpha: 0.9, color: 'orange' });
          sO.line(0, 0, y[0], y[1], { color: 'faint', width: 1, dash: [3, 3] });
          sO.dot(y[0], y[1], { r: 6, color: 'gold' });
          // reduced phase plane at the current p_θ and k
          const Hr = (r, pr) => 0.5 * pr * pr + (q.L * q.L) / (2 * r * r) - kk / r;
          sR.contour(Hr, [-0.6, -0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.15], { color: 'muted', alpha: 0.5, width: 1, res: 110 });
          sR.contour(Hr, [Hr(q.r, q.pr)], { color: 'accent', width: 2, res: 160 });
          series(sR, B.rec.map((z) => z.r), B.rec.map((z) => z.pr), i, { color: 'gold', width: 1, alpha: 0.5 });
          sR.dot(q.r, q.pr, { r: 6, color: 'gold' });
          sR.corner(`pθ = ${v.fix(q.L, 4)}`, 'tr', { color: 'ink', plate: true });
          // conservation strip
          const meas = m === 'side' ? B.rec.map((z) => z.dL) : B.rec.map((z) => z.dH), pred = m === 'side' ? B.rec.map((z) => z.dLp) : B.rec.map((z) => z.dHt);
          let a = 0.05; for (const z of meas) a = Math.max(a, Math.abs(z)); a *= 1.15;
          sT.setView([0, TT], [-a, a]);
          sT.hline(0, { color: 'faint', width: 1 });
          series(sT, B.R.t, meas, i, { color: m === 'side' ? 'purple' : 'accent', width: 2.6 });
          sT.path(B.R.t.map((t, j) => [t, pred[j]]), { color: 'orange', width: 1.4, dash: [5, 4] });
          series(sT, B.R.t, m === 'side' ? B.rec.map((z) => z.dH) : B.rec.map((z) => z.dL), i, { color: 'green', width: 1.6 });
          sT.vline(tau, { color: 'gold' });
          sT.setTitle(m === 'side' ? 'measured $dp_\\theta/dt$ (purple) against $-\\partial H/\\partial\\theta$ (dashed); $dH/dt$ in green' : 'measured $dH/dt$ (blue) against $\\partial H/\\partial t$ (dashed); $dp_\\theta/dt$ in green');
          cur = B;
        }, { period: 25, still: 10 });
        v.legend([['accent', 'orbit / current level curve'], ['gold', 'state'], ['orange', 'prediction from $\\partial H$', { dash: true }], ['green', 'rate of the other quantity']]);
        v.readout(() => {
          if (!cur) return '';
          const B = cur;
          const base = String.raw`largest change of $p_\theta$: $${sci(v, B.dL)}$ · of $H$: $${sci(v, B.dH)}$`;
          if (B.m === 'st') return base + String.raw` · $H$ has no $t$ and no $\theta$: both are conserved (to RK4 accuracy)`;
          if (B.m === 'pul') return base + String.raw` · $\theta$ is still cyclic, so $p_\theta$ stays put, while $H$ changes; largest $|dH/dt - \partial H/\partial t|$ along the run: $${sci(v, B.mis)}$ (finite-difference error)`;
          return base + String.raw` · $H$ has no $t$, so it is conserved; $\theta$ is no longer cyclic and $p_\theta$ wanders, with largest $|dp_\theta/dt + \partial H/\partial\theta|$ = $${sci(v, B.mis)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.6
    {
      num: '12.6',
      kind: 'Principle',
      name: 'Maupertuis’ principle and the Jacobi metric',
      statement: String.raw`Let $H = \tfrac12 g_{ij}(q)p_ip_j/\!m\, + U(q)$ be time-independent (kinetic energy $T = \tfrac12 m\,ds^2/dt^2$). Among all paths joining two configurations $A$ and $B$ that are traversed with the fixed energy $E$ (and arbitrary timing), the paths of actual motions are exactly the stationary points of the **abbreviated action**
$$W[\gamma] = \int_\gamma p\cdot dq = \int_\gamma \sqrt{2m\,(E - U)}\;ds .$$
Equivalently, the orbits of energy $E$ are the geodesics of the **Jacobi metric** $d\sigma^2 = 2m\,(E-U)\,ds^2$ on the region $U < E$. Maupertuis’ principle determines the path, not the timing; the time along it follows from $T = E - U$. It can fail to give a minimum: past a conjugate point the true path is only a saddle of $W$.`,
      idea: String.raw`Write Hamilton’s principle (6.5) with the time also varied, as $\delta\int(p\,\dot q - H)\,dt = 0$, and restrict to paths on the energy surface $H = E$. The $H$ term then contributes only $-E\,\delta(t_B - t_A)$, which is cancelled by the change in the endpoint times, leaving $\delta\int p\,dq = 0$. With $p\,\dot q = 2T$ and $T = \tfrac12 m(ds/dt)^2 = E - U$, the integrand becomes $\sqrt{2m(E-U)}\,ds$: an optical path length with “refractive index” $\sqrt{E-U}$, so the motion is a geodesic of the conformally rescaled metric, as on a surface (5.13).`,
      caption: String.raw`A ball is thrown from $A$ to $B$ in uniform gravity with fixed energy $E$ (the shading on the left is the “refractive index” $\sqrt{E - U}$; above the red line the ball cannot go). The blue candidate path is a parabolic arc with control point $C$: drag $C$, or drag $A$ and $B$. Right: the abbreviated action $W$ of every candidate, as a map over the position of $C$. It has two stationary points, and they are exactly the two real trajectories (green, the direct throw: a minimum; orange, the lob: a saddle). Lower the energy until $B$ is out of reach and both disappear.`,
      deps: ['mech-12.3', 'mech-6.5', 'mech-5.13'],
      refs: ['Goldstein §8.6', 'Arnold §45'],
      tags: ['Maupertuis', 'abbreviated action', 'Jacobi metric'],
      credit: 'Maupertuis, 1744; Euler, 1744; Jacobi, 1842',
      viz(v) {
        const Es = v.slider('energy $E$ (units $mg\\times$length, $U = mgy$)', 0.6, 2.4, 1.6, { step: 0.01 });
        const XR = [-1.8, 1.8], YR = [-0.55, 2];
        const sP = v.stage({ x: XR, y: YR, equal: true, axes: 'box', gutter: true, height: 330, xlabel: 'x', ylabel: 'y', title: 'paths from $A$ to $B$' });
        const sW = v.stage({ x: XR, y: YR, equal: true, axes: 'box', gutter: true, height: 330, xlabel: 'x of C', ylabel: 'y of C', title: 'abbreviated action $W$ as a function of $C$' });
        const hA = sP.handle(-1.2, 0, { color: 'ink', label: 'A', labelPos: 'sw', constrain: (x, y) => [clamp(x, -1.7, 1.7), clamp(y, -0.45, 1.2)] });
        const hB = sP.handle(1.05, 0.35, { color: 'ink', label: 'B', labelPos: 'se', constrain: (x, y) => [clamp(x, -1.7, 1.7), clamp(y, -0.45, 1.2)] });
        const hC = sP.handle(-0.2, 1.1, { color: 'accent', label: 'C', labelPos: 'n', constrain: (x, y) => [clamp(x, XR[0], XR[1]), clamp(y, YR[0], YR[1])] });
        const bez = (A, C, B, t) => [(1 - t) ** 2 * A[0] + 2 * t * (1 - t) * C[0] + t * t * B[0], (1 - t) ** 2 * A[1] + 2 * t * (1 - t) * C[1] + t * t * B[1]];
        const W = (A, C, B, E, n = 48) => {
          let s = 0, prev = A;
          for (let k = 1; k <= n; k++) { const P = bez(A, C, B, k / n), m = bez(A, C, B, (k - 0.5) / n), T = E - m[1]; if (T < 0 || E - P[1] < -1e-9) return NaN; s += Math.sqrt(2 * T) * Math.hypot(P[0] - prev[0], P[1] - prev[1]); prev = P; }
          return s;
        };
        const truePaths = (A, B, E) => {
          const v2 = 2 * (E - A[1]), dx = B[0] - A[0]; if (v2 <= 0 || Math.abs(dx) < 1e-6) return [];
          const a = (dx * dx) / (2 * v2), b = -dx, c = B[1] - A[1] + a, D = b * b - 4 * a * c; if (D < 0) return [];
          return [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((u, w) => Math.abs(u) - Math.abs(w)).map((T) => ({ T, C: [(A[0] + B[0]) / 2, A[1] + (T * dx) / 2] }));
        };
        let cur = null;
        v.render(() => {
          const E = Es.value, A = [hA.x, hA.y], B = [hB.x, hB.y], C = [hC.x, hC.y];
          // left: index of refraction and forbidden region
          sP.raster((x, y) => (y < E ? v.ramp(0.35 * Math.sqrt(Math.max(0, E - y) / 2.4), 'teal') : null), { key: E.toFixed(3), res: 3 });
          sP.rect(XR[0] - 1, E, XR[1] + 1, YR[1] + 1, { fill: 'red', fillAlpha: 0.06, hatch: 'red', hatchAlpha: 0.25, stroke: false });
          sP.hline(E, { color: 'red', width: 1.4 });
          sP.text('U = E', XR[1], E, { color: 'red', math: true, align: 'right', dx: -6, dy: -10, size: 14 });
          const tp = truePaths(A, B, E), cols = ['green', 'orange'];
          tp.forEach((P, k) => sP.curve((t) => bez(A, P.C, B, t), 0, 1, { color: cols[k], width: 2.4, n: 80 }));
          sP.path([A, C, B], { color: 'accent', width: 1, dash: [3, 4], alpha: 0.6 });
          const wc = W(A, C, B, E);
          sP.curve((t) => bez(A, C, B, t), 0, 1, { color: isFinite(wc) ? 'accent' : 'red', width: 2.6, n: 80 });
          // right: W over C
          const key = [E, A, B].join('|');
          let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 30; i++) for (let j = 0; j <= 30; j++) { const w = W(A, [XR[0] + (i / 30) * (XR[1] - XR[0]), YR[0] + (j / 30) * (YR[1] - YR[0])], B, E, 24); if (isFinite(w)) { lo = Math.min(lo, w); hi = Math.max(hi, w); } }
          if (isFinite(lo)) {
            const top = lo + 0.7 * (hi - lo);
            sW.heat((x, y) => W(A, [x, y], B, E, 32), { range: [lo, top], cmap: 'theme', color: 'purple', res: 4, key });
            const lev = []; for (let k = 1; k <= 12; k++) lev.push(lo + (k / 13) * (top - lo));
            sW.contour((x, y) => W(A, [x, y], B, E, 24), lev, { color: 'ink', alpha: 0.3, width: 1, res: 70 });
          }
          tp.forEach((P, k) => sW.dot(P.C[0], P.C[1], { r: 6.5, color: cols[k], label: k ? 'lob (saddle)' : 'direct (minimum)', labelPos: k ? 'e' : 'se' }));
          sW.dot(C[0], C[1], { r: 5.5, color: 'accent', hollow: true });
          sW.dot(A[0], A[1], { r: 3.5, color: 'ink', label: 'A', labelPos: 'sw' }); sW.dot(B[0], B[1], { r: 3.5, color: 'ink', label: 'B', labelPos: 'se' });
          // stationarity check at each true path
          const info = tp.map((P) => {
            const h = 1e-3, f = (dx, dy) => W(A, [P.C[0] + dx, P.C[1] + dy], B, E, 400);
            const f0 = f(0, 0), gx = (f(h, 0) - f(-h, 0)) / (2 * h), gy = (f(0, h) - f(0, -h)) / (2 * h);
            const hxx = (f(h, 0) - 2 * f0 + f(-h, 0)) / (h * h), hyy = (f(0, h) - 2 * f0 + f(0, -h)) / (h * h), hxy = (f(h, h) - f(h, -h) - f(-h, h) + f(-h, -h)) / (4 * h * h);
            return { W: f0, g: Math.hypot(gx, gy), det: hxx * hyy - hxy * hxy };
          });
          cur = { wc, info, E };
        });
        v.legend([['accent', 'candidate path (control point $C$)'], ['green', 'direct throw'], ['orange', 'lob'], ['red', 'forbidden: $U > E$']]);
        v.readout(() => {
          if (!cur) return '';
          const { wc, info } = cur;
          const cand = isFinite(wc) ? String.raw`candidate: $W = \int\sqrt{2m(E-U)}\,ds = ${v.fix(wc, 4)}$` : 'the candidate enters the forbidden region, where $\\sqrt{E-U}$ is imaginary';
          if (!info.length) return cand + ' · **no real trajectory** reaches $B$ at this energy, and $W$ has no stationary point';
          return cand + ' · ' + info.map((I, k) => String.raw`${k ? 'lob' : 'direct'}: $W = ${v.fix(I.W, 4)}$, $|\nabla_C W| = ${sci(v, I.g)}$, Hessian determinant ${I.det > 0 ? '> 0 (minimum)' : '< 0 (saddle)'}`).join(' · ');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.7
    {
      num: '12.7',
      kind: 'Definition',
      name: 'Poisson bracket',
      statement: String.raw`The **Poisson bracket** of two functions $f, g$ on phase space is
$$\{f, g\} = \sum_{i=1}^n\left(\frac{\partial f}{\partial q_i}\frac{\partial g}{\partial p_i} - \frac{\partial f}{\partial p_i}\frac{\partial g}{\partial q_i}\right).$$
In one degree of freedom it is the Jacobian determinant $\partial(f,g)/\partial(q,p)$ (pma-9.38): the signed area of the parallelogram spanned by $\nabla f$ and $\nabla g$. It is bilinear, antisymmetric, and obeys the Leibniz rule $\{f, gh\} = \{f,g\}h + g\{f,h\}$. Its basic values are $\{q_i, p_j\} = \delta_{ij}$ and $\{q_i, q_j\} = \{p_i, p_j\} = 0$. It measures how $f$ changes along the Hamiltonian flow of $g$: if $\dot q = \partial g/\partial p$, $\dot p = -\partial g/\partial q$, then $df/dt = \{f, g\}$. In particular Hamilton’s equations read $\dot f = \{f, H\} + \partial f/\partial t$.`,
      idea: String.raw`The chain rule along the flow of $g$ gives $df/dt = f_q\dot q + f_p\dot p = f_qg_p - f_pg_q$, which is the bracket. Geometrically, the flow of $g$ moves along the level curves of $g$, perpendicular to $\nabla g$. The rate at which it crosses the levels of $f$ is $\nabla f$ dotted with $\nabla g$ turned through a right angle, which is the cross product of the two gradients. So $\{f,g\} = 0$ exactly where the level curves of $f$ and $g$ are tangent. If it vanishes everywhere, the flow of $g$ carries each level set of $f$ into itself.`,
      caption: String.raw`Type two functions of $q$ and $p$, or pick a pair. The background is the bracket $\{f, g\}$ (red positive, blue negative), the orange curves are level sets of $g$, the faint blue ones level sets of $f$, and the solid blue curves are those same level sets of $f$ after being carried for a time $\tau$ by the Hamiltonian flow of $g$. They move fastest where the bracket is large and stay put where it is zero. At the handle, the parallelogram spanned by $\nabla f$ and $\nabla g$ has signed area $\{f,g\}$. Right: $f$ along the flow of $g$ from the handle, with slope $\{f,g\}$ at the start.`,
      deps: ['mech-12.3', 'pma-9.38'],
      refs: ['Goldstein §9.5', 'Tong §4.3'],
      tags: ['Poisson bracket', 'phase space'],
      credit: 'Poisson, 1809',
      viz(v) {
        const PRE = { qp: ['q', 'p'], qH: ['q', '(q^2 + p^2)/2'], Hsq: ['(q^2 + p^2)/2', 'q p'], pend: ['p^2/2 - cos(q)', 'p'], inv: ['q^2 + p^2', '(q^2 + p^2)^2/4'] };
        const fI = v.input('$f(q, p) =$', 'q', { vars: ['q', 'p'] });
        const gI = v.input('$g(q, p) =$', '(q^2 + p^2)/2', { vars: ['q', 'p'] });
        v.select('pair', [{ value: 'qp', label: '$q, p$' }, { value: 'qH', label: '$q$, oscillator' }, { value: 'Hsq', label: 'oscillator, $qp$' }, { value: 'pend', label: 'pendulum, $p$' }, { value: 'inv', label: 'commuting' }], 'qH', { onChange: (k) => { fI.set(PRE[k][0]); gI.set(PRE[k][1]); } });
        const tS = v.slider('flow time $\\tau$ of $g$', 0, 1.5, 0.6, { step: 0.01 });
        const R = 2.5;
        const s = v.stage({ x: [-R, R], y: [-R, R], equal: true, axes: 'box', gutter: true, height: 420, weight: 1.55, xlabel: 'q', ylabel: 'p' });
        const sF = v.stage({ x: [0, 1.5], y: [-1, 1], axes: 'box', gutter: true, height: 420, weight: 1, xlabel: 'τ', title: '$f$ along the flow of $g$ from the handle' });
        const pr = s.handle(0.9, 0.7, { color: 'gold', r: 7 });
        const F = (q, p) => { const f = fI.fn; return f ? f(q, p) : NaN; }, G = (q, p) => { const g = gI.fn; return g ? g(q, p) : NaN; };
        const br = (q, p) => dq(F, q, p) * dp(G, q, p) - dp(F, q, p) * dq(G, q, p);
        const Xg = (q, p) => [dp(G, q, p), -dq(G, q, p)];
        const flowPt = (q, p, tau) => { const n = Math.max(1, Math.ceil(Math.abs(tau) / 0.05)), h = tau / n; let y = [q, p]; for (let k = 0; k < n; k++) y = rk4((t, z) => Xg(z[0], z[1]), 0, y, h); return y; };
        const cacheG = memo(); const RES = 64;
        const pulled = () => cacheG([fI.value, gI.value, tS.value, s.W, s.H].join('|'), () => {
          // f∘φ_{−τ} on the same grid that s.contour samples: the level sets of this function are the transported level sets of f
          const nx = RES, ny = Math.max(8, Math.round((nx * s.H) / Math.max(1, s.W))), [x0, x1] = s.bounds.x, [y0, y1] = s.bounds.y, dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
          const A = new Float64Array((nx + 1) * (ny + 1));
          for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const z = flowPt(x0 + i * dx, y0 + j * dy, -tS.value); const val = F(z[0], z[1]); A[j * (nx + 1) + i] = Math.abs(z[0]) > 40 || Math.abs(z[1]) > 40 ? NaN : val; }
          const vals = []; for (let j = 0; j <= ny; j += 4) for (let i = 0; i <= nx; i += 4) { const q = x0 + i * dx, p = y0 + j * dy; const f = F(q, p); if (isFinite(f)) vals.push(f); }
          vals.sort((a, b) => a - b);
          const lev = []; if (vals.length) for (let k = 1; k <= 9; k++) lev.push(vals[Math.floor((k / 10) * (vals.length - 1))]);
          const glev = []; const gv = []; for (let j = 0; j <= ny; j += 4) for (let i = 0; i <= nx; i += 4) { const g = G(x0 + i * dx, y0 + j * dy); if (isFinite(g)) gv.push(g); }
          gv.sort((a, b) => a - b); if (gv.length) for (let k = 1; k <= 7; k++) glev.push(gv[Math.floor((k / 8) * (gv.length - 1))]);
          let bmax = 1e-9; for (let j = 0; j <= ny; j += 3) for (let i = 0; i <= nx; i += 3) { const b = br(x0 + i * dx, y0 + j * dy); if (isFinite(b)) bmax = Math.max(bmax, Math.abs(b)); }
          return { A, nx, ny, x0, y0, dx, dy, lev: [...new Set(lev)], glev: [...new Set(glev)], bmax };
        });
        let cur = null;
        v.render(() => {
          if (!fI.fn || !gI.fn) return;
          const P = pulled(), look = (x, y) => P.A[Math.round((y - P.y0) / P.dy) * (P.nx + 1) + Math.round((x - P.x0) / P.dx)];
          s.heat(br, { range: [-P.bmax, P.bmax], cmap: 'theme-diverging', res: 3, key: fI.value + '|' + gI.value });
          s.contour(G, P.glev, { color: 'orange', width: 1.4, alpha: 0.85, res: 110 });
          s.contour(F, P.lev, { color: 'blue', width: 1, alpha: 0.3, res: 110 });
          s.contour(look, P.lev, { color: 'blue', width: 2.1, res: RES });
          // gradient parallelogram at the probe
          const q = pr.x, p = pr.y, gf = [dq(F, q, p), dp(F, q, p)], gg = [dq(G, q, p), dp(G, q, p)], b = br(q, p);
          const k = 0.75 / Math.max(1e-9, Math.hypot(...gf), Math.hypot(...gg));
          const a1 = [gf[0] * k, gf[1] * k], a2 = [gg[0] * k, gg[1] * k];
          s.poly([[q, p], [q + a1[0], p + a1[1]], [q + a1[0] + a2[0], p + a1[1] + a2[1]], [q + a2[0], p + a2[1]]], { fill: b >= 0 ? 'red' : 'blue', fillAlpha: 0.3, color: b >= 0 ? 'red' : 'blue', width: 1 });
          s.arrow(q, p, q + a1[0], p + a1[1], { color: 'blue', width: 2.2, head: 8 });
          s.arrow(q, p, q + a2[0], p + a2[1], { color: 'orange', width: 2.2, head: 8 });
          s.text('∇f', q + a1[0], p + a1[1], { color: 'blue', dx: 6, dy: -8, size: 13 });
          s.text('∇g', q + a2[0], p + a2[1], { color: 'orange', dx: 6, dy: -8, size: 13 });
          const path = []; for (let i = 0; i <= 40; i++) path.push(flowPt(q, p, (tS.value * i) / 40));
          s.path(path, { color: 'gold', width: 2 });
          // f along the flow
          const fs = []; for (let i = 0; i <= 60; i++) { const tau = (1.5 * i) / 60, z = i ? flowPt(fs[i - 1].z[0], fs[i - 1].z[1], 1.5 / 60) : [q, p]; fs.push({ tau, z, f: F(z[0], z[1]) }); }
          let lo = Infinity, hi = -Infinity; for (const e of fs) if (isFinite(e.f)) { lo = Math.min(lo, e.f); hi = Math.max(hi, e.f); }
          const pad = Math.max(0.2, 0.15 * (hi - lo)); sF.setView([0, 1.5], [lo - pad, hi + pad]);
          sF.path(fs.map((e) => [e.tau, e.f]), { color: 'blue', width: 2.4 });
          const f0 = fs[0].f; sF.line(0, f0, 0.6, f0 + 0.6 * b, { color: 'red', width: 1.6, dash: [6, 4] });
          const ft = F(...flowPt(q, p, tS.value));
          sF.vline(tS.value, { color: 'gold' }); sF.dot(tS.value, ft, { r: 5, color: 'gold' });
          const d = 1e-4, fd = (F(...flowPt(q, p, d)) - F(...flowPt(q, p, -d))) / (2 * d);
          cur = { b, fd, bq: br(q, p), rev: dq(G, q, p) * dp(F, q, p) - dp(G, q, p) * dq(F, q, p) };
        });
        v.legend([['red', '$\\{f,g\\} > 0$', { area: true }], ['blue', '$\\{f,g\\} < 0$', { area: true }], ['orange', 'levels of $g$ / $\\nabla g$'], ['blue', 'levels of $f$, carried by the flow of $g$'], ['gold', 'flow of $g$ from the handle']]);
        v.readout(() => {
          if (!fI.fn || !gI.fn) return 'type valid formulas in $q$ and $p$';
          if (!cur) return '';
          return String.raw`at the handle: $\{f,g\} = f_qg_p - f_pg_q = ${num(v, cur.b, 5)}$ (signed area of the parallelogram) · rate of change of $f$ along the flow of $g$, measured: $${num(v, cur.fd, 5)}$ · $\{g,f\} = ${num(v, cur.rev, 5)}$ (antisymmetry)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.8
    {
      num: '12.8',
      kind: 'Theorem',
      name: 'Jacobi identity and Poisson’s theorem',
      statement: String.raw`For any three smooth functions on phase space, the **Jacobi identity**
$$\{f, \{g, h\}\} + \{g, \{h, f\}\} + \{h, \{f, g\}\} = 0$$
holds, so the Poisson bracket makes the smooth functions a Lie algebra. **Poisson’s theorem** follows: if $f$ and $g$ are constants of motion of a time-independent Hamiltonian, so is $\{f, g\}$. For a particle, $\{L_x, L_y\} = L_z$ (and cyclically), so a system that conserves two components of angular momentum conserves the third, and with it all of $\mathbf L$.`,
      idea: String.raw`Each term of the Jacobi sum is a sum of products of first and second derivatives. Collecting the terms that contain second derivatives of $h$, say, they form $\{f,\{g,h\}\} - \{g,\{f,h\}\}$, a commutator of two first-order differential operators applied to $h$. Because mixed partial derivatives are equal (pma-9.41), such a commutator is again first order, and its second-derivative terms cancel; the first-order terms cancel by the same symmetry. Poisson’s theorem is then the identity with $h = H$: $\{\{f,g\},H\} = \{f,\{g,H\}\} - \{g,\{f,H\}\} = 0$ when both inner brackets vanish.`,
      caption: String.raw`Top: a particle orbits in a smooth potential well. Choose its symmetry and watch the three components of $\mathbf L$ (right). Symmetric about $z$ only, just $L_z$ survives; about $x$ only, just $L_x$; spherical, all three; triaxial, none. No choice keeps exactly two, as Poisson’s theorem demands. Bottom: the Jacobi identity for three random cubic polynomials $f, g, h$ in $(q, p)$, computed exactly. The three cyclic terms are large and structured, but their sum is zero everywhere. Resample, or replace the bracket by the symmetric product $f_qg_p + f_pg_q$, which is not a Lie bracket, and watch the sum come alive.`,
      deps: ['mech-12.7', 'pma-9.41'],
      refs: ['Goldstein §9.6', 'Arnold §40'],
      tags: ['Jacobi identity', 'Poisson bracket', 'angular momentum'],
      credit: 'Jacobi, 1842; Poisson, 1809',
      viz(v) {
        const sym = v.select('potential symmetric under', [{ value: 'sph', label: 'all rotations' }, { value: 'z', label: 'rotations about $z$' }, { value: 'x', label: 'rotations about $x$' }, { value: 'tri', label: 'none (triaxial)' }], 'z', { onChange: () => v.restart() });
        const brS = v.select('bracket', [{ value: 'pb', label: 'Poisson $f_qg_p - f_pg_q$' }, { value: 'sym', label: 'symmetric $f_qg_p + f_pg_q$' }], 'pb');
        let seed = 3; v.button('Resample $f, g, h$', () => { seed++; });
        const S3 = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 300, weight: 1, title: 'orbit and $\\mathbf L$ (drag to rotate)' });
        const sc = v.scene3(S3, { yaw: -0.55, pitch: 0.38, axis: 1.3, hint: false });
        const sL = v.stage({ x: [0, 50], y: [-1, 1], axes: 'box', gutter: true, height: 300, weight: 1.25, xlabel: 't', title: 'components of $\\mathbf L$' });
        const sJ = v.stage({ x: [-0.05, 4.5], y: [-0.08, 1.12], axes: false, height: 230, full: true });
        const AX = { sph: [1, 1, 1], z: [1, 1, 0.68], x: [0.68, 1, 1], tri: [1, 0.82, 0.66] };
        const cache = memo(), cacheJ = memo(); let cur = null;
        const run = () => cache(sym.value, () => {
          const [a, b, c] = AX[sym.value], w = (y) => { const s2 = (y[0] / a) ** 2 + (y[1] / b) ** 2 + (y[2] / c) ** 2 + 0.25; return s2; };
          const f = (t, y) => { const s2 = w(y), k = -1 / Math.pow(s2, 1.5); return [y[3], y[4], y[5], k * y[0] / (a * a), k * y[1] / (b * b), k * y[2] / (c * c)]; };
          const R = rk4rec(f, [0.9, 0.15, 0.35, -0.05, 0.62, 0.42], 50, 10000, 8);
          const L = R.y.map((y) => [y[1] * y[5] - y[2] * y[4], y[2] * y[3] - y[0] * y[5], y[0] * y[4] - y[1] * y[3]]);
          const dev = [0, 1, 2].map((k) => { let lo = Infinity, hi = -Infinity; for (const l of L) { lo = Math.min(lo, l[k]); hi = Math.max(hi, l[k]); } return hi - lo; });
          // {L_x, L_y} at the start, by finite differences in the six phase coordinates
          const Lc = (y, k) => [y[1] * y[5] - y[2] * y[4], y[2] * y[3] - y[0] * y[5], y[0] * y[4] - y[1] * y[3]][k];
          const y0 = R.y[0], d = (k, i) => { const e = 1e-5, u = y0.slice(), w2 = y0.slice(); u[i] += e; w2[i] -= e; return (Lc(u, k) - Lc(w2, k)) / (2 * e); };
          let pb = 0; for (let i = 0; i < 3; i++) pb += d(0, i) * d(1, i + 3) - d(0, i + 3) * d(1, i);
          return { R, L, dev, pb, Lz0: L[0][2] };
        });
        const polys = () => cacheJ(seed + '|' + brS.value, () => {
          const r = v.rng(seed), rnd = () => { const A = pz(); for (let i = 0; i <= 3; i++) for (let j = 0; i + j <= 3; j++) A[i][j] = Math.round(r.uniform(-2, 2) * 2) / 2; return A; };
          const f = rnd(), g = rnd(), h = rnd(), s = brS.value === 'pb' ? -1 : 1;
          const B = (X, Y) => pLin(pMul(pD(X, 'q'), pD(Y, 'p')), pMul(pD(X, 'p'), pD(Y, 'q')), s);
          const T = [B(f, B(g, h)), B(g, B(h, f)), B(h, B(f, g))], Sm = pLin(pLin(T[0], T[1]), T[2]);
          let mx = 1e-12, ms = 0; const all = []; for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) { const q = -1.2 + (2.4 * i) / 40, p = -1.2 + (2.4 * j) / 40; for (const X of T) { const z = Math.abs(pEval(X, q, p)); mx = Math.max(mx, z); all.push(z); } ms = Math.max(ms, Math.abs(pEval(Sm, q, p))); }
          all.sort((u, w) => u - w); const rng = Math.max(1e-9, all[Math.floor(0.85 * (all.length - 1))]);
          return { T, Sm, mx, ms, rng, key: seed + '|' + brS.value };
        });
        v.animate((tt) => {
          const B = run(), tau = Math.min(2.2 * tt, 50), i = idxAt(B.R, tau), y = B.R.y[i], l = B.L[i];
          sc.begin();
          sc.path(B.R.y.slice(Math.max(0, i - 500), i + 1).map((z) => [z[0], z[1], z[2]]), { color: 'accent', width: 1.3, alpha: 0.7 });
          sc.dot([y[0], y[1], y[2]], { r: 5.5, color: 'gold' });
          sc.arrow([0, 0, 0], [l[0] * 1.6, l[1] * 1.6, l[2] * 1.6], { color: 'green', width: 2.4 });
          sc.tex('\\mathbf L', [l[0] * 1.75, l[1] * 1.75, l[2] * 1.75], { color: 'green' });
          sc.flush();
          sL.setView([0, 50], [-0.85, 0.85]);
          const cols = ['red', 'blue', 'purple'], names = ['L_x', 'L_y', 'L_z'];
          for (let k = 0; k < 3; k++) { series(sL, B.R.t, B.L.map((z) => z[k]), i, { color: cols[k], width: 2 }); sL.tex(names[k], Math.min(49, tau) + 0.5, l[k], { color: cols[k], size: 14, align: 'left' }); }
          sL.vline(tau, { color: 'gold' });
          // Jacobi tiles
          const P = polys(), labels = ['\\{f,\\{g,h\\}\\}', '\\{g,\\{h,f\\}\\}', '\\{h,\\{f,g\\}\\}', '\\text{sum}'];
          [...P.T, P.Sm].forEach((X, k) => {
            const x0 = k * 1.13, rect = [x0, 0, x0 + 1, 1];
            sJ.heat((x, yy) => pEval(X, -1.2 + 2.4 * (x - x0), -1.2 + 2.4 * yy), { range: [-P.rng, P.rng], cmap: 'theme-diverging', res: 2, rect, key: P.key, id: 'j' + k });
            sJ.rect(...rect, { color: k === 3 ? 'ink' : 'faint', width: k === 3 ? 1.6 : 1 });
            sJ.tex(labels[k], x0 + 0.5, 1.06, { size: 14, color: k === 3 ? 'ink' : 'muted' });
            if (k < 3) sJ.text(k < 2 ? '+' : '=', x0 + 1.065, 0.5, { size: 18, align: 'center', color: 'muted' });
          });
          cur = { B, P };
        }, { period: 24, still: 12 });
        v.legend([['red', '$L_x$'], ['blue', '$L_y$'], ['purple', '$L_z$'], ['green', '$\\mathbf L$'], ['red', 'positive', { area: true }], ['blue', 'negative', { area: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B, P } = cur, nm = ['L_x', 'L_y', 'L_z'];
          const cons = B.dev.map((d, k) => String.raw`$${nm[k]}$ ${d < 1e-6 ? 'conserved' : 'varies'} (range $${sci(v, d)}$)`).join(', ');
          return cons + String.raw` · at the start $\{L_x, L_y\} = ${v.fix(B.pb, 6)}$, $L_z = ${v.fix(B.Lz0, 6)}$ · Jacobi sum: largest $|\text{sum}| = ${sci(v, P.ms)}$ against largest term $${v.fix(P.mx, 1)}$` + (brS.value === 'sym' ? ' — the symmetric product violates the identity' : ' (exact polynomial arithmetic, so zero up to rounding)');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 12.9
    {
      num: '12.9',
      kind: 'Theorem',
      name: 'Hidden symmetry of the Kepler problem',
      statement: String.raw`For $H = \mathbf p^2/2m - k/r$ the **Laplace–Runge–Lenz vector** $\mathbf A = \mathbf p\times\mathbf L - mk\,\hat{\mathbf r}$ (8.10) satisfies $\{\mathbf A, H\} = 0$: it is conserved, pointing at the pericentre with length $mk\,e$. Since $\{A_i, H\} = 0$, each component generates, through its Hamiltonian flow, a symmetry that preserves $H$. This flow carries Kepler orbits to Kepler orbits of the **same energy**, hence the same semi-major axis $a = k/2|E|$ and period, while changing the eccentricity and $|\mathbf L|$: it sweeps a circle continuously into a needle. Together, $\mathbf L$ and $\mathbf A/\sqrt{2m|E|}$ satisfy the bracket relations of the rotation group in four dimensions, $SO(4)$, larger than the obvious $SO(3)$. That is why bound orbits close and why the hydrogen levels depend on $n$ alone. Any other perturbing force breaks the symmetry: for an added $1/r^3$ force, $\mathbf A$ precesses.`,
      idea: String.raw`Differentiating $\mathbf A$ along the motion, $\dot{\mathbf p}\times\mathbf L = -(k/r^2)\hat{\mathbf r}\times(m\,\mathbf r\times\dot{\mathbf r})$ equals $mk\,\dot{\hat{\mathbf r}}$ exactly for the inverse-square force, so $\dot{\mathbf A} = 0$; in bracket form, $\{\mathbf A, H\} = 0$. By the Jacobi identity (12.8), brackets of conserved quantities are conserved, and the components of $\mathbf L$ and $\mathbf A$ close among themselves. The flow of a conserved $G$ commutes with the time evolution, so it maps solutions to solutions, and $dH/ds = \{H, G\} = 0$ along it. With an extra potential $-\varepsilon/2r^2$ the orbit equation becomes $u'' + (1 - \varepsilon/L^2)u = mk/L^2$, an ellipse that turns by $2\pi(1/\gamma - 1)$ per revolution with $\gamma = \sqrt{1 - \varepsilon/L^2}$ ($m = k = 1$).`,
      caption: String.raw`Left: an orbit integrated by velocity Verlet, with $\mathbf A$ drawn from the focus (green) and its tip traced in gold. With pure $1/r^2$ gravity, $\mathbf A$ is frozen. Turn on the $1/r^3$ perturbation and the pericentre, and $\mathbf A$ with it, precesses at the predicted rate. Right: the symmetry generated by $A_y$. Starting from the same orbit, the flow of $A_y$ (fictitious time $s$) moves the state, and the orbit through the new state is drawn; the faint fan shows a range of $s$. Every orbit in the fan has the same energy, semi-major axis and period, from circle to needle.`,
      deps: ['mech-12.8', 'mech-8.10'],
      refs: ['Tong §4.3', 'Goldstein §9.8'],
      tags: ['Kepler problem', 'Runge–Lenz vector', 'symmetry'],
      credit: 'Laplace, 1799; Pauli, 1926 (SO(4) and hydrogen); Fock, 1935',
      viz(v) {
        const eS = v.slider('eccentricity of the starting orbit', 0, 0.75, 0.35, { step: 0.01 });
        const epS = v.slider('extra $1/r^3$ force $\\varepsilon$', 0, 0.2, 0.05, { step: 0.002 });
        const sS = v.slider('flow parameter $s$ of $A_y$', -1.2, 1.2, 0.45, { step: 0.01 });
        const sO = v.stage({ x: [-2.1, 1.7], y: [-1.6, 1.6], equal: true, axes: false, height: 340, title: 'orbit and $\\mathbf A$' });
        const sF = v.stage({ x: [-2.1, 2.1], y: [-1.6, 1.6], equal: true, axes: false, height: 340, title: 'orbits swept by the flow of $A_y$' });
        const Avec = (y) => { const r = Math.hypot(y[0], y[1]), L = y[0] * y[3] - y[1] * y[2]; return [y[3] * L - y[0] / r, -y[2] * L - y[1] / r]; };
        const elems = (y) => { const r = Math.hypot(y[0], y[1]), E = 0.5 * (y[2] ** 2 + y[3] ** 2) - 1 / r, L = y[0] * y[3] - y[1] * y[2], A = Avec(y); return { E, L, a: -1 / (2 * E), e: Math.hypot(A[0], A[1]), w: Math.atan2(A[1], A[0]) }; };
        const ellipse = (el) => { const pts = [], pl = el.a * (1 - el.e * el.e); for (let k = 0; k <= 240; k++) { const th = (TAU * k) / 240, r = pl / (1 + el.e * Math.cos(th - el.w)); pts.push([r * Math.cos(th), r * Math.sin(th)]); } return pts; };
        const start = () => { const e = eS.value, rp = 1 - e; return [rp, 0, 0, Math.sqrt((1 + e) / rp)]; };
        const cache = memo(), cacheF = memo(); let cur = null;
        const run = () => cache(eS.value + '|' + epS.value, () => {
          const eps = epS.value, acc = (x, y) => { const r = Math.hypot(x, y), k = -(1 / (r * r) + eps / (r * r * r)) / r; return [k * x, k * y]; };
          let y = start(), a = acc(y[0], y[1]); const dt = 0.002, TT = 70, EV = 5, out = { t: [0], y: [y.slice()], dt: dt * EV };
          for (let k = 1; k <= TT / dt; k++) {
            y[2] += 0.5 * dt * a[0]; y[3] += 0.5 * dt * a[1]; y[0] += dt * y[2]; y[1] += dt * y[3]; a = acc(y[0], y[1]); y[2] += 0.5 * dt * a[0]; y[3] += 0.5 * dt * a[1];
            if (k % EV === 0) { out.t.push(k * dt); out.y.push(y.slice()); }
          }
          const rs = out.y.map((z) => Math.hypot(z[0], z[1])), peri = [];
          for (let i = 1; i < rs.length - 1; i++) if (rs[i] < rs[i - 1] && rs[i] <= rs[i + 1]) {
            // parabolic refinement of the minimum of r between samples, then interpolate the polar angle
            const den = rs[i - 1] - 2 * rs[i] + rs[i + 1], d = den > 0 ? (0.5 * (rs[i - 1] - rs[i + 1])) / den : 0, th = (z) => Math.atan2(z[1], z[0]);
            let a0 = th(out.y[i - 1]), a1 = th(out.y[i]), a2 = th(out.y[i + 1]); a0 = a1 + wrap(a0 - a1); a2 = a1 + wrap(a2 - a1);
            peri.push(a1 + d * (a2 - a0) / 2 + 0.5 * d * d * (a2 - 2 * a1 + a0));
          }
          let tot = 0; for (let i = 1; i < peri.length; i++) { let d = peri[i] - peri[i - 1]; d -= TAU * Math.round(d / TAU); tot += d; }
          const L = start()[0] * start()[3], gam = Math.sqrt(Math.max(1e-9, 1 - eps / (L * L)));
          return { out, A: out.y.map(Avec), meas: peri.length > 1 ? tot / (peri.length - 1) : NaN, pred: TAU * (1 / gam - 1), eps };
        });
        const famF = () => cacheF(eS.value, () => {
          // the Hamiltonian flow of A_y, by RK4 in the fictitious time s, both ways from the starting state
          const grad = (t, y) => {
            const [x, yy, px, py] = y, r = Math.hypot(x, yy), r3 = r * r * r, L = x * py - yy * px;
            return [-L + px * yy, -px * x, -(-px * py + (x * yy) / r3), -(px * px - 1 / r + (yy * yy) / r3)];
          };
          const go = (dir) => { const out = [start()]; let y = start(); const ds = 0.002 * dir; for (let k = 1; k <= 600; k++) { y = rk4(grad, 0, y, ds); if (k % 5 === 0) { out.push(y.slice()); if (elems(y).e > 0.985) break; } } return out; };
          return { fw: go(1), bw: go(-1) };
        });
        v.animate((tt) => {
          const B = run(), tau = (2.2 * tt) % 70, i = idxAt(B.out, tau), y = B.out.y[i];
          // left: orbit with A
          sO.path(B.out.y.slice(Math.max(0, i - 1400), i + 1).map((z) => [z[0], z[1]]), { color: 'accent', width: 1.4, alpha: 0.8 });
          sO.path(B.A.slice(0, i + 1).map((a) => [a[0] * 1.6, a[1] * 1.6]), { color: 'gold', width: 2 });
          const A = B.A[i];
          sO.arrow(0, 0, A[0] * 1.6, A[1] * 1.6, { color: 'green', width: 2.6, head: 9 });
          sO.tex('\\mathbf A', A[0] * 1.6, A[1] * 1.6, { color: 'green', dx: 10, dy: -10 });
          sO.dot(0, 0, { r: 6, color: 'orange' });
          sO.dot(y[0], y[1], { r: 5.5, color: 'gold' });
          // right: the A_y family
          const Fm = famF(), pick = (s) => { const arr = s >= 0 ? Fm.fw : Fm.bw, k = Math.min(arr.length - 1, Math.round(Math.abs(s) / 0.01)); return { y: arr[k], clipped: Math.round(Math.abs(s) / 0.01) > arr.length - 1 }; };
          for (let s = -1.2; s <= 1.21; s += 0.2) sF.path(ellipse(elems(pick(s).y)), { color: 'purple', width: 1, alpha: 0.28 });
          const P = pick(sS.value), el = elems(P.y), el0 = elems(start());
          sF.path(ellipse(el0), { color: 'accent', width: 1.4, dash: [5, 4] });
          sF.path(ellipse(el), { color: 'purple', width: 2.6 });
          sF.circle(0, 0, el.a, { color: 'faint', width: 1, dash: [2, 4] });
          sF.dot(P.y[0], P.y[1], { r: 5.5, color: 'gold' });
          sF.dot(0, 0, { r: 6, color: 'orange' });
          cur = { B, el, el0, clipped: P.clipped };
        }, { period: 32, still: 20 });
        v.legend([['accent', 'orbit (left) / starting orbit (right)'], ['green', '$\\mathbf A$'], ['gold', 'trace of the tip of $\\mathbf A$'], ['purple', 'orbit carried by the flow of $A_y$']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, el, el0 } = cur, deg = (x) => v.fix(x / DEG, 3);
          const left = B.eps === 0 ? String.raw`pure $1/r^2$: pericentre advance per revolution ${isFinite(B.meas) ? deg(B.meas) : '—'}° — $\mathbf A$ is fixed` : String.raw`pericentre advance per revolution: measured ${isFinite(B.meas) ? deg(B.meas) : '—'}°, exact $360°(1/\gamma - 1) = ${deg(B.pred)}°$`;
          return left + String.raw` · flow of $A_y$: $E = ${v.fix(el.E, 5)}$ (start ${v.fix(el0.E, 5)}), $a = ${v.fix(el.a, 4)}$, period $2\pi a^{3/2} = ${v.fix(TAU * el.a ** 1.5, 4)}$, while $e$ went from ${v.fix(el0.e, 3)} to ${v.fix(el.e, 3)} and $L$ from ${v.fix(el0.L, 3)} to ${v.fix(el.L, 3)}` + (cur.clipped ? ' (stopped near the collision orbit $e \\to 1$)' : '');
        });
      },
    },
  ],
};
