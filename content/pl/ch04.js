// Programming Languages & Types — Chapter 4: Types and type safety (items 4.1–4.5; 4.6–4.9 in ch04-b.js, 4.10–4.13 in ch04-c.js)
import {
  NB, derive, derivNodes, firstFail, TY_RULES, fromNB, tStr, tx, tyStr, nbType, nbStep, nbRun, nbRunFinal, NB_MODES, nbCensus,
  drawDeriv, hitDeriv, drawRuleSchema, drawSegs, drawChips, hitChip, drawTally, hitCell, drawParseError, wrapText, field, pxStage,
} from './ch04.shared.js';

const nbField = (v, label, def, onChange, width = 380) => field(v, label, def, NB.parseNB, { width, onChange });
const ok = (b) => (b ? '✓' : '✗');
const nbTex = (t) => tx(NB.str(t));
const NB_EX = ['if iszero 0 then succ 0 else pred 2', 'if 0 then true else false', 'succ (iszero 0)', 'if true then 0 else false', 'pred (succ (succ 0))'];

export default {
  collection: 'pl',
  chapter: 4,
  title: 'Types and type safety',
  summary: String.raw`A type system is a static approximation of run-time behaviour, assigning types by syntax-directed rules. Safety is proved in two halves: progress (a well-typed term is a value or can step) and preservation (stepping keeps its type), so well-typed programs never get stuck. For the simply typed λ-calculus types are unique, checking is easy, every program terminates and types can be erased before running — but, as Rice’s theorem forces, some safe programs are rejected.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Definition', name: 'The typing relation',
      statement: String.raw`Take the arithmetic-and-boolean language of chapter 1 and two types, $\mathsf{Bool}$ and $\mathsf{Nat}$. The **typing relation** $\vdash t : T$ is the smallest relation closed under these rules:
- $\vdash \mathtt{true}:\mathsf{Bool}$, $\ \vdash \mathtt{false}:\mathsf{Bool}$, $\ \vdash 0:\mathsf{Nat}$ (T-True, T-False, T-Zero);
- if $\vdash t_1:\mathsf{Nat}$ then $\vdash \mathtt{succ}\,t_1:\mathsf{Nat}$, $\ \vdash \mathtt{pred}\,t_1:\mathsf{Nat}$ and $\ \vdash \mathtt{iszero}\,t_1:\mathsf{Bool}$ (T-Succ, T-Pred, T-IsZero);
- if $\vdash t_1:\mathsf{Bool}$, $\vdash t_2:T$ and $\vdash t_3:T$ then $\vdash \mathtt{if}\,t_1\,\mathtt{then}\,t_2\,\mathtt{else}\,t_3 : T$ (T-If).

A term is **well typed** if $\vdash t:T$ for some $T$. There is exactly one rule per way of building a term, so a typing derivation is a tree with the same shape as the term.`,
      idea: String.raw`A type is a cheap prediction of what a term will evaluate to (a boolean, a number) made without running it. Because the rules are syntax-directed, the prediction is computed by recursion on the term: build the derivation tree from the leaves up, and fail at the first node whose rule does not apply. T-If is the interesting rule: it demands that the two branches have the *same* type, so the type of the whole expression does not depend on which branch will run. The derivations are the inference-rule trees of 1.3, and the relation is what progress and preservation (4.3, 4.4) are about.`,
      caption: String.raw`Type a term or pick an example. The derivation is built from the leaves up. In an ill-typed term the rule that cannot be applied is red, and everything below it, which has no type because of it, is orange. Click any node to see its rule schema and, if it failed, why.`,
      deps: ['pl-1.4', 'pl-1.3'], refs: ['Pierce §8.2'], tags: ['typing', 'derivations'],
      viz(v) {
        const sD = pxStage(v, { height: 320, full: true, title: 'Typing derivation' });
        const sR = pxStage(v, { height: 92, full: true, title: 'Rule of the selected node' });
        let sel = null, info = null, D = null;
        const f = nbField(v, 'term', NB_EX[0], () => { sel = null; v.invalidate(); });
        const ex = v.select('Examples', NB_EX.map((s, i) => ({ value: String(i), label: ['arith', 'if 0', 'succ bool', 'mixed branches', 'pred chain'][i] })), '0', { onChange: () => f.set(NB_EX[+ex.value]) });
        sD.onClick((x, y) => { if (!info) return; const n = hitDeriv(info, sD.X(x), sD.Y(y)); if (n) { sel = n; v.invalidate(); } });
        v.render(() => {
          D = null; info = null;
          if (f.err) { drawParseError(v, sD, f.src, f.err); sR.textPx('fix the term to see its derivation', sR.W / 2, sR.H / 2, { size: 13, color: 'muted', align: 'center' }); return; }
          D = derive(fromNB(f.ast), [], { turn: false });
          if (sel && !derivNodes(D).some((n) => n.c === sel.c && n.rule === sel.rule)) sel = null;
          const selNode = sel ? derivNodes(D).find((n) => n.c === sel.c && n.rule === sel.rule) : null;
          info = drawDeriv(v, sD, D, { color: (n) => (n.fail ? 'red' : n.open ? 'orange' : n.ty && n.ty.k === 'B' ? 'accent' : 'ink'), ring: (n) => (selNode && n.c === selNode.c && n.rule === selNode.rule ? 'gold' : null) });
          if (selNode) {
            drawRuleSchema(v, sR, selNode.rule, TY_RULES, sR.W / 2, 22, { color: selNode.fail ? 'red' : 'ink', size: 13 });
            if (selNode.msg) sR.textPx(selNode.msg, sR.W / 2, sR.H - 10, { size: 12, color: 'red', align: 'center', halo: false });
          } else sR.textPx('click a node of the derivation', sR.W / 2, sR.H / 2, { size: 13, color: 'muted', align: 'center', halo: false });
        });
        v.legend([['accent', 'type Bool', { dot: true }], ['ink', 'type Nat', { dot: true }], ['red', 'rule cannot be applied', { dot: true }], ['orange', 'blocked: has no type', { dot: true }]]);
        v.readout(() => {
          if (!D) return 'Enter a term of the language (true, false, 0, numerals, succ, pred, iszero, if).';
          const n = derivNodes(D).length;
          if (D.ty) return `$\\vdash ${nbTex(f.ast)} : \\mathsf{${tyStr(D.ty)}}$ is derivable. The derivation has $${n}$ nodes, one for each subterm (counting each numeral as a chain of succ).`;
          const bad = firstFail(D);
          return `**Not well typed.** The derivation breaks at rule ${bad.rule}: ${bad.msg}. No type $T$ makes $\\vdash ${nbTex(f.ast)} : T$ derivable.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Theorem', name: 'Inversion and canonical forms',
      statement: String.raw`For the typing relation of 4.1:
(a) **Inversion.** If $\vdash \mathtt{true}:R$ or $\vdash\mathtt{false}:R$ then $R=\mathsf{Bool}$; if $\vdash 0:R$ then $R=\mathsf{Nat}$; if $\vdash \mathtt{succ}\,t_1:R$ or $\vdash\mathtt{pred}\,t_1:R$ then $R=\mathsf{Nat}$ and $\vdash t_1:\mathsf{Nat}$; if $\vdash \mathtt{iszero}\,t_1:R$ then $R=\mathsf{Bool}$ and $\vdash t_1:\mathsf{Nat}$; if $\vdash \mathtt{if}\,t_1\,\mathtt{then}\,t_2\,\mathtt{else}\,t_3:R$ then $\vdash t_1:\mathsf{Bool}$ and $\vdash t_2:R$ and $\vdash t_3:R$.
(b) **Canonical forms.** A value of type $\mathsf{Bool}$ is $\mathtt{true}$ or $\mathtt{false}$; a value of type $\mathsf{Nat}$ is a numeric value ($0$ or $\mathtt{succ}$ of a numeric value).`,
      idea: String.raw`Inversion holds because the rules are syntax-directed: for a term of a given shape only one rule has a conclusion that matches it, so the last step of any derivation is forced and reading it backwards gives the premises. Canonical forms is then a case analysis on the value: each value shape is typed by exactly one rule, whose conclusion fixes its type (inversion), so the shapes available at a given type are exactly the ones listed. Together they are the two tools that make the progress proof (4.3) a short case analysis.`,
      caption: String.raw`Left: enter a term and choose the type claimed for it; the last rule is read backwards into the premises it requires, each shown green if it holds and red if it fails. Right: every term with at most $n$ nodes whose type is the one chosen below; values are green, the others grey. Whatever the size, the green chips are only the shapes of the canonical-forms lemma. Click a chip to send it to the inversion panel.`,
      deps: ['pl-4.1'], refs: ['Pierce §8.3'], tags: ['typing', 'values'],
      viz(v) {
        const sI = pxStage(v, { height: 170, full: true, title: 'Inversion: reading the last rule backwards' });
        const sC = pxStage(v, { height: 230, full: true, hover: true, title: 'Canonical forms' });
        const f = nbField(v, 'term', 'if iszero 0 then succ 0 else pred 2', () => v.invalidate());
        const claim = v.select('Claimed type', ['Bool', 'Nat'], 'Nat', { onChange: () => v.invalidate() });
        const which = v.select('List terms of type', ['Bool', 'Nat'], 'Nat', { onChange: () => v.invalidate() });
        const nMax = v.slider('terms with at most $n$ nodes', 1, 8, 5, { step: 1, int: true });
        let chipInfo = null, stat = null, inv = null;
        sC.onClick((x, y) => { const b = hitChip(chipInfo, sC.X(x), sC.Y(y)); if (b) { f.set(NB.str(b.chip.data)); v.invalidate(); } });
        v.render(() => {
          inv = null;
          if (f.err) drawParseError(v, sI, f.src, f.err);
          else {
            const t = f.ast, T = claim.value, actual = nbType(t);
            const nodeOf = (c, rule, kids, good) => ({ c, rule, kids, fail: good === false, good });
            let root;
            const goal = (u, ty) => { const holds = nbType(u) === ty; return { c: `${NB.str(u)} : ${ty}`, rule: null, kids: [], good: holds, fail: !holds }; };
            const forced = (t.op === 'true' || t.op === 'false') ? 'T-' + (t.op === 'true' ? 'True' : 'False') : t.op === 'zero' ? 'T-Zero' : t.op === 'succ' ? 'T-Succ' : t.op === 'pred' ? 'T-Pred' : t.op === 'iszero' ? 'T-IsZero' : 'T-If';
            const needed = (t.op === 'true' || t.op === 'false' || t.op === 'iszero') ? 'Bool' : t.op === 'if' ? T : 'Nat';
            const typeOk = needed === T;
            const kidGoals = t.op === 'if' ? [goal(t.a, 'Bool'), goal(t.b, T), goal(t.c, T)] : t.op === 'succ' || t.op === 'pred' || t.op === 'iszero' ? [goal(t.a, 'Nat')] : [];
            root = nodeOf(`${NB.str(t)} : ${T}`, `${forced}⁻¹`, kidGoals, typeOk && kidGoals.every((g) => g.good));
            if (!typeOk) root.note = `${forced} gives this shape only the type ${needed}`;
            inv = { forced, needed, typeOk, kidGoals, actual, T, root };
            drawDeriv(v, sI, root, { color: (n) => (n === root ? (n.fail ? 'red' : 'green') : n.fail ? 'red' : 'green'), anchor: 'top', size: 14 });
          }
          // canonical forms
          const W = which.value, chips = []; let nv = 0, nvBad = 0, nonv = 0;
          const values = [], others = [];
          for (let n = 1; n <= nMax.value; n++) for (const t of NB.termsOfSize(n)) {
            if (nbType(t) !== W) continue;
            if (NB.isVal(t)) { values.push(t); nv++; if (W === 'Bool' ? !(t.op === 'true' || t.op === 'false') : !NB.isNV(t)) nvBad++; } else { others.push(t); nonv++; }
          }
          for (const t of values) chips.push({ text: NB.str(t), color: 'green', fill: 'green', data: t });
          for (const t of others.slice(0, 80)) chips.push({ text: NB.str(t), color: 'muted', data: t });
          stat = { W, nv, nvBad, nonv };
          sC.textPx(`${nv} values and ${nonv} non-values of type ${W} among terms of at most ${nMax.value} nodes`, 12, 14, { size: 12, color: 'muted', align: 'left', halo: false });
          chipInfo = drawChips(v, sC, chips, { region: [12, 30, sC.W - 12, sC.H - 6], size: 12.5 });
          if (chipInfo.more > 0) sC.textPx(`… and ${chipInfo.more} more`, sC.W - 12, sC.H - 10, { size: 11, color: 'muted', align: 'right', halo: false });
        });
        v.legend([['green', 'value / premise that holds', { dot: true }], ['red', 'premise that fails', { dot: true }], ['muted', 'not a value', { dot: true }]]);
        v.readout(() => {
          let s = '';
          if (inv) {
            const t = f.ast;
            s += inv.typeOk
              ? `**Inversion.** The only rule that types a term of this shape is ${inv.forced}; at type $\\mathsf{${inv.T}}$ it requires ${inv.kidGoals.length ? inv.kidGoals.map((g) => `$${tx(g.c)}$`).join(', ') : 'nothing more'}. ${inv.kidGoals.every((g) => g.good) ? 'All hold, so the claim is derivable.' : 'At least one fails, so the claim has no derivation.'}`
              : `**Inversion.** The only rule for this shape is ${inv.forced}, and it can only produce $\\mathsf{${inv.needed}}$; the claim $\\mathsf{${inv.T}}$ has no derivation.`;
            s += ` (Actual type of $${nbTex(t)}$: ${inv.actual ? '$\\mathsf{' + inv.actual + '}$' : 'none'}.)`;
          }
          if (stat) s += `\n**Canonical forms.** Values of type $\\mathsf{${stat.W}}$ not of the promised shape: $${stat.nvBad}$ (of $${stat.nv}$ values).`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Theorem', name: 'Progress',
      statement: String.raw`If $\vdash t:T$, then either $t$ is a value or there is a $t'$ with $t\to t'$. (A well-typed term of the arithmetic-and-boolean language is never stuck.)`,
      idea: String.raw`Induction on the typing derivation, one case per rule, using the canonical forms of 4.2. Constants are values. For $\mathtt{succ}\,t_1$, $\mathtt{pred}\,t_1$ and $\mathtt{iszero}\,t_1$, the induction hypothesis says $t_1$ is a value or steps; if it steps, the congruence rule steps the whole term; if it is a value of type $\mathsf{Nat}$, canonical forms says it is $0$ or $\mathtt{succ}\,nv$, and then a computation rule applies (this is exactly where E-PredZero is needed). For $\mathtt{if}$, a guard that is a value of type $\mathsf{Bool}$ is $\mathtt{true}$ or $\mathtt{false}$, so E-IfTrue or E-IfFalse fires. The converse fails: ill-typed terms like $\mathtt{succ\ true}$ are stuck.`,
      caption: String.raw`Top: type a term and see its type and whether it is a value, can step (the redex is highlighted, with the rule) or is stuck. Bottom: the same classification for every term with at most $n$ nodes. The well-typed row never has a stuck term. Click a cell to list the smallest members; switch the semantics to delete a rule and watch well-typed stuck terms appear.`,
      deps: ['pl-4.2'], refs: ['Pierce §8.3'], tags: ['type safety', 'induction'],
      credit: 'Progress and preservation as the syntactic method for type soundness: A. K. Wright & M. Felleisen, 1994 (Information and Computation 115(1))',
      viz(v) {
        const sT = pxStage(v, { height: 150, full: true, title: 'One term' });
        const sC = pxStage(v, { height: 300, full: true, hover: true, title: 'Every term up to a given size' });
        let sel = [1, 2], cells = [], cen = null, one = null;
        const f = nbField(v, 'term', 'if iszero (pred 1) then succ 0 else pred 0', () => v.invalidate());
        const exs = ['succ true', 'pred (succ (succ 0))', 'iszero 0', 'if true then 0 else false'];
        const exB = v.select('Examples', [{ value: '0', label: 'if …' }, { value: '1', label: 'succ true' }, { value: '2', label: 'pred chain' }, { value: '3', label: 'iszero 0' }], '0', { onChange: () => f.set(['if iszero (pred 1) then succ 0 else pred 0', ...exs][+exB.value]) });
        const mode = v.select('Semantics', [{ value: 'std', label: 'standard rules' }, { value: 'noPredZero', label: 'delete E-PredZero' }], 'std', { onChange: () => v.invalidate() });
        const nMax = v.slider('terms with at most $n$ nodes', 3, 8, 6, { step: 1, int: true });
        sC.onClick((x, y) => { const c = hitCell(cells, sC.X(x), sC.Y(y)); if (c) { sel = [c.i, c.j]; v.invalidate(); } });
        v.render(() => {
          one = null;
          if (f.err) drawParseError(v, sT, f.src, f.err);
          else {
            const t = f.ast, ty = nbType(t), val = NB.isVal(t), st = val ? null : nbStep(t, mode.value);
            one = { ty, val, st };
            drawSegs(v, sT, NB.segs(t, st ? st.redex : null), 20, 34, { size: 19 });
            const badge = (txt, col, x) => { const w = txt.length * 7.4 + 24; sT.ctx.save(); sT.ctx.beginPath(); (sT.ctx.roundRect ? sT.ctx.roundRect(x, 70, w, 30, 9) : sT.ctx.rect(x, 70, w, 30)); sT.ctx.fillStyle = v.color(col, 0.2); sT.ctx.fill(); sT.ctx.strokeStyle = v.color(col, 1); sT.ctx.lineWidth = 1.6; sT.ctx.stroke(); sT.ctx.restore(); sT.textPx(txt, x + w / 2, 85, { size: 13, weight: 700, color: col, align: 'center', halo: false }); return x + w + 10; };
            let x = badge(ty ? `⊢ t : ${ty}` : 'ill typed', ty ? 'accent' : 'red', 20);
            if (val) badge('a value', 'green', x);
            else if (st) badge(`steps by ${st.rule}`, 'orange', x);
            else badge('STUCK', 'red', x);
            sT.textPx(val ? 'progress holds: a value' : st ? `redex: ${NB.str(st.redex)}  →  ${NB.str(nbStep(st.redex, mode.value).to)}` : '', 22, 126, { size: 12.5, color: 'muted', align: 'left', halo: false });
          }
          cen = nbCensus(nMax.value, mode.value);
          cells = drawTally(v, sC, {
            rows: ['well typed', 'ill typed'], cols: ['value', 'can step', 'stuck'], counts: cen.counts, sel,
            tone: [['green', 'accent', 'red'], ['green', 'accent', 'orange']], region: [8, 6, sC.W - 8, sC.H - 74],
          });
          const exl = cen.ex[sel[0]][sel[1]];
          const lab = ['well-typed', 'ill-typed'][sel[0]] + ' ' + ['values', 'terms that can step', 'stuck terms'][sel[1]];
          sC.textPx(exl.length ? `smallest ${lab}:` : `no ${lab} of at most ${nMax.value} nodes`, 12, sC.H - 54, { size: 12, color: 'muted', align: 'left', halo: false });
          drawChips(v, sC, exl.slice(0, 12).map((t) => ({ text: NB.str(t), color: sel[1] === 2 ? 'red' : sel[1] === 0 ? 'green' : 'accent' })), { region: [12, sC.H - 44, sC.W - 12, sC.H - 2], size: 12 });
        });
        v.readout(() => {
          const c = cen ? cen.counts : null; let s = '';
          if (one) s += one.val ? `This term is a **value**` : one.st ? `This term is not a value but **can step** (${one.st.rule})` : `This term is **stuck**: not a value and no rule applies`;
          if (one) s += one.ty ? `, and it is well typed (${one.ty}).` : ', and it is ill typed.';
          if (c) s += `\nAmong all $${c[0][0] + c[0][1] + c[0][2] + c[1][0] + c[1][1] + c[1][2]}$ terms: well-typed and stuck $=${c[0][2]}$ ${c[0][2] === 0 ? '(progress holds)' : '(**progress fails** for this semantics)'}; ill-typed and stuck $=${c[1][2]}$.`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Theorem', name: 'Preservation',
      statement: String.raw`If $\vdash t:T$ and $t\to t'$, then $\vdash t':T$. (One step of evaluation never changes the type of a well-typed term.)`,
      idea: String.raw`Induction on the derivation of $\vdash t:T$, with inversion (4.2) to know what the premises are. For a computation rule the result is a subterm that inversion already types: E-IfTrue returns $t_2$, whose type is that of the whole $\mathtt{if}$; E-PredSucc returns the numeric value inside, of type $\mathsf{Nat}$; E-IszeroZero returns $\mathtt{true}$, of type $\mathsf{Bool}$, as T-IsZero promised. For a congruence rule the induction hypothesis retypes the stepped subterm and the same typing rule rebuilds the whole. A single wrongly written rule is enough to make the theorem false.`,
      caption: String.raw`Enter a well-typed term and run it. Each row re-derives the type of the current term (and shows the rule used to reach it); the column on the right compares with the type of the start. Switch to a broken semantics, where one computation rule returns a term of the wrong type, and watch the type drift and, later, the run get stuck.`,
      deps: ['pl-4.2'], refs: ['Pierce §8.3'], tags: ['type safety', 'induction'],
      credit: 'Progress and preservation as the syntactic method for type soundness: A. K. Wright & M. Felleisen, 1994 (Information and Computation 115(1))',
      scope: String.raw`Holds for the standard rules of the language. The broken semantics here are illustrations of our own.`,
      viz(v) {
        const s = pxStage(v, { height: 300, full: true, title: 'Evaluation, with the type re-derived at every step' });
        const EX = ['if iszero 0 then succ 0 else 0', 'if iszero (pred 1) then succ (succ 0) else pred 3', 'pred (succ (succ 0))'];
        const f = nbField(v, 'term', EX[0], () => v.invalidate());
        const exB = v.select('Examples', EX.map((_, i) => ({ value: String(i), label: ['iszero 0', 'nested', 'pred chain'][i] })), '0', { onChange: () => f.set(EX[+exB.value]) });
        const mode = v.select('Semantics', [{ value: 'std', label: 'standard' }, { value: 'badIszero', label: 'iszero 0 → 0' }, { value: 'badPred', label: 'pred (succ nv) → true' }], 'std', { onChange: () => v.invalidate() });
        let run = null, T0 = null, drift = -1;
        v.render(() => {
          run = null;
          if (f.err) { drawParseError(v, s, f.src, f.err); return; }
          T0 = nbType(f.ast);
          run = nbRun(f.ast, mode.value, 30);
          const types = run.terms.map(nbType);
          drift = types.findIndex((ty, i) => T0 && ty !== T0 && i > 0);
          const rowH = Math.min(34, (s.H - 56) / Math.max(1, run.terms.length)), x1 = s.W - 190;
          s.textPx('step', 14, 18, { size: 11.5, color: 'muted', weight: 700, align: 'left', halo: false });
          s.textPx('term', 56, 18, { size: 11.5, color: 'muted', weight: 700, align: 'left', halo: false });
          s.textPx('rule used', x1 - 10, 18, { size: 11.5, color: 'muted', weight: 700, align: 'right', halo: false });
          s.textPx('type', x1 + 20, 18, { size: 11.5, color: 'muted', weight: 700, align: 'left', halo: false });
          s.textPx('same as start?', s.W - 14, 18, { size: 11.5, color: 'muted', weight: 700, align: 'right', halo: false });
          run.terms.forEach((t, i) => {
            const y = 44 + i * rowH, ty = types[i], same = ty === T0 && T0, bad = !same && i > 0 && T0;
            if (bad) { s.ctx.save(); s.ctx.fillStyle = v.color('red', 0.1); s.ctx.fillRect(4, y - rowH / 2, s.W - 8, rowH); s.ctx.restore(); }
            s.textPx(String(i), 14, y, { size: 12.5, color: 'muted', align: 'left', halo: false });
            const hi = i < run.terms.length - 1 ? nbStep(t, mode.value) : null;
            drawSegs(v, s, NB.segs(t, hi ? hi.redex : null), 56, y, { size: 14.5 });
            if (i > 0) s.textPx(run.rules[i - 1], x1 - 10, y, { size: 11.5, color: /Bad/.test(run.rules[i - 1]) ? 'red' : 'muted', align: 'right', weight: /Bad/.test(run.rules[i - 1]) ? 700 : 500, halo: false });
            s.textPx(ty || '—', x1 + 20, y, { size: 13, weight: 700, color: ty === 'Bool' ? 'accent' : ty ? 'ink' : 'red', align: 'left', halo: false });
            if (i > 0 && T0) s.textPx(same ? '✓' : '✗', s.W - 30, y, { size: 16, weight: 800, color: same ? 'green' : 'red', align: 'center', halo: false });
          });
        });
        v.readout(() => {
          if (!run) return '';
          if (!T0) return 'This start term is ill typed, so preservation says nothing about it. Pick a well-typed one.';
          const last = run.terms[run.terms.length - 1];
          const mm = NB_MODES[mode.value];
          if (drift < 0) return `All $${run.terms.length}$ terms have type $\\mathsf{${T0}}$ over $${run.rules.length}$ step${run.rules.length === 1 ? '' : 's'}${mode.value === 'std' ? ', as preservation promises' : ' (the broken rule never fired on this term)'}; the run ends in ${run.status === 'value' ? 'the value $' + nbTex(last) + '$' : 'a **stuck** term'}.`;
          return `**Preservation fails** with ${mm.name}: step $${drift}$ turns a $\\mathsf{${T0}}$ into a $\\mathsf{${nbType(run.terms[drift]) || 'ill-typed term'}}$ ${run.status === 'stuck' ? `and the run ends **stuck** at $${nbTex(last)}$` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Theorem', name: 'Type safety: well-typed programs do not get stuck',
      statement: String.raw`If $\vdash t:T$ and $t\to^{*}t'$ with $t'$ a normal form (no rule applies), then $t'$ is a value. Equivalently: a well-typed term never reaches a stuck state. This follows from progress (4.3) and preservation (4.4) for the arithmetic-and-boolean language; the same pair of lemmas is the template for every language that follows.`,
      idea: String.raw`Follow a run $t\to t_1\to t_2\to\cdots$. By preservation, every $t_i$ is well typed (with the same type as $t$). By progress, each $t_i$ is a value or can step. So the run can only halt at a value. Neither lemma alone suffices: progress without preservation lets a step land on an ill-typed term where progress no longer applies; preservation without progress lets a well-typed term sit stuck. The slogan “well-typed programs cannot go wrong” (Milner) is this theorem, where “go wrong” means “get stuck”.`,
      caption: String.raw`Random terms are generated (some deliberately ill typed), classified by the typing relation and run to a normal form. The rows split by well-typed or not, the columns by value or stuck. Under the standard rules the top-right cell is always empty. Choose a broken semantics (a deleted rule breaks progress, a wrong rule breaks preservation) and watch well-typed programs get stuck. Resample for a new seed.`,
      deps: ['pl-4.3', 'pl-4.4'], refs: ['Pierce §8.3'], tags: ['type safety', 'soundness'],
      credit: 'R. Milner, 1978 (J. Comput. System Sci. 17(3), the “cannot go wrong” slogan); A. K. Wright & M. Felleisen, 1994 (Information and Computation 115(1), progress and preservation)',
      viz(v) {
        const s = pxStage(v, { height: 290, full: true, hover: true, title: 'Outcome of running random programs' });
        let seed = 3, sample = null, sel = [0, 1], cells = [];
        const mode = v.select('Semantics', [{ value: 'std', label: 'standard' }, { value: 'noPredZero', label: 'delete E-PredZero' }, { value: 'badIszero', label: 'iszero 0 → 0' }, { value: 'badPred', label: 'pred (succ nv) → true' }], 'std', { onChange: () => v.invalidate() });
        const size = v.slider('program size', 3, 18, 9, { step: 1, int: true });
        const cnt = v.slider('programs', 100, 1500, 500, { step: 100, int: true });
        const sloppy = v.slider('fraction made sloppy', 0.1, 0.9, 0.5, { step: 0.05 });
        v.button('Resample', () => { seed++; });
        s.onClick((x, y) => { const c = hitCell(cells, s.X(x), s.Y(y)); if (c) { sel = [c.i, c.j]; v.invalidate(); } });
        v.render(() => {
          const r = v.rng(seed * 7919 + size.value * 31), counts = [[0, 0], [0, 0]], ex = [[[], []], [[], []]];
          for (let i = 0; i < cnt.value; i++) {
            const t = NB.randomTerm(r, size.value, 'any', r() < sloppy.value ? 0.8 : 1);
            const wt = nbType(t) ? 0 : 1, res = nbRunFinal(t, mode.value), j = res.status === 'value' ? 0 : 1;
            counts[wt][j]++; if (ex[wt][j].length < 8) ex[wt][j].push(t);
          }
          sample = { counts, ex };
          cells = drawTally(v, s, { rows: ['well typed', 'ill typed'], cols: ['ran to a value', 'got stuck'], counts, sel, tone: [['green', 'red'], ['green', 'orange']], region: [8, 4, s.W - 8, s.H - 82] });
          const exl = ex[sel[0]][sel[1]];
          s.textPx(exl.length ? `examples (${['well-typed', 'ill-typed'][sel[0]]}, ${['ran to a value', 'stuck'][sel[1]]}):` : 'no examples in this sample', 12, s.H - 62, { size: 12, color: 'muted', align: 'left', halo: false });
          drawChips(v, s, exl.slice(0, 6).map((t) => ({ text: NB.str(t), color: sel[1] ? 'red' : 'green' })), { region: [12, s.H - 52, s.W - 12, s.H - 2], size: 12 });
        });
        v.readout(() => {
          if (!sample) return '';
          const c = sample.counts, wtN = c[0][0] + c[0][1], itN = c[1][0] + c[1][1];
          return `Of $${wtN}$ well-typed programs, $${c[0][1]}$ got stuck${c[0][1] === 0 ? ' — **type safety**' : ' — **safety fails** for this semantics'}. Of $${itN}$ ill-typed programs, $${c[1][1]}$ got stuck (${itN ? Math.round(100 * c[1][1] / itN) : 0}%); the others happened to run to a value anyway (the type system is conservative, 4.6).`;
        });
      },
    },
  ],
};
