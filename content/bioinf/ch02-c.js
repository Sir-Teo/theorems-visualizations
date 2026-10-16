// Bioinformatics Algorithms — Chapter 2, part c: banding, the twilight zone, and the two founding papers (items 2.10–2.13)
import {
  PROT, homologPairs, B62OPT, scoreFn, align, alnScore, fmtN, cleanSeq, drawAln, drawDPRaster, countsOf,
} from './ch02.shared.js';

// seeded shuffle (the module has no access to v.rng at load time)
function shuffled(str, seed) {
  let a = seed >>> 0; const rnd = () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
  const x = str.split(''); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x.join('');
}

// Needleman & Wunsch's 1970 procedure on the 0/1 identity matrix: every cell receives its identity score plus the best
// score reachable from it (any later cell of the next row or column, paying `gap` for a jump, constant per gap or per residue skipped).
function nw1970(s, t, gap, perResidue) {
  const n = s.length, m = t.length, pen = (k) => (perResidue ? gap * k : gap);
  const M = Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => (s[i] === t[j] ? 1 : 0)));
  const S = Array.from({ length: n }, () => new Float64Array(m)), nx = Array.from({ length: n }, () => Array(m).fill(null));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    let best = 0, to = null;
    if (i + 1 < n && j + 1 < m) {
      for (let k = 0; i + 1 + k < n; k++) { const c = S[i + 1 + k][j + 1] - (k ? pen(k) : 0); if (c > best || (to === null && c >= best)) { best = c; to = [i + 1 + k, j + 1]; } }
      for (let k = 1; j + 1 + k < m; k++) { const c = S[i + 1][j + 1 + k] - pen(k); if (c > best) { best = c; to = [i + 1, j + 1 + k]; } }
    }
    S[i][j] = M[i][j] + best; nx[i][j] = to;
  }
  let bi = 0, bj = 0, bv = -1;
  for (let j = 0; j < m; j++) if (S[0][j] > bv) { bv = S[0][j]; bi = 0; bj = j; }
  for (let i = 1; i < n; i++) if (S[i][0] > bv) { bv = S[i][0]; bi = i; bj = 0; }
  const path = [[bi, bj]]; let cur = nx[bi][bj];
  while (cur) { path.push(cur); cur = nx[cur[0]][cur[1]]; }
  // alignment strings from consecutive path cells
  let top = '', bot = '', ident = 0, gaps = 0;
  for (let k = 0; k < path.length; k++) {
    const [i, j] = path[k];
    if (k > 0) {
      const [pi, pj] = path[k - 1];
      for (let q = pi + 1; q < i; q++) { top += s[q]; bot += '-'; gaps++; }
      for (let q = pj + 1; q < j; q++) { top += '-'; bot += t[q]; gaps++; }
    }
    top += s[i]; bot += t[j]; if (s[i] === t[j]) ident++;
  }
  return { n, m, M, S, path, score: bv, ident, gaps, top, bot };
}

