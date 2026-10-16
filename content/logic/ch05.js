// Logic & Foundations — Chapter 5: Model theory (items 5.1–5.7)
import {
  parseFO, holds, foField, range, rng, fr, frVal, frStr, frKey, frCmp, backForth, orderStruct, finiteOrder, infiniteSet, intStruct,
  THEORIES,
} from './ch05.shared.js';

// ---------- 5.1: closing a set of reals under witnesses ----------
const K8 = (x) => Math.round(x * 1e8);
const depressedRoot = (a) => { let y = Math.cbrt(a); for (let i = 0; i < 60; i++) y -= (y * y * y + y - a) / (3 * y * y + 1); return y; };
const HULLS = new Map();
/** M_0 = {0, 1} ∪ seeds; M_{k+1} adds, for elements of M_k, the witnesses of: y + x = 0, x·y = 1, y² = x, y³ + y = x, y = x + z, y = x·z, x < y < z. */
function hullStages(seeds) {
  const key = seeds.join(',');
  if (HULLS.has(key)) return HULLS.get(key);
  const mk = (m) => { const arr = [...m.values()].sort((a, b) => a - b); return { arr, keys: new Set(arr.map(K8)) }; };
  const m0 = new Map(); [0, 1, ...seeds].forEach((x) => m0.set(K8(x), x));
  const stages = [mk(m0)];
  for (let k = 0; k < 2; k++) {
    const S = stages[k].arr, m = new Map();
    const add = (x) => { if (Number.isFinite(x) && Math.abs(x) < 1e7) m.set(K8(x), x); };
    S.forEach((a) => { add(a); add(-a); if (a !== 0) add(1 / a); if (a > 0) { add(Math.sqrt(a)); add(-Math.sqrt(a)); } add(depressedRoot(a)); });
    for (let i = 0; i < S.length; i++) {
      for (let j = i; j < S.length; j++) { add(S[i] + S[j]); add(S[i] * S[j]); add((S[i] + S[j]) / 2); }
      for (let j = 0; j < S.length; j++) add(S[i] - S[j]);
    }
    stages.push(mk(m));
  }
  HULLS.set(key, stages);
  return stages;
}
const lowerBound = (arr, x) => { let lo = 0, hi = arr.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid] <= x) lo = mid + 1; else hi = mid; } return lo; }; // first index with arr[i] > x

// ---------- 5.3: computable bit-sequences ----------
const FAMS = {
  rat: { label: 'binary digits of $1/(n+3)$', row: (n) => (k) => Math.floor((2 ** (k + 1)) / (n + 3)) % 2 },
  par: { label: 'parity of $(n+1)\\ \\&\\ (k+1)$', row: (n) => (k) => { let a = (n + 1) & (k + 1), c = 0; while (a) { c ^= a & 1; a >>= 1; } return c; } },
  div: { label: '$k+1$ divisible by $n+2$', row: (n) => (k) => ((k + 1) % (n + 2) === 0 ? 1 : 0) },
};

// ---------- 5.7: the examples ----------
const SIGO = { rels: { '<': 2 }, funcs: { S: 1 }, consts: [], name: 'orders' };
const EXQ = parseFO('∃z (x < z ∧ z < y)', SIGO).ast;
const QE7 = [
  { id: 'q', label: '$(\\mathbb{Q},<)$', sig: String.raw`(\mathbb{Q},<)`, phi: String.raw`\exists z\,(x<z \land z<y)`, psi: String.raw`x<y`, kind: 'lat', step: 0.5, span: 3, a: 'x', b: 'y', quant: (p, q) => holds(EXQ, orderStruct(), { x: p, y: q }), qf: (p, q) => p < q, note: 'in a dense order there is room between any two points exactly when they are ordered' },
  { id: 'z', label: '$(\\mathbb{Z},<)$', sig: String.raw`(\mathbb{Z},<)`, phi: String.raw`\exists z\,(x<z \land z<y)`, psi: String.raw`x<y`, kind: 'lat', step: 1, span: 5, a: 'x', b: 'y', quant: (p, q) => holds(EXQ, intStruct(2), { x: p, y: q }), qf: (p, q) => p < q, note: 'in the integers neighbours x, x+1 have nothing between them, so the guess x<y is wrong on a whole diagonal: the language {<} is too poor for elimination' },
  { id: 'zs', label: '$(\\mathbb{Z},<,S)$', sig: String.raw`(\mathbb{Z},<,S)`, phi: String.raw`\exists z\,(x<z \land z<y)`, psi: String.raw`S(x)<y`, kind: 'lat', step: 1, span: 5, a: 'x', b: 'y', quant: (p, q) => holds(EXQ, intStruct(2), { x: p, y: q }), qf: (p, q) => p + 1 < q, note: 'with the successor symbol added, the same quantifier has a quantifier-free equivalent' },
  { id: 'quad', label: '$(\\mathbb{R},+,\\cdot,<)$ quadratic', sig: String.raw`(\mathbb{R},0,1,+,\cdot,<)`, phi: String.raw`\exists t\,(t\cdot t + a\cdot t + b = 0)`, psi: String.raw`a\cdot a \ge 4\cdot b`, kind: 'real', span: 4, a: 'a', b: 'b', quant: (a, b) => { let prev = null; for (let i = 0; i <= 4000; i++) { const t = -12 + (24 * i) / 4000, f = t * t + a * t + b; if (prev !== null && prev * f <= 0) return true; prev = f; } return false; }, qf: (a, b) => a * a >= 4 * b, note: 'the quantifier is searched by scanning t over [−12, 12]; the elimination is the discriminant test' },
  { id: 'cubic', label: '$(\\mathbb{R},+,\\cdot,<)$ cubic', sig: String.raw`(\mathbb{R},0,1,+,\cdot,<)`, phi: String.raw`\exists t\,(t\cdot t\cdot t + a\cdot t + b = 0)`, psi: String.raw`\top`, kind: 'real', span: 4, a: 'a', b: 'b', quant: (a, b) => { let prev = null; for (let i = 0; i <= 4000; i++) { const t = -12 + (24 * i) / 4000, f = t * t * t + a * t + b; if (prev !== null && prev * f <= 0) return true; prev = f; } return false; }, qf: () => true, note: 'every odd-degree real polynomial has a root, so the equivalent quantifier-free condition is simply “true”' },
];

