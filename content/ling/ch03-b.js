// Linguistics & Language — Chapter 3: Morphology: the structure of words (items 3.6–3.10)
import { MORPH_COLOR } from './ch03.shared.js';

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

// ---------- 3.8 ----------
const PATS = [
  { n: 'C₁aC₂aC₃a', pre: '', skel: 'CVCVCV', mel: ['a'], role: 'he …ed (past, 3rd masc. sing.)' },
  { n: 'C₁āC₂iC₃', pre: '', skel: 'CVVCVC', mel: ['a', 'i'], role: 'one who …s (active participle)' },
  { n: 'C₁iC₂āC₃', pre: '', skel: 'CVCVVC', mel: ['i', 'a'], role: 'a noun' },
  { n: 'maC₁C₂ūC₃', pre: 'ma', skel: 'CCVVC', mel: ['u'], role: 'what is …ed (passive participle)' },
  { n: 'maC₁C₂aC₃a', pre: 'ma', skel: 'CCVCV', mel: ['a'], role: 'a place of …ing' },
  { n: 'C₁uC₂uC₃', pre: '', skel: 'CVCVC', mel: ['u'], role: 'a plural' },
  { n: 'C₁aC₂C₃', pre: '', skel: 'CVCC', mel: ['a'], role: 'a noun' },
];
const ROOTS = {
  ktb: { c: ['k', 't', 'b'], name: 'k-t-b “write”', att: { 0: ['kataba', 'he wrote'], 1: ['kātib', 'writer'], 2: ['kitāb', 'book'], 3: ['maktūb', 'written; a letter'], 4: ['maktaba', 'library'], 5: ['kutub', 'books'] } },
  drs: { c: ['d', 'r', 's'], name: 'd-r-s “study”', att: { 0: ['darasa', 'he studied'], 1: ['dāris', 'studying (participle)'], 4: ['madrasa', 'school'], 6: ['dars', 'lesson'] } },
};
const LONG = { a: 'ā', i: 'ī', u: 'ū' };
function buildWord(root, p) {
  const slots = []; let ci = 0, gi = -1, prevV = false; const groups = [];
  for (const ch of p.skel) {
    if (ch === 'C') { slots.push({ t: 'C', sym: root[ci], ri: ci }); ci++; prevV = false; }
    else { if (!prevV) { gi++; groups.push([]); } prevV = true; groups[gi].push(slots.length); slots.push({ t: 'V', g: gi }); }
  }
  const mel = groups.map((_, g) => p.mel[Math.min(g, p.mel.length - 1)]);
  slots.forEach((s) => { if (s.t === 'V') s.sym = mel[s.g]; });
  let word = p.pre;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (s.t === 'V') { if (groups[s.g][0] !== i) continue; word += groups[s.g].length > 1 ? LONG[s.sym] : s.sym; } else word += s.sym;
  }
  return { slots, groups, mel, word };
}

