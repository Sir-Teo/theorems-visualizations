// Theory of Computation — Chapter 4: Limits and structure of regular languages (items 4.1–4.5; 4.6–4.9 in ch04-b.js, 4.10–4.13 in ch04-c.js)
import { EPS, DEAD, upTo, pen, keypad, dfa, texName, run, PRESETS, dfaGraph, drawDFA, tt, BIN, LANGS, signature, sepSuffix, classify, layoutBFS, rep, XYZ, drawPieces, pumpSplit, isPrimeN } from './ch04.shared.js';

const mod5 = () => dfa(['a', 'b'], [0, 1, 2, 3, 4].map((i) => ['q' + i, 5 + 3.6 * Math.cos(Math.PI + (2 * Math.PI * i) / 5), 3.6 + 2.6 * Math.sin(Math.PI + (2 * Math.PI * i) / 5), i === 0]), 'q0',
  Object.fromEntries([0, 1, 2, 3, 4].map((i) => ['q' + i, { a: 'q' + ((i + 1) % 5), b: 'q' + i }])), { name: 'number of a divisible by 5' });
const tex = (u) => `\\mathtt{${u}}`;

export default {
  collection: 'toc',
  chapter: 4,
  title: 'Limits and structure of regular languages',
  summary: String.raw`A DFA with $p$ states reading a long string must revisit a state, so a middle piece can be repeated — the pumping lemma, which proves many languages nonregular through an adversarial game. The Myhill–Nerode theorem goes further and characterizes regularity exactly: finitely many classes of prefixes that no suffix can tell apart. Those classes are the states of the unique minimal DFA, which partition refinement computes. Two-way heads and infinite inputs show how robust the class is.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Theorem',
      name: 'Pumping lemma for regular languages',
      statement: String.raw`Let $L$ be a regular language. Then there is an integer $p\ge1$ (a *pumping length*) such that every string $w\in L$ with $|w|\ge p$ can be written $w=xyz$ with
(a) $|y|\ge1$,
(b) $|xy|\le p$,
(c) $xy^iz\in L$ for every $i\ge0$.
Any $p$ at least the number of states of some DFA for $L$ works. The condition is **necessary** for regularity but not sufficient (see 4.9).`,
      idea: String.raw`Take a DFA with $p$ states and a string $w\in L$ with $|w|\ge p$. Its run visits $|w|+1\ge p+1$ states, so by the pigeonhole principle (comb-1.2) two of the first $p+1$ of them coincide. The piece $y$ read between the two visits is a loop from a state back to itself; deleting the loop or going round it $i$ times leaves the machine in the same state before it continues with $z$, so the end state — and acceptance — is unchanged.`,
      caption: String.raw`Choose a machine and type a string (the run is drawn on the machine: blue = the path $x$, orange = the loop $y$, teal = the rest $z$). The slider pumps the loop $k$ times; the lower row shows the pumped string with the state under every boundary, and the verdict never changes. Try a string **shorter than the number of states** $p$: the run may have no repeated state and the lemma promises nothing.`,
      deps: ['toc-2.3', 'comb-1.2'],
      refs: ['Pettorossi, Automata Theory and Formal Languages, §2.9 Theorem 2.9.1 pp. 72–73; DFA first-repeat refinement proved here'],
      credit: 'Proof checked against Alberto Pettorossi, Automata Theory and Formal Languages; historical priority not asserted',
      scope: String.raw`The proof uses a complete DFA and the first repeated state among the first $p+1$ run positions, giving the stronger bound $|xy|\le p$. The visualization also accepts rejected inputs: a loop preserves their rejection, but this is an extra observation, not the lemma's $w\in L$ hypothesis. Original historical priority has been removed; no conclusion about nonregularity is drawn from a finite pumping sample.`,
      tags: ['pumping lemma', 'pigeonhole', 'regular languages'],
      links: { 'Author textbook': 'https://cs.brown.edu/courses/csci1810/fall-2024/resources/ch2_readings/automata_theory_and_formal_languages.pdf', 'Author minimization proof': 'https://cs.stanford.edu/people/trevisan/cs103-14/lecture16.pdf' },
      viz(v) {
        const MACH = { hasABA: () => PRESETS.hasABA(), endsAB: () => PRESETS.endsAB(), aMod3: () => PRESETS.aMod3(), mod5 };
        const DEF = { hasABA: 'bbabab', endsAB: 'abbaab', aMod3: 'abaabb', mod5: 'aabaaab' };
        let D = MACH.hasABA(), w = DEF.hasABA;
        const sel = v.select('machine', [{ value: 'hasABA', label: 'contains aba (4 states)' }, { value: 'endsAB', label: 'ends in ab (3)' }, { value: 'aMod3', label: '# of a divisible by 3 (3)' }, { value: 'mod5', label: '# of a divisible by 5 (5)' }], 'hasABA', {
          onChange: (k) => { D = MACH[k](); w = DEF[k]; G.sync(D); },
        });
        keypad(v, ['a', 'b'], () => w, (x) => { w = x; }, { max: 10 });
        const kS = v.slider('pump count $k$', 0, 5, 2, { int: true });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 300, weight: 1.15 });
        const rs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1 });
        const G = dfaGraph(v, gs, D);
        let info = null;
        v.render(() => {
          const sp = pumpSplit(D, w), n = w.length, p = D.states.length, have = sp.i >= 0;
          const x = have ? w.slice(0, sp.i) : w, y = have ? w.slice(sp.i, sp.j) : '', z = have ? w.slice(sp.j) : '', k = kS.value, w2 = x + rep(y, k) + z;
          const r1 = run(D, w), r2 = run(D, w2);
          const ecol = new Map(); for (let t = 0; t < n; t++) ecol.set(sp.path[t] + '|' + sp.path[t + 1] + '|' + w[t], !have ? 'gold' : t < sp.i ? XYZ.x : t < sp.j ? XYZ.y : XYZ.z);
          const ncol = {}; sp.path.forEach((q, t) => { const c = !have ? null : t < sp.i ? XYZ.x : t < sp.j ? XYZ.y : XYZ.z; if (c && (!ncol[q] || c === XYZ.y)) ncol[q] = c; });
          if (have) ncol[sp.path[sp.i]] = XYZ.y;
          const ek = (e) => { for (const c of e.syms) { const f = ecol.get(e.from + '|' + e.to + '|' + c); if (f) return f; } return null; };
          drawDFA(v, gs, G, D, { fill: (id) => ncol[id] || null, edgeColor: ek, edgeWidth: (e) => (ek(e) ? 3.2 : null) });
          gs.corner(`p = ${p} states`, 'tr', { color: 'muted', weight: 700, size: 13 });
          const P = pen(rs, v);
          P.sans('w = x y z', 14, 18, { align: 'left', size: 12.5, weight: 700, color: 'muted' });
          drawPieces(P, [{ s: x, col: XYZ.x }, { s: y, col: XYZ.y }, { s: z, col: XYZ.z }], 36, { path: r1.path, cell: 30 });
          P.sans(`x y^${k} z`, 14, 128, { align: 'left', size: 12.5, weight: 700, color: 'muted' });
          drawPieces(P, [{ s: x, col: XYZ.x }, { s: rep(y, k), col: XYZ.y }, { s: z, col: XYZ.z }], 146, { path: r2.path, cell: 30 });
          const col1 = r1.acc ? 'green' : 'red', col2 = r2.acc ? 'green' : 'red';
          P.sans(`w: ${r1.acc ? 'accepted' : 'rejected'}`, P.W * 0.27, 96, { size: 13, weight: 700, color: col1 });
          P.sans(`x y^${k} z: ${r2.acc ? 'accepted' : 'rejected'}${r1.acc === r2.acc ? '  ✓ same' : '  ✗ differs'}`, P.W * 0.62, 240, { size: 13, weight: 700, color: r1.acc === r2.acc ? col2 : 'red' });
          if (!have) P.sans(n < p ? `|w| = ${n} < p = ${p}: no state need repeat yet` : 'no repeated state', P.W / 2, 276, { size: 12, color: 'orange' });
          info = { x, y, z, have, p, n, r1, r2, k, i: sp.i, j: sp.j };
        });
        v.legend([[XYZ.x, 'x: path to the first repeated state', { dot: true }], [XYZ.y, 'y: the loop', { dot: true }], [XYZ.z, 'z: the rest', { dot: true }]]);
        v.readout(() => {
          const I = info;
          if (!I.have) return `$|w|=${I.n}$, $p=${I.p}$: the run never repeats a state, so there is no split — the lemma only speaks about strings with $|w|\\ge p$.`;
          return `$x=${I.x ? tex(I.x) : '\\varepsilon'},\\ y=${tex(I.y)},\\ z=${I.z ? tex(I.z) : '\\varepsilon'}$ · $|y|=${I.y.length}\\ge1$ · $|xy|=${I.j}\\le p=${I.p}$ · the states before and after $y$ coincide ($${texName(I.r1.path[I.i]).replace(/\$/g, '')}$) · $xy^{${I.k}}z$ is ${I.r2.acc ? '**accepted**' : '**rejected**'}, as $w$ is.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Method',
      name: 'The pumping game',
      statement: String.raw`To show that a language $L$ is **not** regular with the pumping lemma (4.1), play the following game against an imaginary adversary who claims $L$ is regular. The adversary first announces a pumping length $p$; you choose a string $s\in L$ with $|s|\ge p$ (it may depend on $p$); the adversary splits $s=xyz$ with $|y|\ge1$ and $|xy|\le p$; you finish by choosing an $i\ge0$. You **win** if $xy^iz\notin L$. If you have a strategy that wins against every $p$ and every split, no pumping length exists, so $L$ is not regular. For a regular $L$ the adversary has a winning strategy instead.`,
      idea: String.raw`The lemma says: there exists $p$, such that for all long $s$ there exists a split, such that for all $i$ the pumped string is in $L$. Negating it flips every quantifier — for all $p$, there is a string $s$, for all splits, there is an $i$ with $xy^iz\notin L$ — and that is exactly your winning strategy. The art is the choice of $s$: it must be long enough that $|xy|\le p$ pins the pumped piece inside a region where pumping visibly breaks the structure (for $0^n1^n$ take $s=0^p1^p$, so $y$ consists of zeros only).`,
      caption: String.raw`You play the string, the adversary plays $p$ (slider) and the split. The table lists **every** split the adversary may choose (rows) against the pump counts $i=0,\dots,5$ and the first $i\le60$ that escapes $L$; green = pumped string still in $L$, red = out. A row with no red cell is a safe split for the adversary. Type your own string or press *suggest*; with a poor string (or a regular language such as *even number of 0s*) a green row remains and you lose. The strip at the bottom replays the suggested strategy for $p=2,\dots,6$.`,
      deps: ['toc-4.1'],
      refs: ['Sipser §1.4'],
      tags: ['pumping lemma', 'nonregular languages'],
      viz(v) {
        const NAMES = ['zn1n', 'pal', 'ww', 'prime', 'eq', 'even0'];
        const SUG = { zn1n: (p) => '0'.repeat(p) + '1'.repeat(p), pal: (p) => '0'.repeat(p) + '1' + '0'.repeat(p), ww: (p) => '0'.repeat(p) + '1' + '0'.repeat(p) + '1', prime: (p) => { let q = p; while (!isPrimeN(q)) q++; return '0'.repeat(q); }, eq: (p) => '0'.repeat(p) + '1'.repeat(p), even0: (p) => '0'.repeat(2 * p) };
        const langSel = v.select('language $L$', NAMES.map((k) => ({ value: k, label: LANGS[k].name })), 'zn1n', { onChange: () => { inp.set(SUG[langSel.value](pS.value)); } });
        const pS = v.slider('adversary\'s $p$', 2, 6, 4, { int: true, onChange: () => { if (suggested) inp.set(SUG[langSel.value](pS.value)); } });
        let suggested = true;
        const inp = v.input('your string $s$', SUG.zn1n(4), { width: 210, onChange: () => { suggested = false; } });
        v.button('suggest', () => { suggested = true; inp.set(SUG[langSel.value](pS.value)); });
        const iS = v.slider('your pump count $i$', 0, 5, 2, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 520, weight: 1, full: true });
        const T = v.table(s, { rows: 1, cols: 7, square: false, maxCell: 26, cellAspect: 1.9, size: 12.5, labelSize: 11.5, margin: 6 });
        const strip = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 74, full: true });
        const ESC = 60;
        const plays = (mem, str, p) => {
          const n = str.length, rows = [];
          for (let a = 0; a <= Math.min(p, n) - 1; a++) for (let b = 1; a + b <= Math.min(p, n); b++) {
            const x = str.slice(0, a), y = str.slice(a, a + b), z = str.slice(a + b), ok = [];
            for (let i = 0; i <= 5; i++) ok.push(mem(x + rep(y, i) + z));
            let esc = -1; for (let i = 0; i <= ESC; i++) if (i !== 1 && !mem(x + rep(y, i) + z)) { esc = i; break; }
            rows.push({ x, y, z, ok, esc });
          }
          return rows;
        };
        let st = null;
        v.render(() => {
          const L = LANGS[langSel.value], p = pS.value, str = inp.value.trim();
          const valid = /^[01]+$/.test(str) && L.mem(str) && str.length >= p;
          const bad = !/^[01]*$/.test(str) ? 'use only 0 and 1' : !L.mem(str) ? 'the string must belong to L' : str.length < p ? `the string must have length ≥ p = ${p}` : null;
          const rows = valid ? plays(L.mem, str, p) : [];
          const safe = rows.findIndex((r) => r.esc < 0);
          const pick = safe >= 0 ? safe : rows.reduce((b, r, k) => (r.esc > (rows[b]?.esc ?? -1) ? k : b), 0);
          st = { valid, bad, rows, safe, pick, p };
          const P = pen(s, v);
          if (!valid) { P.sans(bad, P.W / 2, 60, { size: 14, color: 'red', weight: 600 }); }
          else {
            const lab = (r) => `$${r.x ? tex(r.x) : '\\varepsilon'}\\,|\\,${tex(r.y)}\\,|\\,${r.z ? tex(r.z) : '\\varepsilon'}$`;
            const cols = ['0', '1', '2', '3', '4', '5'].map((c) => `$i=${c}$`);
            T.draw({
              rows: rows.length, cols: 7, colWeights: [1, 1, 1, 1, 1, 1, 1.9], rowLabels: rows.map(lab), colLabels: [...cols, 'first escape'], cornerLabel: '$x\\,|\\,y\\,|\\,z$',
              value: (i, j) => (j < 6 ? (rows[i].ok[j] ? '∈' : '∉') : rows[i].esc < 0 ? '—' : `i=${rows[i].esc}`),
              fill: (i, j) => (j < 6 ? [rows[i].ok[j] ? 'green' : 'red', rows[i].ok[j] ? 0.28 : 0.42] : rows[i].esc < 0 ? ['green', 0.28] : ['red', 0.12]),
              activeRow: pick, activeColor: safe >= 0 ? 'green' : 'gold',
              highlight: j6(rows, pick, iS.value),
            });
          }
          // strip: suggested strategy for p = 2..6
          const Q = pen(strip, v); Q.sans('suggested strategy against p =', 10, 16, { align: 'left', size: 12, color: 'muted', weight: 600 });
          for (let q = 2; q <= 6; q++) {
            const sg = SUG[langSel.value](q), rr = plays(L.mem, sg, q), win = L.mem(sg) && rr.length > 0 && rr.every((r) => r.esc >= 0);
            const x0 = 12 + (q - 2) * Math.min(120, (Q.W - 24) / 5);
            Q.box(x0, 30, Math.min(110, (Q.W - 24) / 5 - 8), 30, { r: 6, fill: win ? 'green' : 'red', alpha: 0.2, stroke: win ? 'green' : 'red', width: q === p ? 2.6 : 1.2 });
            Q.sans(`p = ${q}: ${win ? 'you win' : 'adversary'}`, x0 + Math.min(110, (Q.W - 24) / 5 - 8) / 2, 45, { size: 12, weight: 700, color: win ? 'green' : 'red' });
          }
        });
        function j6(rows, pick, i) { return rows.length ? [[pick, Math.min(i, 5), 'accent']] : []; }
        v.readout(() => {
          const S = st; if (!S.valid) return `**${S.bad}**`;
          const r = S.rows[S.pick], L = LANGS[langSel.value], i = iS.value;
          if (S.safe >= 0) return `${S.rows.length} admissible splits; the adversary plays the safe split $${r.x ? tex(r.x) : '\\varepsilon'}\\,|\\,${tex(r.y)}\\,|\\,${r.z ? tex(r.z) : '\\varepsilon'}$ — every pumped string stays in $L$ (checked for $i\\le${ESC}$). **Adversary survives**${L.reg ? ' (as it must: this language is regular)' : ' — pick a better string'}.`;
          const inL = r.ok[Math.min(i, 5)];
          return `Every one of the ${S.rows.length} splits has an escaping $i$ — the adversary's best split is $${r.x ? tex(r.x) : '\\varepsilon'}\\,|\\,${tex(r.y)}\\,|\\,${r.z ? tex(r.z) : '\\varepsilon'}$, which breaks at $i=${r.esc}$. Your pump count $i=${i}$: pumped string is ${inL ? 'still in $L$ (try $i=' + r.esc + '$)' : '**not in $L$ — you win**'}. This beats $p=${S.p}$ only; the proof needs a winning string for every $p$ (strip below).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Classic nonregular languages',
      statement: String.raw`The following languages are not regular:
(a) $\{0^n1^n : n\ge0\}$;
(b) the palindromes over $\{0,1\}$;
(c) the squares $\{ww : w\in\{0,1\}^*\}$;
(d) the unary primes $\{0^p : p\text{ prime}\}$ (more generally, a unary language whose gaps are unbounded and not ultimately periodic, by 4.10).
In each case the pumping game (4.2) is won with an explicit string and an explicit pump count.`,
      idea: String.raw`For (a) take $s=0^p1^p$: since $|xy|\le p$, the loop $y$ consists of zeros only, and $i=0$ (or $i=2$) unbalances the counts. For (b) take $s=0^p10^p$: $y$ lies in the first block of zeros, and $i=2$ moves the central $1$ off-centre. For (c) take $s=0^p10^p1$: pumping the zeros of the first half makes the two halves differ. For (d) take a prime $q\ge p$ and $s=0^q$: if $|y|=b$, then $|xy^{q+1}z|=q+qb=q(b+1)$ is composite.`,
      caption: String.raw`Pick a language and the adversary's $p$; the proof's witness string is shown, and you play the adversary: set $|x|$ and $|y|$ with the sliders ($|x|+|y|\le p$). The strip shows the pumped strings $xy^iz$ for $i=0,\dots,12$ (length, and whether they are in $L$); the grid on the right gives, for **every** admissible split, the first $i$ that leaves $L$ — all cells are filled, which is the proof. For the primes the lengths march along the number line until a composite appears.`,
      deps: ['toc-4.2'],
      refs: ['Sipser §1.4'],
      tags: ['pumping lemma', 'nonregular languages'],
      viz(v) {
        const NAMES = ['zn1n', 'pal', 'ww', 'prime'];
        const WIT = { zn1n: (p) => '0'.repeat(p) + '1'.repeat(p), pal: (p) => '0'.repeat(p) + '1' + '0'.repeat(p), ww: (p) => '0'.repeat(p) + '1' + '0'.repeat(p) + '1', prime: (p) => { let q = Math.max(p, 2); while (!isPrimeN(q)) q++; return '0'.repeat(q); } };
        const langSel = v.select('language', NAMES.map((k) => ({ value: k, label: LANGS[k].name })), 'zn1n');
        const pS = v.slider('adversary\'s $p$', 2, 8, 5, { int: true });
        const aS = v.slider('$|x|$', 0, 7, 1, { int: true }), bS = v.slider('$|y|$', 1, 8, 2, { int: true });
        const ls = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.35 });
        const ms = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1 });
        const NI = 12, ESC = 60;
        const first = (mem, x, y, z) => { for (let i = 0; i <= ESC; i++) if (i !== 1 && !mem(x + rep(y, i) + z)) return i; return -1; };
        let info = null;
        v.render(() => {
          const L = LANGS[langSel.value], p = pS.value, str = WIT[langSel.value](p), n = str.length;
          if (aS.value > p - 1) aS.set(p - 1);
          if (bS.value > p - aS.value) bS.set(Math.max(1, p - aS.value));
          const a = aS.value, b = bS.value, x = str.slice(0, a), y = str.slice(a, a + b), z = str.slice(a + b);
          const P = pen(ls, v);
          P.sans(`witness s (|s| = ${n} ≥ p = ${p}, s ∈ L: ${L.mem(str) ? 'yes' : 'NO'})`, 14, 16, { align: 'left', size: 12.5, weight: 700, color: 'muted' });
          drawPieces(P, [{ s: x, col: XYZ.x }, { s: y, col: XYZ.y }, { s: z, col: XYZ.z }], 30, { cell: 24, x0: 14, margin: 28 });
          // pumped strings
          const rows = []; for (let i = 0; i <= NI; i++) { const w = x + rep(y, i) + z; rows.push({ i, w, ok: L.mem(w) }); }
          const rh = 19, y0 = 76, maxLen = Math.max(...rows.map((r) => r.w.length)); let firstOut = rows.findIndex((r) => !r.ok);
          rows.forEach((r, k) => {
            const yy = y0 + k * rh;
            P.box(10, yy, P.W - 20, rh - 3, { r: 4, fill: r.ok ? 'green' : 'red', alpha: r.ok ? 0.1 : 0.2, stroke: false });
            P.text(`i = ${r.i}`, 18, yy + rh / 2 - 1, { align: 'left', size: 11.5, weight: 600, color: 'muted' });
            const cw = Math.min(10, (P.W - 230) / Math.max(maxLen, 1)), x0 = 66;
            [...r.w].forEach((ch, q) => { const part = q < a ? XYZ.x : q < a + b * r.i && r.i > 0 ? XYZ.y : XYZ.z; const col = q < a ? XYZ.x : q < a + b * r.i ? XYZ.y : XYZ.z; P.box(x0 + q * cw, yy + 2, cw - 0.8, rh - 7, { r: 1, fill: col, alpha: 0.5, stroke: false }); });
            P.text(`|w| = ${r.w.length}`, P.W - 110, yy + rh / 2 - 1, { align: 'right', size: 11, color: 'muted' });
            P.text(r.ok ? '∈ L' : '∉ L', P.W - 22, yy + rh / 2 - 1, { align: 'right', size: 12, weight: 700, color: r.ok ? 'green' : 'red' });
          });
          const Q = pen(ms, v);
          Q.sans('first i that leaves L, for every split', Q.W / 2, 16, { size: 12.5, weight: 700, color: 'muted' });
          const cell = Math.min(36, (Q.W - 70) / (p + 1), (Q.H - 100) / p), gx = 46, gy = 54;
          Q.sans('columns: |x|, rows: |y|', Q.W / 2, 33, { size: 10.5, color: 'muted' });
          let allEsc = true, maxI = 0, count = 0;
          for (let bb = 1; bb <= p; bb++) for (let aa = 0; aa + bb <= p; aa++) {
            const xx = str.slice(0, aa), yy2 = str.slice(aa, aa + bb), zz = str.slice(aa + bb), f = first(L.mem, xx, yy2, zz); count++;
            if (f < 0) allEsc = false; else maxI = Math.max(maxI, f);
            const cur = aa === a && bb === b, X = gx + aa * cell, Y = gy + (bb - 1) * cell;
            Q.box(X, Y, cell - 2, cell - 2, { r: 4, fill: f < 0 ? 'green' : 'red', alpha: f < 0 ? 0.4 : 0.14 + 0.05 * Math.min(f, 4), stroke: cur ? 'gold' : f < 0 ? 'green' : 'red', width: cur ? 3 : 1 });
            Q.text(f < 0 ? '✓' : String(f), X + cell / 2 - 1, Y + cell / 2, { size: 12.5, weight: 700, color: f < 0 ? 'green' : 'ink' });
          }
          for (let aa = 0; aa < p; aa++) Q.text(String(aa), gx + aa * cell + cell / 2 - 1, gy - 3, { size: 9.5, color: 'faint', baseline: 'bottom' });
          for (let bb = 1; bb <= p; bb++) Q.text(String(bb), gx - 10, gy + (bb - 1) * cell + cell / 2, { size: 9.5, color: 'faint' });
          info = { allEsc, maxI, count, firstOut, rows, a, b, p, n, prime: langSel.value === 'prime', q: n };
        });
        v.legend([[XYZ.x, 'x', { dot: true }], [XYZ.y, 'y (pumped)', { dot: true }], [XYZ.z, 'z', { dot: true }], ['red', 'pumped string not in L', { dot: true }]]);
        v.readout(() => {
          const I = info, L = LANGS[langSel.value];
          const lens = I.prime ? ` Lengths $|xy^iz|=${I.q}+${I.b}(i-1)$: ${I.rows.slice(0, 6).map((r) => r.w.length + (isPrimeN(r.w.length) ? '' : '^{\\times}')).map((t) => `$${t}$`).join(', ')}, …; at $i=${I.q + 1}$ the length is $${I.q}\\cdot${I.b + 1}$.` : '';
          return `This split: first escape at $i=${I.firstOut}$ (${I.rows[I.firstOut] ? 'length ' + I.rows[I.firstOut].w.length : ''}). All ${I.count} admissible splits for $p=${I.p}$ ${I.allEsc ? `escape $L$ (largest first escape $i=${I.maxI}$)` : '**do not all escape within the search**'}.${lens}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Myhill–Nerode equivalence',
      statement: String.raw`Let $L\subseteq\Sigma^*$. Two strings $x,y\in\Sigma^*$ are **indistinguishable by $L$**, written $x\equiv_L y$, if for every $z\in\Sigma^*$
$$xz\in L\iff yz\in L .$$
A string $z$ with $xz\in L\not\ni yz$ (or the other way round) **distinguishes** $x$ and $y$. $\equiv_L$ is an equivalence relation on $\Sigma^*$ that is a *right congruence*: $x\equiv_L y\Rightarrow xa\equiv_L ya$. Its classes are the *Myhill–Nerode classes* of $L$.`,
      idea: String.raw`$x\equiv_L y$ says that, as far as $L$ is concerned, the prefixes $x$ and $y$ have the same future: any continuation that completes one into a member completes the other. A DFA can only remember a prefix through its state, so two prefixes that lead to the same state are necessarily indistinguishable; the converse direction is the content of 4.5. Reflexivity, symmetry and transitivity are inherited from "$\iff$"; the right-congruence property holds because $(xa)z=x(az)$.`,
      caption: String.raw`Choose a language and type two prefixes $x,y$. Each barcode lists all suffixes $z$ in shortlex order (one row per length, up to the bound) and colours the cell green when $xz\in L$. Cells where the two barcodes disagree are outlined red; the first of them in shortlex order is the **distinguishing suffix**. Identical barcodes mean $x\equiv_L y$ as far as the bound can tell — only a *bound*, because a longer distinguishing suffix might exist (for two states of a fixed complete $n$-state DFA a distinguishing suffix, when one exists, has length at most $n-1$).`,
      deps: ['toc-2.3'],
      refs: ['Pettorossi, Automata Theory and Formal Languages, §2.8 Theorem 2.8.4 pp. 59–61', 'Trevisan, Notes on State Minimization (2014), Definitions 1–2 and Lemma 3'],
      credit: 'Proof checked against Alberto Pettorossi, Automata Theory and Formal Languages; historical priority not asserted',
      scope: String.raw`The stated relation quantifies over all finite suffixes. The drawn barcodes use a finite bound and can only refute equivalence or report agreement within that bound. For a fixed complete $n$-state DFA, partition refinement ensures a distinguishing suffix of length at most $n-1$ when states differ; the pictured nonregular languages have no such finite universal DFA bound. Long prefixes are abbreviated with an ellipsis only in canvas labels; all membership calculations use the full input. Exact historical year/priority claims are omitted.`,
      tags: ['Myhill–Nerode', 'right congruence'],
      links: { 'Author textbook': 'https://cs.brown.edu/courses/csci1810/fall-2024/resources/ch2_readings/automata_theory_and_formal_languages.pdf', 'Author minimization proof': 'https://cs.stanford.edu/people/trevisan/cs103-14/lecture16.pdf' },
      viz(v) {
        const NAMES = ['ends01', 'mod3', 'div3', 'has011', 'third1', 'zn1n', 'pal', 'ww'];
        const DEF = { ends01: ['0', '1'], mod3: ['1', '0'], div3: ['1', '110'], has011: ['01', '0'], third1: ['100', '1000'], zn1n: ['000', '00'], pal: ['01', '0'], ww: ['01', '0'] };
        const langSel = v.select('language $L$', NAMES.map((k) => ({ value: k, label: LANGS[k].name })), 'ends01', { onChange: (k) => { xi.set(DEF[k][0]); yi.set(DEF[k][1]); } });
        const xi = v.input('$x$', '0', { width: 110 }), yi = v.input('$y$', '1', { width: 110 });
        const sS = v.slider('suffix bound', 3, 7, 5, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, full: true });
        let info = null;
        v.render(() => {
          const L = LANGS[langSel.value], x = xi.value.trim(), y = yi.value.trim(), S = sS.value;
          const okIn = /^[01]*$/.test(x) && /^[01]*$/.test(y), P = pen(s, v);
          if (!okIn) { P.sans('use only the letters 0 and 1', P.W / 2, 60, { size: 14, color: 'red', weight: 600 }); info = { bad: true }; return; }
          const z = sepSuffix(L.mem, BIN, x, y, S), nm = (u) => (u === '' ? 'ε' : u.length > 18 ? u.slice(0, 10) + '…' + u.slice(-6) : u);
          const half = (P.W - 60) / 2, rows = S + 1, rh = Math.min(30, (P.H - 112) / rows), top = 54;
          let diffs = 0, total = 0;
          for (const [col, u, X0] of [['blue', x, 20], ['orange', y, 40 + half]]) {
            P.sans(`xz ∈ L for z = …`.replace('xz', col === 'blue' ? 'xz' : 'yz'), X0, 18, { align: 'left', size: 12.5, weight: 700, color: col });
            P.text(`${col === 'blue' ? 'x' : 'y'} = ${nm(u)}`, X0 + half, 18, { align: 'right', size: 13, weight: 700, color: col });
            for (let k = 0; k <= S; k++) {
              const strs = upTo(BIN, k).filter((t) => t.length === k), bw = half / strs.length, yy = top + k * rh;
              strs.forEach((t, j) => {
                const a = L.mem(x + t), b = L.mem(y + t), me = col === 'blue' ? a : b, dif = a !== b;
                if (col === 'blue') { total++; if (dif) diffs++; }
                P.box(X0 + j * bw, yy + 2, Math.max(1, bw - (bw > 4 ? 1 : 0)), rh - 4, { r: bw > 7 ? 2 : 0, fill: me ? 'green' : 'faint', alpha: me ? 0.7 : 0.2, stroke: dif ? 'red' : false, width: 1.6 });
              });
            }
          }
          for (let k = 0; k <= S; k++) P.sans(`${k}`, 8, top + k * rh + rh / 2, { align: 'left', size: 9.5, color: 'faint' });
          const yb = top + rows * rh + 16;
          if (z != null) {
            P.sans(`distinguishing suffix z = ${nm(z)}:`, 20, yb, { align: 'left', size: 13, weight: 700 });
            P.text(`x z = ${nm(x + z)} ${L.mem(x + z) ? '∈' : '∉'} L        y z = ${nm(y + z)} ${L.mem(y + z) ? '∈' : '∉'} L`, 250, yb, { align: 'left', size: 12.5, color: 'red' });
          } else P.sans(`no suffix of length ≤ ${S} separates x and y`, 20, yb, { align: 'left', size: 13, weight: 700, color: 'green' });
          info = { z, diffs, total, x, y, S, same: x === y };
        });
        v.legend([['green', 'suffix z with (prefix)·z ∈ L', { dot: true }], ['red', 'the two prefixes disagree on z', { dot: true }]]);
        v.readout(() => {
          const I = info; if (I.bad) return '**use only 0 and 1**';
          if (I.z == null) return `$x\\equiv_L y$ **as far as suffixes of length $\\le${I.S}$ can tell** — all $${I.total}$ suffixes agree.`;
          return `$x\\not\\equiv_L y$: the shortest distinguishing suffix is $z=${I.z ? tex(I.z) : '\\varepsilon'}$, and the prefixes disagree on ${I.diffs} of the ${I.total} suffixes tested.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Myhill–Nerode theorem',
      statement: String.raw`For $L\subseteq\Sigma^*$ the following are equivalent:
(i) $L$ is regular;
(ii) $\equiv_L$ has **finitely many** classes (finite index);
(iii) $L$ is a union of classes of some right congruence of finite index.
Moreover the number of classes of $\equiv_L$ is exactly the number of states of the smallest DFA for $L$.`,
      idea: String.raw`(i)$\Rightarrow$(ii): if a DFA $M$ with $n$ states accepts $L$, then two strings that end in the same state are indistinguishable, so $\equiv_L$ has at most $n$ classes. (ii)$\Rightarrow$(i): take the classes themselves as states, $\delta([x],a)=[xa]$ (well defined by the right-congruence property of 4.4), start $[\varepsilon]$, accepting classes those inside $L$; induction on $|w|$ gives $\hat\delta([\varepsilon],w)=[w]$, so the machine accepts $w$ iff $w\in L$. (ii)$\Leftrightarrow$(iii) is the same argument in two directions.`,
      caption: String.raw`Choose a language. The prefixes of length $\le k$ are sorted into classes by their behaviour on all suffixes up to the bound $S$; the bar chart shows how many classes have appeared after prefixes of length $\le k$. For a **regular** language the count can reach the independently known minimal size, giving the true classes and DFA (right); for $0^n1^n$ a new class opens for every $n$. The slider $S$ shows the limit of the experiment: with too short suffixes, classes that differ only after a long suffix are merged and the count is a lower bound.`,
      deps: ['toc-4.4', 'toc-2.2'],
      refs: ['Pettorossi, Automata Theory and Formal Languages, §2.8 Theorem 2.8.4 and proof pp. 59–61', 'Trevisan, Notes on State Minimization (2014), pp. 1–3'],
      credit: 'Proof checked against Alberto Pettorossi, Automata Theory and Formal Languages; historical priority not asserted',
      scope: String.raw`All bounded signature counts are lower bounds. For the five displayed regular languages, the stated minimal size is independently checked from explicit complete DFAs; matching that known size certifies the observed classes. A graph of representative transitions from insufficient suffix tests need not be a quotient automaton for $L$. For the three nonregular languages, nonregularity follows from infinite distinguishable families: prefixes $0^n$ with suffixes $1^n$ for $0^n1^n$ and equal counts; prefixes $0^n1$ with suffixes $0^n$ for palindromes. The finite bar chart alone proves none of those infinite claims.`,
      tags: ['Myhill–Nerode', 'regular languages'],
      links: { 'Author textbook': 'https://cs.brown.edu/courses/csci1810/fall-2024/resources/ch2_readings/automata_theory_and_formal_languages.pdf', 'Author minimization proof': 'https://cs.stanford.edu/people/trevisan/cs103-14/lecture16.pdf' },
      viz(v) {
        const NAMES = ['ends01', 'mod3', 'div3', 'has011', 'third1', 'zn1n', 'eq', 'pal'];
        const langSel = v.select('language $L$', NAMES.map((k) => ({ value: k, label: LANGS[k].name })), 'ends01');
        const sS = v.slider('suffix bound $S$', 2, 8, 8, { int: true });
        const kS = v.slider('prefix length $k$', 1, 8, 5, { int: true });
        const bs = v.stage({ x: [-0.6, 8.8], y: [0, 20], axes: 'box', gutter: true, xlabel: 'longest prefix length $k$', ylabel: 'classes met', height: 300, weight: 1 });
        const gs = v.stage({ x: [0, 10], y: [0, 7], axes: false, equal: true, height: 300, weight: 1 });
        const cs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 145, full: true });
        const KMAX = 8;
        let cache = { key: '', val: null };
        const get = () => { const key = langSel.value + '|' + sS.value; if (cache.key !== key) cache = { key, val: classify(LANGS[langSel.value].mem, BIN, KMAX, sS.value) }; return cache.val; };
        const G = dfaGraph(v, gs, dfa(BIN, [['c0', 5, 3.5, 0]], 'c0', {}), {});
        let dinfo = null;
        v.render(() => {
          const C = get(), L = LANGS[langSel.value], k = kS.value, S = sS.value;
          const counts = C.counts, top = Math.max(6, ...counts) * 1.12;
          bs.setView([-0.6, 8.8], [0, top]);
          bs.bars(counts.map((c, i) => c), { x0: 0, dx: 1, color: (val, i) => (i > k ? 'faint' : i > 0 && counts[i] === counts[i - 1] ? 'green' : 'accent') });
          if (L.size) { bs.hline(L.size, { color: 'orange', dash: true, width: 1.6 }); bs.text(`minimal DFA: ${L.size} states`, -0.4, L.size + top * 0.05, { align: 'left', color: 'orange', size: 12 }); }
          bs.vline(k + 0.5, { color: 'gold', width: 1.4, dash: true });
          // classes among prefixes of length <= k
          const used = []; const seen = new Set();
          for (const x of upTo(BIN, k)) { const ci = C.of.get(x); if (!seen.has(ci)) { seen.add(ci); used.push(ci); } }
          // automaton on these classes
          const ids = used.map((ci) => 'c' + ci);
          const sufs = C.sufs, rel = {};
          const cls = used.map((ci) => C.classes[ci]);
          const small = cls.length <= 8;
          let unknown = 0;
          if (small) {
            const states = cls.map((c, i) => [ids[i], 0, 0, L.mem(c.rep), `$c_{${i}}$`]), delta = {};
            cls.forEach((c, i) => { delta[ids[i]] = {}; for (const a of BIN) { const t = C.idx.get(signature(L.mem, c.rep + a, sufs)); if (t != null && used.includes(t)) delta[ids[i]][a] = 'c' + t; else if (t != null) { delta[ids[i]][a] = null; unknown++; } else { delta[ids[i]][a] = null; unknown++; } } });
            const D = dfa(BIN, states, ids[0], delta);
            layoutBFS(D, 10, 7); G.sync(D);
            drawDFA(v, gs, G, D, { fill: (id) => (id === ids[0] ? 'gold' : null) });
          } else { gs.text('more than 8 classes —', 5, 4.1, { align: 'center', color: 'muted', size: 14 }); gs.text('finite display limit; no conclusion from this count alone', 5, 3.2, { align: 'center', color: 'red', size: 14, weight: 600 }); }
          dinfo = { small, unknown, n: cls.length };
          const P = pen(cs, v); let x = 12, y = 8;
          let shown = 0; P.sans(`classes of the prefixes of length ≤ ${k}   (representative: shortest, ε = empty)`, 12, 10, { align: 'left', size: 11.5, color: 'muted', weight: 600 }); y = 26;
          cls.forEach((c, i) => {
            const t = `c${i}: ${c.rep === '' ? 'ε' : c.rep}${c.members.length > 1 ? ` (+${c.members.filter((m) => m.length <= k).length - 1})` : ''}`, wpx = P.tw(t, 11.5) + 12;
            if (x + wpx > P.W - 8) { x = 12; y += 24; }
            if (y < P.H - 34) { shown++; P.box(x, y, wpx, 20, { r: 5, fill: L.mem(c.rep) ? 'green' : 'blue', alpha: 0.15, stroke: L.mem(c.rep) ? 'green' : 'blue' }); P.text(t, x + wpx / 2, y + 10, { size: 11.5 }); }
            x += wpx + 6;
          });
          P.sans(`${shown} of ${cls.length} representatives shown`, P.W - 10, P.H - 10, { align: 'right', size: 10.5, color: 'muted' });
        });
        v.legend([['accent', 'new class(es) appeared', { dot: true }], ['green', 'no new class (plateau)', { dot: true }], ['gold', 'class of ε (start)', { dot: true }]]);
        v.readout(() => {
          const C = get(), L = LANGS[langSel.value], k = kS.value, n = C.counts[k], last = C.counts[KMAX];
          const grow = C.counts.slice(1).map((c, i) => c - C.counts[i]);
          let tail = ''; if (L.reg) tail = last === L.size ? ` After $k=${KMAX}$ there are exactly ${last} bounded classes = the independently known ${L.size} true classes.` : ` ${last} classes found (minimal DFA has ${L.size}: raise $S$).`; else tail = ` At $k=${KMAX}$, ${last} bounded classes are visible (${grow.slice(-3).join(', ')} new per last step). The infinite distinguishable families in the scope prove nonregularity; finite growth alone does not.`;
          return `Prefixes of length $\\le${k}$ fall into **${n}** classes.${tail}${dinfo.small ? (dinfo.unknown ? ` ${dinfo.unknown} arrows lead outside the classes seen so far.` : (L.reg && last === L.size && n === L.size ? ' All true classes are present and representative transitions give the minimal DFA.' : ' Representative arrows close in this finite signature graph; this alone does not certify a quotient DFA for L.')) : ''}`;
        });
      },
    },
  ],
};
