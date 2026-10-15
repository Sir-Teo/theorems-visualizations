// Numerical tests for the science kits' DOM-free solvers.   Run: node tests/kits-science.test.mjs   (or node --test tests/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { lineIntegrals, sourceField, sourcePotential, sourceStream, gridOf, isolines, niceLevels, streamlines, pointInPoly } from '../assets/js/viz/kits/fields.js';
import { eig2x2, classify, fixedPoints, orbit, jacobian } from '../assets/js/viz/kits/pplane.js';
import { Circuit, QState, GATES, toBloch, fmtAngle } from '../assets/js/viz/kits/quantum.js';
import { radial, realY, hydrogen, laguerre, legendre, orbitalSpec, energyH, getMolecule, autoBond, formula, distance, angle, aufbau, spins, LIBRARY, molarMass } from '../assets/js/viz/kits/mol.js';
import { Netlist, si, waveAt } from '../assets/js/viz/kits/circuit.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} expected ${b}, got ${a} (tol ${tol})`);
const lcg = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ================================================================== fields
test('fields: Gauss — flux through any closed curve equals the enclosed charge (2D law, ε0 = 1)', () => {
  const src = [{ type: 'charge', x: 0, y: 0, q: 1 }, { type: 'charge', x: 2, y: 0.5, q: -2.5 }, { type: 'charge', x: -1.5, y: 1, q: 0.75 }];
  const F = sourceField(src);
  close(lineIntegrals(F, { type: 'circle', x: 0, y: 0, r: 0.6 }).flux, 1, 1e-8, 'circle around q1');
  close(lineIntegrals(F, { type: 'circle', x: 0.3, y: 0.2, r: 2.6 }).flux, 1 - 2.5 + 0.75, 1e-8, 'circle around all');
  close(lineIntegrals(F, [[-0.5, -0.5], [2.5, -0.5], [2.5, 1], [-0.5, 1]]).flux, -1.5, 1e-8, 'rectangle around q1, q2');
  close(lineIntegrals(F, [[-0.5, -0.5], [-0.5, 1], [2.5, 1], [2.5, -0.5]]).flux, -1.5, 1e-8, 'clockwise polygon is reoriented');
  close(lineIntegrals(F, [[3, 3], [4, 3], [4, 4]]).flux, 0, 1e-9, 'empty triangle');
  // non-convex polygon (an L shape) around q3 only
  close(lineIntegrals(F, [[-2.5, 0.5], [-1, 0.5], [-1, 1.5], [-0.5, 1.5], [-0.5, 2], [-2.5, 2]]).flux, 0.75, 1e-8, 'L-shaped loop');
  close(lineIntegrals(sourceField(src, { eps0: 2 }), { type: 'circle', x: 0, y: 0, r: 0.5 }).flux, 0.5, 1e-8, 'flux = q/ε0');
});
test('fields: electrostatic circulation vanishes; vortex circulation equals Γ_enc (Stokes)', () => {
  const E = sourceField([{ type: 'charge', x: 0.2, y: 0.1, q: 3 }]);
  close(lineIntegrals(E, { type: 'circle', x: 0, y: 0, r: 1 }).circulation, 0, 1e-9);
  const U = sourceField([{ type: 'vortex', x: 0.3, y: 0.1, gamma: 2 }, { type: 'vortex', x: 3, y: 0, gamma: -1 }], { uniform: [1, 0.3] });
  const I = lineIntegrals(U, [[-1, -1], [1, -1], [1, 1], [-1, 1]]);
  close(I.circulation, 2, 1e-8, 'Γ inside'); close(I.flux, 0, 1e-8, 'vortices carry no flux');
});
test('fields: E = −∇φ and the stream function is consistent with the velocity', () => {
  const src = [{ type: 'charge', x: 0, y: 0, q: 1.3 }, { type: 'source', x: 1, y: -1, m: -0.7 }, { type: 'mass', x: -1, y: 1, m: 2 }];
  for (const law of ['2d', '3d']) {
    const F = sourceField(src, { law, uniform: [0.2, -0.4] }), phi = sourcePotential(src, { law, uniform: [0.2, -0.4] }), h = 1e-5;
    for (const [x, y] of [[0.4, 0.7], [-0.6, -0.3], [1.7, 0.2]]) {
      const [u, w] = F(x, y);
      close(-(phi(x + h, y) - phi(x - h, y)) / (2 * h), u, 1e-6, `${law} Ex`); close(-(phi(x, y + h) - phi(x, y - h)) / (2 * h), w, 1e-6, `${law} Ey`);
    }
  }
  const V = [{ type: 'vortex', x: 0.1, y: 0.2, gamma: 1.5 }], Fv = sourceField(V, { uniform: [1, 0.5] }), psi = sourceStream(V, { uniform: [1, 0.5] }), h = 1e-5;
  const [u, w] = Fv(0.7, -0.4); close((psi(0.7, -0.4 + h) - psi(0.7, -0.4 - h)) / (2 * h), u, 1e-6); close(-(psi(0.7 + h, -0.4) - psi(0.7 - h, -0.4)) / (2 * h), w, 1e-6);
  // the 3d law is not a Gauss law in the plane: flux depends on the radius
  const F3 = sourceField([{ type: 'charge', x: 0, y: 0, q: 1 }], { law: '3d' });
  assert.ok(Math.abs(lineIntegrals(F3, { type: 'circle', x: 0, y: 0, r: 1 }).flux - lineIntegrals(F3, { type: 'circle', x: 0, y: 0, r: 2 }).flux) > 0.05);
});
test('fields: marching squares recovers a circle; levels and streamlines are sane', () => {
  const G = gridOf((x, y) => x * x + y * y, { x: [-2, 2], y: [-2, 2] }, 121, 121), L = isolines(G, 1);
  assert.equal(L.length, 1, 'one closed curve'); assert.ok(L[0].length > 100);
  for (const [x, y] of L[0]) close(Math.hypot(x, y), 1, 2e-3);
  close(L[0][0][0], L[0][L[0].length - 1][0], 1e-12, 'closed'); close(L[0][0][1], L[0][L[0].length - 1][1], 1e-12, 'closed');
  // pole guard: 1/x changes sign through a pole, not a zero
  const P = gridOf((x) => 1 / x, { x: [-1, 1.1], y: [-1, 1] }, 40, 30);
  assert.equal(isolines(P, 0, { fn: (x) => 1 / x }).length, 0);
  const lv = niceLevels(G, 8); assert.ok(lv.length >= 5 && lv.every((v, i) => !i || v > lv[i - 1]));
  const S = streamlines((x, y) => [-y, x], { x: [-1, 1], y: [-1, 1], sx: 150, sy: 150 }, { sep: 20 });
  assert.ok(S.length >= 3, 'several streamlines');
  for (const l of S) for (const [x, y] of l.pts.slice(5, 50)) close(Math.hypot(x, y), Math.hypot(...l.pts[0]), 0.02, 'streamline of a rotation stays on its circle');
  assert.ok(pointInPoly([0.5, 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]]) && !pointInPoly([1.5, 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]]));
});

