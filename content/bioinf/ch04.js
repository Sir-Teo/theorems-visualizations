// Bioinformatics Algorithms — Chapter 4: Hidden Markov models (items 4.1–4.6; part b has 4.7–4.12)
import {
  NUC, CPG_PLUS, CPG_MINUS, BETA, sampleChain, estimateChain, mkRng, sumArr, f3, log2,
  sampleHMM, viterbi, forwardScaled, posterior, logJoint, casino, cleanSeq, fx,
} from './ch04.shared.js';

const sciT = (x) => { if (x === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(x))); const m = x / 10 ** e; return `${m.toFixed(1)}e${e < 0 ? '−' : ''}${Math.abs(e)}`; };
function stationary(P) { let p = [0.25, 0.25, 0.25, 0.25]; for (let it = 0; it < 400; it++) { const q = [0, 0, 0, 0]; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) q[j] += p[i] * P[i][j]; p = q; } return p; }
const relEntropy = (P, Q) => { const pi = stationary(P); let s = 0; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) s += pi[i] * P[i][j] * log2(P[i][j] / Q[i][j]); return s; };
/** Coloured runs of a state path as rectangles on a stage row. */
function drawRuns(s, path, y0, y1, colors, o = {}) {
  let a = 0;
  for (let t = 1; t <= path.length; t++) if (t === path.length || path[t] !== path[a]) { const c = colors[path[a]]; s.rect(a + (o.shift || 0), y0, t + (o.shift || 0), y1, { fill: c, fillAlpha: o.alpha || 0.4, color: c, width: 1 }); a = t; }
}

