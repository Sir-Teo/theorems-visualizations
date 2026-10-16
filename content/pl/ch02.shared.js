// Programming Languages & Types — Chapter 2: helpers shared by ch02.js and ch02-b.js.
// An untyped λ-calculus workbench: parser (with named macros and Church numerals), a printer that tracks character
// spans (for highlighting and clicking), free variables, capture-avoiding and naive substitution, de Bruijn terms,
// β-reduction under four strategies, α-keys, reduction graphs, Church encodings and a layered graph drawer.
import { layoutG, drawTreePx, hitNode, field, pxStage, wrapText, drawParseError, segWidth } from './ch01.shared.js';
export { layoutG, drawTreePx, hitNode, field, pxStage, wrapText, drawParseError, segWidth };

// ====================================================================== terms
export const V = (x) => ({ t: 'v', x });
export const L = (x, b) => ({ t: 'l', x, b });
export const A = (f, a) => ({ t: 'a', f, a });
export const apps = (f, ...as) => as.reduce((acc, a) => A(acc, a), f);
export const lams = (xs, b) => xs.reduceRight((acc, x) => L(x, acc), b);

const fvCache = new WeakMap();
export function fv(t) {
  let r = fvCache.get(t);
  if (r) return r;
  if (t.t === 'v') r = new Set([t.x]);
  else if (t.t === 'a') { r = new Set(fv(t.f)); for (const x of fv(t.a)) r.add(x); }
  else { r = new Set(fv(t.b)); r.delete(t.x); }
  fvCache.set(t, r);
  return r;
}
export function bvNames(t, out = new Set()) { if (t.t === 'l') { out.add(t.x); bvNames(t.b, out); } else if (t.t === 'a') { bvNames(t.f, out); bvNames(t.a, out); } return out; }
export function allNames(t, out = new Set()) { if (t.t === 'v') out.add(t.x); else if (t.t === 'l') { out.add(t.x); allNames(t.b, out); } else { allNames(t.f, out); allNames(t.a, out); } return out; }
export function fresh(x, avoid) { let y = x; while (avoid.has(y)) y += "'"; return y; }
export const size = (t) => (t.t === 'v' ? 1 : t.t === 'l' ? 1 + size(t.b) : 1 + size(t.f) + size(t.a));
export const getAt = (t, p) => (p === '' ? t : p.split('.').reduce((n, k) => (k === 'f' ? n.f : k === 'a' ? n.a : n.b), t));
export function setAt(t, p, r) {
  if (p === '') return r;
  const [k, ...rest] = p.split('.'), q = rest.join('.');
  if (k === 'f') return A(setAt(t.f, q, r), t.a);
  if (k === 'a') return A(t.f, setAt(t.a, q, r));
  return L(t.x, setAt(t.b, q, r));
}
export const cat = (p, k) => (p ? p + '.' + k : k);

/** α-key: the nameless form as a string (free variables by name). Equal keys ⇔ α-equivalent. */
export function key(t, env = []) {
  if (t.t === 'v') { const i = env.lastIndexOf(t.x); return i >= 0 ? String(env.length - 1 - i) : '$' + t.x; }
  if (t.t === 'l') { env.push(t.x); const s = 'λ' + key(t.b, env); env.pop(); return s; }
  return '(' + key(t.f, env) + ' ' + key(t.a, env) + ')';
}
export const alphaEq = (a, b) => key(a) === key(b);

