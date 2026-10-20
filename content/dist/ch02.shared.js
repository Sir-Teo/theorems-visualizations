// Distributed Computing — Chapter 2 (basic network algorithms): pure simulators and drawing helpers shared by ch02.js and ch02-b.js.
// Every picture runs the real algorithm; nothing here is faked.

export const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const hash01 = (...xs) => { let h = 2166136261; for (const x of xs) { h ^= (Math.floor(x) | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); h ^= h >>> 13; h = Math.imul(h, 2246822519); h ^= h >>> 16; } return ((h >>> 0) % 1000003) / 1000003; };
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const range = (n) => Array.from({ length: n }, (_, i) => i);
export const plural = (n, w, ws) => `${n} ${n === 1 ? w : ws || w + 's'}`;
export const log2 = (x) => Math.log(x) / Math.LN2;

/** Position of node i of n on a circle of radius R, clockwise from the top. */
export const ringXY = (i, n, R = 1, cx = 0, cy = 0) => { const a = Math.PI / 2 - (2 * Math.PI * i) / n; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; };

/** Draw the directed or undirected ring edges (arrows clockwise when `dir`). */
export function drawRingEdges(s, n, R, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = ringXY(i, n, R), b = ringXY((i + 1) % n, n, R), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, t = (o.r || 0.17) / L;
    if (o.dir) s.arrow(a[0] + dx * t, a[1] + dy * t, b[0] - dx * t, b[1] - dy * t, { color: o.color || 'faint', width: o.width || 1.4 });
    else s.line(a[0] + dx * t, a[1] + dy * t, b[0] - dx * t, b[1] - dy * t, { color: o.color || 'faint', width: o.width || 1.4 });
  }
}

/** Point a fraction f of the way along the (clockwise) hop from node i to node i+1 on the ring. */
export const ringHop = (i, f, n, R) => { const a = ringXY(i, n, R), b = ringXY((i + 1) % n, n, R); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };

// ----------------------------------------------------------------------------------------------------------- 2.1 flooding + echo
/** Dijkstra over symmetric delays. adj: Map id -> [ids]. Returns {arrive, parent}. */
export function arrivalTimes(adj, root, d) {
  const arrive = new Map([[root, 0]]), parent = new Map([[root, null]]), done = new Set();
  for (;;) {
    let u = null;
    for (const [k, t] of arrive) if (!done.has(k) && (u === null || t < arrive.get(u))) u = k;
    if (u === null) break;
    done.add(u);
    for (const w of adj.get(u) || []) { const t = arrive.get(u) + d(u, w); if (!arrive.has(w) || t < arrive.get(w) - 1e-12) { arrive.set(w, t); parent.set(w, u); } }
  }
  return { arrive, parent };
}

/**
 * Flooding with echo: every node, on its first message, adopts the sender as parent and forwards to all other neighbours;
 * every message is answered once: a "reject" if the receiver already has a parent, a "value" (subtree sum) once the sender's whole subtree is done.
 */
export function floodEcho(adj, root, d, x) {
  const { arrive, parent } = arrivalTimes(adj, root, d);
  const reached = [...arrive.keys()], msgs = [], children = new Map(reached.map((u) => [u, []]));
  for (const u of reached) if (parent.get(u) != null) children.get(parent.get(u)).push(u);
  const isChild = (u, w) => parent.get(w) === u;
  for (const u of reached) {
    for (const w of adj.get(u) || []) {
      if (w === parent.get(u)) continue;
      const ts = arrive.get(u), tr = ts + d(u, w);
      msgs.push({ from: u, to: w, ts, tr, kind: 'flood', tree: isChild(u, w) });
      if (!isChild(u, w)) msgs.push({ from: w, to: u, ts: tr, tr: tr + d(u, w), kind: 'reject' });
    }
  }
  const done = new Map(), sum = new Map();
  for (const u of [...reached].sort((a, b) => arrive.get(b) - arrive.get(a))) {
    let t = arrive.get(u), sm = x(u);
    for (const w of adj.get(u) || []) {
      if (w === parent.get(u)) continue;
      if (isChild(u, w)) { t = Math.max(t, done.get(w) + d(u, w)); sm += sum.get(w); } else t = Math.max(t, arrive.get(u) + 2 * d(u, w));
    }
    done.set(u, t); sum.set(u, sm);
  }
  for (const u of reached) if (parent.get(u) != null) msgs.push({ from: u, to: parent.get(u), ts: done.get(u), tr: done.get(u) + d(u, parent.get(u)), kind: 'value', val: sum.get(u) });
  const end = Math.max(...msgs.map((m) => m.tr), done.get(root));
  return { arrive, parent, children, done, sum, msgs, reached, end, rootDone: done.get(root) };
}

