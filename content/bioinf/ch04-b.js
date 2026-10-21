// Bioinformatics Algorithms — Chapter 4, part b: posterior decoding, Baum–Welch, gene finding, pair and profile HMMs, numerics (items 4.7–4.12)
import {
  NUC, mkRng, sumArr, f3, log2, fx, BG, AA, codes, randAA, matFlat, swScore,
  sampleHMM, viterbi, forwardScaled, posterior, baumWelchStep, forwardRaw, forwardLog, casino,
  pairHMM, buildProfile, profileViterbi, simulateFamily, deriveMember, memberString, cleanSeq, fromStr, toStr,
} from './ch04.shared.js';

function drawRuns(s, path, y0, y1, colors, o = {}) {
  let a = 0;
  for (let t = 1; t <= path.length; t++) if (t === path.length || path[t] !== path[a]) { const c = colors[path[a]]; s.rect(a, y0, t, y1, { fill: c, fillAlpha: o.alpha || 0.4, color: c, width: 1 }); a = t; }
}
const sciT = (x) => { if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); const m = x / 10 ** e; return `${m.toFixed(1)}e${e < 0 ? '−' : ''}${Math.abs(e)}`; };
const sciTex = (x) => { const e = Math.floor(Math.log10(x)); return `${(x / 10 ** e).toFixed(1)}\\times10^{${e}}`; };
const meanSd = (xs) => { const m = sumArr(xs) / xs.length; return [m, Math.sqrt(sumArr(xs.map((x) => (x - m) ** 2)) / Math.max(1, xs.length - 1))]; };

