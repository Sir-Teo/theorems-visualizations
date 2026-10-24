import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/dist/ch06.shared.js';
const vector = (code, n) => Array.from({ length: n }, (_, i) => code >> i & 1);
const subset = (code, n) => Array.from({ length: n }, (_, i) => i).filter(i => code & 1 << i);
const near = (a, b, tol = 1e-12) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test('OM(1) covers both four-general cases and exposes three-general rule failures', () => {
  for (let faulty = -1; faulty < 4; faulty++) for (let order = 0; order < 2; order++) for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) {
    const r = H.oralOne({ n: 4, faulty, order, sends: vector(a, 3), relays: vector(b, 3) });
    const correct = [1, 2, 3].filter(i => i !== faulty), decisions = correct.map(i => Number(r.inbox[i].reduce((s, b) => s + b, 0) >= 2));
    assert.equal(new Set(decisions).size, 1); if (faulty !== 0) assert(decisions.every(x => x === order));
  }
  const invalid = H.oralOne({ n: 3, faulty: 2, order: 1, relays: '0 0 0' }); assert.equal(invalid.validity, false);
  const split = H.oralOne({ n: 3, faulty: 0, sends: '0 1 0', rule: 'direct' }); assert.equal(split.agreement, false);
});
test('hexagon constraints distinguish an actual contradiction from unforced inputs', () => {
  for (let mask = 0; mask < 64; mask++) {
    const a = vector(mask, 6), r = H.hexagon(a), forced = a.map((b, i) => b === a[(i + 1) % 6] ? b : null);
    assert.deepEqual(r.forced, forced); assert.equal(r.contradiction, forced.includes(0) && forced.includes(1));
    for (let i = 0; i < 6; i++) assert.notEqual(r.identities[i], r.identities[(i + 1) % 6]);
  }
});
test('EIG raw reports, bottom-up votes and correct-node cover survive adversarial seeds', () => {
  for (const [n, f] of [[3, 0], [4, 1], [5, 1], [7, 2]]) for (let code = 0; code < (n === 7 ? 16 : 1 << n); code++) for (let seed = 0; seed < 12; seed++) {
    const faults = f === 0 ? [] : f === 1 ? [seed % n] : [seed % n, (seed + 2) % n], initial = vector(code, n);
    const r = H.eig({ input: initial, f, faults, mode: 'seeded', seed });
    for (const p of r.levels.flat().filter(a => a.length)) {
      const j = p.at(-1), key = p.join(','), prefix = p.slice(0, -1).join(',');
      if (!faults.includes(j)) for (const i of r.correct) assert.equal(r.raw[i][key], r.raw[j][prefix]);
    }
    for (const i of r.correct) {
      const resolve = p => p.length === f + 1 ? r.raw[i][p.join(',')] : Number(Array.from({ length: n }, (_, j) => j).filter(j => !p.includes(j)).reduce((s, j) => s + resolve([...p, j]), 0) > (n - p.length) / 2);
      assert.equal(r.decisions[i], resolve([]));
    }
    assert(r.agreement); assert(r.commonGood); assert(r.preservesGood); assert.notEqual(r.validity, false);
    let nodes = 1, term = 1; for (let d = 1; d <= f + 1; d++) { term *= n - d + 1; nodes += term; } assert.equal(r.nodes, nodes); assert.equal(r.deliveries, (nodes - 1) * (n - 1));
  }
});
test('EIG does not conceal failures below the resilience threshold', () => {
  let failed = false;
  for (let code = 0; code < 8; code++) for (let seed = 0; seed < 32; seed++) { const r = H.eig({ input: vector(code, 3), f: 1, faults: [0], mode: 'seeded', seed }); failed ||= !r.agreement || r.validity === false; }
  assert(failed);
});
test('phase king records actual endorsement thresholds and honest-king/persistence invariants', () => {
  for (const [n, f, seeds] of [[4, 1, 32], [7, 2, 12]]) for (let code = 0; code < 1 << n; code++) for (let seed = 0; seed < seeds; seed++) {
    const faults = f === 1 ? [seed % n] : [seed % n, (seed + 1) % n], r = H.phaseKing({ input: vector(code, n), f, faults, mode: 'seeded', seed });
    for (const p of r.phases) {
      for (const i of r.correct) for (const b of [0, 1]) {
        assert.equal(p.C[i][b], +(p.received[i].filter(x => x === b).length >= n - f));
        assert.equal(p.D[i][b], p.endorsements[i].reduce((s, pair) => s + pair[b], 0));
      }
      for (const i of r.correct) { assert.equal(p.provisional[i], +(p.D[i][1] > f)); assert.equal(p.after[i], p.D[i][p.provisional[i]] >= n - f ? p.provisional[i] : p.kingSays[i]); }
      if (p.honestKing) assert.equal(new Set(r.correct.map(i => p.after[i])).size, 1);
      if (new Set(r.correct.map(i => p.before[i])).size === 1) assert(r.correct.every(i => p.after[i] === p.before[i]));
    }
    assert(r.agreement); assert.notEqual(r.validity, false);
  }
});
test('vertex path packing matches exhaustive deletion separators on every five-vertex graph', () => {
  const n = 5, possible = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) possible.push([a, b]);
  for (let mask = 0; mask < 1 << possible.length; mask++) {
    const es = possible.filter((_, i) => mask & 1 << i), edgeText = es.map(e => e.join('-')).join(' ');
    for (const [source, target] of [[0, 4], [1, 3]]) {
      const r = H.graphModel({ n, edgeText, source, target, faults: [] });
      const direct = es.some(([a, b]) => a === source && b === target || a === target && b === source);
      const withoutDirect = es.filter(([a, b]) => !(a === source && b === target || a === target && b === source));
      let separator = n;
      for (let cut = 0; cut < 1 << n; cut++) {
        if (cut & 1 << source || cut & 1 << target) continue;
        const seen = new Set([source]), todo = [source]; for (let i = 0; i < todo.length; i++) for (const [a, b] of withoutDirect) { const v = a === todo[i] ? b : b === todo[i] ? a : -1; if (v >= 0 && !(cut & 1 << v) && !seen.has(v)) { seen.add(v); todo.push(v); } }
        if (!seen.has(target)) separator = Math.min(separator, subset(cut, n).length);
      }
      assert.equal(r.paths.length, separator + Number(direct));
      const used = new Set(); for (const p of r.paths) { assert.equal(p[0], source); assert.equal(p.at(-1), target); for (const i of p.slice(1, -1)) { assert(!used.has(i)); used.add(i); } }
    }
  }
});
test('signed broadcast propagates delayed values and rejects forged or wrong-session evidence', () => {
  for (let n = 3; n <= 8; n++) for (let f = 0; f < n; f++) for (const faultySender of [true, false]) for (const mode of ['withhold', 'split', 'late-short', 'wrong-session', 'forged']) for (const input of [0, 1]) {
    const r = H.signedBroadcast({ n, f, faultySender, mode, input });
    assert.equal(new Set(r.correct.map(i => r.sets[i].join(','))).size, 1); assert(r.agreement); assert.notEqual(r.validity, false);
    for (const h of r.history.filter(m => m.accepted)) { assert.equal(h.signers.length, h.round); assert.equal(h.session, 'current'); assert.equal(new Set(h.signers).size, h.signers.length); }
  }
  assert.equal(H.signedBroadcast({ n: 5, f: 2, mode: 'withhold', early: true }).agreement, false);
  assert.equal(H.signedBroadcast({ n: 5, f: 2, mode: 'late-short', strict: false }).agreement, false);
  assert.equal(H.signedBroadcast({ n: 8, f: 1, mode: 'withhold' }).frames[2].deliveries.length, 56);
  assert(H.signedBroadcast({ mode: 'wrong-session' }).history.some(m => m.reason === 'wrong session'));
  assert(H.signedBroadcast({ mode: 'forged' }).history.some(m => m.reason === 'unissued honest signature'));
});
test('all quorum pairs satisfy inclusion–exclusion and the honest-overlap condition', () => {
  for (let n = 3; n <= 6; n++) for (let a = 0; a < 1 << n; a++) for (let b = 0; b < 1 << n; b++) {
    const A = subset(a, n), B = subset(b, n), overlap = A.filter(i => B.includes(i)), f = Math.floor((n - 1) / 3), bad = overlap.slice(0, f), r = H.quorum({ n, f, A, B, faults: bad });
    assert.equal(r.overlap.length, overlap.length); assert(r.overlap.length >= r.lower); if (r.guaranteed) assert(r.honest.length > 0);
  }
  const r = H.quorum({ n: 3, f: 1, A: [0, 1], B: [1, 2], faults: [1] }); assert.equal(r.honest.length, 0); assert.equal(r.guaranteed, false);
});
test('single-slot PBFT carries every committed value through every three-report view change', () => {
  for (let faulty = -1; faulty < 4; faulty++) for (let pp = 0; pp < 16; pp++) for (let lies = 0; lies < 16; lies++) for (let omit = 0; omit < 4; omit++) {
    const reports = [0, 1, 2, 3].filter(i => i !== omit), r = H.pbft({ faulty, proposals: vector(pp, 4), prepareLies: vector(lies, 4), commitLies: vector(lies ^ 15, 4), reports, isolated: pp % 5 - 1, replacement: 0 });
    for (const slot of [r.first, r.second]) if (slot) for (const i of slot.committed) {
      assert.notEqual(i, faulty); assert(slot.prepared[i]); assert(slot.prepares[i].filter(m => m.value === slot.pp[i]).length >= 2); assert(slot.commits[i].filter(m => m.value === slot.pp[i]).length >= 3);
      assert(slot.certificates[i].signers.every(j => j !== slot.primary));
    }
    assert(r.agreement); if (r.first.values.length) { assert.equal(r.required, r.first.values[0]); assert.equal(r.proposed, r.first.values[0]); }
  }
  const r = H.pbft({ faulty: -1, input: 1, violate: true, replacement: 0 }); assert.equal(r.accepted, false); assert.equal(r.second, null);
});
test('mining probabilities distinguish fixed deficit, finite horizon and confirmation timing', () => {
  near(H.miningRisk(.1, 1).fixed.value, 1 / 9); near(H.miningRisk(.1, 1).exact.value, .2);
  near(H.miningRisk(.1, 6).poisson.value, .0002428027453629, 1e-15); near(H.miningRisk(.1, 6).exact.value, .00059141216, 1e-15);
  for (const q of [0, .01, .1, .3, .499, .5, .8, 1]) for (let z = 0; z <= 8; z++) {
    const r = H.miningRisk(q, z, 16); assert(r.finite.value <= r.fixed.value + 1e-12); if (z > 0 && q < .5) assert(r.exact.value >= r.fixed.value - 1e-12);
    let hit = 0;
    for (let code = 0; code < 1 << 12; code++) { let d = z, mass = 1, yes = z === 0; for (let i = 0; i < 12; i++) { const attacker = code >> i & 1; mass *= attacker ? q : 1 - q; d += attacker ? -1 : 1; if (d <= 0) yes = true; } if (yes) hit += mass; }
    near(H.miningRisk(q, z, 12).finite.value, hit, 2e-12);
  }
  const tiny = H.miningRisk(1e-100, 30, 80); assert.equal(tiny.fixed.value, 0); assert(Number.isFinite(tiny.fixed.log)); assert.match(tiny.fixed.text, /e-3000$/); assert.notEqual(tiny.exact.text, '0');
});
test('block trees use actual parent work, explicit publication and stable ties', () => {
  const r = H.blockTree('H A R A R H');
  assert.equal(r.frames[3].publicTip, 1); assert.equal(r.frames[5].publicTip, 3); assert.equal(r.nodes.at(-1).parent, 3);
  for (const f of r.frames) { for (const b of f.nodes.slice(1)) assert.equal(b.work, f.nodes[b.parent].work + 1); assert(f.nodes[f.publicTip].visible); assert.equal(f.nodes[f.publicTip].work, Math.max(...f.nodes.filter(b => b.visible).map(b => b.work))); }
});
test('malformed inputs, duplicate identities and invalid bounds fail explicitly', () => {
  for (const x of ['', '2', 'NaN', Array(4)]) assert.throws(() => H.bits(x));
  for (const x of ['0 0', '4', 'NaN', Array(2)]) assert.throws(() => H.ids(x, 4));
  for (const x of ['0-0', '0-4', '1-2 2-1', 'x']) assert.throws(() => H.edges(x, 4));
  assert.throws(() => H.eig({ faults: [0, 1] })); assert.throws(() => H.signedBroadcast({ n: 3, f: 3 })); assert.throws(() => H.pbft({ reports: [0, 1] })); assert.throws(() => H.graphModel({ faults: [0] })); assert.throws(() => H.miningRisk(NaN, 1)); assert.throws(() => H.blockTree('H?'));
});
test('frozen chapter identities, flags, paper metadata and introduction are preserved', async () => {
  const frozen = JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json', import.meta.url), 'utf8'));
  const a = (await import('../content/dist/ch06.js')).default, b = (await import('../content/dist/ch06-b.js')).default, syllabus = (await import('../content/dist/syllabus.js')).default.chapters.find(c => c.n === 6);
  const items = [...a.items, ...b.items], planned = frozen.chapters.find(c => c.collection === 'dist' && c.chapter === 6); assert.equal(items.length, 10); assert.equal(planned.items.length, items.length);
  for (const item of items) { const old = planned.items.find(i => i.num === item.num); for (const key of ['num', 'name', 'kind', 'verify', 'paper', 'introduces']) assert.deepEqual(item[key], old[key], `${item.num} ${key}`); }
  for (const i of items) { const s = syllabus.items.find(s => s.num === i.num); assert.equal(s.kind, i.kind); assert.equal(s.name, i.name); assert.deepEqual(s.deps, i.deps); assert.equal(typeof i.viz, 'function'); }
  const p = items.find(i => i.num === '6.10'); assert.deepEqual(p.paper, syllabus.items.at(-1).paper); assert.deepEqual(p.introduces, ['dist-6.1']); assert(!items.find(i => i.num === '6.6').deps.includes('crypto-10.1')); assert(frozen);
});
