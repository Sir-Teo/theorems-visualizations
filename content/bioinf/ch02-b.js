// Bioinformatics Algorithms — Chapter 2, part b: local alignment, affine gaps, fitting and overlap (items 2.6–2.8)
import {
  PROT, scoreFn, align, alnScore, linPtrs, fmtN, cleanSeq, drawAln, drawDPRaster,
} from './ch02.shared.js';

const findMotif = (id, motif, before, after) => { const q = PROT[id].seq, k = q.indexOf(motif); return q.slice(Math.max(0, k - before), k + motif.length + after); };

export default {
  collection: 'bioinf',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Algorithm',
      name: 'Smith–Waterman local alignment',
      statement: String.raw`A **local alignment** of $s$ and $t$ is a global alignment of some substring of $s$ with some substring of $t$. With a substitution score that is negative on average (so that long random matches lose points), the best local alignment score is $\max_{i,j}F(i,j)$ where $F(i,0)=F(0,j)=0$ and
$$F(i,j)=\max\{0,\ F(i-1,j-1)+\sigma(s_i,t_j),\ F(i-1,j)-d,\ F(i,j-1)-d\}.$$
The traceback starts at the maximal cell and stops when it reaches a cell with value $0$. Time and space are $O(nm)$. If $\sigma$ has non-negative expected value, local alignments degenerate into whole-sequence ones.`,
      idea: String.raw`Allowing a free restart (the $0$) lets the optimal path begin anywhere, and the starting point of the best segment is wherever the running score last dropped to zero; ending at the table's maximum chooses where to stop. Everything else is Needleman–Wunsch (item 2.5), so the table is the same DAG with extra zero-weight edges from the source to every vertex and from every vertex to the sink. The requirement of a negative expected score is what makes the zeros happen at all, and is the reason local scores obey an extreme-value law (chapter 3).`,
      caption: String.raw`Pick a pair of real protein segments (UniProt) or two unrelated ones; the table is shaded by cell value, the best local path is green, and the alignment is drawn beneath. Switch to *global* to see what forcing the whole sequences together costs. Long examples are drawn as heat maps (bright = high score) with the optimal local path overlaid. With the gap cost very low or the matrix set to match = 0, watch the local alignment spread out.`,
      scope: String.raw`Requires a score with negative expected value for random pairs (BLOSUM62 has expectation $-0.52$ bits per half-bit unit, see the NCBI header); otherwise the optimum is the whole sequence.`,
      credit: 'Smith & Waterman, 1981',
      deps: ['bioinf-2.5'],
      refs: ['Durbin ch. 2'],
      tags: ['alignment', 'local alignment', 'dynamic programming'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm' },
      viz(v) {
        const EX = {
          site: { s: PROT.HBA_HUMAN.seq.slice(0, 4) + findMotif('THIO_ECOLI', 'WCGPC', 4, 4) + PROT.LYSC_CHICK.seq.slice(0, 3), t: PROT.CYC_HORSE.seq.slice(0, 4) + findMotif('THIO_HUMAN', 'WCGPC', 4, 4) + PROT.HBB_HUMAN.seq.slice(0, 3), note: 'planted island: the thioredoxin active-site segments of E. coli (P0AA25) and human (P10599), each flanked by unrelated residues from other proteins' },
          unrel: { s: PROT.HBA_HUMAN.seq.slice(0, 15), t: PROT.LYSC_CHICK.seq.slice(0, 15), note: 'human α-globin and hen lysozyme starts (P69905, P00698): unrelated' },
          trx: { s: PROT.THIO_ECOLI.seq, t: PROT.THIO_HUMAN.seq, note: 'thioredoxin, E. coli (P0AA25) against human (P10599)' },
          lyz: { s: PROT.LYSC_CHICK.seq, t: PROT.LALBA_HUMAN.seq, note: 'hen lysozyme (P00698) against human α-lactalbumin (P00709): distant homologues' },
          hbmb: { s: PROT.HBA_HUMAN.seq, t: PROT.CYC1_YEAST.seq, note: 'human α-globin against yeast cytochrome c (P00044): unrelated' },
        };
        const ex = v.select('pair', [{ value: 'site', label: 'planted site' }, { value: 'unrel', label: 'unrelated 15-mers' }, { value: 'trx', label: 'thioredoxins' }, { value: 'lyz', label: 'lysozyme / lactalbumin' }, { value: 'hbmb', label: 'globin / cyt c' }], 'site');
        const mode = v.select('', [{ value: 'local', label: 'local (Smith–Waterman)' }, { value: 'global', label: 'global (Needleman–Wunsch)' }], 'local');
        const gp = v.slider('gap cost $d$', 1, 14, 6, { int: true });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 440, title: 'table of scores $F(i,j)$' });
        const sR = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 440, xlabel: 'position in $t$', ylabel: 'position in $s$', title: 'scores $F(i,j)$ as a heat map' });
        const sa = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 160, full: true, title: 'alignment' });
        const T = v.table(sT, { maxCell: 40, size: 12.5 });
        const run = (loc) => {
          const e = EX[ex.value], o = { score: scoreFn('blosum62'), go: gp.value, ge: gp.value, local: loc };
          return { e, o, r: align(e.s, e.t, o) };
        };
        v.render(() => {
          const loc = mode.value === 'local', { e, o, r } = run(loc), n = e.s.length, m = e.t.length, big = n > 18 || m > 18;
          sT.el.style.display = big ? 'none' : ''; sR.el.style.display = big ? '' : 'none';
          const onP = new Set(r.path.map(([i, j]) => i * 1000 + j));
          if (!big) {
            T.draw({
              rows: n + 1, cols: m + 1, rowLabels: ['', ...e.s], colLabels: ['', ...e.t], cornerLabel: '',
              value: (i, j) => r.H[i][j],
              fill: (i, j) => (onP.has(i * 1000 + j) ? ['green', 0.38] : r.H[i][j] > 0 && loc ? ['accent', Math.min(0.3, 0.04 + 0.012 * r.H[i][j])] : null),
              textColor: (i, j) => (loc && r.H[i][j] === 0 ? 'faint' : null), weight: (i, j) => (onP.has(i * 1000 + j) ? 700 : 500),
              highlight: [r.end],
            });
            for (let k = 0; k + 1 < r.path.length; k++) T.arrow(r.path[k + 1], r.path[k], { color: 'green', width: 2.6 });
          } else {
            let hi = 1; for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) if (r.H[i][j] > hi) hi = r.H[i][j];
            const lo = loc ? 0 : Math.min(...r.H.map((row) => Math.min(...row.filter((x) => x > -1e8))));
            sR.setView([0, m + 1], [-(n + 1), 0]);
            const stp = n > 100 ? 20 : 10, yt = []; for (let k = 0; k <= n; k += stp) yt.push([-k, String(k)]); sR.setTicks(null, yt);
            drawDPRaster(v, sR, r.H, lo, hi, `${ex.value}|${gp.value}|${mode.value}|${n}`, { res: 2 });
            sR.path(r.path.map(([i, j]) => [j + 0.5, -(i + 0.5)]), { color: 'green', width: 2.4 });
            sR.dot(r.start[1] + 0.5, -(r.start[0] + 0.5), { r: 5, color: 'green' });
            sR.dot(r.end[1] + 0.5, -(r.end[0] + 0.5), { r: 5, color: 'gold' });
          }
          drawAln(sa, r, o.score, { labels: ['s', 't'] });
        });
        v.readout(() => {
          const { e, o, r } = run(mode.value === 'local'), g = align(e.s, e.t, { ...o, local: false }), l = align(e.s, e.t, { ...o, local: true }), re = alnScore(r.top, r.bot, o);
          return `${e.note}\n${mode.value === 'local' ? `best local segment: $s_{${r.start[0] + 1}..${r.end[0]}}$ with $t_{${r.start[1] + 1}..${r.end[1]}}$, score **${fmtN(r.score)}**, ${r.ident}/${r.len} identical` : `global score **${fmtN(r.score)}**, ${r.ident}/${r.len} identical`} · re-scored: ${fmtN(re)}${re === r.score ? ' ✓' : ' ✗'}\nlocal score ${fmtN(l.score)} (≥ 0 always) · global score ${fmtN(g.score)}${l.score > g.score ? ': local is better than global because it may drop the unrelated flanks' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Algorithm',
      name: 'Affine gap penalties (Gotoh)',
      statement: String.raw`With an **affine** gap cost, a gap of length $k$ costs $g(k)=d_o+(k-1)d_e$ with opening cost $d_o$ larger than extension cost $d_e$, so one long gap is cheaper than several short ones. Gotoh's algorithm keeps three tables: $M(i,j)$ (best score of an alignment of the prefixes ending with $s_i$ aligned to $t_j$), $X(i,j)$ (ending in a gap against $s_i$) and $Y(i,j)$ (ending in a gap against $t_j$):
$$M(i,j)=\max\{M,X,Y\}(i-1,j-1)+\sigma(s_i,t_j),\quad X(i,j)=\max\{M(i-1,j)-d_o,\ X(i-1,j)-d_e,\ Y(i-1,j)-d_o\},$$
and symmetrically for $Y$. The optimum is $\max\{M,X,Y\}(n,m)$, at the same $O(nm)$ cost as the linear-gap algorithm.`,
      idea: String.raw`A linear table cannot tell whether a gap is being opened or extended, and the cost of the next gap position depends on exactly that; adding the state (a three-state automaton on the edit graph) restores the optimal-substructure property. Biologically, an insertion or deletion event removes a whole run of residues at once, so one event should cost less than its length times a per-residue price, and that is what the open/extend split encodes.`,
      caption: String.raw`The sequences are two real stretches of human α- and β-globin (P69905, P68871). Compare the **linear** alignment (every gap position costs $d$) with the **affine** one (open $d_o$, extend $d_e$): with the default values the linear alignment scatters single gaps, the affine one consolidates them. The table selector shows the combined table, or Gotoh's three coupled tables $M$, $X$, $Y$ for the affine model; the green path is the traceback.`,
      credit: 'Gotoh, 1982',
      deps: ['bioinf-2.5'],
      refs: ['Durbin ch. 2'],
      tags: ['alignment', 'gap penalty', 'dynamic programming'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gap_penalty' },
      viz(v) {
        let sq = PROT.HBA_HUMAN.seq.slice(6, 20), tq = PROT.HBB_HUMAN.seq.slice(3, 15);
        const sin = v.input('$s$', sq, { width: 190, onChange: (z) => { sq = cleanSeq(z, 'A-Z', 16) || 'A'; } });
        const tin = v.input('$t$', tq, { width: 190, onChange: (z) => { tq = cleanSeq(z, 'A-Z', 16) || 'A'; } });
        v.button('reset to globin fragments', () => { sq = PROT.HBA_HUMAN.seq.slice(6, 20); tq = PROT.HBB_HUMAN.seq.slice(3, 15); sin.set(sq); tin.set(tq); });
        const dl = v.slider('linear gap cost $d$', 1, 12, 4, { int: true });
        const dO = v.slider('affine open $d_o$', 1, 16, 8, { int: true });
        const dE = v.slider('affine extend $d_e$', 0, 6, 1, { int: true });
        const view = v.select('table', [{ value: 'lin', label: 'linear' }, { value: 'H', label: 'affine: best' }, { value: 'M', label: '$M$' }, { value: 'X', label: '$X$' }, { value: 'Y', label: '$Y$' }], 'H');
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430, title: 'the table' });
        const sL = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 130, full: true, title: 'linear gaps' });
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 130, full: true, title: 'affine gaps' });
        const T = v.table(sT, { maxCell: 42, size: 12 });
        const sc = scoreFn('blosum62');
        const both = () => ({ lin: align(sq, tq, { score: sc, go: dl.value, ge: dl.value }), aff: align(sq, tq, { score: sc, go: dO.value, ge: dE.value }) });
        v.render(() => {
          const { lin, aff } = both(), r = view.value === 'lin' ? lin : aff, n = sq.length, m = tq.length, key = view.value === 'lin' || view.value === 'H' ? 'H' : view.value;
          const onP = new Set(r.path.map(([i, j]) => i * 1000 + j));
          T.draw({
            rows: n + 1, cols: m + 1, rowLabels: ['', ...sq], colLabels: ['', ...tq], cornerLabel: '',
            value: (i, j) => r[key][i][j], format: (x) => fmtN(x),
            fill: (i, j) => (onP.has(i * 1000 + j) ? ['green', 0.3] : r[key][i][j] < -1e8 ? ['grid', 0.4] : null),
            textColor: (i, j) => (r[key][i][j] < -1e8 ? 'faint' : null), size: 11.5,
          });
          for (let k = 0; k + 1 < r.path.length; k++) T.arrow(r.path[k + 1], r.path[k], { color: 'green', width: 2.4 });
          drawAln(sL, lin, sc, { labels: ['s', 't'] });
          drawAln(sA, aff, sc, { labels: ['s', 't'] });
        });
        v.readout(() => {
          const { lin, aff } = both();
          const o1 = { score: sc, go: dl.value, ge: dl.value }, o2 = { score: sc, go: dO.value, ge: dE.value };
          const ok = alnScore(lin.top, lin.bot, o1) === lin.score && alnScore(aff.top, aff.bot, o2) === aff.score;
          return `linear $d=${dl.value}$: score **${fmtN(lin.score)}**, ${lin.gaps} gap positions in **${lin.gapOpens}** gaps   ·   affine $(${dO.value}, ${dE.value})$: score **${fmtN(aff.score)}**, ${aff.gaps} gap positions in **${aff.gapOpens}** gaps${ok ? '  ·  both re-scored from the printed alignments ✓' : ' ✗'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Algorithm',
      name: 'Fitting and overlap alignment',
      statement: String.raw`Changing which parts of the table are free turns the same recurrence into different tasks. **Fitting** a short string $s$ inside a long one $t$: set $F(0,j)=0$ for all $j$ (the match may begin anywhere in $t$) and score the best cell in the last row, $\max_jF(n,j)$ (it may end anywhere), while $s$ must be used completely. **Overlap** of two reads, a suffix of $s$ with a prefix of $t$: set $F(i,0)=0$ for all $i$ and take $\max_jF(n,j)$ in the last row; with both ends free in both strings one obtains the *semi-global* alignment. All variants cost $O(nm)$.`,
      idea: String.raw`Each variant is the edit graph with extra free edges from the source to the cells of a border (a free start) and from cells of another border to the sink (a free end); the longest-path argument is unchanged. Fitting is how a read is placed on a genome; overlap is the edge weight in an overlap-layout assembly graph (compare chapter 5 on assembly), where a suffix of one read must equal a prefix of the next.`,
      caption: String.raw`Choose a task, or build your own by switching the five border switches: *free start in $t$* (top row zero), *free start in $s$* (left column zero), *free end in $t$* (best cell of the last row), *free end in $s$* (best cell of the last column), *floor at 0* (local). Green dashed outlines mark free borders; the green path is the traceback and the gold cell where it ends. Edit the sequences and the three scores.`,
      deps: ['bioinf-2.5'],
      refs: ['Compeau–Pevzner ch. 5', 'Durbin ch. 2'],
      tags: ['alignment', 'fitting alignment', 'overlap alignment'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sequence_alignment' },
      viz(v) {
        const TASK = {
          global: { s: 'GATTACA', t: 'GCATGCT', f: [0, 0, 0, 0, 0], note: 'global: nothing is free' },
          fitting: { s: 'GCGTTCCG', t: 'ACTTGCGATCCGATTA', f: [1, 0, 1, 0, 0], note: 'fitting: a read (rows) placed inside a genome (columns)' },
          overlap: { s: 'GATTACCGTAG', t: 'CCGTAGTTCAG', f: [0, 1, 1, 0, 0], note: 'overlap: a suffix of read 1 (rows) against a prefix of read 2 (columns)' },
          local: { s: 'AATTGACGGATCC', t: 'GCCGACGGATTAA', f: [0, 0, 0, 0, 1], note: 'local: both ends of both strings free' },
        };
        let sq = TASK.fitting.s, tq = TASK.fitting.t;
        const task = v.select('task', [{ value: 'global', label: 'global' }, { value: 'fitting', label: 'fitting' }, { value: 'overlap', label: 'overlap' }, { value: 'local', label: 'local' }], 'fitting', {
          onChange: (k) => { const T0 = TASK[k]; sq = T0.s; tq = T0.t; sin.set(sq); tin.set(tq); [fTop, fLeft, fBot, fRight, fLoc].forEach((c, i) => { c.set ? c.set(!!T0.f[i]) : (c.value = !!T0.f[i]); }); },
        });
        const sin = v.input('$s$ (rows)', sq, { width: 170, onChange: (z) => { sq = cleanSeq(z, 'A-Z', 14) || 'A'; } });
        const tin = v.input('$t$ (columns)', tq, { width: 200, onChange: (z) => { tq = cleanSeq(z, 'A-Z', 18) || 'A'; } });
        const fTop = v.toggle('free start in $t$', true), fLeft = v.toggle('free start in $s$', false), fBot = v.toggle('free end in $t$', true), fRight = v.toggle('free end in $s$', false), fLoc = v.toggle('floor at 0 (local)', false);
        const ma = v.slider('match', 1, 5, 2, { int: true }), mi = v.slider('mismatch', -5, 0, -1, { int: true }), gp = v.slider('gap cost', 0, 6, 2, { int: true });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: 'dynamic-programming table' });
        const sa = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 150, full: true, title: 'alignment found' });
        const T = v.table(st, { maxCell: 40, size: 12.5 });
        const run = () => { const o = { score: scoreFn('simple', ma.value, mi.value), go: gp.value, ge: gp.value, local: fLoc.value, free: { top: fTop.value, left: fLeft.value, bottom: fBot.value, right: fRight.value } }; return { o, r: align(sq, tq, o) }; };
        v.render(() => {
          const { o, r } = run(), n = sq.length, m = tq.length, onP = new Set(r.path.map(([i, j]) => i * 1000 + j));
          T.draw({
            rows: n + 1, cols: m + 1, rowLabels: ['', ...sq], colLabels: ['', ...tq], cornerLabel: '',
            value: (i, j) => r.H[i][j], format: (x) => fmtN(x), size: 11.5,
            fill: (i, j) => (onP.has(i * 1000 + j) ? ['green', 0.38] : null), weight: (i, j) => (onP.has(i * 1000 + j) ? 700 : 500), highlight: [r.end],
          });
          for (let k = 0; k + 1 < r.path.length; k++) T.arrow(r.path[k + 1], r.path[k], { color: 'green', width: 2.4 });
          const fr = o.free;
          if (fr.top || o.local) T.box(0, 0, 0, m, { color: 'green', dash: true, width: 2 });
          if (fr.left || o.local) T.box(0, 0, n, 0, { color: 'green', dash: true, width: 2 });
          if (fr.bottom || o.local) T.box(n, 0, n, m, { color: 'orange', dash: true, width: 2 });
          if (fr.right || o.local) T.box(0, m, n, m, { color: 'orange', dash: true, width: 2 });
          drawAln(sa, r, o.score, { labels: ['s', 't'] });
        });
        v.readout(() => {
          const { o, r } = run(), re = alnScore(r.top, r.bot, o), n = sq.length;
          const used = `$s_{${r.start[0] + 1}..${r.end[0]}}$ against $t_{${r.start[1] + 1}..${r.end[1]}}$`;
          const whole = r.start[0] === 0 && r.end[0] === n ? 'all of $s$ is used' : `only $s_{${r.start[0] + 1}..${r.end[0]}}$ of $s$ is used`;
          return `score **${fmtN(r.score)}** · ${used} · ${whole} · ${r.ident} identities, ${r.gaps} gap positions · re-scored from the alignment: ${fmtN(re)}${re === r.score ? ' ✓' : ' ✗'}`;
        });
      },
    },
  ],
};
