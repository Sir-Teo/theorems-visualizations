// Logic & Foundations — Chapter 3: helpers shared by ch03.js and ch03-b.js.
// A small first-order toolkit: tokenizer and signature-aware parser (terms and formulas, with typed error
// messages), printers (unicode, TeX, token strips), free/bound occurrences, capture-avoiding substitution
// and renaming, prenex rewriting, a compiled model checker with evaluation traces, finite structures
// (graphs, tables, exhaustive and sampled enumeration), equivalence and countermodel search, colour
// refinement and isomorphism/automorphism search, and a tree layout for formulas.
import { rng } from './ch02.shared.js';
export { rng };

// ---------------------------------------------------------------- symbols
export const CONN = { not: '¬', and: '∧', or: '∨', imp: '→', iff: '↔' };
export const CTEX = { not: '\\neg ', and: '\\land', or: '\\lor', imp: '\\to', iff: '\\leftrightarrow' };
const PREC = { iff: 1, imp: 2, or: 3, and: 4 };
const RELTEX = { '=': '=', '≠': '\\neq', '<': '<', '≤': '\\le', '>': '>', '≥': '\\ge', '|': '\\mid' };
const INFIX_REL = new Set(['=', '≠', '<', '≤', '>', '≥', '|']);
const FPREC = { '+': 1, '·': 2 };
const MULTI = [['<->', 'c', 'iff'], ['<=>', 'c', 'iff'], ['->', 'c', 'imp'], ['=>', 'c', 'imp'], ['/\\', 'c', 'and'], ['\\/', 'c', 'or'], ['<=', 'r', '≤'], ['>=', 'r', '≥'], ['!=', 'r', '≠']];
const SINGLE = {
  '¬': ['c', 'not'], '~': ['c', 'not'], '!': ['c', 'not'], '∧': ['c', 'and'], '&': ['c', 'and'], '∨': ['c', 'or'],
  '→': ['c', 'imp'], '⊃': ['c', 'imp'], '↔': ['c', 'iff'], '≡': ['c', 'iff'], '∀': ['q', 'all'], '∃': ['q', 'ex'],
  '=': ['r', '='], '≠': ['r', '≠'], '<': ['r', '<'], '≤': ['r', '≤'], '>': ['r', '>'], '≥': ['r', '≥'], '∣': ['r', '|'],
  '+': ['f', '+'], '·': ['f', '·'], '*': ['f', '·'], '⋅': ['f', '·'], '×': ['f', '·'],
  '(': ['('], ')': [')'], ',': [','], '.': ['.'], ':': ['.'], '⊤': ['k', true], '⊥': ['k', false],
};
const WORDS = { forall: ['q', 'all'], all: ['q', 'all'], exists: ['q', 'ex'], ex: ['q', 'ex'], not: ['c', 'not'], and: ['c', 'and'], or: ['c', 'or'], implies: ['c', 'imp'], iff: ['c', 'iff'] };

/** Tokens {t, v, pos}: t ∈ ( ) , . q c r f id num k. With sig.rels['|'] the bar means “divides”, otherwise “or”. */
export function tokenize(src, sig = null) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    const m = MULTI.find(([w]) => src.startsWith(w, i));
    if (m) { out.push({ t: m[1], v: m[2], pos: i, len: m[0].length }); i += m[0].length; continue; }
    if (c === '|') { out.push(sig && sig.rels && sig.rels['|'] ? { t: 'r', v: '|', pos: i, len: 1 } : { t: 'c', v: 'or', pos: i, len: 1 }); i++; continue; }
    if (SINGLE[c]) { const [t, v] = SINGLE[c]; out.push({ t, v: v ?? c, pos: i, len: 1 }); i++; continue; }
    if (/[A-Za-z]/.test(c)) {
      let j = i + 1; while (j < src.length && /[A-Za-z0-9_'′]/.test(src[j])) j++;
      const w = src.slice(i, j).replace(/′/g, "'"), W = WORDS[w];
      out.push(W ? { t: W[0], v: W[1], pos: i, len: j - i } : { t: 'id', v: w, pos: i, len: j - i });
      i = j; continue;
    }
    if (/[0-9]/.test(c)) { let j = i + 1; while (j < src.length && /[0-9]/.test(src[j])) j++; out.push({ t: 'num', v: src.slice(i, j), pos: i, len: j - i }); i = j; continue; }
    throw { msg: `unexpected symbol “${c}”`, pos: i };
  }
  return out;
}

// ---------------------------------------------------------------- AST
let NID = 1;
const VAR = (name) => ({ t: 'var', name, id: NID++ });
const CONST = (name) => ({ t: 'const', name, id: NID++ });
const FN = (f, args) => ({ t: 'fn', f, args, id: NID++ });
const REL = (r, args) => ({ op: 'rel', r, args, id: NID++ });
const NOT = (a) => ({ op: 'not', a, id: NID++ });
const BIN = (op, a, b) => ({ op, a, b, id: NID++ });
const Q = (op, v, a) => ({ op, v, a, id: NID++ });
export const mk = { VAR, CONST, FN, REL, NOT, BIN, Q, TOP: () => ({ op: 'const', val: true, id: NID++ }), BOT: () => ({ op: 'const', val: false, id: NID++ }) };
export const isTerm = (n) => n.t !== undefined;
export const isQ = (n) => n.op === 'all' || n.op === 'ex';
export const isBin = (n) => n.op in PREC;
export function kids(n) {
  if (n.t) return n.t === 'fn' ? n.args : [];
  if (n.op === 'rel') return n.args;
  if (n.op === 'not' || isQ(n)) return [n.a];
  if (isBin(n)) return [n.a, n.b];
  return [];
}
export function postorder(n, out = []) { for (const c of kids(n)) postorder(c, out); out.push(n); return out; }
export function preorder(n, out = []) { out.push(n); for (const c of kids(n)) preorder(c, out); return out; }
/** Deep copy; keepIds keeps node ids (used to match occurrences across a renaming). */
export function clone(n, keepIds = false, edit = null) {
  const e = edit && edit(n); if (e) return e;
  const id = keepIds ? n.id : NID++;
  if (n.t === 'var' || n.t === 'const') return { ...n, id };
  if (n.t === 'fn') return { t: 'fn', f: n.f, args: n.args.map((a) => clone(a, keepIds, edit)), id };
  if (n.op === 'rel') return { op: 'rel', r: n.r, args: n.args.map((a) => clone(a, keepIds, edit)), id };
  if (n.op === 'const') return { op: 'const', val: n.val, id };
  if (n.op === 'not') return { op: 'not', a: clone(n.a, keepIds, edit), id };
  if (isQ(n)) return { op: n.op, v: n.v, a: clone(n.a, keepIds, edit), id };
  return { op: n.op, a: clone(n.a, keepIds, edit), b: clone(n.b, keepIds, edit), id };
}
export function equalAst(x, y) {
  if (!!x.t !== !!y.t) return false;
  if (x.t) { if (x.t !== y.t) return false; if (x.t !== 'fn') return x.name === y.name; return x.f === y.f && x.args.length === y.args.length && x.args.every((a, i) => equalAst(a, y.args[i])); }
  if (x.op !== y.op) return false;
  if (x.op === 'rel') return x.r === y.r && x.args.length === y.args.length && x.args.every((a, i) => equalAst(a, y.args[i]));
  if (x.op === 'const') return x.val === y.val;
  if (isQ(x)) return x.v === y.v && equalAst(x.a, y.a);
  if (x.op === 'not') return equalAst(x.a, y.a);
  return equalAst(x.a, y.a) && equalAst(x.b, y.b);
}

