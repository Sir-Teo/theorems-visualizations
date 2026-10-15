// Numerical tests for the world kits (globe, timeline, agents, curves, tree). DOM-free: the kit modules import cleanly in Node.
//   node tests/kits-world.test.mjs
import * as G from '../assets/js/viz/kits/globe.js';
import * as TL from '../assets/js/viz/kits/timeline.js';
import * as A from '../assets/js/viz/kits/agents.js';
import * as C from '../assets/js/viz/kits/curves.js';
import * as T from '../assets/js/viz/kits/tree.js';

let passed = 0, failed = 0; const fails = [];
function test(name, fn) { try { fn(); passed++; } catch (e) { failed++; fails.push(name); console.log(`✗ ${name}\n    ${String(e.message || e).split('\n').join('\n    ')}`); } }
function ok(cond, msg = 'assertion failed') { if (!cond) throw new Error(msg); }
function close(a, b, tol = 1e-12, msg = '') { const err = Math.abs(a - b), sc = Math.max(1, Math.abs(b)); if (!(err <= tol * sc)) throw new Error(`${msg} expected ${b}, got ${a} (err ${err.toExponential(2)}, tol ${tol})`); }
const eq = (a, b, msg = '') => { const x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) throw new Error(`${msg} expected ${y}, got ${x}`); };
const D = Math.PI / 180;

