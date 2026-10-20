// Linguistics & Language — Chapter 4: The statistical laws of language (items 4.1–4.5; 4.6–4.10 in ch04-b.js, 4.11–4.14 in ch04-c.js)
import { corpus, TEXT_OPTS, TEXT_LABELS, MINE_DEFAULT, fitLogLog, logRanks, vocabGrowth, spearman, rankFreq } from './ch04.shared.js';

/** Corpus chooser shared by 4.1, 4.4, 4.5: a segmented choice plus a text field that appears for "Your text". */
function textPicker(v, init = 'alice') {
  const st = { key: init, mine: MINE_DEFAULT };
  const sel = v.select('Text', TEXT_OPTS, init, { onChange: () => v.invalidate() });
  const inp = v.input('Your text', MINE_DEFAULT, { width: 360, onChange: () => v.invalidate() });
  const get = () => {
    st.key = sel.value; inp.el.hidden = st.key !== 'mine';
    let c = corpus(st.key, inp.value || '');
    if (st.key === 'mine' && c.tokens.length < 20) { st.key = 'alice'; c = corpus('alice'); st.fallback = true; } else st.fallback = false;
    return c;
  };
  return { get, st, sel };
}
const sci = (x) => (x >= 1000 ? (x / 1000).toFixed(x >= 10000 ? 0 : 1) + 'k' : String(x));

