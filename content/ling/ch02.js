// Linguistics & Language — Chapter 2: Phonology: sound systems (items 2.1–2.5)
import { FEATS, FEAT_NAME, SEG, sgn, CHART_SYMS, chartLayout, chartSymAt, drawChart, applyRule, parseWord, showWord, specTeX, specText, segDistance } from './ch02.shared.js';

// ---------- 2.1: inventories and a small lexicon of minimal pairs (illustrative; written from memory, see captions) ----------
const C_POS = { p: [0, 0], t: [3, 0], k: [6, 0], b: [0, 1], d: [3, 1], g: [6, 1], f: [1, 2], θ: [2, 2], s: [3, 2], ʃ: [4, 2], x: [6, 2], h: [7, 2], v: [1, 3], ð: [2, 3], z: [3, 3], ʒ: [4, 3], tʃ: [4, 4], dʒ: [4, 5], m: [0, 6], n: [3, 6], ɲ: [5, 6], ŋ: [6, 6], ɾ: [3, 7], r: [3, 8], w: [0, 9], ɹ: [4, 9], j: [5, 9], l: [3, 10] };
const C_ROWS = ['voiceless stop', 'voiced stop', 'voiceless fricative', 'voiced fricative', 'voiceless affricate', 'voiced affricate', 'nasal', 'tap', 'trill', 'approximant', 'lateral'];
const C_COLS = ['labial', 'lab-dent', 'dental', 'alveolar', 'post-alv', 'palatal', 'velar', 'glottal'];
const V_POS = { i: [0.1, 3], ɪ: [0.95, 2.5], e: [0.5, 2], ɛ: [0.95, 1.1], æ: [0.9, 0.3], a: [2.1, 0.2], ʌ: [2.7, 1.25], ɑ: [3.5, 0.2], ɔ: [3.35, 0.95], o: [3.7, 2], ʊ: [3.0, 2.5], u: [3.9, 3] };
const INV = {
  en: { name: 'English', C: 'p b t d k g f v θ ð s z ʃ ʒ h tʃ dʒ m n ŋ l ɹ j w', V: 'i ɪ e ɛ æ ʌ ɑ ɔ o ʊ u' },
  es: { name: 'Spanish (Castilian)', C: 'p b t d k g f θ s x tʃ m n ɲ ɾ r l j w', V: 'i e a o u' },
  ja: { name: 'Japanese', C: 'p b t d k g s z ʃ h tʃ dʒ m n ɾ j w', V: 'i e a o u' },
};
for (const k in INV) { INV[k].C = INV[k].C.split(' '); INV[k].V = INV[k].V.split(' '); }
const PAIRS = {
  en: [['pat', 'bat', 'p', 'b'], ['bat', 'mat', 'b', 'm'], ['tip', 'dip', 't', 'd'], ['cap', 'gap', 'k', 'g'], ['fan', 'pan', 'f', 'p'], ['van', 'ban', 'v', 'b'], ['thin', 'sin', 'θ', 's'], ['thy', 'dye', 'ð', 'd'], ['zoo', 'sue', 'z', 's'],
    ['ship', 'sip', 'ʃ', 's'], ['sheep', 'cheap', 'ʃ', 'tʃ'], ['jet', 'yet', 'dʒ', 'j'], ['rice', 'lice', 'ɹ', 'l'], ['wine', 'vine', 'w', 'v'], ['sing', 'sin', 'ŋ', 'n'], ['hot', 'lot', 'h', 'l'], ['rum', 'run', 'm', 'n'],
    ['bit', 'beat', 'ɪ', 'i'], ['bet', 'bat', 'ɛ', 'æ'], ['bait', 'bet', 'e', 'ɛ'], ['pull', 'pool', 'ʊ', 'u'], ['cut', 'cot', 'ʌ', 'ɑ'], ['bought', 'boat', 'ɔ', 'o']],
  es: [['pata', 'bata', 'p', 'b'], ['pala', 'bala', 'p', 'b'], ['tía', 'día', 't', 'd'], ['casa', 'gasa', 'k', 'g'], ['cama', 'cana', 'm', 'n'], ['cana', 'caña', 'n', 'ɲ'], ['pero', 'perro', 'ɾ', 'r'], ['pera', 'pela', 'ɾ', 'l'], ['faro', 'paro', 'f', 'p'],
    ['chico', 'pico', 'tʃ', 'p'], ['caza', 'casa', 'θ', 's'], ['caja', 'cada', 'x', 'd'], ['mata', 'mala', 't', 'l'], ['mesa', 'misa', 'e', 'i'], ['sal', 'sol', 'a', 'o'], ['pico', 'poco', 'i', 'o'], ['pata', 'pita', 'a', 'i'], ['coma', 'cama', 'o', 'a']],
  ja: [['kaki', 'kagi', 'k', 'g'], ['hashi', 'kashi', 'h', 'k'], ['mori', 'nori', 'm', 'n'], ['mado', 'mato', 'd', 't'], ['tai', 'dai', 't', 'd'], ['kama', 'kana', 'm', 'n'], ['kasa', 'kata', 's', 't'], ['kara', 'kata', 'ɾ', 't'], ['kawa', 'kara', 'w', 'ɾ'],
    ['kuro', 'kiro', 'u', 'i'], ['kame', 'kami', 'e', 'i'], ['kata', 'kota', 'a', 'o']],
};
// kota is not a Japanese word; replace that vowel pair by a safer one
PAIRS.ja[PAIRS.ja.length - 1] = ['kami', 'kama', 'i', 'a'];