// ------------------------------------------------------------ globe: projections
test('every projection round-trips forward/invert (oblique centres too)', () => {
  for (const name of Object.keys(G.PROJECTIONS)) for (const center of [[0, 0], [37, 21], [-120, -50]]) {
    const P = G.projection(name, { center: name === 'mercator' || name === 'transverseMercator' ? [center[0], 0] : center }); let n = 0;
    for (let lat = -80; lat <= 80; lat += 10) for (let lon = -175; lon <= 175; lon += 15) {
      const q = P.forward(lon, lat); if (!q) continue; const r = P.invert(...q); ok(r, `${name} invert null at ${lon},${lat}`);
      ok(G.centralAngle([lon, lat], r) < 1e-8, `${name} @${center}: (${lon},${lat}) → ${r}`); n++;
    }
    ok(n > 20, `${name}: only ${n} visible points`);
  }
});
test('raw projection formulas at known points', () => {
  const M = G.projection('mercator'); close(M.forward(0, 45)[1], Math.log(Math.tan(Math.PI / 4 + 45 * D / 2)), 1e-12, 'Mercator y(45°)');
  const S = G.projection('stereographic'); close(S.forward(90, 0)[0], 2, 1e-12, 'stereographic: 90° → radius 2');
  const L = G.projection('lambert'); close(L.forward(0, 90)[1], Math.SQRT2, 1e-12, 'LAEA: 90° from centre → √2');
  const E = G.projection('azimuthalEquidistant'); close(Math.hypot(...E.forward(30, 40)), G.centralAngle([0, 0], [30, 40]) * D, 1e-12, 'AE radius = arc length');
  const Mo = G.projection('mollweide'); close(Mo.forward(180, 0)[0], 2 * Math.SQRT2, 1e-12, 'Mollweide half-width'); close(Mo.forward(0, 90)[1], Math.SQRT2, 1e-9, 'Mollweide pole');
  const R = G.projection('robinson'); close(R.forward(0, 45)[1], 1.3523 * 0.5571, 1e-12, 'Robinson table node'); close(R.forward(180, 0)[0], 0.8487 * Math.PI, 1e-12);
  ok(G.projection('gnomonic').forward(0, 70) === null, 'gnomonic clips at 60° by default');
  ok(G.projection('orthographic', { center: [0, 0] }).forward(120, 0) === null, 'orthographic hides the far side');
});
test('gnomonic maps great circles to straight lines', () => {
  const P = G.projection('gnomonic', { center: [10, 40] }), pts = G.interpolate([-10, 30], [35, 55], 40).map((p) => P.forward(p)), [a, b] = [pts[0], pts[40]];
  for (const p of pts) close((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]), 0, 1e-10, 'collinear');
});
test('Tissot: Mercator scale factor is sec φ (conformal), area sec²φ', () => {
  const P = G.projection('mercator', { center: [20, 0] });
  for (const lat of [0, 15, 30, 45, 60, 75, 80]) { const t = P.tissot(33, lat), s = 1 / Math.cos(lat * D); close(t.a, s, 1e-7, `a @${lat}`); close(t.b, s, 1e-7, `b @${lat}`); close(t.area, s * s, 1e-6, `area @${lat}`); ok(t.omega < 1e-4, 'ω = 0'); close(t.theta, 90, 1e-5, 'meridians ⟂ parallels'); }
});
test('Tissot: equal-area projections have unit area factor; conformal ones ω = 0', () => {
  for (const name of ['lambert', 'mollweide']) for (const c of [[0, 0], [40, 30]]) { const P = G.projection(name, { center: c }); for (const p of [[10, 10], [60, -40], [-30, 55], [100, 20]]) { const t = P.tissot(p); if (t) close(t.area, 1, 1e-6, `${name} ${p}`); } }
  for (const name of ['mercator', 'stereographic', 'transverseMercator']) { const P = G.projection(name, { center: [5, 0] }); for (const p of [[10, 10], [-50, 40], [30, -60]]) { const t = P.tissot(p); ok(t && t.omega < 1e-3 && Math.abs(t.a - t.b) < 1e-6 * t.a, `${name} ${p}: ω = ${t && t.omega}`); } }
});
test('Tissot vs analytic: equirectangular h = 1, k = sec φ; stereographic k = 2/(1 + cos c); LAEA', () => {
  const E = G.projection('equirectangular'); const t = E.tissot(10, 50); close(t.h, 1, 1e-7); close(t.k, 1 / Math.cos(50 * D), 1e-7);
  const S = G.projection('stereographic'), ts = S.tissot(40, 25), c = G.centralAngle([0, 0], [40, 25]) * D; close(ts.k, 2 / (1 + Math.cos(c)), 1e-7);
  const L = G.projection('lambert'), tl = L.tissot(70, 10), cl = G.centralAngle([0, 0], [70, 10]) * D, kr = 1 / Math.cos(cl / 2); close(tl.a, kr, 1e-6, 'LAEA tangential scale sec(c/2)'); close(tl.b, 1 / kr, 1e-6, 'LAEA radial scale cos(c/2)');
});
test('haversine distances: known city pairs, symmetry, quarter meridian', () => {
  close(G.haversine([0, 0], [0, 90], 1), Math.PI / 2, 1e-14, 'quarter meridian');
  close(G.haversine([-0.1278, 51.5074], [2.3522, 48.8566]), 343.5, 0.003, 'London–Paris ≈ 343.5 km');
  close(G.haversine([-74.006, 40.7128], [139.6917, 35.6895]), 10848.8, 0.0005, 'New York–Tokyo ≈ 10 849 km');
  close(G.haversine([10, 20], [-30, 40]), G.haversine([-30, 40], [10, 20]), 1e-12, 'symmetric');
  close(G.haversine([10, 20], [130, -50], 1), G.centralAngle([10, 20], [130, -50]) * D, 1e-12, 'haversine = atan2 central angle');
});
test('great circle: drawn arc length matches haversine; rhumb line is never shorter', () => {
  const a = [-74, 40.7], b = [37.6, 55.8], pts = G.interpolate(a, b, 4000); let s = 0;
  for (let i = 1; i < pts.length; i++) s += G.centralAngle(pts[i - 1], pts[i]) * D * G.EARTH_KM;
  close(s, G.haversine(a, b), 1e-9, 'sum of pieces');
  for (const [p, q] of [[a, b], [[0, 0], [90, 0]], [[-10, -40], [150, 60]], [[0, 10], [0, 70]]]) ok(G.rhumb(p, q).length >= G.haversine(p, q) - 1e-6, `${p}→${q}`);
  close(G.rhumb([0, 0], [90, 0]).length, G.haversine([0, 0], [90, 0]), 1e-9, 'equator: rhumb = great circle');
  close(G.rhumb([0, 10], [0, 70]).length, G.haversine([0, 10], [0, 70]), 1e-9, 'meridian: rhumb = great circle');
  close(G.rhumb([0, 0], [10, 10]).bearing, Math.atan2(10 * D, Math.log(Math.tan(Math.PI / 4 + 5 * D))) / D, 1e-9, 'rhumb bearing');
});
test('destination ∘ bearing round-trip; small circles are at constant distance', () => {
  const p = [20, -35], q = G.destination(p, 63, 41); close(G.centralAngle(p, q), 41, 1e-9); close(G.bearing(p, q), 63, 1e-9);
  for (const r of G.smallCircle([-30, 60], 12, 50)) close(G.centralAngle([-30, 60], r), 12, 1e-9);
});
test('Euler pole rotation: moves along small circles; speed = ωR sin Δ', () => {
  const pole = [-30.6, 44], p = [-40, -10], q = G.rotate(p, pole, 25);
  close(G.centralAngle(pole, q), G.centralAngle(pole, p), 1e-9, 'distance to the pole is invariant');
  close(G.centralAngle(pole, G.rotate(pole, pole, 40)), 0, 1e-9, 'the pole is fixed');
  const v = G.velocity(p, pole, 1), d = G.centralAngle(pole, p) * D; close(v.speed, (D / 1e6) * G.EARTH_KM * 1e6 * Math.sin(d), 1e-9, 'ω R sin Δ (mm/yr)');
  const a = G.rotate([0, 0], [0, 90], 30); close(a[0], 30, 1e-9, 'positive = counter-clockwise seen from above the pole');
});
test('land data decodes; clipping returns rings in every projection; sphere areas', () => {
  const L = G.land(); ok(L.length > 50 && L.length < 80, `${L.length} polygons`); const nv = L.reduce((s, p) => s + p.rings.reduce((t, r) => t + r.length, 0), 0); ok(nv > 1000 && nv < 3000, `${nv} vertices`);
  for (const n of ['Africa', 'South America', 'Eurasia', 'Australia', 'Antarctica', 'Greenland']) ok(G.landmass(n)[0].length > 10, n);
  for (const name of Object.keys(G.PROJECTIONS)) { const P = G.projection(name, { center: [15, 10] }); let rings = 0; for (const p of L) rings += P.clipPolygon(p.rings).length; ok(rings > 5, `${name}: ${rings} rings`); }
  close(G.sphericalArea(G.smallCircle([0, 0], 90, 720)), 2 * Math.PI, 1e-3, 'hemisphere'); ok(G.land().every((p) => G.sphericalArea(p.rings[0]) > 0), 'outer rings are counter-clockwise');
  close(G.sphericalArea(G.landmass('Africa')[0]) * G.EARTH_KM ** 2 / 1e6, 30.2, 0.06, 'Africa ≈ 30 million km² (±6%)');
});

