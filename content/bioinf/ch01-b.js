// Bioinformatics Algorithms — Chapter 1: Sequences, k-mers and motifs (items 1.9–1.14; 1.1–1.8 in ch01.js)
import {
  BASES, BCOL, clamp, commas, mnus, plural, comp, revcomp, cleanDNA, hamming, binom, fixed, log2, hashSeed, rng, randomDNA,
  countMatrix, profileOf, consensusOf, scoreMotifs, columnInfo, plantedData, lexaData, truthScore, motifsAt, greedyFrom, greedyAll,
  randomizedRun, gibbsRun, emRun, seedProfile, windowProbs,
  pxer, drawTiles, heatCol, drawLogo,
} from './ch01.shared.js';

/** Sequences as rows of base tiles with one k-mer window per row. o: {active(i), bars: [probs per row], pick, removed, truth, top} */
function drawBoard(P, D, pos, k, o = {}) {
  const W = P.W, H = P.H, t = D.seqs.length, L = D.seqs[0].length, xs = 34, cw = (W - xs - 12) / L, hasBars = !!o.bars, bh = hasBars ? 13 : 0, top = o.top ?? 10;
  const th = clamp((H - top - 6) / t - bh - 5, 8, 28), rowH = th + bh + 5;
  D.seqs.forEach((s, i) => {
    const y = top + i * rowH, win = pos[i], act = o.active ? o.active(i) : true, has = win != null && act, rem = o.removed === i;
    P.text(i + 1, 6, y + th / 2, { size: 10.5, color: 'muted' });
    const base = P.c; // tiles
    for (let j = 0; j < L; j++) {
      const inside = has && j >= win && j < win + k, x = xs + j * cw;
      P.rect(x + 0.3, y, cw - 0.6, th, BCOL[s[j]], !act ? 0.1 : has ? (inside ? 0.62 : 0.16) : 0.22, cw > 9 ? 3 : 1);
      if (cw >= 9) P.text(s[j], x + cw / 2, y + th / 2 + 0.5, { size: Math.min(12.5, cw * 0.74), weight: inside ? 800 : 600, align: 'center', color: !act ? 'faint' : inside ? 'ink' : 'muted' });
    }
    if (has) P.rect(xs + win * cw - 1, y - 1.5, k * cw + 2, th + 3, null, 1, 3, rem ? 'red' : 'gold', 2);
    if (o.truth && D.pos) P.line(xs + D.pos[i] * cw, y - 3, xs + (D.pos[i] + k) * cw, y - 3, 'green', 2.4);
    const pr = o.bars && o.bars[i];
    if (pr) {
      const mx = Math.max(...pr, 1e-12), yb = y + th + 3 + bh;
      pr.forEach((p, j) => { const hh = Math.max(p > 0 ? 1 : 0, bh * p / mx), isPick = o.pick && o.pick.row === i && o.pick.idx === j, isOld = o.pick && o.pick.row === i && o.pick.old === j; P.rect(xs + j * cw + 0.3, yb - hh, Math.max(1, cw - 0.6), hh, isPick ? 'gold' : isOld ? 'red' : 'accent', isPick ? 1 : 0.55, 0); });
      P.line(xs, yb, xs + (L - k + 1) * cw, yb, 'faint', 1);
    }
  });
  return { th, rowH, xs, cw };
}
/** 4 x k matrix as a heat grid (rows A C G T). */
function drawMatrix(P, M, x0, y0, cw, rh, o = {}) {
  const k = M[0].length;
  for (let a = 0; a < 4; a++) {
    P.text(BASES[a], x0 - 8, y0 + a * rh + rh / 2, { size: 13, weight: 800, color: BCOL[BASES[a]], align: 'right' });
    for (let j = 0; j < k; j++) {
      const p = M[a][j]; P.rect(x0 + j * cw + 0.5, y0 + a * rh + 0.5, cw - 1, rh - 1, heatCol(P.v, o.scale ? p / o.scale : p, o.color || 'accent'), 1, 2);
      if (cw >= 22) P.text(o.int ? Math.round(p) : p.toFixed(2).replace(/^0/, ''), x0 + j * cw + cw / 2, y0 + a * rh + rh / 2 + 0.5, { size: Math.min(11, cw * 0.4), weight: 650, align: 'center', color: p > 0.55 ? 'panel' : 'ink' });
    }
  }
}
const DATA_OPTS = [{ value: 'planted', label: 'planted motif (synthetic)' }, { value: 'lexa', label: 'E. coli LexA sites (real)' }];
const makeData = (kind, seed, k = 8) => (kind === 'lexa' ? lexaData() : plantedData(hashSeed('p' + seed + ':' + k), { t: 8, L: 30, k, m: 1 }));
const median = (a) => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };

