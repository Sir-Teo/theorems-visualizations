// Theory of Computation — Chapter 2: helpers shared by ch02.js and ch02-b.js (plain named exports).
// A DFA is { alpha: ['a','b'], states: [{id, x, y, acc, label?}], start, delta: {id: {sym: [targets]}}, startDir?, loops? }.
// Targets are arrays so that a reader can "break" a machine: [] = missing arrow (implicit dead state), two or more = not a DFA.

export const EPS = 'ε';
export const DEAD = '∅';
export const sh = (w) => (w === '' ? EPS : w);
export const SUBS = '₀₁₂₃₄₅₆₇₈₉';
export const subN = (k) => String(k).split('').map((d) => SUBS[+d]).join('');
export function layer(alpha, n) { let L = ['']; for (let i = 0; i < n; i++) { const nx = []; for (const u of L) for (const c of alpha) nx.push(u + c); L = nx; } return L; }
export function upTo(alpha, n) { const out = []; for (let k = 0; k <= n; k++) out.push(...layer(alpha, k)); return out; }
export const MONO = (size, weight = 500) => `${weight} ${size}px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`;
export const SANS = (size, weight = 500) => `${weight} ${size}px Inter, system-ui, sans-serif`;

/** Pixel pen: sets the stage view to its pixel box and draws in CSS pixels from the top-left corner (y downwards). */
export function pen(s, v) {
  s.setView([0, s.width], [0, s.height]);
  const c = s.ctx, H = s.height, U = (y) => H - y;
  const P = {
    W: s.width, H, c,
    tw(str, size = 13, weight = 500, font = MONO) { c.save(); c.font = font(size, weight); const w = c.measureText(String(str)).width; c.restore(); return w; },
    box(x, y, w, h, o = {}) {
      c.save(); c.beginPath();
      const r = Math.max(0, Math.min(o.r ?? 5, w / 2, h / 2));
      if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
      if (o.fill) { c.fillStyle = v.color(o.fill, o.alpha ?? 0.22); c.fill(); }
      if (o.stroke !== false) { c.lineWidth = o.width ?? 1.2; c.strokeStyle = v.color(o.stroke || o.fill || 'muted', o.strokeAlpha); if (o.dash) c.setLineDash(o.dash === true ? [4, 3] : o.dash); c.stroke(); }
      c.restore();
    },
    text(str, x, y, o = {}) {
      c.save(); c.font = (o.font || MONO)(o.size ?? 13, o.weight ?? 500); c.textAlign = o.align || 'center'; c.textBaseline = o.baseline || 'middle';
      if (o.halo) { c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = v.color('panel', 0.92); c.strokeText(String(str), x, y); }
      c.fillStyle = v.color(o.color || 'ink', o.alpha); c.fillText(String(str), x, y); c.restore();
    },
    sans(str, x, y, o = {}) { P.text(str, x, y, { font: SANS, ...o }); },
    line(x1, y1, x2, y2, st = {}) { s.line(x1, U(y1), x2, U(y2), st); },
    arrow(x1, y1, x2, y2, st = {}) { s.arrow(x1, U(y1), x2, U(y2), st); },
    path(pts, st = {}) { s.path(pts.map((q) => q && [q[0], U(q[1])]), st); },
    dot(x, y, st = {}) { s.dot(x, U(y), st); },
    circle(x, y, r, st = {}) { s.circle(x, U(y), r, st); },
    tex(str, x, y, st = {}) { s.texPx(str, x, y, st); },
  };
  return P;
}
export const clickPx = (s, fn) => s.onClick((x, y) => fn(x, s.height - y));
/** On-screen keyboard: one button per letter, plus backspace and clear. */
export function keypad(v, letters, get, set, o = {}) {
  const max = o.max ?? 10, keys = {};
  for (const c of letters) keys[c] = v.button(o.label ? o.label(c) : c, () => { if (get().length < max) set(get() + c); });
  keys.back = v.button('⌫', () => set(get().slice(0, -1)));
  if (o.clear !== false) keys.clear = v.button('clear', () => set(''));
  return keys;
}

