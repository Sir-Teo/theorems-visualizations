// Deep Learning Theory — Chapter 3: helpers shared by ch03.js and ch03-b.js.
//
// Chapters 1–2's network engine, data sets and drawing helpers are re-exported from ch02.shared.js. New here:
//   - a formula parser that turns a typed expression into a computational graph (a DAG of elementary operations,
//     common subexpressions shared), with forward values, forward-mode tangents (dual numbers) and reverse-mode
//     adjoints computed node by node, every arithmetic operation counted;
//   - a small reverse-mode autodiff tape (Wengert list) for scalar programs, with a forward tangent sweep (JVP),
//     a backward adjoint sweep (VJP), operation counters, optional float32 rounding of every operation and an
//     optional deliberate bug (for gradient checking);
//   - helpers that turn a parsed graph into a v.graph spec and format numbers for node labels.
export * from './ch02.shared.js';
import { sigm, softplus } from './ch01.shared.js';

// ---------------------------------------------------------------- number formatting
/** Short plain-text number for node labels: 3 significant digits, real minus, scientific beyond 1e4 / below 1e-3. */
export function f3(x, d = 3) {
  if (x === 0) return '0';
  if (!isFinite(x)) return x !== x ? 'NaN' : x > 0 ? '∞' : '−∞';
  const a = Math.abs(x);
  let s;
  if (a >= 1e4 || a < 1e-3) { const e = Math.floor(Math.log10(a)); s = (x / 10 ** e).toFixed(d - 2) + 'e' + e; }
  else s = x.toPrecision(d).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return s.replace(/-/g, '−');
}

