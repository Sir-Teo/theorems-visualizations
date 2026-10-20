// Scoped deterministic, perfect-information finite-tree models and a bounded local inspector.
import { leaf, dec, prep, randTree } from './ch04.shared.js';
export const TREE_EXAMPLES = {
  entry: () => dec(1, [['Out', leaf(0, 2)], ['In', dec(2, [['Fight', leaf(-1, -1)], ['Accept', leaf(1, 1)]])]]),
  react: () => dec(1, [['L', dec(2, [['l', leaf(3, 1)], ['r', leaf(0, 0)]])], ['R', dec(2, [['l', leaf(1, 0)], ['r', leaf(2, 2)]])]]),
  centi: () => dec(1, [['Take', leaf(1, 0)], ['Pass', dec(2, [['Take', leaf(0, 2)], ['Pass', dec(1, [['Take', leaf(3, 1)], ['Pass', leaf(2, 4)]])]])]]),
};
export const entryTree = (fight, entrant) => prep(dec(1, [['Out', leaf(0, 2)], ['In', dec(2, [['Fight', leaf(entrant, fight)], ['Accept', leaf(1, 1)]])]]));
export const randomFiniteTree = (rng, depth, branching, maxPayoff = 9) => {
  if (![2, 3, 4, 5].includes(depth) || ![2, 3].includes(branching)) throw new RangeError('unsupported finite-tree dimensions');
  return prep(randTree(rng, depth, branching, 0, maxPayoff));
};
/** Validate a prepared tree: IDs identify complete-profile choices and must be present and unique. */
export function validateFiniteTree(root) {
  const seen = new Set(), ids = new Set(), infos = new Set(); let players;
  const walk = n => {
    if (!n || typeof n !== 'object' || seen.has(n)) throw new TypeError('finite tree requires distinct nodes, with no cycles or merged branches');
    seen.add(n); if (typeof n.id !== 'string' || !n.id || ids.has(n.id)) throw new TypeError('prepared tree requires unique nonempty node ids'); ids.add(n.id);
    if (n.kids == null) { if (!Array.isArray(n.u) || !n.u.length || n.u.some(x => !Number.isFinite(x))) throw new TypeError('finite terminal payoff vector required'); players ??= n.u.length; if (n.u.length !== players) throw new TypeError('inconsistent payoff dimensions'); return; }
    if (!Array.isArray(n.kids) || !n.kids.length || !Number.isInteger(n.p) || n.p < 1) throw new TypeError('nonempty player action set required; chance is outside this model');
    if (n.info != null) { if (infos.has(n.info)) throw new TypeError('shared information sets are outside this perfect-information model'); infos.add(n.info); }
    if (new Set(n.kids.map(k => k.a)).size !== n.kids.length) throw new TypeError('actions must be distinct at each node');
    n.kids.forEach(k => walk(k.n));
  }; walk(root);
  for (const n of seen) if (n.kids && n.p > players) throw new TypeError('mover outside player set');
  return { players, nodes: [...seen] };
}
/** One coherent continuation profile: ties use the first or last listed action, then ancestors are recomputed. */
export function solveFiniteTree(root, tie = 'first') {
  validateFiniteTree(root); if (!['first', 'last'].includes(tie)) throw new RangeError('unknown tie rule');
  const values = new Map(), ties = new Map(), profile = {}, order = [];
  const go = n => {
    if (!n.kids) { values.set(n, n.u.slice()); return n.u; }
    const child = n.kids.map(k => go(k.n)), best = Math.max(...child.map(u => u[n.p - 1]));
    const options = child.flatMap((u, i) => u[n.p - 1] === best ? [i] : []), a = options[tie === 'first' ? 0 : options.length - 1];
    profile[n.id] = a; ties.set(n, options); values.set(n, child[a].slice()); order.push(n); return child[a];
  }; const value = go(root); return { value, values, ties, profile, order };
}
/** Actual full-strategy deviations, separately in every subgame; no equilibrium assumption is used. */
export function checkFiniteProfile(root, profile) {
  const { players, nodes } = validateFiniteTree(root), values = new Map(), best = new Map(), badSet = new Set();
  for (const n of nodes) if (n.kids && (!Number.isInteger(profile[n.id]) || profile[n.id] < 0 || profile[n.id] >= n.kids.length)) throw new RangeError('incomplete or invalid profile');
  const go = n => {
    if (!n.kids) { values.set(n, n.u.slice()); best.set(n, n.u.slice()); return; }
    n.kids.forEach(k => go(k.n)); const chosen = n.kids[profile[n.id]].n, u = values.get(chosen).slice();
    const deviations = Array.from({ length: players }, (_, j) => n.p === j + 1 ? Math.max(...n.kids.map(k => best.get(k.n)[j])) : best.get(chosen)[j]);
    values.set(n, u); best.set(n, deviations); if (deviations.some((x, j) => x > u[j])) badSet.add(n);
  }; go(root);
  return { values, best, badSet, bad: badSet.size, total: nodes.filter(n => n.kids).length, nash: !badSet.has(root), spe: badSet.size === 0, value: values.get(root) };
}
export function entryEquilibria(fight, entrant) {
  const P = entryTree(fight, entrant), nash = [], spe = [];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const c = checkFiniteProfile(P.root, { n0: i, n2: j }); if (c.nash) nash.push([i, j]); if (c.spe) spe.push([i, j]); }
  return { P, nash, spe };
}
export function binaryTreeCounts(depth) {
  if (!Number.isInteger(depth) || depth < 0 || depth > 30) throw new RangeError('bounded integer depth required');
  const decisions = 2 ** depth - 1; return { decisions, profilesLog10: decisions * Math.log10(2), nodesLog10: decisions ? Math.log10(decisions) : null };
}
export function nodeHistory(n) { const a = []; for (let p = n; p.par; p = p.par) a.unshift(p.par.kids[p.pa].a); return a.length ? a.join(' → ') : 'root'; }

