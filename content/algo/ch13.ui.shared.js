import * as H from './ch13.shared.js';

const glyph = c => c === ' ' ? '␠' : c === '\n' ? '↵' : c === '\t' ? '⇥' : /[\p{Mark}\p{Cf}]/u.test(c) ? '◌' + c : /\p{Cc}/u.test(c) ? '·' : c;
const ids = a => a.length ? a.join(', ') : 'none';
const cp = s => H.symbols(s).map(c => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
const note = 'Indices count Unicode code points; no normalization or grapheme grouping. JSON fields preserve spaces and escaped newlines.';
function input(v, label, value) { let c; c = v.input(label, JSON.stringify(value), { width: '100%', onChange: () => c.change?.() }); Object.assign(c.el.style, { flexBasis: '260px', minWidth: '0', flexDirection: 'column', alignItems: 'stretch' }); Object.assign(c.el.querySelector('input').style, { minWidth: '0', flexBasis: 'auto' }); c.el.querySelector('.ctl-label').style.whiteSpace = 'normal'; return c; }
function choice(v, label, values, value) { let c; c = v.select(label, values.map(x => ({ value: x, label: String(x) })), value, { onChange: () => c.change?.() }); return c; }
const stage = (v, title, height = 470) => v.stage({ title, x: [0, 1], y: [0, 1], axes: false, height, full: true });
// Size to the actual rows at the current width, retaining fixed readable glyph sizes.
function fitHeight(s, pixels) { const h = Math.round(pixels); if (Math.abs(s.height - h) > .5) { s.o.aspect = h / s.width; s.resize(); s.begin(); } }
function player(v, controls, build, code, title) {
  let run, error = '';
  const load = () => { try { run = build(); error = ''; return run.frames; } catch (e) { error = e.message; run = null; return [{ kind: 'invalid', line: 1 }]; } };
  const S = v.steps({ frames: load, code, codeTitle: title, codePos: 'below', start: 'end', still: 'end', note: false });
  // Local wrapping: preserve full pseudocode at narrow widths without altering the kit.
  Object.assign(S.codeEl.style, { overflow: 'visible', minHeight: 'max-content', height: 'auto', flexShrink: '0' });
  for (const el of S.codeEl.querySelectorAll('.ln > span:last-child')) { el.style.whiteSpace = 'pre-wrap'; el.style.overflowWrap = 'anywhere'; }
  for (const c of controls) c.change = () => S.reset({ at: 'end' });
  return { S, get run() { return run; }, get error() { return error; } };
}
function text(s, str, x, y, color = 'ink', size = 12) { s.textPx(String(str), x, y, { align: 'center', baseline: 'middle', color, size }); }
function box(v, s, x, y, w, h, color = 'grid', str = '', size = 13) {
  const c = s.ctx; c.fillStyle = v.color(color, .18); c.strokeStyle = v.color(color, .6); c.lineWidth = 1; c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h); text(s, str, x + w / 2, y + h / 2, 'ink', size);
}
function invalid(s, p) { if (!p.error) return false; text(s, 'Input needs correction', s.width / 2, s.height / 2, 'red'); return true; }
function strip(v, s, xs, y, { active = -1, green = [], label = '', values = null } = {}) {
  const cols = Math.max(4, Math.min(16, Math.floor((s.width - 24) / 29))), w = (s.width - 24) / cols, rows = Math.max(1, Math.ceil(xs.length / cols));
  text(s, label, s.width / 2, y, 'muted');
  if (!xs.length) text(s, 'ε (empty)', s.width / 2, y + 30, 'muted');
  xs.forEach((c, i) => { const x = 12 + i % cols * w, yy = y + 22 + Math.floor(i / cols) * 55; text(s, i, x + w / 2, yy - 8, 'muted', 10); box(v, s, x + 1, yy, w - 2, 25, i === active ? 'gold' : green.includes(i) ? 'green' : 'grid', glyph(c)); if (values) text(s, values[i], x + w / 2, yy + 36, 'accent', 11); });
  return y + 22 + rows * 55;
}
function aligned(v, s, run, f) {
  const T = run.text, P = run.pattern, shift = f.shift ?? (f.kind === 'done' ? run.matches?.[0] ?? 0 : 0), cols = Math.max(4, Math.min(16, Math.floor((s.width - 24) / 29))), w = (s.width - 24) / cols;
  const total = Math.max(T.length, shift + P.length, 1), matches = f.matches || []; fitHeight(s, 62 + Math.ceil(total / cols) * 72 + (P.length ? 0 : 20));
  text(s, 'text above · aligned pattern below', s.width / 2, 16, 'muted');
  for (let i = 0; i < total; i++) { const x = 12 + i % cols * w, y = 42 + Math.floor(i / cols) * 72;
    text(s, i, x + w / 2, y - 9, 'muted', 10);
    if (i < T.length) box(v, s, x + 1, y, w - 2, 25, i === f.i ? f.same === false ? 'red' : 'gold' : matches.some(k => k <= i && i < k + P.length) ? 'green' : 'grid', glyph(T[i]));
    if (shift <= i && i < shift + P.length) box(v, s, x + 1, y + 29, w - 2, 25, i === f.i ? f.same === false ? 'red' : 'gold' : 'accent', glyph(P[i - shift]));
  }
  if (!P.length) text(s, 'Empty pattern: every boundary matches.', s.width / 2, s.height - 18, 'green', 11);
}
const codes = {
  naive: ['empty P: report every boundary', 'for shift = 0 to n − m:', '  compare P[j], T[shift+j]; stop at mismatch', '  if all m equal: report shift', 'return every reported position'],
  rolling: ['empty P: report every boundary', 'encode; hash P and first window', 'for each window: compare its hash with P', '  if equal: verify characters; report exact hit', '  h ← ((h − old·b^(m−1))·b + new) mod p', 'return every verified position'],
  automaton: ['empty P: report every boundary', 'π ← prefix(P)', 'for q=0..m and c in the alphabet:', '  q<m and P[q]=c → δ(q,c)=q+1', '  else δ(q,c)= q>0 ? δ(π[q−1],c) : 0', 'q ← 0', 'for each T[i]: q ← δ(q,T[i])', '  if q = m: report i−m+1', 'return every reported position'],
  kmp: ['empty P: report every boundary', 'compute π; q ← 0; for each T[i]:', '  compare T[i] with P[q]; equal → q++', '  mismatch: q>0 → q=π[q−1], retry; else stop', '  q=m → report i−m+1; q ← π[m−1]', '  advance to the next text character', 'return every reported position'],
  horspool: ['empty P: report every boundary', 'default shift m; d[P[j]]=m−1−j for j<m−1', 'at each window, compare right to left', '  if all equal: report the window start', '  advance by d[last text character in window]', 'return every reported position'],
};
export function matching(v, kind) {
  const T = input(v, 'Text (JSON, max 32)', kind === 'horspool' ? 'here is a simple example' : 'abababacababaca'), P = input(v, 'Pattern (JSON, max 12)', kind === 'horspool' ? 'example' : 'ababaca');
  const prime = kind === 'rolling' ? choice(v, 'prime modulus', [2, 3, 7, 31], 7) : null, base = kind === 'rolling' ? choice(v, 'base before reduction', [0, 1, 2, 5], 2) : null;
  const s = stage(v, 'Actual character comparisons', 510), extra = ['rolling', 'automaton', 'horspool', 'kmp'].includes(kind) ? stage(v, kind === 'automaton' ? 'Current automaton state and transitions' : kind === 'rolling' ? 'Window fingerprints and verification' : kind === 'horspool' ? 'Bad-character shifts' : 'Failure links and the current prefix', kind === 'rolling' ? 470 : 320) : null;
  const p = player(v, [T, P, prime, base].filter(Boolean), () => { const t = H.parseString(T.value, 32, 'Text'), q = H.parseString(P.value, 12, 'Pattern'); if (kind === 'automaton' && H.alphabetOf(t, q).length > 8) throw new Error('Automaton scene: at most 8 distinct code points across text and pattern.'); return H[kind](t, q, prime?.value, base?.value); }, codes[kind], kind === 'kmp' ? 'Prefix-function KMP variant' : kind);
  v.button('Overlapping example', () => { T.set(JSON.stringify('aaaaaaaaaaaa')); P.set(JSON.stringify('aaaa')); p.S.reset({ at: 'end' }); });
  v.button('No match example', () => { T.set(JSON.stringify('aaaaaaaaaaaa')); P.set(JSON.stringify(kind === 'horspool' ? 'baaaa' : 'aaaab')); p.S.reset({ at: 'end' }); });
  const table = extra ? v.table(extra, { square: false, maxCell: 38, cellAspect: 1.8, size: 12, labelSize: 11 }) : null;
  v.render(() => { if (invalid(s, p)) return; const r = p.run, f = p.S.frame; aligned(v, s, r, f);
    if (kind === 'rolling') { const windows = r.windows, cols = Math.max(4, Math.min(12, Math.floor((extra.width - 24) / 34))), w = (extra.width - 24) / cols; fitHeight(extra, Math.max(110, Math.ceil(windows.length / cols) * 45 + 40)); windows.forEach((a, i) => { const x = 12 + i % cols * w, y = 22 + Math.floor(i / cols) * 45; text(extra, a.shift, x + w / 2, y - 9, 'muted', 10); box(v, extra, x + 1, y, w - 2, 26, a.shift === f.shift ? 'gold' : a.hit ? 'orange' : 'grid', a.value, 12); }); if (!windows.length) text(extra, 'No nonempty windows', extra.width / 2, 60, 'muted'); }
    if (kind === 'automaton') { const q = f.q ?? 0; fitHeight(extra, Math.max(120, 30 + (r.alphabet.length + 1) * 26)); table.draw({ rows: Math.max(1, r.alphabet.length), cols: 2, colLabels: ['character', `δ(${q},c)`], value: (i, j) => j ? f.kind === 'table' && i > f.col ? '·' : r.delta[q]?.[i] ?? '—' : glyph(r.alphabet[i] ?? 'ε'), fill: (i) => r.alphabet[i] === f.char ? ['gold', .25] : null }); }
    if (kind === 'kmp') { const q = Math.min(f.q ?? 0, r.m), cols = Math.max(4, Math.min(16, Math.floor((extra.width - 24) / 29))); fitHeight(extra, 100 + Math.max(1, Math.ceil(r.m / cols)) * 55); text(extra, `q = ${q}; potential q ≥ 0`, extra.width / 2, 20, 'accent'); strip(v, extra, r.pattern, 44, { active: q - 1, values: r.pi, label: 'pattern index / character / π' }); }
    if (kind === 'horspool') { const a = r.table; fitHeight(extra, 40 + (a.length + 2) * 28); table.draw({ rows: Math.max(1, a.length + 1), cols: 2, colLabels: ['character', 'shift'], value: (i, j) => i === a.length ? j ? r.m : 'other' : j ? a[i][1] : glyph(a[i][0]), fill: i => a[i]?.[0] === f.last ? ['gold', .25] : null }); }
  });
  v.legend([['gold', 'current comparison / state'], ...(kind === 'automaton' ? [] : [['red', 'mismatch']]), ['green', 'reported match'], ['accent', 'pattern'], ...(kind === 'rolling' ? [['orange', 'hash hit requiring verification']] : [])]);
  v.readout(() => { if (p.error) return p.error; const r = p.run, f = p.S.frame; const current = f.matches || []; let detail = '';
    if (kind === 'naive') detail = `Worst-case upper bound ${Math.max(0, r.n - r.m + 1) * r.m}.`;
    if (kind === 'rolling') detail = `Modulus ${r.prime}, reduced base ${r.base}, target hash ${r.target ?? 'unneeded'}. Actual rolling updates ${r.updates}; false hash hits ${r.falseHits}. ${f.kind === 'roll' ? `This update: ((${f.old} − ${f.dropped} × ${f.high}) × ${r.base} + ${f.added}) mod ${r.prime} = ${f.value}.` : 'Gold marks the selected window; all window hashes are shown as a summary.'}`;
    if (kind === 'automaton') detail = `${f.kind === 'table' ? 'Building transition row' : 'State'} q=${f.q ?? 0}. Final scan uses ${r.transitions} table transitions, with ${(r.m + 1) * r.alphabet.length} precomputed cells. Dots mark cells not yet built in the selected row.`;
    if (kind === 'kmp') detail = `Scan comparison bound 2n=${2 * r.n}; prefix preprocessing is separate. ${f.kind === 'fallback' ? `Fallback ${f.before}→${f.q} preserves the current text position.` : 'After reporting, retain the longest proper border so overlapping matches survive.'}`;
    if (kind === 'horspool') detail = `Default shift ${r.m}. ${f.kind === 'skip' ? `Current last-window character ${cp(f.last)} gives shift ${f.skip}.` : 'The shift uses the last character of the text window, even if the mismatch was elsewhere.'} Worst-case comparisons can be quadratic.`;
    return `Event ${p.S.i}/${p.S.n - 1}: ${f.kind}. n=${r.n}, m=${r.m}. Character comparisons in matching so far ${f.comparisons || 0}; final ${r.comparisons}. Reported so far: ${ids(current)}; final positions: ${ids(r.matches)}. ${detail} ${note}`;
  });
}
export const naiveWidget = v => matching(v, 'naive');
export const rollingWidget = v => matching(v, 'rolling');
export const automatonWidget = v => matching(v, 'automaton');
export const kmpWidget = v => matching(v, 'kmp');
export const horspoolWidget = v => matching(v, 'horspool');