// ---------------------------------------------------------------- elementary operations
// Each op: n = arity, f(args, k) = value, d(args, out, k) = partials [∂out/∂arg_i], sym(k) = short label,
// dc = number of arithmetic operations needed to form the partials (0 when they are constants ±1 or k),
// unit = true when every partial is exactly ±1 (so the multiply in the chain rule is free).
const OPS = {
  add: { n: 2, f: (a) => a[0] + a[1], d: () => [1, 1], sym: () => '+', dc: 0, unit: true },
  sub: { n: 2, f: (a) => a[0] - a[1], d: () => [1, -1], sym: () => '−', dc: 0, unit: true },
  mul: { n: 2, f: (a) => a[0] * a[1], d: (a) => [a[1], a[0]], sym: () => '×', dc: 0 },
  div: { n: 2, f: (a) => a[0] / a[1], d: (a) => [1 / a[1], -a[0] / (a[1] * a[1])], sym: () => '÷', dc: 3 },
  pow: { n: 2, f: (a) => Math.pow(a[0], a[1]), d: (a, y) => [a[1] * Math.pow(a[0], a[1] - 1), a[0] > 0 ? y * Math.log(a[0]) : 0], sym: () => '^', dc: 4 },
  neg: { n: 1, f: (a) => -a[0], d: () => [-1], sym: () => '−·', dc: 0, unit: true },
  addc: { n: 1, f: (a, k) => a[0] + k, d: () => [1], sym: (k) => (k < 0 ? '−' + f3(-k) : '+' + f3(k)), dc: 0, unit: true },
  mulc: { n: 1, f: (a, k) => a[0] * k, d: (a, y, k) => [k], sym: (k) => '×' + f3(k), dc: 0 },
  rsubc: { n: 1, f: (a, k) => k - a[0], d: () => [-1], sym: (k) => f3(k) + '−·', dc: 0, unit: true },
  divc: { n: 1, f: (a, k) => a[0] / k, d: (a, y, k) => [1 / k], sym: (k) => '÷' + f3(k), dc: 0 },
  rdivc: { n: 1, f: (a, k) => k / a[0], d: (a, y, k) => [-k / (a[0] * a[0])], sym: (k) => f3(k) + '÷·', dc: 2 },
  powc: { n: 1, f: (a, k) => Math.pow(a[0], k), d: (a, y, k) => [k === 2 ? 2 * a[0] : k * Math.pow(a[0], k - 1)], sym: (k) => '^' + f3(k), dc: 1 },
  rpowc: { n: 1, f: (a, k) => Math.pow(k, a[0]), d: (a, y, k) => [y * Math.log(k)], sym: (k) => f3(k) + '^·', dc: 1 },
  sin: { n: 1, f: (a) => Math.sin(a[0]), d: (a) => [Math.cos(a[0])], sym: () => 'sin', dc: 1 },
  cos: { n: 1, f: (a) => Math.cos(a[0]), d: (a) => [-Math.sin(a[0])], sym: () => 'cos', dc: 1 },
  tan: { n: 1, f: (a) => Math.tan(a[0]), d: (a, y) => [1 + y * y], sym: () => 'tan', dc: 2 },
  exp: { n: 1, f: (a) => Math.exp(a[0]), d: (a, y) => [y], sym: () => 'exp', dc: 0 },
  log: { n: 1, f: (a) => Math.log(a[0]), d: (a) => [1 / a[0]], sym: () => 'log', dc: 1 },
  sqrt: { n: 1, f: (a) => Math.sqrt(a[0]), d: (a, y) => [0.5 / y], sym: () => '√', dc: 1 },
  abs: { n: 1, f: (a) => Math.abs(a[0]), d: (a) => [a[0] > 0 ? 1 : a[0] < 0 ? -1 : 0], sym: () => '|·|', dc: 0 },
  tanh: { n: 1, f: (a) => Math.tanh(a[0]), d: (a, y) => [1 - y * y], sym: () => 'tanh', dc: 2 },
  sigmoid: { n: 1, f: (a) => sigm(a[0]), d: (a, y) => [y * (1 - y)], sym: () => 'σ', dc: 2 },
  relu: { n: 1, f: (a) => (a[0] > 0 ? a[0] : 0), d: (a) => [a[0] > 0 ? 1 : 0], sym: () => 'ReLU', dc: 0 },
  softplus: { n: 1, f: (a) => softplus(a[0]), d: (a) => [sigm(a[0])], sym: () => 'softplus', dc: 2 },
};
export const OPNAMES = OPS;
const FUNS = { sin: 'sin', cos: 'cos', tan: 'tan', exp: 'exp', log: 'log', ln: 'log', sqrt: 'sqrt', abs: 'abs', tanh: 'tanh', sigmoid: 'sigmoid', sigma: 'sigmoid', sig: 'sigmoid', 'σ': 'sigmoid', relu: 'relu', ReLU: 'relu', softplus: 'softplus' };
const CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E };

/**
 * Parse a formula into a computational graph. vars: allowed variable names. share: hash-cons identical subexpressions
 * (a DAG; false gives the expression tree, every occurrence its own node). Constant operands are folded into unary
 * ops (×2, +1, ^2), so the nodes are the variables and the operations.
 * Returns {nodes: [{i, op, args, k, name}], out, vars: [names used], error: null} or {error}.
 * Nodes are in topological order (arguments before their users).
 */
