import * as H from './ch06.shared.js';
const stage = (v, title, height = 280) => v.stage({ title, x: [0, 1], y: [0, 1], axes: false, full: true, height });
const text = (s, value, x, y, color = 'ink', size = 12) => s.textPx(String(value), x, y, { color, size, align: 'center', baseline: 'middle' });
function fit(s, h) { if (Math.abs(s.height - h) > .5) { s.o.aspect = h / s.width; s.resize(); s.begin(); } }
function input(v, label, value) {
  let c; c = v.input(label, value, { width: '100%', onChange: () => c.change?.() });
  Object.assign(c.el.style, { flexBasis: '240px', minWidth: '0', flexDirection: 'column', alignItems: 'stretch' });
  Object.assign(c.el.querySelector('input').style, { minWidth: '0', flexBasis: 'auto' }); c.el.querySelector('.ctl-label').style.whiteSpace = 'normal'; return c;
}
function choice(v, label, options, value) { let c; c = v.select(label, options, value, { onChange: () => c.change?.() }); return c; }
function slider(v, label, lo, hi, value) { let c; c = v.slider(label, lo, hi, value, { int: true, step: 1, fmt: String, onChange: () => c.change?.() }); return c; }
function number(value, lo, hi, label) { if (!String(value).trim()) throw new Error(`${label} cannot be blank.`); const x = Number(value); if (!Number.isFinite(x) || x < lo || x > hi) throw new Error(`${label} must be between ${lo} and ${hi}.`); return x; }
function fail(s, r) { if (!r?.error) return false; fit(s, 90); text(s, 'Input needs correction', s.width / 2, 40, 'red'); return true; }
function cached(cs, build) { let previous, r; return () => { const key = cs.map(c => c.value).join('\0'); if (key !== previous || !r) { previous = key; try { r = build(); } catch (e) { r = { error: e.message }; } } return r; }; }
function player(v, cs, build, code, title) {
  let run; const S = v.steps({ frames: () => { try { run = build(); return run.frames; } catch (e) { run = { error: e.message }; return [{ line: 1 }]; } }, code, codeTitle: title, codePos: 'below', start: 0, still: 'end', note: false });
  Object.assign(S.codeEl.style, { overflow: 'visible', minHeight: 'max-content', height: 'auto', flexShrink: '0' });
  for (const el of S.codeEl.querySelectorAll('.ln > span:last-child')) { el.style.whiteSpace = 'pre-wrap'; el.style.overflowWrap = 'anywhere'; }
  for (const c of cs) c.change = () => S.reset(undefined, { at: 'start' });
  return { S, get run() { return run; } };
}
function line(v, s, a, b, color = 'grid', width = 1, dashed = false) { const c = s.ctx; c.strokeStyle = v.color(color); c.lineWidth = width; c.setLineDash(dashed ? [4, 3] : []); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); c.setLineDash([]); }
function circle(v, s, p, label, color = 'accent', radius = 15, fill = true) { const c = s.ctx; c.beginPath(); c.arc(p[0], p[1], radius, 0, Math.PI * 2); if (fill) { c.fillStyle = v.color('bg'); c.fill(); } c.strokeStyle = v.color(color); c.lineWidth = 2; c.stroke(); if (label !== '') text(s, label, ...p, color, 11); }
function rows(v, s, labels, data, colors = []) {
  fit(s, 56 + 34 * data.length); const w = (s.width - 24) / labels.length;
  labels.forEach((a, j) => text(s, a, 12 + (j + .5) * w, 24, 'muted', 10));
  data.forEach((a, i) => { line(v, s, [12, 40 + i * 34], [s.width - 12, 40 + i * 34]); a.forEach((x, j) => text(s, x, 12 + (j + .5) * w, 57 + i * 34, colors[i] || 'ink', 11)); });
}
function status(s, data) { fit(s, 24 + data.length * 52); data.forEach(([a, b, color], i) => { text(s, a, s.width / 2, 25 + 52 * i, 'muted', 11); text(s, b, s.width / 2, 45 + 52 * i, color || 'accent', 13); }); }
const yes = b => b === null ? 'not applicable' : b ? 'yes' : 'NO';
const set = a => a.length ? `{${a.join(',')}}` : '∅';
const policy = v => choice(v, 'Byzantine policy', ['split', 'seeded', 'zero', 'one', 'omit'], 'split');

