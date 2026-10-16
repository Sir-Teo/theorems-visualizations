// Computational Complexity — Chapter 1 (Diagonalization and its limits): helpers shared by ch01.js and ch01-b.js.
// Contains: small helpers, a real single-tape Turing-machine interpreter with a gallery of machines, binary-counter
// bookkeeping, and the pebble-game solver.

export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const log2 = (x) => Math.log2(x);
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (n) => String(n).split('').map((d) => (d === '-' ? '⁻' : SUP[+d])).join('');
/** Plain-text big number: 12,345 or 1.23 × 10⁹. */
export function big(x) {
  if (typeof x === 'bigint') x = Number(x);
  if (!isFinite(x)) return '∞';
  if (Math.abs(x) >= 1e7) { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(2)} × 10${sup(e)}`; }
  return Math.round(x).toLocaleString('en-US');
}
/** TeX big number. */
export function tbig(x) {
  if (typeof x === 'bigint') x = Number(x);
  if (!isFinite(x)) return '\\infty';
  if (Math.abs(x) >= 1e7) { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(2)}\\times10^{${e}}`; }
  return Math.round(x).toLocaleString('en-US').replace(/,/g, '{,}');
}
export const bitLen = (x) => (BigInt(x) === 0n ? 0 : BigInt(x).toString(2).length);
export const popcount = (x) => BigInt(x).toString(2).replace(/0/g, '').length;
/** Binary string of a non-negative integer, padded to w digits. */
export const bin = (x, w = 0) => BigInt(x).toString(2).padStart(w, '0');

// ---------------------------------------------------------------------------------------------------------------
// Binary counters (1.1): decrementing t to 0 flips (tz(j)+1) bits at each step j.
/** Total bit flips when a binary counter counts down from T to m (T >= m >= 0). Exact closed form. */
export function countdownFlips(T, m) {
  T = BigInt(T); m = BigInt(m);
  const f = (N) => N - BigInt(popcount(N)); // sum_{j<=N} tz(j) = N - popcount(N)
  return Number((T - m) + f(T) - f(m));
}
/** Bit flips needed to count 0 -> n by increments (the cost of reading 1^n into binary). */
export const countupFlips = (n) => 2 * n - popcount(n);

// ---------------------------------------------------------------------------------------------------------------
// Turing machines. Rules: 'state symbol -> newstate write move' with symbol '*' = any, write '=' = keep, move L R S.
export const BLANK = '_';
export function parseTM(text, start = 'q0') {
  const rules = new Map(), states = new Set([start]);
  for (const line of text.trim().split('\n')) {
    const t = line.trim().split(/\s+/);
    if (t.length < 5) continue;
    const [q, a, , q2, w, d] = t;
    rules.set(`${q} ${a}`, [q2, w, d]); states.add(q); states.add(q2);
  }
  return { rules, start, states: [...states].filter((s) => s !== 'acc' && s !== 'rej') };
}
/**
 * Run machine m on input string x. Options: maxSteps, fence (halt with status 'fence' if the head leaves cells
 * [0, fence-1] counted from the first input cell... fence is the number of cells allowed, starting at cell 0),
 * trace (record configurations for the first `trace` steps), loopCheck (detect repeated configurations).
 * Returns {status: 'acc'|'rej'|'loop'|'timeout'|'fence', steps, lo, hi, pos: head positions (if posTrace), trace}.
 */
export function runTM(m, x, o = {}) {
  const maxSteps = o.maxSteps ?? 100000, tape = new Map();
  for (let i = 0; i < x.length; i++) tape.set(i, x[i]);
  let q = m.start, h = 0, steps = 0, lo = 0, hi = Math.max(0, x.length - 1);
  const seen = o.loopCheck === false ? null : new Set(), trace = [], pos = o.posTrace ? [0] : null;
  const snap = () => { const cells = []; for (let i = Math.min(lo, h); i <= Math.max(hi, h); i++) cells.push(tape.get(i) ?? BLANK); return { q, h, lo: Math.min(lo, h), cells: cells.join('') }; };
  const keyOf = () => { let s = `${q}|${h}|`; for (let i = lo; i <= hi; i++) s += tape.get(i) ?? BLANK; return s; };
  if (o.trace) trace.push(snap());
  let status = null;
  while (true) {
    if (q === 'acc' || q === 'rej') { status = q; break; }
    if (o.fence != null && (h < 0 || h >= o.fence)) { status = 'fence'; break; }
    if (steps >= maxSteps) { status = 'timeout'; break; }
    if (seen) { const k = keyOf(); if (seen.has(k)) { status = 'loop'; break; } seen.add(k); }
    const s = tape.get(h) ?? BLANK;
    const r = m.rules.get(`${q} ${s}`) || m.rules.get(`${q} *`);
    if (!r) { status = 'rej'; break; }
    const [q2, w, d] = r;
    if (w !== '=') tape.set(h, w);
    h += d === 'R' ? 1 : d === 'L' ? -1 : 0;
    q = q2; steps++; lo = Math.min(lo, h); hi = Math.max(hi, h);
    if (pos) pos.push(h);
    if (o.trace && steps <= o.trace) trace.push(snap());
  }
  return { status, steps, lo, hi, cells: hi - lo + 1, pos, trace, final: snap() };
}

