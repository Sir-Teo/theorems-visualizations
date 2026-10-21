// Computational Complexity — Chapter 1 (part 2): 1.8–1.13 — Ladner's theorem and its candidates, oracles and the
// relativization barrier, a provably intractable problem, and the Hartmanis–Stearns paper.
import {
  clamp, lerp, log2, sup, big, tbig, bitLen, bin, popcount, countupFlips,
  runTM, machineById, parseFormula, evalFormula, formulaVars, isSat, negate,
} from './ch01.shared.js';

export default {
  collection: 'cplx',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Theorem',
      name: 'Ladner’s theorem',
      statement: String.raw`If $\mathrm P\ne\mathrm{NP}$, then there is a language $A\in\mathrm{NP}$ that is neither in $\mathrm P$ nor $\mathrm{NP}$-complete (an **NP-intermediate** language). Ladner's set is a “blown-up” SAT:
$$A=\{\psi\in\mathrm{SAT}:\ H(|\psi|)\text{ is even}\},$$
where $H:\N\to\N$ is a very slowly growing, polynomial-time computable step function defined by a diagonalization. More generally, if $B\notin\mathrm P$ is decidable then there is a decidable $A\notin\mathrm P$ with $A\le_p B$ and $B\not\le_p A$ (Ladner 1975).`,
      idea: String.raw`Call lengths with $H$ even *hard* ($A_n=\mathrm{SAT}_n$) and lengths with $H$ odd *easy* ($A_n=\emptyset$). $H$ is raised by one **lazily**, only when a witness has been found at the current stage: on an even stage the job is to defeat the $i$-th polynomial-time algorithm as a decider of $A$, so $H$ stays put (keeping $A=\mathrm{SAT}$ on those lengths) until the algorithm is found to err on some instance; on an odd stage the job is to defeat the $i$-th polynomial-time reduction from SAT to $A$, so $H$ stays put (keeping $A$ empty) until the reduction is found to send a satisfiable formula to a string outside $A$. Because $P\neq NP$ these witnesses always exist, and since the search for a witness at length $n$ may cost time exponential in the witness length but only $\log n$ lengths are inspected, $H$ is computable in polynomial time. If $A\in\mathrm P$, $H$ would stop rising at an even value and $A=\mathrm{SAT}$ almost everywhere; if SAT reduced to $A$, $H$ would stop at an odd value and $A$ would be finite. Both contradict $\mathrm P\neq\mathrm{NP}$. This is the same diagonal flip as 1.2, but spread over longer and longer stretches of input lengths, with the clock replaced by the polynomial-time bound being refuted. (Idea: Ladner 1975; this “delayed diagonalization” is the template of 1.5.)`,
      caption: String.raw`**Illustrative schedule** (the true $H$ depends on the enumeration of machines and cannot be drawn exactly; its stretches do grow at about this rate). **Top**: $H$ against $\log_2 n$; the blue stretches (even $H$) are where $A=\mathrm{SAT}$ — hard — and the green ones (odd $H$) where $A$ is empty — trivial. **Bottom**: the best time we can hope to decide $A$ at each length if SAT needs $2^{n^{1/3}}$ (blue; log scale in time) against a polynomial $n^k$ (red dashed): every hard stretch eventually climbs above any fixed $n^k$ (the blue curve shoots off the top of the chart: it is capped at the frame), so $A\notin\mathrm P$; yet the easy stretches are so long that no reduction can map SAT into $A$. Drag $\rho$ to stretch the schedule and $k$ to try to catch $A$ with a polynomial.`,
      deps: ['toc-13.2', 'cplx-1.2'],
      refs: ['Arora–Barak ch. 3'],
      credit: 'Richard Ladner, 1975',
      tags: ['NP-intermediate', 'delayed diagonalization'],
      viz(v) {
        const rho = v.slider('growth of stretches $\\rho$', 1.4, 2.8, 2, { step: 0.05 });
        const kS = v.slider('polynomial exponent $k$', 1, 8, 3, { int: true });
        const xS = v.slider('probe length $\\log_2 n$', 1, 64, 30, { int: true });
        const A = v.stage({ x: [0, 66], y: [0, 7], axes: 'box', gutter: true, height: 210, full: true, xlabel: '$\\log_2 n$', ylabel: '$H(n)$' });
        const B = v.stage({ x: [0, 66], y: [0, 66], axes: 'box', gutter: true, height: 260, full: true, xlabel: '$\\log_2 n$', ylabel: '$\\log_2$ time to decide $A_n$' });
        const bounds = () => { const b = [2]; while (b[b.length - 1] < 70) b.push(Math.ceil(b[b.length - 1] * rho.value) + 1); return b; };
        const Hof = (x, b) => b.filter((t) => t <= x).length;
        const hard = (x) => Math.pow(2, x / 3), easy = (x) => x;
        v.render(() => {
          const b = bounds(), top = Hof(66, b) + 1;
          A.setView([0, 66], [0, top]);
          for (let j = 0; j <= b.length; j++) {
            const x0 = j === 0 ? 0 : b[j - 1], x1 = Math.min(66, j < b.length ? b[j] : 70); if (x0 >= 66) break;
            const isHard = j % 2 === 0, c = isHard ? 'blue' : 'green';
            A.vband(x0, x1, { color: c, alpha: 0.13 }); B.vband(x0, x1, { color: c, alpha: 0.13 });
            A.segment([x0, j], [x1, j], { color: c, width: 3 });
            if (A.X(x1) - A.X(x0) > 70) A.text(isHard ? 'A = SAT' : 'A = ∅', (x0 + x1) / 2, top - 0.5, { align: 'center', size: 12, weight: 700, color: c });
            // time curve
            const f = isHard ? hard : easy, pts = [];
            for (let x = Math.max(x0, 0.5); x <= x1 + 1e-9; x += 0.25) pts.push([x, Math.min(f(x), 69)]);
            B.path(pts, { color: c, width: 2.6 });
          }
          B.fn((x) => kS.value * x, { color: 'red', dash: [6, 4], width: 2, domain: [0, 66] });
          B.text(`time $n^{${kS.value}}$`, 66, kS.value * 66, { align: 'right', dy: -9, size: 12, color: 'red', weight: 700 });
          A.vline(xS.value, { color: 'gold', dash: [4, 3], width: 2 }); B.vline(xS.value, { color: 'gold', dash: [4, 3], width: 2 });
        });
        v.legend([['blue', 'hard stretch: $A_n=\\mathrm{SAT}_n$'], ['green', 'easy stretch: $A_n=\\emptyset$'], ['red', 'polynomial time $n^k$', { dash: true }]]);
        v.readout(() => {
          const b = bounds(), x = xS.value, H = Hof(x, b), k = kS.value;
          let beat = null; for (let j = 0; j < b.length && beat === null; j += 2) { const x0 = j === 0 ? 0.5 : b[j - 1], x1 = j < b.length ? b[j] : 70; for (let t = x0; t <= x1 && t <= 66; t += 0.25) if (hard(t) > k * t) { beat = t; break; } }
          return `At $\\log_2 n=${x}$: $H=${H}$, so $A_n=${H % 2 ? '\\emptyset$ (trivial)' : '\\mathrm{SAT}_n$ (as hard as SAT)'} · stretch boundaries at $\\log_2 n=${b.filter((t) => t <= 66).join(', ')}$\nThe first hard stretch where deciding $A$ exceeds $n^{${k}}$ begins by $\\log_2 n\\approx${beat === null ? '(beyond 66)' : v.fix(beat, 1)}$ — for every $k$ one exists, so $A\\notin\\mathrm P$ (if SAT really needs $2^{n^{\\epsilon}}$). Number of stretches below $2^{66}$: **${b.filter((t) => t <= 66).length + 1}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Concept',
      name: 'Candidates for NP-intermediate: factoring and graph isomorphism',
      statement: String.raw`Ladner's theorem (1.8) gives NP-intermediate sets only under the assumption $\mathrm P\ne\mathrm{NP}$ and only by artificial construction. **Natural** candidates are:
(a) **Integer factoring** (as the decision problem “does $N$ have a factor $\le k$?”) — it lies in $\mathrm{NP}\cap\mathrm{coNP}$ (cplx-3.3), so it is not NP-complete unless $\mathrm{NP}=\mathrm{coNP}$;
(b) **Graph isomorphism** (GI) — in NP, not NP-complete unless the polynomial hierarchy collapses (cplx-6.5), and solvable in quasipolynomial time $n^{O(\log^c n)}$ (Babai 2015).
Neither is known to be in P. Simple heuristics decide many instances of GI: **colour refinement** ($1$-dimensional Weisfeiler–Leman) repeatedly recolours each vertex by its own colour together with the multiset of its neighbours' colours, and two graphs whose colour histograms ever differ are certainly non-isomorphic. The converse fails, notably on regular graphs.`,
      idea: String.raw`Evidence of intermediacy is indirect: a problem in $\mathrm{NP}\cap\mathrm{coNP}$ cannot be NP-complete without collapsing NP to coNP, and quasipolynomial algorithms are a hallmark of problems that are not NP-complete (that would contradict the exponential time hypothesis). Colour refinement is the first thing any practical isomorphism program runs: vertices of different degree split in round 1, and information about longer-range structure spreads one step per round. When it stabilises with equal histograms, the equitable partition is the same for the graphs but they may still differ — a $d$-regular graph never splits in the first place — so stronger tools (individualization–refinement, group theory) are needed.

The partition theorem (alg-1.25) makes the refinement invariant precise. Equal current colours define equivalence classes, hence disjoint blocks covering the vertices. Replace a colour by its old colour together with the multiset of neighbour colours, using the same tuple encoding in both graphs (or refining their disjoint union). Equality of new colours implies equality of old colours, so blocks can split but never merge; a strict refinement increases the block count, and on $N$ vertices there are at most $\max(0,N-1)$ strict increases. The empty graph is already stable. An isomorphism preserves each signature round by round, so different colour histograms rule it out. The partition property and termination do not make equal stable histograms sufficient for isomorphism.`,
      caption: String.raw`Choose a preset pair or **edit both graphs** (drag nodes, click empty space for a vertex, click two vertices for an edge, Alt-click deletes). Step through the refinement: vertices with the same colour have the same label number; the table counts the vertices of each colour in the left graph $G$ and the right graph $H$. A column that disagrees (red) certifies non-isomorphism. Try **C₆ vs 2×C₃** and **cube vs Wagner graph**: both are 2-regular (resp. 3-regular) so refinement never splits anything, yet an exhaustive search shows the cube and the Wagner graph are not isomorphic.`,
      deps: ['cplx-1.8', 'alg-1.25'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Weisfeiler & Leman, 1968 (refinement); Babai, 2015 (quasipolynomial isomorphism)',
      tags: ['graph isomorphism', 'factoring'],
      viz(v) {
        const circ = (n, cx, cy, r, off = 0) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(2 * Math.PI * i / n + Math.PI / 2 + off), cy + r * Math.sin(2 * Math.PI * i / n + Math.PI / 2 + off)]);
        const mk = (pos, edges) => ({ nodes: pos.map(([x, y], id) => ({ id, x, y })), edges });
        const cyc = (n) => Array.from({ length: n }, (_, i) => [i, (i + 1) % n]);
        const cubePos = (cx, cy) => { const o = [[0, 0], [2, 0], [0, 2], [2, 2]], d = [0.9, 0.9]; return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [cx - 1.4 + o[i & 3][0] + (i >> 2) * d[0], cy - 1.4 + o[i & 3][1] + (i >> 2) * d[1]]); };
        const cubeE = []; for (let i = 0; i < 8; i++) for (const b of [1, 2, 4]) if (i < (i ^ b)) cubeE.push([i, i ^ b]);
        const tri = (cx, cy, id0) => circ(3, cx, cy, 1.1).map(([x, y], k) => ({ id: id0 + k, x, y }));
        const PRE = {
          p7: () => [mk(Array.from({ length: 7 }, (_, i) => [0.6 + i * 1.3, 3]), Array.from({ length: 6 }, (_, i) => [i, i + 1])),
            { nodes: [...Array.from({ length: 4 }, (_, i) => ({ id: i, x: 0.4 + i * 1.1, y: 3 })), ...tri(7.6, 3, 4)], edges: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 4]] }],
          c6: () => [mk(circ(6, 5, 3, 2.3), cyc(6)), { nodes: [...tri(2.7, 3, 0), ...tri(7.3, 3, 3)], edges: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3]] }],
          cube: () => [mk(cubePos(5, 3), cubeE), mk(circ(8, 5, 3, 2.4), [...cyc(8), [0, 4], [1, 5], [2, 6], [3, 7]])],
          iso: () => [mk(circ(7, 5, 3, 2.3), [...cyc(7), [0, 3]]), mk(circ(7, 5, 3, 2.3, 0.4), [[0, 2], [2, 4], [4, 6], [6, 1], [1, 3], [3, 5], [5, 0], [0, 6]])],
        };
        const pre = v.select('pair', [{ value: 'p7', label: '$P_7$ vs $P_4\\cup C_3$' }, { value: 'c6', label: '$C_6$ vs $2C_3$' }, { value: 'cube', label: 'cube vs Wagner' }, { value: 'iso', label: 'isomorphic pair' }], 'p7', { onChange: () => load() });
        const SA = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 250, minWidth: 260, title: 'graph $G$' });
        const SB = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 250, minWidth: 260, title: 'graph $H$' });
        const ST = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 130, full: true });
        const [a0, b0] = PRE.p7();
        const opt = (g) => ({ ...g, layout: 'none', editable: true, r: 14, onChange: () => S.reset() });
        const GA = v.graph(SA, opt(a0)), GB = v.graph(SB, opt(b0));
        const COL = ['blue', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'gold', 'accent', 'muted'];
        function load() { const [a, b] = PRE[pre.value](); GA.set({ layout: 'none', ...a }); GB.set({ layout: 'none', ...b }); S.reset(); }
        const adjOf = (G) => { const m = new Map(G.nodes.map((n) => [String(n.id), []])); for (const e of G.edges) { const a = String(e.from), b = String(e.to); if (m.has(a) && m.has(b)) { m.get(a).push(b); m.get(b).push(a); } } return m; };
        const iso = () => {
          const A = adjOf(GA), B = adjOf(GB), ia = [...A.keys()], ib = [...B.keys()];
          if (ia.length !== ib.length || GA.edges.length !== GB.edges.length || ia.length > 10) return ia.length === ib.length ? null : false;
          const mp = new Map(), used = new Set(); const adjA = (x, y) => A.get(x).includes(y), adjB = (x, y) => B.get(x).includes(y);
          const go = (k) => { if (k === ia.length) return true; const x = ia[k]; for (const y of ib) { if (used.has(y) || A.get(x).length !== B.get(y).length) continue; let ok = true; for (const [x2, y2] of mp) if (adjA(x, x2) !== adjB(y, y2)) { ok = false; break; } if (!ok) continue; mp.set(x, y); used.add(y); if (go(k + 1)) return true; mp.delete(x); used.delete(y); } return false; };
          return go(0);
        };
        const frames = () => {
          const A = adjOf(GA), B = adjOf(GB), keys = [...[...A.keys()].map((i) => 'A' + i), ...[...B.keys()].map((i) => 'B' + i)];
          const nb = (k) => (k[0] === 'A' ? A : B).get(k.slice(1)).map((i) => k[0] + i);
          let col = new Map(keys.map((k) => [k, 0])), out = [];
          const hist = (c, tag) => { const h = []; for (const [k, x] of c) if (k[0] === tag) h[x] = (h[x] || 0) + 1; return h; };
          const snap = (c, round, note, extra = {}) => { const K = c.size ? Math.max(0, ...c.values()) + 1 : 0, hA = hist(c, 'A'), hB = hist(c, 'B'); const h = (x) => Array.from({ length: K }, (_, i) => x[i] || 0); const hAa = h(hA), hBa = h(hB); return { col: new Map(c), round, K, hA: hAa, hB: hBa, differ: hAa.some((x, i) => x !== hBa[i]), note, ...extra }; };
          out.push(snap(col, 0, 'Round 0: every vertex gets the same colour. (If the graphs have different numbers of vertices the histograms already differ.)'));
          for (let r = 1; r <= keys.length; r++) {
            const sig = new Map(keys.map((k) => [k, `${col.get(k)}|${nb(k).map((q) => col.get(q)).sort((x, y) => x - y).join(',')}`]));
            const uniq = [...new Set(sig.values())].sort(), nc = new Map(keys.map((k) => [k, uniq.indexOf(sig.get(k))]));
            const prevK = Math.max(...col.values()) + 1, K = uniq.length, stable = K === prevK; col = nc;
            const f = snap(col, r, `Round ${r}: new colour = (old colour, multiset of the neighbours' colours): **${K}** colour classes${stable ? ' — no class split, the partition is stable' : ''}.`);
            out.push(f); if (f.differ || stable) break;
          }
          const last = out[out.length - 1], same = iso();
          out.push({ ...last, final: true, hold: 2, note: last.differ ? `The colour histograms **differ**: $G$ and $H$ are certainly **not isomorphic** (a certificate found in ${last.round} round${last.round === 1 ? '' : 's'}).` : `Stable with **equal histograms**: colour refinement cannot tell $G$ from $H$. Exhaustive search says they ${same === null ? 'are too large to search (limit 10 vertices)' : same ? 'ARE isomorphic.' : '**are not isomorphic** — refinement was fooled.'}` });
          return out;
        };
        const S = v.steps({ frames, still: 1000, codePos: 'below', codeTitle: 'Colour refinement', code: ['colour every vertex of $G$ and $H$ with 0', 'repeat', '  new colour of $v$ ← ( colour of $v$, multiset of neighbours’ colours )', '  if the colour histograms of $G$ and $H$ differ: stop (not isomorphic)', '  if no colour class split: stop (inconclusive)'], speed: 0.7 });
        const T = v.table(ST, { rows: 2, cols: 3, square: false, cellAspect: 0.9, maxCell: 34, size: 14, rowLabels: ['vertices in G', 'vertices in H'], cornerLabel: 'colour' });
        v.render(() => {
          const f = S.frame, c = f.col || new Map();
          const style = (tag) => ({ nodeFill: (id) => COL[(c.get(tag + id) ?? 0) % COL.length], nodeLabel: (id) => String(c.get(tag + id) ?? 0) });
          GA.draw(style('A')); GB.draw(style('B'));
          const K = f.K || 1; T.set({ cols: K });
          T.draw({ value: (i, j) => (i ? f.hB[j] : f.hA[j]), colLabels: (j) => String(j), fill: (i, j) => (f.hA[j] !== f.hB[j] ? ['red', 0.4] : [COL[j % COL.length], 0.35]), highlight: f.hA.map((x, j) => (x !== f.hB[j] ? [[0, j, 'red'], [1, j, 'red']] : [])).flat() });
        });
        v.legend([['blue', 'colour classes (number = class)', { dot: true }], ['red', 'class sizes differ: certificate', { dot: true }]]);
        v.readout(() => { const f = S.frame; return `$|V(G)|=${GA.nodes.length}$, $|V(H)|=${GB.nodes.length}$ · round **${f.round}** · ${f.K} colour classes · ${f.differ ? '**histograms differ**' : 'histograms equal'}`; });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Definition',
      name: 'Oracle machines and relativized classes',
      statement: String.raw`An **oracle Turing machine** $M^{?}$ has a special *query tape* and three states $q_{\text{query}},q_{\text{yes}},q_{\text{no}}$: when it enters $q_{\text{query}}$ with string $y$ on the query tape, the next step moves to $q_{\text{yes}}$ if $y\in O$ and to $q_{\text{no}}$ otherwise — one step, whatever $O$ is. For a language $O\subseteq\{0,1\}^*$,
$$\mathrm P^{O}=\{L(M^{O}):\ M\text{ a deterministic polynomial-time oracle machine}\},\qquad \mathrm{NP}^{O}\text{ likewise with nondeterministic }M.$$
Every usual machine-simulation argument (universal machines, clocks, padding) goes through verbatim with an oracle; the same machine can decide very different languages for different $O$.`,
      idea: String.raw`The oracle is a black box that answers membership questions at unit cost; polynomial time bounds the *number* and *length* of queries, not the work done inside the box. With $O=\mathrm{SAT}$ a polynomial-time machine decides SAT in one query and $\overline{\mathrm{SAT}}$ (TAUTOLOGY) by flipping the answer, so $\mathrm{NP}\cup\mathrm{coNP}\subseteq \mathrm P^{\mathrm{SAT}}$; with $O=\emptyset$ or any $O\in\mathrm P$ nothing is gained, $\mathrm P^{O}=\mathrm P$. The point of the definition is that facts proved by simulation and diagonalization survive relativization, which is the barrier of 1.11.`,
      caption: String.raw`A fixed polynomial-time oracle machine $M$ runs on the formula $\psi$ you type: it writes one query (the formula, or its negation) on the query tape, asks the oracle in a single step and reports the answer (flipped for the second program). Switch the **oracle**: with SAT the machine is always right (decides SAT, resp. TAUT); with $\emptyset$, a random set or the even-length strings it is right only by accident. The table runs $M^{O}$ on eight sample formulas and counts how often it is right.`,
      deps: ['toc-11.9', 'toc-12.11'],
      refs: ['Arora–Barak ch. 3'],
      credit: 'Turing, 1939 (oracles); Baker, Gill & Solovay, 1975 (relativized classes)',
      tags: ['oracles', 'relativization'],
      viz(v) {
        const SAMPLES = ['(x1 | x2) & (~x1 | x3) & (~x2 | ~x3)', 'x1 & ~x1', 'x1 | ~x1', '(x1 | x2 | x3) & (~x1 | ~x2) & ~x3', '(x1 & x2) | (~x1 & ~x2)', 'x1 & x2 & x3 & ~x4', '(x1 | x2) & ~x1 & ~x2', '(x1 | ~x2) & (x2 | ~x3) & (x3 | ~x1)'];
        const inp = v.input('formula $\\psi$', '(x1 | x2) & (~x1 | x3) & (~x2 | ~x3)', { width: 340 });
        const orS = v.select('oracle $O$', [{ value: 'sat', label: 'SAT' }, { value: 'empty', label: '$\\emptyset$' }, { value: 'rand', label: 'random set' }, { value: 'even', label: 'even length' }], 'sat');
        const pgS = v.select('program', [{ value: 'sat', label: 'ask $\\psi$' }, { value: 'taut', label: 'ask $\\neg\\psi$, flip' }], 'sat');
        const A = v.stage({ x: [0, 12], y: [0, 4], axes: false, height: 190, full: true });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        const T = v.table(B, { rows: 9, cols: 4, square: false, cellAspect: 1.5, maxCell: 40, size: 14, labelSize: 11.5, colLabels: ['in target?', 'oracle', 'M outputs', 'right?'], rowLabels: (i) => (i === 0 ? 'typed: ' + (inp.value || '').slice(0, 26) : SAMPLES[i - 1]) });
        const canon = (s) => s.replace(/\s+/g, '');
        const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return (h >>> 7) & 1; };
        const oracle = (q) => { switch (orS.value) { case 'sat': try { return isSat(parseFormula(q)); } catch (e) { return false; } case 'empty': return false; case 'rand': return !!hash(q); default: return q.length % 2 === 0; } };
        const run = (txt) => {
          let ast; try { ast = parseFormula(txt); } catch (e) { return null; }
          const q = pgS.value === 'sat' ? canon(txt) : `~(${canon(txt)})`, ans = oracle(q), out = pgS.value === 'sat' ? ans : !ans;
          const target = pgS.value === 'sat' ? isSat(ast) : !isSat(negate(ast));
          return { q, ans, out, target, ok: out === target };
        };
        v.render(() => {
          const r = run(inp.value || '');
          // diagram
          A.rect(0.4, 0.8, 4.2, 3.2, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 2, radius: 8 });
          A.text('polynomial-time machine $M$', 2.3, 2.85, { align: 'center', size: 13, weight: 700 });
          A.text(pgS.value === 'sat' ? 'write ψ, query, report the answer' : 'write ¬ψ, query, flip the answer', 2.3, 2.15, { align: 'center', size: 11.5, color: 'muted' });
          A.text(r ? `output: ${r.out ? 'YES' : 'NO'}` : 'parse error', 2.3, 1.35, { align: 'center', size: 15, weight: 700, color: r ? (r.ok ? 'green' : 'red') : 'red' });
          A.rect(8.2, 0.8, 11.7, 3.2, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 2.5, radius: 8 });
          A.text('ORACLE $O$', 9.95, 2.85, { align: 'center', size: 13, weight: 700 });
          A.text({ sat: 'SAT', empty: '∅', rand: 'a random set', even: 'even-length strings' }[orS.value], 9.95, 2.1, { align: 'center', size: 13, color: 'muted' });
          A.text('one step per query', 9.95, 1.35, { align: 'center', size: 11.5, color: 'muted' });
          if (r) {
            A.arrow(4.3, 2.4, 8.1, 2.4, { color: 'accent', width: 2.2, head: 8 });
            A.arrow(8.1, 1.5, 4.3, 1.5, { color: r.ans ? 'green' : 'red', width: 2.2, head: 8 });
            A.text(r.q.length > 34 ? r.q.slice(0, 33) + '…' : r.q, 6.2, 2.75, { align: 'center', size: 10.5, color: 'accent' });
            A.text(`answer: ${r.ans ? 'yes' : 'no'}`, 6.2, 1.1, { align: 'center', size: 12, weight: 700, color: r.ans ? 'green' : 'red' });
          }
          const rows = [inp.value || '', ...SAMPLES].map(run);
          T.draw({
            value: (i, j) => (!rows[i] ? '—' : [rows[i].target, rows[i].ans, rows[i].out, rows[i].ok ? '✓' : '✗'][j]),
            fill: (i, j) => (rows[i] && j === 3 ? [rows[i].ok ? 'green' : 'red', 0.3] : null),
            highlight: [[0, 0], [0, 1], [0, 2], [0, 3]],
          });
        });
        v.legend([['accent', 'query written by $M$'], ['green', 'oracle answer (yes)'], ['red', 'oracle answer (no)']]);
        v.readout(() => {
          const rows = SAMPLES.map(run), k = rows.filter((r) => r.ok).length, r = run(inp.value || '');
          return `**${k}** of 8 sample formulas decided correctly by $M^{O}$ · target language: ${pgS.value === 'sat' ? 'SAT' : 'TAUTOLOGY'} · ${r ? `typed formula: query of length ${r.q.length}, **1** oracle step, total time $\\approx ${r.q.length + 2}$` : 'cannot parse the typed formula (use x1, ~, &, |, parentheses)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Theorem',
      name: 'Baker–Gill–Solovay: relativization barrier',
      statement: String.raw`There are oracles $A$ and $B$ such that

$$\begin{gathered}\mathrm P^{A}=\mathrm{NP}^{A}\\
\text{and}\quad \mathrm P^{B}\neq\mathrm{NP}^{B}.\end{gathered}$$

Take $A$ to be any $\mathrm{PSPACE}$-complete language (e.g. TQBF); then $\mathrm P^A=\mathrm{NP}^A=\mathrm{PSPACE}$. Take $B$ built by diagonalization so that $L_B=\{1^n:\ B\cap\{0,1\}^n\ne\emptyset\}$ is in $\mathrm{NP}^B$ but not in $\mathrm P^B$. Consequently a proof of $\mathrm P=\mathrm{NP}$ or of $\mathrm P\ne\mathrm{NP}$ cannot be *relativizing*, i.e. cannot be one that holds verbatim for every oracle — which rules out plain simulation-and-diagonalization arguments.`,
      idea: String.raw`**Oracle $A$.** $\mathrm P^A\subseteq\mathrm{NP}^A\subseteq\mathrm{PSPACE}^A=\mathrm{PSPACE}$ (the whole oracle-using computation is a polynomial-space computation, answering queries by running a PSPACE algorithm), and $\mathrm{PSPACE}\subseteq\mathrm P^A$ because $A$ is PSPACE-hard. Concretely, a nondeterministic machine that guesses $y$ and asks $A$ about $\varphi_y$ is simulated by *one* query $\exists y\,\varphi_y$, itself a quantified formula. **Oracle $B$.** $L_B\in\mathrm{NP}^B$: guess a string of length $n$ and query it. Order all polynomial-time oracle machines $M_1,M_2,\dots$ and build $B$ in stages: at stage $i$ choose a fresh length $n_i$ greater than every earlier chosen or queried length, with $2^{n_i}$ larger than $M_i$'s running time, and run $M_i^{B}$ on $1^{n_i}$ with $B$ so far (nothing of length $n_i$). If $M_i$ accepts, leave $B$ empty at that length; then $1^{n_i}\notin L_B$ and $M_i$ is wrong. If it rejects, it queried fewer than $2^{n_i}$ strings, so put an *unqueried* string of length $n_i$ into $B$: the run is unchanged, $M_i$ still rejects, but $1^{n_i}\in L_B$. Freeze every answer queried at this stage. Later stages choose lengths beyond all these queries and all earlier chosen lengths, so they neither alter this run nor fill an earlier length deliberately left empty. Every $M_i$ errs somewhere. The key fact in both halves is that oracle machines relativize: the same diagonal argument as 1.2 works, but it can be *aimed* by choosing the oracle.

The required fresh length exists by pma-3.20(d): for each fixed clock $n^d$ and constant $C$, $Cn^d/2^n\to0$. Hence a stage can choose an arbitrarily large length with more candidate strings than queries. This numerical gap leaves an unqueried string; it does not itself prove that later stages preserve earlier oracle answers.`,
      caption: String.raw`Step through both constructions at once. **Left, oracle $A$ = TQBF**: type the matrix $\psi(x,y,u,w)$ (variables $x_1,x_2,y_1,y_2,y_3,u,w$) and set the input bits; the nondeterministic machine $N^A$ guesses $y$ and asks $A$ whether $\forall u\exists w\,\psi$ holds (eight branches); the deterministic $P^A$ asks the *single* question $\exists y\forall u\exists w\,\psi$ — the answers agree, always. **Right, oracle $B$**: the $2^{n}$ strings of length $n_i$ as a grid. The toy machines $M_i$ query cells (gold; all answered *no*) within their polynomial budget $n_i^2$, then answer; the adversary then plants a string they never looked at (red) or leaves the row empty. The machines are illustrative query strategies standing in for *all* polynomial-time machines.`,
      deps: ['cplx-1.10', 'cplx-1.2', 'pma-3.20'],
      refs: ['Arora–Barak ch. 3'],
      credit: 'Theodore Baker, John Gill & Robert Solovay, 1975',
      tags: ['oracles', 'relativization', 'barrier'],
      viz(v) {
        const inp = v.input('matrix $\\psi$', '(y1 | x1 | u) & (~y2 | w) & (~u | y3 | ~w) & (~y1 | x2 | w)', { width: 380, onChange: () => S.reset({ at: 'keep' }) });
        const x1 = v.toggle('$x_1=1$', true, { onChange: () => S.reset({ at: 'keep' }) });
        const x2 = v.toggle('$x_2=1$', false, { onChange: () => S.reset({ at: 'keep' }) });
        const SA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 300, title: 'oracle $A$: TQBF, so $\\mathrm P^A=\\mathrm{NP}^A$' });
        const SB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, minWidth: 300, title: 'oracle $B$: built against every machine' });
        const T = v.table(SA, { rows: 9, cols: 2, square: false, cellAspect: 1.7, maxCell: 34, size: 13, labelSize: 11.5, colLabels: ['phi_y', 'N accepts?'], cornerLabel: 'guess y' });
        const NS = [6, 7, 8, 9], KIND = ['scans $0,1,2,\\dots$', 'probes pseudo-random strings', 'probes low-weight strings, then guesses “accept”', 'probes with a large stride'], OUT = [0, 0, 1, 0];
        const probes = (i, n, q) => {
          const N = 2 ** n, res = [];
          if (i === 0) for (let k = 0; k < q; k++) res.push(k);
          else if (i === 1) { const r = v.rng(5), s = new Set(); while (s.size < q) s.add(Math.floor(r() * N)); res.push(...s); }
          else if (i === 2) { const all = []; for (let m = 0; m < N; m++) all.push([popcount(m), m]); all.sort((a, b) => a[0] - b[0] || a[1] - b[1]); for (let k = 0; k < q; k++) res.push(all[k][1]); }
          else { const stride = 2 * Math.floor(N / 7) + 1; for (let k = 0; k < q; k++) res.push((k * stride) % N); }
          return res;
        };
        const stageInfo = NS.map((n, i) => { const q = n * n, pr = probes(i, n, q), qs = new Set(pr); let w = 0; while (qs.has(w)) w++; return { n, q, pr: qs, w, plant: OUT[i] === 0 }; });
        const qbf = () => {
          let ast; try { ast = parseFormula(inp.value || ''); } catch (e) { return { err: e.message }; }
          const ys = [], base = { x1: x1.value, x2: x2.value }, rows = [];
          for (let m = 0; m < 8; m++) {
            const y = [m >> 2 & 1, m >> 1 & 1, m & 1]; let all = true;
            for (const u of [0, 1]) { let ex = false; for (const w of [0, 1]) if (evalFormula(ast, { ...base, y1: y[0], y2: y[1], y3: y[2], u, w })) ex = true; if (!ex) all = false; }
            rows.push({ y, val: all });
          }
          return { rows, any: rows.some((r) => r.val) };
        };
        const frames = () => {
          const out = [];
          for (let f = 0; f <= 12; f++) {
            const st = Math.min(3, Math.floor(f / 3)), sub = f % 3, I = stageInfo[st];
            const a = Math.min(f, 3);
            let note;
            if (f === 12) note = 'Every machine in the list has been defeated at its own stage: $L_B\\in\\mathrm{NP}^B\\setminus\\mathrm P^B$ for this list — and for all polynomial-time machines in the real construction, since each gets a stage (with a length $n_i$ so large that $2^{n_i}$ exceeds its running time).';
            else if (sub === 0) note = `**Stage ${st + 1}**: machine $M_${st + 1}$ ${KIND[st]}; length $n_${st + 1}=${I.n}$, so the oracle has $2^{${I.n}}=${2 ** I.n}$ strings of that length but $M_${st + 1}$ may make only $n^2=${I.q}$ queries. $B$ is empty at this length so far.`;
            else if (sub === 1) note = `Run $M_${st + 1}$ on $1^{${I.n}}$: it queries ${I.q} strings (gold) and every answer is *no* — only ${I.q} of ${2 ** I.n} strings were looked at.`;
            else note = OUT[st] ? `$M_${st + 1}$ **accepts** (it guessed). Leave $B$ empty at length ${I.n}: $1^{${I.n}}\\notin L_B$, so $M_${st + 1}$ is wrong.` : `$M_${st + 1}$ **rejects**. Put an unqueried string (red cell ${I.w}) into $B$: $M_${st + 1}$'s run is unchanged — still rejects — but now $1^{${I.n}}\\in L_B$. Wrong again.`;
            out.push({ st, sub, a, final: f === 12, note });
          }
          return out;
        };
        const S = v.steps({ frames, still: 12, speed: 0.6, note: true, counter: 'step' });
        v.render(() => {
          const f = S.frame, q = qbf();
          // left panel
          if (q.err) { SA.text('cannot parse ψ: ' + q.err, 0.5, 0.5, { align: 'center', color: 'red' }); } else {
            T.draw({
              value: (i, j) => (i === 8 ? (j === 0 ? 'exists y …' : j === 1 ? (f.a >= 3 ? (q.any ? 'YES' : 'NO') : '') : '') : j === 0 ? (f.a >= 1 ? (q.rows[i].val ? 'true' : 'false') : '') : j === 1 ? (f.a >= 2 ? (q.rows[i].val ? 'accept' : 'reject') : '') : ''),
              rowLabels: (i) => (i === 8 ? 'P: one query' : `${q.rows[i].y.join('')}`),
              fill: (i, j) => (i === 8 ? (f.a >= 3 ? [q.any ? 'green' : 'red', 0.35] : null) : f.a >= 1 && j < 2 && (j === 0 || f.a >= 2) ? [q.rows[i].val ? 'green' : 'red', 0.2] : null),
            });
            if (f.a >= 3) SA.text(`$N^A$ has an accepting branch: ${q.any ? 'yes' : 'no'}  =  $P^A$'s single answer: ${q.any ? 'yes' : 'no'}`, 0.5, 0.045, { align: 'center', size: 12, weight: 700, color: 'green' });
          }
          // right panel
          const st = f.final ? 3 : f.st, I = stageInfo[st], R = 2 ** Math.ceil(I.n / 2), C = 2 ** Math.floor(I.n / 2);
          const showQ = !f.final && f.sub >= 1, showW = !f.final && f.sub === 2 && I.plant;
          if (f.final) {
            SB.setView([0, 10], [0, 7.4]);
            SB.text('Final tally', 5, 6.7, { align: 'center', size: 14, weight: 700 });
            stageInfo.forEach((s, i) => {
              SB.text(`$M_${i + 1}$ at $n_${i + 1}=${s.n}$: ${OUT[i] ? 'accepts' : 'rejects'}`, 0.4, 5.5 - i * 1.25, { size: 13, weight: 600 });
              SB.text(`${s.plant ? 'string planted' : 'row left empty'} → $1^{${s.n}}${s.plant ? '\\in' : '\\notin'} L_B$ → ${OUT[i] ? 'M says yes, truth no' : 'M says no, truth yes'} ✓`, 0.4, 5.5 - i * 1.25 - 0.55, { size: 12, color: 'green' });
            });
          } else {
            SB.setView([-0.5, C + 0.5], [-2.2, R + 0.5]);
            for (let m = 0; m < 2 ** I.n; m++) {
              const cx = m % C, cy = R - 1 - Math.floor(m / C), qd = showQ && I.pr.has(m), w = showW && m === I.w;
              SB.rect(cx + 0.06, cy + 0.06, cx + 0.94, cy + 0.94, { fill: w ? 'red' : qd ? 'gold' : 'muted', fillAlpha: w ? 0.9 : qd ? 0.65 : 0.1, color: w ? 'red' : qd ? 'gold' : 'faint', width: w ? 2 : 0.8 });
            }
            SB.text(`length $n_${f.st + 1}=${I.n}$: ${2 ** I.n} strings, ${I.q} queries`, C / 2, -1.2, { align: 'center', size: 12.5, weight: 600 });
          }
        });
        v.legend([['gold', 'queried by $M_i$ (answer: no)', { dot: true }], ['red', 'planted into $B$', { dot: true }], ['green', 'both sides agree']]);
        v.readout(() => {
          const q = qbf(); if (q.err) return `Cannot parse $\\psi$: ${q.err}`;
          return `Oracle $A$: **${q.rows.filter((r) => r.val).length}** of 8 branches of $N^A$ accept, so $N^A$ ${q.any ? 'accepts' : 'rejects'} — and the single query $\\exists y\\forall u\\exists w\\,\\psi$ to TQBF returns **${q.any ? 'yes' : 'no'}**: $\\mathrm{NP}^A$ and $\\mathrm P^A$ agree on every input. Oracle $B$: no toy machine decides $L_B$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Theorem',
      name: 'A provably intractable natural problem',
      statement: String.raw`Let a **regular expression with squaring** be built from letters, union $|$, concatenation, star and the operator $r^2$ (more generally $r^k$ with $k$ written in binary). The problem EQUIV$_{\uparrow}$: “do two such expressions denote the same language?” is $\mathrm{EXPSPACE}$-complete (Meyer–Stockmeyer 1972). Since $\mathrm{PSPACE}\subsetneq\mathrm{EXPSPACE}$ by the space hierarchy theorem (1.3), this natural problem is **not in PSPACE**, hence not in P — and the proof of this is unconditional, with no use of $\mathrm P\ne\mathrm{NP}$-type assumptions. Without squaring, equivalence is only PSPACE-complete (Stockmeyer–Meyer 1973).`,
      idea: String.raw`Squaring lets a short expression describe an exponentially long string: $(\cdots((a|b)^2)^2\cdots)^2$ with $k$ squarings has about $4k$ symbols but denotes $\{a,b\}^{2^k}$. A computation of an $\mathrm{EXPSPACE}$ machine is a tableau of $2^{p(n)}$ rows of $2^{p(n)}$ cells; Meyer and Stockmeyer write, with squaring, an expression of size $\mathrm{poly}(n)$ for “all strings that are *not* an accepting computation tableau”: some cell is wrong, a position at distance $2^{p(n)}$ from it carries a conflicting symbol. The machine accepts iff this expression is *not* equivalent to $\{\Sigma\}^{*}$. A decision procedure for EQUIV$_\uparrow$ in polynomial space would therefore put every EXPSPACE language in PSPACE, contradicting the space hierarchy theorem. The problem is intractable no matter what.`,
      caption: String.raw`**Left**: the family of $k$ nested squarings: its written length (blue) grows linearly, the length of the strings it generates (red) doubles each time — the gap is the whole story; drag $k$. **Right**: type two expressions over $\{a,b\}$ using | (union), * (star), ^n (power), parentheses and e for the empty string; the tool expands the exponents, builds an NFA and decides equivalence by a product construction (feasible only up to a few thousand symbols), reporting the shortest string on which they differ and the number of DFA states the subset construction needs. The bars compare *written* with *expanded* size. Try (a|b)^8 against eight copies of (a|b), or (a|b)^8 against (a|b)^9.`,
      deps: ['cplx-1.3', 'toc-3.6'],
      refs: ['Arora–Barak ch. 3'],
      credit: 'Albert Meyer & Larry Stockmeyer, 1972',
      tags: ['EXPSPACE', 'regular expressions'],
      viz(v) {
        const kS = v.slider('nested squarings $k$', 0, 30, 6, { int: true });
        const r1 = v.input('expression 1', '(a|b)^8', { width: 240 });
        const r2 = v.input('expression 2', '(a|b)(a|b)(a|b)(a|b)(a|b)(a|b)(a|b)(a|b)', { width: 240 });
        const A = v.stage({ x: [0, 30], y: [1, 1e10], ylog: true, axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'squarings $k$', ylabel: 'length (log scale)', title: 'family $(\\cdots((a|b)^2)^2\\cdots)^2$' });
        const B = v.stage({ x: [-0.5, 5.5], y: [0.5, 1e5], ylog: true, axes: 'box', gutter: true, height: 300, minWidth: 280, ylabel: 'size (log scale)', xticks: [[1, 'expr. 1'], [3, 'expr. 2'], [4.95, 'DFA states']] });
        // --- regex machinery
        function parse(src) {
          const t = src.replace(/\s+/g, ''); let i = 0;
          const alt = () => { let a = cat(); while (t[i] === '|') { i++; a = { t: 'alt', a, b: cat() }; } return a; };
          const cat = () => { let a = null; while (i < t.length && t[i] !== '|' && t[i] !== ')') { const r = rep(); a = a ? { t: 'cat', a, b: r } : r; } if (!a) throw new Error('empty subexpression'); return a; };
          const rep = () => { let a = atom(); while (t[i] === '*' || t[i] === '^') { if (t[i] === '*') { i++; a = { t: 'star', a }; } else { i++; let d = ''; while (/\d/.test(t[i] || '')) d += t[i++]; if (!d) throw new Error('digits expected after ^'); a = { t: 'pow', a, k: BigInt(d) }; } } return a; };
          const atom = () => { const c = t[i]; if (c === '(') { i++; const a = alt(); if (t[i] !== ')') throw new Error('missing )'); i++; return a; } if (c === 'a' || c === 'b') { i++; return { t: 'sym', c }; } if (c === 'e') { i++; return { t: 'eps' }; } throw new Error(c ? `unexpected "${c}"` : 'unexpected end'); };
          const a = alt(); if (i < t.length) throw new Error(`unexpected "${t[i]}"`); return a;
        }
        const exp = (a) => ({ sym: () => 1n, eps: () => 0n, cat: () => exp(a.a) + exp(a.b), alt: () => exp(a.a) + exp(a.b), star: () => exp(a.a), pow: () => a.k * exp(a.a) }[a.t]());
        const wr = (a) => ({ sym: () => 1, eps: () => 1, cat: () => wr(a.a) + wr(a.b), alt: () => wr(a.a) + wr(a.b) + 1, star: () => wr(a.a) + 1, pow: () => wr(a.a) + 1 + bitLen(a.k) }[a.t]());
        function nfa(a) { // Thompson, expanding powers
          const tr = []; const ns = () => { tr.push([]); return tr.length - 1; };
          const go = (a) => { const s = ns(), e = ns();
            switch (a.t) {
              case 'sym': tr[s].push([a.c, e]); break;
              case 'eps': tr[s].push([null, e]); break;
              case 'cat': { const x = go(a.a), y = go(a.b); tr[s].push([null, x[0]]); tr[x[1]].push([null, y[0]]); tr[y[1]].push([null, e]); break; }
              case 'alt': { const x = go(a.a), y = go(a.b); tr[s].push([null, x[0]], [null, y[0]]); tr[x[1]].push([null, e]); tr[y[1]].push([null, e]); break; }
              case 'star': { const x = go(a.a); tr[s].push([null, x[0]], [null, e]); tr[x[1]].push([null, x[0]], [null, e]); break; }
              default: { let prev = s; for (let k = 0n; k < a.k; k++) { const x = go(a.a); tr[prev].push([null, x[0]]); prev = x[1]; } tr[prev].push([null, e]); }
            } return [s, e]; };
          const [s, e] = go(a); return { tr, s, e };
        }
        const clos = (N, set) => { const st = [...set], seen = new Set(set); while (st.length) { const u = st.pop(); for (const [c, w] of N.tr[u]) if (c === null && !seen.has(w)) { seen.add(w); st.push(w); } } return seen; };
        const step = (N, set, c) => { const o = new Set(); for (const u of set) for (const [d, w] of N.tr[u]) if (d === c) o.add(w); return clos(N, o); };
        const key = (s) => [...s].sort((x, y) => x - y).join(',');
        function analyse(txt) { try { const ast = parse(txt), E = exp(ast); return { ast, E, W: wr(ast), N: E <= 3000n ? nfa(ast) : null }; } catch (e) { return { err: e.message }; } }
        function dfaCount(N) { const s0 = clos(N, [N.s]), seen = new Set([key(s0)]), q = [s0]; while (q.length) { const u = q.pop(); for (const c of 'ab') { const w = step(N, u, c), k = key(w); if (!seen.has(k)) { seen.add(k); q.push(w); } } } return seen.size; }
        function equiv(X, Y) {
          const a0 = clos(X, [X.s]), b0 = clos(Y, [Y.s]), seen = new Set([key(a0) + '|' + key(b0)]), q = [[a0, b0, '']];
          for (let h = 0; h < q.length; h++) { const [a, b, w] = q[h]; if (a.has(X.e) !== b.has(Y.e)) return { eq: false, w, in1: a.has(X.e) };
            for (const c of 'ab') { const a2 = step(X, a, c), b2 = step(Y, b, c), k = key(a2) + '|' + key(b2); if (!seen.has(k)) { seen.add(k); q.push([a2, b2, w + c]); } } }
          return { eq: true, states: q.length };
        }
        const fam = (k) => { let s = '(a|b)'; for (let i = 0; i < k; i++) s = `(${s})^2`; return s; };
        v.render(() => {
          const k = kS.value;
          A.fn((x) => 5 + 4 * x, { color: 'blue', width: 2.6, domain: [0, 30] }); A.fn((x) => 2 ** x, { color: 'red', width: 2.6, domain: [0, 30] });
          A.vline(k, { color: 'gold', dash: [4, 3] }); A.dot(k, 5 + 4 * k, { r: 5, color: 'blue' }); A.dot(k, 2 ** k, { r: 5, color: 'red' });
          const x1 = analyse(r1.value || ''), x2 = analyse(r2.value || '');
          const bars = [[0, x1.err ? 0 : x1.W, 'blue'], [1, x1.err ? 0 : Number(x1.E), 'red'], [2, x2.err ? 0 : x2.W, 'blue'], [3, x2.err ? 0 : Number(x2.E), 'red']];
          bars.forEach(([i, val, c]) => { if (val > 0) { B.rect(i + 0.1 + (i >= 2 ? 0.0 : 0) , 0.5, i + 0.9, Math.max(val, 0.5), { fill: c, fillAlpha: 0.4, color: c, width: 1.5 }); B.text(big(val), i + 0.5, val, { align: 'center', dy: -9, size: 11, weight: 700 }); } });
          [x1, x2].forEach((x, j) => { if (x.N) { const d = dfaCount(x.N); if (j === 0) { B.rect(4.05, 0.5, 4.5, d, { fill: 'purple', fillAlpha: 0.4, color: 'purple', width: 1.5 }); B.text(String(d), 4.275, d, { align: 'center', dy: -9, size: 11, weight: 700 }); } else { B.rect(4.55, 0.5, 5, d, { fill: 'teal', fillAlpha: 0.4, color: 'teal', width: 1.5 }); B.text(String(d), 4.775, d, { align: 'center', dy: -9, size: 11, weight: 700 }); } } });
        });
        v.legend([['blue', 'written size (exponents in binary)'], ['red', 'expanded size (symbols)'], ['purple', 'DFA states, expr. 1'], ['teal', 'DFA states, expr. 2']]);
        v.readout(() => {
          const k = kS.value, x1 = analyse(r1.value || ''), x2 = analyse(r2.value || '');
          const fs = fam(k);
          let verdict;
          if (x1.err || x2.err) verdict = `Parse error: ${x1.err ? 'expression 1: ' + x1.err : 'expression 2: ' + x2.err}`;
          else if (!x1.N || !x2.N) verdict = `Expanded sizes ${big(x1.E)} and ${big(x2.E)}: too large to expand (limit 3000) — exactly the exponential blow-up the theorem exploits.`;
          else { const q = equiv(x1.N, x2.N); verdict = q.eq ? `**Equivalent** (product search over ${q.states} state pairs).` : `**Not equivalent**: the shortest distinguishing string is ${q.w === '' ? 'the empty string' : '“' + q.w + '”'}, which expression ${q.in1 ? '1' : '2'} accepts and the other rejects.`; }
          return `$k=${k}$: written length ${5 + 4 * k}${k <= 3 ? ` (\`${fs}\`)` : ''}, generates strings of length **${tbig(2 ** k)}**\n${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Paper',
      name: 'On the Computational Complexity of Algorithms',
      paper: { authors: 'J. Hartmanis and R. E. Stearns', year: 1965, title: 'On the Computational Complexity of Algorithms', venue: 'Transactions of the American Mathematical Society 117: 285–306', doi: '10.1090/S0002-9947-1965-0170805-7' },
      introduces: ['toc-12.2', 'cplx-1.1', 'cplx-1.2', 'cplx-1.6'],
      statement: String.raw`Hartmanis and Stearns classify problems — in the paper, mostly the *binary expansions of real numbers* — by how fast a multitape Turing machine can print them: a sequence $\alpha$ is $T$-computable if some machine prints its first $n$ digits within $T(n)$ steps. They show (i) **speed-up**: $T$-computable and $kT$-computable coincide for every constant $k$, so only the growth rate of $T$ matters; (ii) a **hierarchy**: given a time bound $U$ that grows sufficiently faster than $T$ (a quadratic gap in their simulation: $U\ge T^2$ up to the usual constructibility requirements), there is a sequence computable in time $U$ but not in time $T$, obtained by *diagonalizing* against all machines; hence there are infinitely many distinct complexity classes; and (iii) they study where familiar numbers sit, noting that rational numbers are computable in real time ($T(n)=n$) and asking whether an irrational algebraic number can be. Scope: their model is the multitape Turing machine; the gap was later sharpened to $T\log T$ (Hennie & Stearns, 1966).`,
      idea: String.raw`Computability (Turing, 1936) asked *whether* a number can be computed; by 1965 digital computers made *how fast* the natural question. The paper fixes a machine model, defines the complexity of a computation as its running time, and proves two robustness facts: the classes do not depend on the speed or alphabet of the machine (speed-up, cplx-1.6) and they are strictly nested by growth rate (diagonalization with a clock, cplx-1.2, which needs the bound to be computable in time, cplx-1.1). The method is Cantor's diagonal argument with a stopwatch — the template for every later separation result — and the paper's definition of running time is the toc-12.2 notion. It earned its authors the 1993 Turing Award (cited for founding computational complexity).`,
      caption: String.raw`The paper contains no numerical figure; this recreates its central construction with seven real sequences (our own choice) and honest operation counts (the count of elementary operations of a simple generating algorithm, not literal Turing-machine steps). **Top left**: digit table of the sequences; the last row is the diagonal sequence $D$ — digit $i$ differs from digit $i$ of sequence $i$ — which is *not* computable within the clock $T$ because it differs from every sequence that is. **Top right** (log–log): operations to print the first $n$ digits of each sequence against the clock $T(n)=c\,g(n)$ and the larger bound $U=T^2$ in which $D$ is printed. Sequences below the clock are diagonalized (green). **Bottom**: speed-up — pack $k$ digits per symbol and the cost of the $\sqrt2$ computation falls by about $k$, plus the unavoidable $n$ for reading the input.`,
      deps: ['toc-7.5', 'toc-1.5'],
      refs: [],
      credit: 'Juris Hartmanis & Richard Stearns, 1965 (Turing Award 1993)',
      tags: ['complexity classes', 'hierarchy'],
      viz(v) {
        const bigSqrt = (N) => { let x = 1n << BigInt(Math.ceil(N.toString(2).length / 2)); for (;;) { const y = (x + N / x) >> 1n; if (y >= x) return x; x = y; } };
        const isP = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
        const NMAX = 200;
        const champ = []; for (let m = 1; champ.length < NMAX + 5; m++) champ.push(...m.toString(2).split('').map(Number));
        const sq2 = (i) => Number(bigSqrt(2n << BigInt(2 * i)) & 1n);
        const SEQ = [
          { name: 'zeros', d: () => 0, cost: (n) => n },
          { name: '.0101… (1/3)', d: (i) => (i % 2 === 0 ? 1 : 0), cost: (n) => n },
          { name: '.001001… (1/7)', d: (i) => (i % 3 === 0 ? 1 : 0), cost: (n) => n },
          { name: 'Champernowne', d: (i) => champ[i - 1], cost: (n) => n + countupFlips(Math.ceil(n / 3)) },
          { name: 'Thue–Morse', d: (i) => popcount(i - 1) % 2, cost: (n) => { let c = 0; for (let i = 1; i <= n; i++) c += bitLen(i); return c; } },
          { name: 'primes (indicator)', d: (i) => (isP(i) ? 1 : 0), cost: (n) => { let c = 0; for (let i = 2; i <= n; i++) { let d = 2; c++; while (d * d <= i && i % d) { d++; c++; } } return c + n; } },
          { name: '√2', d: sq2, cost: (n) => (n * (n + 1)) / 2 },
        ];
        const NC = 12, NS = SEQ.length;
        const gS = v.select('growth $g(n)$', [{ value: 'n', label: '$n$' }, { value: 'n15', label: '$n^{1.5}$' }, { value: 'n2', label: '$n^2$' }], 'n');
        const cS = v.slider('constant $c$', 1, 8, 3, { int: true });
        const kS = v.select('block size $k$', [1, 2, 4, 8, 16].map((k) => ({ value: k, label: String(k) })), 8);
        const G = { n: (n) => n, n15: (n) => n ** 1.5, n2: (n) => n * n };
        const S1 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, minWidth: 300, title: 'digits of the sequences; last row: the diagonal $D$' });
        const S2 = v.stage({ x: [4, NMAX], y: [3, 1e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, minWidth: 280, xlabel: 'digits printed $n$', ylabel: 'operations (log scale)' });
        const S3 = v.stage({ x: [8, NMAX], y: [8, 1e4], xlog: true, ylog: true, axes: 'box', gutter: true, height: 330, minWidth: 260, xlabel: 'digits $n$', ylabel: 'operations' });
        const T = v.table(S1, { rows: NS + 1, cols: NC, square: false, cellAspect: 0.8, maxCell: 28, size: 13, labelSize: 11.5, rowLabels: (i) => (i < NS ? SEQ[i].name : 'D (diagonal)'), colLabels: (j) => String(j + 1), cornerLabel: 'digit i' });
        const costs = SEQ.map((s) => Array.from({ length: NMAX + 1 }, (_, n) => (n ? s.cost(n) : 0)));
        const dig = SEQ.map((s) => Array.from({ length: NC }, (_, j) => s.d(j + 1)));
        const comp = (j) => { const T0 = (n) => cS.value * G[gS.value](n); let ok = true; for (let n = 8; n <= NMAX; n++) if (costs[j][n] > T0(n)) { ok = false; break; } return ok; };
        v.render(() => {
          const inside = SEQ.map((_, j) => comp(j));
          T.draw({
            value: (i, j) => (i < NS ? dig[i][j] : j < NS ? 1 - dig[j][j] : '·'),
            fill: (i, j) => (i === j && i < NS ? [inside[i] ? 'green' : 'orange', 0.4] : i === NS && j < NS ? ['accent', 0.2] : null),
            textColor: (i, j) => (i < NS && i !== j ? 'muted' : null),
            highlight: [[NS, 0], [NS, 1], [NS, 2], [NS, 3], [NS, 4], [NS, 5], [NS, 6]].map((c) => [...c, 'accent']),
          });
          const T0 = (n) => cS.value * G[gS.value](n);
          const col = ['blue', 'teal', 'purple', 'pink', 'orange', 'gold', 'red'];
          SEQ.forEach((s, j) => S2.path(costs[j].map((c, n) => (n >= 4 ? [n, c] : null)).filter(Boolean), { color: inside[j] ? 'green' : col[j], width: 1.8, alpha: inside[j] ? 0.9 : 0.8 }));
          S2.fn(T0, { color: 'ink', width: 2.6, dash: [6, 4], domain: [4, NMAX] }); S2.fn((n) => T0(n) ** 2, { color: 'accent', width: 2.2, dash: [2, 4], domain: [4, NMAX] });
          // speedup of sqrt2
          const k = kS.value;
          S3.path(costs[6].map((c, n) => (n >= 8 ? [n, c] : null)).filter(Boolean), { color: 'red', width: 2.4 });
          S3.path(costs[6].map((c, n) => (n >= 8 ? [n, c / k + n + n / k] : null)).filter(Boolean), { color: 'green', width: 2.4 });
          S3.fn((n) => n, { color: 'faint', dash: true, width: 1.2, domain: [8, NMAX] });
        });
        v.legend([['green', 'inside the clock: diagonalized'], ['ink', 'clock $T$', { dash: true }], ['accent', 'bound $U=T^2$ where $D$ is printed', { dash: true }], ['red', '$\\sqrt2$, original'], ['green', '$\\sqrt2$ with blocks of $k$ digits']]);
        v.readout(() => {
          const inside = SEQ.map((_, j) => comp(j)), k = kS.value;
          return `Clock $T(n)=${cS.value}\\cdot g(n)$: **${inside.filter(Boolean).length}** of 7 sequences are $T$-computable (diagonalized by $D$): ${SEQ.filter((_, j) => inside[j]).map((s) => s.name).join(', ') || 'none'} · the others outgrow the clock · $D$ needs time about $T^2$: at $n=100$, $T=${tbig(cS.value * G[gS.value](100))}$, $U=${tbig((cS.value * G[gS.value](100)) ** 2)}$\nSpeed-up for $\\sqrt2$ at $n=100$: ${big(costs[6][100])} → **${big(costs[6][100] / k + 100 + 100 / k)}** operations with $k=${k}$ digits per symbol`;
        });
      },
    },
  ],
};
