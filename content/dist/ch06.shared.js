// Pure finite models for DIST 6. Protocol guarantees and their scopes live in ch06.js.
export function integer(x, lo, hi, label = 'integer') {
  if (!Number.isInteger(x) || x < lo || x > hi) throw new Error(`${label} must be an integer in [${lo}, ${hi}].`);
  return x;
}
export function bits(value, min = 1, max = 8) {
  const a = typeof value === 'string' ? value.trim().split(/[\s,]+/).filter(Boolean).map(Number) : value;
  if (!Array.isArray(a) || a.length < min || a.length > max || Array.from({ length: a.length }, (_, i) => a[i]).some(x => x !== 0 && x !== 1)) throw new Error(`Enter ${min}–${max} bits, each 0 or 1.`);
  return [...a];
}
export function ids(value, n, max = n) {
  const a = typeof value === 'string' ? value.trim().split(/[\s,]+/).filter(Boolean).map(Number) : value;
  if (!Array.isArray(a) || a.length > max || Array.from({ length: a.length }, (_, i) => a[i]).some(x => !Number.isInteger(x) || x < 0 || x >= n) || new Set(a).size !== a.length) throw new Error(`Use at most ${max} distinct process IDs from 0 to ${n - 1}; blank means none.`);
  return [...a].sort((a, b) => a - b);
}
export const majority = a => a.filter(x => x === 1).length > a.length / 2 ? 1 : 0;
export function seededBit(seed, ...address) {
  integer(seed, 0, 1000000, 'seed'); let z = (seed ^ 0x9e3779b9) >>> 0;
  for (const k of address) { z = Math.imul(z ^ (k + 1), 0x85ebca6b) >>> 0; z ^= z >>> 13; }
  return (z >>> 7) & 1;
}
function lie(mode, seed, sender, receiver, round, path = []) {
  if (mode === 'zero') return 0;
  if (mode === 'one') return 1;
  if (mode === 'split') return receiver % 2;
  if (mode === 'omit') return 0; // missing/invalid oral messages have the public default 0
  if (mode !== 'seeded') throw new Error('Unknown Byzantine policy.');
  return seededBit(seed, sender, receiver, round, ...path);
}
export function oralOne({ n = 4, faulty = 0, order = 1, sends = '1 0 1', relays = '0 1 0', rule = 'majority' } = {}) {
  integer(n, 3, 4, 'process count'); integer(faulty, -1, n - 1, 'faulty process'); integer(order, 0, 1, 'order');
  const first = bits(sends, 3, 3), falseRelay = bits(relays, 3, 3);
  if (!['direct', 'majority'].includes(rule)) throw new Error('Unknown decision rule.');
  const direct = Array.from({ length: n }, (_, i) => i === 0 ? order : faulty === 0 ? first[i - 1] : order);
  const inbox = Array.from({ length: n }, () => []), decisions = [order];
  for (let i = 1; i < n; i++) {
    inbox[i] = Array.from({ length: n - 1 }, (_, k) => { const j = k + 1; return j === i ? direct[i] : j === faulty ? falseRelay[i - 1] : direct[j]; });
    decisions[i] = rule === 'direct' ? direct[i] : majority(inbox[i]);
  }
  const correct = Array.from({ length: n - 1 }, (_, i) => i + 1).filter(i => i !== faulty);
  return { n, faulty, order, direct, inbox, decisions, correct, agreement: new Set(correct.map(i => decisions[i])).size <= 1, validity: faulty === 0 ? null : correct.every(i => decisions[i] === order) };
}
export function hexagon(input = '0 0 0 1 1 1') {
  const a = bits(input, 6, 6), forced = a.map((x, i) => x === a[(i + 1) % 6] ? x : null);
  // Each edge is a possible honest pair; its complement is simulated by the third identity.
  const zeroEdge = forced.indexOf(0), oneEdge = forced.indexOf(1);
  return { inputs: a, identities: [0, 1, 2, 0, 1, 2], forced, zeroEdge, oneEdge, contradiction: zeroEdge >= 0 && oneEdge >= 0 };
}
export function eig({ input = '1 1 0 0', f = 1, faults = '2', mode = 'split', seed = 7 } = {}) {
  const initial = bits(input, 3, 7), n = initial.length; integer(f, 0, Math.min(2, n - 1), 'fault bound'); integer(seed, 0, 1000000, 'seed');
  const bad = ids(faults, n, f), correct = initial.map((_, i) => i).filter(i => !bad.includes(i));
  const levels = [[[]]], raw = initial.map(x => ({ '': x })); let deliveries = 0;
  for (let d = 1; d <= f + 1; d++) {
    const paths = []; for (const p of levels[d - 1]) for (let j = 0; j < n; j++) if (!p.includes(j)) paths.push([...p, j]); levels.push(paths);
    for (const p of paths) {
      const j = p.at(-1), key = p.join(','), prefix = p.slice(0, -1).join(',');
      for (let i = 0; i < n; i++) raw[i][key] = bad.includes(j) ? lie(mode, seed, j, i, d, p.slice(0, -1)) : raw[j][prefix];
      deliveries += n - 1;
    }
  }
  const resolved = raw.map(a => ({ ...a })), frames = [];
  for (let d = 0; d <= f + 1; d++) frames.push({ line: d === 0 ? 1 : 2, phase: 'receive', depth: d });
  for (let d = f; d >= 0; d--) {
    for (const p of levels[d]) for (let i = 0; i < n; i++) resolved[i][p.join(',')] = majority(Array.from({ length: n }, (_, j) => j).filter(j => !p.includes(j)).map(j => resolved[i][[...p, j].join(',')]));
    frames.push({ line: 3, phase: 'resolve', depth: d });
  }
  const decisions = resolved.map(x => x['']), allPaths = levels.flat(), goodEnding = allPaths.filter(p => p.length && !bad.includes(p.at(-1)));
  return { n, f, bad, correct, initial, levels, raw, resolved, decisions, frames, deliveries, nodes: allPaths.length,
    agreement: new Set(correct.map(i => decisions[i])).size === 1,
    validity: new Set(correct.map(i => initial[i])).size === 1 ? correct.every(i => decisions[i] === initial[correct[0]]) : null,
    commonGood: goodEnding.every(p => new Set(correct.map(i => resolved[i][p.join(',')])).size === 1),
    preservesGood: goodEnding.every(p => correct.every(i => raw[i][p.join(',')] === resolved[i][p.join(',')])) };
}
export function phaseKing({ input = '0 1 1 0', f = 1, faults = '0', mode = 'seeded', seed = 19, kings } = {}) {
  const initial = bits(input, 3, 8), n = initial.length; integer(f, 0, Math.min(2, n - 1), 'fault bound'); integer(seed, 0, 1000000, 'seed');
  const bad = ids(faults, n, f), correct = initial.map((_, i) => i).filter(i => !bad.includes(i));
  const order = kings === undefined ? Array.from({ length: f + 1 }, (_, i) => i) : ids(kings, n, f + 1);
  if (order.length !== f + 1) throw new Error('Use f+1 distinct kings.');
  let pref = [...initial]; const phases = [], frames = [{ line: 1, phase: -1, round: 0, pref: [...pref] }];
  order.forEach((king, phase) => {
    const before = [...pref], received = pref.map((_, i) => pref.map((x, j) => bad.includes(j) ? lie(mode, seed, j, i, 3 * phase + 1) : x));
    const C = received.map(a => [0, 1].map(b => Number(a.filter(x => x === b).length >= n - f)));
    frames.push({ line: 2, phase, round: 1, pref: [...pref], received, C });
    const endorsements = pref.map((_, i) => pref.map((_, j) => bad.includes(j) ? [0, 1].map(b => lie(mode, seed, j, i, 3 * phase + 2, [b])) : [...C[j]]));
    const D = endorsements.map(a => [0, 1].map(b => a.reduce((s, c) => s + c[b], 0)));
    pref = D.map(a => Number(a[1] > f)); const provisional = [...pref];
    frames.push({ line: 3, phase, round: 2, pref: [...pref], C, D });
    const kingSays = pref.map((_, i) => bad.includes(king) ? lie(mode, seed, king, i, 3 * phase + 3) : pref[king]);
    const keep = pref.map((x, i) => D[i][x] >= n - f);
    pref = pref.map((x, i) => keep[i] ? x : kingSays[i]);
    const record = { king, before, received, C, endorsements, D, provisional, kingSays, keep, after: [...pref], honestKing: !bad.includes(king), agreement: new Set(correct.map(i => pref[i])).size === 1 };
    phases.push(record); frames.push({ line: 4, phase, round: 3, pref: [...pref], ...record });
  });
  return { initial, n, f, bad, correct, phases, frames, decisions: pref, agreement: new Set(correct.map(i => pref[i])).size === 1, validity: new Set(correct.map(i => initial[i])).size === 1 ? correct.every(i => pref[i] === initial[correct[0]]) : null };
}
export function edges(text, n) {
  if (typeof text !== 'string') throw new Error('Enter undirected edges such as 0-1 1-2.');
  const out = [], seen = new Set();
  for (const token of text.trim().split(/[\s,]+/).filter(Boolean)) {
    if (!/^\d+-\d+$/.test(token)) throw new Error('Each edge must look like 0-1.');
    const e = token.split('-').map(Number).sort((a, b) => a - b); e.forEach(i => integer(i, 0, n - 1, 'endpoint'));
    if (e[0] === e[1]) throw new Error('Self-edges are not used.');
    const key = e.join('-'); if (seen.has(key)) throw new Error('Use each undirected edge once.'); seen.add(key); out.push(e);
  }
  return out;
}
function components(n, es, cut) {
  const gone = new Set(cut), comps = [];
  for (let i = 0; i < n; i++) if (!gone.has(i)) { const q = [i]; gone.add(i); for (let k = 0; k < q.length; k++) for (const [a, b] of es) { const j = a === q[k] ? b : b === q[k] ? a : -1; if (j >= 0 && !gone.has(j)) { gone.add(j); q.push(j); } } comps.push(q); }
  return comps;
}
export function graphModel({ n = 5, edgeText = '0-1 0-2 0-3 1-2 1-3 1-4 2-3 2-4 3-4', source = 0, target = 4, faults = '2', bit = 1 } = {}) {
  integer(n, 3, 7, 'vertices'); integer(source, 0, n - 1, 'source'); integer(target, 0, n - 1, 'target'); integer(bit, 0, 1, 'bit');
  if (source === target) throw new Error('Choose distinct terminals.');
  const es = edges(edgeText, n), bad = ids(faults, n);
  if (bad.includes(source) || bad.includes(target)) throw new Error('The channel experiment requires honest terminals.');
  const cuts = Array.from({ length: 1 << n }, (_, mask) => Array.from({ length: n }, (_, i) => i).filter(i => mask & (1 << i))).sort((a, b) => a.length - b.length || a.join(',').localeCompare(b.join(',')));
  const cut = cuts.find(c => c.length <= n - 2 && components(n, es, c).length > 1);
  const kappa = cut ? cut.length : n - 1;
  const paths = []; function dfs(p) { const u = p.at(-1); if (u === target) { paths.push(p); return; } for (const [a, b] of es) { const v = a === u ? b : b === u ? a : -1; if (v >= 0 && !p.includes(v)) dfs([...p, v]); } } dfs([source]);
  // Dynamic programming over the at-most-five internal vertices, not a greedy path packing.
  const dp = new Map([[0, []]]); const direct = [];
  for (const p of paths) {
    const mask = p.slice(1, -1).reduce((m, i) => m | (1 << i), 0);
    if (mask === 0) { direct.push(p); continue; }
    for (const [used, selected] of [...dp]) if (!(used & mask)) { const next = used | mask, choice = [...selected, p]; if (!dp.has(next) || dp.get(next).length < choice.length) dp.set(next, choice); }
  }
  const packed = [...direct, ...[...dp.values()].sort((a, b) => b.length - a.length)[0]], reports = packed.map(p => p.slice(1, -1).some(i => bad.includes(i)) ? 1 - bit : bit);
  return { n, es, source, target, bad, bit, kappa, cut: cut || [], components: cut ? components(n, es, cut) : [], paths: packed, reports, received: reports.length ? majority(reports) : null, guaranteedChannel: packed.length > 2 * bad.length };
}
export function quorum({ n = 4, f = 1, A = '0 1 2', B = '1 2 3', faults = '1' } = {}) {
  integer(n, 3, 10, 'processes'); integer(f, 0, n - 1, 'fault bound'); const a = ids(A, n), b = ids(B, n), bad = ids(faults, n, f);
  const overlap = a.filter(i => b.includes(i)), honest = overlap.filter(i => !bad.includes(i));
  return { n, f, A: a, B: b, bad, overlap, honest, lower: Math.max(0, a.length + b.length - n), guaranteed: a.length + b.length - n > f };
}

