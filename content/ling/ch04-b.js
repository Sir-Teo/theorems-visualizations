import {ngramModel,uidHypothesis} from './source-audit-language-models.js';
// Linguistics & Language — Chapter 4, part b: items 4.6–4.10
import { corpus, TEXTS, TEST_TEXT, TEXT_LABELS, syllables, toSyms, letterModel, guessOrder, guessDistribution, shannonBounds, letterEntropies, SYMS, tokenize, wordModel, perplexity, generateWords } from './ch04.shared.js';

// ---- shared by 4.7, 4.8
let _LM = null, _TRAIN = null;
const trainSyms = () => (_TRAIN || (_TRAIN = toSyms(TEXTS.alice + ' ' + TEXTS.pride)));
const letterLM = () => (_LM || (_LM = letterModel(trainSyms(), 3)));
const _qCache = {};
const modelQ = (k) => (_qCache[k] || (_qCache[k] = guessDistribution(letterLM(), toSyms(TEST_TEXT), k)));
const sentencesOf = (text) => (text.match(/[^.;]+[.;]/g) || []).map((x) => x.trim()).filter((x) => x.length >= 40 && x.length <= 105);

// ---- 4.6 helpers
const MENZ_TEXTS = [{ value: 'alice', label: 'English (Alice)' }, { value: 'pride', label: 'English (Pride & Prej.)' }, { value: 'de', label: 'German' }, { value: 'es', label: 'Spanish' }];
function menzerathData(key, weighted) {
  const c = corpus(key); const lang = key === 'de' || key === 'es' ? key : 'en'; const by = new Map();
  for (const [w, f] of c.rf) {
    const k = syllables(w, lang); if (k > 7 || w.length < 1) continue; const wt = weighted ? f : 1; let o = by.get(k);
    if (!o) by.set(k, (o = { k, n: 0, sL: 0, sL2: 0, sW: 0 })); const y = w.length / k;
    o.n += wt; o.sL += wt * y; o.sL2 += wt * y * y; o.sW += wt * w.length;
  }
  return [...by.values()].filter((o) => o.n >= 5).sort((a, b) => a.k - b.k).map((o) => ({ k: o.k, n: o.n, y: o.sL / o.n, sd: Math.sqrt(Math.max(0, o.sL2 / o.n - (o.sL / o.n) ** 2)), L: o.sW / o.n }));
}

