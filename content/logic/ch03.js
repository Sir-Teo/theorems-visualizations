// Logic & Foundations — Chapter 3: First-order languages and structures (items 3.1–3.7; 3.8–3.13 in ch03-b.js)
import {
  parseFO, tokensOf, toStr, toTex, kids, preorder, isTerm, isQ, occurrences, freeVars, quantifiersOf, qrank,
  renameBound, renameFree, equivalent, holds, traceEval, explainLine, graphStruct, structures, langOf, assignments,
  compile, definedSet, orbits, layoutFO, fitFO, drawFO, relEditor, foField, range, setStr, sortVars,
} from './ch03.shared.js';

// ---------- helpers ----------
const PAL = ['accent', 'orange', 'purple', 'teal', 'pink', 'green', 'gold', 'red'];
const TF = (b) => (b ? 'T' : 'F');
const pairsStr = (adj) => { const out = []; adj.forEach((row, a) => row.forEach((x, b) => { if (x) out.push(`(${a},${b})`); })); return out.length ? `{${out.join(', ')}}` : '∅'; };
const envStr = (env) => Object.keys(env).length ? sortVars(new Set(Object.keys(env))).map((x) => `${x}=${env[x]}`).join(', ') : 'no free variables';
/** Relation of a table structure (one binary symbol) as a matrix. */
const tableAdj = (M, r) => range(M.n).map((a) => range(M.n).map((b) => (M.rel(r, [a, b]) ? 1 : 0)));
/** Fit and draw an error message with a caret under the offending character. */
function drawError(s, src, msg, pos) {
  const n = Math.max(src.length, 12);
  s.setView([-1, n + 1], [0, 10]);
  s.text('not well formed', n / 2, 7.8, { align: 'center', size: 16, weight: 700, color: 'red' });
  for (let i = 0; i < src.length; i++) s.text(src[i], i + 0.5, 5.6, { align: 'center', size: Math.min(17, 560 / n), color: i === pos ? 'red' : 'ink', weight: i === pos ? 700 : 400 });
  const p = Math.min(pos, src.length);
  s.text('▲', p + 0.5, 4.6, { align: 'center', size: 13, color: 'red' });
  s.text(msg, n / 2, 3.2, { align: 'center', size: 12.5, color: 'red' });
}

// ---------- 3.1 ----------
const LANGS = {
  graph: { name: 'the language of graphs', sig: { name: 'the language of graphs', rels: { E: 2 }, funcs: {}, consts: [] },
    ex: { sentence: '∀x∃y (E(x,y) ∧ ¬E(y,x))', formula: '∃z (E(x,z) ∧ E(z,y))', term: 'x', bad: 'E(x, E(y,z))' } },
  arith: { name: 'arithmetic', sig: { name: 'arithmetic', rels: { '<': 2 }, funcs: { S: 1, '+': 2, '·': 2 }, consts: ['0'] },
    ex: { sentence: '∀x (¬x = 0 → ∃y x = S(y))', formula: '∃y (y + y = x) ∧ x < S(S(0))', term: 'S(S(0))·(x + y)', bad: 'S(x) + (x < y) = 0' } },
  group: { name: 'group theory', sig: { name: 'group theory', rels: {}, funcs: { '·': 2, inv: 1 }, consts: ['e'] },
    ex: { sentence: '∀x∀y∀z ((x·y)·z = x·(y·z))', formula: 'x·y = y·x', term: 'inv(x·y)·x', bad: 'inv(x, y) = e' } },
};

// ---------- 3.2 ----------
/** Lay out a token list horizontally in “character units”; returns [{tk, x0, x1, xc}] and the total width. */
function stripLayout(T) {
  let x = 0; const out = [];
  T.forEach((tk, i) => {
    const bin = (tk.kind === 'conn' && tk.bin) || (tk.kind === 'op' && tk.s !== '·');
    const w = tk.kind === 'comma' ? 0.55 : tk.kind === 'paren' ? 0.55 : Math.max(0.8, tk.s.length * 0.68);
    const padL = bin ? 0.55 : tk.kind === 'q' && i > 0 && T[i - 1].kind !== 'q' && T[i - 1].kind !== 'paren' && T[i - 1].kind !== 'conn' ? 0.35 : 0;
    const padR = bin ? 0.55 : tk.kind === 'comma' ? 0.35 : tk.kind === 'bvar' && T[i + 1] && T[i + 1].kind !== 'q' ? 0.4 : 0;
    x += padL; out.push({ tk, x0: x, x1: x + w, xc: x + w / 2 }); x += w + padR;
  });
  return { items: out, width: x };
}

// ---------- 3.3 ----------
function relChecks(adj, reading) {
  const n = adj.length, R = (a, b) => !!adj[a][b], out = [];
  const refl = { name: 'reflexive', missing: [] }; for (let a = 0; a < n; a++) if (!R(a, a)) refl.missing.push([a, a]);
  refl.ok = !refl.missing.length; refl.why = refl.ok ? 'every point has a loop' : `no loop at ${refl.missing[0][0]}`;
  const sym = { name: 'symmetric', missing: [] }; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (R(a, b) && !R(b, a)) sym.missing.push([b, a]);
  sym.ok = !sym.missing.length; sym.why = sym.ok ? 'every arrow has its reverse' : `${sym.missing[0][1]}→${sym.missing[0][0]} but not back`;
  const anti = { name: 'antisymmetric', missing: [], bad: [] }; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (R(a, b) && R(b, a)) anti.bad.push([a, b]);
  anti.ok = !anti.bad.length; anti.why = anti.ok ? 'no two-way arrows between distinct points' : `${anti.bad[0][0]}⇄${anti.bad[0][1]}`;
  const trans = { name: 'transitive', missing: [] }; let tw = null;
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (R(a, b)) for (let c = 0; c < n; c++) if (R(b, c) && !R(a, c)) { if (!trans.missing.some(([p, q]) => p === a && q === c)) trans.missing.push([a, c]); if (!tw) tw = [a, b, c]; }
  trans.ok = !trans.missing.length; trans.why = trans.ok ? 'every two-step path has a shortcut' : `${tw[0]}→${tw[1]}→${tw[2]} but not ${tw[0]}→${tw[2]}`;
  const fun = { name: 'one arrow out of each point', missing: [], bad: [] };
  for (let a = 0; a < n; a++) { const outs = range(n).filter((b) => R(a, b)); if (!outs.length) fun.missing.push([a, a]); if (outs.length > 1) outs.slice(1).forEach((b) => fun.bad.push([a, b])); }
  fun.ok = !fun.missing.length && !fun.bad.length;
  fun.why = fun.ok ? 'f is a total function' : fun.bad.length ? `${fun.bad[0][0]} has ${range(n).filter((b) => R(fun.bad[0][0], b)).length} arrows out` : `${fun.missing[0][0]} has no arrow out`;
  if (reading === 'order') out.push(refl, anti, trans);
  else if (reading === 'equiv') out.push(refl, sym, trans);
  else if (reading === 'func') out.push(fun);
  return out;
}
function closeUp(adj, reading) {
  const n = adj.length, A = adj.map((r) => r.slice());
  if (reading === 'func') {
    for (let a = 0; a < n; a++) { const outs = range(n).filter((b) => A[a][b]); A[a].fill(0); A[a][outs.length ? outs[0] : a] = 1; }
    return A;
  }
  for (let a = 0; a < n; a++) A[a][a] = 1;
  if (reading === 'equiv') for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (A[a][b]) A[b][a] = 1;
  for (let k = 0; k < n; k++) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (A[a][k] && A[k][b]) A[a][b] = 1;
  return A;
}

// ---------- 3.7: Ehrenfeucht–Fraïssé games on finite linear orders ----------
/** W[r][p][q]: Duplicator survives r rounds on the orders with p and q points (computed by brute-force game search on gaps). */
function efTable(P, K) {
  const W = [range(P + 1).map(() => new Array(P + 1).fill(true))];
  for (let r = 1; r <= K; r++) {
    const w = W[r - 1], cur = range(P + 1).map(() => new Array(P + 1).fill(false));
    const answer = (pp, qq) => {
      for (let i = 0; i < pp; i++) { let ok = false; for (let j = 0; j < qq && !ok; j++) if (w[i][j] && w[pp - 1 - i][qq - 1 - j]) ok = true; if (!ok) return false; }
      return true;
    };
    for (let p = 0; p <= P; p++) for (let q = 0; q <= P; q++) cur[p][q] = answer(p, q) && answer(q, p);
    W.push(cur);
  }
  return W;
}
function efGaps(pairs, m, n) {
  const S = pairs.slice().sort((a, b) => a[0] - b[0]);
  return { As: [-1, ...S.map((p) => p[0]), m], Bs: [-1, ...S.map((p) => p[1]), n] };
}
const efConsistent = (pairs) => pairs.every(([a, b], i) => pairs.every(([c, d], j) => i === j || (Math.sign(a - c) === Math.sign(b - d))));
/** Duplicator's answer to a move `pos` on side 0 (A) or 1 (B) with r rounds left afterwards. */
function efDuplicator(W, pairs, m, n, side, pos, r) {
  const { As, Bs } = efGaps(pairs, m, n), X = side ? Bs : As, Y = side ? As : Bs;
  const eq = X.indexOf(pos); if (eq > 0 && eq < X.length - 1) return Y[eq];
  let g = 0; while (!(X[g] < pos && pos < X[g + 1])) g++;
  const lo = X[g], hi = X[g + 1], lo2 = Y[g], hi2 = Y[g + 1], p = hi - lo - 1, q = hi2 - lo2 - 1, i = pos - lo - 1;
  if (q <= 0) return lo2 >= 0 ? lo2 : hi2; // no room: any answer breaks the order
  let best = 0, bs = -1e9;
  for (let j = 0; j < q; j++) {
    const L = W[r][i][j], R = W[r][p - 1 - i][q - 1 - j];
    const sc = (L && R ? 10 : L || R ? 1 : 0) - Math.abs((j + 0.5) / q - (i + 0.5) / p);
    if (sc > bs) { bs = sc; best = j; }
  }
  return lo2 + 1 + best;
}
/** Spoiler's move with r rounds left (including this one): a winning move if one exists, else the middle of the largest gap. */
function efSpoiler(W, pairs, m, n, r) {
  const { As, Bs } = efGaps(pairs, m, n);
  for (let g = 0; g + 1 < As.length; g++) {
    const p = As[g + 1] - As[g] - 1, q = Bs[g + 1] - Bs[g] - 1;
    if (W[r][p][q]) continue;
    for (const side of [0, 1]) {
      const pp = side ? q : p, qq = side ? p : q, lo = side ? Bs[g] : As[g];
      for (let i = 0; i < pp; i++) {
        let saved = false;
        for (let j = 0; j < qq && !saved; j++) if (W[r - 1][i][j] && W[r - 1][pp - 1 - i][qq - 1 - j]) saved = true;
        if (!saved) return { side, pos: lo + 1 + i, winning: true };
      }
    }
  }
  let bg = 0, bl = -1, bside = 0;
  for (let g = 0; g + 1 < As.length; g++) for (const side of [0, 1]) { const X = side ? Bs : As, l = X[g + 1] - X[g] - 1; if (l > bl) { bl = l; bg = g; bside = side; } }
  const X = bside ? Bs : As;
  return { side: bside, pos: X[bg] + 1 + Math.floor(Math.max(0, bl - 1) / 2), winning: false };
}