// ------------------------------------------------------------ timeline
test('timeline: parsing and formatting years', () => {
  eq([TL.parseTime('10,000 BCE'), TL.parseTime('1450 CE'), TL.parseTime('1450'), TL.parseTime('500 BC')], [-10000, 1450, 1450, -500]);
  close(TL.parseTime('66 Ma', 2025), 2025 - 66e6); close(TL.parseTime('3.5 Ga', 0), -3.5e9); close(TL.parseTime({ ago: 100 }, 2000), 1900); close(TL.parseTime('now', 2025), 2025);
  eq([TL.fmtYear(TL.parseTime('3.5 Ga')), TL.fmtYear(TL.parseTime('66 Ma')), TL.fmtYear(-10000), TL.fmtYear(1450), TL.fmtYear(TL.parseTime('300 ka'))], ['3.5 Ga', '66 Ma', '10,000 BCE', '1450 CE', '300 ka']);
  eq(TL.fmtAgo(13.8e9), '13.8 Ga'); eq(TL.fmtAgo(251.902e6), '251.9 Ma'); eq(TL.fmtAgo(850), '850 yr ago');
});
test('timeline: ticks and lanes', () => {
  const t = TL.linearTicks(-3000, 2000, 800); ok(t.length >= 5 && t.some(([, l]) => l === '1000 BCE'), JSON.stringify(t));
  const d = TL.linearTicks(2025 - 4.6e9, 2025, 800); ok(d.some(([, l]) => l === '1 Ga') && d.some(([, l]) => l === 'now'), JSON.stringify(d));
  eq(TL.logTicks(1, 1.38e10, 70).filter((x) => x[1]).map((x) => x[1]), ['1 yr', '10 yr', '100 yr', '1 ka', '10 ka', '100 ka', '1 Ma', '10 Ma', '100 Ma', '1 Ga', '10 Ga']);
  const boxes = [{ x0: 0, x1: 50 }, { x0: 30, x1: 80 }, { x0: 60, x1: 100 }, { x0: 55, x1: 58 }, { x0: 10, x1: 20, priority: 5 }], L = TL.lanes(boxes, 3, 2);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (L[i] >= 0 && L[i] === L[j]) ok(boxes[i].x1 + 2 <= boxes[j].x0 || boxes[j].x1 + 2 <= boxes[i].x0, `overlap ${i} ${j}`);
  eq(L[4], 0, 'priority first');
  const g = TL.GEOLOGIC(['period']); eq(g.length, 12); close(2025 - g.find((s) => s.label === 'Cretaceous').to, 66e6, 1e-12);
});

