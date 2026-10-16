// Programming Languages & Types — Chapter 4: Types and type safety (items 4.6–4.9)
import {
  NB, fromNB, derive, derivNodes, firstFail, TY_RULES, tStr, tx, tyStr, tyEq, parseTM, parseTy, typeOf, tErase, tSubst, tSubterms, tKids, tSize, tFV,
  TB, TN, TF, TYPES1, infer, annotate, tySubst, tyVars, tV, nbType, nbTypeLit, nbRunFinal,
  drawDeriv, hitDeriv, drawRuleSchema, drawChips, hitChip, drawTally, layoutG, drawTreePx, hitNode, drawSegs, drawParseError, field, pxStage,
} from './ch04.shared.js';

const tmField = (v, label, def, onChange, width = 380) => field(v, label, def, parseTM, { width, onChange });
const dTex = (str) => tx(str);

// ---- 4.6: a cache of all NB terms of at most N nodes with a safety verdict
const termCache = new Map();
function allTerms(N) {
  if (termCache.has(N)) return termCache.get(N);
  const out = [];
  for (let n = 1; n <= N; n++) for (const t of NB.termsOfSize(n)) out.push({ t, safe: nbRunFinal(t).status === 'value', ty: nbType(t), lit: nbTypeLit(t) });
  termCache.set(N, out); return out;
}
const collatz = (n) => { let c = 0; while (n !== 1) { n = n % 2 ? 3 * n + 1 : n / 2; c++; } return c; };