// ---------------------------------------------------------------- parser
/**
 * Parse a first-order formula (or, with {term: true}, a term or a formula).
 * sig = {rels: {E: 2, '<': 2, '|': 2}, funcs: {S: 1, '+': 2, '·': 2}, consts: ['0'], numerals: bool, name}; null = liberal
 * (Upper(…) is a relation, lower(…) a function, other lowercase words are variables, numerals are constants).
 * Quantifiers bind as tightly as ¬: ∀x φ ∧ ψ is (∀x φ) ∧ ψ. A dot widens the scope: ∀x. φ ∧ ψ.
 * Returns {ast, kind: 'formula' | 'term'} or {error, pos}.
 */
export function parseFO(src, sig = null, { term: allowTerm = false } = {}) {
  let toks;
  try { toks = tokenize(src, sig); } catch (e) { return { error: e.msg, pos: e.pos }; }
  let k = 0, best = null;
  const peek = (o = 0) => toks[k + o];
  const posOf = (i) => (toks[i] ? toks[i].pos : src.length);
  const fail = (msg, at = k) => { throw { msg, pos: posOf(at), at }; };
  const note = (e) => { if (!best || e.at > best.at) best = e; };
  const alt = (...fns) => {
    const save = k;
    for (const f of fns) {
      try { return f(); } catch (e) { if (e.msg == null) throw e; note(e); k = save; }
    }
    throw best;
  };
  const tokText = (t) => (t.t === 'q' ? (t.v === 'all' ? '∀' : '∃') : t.t === 'c' ? CONN[t.v] : t.t === 'k' ? (t.v ? '⊤' : '⊥') : String(t.v));
  const sigHas = (kind, name) => sig && sig[kind] && Object.prototype.hasOwnProperty.call(sig[kind], name);
  const classify = (name, paren) => {
    if (sig) {
      if (sigHas('rels', name)) return 'rel';
      if (sigHas('funcs', name)) return 'fn';
      if (sig.consts && sig.consts.includes(name)) return 'const';
      if (/^[a-z][a-z]?[0-9]*'*$/.test(name) && !/^[A-Z]/.test(name)) return paren ? 'badfn' : 'var';
      return 'unknown';
    }
    if (paren) return /^[A-Z]/.test(name) ? 'rel' : 'fn';
    return /^[A-Z]/.test(name) ? 'rel0' : 'var';
  };
  const sigName = sig && sig.name ? ` of ${sig.name}` : '';
  const expect = (t, msg) => { if (!peek() || peek().t !== t) fail(msg || `expected “${t}”`); k++; };
  const argList = () => {
    expect('(');
    const args = [term()];
    while (peek() && peek().t === ',') { k++; args.push(term()); }
    expect(')', 'expected “,” or “)” after an argument');
    return args;
  };
  const arityCheck = (kind, name, n, at) => {
    if (!sig) return;
    const ar = sig[kind][name];
    if (ar !== n) fail(`${name} takes ${ar} argument${ar === 1 ? '' : 's'}, not ${n}`, at);
  };
  // terms
  function term() { return sum(); }
  function sum() {
    let a = prod();
    while (peek() && peek().t === 'f' && peek().v === '+') {
      if (sig && !sigHas('funcs', '+')) fail(`+ is not a symbol${sigName}`);
      k++; a = FN('+', [a, prod()]);
    }
    return a;
  }
  function prod() {
    let a = base();
    while (peek() && peek().t === 'f' && peek().v === '·') {
      if (sig && !sigHas('funcs', '·')) fail(`· is not a symbol${sigName}`);
      k++; a = FN('·', [a, base()]);
    }
    return a;
  }
  function base() {
    const t = peek();
    if (!t) fail('the string ends where a term was expected');
    if (t.t === 'num') { if (sig && !sig.numerals && !(sig.consts || []).includes(t.v)) fail(`the numeral ${t.v} is not a symbol${sigName}`); k++; return CONST(t.v); }
    if (t.t === 'id') {
      const paren = peek(1) && peek(1).t === '(';
      const c = classify(t.v, paren);
      if (c === 'rel' || c === 'rel0') fail(`${t.v} is a relation symbol: ${t.v}(…) is a formula, not a term`);
      if (c === 'unknown') fail(`“${t.v}” is not a symbol${sigName}`);
      if (c === 'badfn') fail(`${t.v} is a variable and cannot take arguments`);
      const at = k; k++;
      if (c === 'fn') {
        if (!paren) { if (sig && sig.funcs[t.v] === 0) return CONST(t.v); fail(`${t.v} is a function symbol and needs its argument${sig && sig.funcs[t.v] > 1 ? 's' : ''} in parentheses`); }
        const args = argList(); arityCheck('funcs', t.v, args.length, at);
        return FN(t.v, args);
      }
      if (c === 'const') return CONST(t.v);
      return VAR(t.v);
    }
    if (t.t === '(') { k++; const a = term(); expect(')', 'expected “)” to close the term'); return a; }
    if (t.t === 'q') fail('a quantifier cannot stand where a term is expected');
    if (t.t === 'c') fail(`expected a term, found the connective ${tokText(t)}`);
    if (t.t === 'r') fail(`${t.v} needs a term on its left`);
    fail(`expected a term, found “${tokText(t)}”`);
  }
  // formulas
  function formula(minP = 0) {
    let lhs = unary();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'c' || t.v === 'not') break;
      const p = PREC[t.v]; if (p < minP) break;
      k++;
      if (!peek()) fail(`${CONN[t.v]} needs a formula on its right`);
      const rhs = formula(t.v === 'imp' ? p : p + 1);
      lhs = BIN(t.v, lhs, rhs);
    }
    return lhs;
  }
  function relApp() {
    const t = peek(), at = k; k++;
    if (!peek() || peek().t !== '(') fail(`the relation symbol ${t.v} needs its arguments in parentheses`);
    const args = argList(); arityCheck('rels', t.v, args.length, at);
    return REL(t.v, args);
  }
  function infixAtom() {
    const start = k;
    const a = term();
    const r = peek();
    if (!r || r.t !== 'r') {
      const what = toks.slice(start, k).map(tokText).join(' ');
      fail(`“${what}” is a term (it names an element); a formula needs a relation such as =`, k);
    }
    if (sig && r.v !== '=' && r.v !== '≠') {
      const ok = r.v === '|' ? sigHas('rels', '|') : sigHas('rels', '<') || sigHas('rels', '≤');
      if (!ok) fail(`${r.v} is not a symbol${sigName}`);
    }
    k++;
    const b = term();
    return REL(r.v, [a, b]);
  }
  function unary() {
    const t = peek();
    if (!t) fail('the formula ends too early');
    if (t.t === 'c' && t.v === 'not') { k++; return NOT(unary()); }
    if (t.t === 'q') {
      k++;
      const x = peek();
      if (!x || x.t !== 'id' || classify(x.v, false) !== 'var') fail(`${t.v === 'all' ? '∀' : '∃'} must be followed by a variable`);
      k++;
      if (peek() && peek().t === '.') { k++; return Q(t.v, x.v, formula(0)); }
      return Q(t.v, x.v, unary());
    }
    if (t.t === 'k') { k++; return { op: 'const', val: t.v, id: NID++ }; }
    if (t.t === 'id' && classify(t.v, peek(1) && peek(1).t === '(') === 'rel') return relApp();
    if (t.t === 'id' && classify(t.v, false) === 'rel0') fail(`the relation symbol ${t.v} needs its arguments in parentheses`);
    if (t.t === '(') return alt(infixAtom, () => { k++; const f = formula(0); expect(')', 'missing “)”'); return f; });
    if (t.t === ')') fail('unexpected “)”');
    if (t.t === 'c') fail(`${CONN[t.v]} needs a formula on its left`);
    return infixAtom();
  }
  try {
    if (!toks.length) return { error: 'empty input', pos: 0 };
    if (allowTerm) {
      const save = k;
      try { const tm = term(); if (k === toks.length) return { ast: tm, kind: 'term' }; } catch (e) { if (e.msg == null) throw e; }
      k = save; best = null;
    }
    const ast = formula(0);
    if (k < toks.length) {
      const t = toks[k];
      fail(t.t === ')' ? 'unbalanced “)”' : t.t === 'r' ? `${t.v} needs terms on both sides, not formulas` : 'two formulas side by side need a connective');
    }
    return { ast, kind: 'formula' };
  } catch (e) {
    if (e.msg == null) throw e;
    const er = best && best.at > e.at ? best : e;
    return { error: er.msg, pos: er.pos };
  }
}

