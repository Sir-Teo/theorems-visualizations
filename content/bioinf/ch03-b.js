// Bioinformatics Algorithms — Chapter 3, part b: bit scores and E-values, BLAST, spaced seeds, the BLAST paper (items 3.6–3.9)
import {
  AA, PROT, NCBI, B62OPT, align, homologPairs, mkRng, randAA, codes, seqOf, matFlat, swScore, bitScore, rawFromBits, expect,
  neighborMap, neighborsOf, blastSearch, makeDb, SEEDS, seedWeight, randomSeedOfWeight, seedData, seedSensitivity, seedExact, fx,
} from './ch03.shared.js';

const expFmt = (x) => (x >= 0.1 && x < 1000 ? String(+x.toPrecision(2)) : x.toExponential(0).replace('e+', 'e'));
const logSlider = (v, label, lo, hi, val, o = {}) => v.slider(label, lo, hi, val, { log: true, sig: 2, fmt: expFmt, ...o });
const SYS = [
  { k: 'ungapped62', P: NCBI.blosum62, name: 'BLOSUM62, ungapped', color: 'accent' },
  { k: 'gapped62', P: NCBI.gapped62, name: 'BLOSUM62, gaps $11+k$', color: 'green' },
  { k: 'pam250', P: NCBI.pam250, name: 'PAM250, ungapped', color: 'orange' },
  { k: 'blosum45', P: NCBI.blosum45, name: 'BLOSUM45, ungapped', color: 'purple' },
];
const sciTex = (x) => { if (!(x > 0)) return '0'; const e = Math.floor(Math.log10(x)); if (e >= -3 && e <= 3) return String(+x.toPrecision(3)).replace('-', '−'); return `${(x / 10 ** e).toFixed(1)}\\times10^{${String(e).replace('-', '−')}}`; };

// trace of an ungapped X-drop extension along one diagonal, for drawing: arrays of cumulative scores to the right and to the left of the seed word
function traceExt(q, db, S, i0, j0, w, X, pad = 6) {
  const sc = (a, b) => (b > 19 || a > 19 ? -1e6 : S[a * 20 + b]);
  let s0 = 0; for (let k = 0; k < w; k++) s0 += sc(q[i0 + k], db[j0 + k]);
  const side = (dir) => {
    const out = [{ k: 0, cur: s0, best: s0 }]; let cur = s0, best = s0, stop = null, i = dir > 0 ? i0 + w : i0 - 1, j = dir > 0 ? j0 + w : j0 - 1, k = 0;
    while (i >= 0 && i < q.length && j >= 0 && j < db.length && db[j] <= 19) {
      cur += sc(q[i], db[j]); k++; if (cur > best) best = cur;
      out.push({ k, cur, best }); if (stop === null && best - cur >= X) stop = k; if (stop !== null && k >= stop + pad) break;
      i += dir; j += dir;
    }
    return { pts: out, stop };
  };
  return { s0, right: side(1), left: side(-1) };
}