export function signedBroadcast({ n = 5, f = 2, faultySender = true, mode = 'withhold', input = 1, strict = true, early = false } = {}) {
  integer(n, 3, 8, 'processes'); integer(f, 0, n - 1, 'fault bound'); integer(input, 0, 1, 'sender input');
  if (![true, false].includes(faultySender) || ![true, false].includes(strict) || ![true, false].includes(early)) throw new Error('Protocol switches must be boolean.');
  if (!['withhold', 'split', 'late-short', 'wrong-session', 'forged'].includes(mode)) throw new Error('Unknown signed-message attack.');
  const bad = Array.from({ length: f }, (_, i) => faultySender ? i : n - 1 - i), correct = Array.from({ length: n }, (_, i) => i).filter(i => !bad.includes(i));
  const sets = Array.from({ length: n }, () => new Set()), issued = new Set(), queue = [], history = [], frames = [], deadline = early ? Math.max(1, f) : f + 1;
  const key = m => `${m.session}:${m.bit}:${m.signers.join(',')}`;
  const sign = (m, i) => { const a = { ...m, signers: [...m.signers, i] }; if (!bad.includes(i)) issued.add(key(a)); return a; };
  const send = (m, round, to = correct) => { for (const i of to) queue.push({ round, to: i, message: { ...m, signers: [...m.signers] } }); };
  const root = { bit: input, session: 'current', signers: [] };
  if (!bad.includes(0)) { sets[0].add(input); send(sign(root, 0), 1); }
  else {
    send(sign(root, 0), 1, mode === 'split' ? correct.filter(i => i % 2) : correct);
    const other = { bit: 1 - input, session: mode === 'wrong-session' ? 'previous' : 'current', signers: [] };
    let attack = other;
    for (const i of mode === 'split' || mode === 'late-short' || mode === 'wrong-session' ? [0] : bad) attack = sign(attack, i);
    if (mode === 'forged') attack = { ...attack, signers: [...attack.signers, correct.at(-1)] }; // deliberately absent from the ideal issuance ledger
    const round = mode === 'split' ? 1 : mode === 'withhold' ? Math.max(1, f) : f + 1;
    send(attack, round, mode === 'split' ? correct.filter(i => !(i % 2)) : correct.slice(0, 1));
  }
  frames.push({ line: 1, round: 0, sets: sets.map(s => [...s]), deliveries: [], issued: issued.size });
  for (let round = 1; round <= deadline; round++) {
    const deliveries = [];
    for (const ev of queue.filter(e => e.round === round)) {
      const m = ev.message, j = ev.to;
      let reason = m.session !== 'current' ? 'wrong session' : m.signers[0] !== 0 || new Set(m.signers).size !== m.signers.length ? 'invalid signer chain' : null;
      if (!reason && m.signers.some((i, k) => !bad.includes(i) && !issued.has(key({ ...m, signers: m.signers.slice(0, k + 1) })))) reason = 'unissued honest signature';
      if (!reason && (strict ? m.signers.length !== round : m.signers.length > round)) reason = 'signature count does not match round';
      const fresh = !reason && !sets[j].has(m.bit);
      if (fresh) {
        sets[j].add(m.bit);
        if (round < deadline && !m.signers.includes(j)) send(sign(m, j), round + 1);
      }
      deliveries.push({ to: j, ...m, accepted: !reason, fresh, reason });
    }
    history.push(...deliveries.map(d => ({ ...d, round })));
    frames.push({ line: 2, round, sets: sets.map(s => [...s].sort()), deliveries, issued: issued.size });
  }
  const decisions = sets.map(s => s.size === 1 ? [...s][0] : 0);
  return { n, f, bad, correct, input, strict, early, mode, deadline, frames, history, sets: sets.map(s => [...s].sort()), decisions, agreement: new Set(correct.map(i => decisions[i])).size === 1, validity: bad.includes(0) ? null : correct.every(i => decisions[i] === input) };
}
function slot(primary, pp, faulty, prepareLies, commitLies, isolated) {
  const n = 4, backups = [0, 1, 2, 3].filter(i => i !== primary), correct = [0, 1, 2, 3].filter(i => i !== faulty);
  const prepares = Array.from({ length: n }, (_, i) => backups.filter(j => i !== isolated || i === j).map(j => ({ sender: j, value: j === faulty ? prepareLies[i] : pp[j] })));
  const prepared = prepares.map((a, i) => a.filter(m => m.value === pp[i]).length >= 2);
  const certificates = prepares.map((a, i) => prepared[i] ? { primary, value: pp[i], signers: a.filter(m => m.value === pp[i]).map(m => m.sender) } : null);
  const commits = Array.from({ length: n }, (_, i) => [0, 1, 2, 3].filter(j => (i !== isolated || i === j) && (j === faulty || prepared[j])).map(j => ({ sender: j, value: j === faulty ? commitLies[i] : pp[j] })));
  const committed = correct.filter(i => prepared[i] && commits[i].filter(m => m.value === pp[i]).length >= 3);
  return { primary, pp, prepares, prepared, certificates, commits, committed, values: committed.map(i => pp[i]) };
}
export function pbft({ faulty = 0, input = 1, proposals = '0 0 1 1', prepareLies = '0 1 0 1', commitLies = '0 1 0 1', isolated = -1, reports = '0 1 2', replacement = 1, violate = false } = {}) {
  integer(faulty, -1, 3, 'faulty replica'); integer(input, 0, 1, 'request'); integer(isolated, -1, 3, 'isolated receiver'); integer(replacement, 0, 1, 'new-view proposal');
  if (![true, false].includes(violate)) throw new Error('New-view switch must be boolean.');
  const pp = bits(proposals, 4, 4), pl = bits(prepareLies, 4, 4), cl = bits(commitLies, 4, 4), vc = ids(reports, 4, 3);
  if (vc.length !== 3) throw new Error('A new view requires three distinct view-change reports.');
  const first = slot(0, faulty === 0 ? pp : [input, input, input, input], faulty, pl, cl, isolated);
  // A faulty reporter withholds its certificate. Honest reporters include their actual prepared certificate.
  const carried = vc.filter(i => i !== faulty && first.certificates[i]).map(i => ({ reporter: i, view: 0, ...first.certificates[i] }));
  const choices = [...new Set(carried.map(c => c.value))];
  if (choices.length > 1) throw new Error('Inconsistent old prepared certificates.');
  const required = choices.length ? choices[0] : null;
  const proposed = violate ? replacement : required ?? replacement, accepted = required === null || proposed === required;
  // No carried proof: use a fresh request at the next sequence after the low watermark.
  // This single-slot model has no higher prepared slot requiring a null-filled hole.
  const second = accepted ? slot(1, [proposed, proposed, proposed, proposed], faulty, pl, cl, -1) : null;
  const frames = [
    { line: 1, phase: 'pre-prepare', view: 0, slot: first },
    { line: 2, phase: 'prepare', view: 0, slot: first },
    { line: 3, phase: 'commit', view: 0, slot: first },
    { line: 4, phase: 'view-change', view: 1, slot: first },
    { line: 5, phase: accepted ? 'new prepare' : 'reject new view', view: 1, slot: second },
    { line: 6, phase: accepted ? 'new commit' : 'no new commit', view: 1, slot: second },
  ];
  return { faulty, input, first, second, vc, carried, required, proposed, accepted, frames, agreement: new Set([...first.values, ...(second?.values || [])]).size <= 1, replyThreshold: 2 };
}
const logAdd = (a, b) => a === -Infinity ? b : b === -Infinity ? a : Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b)));
function logFactorial(n) { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; }
export function probabilityFromLog(log) {
  if (log === -Infinity) return { value: 0, log, text: '0' };
  if (!Number.isFinite(log) || log > 1e-12) throw new Error('Invalid probability logarithm.');
  log = Math.min(0, log); const value = Math.exp(log), e = Math.floor(log / Math.LN10), m = Math.exp(log - e * Math.LN10);
  return { value, log, text: log > Math.log(1e-4) ? Number(value.toPrecision(6)).toString() : `${Number(m.toPrecision(5))}e${e}` };
}
export function miningRisk(q, z, horizon = 40) {
  if (typeof q !== 'number' || !Number.isFinite(q) || q < 0 || q > 1) throw new Error('Hash share must be a finite number in [0,1].');
  integer(z, 0, 30, 'deficit'); integer(horizon, 0, 100, 'block horizon');
  const lq = Math.log(q), lp = Math.log1p(-q), lr = lq - lp;
  const fixedLog = z === 0 || q >= .5 ? 0 : q === 0 ? -Infinity : z * lr;
  let poissonLog, exactLog;
  if (z === 0 || q >= .5) poissonLog = exactLog = 0;
  else if (q === 0) poissonLog = exactLog = -Infinity;
  else {
    const lambda = z * q / (1 - q), ll = Math.log(z) + lr; poissonLog = -Infinity;
    for (let k = 0; k <= z + 200; k++) poissonLog = logAdd(poissonLog, -lambda + k * ll - logFactorial(k) + (k < z ? (z - k) * lr : 0));
    exactLog = -Infinity;
    // Exact stopping-time model: 2 Pr[Binomial(2z−1,q) >= z].
    const m = 2 * z - 1;
    for (let k = z; k <= m; k++) exactLog = logAdd(exactLog, logFactorial(m) - logFactorial(k) - logFactorial(m - k) + k * lq + (m - k) * lp);
    exactLog += Math.LN2;
  }
  let dp = new Map([[z, 0]]), hit = z === 0 ? 0 : -Infinity; if (z === 0) dp.clear();
  for (let t = 0; t < horizon; t++) {
    const next = new Map();
    for (const [d, logMass] of dp) {
      if (d === 1) hit = logAdd(hit, logMass + lq); else next.set(d - 1, logAdd(next.get(d - 1) ?? -Infinity, logMass + lq));
      next.set(d + 1, logAdd(next.get(d + 1) ?? -Infinity, logMass + lp));
    }
    dp = next;
  }
  return { q, z, horizon, fixed: probabilityFromLog(fixedLog), poisson: probabilityFromLog(poissonLog), exact: probabilityFromLog(exactLog), finite: probabilityFromLog(hit) };
}
export function blockTree(events = 'H H A H A A R H H') {
  if (typeof events !== 'string') throw new Error('Enter H, A and R events.');
  const ops = events.trim().toUpperCase().split(/[\s,]+/).filter(Boolean);
  if (ops.length > 60 || ops.some(s => !['H', 'A', 'R'].includes(s))) throw new Error('Use at most 60 events: H honest block, A private block, R release.');
  const nodes = [{ id: 0, parent: null, miner: 'G', work: 0, visible: true }], frames = [{ line: 1, index: 0, nodes: nodes.map(x => ({ ...x })), publicTip: 0, privateTip: 0 }];
  let publicTip = 0, privateTip = 0;
  ops.forEach((op, index) => {
    if (op === 'R') { for (const b of nodes) b.visible = true; for (const b of nodes) if (b.work > nodes[publicTip].work) publicTip = b.id; }
    else { const parent = op === 'H' ? publicTip : privateTip, id = nodes.length; nodes.push({ id, parent, miner: op, work: nodes[parent].work + 1, visible: op === 'H' }); if (op === 'H') publicTip = id; else privateTip = id; }
    frames.push({ line: op === 'H' ? 2 : op === 'A' ? 3 : 4, index: index + 1, event: op, nodes: nodes.map(x => ({ ...x })), publicTip, privateTip });
  });
  return { ops, frames, nodes, publicTip, privateTip };
}
export function miningEvents(q, seed, count = 24) {
  if (!Number.isFinite(q) || q < 0 || q > 1) throw new Error('Hash share must be in [0,1].'); integer(seed, 0, 1000000, 'seed'); integer(count, 1, 60, 'event count');
  let state = (seed + 1) >>> 0; return Array.from({ length: count }, (_, i) => { if (i % 8 === 7) return 'R'; state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 < q ? 'A' : 'H'; }).join(' ');
}