export function parseGraph(src, vars = ['x', 'y', 'z'], { share = true } = {}) {
  const s = String(src ?? '').replace(/\*\*/g, '^').replace(/[−–]/g, '-').replace(/·|×/g, '*');
  let i = 0;
  const nodes = [], memoK = new Map(), used = new Set();
  const err = (m) => { throw new Error(`${m} at position ${i + 1}`); };
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const peek = () => { ws(); return s[i]; };
  const C = (v) => ({ c: v });                       // a pure constant (not a node yet)
  const node = (op, args, k = 0, name = null) => {
    const key = op + '|' + args.join(',') + '|' + k + '|' + (name || '');
    if (share && memoK.has(key)) return memoK.get(key);
    const id = nodes.length; nodes.push({ i: id, op, args, k, name }); if (share) memoK.set(key, id); return id;
  };
  const isC = (a) => typeof a === 'object';
  const bin = (op, a, b) => {
    if (isC(a) && isC(b)) return C(OPS[op].f([a.c, b.c]));
    if (isC(b)) {
      if (op === 'add') return b.c === 0 ? a : node('addc', [a], b.c);
      if (op === 'sub') return b.c === 0 ? a : node('addc', [a], -b.c);
      if (op === 'mul') return b.c === 1 ? a : node('mulc', [a], b.c);
      if (op === 'div') return b.c === 1 ? a : node('divc', [a], b.c);
      if (op === 'pow') return b.c === 1 ? a : node('powc', [a], b.c);
    }
    if (isC(a)) {
      if (op === 'add') return a.c === 0 ? b : node('addc', [b], a.c);
      if (op === 'sub') return a.c === 0 ? node('neg', [b]) : node('rsubc', [b], a.c);
      if (op === 'mul') return a.c === 1 ? b : a.c === -1 ? node('neg', [b]) : node('mulc', [b], a.c);
      if (op === 'div') return node('rdivc', [b], a.c);
      if (op === 'pow') return a.c === Math.E ? node('exp', [b]) : node('rpowc', [b], a.c);
    }
    return node(op, [a, b]);
  };
  const startsAtom = () => { const c = peek(); return c != null && /[0-9.(a-zA-Zπσ]/.test(c); };
  const atom = () => {
    const c = peek();
    if (c === '(') { i++; const e = expr(); if (peek() !== ')') err('missing )'); i++; return e; }
    if (c != null && /[0-9.]/.test(c)) { const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i)); if (!m) err('bad number'); i += m[0].length; return C(+m[0]); }
    const m = /^([a-zA-Zπσ][a-zA-Z0-9_]*)/.exec(s.slice(i)); if (!m) err(c == null ? 'unexpected end' : `unexpected "${c}"`);
    let name = m[1];
    if (!(name in FUNS) && !(name in CONSTS) && !vars.includes(name)) {
      const pre = [...vars, ...Object.keys(CONSTS), ...Object.keys(FUNS)].filter((v) => name.startsWith(v)).sort((a, b) => b.length - a.length)[0];
      if (!pre) err(`unknown name "${name}"`); name = pre;
    }
    i += name.length;
    if (name in FUNS) {
      let a;
      if (peek() === '(') { i++; a = expr(); if (peek() !== ')') err('missing )'); i++; } else a = power();
      const op = FUNS[name];
      return isC(a) ? C(OPS[op].f([a.c])) : node(op, [a]);
    }
    if (name in CONSTS) return C(CONSTS[name]);
    used.add(name);
    return node('var', [], 0, name);
  };
  const power = () => { const b = atom(); if (peek() === '^') { i++; const ex = unary(); return bin('pow', b, ex); } return b; };
  const unary = () => { const c = peek(); if (c === '-') { i++; const a = unary(); return isC(a) ? C(-a.c) : node('neg', [a]); } if (c === '+') { i++; return unary(); } return power(); };
  const term = () => {
    let a = unary();
    for (;;) {
      const c = peek();
      if (c === '*' || c === '/') { i++; const b = unary(); a = bin(c === '*' ? 'mul' : 'div', a, b); }
      else if (startsAtom()) { const b = power(); a = bin('mul', a, b); }
      else return a;
    }
  };
  const expr = () => { let a = term(); for (;;) { const c = peek(); if (c === '+' || c === '-') { i++; const b = term(); a = bin(c === '+' ? 'add' : 'sub', a, b); } else return a; } };
  try {
    if (!s.trim()) err('empty formula');
    let out = expr(); if (peek() != null) err(`unexpected "${peek()}"`);
    if (isC(out)) err('the formula has no variables');
    if (nodes.length > 60) err('formula too long for the picture (over 60 nodes)');
    // drop nodes not reachable from the output (cannot happen with a single expression, kept for safety)
    return { nodes, out, vars: vars.filter((v) => used.has(v)), error: null };
  } catch (x) { return { error: x.message }; }
}

