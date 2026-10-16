// Game Theory & Social Choice — Chapter 4: helpers shared by ch04.js and ch04-b.js (plain named exports).
// Re-exports the Chapter 3 helpers. Adds a small game-tree engine (nodes, information sets, backward induction,
// pure-strategy enumeration, strategic form, behaviour-strategy outcomes) and a tree drawing routine.
//
// Tree node: leaf = { u: [u1, u2] };  decision node = { p: 1 | 2, kids: [{ a: 'label', n: node }], info?: 'I' };
// chance node = { p: 0, kids: [{ a, pr, n }] }. Nodes sharing an `info` id belong to one information set.
export * from './ch03.shared.js';

export const leaf = (u1, u2) => ({ u: [u1, u2] });
export const dec = (p, kids, info) => ({ p, kids: kids.map(([a, n, pr]) => ({ a, n, pr })), info });
export const isLeaf = (n) => !n.kids;

/** Assign ids / depth / layout positions; returns { nodes, leaves, depth, edges }. Leaves are spaced evenly in x. */
export function prep(root) {
  const nodes = [], leaves = [], edges = [];
  let depth = 0;
  (function walk(n, d, par, a) {
    n.id = 'n' + nodes.length; n.d = d; n.par = par; n.pa = a; nodes.push(n); depth = Math.max(depth, d);
    if (isLeaf(n)) { n.x = leaves.length; leaves.push(n); return; }
    n.kids.forEach((k, i) => { walk(k.n, d + 1, n, i); edges.push({ from: n, to: k.n, i, a: k.a, pr: k.pr }); });
    n.x = (n.kids[0].n.x + n.kids[n.kids.length - 1].n.x) / 2;
  })(root, 0, null, -1);
  nodes.forEach((n) => { n.y = -n.d; n.key = n.info || n.id; });
  return { nodes, leaves, depth, edges, root, nl: leaves.length };
}

/** Backward induction: sets n.v = payoff pair, n.bi = indices of optimal children (all ties). Mutates and returns root.v. */
export function backward(root) {
  (function go(n) {
    if (isLeaf(n)) { n.v = n.u; n.bi = []; return n.v; }
    const vs = n.kids.map((k) => go(k.n));
    if (n.p === 0) { n.v = [0, 1].map((j) => n.kids.reduce((s, k, i) => s + k.pr * vs[i][j], 0)); n.bi = n.kids.map((_, i) => i); return n.v; }
    const j = n.p - 1, best = Math.max(...vs.map((x) => x[j]));
    n.bi = vs.map((x, i) => (Math.abs(x[j] - best) < 1e-9 ? i : -1)).filter((i) => i >= 0);
    n.v = vs[n.bi[0]]; return n.v;
  })(root);
  return root.v;
}

