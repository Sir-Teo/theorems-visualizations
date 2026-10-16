// Electromagnetism — Chapter 2: The electric potential (items 2.1–2.6; 2.7–2.12 in ch02-b.js, 2.13–2.17 in ch02-c.js)
//
// Units in the pictures: positions in cm, point charges in nC, potentials in volts, fields in V/cm, work in nJ (nC·V).
import { TAU, KV, pot, fld, sgnCol, showStage, nC, drawCharge, arrowPx, quiver, heatPot, levels, lineInt, nsub, spline } from './ch02.shared.js';

/** A localized, non-electrostatic swirl (an induced field, say): E = κ(−(y−y0), x−x0)·exp(−r²/2σ²), κ in V/cm². */
function swirl(x, y, k, cx = -0.5, cy = -0.5, sg = 2.2) {
  if (!k) return [0, 0];
  const dx = x - cx, dy = y - cy, g = k * Math.exp(-(dx * dx + dy * dy) / (2 * sg * sg));
  return [-dy * g, dx * g];
}

export default {
  collection: 'em',
  chapter: 2,
  title: 'The electric potential',
  summary: String.raw`Static electric fields are curl-free, so their line integrals depend only on the endpoints and the field is minus the gradient of a scalar potential $V$. That potential obeys Poisson’s equation, with the Coulomb potential $1/4\pi\varepsilon_0 r$ as its Green’s function, and Laplace’s equation where there is no charge — which brings the mean value property and Earnshaw’s theorem: no static arrangement of charges can hold another charge in stable equilibrium. The work needed to assemble charges is stored in the field with density $\varepsilon_0E^2/2$, a bookkeeping that diverges for a true point charge, and across a charged surface the normal field jumps while the tangential field does not.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Theorem',
      name: 'Electrostatic fields are curl-free',
      statement: String.raw`The electric field of any distribution of charges at rest satisfies
$$\nabla\times\mathbf E = \mathbf 0 \qquad\text{equivalently}\qquad \oint_C \mathbf E\cdot d\mathbf l = 0$$
for every closed loop $C$. Here $\mathbf E$ is the sum of Coulomb fields of fixed charges; the statement is false for fields that are also produced by changing magnetic fields.`,
      idea: String.raw`The Coulomb field of one point charge is $\mathbf E = \dfrac{q}{4\pi\varepsilon_0}\dfrac{\hat{\mathbf r}}{r^2}$: purely radial, with a magnitude that depends on $r$ only. A field of the form $f(r)\,\hat{\mathbf r}$ has no curl, because its circulation around any small loop vanishes by symmetry (the radial parts are perpendicular to the loop's tangent in the spherical coordinates, and the $r$-dependence cancels in the rotational derivatives). Curl is linear, so superposition (em-1.4) extends this to any collection of charges, continuous ones included (em-1.7). Stokes’s theorem (pma-10.50) turns $\nabla\times\mathbf E=0$ into zero circulation around every closed loop.`,
      caption: String.raw`Drag the three charges and the paddle wheel (gold). The wheel turns at a rate proportional to the curl of $\mathbf E$ at its centre, which is measured as the circulation around the small ring divided by its area; the right-hand map shows the curl everywhere and stays exactly neutral for charges alone. Now raise the **swirl** slider: a non-electrostatic, induced-looking component is added, the curl map lights up around it (red counter-clockwise, blue clockwise) and a wheel placed there starts to spin. Charges never make the wheel turn, wherever you put it.`,
      scope: String.raw`Holds for charges at rest (or, to excellent approximation, for slowly changing fields). With changing magnetic fields $\nabla\times\mathbf E=-\partial\mathbf B/\partial t$ and the circulation no longer vanishes.`,
      deps: ['em-1.3', 'em-1.4', 'pma-10.43', 'vcalc-3.7'],
      refs: ['Griffiths §2.2'],
      tags: ['curl', 'electrostatics'],
      viz(v) {
        const s = v.stage({ x: [-6, 6], y: [-4.2, 4.2], equal: true, height: 340, axes: false, weight: 1.15, title: 'the field $\\mathbf E$ and a paddle wheel' });
        const sc = v.stage({ x: [-6, 6], y: [-4.2, 4.2], equal: true, height: 340, axes: false, weight: 1, title: 'curl map $\\partial_xE_y-\\partial_yE_x$' });
        const kap = v.slider('non-electrostatic swirl $\\kappa$', 0, 100, 0, { step: 1, fmt: (x) => `${x} V/cm²` });
        const src = [{ x: -3, y: 1.2, q: 3 }, { x: 2.6, y: 2.0, q: -2 }, { x: 1.4, y: -2.6, q: 2 }];
        const hs = src.map((c) => s.handle(c.x, c.y, { color: sgnCol(c.q), r: 9, label: nC(c.q), labelPos: 'ne' }));
        const W = s.handle(0.8, 0.2, { color: 'gold', r: 6, label: 'wheel', labelPos: 'n' });
        const RHO = 0.45;
        const E = (x, y) => { const a = fld(src, x, y), b = swirl(x, y, kap.value); return [a[0] + b[0], a[1] + b[1]]; };
        const curlAt = (x, y, h = 0.01) => (E(x + h, y)[1] - E(x - h, y)[1] - (E(x, y + h)[0] - E(x, y - h)[0])) / (2 * h);
        const circ = (x, y, rho = RHO, n = 90) => { let c = 0; for (let k = 0; k < n; k++) { const t = ((k + 0.5) / n) * TAU, e = E(x + rho * Math.cos(t), y + rho * Math.sin(t)); c += (-e[0] * Math.sin(t) + e[1] * Math.cos(t)) * rho * (TAU / n); } return c; };
        let cur = 0, ci = 0;
        v.animate((t) => {
          src.forEach((c, i) => { c.x = hs[i].x; c.y = hs[i].y; });
          const key = src.map((c) => c.x.toFixed(2) + c.y.toFixed(2)).join() + '|' + kap.value;
          quiver(s, E, { spacing: 32 });
          if (kap.value) s.circle(-0.5, -0.5, 2.2, { color: 'purple', dash: [4, 4], width: 1.2, alpha: 0.7 });
          src.forEach((c) => drawCharge(s, c.x, c.y, c.q, 8));
          ci = circ(W.x, W.y); cur = ci / (Math.PI * RHO * RHO);
          const ang = 0.035 * cur * t;
          s.circle(W.x, W.y, RHO, { color: 'gold', width: 1.4, dash: [3, 3] });
          for (let k = 0; k < 4; k++) {
            const a = ang + (k * Math.PI) / 2, ux = Math.cos(a), uy = Math.sin(a);
            s.line(W.x, W.y, W.x + RHO * 0.95 * ux, W.y + RHO * 0.95 * uy, { color: 'ink', width: 2.2 });
            s.line(W.x + RHO * 0.95 * ux - 0.13 * uy, W.y + RHO * 0.95 * uy + 0.13 * ux, W.x + RHO * 0.95 * ux + 0.13 * uy, W.y + RHO * 0.95 * uy - 0.13 * ux, { color: k % 2 ? 'orange' : 'gold', width: 4 });
          }
          heatPot(sc, (x, y) => (src.some((c) => Math.hypot(x - c.x, y - c.y) < 0.7) ? NaN : curlAt(x, y, 0.02)), 90, key, { res: 4 });
          sc.circle(-0.5, -0.5, 2.2, { color: 'purple', dash: [4, 4], width: 1.2, alpha: 0.7 });
          src.forEach((c) => sc.dot(c.x, c.y, { r: 4, color: sgnCol(c.q) }));
          sc.dot(W.x, W.y, { r: 5, color: 'gold' });
          sc.corner('red: counter-clockwise · blue: clockwise · white: zero', 'bl', { size: 11, plate: true });
        }, { still: 3 });
        v.readout(() => `**Around the wheel's ring** (radius ${RHO} cm): $\\oint\\mathbf E\\cdot d\\mathbf l = ${v.fix(ci, 3)}$ V, divided by the area $\\pi\\rho^2$: $(\\nabla\\times\\mathbf E)_z\\approx ${v.fix(cur, 2)}$ V/cm²; central differences give $ ${v.fix(curlAt(W.x, W.y), 2)}$ V/cm². ${Math.abs(cur) < 0.05 ? 'The wheel does not turn: the field is irrotational here.' : 'The wheel turns ' + (cur > 0 ? 'counter-clockwise' : 'clockwise') + '.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Path independence of the work integral',
      statement: String.raw`In an electrostatic field the line integral $\int_a^b\mathbf E\cdot d\mathbf l$ has the same value along every path from $a$ to $b$ (any piecewise smooth path that avoids the point charges). Equivalently the work done by the field on a test charge $q$ moving from $a$ to $b$ depends only on the endpoints, and $\oint\mathbf E\cdot d\mathbf l=0$ around every closed loop.`,
      idea: String.raw`Two paths from $a$ to $b$ make a closed loop when one is run backwards, and the circulation around it vanishes by em-2.1 (Stokes’s theorem, pma-10.50, applied to a surface spanning the loop). So the integrals along the two paths are equal. The argument fails exactly when $\nabla\times\mathbf E\neq 0$ somewhere inside the loop, and it also needs the loop to bound a surface that avoids the charges: the paths themselves may go anywhere except through a point charge.`,
      caption: String.raw`Drag the end points $A$, $B$, the three waypoints of the blue path and the charges. The blue curve and the orange straight line from $A$ to $B$ give the same $\int\mathbf E\cdot d\mathbf l$ however wild the blue one is, and the right panel shows the running integral along both finishing at the same height — the green line is the potential difference computed from the charges alone. Switch on the **swirl** to add a non-electrostatic component and the two paths now disagree: the closed loop ($A\to B$ on blue, back on orange) has circulation.`,
      scope: String.raw`Needs $\nabla\times\mathbf E=0$ throughout the region swept between the paths; a time-varying magnetic flux through that region spoils it.`,
      deps: ['em-2.1', 'pma-10.50', 'vcalc-5.5'],
      refs: ['Griffiths §2.3'],
      tags: ['line integral', 'work'],
      viz(v) {
        const s = v.stage({ x: [-6.5, 6.5], y: [-4.2, 4.2], equal: true, height: 350, axes: false, weight: 1.3, title: 'two paths from $A$ to $B$' });
        const sp = v.stage({ x: [0, 1], y: [-1, 1], height: 350, axes: 'box', gutter: true, weight: 1, xlabel: 'fraction of the path length', ylabel: 'work per unit charge (V)', title: 'running integral $\\int_A^{s}\\mathbf E\\cdot d\\mathbf l$' });
        const sw = v.toggle('add a non-electrostatic swirl', false);
        const src = [{ x: -1.6, y: 0.9, q: 4 }, { x: 2.5, y: -1.1, q: -3 }, { x: 0.4, y: 2.4, q: 2 }];
        const hs = src.map((c) => s.handle(c.x, c.y, { color: sgnCol(c.q), r: 9, label: nC(c.q), labelPos: 'ne' }));
        const A = s.handle(-5.6, -3.2, { color: 'ink', r: 7, label: '$A$', labelPos: 'sw' }), B = s.handle(5.4, 3.0, { color: 'ink', r: 7, label: '$B$', labelPos: 'ne' });
        const w = [s.handle(-4.2, 2.4, { color: 'accent', r: 6 }), s.handle(-0.2, -3.0, { color: 'accent', r: 6 }), s.handle(4.1, 0.2, { color: 'accent', r: 6 })];
        const E = (x, y) => { const a = fld(src, x, y), b = sw.value ? swirl(x, y, 40) : [0, 0]; return [a[0] + b[0], a[1] + b[1]]; };
        const cum = (pts, per) => {
          const S = [0], Wc = [0]; let L = 0, Wt = 0;
          for (let i = 0; i + 1 < pts.length; i++) {
            const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = nsub(src, x0, y0, x1, y1, per);
            let prev = E(x0, y0);
            for (let k = 1; k <= n; k++) {
              const t = k / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, f = E(x, y);
              Wt += (0.5 * ((prev[0] + f[0]) * (x1 - x0) + (prev[1] + f[1]) * (y1 - y0))) / n; prev = f;
              L += Math.hypot(x1 - x0, y1 - y0) / n; S.push(L); Wc.push(Wt);
            }
          }
          return { S: S.map((x) => x / L), W: Wc, total: Wt };
        };
        let r1, r2, dV;
        v.render(() => {
          src.forEach((c, i) => { c.x = hs[i].x; c.y = hs[i].y; });
          const P1 = spline([[A.x, A.y], ...w.map((h) => [h.x, h.y]), [B.x, B.y]], 18), P2 = [[A.x, A.y], [B.x, B.y]];
          r1 = cum(P1, 3); r2 = cum(P2, 300); dV = pot(src, A.x, A.y) - pot(src, B.x, B.y);
          quiver(s, E, { spacing: 40, alpha: 0.35 });
          s.path(P2, { color: 'orange', width: 2.5, dash: [7, 5] });
          s.path(P1, { color: 'accent', width: 3 });
          src.forEach((c) => drawCharge(s, c.x, c.y, c.q, 8));
          const lo = Math.min(0, dV, ...r1.W, ...r2.W), hi = Math.max(0, dV, ...r1.W, ...r2.W), pad = 0.12 * (hi - lo || 1);
          sp.setView([0, 1], [lo - pad, hi + pad]);
          sp.hline(0, { color: 'faint', width: 1 });
          sp.hline(dV, { color: 'green', width: 1.6, dash: [6, 4] });
          sp.path(r2.S.map((x, i) => [x, r2.W[i]]), { color: 'orange', width: 2.5 });
          sp.path(r1.S.map((x, i) => [x, r1.W[i]]), { color: 'accent', width: 2.5 });
          sp.dot(1, r1.total, { r: 5, color: 'accent' }); sp.dot(1, r2.total, { r: 5, hollow: true, color: 'orange' });
        });
        s.corner('', 'tl'); v.legend([['accent', 'wild path'], ['orange', 'straight line'], ['green', '$V(A)-V(B)$', { dash: true }]]);
        v.readout(() => `$\\int_A^B\\mathbf E\\cdot d\\mathbf l$: wild path $${v.fix(r1.total, 2)}$ V · straight line $${v.fix(r2.total, 2)}$ V · $V(A)-V(B)=${v.fix(dV, 2)}$ V.\nClosed loop (blue out, orange back): $\\oint\\mathbf E\\cdot d\\mathbf l=${v.fix(r1.total - r2.total, 3)}$ V ${sw.value ? '— no longer zero: the swirl has curl.' : '— zero, as it must be.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Electric potential',
      statement: String.raw`Fix a reference point $\mathcal O$ (infinity, for charges of finite extent). The **electric potential** at $\mathbf r$ is
$$V(\mathbf r) = -\int_{\mathcal O}^{\mathbf r}\mathbf E\cdot d\mathbf l ,$$
well defined by path independence (em-2.2). A charge $q$ at $\mathbf r$ has potential energy $qV(\mathbf r)$; changing the reference point adds a constant to $V$. The unit is the volt, 1 V = 1 J/C. For a point charge $Q$, $V = Q/4\pi\varepsilon_0 r$ with $V(\infty)=0$.`,
      idea: String.raw`Path independence says the integral of $\mathbf E$ from the reference point to $\mathbf r$ does not depend on the route, so it defines a function of position alone. The minus sign makes $V$ the work per unit charge that **we** must do against the field (pma-10.39 on line integrals of closed forms is the mathematical backbone): positive charges are potential hills, negative ones are wells, and a positive test charge released from rest rolls downhill. The work the field does on a charge moving from $a$ to $b$ is $q\,(V(a)-V(b))$.`,
      caption: String.raw`Drag the three charges in the plane (left) and watch the landscape on the right: $V$ is drawn as a height, squashed by $\tanh$ so that the infinite peaks stay on the page. Change each charge with the sliders. Drag the gold test charge: whenever you drop it, it is released and, heavily damped, it slides downhill along the field, and the readout compares the work done by the field, summed step by step along the actual path, with $q\,[V(\text{start})-V(\text{now})]$ — equal, whatever path it took.`,
      credit: 'Potential: Lagrange, 1773; Laplace; Green, 1828',
      deps: ['em-2.2', 'pma-10.39'],
      refs: ['Griffiths §2.3', 'Purcell ch. 2'],
      tags: ['potential', 'energy'],
      viz(v) {
        const s = v.stage({ x: [-6, 6], y: [-4.5, 4.5], equal: true, height: 360, axes: false, weight: 1.15, title: 'potential $V$: red hills, blue wells' });
        const s3 = v.stage3d({ range: 6, height: 360, yaw: -0.75, pitch: 0.6, axes: false, weight: 1, title: '$V$ as a height (drag to rotate)', zoom: 0.85 });
        const q = [v.slider('$q_1$', -5, 5, 4, { step: 0.1, fmt: (x) => nC(x) }), v.slider('$q_2$', -5, 5, -3, { step: 0.1, fmt: (x) => nC(x) }), v.slider('$q_3$', -5, 5, 2, { step: 0.1, fmt: (x) => nC(x) })];
        const src = [{ x: -3, y: 0.8, q: 4 }, { x: 2.8, y: -0.4, q: -3 }, { x: 0.4, y: 2.8, q: 2 }];
        const hs = src.map((c, i) => s.handle(c.x, c.y, { color: sgnCol(c.q), r: 9 }));
        const P = s.handle(-1, -2.8, { color: 'gold', r: 7, label: 'test +1 nC', labelPos: 'sw' });
        const VS = 1200, Hz = 3.0, QT = 1, MASS = 1;
        let trail = null, W = 0, start = null;
        const sim = v.sim(() => ({ x: P.x, y: P.y, W: 0, trail: [[P.x, P.y]], V0: pot(src, P.x, P.y), dead: false }), (S, dt) => {
          if (S.dead) return;
          // overdamped slide: velocity = mobility * E (the damped limit of a charge moving in a viscous medium)
          const f = fld(src, S.x, S.y), m = Math.hypot(f[0], f[1]), h = 0.04, f1 = fld(src, S.x + (0.5 * h * f[0]) / m, S.y + (0.5 * h * f[1]) / m), m1 = Math.hypot(f1[0], f1[1]);
          let nx = S.x + (h * f1[0]) / m1, ny = S.y + (h * f1[1]) / m1;
          if (src.some((c) => Math.hypot(nx - c.x, ny - c.y) < 0.25) || Math.abs(nx) > 6.5 || Math.abs(ny) > 5) { S.dead = true; return; }
          const fm = fld(src, 0.5 * (nx + S.x), 0.5 * (ny + S.y)); S.W += QT * (fm[0] * (nx - S.x) + fm[1] * (ny - S.y)); S.x = nx; S.y = ny; S.trail.push([nx, ny]);
        }, { dt: 1 / 90, maxSteps: 6000 });
        let key = '';
        v.animate((t) => {
          src.forEach((c, i) => { c.x = hs[i].x; c.y = hs[i].y; c.q = q[i].value; hs[i].color = sgnCol(c.q); });
          const k = src.map((c) => c.x.toFixed(2) + c.y.toFixed(2) + c.q.toFixed(1)).join() + P.x.toFixed(2) + P.y.toFixed(2);
          if (k !== key) { key = k; sim.reset(); }
          sim.advance(t); const S = sim.state; trail = S;
          heatPot(s, (x, y) => pot(src, x, y), VS, k.slice(0, -10), { res: 3 });
          s.contour((x, y) => pot(src, x, y), levels(250, 8).filter((x) => x), { color: 'ink', alpha: 0.28, width: 1, res: 110 });
          src.forEach((c) => drawCharge(s, c.x, c.y, c.q, 8));
          if (S.trail.length > 1) s.path(S.trail, { color: 'gold', width: 2.6 });
          s.dot(S.x, S.y, { r: 6, color: 'gold' });
          // landscape
          const Z = (x, y) => Hz * Math.tanh(pot(src, x, y) / VS);
          s3.surface((x, y) => [x, y, Z(x, y)], [-6, 6], [-4.5, 4.5], { nu: 40, nv: 30, shade: true, alpha: 0.92, colorFn: (x, y, p) => v.diverge(Math.tanh(pot(src, x, y) / VS) * 0.9) });
          src.forEach((c) => s3.line([c.x, c.y, Z(c.x, c.y)], [c.x, c.y, Z(c.x, c.y) + (c.q > 0 ? 0.5 : -0.5)], { color: sgnCol(c.q), width: 3 }));
          if (S.trail.length > 1) s3.path(S.trail.map(([x, y]) => [x, y, Z(x, y) + 0.06]), { color: 'gold', width: 3 });
          s3.dot([S.x, S.y, Z(S.x, S.y) + 0.06], { r: 6, color: 'gold' });
        }, { still: 2.5 });
        v.readout(() => {
          const S = trail, Vn = pot(src, S.x, S.y), dW = QT * (S.V0 - Vn);
          return `At the test charge: $V=${v.fix(Vn, 1)}$ V (start $${v.fix(S.V0, 1)}$ V). Work done by the field along the path so far, $\\sum \\mathbf F\\cdot d\\mathbf l = ${v.fix(S.W, 2)}$ nJ; $q\\,[V(\\text{start})-V(\\text{now})]=${v.fix(dW, 2)}$ nJ.${S.dead ? ' The charge has reached a source or left the picture.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'The field is minus the gradient of V',
      statement: String.raw`If $V(\mathbf r) = -\int_{\mathcal O}^{\mathbf r}\mathbf E\cdot d\mathbf l$ for an electrostatic field, then $V$ is differentiable (away from point charges) and
$$\mathbf E = -\nabla V .$$
So $\mathbf E$ points in the direction of steepest decrease of $V$, perpendicular to the level sets of $V$, and $|\mathbf E|$ is the rate of change of $V$ in that direction: where the equipotentials crowd together the field is strong.`,
      idea: String.raw`Move from $\mathbf r$ to $\mathbf r + d\mathbf r$: path independence lets us extend the integral by a short straight step, so $dV = -\mathbf E\cdot d\mathbf r$. Comparing with the chain rule $dV = \nabla V\cdot d\mathbf r$ for every direction $d\mathbf r$ (pma-9.17) gives $\mathbf E=-\nabla V$. The step is largest in the direction of $\mathbf E$ itself and zero along directions perpendicular to it, which is why contours of $V$ run perpendicular to $\mathbf E$.`,
      caption: String.raw`Drag the probe (gold) over a contour map of $V$ for three charges (drag them too). The left panel measures the gradient the honest way: the green bar spans the gap between the neighbouring contours that straddle the probe, so $\Delta V/\text{gap}\approx|\mathbf E|$. The right panel samples $V$ on a small circle around the probe: it is a cosine whose amplitude is $|\mathbf E|\rho$ and whose phase gives the direction. Shrink the circle and the two estimates meet the analytic field; make it large and the cosine picks up harmonics, which is the failure of the linear approximation.`,
      deps: ['em-2.3', 'pma-9.17'],
      refs: ['Griffiths §2.3'],
      tags: ['gradient', 'potential'],
      viz(v) {
        const s = v.stage({ x: [-6, 6], y: [-4.5, 4.5], equal: true, height: 360, axes: false, weight: 1.35, title: 'contours of $V$ every 100 V' });
        const sc = v.stage({ x: [-180, 180], y: [-1, 1], height: 360, axes: 'box', gutter: true, weight: 1, xlabel: 'direction $\\theta$ around the probe (degrees)', xticks: [-180, -90, 0, 90, 180], ylabel: '$V(\\theta)-V_{\\text{probe}}$ (V)', title: '$V$ on a small circle around the probe' });
        const rho = v.slider('circle radius $\\rho$', 0.02, 2, 0.5, { log: true, fmt: (x) => `${x.toPrecision(2)} cm` });
        const src = [{ x: -3, y: 0.8, q: 4 }, { x: 2.8, y: -0.4, q: -3 }, { x: 0.4, y: 2.8, q: 2 }];
        const hs = src.map((c) => s.handle(c.x, c.y, { color: sgnCol(c.q), r: 9, label: nC(c.q), labelPos: 'ne' }));
        const P = s.handle(-0.9, -1.1, { color: 'gold', r: 7, label: 'probe', labelPos: 'sw' });
        const V = (x, y) => pot(src, x, y), DV = 100;
        let info = {};
        v.render(() => {
          src.forEach((c, i) => { c.x = hs[i].x; c.y = hs[i].y; });
          const lv = levels(DV, 22).filter((x) => x);
          s.contour(V, lv.filter((x) => x > 0), { color: 'red', alpha: 0.55, width: 1, res: 150 });
          s.contour(V, lv.filter((x) => x < 0), { color: 'blue', alpha: 0.55, width: 1, res: 150 });
          s.contour(V, [0], { color: 'ink', alpha: 0.7, width: 1.6, res: 150 });
          src.forEach((c) => drawCharge(s, c.x, c.y, c.q, 8));
          const R = rho.value, E = fld(src, P.x, P.y), Em = Math.hypot(E[0], E[1]), V0 = V(P.x, P.y);
          // measured gap between the contours just above and below V0, along the downhill direction
          const ux = E[0] / Em, uy = E[1] / Em, Lo = Math.floor(V0 / DV) * DV, Hi = Lo + DV;
          const find = (target, dir) => { let a = 0, b = 6; const f = (t) => V(P.x + dir * ux * t, P.y + dir * uy * t) - target; if (f(0) * f(b) > 0) return null; for (let k = 0; k < 50; k++) { const m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; } return (a + b) / 2; };
          const tDown = find(Lo, 1), tUp = find(Hi, -1);
          let gap = null;
          if (tDown != null && tUp != null) { gap = tDown + tUp; s.measure(P.x - ux * tUp, P.y - uy * tUp, P.x + ux * tDown, P.y + uy * tDown, ''); s.line(P.x - ux * tUp, P.y - uy * tUp, P.x + ux * tDown, P.y + uy * tDown, { color: 'green', width: 4, alpha: 0.9 }); }
          arrowPx(s, P.x, P.y, E[0], E[1], 52, { color: 'gold', width: 3.2, head: 11 });
          s.circle(P.x, P.y, R, { color: 'gold', width: 1.4, dash: [4, 3] });
          // circle samples → first Fourier harmonic
          const N = 180, pts = []; let a1 = 0, b1 = 0;
          for (let k = 0; k < N; k++) { const t = ((k + 0.5) / N) * TAU, d = V(P.x + R * Math.cos(t), P.y + R * Math.sin(t)) - V0; a1 += (d * Math.cos(t) * 2) / N; b1 += (d * Math.sin(t) * 2) / N; }
          for (let k = 0; k <= 360; k++) { const t = ((k - 180) * Math.PI) / 180; pts.push([k - 180, V(P.x + R * Math.cos(t), P.y + R * Math.sin(t)) - V0]); }
          const amp = Math.hypot(a1, b1), lim = Math.max(1e-9, ...pts.map((p) => Math.abs(p[1])), Em * R);
          sc.setView([-180, 180], [-1.15 * lim, 1.15 * lim]);
          sc.hline(0, { color: 'faint', width: 1 });
          sc.fn((x) => -Em * R * Math.cos(((x - (Math.atan2(E[1], E[0]) * 180) / Math.PI) * Math.PI) / 180), { color: 'green', width: 2, dash: [6, 4], n: 361 });
          sc.path(pts, { color: 'accent', width: 2.8 });
          const dEg = (Math.atan2(E[1], E[0]) * 180) / Math.PI; sc.vline(dEg, { color: 'gold', width: 1.4, dash: [3, 3] });
          sc.text('E', dEg, 0.92 * lim, { color: 'gold', size: 12, align: 'center', weight: 700 });
          info = { Em, amp: amp / R, gap, dir: (Math.atan2(-b1, -a1) * 180) / Math.PI, dEg, V0 };
        });
        v.legend([['accent', '$V$ on the circle'], ['green', '$-|\\mathbf E|\\rho\\cos(\\theta-\\theta_E)$', { dash: true }], ['gold', 'field direction']]);
        v.readout(() => `At the probe $V=${v.fix(info.V0, 1)}$ V and the analytic $|\\mathbf E|=|\\nabla V|=${v.fix(info.Em, 2)}$ V/cm at ${v.fix(info.dEg, 1)}°.\nContour gap: ${info.gap != null ? `$\\Delta V/\\text{gap}=${v.fix(DV / info.gap, 1)}$ V/cm` : 'no contour pair nearby'} · circle first harmonic: $\\text{amplitude}/\\rho = ${v.fix(info.amp, 2)}$ V/cm at ${v.fix(info.dir, 1)}°.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Equipotential surfaces',
      statement: String.raw`An **equipotential surface** is a level set $\{\mathbf r: V(\mathbf r)=c\}$ of the potential. Because $\mathbf E=-\nabla V$, the field is perpendicular to the equipotential through every point where $\mathbf E\ne\mathbf 0$ and points toward lower $V$, and moving a charge $q$ along an equipotential costs no work: $W = q\,[V(a)-V(b)]=0$. Equipotentials of different values never touch except at points where $\mathbf E=\mathbf 0$.`,
      idea: String.raw`The gradient is orthogonal to the level sets of its function (em-2.4), so field lines and equipotentials form two families of curves that cross at right angles. Work along any path is $q\,\Delta V$ by path independence, and $\Delta V=0$ on a level set. A conductor in electrostatic equilibrium is a whole equipotential, which is why field lines leave its surface perpendicularly.`,
      caption: String.raw`Field lines (grey) and equipotentials (colour) of three charges you can drag; the gold contour is the one through the test charge. Choose how to carry the test charge a distance $\ell$ (slider): **along the equipotential** the work stays zero to numerical accuracy, **along a field line** it equals $q\,\Delta V$, and **straight to a goal** point gives the same as any other route with those endpoints. The green right-angle marks show $\mathbf E\perp$ contour at sample points.`,
      credit: 'Faraday’s lines of force, 1830s',
      deps: ['em-2.4'],
      refs: ['Griffiths §2.3', 'Purcell ch. 2'],
      tags: ['equipotential', 'field lines'],
      viz(v) {
        const s = v.stage({ x: [-7, 7], y: [-4.8, 4.8], equal: true, height: 380, axes: false, weight: 1 });
        const F = v.fields(s, { law: '3d', sources: [{ type: 'charge', x: -3.2, y: 0.4, q: 4 }, { type: 'charge', x: 3, y: -0.6, q: -4 }, { type: 'charge', x: 0.2, y: 3, q: 2 }], lines: true, lineDensity: 4.5, equipotentials: { n: 10 }, lineAlpha: 0.5 });
        const mode = v.select('carry the charge', [{ value: 'eq', label: 'along the equipotential' }, { value: 'fl', label: 'along the field line' }, { value: 'st', label: 'straight to the goal' }], 'eq');
        const len = v.slider('distance travelled $\\ell$', 0.1, 14, 7, { step: 0.1, fmt: (x) => `${x.toFixed(1)} cm` });
        const P = s.handle(-1.2, -2.0, { color: 'gold', r: 8, label: 'start', labelPos: 'sw' });
        const G = s.handle(3.8, 3.2, { color: 'green', r: 6, label: 'goal', labelPos: 'ne' });
        const unit = (src, x, y, kind) => { const f = fld(src, x, y), m = Math.hypot(f[0], f[1]); return kind === 'fl' ? [f[0] / m, f[1] / m] : [-f[1] / m, f[0] / m]; };
        // trace a curve of arc length L from (x0,y0): along the equipotential (Newton-corrected) or along E
        const trace = (src, x0, y0, L, kind, sign = 1) => {
          const pts = [[x0, y0]]; let x = x0, y = y0; const V0 = pot(src, x0, y0), h = 0.04; let used = 0;
          while (used < L) {
            const d = unit(src, x, y, kind); if (!isFinite(d[0])) break;
            const k1 = d, k2 = unit(src, x + 0.5 * h * sign * k1[0], y + 0.5 * h * sign * k1[1], kind), k3 = unit(src, x + 0.5 * h * sign * k2[0], y + 0.5 * h * sign * k2[1], kind), k4 = unit(src, x + h * sign * k3[0], y + h * sign * k3[1], kind);
            x += (h * sign * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])) / 6; y += (h * sign * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])) / 6;
            if (kind === 'eq') { const f = fld(src, x, y), m2 = f[0] * f[0] + f[1] * f[1]; const dv = pot(src, x, y) - V0; x += (dv * f[0]) / m2; y += (dv * f[1]) / m2; }
            if (src.some((c) => Math.hypot(x - c.x, y - c.y) < 0.2) || Math.abs(x) > 7.2 || Math.abs(y) > 5) break;
            pts.push([x, y]); used += h;
          }
          return pts;
        };
        let info = {};
        v.render(() => {
          const src = F.live();
          F.draw();
          s.contour((x, y) => pot(src, x, y), [pot(src, P.x, P.y)], { color: 'gold', width: 2.6, res: 160 });
          let pts;
          if (mode.value === 'st') pts = [[P.x, P.y], [G.x, G.y]];
          else pts = trace(src, P.x, P.y, len.value, mode.value);
          G.visible = mode.value === 'st';
          s.path(pts, { color: 'green', width: 3.2 });
          const end = pts[pts.length - 1];
          s.dot(end[0], end[1], { r: 5, color: 'green' });
          // right-angle marks along the traced curve and the equipotential through P
          const marks = [];
          for (let k = 0; k < 7; k++) marks.push(pts[Math.floor(((pts.length - 1) * k) / 6)]);
          for (const [x, y] of marks) {
            const f = fld(src, x, y), m = Math.hypot(f[0], f[1]); if (!(m > 0)) continue;
            const ex = f[0] / m, ey = f[1] / m, a = 0.22;
            s.path([[x + a * ex, y + a * ey], [x + a * (ex - ey), y + a * (ey + ex)], [x - a * ey, y + a * ex]], { color: 'purple', width: 1.3 });
          }
          const W = lineInt((x, y) => fld(src, x, y), pts, 4, src), dV = pot(src, P.x, P.y) - pot(src, end[0], end[1]);
          info = { W, dV, V0: pot(src, P.x, P.y), V1: pot(src, end[0], end[1]), L: pts.length * 0.04 };
        });
        F.legend([['gold', 'equipotential through the start'], ['green', 'path of the test charge'], ['purple', 'right-angle marks']]);
        v.readout(() => `Test charge $+1$ nC: $V(\\text{start})=${v.fix(info.V0, 1)}$ V, $V(\\text{end})=${v.fix(info.V1, 1)}$ V.\nWork done by the field, $\\int\\mathbf E\\cdot d\\mathbf l$ along the path: $ ${v.fix(info.W, 2)}$ nJ · $q[V(a)-V(b)]=${v.fix(info.dV, 2)}$ nJ.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Model',
      name: 'Potentials of charge distributions',
      statement: String.raw`For charges that stay in a bounded region, with $V(\infty)=0$, the potential at $\mathbf r$ is the scalar sum
$$V(\mathbf r)=\frac1{4\pi\varepsilon_0}\sum_i\frac{q_i}{|\mathbf r-\mathbf r_i|}\ \to\ \frac1{4\pi\varepsilon_0}\int\frac{\rho(\mathbf r')}{|\mathbf r-\mathbf r'|}\,d\tau' ,$$
with $\sigma\,da'$ or $\lambda\,dl'$ in place of $\rho\,d\tau'$ for surface and line charges. It is a plain number at each point: adding potentials needs no vector bookkeeping, and $\mathbf E=-\nabla V$ then gives the same field as the vector sum of Coulomb fields.`,
      idea: String.raw`The potential of one point charge is $q/4\pi\varepsilon_0 r$ (integrate the Coulomb field inward from infinity, em-2.3); a field built by superposition (em-1.4) has a potential built by superposition, because the line integral is linear in $\mathbf E$. Continuous distributions are limits of sums (em-1.7). The scalar form is far easier than the vector one — and then em-2.4 recovers $\mathbf E$ by differentiating.`,
      caption: String.raw`**Paint charge** on the canvas with the mouse (each stroke adds or removes $0.25$ nC per cell, up to $\pm 2$ nC); the heat map is $V$ computed as the scalar sum over all painted cells (red positive, blue negative). Drag the gold probe: the gold arrow is the direct vector sum of Coulomb fields, the green arrow is $-\nabla V$ from central differences of the scalar sum, and the right panel shows $V$ along a horizontal line through the probe with the tangent line of slope $-E_x$ taken from the vector sum.`,
      scope: String.raw`The cells here are point charges at their centres (a discretization of a smooth distribution); the sum is the exact potential of those points, and the probe stays away from the cell centres.`,
      deps: ['em-2.3', 'em-1.7'],
      refs: ['Griffiths §2.3'],
      tags: ['superposition', 'potential'],
      viz(v) {
        const A = 0.4, NX = 30, NY = 20, QU = 0.25, QM = 8;
        const s = v.stage({ x: [-6, 6], y: [-4, 4], equal: true, height: 360, axes: false, weight: 1.2, title: 'paint charge; colour is $V$' });
        const sp = v.stage({ x: [-6, 6], y: [-1, 1], height: 360, axes: 'box', gutter: true, weight: 1, xlabel: '$x$ (cm) along the probe’s row', ylabel: '$V$ (V)', title: '$V$ along a line, and the slope $-E_x$' });
        const brush = v.select('brush', [{ value: 1, label: '+ positive' }, { value: -1, label: '− negative' }, { value: 0, label: 'erase' }], 1);
        const cells = new Int8Array(NX * NY);
        const idx = (i, j) => j * NX + i, cx = (i) => -6 + (i + 0.5) * A, cy = (j) => -4 + (j + 0.5) * A;
        const fill = (f) => { for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) cells[idx(i, j)] = f(cx(i), cy(j)); };
        const preset = (name) => {
          if (name === 'plates') fill((x, y) => (Math.abs(y - 1.5) < 0.2 && Math.abs(x) < 3 ? 6 : Math.abs(y + 1.5) < 0.2 && Math.abs(x) < 3 ? -6 : 0));
          else if (name === 'ring') fill((x, y) => (Math.abs(Math.hypot(x, y) - 2.4) < 0.2 ? 4 : 0));
          else if (name === 'blob') fill((x, y) => Math.round(8 * Math.exp(-((x + 2) ** 2 + (y - 0.5) ** 2) / 1.2) - 6 * Math.exp(-((x - 2.2) ** 2 + (y + 0.5) ** 2) / 0.8)));
          else cells.fill(0);
        };
        preset('blob');
        v.button('two plates', () => preset('plates')); v.button('ring', () => preset('ring')); v.button('blob + hole', () => preset('blob')); v.button('clear', () => preset('clear'));
        let rev = 0, list = [];
        const rebuild = () => { list = []; for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (cells[idx(i, j)]) list.push([cx(i), cy(j), cells[idx(i, j)] * QU]); };
        const Vsum = (x, y) => { let p = 0; for (const [a, b, q] of list) { const r = Math.hypot(x - a, y - b); if (r > 1e-3) p += q / r; } return KV * p; };
        const Esum = (x, y) => { let u = 0, w = 0; for (const [a, b, q] of list) { const dx = x - a, dy = y - b, r2 = dx * dx + dy * dy; if (r2 > 1e-6) { const k = q / (r2 * Math.sqrt(r2)); u += k * dx; w += k * dy; } } return [KV * u, KV * w]; };
        s.onDrag((x, y) => {
          const i = Math.floor((x + 6) / A), j = Math.floor((y + 4) / A); let ch = false;
          for (let dj = -0; dj <= 0; dj++) if (i >= 0 && i < NX && j >= 0 && j < NY) {
            const k = idx(i, j), old = cells[k], b = +brush.value;
            cells[k] = b === 0 ? 0 : Math.max(-QM, Math.min(QM, old + b)); ch = ch || cells[k] !== old;
          }
          if (ch) rev++;
        });
        const P = s.handle(1.0, 2.9, { color: 'gold', r: 8, label: 'probe', labelPos: 'ne' });
        let info = {}, lastRev = -1;
        v.render(() => {
          rebuild();
          const key = list.map((c) => c[0] + ',' + c[1] + ',' + c[2]).join(';');
          const smp = []; for (let a = 0; a < 12; a++) for (let b = 0; b < 8; b++) smp.push(Math.abs(Vsum(-5.5 + a * 1.0 + 0.13, -3.5 + b + 0.21)));
          smp.sort((p, q) => p - q); const vs = Math.max(150, smp[Math.floor(smp.length * 0.8)]);
          heatPot(s, Vsum, vs, key, { res: 5 });
          s.contour(Vsum, [-1, -0.5, -0.2, 0.2, 0.5, 1].map((f) => f * vs), { color: 'ink', alpha: 0.3, width: 1, res: 90 });
          for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const n = cells[idx(i, j)]; if (n) s.rect(cx(i) - A / 2, cy(j) - A / 2, cx(i) + A / 2, cy(j) + A / 2, { fill: n > 0 ? 'red' : 'blue', fillAlpha: 0.1 + 0.4 * Math.abs(n) / QM, stroke: false }); }
          const E = Esum(P.x, P.y), h = 0.01, g = [-(Vsum(P.x + h, P.y) - Vsum(P.x - h, P.y)) / (2 * h), -(Vsum(P.x, P.y + h) - Vsum(P.x, P.y - h)) / (2 * h)];
          const em = Math.hypot(E[0], E[1]) || 1;
          arrowPx(s, P.x, P.y, E[0], E[1], 56, { color: 'gold', width: 4.5, head: 12 });
          arrowPx(s, P.x, P.y, g[0], g[1], 56, { color: 'green', width: 2, head: 9 });
          const N = 241, pts = []; let lo = Infinity, hi = -Infinity;
          for (let k = 0; k < N; k++) { const x = -6 + (12 * k) / (N - 1), val = Vsum(x, P.y); pts.push([x, val]); lo = Math.min(lo, val); hi = Math.max(hi, val); }
          const pad = 0.12 * (hi - lo || 1); sp.setView([-6, 6], [lo - pad, hi + pad]);
          sp.hline(0, { color: 'faint', width: 1 });
          sp.path(pts, { color: 'accent', width: 2.6 });
          const V0 = Vsum(P.x, P.y), dx = 1.3;
          sp.line(P.x - dx, V0 + E[0] * dx, P.x + dx, V0 - E[0] * dx, { color: 'gold', width: 2.4 });
          sp.dot(P.x, V0, { r: 5, color: 'gold' });
          info = { V0, E, g, d: Math.hypot(E[0] - g[0], E[1] - g[1]) / em, n: list.length, Q: list.reduce((a, c) => a + c[2], 0) };
        });
        v.legend([['gold', 'vector sum of Coulomb fields'], ['green', '$-\\nabla V$ from the scalar sum'], ['accent', '$V$ along the row']]);
        v.readout(() => `${info.n} painted cells, total charge ${nC(info.Q)}. At the probe $V=${v.fix(info.V0, 1)}$ V.\nVector sum $\\mathbf E=(${v.fix(info.E[0], 2)},\\,${v.fix(info.E[1], 2)})$ V/cm · $-\\nabla V=(${v.fix(info.g[0], 2)},\\,${v.fix(info.g[1], 2)})$ V/cm · relative difference $${v.sci(info.d, 2)}$.`);
      },
    },
  ],
};
