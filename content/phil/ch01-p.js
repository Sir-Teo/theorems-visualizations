// Philosophy & Reasoning — Chapter 1 (paper): Aristotle, Prior Analytics

// ---- categorical logic: terms S (subject of the conclusion), M (middle), P (predicate); Venn regions coded S·4 + M·2 + P·1
const Q = ['A', 'E', 'I', 'O'];
const BIT = { S: 4, M: 2, P: 1 };
/** Term order of [major, minor] premise in each figure; the conclusion is always S–P. */
const FIG = { 1: [['M', 'P'], ['S', 'M']], 2: [['P', 'M'], ['S', 'M']], 3: [['M', 'P'], ['M', 'S']], 4: [['P', 'M'], ['M', 'S']] };
const prop = (q, a, b) => ({ q, a, b });
const WORDS = { A: (a, b) => `All ${a} are ${b}`, E: (a, b) => `No ${a} are ${b}`, I: (a, b) => `Some ${a} are ${b}`, O: (a, b) => `Some ${a} are not ${b}` };
const say = (p) => WORDS[p.q](p.a, p.b);
/** Truth of a categorical proposition in a model (bit r set ⇔ region r inhabited). */
function holds(st, m) {
  const X = BIT[st.a], Y = BIT[st.b]; let some = false;
  for (let r = 1; r < 8; r++) {
    if (!((m >> r) & 1)) continue;
    const hx = r & X, hy = r & Y;
    if (st.q === 'A' && hx && !hy) return false;
    if (st.q === 'E' && hx && hy) return false;
    if ((st.q === 'I' && hx && hy) || (st.q === 'O' && hx && !hy)) some = true;
  }
  return st.q === 'A' || st.q === 'E' ? true : some;
}
const nonEmpty = (m) => ['S', 'M', 'P'].every((t) => { for (let r = 1; r < 8; r++) if ((m >> r) & 1 && r & BIT[t]) return true; return false; });
/** Venn's method: try every one of the 2⁷ ways to inhabit the regions; valid ⇔ no model of the premises falsifies the conclusion. */
function check(mood, fig, imp) {
  const [ma, mi] = FIG[fig], P1 = prop(mood[0], ...ma), P2 = prop(mood[1], ...mi), C = prop(mood[2], 'S', 'P');
  const models = [], bad = [];
  for (let m = 0; m < 256; m += 2) { if (imp && !nonEmpty(m)) continue; if (holds(P1, m) && holds(P2, m)) { models.push(m); if (!holds(C, m)) bad.push(m); } }
  let empty = 0, full = 0;
  for (let r = 1; r < 8; r++) { if (models.every((m) => !((m >> r) & 1))) empty |= 1 << r; if (models.length && models.every((m) => (m >> r) & 1)) full |= 1 << r; }
  bad.sort((x, y) => popc(x) - popc(y));
  return { P1, P2, C, valid: models.length > 0 && bad.length === 0, bad, models, empty, full };
}
const popc = (m) => { let c = 0; for (let r = 1; r < 8; r++) c += (m >> r) & 1; return c; };
const NAMES = {
  AAA1: 'Barbara', EAE1: 'Celarent', AII1: 'Darii', EIO1: 'Ferio', AAI1: 'Barbari', EAO1: 'Celaront',
  EAE2: 'Cesare', AEE2: 'Camestres', EIO2: 'Festino', AOO2: 'Baroco', EAO2: 'Cesaro', AEO2: 'Camestrop',
  AAI3: 'Darapti', IAI3: 'Disamis', AII3: 'Datisi', EAO3: 'Felapton', OAO3: 'Bocardo', EIO3: 'Ferison',
  AAI4: 'Bramantip', AEE4: 'Camenes', IAI4: 'Dimaris', EAO4: 'Fesapo', EIO4: 'Fresison', AEO4: 'Camenop',
};
const ARISTOTLE = new Set(['Barbara', 'Celarent', 'Darii', 'Ferio', 'Cesare', 'Camestres', 'Festino', 'Baroco', 'Darapti', 'Felapton', 'Disamis', 'Datisi', 'Bocardo', 'Ferison']);
const CONTRA = { A: 'O', O: 'A', E: 'I', I: 'E' };
/** Conversion: simple (s) swaps the terms; per accidens (p) also weakens A → I, E → O. */
const conv = (p, kind) => (kind === 's' ? prop(p.q, p.b, p.a) : prop(p.q === 'A' ? 'I' : 'O', p.b, p.a));
/** First-figure conclusion from a major M–X and a minor Y–M (Barbara, Celarent, Darii, Ferio), or null. */
function fig1(ma, mi) {
  if (ma.a !== mi.b) return null;
  const q = { AA: 'A', EA: 'E', AI: 'I', EI: 'O' }[ma.q + mi.q];
  return q ? prop(q, mi.a, ma.b) : null;
}
const sameP = (x, y) => x.q === y.q && x.a === y.a && x.b === y.b;
/** Reduce a named mood to the first figure as its medieval name prescribes: s, p = convert the preceding proposition,
 *  m = swap the premises, c = reductio ad impossibile; the initial letter names the first-figure mood reached. */