// ---------------------------------------------------------------------- substitution
/** [x ↦ s]t, capture-avoiding. With mark = true, inserted copies get `ins` and renamed binders/occurrences get `ren`. */
export function subst(t, x, s, mark = false, fvS = fv(s)) {
  if (t.t === 'v') return t.x === x ? (mark ? { ...s, ins: true } : s) : t;
  if (t.t === 'a') {
    const f = subst(t.f, x, s, mark, fvS), a = subst(t.a, x, s, mark, fvS);
    return f === t.f && a === t.a ? t : A(f, a);
  }
  if (t.x === x || !fv(t.b).has(x)) return t;
  if (fvS.has(t.x)) {
    const avoid = new Set([...fvS, ...allNames(t.b), x]);
    const y = fresh(t.x, avoid);
    const body = subst(subst(t.b, t.x, mark ? { ...V(y), ren: true } : V(y)), x, s, mark, fvS);
    return mark ? { ...L(y, body), ren: true } : L(y, body);
  }
  const b = subst(t.b, x, s, mark, fvS);
  return b === t.b ? t : L(t.x, b);
}
/** Naive textual replacement: no renaming. Inserted copies carry `ins`; variables of s that end up bound by an enclosing binder carry `cap`. */
export function naiveSubst(t, x, s, bound = []) {
  if (t.t === 'v') {
    if (t.x !== x) return t;
    const tag = (u, loc) => {
      if (u.t === 'v') return { ...u, cap: !loc.includes(u.x) && bound.includes(u.x) };
      if (u.t === 'a') return A(tag(u.f, loc), tag(u.a, loc));
      return L(u.x, tag(u.b, [...loc, u.x]));
    };
    return { ...tag(s, []), ins: true };
  }
  if (t.t === 'a') return A(naiveSubst(t.f, x, s, bound), naiveSubst(t.a, x, s, bound));
  if (t.x === x) return t;
  return L(t.x, naiveSubst(t.b, x, s, [...bound, t.x]));
}
/** Rename free occurrences of x to y inside t (no capture check): the unsafe rename used to show what goes wrong. */
export function renameFree(t, x, y) {
  if (t.t === 'v') return t.x === x ? V(y) : t;
  if (t.t === 'a') return A(renameFree(t.f, x, y), renameFree(t.a, x, y));
  return t.x === x ? t : L(t.x, renameFree(t.b, x, y));
}