/** Information-set keys of player p (in order of first appearance) with their action counts. */
export function infoSets(P, p) {
  const m = new Map();
  P.nodes.forEach((n) => { if (n.p === p && !m.has(n.key)) m.set(n.key, { key: n.key, na: n.kids.length, nodes: [] }); if (n.p === p) m.get(n.key).nodes.push(n); });
  return [...m.values()];
}
/** All pure strategies of player p: array of { key: actionIndex } maps. */
export function pureStrategies(P, p) {
  let out = [{}];
  infoSets(P, p).forEach((I) => { const nx = []; out.forEach((s) => { for (let a = 0; a < I.na; a++) nx.push({ ...s, [I.key]: a }); }); out = nx; });
  return out;
}
/** Strategy label such as "L,r" (action labels in info-set order; only reachable-irrelevant choices included). */
export function stratName(P, p, s) {
  return infoSets(P, p).map((I) => I.nodes[0].kids[s[I.key]].a).join('');
}
/** Expected payoff pair when each player uses a behaviour strategy beta[key] = probability vector (pure map allowed via asBeh). */
export function playBeh(P, beh) {
  const leafP = new Map(); let u = [0, 0];
  (function go(n, w) {
    if (w === 0) return;
    if (isLeaf(n)) { leafP.set(n, (leafP.get(n) || 0) + w); u = [u[0] + w * n.u[0], u[1] + w * n.u[1]]; return; }
    n.kids.forEach((k, i) => { const pr = n.p === 0 ? k.pr : beh[n.key] ? beh[n.key][i] : 0; go(k.n, w * pr); });
  })(P.root, 1);
  return { u, leafP };
}
export const asBeh = (P, s1, s2) => {
  const b = {};
  P.nodes.forEach((n) => { if (n.p === 1 || n.p === 2) { const s = n.p === 1 ? s1 : s2; b[n.key] = n.kids.map((_, i) => (s[n.key] === i ? 1 : 0)); } });
  return b;
};
/** Strategic form of a two-player tree: { S1, S2, U[i][j] = [u1, u2] }. */
export function strategicForm(P) {
  const S1 = pureStrategies(P, 1), S2 = pureStrategies(P, 2);
  return { S1, S2, U: S1.map((a) => S2.map((b) => playBeh(P, asBeh(P, a, b)).u)) };
}
/** Pure Nash equilibria of a bimatrix of pairs: list of [i, j]. */
export function pureNash(U) {
  const out = [];
  U.forEach((r, i) => r.forEach((c, j) => {
    if (U.every((rr) => rr[j][0] <= c[0] + 1e-9) && r.every((cc) => cc[1] <= c[1] + 1e-9)) out.push([i, j]);
  }));
  return out;
}
/** The path of the (first) subgame-perfect profile, as the list of nodes visited from the root. */
export function bpath(root) {
  const out = [root]; let n = root;
  while (!isLeaf(n) && n.bi.length) { n = n.kids[n.bi[0]].n; out.push(n); }
  return out;
}

/**
 * Draw a prepared tree on stage s whose view is set by treeView. o: edgeColor(e) / edgeWidth(e) / nodeFill(n) / nodeRing(n) /
 * leafText(n) (override), showPay (true), labelEdges (true), hot (node), values (show n.v under decision nodes).
 */