// ───────────────────────────── a toy gene-finding HMM (states N, E1, E2, E3, I); every number is invented for illustration
const GENE_N = [0.2333, 0.2167, 0.3333, 0.2167];
const GENE_CODING = [[0.20, 0.10, 0.55, 0.15], [0.35, 0.20, 0.10, 0.35], [0.15, 0.35, 0.35, 0.15]];
const GENE_INTRON = [0.32, 0.18, 0.18, 0.32];
function geneModel(sig) {
  const mix = (a) => a.map((x, i) => (1 - sig) * GENE_N[i] + sig * x);
  return {
    K: 5, M: 4, names: ['N', 'E1', 'E2', 'E3', 'I'],
    A: [[0.99, 0.01, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [0.015, 0.97, 0, 0, 0.015], [0, 0.03, 0, 0, 0.97]],
    E: [GENE_N, mix(GENE_CODING[0]), mix(GENE_CODING[1]), mix(GENE_CODING[2]), GENE_INTRON], pi: [0.7, 0.3, 0, 0, 0],
  };
}
const geneClass = (s) => (s === 0 ? 0 : s === 4 ? 2 : 1); // 0 intergenic, 1 exon, 2 intron

export default {
  collection: 'bioinf',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Algorithm',
      name: 'Backward algorithm and posterior decoding',
      statement: String.raw`The backward variable $\beta_t(k)=P(x_{t+1},\dots,x_T\mid \pi_t=k)$ obeys
$$\beta_T(k)=1,\qquad \beta_t(j)=\sum_{k}a_{jk}\,e_k(x_{t+1})\,\beta_{t+1}(k).$$
Combined with the forward variable (4.6) it gives the posterior probability of a state at a position,
$$\gamma_t(k)=P(\pi_t=k\mid x)=\frac{\alpha_t(k)\,\beta_t(k)}{P(x)},$$
and $P(x)=\sum_k\alpha_t(k)\beta_t(k)$ for every $t$. Posterior decoding, $\hat\pi_t=\arg\max_k\gamma_t(k)$, maximises the expected number of correctly assigned positions, whereas Viterbi (4.4) maximises the probability of the whole path.`,
      idea: String.raw`Splitting a path at time $t$ factorises $P(x,\pi_t=k)$ into the part before (including $x_t$), which is $\alpha_t(k)$, and the part after, which given $\pi_t=k$ is independent of the past by the Markov property: that is $\beta_t(k)$. Dividing by $P(x)$ (forward, 4.6) gives a conditional probability. Because every position is decided separately, the decoded labels maximise expected accuracy but may not form a probable path, while Viterbi gives a coherent path that can be wrong in many places; the posterior also says *how sure* each label is.

Conditional probability in stat-2.1, applied to the finite joint mass function with $P(x)>0$, divides $P(x,\pi_t=k)=\alpha_t(k)\beta_t(k)$ by the observation likelihood. The factorization uses the HMM's conditional independence of future and past given the current state. For unrestricted positionwise labels, prob-1.6.1 makes expected correct positions the sum of the selected posterior probabilities, so each term is maximized by its own posterior mode. A requirement that the labels form an allowed state path would be a different optimization problem.`,
      caption: String.raw`The blue curve is the posterior probability that each roll came from the loaded die, using the whole sequence; the purple dashed curve uses only the rolls up to the current position (filtering, the forward variable alone) and so reacts late. Orange shading marks the truly loaded stretches and the top strip is the Viterbi path. The bars average the per-position accuracy of the three decoders over 120 fresh simulated sequences with the current settings.`,
      scope: String.raw`The decoders use the true model parameters; with learned parameters they would be less accurate (4.8). The averaged accuracies are Monte-Carlo estimates (120 sequences), so the ordering of two close bars can flip from run to run; the theoretical statement is that posterior decoding has the highest expected accuracy.`,
      credit: 'Baum, Petrie, Soules & Weiss, 1970',
      deps: ['bioinf-4.6','stat-2.1','prob-1.6.1'],
      refs: ['Durbin ch. 3'],
      tags: ['posterior decoding', 'forward-backward', 'hmm'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Forward%E2%80%93backward_algorithm', doi: 'https://doi.org/10.1214/aoms/1177697196' },
      viz(v) {
        const Ts = v.slider('rolls $T$', 40, 200, 100, { int: true, step: 10 });
        const sw = v.slider('switching rate', 0.04, 0.4, 0.1, { step: 0.01 });
        const p6 = v.slider('loaded die: $P(6)$', 0.3, 0.8, 0.5, { step: 0.05 });
        const showF = v.toggle('show filtering', true);
        let seed = 1; v.button('Resample', () => { seed++; });
        const sA = v.stage({ x: [0, 100], y: [0, 1.2], axes: 'box', gutter: true, height: 270, full: true, xlabel: 'roll number', ylabel: '$P(\\text{loaded})$', title: 'posterior probability of the loaded die' });
        const sB = v.stage({ x: [0, 3], y: [0.5, 1], axes: 'box', gutter: true, xticks: [[0.5, 'Viterbi'], [1.5, 'posterior mode'], [2.5, 'filtering']], height: 230, minWidth: 320, ylabel: 'fraction of positions correct', title: 'average accuracy over 120 sequences' });
        const cache = {};
        const mc = (h, T, key) => {
          if (cache[key]) return cache[key];
          const r = mkRng(4242), acc = [[], [], []];
          for (let i = 0; i < 120; i++) {
            const S = sampleHMM(h, T, r), V = viterbi(h, S.obs), G = posterior(h, S.obs), F = forwardScaled(h, S.obs);
            let a = 0, b = 0, c = 0;
            for (let t = 0; t < T; t++) { if (V.path[t] === S.path[t]) a++; if ((G.gamma[t][1] > 0.5 ? 1 : 0) === S.path[t]) b++; if ((F.alpha[t][1] > 0.5 ? 1 : 0) === S.path[t]) c++; }
            acc[0].push(a / T); acc[1].push(b / T); acc[2].push(c / T);
          }
          return (cache[key] = acc.map(meanSd));
        };
        const C = ['accent', 'orange'];
        let info = null;
        v.render(() => {
          const T = Ts.value, h = casino({ aFL: sw.value / 2, aLF: sw.value, p6: p6.value }), S = sampleHMM(h, T, mkRng(seed * 331 + 17));
          const V = viterbi(h, S.obs), G = posterior(h, S.obs), F = forwardScaled(h, S.obs);
          sA.setView([0, T], [0, 1.2]);
          let a = 0; for (let t = 1; t <= T; t++) if (t === T || S.path[t] !== S.path[a]) { if (S.path[a] === 1) sA.rect(a, 0, t, 1, { fill: 'orange', fillAlpha: 0.16, stroke: false }); a = t; }
          drawRuns(sA, V.path, 1.06, 1.16, C, { alpha: 0.55 });
          sA.text('Viterbi path', T * 0.995, 1.11, { align: 'right', baseline: 'middle', size: 11, color: 'muted' });
          sA.hline(0.5, { color: 'muted', dash: true });
          if (showF.value) sA.path(F.alpha.map((x, t) => [t + 0.5, x[1]]), { color: 'purple', width: 1.8, dash: true });
          sA.path(G.gamma.map((g, t) => [t + 0.5, g[1]]), { color: 'accent', width: 2.4 });
          const nOK = (f) => { let c = 0; for (let t = 0; t < T; t++) if (f(t) === S.path[t]) c++; return c; };
          const cV = nOK((t) => V.path[t]), cP = nOK((t) => (G.gamma[t][1] > 0.5 ? 1 : 0)), cF = nOK((t) => (F.alpha[t][1] > 0.5 ? 1 : 0));
          const expOK = sum(G.gamma.map((g) => Math.max(g[0], g[1])));
          const M = mc(h, T, `${T}|${sw.value}|${p6.value}`);
          const cols = ['gold', 'accent', 'purple'];
          M.forEach(([m, sd], i) => { sB.rect(i + 0.15, 0.5, i + 0.85, m, { fill: cols[i], fillAlpha: 0.45, color: cols[i], width: 1.5 }); sB.line(i + 0.5, m - sd / Math.sqrt(120), i + 0.5, m + sd / Math.sqrt(120), { color: 'ink', width: 2 }); sB.text(`${fx(100 * m, 1)}%`, i + 0.5, 0.52, { align: 'center', size: 12.5, color: 'ink', weight: 700 }); });
          info = { cV, cP, cF, T, expOK, M };
        });
        function sum(a) { return sumArr(a); }
        v.legend([['accent', 'posterior (forward–backward)'], ['purple', 'filtering (forward only)', { dash: true }], ['orange', 'true loaded stretches', { area: true }]]);
        v.readout(() => `this sequence ($T=${info.T}$): Viterbi gets $${info.cV}$ positions right, posterior mode $${info.cP}$, filtering $${info.cF}$ · the model's own expected number of correct posterior calls is $\\sum_t\\max_k\\gamma_t(k)=${fx(info.expOK, 1)}$ (calibration check) · averages: Viterbi $${fx(100 * info.M[0][0], 1)}\\%$, posterior $${fx(100 * info.M[1][0], 1)}\\%$, filtering $${fx(100 * info.M[2][0], 1)}\\%$ (error bars: $\\pm1$ s.e.)`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Algorithm',
      name: 'Baum–Welch training',
      statement: String.raw`Given observed sequences and an HMM with unknown parameters $\theta=(a,e)$, the Baum–Welch algorithm is expectation–maximisation. The E-step computes with the forward–backward algorithm the expected number of transitions $A_{jk}=\sum_t\xi_t(j,k)$ and emissions $E_k(b)=\sum_{t:x_t=b}\gamma_t(k)$ under the current $\theta$, where $\xi_t(j,k)=P(\pi_t=j,\pi_{t+1}=k\mid x)$. The M-step sets $a_{jk}=A_{jk}/\sum_{k'}A_{jk'}$ and $e_k(b)=E_k(b)/\sum_{b'}E_k(b')$. Each iteration does not decrease the likelihood $P(x\mid\theta)$, and the iteration converges to a stationary point, in general only a local maximum.`,
      idea: String.raw`The state path is a latent variable, so this is an instance of EM (stat-3.12): the expected complete-data log-likelihood under the current parameters minorises the true log-likelihood and touches it at the current $\theta$; maximising it, which for multinomial parameters just normalises expected counts, can only raise the likelihood. The expected counts are exactly the sums of $\gamma$ and $\xi$ that forward–backward (4.7) delivers. Because the likelihood surface has several local maxima (and a label-switching symmetry), the starting point matters.`,
      caption: String.raw`Rolls are simulated from a casino with $a_{FL}=0.05$, $a_{LF}=0.1$, $P(6\mid L)=\tfrac12$. The algorithm starts from the (wrong) guesses of the sliders and the **iteration** slider moves through its history. Left: the log-likelihood rises at every step and levels off near, and here slightly above, its value at the generating parameters (dashed): the fit to a finite sample can beat the truth. Right: the estimated parameters (solid) walk towards the true ones (dashed). The start distribution is held fixed at $(\tfrac23,\tfrac13)$ and is not learned.`,
      scope: String.raw`With finite data the maximum-likelihood estimate differs from the truth, and for small $N$ may even have a higher likelihood than the generating parameters: it is a fit, not a recovery. Emission probabilities were not tied between states except by the starting point (the start must break the symmetry between the two states), and only one sequence is used.`,
      credit: 'Baum, Petrie, Soules & Weiss, 1970',
      deps: ['bioinf-4.7', 'stat-3.12'],
      refs: ['Durbin ch. 3'],
      tags: ['em', 'parameter estimation', 'hmm'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Baum%E2%80%93Welch_algorithm', doi: 'https://doi.org/10.1214/aoms/1177697196' },
      viz(v) {
        const Ns = v.slider('rolls $N$', 200, 5000, 1500, { log: true, int: true, sig: 2 });
        const i6 = v.slider('start: $P(6\\mid\\text{state }2)$', 0.2, 0.6, 0.3, { step: 0.05 });
        const iA = v.slider('start: $a_{12}$', 0.05, 0.5, 0.2, { step: 0.05 });
        const iB = v.slider('start: $a_{21}$', 0.05, 0.5, 0.3, { step: 0.05 });
        const itS = v.slider('iteration', 0, 80, 20, { int: true });
        let seed = 1; v.button('Resample data', () => { seed++; });
        const sL = v.stage({ x: [0, 80], y: [0, 1], axes: 'box', gutter: true, height: 300, minWidth: 320, xlabel: 'iteration', ylabel: 'log-likelihood', title: 'log-likelihood of the data' });
        const sP = v.stage({ x: [0, 80], y: [0, 0.8], axes: 'box', gutter: true, height: 300, minWidth: 320, xlabel: 'iteration', ylabel: 'parameter value', title: 'estimated parameters' });
        const truth = casino(); truth.pi = [2 / 3, 1 / 3];
        const cache = {};
        const run = () => {
          const key = `${Ns.value}|${i6.value}|${iA.value}|${iB.value}|${seed}`; if (cache[key]) return cache[key];
          const data = sampleHMM(truth, Ns.value, mkRng(seed * 59 + Ns.value));
          const q = (1 - i6.value) / 5;
          let m = { K: 2, M: 6, names: ['1', '2'], A: [[1 - iA.value, iA.value], [iB.value, 1 - iB.value]], E: [new Array(6).fill(1 / 6), [q, q, q, q, q, i6.value]], pi: [2 / 3, 1 / 3] };
          const models = [m], ll = [];
          for (let it = 0; it < 80; it++) { const r = baumWelchStep(m, data.obs); ll.push(r.logL); m = r.h; models.push(m); }
          ll.push(forwardScaled(m, data.obs).logL);
          return (cache[key] = { models, ll, trueLL: forwardScaled(truth, data.obs).logL });
        };
        const PAR = [['a_{12}', (m) => m.A[0][1], 0.05, 'orange'], ['a_{21}', (m) => m.A[1][0], 0.1, 'teal'], ['e_2(6)', (m) => m.E[1][5], 0.5, 'accent'], ['e_1(6)', (m) => m.E[0][5], 1 / 6, 'purple']];
        let info = null;
        v.render(() => {
          const R = run(), k = itS.value;
          const lo = Math.min(...R.ll), hi = Math.max(R.trueLL, ...R.ll), pad = (hi - lo) * 0.08 + 1;
          sL.setView([0, 80], [lo - pad, hi + pad]);
          sL.hline(R.trueLL, { color: 'green', dash: true });
          sL.path(R.ll.map((l, i) => [i, l]), { color: 'accent', width: 2.2 }); sL.dot(k, R.ll[k], { r: 6, color: 'gold' });
          for (const [, f, tv, col] of PAR) { sP.hline(tv, { color: col, dash: true, alpha: 0.7 }); sP.path(R.models.map((m, i) => [i, f(m)]), { color: col, width: 2.2 }); sP.dot(k, f(R.models[k]), { r: 5, color: col }); }
          sP.vline(k, { color: 'gold', alpha: 0.6 });
          let minInc = Infinity; for (let i = 0; i < 80; i++) minInc = Math.min(minInc, R.ll[i + 1] - R.ll[i]);
          let conv = 80; for (let i = 0; i < 80; i++) if (R.ll[i + 1] - R.ll[i] < 1e-4) { conv = i; break; }
          info = { R, k, minInc, conv };
        });
        v.legend([['orange', '$a_{12}$ (true 0.05)'], ['teal', '$a_{21}$ (true 0.10)'], ['accent', '$e_2(6)$ (true 0.5)'], ['purple', '$e_1(6)$ (true 0.167)'], ['green', 'log-likelihood of true model', { dash: true }]]);
        v.readout(() => { const m = info.R.models[info.k]; return `iteration $${info.k}$: $\\log P(x)=${fx(info.R.ll[info.k], 1)}$ · $a_{12}=${f3(m.A[0][1], 3)}$, $a_{21}=${f3(m.A[1][0], 3)}$, $e_2(6)=${f3(m.E[1][5], 3)}$, $e_1(6)=${f3(m.E[0][5], 3)}$\nsmallest per-iteration change in the log-likelihood over 80 iterations: $${info.minInc.toExponential(1).replace('e', '\\times10^{').replace('-', '−')}}$ ($\\ge0$, as EM guarantees) · ${info.conv < 80 ? `the gain per iteration falls below $10^{-4}$ after iteration $${info.conv}$` : 'the gain per iteration is still above $10^{-4}$ after 80 iterations (EM can be slow near the optimum)'} · true model: $\\log P(x)=${fx(info.R.trueLL, 1)}$`; });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'Gene finding with HMMs',
      statement: String.raw`A gene finder is an HMM whose hidden states are the parts of a genome: intergenic sequence, exons, introns and so on. Because a protein-coding exon is read in codons, its states are arranged in a cycle of three, one for each codon position, each with its own base composition, and an exon can end only after a complete codon. Decoding a genomic sequence with Viterbi (4.4) gives a predicted gene structure, and posterior decoding (4.7) gives a probability of "coding" at every base. The model is useful exactly to the extent that coding and non-coding DNA have different statistics, mainly the three-periodicity of coding sequence.`,
      idea: String.raw`The signal is statistical: in coding regions the composition depends on the position within the codon (a consequence of the genetic code and codon usage), so a three-state cycle can lock on to the reading frame; introns are modelled by an extra state with different composition and a forced return to phase 0 here. The transition probabilities encode region lengths, since a state with self-transition $p$ stays for $1/(1-p)$ steps on average. The whole parse is then a dynamic program over the five states, which Viterbi solves in linear time (production gene finders such as GENSCAN use many more states, explicit length distributions and signal models for splice sites, start and stop codons).`,
      caption: String.raw`A region of 1200 bases is simulated from a small five-state model (intergenic N, exon codon positions E1–E3, intron I). The tracks compare the true annotation, the Viterbi parse and the posterior probability of coding. The **signal strength** slider interpolates the emission distributions of the exon states between the intergenic composition (0, no periodicity: the problem is hopeless) and the full periodic profile (1). The matrix shows the current emission probabilities.`,
      scope: String.raw`Toy model: all emission numbers are invented for illustration (a stylised three-periodicity, not estimated from any genome) and the region is simulated from the same model that decodes it, which makes decoding easier than in a real genome. Only introns that start and end in phase 0, no strand, no splice-site or stop-codon signals. Real gene finders such as GENSCAN (Burge & Karlin, 1997) are far richer.`,
      credit: 'Burge & Karlin, 1997 (GENSCAN)',
      deps: ['bioinf-4.4'],
      refs: ['Compeau–Pevzner ch. 10'],
      tags: ['gene finding', 'exons and introns', 'hmm'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gene_prediction', doi: 'https://doi.org/10.1006/jmbi.1997.0951' },
      viz(v) {
        const sig = v.slider('signal strength', 0, 1, 1, { step: 0.05 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = 1200, C = ['faint', 'green', 'orange'];
        const sT = v.stage({ x: [0, L], y: [1.2, 5.2], axes: false, height: 175, full: true, title: 'gene structure: true annotation and Viterbi parse' });
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 230, minWidth: 330, title: 'emission probabilities of the five states' });
        const sQ = v.stage({ x: [0, L], y: [0, 1], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'position (bases)', ylabel: '$P(\\text{coding})$' });
        const T = v.table(sM, { rows: 5, cols: 4, rowLabels: ['N', 'E1', 'E2', 'E3', 'I'], colLabels: NUC.split(''), maxCell: 52, size: 13, cornerLabel: '' });
        let info = null;
        v.render(() => {
          const h = geneModel(sig.value), S = sampleHMM(h, L, mkRng(seed * 811 + 3)), V = viterbi(h, S.obs), G = posterior(h, S.obs);
          const tc = Uint8Array.from(S.path, geneClass), pc = Uint8Array.from(V.path, geneClass);
          // exon cycles are drawn as one class; intron orange; intergenic faint
          drawRuns(sT, tc, 3.4, 4.5, C, { alpha: 0.5 }); drawRuns(sT, pc, 1.9, 3.0, C, { alpha: 0.5 });
          sT.text('true annotation', 8, 4.85, { size: 12, color: 'muted' }); sT.text('Viterbi parse', 8, 3.2, { size: 12, color: 'muted' });
          sT.text('green = exon (coding), orange = intron, grey = intergenic', L - 8, 1.55, { size: 12, color: 'muted', align: 'right' });
          const pcod = G.gamma.map((g) => g[1] + g[2] + g[3]);
          sQ.path(pcod.map((p, t) => [t + 0.5, p]), { color: 'accent', width: 1.6 }); sQ.hline(0.5, { color: 'muted', dash: true });
          let a = 0; for (let t = 1; t <= L; t++) if (t === L || tc[t] !== tc[a]) { if (tc[a] === 1) sQ.rect(a, 0, t, 1, { fill: 'green', fillAlpha: 0.14, stroke: false }); a = t; }
          let tp = 0, fp = 0, fn = 0, tn = 0, ex = 0;
          for (let t = 0; t < L; t++) { const tr = tc[t] === 1, pr = pc[t] === 1; if (tr && pr) tp++; else if (!tr && pr) fp++; else if (tr && !pr) fn++; else tn++; if (tc[t] === pc[t]) ex++; }
          T.draw({ value: (i, j) => h.E[i][j], format: 2, heat: (i, j) => Math.min(1, h.E[i][j] / 0.55), cmap: 'viridis' });
          info = { sens: tp / Math.max(1, tp + fn), prec: tp / Math.max(1, tp + fp), all: ex / L, nCod: tp + fn };
        });
        v.legend([['green', 'exon', { area: true }], ['orange', 'intron', { area: true }], ['accent', 'posterior of coding']]);
        v.readout(() => `${info.nCod} of 1200 bases are truly coding · base-level sensitivity $${fx(100 * info.sens, 1)}\\%$, precision $${fx(100 * info.prec, 1)}\\%$ · bases labelled with the right class (exon / intron / intergenic): $${fx(100 * info.all, 1)}\\%$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Model',
      name: 'Pair HMMs for alignment',
      statement: String.raw`A pair HMM generates two sequences at once. State $M$ emits an aligned pair $(a,b)$ with probability $p_{ab}$, state $X$ emits a letter $a$ of the first sequence against a gap with probability $q_a$, and state $Y$ does the same for the second. Gap opening has probability $\delta$ (from $M$ to $X$ or $Y$), gap extension $\varepsilon$, and $\tau$ ends the process. Every alignment of $x$ and $y$ is one path, so the Viterbi path (4.4) is the best alignment (affine-gap Needleman–Wunsch with log-odds scores, 2.7), the forward algorithm sums over all alignments to give $P(x,y)$, and
$$P(x_i\diamond y_j\mid x,y)=\frac{f^M(i,j)\,b^M(i,j)}{P(x,y)}$$
is the posterior probability that $x_i$ is aligned to $y_j$.`,
      idea: String.raw`The scores of an affine-gap alignment are logarithms of the pair HMM's probabilities: $\log p_{ab}/(q_aq_b)$ for a match column, $\log\delta$ and $\log\varepsilon$ for gap opening and extension, so the dynamic program is Viterbi on the HMM (a three-state lattice indexed by $(i,j)$). Replacing max by sum gives the forward algorithm, and the backward pass (4.7) yields the posterior of each aligned pair. The best alignment can carry only a small part of the total probability when there are many near-optimal alternatives; the posteriors then show which columns are reliable.`,
      caption: String.raw`Rows are the letters of $x$, columns those of $y$; the colour of cell $(i,j)$ is the posterior probability that $x_i$ is aligned with $y_j$ (all alignments weighted by their probability), and gold outlines are the match cells of the single best (Viterbi) alignment. Lower the identity or raise the gap opening rate and the posterior spreads over neighbouring diagonals; edit the sequences freely (DNA, up to 30 letters).`,
      scope: String.raw`The emission model is the simplest one (a single parameter for the identity, uniform background); $\tau$ is fixed at $0.01$ and the model starts in the match state, following Durbin et al. Posterior probabilities depend on the assumed parameters, which here are not trained. The default pair is a simulated one: a random sequence and a copy with substitutions and indels.`,
      credit: 'Durbin, Eddy, Krogh & Mitchison, 1998',
      deps: ['bioinf-4.6', 'bioinf-2.7'],
      refs: ['Durbin ch. 4'],
      tags: ['pair hmm', 'alignment', 'posterior probability'],
      viz(v) {
        const ident = v.slider('identity of aligned pairs', 0.4, 0.99, 0.8, { step: 0.01 });
        const dlt = v.slider('gap opening $\\delta$', 0.01, 0.25, 0.06, { step: 0.01 });
        const eps = v.slider('gap extension $\\varepsilon$', 0.1, 0.8, 0.4, { step: 0.05 });
        let X = '', Y = '';
        const mkPair = (sd) => {
          const r = mkRng(sd * 77 + 5), a = []; for (let i = 0; i < 22; i++) a.push(Math.floor(r() * 4));
          const b = []; for (let i = 0; i < a.length; i++) { const u = r(); if (u < 0.07) continue; if (u < 0.15) { b.push(Math.floor(r() * 4)); b.push(a[i]); continue; } b.push(r() < 0.18 ? Math.floor(r() * 4) : a[i]); }
          return [toStr(a), toStr(b)];
        };
        let seed = 1; [X, Y] = mkPair(seed);
        const xin = v.input('$x$', X, { width: 230, onChange: (z) => { X = cleanSeq(z, 'ACGT', 30) || 'A'; } });
        const yin = v.input('$y$', Y, { width: 230, onChange: (z) => { Y = cleanSeq(z, 'ACGT', 30) || 'A'; } });
        v.button('New pair', () => { seed++; [X, Y] = mkPair(seed); xin.set(X); yin.set(Y); });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 440, full: true });
        const T = v.table(st, { rows: 4, cols: 4, maxCell: 24, minCell: 10, size: 10, labelSize: 11 });
        let info = null;
        v.render(() => {
          const x = fromStr(X), y = fromStr(Y), P = pairHMM(x, y, { delta: dlt.value, eps: eps.value, tau: 0.01, ident: ident.value });
          const hl = P.vit.filter((o) => o[0] === 0).map(([, i, j]) => [i - 1, j - 1, 'gold']);
          T.draw({ rows: x.length, cols: y.length, rowLabels: X.split(''), colLabels: Y.split(''), value: () => null, heat: (i, j) => Math.sqrt(P.post[i][j]), cmap: 'viridis', highlight: hl, cornerLabel: '' });
          const exp = sumArr(P.post.map(sumArr)), mp = P.post.map((r) => Math.max(...r));
          info = { lt: P.total, lv: Math.exp(P.logVit), exp, nv: hl.length, n: x.length, m: y.length, avgMax: sumArr(mp) / mp.length };
        });
        v.readout(() => `$|x|=${info.n}$, $|y|=${info.m}$ · the best alignment has $${info.nv}$ match columns and carries $${fx(100 * info.lv / info.lt, 1)}\\%$ of the total probability $P(x,y)=${sciTex(info.lt)}$ (the rest is spread over other alignments) · expected number of aligned pairs $\\sum_{ij}P(x_i\\diamond y_j)=${fx(info.exp, 1)}$ · average over rows of the largest posterior in the row: $${f3(info.avgMax, 2)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Profile HMMs for sequence families',
      statement: String.raw`A profile HMM turns a multiple alignment of a protein family into a model with one *node* per match column $k=1,\dots,L$: a match state $M_k$ that emits residues from the column's frequencies $e_k(a)$, a delete state $D_k$ that skips the column silently, and an insert state $I_k$ that emits residues from the background between columns, with transitions among $M,I,D$ of consecutive nodes estimated from counts (with pseudocounts, or Dirichlet priors). A new sequence is scored by the log-odds of its best path (Viterbi) or of all paths (forward) against a background model, and remote family members score high because the model knows which columns are conserved.`,
      idea: String.raw`A position-specific profile (1.6) cannot represent insertions and deletions; adding insert and delete states gives a left-to-right HMM in which each sequence of the family is one path, so the counts of transitions along the training paths estimate its parameters, exactly as for any HMM with known paths. Because the match states weight each column by its own conservation, a diverged sequence that still agrees at the conserved columns scores far above chance, while pairwise comparison with each member, which treats all positions alike, sees only a low overall identity.`,
      caption: String.raw`A simulated protein family (14 members, 40 ancestral positions, 40% conserved sites) is shown as a multiple alignment; shading marks match columns (darker = more conserved) and grey marks insert columns. A profile HMM is built from it, and fresh family members of the chosen divergence are scored against 200 random decoy sequences, once by the profile (log-odds bits) and once by their best Smith–Waterman score (BLOSUM62, gaps $11+k$) against any family member. The histograms show how well each separates family from decoys.`,
      scope: String.raw`The family is simulated by independent substitution and indel events from an ancestor, with conserved and variable sites, so it is an illustration of the mechanism, not a measured benchmark: real families have phylogenetic structure and the comparison with real BLAST or PSI-BLAST would differ. Pseudocount: one count per emission and per allowed transition (Laplace); real profile HMM software uses better priors.`,
      credit: 'Krogh, Brown, Mian, Sjölander & Haussler, 1994',
      deps: ['bioinf-4.3', 'bioinf-1.6'],
      refs: ['Durbin ch. 5'],
      tags: ['profile hmm', 'protein families', 'sequence search'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Profile_hidden_Markov_model', doi: 'https://doi.org/10.1006/jmbi.1994.1104' },
      viz(v) {
        const famSeed = v.slider('family', 1, 6, 1, { int: true });
        const lev = v.select('test members', [{ value: 'close', label: 'close' }, { value: 'mid', label: 'moderate' }, { value: 'far', label: 'remote' }], 'mid');
        let seed = 1; v.button('Resample tests', () => { seed++; });
        const sM = v.stage({ x: [0, 50], y: [0, 16], axes: false, height: 250, full: true, title: 'the family: multiple alignment' });
        const sP = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 270, minWidth: 320, xlabel: 'profile HMM score (bits)', ylabel: 'density', title: 'profile HMM' });
        const sW = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 270, minWidth: 320, xlabel: 'best Smith–Waterman score', ylabel: 'density', title: 'best pairwise comparison' });
        const LEV = { close: [0.9, 0.5], mid: [0.7, 0.1], far: [0.5, 0.05] }, B = matFlat('blosum62'), cache = {}, famCache = {};
        const family = () => {
          const k = famSeed.value; if (famCache[k]) return famCache[k];
          const F = simulateFamily(k * 11 + 1, { nSeq: 14 }), prof = buildProfile(F.msa), mem = F.msa.map((s) => codes(s.replace(/-/g, '')));
          const r = mkRng(k * 5 + 900), decoys = Array.from({ length: 200 }, () => randAA(r, 42));
          const sw = (q) => { let b = -1e9; for (const m of mem) b = Math.max(b, swScore(q, m, B, 11, 1)); return b; };
          return (famCache[k] = { F, prof, mem, decoys, sw, dp: decoys.map((d) => profileViterbi(prof, d).score), dw: decoys.map(sw) });
        };
        const tests = () => {
          const F = family(), key = `${famSeed.value}|${lev.value}|${seed}`; if (cache[key]) return cache[key];
          const [kc, kv] = LEV[lev.value], r = mkRng(seed * 13 + famSeed.value * 101), list = [];
          for (let i = 0; i < 24; i++) { const m = deriveMember(r, F.F.anc, F.F.cons, { keepC: kc, keepV: kv, delP: 0.03, insP: 0.05, draw: F.F.draw }); const q = codes(memberString(m)); list.push([profileViterbi(F.prof, q).score, F.sw(q)]); }
          return (cache[key] = list);
        };
        const ent = (col, N) => { const c = {}; let mx = 0; for (const s of col) if (s !== '-') { c[s] = (c[s] || 0) + 1; mx = Math.max(mx, c[s]); } return mx / N; };
        let info = null;
        v.render(() => {
          const F = family(), W = F.F.msa[0].length, N = F.F.msa.length;
          sM.setView([-3, Math.max(W, 50) + 1], [-1.2, N + 1.8]);
          for (let c = 0; c < W; c++) {
            const col = F.F.msa.map((s) => s[c]), isM = F.prof.isMatch[c], cons = ent(col, N);
            sM.text(isM ? 'M' : 'i', c + 0.5, N + 0.9, { align: 'center', baseline: 'middle', size: 9.5, color: isM ? 'accent' : 'faint', weight: 700 });
            if (isM) sM.rect(c, -0.4, c + 1, N + 0.45, { fill: 'accent', fillAlpha: 0.04 + 0.34 * Math.max(0, cons - 0.3), stroke: false });
            else sM.rect(c, -0.4, c + 1, N + 0.45, { fill: 'muted', fillAlpha: 0.1, stroke: false });
            for (let i = 0; i < N; i++) { const ch = col[i]; sM.text(ch === '-' ? '·' : ch, c + 0.5, N - 0.5 - i, { align: 'center', baseline: 'middle', size: 9.5, color: ch === '-' ? 'faint' : 'ink' }); }
          }
          const T = tests(), pt = T.map((q) => q[0]), wt = T.map((q) => q[1]);
          const hx = (a, b) => { const lo = Math.floor(Math.min(...a, ...b) - 2), hi = Math.ceil(Math.max(...a, ...b) + 2); return [lo, hi]; };
          const [pl, ph] = hx(F.dp, pt), [wl, wh] = hx(F.dw, wt);
          const hP = v.M.histogram(F.dp, { bins: 28, range: [pl, ph] }), hP2 = v.M.histogram(pt, { bins: 28, range: [pl, ph] });
          sP.setView([pl, ph], [0, Math.max(...hP.density, ...hP2.density) * 1.15]);
          sP.hist(F.dp, { bins: 28, range: [pl, ph], density: true, color: 'red', fillAlpha: 0.3 }); sP.hist(pt, { bins: 28, range: [pl, ph], density: true, color: 'green', fillAlpha: 0.3 });
          const hW = v.M.histogram(F.dw, { bins: 28, range: [wl, wh] }), hW2 = v.M.histogram(wt, { bins: 28, range: [wl, wh] });
          sW.setView([wl, wh], [0, Math.max(...hW.density, ...hW2.density) * 1.15]);
          sW.hist(F.dw, { bins: 28, range: [wl, wh], density: true, color: 'red', fillAlpha: 0.3 }); sW.hist(wt, { bins: 28, range: [wl, wh], density: true, color: 'green', fillAlpha: 0.3 });
          const mxP = Math.max(...F.dp), mxW = Math.max(...F.dw);
          sP.vline(mxP, { color: 'red', dash: true }); sW.vline(mxW, { color: 'red', dash: true });
          const zs = (xs, d) => { const [m, s] = meanSd(d); return sumArr(xs.map((x) => (x - m) / s)) / xs.length; };
          info = { L: F.prof.L, N, nP: pt.filter((x) => x > mxP).length, nW: wt.filter((x) => x > mxW).length, zP: zs(pt, F.dp), zW: zs(wt, F.dw), n: pt.length };
        });
        v.legend([['red', '200 random decoys', { area: true }], ['green', 'new family members', { area: true }], ['red', 'best decoy', { dash: true }]]);
        v.readout(() => `the model has $L=${info.L}$ match nodes built from ${info.N} sequences · of ${info.n} new members, $${info.nP}$ score above every decoy under the profile HMM, $${info.nW}$ under best pairwise Smith–Waterman · mean separation from the decoys: $${fx(info.zP, 1)}$ standard deviations (profile) against $${fx(info.zW, 1)}$ (pairwise); the family is simulated, so these numbers illustrate the effect and do not benchmark real software`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Method',
      name: 'Log space and scaling for numerical stability',
      statement: String.raw`The forward probability of a sequence of length $T$ is a sum of products of $2T$ numbers below $1$, so it shrinks roughly like $e^{-hT}$ and underflows floating point (about $10^{-308}$ for doubles and $10^{-38}$ for single precision) after a few hundred symbols. Two remedies give the exact answer. **Scaling**: normalise each forward column, $\hat\alpha_t=\alpha_t/c_t$ with $c_t=\sum_k\alpha'_t(k)$, and recover $\log P(x)=\sum_t\log c_t$. **Log space**: store $\log\alpha_t(k)$ and add probabilities with $\log(e^a+e^b)=\max(a,b)+\log(1+e^{-|a-b|})$ (log-sum-exp). Viterbi needs only additions and maxima, so logarithms alone suffice.`,
      idea: String.raw`Underflow is a representation problem, not a mathematical one: the true value is a perfectly good positive number whose exponent is merely too negative. Scaling keeps the mantissa in range by factoring out the exponent column by column (and the scale factors reappear as the sum of logs), while log-sum-exp keeps only the exponent and handles the addition by factoring out the larger term, so the exponential never gets a large positive argument. Both are exact in exact arithmetic and agree to rounding error in floating point.

The product and inverse identities in pma-8.6 justify recovering a positive likelihood's logarithm by summing the logarithms of positive incremental scale factors. Factoring $e^{\max(a,b)}$ from a sum gives the stated log-sum-exp identity for finite a,b. In the special case $a=b=-\infty$, both probabilities are zero and the result must instead be $-\infty$; exact real identities do not by themselves prevent every floating-point edge case.`,
      caption: String.raw`The curves are $\log_{10}P(x_1,\dots,x_t)$ for a simulated casino sequence of $T$ rolls, computed three ways: the raw recursion (red), scaling (green) and log-space (blue, dashed). The red curve drops off the page when the value reaches zero (marked); the other two continue and agree. Switch to single precision and underflow arrives about six times earlier.`,
      scope: String.raw`Exact limits: smallest positive double $\approx4.9\times10^{-324}$ (subnormal), single $\approx1.4\times10^{-45}$; JavaScript numbers are doubles and single precision is emulated with Math.fround. For the simulated sequence used here the probability decays by about $0.76$ decimal orders of magnitude per roll; other models and sequences decay at other rates.`,
      credit: 'scaling as in Rabiner, 1989',
      deps: ['bioinf-4.6','pma-8.6'],
      refs: ['Durbin ch. 3'],
      tags: ['numerical stability', 'underflow', 'log-sum-exp'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Arithmetic_underflow', doi: 'https://doi.org/10.1109/5.18626' },
      viz(v) {
        const Ts = v.slider('sequence length $T$', 50, 1000, 600, { int: true, step: 10 });
        const prec = v.select('raw arithmetic', [{ value: 'double', label: 'double' }, { value: 'single', label: 'single' }], 'double');
        const h = casino(), S = sampleHMM(h, 1000, mkRng(7)), L10 = Math.LN10;
        const dbl = forwardRaw(h, S.obs, false), sgl = forwardRaw(h, S.obs, true), lg = forwardLog(h, S.obs), sc = (() => { const F = forwardScaled(h, S.obs); let c = 0; return F.c.map((x) => (c += Math.log(x))); })();
        const sP = v.stage({ x: [0, 1000], y: [-800, 0], axes: 'box', gutter: true, height: 380, full: true, xlabel: 'sequence length $t$', ylabel: '$\\log_{10}P(x_1\\dots x_t)$', title: 'forward probability of the prefix, three ways' });
        let info = null;
        v.render(() => {
          const T = Ts.value, raw = prec.value === 'double' ? dbl : sgl, lim = prec.value === 'double' ? -323.3 : -44.85;
          let tz = raw.findIndex((x) => x === 0); const tzEff = tz >= 0 && tz < T ? tz : -1;
          const bot = Math.min(-60, Math.floor((lg[T - 1] / L10) * 1.08 / 50) * 50);
          sP.setView([0, T], [bot, 5]);
          sP.hline(0, { color: 'faint' });
          sP.hline(lim, { color: 'muted', dash: true }); sP.text(prec.value === 'double' ? 'smallest positive double ≈ 10⁻³²⁴' : 'smallest positive single ≈ 10⁻⁴⁵', T * 0.99, lim + 0.04 * (-bot), { align: 'right', size: 12, color: 'muted' });
          const end = tzEff >= 0 ? tzEff : T;
          sP.path(Array.from({ length: end }, (_, t) => [t + 1, Math.log10(raw[t])]), { color: 'red', width: 3 });
          sP.path(Array.from({ length: T }, (_, t) => [t + 1, sc[t] / L10]), { color: 'green', width: 2 });
          sP.path(Array.from({ length: T }, (_, t) => [t + 1, lg[t] / L10]), { color: 'accent', width: 2, dash: true });
          if (tzEff >= 0) { sP.vline(tzEff, { color: 'red', dash: true, alpha: 0.7 }); sP.dot(tzEff, lim, { r: 6, color: 'red', hollow: true }); sP.text(`raw value becomes 0 at $t=${tzEff}$`, tzEff + T * 0.015, lim * 0.7, { size: 12.5, color: 'red' }); }
          let md = 0; for (let t = 0; t < T; t++) md = Math.max(md, Math.abs(sc[t] - lg[t]));
          info = { T, tz: tzEff, rate: -lg[T - 1] / L10 / T, md, val: lg[T - 1] / L10, tzAll: dbl.findIndex((x) => x === 0), tzS: sgl.findIndex((x) => x === 0) };
        });
        v.legend([['red', 'raw probabilities'], ['green', 'scaled ($\\sum\\log c_t$)'], ['accent', 'log space', { dash: true }]]);
        v.readout(() => `at $t=${info.T}$ the true value is $\\log_{10}P=${fx(info.val, 1)}$, i.e. $10^{${fx(info.val, 0)}}$ · the decay is about $${fx(info.rate, 2)}$ decimal orders per roll, so the raw recursion is lost at $t=${info.tzAll}$ in double and at $t=${info.tzS}$ in single precision${info.tz >= 0 ? ' (reached here)' : ' (not yet reached at this length)'} · scaling and log-space agree to $${info.md.toExponential(0).replace('e', '\\times10^{').replace('-', '−')}}$ in $\\ln P$ over the whole sequence`);
      },
    },
  ],
};
