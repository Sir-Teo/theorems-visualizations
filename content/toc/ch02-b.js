// Theory of Computation — Chapter 2: Finite automata (items 2.7–2.12; 2.1–2.6 in ch02.js)
import { EPS, DEAD, sh, layer, SANS, pen, keypad, dfa, cloneD, tgt, isAcc, step, run, dfaGraph, drawDFA, startArrow } from './ch02.shared.js';

const texState = (D, q) => (q === DEAD ? '\\varnothing' : String(D.states.find((s) => s.id === q)?.label ?? q).replace(/\$/g, ''));
const tt = (u) => (u ? `\\mathtt{${u}}` : '\\varepsilon');

// ---- 2.7: reachability analysis of a DFA, as step frames
function analyse(D) {
  const ids = D.states.map((s) => s.id), F = new Set(ids.filter((q) => isAcc(D, q)));
  const frames = [], R = new Set([D.start]), via = { [D.start]: '' }, Q = [D.start];
  const snap = (o) => frames.push({ R: new Set(R), C: new Set(o.C || []), cyc: o.cyc || [], ...o });
  snap({ phase: 1, cur: D.start, line: 1, note: 'Breadth-first search from the start state: it is reachable (by $\\varepsilon$).' });
  while (Q.length) {
    const u = Q.shift(), found = [];
    for (const c of D.alpha) { const t = step(D, u, c); if (t !== DEAD && !R.has(t)) { R.add(t); via[t] = via[u] + c; Q.push(t); found.push(t); } }
    snap({ phase: 1, cur: u, line: 1, note: `Explore the arrows out of $${texState(D, u)}$` + (found.length ? `: new states ${found.map((q) => `$${texState(D, q)}$`).join(', ')}.` : ': nothing new.') });
  }
  const RF = [...R].filter((q) => F.has(q));
  if (!RF.length) { snap({ phase: 2, line: 2, verdict: 'empty', note: `No accepting state is reachable${F.size ? ` (${[...F].map((q) => `$${texState(D, q)}$`).join(', ')} cannot be reached)` : ''}: $L(M) = \\varnothing$.` }); return { frames, verdict: 'empty', R, via }; }
  // backward search from the reachable accepting states, inside R
  const C = new Set(RF), B = [...RF];
  snap({ phase: 3, C, line: 3, note: `Accepting states are reachable, so $L(M)\\neq\\varnothing$. Now search backwards from them: which reachable states can still reach acceptance?` });
  while (B.length) {
    const u = B.shift(), found = [];
    for (const p of R) if (!C.has(p) && D.alpha.some((c) => step(D, p, c) === u)) { C.add(p); B.push(p); found.push(p); }
    if (found.length) snap({ phase: 3, C, cur: u, line: 3, note: `$${texState(D, u)}$ can be entered from ${found.map((q) => `$${texState(D, q)}$`).join(', ')}, which therefore lead to acceptance too.` });
  }
  // a cycle among the useful states (DFS colouring)
  const U = [...C], col = {}; let cyc = null;
  const dfs = (u, stack) => {
    col[u] = 1; stack.push(u);
    for (const c of D.alpha) { const t = step(D, u, c); if (!C.has(t)) continue; if (col[t] === 1) { cyc = stack.slice(stack.indexOf(t)).concat([t]); return true; } if (!col[t] && dfs(t, stack)) return true; }
    col[u] = 2; stack.pop(); return false;
  };
  for (const u of U) if (!col[u] && dfs(u, [])) break;
  if (cyc) {
    snap({ phase: 4, C, cyc, line: 4, verdict: 'infinite', note: `The useful states contain the cycle ${cyc.map((q) => `$${texState(D, q)}$`).join(' → ')}: it can be pumped as often as we like on the way to acceptance, so $L(M)$ is **infinite**.` });
    return { frames, verdict: 'infinite', R, C, cyc, via };
  }
  snap({ phase: 4, C, line: 5, verdict: 'finite', note: 'No cycle passes through a useful state: every accepting run is a simple path, so $L(M)$ is **finite** — every accepted string is shorter than the number of states.' });
  return { frames, verdict: 'finite', R, C, via };
}
// ---- 2.11 / 2.12: synchronizing automata as integer maps, subsets as bitmasks
function resetWord(delta) { // delta[c][i] = image of state i under letter c; returns the shortest word sending all states to one, or null
  const n = delta[0].length, full = (1 << n) - 1, prev = new Int32Array(1 << n).fill(-1), let_ = new Int8Array(1 << n);
  const img = (S, c) => { let T = 0; for (let i = 0; i < n; i++) if (S >> i & 1) T |= 1 << delta[c][i]; return T; };
  prev[full] = full; const q = [full];
  for (let h = 0; h < q.length; h++) {
    const S = q[h];
    if ((S & (S - 1)) === 0) { const w = []; let T = S; while (T !== full) { w.push(let_[T]); T = prev[T]; } return w.reverse(); }
    for (let c = 0; c < delta.length; c++) { const T = img(S, c); if (prev[T] < 0) { prev[T] = S; let_[T] = c; q.push(T); } }
  }
  return null;
}
const cerny = (n) => [Array.from({ length: n }, (_, i) => (i + 1) % n), Array.from({ length: n }, (_, i) => (i === 0 ? 1 : i))];
function randomAut(n, k, r) { return Array.from({ length: k }, () => Array.from({ length: n }, () => r.int(0, n - 1))); }