// ------------------------------------------------------------ agents
test('agents: Game of Life glider translates by (1, 1) every 4 generations', () => {
  const M = A.model({ ...A.AUTOMATA.life({}), size: 12, fill: null, init: () => 0 }); for (const [i, j] of [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]]) M.set(i, j, 1);
  M.step(8); const alive = []; for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) if (M.get(i, j)) alive.push([i, j]); eq(alive, [[3, 2], [4, 3], [2, 4], [3, 4], [4, 4]]);
  eq(A.lifeRule('B36/S23').born.has(6), true);
});
test('agents: Schelling raises the segregation index and ends with nobody unhappy; seeded runs repeat', () => {
  const run = () => { const M = A.model({ ...A.AUTOMATA.schelling({ tolerance: 0.4 }), size: 40, seed: 11, maxSteps: 500 }); M.step(500); return M; };
  const M = run(); ok(M.history.segregation[0] < 0.56 && M.stats.segregation > 0.7, `${M.history.segregation[0]} → ${M.stats.segregation}`); eq(M.stats.unhappy, 0); eq(run().stats.segregation, M.stats.segregation, 'deterministic');
  eq(M.count('A') + M.count('B') + M.count('empty'), 1600, 'agents are conserved');
});
test('agents: SIR conserves cells, R is monotone, sub-threshold outbreaks die out', () => {
  const M = A.model({ ...A.AUTOMATA.sir({ beta: 0.2, gamma: 0.1, seeds: 5, center: true }), size: 60, seed: 2, maxSteps: 600 }); M.step(600);
  M.history.t.forEach((_, i) => close(M.history.S[i] + M.history.I[i] + M.history.R[i], 1, 1e-12)); for (let i = 1; i < M.history.R.length; i++) ok(M.history.R[i] >= M.history.R[i - 1]);
  ok(M.stats.R > 0.5, `big outbreak ${M.stats.R}`);
  const W = A.model({ ...A.AUTOMATA.sir({ beta: 0.02, gamma: 0.2, seeds: 5, center: true }), size: 60, seed: 2, maxSteps: 600 }); W.step(600); ok(W.stats.R < 0.02 && W.done, `fizzle ${W.stats.R}`);
});
test('agents: sandpile heights stay below 4 and grains are conserved minus edge losses', () => {
  const M = A.model({ ...A.AUTOMATA.sandpile({}), size: 21, seed: 1 }); M.step(800); ok(M.grid.every((h) => h < 4)); let s = 0; for (const h of M.grid) s += h; ok(s <= 800 && s > 300, `${s}`);
});
test('agents: ballistic gas conserves kinetic energy; uncorrelated walkers have MSD ≈ n v²', () => {
  const Gs = A.model({ ...A.AUTOMATA.gas({}), seed: 3 }), ke = (m) => { let e = 0; for (let i = 0; i < m.n; i++) e += m.vx[i] ** 2 + m.vy[i] ** 2; return e; }, e0 = ke(Gs); Gs.step(300); close(ke(Gs), e0, 1e-9);
  const W = A.model({ ...A.AUTOMATA.walkers({ n: 2000, box: [1000, 1000] }), seed: 5 }); W.step(50); close(W.stats.msd / (50 * 0.36), 1, 0.08, 'MSD/(n v²)');
  const B = A.model({ ...A.AUTOMATA.boids({}), seed: 1 }); B.step(300); ok(B.stats.order > 0.6 && B.history.order[0] < 0.2, `boids order ${B.history.order[0]} → ${B.stats.order}`);
});

