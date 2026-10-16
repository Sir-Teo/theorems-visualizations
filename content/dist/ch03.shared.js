// Distributed Computing — Chapter 3 (time, clocks and snapshots): helpers shared by ch03.js, ch03-b.js and ch03-c.js.
// Re-exports the Chapter 2 helpers (seeded randomness, ring drawing, ...) and the Chapter 1 space-time drawing helpers.
// Everything here is a pure simulator or a drawing routine: the pictures run the real algorithms.
export * from './ch02.shared.js';
export { ly, segDist, drawLanes, drawMsg, hitMsg, laneAt } from './ch01.shared.js';
import { hash01, mulberry32, clamp } from './ch02.shared.js';
import { ly, drawLanes, drawMsg, hitMsg, laneAt } from './ch01.shared.js';

export const NAMES = ['P', 'Q', 'R', 'S', 'T'];
export const LOW = ['p', 'q', 'r', 's', 't'];
export const PCOL = ['accent', 'orange', 'green', 'purple', 'teal'];
export const T0 = 10;

// ----------------------------------------------------------------------------- executions (space-time diagrams)
/**
 * A model is {n, loc: [[process, time], …], msgs: [{from, ts, to, tr}, …]}: local events and messages drawn on n process lines
 * with time running to the right (a message arrow always leans forward in time, ts < tr).
 */
export const defaultModel = () => ({
  n: 3,
  loc: [[0, 3], [2, 1.5]],
  msgs: [{ from: 0, ts: 1, to: 1, tr: 3 }, { from: 1, ts: 2, to: 2, tr: 4.5 }, { from: 1, ts: 4, to: 0, tr: 6 }, { from: 2, ts: 5.5, to: 1, tr: 7.5 }, { from: 0, ts: 7, to: 2, tr: 9 }],
});
export const cloneModel = (M) => ({ n: M.n, loc: M.loc.map((e) => e.slice()), msgs: M.msgs.map((m) => ({ ...m })) });
export const setModel = (M, N) => { M.n = N.n; M.loc = N.loc; M.msgs = N.msgs; };

/** Is the slot (process p, time t) at least eps away from every event of the model? */
export const freeSlot = (M, p, t, eps = 0.25) => {
  for (const e of M.loc) if (e[0] === p && Math.abs(e[1] - t) < eps) return false;
  for (const m of M.msgs) { if (m.from === p && Math.abs(m.ts - t) < eps) return false; if (m.to === p && Math.abs(m.tr - t) < eps) return false; }
  return true;
};
const snap = (t) => Math.round(t * 2) / 2;

/** A seeded random execution with `nm` messages and two local events. */
export function randomModel(seed, n = 3, nm = 6) {
  const r = mulberry32(seed * 977 + 5), M = { n, loc: [], msgs: [] };
  for (let k = 0; k < nm; k++) {
    for (let tries = 0; tries < 40; tries++) {
      const a = Math.floor(r() * n); let b = Math.floor(r() * (n - 1)); if (b >= a) b++;
      const ts = snap(0.5 + r() * 6.5), tr = ts + 0.5 + Math.floor(r() * 6) / 2;
      if (tr > T0 - 0.5 || !freeSlot(M, a, ts) || !freeSlot(M, b, tr)) continue;
      M.msgs.push({ from: a, ts, to: b, tr }); break;
    }
  }
  for (let k = 0; k < 2; k++) for (let tries = 0; tries < 40; tries++) { const p = Math.floor(r() * n), t = snap(0.5 + r() * 8.5); if (freeSlot(M, p, t)) { M.loc.push([p, t]); break; } }
  return M;
}

/**
 * Derive everything about an execution. Events are sorted by time (ties by process); each has
 * {id, p, t, kind: 'local'|'send'|'recv', m (message index or -1), idx (position in its process), prev (previous event of the process or -1)}.
 * opts.lamport: 'max' (the rule, default) or 'inc' (broken: ignore the timestamp); opts.vector: 'merge' (default) or 'own' (broken: no merge).
 * Returns {n, ev, byProc, msgs (with s, r event ids), past[e] (Uint8Array of events strictly before e), lam, vec, hb(a, b)}.
 */
