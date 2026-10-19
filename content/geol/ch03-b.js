import {subductionCatalogue,slabX} from './subduction-audit.shared.js';
import {HOTSPOT_SITES,HOTSPOT_ANCHOR,hotspotPosition,hotspotDiagnostics,improveHotspot,hotspotRadialCurve} from './hotspot-audit.shared.js';
// Geology & Geophysics — Chapter 3: Plate tectonics on a sphere (part b: 3.6–3.10)
//
// Sources checked / provenance (Oct 2026):
//   3.6  the transform-fault azimuths are SYNTHETIC: generated from a hidden Euler pole (60° N, 37° W, chosen near the
//        South America–Africa pole as remembered, not quoted from a model) plus 3° Gaussian noise, at schematic sites along
//        the South Atlantic ridge. Real azimuths come from bathymetry and fracture-zone maps; none are reproduced here.
//   3.7  generic plates A, B, C and sliders; no measured Euler vectors.
//   3.8  McKenzie & Morgan (1969) Nature 224: 125–133 (Crossref-checked). The velocity-space construction (ridge: perpendicular
//        bisector of the two plate velocities; transform: the line through them; trench: a line through the overriding plate's
//        point at any orientation) follows that paper and the standard textbook account; no numbers are taken from it.
//   3.9 Full Morgan1971 transcription/Tarduno2003 original read. Replaced remembered seamount centres
//        with three exact ODP197 drill coordinates and original49.15/55.59/75.82Ma ages. Chosen two-stage
//        bounded local search and anchor/drift remain explicit; no accepted bend age/unique global inversion claim.
//   3.10 Benioff1949 original pp1837,1844–46,1854–56 and figures4/9 read; USGS author depth explanation read.
//        Geometry, depth density, age/rate cutoff and horizontal scatter remain explicitly constructed, not empirical laws.

import {velocitySample,faultDiagnostics,fitFaultAxis} from './kinematics-audit.shared.js';

import { D, R_EARTH, V, LL, dot, cross, vadd, vsub, vscale, vnorm, angDist, bearing, dest, arc, rotMat, mmul, mapply, rotPts, rotApply, axisAngle, velAt, velVec, evec, evecToPole, mod360, wrap180, azDiff180, clamp, smallCirc, poleMisfit, fitPole } from './ch03.shared.js';

