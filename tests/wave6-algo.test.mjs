import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as B from '../content/algo/ch13.shared.js';
function words(max, alphabet = ['a', 'b']) { const out = ['']; for (let n = 1, row = ['']; n <= max; n++) { row = row.flatMap(s => alphabet.map(c => s + c)); out.push(...row); } return out; }
function oracle(text, pattern) { const T = [...text], P = [...pattern], found = []; for (let i = 0; i + P.length <= T.length; i++) if (T.slice(i, i + P.length).join('') === pattern) found.push(i); return found; }
function border(P) { for (let k = P.length - 1; k >= 0; k--) if (P.slice(0, k).join('') === P.slice(P.length - k).join('')) return k; return 0; }
function longestPrefixSuffix(P, T) { for (let k = Math.min(P.length, T.length); k >= 0; k--) if (P.slice(0, k).join('') === T.slice(T.length - k).join('')) return k; return 0; }
const normalize = a => a.map(x => `${x.word}:${x.start}:${x.end}`).sort();

test('all five matchers return every overlapping occurrence on exhaustive binary and Unicode inputs', () => {
  const texts = [...words(6), '😀a😀a', 'é e\u0301 é', 'a\nb\ta', '𐀀\ue000𐀀', '<script>"&'], patterns = [...words(4), '😀a', 'é', 'e\u0301', '\n', '𐀀', '<'];
  for (const text of texts) for (const pattern of patterns) {
    const expected = oracle(text, pattern);
    for (const fn of [B.naive, B.kmp, B.horspool, B.rolling, B.automaton]) assert.deepEqual(fn(text, pattern).matches, expected, fn.name + JSON.stringify([text, pattern]));
    const n = [...text].length, m = [...pattern].length;
    assert.ok(B.naive(text, pattern).comparisons <= Math.max(0, n - m + 1) * m);
    assert.ok(B.kmp(text, pattern).comparisons <= 2 * n);
  }
});
test('prefix function equals direct longest borders and each comparison trace is literal', () => {
  for (const pattern of [...words(9), '😀a😀b😀a😀', 'aaaaaaabaaaaaaa']) {
    const P = [...pattern], r = B.prefix(pattern);
    assert.deepEqual(r.pi, P.map((_, j) => border(P.slice(0, j + 1))));
    assert.ok(r.comparisons <= 2 * Math.max(0, P.length - 1));
    const comparisons = r.frames.filter(f => f.kind === 'compare'); assert.equal(comparisons.length, r.comparisons);
    for (const f of comparisons) assert.equal(f.same, P[f.i] === P[f.j]);
    for (const f of r.frames.filter(f => f.kind === 'fallback')) assert.ok(f.j < f.before);
  }
});
test('KMP consumed states and DFA transitions agree with direct suffix recognition', () => {
  for (const text of words(5)) for (const pattern of words(3).filter(Boolean)) {
    const P = [...pattern], T = [...text], k = B.kmp(text, pattern), d = B.automaton(text, pattern);
    for (const f of k.frames.filter(f => f.kind === 'consume')) { let q = longestPrefixSuffix(P, T.slice(0, f.consumed)); if (q === P.length) q = border(P); assert.equal(f.q, q); }
    d.delta.forEach((row, q) => row.forEach((next, j) => assert.equal(next, longestPrefixSuffix(P, [...P.slice(0, q), d.alphabet[j]]))));
    assert.equal(d.transitions, T.length);
    for (const f of d.frames.filter(f => f.kind === 'transition')) assert.equal(f.q, longestPrefixSuffix(P, T.slice(0, f.i + 1)));
    for (const r of [k, d]) { const f = r.frames.at(-1); assert.deepEqual(T.slice(f.shift), P.slice(0, f.q), 'final drawing aligns the actual retained prefix with the text suffix'); }
  }
});
test('rolling hashes equal independent BigInt polynomial evaluation, including small-modulus false hits', () => {
  const evalHash = (xs, b, p) => Number(xs.reduce((s, x, j) => (s + BigInt(x) * BigInt(b) ** BigInt(xs.length - j - 1)) % BigInt(p), 0n));
  let falseHits = 0;
  for (const text of words(5)) for (const pattern of ['a', 'ab', 'ba', 'aaa']) for (const prime of [2, 3, 7]) for (const base of [0, 1, prime - 1]) {
    const r = B.rolling(text, pattern, prime, base), codes = new Map(r.codes || []); falseHits += r.falseHits;
    for (const w of r.windows) assert.equal(w.value, evalHash([...text].slice(w.shift, w.shift + pattern.length).map(c => codes.get(c)), base, prime));
    assert.deepEqual(r.matches, oracle(text, pattern));
  }
  assert.ok(falseHits > 100);
});
test('exhaustive field fingerprints obey root-degree bounds only on the declared domain', () => {
  for (const A of words(4)) for (const C of words(4)) if (A.length === C.length && A !== C) for (const p of [2, 3, 7, 11]) {
    const r = B.collisions(A, C, p); assert.equal(r.status, 'valid'); assert.ok(r.roots <= r.degree); assert.ok(r.probability <= r.bound); assert.ok(r.bound <= r.lengthBound);
  }
  assert.equal(B.collisions('', '').status, 'strings must differ'); assert.equal(B.collisions('a', '').status, 'equal lengths required'); assert.equal(B.collisions('abc', 'cba', 2).status, 'alphabet exceeds field size');
});
test('Horspool skips never omit a real match and count the known quadratic adversary', () => {
  for (const text of words(7)) for (const pattern of words(3).filter(Boolean)) {
    const r = B.horspool(text, pattern), truth = oracle(text, pattern);
    for (const s of r.skips) { assert.ok(s.skip >= 1 && s.skip <= pattern.length); assert.ok(!truth.some(i => s.shift < i && i < s.shift + s.skip)); }
  }
  const r = B.horspool('a'.repeat(40), 'b' + 'a'.repeat(7)); assert.equal(r.comparisons, 33 * 8);
  assert.equal(B.horspool('aaaaaa', 'aaa').matches.length, 4);
});
test('trie paths represent exactly dictionary prefixes; suffix trie paths are exactly substrings', () => {
  const dictionaries = [['', 'a', 'aa', 'ab', 'a'], ['he', 'she', 'hers', 'his'], ['😀', '😀a', 'b😀']];
  for (const dictionary of dictionaries) {
    const t = B.trie(dictionary), prefixes = new Set(dictionary.flatMap(w => Array.from({ length: [...w].length + 1 }, (_, i) => [...w].slice(0, i).join(''))));
    assert.deepEqual(new Set(t.nodes.map(n => n.prefix)), prefixes);
    for (const q of [...words(3), '', ...dictionary]) { const r = B.trieQuery(t.nodes, q); assert.equal(r.present, prefixes.has(q)); assert.equal(r.terminal, dictionary.includes(q)); }
    assert.ok(t.nodes.length <= t.characters + 1);
  }
  for (const text of words(6)) {
    const t = B.suffixTrie(text), factors = new Set(['']); for (let i = 0; i < text.length; i++) for (let j = i + 1; j <= text.length; j++) factors.add(text.slice(i, j));
    assert.deepEqual(new Set(t.nodes.map(n => n.prefix)), factors);
  }
});
test('radix prefix doubling and Kasai agree with independently ordered suffixes and direct LCP', () => {
  for (const text of [...words(8), 'banana', 'mississippi', '😀b😀a', '𐀀\ue000𐀀']) {
    const T = [...text], direct = Array.from({ length: T.length + 1 }, (_, i) => ({ i, code: T.slice(i).map(c => c.codePointAt(0)) })).sort((a, b) => { for (let j = 0; j < Math.min(a.code.length, b.code.length); j++) if (a.code[j] !== b.code[j]) return a.code[j] - b.code[j]; return a.code.length - b.code.length; }).map(x => x.i);
    const d = B.doubling(text), k = B.kasai(text, d.sa); assert.deepEqual(d.sa, direct);
    assert.deepEqual(k.lcp, direct.map((i, rank) => { if (!rank) return 0; const j = direct[rank - 1]; let h = 0; while (i + h < T.length && j + h < T.length && T[i + h] === T[j + h]) h++; return h; }));
    assert.ok(k.comparisons <= 2 * T.length); assert.ok(d.rounds <= Math.ceil(Math.log2(T.length + 1))); assert.equal(d.passes, 2 * d.rounds);
    for (const f of d.frames.filter(f => f.kind === 'sort')) { const pairs = f.sa.map(i => f.pairs[i]); for (let j = 1; j < pairs.length; j++) assert.ok(pairs[j - 1][0] < pairs[j][0] || (pairs[j - 1][0] === pairs[j][0] && pairs[j - 1][1] <= pairs[j][1])); }
    for (const pattern of ['', 'a', 'b', 'ab', 'aaa', '😀']) assert.deepEqual(B.suffixSearch(text, pattern, d.sa).matches.slice().sort((a, b) => a - b), oracle(text, pattern));
  }
});
test('Aho–Corasick returns all dictionary IDs and correct failure/output links, including empty duplicates', () => {
  const dictionaries = [['he', 'she', 'his', 'hers'], ['', 'a', 'aa', 'a'], [], ['😀', '😀a', 'b😀'], ...words(2).flatMap(a => words(2).map(b => [a, b]))];
  for (const dictionary of dictionaries) for (const text of [...words(5), 'ushers', '😀a😀b😀']) {
    const r = B.aho(text, dictionary), expected = dictionary.flatMap((p, word) => oracle(text, p).map(start => ({ word, start, end: start + [...p].length })));
    assert.deepEqual(normalize(r.matches), normalize(expected)); assert.equal(r.transitions, [...text].length);
    for (const node of r.nodes.slice(1)) { const proper = [...node.prefix].slice(1).join(''), candidates = r.nodes.filter(n => [...n.prefix].length <= [...proper].length && proper.endsWith(n.prefix)), best = candidates.reduce((a, b) => a.depth >= b.depth ? a : b); assert.equal(r.fail[node.id], best.id); if (r.output[node.id] !== null) assert.ok(r.nodes[r.output[node.id]].terminal.length); }
  }
});