export default {
  collection: 'toc',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Algorithm',
      name: 'Emptiness and finiteness tests for DFAs',
      statement: String.raw`Given a DFA $M=(Q,\Sigma,\delta,q_0,F)$ one can decide in time $O(|Q|\,|\Sigma|)$
(a) whether $L(M)=\varnothing$: search the state graph from $q_0$; the language is empty exactly when no accepting state is reachable;
(b) whether $L(M)$ is infinite: restrict to the **useful** states — reachable from $q_0$ and able to reach $F$ — and test for a cycle; $L(M)$ is infinite exactly when one exists.

So the problems $E_{\mathrm{DFA}}=\{\langle M\rangle : L(M)=\varnothing\}$ and $\mathrm{INFINITE}_{\mathrm{DFA}}$ are decidable. Moreover a finite $L(M)$ contains only strings of length $<|Q|$, and if $L(M)$ is infinite it contains some string of length between $|Q|$ and $2|Q|-1$.`,
      idea: String.raw`Accepted strings are exactly the labels of paths from $q_0$ to $F$, so emptiness is plain reachability, solved by breadth-first search. A path from $q_0$ to $F$ can be made arbitrarily long only by going around a cycle, and that cycle must consist of states lying on such paths (useful states); conversely, a useful cycle $q\xrightarrow{y}q$ with $q_0\xrightarrow{x}q\xrightarrow{z}F$ yields $xy^kz\in L(M)$ for every $k$ — the germ of the pumping lemma (4.1).`,
      caption: String.raw`Step through the algorithm: the forward search fills the reachable states (blue), the backward search turns green the reachable states that can still reach acceptance, and a cycle through green states is drawn in red. **Click a state** to toggle whether it accepts; **click an arrow** to cut it (or restore it) — a cut arrow leads to the implicit dead state. Watch an unreachable accepting state change nothing, and an accepting trap state turn a finite language infinite.`,
      deps: ['toc-2.3', 'algo-8.4'],
      refs: ['Sipser §4.1'],
      credit: 'Rabin & Scott, 1959',
      tags: ['decidability', 'graph search'],
      viz(v) {
        const BASE = () => dfa(['a', 'b'], [['q0', 1.4, 3.6, 0], ['q1', 5, 5.3, 0], ['q2', 5, 1.9, 0], ['q3', 8.8, 3.6, 1], ['q4', 12.4, 5.3, 1], ['q5', 12.4, 1.9, 0]], 'q0', {
          q0: { a: 'q1', b: 'q2' }, q1: { a: 'q3', b: 'q2' }, q2: { a: 'q3', b: 'q5' }, q3: { a: 'q5', b: 'q5' }, q4: { a: 'q4', b: 'q3' }, q5: { a: 'q5', b: 'q5' },
        }, { loops: { q4: 0, q5: 0 } });
        const PRE = {
          finite: () => BASE(),
          infinite: () => { const D = BASE(); D.delta.q1.b = ['q1']; D.loops.q1 = 90; return D; },
          empty: () => { const D = BASE(); D.states.find((s) => s.id === 'q3').acc = false; return D; },
        };
        let D0 = PRE.finite(), cut = new Set();
        v.select('machine', [{ value: 'finite', label: 'finite language' }, { value: 'infinite', label: 'with a useful cycle' }, { value: 'empty', label: 'empty language' }], 'finite', { onChange: (k) => { D0 = PRE[k](); cut = new Set(); G.sync(D0); S.reset({ at: 'end' }); } });
        const s = v.stage({ x: [-0.2, 14.6], y: [0.1, 7.3], axes: false, equal: true, height: 300, full: true });
        const G = dfaGraph(v, s, D0);
        const live = () => { const D = cloneD(D0); for (const k of cut) { const [q, c] = k.split('|'); D.delta[q][c] = []; } return D; };
        let A = analyse(live());
        G.onClick = ({ node, edge }) => {
          if (node) { const st = D0.states.find((x) => x.id === node.id); if (st) st.acc = !st.acc; }
          else if (edge) { const keys = edge.syms.map((c) => edge.from + '|' + c), on = keys.every((k) => cut.has(k)); for (const k of keys) { if (on) cut.delete(k); else cut.add(k); } }
          else return true;
          S.reset({ at: 'end' }); return true;
        };
        const S = v.steps({ frames: () => (A = analyse(live())).frames, speed: 1.3, start: 'end', still: 'end',
          code: ['R ← states reachable from $q_0$   ▷ BFS', 'if R ∩ F = ∅: return EMPTY', 'U ← states of R that can reach F   ▷ BFS backwards', 'if the arrows inside U form a cycle: return INFINITE', 'return FINITE'], codeTitle: 'emptiness and finiteness', codePos: 'below' });
        v.render(() => {
          const f = S.frame, D = live(), cycE = new Set(); const cy = f.cyc || [];
          for (let i = 0; i + 1 < cy.length; i++) cycE.add(cy[i] + '|' + cy[i + 1]);
          for (const e of G.edges) e.dash = e.syms.every((c) => cut.has(e.from + '|' + c)) ? [3, 4] : undefined;
          drawDFA(v, s, G, D0, {
            fill: (id) => (id === f.cur ? 'gold' : f.C?.has(id) ? 'green' : f.R?.has(id) ? 'accent' : null),
            color: (id) => (f.R?.has(id) ? 'accent' : 'faint'),
            labelColor: (id) => (f.R?.has(id) && id !== f.cur ? 'panel' : !f.R?.has(id) ? 'muted' : null),
            edgeColor: (e) => (e.syms.every((c) => cut.has(e.from + '|' + c)) ? 'faint' : cycE.has(e.from + '|' + e.to) ? 'red' : null),
            edgeWidth: (e) => (cycE.has(e.from + '|' + e.to) ? 3.4 : null),
            dim: D0.states.filter((q) => f.phase >= 2 && !f.R?.has(q.id)).map((q) => q.id),
          });
          const vd = f.verdict;
          s.corner(vd ? { empty: 'verdict: L(M) = ∅', finite: 'verdict: L(M) is finite', infinite: 'verdict: L(M) is infinite' }[vd] : ['', 'forward search', '', 'backward search', 'cycle test'][f.phase || 1], 'tl', { size: 13, weight: 700, color: vd === 'empty' ? 'red' : vd ? 'green' : 'muted' });
        });
        v.legend([['accent', 'reachable', { dot: true }], ['green', 'useful: reachable and can reach acceptance', { dot: true }], ['red', 'useful cycle'], ['gold', 'being explored', { dot: true }]]);
        v.readout(() => {
          const D = live(), n = D.states.length, by = []; for (let L = 0; L < 2 * n; L++) by.push(layer(D.alpha, L).filter((u) => run(D, u).acc));
          const counts = by.map((x) => x.length);
          if (A.verdict === 'empty') return `Verdict **empty** · checked by brute force: no accepted string of length $< ${2 * n}$ (counts by length ${counts.join(', ')}).`;
          if (A.verdict === 'finite') { const all = by.flat(); return `Verdict **finite**: $L(M) = \\{${all.map(tt).join(', ')}\\}$, all of length $< |Q| = ${n}$ · brute force: nothing accepted at lengths ${n}–${2 * n - 1} ✓`; }
          const c = A.cyc[0], x = A.via[c], y = (() => { let w = '', q = c; for (let i = 0; i + 1 < A.cyc.length; i++) { const t = A.cyc[i + 1]; const ch = D.alpha.find((a) => step(D, q, a) === t); w += ch; q = t; } return w; })();
          let z = null; const seen = { [c]: '' }, Q2 = [c]; while (Q2.length && z == null) { const u = Q2.shift(); if (isAcc(D, u)) { z = seen[u]; break; } for (const ch of D.alpha) { const t = step(D, u, ch); if (t !== DEAD && !(t in seen)) { seen[t] = seen[u] + ch; Q2.push(t); } } }
          const ex = [0, 1, 2, 3].map((k) => x + y.repeat(k) + z);
          return `Verdict **infinite**: $x = ${tt(x)}$, $y = ${tt(y)}$, $z = ${tt(z)}$ give $xy^kz\\in L(M)$ for all $k$: ${ex.map((u) => `**${sh(u)}** ${run(D, u).acc ? '✓' : '✗'}`).join(', ')}, … · accepted strings by length: ${counts.join(', ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Equivalence of DFAs is decidable',
      statement: String.raw`The problem $EQ_{\mathrm{DFA}}=\{\langle M_1,M_2\rangle : L(M_1)=L(M_2)\}$ is decidable. Build the product automaton of $M_1$ and $M_2$ (2.6) with accepting pairs those where exactly one component accepts; it recognises the symmetric difference $L(M_1)\triangle L(M_2)$, and $L(M_1)=L(M_2)$ if and only if that language is empty (2.7). A breadth-first search over the reachable pairs either certifies equivalence or returns a **shortest** string on which the two machines disagree, of length less than $|Q_1|\,|Q_2|$.`,
      idea: String.raw`Two languages are equal exactly when their symmetric difference $(L_1\setminus L_2)\cup(L_2\setminus L_1)$ is empty, and closure under complement (2.5) and product (2.6) make that a regular language with an explicit DFA, whose emptiness is a reachability question (2.7). Breadth-first search reaches each pair along a shortest path, so the first "mixed" pair it meets is reached by a shortest distinguishing string.`,
      caption: String.raw`The two machines are on the left; the breadth-first search over pairs of states grows on the right, one pair per step, each tree edge labelled by its letter. A red pair is one where exactly one machine accepts: the path to it spells a shortest distinguishing string, which is then run on both machines. **Click a state of $M_2$** to toggle whether it accepts, or **an arrow of $M_2$** to redirect it, and watch the search certify equivalence or find a new witness.`,
      deps: ['toc-2.6', 'toc-2.5', 'toc-2.7'],
      refs: ['Sipser §4.1'],
      credit: 'Moore, 1956; Rabin & Scott, 1959',
      tags: ['decidability', 'product construction'],
      viz(v) {
        const PAIRS = {
          ends: () => [
            dfa(['a', 'b'], [['q0', 1.2, 8.3, 0], ['q1', 3.6, 9.5, 0], ['q2', 6, 8.3, 1]], 'q0', { q0: { a: 'q1', b: 'q0' }, q1: { a: 'q1', b: 'q2' }, q2: { a: 'q1', b: 'q0' } }, { loops: { q0: 225, q1: 90 }, startDir: 150 }),
            dfa(['a', 'b'], [['s0', 1.2, 3.9, 0], ['s1', 3.6, 5.1, 0], ['s2', 6, 3.9, 1], ['s3', 3.6, 1.6, 0]], 's0', { s0: { a: 's1', b: 's3' }, s1: { a: 's1', b: 's2' }, s2: { a: 's1', b: 's0' }, s3: { a: 's0', b: 's3' } }, { loops: { s1: 30, s3: 0 } }),
          ],
          even: () => [
            dfa(['a', 'b'], [['q0', 1.6, 8.8, 1], ['q1', 5.6, 8.8, 0]], 'q0', { q0: { a: 'q1', b: 'q0' }, q1: { a: 'q0', b: 'q1' } }, { loops: { q0: 90, q1: 90 } }),
            dfa(['a', 'b'], [['s0', 1.6, 4.9, 1], ['s1', 5.6, 4.9, 0], ['s2', 5.6, 1.9, 1], ['s3', 1.6, 1.9, 0]], 's0', { s0: { a: 's1', b: 's0' }, s1: { a: 's2', b: 's1' }, s2: { a: 's3', b: 's2' }, s3: { a: 's0', b: 's3' } }, { loops: { s0: 135, s1: 45, s2: 315, s3: 225 }, startDir: 200 }),
          ],
        };
        let [M1, M2] = PAIRS.ends();
        v.select('pair', [{ value: 'ends', label: 'ends in ab — two attempts' }, { value: 'even', label: 'even # of a — 2 vs 4 states' }], 'ends', { onChange: (k) => { [M1, M2] = PAIRS[k](); G1.sync(M1); G2.sync(M2); S.reset({ at: 'end' }); } });
        const ms = v.stage({ x: [0, 7.2], y: [0, 11.8], axes: false, equal: true, height: 410, weight: 0.85 });
        const bs = v.stage({ x: [0, 10], y: [0, 7], axes: false, height: 410, weight: 1.2 });
        const G1 = dfaGraph(v, ms, M1, { r: 15, texSize: 13.5 }), G2 = dfaGraph(v, ms, M2, { r: 15, texSize: 13.5 });
        const BT = v.graph(bs, { nodes: [], edges: [], layout: 'none', directed: true, shape: 'box', r: 14, texSize: 12.5, draggable: false });
        G2.onClick = ({ node, edge }) => {
          if (node) { const st = M2.states.find((x) => x.id === node.id); st.acc = !st.acc; }
          else if (edge) { const c = edge.syms[0], ids = M2.states.map((x) => x.id), k = ids.indexOf(tgt(M2, edge.from, c)[0]); M2.delta[edge.from][c] = [ids[(k + 1) % ids.length]]; G2.sync(M2); }
          else return true;
          S.reset({ at: 'end' }); return true;
        };
        G1.onClick = () => true;
        function search() {
          const key = (p, q) => p + '|' + q, start = key(M1.start, M2.start), info = { [start]: { p: M1.start, q: M2.start, via: '', depth: 0, parent: null, ch: '' } }, order = [start], Q = [start], frames = [];
          const mixed = (k) => isAcc(M1, info[k].p) !== isAcc(M2, info[k].q);
          frames.push({ upto: 1, cur: start, note: `Start from the pair of start states $(${texState(M1, M1.start)}, ${texState(M2, M2.start)})$.` });
          let found = mixed(start) ? start : null;
          while (Q.length && !found) {
            const u = Q.shift();
            for (const c of ['a', 'b']) {
              const p = step(M1, info[u].p, c), q = step(M2, info[u].q, c), k = key(p, q);
              if (k in info) continue;
              info[k] = { p, q, via: info[u].via + c, depth: info[u].depth + 1, parent: u, ch: c }; order.push(k); Q.push(k);
              const mx = mixed(k);
              frames.push({ upto: order.length, cur: k, note: `From $(${texState(M1, info[u].p)}, ${texState(M2, info[u].q)})$ the letter **${c}** leads to the new pair $(${texState(M1, p)}, ${texState(M2, q)})$` + (mx ? ` — **mixed**: ${isAcc(M1, p) ? '$M_1$ accepts, $M_2$ rejects' : '$M_2$ accepts, $M_1$ rejects'}.` : '.') });
              if (mx) { found = k; break; }
            }
          }
          frames[frames.length - 1].final = true;
          frames[frames.length - 1].note += found ? ` The path spells the shortest distinguishing string **${sh(info[found].via)}**.` : ` All ${order.length} reachable pairs agree: $L(M_1) = L(M_2)$.`;
          return { frames, info, order, found };
        }
        let R = search();
        const S = v.steps({ frames: () => (R = search()).frames, speed: 1.6, start: 'end', still: 'end' });
        v.render(() => {
          const f = S.frame, shown = R.order.slice(0, f.upto ?? 1);
          // tree layout by BFS depth
          const byD = {}; shown.forEach((k) => { (byD[R.info[k].depth] ||= []).push(k); });
          const maxD = Math.max(...Object.keys(byD).map(Number));
          const nodes = shown.map((k) => { const d = R.info[k].depth, row = byD[d], i = row.indexOf(k); return { id: k, x: (10 * (i + 0.5)) / row.length, y: 6.3 - (d * 5.6) / Math.max(maxD, 3), label: `$(${texState(M1, R.info[k].p)},${texState(M2, R.info[k].q)})$` }; });
          const edges = shown.filter((k) => R.info[k].parent).map((k) => ({ from: R.info[k].parent, to: k, label: R.info[k].ch }));
          BT.set({ nodes, edges });
          const path = []; if (R.found && f.final) { let k = R.found; while (k) { path.unshift(k); k = R.info[k].parent; } }
          BT.draw({
            nodeFill: (id) => (isAcc(M1, R.info[id].p) !== isAcc(M2, R.info[id].q) ? 'red' : id === f.cur ? 'gold' : null),
            nodeColor: (id) => (isAcc(M1, R.info[id].p) && isAcc(M2, R.info[id].q) ? 'green' : null),
            labelColor: (id) => (isAcc(M1, R.info[id].p) !== isAcc(M2, R.info[id].q) ? 'panel' : 'ink'),
            edgeLabel: (e) => e.label, highlightPath: path, pathColor: 'orange',
          });
          bs.corner(f.final ? (R.found ? `they differ on ${sh(R.info[R.found].via)}` : 'equivalent') : `${shown.length} pairs so far`, 'tr', { size: 13, weight: 700, color: f.final ? (R.found ? 'red' : 'green') : 'muted' });
          // the two machines, with the current pair lit
          const cp = R.info[f.cur] || R.info[R.order[0]];
          drawDFA(v, ms, G1, M1, { fill: (id) => (id === cp.p ? 'gold' : null) });
          drawDFA(v, ms, G2, M2, { fill: (id) => (id === cp.q ? 'gold' : null) });
          ms.tex('M_1', -0.6, 11.0, { size: 15, color: 'muted' }); ms.tex('M_2', -0.6, 6.4, { size: 15, color: 'muted' });
          ms.line(-1, 7.0, 8.2, 7.0, { color: 'grid', width: 1 });
        });
        v.legend([['gold', 'current pair', { dot: true }], ['red', 'mixed pair: exactly one accepts', { dot: true }], ['green', 'both accept (ring)', { dot: true }]]);
        v.readout(() => {
          if (!R.found) return `No reachable pair is mixed: $L(M_1) = L(M_2)$ ✓ (${R.order.length} of ${M1.states.length * M2.states.length} pairs reachable) · brute-force check on all strings of length ≤ 8: ${[0, 1, 2, 3, 4, 5, 6, 7, 8].every((L) => layer(['a', 'b'], L).every((u) => run(M1, u).acc === run(M2, u).acc)) ? 'agree ✓' : 'disagree ✗'}`;
          const w = R.info[R.found].via, a1 = run(M1, w).acc, a2 = run(M2, w).acc;
          let shorter = true; for (let L = 0; L < w.length; L++) if (layer(['a', 'b'], L).some((u) => run(M1, u).acc !== run(M2, u).acc)) shorter = false;
          return `Shortest distinguishing string **${sh(w)}**: $M_1$ ${a1 ? 'accepts' : 'rejects'}, $M_2$ ${a2 ? 'accepts' : 'rejects'} ✓ · brute force: ${shorter ? `all shorter strings get the same verdict ✓` : 'a shorter witness exists ✗'} · length ${w.length} $< |Q_1||Q_2| = ${M1.states.length * M2.states.length}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Model',
      name: 'Mealy and Moore machines',
      statement: String.raw`A **finite-state transducer** reads input symbols and writes output symbols. A **Mealy machine** $(Q,\Sigma,\Gamma,\delta,\lambda,q_0)$ emits $\lambda(q,a)\in\Gamma$ on each transition $q\xrightarrow{a}\delta(q,a)$, so its $t$-th output depends on the current state and the current input. A **Moore machine** emits $\lambda(q)$ in each state, so its output depends on the state alone and reacts to an input one step later. The two models are equivalent up to that one-step delay: a Moore machine can be turned into a Mealy machine with the same states, and a Mealy machine into a Moore machine whose states are pairs (state, last output), at most $|Q|\,|\Gamma|$ of them.`,
      scope: String.raw`An idealised synchronous circuit: one input symbol per clock tick, a finite register as memory, no timing faults. Mealy outputs model combinational logic after the register; Moore outputs model outputs taken from the register itself.`,
      idea: String.raw`Adding binary numbers least significant bit first needs to remember only the carry, so a two-state Mealy machine does it: on input bits $(a,b)$ in carry state $c$ it outputs $a\oplus b\oplus c$ and moves to carry $\mathrm{maj}(a,b,c)$. A Moore machine cannot output before it has moved, so it stores the output in its state — four states (carry, sum bit) — and every sum bit appears one tick later. Sequential circuits are built exactly this way: a register for the state and logic for the outputs.`,
      caption: String.raw`Choose two 8-bit numbers; their bits are fed least significant first, one pair per tick. Step through: the Mealy adder (left, states = carry) emits each sum bit on its transition, the Moore adder (right; state $c_1/0$ means carry 1, output 0) emits the bit stored in its state, and the timing chart shows the Moore row is the Mealy row shifted by one tick. Switch off the final $00$ input and sums of 256 or more lose their last carry.`,
      deps: ['toc-2.1'],
      refs: ['Sipser §1.1'],
      credit: 'Mealy, 1955; Moore, 1956',
      tags: ['transducers', 'circuits'],
      viz(v) {
        const aS = v.slider('$A$', 0, 255, 178, { int: true, onChange: () => S.reset({ at: 'keep' }) });
        const bS = v.slider('$B$', 0, 255, 103, { int: true, onChange: () => S.reset({ at: 'keep' }) });
        const pad = v.toggle('feed a final 00 (flush the carry)', true, { onChange: () => S.reset({ at: 'keep' }) });
        const ml = v.stage({ x: [0, 10], y: [0, 6], axes: false, equal: true, height: 240, weight: 1 });
        const mo = v.stage({ x: [0, 10], y: [0, 6.6], axes: false, equal: true, height: 240, weight: 1 });
        const tc = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 176, full: true });
        // Mealy: carry states; Moore: (carry, sum) states
        const MEALY = { nodes: [{ id: 'c0', x: 2.6, y: 2.6, label: '$c_0$' }, { id: 'c1', x: 7.4, y: 2.6, label: '$c_1$' }] };
        MEALY.edges = [{ from: 'c0', to: 'c0', label: '00/0, 01/1, 10/1', angle: 90, directed: true }, { from: 'c0', to: 'c1', label: '11/0', directed: true }, { from: 'c1', to: 'c0', label: '00/1', directed: true }, { from: 'c1', to: 'c1', label: '01/0, 10/0, 11/1', angle: 90, directed: true }];
        const GM = v.graph(ml, { ...MEALY, layout: 'none', r: 22, autoRadius: false, texSize: 15, draggable: false, edgeFontSize: 10.5 });
        const mid = (c, s) => `m${c}${s}`, MOP = [[1.6, 4.6], [8.4, 4.6], [1.6, 1.3], [8.4, 1.3]];
        const moNodes = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([c, s], i) => ({ id: mid(c, s), x: MOP[i][0], y: MOP[i][1], label: `$c_${c}/${s}$` }));
        const moEdges = [];
        for (const [c, s] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
          const tg = {}; for (const [a, b] of [[0, 0], [0, 1], [1, 0], [1, 1]]) { const c2 = (a + b + c) >= 2 ? 1 : 0, s2 = (a + b + c) % 2; (tg[mid(c2, s2)] ||= []).push(`${a}${b}`); }
          for (const [t, l] of Object.entries(tg)) moEdges.push({ from: mid(c, s), to: t, label: l.join(','), directed: true, angle: t === mid(c, s) ? (MOP[[0, 0, 1, 1].indexOf(c) + s][0] < 5 ? 180 : 0) : undefined });
        }
        const GO = v.graph(mo, { nodes: moNodes, edges: moEdges, layout: 'none', r: 22, autoRadius: false, texSize: 14, draggable: false, edgeFontSize: 10 });
        const sim = () => {
          const T = pad.value ? 9 : 8, A = aS.value, B = bS.value, a = [], b = [], car = [0], out = [], moSt = [mid(0, 0)];
          for (let t = 0; t < T; t++) { a.push(A >> t & 1); b.push(B >> t & 1); const tot = a[t] + b[t] + car[t]; out.push(tot % 2); car.push(tot >= 2 ? 1 : 0); moSt.push(mid(car[t + 1], tot % 2)); }
          return { T, a, b, car, out, moSt, S: out.reduce((acc, x, t) => acc + x * 2 ** t, 0) };
        };
        const frames = () => { const r = sim(); return Array.from({ length: r.T + 1 }, (_, t) => ({ t, note: t === 0 ? 'Before the first tick: carry 0; the Moore machine shows the output of its start state.' : `Tick ${t}: input bits $(a_{${t - 1}}, b_{${t - 1}}) = (${r.a[t - 1]}, ${r.b[t - 1]})$ with carry ${r.car[t - 1]} — the Mealy machine outputs **${r.out[t - 1]}** on the transition; the Moore machine moves to a state showing **${r.out[t - 1]}**.` })); };
        const S = v.steps({ frames, speed: 1.4, still: 4 });
        v.render(() => {
          const r = sim(), t = S.frame.t ?? 0, cs = 'c' + r.car[t], prevC = t > 0 ? 'c' + r.car[t - 1] : null, inp = t > 0 ? `${r.a[t - 1]}${r.b[t - 1]}` : null;
          GM.draw({
            nodeFill: (id) => (id === cs ? 'gold' : null), labelColor: (id) => (id === cs ? 'ink' : null),
            edgeColor: (e) => (prevC && e.from === prevC && e.to === cs && e.label.includes(inp + '/') ? 'gold' : null),
            edgeWidth: (e) => (prevC && e.from === prevC && e.to === cs && e.label.includes(inp + '/') ? 3.2 : null),
            edgeLabel: (e) => e.label,
          });
          startArrow(ml, GM, { start: 'c0', states: [{ id: 'c0', acc: false }], startDir: 270 });
          ml.corner('Mealy: arrows read in/out (carry state c)', 'tl', { size: 12, color: 'muted', weight: 600 });
          const ms = r.moSt[t], pms = t > 0 ? r.moSt[t - 1] : null;
          GO.draw({
            nodeFill: (id) => (id === ms ? 'gold' : null), labelColor: (id) => (id === ms ? 'ink' : null),
            edgeColor: (e) => (pms && e.from === pms && e.to === ms && e.label.split(',').includes(inp) ? 'gold' : null),
            edgeWidth: (e) => (pms && e.from === pms && e.to === ms && e.label.split(',').includes(inp) ? 3.2 : null),
            edgeLabel: (e) => e.label,
          });
          startArrow(mo, GO, { start: 'm00', states: [{ id: 'm00', acc: false }], startDir: 90 });
          mo.corner('Moore: state c/s outputs its bit s', 'tl', { size: 12, color: 'muted', weight: 600 });
          // timing chart
          const P = pen(tc, v), x0 = 150, cw = Math.min(64, (P.W - x0 - 20) / (r.T + 1)), rowsY = [32, 58, 84, 116, 148];
          const lab = ['input a (bit t of A)', 'input b (bit t of B)', 'carry state', 'Mealy output', 'Moore output'];
          lab.forEach((L, i) => P.sans(L, x0 - 12, rowsY[i], { align: 'right', size: 11.5, color: i >= 3 ? 'ink' : 'muted', weight: i >= 3 ? 600 : 500 }));
          for (let k = 0; k <= r.T; k++) {
            const x = x0 + k * cw;
            if (k === t) P.box(x + 1, 3, cw - 2, P.H - 6, { r: 4, fill: 'gold', alpha: 0.12, stroke: false });
            P.text(`t = ${k}`, x + cw / 2, 12, { size: 10, color: k === t ? 'ink' : 'muted', font: SANS, weight: k === t ? 700 : 500 });
            const cell = (val, y, col, on) => { P.box(x + 4, y - 10, cw - 8, 20, { r: 3, fill: val ? col : null, alpha: on ? 0.75 : 0.15, stroke: on ? col : 'faint' }); P.text(String(val), x + cw / 2, y + 0.5, { size: 12, weight: 600, color: on ? (val ? 'panel' : 'ink') : 'muted' }); };
            if (k < r.T) { cell(r.a[k], rowsY[0], 'blue', k < t); cell(r.b[k], rowsY[1], 'blue', k < t); cell(r.car[k], rowsY[2], 'muted', k <= t); cell(r.out[k], rowsY[3], 'orange', k < t); }
            cell(k === 0 ? 0 : r.out[k - 1], rowsY[4], 'purple', k <= t);
          }
          if (t > 0) P.arrow(x0 + (t - 1) * cw + cw / 2, rowsY[3] + 10, x0 + t * cw + cw / 2 - 6, rowsY[4] - 10, { color: 'purple', width: 1.6, head: 6 });
        });
        v.legend([['orange', 'Mealy output', { dot: true }], ['purple', 'Moore output (one tick later)', { dot: true }], ['gold', 'current state / tick', { dot: true }]]);
        v.readout(() => {
          const r = sim(), A = aS.value, B = bS.value, ok = r.S === A + B;
          return `$A + B = ${A} + ${B} = ${A + B}$ · Mealy output read as a binary number (least significant first): ${r.out.slice().reverse().join('')}$_2 = ${r.S}$ ${ok ? '✓' : `✗ — the carry out of bit 7 was never emitted, so the result is ${A + B} − 256`} · the Moore row equals the Mealy row delayed by one tick ✓`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Concept',
      name: 'Synchronizing (reset) words',
      statement: String.raw`A word $w$ is a **synchronizing** (reset) word for a DFA $(Q,\Sigma,\delta)$ if it sends every state to the same state: $|\{\hat\delta(q,w) : q\in Q\}|=1$. The automaton is **synchronizing** if such a word exists. Whether it does can be decided — it suffices that every *pair* of states can be merged by some word — and a shortest reset word can be found by breadth-first search on the subsets $\hat\delta(Q,u)$, which can take exponential time; for a single automaton, finding a shortest reset word is NP-hard in general. Example: the Černý automaton $C_n$, where $a$ rotates the $n$ states cyclically and $b$ merges state $0$ into state $1$, has shortest reset word $(ba^{n-1})^{n-2}b$ of length $(n-1)^2$.`,
      idea: String.raw`Put a token on every state and apply a word letter by letter: tokens that land on the same state merge and never split again, since each letter is a function. A reset word merges all tokens into one, so the set of occupied states shrinks to a singleton; searching over these sets (at most $2^n$) finds the shortest such word. If every letter permutes the states, no tokens ever merge and no reset word exists.`,
      caption: String.raw`Tokens start on every state. Press **a** and **b** to apply letters (or ⌫ to undo) and step through the word: merged tokens show how many original states they carry. **Shortest reset word** asks the subset search for the best word; for the Černý automaton it has length $(n-1)^2$. Choose the permutation automaton and no word ever helps. The bars below track how many states are still occupied.`,
      deps: ['toc-2.2'],
      refs: ['Sipser §1.1'],
      credit: 'Černý, 1964',
      tags: ['automata', 'synchronization'],
      viz(v) {
        let kind = 'cerny', word = [];
        const nS = v.slider('$n$', 3, 7, 4, { int: true, onChange: () => { rebuild(); word = []; S.reset(); } });
        v.select('automaton', [{ value: 'cerny', label: 'Černý $C_n$' }, { value: 'rand', label: 'random' }, { value: 'perm', label: 'permutations only' }], 'cerny', { onChange: (k) => { kind = k; rebuild(); word = []; S.reset(); } });
        v.button('a', () => { if (word.length < 60) { word.push(0); S.reset({ at: 'end' }); } });
        v.button('b', () => { if (word.length < 60) { word.push(1); S.reset({ at: 'end' }); } });
        v.button('⌫', () => { word.pop(); S.reset({ at: 'end' }); });
        v.button('shortest reset word', () => { const w = resetWord(delta); if (w) { word = w; S.reset({ at: 0 }); } });
        const gs = v.stage({ x: [-1.7, 1.7], y: [-1.72, 1.66], axes: false, equal: true, height: 330, weight: 1.2 });
        const cs = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1 });
        let delta = cerny(4), G = null, best = null;
        function rebuild() {
          const n = nS.value;
          if (kind === 'cerny') delta = cerny(n);
          else if (kind === 'perm') delta = [Array.from({ length: n }, (_, i) => (i + 1) % n), Array.from({ length: n }, (_, i) => (i < 2 ? 1 - i : i))];
          else { const r = v.rng(40 + n); do { delta = randomAut(n, 2, r); } while (!resetWord(delta)); }
          best = resetWord(delta);
          const states = [], dl = {};
          for (let i = 0; i < n; i++) { const a = Math.PI / 2 - (2 * Math.PI * i) / n; states.push(['s' + i, Math.cos(a), Math.sin(a), 0, `$${i}$`]); dl['s' + i] = { a: 's' + delta[0][i], b: 's' + delta[1][i] }; }
          const loops = {}; for (let i = 0; i < n; i++) loops['s' + i] = (90 - (360 * i) / n + 360) % 360;
          const D = dfa(['a', 'b'], states, 's0', dl, { loops });
          if (!G) G = dfaGraph(v, gs, D, { r: 16, texSize: 14 }); else G.sync(D);
          G.D = D;
        }
        rebuild();
        const frames = () => {
          const n = nS.value, out = []; let map = Array.from({ length: n }, (_, i) => i);
          out.push({ k: 0, map: map.slice(), note: `A token on each of the ${n} states.` });
          word.forEach((c, k) => { map = map.map((q) => delta[c][q]); const occ = new Set(map).size; out.push({ k: k + 1, map: map.slice(), note: `Apply **${'ab'[c]}**: ${occ} state${occ === 1 ? '' : 's'} still occupied${occ === 1 ? ' — **synchronized**: the word read so far is a reset word.' : '.'}` }); });
          return out;
        };
        const S = v.steps({ frames, speed: 2, still: 'end' });
        // start with the shortest reset word loaded
        word = best ? best.slice() : []; S.reset({ at: 'end' });
        v.render(() => {
          const f = S.frame, n = nS.value, map = f.map || [], mult = {}; map.forEach((q) => { mult[q] = (mult[q] || 0) + 1; });
          const last = f.k > 0 ? word[f.k - 1] : null;
          G.draw({
            nodeFill: (id) => (mult[+id.slice(1)] ? 'gold' : null), labelColor: (id) => (mult[+id.slice(1)] ? 'ink' : null),
            nodeNote: (id) => (mult[+id.slice(1)] > 1 ? `×${mult[+id.slice(1)]}` : null), noteColor: 'gold', notePos: 'n',
            edgeColor: (e) => (e.syms.length === 2 ? 'muted' : e.syms[0] === 'a' ? 'blue' : 'orange'),
            edgeWidth: (e) => (last != null && e.syms.includes('ab'[last]) && mult[+e.to.slice(1)] ? 2.8 : 1.5),
            edgeLabel: (e) => e.label, edgeLabelColor: (e) => (e.syms.length === 2 ? 'muted' : e.syms[0] === 'a' ? 'blue' : 'orange'),
          });
          const occ = Object.keys(mult).length;
          gs.corner(occ === 1 ? 'synchronized' : `${occ} of ${n} states occupied`, 'tr', { size: 13, weight: 700, color: occ === 1 ? 'green' : 'muted' });
          // occupied-state count after each prefix
          const P = pen(cs, v), fr = S.frames, L = fr.length, x0 = 34, bw = Math.min(28, (P.W - x0 - 14) / Math.max(L, 1)), h = P.H - 70;
          P.sans('occupied states after each letter', P.W / 2, 12, { size: 12, weight: 600, color: 'muted' });
          for (let y = 1; y <= n; y++) { const yy = P.H - 40 - (y / n) * h; P.line(x0 - 4, yy, P.W - 10, yy, { color: 'grid', width: 1 }); P.text(String(y), x0 - 10, yy, { size: 10, color: 'muted', font: SANS, align: 'right' }); }
          fr.forEach((g, k) => {
            const c = new Set(g.map).size, x = x0 + k * bw, top = P.H - 40 - (c / n) * h;
            P.box(x + 1, top, bw - 2, (c / n) * h, { r: 2, fill: c === 1 ? 'green' : k === f.k ? 'gold' : 'accent', alpha: k <= f.k ? 0.7 : 0.18, stroke: false });
            if (k > 0 && bw >= 10) P.text('ab'[word[k - 1]], x + bw / 2, P.H - 28, { size: 11, weight: 600, color: word[k - 1] ? 'orange' : 'blue' });
          });
        });
        v.legend([['blue', 'letter a'], ['orange', 'letter b'], ['gold', 'occupied state (×k: tokens merged)', { dot: true }]]);
        v.readout(() => {
          const n = nS.value, w = word.map((c) => 'ab'[c]).join(''), map = S.frames.at(-1)?.map || [], occ = new Set(map).size;
          const bw = best ? best.map((c) => 'ab'[c]).join('') : null;
          return (w ? `Word **${w}** (length ${w.length}) leaves ${occ} state${occ === 1 ? '' : 's'} occupied${occ === 1 ? ' — a reset word ✓' : ''}` : 'No letters applied yet') + ' · ' +
            (bw ? `shortest reset word by subset search: **${bw}**, length ${bw.length}` + (kind === 'cerny' ? ` $= (n-1)^2 = ${(n - 1) ** 2}$` : ` $\\le (n-1)^2 = ${(n - 1) ** 2}$`) : `no reset word exists: both letters permute the states, so tokens never merge`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Hypothesis',
      name: 'Černý conjecture',
      statement: String.raw`**Conjecture.** Every synchronizing DFA with $n$ states has a reset word of length at most $(n-1)^2$.

The bound would be sharp: the Černý automata $C_n$ (2.11) need exactly $(n-1)^2$. The conjecture is open. The best general upper bounds are cubic — $(n^3-n)/6$ (Frankl 1982, Pin 1983), improved to about $0.1654\,n^3$ (Szykuła 2018, Shitov 2019) — and the conjecture has been proved for special classes (e.g. circular automata, Dubuc 1998; aperiodic automata satisfy a stronger quadratic bound) and confirmed by exhaustive computer search for small $n$. Random automata synchronize with high probability and typically need only about $\sqrt n$ letters.`,
      idea: String.raw`A shortest reset word can be built greedily by shrinking the set of occupied states one merge at a time; each merge needs a word that brings two occupied states together, and bounding those words is where all known arguments lose a factor of $n$ — giving cubic bounds. Computation supports the quadratic guess: among all small automata the extremal ones are the Černý family and a few sporadic examples, and nothing ever exceeds $(n-1)^2$.`,
      caption: String.raw`Each blue dot is a random synchronizing automaton on $n$ states, placed at the length of its shortest reset word (computed by breadth-first search over subsets). Red points are the Černý automata, exactly on the curve $(n-1)^2$; the dashed line is the proven cubic bound. **Hunt** runs a hill-climbing search that mutates arrows to make reset words longer — the orange points are the worst automata it finds, and they stay under the curve. Resample, change the alphabet, or try more automata per $n$.`,
      deps: ['toc-2.11'],
      refs: ['Sipser §1.1'],
      credit: 'Černý, 1964',
      tags: ['open problems', 'synchronization'],
      viz(v) {
        const NMAX = 10;
        const perN = v.slider('automata per $n$', 5, 60, 24, { int: true, onChange: () => sample() });
        const kSel = v.select('letters', [{ value: 2, label: '2' }, { value: 3, label: '3' }], 2, { onChange: () => { sample(); hunt(); } });
        let seed = 1, pts = [], hunted = [], nonsync = 0;
        v.button('Resample', () => { seed++; sample(); });
        v.button('Hunt for long reset words', () => hunt());
        const showC = v.toggle('Černý family', true);
        const s = v.stage({ x: [1.5, NMAX + 0.5], y: [-9, 92], axes: 'box', height: 340, full: true, xlabel: 'number of states n', ylabel: 'length of the shortest reset word', xticks: [2, 3, 4, 5, 6, 7, 8, 9, 10], yticks: [0, 20, 40, 60, 80] });
        function sample() {
          const r = v.rng(1000 * seed + 17), k = +kSel.value; pts = []; nonsync = 0;
          for (let n = 2; n <= NMAX; n++) for (let i = 0; i < perN.value; i++) { const d = randomAut(n, k, r), w = resetWord(d); if (w) pts.push([n + (r() - 0.5) * 0.36, w.length, n]); else nonsync++; }
        }
        function hunt() {
          const r = v.rng(500 + seed * 7), k = +kSel.value; hunted = [];
          for (let n = 3; n <= 8; n++) {
            let best = null, bestL = -1;
            for (let restart = 0; restart < 3; restart++) {
              let d = randomAut(n, k, r), w = resetWord(d), L = w ? w.length : -1;
              for (let it = 0; it < 220; it++) {
                const d2 = d.map((row) => row.slice()); d2[r.int(0, k - 1)][r.int(0, n - 1)] = r.int(0, n - 1);
                const w2 = resetWord(d2), L2 = w2 ? w2.length : -1;
                if (L2 >= L) { d = d2; L = L2; }
              }
              if (L > bestL) { bestL = L; best = d; }
            }
            hunted.push([n, bestL]);
          }
        }
        sample(); hunt();
        const CL = {}; for (let n = 2; n <= NMAX; n++) CL[n] = resetWord(cerny(n)).length;
        v.render(() => {
          s.fn((n) => (n - 1) ** 2, { color: 'green', width: 2.2, domain: [1.5, NMAX + 0.5] });
          s.fn((n) => (n ** 3 - n) / 6, { color: 'muted', width: 1.4, dash: [6, 5], domain: [1.5, NMAX + 0.5] });
          s.text('(n − 1)²', 9.55, 84, { size: 12, color: 'green', weight: 600, align: 'right' });
          s.text('(n³ − n)/6  (proven bound)', 6.1, 55, { size: 11.5, color: 'muted', align: 'left' });
          s.dots(pts.map(([x, y]) => [x, y]), { r: 3, color: 'accent', alpha: 0.45 });
          for (const [n, L] of hunted) s.dot(n, L, { r: 6, color: 'orange' });
          if (showC.value) for (let n = 2; n <= NMAX; n++) s.dot(n, CL[n], { r: 5.5, color: 'red', hollow: true, width: 2.4 });
        });
        v.legend([['accent', 'random automata', { dot: true }], ['orange', 'worst found by hill climbing', { dot: true }], ['red', 'Černý automata $C_n$', { dot: true }], ['green', '$(n-1)^2$']]);
        v.readout(() => {
          const ratio = (arr) => arr.reduce((m, [x, y, n]) => ((n ?? Math.round(x)) >= 3 ? Math.max(m, y / ((n ?? Math.round(x)) - 1) ** 2) : m), 0);
          const rr = ratio(pts), hr = hunted.length ? ratio(hunted.map(([n, L]) => [n, L, n])) : null;
          const cOK = [2, 3, 4, 5, 6, 7, 8, 9, 10].every((n) => CL[n] === (n - 1) ** 2);
          return `${pts.length} random synchronizing automata (${nonsync} not synchronizing, skipped): (shortest reset word)$/(n-1)^2$ is at most **${v.fix(rr, 2)}** for $n\ge 3$` + (hr != null ? ` · the hill climber's worst: **${v.fix(hr, 2)}** (${hunted.map(([n, L]) => `${L}/${(n - 1) ** 2}`).join(', ')})` : '') + ` · Černý family: exactly $(n-1)^2$ for $n\\le 10$ ${cOK ? '✓' : '✗'} · no counterexample, as expected`;
        });
      },
    },
  ],
};