// ---------------------------------------------------------------- printing
export const varTex = (n) => { const m = n.match(/^([A-Za-z]+)_?(\d+)('*)$/); if (m) return `${m[1]}_{${m[2]}}${m[3]}`; return n.length > 1 && !/'$/.test(n) ? `\\mathit{${n}}` : n; };
const symTex = (n) => (n.length > 1 && /^[A-Za-z]+$/.test(n) ? `\\mathrm{${n}}` : n);
/**
 * Token list for a term or formula with minimal parentheses: [{s, tex, kind, node}], kinds:
 * q (quantifier sign), bvar (its variable; node = the quantifier), var, const, fn, rel, conn, op (infix fn/rel), paren, comma.
 */
export function tokensOf(n) {
  const out = [];
  const P = (s) => out.push({ s, tex: s, kind: 'paren' });
  const term = (t, parentP = 0, side = '') => {
    if (t.t === 'var') { out.push({ s: t.name, tex: varTex(t.name), kind: 'var', node: t }); return; }
    if (t.t === 'const') { out.push({ s: t.name, tex: symTex(t.name), kind: 'const', node: t }); return; }
    if (FPREC[t.f] && t.args.length === 2) {
      const p = FPREC[t.f], need = p < parentP || (p === parentP && side === 'r');
      if (need) P('(');
      term(t.args[0], p, 'l'); out.push({ s: t.f, tex: t.f === '·' ? '\\cdot ' : '+', kind: 'op', node: t }); term(t.args[1], p, 'r');
      if (need) P(')');
      return;
    }
    out.push({ s: t.f, tex: symTex(t.f), kind: 'fn', node: t }); P('(');
    t.args.forEach((a, i) => { if (i) out.push({ s: ',', tex: ',', kind: 'comma' }); term(a); });
    P(')');
  };
  const form = (f, parentP = 0, side = '') => {
    if (f.t) { term(f); return; }
    if (f.op === 'rel') {
      if (INFIX_REL.has(f.r) && f.args.length === 2) {
        const wrap = parentP === 9;
        if (wrap) P('(');
        term(f.args[0]); out.push({ s: f.r, tex: RELTEX[f.r], kind: 'op', node: f }); term(f.args[1]);
        if (wrap) P(')');
        return;
      }
      out.push({ s: f.r, tex: symTex(f.r), kind: 'rel', node: f }); P('(');
      f.args.forEach((a, i) => { if (i) out.push({ s: ',', tex: ',', kind: 'comma' }); term(a); });
      P(')'); return;
    }
    if (f.op === 'const') { out.push({ s: f.val ? '⊤' : '⊥', tex: f.val ? '\\top' : '\\bot', kind: 'const', node: f }); return; }
    if (f.op === 'not') { out.push({ s: '¬', tex: '\\neg', kind: 'conn', node: f }); form(f.a, 9); return; }
    if (isQ(f)) {
      out.push({ s: f.op === 'all' ? '∀' : '∃', tex: f.op === 'all' ? '\\forall' : '\\exists', kind: 'q', node: f });
      out.push({ s: f.v, tex: varTex(f.v), kind: 'bvar', node: f });
      form(f.a, 9); return;
    }
    const p = PREC[f.op];
    const need = p < parentP || (p === parentP && (f.op === 'imp' ? side === 'l' : side === 'r'));
    if (need) P('(');
    form(f.a, p, 'l'); out.push({ s: CONN[f.op], tex: CTEX[f.op], kind: 'conn', node: f, bin: true }); form(f.b, p, 'r');
    if (need) P(')');
  };
  form(n);
  return out;
}
const spaced = (tk) => (tk.kind === 'conn' && tk.bin) || (tk.kind === 'op' && tk.s !== '·');
export function toStr(n) {
  const T = tokensOf(n); let s = '';
  T.forEach((tk, i) => {
    if (spaced(tk)) s += ` ${tk.s} `;
    else if (tk.kind === 'comma') s += ', ';
    else { s += tk.s; if (tk.kind === 'bvar' && T[i + 1] && T[i + 1].kind !== 'q') s += ' '; }
  });
  return s.replace(/\s+/g, ' ').trim();
}
export function toTex(n) {
  const T = tokensOf(n); let s = '';
  T.forEach((tk, i) => {
    if (tk.kind === 'bvar') s += `${tk.tex}\\,` + (T[i + 1] && T[i + 1].kind === 'q' ? '' : '');
    else if (tk.kind === 'q') s += tk.tex + ' ';
    else if (spaced(tk)) s += ` ${tk.tex} `;
    else if (tk.kind === 'conn') s += tk.tex + ' ';
    else s += tk.tex;
  });
  return s;
}

// ---------------------------------------------------------------- variables
export function sortVars(set) {
  const order = 'xyzuvwst';
  return [...set].sort((a, b) => {
    const ia = order.indexOf(a[0]), ib = order.indexOf(b[0]);
    if (a[0] !== b[0]) return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a < b ? -1 : 1);
    return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
  });
}
/** Every variable occurrence in left-to-right order: {node, name, binder (quantifier node) | null}. */
export function occurrences(n) {
  const out = [];
  const walk = (x, scope) => {
    if (x.t === 'var') { out.push({ node: x, name: x.name, binder: scope.get(x.name) || null }); return; }
    if (isQ(x)) { const s2 = new Map(scope); s2.set(x.v, x); walk(x.a, s2); return; }
    for (const c of kids(x)) walk(c, scope);
  };
  walk(n, new Map());
  return out;
}
export const freeVars = (n) => sortVars(new Set(occurrences(n).filter((o) => !o.binder).map((o) => o.name)));
export function allVars(n) { const s = new Set(); for (const x of preorder(n)) { if (x.t === 'var') s.add(x.name); if (isQ(x)) s.add(x.v); } return s; }
export const quantifiersOf = (n) => preorder(n).filter(isQ);
export function qrank(n) { if (n.t || n.op === 'rel' || n.op === 'const') return 0; if (isQ(n)) return 1 + qrank(n.a); return Math.max(...kids(n).map(qrank)); }
export const isSentence = (n) => freeVars(n).length === 0;
/** A variable name not in `used`, preferring the given list. */
export function freshVar(used, prefer = ['z', 'w', 'u', 'v', 's', 't', 'y', 'x']) {
  for (const p of prefer) if (!used.has(p)) return p;
  for (let i = 1; ; i++) for (const p of ['x', 'y', 'z']) if (!used.has(p + i)) return p + i;
}
/** Rename the free occurrences of x to the variable z (z assumed not to be captured). */
export function renameFree(n, x, z) {
  const free = new Set(occurrences(n).filter((o) => !o.binder && o.name === x).map((o) => o.node));
  return clone(n, true, (m) => (free.has(m) ? { ...m, name: z } : null));
}
/** Rename the variable of quantifier node q and the occurrences it binds to z (no capture check). */
export function renameBound(n, q, z) {
  const bound = new Set(occurrences(n).filter((o) => o.binder === q).map((o) => o.node));
  return clone(n, true, (m) => (bound.has(m) ? { ...m, name: z } : m === q ? { op: q.op, v: z, a: clone(q.a, true, (u) => (bound.has(u) ? { ...u, name: z } : null)), id: q.id } : null));
}
/**
 * Substitute term t for the free occurrences of x in φ.
 * avoid = true renames bound variables that would capture a variable of t (capture-avoiding); false substitutes blindly.
 * Returns {ast, renamed: [{from, to, q}], captured: [{q, name}]}.
 */
export function subst(phi, x, t, { avoid = true } = {}) {
  const renamed = [], captured = [], tv = new Set(occurrences(t).map((o) => o.name));
  const go = (n) => {
    if (n.t === 'var') return n.name === x ? clone(t) : { ...n };
    if (n.t === 'const') return { ...n };
    if (n.t === 'fn') return { ...n, args: n.args.map(go) };
    if (n.op === 'rel') return { ...n, args: n.args.map(go) };
    if (n.op === 'const') return { ...n };
    if (n.op === 'not') return { ...n, a: go(n.a) };
    if (isQ(n)) {
      if (n.v === x || !freeVars(n.a).includes(x)) return clone(n, true);
      if (tv.has(n.v)) {
        if (avoid) {
          const used = new Set([...allVars(phi), ...tv, x]);
          const z = freshVar(used);
          renamed.push({ from: n.v, to: z, q: n });
          return { op: n.op, v: z, a: go(renameFree(n.a, n.v, z)), id: n.id };
        }
        captured.push({ q: n, name: n.v });
      }
      return { ...n, a: go(n.a) };
    }
    return { ...n, a: go(n.a), b: go(n.b) };
  };
  return { ast: go(phi), renamed, captured };
}

// ---------------------------------------------------------------- prenex form
/**
 * Prenex rewriting, one step at a time (outermost-leftmost redex first).
 * mode: 'correct' | 'norename' (pull quantifiers out even when that captures a variable) | 'noflip' (keep ∀/∃ when leaving an antecedent).
 * Returns [{ast, rule, line, note}] starting with the input.
 */
export function prenexSteps(phi, mode = 'correct', maxSteps = 60) {
  const steps = [{ ast: phi, rule: 'start', line: 0, note: 'the formula as typed' }];
  const hasQ = (n) => preorder(n).some(isQ);
  const dual = (op) => (op === 'all' ? 'ex' : 'all');
  const qs = (op) => (op === 'all' ? '∀' : '∃');
  let usedAll = new Set();
  const rewrite = (n) => {
    // returns {node, rule, line, note} for the first redex in n, or null
    if (n.t || n.op === 'rel' || n.op === 'const') return null;
    if (isQ(n)) { const r = rewrite(n.a); return r && { ...r, node: { ...n, a: r.node } }; }
    if (n.op === 'iff' && (hasQ(n.a) || hasQ(n.b))) {
      return { node: BIN('and', BIN('imp', n.a, clone(n.b)), BIN('imp', n.b, clone(n.a))), rule: 'expand ↔', line: 1, note: 'expand α ↔ β into (α → β) ∧ (β → α)' };
    }
    if (n.op === 'not' && isQ(n.a)) {
      const q = n.a; return { node: Q(dual(q.op), q.v, NOT(q.a)), rule: `¬${qs(q.op)} ⇒ ${qs(dual(q.op))}¬`, line: 2, note: `¬${qs(q.op)}${q.v} α is equivalent to ${qs(dual(q.op))}${q.v} ¬α` };
    }
    if (isBin(n)) {
      for (const side of ['a', 'b']) {
        const q = n[side]; if (!isQ(q)) continue;
        const other = side === 'a' ? n.b : n.a;
        if (freeVars(other).includes(q.v) && mode !== 'norename') {
          const used = new Set([...usedAll, ...allVars(n), ...freeVars(other)]);
          const z = freshVar(used, [q.v + "'", 'z', 'w', 'u', 'v']);
          const q2 = { op: q.op, v: z, a: renameFree(q.a, q.v, z), id: q.id };
          return { node: { ...n, [side]: q2 }, rule: 'rename', line: 5, note: `${q.v} is free in the other side, so rename the bound ${q.v} to ${z} first` };
        }
        let op = q.op, line = 3, txt = '';
        if (n.op === 'imp' && side === 'a') {
          if (mode !== 'noflip') { op = dual(q.op); txt = ` (an antecedent: ${qs(q.op)} becomes ${qs(op)})`; }
          line = 4;
        }
        const inner = side === 'a' ? BIN(n.op, q.a, n.b) : BIN(n.op, n.a, q.a);
        const cap = freeVars(other).includes(q.v);
        return { node: Q(op, q.v, inner), rule: `pull ${qs(q.op)}${q.v} out of ${CONN[n.op]}`, line, note: `pull ${qs(q.op)}${q.v} out of ${CONN[n.op]}${txt}${cap ? ` — but ${q.v} is free on the other side and gets captured` : ''}` };
      }
    }
    for (const side of n.op === 'not' ? ['a'] : ['a', 'b']) {
      const r = rewrite(n[side]); if (r) return { ...r, node: { ...n, [side]: r.node } };
    }
    return null;
  };
  let cur = phi;
  for (let i = 0; i < maxSteps; i++) {
    usedAll = allVars(cur);
    const r = rewrite(cur); if (!r) break;
    cur = clone(r.node); steps.push({ ast: cur, rule: r.rule, line: r.line, note: r.note });
  }
  return steps;
}
export function isPrenex(n) { while (isQ(n)) n = n.a; return !preorder(n).some(isQ); }

// ---------------------------------------------------------------- semantics
const RELMAP = { '>': ['<', true], '≥': ['≤', true] };
/** Compile a formula or term to a closure (M, env) → value; env is mutated by quantifiers and restored. */
export function compile(n) {
  if (n.t === 'var') { const x = n.name; return (M, env) => { const v = env[x]; if (v === undefined) throw { free: x }; return v; }; }
  if (n.t === 'const') { const c = n.name; return (M) => M.konst(c); }
  if (n.t === 'fn') { const fs = n.args.map(compile), f = n.f; return (M, env) => M.fn(f, fs.map((g) => g(M, env))); }
  switch (n.op) {
    case 'const': { const v = n.val; return () => v; }
    case 'rel': {
      const fs = n.args.map(compile);
      if (n.r === '=') return (M, env) => fs[0](M, env) === fs[1](M, env);
      if (n.r === '≠') return (M, env) => fs[0](M, env) !== fs[1](M, env);
      const [r, flip] = RELMAP[n.r] || [n.r, false];
      if (r === '≤') return (M, env) => { const a = fs[0](M, env), b = fs[1](M, env); const [p, q] = flip ? [b, a] : [a, b]; return M.hasLe ? M.rel('≤', [p, q]) : p === q || M.rel('<', [p, q]); };
      return (M, env) => { const a = fs.map((g) => g(M, env)); if (flip) a.reverse(); return M.rel(r, a); };
    }
    case 'not': { const f = compile(n.a); return (M, env) => !f(M, env); }
    case 'and': { const f = compile(n.a), g = compile(n.b); return (M, env) => f(M, env) && g(M, env); }
    case 'or': { const f = compile(n.a), g = compile(n.b); return (M, env) => f(M, env) || g(M, env); }
    case 'imp': { const f = compile(n.a), g = compile(n.b); return (M, env) => !f(M, env) || g(M, env); }
    case 'iff': { const f = compile(n.a), g = compile(n.b); return (M, env) => f(M, env) === g(M, env); }
    case 'all': case 'ex': {
      const f = compile(n.a), x = n.v, ex = n.op === 'ex', rk = qrank(n);
      return (M, env) => {
        const old = env[x], had = Object.prototype.hasOwnProperty.call(env, x);
        const dom = M.cands ? M.cands(env, rk) : M.dom;
        let res = !ex;
        for (const d of dom) { env[x] = d; if (f(M, env) === ex) { res = ex; break; } }
        if (had) env[x] = old; else delete env[x];
        return res;
      };
    }
  }
  throw new Error('compile: unknown node');
}
const CC = new WeakMap();
const compiled = (n) => { let f = CC.get(n); if (!f) { f = compile(n); CC.set(n, f); } return f; };
/** M ⊨ φ[env]. Throws {free: x} if a free variable has no value. */
export function holds(phi, M, env = {}) { return compiled(phi)(M, { ...env }); }
export function evalTerm(t, M, env = {}) { return compiled(t)(M, { ...env }); }
/** The set {a ∈ M : M ⊨ φ[x := a]} for a formula with (at most) the free variable x. */
export function definedSet(phi, M, x = 'x', env = {}) { const f = compiled(phi), e = { ...env }; return M.dom.filter((a) => { e[x] = a; return f(M, e); }); }

/**
 * Step-by-step evaluation (Tarski's clauses) with short-circuiting. Frames: {node, env, val?, trying?, decided?, note}.
 * `vals`: id → value for the nodes decided in the current branch. Stops recording after `limit` frames.
 */
export function traceEval(phi, M, env0 = {}, { limit = 500, label = (a) => String(a) } = {}) {
  const frames = []; let cut = false;
  const cur = new Map();
  const push = (f) => { if (frames.length < limit) frames.push({ ...f, env: { ...f.env }, vals: new Map(cur) }); else cut = true; };
  const clearBelow = (n) => { for (const m of preorder(n)) cur.delete(m.id); };
  const tstr = (t, env) => { try { return label(evalTerm(t, M, env)); } catch { return '?'; } };
  const go = (n, env) => {
    let val;
    if (n.op === 'rel' || n.op === 'const') {
      val = holds(n, M, env);
      cur.set(n.id, val);
      const args = n.op === 'rel' ? n.args.map((t) => tstr(t, env)) : [];
      const inst = n.op === 'rel' ? (INFIX_REL.has(n.r) ? `${args[0]} ${n.r} ${args[1]}` : `${n.r}(${args.join(', ')})`) : (n.val ? '⊤' : '⊥');
      push({ node: n, env, val, note: `atomic: ${inst} is ${val ? 'true' : 'false'}` });
      return val;
    }
    if (n.op === 'not') { const a = go(n.a, env); val = !a; cur.set(n.id, val); push({ node: n, env, val, note: `¬ flips ${a ? 'true' : 'false'} to ${val ? 'true' : 'false'}` }); return val; }
    if (isBin(n)) {
      const a = go(n.a, env);
      const short = (n.op === 'and' && !a) || (n.op === 'or' && a) || (n.op === 'imp' && !a);
      let b = null;
      if (!short) b = go(n.b, env);
      val = n.op === 'and' ? a && b : n.op === 'or' ? a || b : n.op === 'imp' ? !a || b : a === b;
      cur.set(n.id, val);
      push({ node: n, env, val, note: short ? `${CONN[n.op]}: the left side already decides it (${val ? 'true' : 'false'})` : `${CONN[n.op]} of ${a ? 'T' : 'F'} and ${b ? 'T' : 'F'} is ${val ? 'true' : 'false'}` });
      return val;
    }
    if (isQ(n)) {
      const ex = n.op === 'ex', dom = M.cands ? M.cands(env, qrank(n)) : M.dom;
      let decided = null;
      for (const d of dom) {
        const e2 = { ...env, [n.v]: d };
        clearBelow(n.a);
        push({ node: n, env: e2, trying: d, note: `${ex ? '∃' : '∀'}${n.v}: try ${n.v} = ${label(d)}` });
        const r = go(n.a, e2);
        if (r === ex) { decided = d; break; }
      }
      val = decided != null ? ex : !ex;
      cur.set(n.id, val);
      const e3 = decided != null ? { ...env, [n.v]: decided } : env;
      push({ node: n, env: e3, val, decided, note: decided != null ? (ex ? `${n.v} = ${label(decided)} is a witness, so ∃${n.v} is true` : `${n.v} = ${label(decided)} is a counterexample, so ∀${n.v} is false`) : (ex ? `no ${n.v} works, so ∃${n.v} is false` : `every ${n.v} works, so ∀${n.v} is true`) });
      return val;
    }
    throw new Error('traceEval: term');
  };
  const val = go(phi, { ...env0 });
  return { frames, val, cut };
}
/**
 * Who wins the evaluation game, and how: for a formula in env, the winning player's choices at the quantifiers
 * along the play where the losing player also plays “first available”. Returns [{q, x, d, role}] (role witness | counterexample | all | none).
 */
export function explainLine(phi, M, env0 = {}) {
  const line = [];
  const go = (n, env, want) => {
    // want = the truth value the winning side defends at n (true: Verifier)
    if (n.op === 'rel' || n.op === 'const') return;
    if (n.op === 'not') return go(n.a, env, !want);
    if (isBin(n)) {
      const a = holds(n.a, M, env), b = holds(n.b, M, env);
      if (n.op === 'and') return want ? go(n.a, env, true) : go(a ? n.b : n.a, env, false);
      if (n.op === 'or') return want ? go(a ? n.a : n.b, env, true) : go(n.a, env, false);
      if (n.op === 'imp') return want ? (a ? go(n.b, env, true) : go(n.a, env, false)) : go(n.a, env, true);
      return go(n.a, env, a);
    }
    if (isQ(n)) {
      const dom = M.cands ? M.cands(env, qrank(n)) : M.dom;
      const ex = n.op === 'ex';
      if (ex === want) {
        const d = dom.find((e) => holds(n.a, M, { ...env, [n.v]: e }) === want);
        line.push({ q: n, x: n.v, d, role: ex ? 'witness' : 'counterexample' });
        if (d !== undefined) go(n.a, { ...env, [n.v]: d }, want);
      } else {
        line.push({ q: n, x: n.v, d: dom[0], role: 'all' });
        if (dom.length) go(n.a, { ...env, [n.v]: dom[0] }, want);
      }
    }
  };
  go(phi, { ...env0 }, holds(phi, M, env0));
  return line;
}

// ---------------------------------------------------------------- finite structures
export const range = (n) => Array.from({ length: n }, (_, i) => i);
/** A directed graph (one binary relation, answered for any binary symbol) plus optional unary predicates P, Q. */
export function graphStruct(n, adj, { unary = {}, label = (a) => String(a) } = {}) {
  return { n, dom: range(n), label, rel: (r, a) => (a.length === 2 ? !!adj[a[0]][a[1]] : a.length === 1 ? !!(unary[r] && unary[r][a[0]]) : false), fn: () => { throw new Error('no functions'); }, konst: () => { throw new Error('no constants'); }, adj };
}
/** Structure from relation tables: tables[name] = {arity, bits: Uint8Array of n^arity} (index Σ aᵢ·n^i); funcs[name] = {arity, tab}; consts[name] = element. */
export function tableStruct(n, tables, funcs = {}, consts = {}) {
  const idx = (a) => { let s = 0, p = 1; for (const x of a) { s += x * p; p *= n; } return s; };
  return {
    n, dom: range(n), label: (a) => String(a), tables, funcs, consts,
    rel: (r, a) => { const T = tables[r]; return T ? T.bits[idx(a)] === 1 : false; },
    fn: (f, a) => funcs[f].tab[idx(a)],
    konst: (c) => consts[c] ?? 0,
  };
}
/** The relation, function and constant symbols of some formulas (= and ≠ excluded; > and ≥ read as < and ≤). */
export function langOf(...asts) {
  const rels = new Map(), funcs = new Map(), consts = new Set();
  for (const a of asts) for (const n of preorder(a)) {
    if (n.op === 'rel' && n.r !== '=' && n.r !== '≠') { const r = RELMAP[n.r] ? RELMAP[n.r][0] : n.r; rels.set(r, n.args.length); }
    if (n.t === 'fn') funcs.set(n.f, n.args.length);
    if (n.t === 'const') consts.add(n.name);
  }
  return { rels, funcs, consts };
}
/**
 * Small structures for a language: for each size n in [minN, maxN], all of them when there are at most `cap`,
 * otherwise `cap` random ones (seeded). Yields {n, M, exhaustive, total}.
 */
export function* structures(lang, { minN = 1, maxN = 3, cap = 4096, seed = 7 } = {}) {
  const r = rng(seed);
  for (let n = minN; n <= maxN; n++) {
    const rels = [...lang.rels], funcs = [...lang.funcs], consts = [...lang.consts];
    let bits = 0; for (const [, ar] of rels) bits += n ** ar;
    const hasF = funcs.length || consts.length;
    const exhaustive = !hasF && bits <= 30 && 2 ** bits <= cap;
    const total = hasF ? Infinity : 2 ** bits;
    const count = exhaustive ? 2 ** bits : cap;
    for (let c = 0; c < count; c++) {
      const tables = {}; let off = 0;
      for (const [name, ar] of rels) {
        const sz = n ** ar, b = new Uint8Array(sz);
        for (let i = 0; i < sz; i++) b[i] = exhaustive ? Math.floor(c / 2 ** (off + i)) % 2 : r() < 0.5 ? 1 : 0;
        off += sz; tables[name] = { arity: ar, bits: b };
      }
      const fs = {}; for (const [name, ar] of funcs) { const tab = new Int32Array(n ** ar); for (let i = 0; i < tab.length; i++) tab[i] = Math.floor(r() * n); fs[name] = { arity: ar, tab }; }
      const cs = {}; for (const c0 of consts) cs[c0] = /^\d+$/.test(c0) && +c0 < n && !hasF ? +c0 : Math.floor(r() * n);
      yield { n, M: tableStruct(n, tables, fs, cs), exhaustive, total };
    }
  }
}
/** All assignments of the variables xs over {0..n−1}. */
export function* assignments(xs, n) {
  const k = xs.length, idx = new Array(k).fill(0);
  for (;;) {
    const env = {}; xs.forEach((x, i) => { env[x] = idx[i]; }); yield env;
    let i = 0; while (i < k && ++idx[i] === n) { idx[i] = 0; i++; }
    if (i === k) return;
  }
}
/**
 * Test φ ≡ ψ on all small structures (and all assignments of their free variables).
 * Returns {ok, tested, counter: {M, env, a, b} | null, exhaustiveUpTo}.
 */
export function equivalent(phi, psi, { maxN = 3, cap = 1500, seed = 7 } = {}) {
  const lang = langOf(phi, psi), xs = sortVars(new Set([...freeVars(phi), ...freeVars(psi)]));
  const f = compile(phi), g = compile(psi);
  let tested = 0, exhaustiveUpTo = 0;
  for (const { n, M, exhaustive } of structures(lang, { maxN, cap, seed })) {
    if (exhaustive) exhaustiveUpTo = n;
    for (const env of assignments(xs, n)) {
      tested++;
      const a = f(M, { ...env }), b = g(M, { ...env });
      if (a !== b) return { ok: false, tested, counter: { M, env, a, b, n } };
    }
  }
  return { ok: true, tested, counter: null, exhaustiveUpTo };
}

// ---------------------------------------------------------------- isomorphism and automorphisms
/**
 * Finite relational description for structure search: {n, bin: [n×n 0/1 matrices], un: [arrays], fn2: [n×n tables of elements]}.
 * Colour refinement (1-dimensional Weisfeiler–Leman) on one or two such structures; returns colour arrays.
 */
export function refine(As) {
  const sig0 = (A, x) => [A.bin.map((m) => m[x][x] ? 1 : 0).join(''), (A.un || []).map((u) => (u[x] ? 1 : 0)).join(''), (A.fn2 || []).map((t) => (t[x][x] === x ? 1 : 0)).join('')].join('|');
  let cols = As.map((A) => range(A.n).map((x) => sig0(A, x)));
  for (let it = 0; it < 12; it++) {
    const next = As.map((A, k) => range(A.n).map((x) => {
      const c = cols[k], parts = [];
      for (let y = 0; y < A.n; y++) {
        const b = A.bin.map((m) => `${m[x][y] ? 1 : 0}${m[y][x] ? 1 : 0}`).join('');
        const f = (A.fn2 || []).map((t) => `${c[t[x][y]]}/${c[t[y][x]]}`).join(',');
        parts.push(`${c[y]}:${b}:${f}`);
      }
      parts.sort();
      return `${c[x]}#${parts.join(';')}`;
    }));
    // compress to small ids shared across the structures
    const dict = new Map(); const out = next.map((cs) => cs.map((s) => { if (!dict.has(s)) dict.set(s, `c${dict.size}`); return dict.get(s); }));
    const classes = (cc) => new Set(cc.flat()).size;
    const stable = classes(out) === classes(cols);
    cols = out;
    if (stable) break;
  }
  return cols;
}
/**
 * Backtracking search for isomorphisms A → B (A === B: automorphisms). `fixed`: Map a → b to respect.
 * Returns the first isomorphism found (array) or null; `count` mode returns the number found (capped).
 */
export function isoSearch(A, B, { fixed = new Map(), count = false, cap = 5000, budget = 2e6, cols = null } = {}) {
  if (A.n !== B.n) return count ? 0 : null;
  const n = A.n, [cA, cB] = cols || refine([A, B]);
  const mA = new Map(), mB = new Map();
  cA.forEach((c) => mA.set(c, (mA.get(c) || 0) + 1)); cB.forEach((c) => mB.set(c, (mB.get(c) || 0) + 1));
  for (const [c, k] of mA) if (mB.get(c) !== k) return count ? 0 : null;
  const map = new Int32Array(n).fill(-1), used = new Uint8Array(n);
  const inv = (A.fn2 || []).map((F) => { const L = range(n).map(() => []); for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) L[F[x][y]].push(x, y); return L; });
  // order: fixed elements first, then greedily the element most constrained by those already placed
  const order = [], placed = new Uint8Array(n), score = new Float64Array(n);
  for (let e = 0; e < n; e++) score[e] = -mA.get(cA[e]);
  const place = (p) => {
    order.push(p); placed[p] = 1;
    for (const m of A.bin) for (let e = 0; e < n; e++) score[e] += 10 * (m[p][e] + m[e][p]);
    for (const F of A.fn2 || []) for (const x of order) { score[F[x][p]] += 1000; if (x !== p) score[F[p][x]] += 1000; }
  };
  for (const x of fixed.keys()) place(x);
  while (order.length < n) {
    let bestE = -1, bestS = -Infinity;
    for (let e = 0; e < n; e++) if (!placed[e] && score[e] > bestS) { bestS = score[e]; bestE = e; }
    place(bestE);
  }
  let found = 0, first = null, work = 0;
  const ok = (a, b) => {
    for (let i = 0; i < n; i++) {
      const bi = map[i]; if (bi < 0) continue;
      for (let r = 0; r < A.bin.length; r++) { if (A.bin[r][a][i] !== B.bin[r][b][bi] || A.bin[r][i][a] !== B.bin[r][bi][b]) return false; }
    }
    for (let r = 0; r < A.bin.length; r++) if (A.bin[r][a][a] !== B.bin[r][b][b]) return false;
    for (let r = 0; r < (A.un || []).length; r++) if (!!A.un[r][a] !== !!B.un[r][b]) return false;
    for (let r = 0; r < (A.fn2 || []).length; r++) {
      const F = A.fn2[r], G = B.fn2[r];
      const prev = map[a]; map[a] = b; // tentatively, so that pairs through a are checked
      let good = true;
      for (let x = 0; x < n && good; x++) {
        if (map[x] < 0) continue;
        const z1 = F[a][x], z2 = F[x][a];
        if (map[z1] >= 0 && map[z1] !== G[b][map[x]]) good = false;
        else if (map[z2] >= 0 && map[z2] !== G[map[x]][b]) good = false;
      }
      const L = inv[r][a];
      for (let i = 0; i < L.length && good; i += 2) { const x = L[i], y = L[i + 1]; if (map[x] >= 0 && map[y] >= 0 && G[map[x]][map[y]] !== b) good = false; }
      map[a] = prev;
      if (!good) return false;
    }
    return true;
  };
  const rec = (k) => {
    if (++work > budget) return true;
    if (k === n) { found++; if (!first) first = Array.from(map); return !count || found >= cap; }
    const a = order[k];
    const cands = fixed.has(a) ? [fixed.get(a)] : range(n);
    for (const b of cands) {
      if (used[b] || cB[b] !== cA[a]) continue;
      map[a] = b; used[b] = 1;
      if (ok(a, b) && rec(k + 1)) return true;
      map[a] = -1; used[b] = 0;
    }
    return false;
  };
  rec(0);
  return count ? found : first;
}
/** Orbits of the automorphism group (fixing the elements in `params`): array of arrays, and orbit id per element. */
export function orbits(A, params = []) {
  const n = A.n, parent = range(n);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const fixedBase = new Map(params.map((p) => [p, p]));
  const [col] = refine([A]);
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    if (find(a) === find(b) || col[a] !== col[b] || fixedBase.has(a) || fixedBase.has(b)) continue;
    const fx = new Map(fixedBase); fx.set(a, b);
    const s = isoSearch(A, A, { fixed: fx, cols: [col, col] });
    if (s) for (let x = 0; x < n; x++) { const rx = find(x), ry = find(s[x]); if (rx !== ry) parent[rx] = ry; }
  }
  const groups = new Map();
  for (let x = 0; x < n; x++) { const r = find(x); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(x); }
  const list = [...groups.values()].sort((p, q) => p[0] - q[0]);
  const id = new Array(n); list.forEach((g, k) => g.forEach((x) => { id[x] = k; }));
  return { list, id };
}