export const MACHINES = [
  { id: 'const', name: 'accept at once', tex: '\\text{const}', start: 'q0', rules: `q0 * -> acc = S` },
  { id: 'first0', name: 'first symbol is 0', start: 'q0', rules: `
    q0 0 -> acc = S
    q0 1 -> rej = S
    q0 _ -> rej = S` },
  { id: 'parity', name: 'even number of 1s', start: 'E', rules: `
    E 0 -> E = R
    E 1 -> O = R
    E _ -> acc = S
    O 0 -> O = R
    O 1 -> E = R
    O _ -> rej = S` },
  { id: 'ends1', name: 'last symbol is 1', start: 's', rules: `
    s 0 -> a = R
    s 1 -> b = R
    s _ -> rej = S
    a 0 -> a = R
    a 1 -> b = R
    a _ -> rej = S
    b 0 -> a = R
    b 1 -> b = R
    b _ -> acc = S` },
  { id: 'has11', name: 'contains 11', start: 'q0', rules: `
    q0 0 -> q0 = R
    q0 1 -> p = R
    q0 _ -> rej = S
    p 0 -> q0 = R
    p 1 -> acc = S
    p _ -> rej = S` },
  { id: 'sorted', name: 'is of the form 0*1*', start: 's0', rules: `
    s0 0 -> s0 = R
    s0 1 -> s1 = R
    s0 _ -> acc = S
    s1 0 -> rej = S
    s1 1 -> s1 = R
    s1 _ -> acc = S` },
  { id: 'palin', name: 'palindrome', start: 'q0', rules: `
    q0 0 -> A0 _ R
    q0 1 -> A1 _ R
    q0 _ -> acc = S
    A0 0 -> A0 = R
    A0 1 -> A0 = R
    A0 _ -> B0 = L
    A1 0 -> A1 = R
    A1 1 -> A1 = R
    A1 _ -> B1 = L
    B0 0 -> Rt _ L
    B0 1 -> rej = S
    B0 _ -> acc = S
    B1 1 -> Rt _ L
    B1 0 -> rej = S
    B1 _ -> acc = S
    Rt 0 -> Rt = L
    Rt 1 -> Rt = L
    Rt _ -> q0 = R` },
  { id: 'balanced', name: 'as many 0s as 1s', start: 'S', rules: `
    S X -> S = R
    S 0 -> F1 X R
    S 1 -> F0 X R
    S _ -> acc = S
    F1 0 -> F1 = R
    F1 X -> F1 = R
    F1 1 -> Rt X L
    F1 _ -> rej = S
    F0 1 -> F0 = R
    F0 X -> F0 = R
    F0 0 -> Rt X L
    F0 _ -> rej = S
    Rt 0 -> Rt = L
    Rt 1 -> Rt = L
    Rt X -> Rt = L
    Rt _ -> S = R` },
  { id: 'loop', name: 'bounce forever', start: 'b', rules: `
    b 0 -> b = R
    b 1 -> b = R
    b _ -> c = L
    c 0 -> b = R
    c 1 -> b = R
    c _ -> b = R` },
  { id: 'run', name: 'run away to the right', start: 'r', rules: `r * -> r 1 R` },
].map((m) => ({ ...m, ...parseTM(m.rules, m.start) }));
export const machineById = (id) => MACHINES.find((m) => m.id === id);

/** A fixed pseudo-random bit string of length n for seed s (used as machine "descriptions" padded to length n). */
export function padBits(seed, n, head = '') {
  let x = (seed * 2654435761 + 12345) >>> 0, out = head;
  while (out.length < n) { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; out += (x >>> 16) & 1 ? '1' : '0'; }
  return out.slice(0, n);
}

// ---------------------------------------------------------------------------------------------------------------
// Pebble game (1.7). Nodes 0..N-1, preds[v] = list of predecessors. Returns the minimum number of pebbles that
// suffices to pebble `goal` (black pebbles, remove at any time) and one optimal move sequence, by BFS over subsets.
export function minPebbles(N, preds, goal) {
  if (N > 18) return null;
  const pm = preds.map((ps) => ps.reduce((m, p) => m | (1 << p), 0));
  const size = 1 << N, pop = new Uint8Array(size);
  for (let m = 1; m < size; m++) pop[m] = pop[m >> 1] + (m & 1);
  for (let p = 1; p <= N; p++) {
    const par = new Int32Array(size).fill(-2), mv = new Int16Array(size);
    par[0] = -1; const queue = [0]; let found = -1;
    for (let qi = 0; qi < queue.length && found < 0; qi++) {
      const m = queue[qi];
      for (let v = 0; v < N; v++) {
        const bit = 1 << v; let m2;
        if (m & bit) m2 = m & ~bit; // remove
        else if (pop[m] < p && (pm[v] & m) === pm[v]) m2 = m | bit; // place
        else continue;
        if (par[m2] !== -2) continue;
        par[m2] = m; mv[m2] = m & bit ? -(v + 1) : v + 1; queue.push(m2);
        if (m2 & (1 << goal)) { found = m2; break; }
      }
    }
    if (found >= 0) {
      const moves = []; let m = found;
      while (par[m] >= 0) { moves.push(mv[m]); m = par[m]; }
      return { p, moves: moves.reverse(), states: queue.length };
    }
  }
  return null;
}
