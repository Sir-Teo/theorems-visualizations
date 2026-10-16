// Linguistics & Language — Chapter 4, part c: items 4.11–4.14
import { corpus, TEXT_OPTS, TEXT_LABELS, MINE_DEFAULT, FED, FED_WORDS, logRanks, fitLogLog, toSyms, letterModel, guessDistribution, shannonBounds, TEXTS, TEST_TEXT } from './ch04.shared.js';

// ---- 4.12: Poisson naive-Bayes on the Federalist counts (rates per word from the known Hamilton and Madison papers)
const KNOWN = FED.filter((p) => p.a === 'H' || p.a === 'M'), DISP = FED.filter((p) => p.a === '?');
const WORD_SETS = { upon: ['upon'], bym: ['by', 'from', 'to'], all: FED_WORDS };
function rates(papers, words) { const r = {}; let N = 0; for (const p of papers) N += p.N; for (const w of words) { let c = 0; for (const p of papers) c += p.c[w]; r[w] = (c + 0.5) / (N + 1); } return r; }
/** log-likelihood ratio, positive = Madison, for a paper given Hamilton and Madison rates. */
function llr(p, rH, rM, words) { let s = 0; for (const w of words) s += p.c[w] * Math.log(rM[w] / rH[w]) - p.N * (rM[w] - rH[w]); return s; }
const UPON = (() => { const r = (a) => 1000 * KNOWN.filter((p) => p.a === a).reduce((x, p) => x + p.c.upon, 0) / KNOWN.filter((p) => p.a === a).reduce((x, p) => x + p.N, 0); return { h: r('H'), m: r('M') }; })();
const _loo = {};
function classify(setKey) {
  const words = WORD_SETS[setKey]; if (_loo[setKey]) return _loo[setKey];
  const H = KNOWN.filter((p) => p.a === 'H'), M = KNOWN.filter((p) => p.a === 'M');
  const rH = rates(H, words), rM = rates(M, words);
  const disp = DISP.map((p) => ({ n: p.n, s: llr(p, rH, rM, words) }));
  let ok = 0; for (const p of KNOWN) { const Hh = H.filter((x) => x !== p), Mm = M.filter((x) => x !== p); const s = llr(p, rates(Hh, words), rates(Mm, words), words); if ((s > 0) === (p.a === 'M')) ok++; }
  return (_loo[setKey] = { disp, ok, tot: KNOWN.length, rH, rM });
}

// ---- 4.14: Shannon's published bounds, 27-letter alphabet, columns N = 1..15 and 100 (Table in section 6 of the paper; read from a scan, see verify)
const SH_UP = [4.03, 3.42, 3.0, 2.6, 2.7, 2.2, 2.8, 1.8, 1.9, 2.1, 2.2, 2.3, 2.1, 1.7, 2.1, 1.3];
const SH_LO = [3.19, 2.50, 2.1, 1.7, 1.7, 1.3, 1.8, 1.0, 1.0, 1.0, 1.3, 1.3, 1.2, 0.9, 1.2, 0.6];
const SH_NS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 100];
const SH_F27 = [4.76, 4.03, 3.32, 3.1], SH_F26 = [4.70, 4.14, 3.56, 3.3];

function picker(v, init = 'alice') {
  const sel = v.select('Text', TEXT_OPTS, init, { onChange: () => v.invalidate() });
  const inp = v.input('Your text', MINE_DEFAULT, { width: 360, onChange: () => v.invalidate() });
  return { sel, get() { inp.el.hidden = sel.value !== 'mine'; const c = corpus(sel.value, inp.value || ''); return c.tokens.length < 20 ? corpus('alice') : c; } };
}