// ================================================================== phase plane
test('pplane: eigenvalues and classification of equilibria', () => {
  const e = eig2x2([[1, 2], [2, 1]]); close(e.l[0].re, 3, 1e-12); close(e.l[1].re, -1, 1e-12);
  const v = e.vecs[0]; close(Math.abs(v[0]), Math.SQRT1_2, 1e-12); close(Math.abs(v[1]), Math.SQRT1_2, 1e-12);
  const cases = [[[[1, 0], [0, -2]], 'saddle'], [[[-1, 0], [0, -3]], 'stable node'], [[[2, 1], [0, 3]], 'unstable node'], [[[-0.1, 1], [-1, -0.1]], 'stable spiral'],
    [[[0.2, -2], [1, 0.2]], 'unstable spiral'], [[[0, 1], [-4, 0]], 'center'], [[[1, 0], [0, 0]], 'degenerate'], [[[-2, 0], [0, -2]], 'stable degenerate node']];
  for (const [J, t] of cases) assert.equal(classify(J).type, t, JSON.stringify(J));
  assert.equal(classify([[0, 1], [-1, 0]]).rot, -1, 'clockwise center'); assert.equal(classify([[0, -1], [1, 0]]).rot, 1, 'counter-clockwise center');
  const J = jacobian((x, y) => [x * x - y, Math.sin(x * y)], 0.5, 0.3);
  close(J[0][0], 1, 1e-6); close(J[0][1], -1, 1e-6); close(J[1][0], 0.3 * Math.cos(0.15), 1e-6); close(J[1][1], 0.5 * Math.cos(0.15), 1e-6);
});
test('pplane: Newton from a seed grid finds and classifies all equilibria', () => {
  const lv = fixedPoints((x, y) => [x - x * y, x * y - y], { x: [-0.5, 3], y: [-0.5, 3] });
  assert.deepEqual(lv.map((f) => f.type), ['saddle', 'center']); close(lv[1].x, 1, 1e-10); close(lv[1].y, 1, 1e-10);
  const pend = fixedPoints((x, y) => [y, -Math.sin(x) - 0.3 * y], { x: [-7, 7], y: [-3, 3] });
  assert.equal(pend.length, 5);
  pend.forEach((f, k) => { close(f.x, (k - 2) * Math.PI, 1e-9); assert.equal(f.type, k % 2 ? 'saddle' : 'stable spiral'); });
  const sad = pend[1]; close(sad.l[0].re, (-0.3 + Math.sqrt(0.09 + 4)) / 2, 1e-6, 'saddle eigenvalue');
  const dn = fixedPoints((x, y) => [x * (1 - x) - x * y, y * (0.75 - y) - 0.5 * x * y], { x: [-0.2, 1.2], y: [-0.2, 1] });
  assert.equal(dn.length, 4, 'competition model: 4 equilibria');
});
test('pplane: trajectories conserve H, close up, find limit cycles and sink into spirals', () => {
  const lv = (x, y) => [x - x * y, x * y - y], H = (x, y) => x - Math.log(x) + y - Math.log(y), B = { x: [-0.5, 4], y: [-0.5, 4] };
  for (const method of ['rk4', 'rk45']) {
    const o = orbit(lv, 2, 1, { bounds: B, sx: 150, sy: 150, method });
    assert.equal(o.stop, 'closed orbit', method);
    let drift = 0; for (const p of o.pts) drift = Math.max(drift, Math.abs(H(...p) - H(2, 1))); assert.ok(drift < 1e-7, `${method} H drift ${drift}`);
  }
  const vdp = orbit((x, y) => [y, (1 - x * x) * y - x], 0.1, 0, { bounds: { x: [-4, 4], y: [-4, 4] }, sx: 100, sy: 100 });
  assert.equal(vdp.stop, 'limit cycle'); close(vdp.period, 6.6633, 0.01, 'Van der Pol (μ = 1) period');
  const back = orbit((x, y) => [y, (1 - x * x) * y - x], 0.1, 0, { dir: -1, bounds: { x: [-4, 4], y: [-4, 4] }, sx: 100, sy: 100, sinks: [[0, 0]] });
  assert.equal(back.stop, 'fixed point', 'backward from inside the cycle → unstable focus');
  const damp = orbit((x, y) => [y, -Math.sin(x) - 0.2 * y], 1.5, 0, { bounds: { x: [-7, 7], y: [-3, 3] }, sx: 60, sy: 60, sinks: [[0, 0]] });
  assert.equal(damp.stop, 'fixed point');
  const out = orbit((x, y) => [x, y], 0.1, 0.1, { bounds: { x: [-1, 1], y: [-1, 1] }, sx: 100, sy: 100 }); assert.equal(out.stop, 'edge');
  // time stamps are monotone and the exponential solution is accurate
  const ex = orbit((x, y) => [-x, -2 * y], 1, 1, { sx: 300, sy: 300, tMax: 1, cycles: false });
  const j = ex.ts.findIndex((t) => t >= 0.5); close(ex.pts[j][0], Math.exp(-ex.ts[j]), 1e-6); close(ex.pts[j][1], Math.exp(-2 * ex.ts[j]), 1e-6);
});