export function buildExec(M, opts = {}) {
  const n = M.n, ev = [];
  M.loc.forEach(([p, t]) => ev.push({ p, t, kind: 'local', m: -1 }));
  M.msgs.forEach((m, k) => { ev.push({ p: m.from, t: m.ts, kind: 'send', m: k }); ev.push({ p: m.to, t: m.tr, kind: 'recv', m: k }); });
  ev.sort((a, b) => a.t - b.t || a.p - b.p || (a.kind === 'recv' ? 1 : 0) - (b.kind === 'recv' ? 1 : 0));
  ev.forEach((e, i) => { e.id = i; });
  const byProc = Array.from({ length: n }, () => []);
  for (const e of ev) { e.idx = byProc[e.p].length; e.prev = e.idx ? byProc[e.p][e.idx - 1] : -1; byProc[e.p].push(e.id); }
  const msgs = M.msgs.map((m, k) => ({ ...m, k, s: -1, r: -1 }));
  for (const e of ev) { if (e.kind === 'send') msgs[e.m].s = e.id; else if (e.kind === 'recv') msgs[e.m].r = e.id; }
  const N = ev.length, past = [], lam = [], vec = [];
  for (const e of ev) {
    const pr = new Uint8Array(N), src = e.kind === 'recv' ? msgs[e.m].s : -1;
    for (const u of [e.prev, src]) if (u >= 0) { pr[u] = 1; const pu = past[u]; for (let i = 0; i < N; i++) if (pu[i]) pr[i] = 1; }
    past.push(pr);
    const lp = e.prev >= 0 ? lam[e.prev] : 0;
    lam.push(e.kind === 'recv' && opts.lamport !== 'inc' ? Math.max(lp, lam[src]) + 1 : lp + 1);
    const vv = e.prev >= 0 ? vec[e.prev].slice() : new Array(n).fill(0);
    if (e.kind === 'recv' && opts.vector !== 'own') { const w = vec[src]; for (let i = 0; i < n; i++) vv[i] = Math.max(vv[i], w[i]); }
    vv[e.p]++;
    vec.push(vv);
  }
  return { n, ev, byProc, msgs, past, lam, vec, N, hb: (a, b) => past[b][a] === 1 };
}

export const evName = (e) => LOW[e.p] + (e.idx + 1);
/** 'before' (a → b), 'after' (b → a), 'concurrent', or 'same'. */
export const relation = (X, a, b) => (a === b ? 'same' : X.hb(a, b) ? 'before' : X.hb(b, a) ? 'after' : 'concurrent');
/** A shortest chain of arrows (process steps and messages) from event a to event b, as a list of event ids, or null. */
export function chain(X, a, b) {
  const prev = new Map([[a, -1]]), q = [a];
  while (q.length) {
    const u = q.shift(); if (u === b) break;
    const e = X.ev[u], nx = [];
    if (e.idx + 1 < X.byProc[e.p].length) nx.push(X.byProc[e.p][e.idx + 1]);
    if (e.kind === 'send') nx.push(X.msgs[e.m].r);
    for (const w of nx) if (!prev.has(w)) { prev.set(w, u); q.push(w); }
  }
  if (!prev.has(b)) return null;
  const out = []; for (let u = b; u !== -1; u = prev.get(u)) out.push(u);
  return out.reverse();
}
/** Counts of ordered, concurrent and total pairs. */
export function pairStats(X) {
  let ord = 0, conc = 0; for (let a = 0; a < X.N; a++) for (let b = a + 1; b < X.N; b++) { if (X.hb(a, b) || X.hb(b, a)) ord++; else conc++; }
  return { ord, conc, total: ord + conc };
}
export const vecLess = (u, w) => u.every((x, i) => x <= w[i]) && u.some((x, i) => x < w[i]);
export const vecStr = (u) => `[${u.join(',')}]`;

