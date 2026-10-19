import { regexDifference } from './automata.audit.js';
// Theory of Computation — Chapter 3: Nondeterminism and regular expressions (items 3.1–3.8; 3.9–3.16 in ch03-b.js)
import { EPS, DEAD, layer, upTo, pen, keypad, dfa, dfaEdges, cycleTarget, deltaValue, rowLabel, texName, nfa, closure, move, hasAcc, nfaRun, nfaAccepts, determinize, minimalSize, deriv, nullable, nfaEdges, PRESETS, dfaAccepts, nfaLang, eqSets, firstDiff, nfaGraph, drawNFA, bendEdges, fitThompson, NFAS, R, parseRegex, tryParse, rx, rxTeX, rxSize, countParts, langSets, langFlat, thompson, gnfaFromNFA, eliminate, nfaToRegex, rxInput, drawLangRows, tt, texName3, setTex, setStr, drawBarcode, symbolsOf, onColor, asNFA, SANS } from './ch03.shared.js';

const plain = (N, q) => String(N.states.find((s) => s.id === q)?.label ?? q).replace(/\$|\\mathrm|[{}]/g, '').replace(/_/g, '');
const fit = (s, N) => (N.thompson ? fitThompson(s, N) : (s.setView([0, 10], [0, 7.2]), 0));
/** Computation tree of an NFA (no ε-moves) on w: nodes {q, lvl, kids, dead, y (leaf order)}. */
function compTree(N, w, cap = 260) {
  const nodes = []; let trunc = false;
  const go = (q, lvl) => {
    const nd = { q, lvl, kids: [], dead: false }; nodes.push(nd);
    if (nodes.length > cap) { trunc = true; return nd; }
    if (lvl < w.length) { const t = N.delta[q]?.[w[lvl]] || []; if (!t.length) nd.dead = true; for (const r of t) { nd.kids.push(go(r, lvl + 1)); nd.kids.at(-1).parent = nd; } }
    return nd;
  };
  const root = go(N.start, 0); let leaf = 0;
  (function ys(nd) { if (!nd.kids.length) nd.y = leaf++; else { nd.kids.forEach(ys); nd.y = (nd.kids[0].y + nd.kids.at(-1).y) / 2; } })(root);
  return { nodes, root, leaves: leaf, trunc };
}
/** Everything up to length n that M (DFA) and the NFA agree on? returns first disagreement or null. */
const FAM = (k) => { // k-th symbol from the end is 1 (alphabet 0/1)
  const st = [], dl = {};
  for (let i = 0; i <= k; i++) { st.push(['q' + i, 1.6 + (i * 7.4) / Math.max(k, 1), 3.6, i === k]); dl['q' + i] = i === 0 ? { 0: ['q0'], 1: k >= 1 ? ['q0', 'q1'] : ['q0'] } : i < k ? { 0: ['q' + (i + 1)], 1: ['q' + (i + 1)] } : {}; }
  return nfa(['0', '1'], st, 'q0', dl, {}, { loops: { q0: 90 } });
};
const FAM_START = (k) => { // k-th symbol from the start is 1 (then anything)
  const st = [], dl = {};
  for (let i = 0; i <= k; i++) { st.push(['q' + i, 1.6 + (i * 7.4) / Math.max(k, 1), 3.6, i === k]); dl['q' + i] = i === k ? { 0: ['q' + k], 1: ['q' + k] } : i === k - 1 ? { 1: ['q' + k] } : { 0: ['q' + (i + 1)], 1: ['q' + (i + 1)] }; }
  return nfa(['0', '1'], st, 'q0', dl, {}, { loops: { ['q' + k]: 90 } });
};

