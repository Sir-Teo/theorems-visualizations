// Linguistics & Language — Chapter 3: Morphology: the structure of words (items 3.6–3.10)
import typologyConcept from './source-audit-typology.js';
import {rootTemplateConcept,reduplicationConcept} from './source-audit-morphology.js';
import irregularConcept from './source-audit-irregular.js';

// ---------- 3.7: two toy models of an affix ----------
function runModel(rand, kind, N, par, checks) {
  const counts = []; let V = 0, n1 = 0; const toks = new Int32Array(N); let cum = null;
  if (kind === 'closed') { cum = []; let t = 0; for (let i = 1; i <= par.S; i++) { t += 1 / i; cum.push(t); } cum = cum.map((x) => x / t); }
  const out = []; let ci = 0;
  for (let n = 1; n <= N; n++) {
    let id;
    if (kind === 'open') id = n === 1 || rand() < par.theta ? counts.length : toks[Math.floor(rand() * (n - 1))];
    else { const u = rand(); let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < u) lo = m + 1; else hi = m; } id = lo; }
    toks[n - 1] = id; const c = counts[id] || 0; if (c === 0) { V++; n1++; } else if (c === 1) n1--; counts[id] = c + 1;
    if (n === checks[ci]) { out.push({ n, V, n1 }); ci++; }
  }
  return out;
}
const makeChecks = (N) => { const a = []; for (let k = 0; ; k++) { const n = Math.round(20 * 2 ** (k / 4)); if (n > N) break; if (!a.length || n > a[a.length - 1]) a.push(n); } return a; };

export default {
  collection: 'ling',
  chapter: 3,
  items: [
    typologyConcept,
    {
      num: '3.7',
      kind: 'Concept',
      name: 'Productivity',
      credit: 'Hapax-based measure: Baayen, 1989; Baayen & Lieber, 1991',
      statement: String.raw`An affix is **productive** when speakers readily use it to coin new words and when new formations go unnoticed (*-ness*, which attaches to almost any adjective, and the plural *-s*), and **unproductive** when its words are a closed, learned set (*-th* in *warmth*, *depth*, *width*). Baayen's corpus measure counts the **hapax legomena** (words occurring once in a corpus) among the tokens of the affix: $P=n_1/N$, where $n_1$ is the number of hapaxes with the affix and $N$ the total number of its tokens. For sampling from a fixed population $P$ is the Good–Turing estimate of the probability that the next token is a word not seen before; for a process that keeps inventing words it is a conservative estimate of that rate, but it still ranks the processes correctly.`,
      idea: String.raw`A closed list is exhausted quickly: after a while every token is a repeat and the hapaxes vanish ($n_1/N\to0$). An open process keeps minting new words, and in any finite sample some of them occur just once, so $n_1/N$ stays positive. This is the Good–Turing logic of unseen species: the frequency of singletons estimates the probability mass of what has not been seen. The affix does not need many words to be productive, only a steady supply of new ones; and the rare words are exactly where the rule is visible, because they could not have been learned individually (see also the wug test, 10.4).`,
      caption: String.raw`**This is a model, not corpus data** (I have no corpus counts for *-ness* or *-th* to show). Green: a productive affix, simulated as a process that coins a new word with probability $\theta$ at each token and otherwise repeats an old one with probability proportional to its past use. Red: a closed list of $S$ words with Zipf-distributed frequencies. The left panel shows the number of distinct words, the right panel $P=n_1/N$ (lines) against the rate at which new words really appear over the next stretch of text (dots): for the closed list both fall to zero, and for the productive affix both stay positive, with the real rate about twice $P$ in this particular process: the hapax ratio ranks the affixes correctly, which is what it is used for. Raise the size of the closed list to see how a big fixed set can look productive until the list runs out.`,
      deps: ['ling-3.5'],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['productivity', 'corpus'],
      scope: String.raw`Both processes are idealisations: real productivity also depends on phonological, semantic and syntactic restrictions on the base, and corpus hapaxes include rare, not only new, words.`,
      viz(v) {
        const th = v.slider('θ, chance a token is a new word', 0.01, 0.3, 0.08, { step: 0.01 });
        const S = v.slider('size S of the closed list', 20, 3000, 200, { log: true, int: true });
        const Nsel = v.select('tokens N', [{ value: 2000, label: '2 000' }, { value: 10000, label: '10 000' }, { value: 50000, label: '50 000' }], 10000);
        const s1 = v.stage({ x: [20, 10000], y: [10, 10000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 300, xlabel: 'tokens of the affix, N', ylabel: 'distinct words', title: 'vocabulary growth' });
        const s2 = v.stage({ x: [20, 10000], y: [0, 0.5], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 300, xlabel: 'tokens of the affix, N', ylabel: 'hapaxes / N', title: 'P = n₁/N against the real rate of new words' });
        v.legend([['green', 'productive'], ['red', 'closed list'], ['ink', 'line: P = n₁/N', {}], ['ink', 'dots: new words in the next stretch', { dot: true }]]);
        let cache = { key: '' }, last = null;
        v.render(() => {
          const N = Nsel.value, key = `${N}|${th.value}|${S.value}`;
          if (cache.key !== key) {
            const ch = makeChecks(N);
            cache = { key, ch, open: runModel(v.rng(11), 'open', N, { theta: th.value }, ch), closed: runModel(v.rng(12), 'closed', N, { S: S.value }, ch) };
          }
          const rate = (A, k) => (A[k + 4].V - A[k].V) / (A[k + 4].n - A[k].n);
          let ymax = 0.1;
          for (const A of [cache.open, cache.closed]) for (const d of A) ymax = Math.max(ymax, d.n1 / d.n);
          s1.setView([20, N], [10, N]); s2.setView([20, N], [0, Math.min(1, ymax * 1.15)]);
          s1.path([[20, 20], [N, N]], { color: 'faint', dash: true, width: 1 }); s1.text('every token a new word', N * 0.1, N * 0.1 * 2.3, { size: 10, color: 'faint', align: 'left' });
          [[cache.open, 'green'], [cache.closed, 'red']].forEach(([A, c]) => {
            s1.path(A.map((d) => [d.n, d.V]), { color: c, width: 2.5 });
            s2.path(A.map((d) => [d.n, d.n1 / d.n]), { color: c, width: 2.5 });
            for (let k = 0; k + 4 < A.length; k++) s2.dot(A[k].n, rate(A, k), { r: 4.5, hollow: true, color: c });
          });
          const o = cache.open, c = cache.closed;
          last = { N, Po: o[o.length - 1].n1 / N, Pc: c[c.length - 1].n1 / N, Vo: o[o.length - 1].V, Vc: c[c.length - 1].V, ro: rate(o, o.length - 5), rc: rate(c, c.length - 5) };
        });
        v.readout(() => `After N = ${last.N}: productive affix ${last.Vo} words, P = **${v.fix(last.Po, 3)}** (new-word rate over the last stretch ${v.fix(last.ro, 3)}); closed list ${last.Vc} words, P = **${v.fix(last.Pc, 3)}** (rate ${v.fix(last.rc, 3)}).`);
      },
    },
    rootTemplateConcept,
    reduplicationConcept,
    irregularConcept,
  ],
};