export default {
  collection: 'pl',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Concept', name: 'Type systems are conservative',
      statement: String.raw`A static type system is a *decidable* and *sound* approximation of “this program will not go wrong”: it accepts only programs that are safe (4.5), and it always answers. It cannot also be *complete*. The term $\mathtt{if\ true\ then\ 0\ else\ false}$ runs to $0$ without any trouble, but T-If demands branches of one type, so it is rejected. Making the checker smarter moves the line but cannot remove it: in a language that can express every computation, “never gets stuck” is a nontrivial property of what a program computes, and by Rice's theorem (toc-10.5) no total algorithm decides it.`,
      idea: String.raw`The checker looks only at the shape of a term, never at the values that will flow through it, so it must assume the worst in every branch: both arms of an $\mathtt{if}$ are checked although only one will run. A checker that rejected *exactly* the unsafe programs would have to find out what the guard evaluates to, i.e. run the program. In our little language every program terminates, so even that is possible (we show it as the “oracle”); with loops or recursion, deciding whether a guard like “this computation reaches 1” is true is the halting problem in disguise. Every practical type system therefore trades some expressiveness for decidability and picks its line; richer systems (polymorphism, subtyping, dependent types) accept more safe programs, never all of them.`,
      caption: String.raw`Top: all terms with at most $n$ nodes, classified by what the checker says (rows) and what happens when they run (columns). The bottom-left cell is the price of decidability: safe programs rejected. Switch the checker to a smarter one that looks at literal guards, or to an oracle that runs the program, and watch the cell shrink to zero (oracle) only by running programs. Click a grey chip to see why a safe term is rejected. Bottom: if the language had loops, a checker with a step budget must give up on slow guards; drag the budget.`,
      deps: ['pl-4.5', 'toc-10.5'], refs: ['Pierce §8.2', 'Pierce §1.2'], tags: ['type systems', 'decidability'],
      scope: String.raw`The counts are for the arithmetic-and-boolean language of chapter 1, where every program terminates. The Collatz panel is an illustration of ours of why an exact check needs loops to be undecidable; whether the Collatz iteration reaches 1 for every start is an open problem, so the panel only claims what it computes (every start up to 300 does).`,
      viz(v) {
        const sQ = pxStage(v, { height: 340, full: true, title: 'All terms up to a given size: what the checker says versus what happens' });
        const sB = v.stage({ x: [0, 301], y: [0, 140], axes: 'box', gutter: true, full: true, height: 230, xlabel: 'starting value n of the Collatz iteration', ylabel: 'steps until it reaches 1', title: 'If the language had loops: “if collatz(n) reaches 1 then 0 else false”' });
        const chk = v.select('Checker', [{ value: 'std', label: 'standard T-If' }, { value: 'lit', label: 'looks at literal guards' }, { value: 'oracle', label: 'oracle: run it' }], 'std', { onChange: () => { sel = null; v.invalidate(); } });
        const nMax = v.slider('terms with at most $n$ nodes', 3, 7, 5, { step: 1, int: true, onChange: () => { sel = null; } });
        const budget = v.slider('checker’s step budget', 5, 140, 60, { step: 1, int: true });
        let sel = null, cells = [], chipInfo = null, tally = null;
        const accept = (r) => (chk.value === 'std' ? !!r.ty : chk.value === 'lit' ? !!r.lit : r.safe);
        sQ.onClick((x, y) => { const b = hitChip(chipInfo, sQ.X(x), sQ.Y(y)); sel = b ? b.chip.data : null; v.invalidate(); });
        v.render(() => {
          const all = allTerms(nMax.value), counts = [[0, 0], [0, 0]], ex = [];
          for (const r of all) { const a = accept(r) ? 0 : 1, s = r.safe ? 0 : 1; counts[a][s]++; if (a === 1 && s === 0 && ex.length < 60) ex.push(r); }
          tally = counts;
          cells = drawTally(v, sQ, { rows: ['checker accepts', 'checker rejects'], cols: ['safe: runs to a value', 'goes wrong: gets stuck'], counts, tone: [['green', 'red'], ['orange', 'green']], region: [8, 4, sQ.W - 8, sQ.H - 112] });
          const cap = ex.length ? 'safe programs the checker rejects (click one):' : chk.value === 'oracle' ? 'the oracle rejects no safe program, but it had to run all of them' : 'no safe program is rejected';
          sQ.textPx(cap, 12, sQ.H - 92, { size: 12, color: 'muted', align: 'left', halo: false });
          chipInfo = drawChips(v, sQ, ex.map((r) => ({ text: NB.str(r.t), color: sel === r ? 'accent' : 'muted', fill: sel === r ? 'accent' : null, hot: sel === r, data: r })), { region: [12, sQ.H - 80, sQ.W - 12, sQ.H - 4], size: 12 });
          // Collatz budget bars
          const bars = []; for (let n = 1; n <= 300; n++) bars.push(collatz(n));
          sB.bars(bars, { x0: 1, dx: 1, color: (val) => (val <= budget.value ? 'green' : 'orange') });
          sB.hline(budget.value, { color: 'red', width: 2 });
          sB.tex('\\text{budget}', 6, budget.value + 6, { color: 'red', size: 12, align: 'left' });
        });
        v.legend([['green', 'accepted within budget'], ['orange', 'safe, but rejected: needs more steps than the budget']]);
        v.readout(() => {
          const c = tally; let s = '';
          if (c) s += `**Checker “${chk.value === 'std' ? 'standard' : chk.value === 'lit' ? 'literal guards' : 'oracle'}”**: accepted-but-stuck $=${c[0][1]}$ (soundness), safe-but-rejected $=${c[1][0]}$ out of $${c[0][0] + c[1][0]}$ safe terms ($${c[0][0] + c[1][0] ? Math.round(100 * c[1][0] / (c[0][0] + c[1][0])) : 0}\\%$ lost).`;
          if (sel) {
            const bad = firstFail(derive(fromNB(sel.t), [], { turn: false }));
            s += `\n$${dTex(NB.str(sel.t))}$ runs to a value, yet ${bad ? `rule ${bad.rule} fails: ${bad.msg}` : 'the standard checker accepts it'}.`;
          }
          const slow = Array.from({ length: 300 }, (_, i) => collatz(i + 1)).filter((x) => x > budget.value).length;
          s += `\nWith budget $${budget.value}$, the budgeted checker rejects $${slow}$ of the starting values $1\\ldots300$ although all of them reach 1 (the slowest takes $127$ steps, at $n=231$).`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Definition', name: 'Simply typed λ-calculus',
      statement: String.raw`**Types** are built from base types and arrows: $T ::= \mathsf{Bool}\mid\mathsf{Nat}\mid T\to T$ (the arrow associates to the right). **Terms** are the variables, abstractions $\lambda x{:}T.\,t$ (the binder carries its type), applications $t\,t$, and the constants and operators of 4.1. A **context** $\Gamma$ is a finite list of bindings $x{:}T$. The typing relation $\Gamma\vdash t:T$ has the rules of 4.1 (with $\Gamma$ carried along) and
- T-Var: if $x{:}T\in\Gamma$ then $\Gamma\vdash x:T$ (the rightmost binding of $x$ wins);
- T-Abs: if $\Gamma,x{:}T_1\vdash t_2:T_2$ then $\Gamma\vdash\lambda x{:}T_1.\,t_2:T_1\to T_2$;
- T-App: if $\Gamma\vdash t_1:T_1\to T_2$ and $\Gamma\vdash t_2:T_1$ then $\Gamma\vdash t_1\,t_2:T_2$.`,
      idea: String.raw`Functions get arrow types and the context records what each free variable is assumed to be. Crossing a $\lambda$ adds one assumption to $\Gamma$ for the body, so $\Gamma$ grows as the derivation climbs through binders and shrinks again at their conclusion; this is why the same variable name can have different types in different parts of a term. The rules are still syntax-directed: one rule per term constructor. The calculus is the typed counterpart of the untyped $\lambda$-calculus of chapter 2, and is the core of every typed functional language.`,
      caption: String.raw`Type a term (write $\lambda x{:}\mathsf{Nat}.\ t$, types $\mathsf{Nat}\to\mathsf{Nat}$ with an arrow or “->”) or choose an example. Every node of the derivation shows its own context $\Gamma$ before the turnstile; click a node to see its context as chips and the rule. Ill-typed terms mark the node where a rule fails.`,
      deps: ['pl-2.4', 'pl-4.1'], refs: ['Pierce §9.1', 'Pierce §9.2'], tags: ['lambda calculus', 'typing'],
      credit: 'A. Church, 1940 (J. Symbolic Logic 5(2), “A formulation of the simple theory of types”) is the source of the simply typed λ-calculus; the presentation with typing contexts follows later textbooks',
      verify: true,
      viz(v) {
        const sD = pxStage(v, { height: 260, full: true, title: 'Typing derivation' });
        const sG = pxStage(v, { height: 108, full: true, title: 'Context and rule of the selected node' });
        const EX = ['λx:Nat. succ x', 'λf:Nat->Nat. λx:Nat. f (f x)', '(λx:Nat. iszero x) 3', 'λb:Bool. λn:Nat. if b then n else 0', 'λx:Nat. x x', '(λx:Nat. x) true'];
        const f = tmField(v, 'term', EX[1], () => { sel = null; v.invalidate(); });
        const exB = v.select('Examples', ['succ', 'twice', 'apply', 'two binders', 'x x', 'bad arg'].map((l, i) => ({ value: String(i), label: l })), '1', { onChange: () => f.set(EX[+exB.value]) });
        let sel = null, info = null, D = null;
        sD.onClick((x, y) => { if (!info) return; const n = hitDeriv(info, sD.X(x), sD.Y(y)); if (n) { sel = n; v.invalidate(); } });
        v.render(() => {
          info = null; D = null;
          if (f.err) { drawParseError(v, sD, f.src, f.err); return; }
          D = derive(f.ast);
          const all = derivNodes(D), selNode = sel && all.find((n) => n.c === sel.c && n.rule === sel.rule);
          info = drawDeriv(v, sD, D, { color: (n) => (n.fail ? 'red' : n.open ? 'orange' : 'ink'), ring: (n) => (selNode && n.c === selNode.c && n.rule === selNode.rule ? 'gold' : null) });
          if (selNode) {
            const chips = selNode.ctx.length ? selNode.ctx.map(([x, T], i) => ({ text: `${x} : ${tyStr(T)}`, color: i === selNode.ctx.length - 1 && selNode.rule === 'T-Var' ? 'accent' : 'muted' })) : [{ text: '∅ (empty context)', color: 'muted' }];
            sG.textPx('Γ =', 14, 20, { size: 13, weight: 700, align: 'left', halo: false });
            drawChips(v, sG, chips, { region: [48, 8, sG.W / 2 - 10, sG.H - 4], size: 12.5 });
            drawRuleSchema(v, sG, selNode.rule, TY_RULES, sG.W * 0.72, 24, { color: selNode.fail ? 'red' : 'ink', size: 12 });
            if (selNode.msg) sG.textPx(selNode.msg, sG.W * 0.72, sG.H - 12, { size: 11.5, color: 'red', align: 'center', halo: false });
          } else sG.textPx('click a node: its Γ appears here', sG.W / 2, sG.H / 2, { size: 13, color: 'muted', align: 'center', halo: false });
        });
        v.legend([['red', 'rule cannot be applied', { dot: true }], ['orange', 'blocked below a failure', { dot: true }]]);
        v.readout(() => {
          if (!D) return 'Enter a term; annotate each binder, as in $\\lambda x{:}\\mathsf{Nat}.\\ x$.';
          const maxG = Math.max(...derivNodes(D).map((n) => n.ctx.length));
          if (D.ty) return `$${dTex('⊢ ' + tStr(f.ast) + ' : ' + tyStr(D.ty))}$. The context grows to at most $${maxG}$ binding${maxG === 1 ? '' : 's'} on the way up.`;
          const bad = firstFail(D);
          return `**Not typable.** Rule ${bad.rule} fails at $${dTex(tStr(bad.term))}$: ${bad.msg}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8', kind: 'Theorem', name: 'Uniqueness of types and type checking',
      statement: String.raw`In the simply typed $\lambda$-calculus every term has **at most one type** in a given context: if $\Gamma\vdash t:T$ and $\Gamma\vdash t:T'$ then $T=T'$. Moreover the type is computed by a terminating recursive procedure that goes bottom-up: a variable looks itself up in $\Gamma$; $\lambda x{:}T_1.t_2$ computes the type $T_2$ of $t_2$ in $\Gamma,x{:}T_1$ and returns $T_1\to T_2$; an application computes the types of both parts and succeeds if the first is an arrow whose domain equals the second. Hence typability is decidable. The uniqueness uses the annotations on binders; without them a term such as $\lambda x.\,x$ has infinitely many types.`,
      idea: String.raw`The rules are syntax-directed (inversion, 4.2, for $\lambda$-terms): the last rule of any derivation is determined by the outermost constructor, and its premises are about the immediate subterms. By induction on $t$ the type of each subterm is therefore forced, so the type of $t$ is forced, and the checking procedure is just this induction run as a program, with a clause that fails where the rule's side condition fails. The annotation $\lambda x{:}T_1$ is what removes the only choice; the unannotated (Curry-style) calculus has principal types instead of unique ones.`,
      caption: String.raw`Edit the term and step through the checker with the slider: nodes are visited children-first and each shows the type it returns. A failing node (red) stops the walk with the mismatch. Below the tree, the second panel tests every candidate type for the annotated term (exactly one passes) and, with annotations erased, lists the many types the bare term can be given.`,
      deps: ['pl-4.7'], refs: ['Pierce §9.3'], tags: ['type checking', 'uniqueness'],
      viz(v) {
        const sT = pxStage(v, { height: 300, full: true, hover: true, title: 'The type checker walking the term bottom-up' });
        const sC = pxStage(v, { height: 130, full: true, title: 'Which types can the term have?' });
        const EX = ['λf:Nat->Nat. λx:Nat. f (f x)', '(λx:Nat. iszero x) 3', 'λx:Bool. if x then 0 else 1', '(λf:Nat->Nat. f 0) true', 'λx:Nat. x'];
        const f = tmField(v, 'term', EX[0], () => { v.invalidate(); stepS.set(60); });
        const exB = v.select('Examples', ['twice', 'apply', 'if', 'mismatch', 'identity'].map((l, i) => ({ value: String(i), label: l })), '0', { onChange: () => f.set(EX[+exB.value]) });
        const stepS = v.slider('nodes visited', 0, 60, 60, { step: 1, int: true });
        const anno = v.select('Annotations', [{ value: 'on', label: 'kept' }, { value: 'off', label: 'erased' }], 'on', { onChange: () => v.invalidate() });
        let L = null, order = [], failIdx = -1, upto = 0, res = null;
        const lblOf = (t) => (t.t === 'l' ? `λ${t.x}:${t.ty ? tyStr(t.ty) : '?'}` : t.t === 'a' ? '@' : t.t === 'i' ? 'if' : t.t === 'p' ? t.op : t.t === 'c' ? (t.c === 'zero' ? '0' : t.c) : t.t === 'd' ? 'default' : t.x);
        const mk = (d) => ({ label: lblOf(d.term), d, kids: d.kids.map(mk) });
        v.render(() => {
          L = null; res = null;
          if (f.err) { drawParseError(v, sT, f.src, f.err); return; }
          const D = derive(f.ast), root = mk(D);
          L = layoutG(root);
          // postorder of layout nodes
          order = []; const po = (nd) => { nd.kids.forEach(po); order.push(nd); }; po(L.nodes[0]);
          failIdx = order.findIndex((nd) => nd.n.d.fail);
          const lim = failIdx >= 0 ? failIdx + 1 : order.length;
          upto = Math.min(stepS.value, lim);
          const seen = new Set(order.slice(0, upto));
          const cur = upto > 0 ? order[upto - 1] : null;
          drawTreePx(v, sT, L, {
            size: 13, dy: 62, labelOf: (nd) => nd.n.label,
            fill: (nd) => (seen.has(nd) ? (nd.n.d.fail ? 'red' : nd.n.d.ty ? 'green' : 'orange') : null),
            ring: (nd) => (nd === cur ? 'gold' : null), dim: (nd) => !seen.has(nd),
            note: (nd) => (seen.has(nd) ? (nd.n.d.fail ? '✗' : nd.n.d.ty ? tyStr(nd.n.d.ty) : '') : ''), noteColor: (nd) => (nd.n.d.fail ? 'red' : 'accent'),
          });
          const cn = cur ? cur.n.d : null;
          if (cn && cn.fail) sT.textPx(cn.msg, sT.W / 2, sT.H - 12, { size: 12.5, color: 'red', align: 'center', halo: false });
          res = { D, done: upto >= order.length || (failIdx >= 0 && upto >= failIdx + 1), cn };
          // second panel
          if (anno.value === 'on') {
            const actual = D.ty;
            sC.textPx(actual ? `each candidate type T, asking whether ⊢ t : T:` : 'the term has no type, so every candidate fails:', 12, 16, { size: 12, color: 'muted', align: 'left', halo: false });
            drawChips(v, sC, TYPES1.map((T) => ({ text: `${tyStr(T)} ${actual && tyEq(actual, T) ? '✓' : '✗'}`, color: actual && tyEq(actual, T) ? 'green' : 'muted', fill: actual && tyEq(actual, T) ? 'green' : null })), { region: [12, 30, sC.W - 12, sC.H - 30], size: 13 });
            sC.textPx(actual ? 'exactly one candidate passes: the type is unique' : '', 12, sC.H - 16, { size: 12.5, weight: 700, color: 'green', align: 'left', halo: false });
            res.cnt = actual ? 1 : 0;
          } else {
            const er = tErase(f.ast), inf = infer(er);
            if (!inf.ok) { sC.textPx('even without annotations the term has no type at all', 12, 30, { size: 13, color: 'red', align: 'left', halo: false }); res.cnt = 0; res.erased = null; return; }
            const vars = [...new Set([...tyVars(inf.ty), ...[...inf.binders.values()].flatMap((T) => [...tyVars(T)])])];
            const CAND = [TB, TN, TF(TB, TB), TF(TN, TN)], found = new Map(); let tried = 0;
            const total = Math.pow(CAND.length, vars.length);
            for (let m = 0; m < Math.min(total, 256); m++) {
              const sigma = []; let q = m; for (const x of vars) { sigma[x] = CAND[q % CAND.length]; q = Math.floor(q / CAND.length); }
              const ann = annotate(er, new Map([...inf.binders].map(([k, T]) => [k, tySubst(T, sigma)])));
              const ty = typeOf(ann); tried++;
              if (ty) found.set(tyStr(ty), ty);
            }
            sC.textPx(`principal type: ${tyStr(inf.ty)}   —   instances found among ${tried} annotations tried:`, 12, 16, { size: 12, color: 'muted', align: 'left', halo: false });
            drawChips(v, sC, [...found.keys()].map((k) => ({ text: k, color: 'orange', fill: 'orange' })), { region: [12, 30, sC.W - 12, sC.H - 30], size: 12.5 });
            sC.textPx(`${found.size} different types, and infinitely many in all`, 12, sC.H - 16, { size: 12.5, weight: 700, color: 'orange', align: 'left', halo: false });
            res.cnt = found.size; res.erased = inf;
          }
        });
        v.readout(() => {
          if (!res) return '';
          let s = res.D.ty ? `Checker result: $${dTex(tyStr(res.D.ty))}$` : '**The checker rejects the term.**';
          if (!res.done) s += ` (stopped after ${upto} of ${order.length} nodes)`;
          s += anno.value === 'on' ? `. Candidate types that pass: $${res.cnt}$ — uniqueness.` : `. Without annotations the bare term has $${res.cnt}$ distinct types among those tested.`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9', kind: 'Theorem', name: 'Substitution lemma',
      statement: String.raw`If $\Gamma,x{:}S\vdash t:T$ and $\Gamma\vdash s:S$, then $\Gamma\vdash[x\mapsto s]\,t:T$. (Substituting a term of the type the variable was assumed to have preserves the type of the term; substitution is capture-avoiding.)`,
      idea: String.raw`Induction on the derivation of $\Gamma,x{:}S\vdash t:T$. If $t$ is the variable $x$, then $T=S$ and the result is $s$, typed by the second hypothesis. If $t$ is another variable the substitution does nothing. For an abstraction $\lambda y{:}T_1.t_2$ rename $y$ away from $x$ and from the free variables of $s$ (this is where capture-avoidance, 2.3, is used), apply the induction hypothesis to the body in the extended context, and weaken $s$'s typing to $\Gamma,y{:}T_1$. The other rules just recombine the results. In picture form: the derivation of $[x\mapsto s]t$ is the derivation of $t$ with every leaf T-Var for $x$ replaced by the entire derivation of $s$.`,
      caption: String.raw`Top: the derivation of $t$ in the context $y{:}\mathsf{Nat},\,x{:}S$. Bottom: the derivation of $[x\mapsto s]\,t$; the grafted subtrees, copies of the derivation of $s$, are ringed green. Pick another $s$ or type your own: a term of the wrong type for $x$ breaks the derivation at the graft.`,
      deps: ['pl-4.7'], refs: ['Pierce §9.3'], tags: ['substitution', 'typing'],
      viz(v) {
        const sA = pxStage(v, { height: 190, full: true, title: 'Γ, x:S ⊢ t : T' });
        const sB = pxStage(v, { height: 215, full: true, title: 'Γ ⊢ [x ↦ s] t : T, with the derivation of s grafted in' });
        const EX = [
          { t: 'x (x 0)', S: 'Nat->Nat', s: 'λz:Nat. succ z' },
          { t: 'if iszero x then y else succ x', S: 'Nat', s: 'pred y' },
          { t: 'λy:Nat. x', S: 'Nat', s: 'y' },
          { t: 'if iszero x then 0 else succ x', S: 'Nat', s: 'true' },
        ];
        const tF = tmField(v, 't', EX[0].t, () => v.invalidate(), 340);
        const SS = v.select('Type S of x', ['Nat', 'Bool', 'Nat->Nat'], 'Nat->Nat', { onChange: () => v.invalidate() });
        const sF = tmField(v, 's', EX[0].s, () => v.invalidate(), 340);
        const exB = v.select('Examples', ['apply twice', 'free y', 'capture', 'wrong type'].map((l, i) => ({ value: String(i), label: l })), '0', { onChange: () => { const e = EX[+exB.value]; tF.set(e.t); SS.set(e.S); sF.set(e.s); } });
        let out = null;
        v.render(() => {
          out = null;
          if (tF.err) { drawParseError(v, sA, tF.src, tF.err); return; }
          if (sF.err) { drawParseError(v, sA, sF.src, sF.err); return; }
          const S = parseTy(SS.value).ast, G = [['y', TN]];
          const t = tF.ast, s = sF.ast;
          const d1 = derive(t, [...G, ['x', S]]), ds = derive(s, G);
          const sub = tSubst(t, 'x', s), d2 = derive(sub, G);
          const grafted = tSubterms(s);
          drawDeriv(v, sA, d1, { color: (n) => (n.fail ? 'red' : n.open ? 'orange' : 'ink'), ring: (n) => (n.term.t === 'v' && n.term.x === 'x' ? 'accent' : null) });
          drawDeriv(v, sB, d2, { color: (n) => (n.fail ? 'red' : n.open ? 'orange' : 'ink'), ring: (n) => (grafted.has(n.term) ? 'green' : null) });
          const occ = derivNodes(d1).filter((n) => n.term.t === 'v' && n.term.x === 'x').length;
          out = { d1, d2, ds, S, occ, sub, n1: derivNodes(d1).length, n2: derivNodes(d2).length, ns: derivNodes(ds).length, okS: ds.ty && tyEq(ds.ty, S) };
        });
        v.legend([['accent', 'T-Var for x (to be replaced)', { dot: true }], ['green', 'grafted derivation of s', { dot: true }], ['red', 'rule cannot be applied', { dot: true }]]);
        v.readout(() => {
          if (!out) return '';
          const { d1, d2, ds, S, occ, n1, n2, ns, okS } = out;
          let s = `Hypotheses: $${dTex('y:Nat, x:' + tyStr(S) + ' ⊢ t : ' + (d1.ty ? tyStr(d1.ty) : '?'))}$ ${d1.ty ? '✓' : '✗'}; $${dTex('y:Nat ⊢ s : ' + (ds.ty ? tyStr(ds.ty) : '?'))}$ ${okS ? '✓ (type S, as required)' : ds.ty ? '✗ (s does not have type S)' : '✗'}.`;
          if (d1.ty && okS) s += `\nConclusion: $${dTex('⊢ [x↦s]t : ' + (d2.ty ? tyStr(d2.ty) : '?'))}$ ${d2.ty && tyEq(d1.ty, d2.ty) ? '✓, the same type' : '✗'}. The derivation has $${n2}$ nodes $= ${n1} - ${occ} + ${occ}\\cdot ${ns}$ (nodes of $t$, minus the $${occ}$ leaves for $x$, plus $${occ}$ copies of the $${ns}$-node derivation of $s$).`;
          else s += `\nThe lemma's hypotheses fail, so it says nothing; the substituted term ${d2.ty ? 'happens to be typable' : 'is **not** typable'}.`;
          return s;
        });
      },
    },
  ],
};