/** Draw lanes, messages and event dots of an execution. o: {names, T, dotColor(e), ring(e), label(e), msgColor(m), msgLabel(m), localHollow, r, ghost}. */
export function drawExec(s, X, o = {}) {
  const n = X.n, T = o.T ?? T0;
  drawLanes(s, n, T, { names: o.names || NAMES.slice(0, n), nameColor: o.nameColor });
  for (const m of X.msgs) drawMsg(s, n, o.msgLabel ? { ...m, label: o.msgLabel(m) } : m, { color: o.msgColor ? o.msgColor(m) : 'accent', width: o.msgWidth ? o.msgWidth(m) : 2, label: !!o.msgLabel, labelColor: o.msgColor ? o.msgColor(m) : 'accent' });
  for (const e of X.ev) {
    const y = ly(e.p, n), rg = o.ring && o.ring(e);
    if (rg) s.dot(e.t, y, { r: (o.r ?? 6) + 5, hollow: true, color: rg, width: 2.6 });
    s.dot(e.t, y, { r: o.r ?? 6, color: o.dotColor ? o.dotColor(e) : 'accent', hollow: e.kind === 'local' && o.localHollow !== false && !o.dotColor });
    const lb = o.label && o.label(e);
    if (lb != null && lb !== '') s.text(String(lb), e.t, y, { align: 'center', baseline: 'bottom', dy: -(o.r ?? 6) - 6, size: o.labelSize ?? 12, color: o.labelColor ? o.labelColor(e) : 'ink', halo: true });
  }
  if (o.ghost) { const g = o.ghost; s.line(g.x0, ly(g.a, n), g.x1, ly(g.b, n), { color: 'gold', width: 2.4, dash: [6, 4] }); }
}

/**
 * Pointer editing of an execution on stage `s` (create once). Gestures: click an event = pick it (o.onPick(id)); click a message = delete it;
 * click on empty lane = add a local event; drag from one lane to another = add a message (the earlier end sends).
 * getX() returns the current derived execution; o.onChange() is called after every edit.
 */
export function attachEditor(s, M, getX, o = {}) {
  const T = o.T ?? T0, cap = o.cap ?? 30, ed = { ghost: null };
  let st = null;
  const nLane = () => M.n;
  const laneNear = (y) => clamp(M.n - 1 - Math.round(y), 0, M.n - 1);
  const nudge = (p, t) => { t = clamp(snap(t), 0.5, T - 0.5); for (let k = 0; k < 6 && !freeSlot(M, p, t); k++) t += 0.5; return t <= T - 0.5 && freeSlot(M, p, t) ? t : null; };
  const count = () => M.loc.length + 2 * M.msgs.length;
  s.onDrag((x, y, ph) => {
    if (ph === 'start') { st = { x0: x, y0: y, px: s.X(x), py: s.Y(y) }; ed.ghost = null; return; }
    if (!st) return;
    const moved = Math.hypot(s.X(x) - st.px, s.Y(y) - st.py) > 8;
    if (ph === 'move') { ed.ghost = moved ? { x0: st.x0, a: laneNear(st.y0), x1: x, b: laneNear(y) } : null; return; }
    ed.ghost = null;
    const X = getX(), n = nLane();
    if (!moved) {
      let best = -1, bd = 12;
      for (const e of X.ev) { const d = Math.hypot(s.X(e.t) - st.px, s.Y(ly(e.p, n)) - st.py); if (d < bd) { bd = d; best = e.id; } }
      if (best >= 0) { o.onPick && o.onPick(best); }
      else {
        const k = hitMsg(s, n, X.msgs, st.px, st.py, 8);
        if (k >= 0) { M.msgs.splice(X.msgs[k].k, 1); o.onChange && o.onChange(); }
        else { const p = laneAt(st.y0, n); if (p >= 0 && count() < cap) { const t = nudge(p, st.x0); if (t != null) { M.loc.push([p, t]); o.onChange && o.onChange(); } } }
      }
    } else {
      let a = laneNear(st.y0), b = laneNear(y), xa = st.x0, xb = x;
      if (a !== b && count() + 2 <= cap) {
        if (xb < xa) { [a, b] = [b, a]; [xa, xb] = [xb, xa]; }
        const ts = nudge(a, xa); let tr = nudge(b, Math.max(xb, (ts ?? 0) + 0.5));
        if (ts != null && tr != null && tr > ts) { M.msgs.push({ from: a, ts, to: b, tr }); o.onChange && o.onChange(); }
      }
    }
    st = null;
  });
  return ed;
}