export default {
  collection: 'ling',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Phenomenon',
      name: 'Similar information rates across languages',
      credit: 'Christophe Coupé, Yoon Mi Oh, Dan Dediu & François Pellegrino, 2019 (Science Advances 5, eaaw2594)',
      statement: String.raw`Languages differ widely in how much information a syllable carries ($\mathrm{ID}$, bits per syllable: about 5 for Basque to about 8 for Vietnamese in a study of 17 languages) and in how fast they are spoken ($\mathrm{SR}$, syllables per second), but the two trade off, so that the information rate
$$\mathrm{IR}\;=\;\mathrm{ID}\times\mathrm{SR}$$
is much more uniform: the pooled mean was about 39 bits per second (standard deviation about 5), with speech rate averaging about 6.6 syllables per second. Dense languages are spoken more slowly; sparse ones faster.`,
      idea: String.raw`Information density was estimated from text in each language as the average reduction in uncertainty per syllable (the predictability of a syllable from its context, in the spirit of 4.8 and 4.9), and speech rate from recordings of native speakers reading 15 short texts that were translations of each other. The coupling of ID and SR is what is surprising: the rate of 39 bits/s is an average, and cannot be read off from density or speed alone. A natural reading is that languages evolve under limits on production and comprehension (cognitive capacity for processing, articulation speed) so that whatever the structure of a language, the stream it supports carries a similar load. The study is a correlational, cross-linguistic comparison of 17 languages and says nothing about whether the load is the same in conversation.`,
      caption: String.raw`Left: the information-rate plane. The curve $\mathrm{ID}=39.15/\mathrm{SR}$ (with the $\pm1$ SD band of the paper’s pooled IR) is where languages are said to lie. Drag the language handle: its rate, $\mathrm{ID}\times\mathrm{SR}$, and its distance from the mean in SDs are read out. The hollow marks show where Basque and Vietnamese would sit if their rate equalled the pooled mean. Right: a simulation (not data) of 17 languages with and without the trade-off.`,
      scope: String.raw`Seventeen languages from several families, read-aloud speech. The numbers shown (mean IR 39.15 bits/s, SD 5.10; mean SR 6.63 syllables/s, SD 1.15; ID from 4.8 for Basque to 8.0 for Vietnamese) are the paper’s pooled and extreme values; per-language rates are not reproduced here. The right panel is a toy simulation.`,
      deps: ['ling-4.8', 'ling-2.9'],
      refs: ['Jurafsky & Martin ch. 3'],
      tags: ['information rate', 'speech rate'],
      links: { doi: 'https://doi.org/10.1126/sciadv.aaw2594' },
      viz(v) {
        const IRm = 39.15, IRsd = 5.10, SRm = 6.63, SRsd = 1.15;
        const mode = v.select('Right panel', [{ value: 'coupled', label: 'with trade-off' }, { value: 'indep', label: 'independent' }], 'coupled', { onChange: () => v.invalidate() });
        let seed = 1; v.button('Resample', () => { seed++; });
        const s1 = v.stage({ x: [3, 11], y: [3, 11], axes: 'box', gutter: true, xlabel: 'speech rate SR (syllables per second)', ylabel: 'information density ID (bits per syllable)', height: 360, title: 'Information-rate plane' });
        const s2 = v.stage({ x: [4, 9], y: [0, 70], axes: 'box', gutter: true, xlabel: 'ID (bits per syllable)', ylabel: 'rate ID × SR (bits/s)', height: 360, title: 'Simulation: 17 languages' });
        const h = s1.handle(7.5, 5.4, { color: 'orange', label: 'a language', labelPos: 'ne' });
        let info = {}, sim = {};
        v.render(() => {
          const xs = []; for (let i = 0; i <= 80; i++) xs.push(3 + (8 * i) / 80);
          s1.between((x) => (IRm - IRsd) / x, (x) => (IRm + IRsd) / x, 3, 11, { fill: 'green', fillAlpha: 0.15 });
          s1.fn((x) => IRm / x, { domain: [3.4, 11], color: 'green', width: 3 });
          s1.vline(SRm, { color: 'muted', dash: true }); s1.text('mean SR 6.6', SRm + 0.1, 10.6, { size: 11, color: 'muted', align: 'left' });
          for (const [nm, id] of [['Basque', 4.8], ['Vietnamese', 8.0]]) { s1.dot(IRm / id, id, { r: 6, hollow: true, color: 'purple', label: nm + ' (ID ' + id + ')', labelPos: 'e' }); }
          const IR = h.y * h.x; info = { IR, z: (IR - IRm) / IRsd, ID: h.y, SR: h.x };
          // right panel
          const r = v.rng(seed * 977 + (mode.value === 'coupled' ? 1 : 2)); const pts = [];
          for (let i = 0; i < 17; i++) {
            const id = 4.8 + 3.2 * r(); let sr;
            if (mode.value === 'coupled') { const R = IRm + IRsd * r.normal(); sr = R / id; } else sr = Math.max(3, SRm + SRsd * r.normal());
            pts.push([id, id * sr]);
          }
          s2.hband(IRm - IRsd, IRm + IRsd, { color: 'green', alpha: 0.15 }); s2.hline(IRm, { color: 'green', width: 2 });
          s2.dots(pts, { r: 5, color: mode.value === 'coupled' ? 'accent' : 'red' });
          const m = pts.reduce((a, p) => a + p[1], 0) / 17, sd = Math.sqrt(pts.reduce((a, p) => a + (p[1] - m) ** 2, 0) / 16);
          sim = { m, sd };
        });
        v.legend([['green', 'IR = 39.15 ± 5.10 bits/s'], ['purple', 'extreme IDs, if at the mean rate', { dot: true }], ['accent', 'simulated languages', { dot: true }]]);
        v.readout(() => `Your language: ID ${v.fix(info.ID, 1)} bits/syllable × SR ${v.fix(info.SR, 1)} syll/s = **${v.fix(info.IR, 1)} bits/s** (${v.fix(info.z, 1)} SD from the pooled mean).\nSimulation: IDs drawn uniformly from 4.8–8.0; ${mode.value === 'coupled' ? 'rates drawn around 39.15 so SR = IR/ID' : 'speech rates drawn independently around 6.63 ± 1.15'}: mean IR ${v.fix(sim.m, 1)}, SD ${v.fix(sim.sd, 1)} bits/s. Without the trade-off the rates spread about twice as wide.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Method',
      name: 'Stylometry and authorship attribution',
      credit: 'Frederick Mosteller & David L. Wallace, 1963 (J. Amer. Statist. Assoc. 58, 275–309) and 1964 (Inference and Disputed Authorship: The Federalist)',
      statement: String.raw`Authors leave a statistical fingerprint in their use of **function words** (*by*, *to*, *upon*, *while*), which are used almost unconsciously and independently of topic. To attribute a disputed text, estimate each candidate's rate for a set of marker words from texts of known authorship and compare the likelihood of the disputed text's counts under the two models; with Poisson counts the log-likelihood ratio is
$$\Lambda=\sum_w\Bigl[c_w\ln\frac{\rho_w^{M}}{\rho_w^{H}}-N\,(\rho^M_w-\rho^H_w)\Bigr],$$
$c_w$ being the count of $w$ in a text of $N$ words and $\rho^{\,\cdot}_w$ the candidates' rates; $\Lambda>0$ favours the second author. Applied to the twelve disputed *Federalist* papers (Nos. 49–58, 62, 63), Mosteller and Wallace found overwhelming evidence for Madison over Hamilton.`,
      idea: String.raw`Hamilton wrote *upon* about three times in a thousand words and Madison almost never; Madison wrote *by* and *whilst* more, Hamilton *would*, *on* less. No single word decides, but a sum of many small log-likelihood ratios does. Mosteller and Wallace used Bayesian (negative-binomial) counts that allow for extra variability between papers; the plain Poisson model used here is cruder and overconfident, so large values of $\Lambda$ should be read as direction rather than as exact odds. The method assumes writers of comparable genre and period and a closed list of candidates.`,
      caption: String.raw`Left: each paper as a point by the rates of two marker words (Hamilton blue, Madison orange, disputed red; joint and Jay papers faint). Choose the two words. Right: $\Lambda$ for each disputed paper from the words you select; positive means Madison. The readout reports the leave-one-out accuracy on the 65 papers of known authorship (Hamilton 51, Madison 14).`,
      scope: String.raw`Counts were computed here from the Project Gutenberg text of *The Federalist* (all 85 papers, about 188 000 words after removing headings), not taken from Mosteller and Wallace's own tables, and the authorship labels follow the usual attribution. The Poisson model is a simplification of their method.`,
      deps: ['ling-4.1'],
      refs: ['Jurafsky & Martin ch. 4'],
      tags: ['function words', 'authorship'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/The_Federalist_Papers#Authorship' },
      viz(v) {
        const OPT = ['upon', 'by', 'to', 'on', 'would', 'there', 'also'].map((w) => ({ value: w, label: w }));
        const xs = v.select('x axis', OPT, 'by', { onChange: () => v.invalidate() });
        const ys = v.select('y axis', OPT, 'upon', { onChange: () => v.invalidate() });
        const ws = v.select('Words for the test', [{ value: 'upon', label: '“upon” only' }, { value: 'bym', label: 'by, from, to' }, { value: 'all', label: 'all 16 words' }], 'bym', { onChange: () => v.invalidate() });
        const s1 = v.stage({ x: [0, 25], y: [0, 10], axes: 'box', gutter: true, xlabel: 'rate of the x word', ylabel: 'rate of the y word', height: 370, title: 'Marker-word rates, one dot per paper' });
        const s2 = v.stage({ x: [0, 13], y: [-30, 30], axes: 'box', gutter: true, xlabel: 'disputed paper', ylabel: 'Λ  (>0: Madison)', height: 370, title: 'Log-likelihood ratio', xticks: DISP.map((p, i) => [i + 0.5, String(p.n)]) });
        let info = {};
        const rate = (p, w) => (1000 * p.c[w]) / p.N;
        v.render(() => {
          const wx = xs.value, wy = ys.value;
          const mx = Math.max(...FED.map((p) => rate(p, wx))) * 1.1, my = Math.max(...FED.map((p) => rate(p, wy))) * 1.1;
          s1.setView([0, Math.max(1, mx)], [0, Math.max(1, my)]); s1.setTitle(`x: “${wx}”, y: “${wy}” (per 1000 words)`);
          for (const [cls, col, r, al] of [['J', 'muted', 3, 0.35], ['HM', 'muted', 3, 0.35], ['H', 'accent', 4, 0.8], ['M', 'orange', 4.5, 0.9], ['?', 'red', 6, 1]])
            s1.dots(FED.filter((p) => p.a === cls).map((p) => [rate(p, wx), rate(p, wy)]), { r, color: col, alpha: al });
          const C = classify(ws.value); const cap = 30;
          const mxv = Math.max(30, ...C.disp.map((d) => Math.abs(d.s)));
          s2.setView([0, 13], [-Math.min(mxv * 1.1, 400), Math.min(mxv * 1.1, 400)]);
          s2.hline(0, { color: 'ink', width: 1.5 });
          C.disp.forEach((d, i) => { s2.rect(i + 0.15, 0, i + 0.85, d.s, { fill: d.s > 0 ? 'orange' : 'accent', fillAlpha: 0.5, color: d.s > 0 ? 'orange' : 'accent' }); });
          void cap; info = { C, nM: C.disp.filter((d) => d.s > 0).length };
        });
        v.legend([['accent', 'Hamilton', { dot: true }], ['orange', 'Madison', { dot: true }], ['red', 'disputed', { dot: true }], ['muted', 'Jay / joint', { dot: true }]]);
        v.readout(() => `Disputed papers favouring Madison with these words: **${info.nM} of 12**. Leave-one-out accuracy of the same rule on papers of known authorship: ${info.C.ok} of ${info.C.tot} (${Math.round(100 * info.C.ok / info.C.tot)}%).\nKnown papers, “upon” per 1000 words: Hamilton ${v.fix(UPON.h, 2)}, Madison ${v.fix(UPON.m, 2)}.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.13
    {
      num: '4.13',
      kind: 'Paper',
      name: 'The Psycho-Biology of Language',
      paper: {
        authors: 'George Kingsley Zipf', year: 1935, title: 'The Psycho-Biology of Language: An Introduction to Dynamic Philology',
        venue: 'Boston: Houghton Mifflin, 1935', url: 'https://archive.org/details/psychobiologyofl0000zipf',
      },
      introduces: ['ling-4.1', 'ling-4.5'],
      credit: 'George Kingsley Zipf, 1935',
      statement: String.raw`Zipf counted the words of real texts and argued that language shows a **dynamic equilibrium** between two pressures: a speaker's wish to say everything with as few distinct words as possible and the listener's wish for each word to mean one thing. Two regularities followed. If words are ranked by frequency, then rank times frequency is roughly constant, $r\cdot f(r)\approx C$ (the rank–frequency law); and the more frequent a word, the shorter it tends to be (the law of abbreviation). Both he attributed to a general *principle of least effort*.`,
      idea: String.raw`Before the book, word statistics had been tabulated for shorthand and for education (counts by Käding, Estoup and others) but not treated as a law of behaviour. Zipf placed the tables in the setting of biology and psychology, found the hyperbola in several languages and in non-linguistic data, and gave it a mechanism, effort minimisation, that is still invoked. Later work (Mandelbrot, 1953) modified the formula to $f=C/(r+b)^{s}$, and showed in turn that random typing gives similar curves (4.2), so the law is informative about shape, not necessarily about mechanism. The book introduced the law of word frequencies (4.1) and the law of abbreviation (4.5).`,
      caption: String.raw`Zipf's own diagnostic: left, the product $r\cdot f(r)$ against rank for the chosen text (his law predicts a horizontal line). Switch on Mandelbrot's correction to see the fit improve at the top ranks. Right: mean length of the words that occur exactly $n$ times, which falls as $n$ grows. The texts are public-domain novels, not Zipf's data (his main sample was *Ulysses*); the book's own tables are not reproduced.`,
      scope: String.raw`The product is only approximately constant: it rises over the first few ranks, is flat through the middle, and falls where the tail’s ties begin. Fits depend on the range used.`,
      deps: [],
      refs: [],
      tags: ['principle of least effort', 'word frequency'],
      verify: true,
      links: { archive: 'https://archive.org/details/psychobiologyofl0000zipf' },
      viz(v) {
        const pk = picker(v);
        const mb = v.toggle('Mandelbrot correction $f=C/(r+b)^s$', false);
        const s1 = v.stage({ x: [1, 5000], y: [0, 4000], xlog: true, axes: 'box', gutter: true, xlabel: 'rank r', ylabel: 'rank × count  (r · f)', height: 360, title: 'Zipf’s product' });
        const s2 = v.stage({ x: [1, 40], y: [0, 10], xlog: true, axes: 'box', gutter: true, xlabel: 'times the word occurs, n', ylabel: 'mean length (letters)', height: 360, title: 'Law of abbreviation' });
        let info = {};
        v.render(() => {
          const c = pk.get(); const rf = c.rf, m = rf.length; const top = Math.max(...rf.slice(0, 2000).map((x, i) => x[1] * (i + 1)));
          s1.setView([1, Math.max(100, m)], [0, top * 1.1]);
          const rr = logRanks(m, 500); s1.dots(rr.map((r) => [r, rf[r - 1][1] * r]), { r: 2.6, color: 'accent' });
          const R = Math.min(m, 1500); const fit = fitLogLog(rf, 1, Math.min(R, 1000));
          let mbFit = null;
          if (mb.value) {
            const lf = rf.slice(0, R).map((x) => Math.log(x[1]));
            const cost = (p) => { const b = Math.abs(p[1]), s = p[2]; let e = 0; for (let r = 1; r <= R; r++) { const d = p[0] - s * Math.log(r + b) - lf[r - 1]; e += d * d; } return e; };
            const o = v.M.nelderMead(cost, [Math.log(rf[0][1]), 1, 1], { step: 0.5, tol: 1e-10, maxIt: 1500 });
            mbFit = { C: Math.exp(o.x[0]), b: Math.abs(o.x[1]), s: o.x[2], sse: o.fx };
            s1.path(rr.filter((r) => r <= R).map((r) => [r, mbFit.C * Math.pow(r + mbFit.b, -mbFit.s) * r]), { color: 'green', width: 3 });
          }
          s1.path([[1, Math.exp(fit.icpt) * Math.pow(1, fit.slope + 1)], [Math.min(m, 1000), Math.exp(fit.icpt) * Math.pow(Math.min(m, 1000), fit.slope + 1)]], { color: 'orange', width: 2, dash: true });
          // length by occurrence count
          const by = new Map(); for (const [w, f] of rf) { if (f > 40) continue; const o = by.get(f) || [0, 0]; o[0] += w.length; o[1]++; by.set(f, o); }
          const pts = [...by.entries()].filter(([, o]) => o[1] >= 5).map(([n, o]) => [n, o[0] / o[1]]).sort((a, b) => a[0] - b[0]);
          s2.setView([1, 40], [0, Math.max(8, ...pts.map((p) => p[1])) * 1.1]);
          s2.path(pts, { color: 'teal', width: 2 }); s2.dots(pts, { r: 4, color: 'teal' });
          const lf = fitLogLog(rf, 1, Math.min(m, 1000));
          info = { s: -lf.slope, mbFit, m, first: pts[0], last: pts[pts.length - 1] };
        });
        v.legend([['accent', 'r · f(r)', { dot: true }], ['orange', 'power-law fit (ranks 1–1000)', { dash: true }], ['green', 'Mandelbrot fit'], ['teal', 'mean length by count', { dot: true }]]);
        v.readout(() => `Zipf’s claim: $r\\cdot f\\approx$ constant, i.e. exponent $s=1$. This text, ranks 1–1000: $s=${v.fix(info.s, 2)}$ (a slope other than 1 tilts the orange line).${info.mbFit ? ` Mandelbrot fit: $s=${v.fix(info.mbFit.s, 2)}$, $b=${v.fix(info.mbFit.b, 1)}$.` : ''}\nWords occurring once average ${v.fix(info.first[1], 1)} letters; those occurring ${info.last[0]} times average ${v.fix(info.last[1], 1)}.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.14
    {
      num: '4.14',
      kind: 'Paper',
      name: 'Prediction and Entropy of Printed English',
      paper: {
        authors: 'C. E. Shannon', year: 1951, title: 'Prediction and Entropy of Printed English',
        venue: 'Bell System Technical Journal 30 (1): 50–64', doi: '10.1002/j.1538-7305.1951.tb01366.x',
      },
      introduces: ['ling-4.8', 'info-11.9'],
      credit: 'Claude E. Shannon, 1951',
      statement: String.raw`Shannon showed how to estimate the entropy of English from human prediction. His series of $N$-gram entropies for a 27-symbol alphabet fell from $F_0=4.76$ bits (all symbols equally likely) through $F_1=4.03$ (letter frequencies), $F_2=3.32$ (digrams) to $F_3=3.1$, and from guessing experiments he derived upper and lower bounds on the entropy per letter that shrink as the number of preceding letters increases, reaching about $1.3$ and $0.6$ bits at 100 letters. English text is therefore more than 70% redundant. The paper also gives the bounds themselves: $\sum_i i(q_i-q_{i+1})\log_2 i\le H\le-\sum_i q_i\log_2q_i$ for the distribution $q_i$ of guess numbers.`,
      idea: String.raw`Previously one could compute $F_N$ only from tables of $N$-gram frequencies, which stop being measurable beyond a few letters. Shannon's insight was that a human who has read English knows far longer-range structure, and that a guessing procedure turns this implicit knowledge into data: the number of guesses needed per letter is a reduced text that is a lossless re-encoding, so its entropy bounds the entropy of the text. The paper thereby introduced the idea of measuring the predictability of language as the guesser's uncertainty, the ancestor of the cross-entropy and perplexity used to score language models (4.9). The bounds were derived for an ideal predictor and applied to a single subject's data, so are estimates.`,
      caption: String.raw`Left: Shannon's published bounds on entropy per letter (27 symbols) against the number $N$ of letters of context (his table, N = 1…15 and 100), with his $F_N$ values as open circles. Right: his decomposition on our letter model: the distribution of guess numbers $q_i$ is a stack of flat rectangles, each of width $i$ and height $q_i-q_{i+1}$, and each contributes entropy $\log_2 i$; slide the model's context to see the bounds close in.`,
      scope: String.raw`The bound values come from the paper's table, read from a scanned copy, and several entries of the interior columns could not be cross-checked against a second source (the endpoints, 0.6 and 1.3 bits at 100 letters, agree with the usual citations). Later estimates are higher: Cover and King (1978) used a gambling version of the game and reported about 1.3 bits per letter. The machine in the right panel is an $n$-gram letter model with at most three letters of context, trained on two novels.`,
      deps: ['info-1.2', 'ling-4.9'],
      refs: [],
      tags: ['entropy of English', 'redundancy'],
      verify: true,
      links: { doi: 'https://doi.org/10.1002/j.1538-7305.1951.tb01366.x' },
      viz(v) {
        const kS = v.slider('letters of context $k$', 0, 3, 3, { int: true });
        const s1 = v.stage({ x: [0, 18], y: [0, 5], axes: 'box', gutter: true, xlabel: 'letters of context + 1 (N)', ylabel: 'bits per letter', height: 360, title: 'Shannon’s bounds (27 symbols)', xticks: [...Array(15).keys()].map((i) => [i + 1, String(i + 1)]).concat([[17, '100']]) });
        const s2 = v.stage({ x: [0, 14], y: [0, 0.6], axes: 'box', gutter: true, xlabel: 'guess number i', ylabel: 'q_i, split into rectangles', height: 360, title: 'Decomposition of the guess distribution' });
        let info = {};
        const memo = {}; const q = (k) => memo[k] || (memo[k] = guessDistribution(letterModel(toSyms(TEXTS.alice + ' ' + TEXTS.pride), 3), toSyms(TEST_TEXT), k));
        v.render(() => {
          const X = (n) => (n === 100 ? 17 : n);
          const up = SH_NS.map((n, i) => [X(n), SH_UP[i]]), lo = SH_NS.map((n, i) => [X(n), SH_LO[i]]);
          s1.poly([...up.slice(0, 15), ...lo.slice(0, 15).reverse()], { fill: 'green', fillAlpha: 0.15, stroke: false });
          s1.path(up.slice(0, 15), { color: 'red', width: 2 }); s1.path(lo.slice(0, 15), { color: 'green', width: 2 });
          s1.line(15, SH_UP[14], 17, SH_UP[15], { color: 'red', width: 1.5, dash: true }); s1.line(15, SH_LO[14], 17, SH_LO[15], { color: 'green', width: 1.5, dash: true });
          s1.dots(up, { r: 4, color: 'red' }); s1.dots(lo, { r: 4, color: 'green' });
          SH_F27.slice(1).forEach((f, i) => s1.dot(i + 1, f, { r: 6, hollow: true, color: 'gold' }));
          s1.hline(4.75, { color: 'muted', dash: true }); s1.text('log₂ 27 = 4.75', 17.6, 4.78, { size: 11, color: 'muted', align: 'right', baseline: 'bottom' });
          s1.text('upper bound', 9, 2.55, { size: 12, color: 'red', align: 'left' }); s1.text('lower bound', 9, 0.55, { size: 12, color: 'green', align: 'left' });
          // decomposition on our model
          const k = kS.value, Q = q(k), b = shannonBounds(Q), n = 13;
          s2.setView([0, n + 1], [0, Math.max(0.2, Q[0] * 1.15)]);
          for (let j = 0; j < n; j++) {
            let y0 = 0;
            for (let i = 27; i >= j + 1; i--) { const d = Q[i - 1] - (Q[i] || 0); if (d <= 0) continue; s2.rect(j + 0.55, y0, j + 1.45, y0 + d, { fill: v.ramp(Math.min(1, Math.log2(i) / 4.8), 'accent', 'orange'), fillAlpha: 0.85, color: 'panel', width: 0.5 }); y0 += d; }
            s2.text(String(j + 1), j + 1, 0, { size: 10, color: 'muted', align: 'center', baseline: 'top', dy: 14 });
          }
          s2.text('colour = i (large i = darker)', n + 0.7, Q[0] * 1.08, { size: 11, color: 'muted', align: 'right' });
          info = { b, k, Q };
        });
        v.legend([['red', 'Shannon: upper bound'], ['green', 'Shannon: lower bound'], ['gold', 'F_N (N-gram entropy)', { dot: true }]]);
        v.readout(() => `Shannon’s table at 100 letters of context: 0.6 ≤ H ≤ 1.3 bits per letter (the interior values come from a scan; see scope). Cover and King’s 1978 gambling estimate was about 1.3.\nOur letter model with ${info.k} letter${info.k === 1 ? '' : 's'} of context: first-guess hits ${v.fix(100 * info.Q[0], 0)}%, ${v.fix(info.b.lower, 2)} ≤ H ≤ ${v.fix(info.b.upper, 2)} bits per letter: the same two formulas applied to its guesses on a held-out passage.`);
      },
    },
  ],
};
