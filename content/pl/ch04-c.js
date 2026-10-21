// Programming Languages & Types — Chapter 4: Types and type safety (items 4.10–4.13)
import { reductionGraph, validatedTyped } from './reduction-audit.shared.js';
import {
  derive, tStr, tSegs, tx, tyStr, tyEq, tyVarName, tySubst, parseTM, typeOf, tErase, tKey, tSize, tSubst, tmRun, tmStep, tIsValue, pathStats, genTyped, genPure,
  TB, TN, TF, TV, infer, normalizeTM, allSteps, drawSegs, drawChips, drawParseError, drawTreePx, layoutG, hitNode, segWidth, field, pxStage, wrapText,
} from './ch04.shared.js';

const tmField = (v, label, def, onChange, width = 400) => field(v, label, def, parseTM, { width, onChange });
const dTex = (s) => tx(s);

/** Draw a term as one row of segments, shrunk to fit a column of width w; returns the font size used. */
function fitSegs(v, s, parts, x, y, w, size = 14) {
  const full = segWidth(s, parts, size), sz = full > w ? Math.max(8.5, size * w / full) : size;
  drawSegs(v, s, parts, x, y, { size: sz });
  return sz;
}
const rowsOf = (s, n, top = 44, bottom = 12) => Math.min(34, (s.H - top - bottom) / Math.max(1, n));