test('editable JSON inputs preserve Unicode and whitespace while rejecting invalid or oversized domains', () => {
  for (const s of ['', ' a \n\t', '😀é', 'e\u0301', '"\\<>&$']) assert.equal(B.parseString(JSON.stringify(s), [...s].length), s);
  assert.equal(B.parseString('"😀"', 1), '😀');
  for (const raw of ['[1]', '{}', 'true', 'null', 'unquoted', '"\\ud800"']) assert.throws(() => B.parseString(raw, 32));
  assert.throws(() => B.parseString('"😀a"', 1), /not truncated/);
  assert.deepEqual(B.parseDictionary('["", "a", "a", "\\n"]'), ['', 'a', 'a', '\n']);
  for (const raw of ['{}', '[null]', '[1]', JSON.stringify(Array(9).fill('a')), JSON.stringify(['a'.repeat(13)]), JSON.stringify(Array(5).fill('a'.repeat(10)))]) assert.throws(() => B.parseDictionary(raw));
});

test('DFA and Aho preprocessing/scan frames preserve actual table and output invariants', () => {
  for (const [text, pattern] of [['abababa', 'aba'], ['😀a😀', '😀'], ['', 'ab']]) {
    const r = B.automaton(text, pattern), builds = r.frames.filter(f => f.kind === 'table');
    assert.equal(builds.length, (r.m + 1) * r.alphabet.length);
    for (const f of builds) { assert.equal(f.next, r.delta[f.q][f.col]); assert.equal(f.char, r.alphabet[f.col]); assert.deepEqual(f.matches, []); }
  }
  for (const dictionary of [['', 'a', 'aa', 'a'], ['he', 'she', 'hers', 'his'], []]) {
    const text = 'ushersaaa', r = B.aho(text, dictionary), ready = r.frames.find(f => f.kind === 'ready');
    assert.deepEqual(normalize(ready.matches), normalize(dictionary.flatMap((w, word) => w === '' ? [{ word, start: 0, end: 0 }] : [])));
    for (const f of r.frames.filter(f => f.kind === 'report')) {
      const expected = dictionary.flatMap((p, word) => oracle([...text].slice(0, f.i + 1).join(''), p).map(start => ({ word, start, end: start + [...p].length })));
      assert.deepEqual(normalize(f.matches), normalize(expected));
      const suffix = [...text].slice(0, f.i + 1).join(''), candidates = r.nodes.filter(n => suffix.endsWith(n.prefix)), longest = candidates.reduce((a, b) => a.depth >= b.depth ? a : b);
      assert.equal(f.state, longest.id);
    }
  }
});

