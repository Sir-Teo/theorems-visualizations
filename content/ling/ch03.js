// Linguistics & Language — Chapter 3: Morphology: the structure of words (items 3.1–3.5)
import { MORPH_COLOR, MORPH_TYPE_NAME, parseMorphs, MORPHEMES, layoutTree, drawTree, catalan, applyRule, parseWord, respell, SEG, specTeX } from './ch03.shared.js';

// ---------- 3.1 ----------
const PRESET_WORDS = ['unbelievably', 'disagreements', 'nationalization', 'careless', 'rereading', 'cranberries', 'friendliest', 'replaceable'];

// ---------- 3.2: the sorting tests. Order: [changes category, new dictionary meaning, can still take derivation (position), applies to whole class, required by syntax] ----------
const TESTS = ['changes the category?', 'meaning not fully predictable?', 'comes outside all derivation?', 'applies to the whole class?', 'forced by the grammar?'];
// true in a test column means the answer "yes"; INFL_LIKE says which answer is typical of inflection
const INFL_LIKE = [false, false, true, true, true];
const AFFIXES = [
  { a: '-s', ex: 'cats', t: [0, 0, 1, 1, 1], note: 'Plural is demanded by agreement (*two cat, *these cat), never changes the category and applies to (almost) every count noun.' },
  { a: '-ed', ex: 'walked', t: [0, 0, 1, 1, 1], note: 'Past tense: required by the tense of the clause, predictable, and it always sits outside any derivation (re-start-ed, not *start-ed-re).' },
  { a: '-ing', ex: 'walking', t: [0, 0, 1, 1, 1], note: 'The progressive form is required after *be*. (A different -ing makes nouns such as *building*: that one is derivational.)' },
  { a: '-er', ex: 'taller', t: [0, 0, 1, 0, 0], note: 'Comparative: no change of category, predictable, outermost; but it applies only to short adjectives (*beautifuler), so it is a borderline case that nevertheless sorts with inflection.', border: true },
  { a: '-est', ex: 'tallest', t: [0, 0, 1, 0, 0], note: 'Superlative: parallel to the comparative.', border: true },
  { a: 'un-', ex: 'unhappy', t: [0, 1, 0, 0, 0], note: 'Keeps the category (adjective to adjective), selects only some bases (unhappy, *unsad), can be followed by further derivation (unhappi-ness): derivational.' },
  { a: 're-', ex: 'rewrite', t: [0, 0, 0, 0, 0], note: 'Prefixes that keep the category can still be derivational: they are optional, selective (*re-know) and sit inside inflection (re-writ-ing).' },
  { a: '-ness', ex: 'kindness', t: [1, 0, 0, 0, 0], note: 'Turns adjectives into nouns, optional and selective, and can be followed by further affixes.' },
  { a: '-able', ex: 'readable', t: [1, 0, 0, 0, 0], note: 'Verb to adjective: changes the category.' },
  { a: '-er', ex: 'teacher', t: [1, 1, 0, 0, 0], note: 'The agent -er (verb to noun) builds new entries (teacher, computer, cooker), changes category and is not obligatory. Same spelling as the comparative, different morpheme.' },
  { a: '-ly', ex: 'quickly', t: [1, 0, 1, 0, 0], note: 'Adjective to adverb: a classical borderline case. It changes the category and is optional, but is highly regular and sits late; most grammars call it derivational.', border: true },
  { a: '-ize', ex: 'modernize', t: [1, 1, 0, 0, 0], note: 'Adjective or noun to verb; unpredictable (what does it mean to *hospitalize*?).' },
  { a: '-ment', ex: 'agreement', t: [1, 1, 0, 0, 0], note: 'Verb to noun, with a lexicalised result meaning (*government*).' },
  { a: '-ful', ex: 'careful', t: [1, 0, 0, 0, 0], note: 'Noun to adjective.' },
];
const verdictOf = (r) => (r.t.reduce((n, x, k) => n + (!!x === INFL_LIKE[k] ? 1 : 0), 0) >= 3 ? 1 : 2);

// ---------- 3.3 ----------
const UN_WORDS = {
  unlockable: { v: 'lock', ab: 'able', hasUnV: true, ok: true, mA: 'not able to be locked (it has no lock, or it is unlockable by design)', mB: 'able to be unlocked' },
  unzippable: { v: 'zip', ab: 'able', hasUnV: true, ok: true, mA: 'not able to be zipped', mB: 'able to be unzipped' },
  unbreakable: { v: 'break', ab: 'able', hasUnV: false, ok: true, mA: 'not able to be broken', mB: 'able to be “unbroken”: there is no such verb' },
  unknowable: { v: 'know', ab: 'able', hasUnV: false, ok: true, mA: 'not able to be known', mB: 'able to be “unknown”: there is no such verb' },
};

