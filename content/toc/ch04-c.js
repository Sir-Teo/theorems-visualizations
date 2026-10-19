import { buchiExamples, buchiWord, trafficProduct, trafficProperties } from './automata.audit.js';
// Theory of Computation — Chapter 4, part 3: robustness of the regular languages (4.10–4.13)
import { pen, keypad, dfa, nfa, texName, dfaGraph, drawDFA, nfaGraph, drawNFA, tt, isPrimeN, PAL, XYZ, upTo } from './ch04.shared.js';

const tex = (u) => `\\mathtt{${u}}`;

export default {
  collection: 'toc',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Unary regular languages are ultimately periodic',
      statement: String.raw`Let $L\subseteq\{a\}^*$ be a language over a one-letter alphabet and put $S=\{n : a^n\in L\}\subseteq\mathbb N$. Then $L$ is regular if and only if $S$ is **ultimately periodic**: there are $t\ge0$ and $c\ge1$ such that for all $n\ge t$, $\;n\in S\iff n+c\in S$. Equivalently, $L$ is accepted by a DFA whose diagram is a *lasso* — a tail of $t$ states leading into a cycle of $c$ states. In particular the squares, the primes and the powers of two are not regular.`,
      idea: String.raw`A unary DFA has exactly one arrow out of every state, so the run on $a^0,a^1,a^2,\dots$ is a path that must eventually repeat a state (pigeonhole): it walks along a tail of $t$ states and then circles forever through a cycle of $c$ states. Hence the state after $n$ letters depends only on $n$ when $n<t$ and on $(n-t)\bmod c$ when $n\ge t$, so $S$ is periodic from $t$ on. Conversely a lasso with the right accepting states recognizes any ultimately periodic set. A set with unbounded gaps between its elements, such as the primes (the gaps $k!+2,\dots,k!+k$ are all composite), has no period.`,
      caption: String.raw`Left: a unary DFA drawn as a lasso (blue tail, orange cycle). **Click a state** to toggle whether it accepts; the sliders set the tail length $t$ and the cycle length $c$. Right: the accepted lengths $n=0,\dots,47$ on a number line (top row), and the same row shifted by $c$ (bottom row): from $n=t$ on the two rows agree. Switch the language to the **primes** or the **squares**: the shifted row can never agree with the top row beyond the tail, and the best lasso you can build keeps making mistakes (red).`,
      deps: ['toc-2.3', 'comb-1.2'],
      refs: ['Sipser §1.4'],
      tags: ['unary languages', 'periodicity', 'nonregular languages'],
      viz(v) {
        const N = 48, MAXS = 15;
        let accs = Array.from({ length: MAXS }, (_, i) => i === 2 || i === 5);
        const mode = v.select('language', [{ value: 'lasso', label: 'the lasso machine' }, { value: 'prime', label: 'primes' }, { value: 'square', label: 'squares' }], 'lasso');
        const tS = v.slider('tail length $t$', 0, 8, 3, { int: true });
        const cS = v.slider('cycle length $c$', 1, 7, 4, { int: true });
        const gs = v.stage({ x: [0, 10], y: [0, 7], axes: false, equal: true, height: 300, weight: 1.05, minWidth: 340 });
        const ls = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.25, minWidth: 400 });
        const TARGET = { prime: (n) => isPrimeN(n), square: (n) => Number.isInteger(Math.sqrt(n)) };
        const build = () => {
          const t = tS.value, c = cS.value, m = t + c, tg = TARGET[mode.value];
          const acc = (i) => (tg ? tg(i) : accs[i]);
          const ids = Array.from({ length: m }, (_, i) => 'q' + i);
          const r = Math.max(0.9, c * 0.42), step = Math.min(1.45, 5.2 / Math.max(t, 1));
          const ccx = 1.1 + t * step + r, cy = 3.5;
          const pos = ids.map((_, i) => (i < t ? [1.1 + i * step, cy] : (() => { const k = i - t, a = Math.PI - (2 * Math.PI * k) / c; return [ccx + r * Math.cos(a), cy + r * Math.sin(a)]; })()));
          const delta = {}; ids.forEach((q, i) => { delta[q] = { a: i + 1 < m ? ids[i + 1] : ids[t] }; });
          const D = dfa(['a'], ids.map((q, i) => [q, pos[i][0], pos[i][1], acc(i), `$${i}$`]), 'q0', delta, { loops: c === 1 ? { [ids[t]]: 90 } : undefined });
          return { D, t, c, m, acc, view: [Math.min(...pos.map((p) => p[0])) - 1.2, Math.max(...pos.map((p) => p[0])) + 1.4, cy - Math.max(r, 1) - 1.3, cy + Math.max(r, 1) + 1.3] };
        };
        let W = build();
        const G = dfaGraph(v, gs, W.D, { r: 17, texSize: 15 });
        G.onClick = ({ node }) => { if (node && mode.value === 'lasso') { const i = +node.id.slice(1); accs[i] = !accs[i]; } return true; };
        let info = null;
        v.render(() => {
          W = build(); G.sync(W.D);
          const { t, c, m, acc, view } = W;
          gs.setView([view[0], view[1]], [view[2], view[3]]);
          drawDFA(v, gs, G, W.D, { color: (id) => (+id.slice(1) < t ? 'blue' : 'orange'), start: true });
          gs.corner(`tail ${t} · cycle ${c}`, 'tl', { color: 'muted', weight: 700, size: 12.5 });
          // language of the machine: length n accepted iff acc(state after n letters)
          const mach = (n) => (n < t ? acc(n) : acc(t + ((n - t) % c)));
          const tg = TARGET[mode.value], L = (n) => (tg ? tg(n) : mach(n));
          const P = pen(ls, v), cw = Math.min(20, (P.W - 40) / N), x0 = Math.round((P.W - N * cw) / 2 + 0), y1 = 50, y2 = 128;
          P.sans('n ∈ S   (a^n accepted)', x0, y1 - 34, { align: 'left', size: 12.5, weight: 700, color: 'muted' });
          P.sans(`n + c = n + ${c}  ∈ S`, x0, y2 - 14, { align: 'left', size: 12.5, weight: 700, color: 'muted' });
          let bad = 0, firstBad = -1, wrong = 0, firstWrong = -1;
          for (let n = 0; n < N; n++) {
            const inT = n < t, a = L(n), b = n + c < N ? L(n + c) : null, ok = b === a;
            P.box(x0 + n * cw, y1, cw - 1.5, cw - 1.5, { r: 2, fill: a ? 'green' : 'faint', alpha: a ? 0.7 : 0.25, stroke: inT ? 'blue' : 'orange', width: 1.4 });
            if (n % 5 === 0 || n < 3) P.text(String(n), x0 + n * cw + cw / 2 - 1, y1 - 4, { size: 9.5, color: 'faint', baseline: 'bottom' });
            if (b !== null) {
              const mis = n >= t && !ok; if (mis) { bad++; if (firstBad < 0) firstBad = n; }
              P.box(x0 + n * cw, y2, cw - 1.5, cw - 1.5, { r: 2, fill: b ? 'green' : 'faint', alpha: b ? 0.7 : 0.25, stroke: mis ? 'red' : n >= t ? 'orange' : 'faint', width: mis ? 2.6 : 1.2 });
            }
            if (tg && n >= 0 && mach(n) !== L(n)) { wrong++; if (firstWrong < 0) firstWrong = n; P.text('×', x0 + n * cw + cw / 2 - 1, y1 + cw + 8, { size: 12, weight: 700, color: 'red' }); }
          }
          // brackets for the tail and the first periods
          P.line(x0, y1 + cw + 22, x0 + t * cw - 2, y1 + cw + 22, { color: 'blue', width: 3 }); if (t > 0) P.sans(`tail t = ${t}`, x0, y1 + cw + 40, { align: 'left', size: 11.5, weight: 700, color: 'blue' });
          for (let k = 0; t + (k + 1) * c <= N && k < 8; k++) { const xa = x0 + (t + k * c) * cw; P.line(xa + 1, y1 + cw + 22, xa + c * cw - 3, y1 + cw + 22, { color: k % 2 ? 'orange' : 'gold', width: 3 }); }
          P.sans(`period c = ${c}`, x0 + (t + c / 2) * cw + (t > 0 ? 30 : 0), y1 + cw + 40, { align: t > 0 ? 'left' : 'center', size: 11.5, weight: 700, color: 'orange' });
          P.line(x0 + t * cw - 1, y1 - 2, x0 + t * cw - 1, y2 + cw + 4, { color: 'muted', dash: true });
          if (tg) P.sans('red ×: the lasso machine and the language differ at this length', x0, y2 + cw + 28, { align: 'left', size: 11.5, color: 'red' });
          // largest t+c that fits the language, searched over t + c <= 20
          let fit = null;
          if (tg) { for (let s = 2; s <= 20 && !fit; s++) for (let cc = 1; cc < s && !fit; cc++) { const tt0 = s - cc; let ok = true; for (let n = tt0; n + cc < N; n++) if (tg(n) !== tg(n + cc)) { ok = false; break; } if (ok) fit = [tt0, cc]; } }
          info = { bad, firstBad, wrong, firstWrong, fit, tg: !!tg, machLang: [...Array(12).keys()].filter(mach).join(', ') };
        });
        v.legend([['blue', 'tail states / lengths n < t', { dot: true }], ['orange', 'cycle states / lengths n ≥ t', { dot: true }], ['green', 'accepted length', { dot: true }], ['red', 'n ≥ t with L(n) ≠ L(n+c)', { dot: true }]]);
        v.readout(() => {
          const I = info;
          if (!I.tg) return `The machine accepts $a^n$ for $n\\in\\{${I.machLang},\\dots\\}$; from $n=t=${tS.value}$ on, $n\\in S\\iff n+${cS.value}\\in S$ (${I.bad ? '**violated**' : 'checked for all $n<' + (48 - cS.value) + '$ ✓'}). Click states to change the accepting set — the periodicity never breaks.`;
          return `For this ${mode.value === 'prime' ? 'language' : 'language'}, the shifted row disagrees with the top row at ${I.bad} lengths $n\\ge t$ (first: $n=${I.firstBad}$); the lasso built from the first $t+c$ lengths errs at ${I.wrong} of 48 lengths (first: $n=${I.firstWrong}$). ${I.fit ? `A period does fit the window (t=${I.fit[0]}, c=${I.fit[1]}), which is only an accident of the window.` : 'No $(t,c)$ with $t+c\\le20$ fits any longer — the gaps keep growing.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Theorem',
      name: 'Two-way automata recognize only regular languages',
      statement: String.raw`A **two-way DFA** reads the tape $\vdash w\dashv$ with a head that, in each step, changes state according to the current state and symbol and moves one cell **left or right**; it accepts when it enters its accepting state, and may revisit cells arbitrarily often. The languages accepted by two-way DFAs (and by two-way NFAs) are exactly the regular languages: every two-way automaton with $n$ states can be simulated by a one-way DFA, at the price of a possibly exponentially larger state set.`,
      idea: String.raw`Look at the boundary between two adjacent cells: the **crossing sequence** records the states in which the head crosses it, alternately to the right and to the left. In a halting deterministic run no state occurs twice in the same direction at the same boundary (the run would loop), so a crossing sequence has length $\le2|Q|$ and there are finitely many. If the crossing sequences at two boundaries are **equal**, the part of the tape between them can be cut out or repeated without changing the outcome, because the left side only sees the same conversation from the right. Hence two prefixes with the same behaviour table are indistinguishable by every suffix, the Myhill–Nerode relation (4.4) has finite index and 4.5 applies.`,
      caption: String.raw`Pick a two-way machine and type an input. The diagram plots the head's journey (time runs downwards, one row per step) and, under every cell boundary, the **crossing sequence** (→ = crossing to the right, ← = to the left). Choose two boundaries with the sliders (or press *find an equal pair*): when their sequences coincide the string between them can be deleted or doubled and the verdict is the same; when they differ it can change. The readout counts the crossing sequences over all inputs of length $\le7$ — a small finite set.`,
      deps: ['toc-4.5', 'toc-2.1'],
      refs: ['Sipser §1.4'],
      credit: 'Rabin & Scott, 1959; Shepherdson, 1959',
      scope: String.raw`Shepherdson's paper (IBM J. Res. Dev. 3(2), 198–200, 1959) and Rabin–Scott (same issue, 114–125) were checked against Crossref; the crossing-sequence argument is the classical textbook presentation, not attributed here.`,
      tags: ['two-way automata', 'crossing sequences', 'Myhill–Nerode'],
      viz(v) {
        const LT = '⊢', RT = '⊣';
        const MACH = {
          fl: {
            name: 'first symbol = last symbol', alpha: ['a', 'b'], start: 's',
            delta: (q, c) => {
              if (q === 's') return ['f', 1];
              if (q === 'f') return c === 'a' ? ['A', 1] : c === 'b' ? ['B', 1] : ['acc', -1];
              if (q === 'A' || q === 'B') return c === RT ? ['L' + q, -1] : [q, 1];
              if (q === 'LA') return c === 'a' ? ['acc', 1] : ['rej', 1];
              if (q === 'LB') return c === 'b' ? ['acc', 1] : ['rej', 1];
              return ['rej', 1];
            },
            def: 'abbaba',
          },
          third: {
            name: '3rd symbol from the end is 1', alpha: ['0', '1'], start: 'r',
            delta: (q, c) => {
              if (q === 'r') return c === RT ? ['l1', -1] : ['r', 1];
              if (q === 'l1') return c === LT ? ['rej', 1] : ['l2', -1];
              if (q === 'l2') return c === LT ? ['rej', 1] : ['l3', -1];
              if (q === 'l3') return c === '1' ? ['acc', 1] : ['rej', 1];
              return ['rej', 1];
            },
            def: '010110',
          },
        };
        let key = 'fl', w = MACH.fl.def;
        const showKeys = () => { for (const c of ['0', '1', 'a', 'b']) keys[c].hidden = !MACH[key].alpha.includes(c); };
        const sel = v.select('machine', [{ value: 'fl', label: 'first symbol = last symbol' }, { value: 'third', label: '3rd symbol from the end is 1' }], 'fl', { onChange: (k) => { key = k; w = MACH[k].def; showKeys(); } });
        const keys = keypad(v, ['0', '1', 'a', 'b'], () => w, (x) => { w = x; }, { max: 9 });
        showKeys();
        const iS = v.slider('cut boundary $i$', 0, 9, 1, { int: true }), jS = v.slider('cut boundary $j$', 1, 9, 4, { int: true });
        v.button('find an equal pair', () => { const R = simulate(MACH[key], w); outer: for (let i = 0; i <= w.length; i++) for (let j = i + 1; j <= w.length; j++) if (seqKey(R.seq[i]) === seqKey(R.seq[j]) && R.seq[i].length) { iS.set(i); jS.set(j); break outer; } });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 440, full: true });
        const seqKey = (q) => q.map((e) => e[0] + (e[1] > 0 ? '>' : '<')).join(' ');
        function simulate(M, str) {
          const n = str.length, tape = [LT, ...str, RT], trace = [{ p: 0, q: M.start }], seq = Array.from({ length: n + 1 }, () => []);
          let p = 0, q = M.start, fin = null;
          for (let step = 0; step < 400; step++) {
            const [q2, d] = M.delta(q, tape[p]), p2 = Math.max(0, Math.min(n + 1, p + d)), b = d > 0 ? p : p - 1;
            if (b >= 0 && b <= n && p2 !== p) seq[b].push([q2, d]);
            q = q2; p = p2; trace.push({ p, q });
            if (q === 'acc' || q === 'rej') { fin = q; break; }
          }
          return { trace, seq, acc: fin === 'acc', fin, tape };
        }
        const verdict = (R) => (R.fin === 'acc' ? 'accept' : R.fin === 'rej' ? 'reject' : 'no halt');
        // crossing-sequence census over all short inputs
        const census = {};
        const getCensus = () => { if (!census[key]) { const set = new Map(); let longest = 0; for (const u of upTo(MACH[key].alpha, 7)) { const R = simulate(MACH[key], u); for (const sq of R.seq) { set.set(seqKey(sq), 1); longest = Math.max(longest, sq.length); } } census[key] = { n: set.size, longest, strings: (2 ** 8) - 1 }; } return census[key]; };
        let info = null;
        v.render(() => {
          const M = MACH[key], str = w.split('').filter((c) => M.alpha.includes(c)).join(''), n = str.length;
          if (str !== w) w = str;
          const iV = Math.min(iS.value, n), jV = Math.max(Math.min(jS.value, n), Math.min(iV + 1, n));
          if (iV !== iS.value) iS.set(iV); if (jV !== jS.value) jS.set(jV);
          const R = simulate(M, str), P = pen(s, v), cells = n + 2, cw = Math.min(54, (P.W - 70) / cells), x0 = 46, rows = R.trace.length;
          const rh = Math.min(24, (P.H - 230) / Math.max(rows, 1)), y0 = 62;
          const bx = (b) => x0 + (b + 1) * cw;
          const eq = seqKey(R.seq[iV]) === seqKey(R.seq[jV]);
          // shading between the two chosen boundaries
          if (jV > iV) P.box(bx(iV), 44, bx(jV) - bx(iV), y0 + rows * rh - 36 + 8, { r: 0, fill: eq ? 'green' : 'red', alpha: 0.1, stroke: false });
          R.tape.forEach((ch, c) => { P.box(x0 + c * cw, 12, cw - 2, 26, { r: 4, fill: c === 0 || c === n + 1 ? 'faint' : 'blue', alpha: 0.18, stroke: c === 0 || c === n + 1 ? 'muted' : 'blue' }); P.text(ch, x0 + c * cw + cw / 2 - 1, 25.5, { size: 15, weight: 600 }); });
          for (let b = 0; b <= n; b++) P.line(bx(b) - 1, 44, bx(b) - 1, y0 + rows * rh + 4, { color: b === iV || b === jV ? (eq ? 'green' : 'red') : 'faint', width: b === iV || b === jV ? 2 : 1, dash: !(b === iV || b === jV) });
          const pts = R.trace.map((t, k) => [x0 + t.p * cw + cw / 2 - 1, y0 + k * rh]);
          P.path(pts, { color: 'gold', width: 2.4 });
          R.trace.forEach((t, k) => { if (k === 0 || k === R.trace.length - 1 || rh >= 11) P.text(t.q, pts[k][0] + (k && R.trace[k - 1].p > t.p ? -6 : 6), pts[k][1] - 1, { size: 9.5, color: k === R.trace.length - 1 ? (R.acc ? 'green' : 'red') : 'muted', align: R.trace[k - 1] && R.trace[k - 1].p > t.p ? 'right' : 'left', halo: true }); });
          // crossing sequences
          const yb = y0 + rows * rh + 24;
          P.sans('crossing sequences', 6, yb - 6, { align: 'left', size: 10.5, color: 'muted', weight: 600 });
          for (let b = 0; b <= n; b++) {
            const sq = R.seq[b], hi = b === iV || b === jV;
            if (hi) P.box(bx(b) - cw / 2 + 2, yb, cw - 4, 14 * Math.max(sq.length, 1) + 6, { r: 4, stroke: eq ? 'green' : 'red', width: 2 });
            sq.forEach((e, k) => P.text(`${e[0]}${e[1] > 0 ? '→' : '←'}`, bx(b) - 1, yb + 11 + k * 14, { size: 11, weight: 600, color: e[1] > 0 ? 'blue' : 'orange' }));
            if (!sq.length) P.text('—', bx(b) - 1, yb + 11, { size: 11, color: 'faint' });
          }
          // splice results
          const cut = str.slice(0, iV) + str.slice(jV), dbl = str.slice(0, jV) + str.slice(iV, jV) + str.slice(jV);
          const Rc = simulate(M, cut), Rd = simulate(M, dbl);
          const ys = P.H - 38;
          const line = (lab, ww, RR, y) => { P.sans(`${lab}`, 8, y, { align: 'left', size: 11, color: 'muted', weight: 600 }); P.text(ww === '' ? 'ε' : ww, 250, y, { align: 'left', size: 13 }); P.sans(verdict(RR), P.W - 12, y, { align: 'right', size: 13, weight: 700, color: RR.acc ? 'green' : 'red' }); };
          line('w', str, R, ys - 14); line(`w with cells ${iV + 1}…${jV} deleted`, cut, Rc, ys + 6); line(`w with cells ${iV + 1}…${jV} doubled`, dbl, Rd, ys + 26);
          info = { eq, iV, jV, same: R.acc === Rc.acc && R.acc === Rd.acc, R, n };
        });
        v.legend([['blue', 'crossing to the right (→)', { dot: true }], ['orange', 'crossing to the left (←)', { dot: true }], ['green', 'equal sequences at the two cuts', { dot: true }], ['red', 'different sequences', { dot: true }]]);
        v.readout(() => {
          const I = info, C = getCensus();
          return `The run takes ${I.R.trace.length - 1} steps and ends in **${I.R.fin || '—'}**. Cuts at $i=${I.iV}$, $j=${I.jV}$: sequences ${I.eq ? '**equal**' : '**different**'}; deleting or doubling the cells between them ${I.eq ? (I.same ? 'leaves the verdict unchanged ✓' : 'changes the verdict (should not happen!)') : (I.same ? 'happens to keep the verdict' : 'changes the verdict — allowed, the sequences differ')}.\nOver all ${C.strings} inputs of length $\\le7$ only **${C.n}** different crossing sequences occur, each of length $\\le${C.longest}$ (bound $2|Q|$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Definition',
      name: 'Büchi automata and ω-regular languages',
      statement: String.raw`A **Büchi automaton** is a finite automaton $B=(Q,\Sigma,\delta,q_0,F)$ (nondeterministic, $\delta:Q\times\Sigma\to\mathcal P(Q)$) that reads **infinite** words $\alpha=\alpha_0\alpha_1\alpha_2\cdots\in\Sigma^\omega$. A *run* is an infinite sequence $r_0r_1r_2\cdots$ with $r_0=q_0$ and $r_{i+1}\in\delta(r_i,\alpha_i)$; it is **accepting** if some state of $F$ occurs in it infinitely often. $L_\omega(B)$ is the set of words with an accepting run, and a language of infinite words is **ω-regular** if some Büchi automaton accepts it (equivalently, if it is a finite union of sets $UV^\omega$ with $U\subseteq\Sigma^*$ and $V\subseteq\Sigma^+$ regular). For an ultimately periodic word $\alpha=uv^\omega$ with $v\ne\varepsilon$ acceptance is decidable by looking for an accepting state on a reachable cycle.`,
      idea: String.raw`An arbitrary infinite run need not become periodic or settle onto a single cycle. The finite-graph lasso criterion is an **existence** statement: an accepting run has a recurrent accepting state, so a reachable nonempty cycle through it can be repeated to give an accepting witness. For the fixed ultimately periodic input $uv^\omega$ with $v\ne\varepsilon$, apply this criterion to pairs (automaton state, position in the stem/loop). That product preserves the required input letters. Reachable strongly connected components find a witness; an accepting singleton needs a self-loop. The demonstration is exact for each supplied ultimately periodic word, and does not infer arbitrary-word acceptance from a finite trace. For the finite-union characterization, let $U_q$ be labels of finite paths from the start to an accepting state $q$, and $V_q$ labels of nonempty loops from $q$ back to itself; these languages are regular and $L_\omega(B)=\bigcup_{q\in F}U_qV_q^\omega$. Nondeterministic Büchi automata recognize finitely many $a$ by guessing the final $a$ has passed. A deterministic one cannot: after each finite prefix followed by another $a$, its accepting run on an all-$b$ continuation must reach an accepting state after some positive number of $b$s. Repeating these choices constructs an accepted word with infinitely many $a$s, a contradiction.`,
      caption: String.raw`Choose a Büchi automaton and type the stem $u$ and the loop $v$ (the word is $uvvv\cdots$). Right: the run unrolled in time — a dot for every state the automaton can be in after reading $t$ letters, accepting states with a double ring; the gold path is a witness lasso (stem then loop) on which an accepting state recurs. The readout says whether such a lasso exists. Try *finitely many a*: it accepts $\mathtt{b}(\mathtt{ab})^\omega$ never, but $\mathtt{a}\,\mathtt{b}^\omega$ yes — only the guess "from now on only $b$" works.`,
      deps: ['toc-3.1'],
      refs: ['Vardi–Wilke, Automata: From Logics to Algorithms (2007), §2.1 pp. 651–653, Büchi definition and emptiness, §2.2/§2.3 nondeterminism', 'The UV^ω characterization follows by splitting an accepting run at recurring accepting-state visits'],
      credit: 'Büchi automata; precise treatment after Vardi & Wilke, Automata: From Logics to Algorithms (2007)',
      scope: String.raw`Author treatment: Vardi–Wilke §2.1, rather than the unrelated Sipser finite-automaton pointer or uninspected original pagination. The entered word must use only a,b and have a nonempty loop; invalid text is reported instead of silently deleting symbols or replacing the loop with a. For responsiveness the entered stem and loop have combined display limit 256; the theorem has no such limit. The time diagram displays at most 16 input steps, while exact SCC acceptance uses the whole finite stem/loop product. The both-infinitely-often example uses three states and requires both letters in the recurring input.`,
      tags: ['Büchi automata', 'ω-regular', 'infinite words'],
      links: { 'Full author treatment': 'https://www.cs.rice.edu/~vardi/papers/wal07.pdf' },
      viz(v) {
        const AUT = Object.fromEntries(Object.keys(buchiExamples()).map(k => [k, () => buchiExamples()[k]]));
        const sel = v.select('automaton', [{ value: 'inf', label: 'infinitely many a (deterministic)' }, { value: 'fin', label: 'finitely many a (needs a guess)' }, { value: 'both', label: 'a and b infinitely often' }], 'inf', { onChange: () => { N = AUT[sel.value](); G.sync(N); } });
        let u = 'b', w2 = 'ab', which = 'u';
        const ui = v.input('stem $u$', u, { width: 90, onChange: () => {} }), vi = v.input('loop $v$', w2, { width: 90 });
        const gs = v.stage({ x: [0, 10], y: [0, 7], axes: false, equal: true, height: 250, weight: 0.8, minWidth: 300 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, weight: 1.5, minWidth: 400 });
        let N = AUT.inf();
        const G = nfaGraph(v, gs, N, { r: 20, texSize: 16 });
        const clean = (s) => s.replace(/[^ab]/g, '');
        const analyse = buchiWord;
        let info = null;
        v.render(() => {
          const uu = ui.value, vv = vi.value, nu = uu.length, nv = vv.length;
          if (nu + nv > 256) { info = { error: 'Display limit: use a stem and loop with combined length at most 256.' }; const P = pen(ts, v); P.sans(info.error, P.W / 2, 100, { size: 12, color: 'red' }); return; }
          if (!/^[ab]*$/.test(uu) || !/^[ab]+$/.test(vv)) { info = { error: 'Use only a and b; the loop must contain at least one letter.' }; const P = pen(ts, v); P.sans(info.error, P.W / 2, 100, { size: 12, color: 'red' }); return; }
          const A = analyse(N, uu, vv), T = Math.min(16, nu + 4 * nv), letter = (t) => (t < nu ? uu[t] : vv[(t - nu) % nv]);
          // witness unrolled
          const seq = []; if (A.ok) { seq.push(...A.stem.map((x) => x[0])); while (seq.length <= T) for (let i = 1; i < A.cycle.length; i++) seq.push(A.cycle[i][0]); }
          const onStem = new Set(A.ok ? A.stem.map((x) => x[0]) : []), onCyc = new Set(A.ok ? A.cycle.map((x) => x[0]) : []);
          drawNFA(v, gs, G, N, { fill: (id) => (A.ok && onCyc.has(id) ? 'green' : A.ok && onStem.has(id) ? 'gold' : null) });
          gs.corner(N.name, 'tl', { color: 'muted', weight: 700, size: 12.5 });
          const P = pen(ts, v), nq = N.states.length, cw = Math.min(44, (P.W - 80) / (T + 1)), x0 = 56, rowY = (i) => 40 + i * 52;
          // sets of reachable states per time
          let S = [N.start]; const sets = [S];
          for (let t = 0; t < T; t++) { const nx = new Set(); for (const q of S) for (const r of N.delta[q]?.[letter(t)] || []) nx.add(r); S = [...nx]; sets.push(S); }
          N.states.forEach((s, i) => P.text(s.id, 22, rowY(i), { size: 13, weight: 600, color: s.acc ? 'ink' : 'muted' }));
          for (let t = 0; t < T; t++) for (const q of sets[t]) for (const r of N.delta[q]?.[letter(t)] || []) {
            const qi = N.states.findIndex((s) => s.id === q), ri = N.states.findIndex((s) => s.id === r), win = A.ok && seq[t] === q && seq[t + 1] === r;
            P.line(x0 + t * cw, rowY(qi), x0 + (t + 1) * cw, rowY(ri), { color: win ? 'gold' : 'muted', width: win ? 3.4 : 1.2, alpha: win ? 1 : 0.5 });
          }
          sets.forEach((st, t) => st.forEach((q) => {
            const i = N.states.findIndex((s) => s.id === q), acc = N.states[i].acc, win = A.ok && seq[t] === q;
            P.dot(x0 + t * cw, rowY(i), { r: win ? 7 : 5.5, color: win ? 'gold' : 'blue', hollow: false });
            if (acc) P.circle(x0 + t * cw, rowY(i), 11, { color: win ? 'gold' : 'ink', width: 1.6 });
          }));
          const yw = rowY(nq - 1) + 38;
          for (let t = 0; t < T; t++) { const inU = t < nu, col = inU ? XYZ.x : (Math.floor((t - nu) / nv) % 2 ? 'gold' : XYZ.y); P.box(x0 + t * cw + cw / 2 - 12, yw, 24, 24, { r: 4, fill: col, alpha: 0.25, stroke: col }); P.text(letter(t), x0 + t * cw + cw / 2, yw + 12, { size: 14, weight: 600 }); }
          if (nu > 0) P.sans(nu > T ? 'u (continues beyond view)' : 'u', x0 + Math.min(nu, T) * cw / 2, yw + 40, { size: 11.5, weight: 700, color: XYZ.x }); if (nu < T) P.sans('v v v … ↺', x0 + (nu + (T - nu) / 2) * cw, yw + 40, { size: 11.5, weight: 700, color: XYZ.y });
          info = { ...A, T, nu, nv, uu, vv };
        });
        v.legend([['gold', 'witness lasso (stem)', { dot: true }], ['green', 'states on the recurring loop', { dot: true }], ['ink', 'double ring = accepting state', { dot: true }]]);
        v.readout(() => {
          const I = info; if (I.error) return I.error; const wd = `${I.uu || 'ε'}(${I.vv})^ω`;
          if (!I.ok) return `$${I.uu ? tex(I.uu) : ''}(${tex(I.vv)})^\\omega$ is **rejected**: of the ${I.reach} reachable pairs (state, position in the word) none is accepting *and* on a cycle.`;
          return `$${I.uu ? tex(I.uu) : ''}(${tex(I.vv)})^\\omega$ is **accepted**: after the stem the run enters the loop $${I.cycle.slice(0, 5).map((x) => x[0]).join('\\to ')}${I.cycle.length > 5 ? '\\to\\cdots' : ''}$, which contains an accepting state, so it recurs forever. (${I.reach} reachable (state, position) pairs.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Method',
      name: 'Model checking with automata',
      statement: String.raw`To check that a finite-state system $S$ satisfies a property $\varphi$ specified in LTL (or otherwise having a Büchi-recognizable negation): (1) view $S$ as a Büchi automaton whose language $L_\omega(S)$ is the set of its infinite state-label traces (all states accepting); (2) build a Büchi automaton $B_{\neg\varphi}$ for the *negation* of the property; (3) form the product $S\times B_{\neg\varphi}$ (as in the product construction 2.6); (4) test it for **emptiness**: $S\models\varphi$ iff there is no reachable accepting state that lies on a cycle (2.7). A nonempty product yields a **counterexample** — a lasso $uv^\omega$, a finite stem and a loop, which is a behaviour of $S$ violating $\varphi$.`,
      idea: String.raw`$S$ violates $\varphi$ exactly when some run of $S$ satisfies $\neg\varphi$, i.e. when $L_\omega(S)\cap L_\omega(B_{\neg\varphi})\ne\varnothing$. The product accepts that intersection (the two automata move in lockstep on the labels of the system's states), so the question becomes emptiness of a Büchi automaton, which in a finite graph means: is an accepting node reachable from the start *and* on a cycle? Reachability and cycle search are linear in the size of the product (2.7), and the path found is the counterexample. For LTL, $B_{\neg\varphi}$ can be exponentially larger than the formula $\varphi$.`,
      caption: String.raw`Left: a traffic-light controller (each state shows the north–south and east–west lights). Right: its product with the automaton for the **negated** property, laid out with one column per controller state and one row per automaton state; reachable nodes are solid, an accepting product state has a double ring. Choose a property and **introduce a bug**: the emptiness search finds a violating lasso, highlighted in gold on both diagrams, and the slider replays the counterexample step by step. With the correct controller the product is empty for both chosen properties; a bug may affect only one of them.`,
      deps: ['toc-4.12', 'toc-2.7', 'toc-2.6'],
      refs: ['Vardi–Wilke, Automata: From Logics to Algorithms (2007), §2.1 pp. 652–653, §4.4 Theorem 4.11 and proof p. 707'],
      credit: 'Automata-theoretic model checking; author treatment by Vardi & Wilke (2007), §4.4',
      scope: String.raw`Original toy controller and explicit negation monitors, not data from a historical case study. System state labels are consumed once, including the initial state; all infinite controller paths are considered with **no fairness assumption**. A reachable accepting SCC with a genuine cycle gives a witness. The implementation now uses a linear SCC search plus witness extraction, not a fresh graph search from every accepting node. A bug irrelevant to the chosen property need not produce a counterexample. The replay input is bounded by the actual witness window and disabled when the product is empty.`,
      links: { 'Full author treatment': 'https://www.cs.rice.edu/~vardi/papers/wal07.pdf' },
      tags: ['model checking', 'Büchi automata', 'emptiness'],
      viz(v) {
        const LIGHT = { G: 'green', Y: 'gold', R: 'red' };
        const PROP = trafficProperties;
        const prop = v.select('property $\\varphi$', [{ value: 'safe', label: 'never both green' }, { value: 'live', label: 'north–south green infinitely often' }], 'safe');
        const bug = v.select('controller', [{ value: 'none', label: 'correct' }, { value: 'both', label: 'bug: both green' }, { value: 'stall', label: 'bug: may stall in all-red' }], 'both');
        const stS = v.slider('replay the counterexample', 0, 12, 0, { int: true });
        const ss = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1, minWidth: 340 });
        const ps = v.stage({ x: [0, 10], y: [0, 5], axes: false, height: 340, weight: 1.2, minWidth: 380 });
        const PG = v.graph(ps, { nodes: [], edges: [], layout: 'none', directed: true, r: 15, autoRadius: false, texSize: 11, draggable: false, edgeFontSize: 10 });
        const compute = () => trafficProduct(bug.value, prop.value);
        let C = compute(), key = '';
        let info = null;
        v.render(() => {
          const k = prop.value + bug.value; if (k !== key) { key = k; C = compute(); }
          const { S, PR, lasso } = C, P = pen(ss, v), n = S.st.length;
          // replay sequence of system states
          const seq = lasso ? [...lasso.stem.slice(0, -1), ...Array(8).fill(lasso.cycle.slice(0, -1)).flat()].slice(0, 13) : [];
          stS.input.max = String(Math.max(0, seq.length - 1)); stS.input.disabled = !lasso; if (stS.value > +stS.input.max) stS.set(+stS.input.max);
          const cur = lasso ? seq[stS.value] : null, curSys = cur ? cur.split('|')[0] : null;
          const inLasso = (id) => lasso && (lasso.stem.concat(lasso.cycle)).some((x) => x.split('|')[0] === id);
          const cx = P.W / 2, cy = P.H / 2 - 4, rx = P.W * 0.34, ry = P.H * 0.31;
          const pos = {}; S.st.forEach((s, i) => { if (s.id === 's6') pos[s.id] = [cx, cy]; else { const a = -Math.PI / 2 + (2 * Math.PI * i) / 6; pos[s.id] = [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; } });
          const lassoEdge = (a, b) => lasso && lasso.stem.concat(lasso.cycle).some((x, i, arr) => i + 1 < arr.length && x.split('|')[0] === a && arr[i + 1].split('|')[0] === b);
          for (const e of S.edges) {
            const [x1, y1] = pos[e.from], [x2, y2] = pos[e.to], hl = lassoEdge(e.from, e.to);
            if (e.from === e.to) { const pts = []; for (let t = 0; t <= 20; t++) { const a = (t / 20) * 2 * Math.PI * 0.9 + 0.3; pts.push([x1 + 36 + 18 * Math.cos(a) - 14, y1 + 24 + 18 * Math.sin(a) + 6]); } P.path(pts, { color: hl ? 'gold' : 'red', width: hl ? 3 : 2 }); continue; }
            const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d, tr = 34;
            P.arrow(x1 + ux * tr, y1 + uy * tr, x2 - ux * (tr + 2), y2 - uy * (tr + 2), { color: hl ? 'gold' : e.bug ? 'red' : 'muted', width: hl ? 3.4 : e.bug ? 2.2 : 1.6, dash: e.bug && !hl });
          }
          S.st.forEach((s) => {
            const [x, y] = pos[s.id], on = s.id === curSys;
            P.box(x - 30, y - 24, 60, 48, { r: 8, fill: on ? 'gold' : 'panel', alpha: on ? 0.3 : 1, stroke: on ? 'gold' : inLasso(s.id) ? 'gold' : 'muted', width: on ? 3 : 1.4 });
            P.dot(x - 11, y - 6, { r: 7, color: LIGHT[s.ns], hollow: false }); P.dot(x + 11, y - 6, { r: 7, color: LIGHT[s.ew], hollow: false });
            P.sans('NS', x - 11, y + 8, { size: 9, color: 'muted' }); P.sans('EW', x + 11, y + 8, { size: 9, color: 'muted' });
            P.text(s.id, x, y + 18, { size: 9.5, color: 'faint' });
          });
          ss.setTitle(`controller${bug.value === 'none' ? '' : ' (bug injected)'}`);
          // product graph
          const colX = (id) => 0.9 + (S.st.findIndex((s) => s.id === id)) * (8.2 / Math.max(n - 1, 1)), rowY = (m) => (m === 'm0' ? 3.4 : 1.2);
          const nodes = C.nodes.map((id) => { const [s, m] = id.split('|'); return { id, x: colX(s), y: rowY(m), label: `$${s.slice(1)},${m.slice(1)}$` }; });
          const edges = []; const ci = (id) => S.st.findIndex((x) => x.id === id.split('|')[0]);
          for (const a of C.nodes) for (const b of C.succ[a]) { const d = Math.abs(ci(a) - ci(b)); edges.push({ from: a, to: b, directed: true, ...(d > 1 && a.split('|')[1] === b.split('|')[1] ? { bend: 14 + 10 * d } : {}) }); }
          PG.set({ nodes, edges });
          const hlE = (e) => lasso && lasso.stem.concat(lasso.cycle).some((x, i, arr) => i + 1 < arr.length && x === e.from && arr[i + 1] === e.to);
          PG.draw({
            nodeLabel: (id, nd) => nd.label,
            nodeRing: (id) => (PR.acc.includes(id.split('|')[1]) ? 'ink' : null),
            nodeFill: (id) => (id === cur ? 'gold' : lasso && lasso.stem.concat(lasso.cycle).includes(id) ? 'orange' : null),
            nodeColor: (id) => (C.order.has(id) ? 'accent' : 'faint'),
            edgeColor: (e) => (hlE(e) ? 'gold' : null), edgeWidth: (e) => (hlE(e) ? 3.2 : null),
            dim: C.nodes.filter((id) => !C.order.has(id)),
          });
          ps.setTitle(`product with $B_{\\neg\\varphi}$ for ${PR.neg}`);
          ps.text('automaton state $m_0$', 0.2, 4.3, { align: 'left', color: 'muted', size: 11.5 }); ps.text('automaton state $m_1$ (accepting)', 0.2, 0.2, { align: 'left', color: 'muted', size: 11.5 });
          info = { lasso, reach: C.order.size, total: C.nodes.length, n, curSys, len: seq.length };
        });
        v.legend([['gold', 'counterexample lasso / current replay step', { dot: true }], ['red', 'bug arrows', { dot: true }], ['ink', 'double ring = accepting product state', { dot: true }]]);
        v.readout(() => {
          const I = info, PR = PROP[prop.value];
          if (!I.lasso) return `Property “${PR.name}”: the product has ${I.reach} reachable of ${I.total} nodes and **no accepting node on a cycle** — the language is empty, so the controller **satisfies** the property.`;
          const name = (x) => x.split('|')[0];
          return `Property “${PR.name}” **fails**. Counterexample: stem $${I.lasso.stem.slice(0, -1).map(name).join('\\,')}$, then the loop $(${I.lasso.cycle.slice(0, -1).map(name).join('\\,')})^\\omega$ — found as an accepting product node that lies on a cycle (${I.reach} of ${I.total} nodes reachable). Replay position ${stS.value}: system state $${I.curSys}$.`;
        });
      },
    },
  ],
};