export default {
  collection: 'geol',
  chapter: 3,
  items: [
    // ───────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Proposition',
      name: 'Transform faults lie on small circles about the Euler pole',
      statement: String.raw`For nonzero instantaneous rigid relative rotation, a connected smooth pure-transform boundary away from the rotation axis is tangent to $\boldsymbol\omega\times\mathbf r$. Therefore its trace lies on a small circle about that axis: relative velocity has no component across it. At a site $\hat{\mathbf r}_i$ with unoriented unit fault tangent $\mathbf t_i$, a compatible unit axis $\mathbf e$ satisfies $\mathbf e\cdot\mathbf t_i=0$, provided $\mathbf e\times\hat{\mathbf r}_i\ne0$. Independent consistent fault directions can determine an axis, but unoriented traces cannot distinguish its two opposite poles or determine the rate. Degenerate directions need not give a unique axis.`,
      idea: String.raw`Along a fault tangent, the derivative of $\mathbf e\cdot\hat{\mathbf r}$ is zero, so angular distance to the axis is constant. Conversely, a nonstationary boundary departing from this tangent has opening or closing motion. Great circles perpendicular to exact fault tangents pass through both poles. For noisy observations, this page minimizes the mean squared plane residual $L(\mathbf e)=n^{-1}\sum_i(\mathbf e\cdot\mathbf t_i)^2$ subject to $|\mathbf e|=1$. Its Gram matrix $C=n^{-1}\sum_i\mathbf t_i\mathbf t_i^T$ is symmetric and positive semidefinite; diagonalizing it gives the global minimum as its smallest eigenvalue. A simple smallest eigenvalue selects an axis up to sign. This objective is distinct from angular-azimuth least squares.`,
      caption: String.raw`Gold ticks are nine synthetic unoriented fault azimuths at schematic sites, generated from the chosen hidden pole $(60^\circ\mathrm N,37^\circ\mathrm W)$ with independent $3^\circ$ Gaussian perturbations. Drag the purple pole; bars show signed angular residuals modulo $180^\circ$. “Fit axis” minimizes the stated plane residual, while the angular RMS is reported separately. “Opposite pole” demonstrates the same unoriented fit. “Pole at first fault” makes its velocity direction undefined; that residual is omitted, and a full angular RMS is then unavailable.`,
      deps: ['geol-3.5'],
      refs: ['Morgan (1968), JGR73:1959–1982, complete rigid-block/transform argument pp.1961–1964, Figs2–8: https://www.mantleplumes.org/WebDocuments/Morgan1968.pdf'],
      tags: ['transform', 'small-circle', 'fit'],
      credit: 'Spherical transform construction checked in Morgan (1968), pp.1961–1964. The synthetic plane fit is derived here; no separate historical priority claim.',
      scope: String.raw`Instantaneous rigid relative motion; finite fracture-zone history requires appropriate time-dependent motion. These are chosen synthetic directions, not bathymetric measurements or a reproduction of Morgan's table. The fit does not estimate rotation rate, slip sense, confidence limits or a global angular-RMS optimum. Eigenvalue gap and numerical eigen-residual describe this chosen plane fit; they are not statistical uncertainty estimates. Axis/site coincidences are not valid directional observations.`,
      verify: false,
      viz(v) {
        const ridge = [[-0.5, -54.5], [-13.5, -40], [-13, -30], [-13.5, -20], [-13.5, -10], [-14.5, -2], [-24, 0.5], [-30, 0.5], [-41, 10], [-45, 15]];
        const rp = []; for (let i = 0; i + 1 < ridge.length; i++) rp.push(...arc(ridge[i], ridge[i + 1], 10).slice(i ? 1 : 0));
        const hidden = [-37, 60], rng = v.rng(11);
        const idx = [8, 18, 28, 38, 48, 60, 70, 80, 90];
        const sites = idx.map((i) => rp[Math.min(i, rp.length - 1)]);
        const azs = sites.map((p) => velAt(p, hidden, 1).az + 3 * rng.normal());
        const best = fitFaultAxis(sites, azs);
        const s = v.stage({ height: 430, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-15, 10], graticule: 30 });
        const E = G.handle(30, 25, { label: 'E', color: 'purple' });
        v.button('Fit axis', () => E.set(best.pole[0], best.pole[1]));
        v.button('Opposite pole', () => {const p=LL(vscale(V([E.lon,E.lat]),-1));E.set(p[0],p[1]);});
        v.button('Pole at first fault', () => E.set(sites[0][0],sites[0][1]));
        v.button('Reset', () => E.set(30, 25));
        const bars = v.stage({ x: [0.3, 9.7], y: [-100, 100], axes: 'box', gutter: true, xlabel: 'fault number (south to north)', ylabel: 'misfit (°)', height: 200, full: true });
        let info = {};
        v.render(() => {
          const pole = [E.lon, E.lat];
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.1, alpha: 0.35, color: 'muted', fill: 'muted' });
          G.path(rp, { color: 'blue', width: 2.2, geodesic: false, alpha: 0.7 });
          const diagnostics=faultDiagnostics(pole,sites,azs);
          sites.forEach((p, i) => {
            const d = angDist(p, pole), velocity=velocitySample(p,pole,1),az=velocity.az;
            if(velocity.directionResolved)G.smallCircle(pole, d, { color: 'purple', width: 0.8, alpha: 0.3 });
            const a = dest(p, azs[i], 4), b = dest(p, azs[i] + 180, 4); G.path([a, b], { color: 'gold', width: 4 });
            if(velocity.directionResolved){const a2 = dest(p, az, 7), b2 = dest(p, az + 180, 7); G.path([a2, b2], { color: 'purple', width: 1.6 });}
            G.dot(p, { r: 3, color: 'ink' });
          });
          G.dot(pole, { r: 4, color: 'purple' });
          const extent=Math.max(5,...diagnostics.residuals.filter(x=>x!==null).map(x=>Math.abs(x)*1.15));
          bars.setView([.3,9.7],[-extent,extent]);
          diagnostics.residuals.forEach((x,i)=>{if(x!==null)bars.rect(i+.7,0,i+1.3,x,{fill:Math.abs(x)<4?'green':'red',fillAlpha:.6,stroke:false});});
          info={pole,sites,azs,best,...diagnostics};
          bars.hline(0, { color: 'grid' });
        });
        v.legend([['gold', 'synthetic unoriented fault direction'], ['purple', 'small circle about $E$'], ['blue', 'schematic ridge']]);
        v.readout(() => `Plane loss $L=${v.fix(info.loss,6)}$ (dimensionless). ${info.rms===null?`Full angular RMS unavailable: ${info.unresolved} axis/site direction unresolved.`:`Full angular RMS **${v.fix(info.rms,2)}°**.`} Fitted northern representative $(${v.fix(best.pole[1],2)}^\\circ\\mathrm N,${v.fix(best.pole[0],2)}^\\circ\\mathrm E)$ and its antipode have the same plane loss ${v.fix(best.loss,6)} and angular RMS ${v.fix(best.rms,2)}°. Smallest eigenvalue gap $${v.sci(best.gap,2)}$; eigen-equation residual $${v.sci(best.eigenResidual,2)}$. These are numerical fit diagnostics, not confidence bounds.`);
      },
    },
    // ───────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Method',
      name: 'Plate circuits: adding angular velocities',
      statement: String.raw`Instantaneous angular velocities of plates add as vectors: if $\boldsymbol\omega_{BA}$ is the rotation of plate B relative to plate A and $\boldsymbol\omega_{CB}$ that of C relative to B, then $\boldsymbol\omega_{CA}=\boldsymbol\omega_{CB}+\boldsymbol\omega_{BA}$, and for any closed loop of plates the sum of the angular velocities is zero. The relative motion of two plates that do not touch (or for which there is no direct data) can therefore be computed through any chain of neighbours; the **closure** of a circuit is a test of the rigid-plate model, and a non-zero residual signals deformation, an error in the data, or a plate that was left out.`,
      idea: String.raw`Velocity at a point is linear in the angular velocity ($\mathbf v=\boldsymbol\omega\times\mathbf r$, geol-3.5), and velocities relative to a moving body add: $\mathbf v_{CA}=\mathbf v_{CB}+\mathbf v_{BA}$ at the same point. Since $\boldsymbol\omega\mapsto\boldsymbol\omega\times\mathbf r$ is injective as $\mathbf r$ ranges over the sphere, the angular velocities themselves add. Finite rotations do not add (they do not commute), only instantaneous angular velocities; so the rule applies to present-day or stage-by-stage rates.`,
      caption: String.raw`Plates A, B, C. The purple and orange poles ($E_{BA}$, $E_{CB}$) and their rates define two Euler vectors; the 3-D panel adds them head to tail (green = the predicted $\boldsymbol\omega_{CA}$). The globe shows the three velocity arrows at the test point $Q$: they add as arrows too. Now switch on the hidden plate D: the *measured* C–A motion contains an extra vector you did not account for, and the closure residual (red) is exactly that vector.`,
      deps: ['geol-3.5'],
      refs: ['Stein–Wysession ch. 5'],
      tags: ['plate-circuit', 'vectors', 'closure'],
      credit: 'Le Pichon 1968; Morgan 1968',
      scope: String.raw`Instantaneous (small-angle) rotations of rigid plates; finite rotations compose as matrices, not as vector sums.`,
      viz(v) {
        const s = v.stage({ height: 380, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-20, 25], graticule: 30 });
        const E1 = G.handle(-40, 55, { label: '$E_{BA}$', color: 'purple' }), E2 = G.handle(110, 20, { label: '$E_{CB}$', color: 'orange' });
        const Q = G.handle(-70, 5, { label: 'Q', color: 'gold' });
        const ED = G.handle(-110, -30, { label: '$E_D$', color: 'red' });
        const r1 = v.slider('rate $\\omega_{BA}$ (°/Myr)', 0, 1, 0.6, { step: 0.01 }), r2 = v.slider('rate $\\omega_{CB}$ (°/Myr)', 0, 1, 0.45, { step: 0.01 });
        const hid = v.toggle('hidden plate D in the circuit', false);
        const rd = v.slider('its rate $\\omega_D$ (°/Myr)', 0, 0.6, 0.25, { step: 0.01 });
        const S3 = v.stage3d({ range: 1.0, height: 320, yaw: 0.9, pitch: 0.45, axes: false });
        let info = {};
        const sc = 0.8;
        v.render(() => {
          const w1 = evec([E1.lon, E1.lat], r1.value), w2 = evec([E2.lon, E2.lat], r2.value), wd = hid.value ? evec([ED.lon, ED.lat], rd.value) : [0, 0, 0];
          const pred = vadd(w1, w2), meas = vadd(pred, wd), res = vsub(meas, pred);
          const q = [Q.lon, Q.lat], v1 = velVec(q, w1), v2 = velVec(q, w2), vp = velVec(q, pred), vm = velVec(q, meas);
          const vsum = { east: v1.east + v2.east, north: v1.north + v2.north };
          const tip = (vel, k = 0.3) => { const sp = Math.hypot(vel.east, vel.north); return dest(q, mod360(Math.atan2(vel.east, vel.north) / D), Math.max(0.01, sp * k)); };
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.1, alpha: 0.35, color: 'muted', fill: 'muted' });
          for (const [p, c] of [[E1, 'purple'], [E2, 'orange']]) G.dot([p.lon, p.lat], { r: 5, color: c });
          G.arrow(q, tip(v1), { color: 'purple', width: 2.4 }); G.arrow(q, tip(v2), { color: 'orange', width: 2.4 });
          G.arrow(q, tip({ east: vsum.east, north: vsum.north }), { color: 'green', width: 3 });
          if (hid.value) { G.arrow(q, tip(vm), { color: 'red', width: 2, alpha: 0.9 }); G.dot([ED.lon, ED.lat], { r: 5, color: 'red' }); }
          ED.visible = hid.value;
          G.dot(q, { r: 4, color: 'gold' });
          // 3-D vectors
          for (const k of [0, 1, 2]) { const ax = [0, 0, 0]; ax[k] = 1.2; S3.arrow([0, 0, 0], ax, { color: 'faint' }); }
          const P = (w) => vscale(w, 1 / sc);
          S3.arrow([0, 0, 0], P(w1), { color: 'purple', width: 2.4 });
          S3.arrow(P(w1), P(pred), { color: 'orange', width: 2.4 });
          S3.arrow([0, 0, 0], P(pred), { color: 'green', width: 3 });
          if (hid.value) { S3.arrow(P(pred), P(meas), { color: 'red', width: 2.4 }); S3.arrow([0, 0, 0], P(meas), { color: 'ink', width: 1.5, dash: true }); }
          S3.tex('\\omega_{BA}', vscale(P(w1), 0.5)); S3.tex('\\omega_{CA}', vscale(P(pred), 0.55));
          info = { pred, meas, res, vp, vm, v1, v2, vsum, q };
        });
        v.legend([['purple', '$\\omega_{BA}$ / $v_{BA}$'], ['orange', '$\\omega_{CB}$ / $v_{CB}$'], ['green', 'sum: $\\omega_{CA}$ / $v_{CA}$'], ['red', 'unmodelled motion (plate D)']]);
        v.readout(() => {
          const P = evecToPole(info.pred), n = Math.hypot(info.vsum.east - info.vp.east, info.vsum.north - info.vp.north), rr = vnorm(info.res);
          return `predicted $\\omega_{CA}$: **${v.fix(P.rate, 3)}°/Myr** about $(${v.fix(P.pole[1], 1)}^\\circ\\mathrm{N},\\,${v.fix(P.pole[0], 1)}^\\circ\\mathrm{E})$ · at $Q$: $|\\mathbf v_{BA}+\\mathbf v_{CB}|-|\\mathbf v_{CA}|$ differ by ${v.fix(n, 6)} mm/yr (vectors add) · circuit closure residual **${v.fix(rr, 3)}°/Myr** = ${v.fix(vnorm(velVec(info.q, info.res)) ? info.vm.speed - info.vp.speed : 0, 1)} mm/yr extra speed at $Q$${rr > 0.02 ? ' — the loop does not close: a plate is missing.' : '.'}`;
        });
      },
    },
    // ───────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Triple-junction stability (McKenzie–Morgan)',
      statement: String.raw`Three plates A, B, C meet at a point, with boundary AB, BC, CA each a ridge (R), a trench (T) or a transform fault (F). Draw the plates' velocities $\mathbf v_A,\mathbf v_B,\mathbf v_C$ as points in a **velocity space**. A ridge between X and Y is represented by the perpendicular bisector of the segment XY; a transform by the line through X and Y; a trench by a line through the point of the overriding plate (with the orientation of the trench). The junction keeps its geometry as time passes — it is **stable** — exactly when the three lines meet in one point; that point is the velocity of the junction. Otherwise the three boundaries drift apart into a small triangle and the junction must change shape. RRR junctions are always stable, FFF junctions only in special cases.`,
      idea: String.raw`A boundary line stays put if the junction moves along it, so each boundary allows the junction any velocity on a particular line in velocity space: the locus of velocities that leave that boundary's position unchanged. A symmetrically spreading ridge moves with the mean of its plates' normal velocities (the bisector), a transform is parallel to the relative velocity (the line XY), and a trench moves with the overriding plate. Three lines in a plane generally do not share a point, in which case no single junction velocity keeps all three boundaries intersecting at one point: the triangle formed by their pairwise crossings grows linearly in time. RRR is special: the three perpendicular bisectors of a triangle's sides always meet at its circumcentre.`,
      caption: String.raw`Left: velocity space (cm/yr). Drag the plate velocities $A,B,C$; choose the type of each boundary (and, for trenches, the strike). The three loci are drawn; when they concur (green dot) the junction is stable. Right: the geometry in space with a time slider: boundaries move with their own normal velocities, so for an unstable junction the three lines open a growing triangle (red). Try RRR (always stable), FFF, and RRF.`,
      deps: ['geol-3.7'],
      refs: ['Turcotte–Schubert ch. 1'],
      tags: ['triple-junction', 'stability', 'velocity-space'],
      credit: 'D. P. McKenzie & W. J. Morgan, 1969',
      scope: String.raw`Rigid plates and plane geometry (a small region near the junction); trenches are assumed to be sharply defined with their orientation given.`,
      viz(v) {
        const types = (a, b) => [{ value: 'R', label: 'ridge' }, { value: 'F', label: 'transform' }, { value: 'Ta', label: `trench, ${a} over ${b}` }, { value: 'Tb', label: `trench, ${b} over ${a}` }];
        const A = null;
        const vs = v.stage({ x: [-7, 7], y: [-7, 7], equal: true, axes: true, height: 400, title: 'velocity space (cm/yr)' });
        const rs = v.stage({ x: [-7, 7], y: [-7, 7], equal: true, axes: false, height: 400, title: 'the junction in space' });
        const hA = vs.handle(-3.5, -2.5, { label: 'A', color: 'blue' }), hB = vs.handle(3.5, -2, { label: 'B', color: 'orange' }), hC = vs.handle(0.5, 3.5, { label: 'C', color: 'green' });
        const tAB = v.select('AB', types('A', 'B'), 'R'), tBC = v.select('BC', types('B', 'C'), 'R'), tCA = v.select('CA', types('C', 'A'), 'R');
        const sAB = v.slider('trench strike AB (°)', 0, 180, 30, { step: 1 }), sBC = v.slider('trench strike BC (°)', 0, 180, 90, { step: 1 }), sCA = v.slider('trench strike CA (°)', 0, 180, 150, { step: 1 });
        const tm = v.slider('time (Myr, after the junction)', 0, 2, 1, { step: 0.01 });
        const names = ['AB', 'BC', 'CA'];
        const colors = ['blue', 'orange', 'green'];
        let state = {};
        const line = (type, P, Q, th) => {
          if (type === 'R') { const m = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], dx = Q[0] - P[0], dy = Q[1] - P[1], n = Math.hypot(dx, dy) || 1; return { p: m, d: [-dy / n, dx / n] }; }
          if (type === 'F') { const dx = Q[0] - P[0], dy = Q[1] - P[1], n = Math.hypot(dx, dy) || 1; return { p: P, d: [dx / n, dy / n] }; }
          const over = type === 'Ta' ? P : Q; return { p: over, d: [Math.cos(th * D), Math.sin(th * D)] };
        };
        const meet = (l1, l2) => { const det = l1.d[0] * -l2.d[1] + l2.d[0] * l1.d[1]; if (Math.abs(det) < 1e-9) return null; const bx = l2.p[0] - l1.p[0], by = l2.p[1] - l1.p[1]; const a = (bx * -l2.d[1] + l2.d[0] * by) / det; return [l1.p[0] + a * l1.d[0], l1.p[1] + a * l1.d[1]]; };
        v.render(() => {
          const P = [[hA.x, hA.y], [hB.x, hB.y], [hC.x, hC.y]];
          const ty = [tAB.value, tBC.value, tCA.value], th = [sAB.value, sBC.value, sCA.value];
          const pairs = [[0, 1], [1, 2], [2, 0]];
          const L = pairs.map(([i, j], k) => line(ty[k], P[i], P[j], th[k]));
          sAB.el.hidden = !ty[0].startsWith('T'); sBC.el.hidden = !ty[1].startsWith('T'); sCA.el.hidden = !ty[2].startsWith('T');
          const X = [meet(L[0], L[1]), meet(L[1], L[2]), meet(L[2], L[0])];
          // stability: all three lines through one point
          let J = X[0], miss = Infinity;
          if (J) { miss = Math.max(...L.map((l) => Math.abs((J[0] - l.p[0]) * -l.d[1] + (J[1] - l.p[1]) * l.d[0]))); }
          const stable = !!J && miss < 0.04;
          vs.path([P[0], P[1], P[2], P[0]], { color: 'faint', width: 1, dash: true });
          L.forEach((l, k) => { vs.line(l.p[0] - 30 * l.d[0], l.p[1] - 30 * l.d[1], l.p[0] + 30 * l.d[0], l.p[1] + 30 * l.d[1], { color: colors[k], width: 2.2 }); vs.tex(`\\text{${names[k]}: ${ty[k][0] === 'T' ? 'T' : ty[k]}}`, ...[l.p[0], l.p[1]], { color: colors[k], size: 12, dx: 8, dy: -8 }); });
          if (stable) vs.dot(J[0], J[1], { r: 7, color: 'green' });
          else if (X.every(Boolean)) vs.poly(X, { fill: 'red', fillAlpha: 0.25, color: 'red', width: 1.5 });
          // real space: lines n·x = c t
          const t = tm.value;
          const Lr = L.map((l, k) => { const n = [-l.d[1], l.d[0]], c = l.p[0] * n[0] + l.p[1] * n[1]; return { d: l.d, n, c }; });
          const pts = [];
          Lr.forEach((l, k) => {
            const base = [l.n[0] * l.c * t, l.n[1] * l.c * t];
            rs.line(base[0] - 30 * l.d[0], base[1] - 30 * l.d[1], base[0] + 30 * l.d[0], base[1] + 30 * l.d[1], { color: colors[k], width: 2.6 });
            rs.text(`${names[k]}: ${ty[k][0] === 'T' ? 'trench' : ty[k] === 'R' ? 'ridge' : 'transform'}`, base[0] + l.d[0] * 5.2, base[1] + l.d[1] * 5.2, { color: colors[k], size: 12, align: 'center' });
          });
          const meetT = (a, b) => { const det = a.n[0] * b.n[1] - a.n[1] * b.n[0]; if (Math.abs(det) < 1e-9) return null; return [((a.c * t) * b.n[1] - (b.c * t) * a.n[1]) / det, (a.n[0] * (b.c * t) - b.n[0] * (a.c * t)) / det]; };
          const Y = [meetT(Lr[0], Lr[1]), meetT(Lr[1], Lr[2]), meetT(Lr[2], Lr[0])];
          if (Y.every(Boolean)) { if (stable) rs.dot(Y[0][0], Y[0][1], { r: 6, color: 'green' }); else rs.poly(Y, { fill: 'red', fillAlpha: 0.3, color: 'red', width: 1.6 }); }
          rs.dot(0, 0, { r: 3, color: 'muted', hollow: true });
          let area = null; if (Y.every(Boolean)) area = Math.abs((Y[1][0] - Y[0][0]) * (Y[2][1] - Y[0][1]) - (Y[2][0] - Y[0][0]) * (Y[1][1] - Y[0][1])) / 2;
          state = { stable, miss, area, ty, J };
        });
        v.readout(() => `${state.stable ? '**STABLE**: the three loci meet at $(' + v.fix(state.J[0], 2) + ', ' + v.fix(state.J[1], 2) + ')$ cm/yr, the junction velocity' : '**UNSTABLE**: the loci miss a common point' + (isFinite(state.miss) ? ' by ' + v.fix(state.miss, 2) + ' cm/yr' : ' (two are parallel)')} · type ${state.ty.map((x) => x[0]).join('')} · triangle area at $t$ = ${state.area == null ? '–' : v.fix(state.area, 2)} (cm/yr·Myr)² (zero for a stable junction; grows as $t^2$ otherwise).`);
        void A;
      },
    },
    // ───────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Phenomenon',
      name: 'Hotspot tracks and plate motion relative to a source',
      statement: String.raw`If a localized volcanic source stays fixed while a rigid plate moves over it, successively older volcanoes trace motion relative to that source. Treating this as motion relative to the deep mantle adds a fixed-source assumption. Morgan's 1971 letter proposed deep plumes and fixed-source plate tracks. Tarduno and colleagues' 2003 original study found an age-dependent Emperor paleolatitude history inconsistent with hotspot fixity; the bend alone therefore cannot uniquely determine a change in Pacific plate motion.`,
      idea: String.raw`A volcano formed at age $t$ at source $H(t)$ is now at $R(t)H(t)$, where successive plate stages compose in chronological order. For an old volcano, the older-stage rotation acts first and the younger stage afterward; rotations generally do not commute. Track geometry constrains plate motion relative to the source, while source drift and rotation histories can trade off. Even in a fixed-source circular track, great-circle distance from the anchor is not generally path length, so the age–radial-distance slope is not simply plate speed.`,
      caption: String.raw`Gold points are three **drill holes**, using official ODP coordinates and original Tarduno (2003) sample ages: Koko 1206A: 49.15 Ma, Nintoku 1205A: 55.59 Ma and Detroit 1203A: 75.82 Ma. They are not remembered volcano-centre positions or a complete chain. The two-stage curve is a chosen illustration referenced to a chosen present source at 155.3°W, 19.4°N. Controls specify initial directions/speeds at that reference point, a common axis distance, stage boundary age and past northward source offset (southward motion toward the present). “Improve fit” performs a bounded local search at the current boundary age/drift, with no global or unique reconstruction claim. The lower plot compares actual/model great-circle distances from the chosen anchor.`,
      deps: ['geol-3.5','geol-2.7'],
      refs: ['Morgan (1971), complete original letter transcription: https://www.mantleplumes.org/Morgan (1971).html', 'Tarduno et al. (2003), Science301:1064–1069, full original: https://ftp.soest.hawaii.edu/engels/Stanley/Textbook_update/Science_301/Tarduno-03.pdf', 'ODP197 original coring-summary TableT1 coordinates: https://www.iodp.tamu.edu/publications/197_IR/chap_03/c3_t1.htm ; https://www.iodp.tamu.edu/publications/197_IR/chap_05/c5_t1.htm ; https://www.iodp.tamu.edu/publications/197_IR/chap_06/c6_t1.htm'],
      tags: ['hotspot','plate-motion','hawaii'],
      credit: 'Morgan (1971) fixed-source hypothesis; Tarduno et al. (2003) source-motion evidence; ODP197 drill-hole coordinates',
      scope: String.raw`Chosen two-stage spherical rotations and prescribed source drift, not the original mantle-flow calculation or a complete plate inversion. The original three quoted ages have uncertainties 0.21, 0.25, 0.62 Ma respectively; here point estimates are used with equal spatial weight, not a likelihood or propagated-error fit. The original study's paleomagnetic interpretation includes secular-variation and secondary-magnetization limits. No current accepted bend age, universal speed range, historical Wilson priority or exact hotspot anchor is asserted. A lower geometric RMS for these three sparse samples cannot validate the assumed dynamics or source path. Slider rates are reference-point speeds; the changing source and other track positions can have different speeds.`,
      verify: false,
      viz(v) {
        const Gs=v.stage({height:410,full:true}),G=v.globe(Gs,{projection:'orthographic',center:[-175,38],graticule:15,zoom:1.7});
        const a1=v.slider('younger-stage direction at reference (°)',270,330,300,{step:.5}),w1=v.slider('reference speed (mm/yr)',30,140,80,{step:1});
        const a2=v.slider('older-stage direction at reference (°)',320,390,350,{step:.5}),w2=v.slider('reference speed (mm/yr)',30,140,70,{step:1}),d=v.slider('axis distance from reference (°)',20,160,65,{step:1});
        const tb=v.slider('chosen stage boundary age (Ma)',30,60,47,{step:.5}),dr=v.slider('source north of present at 85 Ma (°)',0,20,0,{step:.5});
        const age=v.stage({x:[-250,10000],y:[-4,90],axes:'box',gutter:true,xlabel:'great-circle distance from chosen anchor (km)',ylabel:'age (Ma)',height:260,full:true});
        const params=()=>({a1:a1.value,w1:w1.value,a2:a2.value,w2:w2.value,d:d.value,tb:tb.value,dr:dr.value});let fitResult=null,info={};
        v.button('Improve fit',()=>{const result=improveHotspot(params()),p=result.P;a1.set(p.a1);w1.set(p.w1);a2.set(p.a2);w2.set(p.w2);d.set(p.d);fitResult=result;});
        v.render(()=>{const P=params(),q=hotspotDiagnostics(P),curve=hotspotRadialCurve(P),obs=HOTSPOT_SITES.map(s=>[angDist(HOTSPOT_ANCHOR,s.point)*D*R_EARTH,s.age]);G.draw({land:false});G.land(null,{fillAlpha:.12,alpha:.35,color:'muted',fill:'muted'});
          G.path(Array.from({length:171},(_,i)=>hotspotPosition(P,i/2)),{color:'accent',width:2.6,geodesic:false});for(let t=0;t<=80;t+=10){const p=hotspotPosition(P,t);G.dot(p,{r:3,color:'accent'});G.text(`${t}`,dest(p,90,1.7),{size:10,color:'accent'});}
          G.dot(hotspotPosition(P,P.tb),{r:6,color:'red',hollow:true});G.dot(HOTSPOT_ANCHOR,{r:5,color:'orange'});
          HOTSPOT_SITES.forEach(s=>{G.dot(s.point,{r:5,color:'gold'});G.text(s.name,dest(s.point,90,3.2),{size:10,color:'ink'});G.path(arc(hotspotPosition(P,s.age),s.point),{color:'red',width:1.4});});
          const mx=Math.max(...curve.map(p=>p[0]),...obs.map(p=>p[0])),pad=Math.max(180,.05*mx);age.setView([-pad,mx+pad],[-4,90]);age.path(curve,{color:'accent',width:2.2});for(const p of obs)age.dot(...p,{r:5,color:'gold'});age.dot(0,0,{r:5,color:'orange'});info={...q,P,curve,obs,fitResult};
        });
        v.legend([['accent','chosen model radial distances/track'],['gold','original-age ODP drill holes'],['red','spatial residual; chosen stage boundary'],['orange','chosen present anchor']]);
        v.readout(()=>`Equal-weight spatial RMS **${v.fix(info.rms,1)}km**; drill-hole residuals ${info.residuals.map(x=>v.fix(x,1)).join(' · ')}km. Source ages ${HOTSPOT_SITES.map(s=>`${s.name}: ${s.age}±${s.ageError}Ma`).join('; ')}. Chosen stage boundary ${v.fix(info.P.tb,1)}Ma, source offset ${v.fix(info.P.dr,1)}° at 85 Ma. ${info.fitResult?'Last local search: '+info.fitResult.evaluations+' objective evaluations; its returned RMS '+v.fix(info.fitResult.rms,1)+'km (later slider edits can change the current result).':'No optimization has run.'} These sparse spatial residuals do not independently distinguish source drift and plate motion.`);
      },
    },
    // ───────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Subduction zones and Wadati–Benioff zones',
      statement: String.raw`Intermediate and deep earthquake hypocentres trace dipping regions within descending lithospheric slabs: **Wadati–Benioff zones**. Their geometry helps constrain a slab's position, bend and dip, subject to location uncertainty and incomplete sampling. Earthquakes reach roughly $700$ km depth; this approximate range is not an exact universal ceiling. Neither a single straight plane nor a universal depth histogram describes every subduction zone.`,
      idea: String.raw`Plotting hypocentres in cross-sections reveals the dipping seismic zone. Benioff's 1949 figures contrasted Tonga–Kermadec and South America, including bent geometry and differing depth populations. Modern depths are constrained by seismic travel times, including depth phases. A geometrical fit alone does not identify a failure mechanism, the entire slab boundary or a universal thermal law. The numerical experiment below isolates sampling and fitting in one chosen bent geometry; it does not explain deep earthquakes as ordinary shallow brittle failure.`,
      caption: String.raw`Grey points are synthetic hypocentres, with chosen horizontal Gaussian scatter of $6$ km standard deviation about an illustrative bent slab. The cross-section has equal distance scales. The solid orange part ends at a chosen model cutoff; dashed continuation extends to $800$ km as a geometrical construction. The lower histogram counts the same plotted depths in $20$ km bins and divides by the actual event count. The red line fits $x$ as a function of depth for events deeper than $100$ km; its dip need not equal the asymptotic slab-dip control.`,
      deps: ['geol-3.3'],
      refs: ['Benioff, Seismic evidence for the fault origin of oceanic deeps, GSA Bulletin 60 (1949), 1837–1856, figs.4/9', 'Spence, Sipkin & Choy, Determining the Depth of an Earthquake, USGS, Earthquakes and Volcanoes 21(1),1989'],
      tags: ['subduction', 'seismicity', 'slab'],
      credit: 'Hugo Benioff 1949; Spence, Sipkin & Choy 1989',
      scope: String.raw`No observed catalogue is reproduced. The displayed law $z_{\max}=\min(700,90+0.11\phi)$ km, with $\phi=\text{age}\times\text{rate}\times\sin\delta$, is a chosen demonstration law, not an empirical calibration or natural maximum. Here Myr × mm/yr gives km. The chosen depth density is sampled using a 1024-bin midpoint approximation to its CDF; its shallow decay and deep bump are illustrative. No original Wadati priority paper or modern deep-earthquake mechanism paper is claimed as reviewed.`,
      verify: false,
      viz(v) {
        const dip=v.slider('asymptotic slab dip (°)',15,80,45,{step:1});
        const age=v.slider('plate age at the trench (Myr)',5,150,120,{step:1});
        const rate=v.slider('convergence rate (mm/yr)',10,120,90,{step:1});
        const count=v.slider('number of events',300,3000,1200,{step:100,int:true});
        const s=v.stage({x:[-80,1200],y:[-830,60],equal:true,axes:'box',gutter:true,xlabel:'distance from the trench (km)',ylabel:'depth (km, down)',height:420,full:true,yticks:[[0,'0'],[-200,'200'],[-400,'400'],[-600,'600'],[-800,'800']]});
        const h=v.stage({x:[0,720],y:[0,1],axes:'box',gutter:true,xlabel:'depth (km)',ylabel:'fraction of all events / 20 km bin',height:220,full:true});
        let info={};
        v.render(()=>{
          const model=subductionCatalogue({dip:dip.value,age:age.value,rate:rate.value,count:count.value},v.rng(5));
          s.setView(model.xrange,[-830,60]);s.hline(0,{color:'faint'});
          const continuation=model.slab.filter(p=>p[1]<800).map(p=>[p[0],-p[1]]);continuation.push([slabX(model.slab,800),-800]);
          const active=model.slab.filter(p=>p[1]<model.zmax).map(p=>[p[0],-p[1]]);active.push([slabX(model.slab,model.zmax),-model.zmax]);
          s.path(continuation,{color:'orange',width:2,dash:[6,5],alpha:.7});s.path(active,{color:'orange',width:3});
          s.dots(model.events.map(e=>[e[0],-e[1]]),{r:1.8,color:'ink',alpha:.55});
          s.text('trench',0,35,{size:11,color:'muted',align:'center'});
          if(model.fit)s.path(model.fitPath,{color:'red',width:1.6});
          h.setView([0,720],[0,1.12*Math.max(...model.probabilities)]);h.bars(model.probabilities,{x0:10,dx:20,color:'accent'});h.vline(model.zmax,{color:'orange',dash:true});
          info={...model};
        });
        v.legend([['orange','chosen slab geometry/cutoff'],['ink','synthetic hypocentres'],['red','OLS line, depth >100 km']]);
        v.readout(()=>`Chosen $\\phi=${v.fix(info.phi,0)}$ km gives model cutoff ${v.fix(info.zmax,1)} km; deepest plotted event ${v.fix(info.deepest,1)} km. Exactly ${info.n} events; histogram total ${v.fix(info.probabilities.reduce((a,b)=>a+b,0),3)}. ${info.fit?`OLS line dip **${v.fix(info.fit.dip,1)}°**; asymptotic geometry ${dip.value}°; ${info.fit.n} events deeper than 100 km, $r^2=${v.fix(info.fit.r2,3)}$.`:'OLS line unavailable: fewer than six events deeper than 100 km.'} All ages, rates, density and scatter belong to the constructed model.`);
      },
    },
  ],
};