export default {
  collection: 'pl',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10', kind: 'Theorem', name: 'Safety of the simply typed λ-calculus',
      statement: String.raw`For the simply typed $\lambda$-calculus with call-by-value evaluation (values: $\lambda x{:}T.t$, $\mathtt{true}$, $\mathtt{false}$ and numeric values):
- **Progress.** If $\vdash t:T$ ($t$ closed) then $t$ is a value or $t\to t'$ for some $t'$.
- **Preservation.** If $\Gamma\vdash t:T$ and $t\to t'$ then $\Gamma\vdash t':T$.
Hence a closed well-typed term never gets stuck: if $\vdash t:T$ and $t\to^{*}t'$ with $t'$ a normal form, then $t'$ is a value.`,
      idea: String.raw`Progress is an induction on the typing derivation using canonical forms: a value of arrow type $T_1\to T_2$ is a $\lambda$-abstraction, so in an application $t_1\,t_2$ with both parts values the rule E-AppAbs applies. Preservation is an induction on the derivation of $t\to t'$; the only new case is E-AppAbs, $(\lambda x{:}S.\,b)\,s\to[x\mapsto s]\,b$. Inversion on the typing of the application gives $\Gamma,x{:}S\vdash b:T$ and $\Gamma\vdash s:S$, and the substitution lemma (4.9) says that is exactly enough to type $[x\mapsto s]\,b$ at $T$. The other cases are as in 4.4. The two lemmas combine into safety as in 4.5.`,
      caption: String.raw`Choose a closed program and watch it run (call by value). Each row re-derives the type of the current term and shows what progress promises: a value, or the rule that fires. The slider picks a step; when it is a $\beta$-step the panel below shows the three typing facts of the substitution lemma doing the work. The two ill-typed examples are the ones that get stuck, and are not covered by the theorem.`,
      deps: ['pl-4.9', 'pl-4.5'], refs: ['Pierce §9.3'], tags: ['type safety', 'substitution'],
      viz(v) {
        const sT = pxStage(v, { height: 250, full: true, title: 'Call-by-value evaluation with types re-derived at every step' });
        const sL = pxStage(v, { height: 100, full: true, title: 'The substitution lemma at the selected step' });
        const EX = ['(λf:Nat->Nat. f (f 0)) (λx:Nat. succ x)', '(λb:Bool. λn:Nat. if b then n else 0) true 5', '(λx:Nat. if iszero x then 1 else pred x) ((λy:Nat. succ y) 2)', '(λx:Nat. succ x) true', 'succ (λx:Nat. x)'];
        const f = tmField(v, 'program', EX[0], () => v.invalidate());
        const exB = v.select('Examples', ['twice', 'curried', 'nested', 'ill-typed 1', 'ill-typed 2'].map((l, i) => ({ value: String(i), label: l })), '0', { onChange: () => f.set(EX[+exB.value]) });
        const focus = v.slider('selected step', 1, 12, 1, { step: 1, int: true });
        let run = null, T0 = null, bad = null;
        v.render(() => {
          run = null; bad = null;
          if (f.err) { drawParseError(v, sT, f.src, f.err); return; }
          const t = f.ast; T0 = typeOf(t);
          run = tmRun(t, 12);
          const n = run.terms.length, rh = rowsOf(sT, n), W = sT.W, termW = W - 470;
          ['', 'term', 'type', 'progress', 'same type'].forEach((h, i) => sT.textPx(h, [14, 50, W - 410, W - 300, W - 70][i], 18, { size: 11.5, color: 'muted', weight: 700, align: 'left', halo: false }));
          const fi = Math.min(focus.value, Math.max(1, run.steps.length)) - 1;
          run.terms.forEach((u, i) => {
            const y = 44 + i * rh, ty = typeOf(u);
            if (i === fi && run.steps.length) { sT.ctx.save(); sT.ctx.fillStyle = v.color('gold', 0.16); sT.ctx.fillRect(4, y - rh / 2, W - 8, rh); sT.ctx.restore(); }
            sT.textPx(String(i), 14, y, { size: 12.5, color: 'muted', align: 'left', halo: false });
            fitSegs(v, sT, tSegs(u, i < run.steps.length ? run.steps[i].redex : null), 50, y, termW, 14);
            sT.textPx(ty ? tyStr(ty) : '—', W - 410, y, { size: 12.5, weight: 700, color: ty ? 'accent' : 'red', align: 'left', halo: false });
            const last = i === n - 1;
            const prog = last ? (run.status === 'value' ? 'a value' : run.status === 'stuck' ? 'STUCK' : 'cut off') : `steps: ${run.steps[i].rule}`;
            sT.textPx(prog, W - 300, y, { size: 12.5, weight: 700, color: last ? (run.status === 'value' ? 'green' : 'red') : 'orange', align: 'left', halo: false });
            if (i > 0 && T0) sT.textPx(ty && tyEq(ty, T0) ? '✓' : '✗', W - 50, y, { size: 16, weight: 800, color: ty && tyEq(ty, T0) ? 'green' : 'red', align: 'center', halo: false });
          });
          // lemma panel
          const st = run.steps.length ? run.steps[fi] : null;
          if (!st) sL.textPx('this program takes no steps', sL.W / 2, sL.H / 2, { size: 13, color: 'muted', align: 'center', halo: false });
          else if (st.rule !== 'E-AppAbs') sL.textPx(`step ${fi + 1} uses ${st.rule}: no substitution here, preservation follows by induction on the rule`, sL.W / 2, sL.H / 2, { size: 13, color: 'muted', align: 'center', halo: false });
          else {
            const r = st.redex, lam = r.f, S = lam.ty, s = r.a;
            const Tb = S ? typeOf(lam.b, [[lam.x, S]]) : null, Ts = typeOf(s), Tr = typeOf(tSubst(lam.b, lam.x, s));
            const good = Tb && Ts && S && tyEq(Ts, S) && Tr && tyEq(Tr, Tb);
            const chips = [
              { text: `${lam.x}:${S ? tyStr(S) : '?'} ⊢ body : ${Tb ? tyStr(Tb) : '?'}`, color: Tb ? 'green' : 'red', fill: Tb ? 'green' : 'red' },
              { text: `⊢ ${tStr(s).length > 22 ? tStr(s).slice(0, 20) + '…' : tStr(s)} : ${Ts ? tyStr(Ts) : '?'}`, color: Ts && S && tyEq(Ts, S) ? 'green' : 'red', fill: Ts && S && tyEq(Ts, S) ? 'green' : 'red' },
              { text: `⊢ [${lam.x}↦s] body : ${Tr ? tyStr(Tr) : '?'}`, color: good ? 'green' : 'red', fill: good ? 'green' : 'red' },
            ];
            sL.textPx(`step ${fi + 1}: E-AppAbs on  (λ${lam.x}:${S ? tyStr(S) : '?'}. body) s`, 14, 20, { size: 13, weight: 700, align: 'left', halo: false });
            drawChips(v, sL, chips, { region: [14, 38, sL.W - 14, sL.H - 4], size: 13 });
            bad = good ? null : 'lemma';
          }
        });
        v.legend([['gold', 'the redex that fires', { dot: true }], ['green', 'typing facts that hold', { dot: true }]]);
        v.readout(() => {
          if (!run) return '';
          if (!T0) return `This program is **ill typed**, so the theorem does not apply to it; it ${run.status === 'stuck' ? 'indeed gets stuck' : 'happens not to get stuck'}.`;
          const types = run.terms.map((u) => typeOf(u)), drift = types.some((x) => !x || !tyEq(x, T0));
          return `$${dTex('⊢ t : ' + tyStr(T0))}$. Over $${run.steps.length}$ step${run.steps.length === 1 ? '' : 's'} the type ${drift ? '**changed**' : 'never changed (preservation)'}; every term before the last could step (progress); the run ends ${run.status === 'value' ? 'in a **value**' : '**stuck**'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11', kind: 'Theorem', name: 'Strong normalization (Tait)',
      statement: String.raw`In the simply typed $\lambda$-calculus every well-typed term is **strongly normalizing**: if $\Gamma\vdash t:T$ then every sequence of $\beta$-reductions starting from $t$ is finite (under any strategy, anywhere in the term). In particular every well-typed term has a normal form, which is unique (3.5), and evaluation always terminates. The same holds with the constants of 4.1 added.`,
      idea: String.raw`Termination cannot be proved by induction on the term, because a β-step can copy its argument: $(\lambda x{:}A.\,f\,x\,x)\,u$ duplicates $u$ when $f:A\to A\to B$. Tait's method strengthens the induction hypothesis: define by recursion on the *type* a set $R_T$ of terms (“reducible at $T$”): at a base type, the strongly normalizing terms; at $T_1\to T_2$, the terms that send every reducible $T_1$ argument to a reducible $T_2$ result. Then show that reducible terms are strongly normalizing, and that every well-typed term, with its free variables replaced by reducible terms, is reducible, by induction on the typing derivation (the case of application is immediate from the definition at arrow type; abstraction uses the substitution lemma and a closure property of $R_T$). The argument is exactly where types enter: the untyped term $\Omega$ has no type, and cannot be placed in any $R_T$. Via the Curry–Howard correspondence this is what makes the logic of the simply typed calculus consistent, and the method has to be strengthened for stronger systems such as System F.

The recursion principle of LOGIC 2.2 is adapted here to finite type syntax: define $R_T$ at a base type first, then at an arrow using only the already defined relations for its domain and codomain, both proper type subtrees. This makes the definition well founded. It is separate from the strengthened induction on typing derivations that proves the substitution instance reducible; neither step asserts that term size decreases during $\beta$-reduction.

For a fixed typed term, strong normalization has a finite-search consequence using König's lemma (LOGIC 2.10). Form the rooted tree of all finite reduction paths, with terms identified up to alpha equivalence. Each finite term has only finitely many redex positions and primitive reduction choices, so this tree is finitely branching. If it were infinite, the lemma would supply an infinite reduction path, contradicting strong normalization. Thus the path tree is finite and has a finite maximum depth for this particular term. This additional conclusion uses finite branching; it gives neither a practical uniform complexity bound nor evidence that a displayed finite cutoff has exhausted the tree.`,
      caption: String.raw`For each generated term, explore its full β/primitive-reduction graph within explicit size, depth and state budgets. A complete acyclic graph gives exact shortest (green) and longest (blue) path lengths for that term. Red marks certify a discovered reduction cycle; orange marks mean only that a resource budget was reached. Click a point for its term and status. Typed samples are independently type checked before admission; the experiment illustrates, and does not prove, the normalization theorem.`,
      deps: ['pl-4.10', 'logic-2.2', 'logic-2.10'], refs: ['Girard–Lafont–Taylor, Proofs and Types, §§6.1–6.3, pp.41–45; §7.2, p.48'], tags: ['normalization', 'termination'],
      credit: 'Tait’s reducibility method, as attributed and fully proved in Girard–Lafont–Taylor, Proofs and Types, chapter6',
      scope: String.raw`The theorem concerns arbitrary full β-reduction, including under λ, for simply typed terms. The shown Bool/Nat extension uses only terminating conditionals and arithmetic primitives, covered by the reducibility extension to System T (Girard–Lafont–Taylor, chapter7); the graph also counts these primitive steps. General recursion and unrestricted recursive type equations can destroy normalization. A cutoff is inconclusive, and may be caused by depth, state count or term size. No practical global complexity bound is claimed here.`,
      viz(v) {
        const s = v.stage({ x: [0, 40], y: [0, 20], axes: 'box', gutter: true, full: true, height: 330, xlabel: 'term size (nodes)', ylabel: 'reduction steps to normal form', title: 'Reduction path lengths of random terms' });
        let seed = 1, data = [], sel = null, ymax = 20, cache='', rejected=0;
        const mode = v.select('Terms', [{ value: 'typed', label: 'random well-typed' }, { value: 'untyped', label: 'random untyped' }], 'typed', { onChange: () => { sel = null; v.invalidate(); } });
        const size = v.slider('generation size budget', 8, 36, 24, { step: 1, int: true });
        const cnt = v.slider('terms', 20, 160, 80, { step: 10, int: true });
        v.button('Resample', () => { seed++; sel = null; });
        s.onClick((x, y) => {
          let best = null, bd = 18;
          for (let i=0;i<data.length;i++) for (const yy of [data[i].y,data[i].y0]) { if (yy == null) continue; const q = Math.hypot(s.X(data[i].x) - s.X(x), s.Y(yy) - s.Y(y)); if (q < bd) { bd = q; best = i; } }
          sel = best; v.invalidate();
        });
        v.render(() => {
          const k=[seed,mode.value,size.value,cnt.value].join('|');
          if(k!==cache){cache=k;sel=null;rejected=0;const r=v.rng(seed*104729+(mode.value==='typed'?1:2)+size.value*13),pts=[];
            for(let i=0;i<cnt.value;i++){
              const n=4+Math.floor(r()*(size.value-3)),g=mode.value==='typed'?validatedTyped(r,r.pick([TN,TB,TN]),n):{term:genPure(r,Math.max(3,Math.round(n*.7))),rejected:0},t=g.term;
              rejected+=g.rejected;const p=reductionGraph(t,mode.value==='typed'?{cap:2500,maxSize:260,maxDepth:200}:{cap:1500,maxDepth:60,maxSize:120});
              pts.push({t,x:tSize(t),cut:p.status!=='complete',status:p.status,limits:p.limits,states:p.states,y:p.status==='complete'?p.max:null,y0:p.status==='complete'?p.min:null});
            }data=pts;
          }
          const fin = data.filter((d) => !d.cut);
          ymax = Math.max(10, ...fin.map((d) => d.y)) * 1.15;
          for (const d of data) if (d.cut) d.y=ymax*.94;
          s.setView([0, Math.max(...data.map((d) => d.x)) + 2], [0, ymax]);
          for (const d of data) {
            if (d.cut) s.dot(d.x, d.y, { r: 5, color: d.status==='cycle'?'red':'orange', hollow: true });
            else { s.dot(d.x, d.y0, { r: 3.5, color: 'green', hollow: true }); s.dot(d.x, d.y, { r: 4, color: 'accent' }); if (d.y > d.y0) s.line(d.x, d.y0, d.x, d.y, { color: 'faint', width: 1 }); }
          }
          if (sel!==null) { const q = data[sel]; if (q) s.dot(q.x, q.y, { r: 9, color: 'gold', hollow: true }); }
        });
        v.legend([['accent', 'longest path: complete graph', { dot: true }], ['green', 'shortest path: complete graph', { dot: true }], ['red', 'cycle witness', { dot: true }],['orange','unknown: resource cutoff',{dot:true}]]);
        v.readout(() => {
          const fin = data.filter((d) => !d.cut), cut = data.length - fin.length;
          const cycles=data.filter(d=>d.status==='cycle').length,unknown=data.filter(d=>d.status==='unknown').length;
          let t = `Complete acyclic graphs: **${fin.length} of ${data.length}**, with exact path maxima up to **${fin.length?Math.max(...fin.map(d=>d.y)):0}** steps. Cycle witnesses: **${cycles}**. Unknown resource cutoffs: **${unknown}**. Budgets: ${mode.value==='typed'?'2,500 states, depth200, size260':'1,500 states, depth60, size120'} nodes.`;
          if(mode.value==='typed')t+=` Every admitted term passed the type checker; ${rejected} rejected generator candidates. Strong normalization is the source theorem, not inferred from the sample.`;
          else t+=' A cycle disproves strong normalization for that term, but does not rule out a different path to a normal form. A cutoff proves neither divergence nor absence of normal forms.';
          if (sel!==null) { const q = data[sel]; t += `\nSelected: $${dTex(tStr(q.t).length > 120 ? tStr(q.t).slice(0, 118) + '…' : tStr(q.t))}$, size $${q.x}$: ${q.status==='complete'?`exact paths ${q.y0}–${q.y} steps`:q.status==='cycle'?'a reduction cycle was found':'unknown ('+q.limits.join(', ')+')'}, explored ${q.states} states.`; }
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12', kind: 'Concept', name: 'Erasure: types have no run-time content',
      statement: String.raw`The **erasure** $\lfloor t\rfloor$ of a typed term removes the type annotations ($\lfloor\lambda x{:}T.\,t\rfloor=\lambda x.\,\lfloor t\rfloor$, and homomorphically elsewhere). For the simply typed $\lambda$-calculus evaluation commutes with erasure: if $t\to t'$ then $\lfloor t\rfloor\to\lfloor t'\rfloor$, and if $\lfloor t\rfloor\to u$ then $t\to t'$ for some $t'$ with $\lfloor t'\rfloor=u$. So the typed and the untyped run correspond step for step, and a compiler can type check and then throw the types away. The property is a design constraint: a feature whose behaviour *depends* on a type (overloading resolved by type, run-time type tests, “the default value of type $T$”) breaks it.`,
      idea: String.raw`No evaluation rule ever looks at a type. E-AppAbs substitutes a term for a variable, and substitution is blind to annotations; the other rules only look at the shape of values. So one run is the image of the other under erasure, by induction on the derivation of the step. The role of the types is entirely static: they rule out the runs that would get stuck (4.10) before anything runs. Languages with type-directed run-time behaviour (type classes by dictionary passing, Java's casts, our toy $\mathtt{default}[T]$) either keep a representation of the type at run time or must pass it explicitly.`,
      caption: String.raw`Left column: the typed program running. Right column: the same program with all annotations erased, running under the same rules. Rows with a green tick: the right term is exactly the erasure of the left. Choose the example with $\mathtt{default}[T]$, a type-directed operation of our own, to see erasure fail: once the type is gone, the right column cannot decide what to return and is stuck.`,
      deps: ['pl-4.7'], refs: ['Pierce §9.5'], tags: ['erasure', 'run time'],
      scope: String.raw`The correspondence is for evaluation without type-dependent operations. The $\mathtt{default}[T]$ construct is an illustration of ours, not part of the standard calculus.`,
      viz(v) {
        const s = pxStage(v, { height: 270, full: true, title: 'The typed run and the erased run, in step' });
        const EX = ['(λf:Nat->Nat. f (f 0)) (λx:Nat. succ x)', '(λx:Bool. if x then 1 else 0) (iszero 0)', '(λf:Nat->Nat->Nat. f 1 2) (λa:Nat. λb:Nat. succ a)', '(λn:Nat. succ n) default[Nat]'];
        const f = tmField(v, 'program', EX[0], () => v.invalidate());
        const exB = v.select('Examples', ['twice', 'if', 'curried', 'default[T]'].map((l, i) => ({ value: String(i), label: l })), '0', { onChange: () => f.set(EX[+exB.value]) });
        let info = null;
        v.render(() => {
          info = null;
          if (f.err) { drawParseError(v, s, f.src, f.err); return; }
          const t = f.ast, u = tErase(t), A = tmRun(t, 16), B = tmRun(u, 16);
          const n = Math.max(A.terms.length, B.terms.length), rh = rowsOf(s, n), W = s.W, cw = (W - 96) / 2;
          s.textPx('typed run', 40, 18, { size: 12, color: 'muted', weight: 700, align: 'left', halo: false });
          s.textPx('erased run (the same rules)', 40 + cw + 20, 18, { size: 12, color: 'muted', weight: 700, align: 'left', halo: false });
          let agree = 0, firstBad = -1;
          for (let i = 0; i < n; i++) {
            const y = 44 + i * rh, a = A.terms[i], b = B.terms[i];
            s.textPx(String(i), 14, y, { size: 12, color: 'muted', align: 'left', halo: false });
            if (a) fitSegs(v, s, tSegs(a, i < A.steps.length ? A.steps[i].redex : null), 40, y, cw - 10, 13.5);
            if (b) fitSegs(v, s, tSegs(b, i < B.steps.length ? B.steps[i].redex : null, { noTypes: true }), 40 + cw + 20, y, cw - 10, 13.5);
            else if (a) s.textPx('(stopped: stuck)', 40 + cw + 20, y, { size: 12.5, color: 'red', weight: 700, align: 'left', halo: false });
            if (a && b) {
              const same = tKey(a, false) === tKey(b, false);
              if (same) agree++; else if (firstBad < 0) firstBad = i;
              s.textPx(same ? '✓' : '✗', W - 30, y, { size: 16, weight: 800, color: same ? 'green' : 'red', align: 'center', halo: false });
            } else if (a) { if (firstBad < 0) firstBad = i; s.textPx('✗', W - 30, y, { size: 16, weight: 800, color: 'red', align: 'center', halo: false }); }
          }
          info = { A, B, agree, n, firstBad };
        });
        v.readout(() => {
          if (!info) return '';
          const { A, B, firstBad } = info;
          if (firstBad < 0) return `Typed run: $${A.steps.length}$ steps (${A.status}); erased run: $${B.steps.length}$ steps (${B.status}); every row matches: the erased run is the image of the typed run. The evaluator never reads a type.`;
          return `**Erasure breaks at row ${firstBad}.** The typed run has $${A.steps.length}$ steps; the erased one ${B.status === 'stuck' ? 'is **stuck**' : 'differs'} after $${B.steps.length}$: $\\mathtt{default}[T]$ needs to know $T$, and the erased term no longer says.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13', kind: 'Theorem', name: 'Self-application is untypable',
      statement: String.raw`No type can be assigned to the term $\lambda x.\,x\,x$ (nor to $\Omega=(\lambda x.\,x\,x)(\lambda x.\,x\,x)$, nor to any fixed-point combinator such as $Y$) in the simply typed $\lambda$-calculus, whatever type is given to $x$: typing $x\,x$ would need $x:T$ and also $x:T\to S$, i.e. a type with $T=T\to S$, which is not a finite type. Consequently the untyped terms that give general recursion cannot be typed, which is the reason the typed calculus is strongly normalizing (4.11).`,
      idea: String.raw`Suppose $x:T$. T-App for $x\,x$ requires the function part $x$ to have an arrow type, so $T=T_1\to T_2$, and the argument $x$ to have the domain type, so $T=T_1$. Then $T=T\to T_2$. A finite type tree has strictly more nodes than any of its proper subtrees, but $T$ would be a proper subtree of itself. Algorithmically this is the occurs check of unification (the same check that makes Hindley–Milner inference fail on $\lambda x.\,x\,x$). Allowing such types (recursive types, $T = T\to S$) would make Ω typable and lose normalization, and with it the logical reading of types.

Adapt the finite-syntax recursion and induction of LOGIC 2.2 to simple types: a base type has size $1$, and an arrow has size $1+\operatorname{size}(A)+\operatorname{size}(B)$. Each child is strictly smaller. The required equation $T=T\to S$ would therefore make a number equal to $1+\operatorname{size}(T)+\operatorname{size}(S)$, which is strictly larger. This obstruction concerns finite simple type trees; an equi-recursive type equation is outside that syntax.`,
      caption: String.raw`Type an untyped term (annotations optional). The left panel lists the equations between types that the typing rules generate, solved in order by unification: each is solved (green) until one fails (red). The right panel draws the offending type. When it is an equation $T=T\to S$, the slider unrolls it $k$ times; the tree never closes. Typable terms get their finite principal type instead.`,
      deps: ['pl-4.11', 'pl-2.8', 'logic-2.2'], refs: ['Pierce §9.3'], tags: ['recursion', 'type inference'],
      viz(v) {
        const sC = pxStage(v, { height: 230, hover: false, title: 'Type equations, solved in order' });
        const sT = pxStage(v, { height: 230, title: 'The type that would be needed' });
        const EX = ['λx. x x', '(λx. x x) (λx. x x)', 'λf. λx. f (f x)', 'λx. λy. x', 'λx. x (x 0)', 'λx. x x x'];
        const f = tmField(v, 'term', EX[0], () => v.invalidate(), 340);
        const exB = v.select('Examples', ['x x', 'Ω', 'twice', 'K', 'x (x 0)', 'x x x'].map((l, i) => ({ value: String(i), label: l })), '0', { onChange: () => f.set(EX[+exB.value]) });
        const depth = v.slider('unroll $T = T\\to S$ this many times', 0, 6, 3, { step: 1, int: true });
        let res = null;
        const treeOf = (T, marks = new Set()) => ({ label: T.k === 'f' ? '→' : tyStr(T), mark: T.k === 'v' && marks.has(T.n), kids: T.k === 'f' ? [treeOf(T.a, marks), treeOf(T.b, marks)] : [] });
        v.render(() => {
          res = null;
          if (f.err) { drawParseError(v, sC, f.src, f.err); drawParseError(v, sT, f.src, f.err); return; }
          const t = f.ast, inf = infer(t);
          const fi = inf.ok ? -1 : inf.failed.idx;
          drawSegs(v, sC, tSegs(t), 14, 24, { size: 15 });
          const maxRows = Math.floor((sC.H - 74) / 24);
          inf.cons.slice(0, maxRows).forEach((c, i) => {
            const col = inf.ok || i < fi ? 'green' : i === fi ? 'red' : 'muted';
            const line = `${i + 1}.  ${tyStr(c.a)}  =  ${tyStr(c.b)}`;
            sC.textPx(inf.ok || i < fi ? '✓' : i === fi ? '✗' : '·', 16, 56 + i * 24, { size: 14, weight: 800, color: col, align: 'left', halo: false });
            sC.textPx(line, 38, 56 + i * 24, { size: 13.5, weight: 600, color: col === 'muted' ? 'muted' : 'ink', align: 'left', halo: false });
            sC.textPx(c.why.length > 34 ? c.why.slice(0, 32) + '…' : c.why, sC.W - 12, 56 + i * 24, { size: 11, color: 'muted', align: 'right', halo: false });
          });
          if (inf.cons.length > maxRows) sC.textPx(`… ${inf.cons.length - maxRows} more`, 38, 56 + maxRows * 24, { size: 11.5, color: 'muted', align: 'left', halo: false });
          if (!inf.ok) {
            const q = inf.failed, ra = q.ra, rb = q.rb;
            sC.textPx(q.occurs ? `fails: ${tyStr(ra)} = ${tyStr(rb)} would make a type contain itself` : `fails: ${tyStr(ra)} and ${tyStr(rb)} cannot be equal`, sC.W / 2, sC.H - 14, { size: 12.5, weight: 700, color: 'red', align: 'center', halo: false });
            if (q.occurs) {
              const vr = ra.k === 'v' ? ra : rb, body = ra.k === 'v' ? rb : ra;
              let u = TV(vr.n); const marks = new Set([vr.n]);
              for (let i = 0; i < depth.value; i++) { const sg = []; sg[vr.n] = u; u = tySubst(body, sg); }
              const tr = treeOf(u, marks), L = layoutG(tr);
              depth.el.hidden = false;
              drawTreePx(v, sT, L, { size: 12.5, dy: 46, labelOf: (nd) => nd.n.label, fill: (nd) => (nd.n.mark ? 'red' : nd.n.label === '→' ? null : 'accent'), ring: null });
              res = { fail: true, occurs: true, nodes: L.nodes.length, vr, body, q };
            } else {
              depth.el.hidden = true;
              const tr = { label: '≠', kids: [treeOf(ra), treeOf(rb)] }, L = layoutG(tr);
              drawTreePx(v, sT, L, { size: 12.5, dy: 46, labelOf: (nd) => nd.n.label, fill: (nd) => (nd.n.label === '≠' ? 'red' : nd.n.label === '→' ? null : 'accent') });
              res = { fail: true, occurs: false, q };
            }
          } else {
            depth.el.hidden = true;
            const L = layoutG(treeOf(inf.ty));
            drawTreePx(v, sT, L, { size: 12.5, dy: 46, labelOf: (nd) => nd.n.label, fill: (nd) => (nd.n.label === '→' ? null : 'green') });
            res = { fail: false, ty: inf.ty };
          }
          const nf = normalizeTM(t, 40, 400);
          res.norm = nf;
        });
        v.readout(() => {
          if (!res) return '';
          const nfT = res.norm.ok ? `it **does** reach a normal form (${res.norm.n} step${res.norm.n === 1 ? '' : 's'})` : 'its reduction **does not terminate** within 40 steps';
          if (!res.fail) return `**Typable.** The most general type is $${dTex(tyStr(res.ty))}$, with Greek letters standing for any types. As strong normalization (4.11) demands, ${nfT}.`;
          const why = res.occurs ? `The equation $${dTex(tyStr(res.q.ra) + ' = ' + tyStr(res.q.rb))}$ asks a type to be a proper part of itself (occurs check)${res.nodes ? `; unrolled $${depth.value}$ times the tree already has $${res.nodes}$ nodes and is not finished` : ''}.` : `The equation forces two different type constructors to be equal.`;
          return `**Not typable.** ${why} For this term, ${nfT}: untypable terms may or may not terminate (here only “is typable” implies “terminates”, not the converse).`;
        });
      },
    },
  ],
};