export default {
  collection: 'bioinf',
  chapter: 4,
  title: 'Hidden Markov models',
  summary: String.raw`Many biological sequences switch between hidden states — CpG islands and background, exons and introns, match and insert positions in a protein family. Markov chains score sequences; hidden Markov models add unobserved states, and dynamic programming answers the main questions: the best state path (Viterbi), the total probability (forward), posterior state probabilities (forward–backward) and parameter learning (Baum–Welch). Pair and profile HMMs recast alignment probabilistically.`,
  items: [
    // ───────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Markov chains for sequences: CpG islands',
      statement: String.raw`A first-order Markov chain on the alphabet $\{A,C,G,T\}$ assigns to a sequence $x_1\cdots x_n$ the probability $P(x)=P(x_1)\prod_{i=2}^{n}a_{x_{i-1}x_i}$, where $a_{st}=P(x_i=t\mid x_{i-1}=s)$ and every row of the matrix $(a_{st})$ sums to $1$. From training data the maximum-likelihood estimate is $\hat a_{st}=c_{st}/\sum_{t'}c_{st'}$, with $c_{st}$ the number of times $s$ is followed by $t$. In vertebrate genomes the dinucleotide CG is much rarer than the base composition predicts, except in CpG islands, so one fits two chains, "$+$" for islands and "$-$" for the rest; they differ most in the transition $C\to G$.`,
      idea: String.raw`Dependence between neighbouring letters is the simplest correlation a sequence model can capture, and it needs only $4\times4$ parameters. CG is depleted outside islands because methylated cytosine in CG tends to mutate to thymine, whereas islands are kept unmethylated and retain CG; so the two classes of sequence have different transition matrices. Counting is the maximum-likelihood fit (stoch-1.1 defines the chain), and by the law of large numbers the estimate converges to the true matrix as the training sequence grows.`,
      caption: String.raw`The table shows the transition matrix of the island chain ($+$), the non-island chain ($-$), or their log-odds ratio $\beta_{st}=\log_2(a^+_{st}/a^-_{st})$; the gold outline marks $C\to G$. The scatter plot trains a chain on a sequence of length $N$ *simulated from* the chosen model and plots each of the 16 estimated entries against the true one: they fall on the diagonal as $N$ grows. The matrices are the published ones, the training sequence is a simulation.`,
      scope: String.raw`The two matrices are the ones printed in Durbin, Eddy, Krogh & Mitchison (1998), estimated there from a few dozen annotated human CpG islands (about 60 000 nucleotides, from memory) and the surrounding sequence; I confirmed the numbers against lecture notes that reproduce the table, not against the book's page. A first-order chain ignores everything beyond the previous letter, and island boundaries are not part of the model.`,
      credit: 'Gardiner-Garden & Frommer, 1987 (islands); Durbin et al., 1998 (the two-chain model)',
      verify: true,
      deps: ['bioinf-1.1', 'stoch-1.1'],
      refs: ['Durbin ch. 3'],
      tags: ['markov chain', 'cpg islands', 'dinucleotides'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/CpG_site', doi: 'https://doi.org/10.1016/0022-2836(87)90689-9' },
      viz(v) {
        const show = v.select('show', [{ value: 'plus', label: '$+$ island' }, { value: 'minus', label: '$-$ background' }, { value: 'beta', label: 'log-odds $\\beta$' }], 'plus');
        const src = v.select('train on', [{ value: 'plus', label: '$+$' }, { value: 'minus', label: '$-$' }], 'plus');
        const nS = v.slider('training length $N$', 100, 200000, 3000, { log: true, int: true, sig: 2 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 300, title: 'transition matrix $a_{st}$ (row $s$, column $t$)' });
        const T = v.table(sT, { rows: 4, cols: 4, rowLabels: NUC.split(''), colLabels: NUC.split(''), cornerLabel: '', maxCell: 66, size: 16 });
        const sS = v.stage({ x: [0, 0.5], y: [0, 0.5], axes: 'box', gutter: true, equal: true, height: 340, minWidth: 300, xlabel: 'true $a_{st}$', ylabel: 'estimated $\\hat a_{st}$', title: 'estimating the chain from simulated data' });
        const cache = {};
        const fit = () => {
          const key = `${src.value}|${nS.value}|${seed}`;
          if (!cache[key]) { const P = src.value === 'plus' ? CPG_PLUS : CPG_MINUS; const x = sampleChain(P, nS.value, mkRng(seed * 7919 + (src.value === 'plus' ? 1 : 2))); cache[key] = estimateChain(x).P; }
          return cache[key];
        };
        let info = null;
        v.render(() => {
          const m = show.value, P = m === 'plus' ? CPG_PLUS : CPG_MINUS;
          T.draw({
            value: (i, j) => (m === 'beta' ? BETA[i][j] : P[i][j]), format: m === 'beta' ? 2 : 3,
            heat: (i, j) => (m === 'beta' ? 0.5 + BETA[i][j] / 4.4 : Math.min(1, P[i][j] / 0.5)), cmap: m === 'beta' ? 'diverging' : 'viridis',
            highlight: [[1, 2, 'gold']],
          });
          const E = fit(), TP = src.value === 'plus' ? CPG_PLUS : CPG_MINUS;
          sS.line(0, 0, 0.5, 0.5, { color: 'muted', dash: true });
          let err = 0;
          for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
            const cg = i === 1 && j === 2; err = Math.max(err, Math.abs(E[i][j] - TP[i][j]));
            sS.dot(TP[i][j], E[i][j], { r: cg ? 6 : 3.6, color: cg ? 'gold' : 'accent', label: cg ? 'C→G' : undefined, labelPos: 'se' });
          }
          info = { err, E, TP };
        });
        v.legend([['gold', 'C→G'], ['accent', 'other 15 entries', { dot: true }]]);
        v.readout(() => {
          const pp = stationary(CPG_PLUS), pm = stationary(CPG_MINUS), cgP = pp[1] * CPG_PLUS[1][2], cgM = pm[1] * CPG_MINUS[1][2];
          return `$a^+_{CG}=${f3(CPG_PLUS[1][2])}$ against $a^-_{CG}=${f3(CPG_MINUS[1][2])}$ (ratio $${fx(CPG_PLUS[1][2] / CPG_MINUS[1][2], 1)}$) · long-run frequency of the dinucleotide CG: $${f3(cgP)}$ inside islands, $${f3(cgM)}$ outside\nsimulated training sequence of $N=${nS.value}$: largest estimation error over the 16 entries is $${f3(info.err)}$ (it shrinks roughly like $1/\\sqrt N$); the true $C\\to G$ entry is $${f3(info.TP[1][2])}$, estimated $${f3(info.E[1][2])}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Method',
      name: 'Log-odds discrimination with Markov chains',
      statement: String.raw`Given the two chains of the previous item, score a sequence $x$ by its log-likelihood ratio
$$S(x)=\log_2\frac{P(x\mid +)}{P(x\mid -)}=\sum_{i=2}^{n}\beta_{x_{i-1}x_i},\qquad \beta_{st}=\log_2\frac{a^+_{st}}{a^-_{st}}$$
(the first-letter term is dropped). Declaring "island" when $S(x)>\theta$ is the likelihood-ratio test; with equal priors, $\theta=0$ minimises the average error. The score per letter $S/L$ of a window of length $L$ has mean $D(+\Vert-)>0$ under the island chain and $-D(-\Vert+)<0$ under the background chain, so the two classes separate as $L$ grows.`,
      idea: String.raw`By the Neyman–Pearson lemma the likelihood ratio is the most powerful statistic for a simple-versus-simple test, and the Markov property turns it into a sum over adjacent pairs. Each window is a sum of $L-1$ nearly independent terms, so the score concentrates around $L$ times the relative entropy rate (the law of large numbers) with spread $\sqrt L$: the per-letter histograms of the two classes narrow and pull apart, and the error rate falls roughly exponentially in $L$.`,
      caption: String.raw`Windows of length $L$ are simulated from each chain (500 of each; the chains are the published ones, the windows are simulated, not real genome). Histograms show the score per letter; dashed lines are the theoretical means $D(+\Vert-)$ and $-D(-\Vert+)$. Drag the threshold to trade false positives for false negatives, and change $L$ to watch the overlap shrink; the right panel shows the average error at the current threshold for several window lengths.`,
      scope: String.raw`Both classes are modelled as stationary chains with a uniform first letter, and islands are assumed to fill the whole window. Real genomes have island boundaries, window-level heterogeneity and priors far from equal (islands cover only a few per cent of the human genome), so these error rates are a best case.`,
      deps: ['bioinf-4.1'],
      refs: ['Durbin ch. 3'],
      tags: ['log-odds', 'likelihood ratio', 'classification'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Likelihood-ratio_test' },
      viz(v) {
        const Ls = v.slider('window length $L$', 5, 200, 40, { log: true, int: true, sig: 2 });
        const thr = v.slider('threshold $\\theta/L$ (bits per letter)', -0.6, 0.8, 0, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const sH = v.stage({ x: [-1.2, 1.9], y: [0, 1], axes: 'box', gutter: true, height: 340, minWidth: 360, weight: 1.5, xlabel: 'score per letter $S/L$ (bits)', ylabel: 'density', title: 'window scores' });
        const sE = v.stage({ x: [4, 220], y: [0, 0.5], xlog: true, axes: 'box', gutter: true, height: 340, minWidth: 260, xlabel: 'window length $L$', ylabel: 'average error', title: 'error at this threshold' });
        const LS = [5, 10, 20, 40, 80, 160], cache = {};
        const scoresFor = (L) => {
          const key = `${L}|${seed}`; if (cache[key]) return cache[key];
          const r = mkRng(seed * 31 + L), out = { plus: [], minus: [] };
          for (const [nm, P] of [['plus', CPG_PLUS], ['minus', CPG_MINUS]]) for (let w = 0; w < 500; w++) { const x = sampleChain(P, L, r); let s = 0; for (let i = 1; i < L; i++) s += BETA[x[i - 1]][x[i]]; out[nm].push(s / L); }
          return (cache[key] = out);
        };
        const mP = relEntropy(CPG_PLUS, CPG_MINUS), mM = -relEntropy(CPG_MINUS, CPG_PLUS);
        let info = null;
        v.render(() => {
          const L = Ls.value, D = scoresFor(L), th = thr.value;
          const bins = v.M.histogram(D.plus, { bins: 40, range: [-1.2, 1.9] }), bins2 = v.M.histogram(D.minus, { bins: 40, range: [-1.2, 1.9] });
          const ymax = Math.max(...bins.density, ...bins2.density) * 1.15;
          sH.setView([-1.2, 1.9], [0, ymax]);
          sH.hist(D.plus, { bins: 40, range: [-1.2, 1.9], density: true, color: 'green', fillAlpha: 0.3 });
          sH.hist(D.minus, { bins: 40, range: [-1.2, 1.9], density: true, color: 'red', fillAlpha: 0.3 });
          sH.vband(th, 1.9, { color: 'green', alpha: 0.05 });
          sH.vline(th, { color: 'ink', width: 2 });
          sH.vline(mP, { color: 'green', dash: true }); sH.vline(mM, { color: 'red', dash: true });
          sH.text('$D(+\\Vert-)$', mP + 0.03, ymax * 0.96, { size: 12, color: 'green' }); sH.text('$-D(-\\Vert+)$', mM - 0.03, ymax * 0.96, { size: 12, color: 'red', align: 'right' });
          const fn = D.plus.filter((s) => s <= th).length / 500, fp = D.minus.filter((s) => s > th).length / 500;
          const pts = LS.map((l) => { const q = scoresFor(l); return [l, (q.plus.filter((s) => s <= th).length / 500 + q.minus.filter((s) => s > th).length / 500) / 2]; });
          sE.setView([4, 220], [0, Math.max(0.1, Math.max(...pts.map((p) => p[1])) * 1.15)]);
          sE.path(pts, { color: 'accent', width: 2.4 }); sE.dots(pts, { r: 4, color: 'accent' });
          sE.vline(L, { color: 'gold', width: 2 }); sE.dot(L, (fn + fp) / 2, { r: 6, color: 'gold' });
          info = { fn, fp, L, th, mp: sumArr(D.plus) / 500, mm: sumArr(D.minus) / 500 };
        });
        v.legend([['green', 'from $+$ chain', { area: true }], ['red', 'from $-$ chain', { area: true }], ['ink', 'threshold']]);
        v.readout(() => `$L=${info.L}$: sample means of $S/L$ are $${f3(info.mp, 2)}$ (island) and $${f3(info.mm, 2)}$ (background), against theory $${f3(mP, 2)}$ and $${f3(mM, 2)}$ · at threshold $${f3(info.th, 2)}$ bits per letter, $${fx(100 * info.fn, 1)}\\%$ of island windows are missed and $${fx(100 * info.fp, 1)}\\%$ of background windows are called islands`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Hidden Markov model',
      statement: String.raw`A hidden Markov model has a finite set of states $1,\dots,K$ that follow a Markov chain with initial distribution $\pi_k$ and transition matrix $a_{jk}$, but are not observed. In each state $k$ the model emits a symbol $x$ from a distribution $e_k(x)$ that depends only on the current state. The joint probability of a state path $\pi=(\pi_1,\dots,\pi_T)$ and an observed sequence $x=(x_1,\dots,x_T)$ is
$$P(x,\pi)=\pi_{\pi_1}\,e_{\pi_1}(x_1)\prod_{t=2}^{T}a_{\pi_{t-1}\pi_t}\,e_{\pi_t}(x_t),$$
and the probability of the observations alone is the sum of this over all $K^T$ paths.`,
      idea: String.raw`An HMM separates what we see from the regime that generated it: the hidden chain (stoch-14.10) carries the long-range structure, such as "now inside an island", and the emissions carry the local statistics. Because emissions depend only on the current state, the joint probability factorises into a product along the path, and everything that follows — decoding, evaluation, learning — is a dynamic program over the $K\times T$ lattice instead of a sum over $K^T$ paths.`,
      caption: String.raw`Pick a model and tune the switching probabilities. **Resample** generates a new sequence: the upper strip is the hidden path, the lower strip what an observer sees. The readout multiplies out $P(x,\pi)$ for the path shown. Longer stays (small switching probabilities) give longer runs of one regime; the emission bars show how well the states can be told apart.`,
      scope: String.raw`The "casino" is the textbook model of Durbin et al. (fair die; loaded die with $P(6)=1/2$). The "base composition" preset is illustrative: its emissions are the stationary base frequencies of the two CpG chains of 4.1, used as independent draws, which ignores the dinucleotide structure that made those chains useful.`,
      credit: 'Baum & Petrie, 1966',
      deps: ['bioinf-4.1', 'stoch-14.10'],
      refs: ['Durbin ch. 3', 'Compeau–Pevzner ch. 10'],
      tags: ['hmm', 'hidden states', 'generative model'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hidden_Markov_model', doi: 'https://doi.org/10.1214/aoms/1177699147' },
      viz(v) {
        const preset = v.select('model', [{ value: 'casino', label: 'dishonest casino' }, { value: 'dna', label: 'base composition' }], 'casino', { onChange: (p) => { a01.set(p === 'casino' ? 0.05 : 0.03); a10.set(p === 'casino' ? 0.1 : 0.08); } });
        const a01 = v.slider('switch $1\\to2$', 0.01, 0.5, 0.05, { step: 0.01 });
        const a10 = v.slider('switch $2\\to1$', 0.01, 0.5, 0.1, { step: 0.01 });
        const Tn = 36;
        let seed = 3; v.button('Resample', () => { seed++; });
        const model = () => {
          if (preset.value === 'casino') return { ...casino({ aFL: a01.value, aLF: a10.value }), sym: '123456'.split(''), names: ['Fair', 'Loaded'], sn: ['F', 'L'] };
          const pp = stationary(CPG_PLUS), pm = stationary(CPG_MINUS);
          return { K: 2, M: 4, names: ['Island', 'Background'], sn: ['I', 'B'], sym: NUC.split(''), A: [[1 - a01.value, a01.value], [a10.value, 1 - a10.value]], E: [pp, pm], pi: [a10.value / (a01.value + a10.value), a01.value / (a01.value + a10.value)] };
        };
        const sD = v.stage({ x: [-3.3, 3.3], y: [-1.7, 1.9], equal: true, axes: false, height: 250, minWidth: 330, title: 'states and transitions' });
        const sB = v.stage({ x: [0, 15], y: [0, 1], axes: 'box', gutter: true, xticks: [[0, '']], height: 250, minWidth: 280, ylabel: 'emission probability', title: 'emission distributions $e_k(x)$' });
        const sQ = v.stage({ x: [0, Tn], y: [0, 3.4], axes: false, height: 160, full: true });
        const C = ['accent', 'orange'];
        let info = null;
        v.render(() => {
          const h = model(), r = mkRng(seed * 101 + (preset.value === 'casino' ? 1 : 2)), S = sampleHMM(h, Tn, r);
          [[-1.75, 0], [1.75, 0]].forEach(([cx, cy], k) => {
            sD.circle(cx, cy, 0.72, { fill: C[k], fillAlpha: 0.15, color: C[k], width: 2.4 });
            sD.text(h.names[k], cx, cy + 0.02, { align: 'center', baseline: 'middle', size: 14, weight: 700 });
            sD.circle(cx, cy + 1.0, 0.3, { color: 'muted', width: 1.6 });
            sD.text(`$${f3(h.A[k][k], 2)}$`, cx, cy + 1.62, { align: 'center', size: 12.5 });
          });
          sD.arrow(-1.0, 0.28, 1.0, 0.28, { color: 'muted', head: 9 }); sD.arrow(1.0, -0.28, -1.0, -0.28, { color: 'muted', head: 9 });
          sD.text(`$${f3(h.A[0][1], 2)}$`, 0, 0.55, { align: 'center', size: 12.5 }); sD.text(`$${f3(h.A[1][0], 2)}$`, 0, -0.62, { align: 'center', size: 12.5 });
          sD.text(`start: $${f3(h.pi[0], 2)}$ / $${f3(h.pi[1], 2)}$`, 0, -1.45, { align: 'center', size: 11.5, color: 'muted' });
          sB.setView([0, 2 * h.M + 3], [0, preset.value === 'casino' ? 0.6 : 0.45]);
          for (let k = 0; k < 2; k++) {
            const x0 = 1 + k * (h.M + 1);
            for (let a = 0; a < h.M; a++) { sB.rect(x0 + a + 0.1, 0, x0 + a + 0.9, h.E[k][a], { fill: C[k], fillAlpha: 0.45, color: C[k], width: 1 }); sB.text(h.sym[a], x0 + a + 0.5, 0.012, { align: 'center', size: 12.5, color: 'ink', weight: 600 }); }
            sB.text(h.names[k], x0 + h.M / 2, preset.value === 'casino' ? 0.57 : 0.43, { align: 'center', size: 13, color: C[k], weight: 700 });
          }
          drawRuns(sQ, S.path, 1.9, 2.7, C, { alpha: 0.35 });
          for (let t = 0; t < Tn; t++) {
            sQ.text(h.sn[S.path[t]], t + 0.5, 2.3, { align: 'center', baseline: 'middle', size: 11, color: C[S.path[t]], weight: 700 });
            sQ.rect(t + 0.06, 0.55, t + 0.94, 1.45, { color: 'faint', width: 1 });
            sQ.text(h.sym[S.obs[t]], t + 0.5, 1.0, { align: 'center', baseline: 'middle', size: 13, weight: 600 });
          }
          sQ.text('hidden path $\\pi$', 0, 3.15, { size: 12, color: 'muted' }); sQ.text('observed sequence $x$', 0, 0.2, { size: 12, color: 'muted' });
          let sw = 0; for (let t = 1; t < Tn; t++) if (S.path[t] !== S.path[t - 1]) sw++;
          info = { lj: logJoint(h, S.path, S.obs), sw, K: h.K };
        });
        v.readout(() => `this path has $${info.sw}$ switches in $T=${Tn}$ positions · $\\log_{10}P(x,\\pi)=${fx(info.lj / Math.LN10, 2)}$ for the path shown, one of $2^{${Tn}}\\approx${(2 ** Tn / 1e9).toFixed(1)}\\times10^{9}$ possible paths`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Algorithm',
      name: 'Viterbi algorithm',
      statement: String.raw`For an HMM and an observed sequence $x_1,\dots,x_T$, the most probable state path $\pi^*=\arg\max_\pi P(x,\pi)$ is found in $O(K^2T)$ time. With $V_t(k)$ the probability of the best path ending in state $k$ at time $t$,
$$V_1(k)=\pi_k e_k(x_1),\qquad V_t(k)=e_k(x_t)\max_{j}V_{t-1}(j)\,a_{jk},$$
and $P(x,\pi^*)=\max_kV_T(k)$; recording the maximising $j$ at each cell and following these pointers backwards from the best final state recovers $\pi^*$.`,
      idea: String.raw`Optimal substructure: the best path to $(t,k)$ must pass through some state $j$ at time $t-1$, and the part of the path up to there must itself be the best path ending at $j$ (otherwise swap it for a better one). That makes the lattice a longest-path problem in a DAG (algo-7.2), with weights $\log a_{jk}+\log e_k(x_t)$, and dynamic programming evaluates each of the $KT$ cells once at cost $K$. Working with logarithms (4.12) turns the products into sums.`,
      caption: String.raw`Type a sequence of die rolls (digits 1–6, up to 14), then **step** through the lattice of the fair/loaded casino. For the gold cell the two orange cells are the candidates $V_{t-1}(j)+\log_2 a_{jk}$; the larger wins and its arrow is stored. Values are $\log_2$ of probabilities. After the last column the green traceback follows the stored arrows.`,
      scope: String.raw`The model is the casino of 4.5 with $a_{FL}=0.05$, $a_{LF}=0.1$ and $P(6\mid L)=\tfrac12$, started in its stationary distribution. Several paths can tie for the maximum; the traceback shown breaks ties towards the fair state.`,
      credit: 'Viterbi, 1967',
      deps: ['bioinf-4.3', 'stoch-14.11'],
      refs: ['Durbin ch. 3'],
      tags: ['dynamic programming', 'decoding', 'hmm'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Viterbi_algorithm', doi: 'https://doi.org/10.1109/TIT.1967.1054010' },
      viz(v) {
        const h = casino(), CODE = ['$V_1(k) \\leftarrow \\log_2 \\pi_k e_k(x_1)$', 'for $t = 2$ to $T$', '  for each state $k$', '    $V_t(k) \\leftarrow \\log_2 e_k(x_t) + \\max_j [V_{t-1}(j) + \\log_2 a_{jk}]$', '    store the maximising $j$ as pointer', '$k \\leftarrow \\arg\\max_k V_T(k)$', 'follow the pointers back to $t = 1$'];
        let X = '3542166666631';
        const clean = (z) => cleanSeq(z, '1-6', 14) || '3';
        const inp = v.input('rolls', X, { width: 190, onChange: (z) => { X = clean(z); S.reset(); } });
        v.button('Random rolls', () => { const r = mkRng(Math.floor(Math.random() * 1e6)); X = Array.from(sampleHMM(h, 12, r).obs, (o) => o + 1).join(''); inp.set(X); S.reset(); });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 210 });
        const T = v.table(st, { rows: 2, cols: 14, square: false, cellAspect: 0.9, maxCell: 62, minCell: 24, size: 12, rowLabels: ['Fair', 'Loaded'] });
        const L2 = (x) => Math.log2(x), lA = h.A.map((r) => r.map(L2)), lE = h.E.map((r) => r.map(L2));
        function frames() {
          const obs = Array.from(X, (c) => +c - 1), n = obs.length, V = Array.from({ length: 2 }, () => Array(n).fill(null)), P = Array.from({ length: 2 }, () => Array(n).fill(null));
          const out = [], snap = (o) => out.push({ V: V.map((r) => r.slice()), P: P.map((r) => r.slice()), n, obs, ...o });
          snap({ line: [], note: `Rolls **${X}**. The lattice has 2 states by ${n} positions; the first column is filled from the start distribution.` });
          for (let k = 0; k < 2; k++) V[k][0] = L2(h.pi[k]) + lE[k][obs[0]];
          snap({ cur: [0, 0], line: 1, note: `$V_1(\\text{F}) = \\log_2(\\tfrac23\\cdot\\tfrac16) = ${V[0][0].toFixed(2)}$ and $V_1(\\text{L}) = \\log_2 (\\tfrac13 e_L(${obs[0] + 1})) = ${V[1][0].toFixed(2)}$.` });
          for (let t = 1; t < n; t++) for (let k = 0; k < 2; k++) {
            const c = [V[0][t - 1] + lA[0][k], V[1][t - 1] + lA[1][k]], j = c[1] > c[0] ? 1 : 0;
            V[k][t] = lE[k][obs[t]] + c[j]; P[k][t] = [j - k, -1];
            snap({ cur: [k, t], deps: [[0, t - 1], [1, t - 1]], line: [3, 4, 5], note: `Roll ${obs[t] + 1}, state ${k ? 'Loaded' : 'Fair'}: candidates from Fair ${c[0].toFixed(2)} and from Loaded ${c[1].toFixed(2)}; keep **${j ? 'Loaded' : 'Fair'}**, so $V=${lE[k][obs[t]].toFixed(2)}${c[j] < 0 ? '' : '+'}${c[j].toFixed(2)}=${V[k][t].toFixed(2)}$.` });
          }
          let k = V[1][n - 1] > V[0][n - 1] ? 1 : 0; const path = [[k, n - 1]];
          snap({ path: path.slice(), line: 6, note: `Best final cell: **${k ? 'Loaded' : 'Fair'}** with $\\log_2 P(x,\\pi^*)=${V[k][n - 1].toFixed(2)}$.` });
          for (let t = n - 1; t > 0; t--) { k += P[k][t][0]; path.push([k, t - 1]); snap({ path: path.slice(), line: 7, hold: 0.6, note: `Follow the pointer back to position ${t}: **${k ? 'Loaded' : 'Fair'}**.` }); }
          snap({ path: path.slice(), line: 7, hold: 2, done: true, note: `Viterbi path (F/L): **${path.slice().reverse().map(([s]) => 'FL'[s]).join('')}** for rolls ${X}.` });
          return out;
        }
        const S = v.steps({ frames, code: CODE, codeTitle: 'Viterbi(x)', speed: 3, start: 'end' });
        v.render(() => {
          const f = S.frame, n = f.n, path = f.path || [], key = (i, j) => i * 100 + j, onP = new Set(path.map(([i, j]) => key(i, j))), dep = new Set((f.deps || []).map(([i, j]) => key(i, j)));
          T.draw({
            rows: 2, cols: n, colLabels: (j) => `${f.obs[j] + 1}`, cornerLabel: 'roll',
            value: (i, j) => (f.V[i][j] == null ? null : f.V[i][j]), format: 1,
            fill: (i, j) => (f.cur && f.cur[0] === i && f.cur[1] === j ? ['gold', 0.45] : dep.has(key(i, j)) ? ['orange', 0.3] : onP.has(key(i, j)) ? ['green', 0.3] : null),
            highlight: f.cur ? [f.cur] : [], sub: (i, j) => (f.P[i][j] ? `←${'FL'[i + f.P[i][j][0]]}` : ''), subSize: 9.5,
          });
          if (f.cur && f.P[f.cur[0]][f.cur[1]]) { const [di, dj] = f.P[f.cur[0]][f.cur[1]]; T.arrow(f.cur, [f.cur[0] + di, f.cur[1] + dj], { color: 'accent', width: 2.2 }); }
          for (let k = 0; k + 1 < path.length; k++) T.arrow(path[k], path[k + 1], { color: 'green', width: 2.6 });
        });
        v.readout(() => {
          const obs = Array.from(X, (c) => +c - 1), R = viterbi(h, obs), pth = Array.from(R.path, (s) => 'FL'[s]).join(''), n = obs.length;
          const alt = Array.from({ length: n }, () => 0); const lj = logJoint(h, Uint8Array.from(alt), Uint8Array.from(obs));
          return `Viterbi (computed independently in natural logs): ${pth}, $\\log_2P(x,\\pi^*)=${fx(R.logp / Math.LN2, 2)}$ · all-fair path: $${fx(lj / Math.LN2, 2)}$ · the lattice compares $2^{${n}}=${2 ** n}$ paths using only $${2 * 2 * n}$ additions of candidates`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Phenomenon',
      name: 'The occasionally dishonest casino',
      statement: String.raw`Suppose a casino secretly swaps between a fair die and a loaded die that shows six with probability $\tfrac12$ (and each other face with probability $\tfrac1{10}$). With switching probabilities $0.05$ (fair to loaded) and $0.10$ (loaded to fair), the swaps are invisible, yet decoding the roll sequence with the model recovers the hidden path remarkably well: a Viterbi path or the posterior mode marks most loaded stretches correctly, although single rolls carry little evidence (a six is only three times as likely under the loaded die) and short stretches are missed.`,
      idea: String.raw`Evidence accumulates along a run: each six multiplies the odds of "loaded" by $3$ and each other face by only $0.6$, so a handful of rolls tips the balance, while the persistence of the states (expected run lengths of $20$ and $10$ rolls) says that a state is unlikely to have changed since the last roll. Viterbi (4.4) maximises the probability of the whole path; posterior decoding (4.7) maximises each position separately; the two almost always agree on a long, clear stretch.`,
      caption: String.raw`The top strips show the true hidden path, the Viterbi path and the path of posterior probabilities above one half; gold ticks mark rolls of six. Below, the posterior probability of "loaded" at each roll. Change the loaded die's bias or the switching probabilities and watch accuracy fall as the dice become harder to tell apart; every run is a fresh simulation from the model.`,
      scope: String.raw`Decoding here uses the true parameters of the generating model; when they must be learned, accuracy is lower (4.8). The default parameters are those of the Durbin et al. textbook example, to my recollection; the picture does not depend on exact numbers.`,
      credit: 'Durbin, Eddy, Krogh & Mitchison, 1998',
      verify: true,
      deps: ['bioinf-4.4'],
      refs: ['Durbin ch. 3'],
      tags: ['decoding', 'hmm', 'viterbi'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Viterbi_algorithm' },
      viz(v) {
        const Ts = v.slider('rolls $T$', 50, 500, 300, { int: true, step: 10 });
        const p6 = v.slider('loaded die: $P(6)$', 0.2, 0.9, 0.5, { step: 0.05 });
        const aFL = v.slider('fair → loaded', 0.01, 0.2, 0.05, { step: 0.01 });
        const aLF = v.slider('loaded → fair', 0.02, 0.4, 0.1, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const sS = v.stage({ x: [0, 300], y: [0, 4.3], axes: false, height: 190, full: true, title: 'hidden path and decodings' });
        const sP = v.stage({ x: [0, 300], y: [0, 1], axes: 'box', gutter: true, height: 190, full: true, xlabel: 'roll number', ylabel: '$P(\\text{loaded}\\mid x)$' });
        const C = ['accent', 'orange'];
        let info = null;
        v.render(() => {
          const T = Ts.value, h = casino({ aFL: aFL.value, aLF: aLF.value, p6: p6.value }), S = sampleHMM(h, T, mkRng(seed * 977 + 5));
          const V = viterbi(h, S.obs), G = posterior(h, S.obs), pm = Uint8Array.from(G.gamma, (g) => (g[1] > 0.5 ? 1 : 0));
          sS.setView([0, T], [0, 4.3]); sP.setView([0, T], [0, 1]);
          const rows = [['true path', S.path, 3.15], ['Viterbi', V.path, 2.15], ['posterior > ½', pm, 1.15]];
          for (const [nm, p, y] of rows) { drawRuns(sS, p, y, y + 0.8, C, { alpha: 0.45 }); sS.text(nm, T * 0.004, y + 0.4, { size: 11.5, color: 'ink', baseline: 'middle', plate: true }); }
          for (let t = 0; t < T; t++) if (S.obs[t] === 5) sS.line(t + 0.5, 0.15, t + 0.5, 0.85, { color: 'gold', width: 1.4 });
          sS.text('rolls of six', T * 0.002, 0.5, { size: 11.5, color: 'gold', baseline: 'middle', dy: -14 });
          let a = 0; for (let t = 1; t <= T; t++) if (t === T || S.path[t] !== S.path[a]) { if (S.path[a] === 1) sP.vband(a, t, { color: 'orange', alpha: 0.18 }); a = t; }
          sP.hline(0.5, { color: 'muted', dash: true });
          sP.path(G.gamma.map((g, t) => [t + 0.5, g[1]]), { color: 'accent', width: 2 });
          const acc = (p) => { let c = 0; for (let t = 0; t < T; t++) if (p[t] === S.path[t]) c++; return c / T; };
          const nl = S.path.reduce((s, x) => s + x, 0);
          info = { aV: acc(V.path), aP: acc(pm), base: 1 - nl / T, nl, T };
        });
        v.legend([['accent', 'fair'], ['orange', 'loaded (true runs shaded in the lower panel)'], ['gold', 'six']]);
        v.readout(() => `the true path is loaded for $${info.nl}$ of ${info.T} rolls · correct positions: Viterbi $${fx(100 * info.aV, 1)}\\%$, posterior mode $${fx(100 * info.aP, 1)}\\%$, always answering "fair" $${fx(100 * info.base, 1)}\\%$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Algorithm',
      name: 'Forward algorithm',
      statement: String.raw`The total probability of an observed sequence under an HMM, $P(x)=\sum_{\pi}P(x,\pi)$, is computed in $O(K^2T)$ time by the recursion
$$\alpha_1(k)=\pi_ke_k(x_1),\qquad \alpha_t(k)=e_k(x_t)\sum_{j}\alpha_{t-1}(j)\,a_{jk},\qquad P(x)=\sum_k\alpha_T(k),$$
where $\alpha_t(k)=P(x_1,\dots,x_t,\ \pi_t=k)$. It is the Viterbi recursion with the maximum replaced by a sum.`,
      idea: String.raw`Group the paths by their state at time $t$: every path that passes through $k$ at time $t$ splits into a prefix and a suffix that interact only through $k$, so the sum over prefixes is $\alpha_t(k)$ and can be built from $\alpha_{t-1}$ by the Markov property. This is the distributive law applied to the sum of products, the same dynamic programming as Viterbi (4.4) in the sum-product instead of the max-product semiring. The total includes the best path but also all its competitors, so $P(x)\ge P(x,\pi^*)$.`,
      caption: String.raw`The table is filled by the recursion for the first $T$ rolls of a fixed casino sequence (choose sum, the forward algorithm, or max, Viterbi). The bar chart lists the probabilities of **all** $2^T$ paths in decreasing order; the green curve is their running sum, which tends to the forward total (dashed). Viterbi is the first bar. Increase $T$ to see how many paths share the probability.`,
      scope: String.raw`Probabilities here are plain (unscaled) doubles, which is fine for $T\le14$ but underflows for long sequences (see 4.12). The brute-force sum is only possible because $T$ is tiny.`,
      credit: 'Baum & Petrie, 1966; Baum, Petrie, Soules & Weiss, 1970',
      deps: ['bioinf-4.3'],
      refs: ['Durbin ch. 3'],
      tags: ['dynamic programming', 'likelihood', 'hmm'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Forward_algorithm', doi: 'https://doi.org/10.1214/aoms/1177697196' },
      viz(v) {
        const h = casino(), full = Array.from('35421666666312', (c) => +c - 1);
        const Ts = v.slider('length $T$', 2, 14, 10, { int: true });
        const mode = v.select('recursion', [{ value: 'sum', label: 'sum (forward)' }, { value: 'max', label: 'max (Viterbi)' }], 'sum');
        const sT = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true });
        const T = v.table(sT, { rows: 2, cols: 14, square: false, cellAspect: 0.8, maxCell: 62, minCell: 26, size: 11.5, rowLabels: ['Fair', 'Loaded'], cornerLabel: 'roll' });
        const sB = v.stage({ x: [0, 1], y: [1e-12, 1], ylog: true, axes: 'box', gutter: true, height: 300, minWidth: 340, xlabel: 'paths, sorted by probability (rank)', ylabel: 'probability', title: 'probabilities $P(x,\\pi)$ of all $2^T$ paths' });
        const sC = v.stage({ x: [1, 17000], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 300, minWidth: 300, xlabel: 'number of paths added (best first)', ylabel: '$\\sum P(x,\\pi)\\,/\\,P(x)$', title: 'running share of the total' });
        const cache = {};
        const data = (n) => {
          if (cache[n]) return cache[n];
          const obs = full.slice(0, n), P = [];
          for (let m = 0; m < 2 ** n; m++) { const p = new Uint8Array(n); for (let i = 0; i < n; i++) p[i] = (m >> i) & 1; P.push(Math.exp(logJoint(h, p, obs))); }
          P.sort((a, b) => b - a);
          const F = forwardScaled(h, obs); let acc = 0; const cum = P.map((p) => (acc += p));
          return (cache[n] = { P, cum, tot: Math.exp(F.logL), brute: acc, obs, vit: Math.exp(viterbi(h, obs).logp) });
        };
        let info = null;
        v.render(() => {
          const n = Ts.value, D = data(n), obs = D.obs, K = 2, A = [[], []];
          for (let t = 0; t < n; t++) for (let k = 0; k < K; k++) {
            if (t === 0) A[k][0] = h.pi[k] * h.E[k][obs[0]];
            else { const c = [A[0][t - 1] * h.A[0][k], A[1][t - 1] * h.A[1][k]]; A[k][t] = h.E[k][obs[t]] * (mode.value === 'sum' ? c[0] + c[1] : Math.max(c[0], c[1])); }
          }
          const last = [A[0][n - 1], A[1][n - 1]], res = mode.value === 'sum' ? last[0] + last[1] : Math.max(...last);
          T.draw({ rows: 2, cols: n, colLabels: (j) => `${obs[j] + 1}`, value: (i, j) => sciT(A[i][j]), fill: (i, j) => (j === n - 1 ? [mode.value === 'sum' ? 'green' : 'gold', 0.25] : null), size: n > 10 ? 10 : 11.5 });
          const N = D.P.length, top = Math.max(...D.P) * 1.5, step = Math.max(1, Math.floor(N / 400));
          sB.setView([0, N + 1], [Math.max(1e-30, D.P[N - 1] / 3), top]); sB.hline(D.tot, { color: 'green', dash: true });
          for (let i = 0; i < N; i += step) sB.rect(i, Math.max(1e-30, D.P[N - 1] / 3), i + step, D.P[i], { fill: i === 0 ? 'gold' : 'accent', fillAlpha: 0.5, stroke: false });
          sB.text('Viterbi path', Math.max(1.5, N * 0.04), D.P[0] * 0.55, { size: 12, color: 'gold' });
          sC.setView([1, Math.max(4, N * 1.2)], [0, 1.05]);
          const pts = []; for (let i = 0; i < N; i += step) pts.push([i + 1, D.cum[i] / D.tot]); pts.push([N, D.cum[N - 1] / D.tot]);
          sC.path(pts, { color: 'green', width: 2.4 }); sC.hline(1, { color: 'muted', dash: true });
          info = { res, D, n, N };
        });
        v.readout(() => `${mode.value === 'sum' ? `forward $P(x)=${sciT(info.res)}$ against the brute-force sum over all $${info.N}$ paths $${sciT(info.D.brute)}$ (relative difference $${(Math.abs(info.res - info.D.brute) / info.D.brute).toExponential(0)}$)` : `Viterbi $P(x,\\pi^*)=${sciT(info.res)}$, which is only $${fx(100 * info.res / info.D.tot, 1)}\\%$ of the total probability $P(x)=${sciT(info.D.tot)}$`} · the recursion needs about $${4 * info.n}$ products against $${info.N * info.n}$ for enumeration`);
      },
    },
  ],
};
