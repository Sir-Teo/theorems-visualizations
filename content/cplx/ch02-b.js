// Computational Complexity — Chapter 2 (The web of NP-complete problems), part 2: 2.8–2.14
// SET-COVER and HITTING-SET, planar 3-colouring, hard puzzles, Schaefer's dichotomy theorem, Mahaney's theorem, the
// Berman–Hartmanis isomorphism conjecture, and Karp's 1972 paper. Part 1 is ch02.js (2.1–2.7).
//
// Honesty notes. Reductions are executed on the instance on screen and both sides are solved by brute force or DPLL. Two items
// (2.12, 2.13) rest on hypotheses that are believed false or open: their pictures simulate the *hypothetical* object (a sparse
// reduction, a pair of padding functions) and say so.
import {
  clamp, sup, big, cnfSat, litStr, clauseTex, cnfTex, allModels, dpll, dlx, subsetSumFind, adjMask, popc,
  minVertexCover, maxClique, threeColour, randomCNF,
} from './ch02.shared.js';

export default {
  collection: 'cplx',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'SET-COVER and HITTING-SET are NP-complete',
      statement: String.raw`**SET-COVER**: given a universe $U$, a family $\mathcal S$ of subsets of $U$ and a number $k$, are there $k$ sets of $\mathcal S$ whose union is $U$? **HITTING-SET**: given the same family and $k$, is there a set of $k$ elements of $U$ meeting every member of $\mathcal S$? Both are in NP and NP-complete. They are the same problem seen from two sides — swap the roles of "elements" and "sets" in the incidence matrix — and both contain VERTEX-COVER as the special case in which $U$ is the edge set and every element lies in exactly two sets.`,
      idea: String.raw`Given a graph $G$ and $k$, take the universe $U=E(G)$ and for each vertex $v$ the set $S_v$ of edges at $v$. Choosing vertices $C$ covers all edges iff the sets $\{S_v\}_{v\in C}$ cover $U$, so VERTEX-COVER (toc-13.7) reduces to SET-COVER with the same $k$. Transposing the incidence matrix gives HITTING-SET: now each edge is a set $\{u,v\}$ and a hitting set is a set of vertices touching every edge. NP-membership is immediate; the *greedy* algorithm (always take the set covering most uncovered elements) is a $\ln n$-approximation but not optimal, as the second instance shows.`,
      caption: String.raw`Click vertices (graph instance) or set chips (greedy-trap instance) to build a cover. The **matrix** on the right is the incidence matrix: in *set cover* view a row is a set and you need its columns to cover every column; flip to *hitting set* view and the same matrix is transposed — rows are now the sets to hit and columns the elements you pick. The counter compares your size with the **optimum** (found by exhaustive search) and with what **greedy** returns; on the trap instance greedy takes 3 sets while 2 suffice.`,
      deps: ['toc-13.7'],
      refs: ['Arora–Barak ch. 2'],
      credit: 'Karp, 1972; greedy ln n bound: Johnson 1974, Lovász 1975',
      tags: ['set cover', 'hitting set', 'duality'],
      viz(v) {
        const inst = v.select('instance', [{ value: 'g', label: 'graph (vertex cover)' }, { value: 't', label: 'greedy trap' }], 'g');
        const view = v.select('view', [{ value: 'sc', label: 'set cover' }, { value: 'hs', label: 'hitting set' }], 'sc');
        const s1 = v.stage({ x: [0, 10], y: [0, 6.4], axes: false, equal: true, height: 360, weight: 1.1, title: 'instance' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 1, title: 'incidence matrix' });
        // graph instance
        const GN = 8, GE = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [0, 4], [1, 5], [2, 6]];
        const gpos = Array.from({ length: GN }, (_, i) => [5 + 2.4 * Math.cos(Math.PI / 2 - (2 * Math.PI * i) / GN), 3.4 + 2.5 * Math.sin(Math.PI / 2 - (2 * Math.PI * i) / GN)]);
        // trap instance: columns 0..6, top/bottom rows
        const TE = []; for (let c = 0; c < 7; c++) { TE.push([c, 1]); TE.push([c, 0]); } // element index 2c (top), 2c+1 (bottom)
        const setOf = (cols, rows) => { const r = []; cols.forEach((c) => rows.forEach((row) => r.push(2 * c + (row === 'top' ? 0 : 1)))); return r; };
        const TS = [
          { name: 'B₈', el: setOf([0, 1, 2, 3], ['top', 'bottom']) }, { name: 'B₄', el: setOf([4, 5], ['top', 'bottom']) }, { name: 'B₂', el: setOf([6], ['top', 'bottom']) },
          { name: 'top row', el: setOf([0, 1, 2, 3, 4, 5, 6], ['top']) }, { name: 'bottom row', el: setOf([0, 1, 2, 3, 4, 5, 6], ['bottom']) },
        ];
        const picked = new Set(); let curI = '';
        const model = () => {
          if (inst.value === 'g') return { sets: Array.from({ length: GN }, (_, v2) => ({ name: String(v2 + 1), el: GE.map((e, j) => (e.includes(v2) ? j : -1)).filter((j) => j >= 0) })), nU: GE.length };
          return { sets: TS, nU: 14 };
        };
        const optimum = (M) => {
          let best = 1e9, bm = 0; const n = M.sets.length;
          for (let m = 0; m < (1 << n); m++) { if (popc(m) >= best) continue; const cov = new Set(); M.sets.forEach((q, i) => { if ((m >> i) & 1) q.el.forEach((e) => cov.add(e)); }); if (cov.size === M.nU) { best = popc(m); bm = m; } }
          return { size: best, mask: bm };
        };
        const greedy = (M) => { const cov = new Set(), ch = []; while (cov.size < M.nU) { let bi = -1, bc = -1; M.sets.forEach((q, i) => { if (ch.includes(i)) return; const c = q.el.filter((e) => !cov.has(e)).length; if (c > bc) { bc = c; bi = i; } }); if (bc <= 0) break; ch.push(bi); M.sets[bi].el.forEach((e) => cov.add(e)); } return ch; };
        s1.onClick((x, y) => {
          if (inst.value === 'g') { let bi = -1, bd = 0.55; gpos.forEach(([px, py], i) => { const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; bi = i; } }); if (bi >= 0) { if (picked.has(bi)) picked.delete(bi); else picked.add(bi); } }
          else { const i = Math.floor((x - 0.3) / 1.9); if (y < 1.4 && i >= 0 && i < 5 && x - 0.3 - i * 1.9 < 1.7) { if (picked.has(i)) picked.delete(i); else picked.add(i); } }
        });
        v.button('Greedy', () => { const M = model(); picked.clear(); greedy(M).forEach((i) => picked.add(i)); });
        v.button('Show an optimum', () => { const M = model(), o = optimum(M); picked.clear(); M.sets.forEach((_, i) => { if ((o.mask >> i) & 1) picked.add(i); }); });
        v.button('Clear', () => picked.clear());
        let st = {};
        v.render(() => {
          if (curI !== inst.value) { curI = inst.value; picked.clear(); const M0 = model(), o0 = optimum(M0); let first = true; M0.sets.forEach((_, i) => { if ((o0.mask >> i) & 1) { if (first) first = false; else picked.add(i); } }); }
          const M = model(), cov = new Map(); picked.forEach((i) => M.sets[i].el.forEach((e) => cov.set(e, (cov.get(e) || 0) + 1)));
          const unc = M.nU - cov.size;
          if (inst.value === 'g') {
            s1.setView([0, 10], [0, 6.8]);
            GE.forEach(([a, b], j) => { const c = cov.has(j); s1.line(gpos[a][0], gpos[a][1], gpos[b][0], gpos[b][1], { color: c ? 'green' : 'red', width: c ? 3 : 3.4, alpha: c ? 0.9 : 0.9, dash: !c }); });
            gpos.forEach(([x, y], i) => { const p = picked.has(i); s1.dot(x, y, { r: 14, color: p ? 'accent' : 'muted', hollow: !p }); s1.text(String(i + 1), x, y, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: p ? 'panel' : 'ink', halo: false }); });
            s1.corner('red dashed edge = not yet covered', 'tl', { color: 'red' });
          } else {
            s1.setView([0, 10], [0, 6.8]);
            TE.forEach(([c, top], e) => { const x = 1.1 + c * 1.3, y = top ? 5.0 : 3.4, n = cov.get(e) || 0; s1.dot(x, y, { r: 11, color: n ? 'green' : 'red', hollow: !n }); if (n > 1) s1.text(`×${n}`, x + 0.45, y + 0.4, { size: 10, color: 'muted', halo: false }); });
            TS.forEach((q, i) => {
              const x0 = 0.3 + i * 1.9, p = picked.has(i);
              s1.rect(x0, 0.2, x0 + 1.7, 1.2, { fill: p ? 'accent' : 'faint', fillAlpha: p ? 0.4 : 0.12, color: p ? 'accent' : 'muted', width: p ? 2.5 : 1.2, radius: 6 });
              s1.text(`${q.name}`, x0 + 0.85, 0.85, { align: 'center', size: 12, weight: 700, halo: false }); s1.text(`${q.el.length} elements`, x0 + 0.85, 0.45, { align: 'center', size: 10, color: 'muted', halo: false });
            });
            s1.text('universe: 14 elements (green = covered)', 0.4, 6.2, { size: 12, color: 'muted' });
          }
          // matrix
          const T = view.value === 'hs', rows = T ? M.nU : M.sets.length, cols = T ? M.sets.length : M.nU;
          s2.setView([-1.6, cols + 0.2], [-0.2, rows + 1.2]);
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const si = T ? c : r, ei = T ? r : c, inS = M.sets[si].el.includes(ei), pk = picked.has(si);
            const y = rows - 1 - r;
            if (inS) s2.rect(c + 0.08, y + 0.08, c + 0.92, y + 0.92, { fill: pk ? 'accent' : 'ink', fillAlpha: pk ? 0.75 : 0.25, stroke: false });
            else s2.rect(c + 0.3, y + 0.3, c + 0.7, y + 0.7, { fill: 'faint', fillAlpha: 0.15, stroke: false });
          }
          // headers
          for (let r = 0; r < rows; r++) { const y = rows - 1 - r; const lab = T ? (inst.value === 'g' ? `${GE[r][0] + 1}–${GE[r][1] + 1}` : `e${r + 1}`) : M.sets[r].name; const ok = T ? (cov.has(r)) : picked.has(r); s2.text(lab, -0.15, y + 0.5, { align: 'right', baseline: 'middle', size: 10.5, color: T ? (ok ? 'green' : 'red') : (ok ? 'accent' : 'muted'), weight: ok ? 700 : 500, halo: false }); }
          for (let c = 0; c < cols; c++) { const lab = T ? M.sets[c].name : (inst.value === 'g' ? `${GE[c][0] + 1}${GE[c][1] + 1}` : `${c + 1}`); const ok = T ? picked.has(c) : cov.has(c); s2.text(lab, c + 0.5, rows + 0.5, { align: 'center', size: 9.5, color: T ? (ok ? 'accent' : 'muted') : (ok ? 'green' : 'red'), weight: 700, halo: false }); }
          s2.setTitle(T ? 'incidence matrix — rows: sets to hit, columns: elements to pick' : 'incidence matrix — rows: sets to pick, columns: elements to cover');
          st = { unc, k: picked.size, M };
        });
        v.legend([['accent', 'chosen', { dot: true }], ['green', 'covered / hit', { dot: true }], ['red', 'not yet covered / hit', { dot: true }]]);
        v.readout(() => {
          const M = st.M, o = optimum(M), g = greedy(M).length, hs = view.value === 'hs';
          const word = hs ? 'hitting set' : 'cover';
          return `your ${word}: **${st.k}** ${hs ? 'elements' : 'sets'} · ${hs ? 'sets not hit' : 'elements uncovered'}: **${st.unc}** ${st.unc === 0 ? '→ **valid**' : ''} · optimum: **${o.size}** · greedy: **${g}**${g > o.size ? ' (greedy is not optimal here)' : ''}`
            + (inst.value === 'g' ? `\nVERTEX-COVER ↔ SET-COVER: the graph has ${GE.length} edges (the universe) and ${GN} vertices (the sets); a vertex cover of size $k$ is exactly a set cover of size $k$ — min vertex cover $=${o.size}$.` : '\nGreedy grabs the biggest block first and ends up with one set too many; the two rows are the optimum. Ratios like this grow like $\\ln n$ on larger instances.');
        });
      },
    },
  ],
};