/** Stable colour of a process or a message index. */
export const colOf = (i) => PCOL[i % PCOL.length];

// ----------------------------------------------------------------------------- 3.3: state machine replication with logical time
export const SM_OPS = [
  { p: 0, t: 0.5, label: '×2', f: (x) => x * 2 },
  { p: 1, t: 0.8, label: '+3', f: (x) => x + 3 },
  { p: 2, t: 1.1, label: '−1', f: (x) => x - 1 },
  { p: 1, t: 4.6, label: '×3', f: (x) => x * 3 },
];
const lexGt = (a1, o1, a2, o2) => a1 > a2 || (a1 === a2 && o1 > o2);
/**
 * Three replicas of a counter (initially 1), each client submitting the operations of SM_OPS.
 * mode 'ts': Lamport's rule — a request is applied once the smallest-timestamp request is stable (an acknowledgement stamped later has come from every
 * other process); mode 'arrival': every replica applies requests in the order they reach it (the origin applies its own at once).
 * Returns {msgs [{from,to,ts,tr,kind,label}], applied[p] [{t, req, val}], x[p], end}.
 */
export function runSM({ spread = 0.5, seed = 1, mode = 'ts' } = {}) {
  const n = 3, q = [], msgs = [], last = {}, clock = [0, 0, 0], seen = [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]];
  const queue = [[], [], []], x = [1, 1, 1], applied = [[], [], []];
  let k = 0, end = 0;
  const push = (e) => { q.push(e); q.sort((a, b) => a.t - b.t || a.k - b.k); };
  const send = (t, from, to, payload) => {
    const key = from * 3 + to; let tr = t + 0.5 + spread * 1.8 * hash01(seed, from, to, msgs.length, 3);
    tr = Math.max(tr, (last[key] ?? 0) + 0.02); last[key] = tr;
    const m = { from, to, ts: t, tr, ...payload }; msgs.push(m); push({ t: tr, k: k++, type: 'recv', m });
  };
  const apply = (p, t, req) => { x[p] = req.op.f(x[p]); applied[p].push({ t, req, val: x[p] }); end = Math.max(end, t); };
  const tryApply = (p, t) => {
    for (;;) {
      if (!queue[p].length) return;
      let hi = 0; queue[p].forEach((r, i) => { const h = queue[p][hi]; if (lexGt(h.ts, h.o, r.ts, r.o)) hi = i; });
      const h = queue[p][hi];
      for (let j = 0; j < n; j++) if (j !== p && j !== h.o && !lexGt(seen[p][j], j, h.ts, h.o)) return;
      queue[p].splice(hi, 1); apply(p, t, h);
    }
  };
  SM_OPS.forEach((op, i) => push({ t: op.t, k: k++, type: 'issue', op, id: i }));
  while (q.length) {
    const e = q.shift();
    if (e.type === 'issue') {
      const p = e.op.p; clock[p]++;
      const req = { ts: clock[p], o: p, op: e.op, id: e.id };
      if (mode === 'ts') { queue[p].push(req); tryApply(p, e.t); } else apply(p, e.t, req);
      for (let j = 0; j < n; j++) if (j !== p) send(e.t, p, j, { kind: 'req', req, stamp: req.ts, label: e.op.label });
    } else {
      const m = e.m, p = m.to; clock[p] = Math.max(clock[p], m.stamp) + 1; seen[p][m.from] = Math.max(seen[p][m.from], m.stamp);
      if (m.kind === 'req') {
        if (mode === 'ts') { queue[p].push(m.req); clock[p]++; for (let j = 0; j < n; j++) if (j !== p) send(e.t, p, j, { kind: 'ack', stamp: clock[p], label: '' }); tryApply(p, e.t); } else apply(p, e.t, m.req);
      } else tryApply(p, e.t);
    }
  }
  return { msgs, applied, x, end: Math.max(end, ...msgs.map((m) => m.tr)) };
}

