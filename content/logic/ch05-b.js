// Logic & Foundations — Chapter 5: Model theory (items 5.8–5.14)
import {
  parseFO, holds, foField, range, preorder, freeVars, qrank, fr, frStr, enumQ,
  natStruct, fieldStruct, primesUpTo, qeNat, dnfTex, dnfEval, describeSet,
  parseFx, evalNum, evalSer, lParse, lStr, lKind, lStd, lSign, lCmp, lAdd, lLead, lMono,
  THEORIES,
} from './ch05.shared.js';

const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n) => String(n).split('').map((d) => SUBS[+d]).join('');
const texS = (n) => (n === 0 ? '0' : n === 1 ? 'S0' : `S^{${n}}0`);
const cache = new Map();

// ---------- 5.8 ----------
const SIGN = { rels: {}, funcs: { S: 1 }, consts: ['0'], name: 'the language {0, S}' };
const EX58 = ['∃y (S(S(y)) = x ∧ y ≠ 0)', '∀y (S(y) ≠ x)', '∃y ∃z (S(y) = z ∧ S(z) = x)', '∀y (x = S(y) → ∃z S(z) = y)', '∃y (y ≠ x ∧ S(y) = S(S(x)))', '∀y ∃z (y = S(z) ∨ y = 0)', '¬∃y (S(y) = x) ∨ x = S(S(0))', '∃y (S(y) = x ∧ ∃z (S(z) = y))'];

// ---------- 5.9 ----------
const isSquare = (n) => { if (n < 0) return false; const r = Math.round(Math.sqrt(n)); return r * r === n; };
/** Rational roots of a x² + b x + c (all multiples of 1/2): array of values. */
function ratRoots(a, b, c) {
  const A = Math.round(2 * a), B = Math.round(2 * b), C = Math.round(2 * c);
  if (A === 0) return B !== 0 ? [-C / B] : C === 0 ? [0] : [];
  const D = B * B - 4 * A * C;
  if (!isSquare(D)) return [];
  const r = Math.round(Math.sqrt(D));
  return [...new Set([(-B + r) / (2 * A), (-B - r) / (2 * A)])];
}
const scanRoot = (f, lo, hi, n = 3000) => { let prev = null; for (let i = 0; i <= n; i++) { const t = lo + ((hi - lo) * i) / n, y = f(t); if (prev !== null && prev * y <= 0) return true; prev = y; } return false; };
function realCount(f, lo, hi, n = 4000) { let cnt = 0, prev = null; for (let i = 0; i <= n; i++) { const t = lo + ((hi - lo) * i) / n, y = f(t); if (prev !== null && prev * y < 0) cnt++; prev = y; } return cnt; }
const Q59 = {
  root: { label: 'has a root', phi: (a) => `\\exists x\\,(${a === 1 ? '' : 'a\\cdot '}x\\cdot x + b\\cdot x + c = 0)`, psi: String.raw`(a\neq0 \land b^2\ge 4ac)\ \lor\ (a=0 \land (b\neq0 \lor c=0))`,
    qf: (a, b, c) => (a !== 0 ? b * b - 4 * a * c >= 0 : b !== 0 || c === 0),
    real: (a, b, c) => scanRoot((t) => a * t * t + b * t + c, -14, 14), rat: (a, b, c) => ratRoots(a, b, c).length > 0 },
  two: { label: 'has two roots', phi: () => String.raw`\exists x\,\exists y\,(x<y \land a x^2+bx+c=0 \land a y^2+by+c=0)`, psi: String.raw`a\neq 0 \land b^2>4ac`,
    qf: (a, b, c) => a !== 0 && b * b - 4 * a * c > 0,
    real: (a, b, c) => (a !== 0 ? realCount((t) => a * t * t + b * t + c, -14, 14) >= 2 : false), rat: (a, b, c) => ratRoots(a, b, c).length >= 2 },
  pos: { label: 'has a positive root (monic)', phi: () => String.raw`\exists x\,(0<x \land x\cdot x + b\cdot x + c = 0)`, psi: String.raw`c<0\ \lor\ (b<0 \land b^2\ge 4c)`, mon: true,
    qf: (a, b, c) => c < 0 || (b < 0 && b * b >= 4 * c),
    real: (a, b, c) => { let prev = null; for (let i = 1; i <= 4000; i++) { const t = (14 * i) / 4000, y = t * t + b * t + c; if (prev !== null && prev * y <= 0) return true; prev = y; } return false; },
    rat: (a, b, c) => ratRoots(1, b, c).some((r) => r > 0) },
};

// ---------- 5.10 ----------
const polyStr = (c) => { // [a2, a1, a0]
  let out = '';
  [[c[0], 'x²'], [c[1], 'x'], [c[2], '']].forEach(([k, m]) => {
    if (!k) return;
    const a = Math.abs(k), body = m ? (a === 1 ? m : `${a}${m}`) : String(a);
    out += out ? (k < 0 ? ' − ' : ' + ') + body : (k < 0 ? '−' : '') + body;
  });
  return out || '0';
};
const polyCmp = (p, q) => { for (let i = 0; i < 3; i++) if (p[i] !== q[i]) return Math.sign(p[i] - q[i]); return 0; };
const BLOCKSB = [[0, 1], [0, 2], [0, 3], [1, -2], [1, -1], [1, 0], [1, 1], [1, 2], [2, -1], [2, 0], [2, 1]];

// ---------- 5.11 ----------
const PR = primesUpTo(97);
const SIGR = { rels: {}, funcs: { '+': 2, '·': 2 }, consts: ['0', '1'], name: 'the language of rings' };
const SENT = [
  ['−1 is a square', '∃x (x·x + 1 = 0)'], ['2 is a square', '∃x (x·x = 1+1)'], ['−2 is a square', '∃x (x·x + 1 + 1 = 0)'], ['3 is a square', '∃x (x·x = 1+1+1)'],
  ['1 + 1 = 0', '1+1 = 0'], ['2 is a cube', '∃x (x·x·x = 1+1)'], ['x²+y² = −1 solvable', '∃x ∃y (x·x + y·y + 1 = 0)'],
];
const FIELDS = new Map();
const fieldOf = (p) => { if (!FIELDS.has(p)) FIELDS.set(p, fieldStruct(p)); return FIELDS.get(p); };
const truthRow = (src) => {
  const k = `T:${src}`;
  if (cache.has(k)) return cache.get(k);
  const r = parseFO(src, SIGR);
  const row = r.ast ? PR.map((p) => holds(r.ast, fieldOf(p))) : null;
  cache.set(k, row);
  return row;
};

