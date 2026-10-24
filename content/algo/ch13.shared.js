// Exact string-algorithm traces. Indices count Unicode code points, not graphemes.
export const symbols = s => Array.from(s);
export const compareSymbol = (a, b) => a.codePointAt(0) - b.codePointAt(0);
export const alphabetOf = (...strings) => [...new Set(strings.flatMap(symbols))].sort(compareSymbol);
export const equal = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
export const mod = (x, p) => ((x % p) + p) % p;
// JSON string fields preserve whitespace, newlines and quotes in a single-line input.
export function parseString(raw, limit, label = 'String') {
  let value; try { value = JSON.parse(raw); } catch { throw new Error(`${label}: enter a JSON string in double quotes.`); }
  if (typeof value !== 'string') throw new Error(`${label}: a string is required.`);
  if (/\p{Surrogate}/u.test(value)) throw new Error(`${label}: an unpaired surrogate is not a Unicode character.`);
  if (symbols(value).length > limit) throw new Error(`${label}: at most ${limit} code points; the input was not truncated.`);
  return value;
}
export function parseDictionary(raw) {
  let words; try { words = JSON.parse(raw); } catch { throw new Error('Dictionary: enter a JSON array of strings.'); }
  if (!Array.isArray(words) || words.length > 8) throw new Error('Dictionary: at most 8 strings are allowed.');
  words.forEach((w, i) => parseString(JSON.stringify(w), 12, `Word ${i}`));
  if (words.reduce((n, w) => n + symbols(w).length, 0) > 48) throw new Error('Dictionary: at most 48 total code points; the input was not truncated.');
  return words;
}
export function power(a, n, p) { let y = 1; for (; n; n = Math.floor(n / 2), a = a * a % p) if (n % 2) y = y * a % p; return y; }
export const hash = (xs, base, prime) => xs.reduce((a, x) => (a * base + x) % prime, 0);
const initial = (T, P) => ({ text: T, pattern: P, n: T.length, m: P.length, matches: [], comparisons: 0, frames: [{ kind: 'start', line: 1, i: 0, j: 0, comparisons: 0, matches: [] }] });
function record(r, f) { r.frames.push({ comparisons: r.comparisons, matches: r.matches.slice(), ...f }); }
function empty(r) { r.matches = Array.from({ length: r.n + 1 }, (_, i) => i); record(r, { kind: 'empty', line: 1, note: 'The empty pattern occurs at every text boundary.' }); return r; }

