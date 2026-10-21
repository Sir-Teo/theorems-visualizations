import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeState, decodeState, stateURL, StateRegistry, MAX_STATE_TOKEN } from '../assets/js/share-state.js';

test('share codec round trips Unicode, exact doubles and custom graph data without aliasing live state', () => {
  const graph = { nodes: [{ id: 'α', x: Math.PI, y: -0.0000000000001 }], edges: [], note: '<script>inert text</script>' };
  const registry = new StateRegistry(); registry.register('custom', 'graph', { get: () => graph, valid: () => true, set() {} });
  const snapshot = registry.capture(); graph.nodes[0].x = 9;
  assert.equal(snapshot.parts[0][1].nodes[0].x, Math.PI);
  const token = encodeState(snapshot); assert.match(token, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeState(token), snapshot);
  assert.equal(decodeState(token).parts[0][1].nodes[0].y, -1e-13);
});

test('version, encoding, size, complex values and prototype keys are rejected', () => {
  for (const token of ['', '?a', 'abc=', 'a'.repeat(MAX_STATE_TOKEN + 1), btoa('{'), btoa('{"v":9,"parts":[]}'), btoa('{"v":1,"parts":[],"__proto__":{}}'), '_w']) assert.throws(() => decodeState(token));
  for (const value of [Infinity, NaN, undefined, () => 1, new Date(), new Float64Array([1]), 'x'.repeat(4097)]) assert.throws(() => encodeState({ v: 1, parts: [['custom:sample:0', value]] }));
  const tooLarge = { v: 1, parts: [['custom:many:0', Array.from({ length: 10 }, () => 'a'.repeat(3000))]] };
  assert.throws(() => encodeState(tooLarge), /too large/);
  let deep = 0; for (let i = 0; i < 15; i++) deep = [deep];
  assert.throws(() => encodeState({ v: 1, parts: [['deep', deep]] }), /complex/);
  assert.throws(() => encodeState({ v: 1, parts: [['x', 1], ['x', 2]] }), /repeated/);
});

test('registry validates the complete schema before replay and uses runtime order despite input reordering', () => {
  const calls = [], registry = new StateRegistry(); let model = 2;
  registry.register('handle', 'point', { order: 10, get: () => [model, 3], valid: x => Array.isArray(x), set: x => calls.push(['handle', model, x]) });
  registry.register('slider', 'scale', { get: () => model, valid: x => typeof x === 'number' && x >= 0 && x <= 10, set: x => { model = x; calls.push(['scale', model]); } });
  const state = registry.capture(); state.parts[1][1] = 7; state.parts.reverse(); registry.restore(state);
  assert.deepEqual(calls, [['scale', 7], ['handle', 7, [2, 3]]]);
  calls.length = 0; state.parts[0][1] = 99;
  assert.throws(() => registry.restore(state), /invalid visualization value/); assert.deepEqual(calls, []);
  assert.throws(() => registry.restore({ v: 1, parts: [] }), /no longer match/);
  assert.throws(() => registry.restore({ v: 1, parts: [['other', 3], ['no', 4]] }), /no longer match/);
});

test('share and embed URLs preserve the item and token while setting the outer embed query', () => {
  const state = { v: 1, parts: [['slider:λ:0', Math.SQRT2]] };
  const normal = new URL(stateURL('https://example.org/atlas/?embed=1#/map?q=abc', 'mech-1.6', state));
  assert.equal(normal.search, ''); assert.match(normal.hash, /^#\/t\/mech-1.6\?s=/);
  const embedded = new URL(stateURL(normal.href, 'mech-1.6', state, true));
  assert.equal(embedded.searchParams.get('embed'), '1');
  assert.equal(embedded.hash, normal.hash);
  const token = new URLSearchParams(normal.hash.split('?')[1]).get('s');
  assert.deepEqual(decodeState(token), { ...state, item: 'mech-1.6' });
});
