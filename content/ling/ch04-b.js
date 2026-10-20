import menzerathConcept from './source-audit-menzerath.js';
import {shannonGuessConcept} from './source-audit-shannon.js';
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
    menzerathConcept,
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
    // Source-audited ideal finite-source bounds and saved practice game.
    shannonGuessConcept,
    // Source-audited finite language models and UID illustration.
    ngramModel,
    uidHypothesis,
  ],
};
