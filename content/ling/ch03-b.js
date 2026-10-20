// Linguistics & Language — Chapter 3: Morphology: the structure of words (items 3.6–3.10)
import { MORPH_COLOR } from './ch03.shared.js';
import {rootTemplateConcept,reduplicationConcept} from './source-audit-morphology.js';
import irregularConcept from './source-audit-irregular.js';

// ---------- 3.6: one clause in four languages (my own analysis of each word, see the caption) ----------
// morphemes: [surface, gloss, 'r' root | 'a' affix, number of grammatical features an affix carries]
const TYPO = {
  zh: { name: 'Mandarin', free: 'I can’t hear (clearly)', words: [[['wǒ', '1SG', 'r']], [['tīng', 'hear', 'r']], [['bu', 'NEG', 'r']], [['qīngchu', 'clear', 'r']]] },
  tr: { name: 'Turkish', free: 'I can’t hear well', words: [[['iyi', 'well', 'r']], [['duy', 'hear', 'r'], ['a', 'ABIL', 'a', 1], ['mı', 'NEG', 'a', 1], ['yor', 'PRS', 'a', 1], ['um', '1SG', 'a', 2]]] },
  la: { name: 'Latin', free: 'I do not hear well', words: [[['nōn', 'not', 'r']], [['bene', 'well', 'r']], [['audi', 'hear', 'r'], ['ō', '1SG.PRS.IND.ACT', 'a', 5]]] },
  iu: { name: 'Inuktitut', free: 'I can’t hear very well', words: [[['tusaa', 'hear', 'r'], ['tsiaq', 'well', 'a', 1], ['junnaq', 'be able', 'a', 1], ['nngit', 'NEG', 'a', 1], ['tu', 'one who', 'a', 1], ['alu', 'very', 'a', 1], ['u', 'be', 'a', 1], ['junga', '1SG.IND', 'a', 3]]] },
};
for (const L of Object.values(TYPO)) {
  const ms = L.words.flat(); L.W = L.words.length; L.M = ms.length; L.mw = L.M / L.W;
  const aff = ms.filter((m) => m[2] === 'a'); L.fus = aff.length ? aff.reduce((a, m) => a + m[3], 0) / aff.length : 0; L.nAff = aff.length;
}
const TYPO_ZONES = [[0.1, 1.3, 'isolating', 'left'], [3.7, 0.3, 'agglutinative', 'left'], [2.0, 3.9, 'fusional', 'left'], [8.9, 3.0, 'polysynthetic', 'right']];

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
    {
      num: '3.6',
      kind: 'Concept',
      name: 'Morphological typology',
      credit: 'Index of synthesis: Greenberg, 1954/1960 (after Sapir, 1921)',
      statement: String.raw`Languages differ in how much structure they pack into a word. Along the **index of synthesis** (morphemes per word) they run from **isolating** languages (about one morpheme per word, as in Mandarin and Vietnamese) through **synthetic** ones to **polysynthetic** languages, where a single word can be a whole clause (Inuktitut). A second axis is **fusion**: in **agglutinative** languages (Turkish) each affix carries one meaning and the boundaries are clean, in **fusional** languages (Latin) one affix packs several grammatical features together. The classes are tendencies; real languages mix them.`,
      idea: String.raw`Typology is a way of measuring, not of labelling: count the morphemes in a text and divide by the words (Greenberg's index), and count how many grammatical features each affix bundles. The tool does this on one clause per language, glossed by hand from the standard analyses. A single sentence is a very small sample, so the points are an illustration and the real index is an average over a text; the point is that the two axes are independent (Turkish and Inuktitut are both agglutinating, but one packs eight morphemes into a word and the other three).`,
      caption: String.raw`Choose a language (or click a dot on the right) to read the clause morpheme by morpheme: roots blue, affixes teal, with their glosses. The plot gives each clause's morphemes per word and the average number of grammatical features per affix, and shades nothing: the labels mark where the textbook classes sit. The four clauses are rough counterparts of “I can’t hear (very) well” and are **not** word-for-word translations. My own segmentation, checked against reference grammars only for Turkish ability/negation, Mandarin potential complements and the Inuktitut example (Wikipedia's *Inuit grammar*); Latin is from memory, and conventions for counting (is *qīngchu* one morpheme? is *-junga* one or two?) change the numbers a little.`,
      deps: ['ling-3.1'],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['typology', 'synthesis'],
      verify: true,
      scope: String.raw`One clause per language, hand-glossed: this illustrates the measure and is not a measurement of the languages' indices (Greenberg's used text samples of 100 words).`,
      viz(v) {
        const sel = v.select('Language', Object.entries(TYPO).map(([k, L]) => ({ value: k, label: L.name })), 'tr');
        const s = v.stage({ x: [0, 12], y: [0, 6.2], axes: false, height: 330, weight: 1.4, minWidth: 340, title: 'the clause, morpheme by morpheme' });
        const sp = v.stage({ x: [0, 9], y: [-0.5, 6], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 300, xlabel: 'morphemes per word', ylabel: 'features per affix', title: 'two axes of typology' });
        const keys = Object.keys(TYPO);
        sp.onClick((x, y) => { let b = null, bd = 0.9; for (const k of keys) { const L = TYPO[k], d = Math.hypot((L.mw - x) / 9, (L.fus - y) / 6.5) * 6; if (d < bd) { bd = d; b = k; } } if (b) sel.set(b); });
        v.render(() => {
          const L = TYPO[sel.value];
          const wid = (m) => Math.max(1.0, 0.16 * Math.max(m[0].length, m[1].length) + 0.55);
          const gaps = 0.55 * (L.words.length - 1) + 0.08 * (L.M - L.W);
          const tot = L.words.flat().reduce((a, m) => a + wid(m), 0) + gaps, sc = Math.min(1.25, 11.4 / tot);
          let x = 6 - (tot * sc) / 2;
          L.words.forEach((w) => {
            const x0 = x;
            w.forEach((m) => {
              const ww = wid(m) * sc, col = m[2] === 'r' ? 'accent' : 'teal';
              s.rect(x, 3.5, x + ww, 4.4, { fill: col, fillAlpha: 0.22, color: col, width: 1.8, radius: 7 });
              s.text(m[0], x + ww / 2, 3.95, { size: 15.5, color: 'ink', align: 'center', baseline: 'middle' });
              s.text(m[1], x + ww / 2, 3.2, { size: 11, color: 'muted', align: 'center', baseline: 'top' });
              x += ww + 0.08 * sc;
            });
            x -= 0.08 * sc;
            s.text(w.map((m) => m[0]).join(''), (x0 + x) / 2, 5.1, { size: 14, color: 'ink', align: 'center', baseline: 'middle' });
            s.line(x0, 4.7, x, 4.7, { color: 'muted', width: 1.2 });
            x += 0.55 * sc;
          });
          s.text(`“${L.free}”`, 6, 1.9, { size: 14, color: 'muted', align: 'center' });
          s.text(`${L.M} morphemes in ${L.W} word${L.W > 1 ? 's' : ''}`, 6, 1.1, { size: 13, color: 'ink', align: 'center' });
          for (const [zx, zy, name, al] of TYPO_ZONES) sp.text(name, zx, zy, { size: 12, color: 'faint', align: al });
          for (const k of keys) {
            const M = TYPO[k], on = k === sel.value;
            if (on) sp.dot(M.mw, M.fus, { r: 13, hollow: true, color: 'gold' });
            sp.dot(M.mw, M.fus, { r: 6, color: on ? 'accent' : 'muted', fill: on ? 'accent' : 'muted', label: M.name, labelPos: k === 'zh' ? 'ne' : k === 'la' ? 'ne' : 'n' });
          }
        });
        v.readout(() => {
          const L = TYPO[sel.value];
          return `**${L.name}**: ${L.M} morphemes in ${L.W} word${L.W > 1 ? 's' : ''}, so **${v.fix(L.mw, 2)}** morphemes per word; ${L.nAff ? `its ${L.nAff} affix${L.nAff > 1 ? 'es' : ''} ${L.nAff > 1 ? 'carry' : 'carries'} on average **${v.fix(L.fus, 2)}** grammatical features each` : 'it has no affixes in this clause'}.`;
        });
      },
    },
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