// ---------------------------------------------------------------- automata
/** Build a DFA: states = [[id, x, y, acc, label?], …]; delta = {id: {sym: target | [targets] | null}}. */
export function dfa(alpha, states, start, delta, extra = {}) {
  const D = { alpha, start, states: states.map(([id, x, y, acc, label]) => ({ id, x, y, acc: !!acc, label: label ?? texName(id) })), delta: {}, ...extra };
  for (const s of D.states) { D.delta[s.id] = {}; for (const c of alpha) { const t = delta[s.id]?.[c]; D.delta[s.id][c] = t == null ? [] : Array.isArray(t) ? t.slice() : [t]; } }
  return D;
}
/** 'q0' → '$q_{0}$', 'E' → '$E$', '01' stays as plain text in TeX. */
export function texName(id) { const m = /^([a-zA-Z]+)(\d+)$/.exec(String(id)); return m ? `$${m[1]}_{${m[2]}}$` : `$\\mathrm{${id}}$`; }
export function cloneD(D) { return { ...D, states: D.states.map((s) => ({ ...s })), delta: Object.fromEntries(Object.entries(D.delta).map(([q, r]) => [q, Object.fromEntries(Object.entries(r).map(([c, t]) => [c, t.slice()]))])) }; }
export const tgt = (D, q, c) => (q === DEAD ? [DEAD] : D.delta[q]?.[c] || []);
export const isAcc = (D, q) => q !== DEAD && !!D.states.find((s) => s.id === q)?.acc;
/** Problems that stop D from being a (complete) DFA. */
export function check(D) {
  const missing = [], multi = [];
  for (const s of D.states) for (const c of D.alpha) { const t = tgt(D, s.id, c); if (!t.length) missing.push([s.id, c]); else if (t.length > 1) multi.push([s.id, c, t]); }
  return { missing, multi, ok: !multi.length, complete: !missing.length && !multi.length };
}
/** Total transition function of a deterministic D, with missing arrows going to the dead state. */
export const step = (D, q, c) => { if (q === DEAD) return DEAD; const t = tgt(D, q, c); return t.length ? t[0] : DEAD; };
/** Run D on w: {path, fell (first index read into the dead state, or −1), stuck (index of a nondeterministic choice, or −1), acc}. */
export function run(D, w) {
  const path = [D.start]; let q = D.start, fell = -1, stuck = -1;
  for (let i = 0; i < w.length; i++) {
    const t = tgt(D, q, w[i]);
    if (q !== DEAD && t.length > 1) { stuck = i; break; }
    const r = q === DEAD ? DEAD : t.length ? t[0] : DEAD;
    if (r === DEAD && q !== DEAD) fell = i;
    path.push(r); q = r;
  }
  return { path, fell, stuck, acc: stuck >= 0 ? null : isAcc(D, q) };
}
export const accepts = (D, w) => run(D, w).acc;
/** Breadth-first search from the start state: {dist, via (shortest string reaching each state), order}. */
export function reach(D, from = D.start) {
  const via = { [from]: '' }, order = [from], q = [from];
  while (q.length) { const u = q.shift(); for (const c of D.alpha) { const t = step(D, u, c); if (t !== DEAD && !(t in via)) { via[t] = via[u] + c; order.push(t); q.push(t); } } }
  return { via, order };
}

