import assert from 'node:assert/strict';
import {test} from 'node:test';
import {flagSpec, explore} from '../content/dist/ch04.shared.js';

test('Dijkstra permits a delayed assignment after another process enters', () => {
  const spec = flagSpec(2), state = spec.init();
  // P1 reads b[0] while P0 is outside. Its subsequent write is delayed.
  for (let step = 0; step < 6; step++) spec.step(state, 1);
  assert.equal(spec.lines[state.pc[1]], '    k ← i; goto Li1');
  assert.equal(state.sh.k, 0);
  for (let step = 0; step < 5; step++) spec.step(state, 0);
  assert.equal(spec.reg(state, 0), 'C');
  spec.step(state, 1);
  assert.equal(state.sh.k, 1);
  assert.equal(spec.reg(state, 0), 'C');
  // P1 must still inspect c[0]; changing k does not authorize entry.
  for (let step = 0; step < 3; step++) spec.step(state, 1);
  assert.equal(spec.reg(state, 1), 'T');
  assert.equal(state.pc[1], 2);
});

test('All reachable two/three-process states preserve exclusion for every initial owner', () => {
  for (const n of [2, 3]) for (let initial = 0; initial < n; initial++) {
    const spec = flagSpec(n), init = spec.init;
    spec.init = () => { const state = init(); state.sh.k = initial; return state; };
    const result = explore(spec, {limit: 200000});
    assert.equal(result.capped, false, `N=${n}, initial k=${initial}`);
    assert.equal(result.bad, -1);
    assert.equal(result.dead, -1);
    assert.equal(result.solo, -1);
    assert.ok(result.count > (n === 2 ? 500 : 50000));
  }
});

test('The same explorer finds the intended naive-protocol counterexamples', () => {
  const flags = explore(flagSpec(2, 'flags'));
  const look = explore(flagSpec(2, 'look'));
  assert.equal(flags.bad, -1);
  assert.ok(flags.dead >= 0);
  assert.ok(look.bad >= 0);
});
