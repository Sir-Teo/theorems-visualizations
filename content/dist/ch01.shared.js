// Distributed computing — Chapter 1 (models): helpers shared by ch01.js and ch01-b.js.
// Seeded randomness, space-time-diagram drawing, and small pure simulators that the pictures run for real.

/** Seeded generator in [0,1). */
export const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/** Deterministic uniform number in [0,1) from a list of integers (so a message's fate depends only on its identity). */
export const hash01 = (...xs) => { let h = 2166136261; for (const x of xs) { h ^= (Math.floor(x) | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); h ^= h >>> 13; h = Math.imul(h, 2246822519); h ^= h >>> 16; } return ((h >>> 0) % 1000003) / 1000003; };
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + 's'}`;
export const range = (n) => Array.from({ length: n }, (_, i) => i);

/** Lane y-coordinate: process 0 at the top. */
export const ly = (i, n) => n - 1 - i;

/** Distance in px from point (px,py) to segment (a,b) (pixel coordinates). */
export function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1e-9;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Process lanes of a space-time diagram: a horizontal line per process with its name at the left. */
export function drawLanes(s, n, T, o = {}) {
  for (let i = 0; i < n; i++) {
    const y = ly(i, n), dead = o.deadAt && o.deadAt[i] != null ? o.deadAt[i] : null, col = o.laneColor ? o.laneColor(i) : null;
    if (dead == null) s.line(0, y, T, y, { color: col || 'faint', width: 1.6 });
    else { s.line(0, y, dead, y, { color: col || 'faint', width: 1.6 }); s.line(dead, y, T, y, { color: 'red', width: 1.2, dash: [3, 5], alpha: 0.7 }); s.text('✕', dead, y, { color: 'red', size: 17, align: 'center', halo: true }); }
    s.text(o.names ? o.names[i] : `P${i}`, -T * 0.025, y, { align: 'right', size: 13, color: o.nameColor ? o.nameColor(i) || 'ink' : 'ink' });
  }
}

/** One message arrow between lanes; `lost` messages stop short with a red cross. */
export function drawMsg(s, n, m, o = {}) {
  const y1 = ly(m.from, n), y2 = ly(m.to, n), col = o.color || 'accent', frac = o.frac == null ? 1 : o.frac;
  if (m.lost) {
    const f = 0.55, x2 = m.ts + (m.tr - m.ts) * f, yy = y1 + (y2 - y1) * f;
    s.line(m.ts, y1, x2, yy, { color: col, width: o.width || 1.8, dash: [5, 4], alpha: 0.75 });
    s.text('✕', x2, yy, { color: 'red', size: 16, align: 'center', halo: true });
  } else {
    const x2 = m.ts + (m.tr - m.ts) * frac, yy = y1 + (y2 - y1) * frac;
    if (frac >= 1) s.arrow(m.ts, y1, m.tr, y2, { color: col, width: o.width || 2, dash: o.dash });
    else s.line(m.ts, y1, x2, yy, { color: col, width: o.width || 2 });
  }
  if (m.label != null && o.label !== false) {
    const f = m.lost ? 0.3 : 0.72;
    s.text(String(m.label), m.ts + (m.tr - m.ts) * f, y1 + (y2 - y1) * f, { size: 11, color: o.labelColor || col, align: 'center', baseline: 'bottom', dy: -3 });
  }
}

/** Index of the message (from a list with ts,tr,from,to) closest to the stage point (px, py) in pixels, within `tol`. */
export function hitMsg(s, n, msgs, px, py, tol = 9) {
  let best = -1, bd = tol;
  msgs.forEach((m, k) => {
    const d = segDist(px, py, s.X(m.ts), s.Y(ly(m.from, n)), s.X(m.tr), s.Y(ly(m.to, n)));
    if (d < bd) { bd = d; best = k; }
  });
  return best;
}

/** Nearest lane under a data y, or -1. */
export const laneAt = (y, n) => { const i = ly(Math.round(y), n); return Math.abs(y - Math.round(y)) < 0.4 && i >= 0 && i < n ? i : -1; };

// ----------------------------------------------------------------------------- flooding network simulator (1.1)
/**
 * Max-flooding on an undirected graph, with message delays and seeded randomness.
 * adj: {id: [ids]}; inj: [{t, node, x}] spontaneous local events; dmin/dmax: delay range; fifo: keep order per channel.
 * Returns {msgs: [{id, from, to, ts, tr, x}], hist: {id: [[t, value]]}, ev: [{t, node, type}]}.
 */
export function runFlood(adj, inj, { dmin, dmax, fifo, seed }) {
  const ids = Object.keys(adj), val = Object.fromEntries(ids.map((i) => [i, 0])), hist = Object.fromEntries(ids.map((i) => [i, [[0, 0]]]));
  const q = [], msgs = [], cnt = {}, last = {}, ev = [];
  const push = (e) => { q.push(e); q.sort((a, b) => a.t - b.t || a.k - b.k); };
  let k = 0;
  const send = (t, from, to, x) => {
    const key = `${from}>${to}`, c = (cnt[key] = (cnt[key] || 0) + 1);
    let tr = t + dmin + (dmax - dmin) * hash01(seed, +from, +to, c, 17);
    if (fifo) tr = Math.max(tr, (last[key] ?? 0) + 0.01);
    last[key] = tr;
    const m = { id: msgs.length, from, to, ts: t, tr, x }; msgs.push(m); push({ t: tr, k: k++, type: 'recv', m });
  };
  inj.forEach((e) => { if (adj[e.node]) push({ t: e.t, k: k++, type: 'inj', node: e.node, x: e.x }); });
  while (q.length) {
    const e = q.shift();
    if (e.type === 'inj') {
      ev.push({ t: e.t, node: e.node, type: 'local' });
      if (e.x > val[e.node]) { val[e.node] = e.x; hist[e.node].push([e.t, e.x]); for (const w of adj[e.node]) send(e.t, e.node, w, e.x); }
    } else {
      const { m } = e; ev.push({ t: e.t, node: m.to, type: 'recv', m });
      if (m.x > val[m.to]) { val[m.to] = m.x; hist[m.to].push([e.t, m.x]); for (const w of adj[m.to]) if (w !== m.from) send(e.t, m.to, w, m.x); }
    }
  }
  return { msgs, hist, ev, final: val };
}

// ----------------------------------------------------------------------------- Byzantine-style one-round echo (1.3)
/**
 * The 4-process "commander + 3 lieutenants" two-round exchange: P0 sends a value, lieutenants echo what they got, each lieutenant
 * decides the majority of (own direct value, two echoes).  `sent[from][to][round]` gives the value actually put on the wire
 * (null = nothing).  Returns decisions of lieutenants 1..3.
 */
export function decideEcho(recv1, recv2) {
  // recv1[i] = value lieutenant i got from P0 (null -> default 0); recv2[i][j] = value i got from j (null -> 0)
  const out = {};
  for (const i of [1, 2, 3]) {
    const vals = [recv1[i] ?? 0, ...[1, 2, 3].filter((j) => j !== i).map((j) => recv2[i][j] ?? 0)];
    out[i] = vals.filter((x) => x === 1).length >= 2 ? 1 : 0;
  }
  return out;
}

// ----------------------------------------------------------------------------- shared-memory increment (1.4)
/**
 * Programs: each process does `reps` times:  r := x ; x := r + 1  (two steps)  or  FAA (one atomic step).
 * State: {x, pc[i] (steps done), r[i]}.  step(state, i) returns the new state or null if i has finished.
 */
export function incInit(nProc) { return { x: 0, pc: Array(nProc).fill(0), r: Array(nProc).fill(null) }; }
export function incStep(st, i, reps, atomic) {
  const per = atomic ? 1 : 2;
  if (st.pc[i] >= reps * per) return null;
  const ns = { x: st.x, pc: st.pc.slice(), r: st.r.slice() };
  if (atomic) { ns.x += 1; }
  else if (st.pc[i] % 2 === 0) ns.r[i] = st.x;
  else ns.x = st.r[i] + 1;
  ns.pc[i]++;
  return ns;
}
/** Exact histogram of final values of x over all interleavings (counted with memoisation on the state). */
export function incHistogram(nProc, reps, atomic) {
  const memo = new Map();
  const key = (s) => `${s.x}|${s.pc.join(',')}|${s.r.join(',')}`;
  const rec = (s) => {
    const k = key(s); if (memo.has(k)) return memo.get(k);
    const out = new Map(); let any = false;
    for (let i = 0; i < nProc; i++) {
      const ns = incStep(s, i, reps, atomic); if (!ns) continue; any = true;
      for (const [v, c] of rec(ns)) out.set(v, (out.get(v) || 0) + c);
    }
    if (!any) out.set(s.x, 1);
    memo.set(k, out); return out;
  };
  return rec(incInit(nProc));
}

// ----------------------------------------------------------------------------- safety / liveness on lasso words (1.5)
/** Letters: 'r' request, 'g' grant, '.' idle.  A lasso is {pre: [...], loop: [...]}; the infinite word is pre · loop^ω. */
export function unroll(pre, loop, copies) { const w = pre.slice(); for (let c = 0; c < copies; c++) w.push(...loop); return w; }
/** Safety monitor "a grant must answer a pending request": returns the index of the first violating letter, or -1. */
export function firstBad(word) { let pend = false; for (let i = 0; i < word.length; i++) { const c = word[i]; if (c === 'r') pend = true; else if (c === 'g') { if (!pend) return i; pend = false; } } return -1; }
const hasGrantAfter = (w, i) => w.indexOf('g', i + 1) >= 0;
export const PROPS = {
  S: { name: 'Safety — no grant without a pending request', kind: 'safety', sat: (pre, loop) => firstBad(unroll(pre, loop, 3)) < 0 },
  L1: { name: 'Liveness — every request is eventually granted', kind: 'liveness', sat: (pre, loop) => { const w = unroll(pre, loop, 3), lim = pre.length + 2 * loop.length; for (let i = 0; i < lim; i++) if (w[i] === 'r' && !hasGrantAfter(w, i)) return false; return true; } },
  L2: { name: 'Liveness — grants happen infinitely often', kind: 'liveness', sat: (pre, loop) => loop.includes('g') },
  SL: { name: 'Both: grants answer requests, and every request is granted', kind: 'both', sat: (pre, loop) => PROPS.S.sat(pre, loop) && PROPS.L1.sat(pre, loop) },
};
const EXT = [['g', '.'], ['.'], ['r', 'g'], ['.', 'g'], ['g']];
/** Can the finite prefix still be extended to an infinite word satisfying P?  (Tested against a family of tail loops that is complete for these properties.) */
export const extendable = (P, prefix) => EXT.some((tail) => P.sat(prefix, tail));

// ----------------------------------------------------------------------------- alternating bit protocol (1.9)
/**
 * Discrete-event run of sender/receiver over FIFO channels that lose and duplicate (seeded; `forced` = set of message keys to lose).
 * mode 'abp' (alternating bit), 'nobit' (no sequence bit), 'noretx' (no retransmission).
 * Returns {msgs, timeouts, delivs, delivered, end, nFrames, nAcks, rtx, viol}.
 */
export function runABP({ K, loss, dup, d, tmo, forced, mode, seed }) {
  const q = []; let qk = 0;
  const push = (t, type, data) => { q.push({ t, type, data, k: qk++ }); q.sort((a, b) => a.t - b.t || a.k - b.k); };
  const msgs = [], timeouts = [], delivs = [], cnt = { D: 0, A: 0 }, last = { D: 0, A: 0 };
  let i = 0, sb = 0, rb = 0, timer = 0, delivered = [], rtx = 0, viol = 0, nFrames = 0, nAcks = 0, end = 0;
  const send = (t, kind, payload, label) => {
    const c = cnt[kind]++, baseKey = `${kind}${c}`, lost = forced.has(baseKey) || hash01(seed, kind === 'D' ? 1 : 2, c, 1) < loss;
    const dl = d * (0.8 + 0.4 * hash01(seed, kind === 'D' ? 3 : 4, c));
    let tr = Math.max(t + dl, last[kind] + 0.03);
    const m = { kind, from: kind === 'D' ? 0 : 1, to: kind === 'D' ? 1 : 0, ts: t, tr, lost, baseKey, payload, label };
    msgs.push(m); if (!lost) { last[kind] = tr; push(tr, 'arrive', m); if (hash01(seed, kind === 'D' ? 5 : 6, c, 9) < dup) { const m2 = { ...m, tr: tr + 0.45 * dl + 0.05, dup: true }; msgs.push(m2); last[kind] = m2.tr; push(m2.tr, 'arrive', m2); } }
  };
  const frame = (t) => { nFrames++; send(t, 'D', { bit: mode === 'abp' ? sb : null, m: i }, mode === 'abp' ? `m${i + 1}·${sb}` : `m${i + 1}`); if (mode !== 'noretx') push(t + tmo, 'timeout', { id: ++timer }); };
  const check = () => { if (mode === 'abp' && !(i <= delivered.length && delivered.length <= i + 1 && sb === i % 2 && rb === delivered.length % 2)) viol++; };
  frame(0);
  while (q.length) {
    const e = q.shift(), t = e.t; if (t > 60) break; end = Math.max(end, t);
    if (e.type === 'timeout') { if (e.data.id === timer && i < K) { rtx++; timeouts.push(t); frame(t); } }
    else if (e.data.kind === 'D') {
      const { bit, m } = e.data.payload; nAcks++;
      if (mode === 'abp') { if (bit === rb) { delivered.push(m); delivs.push({ t, m, dupe: false }); rb ^= 1; } send(t, 'A', { bit }, `ack ${bit}`); }
      else { delivered.push(m); delivs.push({ t, m, dupe: delivered.filter((x) => x === m).length > 1 }); send(t, 'A', {}, 'ack'); }
    } else if (i < K) {
      if (mode === 'abp') { if (e.data.payload.bit === sb) { i++; sb ^= 1; if (i < K) frame(t); } }
      else { i++; if (i < K) frame(t); }
    }
    check();
  }
  return { msgs, timeouts, delivs, delivered, end, nFrames, nAcks, rtx, viol };
}

// ----------------------------------------------------------------------------- Cerf–Kahn: window protocol across a fragmenting gateway (1.10)
/**
 * One message of N bytes, cut into segments of size S; sender window w over sequence numbers mod n; gateway fragments to pieces <= m;
 * the receiver follows the paper's three rules.  Each byte carries its own true index, so reassembling a stale copy shows as garbage.
 * Returns {frames, R, corrupt, done}; a frame is a full snapshot for the step player.
 */
export function runTCP({ N, S, m, w, n, loss, seed }, noFrames) {
  const segs = []; for (let lo = 0; lo < N; lo += S) segs.push([lo, Math.min(N, lo + S)]);
  const q = []; let qk = 0, uid = 0, t = 0, la = 0, nxt = 0, R = 0, corrupt = 0, timer = 0, flight = [];
  const buf = new Array(N).fill(null), frames = [];
  const push = (tt, type, d) => { q.push({ t: tt, type, d, k: qk++ }); q.sort((a, b) => a.t - b.t || a.k - b.k); };
  const snap = (note, line) => { if (!noFrames) frames.push({ t, note, line, la, next: segs[nxt - 1] ? segs[nxt - 1][1] : 0, R, buf: buf.slice(), corrupt, flight: flight.map((x) => ({ ...x })) }); };
  const RTO = 9, lbl = (p) => `SEQ ${p.seq} CT ${p.ct}${p.es ? ' ES' : ''}${p.em ? ' EM' : ''}`;
  const drop = (id) => { flight = flight.filter((x) => x.id !== id); };
  const sendSeg = (j) => {
    const [lo, hi] = segs[j], p = { id: ++uid, lo, hi, seq: lo % n, ct: hi - lo, es: true, em: j === segs.length - 1 };
    flight.push({ id: p.id, link: 'A', label: lbl(p) }); push(t + 1, 'gate', p); return p;
  };
  const pump = () => {
    const sent = [];
    while (nxt < segs.length && segs[nxt][1] <= la + w) { const p = sendSeg(nxt); nxt++; sent.push(p); }
    if (sent.length) { timer++; push(t + RTO, 'timeout', { id: timer }); snap(`Send ${sent.map((p) => `[${lbl(p)}]`).join(' ')} — bytes inside the window L … L+w−1.`, 1); }
  };
  pump();
  let guard = 0;
  while (q.length && guard++ < 4000) {
    const e = q.shift(); t = e.t; if (t > 300) break;
    if (e.type === 'timeout') {
      if (e.d.id !== timer || la >= N) continue;
      const out = []; for (let j = 0; j < nxt; j++) if (segs[j][1] > la) out.push(sendSeg(j));
      timer++; push(t + RTO, 'timeout', { id: timer }); snap(`Timeout: retransmit the unacknowledged bytes — ${out.map((p) => `[${lbl(p)}]`).join(' ')}.`, 2);
    } else if (e.type === 'gate') {
      const p = e.d; drop(p.id); const pieces = [];
      for (let lo = p.lo; lo < p.hi; lo += m) { const hi = Math.min(p.hi, lo + m); pieces.push({ id: ++uid, lo, hi, seq: lo % n, ct: hi - lo, es: hi === p.hi, em: hi === p.hi && p.em }); }
      pieces.forEach((pc, qi) => {
        const lost = hash01(seed, pc.id, 11) < loss; pc.lost = lost;
        flight.push({ id: pc.id, link: 'B', label: lbl(pc), lost });
        if (lost) push(t + 0.6, 'lose', pc); else push(t + 1 + 0.2 * qi, 'recv', pc);
      });
      snap(pieces.length > 1 ? `The gateway splits [${lbl(p)}] into ${pieces.length} pieces for network B: ${pieces.map((x) => `[${lbl(x)}]`).join(' ')} — SEQ and CT rewritten; only the last piece keeps ES${p.em ? ' and EM' : ''}.` : `The gateway forwards [${lbl(p)}] unchanged.`, 4);
    } else if (e.type === 'lose') { drop(e.d.id); snap(`Piece [${lbl(e.d)}] is lost in network B.`, 4); }
    else if (e.type === 'recv') {
      const p = e.d; drop(p.id);
      const off = (((p.seq - (R % n)) % n) + n) % n; let how, line;
      if (off < w) {
        for (let b = 0; b < p.ct; b++) { const idx = R + off + b; if (idx < N) buf[idx] = p.lo + b; }
        if (off === 0) { how = 'its SEQ is the left edge: accept'; line = 5; } else { how = `its SEQ is ${off} bytes inside the window: keep it`; line = 6; }
        const R0 = R; while (R < N && buf[R] != null) { if (buf[R] !== R) corrupt++; R++; }
        if (R > R0) how += `, the edge advances to ${R}`;
      } else { how = 'its SEQ lies outside the window: discard'; line = 7; }
      const stale = p.hi <= R && off < w && off > 0 && p.lo < R;
      const ack = { id: ++uid, seq: R % n }, lost = hash01(seed, ack.id, 13) < loss;
      flight.push({ id: ack.id, link: 'ACK', label: `ACK ${ack.seq}`, lost });
      if (lost) push(t + 0.6, 'lose', { ...ack, ack: true, label: `ACK ${ack.seq}` }); else push(t + 2, 'ack', ack);
      snap(`Receiver gets [${lbl(p)}]: ${how}${stale ? ' — a stale retransmission read as NEW data!' : ''}. ACK ${ack.seq} (next expected).`, line);
    } else if (e.type === 'ack') {
      drop(e.d.id); const adv = (((e.d.seq - (la % n)) % n) + n) % n, out = nxt > 0 ? segs[nxt - 1][1] - la : 0;
      if (adv > 0 && adv <= out) { la += adv; timer++; push(t + RTO, 'timeout', { id: timer }); snap(`ACK ${e.d.seq} arrives: the left edge moves ${adv} byte${adv === 1 ? '' : 's'} to L = ${la}.`, 3); pump(); }
      else snap(`ACK ${e.d.seq} arrives: nothing new acknowledged (L stays ${la}).`, 3);
    }
  }
  if (!noFrames) { snap(R >= N && la >= N ? (corrupt ? `Done, but ${corrupt} reassembled byte(s) are wrong.` : 'Done: the message is reassembled exactly.') : 'No more events: the transfer did not complete.', 5); }
  return { frames, R, corrupt, done: R >= N && la >= N };
}
const mcCache = new Map();
/** Over `runs` loss patterns: how many runs reassemble garbage or never finish. */
export function monteCarloTCP(p, runs) {
  const key = JSON.stringify([p.N, p.S, p.m, p.w, p.n, p.loss, runs]); if (mcCache.has(key)) return mcCache.get(key);
  let corrupt = 0, stall = 0;
  for (let s = 1; s <= runs; s++) { const r = runTCP({ ...p, seed: 100 + s }, true); if (r.corrupt) corrupt++; else if (!r.done) stall++; }
  const out = { corrupt, stall, bad: corrupt + stall }; mcCache.set(key, out); return out;
}
