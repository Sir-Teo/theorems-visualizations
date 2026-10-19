import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mna, NETS, solveNet } from '../content/circ/ch03.shared.js';

test('maximum-transfer series-model efficiency need not equal original-network efficiency', () => {
  // A permanently connected shunt across an ideal source does not change its
  // Thevenin equivalent, but consumes power invisible to that one-port model.
  const els = [
    { t: 'V', a: 1, b: 0, v: 10 },
    { t: 'R', a: 1, b: 2, r: .1 },
    { t: 'R', a: 1, b: 0, r: .1 },
    { t: 'R', a: 2, b: 0, r: .1 },
  ];
  const r = mna(2, els), load = r.cur[3] ** 2 * .1;
  const input = -10 * r.cur[0];
  assert.ok(Math.abs(load - 250) < 1e-10); // mW: V, mA, kohm convention
  assert.ok(Math.abs(load / input - 1 / 6) < 1e-12);
  assert.equal(.1 / (.1 + .1), .5, 'the equivalent series model still has 50% efficiency');
});

test('reciprocity is an independently calculable two-port equality and needs a unique solution', () => {
  const base = [
    { t: 'R', a: 1, b: 3, r: 1 },
    { t: 'R', a: 3, b: 0, r: 2 },
    { t: 'R', a: 2, b: 3, r: 3 },
  ];
  const drive = (port, g = 0) => mna(3, [...base,
    { t: 'G', a: 0, b: 2, cp: 1, cn: 0, g },
    { t: 'I', a: 0, b: port, i: 1 },
  ]);
  // A unit open-circuit excitation has transfer resistance exactly Rb=2.
  assert.ok(Math.abs(drive(1).v[2] - 2) < 1e-12);
  assert.ok(Math.abs(drive(2).v[1] - 2) < 1e-12);
  assert.ok(Math.abs(drive(1, .1).v[2] - drive(2, .1).v[1]) > .1);
  // Rank-one feedback makes det(G-g*b*a^T)=0 at g=1/z_AB=1/2.
  assert.equal(drive(1, .5).singular, true);
});

test('Thomson energy gap equals circulation dissipation for positive resistor networks', () => {
  const edges = NETS.bridge.edges, loops = [[1, -1, 0, 0, 1], [0, 0, 1, -1, -1]];
  const div = current => Array.from({ length: 4 }, (_, n) => edges.reduce((s, [a, b], k) => s + (a === n ? current[k] : 0) - (b === n ? current[k] : 0), 0));
  for (const loop of loops) assert.deepEqual(div(loop), [0, 0, 0, 0]);
  for (const R of [[1, 1, 1, 1, 1], [.4, 1.1, 2.3, .7, 1.9]]) {
    const phi = solveNet(4, edges.map(([a, b], k) => ({ a, b, g: 1 / R[k] })), [4, 0, 0, -4], 0);
    const trueFlow = edges.map(([a, b], k) => (phi[a] - phi[b]) / R[k]);
    const power = flow => flow.reduce((s, x, k) => s + R[k] * x * x, 0);
    for (const [x, y] of [[0, 0], [1.2, -.9], [-3, 2], [.001, -.002]]) {
      const d = loops[0].map((a, k) => x * a + y * loops[1][k]);
      const trial = trueFlow.map((a, k) => a + d[k]);
      assert.ok(Math.max(...div(trial).map((a, k) => Math.abs(a - [4, 0, 0, -4][k]))) < 1e-12);
      assert.ok(Math.abs(power(trial) - power(trueFlow) - power(d)) < 1e-11);
      assert.ok(power(trial) >= power(trueFlow) - 1e-12);
    }
  }
});