export function fingerprints(v) {
  const A = input(v, 'First string (JSON, max 12)', 'ababa'), B = input(v, 'Second string (JSON, max 12)', 'baaab'), prime = choice(v, 'prime field size', [2, 3, 5, 7, 11, 31], 7), s = stage(v, 'Every possible random base', 580); let r, error;
  v.render(() => { error = ''; try { r = H.collisions(H.parseString(A.value, 12, 'First string'), H.parseString(B.value, 12, 'Second string'), prime.value); } catch (e) { error = e.message; text(s, 'Input needs correction', s.width / 2, s.height / 2, 'red'); return; } if (r.status !== 'valid') { text(s, 'The theorem needs its hypotheses', s.width / 2, s.height / 2, 'red'); return; }
    const cols = Math.max(3, Math.min(8, Math.floor((s.width - 24) / 60))), w = (s.width - 24) / cols; fitHeight(s, 55 + Math.ceil(r.values.length / cols) * 48); r.values.forEach((a, i) => { const x = 12 + i % cols * w, y = 30 + Math.floor(i / cols) * 48; text(s, `b=${i}`, x + w / 2, y - 10, 'muted', 10); box(v, s, x + 2, y, w - 4, 26, a.collide ? 'red' : 'accent', `${a.left} : ${a.right}`, 11); });
  });
  v.legend([['red', 'collision'], ['accent', 'different fingerprints']]);
  v.readout(() => error || (r.status !== 'valid' ? `Outside the theorem's domain: ${r.status}.` : `${r.roots} of ${prime.value} equally likely bases collide. Exact probability ${r.roots}/${prime.value}; nonzero difference-polynomial degree ${r.degree}, bound min(1, degree/p)=${r.bound.toFixed(4)}. Alphabet has ${r.alphabet.length} distinct code points, encoded injectively as 0 through ${r.alphabet.length - 1}. Each cell shows the two actual hashes. Strings must be fixed before drawing the uniform base. ${note}`));
}