// ----------------------------------------------------------------------------------------------------------- 2.2 asynchronous Bellman-Ford
/**
 * Asynchronous Bellman-Ford. edges: [{a, b, w, slow}]; nodes: [ids]. Every improvement is sent to all neighbours.
 * delay of a message = (slow ? slowFactor : 1) * (0.5 + hash) so that orders vary but are reproducible.
 */
export function asyncBF(nodes, edges, src, { seed = 3, slowFactor = 8, unit = false } = {}) {
  const nb = new Map(nodes.map((u) => [u, []]));
  for (const e of edges) { const w = unit ? 1 : e.w; nb.get(e.a).push({ to: e.b, w, e }); nb.get(e.b).push({ to: e.a, w, e }); }
  const dist = new Map(nodes.map((u) => [u, Infinity])), hist = new Map(nodes.map((u) => [u, [[0, Infinity]]]));
  const q = [], msgs = [], cnt = new Map(), changes = new Map(nodes.map((u) => [u, 0])), parent = new Map();
  let k = 0;
  const send = (t, u, h, val) => {
    const key = `${u}>${h.to}`, c = (cnt.get(key) || 0) + 1; cnt.set(key, c);
    const tr = t + (h.e.slow ? slowFactor : 1) * (0.5 + hash01(seed, +u, +h.to, c));
    const m = { from: u, to: h.to, ts: t, tr, val }; msgs.push(m); q.push({ t: tr, k: k++, m }); q.sort((a, b) => a.t - b.t || a.k - b.k);
  };
  const improve = (t, u, val, from) => {
    dist.set(u, val); hist.get(u).push([t, val]); changes.set(u, changes.get(u) + 1); parent.set(u, from);
    for (const h of nb.get(u)) send(t, u, h, val + h.w);
  };
  improve(0, src, 0, null);
  let last = 0;
  while (q.length) {
    const { t, m } = q.shift(); last = t; m.arrived = true;
    if (m.val < dist.get(m.to) - 1e-12) improve(t, m.to, m.val, m.from);
  }
  return { dist, hist, msgs, changes, parent, end: last };
}

/** Exact shortest distances (Dijkstra) for comparison. */
export function dijkstraDist(nodes, edges, src, unit = false) {
  const dist = new Map(nodes.map((u) => [u, Infinity])); dist.set(src, 0);
  const done = new Set();
  for (;;) {
    let u = null;
    for (const [k, t] of dist) if (!done.has(k) && t < Infinity && (u === null || t < dist.get(u))) u = k;
    if (u === null) break; done.add(u);
    for (const e of edges) { const w = unit ? 1 : e.w; if (e.a === u && dist.get(e.b) > dist.get(u) + w) dist.set(e.b, dist.get(u) + w); if (e.b === u && dist.get(e.a) > dist.get(u) + w) dist.set(e.a, dist.get(u) + w); }
  }
  return dist;
}