export default {
  collection: 'bioinf',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Algorithm',
      name: 'Greedy motif search with pseudocounts',
      statement: String.raw`**GreedyMotifSearch** takes $t$ sequences $\mathrm{Dna}_1,\dots,\mathrm{Dna}_t$ and a length $k$. For every $k$-mer $M_1$ of $\mathrm{Dna}_1$ it sets $\mathrm{Motifs}=(M_1)$ and, for $i=2,\dots,t$, builds the profile of $M_1,\dots,M_{i-1}$ and appends the **profile-most-probable** $k$-mer of $\mathrm{Dna}_i$ (the window $x$ maximizing $\prod_j p_{x_j}(j)$, first one on ties). It returns the motif matrix of lowest $\mathrm{Score}$ over the $n-k+1$ starts. With raw frequencies a letter missing from the profile gives probability $0$ to every window that contains it; **Laplace pseudocounts** ($+1$ to every count) remove the zeros. The algorithm is a heuristic: it is fast, $O(n\,t\,k\,(n-k+1))$, but not guaranteed to find the optimum.`,
      idea: String.raw`Greedy search treats the first $i-1$ choices as final and extends them one sequence at a time, like growing a profile by the best available evidence. Without pseudocounts, an early profile built from a few sites has many zero entries, so most windows of the next sequence tie at probability $0$ and the "most probable" window is just the first one, which poisons all later profiles (the rule of succession, $\frac{c+1}{m+4}$, is exactly Laplace's remedy for events not yet observed). With pseudocounts, near-misses keep a small positive probability and rank by how many letters match.`,
      caption: String.raw`Pick **data** (a seeded synthetic set with a planted 8-mer, or 16 real *E. coli* LexA promoters with a 20-mer box), the **pseudocount rule** and the **first $k$-mer** (or click a bar in the bottom chart). Step through: for each new sequence the bars under it show the profile probability of every window, the gold bar is the one chosen. Green brackets mark the true site. Switch pseudocounts off and watch the profile fill with zeros and the choices collapse onto position 1; the bottom chart gives the final Score for every starting $k$-mer.`,
      deps: ['bioinf-1.6'],
      refs: ['Compeau–Pevzner ch. 2'],
      credit: 'Hertz, Hartzell & Stormo, CONSENSUS, 1990',
      scope: String.raw`A heuristic: no guarantee of the optimal $\mathrm{Score}$.`,
      tags: ['motif finding', 'greedy', 'pseudocounts'],
      viz(v) {
        let D, k, G = {}, seed = 7;
        const dataS = v.select('data', DATA_OPTS, 'planted', { onChange: () => rebuild() });
        const pcS = v.select('pseudocounts', [{ value: '0', label: 'none' }, { value: '1', label: 'Laplace (+1)' }], '1', { onChange: () => { stS.set(G[+pcS.value].best.start); S.reset(undefined, { at: 'start' }); } });
        const stS = v.slider('first $k$-mer in sequence 1', 0, 22, 0, { int: true, onChange: () => S.reset(undefined, { at: 'start' }) });
        v.button('new data', () => { seed++; rebuild(); });
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1.6, minWidth: 340, title: 'sequences; the bars show the profile probability of each window' });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 0.8, minWidth: 260, title: 'profile used for the next choice' });
        const sC = v.stage({ x: [-0.5, 22.5], y: [0, 30], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'first $k$-mer (start position in sequence 1)', ylabel: 'final Score', title: 'Score of the motif matrix found from every starting $k$-mer' });
        const rebuild = () => {
          D = makeData(dataS.value, seed); k = D.k; G = { 0: greedyAll(D.seqs, k, 0), 1: greedyAll(D.seqs, k, 1) };
          stS.input.max = String(D.seqs[0].length - k); stS.set(G[+pcS.value].best.start); S.reset(undefined, { at: 'start' }); sC.setView([-0.5, D.seqs[0].length - k + 0.5], [0, Math.max(...G[0].scores, ...G[1].scores) + 4]);
        };
        const CODE = ['GreedyMotifSearch(Dna, k, t)', '  best ← the first k-mer of every sequence', '  for each k-mer M₁ of Dna₁:', '    Motifs ← [M₁]', '    for i ← 2 … t:', '      Profile ← profile of Motifs  (with pseudocounts)', '      Motifs ← Motifs + Profile-most-probable k-mer of Dnaᵢ', '    if Score(Motifs) < Score(best):  best ← Motifs', '  return best'];
        D = makeData('planted', seed); k = D.k; G = { 0: greedyAll(D.seqs, k, 0), 1: greedyAll(D.seqs, k, 1) }; stS.set(G[1].best.start);
        const S = v.steps({
          frames: () => {
            const pc = +pcS.value, g = greedyFrom(D.seqs, k, stS.value, pc);
            return g.frames.map((f, i) => ({ ...f, line: i === 0 ? [3, 4] : [5, 6, 7], note: i === 0 ? `Start with the ${k}-mer at position ${stS.value + 1} of sequence 1: Motifs = [${D.seqs[0].slice(stS.value, stS.value + k)}].` : f.allZero ? `Profile of sequences 1–${i}: **every window of sequence ${i + 1} has probability 0**, because each contains a letter the profile has never seen. All ties: the first window is taken. Score so far ${f.score}.` : `Profile of sequences 1–${i} → the most probable window of sequence ${i + 1} starts at position ${f.pick + 1} (probability ${f.probs[f.pick].toExponential(1)}). Score so far ${f.score}.` }));
          },
          code: CODE, codeTitle: 'pseudocode', codePos: 'below', speed: 1.4, start: 'end', still: 'end',
        });
        sC.onClick((x) => { const s = Math.round(x); if (s >= 0 && s <= D.seqs[0].length - k) stS.set(s); S.reset(undefined, { at: 'start' }); });
        v.render(() => {
          const f = S.frame, pc = +pcS.value, rowN = f.row ?? 0, t = D.seqs.length, L = D.seqs[0].length;
          const pos = D.seqs.map((_, i) => (i <= rowN ? f.pos[i] : null)), bars = D.seqs.map((_, i) => (i === rowN && f.probs ? f.probs : null));
          const P = pxer(v, sA), B = drawBoard(P, D, pos, k, { active: (i) => i <= rowN, bars, pick: f.probs ? { row: rowN, idx: f.pick } : null, truth: true });
          const Q = pxer(v, sB), cw = Math.min(30, (Q.W - 50) / k), pr = f.prof || profileOf([D.seqs[0].slice(stS.value, stS.value + k)], k, pc);
          Q.text(f.prof ? `built from sequences 1–${rowN}` : 'built from the first k-mer only', 14, 14, { size: 12, color: 'muted' });
          drawMatrix(Q, pr, 34, 30, cw, 40);
          let zero = 0; pr.forEach((r) => r.forEach((p) => { if (p === 0) zero++; }));
          Q.text(`${zero} of ${4 * k} entries are exactly 0`, 14, 30 + 4 * 40 + 18, { size: 12.5, weight: 700, color: zero ? 'red' : 'green' });
          Q.text(`consensus ${consensusOf(motifsAt(D.seqs.slice(0, rowN + 1), f.pos.slice(0, rowN + 1), k), k)}`, 14, 30 + 4 * 40 + 38, { size: 12.5, weight: 700 });
          Q.text(`Score so far ${f.score}`, 14, 30 + 4 * 40 + 58, { size: 12.5, weight: 700, color: 'muted' });
          // scores per start
          const sc = G[pc].scores, bi = G[pc].best.start, ts = truthScore(D);
          sC.bars(sc, { x0: 0, dx: 1, color: (val, i) => (i === stS.value ? 'gold' : i === bi ? 'green' : 'accent') });
          sC.hline(ts, { color: 'green', dash: true, width: 1.6 }); sC.text(`planted motif: ${ts}`, L - k + 0.4, ts + 1.5, { size: 11.5, color: 'green', align: 'right', weight: 700, plate: true });
        });
        v.legend([['gold', 'chosen window / selected start', { area: true }], ['green', 'true site (bracket) / best start', { area: true }], ['accent', 'profile probability', { area: true }]]);
        v.readout(() => {
          const g0 = G[0].best, g1 = G[1].best, ts = truthScore(D), cur = greedyFrom(D.seqs, k, stS.value, +pcS.value), hit = cur.pos.filter((p, i) => p === D.pos[i]).length;
          return `Best Score found: **${g0.score}** without pseudocounts, **${g1.score}** with Laplace pseudocounts; planted motif Score ${ts}${dataS.value === 'lexa' ? ' (reference boxes = best match to the LexA consensus)' : ''} · this start (${stS.value + 1}) ends at Score **${cur.score}**, ${hit} of ${D.seqs.length} windows at the true position${D.seqs.length > 8 ? '' : ''}\n*${dataS.value === 'lexa' ? 'Data: 130 nt upstream of 16 LexA-regulated E. coli genes (NC_000913.3).' : 'Synthetic data: 8 seeded random sequences of length 30 with a planted 8-mer (1 substitution per copy).'}*`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Algorithm',
      name: 'Randomized motif search',
      statement: String.raw`**RandomizedMotifSearch** starts from one uniformly random $k$-mer in each sequence ($\mathrm{Motifs}$), then repeats: build the profile of $\mathrm{Motifs}$ (with pseudocounts), replace every sequence's $k$-mer by its profile-most-probable one, and stop when $\mathrm{Score}$ no longer decreases. One run ends in a local optimum; the algorithm is **restarted** many times and the best result is kept. If one run finds the planted motif with probability $p$, then $N$ independent restarts find it with probability $1-(1-p)^N$.`,
      idea: String.raw`Alternating "profile from motifs" and "motifs from profile" is coordinate ascent on a likelihood-like objective, so each run only improves and must stop in a local optimum, which depends on the random start. Most random starts are far from the true sites and settle into a poor optimum, but a few starts contain enough true sites for the first profile to carry signal, and then the iteration locks on. Each run is cheap, so a large number of restarts buys a success probability close to $1$ (independent runs: $1-(1-p)^N$).

For independent restarts with the same success probability $p$, prob-2.1.1a multiplies the failure probabilities to give $(1-p)^N$. Taking the complementary event gives $1-(1-p)^N$. This amplifies a positive per-run success chance; it does not prove that the heuristic has $p>0$ for a particular planted instance or that dependent restarts have this success law.`,
      caption: String.raw`The histogram collects the **final Score of many restarts**; the green line is the Score of the true motif. Use the *watch restart* slider to follow a single run step by step: the tiles show its current $k$-mers, the trace plots the Score of each iteration, and its final score is marked gold in the histogram. Change the number of restarts and watch the number of runs reaching the true Score grow; the readout converts the observed success rate into the number of restarts needed for 99% confidence.`,
      deps: ['bioinf-1.9','prob-2.1.1a'],
      refs: ['Compeau–Pevzner ch. 2'],
      tags: ['motif finding', 'randomized', 'local optimum'],
      viz(v) {
        let D, k, seed = 5, runs = null, runsKey = '';
        const dataS = v.select('data', DATA_OPTS, 'planted', { onChange: () => { rWatch.set(1); S.reset(undefined, { at: 'start' }); } });
        const nS = v.slider('restarts', 50, 3000, 1000, { int: true, step: 50 });
        const rWatch = v.slider('watch restart #', 1, 300, 1, { int: true, onChange: () => S.reset(undefined, { at: 'start' }) });
        v.button('new seed', () => { seed++; rWatch.set(1); S.reset(undefined, { at: 'start' }); });
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.5, minWidth: 340, title: 'the run being watched: its current k-mers' });
        const sH = v.stage({ x: [0, 50], y: [0, 10], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 290, xlabel: 'final Score of a restart', ylabel: 'number of restarts', title: 'final scores of all restarts' });
        const sT = v.stage({ x: [0, 12], y: [0, 40], axes: 'box', gutter: true, height: 170, full: true, xlabel: 'iteration', ylabel: 'Score', title: 'the watched run: Score per iteration' });
        const data = () => { const kind = dataS.value; if (!D || D._kind !== kind) { D = makeData(kind, 3); D._kind = kind; k = D.k; } return D; };
        const cfg = () => { data(); const N = dataS.value === 'lexa' ? Math.min(nS.value, 200) : nS.value; const key = `${dataS.value}|${N}|${seed}`; if (runsKey !== key) { runsKey = key; runs = []; for (let i = 0; i < N; i++) runs.push(randomizedRun(D.seqs, k, rng(hashSeed(`${key}|${i}`)), 1)); } rWatch.input.max = String(N); return N; };
        const watched = () => runs[clamp(rWatch.value - 1, 0, runs.length - 1)];
        const S = v.steps({
          frames: () => { cfg(); const w = watched(); return w.traj.map((s, i) => ({ ...s, it: i, line: i === 0 ? [1, 2] : [3, 4, 5, 6], note: i === 0 ? `Restart #${rWatch.value}: a random ${k}-mer in each sequence. Score ${s.score}.` : `Iteration ${i}: profile of the current k-mers → most probable k-mer in every sequence. Score drops to **${s.score}**.${i === w.traj.length - 1 ? ' The next round would not improve it: stop.' : ''}` })); },
          code: ['Motifs ← random k-mer in each sequence', 'best ← Motifs', 'loop:', '  Profile ← profile of Motifs (pseudocounts)', '  Motifs ← Profile-most-probable k-mer in each sequence', '  if Score(Motifs) < Score(best):  best ← Motifs', '  else:  return best'],
          codeTitle: 'RandomizedMotifSearch', codePos: 'below', speed: 1.5, start: 'end', still: 'end',
        });
        v.render(() => {
          const N = cfg(), f = S.frame, w = watched(), ts = truthScore(D), t = D.seqs.length, ex = w.traj[w.traj.length - 1];
          const P = pxer(v, sA); drawBoard(P, D, f.pos, k, { truth: true });
          const finals = runs.map((r) => r.score), lo = Math.min(...finals, ts) - 1, hi = Math.max(...finals) + 1, counts = new Array(hi - lo + 1).fill(0); finals.forEach((x) => counts[x - lo]++);
          const mx = Math.max(...counts) * 1.12; sH.setView([lo - 0.5, hi + 0.5], [0, mx]);
          sH.bars(counts, { x0: lo, dx: 1, color: (val, i) => (lo + i === ex.score ? 'gold' : lo + i <= ts ? 'green' : 'accent') });
          sH.vline(ts + 0.5, { color: 'green', dash: true, width: 1.6 }); sH.text('true motif', ts + 0.5, mx * 0.93, { size: 11.5, color: 'green', align: 'left', weight: 700, dx: 6 });
          const sc = w.traj.map((s) => s.score), top = Math.max(...sc) + 3; sT.setView([-0.3, Math.max(5, sc.length - 0.7)], [0, top]); sT.setTicks(Array.from({ length: Math.max(6, sc.length) }, (_, i) => i), null);
          sT.path(sc.slice(0, f.it + 1).map((y, i) => [i, y]), { color: 'accent', width: 2.2 }); sT.dots(sc.slice(0, f.it + 1).map((y, i) => [i, y]), { r: 4, color: 'accent' }); sT.dot(f.it, sc[f.it], { r: 6, color: 'gold' });
          sT.hline(ts, { color: 'green', dash: true, width: 1.6 });
        });
        v.legend([['accent', 'restarts ending above the true Score', { area: true }], ['green', 'restarts reaching the true Score', { area: true }], ['gold', 'the watched run', { area: true }]]);
        v.readout(() => {
          const N = cfg(), ts = truthScore(D), finals = runs.map((r) => r.score), ok = finals.filter((x) => x <= ts).length, p = ok / N, its = runs.reduce((a, r) => a + r.traj.length - 1, 0) / N;
          const need = ok ? Math.ceil(Math.log(0.01) / Math.log(1 - p)) : null;
          return `**${commas(ok)}** of ${commas(N)} restarts (${(100 * p).toFixed(1)}%) reach the true Score ${ts} or better; best found ${Math.min(...finals)}, median ${median(finals)}; average ${its.toFixed(1)} iterations per run · with $p\\approx${p.toFixed(3)}$ a single run succeeds rarely, but $1-(1-p)^{${commas(N)}}=${(1 - (1 - p) ** N).toFixed(4)}$ for all restarts together${need ? ` (about ${commas(need)} restarts give 99%)` : ''}\n*${dataS.value === 'lexa' ? 'Data: 16 E. coli LexA promoters (NC_000913.3); restarts capped at 200 here.' : 'Synthetic data: seeded random sequences, planted 8-mer with 1 substitution per copy.'}*`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Algorithm',
      name: 'Gibbs sampling for motifs',
      statement: String.raw`**GibbsSampler** starts from random $k$-mers $\mathrm{Motifs}$ in each of the $t$ sequences and repeats $N$ times: pick a sequence $i$ at random, **remove** its $k$-mer, build the profile of the other $t-1$ $k$-mers (with pseudocounts), compute for every window $x$ of $\mathrm{Dna}_i$ the probability $\Pr(x\mid\mathrm{Profile})$, and **sample** a new window with probability proportional to it. The best $\mathrm{Motifs}$ seen is returned. Unlike greedy or randomized search, a step may *increase* the Score; the chain is a Markov chain on motif matrices (a Gibbs sampler of the joint distribution of the site positions), so it can leave local optima.`,
      idea: String.raw`Replacing "take the most probable window" by "draw a window in proportion to its probability" turns hill-climbing into sampling: the best window is still the most likely choice, but near-misses and even unlikely windows get chosen sometimes, which lets the chain cross valleys between local optima. Resampling one coordinate from its conditional distribution given the rest is exactly a Gibbs-sampler step (stat-10.18), and the chain's stationary distribution puts most mass on motif matrices with small Score. The price is noise: the Score wanders, so the best state is recorded, and $N$ must be large.`,
      caption: String.raw`Step through one chain: the **removed sequence** (red frame) gets its window redrawn; the bars under it are the resampling probabilities (gold: the new window, red: the old one). The top-right trace follows the Score of the chain (grey) and its best-so-far (blue); the orange line is where hill-climbing from *the same starting point* gets stuck. The histogram compares many Gibbs chains with the same number of independent hill-climbs: the sampler's best scores sit much further left.`,
      deps: ['bioinf-1.10', 'stat-10.18'],
      refs: ['Compeau–Pevzner ch. 2'],
      credit: 'Lawrence et al., 1993 (Gibbs motif sampler)',
      tags: ['motif finding', 'gibbs sampling', 'mcmc'],
      viz(v) {
        let D, k, seed = 1, cache = null, cacheKey = '', cmp = null, cmpKey = '';
        const dataS = v.select('data', DATA_OPTS, 'planted', { onChange: () => S.reset(undefined, { at: 'end' }) });
        const nS = v.slider('iterations $N$', 100, 1500, 400, { int: true, step: 50, onChange: () => S.reset(undefined, { at: 'end' }) });
        v.button('new chain', () => { seed++; S.reset(undefined, { at: 'end' }); });
        const sA = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 1.4, minWidth: 340, title: 'the sequence being resampled' });
        const sT = v.stage({ x: [0, 400], y: [0, 40], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 300, xlabel: 'iteration', ylabel: 'Score', title: 'Score of the chain' });
        const sH = v.stage({ x: [0, 50], y: [0, 10], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'best Score reached by a run', ylabel: 'runs', title: 'Gibbs sampler chains versus independent hill-climbs (same budget order)' });
        const data = () => { const kind = dataS.value; if (!D || D._kind !== kind) { D = makeData(kind, 3); D._kind = kind; k = D.k; } return D; };
        const run = () => { data(); const N = nS.value, key = `${dataS.value}|${N}|${seed}`; if (key !== cacheKey) { cacheKey = key; const g = gibbsRun(D.seqs, k, rng(hashSeed(key)), N, 1), ro = randomizedRun(D.seqs, k, rng(1), 1, 200, g.frames[0].pos); cache = { g, ro }; } return cache; };
        const compare = () => {
          data(); const N = Math.min(nS.value, dataS.value === 'lexa' ? 250 : 500), M = dataS.value === 'lexa' ? 16 : 30, key = `${dataS.value}|${N}|${seed}`;
          if (key !== cmpKey) { cmpKey = key; const gb = [], rb = []; for (let i = 0; i < M; i++) { gb.push(gibbsRun(D.seqs, k, rng(hashSeed(`${key}|g${i}`)), N, 1).best); rb.push(randomizedRun(D.seqs, k, rng(hashSeed(`${key}|r${i}`)), 1).score); } cmp = { gb, rb, N, M }; }
          return cmp;
        };
        const S = v.steps({
          frames: () => run().g.frames.map((f) => ({ ...f, line: f.it === 0 ? [1] : [2, 3, 4, 5, 6], note: f.it === 0 ? `Random k-mers: Score ${f.score}.` : `Iteration ${f.it}: remove sequence ${f.removed + 1}'s k-mer, profile of the other ${D.seqs.length - 1}, then sample a new window: position ${f.chosen + 1} (probability ${f.probs[f.chosen].toFixed(3)}; the old window ${f.old + 1} had ${f.probs[f.old].toFixed(3)}). Score ${f.score}, best so far ${f.best}.` })),
          code: ['Motifs ← random k-mer in each sequence;  best ← Motifs', 'repeat N times:', '  i ← random sequence', '  Profile ← profile of Motifs without the k-mer of sequence i  (pseudocounts)', '  sample a window of Dnaᵢ with probability ∝ Pr(window | Profile)', '  Motifs ← Motifs with the new window', '  if Score(Motifs) < Score(best):  best ← Motifs', 'return best'],
          codeTitle: 'GibbsSampler(Dna, k, t, N)', codePos: 'below', speed: 8, start: 'end', still: 'end',
        });
        v.render(() => {
          const { g, ro } = run(), f = S.frame, N = nS.value, ts = truthScore(D), P = pxer(v, sA);
          drawBoard(P, D, f.pos, k, { truth: true, removed: f.removed, bars: D.seqs.map((_, i) => (i === f.removed ? f.probs : null)), pick: f.removed >= 0 ? { row: f.removed, idx: f.chosen, old: f.old } : null });
          const cur = g.frames.map((x) => x.score), best = g.frames.map((x) => x.best), top = Math.max(...cur, ro.score, ts) + 3, lo = Math.max(0, Math.min(...best, ts) - 6);
          sT.setView([-N * 0.01, N * 1.01], [lo, top]);
          sT.path(cur.slice(0, f.it + 1).map((y, i) => [i, y]), { color: 'muted', width: 1.3, alpha: 0.9 });
          sT.path(best.slice(0, f.it + 1).map((y, i) => [i, y]), { color: 'accent', width: 2.6 });
          sT.dot(f.it, f.score, { r: 5, color: 'gold' });
          sT.hline(ts, { color: 'green', dash: true, width: 1.6 }); sT.text('true motif', N * 0.99, ts - (top - lo) * 0.045, { size: 11.5, color: 'green', align: 'right', weight: 700, plate: true });
          sT.hline(ro.score, { color: 'orange', dash: true, width: 1.8 }); sT.text('hill-climbing from the same start stops here', N * 0.99, ro.score + (top - lo) * 0.05, { size: 11.5, color: 'orange', align: 'right', weight: 700, plate: true });
          const c = compare(), lo2 = Math.min(...c.gb, ...c.rb, ts) - 1, hi2 = Math.max(...c.gb, ...c.rb) + 1, cg = new Array(hi2 - lo2 + 1).fill(0), cr = cg.slice();
          c.gb.forEach((x) => cg[x - lo2]++); c.rb.forEach((x) => cr[x - lo2]++);
          const mx = Math.max(...cg, ...cr) * 1.15; sH.setView([lo2 - 0.6, hi2 + 0.6], [0, mx]);
          cg.forEach((n, i) => { if (n) sH.rect(lo2 + i - 0.42, 0, lo2 + i - 0.02, n, { fill: 'accent', color: 'accent', fillAlpha: 0.75 }); }); cr.forEach((n, i) => { if (n) sH.rect(lo2 + i + 0.02, 0, lo2 + i + 0.42, n, { fill: 'orange', color: 'orange', fillAlpha: 0.75 }); });
          sH.vline(ts, { color: 'green', dash: true, width: 1.6 });
        });
        v.legend([['accent', 'Gibbs best Score (N iterations)', { area: true }], ['orange', 'single hill-climb (randomized search)', { area: true }], ['green', 'true motif Score']]);
        v.readout(() => {
          const { g, ro } = run(), c = compare(), ts = truthScore(D), okG = c.gb.filter((x) => x <= ts).length, okR = c.rb.filter((x) => x <= ts).length;
          return `This chain: best Score **${g.best}** after ${nS.value} iterations (true motif ${ts}); hill-climbing from the same start: **${ro.score}** · ${c.M} chains of ${c.N} iterations: median best ${median(c.gb)}, ${okG} reach the true Score; ${c.M} hill-climbs: median ${median(c.rb)}, ${okR} reach it\n*${dataS.value === 'lexa' ? 'Data: 16 E. coli LexA promoters (NC_000913.3), k = 20.' : 'Synthetic data: seeded sequences with a planted 8-mer.'}*`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Algorithm',
      name: 'EM for motif discovery (MEME)',
      statement: String.raw`In the **one-occurrence-per-sequence** (OOPS) model each sequence $x^{(i)}$ contains one motif occurrence at an unknown start $j$ (uniform prior over the $W=n-k+1$ starts), emitted by a position weight matrix $\theta_a(c)$; the rest is i.i.d. background $q$. **EM** alternates
- **E-step:** $Z_{ij}=\Pr(\text{site at }j\mid x^{(i)},\theta)=\dfrac{r_{ij}}{\sum_{j'}r_{ij'}}$, with $r_{ij}=\prod_{c=1}^{k}\dfrac{\theta_{x^{(i)}_{j+c-1}}(c)}{q_{x^{(i)}_{j+c-1}}}$;
- **M-step:** $\theta_a(c)\leftarrow\dfrac{1}{t}\sum_{i,j}Z_{ij}\,[x^{(i)}_{j+c-1}=a]$ (plus a tiny pseudocount).

The log-likelihood $\sum_i\log\big(\tfrac1W\sum_jr_{ij}\big)+\mathrm{const}$ **never decreases**, and EM converges to a local maximum that depends on the start; MEME starts from profiles seeded by actual $k$-mers of the data.`,
      idea: String.raw`This is the general EM argument (stat-3.11) with the site positions as missing data. The E-step computes the exact posterior over the missing positions; the M-step maximizes the expected complete-data log-likelihood, which here is a weighted count with the closed form above. Jensen's inequality then shows each full iteration cannot decrease the observed-data likelihood. Unlike Gibbs sampling, EM keeps the *soft* assignment $Z_{ij}$ instead of one sampled window, so it is deterministic and converges smoothly, but it too can stop in a poor local maximum.`,
      caption: String.raw`Left: the posterior matrix $Z_{ij}$ (rows: sequences; columns: window starts; brighter = more probable) at the current iteration, with the true sites marked ▲. Right: the current profile as a sequence logo (information against the background). Bottom: the log-likelihood, which rises at every iteration. **Pick the seed window** in sequence 1 (the default is the true site; choose another position or *random start*) and see EM converge to a different, worse local maximum with a lower likelihood.`,
      deps: ['bioinf-1.9', 'stat-3.11'],
      refs: ['Durbin ch. 11'],
      credit: 'Lawrence & Reilly, 1990; Bailey & Elkan, MEME, 1994',
      scope: String.raw`OOPS model: exactly one occurrence per sequence. MEME also fits "zero or one" and "any number" per sequence.`,
      tags: ['motif finding', 'em', 'meme'],
      viz(v) {
        let D, k, seed = 1, key = '', F = null, Fref = null, q = null;
        const dataS = v.select('data', DATA_OPTS, 'planted', { onChange: () => { D = null; load(); S.reset(undefined, { at: 'start' }); } });
        const initS = v.select('start', [{ value: 'seed', label: 'from a data k-mer' }, { value: 'rand', label: 'random profile' }], 'seed', { onChange: () => S.reset(undefined, { at: 'start' }) });
        const seedS = v.slider('seed window in sequence 1', 0, 22, 0, { int: true, onChange: () => { initS.set('seed'); S.reset(undefined, { at: 'start' }); } });
        v.button('new random start', () => { seed++; initS.set('rand'); S.reset(undefined, { at: 'start' }); });
        const sZ = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.3, minWidth: 330, title: 'posterior of the site position in each sequence' });
        const sL = v.stage({ x: [0.5, 8.5], y: [0, 2.2], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 290, xlabel: 'position', ylabel: 'bits', title: 'current profile as a logo' });
        const sT = v.stage({ x: [0, 30], y: [-400, -300], axes: 'box', gutter: true, height: 160, full: true, xlabel: 'iteration', ylabel: 'log-likelihood', title: 'log-likelihood of the data' });
        const load = () => { if (!D || D._kind !== dataS.value) { D = makeData(dataS.value, 3); D._kind = dataS.value; k = D.k; const all = D.seqs.join(''); q = BASES.split('').map((b) => (all.split(b).length - 1) / all.length); seedS.input.max = String(D.seqs[0].length - k); seedS.set(D.pos[0]); sL.setView([0.5, k + 0.5], [0, 2.2]); } };
        load();
        const init = () => (initS.value === 'rand' ? (() => { const r = rng(hashSeed('em' + seed)); const M = [0, 1, 2, 3].map(() => new Array(k).fill(0)); for (let c = 0; c < k; c++) { let s = 0; const w = [0, 1, 2, 3].map(() => 0.25 + r()); w.forEach((x) => (s += x)); w.forEach((x, a) => (M[a][c] = x / s)); } return M; })() : seedProfile(D.seqs[0].slice(seedS.value, seedS.value + k)));
        const frames = () => {
          load(); const kk = `${dataS.value}|${initS.value}|${seedS.value}|${seed}`; if (kk !== key) { key = kk; F = emRun(D.seqs, k, init(), q, 30); Fref = emRun(D.seqs, k, seedProfile(D.seqs[0].slice(D.pos[0], D.pos[0] + k)), q, 30); } return F;
        };
        const S = v.steps({
          frames: () => frames().map((f) => ({ ...f, line: f.it === 0 ? [1] : [3, 4, 5], note: f.it === 0 ? `The starting profile (${initS.value === 'rand' ? 'random' : 'a seed k-mer: 0.5 on each seed letter'}). Log-likelihood ${f.ll.toFixed(1)}.` : `Iteration ${f.it}: E-step with the previous profile gives Z; the log-likelihood is **${f.ll.toFixed(2)}** (change ${(f.ll - F[f.it - 1].ll >= 0 ? '+' : '') + (f.ll - F[f.it - 1].ll).toFixed(2)}); the M-step then re-estimates the profile from Z-weighted counts.` })),
          code: ['θ ← starting profile', 'repeat:', '  E-step:  Zᵢⱼ ← Pr(site at j in sequence i | θ)  ∝  ∏ θ(letter, column) / q(letter)', '  M-step:  θₐ(c) ← Σᵢⱼ Zᵢⱼ [letter = a in column c]  /  t', 'until the log-likelihood stops increasing'],
          codeTitle: 'EM for the OOPS motif model', codePos: 'below', speed: 2.5, start: 1, still: 1,
        });
        v.render(() => {
          frames(); const f = S.frame, t = D.seqs.length, W = D.seqs[0].length - k + 1, P = pxer(v, sZ), xs = 34, cw = (P.W - xs - 12) / W, rh = Math.min(26, (P.H - 40) / t), y0 = 14;
          for (let i = 0; i < t; i++) {
            P.text(i + 1, 6, y0 + i * rh + rh / 2, { size: 10.5, color: 'muted' });
            let am = 0; f.Z[i].forEach((z, j) => { if (z > f.Z[i][am]) am = j; });
            for (let j = 0; j < W; j++) P.rect(xs + j * cw + 0.2, y0 + i * rh + 0.5, Math.max(1, cw - 0.4), rh - 1, heatCol(v, Math.pow(f.Z[i][j], 0.6), 'green'), 1, 0);
            P.rect(xs + am * cw - 0.5, y0 + i * rh, cw + 1, rh, null, 1, 0, 'ink', 1.6);
            P.tri(xs + (D.pos[i] + 0.5) * cw, y0 + i * rh + rh - 2, 3.2, 'orange');
          }
          P.text('start position of the window →', xs, y0 + t * rh + 12, { size: 11, color: 'muted' }); P.text('▲ true site   □ most probable window', P.W - 10, y0 + t * rh + 12, { size: 11, color: 'muted', align: 'right' });
          const info = columnInfo(f.theta, q); sL.setView([0.5, k + 0.5], [0, Math.max(2.2, ...info) * 1.05]); sL.setTicks(Array.from({ length: k }, (_, i) => i + 1).filter((i) => k <= 12 || i % 2 === 1), null); drawLogo(sL, v, f.theta, info);
          const ll = F.map((x) => x.ll), lo = Math.min(...ll, ...Fref.map((x) => x.ll)), hi = Math.max(...ll, ...Fref.map((x) => x.ll)), pad = (hi - lo) * 0.12 + 1;
          sT.setView([-0.5, 30.5], [lo - pad, hi + pad]);
          sT.path(ll.slice(0, f.it + 1).map((y, i) => [i, y]), { color: 'accent', width: 2.4 }); sT.dots(ll.slice(0, f.it + 1).map((y, i) => [i, y]), { r: 3.5, color: 'accent' }); sT.dot(f.it, f.ll, { r: 6, color: 'gold' });
          sT.hline(Fref[30].ll, { color: 'green', dash: true, width: 1.6 }); sT.text('optimum reached from the true site', 30, Fref[30].ll + pad * 0.5, { size: 11.5, color: 'green', align: 'right', weight: 700, plate: true });
        });
        v.legend([['accent', 'log-likelihood by iteration'], ['green', 'optimum started on the true site'], ['orange', 'true site ▲', { dot: true }]]);
        v.readout(() => {
          frames(); const ll = F.map((x) => x.ll), mono = ll.every((x, i) => i === 0 || x >= ll[i - 1] - 1e-7), last = F[30], hit = last.Z.filter((z, i) => z.indexOf(Math.max(...z)) === D.pos[i]).length, mz = last.Z.reduce((a, z) => a + Math.max(...z), 0) / last.Z.length;
          return `Log-likelihood ${ll[0].toFixed(1)} → **${ll[30].toFixed(1)}** in 30 iterations, non-decreasing at every step: ${mono ? '✓' : '✗'} · final posterior puts on average ${(100 * mz).toFixed(0)}% on the chosen window; ${hit} of ${D.seqs.length} windows coincide with the true site · optimum from the true site: ${Fref[30].ll.toFixed(1)} ${ll[30] < Fref[30].ll - 0.5 ? '(this start got stuck lower)' : '(this start reaches it)'}\n*${dataS.value === 'lexa' ? 'Data: 16 E. coli LexA promoters (NC_000913.3), k = 20, background = observed base composition.' : 'Synthetic data: seeded sequences with a planted 8-mer (1 substitution per copy).'}*`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.13
    {
      num: '1.13',
      kind: 'Paper',
      name: 'Molecular Structure of Nucleic Acids',
      paper: { authors: 'J. D. Watson and F. H. C. Crick', year: 1953, title: 'Molecular Structure of Nucleic Acids: A Structure for Deoxyribose Nucleic Acid', venue: 'Nature 171 (4356): 737–738', doi: '10.1038/171737a0' },
      introduces: ['bioinf-1.1'],
      statement: String.raw`Watson and Crick proposed a structure for the salt of deoxyribose nucleic acid: **two helical chains, both right-handed, coiled round one common axis**, with the phosphate–sugar backbones on the outside and the bases on the inside, perpendicular to the axis. A residue occurs every $3.4\ \text{Å}$ along the axis, with an angle of $36^\circ$ between adjacent residues of one chain, so the structure repeats after $10$ residues, i.e. after $34\ \text{Å}$; a phosphorus atom lies $10\ \text{Å}$ from the axis. The chains are related by a dyad perpendicular to the axis, so their atom sequences run in **opposite directions**. The chains are held together by hydrogen bonds between bases at equal height: each pair is one purine with one pyrimidine, and, taking the usual keto tautomers, only **adenine–thymine** and **guanine–cytosine** can bond. The base sequence along one chain is unrestricted, but it then **determines the sequence of the other**. The paper presents this as compatible with, but not yet proved by, the X-ray data.`,
      idea: String.raw`Before 1953 the facts on the table were Chargaff's equalities (A:T and G:C ratios close to $1$ in DNA from every species), the X-ray diffraction pictures that suggested a helix, and the chemistry of the chain (3′,5′ phosphodiester links). A constant diameter requires that every rung of the ladder be the same width, and a purine (two rings) plus a pyrimidine (one ring) always fits where two purines would be too wide and two pyrimidines too narrow. Hydrogen-bonding chemistry then allows only A–T and G–C, which *explains* Chargaff's rule and makes the second strand the reverse complement of the first (item 1.1). The paper's closing sentence points out that this "immediately suggests a possible copying mechanism": separate the strands and let each template specify its partner, the scheme Meselson and Stahl put to the test five years later (1.14).`,
      caption: String.raw`**Type one strand** (5′→3′): the helix is built to the paper's own numbers (3.4 Å rise, 36° turn per residue, ten residues and 34 Å per turn, phosphorus at 10 Å from the axis; groove widths are only schematic) and the second strand is forced; drag to rotate and see both backbones run in opposite directions (blue strand 5′ at the bottom, orange 3′). Right: slide *copying* to unzip the helix from the left and let each old strand specify a new one; the two daughter duplexes each keep one old strand. Switch the pairing to *unconstrained* and the partner is no longer determined: the Chargaff ratios drift from 1 and there is nothing to copy.`,
      deps: ['xtal-8.9'],
      refs: [],
      credit: 'Watson & Crick, 1953 (Nature 171, 737–738)',
      tags: ['dna structure', 'base pairing', 'paper'],
      links: { doi: 'https://doi.org/10.1038/171737a0' },
      viz(v) {
        let renderState = null;
        const inp = v.input('strand 1, 5′→3′', 'ATGCGTAACGGCTTAGCCAT', { width: 230 });
        const pairS = v.select('pairing', [{ value: 'wc', label: 'Watson–Crick: A–T, G–C' }, { value: 'any', label: 'unconstrained' }], 'wc');
        const copyS = v.slider('copying: fraction unzipped', 0, 1, 0.5, { step: 0.02 });
        const labT = v.toggle('base letters', true);
        const s3 = v.stage3d({ range: 4.2, height: 430, yaw: -0.55, pitch: 0.22, axes: false, weight: 1, minWidth: 300, title: 'the double helix (1 unit = 10 Å)' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430, weight: 1.15, minWidth: 330, title: 'the copying mechanism the pairing suggests' });
        const seqNow = () => cleanDNA(inp.value, 28) || 'A';
        const partner = (s) => (pairS.value === 'wc' ? comp(s) : randomDNA(rng(hashSeed('any' + s)), s.length));
        v.render(() => {
          const x = seqNow(), n = x.length, y = partner(x), RISE = 0.34, TURN = Math.PI / 5, OFF = (150 * Math.PI) / 180, R = 1;
          s3.o.range = Math.max(3.4, RISE * n / 2 + 1.1);
          const zc = (i) => RISE * (i - (n - 1) / 2), ph = (i, o) => [R * Math.cos(TURN * i + o), R * Math.sin(TURN * i + o), zc(i)];
          s3.begin();
          const hel = (o, col) => { const pts = []; for (let q = -0.4; q <= n - 1 + 0.4 + 1e-9; q += 0.1) pts.push([R * Math.cos(TURN * q + o), R * Math.sin(TURN * q + o), zc(q)]); s3.path(pts, { color: col, width: 3.4 }); };
          hel(0, 'accent'); hel(OFF, 'orange');
          for (let i = 0; i < n; i++) {
            const p1 = ph(i, 0), p2 = ph(i, OFF), m = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, p1[2]];
            s3.line(p1, m, { color: BCOL[x[i]], width: 5 }); s3.line(m, p2, { color: BCOL[y[i]], width: 5 });
            s3.dot(p1, { r: 3.6, color: 'accent' }); s3.dot(p2, { r: 3.6, color: 'orange' });
            if (labT.value) { const a = [p1[0] + (m[0] - p1[0]) * 0.55, p1[1] + (m[1] - p1[1]) * 0.55, p1[2]], b = [p2[0] + (m[0] - p2[0]) * 0.55, p2[1] + (m[1] - p2[1]) * 0.55, p2[2]]; s3.text(x[i], a, { size: 11, color: BCOL[x[i]] }); s3.text(y[i], b, { size: 11, color: BCOL[y[i]] }); }
          }
          const top = ph(n - 1, 0), bot = ph(0, 0), top2 = ph(n - 1, OFF), bot2 = ph(0, OFF);
          s3.text('5′', [bot[0], bot[1], bot[2] - 0.35], { color: 'accent', size: 14 }); s3.text('3′', [top[0], top[1], top[2] + 0.35], { color: 'accent', size: 14 });
          s3.text('3′', [bot2[0], bot2[1], bot2[2] - 0.35], { color: 'orange', size: 14 }); s3.text('5′', [top2[0], top2[1], top2[2] + 0.35], { color: 'orange', size: 14 });
          // 34 Å repeat
          const z0 = zc(0) - 0.17, z1 = z0 + 3.4, xr = 1.75; s3.arrow([xr, 0, z0], [xr, 0, z1], { color: 'green', width: 1.8, head: 8 }); s3.arrow([xr, 0, z1], [xr, 0, z0], { color: 'green', width: 1.8, head: 8 }); s3.text('34 Å = 10 residues', [xr, 0, (z0 + z1) / 2], { color: 'green', size: 12, dx: 2, align: 'left' });
          s3.end();
          // ---- ladder / copying
          const P = pxer(v, s2), W = P.W, H = P.H, cw = Math.min(30, (W - 120) / n), x0 = 100, th = Math.min(26, cw + 2), u = Math.round(copyS.value * n);
          const yP1 = H / 2 - th / 2 - 2, yP2 = H / 2 + th / 2 + 2, ys = [44, 44 + th + 5, H - 44 - 2 * th - 5, H - 44 - th];
          const tile = (ch, i, yy, o) => { P.rect(x0 + i * cw + 0.8, yy - th / 2, cw - 1.6, th, ch === '?' ? 'faint' : BCOL[ch], o.alpha, 4, o.stroke, o.sw || 1.5); P.text(ch, x0 + i * cw + cw / 2, yy + 0.5, { size: Math.min(14, cw * 0.62), weight: 750, align: 'center', color: o.col || 'ink' }); };
          const comp1 = x.split('').map((c, i) => (pairS.value === 'wc' ? comp(c) : '?')), copy1 = x.split('').map((c, i) => (pairS.value === 'wc' ? c : '?'));
          for (let i = 0; i < n; i++) {
            if (i < u) { tile(x[i], i, ys[0] + th / 2, { alpha: 0.5, stroke: 'ink', sw: 1.8 }); tile(comp1[i], i, ys[1] + th / 2, { alpha: 0.2, stroke: 'gold', sw: 1.8 }); tile(copy1[i], i, ys[2] + th / 2, { alpha: 0.2, stroke: 'gold', sw: 1.8 }); tile(y[i], i, ys[3] + th / 2, { alpha: 0.5, stroke: 'ink', sw: 1.8 }); }
            else { tile(x[i], i, yP1, { alpha: 0.5, stroke: 'ink', sw: 1.8 }); tile(y[i], i, yP2, { alpha: 0.5, stroke: 'ink', sw: 1.8 }); P.line(x0 + i * cw + cw / 2, yP1 + th / 2 + 1, x0 + i * cw + cw / 2, yP2 - th / 2 - 1, 'muted', 1.4); }
          }
          for (let i = 0; i < u; i++) { P.line(x0 + i * cw + cw / 2, ys[0] + th + 1, x0 + i * cw + cw / 2, ys[1] + 1, 'muted', 1.2); P.line(x0 + i * cw + cw / 2, ys[2] + th + 1, x0 + i * cw + cw / 2, ys[3] + 1, 'muted', 1.2); }
          if (u > 0 && u < n) { const fx = x0 + u * cw; P.path([[fx, yP1], [fx - 2, ys[0] + th / 2]], 'muted', 2.2); P.path([[fx, yP2], [fx - 2, ys[3] + th / 2]], 'muted', 2.2); P.path([[fx, yP1], [fx - 2, ys[1] + th / 2]], 'faint', 1.6, 1); }
          const lab = (txt, yy, c) => P.text(txt, x0 - 8, yy, { size: 11.5, weight: 700, color: c || 'muted', align: 'right' });
          if (u > 0) { lab('old strand 1', ys[0] + th / 2, 'ink'); lab('new', ys[1] + th / 2, 'gold'); lab('new', ys[2] + th / 2, 'gold'); lab('old strand 2', ys[3] + th / 2, 'ink'); }
          lab(u < n ? 'strand 1' : '', yP1, 'ink'); lab(u < n ? 'strand 2' : '', yP2, 'ink');
          P.text("5′ →", x0 + n * cw + 6, u < n ? yP1 : ys[0] + th / 2, { size: 11, color: 'muted' }); P.text("← 3′", x0 + n * cw + 6, u < n ? yP2 : ys[3] + th / 2, { size: 11, color: 'muted' });
          P.text(pairS.value === 'wc' ? (u === 0 ? 'before copying: one duplex' : u === n ? 'after copying: two duplexes, each = one old + one new strand' : 'the fork moves right; each old strand templates a new partner') : 'with no pairing rule a template does not determine its partner: "?"', 12, 16, { size: 12.5, weight: 700, color: pairS.value === 'wc' ? 'ink' : 'red' });
          renderState = { x, y, n };
        });
        v.legend([['accent', 'strand 1 backbone'], ['orange', 'strand 2 backbone'], ['green', 'A', { dot: true }], ['blue', 'C', { dot: true }], ['orange', 'G', { dot: true }], ['red', 'T', { dot: true }]]);
        v.readout(() => {
          if (!renderState) return ''; const { x, y, n } = renderState, c = (ch) => (x + y).split(ch).length - 1, A = c('A'), T = c('T'), G = c('G'), C = c('C'), ok = A === T && G === C;
          return `${n} base pairs = ${(3.4 * n).toFixed(1)} Å of axis, ${(n / 10).toFixed(1)} turns (36° per residue) · over both chains A=${A}, T=${T}, G=${G}, C=${C}: A/T = ${T ? (A / T).toFixed(2) : '–'}, G/C = ${C ? (G / C).toFixed(2) : '–'} ${ok ? '— Chargaff\'s equalities hold ✓' : '— no longer equal: Chargaff\'s rule fails without the pairing rule'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.14
    {
      num: '1.14',
      kind: 'Paper',
      name: 'The Replication of DNA in Escherichia coli',
      paper: { authors: 'Matthew Meselson and Franklin W. Stahl', year: 1958, title: 'The replication of DNA in Escherichia coli', venue: 'Proceedings of the National Academy of Sciences 44 (7): 671–682', doi: '10.1073/pnas.44.7.671' },
      introduces: [],
      statement: String.raw`Meselson and Stahl grew *E. coli* for many generations on $^{15}$N (heavy) ammonium, switched the culture to ordinary $^{14}$N and took samples at known numbers of generations. DNA of different density separates into bands when spun to equilibrium in a caesium chloride density gradient. They found: heavy DNA at generation 0; after **one generation a single band of intermediate (hybrid) density**, halfway between the heavy and light bands; at **two generations equal amounts of hybrid and light DNA** (the photograph at 1.9 generations), and thereafter more light and an ever smaller fraction of hybrid. When hybrid DNA is heated (100 °C, 30 min) it falls into **two species in equal amounts**, one heavy and one light, each of about half the original apparent molecular weight. Together these results support **semiconservative replication**: each daughter duplex consists of one old and one new strand, and the old strands are passed on intact; they exclude the conservative and the dispersive schemes.`,
      idea: String.raw`Three schemes were on the table after Watson and Crick (1.13). *Conservative*: the old duplex stays whole and a new, all-light duplex is made, so there are only heavy and light bands and never a hybrid. *Dispersive*: old and new material are interspersed in every strand, so a single band that moves steadily from heavy to light, never splitting into two. *Semiconservative*: after one generation every duplex is half heavy (one band at the hybrid density), after two generations half the duplexes are still hybrid and half are light. Which one is true is read off the number and positions of the bands at generations $1$ and $2$; the heat-denaturation test then separates a hybrid made of whole heavy and whole light strands from one with mixed strands. The model for the bands here is a mixture of Gaussians of equal width, a simplification of the paper's measured band shapes. Numbers: the paper gives a buoyant density of 1.71 g/cm³ for ordinary DNA and a separation of 0.014 g/cm³ between $^{14}$N and $^{15}$N DNA (so $\approx1.724$ for fully heavy DNA, our derived value); the paper's heated DNA also rises in density by about 0.015 g/cm³ and its strands are about half the molecular weight, which the picture ignores (it keeps the strand bands at the duplex positions).`,
      caption: String.raw`Choose a **replication hypothesis**: the left panel is the sequence of UV-absorption pictures (ten sampling times as in the paper's photographs; the bottom strip follows the generation slider). The curve is the densitometer trace of the sample at the chosen generation, with the other two hypotheses faint, and the bubble chart shows where the bands sit and how heavy they are at every generation. Only the semiconservative scheme gives one hybrid band at generation 1 and about equal hybrid and light bands at generation 1.9 (the paper's photograph; exactly equal at 2). Tick *heat-denature* to separate the strands: a semiconservative hybrid splits into equal heavy and light halves, whereas the dispersive scheme gives one band, not two (the conservative scheme already failed the generation-1 test).`,
      deps: ['bioinf-1.13'],
      refs: [],
      credit: 'Meselson & Stahl, 1958 (PNAS 44, 671–682)',
      tags: ['dna replication', 'density gradient', 'paper'],
      links: { doi: 'https://doi.org/10.1073/pnas.44.7.671' },
      viz(v) {
        let renderState = null;
        const GENS = [0, 0.3, 0.7, 1.0, 1.1, 1.5, 1.9, 2.5, 3.0, 4.1], RL = 1.710, DR = 0.014, RM = RL + DR / 2, RH = RL + DR;
        const MODELS = { semi: 'semiconservative', cons: 'conservative', disp: 'dispersive' };
        const mS = v.select('hypothesis', Object.entries(MODELS).map(([value, label]) => ({ value, label })), 'semi');
        const gS = v.slider('generation $g$', 0, 5, 1.9, { step: 0.1 });
        const heat = v.toggle('heat-denature (single strands)', false);
        const sdS = v.slider('band width $\\sigma$ (g/cm³ × 10⁻³)', 0.5, 3, 1.1, { step: 0.1 });
        const sP = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, weight: 1, minWidth: 300, title: 'UV-absorption pictures of the CsCl gradient (heavy ← → light)' });
        const sD = v.stage({ x: [1.7, 1.73], y: [0, 1], axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 300, xlabel: 'density ρ (g/cm³)', ylabel: 'absorbance (relative)', title: 'densitometer trace' });
        const sF = v.stage({ x: [0, 5], y: [1.705, 1.729], axes: 'box', gutter: true, height: 210, full: true, xlabel: 'generations after the shift to $^{14}$N', ylabel: 'band density ρ', title: 'bands at every generation (disc area ∝ amount of DNA)' });
        const species = (model, g, den) => {
          const a = 2 ** -g, f = 2 ** g;
          if (den) { if (model === 'disp') return [{ rho: RL + DR * a, w: 1 }]; return [{ rho: RH, w: a }, { rho: RL, w: 1 - a }].filter((s) => s.w > 1e-9); }
          if (model === 'semi') { if (g <= 1) return [{ rho: RH, w: (2 - f) / f }, { rho: RM, w: (2 * f - 2) / f }].filter((s) => s.w > 1e-9); return [{ rho: RM, w: 2 / f }, { rho: RL, w: 1 - 2 / f }].filter((s) => s.w > 1e-9); }
          if (model === 'cons') return [{ rho: RH, w: a }, { rho: RL, w: 1 - a }].filter((s) => s.w > 1e-9);
          return [{ rho: RL + DR * a, w: 1 }];
        };
        const trace = (sp, rho, sg) => sp.reduce((t, s) => t + s.w * Math.exp(-0.5 * ((rho - s.rho) / sg) ** 2) / (sg * Math.sqrt(2 * Math.PI)), 0);
        const bands = (sp, sg) => { // resolved peaks of the trace
          const xs = []; for (let r = 1.700; r <= 1.7341; r += 0.0001) xs.push(r); const ys = xs.map((r) => trace(sp, r, sg)), mx = Math.max(...ys); const pk = [];
          for (let i = 1; i < xs.length - 1; i++) if (ys[i] > ys[i - 1] && ys[i] >= ys[i + 1] && ys[i] > 0.08 * mx) pk.push({ rho: xs[i], h: ys[i] });
          return pk;
        };
        v.render(() => {
          const model = mS.value, sg = sdS.value * 1e-3, den = heat.value, g = gS.value, P = pxer(v, sP), c = P.c;
          const rows = [...GENS.map((x) => ({ g: x, live: false })), { g, live: true }], rh = Math.min(30, (P.H - 30) / rows.length), x0 = 40, x1 = P.W - 56, rr0 = 1.700, rr1 = 1.730;
          rows.forEach((r, i) => {
            const y = 12 + i * rh + (r.live ? 8 : 0), sp = species(model, r.g, den), hgt = rh - 5;
            P.rect(x0, y, x1 - x0, hgt, 'panel', 1, 4, r.live ? 'gold' : 'faint', r.live ? 2 : 1);
            const tr = [], N = Math.round(x1 - x0); let mx = 0; for (let q = 0; q < N; q++) { const t = trace(sp, rr1 - (rr1 - rr0) * q / N, sg); tr.push(t); if (t > mx) mx = t; }
            const ref = trace([{ rho: RH, w: 1 }], RH, sg);
            for (let q = 0; q < N; q++) { const a = clamp(tr[q] / ref * 0.95, 0, 0.95); if (a > 0.02) { c.fillStyle = v.color('ink', a); c.fillRect(x0 + q, y + 2, 1.2, hgt - 4); } }
            P.text(r.live ? `g = ${r.g.toFixed(1)}` : r.g.toFixed(1), x1 + 8, y + hgt / 2, { size: 11.5, weight: r.live ? 800 : 600, color: r.live ? 'gold' : 'muted' });
          });
          P.text('ρ = 1.730', x0, P.H - 6, { size: 10.5, color: 'muted' }); P.text('1.700', x1, P.H - 6, { size: 10.5, color: 'muted', align: 'right' });
          // ---- trace
          const sp = species(model, g, den); let top = 0.001;
          for (const m of Object.keys(MODELS)) for (let r = 1.700; r <= 1.730; r += 0.0003) top = Math.max(top, trace(species(m, g, den), r, sg));
          sD.setView([1.70, 1.73], [0, top * 1.1]); sD.setTicks([[1.70, '1.700'], [1.71, '1.710'], [1.72, '1.720'], [1.73, '1.730']], []);
          for (const m of Object.keys(MODELS)) if (m !== model) sD.fn((r) => trace(species(m, g, den), r, sg), { color: 'muted', width: 1.4, alpha: 0.55, n: 260, dash: true });
          sD.fn((r) => trace(sp, r, sg), { color: 'accent', width: 3, fill: true, base: 0, fillAlpha: 0.2, n: 260 });
          [[RL, '14N DNA'], [RM, 'hybrid'], [RH, '15N DNA']].forEach(([r, t]) => { sD.vline(r, { color: 'faint', width: 1, dash: true }); sD.text(t, r, top * 1.04, { size: 11, color: 'muted', align: 'center' }); });
          // ---- bubble chart
          sF.hline(RM, { color: 'faint', dash: true, width: 1 });
          for (let q = 0; q <= 50; q++) { const gg = q / 10; for (const s of species(model, gg, den)) sF.dot(gg, s.rho, { r: Math.max(1.5, 9 * Math.sqrt(s.w)), color: s.rho > RM + 0.002 ? 'orange' : s.rho < RM - 0.002 ? 'accent' : 'green', alpha: 0.55, ring: false }); }
          GENS.forEach((gg) => sF.vline(gg, { color: 'faint', width: 0.8 })); sF.vline(g, { color: 'gold', width: 2.2 });
          renderState = { sp, pk: bands(sp, sg) };
        });
        v.legend([['accent', 'selected hypothesis (density trace)', { area: true }], ['muted', 'the other two (dashed)', { area: false }], ['orange', 'heavy', { dot: true }], ['green', 'hybrid', { dot: true }], ['accent', 'light', { dot: true }]]);
        v.readout(() => {
          const sg = sdS.value * 1e-3, g = gS.value, out = [];
          const chk = (m) => {
            const a = bands(species(m, 1.0, false), sg), b = bands(species(m, 1.9, false), sg), d = bands(species(m, 1.0, true), sg), sp19 = species(m, 1.9, false);
            const A = a.length === 1 && Math.abs(a[0].rho - RM) < 0.0015, B = b.length === 2 && sp19.length === 2 && Math.abs(sp19[0].w - sp19[1].w) < 0.12 && Math.abs(b[0].rho - RL) < 0.0015, C = d.length === 2 && Math.abs(species(m, 1.0, true)[0].w - 0.5) < 0.05;
            return [A, B, C];
          };
          const tick = (x) => (x ? '✓' : '✗'), res = Object.entries(MODELS).map(([m, name]) => { const [A, B, C] = chk(m); return `${name}: ${tick(A)} ${tick(B)} ${tick(C)}`; }).join(' · ');
          const sp = renderState.sp, pk = renderState.pk;
          return `At $g=${g.toFixed(1)}$ ${heat.value ? '(strands)' : '(duplexes)'}: ${pk.length} resolved band${pk.length === 1 ? '' : 's'} at ρ = ${pk.map((p) => p.rho.toFixed(4)).join(', ')} with amounts ${sp.map((s) => (100 * s.w).toFixed(0) + '%').join(' / ')} · fractions: semiconservative $2^{1-g}$ hybrid for $g\\ge1$, conservative $2^{-g}$ heavy, dispersive one band at $\\rho_L+0.014\\cdot2^{-g}$\n**Paper's three observations** (✓ = reproduced) — single hybrid band at $g=1$; hybrid and light in about equal amounts at $g\approx2$ (photographed at 1.9); heated hybrid splits into equal heavy and light halves: ${res}\n*Paper (PNAS 44:671): ¹⁴N DNA 1.71 g/cm³, ¹⁴N–¹⁵N separation 0.014 (so ¹⁵N ≈ 1.724, derived); sampling times as in its Fig. 4; band shapes are idealized Gaussians and heated strands are drawn at the duplex positions.*`;
        });
      },
    },
  ],
};