/** At most one node plus its immediate children: all original nodes remain reachable by preorder and parent/child navigation. */
export function finiteTreeInspector(v, stage, getP, { onNavigate = () => {}, maxNodes = 121 } = {}) {
  let index = 0, shown = [];
  const go = i => { index = Math.max(0, Math.min(getP().nodes.length - 1, i)); onNavigate(); v.invalidate(); };
  v.button('root node', () => go(0)); v.button('parent node', () => { const n = getP().nodes[index]; go(n.par ? getP().nodes.indexOf(n.par) : 0); });
  v.button('previous node', () => go(index - 1)); v.button('next node', () => go(index + 1));
  stage.onClick((x, y) => { const p = shown.find(p => Math.hypot(stage.X(p.x) - stage.X(x), stage.Y(p.y) - stage.Y(y)) < 20); if (p) go(getP().nodes.indexOf(p.n)); });
  v.shareState('inspected finite-tree node', { get: () => index, validate: x => Number.isInteger(x) && x >= 0 && x < maxNodes,
    set: x => { if (x >= getP().nodes.length) throw new Error('Saved node is outside this tree.'); index = x; } });
  const draw = (o = {}) => {
    const P = getP(); if (o.focus) index = P.nodes.indexOf(o.focus); index = Math.max(0, Math.min(P.nodes.length - 1, index));
    const n = P.nodes[index]; stage.setView([0, 1], [0, 1]); shown = [{ n, x: .5, y: .78 }];
    const fmt = u => `(${u.map(x => String(x).replace('-', '−')).join(', ')})`, col = x => x.p === 1 ? 'blue' : x.p === 2 ? 'orange' : 'muted';
    const node = (p, root = false) => {
      const { n: a, x, y } = p, color = col(a);
      stage.dot(x, y, { r: a.kids ? 8 : 4, color: a.kids ? color : 'muted' });
      if (o.badSet?.has(a)) stage.dot(x, y, { r: 12, hollow: true, color: 'red', width: 2 });
      stage.text(`${a.id} · ${a.kids ? `P${a.p}` : 'end'}`, x, y + .11, { align: 'center', size: 11.5, color, weight: 700 });
      const value = a.kids ? o.values?.get(a) : a.u;
      stage.text(value ? fmt(value) : 'not valued', x, y - .12, { align: 'center', size: 12, color: a.kids ? 'green' : 'ink', weight: 700, plate: true });
      if (!root && a.kids) stage.text('click to open', x, y - .23, { align: 'center', size: 10, color: 'muted' });
    };
    if (n.kids) n.kids.forEach((k, i) => {
      const p = { n: k.n, x: (i + .5) / n.kids.length, y: .3 }, chosen = o.profile?.[n.id] === i, tied = o.ties?.get(n)?.includes(i), color = chosen ? 'gold' : tied ? 'green' : 'muted';
      stage.line(.5, .78, p.x, p.y, { color, width: chosen ? 3.5 : 1.5 });
      stage.text(k.a, (.5 + p.x) / 2, .56, { align: 'center', size: 12, color: chosen ? 'gold' : 'ink', plate: true, weight: 700 }); shown.push(p);
    });
    shown.forEach((p, i) => node(p, i === 0));
    return { node: n, index, shown: shown.map(p => p.n.id), history: nodeHistory(n) };
  };
  return { draw, go: n => go(typeof n === 'number' ? n : getP().nodes.indexOf(n)), get node() { return getP().nodes[index]; }, reset: () => { index = 0; } };
}