// ------------------------------------------------------------ curves
test('curves: linear market — equilibrium, surpluses, DWL = ½ t ΔQ, accounting identity', () => {
  const Dm = (q) => 100 - q, Sp = (q) => 10 + 0.8 * q, r0 = C.market(Dm, Sp, 100);
  close(r0.q0, 50, 1e-9); close(r0.p0, 50, 1e-9); close(r0.cs, 1250, 1e-9); close(r0.psur, 1000, 1e-9); close(r0.dwl, 0, 1e-12);
  for (const t of [9, 18, 27, -9]) { const r = C.market(Dm, Sp, 100, { tax: t }); close(r.dwl, 0.5 * t * (r.q0 - r.q), 1e-9, `DWL t=${t}`); close(r.pb - r.ps, t, 1e-9); close(r.total + r.dwl, r.total0, 1e-9, 'CS+PS+rev+DWL'); close(r.q, (90 - t) / 1.8, 1e-8); }
  const c = C.market(Dm, Sp, 100, { ceiling: 40 }); close(c.q, 37.5, 1e-8); close(c.shortage, 22.5, 1e-8); close(c.dwl, 0.5 * (50 - 37.5) * (Dm(37.5) - 40), 1e-8);
  const f = C.market(Dm, Sp, 100, { floor: 70 }); close(f.q, 30, 1e-8); close(f.excess, 45, 1e-8);
  const nb = C.market(Dm, Sp, 100, { floor: 30 }); eq(nb.binding, null, 'a floor below P* does not bind');
});
test('curves: curved (monotone cubic) market areas match direct integration', () => {
  const Dm = C.monotone([[5, 95], [30, 50], [90, 20]]), Sp = C.monotone([[5, 5], [60, 40], [95, 90]]), r = C.market(Dm, Sp, 100, { tax: 12 });
  close(Dm(30), 50, 1e-12); ok(Dm(10) > Dm(20) && Sp(10) < Sp(20), 'monotone');
  close(r.dwl, C.simpson((q) => Dm(q) - Sp(q), r.q, r.q0, 4000), 1e-6); close(r.total + r.dwl, r.total0, 1e-6);
});
test('curves: utility maximisation — Cobb–Douglas formula, tangency, corners and kinks', () => {
  for (const [a, px, py, m] of [[0.3, 2, 1, 20], [0.7, 1.5, 4, 33]]) { const U = C.utility('cobb-douglas', a), o = C.optimum(U, px, py, m); close(o.x, (a * m) / px, 1e-6); close(o.y, ((1 - a) * m) / py, 1e-6); close(C.mrs(U, o.x, o.y), px / py, 1e-5, 'MRS = price ratio'); }
  const s = C.optimum(C.utility('substitutes', 1, 1), 2, 1, 20); close(s.x, 0, 1e-9); close(s.y, 20, 1e-9);
  const k = C.optimum(C.utility('complements', 1, 1), 2, 1, 21); close(k.x, 7, 1e-6); close(k.y, 7, 1e-6);
  const q = C.optimum(C.utility('quasilinear', 3), 2, 1, 20); close(q.x, 1.5, 1e-6, 'quasilinear: x* = a py / px');
});
test('curves: Gini, Lorenz, cost-curve minima, contours', () => {
  close(C.gini([5, 5, 5, 5]), 0, 1e-12); close(C.gini([0, 0, 0, 1]), 0.75, 1e-12); close(C.gini([1, 2, 3, 4]), 0.25, 1e-12);
  const L = C.lorenz([3, 1, 2]); eq(L[0], [0, 0]); close(L[3][1], 1, 1e-12); close(L[1][1], 1 / 6, 1e-12);
  const K = C.costs({ F: 100, a: 20, b: -1.2, c: 0.03 }); close(K.minAVC.q, 20, 1e-12); close(K.MC(K.minAVC.q), K.AVC(K.minAVC.q), 1e-9); close(K.MC(K.minAC.q), K.AC(K.minAC.q), 1e-7);
  const segs = C.contour((x, y) => x * x + y * y, 1, [-2, 2], [-2, 2], 80); ok(segs.length > 50); for (const [p] of segs) close(Math.hypot(...p), 1, 0.01);
});