// ---------- 5.13 ----------
const EX513 = ['x^3', 'sin(x)', 'exp(x)/(1+x^2)', 'abs(x)', 'x*sin(x)', 'sqrt(x)', '1/x'];

export default {
  collection: 'logic',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8',
      kind: 'Theorem',
      name: 'Quantifier elimination for the successor function',
      statement: String.raw`In the language $\{0,S\}$, every formula $\varphi(x_1,\dots,x_n)$ is equivalent in $(\mathbb{N},0,S)$ (and in every model of its theory) to a quantifier-free formula, a Boolean combination of equations $x_i=S^k x_j$ and $x_i=S^k0$. Consequently every subset of $\mathbb{N}$ defined by a formula in one variable is **finite or cofinite**, and every sentence is decided by a mechanical procedure.`,
      idea: String.raw`By the usual reduction (logic-5.7) it is enough to eliminate $\exists y$ from a conjunction of literals. If one literal says $y=S^kz$ or $y=S^k0$, substitute it everywhere; if it says $S^ky=z$, then $y$ is “$z$ minus $k$”, which exists exactly when $z\ne0,S0,\dots,S^{k-1}0$ — a quantifier-free condition, and a substitution again. If only disequations $y\ne t$ remain, a witness always exists because only finitely many values are excluded and $\mathbb{N}$ is infinite. Universal quantifiers go by $\forall=\neg\exists\neg$.`,
      caption: String.raw`Type a formula in $0$, $S$ and equality with at most the free variable $x$ (use **Next example**). The elimination is carried out by the actual algorithm; the top strip then shows where the original formula holds in $\mathbb{N}$ (the quantifiers are searched over a window large enough for the formula's size), the bottom strip where the quantifier-free result holds. They agree cell by cell, and from some point on the pattern is constant: the defined set is finite or cofinite.`,
      deps: ['logic-5.7'],
      refs: ['Enderton §3.1'],
      tags: ['quantifier elimination', 'successor'],
      viz(v) {
        let exIdx = 0;
        const fld = foField(v, 'formula φ(x)', EX58[0], { sig: SIGN, width: 380, check: (a) => (freeVars(a).some((x) => x !== 'x') ? 'only the variable x may be free' : null), onChange: () => v.invalidate() });
        v.button('Next example', () => { exIdx = (exIdx + 1) % EX58.length; fld.set(EX58[exIdx]); });
        const s = v.stage({ x: [-3.2, 24.8], y: [0, 3.1], axes: false, full: true, height: 230 });
        let info = {};
        v.render(() => {
          if (!fld.ok) { info = { err: fld.error }; return; }
          const ast = fld.ast;
          let D;
          try { D = qeNat(ast); } catch (e) { info = { err: e.message }; return; }
          const M = natStruct(2 * preorder(ast).length + 6), free = freeVars(ast).length > 0;
          const N = 25; let mismatches = 0;
          const orig = [], qf = [];
          for (let n = 0; n < N; n++) { orig.push(holds(ast, M, free ? { x: n } : {})); qf.push(dnfEval(D, { x: n })); if (orig[n] !== qf[n]) mismatches++; }
          const ds = describeSet(D);
          for (let n = 0; n < N; n++) {
            const bad = orig[n] !== qf[n];
            s.rect(n - 0.42, 2.0, n + 0.42, 2.6, { fill: orig[n] ? 'accent' : 'faint', fillAlpha: orig[n] ? 0.55 : 0.18, color: bad ? 'red' : 'faint', width: bad ? 2.5 : 1 });
            s.rect(n - 0.42, 0.95, n + 0.42, 1.55, { fill: qf[n] ? 'green' : 'faint', fillAlpha: qf[n] ? 0.55 : 0.18, color: bad ? 'red' : 'faint', width: bad ? 2.5 : 1 });
            s.text(String(n), n, 0.4, { size: 10.5, color: 'muted', align: 'center' });
          }
          s.text('φ in ℕ', -3.1, 2.3, { size: 11.5, color: 'accent', align: 'left', baseline: 'middle' });
          s.text('QF', -3.1, 1.25, { size: 11.5, color: 'green', align: 'left', baseline: 'middle' });
          if (free && ds.T < N) { s.vline(ds.T + 0.5, { color: 'orange', dash: true, alpha: 0.8 }); s.text('constant from here on', ds.T + 0.8, 2.85, { size: 11, color: 'orange', align: 'left' }); }
          if (free) s.text('…', 24.9, 1.9, { size: 16, color: 'muted', align: 'right' });
          const pts = ds.pts.map((n) => `x = ${texS(n)}`);
          const canon = ds.tail ? (ds.pts.length ? ds.pts.map((n) => `x \\ne ${texS(n)}`).join(' \\land ') : '\\top') : (ds.pts.length ? pts.join(' \\lor ') : '\\bot');
          info = { tex: dnfTex(D), canon, free, mismatches, ds, truth: free ? null : qf[0] };
        });
        v.readout(() => (info.err ? `Cannot eliminate: ${info.err}` : `Quantifier-free equivalent: $${info.tex}$${info.free ? `\nSimplified: $${info.canon}$ — the set is **${info.ds.tail ? 'cofinite' : 'finite'}** (${info.ds.pts.length} exceptional point${info.ds.pts.length === 1 ? '' : 's'}).` : `\nA sentence: it is **${info.truth ? 'true' : 'false'}** in $\\mathbb{N}$, decided by the elimination alone.`}\nCells where the two strips disagree: **${info.mismatches}**.`));
      },
    },
    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9',
      kind: 'Theorem',
      name: 'Tarski: real closed fields eliminate quantifiers',
      statement: String.raw`The theory of real closed ordered fields in the language $\{0,1,+,-,\cdot,<\}$ has quantifier elimination: every first-order formula about $(\mathbb{R},+,\cdot,<)$ is equivalent to a quantifier-free formula, a Boolean combination of polynomial equations and inequalities in its free variables. Consequences: the theory of $\mathbb{R}$ is complete and decidable, and the projection of a semialgebraic set is semialgebraic (Tarski–Seidenberg). It fails over $\mathbb{Q}$, which is not real closed.`,
      idea: String.raw`To eliminate $\exists x\,\bigwedge p_i(\bar a,x)\ \square\ 0$ one must say, in terms of the parameters alone, when a system of polynomial equations and inequalities in $x$ has a real solution. Tarski's method (and Sturm's theorem) reads this off from the signs of finitely many polynomial expressions in the coefficients: for a quadratic it is the discriminant, in general sequences of subresultants or cylindrical decomposition. The ordered-field axioms with the intermediate value property for polynomials are what make these sign conditions equivalent to the existence of a root.`,
      caption: String.raw`The plane shows the parameters $(b,c)$ of $ax^2+bx+c$; the shaded region is the quantifier-free formula. Random points are tested by actually searching for a root (over $\mathbb{R}$) and drawn green when the search agrees with the formula. Choose the field $\mathbb{Q}$ and the same formula **fails**: points at which the discriminant is not a rational square have real roots but no rational ones (red). The slider $a$ moves between the quadratic ($a\ne0$) and the linear case ($a=0$).`,
      deps: ['logic-5.7'],
      refs: ['Enderton §2.6'],
      tags: ['quantifier elimination', 'real closed fields'],
      credit: 'Tarski, 1930 (published 1948)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tarski%E2%80%93Seidenberg_theorem' },
      viz(v) {
        const fsel = v.select('formula', Object.entries(Q59).map(([value, q]) => ({ value, label: q.label })), 'root');
        const fld = v.select('field', [{ value: 'R', label: '$\\mathbb{R}$' }, { value: 'Q', label: '$\\mathbb{Q}$ (rational roots only)' }], 'R');
        const aS = v.slider('$a$', -2, 2, 1, { step: 0.5 });
        const s = v.stage({ x: [-4, 4], y: [-4, 4], axes: 'box', gutter: true, height: 400, xlabel: 'b', ylabel: 'c' });
        let info = {};
        v.render(() => {
          const q = Q59[fsel.value], a = q.mon ? 1 : aS.value;
          aS.el.hidden = !!q.mon;
          const ac = v.rgb('accent');
          s.raster((b, c) => (q.qf(a, b, c) ? [ac[0], ac[1], ac[2], 0.16] : null), { res: 3, key: `rcf-${fsel.value}-${a}` });
          const pts = [];
          if (fld.value === 'R') { const r = v.rng(11); for (let i = 0; i < 260; i++) pts.push([r.uniform(-4, 4), r.uniform(-4, 4)]); }
          else for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) pts.push([i / 2, j / 2]);
          let agree = 0; const bad = [];
          for (const [b, c] of pts) {
            const truth = fld.value === 'R' ? q.real(a, b, c) : q.rat(a, b, c), form = q.qf(a, b, c), ok = truth === form;
            if (ok) agree++; else bad.push([b, c, truth]);
            s.dot(b, c, { r: ok ? 2.6 : 4.5, color: ok ? 'green' : 'red', alpha: ok ? 0.75 : 1 });
          }
          if (a !== 0 && !q.mon) s.curve((t) => [t, (t * t) / (4 * a)], -4, 4, { color: 'orange', width: 1.5, dash: true });
          info = { q, a, n: pts.length, agree, bad };
        });
        v.legend([['accent', 'quantifier-free formula holds', { area: true }], ['green', 'search agrees with the formula'], ['red', 'search disagrees'], ['orange', 'discriminant curve $b^2=4ac$', { dash: true }]]);
        v.readout(() => `$\\varphi(a,b,c) = ${info.q.phi(info.a)}$ with $a=${v.fix(info.a, 1)}$\n$\\psi = ${info.q.psi}$\nAgreement: **${info.agree} / ${info.n}** points${info.agree === info.n ? '.' : info.bad.length ? ` — e.g. at $(b,c)=(${v.fix(info.bad[0][0], 1)},${v.fix(info.bad[0][1], 1)})$ the formula ${info.bad[0][2] ? 'misses a root that exists' : 'promises a root that does not exist in this field'}.` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10',
      kind: 'Theorem',
      name: 'Non-standard models of arithmetic',
      statement: String.raw`Let $T$ be the set of all sentences true in $(\mathbb{N},0,S,+,\cdot,<)$. Then $T$ has a model $\mathfrak{N}$ containing an element $c$ with $c>\underline{n}$ for every standard numeral $\underline n=S^n0$; so $\mathfrak{N}\not\cong\mathbb{N}$ although $\mathfrak{N}\equiv\mathbb{N}$. Every countable non-standard model of Peano arithmetic has order type $\mathbb{N}+\mathbb{Z}\cdot\mathbb{Q}$: a copy of $\mathbb{N}$ followed by densely many blocks each ordered like $\mathbb{Z}$.`,
      idea: String.raw`Add a new constant $c$ and the sentences $c>\underline n$ for all $n$. A finite part of this set mentions only $c>\underline0,\dots,c>\underline{n-1}$, which $\mathbb{N}$ satisfies with $c:=n$; so by compactness (logic-4.7) there is a model, and in it $c$ exceeds every standard number. An element and its successors and predecessors form a block like $\mathbb{Z}$ (every non-zero element has a predecessor); the element $c+c$ is infinitely far above $c$, hence in a later block. Between two blocks lies another, because $\lfloor(a+b)/2\rfloor$ exists.`,
      caption: String.raw`Pick **the block model** (language $0,S,<$: $\mathbb{N}$ followed by $\mathbb{Z}$-blocks indexed by rationals) or **polynomials** (the model $\{p\in\mathbb{Z}[x]: p\ge0\}$ ordered by growth, with $c=x$: a concrete discretely ordered semiring that is non-standard, but not a model of full arithmetic). Click any element: its successor and predecessor stay in its block, and for the polynomial model $2c$ jumps to a later block. The zoom slider shows that between two blocks there is always another.`,
      deps: ['logic-4.7', 'logic-3.13'],
      refs: ['Enderton §2.6'],
      tags: ['non-standard models', 'compactness'],
      credit: 'Skolem, 1934',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Non-standard_model_of_arithmetic' },
      viz(v) {
        const mod = v.select('model', [{ value: 'A', label: 'blocks of $\\mathbb{Z}$ over $\\mathbb{Q}$' }, { value: 'P', label: 'polynomials in $c$' }], 'A', { onChange: () => { selA = { r: fr(0), z: 0 }; selP = { b: 3, z: 0 }; } });
        const zoom = v.slider('zoom into the block order', 0, 3, 0, { int: true });
        const cmp = v.slider('compactness: $n$', 1, 12, 5, { int: true });
        const s = v.stage({ x: [0, 100], y: [0, 100], axes: false, full: true, height: 340 });
        let selA = { r: fr(0), z: 0 }, selP = { b: 3, z: 0 }, hits = [];
        s.onClick((x, y) => {
          let best = null, bd = 6;
          for (const h of hits) { const d = Math.hypot(h.x - x, (h.y - y) * 0.6); if (d < bd) { bd = d; best = h; } }
          if (best) { if (mod.value === 'A') selA = best.sel; else selP = best.sel; v.invalidate(); }
        });
        const blocksA = () => { // rationals visible at the current zoom
          const wins = [[-3, 3], [-1, 1], [-0.25, 0.75], [0.1, 0.4]], W = wins[zoom.value];
          const out = []; for (const q of enumQ(600)) { const x = q.p / q.q; if (x > W[0] && x < W[1]) out.push(q); if (out.length >= 11) break; }
          return { W, out: out.sort((a, b) => a.p / a.q - b.p / b.q) };
        };
        v.render(() => {
          hits = [];
          if (mod.value === 'A') {
            const { W, out } = blocksA();
            s.text('ℕ:', 2, 82, { size: 12, color: 'muted', align: 'left', baseline: 'middle' });
            for (let n = 0; n < 9; n++) { s.dot(9 + n * 4.2, 82, { r: 4.5, color: 'accent' }); s.text(String(n), 9 + n * 4.2, 74, { size: 10, color: 'muted', align: 'center' }); }
            s.text('… every standard number …', 49, 82, { size: 11, color: 'muted', align: 'left', baseline: 'middle' });
            s.text(`non-standard blocks, ordered like the rationals in (${v.fix(W[0], 2)}, ${v.fix(W[1], 2)}), spaced by rank:`, 3, 56, { size: 11.5, color: 'ink', align: 'left' });
            out.forEach((q, qi) => {
              const cx = 6 + (qi + 0.5) * (88 / out.length);
              for (let z = -2; z <= 2; z++) {
                const x = cx + z * 1.2, isSel = selA.r.p === q.p && selA.r.q === q.q && selA.z === z;
                s.dot(x, 36, { r: isSel ? 5.5 : 3.2, color: isSel ? 'gold' : 'teal' });
                hits.push({ x, y: 36, sel: { r: q, z } });
              }
              s.line(cx - 3.2, 30, cx + 3.2, 30, { color: 'teal', width: 1.2, alpha: 0.5 });
              s.text(frStr(q), cx, 24, { size: 10, color: 'muted', align: 'center' });
            });
            s.text('each block is a copy of ℤ: …, c−1, c, c+1, …   (labels: the block’s index in ℚ)', 3, 12, { size: 10.5, color: 'muted', align: 'left' });
          } else {
            s.text('ℕ:', 2, 82, { size: 12, color: 'muted', align: 'left', baseline: 'middle' });
            for (let n = 0; n < 9; n++) { s.dot(9 + n * 4.2, 82, { r: 4.5, color: 'accent' }); s.text(String(n), 9 + n * 4.2, 74, { size: 10, color: 'muted', align: 'center' }); }
            s.text('… then blocks p + ℤ, ordered by growth, with c = x:', 49, 82, { size: 11, color: 'muted', align: 'left', baseline: 'middle' });
            BLOCKSB.forEach((bk, i) => {
              const cx = 6 + (i + 0.5) * (88 / BLOCKSB.length);
              for (let z = -2; z <= 2; z++) {
                const x = cx + z * 1.4, isSel = selP.b === i && selP.z === z;
                s.dot(x, 50, { r: isSel ? 5 : 2.8, color: isSel ? 'gold' : 'purple' });
                hits.push({ x, y: 50, sel: { b: i, z } });
              }
              s.text(polyStr([bk[0], bk[1], 0]).replace(/\s/g, ''), cx, 38, { size: 9.5, color: 'muted', align: 'center' });
            });
          }
          // compactness strip
          const n = cmp.value;
          s.text(`finite part of T ∪ {c>n}: c>0 … c>${n - 1} holds in ℕ if we read c as ${n}`, 3, 3, { size: 10.5, color: 'green', align: 'left' });
        });
        v.readout(() => {
          if (mod.value === 'A') {
            const r = selA.r, z = selA.z;
            return `Selected element $e$ = (block ${frStr(r)}, offset ${z}). Its successor is (block ${frStr(r)}, ${z + 1}) and its predecessor (block ${frStr(r)}, ${z - 1}) — both in the **same block**; and $e>\\underline n$ for every standard $n$, since the whole block lies above $\\mathbb{N}$.\nBetween this block and any block with a larger index there are infinitely many further blocks (density): zoom in to see them.`;
          }
          const bk = BLOCKSB[selP.b], e = [bk[0], bk[1], selP.z], c = [0, 1, 0], two = [e[0] * 2, e[1] * 2, e[2] * 2];
          const gt = (p, q) => polyCmp(p, q) > 0;
          const n1 = 1e6;
          return `$e = ${polyStr(e).replace('²', '^2')}$, $c=x$.  $e>${n1.toLocaleString()}$ for every standard number: **${gt(e, [0, 0, n1]) ? 'yes' : 'no'}** (positive leading coefficient).\n$e+1$ and $e-1$ lie in the same block; $2e = ${polyStr(two).replace('²', '^2')}$ differs from $e$ by $e$ itself, which is infinite, so $2e$ is **${gt(two, [e[0], e[1], e[2] + 1e9]) ? 'in a later block' : 'in the same block'}** than $e$. $2c>c+z$ for every integer $z$: **${gt([0, 2, 0], [0, 1, 1e9]) ? 'yes' : 'no'}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11',
      kind: 'Theorem',
      name: 'Ultraproducts and Łoś’s theorem',
      statement: String.raw`Let $(\mathfrak{A}_i)_{i\in I}$ be $L$-structures and $U$ an ultrafilter on $I$. The **ultraproduct** $\prod\mathfrak{A}_i/U$ has the elements of $\prod A_i$ modulo “agree on a set in $U$”, and relations and functions defined coordinatewise. **Łoś's theorem**: for every formula $\varphi(x_1,\dots,x_n)$ and elements $[a^1],\dots,[a^n]$,
$$\prod\mathfrak{A}_i/U\models\varphi([a^1],\dots,[a^n])\iff\{i\in I:\mathfrak{A}_i\models\varphi(a^1_i,\dots,a^n_i)\}\in U.$$
In particular a sentence is true in the ultraproduct exactly when it is true in $U$-“most” of the factors.`,
      idea: String.raw`Induct on $\varphi$. For atomic formulas the statement is the definition of the quotient. Negation uses that an ultrafilter contains exactly one of a set and its complement, conjunction that it is closed under finite intersection. For $\exists y\,\psi$: if the set of $i$ with $\mathfrak{A}_i\models\exists y\,\psi$ is in $U$, choose a witness in each such factor (the axiom of choice, logic-11.1) and anything on the rest, and apply the induction hypothesis to the witness sequence; the converse is immediate. Existence of non-principal ultrafilters needs a maximality principle of Zorn type (rca-4.21).`,
      caption: String.raw`Factors: the finite fields $\mathbb{F}_p$, $p\le97$ (columns); sentences about squares, cubes and characteristic (rows); cell green if the sentence is true in $\mathbb{F}_p$. Every non-principal ultrafilter $U$ on the primes contains exactly one residue class mod $8$ (a finite partition of the odd primes into infinite sets, Dirichlet), and no finite set. **Choose the class** $U$ picks: a sentence true in all columns of that class is true in the ultraproduct, false in all of them means false; a sentence that varies inside the class is not settled by this partial information. Type your own sentence in the language $0,1,+,\cdot$ (quantifier rank at most 2).`,
      deps: ['logic-3.3', 'rca-4.21', 'logic-11.1'],
      refs: ['Enderton §2.8'],
      tags: ['ultraproducts', 'ultrafilters'],
      credit: 'Łoś, 1955',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/%C5%81o%C5%9B%27s_theorem' },
      viz(v) {
        const cls = v.select('class of $U$ (mod 8)', [1, 3, 5, 7].map((r) => ({ value: String(r), label: `$p\\equiv${r}$` })), '1');
        const my = foField(v, 'your sentence', '∃x (x·x·x + 1 = 0)', { sig: SIGR, width: 300, check: (a) => (freeVars(a).length ? 'type a sentence' : qrank(a) > 2 ? 'keep the quantifier rank at most 2' : null), onChange: () => v.invalidate() });
        const s = v.stage({ x: [0, 100], y: [0, 100], axes: false, full: true, height: 340 });
        let info = {};
        v.render(() => {
          const r = +cls.value;
          const rows = SENT.map(([name, src]) => ({ name, row: truthRow(src) }));
          if (my.ok) rows.push({ name: 'your sentence', row: truthRow(my.src), mine: true });
          const X0 = 30, DX = 2.35, y0 = 86, dy = 8.6;
          PR.forEach((p, j) => {
            const x = X0 + j * DX, inCls = p % 8 === r;
            if (inCls) s.rect(x - DX / 2 + 0.05, y0 + 5, x + DX / 2 - 0.05, y0 - dy * (rows.length - 1) - 5, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1 });
            s.text(String(p), x, 97, { size: 8.5, color: inCls ? 'orange' : 'muted', align: 'center', weight: inCls ? 700 : 400 });
          });
          s.text('p →', 28, 97, { size: 9.5, color: 'muted', align: 'right' });
          const verdicts = [];
          rows.forEach((R, i) => {
            const y = y0 - i * dy;
            s.text(R.name, 2, y, { size: 10.5, color: R.mine ? 'accent' : 'ink', align: 'left', baseline: 'middle' });
            if (!R.row) return;
            R.row.forEach((t, j) => s.rect(X0 + j * DX - DX / 2 + 0.25, y - 3, X0 + j * DX + DX / 2 - 0.25, y + 3, { fill: t ? 'green' : 'red', fillAlpha: t ? 0.55 : 0.2, stroke: false }));
            const inC = R.row.filter((_, j) => PR[j] % 8 === r);
            const all = inC.every(Boolean), none = inC.every((t) => !t);
            const vd = all ? 'true' : none ? 'false' : 'open';
            verdicts.push([R.name, vd]);
            s.text(vd === 'true' ? 'true' : vd === 'false' ? 'false' : 'open', 91, y, { size: 11, weight: 700, color: vd === 'true' ? 'green' : vd === 'false' ? 'red' : 'muted', align: 'left', baseline: 'middle' });
          });
          s.text('in ∏ 𝔽ₚ/U', 91, 97, { size: 9.5, color: 'muted', align: 'left' });
          info = { r, verdicts, classPrimes: PR.filter((p) => p % 8 === r) };
        });
        v.legend([['green', 'true in $\\mathbb{F}_p$'], ['red', 'false in $\\mathbb{F}_p$'], ['orange', 'the columns $U$ singles out']]);
        v.readout(() => `$U$ contains the primes $\\equiv ${info.r} \\pmod 8$ (here ${info.classPrimes.join(', ')}). Łoś: a sentence holds in $\\prod\\mathbb{F}_p/U$ iff its true-set is in $U$ — so those true on all of this class hold, those false on all of it fail, and the rest ("open") are decided by the finer structure of $U$, which no explicit description can give. All the sentences "$1+\\dots+1=0$" for $\\ell$ ones have true-set $\\{p\\mid\\ell\\}$, finite, so they are false: the ultraproduct has **characteristic 0**.`);
      },
    },
    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12',
      kind: 'Definition',
      name: 'Hyperreals and infinitesimals',
      statement: String.raw`A **hyperreal field** $^*\mathbb{R}$ is a proper elementary extension of $(\mathbb{R},+,\cdot,<,\dots)$, for instance the ultrapower $\mathbb{R}^{\mathbb{N}}/U$ by a non-principal ultrafilter $U$ on $\mathbb{N}$. It contains **infinitesimals** ($\varepsilon\ne0$ with $|\varepsilon|<1/n$ for all $n$) and infinite numbers ($|\omega|>n$ for all $n$). Every finite hyperreal $x$ has a unique **standard part** $\operatorname{st}(x)\in\mathbb{R}$ with $x-\operatorname{st}(x)$ infinitesimal; the numbers infinitely close to a real $a$ form its **monad**.`,
      idea: String.raw`Take sequences of reals modulo agreement on a set in $U$. The sequence $(1,\tfrac12,\tfrac13,\dots)$ is positive but below every constant sequence $1/n$ on a cofinite set (which belongs to $U$ since $U$ is non-principal), hence infinitesimal; Łoś's theorem (logic-5.11) makes the extension elementary, so it keeps every first-order property of $\mathbb{R}$. Compactness (via logic-5.2) gives the same thing by adding a constant $\varepsilon$ with $0<\varepsilon<1/n$ for all $n$. Standard parts exist because $\mathbb{R}$ is Dedekind complete.`,
      caption: String.raw`A model, not the ultrapower itself: the ordered field of Laurent series $\sum d_k\varepsilon^k$ in an infinitesimal $\varepsilon$ (the real closed field $\mathbb{R}((\varepsilon))$, which has the same first-order theory as $\mathbb{R}$ for ordered-field statements). The **zoom** chooses the unit $\varepsilon^t$ around the real number $a$; type two hyperreals such as $2+3\varepsilon-\varepsilon^2$ or $1/\varepsilon$. A number appears as a dot at its coefficient of $\varepsilon^t$, with a halo if smaller terms remain, and at the edge (an arrow) when it is too far away for this zoom.`,
      deps: ['logic-5.2', 'logic-5.11'],
      refs: ['Enderton §2.8'],
      tags: ['hyperreals', 'infinitesimals'],
      credit: 'Hewitt, 1948; Robinson, 1961',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hyperreal_number' },
      viz(v) {
        const tier = v.select('zoom (unit)', [{ value: '-1', label: '$\\varepsilon^{-1}$' }, { value: '0', label: '$1$' }, { value: '1', label: '$\\varepsilon$' }, { value: '2', label: '$\\varepsilon^2$' }, { value: '3', label: '$\\varepsilon^3$' }], '1');
        const aS = v.slider('centre $a$', -2, 2, 1, { step: 0.5 });
        const IN = [['$h_1$', '1 + 3e - e^2'], ['$h_2$', '1 + 2e'], ['$h_3$', '1/e'], ['$h_4$', '1 + e^2']];
        const COL = ['accent', 'orange', 'purple', 'teal'];
        const ins = IN.map(([lab, def], i) => v.input(lab, def, { width: 190, onChange: () => v.invalidate() }));
        const s = v.stage({ x: [-6, 6], y: [1, 5], axes: false, full: true, height: 250 });
        let info = [];
        const parseIn = (src) => { try { return lParse(src); } catch (e) { return null; } };
        v.render(() => {
          const t = +tier.value, a = aS.value;
          const unit = t === 0 ? '1' : t === 1 ? 'ε' : t === -1 ? '1/ε' : `ε${'⁰¹²³'[t]}`;
          s.line(-6, 2.2, 6, 2.2, { color: 'muted', width: 1.5 });
          for (let k = -5; k <= 5; k++) { s.line(k, 2.1, k, 2.3, { color: 'muted' }); s.text(String(k), k, 1.75, { size: 10.5, color: 'muted', align: 'center' }); }
          s.text(`position = (h − ${a}) / ${unit}`, -5.9, 4.6, { size: 12, color: 'ink', align: 'left' });
          s.text(`the real ${a} sits at 0 ${t >= 1 ? '(its halo is the monad of ' + a + ')' : ''}`, -5.9, 4.1, { size: 11, color: 'muted', align: 'left' });
          s.dot(0, 2.2, { r: 5, hollow: true, color: 'ink' });
          info = [];
          ins.forEach((inp, i) => {
            const h = parseIn(inp.value);
            if (!h) { info.push({ err: true }); return; }
            const d = lAdd(h, lMono(a, 0), -1);                   // h − a
            const ks = [...d.keys()].sort((x, y) => x - y);
            const below = ks.filter((k) => k < t);
            const fin = d.get(t) || 0, rest = ks.filter((k) => k > t).length > 0;
            const y = 3.0 + (i % 2) * 0.6 + (i >= 2 ? 0.3 : 0);
            if (below.length) {
              const sg = Math.sign(d.get(below[0]));
              s.text(`${sg > 0 ? '→' : '←'} h${sub(i + 1)}`, sg > 0 ? 5.9 : -5.9, y, { size: 12, color: COL[i], align: sg > 0 ? 'right' : 'left', weight: 700 });
            } else {
              const x = Math.max(-5.9, Math.min(5.9, fin));
              if (rest) s.circle(x, 2.2, 0.16, { fill: COL[i], fillAlpha: 0.25, stroke: false });
              s.dot(x, 2.2, { r: 5, color: COL[i] });
              s.text(`h${sub(i + 1)}`, x, y - 0.3, { size: 12, color: COL[i], align: 'center', weight: 700 });
              s.line(x, 2.3, x, y - 0.55, { color: COL[i], alpha: 0.4 });
            }
            info.push({ h, kind: lKind(h), st: lStd(h), str: lStr(h), rel: below.length ? 'beyond this zoom' : rest ? 'visible, with a halo' : 'visible, exact' });
          });
        });
        v.readout(() => {
          const lines = info.map((q, i) => (q.err ? `$h_${i + 1}$: cannot read this input` : `$h_${i + 1}$ = ${q.str}: **${q.kind}**${Number.isNaN(q.st) ? '' : `, standard part ${v.fix(q.st, 3)}`} — ${q.rel}`));
          const ok = info.length >= 2 && info[0].h && info[1].h;
          const cmpS = ok ? `$h_1 ${lCmp(info[0].h, info[1].h) > 0 ? '>' : lCmp(info[0].h, info[1].h) < 0 ? '<' : '='} h_2$ (compare coefficients from the lowest power of $\\varepsilon$ upward). ` : '';
          return `${lines.join('\n')}\n${cmpS}Always $0<\\varepsilon<1/n$ for every $n$: the leading term of $1/n-\\varepsilon$ is $1/n>0$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13',
      kind: 'Theorem',
      name: 'Transfer principle and infinitesimal calculus',
      statement: String.raw`**Transfer.** A first-order sentence about $\mathbb{R}$ (with names for its functions and relations) is true in $\mathbb{R}$ iff its natural extension is true in $^*\mathbb{R}$. **Consequence.** A function $f$ is differentiable at the real point $a$ with derivative $L$ iff for every non-zero infinitesimal $\varepsilon$ the quotient $\dfrac{{}^*f(a+\varepsilon)-f(a)}{\varepsilon}$ is finite with standard part $L$ — and then the standard part does not depend on which infinitesimal is used.`,
      idea: String.raw`The $\varepsilon$–$\delta$ definition of the limit (pma-5.1) is a first-order statement about $\mathbb{R}$; transfer carries it to $^*\mathbb{R}$ where it says exactly that all difference quotients with infinitesimal increments lie infinitely close to $L$ (take $\delta$ to be any positive infinitesimal's multiple, or conversely read $\varepsilon$–$\delta$ off from the existence of a suitable $\delta$ in $^*\mathbb{R}$). The proof of transfer is Łoś's theorem (logic-5.11) applied to the ultrapower construction of logic-5.12.`,
      caption: String.raw`Type a function (try the examples). Left: the graph with the tangent at the draggable point $a$. Right: a microscope — the difference quotient $(f(a+\varepsilon t)-f(a))/\varepsilon$ against $t$, for the numeric $\varepsilon$ you choose; it straightens into the line $f'(a)\,t$. The readout does the exact computation with a formal infinitesimal: $f(a+\varepsilon)=f(a)+F_1\varepsilon+F_2\varepsilon^2+\cdots$, so the quotient is $F_1+F_2\varepsilon+\cdots$ with standard part $F_1$, which it compares with a central $\varepsilon$–$\delta$ difference. For $|x|$ at $0$ the standard part depends on the sign of $\varepsilon$ — no derivative.`,
      deps: ['logic-5.12', 'pma-5.1'],
      refs: ['Enderton §2.8'],
      tags: ['transfer principle', 'non-standard analysis'],
      credit: 'Robinson, 1961',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Transfer_principle' },
      viz(v) {
        let exI = 0;
        const inp = v.input('f(x) =', EX513[0], { width: 240, onChange: () => { parse(); v.invalidate(); } });
        v.button('Next example', () => { exI = (exI + 1) % EX513.length; inp.set(EX513[exI]); parse(); v.invalidate(); });
        const sg = v.select('ε is', [{ value: '1', label: 'positive' }, { value: '-1', label: 'negative' }], '1');
        const sl = v.slider('numeric $\\varepsilon=10^{-s}$: $s$', 0.3, 6, 1.5, { step: 0.1 });
        let ast = null, perr = null;
        const parse = () => { try { ast = parseFx(inp.value); perr = null; } catch (e) { perr = e.message; } };
        parse();
        const f = (x) => (ast ? evalNum(ast, x) : NaN);
        const sL = v.stage({ x: [-4, 4], y: [-5, 5], axes: true, grid: true, height: 320, title: 'the graph and its tangent' });
        const sR = v.stage({ x: [-3, 3], y: [-5, 5], axes: true, grid: true, height: 320, title: 'the microscope' });
        const H = sL.handle(1, f(1), { color: 'gold', label: 'a', labelPos: 'n', constrain: (x) => { const y = f(x); return [x, Number.isFinite(y) ? Math.max(-9, Math.min(9, y)) : 0]; } });
        let info = {};
        v.render(() => {
          sg.el.hidden = !ast || !/abs/.test(inp.value);
          if (perr) { info = { err: perr }; return; }
          const a = H.x, fa = f(a);
          // graph window: fit y to a sample
          let lo = Infinity, hi = -Infinity;
          for (let i = 0; i <= 200; i++) { const y = f(-4 + (8 * i) / 200); if (Number.isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); } }
          lo = Math.max(lo, -12); hi = Math.min(hi, 12); if (!(hi > lo)) { lo = -1; hi = 1; }
          sL.setView([-4, 4], [lo - 0.1 * (hi - lo), hi + 0.1 * (hi - lo)]);
          sL.fn((x) => f(x), { color: 'accent', width: 2 });
          let F = null, serr = null;
          try { F = evalSer(ast, a, +sg.value); } catch (e) { serr = e.message; }
          const L = F ? F[1] : NaN;
          H.set(a, Number.isFinite(fa) ? Math.max(lo - 1, Math.min(hi + 1, fa)) : 0);
          if (F && Number.isFinite(L)) sL.line(a - 2, fa - 2 * L, a + 2, fa + 2 * L, { color: 'green', width: 1.5, dash: true });
          // microscope
          const eps = 10 ** -sl.value;
          const ym = Number.isFinite(L) ? Math.max(3, 3.6 * Math.abs(L)) : 5;
          sR.setView([-3, 3], [-ym, ym]);
          sR.fn((t) => (f(a + eps * t) - fa) / eps, { color: 'accent', width: 2 });
          if (F && Number.isFinite(L)) sR.line(-3, -3 * L, 3, 3 * L, { color: 'green', width: 1.5, dash: true });
          // ε–δ check: sup over 0<|h|<=eps of |quotient - L|
          let sup = 0; for (let i = 1; i <= 200; i++) for (const sgn of [-1, 1]) { const h = (sgn * eps * i) / 200, q = (f(a + h) - fa) / h; if (Number.isFinite(q) && Number.isFinite(L)) sup = Math.max(sup, Math.abs(q - L)); }
          const hh = 1e-6, left = (fa - f(a - hh)) / hh, right = (f(a + hh) - fa) / hh;
          info = { a, fa, F, L, serr, eps, sup, left, right };
        });
        v.readout(() => {
          if (info.err) return `Cannot read f: ${info.err}`;
          if (info.serr) return `At $a=${v.fix(info.a, 3)}$ the function has no power series in $\\varepsilon$ (${info.serr}), so the difference quotient has no finite standard part: **not differentiable here in the infinitesimal sense**. One-sided numeric slopes: ${v.fix(info.left, 3)} and ${v.fix(info.right, 3)}.`;
          const F = info.F;
          const coef = (c, k) => `${c < 0 ? '-' : '+'}${v.fix(Math.abs(c), 4)}${k ? '\\varepsilon' + (k > 1 ? '^' + k : '') : ''}`;
          const fexp = `${v.fix(F[0], 4)}${[1, 2, 3].map((k) => coef(F[k], k)).join('')}`;
          const qexp = `${v.fix(F[1], 4)}${[1, 2, 3].map((k) => coef(F[k + 1], k)).join('')}`;
          const same = Math.abs(info.left - info.right) < 1e-3 && Math.abs(info.left - info.L) < 1e-3;
          return `$f(a+\\varepsilon)=${fexp}+\\cdots$, so the quotient is $${qexp}+\\cdots$ and $\\operatorname{st}=\\mathbf{${v.fix(info.L, 4)}}$ at $a=${v.fix(info.a, 3)}$.\nNumeric one-sided slopes: ${v.fix(info.left, 4)} and ${v.fix(info.right, 4)} — ${same ? 'they agree with the standard part (the usual derivative)' : '**they disagree**: the derivative does not exist, and the standard part depends on the sign of $\\varepsilon$'}. For $|h|\\le ${v.sci(info.eps, 2)}$ the quotient is within ${v.sci(info.sup + 1e-16, 2)} of the standard part ($\\varepsilon$–$\\delta$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.14
    {
      num: '5.14',
      kind: 'Theorem',
      name: 'Morley’s categoricity theorem',
      statement: String.raw`Let $T$ be a complete theory in a countable language with infinite models. If $T$ is $\kappa$-categorical for **some** uncountable cardinal $\kappa$, then $T$ is $\lambda$-categorical for **every** uncountable cardinal $\lambda$. There is no such rule at $\aleph_0$: a theory can be $\aleph_0$-categorical and not uncountably categorical, or the reverse, or both, or neither.`,
      idea: String.raw`This is a deep theorem; only the shape of the argument is outlined. Categoricity in an uncountable power forces the theory to have few types, so there is a minimal formula (a “strongly minimal set”) whose dimension — as for vector spaces and algebraically closed fields — classifies the models; models of an uncountable size $\lambda$ must have dimension $\lambda$ because the other parts of the model are countable, and equal dimension means isomorphic. Morley's original proof builds this out of indiscernible sequences and Ehrenfeucht–Mostowski models; Baldwin and Lachlan later gave the strongly-minimal proof. The Łoś–Vaught test (logic-5.6) is the easy relative: it needs only one infinite size.`,
      caption: String.raw`Top: a theory $\times$ cardinal table in the style of 5.4, now with columns $\aleph_0,\aleph_1,\aleph_2,\aleph_3,\aleph_\omega$: every uncountable column of a row is identical — all green or none. **Click the bottom row** (“your theory”) to try to make a pattern, and the readout says whether Morley's theorem allows it. Below: the *dimension* picture for the selected theory and size — how many values the invariant can take when the model has size $\kappa$ (many at $\aleph_0$, exactly one above).`,
      deps: ['logic-5.6', 'logic-5.4', 'logic-5.2'],
      refs: ['Enderton §2.6'],
      tags: ['categoricity', 'classification'],
      credit: 'Morley, 1965 (conjectured by Łoś, 1954)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Morley%27s_categoricity_theorem' },
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], axes: false, full: true, height: 430 });
        const COLS = [{ l: 'ℵ₀', u: false }, { l: 'ℵ₁', u: true }, { l: 'ℵ₂', u: true }, { l: 'ℵ₃', u: true }, { l: 'ℵ_ω', u: true }];
        const X0 = 48, DX = 10.5;
        let mine = [true, true, false, false, false], sel = 3;
        const rowY = (i) => 90 - i * 6.6;
        const allowed = (m) => { const u = m.slice(1); return u.every((x) => x === u[0]); };
        const iy = 90 - THEORIES.length * 6.6 - 1;
        s.onClick((x, y) => {
          const c = Math.round((x - X0) / DX);
          if (c < 0 || c >= COLS.length) { return; }
          if (Math.abs(y - iy) < 3.3) { mine[c] = !mine[c]; v.invalidate(); return; }
          const r = Math.round((90 - y) / 6.6);
          if (r >= 0 && r < THEORIES.length) { sel = r; v.invalidate(); }
        });
        v.render(() => {
          COLS.forEach((q, c) => s.text(q.l, X0 + c * DX, 97, { size: 13, weight: 700, align: 'center', color: 'ink' }));
          s.vline(X0 + 0.5 * DX, { color: 'muted', dash: true, alpha: 0.6 });
          THEORIES.forEach((T, i) => {
            const y = rowY(i);
            s.text(T.name, 2, y, { size: 11, align: 'left', baseline: 'middle', color: sel === i ? 'ink' : 'muted', weight: sel === i ? 700 : 400 });
            COLS.forEach((q, c) => {
              const cat = q.u ? T.cu : T.c0;
              s.rect(X0 + c * DX - 4.6, y - 2.7, X0 + c * DX + 4.6, y + 2.7, { fill: cat ? 'green' : 'red', fillAlpha: sel === i ? 0.42 : 0.2, color: 'faint', radius: 3 });
              s.text(cat ? '✓' : '✗', X0 + c * DX, y, { size: 12, baseline: 'middle', color: cat ? 'green' : 'red', weight: 700, align: 'center' });
            });
          });
          const ok = allowed(mine);
          s.text('your theory (click)', 2, iy, { size: 11, align: 'left', baseline: 'middle', color: 'accent', weight: 700 });
          COLS.forEach((q, c) => {
            s.rect(X0 + c * DX - 4.6, iy - 2.7, X0 + c * DX + 4.6, iy + 2.7, { fill: mine[c] ? 'green' : 'red', fillAlpha: 0.2, color: ok ? 'accent' : 'red', width: 1.6, radius: 3 });
            s.text(mine[c] ? '✓' : '✗', X0 + c * DX, iy, { size: 12, baseline: 'middle', color: mine[c] ? 'green' : 'red', weight: 700, align: 'center' });
          });
          // dimension panel for the selected theory
          const T = THEORIES[sel], by = 17;
          s.text(`${T.name}: models of size κ`, 2, by + 7, { size: 11.5, align: 'left', color: 'ink', weight: 700 });
          if (T.dims.length === 0) s.text('no dimension-like invariant: see the witnesses in 5.4', 2, by, { size: 11, align: 'left', color: 'muted' });
          else if (T.dims.length === 1) {
            s.text('at ℵ₀:', 2, by, { size: 11, align: 'left', color: 'muted', baseline: 'middle' });
            for (let k = 0; k < 7; k++) { s.dot(14 + k * 4, by, { r: 3.5, color: T.id === 'set' ? 'faint' : 'orange' }); }
            s.dot(44, by, { r: 3.5, color: 'orange' }); s.text('…ℵ₀', 47, by, { size: 10.5, align: 'left', color: 'muted', baseline: 'middle' });
            s.text(T.id === 'set' ? 'cardinality ℵ₀ only' : `${T.dims[0]} = 0, 1, 2, …, ℵ₀ : ℵ₀ different models`, 56, by, { size: 10.5, align: 'left', color: 'muted', baseline: 'middle' });
            s.text('above ℵ₀:', 2, by - 8, { size: 11, align: 'left', color: 'muted', baseline: 'middle' });
            s.dot(22, by - 8, { r: 3.5, color: 'green' });
            s.text(`${T.dims[0]} = κ forced: exactly one model`, 56, by - 8, { size: 10.5, align: 'left', color: 'muted', baseline: 'middle' });
          } else {
            s.text('at ℵ₀:', 2, by, { size: 11, align: 'left', color: 'muted', baseline: 'middle' });
            s.dot(16, by, { r: 3.5, color: 'green' }); s.text('(c, s) = (ℵ₀, ℵ₀): one model', 24, by, { size: 10.5, align: 'left', color: 'muted', baseline: 'middle' });
            s.text('above ℵ₀:', 2, by - 8, { size: 11, align: 'left', color: 'muted', baseline: 'middle' });
            [['(κ, ℵ₀)', 20], ['(ℵ₀, κ)', 33], ['(κ, κ)', 46]].forEach(([t, x]) => { s.dot(x, by - 8, { r: 3.5, color: 'red' }); s.text(t, x + 3, by - 8, { size: 10, align: 'left', color: 'muted', baseline: 'middle' }); });
            s.text('three different pairs of invariants: not categorical', 62, by - 8, { size: 10.5, align: 'left', color: 'muted', baseline: 'middle' });
          }
        });
        v.readout(() => {
          const ok = allowed(mine), u = mine.slice(1);
          return ok ? `Your pattern (ℵ₀: ${mine[0] ? '✓' : '✗'}, uncountable: ${u[0] ? '✓ in all' : '✗ in all'}) is **consistent with Morley's theorem**${THEORIES.some((T) => T.c0 === mine[0] && T.cu === u[0]) ? ` — realized by ${THEORIES.filter((T) => T.c0 === mine[0] && T.cu === u[0]).map((T) => T.name).join('; ')}.` : ' (no example is listed in this table).'}` : `Your pattern is **impossible**: the theorem says categoricity in one uncountable size forces it in all of them, so the four uncountable columns must be all ✓ or all ✗.`;
        });
      },
    },
  ],
};