export default {
  collection: 'logic',
  chapter: 3,
  title: 'First-order languages and structures',
  summary: String.raw`First-order logic adds variables that range over a domain, the quantifiers $\forall$ and $\exists$, and symbols for functions and relations. A structure interprets those symbols, and Tarski's recursive definition says when a formula is true in it. Once truth is defined we can speak of validity and logical consequence, of the sets a formula defines, of isomorphism and elementary equivalence, and of substructures that agree with the whole structure on every question asked inside them. Every picture in this chapter evaluates formulas in actual structures: graphs you draw, small groups and lattices, and the orders $\N$, $\Z$, $\Q$ and $\R$.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'First-order languages: terms and formulas',
      statement: String.raw`A **first-order language** $L$ is fixed by its **signature**: a set of constant symbols, function symbols and relation symbols, each function and relation symbol with an arity $n \ge 1$. Every language also has the logical symbols: variables $v_1, v_2, \dots$, the connectives $\neg, \land, \lor, \to, \leftrightarrow$, the quantifiers $\forall, \exists$, equality $=$ and parentheses.

**Terms** are built from variables and constant symbols by applying function symbols: if $f$ is $n$-ary and $t_1,\dots,t_n$ are terms, then $f(t_1,\dots,t_n)$ is a term.

**Atomic formulas** are $t_1 = t_2$ and $R(t_1,\dots,t_n)$ for an $n$-ary relation symbol $R$ and terms $t_i$. **Formulas** are built from atomic formulas by the connectives and by the rule: if $\varphi$ is a formula and $x$ a variable, then $\forall x\,\varphi$ and $\exists x\,\varphi$ are formulas. As in propositional logic, every term and every formula can be read in exactly one way.`,
      idea: String.raw`There are two kinds of expression. A term names an element, like $S(S(0))\cdot(x+y)$. A formula makes a claim that is true or false, like $\exists y\,(y+y=x)$. Function symbols take terms and return a term; relation symbols and $=$ take terms and return a formula; connectives and quantifiers take formulas and return a formula. Each well-formed expression therefore has a parse tree whose lower layers are terms and whose upper layers are formulas, with atomic formulas at the boundary. Unique readability is proved as in logic-2.1: here a prefix (Polish) notation or full parentheses keeps the reading unambiguous.`,
      caption: String.raw`Choose a language and type a term or formula (ASCII works too: ~ & | -> <->, forall, exists). The tree shows term nodes as boxes (teal) and formula nodes as discs: atomic formulas in orange, connectives and quantifiers in blue. The right panel is the signature with arities, and each row counts how often its symbol is used. Pick **ill-formed** to see the checker reject a type error such as a formula placed inside a term, or a wrong number of arguments. In the language of graphs the only terms are variables.`,
      deps: ['logic-2.1'],
      refs: ['Enderton §2.1'],
      tags: ['syntax', 'first-order'],
      viz(v) {
        const lang = v.select('language', [{ value: 'graph', label: 'graphs {E}' }, { value: 'arith', label: 'arithmetic {0, S, +, ·, <}' }, { value: 'group', label: 'groups {e, ·, inv}' }], 'arith', { onChange: () => load() });
        const ex = v.select('example', [{ value: 'sentence', label: 'sentence' }, { value: 'formula', label: 'formula' }, { value: 'term', label: 'term' }, { value: 'bad', label: 'ill-formed' }], 'sentence', { onChange: () => load() });
        const fld = foField(v, 'term or formula', LANGS.arith.ex.sentence, { sig: () => LANGS[lang.value].sig, term: true, width: 300 });
        const load = () => fld.set(LANGS[lang.value].ex[ex.value]);
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.45, title: 'parse tree' });
        const B = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 330, weight: 0.9, title: 'signature' });
        const TB = v.table(B, { rows: 4, cols: 3, square: false, maxCell: 30, cellAspect: 2.2, size: 13, labelSize: 13, region: [0, 2.6, 10, 10], colLabels: ['kind', 'arity', 'used'] });
        const symbolsOf = () => {
          const S = LANGS[lang.value].sig, rows = [];
          (S.consts || []).forEach((c) => rows.push([c, 'constant', '0']));
          Object.entries(S.funcs || {}).forEach(([f, a]) => rows.push([f, 'function', String(a)]));
          Object.entries(S.rels || {}).forEach(([r, a]) => rows.push([r, 'relation', String(a)]));
          rows.push(['=', 'logical', '2']);
          return rows;
        };
        const uses = (ast, sym) => (ast ? preorder(ast).filter((n) => (n.t === 'const' && n.name === sym) || (n.t === 'fn' && n.f === sym) || (n.op === 'rel' && n.r === sym)).length : 0);
        v.render(() => {
          const err = fld.error, ast = fld.ok ? fld.ast : null;
          if (ast) {
            const L = layoutFO(ast); fitFO(A, L, { minW: 5 });
            drawFO(A, L, {
              fill: (nd) => (isTerm(nd.e) ? 'teal' : nd.e.op === 'rel' ? 'orange' : 'accent'),
              ring: (nd) => (nd.id === 0 ? 'gold' : null),
            });
            A.corner(fld.kind === 'term' ? 'a term: it names an element' : 'a formula: true or false in a structure', 'bl', { size: 11.5, color: fld.kind === 'term' ? 'teal' : 'accent' });
          } else {
            const m = /character (\d+)/.exec(err || ''); drawError(A, fld.src, (err || '').replace(/ \(character \d+\)/, ''), m ? +m[1] - 1 : 0);
          }
          const rows = symbolsOf();
          TB.draw({
            rows: rows.length, rowLabels: rows.map((r) => r[0]),
            value: (i, j) => (j === 0 ? rows[i][1] : j === 1 ? rows[i][2] : String(uses(ast, rows[i][0]))),
            fill: (i) => (uses(ast, rows[i][0]) ? (rows[i][1] === 'relation' || rows[i][1] === 'logical' ? ['orange', 0.25] : ['teal', 0.25]) : null),
            size: 12.5,
          });
          const verdict = !ast ? ['NOT WELL FORMED', 'red'] : fld.kind === 'term' ? ['TERM', 'teal'] : freeVars(ast).length ? ['FORMULA', 'accent'] : ['SENTENCE', 'green'];
          B.rect(1.2, 0.35, 8.8, 1.75, { fill: verdict[1], fillAlpha: 0.14, color: verdict[1], width: 1.6, radius: 8 });
          B.text(verdict[0], 5, 1.05, { align: 'center', baseline: 'middle', size: 15, weight: 700, color: verdict[1] });
        });
        v.legend([['teal', 'term', { dot: true }], ['orange', 'atomic formula', { dot: true }], ['accent', 'connective / quantifier', { dot: true }], ['gold', 'main symbol', { dot: true }]]);
        v.readout(() => {
          if (!fld.ok) return `**Rejected:** ${fld.error}.`;
          const ast = fld.ast, nodes = preorder(ast), nt = nodes.filter(isTerm).length, na = nodes.filter((n) => n.op === 'rel').length;
          const fv = freeVars(ast);
          if (fld.kind === 'term') return `A **term** of ${LANGS[lang.value].name} with ${nt} term nodes; variables ${fv.length ? fv.map((x) => `$${x}$`).join(', ') : 'none'}. It denotes an element once its variables have values; it is neither true nor false.`;
          return `A **formula** of ${LANGS[lang.value].name}: ${nt} term nodes, ${na} atomic formula${na === 1 ? '' : 's'}, ${nodes.length - nt - na} connectives and quantifiers, quantifier rank ${qrank(ast)}. Free variables: ${fv.length ? fv.map((x) => `$${x}$`).join(', ') : 'none, so it is a **sentence**'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Free and bound variables; sentences',
      statement: String.raw`An occurrence of a variable $x$ in a formula is **bound** if it lies inside a subformula $\forall x\,\psi$ or $\exists x\,\psi$ (it is then bound by the innermost such quantifier), and **free** otherwise. Recursively, the set of free variables is
$$\mathrm{FV}(\text{atomic}) = \text{all variables in it},\quad \mathrm{FV}(\neg\varphi) = \mathrm{FV}(\varphi),\quad \mathrm{FV}(\varphi\mathbin{\square}\psi) = \mathrm{FV}(\varphi)\cup\mathrm{FV}(\psi),\quad \mathrm{FV}(\forall x\,\varphi) = \mathrm{FV}(\varphi)\setminus\{x\}.$$
A **sentence** is a formula with no free variables. The truth of a formula in a structure depends only on the values of its free variables, so a sentence is simply true or false there.`,
      idea: String.raw`A bound variable is a placeholder, like the $t$ in $\int_0^1 t^2\,dt$. Renaming it together with all the occurrences it binds gives an *alphabetic variant*, which is logically equivalent, provided the new name is not already free inside the quantifier's scope (or bound by a quantifier nested inside it). A free variable is a parameter that the formula is about, so renaming it changes the meaning. Both claims are tested in the picture by evaluating the two formulas in every structure with at most three elements under every assignment (logic-3.4).`,
      caption: String.raw`Arcs join each quantifier to the occurrences it binds, one colour per quantifier. Free occurrences sit on grey plates. Click a quantifier or a variable occurrence in the top row to select it, then choose a new name. The bottom row and the tree show the renamed formula $\varphi'$. Renaming a bound variable keeps every arc and gives an equivalent formula. Renaming to $x$ here **captures** the free $x$: an arc jumps to a new binder and the meaning changes. Renaming a free variable changes the meaning too. The verdict comes from an exhaustive comparison on small structures, and a countermodel is printed when the two formulas differ.`,
      deps: ['logic-3.1'],
      refs: ['Enderton §2.1'],
      tags: ['syntax', 'variables'],
      viz(v) {
        let sel = null;
        const fld = foField(v, 'formula', '∃y E(x,y) ∧ ∀x (E(x,y) → ∃y E(y,x))', { width: 320, onChange: () => { sel = null; } });
        const to = v.select('rename to', ['x', 'y', 'z', 'u'].map((x) => ({ value: x, label: x })), 'x');
        const S = v.stage({ x: [0, 30], y: [0, 10], axes: false, height: 250, full: true });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true, title: 'tree of the renamed formula φ′' });
        let cache = { key: null };
        const colourOf = (ast) => { const m = new Map(); quantifiersOf(ast).forEach((q, i) => m.set(q.id, PAL[i % PAL.length])); return m; };
        const analyse = () => {
          const ast = fld.ast; if (!ast) return null;
          const qs = quantifiersOf(ast);
          if (!sel) sel = qs.length ? { q: qs[0].id } : { free: freeVars(ast)[0] };
          const key = `${toStr(ast)}|${sel.q ?? ''}|${sel.free ?? ''}|${to.value}`;
          if (cache.key === key) return cache;
          let out, what;
          if (sel.q != null) {
            const q = qs.find((u) => u.id === sel.q) || qs[0];
            out = renameBound(ast, q, to.value); what = { bound: true, from: q.v, q };
          } else { out = renameFree(ast, sel.free, to.value); what = { bound: false, from: sel.free }; }
          // compare binding structure by occurrence id
          const b0 = new Map(occurrences(ast).map((o) => [o.node.id, o.binder ? o.binder.id : null]));
          const moved = occurrences(out).filter((o) => b0.get(o.node.id) !== (o.binder ? o.binder.id : null)).map((o) => o.node.id);
          const eq = equivalent(ast, out, { maxN: 3, cap: 1500 });
          cache = { key, ast, out, what, moved: new Set(moved), eq, cols: colourOf(ast) };
          return cache;
        };
        let rows = [];
        S.onClick((x, y) => {
          const r = rows[0]; if (!r || Math.abs(y - r.y) > 1.1) return;
          const it = r.L.items.find((u) => x >= u.x0 - 0.15 && x <= u.x1 + 0.15);
          if (!it) return;
          const occ = occurrences(fld.ast).find((o) => o.node.id === (it.tk.node && it.tk.node.id));
          if (it.tk.kind === 'bvar' || it.tk.kind === 'q') sel = { q: it.tk.node.id };
          else if (it.tk.kind === 'var' && occ) sel = occ.binder ? { q: occ.binder.id } : { free: occ.name };
        });
        const drawRow = (ast, y, cols, highlight, label) => {
          const L = stripLayout(tokensOf(ast)), occ = new Map(occurrences(ast).map((o) => [o.node.id, o]));
          const pos = new Map(); L.items.forEach((u) => { if (u.tk.kind === 'var') pos.set(u.tk.node.id, u); if (u.tk.kind === 'bvar') pos.set('q' + u.tk.node.id, u); });
          return { L, y, draw: (x0) => {
            S.text(label, x0 - 0.6, y, { align: 'right', baseline: 'middle', size: 15, math: true, color: 'muted' });
            // arcs
            const qs = quantifiersOf(ast);
            qs.forEach((q) => {
              const from = pos.get('q' + q.id); if (!from) return;
              const col = cols.get(q.id) || 'muted';
              const sel0 = sel && sel.q === q.id;
              for (const o of occ.values()) if (o.binder === q) {
                const to2 = pos.get(o.node.id), a = x0 + from.xc, b = x0 + to2.xc, h = Math.min(2.6, 0.7 + Math.abs(b - a) * 0.16);
                S.curve((t) => [a + (b - a) * t, y + 0.62 + h * 4 * t * (1 - t)], 0, 1, { color: col, width: sel0 ? 2.8 : 1.7, n: 40 });
                S.dot(b, y + 0.62, { r: 2.6, color: col });
              }
            });
            L.items.forEach((u) => {
              const tk = u.tk, xc = x0 + u.xc;
              let col = 'ink', weight = 500;
              if (tk.kind === 'q' || tk.kind === 'bvar') { col = cols.get(tk.node.id) || 'ink'; weight = 700; }
              if (tk.kind === 'var') {
                const o = occ.get(tk.node.id);
                if (o && o.binder) col = cols.get(o.binder.id) || 'ink';
                else { S.rect(x0 + u.x0 - 0.1, y - 0.62, x0 + u.x1 + 0.1, y + 0.55, { fill: 'muted', fillAlpha: 0.22, stroke: false, radius: 4 }); col = 'muted'; S.text('free', xc, y - 1.05, { align: 'center', size: 9.5, color: 'muted' }); }
              }
              if (highlight && tk.node && highlight.has(tk.node.id) && (tk.kind === 'var')) { S.rect(x0 + u.x0 - 0.12, y - 0.66, x0 + u.x1 + 0.12, y + 0.6, { color: 'red', width: 2, radius: 4 }); }
              S.text(tk.s, xc, y, { align: 'center', baseline: 'middle', size: 18, math: tk.kind === 'var' || tk.kind === 'bvar', color: col, weight });
            });
          } };
        };
        v.render(() => {
          const R = analyse();
          if (!R) { S.setView([0, 30], [0, 10]); S.text(fld.error || 'type a formula', 15, 5, { align: 'center', color: 'red', size: 14 }); return; }
          rows = [drawRow(R.ast, 6.9, R.cols, null, 'φ'), drawRow(R.out, 2.2, R.cols, R.moved, 'φ′')];
          const W = Math.max(rows[0].L.width, rows[1].L.width, 22);
          S.setView([-2.6, W + 0.8], [0, 10]);
          rows.forEach((r) => r.draw(0));
          S.line(-2.4, 4.55, W + 0.6, 4.55, { color: 'grid', width: 1 });
          if (R.error) S.corner(fld.error, 'br', { color: 'red', size: 11 });
          // tree of φ′ with variables coloured by binder
          const L = layoutFO(R.out), occ = new Map(occurrences(R.out).map((o) => [o.node.id, o]));
          fitFO(T, L, { minW: 6 });
          drawFO(T, L, {
            fill: (nd) => (isQ(nd.e) ? R.cols.get(nd.e.id) : nd.e.t === 'var' ? (occ.get(nd.e.id) && occ.get(nd.e.id).binder ? R.cols.get(occ.get(nd.e.id).binder.id) : null) : null),
            ring: (nd) => (R.moved.has(nd.e.id) ? 'red' : null),
          });
        });
        v.readout(() => {
          const R = analyse(); if (!R) return fld.error || '';
          const { what, eq } = R, z = to.value;
          const occN = what.bound ? occurrences(R.ast).filter((o) => o.binder === what.q).length : occurrences(R.ast).filter((o) => !o.binder && o.name === what.from).length;
          const head = what.bound ? `Renaming the bound $${what.from}$ of $${what.q.op === 'all' ? '\\forall' : '\\exists'} ${what.from}$ (${occN} occurrence${occN === 1 ? '' : 's'}) to $${z}$` : `Renaming the free $${what.from}$ (${occN} occurrence${occN === 1 ? '' : 's'}) to $${z}$`;
          if (z === what.from) return `${head} changes nothing. Free variables of $\\varphi$: ${freeVars(R.ast).map((x) => `$${x}$`).join(', ') || 'none (a sentence)'}.`;
          const cap = R.moved.size ? ` **${R.moved.size} occurrence${R.moved.size === 1 ? ' is' : 's are'} captured** (red): ${what.bound ? 'it now has a different binder' : 'it falls under a quantifier'}.` : what.bound ? ' Every arc survives: an alphabetic variant.' : '';
          const verdict = eq.ok ? `$\\varphi' \\equiv \\varphi$ ✓ on all ${eq.tested.toLocaleString('en')} structure–assignment pairs with at most ${eq.exhaustiveUpTo || 3} elements.` : `$\\varphi' \\not\\equiv \\varphi$: in the ${eq.counter.n}-element structure with $E = ${pairsStr(tableAdj(eq.counter.M, 'E')).replace(/[{}]/g, (c) => (c === '{' ? '\\{' : '\\}'))}$ and ${envStr(eq.counter.env)}, $\\varphi$ is ${TF(eq.counter.a)} but $\\varphi'$ is ${TF(eq.counter.b)}.`;
          return `${head}.${cap} ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Structures for a language',
      statement: String.raw`A **structure** $\mathfrak A$ for a language $L$ consists of a non-empty set $|\mathfrak A|$, the **universe** or domain, together with an interpretation of each symbol:
- an element $c^{\mathfrak A} \in |\mathfrak A|$ for each constant symbol $c$;
- a function $f^{\mathfrak A} : |\mathfrak A|^n \to |\mathfrak A|$ for each $n$-ary function symbol $f$;
- a relation $R^{\mathfrak A} \subseteq |\mathfrak A|^n$ for each $n$-ary relation symbol $R$.

The symbol $=$ is always interpreted as identity. For a language with one binary relation symbol, a structure is exactly a set with a binary relation on it, that is, a directed graph (loops allowed).`,
      idea: String.raw`A language fixes only the *shape* of the vocabulary. The same structure for one binary symbol can be read as a graph, an order, an equivalence relation or the graph of a function, and which of these it is depends on which sentences it satisfies: reflexivity, transitivity and the rest are first-order sentences that the structure either satisfies or not (logic-3.4). Nothing about the symbol itself forces any of them. A theory (logic-3.13) is how we restrict attention to the structures we mean.`,
      caption: String.raw`Draw the relation: click a point, then another, to toggle an arrow. Click the same point twice for a loop, click an arrow to delete it, and drag points to rearrange. Switch the reading. Each reading checks the properties it needs and draws the missing pairs as dashed red arrows or rings. Equivalence classes get colours, and the function reading writes $f(x)$ beside each point. **close it up** adds exactly the missing pairs (the reflexive–transitive or equivalence closure). Antisymmetry cannot be repaired by adding arrows.`,
      deps: ['logic-3.1'],
      refs: ['Enderton §2.2'],
      tags: ['structures', 'relations'],
      viz(v) {
        const reading = v.select('read the arrows as', [{ value: 'graph', label: 'a graph E' }, { value: 'order', label: 'a partial order ≤' }, { value: 'equiv', label: 'an equivalence ∼' }, { value: 'func', label: 'a function f' }], 'order');
        const nS = v.slider('points', 2, 6, 5, { int: true, onChange: (k) => E.setN(k) });
        const fixBtn = v.button('close it up', () => { const A = closeUp(E.adj(), reading.value); const es = []; A.forEach((r, a) => r.forEach((x, b) => { if (x) es.push([a, b]); })); E.set(es, E.n); });
        const A = v.stage({ x: [-1.5, 1.5], y: [-1.42, 1.42], equal: true, axes: false, height: 340, weight: 1.1 });
        const B = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 340, weight: 1 });
        const E = relEditor(v, A, { n: 5, radius: 1.05, edges: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 1], [1, 2], [0, 3], [3, 2], [4, 2]] });
        const TB = v.table(B, { rows: 5, cols: 5, maxCell: 30, size: 13, labelSize: 12.5, region: [0, 4.3, 10, 10] });
        const geoR = () => 17 / Math.abs(A.X(1) - A.X(0));
        const missArrow = (a, b, col) => {
          const P = E.G.node(a), Q = E.G.node(b), r = geoR();
          if (a === b) { const ang = Math.atan2(P.y, P.x); A.circle(P.x + Math.cos(ang) * r * 1.55, P.y + Math.sin(ang) * r * 1.55, r * 0.75, { color: col, dash: [4, 3], width: 2 }); return; }
          const dx = Q.x - P.x, dy = Q.y - P.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, ox = -uy * 0.07, oy = ux * 0.07;
          A.arrow(P.x + ux * r + ox, P.y + uy * r + oy, Q.x - ux * r + ox, Q.y - uy * r + oy, { color: col, dash: [5, 4], width: 2 });
        };
        v.render(() => {
          const adj = E.adj(), n = E.n, rd = reading.value, checks = relChecks(adj, rd);
          fixBtn.hidden = rd === 'graph';
          // equivalence classes of the generated equivalence (for colouring)
          const cls = range(n);
          if (rd === 'equiv') { const C = closeUp(adj, 'equiv'); for (let a = 0; a < n; a++) cls[a] = C[a].indexOf(1); }
          const covers = (a, b) => adj[a][b] && a !== b && !range(n).some((c) => c !== a && c !== b && adj[a][c] && adj[c][b]);
          E.G.draw({
            nodeRing: E.ring,
            nodeColor: rd === 'equiv' ? (id) => PAL[[...new Set(cls)].indexOf(cls[id]) % PAL.length] : null,
            nodeFill: rd === 'equiv' ? (id) => PAL[[...new Set(cls)].indexOf(cls[id]) % PAL.length] : null,
            nodeNote: rd === 'func' ? (id) => { const o = range(n).filter((b) => adj[id][b]); return o.length === 1 ? `f(${id})=${o[0]}` : o.length ? `${o.length} values` : 'undefined'; } : null,
            noteColor: rd === 'func' ? (id) => (range(n).filter((b) => adj[id][b]).length === 1 ? 'ink' : 'red') : null,
            edgeColor: (e) => (rd === 'order' ? (covers(e.from, e.to) ? 'accent' : e.from === e.to ? 'faint' : 'muted') : rd === 'func' && checks[0].bad.some(([a, b]) => a === e.from && b === e.to) ? 'red' : null),
            edgeWidth: (e) => (rd === 'order' && covers(e.from, e.to) ? 2.6 : null),
          });
          for (const c of checks) {
            for (const [a, b] of c.missing || []) missArrow(a, b, 'red');
            for (const [a, b] of c.bad || []) if (c.name === 'antisymmetric') { const P = E.G.node(a), Q = E.G.node(b); A.text('✗', (P.x + Q.x) / 2, (P.y + Q.y) / 2, { align: 'center', baseline: 'middle', size: 16, color: 'red', weight: 700 }); }
          }
          A.corner('click a point, then another: toggle an arrow', 'bl', { size: 10.5 });
          TB.draw({ rows: n, cols: n, rowLabels: range(n).map(String), colLabels: range(n).map(String), cornerLabel: rd === 'func' ? 'x \\ f(x)' : rd === 'order' ? '≤' : rd === 'equiv' ? '∼' : 'E',
            value: (i, j) => (adj[i][j] ? '1' : ''), fill: (i, j) => (adj[i][j] ? ['accent', 0.3] : null), size: 13 });
          // checklist
          if (!checks.length) {
            B.text('any set of arrows is a structure for {E}:', 5, 3.3, { align: 'center', size: 12.5, color: 'ink' });
            B.text('nothing to check', 5, 2.4, { align: 'center', size: 12.5, color: 'green', weight: 700 });
            const ne = adj.flat().filter(Boolean).length, loops = range(n).filter((a) => adj[a][a]).length;
            B.text(`${ne} arrows, ${loops} loops`, 5, 1.3, { align: 'center', size: 12, color: 'muted' });
          } else checks.forEach((c, k) => {
            const y = 3.3 - k * 1.05;
            B.text(c.ok ? '✓' : '✗', 0.6, y, { align: 'center', baseline: 'middle', size: 15, weight: 700, color: c.ok ? 'green' : 'red' });
            B.text(c.name, 1.2, y, { align: 'left', baseline: 'middle', size: 12.5, weight: 600, color: 'ink' });
            B.text(c.why, 5.0, y, { align: 'left', baseline: 'middle', size: 11.5, color: c.ok ? 'muted' : 'red' });
          });
        });
        v.readout(() => {
          const adj = E.adj(), rd = reading.value, checks = relChecks(adj, rd), bad = checks.filter((c) => !c.ok);
          const nm = { graph: 'a structure for one binary relation', order: 'a partial order', equiv: 'an equivalence relation', func: 'the graph of a function' }[rd];
          const head = `$|\\mathfrak A| = \\{${range(E.n).join(',')}\\}$, and the relation has ${adj.flat().filter(Boolean).length} pairs.`;
          if (rd === 'graph') return `${head} Every such picture is a structure for the language $\\{E\\}$.`;
          if (!bad.length) {
            if (rd === 'equiv') { const C = closeUp(adj, 'equiv'); const k = new Set(range(E.n).map((a) => C[a].indexOf(1))).size; return `${head} It is ${nm} ✓ with ${k} class${k === 1 ? '' : 'es'}.`; }
            return `${head} It is ${nm} ✓.`;
          }
          return `${head} As ${nm} it fails: ${bad.map((c) => `**${c.name}** (${c.why})`).join('; ')}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Tarski’s definition of satisfaction',
      statement: String.raw`Let $\mathfrak A$ be a structure and $s$ an assignment of elements of $|\mathfrak A|$ to the variables. Extend $s$ to terms by $\bar s(x) = s(x)$, $\bar s(c) = c^{\mathfrak A}$ and $\bar s(f(t_1,\dots,t_n)) = f^{\mathfrak A}(\bar s(t_1),\dots,\bar s(t_n))$. Then **$\mathfrak A$ satisfies $\varphi$ with $s$**, written $\mathfrak A \models \varphi[s]$, is defined by recursion on $\varphi$:
- $\mathfrak A \models (t_1 = t_2)[s]$ iff $\bar s(t_1) = \bar s(t_2)$, and $\mathfrak A \models R(t_1,\dots,t_n)[s]$ iff $(\bar s(t_1),\dots,\bar s(t_n)) \in R^{\mathfrak A}$;
- $\neg$ and the binary connectives follow their truth tables;
- $\mathfrak A \models \forall x\,\varphi[s]$ iff $\mathfrak A \models \varphi[s(x|a)]$ for **every** $a \in |\mathfrak A|$, and $\mathfrak A \models \exists x\,\varphi[s]$ iff this holds for **some** $a$.

Here $s(x|a)$ agrees with $s$ except that it sends $x$ to $a$. Whether $\mathfrak A\models\varphi[s]$ depends only on $s$ restricted to the free variables of $\varphi$; for a sentence we write $\mathfrak A \models \sigma$.`,
      idea: String.raw`Truth is defined by recursion on the formula, which is well defined by unique readability (logic-3.1). The quantifier clause cannot be phrased as “$\varphi$ is true”, because the body has a free variable; that is why satisfaction is defined for formulas *with an assignment*, and truth of sentences comes out as a special case. On a finite structure the definition is an algorithm. An $\exists$ needs one witness, and a false $\forall$ needs one counterexample. Read as a game, the Verifier picks witnesses for $\exists$ and the Falsifier picks counterexamples for $\forall$; $\mathfrak A\models\varphi$ exactly when the Verifier has a winning strategy.`,
      caption: String.raw`Draw a graph on the left (click a point and then another to toggle an arrow, click the same point twice for a loop), type a sentence and step through the evaluation. The player tries the elements one at a time for each quantifier, in order, and stops as soon as a witness (for $\exists$) or a counterexample (for $\forall$) settles it. Points hold chips for the current values of the variables, and the element being tried has an orange ring. In the tree, green means true and red means false for the current assignment. At the end the deciding element is marked, and the readout lists the witness for every $x$ or the counterexample.`,
      deps: ['logic-3.2', 'logic-3.3'],
      refs: ['Enderton §2.2'],
      tags: ['semantics', 'truth'],
      credit: 'Alfred Tarski, 1933',
      viz(v) {
        const PRE = { ae: '∀x∃y E(x,y)', ea: '∃y∀x E(x,y)', sym: '∀x∀y (E(x,y) → E(y,x))', cyc: '∃x∃y∃z (E(x,y) ∧ E(y,z) ∧ E(z,x))' };
        const pre = v.select('sentence', [{ value: 'ae', label: '∀x∃y E' }, { value: 'ea', label: '∃y∀x E' }, { value: 'sym', label: 'symmetric' }, { value: 'cyc', label: '3-cycle' }], 'ae', { onChange: (k) => fld.set(PRE[k]) });
        const fld = foField(v, 'sentence', PRE.ae, { width: 260, sig: { name: 'the language of graphs', rels: { E: 2 }, funcs: {}, consts: [] }, check: (a) => (freeVars(a).length ? `free variable ${freeVars(a)[0]}: type a sentence` : null), onChange: () => S.reset(null, { at: 'end' }) });
        const A = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 330, weight: 0.95, title: 'the structure' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, weight: 1.05, title: 'evaluation of the formula tree' });
        const E = relEditor(v, A, { n: 4, radius: 1.0, edges: [[0, 1], [1, 2], [2, 0], [3, 3], [1, 3]], onChange: () => S.reset(null, { at: 'end' }) });
        let run = null;
        const build = () => { const M = graphStruct(E.n, E.adj()); run = { M, ...traceEval(fld.ast, M, {}, { limit: 400 }) }; return run.frames; };
        const S = v.steps({ frames: build, start: 'end', still: 'end', speed: 3 });
        let Lc = null, last = null;
        v.render(() => {
          if (last !== fld.ast) { last = fld.ast; Lc = layoutFO(fld.ast); }
          const f = S.frame || {}, env = f.env || {}, vals = f.vals || new Map();
          const at = new Map(); for (const [x, d] of Object.entries(env)) at.set(d, (at.get(d) ? at.get(d) + ',' : '') + x);
          const end = S.atEnd, line = end ? explainLine(fld.ast, run.M) : [];
          const deciding = new Set(line.filter((l) => l.role !== 'all' && l.d !== undefined).map((l) => l.d));
          E.G.draw({
            nodeRing: (id) => (E.sel === id ? 'gold' : f.trying === id && !end ? 'orange' : end && deciding.has(id) ? (run.val ? 'green' : 'red') : null),
            nodeFill: (id) => (at.has(id) ? 'gold' : null),
            nodeNote: (id) => at.get(id) || null,
            noteColor: () => 'gold',
          });
          fitFO(B, Lc, { minW: 4 });
          drawFO(B, Lc, {
            fill: (nd) => (vals.has(nd.e.id) ? (vals.get(nd.e.id) ? 'green' : 'red') : null),
            ring: (nd) => (f.node && nd.e.id === f.node.id ? 'gold' : null),
            note: (nd) => (isQ(nd.e) && env[nd.e.v] !== undefined ? `${nd.e.v}=${env[nd.e.v]}` : ''),
            noteColor: () => 'gold',
          });
          if (fld.error) B.corner(fld.error, 'bl', { color: 'red', size: 11 });
          if (run.cut) B.corner('trace shortened', 'br', { size: 10.5 });
        });
        v.legend([['gold', 'current values of the variables', { dot: true }], ['orange', 'element being tried', { dot: true }], ['green', 'true', { dot: true }], ['red', 'false', { dot: true }]]);
        v.readout(() => {
          const M = run.M, phi = fld.ast, val = holds(phi, M);
          let detail = '';
          if (isQ(phi) && isQ(phi.a) && phi.op !== phi.a.op) {
            const x = phi.v, y = phi.a.v, body = phi.a.a;
            const pick = (d) => M.dom.find((e) => holds(body, M, { [x]: d, [y]: e }) === (phi.a.op === 'ex'));
            if (phi.op === 'all' && val) detail = ` For each $${x}$ a witness $${y}$: ${M.dom.map((d) => `$${x}{=}${d} \\mapsto ${y}{=}${pick(d)}$`).join(', ')}.`;
            else if (phi.op === 'all') { const d = M.dom.find((d0) => pick(d0) === undefined); detail = ` Counterexample: $${x} = ${d}$, for which no $${y}$ works.`; }
            else if (phi.op === 'ex' && !val) detail = ` Every $${x}$ fails: ${M.dom.map((d) => `$${x}{=}${d}$ (counterexample $${y}{=}${pick(d)}$)`).join(', ')}.`;
            else { const d = M.dom.find((d0) => pick(d0) === undefined); detail = ` Witness: $${x} = ${d}$ works against every $${y}$.`; }
          } else {
            const ln = explainLine(phi, M).filter((l) => l.role !== 'all');
            if (ln.length) detail = ' Deciding choices: ' + ln.map((l) => `${l.role} $${l.x} = ${l.d}$`).join(', ') + '.';
          }
          return `$\\mathfrak A \\models ${toTex(phi)}$ is **${val ? 'TRUE' : 'FALSE'}** in this ${M.n}-element structure.${detail} Step ${S.i + 1} of ${S.n}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Definition',
      name: 'Logical implication and validity',
      statement: String.raw`A set of formulas $\Gamma$ **logically implies** a formula $\varphi$, written $\Gamma \models \varphi$, if for every structure $\mathfrak A$ and every assignment $s$ such that $\mathfrak A$ satisfies every member of $\Gamma$ with $s$, $\mathfrak A$ also satisfies $\varphi$ with $s$. A formula is **valid**, $\models \varphi$, if $\varnothing \models \varphi$: it is satisfied in every structure under every assignment. A **countermodel** to $\Gamma \models \varphi$ is a structure and assignment satisfying $\Gamma$ but not $\varphi$; $\Gamma\models\varphi$ holds exactly when there is none.`,
      idea: String.raw`Logical implication quantifies over *all* structures, of every size, and so it cannot be checked by inspecting finitely many of them. A single countermodel refutes an implication. Searching small structures is therefore a complete method for refutation *on finite countermodels*, but not a proof method. Some implications fail only in infinite structures, and validity needs a proof (logic-4.1) or a semantic argument. Completeness (logic-4.6) will say that the two notions agree.`,
      caption: String.raw`Choose a preset or type premises (separated by ;) and a conclusion over $E$ and a unary $P$. Every structure with up to 3 elements is checked, and with 4 elements all $2^{16}$ of them when the language is $\{E\}$. The table counts, for each size, the structures, those satisfying $\Gamma$, and the countermodels. The smallest countermodel is drawn on the right; **next countermodel** steps through others. Try **symmetric + transitive ⇒ reflexive**, a classic false proof, and **no finite model**, whose premises force an infinite structure, so the search finds nothing even though the implication fails.`,
      deps: ['logic-3.4'],
      refs: ['Enderton §2.2'],
      tags: ['semantics', 'validity'],
      viz(v) {
        const PRE = {
          swap: ['∀x∃y E(x,y)', '∃y∀x E(x,y)'],
          st: ['∀x∀y (E(x,y) → E(y,x)); ∀x∀y∀z (E(x,y) ∧ E(y,z) → E(x,z))', '∀x E(x,x)'],
          ta: ['∀x ¬E(x,x); ∀x∀y∀z (E(x,y) ∧ E(y,z) → E(x,z))', '∀x∀y (E(x,y) → ¬E(y,x))'],
          inf: ['∀x∃y E(x,y); ∀x ¬E(x,x); ∀x∀y∀z (E(x,y) ∧ E(y,z) → E(x,z))', '⊥'],
          p: ['∀x (P(x) → ∃y E(x,y)); ∃x P(x)', '∃x∃y (P(x) ∧ E(x,y) ∧ P(y))'],
        };
        const pre = v.select('preset', [{ value: 'swap', label: '∀∃ ⇒ ∃∀?' }, { value: 'st', label: 'sym + trans ⇒ refl?' }, { value: 'ta', label: 'irrefl + trans ⇒ asym' }, { value: 'inf', label: 'no finite model' }, { value: 'p', label: 'with P' }], 'swap', { onChange: (k) => { G.set(PRE[k][0]); C.set(PRE[k][1]); pick = 0; } });
        const G = v.input('premises Γ', PRE.swap[0], { width: 330, onChange: () => { pick = 0; } });
        const C = v.input('conclusion φ', PRE.swap[1], { width: 200, onChange: () => { pick = 0; } });
        let pick = 0;
        v.button('next countermodel', () => { pick++; });
        const A = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 300, weight: 1, title: 'search over small structures' });
        const B = v.stage({ x: [-1.5, 1.5], y: [-1.45, 1.35], equal: true, axes: false, height: 300, weight: 1, title: 'countermodel' });
        const TB = v.table(A, { rows: 4, cols: 3, square: false, maxCell: 34, cellAspect: 2.7, size: 13, labelSize: 12.5, region: [0, 1.6, 10, 10], colLabels: ['structures', '⊨ Γ', 'counter-'], cornerLabel: 'size' });
        const GV = v.graph(B, { nodes: [], edges: [], directed: true, layout: 'none', draggable: false, r: 15 });
        let memo = { key: null };
        const search = () => {
          const key = `${G.value}||${C.value}`; if (memo.key === key) return memo;
          const out = { key, err: null, rows: [], counters: [], prem: [], concl: null };
          const parts = G.value.split(';').map((t) => t.trim()).filter(Boolean);
          for (const p of parts) { const r = parseFO(p); if (!r.ast) { out.err = `premise “${p}”: ${r.error}`; memo = out; return out; } out.prem.push(r.ast); }
          const rc = parseFO(C.value.trim() || '⊥'); if (!rc.ast) { out.err = `conclusion: ${rc.error}`; memo = out; return out; }
          out.concl = rc.ast;
          const lang = langOf(...out.prem, out.concl);
          for (const [r, ar] of lang.rels) if (ar > 2) { out.err = `${r} has arity ${ar}; use relations of arity 1 or 2 here`; memo = out; return out; }
          if (lang.funcs.size || lang.consts.size) { out.err = 'use only relation symbols (no functions or constants) here'; memo = out; return out; }
          const xs = sortVars(new Set([...out.prem.flatMap(freeVars), ...freeVars(out.concl)]));
          const fp = out.prem.map(compile), fc = compile(out.concl);
          for (let n = 1; n <= 4; n++) {
            const row = { n, tested: 0, sat: 0, counter: 0, exhaustive: true, total: 0 };
            for (const { M, exhaustive, total } of structures(lang, { minN: n, maxN: n, cap: 70000, seed: 11 })) {
              row.exhaustive = exhaustive; row.total = total;
              for (const env of assignments(xs, n)) {
                row.tested++;
                if (!fp.every((f) => f(M, { ...env }))) continue;
                row.sat++;
                if (!fc(M, { ...env })) { row.counter++; if (out.counters.length < 60) out.counters.push({ M, env, n }); }
              }
            }
            out.rows.push(row);
          }
          memo = out; return out;
        };
        v.render(() => {
          const R = search();
          if (R.err) { A.text(R.err, 5, 5, { align: 'center', color: 'red', size: 12.5 }); GV.set({ nodes: [], edges: [] }); return; }
          const cm = R.counters.length ? R.counters[pick % R.counters.length] : null;
          const fmt = (x) => (x >= 1e4 ? x.toLocaleString('en') : String(x));
          TB.draw({
            rows: 4, rowLabels: R.rows.map((r) => `n = ${r.n}`),
            value: (i, j) => { const r = R.rows[i]; return j === 0 ? `${fmt(r.tested)}${r.exhaustive ? '' : '*'}` : j === 1 ? fmt(r.sat) : fmt(r.counter); },
            fill: (i, j) => (j === 2 && R.rows[i].counter ? ['red', 0.28] : j === 1 && R.rows[i].sat ? ['accent', 0.18] : null),
            highlight: cm ? [[cm.n - 1, 2, 'red']] : [],
          });
          A.text('counter- = countermodels;  * = random sample', 5, 0.9, { align: 'center', size: 10.5, color: 'muted' });
          if (!cm) {
            GV.set({ nodes: [], edges: [] });
            B.text('no countermodel', 0, 0.25, { align: 'center', size: 16, weight: 700, color: 'green' });
            B.text('among the structures searched', 0, -0.2, { align: 'center', size: 12, color: 'muted' });
            return;
          }
          const M = cm.M, n = M.n, unary = [...langOf(...R.prem, R.concl).rels].filter(([, ar]) => ar === 1).map(([r]) => r);
          const nodes = range(n).map((i) => { const a = (90 - (360 * i) / n) * Math.PI / 180; return { id: i, x: (n === 1 ? 0 : 0.95 * Math.cos(a)), y: (n === 1 ? 0 : 0.95 * Math.sin(a)) - 0.05 }; });
          const es = []; for (const [r, ar] of langOf(...R.prem, R.concl).rels) if (ar === 2) for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (M.rel(r, [a, b])) es.push({ from: a, to: b });
          GV.set({ nodes, edges: es });
          const inv = new Map(); for (const [x, d] of Object.entries(cm.env)) inv.set(d, (inv.get(d) ? inv.get(d) + ',' : '') + x);
          GV.draw({ nodeFill: unary.length ? (id) => (M.rel(unary[0], [id]) ? 'gold' : null) : null, nodeNote: (id) => inv.get(id) || null });
          B.corner(`countermodel ${(pick % R.counters.length) + 1} of ${R.counters.length}${R.counters.length >= 60 ? '+' : ''}`, 'tl', { size: 11 });
          B.corner(`Γ: ${R.prem.map(() => '✓').join(' ')}   φ: ✗`, 'bl', { size: 12, color: 'red', weight: 700 });
          if (unary.length) B.corner(`gold = ${unary[0]}`, 'br', { size: 11, color: 'gold' });
        });
        v.readout(() => {
          const R = search(); if (R.err) return `**Error:** ${R.err}.`;
          const satAll = R.rows.reduce((s, r) => s + r.sat, 0), tested = R.rows.reduce((s, r) => s + r.tested, 0);
          const prem = R.prem.map((p) => `$${toTex(p)}$`).join(', '), concl = `$${toTex(R.concl)}$`;
          if (R.counters.length) {
            const c = R.counters[0];
            return `**Γ ⊭ φ.** The smallest countermodel has ${c.n} element${c.n === 1 ? '' : 's'}: it satisfies ${prem} but not ${concl}. One countermodel is enough to refute an implication.`;
          }
          if (!satAll) return `No structure with at most 4 elements satisfies Γ at all (${tested.toLocaleString('en')} checked), so there is no finite countermodel. But Γ is satisfiable: $(\\N, <)$ is a model and makes ${concl} false. So **Γ ⊭ φ**, and no finite search can show it.`;
          return `No countermodel among ${tested.toLocaleString('en')} structure–assignment pairs with at most 4 elements (${satAll.toLocaleString('en')} satisfy Γ). This is evidence that Γ ⊨ φ, not a proof: a countermodel could be larger or infinite. Here an argument settles it.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Definable sets and relations',
      statement: String.raw`Let $\mathfrak A$ be a structure. A formula $\varphi(x_1,\dots,x_k)$ whose free variables are among $x_1,\dots,x_k$ **defines** the relation
$$\varphi^{\mathfrak A} = \{(a_1,\dots,a_k) \in |\mathfrak A|^k : \mathfrak A \models \varphi[a_1,\dots,a_k]\}.$$
A $k$-ary relation on $|\mathfrak A|$ is **definable** (without parameters) if some formula defines it. With parameters $b_1, \dots, b_m$ from $|\mathfrak A|$ we allow formulas $\varphi(\bar x, \bar y)$ and take $\{\bar a : \mathfrak A \models \varphi[\bar a, \bar b]\}$. For example, in $(\R, <, +, \cdot, 0, 1)$ the formula $\exists y\,(y\cdot y = x)$ defines $[0,\infty)$, and in $(\N, +)$ the formula $\exists y\,(y+y=x)$ defines the even numbers.`,
      idea: String.raw`Definable sets are closed under the Boolean operations and under projection, which correspond to the connectives and to $\exists$. In a finite structure we can say exactly which sets are definable. Every definable set is a union of orbits of the automorphism group (logic-3.9). Conversely, every orbit is definable: list the universe as $a_1,\dots,a_n$ and let $\Delta(y_1,\dots,y_n)$ be the conjunction of all atomic facts and negated atomic facts about the $a_i$. Then $\exists \bar y\,(\bigwedge_{i<j} y_i \neq y_j \land \Delta(\bar y) \land x = y_i)$ defines the orbit of $a_i$. So the definable subsets are exactly the $2^k$ unions of the $k$ orbits.`,
      caption: String.raw`Choose a structure, type a formula $\varphi(x)$ (one free variable $x$), or press **next example**. The set it defines is filled in blue. The coloured rings are the orbits of the automorphism group, computed by search (one-element orbits are left uncoloured). The readout confirms that the defined set is a union of orbits and counts how many subsets are definable at all. In $\Z/n$, halving is possible exactly when $n$ is odd. In the divisibility order on $\{1,\dots,N\}$ the primes are definable, but $11$ and $13$ lie in one orbit, so no formula can tell them apart. Edit the graph to change its symmetries.`,
      deps: ['logic-3.4'],
      refs: ['Enderton §2.2'],
      tags: ['definability', 'automorphisms'],
      viz(v) {
        const SIG = { graph: { name: 'the language of graphs', rels: { E: 2 }, funcs: {}, consts: [] }, zn: { name: '(ℤ/n, +)', rels: {}, funcs: { '+': 2 }, consts: [] }, div: { name: 'divisibility', rels: { '|': 2 }, funcs: {}, consts: [] } };
        const EX = {
          graph: ['∃y (E(x,y) ∧ E(y,x))', '∃y∃z (E(x,y) ∧ E(y,z) ∧ ¬E(x,z) ∧ ¬x = z)', '∃y E(y,x) ∧ ∃y E(x,y)', 'E(x,x)'],
          zn: ['∃y (y + y = x)', 'x + x = x', '∃y (y + y + y = x)', '∃y (y + y = x ∧ ¬y = x)'],
          div: ['¬∀z (x | z) ∧ ∀y (y | x → y = x ∨ ∀z (y | z))', '∀z (x | z)', '∀y∀z (y | x ∧ z | x → y | z ∨ z | y)', '∃y∃z (¬y = z ∧ y | x ∧ z | x ∧ ¬y | z ∧ ¬z | y)'],
        };
        let exI = 0;
        const kind = v.select('structure', [{ value: 'graph', label: 'a graph' }, { value: 'zn', label: '(ℤ/n, +)' }, { value: 'div', label: '({1..N}, |)' }], 'graph', { onChange: (k) => { exI = 0; fld.set(EX[k][0]); } });
        const size = v.slider('n or N', 2, 30, 12, { int: true });
        const fld = foField(v, 'φ(x)', EX.graph[0], { width: 300, sig: () => SIG[kind.value], check: (a) => (freeVars(a).some((x) => x !== 'x') ? `use x as the only free variable (found ${freeVars(a).filter((x) => x !== 'x')[0]})` : null) });
        v.button('next example', () => { exI = (exI + 1) % EX[kind.value].length; fld.set(EX[kind.value][exI]); });
        const A = v.stage({ x: [-1.45, 1.45], y: [-1.3, 1.3], equal: true, axes: false, height: 350, weight: 1.25 });
        const B = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 350, weight: 0.75, title: 'orbits = atoms of definability' });
        const E = relEditor(v, A, { n: 6, radius: 1.0, edges: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 4], [0, 4]] });
        let memo = { key: null };
        const model = () => {
          const k = kind.value, N = k === 'zn' ? Math.min(size.value, 24) : Math.max(4, size.value);
          const key = k === 'graph' ? `g${JSON.stringify(E.edgeList())}${E.n}` : `${k}${N}`;
          if (memo.key === key) return memo;
          let M, FR, label = (a) => String(a), pos;
          if (k === 'graph') { const adj = E.adj(); M = graphStruct(E.n, adj); FR = { n: E.n, bin: [adj] }; }
          else if (k === 'zn') {
            const tab = range(N).map((a) => range(N).map((b) => (a + b) % N));
            M = { n: N, dom: range(N), rel: () => false, fn: (f, a) => tab[a[0]][a[1]], konst: () => 0 }; FR = { n: N, bin: [], fn2: [tab] };
            pos = range(N).map((i) => { const t = Math.PI / 2 - (2 * Math.PI * i) / N; return [1.02 * Math.cos(t), 1.02 * Math.sin(t)]; });
          } else {
            const div = range(N).map((a) => range(N).map((b) => ((b + 1) % (a + 1) === 0 ? 1 : 0)));
            M = { n: N, dom: range(N), rel: (r, a) => div[a[0]][a[1]] === 1, fn: () => 0, konst: () => 0 }; FR = { n: N, bin: [div] }; label = (a) => String(a + 1);
            const omega = (m) => { let c = 0; for (let p = 2; m > 1; p++) while (m % p === 0) { m /= p; c++; } return c; };
            const layers = new Map(); for (let i = 0; i < N; i++) { const l = omega(i + 1); if (!layers.has(l)) layers.set(l, []); layers.get(l).push(i); }
            const L = Math.max(...layers.keys()); pos = new Array(N);
            for (const [l, ids] of layers) ids.forEach((i, j) => { pos[i] = [ids.length === 1 ? 0 : -1.38 + (2.76 * j) / (ids.length - 1), -1.08 + (2.16 * l) / Math.max(1, L)]; });
          }
          memo = { key, M, FR, label, pos, orb: orbits(FR), N: M.n, k };
          return memo;
        };
        v.render(() => {
          size.el.hidden = kind.value === 'graph';
          const R = model(), set = new Set(fld.ast ? definedSet(fld.ast, R.M) : []);
          const nontriv = R.orb.list.filter((o) => o.length > 1), ocol = new Map(); nontriv.forEach((o, i) => o.forEach((x) => ocol.set(x, PAL[(i + 1) % PAL.length])));
          E.G.nodes.forEach((n) => { n.hidden = R.k !== 'graph'; });
          if (R.k === 'graph') {
            E.G.draw({ nodeRing: (id) => (E.sel === id ? 'gold' : ocol.get(id) || null), nodeFill: (id) => (set.has(id) ? 'accent' : null) });
            A.corner('click a point, then another: toggle an arrow', 'bl', { size: 10.5 });
          } else {
            const P = R.pos, rr = R.N > 18 ? 11 : 13;
            if (R.k === 'div') for (let a = 0; a < R.N; a++) for (let b = 0; b < R.N; b++) { const q = (b + 1) / (a + 1); if (b !== a && Number.isInteger(q) && [2, 3, 5, 7, 11, 13, 17, 19, 23, 29].includes(q)) A.line(P[a][0], P[a][1], P[b][0], P[b][1], { color: 'grid', width: 1.2 }); }
            if (R.k === 'zn') A.circle(0, 0, 1.02, { color: 'grid', width: 1.2 });
            for (let a = 0; a < R.N; a++) {
              const [x, y] = P[a], oc = ocol.get(a);
              if (oc) A.dot(x, y, { r: rr + 4, color: oc, alpha: 0.9 });
              A.dot(x, y, { r: rr, color: 'panel' });
              A.dot(x, y, { r: rr, color: set.has(a) ? 'accent' : 'muted', hollow: !set.has(a), width: 1.5 });
              A.text(R.label(a), x, y, { align: 'center', baseline: 'middle', size: R.N > 18 ? 10 : 11.5, weight: 600, color: set.has(a) ? 'panel' : 'ink' });
            }
          }
          if (fld.error) A.corner(fld.error, 'tl', { color: 'red', size: 11 });
          // orbit list
          const list = R.orb.list, rowsMax = 9, shown = list.slice(0, rowsMax);
          shown.forEach((o, i) => {
            const y = 9.1 - i * 0.92, col = o.length > 1 ? ocol.get(o[0]) : 'muted', inS = o.every((x) => set.has(x));
            B.rect(0.3, y - 0.36, 9.7, y + 0.36, { fill: inS ? 'accent' : col, fillAlpha: inS ? 0.22 : 0.08, color: col, width: 1.2, radius: 5 });
            const txt = setStr(o.map(R.label));
            B.text(txt.length > 28 ? txt.slice(0, 26) + '…}' : txt, 0.6, y, { align: 'left', baseline: 'middle', size: 11.5, color: 'ink' });
            B.text(inS ? '⊆ φ' : '', 9.4, y, { align: 'right', baseline: 'middle', size: 11, color: 'accent', weight: 700 });
          });
          if (list.length > rowsMax) B.text(`+ ${list.length - rowsMax} more orbits`, 5, 9.1 - rowsMax * 0.92, { align: 'center', size: 11, color: 'muted' });
          B.text(`${list.length} orbits → 2^${list.length} definable subsets`, 5, 0.45, { align: 'center', size: 11.5, weight: 600, color: 'ink' });
        });
        v.readout(() => {
          const R = model(); if (!fld.ast) return fld.error || '';
          const S = definedSet(fld.ast, R.M), Sset = new Set(S), unionOK = R.orb.list.every((o) => o.every((x) => Sset.has(x)) || o.every((x) => !Sset.has(x)));
          const used = R.orb.list.filter((o) => Sset.has(o[0])).length, k = R.orb.list.length;
          const big = (e) => (e > 40 ? `$2^{${e}}$` : (2 ** e).toLocaleString('en'));
          return `$\\varphi(x)$ defines ${setStr(S.map(R.label))} (${S.length} of ${R.N} elements). ${unionOK ? `It is a union of ${used} orbit${used === 1 ? '' : 's'} ✓.` : '**Not a union of orbits — impossible!**'} The automorphism group has ${k} orbits, so exactly ${big(k)} of the ${big(R.N)} subsets are definable without parameters.${error(fld)}`;
          function error(f) { return f.error ? ` (Current input: ${f.error}.)` : ''; }
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Definition',
      name: 'Isomorphism and elementary equivalence',
      statement: String.raw`Let $\mathfrak A$ and $\mathfrak B$ be structures for the same language. An **isomorphism** $h : \mathfrak A \cong \mathfrak B$ is a bijection $h : |\mathfrak A| \to |\mathfrak B|$ that preserves every symbol: $h(c^{\mathfrak A}) = c^{\mathfrak B}$, $h(f^{\mathfrak A}(\bar a)) = f^{\mathfrak B}(h\bar a)$, and $\bar a \in R^{\mathfrak A} \iff h\bar a \in R^{\mathfrak B}$.

$\mathfrak A$ and $\mathfrak B$ are **elementarily equivalent**, $\mathfrak A \equiv \mathfrak B$, if they satisfy exactly the same sentences. They are **$k$-equivalent**, $\mathfrak A \equiv_k \mathfrak B$, if they satisfy the same sentences of quantifier rank at most $k$ (nesting depth of quantifiers).`,
      idea: String.raw`Isomorphic structures are elementarily equivalent (logic-3.8). For finite structures the converse also holds, but in general it fails: $(\Q,<) \equiv (\R,<)$, though one is countable and the other is not. Ehrenfeucht–Fraïssé games measure $\equiv_k$. In $k$ rounds, Spoiler picks an element of either structure and Duplicator answers in the other; Duplicator wins if the chosen pairs always form a partial isomorphism. The theorem (Fraïssé 1954, Ehrenfeucht 1961) says that $\mathfrak A \equiv_k \mathfrak B$ iff Duplicator has a winning strategy in the $k$-round game. For finite linear orders the game splits into independent games on the gaps between chosen points, so its value can be computed exactly. The computed table shows that $L_m \equiv_k L_n$ iff $m = n$ or $m, n \ge 2^k - 1$.`,
      caption: String.raw`Two finite linear orders $L_m$ (top) and $L_n$ (bottom), and $k$ rounds. You are **Spoiler**: click any point of either order, and Duplicator answers with the strategy computed from the table. Or be **Duplicator**: the computer, playing Spoiler, moves first each round, and you click your answer in the other order. Pairs are joined by lines, one colour per round; a red line breaks the order and Spoiler wins. The game opens with optimal play by both sides, so press **new game** to play. The table on the right is the exact game value for all sizes up to 12 at this $k$ (green = Duplicator wins), and the dashed box marks where the threshold $2^k - 1$ falls.`,
      deps: ['logic-3.4'],
      refs: ['Enderton §2.2'],
      tags: ['isomorphism', 'EF games'],
      credit: 'Roland Fraïssé, 1954; Andrzej Ehrenfeucht, 1961',
      viz(v) {
        const W = efTable(16, 4);
        const mS = v.slider('m', 1, 16, 6, { int: true, onChange: () => reset(true) });
        const nS = v.slider('n', 1, 16, 7, { int: true, onChange: () => reset(true) });
        const kS = v.slider('rounds k', 1, 4, 3, { int: true, onChange: () => reset(true) });
        const mode = v.select('you play', [{ value: 'spoiler', label: 'Spoiler' }, { value: 'dup', label: 'Duplicator' }], 'spoiler', { onChange: () => reset(false) });
        v.button('new game', () => reset(false));
        v.button('undo', () => { pending = null; pairs.pop(); if (mode.value === 'dup') spoilerTurn(); });
        let pairs = [], pending = null, auto = false;
        const m = () => mS.value, n = nS.value, k = () => kS.value;
        const over = () => pairs.length >= k() || !efConsistent(pairs);
        const spoilerTurn = () => { if (!over() && mode.value === 'dup') { const mv = efSpoiler(W, pairs, m(), n(), k() - pairs.length); pending = mv; } };
        const reset = (demo) => {
          pairs = []; pending = null; auto = demo;
          if (demo) { // optimal play by both sides
            while (!over()) { const r = k() - pairs.length, mv = efSpoiler(W, pairs, m(), n(), r), ans = efDuplicator(W, pairs, m(), n(), mv.side, mv.pos, r - 1); pairs.push(mv.side ? [ans, mv.pos] : [mv.pos, ans]); }
          } else spoilerTurn();
        };
        const G = v.stage({ x: [-1, 16], y: [-0.4, 3.6], axes: false, height: 290, weight: 1.55 });
        const T = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 290, weight: 1 });
        const TB = v.table(T, { rows: 12, cols: 12, maxCell: 19, size: 9.5, labelSize: 10, cornerLabel: 'm\\n' });
        const yA = 2.45, yB = 0.75;
        const X = (i, len) => { const span = Math.max(len - 1, 1), W0 = Math.min(15, 1.0 * Math.max(m(), n()) - 1); return len === 1 ? 7.5 : 7.5 - W0 / 2 + (W0 * i) / span; };
        G.onClick((x, y) => {
          if (over()) return;
          const side = Math.abs(y - yA) < 0.5 ? 0 : Math.abs(y - yB) < 0.5 ? 1 : -1; if (side < 0) return;
          const len = side ? n() : m(); let best = -1, bd = 0.5;
          for (let i = 0; i < len; i++) { const d = Math.abs(X(i, len) - x); if (d < bd) { bd = d; best = i; } }
          if (best < 0) return;
          auto = false;
          if (mode.value === 'spoiler') {
            const r = k() - pairs.length, ans = efDuplicator(W, pairs, m(), n(), side, best, r - 1);
            pairs.push(side ? [ans, best] : [best, ans]);
          } else if (pending && side !== pending.side) {
            pairs.push(pending.side ? [best, pending.pos] : [pending.pos, best]); pending = null; spoilerTurn();
          }
        });
        reset(true);
        v.render(() => {
          const mm = m(), nn = n(), kk = k(), ok = efConsistent(pairs);
          const W0 = Math.min(15, Math.max(mm, nn) - 1);
          G.setView([7.5 - W0 / 2 - 1.6, 7.5 + W0 / 2 + 0.9], [-0.35, 3.7]);
          G.text(`L${'₀₁₂₃₄₅₆₇₈₉'[0]}`.slice(0, 0) + `L_${mm}`, 7.5 - W0 / 2 - 0.85, yA, { align: 'center', baseline: 'middle', size: 15, math: true, color: 'muted' });
          G.text(`L_${nn}`, 7.5 - W0 / 2 - 0.85, yB, { align: 'center', baseline: 'middle', size: 15, math: true, color: 'muted' });
          G.line(X(0, mm) - 0.3, yA, X(mm - 1, mm) + 0.3, yA, { color: 'grid', width: 2 });
          G.line(X(0, nn) - 0.3, yB, X(nn - 1, nn) + 0.3, yB, { color: 'grid', width: 2 });
          if (mm === nn) for (let i = 0; i < mm; i++) G.line(X(i, mm), yA - 0.25, X(i, nn), yB + 0.25, { color: 'faint', width: 1, dash: [3, 4] });
          // pair lines
          pairs.forEach(([a, b], i) => {
            const bad = !efConsistent(pairs.slice(0, i + 1)) && efConsistent(pairs.slice(0, i));
            G.line(X(a, mm), yA - 0.2, X(b, nn), yB + 0.2, { color: bad ? 'red' : PAL[i % PAL.length], width: bad ? 3.2 : 2.4 });
          });
          for (let i = 0; i < mm; i++) G.dot(X(i, mm), yA, { r: 7, color: 'muted', hollow: true, width: 1.6 });
          for (let i = 0; i < nn; i++) G.dot(X(i, nn), yB, { r: 7, color: 'muted', hollow: true, width: 1.6 });
          pairs.forEach(([a, b], i) => {
            const c = PAL[i % PAL.length];
            G.dot(X(a, mm), yA, { r: 7, color: c }); G.dot(X(b, nn), yB, { r: 7, color: c });
            G.text(String(i + 1), X(a, mm), yA + 0.42, { align: 'center', size: 11, weight: 700, color: c });
            G.text(String(i + 1), X(b, nn), yB - 0.42, { align: 'center', size: 11, weight: 700, color: c });
          });
          if (pending) { const y = pending.side ? yB : yA, len = pending.side ? nn : mm; G.dot(X(pending.pos, len), y, { r: 11, color: 'gold', hollow: true, width: 3 }); G.text('Spoiler', X(pending.pos, len), y + (pending.side ? -0.48 : 0.48), { align: 'center', size: 11, weight: 700, color: 'gold' }); }
          const status = !ok ? 'Spoiler wins: the order is broken' : pairs.length >= kk ? 'Duplicator survives all rounds' : pending ? 'your move: answer in the other order' : mode.value === 'spoiler' ? `round ${pairs.length + 1} of ${kk}: click a point` : '';
          G.corner(status, 'tl', { size: 12, weight: 700, color: !ok ? 'red' : pairs.length >= kk ? 'green' : 'ink' });
          G.corner(`Duplicator ${W[kk][mm][nn] ? 'has' : 'does not have'} a winning strategy`, 'bl', { size: 11, color: W[kk][mm][nn] ? 'green' : 'red' });
          // table
          const th = 2 ** kk - 1;
          TB.draw({
            rowLabels: range(12).map((i) => String(i + 1)), colLabels: range(12).map((j) => String(j + 1)),
            value: (i, j) => (W[kk][i + 1][j + 1] ? '≡' : ''),
            fill: (i, j) => (W[kk][i + 1][j + 1] ? ['green', i === j ? 0.2 : 0.42] : ['red', 0.07]),
            highlight: mm <= 12 && nn <= 12 ? [[mm - 1, nn - 1, 'gold']] : [],
          });
          if (th <= 12) TB.box(th - 1, th - 1, 11, 11, { color: 'accent', dash: true, width: 1.6 });
          T.setTitle(`$L_m \\equiv_${kk} L_n$ (computed); threshold $2^${kk} - 1 = ${th}$`);
        });
        v.readout(() => {
          const mm = m(), nn = n(), kk = k(), w = W[kk][mm][nn], ok = efConsistent(pairs);
          const log = pairs.map(([a, b], i) => `${i + 1}: (${a + 1}, ${b + 1})`).join(' · ');
          const iso = mm === nn ? `$L_{${mm}} \\cong L_{${nn}}$, so the isomorphism (dotted) is a winning strategy for any $k$.` : `$L_{${mm}} \\not\\cong L_{${nn}}$${w ? `, yet $L_{${mm}} \\equiv_{${kk}} L_{${nn}}$: no sentence of quantifier rank $\\le ${kk}$ tells them apart` : `, and some sentence of quantifier rank ${kk} tells them apart`}.`;
          const game = pairs.length ? ` ${auto ? 'Optimal play' : 'Moves'} (position in top, bottom): ${log}. ${!ok ? '**Spoiler wins.**' : pairs.length >= kk ? '**Duplicator wins.**' : ''}` : '';
          return `${iso}${game}`;
        });
      },
    },
  ],
};