export function treeView(P, pad = 0.6) {
  return { x: [-pad, Math.max(1, P.nl - 1) + pad], y: [-P.depth - 0.95, 0.65] };
}
const pcol = (p) => (p === 1 ? 'blue' : p === 2 ? 'orange' : 'muted');
export function drawTree(s, P, o = {}) {
  const sz = o.size || 12.5;
  P.edges.forEach((e) => {
    const col = o.edgeColor ? o.edgeColor(e) : 'muted', w = o.edgeWidth ? o.edgeWidth(e) : 1.6;
    s.line(e.from.x, e.from.y, e.to.x, e.to.y, { color: col || 'muted', width: w, alpha: col ? 1 : 0.8 });
    if (o.labelEdges !== false) {
      const t = 0.5, lx = e.from.x + (e.to.x - e.from.x) * t, ly = e.from.y + (e.to.y - e.from.y) * t;
      const lab = e.pr != null && e.from.p === 0 ? `${e.a} ${e.pr}` : e.a;
      s.text(lab, lx + (e.to.x < e.from.x ? -0.06 : e.to.x > e.from.x ? 0.06 : 0.08), ly + 0.02, { size: sz - 1, color: o.labelColor ? o.labelColor(e) : 'ink', align: e.to.x < e.from.x ? 'right' : 'left', baseline: 'middle', weight: 600, plate: true });
    }
  });
  // information sets: dashed bars through the nodes of a set
  const sets = new Map();
  P.nodes.forEach((n) => { if (n.info) { if (!sets.has(n.info)) sets.set(n.info, []); sets.get(n.info).push(n); } });
  sets.forEach((ns) => {
    if (ns.length < 2) return;
    const sorted = ns.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    for (let i = 0; i + 1 < sorted.length; i++) {
      const a = sorted[i], b = sorted[i + 1], pc = pcol(a.p);
      if (a.y === b.y) s.line(a.x, a.y, b.x, b.y, { color: pc, width: 5, alpha: 0.35, dash: [6, 5] });
      else s.path([[a.x, a.y], [Math.min(a.x, b.x) - 0.28, (a.y + b.y) / 2], [b.x, b.y]], { color: pc, width: 4, alpha: 0.4, dash: [6, 5] });
    }
  });
  P.nodes.forEach((n) => {
    if (isLeaf(n)) {
      if (o.nodeFill && o.nodeFill(n)) s.dot(n.x, n.y, { r: 5, color: o.nodeFill(n) }); else s.dot(n.x, n.y, { r: 3.5, color: 'muted' });
      if (o.showPay !== false) {
        if (o.leafText) s.text(o.leafText(n), n.x, n.y - 0.1, { align: 'center', baseline: 'top', size: sz, color: 'ink', weight: 700 });
        else {
          s.text(`${nmz(n.u[0])}`, n.x - 0.05, n.y - 0.1, { align: 'right', baseline: 'top', size: sz, color: 'blue', weight: 700 });
          s.text(',', n.x, n.y - 0.1, { align: 'center', baseline: 'top', size: sz, color: 'muted' });
          s.text(`${nmz(n.u[1])}`, n.x + 0.05, n.y - 0.1, { align: 'left', baseline: 'top', size: sz, color: 'orange', weight: 700 });
        }
      }
      return;
    }
    const col = pcol(n.p), fill = o.nodeFill ? o.nodeFill(n) : null;
    s.dot(n.x, n.y, { r: n.p === 0 ? 6 : 8, color: fill || col, hollow: !fill && !n.p });
    if (o.nodeRing && o.nodeRing(n)) s.dot(n.x, n.y, { r: 12, color: o.nodeRing(n), hollow: true });
    const tag = o.nodeTag ? o.nodeTag(n) : (n.p ? `${n.p}` : 'c');
    if (tag) s.text(tag, n.x, n.y + 0.2, { align: 'center', baseline: 'bottom', size: sz - 1, color: col, weight: 800 });
    if (o.values && n.v && o.values(n)) s.text(`${nmz(n.v[0])}, ${nmz(n.v[1])}`, n.x + 0.14, n.y + 0.02, { align: 'left', baseline: 'middle', size: sz - 2, color: 'green', weight: 700, plate: true });
  });
}
export const nmz = (x) => String(Math.round(x * 100) / 100).replace('-', '−');

/** Nearest node to a data point (within r data units), or null. */
export function pickNode(P, x, y, r = 0.3) {
  let best = null, bd = r;
  P.nodes.forEach((n) => { const d = Math.hypot(n.x - x, n.y - y); if (d < bd) { bd = d; best = n; } });
  return best;
}

/** Random tree: depth levels, branching b (2 or 3), payoffs integers 0..9, players alternate starting with 1. */
export function randTree(rng, depth, b = 2, lo = 0, hi = 9) {
  const go = (d) => {
    if (d === depth) return leaf(rng.int(lo, hi), rng.int(lo, hi));
    return dec((d % 2) + 1, Array.from({ length: b }, (_, i) => [String.fromCharCode(97 + i + (d % 2) * 0), go(d + 1)]));
  };
  return go(0);
}

// ---------------------------------------------------------------- finite combinatorial games
/** Memoised solver for a game given as { moves(state) → states, key(state) }; value for the player to move: 1 win, 0 draw, −1 loss.
 *  terminal(state) → null | value for the player to move (when the position is over). */
export function solveGame(G, start) {
  const memo = new Map();
  const go = (st) => {
    const k = G.key(st); if (memo.has(k)) return memo.get(k);
    const t = G.terminal ? G.terminal(st) : null;
    let val;
    if (t != null) val = t;
    else {
      const ms = G.moves(st);
      if (!ms.length) val = 0;
      else { val = -1; for (const m of ms) { const r = -go(m); if (r > val) val = r; if (val === 1) break; } }
    }
    memo.set(k, val); return val;
  };
  go(start);
  return { value: (st) => go(st), memo };
}
