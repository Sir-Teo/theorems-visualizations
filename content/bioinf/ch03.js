// Bioinformatics Algorithms — Chapter 3: Alignment statistics and database search (items 3.1–3.5)
import {
  PROT, BG, matFlat, NCBI, lambdaOf, lengthAdj, mkRng, randAA, shuffleCodes, seqOf, swScore, maxUngapped, excursions, lcs, randDNA, swLinear,
  moments, gumbelPdf, gumbelSf, normSf, normPdf, EULER, fx,
} from './ch03.shared.js';

const NAMES = { HBB_HUMAN: 'β-globin', HBA_HUMAN: 'α-globin', CYC_HUMAN: 'cytochrome c', THIO_HUMAN: 'thioredoxin' };

// integer-lattice histogram: counts of integer scores in [lo, hi] as {edges, counts} (density)
function latticeHist(xs, lo, hi) {
  const c = new Array(hi - lo + 1).fill(0); for (const x of xs) { const k = Math.round(x); if (k >= lo && k <= hi) c[k - lo]++; }
  return { edges: Array.from({ length: hi - lo + 2 }, (_, i) => lo + i - 0.5), counts: c.map((q) => q / xs.length) };
}
const normQuantile = (p) => { let a = -9, b = 9; for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (1 - normSf(m, 0, 1) < p) a = m; else b = m; } return (a + b) / 2; };