// ------------------------------------------------------------ tree
const NJD = [[0, 5, 9, 9, 8], [5, 0, 10, 10, 9], [9, 10, 0, 8, 7], [9, 10, 8, 0, 3], [8, 9, 7, 3, 0]], AB = ['a', 'b', 'c', 'd', 'e'];
test('tree: neighbour joining on the textbook example (Saitou & Nei; Wikipedia) recovers the additive tree', () => {
  const t = T.nj(NJD, AB); eq(AB.map((n) => T.find(t, n).length), [2, 3, 4, 2, 1], 'leaf edges');
  const P = T.patristic(t, AB); for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) close(P[i][j], NJD[i][j], 1e-12);
  eq(t.joins[0].a.name + t.joins[0].b.name, 'ab', 'a and b are joined first');
  const m = T.midpoint(t), Pm = T.patristic(m, AB); for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) close(Pm[i][j], NJD[i][j], 1e-12, 'midpoint rooting keeps distances');
});
test('tree: UPGMA on the textbook example gives heights 8.5, 11, 14, 16.5', () => {
  const U = [[0, 17, 21, 31, 23], [17, 0, 30, 34, 21], [21, 30, 0, 28, 39], [31, 34, 28, 0, 43], [23, 21, 39, 43, 0]], t = T.upgma(U, AB);
  close(t.height, 16.5); close(T.mrca(t, 'a', 'b').height, 8.5); close(T.mrca(t, 'a', 'e').height, 11); close(T.mrca(t, 'c', 'd').height, 14);
  for (const l of T.leaves(t)) close(l.dist, 16.5, 1e-12, 'ultrametric');
});
test('tree: NJ beats UPGMA when rates differ (Robinson–Foulds distance)', () => {
  const truth = T.newick('((A:1,B:7):2,((C:1.5,D:1.5):0.5,E:2):1,F:3);'), names = ['A', 'B', 'C', 'D', 'E', 'F'], Dm = T.patristic(truth, names);
  eq(T.rf(T.nj(Dm, names), truth), 0); ok(T.rf(T.upgma(Dm, names), truth) > 0, 'UPGMA wrong under rate heterogeneity');
  const clock = T.newick('((A:1,B:1):2,((C:1.5,D:1.5):0.5,E:2):1,F:3);'), Dc = T.patristic(clock, names); eq(T.rf(T.upgma(Dc, names), clock), 0);
});
test('tree: Newick round-trip, quoting, mrca/path/distance', () => {
  const s = "((A:0.1,'B c':0.2)AB:0.3,(C:0.4,D:0.5)CD:0.6)root;", t = T.newick(s); eq(T.toNewick(t), s);
  eq(T.leaves(t).map((n) => n.name), ['A', 'B c', 'C', 'D']); eq(T.mrca(t, 'A', 'B c').name, 'AB'); eq(T.path(t, 'A', 'D').map((n) => n.name), ['A', 'AB', 'root', 'CD', 'D']); close(T.distance(t, 'A', 'D'), 1.5, 1e-12);
  const o = T.finalize({ name: 'S', children: [{ name: 'NP', children: ['the', 'cat'] }, 'sat'] }); eq(T.leaves(o).map((n) => n.name), ['the', 'cat', 'sat']); eq(o.children[0].depth, 1);
});

console.log(`\n${passed} passed, ${failed} failed${failed ? ': ' + fails.join('; ') : ''}`);
process.exit(failed ? 1 : 0);