// ---------------------------------------------------------------- drawing automata with the graph kit
/** Edges of the state diagram: arrows with the same ends are merged and labelled "a, b". */
export function dfaEdges(D, o = {}) {
  const map = new Map(), out = [];
  const add = (from, to, c, extra = {}) => {
    const k = from + '\u0001' + to;
    if (!map.has(k)) { const e = { from, to, syms: [], ...extra }; if (from === to && D.loops?.[from] != null) e.angle = D.loops[from]; map.set(k, e); out.push(e); }
    map.get(k).syms.push(c);
  };
  for (const s of D.states) for (const c of D.alpha) {
    const t = tgt(D, s.id, c);
    if (!t.length && o.dead) add(s.id, DEAD, c, { toDead: true });
    for (const r of t) add(s.id, r, c, t.length > 1 ? { multi: true } : {});
  }
  if (o.dead && out.some((e) => e.toDead)) for (const c of D.alpha) add(DEAD, DEAD, c, { toDead: true });
  for (const e of out) { e.label = e.syms.join(', '); e.directed = true; if (e.multi) e.multiSyms = e.syms.filter((c) => tgt(D, e.from, c).length > 1); }
  return out;
}
/** A graph-kit view of D (nodes are D's own state objects, so dragging moves them). */
export function dfaGraph(v, s, D, o = {}) {
  const G = v.graph(s, { nodes: [], edges: [], layout: 'none', directed: true, r: o.r ?? 18, autoRadius: false, texSize: o.texSize ?? 15, draggable: o.draggable !== false, editable: o.editable ?? false, edgeFontSize: 11.5 });
  G.deadNode = { id: DEAD, x: o.deadAt?.[0] ?? 0, y: o.deadAt?.[1] ?? 0, label: '$\\varnothing$' };
  G.sync = (DD = D, oo = {}) => {
    const edges = dfaEdges(DD, oo);
    const needDead = oo.dead && edges.some((e) => e.toDead);
    G.set({ nodes: needDead ? [...DD.states, G.deadNode] : DD.states, edges });
    return G;
  };
  G.sync(D, o);
  return G;
}
/** Draw D: double ring on accepting states, start arrow, optional highlight of a current state / edge. */
export function drawDFA(v, s, G, D, o = {}) {
  G.draw({
    nodeLabel: (id, n) => n.label ?? id,
    nodeRing: (id) => (isAcc(D, id) ? o.ring?.(id) ?? 'ink' : null),
    nodeFill: (id) => o.fill?.(id) ?? null,
    nodeColor: (id) => o.color?.(id) ?? (id === DEAD ? 'muted' : null),
    labelColor: (id) => o.labelColor?.(id) ?? (o.fill?.(id) === 'gold' ? 'ink' : id === DEAD && !o.fill?.(id) ? 'muted' : null),
    edgeColor: (e) => o.edgeColor?.(e) ?? (e.multi ? 'red' : null),
    edgeWidth: (e) => o.edgeWidth?.(e) ?? (e.multi ? 2.4 : null),
    edgeDash: (e) => (e.toDead ? [5, 4] : null),
    edgeLabel: (e) => e.label,
    edgeLabelColor: (e) => o.edgeLabelColor?.(e) ?? (e.multi ? 'red' : e.toDead ? 'muted' : null),
    dim: o.dim,
  });
  if (o.start !== false) startArrow(s, G, D, o.startColor);
}
export function startArrow(s, G, D, col) {
  const n = G.node(D.start); if (!n || !isFinite(n.x)) return;
  const r = G.o.r ?? 18, ang = ((D.startDir ?? 180) * Math.PI) / 180, gap = isAcc(D, D.start) ? 8 : 3;
  const X = s.X(n.x), Y = s.Y(n.y), cx = Math.cos(ang), sy = Math.sin(ang);
  s.arrow(s.invX(X + cx * (r + 30)), s.invY(Y - sy * (r + 30)), s.invX(X + cx * (r + gap)), s.invY(Y - sy * (r + gap)), { color: col || 'ink', width: 2, head: 8 });
}
/** Input tape: cells for w, the first i symbols consumed, the state reached after each prefix written under its boundary. */
export function drawTape(P, w, i, o = {}) {
  const n = w.length, cell = o.cell ?? 30, x0 = o.x0 ?? Math.round((P.W - Math.max(n, 1) * cell) / 2), y0 = o.y0 ?? 8;
  if (!n) { P.box(x0, y0, cell - 2, cell - 2, { r: 4, stroke: 'faint', dash: true }); P.text(EPS, x0 + cell / 2 - 1, y0 + cell / 2, { size: 15, color: 'muted' }); }
  for (let k = 0; k < n; k++) {
    const done = k < i, cur = k === i && !o.finished;
    P.box(x0 + k * cell, y0, cell - 2, cell - 2, { r: 4, fill: cur ? 'gold' : done ? 'faint' : null, alpha: cur ? 0.35 : 0.18, stroke: cur ? 'gold' : 'muted', width: cur ? 2.2 : 1.1 });
    P.text(w[k], x0 + k * cell + cell / 2 - 1, y0 + cell / 2, { size: 15, weight: 600, color: done ? 'muted' : 'ink' });
  }
  if (o.path) o.path.forEach((q, k) => {
    if (k > i) return;
    const lab = q === DEAD ? DEAD : String(o.name ? o.name(q) : q), x = x0 + k * cell - 1;
    P.line(x, y0 + cell - 1, x, y0 + cell + 6, { color: k === i ? 'gold' : 'faint', width: k === i ? 2 : 1 });
    P.text(lab, x, y0 + cell + 15, { size: 11, weight: k === i ? 700 : 500, color: k === i ? (o.curColor || 'gold') : q === DEAD ? 'red' : 'muted', halo: true });
  });
  // head
  const hx = x0 + Math.min(i, Math.max(n, 0)) * cell - 1;
  P.path([[hx - 6, y0 - 7], [hx + 6, y0 - 7], [hx, y0 - 1]], { fill: o.headColor || 'gold', fillAlpha: 1, stroke: false, close: true });
  return { x0, cell };
}
/** Named presets over {a, b} (positions in a 0–10 × 0–7 box). */
export const PRESETS = {
  endsAB: () => dfa(['a', 'b'], [['q0', 1.6, 3.6, 0], ['q1', 5, 5.6, 0], ['q2', 8.4, 3.6, 1]], 'q0',
    { q0: { a: 'q1', b: 'q0' }, q1: { a: 'q1', b: 'q2' }, q2: { a: 'q1', b: 'q0' } }, { name: 'ends in ab', loops: { q0: 270, q1: 90 } }),
  evenA: () => dfa(['a', 'b'], [['q0', 3, 3.6, 1], ['q1', 7, 3.6, 0]], 'q0',
    { q0: { a: 'q1', b: 'q0' }, q1: { a: 'q0', b: 'q1' } }, { name: 'even number of a', loops: { q0: 90, q1: 90 } }),
  noAA: () => dfa(['a', 'b'], [['q0', 2.6, 4, 1], ['q1', 6.6, 4, 1]], 'q0',
    { q0: { a: 'q1', b: 'q0' }, q1: { b: 'q0' } }, { name: 'no aa (incomplete)', loops: { q0: 90 } }),
  aMod3: () => dfa(['a', 'b'], [['q0', 2, 3.2, 1], ['q1', 5, 5.8, 0], ['q2', 8, 3.2, 0]], 'q0',
    { q0: { a: 'q1', b: 'q0' }, q1: { a: 'q2', b: 'q1' }, q2: { a: 'q0', b: 'q2' } }, { name: 'number of a divisible by 3', loops: { q0: 270, q1: 90, q2: 270 } }),
  hasABA: () => dfa(['a', 'b'], [['q0', 1, 3.6, 0], ['q1', 3.8, 3.6, 0], ['q2', 6.4, 3.6, 0], ['q3', 9.1, 3.6, 1]], 'q0',
    { q0: { a: 'q1', b: 'q0' }, q1: { a: 'q1', b: 'q2' }, q2: { a: 'q3', b: 'q0' }, q3: { a: 'q3', b: 'q3' } }, { name: 'contains aba', loops: { q0: 90, q1: 90, q3: 90 } }),
  nfa: () => dfa(['a', 'b'], [['q0', 1.6, 3.6, 0], ['q1', 5, 3.6, 0], ['q2', 8.4, 3.6, 1]], 'q0',
    { q0: { a: ['q0', 'q1'], b: 'q0' }, q1: { b: 'q2' }, q2: { a: 'q2', b: 'q2' } }, { name: 'contains ab (two a-arrows)', loops: { q0: 90, q2: 90 } }),
};
/** δ as a table: rows = states, columns = symbols; values are TeX state names, red when nondeterministic, — when missing. */
export function deltaValue(D, q, c, dead) {
  const t = tgt(D, q, c);
  if (!t.length) return dead ? '$\\varnothing$' : '—';
  return '$' + t.map((r) => (r === DEAD ? '\\varnothing' : (D.states.find((s) => s.id === r)?.label ?? r).replace(/\$/g, ''))).join(',\\,') + '$';
}
export function rowLabel(D, q) {
  const s = D.states.find((x) => x.id === q), name = (s?.label ?? q).replace(/\$/g, '');
  return `$${D.start === q ? '\\to\\,' : ''}${s?.acc ? '{*}' : ''}${name}$`;
}
/** Cycle the target of δ(q, c): q0 → q1 → … → (missing) → q0; with `multi`, pairs of targets are included. */
export function cycleTarget(D, q, c, multi) {
  const ids = D.states.map((s) => s.id), opts = ids.map((x) => [x]);
  if (multi) for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) opts.push([ids[i], ids[j]]);
  opts.push([]);
  const cur = tgt(D, q, c).join('|'), k = opts.findIndex((o) => o.join('|') === cur);
  D.delta[q][c] = opts[(k + 1) % opts.length].slice();
}