// ---------- 3.9 ----------
const REDUP = {
  id: { name: 'Tagalog: full root reduplication', rule: 'full', stems: [['isip', 'think', 'mag-isip-isip', 'to think about seriously']], sure: 'Rubino, WALS chapter27 §1: mag-isip → mag-isip-isip. The fixed verbal prefix mag- is retained; the root isip is copied.' },
  tl: { name: 'Pangasinan: partial reduplication', rule: 'CV', stems: [['too', 'man', 'totoo', 'people', 'CV'], ['baley', 'town', 'balbaley', 'towns', 'CVC'], ['manok', 'chicken', 'manomanok', 'chickens', 'CVCV']], sure: 'Rubino, WALS chapter27 §1, example1, reproducing his2001 Pangasinan dictionary p.540. Accent marks are omitted here; copy sizes vary by construction.' },
  free: { name: 'Free play', rule: 'CV', stems: [['tapa', '', '', '']], sure: '' },
};
const cvOf = (stem, rule) => {
  if (rule === 'full') return stem;
  if (rule === 'CVCV') return stem.slice(0, 4);
  const m = stem.match(rule === 'CVC' ? /^[^aeiou]*[aeiou][^aeiou]?/ : /^[^aeiou]*[aeiou]/);
  return m ? m[0] : stem;
};
const IRR_SRC = 'be:was:23970367,do:did:7781726,have:had:7279963,get:got:5363833,go:went:4972372,know:knew:4468046,come:came:3132857,think:thought:2662244,see:saw:2476595,say:said:2424483,take:took:1950902,tell:told:1865223,let:let:1750195,make:made:1739103,give:gave:1216087,mean:meant:1099659,find:found:1017117,leave:left:1009069,feel:felt:717293,win:won:708396,hear:heard:671019,keep:kept:653607,put:put:617889,meet:met:492805,run:ran:451634,bring:brought:448029,understand:understood:407458,lose:lost:386837,hold:held:355042,drink:drank:321677,break:broke:314493,speak:spoke:307905,pay:paid:297857,bite:bit:297805,eat:ate:297443,forget:forgot:294686,shoot:shot:294171,sit:sat:290849,send:sent:281467,sleep:slept:251559,fight:fought:250357,stand:stood:249940,write:wrote:233344,buy:bought:231067,become:became:223810,fall:fell:215116,deal:dealt:209554,hit:hit:209048,hurt:hurt:207314,read:read:200216,drive:drove:194606,set:set:191328,shut:shut:186359,catch:caught:184451,cut:cut:178669,wear:wore:162429,build:built:156611,hang:hung:155753,throw:threw:153793,sell:sold:149646,begin:began:149291,spend:spent:143408,sing:sang:141962,hide:hid:140111,steal:stole:133877,grow:grew:126557,lead:led:122701,blow:blew:120713,fly:flew:118370,wake:woke:108853,teach:taught:105080,ride:rode:103885,choose:chose:90816,rise:rose:74012,draw:drew:69213,lay:laid:66638,tear:tore:61661,feed:fed:60309,quit:quit:57416,cost:cost:54561,strike:struck:54529,dig:dug:47073,shake:shook:45784,swim:swam:37524,spread:spread:33647,split:split:31370,seek:sought:29713,shine:shone:26762,cast:cast:23987,swing:swung:22779,sink:sank:22256,spin:spun:20370,bind:bound:19799,bend:bent:18730,lend:lent:17089,sweep:swept:14563,slide:slid:14531,creep:crept:12875,burst:burst:11950,weep:wept:8543,shrink:shrank:8121';
const REG_SRC = 'die:422718,want:2574969,look:1999272,need:1250687,talk:990094,love:988365,call:984393,work:974943,try:775878,help:766833,wait:763684,happen:739643,stop:671969,ask:643692,kill:639929,use:598633,live:566731,start:507753,believe:454507,show:446409,move:440445,listen:426176,stay:425967,miss:416580,remember:384948,play:380480,turn:379636,care:374052,change:320653,open:315455,worry:313002,watch:303191,hope:287486,seem:276144,laugh:267918,guess:266009,close:247611,walk:245535,marry:244382,check:239287,excuse:229690,plan:213468,save:212881,order:200933,pick:193300,answer:179803,wish:171670,follow:170247,rest:168541,trust:163840,pull:149625,pass:142147,dance:140526,drop:138743,cry:136914,wonder:135879,clean:116211,land:115465,kiss:103683,allow:97481,join:93026,count:92290,lock:90259,mark:89045,fix:88791,share:83543,push:82746,visit:82129,reach:78259,shop:77573,jump:74908,cook:70275,smile:64319,fill:63770,add:43128';