// ---- 4.7 helpers
const CIPHER_TEXTS = [
  { label: 'A', text: 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.' },
  { label: 'B', text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.' },
  { label: 'C', text: 'I am by birth a Genevese, and my family is one of the most distinguished of that republic. My ancestors had been for many years counsellors and syndics, and my father had filled several public situations with honour and reputation.' },
];
const ENG_ORDER = (() => { const c = new Array(26).fill(0); for (const x of trainSyms()) if (x < 26) c[x]++; const t = c.reduce((a, b) => a + b, 0); const ord = [...Array(26).keys()].sort((a, b) => c[b] - c[a]); return { ord, f: c.map((x) => x / t) }; })();

export default {
  collection: 'ling',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Law',
      name: 'Menzerath’s law',
      credit: 'Paul Menzerath (qualitative observation for German; his work is cited as 1928 or 1954); given its mathematical form by Gabriel Altmann, 1980 (Glottometrika 2, 1–10)',
      statement: String.raw`The larger a linguistic construct, the smaller its constituents: the more syllables a word has, the shorter its syllables are on average (and likewise for clauses made of more words, words made of more morphs, sounds in longer syllables). Altmann's formula for the mean constituent size $y$ as a function of the number $x$ of constituents is
$$y(x)\;=\;a\,x^{\,b}\,e^{-cx},\qquad b<0,\ c\ge 0,$$
which reduces to a power law $y=a\,x^{b}$ when $c=0$.`,
      idea: String.raw`Part of the effect is arithmetic and part is substance. If every extra syllable added a full average syllable's worth of letters, syllable length would be flat; instead words grow more slowly than they gain syllables, because speakers compress the parts of long words: the second panel shows word length rising far less than in proportion to syllable count. The law is general (it is found in genomes and music too), and it has been argued to follow from a simple trade-off, a constant total budget shared among parts. Here syllable length is measured in letters and syllables are counted by a heuristic, so the picture is a proxy for the phonetic law.`,
      caption: String.raw`Pick a language and whether to count word types or running words. Dots with bars: mean letters per syllable (±1 SD) for words of $x$ syllables; the curve is Altmann's formula fitted by least squares (log scale). Right: mean word length against syllable count, with the dashed line “no compression” (length proportional to syllables).`,
      scope: String.raw`A statistical tendency measured on averages; words are not constrained individually. Proxy measurement: syllables are counted by vowel groups, and orthographic letters stand in for sound duration.`,
      deps: ['ling-4.5'],
      refs: ['Jurafsky & Martin ch. 2'],
      tags: ['syllables', 'word length'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Menzerath%27s_law' },
      viz(v) {
        const tx = v.select('Text', MENZ_TEXTS, 'alice', { onChange: () => v.invalidate() });
        const wt = v.select('Count', [{ value: 'types', label: 'word types' }, { value: 'tokens', label: 'running words' }], 'types');
        const form = v.select('Fit', [{ value: 'alt', label: '$a x^b e^{-cx}$' }, { value: 'pow', label: '$a x^b$' }], 'alt');
        const s1 = v.stage({ x: [0.5, 7.5], y: [0, 8], axes: 'box', gutter: true, xlabel: 'syllables in the word, x', ylabel: 'letters per syllable, y', height: 340, title: 'Syllable length' });
        const s2 = v.stage({ x: [0.5, 7.5], y: [0, 14], axes: 'box', gutter: true, xlabel: 'syllables in the word, x', ylabel: 'mean word length (letters)', height: 340, title: 'Word length' });
        let info = {};
        v.render(() => {
          const D = menzerathData(tx.value, wt.value === 'tokens'); if (D.length < 3) return;
          const ymax = Math.max(...D.map((d) => d.y + d.sd)) * 1.1; s1.setView([0.5, 7.5], [0, Math.max(3, ymax)]);
          const w = D.map((d) => Math.sqrt(d.n));
          const cost = (p) => { let e = 0; D.forEach((d, i) => { const m = form.value === 'alt' ? Math.log(Math.abs(p[0]) + 1e-9) + p[1] * Math.log(d.k) - p[2] * p[2] * d.k : Math.log(Math.abs(p[0]) + 1e-9) + p[1] * Math.log(d.k); e += w[i] * (m - Math.log(d.y)) ** 2; }); return e; };
          const fitr = v.M.nelderMead(cost, form.value === 'alt' ? [D[0].y, -0.3, 0.05] : [D[0].y, -0.3, 0], { step: 0.3, tol: 1e-10, maxIt: 2000 });
          const [a, b, cc0] = fitr.x; const c = form.value === 'alt' ? cc0 * cc0 : 0;
          s1.fn((x) => Math.abs(a) * Math.pow(x, b) * Math.exp(-c * x), { domain: [1, 7], color: 'green', width: 3 });
          for (const d of D) { s1.line(d.k, Math.max(0, d.y - d.sd), d.k, d.y + d.sd, { color: 'accent', width: 1.5, alpha: 0.6 }); s1.dot(d.k, d.y, { r: 3 + Math.min(7, Math.log10(d.n)), color: 'accent' }); }
          s2.setView([0.5, 7.5], [0, Math.max(...D.map((d) => d.L)) * 1.15]);
          s2.line(1, D[0].L, 7, 7 * D[0].L, { color: 'muted', dash: true, width: 1.5 });
          s2.path(D.map((d) => [d.k, d.L]), { color: 'orange', width: 2.5 }); s2.dots(D.map((d) => [d.k, d.L]), { r: 5, color: 'orange' });
          info = { a: Math.abs(a), b, c, D };
        });
        v.legend([['accent', 'mean ± SD of letters per syllable', { dot: true }], ['green', 'fitted curve'], ['orange', 'mean word length', { dot: true }]]);
        v.readout(() => (info.D ? `Fit: $y=${v.fix(info.a, 2)}\\,x^{${v.fix(info.b, 2)}}${info.c ? `e^{-${v.fix(info.c, 3)}x}` : ''}$. Words with 1 syllable: ${v.fix(info.D[0].y, 2)} letters per syllable; with ${info.D[info.D.length - 1].k}: ${v.fix(info.D[info.D.length - 1].y, 2)}.\nWord length grows from ${v.fix(info.D[0].L, 1)} to ${v.fix(info.D[info.D.length - 1].L, 1)} letters while syllables multiply by ${info.D[info.D.length - 1].k}.` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Concept',
      name: 'Letter frequencies and frequency analysis',
      credit: 'Al-Kindī, 9th century (earliest known description of cryptanalysis by letter frequencies)',
      statement: String.raw`In any sizeable text of a given language the letters occur with characteristic, very unequal frequencies (in English *e* is far the most common, then *t*, *a*, *o*, *i*, *n*, while *z*, *q*, *x*, *j* are rare). A **monoalphabetic substitution cipher**, which replaces each letter by a fixed other letter, preserves these frequencies, only relabelled. Hence the ranked ciphertext frequencies match the ranked plaintext frequencies roughly, and the cipher can be broken by matching them and then correcting using words and letter combinations.`,
      idea: String.raw`The cipher changes the *names* of the letters but not their counts, so the histogram is a fingerprint of the language. Matching by rank gets the commonest letters nearly right, and the less frequent ones are ambiguous (their counts differ by chance), so one finishes by reasoning about words: a single-letter word is *a* or *I*, a frequent three-letter word is likely *the*, and so on. The method fails against ciphers that flatten the histogram (several cipher letters per plain letter), which is why later systems used polyalphabetic ciphers.`,
      caption: String.raw`Top row: ciphertext letters in order of frequency with their bars; bottom row: plain English letters in order of frequency, with bars hanging below. Click a cipher letter, then a plain letter, to propose the pair. “Match by rank” makes the first guess for you. The text below shows your current decryption (· = unassigned).`,
      scope: String.raw`Works on texts of a few hundred letters or more in a known language; short messages have noisy counts. English reference frequencies here are computed from two novels, not from a standard table.`,
      deps: [],
      refs: ['Jurafsky & Martin ch. 2'],
      tags: ['letter frequency', 'cryptanalysis'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Frequency_analysis' },
      viz(v) {
        const pick = v.select('Passage', CIPHER_TEXTS.map((t, i) => ({ value: String(i), label: t.label })), '0', { onChange: () => { assign.fill(-1); sel = -1; build(); } });
        let seed = 3; const assign = new Array(26).fill(-1); let sel = -1; let key = null, cipher = '', plain = '', cf = [], order = [];
        function build() {
          plain = CIPHER_TEXTS[+pick.value].text.toLowerCase().replace(/[^a-z ]/g, '').replace(/ +/g, ' ');
          const r = v.rng(seed); key = r.shuffle([...Array(26).keys()]);
          cipher = [...plain].map((ch) => (ch === ' ' ? ' ' : String.fromCharCode(97 + key[ch.charCodeAt(0) - 97]))).join('');
          cf = new Array(26).fill(0); for (const ch of cipher) if (ch !== ' ') cf[ch.charCodeAt(0) - 97]++;
          order = [...Array(26).keys()].sort((a, b) => cf[b] - cf[a] || a - b);
        }
        build();
        v.button('New key', () => { seed++; assign.fill(-1); sel = -1; build(); });
        v.button('Match by rank', () => { assign.fill(-1); order.forEach((c, i) => { assign[c] = ENG_ORDER.ord[i]; }); });
        v.button('Clear', () => { assign.fill(-1); sel = -1; });
        const s = v.stage({ x: [0, 26], y: [0, 10], axes: false, height: 360 });
        s.onClick((x, y) => {
          const i = Math.floor(x); if (i < 0 || i > 25) return;
          if (y > 5.6) sel = order[i]; else if (y < 4.4 && sel >= 0) { const pl = ENG_ORDER.ord[i]; for (let c = 0; c < 26; c++) if (assign[c] === pl) assign[c] = -1; assign[sel] = pl; }
        });
        const maxC = () => Math.max(...cf); const maxF = ENG_ORDER.f[ENG_ORDER.ord[0]];
        v.render(() => {
          order.forEach((c, i) => {
            const h = (cf[c] / maxC()) * 2.0, x = i + 0.5, on = c === sel;
            s.rect(x - 0.36, 7, x + 0.36, 7 + h, { fill: 'orange', fillAlpha: on ? 0.7 : 0.35, color: 'orange', width: on ? 2.5 : 1 });
            s.text(String.fromCharCode(65 + c), x, 6.3, { size: 15, color: on ? 'accent' : 'ink', align: 'center', baseline: 'middle' });
            s.text(String(cf[c]), x, 6.85 + h + 0.0, { size: 9.5, color: 'muted', align: 'center', baseline: 'bottom', dy: -2 });
            const pl = assign[c]; s.text(pl >= 0 ? String.fromCharCode(97 + pl) : '·', x, 5.0, { size: 15, color: pl >= 0 ? 'green' : 'faint', align: 'center', baseline: 'middle' });
          });
          ENG_ORDER.ord.forEach((pl, i) => {
            const h = (ENG_ORDER.f[pl] / maxF) * 2.0, x = i + 0.5;
            const used = assign.includes(pl);
            s.rect(x - 0.36, 3.7 - h, x + 0.36, 3.7, { fill: 'accent', fillAlpha: used ? 0.15 : 0.4, color: 'accent', width: 1 });
            s.text(String.fromCharCode(97 + pl), x, 4.1, { size: 15, color: used ? 'faint' : 'ink', align: 'center', baseline: 'middle' });
          });
          s.text('ciphertext letters by frequency', 0.1, 9.85, { size: 12, color: 'muted', align: 'left', baseline: 'top' });
          s.text('your proposed plaintext letter', 0.1, 5.5, { size: 11, color: 'muted', align: 'left', baseline: 'bottom' });
          s.text('English letters by frequency (from two novels)', 0.1, 0.35, { size: 12, color: 'muted', align: 'left', baseline: 'bottom' });
        });
        const wrap = (str, n) => { const out = []; let line = ''; for (const w of str.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); } if (line) out.push(line); return out; };
        v.readout(() => {
          const dec = [...cipher].map((ch) => (ch === ' ' ? ' ' : assign[ch.charCodeAt(0) - 97] >= 0 ? String.fromCharCode(97 + assign[ch.charCodeAt(0) - 97]) : '·')).join('');
          let ok = 0, tot = 0; for (let i = 0; i < plain.length; i++) if (plain[i] !== ' ') { tot++; if (dec[i] === plain[i]) ok++; }
          const cl = wrap(cipher.toUpperCase(), 52), n = cl.length; const dl = []; let p = 0; for (const l of cl) { dl.push(dec.slice(p, p + l.length)); p += l.length + 1; }
          return cl.map((l, i) => `${l}\n${dl[i]}`).join('\n') + `\nLetters correct so far: ${ok} of ${tot} (${Math.round(100 * ok / tot)}%).${n ? '' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Concept',
      name: 'The entropy of English (Shannon’s guessing game)',
      credit: 'Claude E. Shannon, 1951 (Bell System Technical Journal 30, 50–64)',
      statement: String.raw`Treat English as a stream of 27 symbols (the letters and the space). The **entropy** $H$ of this source is the average number of bits needed per symbol by the best possible code, and it equals the average uncertainty about the next symbol given the entire past. Shannon estimated $H$ by having people predict a text one letter at a time: if $q_i$ is the relative frequency of being right on the $i$-th guess, then
$$\sum_{i}i\,(q_i-q_{i+1})\log_2 i\;\le\;H\;\le\;-\sum_i q_i\log_2 q_i,$$
and the more context the guesser has, the smaller both bounds become. With long context he found about 0.6 to 1.3 bits per letter, so English is more than 70% redundant compared with 4.75 bits for 27 equiprobable symbols.`,
      idea: String.raw`A perfect guesser with the same knowledge as the language itself would be right first time as often as the language allows; the list of guesses it makes is a re-encoding of the text from which the text can be recovered, so the entropy of the guess numbers bounds the entropy of the text from above. The lower bound comes from imagining each guess-number distribution as a mixture of flat distributions over the first $i$ guesses (each with entropy $\log_2 i$). More context, from letter frequencies to digrams to words and meaning, means more first-guess hits. Reader's estimates from a few dozen guesses are noisy; Shannon used 100 passages per context length.`,
      caption: String.raw`Play: click the letters to guess the next letter of a hidden sentence (cells show how many guesses each letter took). Press “New passage” for more data. Next to your guesses, a letter model that has read two novels (with 0 to 3 letters of context, chosen above) plays the same game over a held-out Frankenstein passage of about 4 000 letters; its guess-number bars and bounds appear alongside.`,
      scope: String.raw`The bounds are statistical: they hold in the limit for a guesser who uses the true conditional probabilities, and with few samples (or an imperfect guesser) are only estimates. The machine here is a plain n-gram letter model, far weaker than a human with a dictionary.`,
      deps: ['ling-4.7', 'info-1.2'],
      refs: ['Jurafsky & Martin ch. 3'],
      tags: ['entropy', 'redundancy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Entropy_(information_theory)#Entropy_as_information_content' },
      viz(v) {
        const kSel = v.select('Model context', [{ value: '0', label: '0 letters' }, { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }], '3');
        const SENT = sentencesOf(TEST_TEXT); let pi = 0; const rng = v.rng(4); let order = rng.shuffle([...Array(SENT.length).keys()]);
        let P = [], pos = 0, g = 1, tried = new Set(); const hist = []; const all = new Array(27).fill(0);
        function load() { P = Array.from(toSyms(SENT[order[pi % order.length]])); pos = 0; g = 1; tried = new Set(); hist.length = 0; }
        load();
        v.button('New passage', () => { pi++; load(); });
        v.button('Reset my statistics', () => { all.fill(0); load(); });
        const s = v.stage({ x: [0, 22], y: [2.7, 11], axes: false, height: 420, full: true });
        const s2 = v.stage({ x: [0, 11], y: [0, 0.6], axes: 'box', gutter: true, xlabel: 'guess number i', ylabel: 'q_i (share of letters right on guess i)', height: 300 });
        const W = 22, KX = 6.5;
        s.onClick((x, y) => {
          if (pos >= P.length) return; const r = 5 - Math.floor(y), c = Math.floor(x - KX); if (r < 0 || r > 2 || c < 0 || c > 8) return;
          const idx = r * 9 + c; if (idx > 26 || tried.has(idx)) return;
          if (idx === P[pos]) { hist.push(g); all[Math.min(26, g - 1)]++; pos++; g = 1; tried = new Set(); } else { tried.add(idx); g++; }
        });
        v.render(() => {
          for (let j = 0; j < P.length; j++) {
            const row = Math.floor(j / W), col = j % W, x = col + 0.5, y = 10.5 - row; const done = j < pos;
            const gc = done ? hist[j] : 0; const colr = gc === 1 ? 'green' : gc <= 3 ? 'gold' : 'red';
            s.rect(x - 0.45, y - 0.42, x + 0.45, y + 0.42, { fill: done ? colr : 'panel', fillAlpha: done ? 0.28 : 0.05, color: j === pos ? 'accent' : done ? colr : 'faint', width: j === pos ? 3 : 1, radius: 5 });
            if (done) { s.text(P[j] === 26 ? '␣' : SYMS[P[j]].toUpperCase(), x, y + 0.08, { size: 16, color: 'ink', align: 'center', baseline: 'middle' }); s.text(String(gc), x + 0.28, y - 0.3, { size: 9.5, color: 'muted', align: 'right', baseline: 'middle' }); }
          }
          for (let idx = 0; idx < 27; idx++) {
            const r = Math.floor(idx / 9), c = idx % 9, x = KX + c + 0.5, y = 5.5 - r; const bad = tried.has(idx);
            s.rect(x - 0.44, y - 0.42, x + 0.44, y + 0.42, { fill: bad ? 'red' : 'accent', fillAlpha: bad ? 0.2 : 0.12, color: bad ? 'red' : 'accent', width: 1.2, radius: 6 });
            s.text(idx === 26 ? 'space' : SYMS[idx].toUpperCase(), x, y, { size: idx === 26 ? 11 : 16, color: bad ? 'faint' : 'ink', align: 'center', baseline: 'middle' });
          }
          s.text(pos >= P.length ? 'Passage complete. Press “New passage”.' : `Guess the next letter (guess no. ${g}). The passage has no punctuation or capitals.`, 0.2, 7.0, { size: 13, color: 'muted', align: 'left', baseline: 'middle' });
          // distribution panel
          const tot = all.reduce((a, b) => a + b, 0); const k = +kSel.value; const mq = modelQ(k);
          s2.setView([0, 11], [0, 0.65]);
          for (let i = 0; i < 10; i++) {
            const x = i + 1; s2.rect(x - 0.42, 0, x, mq[i], { fill: 'accent', fillAlpha: 0.5, color: 'accent' });
            const rq = tot ? all[i] / tot : 0; s2.rect(x, 0, x + 0.42, rq, { fill: 'orange', fillAlpha: 0.5, color: 'orange' });
            s2.text(String(x), x, -0.0, { size: 10, color: 'muted', align: 'center', baseline: 'top', dy: 14 });
          }
        });
        v.legend([['accent', 'letter model', { area: true }], ['orange', 'you', { area: true }]]);
        v.readout(() => {
          const tot = all.reduce((a, b) => a + b, 0), k = +kSel.value, mq = modelQ(k), mb = shannonBounds(mq);
          const Fn = letterEntropies(trainSyms());
          let me = '';
          if (tot >= 5) { const q = all.map((x) => x / tot), b = shannonBounds(q), avg = all.reduce((a, x, i) => a + x * (i + 1), 0) / tot; me = `You: ${tot} letters, ${v.fix(avg, 2)} guesses per letter on average, first-guess hits ${v.fix(100 * q[0], 0)}%. Bounds ${v.fix(b.lower, 2)} ≤ H ≤ ${v.fix(b.upper, 2)} bits per letter (very noisy with this few letters).`; } else me = `You: ${tot} letters so far (play at least a few sentences).`;
          return me + `\nLetter model, ${k} letter${k === 1 ? '' : 's'} of context, on a held-out text: first-guess hits ${v.fix(100 * mq[0], 0)}%, bounds ${v.fix(mb.lower, 2)} ≤ H ≤ ${v.fix(mb.upper, 2)} bits per letter.\nFor comparison, uniform 27 symbols give 4.75 bits; letter frequencies alone ${v.fix(Fn[0], 2)}, digrams ${v.fix(Fn[1], 2)} (estimates from the training novels; Shannon’s published 27-letter values are 4.76, 4.03, 3.32 and 3.1).`;
        });
      },
    },
    // Source-audited finite language models and UID illustration.
    ngramModel,
    uidHypothesis,
  ],
};