export default {
  collection: 'ling',
  chapter: 4,
  title: 'The statistical laws of language',
  summary: String.raw`Texts in every language obey striking regularities: word frequency falls off as a power of rank, vocabulary keeps growing as a sublinear power of text length, and common words are short. These laws can be reproduced by surprisingly simple processes, which tempers what can be concluded from them. Information theory measures how predictable language is, and recent work suggests that languages trade speed against information density to converge on similar rates.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Law',
      name: 'Zipf’s law of word frequencies',
      credit: 'George Kingsley Zipf, 1935 (popularised in Human Behavior and the Principle of Least Effort, 1949)',
      statement: String.raw`List the distinct words of a large text by decreasing frequency and number them $r=1,2,3,\dots$. Then the frequency $f(r)$ of the word of rank $r$ is approximately a power law,
$$f(r)\;\approx\;\frac{C}{r^{\,s}},\qquad s\approx 1,$$
so on log–log axes the rank–frequency plot is close to a straight line of slope $-s$. In English the most frequent word (*the*) accounts for about 5–7% of running text, the second for about half as much, and so on; about half of all distinct words occur only once.`,
      idea: String.raw`The law is empirical: nothing in grammar forces it, and it holds, with $s$ near 1, across languages, genres and even non-linguistic data such as city sizes. It is a straight line only in the middle: the very top ranks bend away (a handful of function words behave individually), and the tail falls in a staircase because the least frequent words all tie at $f=1$ (hapax legomena), $f=2$, and so on. Fitting by least squares on the log–log plot is convenient but statistically crude; the next items show that very different mechanisms (4.2, 4.3) also produce power-law-like plots.`,
      caption: String.raw`Pick a text, or paste your own. Every dot is a distinct word. Drag the two fit-range sliders: the least-squares slope changes with the stretch of ranks you fit, and the dashed line shows slope exactly $-1$. Watch the staircase of ties at the bottom right.`,
      scope: String.raw`Holds roughly for ranks from about 10 up to a few thousand in texts of at least tens of thousands of words; shorter texts show the tail staircase earlier, and the fitted exponent depends on the range used.`,
      deps: [],
      refs: ['Jurafsky & Martin ch. 2'],
      tags: ['power law', 'word frequency'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zipf%27s_law' },
      viz(v) {
        const pk = textPicker(v);
        const lo = v.slider('fit from rank', 1, 1000, 5, { int: true, log: true });
        const hi = v.slider('fit to rank', 10, 8000, 1000, { int: true, log: true });
        const s = v.stage({ x: [1, 20000], y: [0.7, 4000], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'rank r', ylabel: 'count f(r)', height: 380 });
        let fit = null, c = null;
        v.render(() => {
          c = pk.get(); const rf = c.rf; const m = rf.length;
          const ranks = logRanks(m, 450);
          const a = Math.min(lo.value, hi.value - 1), b = Math.max(hi.value, a + 1);
          fit = fitLogLog(rf, a, b);
          s.vband(Math.min(a, m), Math.min(b, m), { color: 'orange', alpha: 0.1 });
          s.path([[1, Math.exp(Math.log(rf[0][1]))], [m, rf[0][1] / m]], { color: 'muted', dash: true, width: 1.5 });
          s.dots(ranks.map((r) => [r, rf[r - 1][1]]), { r: 2.6, color: 'accent' });
          const r1 = Math.min(a, m), r2 = Math.min(b, m);
          s.path([[r1, Math.exp(fit.icpt) * Math.pow(r1, fit.slope)], [r2, Math.exp(fit.icpt) * Math.pow(r2, fit.slope)]], { color: 'green', width: 3 });
          s.text('slope −1', 300, rf[0][1] / 300 * 0.55, { size: 12, color: 'muted', align: 'left', baseline: 'top' });
          for (let i = 0; i < Math.min(4, m); i++) s.text(rf[i][0], i + 1.15, rf[i][1] * 1.25, { size: 12, color: 'ink', align: 'left', baseline: 'bottom' });
        });
        v.legend([['accent', 'distinct words', { dot: true }], ['green', 'least-squares fit on the shaded ranks'], ['muted', 'slope −1 through the top word', { dash: true }]]);
        v.readout(() => {
          if (!c) return '';
          const tot = c.tokens.length, types = c.rf.length, hap = c.rf.filter((x) => x[1] === 1).length;
          return `${TEXT_LABELS[c.key] || 'your text'}: ${tot} tokens, ${types} distinct words, ${(100 * hap / types).toFixed(0)}% occur once.\nFitted slope $s=${v.fix(-fit.slope, 2)}$ (so $f\\propto r^{-${v.fix(-fit.slope, 2)}}$), $R^2=${v.fix(fit.r2, 3)}$. Top word “${c.rf[0][0]}” = ${(100 * c.rf[0][1] / tot).toFixed(1)}% of the text.${pk.st.fallback ? '\n(Your text is too short; showing Alice.)' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Random typing produces Zipf’s law (Miller)',
      credit: 'George A. Miller, 1957 (the argument, stated without proof); proved by Wentian Li, 1992; related model by Benoit Mandelbrot, 1953',
      statement: String.raw`Let a “monkey” type independently at each step a space with probability $\sigma$ or one of $M$ letters, each with probability $(1-\sigma)/M$. Cut the stream at spaces into “words”. Then the word of rank $r$ has frequency
$$f(r)\;\propto\;r^{-\alpha},\qquad \alpha=1-\frac{\ln(1-\sigma)}{\ln M}\;\approx\;1\ (\text{for}\ \sigma\ \text{small}),$$
up to a staircase: all $M^{\ell}$ words of length $\ell$ have the same probability $\tfrac{\sigma}{1-\sigma}\bigl(\tfrac{1-\sigma}{M}\bigr)^{\ell}$.`,
      idea: String.raw`Shorter words are exponentially more probable, but there are exponentially more long words. A word of length $\ell$ has rank about $M^{\ell}$ and probability about $((1-\sigma)/M)^{\ell}$, so eliminating $\ell$ gives $f\propto r^{-\alpha}$ with the exponent above. The plot is a staircase with a step at each word length, and the steps average out into a line. The lesson is a warning: a straight line on a rank–frequency plot is weak evidence for any particular theory of language, because a process with no meaning at all produces one; what differs is the detail (the real distribution has no exact plateaus and obeys other constraints).

For $M\ge2$ letters and $0<\sigma<1$, independence makes the probability of a fixed $\ell$-letter string followed by space the product $\sigma[(1-\sigma)/M]^\ell$ (prob 2.1.13). Conditioning on a nonempty word divides by $1-\sigma$, giving the displayed word probability. Separately, the product rule (comb 1.1) counts $M^\ell$ different strings of that length, and the sum rule accumulates their rank blocks over lengths. These are distinct steps: equal within-length probabilities create plateaus, while the exponentially growing block counts produce the power-law envelope, rather than an exact smooth equality at every rank.`,
      caption: String.raw`Drag the alphabet size $M$ and the space probability $\sigma$ and press Resample. The orange stairs are the exact expected frequencies by word length; the dots are a simulated 150 000-character typing session. Switch on the real text to compare shapes (relative frequencies on both).`,
      scope: String.raw`A null model: it explains the shape of the rank–frequency plot, not why real languages have word-frequency distributions with particular words in particular places. Real texts are not stationary random streams.`,
      deps: ['ling-4.1', 'prob-2.1.13', 'comb-1.1'],
      refs: ['Jurafsky & Martin ch. 2'],
      tags: ['power law', 'null model'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zipf%27s_law#Theoretical_review' },
      viz(v) {
        const Ms = v.slider('alphabet size $M$', 2, 26, 6, { int: true });
        const sg = v.slider('space probability $\\sigma$', 0.05, 0.4, 0.18, { step: 0.01 });
        const real = v.toggle('compare with Alice', true);
        let seed = 1; v.button('Resample', () => { seed++; });
        const s = v.stage({ x: [1, 1e5], y: [1e-8, 1], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'rank r', ylabel: 'relative frequency', height: 380 });
        const NCH = 150000; let cache = null, info = {};
        function simulate(M, sig, sd) {
          const key = M + '|' + sig + '|' + sd; if (cache && cache.key === key) return cache.rf;
          const r = v.rng(sd * 7919 + M); const cnt = new Map(); let cur = ''; let n = 0;
          for (let i = 0; i < NCH; i++) {
            if (r() < sig) { if (cur) { cnt.set(cur, (cnt.get(cur) || 0) + 1); n++; cur = ''; } } else cur += String.fromCharCode(97 + Math.floor(r() * M));
          }
          const rf = [...cnt.entries()].sort((a, b) => b[1] - a[1]); rf.n = n; cache = { key, rf }; return rf;
        }
        v.render(() => {
          const M = Ms.value, sig = sg.value; const rf = simulate(M, sig, seed); const n = rf.n;
          // exact stairs
          let start = 1;
          for (let l = 1; l <= 12; l++) {
            const cntL = Math.pow(M, l), p = (sig / (1 - sig)) * Math.pow((1 - sig) / M, l);
            if (start > 1e5) break;
            s.path([[start, p], [Math.min(start + cntL - 1, 3e5), p]], { color: 'orange', width: 3 });
            start += cntL;
          }
          if (real.value) { const c = corpus('alice'); const N = c.tokens.length; s.dots(logRanks(c.rf.length, 300).map((r) => [r, c.rf[r - 1][1] / N]), { r: 2.4, color: 'purple' }); }
          s.dots(logRanks(rf.length, 600).map((r) => [r, rf[r - 1][1] / n]), { r: 2.4, color: 'accent' });
          let last = rf.length; while (last > 1 && rf[last - 1][1] < 5) last--;
          const fit = fitLogLog(rf, Math.min(M + 1, Math.max(1, last - 2)), Math.max(last, 2));
          info = { fit, types: rf.length, n, alpha: 1 - Math.log(1 - sig) / Math.log(M) };
        });
        v.legend([['accent', 'simulated typing', { dot: true }], ['orange', 'expected stairs (exact)'], ['purple', 'Alice, relative frequency', { dot: true }]]);
        v.readout(() => `${info.n} “words”, ${info.types} distinct. Predicted exponent $\\alpha=1-\\ln(1-\\sigma)/\\ln M=${v.fix(info.alpha, 3)}$; fitted slope on ranks past the one-letter words with count at least 5: $${v.fix(-info.fit.slope, 3)}$.\nThe line is straight although nothing here has meaning: every word of one length is equally likely.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Simon’s rich-get-richer process',
      credit: 'Herbert A. Simon, 1955 (Biometrika 42, 425–440); Udny Yule, 1925, for the biological precursor',
      statement: String.raw`Build a text one word at a time. With probability $\alpha$ the next word is brand new; with probability $1-\alpha$ it repeats a word drawn uniformly from the earlier running text, so each word is chosen in proportion to how often it has already occurred. Then the number of distinct words grows linearly, $V(N)\approx\alpha N$, and the word of rank $r$ has frequency
$$f(r)\;\propto\;r^{-(1-\alpha)},$$
a Zipf curve whose exponent is $1-\alpha$, approaching 1 when new words are rare.`,
      idea: String.raw`Preferential attachment: a word that has been used often is likely to be used again, and since a copied word is drawn from the *tokens*, its chance is proportional to its current count. Balancing the rate at which words climb to count $k$ against the rate at which they leave it yields a stationary distribution of counts with tail $k^{-(1+1/(1-\alpha))}$, which is the rank–frequency exponent $1-\alpha$ in disguise. The process also makes a prediction that fails for real text: vocabulary grows *linearly*, not sublinearly (compare Heaps' law, 4.4), so it is a model of the shape of the frequency curve and not of text as a whole.

Let $I_j$ indicate an innovation at token $j$. The first token is new, while every subsequent innovation has probability $\alpha$ in this model. Since $V_N=1+\sum_{j=2}^N I_j$, linearity of expectation (prob 1.6.1) gives the exact identity $E V_N=1+\alpha(N-1)$ without any assumption about dependence between different indicators. The statement's $\alpha N$ is its large-$N$ form; this calculation does not establish the separate rank-frequency tail approximation or describe topic-dependent real text.`,
      caption: String.raw`Slide $\alpha$ (the chance of coining a new word) and the text length. Left: the simulated rank–frequency plot against the predicted slope. Right: vocabulary size against position, which is a straight line of slope $\alpha$.`,
      scope: String.raw`Idealised growth model with no grammar. Real vocabularies grow sublinearly and real word choice depends on context and topic.`,
      deps: ['ling-4.1', 'prob-1.6.1'],
      refs: ['Jurafsky & Martin ch. 2'],
      tags: ['preferential attachment', 'power law'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Preferential_attachment' },
      viz(v) {
        const al = v.slider('$\\alpha$ (new-word rate)', 0.01, 0.6, 0.12, { step: 0.01 });
        const Ns = v.slider('length $N$', 2000, 200000, 60000, { int: true, log: true, sig: 2 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const s1 = v.stage({ x: [1, 1e5], y: [0.7, 1e5], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'rank r', ylabel: 'count', height: 340, title: 'Rank–frequency' });
        const s2 = v.stage({ x: [0, 200000], y: [0, 40000], axes: 'box', gutter: true, xlabel: 'position N', ylabel: 'distinct words V(N)', height: 340, title: 'Vocabulary growth' });
        let cache = null, info = {};
        function sim(a, N, sd) {
          const key = a + '|' + N + '|' + sd; if (cache && cache.key === key) return cache;
          const r = v.rng(sd * 104729 + 3); const toks = new Int32Array(N); const cnt = []; let V = 0; const growth = [];
          for (let i = 0; i < N; i++) {
            let w; if (i === 0 || r() < a) { w = V++; cnt.push(0); } else w = toks[Math.floor(r() * i)];
            toks[i] = w; cnt[w]++; if (i % Math.max(1, Math.floor(N / 150)) === 0) growth.push([i + 1, V]);
          }
          growth.push([N, V]);
          const rf = cnt.map((c, i) => [i, c]).sort((x, y) => y[1] - x[1]); cache = { key, rf, growth, V }; return cache;
        }
        v.render(() => {
          const a = al.value, N = Ns.value; const d = sim(a, N, seed);
          s2.setView([0, N * 1.04], [0, Math.max(10, d.V * 1.1)]);
          const rf = d.rf; const m = rf.length; const rr = logRanks(m, 500);
          s1.setView([1, Math.max(100, m * 1.5)], [0.7, rf[0][1] * 2]);
          const lo = 3, hi = Math.max(10, Math.min(m, 300)); const sl = -(1 - a);
          let c0 = 0; for (let r = lo; r <= hi; r++) c0 += Math.log(rf[r - 1][1]) - sl * Math.log(r); c0 = Math.exp(c0 / (hi - lo + 1));
          s1.dots(rr.map((r) => [r, rf[r - 1][1]]), { r: 2.5, color: 'accent' });
          s1.path([[1, c0], [m, c0 * Math.pow(m, sl)]], { color: 'orange', width: 2.5, dash: true });
          s2.path(d.growth, { color: 'accent', width: 2.5 });
          s2.line(0, 0, N, a * N, { color: 'orange', width: 2, dash: true });
          info = { fit: fitLogLog(rf, 3, Math.min(m, 300)), V: d.V, N, a };
        });
        v.legend([['accent', 'simulation', { dot: true }], ['orange', 'prediction: slope −(1−α) and V = αN', { dash: true }]]);
        v.readout(() => `$N=${info.N}$ tokens, $V=${info.V}$ distinct words (αN = ${Math.round(info.a * info.N)}). Fitted slope on ranks 3–300: $${v.fix(info.fit.slope, 3)}$; predicted $-(1-\\alpha)=${v.fix(-(1 - info.a), 3)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Law',
      name: 'Heaps’ law of vocabulary growth',
      credit: 'Gustav Herdan, 1960; Harold S. Heaps, 1978 (Information Retrieval: Computational and Theoretical Aspects) — often called the Herdan–Heaps law',
      statement: String.raw`If $V(N)$ is the number of distinct words among the first $N$ words of a text, then
$$V(N)\;\approx\;K\,N^{\beta},\qquad 0<\beta<1,$$
typically $\beta\approx 0.4$–$0.7$ for natural-language texts and $K$ of order 10–100: the vocabulary never stops growing, but each new stretch of text brings fewer new words.`,
      idea: String.raw`New words are rarer the more text has been seen: the chance that the next word is new equals the proportion of the text's probability carried by words not yet met, which shrinks as common words are used up but never reaches zero because of the long Zipf tail. If frequencies follow a Zipf law with exponent $s>1$ then a sampling argument gives $\beta\approx 1/s$, a link between 4.1 and 4.4; with $s$ near 1, as in real text, the relation is only a rough guide and $\beta$ is estimated directly.

In a finite fixed-vocabulary sampling model, write the observed vocabulary as the sum of indicators that each type has appeared. Linearity of expectation (prob 1.6.1) gives $E V_N=\sum_j[1-(1-p_j)^N]$ for independent tokens with type probabilities $p_j$. Thus common types saturate early and progressively rarer types contribute later, making the expected increments decrease. This is an explicit sampling calculation underlying the explanation, not a proof of a universal Heaps exponent: a finite vocabulary ultimately saturates, and correlated or changing text need not follow this model.`,
      caption: String.raw`Choose a text (or paste one) and watch $V(N)$ on log–log axes. The green line is the fit to everything beyond the minimum $N$ you choose; the dashed line is the ceiling $V=N$ (every word new). Switch on “shuffle words”: topic clustering is destroyed and the curve changes slightly, but remains a power law.`,
      scope: String.raw`A single homogeneous text; very short texts, or texts that change topic or language, bend the curve. The exponent depends on the language and on how words are counted (word forms versus lemmas).`,
      deps: ['ling-4.1', 'prob-1.6.1'],
      refs: ['Jurafsky & Martin ch. 2'],
      tags: ['vocabulary growth', 'power law'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heaps%27_law' },
      viz(v) {
        const pk = textPicker(v);
        const shuf = v.toggle('shuffle words', false);
        const nmin = v.slider('fit from $N\\ge$', 20, 5000, 200, { int: true, log: true, sig: 2 });
        const s = v.stage({ x: [1, 40000], y: [1, 10000], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'text length N (words)', ylabel: 'distinct words V(N)', height: 380 });
        let info = {}; const cacheShuf = {};
        v.render(() => {
          const c = pk.get(); let toks = c.tokens;
          if (shuf.value) { const k = c.key + c.tokens.length; if (!cacheShuf[k]) cacheShuf[k] = v.rng(11).shuffle(c.tokens); toks = cacheShuf[k]; }
          const g = vocabGrowth(toks, 160); const n = toks.length;
          const pts = g.filter(([N]) => N >= nmin.value); let fit = { slope: NaN, icpt: NaN };
          if (pts.length > 3) {
            let sx = 0, sy = 0, sxx = 0, sxy = 0; const k = pts.length;
            for (const [N, V] of pts) { const x = Math.log(N), y = Math.log(V); sx += x; sy += y; sxx += x * x; sxy += x * y; }
            const slope = (k * sxy - sx * sy) / (k * sxx - sx * sx); fit = { slope, icpt: (sy - slope * sx) / k };
          }
          s.setView([1, Math.max(100, n * 1.3)], [1, Math.max(50, g[g.length - 1][1] * 2)]);
          s.path([[1, 1], [n, n]], { color: 'muted', dash: true, width: 1.5 });
          s.vband(nmin.value, n, { color: 'orange', alpha: 0.08 });
          s.path(g, { color: 'accent', width: 2.8 });
          if (!isNaN(fit.slope)) s.path([[nmin.value, Math.exp(fit.icpt) * Math.pow(nmin.value, fit.slope)], [n, Math.exp(fit.icpt) * Math.pow(n, fit.slope)]], { color: 'green', width: 2.5, dash: [8, 5] });
          const zf = fitLogLog(rankFreq(toks), 1, Math.min(2000, c.rf.length));
          info = { fit, n, V: g[g.length - 1][1], zs: -zf.slope, key: c.key };
        });
        v.legend([['accent', 'V(N) of the text'], ['green', 'fit K·N^β', { dash: true }], ['muted', 'V = N', { dash: true }]]);
        v.readout(() => `${info.n} words, ${info.V} distinct. Fit: $\\beta=${v.fix(info.fit.slope, 3)}$, $K=${v.fix(Math.exp(info.fit.icpt), 1)}$.\nZipf slope of the same text ≈ ${v.fix(info.zs, 2)}, so the heuristic $1/s$ would suggest $\\beta\\approx${v.fix(1 / info.zs, 2)}$ (only reliable when $s>1$ clearly).`);
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Law',
      name: 'Zipf’s law of abbreviation',
      credit: 'George Kingsley Zipf, 1935 (The Psycho-Biology of Language); quantified across 10 languages by Piantadosi, Tily & Gibson, PNAS 2011, who found information content predicts word length better',
      statement: String.raw`More frequent words tend to be shorter: across the word types of a language, length (in letters, phonemes or syllables) and frequency are negatively correlated, $\rho_{\text{Spearman}}(\text{length},\text{frequency})<0$. Zipf explained it by a principle of least effort: a speaker saves effort by giving short forms to words used often.`,
      idea: String.raw`Think of word forms as a code for meanings. If every word cost the same, nothing would be saved; with costs growing with length, an efficient code (as in Huffman or Morse coding) gives its shortest codewords to its most probable messages. Words like *the*, *of*, *I* are short, and long words (*unforgettable*) are rare; clippings such as *phone* from *telephone* are the historical mechanism. The correlation is far from perfect: rare short words (*ox*, *awl*) and frequent long ones exist.

The coding argument uses a safe exchange (algo 10.3). Hold a finite set of distinct codewords and their positive length costs fixed. If $p_i>p_j$ but $\ell_i>\ell_j$, swapping their meanings preserves every codeword and any prefix-free property, while changing expected cost by $-(p_i-p_j)(\ell_i-\ell_j)<0$. Repeating removes such inversions. This explains why a cost-minimising assignment pairs larger probabilities with shorter forms under these assumptions; it neither derives actual lexicons nor proves that every observed frequency-length correlation has this cause.`,
      caption: String.raw`Left: every word type as a dot (rank on the log axis, length in letters); the green curve is the mean length in rank bins. Right: mean length by frequency class. Raise the minimum count to ignore the many words that occur once, and switch on “permute lengths” to see what no relation looks like.`,
      scope: String.raw`Holds as a statistical tendency in all languages studied; it is weaker among very rare words. Length is measured here in letters, a proxy for time or effort.`,
      deps: ['ling-4.1', 'algo-10.3'],
      refs: ['Jurafsky & Martin ch. 2'],
      tags: ['least effort', 'word length'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Brevity_law' },
      viz(v) {
        const pk = textPicker(v);
        const mc = v.slider('min. count', 1, 20, 1, { int: true });
        const perm = v.toggle('permute lengths', false);
        const s1 = v.stage({ x: [1, 20000], y: [0, 20], xlog: true, axes: 'box', gutter: true, xlabel: 'frequency rank', ylabel: 'letters', height: 340, title: 'Word types' });
        const s2 = v.stage({ x: [0, 8], y: [0, 10], axes: 'box', gutter: true, xlabel: 'frequency class', ylabel: 'mean length (letters)', height: 340, title: 'Mean length by count' });
        let info = {};
        const CL = [[1, 1], [2, 2], [3, 4], [5, 8], [9, 16], [17, 64], [65, 1e9]];
        const CLN = ['1', '2', '3–4', '5–8', '9–16', '17–64', '65+'];
        v.render(() => {
          const c = pk.get(); let types = c.rf.filter((x) => x[1] >= mc.value);
          let len = types.map((x) => x[0].length);
          if (perm.value) len = v.rng(5).shuffle(len);
          const m = types.length; s1.setView([1, Math.max(50, c.rf.length)], [0, Math.max(...len, 6) + 1]);
          s1.dots(logRanks(m, 700).map((r) => [r, len[r - 1] + (((r * 2654435761) >>> 0) % 100) / 250 - 0.2]), { r: 2, color: 'accent', alpha: 0.5 });
          // mean length in log-spaced rank bins
          const edges = []; for (let k = 0; k <= 14; k++) edges.push(Math.round(Math.exp(Math.log(m + 1) * k / 14))); const bins = [];
          for (let k = 0; k < 14; k++) { const a = Math.max(edges[k], 1), b = edges[k + 1]; if (b <= a) continue; let sum = 0; for (let r = a; r < b; r++) sum += len[r - 1] || 0; bins.push([Math.sqrt(a * b), sum / (b - a)]); }
          s1.path(bins, { color: 'green', width: 3 }); s1.dots(bins, { r: 4, color: 'green' });
          const freq = types.map((x) => x[1]);
          const rho = m > 3 ? spearman(len, freq) : NaN;
          let tokLen = 0, tokN = 0; types.forEach((x, i) => { tokLen += len[i] * x[1]; tokN += x[1]; });
          const typeLen = len.reduce((a, b) => a + b, 0) / m;
          // classes
          const cls = CL.map(([a, b]) => { let sum = 0, n = 0; types.forEach((x, i) => { if (x[1] >= a && x[1] <= b) { sum += len[i]; n++; } }); return n ? sum / n : null; });
          s2.setView([0, 8], [0, Math.max(10, ...cls.filter((x) => x))]);
          cls.forEach((mv, i) => { if (mv == null) return; s2.rect(i + 0.6, 0, i + 1.4, mv, { fill: perm.value ? 'muted' : 'teal', fillAlpha: 0.5, color: perm.value ? 'muted' : 'teal' }); s2.text(CLN[i], i + 1, -0.5, { size: 11, color: 'muted', align: 'center', baseline: 'top' }); s2.text(mv.toFixed(1), i + 1, mv + 0.15, { size: 11, color: 'ink', align: 'center', baseline: 'bottom' }); });
          info = { rho, tokLen: tokLen / tokN, typeLen, m };
        });
        v.legend([['accent', 'word types', { dot: true }], ['green', 'mean length per rank bin'], ['teal', 'mean length per count class', { area: true }]]);
        v.readout(() => `${info.m} word types. Spearman $\\rho$(length, count) $=${v.fix(info.rho, 3)}$. Mean length: ${v.fix(info.typeLen, 2)} letters per type, ${v.fix(info.tokLen, 2)} per running word (frequent short words pull the token average down).`);
      },
    },
  ],
};
