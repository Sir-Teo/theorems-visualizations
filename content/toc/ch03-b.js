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
        const info = (k, o) => (k === 'R' ? { head: cut(rx(o), 34), foot: `size ${rxSize(o)}` } : { head: `${o.states.length} states`, foot: k === 'N' ? `${nfaEdges(o).length} arrow groups` : 'deterministic' });
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
      statement: String.raw`Let $A,B\subseteq\Sigma^*$ be languages. The language equation $X=AX\cup B$ (unknown $X\subseteq\Sigma^*$) always has $A^*B$ as its **least solution**. If $\varepsilon\notin A$ it is the **unique** solution. If $\varepsilon\in A$ the solutions are exactly the languages $X=A^*C$ with $B\subseteq C$; in particular every language $A^*(B\cup D)$ is a solution, so the equation then has many solutions (when also $A^*B\ne\Sigma^*$, infinitely many).`,
      idea: String.raw`Unrolling the equation gives $X=B\cup AB\cup A^2B\cup\cdots\cup A^{k}X$, so every string of $A^*B$ shows up after finitely many unrollings (the iterates $X_0=\varnothing$, $X_{k+1}=AX_k\cup B$ increase to $A^*B$). If $\varepsilon\notin A$ every string of $A^kX$ has length at least $k$, so a solution cannot contain strings that the first $k$ layers do not account for: the tail $A^kX$ disappears from any fixed length, and $X=A^*B$ is forced. If $\varepsilon\in A$ the tail $A^kX$ always contains $X$ itself, which lets one add arbitrary strings $C$ and take $A^*C$.`,
      caption: String.raw`Type $A$ and $B$ (regular expressions over $a,b$). **Left:** the approximations $X_0=\varnothing$, $X_1=B$, $X_2=AB\cup B,\dots$ as a barcode of all strings up to length 7 — new strings of the latest layer in gold, earlier ones blue; the faint outline marks the strings of the limit $A^*B$ not yet reached. **Right:** a candidate solution $X$ (choose $A^*B$, or the larger $A^*(B\cup\{c\})$ for a string $c$ outside $A^*B$) and, beside it, $AX\cup B$ computed from it; strings where the two sides differ are red. Put $\varepsilon$ into $A$ (e.g. $A=a\mid\varepsilon$) and the larger candidate becomes a genuine second solution; without ε it fails.`,
      deps: ['toc-3.6'],
      refs: ['Sipser §1.3'],
      credit: 'D. N. Arden, c. 1960',
      scope: String.raw`Strings are checked up to length 7, which is exact for the equation (a string of length $\le7$ of $AX$ only involves strings of $X$ of length $\le7$); Arden's own publication details are not verified here (the lemma is attributed to his 1960–61 work on delayed-logic and finite-state machines).`,
      verify: true,
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
          const a = IA.cur(), b = IB.cur(); const ky = IA.inp.value + '|' + IB.inp.value; if (ky === K0) return D;
          K0 = ky;
          if (a.error || b.error) return (D = { error: a.error ? 'A: ' + a.error : 'B: ' + b.error });
          const bad = [...symbolsOf(a.ast), ...symbolsOf(b.ast)].find((c) => !AB.includes(c)); if (bad) return (D = { error: 'use only the letters a and b' });
          const LA = langSets(a.ast, N), LB = langSets(b.ast, N), limit = langSets(R.cat(R.star(a.ast), b.ast), N);
          const X = [Array.from({ length: N + 1 }, () => new Set())]; for (let k = 0; k < K; k++) X.push(lunion(lcat(LA, X[k], N), LB));
          const all = new Set(); limit.forEach((S) => S.forEach((u) => all.add(u)));
          let c = null; for (const u of upTo(AB, N)) if (!all.has(u)) { c = u; break; }
          const LAs = langSets(R.star(a.ast), N), big = c == null ? null : lcat(LAs, lunion(LB, Array.from({ length: N + 1 }, (_, k) => new Set(k === c.length ? [c] : []))), N);
          return (D = { LA, LB, limit, X, c, big, eps: nullable(a.ast), a: a.ast, b: b.ast });
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
          s += cand.value === 'big' && !M.big ? ' · no larger candidate: $A^*B=\\Sigma^*$ here' : ` · candidate solves $X=AX\\cup B$: ${viol === 0 ? '✓ (0 violations)' : `✗ ${viol} string${viol === 1 ? '' : 's'} differ, first $${tt(first)}$`}`;
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
          N.states.forEach((s, i) => { Q.text(String(i), 14, y0 + i * ch + ch / 2, { size: 9.5, color: 'muted' }); });
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
  ],
};