export default {
  collection: 'bioinf',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Algorithm',
      name: 'Banded alignment',
      statement: String.raw`If an optimal alignment of $s$ and $t$ is known to stay within $w$ diagonals of the main one, only the cells $(i,j)$ with $-w+\min(0,m-n)\le j-i\le w+\max(0,m-n)$ need be computed, a band of width $O(w)$, so time and space fall from $O(nm)$ to $O(w\max(n,m))$. The band score is always a lower bound on the optimum (it optimises over fewer paths), and equals the optimum exactly when the optimal path lies inside the band; if not, doubling $w$ until the score stops improving gives the exact optimum in $O(w^*\max(n,m))$ time, where $w^*$ is the smallest sufficient half-width.`,
      idea: String.raw`Cells outside the band are simply treated as $-\infty$ in the recurrence of item 2.5/2.7, i.e. the edit graph is cut down to the paths that stay close to the diagonal. A path that strays $k$ diagonals from the diagonal must contain at least $k$ gap positions, so for sequences that differ by few indels the optimal path cannot go far, and for a gap of length $>w$ the band is guaranteed to miss it.`,
      caption: String.raw`Two real proteins (UniProt) are aligned with BLOSUM62 and gaps $11/1$. The blue band is the set of cells computed; the thick pale gold line is the full optimal path, the green line is the best path inside the band. Narrow the band and watch it hold the exact answer until it is narrower than the optimal path's excursion; then raise $k$: a block of $k$ foreign residues is inserted into $t$ near the start and $k$ residues are deleted further on, so the lengths stay equal but the optimal path must wander $k$ diagonals away and back. The full path leaves the band while the banded answer pays for the missing gaps. (A single long indel would not do: the band is stretched to contain the diagonal from corner to corner.) The readout gives the smallest sufficient $w$.`,
      scope: String.raw`Exact only when the optimal alignment stays inside the band; the band is a heuristic bound for dissimilar sequences or large indels.`,
      deps: ['bioinf-2.5'],
      refs: ['Durbin ch. 2'],
      tags: ['alignment', 'banded dynamic programming', 'heuristics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sequence_alignment' },
      viz(v) {
        const PAIR = {
          hh: { a: 'HBA_HUMAN', b: 'HBA_HORSE', name: 'human and horse α-globin' },
          hc: { a: 'HBA_HUMAN', b: 'HBA_CHICK', name: 'human and chicken α-globin' },
          ab: { a: 'HBA_HUMAN', b: 'HBB_HUMAN', name: 'human α- and β-globin' },
        };
        const pair = v.select('pair', [{ value: 'hh', label: 'α human / horse' }, { value: 'hc', label: 'α human / chicken' }, { value: 'ab', label: 'α / β human' }], 'hh');
        const wS = v.slider('band half-width $w$', 0, 80, 6, { int: true });
        const kS = v.slider('swap in $k$ foreign residues (insertion at 41, deletion at 91)', 0, 60, 14, { int: true });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 440, xlabel: 'position in $t$', ylabel: 'position in $s$', title: 'the DP matrix: band, full path, banded path' });
        const sa = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 160, full: true, title: 'banded alignment (first columns)' });
        const cache = {};
        const inputs = () => {
          const P = PAIR[pair.value], s = PROT[P.a].seq, k = kS.value, t0 = PROT[P.b].seq;
          const t = k ? t0.slice(0, 40) + PROT.LYSC_CHICK.seq.slice(20, 20 + k) + t0.slice(40, 90) + t0.slice(90 + k) : t0;
          return { s, t, P, k };
        };
        const full = (x) => { const key = pair.value + '|' + x.k; return cache[key] || (cache[key] = align(x.s, x.t, B62OPT)); };
        const band = (x, w) => { const n = x.s.length, m = x.t.length; return [Math.min(0, m - n) - w, Math.max(0, m - n) + w]; };
        const needed = (x, f) => { const n = x.s.length, m = x.t.length; let lo = 0, hi = 0; for (const [i, j] of f.path) { lo = Math.min(lo, j - i); hi = Math.max(hi, j - i); } return Math.max(0, Math.min(0, m - n) - lo, hi - Math.max(0, m - n)); };
        v.render(() => {
          const x = inputs(), n = x.s.length, m = x.t.length, f = full(x), bd = band(x, wS.value);
          const b = align(x.s, x.t, { ...B62OPT, band: bd });
          sR.setView([0, m + 1], [-(n + 1), 0]);
          { const yt = []; for (let k = 0; k <= n; k += 20) yt.push([-k, String(k)]); sR.setTicks(null, yt); }
          sR.raster((px, py) => { const j = Math.floor(px), i = Math.floor(-py); if (i < 0 || j < 0 || i > n || j > m) return null; return j - i >= bd[0] && j - i <= bd[1] ? v.rgb('accent').map((c, q) => (q < 3 ? c : 0.35)) : null; }, { res: 2, key: `${pair.value}|${wS.value}|${kS.value}` });
          sR.path(f.path.map(([i, j]) => [j + 0.5, -(i + 0.5)]), { color: 'gold', width: 7, alpha: 0.5 });
          sR.path(b.path.map(([i, j]) => [j + 0.5, -(i + 0.5)]), { color: 'green', width: 2.2 });
          drawAln(sa, b, B62OPT.score, { labels: ['s', 't'] });
        });
        v.readout(() => {
          const x = inputs(), n = x.s.length, m = x.t.length, f = full(x), bd = band(x, wS.value), b = align(x.s, x.t, { ...B62OPT, band: bd });
          let cells = 0; for (let i = 0; i <= n; i++) { const lo = Math.max(0, i + bd[0]), hi = Math.min(m, i + bd[1]); if (hi >= lo) cells += hi - lo + 1; }
          const w = needed(x, f), ok = b.score === f.score, chk = align(x.s, x.t, { ...B62OPT, band: band(x, w) }).score === f.score;
          return `${x.P.name}${x.k ? ` with a ${x.k}-residue insertion and deletion` : ''}: $n=${n}$, $m=${m}$ · band computes **${cells.toLocaleString('en-US')}** of ${((n + 1) * (m + 1)).toLocaleString('en-US')} cells (${v.fix((100 * cells) / ((n + 1) * (m + 1)), 0)}%)\nfull optimum **${f.score}** · banded **${b.score}** ${ok ? '✓ exact' : `✗ short by ${f.score - b.score}`} · identities ${v.fix((100 * f.ident) / f.len, 0)}% · smallest sufficient $w^* = ${w}$ (band $w^*$ gives the optimum: ${chk ? 'yes' : 'no'})`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Phenomenon',
      name: 'The twilight zone of sequence identity',
      statement: String.raw`Two homologous proteins that share more than about 35% identity over a long alignment are almost always recognised as such by pairwise alignment, (the threshold depends on alignment length, Sander & Schneider 1991); but identity between about 20% and 35% (the **twilight zone**; Doolittle 1986, Rost 1999) is also reached by pairs of unrelated sequences, with a probability that grows as the alignment gets shorter, and below it the identity of true homologues and of random alignments overlaps so much that identity alone can no longer decide. Homology is therefore inferred from the significance of the *score* (chapter 3), not from percent identity.`,
      idea: String.raw`Optimal alignment maximises the number of matches, so even shuffled sequences, aligned optimally, show 15–20% identity globally (more over short stretches, since the optimiser then has more freedom per residue); the divergence of true homologues, on the other hand, erodes identity roughly exponentially with evolutionary time while structure persists, so deep homologues drift down into the random range. The local-alignment score of item 2.6 separates the two classes much better than identity does.`,
      caption: String.raw`**Real homologous pairs** (91 pairs within five UniProt families: globins, cytochrome c, lysozyme/α-lactalbumin, serine proteases, thioredoxins) against **shuffled controls** (the same sequences with one of them shuffled, optimally aligned the same way). *Prefix alignments* align the first $L$ residues of both proteins globally (BLOSUM62, gaps 11/1); *local* uses Smith–Waterman on the whole proteins. Drag the identity threshold: the readout counts how many true homologues lie above it and how many shuffles. Hover a point to identify the pair.`,
      scope: String.raw`The cut-offs quoted (20–35%) are the textbook ones for alignments of a few hundred residues; the picture here uses only 91 pairs from five families, so the exact overlap region is indicative.`,
      credit: 'Doolittle, 1986; Sander & Schneider, 1991; Rost, 1999',
      deps: ['bioinf-2.6'],
      refs: ['Durbin ch. 2'],
      tags: ['sequence identity', 'homology', 'twilight zone'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sequence_identity' },
      viz(v) {
        const mode = v.select('alignments', [{ value: 'prefix', label: 'prefixes of length $L$, global' }, { value: 'local', label: 'whole proteins, local' }], 'prefix');
        const thr = v.slider('identity threshold (%)', 5, 60, 25, { int: true });
        const fam = v.select('families', [{ value: 'all', label: 'all' }, { value: 'globin', label: 'globins only' }], 'all');
        const sP = v.stage({ x: [0, 200], y: [0, 100], axes: 'box', gutter: true, height: 400, xlabel: 'alignment length (columns)', ylabel: 'identity (%)', title: 'identity against length', hover: true, minWidth: 340, weight: 1.6 });
        const sH = v.stage({ x: [0, 100], y: [0, 1], axes: 'box', gutter: true, height: 400, xlabel: 'identity (%)', ylabel: 'fraction of pairs', title: 'distribution of identity', minWidth: 260 });
        const cache = {};
        const data = () => {
          const key = mode.value;
          if (cache[key]) return cache[key];
          const pairs = homologPairs(), out = [];
          pairs.forEach((p, idx) => {
            const A = PROT[p.a].seq, B = PROT[p.b].seq;
            if (mode.value === 'local') {
              out.push({ cls: 'h', len: p.len, id: p.id * 100, p });
              for (let r = 0; r < 2; r++) { const q = align(A, shuffled(B, 1000 * idx + r + 1), { ...B62OPT, local: true }); out.push({ cls: 's', len: q.len, id: (100 * q.ident) / q.len, p }); }
            } else {
              const L = 30 + ((idx * 53) % 111), a = A.slice(0, L), b = B.slice(0, L), h = align(a, b, B62OPT);
              out.push({ cls: 'h', len: h.len, id: (100 * h.ident) / h.len, p });
              for (let r = 0; r < 2; r++) { const q = align(a, shuffled(b, 1000 * idx + r + 1), B62OPT); out.push({ cls: 's', len: q.len, id: (100 * q.ident) / q.len, p }); }
            }
          });
          return (cache[key] = out);
        };
        const pick = () => data().filter((d) => fam.value === 'all' || d.p.fam === 'globin');
        let near = null;
        v.render(() => {
          const D = pick(), xmax = mode.value === 'local' ? 160 : 200;
          sP.setView([0, xmax], [0, 100]);
          sP.hband(20, 30, { color: 'orange', alpha: 0.12 });
          sP.hline(thr.value, { color: 'gold', width: 2, dash: true });
          for (const d of D) if (d.cls === 's') sP.dot(d.len, d.id, { r: 3, color: 'red' });
          for (const d of D) if (d.cls === 'h') sP.dot(d.len, d.id, { r: 3.6, color: 'accent' });
          sP.text('twilight zone 20–30%', xmax - 3, 25, { align: 'right', baseline: 'middle', size: 11.5, color: 'orange' });
          near = null; const ptr = sP.pointer;
          if (ptr && ptr.inside) { let bd = 14; for (const d of D) { const dd = Math.hypot(sP.X(d.len) - sP.X(ptr.x), sP.Y(d.id) - sP.Y(ptr.y)); if (dd < bd) { bd = dd; near = d; } } }
          if (near) sP.dot(near.len, near.id, { r: 8, hollow: true, color: 'gold' });
          const hs = D.filter((d) => d.cls === 'h').map((d) => d.id), ss = D.filter((d) => d.cls === 's').map((d) => d.id), bins = 20;
          const dens = (xs) => { const c = Array(bins).fill(0); xs.forEach((x) => { c[Math.min(bins - 1, Math.floor(x / (100 / bins)))]++; }); return c.map((q) => q / Math.max(1, xs.length)); };
          const dh = dens(hs), ds = dens(ss), mx = Math.max(...dh, ...ds, 0.1);
          sH.setView([0, 100], [0, mx * 1.1]);
          sH.hist({ edges: Array.from({ length: bins + 1 }, (_, i) => i * (100 / bins)), counts: ds }, { color: 'red', fillAlpha: 0.3 });
          sH.hist({ edges: Array.from({ length: bins + 1 }, (_, i) => i * (100 / bins)), counts: dh }, { color: 'accent', fillAlpha: 0.3 });
          sH.vline(thr.value, { color: 'gold', width: 2, dash: true });
        });
        v.legend([['accent', 'true homologues', { dot: true }], ['red', 'shuffled controls', { dot: true }], ['orange', 'twilight zone', { area: true }]]);
        v.readout(() => {
          const D = pick(), h = D.filter((d) => d.cls === 'h'), s = D.filter((d) => d.cls === 's'), T = thr.value;
          const ah = h.filter((d) => d.id >= T).length, as = s.filter((d) => d.id >= T).length;
          let line = `identity ≥ ${T}%: **${ah}** of ${h.length} homologue pairs (${v.fix((100 * ah) / h.length, 0)}%) and **${as}** of ${s.length} shuffled controls (${v.fix((100 * as) / s.length, 0)}%)  ·  highest shuffled identity ${v.fix(Math.max(...s.map((d) => d.id)), 0)}%`;
          if (near) line += `\n${PROT[near.p.a].name} vs ${PROT[near.p.b].name}${near.cls === 's' ? ' (second sequence shuffled)' : ''}: ${v.fix(near.id, 0)}% over ${near.len} columns`;
          return line;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Paper',
      name: 'A General Method for Similarities in Two Protein Sequences',
      paper: {
        authors: 'Saul B. Needleman and Christian D. Wunsch', year: 1970,
        title: 'A general method applicable to the search for similarities in the amino acid sequence of two proteins',
        venue: 'Journal of Molecular Biology 48 (3): 443–453', doi: '10.1016/0022-2836(70)90057-4',
      },
      introduces: ['bioinf-2.5'],
      statement: String.raw`The paper showed that the question "how similar are two protein sequences, allowing for insertions and deletions?" has a systematic answer: lay the sequences along the sides of a matrix, mark with $1$ every cell where the two residues are identical, and let every cell accumulate the best total reachable from it by a path that moves strictly down and to the right, where a jump over $k$ skipped residues costs a gap penalty. The path with the highest total, found by filling the matrix from the far corner toward the origin, is the maximum-match alignment, and the same figure serves as a measure of similarity that can be compared against randomised sequences. This is the first dynamic-programming sequence comparison in biology.`,
      idea: String.raw`Before it, sequences were compared by eye or by diagonal dot-plots, which handle substitutions but not insertions. The paper's insight is that the best alignment of the tails depends only on the best alignments of shorter tails, so the matrix can be filled once, in time proportional to $n\,m$ times the cost of the best jump (the paper's version let a gap be of any length, hence a cubic worst case; today's linear-gap recursion of item 2.5 gets quadratic time). It introduced the idea of scoring an alignment as identities minus gap penalties and of judging significance against shuffled sequences, the seed of chapter 3.`,
      caption: String.raw`The left panel is the paper's starting matrix (a cell is filled where the two residues are identical); the right panel is the matrix after the accumulation, each cell showing the best total of identities minus gap penalties from there onward, and the traced pathway is outlined. The sequences are the opening residues of human α- and β-globin (UniProt P69905, P68871), not the paper's own data. Choose a gap penalty per gap or per skipped residue; switch to the *whole chains* view for 141 × 146 residues. The readout sets the 1970-style score beside today's BLOSUM62/affine Needleman–Wunsch alignment of the same pair.`,
      credit: 'Needleman & Wunsch, 1970',
      deps: ['bioinf-2.1', 'algo-7.2'],
      refs: [],
      tags: ['paper', 'alignment', 'dynamic programming'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm', doi: 'https://doi.org/10.1016/0022-2836(70)90057-4' },
      viz(v) {
        const size = v.select('sequences', [{ value: 'seg', label: 'first 15 residues' }, { value: 'full', label: 'whole chains' }], 'seg');
        const gm = v.select('gap penalty', [{ value: 'gap', label: 'per gap' }, { value: 'res', label: 'per skipped residue' }], 'gap');
        const gp = v.slider('penalty', 0, 5, 1, { step: 0.5 });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, title: 'identity matrix (1 where residues agree)', minWidth: 300 });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, title: 'matrix after accumulation', minWidth: 300 });
        const sa = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true, title: 'maximum-match alignment' });
        const TL = v.table(sL, { maxCell: 36, size: 12.5 }), TR = v.table(sR, { maxCell: 36, size: 12 });
        const seqs = () => (size.value === 'seg' ? [PROT.HBA_HUMAN.seq.slice(0, 15), PROT.HBB_HUMAN.seq.slice(0, 15)] : [PROT.HBA_HUMAN.seq, PROT.HBB_HUMAN.seq]);
        const cache = {};
        const run = () => { const [s, t] = seqs(), k = `${size.value}|${gm.value}|${gp.value}`; return cache[k] || (cache[k] = nw1970(s, t, gp.value, gm.value === 'res')); };
        v.render(() => {
          const [s, t] = seqs(), r = run(), n = s.length, m = t.length, onP = new Set(r.path.map(([i, j]) => i * 1000 + j));
          const big = size.value === 'full';
          sL.setTitle('identity matrix (1 where residues agree)'); sR.setTitle('matrix after accumulation');
          if (!big) {
            TL.draw({ rows: n, cols: m, rowLabels: [...s], colLabels: [...t], value: (i, j) => (r.M[i][j] ? 1 : ''), fill: (i, j) => (onP.has(i * 1000 + j) ? ['green', 0.4] : r.M[i][j] ? ['accent', 0.2] : null) });
            let hi = 1; for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) hi = Math.max(hi, r.S[i][j]);
            TR.draw({ rows: n, cols: m, rowLabels: [...s], colLabels: [...t], value: (i, j) => r.S[i][j], format: (x) => String(Math.round(x * 10) / 10).replace('-', '−'), fill: (i, j) => (onP.has(i * 1000 + j) ? ['green', 0.4] : ['accent', 0.05 + 0.3 * r.S[i][j] / hi]), size: 11 });
            for (let k = 0; k + 1 < r.path.length; k++) TR.arrow(r.path[k], r.path[k + 1], { color: 'green', width: 2.4 });
          } else {
            let hi = 1; for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) hi = Math.max(hi, r.S[i][j]);
            for (const [st, f, key] of [[sL, (i, j) => (r.M[i][j] ? 1 : 0), 'L'], [sR, (i, j) => r.S[i][j] / hi, 'R']]) {
              st.setView([0, m], [-n, 0]);
              st.raster((x, y) => { const j = Math.floor(x), i = Math.floor(-y); if (i < 0 || j < 0 || i >= n || j >= m) return null; return v.ramp(f(i, j), 'accent'); }, { res: 2, key: `${key}|${gm.value}|${gp.value}` });
              st.path(r.path.map(([i, j]) => [j + 0.5, -(i + 0.5)]), { color: 'green', width: 2.2 });
            }
          }
          drawAln(sa, r, (a, b) => (a === b ? 1 : 0), { labels: ['α', 'β'] });
        });
        v.readout(() => {
          const [s, t] = seqs(), r = run(), modern = align(s, t, B62OPT), c = countsOf({ top: r.top, bot: r.bot });
          const score = r.ident - (gm.value === 'res' ? gp.value * r.gaps : gp.value * c.opens);
          return `1970-style pathway: **${r.ident}** identities, ${r.gaps} gap positions in ${c.opens} gaps → score $${r.ident} - ${v.fix(r.ident - score, 1)} = ${v.fix(score, 1)}$ (matrix maximum ${v.fix(r.score, 1)})\ntoday's global alignment of the same pair (BLOSUM62, gaps 11/1): score **${modern.score}**, ${modern.ident} identities in ${modern.len} columns = ${v.fix((100 * modern.ident) / modern.len, 0)}%`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Paper',
      name: 'Identification of Common Molecular Subsequences',
      paper: {
        authors: 'T. F. Smith and M. S. Waterman', year: 1981, title: 'Identification of common molecular subsequences',
        venue: 'Journal of Molecular Biology 147 (1): 195–197', doi: '10.1016/0022-2836(81)90087-5',
      },
      introduces: ['bioinf-2.6'],
      statement: String.raw`The paper gave an exact algorithm for the pair of segments, one from each of two sequences, whose similarity is highest. Define $H_{i0}=H_{0j}=0$ and
$$H_{ij}=\max\{0,\ H_{i-1,j-1}+s(a_i,b_j),\ \max_{k\ge1}(H_{i-k,j}-W_k),\ \max_{l\ge1}(H_{i,j-l}-W_l)\},$$
with a similarity $s$ that is positive for matches and negative for mismatches, and a gap weight $W_k$ that grows with the gap length $k$. The maximum of $H$ is the score of the best local alignment, and tracing back from it to the first $0$ gives the segments. The weights $W_k$ are non-negative and increase with the gap length $k$, and the average of $s$ over random pairs is negative.`,
      idea: String.raw`Needleman and Wunsch's matrix (item 2.12) finds the best alignment of whole sequences; to find the best matching *region* a single change suffices: let the running score restart at zero whenever it would become negative, which forgets a bad prefix. The cells with positive value are then the places where some segment currently scores well, and the global maximum is the best segment. The paper's contribution is exactly this observation together with the proof that the traceback yields the optimum; it made database search for domains and motifs inside unrelated proteins possible, and every later local method, BLAST included, is its heuristic descendant.`,
      caption: String.raw`The example is two short RNA strings, AAUGCCAUUGACGG and CAGCCUCGCUUAG, the pair usually shown with this paper, with similarity $+1$ for a match, $-\tfrac13$ for a mismatch and gap weight $1+\tfrac k3$; numbers are shown in units of $\tfrac13$ so they stay whole. The zero-floored table isolates the matching island (green path). Switch the table to **global** (no floor) and compare the two alignments and scores; change the mismatch and gap weights to see the island grow or shrink.`,
      credit: 'Smith & Waterman, 1981',
      deps: ['bioinf-2.5', 'bioinf-2.4'],
      refs: [],
      tags: ['paper', 'local alignment', 'dynamic programming'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm', doi: 'https://doi.org/10.1016/0022-2836(81)90087-5' },
      viz(v) {
        let sq = 'AAUGCCAUUGACGG', tq = 'CAGCCUCGCUUAG';
        const sin = v.input('$a$', sq, { width: 190, onChange: (z) => { sq = cleanSeq(z, 'ACGU', 16) || 'A'; } });
        const tin = v.input('$b$', tq, { width: 170, onChange: (z) => { tq = cleanSeq(z, 'ACGU', 16) || 'A'; } });
        const view = v.select('table', [{ value: 'local', label: 'local (floored at 0)' }, { value: 'global', label: 'global (no floor)' }], 'local');
        const mi = v.slider('mismatch (units of 1/3)', -6, 0, -1, { int: true });
        const w1 = v.slider('gap weight $W_1$ (units of 1/3)', 1, 9, 4, { int: true });
        const dl = v.slider('extra per further gap position $\\delta$', 0, 4, 1, { int: true });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 440, title: 'table $H_{ij}$ (units of 1/3)' });
        const sg = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 120, full: true, title: 'local alignment' });
        const sb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 120, full: true, title: 'global alignment of the same pair' });
        const T = v.table(sT, { maxCell: 42, size: 12 });
        const opt = (loc) => ({ score: scoreFn('simple', 3, mi.value), go: w1.value, ge: dl.value, local: loc });
        v.render(() => {
          const loc = view.value === 'local', o = opt(loc), r = align(sq, tq, o), n = sq.length, m = tq.length, onP = new Set(r.path.map(([i, j]) => i * 1000 + j));
          T.draw({
            rows: n + 1, cols: m + 1, rowLabels: ['', ...sq], colLabels: ['', ...tq], cornerLabel: '', size: 11.5,
            value: (i, j) => r.H[i][j], format: (x) => fmtN(x),
            fill: (i, j) => (onP.has(i * 1000 + j) ? ['green', 0.4] : loc && r.H[i][j] > 0 ? ['accent', Math.min(0.3, 0.05 + 0.03 * r.H[i][j])] : null),
            textColor: (i, j) => (loc && r.H[i][j] === 0 ? 'faint' : null), weight: (i, j) => (onP.has(i * 1000 + j) ? 700 : 500), highlight: [r.end],
          });
          for (let k = 0; k + 1 < r.path.length; k++) T.arrow(r.path[k + 1], r.path[k], { color: 'green', width: 2.4 });
          const l = align(sq, tq, opt(true)), g = align(sq, tq, opt(false));
          drawAln(sg, l, o.score, { labels: ['a', 'b'] }); drawAln(sb, g, o.score, { labels: ['a', 'b'] });
        });
        v.readout(() => {
          const l = align(sq, tq, opt(true)), g = align(sq, tq, opt(false)), o = opt(true), ok = alnScore(l.top, l.bot, o) === l.score && alnScore(g.top, g.bot, opt(false)) === g.score;
          const th = (x) => `${v.fix(x / 3, 2)}`;
          return `local: score **${th(l.score)}** (= ${fmtN(l.score)}/3), segment $a_{${l.start[0] + 1}..${l.end[0]}}$ with $b_{${l.start[1] + 1}..${l.end[1]}}$, ${l.ident} identities in ${l.len} columns\nglobal: score **${th(g.score)}**, ${g.ident} identities in ${g.len} columns  ·  re-scored from the alignments ${ok ? '✓' : '✗'}`;
        });
      },
    },
  ],
};
