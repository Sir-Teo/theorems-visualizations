// Philosophy & Reasoning — Chapter 1: Arguments and reasoning

// ---------- shared helpers ----------
// Propositional formulas over P, Q, R with an English reading (P: it rains, Q: the match is off, R: refunds are paid).
const PROP = {
  P: { tex: 'P', en: 'It rains.', vars: 'P', f: (w) => w.P },
  Q: { tex: 'Q', en: 'The match is off.', vars: 'Q', f: (w) => w.Q },
  R: { tex: 'R', en: 'Refunds are paid.', vars: 'R', f: (w) => w.R },
  nP: { tex: '\\neg P', en: 'It does not rain.', vars: 'P', f: (w) => !w.P },
  nQ: { tex: '\\neg Q', en: 'The match is not off.', vars: 'Q', f: (w) => !w.Q },
  nR: { tex: '\\neg R', en: 'No refunds are paid.', vars: 'R', f: (w) => !w.R },
  PQ: { tex: 'P\\to Q', en: 'If it rains, the match is off.', vars: 'PQ', f: (w) => !w.P || w.Q },
  QP: { tex: 'Q\\to P', en: 'If the match is off, it rains.', vars: 'PQ', f: (w) => !w.Q || w.P },
  QR: { tex: 'Q\\to R', en: 'If the match is off, refunds are paid.', vars: 'QR', f: (w) => !w.Q || w.R },
  PR: { tex: 'P\\to R', en: 'If it rains, refunds are paid.', vars: 'PR', f: (w) => !w.P || w.R },
  PoQ: { tex: 'P\\vee Q', en: 'It rains or the match is off.', vars: 'PQ', f: (w) => w.P || w.Q },
  PaQ: { tex: 'P\\wedge Q', en: 'It rains and the match is off.', vars: 'PQ', f: (w) => w.P && w.Q },
  nPaQ: { tex: '\\neg(P\\wedge Q)', en: 'Not both: rain and the match off.', vars: 'PQ', f: (w) => !(w.P && w.Q) },
};
/** All truth assignments to the given letters, first row all true (the usual truth-table order). */
function truthRows(letters) {
  const n = letters.length, out = [];
  for (let i = 0; i < 1 << n; i++) { const w = {}; letters.forEach((L, k) => { w[L] = !((i >> (n - 1 - k)) & 1); }); out.push(w); }
  return out;
}
/** Check an argument (slots = three optional premise keys + a conclusion key) against every row. */
function analyseArg(slots) {
  const prem = slots.slice(0, 3).map((k, i) => (k ? { k, i } : null)).filter(Boolean), con = slots[3];
  const used = [...prem.map((p) => p.k), con];
  const letters = ['P', 'Q', 'R'].filter((L) => used.some((k) => PROP[k].vars.includes(L)));
  const rows = truthRows(letters).map((w) => {
    const pv = prem.map((p) => PROP[p.k].f(w)), cv = PROP[con].f(w), all = pv.every(Boolean);
    return { w, pv, cv, all, bad: all && !cv };
  });
  return { prem, con, letters, rows, valid: !rows.some((r) => r.bad) };
}
const TF = (b) => (b ? '\\mathrm{T}' : '\\mathrm{F}');
const asg = (w, letters) => '$' + letters.map((L) => `${L}{=}${TF(w[L])}`).join(',\\ ') + '$';

// ---- three-circle Venn diagrams for categorical syllogisms (regions coded S = 4, M = 2, P = 1)
const VN = { S: [-0.6, -0.36], P: [0.6, -0.36], M: [0, 0.68], r: 1.02 };
const VBIT = { S: 4, M: 2, P: 1 };
const vin = (L, x, y) => (x - VN[L][0]) ** 2 + (y - VN[L][1]) ** 2 < VN.r ** 2;
const vregion = (x, y) => (vin('S', x, y) ? 4 : 0) | (vin('M', x, y) ? 2 : 0) | (vin('P', x, y) ? 1 : 0);
const QWORD = { A: ['All', 'are'], E: ['No', 'are'], I: ['Some', 'are'], O: ['Some', 'are not'] };
/** Is the categorical statement st = {q, a, b} true when exactly the regions in `model` (bit r = region r) are occupied? */
function catTrue(st, model, imp) {
  const X = VBIT[st.a], Y = VBIT[st.b]; let some = false, xs = false;
  for (let r = 1; r < 8; r++) {
    if (!((model >> r) & 1)) continue;
    const hx = r & X, hy = r & Y;
    if (hx) xs = true;
    if (st.q === 'A' && hx && !hy) return false;
    if (st.q === 'E' && hx && hy) return false;
    if ((st.q === 'I' && hx && hy) || (st.q === 'O' && hx && !hy)) some = true;
  }
  if (st.q === 'I' || st.q === 'O') return some;
  return imp ? xs : true; // existential import: "All X are Y" and "No X are Y" also say that there are X
}
/** Search all 2^7 occupancy patterns of the seven regions. */
function syllo(st, imp) {
  const models = [], bad = [];
  for (let m = 0; m < 256; m += 2) if (catTrue(st[0], m, imp) && catTrue(st[1], m, imp)) { models.push(m); if (!catTrue(st[2], m, imp)) bad.push(m); }
  let empty = 0, full = 0;
  for (let r = 1; r < 8; r++) {
    if (models.every((m) => !((m >> r) & 1))) empty |= 1 << r;
    if (models.length && models.every((m) => (m >> r) & 1)) full |= 1 << r;
  }
  return { models, bad, valid: bad.length === 0, empty, full };
}
const bitsOf = (m) => { let c = 0; for (let r = 1; r < 8; r++) c += (m >> r) & 1; return c; };
const SYLL = {
  AAA1: 'Barbara', EAE1: 'Celarent', AII1: 'Darii', EIO1: 'Ferio', AAI1: 'Barbari', EAO1: 'Celaront',
  EAE2: 'Cesare', AEE2: 'Camestres', EIO2: 'Festino', AOO2: 'Baroco', EAO2: 'Cesaro', AEO2: 'Camestros',
  AAI3: 'Darapti', IAI3: 'Disamis', AII3: 'Datisi', EAO3: 'Felapton', OAO3: 'Bocardo', EIO3: 'Ferison',
  AAI4: 'Bramantip', AEE4: 'Camenes', IAI4: 'Dimaris', EAO4: 'Fesapo', EIO4: 'Fresison', AEO4: 'Camenos',
};

// ---- the four conditional argument forms (P: she has measles, Q: she has a rash)
const FORMS4 = [
  { id: 'mp', name: 'modus ponens', p2: ['P', (w) => w.P], c: ['Q', (w) => w.Q], en: 'If she has measles, she has a rash. She has measles. So she has a rash.' },
  { id: 'mt', name: 'modus tollens', p2: ['\\neg Q', (w) => !w.Q], c: ['\\neg P', (w) => !w.P], en: 'If she has measles, she has a rash. She has no rash. So she does not have measles.' },
  { id: 'ac', name: 'affirming the consequent', p2: ['Q', (w) => w.Q], c: ['P', (w) => w.P], en: 'If she has measles, she has a rash. She has a rash. So she has measles.' },
  { id: 'da', name: 'denying the antecedent', p2: ['\\neg P', (w) => !w.P], c: ['\\neg Q', (w) => !w.Q], en: 'If she has measles, she has a rash. She does not have measles. So she has no rash.' },
];
const W4 = [{ P: true, Q: true }, { P: true, Q: false }, { P: false, Q: true }, { P: false, Q: false }];

// ---- Wason selection task
const WASON = {
  abs: {
    rule: 'Rule: if a card has a vowel on one side, it has an even number on the other.',
    cards: [
      { role: 'p', face: 'E', sub: 'vowel', back: 'a number', bad: 'an odd number' },
      { role: 'not-p', face: 'K', sub: 'consonant', back: 'a number', bad: null },
      { role: 'q', face: '4', sub: 'even', back: 'a letter', bad: null },
      { role: 'not-q', face: '7', sub: 'odd', back: 'a letter', bad: 'a vowel' },
    ],
  },
  soc: {
    rule: 'Rule: if a person is drinking beer, they must be over 18.',
    cards: [
      { role: 'p', face: 'beer', sub: 'drinking', back: 'an age', bad: 'an age under 18' },
      { role: 'not-p', face: 'cola', sub: 'drinking', back: 'an age', bad: null },
      { role: 'q', face: '25', sub: 'years old', back: 'a drink', bad: null },
      { role: 'not-q', face: '16', sub: 'years old', back: 'a drink', bad: 'beer' },
    ],
  },
};
const H2 = (p) => (p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p));
/** Expected information gain (bits) about "rule holds" (MD) vs "independence" (MI), prior 1/2 each (Oaksford & Chater 1994). */
function infoGain(xMD, xMI) {
  const po = 0.5 * xMD + 0.5 * xMI, pn = 1 - po;
  const hPos = po > 0 ? H2((0.5 * xMD) / po) : 0, hNeg = pn > 0 ? H2((0.5 * (1 - xMD)) / pn) : 0;
  return 1 - po * hPos - pn * hNeg;
}