const prefixCode = ['π[0] ← 0; empty pattern has empty π', 'for i=1..m−1: j ← π[i−1]', '  compare P[i], P[j]; equal → j++, stop', '  mismatch: j>0 → j=π[j−1], retry; else stop', '  π[i] ← j', 'return π'];
export function prefixWidget(v, computing = false) {
  const P = input(v, 'Pattern (JSON, max 16)', 'ababacababaca'), k = computing ? null : choice(v, 'prefix length to inspect', [0, 1, 3, 5, 7, 12, 16], 5), s = stage(v, computing ? 'Actual preprocessing and reused borders' : 'A prefix and its longest proper border', 420), p = player(v, [P, k].filter(Boolean), () => H.prefix(H.parseString(P.value, 16, 'Pattern')), prefixCode, 'Compute the prefix function');
  v.render(() => { if (invalid(s, p)) return; const r = p.run, f = p.S.frame, n = computing ? Math.min(r.pattern.length, f.i + 1) : k.value, b0 = n <= r.pattern.length && n ? r.pi[n - 1] : 0, green = !computing || ['assign', 'done'].includes(f.kind) ? Array.from({ length: n }, (_, i) => i).filter(i => i < b0 || i >= n - b0) : []; strip(v, s, r.pattern, 18, { active: computing ? f.i : -1, green, values: computing ? f.pi.map((x, i) => f.kind === 'done' || i <= (f.kind === 'assign' || f.kind === 'start' ? f.i : f.i - 1) ? x : '·') : r.pi, label: 'index / character / π value' });
    if (n > r.pattern.length) { text(s, 'Selected prefix extends past the input.', s.width / 2, s.height - 42, 'red', 11); return; }
    const b = computing ? f.j || 0 : n ? r.pi[n - 1] : 0; text(s, `prefix length ${n}; ${computing ? 'candidate j' : 'longest border'} = ${b}`, s.width / 2, s.height - 72, 'accent'); text(s, ['assign', 'done'].includes(f.kind) ? `prefix [0, ${b}) = suffix [${n - b}, ${n})` : 'Candidate is not yet certified.', s.width / 2, s.height - 42, ['assign', 'done'].includes(f.kind) ? 'green' : 'muted');
  });
  v.legend([['gold', 'current position'], ['accent', 'border length'], ['green', 'equal prefix and suffix after assignment']]);
  v.readout(() => p.error || `Event ${p.S.frame.kind}; comparisons ${p.S.frame.comparisons}/${p.run.comparisons} (current/final), at most 2(m−1)=${2 * Math.max(0, p.run.pattern.length - 1)}. Final π=[${ids(p.run.pi)}]. ${computing ? 'Candidate comparisons may fail; only the assigned π is a certified longest border. Each fallback decreases j, while each outer iteration increases it at most once.' : k.value > p.run.pattern.length ? 'Selected length is unavailable; no clamping or invented prefix.' : 'A proper border is strictly shorter than this prefix; zero denotes the empty border.'} ${note}`);
}
export function borderWidget(v) {
  const P = input(v, 'Pattern (JSON, max 16)', 'ababacababaca'), k = choice(v, 'prefix length to inspect', [0, 1, 3, 5, 7, 12, 16], 5), s = stage(v, 'The two equal ends of a chosen prefix', 400); let r, error, b, chain;
  v.render(() => { error = ''; try { r = H.prefix(H.parseString(P.value, 16, 'Pattern')); } catch (e) { error = e.message; text(s, 'Input needs correction', s.width / 2, s.height / 2, 'red'); return; }
    const n = k.value, cols = Math.max(4, Math.min(16, Math.floor((s.width - 24) / 29))); b = n && n <= r.pattern.length ? r.pi[n - 1] : 0; chain = [b]; while (chain.at(-1)) chain.push(r.pi[chain.at(-1) - 1]);
    fitHeight(s, 95 + (Math.max(1, Math.ceil(r.pattern.length / cols)) + 2 * Math.max(1, Math.ceil(b / cols))) * 55);
    const end = strip(v, s, r.pattern, 18, { green: n <= r.pattern.length ? Array.from({ length: n }, (_, i) => i).filter(i => i < b || i >= n - b) : [], values: r.pi, label: 'whole pattern / π values' });
    if (n > r.pattern.length) { text(s, 'Selected prefix extends past the input.', s.width / 2, end + 25, 'red', 11); return; }
    const next = strip(v, s, r.pattern.slice(0, b), end + 8, { label: `prefix [0, ${b})` }); strip(v, s, r.pattern.slice(n - b, n), next + 8, { label: `equal suffix [${n - b}, ${n})` });
  });
  v.legend([['green', 'positions used by the equal ends'], ['accent', 'computed longest proper-border lengths']]);
  v.readout(() => error || (k.value > r.pattern.length ? 'Selected prefix length is unavailable; no clamping or invented prefix.' : `Chosen prefix length ${k.value}; longest proper border ${b}. Its shorter border chain is [${chain.join(', ')}]. Zero is the empty border. Final π=[${ids(r.pi)}]. The two strips show the actual equal strings; preprocessing is explored in 13.7. ${note}`));
}
export const computePrefixWidget = v => prefixWidget(v, true);