// ---------- 2.2: the environment tables ----------
const ENVS = [
  ['init', String.raw`$\#\_\acute V$`, 'word-initial, before a stressed vowel'],
  ['s', String.raw`$s\_$`, 'after /s/ (word-initial cluster)'],
  ['mid1', String.raw`$\acute V\_V$`, 'between a stressed and an unstressed vowel'],
  ['mid2', String.raw`$V\_\acute V$`, 'between an unstressed and a stressed vowel'],
  ['fin', String.raw`$V\_\#$`, 'word-final, after a vowel'],
  ['pre', String.raw`$\_C$`, 'before a consonant'],
];
const ALLO = [
  { id: 'p-ph', a: 'pʰ', b: 'p', title: '[pʰ] and [p]',
    data: { pʰ: { init: ['pin', 'pat', 'pill', 'pot'], mid2: ['appear', 'repeat', 'compete'] }, p: { s: ['spin', 'spot', 'speak', 'spill'], mid1: ['happy', 'paper', 'upper'], fin: ['cap', 'top', 'hop'], pre: ['apt', 'kept', 'helped'] } },
    note: 'This is the textbook case: [pʰ] before a stressed vowel, plain [p] elsewhere.' },
  { id: 'ph-b', a: 'pʰ', b: 'b', title: '[pʰ] and [b]',
    data: { pʰ: { init: ['pin', 'pat', 'pill', 'pot'], mid2: ['appear', 'repeat', 'compete'] }, b: { init: ['bin', 'bat', 'bill', 'bot'], mid1: ['hobby', 'rubber', 'lobby'], mid2: ['abide', 'believe', 'obey'], fin: ['cab', 'rub', 'job'] } },
    note: 'Both occur word-initially (pin/bin) and after an unstressed vowel before a stressed one (repeat/rebeat): they contrast.' },
  { id: 'p-b', a: 'p', b: 'b', title: '[p] and [b]',
    data: { p: { s: ['spin', 'spot', 'speak'], mid1: ['happy', 'paper', 'upper'], fin: ['cap', 'top', 'hop'], pre: ['apt', 'kept'] }, b: { init: ['bin', 'bat', 'bill'], mid1: ['hobby', 'rubber', 'lobby'], mid2: ['abide', 'believe'], fin: ['cab', 'rub', 'job'] } },
    note: 'Unaspirated [p] and [b] both occur word-finally (cap/cab) and between a stressed and an unstressed vowel (rapper/rubber).' },
  { id: 'l-dl', a: 'l', b: 'ɫ', title: '[l] and [ɫ] (dark l)',
    data: { l: { init: ['leaf', 'lip', 'light', 'low'], mid2: ['allow', 'believe', 'delay'] }, ɫ: { fin: ['feel', 'pull', 'ball', 'tell'], pre: ['milk', 'help', 'fault', 'self'] } },
    note: 'Light [l] before vowels, dark (velarized) [ɫ] after vowels: complementary, and phonetically almost the same sound (General American).' },
  { id: 't-r', a: 'tʰ', b: 'ɾ', title: '[tʰ] and the flap [ɾ]',
    data: { tʰ: { init: ['top', 'tin', 'tool', 'take'], mid2: ['attack', 'return', 'retain'] }, ɾ: { mid1: ['butter', 'city', 'water', 'later', 'ladder*', 'body*'] } },
    note: '* The same flap [ɾ] also replaces /d/ (ladder, body): in that environment /t/ and /d/ are neutralised, so [ɾ] is an allophone of two phonemes.' },
  { id: 'h-ng', a: 'h', b: 'ŋ', title: '[h] and [ŋ]',
    data: { h: { init: ['hat', 'hot', 'heat', 'hill'], mid2: ['ahead', 'behave', 'rehearse'] }, ŋ: { mid1: ['singer', 'hanger', 'ringing'], fin: ['sing', 'ring', 'long', 'song'], pre: ['ink', 'think', 'bank'] } },
    note: 'Perfectly complementary — [h] only before a vowel at the start of a syllable, [ŋ] never there — but the two sounds share almost no features, so nobody calls them allophones of one phoneme.' },
];

