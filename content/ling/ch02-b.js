// Linguistics & Language — Chapter 2: Phonology: sound systems (items 2.6–2.9)
import { SEG, FEATS, applyRule, parseWord, showWord, specTeX, sites, respell, syllabify, sylText, LEGAL_ONSETS, isVowel, trainPhonotactics, clamp } from './ch02.shared.js';

const ruleTeX = (r) => {
  const side = (sp) => (sp && sp.length ? sp.map(specTeX).join('\\,') : '');
  const B = r.B === '∅' ? '\\varnothing' : r.B[0] === '[' ? specTeX(r.B) : `\\text{[${r.B}]}`;
  return `${specTeX(r.A)} \\to ${B} \\ /\\ ${side(r.L)}\\ \\_\\_\\ ${side(r.R)}`;
};

// ---------- 2.6 ----------
const ORDERING = {
  bleed: {
    name: 'raising and flapping (bleeding)',
    r1: { name: 'Canadian raising', rule: { A: 'aɪ', B: 'ʌɪ', L: [], R: ['[-voi]'] } },
    r2: { name: 'flapping', rule: { A: 't|d', B: 'ɾ', L: ['ˈV'], R: ['[+syl -str]'] } },
    words: [['writer', 'ɹ ˈaɪ t ɚ', 'ɹ ˈʌɪ ɾ ɚ'], ['rider', 'ɹ ˈaɪ d ɚ', 'ɹ ˈaɪ ɾ ɚ'], ['spider', 's p ˈaɪ d ɚ', 's p ˈaɪ ɾ ɚ'], ['ice', 'ˈaɪ s', 'ˈʌɪ s'], ['eyes', 'ˈaɪ z', 'ˈaɪ z'], ['life', 'l ˈaɪ f', 'l ˈʌɪ f'], ['tiger', 't ˈaɪ g ɚ', 't ˈaɪ g ɚ']],
    note: 'In Canadian English (and some U.S. varieties) the vowel of *writer* is raised before the voiceless /t/, even though the /t/ is then pronounced as a voiced flap, so *writer* and *rider* still differ in their vowels.',
  },
  feed: {
    name: 'nasal assimilation and g-deletion (feeding)',
    r1: { name: 'nasal assimilation', rule: { A: 'n', B: 'ŋ', L: [], R: ['[+dor -son]'] } },
    r2: { name: 'g-deletion', rule: { A: 'g', B: '∅', L: ['ŋ'], R: ['#'] } },
    words: [['sing', 's ˈɪ n g', 's ˈɪ ŋ'], ['long', 'l ˈɔ n g', 'l ˈɔ ŋ'], ['bang', 'b ˈæ n g', 'b ˈæ ŋ'], ['sin', 's ˈɪ n', 's ˈɪ n'], ['tin', 't ˈɪ n', 't ˈɪ n'], ['think', 'θ ˈɪ n k', 'θ ˈɪ ŋ k'], ['bank', 'b ˈæ n k', 'b ˈæ ŋ k'], ['finger', 'f ˈɪ n g ɚ', 'f ˈɪ ŋ g ɚ']],
    note: 'The classical analysis of English *sing* has an underlying /g/ that is deleted word-finally after [ŋ], but only because an earlier rule has turned the /n/ into [ŋ] before it. (Other analyses of [ŋ] exist; this one is the textbook illustration of feeding.)',
  },
};