// ----------------------------------------------------------------------------- 3.6: causal broadcast
/**
 * Three processes P, Q, R. P broadcasts m1; Q broadcasts m2 when it delivers m1; P broadcasts m3 when it delivers m2; R broadcasts m4 at time 1.4.
 * Channels are not FIFO across senders and the channel P → R is slow by `slow`.
 * rule: 'arrival' (deliver at once), 'fifo' (per-sender order only), 'causal' (vector-timestamp rule).
 */
export function runCausal({ rule = 'causal', slow = 3, seed = 1 } = {}) {
  const n = 3, q = [], VC = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], fifoNext = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], buf = [[], [], []], dels = [[], [], []], msgs = [];
  let k = 0;
  const push = (e) => { q.push(e); q.sort((a, b) => a.t - b.t || a.k - b.k); };
  const delay = (m, to) => (m.tag === 1 && to === 2 ? slow : 0.7 + 0.5 * hash01(seed, m.tag, m.from, to));
  const deliverable = (p, m) => {
    if (rule === 'arrival') return true;
    if (rule === 'fifo') return m.VT[m.from] === fifoNext[p][m.from] + 1;
    return m.VT[m.from] === VC[p][m.from] + 1 && m.VT.every((x, j) => j === m.from || x <= VC[p][j]);
  };
  const deliver = (p, m, tArr, t) => {
    fifoNext[p][m.from]++; for (let j = 0; j < n; j++) VC[p][j] = Math.max(VC[p][j], m.VT[j]);
    dels[p].push({ m, tArr, tDel: t });
    if (p === 1 && m.tag === 1) bcast(1, t, 2);
    if (p === 0 && m.tag === 2) bcast(0, t, 3);
  };
  const drain = (p, t) => {
    for (let again = true; again;) {
      again = false;
      for (let i = 0; i < buf[p].length; i++) if (deliverable(p, buf[p][i].m)) { const b = buf[p].splice(i, 1)[0]; deliver(p, b.m, b.tArr, t); again = true; break; }
    }
  };
  function bcast(p, t, tag) {
    VC[p][p]++; const m = { id: msgs.length, tag, from: p, t, VT: VC[p].slice() }; msgs.push(m);
    fifoNext[p][p]++; dels[p].push({ m, tArr: t, tDel: t, own: true });
    for (let j = 0; j < n; j++) if (j !== p) push({ t: t + delay(m, j), k: k++, type: 'arr', m, to: j });
  }
  push({ t: 0.5, k: k++, type: 'bc', p: 0, tag: 1 }); push({ t: 1.4, k: k++, type: 'bc', p: 2, tag: 4 });
  while (q.length) {
    const e = q.shift();
    if (e.type === 'bc') bcast(e.p, e.t, e.tag);
    else { buf[e.to].push({ m: e.m, tArr: e.t }); drain(e.to, e.t); }
  }
  const viol = [];
  dels.forEach((L, p) => { for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (vecLess(L[j].m.VT, L[i].m.VT)) viol.push({ p, first: L[i].m, second: L[j].m }); });
  const stuck = buf.reduce((a, b) => a + b.length, 0);
  return { msgs, dels, viol, stuck, end: Math.max(...dels.flat().map((d) => d.tDel)) };
}