function reduce(name, fig) {
  const mood = Object.keys(NAMES).find((k) => NAMES[k] === name).slice(0, 3);
  const low = name.toLowerCase(), vow = [...low].map((c, i) => ('aeio'.includes(c) ? i : -1)).filter((i) => i >= 0).slice(0, 3);
  const grp = vow.map((p, k) => low.slice(p + 1, k < 2 ? vow[k + 1] : undefined));
  const [ma0, mi0] = FIG[fig];
  let ma = prop(mood[0], ...ma0), mi = prop(mood[1], ...mi0);
  const C = prop(mood[2], 'S', 'P'), steps = [];
  if (grp[0].includes('c') || grp[1].includes('c')) {
    const onMajor = grp[0].includes('c'), nC = prop(CONTRA[C.q], C.a, C.b), dropped = onMajor ? ma : mi;
    let maj = onMajor ? nC : ma, min = onMajor ? mi : nC;
    if (!fig1(maj, min)) { const t = maj; maj = min; min = t; }
    const concl = fig1(maj, min);
    steps.push({ kind: 'c', nC, maj, min, concl, dropped });
    return { steps, ok: !!concl && concl.q === CONTRA[dropped.q] && concl.a === dropped.a && concl.b === dropped.b };
  }
  for (const k of [0, 1]) for (const ch of grp[k]) if (ch === 's' || ch === 'p') { const o = k ? mi : ma, n = conv(o, ch); if (k) mi = n; else ma = n; steps.push({ kind: ch, from: o, to: n }); }
  if ((grp[0] + grp[1]).includes('m')) { const t = ma; ma = mi; mi = t; steps.push({ kind: 'm' }); }
  const d = fig1(ma, mi);
  if (!d) return { steps, ok: false };
  steps.push({ kind: 'fig1', ma, mi, concl: d, name: { AAA: 'Barbara', EAE: 'Celarent', AII: 'Darii', EIO: 'Ferio' }[ma.q + mi.q + d.q] });
  let fin = d;
  for (const ch of grp[2]) if (ch === 's' || ch === 'p') { const o = fin; fin = conv(fin, ch); steps.push({ kind: 'conv', ch, from: o, to: fin }); }
  if (!sameP(fin, C) && (fin.q === 'A' || fin.q === 'E') && fin.a === C.a && fin.b === C.b) { const o = fin; fin = prop(fin.q === 'A' ? 'I' : 'O', fin.a, fin.b); steps.push({ kind: 'sub', from: o, to: fin }); }
  return { steps, ok: sameP(fin, C) };
}

