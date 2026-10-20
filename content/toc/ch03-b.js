import { positionNet, netTrace, netAutomaton, regexDifference, shortestRejected } from './automata.audit.js';
// Theory of Computation — Chapter 3: Nondeterminism and regular expressions (items 3.9–3.16; 3.1–3.8 in ch03.js)
import { subN, EPS, layer, upTo, pen, keypad, nfa, closure, move, hasAcc, nfaRun, nfaAccepts, determinize, dfaAccepts, nfaLang, eqSets, firstDiff, nfaGraph, drawNFA, bendEdges, fitThompson, nfaEdges, dfaEdges, NFAS, PRESETS, R, parseRegex, rx, rxTeX, rxSize, countParts, langSets, langFlat, thompson, nfaToRegex, rxInput, drawLangRows, tt, texName3, setTex, drawBarcode, symbolsOf, onColor, asNFA, deriv, nullable, sAlt, sCat, sStar, key, catAll, altAll, backtrack, nfaWork, tryParse } from './ch03.shared.js';

const AB = ['a', 'b'];
const cut = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
const lcat = (P, Q, n) => { const out = Array.from({ length: n + 1 }, () => new Set()); for (let i = 0; i <= n; i++) for (let j = 0; i + j <= n; j++) for (const u of P[i]) for (const w of Q[j]) out[i + j].add(u + w); return out; };
const lunion = (P, Q) => P.map((S, k) => new Set([...S, ...Q[k]]));