test('all thirteen frozen identities and syllabus fields agree, with written proof inputs', async () => {
  const plan = JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json', import.meta.url))), frozen = plan.chapters.find(c => (c.col || c.collection) === 'algo').items;
  const parts = await Promise.all(['', '-b'].map(p => import(`../content/algo/ch13${p}.js`))), items = parts.flatMap(p => p.default.items), syllabus = (await import('../content/algo/syllabus.js')).default.chapters.find(c => c.n === 13).items;
  assert.equal(items.length, 13); assert.equal(frozen.length, 13);
  for (const [j, item] of items.entries()) {
    assert.equal('algo-' + item.num, frozen[j].id);
    for (const key of ['name', 'kind', 'verify', 'paper', 'introduces']) { assert.deepEqual(item[key], frozen[j][key]); assert.deepEqual(item[key], syllabus[j][key]); }
    for (const key of ['deps', 'refs']) assert.deepEqual(item[key], syllabus[j][key]);
    assert.equal(item.caption, syllabus[j].pic); for (const key of ['statement', 'idea', 'caption']) assert.ok(item[key].length > 100); assert.equal(typeof item.viz, 'function');
  }
  for (const id of new Set(items.flatMap(i => i.deps).filter(id => !id.startsWith('algo-13.')))) {
    const [col, num] = id.split('-'), chapter = num.split('.')[0].padStart(2, '0'), dir = new URL('../content/' + col + '/', import.meta.url); let found = false;
    for (const file of fs.readdirSync(dir).filter(f => new RegExp('^ch' + chapter + '(?:-[a-z0-9]+)?\\.js$').test(f))) if ((await import(new URL(file, dir))).default.items.some(i => i.num === num)) found = true;
    assert.ok(found, id + ' is written');
  }
});