// ---------------------------------------------------------------- formula trees
/** Short label of a tree node. */
export function nodeLabel(n) {
  if (n.t === 'var' || n.t === 'const') return n.name;
  if (n.t === 'fn') return n.f;
  if (n.op === 'rel') return n.r;
  if (n.op === 'const') return n.val ? '⊤' : '⊥';
  if (isQ(n)) return (n.op === 'all' ? '∀' : '∃') + n.v;
  return CONN[n.op];
}
/** Tidy layout: leaves at consecutive x, parents centred over their children, y = −depth. */
export function layoutFO(ast) {
  const nodes = []; let leaf = 0;
  const go = (e, d, parent) => {
    const nd = { e, y: -d, parent, kids: [], id: nodes.length };
    nodes.push(nd);
    const ks = kids(e);
    if (!ks.length) nd.x = leaf++;
    else { for (const c of ks) nd.kids.push(go(c, d + 1, nd)); nd.x = (nd.kids[0].x + nd.kids[nd.kids.length - 1].x) / 2; }
    return nd;
  };
  go(ast, 0, null);
  return { nodes, width: Math.max(1, leaf), depth: Math.max(0, ...nodes.map((n) => -n.y)) };
}
export function fitFO(s, L, { pad = 0.62, minW = 4, extraTop = 0, extraBottom = 0, extraRight = 0 } = {}) {
  const w = Math.max(L.width, minW), c = (L.width - 1) / 2;
  s.setView([c - w / 2 - 0.15, c + w / 2 + 0.15 + extraRight], [-L.depth - pad - extraBottom, pad + extraTop]);
}
/**
 * Draw a laid-out first-order tree: term nodes as rounded boxes, formula nodes as discs/pills.
 * opts: fill(nd) → colour | null, ring(nd), note(nd), noteColor(nd), labelColor(nd), edgeColor(nd), r (px), size.
 */