// ---------- 2.7 ----------
const placeOf = (s) => { const f = SEG[s]?.f; return !f ? '' : f.lab === '+' ? 'labial' : f.dor === '+' ? 'dorsal' : f.cor === '+' ? 'coronal' : ''; };
const PROC = {
  nasal: {
    name: 'nasal place assimilation', rule: { A: 'n', B: (t, l, r) => { const f = SEG[r.s].f; return f.lab === '+' ? 'm' : f.dor === '+' ? 'ŋ' : 'n'; }, L: [], R: ['[-son -cont -strid]'] }, rtex: String.raw`\text{n}\to[\alpha\,\text{place}]\ /\ \_\_\ \begin{bmatrix}-\text{son}\\-\text{cont}\end{bmatrix}_{[\alpha\,\text{place}]}`,
    trigger: 1, under: placeOf, what: 'spreads the place of articulation of the following stop onto /n/ (anticipation: the tongue is already heading for the next closure)',
    ex: [['input', 'ɪ n p ˈʊ t'], ['impossible', 'ɪ n p ˈɑ s ə b ə l'], ['income', 'ˈɪ n k ʌ m'], ['ingrown', 'ɪ n g ɹ ˈoʊ n'], ['unbelievable', 'ʌ n b ɪ l ˈi v ə b ə l'], ['intake (no change)', 'ˈɪ n t eɪ k']],
  },
  voice: {
    name: 'voicing assimilation (past tense -d)', rule: { A: 'd', B: '[-voi]', L: ['[-voi]'], R: [] }, rtex: String.raw`\text{d}\to[-\text{voi}]\ /\ [-\text{voi}]\ \_\_`,
    trigger: -1, under: (s) => (SEG[s]?.f.voi === '+' ? '+voi' : SEG[s]?.f.voi === '-' ? '−voi' : ''), what: 'copies the voicing of the preceding consonant onto the suffix (cat+s, walk+ed)',
    ex: [['walked', 'w ˈɔ k d'], ['popped', 'p ˈɑ p d'], ['washed', 'w ˈɑ ʃ d'], ['missed', 'm ˈɪ s d'], ['hugged (no change)', 'h ˈʌ g d'], ['called (no change)', 'k ˈɔ l d']],
  },
  schwa: {
    name: 'schwa deletion', rule: { A: 'ə', B: '∅', L: ['ˈV', 'C'], R: ['[+son -syl]'] }, rtex: String.raw`\text{ə}\to\varnothing\ /\ \acute{\mathrm V}\,\mathrm C\ \_\_\ [+\text{son},-\text{syl}]`,
    trigger: 0, under: () => '', what: 'drops an unstressed schwa between a stressed syllable and a sonorant, so that a syllable disappears in casual speech',
    ex: [['family', 'f ˈæ m ə l i'], ['memory', 'm ˈɛ m ə ɹ i'], ['camera', 'k ˈæ m ə ɹ ə'], ['different', 'd ˈɪ f ə ɹ ə n t'], ['average', 'ˈæ v ə ɹ ɪ dʒ'], ['banana (no change)', 'b ə n ˈæ n ə']],
  },
  epenth: {
    name: 'epenthesis (plural -es)', rule: { A: '∅', B: 'ɪ', L: ['[+strid]'], R: ['z'] }, rtex: String.raw`\varnothing\to\text{ɪ}\ /\ [+\text{strid}]\ \_\_\ \text{z}`,
    trigger: 0, under: () => '', what: 'inserts a vowel to break up two sibilants in a row, which would be hard to hear and to say',
    ex: [['buses', 'b ˈʌ s z'], ['dishes', 'd ˈɪ ʃ z'], ['judges', 'dʒ ˈʌ dʒ z'], ['roses', 'ɹ ˈoʊ z z'], ['cats (no change)', 'k ˈæ t z'], ['dogs (no change)', 'd ˈɔ g z']],
  },
};

// ---------- 2.8 ----------
const WORDLIKE = [['blik', 'blick'], ['bnik', 'bnick'], ['ptak', 'ptak'], ['mbik', 'mbik'], ['dwik', 'dwik'], ['tlip', 'tlip'], ['ngik', 'ngik']];

// ---------- 2.9 ----------
const SYL_WORDS = [['ekstruh', 'extra'], ['hapee', 'happy'], ['lemuhn', 'lemon'], ['mistayk', 'mistake'], ['uhstronuhmee', 'astronomy'], ['strengkth', 'strength']];
const HEAVY_V = new Set(['i', 'e', 'a', 'o', 'u', 'aɪ', 'aʊ', 'eɪ', 'oʊ', 'ɔɪ', 'ɔ']);