// ================================================================== quantum
test('quantum: Bell state, sampling statistics, reduced states', () => {
  const qc = new Circuit(2).h(0).cx(0, 1).measure(), s = qc.state();
  const p = s.probs(); close(p[0], 0.5, 1e-12); close(p[3], 0.5, 1e-12); close(p[1] + p[2], 0, 1e-12);
  close(Math.hypot(...s.bloch(0)), 0, 1e-12, 'maximally mixed'); close(s.purity(1), 0.5, 1e-12); close(s.entropy(0), 1, 1e-12);
  const N = 20000, { counts } = s.sample(N, lcg(42)); close(counts['00'] / N, 0.5, 4 * Math.sqrt(0.25 / N)); assert.equal((counts['01'] || 0) + (counts['10'] || 0), 0);
  assert.equal(s.ket(), '\\tfrac{1}{\\sqrt2}|00\\rangle + \\tfrac{1}{\\sqrt2}|11\\rangle');
  close(qc.state(1).bloch(0)[0], 1, 1e-12, 'after H: +x');
});
test('quantum: gates, Bloch vectors and identities', () => {
  const b = (qc) => qc.state().bloch(0);
  assert.deepEqual(b(new Circuit(1).h(0)).map((x) => +x.toFixed(12)), [1, 0, 0]);
  assert.deepEqual(b(new Circuit(1).h(0).s(0)).map((x) => +x.toFixed(12)), [0, 1, 0]);
  assert.deepEqual(b(new Circuit(1).x(0)).map((x) => +x.toFixed(12)), [0, 0, -1]);
  for (const t of [0.3, 1.2, 2.9]) {
    const r = b(new Circuit(1).rx(t, 0)); close(r[0], 0, 1e-12); close(r[1], -Math.sin(t), 1e-12); close(r[2], Math.cos(t), 1e-12);
    const q = b(new Circuit(1).ry(t, 0)); close(q[0], Math.sin(t), 1e-12); close(q[2], Math.cos(t), 1e-12);
    const z = b(new Circuit(1).h(0).rz(t, 0)); close(z[0], Math.cos(t), 1e-12); close(z[1], Math.sin(t), 1e-12);
  }
  const same = (a, c) => { const x = a.state(), y = c.state(); let ov = [0, 0]; for (let i = 0; i < x.N; i++) { ov[0] += x.re[i] * y.re[i] + x.im[i] * y.im[i]; ov[1] += x.re[i] * y.im[i] - x.im[i] * y.re[i]; } return Math.hypot(...ov); };
  close(same(new Circuit(1).ry(0.7, 0).h(0).z(0).h(0), new Circuit(1).ry(0.7, 0).x(0)), 1, 1e-12, 'HZH = X');
  close(same(new Circuit(1).h(0).t(0).t(0), new Circuit(1).h(0).s(0)), 1, 1e-12, 'T² = S');
  close(same(new Circuit(1).h(0).s(0).s(0), new Circuit(1).h(0).z(0)), 1, 1e-12, 'S² = Z');
  close(same(new Circuit(1).h(0).y(0), new Circuit(1).h(0).x(0).z(0)), 1, 1e-12, 'Y = iXZ up to phase');
  // CNOT truth table with q0 as control (q0 = most significant bit)
  for (const [inp, out] of [['00', '00'], ['01', '01'], ['10', '11'], ['11', '10']]) {
    const qc = new Circuit(2); if (inp[0] === '1') qc.x(0); if (inp[1] === '1') qc.x(1); qc.cx(0, 1); close(qc.state().prob(out), 1, 1e-12, `CNOT ${inp}`);
  }
  close(new Circuit(2).x(0).swap(0, 1).state().prob('01'), 1, 1e-12, 'SWAP');
  const cz = new Circuit(2).x(0).x(1).cz(0, 1).state(); close(cz.re[3], -1, 1e-12, 'CZ phase');
  const ghz = new Circuit(3).h(0).cx(0, 1).cx(1, 2).state(); close(ghz.prob('000'), 0.5, 1e-12); close(ghz.prob('111'), 0.5, 1e-12);
});
test('quantum: random circuits preserve the norm; helpers', () => {
  const r = lcg(7), names = ['H', 'X', 'Y', 'Z', 'S', 'T', 'Sdg', 'Tdg', 'Rx', 'Ry', 'Rz', 'P'];
  for (let k = 0; k < 20; k++) {
    const n = 1 + Math.floor(r() * 6), qc = new Circuit(n);
    for (let g = 0; g < 30; g++) {
      const u = r();
      if (u < 0.2 && n > 1) { const a = Math.floor(r() * n); let b2 = Math.floor(r() * n); if (b2 === a) b2 = (a + 1) % n; [() => qc.cx(a, b2), () => qc.cz(a, b2), () => qc.swap(a, b2)][Math.floor(r() * 3)](); }
      else qc.add(names[Math.floor(r() * names.length)], Math.floor(r() * n), r() * 6);
    }
    close(qc.state().norm(), 1, 1e-12, 'unitary evolution');
  }
  for (const g of ['H', 'X', 'Y', 'Z', 'S', 'T', 'Rx', 'Ry', 'Rz']) { // U U† = I
    const U = GATES[g](0.9); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { let re = 0, im = 0; for (let k = 0; k < 2; k++) { const a = U[i][k], b2 = U[j][k]; re += a[0] * b2[0] + a[1] * b2[1]; im += a[1] * b2[0] - a[0] * b2[1]; } close(re, +(i === j), 1e-12, g); close(im, 0, 1e-12, g); }
  }
  assert.deepEqual(toBloch({ theta: Math.PI / 2, phi: 0 }).map((x) => +x.toFixed(12)), [1, 0, 0]);
  assert.deepEqual(toBloch([[1, 0], [0, 1]]).map((x) => +x.toFixed(12)), [0, 1, 0]);
  assert.equal(fmtAngle(Math.PI / 2), 'π/2'); assert.equal(fmtAngle(-3 * Math.PI / 4), '−3π/4'); assert.equal(fmtAngle(2 * Math.PI), '2π');
  const m = QState.from([1, 1, 0, 0]); assert.equal(m.measure(0, () => 0.3), 0); close(m.prob('00') + m.prob('01'), 1, 1e-12);
});

