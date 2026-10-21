// Linguistics & Language — Chapter 2: Phonology: sound systems (items 2.10–2.13)
import { SEG, sonority, SON_NAMES, respell, syllabify, sylText, isVowel, clamp } from './ch02.shared.js';

// ---------- 2.10 ----------
const SSP_WORDS = [['plant', 'plant'], ['strengkths', 'strengths'], ['siksths', 'sixths'], ['sprints', 'sprints'], ['apt', 'apt'], ['bnik', 'bnick'], ['lemuhn', 'lemon']];
const SON_SHORT = { 1: 'voiceless stop', 2: 'voiced stop', 3: 'voiceless fricative', 4: 'voiced fricative', 5: 'nasal', 6: 'lateral', 7: 'rhotic', 8: 'glide', 9: 'high vowel', 10: 'mid vowel', 11: 'low vowel' };
const isCorObs = (s) => SEG[s] && SEG[s].f.cor === '+' && SEG[s].f.son === '-' && SEG[s].f.syl === '-';

// ---------- 2.11: a small parametric metrical model (the weights come from syllable shape) ----------
const DIPH = new Set(['aɪ', 'aʊ', 'eɪ', 'oʊ', 'ɔɪ', 'ʌɪ']);
const sylParts = (str) => (str.match(/tʃ|dʒ|aɪ|aʊ|eɪ|oʊ|ɔɪ|./gu) || []);
const weightOf = (str) => { const t = sylParts(str); const i = t.findIndex((x) => isVowel(x)); return i >= 0 && (i < t.length - 1 || DIPH.has(t[i])) ? 'H' : 'L'; };
const MWORDS = [
  { w: 'photograph', syl: 'foʊ.tə.græf', att: [1, 0, 2], members: [[0, 1], [2]], note: 'a compound of photo- and -graph' },
  { w: 'photographer', syl: 'fə.tɑg.ɹə.fɚ', att: [0, 1, 0, 0] },
  { w: 'photographic', syl: 'foʊ.tə.græf.ɪk', att: [2, 0, 1, 0] },
  { w: 'photography', syl: 'fə.tɑg.ɹə.fi', att: [0, 1, 0, 0] },
  { w: 'agenda', syl: 'ə.dʒɛn.də', att: [0, 1, 0] },
  { w: 'America', syl: 'ə.mɛ.ɹɪ.kə', att: [0, 1, 0, 0] },
  { w: 'Canada', syl: 'kæ.nə.də', att: [1, 0, 0] },
  { w: 'horizon', syl: 'hə.ɹaɪ.zən', att: [0, 1, 0] },
  { w: 'elephant', syl: 'ɛ.lə.fənt', att: [1, 0, 0] },
  { w: 'banana', syl: 'bə.næ.nə', att: [0, 1, 0] },
];
MWORDS.forEach((m) => { m.sy = m.syl.split('.'); m.wt = m.sy.map(weightOf); });
/** Build feet over syllable weights wt ('H' | 'L') under parameters P and return {feet, ex, heads, main, pat}. */
function metrical(wt, P) {
  const n = wt.length, ex = P.extra && n > 1, lo = 0, hi = ex ? n - 2 : n - 1, used = new Array(n).fill(false), feet = [];
  const step = P.dir === 'R' ? -1 : 1; let i = P.dir === 'R' ? hi : lo;
  while (i >= lo && i <= hi) {
    const k = i + step, hasN = k >= lo && k <= hi && !used[k]; let foot = null;
    if (P.qs) {
      if (P.foot === 'T') { if (wt[i] === 'H') foot = [i]; else if (hasN && wt[i] === 'L' && wt[k] === 'L') foot = [i, k]; }
      else if (P.dir === 'R') { if (hasN && wt[k] === 'L') foot = [k, i]; else if (wt[i] === 'H') foot = [i]; }
      else if (hasN && wt[i] === 'L') foot = [i, k]; else if (wt[i] === 'H') foot = [i];
    } else if (hasN) foot = [i, k];
    if (foot) { foot.sort((a, b) => a - b); foot.forEach((q) => { used[q] = true; }); feet.push(foot); i = (P.dir === 'R' ? foot[0] : foot[foot.length - 1]) + step; } else i += step;
  }
  let degenerate = false;
  if (!feet.length) { feet.push([P.main === 'L' ? lo : hi]); degenerate = true; }
  feet.sort((a, b) => a[0] - b[0]);
  const head = (f) => (f.length === 1 ? f[0] : P.foot === 'T' ? f[0] : f[1]);
  const heads = feet.map(head), main = P.main === 'L' ? heads[0] : heads[heads.length - 1];
  const pat = new Array(n).fill(0); heads.forEach((h) => { pat[h] = 2; }); pat[main] = 1;
  return { feet, ex, heads, main, pat, degenerate };
}
function predictStress(m, P, compound) {
  if (m.members && compound) {
    const out = new Array(m.wt.length).fill(0);
    m.members.forEach((mem, k) => { const r = metrical(mem.map((i) => m.wt[i]), { ...P, extra: P.extra && mem.length > 1 }); r.pat.forEach((x, j) => { out[mem[j]] = k === 0 ? x : x === 1 ? 2 : 0; }); });
    return { pat: out, feet: null, ex: false };
  }
  return metrical(m.wt, P);
}