// ----------------------------------------------------------------------------------------------------------- rings: LCR and Hirschberg-Sinclair
/** Identifier arrangements around a ring (index i = i-th process clockwise). */
export function ringIds(n, kind, seed = 1) {
  if (kind === 'increasing') return range(n).map((i) => i + 1);
  if (kind === 'decreasing') return range(n).map((i) => n - i);
  if (kind === 'bitrev') {
    const m = Math.max(1, Math.ceil(log2(n))), rev = (i) => { let r = 0; for (let b = 0; b < m; b++) if (i & (1 << b)) r |= 1 << (m - 1 - b); return r; };
    const order = range(n).sort((a, b) => rev(a) - rev(b)), ids = new Array(n);
    order.forEach((idx, rank) => { ids[idx] = rank + 1; }); return ids;
  }
  const r = mulberry32(seed * 7919 + n), a = range(n).map((i) => i + 1);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** LCR: ids travel clockwise; a node forwards an id larger than its own, swallows a smaller one, and the id that comes home wins. */
export function lcr(ids) {
  const n = ids.length;
  let toks = ids.map((id, pos) => ({ id, pos, born: pos }));
  const frames = [{ toks: toks.map((t) => ({ ...t })), dead: [], total: 0, leader: null }];
  let total = 0, leader = null, guard = 0;
  while (toks.length && guard++ < 4 * n + 4) {
    const next = [], dead = [];
    for (const t of toks) {
      total++;
      const q = (t.pos + 1) % n;
      if (t.id === ids[q]) { leader = q; dead.push({ ...t, pos: q, won: true }); continue; }
      if (t.id > ids[q]) next.push({ ...t, pos: q }); else dead.push({ ...t, pos: q });
    }
    toks = next;
    frames.push({ toks: toks.map((t) => ({ ...t })), dead, total, leader });
    if (leader != null) break;
  }
  return { total, leader, frames };
}
export const lcrCount = (ids) => lcr(ids).total;

/** Hirschberg-Sinclair: in phase k each candidate probes distance 2^k both ways; it survives if both probes come back. */
export function hs(ids) {
  const n = ids.length, phases = [];
  let cands = range(n), total = 0, leader = null;
  for (let k = 0; k < 14 && leader == null; k++) {
    const L = 2 ** k, probes = [], next = []; let msgs = 0;
    for (const c of cands) {
      let ok = true;
      for (const dir of [1, -1]) {
        let h = 1, killed = null, hit = false;
        for (; h <= L; h++) {
          const q = (((c + dir * h) % n) + n) % n;
          if (q === c) { hit = true; break; }
          if (ids[q] > ids[c]) { killed = q; break; }
          if (h === L) break;
        }
        if (hit) { msgs += h; ok = true; leader = c; probes.push({ c, dir, hops: h, killed: null, hit: true }); continue; }
        if (killed != null) { msgs += h; ok = false; probes.push({ c, dir, hops: h, killed }); } else { msgs += 2 * L; probes.push({ c, dir, hops: L, killed: null }); }
      }
      if (ok) next.push(c);
    }
    total += msgs; phases.push({ k, L, cands, probes, msgs, survivors: next }); cands = leader != null ? [leader] : next;
    if (leader == null && cands.length === 1) leader = cands[0];
  }
  return { total, phases, leader, bound: 8 * n * (Math.ceil(log2(n)) + 1) };
}

/** Order-type classes: processes with the same pattern of relative order in their radius-r window (clockwise) share a class. */
export function orderClasses(ids, r) {
  const n = ids.length, keys = [], map = new Map(), cls = [];
  for (let i = 0; i < n; i++) {
    const w = []; for (let d = -r; d <= r; d++) w.push(ids[(((i + d) % n) + n) % n]);
    keys.push(w.map((x) => { let c = 0; for (const y of w) if (y < x) c++; return c; }).join(','));
  }
  keys.forEach((k, i) => { if (!map.has(k)) map.set(k, []); map.get(k).push(i); });
  const groups = [...map.values()].sort((a, b) => b.length - a.length);
  groups.forEach((g, gi) => g.forEach((i) => { cls[i] = gi; }));
  return { cls, groups, minSize: Math.min(...groups.map((g) => g.length)) };
}

// ----------------------------------------------------------------------------------------------------------- 2.7 anonymous ring: Itai-Rodeh style rounds
/** Exact law of the number of rounds until one candidate remains, from m candidates each drawing uniformly in {1..K}; the max-holders stay. */
export function irLaw(m0, K, R = 60) {
  const logC = (n, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log((n - k + i) / i); return s; };
  const T = new Map();
  const trans = (m) => {
    if (T.has(m)) return T.get(m);
    const P = new Array(m + 1).fill(0);
    for (let j = 1; j <= m; j++) { let s = 0; for (let g = 1; g <= K; g++) { const a = g - 1; if (m - j > 0 && a === 0) continue; s += Math.exp(logC(m, j) - m * Math.log(K) + (m - j > 0 ? (m - j) * Math.log(a) : 0)); } P[j] = s; }
    T.set(m, P); return P;
  };
  let dist = new Array(m0 + 1).fill(0); dist[m0] = 1;
  const cdf = [m0 === 1 ? 1 : 0]; let truncatedMean = 0, mass1 = m0 === 1 ? 1 : 0;
  for (let r = 1; r <= R; r++) {
    const nd = new Array(m0 + 1).fill(0);
    for (let m = 1; m <= m0; m++) { if (!dist[m]) continue; if (m === 1) { nd[1] += dist[1]; continue; } const P = trans(m); for (let j = 1; j <= m; j++) nd[j] += dist[m] * P[j]; }
    dist = nd; cdf.push(nd[1]); truncatedMean += (1 - cdf[r - 1]);
    mass1 = nd[1];
  }
  const pmf = cdf.map((c, r) => c - (r ? cdf[r - 1] : 0));
  // First-step system is triangular except for each state's self-loop.
  const expected = new Array(m0 + 1).fill(0);
  for (let m = 2; m <= m0; m++) {
    const P = trans(m); let rhs = 1;
    for (let j = 2; j < m; j++) rhs += P[j] * expected[j];
    expected[m] = rhs / (1 - K ** (1 - m));
  }
  const mean = expected[m0], remainingMean = dist.reduce((sum, p, m) => sum + p * expected[m], 0);
  return { pmf, cdf, mean, truncatedMean, remainingMean, tail: 1 - mass1 };
}
/** One run: returns rounds [{cands, draws, winners}] until a single candidate remains. */
export function irRun(n, K, r) {
  let cands = range(n); const rounds = [];
  for (let g = 0; g < 200 && cands.length > 1; g++) {
    const draws = cands.map(() => 1 + Math.floor(r() * K)), mx = Math.max(...draws), win = cands.filter((c, i) => draws[i] === mx);
    rounds.push({ cands, draws, winners: win }); cands = win;
  }
  const complete = cands.length === 1;
  return { rounds, leader: complete ? cands[0] : null, complete, candidates: cands.slice() };
}

// ----------------------------------------------------------------------------------------------------------- 2.8 Luby
/** adj: Map id -> [ids]. Returns the rounds of Luby's algorithm with random priorities. */
export function luby(adj, r) {
  let active = new Set(adj.keys()); const inI = new Set(), rounds = [];
  while (active.size) {
    const val = new Map([...active].map((u) => [u, r()])), join = [];
    for (const u of active) { let ok = true; for (const w of adj.get(u)) if (active.has(w) && val.get(w) <= val.get(u)) { ok = false; break; } if (ok) join.push(u); }
    const gone = new Set(join); for (const u of join) for (const w of adj.get(u)) if (active.has(w)) gone.add(w);
    rounds.push({ active: new Set(active), val, join, gone: new Set(gone) });
    for (const u of join) inI.add(u);
    active = new Set([...active].filter((u) => !gone.has(u)));
  }
  return { rounds, inI };
}
/** Random graph G(n, d/n) as an adjacency Map. */
export function randomAdj(n, d, r) {
  const adj = new Map(range(n).map((i) => [i, []]));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (r() < d / n) { adj.get(i).push(j); adj.get(j).push(i); }
  return adj;
}

// ----------------------------------------------------------------------------------------------------------- 2.9 Cole-Vishkin
export const lowDiff = (a, b) => { let x = a ^ b, i = 0; while (x && !(x & 1)) { x >>>= 1; i++; } return i; };
export const bitsOf = (c) => (c === 0 ? 1 : 32 - Math.clz32(c));
/** Rounds of Cole-Vishkin on an oriented ring (successor = i+1): new colour = 2*i + (bit i of own colour), i = lowest differing bit. */
export function coleVishkin(ids) {
  const n = ids.length; let col = ids.slice(); const rounds = [{ col: col.slice(), idx: null }];
  for (let g = 0; g < 12; g++) {
    if (Math.max(...col) < 6) break;
    const idx = col.map((c, i) => lowDiff(c, col[(i + 1) % n]));
    col = col.map((c, i) => 2 * idx[i] + ((c >>> idx[i]) & 1));
    rounds.push({ col: col.slice(), idx });
  }
  return rounds;
}
export const logStar = (x) => { let k = 0; while (x > 1) { x = log2(x); k++; } return k; };

// ----------------------------------------------------------------------------------------------------------- 2.10 GHS (fragment level)
/**
 * Fragment-level simulation of the Gallager-Humblet-Spira rules. edges: [{a, b, w}] with distinct weights; nodes: ids.
 * Each wave: every fragment finds its minimum-weight outgoing edge (MWOE); a fragment whose MWOE leads to a fragment of higher level is absorbed;
 * two fragments of equal level that chose the same edge merge into a fragment of level + 1; others wait.
 */
export function ghs(nodes, edges) {
  const frag = new Map(nodes.map((u) => [u, u])), level = new Map(nodes.map((u) => [u, 0])), inT = new Set(), frames = [];
  const snap = (note, mw, extra = {}) => frames.push({ frag: new Map(frag), level: new Map(level), tree: new Set(inT), mw: mw ? new Map(mw) : null, note, ...extra });
  snap('Every node is a fragment of level 0.', null);
  const groups = () => { const g = new Map(); for (const [u, f] of frag) { if (!g.has(f)) g.set(f, []); g.get(f).push(u); } return g; };
  for (let wave = 1; wave < 40; wave++) {
    const g = groups(); if (g.size <= 1) break;
    const mw = new Map();
    for (const f of g.keys()) { let best = null; for (const e of edges) { if ((frag.get(e.a) === f) === (frag.get(e.b) === f)) continue; if (!best || e.w < best.w) best = e; } if (best) mw.set(f, best); }
    if (!mw.size) break;
    snap(`Wave ${wave}: each fragment finds its minimum-weight outgoing edge (orange).`, mw, { phase: 'find' });
    const act = [];
    for (const [f, e] of mw) {
      const o = frag.get(e.a) === f ? frag.get(e.b) : frag.get(e.a), mo = mw.get(o);
      if (level.get(f) < level.get(o)) act.push({ f, o, e, kind: 'absorb' });
      else if (level.get(f) === level.get(o) && mo === e && f < o) act.push({ f, o, e, kind: 'merge' });
    }
    // union the acting pairs
    const uf = new Map([...g.keys()].map((f) => [f, f])), find = (f) => (uf.get(f) === f ? f : (uf.set(f, find(uf.get(f))), uf.get(f)));
    const cores = new Set();
    for (const a of act) { uf.set(find(a.f), find(a.o)); inT.add(a.e); if (a.kind === 'merge') cores.add(a.f); }
    const newLevel = new Map(), root = new Map();
    for (const f of g.keys()) { const r = find(f); root.set(f, r); newLevel.set(r, Math.max(newLevel.get(r) ?? 0, level.get(f))); }
    for (const f of cores) { const r = find(f); newLevel.set(r, level.get(f) + 1); }
    for (const [u, f] of frag) { frag.set(u, root.get(f)); }
    for (const [r, l] of newLevel) level.set(r, l);
    for (const f of [...level.keys()]) if (!new Set(frag.values()).has(f)) level.delete(f);
    snap(`Wave ${wave}: ${act.filter((a) => a.kind === 'merge').length} merge${act.filter((a) => a.kind === 'merge').length === 1 ? '' : 's'} (equal levels, same edge: level + 1), ${act.filter((a) => a.kind === 'absorb').length} absorption${act.filter((a) => a.kind === 'absorb').length === 1 ? '' : 's'} (lower level joins higher).`, null, { phase: 'merge', act, prevMw: mw });
  }
  return { frames, tree: inT };
}
export function kruskal(nodes, edges) {
  const p = new Map(nodes.map((u) => [u, u])), f = (u) => (p.get(u) === u ? u : (p.set(u, f(p.get(u))), p.get(u))), out = [];
  for (const e of [...edges].sort((a, b) => a.w - b.w)) { const x = f(e.a), y = f(e.b); if (x !== y) { p.set(x, y); out.push(e); } }
  return out;
}

// ----------------------------------------------------------------------------------------------------------- 2.11 synchronizers
/**
 * Synchronous BFS from `root` run for `pulses` pulses through synchronizer alpha or beta on a network whose edge delays are d(a,b).
 * Returns per-pulse start times for each node, and message counts.
 */
export function synchronize(adj, root, d, kind, pulses) {
  const nodes = [...adj.keys()];
  const level = new Map([[root, 0]]); const q = [root];
  for (let i = 0; i < q.length; i++) for (const w of adj.get(q[i])) if (!level.has(w)) { level.set(w, level.get(q[i]) + 1); q.push(w); }
  // algorithm messages in pulse p: BFS nodes of level p-1 send to all neighbours except the parent (a node of level l has any neighbour of level l-1 as parent; pick smallest id)
  const parent = new Map([[root, null]]);
  for (const u of nodes) if (level.has(u) && u !== root) parent.set(u, adj.get(u).filter((w) => level.get(w) === level.get(u) - 1).sort((a, b) => a - b)[0]);
  const app = (p) => { const out = []; for (const u of nodes) if (level.get(u) === p - 1) for (const w of adj.get(u)) if (w !== parent.get(u)) out.push([u, w]); return out; };
  // beta tree: BFS tree rooted at root
  const T0 = new Map(nodes.map((u) => [u, 0])), starts = [T0]; let appMsgs = 0, ctrl = 0;
  const m = [...adj.values()].reduce((s, a) => s + a.length, 0) / 2;
  const height = Math.max(0, ...[...level.values()]);
  const treeDelay = new Map([[root, 0]]); for (const u of q) if (u !== root) treeDelay.set(u, treeDelay.get(parent.get(u)) + d(u, parent.get(u)));
  for (let p = 1; p <= pulses; p++) {
    const prev = starts[p - 1], msgs = app(p);
    appMsgs += msgs.length;
    // node u is safe once all its pulse-p messages are acknowledged (round trip)
    const safe = new Map(nodes.map((u) => [u, prev.get(u)]));
    for (const [u, w] of msgs) safe.set(u, Math.max(safe.get(u), prev.get(u) + 2 * d(u, w)));
    const nxt = new Map();
    if (kind === 'alpha') {
      for (const u of nodes) { let t = safe.get(u); for (const w of adj.get(u)) t = Math.max(t, safe.get(w) + d(w, u)); nxt.set(u, t); }
      ctrl += 2 * m + msgs.length;
    } else {
      const up = new Map();
      for (const u of [...q].reverse()) { let t = safe.get(u); for (const w of adj.get(u)) if (parent.get(w) === u) t = Math.max(t, up.get(w) + d(w, u)); up.set(u, t); }
      for (const u of nodes) nxt.set(u, up.get(root) + (treeDelay.get(u) ?? 0));
      ctrl += 2 * (q.length - 1) + msgs.length;
    }
    starts.push(nxt);
  }
  return { starts, appMsgs, ctrl, level, parent, order: q, height, m };
}

// ----------------------------------------------------------------------------------------------------------- 2.12 Dijkstra-Scholten
/**
 * Diffusing computation on an undirected graph. Receiving a work message starts a job of length `job`; at its end the node
 * sends 0-2 new work messages (depth-limited, seeded). Every work message is acknowledged: at once if the receiver is already engaged,
 * otherwise (it becomes a child) only when the receiver has finished and all its own messages are acknowledged.
 * mode 'ds' = Dijkstra-Scholten detection; 'naive' = root declares when its own jobs are done.
 */
export function diffuse(adj, root, { p = 0.7, depth = 5, job = 0.7, seed = 4, delay = (a, b, c) => 0.4 + 0.8 * hash01(seed, a, b, c), mode = 'ds' } = {}) {
  const nodes = [...adj.keys()], pending = new Map(nodes.map((u) => [u, 0])), deficit = new Map(nodes.map((u) => [u, 0])), par = new Map(nodes.map((u) => [u, null]));
  const engaged = new Set([root]), q = [], msgs = [], cnt = new Map(), jobs = [], eng = [{ u: root, t0: 0, t1: null, par: null }];
  let k = 0, declared = null, trueEnd = 0, nWork = 0;
  const push = (e) => { e.k = k++; q.push(e); q.sort((a, b) => a.t - b.t || a.k - b.k); };
  const send = (t, a, b, kind, extra = {}) => {
    const key = `${a}>${b}`, c = (cnt.get(key) || 0) + 1; cnt.set(key, c);
    const m = { from: a, to: b, ts: t, tr: t + delay(+a, +b, c), kind, ...extra }; msgs.push(m); push({ t: m.tr, type: 'recv', m });
    if (kind === 'work') { deficit.set(a, deficit.get(a) + 1); nWork++; }
  };
  const startJob = (t, u, gen) => { pending.set(u, pending.get(u) + 1); const te = t + job * (0.6 + 0.8 * hash01(seed, +u, gen, nWork)); jobs.push({ u, t0: t, t1: te }); push({ t: te, type: 'jobEnd', u, gen }); };
  const check = (t, u) => {
    if (pending.get(u) > 0 || deficit.get(u) > 0 || !engaged.has(u)) return;
    if (u === root) { if (mode === 'ds' && declared == null) declared = t; return; }
    const pa = par.get(u); engaged.delete(u); for (let i = eng.length - 1; i >= 0; i--) if (eng[i].u === u && eng[i].t1 == null) { eng[i].t1 = t; break; } par.set(u, null); send(t, u, pa, 'ack', { tree: true });
  };
  startJob(0, root, 0);
  let guard = 0;
  while (q.length && guard++ < 5000) {
    const e = q.shift(), t = e.t;
    if (e.type === 'recv') {
      const m = e.m; m.done = true;
      if (m.kind === 'work') {
        if (!engaged.has(m.to)) { engaged.add(m.to); par.set(m.to, m.from); m.adopt = true; eng.push({ u: m.to, t0: t, t1: null, par: m.from }); } else send(t, m.to, m.from, 'ack');
        startJob(t, m.to, m.gen); trueEnd = Math.max(trueEnd, t);
      } else { deficit.set(m.to, deficit.get(m.to) - 1); check(t, m.to); }
    } else {
      const u = e.u; pending.set(u, pending.get(u) - 1); trueEnd = Math.max(trueEnd, t);
      if (e.gen < depth) {
        const nb = adj.get(u), c = hash01(seed, +u, e.gen, nWork, 5) < p ? (hash01(seed, +u, e.gen, nWork, 9) < p * 0.6 ? 2 : 1) : 0;
        for (let i = 0; i < c; i++) { const w = nb[Math.floor(hash01(seed, +u, e.gen, nWork, 31 + i) * nb.length)]; send(t, u, w, 'work', { gen: e.gen + 1 }); }
      }
      if (u === root && mode === 'naive' && declared == null && pending.get(u) === 0) declared = t;
      check(t, u);
    }
  }
  return { msgs, jobs, eng, declared, trueEnd, nWork, end: Math.max(...msgs.map((m) => m.tr), trueEnd) };
}
