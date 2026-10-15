// Theory of Computation — Chapter 2: Finite automata (items 2.1–2.6; 2.7–2.12 in ch02-b.js)
import { EPS, DEAD, sh, layer, upTo, SANS, pen, clickPx, keypad, dfa, cloneD, tgt, isAcc, check, step, run, dfaGraph, drawDFA, drawTape, PRESETS, deltaValue, rowLabel, cycleTarget, texName } from './ch02.shared.js';

const plainName = (D, q) => (q === DEAD ? DEAD : String(D.states.find((s) => s.id === q)?.label ?? q).replace(/\$|\\mathrm|[{}]/g, '').replace(/_/g, ''));
const texState = (D, q) => (q === DEAD ? '\\varnothing' : String(D.states.find((s) => s.id === q)?.label ?? q).replace(/\$/g, ''));
const tt = (u) => (u ? `\\mathtt{${u}}` : '\\varepsilon');
/** Add an explicit dead state 'qd' that receives every missing arrow (so the automaton becomes complete). */
function complete(D, at = [8.6, 0.9]) {
  const E = cloneD(D); const miss = check(E).missing;
  if (!miss.length) return E;
  E.states.push({ id: 'qd', x: at[0], y: at[1], acc: false, label: '$\\varnothing$' });
  E.delta.qd = {}; for (const c of E.alpha) E.delta.qd[c] = ['qd'];
  for (const [q, c] of miss) E.delta[q][c] = ['qd'];
  E.loops = { ...(E.loops || {}), qd: 0 };
  return E;
}
/** Accepted strings of each length 0..n (null if D is not deterministic). */
function language(D, n) { if (!check(D).ok) return null; const out = []; for (let k = 0; k <= n; k++) out.push(layer(D.alpha, k).filter((u) => run(D, u).acc)); return out; }
/** Chips listing the accepted strings, one row per length, with counts. */
function drawLanguage(P, L, alpha, o = {}) {
  const rh = o.rh ?? 22, top = o.top ?? 8;
  L.forEach((row, k) => {
    const y = top + k * rh; let x = 62;
    P.sans(`|w| = ${k}`, 10, y + rh / 2, { align: 'left', size: 11, color: 'muted' });
    const tot = alpha.length ** k;
    P.text(`${row.length} / ${tot}`, P.W - 10, y + rh / 2, { align: 'right', size: 11.5, weight: 600, color: row.length ? 'green' : 'muted' });
    let shown = 0;
    for (const u of row) {
      const wpx = P.tw(sh(u), 11.5) + 10;
      if (x + wpx > P.W - 120) { P.sans(`+ ${row.length - shown} more`, x + 2, y + rh / 2, { align: 'left', size: 11, color: 'muted' }); break; }
      P.box(x, y + 2, wpx, rh - 5, { r: 4, fill: 'green', alpha: 0.16, stroke: 'green', strokeAlpha: 0.6 });
      P.text(sh(u), x + wpx / 2, y + rh / 2, { size: 11.5, color: 'ink' });
      x += wpx + 5; shown++;
    }
    if (!row.length) P.text('—', x + 6, y + rh / 2, { size: 12, color: 'faint' });
  });
}