// ---------- 2.5: the rule workshop ----------
const RULE_DATA = {
  plural: { name: 'English plural / 3sg -s', start: { A: 'z', B: '[-voi]', L: [], R: [] }, sol: { A: 'z', B: '[-voi]', L: ['[-voi]'], R: [] }, lead: 'The suffix is underlyingly /z/ (cats, dogs).',
    words: [['k ˈæ t z', 'k ˈæ t s'], ['k ˈæ p z', 'k ˈæ p s'], ['b ˈʊ k z', 'b ˈʊ k s'], ['m ˈɪ θ z', 'm ˈɪ θ s'], ['d ˈɔ g z', 'd ˈɔ g z'], ['k ˈæ b z', 'k ˈæ b z'], ['b ˈɛ d z', 'b ˈɛ d z'], ['k ˈaʊ z', 'k ˈaʊ z'], ['t ɹ ˈi z', 't ɹ ˈi z'], ['b ˈɛ l z', 'b ˈɛ l z'], ['h ˈæ m z', 'h ˈæ m z'], ['ɹ ˈɪ ŋ z', 'ɹ ˈɪ ŋ z']] },
  flap: { name: 'American English flapping', start: { A: 't|d', B: 'ɾ', L: [], R: [] }, sol: { A: 't|d', B: 'ɾ', L: ['ˈV'], R: ['[+syl -str]'] }, lead: 'Underlying /t/ and /d/ both surface as the tap [ɾ] in some places.',
    words: [['b ˈʌ t ɚ', 'b ˈʌ ɾ ɚ'], ['s ˈɪ t i', 's ˈɪ ɾ i'], ['l ˈæ d ɚ', 'l ˈæ ɾ ɚ'], ['l ˈeɪ t ɚ', 'l ˈeɪ ɾ ɚ'], ['ˈæ t ə m', 'ˈæ ɾ ə m'], ['ə t ˈæ k', 'ə t ˈæ k'], ['ɹ ɪ t ˈeɪ n', 'ɹ ɪ t ˈeɪ n'], ['t ˈɑ p', 't ˈɑ p'], ['s t ˈɑ p', 's t ˈɑ p'], ['d ˈɔ g', 'd ˈɔ g'], ['ˈɑ k t ə p ə s', 'ˈɑ k t ə p ə s'], ['b ˈæ t', 'b ˈæ t']] },
  nasal: { name: 'Vowel nasalization before nasals', start: { A: '[+syl]', B: '[+nas]', L: [], R: [] }, sol: { A: '[+syl]', B: '[+nas]', L: [], R: ['[+nas]'] }, lead: 'Vowels are nasalised in English when a nasal consonant follows (it is not contrastive here).',
    words: [['b ˈæ n', 'b ˈæ̃ n'], ['b ˈæ d', 'b ˈæ d'], ['m ˈi n', 'm ˈĩ n'], ['m ˈi t', 'm ˈi t'], ['s ˈɪ ŋ', 's ˈɪ̃ ŋ'], ['s ˈɪ t', 's ˈɪ t'], ['t ˈɛ n', 't ˈɛ̃ n'], ['t ˈɛ d', 't ˈɛ d'], ['h ˈʌ m', 'h ˈʌ̃ m'], ['h ˈʌ t', 'h ˈʌ t']] },
};
const OPT_A = [['z', 'z'], ['t|d', 't, d'], ['[+syl]', '[+syl]'], ['[+voi -son]', '[+voi −son]'], ['[-voi -son]', '[−voi −son]'], ['[+nas]', '[+nas]']];
const OPT_B = [['[-voi]', '[−voi]'], ['[+voi]', '[+voi]'], ['[+nas]', '[+nas]'], ['ɾ', 'ɾ (tap)'], ['∅', '∅ (delete)']];
const OPT_L = [[[], 'anything'], [['[-voi]'], '[−voi]'], [['[+voi]'], '[+voi]'], [['[+syl]'], 'V'], [['ˈV'], 'stressed V'], [[ '#' ], '# (word start)']];
const OPT_R = [[[], 'anything'], [['[+nas]'], '[+nas]'], [['[+syl]'], 'V'], [['[+syl -str]'], 'unstressed V'], [['[-voi]'], '[−voi]'], [['#'], '# (word end)']];