// ----------------------------------------------------------------------------- 3.8: Chandy–Lamport snapshot of three bank branches
/**
 * Three branches with balance 100 each, sending money to one another over FIFO channels while a snapshot is taken.
 * The initiator (branch 0) records its balance at time `tSnap` and sends markers; the rule of Chandy and Lamport does the rest.
 * Returns {msgs [{from,to,ts,tr,kind:'xfer'|'mark',amt}], hist[p] [[t, balance]], recT, recBal, chan[from][to] (amounts), doneT, naive[p], orphans, T}.
 */
export function runCL({ seed = 1, spread = 0.5, tSnap = 4, T = 14 } = {}) {
  const n = 3, r = mulberry32(seed * 7919 + 13), bal = [100, 100, 100], hist = bal.map((b) => [[0, b]]), msgs = [], last = {}, q = [];
  const recT = [null, null, null], recBal = [null, null, null], chan = [[[], [], []], [[], [], []], [[], [], []]], gotMark = [[false, false, false], [false, false, false], [false, false, false]];
  let k = 0, doneT = null;
  const push = (e) => { q.push(e); q.sort((a, b) => a.t - b.t || a.k - b.k); };
  const send = (t, from, to, kind, amt) => {
    const key = from * 3 + to; let tr = t + 0.5 + 2.2 * spread * r(); tr = Math.max(tr, (last[key] ?? 0) + 0.02); last[key] = tr;
    const m = { from, to, ts: t, tr, kind, amt }; msgs.push(m); push({ t: tr, k: k++, type: 'recv', m });
  };
  for (let p = 0; p < n; p++) for (let t = 0.3 + 0.35 * p; t < T - 2; t += 0.8 + 0.9 * r()) { let to = Math.floor(r() * 2); if (to >= p) to++; push({ t, k: k++, type: 'plan', p, to, want: 5 + Math.floor(r() * 26) }); }
  push({ t: tSnap, k: k++, type: 'init' });
  const record = (p, t) => { recT[p] = t; recBal[p] = bal[p]; for (let j = 0; j < n; j++) if (j !== p) send(t, p, j, 'mark'); };
  const setBal = (p, t, d) => { bal[p] += d; hist[p].push([t, bal[p]]); };
  while (q.length) {
    const e = q.shift();
    if (e.type === 'plan') { const amt = Math.min(bal[e.p], e.want); if (amt > 0) { setBal(e.p, e.t, -amt); send(e.t, e.p, e.to, 'xfer', amt); } }
    else if (e.type === 'init') record(0, e.t);
    else {
      const m = e.m, p = m.to;
      if (m.kind === 'xfer') { setBal(p, e.t, m.amt); if (recT[p] != null && !gotMark[p][m.from]) chan[m.from][p].push(m.amt); }
      else { if (recT[p] == null) record(p, e.t); gotMark[p][m.from] = true; if (recT.every((x) => x != null) && gotMark.every((row, i) => row.every((g, j) => i === j || g))) doneT = e.t; }
    }
  }
  const balAt = (p, t) => { let b = 100; for (const [tt, x] of hist[p]) if (tt <= t) b = x; return b; };
  const naive = [0, 1, 2].map((p) => balAt(p, tSnap));
  let orphans = 0; for (const m of msgs) if (m.kind === 'xfer' && recT[m.from] != null && recT[m.to] != null && m.ts > recT[m.from] && m.tr <= recT[m.to]) orphans++;
  return { msgs, hist, recT, recBal, chan, doneT, naive, orphans, T, balAt };
}

// ----------------------------------------------------------------------------- 3.10: Lundelius–Lynch shifting argument
/** Delay from p_i to p_j in the base execution of the proof: d − u + (u/n)·((j − i) mod n). */
export const llDelay = (n, i, j, d, u) => d - u + (u / n) * (((j - i) % n + n) % n);
/** Shift of process i (real-time displacement) in the k-th shifted execution: −(u/n)·((i − k) mod n). */
export const llShift = (n, k, i, u) => -(u / n) * (((i - k) % n + n) % n);
export const rangeOf = (a) => Math.max(...a) - Math.min(...a);
