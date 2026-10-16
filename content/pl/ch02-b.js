// Programming Languages & Types — Chapter 2: The untyped λ-calculus (items 2.7–2.12; 2.1–2.6 in ch02.js)
import {
  V, L, A, fv, subst, parse, P, DEFS, key, alphaEq, layoutTerm, show, drawLine, redexes, contract, getAt, cat, size,
  runStrategy, normalize, makeGraph, drawGraph, STRATS, decode, drawTrace, boolOf, churchNum, church, toDB, fromDB, freeOrder, layoutDB, DB,
  shiftDB, substDB, betaDB, dbStr, layoutG, drawTreePx, field, pxStage, drawParseError, rrect, findRedex,
} from './ch02.shared.js';

const tf = (v, label, def, onChange, width = 340) => field(v, label, def, (s) => parse(s, DEFS), { width, onChange });
const ptr = (s) => { const p = s.pointer; return p && p.inside ? { x: s.X(p.x), y: s.Y(p.y) } : null; };
const txt = (t, o) => '\\mathtt{' + show(t, o).replace(/λ/g, '\\lambda ').replace(/ /g, '\\ ') + '}';
const NICE = { abbr: { names: true } };
const NUMS = { abbr: { names: true, nums: true } };
const dbTex = (x) => x.replace(/λ/g, '\\lambda').replace(/ /g, '\\ ');
const COLS = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
const countF = (t) => { let n = 0; while (t.t === 'a' && t.f.t === 'v' && t.f.x === 'f') { n++; t = t.a; } return t.t === 'v' && t.x === 'x' ? n : -1; };

// ---- a lazy (call-by-need) closure evaluator for closed terms: used to run a compiled Turing machine fast and to read the result back
const thunk = (f) => { let done = false, val; return () => { if (!done) { val = f(); done = true; f = null; } return val; }; };
function compileDB(d) {
  if (d.t === 'i') return (env) => env[env.length - 1 - d.n]();
  if (d.t === 'l') { const b = compileDB(d.b); return (env) => (arg) => b([...env, arg]); }
  const f = compileDB(d.f), a = compileDB(d.a);
  return (env) => f(env)(thunk(() => a(env)));
}
const evalClosed = (t) => compileDB(toDB(t, []))([]);

