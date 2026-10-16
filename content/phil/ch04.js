// Philosophy & Reasoning — Chapter 4: Self-reference and truth (items 4.1–4.5; the rest are in ch04-b.js)

export default {
  collection: 'phil',
  chapter: 4,
  title: 'Self-reference and truth',
  summary: String.raw`A sentence that says of itself that it is false cannot be consistently given a truth value, and the usual repairs invite a stronger version of the same puzzle (revenge). Tarski’s response is to stratify languages into levels, Kripke’s lets some sentences be neither true nor false and finds a least stage at which every grounded sentence has a value, and the dialetheist accepts that some contradictions are true and weakens logic so that this does no harm. Curry’s and Yablo’s paradoxes show that neither negation nor self-reference is essential to the trouble, the barber is a harmless cousin of Russell’s set, and the surprise examination and Fitch’s paradox bring the same pattern into knowledge. Diagonalisation is the single move behind Cantor’s, Russell’s, Gödel’s and Turing’s theorems.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Paradox',
      name: 'The strengthened liar and revenge',
      statement: String.raw`The **liar** is the sentence $L$: “$L$ is false.” If a sentence is true exactly when what it says is the case, then $L$ is true iff $L$ is false, so $L$ can be neither true nor false in a two-valued semantics. The obvious repair is to let such sentences fall into a **truth-value gap**: $L$ is neither true nor false. But then take the **strengthened liar** $S$: “$S$ is not true.” If $S$ is gappy, it is not true, which is exactly what it says, so it is true. If it is true, it is not true. If it is false, it is true. Every available status, gap included, is refuted. A repair that is made by adding a new status or a new notion (gap, ungrounded, meaningless) tends to generate a new liar that uses that notion: this is **revenge**.`,
      idea: String.raw`The reasoning uses only the **T-schema** (a sentence is true iff what it says holds) and the fact that the sentence refers to itself. Nothing in the logic is unusual, so something among the schema, self-reference and classical logic has to give: later items of the chapter take each in turn (Tarski bans the self-reference, Kripke keeps the schema but allows gaps, the dialetheist keeps everything and accepts the contradiction). The strengthened liar is the reason why “just call it gappy” is not enough: the gap theorist needs a way to say “not true” that is *exclusive* of gaps, and that very notion is what $S$ exploits. The puzzle is ancient (the Megarian school discussed it, and Eubulides of Miletus is traditionally credited with a version).`,
      caption: String.raw`Choose a sentence and a semantics. Each card assigns the sentence a status (true / false / gap) and compares it with the status of *what the sentence says* under that assignment: an assignment survives only if the two circles have the same colour. With two values, both liars have no surviving card. Allow a gap and the plain liar finds a home in it, but the strengthened liar again has none: switch between the two to see the revenge. The truth-teller shows the opposite problem: too many assignments survive.`,
      deps: ['logic-1.7'],
      refs: ['Sainsbury', 'SEP “Liar Paradox”'],
      credit: 'Ancient (Megarian school; Eubulides traditionally credited)',
      scope: String.raw`The gap semantics here is Kleene-style: the claim “I am false” is gappy when the sentence is gappy, while “I am not true” is read with an exclusion negation (true when the sentence is false *or* gappy). Other treatments of the liar exist; this card checks consistency, it does not say which one is right.`,
      tags: ['liar', 'truth', 'revenge'],
      links: { sep: 'https://plato.stanford.edu/entries/liar-paradox/' },
      verify: true,
      viz(v) {
        const sent = v.select('sentence', [{ value: 'L', label: 'liar' }, { value: 'S', label: 'strengthened liar' }, { value: 'T', label: 'truth-teller' }], 'L');
        const sem = v.select('semantics', [{ value: '2', label: 'two values' }, { value: '3', label: 'with a gap' }], '2');
        const COLS = ['T', 'F', 'G'];
        const NAME = { T: 'true', F: 'false', G: 'gap' };
        const SAY = { L: '“This sentence is false.”', S: '“This sentence is not true.”', T: '“This sentence is true.”' };
        // the value of what the sentence says, if the sentence itself has value x
        const claim = (k, x) => {
          if (k === 'L') return x === 'T' ? 'F' : x === 'F' ? 'T' : 'G';
          if (k === 'S') return x === 'T' ? 'F' : 'T';
          return x;
        };
        const COL = { T: 'green', F: 'red', G: 'muted' };
        const s = v.stage({ x: [0, 12], y: [0, 8.2], axes: false, height: 350, full: true });
        let ok = [];
        v.render(() => {
          const k = sent.value, three = sem.value === '3';
          ok = [];
          s.text(SAY[k], 6, 7.7, { align: 'center', size: 16, color: 'ink', weight: 600 });
          COLS.forEach((x, i) => {
            const x0 = i * 4 + 0.25, x1 = x0 + 3.5, xc = (x0 + x1) / 2, off = x === 'G' && !three;
            const c = claim(k, x), good = c === x && !off;
            if (good) ok.push(x);
            s.rect(x0, 0.5, x1, 6.9, { fill: off ? 'faint' : good ? 'green' : 'red', fillAlpha: off ? 0.05 : 0.09, color: off ? 'faint' : good ? 'green' : 'red', width: off ? 1 : 2, radius: 10, dash: off ? [5, 4] : null });
            s.text(`Suppose it is ${NAME[x]}`, xc, 6.3, { align: 'center', size: 14, weight: 700, color: off ? 'faint' : 'ink' });
            if (off) { s.text('no gaps allowed', xc, 3.7, { align: 'center', size: 13, color: 'faint' }); return; }
            s.dot(xc - 0.9, 4.4, { r: 22, color: COL[x], fill: COL[x] });
            s.dot(xc + 0.9, 4.4, { r: 22, color: COL[c], fill: COL[c] });
            s.text(x === 'G' ? 'gap' : x === 'T' ? 'true' : 'false', xc - 0.9, 4.4, { align: 'center', baseline: 'middle', size: 12, color: 'panel', weight: 700, halo: false });
            s.text(c === 'G' ? 'gap' : c === 'T' ? 'true' : 'false', xc + 0.9, 4.4, { align: 'center', baseline: 'middle', size: 12, color: 'panel', weight: 700, halo: false });
            s.arrow(xc - 0.45, 4.4, xc + 0.45, 4.4, { color: 'ink', width: 2 });
            s.text('its status', xc - 0.9, 3.45, { align: 'center', size: 11.5, color: 'muted' });
            s.text('status of its claim', xc + 0.9, 3.45, { align: 'center', size: 11.5, color: 'muted' });
            s.text(good ? '✓ consistent' : '✗ clash', xc, 1.9, { align: 'center', size: 16, weight: 700, color: good ? 'green' : 'red' });
            s.text(good ? 'status = status of its claim' : 'status ≠ status of its claim', xc, 1.15, { align: 'center', size: 12, color: 'muted' });
          });
        });
        v.legend([['green', 'true', { dot: true }], ['red', 'false', { dot: true }], ['muted', 'gap', { dot: true }]]);
        v.readout(() => {
          const k = sent.value;
          if (!ok.length) return `**No assignment survives** (${k === 'S' && sem.value === '3' ? 'the gap was the escape for the plain liar, but “not true” is true of a gappy sentence: this is revenge' : 'every status is refuted'}).`;
          return `Surviving assignments: **${ok.map((x) => NAME[x]).join(', ')}**.${ok.length > 1 ? ' More than one is consistent, so nothing fixes the status.' : ' The sentence has a stable status here.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Tarski’s hierarchy of object and meta-languages',
      statement: String.raw`Let $\mathcal L$ be a sufficiently expressive formal language with a way of naming its own sentences. **Tarski’s undefinability theorem** (logic 7.6) says that a truth predicate for $\mathcal L$ cannot be defined in $\mathcal L$ itself, on pain of a liar sentence. The philosophical response he proposed (the **hierarchy of languages**) is to give truth predicates only for a language lower in a sequence: a language $\mathcal L_0$ with no truth predicate, a metalanguage $\mathcal L_1$ with a predicate $T_1$ true of the true sentences of $\mathcal L_0$, $\mathcal L_2$ with $T_2$ for $\mathcal L_1$, and so on. A sentence which says that a sentence of level $j$ is true must live at some level $k>j$. Sentences whose truth-talk forms a cycle receive no level.`,
      idea: String.raw`In the hierarchy the T-schema holds for each level, restricted to the sentences below it, so the liar never gets off the ground: “$L$ is false” would need to sit at a level above itself. The cost is twofold. First, ordinary talk has no levels (“everything I say is true” may be about statements that are themselves about my statements), and the hierarchy rejects harmless sentences along with the pathological ones. Second, to say that the whole hierarchy is consistent we need a language above all of it, with no truth predicate of its own to speak about itself. Kripke’s examples of ordinary cyclic truth-talk (and his own theory in 4.3) were designed in response.`,
      caption: String.raw`Pick a small family of sentences. The right panel assigns each sentence the lowest level at which it can live (one more than the highest level of any sentence it speaks about), drawing an arrow from the speaker to the sentence it talks about. Sentences in a loop of truth-talk, or talking about one, drop to the rejected strip. The readout also counts, by brute force, how many classical truth-value assignments satisfy all the sentences if they were put in *one* language with one truth predicate: it is 0 for every liar-like family, and 2 for the truth-teller, which the hierarchy also rejects.`,
      deps: ['logic-7.6', 'phil-4.1'],
      refs: ['Sainsbury', 'SEP “Liar Paradox”'],
      credit: 'Alfred Tarski, 1933 (Polish), 1935 (German)',
      scope: String.raw`The families of sentences are small illustrations written for this item, not Tarski’s own examples. Tarski gave the hierarchy for formalised languages and was doubtful that it applied to natural language.`,
      tags: ['truth', 'hierarchy', 'tarski'],
      links: { sep: 'https://plato.stanford.edu/entries/liar-paradox/' },
      viz(v) {
        // each sentence: id, text, targets (ids it talks about), f(val) = value it asserts
        const EX = {
          chain: { label: 'ordinary chain', S: [
            { id: 'A', t: 'Snow is white.', tg: [], f: () => true },
            { id: 'B', t: 'A is true.', tg: ['A'], f: (x) => x.A },
            { id: 'C', t: 'B is true.', tg: ['B'], f: (x) => x.B },
            { id: 'D', t: 'A and C are true.', tg: ['A', 'C'], f: (x) => x.A && x.C }] },
          liar: { label: 'liar', S: [{ id: 'L', t: 'L is not true.', tg: ['L'], f: (x) => !x.L }] },
          pair: { label: 'pair', S: [
            { id: 'A', t: 'B is true.', tg: ['B'], f: (x) => x.B },
            { id: 'B', t: 'A is not true.', tg: ['A'], f: (x) => !x.A }] },
          teller: { label: 'truth-teller', S: [{ id: 'T', t: 'T is true.', tg: ['T'], f: (x) => x.T }] },
          mixed: { label: 'mixed', S: [
            { id: 'P', t: 'Snow is white.', tg: [], f: () => true },
            { id: 'Q', t: 'P is true.', tg: ['P'], f: (x) => x.P },
            { id: 'L', t: 'L is not true.', tg: ['L'], f: (x) => !x.L },
            { id: 'M', t: 'L is true or P is true.', tg: ['L', 'P'], f: (x) => x.L || x.P }] },
        };
        const pick = v.select('sentences', Object.entries(EX).map(([value, e]) => ({ value, label: e.label })), 'chain');
        const left = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330, weight: 1, minWidth: 250, title: 'the sentences' });
        const right = v.stage({ x: [-0.2, 10.2], y: [-1.45, 4.35], axes: false, height: 330, weight: 1.35, title: 'levels of the hierarchy' });
        const LV = ['₀', '₁', '₂', '₃'];
        let info = {};
        function levels(S) {
          const byId = Object.fromEntries(S.map((q) => [q.id, q])), lv = {}, state = {};
          const go = (id) => {
            if (id in lv) return lv[id];
            if (state[id] === 1) return (lv[id] = null);   // on the stack: a loop
            state[id] = 1;
            let m = -1, bad = false;
            for (const t of byId[id].tg) { const l = go(t); if (l == null) bad = true; else m = Math.max(m, l); }
            state[id] = 2;
            if (bad) { return (lv[id] = null); }
            return (lv[id] = m + 1);
          };
          S.forEach((q) => go(q.id));
          // a sentence on a cycle may have been cached before the loop was seen: recompute by reachability of a cycle
          return lv;
        }
        function models(S) {
          const n = S.length; let c = 0;
          for (let m = 0; m < 1 << n; m++) {
            const x = {}; S.forEach((q, i) => { x[q.id] = !!((m >> i) & 1); });
            if (S.every((q) => !!q.f(x) === x[q.id])) c++;
          }
          return c;
        }
        v.render(() => {
          const e = EX[pick.value], S = e.S, n = S.length, lv = levels(S);
          S.forEach((q, i) => {
            const y = 5.2 - i * 1.2, ok = lv[q.id] != null;
            left.dot(0.7, y, { r: 13, color: ok ? 'accent' : 'red', fill: ok ? 'accent' : 'red' });
            left.text(q.id, 0.7, y, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: 'panel', halo: false });
            left.text(`“${q.t}”`, 1.5, y + 0.12, { size: 13.5, color: 'ink' });
            left.text(ok ? `level ${lv[q.id]}` : 'no level: rejected', 1.5, y - 0.45, { size: 11.5, color: ok ? 'muted' : 'red' });
          });
          for (let k = 0; k < 4; k++) {
            right.rect(0, k, 10, k + 1, { fill: 'accent', fillAlpha: k % 2 ? 0.04 : 0.09, stroke: false });
            right.text(`L${LV[k]}${k === 0 ? ': no truth predicate' : `: T${LV[k]} applies to L${LV[k - 1]}`}`, 0.15, k + 0.18, { size: 11, color: 'muted' });
          }
          right.rect(0, -1.45, 10, -0.15, { fill: 'red', fillAlpha: 0.07, color: 'red', dash: [5, 4], width: 1 });
          right.text('rejected: no level', 0.15, -1.2, { size: 11, color: 'red' });
          const pos = {};
          S.forEach((q, i) => { const lev = lv[q.id]; pos[q.id] = [1.8 + i * (7.6 / Math.max(n - 1, 1)) * (n > 1 ? 1 : 0) + (n === 1 ? 3.2 : 0), lev == null ? -0.8 : lev + 0.55]; });
          S.forEach((q) => q.tg.forEach((t) => {
            const [x1, y1] = pos[q.id], [x2, y2] = pos[t];
            const bad = lv[q.id] == null;
            if (t === q.id) right.circle(x1 + 0.0, y1 + 0.5, 0.28, { color: 'red', width: 2, equal: false });
            else right.arrow(x1, y1 + (y2 > y1 ? 0.25 : -0.25), x2, y2 + (y2 > y1 ? -0.25 : 0.25), { color: bad ? 'red' : 'blue', width: 2 });
          }));
          S.forEach((q) => {
            const ok = lv[q.id] != null, [x, y] = pos[q.id];
            right.dot(x, y, { r: 14, color: ok ? 'accent' : 'red', fill: ok ? 'accent' : 'red' });
            right.text(q.id, x, y, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: 'panel', halo: false });
          });
          info = { rej: S.filter((q) => lv[q.id] == null).length, n, mod: models(S) };
        });
        v.legend([['blue', 'speaks about (arrow)', {}], ['red', 'rejected / loop', {}]]);
        v.readout(() => `${info.n - info.rej} of ${info.n} sentences get a level; ${info.rej} rejected.\nIn a single language with one truth predicate, the number of classical assignments that satisfy all ${info.n} sentences is **${info.mod}**${info.mod === 0 ? ' (the family is inconsistent there)' : info.mod > 1 ? ' (more than one: nothing fixes the truth value)' : ''}.`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Kripke’s fixed-point theory of truth',
      statement: String.raw`Kripke (1975) lets a language contain its own truth predicate $T$ and evaluates it in stages with a three-valued scheme (strong Kleene: a negation swaps true and false and keeps a gap; a disjunction is true if some disjunct is, false if both are, otherwise gappy). Start with $T$ true of nothing and false of nothing. At each stage, put into the extension of $T$ the sentences that are true under the current interpretation, and into its anti-extension those that are false. Because the construction is **monotone** (a sentence once settled stays settled), it reaches a **fixed point** at which $T$’s extension is exactly the set of true sentences, so the T-schema holds without restriction. The sentences settled along the way are the **grounded** ones; liars and truth-tellers are never settled.`,
      idea: String.raw`The point of the gap is monotonicity. With only two values, replacing $T$’s extension by “the true sentences” can undo itself: the liar goes in, makes itself false, goes out, makes itself true. With a gap, a sentence moves only from “undecided” to “true” or “false”, and by a standard argument any monotone operator on a partially ordered set of this kind (Kripke uses the ordinals) has a least fixed point. Tarski’s levels reappear as the *stage at which* a sentence is settled, but nobody has to choose them in advance, and the truth-teller is accommodated too (as ungrounded). The price is classical logic (the law of excluded middle fails for the liar) and the revenge problem of 4.1: the theory cannot say, in its own language, that the liar is not true.`,
      caption: String.raw`A toy language of eleven sentences (a–k) evaluated in stages. Drag the stage slider (or press Step). **Three-valued** (Kripke): a cell is green once the sentence is settled true, red once settled false, grey while undecided; it fills stage by stage and stops changing at the fixed point. g (the liar), h (the truth-teller), j and k stay grey forever. Switch to **two-valued** to run the same jump with only true and false: the liar flips every stage and no fixed point is ever reached, and early stages mark true sentences false just for not having been reached yet.`,
      deps: ['phil-4.2'],
      refs: ['SEP “Liar Paradox”'],
      credit: 'Saul Kripke, “Outline of a Theory of Truth”, J. Philosophy 72 (1975) 690–716',
      scope: String.raw`This is a finite toy: eleven sentences defined directly by their structure. Kripke’s theorem is about a full first-order language with a coding of syntax; the least fixed point there is reached after transfinitely many stages. The strong Kleene scheme is the scheme Kripke highlights, but he leaves open other schemes (for example supervaluation).`,
      tags: ['truth', 'fixed point', 'grounding'],
      links: { sep: 'https://plato.stanford.edu/entries/liar-paradox/' },
      viz(v) {
        // sentences: formulas over  atom(b), T(i), not, or
        const T = (i) => ({ k: 'T', i }), NOT = (a) => ({ k: 'not', a }), OR = (a, b) => ({ k: 'or', a, b }), AT = (b) => ({ k: 'at', b });
        const S = [
          { id: 'a', t: 'Snow is white.', f: AT(true) },
          { id: 'b', t: '2 + 2 = 5.', f: AT(false) },
          { id: 'c', t: 'a is true.', f: T(0) },
          { id: 'd', t: 'b is true.', f: T(1) },
          { id: 'e', t: 'd is not true.', f: NOT(T(3)) },
          { id: 'f', t: 'e is true.', f: T(4) },
          { id: 'g', t: 'g is not true. (liar)', f: NOT(T(6)) },
          { id: 'h', t: 'h is true. (truth-teller)', f: T(7) },
          { id: 'i', t: 'g is true or c is true.', f: OR(T(6), T(2)) },
          { id: 'j', t: 'g is true or g is not true.', f: OR(T(6), NOT(T(6))) },
          { id: 'k', t: 'j is true.', f: T(9) },
        ];
        const NS = 7;
        // value codes: 1 true, 0 false, .5 gap
        const ev = (f, E, A, two) => {
          switch (f.k) {
            case 'at': return f.b ? 1 : 0;
            case 'T': return E.has(f.i) ? 1 : two ? 0 : A.has(f.i) ? 0 : 0.5;
            case 'not': return 1 - ev(f.a, E, A, two);
            case 'or': return Math.max(ev(f.a, E, A, two), ev(f.b, E, A, two));
          }
        };
        const run = (two) => {
          const st = []; let E = new Set(), A = new Set();
          for (let k = 0; k < NS; k++) {
            st.push(S.map((_, i) => (E.has(i) ? 1 : A.has(i) ? 0 : 0.5)));
            const E2 = new Set(), A2 = new Set();
            S.forEach((q, i) => { const x = ev(q.f, E, A, two); if (x === 1) E2.add(i); else if (x === 0) A2.add(i); });
            if (two) { E = E2; A = new Set(); S.forEach((_, i) => { if (!E2.has(i)) A.add(i); }); } else { E = E2; A = A2; }
          }
          return st;
        };
        const mode = v.select('jump', [{ value: '3', label: 'three-valued (Kripke)' }, { value: '2', label: 'two-valued' }], '3');
        const stage = v.slider('stage', 0, NS - 1, 4, { int: true });
        v.button('Step', () => { stage.set(stage.value >= NS - 1 ? 0 : stage.value + 1); });
        const s = v.stage({ x: [0, 13], y: [-1.1, 11.6], axes: false, height: 400, full: true });
        const X0 = 5.6, DX = 1.05;
        let info = {};
        v.render(() => {
          const two = mode.value === '2', st = run(two), cur = stage.value;
          s.text('sentence', 0.1, 11.2, { size: 12, weight: 700, color: 'muted' });
          for (let k = 0; k < NS; k++) {
            s.text(`${k}`, X0 + k * DX + 0.5, 11.2, { align: 'center', size: 12, weight: 700, color: k === cur ? 'gold' : 'muted' });
          }
          s.text('stage →', X0 - 0.3, 11.2, { align: 'right', size: 11, color: 'muted' });
          S.forEach((q, i) => {
            const y = 10 - i;
            s.text(q.id, 0.25, y + 0.5, { size: 13, weight: 700, color: 'accent', baseline: 'middle' });
            s.text(q.t, 0.75, y + 0.5, { size: 12, color: 'ink', baseline: 'middle' });
            for (let k = 0; k < NS; k++) {
              const x = st[k][i], vis = k <= cur;
              const col = x === 1 ? 'green' : x === 0 ? 'red' : 'faint';
              s.rect(X0 + k * DX + 0.06, y + 0.07, X0 + (k + 1) * DX - 0.06, y + 0.93, { fill: vis ? col : 'faint', fillAlpha: vis ? (x === 0.5 ? 0.18 : 0.5) : 0.04, stroke: false, radius: 4 });
              if (vis) s.text(x === 1 ? 'T' : x === 0 ? 'F' : '·', X0 + k * DX + 0.5, y + 0.5, { align: 'center', baseline: 'middle', size: 12, weight: 700, color: x === 0.5 ? 'muted' : 'ink' });
            }
          });
          s.rect(X0 + cur * DX, -0.05, X0 + (cur + 1) * DX, 11.0, { color: 'gold', width: 2, fill: false });
          // find stabilisation stage
          let fix = null; for (let k = 1; k < NS; k++) if (st[k].every((x, i) => x === st[k - 1][i])) { fix = k - 1; break; }
          const flips = st.map((r) => r[6]);
          info = { two, fix, row: st[cur], flips };
        });
        v.readout(() => {
          const { two, fix, row } = info;
          const settled = row.filter((x) => x !== 0.5).length;
          if (two) return `Two-valued jump at stage ${stage.value}: the liar g reads ${info.row[6] === 1 ? 'true' : 'false'}, and it will read the opposite at the next stage. ${fix == null ? '**No fixed point** within the stages shown: the sequence never settles.' : `Fixed at stage ${fix}.`}`;
          return `Stage ${stage.value}: ${settled} of ${S.length} sentences settled. ${fix == null ? 'Still changing.' : `Fixed point reached at stage **${fix}**: a, b, c, d, e, f, i settled (grounded); g, h, j, k remain undecided forever.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Concept',
      name: 'Dialetheism and paraconsistent logic',
      statement: String.raw`A **dialetheia** is a sentence that is both true and false. **Dialetheism** (Graham Priest) holds that there are such sentences, the liar being the leading example: its truth follows from its falsity and conversely, so it is both. Classical logic cannot survive true contradictions, because it validates **explosion** (from $A$ and $\neg A$ infer any $B$), so the dialetheist uses a **paraconsistent** logic in which explosion fails. The simplest such system is Priest’s **Logic of Paradox (LP)**: sentences take one of three values $\mathsf T$, $\mathsf B$ (both) and $\mathsf F$, connectives are computed with $\neg x=1-x$, $\wedge=\min$, $\vee=\max$ on $\mathsf F=0<\mathsf B=\tfrac12<\mathsf T=1$, and an argument is valid iff every valuation that gives the premises a *designated* value ($\mathsf T$ or $\mathsf B$) gives the conclusion one.`,
      idea: String.raw`LP and Kleene’s strong three-valued logic $K_3$ have identical truth tables: they differ in what is designated. In $K_3$ only $\mathsf T$ is designated, so no sentence takes the middle value as an asserted truth, and the excluded middle fails (a gap is not designated). In LP the middle value is designated, so the excluded middle holds (it is never fully false) but explosion fails: let $A$ be $\mathsf B$ and $B$ be $\mathsf F$, so that $A$ and $\neg A$ are both designated while $B$ is not. Disjunctive syllogism and the material modus ponens fail for the same reason. The costs are that LP is weaker than classical logic in such inferences, and that it cannot express that anything is *only* false without the revenge of 4.1.`,
      caption: String.raw`Choose a logic and an inference. The table runs through every assignment of the three values to $A$ and $B$ (classical logic allows just $\mathsf T$ and $\mathsf F$, so rows with a middle value are greyed out). A row is shaded green when the premises are all designated and the conclusion is too, red when the premises are designated but the conclusion is not (a counterexample), and neutral (n/a) when a premise is not designated. The readout compares all three logics on the chosen inference: explosion survives in classical logic and $K_3$ but not in LP; the excluded middle survives in LP but not in $K_3$.`,
      deps: ['phil-4.1'],
      refs: ['Sainsbury', 'SEP “Dialetheism”'],
      credit: 'Priest, “The Logic of Paradox”, J. Phil. Logic 8 (1979) 219–241 (the three-valued system also in F. G. Asenjo, 1966)',
      scope: String.raw`LP is one paraconsistent logic among many, and the dialetheist attitude to the liar is a minority view. Here only the propositional part of LP is computed; the material conditional $A\to B$ is $\neg A\vee B$.`,
      tags: ['paraconsistency', 'dialetheism', 'logic'],
      links: { sep: 'https://plato.stanford.edu/entries/dialetheism/' },
      viz(v) {
        const logic = v.select('logic', [{ value: 'C', label: 'classical' }, { value: 'LP', label: 'LP (Priest)' }, { value: 'K3', label: 'K₃ (gaps)' }], 'LP');
        const INF = {
          exp: { label: 'explosion', prem: [(a) => a, (a) => 1 - a], concl: (a, b) => b, txt: ['A', '¬A'], c: 'B' },
          ds: { label: 'disj. syllogism', prem: [(a, b) => Math.max(a, b), (a) => 1 - a], concl: (a, b) => b, txt: ['A ∨ B', '¬A'], c: 'B' },
          mp: { label: 'modus ponens', prem: [(a) => a, (a, b) => Math.max(1 - a, b)], concl: (a, b) => b, txt: ['A', 'A → B'], c: 'B' },
          lem: { label: 'excluded middle', prem: [], concl: (a) => Math.max(a, 1 - a), txt: [], c: 'A ∨ ¬A' },
          ncon: { label: 'non-contradiction', prem: [], concl: (a) => 1 - Math.min(a, 1 - a), txt: [], c: '¬(A ∧ ¬A)' },
          add: { label: 'addition', prem: [(a) => a], concl: (a, b) => Math.max(a, b), txt: ['A'], c: 'A ∨ B' },
        };
        const inf = v.select('inference', Object.entries(INF).map(([value, e]) => ({ value, label: e.label })), 'exp');
        const VAL = [1, 0.5, 0];
        const desig = (L, x) => (L === 'LP' ? x >= 0.5 : x === 1);
        const allowed = (L, x) => L !== 'C' || x !== 0.5;
        const nm = (L, x) => (x === 1 ? 'T' : x === 0 ? 'F' : L === 'K3' ? 'N' : 'B');
        const verdict = (L, I) => {
          let bad = 0;
          for (const a of VAL) for (const b of VAL) {
            if (!allowed(L, a) || !allowed(L, b)) continue;
            if (I.prem.every((p) => desig(L, p(a, b))) && !desig(L, I.concl(a, b))) bad++;
          }
          return bad;
        };
        const s = v.stage({ x: [0, 12], y: [0, 11.2], axes: false, height: 400, full: true });
        v.render(() => {
          const L = logic.value, I = INF[inf.value];
          const cols = ['A', 'B', ...I.txt, I.c];
          const W = 12 / Math.max(cols.length + 1, 5);
          const xs = cols.map((_, i) => 0.5 + (i + 0.5) * W);
          s.text(`${I.txt.length ? I.txt.join(',  ') + '  ⊢  ' : '⊢  '}${I.c}`, 6, 10.7, { align: 'center', size: 16, weight: 700, color: 'ink' });
          cols.forEach((c, i) => s.text(c, xs[i], 9.65, { align: 'center', size: 13, weight: 700, color: i < 2 ? 'accent' : i === cols.length - 1 ? 'purple' : 'muted' }));
          const xv = xs[cols.length - 1] + W * 0.9;
          s.text('verdict', Math.min(xv, 11.2), 9.65, { align: 'center', size: 13, weight: 700, color: 'muted' });
          s.hline(9.2, { color: 'faint', width: 1 });
          let r = 0;
          for (const a of VAL) for (const b of VAL) {
            const y = 8.6 - r * 0.92; r++;
            const off = !allowed(L, a) || !allowed(L, b);
            const pv = I.prem.map((p) => p(a, b)), cv = I.concl(a, b);
            const pOk = pv.every((x) => desig(L, x)), cOk = desig(L, cv);
            const bad = !off && pOk && !cOk, good = !off && pOk && cOk;
            if (!off && (bad || good)) s.rect(0.2, y - 0.4, 11.8, y + 0.4, { fill: bad ? 'red' : 'green', fillAlpha: bad ? 0.18 : 0.1, stroke: false, radius: 4 });
            const vals = [a, b, ...pv, cv];
            vals.forEach((x, i) => {
              const d = desig(L, x);
              s.text(nm(L, x), xs[i], y, { align: 'center', baseline: 'middle', size: 14, weight: d ? 700 : 400, color: off ? 'faint' : d ? 'ink' : 'muted', alpha: off ? 0.5 : 1 });
            });
            s.text(off ? '—' : bad ? 'counterexample' : good ? 'ok' : 'n/a', Math.min(xv, 11.2), y, { align: 'center', baseline: 'middle', size: 11.5, weight: bad ? 700 : 400, color: off ? 'faint' : bad ? 'red' : good ? 'green' : 'muted' });
          }
          s.text(L === 'LP' ? 'designated: T and B' : 'designated: T only', 0.3, 0.4, { size: 11.5, color: 'muted' });
          s.text(L === 'C' ? 'values: T, F' : `values: T, ${L === 'K3' ? 'N (neither)' : 'B (both)'}, F`, 11.8, 0.4, { align: 'right', size: 11.5, color: 'muted' });
        });
        v.readout(() => {
          const I = INF[inf.value];
          const parts = [['C', 'classical'], ['LP', 'LP'], ['K3', 'K₃']].map(([L, n]) => `${n}: ${verdict(L, I) === 0 ? '**valid**' : 'invalid'}`);
          return `${I.label}: ${parts.join(' · ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Paradox',
      name: 'Curry’s paradox',
      statement: String.raw`Let $F$ be any sentence, however absurd, and let $C$ be a sentence that says: “If $C$ is true, then $F$.” (Self-reference of this kind is available in any theory strong enough to code its own syntax, or in naive truth theory with the T-schema.) Then $F$ can be proved by the following steps, which use only modus ponens, conditional proof, and the freedom to use an assumption twice (**contraction**): assume $C$; then what $C$ says holds, so $C\to F$; by modus ponens, $F$. Discharging the assumption gives $C\to F$, which is $C$; applying modus ponens to $C$ and $C\to F$ gives $F$. Since $F$ was arbitrary, the theory proves everything. No negation appears anywhere in the argument.`,
      idea: String.raw`Curry’s paradox matters because it blocks the dialetheist’s way out. Paraconsistent logics with a naive truth predicate disarm explosion by weakening the rules for negation, but Curry’s argument never touches negation: it needs the T-schema (to move between $C$ and $C\to F$), modus ponens, conditional proof, and contraction. So a theory of naive truth must give up one of *those*: most proposals give up contraction (used where the assumption $C$ is used twice, once as a premise and once to derive $C\to F$) or the conditional-proof step. For the classical material conditional, the argument shows more simply that there is no consistent truth-value for $C$ when $F$ is false.`,
      caption: String.raw`Step through the derivation (the ◀ ▶ buttons or the scrubber) and see which earlier lines each line uses; the badge counts how many times the assumption $C$ is used. Pick a consequent $F$ (all of them get proved!). Turn off **contraction** and the derivation stops at the line that needs $C$ twice. The small panel below tests whether the classical material conditional could give $C$ a truth value at all: with a false $F$ no value works, which is the liar again, while a true $F$ has a harmless solution.`,
      deps: ['phil-4.1'],
      refs: ['SEP “Curry’s Paradox”'],
      credit: 'Haskell B. Curry, “The inconsistency of certain formal logics”, J. Symbolic Logic 7 (1942) 115–117 (the name “Curry’s paradox” seems to be later)',
      scope: String.raw`Applies to any theory with an unrestricted T-schema (or an equivalent self-referential conditional), modus ponens, conditional proof and contraction. It is not a feature of classical set theory with restricted comprehension.`,
      tags: ['paradox', 'contraction', 'truth'],
      links: { sep: 'https://plato.stanford.edu/entries/curry-paradox/' },
      viz(v) {
        const F = v.select('consequent $F$', [
          { value: 'cheese', label: 'the moon is cheese' },
          { value: 'zero', label: '2 + 2 = 5' },
          { value: 'snow', label: 'snow is white' }], 'cheese');
        const contr = v.toggle('allow contraction', true);
        const FT = { cheese: 'The moon is made of cheese', zero: '2 + 2 = 5', snow: 'Snow is white' };
        const FV = { cheese: false, zero: false, snow: true };
        const frames = [
          { k: 0, note: () => 'Let $C$ be the sentence “If $C$ is true then $F$”.' },
          { k: 1, note: () => 'Assume $C$ is true (for conditional proof).' },
          { k: 2, note: () => 'Then what $C$ says holds: $C\\to F$ (T-schema).' },
          { k: 3, note: () => contr.value ? 'Modus ponens on 1 and 2 gives $F$. The assumption $C$ was used twice (contraction).' : '**Blocked:** modus ponens needs $C$ both as the antecedent and as the source of line 2, so $C$ is used twice. Without contraction the derivation stops here.' },
          { k: 4, note: () => 'Discharge the assumption: $C\\to F$ (conditional proof, lines 1–3).' },
          { k: 5, note: () => 'But that is what $C$ says, so $C$ is true (T-schema).' },
          { k: 6, note: () => 'Modus ponens on 5 and 4: $F$, outright. $F$ was arbitrary.' },
        ];
        const S = v.steps({ frames, speed: 0.8, start: 0, still: 6 });
        const D = v.stage({ x: [0, 12], y: [0, 9], axes: false, height: 330, full: true });
        const M = v.stage({ x: [0, 12], y: [0, 4.4], axes: false, height: 190, full: true, title: 'could $C$ have a classical truth value?' });
        const lines = [
          (f) => ['Definition', `C  :=  (C → ${f})`, 'by self-reference'],
          () => ['1.', 'C', 'assumption'],
          (f) => ['2.', `C → ${f}`, 'from 1 (what C says)'],
          (f) => ['3.', f, 'MP 1, 2   (C used twice)'],
          (f) => ['4.', `C → ${f}`, 'discharge 1 (conditional proof)'],
          () => ['5.', 'C', 'from 4 (what C says)'],
          (f) => ['6.', f, 'MP 5, 4   — proved outright'],
        ];
        let used = 0;
        v.render(() => {
          const k = S.frame.k, f = FT[F.value], nc = !contr.value;
          lines.forEach((ln, i) => {
            const y = 8.1 - i * 1.12, [a, b, c] = ln(f);
            const visible = i <= k, blocked = nc && i >= 3;
            const col = !visible ? 'faint' : blocked ? 'red' : i === k ? 'gold' : 'ink';
            if (visible && i === k) D.rect(0.2, y - 0.45, 11.8, y + 0.45, { fill: blocked ? 'red' : 'gold', fillAlpha: 0.13, stroke: false, radius: 5 });
            D.text(a, 0.4, y, { baseline: 'middle', size: 13, color: visible ? 'muted' : 'faint', weight: 600 });
            D.text(b, 2.0, y, { baseline: 'middle', size: 15, color: col, weight: i === 6 ? 700 : 400 });
            D.text(visible ? (blocked && i === 3 ? 'blocked: contraction needed' : blocked ? '(unreachable)' : c) : '', 11.7, y, { align: 'right', baseline: 'middle', size: 12, color: blocked ? 'red' : 'muted' });
          });
          used = k >= 3 && !nc ? 2 : k >= 1 ? 1 : 0;
          D.text(`uses of assumption C: ${used}`, 0.4, 0.35, { size: 12.5, color: used > 1 ? 'orange' : 'muted', weight: 600 });
          // classical check: C ↔ (C → F)
          const fv = FV[F.value];
          [true, false].forEach((c, i) => {
            const y = 3.0 - i * 1.15, cond = !c || fv, ok = cond === c;
            M.text(`C = ${c ? 'true' : 'false'}`, 0.4, y, { baseline: 'middle', size: 13, color: 'ink' });
            M.text(`C → F is ${cond ? 'true' : 'false'}`, 3.3, y, { baseline: 'middle', size: 13, color: 'ink' });
            M.text(ok ? '✓ matches' : '✗ C and C → F differ', 7.0, y, { baseline: 'middle', size: 13, weight: 700, color: ok ? 'green' : 'red' });
          });
          M.text(fv ? 'F is true: C = true is a harmless solution' : 'F is false: no value works, as for the liar', 11.8, 0.3, { align: 'right', size: 12, color: fv ? 'green' : 'red' });
        });
        v.readout(() => `Line ${S.frame.k}: the derivation ${contr.value ? (S.frame.k === 6 ? `proves “${FT[F.value]}”` : 'is in progress') : S.frame.k >= 3 ? 'is stuck at line 3 without contraction' : 'is in progress'}. No line contains a negation.`);
      },
    },
  ],
};