export default {
  collection: 'bioinf',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Concept',
      name: 'Bit scores and E-values',
      statement: String.raw`With Karlin–Altschul parameters $\lambda,K$ for a scoring system, the *bit score* of a raw score $S$ is $S'=(\lambda S-\ln K)/\ln 2$, and the *E-value* of a hit in a search of a query of length $m$ against a database of $N$ residues is $E=K\,mN\,e^{-\lambda S}=mN\,2^{-S'}$, the expected number of random hits scoring at least that much. Bit scores have the same meaning for every matrix and gap cost, and E depends on the database only through $N$: doubling the database doubles $E$. The probability of at least one random hit is $P=1-e^{-E}\approx E$ when $E$ is small.`,
      idea: String.raw`By item 3.4 the number of chance hits scoring at least $S$ is Poisson with mean $Kmn\,e^{-\lambda S}$. Writing $e^{-\lambda S}=2^{-\lambda S/\ln 2}$ and absorbing $K$ gives $mN2^{-S'}$: the bit score is simply the raw score expressed in the unit in which each extra bit halves the expected number of chance hits. A Poisson variable is zero with probability $e^{-E}$, hence the $P$-value. The quoted $\lambda,K$ for gapped scores come from simulation (item 3.5).`,
      caption: String.raw`Left: raw score against bit score for four scoring systems; the horizontal line is the bit score you pick, and each coloured dot is the raw score that earns it in that system (they differ, the bit score does not). Right: the E-value as a function of the bit score for a database of $N$ and of $2N$ residues; the two parallel lines are a factor $2$ apart. Press "double the database" to see $E$ double at a fixed bit score, or "real hit" to place the human β-/α-globin alignment on the scale.`,
      scope: String.raw`Constants are the NCBI BLAST values ($\lambda,K$ for BLOSUM62 ungapped $0.3176/0.134$, gapped with gap cost $11+k$ $0.267/0.041$, PAM250 $0.2252/0.0868$, BLOSUM45 $0.2291/0.0924$); the gapped values are empirical. $E=mN2^{-S'}$ ignores edge effects (BLAST subtracts a length adjustment from $m$ and $N$). "Real hit" is an illustration with the gapped BLOSUM62 constants and a model database size, not a search result.`,
      deps: ['bioinf-3.4'],
      refs: ['Durbin ch. 2'],
      tags: ['bit score', 'E-value', 'statistics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/BLAST_(biotechnology)' },
      viz(v) {
        const bS = v.slider('bit score $S\'$', 0, 140, 30, { step: 0.5 });
        const mS = logSlider(v, 'query length $m$', 30, 3000, 147, { int: true });
        const NS = logSlider(v, 'database size $N$ (residues)', 1e4, 1e10, 1e8);
        v.button('double the database', () => { NS.set(Math.min(1e10, NS.value * 2)); });
        v.button('real hit: human β vs α-globin', () => {
          const sc = swScore(seqOf('HBB_HUMAN'), seqOf('HBA_HUMAN'), matFlat('blosum62'), 12, 1);
          bS.set(Math.round(bitScore(sc, NCBI.gapped62.lambda, NCBI.gapped62.K) * 2) / 2); mS.set(PROT.HBB_HUMAN.seq.length);
        });
        const sA = v.stage({ x: [0, 280], y: [0, 140], axes: 'box', gutter: true, height: 380, xlabel: 'raw score $S$', ylabel: 'bit score $S\'$', title: 'the same bit score, different raw scores', minWidth: 340 });
        const sE = v.stage({ x: [0, 140], y: [1e-40, 1e14], ylog: true, axes: 'box', gutter: true, height: 380, xlabel: 'bit score $S\'$', ylabel: 'E-value', title: 'E-value of a hit', minWidth: 300 });
        let info = null;
        v.render(() => {
          const b = bS.value, m = mS.value, N = NS.value;
          SYS.forEach((s) => sA.fn((x) => bitScore(x, s.P.lambda, s.P.K), { color: s.color, width: 2.2, domain: [0, 280] }));
          sA.hline(b, { color: 'gold', width: 2 });
          const raws = SYS.map((s) => { const r = rawFromBits(b, s.P.lambda, s.P.K); return { s, r }; });
          raws.forEach(({ s, r }, i) => { sA.dot(r, b, { r: 5.5, color: s.color }); sA.text(`${fx(r, 0)}`, r, b + (i % 2 ? -9 : 7), { size: 11.5, color: s.color, align: 'center' }); });
          const E1 = m * N * 2 ** -b, E2 = 2 * E1;
          sE.fn((x) => m * N * 2 ** -x, { color: 'accent', width: 2.4, domain: [0, 140] });
          sE.fn((x) => 2 * m * N * 2 ** -x, { color: 'orange', width: 2.4, domain: [0, 140] });
          sE.hline(1, { color: 'muted', dash: true }); sE.hline(1e-3, { color: 'faint', dash: true });
          sE.text('$E=1$', 138, 40, { align: 'right', size: 11.5, color: 'muted' });
          sE.vline(b, { color: 'gold', width: 2 });
          if (E1 > 1e-40 && E1 < 1e14) { sE.dot(b, E1, { r: 5.5, color: 'accent' }); }
          if (E2 > 1e-40 && E2 < 1e14) sE.dot(b, E2, { r: 5.5, color: 'orange' });
          info = { b, m, N, E1, E2, raws };
        });
        v.legend([['gold', 'chosen bit score'], ['accent', '$E$ for $N$'], ['orange', '$E$ for $2N$', {}]]);
        v.readout(() => {
          const { b, m, N, E1, E2, raws } = info, P = -Math.expm1(-E1);
          return `$S'=${fx(b, 1)}$ bits, $m=${m}$, $N=${sciTex(N)}$: $E=${sciTex(E1)}$ · with $2N$ residues $E=${sciTex(E2)}$ (twice as large) · probability of a chance hit $P=1-e^{-E}=${sciTex(P)}$\nraw score needed: ${raws.map(({ s, r }) => `${s.name.replace(/\$/g, '')} **${fx(r, 0)}**`).join(' · ')}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Algorithm',
      name: 'BLAST seed-and-extend',
      statement: String.raw`Given a query and a database, BLAST finds candidate local alignments in three steps. (1) *Seeds:* list all words of length $w$ that score at least $T$ against some word of the query (the neighbourhood), and scan the database for exact occurrences of these words. (2) *Extension:* from each hit (or, in the two-hit variant, from the second of two hits on one diagonal within a window $A$) extend the match in both directions without gaps, stopping when the score has fallen $X$ below its running maximum. (3) *Report* the segment pairs whose score has an E-value below a cut-off. The work is proportional to the database length plus the number of hits, not to the product $nN$ of dynamic programming.`,
      idea: String.raw`A significant local alignment between related sequences usually contains a short stretch of high-scoring pairs, and the Smith–Waterman recursion of item 2.6 spends nearly all its time on cells that contain no such stretch. The neighbourhood makes seed matching robust to conservative substitutions; the X-drop rule is a stopping rule for the walk of item 3.3: by item 3.4 a walk with negative drift almost never climbs back after a drop of $X$, so extension can stop early. The two-hit rule exploits that a true alignment produces several nearby hits on a diagonal while chance hits are isolated. The E-value comes from items 3.4 and 3.6.`,
      caption: String.raw`The database is the other proteins from chapter 2 (plus optional random decoy sequences on the right). Left: the dot plot of query (vertical) against database (horizontal); grey dots are word hits, orange dots the hits that triggered an extension, green bars the reported segment pairs (extensions below the E-value cut-off are not drawn), and the pale gold bands the true Smith–Waterman alignments with $E\le10^{-3}$. Move $T$ (higher means fewer, stricter seeds), $X$, the two-hit switch and the decoy size and watch hits, extensions and the fraction of the true homologues found. Right: the score along the diagonal of one chosen segment pair, with the stopping line $X$ below its maximum.`,
      scope: String.raw`Ungapped extension only (the gapped stage of BLAST is omitted); protein, BLOSUM62, word length $3$. E-values use the ungapped NCBI constants with a length adjustment. The database is tiny and contains close relatives of the query, so absolute counts are only illustrative; decoys are i.i.d. residues, not real proteins.`,
      deps: ['bioinf-3.6', 'bioinf-2.6'],
      refs: ['Durbin ch. 2'],
      tags: ['BLAST', 'heuristics', 'seed and extend'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/BLAST_(biotechnology)' },
      viz(v) {
        const qSel = v.select('query', [{ value: 'HBB_HUMAN', label: 'β-globin' }, { value: 'CYC_HUMAN', label: 'cytochrome c' }, { value: 'LYSC_CHICK', label: 'lysozyme' }, { value: 'TRY1_BOVIN', label: 'trypsin' }], 'HBB_HUMAN');
        const Tt = v.slider('neighbourhood threshold $T$', 7, 18, 11, { int: true });
        const Xs = v.slider('X-drop $X$', 5, 40, 15, { int: true });
        const two = v.toggle('two-hit rule (window 40)', false);
        const dec = v.slider('random decoy residues (thousands)', 0, 40, 0, { int: true });
        const ecut = logSlider(v, 'report E-value $\\le$', 1e-4, 100, 0.01);
        const pick = v.slider('inspect segment pair # (by score)', 1, 14, 7, { int: true });
        const sM = v.stage({ x: [0, 4000], y: [-150, 0], axes: 'box', gutter: true, height: 420, xlabel: 'position in the database', ylabel: 'position in the query', title: 'query against database', minWidth: 400, weight: 1.6 });
        const sT = v.stage({ x: [-40, 40], y: [-5, 60], axes: 'box', gutter: true, height: 420, xlabel: 'offset from the seed word', ylabel: 'running score', title: 'one extension', minWidth: 280 });
        const S = matFlat('blosum62'), P = NCBI.blosum62;
        const worlds = {};
        let decoyAll = null;
        const decoy = () => { if (!decoyAll) { const r = mkRng(4242); decoyAll = []; for (let i = 0; i < 100; i++) decoyAll.push(randAA(r, 400)); } return decoyAll; };
        const world = () => {
          const key = `${qSel.value}|${dec.value}`; if (worlds[key]) return worlds[key];
          const q = seqOf(qSel.value), real = Object.keys(PROT).filter((k) => k !== qSel.value).map((k) => [k, seqOf(k)]);
          const nd = Math.round((dec.value * 1000) / 400), list = real.concat(decoy().slice(0, nd).map((c, i) => [`decoy${i}`, c]));
          const D = makeDb(list), Ntot = D.residues;
          // truth: Smith–Waterman of the query against each real sequence (gapped, NCBI gap convention), kept when E <= 1e-3
          const truth = [];
          real.forEach(([k, c], idx) => {
            const sc = swScore(q, c, S, 12, 1), E = expect(sc, NCBI.gapped62, q.length, Ntot);
            if (E <= 1e-3) { const a = align(PROT[qSel.value].seq, PROT[k].seq, { ...B62OPT, go: 12, ge: 1, local: true }); truth.push({ k, sc, E, start: D.starts[idx].start, end: D.starts[idx].end, path: a.path }); }
          });
          const nbs = {};
          return (worlds[key] = { q, D, Ntot, truth, nbs, n: q.length });
        };
        let info = null;
        v.render(() => {
          const W = world(), { q, D, n, Ntot } = W;
          const nb = W.nbs[Tt.value] || (W.nbs[Tt.value] = neighborMap(q, S, 3, Tt.value));
          const R = blastSearch(q, D.db, nb, S, { w: 3, X: Xs.value, twoHit: two.value });
          const rep = R.hsps.map((h) => ({ ...h, E: expect(h.score, P, n, Ntot) })).sort((a, b) => b.score - a.score);
          const reported = rep.filter((h) => h.E <= ecut.value);
          const sTarget = W.D.starts;
          const inSeq = (h) => sTarget.find((s) => h.j0 >= s.start && h.j0 < s.end);
          // sensitivity: true homologues containing a reported HSP
          let found = 0; for (const t of W.truth) if (reported.some((h) => h.j0 >= t.start && h.j0 < t.end)) found++;
          const isTrue = new Set(W.truth.map((t) => t.k));
          const falseHsps = reported.filter((h) => { const s = inSeq(h); return !s || !isTrue.has(s.name); }).length;
          sM.setView([0, Math.max(500, D.db.length)], [-n - 2, 0]);
          { const yt = []; for (let k = 0; k <= n; k += 50) yt.push([-k, String(k)]); sM.setTicks(null, yt); }
          for (const s of sTarget) if (s.start > 0) sM.vline(s.start - 0.5, { color: 'grid', width: 0.6 });
          if (Ntot > 3800 + 10) sM.rect(sTarget.find((s) => s.name.startsWith('decoy')).start, -n - 2, D.db.length, 0, { fill: 'muted', fillAlpha: 0.07, stroke: false });
          for (const t of W.truth) sM.path(t.path.map(([i, j]) => [t.start + j, -i]), { color: 'gold', width: 7, alpha: 0.45 });
          const ctx = sM.ctx, step = Math.max(1, Math.ceil(R.hits.length / 9000));
          ctx.fillStyle = v.color('muted', 0.55);
          for (let k = 0; k < R.hits.length; k += step) { const h = R.hits[k]; if (!h[2]) ctx.fillRect(sM.X(h[1]) - 0.8, sM.Y(-h[0]) - 0.8, 1.6, 1.6); }
          for (const h of rep) if (h.E <= ecut.value) sM.line(h.j0, -h.i0, h.j1, -h.i1, { color: 'green', width: 3.4 });
          for (let k = 0; k < R.hits.length; k++) { const h = R.hits[k]; if (h[2]) sM.dot(h[1], -h[0], { r: 2, color: 'orange' }); }
          const sel = reported.length ? reported[Math.min(pick.value, reported.length) - 1] : null;
          // trace panel
          if (sel) {
            const tr = traceExt(q, D.db, S, sel.seed[0], sel.seed[1], 3, Xs.value);
            const maxk = Math.max(14, tr.right.pts.length - 1, tr.left.pts.length - 1), top = Math.max(...tr.right.pts.map((p) => p.best), ...tr.left.pts.map((p) => p.best)), bot = Math.min(...tr.right.pts.map((p) => p.cur), ...tr.left.pts.map((p) => p.cur));
            sT.setView([-maxk - 1, maxk + 1], [Math.min(-2, bot - 3), top + 6]);
            for (const [sd, dir] of [[tr.right, 1], [tr.left, -1]]) {
              const pts = sd.pts.map((p) => [dir * p.k, p.cur]), best = sd.pts.map((p) => [dir * p.k, p.best]), thr = sd.pts.map((p) => [dir * p.k, p.best - Xs.value]);
              sT.path(thr, { color: 'red', dash: true, width: 1.6 }); sT.path(best, { color: 'green', width: 1.8, alpha: 0.8 }); sT.path(pts, { color: 'accent', width: 2.4 });
              if (sd.stop !== null) { sT.dot(dir * sd.stop, sd.pts[sd.stop].cur, { r: 6, color: 'red' }); }
            }
            sT.vline(0, { color: 'faint' });
            sT.text('seed word', 1, top + 3, { size: 11.5, color: 'muted' });
            sT.setTitle(`extension of segment pair ${Math.min(pick.value, reported.length)} (score ${sel.score})`);
          } else { sT.setView([-20, 20], [0, 30]); sT.text('no segment pair reported', 0, 15, { align: 'center', size: 13, color: 'muted' }); }
          info = { R, reported, found, nTrue: W.truth.length, falseHsps, n, Ntot, nbs: nb, sel };
        });
        v.legend([['muted', 'word hits', { dot: true }], ['orange', 'hits that extended', { dot: true }], ['green', 'reported segment pair'], ['gold', 'Smith–Waterman alignment', { area: true }]]);
        v.readout(() => {
          const { R, reported, found, nTrue, falseHsps, n, Ntot, nbs } = info, full = n * Ntot, touched = R.cells + R.nHits + Ntot;
          return `${nbs.nWords.toLocaleString('en-US')} neighbourhood words · **${R.nHits.toLocaleString('en-US')}** word hits → **${R.nExt.toLocaleString('en-US')}** extensions → **${reported.length}** reported segment pairs${reported.length ? ` (top score ${reported[0].score}, $E=${sciTex(reported[0].E)}$)` : ''}\ntrue homologues ($E\\le10^{-3}$ by Smith–Waterman) found: **${found} of ${nTrue}** · reported pairs outside homologues: ${falseHsps} · operations ≈ ${touched.toLocaleString('en-US')} against ${full.toLocaleString('en-US')} dynamic-programming cells (${fx((100 * touched) / full, 1)}%)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Concept',
      name: 'Spaced seeds and search sensitivity',
      statement: String.raw`A *seed* is a pattern of $1$s and $0$s; a hit is a place where the two sequences agree at every position marked $1$ (the $0$s are "don't care"). A contiguous seed and a spaced seed of the same weight $w$ have exactly the same chance $4^{-w}$ of a hit at any valid placement between unrelated uniform DNA. On homologous regions with independent per-position similarity $p$, a well-chosen spaced seed can have a *higher probability of at least one hit* by reducing clusters of overlapping hits. This is not a guarantee for every spaced pattern. For example, in a region of length $64$ with $p=0.7$ the contiguous weight-$11$ seed hits with probability $0.30$ and the spaced seed $111010010100110111$ with probability $0.47$.`,
      idea: String.raw`A weight-$w$ seed of span $s$ has expected hit count $\max(0,L-s+1)p^w$ in a region of length $L$, by linearity of expectation. Equal weights give equal per-placement probabilities, but longer seeds have fewer valid placements. Here the contiguous seed has mean $54(0.7)^{11}\approx1.068$, while the span-18 seed has mean $47(0.7)^{11}\approx0.929$. Despite that lower mean, the spaced seed reaches more regions: its hits cluster less than the contiguous seed's runs of overlapping hits. The hit probability is computed exactly by dynamic programming over the last $s-1$ match bits. Seeds are the first step of the algorithm of item 3.7.`,
      caption: String.raw`Click the cells of the template to switch positions on and off, or use the presets; the comparison seed is always the contiguous seed of the same weight. The sample strip is one random alignment region (green = match, red = mismatch) with the placements where each seed hits. Drag $p$ and the length; the right curves show the probability that at least one hit occurs, from 4000 simulated regions, while the readout gives the exact values from dynamic programming. "Random seed" draws a spaced pattern of the same weight and shows that most random patterns are not the best.`,
      scope: String.raw`Model: independent positions each matching with probability $p$ (a simple model; real alignments have correlated conservation). Unrelated DNA is taken as uniform four-letter sequences. The numbers $0.30$ and $0.47$ for $p=0.7$, length $64$ are the ones reported by the PatternHunter authors (0.466 for the spaced seed), and the exact dynamic programme below reproduces them.`,
      credit: 'Ma, Tromp & Li, 2002 (PatternHunter)',
      deps: ['bioinf-3.7', 'prob-1.6.1'],
      refs: ['Durbin ch. 2'],
      tags: ['spaced seeds', 'PatternHunter', 'sensitivity'],
      links: { doi: 'https://doi.org/10.1093/bioinformatics/18.3.440', wikipedia: 'https://en.wikipedia.org/wiki/Spaced_seed' },
      viz(v) {
        const SPAN = 20;
        let pat = SEEDS.patternhunter.padEnd(SPAN, '0'), rseed = 1, sample = 1;
        const pS = v.slider('similarity $p$', 0.3, 1, 0.7, { step: 0.01 });
        const lS = v.slider('region length', 32, 128, 64, { int: true, step: 4 });
        v.button('contiguous 11', () => { pat = SEEDS.contiguous.padEnd(SPAN, '0'); });
        v.button('PatternHunter', () => { pat = SEEDS.patternhunter.padEnd(SPAN, '0'); });
        v.button('random seed of same weight', () => { pat = randomSeedOfWeight(seedWeight(pat), rseed++ * 7919 + 3).padEnd(SPAN, '0'); });
        v.button('new region', () => { sample++; });
        const sE = v.stage({ x: [0, SPAN], y: [0, 1], axes: false, height: 110, full: true, title: 'seed template (click to toggle)' });
        const sS = v.stage({ x: [-15, 65], y: [0, 5], axes: false, height: 190, full: true, title: 'one alignment region and the seeds that hit it' });
        const sC = v.stage({ x: [0.3, 1], y: [0, 1], axes: 'box', gutter: true, height: 380, xlabel: 'similarity $p$', ylabel: 'probability of at least one hit', title: 'sensitivity of the two seeds', minWidth: 380 });
        const D = seedData(11, 4000, 128), cache = {};
        const trimmed = () => { const a = pat.indexOf('1'), b = pat.lastIndexOf('1'); return a < 0 ? '1' : pat.slice(a, b + 1); };
        sE.onClick((x, y) => { const k = Math.floor(x); if (k < 0 || k >= SPAN) return; const a = pat.split(''); a[k] = a[k] === '1' ? '0' : '1'; if (a.indexOf('1') < 0) a[k] = '1'; pat = a.join(''); v.invalidate(); });
        const exact = (p, L, pt) => { const key = `${pt}|${p.toFixed(3)}|${L}`; return cache[key] || (cache[key] = pt.length <= 18 ? seedExact(pt, p, L) : null); };
        const sens = (pt, p, L) => { D.use = L; return seedSensitivity(D, pt, p); };
        const hitsAt = (bits, pt) => { const out = []; for (let k = 0; k + pt.length <= bits.length; k++) { let ok = true; for (let j = 0; j < pt.length; j++) if (pt[j] === '1' && !bits[k + j]) { ok = false; break; } if (ok) out.push(k); } return out; };
        let info = null;
        v.render(() => {
          const pt = trimmed(), w = seedWeight(pt), cont = '1'.repeat(w), L = lS.value, p = pS.value;
          // template
          for (let k = 0; k < SPAN; k++) { const on = pat[k] === '1'; sE.rect(k + 0.06, 0.12, k + 0.94, 0.88, { fill: on ? 'gold' : 'panel', fillAlpha: on ? 0.9 : 0.1, color: on ? 'gold' : 'faint', width: 1.4, radius: 5 }); sE.text(on ? '1' : '0', k + 0.5, 0.5, { align: 'center', baseline: 'middle', size: 15, weight: 700, color: on ? 'ink' : 'muted' }); }
          // sample region
          const r = mkRng(sample * 104729 + 17), bits = []; for (let k = 0; k < L; k++) bits.push(r() < p);
          sS.setView([-15, L + 1], [0, 5]);
          const sc = (k) => k;
          for (let k = 0; k < L; k++) sS.rect(sc(k) + 0.08, 3.6, sc(k) + 0.92, 4.5, { fill: bits[k] ? 'green' : 'red', fillAlpha: bits[k] ? 0.55 : 0.55, stroke: false });
          const hc = hitsAt(bits, cont), hs = hitsAt(bits, pt);
          for (const k of hc) sS.rect(k + 0.1, 2.2, k + cont.length - 0.1, 3.0, { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1 });
          for (const k of hs) for (let j = 0; j < pt.length; j++) if (pt[j] === '1') sS.rect(k + j + 0.1, 0.6, k + j + 0.9, 1.4, { fill: 'gold', fillAlpha: 0.7, stroke: false });
          for (const k of hs) sS.rect(k, 0.5, k + pt.length, 1.5, { fill: false, color: 'gold', width: 1.2 });
          sS.text('region', -1, 4.05, { align: 'right', size: 11.5, color: 'muted' }); sS.text('contiguous', -1, 2.6, { align: 'right', size: 11.5, color: 'accent' }); sS.text('spaced', -1, 1, { align: 'right', size: 11.5, color: 'gold' });
          // curves
          const ps = []; for (let q = 0.3; q <= 1.0001; q += 0.02) ps.push(q);
          const cA = ps.map((q) => [q, sens(cont, q, L).sens]), cB = ps.map((q) => [q, sens(pt, q, L).sens]);
          sC.setView([0.3, 1], [0, 1]);
          sC.path(cA, { color: 'accent', width: 2.6 }); sC.path(cB, { color: 'gold', width: 2.6 });
          sC.vline(p, { color: 'muted', dash: true });
          const a = sens(cont, p, L), b = sens(pt, p, L);
          sC.dot(p, a.sens, { r: 5.5, color: 'accent' }); sC.dot(p, b.sens, { r: 5.5, color: 'gold' });
          info = { pt, w, a, b, hc: hc.length, hs: hs.length, ex: [exact(p, L, cont), exact(p, L, pt)], L, p };
        });
        v.legend([['accent', 'contiguous seed, same weight'], ['gold', 'spaced seed (template)'], ['green', 'match', { area: true }], ['red', 'mismatch', { area: true }]]);
        v.readout(() => {
          const { pt, w, a, b, hc, hs, ex, L, p } = info, fmt = (x) => fx(x, 3);
          return `seed ${pt}, weight $w=${w}$, span ${pt.length} · chance of a hit between unrelated DNA at one valid placement: $4^{-${w}}=${sciTex(4 ** -w)}$ for **both** seeds\nregion of ${L} positions at $p=${fx(p, 2)}$: P(at least one hit) contiguous **${ex[0] === null ? fmt(a.sens) : fmt(ex[0])}** (${ex[0] === null ? 'simulated' : 'exact'}), spaced **${ex[1] === null ? fmt(b.sens) : fmt(ex[1])}** (${ex[1] === null ? 'simulated' : 'exact'}) · exact expected hit counts ${fx(Math.max(0, L - w + 1) * p ** w, 3)} against ${fx(Math.max(0, L - pt.length + 1) * p ** w, 3)}; simulated means ${fx(a.hits, 2)} against ${fx(b.hits, 2)} · this region: ${hc} contiguous and ${hs} spaced placements`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Paper',
      name: 'Basic Local Alignment Search Tool',
      paper: {
        authors: 'Stephen F. Altschul, Warren Gish, Webb Miller, Eugene W. Myers and David J. Lipman', year: 1990, title: 'Basic local alignment search tool',
        venue: 'Journal of Molecular Biology 215 (3): 403–410', doi: '10.1016/S0022-2836(05)80360-2',
      },
      introduces: ['bioinf-3.7'],
      statement: String.raw`The paper presented BLAST, a method that approximates the best *ungapped* local alignments (maximal segment pairs, scored with a substitution matrix) between a query and a database far faster than the full dynamic programme: it lists the high-scoring words of the query, finds exact occurrences of them in the database, and extends each into a segment pair, then judges the result by the Karlin–Altschul statistics (the expected number of chance matches above $S$ is approximately $E=Kmne^{-\lambda S}$, with probability $1-e^{-E}$ of at least one under the Poisson approximation). The authors report it to be at least an order of magnitude faster than existing tools of comparable sensitivity.`,
      idea: String.raw`Before it, the practical choices were the exact but slow Smith–Waterman search (item 2.6) and fast but less sensitive heuristics such as FASTA. The paper's moves: score *words* against their neighbourhood so that conservative substitutions still seed a match, search the database for those words, extend from hits, and attach honest significance levels using the extreme-value statistics of items 3.4–3.6. The threshold $T$ is the sensitivity-versus-speed dial. It introduced the scored-word seed-and-extend scheme of item 3.7. Altschul et al. (1997) added the two-hit trigger together with gapped alignment; their combined refinements ran about three times as fast as the original.`,
      caption: String.raw`A model of the paper's trade-off, built on the protein sequences of chapter 2, not a reconstruction of its tables. For each of the 91 within-family pairs (globins, cytochromes c, lysozymes, serine proteases, thioredoxins) we ask: does BLAST, with threshold $T$ and X-drop $X$, report an ungapped segment pair with $E$ below the cut-off, in a database of $10^6$ residues? The accent curve is the fraction of pairs found; the green dashed line is what a full Smith–Waterman search finds. Raising $T$ shrinks the neighbourhood (left), reduces extension work (right) and can lose distant homologues. Switch the word length or the two-hit rule to see how they move the curves.`,
      scope: String.raw`This illustrative benchmark uses BLOSUM62 and 91 family pairs, not the 1990 paper’s PAM120 experiments ($w=4,T=17$ in its later analyses). The work counter includes database word look-ups, hits and ungapped extension cells; it omits query-neighbourhood construction and uses one unit per dynamic-programming cell, so its ratio is not a CPU-speed measurement. The model database size is used for E-values only. The 1990 speed comparison in §3(c) is against FASTP in its sensitive mode; the curves here are separate simulations.`,
      credit: 'Altschul, Gish, Miller, Myers & Lipman, 1990',
      deps: ['bioinf-2.6', 'bioinf-3.4'],
      refs: ['Altschul et al. (1990), §§2–3, especially Eq. (1) and §3(b–c)', 'Altschul et al. (1997), pp. 3389–3391, two-hit refinement'],
      tags: ['paper', 'BLAST', 'database search'],
      links: { doi: 'https://doi.org/10.1016/S0022-2836(05)80360-2', wikipedia: 'https://en.wikipedia.org/wiki/BLAST_(biotechnology)' },
      viz(v) {
        const wS = v.select('word length $w$', [{ value: 3, label: '3' }, { value: 4, label: '4' }], 3);
        const Tt = v.slider('threshold $T$', 7, 24, 11, { int: true });
        const Xs = v.slider('X-drop $X$', 5, 40, 15, { int: true });
        const two = v.toggle('two-hit rule', false);
        const ec = logSlider(v, 'E-value cut-off', 1e-4, 100, 0.01);
        const pos = v.slider('query word position', 1, 140, 16, { int: true });
        const sW = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, title: 'neighbourhood of one query word', minWidth: 250 });
        const sA = v.stage({ x: [7, 24], y: [0, 1], axes: 'box', gutter: true, height: 400, xlabel: 'threshold $T$', ylabel: 'fraction of the 91 pairs found', title: 'sensitivity', minWidth: 280 });
        const sB = v.stage({ x: [7, 24], y: [1, 1000], ylog: true, axes: 'box', gutter: true, height: 400, xlabel: 'threshold $T$', ylabel: 'work saved (× fewer operations)', title: 'work against Smith–Waterman', minWidth: 280 });
        const S = matFlat('blosum62'), PU = NCBI.blosum62, PG = NCBI.gapped62, NDB = 1e6;
        const pairs = homologPairs().map((p) => ({ ...p, q: seqOf(p.a), t: seqOf(p.b) }));
        for (const p of pairs) { p.sw = swScore(p.q, p.t, S, 12, 1); p.swE = expect(p.sw, PG, p.q.length, NDB); }
        const maps = {}, runs = {};
        const nbm = (id, q, w, T) => { const k = `${id}|${w}|${T}`; return maps[k] || (maps[k] = neighborMap(q, S, w, T)); };
        const measure = (w, T, X, tw) => {
          const key = `${w}|${T}|${X}|${tw}`; if (runs[key]) return runs[key];
          let found = 0, work = 0, hits = 0, ext = 0, sw = 0;
          for (const p of pairs) {
            const nb = nbm(p.a, p.q, w, T), R = blastSearch(p.q, p.t, nb, S, { w, X, twoHit: tw });
            const best = R.hsps.reduce((m, h) => Math.max(m, h.score), 0);
            p.last = { best, E: best ? expect(best, PU, p.q.length, NDB) : Infinity };
            work += p.t.length + R.nHits + R.cells; sw += p.q.length * p.t.length; hits += R.nHits; ext += R.nExt;
            if (best) p.last.found = best;
          }
          const bests = pairs.map((p) => p.last.best);
          return (runs[key] = { best: bests, work, sw, hits, ext, nbWords: null });
        };
        let info = null;
        v.render(() => {
          const w = wS.value, Ts = w === 3 ? [7, 18] : [12, 24], X = Xs.value, tw = two.value, ecv = ec.value;
          const curve = [], speed = [];
          for (let T = Ts[0]; T <= Ts[1]; T++) {
            const R = measure(w, T, X, tw);
            const f = R.best.filter((b, i) => b && expect(b, PU, pairs[i].q.length, NDB) <= ecv).length / pairs.length;
            curve.push([T, f]); speed.push([T, R.sw / R.work]);
          }
          const swFound = pairs.filter((p) => p.swE <= ecv).length / pairs.length;
          sA.setView([Ts[0], Ts[1]], [0, 1.02]); sB.setView([Ts[0], Ts[1]], [Math.min(1, ...speed.map((p) => p[1])) / 1.5, Math.max(...speed.map((p) => p[1])) * 2]);
          sA.hline(swFound, { color: 'green', dash: true, width: 2 }); sA.text('full Smith–Waterman', Ts[1] - 0.2, swFound + 0.035, { align: 'right', size: 12, color: 'green' });
          sA.path(curve, { color: 'accent', width: 2.6 }); sA.dots(curve, { r: 3.8, color: 'accent' }); sA.vline(Tt.value, { color: 'gold', width: 2 });
          sB.hline(1, { color: 'muted', dash: true }); sB.hline(10, { color: 'faint', dash: true }); sB.text('order of magnitude', Ts[1] - 0.2, 12, { align: 'right', size: 11.5, color: 'muted' });
          sB.path(speed, { color: 'orange', width: 2.6 }); sB.dots(speed, { r: 3.8, color: 'orange' }); sB.vline(Tt.value, { color: 'gold', width: 2 });
          // neighbourhood of the chosen query word (the query is human β-globin)
          const q = seqOf('HBB_HUMAN'), i = Math.min(pos.value, q.length - w + 1) - 1, word = q.slice(i, i + w), nb = neighborsOf(word, S, Tt.value, 200), shown = nb.slice(0, 12), top = shown.length ? shown[0].score : 1;
          const wstr = PROT.HBB_HUMAN.seq.slice(i, i + w), selfScore = Array.from(word).reduce((t, c) => t + S[c * 20 + c], 0);
          sW.setView([0, 1], [0, 1]);
          sW.text(`query word ${wstr} at position ${i + 1}: ${nb.length} neighbours with score ≥ ${Tt.value}`, 0.02, 0.96, { size: 12.5, color: 'ink' });
          shown.forEach((q2, r) => { const y = 0.86 - r * 0.063, len = (q2.score / Math.max(top, 1)) * 0.5; sW.text(q2.word, 0.02, y, { size: 13, weight: 700, color: q2.word === wstr ? 'gold' : 'ink', baseline: 'middle' });
            sW.rect(0.2, y - 0.018, 0.2 + len, y + 0.018, { fill: q2.word === wstr ? 'gold' : 'accent', fillAlpha: 0.5, stroke: false }); sW.text(String(q2.score), 0.22 + len, y, { size: 11.5, color: 'muted', baseline: 'middle' }); });
          if (nb.length > shown.length) sW.text(`… and ${nb.length - shown.length} more`, 0.02, 0.86 - shown.length * 0.063, { size: 11.5, color: 'muted', baseline: 'middle' });
          if (!nb.length) sW.text('no word reaches the threshold (not even the query word itself)', 0.02, 0.8, { size: 12, color: 'red' });
          info = { curve, speed, swFound, tt: Tt.value, w, tw, selfScore };
        });
        v.legend([['accent', 'BLAST finds'], ['green', 'Smith–Waterman finds', { dash: true }], ['orange', 'operations saved'], ['gold', 'chosen $T$']]);
        v.readout(() => {
          const { curve, speed, swFound, tt, w, tw } = info, c = curve.find((p) => p[0] === tt), s = speed.find((p) => p[0] === tt);
          if (!c) return `$T=${tt}$ is outside the range ${w === 3 ? '7–18' : '12–24'} computed for $w=${w}$: move the slider.`;
          return `$w=${w}$, $T=${tt}$, ${tw ? 'two-hit' : 'one-hit'}: BLAST reports **${fx(100 * c[1], 0)}%** of the 91 family pairs at this cut-off, Smith–Waterman **${fx(100 * swFound, 0)}%** · the counted search work is **${fx(s[1], 0)}×** smaller than the number of dynamic-programming cells (neighbourhood setup excluded)\nThis operation ratio is not a CPU benchmark or a reproduction of the 1990 FASTP comparison; differences in hits reflect both heuristic seeding and the gapped versus ungapped scoring models.`;
        });
      },
    },
  ],
};