/** Short symbol of a node (variable name, or op label). */
export const nodeSym = (n) => (n.op === 'var' ? n.name : OPS[n.op].sym(n.k));

/**
 * Forward pass on a parsed graph: values of every node. env: {name: value}. Counts arithmetic operations (one per node).
 */
export function graphValues(G, env) {
  const val = new Float64Array(G.nodes.length);
  for (const n of G.nodes) val[n.i] = n.op === 'var' ? env[n.name] : OPS[n.op].f(n.args.map((a) => val[a]), n.k);
  return val;
}
/** Local partial derivatives of node n (array, one per argument) given all values. */
export function graphPartials(G, val, n) { return n.op === 'var' ? [] : OPS[n.op].d(n.args.map((a) => val[a]), val[n.i], n.k); }

/**
 * Forward mode (dual numbers) on a parsed graph: tangent of every node for the seed {name: ẋ}.
 * Returns {val, dot, ops}: ops counts the arithmetic operations of the whole dual pass (values + partials + chain rule).
 */
export function graphForward(G, env, seed) {
  const val = graphValues(G, env), dot = new Float64Array(G.nodes.length); let ops = 0;
  for (const n of G.nodes) {
    if (n.op === 'var') { dot[n.i] = seed[n.name] || 0; continue; }
    const O = OPS[n.op], p = graphPartials(G, val, n);
    ops += 1 + O.dc;                                   // the value and the local partials
    let t = 0; n.args.forEach((a, k) => { t += p[k] * dot[a]; ops += (O.unit ? 0 : 1) + (k ? 1 : 0); });
    dot[n.i] = t;
  }
  return { val, dot, ops };
}

/**
 * Reverse mode on a parsed graph. Returns {val, adj, ops, events}: adj[i] = ∂out/∂node_i; events lists, in backward
 * order, each node processed with the edge contributions [{from: arg, to: node, partial, contrib}].
 */
export function graphReverse(G, env) {
  const val = graphValues(G, env), adj = new Float64Array(G.nodes.length), events = []; let ops = G.nodes.filter((n) => n.op !== 'var').length;
  adj[G.out] = 1;
  for (let i = G.nodes.length - 1; i >= 0; i--) {
    const n = G.nodes[i]; if (n.op === 'var') continue;
    const O = OPS[n.op], p = graphPartials(G, val, n), contrib = [];
    ops += O.dc;
    n.args.forEach((a, k) => { const c = adj[i] * p[k]; adj[a] += c; ops += (O.unit ? 0 : 1) + 1; contrib.push({ from: a, to: i, k, partial: p[k], contrib: c }); });
    events.push({ node: i, adj: adj[i], contrib });
  }
  return { val, adj, ops, events };
}
/** Plain evaluation of the graph's output as a function of an env (for finite differences). */
export const graphEval = (G, env) => graphValues(G, env)[G.out];

/**
 * v.graph spec for a parsed graph: box nodes, inputs pinned to the first layer, edges argument → user (one per
 * argument slot, so x·x gets two parallel edges). label(n) gives the initial label (for box sizing).
 */
export function graphSpec(G, label = nodeSym) {
  return {
    directed: true, shape: 'box', layout: 'layered', rankdir: 'right', r: 11, fontSize: 12, draggable: true,
    nodes: G.nodes.map((n) => ({ id: n.i, label: label(n), layer: n.op === 'var' ? 0 : undefined })),
    edges: G.nodes.flatMap((n) => n.args.map((a, k) => ({ from: a, to: n.i, k }))),
  };
}