export default {
  collection: 'ling',
  chapter: 2,
  items: [
    {
      num: '2.6',
      kind: 'Concept',
      name: 'Rule ordering: feeding and bleeding',
      credit: 'Kiparsky, 1968 (feeding and bleeding order); Joos, 1942 (Canadian raising)',
      statement: String.raw`When a grammar has several rules, **the order in which they apply** can change the output. Rule $X$ **feeds** rule $Y$ when applying $X$ first creates new sites where $Y$ can apply, and **bleeds** it when applying $X$ first destroys sites where $Y$ would apply. If the attested forms need $X$ before $Y$ in the first case or $Y$ before $X$ in the second, the order is extrinsic and must be part of the grammar. The reverse orders, in which a rule would have fed or bled another but applies too late, are called **counterfeeding** and **counterbleeding**.`,
      idea: String.raw`Rules rewrite strings, so the output of one rule is the input of the next. Each rule's environment is a feature pattern (2.5), and an earlier rule can create that pattern (nasal assimilation produces the [ŋ] that g-deletion needs) or erase it (flapping turns a voiceless /t/, which raising needs to see, into a voiced tap). Because the rules are not independent, the data decide the order: of the $k!$ possible orders only those whose derivations match the attested pronunciations are admissible, and the tool counts the sites each order creates or destroys to show which relation you get.`,
      caption: String.raw`Choose a pair of rules and an order. The derivation table applies the first rule, then the second, to every underlying form and compares the result with the attested surface form; wrong rows turn red. The readout counts, over all forms, how many application sites the second rule has before and after the first one applies: more sites means **feeding**, fewer means **bleeding**. Flip the order and see the opposite relation (counterbleeding or counterfeeding) and which order the data want.`,
      deps: ['ling-2.5'],
      refs: ['Fromkin et al.'],
      tags: ['rule ordering', 'derivations'],
      scope: String.raw`Raising applies to the diphthong /aɪ/ as a unit before a voiceless consonant, as in Canadian English; the g-deletion analysis is the classical /ng/ analysis of English [ŋ].`,
      viz(v) {
        const sc = v.select('Rules', Object.entries(ORDERING).map(([k, o]) => ({ value: k, label: o.name })), 'bleed');
        const ord = v.select('Order', [{ value: 0, label: 'rule 1 first, then rule 2' }, { value: 1, label: 'rule 2 first, then rule 1' }], 0);
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 390, full: true });
        const T = v.table(s, { rows: 8, cols: 5, square: false, cellAspect: 4.2, maxCell: 34, size: 13.5 });
        const derive = () => {
          const O = ORDERING[sc.value], [X, Y] = ord.value ? [O.r2, O.r1] : [O.r1, O.r2];
          const rows = O.words.map(([gloss, ur, sr]) => {
            const w = parseWord(ur), a = applyRule(w, X.rule).out, b = applyRule(a, Y.rule).out;
            return { gloss, ur: showWord(w), a: showWord(a), b: showWord(b), want: showWord(parseWord(sr)), ok: showWord(b) === showWord(parseWord(sr)) };
          });
          const sum = (f) => O.words.reduce((t, [, ur]) => t + f(parseWord(ur)), 0);
          const ef = (P, Q) => sum((w) => sites(applyRule(w, P.rule).out, Q.rule)) - sum((w) => sites(w, Q.rule)); // sites of Q after P minus before
          return { O, X, Y, rows, eXY: ef(X, Y), eYX: ef(Y, X), sY: sum((w) => sites(w, Y.rule)), sY2: sum((w) => sites(applyRule(w, X.rule).out, Y.rule)), sX: sum((w) => sites(w, X.rule)), sX2: sum((w) => sites(applyRule(w, Y.rule).out, X.rule)) };
        };
        let D = null;
        v.render(() => {
          D = derive();
          T.draw({
            rows: D.rows.length,
            colLabels: ['word', 'underlying', `after ${D.X.name}`, `after ${D.Y.name}`, 'attested'],
            value: (i, j) => { const r = D.rows[i]; return j === 0 ? r.gloss : j === 1 ? '/' + r.ur + '/' : j === 2 ? '[' + r.a + ']' : j === 3 ? '[' + r.b + ']' : '[' + r.want + ']'; },
            fill: (i, j) => { const r = D.rows[i]; return j >= 3 ? [r.ok ? 'green' : 'red', 0.2] : null; },
            textColor: (i, j) => { const r = D.rows[i]; return (j === 2 && r.a !== r.ur) || (j === 3 && r.b !== r.a) ? 'accent' : j === 0 ? 'muted' : 'ink'; },
            colWeights: [0.8, 1.1, 1.2, 1.2, 1.1],
          });
          const ok = D.rows.filter((r) => r.ok).length;
          s.corner(ok === D.rows.length ? 'this order matches the data' : `this order fails on ${D.rows.length - ok} of ${D.rows.length} forms`, 'br', { color: ok === D.rows.length ? 'green' : 'red', weight: 650 });
        });
        v.readout(() => {
          const { O, X, Y } = D, rel = (A, B, e, first) => (e > 0 ? `${A.name} **feeds** ${B.name}` : e < 0 ? `${A.name} **bleeds** ${B.name}` : null);
          const lines = [`1. $${ruleTeX(O.r1.rule)}$ (${O.r1.name})   2. $${ruleTeX(O.r2.rule)}$ (${O.r2.name})`];
          if (D.eXY) lines.push(`Applying ${X.name} first changes the number of sites of ${Y.name} from **${D.sY}** to **${D.sY2}**: ${rel(X, Y, D.eXY)}.`);
          else if (D.eYX) lines.push(`${X.name} has no effect on the sites of ${Y.name} (${D.sY} → ${D.sY2}). Applied the other way round, ${Y.name} would change the sites of ${X.name} from ${D.sX} to ${D.sX2} (${D.eYX > 0 ? 'feeding' : 'bleeding'}), so this order is **counter${D.eYX > 0 ? 'feeding' : 'bleeding'}**.`);
          lines.push(O.note);
          return lines.join('\n');
        });
      },
    },
    {
      num: '2.7',
      kind: 'Concept',
      name: 'Assimilation, deletion and epenthesis',
      statement: String.raw`Three of the most common phonological processes are **assimilation** (a segment takes on a feature of a neighbour, as in *input* → [ɪmpʊt]), **deletion** (a segment disappears, as the schwa in *family* → [fæmli]) and **epenthesis** (a segment is inserted, as the vowel in *buses*). Each is a rule of the form in 2.5: assimilation changes one feature value to agree with a neighbouring segment's, deletion has $B=\varnothing$, and epenthesis has $A=\varnothing$.`,
      idea: String.raw`Most phonological changes can be read as saving effort or improving perception. Assimilation overlaps gestures (the articulators anticipate or perseverate: the tongue tip need not leave the lips' position before the next stop), deletion removes weak, redundant material, and epenthesis repairs a sequence that would be illegal or hard to hear (two sibilants, or a cluster the language's syllables cannot parse, as in 2.8 and 2.9). They are stated over features (2.3), so that "the place of the next stop" is a single value that the rule copies.`,
      caption: String.raw`Choose a process and step through the examples. The upper row is the stored form, the lower row the pronunciation: **gold** marks a changed segment, **red** dashes a deleted one, **green** an inserted one; the curved arrow shows the neighbour that triggers an assimilation. The small labels give the feature that is copied. The last example of each process shows where the rule does not apply.`,
      deps: ['ling-2.5'],
      refs: ['Fromkin et al.'],
      tags: ['assimilation', 'epenthesis'],
      viz(v) {
        let ex = 0;
        const ps = v.select('Process', Object.entries(PROC).map(([k, p]) => ({ value: k, label: p.name.replace(/ \(.*/, '') })), 'nasal', { onChange: () => { ex = 0; } });
        v.button('Next example', () => { ex = (ex + 1) % PROC[ps.value].ex.length; });
        const s = v.stage({ x: [-0.4, 9.4], y: [-0.6, 5.2], axes: false, height: 320, full: true });
        const cur = () => { const P = PROC[ps.value], [gloss, ur] = P.ex[ex % P.ex.length], w = parseWord(ur), res = applyRule(w, P.rule); return { P, gloss, w, res }; };
        let C = null;
        v.render(() => {
          C = cur(); const { P, gloss, w, res } = C, cols = res.align.length, x0 = (9 - cols) / 2 + 0.5;
          s.setView([-0.4, Math.max(9.4, cols + 0.4)], [-0.6, 5.2]);
          const X = (k) => (cols > 9 ? 0.5 + k : x0 + k), yU = 3.2, yS = 1.0;
          s.text('stored', X(-0.9) - 0.1, yU, { size: 11, color: 'muted', align: 'right', baseline: 'middle' }); s.text('spoken', X(-0.9) - 0.1, yS, { size: 11, color: 'muted', align: 'right', baseline: 'middle' });
          s.text(`${gloss}`, X(cols - 0.5) + 0.3, 4.6, { size: 15, color: 'ink', align: 'right', weight: 650 });
          res.align.forEach((a, k) => {
            const u = a.u !== null ? w[a.u] : null, o = a.o !== null ? res.out[a.o] : null;
            const bx = (y, tok, col, dash) => { s.rect(X(k) - 0.4, y - 0.42, X(k) + 0.4, y + 0.42, { fill: col, fillAlpha: col ? 0.28 : 0, color: col || 'grid', width: col ? 2 : 1.2, radius: 7, dash }); if (tok) s.text((tok.str ? 'ˈ' : '') + tok.s, X(k), y, { size: 19, color: 'ink', align: 'center', baseline: 'middle' }); };
            if (u) bx(yU, u, u && o === null ? 'red' : null); else s.rect(X(k) - 0.4, yU - 0.42, X(k) + 0.4, yU + 0.42, { color: 'grid', width: 1, dash: true, radius: 7 });
            if (o) bx(yS, o, o.ins ? 'green' : o.chg ? 'gold' : null); else bx(yS, null, 'red', true);
            if (u && o) s.line(X(k), yU - 0.45, X(k), yS + 0.45, { color: o.chg ? 'gold' : 'grid', width: o.chg ? 2 : 1 });
            if (u && o === null) { s.line(X(k) - 0.3, yS - 0.3, X(k) + 0.3, yS + 0.3, { color: 'red', width: 2 }); s.line(X(k) - 0.3, yS + 0.3, X(k) + 0.3, yS - 0.3, { color: 'red', width: 2 }); }
            if (o && o.ins) s.text('inserted', X(k), yS - 0.7, { size: 10, color: 'green', align: 'center' });
            if (P.under) {
              const lu = u ? P.under(u.s) : '', lo = o ? P.under(o.s) : '';
              if (lu) s.text(lu, X(k), yU + 0.62, { size: 10, color: o && o.chg ? 'gold' : 'faint', align: 'center' });
              if (lo && o.chg) s.text(lo, X(k), yS - 0.68, { size: 10, color: 'gold', align: 'center' });
            }
          });
          // trigger arrows for assimilations
          if (P.trigger) res.hits.filter((h) => h.kind === 'chg').forEach((h) => {
            const k = res.align.findIndex((a) => a.o === h.i), kt = k + P.trigger;
            if (kt >= 0 && kt < cols) { const xa = X(kt), xb = X(k); s.curve((t) => [xa + (xb - xa) * t, yU + 0.95 + 0.6 * Math.sin(Math.PI * t)], 0, 1, { color: 'accent', width: 2 }); s.arrow(xb, yU + 1.1, xb, yU + 0.85, { color: 'accent', head: 7 }); }
          });
          s.corner(res.hits.length ? '' : 'rule does not apply', 'br', { color: 'orange', weight: 650 });
        });
        v.readout(() => {
          const { P, gloss, w, res } = C; const pron = showWord(res.out);
          const head = `**${P.name}** — ${P.what}.\n$${P.rtex}$`;
          if (!res.hits.length) return `${head}\n*${gloss.replace(/ \(.*/, '')}*: /${showWord(w)}/ → [${pron}] — no segment meets the rule's environment, so the form is unchanged.`;
          return `${head}\n*${gloss}*: /${showWord(w)}/ → [${pron}] (${res.hits.map((h) => (h.kind === 'ins' ? `+${h.to}` : h.kind === 'del' ? `−${h.from}` : `${h.from} → ${h.to}`)).join(', ')}).`;
        });
      },
    },
    {
      num: '2.8',
      kind: 'Concept',
      name: 'Phonotactics',
      statement: String.raw`**Phonotactics** is the knowledge of which sound sequences are possible in a language. Speakers judge novel words by it: English speakers accept *blick* as a possible word, reject *bnick*, and find *ptak* even worse in English than in Polish. Some missing sequences are **accidental gaps** (no English word happens to be *dwik*, although *dwell* shows the onset is fine) and some are **systematic gaps** (*bn* cannot begin an English word), and the difference is whether a general pattern forbids them.`,
      idea: String.raw`A learner can acquire phonotactics from the lexicon alone by counting what occurs, but raw counts do not separate the two kinds of gap: an unseen cluster in a class that is common (stop + glide) should be less surprising than one in a class that is never seen (stop + nasal). So the model here backs off from clusters to **manner classes**, a feature-level generalisation (2.3, 2.4), and, unlike a bigram model that only looks at adjacent segments, it scores onsets, nuclei and codas as units of the syllable (2.9). The bigram model's blind spot is exactly why *ptak* and *mbik* look acceptable to it: *p t* and *m b* both occur in the middle of words.`,
      caption: String.raw`Type a word in the simple respelling (a e i o u = æ ɛ ɪ ɑ ʌ; ee oo ay ie ow = i u eɪ aɪ aʊ; sh ch th ng j y r as in IPA; *blik* is *blick*, *bnik* is *bnick*) or choose one. Bars show the **surprisal** $-\log_2 P$ of each unit under the chosen model; the histogram places the word's average surprisal per segment among the 489 words of the lexicon (each scored by a model that has not seen it). Compare the two models on *ptak*, *mbik* and *tlip*. The lexicon is a small hand-written sample, so a few gaps are the model's, not English's.`,
      deps: ['ling-2.1'],
      refs: ['Fromkin et al.'],
      tags: ['phonotactics', 'learning'],
      scope: String.raw`The lexicon is a hand-written sample of common English words (about 490), not a corpus, and the probabilities are add-constant smoothed counts; real phonotactic learners (Hayes and Wilson, 2008) use many more features.`,
      viz(v) {
        const M = trainPhonotactics();
        const inp = v.input('word', 'blik', { width: 150, placeholder: 'respelled' });
        const mod = v.select('Model', [{ value: 'syl', label: 'syllable units + classes' }, { value: 'bigram', label: 'segment bigrams' }], 'syl');
        const pre = v.select('Try', WORDLIKE.map(([w, l]) => ({ value: w, label: l })), 'blik', { onChange: (w) => inp.set(w) });
        const sb = v.stage({ x: [0, 8], y: [-4, 24], axes: false, height: 300, weight: 1.4, minWidth: 300, title: 'surprisal of each unit' });
        const sh = v.stage({ x: [1.5, 8], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xlabel: 'average surprisal per segment (bits)', title: 'the word among the lexicon' });
        let R = null, syms = [];
        const histo = {}; for (const k of ['syl', 'bigram']) histo[k] = v.M.histogram(M.dist[k], { bins: 28, range: [1.5, 8] });
        v.render(() => {
          syms = respell(inp.value); const kind = mod.value;
          R = syms.length ? M.score(syms, kind) : null;
          const units = R ? R.units : [], n = Math.max(units.length, 1);
          sb.setView([-0.2, Math.max(n, 3) + 0.2], [-4, 24]); sb.hline(0, { color: 'muted', width: 1.2 });
          [6, 12, 18].forEach((b) => { sb.hline(b, { color: 'grid', width: 0.8 }); sb.text(b + ' bits', Math.max(n, 3) + 0.1, b + 0.4, { size: 9.5, color: 'faint', align: 'right' }); });
          units.forEach((u, i) => {
            const b = Math.min(u.bits, 24), col = u.bits > 12 ? 'red' : u.bits > 7.5 ? 'orange' : 'green';
            sb.rect(i + 0.15, 0, i + 0.85, b, { fill: col, fillAlpha: 0.35, color: col, width: 1.5 });
            const lab = kind === 'bigram' ? u.u[0].slice(2).replace('#', '#') + u.u[1] : u.u[0] === 'on:' ? 'on ' + (u.u[1] || '∅') : u.u[0] === 'nu:' ? 'nuc ' + u.u[1] : 'coda ' + (u.u[1] || '∅');
            sb.text(lab, i + 0.5, -1.2, { size: 11, color: 'ink', align: 'center', baseline: 'top' });
            sb.text(v.fix(u.bits, 1), i + 0.5, b + 0.8, { size: 11, color: 'ink', align: 'center' });
          });
          const H = histo[kind]; const top = Math.max(...H.density);
          sh.setView([1.5, 8], [0, top * 1.25]);
          sh.hist(M.dist[kind], { bins: 28, range: [1.5, 8], color: 'accent', fillAlpha: 0.3, density: true });
          if (R) { sh.vline(R.perSeg, { color: R.perSeg > 6 ? 'red' : 'green', width: 3 }); sh.text('this word', Math.min(R.perSeg, 7.2), top * 1.15, { size: 11, color: R.perSeg > 6 ? 'red' : 'green', align: R.perSeg > 6.8 ? 'right' : 'left', dx: R.perSeg > 6.8 ? -4 : 4 }); }
        });
        v.readout(() => {
          if (!R) return 'Type a word.';
          const kind = mod.value, d = M.dist[kind], worse = d.filter((x) => x > R.perSeg).length / d.length, total = R.units.reduce((a, u) => a + u.bits, 0);
          const lines = [`/${syms.join(' ')}/ — total surprisal **${v.fix(total, 1)}** bits, **${v.fix(R.perSeg, 2)}** bits per segment; the word is more probable than **${Math.round(worse * 100)}%** of the lexicon (median word: ${v.fix([...d].sort((a, b) => a - b)[d.length >> 1], 2)} bits).`];
          const gaps = R.units.filter((u) => u.c === 0 && u.u[1] !== '' && u.u[0] !== 'nu:' || (kind === 'bigram' && u.c === 0));
          if (kind === 'syl') for (const u of gaps) lines.push(`Unseen ${u.u[0] === 'on:' ? 'onset' : 'coda'} /${u.u[1]}/: ${u.kc > 0 ? `its manner class occurs ${u.kc} times, so the gap looks **accidental**` : 'its manner class never occurs, so the gap looks **systematic**'}.`);
          else for (const u of gaps) lines.push(`Never seen: ${u.u[0].slice(2)} followed by ${u.u[1]}.`);
          return lines.join('\n');
        });
      },
    },
    {
      num: '2.9',
      kind: 'Concept',
      name: 'Syllable structure: onset, nucleus, coda',
      statement: String.raw`A **syllable** has a hierarchical structure: an optional **onset** of consonants, an obligatory **nucleus** (normally a vowel) and an optional **coda**, with nucleus and coda grouped into the **rhyme**: $\sigma\to \text{O}\,\text{R}$, $\text{R}\to\text{N}\,\text{Co}$. A word divides into syllables so that every nucleus gets one, and where a string of consonants lies between two vowels it is split by language-specific limits on what can start and end a syllable (the **maximal onset principle**: give the next syllable the longest legal onset). Syllable weight depends on the rhyme: a light syllable has a short vowel and no coda, a heavy one has a long vowel, a diphthong or a coda.`,
      idea: String.raw`The structure explains patterns that the string of segments cannot: the phonotactic limits of 2.8 apply to the *edges* of syllables (onset *tl* is illegal but *atlas* is fine, since *t* and *l* sit in different syllables), rhymes are the unit that poetry matches and that determines weight (and thus stress in 2.11), and the sonority profile (2.10) is organised around the nucleus. Where the maximal-onset rule and the demand that a stressed syllable be heavy disagree, as in *happy*, languages differ in what they do.`,
      caption: String.raw`Type a word in the respelling of 2.8, or pick one. The tree shows each syllable $\sigma$ with its onset (orange), nucleus (blue), coda (red) and the **rhyme** node R; an onset that English cannot begin a word with is marked in red. Switch the strategy to make the stressed syllable heavy (*happy* → *hap.py*) and move the stress with the slider; the bottom row gives each syllable's weight.`,
      deps: ['ling-2.8'],
      refs: ['Ladefoged & Johnson'],
      tags: ['syllables', 'phonotactics'],
      viz(v) {
        const inp = v.input('word', 'hapee', { width: 170 });
        const pre = v.select('Try', SYL_WORDS.map(([w, l]) => ({ value: w, label: l })), 'hapee', { onChange: (w) => inp.set(w) });
        const strat = v.select('Strategy', [{ value: 'onset', label: 'maximal onset' }, { value: 'coda', label: 'stressed syllable heavy' }], 'onset');
        const stress = v.slider('stressed syllable', 1, 6, 1, { int: true });
        const s = v.stage({ x: [0, 12], y: [-0.8, 5.2], axes: false, height: 360, full: true });
        let C = null;
        v.render(() => {
          const syms = respell(inp.value); const sy = syllabify(syms, strat.value, stress.value - 1);
          C = { syms, sy };
          let k = 0; const W = syms.length + 0.5 * (sy.length - 1) + 1; const x0 = 0.5;
          s.setView([0, Math.max(W + 1, 8)], [-0.8, 5.2]);
          const cx = (W < 8 ? (8 - W) / 2 : 0) + x0;
          let x = cx; const SYL = [];
          sy.forEach((y, si) => {
            const place = (arr) => arr.map((sym) => { const p = x + 0.5; x += 1; return { sym, p }; });
            const O = place(y.on), N = place(y.nu), Co = place(y.co); SYL.push({ O, N, Co, y }); x += 0.5;
          });
          const mid = (arr) => (arr.length ? (arr[0].p + arr[arr.length - 1].p) / 2 : null);
          SYL.forEach((S, si) => {
            const bad = S.y.on.length && !LEGAL_ONSETS.has(S.y.on.join('')) && (si === 0 || true);
            const box = (a, col, bd) => a.forEach((q) => { s.rect(q.p - 0.42, 0.2, q.p + 0.42, 1.0, { fill: col, fillAlpha: 0.25, color: bd || col, width: bd ? 2.2 : 1.4, radius: 6 }); s.text(q.sym, q.p, 0.6, { size: 18, color: 'ink', align: 'center', baseline: 'middle' }); });
            box(S.O, 'orange', bad ? 'red' : null); box(S.N, 'accent'); box(S.Co, 'red');
            const yO = 1.9, yR = 2.9, ys = 3.9;
            const node = (label, px, py, col) => { s.rect(px - 0.36, py - 0.28, px + 0.36, py + 0.28, { fill: col, fillAlpha: 0.15, color: col, width: 1.4, radius: 6 }); s.text(label, px, py, { size: 14, color: 'ink', align: 'center', baseline: 'middle', math: true }); };
            const mO = mid(S.O), mN = mid(S.N), mC = mid(S.Co), mR = mid([...S.N, ...S.Co]), mS = mid([...S.O, ...S.N, ...S.Co]);
            const link = (px, py, qx, qy) => s.line(px, py, qx, qy, { color: 'muted', width: 1.3 });
            if (mO !== null) { node('O', mO, yO, 'orange'); S.O.forEach((q) => link(mO, yO - 0.28, q.p, 1.02)); link(mS, ys - 0.28, mO, yO + 0.28); }
            node('N', mN, yO, 'accent'); S.N.forEach((q) => link(mN, yO - 0.28, q.p, 1.02));
            if (mC !== null) { node('Co', mC, yO, 'red'); S.Co.forEach((q) => link(mC, yO - 0.28, q.p, 1.02)); }
            node('R', mR, yR, 'muted'); link(mR, yR - 0.28, mN, yO + 0.28); if (mC !== null) link(mR, yR - 0.28, mC, yO + 0.28); link(mS, ys - 0.28, mR, yR + 0.28);
            node('σ', mS, ys, 'ink');
            const heavy = S.Co.length > 0 || HEAVY_V.has(S.y.nu[0]);
            s.text((heavy ? 'heavy' : 'light') + (si === stress.value - 1 ? ' · stressed' : ''), mS, -0.45, { size: 11.5, color: heavy ? 'red' : 'green', align: 'center', weight: si === stress.value - 1 ? 700 : 400 });
            if (si === stress.value - 1) s.rect(mS - 0.62, ys - 0.42, mS + 0.62, ys + 0.42, { color: 'gold', width: 2.4, radius: 8 });
          });
        });
        v.readout(() => {
          const { syms, sy } = C; if (!syms.length) return 'Type a word.';
          const a = syllabify(syms, 'onset').map(sylText).join('.'), b = syllabify(syms, 'coda', stress.value - 1).map(sylText).join('.');
          const bad = sy.filter((y) => y.on.length && !LEGAL_ONSETS.has(y.on.join(''))).map((y) => y.on.join(''));
          return `/${syms.join('')}/ → **${sy.map(sylText).join(' . ')}** (${sy.length} syllable${sy.length === 1 ? '' : 's'}).\nMaximal onset: ${a}; stressed syllable heavy: ${b}${a === b ? ' (the same: no ambiguity here)' : ' (they differ: the string of consonants can be divided in more than one way)'}.` + (bad.length ? `\n**Illegal onset${bad.length > 1 ? 's' : ''}** ${bad.map((o) => '/' + o + '/').join(', ')}: no English word begins with it (compare 2.8).` : '');
        });
      },
    },
  ],
};