// ================================================================== molecules and orbitals
test('mol: hydrogen radial functions are normalised, have n−l−1 nodes and solve the Schrödinger equation', () => {
  for (let n = 1; n <= 4; n++) for (let l = 0; l < n; l++) {
    let s = 0, nodes = 0, prev = radial(n, l, 1e-3); const N = 30000, R = 90;
    for (let i = 1; i <= N; i++) { const r = R * i / N, v = radial(n, l, r); s += v * v * r * r * R / N; if (r > 1e-3 && v * prev < 0) nodes++; if (Math.abs(v) > 1e-12) prev = v; }
    close(s, 1, 2e-4, `∫R² r² dr for n=${n} l=${l}`); assert.equal(nodes, n - l - 1, `radial nodes n=${n} l=${l}`);
  }
  // −½∇²ψ − ψ/r = E ψ (atomic units), checked by finite differences away from nodes
  for (const [n, l, m] of [[1, 0, 0], [2, 1, 1], [3, 2, 0], [3, 2, -2], [4, 3, 1], [4, 1, 0]]) {
    const psi = hydrogen(n, l, m), E = -1 / (2 * n * n), h = 1e-3;
    for (const [x, y, z] of [[0.7, 0.4, 1.1], [2.1, -1.3, 0.6], [-1.5, 2.2, -2.4]]) {
      const v = psi(x, y, z); if (Math.abs(v) < 1e-4) continue;
      const lap = (psi(x + h, y, z) + psi(x - h, y, z) + psi(x, y + h, z) + psi(x, y - h, z) + psi(x, y, z + h) + psi(x, y, z - h) - 6 * v) / (h * h);
      close((-0.5 * lap - v / Math.hypot(x, y, z)) / v, E, 2e-4, `Hψ = Eψ for ${n}${'spdf'[l]} m=${m}`);
    }
  }
  close(energyH(2), -3.4014, 1e-3);
});
test('mol: real spherical harmonics are orthonormal; Laguerre/Legendre values', () => {
  const set = [[0, 0], [1, -1], [1, 0], [1, 1], [2, -2], [2, 0], [2, 1], [3, 2], [3, -3]], K = 120;
  for (const [l1, m1] of set) for (const [l2, m2] of set) {
    let s = 0; for (let i = 0; i < K; i++) for (let j = 0; j < 2 * K; j++) { const th = Math.PI * (i + 0.5) / K, ph = Math.PI * (j + 0.5) / K; s += realY(l1, m1, th, ph) * realY(l2, m2, th, ph) * Math.sin(th) * (Math.PI / K) ** 2; }
    close(s, l1 === l2 && m1 === m2 ? 1 : 0, 2e-4, `<Y${l1}${m1}|Y${l2}${m2}>`);
  }
  close(laguerre(2, 1, 0.5), 0.5 * 0.25 - 3 * 0.5 + 3, 1e-12); close(legendre(2, 0, 0.3), (3 * 0.09 - 1) / 2, 1e-12); close(legendre(2, 2, 0.3), 3 * (1 - 0.09), 1e-12);
  assert.deepEqual(orbitalSpec('3d_{z^2}'), { n: 3, l: 2, m: 0, name: '3d_{z^2}' }); assert.equal(orbitalSpec('3dx2-y2').m, 2); assert.equal(orbitalSpec('2p_y').m, -1); assert.equal(orbitalSpec('4f_xyz').m, -2);
  // p_x points along x, d_xy has lobes on the diagonals
  assert.ok(hydrogen('2p_x')(2, 0, 0) > 0 && Math.abs(hydrogen('2p_x')(0, 2, 0)) < 1e-12); assert.ok(hydrogen('3d_xy')(2, 2, 0) > 0 && hydrogen('3d_xy')(2, -2, 0) < 0);
});
test('mol: library geometries, auto-bonding and formulas', () => {
  close(distance('H2O', 0, 1), 0.9572, 1e-4); close(angle('H2O', 1, 0, 2), 104.52, 0.01); close(angle('NH3', 1, 0, 2), 106.7, 0.01);
  close(angle('CH4', 1, 0, 2), 109.4712, 1e-3); close(distance('C6H6', 0, 1), 1.397, 1e-3); close(angle('C6H6', 5, 0, 1), 120, 1e-9); close(angle('C2H4', 2, 0, 3), 117.4, 0.01);
  close(angle('CO2', 1, 0, 2), 180, 1e-9); close(angle('SF6', 1, 0, 3), 90, 1e-9);
  for (const k of Object.keys(LIBRARY)) { const M = getMolecule(k), auto = autoBond(M.atoms); assert.equal(auto.length, M.bonds.length, `${k}: auto-bonding finds the bonds`); }
  const ob = (k) => autoBond(getMolecule(k).atoms).map((b) => b[2]).filter((o) => o > 1);
  assert.deepEqual(ob('CO2'), [2, 2]); assert.deepEqual(ob('C2H4'), [2]); assert.deepEqual(ob('C6H6'), [1.5, 1.5, 1.5, 1.5, 1.5, 1.5]);
  assert.equal(formula(getMolecule('C2H5OH')), 'C2H6O'); assert.equal(formula(getMolecule('SF6')), 'F6S'); close(molarMass('H2O'), 18.015, 1e-3);
  assert.equal(getMolecule('benzene').formula, 'C6H6');
});
test('mol: Aufbau and Hund filling', () => {
  // O2 valence MOs (σ2s, σ*2s, σ2p, π2p ×2, π*2p ×2, σ*2p) with 12 electrons: two unpaired electrons in π*
  const L = [{ E: -32 }, { E: -24 }, { E: -16 }, { E: -15, deg: 2 }, { E: -12, deg: 2 }, { E: 4 }];
  const f = aufbau(L, 12); assert.deepEqual(f.map((x) => x.occ), [2, 2, 2, 4, 2, 0]);
  assert.deepEqual(f[4].up, [true, true]); assert.deepEqual(f[4].down, [false, false], 'Hund: parallel spins first');
  assert.deepEqual(spins(3, 4), { occ: 4, up: [true, true, true], down: [true, false, false] });
});