function oralControls(v, paper = false) {
  const n = slider(v, 'processes', 3, 4, 4), faulty = slider(v, 'faulty ID (−1 means none)', -1, 3, paper ? 3 : 0), order = slider(v, 'honest commander order', 0, 1, 1);
  const sends = input(v, 'faulty commander: orders to 1, 2, 3', '1 0 1'), relays = input(v, 'faulty lieutenant: reports to 1, 2, 3', '0 0 0');
  const rule = choice(v, 'decision rule', ['direct', 'majority'], 'majority');
  const build = () => H.oralOne({ n: n.value, faulty: faulty.value, order: order.value, sends: sends.value, relays: relays.value, rule: rule.value });
  return { cs: [n, faulty, order, sends, relays, rule], build };
}
function oralDraw(v, s, r, round) {
  fit(s, 270); const top = [s.width / 2, 40], bottom = Array.from({ length: r.n - 1 }, (_, i) => [35 + i * (s.width - 70) / (r.n - 2), 160]);
  if (round >= 1) bottom.forEach((p, i) => { line(v, s, top, p, r.faulty === 0 ? 'red' : 'accent', 2); text(s, r.direct[i + 1], (top[0] + p[0]) / 2 + (p[0] < top[0] ? -12 : 12), 95, 'ink'); });
  circle(v, s, top, 'C:0', r.faulty === 0 ? 'red' : 'accent', 23);
  bottom.forEach((p, i) => { const j = i + 1; circle(v, s, p, j, r.faulty === j ? 'red' : 'accent', 17); text(s, r.faulty === j ? 'faulty' : 'correct', p[0], 193, r.faulty === j ? 'red' : 'muted', 10); if (round >= 3) text(s, `decide ${r.decisions[j]}`, p[0], 224, r.faulty === j ? 'muted' : 'green', 11); });
}
export function definitionWidget(v) {
  const C = oralControls(v), get = cached(C.cs, C.build), s = stage(v, 'Commander orders and recipient decisions'), t = stage(v, 'One report per lieutenant');
  v.render(() => { const r = get(); if (fail(s, r)) { fail(t, r); return; } oralDraw(v, s, r, 3); rows(v, t, ['observer', 'reports', 'decision'], r.inbox.slice(1).map((a, i) => [i + 1, a.join(' · '), r.decisions[i + 1]]), r.inbox.slice(1).map((_, i) => i + 1 === r.faulty ? 'red' : 'ink')); });
  v.readout(() => { const r = get(); return r.error || `Correct recipients ${set(r.correct)}. Agreement: ${yes(r.agreement)}. Honest-sender validity: ${yes(r.validity)}. Only correct recipients are checked. Three-general majority forwarding can violate validity even when it happens to agree; a single observed success is not a universal guarantee.`; });
}
export function lowerBoundWidget(v) {
  const bits = input(v, 'inputs around A B C A′ B′ C′', '0 0 0 1 1 1'), selected = slider(v, 'honest adjacent pair', 0, 5, 1), get = cached([bits], () => H.hexagon(bits.value));
  const s = stage(v, 'Six copies: conditional proof obligations'), t = stage(v, 'The selected real three-process interpretation');
  v.render(() => { const r = get(); if (fail(s, r)) { fail(t, r); return; } fit(s, 310); const names = ['A', 'B', 'C', 'A′', 'B′', 'C′'], rad = Math.min(96, (s.width - 80) / 2), p = r.inputs.map((_, i) => [s.width / 2 + rad * Math.cos(-Math.PI / 2 + i * Math.PI / 3), 150 + rad * Math.sin(-Math.PI / 2 + i * Math.PI / 3)]);
    p.forEach((a, i) => line(v, s, a, p[(i + 1) % 6], i === selected.value ? 'gold' : 'accent', i === selected.value ? 4 : 1));
    p.forEach((a, i) => { circle(v, s, a, names[i], 'accent', 18); const direction = a[0] < s.width / 2 ? -1 : a[0] > s.width / 2 ? 1 : 0; text(s, r.inputs[i], a[0] + direction * 29, a[1] + (direction ? 0 : i === 0 ? -32 : 32), r.inputs[i] ? 'orange' : 'green', 13); });
    const i = selected.value, j = (i + 1) % 6, bad = 3 - r.identities[i] - r.identities[j]; status(t, [['honest pair', `${names[i]} and ${names[j]}`], ['third identity simulates four copies', ['A', 'B', 'C'][bad]], ['agreement obligation', 'both outputs must be equal'], ['validity forces', r.forced[i] === null ? 'no value for this pair' : `both outputs = ${r.forced[i]}`, r.forced[i] === null ? 'muted' : 'gold']]); });
  v.readout(() => { const r = get(); return r.error || `Adjacent equal-input pairs force ${r.forced.filter(x => x !== null).join(', ') || 'no fixed value'}. Every adjacent pair must agree under the assumed protocol. ${r.contradiction ? 'The ring therefore forces both 0 and 1: contradiction.' : 'These chosen inputs do not yield both opposite validity obligations.'} These are logical constraints from an assumed correct protocol, not simulated decision outputs.`; });
}
export function eigWidget(v) {
  const initial = input(v, 'initial bits (3–7 processes)', '1 1 0 0'), f = slider(v, 'fault bound f', 0, 2, 1), faults = input(v, 'faulty IDs', '2'), mode = policy(v), seed = slider(v, 'message seed', 0, 100, 7);
  const observer = slider(v, 'observer ID', 0, 6, 0), prefix = input(v, 'tree path to inspect (blank = root)', '2');
  const s = stage(v, 'A prefix and its possible next reporters'), t = stage(v, 'Correct processes resolve the same root');
  const P = player(v, [initial, f, faults, mode, seed], () => H.eig({ input: initial.value, f: f.value, faults: faults.value, mode: mode.value, seed: seed.value }), ['initialize each local root with its input', 'receive each distinct-ID path from its last reporter', 'resolve each internal node by strict majority; ties give 0'], 'EIG: receive, then resolve');
  const inspect = () => { try { const r = P.run; if (r.error) return r; H.integer(observer.value, 0, r.n - 1, 'observer'); const p = H.ids(prefix.value, r.n, r.f + 1); // preserve typed path order after validation
    const ordered = prefix.value.trim().split(/[\s,]+/).filter(Boolean).map(Number); return { r, p: ordered, validatedLength: p.length }; } catch (e) { return { error: e.message }; } };
  v.render(() => { const a = inspect(); if (fail(s, a)) { fail(t, a); return; } const { r, p } = a, frame = P.S.frame, o = observer.value, paths = [p, ...Array.from({ length: r.n }, (_, j) => j).filter(j => !p.includes(j) && p.length < r.f + 1).map(j => [...p, j])];
    const visibleRaw = path => path.length <= (frame.phase === 'receive' ? frame.depth : r.f + 1);
    const visibleNew = path => path.length === r.f + 1 && visibleRaw(path) || frame.phase === 'resolve' && path.length >= frame.depth;
    const children = paths.slice(1), h = Math.max(190, 75 + 43 * children.length), left = [48, h / 2 + 10], right = s.width - 95;
    fit(s, h); text(s, 'received → resolved', s.width / 2, 19, 'muted', 11);
    const value = path => `${visibleRaw(path) ? r.raw[o][path.join(',')] : '–'}→${visibleNew(path) ? r.resolved[o][path.join(',')] : '–'}`;
    children.forEach((path, j) => { const at = [right, 58 + 43 * j]; line(v, s, [left[0] + 21, left[1]], [at[0] - 21, at[1]], path.length && r.bad.includes(path.at(-1)) ? 'red' : 'grid'); });
    circle(v, s, left, value(p), p.length && r.bad.includes(p.at(-1)) ? 'red' : 'accent', 21); text(s, p.length ? p.join('→') : 'root', left[0], left[1] - 34, 'muted', 10);
    children.forEach((path, j) => { const at = [right, 58 + 43 * j]; circle(v, s, at, value(path), r.bad.includes(path.at(-1)) ? 'red' : 'accent', 21); text(s, path.join('→'), s.width - 35, at[1], 'muted', 10); });
    if (!children.length) text(s, 'leaf: no next reporter', s.width - 92, h / 2 + 10, 'muted', 11);
    rows(v, t, ['ID', 'input', 'root'], r.initial.map((x, i) => [i, x, frame.phase === 'resolve' && frame.depth === 0 ? r.decisions[i] : '—']), r.initial.map((_, i) => r.bad.includes(i) ? 'red' : 'ink')); });
  v.readout(() => { const a = inspect(); if (a.error) return a.error; const r = a.r, fr = P.S.frame; return `${fr.phase === 'receive' ? `Receive round ${fr.depth}` : `Resolve depth ${fr.depth}`}. ${r.nodes} stored nodes per observer; ${r.deliveries} scalar network deliveries in the full run. n > 3f: ${yes(r.n > 3 * r.f)}. Final correct decisions ${r.correct.map(i => `${i}:${r.decisions[i]}`).join(', ')}; agreement ${yes(r.agreement)}, unanimity validity ${yes(r.validity)}. Correct-ending nodes common: ${yes(r.commonGood)}; their raw values preserved: ${yes(r.preservesGood)}. The tree shows the inspected path and its immediate children.`; });
}
export function kingWidget(v) {
  const initial = input(v, 'initial preferences (3–8 bits)', '0 1 1 0'), f = slider(v, 'fault bound f', 0, 2, 1), faults = input(v, 'faulty IDs', '0'), mode = policy(v), seed = slider(v, 'message seed', 0, 100, 19);
  const s = stage(v, 'Endorsements before the king speaks'), t = stage(v, 'Preference after this protocol round');
  const P = player(v, [initial, f, faults, mode, seed], () => H.phaseKing({ input: initial.value, f: f.value, faults: faults.value, mode: mode.value, seed: seed.value }), ['start with the supplied preferences', 'endorse b when at least n−f proposals equal b', 'count endorsements; prefer 1 exactly when D¹ > f', 'keep if strongly endorsed; otherwise follow the king'], 'Three rounds per phase');
  v.render(() => { const r = P.run; if (fail(s, r)) { fail(t, r); return; } const fr = P.S.frame, p = fr.phase < 0 ? null : r.phases[fr.phase]; rows(v, s, ['ID', 'C⁰', 'C¹', 'D⁰', 'D¹'], r.initial.map((_, i) => [i, fr.round >= 1 ? p.C[i][0] : '—', fr.round >= 1 ? p.C[i][1] : '—', fr.round >= 2 ? p.D[i][0] : '—', fr.round >= 2 ? p.D[i][1] : '—']), r.initial.map((_, i) => r.bad.includes(i) ? 'red' : 'ink'));
    rows(v, t, ['ID', 'preference', 'king action'], r.initial.map((_, i) => [i, fr.pref[i], fr.round === 3 ? p.keep[i] ? 'keep' : `take ${p.kingSays[i]}` : 'pending']), r.initial.map((_, i) => r.bad.includes(i) ? 'red' : 'accent')); });
  v.readout(() => { const r = P.run; if (r.error) return r.error; const fr = P.S.frame; return `${fr.phase < 0 ? 'Initial state' : `Phase ${fr.phase + 1}, round ${fr.round}, king ${r.phases[fr.phase].king} (${r.phases[fr.phase].honestKing ? 'correct' : 'faulty'})`}. Thresholds n−f=${r.n - r.f}, more than f=${r.f}. n > 3f: ${yes(r.n > 3 * r.f)}. Complete run: agreement ${yes(r.agreement)}, unanimity validity ${yes(r.validity)}. Honest-king phases: ${r.phases.filter(p => p.honestKing).map(p => `${p.king}: agreement ${yes(p.agreement)}`).join('; ') || 'none'}. Red rows are faulty and are excluded from correctness checks.`; });
}
export function connectivityWidget(v) {
  const n = slider(v, 'vertices', 3, 7, 5), es = input(v, 'undirected edges', '0-1 0-2 0-3 1-2 1-3 1-4 2-3 2-4 3-4'), from = slider(v, 'source', 0, 6, 0), to = slider(v, 'target', 0, 6, 4), faults = input(v, 'faulty internal IDs', '2'), bit = slider(v, 'sent bit', 0, 1, 1), selected = slider(v, 'highlight path index', 0, 5, 0);
  const get = cached([n, es, from, to, faults, bit], () => H.graphModel({ n: n.value, edgeText: es.value, source: from.value, target: to.value, faults: faults.value, bit: bit.value })), s = stage(v, 'Minimum cut and selected disjoint route'), t = stage(v, 'One vote per internally disjoint path');
  v.render(() => { const r = get(); if (fail(s, r)) { fail(t, r); return; } fit(s, 300); const rad = Math.min(104, (s.width - 60) / 2), p = Array.from({ length: r.n }, (_, i) => [s.width / 2 + rad * Math.cos(2 * Math.PI * i / r.n - Math.PI / 2), 150 + rad * Math.sin(2 * Math.PI * i / r.n - Math.PI / 2)]);
    r.es.forEach(([a, b]) => line(v, s, p[a], p[b])); const route = r.paths[selected.value]; if (route) route.slice(1).forEach((b, i) => line(v, s, p[route[i]], p[b], 'gold', 4));
    p.forEach((a, i) => { if (r.cut.includes(i)) circle(v, s, a, '', 'orange', 23, false); circle(v, s, a, i, r.bad.includes(i) ? 'red' : i === r.source || i === r.target ? 'green' : 'accent', 16); });
    rows(v, t, ['route', 'IDs', 'report'], r.paths.map((p, i) => [i, p.join('→'), r.reports[i]]), r.paths.map((p, i) => r.reports[i] === r.bit ? 'green' : 'red')); });
  v.readout(() => { const r = get(); return r.error || `Vertex connectivity κ=${r.kappa}${r.cut.length || r.components.length ? `; minimum cut ${set(r.cut)}, remaining components ${r.components.map(set).join(' | ')}` : '; complete graph convention κ=n−1'}. ${r.paths.length} internally disjoint selected-terminal paths. Reports [${r.reports.join(',')}], majority ${r.received === null ? 'unavailable' : r.received}. More than 2f paths for f=${r.bad.length}: ${yes(r.guaranteedChannel)}. The global consensus premises with that fault budget are ${r.n > 3 * r.bad.length && r.kappa > 2 * r.bad.length ? 'satisfied' : 'not satisfied'}. Gold highlights the selected route; orange rings mark the cut.`; });
}
export function signedWidget(v) {
  const n = slider(v, 'processes', 3, 8, 5), f = slider(v, 'fault bound f', 0, 7, 2), sender = choice(v, 'sender', ['faulty', 'honest'], 'faulty'), order = slider(v, 'sender input', 0, 1, 1);
  const attack = choice(v, 'attack', ['withhold', 'split', 'late-short', 'wrong-session', 'forged'], 'withhold'), rule = choice(v, 'chain length', ['check round', 'accept short'], 'check round'), stop = choice(v, 'deadline', ['f+1 rounds', 'stop at f'], 'f+1 rounds'), packet = slider(v, 'packet index in this round', 0, 127, 0);
  const s = stage(v, 'Accepted values at each correct process'), t = stage(v, 'Inspect a delivered signature chain');
  const P = player(v, [n, f, sender, order, attack, rule, stop], () => H.signedBroadcast({ n: n.value, f: f.value, faultySender: sender.value === 'faulty', input: order.value, mode: attack.value, strict: rule.value === 'check round', early: stop.value === 'stop at f' }), ['sender signs the input for this session', 'verify chain and round; accept new values and forward'], 'Signed broadcast with a deadline');
  v.render(() => { const r = P.run; if (fail(s, r)) { fail(t, r); return; } const fr = P.S.frame; rows(v, s, ['ID', 'set', 'decision'], fr.sets.map((a, i) => [i, r.bad.includes(i) ? 'faulty' : set(a), r.bad.includes(i) || fr.round < r.deadline ? '—' : r.decisions[i]]), fr.sets.map((_, i) => r.bad.includes(i) ? 'red' : 'accent'));
    const m = fr.deliveries[packet.value]; if (!m) { status(t, [['receive round', fr.round], ['selected packet', 'no packet at this index'], ['packets in this round', fr.deliveries.length]]); return; }
    fit(t, 100 + m.signers.length * 38); text(t, `bit ${m.bit} → process ${m.to}`, t.width / 2, 22, 'ink'); text(t, m.session === 'current' ? 'current session' : 'previous session', t.width / 2, 43, m.session === 'current' ? 'muted' : 'red', 11);
    m.signers.forEach((i, j) => { const y = 76 + 38 * j; if (j) line(v, t, [t.width / 2, y - 23], [t.width / 2, y - 15], 'grid'); circle(v, t, [t.width / 2, y], i, r.bad.includes(i) ? 'red' : 'green', 13); }); text(t, m.accepted ? m.fresh ? 'accepted new value' : 'already known' : 'rejected', t.width / 2, t.height - 18, m.accepted ? 'green' : 'red', 12); });
  v.readout(() => { const r = P.run; if (r.error) return r.error; const fr = P.S.frame, m = fr.deliveries[packet.value]; return `Round ${fr.round}/${r.deadline}; faulty IDs ${set(r.bad)}. ${fr.deliveries.filter(m => m.accepted).length} accepted packets, ${fr.deliveries.filter(m => !m.accepted).length} rejected. ${m ? `Selected packet: ${m.reason || (m.fresh ? 'new authenticated value' : 'duplicate value')}. ` : ''}Final correct decisions ${r.correct.map(i => `${i}:${r.decisions[i]}`).join(', ')}. Agreement ${yes(r.agreement)}, honest-sender validity ${yes(r.validity)}. ${r.strict && !r.early ? 'The declared protocol checks both signature count and deadline.' : 'A protocol hypothesis has deliberately been removed.'} Signatures are ideal issuance records, not real cryptography.`; });
}
export function quorumWidget(v) {
  const n = slider(v, 'processes', 3, 10, 4), f = slider(v, 'fault bound', 0, 9, 1), A = input(v, 'quorum A IDs', '0 1 2'), B = input(v, 'quorum B IDs', '1 2 3'), bad = input(v, 'faulty IDs', '1');
  const get = cached([n, f, A, B, bad], () => H.quorum({ n: n.value, f: f.value, A: A.value, B: B.value, faults: bad.value })), s = stage(v, 'Every identity appears exactly once'), t = stage(v, 'Actual overlap and worst-case guarantee');
  v.render(() => { const r = get(); if (fail(s, r)) { fail(t, r); return; } const groups = [r.A.filter(i => !r.B.includes(i)), r.overlap, r.B.filter(i => !r.A.includes(i)), Array.from({ length: r.n }, (_, i) => i).filter(i => !r.A.includes(i) && !r.B.includes(i))];
    fit(s, 360); ['A only', 'A ∩ B', 'B only', 'neither'].forEach((label, j) => { const y = 40 + 85 * j; text(s, label, s.width / 2, y, 'muted', 11); const width = (s.width - 24) / Math.max(1, groups[j].length); groups[j].forEach((i, k) => circle(v, s, [12 + (k + .5) * width, y + 32], i, r.bad.includes(i) ? 'red' : j === 1 ? 'green' : 'accent', Math.min(13, width / 2 - 2))); if (!groups[j].length) text(s, '∅', s.width / 2, y + 32, 'muted'); });
    status(t, [['intersection lower bound', r.lower], ['actual overlap', r.overlap.length], ['actual honest overlap', r.honest.length, r.honest.length ? 'green' : 'red'], ['honest overlap forced for any ≤ f faults', yes(r.guaranteed), r.guaranteed ? 'green' : 'orange']]); });
  v.readout(() => { const r = get(); return r.error || `|A|=${r.A.length}, |B|=${r.B.length}, n=${r.n}, f=${r.f}. Inclusion–exclusion guarantees at least max(0, |A|+|B|−n)=${r.lower} common identities. Actual honest intersection ${set(r.honest)}. An honest signer prevents conflicting certificates only if the protocol forbids its conflicting votes in that context; changing views needs an additional carry-forward rule.`; });
}
export function pbftWidget(v) {
  const bad = slider(v, 'faulty replica (−1 means none)', -1, 3, 0), order = slider(v, 'honest primary request', 0, 1, 1), pp = input(v, 'faulty primary proposals to 0,1,2,3', '0 0 1 1'), prepare = input(v, 'faulty backup prepares to 0,1,2,3', '0 1 0 1'), commit = input(v, 'faulty commits to 0,1,2,3', '0 1 0 1'), isolated = slider(v, 'isolated receiver in view 0 (−1 none)', -1, 3, -1), reports = input(v, 'three view-change reporter IDs', '0 1 2'), replacement = slider(v, 'replacement request', 0, 1, 0), rule = choice(v, 'new primary proposal', ['carry certificate', 'try replacement'], 'carry certificate');
  const s = stage(v, 'A sequence number through two views'), t = stage(v, 'Certificate evidence at each replica');
  const P = player(v, [bad, order, pp, prepare, commit, isolated, reports, replacement, rule], () => H.pbft({ faulty: bad.value, input: order.value, proposals: pp.value, prepareLies: prepare.value, commitLies: commit.value, isolated: isolated.value, reports: reports.value, replacement: replacement.value, violate: rule.value === 'try replacement' }), ['primary sends a pre-prepare for one request', 'prepared = pre-prepare + two backup prepares', 'commit locally when prepared + three commits', 'collect three view-change reports and their proofs', 'verify the carried value before the new prepare', 'collect new commits; execute only with a certificate'], 'PBFT: one sequence, one view change');
  v.render(() => { const r = P.run; if (fail(s, r)) { fail(t, r); return; } const fr = P.S.frame, slot = fr.slot; if (!slot) status(s, [['view and phase', `${fr.view} · ${fr.phase}`], ['carried prepared value', r.required ?? 'none'], ['conflicting proposal', r.proposed, 'red']]);
    else {
      fit(s, 355); const X = i => 28 + i * (s.width - 56) / 3, step = P.S.i, showPrep = step >= 1, showCommit = step === 2 || step === 3 || step === 5;
      text(s, `view ${fr.view} · primary ${slot.primary}`, s.width / 2, 18, 'muted', 11);
      [0, 1, 2, 3].forEach(i => { text(s, `P${i}`, X(i), 43, i === r.faulty ? 'red' : 'ink', 11); line(v, s, [X(slot.primary), 52], [X(i), 77], 'accent'); circle(v, s, [X(i), 90], slot.pp[i], i === r.faulty ? 'red' : 'accent', 12); });
      text(s, 'pre-prepare digest', s.width / 2, 117, 'muted', 10);
      if(showPrep) slot.prepares.forEach((inbox,i)=>inbox.forEach(m=>line(v,s,[X(m.sender),139],[X(i),177],m.sender===r.faulty?'red':'grid',1)));
      [0,1,2,3].forEach(i=>circle(v,s,[X(i),190],showPrep?slot.prepared[i]?'P':'–':'?',i===r.faulty?'red':showPrep&&slot.prepared[i]?'green':'muted',12));
      text(s, 'P = prepared certificate', s.width / 2, 217, 'muted', 10);
      if(showCommit)slot.commits.forEach((inbox,i)=>inbox.forEach(m=>line(v,s,[X(m.sender),239],[X(i),277],m.sender===r.faulty?'red':'grid',1)));
      [0,1,2,3].forEach(i=>circle(v,s,[X(i),290],showCommit&&slot.committed.includes(i)?slot.pp[i]:'–',i===r.faulty?'red':showCommit&&slot.committed.includes(i)?'green':'muted',12));
      text(s, 'committed correct decisions', s.width / 2, 322, 'muted', 10);
    }
    if (!slot) { status(t, [['valid new-view evidence', 'missing for this proposal'], ['new decisions', 'none']]); return; }
    const step = P.S.i, prepareVisible = step >= 1, commitVisible = step === 2 || step === 3 || step === 5;
    rows(v, t, ['ID', 'digest', 'prepares', 'commits'], [0, 1, 2, 3].map(i => [i, slot.pp[i], prepareVisible ? slot.prepares[i].filter(m => m.value === slot.pp[i]).map(m => m.sender).join('') || '—' : '—', commitVisible ? slot.commits[i].filter(m => m.value === slot.pp[i]).map(m => m.sender).join('') || '—' : '—']), [0, 1, 2, 3].map(i => i === r.faulty ? 'red' : commitVisible && slot.committed.includes(i) ? 'green' : 'ink')); });
  v.readout(() => { const r = P.run; if (r.error) return r.error; return `View 0 locally committed correct replicas ${set(r.first.committed)}; values ${set([...new Set(r.first.values)])}. View-change reports ${set(r.vc)} carry ${r.carried.map(c => `${c.reporter}: digest ${c.value}, prepares ${set(c.signers)}`).join('; ') || 'no prepared certificate'}. New proposal ${r.proposed} is ${r.accepted ? 'accepted' : 'rejected'}. View 1 committed correct replicas ${set(r.second?.committed || [])}. Agreement across both views: ${yes(r.agreement)}. IDs in a certificate are counted once; the primary does not send a prepare. Clients need two matching replies, a separate threshold from the three-commit replica certificate.`; });
}
export function miningWidget(v) {
  const q = input(v, 'attacker discovery share q', '0.1'), z = slider(v, 'fixed deficit / honest confirmations z', 0, 30, 6), horizon = slider(v, 'finite discovery horizon', 0, 100, 40), events = input(v, 'H = honest, A = private, R = release', 'H H A H A A R H H');
  const s = stage(v, 'Actual parents in a fixed-work block tree'), t = stage(v, 'Four different probability questions'), u = stage(v, 'Log probability against starting deficit');
  const risk = cached([q, z, horizon], () => H.miningRisk(number(q.value, 0, 1, 'hash share'), z.value, horizon.value));
  const P = player(v, [events], () => H.blockTree(events.value), ['start from a public genesis block', 'honest miner extends the current public tip', 'attacker extends its private tip', 'release private blocks; switch only for more work'], 'A deterministic block-discovery trace');
  v.render(() => { const r = P.run, p = risk(); if (fail(s, r)) { fail(t, r); fail(u, r); return; } const fr = P.S.frame, depth = Math.max(...fr.nodes.map(b => b.work)); fit(s, 74 + depth * 38); const pos = b => [s.width * (b.miner === 'G' ? .5 : b.miner === 'H' ? .28 : .72), 35 + b.work * 38];
    fr.nodes.slice(1).forEach(b => line(v, s, pos(fr.nodes[b.parent]), pos(b), b.visible ? 'grid' : 'red', 1, !b.visible));
    fr.nodes.forEach(b => { if (b.id === fr.publicTip) circle(v, s, pos(b), '', 'green', 17, false); circle(v, s, pos(b), b.id, b.miner === 'A' ? 'red' : 'accent', 11); });
    if (fail(t, p)) { fail(u, p); return; } status(t, [['eventual catch-up from a fixed deficit', p.fixed.text], [`catch-up within ${p.horizon} discoveries`, p.finite.text], ['Poisson confirmation approximation', p.poisson.text], ['exact stopping-time confirmation model', p.exact.text]]);
    fit(u, 275); const curve = Array.from({ length: 13 }, (_, d) => H.miningRisk(p.q, d, 0)), maxLog = Math.ceil(Math.max(1, ...curve.flatMap(a => [a.fixed, a.poisson, a.exact].filter(b => Number.isFinite(b.log)).map(b => -b.log / Math.LN10)))), X = d => 45 + d / 12 * (u.width - 65), Y = a => 45 + (-a.log / Math.LN10) / maxLog * 170;
    line(v, u, [45, 40], [45, 215], 'muted'); line(v, u, [45, 215], [u.width - 20, 215], 'muted'); text(u, '1', 23, 45, 'muted', 10); text(u, `10^−${Math.ceil(maxLog)}`, u.width / 2, 257, 'muted', 10);
    [['fixed', 'accent'], ['poisson', 'orange'], ['exact', 'green']].forEach(([name, color], j) => { text(u, ['fixed', 'Poisson', 'exact'][j], (j + .5) * u.width / 3, 20, color, 10); for (let d = 1; d < curve.length; d++) if (Number.isFinite(curve[d - 1][name].log) && Number.isFinite(curve[d][name].log)) line(v, u, [X(d - 1), Y(curve[d - 1][name])], [X(d), Y(curve[d][name])], color, 2); curve.forEach((a,d)=>{if(Number.isFinite(a[name].log)){const c=u.ctx;c.beginPath();c.arc(X(d),Y(a[name]),2,0,Math.PI*2);c.fillStyle=v.color(color);c.fill();}}); });
    [0, 3, 6, 9, 12].forEach(d => text(u, d, X(d), 232, 'muted', 10)); });
  v.readout(() => { const r = P.run, p = risk(); if (r.error || p.error) return r.error || p.error; const fr = P.S.frame; return `Event ${fr.index}/${r.ops.length}; public tip ${fr.publicTip} has work ${fr.nodes[fr.publicTip].work}, private tip ${fr.privateTip} has work ${fr.nodes[fr.privateTip].work}. Every block adds one work unit; the green ring is the chosen public tip. The separate probability model uses q=${p.q}, z=${p.z}; a tie counts as catch-up. The log plot covers z=0…12; its lower scale is 10 to the displayed negative exponent. Zero probabilities have no finite log point. Confirmations use concurrent attacker progress and therefore differ from a known fixed deficit. The editable trace is not a random sample or a network-security proof.`; });
}
export function paperWidget(v) {
  const C = oralControls(v, true), s = stage(v, 'Reconstruct OM(1) with three or four generals'), t = stage(v, 'The lieutenant report vectors');
  const P = player(v, C.cs, () => ({ ...C.build(), frames: [{ round: 0, line: 1 }, { round: 1, line: 2 }, { round: 2, line: 3 }, { round: 3, line: 4 }] }), ['choose the commander order and faulty reports', 'commander sends a direct order to each lieutenant', 'lieutenants relay what they heard, or lie if faulty', 'apply the selected rule to each local report vector'], 'Original oral-message experiment');
  v.render(() => { const r = P.run; if (fail(s, r)) { fail(t, r); return; } const round = P.S.frame.round; oralDraw(v, s, r, round); rows(v, t, ['observer', 'own order', 'all reports'], r.inbox.slice(1).map((a, i) => [i + 1, round >= 1 ? r.direct[i + 1] : '—', round >= 2 ? a.join(' · ') : '—']), r.inbox.slice(1).map((_, i) => i + 1 === r.faulty ? 'red' : 'ink')); });
  v.readout(() => { const r = P.run; return r.error || `Stage ${P.S.frame.round}/3. Complete run: correct recipients ${set(r.correct)}, agreement ${yes(r.agreement)}, honest-sender validity ${yes(r.validity)}. With n=4 and majority, these are OM(1)'s two cases. With n=3, a failed rule illustrates the obstruction; the general impossibility needs the separate local-view proof. Paper figures 1–2: printed385; OM(1) and figures3–4: printed388–389.`; });
}