// ====================================================================== parser
const reNum = /^\d+$/;
/** parse(src, defs) → {ast} | {error, pos, len}. defs: name → term (names start with a capital letter), digit strings are Church numerals. */
export function parse(src, defs = {}) {
  const toks = []; const re = /\s+|[λ\\.()]|[a-z][0-9']*|\d+|[A-Z][a-z]*(?:[A-Z][a-z]+)*|./gy; let m;
  re.lastIndex = 0;
  while ((m = re.exec(src))) { if (!/^\s+$/.test(m[0])) toks.push({ w: m[0], pos: m.index, len: m[0].length }); if (re.lastIndex >= src.length) break; }
  let k = 0;
  const peek = () => toks[k];
  const fail = (msg, tk = peek()) => { throw { msg, pos: tk ? tk.pos : src.length, len: tk ? tk.len : 1 }; };
  const isVar = (w) => /^[a-z][0-9']*$/.test(w);
  const startsAtom = (tk) => tk && (isVar(tk.w) || tk.w === '(' || tk.w === 'λ' || tk.w === '\\' || reNum.test(tk.w) || /^[A-Z][a-z]*(?:[A-Z][a-z]+)*$/.test(tk.w));
  function term() {
    const tk = peek();
    if (!tk) fail('the term ends too early');
    if (tk.w === 'λ' || tk.w === '\\') {
      k++; const names = [];
      while (peek() && isVar(peek().w)) { names.push(peek().w); k++; }
      if (!names.length) fail('λ needs at least one variable name', peek() || tk);
      if (!peek() || peek().w !== '.') fail(peek() ? `expected “.” after the binders but found “${peek().w}”` : 'expected “.” after the binders');
      k++;
      if (!peek() || peek().w === ')') fail('the body of the λ is missing', peek() || tk);
      return lams(names, term());
    }
    let r = atom();
    while (startsAtom(peek())) {
      if (peek().w === 'λ' || peek().w === '\\') { r = A(r, term()); break; }
      r = A(r, atom());
    }
    return r;
  }
  function atom() {
    const tk = peek();
    if (!tk) fail('the term ends too early');
    if (isVar(tk.w)) { k++; return V(tk.w); }
    if (reNum.test(tk.w)) { k++; if (+tk.w > 30) fail('numerals above 30 are not supported', tk); return church(+tk.w); }
    if (/^[A-Z][a-z]*(?:[A-Z][a-z]+)*$/.test(tk.w)) {
      k++;
      if (!defs[tk.w]) fail(`“${tk.w}” is not a defined name${Object.keys(defs).length ? ' (known: ' + Object.keys(defs).join(', ') + ')' : ''}`, tk);
      return defs[tk.w];
    }
    if (tk.w === '(') {
      k++; const r = term(); const cl = peek();
      if (!cl || cl.w !== ')') fail(cl ? `expected “)” but found “${cl.w}”` : 'missing “)”');
      k++; return r;
    }
    fail(tk.w === ')' ? 'unexpected “)”' : tk.w === '.' ? 'unexpected “.”' : `unexpected “${tk.w}”`);
  }
  try {
    if (!toks.length) return { error: 'empty term', pos: 0, len: 1 };
    const r = term();
    if (k < toks.length) fail(toks[k].w === ')' ? 'unbalanced “)”' : `unexpected “${toks[k].w}”`);
    return { ast: r };
  } catch (e) { if (e && e.msg) return { error: e.msg, pos: e.pos, len: e.len }; throw e; }
}

// ====================================================================== Church encodings
export function church(n) { let b = V('x'); for (let i = 0; i < n; i++) b = A(V('f'), b); return L('f', L('x', b)); }
/** n if the term is syntactically the numeral λf.λx.f(…f x), else -1. */
export function churchNum(t) {
  if (t.t !== 'l' || t.b.t !== 'l') return -1;
  const f = t.x, x = t.b.x; let b = t.b.b, n = 0;
  if (f === x) return b.t === 'v' && b.x === x ? 0 : -1;
  while (b.t === 'a' && b.f.t === 'v' && b.f.x === f) { n++; b = b.a; }
  return b.t === 'v' && b.x === x ? n : -1;
}
const defSrc = [
  ['I', 'λx. x'], ['K', 'λx y. x'], ['S', 'λx y z. x z (y z)'],
  ['True', 'λt f. t'], ['False', 'λt f. f'], ['If', 'λb t e. b t e'],
  ['And', 'λp q. p q p'], ['Or', 'λp q. p p q'], ['Not', 'λp. p False True'], ['Xor', 'λp q. p (Not q) q'],
  ['Pair', 'λa b f. f a b'], ['Fst', 'λp. p True'], ['Snd', 'λp. p False'],
  ['Succ', 'λn f x. f (n f x)'], ['Plus', 'λm n f x. m f (n f x)'], ['Times', 'λm n f. m (n f)'], ['Pow', 'λm n. n m'],
  ['IsZero', 'λn. n (λz. False) True'],
  ['Pred', 'λn. Fst (n (λp. Pair (Snd p) (Succ (Snd p))) (Pair 0 0))'],
  ['Sub', 'λm n. n Pred m'], ['Leq', 'λm n. IsZero (Sub m n)'],
  ['Omega', '(λx. x x) (λx. x x)'],
  ['Y', 'λf. (λx. f (x x)) (λx. f (x x))'],
  ['Z', 'λf. (λx. f (λv. x x v)) (λx. f (λv. x x v))'],
];
export const DEFS = {};
for (const [n, s] of defSrc) { const r = parse(s, DEFS); if (!r.ast) throw new Error(`def ${n}: ${r.error}`); DEFS[n] = r.ast; }
export const P = (src, defs = DEFS) => { const r = parse(src, defs); if (!r.ast) throw new Error(`${src}: ${r.error}`); return r.ast; };
const DEF_BY_NODE = new Map(Object.entries(DEFS).map(([n, t]) => [t, n]));
const TRUE_KEY = key(DEFS.True), FALSE_KEY = key(DEFS.False);
export const boolOf = (t) => { const k = key(t); return k === TRUE_KEY ? true : k === FALSE_KEY ? false : null; };

// ====================================================================== printing
/** Layout a term as text with per-token metadata.
 *  opts: full (fully parenthesised), merge (λxy. — default true), abbr: {names, nums, bools}, style(node, path, inherited) → colour | undefined.
 *  Returns {text, toks: [{s, a, b, node, path, color}], spans: Map(path → [a, b])}. */
export function layoutTerm(t, o = {}) {
  const toks = [], spans = new Map(); let n = 0;
  const abbr = o.abbr || {};
  const emit = (s, node, path, color) => { toks.push({ s, a: n, b: n + s.length, node, path, color }); n += s.length; };
  const nameOf = (node) => {
    if (abbr.names && DEF_BY_NODE.has(node)) return DEF_BY_NODE.get(node);
    if (node.t === 'l' && (abbr.nums || abbr.bools)) {
      if (abbr.bools) { const b = boolOf(node); if (b !== null && !(abbr.nums && b === false)) return b ? 'True' : 'False'; }
      if (abbr.nums) { const c = churchNum(node); if (c >= 0) return String(c); }
    }
    return null;
  };
  const go = (node, path, ctx, inh) => {
    const col = (o.style && o.style(node, path, inh)) || inh;
    const nm = nameOf(node);
    if (nm) { const a = n; emit(nm, node, path, col); spans.set(path, [a, n]); return; }
    const paren = o.full ? node.t !== 'v' : (node.t === 'l' && (ctx === 'fn' || ctx === 'arg')) || (node.t === 'a' && ctx === 'arg');
    if (paren) emit('(', node, path, col);
    const a0 = n;
    if (node.t === 'v') emit(node.x, node, path, col);
    else if (node.t === 'l') {
      let names = [node.x], body = node.b, bp = cat(path, 'b');
      while (o.merge !== false && body.t === 'l' && !(o.style && o.style(body, bp, col) !== undefined && o.style(body, bp, col) !== col) && !nameOf(body)) { names.push(body.x); body = body.b; bp = cat(bp, 'b'); }
      emit('λ' + (names.every((x) => x.length === 1) ? names.join('') : names.join(' ')), node, path, col);
      emit('. ', node, path, col);
      go(body, bp, 'body', col);
    } else {
      go(node.f, cat(path, 'f'), 'fn', col);
      emit(' ', node, path, col);
      go(node.a, cat(path, 'a'), 'arg', col);
    }
    spans.set(path, [a0, n]);
    if (paren) emit(')', node, path, col);
  };
  go(t, '', 'top', undefined);
  return { text: toks.map((k) => k.s).join(''), toks, spans };
}
export const show = (t, o) => layoutTerm(t, o).text;

/** Paths of all β-redexes (applications whose function part is an abstraction). */
export function redexes(t, p = '', out = []) {
  if (t.t === 'a') {
    if (t.f.t === 'l') out.push(p);
    redexes(t.f, cat(p, 'f'), out); redexes(t.a, cat(p, 'a'), out);
  } else if (t.t === 'l') redexes(t.b, cat(p, 'b'), out);
  return out;
}
export function contract(t, p) {
  const r = getAt(t, p);
  return setAt(t, p, subst(r.f.b, r.f.x, r.a));
}

/** Draw a layoutTerm as one line at pixel (X, Y). Returns {xOf(charIndex), width, size}. o: size, align ('left' | 'center'), maxW, weight. */
export function drawLine(v, s, lay, X, Y, o = {}) {
  const ctx = s.ctx; let size = o.size || 16;
  const w = (sz) => { ctx.save(); ctx.font = s._font({ size: sz, weight: o.weight || 500 }); const r = ctx.measureText(lay.text).width; ctx.restore(); return r; };
  let total = w(size);
  if (o.maxW && total > o.maxW) { size = Math.max(o.minSize || 8.5, size * o.maxW / total); total = w(size); }
  const x0 = o.align === 'center' ? X - total / 2 : X;
  const xs = [0]; // x offset of each token start
  ctx.save(); ctx.font = s._font({ size, weight: o.weight || 500 });
  let acc = 0; const starts = lay.toks.map((k) => { const st = acc; acc += ctx.measureText(k.s).width; return st; });
  const widths = lay.toks.map((k) => ctx.measureText(k.s).width);
  ctx.restore(); void xs;
  const xOf = (ci) => {
    for (let i = lay.toks.length - 1; i >= 0; i--) {
      const k = lay.toks[i];
      if (ci >= k.a) { if (ci >= k.b) return x0 + starts[i] + widths[i]; ctx.save(); ctx.font = s._font({ size, weight: o.weight || 500 }); const r = ctx.measureText(k.s.slice(0, ci - k.a)).width; ctx.restore(); return x0 + starts[i] + r; }
    }
    return x0;
  };
  if (o.under) o.under({ xOf, size, x0 });
  lay.toks.forEach((k, i) => s.textPx(k.s, x0 + starts[i], Y, { size, weight: o.weight || 500, align: 'left', color: k.color || o.color || 'ink', halo: false }));
  return { xOf, width: total, size, x0 };
}

// ====================================================================== reduction
/** Path of the next redex under a strategy, or null. */
export function findRedex(t, strat, p = '') {
  const isVal = (u) => u.t === 'l' || u.t === 'v';
  switch (strat) {
    case 'normal': {
      if (t.t === 'v') return null;
      if (t.t === 'l') return findRedex(t.b, strat, cat(p, 'b'));
      if (t.f.t === 'l') return p;
      return findRedex(t.f, strat, cat(p, 'f')) ?? findRedex(t.a, strat, cat(p, 'a'));
    }
    case 'name': {
      if (t.t !== 'a') return null;
      if (t.f.t === 'l') return p;
      return findRedex(t.f, strat, cat(p, 'f'));
    }
    case 'value': {
      if (t.t !== 'a') return null;
      if (!isVal(t.f)) return findRedex(t.f, strat, cat(p, 'f'));
      if (!isVal(t.a)) return findRedex(t.a, strat, cat(p, 'a'));
      return t.f.t === 'l' ? p : null;
    }
    case 'applicative': {
      if (t.t === 'v') return null;
      if (t.t === 'l') return findRedex(t.b, strat, cat(p, 'b'));
      return findRedex(t.f, strat, cat(p, 'f')) ?? findRedex(t.a, strat, cat(p, 'a')) ?? (t.f.t === 'l' ? p : null);
    }
    default: return null;
  }
}
export const STRATS = [
  { id: 'normal', name: 'Normal order', short: 'normal', color: 'accent', blurb: 'leftmost-outermost redex, anywhere (also under λ)' },
  { id: 'name', name: 'Call by name', short: 'by name', color: 'teal', blurb: 'leftmost-outermost redex, never under λ' },
  { id: 'value', name: 'Call by value', short: 'by value', color: 'orange', blurb: 'argument must be a value first; never under λ' },
  { id: 'applicative', name: 'Applicative order', short: 'applicative', color: 'purple', blurb: 'innermost-leftmost redex, also under λ' },
];
/** Run a strategy: returns {states: [t0, t1, …], paths: [p1, …], status: 'done' | 'loop' | 'cap', loopAt}. */
export function runStrategy(t0, strat, { max = 60, maxSize = 4000 } = {}) {
  const states = [t0], paths = []; const seen = new Map([[key(t0), 0]]);
  let t = t0, status = 'cap', loopAt = -1;
  for (let i = 0; i < max; i++) {
    const p = findRedex(t, strat);
    if (p === null) { status = 'done'; break; }
    t = contract(t, p); states.push(t); paths.push(p);
    if (size(t) > maxSize) { status = 'cap'; break; }
    const k = key(t);
    if (seen.has(k)) { status = 'loop'; loopAt = seen.get(k); break; }
    seen.set(k, i + 1);
  }
  return { states, paths, status, loopAt };
}
/** Fully normalise with normal order (for decoding results). Returns {t, steps, ok}. */
export function normalize(t, max = 20000, maxSize = 20000) {
  let steps = 0;
  while (steps < max) {
    const p = findRedex(t, 'normal'); if (p === null) return { t, steps, ok: true };
    t = contract(t, p); steps++; if (size(t) > maxSize) break;
  }
  return { t, steps, ok: false };
}

// ---------------------------------------------------------------------- reduction graph (terms up to α)
export function makeGraph(t0, { cap = 40, maxSize = 70 } = {}) {
  const nodes = [], byKey = new Map(), edges = []; let truncated = false;
  const add = (t, depth) => {
    const k = key(t); let nd = byKey.get(k);
    if (!nd) { nd = { id: nodes.length, term: t, key: k, depth, expanded: false, size: size(t) }; nodes.push(nd); byKey.set(k, nd); }
    return nd;
  };
  const addEdge = (a, b, path) => { if (!edges.some((e) => e.from === a.id && e.to === b.id)) edges.push({ from: a.id, to: b.id, path }); };
  const expand = (nd) => {
    if (nd.expanded) return; nd.expanded = true;
    nd.redexes = redexes(nd.term);
    for (const p of nd.redexes) {
      const t2 = contract(nd.term, p);
      if (size(t2) > maxSize) { nd.big = true; truncated = true; continue; }
      const had = byKey.has(key(t2));
      if (!had && nodes.length >= cap) { truncated = true; continue; }
      addEdge(nd, add(t2, nd.depth + 1), p);
    }
  };
  const root = add(t0, 0);
  const exploreAll = () => { for (let i = 0; i < nodes.length; i++) expand(nodes[i]); };
  return { nodes, edges, root, add, addEdge, expand, exploreAll, get truncated() { return truncated; }, byKey };
}

/** Layered drawing of a reduction graph in pixel space. opts: region, colorOf(nd), ringOf(nd), faint(nd), edgeColor(e), labelOf(nd), hover → returns hit node. */
export function drawGraph(v, s, G, nodeList, edgeList, opts = {}) {
  const [rx0, ry0, rx1, ry1] = opts.region || [0, 0, s.W, s.H];
  const ctx = s.ctx, byLayer = new Map();
  for (const nd of nodeList) { const d = opts.layerOf ? opts.layerOf(nd) : nd.depth; if (!byLayer.has(d)) byLayer.set(d, []); byLayer.get(d).push(nd); }
  const layers = [...byLayer.keys()].sort((a, b) => a - b), nL = layers.length;
  const boxH = 24, padY = 22;
  const dy = nL > 1 ? Math.min(74, (ry1 - ry0 - 2 * padY - boxH) / (nL - 1)) : 0;
  const y0 = ry0 + padY + boxH / 2 + Math.max(0, (ry1 - ry0 - 2 * padY - boxH - dy * (nL - 1)) / 2);
  const maxPer = Math.max(...[...byLayer.values()].map((a) => a.length));
  const colW = (rx1 - rx0 - 16) / maxPer;
  let fs = 12.5;
  const label = (nd) => (opts.labelOf ? opts.labelOf(nd) : show(nd.term, { abbr: { names: true } }));
  const trunc = (str, wpx) => {
    ctx.save(); ctx.font = s._font({ size: fs, weight: 600 });
    let w = ctx.measureText(str).width;
    if (w <= wpx) { ctx.restore(); return [str, w]; }
    let lo = 1, hi = str.length;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ctx.measureText(str.slice(0, mid) + '…').width <= wpx) lo = mid; else hi = mid - 1; }
    const r = str.slice(0, lo) + '…'; w = ctx.measureText(r).width; ctx.restore(); return [r, w];
  };
  for (const d of layers) {
    const arr = byLayer.get(d), n = arr.length, wEach = Math.min(colW, 170);
    arr.forEach((nd, i) => {
      const [txt, tw] = trunc(label(nd), wEach - 16);
      nd.pw = Math.max(26, tw + 16); nd.ph = boxH; nd.txt = txt;
      nd.px = rx0 + (rx1 - rx0) * (i + 0.5) / n; nd.py = y0 + layers.indexOf(d) * dy;
    });
  }
  const live = new Set(nodeList.map((n) => n.id));
  // edges
  for (const e of edgeList) {
    if (!live.has(e.from) || !live.has(e.to)) continue;
    const a = G.nodes[e.from], b = G.nodes[e.to];
    const col = (opts.edgeColor && opts.edgeColor(e)) || 'muted', w = (opts.edgeWidth && opts.edgeWidth(e)) || 1.4;
    const alpha = opts.edgeAlpha ? opts.edgeAlpha(e) : 0.8;
    ctx.save(); ctx.strokeStyle = v.color(col, alpha); ctx.fillStyle = v.color(col, alpha); ctx.lineWidth = w;
    if (a === b) {
      const cx = a.px + a.pw / 2, cy = a.py;
      ctx.beginPath(); ctx.moveTo(cx - 2, cy - 6); ctx.bezierCurveTo(cx + 34, cy - 30, cx + 34, cy + 30, cx - 2, cy + 6); ctx.stroke();
      arrowHead(ctx, cx - 2, cy + 6, cx + 8, cy + 10);
    } else {
      const dxs = b.px - a.px, dys = b.py - a.py;
      const sameLayer = Math.abs(dys) < 1, bend = sameLayer ? 0.35 : (dys < 0 ? 0.25 : 0);
      const sx = a.px, sy = a.py + (dys > 0 ? a.ph / 2 : dys < 0 ? -a.ph / 2 : 0), ex = b.px, ey = b.py - (dys > 0 ? b.ph / 2 : dys < 0 ? -b.ph / 2 : 0);
      const mx = (sx + ex) / 2 - (ey - sy) * bend, my = (sy + ey) / 2 + (ex - sx) * bend;
      ctx.beginPath(); ctx.moveTo(sx, sy); if (bend) ctx.quadraticCurveTo(mx, my, ex, ey); else ctx.lineTo(ex, ey); ctx.stroke();
      const ax = bend ? mx : sx, ay = bend ? my : sy;
      arrowHead(ctx, ex, ey, ax + (ex - ax) * 0.0, ay + (ey - ay) * 0.0, true, dxs, dys);
    }
    ctx.restore();
  }
  for (const nd of nodeList) {
    const col = opts.colorOf && opts.colorOf(nd), ring = opts.ringOf && opts.ringOf(nd), faint = opts.faint && opts.faint(nd);
    const x = nd.px - nd.pw / 2, y = nd.py - nd.ph / 2;
    ctx.save();
    if (ring) { rrect(ctx, x - 3, y - 3, nd.pw + 6, nd.ph + 6, 9); ctx.strokeStyle = v.color(ring, 1); ctx.lineWidth = 2.4; ctx.stroke(); }
    rrect(ctx, x, y, nd.pw, nd.ph, 7); ctx.fillStyle = v.color('panel', 1); ctx.fill();
    if (col) { ctx.fillStyle = v.color(col, faint ? 0.08 : 0.22); ctx.fill(); }
    ctx.strokeStyle = v.color(col || 'muted', faint ? 0.4 : 1); ctx.lineWidth = col ? 1.8 : 1.3; ctx.stroke();
    ctx.restore();
    s.textPx(nd.txt, nd.px, nd.py, { size: fs, weight: 600, align: 'center', color: faint ? 'muted' : 'ink', halo: false });
  }
  return nodeList;
}
function arrowHead(ctx, x, y, fx, fy, byDir, dx, dy) {
  let ang = byDir ? Math.atan2(dy, dx) : Math.atan2(y - fy, x - fx);
  if (byDir && Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8 * Math.cos(ang - 0.45), y - 8 * Math.sin(ang - 0.45)); ctx.lineTo(x - 8 * Math.cos(ang + 0.45), y - 8 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
}
export function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
export function hitBox(nodes, px, py) { let best = null; for (const nd of nodes) if (nd.px != null && Math.abs(px - nd.px) <= nd.pw / 2 + 3 && Math.abs(py - nd.py) <= nd.ph / 2 + 3) best = nd; return best; }

// ====================================================================== de Bruijn
export const DB = { i: (n) => ({ t: 'i', n }), l: (b) => ({ t: 'l', b }), a: (f, a) => ({ t: 'a', f, a }) };
/** Free variable names in order of first appearance (left to right). */
export function freeOrder(t, bound = [], out = []) {
  if (t.t === 'v') { if (!bound.includes(t.x) && !out.includes(t.x)) out.push(t.x); }
  else if (t.t === 'l') freeOrder(t.b, [...bound, t.x], out);
  else { freeOrder(t.f, bound, out); freeOrder(t.a, bound, out); }
  return out;
}
/** Named → nameless, with context gamma (free names; the k-th free name has index depth + k). */
export function toDB(t, gamma = freeOrder(t), env = []) {
  if (t.t === 'v') { const i = env.lastIndexOf(t.x); if (i >= 0) return DB.i(env.length - 1 - i); const g = gamma.indexOf(t.x); return DB.i(env.length + (g < 0 ? 0 : g)); }
  if (t.t === 'l') return DB.l(toDB(t.b, gamma, [...env, t.x]));
  return DB.a(toDB(t.f, gamma, env), toDB(t.a, gamma, env));
}
/** Nameless → named, binders are called x, y, z, … (avoiding gamma). */
export function fromDB(d, gamma = [], env = []) {
  const pool = 'xyzuvwabcdefghijklmnopqrst'.split('');
  if (d.t === 'i') { if (d.n < env.length) return V(env[env.length - 1 - d.n]); return V(gamma[d.n - env.length] ?? '?'); }
  if (d.t === 'l') { const nm = pool.find((c) => !gamma.includes(c) && !env.includes(c)) ?? 'x' + env.length; return L(nm, fromDB(d.b, gamma, [...env, nm])); }
  return A(fromDB(d.f, gamma, env), fromDB(d.a, gamma, env));
}
export function shiftDB(d, c, t) {
  if (t.t === 'i') return t.n >= c ? DB.i(t.n + d) : t;
  if (t.t === 'l') return DB.l(shiftDB(d, c + 1, t.b));
  return DB.a(shiftDB(d, c, t.f), shiftDB(d, c, t.a));
}
export function substDB(j, s, t) {
  if (t.t === 'i') return t.n === j ? s : t;
  if (t.t === 'l') return DB.l(substDB(j + 1, shiftDB(1, 0, s), t.b));
  return DB.a(substDB(j, s, t.f), substDB(j, s, t.a));
}
/** (λ. b) a → ↑⁻¹( [0 ↦ ↑¹ a] b ). */
export const betaDB = (b, a) => shiftDB(-1, 0, substDB(0, shiftDB(1, 0, a), b));
/** Printing a nameless term as tokens: λ. λ. 1 0. style(node, path) → colour. */
export function layoutDB(t, o = {}) {
  const toks = []; let n = 0;
  const emit = (s, node, path, color) => { toks.push({ s, a: n, b: n + s.length, node, path, color }); n += s.length; };
  const go = (node, path, ctx, inh) => {
    const col = (o.style && o.style(node, path, inh)) || inh;
    const paren = node.t === 'l' ? ctx === 'fn' || ctx === 'arg' : node.t === 'a' ? ctx === 'arg' : false;
    if (paren) emit('(', node, path, col);
    if (node.t === 'i') emit(String(node.n), node, path, col);
    else if (node.t === 'l') { emit('λ. ', node, path, col); go(node.b, cat(path, 'b'), 'body', col); }
    else { go(node.f, cat(path, 'f'), 'fn', col); emit(' ', node, path, col); go(node.a, cat(path, 'a'), 'arg', col); }
    if (paren) emit(')', node, path, col);
  };
  go(t, '', 'top', undefined);
  return { text: toks.map((k) => k.s).join(''), toks };
}
export const dbStr = (t) => layoutDB(t).text;
export function parseDBless(src) { return parse(src); }

// ====================================================================== misc
export const fmtSet = (set) => (set.size ? '\\{' + [...set].sort().map((x) => x.replace(/'/g, "'")).join(', ') + '\\}' : '\\varnothing');
/** TeX for a variable name (primes allowed). */
export const texVar = (x) => x.replace(/'/g, "'");
/** Escape plain text for use inside a TeX \texttt-less math string: variables only. */
export const texTerm = (t, o) => '\\mathtt{' + show(t, o).replace(/λ/g, '\\lambda ').replace(/ /g, '\\ ').replace(/'/g, "'") + '}';

/** Describe a normal form: boolean, numeral, pair or plain term (plain text). */
export function decode(t, depth = 0) {
  const b = boolOf(t); if (b !== null) return b ? 'True' : 'False';
  const n = churchNum(t); if (n >= 0) return String(n);
  if (t.t === 'l' && t.b.t === 'a' && t.b.f.t === 'a' && t.b.f.f.t === 'v' && t.b.f.f.x === t.x && depth < 3) {
    const a = t.b.f.a, c = t.b.a;
    if (!fv(a).has(t.x) && !fv(c).has(t.x)) return `pair(${decode(a, depth + 1)}, ${decode(c, depth + 1)})`;
  }
  return show(t, { abbr: { names: true, nums: true, bools: true } });
}
/** A list of reduction states as rows: the contracted redex is shaded. rowsOf = number of rows shown (the last ones up to state k). */
export function drawTrace(v, s, run, k, o = {}) {
  const rowH = o.rowH || 30, top = o.top ?? 14, size = o.size || 16, abbr = o.abbr || { names: true };
  const rows = Math.max(1, Math.floor((s.H - top - 6) / rowH));
  const first = Math.max(0, k - rows + 1);
  let info = null;
  for (let i = first; i <= k; i++) {
    const y = top + (i - first) * rowH + rowH / 2, cur = i === k;
    const p = i < run.paths.length ? run.paths[i] : null;
    const lay = layoutTerm(run.states[i], { abbr, style: (nd, path, inh) => (p !== null && path === p ? 'orange' : undefined) });
    if (cur) { s.ctx.save(); s.ctx.fillStyle = v.color('gold', 0.14); rrect(s.ctx, 4, y - rowH / 2 + 2, s.W - 8, rowH - 4, 6); s.ctx.fill(); s.ctx.restore(); }
    s.textPx(i + '', 30, y, { size: 12.5, color: cur ? 'ink' : 'muted', weight: 700, align: 'right', halo: false });
    const d = drawLine(v, s, lay, 44, y, { size: cur ? size : size - 1, maxW: s.W - 60, weight: cur ? 600 : 500, color: cur ? 'ink' : 'muted',
      under: (u) => { if (p !== null && lay.spans.has(p)) { const [a, b] = lay.spans.get(p); const x0 = u.xOf(a), x1 = u.xOf(b); s.ctx.save(); s.ctx.fillStyle = v.color('orange', cur ? 0.22 : 0.1); rrect(s.ctx, x0 - 3, y - u.size * 0.8, x1 - x0 + 6, u.size * 1.6, 5); s.ctx.fill(); s.ctx.restore(); } } });
    if (cur) info = { y, d };
  }
  return info;
}