export default {
  collection: 'ling',
  chapter: 2,
  title: 'Phonology: sound systems',
  summary: String.raw`Every language groups its sounds into a small set of contrastive units, the phonemes, whose variants depend predictably on context. Rules stated over distinctive features capture these patterns and interact in orders that matter. Syllables are organised by sonority, stress builds metrical feet, and Optimality Theory recasts the rules as ranked, violable constraints.`,
  items: [
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Phonemes and minimal pairs',
      credit: 'Baudouin de Courtenay and Kruszewski, 1870s; Trubetzkoy, 1939',
      statement: String.raw`A **phoneme** is a class of sounds that a language treats as one unit for the purpose of telling words apart. Two sounds belong to *different* phonemes of a language if replacing one by the other, with everything else held fixed, can change which word is said; a pair of words that differ in exactly one sound in the same position, like *pat* and *bat*, is a **minimal pair** and is the evidence for a contrast. The phoneme inventory is a property of a language, not of the sounds themselves: the same two sounds can contrast in one language and not in another.`,
      idea: String.raw`The test is substitution (commutation): hold the frame fixed, vary one slot, and see whether the set of words changes. A minimal pair proves that the two sounds are separate units in the speaker's lexicon because a listener must keep them apart to recover the word. The *absence* of any minimal pair proves nothing by itself (the lexicon may simply be small), which is why 2.2 adds a second kind of evidence, the distribution of the sounds. Because inventories differ, speakers hear the sounds of another language through their own: Japanese has a single liquid phoneme, so English *rice* and *lice* are not a minimal pair for it.`,
      caption: String.raw`Pick a language, then click two sounds on the charts (the first click chooses sound A, the second sound B, the third starts over). With A chosen, **green** marks every sound that forms a minimal pair with A in this small hand-written lexicon; with both chosen, the readout lists the pairs. Faded symbols are not phonemes of that language. Try /ɹ/ and /l/ in English, Spanish and Japanese, or /ɾ/ and /r/ in Spanish. The lexicon is a few dozen words per language written from memory: it is illustrative, not a corpus.`,
      deps: ['ling-1.2'],
      refs: ['Fromkin et al.'],
      tags: ['phonemes', 'contrast'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phoneme' },
      viz(v) {
        const lang = v.select('Language', [{ value: 'en', label: 'English' }, { value: 'es', label: 'Spanish (Castilian)' }, { value: 'ja', label: 'Japanese' }], 'en', { onChange: () => { sel = []; } });
        const sc = v.stage({ x: [0, 10.6], y: [0, 12.1], axes: false, height: 410, weight: 1.6, minWidth: 320, title: 'Consonants' });
        const sv = v.stage({ x: [-0.5, 4.5], y: [-0.7, 3.8], axes: false, height: 410, weight: 1, minWidth: 230, title: 'Vowels' });
        let sel = [];
        const cxy = (sym) => { const [c, r] = C_POS[sym]; return [2.5 + c + 0.5, 10.5 - r]; };
        const inv = () => INV[lang.value];
        const has = (sym) => inv().C.includes(sym) || inv().V.includes(sym);
        const pairsOf = (a, b) => PAIRS[lang.value].filter((p) => (p[2] === a && p[3] === b) || (p[2] === b && p[3] === a));
        const partners = (a) => new Set(PAIRS[lang.value].filter((p) => p[2] === a || p[3] === a).map((p) => (p[2] === a ? p[3] : p[2])));
        const pick = (S, pos, x, y) => {
          let best = null, bd = 20;
          for (const sym in pos) { const [px, py] = pos[sym]; const d = Math.hypot(S.X(px) - S.X(x), S.Y(py) - S.Y(y)); if (d < bd) { bd = d; best = sym; } }
          return best;
        };
        const click = (S, pos) => (x, y) => { const s = pick(S, pos, x, y); if (!s) return; if (sel.length >= 2) sel = [s]; else if (!sel.includes(s)) sel.push(s); else sel = sel.filter((q) => q !== s); };
        const cpos = {}; for (const s in C_POS) cpos[s] = cxy(s);
        sc.onClick(click(sc, cpos)); sv.onClick(click(sv, V_POS));
        const draw = (S, pos) => {
          const part = sel.length === 1 ? partners(sel[0]) : new Set();
          for (const sym in pos) {
            const [x, y] = pos[sym], on = has(sym), isSel = sel.includes(sym), isPart = part.has(sym) && on;
            const w = S === sc ? [0.46, 0.42] : [0.3, 0.2];
            if (isSel) S.rect(x - w[0], y - w[1], x + w[0], y + w[1], { fill: 'gold', fillAlpha: 0.4, color: 'gold', width: 2, radius: 6 });
            else if (isPart) S.rect(x - w[0], y - w[1], x + w[0], y + w[1], { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2, radius: 6 });
            S.text(sym, x, y, { size: 19, color: on ? 'ink' : 'faint', align: 'center', baseline: 'middle' });
          }
        };
        v.render(() => {
          C_COLS.forEach((c, i) => sc.text(c, 3 + i, 11.65, { size: 9.5, color: 'muted', align: 'center' }));
          C_ROWS.forEach((r, i) => { sc.text(r, 0.12, 10.5 - i, { size: 10, color: 'muted', align: 'left', baseline: 'middle' }); if (i) sc.line(0.1, 11 - i, 10.5, 11 - i, { color: 'grid', width: 0.6 }); });
          draw(sc, cpos);
          sv.text('front', 0.1, 3.55, { size: 10, color: 'muted', align: 'left' }); sv.text('back', 3.9, 3.55, { size: 10, color: 'muted', align: 'right' });
          sv.text('high', 0, 3.3, { size: 1, color: 'faint' });
          sv.path([[-0.2, 3.3], [4.2, 3.3], [3.85, -0.45], [0.55, -0.45]], { close: true, color: 'grid', width: 1.2 });
          draw(sv, V_POS);
        });
        v.readout(() => {
          const I = inv();
          const head = `**${I.name}**: ${I.C.length} consonant and ${I.V.length} vowel phonemes in this chart.`;
          if (sel.length === 0) return head + '\nClick a sound.';
          const [a, b] = sel;
          if (sel.length === 1) { const n = partners(a).size; return head + `\n/${a}/ ${has(a) ? `forms a minimal pair with ${n} other sound${n === 1 ? '' : 's'} in the lexicon (green)` : 'is **not a phoneme** of this language'}.`; }
          if (!has(a) || !has(b)) return head + `\n${[a, b].filter((s) => !has(s)).map((s) => `/${s}/`).join(' and ')} ${has(a) || has(b) ? 'is' : 'are'} not in this inventory, so the language has no contrast here.`;
          const P = pairsOf(a, b);
          if (P.length) return head + `\n/${a}/ vs /${b}/: **contrast** — ${P.map((p) => `*${p[0]}* – *${p[1]}*`).join(', ')}. Swapping the sound changes the word, so they are two phonemes.`;
          return head + `\n/${a}/ vs /${b}/: both sounds exist, but this lexicon has **no minimal pair** (absence of evidence, not proof: see 2.2).`;
        });
      },
    },
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Allophones and complementary distribution',
      credit: 'Daniel Jones, Phoneme (1950); Bloch & Trager, 1942 (the distributional method)',
      statement: String.raw`Two sounds that are phonetically similar and occur in **complementary distribution** — each appears in environments where the other never does — are **allophones** of one phoneme: predictable, context-dependent variants. Sounds that share an environment and can change a word's identity there are in **contrast**, hence separate phonemes. Complementary distribution is a necessary condition for being allophones, not a sufficient one: it must be backed by phonetic similarity (English [h] and [ŋ] are also complementary, yet nobody calls them variants of one sound).`,
      idea: String.raw`List every environment in which each sound occurs in the lexicon. If the two lists overlap, a minimal or near-minimal pair exists (2.1) and the sounds contrast. If the lists are disjoint, there is a rule of the form "pronounce the phoneme as A here and as B there" which predicts which variant appears, so the learner does not need to store the difference. The phonetic-similarity filter rules out accidental disjointness, since two unrelated sounds will often fail to overlap by chance.`,
      caption: String.raw`Choose a pair of sounds. The table lists words from a small hand-made list of English words, per environment (one column per sound); a row where both columns are filled is outlined in **red** (overlap = contrast). Click a row to list its words. The verdict combines the overlap test with the feature distance of the two sounds (computed from the table of 2.3). Aspirated [pʰ] and plain [p] never overlap; [pʰ] and [b] overlap in two places.`,
      deps: ['ling-2.1'],
      refs: ['Fromkin et al.'],
      tags: ['allophones', 'distribution'],
      scope: String.raw`The English transcriptions are General American and broad; the lists are illustrative, not exhaustive.`,
      viz(v) {
        const sel = v.select('Pair', ALLO.map((p) => ({ value: p.id, label: p.title.replace(/ \(.*\)/, '') })), 'p-ph', { onChange: () => { row = -1; } });
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, full: true });
        const T = v.table(s, { rows: ENVS.length, cols: 2, square: false, cellAspect: 2.9, maxCell: 52, size: 13.5, rowLabels: ENVS.map((e) => e[1]), labelWidth: 0.2 });
        let row = -1;
        const pair = () => ALLO.find((p) => p.id === sel.value);
        const words = (P, snd, env) => (P.data[snd] && P.data[snd][env]) || [];
        s.onClick((x, y) => { const h = T.hit(x, y); row = h && h.i >= 0 ? h.i : -1; });
        const verdict = () => {
          const P = pair(); const over = ENVS.filter((e) => words(P, P.a, e[0]).length && words(P, P.b, e[0]).length);
          const d = segDistance(P.a, P.b);
          return { over, d, kind: over.length ? 'contrast' : d <= 3 ? 'allophones' : 'dissimilar' };
        };
        v.render(() => {
          const P = pair(), V = verdict();
          const ov = (i) => words(P, P.a, ENVS[i][0]).length && words(P, P.b, ENVS[i][0]).length;
          T.draw({
            colLabels: [`[${P.a}]`, `[${P.b}]`], colLabelColor: (j) => (j ? 'orange' : 'blue'),
            value: (i, j) => { const w = words(P, j ? P.b : P.a, ENVS[i][0]); return w.length ? w.slice(0, 3).join(', ') : '—'; },
            fill: (i, j) => (words(P, j ? P.b : P.a, ENVS[i][0]).length ? [j ? 'orange' : 'blue', 0.2] : null),
            textColor: (i, j) => (words(P, j ? P.b : P.a, ENVS[i][0]).length ? 'ink' : 'faint'),
            highlight: row >= 0 ? [[row, 0, 'accent'], [row, 1, 'accent']] : [],
          });
          ENVS.forEach((e, i) => { if (ov(i)) T.box(i, 0, i, 1, { color: 'red', width: 2.5 }); });
          s.corner(V.kind === 'contrast' ? 'overlap: contrast' : V.kind === 'allophones' ? 'disjoint and similar: allophones' : 'disjoint but dissimilar', 'br', { color: V.kind === 'contrast' ? 'red' : V.kind === 'allophones' ? 'green' : 'orange', weight: 650 });
        });
        v.readout(() => {
          const P = pair(), V = verdict();
          const lines = [`**${P.title}** — feature distance ${V.d} (${V.d <= 3 ? 'similar' : 'dissimilar'}); environments in common: ${V.over.length ? V.over.map((e) => e[1]).join(', ') : 'none'}.`];
          lines.push(V.kind === 'contrast' ? '**Verdict: two phonemes** (they contrast in the red rows).' : V.kind === 'allophones' ? `**Verdict: allophones of one phoneme**, /${P.a === 'pʰ' ? 'p' : P.a}/ realised as [${P.b}] or [${P.a}] by environment.` : '**Verdict: complementary but not allophones** — the sounds are too different phonetically.');
          if (row >= 0) lines.push(`${ENVS[row][2]}: [${P.a}] in ${words(P, P.a, ENVS[row][0]).join(', ') || '—'}; [${P.b}] in ${words(P, P.b, ENVS[row][0]).join(', ') || '—'}.`);
          lines.push(P.note);
          return lines.join('\n');
        });
      },
    },
    {
      num: '2.3',
      kind: 'Concept',
      name: 'Distinctive features',
      credit: 'Trubetzkoy, 1939; Jakobson, Fant & Halle, 1952; Chomsky & Halle, 1968',
      statement: String.raw`Phonemes are not atoms but bundles of binary **distinctive features** such as $[\pm\text{voice}]$, $[\pm\text{nasal}]$ and $[\pm\text{continuant}]$: each feature names one articulatory or acoustic property, and a segment is a column of $+$ and $-$ values (or $0$, "not applicable"). A small number of features (a few dozen at most) suffices to tell apart the phonemes of any language, and phonological patterns are stated over features rather than over lists of sounds.`,
      idea: String.raw`Each feature carves the inventory into two halves, so $n$ binary features can distinguish up to $2^n$ segments; real inventories are far sparser than that because features are correlated (every nasal is voiced and sonorant). The reason to prefer features to symbols is that sounds sharing a feature behave alike in rules (2.4, 2.5): the set of sounds that trigger a rule is then a *conjunction of feature values*, a simple object, rather than an arbitrary list. The feature set used here is a simplified teaching system of 17 features: stridency, laterality and tenseness are handled coarsely, and [bk] is left unspecified (0) for schwa.`,
      caption: String.raw`Left: set each feature to $+$, $-$ or any (click a box). Right: the symbols that match every condition light up. Click a symbol on the chart to load its full feature column, then relax a feature to see which sounds join it; the presets set up classes you will meet in 2.4. Notice how few features it takes to isolate a single sound.`,
      deps: ['ling-2.1', 'ling-1.4'],
      refs: ['Fromkin et al.'],
      tags: ['features', 'phonology'],
      viz(v) {
        const L = chartLayout();
        const spec = {}; for (const k of FEATS) spec[k] = '';
        const PRESETS = {
          custom: null,
          nasal: { nas: '+' },
          vstop: { cons: '+', son: '-', cont: '-', voi: '+' },
          fric: { cons: '+', son: '-', cont: '+', strid: '+' },
          high: { syl: '+', hi: '+' },
        };
        const pre = v.select('Preset', [{ value: 'custom', label: 'custom' }, { value: 'nasal', label: 'nasals' }, { value: 'vstop', label: 'voiced obstruent stops' }, { value: 'fric', label: 'stridents' }, { value: 'high', label: 'high vowels' }], 'nasal',
          { onChange: (p) => { if (!PRESETS[p]) return; for (const k of FEATS) spec[k] = PRESETS[p][k] || ''; } });
        spec.nas = '+';
        v.button('Clear', () => { for (const k of FEATS) spec[k] = ''; pre.set('custom'); });
        const sf = v.stage({ x: [0, 1], y: [0, FEATS.length + 0.3], axes: false, height: 400, weight: 0.8, minWidth: 220, title: 'Feature conditions' });
        const sc = v.stage({ x: [0, L.w], y: [0, L.rows], axes: false, height: 400, weight: 1.5, minWidth: 320, title: 'Matching segments' });
        const BX = [0.56, 0.72, 0.88];
        sf.onClick((x, y) => {
          const r = Math.floor(FEATS.length - y + 0.15); if (r < 0 || r >= FEATS.length) return;
          const k = FEATS[r]; const b = BX.findIndex((bx) => Math.abs(x - bx) < 0.075); if (b < 0) return;
          spec[k] = ['+', '-', ''][b]; pre.set('custom');
        });
        sc.onClick((x, y) => { const s = chartSymAt(L, x, y); if (!s) return; for (const k of FEATS) spec[k] = SEG[s].f[k] === '0' ? '' : SEG[s].f[k]; pre.set('custom'); });
        const match = (s) => FEATS.every((k) => !spec[k] || SEG[s].f[k] === spec[k]);
        let hits = [];
        v.render(() => {
          FEATS.forEach((k, i) => {
            const y = FEATS.length - i - 0.15;
            sf.text(k, 0.02, y - 0.35, { size: 12.5, color: 'ink', align: 'left', baseline: 'middle', math: true });
            sf.text(FEAT_NAME[k], 0.2, y - 0.35, { size: 10, color: 'faint', align: 'left', baseline: 'middle' });
            ['+', '−', 'any'].forEach((lab, b) => {
              const on = spec[k] === ['+', '-', ''][b], x = BX[b];
              sf.rect(x - 0.07, y - 0.78, x + 0.07, y + 0.08, { fill: on ? (b === 0 ? 'green' : b === 1 ? 'red' : 'muted') : null, fillAlpha: on ? 0.35 : 0, color: on ? (b === 0 ? 'green' : b === 1 ? 'red' : 'muted') : 'grid', width: on ? 1.8 : 0.8, radius: 4 });
              sf.text(lab, x, y - 0.35, { size: b === 2 ? 8.5 : 13, color: on ? 'ink' : 'faint', align: 'center', baseline: 'middle' });
            });
          });
          hits = CHART_SYMS.filter(match);
          drawChart(sc, L, (s) => (match(s) ? 'on' : 'off'));
        });
        v.readout(() => {
          const act = FEATS.filter((k) => spec[k]);
          const tex = act.length ? `\\begin{bmatrix}${act.map((k) => `${spec[k] === '+' ? '+' : '-'}\\text{${k}}`).join('\\\\')}\\end{bmatrix}` : '[\\ ]';
          return `$${tex}$ matches **${hits.length}** of ${CHART_SYMS.length} segments${hits.length ? ': ' + hits.join(' ') : ' — no segment has that combination'}.` + (act.length ? `\n${act.length} feature${act.length === 1 ? '' : 's'} specified; a full column has 17.` : '\nNo conditions: every segment matches.');
        });
      },
    },
    {
      num: '2.4',
      kind: 'Concept',
      name: 'Natural classes',
      statement: String.raw`A set of segments is a **natural class** if some bundle of feature values picks out exactly its members and nothing else. Phonological rules overwhelmingly apply to, or are triggered by, natural classes, and the smaller the bundle needed, the more natural (and more frequent) the class. A set like $\{p, s, \eta, \mathrm{a}\}$ that no bundle singles out is *unnatural*: any bundle covering all of its members also covers extra segments.`,
      idea: String.raw`The segments matching a feature value form a set; a bundle selects the intersection of such sets. So natural classes are exactly the intersections of feature-value sets (2.3), a tiny family compared with all $2^{39}$ subsets of the 39 symbols on the chart. To test a given set, intersect the feature values it shares: that intersection is the *most specific* bundle containing the whole set, and the set is natural exactly when this bundle selects nothing else. The tool then searches for the shortest bundle with the same extension.`,
      caption: String.raw`Click symbols to build a set (gold). The readout finds the smallest feature bundle that defines it, or shows the smallest natural class that contains it — the extra members it drags in are marked red. Try the preset *plural -s triggers* (p t k f θ): it is natural, defined by the three values [+cons −voi −strid], which is why one rule suffices in 2.5. Then add /s/ or /ɑ/ and watch it stop being natural.`,
      deps: ['ling-2.3'],
      refs: ['Fromkin et al.'],
      tags: ['natural classes', 'features'],
      viz(v) {
        const L = chartLayout(), U = CHART_SYMS, N = U.length;
        const ext = (k, val) => { let m = 0n; U.forEach((s, i) => { if (SEG[s].f[k] === val) m |= 1n << BigInt(i); }); return m; };
        const BASE = []; for (const k of FEATS) for (const val of ['+', '-']) { const m = ext(k, val); if (m) BASE.push(m); }
        const ALL = (1n << BigInt(N)) - 1n;
        const classes = new Set([ALL]);
        for (const b of BASE) for (const t of [...classes]) classes.add(t & b);
        const nClasses = classes.size;
        let set = [];
        const PRE = { none: [], plural: ['p', 't', 'k', 'f', 'θ'], nas: ['m', 'n', 'ŋ'], vst: ['b', 'd', 'g'], odd: ['p', 's', 'ŋ', 'ɑ'], hv: ['i', 'ɪ', 'u', 'ʊ'] };
        const pre = v.select('Presets', [{ value: 'none', label: 'empty' }, { value: 'plural', label: 'plural -s triggers' }, { value: 'nas', label: 'nasals' }, { value: 'vst', label: 'voiced stops' }, { value: 'hv', label: 'high vowels' }, { value: 'odd', label: 'p s ŋ ɑ' }], 'plural',
          { onChange: (p) => { set = PRE[p].slice(); } });
        set = PRE.plural.slice();
        const s = v.stage({ x: [0, L.w], y: [0, L.rows], axes: false, height: 400, full: true });
        s.onClick((x, y) => { const q = chartSymAt(L, x, y); if (!q) return; set = set.includes(q) ? set.filter((z) => z !== q) : [...set, q]; pre.set('none'); });
        const analyse = () => {
          if (!set.length) return null;
          const shared = FEATS.filter((k) => set.every((q) => SEG[q].f[k] === SEG[set[0]].f[k] && SEG[set[0]].f[k] !== '0')).map((k) => [k, SEG[set[0]].f[k]]);
          const extOf = (b) => U.filter((q) => b.every(([k, val]) => SEG[q].f[k] === val));
          const closure = extOf(shared), natural = closure.length === set.length;
          let best = natural ? shared : null;
          if (natural) {
            const idx = shared.map((_, i) => i);
            outer: for (let size = 1; size <= Math.min(5, shared.length); size++) {
              const rec = (start, chosen) => {
                if (chosen.length === size) { const b = chosen.map((i) => shared[i]); if (extOf(b).length === set.length) { best = b; return true; } return false; }
                for (let i = start; i < idx.length; i++) if (rec(i + 1, [...chosen, i])) return true;
                return false;
              };
              if (rec(0, [])) break outer;
            }
          }
          return { shared, closure, natural, best, extra: closure.filter((q) => !set.includes(q)) };
        };
        let A = null;
        v.render(() => {
          A = analyse();
          const extra = A && !A.natural ? new Set(A.extra) : new Set();
          drawChart(s, L, (q) => (set.includes(q) ? 'sel' : 'off'));
          for (const q of extra) { const [x, y] = L.pos[q]; s.rect(x - 0.44, y - 0.4, x + 0.44, y + 0.4, { fill: 'red', fillAlpha: 0.22, color: 'red', width: 2, radius: 5 }); s.text(q, x, y, { size: 17, color: 'ink', align: 'center', baseline: 'middle' }); }
          s.corner(A ? (A.natural ? 'natural class' : 'not a natural class') : 'click symbols to build a set', 'br', { color: A ? (A.natural ? 'green' : 'red') : 'muted', weight: 650, plate: true });
        });
        const fmt = (b) => '$[' + b.map(([k, val]) => `${val === '+' ? '+' : '-'}\\text{${k}}`).join('\\ ') + ']$';
        v.readout(() => {
          const foot = `Of $2^{${N}}\\approx${v.sci(2 ** N, 2)}$ possible subsets only **${nClasses.toLocaleString('en')}** are natural classes (a fraction $${v.sci(nClasses / 2 ** N, 1)}$).`;
          if (!A) return 'The empty set: click symbols.\n' + foot;
          if (A.natural) return `{${set.join(' ')}} is **natural**: shortest defining bundle ${fmt(A.best)} (${A.best.length} feature${A.best.length === 1 ? '' : 's'}); all shared values: ${fmt(A.shared)}.\n` + foot;
          return `{${set.join(' ')}} is **not natural**: every bundle that contains all of them (${fmt(A.shared)}) also selects ${A.extra.map((q) => q).join(' ')}.\n` + foot;
        });
      },
    },
    {
      num: '2.5',
      kind: 'Method',
      name: 'Phonological rules: A → B / C __ D',
      credit: 'Chomsky & Halle, The Sound Pattern of English, 1968',
      statement: String.raw`A **phonological rule** $A\to B\,/\,C\,\_\_\,D$ says: segments of class $A$ are rewritten as $B$ when they stand after $C$ and before $D$ (any of the three environments may be empty, and $\#$ marks a word boundary). $A$, $C$ and $D$ are natural classes written as feature bundles, and $B$ is usually a change of one or two feature values; $A=\varnothing$ gives insertion and $B=\varnothing$ deletion. A grammar maps stored **underlying forms** to pronounced **surface forms** by applying its rules, and a rule is right when its output matches what speakers say.`,
      idea: String.raw`The rule format works because of the earlier definitions. The distribution facts of 2.2 tell you *where* the variants occur, the natural classes of 2.4 give the rule its environment and target, and the features of 2.3 let the change be stated as a single value flip. A good rule is as general as the data allow: dropping a context overgenerates (the rule fires where it should not), adding too much undergenerates. Testing a rule on the whole word list is how analysts find the generalisation.`,
      caption: String.raw`Pick a data set, then choose the target $A$, the change $B$ and the left and right contexts with the buttons. The table rewrites each underlying form with your rule and compares it with the attested pronunciation: wrong rows turn red. Start from the preset (too general) and find the environment that fixes every row, or press *Show an answer*. The rule is applied to all matching sites at once, left to right.`,
      deps: ['ling-2.2', 'ling-2.4'],
      refs: ['Fromkin et al.'],
      tags: ['rules', 'phonology'],
      viz(v) {
        const ds = v.select('Data set', Object.entries(RULE_DATA).map(([k, d]) => ({ value: k, label: d.name })), 'plural', { onChange: (k) => reset(k) });
        const optSel = (label, opts, init) => v.select(label, opts.map(([val, lab], i) => ({ value: i, label: lab })), init);
        const iA = (a) => OPT_A.findIndex((o) => o[0] === a), iB = (b) => OPT_B.findIndex((o) => o[0] === b);
        const iL = (l) => OPT_L.findIndex((o) => JSON.stringify(o[0]) === JSON.stringify(l)), iR = (r) => OPT_R.findIndex((o) => JSON.stringify(o[0]) === JSON.stringify(r));
        const sA = optSel('target $A$', OPT_A, 0), sB = optSel('becomes $B$', OPT_B, 0), sL = optSel('after $C$', OPT_L, 0), sR = optSel('before $D$', OPT_R, 0);
        const setRule = (r) => { sA.set(iA(r.A)); sB.set(iB(r.B)); sL.set(iL(r.L)); sR.set(iR(r.R)); };
        const reset = (k) => setRule(RULE_DATA[k].start);
        v.button('Show an answer', () => setRule(RULE_DATA[ds.value].sol));
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 400, full: true });
        const T = v.table(s, { rows: 12, cols: 4, square: false, cellAspect: 4.6, maxCell: 32, size: 13.5 });
        const rule = () => ({ A: OPT_A[sA.value][0], B: OPT_B[sB.value][0], L: OPT_L[sL.value][0], R: OPT_R[sR.value][0] });
        const run = () => {
          const D = RULE_DATA[ds.value], r = rule();
          return D.words.map(([ur, sr]) => { const w = parseWord(ur), res = applyRule(w, r), got = showWord(res.out), want = showWord(parseWord(sr)); return { ur: showWord(w), got, want, ok: got === want, n: res.hits.length }; });
        };
        let R = [];
        v.render(() => {
          R = run();
          const D = RULE_DATA[ds.value];
          T.draw({
            rows: R.length, colLabels: ['underlying', 'your rule', 'attested', ''],
            value: (i, j) => (j === 0 ? '/' + R[i].ur + '/' : j === 1 ? '[' + R[i].got + ']' : j === 2 ? '[' + R[i].want + ']' : R[i].ok ? '✓' : '✗'),
            fill: (i, j) => (j >= 1 && !R[i].ok ? ['red', 0.22] : j === 3 && R[i].ok ? ['green', 0.2] : null),
            textColor: (i, j) => (j === 1 && R[i].got !== R[i].ur ? 'accent' : 'ink'),
            colWeights: [1.2, 1.3, 1.3, 0.4],
          });
        });
        v.readout(() => {
          const r = rule(), ok = R.filter((x) => x.ok).length;
          const side = (sp) => (sp.length ? sp.map(specTeX).join('\\,') : '');
          const tex = `${specTeX(r.A)} \\to ${r.B === '∅' ? '\\varnothing' : r.B[0] === '[' ? specTeX(r.B) : `\\text{[${r.B}]}`} \\ /\\ ${side(r.L)}\\ \\_\\_\\ ${side(r.R)}`;
          return `${RULE_DATA[ds.value].lead}\n$${tex}$\n**${ok} of ${R.length}** forms match the attested pronunciation` + (ok === R.length ? ' — the rule is empirically adequate on this list.' : `; the rule fires at ${R.reduce((a, x) => a + x.n, 0)} sites in total (too many or in the wrong place).`);
        });
      },
    },
  ],
};
