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
//   3.9  Seamount positions and ages are rounded from memory (Kīlauea 0; Kauaʻi 5.1 Ma; Midway ≈ 27.7 Ma; Koko ≈ 50; Ōjin ≈ 55;
//        Suiko ≈ 61 (Sharp & Clague 2006 as quoted by the Honolulu Advertiser); Detroit 76–81 Ma depending on the dataset:
//        Duncan & Keller 2004 mean 75.8 Ma; positions of Suiko and Nintoku from DSDP Leg 55 sites 433/432 in the Sharp & Clague
//        data table). Treat as ±3 Myr and ±0.5° illustrations. Bend age 47 Ma is the widely quoted value; Sharp & Clague (2006)
//        put the initiation at about 50 Ma and Niu (2004) proposed 43 Ma. Tarduno et al. (2003) found that the hotspot itself moved
//        south during the Emperor leg, so the "fixed hotspot" assumption is a model, not a fact.
//   3.10 the seismicity model is SCHEMATIC (depth law 90 km + 0.11 φ, cap 700 km; sample distribution with a minimum near 300 km
//        and a peak near 600 km); the 410 and 660 km discontinuities are the standard round values.

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
      statement: String.raw`On a rigid-plate Earth, a transform fault is a boundary along which the plates slide past each other without opening or closing. Since the relative velocity at each point is tangent to the small circle about the Euler pole through that point (geol-3.5), a pure transform must **lie along that small circle**: its trace has azimuth perpendicular to the great circle joining it to the pole. Conversely, the azimuths of a set of transform faults on one ridge determine the pole: it is where the great circles drawn perpendicular to the faults meet, and the faults must all be consistent with a single pole.`,
      idea: String.raw`If a segment of a boundary were not tangent to the small circle, the relative velocity would have a component across it and the boundary would be opening or closing: it would not be a transform. So the traces of the transforms are streamlines of the velocity field $\boldsymbol\omega\times\mathbf r$, i.e. small circles about $\boldsymbol\omega$. This gives a pole *without* any velocity data and was the key step by which Wilson, Morgan and McKenzie & Parker showed that the Atlantic and Pacific fracture zones are consistent with rigid-plate rotation.`,
      caption: String.raw`Gold ticks are the observed azimuths of nine transform faults along the schematic ridge (synthetic: generated from a hidden pole with $3^\circ$ of noise). Drag your pole $E$: the thin purple arcs are the small circles about $E$ through each fault, and the bars show how far each fault departs from them. Press "Best fit" for the least-squares pole and compare its misfit with the data's own noise.`,
      deps: ['geol-3.5'],
      refs: ['Stein–Wysession ch. 5'],
      tags: ['transform', 'small-circle', 'fit'],
      credit: 'J. Tuzo Wilson 1965 (transform faults); Morgan 1968; McKenzie & Parker 1967',
      scope: String.raw`Rigid plates and steady relative motion over the time the fracture zone was formed. Real fits use bathymetry and satellite gravity and are done in a least-squares sense.`,
      verify: true,
      viz(v) {
        const ridge = [[-0.5, -54.5], [-13.5, -40], [-13, -30], [-13.5, -20], [-13.5, -10], [-14.5, -2], [-24, 0.5], [-30, 0.5], [-41, 10], [-45, 15]];
        const rp = []; for (let i = 0; i + 1 < ridge.length; i++) rp.push(...arc(ridge[i], ridge[i + 1], 10).slice(i ? 1 : 0));
        const hidden = [-37, 60], rng = v.rng(11);
        const idx = [8, 18, 28, 38, 48, 60, 70, 80, 90];
        const sites = idx.map((i) => rp[Math.min(i, rp.length - 1)]);
        const azs = sites.map((p) => velAt(p, hidden, 1).az + 3 * rng.normal());
        const best = fitPole(sites, azs, [0, 60]);
        const s = v.stage({ height: 430, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-15, 10], graticule: 30 });
        const E = G.handle(30, 25, { label: 'E', color: 'purple' });
        v.button('Best fit', () => E.set(best.pole[0], best.pole[1]));
        v.button('Reset', () => E.set(30, 25));
        const bars = v.stage({ x: [0.3, 9.7], y: [-90, 90], axes: 'box', gutter: true, xlabel: 'fault number (south to north)', ylabel: 'misfit (°)', height: 200, full: true });
        let rms = 0, res = [];
        v.render(() => {
          const pole = [E.lon, E.lat];
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.1, alpha: 0.35, color: 'muted', fill: 'muted' });
          G.path(rp, { color: 'blue', width: 2.2, geodesic: false, alpha: 0.7 });
          res = [];
          sites.forEach((p, i) => {
            const d = angDist(p, pole), az = velAt(p, pole, 1).az; // small-circle direction about E
            const e = azDiff180(az, azs[i]); res.push(e);
            G.smallCircle(pole, d, { color: 'purple', width: 0.8, alpha: 0.3 });
            const a = dest(p, azs[i], 4), b = dest(p, azs[i] + 180, 4); G.path([a, b], { color: 'gold', width: 4 });
            const a2 = dest(p, az, 7), b2 = dest(p, az + 180, 7); G.path([a2, b2], { color: 'purple', width: 1.6 });
            G.dot(p, { r: 3, color: 'ink' });
          });
          G.dot(pole, { r: 4, color: 'purple' });
          rms = Math.sqrt(res.reduce((a, x) => a + x * x, 0) / res.length);
          bars.bars(res.map((x) => x), { x0: 1, dx: 1, color: (val) => (Math.abs(val) < 4 ? 'green' : 'red'), });
          bars.hline(0, { color: 'grid' });
        });
        v.legend([['gold', 'observed fault azimuth'], ['purple', 'small circle about $E$'], ['blue', 'schematic ridge']]);
        v.readout(() => `rms azimuth misfit **${v.fix(rms, 1)}°** for $E=(${v.fix(E.lat, 1)}^\\circ\\mathrm{N},\\,${v.fix(Math.abs(E.lon), 1)}^\\circ\\mathrm{${E.lon < 0 ? 'W' : 'E'}})$ · least-squares pole $(${v.fix(best.pole[1], 1)}^\\circ\\mathrm{N},\\,${v.fix(Math.abs(best.pole[0]), 1)}^\\circ\\mathrm{${best.pole[0] < 0 ? 'W' : 'E'}})$ with rms ${v.fix(best.rms, 1)}° (the injected noise is 3°; the hidden pole is $(60^\\circ\\mathrm{N},\\,37^\\circ\\mathrm{W})$) · mean of the misfits ${v.fix(res.reduce((a, x) => a + x, 0) / res.length, 1)}°.`);
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
      name: 'Hotspot tracks and absolute plate motion',
      statement: String.raw`A mantle plume that stays (nearly) fixed beneath a moving plate builds a chain of volcanoes whose ages increase away from the active hotspot: each volcano is carried off by the plate and a new one forms above the plume. The chain is a record of the plate's motion relative to the deep mantle — an *absolute* motion, unlike the relative motions between plates. The Hawaiian–Emperor chain bends by about $60^\circ$ near $47$ Ma (some estimates $43$–$50$ Ma), recording a change in the motion of the Pacific plate; fitting two Euler poles to it gives the speed and direction before and after, near $70$–$90$ mm/yr for the Hawaiian leg.`,
      idea: String.raw`Each seamount of age $t$ was formed at the hotspot $H$ and has since been rotated with its plate: its present position is $R(t)H$, where $R(t)$ is the finite rotation (geol-3.4) accumulated by the plate over time $t$ — a product of one rotation per stage of constant motion. The age of each volcano dates the rotation (radiometric ages, geol-2.7), its distance from $H$ gives the angle, and the direction of the chain gives the pole. Assuming the hotspot is fixed is a hypothesis: palaeomagnetic and other evidence (Tarduno et al., 2003) suggests the Hawaiian hotspot itself moved south during the Emperor leg, which is one of the problems of the fixed-hotspot frame.`,
      caption: String.raw`Gold dots are seamounts (rounded, approximate ages and positions); the line is the track computed for two stages of motion of the Pacific plate over a fixed plume at Kīlauea. The sliders give the direction and speed of each stage; "Best fit" optimizes all five parameters at the current bend age. Move the bend age, then allow the hotspot to drift south during the Emperor leg and see how the fit changes. The lower graph plots age against distance along the chain: its slope is the speed.`,
      deps: ['geol-3.5', 'geol-2.7'],
      refs: ['Turcotte–Schubert ch. 1'],
      tags: ['hotspot', 'absolute-motion', 'hawaii'],
      credit: 'J. Tuzo Wilson 1963 (hotspot track); W. J. Morgan 1971 (mantle plumes and fixed hotspots)',
      scope: String.raw`Assumes a fixed (or at most slowly drifting) plume and a plate moving rigidly in two stages; real tracks show noise from lithospheric structure and plume dynamics, and the oldest Emperor seamounts are subducting.`,
      verify: true,
      viz(v) {
        const H0 = [-155.3, 19.4];
        const obs = [['Kauaʻi', [-159.5, 22.05], 5.1], ['Midway', [-177.4, 28.2], 27.7], ['Koko', [171.6, 35.3], 50], ['Ōjin', [170.6, 38.0], 55], ['Suiko', [170.0, 44.8], 61], ['Detroit', [167.6, 51.3], 76]];
        const s = v.stage({ height: 400, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-175, 38], graticule: 15, zoom: 1.7 });
        const az1 = v.slider('Hawaiian leg: direction (°)', 270, 330, 300, { step: 0.5 }), v1 = v.slider('speed (mm/yr)', 30, 140, 80, { step: 1 });
        const az2 = v.slider('Emperor leg: direction (°)', 320, 390, 350, { step: 0.5 }), v2 = v.slider('speed (mm/yr)', 30, 140, 70, { step: 1 });
        const dl = v.slider('pole distance $\\Delta$ from Hawaii (°)', 20, 160, 65, { step: 1 });
        const tb = v.slider('bend age (Ma)', 30, 60, 47, { step: 0.5 });
        const dr = v.slider('hotspot drifts south during the Emperor leg (°)', 0, 20, 0, { step: 0.5 });
        const age = v.stage({ x: [0, 6500], y: [0, 90], axes: 'box', gutter: true, xlabel: 'distance along the chain from Kīlauea (km)', ylabel: 'age (Ma)', height: 240, full: true });
        const params = () => ({ a1: az1.value, w1: v1.value, a2: az2.value, w2: v2.value, d: dl.value, tb: tb.value, dr: dr.value });
        const posAt = (P, t) => {
          const mk = (a, w) => { const pole = dest(H0, a - 90, P.d), om = (w / (R_EARTH * Math.sin(P.d * D))) / D; return { pole, om }; };
          const s1 = mk(P.a1, P.w1), s2 = mk(P.a2, P.w2);
          const R1 = (x) => rotMat(s1.pole, s1.om * x), R2 = (x) => rotMat(s2.pole, s2.om * x);
          const frac = clamp((t - P.tb) / (81 - P.tb), 0, 1.2), H = t > P.tb ? dest(H0, 0, P.dr * frac) : H0;
          return t <= P.tb ? rotApply(R1(t), H) : rotApply(R1(P.tb), rotApply(R2(t - P.tb), H));
        };
        const cost = (x, base) => { const P = { ...base, a1: x[0], w1: x[1], a2: x[2], w2: x[3], d: clamp(x[4], 20, 160) }; let q = 0; for (const [, p, t] of obs) { const d = angDist(posAt(P, t), p) * D * R_EARTH; q += d * d; } return Math.sqrt(q / obs.length); };
        const nm = (f, x0, step) => {
          const n = x0.length; let P = [x0, ...x0.map((_, i) => { const x = x0.slice(); x[i] += step[i]; return x; })], F = P.map(f);
          for (let it = 0; it < 900; it++) {
            const ord = F.map((_, i) => i).sort((a, b) => F[a] - F[b]); P = ord.map((i) => P[i]); F = ord.map((i) => F[i]);
            const c = P[0].map((_, j) => P.slice(0, n).reduce((a, x) => a + x[j], 0) / n), w = P[n];
            const xr = c.map((q, j) => q + (q - w[j])), fr = f(xr);
            if (fr < F[0]) { const xe = c.map((q, j) => q + 2 * (q - w[j])), fe = f(xe); if (fe < fr) { P[n] = xe; F[n] = fe; } else { P[n] = xr; F[n] = fr; } }
            else if (fr < F[n - 1]) { P[n] = xr; F[n] = fr; }
            else { const xc = c.map((q, j) => q + 0.5 * (w[j] - q)), fc = f(xc); if (fc < F[n]) { P[n] = xc; F[n] = fc; } else for (let i = 1; i <= n; i++) { P[i] = P[0].map((q, j) => q + 0.5 * (P[i][j] - q)); F[i] = f(P[i]); } }
          }
          return P[0];
        };
        const fit = () => { const base = params(); const x = nm((z) => cost(z, base), [az1.value, v1.value, az2.value, v2.value, dl.value], [8, 15, 8, 15, 12]); az1.set(clamp(x[0], 270, 330)); v1.set(clamp(x[1], 30, 140)); az2.set(clamp(x[2], 320, 390)); v2.set(clamp(x[3], 30, 140)); dl.set(clamp(x[4], 20, 160)); };
        let first = true;
        v.button('Best fit', fit);
        let info = {};
        v.render(() => {
          if (first) { first = false; fit(); }
          const P = params();
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.12, alpha: 0.35, color: 'muted', fill: 'muted' });
          const trk = [], dist = []; let cum = 0, prev = null;
          for (let t = 0; t <= 85; t += 0.5) { const p = posAt(P, t); trk.push(p); if (prev) cum += angDist(prev, p) * D * R_EARTH; dist.push([cum, t]); prev = p; }
          G.path(trk, { color: 'accent', width: 2.6, geodesic: false });
          for (let t = 0; t <= 80; t += 10) { const p = posAt(P, t); G.dot(p, { r: 3, color: 'accent' }); G.text(`${t}`, dest(p, 90, 1.7), { size: 10, color: 'accent' }); }
          const tbp = posAt(P, P.tb); G.dot(tbp, { r: 6, color: 'red', hollow: true });
          let sq = 0, ds = [];
          obs.forEach(([n, p, t]) => { const m = posAt(P, t), d = angDist(m, p) * D * R_EARTH; sq += d * d; ds.push(d); G.dot(p, { r: 5, color: 'gold' }); G.text(n, dest(p, 90, 3.2), { size: 10, color: 'ink' }); G.path([m, p], { color: 'red', width: 1.4 }); });
          G.dot(H0, { r: 5, color: 'orange' });
          age.setView([0, Math.max(...dist.map((d) => d[0])) * 1.02], [0, 90]);
          age.path(dist, { color: 'accent', width: 2.2 });
          age.vline(dist.find((d) => d[1] >= P.tb)?.[0] ?? 0, { color: 'red', dash: true, alpha: 0.7 });
          obs.forEach(([n, p, t]) => { let c = 0, pr = H0; const tr = []; for (let u = 0; u <= t + 1e-9; u += 0.5) { const q = posAt(P, u); c += angDist(pr, q) * D * R_EARTH; pr = q; } age.dot(c, t, { r: 5, color: 'gold' }); });
          age.dot(0, 0, { r: 5, color: 'orange' });
          info = { rms: Math.sqrt(sq / obs.length), ds, P };
        });
        v.legend([['accent', 'model track (ages in Ma)'], ['gold', 'seamounts (approximate)'], ['red', 'misfit; bend age marked ◯']]);
        v.readout(() => `rms misfit **${v.fix(info.rms, 0)} km** (largest ${v.fix(Math.max(...info.ds), 0)} km) · Hawaiian leg ${v.fix(info.P.w1, 0)} mm/yr toward ${v.fix(info.P.a1, 0)}°, Emperor leg ${v.fix(info.P.w2, 0)} mm/yr toward ${v.fix(mod360(info.P.a2), 0)}° · accepted: bend at about 47 Ma (50 Ma: Sharp & Clague 2006; 43 Ma: Niu 2004), so the plate's direction changed by ${v.fix(Math.abs(azDiff180(info.P.a1, info.P.a2)), 0)}° in this fit.`);
      },
    },
    // ───────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Subduction zones and Wadati–Benioff zones',
      statement: String.raw`At convergent margins the denser oceanic plate sinks into the mantle. Earthquakes occur along the descending slab down to about $700$ km — never deeper — in a thin dipping band, the **Wadati–Benioff zone**, whose hypocentres define the position and dip of the slab (typically $30^\circ$–$60^\circ$, steeper in places). The maximum depth of seismicity is greater for older, faster-subducting (colder) slabs, which stay brittle longer; the number of earthquakes with depth is not uniform, with a minimum near $300$ km and a peak near $600$ km.`,
      idea: String.raw`A slab is a cold sheet that heats by conduction (geol-4.3) as it sinks, over a thermal time that scales with its thickness squared; the faster it descends and the older (thicker, colder) it starts, the farther it penetrates before it warms to the mantle temperature. Brittle failure and the phase transformation of metastable olivine in the cold core account for the earthquakes; in a warm slab they stop earlier. The product of age and vertical descent rate, the *thermal parameter*, therefore ranks how deep a slab remains seismic. The 410 and 660 km discontinuities mark the olivine phase changes that govern the depth distribution.`,
      caption: String.raw`A cross-section perpendicular to the trench (equal axes): grey dots are earthquakes generated in a schematic slab of the chosen dip, plate age and convergence rate; the dashed line is the aseismic continuation of the slab; the lower graph is the depth histogram of the same events. Change the age or the speed and the seismicity stops at a different depth; the fitted plane through the intermediate and deep events returns the dip you set.`,
      deps: ['geol-3.3'],
      refs: ['Stein–Wysession ch. 5', 'Turcotte–Schubert ch. 1'],
      tags: ['subduction', 'seismicity', 'slab'],
      credit: 'Kiyoo Wadati 1935; Hugo Benioff 1949',
      scope: String.raw`Schematic: the earthquake population is simulated from a simple depth law, not real catalogue data. Real slabs bend, kink, flatten and even stagnate at 660 km.`,
      verify: true,
      viz(v) {
        const dip = v.slider('mean slab dip (°)', 15, 80, 45, { step: 1 });
        const age = v.slider('plate age at the trench (Myr)', 5, 150, 120, { step: 1 });
        const rate = v.slider('convergence rate (mm/yr)', 10, 120, 90, { step: 1 });
        const count = v.slider('number of events', 300, 3000, 1200, { step: 100, int: true });
        const s = v.stage({ x: [-80, 1200], y: [-760, 60], equal: true, axes: 'box', gutter: true, xlabel: 'distance from the trench (km)', ylabel: 'depth (km, down)', height: 420, full: true, yticks: [[0, '0'], [-200, '200'], [-400, '400'], [-600, '600']] });
        const h = v.stage({ x: [0, 720], y: [0, 1], axes: 'box', gutter: true, xlabel: 'depth (km)', ylabel: 'relative number of events', height: 220, full: true });
        const slab = (th) => { // slab surface: dip rises from 10° at the trench to th over ~120 km of arc length
          const pts = []; let x = 0, z = 0; for (let sg = 0; sg <= 2400; sg += 5) { const d = (10 + (th - 10) * (1 - Math.exp(-sg / 120))) * D; pts.push([x, -z, sg]); x += 5 * Math.cos(d); z += 5 * Math.sin(d); } return pts;
        };
        let info = {};
        v.render(() => {
          const th = dip.value, pts = slab(th), phi = age.value * rate.value * Math.sin(th * D), zmax = Math.min(700, 90 + 0.11 * phi);
          const rng = v.rng(5);
          const evs = [];
          const pd = (z) => { // schematic depth density: shallow exponential + deep bump, tapering to zero at zmax
            const base = 1.0 * Math.exp(-z / 70) + 0.07 + 0.55 * Math.exp(-0.5 * ((z - 590) / 55) ** 2) * clamp((zmax - 430) / 200, 0, 1);
            return base * (z <= zmax ? 1 : 0);
          };
          let guard = 0; while (evs.length < count.value && guard++ < 60000) {
            const z = rng() * zmax; if (rng() * 1.3 > pd(z)) continue;
            let k = 0; while (k < pts.length - 1 && -pts[k][1] < z) k++;
            const a = pts[Math.max(k - 1, 0)], b = pts[Math.min(k + 1, pts.length - 1)], tx = b[0] - a[0], ty = b[1] - a[1], tn = Math.hypot(tx, ty) || 1;
            const off = 6 * rng.normal(); // scatter normal to the slab
            evs.push([pts[k][0] - (ty / tn) * off, pts[k][1] + (tx / tn) * off, z]);
          }
          s.hline(0, { color: 'faint' });
          for (const zz of [410, 660]) { s.hline(-zz, { color: 'muted', dash: true, alpha: 0.6 }); s.text(`${zz} km`, 1170, -zz + 12, { size: 11, color: 'muted', align: 'right' }); }
          const sl = pts.filter((p) => -p[1] <= 740);
          s.path(sl.map((p) => [p[0], p[1]]), { color: 'orange', width: 2, dash: [6, 5], alpha: 0.7 });
          s.path(pts.filter((p) => -p[1] <= zmax).map((p) => [p[0], p[1]]), { color: 'orange', width: 3 });
          s.dots(evs.map((e) => [e[0], e[1]]), { r: 1.8, color: 'ink', alpha: 0.55 });
          s.text('trench', 0, 40, { size: 11, color: 'muted', align: 'center' });
          // regression plane through events deeper than 100 km (x as function of depth)
          const deep = evs.filter((e) => e[2] > 100); let fitDip = NaN, r2 = 0;
          if (deep.length > 5) {
            const n = deep.length, mx = deep.reduce((a, e) => a + e[0], 0) / n, mz = deep.reduce((a, e) => a + e[2], 0) / n;
            const sxz = deep.reduce((a, e) => a + (e[0] - mx) * (e[2] - mz), 0), szz = deep.reduce((a, e) => a + (e[2] - mz) ** 2, 0), sxx = deep.reduce((a, e) => a + (e[0] - mx) ** 2, 0);
            const slope = sxz / szz; // dx per dz
            fitDip = Math.atan2(1, slope) / D; r2 = (sxz * sxz) / (sxx * szz);
            s.path([[mx - slope * (mz - 100), -100], [mx + slope * (zmax - mz), -zmax]], { color: 'red', width: 1.6 });
          }
          // histogram
          const nb = 36, bins = new Array(nb).fill(0); evs.forEach((e) => { bins[Math.min(nb - 1, Math.floor((e[2] / 720) * nb))]++; });
          h.setView([0, 720], [0, Math.max(...bins) * 1.1 / Math.max(...bins) || 1]);
          h.bars(bins.map((b) => b / Math.max(...bins)), { x0: 10, dx: 20, color: 'accent' });
          h.vline(zmax, { color: 'orange', dash: true });
          info = { phi, zmax, fitDip, r2, n: evs.length, deepest: Math.max(...evs.map((e) => e[2])) };
        });
        v.legend([['orange', 'slab (seismic part solid)'], ['ink', 'earthquakes'], ['red', 'fitted plane (events below 100 km)']]);
        v.readout(() => `thermal parameter $\\phi=\\text{age}\\times\\text{rate}\\times\\sin\\delta=${v.fix(info.phi, 0)}$ km → seismicity cut-off ${v.fix(info.zmax, 0)} km (deepest event ${v.fix(info.deepest, 0)} km, never beyond 700) · least-squares plane dips **${v.fix(info.fitDip, 1)}°** (set: ${dip.value}°; the slab bends, so the plane averages $10$–${dip.value}$^\\circ$ over the depth range, $r^2$ = ${v.fix(info.r2, 2)}).`);
      },
    },
  ],
};