// ---------- 3.4 ----------
const COMPOUNDS = [
  { k: 'bird+cage', a: ['bird', 'N'], b: ['cage', 'N'], AB: ['birdcage', 'a cage for birds', 'BIRD·cage'], BA: ['cage bird', 'a bird that is kept in a cage', 'CAGE·bird'], nA: true, nB: true },
  { k: 'house+boat', a: ['house', 'N'], b: ['boat', 'N'], AB: ['houseboat', 'a boat used as a house', 'HOUSE·boat'], BA: ['boathouse', 'a house for boats', 'BOAT·house'], nA: true, nB: true },
  { k: 'black+board', a: ['black', 'Adj'], b: ['board', 'N'], AB: ['blackboard', 'a board to write on (in my experience not always black)', 'BLACK·board'], BA: null, nA: true, nB: false, phrase: ['black board', 'a board that is black', 'black BOARD'] },
  { k: 'green+house', a: ['green', 'Adj'], b: ['house', 'N'], AB: ['greenhouse', 'a glass building for growing plants (not a green house)', 'GREEN·house'], BA: null, nA: true, nB: false, phrase: ['green house', 'a house that is green', 'green HOUSE'] },
  { k: 'dog+fish', a: ['dog', 'N'], b: ['fish', 'N'], AB: ['dogfish', 'a kind of fish (a small shark), not a kind of dog', 'DOG·fish'], BA: null, nA: true, nB: false },
  { k: 'tooth+brush', a: ['tooth', 'N'], b: ['brush', 'N'], AB: ['toothbrush', 'a brush for teeth', 'TOOTH·brush'], BA: null, nA: true, nB: false },
  { k: 'snow+white', a: ['snow', 'N'], b: ['white', 'Adj'], AB: ['snow-white', 'white like snow (an adjective)', 'SNOW·white'], BA: null, nA: true, nB: false },
];

// ---------- 3.5 ----------
const PLURALS = [
  ['cat', 'kat', ''], ['dog', 'dog', ''], ['bus', 'bus', ''], ['church', 'cherch', ''], ['judge', 'juj', ''], ['dish', 'dish', ''], ['moth', 'mawth', ''], ['toe', 'toh', ''],
  ['cab', 'kab', ''], ['gap', 'gap', ''], ['cliff', 'klif', ''], ['tree', 'tree', ''], ['rose', 'rohz', ''], ['face', 'fays', ''], ['lip', 'lip', ''], ['bell', 'bel', ''], ['ring', 'ring', ''], ['book', 'book', ''], ['egg', 'eg', ''], ['pie', 'pie', ''],
  ['ox', 'oks', 'oxen'], ['child', 'chield', 'children'], ['mouse', 'mows', 'mice'], ['foot', 'foot', 'feet'],
];
const PL_RULES = {
  z: [{ name: 'insert ɪ', rule: { A: '∅', B: 'ɪ', L: ['[+strid]'], R: ['z', '#'] } }, { name: 'devoice', rule: { A: 'z', B: '[-voi]', L: ['[-voi]'], R: ['#'] } }],
  s: [{ name: 'insert ɪ', rule: { A: '∅', B: 'ɪ', L: ['[+strid]'], R: ['s', '#'] } }, { name: 'voicing', rule: { A: 's', B: '[+voi]', L: ['[+voi]'], R: ['#'] } }],
  ɪz: [{ name: 'delete ɪ', rule: { A: 'ɪ', B: '∅', L: ['[-strid]'], R: ['z', '#'] } }, { name: 'devoice', rule: { A: 'z', B: '[-voi]', L: ['[-voi]'], R: ['#'] } }],
};
function plurals(stemSyms, ur) {
  const suf = ur === 'ɪz' ? ['ɪ', 'z'] : [ur];
  let w = [...stemSyms, ...suf].map((s) => ({ s, str: false }));
  const rows = [{ label: 'underlying', w, hits: [] }];
  for (const r of PL_RULES[ur]) { const o = applyRule(w, r.rule); rows.push({ label: r.name, rule: r.rule, w: o.out, hits: o.hits }); w = o.out; }
  return rows;
}
const surfPlural = (rows) => { const w = rows[rows.length - 1].w.map((t) => t.s); const last = w[w.length - 1]; return last === 'z' && w[w.length - 2] === 'ɪ' ? 'ɪz' : last; };