export function naive(text, pattern) {
  const T = symbols(text), P = symbols(pattern), r = initial(T, P);
  if (!P.length) return empty(r);
  for (let shift = 0; shift + P.length <= T.length; shift++) {
    let j = 0;
    for (; j < P.length; j++) { const same = T[shift + j] === P[j]; r.comparisons++; record(r, { kind: 'compare', line: 3, shift, i: shift + j, j, same }); if (!same) break; }
    if (j === P.length) { r.matches.push(shift); record(r, { kind: 'match', line: 4, shift, i: shift + j - 1, j: j - 1 }); }
  }
  record(r, { kind: 'done', line: 5 }); return r;
}
export function rolling(text, pattern, prime = 31, base = 5) {
  const T = symbols(text), P = symbols(pattern), r = initial(T, P), alphabet = alphabetOf(text, pattern), codes = new Map(alphabet.map((c, i) => [c, i + 1]));
  Object.assign(r, { prime, base: mod(base, prime), alphabet, falseHits: 0, windows: [], updates: 0 });
  if (!P.length) return empty(r);
  if (P.length > T.length) { record(r, { kind: 'done', line: 6 }); return r; }
  const tc = T.map(c => codes.get(c)), pc = P.map(c => codes.get(c)), high = power(r.base, P.length - 1, prime), target = hash(pc, r.base, prime);
  let value = hash(tc.slice(0, P.length), r.base, prime); Object.assign(r, { target, high, codes: [...codes] });
  for (let shift = 0; shift + P.length <= T.length; shift++) {
    const hit = value === target; r.windows.push({ shift, value, target, hit }); record(r, { kind: 'fingerprint', line: 3, shift, value, target, hit });
    if (hit) {
      let j = 0;
      for (; j < P.length; j++) { const same = T[shift + j] === P[j]; r.comparisons++; record(r, { kind: 'compare', line: 4, shift, i: shift + j, j, same, value, target }); if (!same) break; }
      if (j === P.length) { r.matches.push(shift); record(r, { kind: 'match', line: 4, shift, value, target }); } else r.falseHits++;
    }
    if (shift + P.length < T.length) { const old = value, dropped = tc[shift], added = tc[shift + P.length]; value = mod((old - dropped * high) * r.base + added, prime); r.updates++; record(r, { kind: 'roll', line: 5, shift: shift + 1, old, dropped, high, added, value, target }); }
  }
  record(r, { kind: 'done', line: 6 }); return r;
}
export function collisions(left, right, prime = 7) {
  const A = symbols(left), B = symbols(right), alphabet = alphabetOf(left, right), codes = new Map(alphabet.map((c, i) => [c, i]));
  if (A.length !== B.length) return { status: 'equal lengths required', alphabet };
  if (equal(A, B)) return { status: 'strings must differ', alphabet };
  if (alphabet.length > prime) return { status: 'alphabet exceeds field size', alphabet };
  const a = A.map(c => codes.get(c)), b = B.map(c => codes.get(c)), first = a.findIndex((x, i) => x !== b[i]), degree = A.length - 1 - first;
  const values = Array.from({ length: prime }, (_, base) => { const x = hash(a, base, prime), y = hash(b, base, prime); return { base, left: x, right: y, collide: x === y }; });
  const roots = values.filter(v => v.collide).length;
  return { status: 'valid', alphabet, codes: [...codes], degree, values, roots, probability: roots / prime, bound: Math.min(1, degree / prime), lengthBound: Math.min(1, (A.length - 1) / prime) };
}
export function prefix(pattern) {
  const P = symbols(pattern), pi = Array(P.length).fill(0), r = { pattern: P, pi, comparisons: 0, frames: [{ kind: 'start', line: 1, i: 0, j: 0, pi: pi.slice(), comparisons: 0 }] };
  const add = f => r.frames.push({ pi: pi.slice(), comparisons: r.comparisons, ...f });
  for (let i = 1; i < P.length; i++) {
    let j = pi[i - 1]; add({ kind: 'candidate', line: 2, i, j });
    for (;;) {
      const same = P[i] === P[j]; r.comparisons++; add({ kind: 'compare', line: 3, i, j, same });
      if (same) { j++; break; }
      if (j === 0) break;
      const before = j; j = pi[j - 1]; add({ kind: 'fallback', line: 4, i, j, before });
    }
    pi[i] = j; add({ kind: 'assign', line: 5, i, j });
  }
  add({ kind: 'done', line: 6, i: Math.max(0, P.length - 1), j: pi.at(-1) || 0 }); return r;
}
export function kmp(text, pattern) {
  const T = symbols(text), P = symbols(pattern), r = initial(T, P), pi = prefix(pattern).pi;
  r.pi = pi; if (!P.length) return empty(r);
  let q = 0;
  for (let i = 0; i < T.length; i++) {
    for (;;) {
      const same = T[i] === P[q]; r.comparisons++; record(r, { kind: 'compare', line: 3, i, j: q, q, shift: i - q, same });
      if (same) { q++; break; }
      if (!q) break;
      const before = q; q = pi[q - 1]; record(r, { kind: 'fallback', line: 4, i, j: q, q, before, shift: i - q });
    }
    if (q === P.length) { r.matches.push(i - P.length + 1); record(r, { kind: 'match', line: 5, i, q, j: q - 1, shift: i - q + 1 }); q = pi[q - 1]; }
    record(r, { kind: 'consume', line: 6, i, q, j: q, shift: i + 1 - q, consumed: i + 1 });
  }
  record(r, { kind: 'done', line: 7, q, consumed: T.length, shift: T.length - q }); return r;
}
export function automaton(text, pattern) {
  const T = symbols(text), P = symbols(pattern), r = initial(T, P), alphabet = alphabetOf(text, pattern), pi = prefix(pattern).pi, delta = [];
  Object.assign(r, { alphabet, delta, pi, transitions: 0 }); if (!P.length) { delta[0] = alphabet.map(() => 0); return empty(r); }
  for (let q = 0; q <= P.length; q++) {
    delta[q] = [];
    for (const [j, c] of alphabet.entries()) { const extend = q < P.length && P[q] === c; delta[q][j] = extend ? q + 1 : q ? delta[pi[q - 1]][j] : 0; record(r, { kind: 'table', line: extend ? 4 : 5, q, col: j, char: c, next: delta[q][j] }); }
  }
  const index = new Map(alphabet.map((c, j) => [c, j])); let q = 0;
  for (let i = 0; i < T.length; i++) { const before = q; q = delta[q][index.get(T[i])]; r.transitions++; if (q === P.length) r.matches.push(i - q + 1); record(r, { kind: 'transition', line: q === P.length ? 8 : 7, i, before, q, char: T[i], shift: i + 1 - q }); }
  record(r, { kind: 'done', line: 9, q, shift: T.length - q }); return r;
}
export function horspool(text, pattern) {
  const T = symbols(text), P = symbols(pattern), r = initial(T, P), table = new Map();
  for (let i = 0; i + 1 < P.length; i++) table.set(P[i], P.length - 1 - i);
  r.table = [...table]; r.skips = []; if (!P.length) return empty(r);
  for (let shift = 0; shift + P.length <= T.length;) {
    let j = P.length - 1;
    for (; j >= 0; j--) { const same = T[shift + j] === P[j]; r.comparisons++; record(r, { kind: 'compare', line: 3, shift, i: shift + j, j, same }); if (!same) break; }
    if (j < 0) { r.matches.push(shift); record(r, { kind: 'match', line: 4, shift }); }
    const last = T[shift + P.length - 1], skip = table.get(last) ?? P.length; r.skips.push({ shift, last, skip }); record(r, { kind: 'skip', line: 5, shift, last, skip }); shift += skip;
  }
  record(r, { kind: 'done', line: 6 }); return r;
}