export default {
  collection: 'pl',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7', kind: 'Method', name: 'Church numerals and arithmetic',
      statement: String.raw`The **Church numeral** of $n$ is $\overline{n}=\lambda f\,x.\,f^{n}x=\lambda f\,x.\,f(f(\cdots(f\,x)\cdots))$ ($n$ applications): it is the function “iterate $n$ times”. With $\mathsf{succ}=\lambda n\,f\,x.\,f\,(n\,f\,x)$, $\mathsf{plus}=\lambda m\,n\,f\,x.\,m\,f\,(n\,f\,x)$, $\mathsf{times}=\lambda m\,n\,f.\,m\,(n\,f)$, $\mathsf{pow}=\lambda m\,n.\,n\,m$ and $\mathsf{iszero}=\lambda n.\,n\,(\lambda z.\,\mathsf{false})\,\mathsf{true}$ one has, for all $m,n\in\N$: $\mathsf{succ}\,\overline m\to^{*}_\beta\overline{m+1}$, $\mathsf{plus}\,\overline m\,\overline n\to^{*}_\beta\overline{m+n}$, $\mathsf{times}\,\overline m\,\overline n\to^{*}_\beta\overline{mn}$, $\mathsf{pow}\,\overline m\,\overline n\to^{*}_\beta\overline{m^n}$ (for $n\ge1$), and $\mathsf{iszero}$ returns $\mathsf{true}$ on $\overline 0$ and $\mathsf{false}$ on every other numeral. The **predecessor** is definable, but not by a direct rearrangement: $\mathsf{pred}=\lambda n.\,\mathsf{fst}\,(n\,(\lambda p.\,\mathsf{pair}\,(\mathsf{snd}\,p)\,(\mathsf{succ}\,(\mathsf{snd}\,p)))\,(\mathsf{pair}\,\overline0\,\overline0))$ satisfies $\mathsf{pred}\,\overline{n+1}\to^*_\beta\overline n$ and $\mathsf{pred}\,\overline0\to^*_\beta\overline0$.`,
      idea: String.raw`If a numeral is “do $f$ that many times”, then adding is doing $f$ first $n$ times and then $m$ times (plus), multiplying is iterating the iteration (times: $(n\,f)$ is “$f$ done $n$ times” and $m$ copies of that), and exponentiation is applying the numeral $n$ to the numeral $m$ itself (pow). Pred is hard because a numeral can only be consumed by iterating; one iterates a step that maps the pair $(k-1,k)$ to $(k,k+1)$, starting at $(0,0)$ and reads the first component, so $\mathsf{pred}$ costs about $n$ steps while $\mathsf{succ}$ costs a constant. (For $n=0$, $\mathsf{pow}\,\overline m\,\overline0\to^*_\beta\lambda x.\,x$, which is $\eta$-equal to $\overline1$ but not the numeral itself: see 2.12.)`,
      caption: String.raw`Choose an operation and the inputs $m,n$; the term is applied to two free variables $f$ and $x$ so that the numeral that comes out is visible as a chain of $f$'s (panel below). Drag “step” along the normal-order reduction. The right panel measures, by actual reduction, how many $\beta$-steps $\mathsf{succ}$, $\mathsf{pred}$, $\mathsf{times}\,n\,n$ and $\mathsf{pow}\,2\,n$ take as $n$ grows.`,
      deps: ['pl-2.6'], refs: ['Pierce §5.2'], tags: ['encoding', 'arithmetic'],
      credit: 'Alonzo Church, 1930s; the predecessor via pairs is due to Stephen Kleene (1935, found at the dentist, as the story goes)',
      viz(v) {
        const sT = pxStage(v, { height: 270, minWidth: 380, weight: 1.5, title: 'Normal-order reduction of  Op m n f x' });
        const sC = pxStage(v, { x: [0, 8], y: [1, 700], ylog: true, axes: 'box', gutter: true, height: 270, minWidth: 260, xlabel: 'n', ylabel: 'β-steps (normal order)', title: 'Cost as n grows' });
        const sR = pxStage(v, { height: 108, full: true, title: 'The numeral that comes out: f applied that many times to x' });
        const OPS = [
          { id: 'Succ', label: 'succ m', un: true, fn: (m) => m + 1 }, { id: 'Plus', label: 'plus', fn: (m, n) => m + n }, { id: 'Times', label: 'times', fn: (m, n) => m * n },
          { id: 'Pow', label: 'pow', fn: (m, n) => m ** n }, { id: 'Pred', label: 'pred m', un: true, fn: (m) => Math.max(0, m - 1) }, { id: 'Sub', label: 'minus', fn: (m, n) => Math.max(0, m - n) },
        ];
        const op = v.select('Operation', OPS.map((o) => ({ value: o.id, label: o.label })), 'Times');
        const mS = v.slider('m', 0, 5, 3, { step: 1, int: true });
        const nS = v.slider('n', 0, 5, 4, { step: 1, int: true });
        const kS = v.slider('step', 0, 40, 40, { step: 1, int: true });
        const SER = [
          { name: 'succ n', color: 'green', f: (n) => `Succ ${n} f x` }, { name: 'pred n', color: 'red', f: (n) => `Pred ${n} f x` },
          { name: 'times n n', color: 'accent', f: (n) => `Times ${n} ${n} f x` }, { name: 'pow 2 n', color: 'orange', f: (n) => `Pow 2 ${n} f x` },
        ];
        const cost = SER.map((S) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => normalize(P(S.f(n)), 100000, 100000).steps));
        v.legend(SER.map((S) => [S.color, S.name]));
        let cur = null;
        v.render(() => {
          const O = OPS.find((o) => o.id === op.value), m = mS.value, n = O.id === 'Pow' ? Math.min(nS.value, 4) : nS.value;
          nS.el.hidden = !!O.un; kS.el.hidden = false;
          const src = O.un ? `${O.id} ${m} f x` : `${O.id} ${m} ${n} f x`;
          const run = runStrategy(P(src), 'normal', { max: 400, maxSize: 4000 });
          const k = Math.min(kS.value, run.paths.length);
          drawTrace(v, sT, run, k, { abbr: { names: true, nums: true }, size: 15.5 });
          sT.textPx(k === run.paths.length ? 'normal form' : `step ${k} of ${run.paths.length}`, sT.W - 10, sT.H - 10, { size: 11.5, color: 'muted', align: 'right', weight: 700 });
          const fin = normalize(run.states[run.states.length - 1], 20000, 20000).t, got = countF(fin), want = O.fn(m, n);
          cur = { got, want, steps: run.paths.length, src };
          // chain of f's
          const cap = 36, show_ = Math.min(got, cap);
          const w = sR.W - 90, dx = Math.min(44, w / (show_ + 1)), y = 54;
          if (got < 0) sR.textPx('not a numeral applied to f x', sR.W / 2, y, { size: 14, color: 'red', align: 'center' });
          else {
            sR.textPx(`${got}`, 26, y, { size: 26, weight: 700, color: 'accent', align: 'center', halo: false });
            const x0 = 68;
            for (let i = 0; i < show_; i++) {
              const cx = x0 + i * dx; sR.ctx.save(); sR.ctx.strokeStyle = v.color('accent', 1); sR.ctx.fillStyle = v.color('accent', 0.15); sR.ctx.lineWidth = 1.8;
              rrect(sR.ctx, cx - 14, y - 15, 28, 30, 8); sR.ctx.fill(); sR.ctx.stroke(); sR.ctx.restore();
              sR.textPx('f', cx, y, { size: 15, weight: 700, color: 'accent', align: 'center', halo: false });
            }
            const xe = x0 + show_ * dx;
            sR.ctx.save(); sR.ctx.fillStyle = v.color('green', 0.2); sR.ctx.strokeStyle = v.color('green', 1); sR.ctx.lineWidth = 1.8; rrect(sR.ctx, xe - 14, y - 15, 28, 30, 15); sR.ctx.fill(); sR.ctx.stroke(); sR.ctx.restore();
            sR.textPx('x', xe, y, { size: 15, weight: 700, color: 'green', align: 'center', halo: false });
            if (got > cap) sR.textPx(`… (${got - cap} more f)`, xe + 24, y, { size: 12, color: 'muted', align: 'left', halo: false });
          }
          // cost chart
          SER.forEach((S, i) => { sC.path(cost[i].map((c, j) => [j, Math.max(1, c)]), { color: S.color, width: 2.4 }); sC.dots(cost[i].map((c, j) => [j, Math.max(1, c)]), { r: 3, color: S.color }); });
        });
        v.readout(() => {
          if (!cur) return '';
          const O = OPS.find((o) => o.id === op.value);
          return `$${txt(P(cur.src), { abbr: { names: true, nums: true } })}\\ \\to^{*}\\ f^{${cur.got}}x$ in $${cur.steps}$ steps; expected $${cur.want}$ ${cur.got === cur.want ? '✓' : '✗'}` + (O.id === 'Pred' ? ' · pred must rebuild the numeral (linear in $m$), succ costs 5 steps whatever $m$ is.' : O.id === 'Pow' ? ' · the numeral $n$ (capped at 4 here) is applied to the numeral $m$: the result has $m^n$ copies of $f$.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8', kind: 'Concept', name: 'Divergence: the term Ω',
      statement: String.raw`A term **diverges** (has no normal form along some reduction) when it admits an infinite reduction sequence. The basic example is $\Omega=(\lambda x.\,x\,x)\,(\lambda x.\,x\,x)$: its only redex is the whole term and $\Omega\to_\beta\Omega$, so $\Omega\to_\beta\Omega\to_\beta\cdots$ never reaches a normal form, and the reduction graph is a single node with a loop. Divergence need not be a loop: $(\lambda x.\,x\,x\,x)\,(\lambda x.\,x\,x\,x)\to_\beta (\lambda x.\,x\,x\,x)\,(\lambda x.\,x\,x\,x)\,(\lambda x.\,x\,x\,x)\to_\beta\cdots$ grows at every step. Since $\Omega$ is a term of the calculus, not every term has a normal form, and no evaluation strategy can be both total and complete (compare $(\lambda x.\,y)\,\Omega$ in 2.5).`,
      idea: String.raw`Self-application is the source: the function $\lambda x.\,x\,x$ hands a copy of itself to its argument, and when the argument is itself, the redex rebuilds the same term, as the substitution $[x\mapsto\lambda x.\,x\,x](x\,x)$ is again $(\lambda x.\,x\,x)(\lambda x.\,x\,x)$. This is the same phenomenon that, with a slight twist, yields recursion (2.9): a term that applies something to a copy of itself. Without types, nothing prevents it; the simply typed calculus (Chapter 9) forbids self-application and so removes divergence.`,
      caption: String.raw`Choose a term and drag “step” along its (only) reduction. Top: the term now; middle: the part of the reduction graph reached (a loop for $\Omega$, an ever-growing chain for the variants); bottom: the size of the term at every step, flat for $\Omega$ and linear for the others. The readout tests whether the current term is $\alpha$-equal to the start.`,
      deps: ['pl-2.4'], refs: ['Pierce §5.2'], tags: ['divergence', 'reduction'],
      viz(v) {
        const sT = pxStage(v, { height: 76, full: true, title: 'The term after k steps' });
        const sG = pxStage(v, { height: 262, minWidth: 300, title: 'Reduction graph (first terms)' });
        const N = 24;
        const sS = v.stage({ x: [-0.5, N + 0.5], y: [0, 40], axes: 'box', gutter: true, height: 262, minWidth: 300, xlabel: 'reduction step', ylabel: 'term size (nodes)', title: 'Size of the term' });
        const EX = { om: '(λx. x x) (λx. x x)', tri: '(λx. x x x) (λx. x x x)', tail: '(λx. x x y) (λx. x x y)' };
        const ex = v.select('Term', [{ value: 'om', label: 'Ω' }, { value: 'tri', label: '(λx. x x x)(λx. x x x)' }, { value: 'tail', label: '(λx. x x y)(λx. x x y)' }], 'om');
        const kS = v.slider('step', 0, N, 5, { step: 1, int: true });
        let cache = null;
        const prep = () => {
          if (cache && cache.id === ex.value) return cache;
          const t0 = P(EX[ex.value]); const run = runStrategy(t0, 'normal', { max: N, maxSize: 4000 });
          const G = makeGraph(t0, { cap: 5, maxSize: 300 }); G.exploreAll();
          // a loop repeats forever: extend the sequence periodically up to N steps
          const states = run.states.slice();
          if (run.status === 'loop') { const per = run.states.length - 1 - run.loopAt; for (let i = states.length; i <= N; i++) states.push(run.states[run.loopAt + ((i - run.loopAt) % per)]); }
          cache = { id: ex.value, t0, run, states, G, sizes: states.map(size), keys: states.map((t) => key(t)) };
          return cache;
        };
        v.render(() => {
          const C = prep(), k = Math.min(kS.value, C.states.length - 1), t = C.states[k];
          const lay = layoutTerm(t, {});
          drawLine(v, sT, lay, sT.W / 2, sT.H / 2 + 2, { size: 22, align: 'center', maxW: sT.W - 40, weight: 600, color: 'ink' });
          const cn = C.G.byKey.get(C.keys[k]);
          drawGraph(v, sG, C.G, C.G.nodes, C.G.edges, {
            colorOf: (nd) => (nd === C.G.root ? 'accent' : null), ringOf: (nd) => (cn && nd === cn ? 'gold' : null), edgeColor: () => 'orange', edgeWidth: () => 2,
            labelOf: (nd) => show(nd.term, {}),
          });
          if (!cn) sG.textPx(`step ${k}: beyond the nodes drawn`, sG.W / 2, sG.H - 12, { size: 12, color: 'muted', align: 'center' });
          else if (C.G.nodes.length >= 5) sG.textPx('… and so on', sG.W / 2, sG.H - 12, { size: 12, color: 'muted', align: 'center' });
          const mx = Math.max(...C.sizes);
          sS.setView([-0.5, N + 0.5], [0, Math.max(10, mx * 1.15)]);
          sS.bars(C.sizes, { x0: 0, color: (val, i) => (i === k ? 'gold' : 'accent') });
        });
        v.readout(() => {
          const C = prep(), k = Math.min(kS.value, C.states.length - 1);
          const same = C.keys[k] === C.keys[0];
          const grow = C.sizes[k] - C.sizes[0];
          return `After $${k}$ steps the term has size $${C.sizes[k]}$ (start: $${C.sizes[0]}$) · ${same ? '**α-equal to the start term: the reduction has gone round a loop.**' : `different from the start (size ${grow >= 0 ? '+' : ''}${grow}): the term keeps growing, no term repeats.`} · It has ${redexes(C.states[k]).length} redex, so reduction never stops.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9', kind: 'Theorem', name: 'Fixed-point combinators and recursion',
      statement: String.raw`Every λ-term $F$ has a fixed point: with $Y=\lambda f.\,(\lambda x.\,f\,(x\,x))\,(\lambda x.\,f\,(x\,x))$ one has $Y\,F=_\beta F\,(Y\,F)$ for every term $F$. Hence a recursive equation $r=F\,r$ has the solution $r=Y\,F$. For call-by-value evaluation use $Z=\lambda f.\,(\lambda x.\,f\,(\lambda v.\,x\,x\,v))\,(\lambda x.\,f\,(\lambda v.\,x\,x\,v))$: then $Z\,F\,\to^*\,F\,(\lambda v.\,Z\,F\,v)$ (up to the same $\beta$-steps) so the recursive call is delayed until an argument arrives. For example $\mathsf{fact}=Z\,(\lambda f\,n.\,\mathsf{if}\,(\mathsf{iszero}\,n)\,(\lambda d.\,\overline1)\,(\lambda d.\,\mathsf{times}\,n\,(f\,(\mathsf{pred}\,n)))\,I)$ computes $n!$ on Church numerals under call by value, whereas $Y$ in the same place diverges under call by value, although it works under normal order.`,
      idea: String.raw`$Y\,F$ unfolds to $(\lambda x.\,F(x\,x))(\lambda x.\,F(x\,x))$, a term $\Omega$-like in shape (2.8) that reduces to $F$ applied to a copy of itself: the self-application of Ω is exactly what lets a function receive its own definition as an argument. Under call by value the unfolding is evaluated before $F$ is applied, so $Y$ loops; $Z$ hides the self-application under a $\lambda v$, which is a value, and evaluation stops until the recursive call is really needed. (The branches of the conditional are also wrapped in $\lambda d$ so that the call by value does not evaluate both.)`,
      caption: String.raw`Top: the size of the term over the course of the computation of $n!$, by actually reducing $Z\,F\,\overline n$ or $Y\,F\,\overline n$ under the chosen strategy (a stable term means the computation finishes; unbounded growth means it never does). Bottom: the same fixed-point idea as a JavaScript function: each call of the recursive function is one unfolding $\mathrm{fix}\,F\to F\,(\mathrm{fix}\,F)$; step through the recursion tree.`,
      deps: ['pl-2.8', 'pl-2.5'], refs: ['Pierce §5.2'], tags: ['recursion', 'fixed point'],
      credit: 'Haskell Curry (the Y combinator, 1930s); Z is the call-by-value variant used in Pierce’s TAPL',
      viz(v) {
        const sA = v.stage({ x: [0, 100], y: [0, 100], axes: 'box', gutter: true, height: 238, full: true, xlabel: 'reduction step', ylabel: 'term size', title: 'Computing n! with a fixed-point combinator' });
        const sB = pxStage(v, { height: 300, minWidth: 360, weight: 1.5, title: 'The recursion as unfoldings of fix F → F (fix F)' });
        const comb = v.select('Combinator', [{ value: 'Z', label: 'Z' }, { value: 'Y', label: 'Y' }], 'Z');
        const strat = v.select('Strategy', [{ value: 'value', label: 'call by value' }, { value: 'normal', label: 'normal order' }], 'value');
        const nS = v.slider('n', 0, 3, 3, { step: 1, int: true });
        const FACT = P("λf n. IsZero n (λd. 1) (λd. Times n (f (Pred n))) I");
        const cache = new Map();
        const runFact = (c, s, n) => {
          const k = `${c}${s}${n}`;
          if (!cache.has(k)) {
            const rs = runStrategy(A(A(DEFS[c], FACT), church(n)), s, { max: 3000, maxSize: 3200 });
            const last = rs.states[rs.states.length - 1];
            const nf = rs.status === 'done' ? normalize(last, 60000, 60000) : null;
            cache.set(k, { rs, sizes: rs.states.map(size), val: nf && nf.ok ? churchNum(nf.t) : null });
          }
          return cache.get(k);
        };
        // recursion tree of fix F
        const FUNS = {
          fact: { name: 'fact', F: (self) => (n) => (n === 0 ? 1 : n * self(n - 1)), max: 6 },
          fib: { name: 'fib', F: (self) => (n) => (n < 2 ? n : self(n - 1) + self(n - 2)), max: 5 },
        };
        const fsel = v.select('Recursive function', [{ value: 'fact', label: 'factorial' }, { value: 'fib', label: 'Fibonacci' }], 'fact', { onChange: () => rebuild() });
        const mS = v.slider('m', 0, 5, 4, { step: 1, int: true, onChange: () => rebuild() });
        let tree = null, Lt = null, order = [], unf = 0;
        const build = (fid, m) => {
          const fun = FUNS[fid]; let parent = null, count = 0; order = [];
          // fix F = λx. F (fix F) x : every call of `self` is one unfolding of fix F
          const self = (x) => {
            const node = { label: `${fun.name}(${x})`, kids: [], idx: order.length }; order.push(node); if (parent) parent.kids.push(node);
            const saved = parent; parent = node; count++; const r = fun.F(self)(x); parent = saved; node.val = r; node.last = order.length - 1; return r;
          };
          const r = self(m);
          return { root: order[0], r, count };
        };
        const S = v.steps({ frames: [{}], codePos: 'below', start: 'end', speed: 2.5,
          code: ['fix F  =  λx. F (fix F) x       // Z: delay the unfolding', 'fact = fix (λf. λn. if n = 0 then 1 else n · f (n − 1))', 'fib  = fix (λf. λn. if n < 2 then n else f (n − 1) + f (n − 2))'] });
        function rebuild() {
          const b = build(fsel.value, mS.value); tree = b.root; Lt = layoutG(tree); unf = b.count;
          S.reset(order.map((nd, i) => ({ i, line: fsel.value === 'fact' ? 2 : 3, note: `unfold ${i + 1}: fix F → F (fix F), then call ${nd.label}` })), { at: 'end' });
        }
        rebuild();
        v.render(() => {
          const c = comb.value, s = strat.value, n = nS.value, R = runFact(c, s, n);
          const N = R.sizes.length, mx = Math.max(...R.sizes);
          sA.setView([0, Math.max(10, N - 1) * 1.02], [0, mx * 1.12]);
          const pts = R.sizes.map((z, i) => [i, z]);
          sA.path(pts, { color: R.rs.status === 'done' ? 'green' : 'red', width: 2.2 });
          const last = pts[pts.length - 1];
          sA.dot(last[0], last[1], { r: 5, color: R.rs.status === 'done' ? 'green' : 'red' });
          sA.corner(R.rs.status === 'done' ? `done: ${n}! = ${R.val}` : 'not finished: the term keeps growing', 'tr', { color: R.rs.status === 'done' ? 'green' : 'red', weight: 700 });
          // tree
          const k = S.frame && S.frame.i != null ? S.frame.i : order.length - 1;
          drawTreePx(v, sB, Lt, {
            labelOf: (nd) => nd.n.label, dy: 56, size: 13,
            fill: (nd) => (nd.n.idx === k ? 'gold' : nd.n.idx < k ? 'accent' : null), dim: (nd) => nd.n.idx > k,
            ring: (nd) => (nd.n.idx === k ? 'gold' : null),
            note: (nd) => (nd.n.idx <= k && nd.n.last <= k ? '= ' + nd.n.val : ''), noteColor: () => 'green',
            region: [0, 0, sB.W, sB.H - 10],
          });
        });
        v.readout(() => {
          const c = comb.value, s = strat.value, n = nS.value, R = runFact(c, s, n);
          const st = R.rs.status === 'done' ? `**terminates** after $${R.rs.paths.length}$ β-steps with $${n}!=${R.val}$` : '**does not terminate within the budget**: the term keeps growing';
          // verify Y F = F (Y F) on a free f
          const f = V('f'), yf = A(DEFS.Y, f), fyf = A(f, A(DEFS.Y, f));
          const r1 = runStrategy(yf, 'normal', { max: 2 }), r2 = runStrategy(fyf, 'normal', { max: 1 });
          const join = alphaEq(r1.states[r1.states.length - 1], r2.states[r2.states.length - 1]);
          return `${c} with ${STRATS.find((x) => x.id === s).name.toLowerCase()} on $F\\,\\overline{${n}}$: ${st}.\n$Y\\,f\\to^{2}$ and $f\\,(Y\\,f)\\to^{1}$ reach the same term $${txt(r2.states[r2.states.length - 1], {})}$ ${join ? '✓' : '✗'} · the recursion tree of ${fsel.value}(${mS.value}) has ${unf} unfoldings.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10', kind: 'Theorem', name: 'The λ-calculus is Turing complete',
      statement: String.raw`Every Turing-computable function is λ-definable: for every Turing machine $M$ there is a closed λ-term $\widehat M$ such that, whenever $M$ started on tape $w$ halts with tape $w'$, the term $\widehat M\,\overline{w}$ reduces to (a term representing) $w'$, and when $M$ does not halt on $w$ the term has no normal form. Conversely every λ-definable function is Turing-computable, so the two models have the same computable functions (Church–Turing thesis, for this equivalence a theorem). The construction represents a configuration $(q,\ell,a,r)$ — state, tape left of the head, symbol under the head, tape to the right — by a λ-term, the transition table by a term $\delta$ that takes the state and symbol and returns the next state, the symbol to write and a direction, and the run of the machine by a fixed point (2.9): $\mathsf{run}=Y\,(\lambda r\,c.\ \mathsf{halted}\,c\ c\ (r\,(\mathsf{step}\,c)))$.`,
      idea: String.raw`Booleans, selectors and lists are encoded as in 2.6–2.7 (a state is a selector that picks one of its $k$ arguments, so a table lookup is just an application), the transition function is a nested case analysis done by those selectors, and the unbounded loop is supplied by the fixed-point combinator of 2.9; no other ingredient is needed. The converse direction is simulating β-reduction on a machine tape (a Turing machine can implement the interpreter). Both together say that the λ-calculus computes exactly what machines compute (the equivalence of the two formalisms is due to Church, Kleene, Turing and Rosser in the 1930s); consequences include the undecidability of β-equality and of having a normal form.`,
      caption: String.raw`A real Turing machine is compiled to a λ-term (selectors for states and symbols, a transition term $\delta$, lists for the tape, a step term and $\mathsf{run}=Y(\ldots)$). Both are run on the same tape: the top row is a direct simulation of the machine, the bottom row is the tape read back from the λ-term $\mathsf{step}^k\,\mathsf{init}$ evaluated by a lazy evaluator. They agree at every step; the highlighted row of the table is the transition just used. The last check runs the whole $\mathsf{run}$ term.`,
      deps: ['pl-2.9', 'pl-2.7', 'toc-8.11'], refs: ['Pierce §5.2'], tags: ['computability', 'Turing machines'],
      credit: 'Church and Kleene (λ-definability), Turing (1936–37, the equivalence); the encoding here is the standard one with selectors and lists',
      viz(v) {
        const sT = pxStage(v, { height: 232, minWidth: 380, weight: 1.6, title: 'Tape and head: machine versus λ-term' });
        const sD = pxStage(v, { height: 232, minWidth: 250, title: 'Transition table (the term δ)' });
        const PROGS = {
          inc: { name: 'binary increment', syms: ['_', '0', '1'], states: ['A', 'B', 'H'], input: '1011', delta: {
            A: { _: ['B', '_', 'L'], 0: ['A', '0', 'R'], 1: ['A', '1', 'R'] }, B: { _: ['H', '1', 'L'], 0: ['H', '1', 'L'], 1: ['B', '0', 'L'] } } },
          flip: { name: 'flip all bits', syms: ['_', '0', '1'], states: ['A', 'H'], input: '10110', delta: { A: { _: ['H', '_', 'L'], 0: ['A', '1', 'R'], 1: ['A', '0', 'R'] } } },
          bb3: { name: '3-state busy beaver', syms: ['_', '1'], states: ['A', 'B', 'C', 'H'], input: '', delta: {
            A: { _: ['B', '1', 'R'], 1: ['C', '1', 'L'] }, B: { _: ['A', '1', 'L'], 1: ['B', '1', 'R'] }, C: { _: ['B', '1', 'L'], 1: ['H', '1', 'R'] } } },
        };
        const sel = v.select('Machine', Object.entries(PROGS).map(([k, p]) => ({ value: k, label: p.name })), 'inc', { onChange: () => { inp.set(PROGS[sel.value].input); compile(); } });
        const inp = v.input('input tape', PROGS.inc.input, { width: 120, onChange: () => compile() });
        const kS = v.slider('step', 0, 40, 4, { step: 1, int: true });
        let M = null;
        // ---- direct simulation
        const simulate = (prog, input, max = 60) => {
          const syms = prog.syms, idx = (c) => syms.indexOf(c);
          let q = 0, tape = [...input].map(idx), head = 0; const hist = [];
          if (!tape.length) tape = [0];
          const snap = () => ({ q, tape: tape.slice(), head });
          hist.push(snap());
          for (let s = 0; s < max && q !== prog.states.length - 1; s++) {
            const a = tape[head];
            const [q2, w, d] = prog.delta[prog.states[q]][syms[a]];
            tape[head] = idx(w); q = prog.states.indexOf(q2); head += d === 'R' ? 1 : -1;
            if (head < 0) { tape.unshift(0); head = 0; }
            while (head >= tape.length) tape.push(0);
            hist.push(snap());
          }
          return hist;
        };
        // ---- compile to a λ-term
        const compile = () => {
          const prog = PROGS[sel.value]; const text = inp.value.trim();
          const ok = [...text].every((c) => prog.syms.includes(c) && c !== '_');
          if (!ok) { M = { err: `the tape may contain only: ${prog.syms.filter((c) => c !== '_').join(' ')}` }; return; }
          const nQ = prog.states.length, nS = prog.syms.length;
          const defs = { ...DEFS };
          const lamsOf = (names, body) => names.reduceRight((acc, x) => L(x, acc), V(body));
          const selector = (i, n) => { const names = Array.from({ length: n }, (_, j) => 'a' + j); return lamsOf(names, names[i]); };
          const qn = prog.states.map((_, i) => 'Q' + 'abcdefg'[i]), sn = prog.syms.map((_, i) => 'Y' + 'abcdefg'[i]);
          qn.forEach((nm, i) => { defs[nm] = selector(i, nQ); }); sn.forEach((nm, i) => { defs[nm] = selector(i, nS); });
          defs.Left = P('λl r. l', defs); defs.Right = P('λl r. r', defs);
          defs.Nil = P('λc n. n', defs); defs.Cons = P('λh t c n. c h t', defs);
          defs.Hd = P('λl. l (λh t. h) Ya', defs); defs.Tl = P('λl. l (λh t. t) Nil', defs);
          defs.Cfg = P('λq l a r f. f q l a r', defs);
          const rowOf = (qi) => {
            const st = prog.states[qi]; const d = prog.delta[st];
            const cells = prog.syms.map((c) => { const e = d && d[c]; if (!e) return 'Cfg'; return `(λf. f ${qn[prog.states.indexOf(e[0])]} ${sn[prog.syms.indexOf(e[1])]} ${e[2] === 'L' ? 'Left' : 'Right'})`; });
            return `(a ${cells.join(' ')})`;
          };
          const deltaSrc = `λq a. q ${prog.states.map((_, i) => rowOf(i)).join(' ')}`;
          defs.Delta = P(deltaSrc, defs);
          defs.Step = P('λc. c (λq l a r. Delta q a (λq2 w d. d (Cfg q2 (Tl l) (Hd l) (Cons w r)) (Cfg q2 (Cons w l) (Hd r) (Tl r))))', defs);
          const haltSrc = `(λq. q ${prog.states.map((_, i) => (i === nQ - 1 ? 'True' : 'False')).join(' ')})`;
          defs.Halted = P(haltSrc, defs);
          defs.Run = P('Y (λg c. c (λq l a r. Halted q c (g (Step c))))', defs);
          const arr = [...text].map((c) => prog.syms.indexOf(c));
          const list = (xs) => xs.reduceRight((acc, x) => A(A(defs.Cons, defs[sn[x]]), acc), defs.Nil);
          const init = arr.length ? A(A(A(A(defs.Cfg, defs.Qa), defs.Nil), defs[sn[arr[0]]]), list(arr.slice(1))) : A(A(A(A(defs.Cfg, defs.Qa), defs.Nil), defs.Ya), defs.Nil);
          const hist = simulate(prog, text);
          M = { prog, defs, init, hist, nQ, nS, qn, sn, sizes: { delta: size(defs.Delta), step: size(defs.Step), run: size(defs.Run) } };
          M.cache = new Map();
        };
        compile();
        // ---- reading a configuration back from the evaluated term
        const readSel = (T, n) => { let r = T(); for (let i = 0; i < n; i++) { const ii = i; r = r(thunk(() => ii)); } return r; };
        const NIL = { nil: true };
        const readList = (T, nS_, limit = 80) => { const out = []; let cur = T(); for (let i = 0; i < limit; i++) { const r = cur(thunk(() => (h) => (t) => ({ h, t })))(thunk(() => NIL)); if (r === NIL) break; out.push(readSel(r.h, nS_)); cur = r.t(); } return out; };
        const observe = (t) => {
          const val = evalClosed(t);
          const probe = (qT) => (lT) => (aT) => (rT) => ({ qT, lT, aT, rT });
          const c = val(thunk(() => probe));
          return { q: readSel(c.qT, M.nQ), left: readList(c.lT, M.nS), a: readSel(c.aT, M.nS), right: readList(c.rT, M.nS) };
        };
        const lamState = (k) => {
          if (M.cache.has(k)) return M.cache.get(k);
          let t = M.init; for (let i = 0; i < k; i++) t = A(M.defs.Step, t);
          const o = observe(t);
          const tape = [...o.left.slice().reverse(), o.a, ...o.right]; const head = o.left.length;
          const r = { q: o.q, tape, head }; M.cache.set(k, r); return r;
        };
        const trim = (st) => { // canonical form: strip blanks away from the head
          let a = 0, b = st.tape.length - 1;
          while (a < st.head && st.tape[a] === 0) a++;
          while (b > st.head && st.tape[b] === 0) b--;
          return { q: st.q, tape: st.tape.slice(a, b + 1), head: st.head - a };
        };
        const sameSt = (x, y) => { const a = trim(x), b = trim(y); return a.q === b.q && a.head === b.head && a.tape.length === b.tape.length && a.tape.every((s, i) => s === b.tape[i]); };
        let lastInfo = null;
        const drawTape = (s, st, y, label, color) => {
          const syms = M.prog.syms, T = trim(st), cell = 34, nC = Math.min(T.tape.length + 2, Math.floor((s.W - 120) / cell));
          const start = T.head - Math.floor(nC / 2), x0 = (s.W - nC * cell) / 2 + 18;
          s.textPx(label, 12, y - 40, { size: 12.5, weight: 700, color, align: 'left', halo: false });
          for (let i = 0; i < nC; i++) {
            const j = start + i, sy = j >= 0 && j < T.tape.length ? T.tape[j] : 0, x = x0 + i * cell, isH = j === T.head;
            s.ctx.save(); s.ctx.fillStyle = v.color(isH ? color : 'panel', isH ? 0.18 : 1); s.ctx.strokeStyle = v.color(isH ? color : 'muted', 1); s.ctx.lineWidth = isH ? 2.6 : 1.2;
            rrect(s.ctx, x, y - 15, cell - 3, 30, 6); s.ctx.fill(); s.ctx.stroke(); s.ctx.restore();
            s.textPx(syms[sy] === '_' ? '' : syms[sy], x + (cell - 3) / 2, y, { size: 16, weight: 700, color: 'ink', align: 'center', halo: false });
            if (isH) { s.textPx('▼', x + (cell - 3) / 2, y - 25, { size: 11, color, align: 'center', halo: false }); s.textPx(M.prog.states[T.q], x + (cell - 3) / 2, y + 28, { size: 13, weight: 700, color, align: 'center', halo: false }); }
          }
        };
        v.legend([['accent', 'Turing machine (direct simulation)', { dot: true }], ['orange', 'λ-term  step^k init, evaluated', { dot: true }]]);
        v.render(() => {
          if (M.err) { sT.textPx(M.err, sT.W / 2, sT.H / 2, { size: 14, color: 'red', align: 'center' }); return; }
          const total = M.hist.length - 1, k = Math.min(kS.value, total);
          const a = M.hist[k], b = lamState(k), same = sameSt(a, b);
          drawTape(sT, a, 62, 'machine', 'accent'); drawTape(sT, b, 158, 'λ-term', 'orange');
          sT.textPx(same ? '✓ same configuration' : '✗ different', sT.W / 2, 108, { size: 13, weight: 700, color: same ? 'green' : 'red', align: 'center', halo: false });
          // table
          const st0 = M.prog.states, sy = M.prog.syms; const prev = k > 0 ? M.hist[k - 1] : null;
          let used = null; if (prev && prev.q !== st0.length - 1) { const a0 = prev.head >= 0 && prev.head < prev.tape.length ? prev.tape[prev.head] : 0; used = [prev.q, a0]; }
          const rows = []; st0.slice(0, -1).forEach((q, qi) => sy.forEach((c, ci) => { const e = M.prog.delta[q][c]; if (e) rows.push({ qi, ci, q, c, e }); }));
          const rh = Math.min(22, (sD.H - 56) / (rows.length + 1)), X = [12, 62, 118, 168, 214].map((x) => x * Math.min(1, sD.W / 250));
          ['state', 'read', 'write', 'move', 'next'].forEach((h, i) => sD.textPx(h, X[i], 22, { size: 11.5, weight: 700, color: 'muted', align: 'left', halo: false }));
          rows.forEach((r, i) => {
            const y = 44 + i * rh, on = used && used[0] === r.qi && used[1] === r.ci;
            if (on) { sD.ctx.save(); sD.ctx.fillStyle = v.color('gold', 0.28); rrect(sD.ctx, 4, y - rh / 2, sD.W - 8, rh, 5); sD.ctx.fill(); sD.ctx.restore(); }
            [r.q, r.c === '_' ? '␣' : r.c, r.e[1] === '_' ? '␣' : r.e[1], r.e[2], r.e[0]].forEach((tx, j) => sD.textPx(tx, X[j], y, { size: 13, weight: on ? 700 : 500, color: on ? 'ink' : 'muted', align: 'left', halo: false }));
          });
          sD.textPx(`δ has ${M.sizes.delta} nodes · step ${M.sizes.step} · run ${M.sizes.run}`, sD.W / 2, sD.H - 12, { size: 11.5, color: 'muted', align: 'center' });
          lastInfo = { total, k, same };
        });
        v.readout(() => {
          if (M.err) return M.err;
          const prog = M.prog, total = M.hist.length - 1;
          // run the whole term with Y
          let agreeAll = true; for (let i = 0; i <= total; i++) if (!sameSt(M.hist[i], lamState(i))) { agreeAll = false; break; }
          let runRes = null;
          try { runRes = observe(A(M.defs.Run, M.init)); } catch (e) { runRes = null; }
          const fin = trim(M.hist[total]), tapeStr = (T) => T.tape.map((s) => prog.syms[s]).join('').replace(/_/g, '␣');
          let runOk = false, runTape = '';
          if (runRes) { const T = trim({ q: runRes.q, tape: [...runRes.left.slice().reverse(), runRes.a, ...runRes.right], head: runRes.left.length }); runOk = sameSt(fin, T); runTape = tapeStr(T); }
          const halted = M.hist[total].q === prog.states.length - 1;
          return `The machine ${halted ? `halts after $${total}$ steps` : 'has not halted after 60 steps'} with tape $\\texttt{${tapeStr(fin)}}$ · the λ-term agrees at all $${total + 1}$ configurations: ${agreeAll ? '✓' : '✗'} · the single term $\\mathsf{run}\\ \\mathsf{init}$ (using $Y$) evaluates to tape $\\texttt{${runTape}}$: ${runOk ? '✓ equal' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11', kind: 'Definition', name: 'de Bruijn indices',
      statement: String.raw`A **nameless term** (de Bruijn term) is built from natural numbers $n$ (variables), abstractions $\lambda.\,t$ without a name, and applications. The index $n$ counts the binders between the occurrence and the $\lambda$ that binds it ($0$ = nearest); an index $\ge$ the number of enclosing binders refers to a free variable, numbered by a fixed context $\Gamma$. Translating a named term replaces each bound occurrence by its distance to its binder, and two named terms are $\alpha$-equivalent iff their nameless forms are identical. Substitution uses shifting: $\uparrow^{d}_{c}$ adds $d$ to every index $\ge c$, and $\beta$-reduction is $(\lambda.\,t)\,u\to\ \uparrow^{-1}_{0}\bigl([0\mapsto\uparrow^{1}_{0}u]\,t\bigr)$.`,
      idea: String.raw`Names exist only to connect an occurrence to its binder; the index is that connection in coordinates, so renaming problems (2.2, 2.3) disappear. The price is bookkeeping. When the argument $u$ is pushed under a binder its free indices must be shifted by $1$ so that they keep pointing past the new $\lambda$; when the binder of the redex is removed, every free index of the result moves down by one. The shifting is a correct, mechanical version of the renaming performed by the capture-avoiding substitution of 2.3.`,
      caption: String.raw`Top: two named terms and their nameless forms; each index has the colour of its binder, free variables are red and are numbered after the binders (here in alphabetical order). The terms are $\alpha$-equivalent exactly when the nameless rows read the same. Bottom: step through $\beta$-reduction of the first term’s outermost-leftmost redex in nameless form: shift the argument, substitute for index $0$, shift down; the result is checked against named substitution.`,
      deps: ['pl-2.3'], refs: ['Pierce §6.1', 'Pierce §6.2'], tags: ['binding', 'representation'],
      credit: 'N. G. de Bruijn, 1972',
      viz(v) {
        const sA = pxStage(v, { height: 196, full: true, title: 'Named and nameless forms' });
        const sB = pxStage(v, { height: 176, full: true, title: 'β-reduction of the first term, in nameless form' });
        const EX = { a: ['(λx. λy. x y z) (λw. w)', '(λa. λb. a b z) (λc. c)'], b: ['λx. λy. x', 'λx. λy. y'], c: ['(λx. λy. x) y', '(λx. λz. x) y'], d: ['λx. x (λy. x y)', 'λy. y (λx. y x)'] };
        const f1 = tf(v, 'term 1', EX.a[0], () => redo(), 300), f2 = tf(v, 'term 2', EX.a[1], () => redo(), 300);
        const ex = v.select('Examples', [{ value: 'a', label: 'α-equal pair' }, { value: 'b', label: 'different' }, { value: 'c', label: 'free y' }, { value: 'd', label: 'shadow' }], 'a', { onChange: () => { f1.set(EX[ex.value][0]); f2.set(EX[ex.value][1]); redo(); } });
        const analyse = (t, gamma) => {
          const vars = new Map(), binders = [];
          (function go(u, p, env) {
            if (u.t === 'v') { const i = env.findLastIndex((e) => e.name === u.x); vars.set(p, i >= 0 ? env[i].path : null); }
            else if (u.t === 'l') { binders.push(p); go(u.b, cat(p, 'b'), [...env, { name: u.x, path: p }]); }
            else { go(u.f, cat(p, 'f'), env); go(u.a, cat(p, 'a'), env); }
          })(t, '', []);
          const col = new Map(binders.map((b, i) => [b, COLS[i % COLS.length]]));
          const style = (nd, p) => (nd.t === 'v' || nd.t === 'i' ? (vars.get(p) === null ? 'red' : vars.get(p) !== undefined ? col.get(vars.get(p)) : undefined) : nd.t === 'l' ? col.get(p) : undefined);
          return { vars, col, style, db: toDB(t, gamma) };
        };
        let info = null;
        // beta steps in nameless form
        const mark = {
          shift: (d, c, t) => (t.t === 'i' ? (t.n >= c ? { ...DB.i(t.n + d), chg: true } : t) : t.t === 'l' ? DB.l(mark.shift(d, c + 1, t.b)) : DB.a(mark.shift(d, c, t.f), mark.shift(d, c, t.a))),
          subst: (j, s, t) => (t.t === 'i' ? (t.n === j ? { ...s, ins: true } : t) : t.t === 'l' ? DB.l(mark.subst(j + 1, mark.shift(1, 0, s), t.b)) : DB.a(mark.subst(j, s, t.f), mark.subst(j, s, t.a))),
        };
        const S = v.steps({ frames: [{}], note: true, still: 3, speed: 0.6, counter: 'stage', code: [
          '(λ. t) u        // a redex in nameless form', '↑¹u            // shift u up: it will sit under one more λ', '[0 ↦ ↑¹u] t     // replace index 0 by the shifted argument', '↑⁻¹ (…)         // the λ of the redex is gone: shift free indices down'] });
        let red = null;
        function redo() {
          red = null;
          if (f1.err || f2.err) return;
          const t = f1.ast; const ps = redexes(t); const q = runStrategy(t, 'normal', { max: 1 });
          if (!q.paths.length) { S.reset([{ note: 'term 1 has no β-redex: edit it to contain one' }]); return; }
          const p = q.paths[0], R = getAt(t, p), gamma = freeOrder(R), d = toDB(R, gamma);
          const b = d.f.b, a = d.a, a1 = mark.shift(1, 0, a), s2 = mark.subst(0, a1, b), s3 = mark.shift(-1, 0, s2);
          const expect = toDB(subst(R.f.b, R.f.x, R.a), gamma), ok = dbStr(s3) === dbStr(expect) && dbStr(betaDB(b, a)) === dbStr(s3);
          red = { R, gamma, d, b, a, a1, s2, s3, ok, p };
          S.reset([
            { line: 1, note: `The first redex (leftmost-outermost) in nameless form: $${dbTex(dbStr(d))}$. The body is orange-framed, the argument blue.`, k: 0 },
            { line: 2, note: 'The argument is going to be placed under the λ of the redex… so its free indices are shifted up by one first (changed indices in gold).', k: 1 },
            { line: 3, note: 'Every occurrence of index 0 in the body (those bound by the redex’s λ) is replaced by the shifted argument (inserted copies in orange); deeper binders already shifted it again.', k: 2 },
            { line: 4, note: `The redex’s λ has disappeared, so free indices of the result drop by one. Result: $${dbTex(dbStr(s3))}$ — equal to named capture-avoiding substitution: ${ok ? '✓' : '✗'}.`, k: 3 },
          ], { at: 'end' });
        }
        redo();
        const lineAt = (s, lay, y, label, color) => {
          s.textPx(label, 14, y, { size: 12, weight: 700, color: color || 'muted', align: 'left', halo: false });
          return drawLine(v, s, lay, 124, y, { size: 19, maxW: s.W - 140, weight: 600 });
        };
        v.render(() => {
          if (f1.err || f2.err) { drawParseError(v, sA, f1.err ? f1.src : f2.src, f1.err || f2.err); sB.textPx('fix the terms', sB.W / 2, sB.H / 2, { size: 14, color: 'muted', align: 'center' }); info = null; return; }
          const t1 = f1.ast, t2 = f2.ast, gamma = [...new Set([...fv(t1), ...fv(t2)])].sort();
          const a1 = analyse(t1, gamma), a2 = analyse(t2, gamma);
          const nm = (t, an) => layoutTerm(t, { merge: false, style: an.style });
          const nl = (an) => layoutDB(an.db, { style: an.style });
          lineAt(sA, nm(t1, a1), 26, 'term 1'); lineAt(sA, nl(a1), 58, 'nameless', 'accent');
          lineAt(sA, nm(t2, a2), 104, 'term 2'); lineAt(sA, nl(a2), 136, 'nameless', 'accent');
          const same = dbStr(a1.db) === dbStr(a2.db);
          sA.textPx(same ? 'identical nameless forms: α-equivalent' : 'different nameless forms: not α-equivalent', sA.W / 2, 176, { size: 13.5, weight: 700, color: same ? 'green' : 'red', align: 'center', halo: false });
          info = { same, ae: alphaEq(t1, t2), gamma };
          // beta stage
          if (!red) { sB.textPx('term 1 has no β-redex', sB.W / 2, sB.H / 2, { size: 14, color: 'muted', align: 'center' }); return; }
          const k = S.frame && S.frame.k != null ? S.frame.k : 0;
          const rowY = [26, 66, 106, 146];
          const first = layoutDB(red.d, { style: (nd, p) => (p === 'f.b' || p.startsWith('f.b.') ? 'orange' : p === 'a' || p.startsWith('a.') ? 'accent' : undefined) });
          lineAt(sB, first, rowY[0], 'redex');
          if (k >= 1) lineAt(sB, layoutDB(red.a1, { style: (nd) => (nd.chg ? 'gold' : undefined) }), rowY[1], '↑¹ argument');
          if (k >= 2) lineAt(sB, layoutDB(red.s2, { style: (nd) => (nd.ins ? 'orange' : undefined) }), rowY[2], '[0 ↦ ↑¹u] t');
          if (k >= 3) lineAt(sB, layoutDB(red.s3, { style: (nd) => (nd.chg ? 'gold' : undefined) }), rowY[3], 'shift down', 'green');
        });
        v.readout(() => {
          if (!info) return 'Fix the terms.';
          return `Context $\\Gamma$ = ${info.gamma.length ? info.gamma.map((x, i) => `$${x}\\mapsto ${i}$`).join(', ') + ' (outside all binders)' : 'empty'} · $t_1\\equiv_\\alpha t_2$ by names: ${info.ae ? 'yes' : 'no'}; nameless forms identical: ${info.same ? 'yes' : 'no'} — ${info.ae === info.same ? '✓ they agree' : '✗'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12', kind: 'Definition', name: 'η-conversion and extensionality',
      statement: String.raw`**η-reduction** is the rule $\lambda x.\,f\,x\to_\eta f$ provided $x\notin\mathrm{FV}(f)$; η-conversion is the equivalence it generates (together with $\beta$). It is the expression of **extensionality**: if $f\,a=_\beta g\,a$ for a fresh variable $a$ then $\lambda a.\,f\,a=_{\beta\eta}\lambda a.\,g\,a$ and so $f=_{\beta\eta}g$; two terms that behave the same on every argument are identified. $\eta$ is not a consequence of $\beta$: for example $\lambda x.\,y\,x$ and $y$ are distinct $\beta$-normal forms, and $\lambda x.\,\Omega\,x\ne_\beta\Omega$ although neither has a head normal form.`,
      idea: String.raw`If $x\notin\mathrm{FV}(f)$, then for every argument $a$ the term $(\lambda x.\,f\,x)\,a$ β-reduces to $f\,a$ (the substitution does not touch $f$): the two functions give the same result everywhere. The side condition matters: for $f=x$ the term $\lambda x.\,x\,x$ is not equal to $x$ (applied to $a$ it gives $a\,a$, not $x\,a$). η is not a harmless bookkeeping rule: in call-by-value or weak evaluation $\lambda x.\,f\,x$ is a value while $f$ may still loop; the fixed-point operator $Z$ of 2.9 uses exactly this η-expansion to delay its self-application.`,
      caption: String.raw`Pick a function $f$ and read the table: for every argument, $(\lambda x.\,f\,x)\,a$ and $f\,a$ are reduced to normal form (normal order, with a step budget) and compared. They agree whenever $x\notin\mathrm{FV}(f)$. Choose $f=x$ to break the side condition. The bottom lines evaluate the two terms alone by call by name: the abstraction is already a value, while $f$ may loop.`,
      deps: ['pl-2.4'], refs: ['Pierce §5.3'], tags: ['extensionality', 'equality'],
      viz(v) {
        const s = pxStage(v, { height: 362, full: true, title: 'Does  λx. f x  behave like  f ?' });
        const FS = { g: 'g', succ: 'Succ', plus: 'Plus 2', k: 'K a', om: 'Omega', x: 'x' };
        const fs = v.select('f', [{ value: 'g', label: 'g (a variable)' }, { value: 'succ', label: 'succ' }, { value: 'plus', label: 'plus 2' }, { value: 'k', label: 'K a' }, { value: 'om', label: 'Ω' }, { value: 'x', label: 'x  (x is free in f)' }], 'succ');
        const ARGS = ['b', '0', '3', 'I', 'λz. z z', 'Omega'];
        const BUDGET = 400;
        const nf = (t) => { const r = normalize(t, BUDGET, 3000); return r.ok ? { t: r.t, s: show(r.t, NUMS) } : { t: null, s: '⊥ (no normal form)' }; };
        let res = null;
        v.render(() => {
          const f = P(FS[fs.value]), lam = L('x', A(f, V('x'))), side = !fv(f).has('x');
          const rows = ARGS.map((as) => { const a = P(as), l = nf(A(lam, a)), r = nf(A(f, a)); return { as, l, r, eq: l.t === null && r.t === null ? true : l.t && r.t ? alphaEq(l.t, r.t) : false }; });
          // header
          drawLine(v, s, layoutTerm(lam, NICE), 20, 24, { size: 19, weight: 700, maxW: s.W * 0.5, color: 'accent' });
          s.textPx('→η', s.W * 0.52, 24, { size: 17, weight: 700, color: 'muted', align: 'center', halo: false });
          drawLine(v, s, layoutTerm(f, NICE), s.W * 0.56, 24, { size: 19, weight: 700, maxW: s.W * 0.42, color: 'orange' });
          s.textPx(side ? `x ∉ FV(f): the η-side condition holds` : `x ∈ FV(f): η does NOT apply`, 20, 50, { size: 13, weight: 700, color: side ? 'green' : 'red', align: 'left', halo: false });
          const X = [20, 118, 118 + (s.W - 118) * 0.36, 118 + (s.W - 118) * 0.72];
          ['argument a', '(λx. f x) a  ⇓', 'f a  ⇓', 'equal?'].forEach((h, i) => s.textPx(h, X[i], 80, { size: 12, weight: 700, color: 'muted', align: 'left', halo: false }));
          rows.forEach((r, i) => {
            const y = 108 + i * 28;
            s.textPx(show(P(r.as), NUMS), X[0], y, { size: 14, weight: 600, color: 'ink', align: 'left', halo: false });
            s.textPx(r.l.s, X[1], y, { size: 14, weight: 600, color: r.l.t ? 'accent' : 'red', align: 'left', halo: false });
            s.textPx(r.r.s, X[2], y, { size: 14, weight: 600, color: r.r.t ? 'orange' : 'red', align: 'left', halo: false });
            s.textPx(r.eq ? (r.l.t ? '✓ equal' : '✓ both diverge') : '✗ different', X[3], y, { size: 14, weight: 700, color: r.eq ? 'green' : 'red', align: 'left', halo: false });
          });
          // weak view
          const yy = 108 + ARGS.length * 28 + 6;
          s.ctx.save(); s.ctx.strokeStyle = v.color('grid', 1); s.ctx.beginPath(); s.ctx.moveTo(14, yy - 14); s.ctx.lineTo(s.W - 14, yy - 14); s.ctx.stroke(); s.ctx.restore();
          const alone = (t) => { const r = runStrategy(t, 'name', { max: 60, maxSize: 600 }); return r.status === 'done' ? `a value after ${r.paths.length} step${r.paths.length === 1 ? '' : 's'}` : 'loops (never a value)'; };
          const a1 = alone(lam), a2 = alone(f);
          s.textPx('evaluated alone, by call by name (no argument supplied):', 20, yy + 8, { size: 12.5, weight: 700, color: 'muted', align: 'left', halo: false });
          s.textPx(`λx. f x   →   ${a1}`, 40, yy + 36, { size: 14, weight: 600, color: 'accent', align: 'left', halo: false });
          s.textPx(`f   →   ${a2}`, 40, yy + 62, { size: 14, weight: 600, color: a2.startsWith('loops') ? 'red' : 'orange', align: 'left', halo: false });
          res = { side, allEq: rows.every((r) => r.eq), n: rows.length, weakDiff: a1 !== a2 && a2.startsWith('loops') };
        });
        v.readout(() => (res ? (res.side ? `For all ${res.n} test arguments the two terms reduce to α-equal normal forms: ${res.allEq ? '✓ they agree' : '✗'} (η is sound when $x\\notin\\mathrm{FV}(f)$).` : `With $x$ free in $f$ the terms $\\lambda x.\\,x\\,x$ and $x$ differ: ${res.allEq ? 'they agree on these arguments' : '**they disagree**'}.`) + (res.weakDiff ? ' · Under weak (by-name) evaluation $\\lambda x.\\,\\Omega\\,x$ is a value but $\\Omega$ is not: η-equal terms can be told apart by an evaluation strategy.' : '') : ''));
      },
    },
  ],
};