// ---------------------------------------------------------------- a reverse-mode tape (Wengert list)
const T_IN = 0, T_ADD = 1, T_SUB = 2, T_MUL = 3, T_DIV = 4, T_NEG = 5, T_EXP = 6, T_LOG = 7, T_TANH = 8, T_SIG = 9, T_RELU = 10,
  T_SIN = 11, T_COS = 12, T_SQR = 13, T_ADDC = 14, T_MULC = 15, T_POWC = 16, T_SQRT = 17;
/**
 * Scalar reverse-mode autodiff on a recorded tape. Every operation appends one entry (op, arguments, value).
 *   const T = new Tape(); const x = T.input(0.3), y = T.input(2); const f = T.mul(T.sin(x), y);
 *   T.val(f); const g = T.backward(f); g[x], g[y]                    // gradient by one backward sweep
 *   const d = T.tangent(new Map([[x, 1]])); d[f]                      // directional derivative by one forward sweep
 * Counters: T.fops (operations recorded), T.bops (last backward sweep), T.tops (last tangent sweep), counted as
 * arithmetic operations (a multiply-accumulate counts 2; a partial equal to ±1 needs no multiply).
 * Options: round (e.g. Math.fround — every value rounded, simulating float32), bug ('tanh': the backward sweep uses
 * 1 − y instead of 1 − y² for tanh, a typical hand-coding slip).
 */