export default {
  collection: 'phil',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Paper',
      name: 'Prior Analytics',
      paper: { authors: 'Aristotle', year: -350, title: 'Prior Analytics (Analytica Priora)', venue: 'c. 350 BCE; English translation by A. J. Jenkinson', url: 'https://classics.mit.edu/Aristotle/prior.html' },
      introduces: ['phil-1.1', 'phil-1.2'],
      credit: 'Aristotle, c. 350 BCE',
      statement: String.raw`The *Prior Analytics* is the first treatise of formal logic. Aristotle defines a **deduction** (syllogismos) as an argument in which, certain things being laid down, something other than them follows *of necessity* because they are so — the idea of validity (phil-1.1). He then studies the deductions built from two premises of the four forms "every $X$ is $Y$" (A), "no $X$ is $Y$" (E), "some $X$ is $Y$" (I), "some $X$ is not $Y$" (O), which share a middle term, arranged in three **figures** by the position of the middle (Book I, chs. 4–6). Going through every combination he finds exactly **fourteen** valid moods — four in the first figure, four in the second, six in the third — and rejects each of the others by exhibiting concrete terms for which the premises are true and the conclusion false. The four first-figure moods are "perfect", evident in themselves; the other ten he proves by **reducing** them to the first figure, by converting premises ("no $X$ is $Y$" ⇔ "no $Y$ is $X$"; "every $X$ is $Y$" ⇒ "some $Y$ is $X$") or, for two of them, *per impossibile*: assume the contradictory of the conclusion and deduce the contradictory of a premise (phil-1.2). Scope: the system presupposes that its terms are non-empty (existential import); in modern Boolean semantics 15 of the traditional 24 moods of four figures remain valid, and the logic of propositions and of relations lies outside it.`,
      idea: String.raw`Before Aristotle, Plato's dialectic and the sophists' debates had no theory of what makes an argument compelling. Aristotle's insight was that validity depends only on the **form** — he wrote the terms as letters, the first use of variables — so it can be tested once for all arguments of a shape. His procedure is a complete decision method for this fragment: every form is either reduced to a perfect one or refuted by a counter-example. Later tradition added the moods with weakened conclusions and the fourth figure (attributed to Galen), giving 24 valid forms in four figures, and in the 13th century the mnemonic names — *Barbara, Celarent, Darii, Ferio, …* — whose vowels give the mood and whose consonants encode Aristotle's reduction recipe. Venn's diagrams (1880) recast the same check as the emptiness or occupancy of eight regions, which is what the grid below computes for all 256 forms. Syllogistic was the core of logic for two thousand years until Boole and Frege; the question of existential import is exactly where modern logic parted from it.`,
      caption: String.raw`The grid holds all 256 forms: each row is a pair of premises (major, minor), each column a figure and a conclusion. Every cell is decided by Venn's method — all 128 ways of inhabiting the eight regions are tried. Green: valid on any reading; gold: valid only if the terms are non-empty (switch **existential import** off and they fail); thick outline: Aristotle's fourteen. **Click a cell**: the Venn diagram shows the regions the premises empty (grey) and must inhabit (✕), or a counter-model (gold dots); below it, the reduction to the first figure, step by step, that the medieval name encodes (s, p: convert; m: swap the premises; c: reductio).`,
      deps: [],
      refs: [],
      tags: ['logic', 'syllogism', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Prior_Analytics' },
      viz(v) {
        const imp = v.toggle('existential import (all three terms non-empty, as Aristotle assumed)', true);
        const mark = v.select('outline', [{ value: 'ar', label: 'Aristotle’s 14' }, { value: 'all', label: 'all 24 traditional moods' }], 'ar');
        const G = v.stage({ x: [0, 17.9], y: [-0.25, 18.2], axes: false, height: 440, weight: 1.05, minWidth: 340, hover: true, title: 'every mood in every figure, checked by Venn’s method' });
        const R = v.stage({ x: [0, 10], y: [0, 10.4], equal: true, axes: false, height: 440, weight: 1, minWidth: 320, title: 'the selected form' });
        let sel = { mood: 'AEE', fig: 2 };
        const cellX = (f, c) => 1.25 + (f - 1) * 4.15 + c * 1.0;
        const rowY = (i) => 15.45 - i;
        const pairs = Q.flatMap((a) => Q.map((b) => a + b));
        const hit = (x, y) => {
          const i = Math.round(15.45 - y); if (i < 0 || i > 15) return null;
          for (let f = 1; f <= 4; f++) for (let c = 0; c < 4; c++) { const x0 = cellX(f, c); if (x >= x0 && x <= x0 + 0.92) return { mood: pairs[i] + Q[c], fig: f }; }
          return null;
        };
        G.onClick((x, y) => { const h = hit(x, y); if (h) sel = h; });
        // Venn geometry and region centroids (computed once by sampling)
        const C3 = { S: [3.5, 8.0], P: [6.5, 8.0], M: [5, 5.7] }, RAD = 1.75;
        const inC = (t, x, y) => (x - C3[t][0]) ** 2 + (y - C3[t][1]) ** 2 < RAD * RAD;
        const region = (x, y) => (inC('S', x, y) ? 4 : 0) | (inC('M', x, y) ? 2 : 0) | (inC('P', x, y) ? 1 : 0);
        const cen = Array.from({ length: 8 }, () => [0, 0, 0]);
        for (let x = 1.5; x <= 8.5; x += 0.05) for (let y = 3.8; y <= 10; y += 0.05) { const r = region(x, y); if (r) { cen[r][0] += x; cen[r][1] += y; cen[r][2]++; } }
        const cxy = cen.map(([a, b, n]) => (n ? [a / n, b / n] : [0, 0]));
        const cache = new Map(), chk = (m, f, i) => { const k = m + f + i; if (!cache.has(k)) cache.set(k, check(m, f, i)); return cache.get(k); };
        let st = {};
        v.render(() => {
          const I = imp.value;
          // ---- grid
          for (let f = 1; f <= 4; f++) {
            G.text(`figure ${f}`, cellX(f, 1.95), 17.55, { align: 'center', size: 11.5, color: f === 4 ? 'purple' : 'ink', weight: 600 });
            Q.forEach((q, c) => G.text(q, cellX(f, c) + 0.46, 16.65, { align: 'center', size: 10.5, color: 'muted' }));
          }
          pairs.forEach((pq, i) => {
            const y = rowY(i);
            G.text(pq, 0.55, y, { align: 'center', size: 10.5, color: 'muted' });
            for (let f = 1; f <= 4; f++) Q.forEach((q, c) => {
              const mood = pq + q, x0 = cellX(f, c), name = NAMES[mood + f], v0 = chk(mood, f, false).valid, v1 = chk(mood, f, true).valid;
              const col = v0 ? 'green' : v1 ? (I ? 'gold' : 'red') : null;
              G.rect(x0, y - 0.44, x0 + 0.92, y + 0.44, { fill: col || 'faint', fillAlpha: col ? (col === 'red' ? 0.15 : 0.6) : 0.12, stroke: false, radius: 3 });
              const outl = name && (mark.value === 'all' || ARISTOTLE.has(name));
              if (outl) G.rect(x0, y - 0.44, x0 + 0.92, y + 0.44, { color: 'ink', width: 2, radius: 3 });
              if (sel.mood === mood && sel.fig === f) G.rect(x0 - 0.08, y - 0.52, x0 + 1.0, y + 0.52, { color: 'accent', width: 3, radius: 4 });
            });
          });
          const hv = G.pointer && G.pointer.inside ? hit(G.pointer.x, G.pointer.y) : null;
          if (hv) { const nm = NAMES[hv.mood + hv.fig]; G.text(`${hv.mood}-${hv.fig}${nm ? ' ' + nm : ''}`, Math.min(15.5, Math.max(2.5, G.pointer.x)), G.pointer.y + 0.75, { align: 'center', size: 11.5, color: 'accent', weight: 700 }); }
          // ---- selected form: Venn diagram
          const K = chk(sel.mood, sel.fig, I), name = NAMES[sel.mood + sel.fig];
          const shade = v.rgb('muted'), pan = v.rgb('panel');
          R.raster((x, y) => { const r = region(x, y); if (!r || !((K.empty >> r) & 1)) return null; return [pan[0] * 0.45 + shade[0] * 0.55, pan[1] * 0.45 + shade[1] * 0.55, pan[2] * 0.45 + shade[2] * 0.55, 230]; }, { res: 2, key: `${sel.mood}${sel.fig}${I}` });
          Object.entries(C3).forEach(([t, [x, y]]) => { R.circle(x, y, RAD, { color: t === 'M' ? 'purple' : t === 'S' ? 'accent' : 'orange', width: 2 }); });
          R.text('S', C3.S[0] - 1.45, C3.S[1] + 1.35, { size: 15, math: true, color: 'accent' });
          R.text('P', C3.P[0] + 1.45, C3.P[1] + 1.35, { size: 15, math: true, color: 'orange', align: 'right' });
          R.text('M', C3.M[0], C3.M[1] - 2.0, { size: 15, math: true, color: 'purple', align: 'center' });
          if (K.valid) { for (let r = 1; r < 8; r++) if ((K.full >> r) & 1) R.text('✕', cxy[r][0], cxy[r][1], { align: 'center', size: 16, color: 'ink', weight: 700 }); }
          else if (K.bad.length) { const m = K.bad[0]; for (let r = 1; r < 8; r++) if ((m >> r) & 1) R.dot(cxy[r][0], cxy[r][1], { r: 6, color: 'gold' }); }
          // ---- text: the form and its reduction
          const lines = [];
          lines.push([`${sel.mood}-${sel.fig}${name ? ` ${name}` : ''}${name && ARISTOTLE.has(name) ? ' (Aristotle)' : name ? ' (later tradition)' : ''}: ${K.valid ? 'valid' : 'invalid'}`, K.valid ? 'green' : 'red', 700]);
          lines.push([`${say(K.P1)};  ${say(K.P2)};  so ${say(K.C)}`, 'ink', 500]);
          if (K.valid && name) {
            const red = reduce(name, sel.fig);
            red.steps.forEach((s) => {
              if (s.kind === 's' || s.kind === 'p') lines.push([`${s.kind}: convert “${say(s.from)}” ${s.kind === 'p' ? 'per accidens ' : ''}→ “${say(s.to)}”`, 'muted', 500]);
              else if (s.kind === 'm') lines.push(['m: swap the two premises', 'muted', 500]);
              else if (s.kind === 'fig1') lines.push([`= ${s.name}${sel.fig === 1 ? ' (perfect)' : ''}: ${say(s.ma)}; ${say(s.mi)}; so ${say(s.concl)}`, 'accent', 600]);
              else if (s.kind === 'conv') lines.push([`${s.ch}: convert the conclusion → “${say(s.to)}” ✓`, 'green', 500]);
              else if (s.kind === 'sub') lines.push([`subalternation: “${say(s.from)}” → “${say(s.to)}” ✓`, 'green', 500]);
              else if (s.kind === 'c') {
                lines.push([`c: suppose not — “${say(s.nC)}”`, 'muted', 500]);
                lines.push([`Barbara: ${say(s.maj)}; ${say(s.min)}; so ${say(s.concl)}`, 'accent', 600]);
                lines.push([`which contradicts the premise “${say(s.dropped)}” ✓`, 'green', 500]);
              }
            });
            if (sel.fig === 1 && red.steps.length === 1 && red.steps[0].kind === 'fig1' && name !== red.steps[0].name) lines.push([`subalternation of ${red.steps[0].name}'s conclusion ✓`, 'green', 500]);
          } else if (!K.valid) {
            const okImp = chk(sel.mood, sel.fig, true).valid;
            lines.push([okImp && !I ? 'valid only if every term has members: the gold counter-model leaves a term empty' : 'gold dots: a counter-model — premises true, conclusion false', 'red', 500]);
          }
          lines.forEach(([t, c, w], k) => R.text(t, 0.1, 3.35 - k * 0.5, { size: 11, color: c, weight: w }));
          st = { I, K, name };
        });
        v.legend([['green', 'valid on any reading', { area: true }], ['gold', 'valid only with existential import', { area: true }], ['muted', 'regions the premises empty', { area: true }], ['gold', 'counter-model', { dot: true }]]);
        v.readout(() => {
          const { I } = st; if (I == null) return '';
          let n0 = 0, n1 = 0, ar = 0;
          for (let f = 1; f <= 4; f++) for (const a of Q) for (const b of Q) for (const c of Q) { const m = a + b + c; if (chk(m, f, false).valid) n0++; if (chk(m, f, true).valid) { n1++; if (ARISTOTLE.has(NAMES[m + f])) ar++; } }
          return `Venn's method on all 4 × 64 = 256 forms: valid on the modern (Boolean) reading **${n0}**; with existential import **${n1}** — the traditional 24 (Barbari, Celaront, Cesaro, Camestrop, Camenop, Darapti, Felapton, Bramantip and Fesapo need non-empty terms) · Aristotle's fourteen in three figures (4 + 4 + 6) are all among them (${ar} found) · his reductions: eight by conversion, Baroco and Bocardo *per impossibile*, Darapti and Felapton by conversion *per accidens*, which is exactly where existential import enters · ${I ? 'existential import on' : 'existential import off: the gold cells fail'}`;
        });
      },
    },
  ],
};