export default {
  collection: 'ling',
  chapter: 3,
  title: 'Morphology: the structure of words',
  summary: String.raw`Words are built from morphemes, units with meaning or grammatical function. Inflection marks grammar while derivation makes new words, and both have internal hierarchical structure. Languages differ in how much they pack into a word, from isolating to polysynthetic, and some build words by interleaving roots and patterns or by copying. Productivity explains why speakers can inflect words they have never heard.`,
  items: [
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Morphemes: free and bound',
      credit: 'Term coined by Baudouin de Courtenay (1890s); popularised by Bloomfield, 1933',
      statement: String.raw`A **morpheme** is the smallest pairing of form and meaning (or grammatical function) in a language: a piece of a word that cannot be cut further without losing it. A **free** morpheme can stand alone as a word (*believe*, *happy*); a **bound** morpheme cannot and must attach to another (*un-*, *-able*, *-ly*). **Roots** carry the core meaning, **affixes** (prefixes and suffixes) attach to roots, and a few roots are themselves bound (*cran-* in *cranberry*, *-ceive* in *receive*, *deceive*). A morpheme can have several spellings and sounds, its **allomorphs** (3.5).`,
      idea: String.raw`Morphemes are found by comparison: *unlockable* contains *lock* because *lock*, *locks*, *unlock* and *lockable* recur with the same core meaning, and *un-* because it recurs in *undo*, *unfair*, *unhappy*. Cutting must leave recurring pieces with a constant contribution on both sides, which is why *cranberry* is analysed as *cran* + *berry* (*berry* recurs, *cran-* recurs in *cranapple*) even though *cran-* means nothing alone. Spelling and sound may change at the seam (*believe*/*believ-*, *happy*/*happi-*): the morpheme is the abstract unit, the spelling is its realisation.`,
      caption: String.raw`Type a word (or choose one) and read its morphemes: roots blue, derivational prefixes orange, derivational suffixes teal, inflectional suffixes purple; hatching marks a bound root. Press **Next analysis** when the word has several parses (*-er* is both an agent and a comparative suffix). The parser is a small hand-made lexicon of about 90 morphemes (roots and affixes of the examples), not a general analyser: unknown roots are reported, not guessed.`,
      deps: [],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['morpheme', 'word structure'],
      scope: String.raw`Cutting a word into morphemes is clean for concatenative word-building and gets harder for fusion (*went*), nonconcatenative patterns (3.8) and cranberry-type bound roots, which linguists treat in different ways.`,
      viz(v) {
        const inp = v.input('word', 'unbelievably', { width: 200, placeholder: 'a word' });
        v.select('Try', PRESET_WORDS.map((w) => ({ value: w, label: w })), 'unbelievably', { onChange: (w) => { inp.set(w); k = 0; } });
        let k = 0;
        v.button('Next analysis', () => { k++; });
        const s = v.stage({ x: [0, 12], y: [0, 7.5], axes: false, height: 340, full: true });
        let info = null;
        v.render(() => {
          const P = parseMorphs(inp.value);
          if (!P.length) { info = null; s.text(`“${inp.value}” is not covered by this mini-lexicon`, 6, 4.2, { size: 15, color: 'muted', align: 'center' }); s.text('Try: unbelievably, disagreements, nationalization, careless …', 6, 3.4, { size: 12.5, color: 'faint', align: 'center' }); return; }
          const a = P[k % P.length]; info = { a, n: P.length, i: k % P.length };
          const widths = a.map((p) => Math.max(1.2, 0.3 * p.s.length + 0.8)); const tot = widths.reduce((x, y) => x + y, 0) + 0.15 * (a.length - 1);
          const sc = Math.min(1.6, 10.8 / tot); let x = 6 - (tot * sc) / 2;
          a.forEach((p, i) => {
            const w = widths[i] * sc, col = MORPH_COLOR[p.m.type], bound = p.m.type !== 'root' || p.m.bound;
            s.rect(x, 5.2, x + w, 6.6, { fill: col, fillAlpha: 0.22, color: col, width: 2, radius: 8, hatch: bound && p.m.type === 'root' ? col : false });
            s.text(p.s, x + w / 2, 5.9, { size: 20, color: 'ink', align: 'center', baseline: 'middle' });
            s.text(String(i + 1), x + w / 2, 4.95, { size: 12, color: col, align: 'center', baseline: 'top' });
            x += w + 0.15 * sc;
          });
          a.forEach((p, i) => {
            const y = 3.9 - i * 0.62, col = MORPH_COLOR[p.m.type];
            s.dot(0.5, y, { r: 6, color: col, fill: col });
            const kind = MORPH_TYPE_NAME[p.m.type] + (p.m.type === 'root' ? (p.m.free ? ', free' : ', bound') : ', bound');
            s.text(`${i + 1}  ${p.m.id}  “${p.m.gloss}”   (${kind}${p.s !== p.m.id.replace(/-/g, '') && p.m.type !== 'root' ? `; spelled ${p.s}` : ''})`, 0.85, y, { size: 13, color: 'ink', align: 'left', baseline: 'middle' });
          });
        });
        v.readout(() => {
          if (!info) return 'No analysis: the word is not made of morphemes from the mini-lexicon.';
          const a = info.a, nf = a.filter((p) => p.m.type === 'root' && p.m.free).length;
          return `**${a.map((p) => p.s).join(' + ')}**: ${a.length} morphemes: ${nf} free root${nf === 1 ? '' : 's'}, ${a.length - nf} bound (${a.filter((p) => p.m.type !== 'root').length} affixes${a.some((p) => p.m.bound) ? ', one bound root' : ''}). Analysis ${info.i + 1} of ${info.n}.`;
        });
      },
    },
    {
      num: '3.2',
      kind: 'Concept',
      name: 'Inflection versus derivation',
      statement: String.raw`Affixes come in two kinds. **Inflection** marks the grammatical form of a word that the syntax requires (plural, tense, agreement, comparison) and leaves it the same lexeme; **derivation** builds a new lexeme, usually with a new category or meaning (*teach* → *teacher*, *kind* → *kindness*). The distinction is made by a bundle of tests rather than one: derivation tends to change the category, give less predictable meanings, apply to only some bases, sit closer to the root, and be optional, while inflection is outermost, regular, general and forced by the grammar. Several affixes are borderline.`,
      idea: String.raw`No single criterion is decisive (*un-* derives but keeps the category, *-ly* changes the category but is almost fully regular), so the line is a cluster of correlated properties, which is why textbooks insist on several tests. Their origin is the word-formation architecture: derivation builds the stems that the lexicon stores, inflection then adds the grammar the sentence needs. That order is the reason inflection sits outside derivation (*re-start-ed*, never *start-ed-re*) and why it applies across a whole class of stems (3.7).`,
      caption: String.raw`The table gives each affix's answers to five tests (new category: does it change the category? new meaning: is the meaning not fully predictable? outermost: does it come outside all derivation? whole class: does it apply to every stem of the class? forced: does the grammar demand it?; blue = the answer typical of inflection, orange = typical of derivation). **Click a row** to put it in your bin: first click inflection, second derivation, third clear. Rows where your sort disagrees with the majority of the tests turn red and the readout explains the case. Three or more inflection-like answers count as inflection; the borderline rows (*-er* comparative, *-est*, *-ly*) show where a hard line is artificial. The yes/no answers are the usual textbook judgements, entered by hand.`,
      deps: ['ling-3.1'],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['inflection', 'derivation'],
      scope: String.raw`English affixes only. In other languages the tests disagree more (in many languages a case or number marker is as optional as a derivational one), and some theories deny that the distinction is sharp at all.`,
      viz(v) {
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 520, full: true });
        const choice = AFFIXES.map(() => 0);
        let last = 0;
        const T = v.table(s, { rows: AFFIXES.length, cols: 7, square: false, cellAspect: 2.4, maxCell: 32, size: 12.5, labelSize: 11.5, colLabels: ['new category?', 'new meaning?', 'outermost?', 'whole class?', 'forced?', 'your sort', 'tests say'], rowLabels: AFFIXES.map((r) => `${r.a}  ${r.ex}`) });
        s.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0) { choice[c.i] = (choice[c.i] + 1) % 3; last = c.i; } });
        v.render(() => {
          T.draw({
            value: (i, j) => (j < 5 ? (AFFIXES[i].t[j] ? 'yes' : 'no') : j === 5 ? ['?', 'inflection', 'derivation'][choice[i]] : verdictOf(AFFIXES[i]) === 1 ? 'inflection' : 'derivation'),
            fill: (i, j) => (j < 5 ? [!!AFFIXES[i].t[j] === INFL_LIKE[j] ? 'accent' : 'orange', 0.3] : j === 5 ? (choice[i] === 0 ? null : choice[i] === verdictOf(AFFIXES[i]) ? ['green', 0.3] : ['red', 0.35]) : [verdictOf(AFFIXES[i]) === 1 ? 'accent' : 'orange', 0.3]),
            highlight: [[last, 5, 'gold']],
          });
        });
        v.readout(() => {
          const r = AFFIXES[last], vd = verdictOf(r), n = r.t.reduce((q, x, k) => q + (!!x === INFL_LIKE[k] ? 1 : 0), 0);
          const sorted = choice.filter((c) => c).length, ok = choice.filter((c, i) => c && c === verdictOf(AFFIXES[i])).length;
          return `**${r.a}** (${r.ex}): ${n} of 5 tests are inflection-like, so the tests say **${vd === 1 ? 'inflection' : 'derivation'}**${r.border ? ' (borderline)' : ''}. ${r.note}\nYou have sorted ${sorted} of ${AFFIXES.length}; ${ok} agree with the tests.`;
        });
      },
    },
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Word-internal structure and ambiguity',
      statement: String.raw`Complex words are not flat strings of morphemes but **hierarchical**: affixes combine with a base one at a time, so a word has a binary-branching tree (a bracketing) whose nodes have categories. When a word has several well-formed bracketings, it is **structurally ambiguous**: *unlockable* is $[\text{un}\,[\text{lock}\,\text{able}]]$ ("not able to be locked") and $[[\text{un}\,\text{lock}]\,\text{able}]$ ("able to be unlocked"). The tree is constrained by what each affix can attach to: a bracketing is licensed only if every sub-constituent is itself a word of the required category.`,
      idea: String.raw`Each affix has a selectional restriction (*un-* attaches to adjectives and to reversible verbs, *-able* to verbs) and every step must produce a legitimate word. For *unlockable*, both routes pass (*lockable* is an adjective that *un-* can negate; *unlock* is a verb that *-able* can adjectivalise), so the string has two meanings. *Unbreakable* has only the first (there is no verb *unbreak*), which is why it is not ambiguous. The number of conceivable bracketings of $n$ morphemes grows as the Catalan numbers, but the restrictions leave few of them.`,
      caption: String.raw`Pick a word and say which meaning you intend: the matching tree lights up. Both trees are drawn side by side for every word; a bracketing that needs a non-existent intermediate word (*unbreak*) is struck out in red and cannot be chosen. Compare *unlockable* (two readings) with *unbreakable* (one). The list of reversible verbs is a hand-made sample.`,
      deps: ['ling-3.2'],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['morphological structure', 'ambiguity'],
      scope: String.raw`Uses English *un-* with an adjectival or reversative reading. Famous “bracketing paradoxes” (*unhappier*, *transformational grammarian*) show that a single hierarchical tree cannot always capture both sound and meaning.`,
      viz(v) {
        const w = v.select('Word', Object.keys(UN_WORDS).map((x) => ({ value: x, label: x })), 'unlockable');
        const m = v.select('Meaning I intend', [{ value: 'A', label: 'not [able to be …ed]' }, { value: 'B', label: '[un-…ed] and able' }], 'A');
        const sa = v.stage({ x: [0, 10], y: [-0.3, 4.6], axes: false, height: 300, title: 'A:  un- [ V -able ]' });
        const sb = v.stage({ x: [0, 10], y: [-0.3, 4.6], axes: false, height: 300, title: 'B:  [ un- V ] -able' });
        v.render(() => {
          const d = UN_WORDS[w.value];
          if (m.value === 'B' && !d.hasUnV) m.value = 'A';
          const leafU = (c) => ({ l: 'un-', col: 'orange', c }), leafV = { l: d.v, col: 'accent', c: 'V' }, leafA = { l: '-able', col: 'teal', c: '' };
          const A = { c: 'Adj', note: d.mA.split(' (')[0], k: [{ l: 'un-', col: 'orange', c: 'neg' }, { c: 'Adj', note: d.v + 'able', k: [{ ...leafV }, { ...leafA }] }] };
          const B = { c: 'Adj', note: d.mB.startsWith('able to be “un') ? '' : d.mB, k: [{ c: 'V', note: d.hasUnV ? 'un' + d.v : '*un' + d.v, nc: d.hasUnV ? 'muted' : 'red', k: [{ l: 'un-', col: 'orange', c: 'rev' }, { ...leafV }] }, { l: '-able', col: 'teal', c: '' }] };
          layoutTree(A, 0.4, 9.6, 0.6, 1.35); layoutTree(B, 0.4, 9.6, 0.6, 1.35);
          const dim = (vv) => { sa.ctx.globalAlpha = vv; };
          sa.ctx.save(); sa.ctx.globalAlpha = m.value === 'A' ? 1 : 0.35; drawTree(sa, A); sa.ctx.restore();
          sb.ctx.save(); sb.ctx.globalAlpha = m.value === 'B' ? 1 : 0.35; drawTree(sb, B); sb.ctx.restore();
          if (!d.hasUnV) { sb.rect(0.1, 2.3, 9.9, 4.5, { fill: 'red', fillAlpha: 0.08, color: 'red', width: 1.5, dash: true, radius: 8 }); sb.text(`✗ there is no verb “un${d.v}”`, 5, 4.3, { size: 14, color: 'red', align: 'center', baseline: 'top' }); }
        });
        v.readout(() => {
          const d = UN_WORDS[w.value], n = d.hasUnV ? 2 : 1;
          return `**${w.value}** has **${n}** licensed bracketing${n > 1 ? 's' : ''} (out of the ${catalan(2)} conceivable for 3 morphemes; ${catalan(3)} for 4, ${catalan(4)} for 5), so it is ${n > 1 ? '**structurally ambiguous**' : 'unambiguous'}.\nMeaning A: ${d.mA}.\nMeaning B: ${d.mB}.`;
        });
      },
    },
    {
      num: '3.4',
      kind: 'Concept',
      name: 'Compounding and headedness',
      statement: String.raw`A **compound** joins two (or more) words into one new word: *birdcage*, *blackboard*, *snow-white*. In English the **head** of a compound is its right-hand member: it fixes the compound's category and its basic meaning, so a *birdcage* is a kind of cage and a *cage bird* is a kind of bird, and the left-hand member only specifies it, in a way that is not given by the grammar (a cage *for* birds, a house *for* boats, a boat *used as* a house). English compounds also usually take their main stress on the first member (*BLACKboard*, against the phrase *black BOARD*). Some compounds have no head inside (**exocentric**: *pickpocket*, *redhead*).`,
      idea: String.raw`Compounds are built like other words (3.3): two words merge into a node, and a node inherits its category from one daughter, its head. In English the head is on the right, the same position that decides the category of words with suffixes (*-ness* makes nouns), which is why the “right-hand head rule” is a statement about words generally. The relation between the two parts is left to the speaker and context, so the same pair gives different relations (*snowball* is made of snow, *snowman* is shaped like a man); the compound stress pattern marks the word-hood that the phrase *black BOARD* lacks.`,
      caption: String.raw`Choose a pair and press **swap order**: the head (green edge) is always the right-hand word, so the category and the meaning change when the order flips and some orders give no real word. The lower panel shows the stress of the compound and, for adjective + noun, of the corresponding phrase. Meanings are glossed by hand for these examples; the compound stress rule has many exceptions (*apple PIE*, *Madison STREET*).`,
      deps: ['ling-3.3'],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['compounding', 'head'],
      credit: 'Right-hand head rule: Williams, 1981',
      scope: String.raw`The right-hand head rule is a generalisation about English and other Germanic languages. Many languages have left-headed compounds and English itself has exceptions among prefixed verbs (*enlarge*, *ennoble*), which Williams noted as systematic exceptions.`,
      viz(v) {
        const sel = v.select('Pair', COMPOUNDS.map((c) => ({ value: c.k, label: c.k })), 'bird+cage');
        const sw = v.toggle('swap order', false);
        const s = v.stage({ x: [0, 10], y: [-0.3, 4.4], axes: false, height: 300, weight: 1.3, title: 'word structure' });
        const s2 = v.stage({ x: [0, 10], y: [0, 5], axes: false, height: 300, weight: 1, title: 'stress' });
        let cur = null;
        v.render(() => {
          const c = COMPOUNDS.find((q) => q.k === sel.value);
          const flip = sw.value;
          const L = flip ? c.b : c.a, R = flip ? c.a : c.b, real = flip ? c.BA : c.AB;
          const head = R[1];
          const mk = (w) => ({ l: w[0], col: 'accent', c: w[1] });
          const t = { c: head, note: real ? real[0] : `${L[0]}${R[0]} ?`, nc: real ? 'ink' : 'red', k: [mk(L), { ...mk(R), head: true }] };
          layoutTree(t, 0.8, 9.2, 0.7, 2); drawTree(s, t, { pill: 0.2 });
          s.text('head', t.k[1].x + 0.1, 1.7, { size: 12, color: 'green', align: 'left' });
          s.text(real ? `“${real[1]}”` : 'not a standard English word', 5, 3.9, { size: 12.5, color: real ? 'muted' : 'red', align: 'center', baseline: 'top' });
          cur = { c, L, R, real, head };
          const drawWord = (txt, y, label, col) => {
            s2.text(label, 0.3, y + 1.15, { size: 11.5, color: 'muted', align: 'left' });
            const parts = txt.split(/([·\s])/).filter(Boolean); let x = 0.5; const up = s2.width / 10;
            parts.forEach((p) => { if (p === '·') return; if (p === ' ') { x += 0.3; return; } const big = p === p.toUpperCase() && /[A-Z]/.test(p), sz = big ? 26 : 19, w = ((big ? 0.72 : 0.52) * sz * p.length) / up; s2.text(p, x, y, { size: sz, color: big ? col : 'ink', align: 'left', baseline: 'middle' }); if (big) s2.text('▲', x + w / 2, y + 0.5, { size: 11, color: col, align: 'center' }); x += w; });
          };
          if (real) drawWord(real[2], 3.4, 'compound (one word)', 'accent');
          else s2.text('(no real compound in this order)', 0.5, 3.4, { size: 13, color: 'red', align: 'left' });
          if (c.phrase && !flip) drawWord(c.phrase[2], 1.7, `phrase: “${c.phrase[0]}” = ${c.phrase[1]}`, 'orange');
          else if (c.phrase) s2.text('(an adjective cannot follow the noun in a phrase)', 0.5, 1.9, { size: 12, color: 'faint', align: 'left' });
          s2.text('exocentric (no head inside): pickpocket, redhead', 0.3, 0.45, { size: 12, color: 'muted', align: 'left' });
        });
        v.readout(() => {
          if (!cur) return '';
          const { L, R, real, head } = cur;
          return `Right-hand head rule: **${L[0]}** (${L[1]}) + **${R[0]}** (${R[1]}) is a **${head}**${real ? `, and ${real[0]} is a kind of ${R[0]}` : ', but this order does not exist as a word'}.`;
        });
      },
    },
    {
      num: '3.5',
      kind: 'Concept',
      name: 'Allomorphy: the English plural',
      statement: String.raw`A morpheme may have several pronunciations, its **allomorphs**, chosen by the sounds around it. The regular English plural (and the 3rd-singular, possessive and contracted *is*) is pronounced **[s]** after a voiceless non-sibilant (*cats*), **[z]** after a voiced sound that is not a sibilant (*dogs*, *toes*), and **[ɪz]** after a sibilant (*buses*, *churches*). The pattern is derived by choosing one underlying form, /z/, and two ordered rules: insert [ɪ] between a sibilant and /z/, then devoice /z/ after a voiceless segment. Irregular plurals (*oxen*, *children*) are listed and bypass the rule.`,
      idea: String.raw`The allomorphs are phonetically similar and complementary in distribution, so one morpheme with one underlying shape is simpler than three listed ones (the logic of 2.2). The conditioning is stated in features (2.3–2.5): [+strident] triggers epenthesis, and [−voice] triggers devoicing. Rule order matters (2.6): epenthesis must come first, otherwise *buses* would get a voiceless [s] after the strident, the way *cats* does. Other underlying forms (/s/ or /ɪz/) also derive the right output, and the choice among them rests on the simplicity of the rules, which the bars compare.`,
      caption: String.raw`Type a noun in the respelling of 2.8 (*kat*, *dog*, *bus*, *cherch*, *juj*) or choose one, and read the derivation: the underlying plural, then the rules in order, with the segments each rule changes in orange. Switch the underlying form among /z/, /s/ and /ɪz/: all three get the same surface plural for all 20 regular words in the list, but the bars show how many of the 20 words need each rule. Pick *ox*, *child*, *mouse* or *foot* to see the listed irregular form block the rule. The rule engine is the one of 2.5.`,
      deps: ['ling-3.1', 'ling-2.5'],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['allomorphy', 'plural'],
      scope: String.raw`Regular plurals of English nouns; the feature values are the simplified ones of chapter 2. The three underlying forms yield identical surface outputs here, so the choice of /z/ is an argument from rule simplicity, not from data.`,
      viz(v) {
        const inp = v.input('noun', 'kat', { width: 170, placeholder: 'respelled noun' });
        v.select('Try', PLURALS.filter((p) => ['cat','dog','bus','church','judge','dish','moth','toe','rose','ox','child','mouse','foot'].includes(p[0])).map(([w, r]) => ({ value: r, label: w })), 'kat', { onChange: (r) => inp.set(r) });
        const ur = v.select('Underlying plural', [{ value: 'z', label: '/z/' }, { value: 's', label: '/s/' }, { value: 'ɪz', label: '/ɪz/' }], 'z');
        const s = v.stage({ x: [0, 12], y: [0, 5.6], axes: false, height: 330, weight: 1.5, minWidth: 340, title: 'derivation' });
        const sb = v.stage({ x: [0, 1], y: [0, 20], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'underlying form', ylabel: 'words (of 20) a rule must change', title: 'how much work does each rule do?', xticks: [[0.17, '/z/'], [0.5, '/s/'], [0.83, '/ɪz/']] });
        const regular = PLURALS.filter((p) => !p[2]).map((p) => respell(p[1]));
        const work = {};
        for (const u of ['z', 's', 'ɪz']) {
          const cnt = PL_RULES[u].map(() => 0);
          for (const st of regular) { const rows = plurals(st, u); rows.slice(1).forEach((r, i) => { if (r.hits.length) cnt[i]++; }); }
          work[u] = cnt;
        }
        let info = null;
        v.render(() => {
          const irr = PLURALS.find((p) => p[1] === inp.value && p[2]);
          const st = respell(inp.value);
          if (!st.length) { info = null; return; }
          const rows = plurals(st, ur.value);
          const n = rows[0].w.length; const cw = Math.min(0.95, 8.4 / n);
          rows.forEach((r, i) => {
            const y = 4.7 - i * 1.25;
            s.text(r.label, 0.2, y, { size: 12.5, color: 'muted', align: 'left', baseline: 'middle' });
            if (i > 0) s.text(r.hits.length ? 'applies' : 'no site', 0.2, y - 0.45, { size: 10.5, color: r.hits.length ? 'orange' : 'faint', align: 'left', baseline: 'middle' });
            r.w.forEach((t, k) => {
              const x = 3.4 + k * cw * 1.05, ch = t.chg || t.ins;
              const suf = i === 0 ? k >= st.length : ch || (r.w.length - k <= 2 && false);
              s.rect(x, y - 0.4, x + cw, y + 0.4, { fill: ch ? 'orange' : k >= st.length && i === 0 ? 'green' : 'accent', fillAlpha: ch ? 0.4 : 0.15, color: ch ? 'orange' : k >= st.length && i === 0 ? 'green' : 'accent', width: 1.5, radius: 5 });
              s.text(t.s, x + cw / 2, y, { size: 17, color: 'ink', align: 'center', baseline: 'middle' });
            });
          });
          const surf = surfPlural(rows), last = st[st.length - 1], f = SEG[last] ? SEG[last].f : {};
          s.text(irr ? `irregular: listed plural “${irr[2]}” blocks the rule` : `surface allomorph: [${surf}]`, 3.4, 0.35, { size: 14, color: irr ? 'red' : 'green', align: 'left' });
          info = { surf, last, f, irr, st };
          const names = ['z', 's', 'ɪz'];
          names.forEach((u, i) => {
            const c = work[u], x0 = i * 0.33 + 0.02;
            PL_RULES[u].forEach((r, k) => {
              const xx = x0 + k * 0.15; sb.rect(xx, 0, xx + 0.13, c[k], { fill: k ? 'purple' : 'gold', fillAlpha: ur.value === u ? 0.55 : 0.2, color: k ? 'purple' : 'gold', width: 1.5 });
              sb.text(r.name, xx + 0.065, c[k] + 0.6, { size: 9, color: 'muted', align: 'center' });
            });
          });
          sb.setView([0, 1], [0, 22]);
        });
        v.readout(() => {
          if (!info) return 'Type a noun in the respelling.';
          const { surf, last, f, irr, st } = info;
          if (irr) return `**/${st.join('')}/ + plural → ${irr[2]}**: a listed irregular form, so the regular rule (which would give [${st.join('') + surf}]) is blocked (see 3.10).`;
          return `**/${st.join('')}/ + plural → [${st.join('') + surf}]**. Last segment /${last}/: [${f.voi === '+' ? '+' : '−'}voice], [${f.strid === '+' ? '+' : '−'}strident], so the allomorph is **[${surf}]**.\nWork for the three underlying forms (words changed by rule 1 / rule 2, of 20): /z/ ${work.z.join(' / ')}; /s/ ${work.s.join(' / ')}; /ɪz/ ${work['ɪz'].join(' / ')}.`;
        });
      },
    },
  ],
};