export default {
  collection: 'toc',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Kleene’s theorem',
      statement: String.raw`For a language $L\subseteq\Sigma^*$ the following are equivalent: (i) $L=L(M)$ for a DFA $M$ (i.e. $L$ is regular); (ii) $L=L(N)$ for an NFA $N$ (with or without ε-arrows); (iii) $L=L(r)$ for a regular expression $r$. The three conversions are: regular expression → NFA by Thompson's construction (3.7), NFA → DFA by the subset construction (3.3), and DFA → regular expression by state elimination (3.8); a DFA is an NFA, which closes the circle.`,
      idea: String.raw`Going around the triangle once proves the whole equivalence: every regular expression is an NFA (induction on the syntax tree, using closure under the regular operations, 3.5), every NFA is a DFA (induction on the length of the input, 3.3), and every DFA is a regular expression (path labels through a state graph, summed up by eliminating states, 3.8). Nothing can be lost on the way because each step preserves the language; only the *size* changes, with a possible exponential blow-up at the subset step (3.4) and a possible exponential blow-up at the elimination step.`,
      caption: String.raw`Choose where to **start** — a regular expression, an NFA or a DFA — and the other two representations are computed by the three converters, going around the triangle (the gold box is your input; the arrow that returns to its kind produces a second copy). Under each box is the **barcode of its language**: every string up to the chosen length, green if accepted. The arrows turn red if a converter's output differs from your input's language, with the first string where they differ. Switch on **sabotage** to build Thompson's automaton without the back-arc of the star, and watch the check fail.`,
      deps: ['toc-3.7', 'toc-3.8', 'toc-3.3'],
      refs: ['Sipser §1.3'],
      credit: 'Kleene, 1951 (RAND report), 1956',
      tags: ['regular languages', 'regular expressions'],
      viz(v) {
        const NFA_P = { n1: () => NFAS.secondA(), n2: () => NFAS.aaOrBb(), n3: () => NFAS.endsAB() };
        const DFA_P = { d1: () => asNFA(PRESETS.evenA()), d2: () => asNFA(PRESETS.endsAB()), d3: () => asNFA(PRESETS.aMod3()) };
        const kind = v.select('start from', [{ value: 'R', label: 'a regular expression' }, { value: 'N', label: 'an NFA' }, { value: 'D', label: 'a DFA' }], 'R', { onChange: (k) => { nS.el.hidden = k !== 'N'; dS.el.hidden = k !== 'D'; } });
        const RI = rxInput(v, { label: 'expression', value: '(a|b)*abb', presets: [['(a|b)*abb', '(a|b)*abb'], ['a*b|ba*', 'a*b|ba*'], ['(ab)*', '(ab)*'], ['(a|ba)*', '(a|ba)*']] });
        const nS = v.select('NFA', [{ value: 'n1', label: '2nd from end is a' }, { value: 'n2', label: 'contains aa or bb' }, { value: 'n3', label: 'ends in ab' }], 'n1'); nS.el.hidden = true;
        const dS = v.select('DFA', [{ value: 'd1', label: 'even number of a' }, { value: 'd2', label: 'ends in ab' }, { value: 'd3', label: '# of a divisible by 3' }], 'd1'); dS.el.hidden = true;
        const sab = v.toggle('sabotage Thompson (drop the back-arc of every star)', false);
        const nL = v.slider('strings up to length', 3, 7, 6, { int: true });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 470, full: true });
        const KN = { R: 'regular expression', N: 'NFA', D: 'DFA' }, NEXT = { R: 'N', N: 'D', D: 'R' }, CONV = { R: 'Thompson (3.7)', N: 'subset construction (3.3)', D: 'state elimination (3.8)' };
        const thom = (r) => { const T = thompson(r, AB); const N = T.N; if (sab.value) for (const k of Object.keys(N.flag)) if (N.flag[k].kind === 'loop') { const [a, b] = k.split('>'); N.eps[a] = N.eps[a].filter((x) => x !== b); } return N; };
        const info = (k, o) => (k === 'R' ? { head: cut(rx(o).replace(/∪/g, '|'), 34), foot: `size ${rxSize(o)}` } : { head: `${o.states.length} states`, foot: k === 'N' ? `${nfaEdges(o).length} arrow groups` : 'deterministic' });
        const setOf = (k, o, n) => (k === 'R' ? langFlat(o, n) : nfaLang(o, n));
        let cache = { key: '', val: null };
        function chain() {
          const k0 = kind.value, ky = [k0, RI.inp.value, nS.value, dS.value, sab.value].join('|');
          if (cache.key === ky) return cache.val;
          let src;
          if (k0 === 'R') { const res = RI.cur(); if (res.error) return { error: res.error }; if (![...symbolsOf(res.ast)].every((c) => AB.includes(c))) return { error: 'use only the letters a and b here' }; src = res.ast; }
          else src = k0 === 'N' ? NFA_P[nS.value]() : DFA_P[dS.value]();
          const reps = [src]; let k = k0;
          for (let i = 0; i < 3; i++) {
            const cur = reps[i];
            let nx;
            if (k === 'R') nx = thom(cur); else if (k === 'N') nx = determinize(cur); else nx = nfaToRegex(asNFA(cur));
            reps.push(nx); k = NEXT[k];
          }
          cache = { key: ky, val: { k0, reps, kinds: [k0, NEXT[k0], NEXT[NEXT[k0]], k0] } };
          return cache.val;
        }
        v.render(() => {
          const P = pen(s, v), C = chain(), n = nL.value;
          if (C.error) { P.sans(C.error, P.W / 2, P.H / 2, { size: 14, color: 'red', weight: 600 }); return; }
          const truth = setOf(C.k0, C.reps[0], n);
          const pos = { R: [P.W / 2, 78], N: [P.W * 0.19, P.H - 150], D: [P.W * 0.81, P.H - 150] };
          const bw = Math.min(280, P.W * 0.34), bh = 122;
          const diffs = [];
          // arrows first
          for (let i = 0; i < 3; i++) {
            const a = C.kinds[i], b = C.kinds[i + 1], out = setOf(b, C.reps[i + 1], n), ok = eqSets(out, truth), fd = ok ? null : firstDiff(out, truth);
            diffs.push({ i, a, b, ok, fd });
            let [x1, y1] = pos[a], [x2, y2] = pos[b]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
            const t0 = Math.min(0.5, (bh / 2 + 12) / L / (Math.abs(dy) > Math.abs(dx) * 0.5 ? 1 : 0.62)), p1 = [x1 + dx * 0.26, y1 + dy * 0.26 + (a === 'D' ? 0 : 0)], p2 = [x1 + dx * 0.74, y1 + dy * 0.74];
            const sx = a === 'R' ? 40 : a === 'N' ? 0 : -40;
            const col = ok ? 'green' : 'red', A = [x1 + dx * 0.3 + (a === 'N' ? 0 : 0), y1 + dy * 0.3], B = [x1 + dx * 0.7, y1 + dy * 0.7];
            const ax = a === 'N' ? [pos.N[0] + bw / 2 + 8, pos.N[1]] : a === 'D' ? [pos.D[0] - bw / 2 - 8, pos.D[1]] : null;
            if (a === 'N') P.arrow(pos.N[0] + bw / 2 + 6, pos.N[1], pos.D[0] - bw / 2 - 6, pos.D[1], { color: col, width: 3 });
            else if (a === 'D') P.arrow(pos.D[0] - bw / 4, pos.D[1] - bh / 2 - 6, pos.R[0] + bw / 4, pos.R[1] + bh / 2 + 6, { color: col, width: 3 });
            else P.arrow(pos.R[0] - bw / 4, pos.R[1] + bh / 2 + 6, pos.N[0] + bw / 4, pos.N[1] - bh / 2 - 6, { color: col, width: 3 });
            const mx = a === 'N' ? (pos.N[0] + pos.D[0]) / 2 : a === 'D' ? (pos.D[0] + pos.R[0]) / 2 : (pos.R[0] + pos.N[0]) / 2, my = a === 'N' ? pos.N[1] : (pos.R[1] + pos.N[1]) / 2;
            const al = a === 'N' ? 'center' : a === 'D' ? 'left' : 'right', lx = a === 'N' ? mx : a === 'D' ? mx + 16 : mx - 16, ly = a === 'N' ? my - 34 : my - 10;
            const out2 = info(b, C.reps[i + 1]), tail = i === 2 ? `round trip: ${out2.foot.startsWith('size') ? out2.foot : out2.head}` : out2.head;
            P.sans(CONV[a], lx, ly, { size: 12.5, weight: 600, color: col, halo: true, align: al });
            P.sans(ok ? `✓ same language · ${tail}` : `✗ differs at ${fd === '' ? 'ε' : fd}`, lx, ly + 18, { size: 11.5, color: ok ? 'muted' : 'red', halo: true, align: al });
          }
          // boxes (representation shown = first appearance of each kind)
          for (const k of ['R', 'N', 'D']) {
            const idx = C.kinds.indexOf(k), o = C.reps[idx], [cx, cy] = pos[k], src = idx === 0, I = info(k, o);
            P.box(cx - bw / 2, cy - bh / 2, bw, bh, { r: 8, fill: src ? 'gold' : 'panel', alpha: src ? 0.14 : 1, stroke: src ? 'gold' : 'muted', width: src ? 2.4 : 1.4 });
            P.sans(KN[k] + (src ? '  (your input)' : ''), cx - bw / 2 + 10, cy - bh / 2 + 14, { align: 'left', size: 12, weight: 700, color: src ? 'gold' : 'muted' });
            P.text(I.head, cx - bw / 2 + 10, cy - bh / 2 + 34, { align: 'left', size: 12.5 });
            P.sans(I.foot, cx + bw / 2 - 10, cy - bh / 2 + 14, { align: 'right', size: 11, color: 'muted' });
            const S = setOf(k, o, n), rows = n + 1, rh = (bh - 52) / rows, L0 = cx - bw / 2 + 10, L1 = cx + bw / 2 - 10;
            for (let l = 0; l <= n; l++) {
              const strs = layer(AB, l), bwc = (L1 - L0) / strs.length, y = cy - bh / 2 + 46 + l * rh;
              strs.forEach((u, j) => { const hit = S.has(u), mis = hit !== truth.has(u); P.box(L0 + j * bwc, y, Math.max(0.8, bwc - (bwc > 3 ? 0.8 : 0)), Math.max(1, rh - 1.2), { r: 0, fill: mis ? 'red' : hit ? 'green' : 'faint', alpha: hit || mis ? 0.8 : 0.3, stroke: false }); });
            }
          }
          P.sans(`one barcode row per length 0…${n}; ${truth.size} strings of length ≤ ${n} in the language`, P.W / 2, P.H - 14, { size: 11.5, color: 'muted' });
        });
        v.legend([['gold', 'your input', { dot: true }], ['green', 'string accepted', { dot: true }], ['red', 'string on which a converter is wrong', { dot: true }]]);
        v.readout(() => {
          const C = chain(); if (C.error) return `**${C.error}**`;
          const n = nL.value, truth = setOf(C.k0, C.reps[0], n), outs = [1, 2, 3].map((i) => eqSets(setOf(C.kinds[i], C.reps[i], n), truth));
          const names = [1, 2, 3].map((i) => `${KN[C.kinds[i - 1]]} → ${KN[C.kinds[i]]}`);
          return names.map((t, i) => `${t} ${outs[i] ? '✓' : '✗'}`).join(' · ') + ` · all ${(2 ** (n + 1)) - 1} strings of length ≤ ${n} compared`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Arden’s lemma',
      statement: String.raw`For arbitrary languages $A,B\subseteq\Sigma^*$, the equation $X=AX\cup B$ has least solution $A^*B$. If $\varepsilon\notin A$, that solution is unique. If $\varepsilon\in A$, its solutions are exactly $X=A^*C$ for languages $C$ containing $B$. Uniqueness can still occur when $A^*B=\Sigma^*$; otherwise there are at least two solutions, but not necessarily infinitely many. For example, $A=\{\varepsilon\}$ and $B=\Sigma^*\setminus\{\varepsilon\}$ give exactly two solutions, $B$ and $\Sigma^*$.`,
      idea: String.raw`Every solution satisfies $X=\bigcup_{j<k}A^jB\cup A^kX$ for each $k\ge1$, so it contains $A^*B$. The increasing iterates from the empty language converge to this least solution. Without $\varepsilon$ in $A$, every word in $A^kX$ has length at least $k$, which forces equality with the least solution by considering each fixed word length. With $\varepsilon\in A$, one has $AA^*=A^*$, so any $A^*C$ with $B\subseteq C$ is a solution. Conversely a solution is closed under left multiplication by $A$ and equals $A^*X$, giving the stated characterization.

Ordinary induction alg-2.1 justifies the repeated substitution formula for each positive k: substitute $X=AX\cup B$ once more into the last term to extend the finite union by one term. When $\varepsilon\notin A$, every factor from A has positive length. For a fixed word of length m choose $k=m+1$; it cannot belong to $A^kX$, so any occurrence in a solution must lie in one of the finite-union terms. This is the length argument establishing uniqueness.`,
      caption: String.raw`Type $A$ and $B$ (regular expressions over $a,b$). **Left:** the approximations $X_0=\varnothing$, $X_1=B$, $X_2=AB\cup B,\dots$ as a barcode of all strings up to length 7 — new strings of the latest layer in gold, earlier ones blue; the faint outline marks the strings of the limit $A^*B$ not yet reached. **Right:** a candidate solution $X$ (choose $A^*B$, or the larger $A^*(B\cup\{c\})$ for a string $c$ outside $A^*B$) and, beside it, $AX\cup B$ computed from it; strings where the two sides differ are red. Put $\varepsilon$ into $A$ (e.g. $A=a\mid\varepsilon$) and the larger candidate becomes a genuine second solution; without ε it fails.`,
      deps: ['toc-3.6', 'alg-2.1'],
      refs: ['Alberto Pettorossi, Automata Theory and Formal Languages, §2.6 Theorem 2.6.1 and proof, pp. 56–57'],
      credit: 'Arden language-equation lemma; proof checked in Pettorossi §2.6 (original chronological priority not asserted)',
      scope: String.raw`The grid exhausts only words of length at most 7. Truncation computes those coefficients of concatenation exactly, but agreement on that grid does not imply a global equation or universality. The extra word $c$ is found by a whole-automaton search; it may be longer than the grid. Interactive expressions have combined syntax size at most 120; this is a display limit, not a theorem hypothesis. A separate full subset-product check tests the candidate equation and reports any computation cap as unknown. The arbitrary-language theorem follows from the proof, not finite sampling.`,
      links: { 'Author textbook': 'https://cs.brown.edu/courses/csci1810/fall-2024/resources/ch2_readings/automata_theory_and_formal_languages.pdf' },
      tags: ['regular expressions', 'equations'],
      viz(v) {
        const N = 7, K = 8;
        const IA = rxInput(v, { label: 'A', value: 'ab|b', width: 150, buttons: true });
        const IB = rxInput(v, { label: 'B', value: 'a', width: 150, buttons: false });
        const kS = v.slider('iteration $k$', 0, K, 3, { int: true });
        const cand = v.select('candidate solution X', [{ value: 'least', label: 'A*B' }, { value: 'big', label: 'A*(B ∪ {c})' }], 'least');
        const ls = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, weight: 1 });
        const rs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, weight: 1.15 });
        let K0 = '', D = null;
        const compute = () => {
          const a = IA.cur(), b = IB.cur(); const ky = JSON.stringify([IA.inp.value, IB.inp.value]); if (ky === K0) return D;
          K0 = ky;
          if (a.error || b.error) return (D = { error: a.error ? 'A: ' + a.error : 'B: ' + b.error });
          const bad = [...symbolsOf(a.ast), ...symbolsOf(b.ast)].find((c) => !AB.includes(c)); if (bad) return (D = { error: 'use only the letters a and b' });
          if (rxSize(a.ast) + rxSize(b.ast) > 120) return (D = { error: 'Interactive limit: use expressions with combined syntax size at most 120.' });
          const LA = langSets(a.ast, N), LB = langSets(b.ast, N), limit = langSets(R.cat(R.star(a.ast), b.ast), N);
          const X = [Array.from({ length: N + 1 }, () => new Set())]; for (let k = 0; k < K; k++) X.push(lunion(lcat(LA, X[k], N), LB));
          const leastAst = R.cat(R.star(a.ast), b.ast), reject = shortestRejected(leastAst, AB), c = reject.word;
          const LAs = langSets(R.star(a.ast), N), big = c == null ? null : lcat(LAs, lunion(LB, Array.from({ length: N + 1 }, (_, k) => new Set(k === c.length ? [c] : []))), N);
          const wordAst = c == null ? null : [...c].reduce((r, ch) => R.cat(r, R.sym(ch)), R.eps), bigAst = wordAst && R.cat(R.star(a.ast), R.alt(b.ast, wordAst));
          const equation = ast => regexDifference(thompson(ast).N, R.alt(R.cat(a.ast, ast), b.ast));
          const equations = { least: equation(leastAst), big: bigAst ? equation(bigAst) : null };
          return (D = { LA, LB, limit, X, c, big, reject, equations, leastAst, bigAst, eps: nullable(a.ast), a: a.ast, b: b.ast });
        };
        v.render(() => {
          const P = pen(ls, v), Q = pen(rs, v), M = compute();
          if (M.error) { P.sans(M.error, P.W / 2, P.H / 2, { size: 14, color: 'red', weight: 600 }); return; }
          const k = kS.value, Xk = M.X[k], Xp = k > 0 ? M.X[k - 1] : null;
          P.sans(`X${subN(k)} = ` + (k === 0 ? '∅' : `A·X${subN(k - 1)} ∪ B`), 10, 12, { align: 'left', size: 11.5, weight: 600, color: 'muted' });
          const P1 = { ...P }; // barcode under the heading
          const rows = N + 1, rh = (P.H - 28) / rows, L0 = 50, L1 = P.W - 56;
          for (let l = 0; l <= N; l++) {
            const strs = layer(AB, l), bw = (L1 - L0) / strs.length, y = 22 + l * rh; let hits = 0;
            P.sans(`n = ${l}`, 8, y + rh / 2, { align: 'left', size: 10, color: 'muted' });
            strs.forEach((u, j) => { const inK = Xk[l].has(u), old = Xp && Xp[l].has(u), inL = M.limit[l].has(u); if (inK) hits++; P.box(L0 + j * bw, y + 1.5, Math.max(1, bw - (bw > 3 ? 1 : 0)), rh - 3, { r: 0, fill: inK ? (old ? 'blue' : 'gold') : 'faint', alpha: inK ? 0.8 : 0.2, stroke: inL && !inK ? 'green' : false, width: 1.2, strokeAlpha: 0.9 }); });
            P.text(`${hits}/${M.limit[l].size}`, P.W - 8, y + rh / 2, { align: 'right', size: 10.5, weight: 600, color: 'muted' });
          }
          // candidate check
          const Xc = cand.value === 'big' && M.big ? M.big : M.limit, rhs = lunion(lcat(M.LA, Xc, N), M.LB);
          Q.sans(cand.value === 'big' && M.big ? `X = A*(B ∪ {${M.c === '' ? 'ε' : M.c}})   |   A·X ∪ B` : 'X = A*B   |   A·X ∪ B', 10, 12, { align: 'left', size: 11.5, weight: 600, color: 'muted' });
          const mid = (Q.W - 8) / 2, LL = 46;
          for (let l = 0; l <= N; l++) {
            const strs = layer(AB, l), bw = (mid - 20 - LL) / strs.length, y = 22 + l * rh;
            Q.sans(`n = ${l}`, 8, y + rh / 2, { align: 'left', size: 10, color: 'muted' });
            strs.forEach((u, j) => {
              const x1 = Xc[l].has(u), x2 = rhs[l].has(u), bad = x1 !== x2;
              Q.box(LL + j * bw, y + 1.5, Math.max(1, bw - (bw > 3 ? 1 : 0)), rh - 3, { r: 0, fill: x1 ? 'green' : 'faint', alpha: x1 ? 0.75 : 0.2, stroke: bad ? 'red' : false, width: 1.6 });
              Q.box(mid + 12 + LL * 0 + j * bw, y + 1.5, Math.max(1, bw - (bw > 3 ? 1 : 0)), rh - 3, { r: 0, fill: bad ? 'red' : x2 ? 'green' : 'faint', alpha: bad ? 0.9 : x2 ? 0.75 : 0.2, stroke: false });
            });
          }
        });
        v.legend([['gold', 'new in $X_k$', { dot: true }], ['blue', 'already in $X_{k-1}$', { dot: true }], ['green', 'in $A^*B$ / candidate', { dot: true }], ['red', 'the two sides differ', { dot: true }]]);
        v.readout(() => {
          const M = compute(); if (M.error) return `**${M.error}**`;
          const k = kS.value, same = M.limit.every((S, l) => S.size === M.X[K][l].size && [...S].every((u) => M.X[K][l].has(u)));
          const Xc = cand.value === 'big' && M.big ? M.big : M.limit, rhs = lunion(lcat(M.LA, Xc, N), M.LB);
          let viol = 0, first = null; for (let l = 0; l <= N; l++) for (const u of layer(AB, l)) if (Xc[l].has(u) !== rhs[l].has(u)) { viol++; first = first ?? u; }
          const cnt = M.X[k].reduce((a, S) => a + S.size, 0), tot = M.limit.reduce((a, S) => a + S.size, 0);
          let s = `$\\varepsilon\\in A$: **${M.eps ? 'yes' : 'no'}** · $X_{${k}}$ has ${cnt} of the ${tot} strings of $A^*B$ (length ≤ 7) · $X_{${K}}=A^*B$ on these lengths: ${same ? '✓' : '✗'}`;
          const exact = M.equations[cand.value === 'big' && M.big ? 'big' : 'least'];
          s += ` · length-7 equation differences: ${viol}`;
          if (cand.value === 'big' && !M.big) s += M.reject.universal ? ' · no larger solution: the full automaton accepts every word' : ' · no extra word available before the search cap; universality unknown';
          else s += ` · whole-language equation: ${exact.equal === null ? 'unknown (resource cap)' : exact.equal ? 'holds ✓' : `fails, witness $${tt(exact.witness)}$`}`;
          if (M.c != null && M.c.length > N) s += ` · extra word c has length ${M.c.length}, beyond the grid`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Method',
      name: 'Brzozowski derivatives of regular expressions',
      statement: String.raw`The **derivative** of a language $L$ with respect to a symbol $a$ is $a^{-1}L=\{w: aw\in L\}$. For regular expressions it is computed syntactically: $\partial_a\varnothing=\partial_a\varepsilon=\varnothing$; $\partial_a a=\varepsilon$, $\partial_a b=\varnothing$ ($b\ne a$); $\partial_a(r\cup s)=\partial_a r\cup\partial_a s$; $\partial_a(r^*)=(\partial_a r)\,r^*$; $\partial_a(rs)=(\partial_a r)\,s$ if $\varepsilon\notin L(r)$ and $(\partial_a r)\,s\cup\partial_a s$ otherwise. Then $L(\partial_a r)=a^{-1}L(r)$, and $w\in L(r)$ iff $\varepsilon\in L(\partial_{w_n}\cdots\partial_{w_1}r)$, which is decided by the syntactic test "is the expression nullable". If expressions are identified up to associativity, commutativity and idempotence of $\cup$ (and the rules for $\varnothing,\varepsilon$), a regular expression has only finitely many distinct derivatives, and these are the states of a DFA for $L(r)$.`,
      idea: String.raw`Reading a symbol $a$ turns the question "is $aw\in L$?" into "is $w\in a^{-1}L$?", so matching is rewriting the expression one symbol at a time; the Myhill–Nerode classes (4.4) are the languages $x^{-1}L$ and the derivatives name them by expressions. Without simplification the expressions grow without bound and every new string produces a new one; the similarity rules (flatten, sort and deduplicate unions, drop $\varnothing$ and $\varepsilon$ factors, collapse $r^{**}$) keep the number of distinct derivatives finite.`,
      caption: String.raw`Type an expression and a string with the keys. The left column rewrites the expression one symbol at a time (each row is the derivative of the row above); the string is in the language exactly when the last row is **nullable** (contains $\varepsilon$ in its language). The right picture is the **automaton of derivatives**: every distinct derivative reached by any string is a state (nullable ones are accepting), and your string walks through it. Switch **similarity simplification** off: the derivatives are no longer identified and the state set never closes up — it is cut off at 14 states.`,
      deps: ['toc-3.6'],
      refs: ['Sipser §1.3'],
      credit: 'Brzozowski, 1964',
      tags: ['regular expressions', 'matching'],
      viz(v) {
        let w = 'abb', built = '';
        const RI = rxInput(v, { value: '(a|b)*abb', presets: [['(a|b)*abb', '(a|b)*abb'], ['a*b*', 'a*b*'], ['(ab)*', '(ab)*'], ['(a|b)*a(a|b)', '(a|b)*a(a|b)'], ['(a*b)*', '(a*b)*']], onPick: () => { S.reset({ at: 'end' }); } });
        const simp = v.toggle('similarity simplification', true, { onChange: () => S.reset({ at: 'end' }) });
        keypad(v, AB, () => w, (x) => { w = x; S.reset({ at: 'end' }); }, { max: 9 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1 });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 330, weight: 1.15 });
        const G = v.graph(gs, { nodes: [], edges: [], layout: 'none', directed: true, shape: 'box', draggable: true, edgeFontSize: 11.5, fontSize: 11.5 });
        let A = null; // automaton of derivatives
        const explore = (ast, sm, cap = 14) => {
          const nodes = [], by = new Map(), edges = [], q = []; let closed = true;
          const add = (e) => { const k = key(e); if (by.has(k)) return by.get(k); if (nodes.length >= cap) { closed = false; return null; } const nd = { id: 'e' + nodes.length, e, label: cut(rx(e), 15) }; nodes.push(nd); by.set(k, nd); q.push(nd); return nd; };
          add(ast);
          for (let h = 0; h < q.length; h++) for (const c of AB) { const d = deriv(q[h].e, c, sm), t = add(d); if (t) edges.push({ from: q[h].id, to: t.id, c, directed: true }); else closed = false; }
          const merged = new Map(); for (const e of edges) { const k = e.from + '>' + e.to; if (!merged.has(k)) merged.set(k, { from: e.from, to: e.to, syms: [], directed: true }); merged.get(k).syms.push(e.c); }
          const E = [...merged.values()]; E.forEach((e) => { e.label = e.syms.join(', '); });
          return { nodes, edges: E, by, closed };
        };
        const frames = () => {
          const res = RI.cur(); if (res.error) return [{ note: res.error, ex: [] }];
          const ex = [res.ast]; const out = [{ k: 0, ex: ex.slice(), note: `Start with $r=${rxTeX(res.ast)}$.` }];
          for (let k = 1; k <= w.length; k++) { const d = deriv(ex[k - 1], w[k - 1], simp.value); ex.push(d); out.push({ k, ex: ex.slice(), note: `Differentiate by **${w[k - 1]}**: $\\partial_{${w[k - 1]}}\\,(${rxTeX(ex[k - 1])})=${rxTeX(d)}$.` }); }
          const last = out[out.length - 1], nl = nullable(ex[ex.length - 1]);
          last.note += ` ${nl ? 'Nullable: $\\varepsilon\\in L$, so **accept**.' : 'Not nullable: **reject**.'}`; last.final = true; last.acc = nl;
          return out;
        };
        const S = v.steps({ frames, speed: 1.2, still: 99 });
        v.render(() => {
          const res = RI.cur(), P = pen(ts, v), f = S.frame;
          if (res.error) { P.sans(res.error, P.W / 2, P.H / 2, { size: 14, color: 'red', weight: 600 }); return; }
          const ky = RI.inp.value + simp.value;
          if (built !== ky) { built = ky; A = explore(res.ast, simp.value); G.set({ nodes: A.nodes, edges: A.edges }); G.layout('layered', { rankdir: 'right' }); const xs = A.nodes.map((nd) => nd.x), lo = Math.min(...xs), hi = Math.max(...xs); A.nodes.forEach((nd) => { nd.x = hi > lo ? 1.6 + ((nd.x - lo) / (hi - lo)) * 6.6 : 5; }); }
          const ex = f.ex ?? [res.ast], rh = Math.min(30, (P.H - 24) / Math.max(w.length + 1, 1));
          ex.forEach((e, i) => {
            const y = 20 + i * rh + rh / 2, cur = i === ex.length - 1;
            P.tex(i === 0 ? 'r' : `\\partial_{${w[i - 1]}}`, 20, y, { size: 13, color: cur ? 'gold' : 'muted' });
            const t = cut(rx(e), Math.max(8, Math.floor((P.W - 90) / 8.2)));
            P.text(t, 40, y, { align: 'left', size: 12.5, weight: cur ? 700 : 500, color: cur ? 'ink' : 'muted' });
            if (nullable(e)) P.text('ε∈L', P.W - 10, y, { align: 'right', size: 11, weight: 700, color: cur && f.final ? 'green' : 'faint' });
          });
          // automaton of derivatives
          const cur = ex.length ? A.by.get(key(ex[ex.length - 1])) : null;
          let on = null; const sims = [];
          G.draw({
            nodeLabel: (id, nd) => nd.label, nodeRing: (id) => (nullable(A.nodes.find((n) => n.id === id).e) ? 'ink' : null),
            nodeFill: (id) => (cur && id === cur.id ? (f.final ? (f.acc ? 'green' : 'red') : 'gold') : null),
            labelColor: (id) => (cur && id === cur.id ? onColor(v, f.final ? (f.acc ? 'green' : 'red') : 'gold') : null),
            edgeLabel: (e) => e.label,
          });
          const n0 = A.nodes[0] && G.node('e0'); if (n0 && isFinite(n0.x)) { const px = gs.X(n0.x), py = gs.Y(n0.y); gs.arrow(gs.invX(px - 78), gs.invY(py), gs.invX(px - 50), gs.invY(py), { color: 'ink', width: 2, head: 8 }); }
          gs.corner(A.closed ? `derivative automaton: ${A.nodes.length} states` : `derivatives never close up (cut at ${A.nodes.length} states)`, 'tl', { size: 12, color: A.closed ? 'muted' : 'red', weight: 600 });
        });
        v.legend([['gold', 'derivative reached by your string', { dot: true }], ['ink', 'double ring: nullable, accepting']]);
        v.readout(() => {
          const res = RI.cur(); if (res.error) return `**${res.error}**`;
          let e = res.ast; for (const c of w) e = deriv(e, c, simp.value);
          const T = thompson(res.ast, AB).N, ref = nfaAccepts(T, w), mine = nullable(e);
          return `$w=${tt(w)}$: final expression $${rxTeX(e)}$ is ${mine ? 'nullable → **accept**' : 'not nullable → **reject**'} · the NFA of 3.7 says ${ref ? 'accept' : 'reject'} ${ref === mine ? '✓' : '✗'} · ${A.closed ? `**${A.nodes.length}** distinct derivatives in all (a ${A.nodes.length}-state DFA)` : 'the set of derivatives is not closing up'} · expression size ${rxSize(e)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Algorithm',
      name: 'Backtracking versus NFA simulation in regex matching',
      statement: String.raw`Two ways to decide $w\in L(r)$: **backtracking** tries the choices of the expression one after the other, depth first, and returns to the last choice when a try fails; **NFA simulation** keeps the *set* of live states of Thompson's automaton (3.7) and advances the whole set per input symbol, taking $O(|r|\cdot|w|)$ time. Backtracking is correct but can take time **exponential** in $|w|$ on expressions such as $(a\mid aa)^*b$ against $a^n$ or $(a?)^na^n$ against $a^n$ (each of the many ways of splitting the input is tried before the engine gives up); simulation has no such worst case.`,
      idea: String.raw`A failing match of $(a\mid aa)^*b$ on $a^n$ must discover that no way of writing $a^n$ as a product of $a$'s and $aa$'s is followed by $b$; the number of such ways is the Fibonacci number $F_{n+1}$, and a backtracking engine enumerates them all, so its step count is multiplied by the golden ratio $\varphi\approx1.618$ per extra symbol. The simulation instead notices that after each prefix only the *set* of reachable states matters, and there are at most $|Q|$ states, so merging the paths that reach the same state removes the repetition; this is the subset construction (3.3) run lazily on one string.`,
      caption: String.raw`Pick a pattern and slide $n$ (the input is $a^n$): the left chart shows the **step counts** of the two methods on a log axis for every $n$, computed by actually running a backtracking matcher on the syntax tree (red; stopped after $2\cdot10^6$ steps) and an NFA state-set simulation (blue). The right picture is the simulation itself: one column per input position, the live NFA states lit — a band of constant width, never more than the number of states.`,
      deps: ['toc-3.7'],
      refs: ['Sipser §1.3'],
      credit: 'Thompson, 1968; the comparison as popularised by R. Cox, 2007',
      scope: String.raw`Cox's 2007 article reports that Perl needed over a minute for the pattern $(a?)^{29}a^{29}$ on $a^{29}$ while a Thompson-style NFA simulation took about twenty microseconds. Those are his measurements on his machine and engine versions of the time; the step counts below are those of the simple backtracking matcher written for this page, not of any particular regex engine. Real engines add memoisation or switch to automata for some patterns.`,
      tags: ['regular expressions', 'complexity'],
      viz(v) {
        const PAT = {
          fib: { name: '(a|aa)*b', nmax: 32, ast: () => R.cat(R.star(R.alt(R.sym('a'), R.cat(R.sym('a'), R.sym('a')))), R.sym('b')), tex: String.raw`(a\mid aa)^*b` },
          cox: { name: '(a?)ⁿ aⁿ', nmax: 20, ast: (n) => catAll([...Array.from({ length: n }, () => R.alt(R.sym('a'), R.eps)), ...Array.from({ length: n }, () => R.sym('a'))]), tex: String.raw`(a?)^{n}a^{n}`, grows: true, match: true },
          nest: { name: '(a*)*b', nmax: 24, ast: () => R.cat(R.star(R.star(R.sym('a'))), R.sym('b')), tex: String.raw`(a^*)^*b` },
        };
        let pat = 'fib';
        const pS = v.select('pattern', Object.entries(PAT).map(([k, p]) => ({ value: k, label: p.name })), 'fib', { onChange: (k) => { pat = k; nS.set(Math.min(nS.value, PAT[k].nmax)); } });
        const nS = v.slider('$n$ (length of $a^n$)', 1, 32, 12, { int: true });
        const cs = v.stage({ x: [0.5, 32.5], y: [1, 3e6], ylog: true, axes: 'box', gutter: true, xlabel: 'n', ylabel: 'steps', height: 320, weight: 1.2 });
        const ss = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1 });
        const cache = {};
        const series = (k) => {
          if (cache[k]) return cache[k];
          const P = PAT[k], rows = [];
          for (let n = 1; n <= P.nmax; n++) {
            const ast = P.ast(n), w = 'a'.repeat(n), bt = backtrack(ast, w, 2e6), N = thompson(ast, AB).N, sim = nfaWork(N, w);
            rows.push({ n, bt, sim, N });
          }
          return (cache[k] = rows);
        };
        v.render(() => {
          const rows = series(pat), P = PAT[pat], n = Math.min(nS.value, P.nmax);
          cs.setView([0.5, P.nmax + 0.5], [1, 3e6]);
          cs.path(rows.map((r) => [r.n, r.bt.steps]), { color: 'red', width: 2.4 }); cs.path(rows.map((r) => [r.n, r.sim.work]), { color: 'blue', width: 2.4 });
          cs.dots(rows.filter((r) => r.bt.capped).map((r) => [r.n, r.bt.steps]), { r: 3.4, color: 'red' });
          cs.vline(n, { color: 'gold', width: 1.4, dash: true, alpha: 0.7 });
          const r = rows[n - 1]; cs.dot(n, r.bt.steps, { r: 6, color: 'red' }); cs.dot(n, r.sim.work, { r: 6, color: 'blue' });
          cs.corner(P.name + (P.grows ? ' on aⁿ' : ' on aⁿ'), 'tl', { size: 12.5, color: 'muted', weight: 600 });
          // live sets
          const Q = pen(ss, v), N = r.N, run = nfaRun(N, 'a'.repeat(n)), m = N.states.length, L0 = 36, cw = Math.min(26, (Q.W - L0 - 12) / (n + 1)), ch = Math.min(18, (Q.H - 44) / m), y0 = 26;
          Q.sans('input position →', L0, 11, { align: 'left', size: 11, color: 'muted' });
          if (ch >= 11) N.states.forEach((s, i) => { Q.text(String(i), 14, y0 + i * ch + ch / 2, { size: 9.5, color: 'muted' }); });
          for (let t = 0; t <= n; t++) N.states.forEach((s, i) => { const on = run.sets[t].includes(s.id); Q.box(L0 + t * cw, y0 + i * ch, cw - 1.2, ch - 1.2, { r: 0, fill: on ? 'blue' : 'faint', alpha: on ? 0.85 : 0.14, stroke: false }); });
          Q.sans(`${m} NFA states (rows); live in blue`, Q.W / 2, Q.H - 10, { size: 11, color: 'muted' });
        });
        v.legend([['red', 'backtracking steps'], ['blue', 'NFA simulation work'], ['gold', 'chosen $n$']]);
        v.readout(() => {
          const rows = series(pat), P = PAT[pat], n = Math.min(nS.value, P.nmax), r = rows[n - 1], prev = rows[n - 2];
          const live = Math.max(...nfaRun(r.N, 'a'.repeat(n)).sets.map((S) => S.length));
          let s = `$n=${n}$: backtracking **${r.bt.capped ? '> ' : ''}${r.bt.steps.toLocaleString('en')}** steps${r.bt.capped ? ' (stopped)' : ''} (${r.bt.ok === false ? 'no match' : r.bt.ok ? 'match' : '—'}) · simulation **${r.sim.work}** steps (${r.sim.ok ? 'match' : 'no match'}), at most **${live}** of ${r.N.states.length} states live`;
          if (prev && !r.bt.capped && !prev.bt.capped) s += ` · growth ×${v.fix(r.bt.steps / prev.bt.steps, 3)} per symbol${pat === 'fib' ? ' (the golden ratio is 1.618)' : ''}`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Theorem',
      name: 'Closure under reversal and homomorphism',
      statement: String.raw`If $L$ is regular then so are (a) its **reversal** $L^R=\{w^R: w\in L\}$, and (b) its image $h(L)=\{h(w): w\in L\}$ under any **homomorphism** $h:\Sigma^*\to\Gamma^*$, i.e. a map determined by the strings $h(a)$ for $a\in\Sigma$ (extended by $h(xy)=h(x)h(y)$, $h(\varepsilon)=\varepsilon$; some $h(a)$ may be $\varepsilon$). Constructions from an NFA $N$ for $L$: **reversal** — reverse every arrow, make the old start state the only accepting state, and add a new start state with ε-arrows to the old accepting states (not needed if there is only one); **homomorphism** — replace each arrow $p\xrightarrow{a}q$ by a path from $p$ to $q$ spelling $h(a)$ through fresh states (an ε-arrow if $h(a)=\varepsilon$). Since $L$ regular means $L=L(N)$ for an NFA (3.3, 3.9), both images are NFA languages, hence regular.`,
      idea: String.raw`An accepting run of $N$ on $w$ is a path from the start state to an accepting state; read backwards it is a path from an accepting state to the start state labelled $w^R$, and the reversed automaton follows exactly those paths. For $h$, each arrow of the run is replaced by the string $h(a)$ it was labelled by, so the run of the new automaton on $h(w)$ is the old run with the arrows stretched. The converse direction for the homomorphism needs care: a string $y$ accepted by the new automaton splits along the new paths into images $h(a_1)\cdots h(a_n)$ of the arrows of a run of $N$, so $y=h(w)$ for some $w\in L$.`,
      caption: String.raw`Pick a machine and an operation. Left: the automaton $N$ for $L$; right: the constructed automaton (reversed arrows with a new start $q_s$ if needed, or each arrow replaced by the path for $h(a)$, with small dots as the fresh states). Type a string $w$: for **reversal** the readout runs $N$ on $w$ and the new machine on $w^R$; for the **homomorphism** it feeds $h(w)$ to the new machine. The panel below checks the construction on **all strings** up to length 7 (reversal: both directions; homomorphism: all of $h(L)$ — except for the erasing map $a\mapsto\varepsilon$, where only "$h(w)$ is accepted whenever $w\in L$" can be tested up to a length bound).`,
      deps: ['toc-3.9'],
      refs: ['Sipser §1.3'],
      credit: 'reversal via the "dual" machine in Rabin & Scott, 1959',
      scope: String.raw`Rabin and Scott's 1959 paper (Definition 12, Theorem 12) defines the dual of a nondeterministic automaton by reversing the transition relation and exchanging initial and final states, and shows that it accepts exactly the reversed tapes; the homomorphism construction is the standard textbook one.`,
      tags: ['closure properties', 'regular languages'],
      viz(v) {
        const MACH = {
          endsAB: () => NFAS.endsAB(), aaOrBb: () => NFAS.aaOrBb(), secondA: () => NFAS.secondA(),
          either: () => nfa(['a', 'b'], [['q0', 1.4, 3.6, 0], ['q1', 5.4, 5.4, 1], ['q2', 5.4, 1.8, 1]], 'q0', { q0: { a: ['q1'], b: ['q2'] }, q1: { a: ['q1'] }, q2: { b: ['q2'] } }, {}, { loops: { q1: 0, q2: 0 } }),
        };
        const HOM = { h1: { a: 'xy', b: 'y', name: 'a → xy, b → y' }, h2: { a: 'x', b: 'xx', name: 'a → x, b → xx' }, h3: { a: '', b: 'y', name: 'a → ε, b → y (erasing)' } };
        let N = MACH.endsAB(), w = 'aab', op = 'rev', hk = 'h1';
        const sel = v.select('machine', [{ value: 'endsAB', label: 'ends in ab' }, { value: 'aaOrBb', label: 'contains aa or bb' }, { value: 'secondA', label: '2nd from end is a' }, { value: 'either', label: 'a⁺ ∪ b⁺ (two accepting states)' }], 'endsAB', { onChange: (k) => { N = MACH[k](); build(); } });
        v.select('operation', [{ value: 'rev', label: 'reversal' }, { value: 'hom', label: 'homomorphism' }], 'rev', { onChange: (k) => { op = k; hs.el.hidden = k !== 'hom'; build(); } });
        const hs = v.select('$h$', Object.entries(HOM).map(([k, h]) => ({ value: k, label: h.name })), 'h1', { onChange: (k) => { hk = k; build(); } }); hs.el.hidden = true;
        keypad(v, AB, () => w, (x) => { w = x; }, { max: 8 });
        const ns = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 290, weight: 1 });
        const rs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 290, weight: 1 });
        const bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 175, full: true });
        const GN = nfaGraph(v, ns, N, { draggable: true, r: 17, texSize: 14 });
        let M = null, GM = null;
        const rev = (u) => [...u].reverse().join(''), img = (u) => [...u].map((c) => HOM[hk][c]).join('');
        function reverseOf(A) {
          const acc = A.states.filter((s) => s.acc).map((s) => s.id), st = A.states.map((s) => [s.id, s.x, s.y, s.id === A.start]), delta = {}, eps = {};
          for (const s of A.states) { delta[s.id] = Object.fromEntries(A.alpha.map((c) => [c, []])); eps[s.id] = []; }
          for (const s of A.states) { for (const c of A.alpha) for (const t of A.delta[s.id][c] || []) delta[t][c].push(s.id); for (const t of A.eps?.[s.id] || []) eps[t].push(s.id); }
          let start; if (acc.length === 1) start = acc[0]; else { const ax = acc.reduce((a, q) => a + A.states.find((s) => s.id === q).x, 0) / acc.length, ay = acc.reduce((a, q) => a + A.states.find((s) => s.id === q).y, 0) / acc.length; st.push(['qs', Math.max(0.8, ax - 2.4), ay, false, '$q_{s}$']); delta.qs = Object.fromEntries(A.alpha.map((c) => [c, []])); eps.qs = acc; start = 'qs'; }
          return nfa(A.alpha, st, start, delta, eps, { loops: A.loops });
        }
        function homOf(A, h) {
          const al = ['x', 'y'], st = A.states.map((s) => [s.id, s.x, s.y, s.acc, s.label]), delta = {}, eps = {}; let cnt = 0;
          for (const s of A.states) { delta[s.id] = { x: [], y: [] }; eps[s.id] = []; }
          for (const s of A.states) for (const c of A.alpha) for (const t of A.delta[s.id][c] || []) {
            const im = h[c]; if (im === '') { eps[s.id].push(t); continue; }
            const T = A.states.find((q) => q.id === t); let prev = s.id;
            for (let i = 0; i < im.length - 1; i++) {
              const id = 'm' + cnt++; let X, Y;
              if (t === s.id) { const a = Math.PI / 2 + (i - (im.length - 2) / 2) * 0.9; X = s.x + Math.cos(a) * 2.0; Y = s.y + Math.sin(a) * 2.0; } else { const f = (i + 1) / im.length; X = s.x + (T.x - s.x) * f; Y = s.y + (T.y - s.y) * f; }
              st.push([id, X, Y, false, '$\\cdot$']); delta[id] = { x: [], y: [] }; eps[id] = []; delta[prev][im[i]].push(id); prev = id;
            }
            delta[prev][im[im.length - 1]].push(t);
          }
          return nfa(al, st, A.start, delta, eps, { loops: Object.fromEntries(A.states.map((q) => [q.id, ((A.loops?.[q.id] ?? 90) - 70 + 360) % 360])) });
        }
        function build() { M = op === 'rev' ? reverseOf(N) : homOf(N, HOM[hk]); GN.sync(N); if (!GM) GM = nfaGraph(v, rs, M, { draggable: true, r: 17, texSize: 14 }); else GM.sync(M); }
        build();
        v.render(() => {
          drawNFA(v, ns, GN, N, {}); drawNFA(v, rs, GM, M, { color: (id) => (id === 'qs' ? 'green' : null), fill: (id) => null });
          ns.corner(`N  (${N.states.length} states)`, 'tl', { size: 12, color: 'muted', weight: 600 }); rs.corner(op === 'rev' ? `reversed machine (${M.states.length} states)` : `h(L) machine (${M.states.length} states)`, 'tl', { size: 12, color: 'muted', weight: 600 });
          const P = pen(bs, v), n = 6;
          if (op === 'rev') {
            drawBarcode(P, AB, n, (u) => { const hit = nfaAccepts(M, u), ref = nfaAccepts(N, rev(u)); return hit !== ref ? { color: 'red', hit, outline: 'red', alpha: 0.9 } : hit ? { color: 'green', hit } : null; });
          } else {
            const rows = []; for (let k = 0; k <= 6; k++) rows.push(layer(['x', 'y'], k).filter((u) => nfaAccepts(M, u)));
            drawLangRows(P, rows, 2, { rh: (P.H - 10) / 7, top: 5 });
          }
        });
        v.legend([['green', 'new start state / accepted', { dot: true }], ['red', 'mismatch with the language operation', { dot: true }]]);
        v.readout(() => {
          const a = nfaAccepts(N, w);
          if (op === 'rev') {
            const b = nfaAccepts(M, rev(w)), A1 = nfaLang(N, 7), B1 = nfaLang(M, 7), R1 = new Set([...A1].map(rev));
            return `$w=${tt(w)}$ is ${a ? 'accepted' : 'rejected'} by $N$; $w^R=${tt(rev(w))}$ is ${b ? 'accepted' : 'rejected'} by the reversed machine ${a === b ? '✓' : '✗'} · all strings of length ≤ 7: $L(N^R)=L(N)^R$ ${eqSets(B1, R1) ? '✓' : '✗'}`;
          }
          const hw = img(w), b = nfaAccepts(M, hw), erasing = HOM[hk].a === '' || HOM[hk].b === '';
          const B1 = nfaLang(M, 7), H1 = new Set(); for (const u of upTo(AB, 7)) if (nfaAccepts(N, u) && img(u).length <= 7) H1.add(img(u));
          const sound = [...H1].every((y) => B1.has(y)), complete = [...B1].every((y) => H1.has(y));
          return `$h(${tt(w)})=${tt(hw)}$: ${a ? '$w\\in L$' : '$w\\notin L$'}, new machine ${b ? 'accepts' : 'rejects'} it ${a && !b ? '✗' : '✓'} · $h(w)$ for all $w\\in L$ (|w|≤7, image ≤7) accepted: ${sound ? '✓' : '✗'}${erasing ? ' (the other direction cannot be bounded for an erasing $h$)' : ` · and nothing else is accepted up to length 7: ${complete ? '✓' : '✗'}`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Concept',
      name: 'Lexical analysis with automata',
      statement: String.raw`A **lexer** (scanner) splits program text into tokens. Each token class is a regular expression $r_1,\dots,r_m$, listed in priority order. The expressions are compiled into one NFA (a new start state with ε-arrows to the NFAs of the $r_i$, 3.7), and then into a DFA by the subset construction (3.3), where each DFA state is labelled with the *first* rule whose accepting state it contains. To scan, run the DFA from the current position and remember the last position at which it was in a labelled state; when the DFA reaches the dead state (or the input ends), cut the token there — the **longest match** — and restart after it, labelled by the rule of that state (ties go to the earlier rule, which is how keywords beat identifiers). If no accepting state was passed, report an error.`,
      idea: String.raw`The DFA keeps all token classes in play at once, each as a set of NFA states, and the subset labelled with the best rule describes the best token ending at the current position; the dead state is the signal that no longer match is possible. Longest match and rule priority are not part of regular languages: they are two extra conventions on top of the automaton, and changing either changes the tokens (reading $\texttt{iffy}$ as the keyword $\texttt{if}$ followed by $\texttt{fy}$, or $\texttt{==}$ as two assignments).`,
      caption: String.raw`Type source text in the toy language (keywords *if*, *else*, *while*; identifiers; numbers; the operators == <= = < +; parentheses; semicolons; spaces). Each token is a coloured chip with its class; **click a token** to see the DFA's path over it (states under the characters, the position of the last accepting state, the lookahead character that killed the run). Switch the rule to **stop at the first accepting state** (no longest match) or turn the **keyword rules off** (keywords then lex as identifiers) and watch the tokens change. The DFA is built live from the regular expressions with the code of 3.7 and 3.3.`,
      deps: ['toc-3.9', 'toc-3.12'],
      refs: ['Sipser §1.3'],
      credit: 'cf. Lesk & Schmidt, Lex, 1975',
      scope: String.raw`The token classes are a toy language chosen for this page, not those of any real language; the combined-DFA technique is that of Lex (M. E. Lesk and E. Schmidt, Bell Laboratories, 1975), which compiles a list of regular expressions into one DFA and resolves ambiguity by the longest match and then by the earlier rule.`,
      tags: ['lexical analysis', 'automata'],
      viz(v) {
        const LET = 'abcdefghijklmnopqrstuvwxyz', DIG = '0123456789', ALPHA = [...LET, ...DIG, '=', '<', '+', '(', ')', ';', ' '];
        const L = (s) => catAll([...s].map(R.sym)), CL = (s) => altAll([...s].map(R.sym));
        const KW = [['if', L('if'), 'kw'], ['else', L('else'), 'kw'], ['while', L('while'), 'kw']];
        const REST = [['ID', R.cat(CL(LET), R.star(R.alt(CL(LET), CL(DIG)))), 'id'], ['NUM', R.cat(CL(DIG), R.star(CL(DIG))), 'num'], ['==', L('=='), 'op'], ['<=', L('<='), 'op'], ['=', L('='), 'op'], ['<', L('<'), 'op'], ['+', L('+'), 'op'], ['(', L('('), 'op'], [')', L(')'), 'op'], [';', L(';'), 'op'], ['space', R.cat(R.sym(' '), R.star(R.sym(' '))), 'ws']];
        const KC = { kw: 'purple', id: 'blue', num: 'orange', op: 'teal', ws: 'faint', err: 'red' };
        const cache = {};
        const build = (kw) => {
          const k = kw ? 1 : 0; if (cache[k]) return cache[k];
          const rules = kw ? [...KW, ...REST] : REST, st = [['s', 0, 0, false]], delta = { s: Object.fromEntries(ALPHA.map((c) => [c, []])) }, eps = { s: [] }, tokOf = {};
          rules.forEach(([name, ast], r) => {
            const T = thompson(ast, ALPHA).N;
            for (const s of T.states) { const id = r + ':' + s.id; st.push([id, 0, 0, s.acc]); delta[id] = Object.fromEntries(ALPHA.map((c) => [c, (s.id in T.delta ? T.delta[s.id][c] || [] : []).map((t) => r + ':' + t)])); eps[id] = (T.eps[s.id] || []).map((t) => r + ':' + t); if (s.acc) tokOf[id] = r; }
            eps.s.push(r + ':' + T.start);
          });
          const N = nfa(ALPHA, st, 's', delta, eps), D = determinize(N);
          const tok = D.states.map((s) => { const rs = s.set.filter((q) => q in tokOf).map((q) => tokOf[q]); return rs.length ? Math.min(...rs) : -1; });
          const dead = D.states.findIndex((s) => s.set.length === 0);
          return (cache[k] = { rules, N, D, tok, dead, idx: Object.fromEntries(D.states.map((s, i) => [s.id, i])) });
        };
        let src = 'if x1 <= 42 == y;', mode = 'long', sel = 0;
        const inp = v.input('source text', src, { width: 360 });
        v.select('examples', [['if x1<=42 ;', 'if x1 <= 42 == y;'], ['iffy = ifx + 7', 'iffy = ifx + 7'], ['while a2 < 10 ( b )', 'while a2 < 10 ( b )'], ['x==y=z<=<', 'x==y=z<=<']].map(([l, s]) => ({ value: s, label: l })), src, { onChange: (s) => { inp.set(s); sel = 0; } });
        v.select('rule', [{ value: 'long', label: 'longest match' }, { value: 'short', label: 'stop at first accepting state' }], 'long', { onChange: (m) => { mode = m; sel = 0; } });
        const kwT = v.toggle('keyword rules (if, else, while)', true);
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true });
        const ps = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true });
        const scan = (B, text) => {
          const toks = []; let i = 0, steps = 0;
          while (i < text.length) {
            let q = B.D.start, qi = 0; const path = [qi]; let last = -1, lastTok = -1, j = i, died = false;
            for (; j < text.length; j++) {
              const c = text[j], t = ALPHA.includes(c) ? B.D.delta[B.D.states[qi].id][c][0] : null;
              qi = t == null ? B.dead : B.idx[t]; path.push(qi); steps++;
              if (qi === B.dead || qi < 0) { died = true; break; }
              if (B.tok[qi] >= 0) { last = j + 1; lastTok = B.tok[qi]; if (mode === 'short') break; }
            }
            if (last < 0) { toks.push({ s: i, e: i + 1, r: -1, path: path.slice(0, 2), lastIdx: -1, died: true }); i += 1; continue; }
            toks.push({ s: i, e: last, r: lastTok, path, lastIdx: last - i, died, examined: Math.min(j + 1, text.length) - i }); i = last;
          }
          return { toks, steps };
        };
        const colorOf = (B, t) => (t.r < 0 ? 'red' : KC[B.rules[t.r][2]]);
        const lay = (P, text) => { const cw = Math.min(24, (P.W - 24) / Math.max(text.length, 1)); return { cw, x0: 12 }; };
        clickPxLocal(ts);
        function clickPxLocal(s) { s.onClick((x, y) => { const B = build(kwT.value), text = inp.value.slice(0, 48), P = { W: s.width }, { cw, x0 } = lay(P, text), idx = Math.floor((x - x0) / cw), R1 = scan(B, text); const k = R1.toks.findIndex((t) => idx >= t.s && idx < t.e); if (k >= 0) sel = k; }); }
        v.render(() => {
          const B = build(kwT.value), text = inp.value.slice(0, 48), P = pen(ts, v), Q = pen(ps, v), { toks } = scan(B, text), { cw, x0 } = lay(P, text);
          sel = Math.min(sel, Math.max(toks.length - 1, 0));
          for (let i = 0; i < text.length; i++) { P.box(x0 + i * cw, 18, cw - 2, 28, { r: 3, stroke: 'faint' }); P.text(text[i] === ' ' ? '␣' : text[i], x0 + i * cw + cw / 2 - 1, 32, { size: Math.min(15, cw * 0.62), weight: 600, color: text[i] === ' ' ? 'faint' : 'ink' }); }
          toks.forEach((t, k) => {
            const c = colorOf(B, t), wpx = (t.e - t.s) * cw - 2, name = t.r < 0 ? 'error' : B.rules[t.r][0];
            P.box(x0 + t.s * cw, 54, wpx, 26, { r: 5, fill: c, alpha: k === sel ? 0.45 : 0.22, stroke: k === sel ? 'ink' : c, width: k === sel ? 2.4 : 1.3 });
            if (B.rules[t.r]?.[2] !== 'ws') P.sans(cut(name, Math.max(2, Math.floor(wpx / 6.2))), x0 + t.s * cw + wpx / 2, 67, { size: 10, weight: 700, color: 'ink' });
          });
          P.sans('click a token to see how the DFA scanned it', 12, P.H - 24, { align: 'left', size: 11.5, color: 'muted' });
          P.sans(`${toks.length} tokens`, P.W - 12, P.H - 24, { align: 'right', size: 11.5, color: 'muted' });
          // trace of the selected token
          const t = toks[sel]; if (!t) { Q.sans('no tokens', Q.W / 2, Q.H / 2, { color: 'muted' }); return; }
          const seg = text.slice(t.s, Math.min(text.length, t.s + t.path.length - 1)), cw2 = Math.min(40, (Q.W - 130) / Math.max(seg.length + 1, 1)), xs = 70;
          Q.sans('DFA state after each character:', 12, 14, { align: 'left', size: 11.5, color: 'muted', weight: 600 });
          Q.text('start', xs - cw2 / 2 - 20, 60, { size: 10.5, color: 'muted' });
          const lab = (qi) => (qi === B.dead ? '∅' : 'D' + qi);
          const drawState = (k, qi) => {
            const x = xs + k * cw2, acc = qi >= 0 && qi !== B.dead && B.tok[qi] >= 0, c = acc ? KC[B.rules[B.tok[qi]][2]] : qi === B.dead ? 'red' : 'faint';
            Q.box(x - cw2 / 2 + 2, 48, cw2 - 4, 24, { r: 12, fill: c, alpha: acc ? 0.5 : 0.18, stroke: acc ? c : 'muted', width: acc ? 1.8 : 1.1 });
            Q.text(lab(qi), x, 60, { size: 11.5, weight: 600 });
            if (acc) Q.sans(B.rules[B.tok[qi]][0], x, 84, { size: 10.5, color: c, weight: 700 });
          };
          drawState(0, t.path[0]);
          for (let k = 0; k < seg.length; k++) {
            const x = xs + (k + 1) * cw2, inTok = t.s + k < t.e;
            Q.box(x - cw2 / 2 + 2, 96, cw2 - 4, 26, { r: 3, fill: inTok ? colorOf(B, t) : 'red', alpha: 0.2, stroke: inTok ? colorOf(B, t) : 'red' });
            Q.text(seg[k] === ' ' ? '␣' : seg[k], x, 109, { size: 14, weight: 600 });
            drawState(k + 1, t.path[k + 1]);
            if (k + 1 === t.lastIdx) Q.sans('▲ last accepting state: the token ends here', x, 140, { size: 11, color: 'green', weight: 700, align: 'center' });
          }
          if (t.died && mode === 'long') Q.sans('✗ dead state reached: no longer match is possible, so the scanner stops', Q.W - 12, 14, { align: 'right', size: 11.5, color: 'red', weight: 600 });
          if (mode === 'short') Q.sans('stopped at the first accepting state', Q.W - 12, 14, { align: 'right', size: 11.5, color: 'orange', weight: 600 });
        });
        v.legend([['purple', 'keyword', { dot: true }], ['blue', 'identifier', { dot: true }], ['orange', 'number', { dot: true }], ['teal', 'operator', { dot: true }], ['red', 'error / dead state', { dot: true }]]);
        v.readout(() => {
          const B = build(kwT.value), text = inp.value.slice(0, 48), R1 = scan(B, text), t = R1.toks[Math.min(sel, R1.toks.length - 1)];
          return `${B.rules.length} token rules → combined ε-NFA with **${B.N.states.length}** states → DFA with **${B.D.states.length}** states (${B.tok.filter((x) => x >= 0).length} accepting) · text of ${text.length} characters scanned in ${R1.steps} DFA steps (${Math.max(0, R1.steps - text.length)} of them lookahead characters that are read again by the next token)${t ? ` · token ${Math.min(sel, R1.toks.length - 1) + 1}: ${t.r < 0 ? '**error**' : `**${B.rules[t.r][0]}**`} \`${text.slice(t.s, t.e)}\`` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Paper',
      name: 'Representation of Events in Nerve Nets and Finite Automata',
      paper: { authors: 'S. C. Kleene', year: 1956, title: 'Representation of Events in Nerve Nets and Finite Automata', venue: 'in C. E. Shannon and J. McCarthy (eds.), Automata Studies, Annals of Mathematics Studies 34, Princeton University Press: 3–42', doi: '10.1515/9781400882618-002' },
      introduces: ['toc-1.2', 'toc-3.6', 'toc-3.9'],
      statement: String.raw`Kleene's 1956 chapter studies input-history **events** represented by a finite automaton's state or by a designated neuron of a McCulloch–Pitts net. Section 7.1 defines regular sets of time-indexed input tables using finite unit sets, union, product and **binary iteration** $E*F=\bigcup_{n\ge0}E^nF$. In §7.3, Theorem 3 constructs a net for each regular event, with a suitable initial internal state and output observed two ticks after the event ends. In §9, Theorem 5 and its corollary prove regularity of events represented by finite automata with fixed initial internal state. These results yield the modern equivalence of regular expressions and finite-state recognition, while the paper's time, initial-table and delay conventions require care.`,
      idea: String.raw`The chapter's nerve-net argument constructs representations of the regular operations, with timing lemmas to handle short events and fixed observation lag. For the converse, §9 Lemma 7 proves by induction on the number of states that the connecting state strings form a regular set, then translates them into input-table events. This is a different construction from the modern position automaton drawn here. The chapter's opening footnote identifies RAND memorandum RM-704, dated 15 December 1951, as its source. The 1956 published chapter's metadata is retained; its complete retyped text, including §7.3 Theorem 3 and §9 Theorem 5, was examined rather than assuming its numbering matched RM-704.`,
      caption: String.raw`A modern teaching reconstruction, not Kleene's net: each letter occurrence becomes a threshold neuron. If its original indegree is $m$, its input-letter line has weight $m$, each predecessor weight 1 and its fixed threshold is $m+1$. Thus the right letter and at least one previous firing are required. A start pulse occurs at tick 0; output for a word is observed at tick $|w|+1$. Type a regex/string and step through the raster. Click a drawn predecessor/output synapse to cut or restore it; thresholds remain fixed. The net is read back as a regular expression, with exact automaton comparison and a separate finite barcode check. The preset $(aaa)^*a$ recognizes unary lengths $1\pmod3$; the historical table notation is not presented as a modern unary-star expression.`,
      deps: ['toc-2.1'],
      refs: ['Kleene, Representation of Events in Nerve Nets and Finite Automata (1956), §§7.1,7.3,9, Theorems 3 and 5, Lemma 7; full academic retyping'],
      tags: ['history', 'automata', 'regular expressions'],
      credit: 'S. C. Kleene, RAND report 1951, published 1956',
      scope: String.raw`Verified against the full 1956 chapter in an academic retyping (44 local pages): §7.1 pp.23–26, §7.3 Theorem 3 pp.31–34, §9 Theorem 5/Lemma 7 and corollary pp.37–40. Its first page cites the 1951 report. The modern one-hot input and explicit start pulse differ from the paper's time-indexed table convention, two-tick lag and initial-state construction. Cutting a synapse can leave the language unchanged. The interactive reconstruction has at most 10 operands and syntax size 80 for responsive exact read-back; the theorem is unrestricted. The full read-back automaton is the position NFA, not an arbitrary bounded sample of firing patterns.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kleene%27s_theorem', 'Full chapter': 'https://www2.fiit.stuba.sk/~kvasnicka/CognitiveScience/2.prednaska/kleene56representation%5B1%5D.pdf' },
      viz(v) {
        let w = 'aaaa', built = '', net = null, cut = new Set(), selT = 0;
        const RI = rxInput(v, { value: '(aaa)*a', presets: [['(aaa)*a (Kleene)', '(aaa)*a'], ['(a|b)*abb', '(a|b)*abb'], ['a*b', 'a*b'], ['(ab)*', '(ab)*'], ['a(a|b)*', 'a(a|b)*']], onPick: () => { cut = new Set(); S.reset({ at: 'end' }); } });
        v.button('restore all synapses', () => { cut = new Set(); S.reset({ at: 'end' }); });
        keypad(v, AB, () => w, (x) => { w = x; S.reset({ at: 'end' }); }, { max: 9 });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 300, weight: 1.15 });
        const rs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1 });
        const G = v.graph(gs, { nodes: [], edges: [], layout: 'none', directed: true, r: 17, autoRadius: false, fontSize: 14, draggable: true, edgeFontSize: 11 });
        const glush = positionNet;
        const eff = (id) => net.edges.filter(([a, b]) => b === id && !cut.has(a + '>' + b)).map(([a]) => a);
        const sim = (u) => netTrace(net, u, cut);
        const accepts = (u) => sim(u)[u.length + 1].has('O');
        const readOff = () => nfaToRegex(netAutomaton(net, cut));
        const layoutNet = () => {
          const nodes = [{ id: 'S', label: 'S', t: 'S' }, ...net.pos.map((c, i) => ({ id: 'p' + i, label: c + i, t: 'p' })), { id: 'O', label: 'O', t: 'O' }];
          G.set({ nodes, edges: net.edges.map(([a, b]) => ({ from: a, to: b, directed: true })) }); G.layout('layered', { rankdir: 'right' });
        };
        G.onClick = ({ edge }) => { if (edge) { const k = edge.from + '>' + edge.to; if (cut.has(k)) cut.delete(k); else cut.add(k); S.reset({ at: 'end' }); } return true; };
        const frames = () => {
          if (!net) return [];
          const F = sim(w), out = [], sym = (t) => (t < w.length ? w[t] : null);
          for (let t = 0; t <= w.length + 1; t++) {
            const fired = [...F[t]];
            out.push({ t, note: t === 0 ? `Time 0: the start pulse $S$ fires; the first input symbol${w.length ? ` (**${w[0]}**)` : ''} is on the input lines.` : t <= w.length ? `Time ${t}: neurons that fire: ${fired.length ? fired.join(', ') : 'none — the pulse has died'}. The input line now carries ${sym(t) ? `**${sym(t)}**` : 'nothing (the string has ended)'}.` : `Time ${t}: the output neuron $O$ ${F[t].has('O') ? '**fires**: the string is in the event.' : 'is silent: the string is not in the event.'}`, final: t === w.length + 1 });
          }
          return out;
        };
        const S = v.steps({ frames, speed: 1.2, still: 99 });
        v.render(() => {
          const res = RI.cur(), P = pen(rs, v);
          if (res.error) { P.sans(res.error, P.W / 2, P.H / 2, { size: 14, color: 'red', weight: 600 }); return; }
          if (!res.ast || ![...symbolsOf(res.ast)].every((c) => AB.includes(c))) { P.sans('use only the letters a and b', P.W / 2, P.H / 2, { size: 14, color: 'red', weight: 600 }); return; }
          if (rxSize(res.ast) > 80 || countParts(res.ast).operands > 10) { P.sans('Interactive limit: at most 10 operands and syntax size 80.', P.W / 2, P.H / 2, { size: 13, color: 'red' }); return; }
          if (built !== RI.inp.value) { built = RI.inp.value; net = glush(res.ast); net.ast = res.ast; cut = new Set(); layoutNet(); S.reset({ at: 'end' }); }
          const f = S.frame, t = f.t ?? 0, F = sim(w), cur = F[Math.min(t, F.length - 1)], prev = t > 0 ? F[t - 1] : new Set();
          const m = (id) => net.edges.filter(([a, b]) => b === id).length;
          G.draw({
            nodeLabel: (id, nd) => nd.label, nodeRing: (id) => (id === 'O' ? 'ink' : null),
            nodeFill: (id) => (cur.has(id) ? (id === 'O' ? 'green' : 'gold') : null),
            nodeColor: (id) => (id === 'S' ? 'green' : id === 'O' ? 'green' : null),
            nodeNote: (id) => (id === 'S' ? '' : id === 'O' ? 'θ=1' : `θ=${m(id) + 1}`),
            edgeColor: (e) => (cut.has(e.from + '>' + e.to) ? 'red' : prev.has(e.from) ? 'gold' : null), edgeWidth: (e) => (prev.has(e.from) && !cut.has(e.from + '>' + e.to) ? 2.8 : null), edgeDash: (e) => (cut.has(e.from + '>' + e.to) ? [4, 4] : null),
          });
          gs.corner(`${net.pos.length} letter neurons · ${net.edges.length} synapses · ${cut.size} cut`, 'tl', { size: 12, color: 'muted', weight: 600 });
          // raster of firing history
          const rows = ['input', 'S', ...net.pos.map((c, i) => 'p' + i), 'O'], L0 = 52, cw = Math.min(46, (P.W - L0 - 10) / (w.length + 2)), rh = Math.min(26, (P.H - 30) / rows.length), y0 = 22;
          for (let tt0 = 0; tt0 <= w.length + 1; tt0++) P.text(String(tt0), L0 + tt0 * cw + cw / 2, 12, { size: 10.5, color: tt0 === t ? 'gold' : 'muted', weight: tt0 === t ? 700 : 500 });
          rows.forEach((id, r) => {
            P.sans(id === 'input' ? 'input' : id.startsWith('p') ? `${net.pos[+id.slice(1)]}${id.slice(1)}` : id, 8, y0 + r * rh + rh / 2, { align: 'left', size: 10.5, color: 'muted', weight: 600 });
            for (let tt0 = 0; tt0 <= w.length + 1; tt0++) {
              const on = id === 'input' ? false : F[tt0].has(id), x = L0 + tt0 * cw;
              if (id === 'input') { const ch = tt0 < w.length ? w[tt0] : ''; P.box(x + 1, y0 + r * rh + 1, cw - 2, rh - 2, { r: 3, stroke: 'faint' }); P.text(ch, x + cw / 2, y0 + r * rh + rh / 2, { size: 12.5, weight: 700 }); }
              else P.box(x + 1, y0 + r * rh + 1, cw - 2, rh - 2, { r: 3, fill: on ? (id === 'O' ? 'green' : 'gold') : 'faint', alpha: on ? 0.8 : 0.15, stroke: false });
            }
          });
          P.line(L0 + t * cw, y0, L0 + t * cw, y0 + rows.length * rh, { color: 'gold', width: 2 }); P.line(L0 + (t + 1) * cw, y0, L0 + (t + 1) * cw, y0 + rows.length * rh, { color: 'gold', width: 2 });
        });
        v.legend([['gold', 'neuron fired at this tick', { dot: true }], ['green', 'start pulse / output neuron', { dot: true }], ['red', 'cut synapse']]);
        v.readout(() => {
          const res = RI.cur(); if (res.error || !net || built !== RI.inp.value) return 'Enter a valid expression over a and b.';
          const A = new Set(), B = new Set(); for (const u of upTo(AB, 7)) if (accepts(u)) A.add(u);
          const E = langFlat(res.ast, 7), same = eqSets(A, E), fd = same ? null : firstDiff(A, E);
          const reg = readOff(), txt = reg ? rx(reg) : null, exact = regexDifference(netAutomaton(net, cut), res.ast);
          return `$w=${tt(w)}$: output neuron ${accepts(w) ? '**fires**' : 'stays silent'} · event of the net, all strings of length ≤ 7: ${A.size} strings, ${same ? 'identical to $L(r)$ ✓' : `**differs** from $L(r)$ ✗ (first at $${tt(fd ?? '')}$)`} · full automaton check: ${exact.equal === null ? 'unknown (resource cap)' : exact.equal ? 'equal ✓' : 'different ✗'} · read back from the net by state elimination: $${reg ? rxTeX(reg).length < 260 ? rxTeX(reg) : `\\text{an expression of size ${rxSize(reg)}, starting }\\mathtt{${rx(reg).slice(0, 40).replace(/[∪]/g, '|')}}\\ldots` : '\\ldots'}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Paper',
      name: 'Finite Automata and Their Decision Problems',
      paper: { authors: 'M. O. Rabin and D. Scott', year: 1959, title: 'Finite Automata and Their Decision Problems', venue: 'IBM Journal of Research and Development 3 (2): 114–125', doi: '10.1147/rd.32.0114' },
      introduces: ['toc-3.1', 'toc-3.3', 'toc-2.7', 'toc-4.11'],
      statement: String.raw`Rabin and Scott studied finite automata as devices that classify finite *tapes* (strings) and proved: (i) for an automaton with $r$ states, the set of accepted tapes is non-empty iff it contains a tape shorter than $r$ (Theorem 7), it is infinite iff it contains a tape of length $n$ with $r\le n<2r$ (Theorem 9), and two automata with $r_1$ and $r_2$ states are inequivalent iff some tape shorter than $r_1r_2$ is accepted by exactly one (Theorem 10) — so emptiness, finiteness and equivalence are decidable; (ii) the **nondeterministic automaton**, which may choose among several moves and accepts a tape if some choice of moves ends in a final state, defines exactly the same sets of tapes as the ordinary automaton, via the automaton whose states are the *sets* of states (Theorem 11); (iii) the **dual** automaton (all moves reversed, initial and final states exchanged) accepts the reversed tapes (Theorem 12); (iv) **two-way** automata, which may move back and forth on the tape, accept exactly the same sets of tapes as one-way automata (Theorem 15); (v) for two-way automata with two tapes even the problem whether any tape is accepted is, as the introduction states, not solvable by an algorithm.`,
      idea: String.raw`Turing machines, the authors say, are too general a model for actual computers, so they study the finite-state restriction as "black boxes" that answer yes or no to typed questions, building on Kleene's characterisation of the events nerve nets can represent (3.15) and on Myhill's unpublished treatment of it with directed graphs. The decision procedures all rest on one loop argument: a tape that visits a state twice can be shortened or lengthened by cutting out or repeating the loop (the same idea reappears as the pumping lemma, 4.1). The nondeterministic machine was introduced as a design tool with few states, and Theorem 11 shows that it adds no power; the construction is the one we now call the subset construction. Rabin and Scott received the 1976 Turing Award for this paper, the ACM citing its introduction of the idea of nondeterministic machines.`,
      caption: String.raw`**The experiment is a modern reconstruction, not a figure from the paper.** Take the nondeterministic automaton for "the $n$-th symbol from the end is 1" (not taken from the paper: it is the standard family for exhibiting the blow-up) and a random tape. Slide the **tape position**: the live NFA states (gold) are exactly the state of the paper's automaton $\mathfrak D(\mathfrak A)$, whose states are sets of states; the right picture counts how many *different* sets the tape has visited so far, climbing to $2^n$. The readout checks three of the paper's bounds on this automaton: the shortest accepted tape is shorter than its number $r$ of states (Theorem 7), an accepted tape of length in $[r,2r)$ exists because the language is infinite (Theorem 9), and the nondeterministic machine and $\mathfrak D(\mathfrak A)$ agree on every tape up to length 10 (Theorem 11).`,
      deps: ['toc-2.1', 'toc-3.9'],
      refs: [],
      tags: ['history', 'automata', 'nondeterminism'],
      credit: 'M. O. Rabin & D. Scott, 1959',
      scope: String.raw`Verified against the scan of the printed paper (IBM Journal, April 1959, pp. 114–125): the abstract, introduction, Definitions 1–14 and Theorems 5–15 as summarised above (pages 114–123). The paper's $\mathfrak D(\mathfrak A)$ uses all subsets of the states as its states; here only the reachable subsets are counted, which satisfies the same bounds with a smaller $r$. Whether the exponential family drawn here appears in the paper is not claimed.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Powerset_construction' },
      viz(v) {
        const FAMk = (k) => { const st = [], dl = {}; for (let i = 0; i <= k; i++) { st.push(['q' + i, 1.6 + (i * 7.4) / Math.max(k, 1), 3.6, i === k]); dl['q' + i] = i === 0 ? { 0: ['q0'], 1: ['q0', 'q1'] } : i < k ? { 0: ['q' + (i + 1)], 1: ['q' + (i + 1)] } : {}; } return nfa(['0', '1'], st, 'q0', dl, {}, { loops: { q0: 90 } }); };
        const T = 120;
        let seed = 3;
        const kS = v.slider('$n$', 1, 5, 3, { int: true });
        const tS = v.slider('tape position $t$', 0, T, 14, { int: true });
        v.button('new random tape', () => { seed++; });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 270, weight: 1 });
        const ds = v.stage({ x: [-1.75, 1.75], y: [-1.6, 1.75], axes: false, equal: true, height: 270, weight: 1 });
        const cs = v.stage({ x: [0, T], y: [0, 36], axes: 'box', gutter: true, xlabel: 'tape position t', ylabel: 'different sets visited', height: 270, weight: 1.2 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 64, full: true });
        const GN = nfaGraph(v, gs, FAMk(3), { draggable: false, r: 18 });
        const GD = v.graph(ds, { nodes: [], edges: [], layout: 'none', directed: true, draggable: false, r: 17, autoRadius: false, texSize: 11.5, edgeFontSize: 11 });
        let kk = -1, sd = -1, M = null;
        const build = (k) => {
          const N = FAMk(k), D = determinize(N), r = D.states.length;
          // shortest accepted tape (Theorem 7) and a tape in [r, 2r) (Theorem 9) by breadth-first search over D
          let reach = new Set([D.start]), shortest = -1, inRange = -1;
          for (let l = 0; l < 2 * r + 1; l++) {
            const hasAcc = [...reach].some((q) => D.states.find((s) => s.id === q).acc);
            if (hasAcc && shortest < 0) shortest = l; if (hasAcc && l >= r && inRange < 0) inRange = l;
            const nx = new Set(); for (const q of reach) for (const c of N.alpha) nx.add(D.delta[q][c][0]); reach = nx;
          }
          let bad = null; for (const u of upTo(N.alpha, 10)) if (nfaAccepts(N, u) !== dfaAccepts(D, u)) { bad = u; break; }
          return { N, D, r, shortest, inRange, bad };
        };
        let B = null, tape = '', walk = null;
        const refresh = () => {
          const k = kS.value; if (k !== kk || sd !== seed) {
            if (k !== kk) { kk = k; B = build(k); GN.sync(B.N); B.D.states.forEach((s, i) => { const a = (2 * Math.PI * i) / B.D.states.length; s.x = Math.sin(a) * 1.15; s.y = Math.cos(a) * 1.15; s.label = '$\\mathtt{' + Array.from({ length: k }, (_, j) => (s.set.includes('q' + (k - j)) ? '1' : '0')).join('') + '}$'; }); GD.set({ nodes: B.D.states, edges: dfaEdges(B.D) }); }
            sd = seed; const r = v.rng(seed); tape = Array.from({ length: T }, () => (r() < 0.5 ? '0' : '1')).join('');
            let q = B.D.start; const seen = new Set([q]), path = [q], cnt = [1]; for (const c of tape) { q = B.D.delta[q][c][0]; path.push(q); seen.add(q); cnt.push(seen.size); } walk = { path, cnt };
          }
        };
        v.render(() => {
          refresh(); const k = kS.value, t = tS.value, q = walk.path[t], cur = B.D.states.find((s) => s.id === q);
          drawNFA(v, gs, GN, B.N, { fill: (id) => (cur.set.includes(id) ? 'gold' : null) });
          gs.corner(`nondeterministic automaton, ${B.N.states.length} states`, 'tl', { size: 12, color: 'muted', weight: 600 });
          ds.setView([-1.75, 1.75], [-1.6, 1.75]);
          GD.draw({ nodeLabel: (id, nd) => nd.label, nodeRing: (id) => (B.D.states.find((s) => s.id === id).acc ? 'ink' : null), nodeFill: (id) => (id === q ? 'gold' : null), labelColor: (id) => (id === q ? onColor(v, 'gold') : null), edgeLabel: (e) => e.label, edgeColor: (e) => (e.syms.includes('1') && !e.syms.includes('0') ? 'orange' : e.syms.includes('0') && !e.syms.includes('1') ? 'blue' : null), edgeLabelColor: (e) => (e.syms.includes('1') && !e.syms.includes('0') ? 'orange' : e.syms.includes('0') && !e.syms.includes('1') ? 'blue' : null) });
          const n0 = GD.node('S0'); if (n0 && isFinite(n0.x)) { const px = ds.X(n0.x), py = ds.Y(n0.y); ds.arrow(ds.invX(px), ds.invY(py - 62), ds.invX(px), ds.invY(py - 26), { color: 'ink', width: 2, head: 8 }); }
          ds.corner(`𝔇(𝔄): ${B.D.states.length} subsets`, 'br', { size: 12, color: 'muted', weight: 600 });
          cs.setView([0, T], [0, Math.max(2 ** k * 1.15, 3)]);
          cs.hline(2 ** k, { color: 'faint', dash: true, width: 1.5 }); cs.text(`2^${k} = ${2 ** k}`, T - 2, 2 ** k, { size: 11.5, color: 'muted', align: 'right', dy: -10 });
          cs.path(walk.cnt.map((c, i) => [i, c]), { color: 'orange', width: 2.2 });
          cs.vline(t, { color: 'gold', width: 1.4, dash: true, alpha: 0.8 }); cs.dot(t, walk.cnt[t], { r: 5.5, color: 'orange' });
          const P = pen(ts, v), lo = Math.max(0, Math.min(t - 18, T - 40)), cw = Math.min(26, (P.W - 24) / 40);
          for (let i = 0; i < 40 && lo + i < T; i++) { const p = lo + i, done = p < t; P.box(12 + i * cw, 18, cw - 2, 26, { r: 3, fill: p === t ? 'gold' : done ? 'faint' : null, alpha: p === t ? 0.4 : 0.2, stroke: p === t ? 'gold' : 'muted', width: p === t ? 2.2 : 1 }); P.text(tape[p], 12 + i * cw + cw / 2 - 1, 31, { size: 13, weight: 600, color: done ? 'muted' : 'ink' }); }
          P.sans(`tape (positions ${lo + 1}–${Math.min(T, lo + 40)}); symbols before the gold cell have been read`, 12, 8, { align: 'left', size: 10.5, color: 'muted' });
        });
        v.legend([['gold', 'live NFA states = current state of 𝔇(𝔄)', { dot: true }], ['orange', 'tape 1', { dot: true }], ['blue', 'tape 0 (arrows)']]);
        v.readout(() => {
          refresh(); const k = kS.value, t = tS.value, cur = B.D.states.find((s) => s.id === walk.path[t]);
          const first = walk.cnt.findIndex((c) => c === B.D.states.length);
          return `$n=${k}$: live states $${setTex(B.N, cur.set)}$ · the tape has visited **${walk.cnt[t]}** of the ${B.D.states.length} reachable sets ($2^{${k}}$)${first >= 0 ? `, all of them from position ${first} on` : ' so far'} · $r=${B.r}$: shortest accepted tape has length **${B.shortest}** $<r$ ${B.shortest < B.r ? '✓' : '✗'} (Thm 7) · an accepted tape of length **${B.inRange}** lies in $[r,2r)=[${B.r},${2 * B.r})$ ✓ (Thm 9, the language is infinite) · $\\mathfrak A$ and $\\mathfrak D(\\mathfrak A)$ agree on all tapes of length ≤ 10: ${B.bad == null ? '✓' : '✗ at ' + B.bad} (Thm 11)`;
        });
      },
    },
  ],
};