export default {
  collection: 'toc',
  chapter: 3,
  title: 'Nondeterminism and regular expressions',
  summary: String.raw`A nondeterministic automaton may branch, guess and take empty moves, accepting when any branch succeeds. The subset construction shows that this adds convenience but no power, at a possible exponential cost in states. Regular expressions describe exactly the same languages (Kleene’s theorem), and the conversions between expressions, NFAs and DFAs are the engine of every regex library — along with its notorious performance traps.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Nondeterministic finite automaton',
      statement: String.raw`A **nondeterministic finite automaton** (NFA) is a 5-tuple $N=(Q,\Sigma,\delta,q_0,F)$ like a DFA, except that the transition function returns a *set* of states: $\delta:Q\times\Sigma\to\mathcal P(Q)$, where $\delta(q,a)=\varnothing$ is allowed (no $a$-arrow at all) and $|\delta(q,a)|\ge 2$ is allowed (a choice). A **run** on $w=w_1\cdots w_n$ is a sequence $r_0,r_1,\dots,r_n$ with $r_0=q_0$ and $r_i\in\delta(r_{i-1},w_i)$; $N$ **accepts** $w$ if *some* run ends in $F$, and $L(N)$ is the set of accepted strings. Equivalently, the set of live states after reading $w$ is $\hat\delta(w)=\bigcup_{q\in\hat\delta(w')}\delta(q,a)$ for $w=w'a$ (starting from $\{q_0\}$), and $w\in L(N)$ iff $\hat\delta(w)\cap F\ne\varnothing$. Every DFA is an NFA in which every $\delta(q,a)$ is a singleton.`,
      idea: String.raw`Where a DFA has exactly one run, an NFA has a tree of runs: at each step every live branch splits into one branch per allowed arrow and dies if there is none. Acceptance asks only whether one leaf of the tree is accepting, so the machine behaves as if it guessed the right branch. The honest way to simulate this is to track the whole set of live states, which stays inside the finite set $\mathcal P(Q)$; this is the observation the subset construction (3.3) turns into a DFA.`,
      caption: String.raw`Type an input and step through it: the left picture shows the **set of live states** (gold) after each symbol, the middle one the **tree of runs** with its dying branches (✗) and the leaves that reach an accepting state. **Click a state** to make it accepting, **click a table cell** to cycle its set of targets (including two-element sets and the empty set) and see the language change. Choose a machine where one state has two $a$-arrows: this is the nondeterminism.`,
      deps: ['toc-2.1'],
      refs: ['Sipser §1.2'],
      credit: 'Rabin & Scott, 1959',
      tags: ['automata', 'nondeterminism'],
      viz(v) {
        let N = NFAS.secondA(), w = 'abbab';
        const sample = { secondA: 'abbab', endsAB: 'aabab', aaOrBb: 'abbab' };
        v.select('NFA', [{ value: 'secondA', label: '2nd symbol from the end is a' }, { value: 'endsAB', label: 'ends in ab' }, { value: 'aaOrBb', label: 'contains aa or bb' }], 'secondA', {
          onChange: (k) => { N = NFAS[k](); w = sample[k]; refresh(); },
        });
        keypad(v, ['a', 'b'], () => w, (x) => { w = x; S.reset({ at: 'end' }); }, { max: 8 });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 300, weight: 1.35 });
        const tr = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 1.25 });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 0.8 });
        const G = nfaGraph(v, gs, N, { draggable: true, r: 18 });
        const T = v.table(tb, { rows: 3, cols: 2, maxCell: 50, size: 14, square: false, cellAspect: 1.5, labelSize: 14 });
        G.onClick = ({ node }) => { if (node) { node.acc = !node.acc; refresh(); } return true; };
        tb.onClick((x, y) => {
          const c = T.hit(x, y); if (!c) return; const q = N.states[c.i]?.id; if (!q || c.j < 0 || c.i < 0) return;
          cycleTarget(N, q, N.alpha[c.j], true); refresh();
        });
        const frames = () => {
          const r = nfaRun(N, w), out = [{ k: 0, note: `One token sits on the start state $${texName3(N, N.start)}$.` }];
          for (let k = 1; k <= w.length; k++) {
            const c = w[k - 1], prev = r.sets[k - 1];
            const parts = prev.map((q) => { const t = N.delta[q][c]; return t.length ? `$${texName3(N, q)}\\to${setTex(N, t)}$` : `$${texName3(N, q)}$ has no **${c}**-arrow, its token vanishes`; });
            out.push({ k, note: `Read **${c}**: ${parts.join('; ')}. Live states now $${setTex(N, r.sets[k])}$.` });
          }
          const last = out[out.length - 1];
          last.note += r.acc ? ' Some live state is accepting: **accept**.' : r.sets[w.length].length ? ' No live state is accepting: **reject**.' : ' Every branch has died: **reject**.';
          last.final = true; return out;
        };
        const S = v.steps({ frames, speed: 1.5, still: 3 });
        function refresh() { G.sync(N); S.reset({ at: 'end' }); }
        v.render(() => {
          const f = S.frame, k = f.k ?? 0, r = nfaRun(N, w), live = r.sets[k], prev = k > 0 ? r.sets[k - 1] : [], c = k > 0 ? w[k - 1] : null;
          const col = f.final ? (r.acc ? 'green' : 'red') : 'gold';
          drawNFA(v, gs, G, N, {
            fill: (id) => (live.includes(id) ? col : null),
            edgeColor: (e) => (c && prev.includes(e.from) && e.syms.includes(c) && N.delta[e.from][c].includes(e.to) ? 'gold' : null),
            edgeWidth: (e) => (c && prev.includes(e.from) && e.syms.includes(c) && N.delta[e.from][c].includes(e.to) ? 3.2 : null),
          });
          gs.corner(f.final ? (r.acc ? 'accept' : 'reject') : `after ${k} of ${w.length} symbols`, 'tr', { color: f.final ? col : 'muted', weight: 700, size: 13 });
          // tree of runs
          const P = pen(tr, v), tree = compTree(N, w), n = w.length, x0 = 34, dx = Math.min(70, (P.W - x0 - 30) / Math.max(n, 1)), top = 44, dy = Math.min(26, (P.H - top - 16) / Math.max(tree.leaves - 1, 1));
          const X = (l) => x0 + l * dx, Y = (y) => top + y * dy;
          for (let l = 0; l <= n; l++) { P.line(X(l), 30, X(l), P.H - 8, { color: 'grid', width: 1 }); P.text(l === 0 ? 'start' : w[l - 1], X(l), 16, { size: l === 0 ? 11 : 14, weight: 600, color: l === k ? 'gold' : l < k ? 'ink' : 'faint' }); }
          for (const nd of tree.nodes) if (nd.parent && nd.lvl <= k) P.line(X(nd.parent.lvl), Y(nd.parent.y), X(nd.lvl), Y(nd.y), { color: 'muted', width: 1.4 });
          for (const nd of tree.nodes) {
            if (nd.lvl > k) continue;
            const isLeaf = nd.lvl === k, accN = N.states.find((s) => s.id === nd.q)?.acc, fin = k === n && isLeaf;
            const colr = fin ? (accN ? 'green' : 'red') : isLeaf ? 'gold' : 'muted';
            P.circle(X(nd.lvl), Y(nd.y), isLeaf ? 8 : 5.5, { fill: isLeaf ? colr : 'panel', fillAlpha: isLeaf ? 0.9 : 1, color: colr, width: 1.6 });
            P.text(nd.q, X(nd.lvl), Y(nd.y) - 13, { size: 10.5, color: isLeaf ? 'ink' : 'muted', halo: true });
            if (nd.dead && k > nd.lvl) P.text('✗', X(nd.lvl) + 14, Y(nd.y), { size: 14, weight: 700, color: 'red' });
          }
          if (tree.trunc) P.sans('(tree truncated)', P.W / 2, P.H - 10, { size: 11, color: 'muted' });
          // table
          const ids = N.states.map((s) => s.id);
          T.draw({
            rows: ids.length, cols: 2, colLabels: N.alpha.map((x) => `$\\mathtt{${x}}$`), cornerLabel: '$\\delta$', rowLabels: ids.map((q) => rowLabel(N, q)),
            value: (i, j) => deltaValue(N, ids[i], N.alpha[j], true),
            fill: (i, j) => { const t = N.delta[ids[i]][N.alpha[j]]; return c && prev.includes(ids[i]) && N.alpha[j] === c ? ['gold', 0.4] : t.length > 1 ? ['blue', 0.18] : null; },
            textColor: (i, j) => (N.delta[ids[i]][N.alpha[j]].length ? 'ink' : 'muted'),
          });
        });
        v.legend([['gold', 'live states / token positions', { dot: true }], ['green', 'accepting leaf', { dot: true }], ['red', 'rejecting leaf or dead branch', { dot: true }], ['blue', 'a choice (two targets)']]);
        v.readout(() => {
          const r = nfaRun(N, w), tree = compTree(N, w), k = S.frame.k ?? 0;
          const trace = r.sets.slice(0, k + 1).map((X, i) => (i ? `\\xrightarrow{${w[i - 1]}}` : '') + setTex(N, X)).join('');
          let s = `$${trace}$`;
          if (k === w.length) s += r.acc ? ' — **accept**' : ' — **reject**';
          const leaves = tree.nodes.filter((nd) => nd.lvl === w.length && nd.lvl <= (S.frame.k ?? 0)).length;
          s += ` · branches alive after ${k} symbols: ${tree.nodes.filter((nd) => nd.lvl === k).length}`;
          if (k === w.length) s += ` · ${leaves} complete run${leaves === 1 ? '' : 's'}, ${tree.nodes.filter((nd) => nd.lvl === w.length && N.states.find((x) => x.id === nd.q)?.acc).length} accepting`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'ε-transitions and ε-closure',
      statement: String.raw`An **ε-NFA** also allows arrows labelled $\varepsilon$ ("move without reading"): $\delta:Q\times(\Sigma\cup\{\varepsilon\})\to\mathcal P(Q)$. The **ε-closure** $E(S)$ of a set $S\subseteq Q$ is the smallest set containing $S$ and closed under ε-arrows: if $p\in E(S)$ and $r\in\delta(p,\varepsilon)$ then $r\in E(S)$ (the states reachable from $S$ by paths of ε-arrows only, including empty paths). The ε-NFA starts in $E(\{q_0\})$, and after a symbol $a$ the live set is $E\big(\bigcup_{p}\delta(p,a)\big)$ over the previous live set. $N$ accepts $w$ iff the final live set meets $F$.`,
      idea: String.raw`An ε-arrow is a free move, so wherever a token stands it also stands on everything reachable by ε-arrows; the closure is computed by graph search (it is a reachability problem, so cycles of ε-arrows are harmless) and must be applied *before* the first symbol and *after every* symbol. Forgetting a closure silently throws away runs that need a free move at the start, between two symbols or at the end.`,
      caption: String.raw`The machines are built from regular expressions (3.7), so the ε-arrows (dashed) are many. **Click a state** to light up its ε-closure (green). Type an input and step: each symbol is two moves, first the $a$-arrows (**gold**), then the ε-closure (added states in **blue**). Switch on **forget the closures** to run the same input with plain moves and watch acceptance change; the example $(a^*)^*$ contains a cycle of ε-arrows.`,
      deps: ['toc-3.1'],
      refs: ['Sipser §1.2'],
      tags: ['automata', 'nondeterminism'],
      viz(v) {
        const REGS = [['(a|b)*ab', '(a|b)*ab'], ['a*b*', 'a*b*'], ['(a*)*', '(a*)*'], ['(ab|a)*', '(ab|a)*']];
        let N = thompson(parseRegex('(a|b)*ab'), ['a', 'b']).N, w = 'abab', sel = null;
        v.select('machine (from the expression)', REGS.map(([l, s]) => ({ value: s, label: l })), '(a|b)*ab', { onChange: (s) => { N = thompson(parseRegex(s), ['a', 'b']).N; sel = null; G.sync(N); S.reset({ at: 'end' }); } });
        const forget = v.toggle('forget the closures', false, { onChange: () => S.reset({ at: 'end' }) });
        keypad(v, ['a', 'b'], () => w, (x) => { w = x; S.reset({ at: 'end' }); }, { max: 8 });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 380, full: true });
        const ts = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true });
        const G = nfaGraph(v, gs, N, { draggable: false, r: 15, texSize: 13 });
        G.onClick = ({ node }) => { sel = node && node.id !== sel ? node.id : null; return true; };
        const trace = () => { // list of frames {set, base, phase}
          const out = []; let S0 = forget.value ? [N.start] : closure(N, [N.start]);
          out.push({ set: S0, base: [N.start], phase: forget.value ? 'start' : 'close', k: 0, note: forget.value ? `Start on $${texName3(N, N.start)}$ alone (closures are switched off).` : `Start: the closure of $\\{${texName3(N, N.start)}\\}$ is $${setTex(N, S0)}$ — the token is already on every state reachable by free moves.` });
          for (let k = 1; k <= w.length; k++) {
            const m = move(N, S0, w[k - 1]);
            if (forget.value) { S0 = m; out.push({ set: m, base: m, phase: 'move', k, note: `Read **${w[k - 1]}**: $${setTex(N, m)}$.` }); continue; }
            out.push({ set: m, base: m, phase: 'move', k, note: `Read **${w[k - 1]}**: the ${w[k - 1]}-arrows lead to $${setTex(N, m)}$.` });
            const c = closure(N, m); out.push({ set: c, base: m, phase: 'close', k, note: `Close under ε: $E(${setTex(N, m)})=${setTex(N, c)}$.` }); S0 = c;
          }
          out[out.length - 1].final = true; out[out.length - 1].acc = hasAcc(N, S0); return out;
        };
        const S = v.steps({ frames: trace, speed: 1.4, still: 4 });
        v.render(() => {
          const f = S.frame, set = f.set ?? [], base = f.base ?? [], cl = sel ? closure(N, [sel]) : [];
          const col = f.final ? (f.acc ? 'green' : 'red') : 'gold';
          const unit = fit(gs, N); bendEdges(G, unit);
          drawNFA(v, gs, G, N, {
            fill: (id) => (set.includes(id) ? (base.includes(id) ? col : 'blue') : id === sel ? 'green' : null),
            color: (id) => (cl.includes(id) ? 'green' : null),
            edgeColor: (e) => (sel && e.epsOnly && cl.includes(e.from) && cl.includes(e.to) ? 'green' : null),
            edgeWidth: (e) => (sel && e.epsOnly && cl.includes(e.from) && cl.includes(e.to) ? 3 : null),
          });
          gs.corner(f.final ? (f.acc ? 'accept' : 'reject') : f.phase === 'move' ? 'after the symbol' : f.phase === 'close' ? 'after the ε-closure' : '', 'tr', { color: f.final ? col : 'muted', weight: 700, size: 13 });
          // live sets so far
          const P = pen(ts, v), fr = S.frames.slice(0, S.i + 1), rh = Math.min(22, (P.H - 8) / Math.max(fr.length, 1));
          fr.forEach((q, i) => {
            const y = 6 + i * rh + rh / 2, cur = i === S.i;
            P.sans(q.k === 0 ? 'start' : `symbol ${q.k}, ${q.phase === 'move' ? 'move' : 'closure'}`, 10, y, { align: 'left', size: 11, color: cur ? 'ink' : 'muted', weight: cur ? 700 : 500 });
            P.text('{' + q.set.join(', ') + '}', 150, y, { align: 'left', size: 12, color: cur ? 'ink' : 'muted', weight: cur ? 700 : 500 });
          });
        });
        v.legend([['gold', 'after the symbol', { dot: true }], ['blue', 'added by the ε-closure', { dot: true }], ['green', 'closure of the clicked state']]);
        v.readout(() => {
          const withC = nfaAccepts(N, w), f = S.frame, cl = sel ? closure(N, [sel]) : null;
          let s = `With closures $w$ is **${withC ? 'accepted' : 'rejected'}**`;
          if (forget.value) { let T0 = [N.start]; for (const c of w) T0 = move(N, T0, c); const wo = hasAcc(N, T0); s += `; without them it is **${wo ? 'accepted' : 'rejected'}**${wo !== withC ? ' — the closures matter here ✗' : ''}`; }
          if (cl) s += ` · $E(\\{${texName3(N, sel)}\\})=${setTex(N, cl)}$`;
          return s + (f.final ? '' : ` · live: $${setTex(N, f.set ?? [])}$`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Subset construction: NFAs equal DFAs',
      statement: String.raw`For every NFA (with or without ε-arrows) $N=(Q,\Sigma,\delta,q_0,F)$ there is a DFA $D$ with $L(D)=L(N)$: take $Q_D=\mathcal P(Q)$, start state $E(\{q_0\})$, $\delta_D(S,a)=E\big(\bigcup_{p\in S}\delta(p,a)\big)$ and $F_D=\{S: S\cap F\ne\varnothing\}$. Only the subsets reachable from the start state are needed, so $D$ has at most $2^{|Q|}$ states. Consequently a language is recognised by an NFA iff it is regular.`,
      idea: String.raw`By induction on $|w|$ (1.7), the DFA state reached after $w$ is exactly the set of NFA states reachable by some run on $w$: the base case is the start closure, and the step is the definition of $\delta_D$. Acceptance of $w$ by $N$ means that set meets $F$, which is the definition of $F_D$. The DFA is the "set of live states" bookkeeping of 3.1 made into a machine; building it on demand (a worklist of newly discovered subsets) usually creates far fewer than $2^{|Q|}$ states.`,
      caption: String.raw`**Construct** mode steps through the worklist: the gold state of the NFA (left) is the subset being processed, its outgoing arrows on $a$ and $b$ are computed (closure included), and new subsets appear in the DFA (right) when first discovered. **Run both** mode feeds the same input to both machines: the gold NFA states are exactly the set labelling the gold DFA state. Try the ε-NFA of $(a\mid b)^*abb$ and count how many of the $2^{11}$ possible subsets are ever reached.`,
      deps: ['toc-3.2', 'toc-2.3'],
      refs: ['Sipser §1.2'],
      credit: 'Rabin & Scott, 1959',
      tags: ['automata', 'determinization'],
      viz(v) {
        const mk = { secondA: () => NFAS.secondA(), endsAB: () => NFAS.endsAB(), aaOrBb: () => NFAS.aaOrBb(), abb: () => thompson(parseRegex('(a|b)*abb'), ['a', 'b']).N };
        let N = mk.secondA(), D = null, w = 'abbab', frames = [], S = null;
        v.select('NFA', [{ value: 'secondA', label: '2nd symbol from the end is a' }, { value: 'endsAB', label: 'ends in ab' }, { value: 'aaOrBb', label: 'contains aa or bb' }, { value: 'abb', label: '(a|b)*abb (ε-NFA)' }], 'secondA', { onChange: (k) => { N = mk[k](); rebuild(); } });
        const mode = v.select('mode', [{ value: 'build', label: 'construct' }, { value: 'run', label: 'run both' }], 'build', { onChange: () => { S.el.hidden = mode.value !== 'build'; S.noteEl.hidden = mode.value !== 'build'; kS.el.hidden = mode.value !== 'run'; } });
        keypad(v, ['a', 'b'], () => w, (x) => { w = x; kS.set(Math.min(kS.value, w.length)); }, { max: 8 });
        const kS = v.slider('symbols read', 0, 8, 3, { int: true });
        const ns = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 320, weight: 1 });
        const ds = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 320, weight: 1.15 });
        const GN = nfaGraph(v, ns, N, { draggable: true, r: 15, texSize: 13 });
        const GD = v.graph(ds, { nodes: [], edges: [], layout: 'none', directed: true, shape: 'box', draggable: true, edgeFontSize: 11.5, texSize: 13 });
        const small = () => N.states.length <= 4;
        function rebuild() {
          D = determinize(N);
          D.states.forEach((s, i) => { s.label = small() ? s.label : `$D_{${i}}$`; s.sets = s.set; });
          GN.sync(N); fit(ns, N);
          GD.set({ nodes: D.states, edges: dfaEdges(D) }); GD.layout('layered', { rankdir: 'right' });
          { const xs = D.states.map((q) => q.x), ys = D.states.map((q) => q.y), lx = Math.min(...xs), hx = Math.max(...xs), ly = Math.min(...ys), hy = Math.max(...ys); D.states.forEach((q) => { q.x = hx > lx ? 2.0 + ((q.x - lx) / (hx - lx)) * 5.2 : 5; q.y = hy > ly ? 1.7 + ((q.y - ly) / (hy - ly)) * 3.0 : 3.6; }); }
          const known = new Set(['S0']); const out = [{ cur: null, proc: [], shown: ['S0'], note: `Start: $D_0=E(\\{${texName3(N, N.start)}\\})=${setTex(N, D.states[0].set)}$.` }]; const proc = [];
          D.states.forEach((st, i) => {
            const row = N.alpha.map((c) => { const t = D.delta[st.id][c][0]; const isNew = !known.has(t); known.add(t); return { c, t, isNew }; }); proc.push(st.id);
            out.push({ cur: st.id, proc: proc.slice(), shown: [...known], row, note: `Process $D_{${i}}=${setTex(N, st.set)}$: ` + row.map(({ c, t }) => `on **${c}** go to $${setTex(N, D.states[+t.slice(1)].set)}$ (${t === st.id ? 'itself' : row.find((r) => r.t === t && r.isNew) ? `new state $D_{${t.slice(1)}}$` : `$D_{${t.slice(1)}}$`})`).join('; ') + '.' });
          });
          frames = out; if (S) S.reset({ at: 'end' });
        }
        rebuild();
        S = v.steps({ frames: () => frames, speed: 1.1, still: 99, note: true });
        S.el.hidden = false; kS.el.hidden = true;
        v.render(() => {
          const run = mode.value === 'run', n = w.length;
          if (kS.value > n) kS.set(n);
          const u3 = fit(ns, N); if (N.thompson) bendEdges(GN, u3);
          const f = S.frame, shown = run ? D.states.map((s) => s.id) : f.shown ?? ['S0'], proc = run ? D.states.map((s) => s.id) : f.proc ?? [];
          const Dv = { ...D, states: D.states.filter((s) => shown.includes(s.id)), delta: Object.fromEntries(D.states.filter((s) => proc.includes(s.id)).map((s) => [s.id, D.delta[s.id]])) };
          GD.nodes = Dv.states; GD.edges = dfaEdges(Dv);
          const rr = nfaRun(N, w.slice(0, kS.value)); let q = D.start; for (const c of w.slice(0, kS.value)) q = D.delta[q][c][0];
          const curSet = run ? rr.sets[kS.value] : f.cur ? D.states.find((s) => s.id === f.cur).set : D.states[0].set;
          const col = run ? (kS.value === n ? (hasAcc(N, rr.sets[n]) ? 'green' : 'red') : 'gold') : 'gold';
          drawNFA(v, ns, GN, N, { fill: (id) => (curSet.includes(id) && (run || f.cur || !f.cur) ? col : null) });
          GD.draw({
            nodeLabel: (id, nd) => nd.label, nodeRing: (id) => (D.states.find((s) => s.id === id).acc ? 'ink' : null),
            nodeFill: (id) => (run ? (id === q ? col : null) : id === f.cur ? 'gold' : null),
            nodeColor: (id) => (!run && f.row?.some((r) => r.isNew && r.t === id) ? 'green' : null),
            labelColor: (id) => ((run ? id === q : id === f.cur) ? onColor(v, 'gold') : null),
            edgeColor: (e) => (!run && e.from === f.cur ? 'gold' : null), edgeWidth: (e) => (!run && e.from === f.cur ? 2.6 : null), edgeLabel: (e) => e.label,
          });
          const sd = D.states.find((s) => s.id === D.start); if (sd) { const nd = GD.node(D.start); if (nd && isFinite(nd.x)) { const px = ds.X(nd.x), py = ds.Y(nd.y); ds.arrow(ds.invX(px - 70), ds.invY(py), ds.invX(px - 38), ds.invY(py), { color: 'ink', width: 2, head: 8 }); } }
          ns.corner('NFA', 'tl', { size: 12, color: 'muted', weight: 600 }); ds.corner(run ? 'DFA (complete)' : `DFA so far: ${shown.length} subset${shown.length === 1 ? '' : 's'}`, 'tl', { size: 12, color: 'muted', weight: 600 });
        });
        v.legend([['gold', 'NFA live set = DFA state', { dot: true }], ['green', 'newly discovered subset'], ['ink', 'double ring: contains an accepting NFA state']]);
        v.readout(() => {
          const total = D.states.length, n = N.states.length;
          let s = `$|Q|=${n}$ NFA states · reachable subsets: **${total}** of $2^{${n}}=${2 ** n}$ possible`;
          if (mode.value === 'run') {
            const x = w.slice(0, kS.value), a = nfaAccepts(N, x), b = dfaAccepts(D, x);
            const bad = [...upTo(N.alpha, 6)].find((u) => nfaAccepts(N, u) !== dfaAccepts(D, u));
            s += ` · on $${tt(x)}$: NFA ${a ? 'accepts' : 'rejects'}, DFA ${b ? 'accepts' : 'rejects'} ${a === b ? '✓' : '✗'} · all strings of length ≤ 6 agree: ${bad == null ? '✓' : '✗ at ' + bad}`;
          } else s += ` · discovered so far: ${(S.frame.shown ?? []).length}`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Exponential blow-up of determinization',
      statement: String.raw`For every $k\ge1$ the language $L_k=\{w\in\{0,1\}^*:\text{the }k\text{-th symbol from the right end of }w\text{ is }1\}$ is accepted by an NFA with $k+1$ states, but every DFA for $L_k$ has at least $2^k$ states. Hence the $2^{|Q|}$ bound of the subset construction (3.3) is essentially attained: determinization can cost an exponential number of states. (The mirror language "the $k$-th symbol from the *left* is 1" needs only $k+2$ states, even as a DFA.)`,
      idea: String.raw`The NFA keeps one token on the start state and guesses, on each 1, that this is the $k$-th symbol from the end; $k-1$ further states count down to the end of the input. A DFA must remember the last $k$ symbols: if two different strings $x\ne y$ of length $k$ led to the same state, take the first position where they differ, say $x_i=1$, $y_i=0$; appending $0^{i-1}$ moves that position to the $k$-th place from the end, so $x0^{i-1}\in L_k$ but $y0^{i-1}\notin L_k$, a contradiction. So the $2^k$ strings of length $k$ reach pairwise different states.`,
      caption: String.raw`Left: the $(k+1)$-state NFA for $L_k$. Middle: its subset automaton, whose states are labelled by the **last $k$ symbols read** — a shift register, one state per bit pattern. Right: sizes on a **log axis** for $k=1,\dots,10$, all computed by running the subset construction and Moore's partition refinement on the actual machines: the NFA grows by one state per step, the DFA doubles. Switch to **from the left** and the blow-up disappears.`,
      deps: ['toc-3.3'],
      refs: ['Sipser §1.2'],
      credit: 'Meyer & Fischer, 1971; Moore, 1971 (tightness of the 2^n bound)',
      scope: String.raw`Meyer and Fischer (1971) and Moore (1971) are the standard references for the exponential gap between NFAs and DFAs; Moore's paper concerns exactly the number of states in the subset construction. That the family drawn here (the $k$-th symbol from the end) is the one used in those papers has not been checked.`,
      tags: ['automata', 'state complexity'],
      viz(v) {
        let fam = 'end';
        const kS = v.slider('$k$', 1, 4, 3, { int: true });
        v.select('language', [{ value: 'end', label: 'k-th symbol from the end is 1' }, { value: 'start', label: 'k-th symbol from the start is 1' }], 'end', { onChange: (x) => { fam = x; } });
        const ns = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 290, weight: 1 });
        const ds = v.stage({ x: [-1.75, 1.75], y: [-1.6, 1.75], axes: false, equal: true, height: 290, weight: 1 });
        const cs = v.stage({ x: [0.5, 10.5], y: [1, 2000], ylog: true, axes: 'box', gutter: true, xlabel: 'k', ylabel: 'number of states', height: 290, weight: 1.15 });
        const GN = nfaGraph(v, ns, FAM(3), { draggable: false, r: 18 });
        const GD = v.graph(ds, { nodes: [], edges: [], layout: 'none', directed: true, draggable: true, r: 17, autoRadius: false, texSize: 11.5, edgeFontSize: 11 });
        const cache = {};
        const info = (f, k) => { const key = f + k; if (!cache[key]) { const N = (f === 'end' ? FAM : FAM_START)(k), D = determinize(N); cache[key] = { N, D, nfa: k + 1, sub: D.states.length, min: minimalSize(D) }; } return cache[key]; };
        const series = (f) => Array.from({ length: 10 }, (_, i) => info(f, i + 1));
        let built = '', certKey = '', cert = null;
        v.render(() => {
          const k = kS.value, I = info(fam, k);
          if (built !== fam + k) {
            built = fam + k; GN.sync(I.N);
            I.D.states.forEach((s) => { s.label = fam === 'end' ? `$\\mathtt{${Array.from({ length: k }, (_, j) => (s.set.includes('q' + (k - j)) ? '1' : '0')).join('')}}$` : '$' + setTex(I.N, s.set) + '$'; });
            I.D.states.forEach((s, i) => { const a = (2 * Math.PI * i) / I.D.states.length; s.x = Math.sin(a) * 1.15; s.y = Math.cos(a) * 1.15; if (I.D.states.length === 2) { s.x = i ? 0.8 : -0.8; s.y = 0; } });
            GD.set({ nodes: I.D.states, edges: dfaEdges(I.D) });
          }
          drawNFA(v, ns, GN, I.N, {});
          GD.draw({ nodeLabel: (id, nd) => nd.label, nodeRing: (id) => (I.D.states.find((s) => s.id === id).acc ? 'ink' : null), nodeFill: (id) => (id === 'S0' ? null : null), edgeLabel: (e) => e.label, edgeColor: (e) => (e.syms.includes('1') && !e.syms.includes('0') ? 'orange' : e.syms.includes('0') && !e.syms.includes('1') ? 'blue' : null), edgeLabelColor: (e) => (e.syms.includes('1') && !e.syms.includes('0') ? 'orange' : e.syms.includes('0') && !e.syms.includes('1') ? 'blue' : null) });
          const sd = GD.node('S0'); if (sd && isFinite(sd.x)) { const px = ds.X(sd.x), py = ds.Y(sd.y); ds.arrow(ds.invX(px), ds.invY(py - 62), ds.invX(px), ds.invY(py - 26), { color: 'ink', width: 2, head: 8 }); }
          ns.corner(`NFA: ${I.nfa} states`, 'tl', { size: 12, color: 'muted', weight: 600 }); ds.corner(`subset DFA: ${I.sub} states`, 'bl', { size: 12, color: 'muted', weight: 600 });
          const ser = series(fam), pts = (key) => ser.map((r, i) => [i + 1, r[key]]);
          cs.fn((x) => 2 ** x, { color: 'faint', dash: true, width: 1.4, domain: [1, 10] });
          cs.path(pts('nfa'), { color: 'blue', width: 2.4 }); cs.path(pts('sub'), { color: 'orange', width: 2.4 }); cs.path(pts('min'), { color: 'green', width: 1.8, dash: [6, 3] });
          for (const [key, col] of [['nfa', 'blue'], ['sub', 'orange']]) cs.dots(pts(key), { r: 3.2, color: col });
          cs.vline(k, { color: 'gold', width: 1.4, alpha: 0.6, dash: true });
          cs.dot(k, I.nfa, { r: 6, color: 'blue' }); cs.dot(k, I.sub, { r: 6, color: 'orange' });
          
        });
        v.legend([['blue', 'NFA states'], ['orange', 'DFA from the subset construction'], ['green', 'minimal DFA (Moore refinement)', { dash: true }], ['faint', '$2^k$', { dash: true }]]);
        v.readout(() => {
          const k = kS.value, I = info(fam, k), all = series(fam);
          const ok = all.every((r, i) => fam === 'end' ? r.sub === 2 ** (i + 1) && r.min === 2 ** (i + 1) : r.min <= i + 3);
          return fam === 'end'
            ? `$k=${k}$: NFA **${I.nfa}** states · subset construction reaches **${I.sub}** $=2^{${k}}$ states · the minimal DFA has **${I.min}** (no DFA can be smaller) · for all $k\\le10$: minimal DFA $=2^k$ ${ok ? '✓' : '✗'} · at $k=10$ the NFA has 11 states, every DFA at least 1024`
            : `$k=${k}$: NFA **${I.nfa}** states · subset construction **${I.sub}** states · minimal DFA **${I.min}** $\\le k+2$ ${ok ? '✓' : '✗'} — no blow-up: the first $k$ symbols are read by a deterministic chain`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Closure under union, concatenation and star',
      statement: String.raw`If $A$ and $B$ are regular languages then so are $A\cup B$, $AB=\{xy: x\in A,\ y\in B\}$ and $A^*=\{x_1\cdots x_k: k\ge0,\ x_i\in A\}$. With NFAs $N_A,N_B$ (3.2 allows ε-arrows) the constructions are: **union** — a new start state with ε-arrows to both old start states, accepting states of both; **concatenation** — an ε-arrow from every accepting state of $N_A$ to the start state of $N_B$, with only $N_B$'s accepting states accepting; **star** — a *new* accepting start state with an ε-arrow to the old start state, and an ε-arrow from every accepting state back to the old start state. Together with complement and intersection (2.5, 2.6) the regular languages form a Boolean algebra closed under the regular operations.`,
      idea: String.raw`Each construction lets the nondeterministic machine *guess* where one piece ends and the next begins: the ε-arrow is the guess "now the first word is finished" (concatenation), "start over with another word" (star) or "I choose the left alternative" (union). The new start state in the star construction is needed: simply turning the old start state accepting would also accept any string that merely returns to it (1.7 turns the correctness proof into an induction on the number of pieces).`,
      caption: String.raw`Pick two small machines $A$ (blue) and $B$ (orange) and an operation: the new states and the ε-arrows added by the construction are green and **gold**. Type a string with the keys: the three readouts show whether $A$, $B$ and the combined NFA accept it. The barcode at the bottom lists *every* string up to length 6 (green = accepted by the combined machine) and the readout checks all of them against the operation applied to the languages themselves. For the second pair choose **star** and switch on the **naive star** (no new start state) to see the standard mistake produce wrong acceptances (red outline).`,
      deps: ['toc-3.2', 'toc-1.2'],
      refs: ['Sipser §1.2'],
      tags: ['closure properties', 'nondeterminism'],
      viz(v) {
        const MA = { abstar: () => ({ w: 2.4, states: [['p0', 0, 0, 0], ['p1', 2.4, 0, 1]], delta: { p0: { a: ['p1'] }, p1: { b: ['p1'] } }, loops: { p1: 90 } }), astarb: () => ({ w: 2.4, states: [['p0', 0, 0, 0], ['p1', 2.4, 0, 1]], delta: { p0: { a: ['p0'], b: ['p1'] }, p1: {} }, loops: { p0: 90 } }) };
        const MB = { bastar: () => ({ w: 2.4, states: [['r0', 0, 0, 0], ['r1', 2.4, 0, 1]], delta: { r0: { b: ['r1'] }, r1: { a: ['r1'] } }, loops: { r1: 90 } }), ab: () => ({ w: 4.4, states: [['r0', 0, 0, 0], ['r1', 2.2, 0, 0], ['r2', 4.4, 0, 1]], delta: { r0: { a: ['r1'] }, r1: { b: ['r2'] }, r2: {} }, loops: {} }) };
        const NAMES = { abstar: 'ab*', astarb: 'a*b', bastar: 'ba*', ab: 'ab' };
        let pair = 1, op = 'union', w = 'abb';
        v.select('machines', [{ value: 1, label: 'A = ab*, B = ba*' }, { value: 2, label: 'A = a*b, B = ab' }], 1, { onChange: (x) => { pair = +x; } });
        v.select('operation', [{ value: 'union', label: 'union' }, { value: 'cat', label: 'concatenation' }, { value: 'star', label: 'star' }], 'union', { onChange: (x) => { op = x; naive.el.hidden = x !== 'star'; } });
        const naive = v.toggle('naive star (no new start state)', false); naive.el.hidden = true;
        keypad(v, ['a', 'b'], () => w, (x) => { w = x; }, { max: 8 });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 300, full: true });
        const bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 160, full: true });
        const mk = (m) => nfa(['a', 'b'], m.states, m.states[0][0], m.delta, {}, { loops: m.loops });
        function compose() {
          const a = (pair === 1 ? MA.abstar : MA.astarb)(), b = (pair === 1 ? MB.bastar : MB.ab)(), NA = mk(a), NB = mk(b);
          const st = [], delta = {}, eps = {}, loops = {}, glue = [], colorOf = {}; const nd = naive.value && op === 'star';
          const put = (m, ox, oy, accKeep, col) => { for (const [id, x, y, acc] of m.states) { st.push([id, x + ox, y + oy, accKeep(id, acc)]); delta[id] = m.delta[id]; eps[id] = []; colorOf[id] = col; } Object.assign(loops, m.loops); };
          let start;
          if (op === 'union') { put(a, 3, 5.1, (i, c) => c, 'blue'); put(b, 3, 1.9, (i, c) => c, 'orange'); st.push(['s0', 1, 3.5, false]); delta.s0 = {}; eps.s0 = ['p0', 'r0']; colorOf.s0 = 'green'; glue.push('s0>p0', 's0>r0'); start = 's0'; }
          else if (op === 'cat') { const ox = 0.9; put(a, ox, 3.6, () => false, 'blue'); put(b, ox + a.w + 2, 3.6, (i, c) => c, 'orange'); a.states.filter(([, , , c]) => c).forEach(([id]) => { eps[id] = ['r0']; glue.push(id + '>r0'); }); start = 'p0'; }
          else if (!nd) { put(a, 3.6, 3.6, (i, c) => c, 'blue'); st.push(['s0', 1.2, 3.6, true]); delta.s0 = {}; eps.s0 = ['p0']; colorOf.s0 = 'green'; glue.push('s0>p0'); a.states.filter(([, , , c]) => c).forEach(([id]) => { eps[id] = ['p0']; glue.push(id + '>p0'); }); start = 's0'; }
          else { put(a, 1.8, 3.6, (i, c) => c || i === 'p0', 'blue'); a.states.filter(([, , , c]) => c).forEach(([id]) => { eps[id] = ['p0']; glue.push(id + '>p0'); }); start = 'p0'; }
          const N = nfa(['a', 'b'], st, start, delta, eps, { loops });
          return { N, NA, NB, glue, colorOf, ref: (u) => { const inA = (x) => nfaAccepts(NA, x), inB = (x) => nfaAccepts(NB, x); if (op === 'union') return inA(u) || inB(u); if (op === 'cat') { for (let i = 0; i <= u.length; i++) if (inA(u.slice(0, i)) && inB(u.slice(i))) return true; return false; } const ok = [true]; for (let j = 1; j <= u.length; j++) { ok[j] = false; for (let i = 0; i < j && !ok[j]; i++) if (ok[i] && inA(u.slice(i, j))) ok[j] = true; } return ok[u.length]; } };
        }
        let C = compose(), key = '', G = null;
        v.render(() => {
          const k2 = pair + op + naive.value; if (k2 !== key) { key = k2; C = compose(); if (!G) G = nfaGraph(v, gs, C.N, { draggable: true, r: 17, texSize: 14 }); else G.sync(C.N); }
          drawNFA(v, gs, G, C.N, {
            color: (id) => C.colorOf[id], edgeColor: (e) => (C.glue.includes(e.from + '>' + e.to) ? 'gold' : null), edgeWidth: (e) => (C.glue.includes(e.from + '>' + e.to) ? 2.8 : null),
            edgeLabelColor: (e) => (C.glue.includes(e.from + '>' + e.to) ? 'gold' : null),
          });
          const title = op === 'union' ? `A ∪ B   (A = ${NAMES[pair === 1 ? 'abstar' : 'astarb']}, B = ${NAMES[pair === 1 ? 'bastar' : 'ab']})` : op === 'cat' ? `A B   (A = ${NAMES[pair === 1 ? 'abstar' : 'astarb']}, B = ${NAMES[pair === 1 ? 'bastar' : 'ab']})` : `A*   (A = ${NAMES[pair === 1 ? 'abstar' : 'astarb']})${naive.value ? ' — naive' : ''}`;
          gs.corner(title, 'tl', { size: 12.5, color: 'muted', weight: 600 });
          const P = pen(bs, v);
          drawBarcode(P, ['a', 'b'], 6, (u) => { const hit = nfaAccepts(C.N, u), ref = C.ref(u); if (hit !== ref) return { color: 'red', hit, outline: 'red', alpha: 0.9 }; return hit ? { color: 'green', hit } : null; });
        });
        v.legend([['blue', 'machine A', { dot: true }], ['orange', 'machine B', { dot: true }], ['green', 'new state / accepted string', { dot: true }], ['gold', 'new ε-arrows'], ['red', 'string where the machine is wrong', { dot: true }]]);
        v.readout(() => {
          const a = nfaAccepts(C.NA, w), b = nfaAccepts(C.NB, w), c = nfaAccepts(C.N, w), ref = C.ref(w);
          let bad = null, cnt = 0; for (const u of upTo(['a', 'b'], 8)) { cnt++; if (nfaAccepts(C.N, u) !== C.ref(u)) { bad = u; break; } }
          return `$w=${tt(w)}$: $A$ ${a ? 'accepts' : 'rejects'}, $B$ ${b ? 'accepts' : 'rejects'}, combined NFA **${c ? 'accepts' : 'rejects'}** (the operation on the languages says ${ref ? 'yes' : 'no'}) · all 511 strings of length ≤ 8: ${bad == null ? '**agree** ✓' : `**disagree**, first at $${tt(bad)}$ ✗`} · ${C.N.states.length} states`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Regular expressions',
      statement: String.raw`**Regular expressions** over $\Sigma$ are built inductively: $\varnothing$, $\varepsilon$ and each $a\in\Sigma$ are expressions; if $r,s$ are expressions so are $(r\cup s)$, $(rs)$ and $(r^*)$. The language $L(r)$ is defined by the same induction: $L(\varnothing)=\varnothing$, $L(\varepsilon)=\{\varepsilon\}$, $L(a)=\{a\}$, $L(r\cup s)=L(r)\cup L(s)$, $L(rs)=L(r)L(s)$, $L(r^*)=L(r)^*$ (the three regular operations of 1.2). Conventions: $^*$ binds tighter than concatenation, which binds tighter than $\cup$; $r^+=rr^*$ and $r?=r\cup\varepsilon$ are abbreviations. A language is **regex-definable** iff it is $L(r)$ for some $r$ (Kleene's theorem, 3.9, says: iff it is regular).`,
      idea: String.raw`An expression is a syntax tree, and its language is computed bottom-up by a structural recursion: leaves denote $\varnothing$, $\{\varepsilon\}$ or a single letter, and each inner node applies one regular operation to the languages of its children. That is why every proof about regular expressions (3.7, 3.11) is an induction on the tree, and why the precedence conventions matter: $ab^*$ and $(ab)^*$ are different trees.`,
      caption: String.raw`Type an expression (use $|$ or ∪ for union, \* for star, + and ? as abbreviations, the buttons insert ε and ∪). Its **syntax tree** is drawn on the left — union orange, concatenation blue, star purple; **click a node** to list the language of that sub-expression, level by level, on the right (all strings up to the chosen length, with counts). Type a string with the keys to see whether it is in $L(r)$. Malformed input is reported instead of drawn.`,
      deps: ['toc-1.2'],
      refs: ['Sipser §1.3'],
      credit: 'Kleene, 1951 (RAND report), published 1956',
      tags: ['regular expressions', 'syntax'],
      viz(v) {
        let w = 'abab', sel = 0, built = '', ids = [];
        const RI = rxInput(v, { value: '(a|b)*abb', presets: [['(a|b)*abb', '(a|b)*abb'], ['a*b*', 'a*b*'], ['(ab)*|ba', '(ab)*|ba'], ['a(a|b)*a|a', 'a(a|b)*a|a'], ['(a|ε)b*', '(a|ε)b*'], ['(aa)*', '(aa)*'], ['(a*b)*', '(a*b)*']] });
        const nS = v.slider('longest string listed', 1, 6, 4, { int: true });
        keypad(v, ['a', 'b'], () => w, (x) => { w = x; }, { max: 8 });
        const ts = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 320, weight: 1.15 });
        const ls = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 320, weight: 1 });
        const G = v.graph(ts, { nodes: [], edges: [], layout: 'none', directed: false, r: 17, autoRadius: false, fontSize: 15, draggable: false });
        const label = (e) => ({ sym: e.c, eps: 'ε', empty: '∅', cat: '∘', alt: '∪', star: '*' }[e.t]);
        const colorOf = (e) => ({ alt: 'orange', cat: 'blue', star: 'purple' }[e.t] || null);
        const sub = []; // node id -> AST
        G.onClick = ({ node }) => { if (node) sel = node.id; return true; };
        const matches = (ast, u) => { let q = ast; for (const c of u) q = deriv(q, c); return nullable(q); };
        v.render(() => {
          const res = RI.cur();
          if (res.error) {
            const P = pen(ts, v); P.sans(res.error, P.W / 2, P.H / 2, { size: 14, color: 'red', weight: 600 });
            const P2 = pen(ls, v); P2.sans('no expression, no language', P2.W / 2, P2.H / 2, { size: 13, color: 'muted' }); return;
          }
          const src = RI.inp.value;
          if (built !== src) {
            built = src; sub.length = 0; const nodes = [], edges = [];
            (function go(e, parent) { const id = sub.length; sub.push(e); nodes.push({ id, label: label(e) }); if (parent != null) edges.push({ from: parent, to: id }); if (e.t === 'cat' || e.t === 'alt') { go(e.l, id); go(e.r, id); } else if (e.t === 'star') go(e.e, id); })(res.ast, null);
            G.set({ nodes, edges }); G.layout('tree', { root: 0 }); sel = 0;
          }
          G.draw({
            nodeColor: (id) => colorOf(sub[id]), nodeRing: (id) => (id === sel ? 'gold' : null),
            nodeFill: (id) => (id === sel ? 'gold' : null),
          });
          const e = sub[sel] ?? res.ast, alpha = [...new Set([...symbolsOf(res.ast), 'a', 'b'])].sort().slice(0, 3), n = nS.value;
          const sets = langSets(e, n), P = pen(ls, v), rows = sets.map((S) => [...S].sort((x, y) => (x < y ? -1 : 1)));
          P.sans(`L( ${rx(e)} )  — strings up to length ${n}`, 10, 12, { align: 'left', size: 12.5, weight: 600, color: 'muted' });
          drawLangRows(P, rows, alpha.length, { rh: Math.min(26, (P.H - 34) / (n + 1)), top: 28 });
          const inL = matches(res.ast, w); P.sans(`${w === '' ? 'ε' : w} ∈ L(r)?  ${inL ? 'yes' : 'no'}`, P.W - 10, P.H - 12, { align: 'right', size: 13, weight: 700, color: inL ? 'green' : 'red' });
        });
        v.legend([['orange', '∪ (union)', { dot: true }], ['blue', 'concatenation', { dot: true }], ['purple', 'star', { dot: true }], ['gold', 'selected node', { dot: true }]]);
        v.readout(() => {
          const res = RI.cur(); if (res.error) return `**not an expression**: ${res.error}`;
          const e = sub[sel] ?? res.ast, c = countParts(res.ast), n = nS.value, tot = langSets(e, n).reduce((a, S) => a + S.size, 0);
          return `$r=${rxTeX(res.ast)}$ · ${c.operands} operand${c.operands === 1 ? '' : 's'}, ${c.operators} operator${c.operators === 1 ? '' : 's'} · $L(${rxTeX(e)})$ has **${tot}** string${tot === 1 ? '' : 's'} of length ≤ ${n}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Algorithm',
      name: 'Thompson’s construction: regex to NFA',
      statement: String.raw`**Input:** a regular expression $r$. **Output:** an ε-NFA $N(r)$ with exactly one start state, one accepting state and $L(N(r))=L(r)$, built by recursion on the syntax tree: $N(a)$ and $N(\varepsilon)$ are two states joined by an arrow labelled $a$ (or $\varepsilon$), $N(\varnothing)$ is two states and no arrow; for $r\cup s$ add a new start and a new final state with ε-arrows to/from the two fragments; for $rs$ identify the final state of $N(r)$ with the start state of $N(s)$; for $r^*$ add a new start and final state, ε-arrows start→fragment→final, an ε-arrow from the fragment's final state back to its start, and a bypass arrow start→final. Every state has at most two outgoing arrows, and $N(r)$ has at most $2m$ states, where $m$ is the number of symbols and operators in $r$.`,
      idea: String.raw`Each rule builds a machine for a compound expression from machines for its parts, touching only their start and final states, so correctness is a structural induction (3.5 for union, concatenation and star). The state bound follows because every rule adds at most two new states: two for each operand and for each union and star, none for concatenation. The ε-arrows keep the fragments independent, which is the point: no state of a fragment ever gains an arrow, so fragments can be assembled bottom-up without inspection.`,
      caption: String.raw`Type an expression and **step** through the construction in post-order: each step adds the fragment for one node of the syntax tree (the current fragment is bright, earlier ones faded) and a note says which rule was used. The final readout counts states against $2m$ and checks the NFA against the expression on every string up to length 7. The star fragment shows the three extra ε-arrows (back arc below, bypass above).`,
      deps: ['toc-3.5', 'toc-3.6'],
      refs: ['Sipser §1.3'],
      credit: 'Thompson, 1968 (search algorithm); textbook form of the construction',
      scope: String.raw`Ken Thompson's 1968 paper describes a regular-expression search that simulates the NFA (compiling to machine code); the NFA-building rules drawn here are the textbook formulation of that idea, in the variant that identifies states for concatenation (Aho, Sethi, Ullman), not a transcription of his paper.`,
      links: { 'Stanford author guide': 'https://web.stanford.edu/class/archive/cs/cs103/cs103.1254/guide_to_state_elimination' },
      tags: ['regular expressions', 'construction'],
      viz(v) {
        let T = null, built = '';
        const RI = rxInput(v, { value: '(a|b)*abb', presets: [['(a|b)*abb', '(a|b)*abb'], ['a*b*', 'a*b*'], ['(ab)*', '(ab)*'], ['ab|a', 'ab|a'], ['a(b|ε)', 'a(b|ε)']], onPick: () => { built = ''; } });
        const gs = v.stage({ x: [0, 10], y: [0, 7.2], axes: false, equal: true, height: 380, full: true });
        const G = nfaGraph(v, gs, nfa(['a'], [['q0', 0, 0, 0]], 'q0', { q0: {} }), { draggable: false, r: 14, texSize: 12.5 });
        const desc = (e) => ({ sym: `an operand: two states joined by an arrow labelled **${e.c}**`, eps: 'an operand: two states joined by an ε-arrow', empty: 'the empty language: two states and no arrow', cat: 'concatenation: **identify** the final state of the left fragment with the start state of the right one (two states become one, no new states)', alt: 'union: a new start state with ε-arrows into both fragments and a new final state with ε-arrows out of both', star: 'star: a new start and final state, ε-arrows start → fragment → final, an ε-arrow from the fragment’s final state back to its start, and the bypass start → final' }[e.t]);
        let S = null, Nsub = null;
        const frames = () => { const t = T; return t ? t.events.map((ev, i) => ({ i, note: `Sub-expression $${rxTeX(ev.node)}$ — ${desc(ev.node)}.` })) : []; };
        S = v.steps({ frames: () => frames(), speed: 1.0, still: 99 });
        const sub = (i) => {
          const vis = new Set(), edges = []; for (let j = 0; j <= i; j++) { T.events[j].newStates.forEach((q) => vis.add(q)); edges.push(...T.events[j].newEdges); }
          const last = i === T.events.length - 1, N = T.N;
          const st = N.states.filter((s) => vis.has(s.id)).map((s) => ({ ...s, acc: last && s.acc }));
          const delta = {}, eps = {}; for (const s of st) { delta[s.id] = {}; eps[s.id] = []; }
          for (const e of edges) { if (!delta[e.from]) continue; if (e.c === EPS) eps[e.from].push(e.to); else (delta[e.from][e.c] = delta[e.from][e.c] || []).push(e.to); }
          return { ...N, states: st, delta, eps, start: N.start };
        };
        v.render(() => {
          const res = RI.cur();
          if (res.error) { const P = pen(gs, v); P.sans(res.error, P.W / 2, P.H / 2, { size: 14, color: 'red', weight: 600 }); return; }
          if (built !== RI.inp.value) { built = RI.inp.value; T = thompson(res.ast); S.reset({ at: 'end' }); }
          const i = Math.min(S.i, T.events.length - 1), N = sub(i), ev = T.events[i], cur = new Set(ev.fr.ids);
          const unit = fitThompson(gs, T.N);
          G.nodes = N.states; G.edges = nfaEdges(N); bendEdges(G, unit);
          drawNFA(v, gs, G, N, {
            fill: (id) => (id === ev.fr.s || id === ev.fr.f ? 'gold' : null),
            color: (id) => (cur.has(id) ? 'accent' : null),
            dim: N.states.filter((s) => !cur.has(s.id)).map((s) => s.id),
          });
        });
        v.legend([['gold', 'start and final state of the current fragment', { dot: true }], ['accent', 'states of the current fragment', { dot: true }]]);
        v.readout(() => {
          const res = RI.cur(); if (res.error) return `**not an expression**: ${res.error}`;
          if (!T) return '';
          const c = countParts(res.ast), m = c.operands + c.operators, n = T.N.states.length, k = Math.min(7, 12);
          const A = langFlat(res.ast, k), B = new Set(); for (const u of upTo([...symbolsOf(res.ast)].sort().length ? [...symbolsOf(res.ast)].sort() : ['a'], k)) if (nfaAccepts(T.N, u)) B.add(u);
          return `$r=${rxTeX(res.ast)}$ has ${c.operands} operands + ${c.operators} operators $=m=${m}$ · the NFA has **${n}** states $\\le 2m=${2 * m}$ ${n <= 2 * m ? '✓' : '✗'} · ${T.N.states.reduce((a, s) => a + (Object.values(T.N.delta[s.id]).reduce((x, t) => x + t.length, 0) + T.N.eps[s.id].length), 0)} arrows, max out-degree ${Math.max(...T.N.states.map((s) => Object.values(T.N.delta[s.id]).reduce((x, t) => x + t.length, 0) + T.N.eps[s.id].length))} · $L(N(r))=L(r)$ on all strings of length ≤ ${k}: ${eqSets(A, B) ? '✓' : '✗'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Algorithm',
      name: 'State elimination: NFA to regex',
      statement: String.raw`**Input:** an NFA $N$. **Output:** a regular expression $r$ with $L(r)=L(N)$. First turn $N$ into a *generalized NFA* whose arrows carry regular expressions: add a new start state $I$ with an ε-arrow to $q_0$ and a new accepting state $F$ with an ε-arrow from every old accepting state, and merge parallel arrows by $\cup$. Then **rip out** the other states one at a time: to remove $q$, for every pair of remaining states $p,t$ (possibly equal) replace the label $R_{pt}$ by $$R_{pt}\ \cup\ R_{pq}\,R_{qq}^{*}\,R_{qt}.$$ When only $I$ and $F$ remain, the label of $I\to F$ is the answer. The result depends on the elimination order, but every order gives an equivalent expression.`,
      idea: String.raw`A path through a removed state $q$ enters $q$, loops there any number of times, and leaves; the formula writes exactly that as a single arrow, so the set of strings labelling paths from $I$ to $F$ never changes during a removal (an induction on the number of removed states). The expression can nevertheless grow exponentially in the number of states, because each removal can multiply the lengths of many labels, and a bad order makes this worse.`,
      caption: String.raw`**Click a state** to rip it out (or use the buttons for left-to-right and fewest-edges-first orders, undo and reset): new arrows appear with the labels $R_{pq}R_{qq}^*R_{qt}$. When every state is gone, the label of $I\to F$ is the answer and is checked against the NFA on all strings up to length 7. The bars show the **final size of the expression for every possible elimination order** (sorted); the gold bar is the order you chose, so you can see how much the order matters.`,
      deps: ['toc-3.1', 'toc-3.6'],
      refs: ['Stanford CS103, Guide to State Elimination, Winter 2025, Initial Setup and Step Two', 'Pettorossi, Automata Theory and Formal Languages, §2.6, Theorem 2.6.1 (language equations)'],
      credit: 'Textbook state-elimination construction; explicit path invariant supplied here',
      scope: String.raw`Modern generalized-NFA construction, verified against the complete Stanford CS103 guide. Its original historical priority is not asserted. Missing edges mean the empty language and all update labels use the **pre-removal** graph. The finite length-7 comparison is a spot check; after full elimination an independent subset-product search also checks equality on all words (or explicitly reports its resource cap).`,
      links: { 'Stanford author guide': 'https://web.stanford.edu/class/archive/cs/cs103/cs103.1254/guide_to_state_elimination' },
      tags: ['regular expressions', 'construction'],
      viz(v) {
        const PS = { endsAB: () => NFAS.endsAB(), aaOrBb: () => NFAS.aaOrBb(), secondA: () => NFAS.secondA(), evenA: () => asNFA(PRESETS.evenA()) };
        let N = PS.aaOrBb(), hist = [], removed = [], note = '', G = null, nodesIF = null;
        const sel = v.select('automaton', [{ value: 'endsAB', label: 'ends in ab' }, { value: 'aaOrBb', label: 'contains aa or bb' }, { value: 'secondA', label: '2nd from end is a' }, { value: 'evenA', label: 'even number of a (DFA)' }], 'aaOrBb', { onChange: (k) => { N = PS[k](); reset(); } });
        v.button('undo', () => { if (hist.length > 1) { hist.pop(); removed.pop(); note = ''; } });
        v.button('reset', () => reset());
        const cur = () => hist[hist.length - 1];
        const alive = () => [...cur().alive].filter((q) => q !== 'I' && q !== 'F');
        const rip = (q) => { if (!alive().includes(q)) return; hist.push(eliminate(cur(), q)); removed.push(q); note = `Removed $${texName3(N, q)}$: every path $p\\to ${texName3(N, q)}\\to t$ became the single arrow $R_{p${texName3(N, q)}}R_{${texName3(N, q)}${texName3(N, q)}}^{*}R_{${texName3(N, q)}t}$.`; };
        v.button('auto: left to right', () => { for (const q of alive().sort()) rip(q); });
        v.button('auto: fewest paths first', () => { while (alive().length) { const g = cur(); const sc = (q) => { const ins = [...g.alive].filter((p) => p !== q && g.E[p + '>' + q]).length, outs = [...g.alive].filter((t) => t !== q && g.E[q + '>' + t]).length; return ins * outs; }; rip(alive().sort((a, b) => sc(a) - sc(b))[0]); } });
        function reset() { hist = [gnfaFromNFA(N)]; removed = []; note = ''; if (G) { nodesIF = null; } }
        reset();
        const gs = v.stage({ x: [-1.2, 11.2], y: [0, 7.2], axes: false, equal: true, height: 330, weight: 1.6 });
        const bs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 0.8 });
        const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
        const sizes = {}; const allSizes = () => { const k = sel.value; if (!sizes[k]) sizes[k] = perms(N.states.map((s) => s.id)).map((o) => ({ o, size: rxSize(nfaToRegex(N, o)) })).sort((a, b) => a.size - b.size); return sizes[k]; };
        const short = (e) => { const t = rx(e); return t.length > 24 ? t.slice(0, 22) + '…' : t; };
        let built = '', certKey = '', cert = null;
        G = v.graph(gs, { nodes: [], edges: [], layout: 'none', directed: true, r: 17, autoRadius: false, texSize: 14, draggable: true, edgeFontSize: 11.5 });
        G.onClick = ({ node }) => { if (node && node.id !== 'I' && node.id !== 'F') rip(node.id); return true; };
        v.render(() => {
          if (built !== sel.value + '|' + hist.length + removed.join('')) { built = sel.value + '|' + hist.length + removed.join(''); }
          if (!nodesIF || nodesIF.key !== sel.value) { nodesIF = { key: sel.value, I: { id: 'I', x: -0.4, y: 3.6, label: '$I$' }, F: { id: 'F', x: 10.4, y: 3.6, label: '$F$' }, map: Object.fromEntries(N.states.map((s) => [s.id, s])) }; }
          const g = cur(), nodes = [nodesIF.I, ...N.states.filter((s) => g.alive.has(s.id)), nodesIF.F];
          const edges = Object.entries(g.E).map(([k, e]) => { const [a, b] = k.split('>'); return { from: a, to: b, label: short(e), directed: true, angle: a === b ? 90 : undefined }; });
          G.nodes = nodes; G.edges = edges;
          const left = alive().length;
          G.draw({
            nodeLabel: (id, n) => n.label ?? id, nodeRing: (id) => (id === 'F' ? 'ink' : null),
            nodeColor: (id) => (id === 'I' || id === 'F' ? 'green' : left > 0 ? 'accent' : null),
            nodeFill: (id) => (id !== 'I' && id !== 'F' && left === 0 ? null : null),
            edgeLabel: (e) => e.label, edgeColor: (e) => (e.from === 'I' && e.to === 'F' ? 'green' : null), edgeWidth: (e) => (e.from === 'I' && e.to === 'F' ? 3 : null),
          });
          const sd = nodesIF.I; const px = gs.X(sd.x), py = gs.Y(sd.y); gs.arrow(gs.invX(px - 52), gs.invY(py), gs.invX(px - 22), gs.invY(py), { color: 'ink', width: 2, head: 8 });
          gs.corner(left ? `${left} state${left === 1 ? '' : 's'} left — click one to remove it` : 'only I and F remain', 'tl', { size: 12, color: 'muted', weight: 600 });
          // bars of all orders
          const all = allSizes(), mine = removed.length === N.states.length ? removed : null;
          const mineSize = mine ? rxSize(g.E['I>F'] || R.empty) : null;
          bs.setView([0, all.length + 1], [0, Math.max(...all.map((a) => a.size)) * 1.12]);
          bs.bars(all.map((a) => a.size), { color: (val, i) => (mine && all[i].o.join() === mine.join() ? 'gold' : 'accent') });
          bs.corner(`final size over all ${all.length} orders: ${all[0].size} to ${all.at(-1).size}`, 'tl', { size: 11.5, color: 'muted', weight: 600 });
        });
        v.legend([['accent', 'state of the generalized NFA', { dot: true }], ['gold', 'your elimination order (bar chart)', { dot: true }]]);
        
        v.readout(() => {
          const g = cur(), left = alive();
          if (left.length) return (note || 'Click a state to rip it out.') + ` · ${Object.keys(g.E).length} arrows`;
          const r = g.E['I>F'] || R.empty, A = langFlat(r, 7), B = nfaLang(N, 7), all = allSizes();
          const ck = sel.value + '|' + removed.join(','); if (certKey !== ck) { certKey = ck; cert = regexDifference(N, r); }
          return `$r=${rxTeX(r)}$ · size ${rxSize(r)} (orders give sizes ${all[0].size}…${all.at(-1).size}) · order ${removed.join('→')} · same strings as the NFA up to length 7: ${eqSets(A, B) ? '✓' : '✗'} · exact whole-language product check: ${cert.equal === null ? 'resource cap reached, unknown' : cert.equal ? 'equal ✓' : 'different ✗'} (${cert.pairs} reachable subset pairs)`;
        });
      },
    },
  ],
};