export default {
  collection: 'toc',
  chapter: 2,
  title: 'Finite automata',
  summary: String.raw`A finite automaton reads its input once, left to right, remembering only which of finitely many states it is in. The languages such machines accept, the regular languages, are closed under complement, union and intersection, and every natural question about a given automaton — is its language empty, infinite, equal to another — is answered by searching its state graph. The model is everywhere in practice, from text search and protocol controllers to digital circuits, and even a question as innocent-looking as how fast a machine can be reset is still open.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Deterministic finite automaton',
      statement: String.raw`A **deterministic finite automaton** (DFA) is a 5-tuple $M=(Q,\Sigma,\delta,q_0,F)$ where
(a) $Q$ is a finite set of **states**;
(b) $\Sigma$ is a finite input alphabet;
(c) $\delta: Q\times\Sigma\to Q$ is the **transition function** — a *total* function: exactly one next state for every state and symbol;
(d) $q_0\in Q$ is the **start state**;
(e) $F\subseteq Q$ is the set of **accepting** states.

On input $w=w_1\cdots w_n$ the machine computes $r_0=q_0$, $r_i=\delta(r_{i-1},w_i)$ and **accepts** if $r_n\in F$. It is drawn as a state diagram: one circle per state, an arrow $q\xrightarrow{a}\delta(q,a)$ for each pair, double circles for $F$ and an entering arrow at $q_0$. A diagram that omits some arrows is shorthand for one extra non-accepting **dead state** that receives all missing arrows and loops on every symbol; a diagram with two arrows for the same state and symbol is not a DFA at all.`,
      idea: String.raw`The only memory a DFA has is its current state, so everything it will ever do with the rest of the input depends on the prefix read so far only through which of the $|Q|$ states that prefix led to. Determinism makes the run on each input unique, which is what lets us speak of *the* answer; totality is a convenience, since any missing arrow can be redirected to a trap state without changing which strings are accepted.`,
      caption: String.raw`Build a machine: **drag** states, **click a state** to make it accepting or not, **click a table cell** to cycle the target of that arrow (through every state, then "missing"), click a row name to make it the start state, add or remove states with the buttons. Type an input with the letter keys and step through the run: the gold state is the current one, ending green (accept) or red (reject). Break it: a missing arrow sends the run into the implicit dead state $\varnothing$ (toggle to draw it); allowing two targets in a cell makes it *not a DFA*, and the run is no longer defined.`,
      deps: ['toc-1.1'],
      refs: ['Sipser §1.1'],
      credit: 'McCulloch & Pitts 1943; Kleene 1956; Rabin & Scott 1959',
      tags: ['automata', 'regular languages'],
      viz(v) {
        let D = PRESETS.endsAB(), w = 'abab', nextId = 3;
        const preset = v.select('machine', [{ value: 'endsAB', label: 'ends in ab' }, { value: 'evenA', label: 'even # of a' }, { value: 'noAA', label: 'no aa (incomplete)' }, { value: 'nfa', label: 'two a-arrows' }], 'endsAB', {
          onChange: (k) => { D = PRESETS[k](); nextId = D.states.length; refresh(); },
        });
        const multiT = v.toggle('cells may hold two targets', false);
        const deadT = v.toggle('draw the dead state', false, { onChange: () => refresh() });
        const nS = v.slider('list strings up to length', 1, 6, 4, { int: true });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 290, weight: 1.5 });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 290, weight: 1 });
        const tp = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 64, full: true });
        const ls = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 158, full: true });
        const G = dfaGraph(v, gs, D, { deadAt: [8.8, 0.9] });
        const T = v.table(tb, { rows: 3, cols: 2, maxCell: 50, size: 15, square: false, cellAspect: 1.35, labelSize: 14 });
        G.onClick = ({ node }) => { if (node && node.id !== DEAD) { node.acc = !node.acc; refresh(); } return true; };
        tb.onClick((x, y) => {
          const c = T.hit(x, y); if (!c) return; const q = D.states[c.i]?.id; if (!q) return;
          if (c.header === 'row') D.start = q; else if (c.j >= 0 && c.i >= 0) cycleTarget(D, q, D.alpha[c.j], multiT.value);
          refresh();
        });
        const freeSpot = () => {
          const cands = []; for (let x = 1; x <= 9; x += 1.6) for (let y = 1; y <= 6.4; y += 1.35) cands.push([x, y]);
          let best = cands[0], bd = -1;
          for (const [x, y] of cands) { const d = Math.min(...D.states.map((s) => Math.hypot(s.x - x, s.y - y)), deadT.value ? Math.hypot(8.8 - x, 0.9 - y) : 99); if (d > bd) { bd = d; best = [x, y]; } }
          return best;
        };
        v.button('+ state', () => {
          if (D.states.length >= 7) return;
          while (D.states.some((s) => s.id === 'q' + nextId)) nextId++;
          const id = 'q' + nextId++, [x, y] = freeSpot();
          D.states.push({ id, x, y, acc: false, label: texName(id) }); D.delta[id] = {}; for (const c of D.alpha) D.delta[id][c] = [];
          refresh();
        });
        v.button('− state', () => {
          if (D.states.length <= 1) return;
          const gone = [...D.states].reverse().find((s) => s.id !== D.start); if (!gone) return;
          D.states = D.states.filter((s) => s !== gone); delete D.delta[gone.id];
          for (const q in D.delta) for (const c of D.alpha) D.delta[q][c] = D.delta[q][c].filter((r) => r !== gone.id);
          refresh();
        });
        keypad(v, ['a', 'b'], () => w, (x) => { w = x; S.reset({ at: 'end' }); }, { max: 12 });
        const frames = () => {
          const r = run(D, w), out = [], N = (q) => `$${texState(D, q)}$`;
          out.push({ k: 0, note: `Start in the start state ${N(D.start)}${w ? '' : '; the input is empty, so the machine stops at once'}.` });
          for (let k = 1; k < r.path.length; k++) {
            const p = r.path[k - 1], q = r.path[k], c = w[k - 1];
            out.push({ k, note: p === DEAD ? `Read **${c}**: the dead state loops on every symbol.` : k - 1 === r.fell ? `Read **${c}**: there is no arrow $\\delta(${texState(D, p)}, \\mathtt{${c}})$ — the run drops into the implicit dead state $\\varnothing$, which it never leaves.` : `Read **${c}**: $\\delta(${texState(D, p)}, \\mathtt{${c}}) = ${texState(D, q)}$.` });
          }
          if (r.stuck >= 0) {
            const p = r.path[r.path.length - 1], c = w[r.stuck];
            out.push({ k: r.path.length - 1, stuck: true, note: `$\\delta(${texState(D, p)}, \\mathtt{${c}}) = \\{${tgt(D, p, c).map((q) => texState(D, q)).join(', ')}\\}$: two possible next states. This is **not a DFA**, and "the" run is not defined.` });
          } else {
            const last = out[out.length - 1], q = r.path[r.path.length - 1];
            last.note += r.acc ? ` The input is used up in ${N(q)}, an accepting state: **accept**.` : ` The input is used up in ${N(q)}, which is not accepting: **reject**.`;
            last.final = true;
          }
          return out;
        };
        const S = v.steps({ frames, speed: 1.6, still: 3 });
        function refresh() { G.sync(D, { dead: deadT.value }); S.reset({ at: 'end' }); }
        v.render(() => {
          const f = S.frame, r = run(D, w), k = f.k ?? 0, cur = r.path[k], prev = k > 0 ? r.path[k - 1] : null, ch = check(D);
          const done = f.final, col = done ? (r.acc ? 'green' : 'red') : f.stuck ? 'red' : 'gold';
          drawDFA(v, gs, G, D, {
            fill: (id) => (id === cur ? col : null),
            edgeColor: (e) => (prev != null && e.from === prev && e.to === cur && e.syms.includes(w[k - 1]) ? 'gold' : f.stuck && e.multi && e.from === cur ? 'red' : null),
            edgeWidth: (e) => (prev != null && e.from === prev && e.to === cur && e.syms.includes(w[k - 1]) ? 3.4 : null),
          });
          gs.corner(!ch.ok ? 'not a DFA' : done ? (r.acc ? 'accept' : 'reject') : `reading symbol ${k + 1} of ${w.length}`, 'tr', { color: !ch.ok ? 'red' : done ? (r.acc ? 'green' : 'red') : 'muted', weight: 700, size: 13 });
          // transition table
          const rows = D.states.map((s) => s.id);
          T.draw({
            rows: rows.length, cols: D.alpha.length, colLabels: D.alpha.map((c) => `$\\mathtt{${c}}$`), cornerLabel: '$\\delta$',
            rowLabels: rows.map((q) => rowLabel(D, q)),
            value: (i, j) => deltaValue(D, rows[i], D.alpha[j], deadT.value),
            fill: (i, j) => { const t = tgt(D, rows[i], D.alpha[j]); return prev === rows[i] && w[k - 1] === D.alpha[j] && !f.stuck ? ['gold', 0.4] : t.length > 1 ? ['red', 0.22] : !t.length ? ['orange', 0.18] : null; },
            textColor: (i, j) => { const t = tgt(D, rows[i], D.alpha[j]); return t.length > 1 ? 'red' : !t.length ? 'orange' : 'ink'; },
            activeRow: rows.indexOf(cur) >= 0 ? rows.indexOf(cur) : undefined, activeColor: col,
          });
          // tape
          drawTape(pen(tp, v), w, k, { path: r.path, name: (q) => plainName(D, q), finished: done || f.stuck, y0: 10, cell: 30 });
          // the language, listed and counted
          const Pl = pen(ls, v), L = language(D, nS.value);
          if (!L) {
            const [q, c] = ch.multi[0];
            Pl.sans(`Not a DFA: δ(${plainName(D, q)}, ${c}) has ${tgt(D, q, c).length} values, so a run is not determined and no language is defined.`, Pl.W / 2, Pl.H / 2 - 10, { size: 13, color: 'red', weight: 600 });
            Pl.sans('(Accepting when *some* run accepts is the nondeterministic automaton of Chapter 3.)', Pl.W / 2, Pl.H / 2 + 14, { size: 12, color: 'muted' });
          } else drawLanguage(Pl, L, D.alpha, { rh: Math.min(24, (Pl.H - 10) / (nS.value + 1)) });
        });
        v.legend([['gold', 'current state / arrow just taken', { dot: true }], ['green', 'accepted', { dot: true }], ['red', 'rejected, or two targets', { dot: true }], ['orange', 'missing arrow → dead state', { dot: true }]]);
        v.readout(() => {
          const r = run(D, w), ch = check(D), L = language(D, nS.value);
          const trace = r.path.map((q, i) => (i ? `\\xrightarrow{${w[i - 1]}}` : '') + texState(D, q)).join('');
          let s = `$${trace}$`;
          s += r.acc === null ? ' — stuck at a nondeterministic choice' : r.acc ? ' — **accept**' : ' — **reject**';
          if (ch.missing.length) s += ` · missing arrows: ${ch.missing.map(([q, c]) => `$\\delta(${texState(D, q)},\\mathtt{${c}})$`).join(', ')} (they go to the dead state)`;
          if (L) s += ` · $|L(M)\\cap\\Sigma^{\\le ${nS.value}}| = ${L.reduce((a, x) => a + x.length, 0)}$ of $${2 ** (nS.value + 1) - 1}$ strings`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Extended transition function and acceptance',
      statement: String.raw`For a DFA $M=(Q,\Sigma,\delta,q_0,F)$ the **extended transition function** $\hat\delta:Q\times\Sigma^*\to Q$ is defined by recursion on strings:
$$\hat\delta(q,\varepsilon)=q,\qquad \hat\delta(q,wa)=\delta\big(\hat\delta(q,w),a\big)\quad(w\in\Sigma^*,\ a\in\Sigma).$$
$\hat\delta(q,w)$ is the state reached from $q$ after reading $w$. $M$ **accepts** $w$ if $\hat\delta(q_0,w)\in F$, and the **language of $M$** is $L(M)=\{w\in\Sigma^* : \hat\delta(q_0,w)\in F\}$. By induction on $y$ (1.7), $\hat\delta(q,xy)=\hat\delta(\hat\delta(q,x),y)$ for all strings $x,y$.`,
      idea: String.raw`The recursion simply unrolls the run one symbol at a time, so $\hat\delta(q,w)$ is a path through a time-by-state grid: column $t$ holds the states, and the letter $w_t$ maps every state of column $t-1$ to a state of column $t$. Reading $xy$ is reading $x$ and then continuing from wherever $x$ left off, which is the composition law; and since each letter acts as a function $Q\to Q$, runs from different start states can merge but never split.`,
      caption: String.raw`Each column is one moment of the run; each letter between columns sends every state to its successor (thin grey arrows). The gold path is the run from $q_0$, and the state under each column is $\hat\delta(q_0,\text{prefix})$; the last column decides acceptance. Switch on **runs from every state** to see how runs merge. Drag the dashed split line to cut $w=xy$ and check $\hat\delta(q_0,xy)=\hat\delta(\hat\delta(q_0,x),y)$ in the readout.`,
      deps: ['toc-2.1', 'toc-1.7'],
      refs: ['Sipser §1.1'],
      tags: ['automata', 'induction'],
      viz(v) {
        let D = PRESETS.endsAB(), w = 'abbab';
        v.select('machine', [{ value: 'endsAB', label: 'ends in ab' }, { value: 'aMod3', label: '# of a divisible by 3' }, { value: 'hasABA', label: 'contains aba' }], 'endsAB', { onChange: (k) => { D = PRESETS[k](); } });
        const all = v.toggle('runs from every state', false);
        keypad(v, ['a', 'b'], () => w, (x) => { w = x; }, { max: 10 });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        const RUNC = ['gold', 'blue', 'purple', 'teal', 'pink'];
        let split = 2, geo = null;
        const sh0 = s.handle(0, 0, { color: 'accent', r: 7, constrain: (x, y) => [x, geo ? geo.H - geo.hy : y] });
        v.render(() => {
          const P = pen(s, v), n = w.length, Q = D.states.map((q) => q.id), m = Q.length;
          const x0 = 92, dx = Math.min(86, (P.W - x0 - 60) / Math.max(n, 1)), top = 56, dy = Math.min(64, (P.H - top - 70) / Math.max(m - 1, 1));
          const X = (t) => x0 + t * dx, Y = (i) => top + i * dy;
          geo = { H: P.H, hy: 30 };
          // split handle snaps to a column
          if (sh0.dragging) split = Math.max(0, Math.min(n, Math.round((sh0.x - x0) / dx)));
          split = Math.min(split, n);
          sh0.x = X(split); sh0.y = P.H - 30;
          // letters between columns
          for (let t = 0; t < n; t++) {
            P.box(X(t) + dx / 2 - 13, 12, 26, 26, { r: 4, fill: t < split ? 'blue' : 'orange', alpha: 0.12, stroke: t < split ? 'blue' : 'orange' });
            P.text(w[t], X(t) + dx / 2, 25.5, { size: 15, weight: 600, color: t < split ? 'blue' : 'orange' });
          }
          P.tex(`x = ${tt(w.slice(0, split))}`, X(split / 2), P.H - 54, { size: 14, color: 'blue' });
          P.tex(`y = ${tt(w.slice(split))}`, X((split + n) / 2), P.H - 54, { size: 14, color: 'orange' });
          // state labels and rows
          Q.forEach((q, i) => {
            P.tex(D.states[i].label.replace(/\$/g, ''), 30, Y(i), { size: 16, color: isAcc(D, q) ? 'green' : 'ink' });
            if (isAcc(D, q)) P.sans('accept', 52, Y(i) + 15, { size: 9.5, color: 'green', align: 'left' });
            P.line(X(0), Y(i), X(n), Y(i), { color: 'grid', width: 1 });
          });
          // every transition between consecutive columns
          for (let t = 0; t < n; t++) Q.forEach((q, i) => { const j = Q.indexOf(step(D, q, w[t])); P.line(X(t) + 6, Y(i), X(t + 1) - 6, Y(j), { color: 'faint', width: 1.2 }); });
          // runs
          const runs = (all.value ? Q : [D.start]).map((q0) => { const p = [q0]; for (const c of w) p.push(step(D, p[p.length - 1], c)); return p; });
          runs.forEach((p, r) => {
            const isMain = p[0] === D.start, col = isMain ? 'gold' : RUNC[1 + (Q.indexOf(p[0]) % 4)];
            P.path(p.map((q, t) => [X(t), Y(Q.indexOf(q)) + (isMain ? 0 : (Q.indexOf(p[0]) - 1.5) * 2.2)]), { color: col, width: isMain ? 4 : 2, alpha: isMain ? 1 : 0.8 });
          });
          // nodes
          const main = runs.find((p) => p[0] === D.start);
          for (let t = 0; t <= n; t++) Q.forEach((q, i) => {
            const on = main[t] === q, last = t === n;
            P.circle(X(t), Y(i), on ? 9 : 5, { fill: on ? (last ? (isAcc(D, q) ? 'green' : 'red') : 'gold') : 'panel', fillAlpha: 1, color: on ? 'panel' : 'muted', width: on ? 2 : 1.2 });
            if (last && isAcc(D, q)) P.circle(X(t), Y(i), 13, { color: 'green', width: 1.6 });
          });
          // δ̂(q0, prefix) under each column
          for (let t = 0; t <= n; t++) P.tex(texState(D, main[t]), X(t), Y(m - 1) + 30, { size: 13, color: t === split ? 'accent' : 'muted' });
          P.sans('δ̂(q₀, prefix):', X(0) - 12, Y(m - 1) + 30, { align: 'right', size: 11, color: 'muted' });
          // split line
          P.line(X(split), 6, X(split), P.H - 36, { color: 'accent', width: 1.6, dash: [6, 4] });
        });
        v.readout(() => {
          const x = w.slice(0, split), y = w.slice(split), r = run(D, x).path.at(-1);
          let q = r; for (const c of y) q = step(D, q, c);
          const full = run(D, w);
          return String.raw`$\hat\delta(q_0, ${tt(x)}) = ${texState(D, r)}$, then $\hat\delta(${texState(D, r)}, ${tt(y)}) = ${texState(D, q)}$ ${q === full.path.at(-1) ? '=' : '\\neq'} $\hat\delta(q_0, ${tt(w)})$ ✓ · ${full.acc ? '$\\in F$: **accept**' : '$\\notin F$: **reject**'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Regular language',
      statement: String.raw`A language $L\subseteq\Sigma^*$ is **regular** if $L=L(M)$ for some DFA $M$. Example: for any pattern $p$, the languages "avoids $p$ as a substring" and "contains $p$" are regular, recognised by the $(|p|+1)$-state automaton whose state is the longest prefix of $p$ that ends the input read so far.

A hallmark of regularity is that the counting sequence $a_n=|L\cap\Sigma^n|$ obeys a linear recurrence with constant coefficients: if $A$ is the $Q\times Q$ matrix counting the letters that lead from one state to another, then $a_n=e_{q_0}^{\top}A^n\mathbf 1_F$, so the generating function $\sum_n a_nx^n$ is a rational function $P(x)/Q(x)$ with $Q(x)=\det(I-xA)$.`,
      idea: String.raw`Counting accepted strings of length $n$ is counting paths of length $n$ from $q_0$ to $F$ in the state graph, which is dynamic programming over states: keep, for each state, the number of strings of the current length that end there, and push those numbers along the arrows one letter at a time. That is multiplication by $A$, and the Cayley–Hamilton theorem turns $\det(\lambda I-A)$ into a recurrence for $a_n$, hence a rational generating function — something no non-regular language need have.`,
      caption: String.raw`Type a pattern $p$ (letters, ⌫); the automaton tracking "how much of $p$ have I just seen" is drawn on the left. The table counts strings of each length three ways — brute force over all $2^n$ strings, dynamic programming over the states, and the coefficients of the rational generating function — and they agree. The barcode below shows every string of length up to 8 in dictionary order, green when it is in the language. Try $p = $ **aa** (Fibonacci numbers) and **ab** ($n+1$).`,
      deps: ['toc-2.2'],
      see: ['algo-13.4', 'comb-4.4'],
      refs: ['Sipser §1.1'],
      tags: ['regular languages', 'counting'],
      viz(v) {
        let p = 'aa';
        const mode = v.select('', [{ value: 'avoid', label: 'strings avoiding $p$' }, { value: 'contain', label: 'strings containing $p$' }], 'avoid');
        keypad(v, ['a', 'b'], () => p, (x) => { p = x || p; }, { max: 5, clear: false });
        const ds = v.stage({ x: [0, 10], y: [0, 5.6], axes: false, equal: true, height: 250, weight: 1 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, weight: 1.05 });
        const bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 170, full: true });
        const T = v.table(ts, { rows: 12, cols: 5, maxCell: 20, size: 12, labelSize: 11.5, square: false, cellAspect: 3.2, colLabels: ['n', '2ⁿ', 'brute force', 'DP', 'GF'] });
        let G = null, built = '';
        // the pattern automaton: state k = longest prefix of p that is a suffix of the input
        const build = () => {
          const m = p.length, delta = {}, states = [];
          for (let k = 0; k <= m; k++) {
            const id = 'q' + k, pre = p.slice(0, k);
            states.push([id, 1.7 + (k * 7.6) / Math.max(m, 1), 2.6, mode.value === 'avoid' ? k < m : k === m, `$${tt(pre)}$`]);
            delta[id] = {};
            for (const c of ['a', 'b']) {
              if (k === m) { delta[id][c] = id; continue; }
              const s0 = pre + c; let j = Math.min(m, s0.length); while (j > 0 && !s0.endsWith(p.slice(0, j))) j--;
              delta[id][c] = 'q' + j;
            }
          }
          const D = dfa(['a', 'b'], states, 'q0', delta, { startDir: 180, loops: Object.fromEntries(states.map(([id]) => [id, 90])) });
          return D;
        };
        let D = build();
        const counts = () => { // brute force, DP and generating function, n = 0..11
          const N = 11, F = D.states.map((s) => s.acc), idx = Object.fromEntries(D.states.map((s, i) => [s.id, i])), m = D.states.length;
          const brute = [], dp = []; let vec = D.states.map((_, i) => (i === 0 ? 1 : 0));
          for (let n = 0; n <= N; n++) {
            brute.push(layer(['a', 'b'], n).filter((u) => (mode.value === 'avoid') !== u.includes(p)).length);
            dp.push(vec.reduce((a, x, i) => a + (F[i] ? x : 0), 0));
            const nx = vec.map(() => 0); D.states.forEach((s, i) => { for (const c of ['a', 'b']) nx[idx[step(D, s.id, c)]] += vec[i]; }); vec = nx;
          }
          // useful states only (reachable and able to reach F), then det(λI − A) by Faddeev–LeVerrier
          const coreach = new Set(D.states.filter((s) => s.acc).map((s) => s.id)); let grow = true;
          while (grow) { grow = false; for (const s of D.states) if (!coreach.has(s.id) && ['a', 'b'].some((c) => coreach.has(step(D, s.id, c)))) { coreach.add(s.id); grow = true; } }
          const U = D.states.filter((s) => coreach.has(s.id)).map((s) => s.id), k = U.length;
          const A = U.map((a) => U.map((b) => ['a', 'b'].filter((c) => step(D, a, c) === b).length));
          let Mx = U.map((_, i) => U.map((_, j) => (i === j ? 1 : 0))); const c = [1];
          for (let t = 1; t <= k; t++) {
            const AM = A.map((row) => U.map((_, j) => row.reduce((acc, x, l) => acc + x * Mx[l][j], 0)));
            c.push(-AM.reduce((acc, row, i) => acc + row[i], 0) / t);
            Mx = AM.map((row, i) => row.map((x, j) => x + (i === j ? c[t] : 0)));
          }
          const Qp = c.map(Math.round), Pp = [];
          for (let t = 0; t < k; t++) { let sacc = 0; for (let j = 0; j <= t; j++) sacc += Qp[j] * dp[t - j]; Pp.push(sacc); }
          while (Pp.length > 1 && Pp[Pp.length - 1] === 0) Pp.pop();
          const gf = []; for (let n = 0; n <= N; n++) { let b = n < Pp.length ? Pp[n] : 0; for (let j = 1; j <= Math.min(n, k); j++) b -= Qp[j] * gf[n - j]; gf.push(b); }
          return { brute, dp, gf, P: Pp, Q: Qp, m };
        };
        const poly = (cs) => { let s = ''; cs.forEach((a, i) => { if (!a) return; const sgn = a < 0 ? '-' : s ? '+' : '', A = Math.abs(a), mon = i === 0 ? '' : i === 1 ? 'x' : `x^{${i}}`; s += `${sgn}${A === 1 && i ? '' : A}${mon}`; }); return s || '0'; };
        let C = counts();
        v.render(() => {
          const key = p + mode.value;
          if (key !== built) { built = key; D = build(); C = counts(); if (!G) G = dfaGraph(v, ds, D, { draggable: false, r: 17, texSize: 13.5 }); else G.sync(D); }
          // back edges bend below the chain so they do not cross the states in between
          for (const e of G.edges) { const a = +e.from.slice(1), b = +e.to.slice(1); e.bend = Math.abs(a - b) >= 2 ? (a > b ? -1 : 1) * (22 + 12 * Math.abs(a - b)) : undefined; }
          drawDFA(v, ds, G, D, {});
          ds.corner(mode.value === 'avoid' ? `avoid ${p}: ${p.length} accepting states` : `contain ${p}: 1 accepting state`, 'tl', { size: 12, color: 'muted', weight: 600 });
          T.draw({
            value: (i, j) => [i, 2 ** i, C.brute[i], C.dp[i], C.gf[i]][j],
            fill: (i, j) => (j >= 2 ? (C.brute[i] === C.dp[i] && C.dp[i] === C.gf[i] ? ['green', 0.12] : ['red', 0.3]) : null),
            textColor: (i, j) => (j <= 1 ? 'muted' : 'ink'), weight: (i, j) => (j >= 2 ? 600 : 500),
          });
          // barcode of Σ^{≤8}
          const P2 = pen(bs, v), rows = 9, rh = (P2.H - 8) / rows, L0 = 54, L1 = P2.W - 70;
          for (let n = 0; n < rows; n++) {
            const strs = layer(['a', 'b'], n), bw = (L1 - L0) / strs.length, y = 4 + n * rh; let hits = 0;
            P2.sans(`n = ${n}`, 10, y + rh / 2, { align: 'left', size: 10.5, color: 'muted' });
            strs.forEach((u, j) => { const isIn = run(D, u).acc; if (isIn) hits++; P2.box(L0 + j * bw, y + 2, Math.max(1, bw - (bw > 3 ? 1 : 0)), rh - 4, { r: bw > 6 ? 2 : 0, fill: isIn ? 'green' : 'faint', alpha: isIn ? 0.75 : 0.25, stroke: false }); });
            P2.text(`${hits}`, P2.W - 12, y + rh / 2, { align: 'right', size: 11, weight: 600, color: 'green' });
          }
        });
        v.legend([['green', 'string in the language', { dot: true }]]);
        v.readout(() => {
          const g = C.dp[11] / C.dp[10];
          return String.raw`$\sum_n a_n x^n = \dfrac{${poly(C.P)}}{${poly(C.Q)}}$ · all three counts agree for $n\le 11$ ✓ · growth $a_{11}/a_{10} = ${v.fix(g, 4)}$ (the largest eigenvalue of $A$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Method',
      name: 'States as finite memory: remainders mod k',
      statement: String.raw`To design a DFA, decide what must be remembered about the prefix read so far and make each possible "memory content" a state; the machine works if the memory after reading one more symbol can be computed from the old memory and that symbol alone. Example: binary numerals (read most significant bit first) whose value is divisible by $k$ are recognised by the DFA with states $Q=\{0,1,\dots,k-1\}$, start and only accepting state $0$, and
$$\delta(r,b)=(2r+b)\bmod k,$$
because appending a bit $b$ to a numeral of value $x$ gives $2x+b$, and $(2x+b)\bmod k$ depends only on $x\bmod k$. After reading a prefix, the state is that prefix's value modulo $k$.`,
      idea: String.raw`The value of the number grows without bound, but its remainder modulo $k$ takes only $k$ values and is updated by a rule that needs nothing else: $(2x+b)\bmod k=(2(x\bmod k)+b)\bmod k$. An induction on the prefix length (1.7) proves the invariant "state = value mod $k$". The same idea fails if the bits arrive least significant first: then appending a bit adds $b\cdot 2^i$, which depends on the position $i$ as well, so the remainder alone is no longer enough memory.`,
      caption: String.raw`Type a binary number (or press **random**) and step through it: the gold state is the remainder of the prefix read so far, and the table checks it against the true value at every step. Change $k$ and the machine is rebuilt with $k$ states and the rule $r\mapsto 2r+b$. Switch to **least significant bit first**: the same machine now computes the wrong remainder, flagged in red.`,
      deps: ['toc-2.1'],
      refs: ['Sipser §1.1'],
      tags: ['automata', 'design'],
      viz(v) {
        let bits = '10111';
        const kS = v.slider('$k$', 2, 9, 3, { int: true, onChange: () => { rebuild(); S.reset({ at: 'end' }); } });
        const order = v.select('feed bits', [{ value: 'msb', label: 'most significant first' }, { value: 'lsb', label: 'least significant first' }], 'msb', { onChange: () => S.reset({ at: 'end' }) });
        keypad(v, ['0', '1'], () => bits, (x) => { bits = x; S.reset({ at: 'end' }); }, { max: 12 });
        const rng = v.rng(7);
        v.button('random', () => { const n = rng.int(4, 10); bits = '1' + Array.from({ length: n - 1 }, () => (rng() < 0.5 ? '0' : '1')).join(''); S.reset({ at: 'end' }); });
        const gs = v.stage({ x: [-1.45, 1.45], y: [-1.32, 1.32], axes: false, equal: true, height: 320, weight: 1 });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1.1 });
        let D, G;
        function rebuild() {
          const k = kS.value, states = [], delta = {};
          for (let r = 0; r < k; r++) { const a = Math.PI / 2 - (2 * Math.PI * r) / k; states.push(['r' + r, Math.cos(a), Math.sin(a), r === 0, `$${r}$`]); delta['r' + r] = { 0: 'r' + ((2 * r) % k), 1: 'r' + ((2 * r + 1) % k) }; }
          // loops point outwards; the start arrow comes in from the upper left
          D = dfa(['0', '1'], states, 'r0', delta, { startDir: 150, loops: { r0: 35, ['r' + (k - 1)]: (90 - (360 * (k - 1)) / k + 360) % 360 } });
          if (!G) G = dfaGraph(v, gs, D, { draggable: true, r: 15, texSize: 14 }); else G.sync(D);
        }
        rebuild();
        const feed = () => (order.value === 'msb' ? bits : [...bits].reverse().join(''));
        const val = (str) => (str ? parseInt(str, 2) : 0);
        const frames = () => { const f = feed(), r = run(D, f); return r.path.map((q, t) => ({ t, q, note: t === 0 ? 'Start in state 0: the empty prefix has value 0.' : `Read bit **${f[t - 1]}**: state ${r.path[t - 1].slice(1)} → (2·${r.path[t - 1].slice(1)} + ${f[t - 1]}) mod ${kS.value} = **${q.slice(1)}**.` })); };
        const S = v.steps({ frames, speed: 1.4, still: 3 });
        // true value of what has been read after t bits
        const truth = (t) => (order.value === 'msb' ? val(bits.slice(0, t)) : val(bits.slice(bits.length - t)));
        v.render(() => {
          const f = S.frame, t = f.t ?? 0, fd = feed(), r = run(D, fd), k = kS.value, cur = r.path[t];
          drawDFA(v, gs, G, D, {
            fill: (id) => (id === cur ? (t === fd.length ? (id === 'r0' ? 'green' : 'red') : 'gold') : null),
            edgeColor: (e) => (t > 0 && e.from === r.path[t - 1] && e.to === cur ? 'gold' : e.syms.includes('0') ? 'blue' : 'orange'),
            edgeWidth: (e) => (t > 0 && e.from === r.path[t - 1] && e.to === cur ? 3.4 : 1.6),
            edgeLabelColor: (e) => (e.syms.includes('0') ? 'blue' : 'orange'),
          });
          // prefix table
          const P = pen(ts, v), rows = fd.length + 1, rh = Math.min(24, (P.H - 40) / rows), cx = [16, P.W * 0.42, P.W * 0.62, P.W * 0.8, P.W - 14];
          P.sans(order.value === 'msb' ? 'bits read' : 'bits read (low end)', cx[0], 14, { align: 'left', size: 11.5, weight: 600, color: 'muted' });
          P.sans('value', cx[1], 14, { size: 11.5, weight: 600, color: 'muted' });
          P.sans(`value mod ${k}`, cx[2], 14, { size: 11.5, weight: 600, color: 'muted' });
          P.sans('state', cx[3], 14, { size: 11.5, weight: 600, color: 'muted' });
          for (let i = 0; i < rows; i++) {
            const y = 32 + i * rh, tv = truth(i), st = +r.path[i].slice(1), ok = tv % k === st, on = i === t;
            if (on) P.box(6, y - rh / 2 + 1, P.W - 12, rh - 2, { r: 4, fill: 'gold', alpha: 0.16, stroke: false });
            const shown = order.value === 'msb' ? bits.slice(0, i) : bits.slice(bits.length - i);
            P.text(shown ? (order.value === 'msb' ? shown : shown.padStart(bits.length, '·')) : EPS, cx[0], y, { align: 'left', size: 12.5, color: i <= t ? 'ink' : 'muted' });
            P.text(String(tv), cx[1], y, { size: 12.5, color: i <= t ? 'ink' : 'muted' });
            P.text(String(tv % k), cx[2], y, { size: 12.5, weight: 600, color: i <= t ? 'ink' : 'muted' });
            P.text(String(st), cx[3], y, { size: 12.5, weight: 600, color: i > t ? 'muted' : ok ? 'ink' : 'red' });
            P.text(ok ? '✓' : '✗', cx[4], y, { size: 13, weight: 700, color: i > t ? 'faint' : ok ? 'green' : 'red', align: 'right' });
          }
        });
        v.legend([['blue', 'bit 0'], ['orange', 'bit 1'], ['gold', 'current state', { dot: true }]]);
        v.readout(() => {
          const k = kS.value, x = val(bits), r = run(D, feed()), st = +r.path.at(-1).slice(1);
          return `$${bits || '0'}_2 = ${x}$, and $${x} \\bmod ${k} = ${x % k}$ · the machine ends in state ${st} ${st === x % k ? '✓' : '✗ (wrong: least-significant-first input needs more memory)'} · ${st === 0 ? '**accept**: divisible by ' + k : '**reject**'}${order.value === 'lsb' && st === 0 && x % k !== 0 ? ' — a false accept' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Closure under complement',
      statement: String.raw`If $L$ is regular then so is its complement $\overline L=\Sigma^*\setminus L$: if $M=(Q,\Sigma,\delta,q_0,F)$ is a (complete) DFA for $L$, then $\overline M=(Q,\Sigma,\delta,q_0,Q\setminus F)$ recognises $\overline L$. The construction needs $\delta$ to be total: on a diagram with missing arrows, swapping accepting and rejecting states is wrong until the implicit dead state has been added explicitly.`,
      idea: String.raw`A DFA has exactly one run on each input, and the run ends in exactly one state $\hat\delta(q_0,w)$; that state is in $F$ or in $Q\setminus F$ but not both, so swapping the two sets swaps every verdict. If an arrow is missing, inputs that fall off the diagram end in no drawn state at all and are rejected by $M$ *and* by the swapped diagram, which is why the dead state must be made explicit first (2.1).`,
      caption: String.raw`Each cell is a string; its upper half shows $M$'s verdict (green = accept), its lower half the verdict of the machine drawn on the left (purple = accept). With **swap** on, every string should be accepted by exactly one of them. Choose the incomplete machine: the strings containing **aa** fall into the missing arrow and are rejected by both (red outline) until you **add the dead state**. Click states to change $F$.`,
      deps: ['toc-2.3'],
      refs: ['Sipser §1.1'],
      tags: ['closure properties', 'regular languages'],
      viz(v) {
        let M = PRESETS.endsAB();
        v.select('machine $M$', [{ value: 'endsAB', label: 'ends in ab (complete)' }, { value: 'noAA', label: 'no aa (a missing arrow)' }], 'endsAB', { onChange: (k) => { M = PRESETS[k](); sync(); } });
        const swap = v.toggle('swap accepting and rejecting states', true, { onChange: () => sync() });
        const comp = v.toggle('add the dead state first', false, { onChange: () => sync() });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 300, weight: 1 });
        const vs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.15 });
        let N = M, G = null;
        function sync() {
          let E = comp.value ? complete(M) : cloneD(M);
          if (swap.value) E.states.forEach((s) => { s.acc = !s.acc; });
          // the drawn machine shares positions with M where states coincide
          E.states.forEach((s) => { const o = M.states.find((t) => t.id === s.id); if (o) { s.x = o.x; s.y = o.y; } });
          N = E; if (!G) G = dfaGraph(v, gs, N); else G.sync(N);
        }
        sync();
        G.onClick = ({ node }) => { const o = node && M.states.find((t) => t.id === node.id); if (o) { o.acc = !o.acc; sync(); } return true; };
        G.onChange = (kind, n) => { if (kind === 'move') { const o = M.states.find((t) => t.id === n.id); if (o) { o.x = n.x; o.y = n.y; } } };
        const STR = upTo(['a', 'b'], 4);
        v.render(() => {
          drawDFA(v, gs, G, N, { ring: () => (swap.value ? 'purple' : 'ink') });
          gs.corner(swap.value ? 'the swapped machine M̄' : 'the machine M', 'tl', { size: 12.5, weight: 600, color: swap.value ? 'purple' : 'muted' });
          const P = pen(vs, v), rows = 5, rh = (P.H - 30) / rows;
          let bad = 0;
          for (let n = 0; n < rows; n++) {
            const L = layer(['a', 'b'], n), cw = Math.min(64, (P.W - 52) / 16), xs = 44 + (P.W - 52) / 2 - (cw * L.length) / 2, y = 6 + n * rh;
            P.tex(`\\Sigma^{${n}}`, 20, y + rh / 2, { size: 13, color: 'muted' });
            L.forEach((u, j) => {
              const a = !!run(M, u).acc, b = !!run(N, u).acc, okc = swap.value ? a !== b : a === b, x = xs + j * cw;
              if (!okc) bad++;
              P.box(x + 1, y + 2, cw - 3, (rh - 6) / 2, { r: 2, fill: a ? 'green' : null, alpha: 0.55, stroke: false });
              P.box(x + 1, y + 2 + (rh - 6) / 2, cw - 3, (rh - 6) / 2, { r: 2, fill: b ? 'purple' : null, alpha: 0.5, stroke: false });
              P.box(x + 1, y + 2, cw - 3, rh - 6, { r: 3, stroke: okc ? 'faint' : 'red', width: okc ? 1 : 2.2 });
              const fs = Math.min(11.5, ((cw - 4) / Math.max(1, u.length)) * 1.6);
              if (fs >= 6.5) P.text(sh(u), x + cw / 2 - 0.5, y + rh / 2 - 1, { size: fs, color: 'ink', halo: true });
            });
          }
          P.sans(swap.value ? (bad ? `${bad} strings are rejected by both machines` : 'every string is accepted by exactly one of the two machines') : 'swap off: the two machines agree', P.W / 2, P.H - 12, { size: 12, weight: 600, color: swap.value ? (bad ? 'red' : 'green') : 'muted' });
        });
        v.legend([['green', 'accepted by $M$', { dot: true }], ['purple', 'accepted by the drawn machine', { dot: true }], ['red', 'rejected by both', { dot: true }]]);
        v.readout(() => {
          const lost = STR.filter((u) => !run(M, u).acc && !run(N, u).acc), both = STR.filter((u) => run(M, u).acc && run(N, u).acc);
          if (!swap.value) return 'Switch on the swap to build the complement machine.';
          return lost.length ? `Not the complement: ${lost.length} of 31 strings (${lost.slice(0, 5).map(sh).join(', ')}${lost.length > 5 ? ', …' : ''}) are rejected by both — they fall off the missing arrow $\\delta(q_1, \\mathtt{a})$. Add the dead state first.`
            : both.length ? `${both.length} strings accepted by both?!` : `$L(\\overline M) = \\Sigma^*\\setminus L(M)$ on all 31 strings of length $\\le 4$ ✓ (${STR.filter((u) => run(M, u).acc).length} in $L(M)$, ${STR.filter((u) => run(N, u).acc).length} in the complement).`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Theorem',
      name: 'Product construction: union and intersection',
      statement: String.raw`If $L_1$ and $L_2$ are regular, so are $L_1\cup L_2$, $L_1\cap L_2$, $L_1\setminus L_2$ and $L_1\triangle L_2$. Given DFAs $M_i=(Q_i,\Sigma,\delta_i,s_i,F_i)$, the **product automaton** has states $Q_1\times Q_2$, start $(s_1,s_2)$ and transitions
$$\delta\big((p,q),a\big)=\big(\delta_1(p,a),\,\delta_2(q,a)\big),$$
so that $\hat\delta((s_1,s_2),w)=(\hat\delta_1(s_1,w),\hat\delta_2(s_2,w))$; it accepts $L_1\cup L_2$ with $F=(F_1\times Q_2)\cup(Q_1\times F_2)$, $L_1\cap L_2$ with $F=F_1\times F_2$, and the other Boolean combinations with the corresponding sets of pairs. It has $|Q_1|\,|Q_2|$ states.`,
      idea: String.raw`Run both machines in parallel on the same input: the pair of current states is finite memory, so it is itself the state of one DFA. The run of the product is the pair of the two runs (induction on $w$ using 2.2), and any Boolean condition on "does $M_1$ accept, does $M_2$ accept" is a condition on the final pair, i.e. a choice of accepting pairs.`,
      caption: String.raw`$M_1$ stands at the left, $M_2$ along the top, and their product is the grid of state pairs, arrows and all. Type an input and step: the three gold tokens move in lockstep, the product token always sitting at the crossing of the other two (dashed guides). Switch the operation and the double-ringed accepting pairs change; the readout checks the product's verdict against the two machines.`,
      deps: ['toc-2.3'],
      refs: ['Sipser §1.1'],
      credit: 'Rabin & Scott, 1959',
      tags: ['closure properties', 'product construction'],
      viz(v) {
        const M1S = {
          evenA: () => dfa(['a', 'b'], [['E', 0, 0, 1, '$E$'], ['O', 0, 0, 0, '$O$']], 'E', { E: { a: 'O', b: 'E' }, O: { a: 'E', b: 'O' } }, { name: 'even number of a', loops: { E: 180, O: 180 } }),
          endsB: () => dfa(['a', 'b'], [['x', 0, 0, 0, '$x$'], ['y', 0, 0, 1, '$y$']], 'x', { x: { a: 'x', b: 'y' }, y: { a: 'x', b: 'y' } }, { name: 'ends in b', loops: { x: 180, y: 180 } }),
        };
        const M2S = {
          bMod3: () => dfa(['a', 'b'], [['0', 0, 0, 1, '$0$'], ['1', 0, 0, 0, '$1$'], ['2', 0, 0, 0, '$2$']], '0', { 0: { a: '0', b: '1' }, 1: { a: '1', b: '2' }, 2: { a: '2', b: '0' } }, { name: 'number of b divisible by 3', loops: { 0: 90, 1: 90, 2: 90 } }),
          hasAB: () => dfa(['a', 'b'], [['s', 0, 0, 0, '$s$'], ['t', 0, 0, 0, '$t$'], ['u', 0, 0, 1, '$u$']], 's', { s: { a: 't', b: 's' }, t: { a: 't', b: 'u' }, u: { a: 'u', b: 'u' } }, { name: 'contains ab', loops: { s: 90, t: 90, u: 90 } }),
        };
        let M1 = M1S.evenA(), M2 = M2S.bMod3(), w = 'abba';
        const op = v.select('accept', [{ value: 'or', label: '$L_1\\cup L_2$' }, { value: 'and', label: '$L_1\\cap L_2$' }, { value: 'minus', label: '$L_1\\setminus L_2$' }, { value: 'xor', label: '$L_1\\triangle L_2$' }], 'or', { onChange: () => rebuild() });
        v.select('$M_1$', [{ value: 'evenA', label: 'even # of a' }, { value: 'endsB', label: 'ends in b' }], 'evenA', { onChange: (k) => { M1 = M1S[k](); rebuild(); } });
        v.select('$M_2$', [{ value: 'bMod3', label: '# of b ≡ 0 mod 3' }, { value: 'hasAB', label: 'contains ab' }], 'bMod3', { onChange: (k) => { M2 = M2S[k](); rebuild(); } });
        keypad(v, ['a', 'b'], () => w, (x) => { w = x; S.reset({ at: 'end' }); }, { max: 10 });
        const s = v.stage({ x: [-0.6, 15.2], y: [0, 7.6], axes: false, equal: true, height: 380, full: true });
        const ACC = { or: (a, b) => a || b, and: (a, b) => a && b, minus: (a, b) => a && !b, xor: (a, b) => a !== b };
        let G1, G2, GP, PD;
        function rebuild() {
          const n1 = M1.states.length, n2 = M2.states.length, X = (j) => 4.8 + j * (8.6 / Math.max(1, n2 - 1)), Y = (i) => 4.6 - i * (3.4 / Math.max(1, n1 - 1));
          M1.states.forEach((q, i) => { q.x = 1.2; q.y = Y(i); });
          M2.states.forEach((q, j) => { q.x = X(j); q.y = 6.75; });
          const states = [], delta = {};
          M1.states.forEach((p, i) => M2.states.forEach((q, j) => {
            const id = p.id + '|' + q.id;
            states.push([id, X(j), Y(i), ACC[op.value](p.acc, q.acc), `$(${p.label.replace(/\$/g, '')},${q.label.replace(/\$/g, '')})$`]);
            delta[id] = {}; for (const c of ['a', 'b']) delta[id][c] = step(M1, p.id, c) + '|' + step(M2, q.id, c);
          }));
          PD = dfa(['a', 'b'], states, M1.start + '|' + M2.start, delta, { startDir: 180 });
          if (!G1) { G1 = dfaGraph(v, s, M1, { draggable: false, r: 15, texSize: 14 }); G2 = dfaGraph(v, s, M2, { draggable: false, r: 15, texSize: 14 }); GP = dfaGraph(v, s, PD, { draggable: false, r: 22, texSize: 12.5 }); }
          else { G1.sync(M1); G2.sync(M2); GP.sync(PD); }
          // arrows that would pass through another pair are bent
          for (const e of GP.edges) {
            if (e.from === e.to) continue;
            const a = GP.node(e.from), b = GP.node(e.to);
            const hits = PD.states.some((q) => { if (q.id === e.from || q.id === e.to) return false; const t = ((q.x - a.x) * (b.x - a.x) + (q.y - a.y) * (b.y - a.y)) / ((b.x - a.x) ** 2 + (b.y - a.y) ** 2); if (t <= 0 || t >= 1) return false; return Math.hypot(a.x + t * (b.x - a.x) - q.x, a.y + t * (b.y - a.y) - q.y) < 0.55; });
            if (hits) e.bend = 40;
          }
          if (S) S.reset({ at: 'keep' });
        }
        let S = null;
        rebuild();
        const frames = () => { const r1 = run(M1, w).path, r2 = run(M2, w).path; return r1.map((p, t) => ({ t, p, q: r2[t], note: t === 0 ? 'Both machines, and the product, start in their start states.' : `Read **${w[t - 1]}**: $M_1$ goes to $${texState(M1, p)}$, $M_2$ to $${texState(M2, r2[t])}$, so the product goes to $(${texState(M1, p)}, ${texState(M2, r2[t])})$.` })); };
        S = v.steps({ frames, speed: 1.4, still: 2 });
        v.render(() => {
          const f = S.frame, t = f.t ?? 0, last = t === w.length, pid = f.p + '|' + f.q;
          const a1 = isAcc(M1, f.p), a2 = isAcc(M2, f.q), ap = isAcc(PD, pid);
          // guides from the product token to its two components
          const np = GP.node(pid), n1 = G1.node(f.p), n2 = G2.node(f.q);
          if (np && n1 && n2) { s.line(n1.x + 0.35, n1.y, np.x - 0.5, np.y, { color: 'gold', width: 1.4, dash: [5, 5], alpha: 0.8 }); s.line(n2.x, n2.y - 0.35, np.x, np.y + 0.5, { color: 'gold', width: 1.4, dash: [5, 5], alpha: 0.8 }); }
          s.rect(3.4, 0.25, 14.8, 5.6, { color: 'faint', width: 1, dash: [4, 4] });
          const tok = (acc) => (last ? (acc ? 'green' : 'red') : 'gold');
          drawDFA(v, s, G1, M1, { fill: (id) => (id === f.p ? tok(a1) : null), startColor: 'muted' });
          drawDFA(v, s, G2, M2, { fill: (id) => (id === f.q ? tok(a2) : null), startColor: 'muted' });
          drawDFA(v, s, GP, PD, { fill: (id) => (id === pid ? tok(ap) : null), ring: () => 'accent' });
          s.tex('M_1', 1.2, 6.0, { size: 15, color: 'muted' }); s.tex('M_2', 3.0, 6.75, { size: 15, color: 'muted' });
          s.text('product  M₁ × M₂', 14.6, 0.55, { align: 'right', size: 12, color: 'muted', weight: 600 });
        });
        v.legend([['gold', 'current states', { dot: true }], ['accent', 'accepting pairs (double ring)', { dot: true }], ['green', 'accept at the end', { dot: true }], ['red', 'reject at the end', { dot: true }]]);
        v.readout(() => {
          const r1 = run(M1, w), r2 = run(M2, w), rp = run(PD, w), want = ACC[op.value](r1.acc, r2.acc);
          const name = { or: 'or', and: 'and', minus: 'and not', xor: 'xor' }[op.value];
          return `On **${sh(w)}**: $M_1$ ${r1.acc ? 'accepts' : 'rejects'}, $M_2$ ${r2.acc ? 'accepts' : 'rejects'}; "${r1.acc ? 'yes' : 'no'} ${name} ${r2.acc ? 'yes' : 'no'}" = ${want ? 'yes' : 'no'}, and the product ${rp.acc ? 'accepts' : 'rejects'} ${rp.acc === want ? '✓' : '✗'} · ${PD.states.length} = ${M1.states.length}·${M2.states.length} pair states, ${PD.states.filter((q) => q.acc).length} accepting`;
        });
      },
    },
  ],
};