export function drawFO(s, L, opts = {}) {
  const r = opts.r ?? 14, sx = Math.abs(s.X(1) - s.X(0)) || 1, sy = Math.abs(s.Y(1) - s.Y(0)) || 1;
  const fs = opts.size ?? 14;
  for (const nd of L.nodes) for (const c of nd.kids) s.line(nd.x, nd.y, c.x, c.y, { color: (opts.edgeColor && opts.edgeColor(c)) || 'muted', width: 1.5 });
  for (const nd of L.nodes) {
    const e = nd.e, lab = nodeLabel(e), term = isTerm(e);
    const hw = Math.max(r, lab.length * fs * 0.33 + 7), hh = term ? r - 2.5 : r;
    const f = opts.fill ? opts.fill(nd) : null, ring = opts.ring && opts.ring(nd);
    const box = (pad, st) => s.rect(nd.x - (hw + pad) / sx, nd.y - (hh + pad) / sy, nd.x + (hw + pad) / sx, nd.y + (hh + pad) / sy, { radius: term ? 5 + pad : hh + pad, ...st });
    if (ring) box(4.5, { fill: ring, fillAlpha: 1, stroke: false });
    box(0, { fill: 'panel', fillAlpha: 1, stroke: false });
    if (f) box(0, { fill: f, fillAlpha: 0.2, color: f, width: 2.1 });
    else box(0, { fill: term ? 'faint' : null, fillAlpha: term ? 0.12 : 0, color: term ? 'faint' : 'muted', width: 1.5 });
    const math = e.t === 'var' || (e.t === 'const' && /^[a-z]$/.test(e.name));
    s.text(lab, nd.x, nd.y, { align: 'center', baseline: 'middle', size: fs, math, weight: term ? 400 : 600, color: (opts.labelColor && opts.labelColor(nd)) || 'ink' });
    const note = opts.note && opts.note(nd);
    if (note != null && note !== '') s.text(String(note), nd.x, nd.y, { dx: hw + 4, dy: -hh + 1, align: 'left', baseline: 'middle', size: 11, weight: 700, color: (opts.noteColor && opts.noteColor(nd)) || 'accent' });
  }
}