export class Tape {
  constructor(o = {}) { this.op = []; this.a = []; this.b = []; this.k = []; this.v = []; this.round = o.round || null; this.bug = o.bug || null; this.fops = 0; this.bops = 0; this.tops = 0; }
  get length() { return this.v.length; }
  _p(op, a, b, k, x) { if (this.round) x = this.round(x); this.op.push(op); this.a.push(a); this.b.push(b); this.k.push(k); this.v.push(x); if (op !== T_IN) this.fops++; return this.v.length - 1; }
  val(i) { return this.v[i]; }
  input(x) { return this._p(T_IN, -1, -1, 0, x); }
  add(i, j) { return this._p(T_ADD, i, j, 0, this.v[i] + this.v[j]); }
  sub(i, j) { return this._p(T_SUB, i, j, 0, this.v[i] - this.v[j]); }
  mul(i, j) { return this._p(T_MUL, i, j, 0, this.v[i] * this.v[j]); }
  div(i, j) { return this._p(T_DIV, i, j, 0, this.v[i] / this.v[j]); }
  neg(i) { return this._p(T_NEG, i, -1, 0, -this.v[i]); }
  exp(i) { return this._p(T_EXP, i, -1, 0, Math.exp(this.v[i])); }
  log(i) { return this._p(T_LOG, i, -1, 0, Math.log(this.v[i])); }
  tanh(i) { return this._p(T_TANH, i, -1, 0, Math.tanh(this.v[i])); }
  sigmoid(i) { return this._p(T_SIG, i, -1, 0, sigm(this.v[i])); }
  relu(i) { return this._p(T_RELU, i, -1, 0, this.v[i] > 0 ? this.v[i] : 0); }
  sin(i) { return this._p(T_SIN, i, -1, 0, Math.sin(this.v[i])); }
  cos(i) { return this._p(T_COS, i, -1, 0, Math.cos(this.v[i])); }
  sqr(i) { return this._p(T_SQR, i, -1, 0, this.v[i] * this.v[i]); }
  sqrt(i) { return this._p(T_SQRT, i, -1, 0, Math.sqrt(this.v[i])); }
  addc(i, c) { return this._p(T_ADDC, i, -1, c, this.v[i] + c); }
  mulc(i, c) { return this._p(T_MULC, i, -1, c, this.v[i] * c); }
  powc(i, c) { return this._p(T_POWC, i, -1, c, Math.pow(this.v[i], c)); }
  act(name, i) { return name === 'tanh' ? this.tanh(i) : name === 'sigmoid' ? this.sigmoid(i) : name === 'relu' ? this.relu(i) : name === 'linear' ? i : this.tanh(i); }
  /** Σ of a list of entries. */
  sum(list) { let s = list[0]; for (let k = 1; k < list.length; k++) s = this.add(s, list[k]); return s; }
  /** Dot product of two lists of entries (or entries and constants when wc is given). */
  dot(xs, ws) { let s = this.mul(xs[0], ws[0]); for (let k = 1; k < xs.length; k++) s = this.add(s, this.mul(xs[k], ws[k])); return s; }
  /** Local partials of entry i: [∂/∂a, ∂/∂b]. */
  _d(i) {
    const op = this.op[i], a = this.a[i], b = this.b[i], v = this.v, y = v[i];
    switch (op) {
      case T_ADD: return [1, 1]; case T_SUB: return [1, -1]; case T_MUL: return [v[b], v[a]];
      case T_DIV: return [1 / v[b], -v[a] / (v[b] * v[b])]; case T_NEG: return [-1, 0];
      case T_EXP: return [y, 0]; case T_LOG: return [1 / v[a], 0];
      case T_TANH: return [this.bug === 'tanh' ? 1 - y : 1 - y * y, 0]; case T_SIG: return [y * (1 - y), 0];
      case T_RELU: return [v[a] > 0 ? 1 : 0, 0]; case T_SIN: return [Math.cos(v[a]), 0]; case T_COS: return [-Math.sin(v[a]), 0];
      case T_SQR: return [2 * v[a], 0]; case T_SQRT: return [0.5 / y, 0]; case T_ADDC: return [1, 0]; case T_MULC: return [this.k[i], 0];
      case T_POWC: return [this.k[i] * Math.pow(v[a], this.k[i] - 1), 0];
      default: return [0, 0];
    }
  }
  /** Cost (arithmetic operations) of forming the local partials of entry i. */
  _dc(op) { return op === T_DIV ? 3 : op === T_TANH || op === T_SIG ? 2 : op === T_LOG || op === T_SIN || op === T_COS || op === T_SQR || op === T_SQRT || op === T_POWC ? 1 : 0; }
  _unit(op) { return op === T_ADD || op === T_SUB || op === T_NEG || op === T_ADDC; }
  /**
   * Backward sweep. seeds: an entry index (adjoint 1) or [[index, weight], …] (a vector–Jacobian product).
   * Returns the adjoint array (∂(Σ wᵢ outᵢ)/∂ entry).
   */
  backward(seeds) {
    const n = this.v.length, adj = new Float64Array(n); let ops = 0;
    if (typeof seeds === 'number') adj[seeds] = 1; else for (const [i, w] of seeds) adj[i] += w;
    for (let i = n - 1; i >= 0; i--) {
      const op = this.op[i]; if (op === T_IN) continue; const g = adj[i]; if (g === 0) continue;
      const d = this._d(i), u = this._unit(op); ops += this._dc(op);
      adj[this.a[i]] += g * d[0]; ops += u ? 1 : 2;
      if (this.b[i] >= 0) { adj[this.b[i]] += g * d[1]; ops += u ? 1 : 2; }
    }
    this.bops = ops; return adj;
  }
  /** Forward tangent sweep (a Jacobian–vector product). seed: Map entry → tangent. Returns the tangent array. */
  tangent(seed) {
    const n = this.v.length, dot = new Float64Array(n); let ops = 0;
    for (let i = 0; i < n; i++) {
      const op = this.op[i]; if (op === T_IN) { dot[i] = seed.get(i) || 0; continue; }
      const d = this._d(i), u = this._unit(op); ops += this._dc(op);
      let t = d[0] * dot[this.a[i]]; ops += u ? 0 : 1;
      if (this.b[i] >= 0) { t += d[1] * dot[this.b[i]]; ops += u ? 1 : 2; }
      dot[i] = t;
    }
    this.tops = ops; return dot;
  }
}