// ---- argument map (1.5)
const MAP_ORDER = ['B1', 'O1', 'R1', 'R2', 'J', 'R3', 'O2', 'C'];
/** Acceptance of every claim: linked premises multiply, independent lines of support combine by noisy-OR, attacks defeat multiplicatively. */
function evalMap(base, edges) {
  const a = {};
  for (const id of MAP_ORDER) {
    const inc = edges.filter((e) => e.to === id);
    let val;
    if (id === 'J') val = inc.reduce((p, e) => p * a[e.from], 1);
    else {
      val = 1 - (1 - (base[id] ?? 0)) * inc.filter((e) => e.type === 'sup').reduce((p, e) => p * (1 - e.w * a[e.from]), 1);
      for (const e of inc) if (e.type === 'att') val *= 1 - e.w * a[e.from];
    }
    a[id] = val;
  }
  return a;
}

export default {
  collection: 'phil',
  chapter: 1,
  title: 'Arguments and reasoning',
  summary: String.raw`Philosophy runs on arguments, so we start with what makes one good. Validity is a matter of form: no possible situation makes the premises true and the conclusion false. Soundness adds that the premises really are true. Propositional arguments can be checked mechanically with truth tables and syllogisms with Venn diagrams, while the classic formal fallacies imitate valid forms and are sometimes inductively reasonable after all. Psychology shows that people reason far from the textbook ideal (though what the ideal is turns out to be debatable), argument maps make the structure of real reasoning visible, and Lewis Carroll’s tortoise shows that a rule of inference cannot be replaced by one more premise.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Validity and soundness',
      statement: String.raw`An **argument** consists of premises and a conclusion. It is **(deductively) valid** when there is no possible situation in which all of its premises are true and its conclusion is false: the conclusion is a *logical consequence* of the premises. Validity depends only on the **form** of the argument. For an argument in propositional logic it means that every row of the truth table that makes all the premises true also makes the conclusion true; a row with true premises and a false conclusion is a **counterexample** and shows the form is invalid.

An argument is **sound** when it is valid *and* all its premises are true in the actual world; the conclusion of a sound argument is therefore true. An invalid argument can still be **inductively strong**, when its premises make the conclusion probable without guaranteeing it.`,
      idea: String.raw`Validity is a claim about *all* possible situations. For propositional forms, the only features of a situation that matter are the truth values of the $n$ sentence letters, so there are just $2^n$ cases (logic 2.3), and validity is a finite search in which one bad row is enough to refute it. Soundness adds a fact about the actual world, which logic alone cannot supply. A valid argument may have false premises and a false conclusion, and an invalid argument whose premises and conclusion happen to be true is still invalid. The actual world is one of the rows, so a sound argument’s conclusion must be true: that row makes every premise true, and validity says no such row makes the conclusion false.`,
      caption: String.raw`Click a slot (a premise or the conclusion), then click a formula to put it there; **— clear** empties a premise. The table lists every assignment of truth values to the letters in use. Green rows make all the premises true; a red row is a counterexample. Click a row to make it the **actual world** (★). Soundness asks whether the argument is valid *and* every premise is true in that row. Compare modus ponens with affirming the consequent.`,
      deps: ['logic-2.3', 'logic-2.4'],
      refs: ['SEP “Logical Consequence”'],
      tags: ['logic', 'arguments'],
      viz(v) {
        const PRE = { mp: ['PQ', 'P', null, 'Q'], ac: ['PQ', 'Q', null, 'P'], hs: ['PQ', 'QR', null, 'PR'], ds: ['PoQ', 'nP', null, 'Q'] };
        let slots = PRE.mp.slice(), sel = 1, an = null;
        const actual = { P: true, Q: true, R: false };
        const preset = v.select('example', [{ value: 'mp', label: 'modus ponens' }, { value: 'ac', label: 'affirming the consequent' }, { value: 'hs', label: 'chain' }, { value: 'ds', label: 'disjunctive syllogism' }, { value: 'own', label: 'your own' }], 'mp',
          { onChange: (k) => { if (PRE[k]) { slots = PRE[k].slice(); sel = 1; } } });
        const A = v.stage({ x: [0, 20], y: [0, 10], axes: false, height: 236, full: true });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 282, full: true });
        const T = v.table(B, { square: false, cellAspect: 1.75, maxCell: 28, size: 14, region: [0, 0, 0.6, 1] });
        const CHIPS = ['P', 'Q', 'R', 'nP', 'nQ', 'nR', 'PQ', 'QP', 'QR', 'PR', 'PoQ', 'PaQ', 'nPaQ', null];
        const SY = [8.3, 6.55, 4.8, 2.0];
        const chipXY = (k) => [13.35 + (k % 3) * 2.45, 8.3 - Math.floor(k / 3) * 1.55];
        A.onClick((x, y) => {
          for (let k = 0; k < 4; k++) if (x > 0.3 && x < 11.7 && Math.abs(y - SY[k]) < 0.8) { sel = k; return; }
          CHIPS.forEach((c, k) => {
            const [cx, cy] = chipXY(k);
            if (Math.abs(x - cx) < 1.15 && Math.abs(y - cy) < 0.66 && !(c == null && sel === 3)) { slots[sel] = c; preset.set('own'); }
          });
        });
        B.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && an) Object.assign(actual, an.rows[c.i].w); });
        v.render(() => {
          an = analyseArg(slots);
          // ---- the argument and the formula palette
          A.text('the argument — click a slot to select it', 1.4, 9.55, { size: 11.5, color: 'muted' });
          A.text('formulas — click one to fill the selected slot', 12.2, 9.55, { size: 11.5, color: 'muted' });
          for (let k = 0; k < 4; k++) {
            const y = SY[k], on = sel === k, key = slots[k];
            A.rect(1.4, y - 0.72, 11.6, y + 0.72, { fill: on ? 'accent' : 'muted', fillAlpha: on ? 0.1 : 0.04, color: on ? 'accent' : 'faint', width: on ? 2.4 : 1.2 });
            A.text(k < 3 ? `${k + 1}` : '∴', 0.85, y, { align: 'center', size: k < 3 ? 13 : 19, weight: 700, color: k < 3 ? 'muted' : 'accent' });
            if (key) { A.tex(PROP[key].tex, 1.8, y, { align: 'left', size: 17, color: k === 3 ? 'accent' : 'ink' }); A.text(PROP[key].en, 4.7, y, { size: 12.5, color: 'muted' }); }
            else A.text('(no premise here)', 1.8, y, { size: 12, color: 'faint' });
          }
          A.line(1.4, 3.37, 11.6, 3.37, { color: 'ink', width: 1.6 });
          A.text('P: it rains     Q: the match is off     R: refunds are paid', 6.5, 0.62, { align: 'center', size: 11.5, color: 'muted' });
          CHIPS.forEach((c, k) => {
            const [cx, cy] = chipXY(k), on = c != null && slots[sel] === c;
            A.rect(cx - 1.1, cy - 0.6, cx + 1.1, cy + 0.6, { fill: on ? 'accent' : 'muted', fillAlpha: on ? 0.16 : 0.06, color: on ? 'accent' : 'faint', width: on ? 2 : 1 });
            if (c) A.tex(PROP[c].tex, cx, cy, { size: 15 }); else A.text('— clear', cx, cy, { align: 'center', size: 12, color: sel === 3 ? 'faint' : 'muted' });
          });
          // ---- truth table over every row
          const L = an.letters, np = an.prem.length, cols = L.length + np + 2, cC = cols - 2, cV = cols - 1;
          const ai = an.rows.findIndex((r) => L.every((x) => r.w[x] === actual[x]));
          const cell = (r, j) => (j < L.length ? r.w[L[j]] : j < L.length + np ? r.pv[j - L.length] : r.cv);
          T.draw({
            rows: an.rows.length, cols,
            colLabels: (j) => (j < L.length ? `$${L[j]}$` : j < L.length + np ? `$${PROP[an.prem[j - L.length].k].tex}$` : j === cC ? `$\\therefore\\, ${PROP[an.con].tex}$` : ''),
            colLabelColor: (j) => (j < L.length ? 'muted' : j < L.length + np ? 'ink' : 'accent'),
            rowLabels: (i) => (i === ai ? '★' : String(i + 1)),
            rowLabelColor: (i) => (i === ai ? 'gold' : 'muted'),
            value: (i, j) => { const r = an.rows[i]; if (j === cV) return r.bad ? '✗' : r.all ? '✓' : ''; return cell(r, j); },
            textColor: (i, j) => { const r = an.rows[i]; if (j === cV) return r.bad ? 'red' : 'green'; return cell(r, j) ? 'ink' : 'muted'; },
            weight: (i, j) => (j === cV ? 700 : 500),
            fill: (i, j) => { const r = an.rows[i]; if (r.bad) return ['red', j === cC ? 0.42 : 0.18]; if (r.all) return ['green', 0.15]; return null; },
          });
          if (ai >= 0) T.box(ai, 0, ai, cols - 1, { color: 'gold', width: 2.6 });
          const right = T.cellRect(0, cV)[2], fb = an.rows.findIndex((r) => r.bad);
          an.rows.forEach((r, i) => {
            const y = T.cellCenter(i, 0)[1], tags = [];
            if (i === fb) tags.push(['counterexample', 'red']);
            if (i === ai) tags.push(['★ actual world', 'gold']);
            tags.forEach(([t, col], m) => B.text((m ? '' : '◀ ') + t, right + 0.01 + m * 0.125, y, { size: 12, weight: 600, color: col }));
          });
          // ---- verdicts
          const ar = an.rows[ai], falseP = an.prem.filter((p, m) => !ar.pv[m]), sound = an.valid && !falseP.length;
          const vx = 0.86;
          B.text(an.valid ? 'VALID' : 'INVALID', vx, 0.84, { align: 'center', size: 23, weight: 700, color: an.valid ? 'green' : 'red' });
          B.text(an.valid ? `no counterexample in ${an.rows.length} rows` : `${an.rows.filter((r) => r.bad).length} counterexample row${an.rows.filter((r) => r.bad).length > 1 ? 's' : ''}`, vx, 0.72, { align: 'center', size: 11.5, color: 'muted' });
          B.text(sound ? 'SOUND' : 'NOT SOUND', vx, 0.48, { align: 'center', size: 19, weight: 700, color: sound ? 'green' : 'orange' });
          B.text(!an.valid ? 'an invalid argument is never sound' : falseP.length ? `premise ${falseP.map((p) => p.i + 1).join(' & ')} false at ★` : 'valid + premises true at ★', vx, 0.37, { align: 'center', size: 11.5, color: 'muted' });
          if (sound) B.text(`so the conclusion is true at ★`, vx, 0.29, { align: 'center', size: 11.5, color: 'muted' });
        });
        v.legend([['green', 'all premises true', { area: true }], ['red', 'counterexample: premises true, conclusion false', { area: true }], ['gold', 'the actual world (click a row)']]);
        v.readout(() => {
          if (!an) return '';
          const n = an.letters.length, N = an.rows.length, good = an.rows.filter((r) => r.all), bad = an.rows.filter((r) => r.bad);
          const s1 = an.valid
            ? `Checked all $2^{${n}} = ${N}$ rows: the premises are all true in ${good.length} of them, and the conclusion is true in each → **valid**`
            : `Checked all $2^{${n}} = ${N}$ rows: row ${an.rows.indexOf(bad[0]) + 1} (${asg(bad[0].w, an.letters)}) makes every premise true and the conclusion false → **invalid**`;
          const strength = good.length ? ` · with all ${N} rows equally likely, $\\Pr(\\text{conclusion}\\mid\\text{premises}) = ${good.length - bad.length}/${good.length}$${an.valid ? ', and it is 1 however the rows are weighted' : ''}` : '';
          return s1 + strength + '.';
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Method',
      name: 'Syllogisms and Venn diagrams',
      statement: String.raw`A **categorical syllogism** has two premises and a conclusion, each of one of four forms relating two classes $X, Y$:
- **A** “All $X$ are $Y$”,  **E** “No $X$ are $Y$”,  **I** “Some $X$ are $Y$”,  **O** “Some $X$ are not $Y$”.

The conclusion relates a subject $S$ to a predicate $P$; the major premise relates $P$ to a **middle term** $M$, and the minor premise relates $S$ to $M$. The *mood* lists the three forms (e.g. AAA) and the *figure* (1–4) records where $M$ stands. **Venn’s method** draws three overlapping circles, which cut the universe into eight regions. A universal premise *shades* the regions it says are empty, and a particular premise puts a mark ✕ in a region it says is occupied (on a boundary if it could be either of two regions). The syllogism is valid exactly when the diagram of the premises alone already shows the conclusion.

On the modern (Boole’s) reading, universal statements do not imply that their subject class is non-empty, and 15 moods-and-figures are valid. Aristotle’s logic assumes **existential import**, which validates 9 more (Darapti, Felapton, …).`,
      idea: String.raw`Each of the four forms only says that some regions of the diagram are empty or that some region is occupied. A possible situation is therefore just a choice of which of the seven regions inside the circles are occupied, and there are $2^7 = 128$ such choices. The method is a complete decision procedure: the syllogism is valid when every choice that satisfies the premises satisfies the conclusion (validity as in 1.1), and when one does not, it is a concrete counter-model, a population of individuals that makes the premises true and the conclusion false. Existential import adds “there are $X$” to every universal premise. That removes the counter-models in which a class is empty, so the moods with a particular conclusion drawn from universal premises become valid. Which reading is right is a choice about what “all” means, and logicians have argued about it since the 19th century.`,
      caption: String.raw`Click a quantifier (**All / No / Some / Some … not**) to cycle it, and click the terms of a premise to swap their order (this changes the figure). The diagram shades regions the premises force to be empty, marks ✕ where they force something to exist, and tints in blue the regions the conclusion talks about. If the form is invalid, gold dots show a counter-model: occupied regions that make both premises true and the conclusion false. Toggle existential import to see Darapti switch from invalid to valid.`,
      deps: ['phil-1.1'],
      refs: ['SEP “Aristotle’s Logic”'],
      credit: 'Aristotle, Prior Analytics (c. 350 BC); diagrams by John Venn, 1880',
      tags: ['logic', 'syllogism'],
      viz(v) {
        const PRE = {
          barbara: [{ q: 'A', a: 'M', b: 'P' }, { q: 'A', a: 'S', b: 'M' }, { q: 'A', a: 'S', b: 'P' }],
          darii: [{ q: 'A', a: 'M', b: 'P' }, { q: 'I', a: 'S', b: 'M' }, { q: 'I', a: 'S', b: 'P' }],
          bocardo: [{ q: 'O', a: 'M', b: 'P' }, { q: 'A', a: 'M', b: 'S' }, { q: 'O', a: 'S', b: 'P' }],
          darapti: [{ q: 'A', a: 'M', b: 'P' }, { q: 'A', a: 'M', b: 'S' }, { q: 'I', a: 'S', b: 'P' }],
          undist: [{ q: 'A', a: 'P', b: 'M' }, { q: 'A', a: 'S', b: 'M' }, { q: 'A', a: 'S', b: 'P' }],
          illicit: [{ q: 'A', a: 'M', b: 'P' }, { q: 'E', a: 'S', b: 'M' }, { q: 'E', a: 'S', b: 'P' }],
        };
        const clone = (k) => PRE[k].map((s) => ({ ...s }));
        let st = clone('barbara');
        const preset = v.select('', [{ value: 'barbara', label: 'Barbara' }, { value: 'darii', label: 'Darii' }, { value: 'bocardo', label: 'Bocardo' }, { value: 'darapti', label: 'Darapti' }, { value: 'undist', label: 'undistributed middle' }, { value: 'illicit', label: 'illicit major' }], 'barbara',
          { onChange: (k) => { st = clone(k); } });
        const imp = v.toggle('existential import (Aristotle)', false);
        const cm = v.toggle('show a counter-model', true);
        const L = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 340, weight: 1 });
        const D = v.stage({ x: [-1.9, 1.9], y: [-1.62, 1.92], equal: true, axes: false, height: 340, weight: 1.05 });
        const ROWY = [8.5, 6.9, 4.95];
        const TCOL = { S: 'blue', M: 'orange', P: 'purple' };
        L.onClick((x, y) => {
          ROWY.forEach((ry, k) => {
            if (Math.abs(y - ry) > 0.7) return;
            if (x > 0.9 && x < 3.1) { st[k].q = { A: 'E', E: 'I', I: 'O', O: 'A' }[st[k].q]; preset.set(''); }
            else if (k < 2 && x > 3.2 && x < 9.6) { [st[k].a, st[k].b] = [st[k].b, st[k].a]; preset.set(''); }
          });
        });
        // region centroids (for marks and counter-model dots)
        const acc = Array.from({ length: 8 }, () => [0, 0, 0]);
        for (let x = -1.9; x <= 1.9; x += 0.02) for (let y = -1.62; y <= 1.92; y += 0.02) { const r = vregion(x, y); if (r) { acc[r][0] += x; acc[r][1] += y; acc[r][2]++; } }
        const CEN = acc.map((a) => (a[2] ? [a[0] / a[2], a[1] / a[2]] : [1.5, 1.5]));
        // a point on the boundary between two regions that differ in one circle
        const boundary = (r1, r2) => {
          const diff = r1 ^ r2, T = Object.keys(VBIT).find((k) => VBIT[k] === diff); if (!T) return null;
          const [cx, cy] = VN[T], hits = [];
          for (let k = 0; k < 720; k++) {
            const t = (k / 720) * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
            const a = vregion(cx + (VN.r - 0.03) * c, cy + (VN.r - 0.03) * s), b = vregion(cx + (VN.r + 0.03) * c, cy + (VN.r + 0.03) * s);
            if ((a === r1 && b === r2) || (a === r2 && b === r1)) hits.push(t);
          }
          if (!hits.length) return null;
          const mx = v.M.mean(hits.map(Math.cos)), my = v.M.mean(hits.map(Math.sin)), t = Math.atan2(my, mx);
          return [cx + VN.r * Math.cos(t), cy + VN.r * Math.sin(t)];
        };
        const crit = (s) => { const out = []; for (let r = 1; r < 8; r++) { const hs = r & 4, hp = r & 1; if (((s.q === 'A' || s.q === 'O') && hs && !hp) || ((s.q === 'E' || s.q === 'I') && hs && hp)) out.push(r); } return out; };
        const figure = () => { const m1 = st[0].a === 'M', m2 = st[1].b === 'M'; return m1 && m2 ? 1 : !m1 && m2 ? 2 : m1 && !m2 ? 3 : 4; };
        let res = null, alt = null;
        const cross = (x, y, col = 'ink') => { D.text('✕', x, y, { align: 'center', size: 17, weight: 700, color: col }); };
        v.render(() => {
          res = syllo(st, imp.value); alt = syllo(st, !imp.value);
          const mood = st.map((s) => s.q).join(''), fig = figure(), name = SYLL[mood + fig];
          // ---- the three statements, as clickable rows
          L.text('quantifier', 2.0, 9.55, { align: 'center', size: 11, color: 'muted' });
          L.text('terms (click to swap)', 6.4, 9.55, { align: 'center', size: 11, color: 'muted' });
          st.forEach((s, k) => {
            const y = ROWY[k], [qw, cop] = QWORD[s.q];
            L.text(['1', '2', '∴'][k], 0.45, y, { align: 'center', size: k < 2 ? 13 : 19, weight: 700, color: k < 2 ? 'muted' : 'accent' });
            L.rect(1.0, y - 0.55, 3.0, y + 0.55, { fill: 'accent', fillAlpha: 0.08, color: 'accent', width: 1.4 });
            L.text(qw, 2.0, y, { align: 'center', size: 15, weight: 700, color: 'accent' });
            if (k < 2) L.rect(3.3, y - 0.55, 9.5, y + 0.55, { fill: 'muted', fillAlpha: 0.04, color: 'faint', width: 1 });
            L.text(s.a, 4.3, y, { align: 'center', size: 19, weight: 700, color: TCOL[s.a] });
            L.text(cop, 6.15, y, { align: 'center', size: 15, color: 'ink' });
            L.text(s.b, 8.2, y, { align: 'center', size: 19, weight: 700, color: TCOL[s.b] });
          });
          L.line(0.2, 5.9, 9.6, 5.9, { color: 'ink', width: 1.5 });
          L.text(`${mood}-${fig}${name ? '  ·  ' + name : ''}`, 5, 3.55, { align: 'center', size: 17, weight: 700, color: 'ink' });
          const verdict = (r) => (r.valid ? (r.models.length ? 'valid' : 'valid (premises inconsistent)') : 'invalid');
          const rows = [[false, imp.value ? alt : res], [true, imp.value ? res : alt]];
          rows.forEach(([withImp, r], m) => {
            const on = withImp === imp.value, y = 2.35 - m * 1.05;
            L.text(withImp ? 'with existential import:' : 'modern (Boolean) reading:', 4.9, y, { align: 'right', size: 12.5, weight: on ? 700 : 500, color: on ? 'ink' : 'muted' });
            L.text(verdict(r), 5.15, y, { size: 13.5, weight: 700, color: r.valid ? 'green' : 'red', alpha: on ? 1 : 0.6 });
          });
          // ---- the Venn diagram
          const empty = res.empty, cr = new Set(crit(st[2]));
          const hatch = v.rgb('muted'), tint = v.rgb('accent'), pan = v.rgb('panel');
          D.raster((x, y) => {
            const r = vregion(x, y); if (!r) return null;
            const base = cr.has(r) ? [pan[0] + (tint[0] - pan[0]) * 0.16, pan[1] + (tint[1] - pan[1]) * 0.16, pan[2] + (tint[2] - pan[2]) * 0.16] : null;
            if ((empty >> r) & 1) { const on = ((x + y) * 14) % 1 < 0.42 || ((x + y) * 14) % 1 < -0.58; return on ? [hatch[0], hatch[1], hatch[2], 150] : base ? [...base, 255] : [pan[0], pan[1], pan[2], 0]; }
            return base ? [...base, 255] : null;
          }, { res: 1, key: `${empty}|${[...cr].join()}` });
          for (const T of ['S', 'M', 'P']) D.circle(VN[T][0], VN[T][1], VN.r, { color: TCOL[T], width: 2.4 });
          D.tex('S', -1.62, -1.25, { color: TCOL.S, size: 20 }); D.tex('P', 1.62, -1.25, { color: TCOL.P, size: 20 }); D.tex('M', 1.05, 1.62, { color: TCOL.M, size: 20 });
          // marks for the particular premises (and for import)
          const marks = [];
          st.slice(0, 2).forEach((s) => {
            const X = VBIT[s.a], Y = VBIT[s.b], need = [];
            if (s.q === 'I' || s.q === 'O') for (let r = 1; r < 8; r++) { if ((r & X) && (s.q === 'I' ? r & Y : !(r & Y)) && !((empty >> r) & 1)) need.push(r); }
            else if (imp.value) for (let r = 1; r < 8; r++) { if ((r & X) && !((empty >> r) & 1)) need.push(r); }
            if (need.length) marks.push(need);
          });
          for (const need of marks) {
            if (need.length === 1) cross(...CEN[need[0]]);
            else if (need.length === 2) { const b = boundary(need[0], need[1]); if (b) cross(b[0], b[1]); }
          }
          // a counter-model
          if (cm.value && res.bad.length) {
            const m = res.bad.slice().sort((a, b) => bitsOf(a) - bitsOf(b))[0]; let c = 0;
            for (let r = 1; r < 8; r++) if ((m >> r) & 1) { const [x, y] = CEN[r]; D.dot(x + 0.13, y - 0.13, { r: 6, color: 'gold', label: 'abcdefg'[c++], labelPos: 'e' }); }
          }
          D.corner(res.valid ? 'the premises force the conclusion' : 'the premises do not force the conclusion', 'tr', { color: res.valid ? 'green' : 'red', weight: 600 });
        });
        v.legend([['muted', 'shaded: must be empty', { area: true }], ['accent', 'regions the conclusion is about', { area: true }], ['gold', 'counter-model: an occupied region', { dot: true }]]);
        v.readout(() => {
          if (!res) return '';
          const fig = figure(), mood = st.map((s) => s.q).join(''), name = SYLL[mood + fig];
          const head = `**${mood}-${fig}**${name ? ` (${name})` : ''} · of the $2^7 = 128$ ways of making the seven regions empty or occupied, ${res.models.length} satisfy both premises`;
          const tail = res.valid ? ` and the conclusion holds in every one → **valid**` : ` and the conclusion fails in ${res.bad.length} of them → **invalid**`;
          const other = res.valid === alt.valid ? ` (the same on the ${imp.value ? 'modern' : 'Aristotelian'} reading)` : ` — on the ${imp.value ? 'modern' : 'Aristotelian'} reading it is **${alt.valid ? 'valid' : 'invalid'}**`;
          return head + tail + ` ${imp.value ? 'with existential import' : 'on the modern reading'}` + other + '.';
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Concept',
      name: 'Formal fallacies: affirming the consequent',
      statement: String.raw`A **formal fallacy** is an argument form that looks like a valid one but is not valid. With a conditional premise $P\to Q$ there are four classic forms:
- **modus ponens** $P\to Q,\ P \;\therefore\; Q$ and **modus tollens** $P\to Q,\ \neg Q \;\therefore\; \neg P$ are valid;
- **affirming the consequent** $P\to Q,\ Q \;\therefore\; P$ and **denying the antecedent** $P\to Q,\ \neg P \;\therefore\; \neg Q$ are invalid.

Both fallacies have the same counterexample, the situation where $P$ is false and $Q$ is true, which makes their premises true and their conclusions false. When the premises are probable rather than certain, a fallacious form can still be inductively reasonable. Given the premises, the conclusion of affirming the consequent has probability $\Pr(P\mid Q)$, which can be high or low depending on how often $Q$ happens without $P$.`,
      idea: String.raw`Each form is checked against the four rows of the truth table for $P$ and $Q$ (validity, 1.1). The valid forms have no row with true premises and a false conclusion. The two fallacies each have exactly one, the row $P$ false and $Q$ true: a rash without measles, or rain-free wet streets. Probabilistically, accepting $P\to Q$ removes the region where $P\wedge\neg Q$, and the second premise then restricts attention to a region. The strength of the argument is the share of that region where the conclusion holds. For the valid forms this share is always 1. For affirming the consequent it is $\Pr(P\mid Q) = \Pr(P)\,/\,\bigl(\Pr(P)+\Pr(\neg P)\Pr(Q\mid\neg P)\bigr)$, the base-rate calculation of Bayes’ theorem. Treating a fallacious form as an inference to the best explanation, or as a probable inference, is reasonable in some contexts; how far this rehabilitates the fallacies is still debated.`,
      caption: String.raw`Pick a form. On the left, the four mini truth tables test each form row by row: green rows make the premises true, and a red row is a counterexample. Click any row (or a cell of the square) to select that situation everywhere. On the right, the unit square divides the patients by measles $P$ and rash $Q$, with areas set by the sliders. The outlined region is where the premises hold; green is where the conclusion is true as well, and red is where it is false. Make rashes from other causes rare and affirming the consequent becomes a strong (but still invalid) inference.`,
      deps: ['phil-1.1'],
      see: ['phil-6.2'],
      refs: ['SEP “Fallacies”'],
      tags: ['logic', 'fallacies', 'probability'],
      viz(v) {
        const form = v.select('form', FORMS4.map((f) => ({ value: f.id, label: f.name })), 'ac');
        const pP = v.slider('$\\Pr(P)$: base rate of measles', 0.02, 0.9, 0.12, { step: 0.01 });
        const pQ = v.slider('$\\Pr(Q\\mid\\neg P)$: rash from other causes', 0, 1, 0.25, { step: 0.01 });
        const L = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 350, weight: 1.25 });
        const R = v.stage({ x: [-0.16, 1.06], y: [-0.2, 1.12], axes: false, height: 350, weight: 1 });
        const REG = [[0.01, 0.52, 0.49, 0.9], [0.51, 0.52, 0.99, 0.9], [0.01, 0.03, 0.49, 0.41], [0.51, 0.03, 0.99, 0.41]];
        const TT = FORMS4.map((f, k) => v.table(L, { rows: 4, cols: 3, square: false, cellAspect: 1.55, maxCell: 23, size: 13, region: REG[k], cornerLabel: '$P\\ Q$',
          rowLabels: ['T T', 'T F', 'F T', 'F F'], colLabels: ['$P\\to Q$', `$${f.p2[0]}$`, `$\\therefore ${f.c[0]}$`] }));
        let world = 2; // P false, Q true
        L.onClick((x, y) => { TT.forEach((T) => { const c = T.hit(x, y); if (c && c.i >= 0) world = c.i; }); });
        R.onClick((x, y) => { if (x < 0 || x > 1 || y < 0 || y > 1) return; const a = pP.value; world = x < a ? 0 : y > 1 - pQ.value ? 2 : 3; });
        const rowsOf = (f) => W4.map((w) => { const p1 = !w.P || w.Q, p2 = f.p2[1](w), c = f.c[1](w); return { p1, p2, c, all: p1 && p2, bad: p1 && p2 && !c }; });
        let st = null;
        v.render(() => {
          const fsel = FORMS4.find((f) => f.id === form.value);
          FORMS4.forEach((f, k) => {
            const rs = rowsOf(f), valid = !rs.some((r) => r.bad), on = f === fsel, T = TT[k];
            T.draw({
              value: (i, j) => [rs[i].p1, rs[i].p2, rs[i].c][j],
              textColor: (i, j) => ([rs[i].p1, rs[i].p2, rs[i].c][j] ? 'ink' : 'muted'),
              fill: (i, j) => (rs[i].bad ? ['red', j === 2 ? 0.45 : 0.2] : rs[i].all ? ['green', 0.16] : null),
            });
            T.box(world, 0, world, 2, { color: 'gold', width: 2.2 });
            const [x0, , x1, y1] = [REG[k][0], 0, REG[k][2], REG[k][3]];
            L.text(`${f.name}: ${valid ? 'valid' : 'invalid'}`, (x0 + x1) / 2, y1 + 0.045, { align: 'center', size: 12.5, weight: on ? 700 : 600, color: valid ? 'green' : 'red' });
            if (on) { const g = T.geo; L.ctx.save(); L.ctx.strokeStyle = v.color('accent'); L.ctx.lineWidth = 2; L.ctx.setLineDash([5, 4]); L.ctx.strokeRect(g.X0 - g.lw - 6, g.Y0 - g.lh - 26, g.lw + 3 * g.cw + 12, g.lh + 4 * g.ch + 32); L.ctx.restore(); }
          });
          // ---- the probability square
          const a = pP.value, c = pQ.value;
          const cells = [ // [world index, x0, y0, x1, y1, label]
            [0, 0, 0, a, 1, 'P, Q'], [2, a, 1 - c, 1, 1, '¬P, Q'], [3, a, 0, 1, 1 - c, '¬P, ¬Q'],
          ];
          const prem = (wi) => { const w = W4[wi]; return fsel.p2[1](w); }, concl = (wi) => fsel.c[1](W4[wi]);
          let num = 0, den = 0;
          for (const [wi, x0, y0, x1, y1, lab] of cells) {
            const area = (x1 - x0) * (y1 - y0); if (area <= 0) continue;
            const inP = prem(wi), ok = concl(wi);
            if (inP) { den += area; if (ok) num += area; }
            R.rect(x0, y0, x1, y1, { fill: inP ? (ok ? 'green' : 'red') : 'muted', fillAlpha: inP ? 0.42 : 0.07, color: 'panel', width: 1.5 });
            if ((x1 - x0) * R.scale > 46 && (y1 - y0) * 300 > 26) R.text(`${lab}`, (x0 + x1) / 2, (y0 + y1) / 2 + 0.03, { align: 'center', size: 12.5, weight: 700, color: inP ? 'ink' : 'muted' });
            if ((x1 - x0) * R.scale > 46 && (y1 - y0) * 300 > 44) R.text(v.fix(area, 3), (x0 + x1) / 2, (y0 + y1) / 2 - 0.045, { align: 'center', size: 11, color: 'muted' });
          }
          // outline the premise region
          for (const [wi, x0, y0, x1, y1] of cells) if (prem(wi) && (x1 - x0) * (y1 - y0) > 0) R.rect(x0, y0, x1, y1, { color: 'accent', width: 2.6 });
          const wc = cells.find((cc) => cc[0] === world);
          if (wc) R.rect(wc[1], wc[2], wc[3], wc[4], { color: 'gold', width: 2.4, dash: [6, 4] });
          R.rect(0, 0, 1, 1, { color: 'ink', width: 1.2 });
          R.text('measles P', a / 2, -0.06, { align: 'center', size: 11.5, color: 'ink', weight: 600 });
          R.text('no measles ¬P', (1 + a) / 2, -0.06, { align: 'center', size: 11.5, color: 'ink', weight: 600 });
          R.text('rash', -0.02, 1 - c / 2, { align: 'right', size: 11.5, color: 'muted' });
          R.text('no rash', -0.02, (1 - c) / 2, { align: 'right', size: 11.5, color: 'muted' });
          R.text(`P ∧ ¬Q excluded by P → Q`, 0.5, -0.15, { align: 'center', size: 11, color: 'muted' });
          R.text(`strength = ${den > 0 ? v.fix(num / den, 3) : '—'}`, 0.5, 1.065, { align: 'center', size: 13, weight: 700, color: den > 0 && num / den > 0.999 ? 'green' : 'ink' });
          st = { fsel, strength: den > 0 ? num / den : null, a, c };
        });
        v.legend([['green', 'premises and conclusion true', { area: true }], ['red', 'premises true, conclusion false', { area: true }], ['accent', 'where the premises hold'], ['gold', 'selected situation', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { fsel, a, c } = st, ac = a / (a + (1 - a) * c), da = 1 - c, w = W4[world];
          const rs = rowsOf(fsel)[world];
          const wtxt = `Situation ${w.P ? 'measles' : 'no measles'}, ${w.Q ? 'rash' : 'no rash'}: ` + (rs.bad ? `premises of ${fsel.name} true, conclusion false — **its counterexample**` : rs.all ? `premises and conclusion of ${fsel.name} true` : `a premise of ${fsel.name} is false here`);
          return `*${fsel.en}* · Pr(conclusion | premises): modus ponens **1**, modus tollens **1**, affirming the consequent $\\Pr(P\\mid Q) = ${v.fix(ac, 3)}$, denying the antecedent $\\Pr(\\neg Q\\mid\\neg P) = ${v.fix(da, 3)}$ · ${wtxt}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Phenomenon',
      name: 'The Wason selection task',
      statement: String.raw`Four cards each have a letter on one side and a number on the other; you see **E**, **K**, **4** and **7**. Which cards must you turn over to find out whether the rule “if a card has a vowel on one side, it has an even number on the other” is true? Logically, only cards that could falsify the conditional matter: the vowel ($p$) and the odd number ($\neg q$). In Wason’s experiments and many replications, fewer than one person in ten chose exactly these. Most chose E and 4 ($p$ and $q$), or E alone.

When the same logical structure is about a familiar social rule, such as “if someone is drinking beer, they must be over 18”, with cards *beer, cola, 25, 16*, about three quarters of participants choose correctly (*beer* and *16*). The size of this **content effect** is well established; its explanation is not.`,
      idea: String.raw`A conditional $p\to q$ is false only when $p$ is true and $q$ false (1.3). So a card matters only if what is hidden could complete that combination: a vowel card might hide an odd number, and an odd card might hide a vowel. Turning the 4 cannot refute the rule, since a consonant behind it is allowed, so choosing it looks like seeking confirmation. Several explanations compete. Cosmides argued that people have a specialised ability to detect cheaters on social contracts. Cheng and Holyoak proposed learned schemas for permission and obligation. Oaksford and Chater reread the abstract task as choosing data to decide whether the rule is true at all: when vowels and even numbers are rare, turning the 4 is expected to be more informative than turning the 7, which reproduces the popular choice order. On that reading the typical answer is not simply an error, and whether it is remains debated.`,
      caption: String.raw`Click cards to select the ones you would turn, then press **Check my choice**: each card shows whether anything on its hidden side could falsify the rule, and your choices are marked needed, wasted or missed. The left chart shows roughly how often people pick each combination. The right chart computes Oaksford and Chater’s expected information gain for each card. Raise $\Pr(p)$ and $\Pr(q)$ (the rule’s terms become common) and the 7 overtakes the 4. Switch to the drinking-age rule to see the content effect.`,
      deps: ['phil-1.3'],
      refs: ['SEP “Fallacies”', 'Wason 1966, 1968', 'Griggs & Cox 1982', 'Oaksford & Chater 1994'],
      credit: 'Peter Wason, 1966',
      tags: ['reasoning', 'psychology'],
      viz(v) {
        const ver = v.select('version', [{ value: 'abs', label: 'abstract rule' }, { value: 'soc', label: 'drinking-age rule' }], 'abs', { onChange: () => { picked = new Set([0, 2]); shown = true; } });
        const C = v.stage({ x: [0, 12], y: [0, 5.2], axes: false, height: 236, full: true });
        const H = v.stage({ x: [0, 5], y: [0, 100], axes: 'box', height: 230, title: 'what people choose (approximate %)', yticks: [0, 25, 50, 75, 100] });
        const G = v.stage({ x: [0, 4], y: [0, 1], axes: 'box', height: 230, title: 'expected information gain per card (bits)' });
        const pa = v.slider('$\\Pr(p)$: share of vowels', 0.02, 0.5, 0.1, { step: 0.01 });
        const pb = v.slider('$\\Pr(q)$: share of even numbers', 0.02, 0.95, 0.2, { step: 0.01 });
        v.button('Check my choice', () => { shown = true; });
        v.button('Clear', () => { picked = new Set(); shown = false; });
        let picked = new Set([0, 2]), shown = true;
        const CX = [1.75, 4.58, 7.42, 10.25];
        C.onClick((x, y) => { CX.forEach((cx, k) => { if (Math.abs(x - cx) < 1.1 && y > 0.75 && y < 4.25) { if (picked.has(k)) picked.delete(k); else picked.add(k); shown = false; } }); });
        const ABS = [['p, q', 46], ['p', 33], ['p, q, not-q', 7], ['p, not-q', 4], ['other', 10]];
        const catOf = () => { const r = [...picked].sort().map((k) => ['p', 'not-p', 'q', 'not-q'][k]).join(', '); const i = ABS.findIndex((c) => c[0] === r); return i < 0 ? 4 : i; };
        let gains = null;
        v.render(() => {
          const soc = ver.value === 'soc', D = WASON[ver.value];
          pa.el.hidden = soc; pb.el.hidden = soc;
          C.text(D.rule, 6, 4.78, { align: 'center', size: 14, weight: 600, color: 'ink' });
          D.cards.forEach((cd, k) => {
            const cx = CX[k], on = picked.has(k), need = !!cd.bad;
            const col = !shown ? (on ? 'accent' : 'faint') : need ? (on ? 'green' : 'red') : on ? 'orange' : 'faint';
            C.rect(cx - 1.05, 0.8, cx + 1.05, 4.2, { fill: on ? 'accent' : 'muted', fillAlpha: on ? 0.12 : 0.05, color: col, width: on || (shown && need) ? 3 : 1.4 });
            C.text(cd.face, cx, 3.35, { align: 'center', size: cd.face.length > 2 ? 26 : 34, weight: 700, color: 'ink' });
            C.text(cd.sub, cx, 2.6, { align: 'center', size: 11.5, color: 'muted' });
            C.text(cd.role, cx, 0.42, { align: 'center', size: 12, weight: 600, color: 'muted' });
            if (shown) {
              C.text(`hidden: ${cd.back}`, cx, 1.95, { align: 'center', size: 10.5, color: 'muted' });
              C.text(need ? `${cd.bad} would falsify` : 'nothing can falsify', cx, 1.5, { align: 'center', size: 10.5, weight: 600, color: need ? 'red' : 'muted' });
              const tag = need ? (on ? '✓ needed' : '✗ missed') : on ? 'wasted' : '';
              if (tag) C.text(tag, cx, 1.03, { align: 'center', size: 12, weight: 700, color: need ? (on ? 'green' : 'red') : 'orange' });
            } else if (on) C.text('selected', cx, 1.2, { align: 'center', size: 12, weight: 700, color: 'accent' });
          });
          // ---- what people choose
          if (!soc) {
            H.setTicks(ABS.map((c, i) => [i + 0.5, c[0]]), null);
            const cur = catOf();
            ABS.forEach(([lab, val], i) => {
              const col = lab === 'p, not-q' ? 'green' : lab === 'other' ? 'muted' : 'accent';
              H.rect(i + 0.15, 0, i + 0.85, val, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
              H.text(`${val}`, i + 0.5, val + 4, { align: 'center', size: 12, weight: 700, color: col });
              if (i === cur) H.rect(i + 0.08, 0, i + 0.92, Math.max(val, 3) + 9, { color: 'gold', width: 2.4, dash: [5, 3] });
            });
            H.text('your choice', cur + 0.5, Math.max(ABS[cur][1], 3) + 15, { align: 'center', size: 11, weight: 600, color: 'gold' });
          } else {
            H.setTicks([[1.5, 'abstract rule'], [3.5, 'drinking-age rule']], null);
            [[1.5, 4, 'muted'], [3.5, 75, 'green']].forEach(([x, val, col]) => {
              H.rect(x - 0.6, 0, x + 0.6, val, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
              H.text(`≈ ${val}`, x, val + 4, { align: 'center', size: 12, weight: 700, color: col });
            });
            H.text('share choosing exactly p and not-q', 2.5, 93, { align: 'center', size: 11.5, color: 'muted' });
          }
          // ---- information gain (abstract) / can the card expose a violator (deontic)
          const faces = D.cards.map((c) => c.face);
          G.setTicks(faces.map((f, i) => [i + 0.5, f]), null);
          if (!soc) {
            G.setTitle('expected information gain per card (bits)');
            const a = pa.value, b = Math.max(pb.value, a);
            gains = [infoGain(1, b), infoGain((b - a) / (1 - a), b), infoGain(a / b, a), infoGain(0, a)];
            const order = gains.map((g, i) => [g, i]).sort((x, y) => y[0] - x[0]).map((x) => x[1]);
            gains.forEach((g, i) => {
              const col = ['accent', 'muted', 'orange', 'green'][i];
              G.rect(i + 0.15, 0, i + 0.85, g, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
              G.text(v.fix(g, 3), i + 0.5, g + 0.04, { align: 'center', size: 11.5, weight: 700, color: col });
              G.text(`#${order.indexOf(i) + 1}`, i + 0.5, 0.06, { align: 'center', size: 11, weight: 700, color: 'ink' });
            });
            if (pb.value < a) G.corner('Pr(q) raised to Pr(p): the rule needs Pr(q) ≥ Pr(p)', 'tr', { size: 10.5 });
          } else {
            G.setTitle('can the hidden side reveal a violator?');
            D.cards.forEach((cd, i) => {
              const val = cd.bad ? 1 : 0, col = cd.bad ? 'green' : 'muted';
              if (val) G.rect(i + 0.15, 0, i + 0.85, 0.9, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
              G.text(val ? 'yes' : 'no', i + 0.5, val ? 0.95 : 0.06, { align: 'center', size: 12, weight: 700, color: col });
            });
            gains = null;
          }
        });
        v.legend([['green', 'can falsify the rule (p, not-q)', { area: true }], ['orange', 'turned but cannot falsify', { area: true }], ['red', 'needed but not chosen', { area: true }], ['gold', 'your combination', { dash: true }]]);
        v.readout(() => {
          const D = WASON[ver.value], roles = [...picked].sort().map((k) => D.cards[k].face);
          const need = D.cards.map((c, k) => [c, k]).filter(([c]) => c.bad), ok = need.every(([, k]) => picked.has(k)) && picked.size === need.length;
          const head = `Your choice: **${roles.length ? roles.join(', ') : 'nothing'}**${shown ? (ok ? ' → correct: exactly the cards that could falsify the rule ✓' : ` → the cards that could falsify the rule are **${need.map(([c]) => c.face).join(' and ')}**`) : ' (press Check)'}`;
          if (!gains) return head + ' · in the deontic version the task is to find rule-breakers, and the two cards that can hide one are obvious to most people.';
          const order = gains.map((g, i) => [g, D.cards[i].face]).sort((x, y) => y[0] - x[0]).map((x) => x[1]).join(' > ');
          return head + ` · information gain order: **${order}**${order.startsWith('E > 4') ? ' — the order of people’s choices (p, then q, then not-q, then not-p)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Method',
      name: 'Argument mapping',
      statement: String.raw`An **argument map** draws reasoning as a directed graph. Boxes are claims and arrows are inferential relations: an arrow *supports* a claim when the claim at its tail is a reason for the claim at its head, and *attacks* it when it is an objection. Premises that are jointly needed form a **linked** argument and are joined before the arrow, while independent reasons for the same claim are **convergent** arrows. Objections can themselves be attacked by rebuttals. A map makes three things visible that prose hides: which basic premises are left unsupported, whether the conclusion rests on several independent lines or on a **single weak link**, and which objections remain unanswered.

To weigh a map one needs a model of how strengths combine. A simple probabilistic model: linked premises multiply their probabilities, an inference passes on a fixed fraction of its reason’s probability (its **inductive strength**), independent lines combine as $1-\prod(1-s_i)$, and an accepted objection defeats its target with its own probability.`,
      idea: String.raw`The structure decides how robust a conclusion is. A linked argument is only as strong as the product of its premises, so one doubtful premise ruins it. Convergent reasons back each other up, and losing one line costs little when others remain. Removing each basic premise in turn and recomputing the conclusion’s probability is a sensitivity analysis: the premise whose loss costs most is the critical link, and if its loss leaves nothing at all, the argument has a single point of failure. Objections and rebuttals form chains, and an answered objection loses most of its force. The numbers depend on the model chosen. Independence, noisy-OR combination and multiplicative defeat are simplifications, and the quantitative theory of argument strength (Bayesian, abstract argumentation semantics, and others) is an open research area. The structural lessons do not depend on these choices.`,
      caption: String.raw`The map reconstructs the *Crito*, where Socrates argues against escaping from prison. Click a basic premise to cycle its credence (0.1 → 0.95; shift-click goes down). Click an arrow to switch it between **support** (green, labelled with its inductive strength), **attack** (red) and **off**. Drag boxes to rearrange. The bars show each claim’s computed probability, and the gold ring marks the premise whose failure would hurt the conclusion most. Switch off the “harm to the city” line and the conclusion hangs on a single link.`,
      deps: ['phil-1.1'],
      refs: ['SEP “Fallacies”', 'Plato, Crito'],
      tags: ['arguments', 'reasoning'],
      viz(v) {
        const s = v.stage({ x: [0, 10], y: [-0.05, 6.25], axes: false, height: 410 });
        const CRED = [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95];
        const base = { R1: 0.8, R2: 0.9, R3: 0.6, O1: 0.6, B1: 0.7, O2: 0.3 };
        const SHORT = { C: 'conclusion', R1: 'agreement', R2: 'never break', R3: 'harm to city', O1: 'unjust verdict', B1: 'two wrongs', O2: 'children', J: 'linked pair' };
        const nodes = [
          { id: 'C', x: 5, y: 5.55, label: 'Socrates should not\nescape from prison' },
          { id: 'J', x: 2.95, y: 3.95, label: 'and', shape: 'circle', r: 14, labelPos: 'in' },
          { id: 'R1', x: 1.55, y: 2.3, label: 'Escaping would break a\njust agreement with the laws' },
          { id: 'R2', x: 4.45, y: 2.3, label: 'One must never break\na just agreement' },
          { id: 'R3', x: 7.05, y: 3.95, label: 'Escaping would\nharm the city' },
          { id: 'O2', x: 8.75, y: 5.55, label: 'He owes it to his\nchildren to stay alive' },
          { id: 'O1', x: 1.55, y: 0.6, label: 'The verdict was unjust,\nso the agreement is void' },
          { id: 'B1', x: 4.75, y: 0.6, label: 'Answering a wrong with\na wrong is still wrong' },
        ];
        const edges = [
          { from: 'R1', to: 'J', fixed: true, type: 'sup', w: 1 }, { from: 'R2', to: 'J', fixed: true, type: 'sup', w: 1 },
          { from: 'J', to: 'C', type: 'sup', w: 1 }, { from: 'R3', to: 'C', type: 'sup', w: 0.6 },
          { from: 'O2', to: 'C', type: 'att', w: 1 }, { from: 'O1', to: 'R1', type: 'att', w: 1 }, { from: 'B1', to: 'O1', type: 'att', w: 1 },
        ];
        const G = v.graph(s, { nodes, edges, directed: true, layout: 'none', shape: 'box', fontSize: 11.5, r: 12 });
        G.onClick = ({ node, edge, shift }) => {
          if (edge && !edge.fixed) edge.type = { sup: 'att', att: 'off', off: 'sup' }[edge.type];
          else if (node && base[node.id] != null) { const k = CRED.indexOf(base[node.id]); base[node.id] = CRED[(k + (shift ? CRED.length - 1 : 1)) % CRED.length]; }
          v.invalidate(); return true;
        };
        let a = null, crit = null, critC = null, spof = false;
        const roleOf = (id) => { const out = edges.find((e) => e.from === id); return out ? out.type : null; };
        v.render(() => {
          a = evalMap(base, edges);
          // sensitivity: knock out each basic premise in turn
          crit = null; critC = a.C; let best = 1e-9;
          for (const id of Object.keys(base)) {
            const b2 = { ...base, [id]: 0 }, c2 = evalMap(b2, edges).C, drop = a.C - c2;
            if (drop > best + 1e-9 || (Math.abs(drop - best) < 1e-9 && crit && a[id] < a[crit])) { best = drop; crit = id; critC = c2; }
          }
          spof = crit != null && critC < 1e-9 && a.C > 1e-9;
          G.draw({
            nodeColor: (id) => (id === 'C' ? 'accent' : id === 'J' ? 'green' : ({ sup: 'green', att: 'red', off: 'faint' })[roleOf(id)]),
            nodeRing: (id) => (id === crit ? 'gold' : null),
            edgeColor: (e) => ({ sup: 'green', att: 'red', off: 'faint' })[e.type],
            edgeWidth: (e) => (e.type === 'off' ? 1.2 : 2.4),
            edgeDash: (e) => (e.type === 'off' ? [4, 4] : null),
            edgeLabel: (e) => (e.fixed ? null : e.type === 'sup' ? `+${v.fix(e.w, 1)}` : e.type === 'att' ? '−' : 'off'),
            edgeLabelColor: (e) => ({ sup: 'green', att: 'red', off: 'muted' })[e.type],
          });
          // probability bars under each box
          const py = s.height / (s.bounds.y[1] - s.bounds.y[0]);
          for (const n of G.nodes) {
            if (n.id === 'J') continue;
            const hh = (2 * 11.5 * 0.62 + 5) / py, y = n.y - hh - 13 / py, w = 1.0, x0 = n.x - w / 2 - 0.25;
            s.rect(x0, y - 3 / py, x0 + w, y + 3 / py, { fill: 'faint', fillAlpha: 0.35, stroke: false });
            s.rect(x0, y - 3 / py, x0 + w * a[n.id], y + 3 / py, { fill: a[n.id] >= 0.5 ? 'green' : 'orange', fillAlpha: 0.9, stroke: false });
            s.text(v.fix(a[n.id], 2) + (base[n.id] != null && Math.abs(a[n.id] - base[n.id]) > 1e-9 ? ` (credence ${v.fix(base[n.id], 2)})` : base[n.id] != null ? ' credence' : ''), x0 + w + 0.08, y, { size: 10.5, weight: 600, color: 'muted' });
          }
          s.corner(spof ? `single point of failure: ${SHORT[crit]}` : crit ? `critical link: ${SHORT[crit]}` : '', 'tl', { color: spof ? 'red' : 'gold', weight: 700 });
        });
        v.legend([['green', 'support (inductive strength)'], ['red', 'attack'], ['faint', 'switched off', { dash: true }], ['gold', 'critical premise', { dot: true }]]);
        v.readout(() => {
          if (!a) return '';
          const inc = edges.filter((e) => e.to === 'C');
          const lines = inc.filter((e) => e.type === 'sup').map((e) => `${SHORT[e.from]} $${v.fix(e.w, 1)}\\times${v.fix(a[e.from], 2)}$`);
          const atts = inc.filter((e) => e.type === 'att').map((e) => `${SHORT[e.from]} $\\times(1-${v.fix(a[e.from], 2)})$`);
          return `Pr(conclusion) = **${v.fix(a.C, 2)}** · support lines: ${lines.length ? lines.join(', ') : 'none'}${lines.length > 1 ? ' (independent, combined as $1-\\prod(1-s_i)$)' : ''}${atts.length ? ' · objections: ' + atts.join(', ') : ''}` +
            (crit ? ` · if **${SHORT[crit]}** fails, Pr(conclusion) falls to **${v.fix(critC, 2)}**${spof ? ' — nothing else supports it' : ''}` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Paradox',
      name: 'What the Tortoise said to Achilles',
      statement: String.raw`Achilles offers the Tortoise two premises from Euclid, (A) “things that are equal to the same are equal to each other” and (B) “the two sides of this triangle are equal to the same”, and the conclusion (Z) “the two sides of this triangle are equal to each other”. The Tortoise accepts A and B but not Z. Achilles adds the premise (C) “if A and B are true, Z must be true”; the Tortoise accepts it, and still refuses Z until Achilles adds (D) “if A, B and C are true, Z must be true”, and so on without end.

The moral usually drawn is that a **rule of inference** cannot be replaced by a premise: if every step from premises to conclusion must itself be written down as another premise, no conclusion is ever reached. Something must license the step, and that something is not one more thing to believe.`,
      idea: String.raw`Each new premise has the form “if all the previous premises are true, Z is true”. It is itself one of the conditionals that a rule like modus ponens would be needed to *use*, so adding it reproduces exactly the situation it was meant to resolve. The regress is vicious, because the gap between the premises and Z is never narrowed. Written out in full the premises also grow explosively, since each contains all the earlier ones, and the $k$-th has $3\cdot2^{k-1}$ sentence letters. With rules of inference, the conclusion follows from A and B in two steps (instantiate A, then apply modus ponens), and the extra premises are idle. What justifies the rules themselves is a further and still contested question. A justification of deduction that uses deduction looks circular (Haack 1976), and the puzzle also connects to Wittgenstein’s rule-following considerations and to accounts of inference as an act rather than a belief.`,
      caption: String.raw`Step through the dialogue: each step Achilles writes one more premise, the Tortoise accepts it, and Z is still refused. The right panel plots, on a log scale, how many sentence letters each premise contains when written out in full; they double each time. Switch on **allow rules of inference**: Z now follows from A and B alone in two steps, and the growing list of extra premises is never used.`,
      deps: ['phil-1.1'],
      refs: ['Sainsbury', 'Carroll, Mind 1895'],
      credit: 'Lewis Carroll, 1895',
      tags: ['logic', 'regress'],
      viz(v) {
        const rule = v.toggle('allow rules of inference', false);
        const KMAX = 9;
        const Ls = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 350, weight: 1.65 });
        const Rs = v.stage({ x: [0.3, KMAX + 0.7], y: [1, 4000], ylog: true, axes: 'box', height: 350, weight: 1, title: 'sentence letters in each premise', xlabel: 'premise $C_k$', xticks: Array.from({ length: KMAX }, (_, i) => i + 1) });
        const letters = (k) => 3 * 2 ** (k - 1);
        const frames = [];
        for (let k = 0; k <= KMAX; k++) {
          const note = k === 0
            ? 'Achilles: A and B are true, so Z must be. Tortoise: I accept A and B — but why must I accept Z?'
            : k === 1 ? 'Achilles writes $C_1$: “if A and B are true, Z must be true.” The Tortoise accepts $C_1$ … and still refuses Z.'
              : `Achilles writes $C_{${k}}$: “if A, B, $C_1$, …, $C_{${k - 1}}$ are true, Z must be true.” Accepted. Z: still refused.`;
          frames.push({ k, note });
        }
        const S = v.steps({ frames, speed: 0.7, start: 3, still: 4 });
        const condTex = (j) => (j === 1 ? '(A\\wedge B)\\to Z' : j === 2 ? '(A\\wedge B\\wedge C_1)\\to Z' : j === 3 ? '(A\\wedge B\\wedge C_1\\wedge C_2)\\to Z' : `(A\\wedge B\\wedge C_1\\wedge\\cdots\\wedge C_{${j - 1}})\\to Z`);
        v.render(() => {
          const k = S.frame.k, on = rule.value;
          // which rows to show: A, B, C_1 … C_k (eliding the middle when long)
          const rows = [{ lab: 'A', en: 'Things equal to the same are equal to each other.' }, { lab: 'B', en: 'The two sides of this triangle are equal to the same.' }];
          const cs = Array.from({ length: k }, (_, i) => i + 1), show = cs.length > 5 ? [1, null, ...cs.slice(-4)] : cs;
          show.forEach((j) => rows.push(j == null ? { dots: true } : { lab: `C_{${j}}`, j }));
          const y0 = 9.3, dy = 0.86;
          rows.forEach((r, i) => {
            const y = y0 - i * dy;
            if (r.dots) { Ls.text('⋮', 0.75, y + 0.1, { align: 'center', size: 16, color: 'muted' }); return; }
            const newest = r.j === k && k > 0, idle = on && r.j;
            if (newest) Ls.rect(0.2, y - 0.38, 9.85, y + 0.38, { fill: 'gold', fillAlpha: 0.13, stroke: false });
            Ls.tex(r.lab, 0.75, y, { size: 15, color: idle ? 'faint' : r.j ? 'purple' : 'accent' });
            if (r.en) Ls.text(r.en, 1.45, y, { size: 12.5, color: 'ink' });
            else Ls.tex(condTex(r.j), 1.45, y, { align: 'left', size: 15, color: idle ? 'faint' : 'ink', alpha: idle ? 0.5 : 1 });
            Ls.text(idle ? 'idle' : 'accepted ✓', 9.8, y, { align: 'right', size: 11.5, weight: 600, color: idle ? 'faint' : 'green' });
          });
          const yb = y0 - rows.length * dy + 0.3;
          Ls.line(0.2, yb, 9.85, yb, { color: 'ink', width: 1.5 });
          const yz = yb - 0.8;
          Ls.rect(0.2, yz - 0.42, 9.85, yz + 0.42, { fill: on ? 'green' : 'red', fillAlpha: 0.1, color: on ? 'green' : 'red', width: 2, dash: on ? null : [6, 4] });
          Ls.tex('Z', 0.75, yz, { size: 15, color: on ? 'green' : 'red' });
          Ls.text('The two sides of this triangle are equal to each other.', 1.45, yz, { size: 12.5, color: 'ink' });
          Ls.text(on ? 'derived ✓' : 'refused ✗', 9.8, yz, { align: 'right', size: 11.5, weight: 700, color: on ? 'green' : 'red' });
          if (on) {
            Ls.arrow(0.32, y0, 0.32, yz + 0.45, { color: 'green', width: 2 });
            Ls.arrow(0.42, y0 - dy, 0.42, yz + 0.45, { color: 'green', width: 2 });
            Ls.text('rules: instantiate A, then modus ponens with B', 5, yz - 0.75, { align: 'center', size: 12, weight: 600, color: 'green' });
          } else Ls.text('Tortoise: “Write that down too, please.”', 5, yz - 0.75, { align: 'center', size: 12, color: 'red' });
          // ---- letters per premise, log scale
          for (let j = 1; j <= KMAX; j++) {
            const L = letters(j), done = j <= k;
            Rs.rect(j - 0.32, 1, j + 0.32, L, { fill: done ? (on ? 'faint' : 'purple') : 'faint', fillAlpha: done ? 0.55 : 0.12, color: done ? (on ? 'faint' : 'purple') : 'faint', width: 1 });
            if (done && j >= k - 2) Rs.text(String(L), j, L * 1.25, { align: 'center', size: 10.5, weight: 700, color: on ? 'muted' : 'purple' });
          }
          Rs.hline(3, { color: 'green', width: 2, dash: on ? null : [5, 4], alpha: on ? 1 : 0.6 });
          Rs.text('a derivation by rules uses A, B, Z only', KMAX + 0.55, 2.35, { align: 'right', size: 10.5, color: 'green' });
        });
        v.legend([['purple', 'premises added by Achilles'], ['green', 'what rules of inference need']]);
        v.readout(() => {
          const k = S.frame.k, on = rule.value, tot = 2 + (k ? 3 * (2 ** k - 1) : 0);
          return `Premises on the board: **${k + 2}**` + (k ? ` · the newest, $C_{${k}}$, has $3\\cdot2^{${k - 1}} = ${letters(k)}$ sentence letters written out in full; all premises together ${tot}` : '') +
            ` · steps from the premises to Z: ${on ? '**2** with rules of inference (using only A and B)' : '**none**: each premise is accepted and the gap to Z is exactly as wide as before'}.`;
        });
      },
    },
  ],
};