// ---------------------------------------------------------------- an editable relation on a few points
/**
 * Directed graph editor for a structure with one binary relation. Click a vertex, then another (or the same one
 * again for a loop) to toggle that edge; click an edge to delete it; drag to move.
 * Returns {G, n, adj(), sel, setN(k), set(edges), onChange}.
 */
export function relEditor(v, s, { n = 4, edges = [], radius = 1, center = [0, 0], start = 90, labels = null, onChange = null, r = 15, fontSize = 13 } = {}) {
  const pos = (i, k) => { const a = (start - (360 * i) / k) * Math.PI / 180; return [center[0] + radius * Math.cos(a), center[1] + radius * Math.sin(a)]; };
  const mkNodes = (k, old = []) => range(k).map((i) => { const o = old.find((m) => m.id === i); const [x, y] = o && o.x != null ? [o.x, o.y] : pos(i, k); return { id: i, x, y, label: labels ? labels(i) : String(i) }; });
  const E = { n, sel: null, onChange };
  const G = v.graph(s, {
    directed: true, layout: 'none', r, fontSize, editable: { moveNode: true },
    nodes: mkNodes(n), edges: edges.map(([a, b]) => ({ from: a, to: b })),
    onClick: ({ node, edge }) => {
      if (node) {
        if (E.sel == null) E.sel = node.id;
        else { E.toggle(E.sel, node.id); E.sel = null; }
      } else if (edge) { G.removeEdge(edge); E.sel = null; if (E.onChange) E.onChange(); } else E.sel = null;
      return true;
    },
  });
  E.G = G;
  E.toggle = (a, b) => { const ex = G.edges.find((e) => e.from === a && e.to === b); if (ex) G.removeEdge(ex); else G.addEdge(a, b); if (E.onChange) E.onChange(); };
  E.adj = () => { const m = range(E.n).map(() => new Array(E.n).fill(0)); for (const e of G.edges) if (e.from < E.n && e.to < E.n) m[e.from][e.to] = 1; return m; };
  E.edgeList = () => G.edges.map((e) => [e.from, e.to]);
  E.setN = (k, { relayout = false } = {}) => {
    const old = relayout ? [] : G.nodes.map((m) => ({ id: m.id, x: m.x, y: m.y }));
    const es = G.edges.filter((e) => e.from < k && e.to < k).map((e) => ({ from: e.from, to: e.to }));
    E.n = k; E.sel = null;
    G.set({ nodes: mkNodes(k, old.filter((o) => o.id < Math.min(k, n + 99))), edges: es });
    if (relayout) G.nodes.forEach((m, i) => { [m.x, m.y] = pos(i, k); });
  };
  E.set = (es, k = E.n) => { E.n = k; E.sel = null; G.set({ nodes: mkNodes(k), edges: es.map(([a, b]) => ({ from: a, to: b })) }); };
  E.relayout = () => { G.nodes.forEach((m, i) => { [m.x, m.y] = pos(i, E.n); }); };
  E.ring = (id) => (id === E.sel ? 'gold' : null);
  return E;
}

/** Plain-text name of an element list, e.g. {0, 2, 3}. */
export const setStr = (xs, label = String) => (xs.length ? `{${xs.map(label).join(', ')}}` : '∅');