// ---------- 3.10: verb counts from a published frequency list (see the caption) ----------
const IRR = IRR_SRC.split(',').map((x) => { const [w, past, f] = x.split(':'); return { w, past, f: +f, irr: true }; });
const REG = REG_SRC.split(',').map((x) => { const [w, f] = x.split(':'); return { w, past: w + (w.endsWith('e') ? 'd' : 'ed'), f: +f, irr: false }; });
const ALLV = [...IRR, ...REG].sort((a, b) => b.f - a.f); ALLV.forEach((d, i) => { d.rank = i + 1; });
const DISP = ALLV.filter((d) => d.f >= 150000);
const HALF = ['be', 'go', 'think', 'give', 'break', 'fight', 'sleep', 'dig', 'weep', 'shrink'];

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
    {
      num: '3.8',
      kind: 'Concept',
      name: 'Roots and templates: nonconcatenative morphology',
      credit: 'McCarthy, 1981 (autosegmental analysis of root-and-pattern morphology)',
      statement: String.raw`In **nonconcatenative** morphology a word is not built by stringing affixes onto a root. In Arabic and other Semitic languages a **root** of consonants (usually three) carries a core meaning (*k-t-b*, “writing”) and is interleaved with a **pattern**: a template of consonant and vowel slots plus a vowel melody (and sometimes prefixes). One root combined with different patterns gives a family of related words: *katab-a* “he wrote”, *kātib* “writer”, *kitāb* “book”, *maktūb* “written”, *maktab-a* “library”, *kutub* “books”.`,
      idea: String.raw`McCarthy's analysis puts the pieces on separate **tiers**: the consonantal root, the CV skeleton and the vowel melody. Association lines link root consonants to C slots and melody vowels to V slots, left to right, and a vowel that has slots left over **spreads** to them (the single *a* of *kataba*). A long vowel is one vowel linked to two V slots. Roots and patterns are both morphemes and neither is a contiguous string, which is why the concatenative cut of 3.1 does not apply to them.`,
      caption: String.raw`Pick a root (or type three consonants) and a pattern, on the right, and watch the three tiers link up: root consonants (blue) to C slots, vowels (green) to V slots, the prefix *ma-* (orange) outside the template. The list gives the word each pattern builds from this root and flags the ones that are real words (checked against Wiktionary for *kātib*, *kutub*, *maktūb*, *darasa*, *dāris*, *dars*; *kitāb*, *maktaba*, *madrasa* from standard usage) and the ones that are only possible forms. Transliteration follows common usage with macrons for long vowels.`,
      deps: ['ling-3.1'],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['root and pattern', 'Arabic'],
      verify: true,
      scope: String.raw`Modern Standard Arabic, simplified: the form classes (binyanim) of verbs, vowel deletion, assimilation and the plural system are far richer than the seven patterns shown. A pattern is a tendency of meaning, not a guarantee.`,
      viz(v) {
        const rootSel = v.select('Root', [{ value: 'ktb', label: 'k-t-b “write”' }, { value: 'drs', label: 'd-r-s “study”' }], 'ktb', { onChange: (r) => inp.set(r) });
        const inp = v.input('or type a root', 'ktb', { width: 110, placeholder: 'three consonants' });
        let pi = 0;
        const s = v.stage({ x: [0, 12], y: [0, 7], axes: false, height: 360, weight: 1.35, minWidth: 340, title: 'tiers' });
        const sl = v.stage({ x: [0, 10], y: [0, 7], axes: false, height: 360, weight: 1, minWidth: 280, title: 'one root, many words (click one)' });
        sl.onClick((x, y) => { const k = Math.round((6.2 - y) / 0.85); if (k >= 0 && k < PATS.length) pi = k; });
        let cur = null;
        const rootOf = () => { const t = inp.value.toLowerCase().replace(/[^a-zʕʔšḥṣṭḍẓġḵ]/g, ''); return t.length === 3 ? t.split('') : null; };
        v.render(() => {
          const rc = rootOf();
          const known = ROOTS[rc ? rc.join('') : ''];
          if (!rc) { s.text('type three consonants, e.g. ktb', 6, 3.5, { size: 15, color: 'muted', align: 'center' }); cur = null; return; }
          PATS.forEach((p, k) => {
            const w = buildWord(rc, p), a = known && known.att[k], y = 6.2 - k * 0.85;
            sl.rect(0.2, y - 0.36, 9.8, y + 0.36, { fill: k === pi ? 'gold' : null, fillAlpha: 0.22, color: k === pi ? 'gold' : 'grid', width: k === pi ? 2 : 1, radius: 6 });
            sl.text(p.n, 0.45, y, { size: 12, color: 'muted', align: 'left', baseline: 'middle' });
            sl.text(w.word, 3.1, y, { size: 17, color: a ? 'ink' : 'faint', align: 'left', baseline: 'middle' });
            sl.text(a ? `“${a[1]}”` : known ? 'possible form' : '', 5.5, y, { size: 11.5, color: a ? 'green' : 'faint', align: 'left', baseline: 'middle' });
          });
          const p = PATS[pi], B = buildWord(rc, p);
          const n = B.slots.length + (p.pre ? 1 : 0), x0 = 3.3, dx = Math.min(1.5, 8.3 / n);
          const xs = (i) => x0 + (i + (p.pre ? 1 : 0)) * dx + dx / 2, YR = 5.0, YS = 3.2, YM = 1.4;
          s.text('root', 0.2, YR, { size: 13, color: 'accent', align: 'left', baseline: 'middle' });
          s.text('skeleton', 0.2, YS, { size: 13, color: 'muted', align: 'left', baseline: 'middle' });
          s.text('vowels', 0.2, YM, { size: 13, color: 'green', align: 'left', baseline: 'middle' });
          if (p.pre) { s.rect(x0 + 0.1, YS - 0.4, x0 + dx - 0.1, YS + 0.4, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.8, radius: 6 }); s.text(p.pre, x0 + dx / 2, YS, { size: 17, color: 'ink', align: 'center', baseline: 'middle' }); s.text('prefix', x0 + dx / 2, YS - 0.65, { size: 10.5, color: 'orange', align: 'center' }); }
          const cx = [], cs = B.slots.map((q, i) => (q.t === 'C' ? i : -1)).filter((i) => i >= 0);
          B.slots.forEach((q, i) => {
            const x = xs(i); s.rect(x - dx * 0.4, YS - 0.4, x + dx * 0.4, YS + 0.4, { fill: q.t === 'C' ? 'accent' : 'green', fillAlpha: 0.14, color: q.t === 'C' ? 'accent' : 'green', width: 1.5, radius: 6 });
            s.text(q.t, x, YS, { size: 15, color: 'muted', align: 'center', baseline: 'middle' });
          });
          cs.forEach((i, k) => {
            const xr = x0 + (p.pre ? dx : 0) + (k + 0.5) * ((n - (p.pre ? 1 : 0)) * dx / 3);
            s.rect(xr - 0.4, YR - 0.4, xr + 0.4, YR + 0.4, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.8, radius: 6 });
            s.text(rc[k], xr, YR, { size: 19, color: 'ink', align: 'center', baseline: 'middle' });
            s.line(xr, YR - 0.4, xs(i), YS + 0.4, { color: 'accent', width: 1.8 });
          });
          B.groups.forEach((g, gi) => {
            const xm = (xs(g[0]) + xs(g[g.length - 1])) / 2;
            s.rect(xm - 0.4, YM - 0.4, xm + 0.4, YM + 0.4, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.8, radius: 6 });
            s.text(B.mel[gi], xm, YM, { size: 19, color: 'ink', align: 'center', baseline: 'middle' });
            g.forEach((i) => s.line(xm, YM + 0.4, xs(i), YS - 0.4, { color: 'green', width: 1.8 }));
          });
          s.text(B.word, 9.9, 6.3, { size: 32, color: 'ink', align: 'right', baseline: 'middle' });
          s.text(p.role, 9.9, 5.8, { size: 11, color: 'muted', align: 'right', baseline: 'top' });
          cur = { rc, B, p, a: known && known.att[pi], known };
        });
        v.readout(() => {
          if (!cur) return 'Type three consonants for the root.';
          const { rc, B, p, a, known } = cur, nAtt = known ? Object.keys(known.att).length : 0;
          return `**${rc.join('-')}** + **${p.n}** → **${B.word}**${a ? `, “${a[1]}”` : known ? ' (a possible form, not in my checked list)' : ''}.\n${known ? `${nAtt} of the ${PATS.length} patterns give attested words for this root in my list.` : 'For roots outside the list the forms are only what the template predicts.'}`;
        });
      },
    },
    {
      num: '3.9',
      kind: 'Concept',
      name: 'Reduplication',
      credit: 'Typological counts: Rubino, WALS chapter 27',
      statement: String.raw`**Reduplication** builds a word or form by copying part or all of the base. In **full** reduplication the whole stem is repeated (Tagalog root *isip* in *mag-isip* “think” → *mag-isip-isip* “think about seriously”); in **partial** reduplication only a piece is copied, such as the first consonant and vowel (Pangasinan *toó* “man” → *totóo* “people”). The copy is a morpheme without fixed sounds: it takes its form from the base. Meanings include plurality, repetition, intensity, diminution and, in Tagalog, aspect. In the WALS sample of 368 languages (Rubino), 278 have both productive full and partial reduplication, 35 only full reduplication, and 55 no productive reduplication.`,
      idea: String.raw`Reduplication is a morphological operation on the base's sounds, so it needs a stem and a rule of copying such as "copy the initial CV and prefix it". Its form can be stated as a template, as in 3.8, with the base supplying the segments. The meanings are often iconic (more form for more meaning: many, repeated, intense) and the same device appears in unrelated families, which is why it is one of the most widespread morphological processes.`,
      caption: String.raw`Choose a language and a stem: the copied part is orange with an arrow from the root, and the attested result appears with its meaning. Tagalog’s fixed prefix mag- is retained outside the copied root. Pangasinan illustrates CV, CVC and CVCV copies. All lexical forms and glosses are from Rubino’s complete WALS chapter27, §1; Pangasinan accent marks are omitted in the interactive spelling. Free play applies abstract orthographic rules to any input and does not assert that its results are words. The bars give the chapter’s complete368-language counts.`,
      deps: ['ling-3.1'],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['reduplication', 'typology'],
      scope: String.raw`The source distinguishes full root, stem and word reduplication; these are different domains. The demo copies orthographic roots and omits phonological detail. Meanings depend on the language and construction; more form need not mean plurality or intensity.`,
      viz(v) {
        const lang = v.select('Language', Object.entries(REDUP).map(([k, L]) => ({ value: k, label: L.name })), 'id');
        const stemTl = v.select('Stem', REDUP.tl.stems.map((x) => ({ value: x[0], label: x[0] })), 'too');
        const stemId = v.select('Stem', REDUP.id.stems.map((x) => ({ value: x[0], label: x[0] })), 'isip');
        const inp = v.input('stem', 'tapa', { width: 130 });
        const ruleSel = v.select('Rule', [{ value: 'full', label: 'full' }, { value: 'CV', label: 'first CV' }, { value: 'CVC', label: 'first CVC' }], 'CV');
        const s = v.stage({ x: [0, 12], y: [0, 6], axes: false, height: 300, weight: 1.4, minWidth: 340, title: 'copy' });
        const sb = v.stage({ x: [0, 4], y: [0, 300], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xlabel: '', ylabel: 'languages (of 368)', xticks: [[0.7, 'full + partial'], [2, 'full only'], [3.3, 'none']], title: 'reduplication in WALS ch. 27' });
        let cur = null;
        v.render(() => {
          const L = REDUP[lang.value];
          const stemSel = lang.value === 'id' ? stemId : stemTl;
          stemTl.el.hidden = lang.value !== 'tl'; stemId.el.hidden = lang.value !== 'id'; inp.el.hidden = lang.value !== 'free'; ruleSel.el.hidden = lang.value !== 'free';
          let stem, rule, gloss = '', meaning = '', cat = null;
          if (lang.value === 'free') { stem = inp.value.toLowerCase().replace(/[^a-z]/g, '') || 'tapa'; rule = ruleSel.value; }
          else {
            const row = L.stems.find((x) => x[0] === stemSel.value) || L.stems[0]; stem = row[0]; rule = row[4] || L.rule; gloss = row[1]; meaning = row[3]; cat = row;
          }
          const copy = cvOf(stem, rule), out = cat ? cat[2] : rule === 'full' ? `${stem}-${copy}` : `${copy}${stem}`;
          const wd = (t) => Math.max(1.3, 0.55 * t.length + 0.5);
          const xS = 6.4 - wd(stem) / 2 - (rule === 'full' ? 0 : 0), yT = 4.7, yO = 2.2;
          s.rect(xS, yT - 0.5, xS + wd(stem), yT + 0.5, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 2, radius: 8 });
          s.text(stem, xS + wd(stem) / 2, yT, { size: 20, color: 'ink', align: 'center', baseline: 'middle' }); s.text('stem' + (gloss ? ` “${gloss}”` : ''), xS + wd(stem) / 2, yT + 0.65, { size: 11.5, color: 'muted', align: 'center' });
          const total = wd(stem) + wd(copy) + 0.2, xO = 6 - total / 2;
          const first = rule === 'full' ? stem : copy, second = rule === 'full' ? copy : stem;
          const a = { t: first, c: rule === 'full' ? 'accent' : 'orange' }, b = { t: second, c: rule === 'full' ? 'orange' : 'accent' };
          s.rect(xO, yO - 0.5, xO + wd(a.t), yO + 0.5, { fill: a.c, fillAlpha: 0.25, color: a.c, width: 2, radius: 8 });
          s.text(a.t, xO + wd(a.t) / 2, yO, { size: 20, color: 'ink', align: 'center', baseline: 'middle' });
          s.rect(xO + wd(a.t) + 0.2, yO - 0.5, xO + total, yO + 0.5, { fill: b.c, fillAlpha: 0.25, color: b.c, width: 2, radius: 8 });
          s.text(b.t, xO + wd(a.t) + 0.2 + wd(b.t) / 2, yO, { size: 20, color: 'ink', align: 'center', baseline: 'middle' });
          const xc = rule === 'full' ? xO + wd(a.t) + 0.2 + wd(b.t) / 2 : xO + wd(a.t) / 2;
          s.arrow(xS + wd(stem) / 2, yT - 0.55, xc, yO + 0.55, { color: 'orange', width: 2 });
          s.text('copy', (xS + wd(stem) / 2 + xc) / 2 + 0.3, 3.45, { size: 12, color: 'orange', align: 'left' });
          s.text(out, 6, 0.85, { size: 24, color: 'ink', align: 'center', baseline: 'middle' });
          if (meaning) s.text(`“${meaning}”`, 6, 0.2, { size: 12.5, color: 'muted', align: 'center', baseline: 'bottom' });
          [[278, 'accent'], [35, 'orange'], [55, 'muted']].forEach(([n, c], i) => { const x = 0.7 + i * 1.3; sb.rect(x - 0.45, 0, x + 0.45, n, { fill: c, fillAlpha: 0.35, color: c, width: 1.8 }); sb.text(String(n), x, n + 12, { size: 12.5, color: 'ink', align: 'center' }); });
          cur = { stem, copy, out, rule, meaning, cat, L };
        });
        v.readout(() => `**${cur.stem}** → **${cur.out}**: the ${cur.rule === 'full' ? 'whole stem' : cur.rule === 'CV' ? 'first consonant + vowel' : cur.rule === 'CVCV' ? 'first CVCV' : 'first consonant + vowel + consonant'} (**${cur.copy}**) is copied${cur.meaning ? `; the form means “${cur.meaning}”` : ''}.${cur.L.sure ? `\n${cur.L.sure}` : ''}`);
      },
    },
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Irregular forms and blocking',
      credit: 'Blocking: Aronoff, 1976; frequency law: Lieberman et al., 2007',
      statement: String.raw`English has a regular way of making the past tense (add *-ed*) and a few hundred verbs that use a stored irregular form instead (*go* → *went*). Two regularities govern the irregulars. **Blocking**: if a word has a listed form for a grammatical slot, it pre-empts the regular rule for that slot, which is why *went* blocks the regular form (*goed*, not English) and *glory* blocks *gloriosity*. **Frequency**: irregular forms survive among the most frequent verbs, since only frequently heard forms are learned reliably, and rarer irregulars tend to be regularised over the centuries. Lieberman et al. (2007) found that the half-life of an irregular verb grows with the square root of its frequency, so a verb used 100 times less often is regularised about 10 times faster.`,
      idea: String.raw`A speaker stores the past forms she has heard often enough and applies the rule to anything else (3.5, 3.7). Retrieval of a stored form is faster than the rule when the form is strong, and a strong enough form blocks the rule; a rare irregular is stored weakly and gets overtaken by the regular output. The verbs that remain irregular are therefore the ones that are strong in memory, which are the frequent ones. Children's *goed* (10.5) is the same competition seen early, when the stored form is not yet strong.`,
      caption: String.raw`Left: the English verbs of my list that occur at least 150 000 times in the word list, ordered by frequency (rank on the horizontal axis), irregular verbs in red and common regular verbs in blue (below that frequency my list of regular verbs is far from complete, so the tail is not drawn, and ambiguous words such as *like*, *please* and *thank* were left out); drag the slider to take the $N$ most frequent and read the share of irregulars (the head of the list is dominated by them; the tail of my list is not trustworthy). Right: relative regularisation time (the square root of the frequency, relative to *shrink*) for ten irregulars. Pick a verb and toggle the stored past form on and off to see blocking: with the form, *go* gives *went*; without it, the regular rule yields the non-English *goed*. **Data**: counts are summed over the verb's base, *-s*, *-ing* and past forms in the OpenSubtitles 2018 English word list (FrequencyWords by H. Hermit Dave, CC BY-SA 4.0), so they include noun uses (*work*, *set*) and I assembled the list of regular verbs by hand, so read the shares as approximate and the trend as the point.`,
      deps: ['ling-3.7'],
      refs: ['Fromkin et al. ch. 2'],
      tags: ['irregular verbs', 'blocking', 'frequency'],
      verify: true,
      scope: String.raw`The square-root law is an empirical fit by Lieberman et al. for 177 Old English irregular verbs (I quote it from the paper's summary and press reports; 145 remained irregular in Middle English and 98 still are, reported secondhand); the relative values drawn here apply it to counts from a different corpus (subtitles) and are only a scaling illustration.`,
      viz(v) {
        const N = v.slider('the N most frequent verbs', 5, DISP.length, 30, { int: true });
        const pick = v.select('Verb', HALF.map((w) => ({ value: w, label: w })), 'go');
        const stored = v.toggle('stored past form', true);
        const s = v.stage({ x: [1, DISP.length + 1], y: [5, 7.5], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 320, xlabel: 'frequency rank among these verbs', ylabel: 'occurrences (log₁₀)', yticks: [[5, '10⁵'], [6, '10⁶'], [7, '10⁷']], title: 'which verbs are irregular?' });
        const sb = v.stage({ x: [0, HALF.length], y: [0, 60], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: '', ylabel: 'time to regularise, relative to shrink', title: 'rarer irregulars regularise sooner (model)', xticks: HALF.map((w, i) => [i + 0.5, w]) });
        v.legend([['red', 'irregular'], ['accent', 'regular']]);
        const fmin = ALLV.find((d) => d.w === 'shrink').f;
        v.render(() => {
          const n = N.value;
          s.rect(1, 5, n + 0.5, 7.5, { fill: 'gold', fillAlpha: 0.1, color: 'gold', width: 1 }); s.vline(n + 0.5, { color: 'gold', width: 2 });
          for (const d of DISP) { const y = Math.log10(d.f), sel = d.w === pick.value; s.dot(d.rank, y, { r: sel ? 6.5 : 4, color: d.irr ? 'red' : 'accent', fill: d.irr ? 'red' : 'accent', ...(sel ? { label: d.w, labelPos: 'ne' } : {}) }); }
          HALF.forEach((w, i) => { const d = ALLV.find((q) => q.w === w), r = Math.sqrt(d.f / fmin), sel = w === pick.value; sb.rect(i + 0.12, 0, i + 0.88, r, { fill: sel ? 'gold' : 'red', fillAlpha: sel ? 0.5 : 0.28, color: sel ? 'gold' : 'red', width: 1.6 }); sb.text(r >= 10 ? String(Math.round(r)) : v.fix(r, 1), i + 0.5, r + 3, { size: 11, color: 'ink', align: 'center' }); });
        });
        v.readout(() => {
          const n = N.value, top = DISP.slice(0, n), ir = top.filter((d) => d.irr).length;
          const d = ALLV.find((q) => q.w === pick.value), r = Math.sqrt(d.f / fmin);
          const form = stored.value ? `${d.w} + past → **${d.past}** (the stored form blocks the rule)` : `${d.w} + past → **${d.w}${d.w.endsWith('e') ? 'd' : 'ed'}** (no stored form, so the regular rule applies; not English)`;
          return `Among the ${n} most frequent verbs in this list, **${ir}** (${Math.round((100 * ir) / n)}%) are irregular (an upper estimate: regular verbs missing from my list would lower it); in the first ten it is ${DISP.slice(0, 10).filter((d) => d.irr).length} of 10.\n${form}. Occurrences of ${d.w}: ${d.f.toLocaleString('en')}; a square-root law puts its regularisation time at about **${v.fix(r, 0)}×** that of *shrink*.`;
        });
      },
    },
  ],
};