export default {
  collection: 'logic',
  chapter: 5,
  title: 'Model theory',
  summary: String.raw`Compactness and completeness give first-order theories a startling flexibility: any theory with an infinite model has models of every infinite size, including countable models of set theory and non-standard models of arithmetic. Some theories are nevertheless pinned down in one size, and back-and-forth arguments and quantifier elimination tell us exactly what such theories say. Ultraproducts make the infinitesimals of Leibniz rigorous.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1',
      kind: 'Theorem',
      name: 'Downward Löwenheim–Skolem theorem',
      statement: String.raw`Let $L$ be a language with $|L|\le\aleph_0$, let $\mathfrak{M}$ be an $L$-structure and let $X\subseteq M$ be countable. Then $\mathfrak{M}$ has a **countable elementary substructure** $\mathfrak{N}\preceq\mathfrak{M}$ with $X\subseteq N$. In particular every satisfiable set of sentences in a countable language has a countable model. (For a language of any size $\lambda$, and $|X|\le\kappa$ with $\lambda\le\kappa\le|M|$, the same argument gives $\mathfrak{N}\preceq\mathfrak{M}$ of size $\kappa$.)`,
      idea: String.raw`Start with $X$ and repeatedly add witnesses: whenever $\mathfrak{M}\models\exists y\,\varphi(\bar a,y)$ for a formula $\varphi$ and parameters $\bar a$ already collected, pick one witness $b$ and put it in. There are only countably many formulas and, at each stage, countably many tuples of parameters, so every stage is countable, and so is the union $N$. The Tarski–Vaught criterion (logic-3.11) is satisfied by construction, hence $\mathfrak{N}\preceq\mathfrak{M}$. The version for theories follows by applying this to a model supplied by the completeness theorem (logic-4.6).`,
      caption: String.raw`A reconstruction in $(\mathbb{R},0,1,+,\cdot,<)$, not a proof: the set starts from $0$, $1$ and the chosen seeds, and each stage adds the witnesses for sums, products, negatives, inverses, square roots, the root of $y^3+y=x$ and midpoints. Drag the gold handle along row $M_k$: the demand at that element is shown, and its witness appears in the next row. Choose the demand to count how many are already met inside $M_k$ and how many once $M_{k+1}$ is added.`,
      deps: ['logic-4.6', 'logic-3.11'],
      refs: ['Enderton §2.6'],
      tags: ['Löwenheim–Skolem', 'elementary substructures'],
      credit: 'Löwenheim, 1915; Skolem, 1920',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/L%C3%B6wenheim%E2%80%93Skolem_theorem' },
      viz(v) {
        const seeds = v.select('seeds', [{ value: 'a', label: 'none' }, { value: 'b', label: '$\\pi$' }, { value: 'c', label: '$\\pi,\\ e$' }], 'c');
        const dem = v.select('demand', [{ value: 'sq', label: '$\\exists y\\,(y^2=x)$' }, { value: 'cube', label: '$\\exists y\\,(y^3+y=x)$' }, { value: 'gap', label: '$\\exists y\\,(x<y<z)$' }], 'sq');
        const kS = v.slider('source stage $k$', 0, 1, 0, { int: true });
        const s = v.stage({ x: [-6.5, 6.5], y: [0.7, 4.9], axes: false, height: 270 });
        const h = s.handle(1.6, 3.4, { color: 'gold', constrain: 'x', label: 'a', labelPos: 'n' });
        const ROWY = [3.4, 2.4, 1.4], ROWC = ['accent', 'teal', 'purple'];
        let info = {};
        v.render(() => {
          const S = hullStages(seeds.value === 'a' ? [] : seeds.value === 'b' ? [Math.PI] : [Math.PI, Math.E]);
          const k = kS.value, cur = S[k], nxt = S[k + 1];
          h.set(h.x, ROWY[k]);
          // continuum row
          s.line(-6.5, 4.4, 6.5, 4.4, { color: 'ink', width: 3, alpha: 0.5 });
          s.text('ℝ', -6.3, 4.75, { color: 'muted', size: 13, align: 'left' });
          const c = s.ctx;
          for (let j = 0; j <= k + 1; j++) {
            c.fillStyle = v.color(ROWC[j], j === k + 1 ? 0.55 : 0.85);
            const y0 = s.Y(ROWY[j]);
            for (const x of S[j].arr) if (x >= -6.5 && x <= 6.5) c.fillRect(s.X(x) - 0.6, y0 - 7, 1.2, 14);
            s.text(`M${'₀₁₂'[j]}  (${S[j].arr.length.toLocaleString()} elements)`, -6.3, ROWY[j] - 0.5, { color: ROWC[j], size: 12, align: 'left' });
          }
          // the element under the handle and its witnesses
          const idx = Math.max(0, Math.min(cur.arr.length - 1, lowerBound(cur.arr, h.x) - 1));
          let a = cur.arr[idx], best = Infinity;
          for (let i = Math.max(0, idx - 2); i <= Math.min(cur.arr.length - 1, idx + 2); i++) if (Math.abs(cur.arr[i] - h.x) < best) { best = Math.abs(cur.arr[i] - h.x); a = cur.arr[i]; }
          s.dot(a, ROWY[k], { r: 5, color: 'gold' });
          let wit = [], txt = '';
          const nextOf = (arr, x) => arr[lowerBound(arr, x)];
          if (dem.value === 'sq') { if (a > 0) wit = [Math.sqrt(a), -Math.sqrt(a)]; txt = a > 0 ? `x = ${v.fix(a, 4)}: witnesses ±${v.fix(Math.sqrt(a), 4)}` : a === 0 ? 'x = 0: witness 0' : `x = ${v.fix(a, 4)} < 0: no demand (ℝ has no root)`; }
          else if (dem.value === 'cube') { wit = [depressedRoot(a)]; txt = `x = ${v.fix(a, 4)}: unique witness y = ${v.fix(wit[0], 4)}`; }
          else { const z = nextOf(cur.arr, a); if (z !== undefined) { wit = [(a + z) / 2]; txt = `x = ${v.fix(a, 4)}, z = ${v.fix(z, 4)}: any y between, e.g. ${v.fix(wit[0], 4)}`; } }
          for (const w of wit) {
            if (Math.abs(w) > 6.5) continue;
            const inCur = cur.keys.has(K8(w)), inNxt = nxt.keys.has(K8(w));
            s.line(a, ROWY[k] - 0.1, w, ROWY[k + 1] + 0.1, { color: 'green', width: 1.4, dash: true, alpha: 0.8 });
            s.dot(w, ROWY[k + 1], { r: 5, color: inNxt ? 'green' : 'red' });
            if (inCur) s.dot(w, ROWY[k], { r: 8, hollow: true, color: 'green' });
          }
          // statistics over all demands from M_k inside the window
          let N = 0, mk = 0, mk1 = 0;
          const A = cur.arr.filter((x) => Math.abs(x) <= 6);
          if (dem.value === 'gap') {
            for (let i = 0; i + 1 < A.length; i++) {
              N++; const lo = A[i], hi = A[i + 1];
              if (cur.arr[lowerBound(cur.arr, lo)] < hi) mk++;
              if (nxt.arr[lowerBound(nxt.arr, lo)] < hi) mk1++;
            }
          } else {
            for (const x of A) {
              let ws;
              if (dem.value === 'sq') { if (x < 0) continue; ws = [Math.sqrt(x), -Math.sqrt(x)]; } else ws = [depressedRoot(x)];
              N++; if (ws.some((w) => cur.keys.has(K8(w)))) mk++; if (ws.some((w) => nxt.keys.has(K8(w)))) mk1++;
            }
          }
          info = { N, mk, mk1, txt, k };
        });
        v.readout(() => `${info.txt}\nDemands from $M_${info.k}$ with $|x|\\le 6$: **${info.N}**; met inside $M_${info.k}$: **${info.mk}**; met inside $M_${info.k + 1}$: **${info.mk1}**. The union of all stages is countable, and by Tarski–Vaught it is elementary once *every* formula's demands are closed under (here only a few are shown).`);
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2',
      kind: 'Theorem',
      name: 'Upward Löwenheim–Skolem theorem',
      statement: String.raw`Let $\mathfrak{A}$ be an infinite $L$-structure and let $\kappa\ge|A|+|L|$ be an infinite cardinal. Then $\mathfrak{A}$ has an **elementary extension** $\mathfrak{B}\succeq\mathfrak{A}$ with $|B|=\kappa$. Consequently a theory with an infinite model has models of every infinite cardinality $\kappa\ge|L|$.`,
      idea: String.raw`Expand the language by constants $c_\alpha$ ($\alpha<\kappa$) and by a constant for each element of $A$, and add the elementary diagram of $\mathfrak{A}$ together with the sentences $c_\alpha\ne c_\beta$ for $\alpha\ne\beta$. Any finite subset mentions only finitely many of the new constants, and these can be interpreted in $\mathfrak{A}$ as distinct elements because $A$ is infinite. So the compactness theorem (logic-4.7) gives a model; it has at least $\kappa$ elements and contains a copy of $\mathfrak{A}$ elementarily. The downward theorem (logic-5.1) then cuts it down to exactly $\kappa$ elements while keeping $\mathfrak{A}$.`,
      caption: String.raw`The row on top holds the new constants $c_0,c_1,\dots$ (the pairwise-distinct requirement is the only thing added). Pick a batch of the first $b$ constants and a structure $\mathfrak{A}$ (finite of a chosen size, or infinite): the lines show an injective interpretation, and a red mark appears the moment the pigeonhole principle fails. With $\mathfrak{A}$ finite the batches stop being satisfiable once $b>|A|$; with $\mathfrak{A}$ infinite every batch works, which is exactly what compactness needs.`,
      deps: ['logic-4.7', 'logic-3.10', 'logic-5.1'],
      refs: ['Enderton §2.6'],
      tags: ['Löwenheim–Skolem', 'compactness'],
      credit: 'Tarski, Mal’cev and Vaught, 1930s–1957',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/L%C3%B6wenheim%E2%80%93Skolem_theorem' },
      verify: true,
      viz(v) {
        const kap = v.select('new constants κ', [{ value: '4', label: '4' }, { value: '8', label: '8' }, { value: 'w', label: '$\\aleph_0$' }, { value: 'w1', label: '$\\aleph_1$' }], 'w');
        const bS = v.slider('batch size $b$', 1, 8, 5, { int: true });
        const inf = v.toggle('$\\mathfrak{A}$ is infinite', true);
        const aS = v.slider('$|A|$ when finite', 1, 8, 4, { int: true });
        const s = v.stage({ x: [0, 100], y: [0, 100], axes: false, full: true, height: 330 });
        let info = {};
        v.render(() => {
          aS.el.hidden = inf.value;
          const D = kap.value === '4' ? 4 : 8;
          const b = Math.min(bS.value, D);
          const Asize = inf.value ? Infinity : aS.value;
          const cx = (i, n) => 12 + (76 * i) / Math.max(1, n - 1);
          s.text('new constants (to be interpreted by pairwise distinct elements)', 50, 94, { color: 'muted', size: 12, align: 'center' });
          s.text('the structure A (elements a₀, a₁, …)', 3, 33, { color: 'muted', size: 12, align: 'left' });
          const nA = inf.value ? 8 : aS.value;
          let failed = 0;
          for (let i = 0; i < D; i++) {
            const inBatch = i < b, x = cx(i, D);
            const ok = i < nA || inf.value;
            s.dot(x, 80, { r: 14, color: inBatch ? 'orange' : 'faint' });
            s.text(`c${'₀₁₂₃₄₅₆₇'[i]}`, x, 80, { size: 12, color: inBatch ? 'ink' : 'muted', baseline: 'middle', align: 'center' });
            if (inBatch) {
              if (ok) s.line(x, 76, cx(i, Math.max(nA, 2)), 22, { color: 'green', width: 1.5, alpha: 0.85 });
              else { failed++; s.text('✗', x, 62, { color: 'red', size: 18, weight: 700, align: 'center' }); }
            }
          }
          if (kap.value === 'w') s.text('…', 95, 80, { color: 'muted', size: 18, align: 'center' });
          if (kap.value === 'w1') s.text('… and one c_α for every α < ω₁', 95, 70, { color: 'muted', size: 11, align: 'right' });
          if (kap.value === 'w') s.text('… one c_n for every n ∈ ℕ', 95, 70, { color: 'muted', size: 11, align: 'right' });
          for (let i = 0; i < nA; i++) {
            const x = cx(i, Math.max(nA, 2));
            s.dot(x, 22, { r: 6, color: 'accent' });
            s.text(`a${'₀₁₂₃₄₅₆₇'[i]}`, x, 12, { size: 11, color: 'muted', align: 'center' });
          }
          if (inf.value) s.text('… infinitely many more elements …', 95, 3, { color: 'muted', size: 11, align: 'right' });
          if (failed) s.text(`pigeonhole: ${b} distinct constants cannot fit into ${Asize} elements`, 50, 50, { color: 'red', size: 13, weight: 700, align: 'center' });
          const finiteSat = b <= Asize;
          const all = kap.value === '4' ? 4 : kap.value === '8' ? 8 : Infinity;
          const everySat = inf.value || all <= Asize;
          info = { b, finiteSat, everySat, all, Asize };
        });
        v.readout(() => `The batch $\\{c_i\\ne c_j: i<j<${info.b}\\}$ is ${info.finiteSat ? '**satisfiable**' : '**not satisfiable**'} in $\\mathfrak{A}$ (it needs $${info.b}$ distinct elements; $|A| = ${Number.isFinite(info.Asize) ? info.Asize : '\\infty'}$).\nAll finite batches satisfiable: **${info.everySat ? 'yes' : 'no'}**${info.everySat ? ' — by compactness there is a model of the whole theory, and it has at least $\\kappa$ elements.' : ' — no model of this form exists; this is why the theorem needs an infinite $\\mathfrak{A}$ (finite structures are rigid in size).'}`);
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3',
      kind: 'Paradox',
      name: 'Skolem’s paradox',
      statement: String.raw`If ZFC is consistent, it has a **countable model** $\mathfrak{M}=(M,E)$ (by logic-4.6 and logic-5.1). In $\mathfrak{M}$ the sentence “the set of real numbers is uncountable” is true, because ZFC proves Cantor's theorem (logic-1.2). Yet $\mathbb{R}^{\mathfrak{M}}$ is a countable set when viewed from outside. There is no contradiction: “countable” means “there is a bijection with $\omega$ *as a set*”, and the bijection that enumerates $\mathbb{R}^{\mathfrak{M}}$ from outside is simply not an element of $\mathfrak{M}$. Uncountability is not an absolute property, and first-order axioms cannot force it.`,
      idea: String.raw`The sentence “there is no function from $\omega$ onto $\mathbb{R}$” quantifies over the functions that exist *in the model*. The downward Löwenheim–Skolem construction (logic-5.1) gives a countable model by throwing away most of the universe — among the discarded objects are all the enumerations of the model's reals. Cantor's diagonal argument (logic-1.2) still works *inside* the model: applied to any enumeration that the model owns, it produces a real that the enumeration misses. Outside the model we use a bigger universe and see an enumeration the model does not own.`,
      caption: String.raw`A toy version with decidable bit-sequences standing in for “the model's reals” (an analogy, not a model of ZFC): the table lists a computable sequence of computable reals (rows) and the diagonal real $d$ with $d(k)=1-\text{row}_k(k)$, which differs from every row. **Put the diagonal on top** adds $d$ itself to the list — and the new diagonal is another real that the longer list misses. Every computable list is incomplete, yet the computable reals are countable from outside.`,
      deps: ['logic-5.1', 'logic-1.2'],
      refs: ['Enderton §2.6', 'Kunen Ch. IV'],
      tags: ['countability', 'relativity of cardinality'],
      credit: 'Skolem, 1922 (published 1923)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Skolem%27s_paradox' },
      viz(v) {
        const fam = v.select('list of reals', Object.entries(FAMS).map(([value, f]) => ({ value, label: f.label })), 'par', { onChange: () => { extra = []; } });
        const view = v.select('viewpoint', [{ value: 'in', label: 'inside the model' }, { value: 'out', label: 'outside' }], 'in');
        let extra = [];   // diagonals put on top, newest first
        const list = (n) => (n < extra.length ? extra[n] : FAMS[fam.value].row(n - extra.length));
        const diag = (k) => 1 - list(k)(k);
        v.button('Put the diagonal on top of the list', () => { const L = list, snapshot = (k) => 1 - L(k)(k); extra.unshift(snapshot); });
        v.button('Reset', () => { extra = []; });
        const s = v.stage({ x: [0, 100], y: [0, 100], axes: false, full: true, height: 360 });
        let info = {};
        v.render(() => {
          const R = 10, C = 18, x0 = 16, dx = 4.3, y0 = 92, dy = 6.1;
          s.text('bit k →', x0 - 1, 97, { size: 11, color: 'muted', align: 'left' });
          let allDiff = true;
          for (let n = 0; n < R; n++) {
            const row = list(n);
            const isNew = n < extra.length;
            s.text(isNew ? `d${'₀₁₂₃₄₅'[extra.length - 1 - n] || ''}` : `r${n}`, 10, y0 - n * dy, { size: 12, color: isNew ? 'green' : 'muted', align: 'right', baseline: 'middle' });
            for (let k = 0; k < C; k++) {
              const bit = row(k), onDiag = k === n;
              if (onDiag) s.rect(x0 + k * dx - 2, y0 - n * dy - 2.7, x0 + k * dx + 2, y0 - n * dy + 2.7, { fill: 'orange', fillAlpha: 0.3, stroke: false });
              s.text(String(bit), x0 + k * dx, y0 - n * dy, { align: 'center', size: 13, color: onDiag ? 'orange' : bit ? 'ink' : 'muted', baseline: 'middle', weight: onDiag ? 700 : 400 });
            }
            if (n < C && diag(n) === row(n)) allDiff = false;
          }
          const yd = y0 - R * dy - 1;
          s.line(x0 - 3, yd + 4, x0 + C * dx, yd + 4, { color: 'faint' });
          s.text('d', 10, yd, { size: 14, color: 'green', align: 'right', baseline: 'middle', weight: 700 });
          for (let k = 0; k < C; k++) s.text(String(diag(k)), x0 + k * dx, yd, { align: 'center', size: 13, color: 'green', baseline: 'middle', weight: 700 });
          if (view.value === 'out') {
            s.rect(2, 1, 98, 21, { fill: 'accent', fillAlpha: 0.08, stroke: false });
            s.text('Outside: the model’s reals are enumerated by program number, r(0), r(1), r(2), …', 4, 15, { size: 11.5, color: 'accent', align: 'left' });
            s.text('but telling which programs define total sequences is not computable, so this enumeration is not in the model.', 4, 7, { size: 10.5, color: 'muted', align: 'left' });
          } else {
            s.rect(2, 1, 98, 21, { fill: 'green', fillAlpha: 0.08, stroke: false });
            s.text('Inside: the model owns only computable lists, and the diagonal d of such a list is computable too,', 4, 15, { size: 11.5, color: 'green', align: 'left' });
            s.text('so d is a real of the model missed by the list: the model proves “ℝ is uncountable”.', 4, 7, { size: 10.5, color: 'muted', align: 'left' });
          }
          info = { allDiff, added: extra.length };
        });
        v.readout(() => `Diagonal real $d$ differs from row $n$ at bit $n$ for all $n<18$: **${info.allDiff ? 'verified' : 'FAILED'}**. Diagonals added so far: **${info.added}**. Each enlargement of the list is again incomplete.`);
      },
    },
    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4',
      kind: 'Definition',
      name: 'Categoricity in a cardinal',
      statement: String.raw`A theory $T$ is **$\kappa$-categorical** if it has a model of cardinality $\kappa$ and any two models of $T$ of cardinality $\kappa$ are isomorphic. By the Löwenheim–Skolem theorems (logic-5.1, logic-5.2) a theory in a countable language with an infinite model has models of every infinite size, so categoricity is a statement about whether size alone determines the structure.`,
      idea: String.raw`A first-order theory cannot pin down a structure up to isomorphism (logic-5.2: it has models of all infinite sizes), but it can pin it down *among structures of a given size*. Typical proofs identify a complete invariant: the dimension of a vector space, the transcendence degree of a field, the number of classes and their sizes. Size $\kappa$ then fixes the invariant (large invariants dominate the cardinality) or leaves it free (at $\aleph_0$ the invariant can be any finite number or $\aleph_0$).`,
      caption: String.raw`Each row is a theory, each column a size ($\aleph_1$ and $\aleph_2$ stand for the uncountable sizes). Green cells are categorical. **Click any cell** to see why the models are unique or to see two models of that size that are not isomorphic. The patterns to notice: some theories are categorical only at $\aleph_0$, some only above, some in every infinite size, some nowhere.`,
      deps: ['logic-5.2', 'logic-3.7', 'logic-3.13'],
      refs: ['Enderton §2.6'],
      tags: ['categoricity', 'cardinality'],
      credit: 'Veblen, 1904 (the term “categorical”)',
      verify: true,
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], axes: false, full: true, height: 390 });
        let sel = { r: 1, c: 1 };
        const COLS = [{ x: 56, label: 'ℵ₀', unc: false }, { x: 72, label: 'ℵ₁', unc: true }, { x: 88, label: 'ℵ₂', unc: true }];
        const rowY = (i) => 88 - i * 10.6;
        s.onClick((x, y) => {
          const r = Math.round((88 - y) / 10.6), c = COLS.findIndex((q) => Math.abs(q.x - x) < 7.5);
          if (r >= 0 && r < THEORIES.length && c >= 0) { sel = { r, c }; v.invalidate(); }
        });
        v.render(() => {
          COLS.forEach((q) => s.text(q.label, q.x, 96, { size: 14, color: 'ink', weight: 700, align: 'center' }));
          s.text('theory', 3, 96, { size: 12, color: 'muted', align: 'left' });
          THEORIES.forEach((T, i) => {
            const y = rowY(i);
            s.text(T.name, 3, y, { size: 11.5, align: 'left', baseline: 'middle', color: sel.r === i ? 'ink' : 'muted', weight: sel.r === i ? 700 : 400 });
            COLS.forEach((q, c) => {
              const cat = q.unc ? T.cu : T.c0, txt = cat ? '✓' : (q.unc ? T.nu : T.n0);
              const on = sel.r === i && sel.c === c;
              s.rect(q.x - 7, y - 4.3, q.x + 7, y + 4.3, { fill: cat ? 'green' : 'red', fillAlpha: on ? 0.5 : 0.2, color: on ? 'ink' : 'faint', width: on ? 2 : 1, radius: 4 });
              s.text(txt, q.x, y, { size: 13, baseline: 'middle', weight: 700, color: cat ? 'green' : 'red', align: 'center' });
            });
          });
          s.text('click a cell · ✓ = categorical · otherwise the number of non-isomorphic models of that size', 3, 1.5, { size: 10.5, color: 'muted', align: 'left' });
        });
        v.readout(() => {
          const T = THEORIES[sel.r], q = COLS[sel.c], cat = q.unc ? T.cu : T.c0;
          const size = q.unc ? 'an uncountable size $\\kappa$' : '$\\aleph_0$';
          const body = cat ? (q.unc ? T.whyu : T.why0) || 'any two models of this size are isomorphic' : (q.unc ? T.witu : T.wit0);
          return `$${T.tex}$ in ${size}: ${cat ? '**categorical** — ' : '**not categorical** — '}${body}.${T.verify && !cat && q.unc ? ' (Unverified detail.)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5',
      kind: 'Theorem',
      name: 'Cantor’s back-and-forth theorem',
      statement: String.raw`Any two nonempty countable dense linear orders without endpoints are isomorphic. In particular $(\mathbb{Q},<)\cong(D,<)$ where $D$ is the set of dyadic rationals in $(0,1)$, and the theory of dense linear orders without endpoints is $\aleph_0$-categorical.`,
      idea: String.raw`List both orders as $a_0,a_1,\dots$ and $b_0,b_1,\dots$ and build a finite order-preserving partial matching one pair at a time. On even steps take the first unmatched $a_i$ and choose a partner among the $b$'s lying in the gap determined by the neighbours of $a_i$ in the matching; density and the lack of endpoints guarantee that this gap contains a point. On odd steps do the same with the roles reversed. Alternating makes every $a_i$ and every $b_j$ matched eventually, and the union of the finite matchings is an isomorphism. Going *forth* only can leave elements of the target untouched.`,
      caption: String.raw`Each dot $(a,f(a))$ is one pair of the matching; blue dots come from "forth" steps, orange from "back" steps, the last pair is gold, and the staircase joining them is monotone. The strips on the axes show the first rationals and the first dyadics, green once matched. Switch to **forth only** and watch dyadics stay unmatched. Switch the target to $[0,1]$ (with endpoints) and the construction is stuck after a few steps: the hypothesis "no endpoints" is used.`,
      deps: ['logic-5.4', 'logic-3.7'],
      refs: ['Enderton §2.6'],
      tags: ['dense orders', 'isomorphism'],
      credit: 'Cantor, 1895; back-and-forth proof: Hausdorff, 1914',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cantor%27s_isomorphism_theorem' },
      viz(v) {
        const steps = v.slider('steps', 0, 60, 12, { int: true });
        const mode = v.select('method', [{ value: 'bf', label: 'back and forth' }, { value: 'forth', label: 'forth only' }], 'bf');
        const tgt = v.select('target', [{ value: 'open', label: 'dyadics in $(0,1)$' }, { value: 'closed', label: 'dyadics in $[0,1]$' }], 'open');
        const s = v.stage({ x: [-6, 6], y: [-0.06, 1.06], axes: 'box', gutter: true, height: 380, xlabel: 'rationals a', ylabel: 'dyadic rationals b' });
        let info = {};
        v.render(() => {
          const R = backForth(steps.value, { mode: mode.value, closed: tgt.value === 'closed' });
          const P = R.pairs;
          if (tgt.value === 'closed') { s.hline(0, { color: 'red', dash: true, alpha: 0.5 }); s.hline(1, { color: 'red', dash: true, alpha: 0.5 }); s.text('least point of the target', -5.9, 0.03, { size: 10.5, color: 'red', align: 'left' }); }
          // strips of the first elements
          const firstA = R.A.slice(0, 30), firstB = R.B.slice(0, 30);
          for (const a of firstA) { const x = frVal(a); if (Math.abs(x) <= 6) s.line(x, -0.045, x, -0.015, { color: R.usedA.has(frKey(a)) ? 'green' : 'faint', width: 2 }); }
          for (const b of firstB) s.line(-5.95, frVal(b), -5.7, frVal(b), { color: R.usedB.has(frKey(b)) ? 'green' : 'faint', width: 2 });
          const pts = P.filter((p) => Math.abs(frVal(p.a)) <= 6).map((p) => [frVal(p.a), frVal(p.b)]);
          s.path(pts, { color: 'muted', width: 1.2, alpha: 0.6 });
          P.forEach((p, i) => {
            const x = frVal(p.a);
            if (Math.abs(x) > 6) return;
            const last = i === P.length - 1 || p.t === steps.value - 1;
            s.dot(x, frVal(p.b), { r: last ? 6 : 4, color: last ? 'gold' : p.dir === 'forth' ? 'accent' : 'orange' });
          });
          const lastP = P.find((p) => p.t === steps.value - 1);
          if (lastP && Math.abs(frVal(lastP.a)) <= 6) s.text(`${frStr(lastP.a)} ↦ ${frStr(lastP.b)}`, frVal(lastP.a), frVal(lastP.b) - 0.06, { size: 11.5, color: 'ink', align: 'center' });
          if (R.stuck) s.corner(`STUCK at step ${R.stuck.t + 1}: ${R.stuck.why}`, 'tl', { color: 'red', weight: 700, plate: true });
          let mono = true; for (let i = 1; i < P.length; i++) if (frCmp(P[i - 1].b, P[i].b) >= 0) mono = false;
          const covA = R.A.slice(0, 30).filter((a) => R.usedA.has(frKey(a))).length, covB = R.B.slice(0, 30).filter((b) => R.usedB.has(frKey(b))).length;
          info = { n: P.length, mono, covA, covB, stuck: R.stuck, last: lastP };
        });
        v.readout(() => `Pairs built: **${info.n}** (order-preserving: **${info.mono ? 'yes' : 'NO'}**). Of the first 30 rationals, **${info.covA}** are matched; of the first 30 dyadics, **${info.covB}** are matched.${info.stuck ? ` The matching cannot be extended: ${info.stuck.why}, so with endpoints the two orders are **not** isomorphic.` : info.covB < info.covA ? ' Dyadics are lagging behind: the forth steps alone never exhaust the target.' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6',
      kind: 'Theorem',
      name: 'Łoś–Vaught test',
      statement: String.raw`Let $T$ be a satisfiable theory in a countable language with **no finite models**. If $T$ is $\kappa$-categorical for some infinite cardinal $\kappa$, then $T$ is **complete**: for every sentence $\varphi$, either $T\models\varphi$ or $T\models\neg\varphi$.`,
      idea: String.raw`Suppose $\varphi$ and $\neg\varphi$ were both consistent with $T$. Then $T\cup\{\varphi\}$ and $T\cup\{\neg\varphi\}$ have models, which are infinite because $T$ has no finite models. By the Löwenheim–Skolem theorems (logic-5.1, logic-5.2) each has a model of cardinality $\kappa$. By $\kappa$-categoricity (logic-5.4) these two models are isomorphic, and isomorphic structures satisfy the same sentences (logic-3.8) — contradicting that one satisfies $\varphi$ and the other $\neg\varphi$.`,
      caption: String.raw`Pick a theory. The tool first looks for **finite models** (the first axiom that fails in each small structure), then states categoricity (for dense orders this is the back-and-forth theorem, logic-5.5), and then evaluates your sentence in several infinite models: where the test applies they must agree. The third theory, dense orders with endpoints allowed, fails the categoricity hypothesis and its models disagree about the existence of a least element.`,
      deps: ['logic-5.4', 'logic-5.2', 'logic-5.5', 'logic-3.8'],
      refs: ['Enderton §2.6'],
      tags: ['completeness of theories', 'categoricity'],
      credit: 'Łoś, 1954; Vaught, 1954',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/%C5%81o%C5%9B%E2%80%93Vaught_test' },
      viz(v) {
        const SO = { rels: { '<': 2 }, funcs: {}, consts: [], name: 'the language of orders' };
        const SE = { rels: {}, funcs: {}, consts: [], name: 'the language of equality' };
        const geq = (n) => `∃${range(n).map((i) => 'x' + i).join(' ∃')} (${range(n).flatMap((i) => range(i).map((j) => `x${j} ≠ x${i}`)).join(' ∧ ')})`;
        const DLO = ['∀x ¬(x<x)', '∀x∀y∀z (x<y ∧ y<z → x<z)', '∀x∀y (x<y ∨ x=y ∨ y<x)', '∀x∀y (x<y → ∃z (x<z ∧ z<y))'];
        const TH = {
          set: { name: 'infinite sets', sig: SE, ax: range(6).map((i) => geq(i + 2)), axNames: range(6).map((i) => `at least ${i + 2} elements`), fin: (m) => ({ dom: range(m), rel: () => false, fn: () => 0, konst: () => 0 }), inf: [['an infinite set', infiniteSet()]], cat: '✓ categorical in every infinite cardinality (a bijection is an isomorphism)', ok: true,
            ex: ['∃x ∃y ∃z (x≠y ∧ y≠z ∧ x≠z)', '∀x ∀y x=y', '∃x ∃y x≠y', '∀x ∃y (x≠y)'] },
          dlo: { name: 'dense linear orders without endpoints', sig: SO, ax: [...DLO, '∀x ∃y x<y', '∀x ∃y y<x'], axNames: ['irreflexive', 'transitive', 'total', 'dense', 'no greatest element', 'no least element'], fin: finiteOrder, inf: [['ℚ', orderStruct()], ['dyadics in (0,1)', orderStruct(0, 1)]], cat: '✓ ℵ₀-categorical (Cantor’s back-and-forth, 5.5)', ok: true,
            ex: ['∀x ∃y x<y', '∃x ∀y (x=y ∨ x<y)', '∀x∀y (x<y → ∃z (x<z ∧ z<y))', '∃x ∃y ∃z (x<y ∧ y<z)', '∀x ∀y ∃z (x<z ∧ y<z)'] },
          dloe: { name: 'dense linear orders with ≥ 2 points, endpoints allowed', sig: SO, ax: [...DLO, '∃x ∃y x<y'], axNames: ['irreflexive', 'transitive', 'total', 'dense', 'at least two points'], fin: finiteOrder, inf: [['ℚ (no endpoints)', orderStruct()], ['[0,1] (both)', orderStruct(0, 1, true, true)], ['[0,1) (least only)', orderStruct(0, 1, true, false)], ['(0,1] (greatest only)', orderStruct(0, 1, false, true)]], cat: '✗ not ℵ₀-categorical: four countable models, distinguished by a least and a greatest element', ok: false,
            ex: ['∃x ∀y (x=y ∨ x<y)', '∃x ∀y (x=y ∨ y<x)', '∀x ∃y x<y', '∀x∀y (x<y → ∃z (x<z ∧ z<y))'] },
        };
        const parsed = {};
        for (const [id, T] of Object.entries(TH)) {
          parsed[id] = T.ax.map((a) => { const r = parseFO(a, T.sig); if (!r.ast) throw new Error(`${a}: ${r.error}`); return r.ast; });
          // finite-model search: first failing axiom for each size
          T.finRows = range(5).map((i) => { const m = i + 1, M = T.fin(m); const bad = parsed[id].findIndex((f) => !holds(f, M)); return { m, bad: bad < 0 ? null : T.axNames[bad] }; });
          T.noFinite = T.finRows.every((r) => r.bad !== null);
          T.infOk = T.inf.map(([, M]) => parsed[id].every((f) => holds(f, M)));
        }
        const theory = v.select('theory', [{ value: 'set', label: 'infinite sets' }, { value: 'dlo', label: 'dense orders' }, { value: 'dloe', label: 'dense orders, endpoints allowed' }], 'dlo', { onChange: (id) => { exIdx = 0; fld.set(TH[id].ex[0]); } });
        let exIdx = 0;
        const fld = foField(v, 'sentence φ', TH.dlo.ex[0], { sig: () => TH[theory.value].sig, width: 320, check: (a) => (preorderFree(a) ? 'φ must be a sentence' : null), onChange: () => v.invalidate() });
        function preorderFree(a) { return a && a.op ? freeVarsOf(a).length > 0 : false; }
        function freeVarsOf(a) { const out = new Set(); const go = (n, bound) => { if (n.t === 'var') { if (!bound.has(n.name)) out.add(n.name); } else if (n.t === 'fn') n.args.forEach((x) => go(x, bound)); else if (n.op === 'rel') n.args.forEach((x) => go(x, bound)); else if (n.op === 'not') go(n.a, bound); else if (n.op === 'all' || n.op === 'ex') go(n.a, new Set([...bound, n.v])); else if (n.a) { go(n.a, bound); if (n.b) go(n.b, bound); } }; go(a, new Set()); return [...out]; }
        v.button('Next example sentence', () => { const T = TH[theory.value]; exIdx = (exIdx + 1) % T.ex.length; fld.set(T.ex[exIdx]); });
        const s = v.stage({ x: [0, 100], y: [0, 100], axes: false, full: true, height: 340 });
        let info = {};
        v.render(() => {
          const T = TH[theory.value];
          s.text('1. Does T have a finite model?  (first axiom that fails)', 2, 96, { size: 12.5, color: 'muted', align: 'left', weight: 700 });
          T.finRows.forEach((r, i) => {
            const x = 3 + i * 19.5;
            s.text(`size ${r.m}`, x, 89, { size: 11.5, color: 'ink', align: 'left' });
            s.text(r.bad ? `✗ ${r.bad}` : '✓ is a model!', x, 83.5, { size: 10.5, color: r.bad ? 'green' : 'red', align: 'left' });
          });
          s.text(T.noFinite ? 'No finite model among sizes 1–5 (and none at all: each finite size violates an axiom).' : 'A finite model exists: the test does not apply.', 2, 76, { size: 12, color: T.noFinite ? 'green' : 'red', align: 'left' });
          s.text('2. Categoricity', 2, 66, { size: 12.5, color: 'muted', align: 'left', weight: 700 });
          s.text(T.cat, 2, 60, { size: 12, color: T.ok ? 'green' : 'red', align: 'left' });
          s.text('3. The sentence φ in infinite models of T (checked axioms ✓)', 2, 49, { size: 12.5, color: 'muted', align: 'left', weight: 700 });
          const vals = [];
          T.inf.forEach(([name, M], i) => {
            let val = null;
            if (fld.ok && fld.ast) { try { val = holds(fld.ast, M); } catch (e) { val = null; } }
            vals.push(val);
            const y = 41 - i * 8;
            s.text(name, 4, y, { size: 12, align: 'left', baseline: 'middle', color: 'ink' });
            s.text(T.infOk[i] ? 'model ✓' : 'not a model', 40, y, { size: 10.5, align: 'left', baseline: 'middle', color: T.infOk[i] ? 'muted' : 'red' });
            s.text(val === null ? '?' : val ? 'true' : 'false', 62, y, { size: 13, align: 'left', baseline: 'middle', color: val === null ? 'muted' : val ? 'green' : 'red', weight: 700 });
          });
          const finVals = [];
          if (fld.ok && fld.ast) for (let m = 1; m <= 5; m++) { try { finVals.push(holds(fld.ast, T.fin(m)) ? 1 : 0); } catch (e) { finVals.push('?'); } }
          s.text(`finite structures of size 1–5 (not models): ${finVals.join(' ')}`, 4, 3, { size: 10.5, color: 'muted', align: 'left' });
          const known = vals.filter((x) => x !== null);
          info = { agree: known.length > 0 && known.every((x) => x === known[0]), val: known[0], T, n: known.length };
        });
        v.readout(() => (fld.ok ? (info.agree ? `All infinite models agree: φ is ${info.val ? '**true**' : '**false**'} in each.${info.T.noFinite && info.T.ok ? ' Hypotheses of the test hold, so T is complete: ' + (info.val ? 'T proves φ.' : 'T refutes φ (proves ¬φ).') : ''}` : `The models **disagree** on φ, so neither φ nor ¬φ is provable from T: T is incomplete (and the test's hypotheses must fail, as they do).`) : fld.error));
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7',
      kind: 'Definition',
      name: 'Quantifier elimination',
      statement: String.raw`A theory $T$ (or a structure $\mathfrak{M}$) **has quantifier elimination** if every formula $\varphi(\bar x)$ is equivalent, modulo $T$ (respectively in $\mathfrak{M}$), to a quantifier-free formula $\psi(\bar x)$ in the same free variables: $T\models\forall\bar x\,(\varphi\leftrightarrow\psi)$. Whether this holds depends on the language: it can fail for $(\mathbb{Z},<)$ and hold for $(\mathbb{Z},<,S)$.`,
      idea: String.raw`A quantified formula describes a set that is definable (logic-3.6) by looking at the whole structure; a quantifier-free formula describes it using only the atomic relations among the parameters. Elimination therefore says that the definable sets are exactly the ones cut out by the basic relations. A typical proof removes one existential quantifier from a conjunction of atomic formulas and then handles disjunctions and negations by normal forms; this reduces the whole problem to the single step "$\exists y$ (conjunction of literals)".`,
      caption: String.raw`Choose a structure and a quantified formula. The plane shows the parameters; the shaded region is where the quantifier-free guess $\psi$ holds. Each sampled point is evaluated *both ways* (the quantifier is really searched over the structure) and drawn green when the two agree, red when they do not. **Drag the probe** to inspect a single point. In $(\mathbb{Z},<)$ the guess $x<y$ is wrong along the diagonal $y=x+1$; adding $S$ repairs it.`,
      deps: ['logic-3.6'],
      refs: ['Enderton §3.1'],
      tags: ['quantifier elimination', 'definability'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quantifier_elimination' },
      viz(v) {
        const ex = v.select('example', QE7.map((e) => ({ value: e.id, label: e.label + (e.id === 'q' ? '' : '') })), 'zs', { onChange: () => { probe.set(0.5, 1.5); } });
        const N = v.slider('sample size', 5, 400, 120, { int: true });
        const s = v.stage({ x: [-6, 6], y: [-6, 6], axes: 'box', gutter: true, height: 420, xlabel: 'x', ylabel: 'y' });
        const probe = s.handle(0.5, 1.5, { color: 'gold', label: 'probe', labelPos: 'ne' });
        let info = {};
        v.render(() => {
          const e = QE7.find((q) => q.id === ex.value);
          const span = e.span, lim = e.kind === 'lat' ? 5.5 : 4;
          s.setLabels(e.a, e.b);
          s.setView([-lim - 0.5, lim + 0.5], [-lim - 0.5, lim + 0.5]);
          // shaded region of the quantifier-free guess
          const ac = v.rgb('accent');
          s.raster((x, y) => ((e.kind === 'lat' ? e.qf(Math.round(x / e.step) * e.step, Math.round(y / e.step) * e.step) : e.qf(x, y)) ? [ac[0], ac[1], ac[2], 0.16] : null), { res: 3, key: `qe-${e.id}` });
          // sample points
          const r = v.rng(5);
          const pts = [];
          if (e.kind === 'lat') {
            const all = []; for (let i = -span; i <= span; i += e.step) for (let j = -span; j <= span; j += e.step) all.push([i, j]);
            const shuffled = r.shuffle(all); pts.push(...shuffled.slice(0, N.value));
          } else for (let i = 0; i < N.value; i++) pts.push([r.uniform(-lim, lim), r.uniform(-lim, lim)]);
          let agree = 0;
          for (const [p, q] of pts) {
            const a = e.quant(p, q), b = e.qf(p, q), ok = a === b;
            if (ok) agree++;
            s.dot(p, q, { r: ok ? 2.8 : 5, color: ok ? 'green' : 'red', alpha: ok ? 0.8 : 1 });
          }
          const px = e.kind === 'lat' ? Math.round(probe.x / e.step) * e.step : probe.x, py = e.kind === 'lat' ? Math.round(probe.y / e.step) * e.step : probe.y;
          if (e.kind === 'lat') probe.set(px, py);
          info = { e, n: pts.length, agree, pq: e.quant(px, py), pf: e.qf(px, py), px, py };
        });
        v.legend([['accent', 'where the quantifier-free formula ψ holds', { area: true }], ['green', 'quantified and quantifier-free sides agree'], ['red', 'they disagree']]);
        v.readout(() => `$\\mathfrak{M}=${info.e.sig}$:  $\\varphi=${info.e.phi}$  versus  $\\psi=${info.e.psi}$\nAgreement: **${info.agree} / ${info.n}** sampled points${info.agree === info.n ? ' — no disagreement found.' : ' — **elimination by this ψ fails**.'}\nProbe at $(${v.fix(info.px, 2)},\\,${v.fix(info.py, 2)})$: $\\varphi$ is **${info.pq}**, $\\psi$ is **${info.pf}**. ${info.e.note[0].toUpperCase() + info.e.note.slice(1)}.`);
      },
    },
  ],
};