// ---------- 2.12: Turkish ----------
const TV = { i: { b: 0, r: 0, h: 1 }, e: { b: 0, r: 0, h: 0 }, ü: { b: 0, r: 1, h: 1 }, ö: { b: 0, r: 1, h: 0 }, ı: { b: 1, r: 0, h: 1 }, a: { b: 1, r: 0, h: 0 }, u: { b: 1, r: 1, h: 1 }, o: { b: 1, r: 1, h: 0 } };
const TV_POS = { i: [0, 1], ü: [1, 1], ı: [2, 1], u: [3, 1], e: [0, 0], ö: [1, 0], a: [2, 0], o: [3, 0] };
const TURK = ['ev', 'el', 'kız', 'kol', 'gül', 'göz', 'son', 'ip', 'adam', 'kalem', 'saat', 'rol'];
const GLOSS = { ev: 'house', el: 'hand', kız: 'girl', kol: 'arm', gül: 'rose', göz: 'eye', son: 'end', ip: 'rope', adam: 'man', kalem: 'pen', saat: 'hour, clock', rol: 'role' };
const SOFT = new Set(['saat', 'rol']); // stems whose suffixes take front vowels although the last vowel is back (a back vowel followed by a "light" l, or a long a)
const VOICELESS = new Set(['p', 'ç', 'f', 'h', 'k', 's', 'ş', 't']);
const vowelBR = (b, r) => Object.keys(TV).find((k) => TV[k].b === b && TV[k].r === r && TV[k].h === 1);
const isTV = (c) => !!TV[c];
/** Build the suffixed word: returns letters with roles. */
function turkish(stem, plural, kase) {
  const L = [...stem].map((c) => ({ c, v: isTV(c), part: 'stem' }));
  const lastV = () => [...L].reverse().find((x) => x.v);
  let prev = lastV(); let b = SOFT.has(stem) ? 0 : TV[prev.c].b, soft = SOFT.has(stem);
  const chain = [];
  if (plural) chain.push({ name: '-lAr', pre: 'l', type: 'A', post: 'r' });
  if (kase === 'gen') chain.push({ name: '-In', pre: '', type: 'I', post: 'n' });
  if (kase === 'abl') chain.push({ name: '-dAn', pre: 'd', type: 'A', post: 'n' });
  let last = prev.c, lastRound = TV[prev.c].r;
  const suff = [];
  for (const s of chain) {
    let pre = s.pre;
    if (pre === 'd' && VOICELESS.has(L[L.length - 1].c)) pre = 't';
    if (pre) L.push({ c: pre, v: false, part: s.name });
    const v = s.type === 'A' ? (b ? 'a' : 'e') : vowelBR(b, lastRound);
    L.push({ c: v, v: true, part: s.name, type: s.type, from: L.filter((x) => x.v).length - 1 });
    if (s.post) L.push({ c: s.post, v: false, part: s.name });
    lastRound = TV[v].r; suff.push(s.name);
  }
  return { L, soft, b };
}

// ---------- 2.13: Optimality Theory ----------
const CONS = ['ONSET', 'NOCODA', '*COMPLEX', 'MAX', 'DEP'];
const CONS_GLOSS = { ONSET: 'every syllable has an onset', NOCODA: 'no syllable has a coda', '*COMPLEX': 'no cluster in an onset or coda', MAX: 'do not delete input segments', DEP: 'do not insert segments' };
// candidates: syllables as [onset, nucleus, coda] strings; del = deleted input segments, ins = inserted segments
const OT_INPUTS = {
  tak: { name: '/tak/', cands: [{ s: [['t', 'a', 'k']] }, { s: [['t', 'a', ''], ['k', 'u', '']], ins: 1 }, { s: [['t', 'a', '']], del: 1 }, { s: [['t', 'a', ''], ['ʔ', 'a', '']], ins: 2 }] },
  ata: { name: '/ata/', cands: [{ s: [['', 'a', ''], ['t', 'a', '']] }, { s: [['ʔ', 'a', ''], ['t', 'a', '']], ins: 1 }, { s: [['t', 'a', '']], del: 1 }] },
  apta: { name: '/apta/', cands: [{ s: [['', 'a', 'p'], ['t', 'a', '']] }, { s: [['', 'a', ''], ['p', 'u', ''], ['t', 'a', '']], ins: 1 }, { s: [['ʔ', 'a', ''], ['p', 'u', ''], ['t', 'a', '']], ins: 2 }, { s: [['ʔ', 'a', 'p'], ['t', 'a', '']], ins: 1 }, { s: [['', 'a', ''], ['pt', 'a', '']] }, { s: [['', 'a', ''], ['t', 'a', '']], del: 1 }, { s: [['t', 'a', '']], del: 2 }] },
  stak: { name: '/stak/', cands: [{ s: [['st', 'a', 'k']] }, { s: [['s', 'u', ''], ['t', 'a', ''], ['k', 'u', '']], ins: 2 }, { s: [['st', 'a', ''], ['k', 'u', '']], ins: 1 }, { s: [['t', 'a', 'k']], del: 1 }, { s: [['t', 'a', '']], del: 2 }] },
};
for (const k in OT_INPUTS) OT_INPUTS[k].cands.forEach((c) => {
  c.del = c.del || 0; c.ins = c.ins || 0; c.form = c.s.map((y) => y.join('')).join('.');
  c.v = { ONSET: c.s.filter((y) => !y[0]).length, NOCODA: c.s.reduce((a, y) => a + y[2].length, 0), '*COMPLEX': c.s.reduce((a, y) => a + (y[0].length > 1 ? 1 : 0) + (y[2].length > 1 ? 1 : 0), 0), MAX: c.del, DEP: c.ins };
});
const OT_RANK = {
  faith: { name: 'faithful', r: ['MAX', 'DEP', 'ONSET', 'NOCODA', '*COMPLEX'], lead: 'Faithfulness outranks the markedness constraints: the input surfaces unchanged (as in English).' },
  epen: { name: 'epenthesising', r: ['*COMPLEX', 'NOCODA', 'MAX', 'DEP', 'ONSET'], lead: 'Markedness outranks MAX and MAX outranks DEP: vowels are inserted rather than sounds deleted (as in Japanese loanwords).' },
  del: { name: 'deleting', r: ['*COMPLEX', 'NOCODA', 'ONSET', 'DEP', 'MAX'], lead: 'DEP outranks MAX: the grammar would rather lose a sound than insert one.' },
  glot: { name: 'onset-driven', r: ['ONSET', '*COMPLEX', 'NOCODA', 'MAX', 'DEP'], lead: 'ONSET is on top: a consonant (here a glottal stop) is inserted before a bare vowel, as German does before a stressed vowel-initial syllable.' },
};
function otEval(cands, rank) {
  let alive = cands.map((_, i) => i); const fatal = new Array(cands.length).fill(-1);
  rank.forEach((c, ci) => {
    const m = Math.min(...alive.map((i) => cands[i].v[c]));
    const next = alive.filter((i) => cands[i].v[c] === m);
    alive.forEach((i) => { if (!next.includes(i) && fatal[i] < 0) fatal[i] = ci; });
    alive = next;
  });
  return { winner: alive[0], fatal, ties: alive };
}
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));