function localTrie(v, s, nodes, focus, visible, terminals, secondary = []) {
  const n = nodes[focus] || nodes[0], children = [...n.children.values()].filter(i => i < visible), pos = new Map([[n.id, [s.width / 2, s.height * .45]]]);
  if (n.parent !== null) pos.set(n.parent, [s.width / 2, s.height * .16]);
  children.forEach((id, j) => pos.set(id, [22 + (s.width - 44) * (j + .5) / Math.max(1, children.length), s.height * .76]));
  for (const [id, pt] of pos) { const parent = nodes[id].parent; if (pos.has(parent)) { const a = pos.get(parent), c = s.ctx; c.strokeStyle = v.color('muted'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(a[0], a[1] + 18); c.lineTo(pt[0], pt[1] - 18); c.stroke(); text(s, glyph(nodes[id].char), (a[0] + pt[0]) / 2 + 11, (a[1] + pt[1]) / 2, 'accent', 12); } }
  for (const [id, [x, y]] of pos) { const c = s.ctx; c.fillStyle = v.color(id === n.id ? 'gold' : 'accent', .25); c.strokeStyle = v.color(id === n.id ? 'gold' : 'accent'); c.beginPath(); c.arc(x, y, 12, 0, 2 * Math.PI); c.fill(); c.stroke(); if (terminals.some(a => a[0] === id)) { c.beginPath(); c.arc(x, y, 15, 0, 2 * Math.PI); c.stroke(); } text(s, id, x, y, 'ink', 11); }
  text(s, `Local trie view · node ${n.id} · depth ${n.depth}`, s.width / 2, 18, 'muted', 11);
  if (secondary.length) text(s, secondary.join(' · '), s.width / 2, s.height - 15, 'purple', 11);
}
export function trieWidget(v) {
  const mode = choice(v, 'structure', ['dictionary trie', 'suffix trie'], 'dictionary trie'), D = input(v, 'Dictionary (JSON array, ≤8 words)', ['he', 'her', 'hers', 'she']), T = input(v, 'Suffix-trie text (JSON, max 8)', 'banana'), Q = input(v, 'Query (JSON, max 12)', 'he'), s = stage(v, 'Follow actual insertion edges; double rings mark terminals', 350);
  const p = player(v, [mode, D, T, Q], () => { const r = mode.value === 'suffix trie' ? H.suffixTrie(H.parseString(T.value, 8, 'Text')) : H.trie(H.parseDictionary(D.value)); r.query = H.trieQuery(r.nodes, H.parseString(Q.value, 12, 'Query')); return r; }, ['start with root ε', 'for each word, follow its characters', '  create a missing edge and child', 'mark the final node with this word ID', 'query: follow edges; check terminal mark'], 'Uncompressed trie insertion');
  v.render(() => { D.el.style.display = mode.value === 'dictionary trie' ? '' : 'none'; T.el.style.display = mode.value === 'suffix trie' ? '' : 'none'; if (invalid(s, p)) return; const r = p.run, f = p.S.frame, focus = p.S.atEnd ? r.query.path.at(-1) : f.node; localTrie(v, s, r.nodes, focus, f.visible, f.terminals); });
  v.legend([['gold', 'current or queried node'], ['accent', 'character edge / node'], ['muted', 'parent-child connection']]);
  v.readout(() => { if (p.error) return p.error; const r = p.run, f = p.S.frame, focus = p.S.atEnd ? r.query.path.at(-1) : f.node; return `${f.visible}/${r.nodes.length} nodes built; inserted character occurrences ${r.characters}. Node ${focus} prefix: ${cp(r.nodes[focus].prefix) || 'ε'}. This local view shows its parent and every currently built child; step through insertions or change the query to visit other nodes. Query path [${r.query.path.join(', ')}]: ${r.query.present ? r.query.terminal ? 'complete stored word' : 'prefix only' : 'missing edge'}. ${mode.value === 'suffix trie' ? 'All n+1 suffixes, including ε, are inserted. A query path recognizes a substring; terminal status means it is also a suffix. Uncompressed size can be quadratic.' : 'Duplicate words retain separate IDs; the empty word marks the root.'} ${note}`; });
}

export function suffixWidget(v, kind) {
  const T = input(v, 'Text (JSON, max 12)', kind === 'doubling' ? 'mississippi' : 'banana'), Q = kind === 'search' ? input(v, 'Query (JSON, max 12)', 'ana') : null, s = stage(v, kind === 'search' ? 'Sorted suffixes and the binary-search interval' : kind === 'doubling' ? 'Actual rank pairs and stable radix order' : 'Adjacent suffixes and their reused common prefixes', 500), extra = kind === 'kasai' ? stage(v, 'Current suffix pair in text order', 460) : null;
  const code = kind === 'search' ? ['construct sorted suffix positions, including n', 'twice: lo=0, hi=n+1; while lo<hi:', '  mid=floor((lo+hi)/2); order=compare(suffix,query)', '  order<0 or (upper and order=0): lo=mid+1; else hi=mid', 'return SA[lower:upper]'] : kind === 'doubling' ? ['k=1; rank symbols; empty suffix rank 0', 'while ranks are not all distinct:', '  pair[i]=(r[i],r[i+k] or −1); stable count-sort second, then first', '  rename unequal pairs in sorted order; k ← 2k', 'return the sorted suffix positions'] : ['build inverse rank; h ← 0', 'for i=0..n: rank 0 → h=0, continue', '  j ← SA[rank[i]−1]; reuse h characters', '  extend h while both symbols exist and equal', '  LCP[rank[i]] ← h; h ← max(0,h−1)', 'return LCP'];
  const p = player(v, [T, Q].filter(Boolean), () => { const t = H.parseString(T.value, 12, 'Text'); return kind === 'search' ? H.suffixSearch(t, H.parseString(Q.value, 12, 'Query')) : H[kind](t); }, code, kind === 'search' ? 'Two binary searches' : kind === 'doubling' ? 'Prefix doubling by radix sort' : 'Kasai LCP scan');
  const table = v.table(s, { square: false, cellAspect: 2, maxCell: 32, size: 12, labelSize: 11, colWeights: kind === 'search' ? [1, 1, 3] : [1, 1, 1, 2] });
  v.render(() => { if (invalid(s, p)) return; const r = p.run, f = p.S.frame, sa = f.sa || r.sa; fitHeight(s, Math.max(180, (sa.length + 1) * 28 + 26));
    table.draw({ rows: sa.length, cols: kind === 'search' ? 3 : 4, colLabels: kind === 'search' ? ['rank', 'start', 'suffix'] : kind === 'doubling' ? ['order', 'start', 'rank', 'pair'] : ['rank', 'start', 'LCP', 'predecessor'], value: (i, j) => j === 0 ? i : j === 1 ? sa[i] : kind === 'search' ? sa[i] === r.text.length ? 'ε' : '“' + r.text.slice(sa[i]).map(glyph).join('') + '”' : kind === 'doubling' ? j === 2 ? f.ranks[sa[i]] : f.pairs ? f.pairs[sa[i]].join(',') : '—' : j === 2 ? (i === 0 || f.kind === 'done' || sa[i] < f.i || (f.kind === 'assign' && sa[i] === f.i) ? f.lcp[i] : '·') : i ? sa[i - 1] : '—', fill: i => kind === 'search' ? i === f.mid ? ['gold', .3] : f.lo <= i && i < f.hi ? ['accent', .14] : null : kind === 'kasai' && sa[i] === f.i ? ['gold', .3] : null });
    if (extra) { const done = f.kind === 'done', at = r.lcp.indexOf(r.longest), i = done ? r.sa[at] : f.i, j = done ? r.sa[at - 1] : f.j, h = done ? r.longest : f.h, a = r.text.slice(i), b = j === undefined ? [] : r.text.slice(j), cols = Math.max(4, Math.min(16, Math.floor((extra.width - 24) / 29))); fitHeight(extra, 90 + (Math.max(1, Math.ceil(a.length / cols)) + Math.max(1, Math.ceil(b.length / cols))) * 55); extra.setTitle(done ? 'A pair attaining the final maximum LCP' : 'Current suffix pair in text order'); const end = strip(v, extra, a, 18, { active: done ? -1 : h, green: Array.from({ length: h }, (_, k) => k), label: `suffix i=${i}` }); strip(v, extra, b, end + 8, { active: done ? -1 : h, green: Array.from({ length: h }, (_, k) => k), label: j === undefined ? 'no predecessor at this step' : `predecessor j=${j}` }); }
  });
  v.legend(kind === 'search' ? [['gold', 'current probe'], ['accent', 'remaining search interval']] : kind === 'kasai' ? [['gold', 'current text position'], ['green', 'reused equal characters']] : [['ink', 'actual integer ranks and pairs']]);
  v.readout(() => { if (p.error) return p.error; const r = p.run, f = p.S.frame; return `Event ${f.kind}. Empty suffix at position n=${r.text.length} is included and sorts first; no typed sentinel is reserved. ${kind === 'search' ? `Current [lo,hi)=[${f.lo},${f.hi}); final matching ranks [${r.lo},${r.hi}), positions in suffix order [${ids(r.matches)}]. Character comparisons ${f.comparisons}/${r.comparisons} current/final. This definition scene uses direct comparison sorting; only the search is the two binary searches.` : kind === 'doubling' ? `Represented prefix length ${f.k}; ${f.classes} rank classes. ${f.passes} stable counting passes completed; final ${r.rounds} doubling rounds. Pair (r[i],r[i+k]) uses −1 beyond n. Initial alphabet naming sorts distinct code points, then every doubling round uses two actual stable counting passes.` : `Reused h=${f.h}; character comparisons ${f.comparisons}/${r.comparisons} current/final, bounded by 2n=${2 * r.text.length}. Final maximum LCP ${r.longest}; one longest repeated string has code points ${cp(r.repeated) || 'ε'}. Its occurrences may overlap. The last column gives the preceding suffix’s start; dots mark unassigned LCP values.`} ${note}`; });
}
export const suffixArrayWidget = v => suffixWidget(v, 'search');
export const doublingWidget = v => suffixWidget(v, 'doubling');
export const kasaiWidget = v => suffixWidget(v, 'kasai');

export function ahoWidget(v) {
  const T = input(v, 'Text (JSON, max 32)', 'ushershishe'), D = input(v, 'Dictionary (JSON array, ≤8 words)', ['he', 'she', 'hers', 'his']), s = stage(v, 'Current trie state and suffix links', 350), out = stage(v, 'Reported dictionary occurrences', 330);
  const p = player(v, [T, D], () => H.aho(H.parseString(T.value, 32, 'Text'), H.parseDictionary(D.value)), ['build trie with terminal ID lists; fail[root]=root', 'root children fail to root; process nodes by BFS', '  missing go[u,c] ← go[fail[u],c] (root → root)', '  child v: fail[v] ← go[fail[u],c]', '  out[v] ← terminal fail[v], else out[fail[v]]', 'state ← root; report empty words at boundary 0', 'for each character: state ← go[state,char]', '  report this node and follow terminal out links', 'return all (word ID, start, end) occurrences'], 'Aho–Corasick with terminal output links');
  v.render(() => { if (invalid(s, p)) return; const r = p.run, f = p.S.frame, q = f.state, terminals = r.nodes.flatMap(n => n.terminal.map(w => [n.id, w])); localTrie(v, s, r.nodes, q, r.nodes.length, terminals, [`failure ${q}→${r.fail[q]}`, `output ${r.output[q] === null ? 'none' : q + '→' + r.output[q]}`]);
    const w = (out.width - 48) / Math.max(1, r.text.length), row = (out.height - 52) / Math.max(1, r.words.length); text(out, 'half-open text intervals [start, end)', out.width / 2, 16, 'muted', 11);
    r.words.forEach((word, i) => { const y = 40 + (i + .5) * row; text(out, i, 16, y, 'muted', 11); const c = out.ctx; c.strokeStyle = v.color('grid'); c.beginPath(); c.moveTo(34, y); c.lineTo(out.width - 14, y); c.stroke(); });
    (f.matches || []).forEach(a => { const y = 40 + (a.word + .5) * row, x = 34 + a.start * w, c = out.ctx; c.strokeStyle = v.color('green'); c.lineWidth = 3; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(34 + a.end * w, y - 5); c.stroke(); c.fillStyle = v.color('green'); c.beginPath(); c.arc(x, y - 5, 2.5, 0, 2 * Math.PI); c.fill(); });
    for (let i = 0; i <= r.text.length; i += Math.max(1, Math.ceil(r.text.length / 8))) text(out, i, 34 + i * w, out.height - 8, 'muted', 10);
  });
  v.legend([['gold', 'current trie state'], ['purple', 'failure / terminal-output links'], ['green', 'reported occurrences'], ['muted', 'dictionary ID row']]);
  v.readout(() => { if (p.error) return p.error; const r = p.run, f = p.S.frame, now = f.matches || []; return `Consumed ${f.kind === 'done' ? r.text.length : f.i + 1} characters; state ${f.state}, prefix ${cp(r.nodes[f.state].prefix) || 'ε'}. ${r.nodes.length} trie nodes, ${r.alphabet.length} alphabet symbols, ${r.tableCells} dense transition cells. Final scan: ${r.transitions} transitions plus ${r.matches.length} reported occurrences. Current reports: ${now.length}; IDs/intervals ${now.length ? now.slice(0, 16).map(a => a.word + ':[' + a.start + ',' + a.end + ')').join('; ') + (now.length > 16 ? '; first 16 shown here, all intervals remain in the diagram' : '') : 'none'}. The trie view shows current parent/children; failure and terminal-output destinations are separate node IDs. Empty words match every boundary; duplicate entries retain IDs. ${note}`; });
}