export default {
  collection: 'bioinf',
  chapter: 3,
  title: 'Alignment statistics and database search',
  summary: String.raw`A high alignment score means something only if random sequences rarely reach it. For local alignments, Karlin–Altschul theory shows maximal scores follow an extreme-value law, giving E-values and bit scores; global scores behave very differently, growing linearly. These statistics, combined with seed-and-extend heuristics, make BLAST fast and trustworthy, and spaced seeds improve its sensitivity.`,
  items: [
    // ───────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Concept',
      name: 'Score distribution of random alignments',
      statement: String.raw`Fix a query and a scoring system, and align the query locally against many random sequences of the same length and composition. The best local score $S$ is then a random variable, and its distribution is not a bell curve: it is skewed, with a short left side and a long right tail that decays roughly exponentially. To judge whether an observed score $S_0$ is surprising one needs the *upper tail* $P(S\ge S_0)$ of this null distribution, and a normal curve fitted to its mean and spread badly misjudges exactly that tail.`,
      idea: String.raw`The best local score is a maximum over roughly $nm$ possible alignment end-points, and a maximum of many nearly independent scores is controlled by the rare large values rather than by the typical ones; this is why the left side is compact while the right tail is long. Each cell's score is the result of the recursion of item 2.6, so the null distribution can be sampled directly by running Smith–Waterman on shuffled or randomly drawn sequences. Items 3.3–3.5 explain the shape of this histogram precisely.`,
      caption: String.raw`The query is human β-globin; the histogram is the best local score of the query against random sequences. Choose the null model (shuffles of the subject, which keep its composition, or i.i.d. residues from the Robinson background) and whether gaps are allowed. The gold line is the score of the query against the real subject, the dashed curve is a normal fit with the same mean and spread. With α-globin the real score sits far out in the tail; with cytochrome c or thioredoxin it falls inside the bulk. The right panel is a normal quantile plot of the standardised scores: a straight line would mean "normal", and the upward bend is the heavy right tail.`,
      scope: String.raw`Scores here are BLOSUM62 with gap cost $11+k$ for a gap of length $k$ (ungapped: best segment only). Shuffles of a real protein are only an approximation to "random": they keep composition but destroy low-complexity and local order, which real databases contain.`,
      deps: ['bioinf-2.6'],
      refs: ['Durbin ch. 2'],
      tags: ['alignment statistics', 'null distribution', 'local alignment'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sequence_alignment' },
      viz(v) {
        const subj = v.select('subject', [{ value: 'HBA_HUMAN', label: 'α-globin' }, { value: 'CYC_HUMAN', label: 'cytochrome c' }, { value: 'THIO_HUMAN', label: 'thioredoxin' }], 'HBA_HUMAN');
        const nullM = v.select('null model', [{ value: 'shuffle', label: 'shuffled subject' }, { value: 'iid', label: 'i.i.d. background' }], 'shuffle');
        const mode = v.select('alignment', [{ value: 'gapped', label: 'gapped' }, { value: 'ungapped', label: 'ungapped' }], 'gapped');
        const nS = v.slider('random sequences', 100, 1500, 600, { int: true, step: 50 });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const sH = v.stage({ x: [0, 100], y: [0, 0.1], axes: 'box', gutter: true, height: 380, xlabel: 'best local score $S$', ylabel: 'probability', title: 'scores of the query against random sequences', minWidth: 380, weight: 1.5 });
        const sQ = v.stage({ x: [-3, 3.5], y: [-3, 5], axes: 'box', gutter: true, height: 380, xlabel: 'normal quantile', ylabel: 'standardised score', title: 'normal quantile plot', minWidth: 260 });
        const Q = seqOf('HBB_HUMAN'), S = matFlat('blosum62'), cache = {};
        const score = (a, b) => (mode.value === 'gapped' ? swScore(a, b, S, 12, 1) : maxUngapped(a, b, S));
        const data = () => {
          const key = `${subj.value}|${nullM.value}|${mode.value}|${seed}`; let c = cache[key];
          if (!c) {
            const sub = seqOf(subj.value), r = mkRng(seed * 977 + 13);
            c = cache[key] = { real: score(Q, sub), xs: [], r, sub };
          }
          while (c.xs.length < nS.value) c.xs.push(score(Q, nullM.value === 'shuffle' ? shuffleCodes(c.r, c.sub) : randAA(c.r, c.sub.length)));
          return { real: c.real, xs: c.xs.slice(0, nS.value) };
        };
        let info = null;
        v.render(() => {
          const D = data(), xs = D.xs, M = moments(xs), lo = Math.max(0, Math.floor(Math.min(...xs)) - 2), nmax = Math.ceil(Math.max(...xs));
          const far = D.real > nmax + 40, hi = far ? nmax + 30 : Math.max(nmax, Math.ceil(D.real)) + 4;
          const H = latticeHist(xs, lo, hi), ymax = Math.max(...H.counts) * 1.25;
          sH.setView([lo - 1, hi + 1], [0, ymax]);
          sH.hist(H, { color: 'accent', fillAlpha: 0.35 });
          sH.fn((x) => normPdf(x, M.mean, M.sd), { color: 'purple', dash: true, width: 2, domain: [lo, hi] });
          sH.vline(M.mean, { color: 'muted', dash: true });
          if (far) { sH.arrow(hi - 14, ymax * 0.55, hi + 0.6, ymax * 0.55, { color: 'gold', head: 9 }); sH.text(`real subject: $S_0=${D.real}$ (off scale)`, hi - 1, ymax * 0.64, { align: 'right', size: 12.5, color: 'gold' }); }
          else { sH.vline(D.real, { color: 'gold', width: 3 }); sH.text(`real subject: $S_0=${D.real}$`, D.real - 0.5, ymax * 0.93, { align: D.real > (lo + hi) / 2 ? 'right' : 'left', size: 12.5, color: 'gold' }); }
          // normal quantile plot
          const srt = xs.slice().sort((a, b) => a - b), pts = [];
          for (let i = 0; i < srt.length; i += Math.max(1, Math.floor(srt.length / 160))) pts.push([normQuantile((i + 0.5) / srt.length), (srt[i] - M.mean) / M.sd]);
          const zr = (D.real - M.mean) / M.sd, ztop = Math.max(5, ...pts.map((p) => p[1]) ) + 0.8;
          sQ.setView([-3, 3.5], [-3, Math.min(ztop, Math.max(5.5, zr + 1))]);
          sQ.line(-3, -3, 3.5, 3.5, { color: 'muted', dash: true });
          sQ.dots(pts, { r: 2.5, color: 'accent' });
          if (zr <= ztop - 0.2) { sQ.hline(zr, { color: 'gold', width: 2 }); sQ.text('real score', -2.9, zr + 0.3, { size: 12, color: 'gold' }); }
          else sQ.text(`real score: ${fx(zr, 0)} sd, off scale`, -2.9, ztop - 0.6, { size: 12, color: 'gold' });
          info = { D, M, zr, k: xs.filter((x) => x >= D.real).length };
        });
        v.legend([['accent', 'null scores', { area: true }], ['purple', 'normal fit', { dash: true }], ['gold', 'real subject']]);
        v.readout(() => {
          const { D, M, zr, k } = info, N = D.xs.length, pn = normSf(D.real, M.mean, M.sd);
          return `mean $${fx(M.mean, 1)}$, standard deviation $${fx(M.sd, 1)}$, skewness $${fx(M.skew, 2)}$ (a normal curve has $0$) over ${N} random sequences · real score $S_0=${D.real}$ is $${fx(zr, 1)}$ standard deviations above the mean\nempirical $P(S\\ge S_0)$: **${k}** of ${N}${k === 0 ? ` (so below $${fx(100 / N, 2)}\\%$)` : ''} · the normal fit would claim $${pn < 1e-6 ? '<10^{-6}' : fx(pn, 4)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Chvátal–Sankoff: random LCS length grows linearly',
      statement: String.raw`Let $X_1,\dots,X_n$ and $Y_1,\dots,Y_n$ be independent i.i.d. uniform letters from an alphabet of size $k$, and let $L_n$ be the length of their longest common subsequence. Then $\mathbb E[L_n]/n$ converges to a constant $\gamma_k\in(0,1)$, and $L_n/n\to\gamma_k$ almost surely: the LCS of two random strings is a positive fraction of their length. For the binary alphabet $\gamma_2$ is not known in closed form; it lies between $0.7926$ and $0.8263$.`,
      idea: String.raw`Cut the two strings into a first block of length $m$ and a second block of length $n$: a common subsequence of the first blocks and one of the second blocks concatenate, so $\mathbb E[L_{m+n}]\ge \mathbb E[L_m]+\mathbb E[L_n]$. A superadditive sequence has $a_n/n\to\sup_m a_m/m$ (Fekete's lemma, item prob-2.7.1), which gives the limit; concentration of $L_n$ around its mean (changing one letter changes $L_n$ by at most 1) upgrades this to almost-sure convergence. The same dynamic programme as in item 2.2 computes every $L_n$ below.`,
      caption: String.raw`Each dot is the ratio $L_n/n$ for one random pair; the line is the mean over the samples, the band is plus or minus one standard deviation. The ratio climbs and settles while the band narrows, and the green strip marks the published bounds for $k=2$. Raise the alphabet size and the constant falls; the dashed line at $2/\sqrt k$ is only the large-alphabet asymptote. The right panel shows that the spread of $L_n/n$ shrinks like $n^{-1/2}$ (dashed guide).`,
      scope: String.raw`Proved for i.i.d. uniform letters (more generally i.i.d. letters, and some dependent models). The exact value of $\gamma_k$ is unknown for every $k$ ; the strip for $k=2$ shows the best bounds I could confirm (lower bound by Heineman et al., 2024; upper bound 0.826280). The number of samples here is small, so the means carry sampling error of a few thousandths.`,
      credit: 'Chvátal & Sankoff, 1975',
      deps: ['bioinf-2.2', 'prob-2.7.1'],
      refs: ['Compeau–Pevzner ch. 5'],
      tags: ['longest common subsequence', 'random sequences', 'subadditivity'],
      links: { doi: 'https://doi.org/10.2307/3212444', wikipedia: 'https://en.wikipedia.org/wiki/Chv%C3%A1tal%E2%80%93Sankoff_constants' },
      viz(v) {
        const kS = v.slider('alphabet size $k$', 2, 20, 2, { int: true });
        const rS = v.slider('samples per length', 4, 40, 16, { int: true });
        let seed = 1;
        v.button('Resample', () => { seed++; });
        const NS = [8, 16, 32, 64, 128, 256, 512, 1024];
        const sA = v.stage({ x: [6, 1500], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 400, xlabel: 'string length $n$', ylabel: '$L_n/n$', title: 'LCS length as a fraction of $n$', minWidth: 380, weight: 1.5 });
        const sB = v.stage({ x: [6, 1500], y: [0.001, 0.5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, xlabel: 'string length $n$', ylabel: 'standard deviation of $L_n/n$', title: 'the spread shrinks', minWidth: 260 });
        const cache = {};
        const run = () => {
          const key = `${kS.value}|${rS.value}|${seed}`; if (cache[key]) return cache[key];
          const r = mkRng(seed * 31 + kS.value), rows = NS.map((n) => {
            const reps = n >= 512 ? Math.max(3, Math.round(rS.value / 3)) : rS.value, vals = [];
            for (let t = 0; t < reps; t++) vals.push(lcs(randDNA(r, n, kS.value), randDNA(r, n, kS.value)) / n);
            const M = moments(vals); return { n, vals, mean: M.mean, sd: M.sd };
          });
          return (cache[key] = rows);
        };
        let info = null;
        v.render(() => {
          const R = run(), k = kS.value, all = R.flatMap((q) => q.vals);
          const lo = Math.max(0, Math.floor((Math.min(...all) - 0.03) * 20) / 20), hi = Math.min(1.02, Math.max(...all) + 0.04);
          sA.setView([6, 1500], [k === 2 ? Math.min(lo, 0.6) : lo, Math.max(hi, k === 2 ? 0.9 : 0)]);
          if (k === 2) { sA.hband(0.792665992, 0.82628, { color: 'green', alpha: 0.18 }); sA.text('known bounds for $k=2$', 1400, 0.842, { size: 11.5, color: 'green', align: 'right' }); }
          else { sA.hline(2 / Math.sqrt(k), { color: 'muted', dash: true }); sA.text('$2/\\sqrt{k}$', 7.5, 2 / Math.sqrt(k) + 0.012, { size: 11.5, color: 'muted' }); }
          sA.poly([...R.map((q) => [q.n, q.mean + q.sd]), ...R.slice().reverse().map((q) => [q.n, q.mean - q.sd])], { fill: 'accent', fillAlpha: 0.15, stroke: false });
          R.forEach((q, i) => q.vals.forEach((x, j) => sA.dot(q.n * (1 + 0.08 * (((j * 7 + i * 3) % 11) / 11 - 0.5)), x, { r: 2.2, color: 'faint' })));
          sA.path(R.map((q) => [q.n, q.mean]), { color: 'accent', width: 2.4 });
          sA.dots(R.map((q) => [q.n, q.mean]), { r: 4, color: 'accent' });
          const pts = R.map((q) => [q.n, q.sd]);
          sB.setView([6, 1500], [Math.max(1e-4, Math.min(...pts.map((p) => p[1])) / 2), Math.max(...pts.map((p) => p[1])) * 2]);
          sB.path(pts, { color: 'orange', width: 2 }); sB.dots(pts, { r: 3.5, color: 'orange' });
          const [n0, s0] = pts[1]; sB.path(NS.map((n) => [n, s0 * Math.sqrt(n0 / n)]), { color: 'muted', dash: true });
          info = { R, k };
        });
        v.legend([['accent', 'mean of $L_n/n$'], ['faint', 'single pairs', { dot: true }], ['orange', 'standard deviation'], ['muted', 'guide $\\propto n^{-1/2}$', { dash: true }]]);
        v.readout(() => {
          const { R, k } = info, a = R[0], b = R[R.length - 1];
          return `$k=${k}$: mean $L_n/n$ is $${fx(a.mean, 3)}$ at $n=${a.n}$ and $${fx(b.mean, 3)}$ at $n=${b.n}$ (increasing, as superadditivity predicts) · standard deviation $${fx(a.sd, 3)}\\to${fx(b.sd, 4)}$${k === 2 ? `\nestimate of $\\gamma_2$ from $n=1024$: $${fx(b.mean, 3)}$ — inside the proven interval $[0.7927,\\,0.8263]$: ${b.mean >= 0.7927 && b.mean <= 0.8263 ? 'yes' : 'not at this sample size (finite $n$ and few samples)'}` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Linear-to-logarithmic phase transition of local scores',
      statement: String.raw`Score two random sequences of length $n$ locally, with match $+1$, mismatch $-\mu$ and gap penalty $-\delta$ per residue. The optimal local score $S_n$ has a phase transition in $(\mu,\delta)$: there is a region of small penalties where $S_n/n$ converges to a positive constant (*linear growth*), and a region of large penalties where $S_n/\log n$ converges to a constant (*logarithmic growth*). With no gaps allowed the boundary is where the expected score of a random aligned pair, $\mathbb E[s]$, is zero.`,
      idea: String.raw`A local alignment starts afresh whenever its running score falls to $0$, so $S_n$ is the largest excursion of a random walk with steps $s$ over about $n^2$ starting places. If $\mathbb E[s]<0$ excursions have exponentially small probability $e^{-\lambda h}$ of reaching height $h$, and the largest of $n^2$ trials reaches only $h\approx 2\ln n/\lambda$. If $\mathbb E[s]>0$ the walk drifts upward and runs for length proportional to $n$. Allowing gaps lets the alignment buy better pairings, which pushes the boundary towards larger penalties; Arratia and Waterman proved that the transition exists for the gapped problem; the longest common subsequence of item 3.2 is a special case, on the linear side.`,
      caption: String.raw`The left map colours each pair $(\mu,\delta)$ by the growth exponent $\alpha$ in $S_n\propto n^{\alpha}$, measured from simulated random DNA at $n=60$ and $n=360$ (about linear, $\alpha\approx1$: dark; logarithmic, $\alpha$ small: pale). Drag the handle: the right panel shows $S_n$ against $n$ for that choice, on logarithmic axes, with a linear and a logarithmic fit. The dashed vertical line is the exact no-gap boundary $\mu=1/3$; in this simulation, gaps cheaper than about $1$ keep the growth linear whatever the mismatch penalty, and between the two regimes the boundary bends away from $\mu=1/3$.`,
      scope: String.raw`Simulation on i.i.d. uniform four-letter sequences with linear gap costs, at only two lengths and three samples per cell, so the colours blur near the boundary and a cell's exponent has noise of a few hundredths. The exact boundary is known in closed form only for the no-gap limit; for gapped alignment the curve in the $(\mu,\delta)$ plane is characterised but not explicit.`,
      credit: 'Arratia & Waterman, 1994',
      deps: ['bioinf-3.1'],
      refs: ['Durbin ch. 2'],
      tags: ['phase transition', 'local alignment', 'random sequences'],
      links: { doi: 'https://doi.org/10.1214/aoap/1177005208' },
      viz(v) {
        const MU = [0.1, 3], DE = [0.1, 3], G = 14, N1 = 60, N2 = 360, REP = 3;
        const sM = v.stage({ x: MU, y: DE, axes: 'box', gutter: true, height: 420, xlabel: 'mismatch penalty $\\mu$', ylabel: 'gap penalty $\\delta$', title: 'growth exponent of the best local score', minWidth: 340 });
        const sG = v.stage({ x: [10, 600], y: [1, 400], xlog: true, ylog: true, axes: 'box', gutter: true, height: 420, xlabel: 'sequence length $n$', ylabel: 'best local score $S_n$', title: 'score against length', minWidth: 300 });
        const h = sM.handle(0.6, 0.6, { color: 'gold', r: 8, label: '', constrain: { x: MU, y: DE } });
        let seed = 1; v.button('Resample', () => { seed++; });
        const cell = {};
        const mean = (mu, de, n, reps, r) => { let a = 0; for (let t = 0; t < reps; t++) a += swLinear(randDNA(r, n), randDNA(r, n), mu, de); return a / reps; };
        const grid = () => {
          const key = `g${seed}`; if (cell[key]) return cell[key];
          const r = mkRng(seed * 101 + 5), A = [];
          for (let j = 0; j < G; j++) { const row = []; for (let i = 0; i < G; i++) {
            const mu = MU[0] + ((i + 0.5) * (MU[1] - MU[0])) / G, de = DE[0] + ((j + 0.5) * (DE[1] - DE[0])) / G;
            const s1 = mean(mu, de, N1, REP, r), s2 = mean(mu, de, N2, REP, r);
            row.push(Math.max(0, Math.min(1.1, Math.log(Math.max(s2, 1e-9) / Math.max(s1, 1e-9)) / Math.log(N2 / N1))));
          } A.push(row); }
          return (cell[key] = A);
        };
        const NS = [16, 32, 64, 128, 256, 384];
        const curve = (mu, de) => {
          const key = `c${Math.round(mu * 20)}|${Math.round(de * 20)}|${seed}`; if (cell[key]) return cell[key];
          const r = mkRng(seed * 7 + Math.round(mu * 20) * 131 + Math.round(de * 20)); return (cell[key] = NS.map((n) => ({ n, s: Math.max(0.5, mean(mu, de, n, n >= 256 ? 4 : 8, r)) })));
        };
        const fit = (pts) => { // compare S = a n  with S = a ln n + b (least squares in the plane, residual relative to S)
          const sse = (f) => pts.reduce((t, p) => t + ((f(p.n) - p.s) / p.s) ** 2, 0);
          let a = 0, b = 0; for (const p of pts) { a += p.s / p.n; } a /= pts.length;
          const X = pts.map((p) => Math.log(p.n)), Y = pts.map((p) => p.s), mx = X.reduce((s, x) => s + x, 0) / X.length, my = Y.reduce((s, x) => s + x, 0) / Y.length;
          let sxy = 0, sxx = 0; X.forEach((x, i) => { sxy += (x - mx) * (Y[i] - my); sxx += (x - mx) ** 2; }); const la = sxy / sxx, lb = my - la * mx;
          // linear model fitted on relative error: a = mean(S/n) is adequate for the comparison
          return { a, la, lb, eLin: sse((n) => a * n), eLog: sse((n) => la * Math.log(n) + lb) };
        };
        let info = null;
        v.render(() => {
          const A = grid();
          sM.raster((x, y) => { const i = Math.floor(((x - MU[0]) / (MU[1] - MU[0])) * G), j = Math.floor(((y - DE[0]) / (DE[1] - DE[0])) * G); if (i < 0 || j < 0 || i >= G || j >= G) return null; return v.ramp(Math.min(1, A[j][i]), 'accent'); }, { res: 3, key: `r${seed}` });
          sM.axes();
          sM.vline(1 / 3, { color: 'ink', dash: true, width: 1.6 });
          sM.text('no-gap boundary $\\mu=1/3$', 1 / 3 + 0.05, 2.85, { size: 11.5, color: 'ink' });
          sM.colorbar([0, 1], (t) => v.ramp(t, 'accent'), { pos: 'right', label: 'exponent α', ticks: [0, 0.5, 1] });
          const mu = h.x, de = h.y, C = curve(mu, de), F = fit(C);
          sG.setView([10, 600], [Math.max(0.5, Math.min(...C.map((p) => p.s)) / 1.6), Math.max(...C.map((p) => p.s)) * 2.2]);
          sG.fn((n) => F.a * n, { color: 'orange', dash: true, width: 1.8, domain: [12, 560] });
          sG.fn((n) => Math.max(0.01, F.la * Math.log(n) + F.lb), { color: 'green', dash: true, width: 1.8, domain: [12, 560] });
          sG.path(C.map((p) => [p.n, p.s]), { color: 'accent', width: 2.2 }); sG.dots(C.map((p) => [p.n, p.s]), { r: 4, color: 'accent' });
          info = { mu, de, C, F, al: Math.log(C[C.length - 1].s / C[1].s) / Math.log(C[C.length - 1].n / C[1].n) };
        });
        v.legend([['accent', 'simulated $S_n$', { dot: true }], ['orange', 'linear fit $an$', { dash: true }], ['green', 'logarithmic fit $a\\ln n+b$', { dash: true }]]);
        v.readout(() => {
          const { mu, de, F, al } = info, Es = 0.25 - 0.75 * mu;
          return `$\\mu=${fx(mu, 2)}$, $\\delta=${fx(de, 2)}$: exponent between $n=32$ and $n=384$ is $\\alpha=${fx(al, 2)}$ · the data are fitted better by a **${F.eLin < F.eLog ? 'linear' : 'logarithmic'}** law (relative squared error $${fx(Math.min(F.eLin, F.eLog), 3)}$ against $${fx(Math.max(F.eLin, F.eLog), 3)}$)\nwithout gaps the expected score of an aligned pair is $\\mathbb E[s]=\\tfrac14-\\tfrac34\\mu=${fx(Es, 2)}$, so ${Es < 0 ? 'ungapped scores would grow only logarithmically' : 'ungapped scores would grow linearly'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Karlin–Altschul statistics',
      statement: String.raw`Let random sequences have i.i.d. letters with frequencies $q_a$, and let the pair scores $s_{ab}$ be integers with negative expected value $\sum q_aq_bs_{ab}<0$ and at least one positive entry. Then the equation $\sum_{a,b}q_aq_b\,e^{\lambda s_{ab}}=1$ has a unique positive root $\lambda$, and the number of distinct locally optimal ungapped segment pairs of score at least $S$ between sequences of lengths $m$ and $n$ is asymptotically Poisson with mean $E=K\,m\,n\,e^{-\lambda S}$, where $K$ is a constant depending only on the scores and the frequencies.`,
      idea: String.raw`A segment's score is a random walk with steps $s_{ab}$ and negative drift. The exponential tilting $e^{\lambda s}$ with $\lambda$ solving the equation makes the tilted step distribution a probability distribution under which the walk drifts upward, and a change of measure then gives the probability $\approx C e^{-\lambda h}$ that the walk ever climbs to height $h$. There are $mn$ places where such a climb can start, and high excursions are rare and nearly independent, which gives a Poisson count; the constant $K$ absorbs the overlap and edge effects. Item 3.3 shows what fails when the expected score is not negative.`,
      caption: String.raw`Each simulated pair of random protein sequences (Robinson frequencies) is scanned for locally maximal segments; the dots are the average number of segments with score at least $S$ and the solid line is the prediction $Kmne^{-\lambda S}$ with the NCBI constants. The right panel is $\sum q_aq_be^{\lambda s_{ab}}-1$ as a function of $\lambda$: the root is the value where the curve returns to zero. Switch the matrix, or shift every score by a constant, and watch $\lambda$ move. Shift by $+1$ to make the expected score positive: the root disappears and the simulation no longer follows any exponential law. Shorter sequences fall below the line (edge effects).`,
      scope: String.raw`Needs integer scores (a lattice, handled by the same formula with the given $\lambda$), negative mean score and at least one positive score. For *gapped* alignment there is no proof of this law, only extensive empirical evidence; $\lambda$ and $K$ for gapped scoring are fitted by simulation (item 3.6). The constants $K$ quoted are the NCBI BLAST values; $K$ is not computed here, only compared with the simulated value.`,
      credit: 'Karlin & Altschul, 1990',
      deps: ['bioinf-3.1', 'bioinf-3.3'],
      refs: ['Durbin ch. 2'],
      tags: ['Karlin–Altschul', 'extreme values', 'Poisson'],
      links: { doi: 'https://doi.org/10.1073/pnas.87.6.2264' },
      viz(v) {
        const mat = v.select('matrix', [{ value: 'blosum62', label: 'BLOSUM62' }, { value: 'pam250', label: 'PAM250' }], 'blosum62');
        const shift = v.slider('add a constant to every score', -2, 1, 0, { int: true });
        const len = v.slider('sequence length $m=n$', 100, 1500, 800, { int: true, step: 50 });
        const reps = v.slider('random pairs', 2, 40, 12, { int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const sC = v.stage({ x: [0, 50], y: [-2, 4], axes: 'box', gutter: true, height: 400, xlabel: 'score threshold $S$', ylabel: '$\\log_{10}$ (mean number of segments $\\ge S$)', title: 'counts of random high-scoring segments', minWidth: 380, weight: 1.5 });
        const sF = v.stage({ x: [0, 1.2], y: [-0.7, 1], axes: 'box', gutter: true, height: 400, xlabel: '$\\lambda$', ylabel: '$\\sum q_aq_b e^{\\lambda s_{ab}}-1$', title: 'the equation for $\\lambda$', minWidth: 260 });
        const cache = {};
        const sim = () => {
          const key = `${mat.value}|${shift.value}|${len.value}|${reps.value}|${seed}`; if (cache[key]) return cache[key];
          const S = matFlat(mat.value, shift.value), r = mkRng(seed * 17 + len.value), cnt = new Float64Array(400), m = len.value;
          for (let t = 0; t < reps.value; t++) excursions(randAA(r, m), randAA(r, m), S, cnt);
          const tail = new Float64Array(401); for (let k = 399; k >= 0; k--) tail[k] = tail[k + 1] + cnt[k];
          return (cache[key] = { tail, cnt });
        };
        let info = null;
        v.render(() => {
          const S = matFlat(mat.value, shift.value), L = lambdaOf(S), P = shift.value === 0 ? NCBI[mat.value] : null, m = len.value, R = reps.value;
          sF.setView([0, 1.2], [-0.7, 1]);
          sF.hline(0, { color: 'muted' });
          sF.fn((l) => L.F(l), { color: 'accent', width: 2.4, domain: [0, 1.2] });
          if (L.lambda) { sF.dot(L.lambda, 0, { r: 6, color: 'green' }); sF.text(`$\\lambda=${fx(L.lambda, 4)}$`, L.lambda + 0.03, 0.14, { size: 12.5, color: 'green' }); }
          else sF.text('no positive root: $\\mathbb E[s]\\ge0$', 0.06, 0.8, { size: 12.5, color: 'red' });
          let Khat = null, slope = null, pts = [];
          if (L.lambda) {
            const T = sim().tail, lam = L.lambda;
            for (let s = 4; s < 200; s++) { const c = T[s]; if (c >= 8) pts.push([s, c / R]); }
            const ks = pts.filter((p) => T[p[0]] >= 40).map((p) => p[1] / (m * m * Math.exp(-lam * p[0]))).sort((a, b) => a - b);
            if (ks.length) Khat = ks[Math.floor(ks.length / 2)];
            const fitp = pts.filter((p) => T[p[0]] >= 40);
            if (fitp.length > 3) { const n = fitp.length, X = fitp.map((p) => p[0]), Y = fitp.map((p) => Math.log(p[1])), mx = X.reduce((a, b) => a + b) / n, my = Y.reduce((a, b) => a + b) / n; let a = 0, b = 0; X.forEach((x, i) => { a += (x - mx) * (Y[i] - my); b += (x - mx) ** 2; }); slope = a / b; }
            const smax = pts.length ? pts[pts.length - 1][0] + 4 : 40;
            sC.setView([0, Math.max(30, smax + 2)], [Math.floor(Math.log10(Math.max(1 / R, Math.min(...pts.map((p) => p[1]))))) - 0.5, Math.ceil(Math.log10(Math.max(...pts.map((p) => p[1]), 1))) + 0.3]);
            const Kuse = P ? P.K : Khat;
            if (P) sC.fn((s) => Math.log10(P.K * m * m * Math.exp(-lam * s)), { color: 'green', width: 2.4, domain: [0, 200] });
            if (Khat) sC.fn((s) => Math.log10(Khat * m * m * Math.exp(-lam * s)), { color: 'orange', width: 1.6, dash: true, domain: [0, 200] });
            sC.dots(pts.map((p) => [p[0], Math.log10(p[1])]), { r: 2.8, color: 'accent' });
            sC.setLabels(undefined, '$\\log_{10}$ (mean number of segments $\\ge S$)');
            info = { L, P, Khat, slope, Kuse };
          } else {
            // positive drift: the best ungapped score grows linearly with the length
            const r = mkRng(seed * 3 + 1), ns = [50, 100, 200, 400, 800], ys = ns.map((n) => [n, maxUngapped(randAA(r, n), randAA(r, n), S)]);
            sC.setView([0, 900], [0, Math.max(...ys.map((p) => p[1])) * 1.15]);
            sC.path(ys, { color: 'red', width: 2.2 }); sC.dots(ys, { r: 4, color: 'red' });
            sC.setLabels('sequence length $n$', 'best ungapped score');
            sC.text('no exponential law: best score grows linearly', 450, ys[ys.length - 1][1] * 0.35, { align: 'center', size: 12.5, color: 'red' });
            info = { L, P, none: true };
          }
        });
        v.legend([['accent', 'simulation', { dot: true }], ['green', 'NCBI $K$', {}], ['orange', 'fitted $\\hat K$', { dash: true }]]);
        v.readout(() => {
          const { L, P, Khat, slope } = info;
          if (info.none) return `expected score per pair $\\mathbb E[s]=${fx(L.mean, 3)}\\ge0$: the equation has no positive root, so the theorem does not apply — scores grow in proportion to the length (item 3.3).`;
          return `expected score $\\mathbb E[s]=${fx(L.mean, 3)}$ · root $\\lambda=${fx(L.lambda, 4)}$ (relative entropy $H=${fx(L.H, 3)}$ nats)${P ? ` — NCBI lists $\\lambda=${P.lambda}$, $K=${P.K}$, $H=${P.H}$` : ''}\nslope of the simulated log counts gives $\\hat\\lambda=${slope === null ? '—' : fx(-slope, 3)}$ · simulated $\\hat K=${Khat ? fx(Khat, 3) : '—'}$${P ? ` (NCBI $K=${P.K}$)` : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Concept',
      name: 'Extreme-value (Gumbel) distribution of maximal scores',
      statement: String.raw`For random sequences of lengths $m,n$ with the Karlin–Altschul parameters $\lambda,K$, the maximal local score $S_{\max}$ is approximately Gumbel distributed:
$$P(S_{\max}\ge x)\;\approx\;1-\exp\!\big(-K\,mn\,e^{-\lambda x}\big),$$
a Gumbel law with location $u=\ln(Kmn)/\lambda$ and scale $1/\lambda$. Its mean is $u+\gamma_E/\lambda$ and its standard deviation $\pi/(\lambda\sqrt6)$. In the upper tail $P(S_{\max}\ge x)\approx Kmn\,e^{-\lambda x}$, so $\log P$ is a straight line of slope $-\lambda$.`,
      idea: String.raw`By item 3.4 the number of segments scoring at least $x$ is Poisson with mean $E(x)=Kmne^{-\lambda x}$, and $S_{\max}<x$ exactly when that number is zero, which has probability $e^{-E(x)}$: this is the Gumbel distribution function. Changing the lengths only changes $E$ by a factor $mn$, so only the location $u$ moves, by $\ln(mn)/\lambda$, and the shape stays fixed. A normal curve has a tail that bends down like $e^{-x^2/2}$, far lighter than the exponential tail of the Gumbel.`,
      caption: String.raw`Histogram of the best score over random sequence pairs (left) and the same data as a log survival plot (right). The green curve is the Gumbel law with the NCBI constants, or with parameters fitted by moments (choose with the selector); the dashed purple curve is a normal law with the same mean and spread. On the log plot the Gumbel tail is the straight line of slope $-\lambda/\ln10$ per score unit, while the normal curve bends away. Change the length: the whole distribution slides by $\ln(mn)/\lambda$ and keeps its shape.`,
      scope: String.raw`Exact asymptotics are proved for ungapped scores. For gapped scores (gaps $11+k$, BLOSUM62) the same form is an empirical law with fitted $\lambda=0.267$, $K=0.041$ (NCBI); at the short lengths used here the sample mean is a little above the prediction, which shows the finite-size error. The BLAST-style length adjustment $\ell$ replaces $m,n$ by $m-\ell,\ n-\ell$ to correct for edge effects.`,
      deps: ['bioinf-3.4'],
      refs: ['Durbin ch. 2'],
      tags: ['Gumbel', 'extreme values', 'tail'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gumbel_distribution' },
      viz(v) {
        const model = v.select('scores', [{ value: 'ungapped', label: 'ungapped BLOSUM62' }, { value: 'gapped', label: 'gapped BLOSUM62' }], 'ungapped');
        const fitSel = v.select('curve', [{ value: 'ka', label: 'NCBI $\\lambda,K$' }, { value: 'mom', label: 'fitted by moments' }], 'ka');
        const nS = v.slider('sequence length $m=n$', 60, 300, 150, { int: true, step: 10 });
        const kS = v.slider('random pairs', 100, 600, 300, { int: true, step: 50 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const sH = v.stage({ x: [0, 60], y: [0, 0.2], axes: 'box', gutter: true, height: 380, xlabel: 'maximal score $S_{\\max}$', ylabel: 'probability', title: 'maximal scores of random pairs', minWidth: 340 });
        const sL = v.stage({ x: [0, 60], y: [-3, 0], axes: 'box', gutter: true, height: 380, xlabel: 'score $x$', ylabel: '$\\log_{10}P(S_{\\max}\\ge x)$', title: 'log survival', minWidth: 340 });
        const S = matFlat('blosum62'), cache = {};
        const scores = () => {
          const key = `${model.value}|${nS.value}|${seed}`; let c = cache[key];
          if (!c) c = cache[key] = { r: mkRng(seed * 59 + nS.value), xs: [] };
          while (c.xs.length < kS.value) { const a = randAA(c.r, nS.value), b = randAA(c.r, nS.value); c.xs.push(model.value === 'gapped' ? swScore(a, b, S, 12, 1) : maxUngapped(a, b, S)); }
          return c.xs.slice(0, kS.value);
        };
        let info = null;
        v.render(() => {
          const xs = scores(), M = moments(xs), P = model.value === 'gapped' ? NCBI.gapped62 : NCBI.blosum62, n = nS.value, N = xs.length;
          const l = lengthAdj(P.K, P.H, n, n), uKA = Math.log(P.K * (n - l) * (n - l)) / P.lambda, bKA = 1 / P.lambda;
          const bMo = (M.sd * Math.sqrt(6)) / Math.PI, uMo = M.mean - EULER * bMo;
          const [u, b] = fitSel.value === 'ka' ? [uKA, bKA] : [uMo, bMo];
          const lo = Math.max(0, Math.floor(u - 2.2 * b)), hi = Math.ceil(u + 9 * b);
          const H = latticeHist(xs, lo, hi);
          const pk = []; for (let k = lo; k <= hi; k++) pk.push([k, gumbelSf(k - 0.5, u, b) - gumbelSf(k + 0.5, u, b)]);
          sH.setView([lo - 1, hi + 1], [0, Math.max(...H.counts, ...pk.map((p) => p[1])) * 1.2]);
          sH.hist(H, { color: 'accent', fillAlpha: 0.3 });
          sH.fn((x) => normPdf(x, M.mean, M.sd), { color: 'purple', dash: true, width: 2, domain: [lo, hi] });
          sH.path(pk, { color: 'green', width: 2.6 }); sH.dots(pk, { r: 2.6, color: 'green' });
          // log survival
          const sv = []; for (let k = lo; k <= hi; k++) { const c = xs.filter((x) => x >= k).length; if (c >= 1) sv.push([k, Math.log10(c / N)]); }
          const ymin = Math.log10(0.5 / N) - 0.4;
          sL.setView([lo, hi], [ymin, 0.15]);
          sL.fn((x) => Math.log10(Math.max(1e-300, gumbelSf(x - 0.5, u, b))), { color: 'green', width: 2.6, domain: [lo, hi] });
          sL.fn((x) => -(x - 0.5 - u) / b / Math.LN10, { color: 'green', dash: true, width: 1.4, domain: [u, hi], alpha: 0.7 });
          sL.fn((x) => Math.log10(Math.max(1e-300, normSf(x - 0.5, M.mean, M.sd))), { color: 'purple', dash: true, width: 2, domain: [lo, hi] });
          sL.dots(sv, { r: 3, color: 'accent' });
          info = { M, u, b, uKA, bKA, uMo, bMo, P, l, N };
        });
        v.legend([['accent', 'simulated', { area: true }], ['green', 'Gumbel law'], ['purple', 'normal, same mean and spread', { dash: true }]]);
        v.readout(() => {
          const { M, uKA, bKA, uMo, bMo, P, l } = info;
          return `simulated mean $${fx(M.mean, 2)}$, standard deviation $${fx(M.sd, 2)}$ · NCBI constants ($\\lambda=${P.lambda}$, $K=${P.K}$, length adjustment $\\ell=${fx(l, 0)}$): location $u=${fx(uKA, 2)}$, scale $1/\\lambda=${fx(bKA, 2)}$, so mean $${fx(uKA + EULER * bKA, 2)}$ and standard deviation $${fx((Math.PI / Math.sqrt(6)) * bKA, 2)}$\nmoment fit: $u=${fx(uMo, 2)}$, scale $${fx(bMo, 2)}$ (the tail slope is $-1/(${fx(bMo, 2)}\\ln10)=${fx(-1 / bMo / Math.LN10, 3)}$ per unit)`;
        });
      },
    },
  ],
};