export default {
  collection: 'ling',
  chapter: 2,
  items: [
    {
      num: '2.10',
      kind: 'Principle',
      name: 'The sonority sequencing principle',
      credit: 'Sievers, 1881; Jespersen, 1904; Selkirk, 1984',
      statement: String.raw`Segments can be ranked on a **sonority scale** (roughly their loudness and openness: stops < fricatives < nasals < liquids < glides < vowels). The **sonority sequencing principle** (SSP) says that within a syllable sonority rises from the edge of the onset to a peak at the nucleus and falls toward the edge of the coda. Sequences that obey it (*plant*: $p<l<a>n>t$) are common across languages; sequences that break it (*apt*, *sixths*) are rarer and often handled as special cases such as an extrasyllabic /s/ or coronal appendix.`,
      idea: String.raw`Sonority is a phonetic quantity (the acoustic intensity and the freedom of airflow through the tract), and a listener finds a syllable most easily when its energy swells to the nucleus and decays again. So the syllable boundary and the legal onsets of 2.8 and 2.9 are largely predictable: given a cluster between vowels, the SSP says where the peaks and valleys of sonority are. English *str-* breaks the principle on its face (/s/ is more sonorous than /t/), which is why analyses treat the first /s/ as an appendix attached outside the syllable proper.`,
      caption: String.raw`Type a word in the respelling of 2.8 or pick one. The line plots the sonority of each segment (the scale is on the left); a syllable's onset is orange, its nucleus blue and its coda purple. A **green** step obeys the principle (rise in the onset, fall in the coda), a **red** one violates it (a level or reverse step). Turn on the **appendix** switch to set aside an initial s + stop and final coronal obstruents, the standard repair for *strengths* and *sixths*.`,
      deps: ['ling-2.9'],
      refs: ['Ladefoged & Johnson'],
      tags: ['sonority', 'syllables'],
      scope: String.raw`The scale used here has 11 levels (voiceless stop 1 … low vowel 11); published scales differ in details (e.g. where flaps, voiced fricatives and rhotics fall).`,
      viz(v) {
        const inp = v.input('word', 'strengkths', { width: 160 });
        const pre = v.select('Try', SSP_WORDS.map(([w, l]) => ({ value: w, label: l })), 'strengkths', { onChange: (w) => inp.set(w) });
        const app = v.toggle('appendix: set aside initial s + stop and final coronal obstruents', false);
        const s = v.stage({ x: [-4, 9], y: [0, 12.3], axes: false, height: 380, full: true });
        let C = null;
        const analyse = () => {
          const syms = respell(inp.value), sy = syllabify(syms, 'onset'), son = syms.map(sonority);
          // role of each segment and the steps inside onsets and codas
          const roles = [], steps = []; let pos = 0;
          sy.forEach((y, si) => {
            const on = [], co = [];
            y.on.forEach(() => { roles.push('on'); on.push(pos++); }); y.nu.forEach(() => { roles.push('nu'); pos++; }); y.co.forEach(() => { roles.push('co'); co.push(pos++); });
            let apO = 0, apC = 0;
            if (app.value && on.length >= 2 && syms[on[0]] === 's' && son[on[1]] <= 2) apO = 1;
            if (app.value && si === sy.length - 1) { while (co.length - apC > 1 && isCorObs(syms[co[co.length - 1 - apC]])) apC++; }
            for (let k = 0; k + 1 < on.length; k++) steps.push({ a: on[k], b: on[k + 1], kind: 'on', ok: son[on[k]] < son[on[k + 1]], app: apO && k === 0 });
            for (let k = 0; k + 1 < co.length; k++) steps.push({ a: co[k], b: co[k + 1], kind: 'co', ok: son[co[k]] > son[co[k + 1]], app: k + 1 >= co.length - apC });
          });
          return { syms, sy, son, roles, steps };
        };
        v.render(() => {
          C = analyse(); const { syms, son, roles, steps } = C, n = Math.max(syms.length, 4);
          const lo = -(0.55 * n + 1.3); s.setView([lo, n + 0.4], [0, 12.3]);
          for (let l = 1; l <= 11; l++) { s.hline(l, { color: 'grid', width: 0.7 }); s.text(SON_SHORT[l], lo + 0.1, l, { size: 10, color: 'muted', align: 'left', baseline: 'middle' }); }
          s.text('sonority', lo + 0.1, 11.9, { size: 11, color: 'muted', align: 'left', weight: 650 });
          // syllable shading
          let pos = 0; C.sy.forEach((y, si) => { const len = y.on.length + y.nu.length + y.co.length; if (si) s.vline(pos - 0.5, { color: 'muted', dash: [4, 4], width: 1 }); pos += len; });
          // the line
          for (let i = 0; i + 1 < syms.length; i++) {
            const st = steps.find((q) => q.a === i && q.b === i + 1);
            const col = !st ? 'muted' : st.app ? 'gold' : st.ok ? 'green' : 'red';
            s.segment([i, son[i]], [i + 1, son[i + 1]], { color: col, width: st ? 3.2 : 1.6, dash: st && st.app ? [6, 4] : undefined });
          }
          syms.forEach((q, i) => {
            const col = roles[i] === 'nu' ? 'accent' : roles[i] === 'on' ? 'orange' : 'purple';
            s.dot(i, son[i], { r: 9, color: col, fill: col }); s.text(q, i, son[i] + 0.8, { size: 17, color: 'ink', align: 'center' });
          });
        });
        v.readout(() => {
          const { syms, sy, son, steps } = C; if (!syms.length) return 'Type a word.';
          const bad = steps.filter((q) => !q.ok && !q.app), appx = steps.filter((q) => !q.ok && q.app);
          const name = (q) => `${q.kind === 'on' ? 'onset' : 'coda'} ${syms[q.a]}–${syms[q.b]} (${son[q.a]} → ${son[q.b]}, ${son[q.a] === son[q.b] ? 'level' : q.kind === 'on' ? 'falls' : 'rises'})`;
          const head = `/${syms.join('')}/ — syllables ${sy.map(sylText).join(' . ')}; sonority profile ${son.join(' ')}.`;
          if (!bad.length && !appx.length) return head + '\n**Obeys the principle**: sonority rises to the nucleus and falls after it, with no level steps.';
          return head + '\n' + (bad.length ? `**Violations**: ${bad.map(name).join('; ')}.` : '**Obeys the principle** once the appendix is set aside.') + (appx.length ? `\nSet aside as appendix: ${appx.map(name).join('; ')}.` : '');
        });
      },
    },
    {
      num: '2.11',
      kind: 'Concept',
      name: 'Stress and metrical feet',
      credit: 'Liberman & Prince, 1977; Hayes, 1980 and 1995',
      statement: String.raw`**Stress** is the relative prominence of a syllable. In **metrical phonology** syllables are grouped into **feet**, each with one head (a stressed syllable), and the feet are in turn organised so that one head carries the **main stress**; the result can be drawn as a grid of stacked marks. A language chooses a few parameters: the foot's shape (a **trochee** is strong–weak, an **iamb** weak–strong), whether foot-building is sensitive to syllable **weight** (heavy syllables have a coda or a long vowel or diphthong), the direction in which feet are built, whether the last syllable is **extrametrical** (invisible), and which foot's head is the main stress.`,
      idea: String.raw`The grid turns a list of syllable weights into a prediction of the stress pattern. Because feet are built from the word edge inward, adding a suffix changes which syllable ends up in the foot structure's strongest position: stress moves from *photograph* to *photographer* to *photographic* although the stem's own syllables do not change. The weight of a syllable (2.9) decides how it can join a foot, so syllable structure is a precondition for stress. Searching all parameter settings, as the *Best fit* button does, is the learner's task: the data determine the parameters.`,
      caption: String.raw`Pick a word; the grid shows its syllables (heavy = closed or with a diphthong, from the syllable shapes of 2.9), the feet built by the current parameters (brackets), foot heads, and the main stress (the tallest column). The table scores the model against ten English words. Change one parameter at a time, or press **Best fit** to search all 32 settings; the default trochaic, weight-sensitive, right-to-left, final-extrametrical setting (the Latin-like pattern) gets nine of ten, and *banana* is the word that needs something else.`,
      deps: ['ling-2.9'],
      refs: ['Ladefoged & Johnson'],
      tags: ['stress', 'metrical phonology'],
      scope: String.raw`A toy model: only the parameters on the screen, syllable weight from the crude rule "closed or diphthong = heavy", and stress patterns for the ten words transcribed from General American from memory. Real English stress involves morphology, lexical exceptions and more than one rule.`,
      viz(v) {
        const P = { foot: 'T', qs: true, dir: 'R', extra: true, main: 'R' };
        const sel = (label, key, opts, init) => v.select(label, opts.map(([val, lab]) => ({ value: val, label: lab })), init, { onChange: (x) => { P[key] = x; } });
        const ws = v.slider('Word', 1, MWORDS.length, 1, { int: true, fmt: (i) => MWORDS[i - 1].w });
        const wsel = { get value() { return ws.value - 1; } };
        const sFoot = sel('Foot', 'foot', [['T', 'trochee (strong–weak)'], ['I', 'iamb (weak–strong)']], 'T');
        const sQ = sel('Weight', 'qs', [[true, 'sensitive'], [false, 'insensitive']], true);
        const sD = sel('Built from', 'dir', [['R', 'right edge'], ['L', 'left edge']], 'R');
        const sE = sel('Last syllable', 'extra', [[true, 'extrametrical'], [false, 'counted']], true);
        const sM = sel('Main stress', 'main', [['R', 'rightmost foot'], ['L', 'leftmost foot']], 'R');
        const cmp = v.toggle('analyse compounds member by member', true);
        v.button('Best fit', () => {
          let best = null;
          for (const foot of ['T', 'I']) for (const qs of [true, false]) for (const dir of ['R', 'L']) for (const extra of [true, false]) for (const main of ['R', 'L']) {
            const Q = { foot, qs, dir, extra, main }, sc = MWORDS.filter((m) => predictStress(m, Q, cmp.value).pat.join() === m.att.join()).length;
            if (!best || sc > best.sc) best = { Q, sc };
          }
          Object.assign(P, best.Q); sFoot.set(P.foot); sQ.set(P.qs); sD.set(P.dir); sE.set(P.extra); sM.set(P.main);
        });
        const sg = v.stage({ x: [0, 6], y: [-1.4, 5.3], axes: false, height: 340, weight: 1.15, minWidth: 300 });
        const st = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.85, minWidth: 250 });
        const T = v.table(st, { rows: MWORDS.length, cols: 3, square: false, cellAspect: 2.4, maxCell: 28, size: 12.5, rowLabels: MWORDS.map((m) => m.w), colLabels: ['model', 'attested', ''] });
        const show = (a) => a.join(' ');
        const preds = () => MWORDS.map((m) => predictStress(m, P, cmp.value));
        let PR = [];
        v.render(() => {
          PR = preds(); const m = MWORDS[wsel.value], r = PR[wsel.value], n = m.sy.length, ok = r.pat.join() === m.att.join();
          sg.setView([-0.4, Math.max(n, 3) + 0.4], [-1.4, 5.3]);
          const exIdx = r.ex ? n - 1 : -1;
          for (let i = 0; i < n; i++) {
            const dash = i === exIdx;
            sg.rect(i + 0.06, 0.1, i + 0.94, 0.9, { fill: m.wt[i] === 'H' ? 'accent' : null, fillAlpha: m.wt[i] === 'H' ? 0.22 : 0, color: m.wt[i] === 'H' ? 'accent' : 'muted', width: 1.6, radius: 6, dash: dash ? [4, 3] : undefined });
            sg.text(m.sy[i], i + 0.5, 0.5, { size: 16, color: 'ink', align: 'center', baseline: 'middle' });
            sg.text(m.wt[i] === 'H' ? 'heavy' : 'light', i + 0.5, -0.25, { size: 10.5, color: 'muted', align: 'center' });
            if (dash) sg.text('⟨extrametrical⟩', i + 0.5, -0.75, { size: 9.5, color: 'orange', align: 'center' });
          }
          const feet = r.feet || [];
          feet.forEach((f) => { const x0 = f[0] + 0.02, x1 = f[f.length - 1] + 0.98; sg.path([[x0, 1.1], [x0, 1.35], [x1, 1.35], [x1, 1.1]], { color: 'orange', width: 2.2 }); });
          const levels = [0, 1, 2]; // marks: line 0 every syllable, line 1 heads, line 2 main
          for (let i = 0; i < n; i++) {
            const p = r.pat[i];
            sg.dot(i + 0.5, 1.9, { r: 6, color: 'muted', fill: 'muted' });
            if (p >= 1) sg.dot(i + 0.5, 2.6, { r: 6.5, color: 'orange', fill: 'orange' });
            if (p === 1) sg.dot(i + 0.5, 3.3, { r: 7, color: 'red', fill: 'red' });
          }
          sg.text('syllables', -0.35, 1.9, { size: 10, color: 'muted', align: 'left', dy: -12 }); sg.text('feet (heads)', -0.35, 2.6, { size: 10, color: 'orange', align: 'left', dy: -12 }); sg.text('main stress', -0.35, 3.3, { size: 10, color: 'red', align: 'left', dy: -12 });
          sg.text(`model ${show(r.pat)}   attested ${show(m.att)}`, (n) / 2, 4.5, { size: 13, color: ok ? 'green' : 'red', align: 'center', weight: 650 });
          if (r.degenerate) sg.text('no foot could be built: one degenerate foot', n / 2, 4.05, { size: 10, color: 'muted', align: 'center' });
          T.draw({
            value: (i, j) => (j === 0 ? show(PR[i].pat) : j === 1 ? show(MWORDS[i].att) : PR[i].pat.join() === MWORDS[i].att.join() ? '✓' : '✗'),
            fill: (i, j) => (j === 2 ? [PR[i].pat.join() === MWORDS[i].att.join() ? 'green' : 'red', 0.22] : null), highlight: [[wsel.value, 0, 'accent'], [wsel.value, 1, 'accent']],
          });
          st.corner(`${PR.filter((p, i) => p.pat.join() === MWORDS[i].att.join()).length} / ${MWORDS.length}`, 'br', { color: 'ink', weight: 700 });
        });
        v.readout(() => {
          const m = MWORDS[wsel.value], r = PR[wsel.value], n = PR.filter((p, i) => p.pat.join() === MWORDS[i].att.join()).length;
          return `**${m.w}** /${m.sy.join('.')}/ — weights ${m.wt.join(' ')}; 1 = main stress, 2 = secondary, 0 = unstressed.\nParameters: ${P.foot === 'T' ? 'trochaic' : 'iambic'}, ${P.qs ? 'weight-sensitive' : 'weight-insensitive'}, built from the ${P.dir === 'R' ? 'right' : 'left'}, final syllable ${P.extra ? 'extrametrical' : 'counted'}, main stress on the ${P.main === 'R' ? 'rightmost' : 'leftmost'} foot: **${n} of ${MWORDS.length}** words correct.` + (m.note ? `\n(*${m.w}* is ${m.note}; see the compound switch.)` : '');
        });
      },
    },
    {
      num: '2.12',
      kind: 'Concept',
      name: 'Vowel harmony',
      statement: String.raw`In a language with **vowel harmony** the vowels of a word agree in some feature. In Turkish all the vowels of a native word agree in backness, and the high vowels of suffixes also agree in rounding with the preceding vowel: a suffix has an unspecified "archiphoneme" vowel (A in the plural $\text{-lAr}$, I in the genitive $\text{-In}$) whose backness (and, for I, roundness) is copied from the vowel before it, so the plural of *ev* "house" is *evler* and of *kol* "arm" *kollar*, and the genitive of *göz* "eye" is *gözün*. The feature spreads from the stem to the suffixes, left to right.`,
      idea: String.raw`Harmony is a rule over features (2.3, 2.5) applied at a distance: the intervening consonants are transparent, since only vowels bear [back] and [round], so the value simply copies from vowel to vowel. In autosegmental terms there is a single [back] node linked to every vowel of the word, which is why a suffix needs just one entry in the lexicon with the vowel unspecified. The pattern is productive (new loanwords and suffixes obey it) and has exceptions that show what the rule really tests: *saat* "hour" and *rol* "role" take front suffixes (*saatler*, *roller*) although their last vowel is back, because the stems behave as front for harmony.`,
      caption: String.raw`Pick a stem and add the plural and a case suffix. The word is drawn with its **[back]** and **[round]** tiers: blue boxes are front vowels, orange ones back, and a dot marks rounded vowels. Switch to *underlying* to see the suffix vowels as unspecified A and I; on *surface* the tiers spread to the right. The last two stems are exceptions to the simple rule: the readout compares the rule's prediction with the attested form. The chart on the left shows the eight Turkish vowels (front/back × unrounded/rounded × high/non-high).`,
      deps: ['ling-2.3'],
      refs: ['Fromkin et al.'],
      tags: ['harmony', 'autosegmental'],
      scope: String.raw`Turkish only; the simple rule holds for native stems and suffixes, with systematic exceptions (loanwords with front l, some stems). The forms follow standard descriptions of Turkish harmony.`,
      viz(v) {
        const stemSel = v.select('Stem', TURK.map((t) => ({ value: t, label: t })), 'kol');
        const pl = v.toggle('plural -lAr', true);
        const kase = v.select('Case', [{ value: 'none', label: 'none' }, { value: 'gen', label: 'genitive -In' }, { value: 'abl', label: 'ablative -dAn' }], 'gen');
        const disp = v.select('Show', [{ value: 'surf', label: 'surface' }, { value: 'under', label: 'underlying' }], 'surf');
        const sv = v.stage({ x: [-0.7, 4.3], y: [-0.7, 1.9], axes: false, height: 300, weight: 0.8, minWidth: 220, title: 'Turkish vowels' });
        const sw = v.stage({ x: [0, 10], y: [-1.1, 5.6], axes: false, height: 300, weight: 1.5, minWidth: 320, title: 'tiers' });
        let W = null;
        v.render(() => {
          const stem = stemSel.value, X = turkish(stem, pl.value, kase.value), L = X.L; W = X;
          const surf = disp.value === 'surf';
          // vowel chart
          sv.text('front', 1.0, 1.75, { size: 10.5, color: 'muted', align: 'center' }); sv.text('back', 3.0, 1.75, { size: 10.5, color: 'muted', align: 'center' });
          sv.text('high', -0.65, 1, { size: 10, color: 'muted', align: 'left', baseline: 'middle' }); sv.text('low', -0.65, 0, { size: 10, color: 'muted', align: 'left', baseline: 'middle' });
          const vs = L.filter((x) => x.v);
          for (const k in TV_POS) {
            const [cx, cy] = TV_POS[k], x = cx + 0.5, y = cy * 0.9 + 0.05;
            const hit = surf ? vs.filter((q) => q.c === k) : vs.filter((q) => q.c === k && q.part === 'stem');
            sv.rect(x - 0.4, y - 0.36, x + 0.4, y + 0.36, { fill: TV[k].b ? 'orange' : 'accent', fillAlpha: hit.length ? 0.4 : 0.08, color: hit.length ? (TV[k].b ? 'orange' : 'accent') : 'grid', width: hit.length ? 2.2 : 1, radius: 6 });
            sv.text(k, x, y, { size: 19, color: 'ink', align: 'center', baseline: 'middle' });
            if (TV[k].r) sv.dot(x + 0.28, y + 0.22, { r: 3, color: 'ink', fill: 'ink' });
          }
          sv.text('● = rounded', 4.2, -0.5, { size: 10, color: 'muted', align: 'right' });
          sv.line(2.0, -0.4, 2.0, 1.65, { color: 'grid', width: 1.2 });
          // word with tiers
          const n = L.length, w = Math.min(0.9, 9.4 / n), x0 = 5 - (n * w) / 2, cx = (i) => x0 + (i + 0.5) * w;
          const yL = 2.0, yB = 3.7, yR = 0.55;
          L.forEach((q, i) => {
            const isSuf = q.part !== 'stem', unspec = !surf && q.v && isSuf;
            const col = q.v ? (unspec ? 'muted' : (TV[q.c] ? (TV[q.c].b ? 'orange' : 'accent') : 'muted')) : null;
            sw.rect(cx(i) - w * 0.42, yL - 0.42, cx(i) + w * 0.42, yL + 0.42, { fill: col, fillAlpha: col ? 0.3 : 0, color: col || 'grid', width: col ? 2 : 1, radius: 6, dash: unspec ? [4, 3] : undefined });
            const txt = unspec ? (q.type === 'A' ? 'A' : 'I') : q.c;
            sw.text(txt, cx(i), yL, { size: 21, color: 'ink', align: 'center', baseline: 'middle' });
            if (q.v && !unspec && TV[q.c].r) sw.dot(cx(i) + w * 0.3, yL + 0.28, { r: 3, color: 'ink', fill: 'ink' });
            if (isSuf && (q.v || surf)) { /* suffix underline below */ }
          });
          // stem / suffix brackets under the round tier
          const sStart = L.findIndex((q) => q.part !== 'stem'), eStem = sStart >= 0 ? sStart - 1 : n - 1;
          sw.line(cx(0) - w * 0.45, -0.35, cx(eStem) + w * 0.45, -0.35, { color: 'muted', width: 1.4 }); sw.text('stem', (cx(0) + cx(eStem)) / 2, -0.55, { size: 10, color: 'muted', align: 'center', baseline: 'top' });
          if (sStart >= 0) { sw.line(cx(sStart) - w * 0.45, -0.35, cx(n - 1) + w * 0.45, -0.35, { color: 'accent', width: 1.4 }); sw.text('suffixes', (cx(sStart) + cx(n - 1)) / 2, -0.55, { size: 10, color: 'accent', align: 'center', baseline: 'top' }); }
          const vi = L.map((q, i) => (q.v ? i : -1)).filter((i) => i >= 0);
          sw.text('[back]', 0.15, yB, { size: 11, color: 'muted', align: 'left', baseline: 'middle' }); sw.text('[round]', 0.15, yR, { size: 11, color: 'muted', align: 'left', baseline: 'middle' });
          if (surf) {
            // [back] tier: one node for the stem vowels, one for suffixes if the stem is a lexical exception
            const stemV = vi.filter((i) => L[i].part === 'stem'), sufV = vi.filter((i) => L[i].part !== 'stem');
            const node = (xs, y, label, col) => { const xm = (xs[0] + xs[xs.length - 1]) / 2; sw.rect(xm - 0.42, y - 0.24, xm + 0.42, y + 0.24, { fill: col, fillAlpha: 0.2, color: col, width: 1.6, radius: 6 }); sw.text(label, xm, y, { size: 11, color: 'ink', align: 'center', baseline: 'middle' }); return xm; };
            const link = (xm, y, i, col, dash) => sw.line(xm, y - 0.24, cx(i), yL + 0.46, { color: col, width: 1.4, dash });
            const stemB = TV[L[stemV[stemV.length - 1]].c].b;
            const m1 = node(stemV.map(cx), yB, stemB ? '+back' : '−back', stemB ? 'orange' : 'accent'); stemV.forEach((i) => link(m1, yB, i, 'muted'));
            if (sufV.length) {
              if (W.soft) {
                const m2 = node(sufV.map(cx), yB + 0.0 + 0.55, '−back', 'accent'); sufV.forEach((i) => link(m2, yB + 0.55, i, 'red'));
                sw.text('lexical exception: the stem counts as front', 5, 5.2, { size: 11, color: 'red', align: 'center' });
              } else sufV.forEach((i) => link(m1, yB, i, stemB ? 'orange' : 'accent'));
            }
            // [round] tier
            let group = null; const groups = [];
            vi.forEach((i) => { const q = L[i]; if (q.part === 'stem' && group === null) { group = [i]; groups.push(group); } else if (q.part === 'stem') group.push(i); else if (q.type === 'I') group.push(i); else { group = [i]; groups.push(group); } });
            groups.forEach((g) => { const rv = TV[L[g[0]].c].r, xm = (cx(g[0]) + cx(g[g.length - 1])) / 2; sw.rect(xm - 0.4, yR - 0.22, xm + 0.4, yR + 0.22, { fill: rv ? 'purple' : 'muted', fillAlpha: 0.2, color: rv ? 'purple' : 'muted', width: 1.4, radius: 6 }); sw.text(rv ? '+round' : '−round', xm, yR, { size: 10.5, color: 'ink', align: 'center', baseline: 'middle' }); g.forEach((i) => sw.line(xm, yR + 0.22, cx(i), yL - 0.46, { color: 'muted', width: 1.2 })); });
          } else {
            const stemV = vi.filter((i) => L[i].part === 'stem'); const b = TV[L[stemV[stemV.length - 1]].c];
            const xm = (cx(stemV[0]) + cx(stemV[stemV.length - 1])) / 2;
            sw.rect(xm - 0.42, yB - 0.24, xm + 0.42, yB + 0.24, { fill: b.b ? 'orange' : 'accent', fillAlpha: 0.2, color: b.b ? 'orange' : 'accent', width: 1.6, radius: 6 }); sw.text(b.b ? '+back' : '−back', xm, yB, { size: 11, color: 'ink', align: 'center', baseline: 'middle' });
            stemV.forEach((i) => sw.line(xm, yB - 0.24, cx(i), yL + 0.46, { color: 'muted', width: 1.4 }));
            sw.text('suffix vowels: no value yet', 7.2, yB, { size: 10.5, color: 'muted', align: 'center' });
          }
        });
        v.readout(() => {
          const { L, soft, b } = W, stem = stemSel.value, word = L.map((q) => q.c).join('');
          // what the simple rule (copy backness of the last stem vowel) would predict
          const lastStem = [...L.filter((q) => q.part === 'stem' && q.v)].pop(), rb = TV[lastStem.c].b;
          const naive = L.map((q) => (q.part !== 'stem' && q.v && q.type === 'A' ? (rb ? 'a' : 'e') : q.part !== 'stem' && q.v ? vowelBR(rb, TV[q.c].r) : q.c)).join('');
          const head = `*${stem}* “${GLOSS[stem]}” → **${word}**`;
          if (soft) return `${head}. The simple rule (copy the back vowel of the stem) would give *${naive}*, which is not what speakers say: the stem behaves as a front stem for harmony, an exception the rule has to list.`;
          return `${head}: the stem's last vowel ${lastStem.c} is ${rb ? '**back**' : '**front**'}, so every suffix vowel is ${rb ? 'back' : 'front'}; the I-vowels also copy its roundness, but the A-vowels are never rounded, so *-lAr* blocks rounding harmony from reaching a following suffix.`;
        });
      },
    },
    {
      num: '2.13',
      kind: 'Model',
      name: 'Optimality Theory: ranked violable constraints',
      credit: 'Prince & Smolensky, 1993 (Optimality Theory: Constraint Interaction in Generative Grammar)',
      statement: String.raw`In **Optimality Theory** a grammar is not a sequence of rules but a **ranking** of universal, violable constraints. For an input, the grammar generates a (very large) set of candidate outputs and chooses the one that is optimal for the ranking: candidates are compared on the highest-ranked constraint first and those with more violations are eliminated, then on the next constraint among the survivors, and so on until one remains. **Markedness** constraints penalise complex or difficult outputs (ONSET, NOCODA, *COMPLEX), **faithfulness** constraints penalise changing the input (MAX, DEP). Different languages are different rankings of the same constraints.`,
      idea: String.raw`A constraint can be violated if that is the only way to satisfy a stronger one, so the same constraint is active in one language and invisible in another: NOCODA is obeyed in Japanese loanwords by inserting a vowel (the faithfulness constraint DEP is ranked below it) and ignored in English (where MAX and DEP dominate). The rule-based account of 2.5 would write a different rule for each language; here the *rankings* differ and the candidates and constraints are shared. The set of attested systems is the factorial typology: the winners over all $k!$ rankings.`,
      caption: String.raw`Drag the constraint headers left or right to re-rank them (or choose a preset). Each row is a candidate output; stars are violations, a red **!** marks the fatal violation that eliminates the candidate, grey cells are irrelevant after that, and the arrow marks the winner. The readout counts the distinct winners over all 120 rankings of the five constraints, which is the typology this tiny grammar predicts for the chosen input.`,
      deps: ['ling-2.5', 'ling-2.9'],
      refs: ['Fromkin et al.'],
      tags: ['Optimality Theory', 'constraints'],
      scope: String.raw`A miniature grammar: five constraints, hand-listed candidates (a real GEN is infinite), and an inserted vowel [u] or glottal stop as the only epenthetic material.`,
      viz(v) {
        let rank = OT_RANK.epen.r.slice(), drag = -1;
        const inp = v.select('Input', Object.entries(OT_INPUTS).map(([k, o]) => ({ value: k, label: o.name })), 'apta');
        const pre = v.select('Language type', Object.entries(OT_RANK).map(([k, o]) => ({ value: k, label: o.name })), 'epen', { onChange: (k) => { rank = OT_RANK[k].r.slice(); } });
        const s = v.stage({ x: [0, 12], y: [0, 10.4], axes: false, height: 400, full: true });
        const X0 = 3.2, CW = 1.76, hdrY = 9.1;
        s.onDrag((x, y, phase) => {
          if (phase === 'start') { const i = Math.floor((x - X0) / CW); drag = y > hdrY - 0.7 && i >= 0 && i < 5 ? i : -1; }
          else if (phase === 'move' && drag >= 0) { const j = clamp(Math.floor((x - X0) / CW), 0, 4); if (j !== drag) { const [c] = rank.splice(drag, 1); rank.splice(j, 0, c); drag = j; pre.set('none'); } }
          else if (phase === 'end') drag = -1;
        });
        let E = null;
        v.render(() => {
          const O = OT_INPUTS[inp.value], cs = O.cands; E = otEval(cs, rank);
          const top = 7.6, rh = Math.min(1.05, 6.4 / cs.length);
          s.text('input ' + O.name, 0.2, hdrY, { size: 15, color: 'ink', align: 'left', baseline: 'middle', weight: 650 });
          rank.forEach((c, i) => {
            const x = X0 + i * CW, moving = drag === i;
            s.rect(x + 0.05, hdrY - 0.5, x + CW - 0.05, hdrY + 0.5, { fill: moving ? 'gold' : 'accent', fillAlpha: moving ? 0.4 : 0.16, color: moving ? 'gold' : 'accent', width: 2, radius: 7 });
            s.text(c, x + CW / 2, hdrY, { size: 13, color: 'ink', align: 'center', baseline: 'middle', weight: 650 });
            if (i) s.text('≫', x, hdrY, { size: 15, color: 'muted', align: 'center', baseline: 'middle' });
            s.line(x, 0.2, x, hdrY - 0.6, { color: i ? 'grid' : 'muted', width: i ? 1 : 1.5, dash: i ? [3, 4] : undefined });
          });
          s.line(X0 + 5 * CW, 0.2, X0 + 5 * CW, hdrY - 0.6, { color: 'muted', width: 1.5 });
          s.text('drag a header to re-rank', X0 + 2.5 * CW, 9.95, { size: 10.5, color: 'muted', align: 'center' });
          cs.forEach((c, r) => {
            const y = top - r * rh, win = E.winner === r;
            if (win) s.rect(0.1, y - rh * 0.45, X0 + 5 * CW, y + rh * 0.45, { fill: 'green', fillAlpha: 0.14, stroke: false });
            s.text(`${win ? '▶ ' : ''}[${c.form}]`, 0.3, y, { size: 15, color: win ? 'green' : 'ink', align: 'left', baseline: 'middle', weight: win ? 700 : 400 });
            rank.forEach((k, i) => {
              const x = X0 + i * CW + CW / 2, n = c.v[k], f = E.fatal[r];
              if (f >= 0 && i > f) s.rect(X0 + i * CW + 0.04, y - rh * 0.45, X0 + (i + 1) * CW - 0.04, y + rh * 0.45, { fill: 'muted', fillAlpha: 0.14, stroke: false });
              if (n) s.text('*'.repeat(Math.min(n, 4)) + (f === i ? '!' : ''), x, y, { size: 17, color: f === i ? 'red' : 'ink', align: 'center', baseline: 'middle', weight: f === i ? 800 : 500 });
            });
          });
        });
        v.readout(() => {
          const O = OT_INPUTS[inp.value], cs = O.cands, w = cs[E.winner];
          const wins = new Map(); for (const p of perms(CONS)) { const e = otEval(cs, p); wins.set(e.winner, (wins.get(e.winner) || 0) + 1); }
          const viol = CONS.filter((k) => w.v[k]).map((k) => `${k}${w.v[k] > 1 ? '×' + w.v[k] : ''}`);
          const lead = pre.value && OT_RANK[pre.value] ? OT_RANK[pre.value].lead + '\n' : '';
          return `${lead}Ranking ${rank.join(' ≫ ')}: the winner for ${O.name} is **[${w.form}]**, which violates ${viol.length ? viol.join(', ') : 'nothing'}${E.ties.length > 1 ? ' (tie with other candidates)' : ''}.\nOver all 120 rankings there are **${wins.size}** different winners: ${[...wins].sort((a, b) => b[1] - a[1]).map(([i, n]) => `[${cs[i].form}] (${n})`).join(', ')}.`;
        });
      },
    },
  ],
};