export function trie(words) {
  const nodes = [{ id: 0, parent: null, char: '', depth: 0, prefix: '', children: new Map(), terminal: [] }], frames = [{ kind: 'start', line: 1, node: 0, visible: 1, terminals: [] }];
  words.forEach((word, wi) => {
    let node = 0;
    for (const [i, char] of symbols(word).entries()) {
      let next = nodes[node].children.get(char), created = false;
      if (next === undefined) { next = nodes.length; nodes.push({ id: next, parent: node, char, depth: nodes[node].depth + 1, prefix: nodes[node].prefix + char, children: new Map(), terminal: [] }); nodes[node].children.set(char, next); created = true; }
      frames.push({ kind: created ? 'insert' : 'follow', line: created ? 3 : 2, node: next, from: node, visible: nodes.length, word: wi, i, terminals: nodes.flatMap(n => n.terminal.map(w => [n.id, w])) }); node = next;
    }
    nodes[node].terminal.push(wi); frames.push({ kind: 'terminal', line: 4, node, visible: nodes.length, word: wi, terminals: nodes.flatMap(n => n.terminal.map(w => [n.id, w])) });
  });
  frames.push({ kind: 'done', line: 5, node: 0, visible: nodes.length, terminals: nodes.flatMap(n => n.terminal.map(w => [n.id, w])) });
  return { words, nodes, frames, characters: words.reduce((s, w) => s + symbols(w).length, 0) };
}
export function suffixTrie(text) { const T = symbols(text); return { ...trie(Array.from({ length: T.length + 1 }, (_, i) => T.slice(i).join(''))), text: T }; }
export function trieQuery(nodes, query) { let node = 0; const path = [0]; for (const c of symbols(query)) { const next = nodes[node].children.get(c); if (next === undefined) return { present: false, terminal: false, path }; node = next; path.push(node); } return { present: true, terminal: nodes[node].terminal.length > 0, path }; }
export function suffixCompare(T, i, j) {
  while (i < T.length && j < T.length) { const d = compareSymbol(T[i], T[j]); if (d) return d; i++; j++; }
  return (T.length - i) - (T.length - j);
}
export function suffixArray(text) { const T = symbols(text); return Array.from({ length: T.length + 1 }, (_, i) => i).sort((i, j) => suffixCompare(T, i, j)); }
export function suffixSearch(text, pattern, sa = suffixArray(text)) {
  const T = symbols(text), P = symbols(pattern), frames = [{ kind: 'start', line: 1, lo: 0, hi: sa.length, comparisons: 0 }]; let comparisons = 0;
  const cmp = start => { for (let j = 0; j < P.length; j++) { if (start + j === T.length) return -1; comparisons++; const d = compareSymbol(T[start + j], P[j]); if (d) return d; } return 0; };
  const bound = upper => { let lo = 0, hi = sa.length; while (lo < hi) { const mid = Math.floor((lo + hi) / 2), order = cmp(sa[mid]); frames.push({ kind: 'probe', line: 3, upper, lo, hi, mid, order, start: sa[mid], comparisons }); if (order < 0 || (upper && order === 0)) lo = mid + 1; else hi = mid; } frames.push({ kind: 'bound', line: 4, upper, lo, hi, comparisons }); return lo; };
  const lo = bound(false), hi = bound(true), matches = sa.slice(lo, hi); frames.push({ kind: 'done', line: 5, lo, hi, comparisons });
  return { text: T, pattern: P, sa, lo, hi, matches, comparisons, frames };
}
function counting(indices, key, max) {
  const counts = Array(max + 1).fill(0), out = Array(indices.length);
  indices.forEach(i => counts[key(i)]++); let before = 0;
  for (let i = 0; i < counts.length; i++) { const old = counts[i]; counts[i] = before; before += old; }
  indices.forEach(i => out[counts[key(i)]++] = i); return out;
}
export function doubling(text) {
  const T = symbols(text), alphabet = alphabetOf(text), names = new Map(alphabet.map((c, i) => [c, i + 1])), n = T.length, indices = Array.from({ length: n + 1 }, (_, i) => i);
  let ranks = [...T.map(c => names.get(c)), 0], sa = counting(indices, i => ranks[i], n), classes = alphabet.length + 1, k = 1, passes = 0;
  const frames = [{ kind: 'initial', line: 1, k, sa: sa.slice(), ranks: ranks.slice(), classes, passes }];
  while (classes < n + 1) {
    const pairs = indices.map(i => [ranks[i], i + k <= n ? ranks[i + k] : -1]), second = counting(indices, i => pairs[i][1] + 1, n + 1);
    sa = counting(second, i => pairs[i][0] + 1, n + 1); passes += 2;
    frames.push({ kind: 'sort', line: 3, k, pairs, second, sa: sa.slice(), ranks: ranks.slice(), classes, passes });
    const next = Array(n + 1); classes = 1; next[sa[0]] = 0;
    for (let j = 1; j <= n; j++) { if (!equal(pairs[sa[j]], pairs[sa[j - 1]])) classes++; next[sa[j]] = classes - 1; }
    ranks = next; k *= 2; frames.push({ kind: 'rename', line: 4, k, sa: sa.slice(), ranks: ranks.slice(), classes, passes });
  }
  frames.push({ kind: 'done', line: 5, k, sa: sa.slice(), ranks: ranks.slice(), classes, passes });
  return { text: T, sa, ranks, frames, passes, rounds: passes / 2 };
}
export function kasai(text, sa = suffixArray(text)) {
  const T = symbols(text), n = T.length, rank = Array(n + 1), lcp = Array(n + 1).fill(0); sa.forEach((i, j) => rank[i] = j);
  let h = 0, comparisons = 0, increases = 0; const frames = [{ kind: 'start', line: 1, i: 0, h, lcp: lcp.slice(), comparisons, increases }];
  const add = f => frames.push({ h, lcp: lcp.slice(), comparisons, increases, ...f });
  for (let i = 0; i <= n; i++) {
    if (rank[i] === 0) { h = 0; add({ kind: 'smallest', line: 2, i }); continue; }
    const j = sa[rank[i] - 1]; add({ kind: 'reuse', line: 3, i, j });
    while (i + h < n && j + h < n) { const same = T[i + h] === T[j + h]; comparisons++; add({ kind: 'compare', line: 4, i, j, same }); if (!same) break; h++; increases++; }
    lcp[rank[i]] = h; add({ kind: 'assign', line: 5, i, j, value: h }); if (h) h--;
  }
  add({ kind: 'done', line: 6, i: n }); const longest = Math.max(...lcp), at = lcp.indexOf(longest);
  return { text: T, sa, rank, lcp, frames, comparisons, increases, longest, repeated: T.slice(sa[at], sa[at] + longest).join('') };
}
export function aho(text, words) {
  const T = symbols(text), tree = trie(words), { nodes } = tree, alphabet = alphabetOf(text, ...words), index = new Map(alphabet.map((c, j) => [c, j]));
  const go = nodes.map(() => Array(alphabet.length).fill(0)), fail = nodes.map(() => 0), output = nodes.map(() => null), queue = [0], build = [];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    for (const [j, c] of alphabet.entries()) {
      const child = nodes[u].children.get(c);
      if (child === undefined) go[u][j] = u ? go[fail[u]][j] : 0;
      else { go[u][j] = child; fail[child] = u ? go[fail[u]][j] : 0; output[child] = nodes[fail[child]].terminal.length ? fail[child] : output[fail[child]]; queue.push(child); build.push({ node: child, fail: fail[child], output: output[child] }); }
    }
  }
  let state = 0; const matches = [], frames = [{ kind: 'start', line: 1, state, i: -1, matches: [] }, ...build.map(b => ({ kind: 'build', line: 4, state: b.node, fail: b.fail, output: b.output, i: -1, matches: [] }))], lengths = words.map(w => symbols(w).length);
  const report = (v, end) => { for (const word of nodes[v].terminal) matches.push({ word, start: end - lengths[word], end }); };
  // Empty dictionary words are terminal at the root and occur at every boundary.
  report(0, 0);
  frames.push({ kind: 'ready', line: 6, state, i: -1, matches: matches.slice() });
  for (let i = 0; i < T.length; i++) {
    const before = state; state = go[state][index.get(T[i])]; frames.push({ kind: 'transition', line: 7, i, before, state, char: T[i], matches: matches.slice() }); report(state, i + 1);
    for (let v = output[state]; v !== null; v = output[v]) report(v, i + 1);
    frames.push({ kind: 'report', line: 8, i, before, state, char: T[i], matches: matches.slice() });
  }
  frames.push({ kind: 'done', line: 9, state, i: T.length, matches: matches.slice() });
  return { text: T, words, nodes, alphabet, go, fail, output, build, matches, frames, transitions: T.length, tableCells: nodes.length * alphabet.length };
}