// ================================================================== circuits
test('circuit: DC divider, power balance, current source, switch', () => {
  const N = new Netlist([{ type: 'V', id: 'V1', a: 'in', b: '0', value: 10 }, { type: 'R', id: 'R1', a: 'in', b: 'mid', value: 1e3 }, { type: 'R', id: 'R2', a: 'mid', b: '0', value: 3e3 },
    { type: 'I', id: 'I1', a: '0', b: 'mid', value: 1e-3 }]);
  const r = N.dc(); close(r.V('mid'), 10 * 0.75 + 1e-3 * 750, 1e-6); // superposition
  let tot = 0; for (const p of N.parts) tot += r.P(p.id); close(tot, 0, 1e-9, 'Tellegen: Σ p = 0');
  const S = new Netlist([{ type: 'V', a: 'a', b: '0', value: 5 }, { type: 'SW', id: 'S', a: 'a', b: 'b', closed: false }, { type: 'R', id: 'R', a: 'b', b: '0', value: 100 }]);
  close(S.dc().I('R'), 0, 1e-12, 'open switch'); S.part('S').closed = true; close(S.dc().I('R'), 0.05, 1e-12, 'closed switch');
});
test('circuit: nets from geometry (wires, T-junctions, ground symbols)', () => {
  const N = new Netlist([
    { type: 'V', id: 'V', value: 9, at: [0, 2, 0, 0] }, { type: 'R', id: 'R1', value: 1e3, at: [0, 2, 3, 2] },
    { type: 'R', id: 'R2', value: 2e3, at: [3, 2, 3, 0] }, { type: 'R', id: 'R3', value: 2e3, at: [5, 2, 5, 0] },
    { type: 'W', at: [3, 2, 5, 2] }, { type: 'W', at: [5, 0, 0, 0] }, { type: 'GND', at: [2, 0] },
  ]);
  const r = N.dc(), top = N.termNode.get('R2').a; assert.equal(N.ground, '0'); assert.equal(N.termNode.get('R3').a, top, 'wire joins R2 and R3');
  close(r.V(top), 9 * 1000 / 2000, 1e-6, 'R2 ∥ R3 = 1 kΩ'); close(r.I('R2'), 2.25e-3, 1e-9);
  assert.equal(N.segs.filter((s) => s.node === '0').length, 2, 'bottom wire split at the ground symbol');
});
test('circuit: RC, RL and RLC transients match the analytic solutions', () => {
  const rc = new Netlist([{ type: 'V', a: 'a', b: '0', value: 5 }, { type: 'SW', a: 'a', b: 'b', closedAt: 0 }, { type: 'R', id: 'R', a: 'b', b: 'c', value: 1e3 }, { type: 'C', id: 'C', a: 'c', b: '0', value: 1e-4 }]);
  for (const [method, tol] of [['trap', 5e-4], ['be', 2e-2]]) {
    const tr = rc.transient(0.5, 1e-3, { method }); let e = 0; tr.t.forEach((t, j) => { e = Math.max(e, Math.abs(tr.v.c[j] - 5 * (1 - Math.exp(-t / 0.1)))); }); assert.ok(e < tol, `${method} error ${e}`);
    close(tr.at(0.1).V('c') / 5, 1 - Math.exp(-1), method === 'trap' ? 1e-4 : 5e-3, `${method}: 63.2% at τ`);
  }
  close(rc.transient(0.5, 1e-3).i.R[0], 5e-3, 1e-9, 'i(0+) = V/R');
  const rl = new Netlist([{ type: 'V', a: 'a', b: '0', value: 2 }, { type: 'R', a: 'a', b: 'b', value: 100 }, { type: 'L', id: 'L', a: 'b', b: '0', value: 0.1 }]);
  close(rl.transient(5e-3, 1e-5).at(1e-3).I('L'), 0.02 * (1 - Math.exp(-1)), 1e-6, 'RL current at τ = L/R');
  const R = 10, L = 10e-3, C = 1e-6, a = R / (2 * L), wd = Math.sqrt(1 / (L * C) - a * a);
  const rlc = new Netlist([{ type: 'V', a: 'a', b: '0', value: 1 }, { type: 'R', a: 'a', b: 'b', value: R }, { type: 'L', a: 'b', b: 'c', value: L }, { type: 'C', a: 'c', b: '0', value: C }]);
  const tr = rlc.transient(3e-3, 1e-6); let e = 0; tr.t.forEach((t, j) => { e = Math.max(e, Math.abs(tr.v.c[j] - (1 - Math.exp(-a * t) * (Math.cos(wd * t) + a / wd * Math.sin(wd * t))))); });
  assert.ok(e < 2e-4, `underdamped step response error ${e}`);
  const ic = new Netlist([{ type: 'R', a: 'a', b: '0', value: 1e3 }, { type: 'C', id: 'C', a: 'a', b: '0', value: 1e-6, ic: 2 }]);
  close(ic.transient(2e-3, 1e-6).at(1e-3).V('a'), 2 * Math.exp(-1), 1e-5, 'capacitor discharge from ic');
});
test('circuit: AC phasors — RC low-pass and series RLC resonance', () => {
  const lp = new Netlist([{ type: 'V', a: 'in', b: '0', ac: 1 }, { type: 'R', a: 'in', b: 'out', value: 1e3 }, { type: 'C', a: 'out', b: '0', value: 1e-6 }]);
  const fc = 1 / (2 * Math.PI * 1e-3), r = lp.ac(fc); close(r.mag('out'), Math.SQRT1_2, 1e-9, '−3 dB at fc'); close(r.phase('out'), -Math.PI / 4, 1e-9, '−45°');
  const R = 10, L = 10e-3, C = 1e-6, f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
  const s = new Netlist([{ type: 'V', id: 'V', a: 'a', b: '0', value: 1 }, { type: 'R', id: 'R', a: 'a', b: 'b', value: R }, { type: 'L', id: 'L', a: 'b', b: 'c', value: L }, { type: 'C', id: 'C', a: 'c', b: '0', value: C }]);
  const at = s.ac(f0); close(at.imag('R'), 1 / R, 1e-9, '|I| = V/R at f0'); close(at.iphase('R'), 0, 1e-9, 'in phase'); close(at.mag('c'), Math.sqrt(L / C) / R, 1e-6, '|V_C| = Q V');
  const sw = s.sweep(500, 5000, 4001, (res) => res.imag('R')), pk = sw.reduce((a, b) => (b.y > a.y ? b : a)); close(pk.f, f0, 2, 'sweep peak at 1/(2π√LC)');
  const lo = s.ac(f0 / 2); assert.ok(lo.iphase('R') > 0, 'capacitive below resonance: current leads');
  close(at.P('R'), 0.5 * (1 / R) ** 2 * R, 1e-9, 'average power ½|I|²R');
});
test('circuit: diodes (Shockley Newton, ideal) and ideal op-amps (with rails)', () => {
  const D = new Netlist([{ type: 'V', a: 'a', b: '0', value: 5 }, { type: 'D', id: 'D', a: 'a', b: 'b' }, { type: 'R', id: 'R', a: 'b', b: '0', value: 1e3 }]), r = D.dc();
  const vd = 5 - r.V('b'); close(1e-14 * (Math.exp(vd / 0.025852) - 1), r.V('b') / 1e3, 1e-9, 'Shockley equation satisfied'); assert.ok(vd > 0.6 && vd < 0.8);
  const Dr = new Netlist([{ type: 'V', a: 'a', b: '0', value: -5 }, { type: 'D', a: 'a', b: 'b' }, { type: 'R', a: 'b', b: '0', value: 1e3 }]); close(Dr.dc().V('b'), 0, 1e-9, 'reverse biased');
  const Di = new Netlist([{ type: 'V', a: 'a', b: '0', value: 5 }, { type: 'D', id: 'D', a: 'a', b: 'b', model: 'ideal', vf: 0.7 }, { type: 'R', a: 'b', b: '0', value: 1e3 }]);
  close(Di.dc().V('b'), 4.3, 1e-9);
  const amp = new Netlist([{ type: 'V', a: 'in', b: '0', value: 0.5 }, { type: 'R', a: 'in', b: 'm', value: 1e3 }, { type: 'R', a: 'm', b: 'out', value: 4.7e3 }, { type: 'OA', id: 'U', plus: '0', minus: 'm', out: 'out' }, { type: 'R', a: 'out', b: '0', value: 1e4 }]);
  close(amp.dc().V('out'), -2.35, 1e-9, 'inverting gain −R2/R1'); close(amp.dc().V('m'), 0, 1e-9, 'virtual ground');
  amp.part('U').rails = [-2, 2]; close(amp.dc().V('out'), -2, 1e-9, 'saturates at the rail');
  const fol = new Netlist([{ type: 'V', a: 'in', b: '0', value: 1.5 }, { type: 'OA', plus: 'in', minus: 'out', out: 'out' }, { type: 'R', a: 'out', b: '0', value: 100 }]); close(fol.dc().V('out'), 1.5, 1e-9, 'follower');
  const fin = new Netlist([{ type: 'V', a: 'in', b: '0', value: 1 }, { type: 'OA', plus: 'in', minus: 'out', out: 'out', gain: 1e3 }]); close(fin.dc().V('out'), 1e3 / 1001, 1e-9, 'finite gain');
  // half-wave rectifier with smoothing capacitor: output follows the peaks minus a diode drop
  const rect = new Netlist([{ type: 'V', a: 'a', b: '0', wave: { type: 'sine', amp: 5, f: 50 } }, { type: 'D', a: 'a', b: 'b' }, { type: 'R', a: 'b', b: '0', value: 1e4 }, { type: 'C', a: 'b', b: '0', value: 1e-4 }]);
  const tr = rect.transient(0.1, 1e-4), late = Array.from(tr.v.b).slice(600); assert.ok(Math.min(...late) > 4 && Math.max(...late) < 4.5, 'ripple between 4 and 4.5 V');
});
test('circuit: helpers', () => {
  assert.equal(si(1e3, 'Ω'), '1 kΩ'); assert.equal(si(100e-6, 'F'), '100 µF'); assert.equal(si(-0.0035, 'A'), '−3.5 mA'); assert.equal(si(0, 'V'), '0 V');
  assert.equal(waveAt({ type: 'step', v0: 0, v1: 3, t0: 1 }, 0.5), 0); assert.equal(waveAt({ type: 'step', v0: 0, v1: 3, t0: 1 }, 1.5), 3);
  close(waveAt({ type: 'sine', amp: 2, f: 1 }, 0.25), 2, 1e-12); assert.equal(waveAt({ type: 'pulse', v0: 0, v1: 1, period: 1, duty: 0.25 }, 0.6), 0);
});
