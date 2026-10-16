// Logic & Foundations — Chapter 3: First-order languages and structures (items 3.8–3.13)
import {
  parseFO, toStr, toTex, preorder, isQ, freeVars, qrank, holds, compile, explainLine, graphStruct, structures, langOf,
  equivalent, prenexSteps, isPrenex, isoSearch, layoutFO, fitFO, drawFO, relEditor, foField, range, setStr, sortVars,
} from './ch03.shared.js';

// ---------- helpers ----------
const PAL = ['accent', 'orange', 'purple', 'teal', 'pink', 'green', 'gold', 'red'];
const TF = (b) => (b ? 'T' : 'F');
const LET = 'abcdefgh';
const texSet = (s) => s.replace(/\{/g, '\\{').replace(/\}/g, '\\}');

// ---------- 3.8 ----------
const SENT38 = [
  ['∀x∃y E(x,y)', 'no dead ends'],
  ['∃x E(x,x)', 'a loop'],
  ['∀x∀y (E(x,y) → E(y,x))', 'symmetric'],
  ['∃x∃y∃z (E(x,y) ∧ E(y,z) ∧ E(z,x) ∧ ¬x = y)', 'a 3-cycle'],
  ['∃x∀y ¬E(y,x)', 'a source'],
  ['∀x∀y∀z (E(x,y) ∧ E(x,z) → y = z)', 'functional'],
].map(([s, d]) => ({ ast: parseFO(s).ast, d }));

// ---------- 3.10: exact evaluation in ℕ, ℤ, 2ℤ, ℚ, ℝ (candidates up to elementary equivalence) ----------
/**
 * Linear orders with a decision procedure: a quantifier of rank r only needs candidates near the current values.
 * Discrete orders: within distance 2^r of a value (gaps of length ≥ 2^r − 1 are indistinguishable by rank < r formulas).
 * Dense orders: the values, the midpoints between them and one point beyond each end.
 */
function orderStruct(kind) {
  const base = { rel: (r, a) => (r === '<' ? a[0] < a[1] : r === '≤' ? a[0] <= a[1] : false), fn: () => 0, konst: (c) => +c, hasLe: true, kind };
  const vals = (env) => [...new Set(Object.values(env))].sort((a, b) => a - b);
  if (kind === 'Q' || kind === 'R') return { ...base, cands: (env) => { const E = vals(env); if (!E.length) return [0]; const out = [E[0] - 1, ...E, E[E.length - 1] + 1]; for (let i = 0; i + 1 < E.length; i++) out.push((E[i] + E[i + 1]) / 2); return [...new Set(out)].sort((a, b) => a - b); } };
  const step = kind === '2Z' ? 2 : 1;
  return { ...base, cands: (env, r) => {
    const E = vals(env); if (kind === 'N') E.push(0); if (!E.length) E.push(0);
    const D = 2 ** Math.min(r, 4), out = new Set();
    for (const e of E) for (let d = -D; d <= D; d++) { const x = e + step * d; if (kind !== 'N' || x >= 0) out.add(x); }
    return [...out].sort((a, b) => a - b);
  } };
}
// positions on the bottom line (𝔄 drawn on its own) vs values: 2ℤ is drawn with unit spacing to show 2ℤ ≅ ℤ
const PAIRS = {
  NZ: { big: 'Z', small: 'N', bigTex: '\\Z', smallTex: '\\N', member: (x) => Number.isInteger(x) && x >= 0, snap: (p) => Math.min(6, Math.max(0, Math.round(p))), val: (p) => p, pos: (x) => x, iso: false },
  EZ: { big: 'Z', small: '2Z', bigTex: '\\Z', smallTex: '2\\Z', member: (x) => Number.isInteger(x) && x % 2 === 0, snap: (p) => Math.min(3, Math.max(-3, Math.round(p))), val: (p) => 2 * p, pos: (x) => x / 2, iso: true },
  QR: { big: 'R', small: 'Q', bigTex: '\\R', smallTex: '\\Q', member: () => true, snap: (p) => Math.min(6, Math.max(-6, Math.round(p * 4) / 4)), val: (p) => p, pos: (x) => x, iso: false },
};

// ---------- 3.11: subsets of (ℚ, <) ----------
const SUBS = {
  open: { label: 'ℚ ∩ (0, 2)', pieces: [[0, 2, false, false]], tex: '\\Q\\cap(0,2)' },
  closed: { label: 'ℚ ∩ [0, 2]', pieces: [[0, 2, true, true]], tex: '\\Q\\cap[0,2]' },
  ints: { label: 'ℤ', ints: true, tex: '\\Z' },
  two: { label: '(−2,−1) ∪ (1,3)', pieces: [[-2, -1, false, false], [1, 3, false, false]], tex: '\\Q\\cap((-2,-1)\\cup(1,3))' },
  punct: { label: 'ℚ ∖ {0}', pieces: [[-Infinity, Infinity, false, false]], except: [0], tex: '\\Q\\setminus\\{0\\}' },
};
/** A point of A strictly between l and r (±Infinity allowed), or null. */
function meet(A, l, r) {
  if (A.ints) { const k = Number.isFinite(l) ? Math.floor(l) + 1 : Number.isFinite(r) ? Math.ceil(r) - 1 : 0; return k > l && k < r ? k : null; }
  for (const [p, q, pc, qc] of A.pieces) {
    const L = Math.max(l, p), R = Math.min(r, q);
    const Lin = L > l && (L > p || pc), Rin = R < r && (R < q || qc);
    let w = null;
    if (L < R) {
      if (Number.isFinite(L) && Number.isFinite(R)) w = (L + R) / 2; else if (Number.isFinite(L)) w = L + 1; else if (Number.isFinite(R)) w = R - 1; else w = 0;
    } else if (L === R && Lin && Rin) w = L;
    if (w == null) continue;
    if (A.except && A.except.includes(w)) { w = Number.isFinite(L) ? (L + w) / 2 : w - 1; if (!(w > l && w < r)) continue; }
    return w;
  }
  return null;
}
const inA = (A, x) => (A.ints ? Number.isInteger(x) : A.pieces.some(([p, q, pc, qc]) => (x > p || (pc && x === p)) && (x < q || (qc && x === q))) && !(A.except || []).includes(x));
function snapA(A, x) {
  if (A.ints) return Math.round(x);
  let best = null, bd = Infinity;
  for (let g = -12; g <= 16; g++) { const c = g / 4; if (inA(A, c) && Math.abs(c - x) < bd) { bd = Math.abs(c - x); best = c; } }
  return best ?? 0.5;
}
const fmtQ = (x) => { if (!Number.isFinite(x)) return x > 0 ? '+∞' : '−∞'; for (const d of [1, 2, 4, 8, 16]) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return d === 1 ? String(n).replace('-', '−') : `${String(n).replace('-', '−')}/${d}`; } return x.toFixed(3); };

// ---------- 3.13 ----------
const AXIOMS = [
  { id: 'irr', name: 'irreflexive', src: '∀x ¬(x < x)' },
  { id: 'tr', name: 'transitive', src: '∀x∀y∀z (x < y ∧ y < z → x < z)' },
  { id: 'tot', name: 'total', src: '∀x∀y (x < y ∨ x = y ∨ y < x)' },
  { id: 'den', name: 'dense', src: '∀x∀y (x < y → ∃z (x < z ∧ z < y))' },
  { id: 'nl', name: 'no least', src: '∀x∃y (y < x)' },
  { id: 'ng', name: 'no greatest', src: '∀x∃y (x < y)' },
].map((a) => ({ ...a, ast: parseFO(a.src).ast }));
function perms(n) { if (n <= 1) return [range(n)]; const out = []; for (const p of perms(n - 1)) for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]); return out; }

export default {
  collection: 'logic',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Isomorphic structures satisfy the same sentences',
      statement: String.raw`Let $h : \mathfrak A \cong \mathfrak B$ be an isomorphism. Then for every formula $\varphi$ and every assignment $s$ into $|\mathfrak A|$,
$$\mathfrak A \models \varphi[s] \iff \mathfrak B \models \varphi[h\circ s].$$
In particular, $\mathfrak A$ and $\mathfrak B$ satisfy the same sentences: isomorphic structures are elementarily equivalent.`,
      idea: String.raw`First show by induction on terms that $h(\bar s(t)) = \overline{h\circ s}(t)$, using that $h$ commutes with the functions and constants. Then argue by induction on formulas. Atomic formulas are preserved because $h$ preserves the relations, and $=$ is preserved because $h$ is injective. The connectives take care of themselves. For $\exists x\,\psi$, a witness $a$ in $\mathfrak A$ gives the witness $h(a)$ in $\mathfrak B$, and surjectivity of $h$ gives the converse. The statement has to be proved for formulas with assignments, not just sentences, since the quantifier step needs it. A bijection that is not an isomorphism can still happen to preserve every sentence (if the structures are isomorphic in some other way), but it breaks the formula-by-formula correspondence.`,
      caption: String.raw`Left $\mathfrak A$, right $\mathfrak B$, and the colours show a bijection $h$: point $a$ of $\mathfrak A$ and $h(a)$ share a colour. Click a point of $\mathfrak A$ and then a point of $\mathfrak B$ to redefine $h$ there (the old image is swapped). Arrows that $h$ fails to preserve are dashed red on both sides. The table evaluates six sentences in both structures, and the bottom row compares $\varphi(a)$ in $\mathfrak A$ with $\varphi(h(a))$ in $\mathfrak B$ for every $a$. **shuffle h** gives a bijection that is not an isomorphism: the sentences still agree, but the row for $\varphi$ shows mismatches. **break an arrow** deletes an arrow of $\mathfrak B$, so that no isomorphism exists at all and some sentence tells the structures apart.`,
      deps: ['logic-3.7'],
      refs: ['Enderton §2.2'],
      tags: ['isomorphism', 'semantics'],
      viz(v) {
        const edgesA = [[0, 1], [1, 2], [2, 0], [2, 3], [3, 3], [4, 3], [3, 4]];
        const sigma = [3, 0, 4, 1, 2];
        let h = sigma.slice(), selA = null;
        const broken = v.toggle('break an arrow', false, { onChange: () => setB() });
        v.button('shuffle h', () => { const p = [1, 4, 0, 2, 3]; h = h.map((x, i) => h[p[i]]); });
        v.button('find an isomorphism', () => { const r = isoSearch({ n: 5, bin: [EA.adj()] }, { n: 5, bin: [EB.adj()] }); if (r) h = r; else noIso = true; });
        let noIso = false;
        const fld = foField(v, 'φ(x)', '∃y (E(x,y) ∧ E(y,x))', { width: 230, check: (a) => (freeVars(a).some((x) => x !== 'x') ? 'use x as the only free variable' : null) });
        const SA = v.stage({ x: [-1.4, 1.4], y: [-1.35, 1.35], equal: true, axes: false, height: 270, title: '$\\mathfrak A$' });
        const SB = v.stage({ x: [-1.4, 1.4], y: [-1.35, 1.35], equal: true, axes: false, height: 270, title: '$\\mathfrak B$' });
        const ST = v.stage({ x: [0, 20], y: [0, 10], axes: false, height: 270, full: true });
        const EA = relEditor(v, SA, { n: 5, radius: 1, edges: edgesA });
        const EB = relEditor(v, SB, { n: 5, radius: 1, start: 50, labels: (i) => LET[i], edges: [] });
        const setB = () => { let es = edgesA.map(([a, b]) => [sigma[a], sigma[b]]); if (broken.value) es = es.filter(([a, b]) => !(a === sigma[2] && b === sigma[0])); EB.set(es, 5); noIso = false; };
        setB();
        EA.intercept = (node) => { if (node) selA = node.id; return true; };
        EB.intercept = (node) => { if (node && selA != null) { const j = h.indexOf(node.id); [h[selA], h[j]] = [h[j], h[selA]]; selA = null; } return true; };
        const TB = v.table(ST, { rows: 7, cols: 2, square: false, maxCell: 30, cellAspect: 1.5, size: 13, labelSize: 12, region: [0, 0, 9.6, 10], colLabels: ['$\\mathfrak A$', '$\\mathfrak B$'] });
        v.render(() => {
          const A = EA.adj(), B = EB.adj(), n = 5;
          const badA = [], badB = [];
          for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { if (A[a][b] && !B[h[a]][h[b]]) badA.push([a, b]); }
          const hinv = range(n).map((j) => h.indexOf(j));
          for (let c = 0; c < n; c++) for (let d = 0; d < n; d++) if (B[c][d] && !A[hinv[c]][hinv[d]]) badB.push([c, d]);
          const isBad = (list) => (e) => list.some(([a, b]) => a === e.from && b === e.to);
          EA.G.draw({ nodeColor: (id) => PAL[id], nodeFill: (id) => PAL[id], nodeRing: (id) => (id === selA ? 'gold' : null), edgeColor: (e) => (isBad(badA)(e) ? 'red' : null), edgeDash: (e) => (isBad(badA)(e) ? [5, 4] : null) });
          EB.G.draw({ nodeColor: (id) => PAL[hinv[id]], nodeFill: (id) => PAL[hinv[id]], edgeColor: (e) => (isBad(badB)(e) ? 'red' : null), edgeDash: (e) => (isBad(badB)(e) ? [5, 4] : null) });
          SA.corner('click a point here, then its new image', 'tl', { size: 10.5 });
          SB.corner(`h: ${range(n).map((a) => `${a}↦${LET[h[a]]}`).join('  ')}`, 'bl', { size: 11, color: badA.length + badB.length ? 'red' : 'green' });
          const MA = graphStruct(n, A), MB = graphStruct(n, B, { label: (i) => LET[i] });
          const va = SENT38.map((s) => holds(s.ast, MA)), vb = SENT38.map((s) => holds(s.ast, MB));
          TB.draw({
            rows: SENT38.length, rowLabels: SENT38.map((s) => s.d),
            value: (i, j) => TF(j ? vb[i] : va[i]),
            fill: (i) => (va[i] !== vb[i] ? ['red', 0.3] : ['green', 0.14]),
          });
          // φ(a) vs φ(h(a))
          if (fld.ast) {
            const x0 = 11, dx = 1.6;
            ST.text('φ(a) in 𝔄', x0 - 0.3, 6.6, { align: 'right', baseline: 'middle', size: 12, color: 'muted' });
            ST.text('φ(h(a)) in 𝔅', x0 - 0.3, 4.6, { align: 'right', baseline: 'middle', size: 12, color: 'muted' });
            range(n).forEach((a) => {
              const p = holds(fld.ast, MA, { x: a }), q = holds(fld.ast, MB, { x: h[a] }), X = x0 + 0.8 + a * dx;
              ST.text(String(a), X, 8.2, { align: 'center', size: 12, weight: 700, color: PAL[a] });
              ST.text(`↦ ${LET[h[a]]}`, X, 2.9, { align: 'center', size: 11.5, color: PAL[a] });
              [[p, 6.6], [q, 4.6]].forEach(([val, y]) => { ST.rect(X - 0.6, y - 0.7, X + 0.6, y + 0.7, { fill: val ? 'green' : 'red', fillAlpha: 0.2, color: val ? 'green' : 'red', width: 1.2, radius: 5 }); ST.text(TF(val), X, y, { align: 'center', baseline: 'middle', size: 13, weight: 700, color: val ? 'green' : 'red' }); });
              if (p !== q) ST.rect(X - 0.75, 3.7, X + 0.75, 7.5, { color: 'red', width: 2.2, radius: 6 });
            });
          } else ST.text(fld.error || '', 15, 5, { align: 'center', color: 'red', size: 12 });
        });
        v.readout(() => {
          const A = EA.adj(), B = EB.adj(), n = 5, MA = graphStruct(n, A), MB = graphStruct(n, B);
          let broke = 0; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (A[a][b] !== B[h[a]][h[b]]) broke++;
          const diff = SENT38.filter((s) => holds(s.ast, MA) !== holds(s.ast, MB));
          const iso = isoSearch({ n, bin: [A] }, { n, bin: [B] });
          const mis = fld.ast ? range(n).filter((a) => holds(fld.ast, MA, { x: a }) !== holds(fld.ast, MB, { x: h[a] })).length : 0;
          const hs = broke ? `$h$ is a bijection but **not** an isomorphism (${broke} ordered pair${broke === 1 ? '' : 's'} not preserved)` : '$h$ is an **isomorphism** ✓';
          const ss = diff.length ? `**${diff.length} sentence${diff.length === 1 ? ' disagrees' : 's disagree'}** (${diff.map((d) => d.d).join(', ')})` : 'all six sentences agree';
          const st = iso ? 'The structures are isomorphic (an isomorphism exists, found by search).' : `No isomorphism exists${noIso ? ' (the search found none)' : ''}.`;
          return `${hs}; ${ss}; $\\varphi(a) \\leftrightarrow \\varphi(h(a))$ fails for ${mis} of 5 points${!broke && !mis ? ' ✓' : ''}. ${st}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Proposition',
      name: 'Automorphisms preserve definable sets',
      statement: String.raw`Let $h$ be an automorphism of $\mathfrak A$ (an isomorphism of $\mathfrak A$ onto itself) and let $R \subseteq |\mathfrak A|^k$ be definable with parameters $b_1,\dots,b_m$. If $h(b_i) = b_i$ for every $i$, then $h[R] = R$, that is, $\bar a \in R \iff h\bar a \in R$. In particular every relation definable without parameters is mapped onto itself by every automorphism. For example, in $(\R,<)$ the only subsets of $\R$ definable without parameters are $\varnothing$ and $\R$, and the relation $y = 2x$ is not definable.`,
      idea: String.raw`Apply logic-3.8 to the isomorphism $h:\mathfrak A\to\mathfrak A$. If $\varphi(\bar x, \bar b)$ defines $R$, then $\mathfrak A \models \varphi[\bar a, \bar b]$ iff $\mathfrak A \models \varphi[h\bar a, h\bar b] = \varphi[h\bar a, \bar b]$. This is the standard tool for proving that something is *not* definable: exhibit an automorphism that moves it. Every increasing bijection of $\R$ is an automorphism of $(\R,<)$, and any point can be moved to any other, so no proper non-empty subset is invariant. Fixing the parameter $0$ leaves $(-\infty,0)$, $\{0\}$, $(0,\infty)$ and their unions as the only invariant sets.`,
      caption: String.raw`Drag the five handles to shape an increasing bijection $h$ of $\R$; it is linear between the handles and has slope 1 outside. Pick a candidate set or relation. For a set $S$, the right panel shows $S$ (top line) and its image $h[S]$ (bottom line), with sample points joined to their images. For a relation, the right panel shows $R$ in blue and $(h\times h)[R]$ in orange. If $h$ moves the candidate, it is not definable. Turn on **fix the parameter 0**: the handle at $0$ is pinned, and $x>0$ (definable as $0 < x$) can no longer be moved, but $[-1,1]$ and $y = 2x$ still can.`,
      deps: ['logic-3.8', 'logic-3.6'],
      refs: ['Enderton §2.2'],
      tags: ['definability', 'automorphisms'],
      viz(v) {
        const cand = v.select('candidate', [{ value: 'pos', label: 'x > 0' }, { value: 'int', label: '[−1, 1]' }, { value: 'zero', label: '{0}' }, { value: 'all', label: 'ℝ' }, { value: 'lt', label: 'x < y' }, { value: 'dbl', label: 'y = 2x' }], 'pos');
        const par = v.toggle('fix the parameter 0', false, { onChange: (on) => { if (on) H[2].set(0, 0); } });
        const S = v.stage({ x: [-3, 3], y: [-3, 3], axes: 'box', gutter: true, height: 320, title: 'the automorphism h of (ℝ, <)', xlabel: 'x', ylabel: 'h(x)' });
        const P = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: false, height: 320, title: 'the candidate and its image' });
        const xs = [-2, -1, 0, 1, 2], y0 = [-2.3, -1.6, 0.6, 1.3, 2.2];
        const H = xs.map((x, i) => S.handle(x, y0[i], {
          color: i === 2 ? 'gold' : 'accent', constrain: (_, y) => {
            if (i === 2 && par.value) return [0, 0];
            const lo = i > 0 ? H[i - 1].y + 0.08 : -2.9, hi = i < 4 ? H[i + 1].y - 0.08 : 2.9;
            return [x, Math.max(lo, Math.min(hi, y))];
          },
        }));
        const f = (x) => {
          if (x <= -2) return H[0].y + (x + 2);
          if (x >= 2) return H[4].y + (x - 2);
          const i = Math.min(3, Math.floor(x + 2)), t = x + 2 - i;
          return H[i].y + t * (H[i + 1].y - H[i].y);
        };
        const finv = (y) => { let lo = -40, hi = 40; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
        const UNARY = { pos: [[0, Infinity, false]], int: [[-1, 1, true]], zero: [[0, 0, true]], all: [[-Infinity, Infinity, false]] };
        const verdict = () => {
          const c = cand.value;
          if (UNARY[c]) {
            const [lo, hi] = UNARY[c][0];
            const flo = Number.isFinite(lo) ? f(lo) : lo, fhi = Number.isFinite(hi) ? f(hi) : hi;
            const moved = Math.max(Number.isFinite(lo) ? Math.abs(flo - lo) : 0, Number.isFinite(hi) ? Math.abs(fhi - hi) : 0);
            return { unary: true, lo, hi, flo, fhi, moved, same: moved < 1e-9 };
          }
          // relations: sample along R and measure distance of the image from R
          let dev = 0, worst = null;
          for (let t = -2.5; t <= 2.5; t += 0.05) {
            if (c === 'dbl') { const p = [f(t), f(2 * t)], d = Math.abs(p[1] - 2 * p[0]) / Math.sqrt(5); if (Math.abs(t) < 1.5 && d > dev) { dev = d; worst = t; } }
          }
          return { unary: false, dev, worst, same: c === 'lt' || dev < 1e-9 };
        };
        v.render(() => {
          const c = cand.value, V = verdict();
          S.line(-3, -3, 3, 3, { color: 'faint', width: 1, dash: [4, 4] });
          S.fn(f, { color: 'accent', width: 2.4, n: 300 });
          if (V.unary) {
            const band = (lo, hi, col, axis, w) => {
              const a = Math.max(-3, lo), b = Math.min(3, hi);
              const e = -2.86;
              if (axis === 'x') { if (a === b) S.dot(a, e, { r: 5, color: col }); else S.line(a, e, b, e, { color: col, width: w }); }
              else if (a === b) S.dot(e, a, { r: 5, color: col }); else S.line(e, a, e, b, { color: col, width: w });
            };
            band(V.lo, V.hi, 'accent', 'x', 7);
            band(V.lo, V.hi, 'accent', 'y', 7);
            band(V.flo, V.fhi, 'orange', 'y', 3.5);
            for (const e of [V.lo, V.hi]) if (Number.isFinite(e) && Math.abs(e) <= 3) { S.line(e, -2.86, e, f(e), { color: 'orange', width: 1, dash: [3, 3] }); S.line(e, f(e), -2.86, f(e), { color: 'orange', width: 1, dash: [3, 3] }); }
            // bottom panel: number lines
            P.setView([-3, 3], [-1.5, 1.5]);
            const seg = (lo, hi, y, col, w, al) => { const a = Math.max(-3, lo), b = Math.min(3, hi); if (a === b) P.dot(a, y, { r: w > 6 ? 7 : 4.5, color: col, alpha: al }); else P.line(a, y, b, y, { color: col, width: w, alpha: al }); };
            P.line(-3, 0.8, 3, 0.8, { color: 'grid', width: 1.5 }); P.line(-3, -0.8, 3, -0.8, { color: 'grid', width: 1.5 });
            for (let k = -2; k <= 2; k++) for (const yy of [0.8, -0.8]) { P.line(k, yy - 0.07, k, yy + 0.07, { color: 'muted', width: 1 }); }
            for (let k = -2; k <= 2; k++) P.text(String(k).replace('-', '−'), k, -1.08, { align: 'center', size: 10, color: 'muted' });
            seg(V.lo, V.hi, 0.8, 'accent', 8, 0.75); seg(V.lo, V.hi, -0.8, 'accent', 12, 0.28); seg(V.flo, V.fhi, -0.8, 'orange', 5, 0.95);
            for (let t = -2.75; t <= 2.76; t += 0.5) { const inS = t >= V.lo && t <= V.hi && (V.lo !== V.hi || t === V.lo); const ft = f(t); if (Math.abs(ft) <= 3) P.arrow(t, 0.66, ft, -0.66, { color: inS ? 'orange' : 'faint', width: inS ? 1.4 : 1, head: 5 }); }
            if (V.lo === V.hi) P.arrow(V.lo, 0.66, V.flo, -0.66, { color: 'orange', width: 1.8, head: 6 });
            P.text('S', -2.9, 1.15, { size: 12, color: 'accent', weight: 700 });
            P.text('h[S] (orange) over S (pale blue)', -2.9, -1.35, { size: 12, color: 'orange', weight: 700 });
          } else {
            P.setView([-3.4, 3.2], [-3.4, 3.2]);
            for (let k = -3; k <= 3; k++) { P.line(k, -3, k, 3, { color: 'grid', width: 1 }); P.line(-3, k, 3, k, { color: 'grid', width: 1 }); P.text(String(k).replace('-', '−'), k, -3.22, { align: 'center', size: 10, color: 'muted' }); P.text(String(k).replace('-', '−'), -3.12, k, { align: 'right', baseline: 'middle', size: 10, color: 'muted' }); }
            if (c === 'lt') {
              P.poly([[-3, -3], [3, 3], [-3, 3]], { fill: 'accent', fillAlpha: 0.14, stroke: false });
              P.line(-3, -3, 3, 3, { color: 'accent', width: 1.5, dash: [5, 4] });
              for (let a = -2.5; a <= 2.6; a += 0.5) for (let b = -2.5; b <= 2.6; b += 0.5) if (a < b) { const p = [f(a), f(b)]; if (Math.abs(p[0]) < 3 && Math.abs(p[1]) < 3) P.dot(p[0], p[1], { r: 2.6, color: 'orange' }); }
              P.text('images (h(a), h(b)) of sample pairs a < b', 2.9, -2.7, { size: 11, color: 'orange', align: 'right' });
            } else {
              P.clip(() => P.fn((x) => 2 * x, { color: 'accent', width: 2.4 }), [-3, 3], [-3, 3]);
              P.clip(() => P.curve((t) => [f(t), f(2 * t)], -3, 3, { color: 'orange', width: 2.4, n: 300 }), [-3, 3], [-3, 3]);
              if (V.worst != null) { const t = V.worst; P.dot(t, 2 * t, { r: 4.5, color: 'accent' }); P.arrow(t, 2 * t, f(t), f(2 * t), { color: 'red', width: 1.6, head: 6 }); P.dot(f(t), f(2 * t), { r: 4.5, color: 'orange' }); }
            }
          }
          if (par.value) S.corner('h(0) = 0 is pinned', 'br', { size: 11, color: 'gold' });
        });
        v.legend([['accent', 'candidate set / relation'], ['orange', 'its image under h']]);
        v.readout(() => {
          const c = cand.value, V = verdict(), p0 = par.value;
          const fx = (x) => v.fix(x, 2);
          if (V.unary) {
            if (V.same) {
              const why = c === 'all' ? 'ℝ is definable (by $x = x$)' : p0 && c === 'pos' ? 'with the parameter 0 fixed, $0 < x$ defines it' : p0 && c === 'zero' ? 'with the parameter 0 fixed, $x = 0$ defines it' : 'this particular $h$ happens to fix it — drag a handle';
              return `$h[S] = S$ ✓: ${why}.`;
            }
            const e = Number.isFinite(V.lo) && Math.abs(V.flo - V.lo) > 1e-9 ? V.lo : V.hi, fe = e === V.lo ? V.flo : V.fhi;
            return `$h$ moves $S$: the endpoint ${fx(e)} goes to ${fx(fe)}, so $h[S] \\ne S$. Since $h$ is an automorphism of $(\\R,<)$${p0 ? ' fixing 0' : ''}, **$S$ is not definable${p0 ? ' with the parameter 0' : ' without parameters'}**.`;
          }
          if (c === 'lt') return `$(h\\times h)[\\{x<y\\}] = \\{x<y\\}$ ✓ for every increasing $h$: the order itself is definable (it is the relation symbol).`;
          if (V.same) return 'This $h$ is linear through 0 and fixes $y = 2x$; drag a handle off the line to move it.';
          const t = V.worst;
          return `The pair $(${fx(t)}, ${fx(2 * t)})$ lies on $y = 2x$ but its image $(${fx(f(t))}, ${fx(f(2 * t))})$ is off by ${fx(V.dev)}, so $(h\\times h)[R] \\ne R$ and **$y = 2x$ is not definable in $(\\R,<)$**${p0 ? ', even with the parameter 0' : ''}. (With $+$ in the language it would be: $y = x + x$.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Substructures and elementary substructures',
      statement: String.raw`$\mathfrak A$ is a **substructure** of $\mathfrak B$, written $\mathfrak A \subseteq \mathfrak B$, if $|\mathfrak A| \subseteq |\mathfrak B|$ and the symbols of $\mathfrak A$ are the restrictions of those of $\mathfrak B$: $c^{\mathfrak A} = c^{\mathfrak B}$, $f^{\mathfrak A} = f^{\mathfrak B}\restriction|\mathfrak A|^n$, and $R^{\mathfrak A} = R^{\mathfrak B}\cap|\mathfrak A|^n$. It is an **elementary substructure**, $\mathfrak A \preceq \mathfrak B$, if moreover
$$\mathfrak A \models \varphi[a_1,\dots,a_k] \iff \mathfrak B \models \varphi[a_1,\dots,a_k]$$
for every formula $\varphi$ and all $a_1,\dots,a_k \in |\mathfrak A|$. Quantifier-free formulas always transfer between a substructure and the whole; elementarity asks the same of every formula.`,
      idea: String.raw`A substructure agrees with $\mathfrak B$ on atomic facts about its own elements. A quantifier, though, ranges over the whole universe, so a question asked with parameters from $\mathfrak A$ can have a witness in $\mathfrak B$ that $\mathfrak A$ lacks. In $\N \subseteq \Z$, $\exists y\,(y<0)$ fails in $\N$ and holds in $\Z$. In $2\Z \subseteq \Z$, $\exists y\,(0<y<2)$ separates them, although $2\Z \cong \Z$, so elementarity is a property of the embedding and not of the two structures. In $\Q \subseteq \R$ every formula transfers. Here formulas are evaluated exactly: in a discrete order a quantifier of rank $r$ only needs candidates within distance $2^r$ of the current values, and in a dense order the current values, the midpoints between them and one point beyond each end are enough. Both facts come from the Ehrenfeucht–Fraïssé analysis of logic-3.7.`,
      caption: String.raw`Pick a pair $\mathfrak A \subseteq \mathfrak B$. The top line is $\mathfrak B$, with the elements of $\mathfrak A$ filled in. The bottom line is $\mathfrak A$ on its own, with dashed lines for the inclusion map. Drag the parameters $a$ and $b$ (gold), which always stay inside $\mathfrak A$, type a formula in $a$, $b$, or press **next example**. The formula is evaluated in both structures, and for an $\exists$ the witness found in each is marked green. A red verdict means the two disagree, so $\mathfrak A$ is not an elementary substructure.`,
      deps: ['logic-3.7'],
      refs: ['Enderton §2.6'],
      tags: ['substructures', 'elementary'],
      viz(v) {
        const EX = ['∃y (y < a)', '∃y (a < y ∧ y < b)', '∀y (a < y → ∃z (a < z ∧ z < y))', '∃y∀z (y < z ∨ y = z)', '∃y (y < a ∧ ∃z (z < y))'];
        let exI = 0;
        const pair = v.select('pair', [{ value: 'NZ', label: 'ℕ ⊆ ℤ' }, { value: 'EZ', label: '2ℤ ⊆ ℤ' }, { value: 'QR', label: 'ℚ ⊆ ℝ' }], 'NZ', { onChange: () => { ha.set(PAIRS[pair.value].snap(ha.x), yA); hb.set(PAIRS[pair.value].snap(hb.x), yA); } });
        const fld = foField(v, 'φ(a, b)', EX[0], { width: 280, sig: { name: 'the language of orders', rels: { '<': 2 }, funcs: {}, consts: [] }, check: (a) => (freeVars(a).some((x) => x !== 'a' && x !== 'b') ? 'only a and b may be free' : qrank(a) > 3 ? 'keep the quantifier rank at most 3 here' : null) });
        v.button('next example', () => { exI = (exI + 1) % EX.length; fld.set(EX[exI]); });
        const S = v.stage({ x: [-6.6, 6.6], y: [-0.98, 2.45], axes: false, height: 266, full: true });
        const yB = 1.6, yA = 0.05;
        const ha = S.handle(0, yA, { color: 'gold', label: 'a', labelPos: 'n', constrain: (x) => [PAIRS[pair.value].snap(x), yA] });
        const hb = S.handle(3, yA, { color: 'gold', label: 'b', labelPos: 'n', constrain: (x) => [PAIRS[pair.value].snap(x), yA] });
        const posA = (x) => PAIRS[pair.value].pos(x);
        const evalBoth = () => {
          const P = PAIRS[pair.value], MB = orderStruct(P.big), MA = orderStruct(P.small), env = { a: P.val(ha.x), b: P.val(hb.x) };
          if (!fld.ast) return { P, env };
          const vb = holds(fld.ast, MB, env), va = holds(fld.ast, MA, env);
          const wB = explainLine(fld.ast, MB, env).find((l) => l.role !== 'all'), wA = explainLine(fld.ast, MA, env).find((l) => l.role !== 'all');
          return { P, vb, va, wB, wA, env };
        };
        v.render(() => {
          const P = PAIRS[pair.value], dense = pair.value === 'QR';
          // the big structure
          S.line(-6.4, yB, 6.4, yB, { color: 'muted', width: 1.5 });
          S.tex(`\\mathfrak B = (${P.bigTex}, <)`, -6.5, yB + 0.55, { align: 'left', size: 14, color: 'muted' });
          S.tex(`\\mathfrak A = (${P.smallTex}, <)`, -6.5, yA + 0.55, { align: 'left', size: 14, color: 'muted' });
          S.line(-6.4, yA, 6.4, yA, { color: 'muted', width: 1.5 });
          if (dense) {
            S.line(-6.4, yB, 6.4, yB, { color: 'accent', width: 4, alpha: 0.35 });
            for (let k = -24; k <= 24; k++) S.dot(k / 4, yB, { r: 2.2, color: 'accent' });
            for (let k = -24; k <= 24; k++) S.dot(k / 4, yA, { r: 2.2, color: 'accent' });
            S.text('rationals: a dense subset of the line', -6.4, yA - 0.45, { align: 'left', size: 11, color: 'muted' });
            for (let k = -6; k <= 6; k++) { S.text(String(k).replace('-', '−'), k, yB - 0.35, { align: 'center', size: 10.5, color: 'muted' }); }
          } else {
            for (let k = -6; k <= 6; k++) {
              const inA = P.member(k);
              S.dot(k, yB, { r: 5.5, color: inA ? 'accent' : 'muted', hollow: !inA, width: 1.4 });
              S.text(String(k).replace('-', '−'), k, yB - 0.38, { align: 'center', size: 10.5, color: inA ? 'ink' : 'muted' });
              if (inA) S.line(k, yB - 0.12, posA(k), yA + 0.12, { color: 'faint', width: 1, dash: [3, 3] });
            }
            for (let p = -6; p <= 6; p++) {
              const x = P.val(p); if (!P.member(x)) continue;
              S.dot(p, yA, { r: 5.5, color: 'accent' });
              S.text(String(x).replace('-', '−'), p, yA - 0.38, { align: 'center', size: 10.5, color: 'ink' });
            }
          }
          const R = evalBoth(), env = R.env;
          // parameter markers on the big line
          for (const [nm, val] of [['a', env.a], ['b', env.b]]) { S.dot(val, yB, { r: 9, color: 'gold', hollow: true, width: 2.5 }); S.text(nm, val, yB + 0.42, { align: 'center', size: 12, weight: 700, color: 'gold', math: true }); }
          if (!fld.ast) { S.corner(fld.error || '', 'tr', { color: 'red', size: 11 }); return; }
          const mark = (w, y, x0) => { if (!w || w.d === undefined) return; const X = x0(w.d); if (Math.abs(X) > 6.5) { S.text(`${w.role} ${w.x} = ${fmtQ(w.d)} (off screen)`, 6.4, y + 0.5, { align: 'right', size: 11, color: 'green' }); return; } S.dot(X, y, { r: 6.5, color: w.role === 'witness' ? 'green' : 'red' }); S.text(`${w.x}`, X, y + 0.36, { align: 'center', size: 12, weight: 700, color: w.role === 'witness' ? 'green' : 'red', math: true }); };
          mark(R.wB, yB, (d) => d);
          mark(R.wA, yA, posA);
          const agree = R.va === R.vb;
          S.corner(`𝔅 ⊨ φ[a,b]: ${TF(R.vb)}    𝔄 ⊨ φ[a,b]: ${TF(R.va)}`, 'br', { size: 12.5, weight: 700, color: agree ? 'green' : 'red' });
        });
        v.legend([['accent', 'elements of 𝔄', { dot: true }], ['gold', 'parameters a, b', { dot: true }], ['green', 'witness', { dot: true }], ['red', 'counterexample', { dot: true }]]);
        v.readout(() => {
          const R = evalBoth(); if (!fld.ast) return fld.error || '';
          const P = R.P, phi = `$${toTex(fld.ast)}$`, par = `$a = ${R.env.a}$, $b = ${R.env.b}$`.replace(/-/g, '−');
          const head = `${phi} with ${par}: true in $${P.bigTex}$? **${TF(R.vb)}**; in $${P.smallTex}$? **${TF(R.va)}**.`;
          if (R.va !== R.vb) return `${head} They disagree, so $(${P.smallTex},<)$ is a substructure but **not an elementary substructure** of $(${P.bigTex},<)$.${P.iso ? ' Yet $2\\Z \\cong \\Z$ by $x\\mapsto x/2$: elementarity is about the inclusion, not the isomorphism type.' : ''}`;
          return `${head} They agree here.${pair.value === 'QR' ? ' For $\\Q\\subseteq\\R$ they always will: $(\\Q,<)\\preceq(\\R,<)$.' : ' Try another formula or move the parameters.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Tarski–Vaught criterion',
      statement: String.raw`Let $\mathfrak A \subseteq \mathfrak B$. Then $\mathfrak A \preceq \mathfrak B$ if and only if for every formula $\varphi(x_1,\dots,x_k,y)$ and all $a_1,\dots,a_k \in |\mathfrak A|$:
$$\text{if } \mathfrak B \models \exists y\,\varphi[\bar a] \text{ then } \mathfrak B \models \varphi[\bar a, b] \text{ for some } b \in |\mathfrak A|.$$
The test refers only to truth in $\mathfrak B$: whenever $\mathfrak B$ has a witness for a question asked with parameters from $\mathfrak A$, it must also have one inside $\mathfrak A$.`,
      idea: String.raw`The forward direction is immediate: if $\mathfrak A \preceq \mathfrak B$ and $\mathfrak B \models \exists y\,\varphi[\bar a]$, then $\mathfrak A$ satisfies the same, which gives a witness in $\mathfrak A$, and it works in $\mathfrak B$ by elementarity again. Conversely, prove $\mathfrak A \models \psi[\bar a] \iff \mathfrak B \models \psi[\bar a]$ by induction on $\psi$. Atomic formulas hold because $\mathfrak A$ is a substructure (logic-3.10), connectives are routine, and the step for $\exists y$ is exactly the criterion. For $(\Q,<)$ the test simplifies further: every formula is equivalent to a quantifier-free one (logic-5.7), so it is enough to ask whether $\mathfrak A$ has a point in every gap that the parameters cut out of $\Q$.`,
      caption: String.raw`The line is $(\Q,<)$, and the blue set is the candidate $\mathfrak A$. Drag the three parameters (gold, snapped into $\mathfrak A$). They cut the line into cells, and each cell is an existential question “$\exists y$ in this cell?”. $\mathfrak B = \Q$ always has a witness. The cell turns green when $\mathfrak A$ has one too and red when it does not. The table lists each question with both witnesses, and the readout reports the first failure found by scanning all parameter pairs on a grid in $\mathfrak A$. Note that $\Q\setminus\{0\}$ passes although a point is missing, while $\Q\cap[0,2]$ fails at its endpoints.`,
      deps: ['logic-3.10'],
      see: ['logic-5.7', 'logic-5.1'],
      refs: ['Enderton §2.6'],
      tags: ['elementary', 'substructures'],
      credit: 'Tarski & Vaught, 1957',
      viz(v) {
        const sub = v.select('candidate 𝔄 ⊆ (ℚ, <)', Object.entries(SUBS).map(([k, s]) => ({ value: k, label: s.label })), 'closed', { onChange: () => H.forEach((h) => h.set(snapA(SUBS[sub.value], h.x), 0)) });
        const S = v.stage({ x: [-3.2, 4.2], y: [-0.85, 1.05], axes: false, height: 170, full: true });
        const T = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 205, full: true });
        const TB = v.table(T, { rows: 7, cols: 3, square: false, maxCell: 27, cellAspect: 4.2, size: 12.5, labelSize: 12, colLabels: ['witness in 𝔅 = ℚ', 'witness in 𝔄', 'verdict'], colWeights: [1, 1, 0.7] });
        const H = [0, 1, 2].map((i) => S.handle([0, 1, 2][i], 0, { color: 'gold', label: `a${'₁₂₃'[i]}`, labelPos: 'n', constrain: (x) => [snapA(SUBS[sub.value], Math.max(-3, Math.min(4, x))), 0] }));
        const cells = () => {
          const A = SUBS[sub.value], ps = [...new Set(H.map((h) => h.x))].sort((a, b) => a - b), bounds = [-Infinity, ...ps, Infinity], out = [];
          for (let i = 0; i + 1 < bounds.length; i++) {
            const l = bounds[i], r = bounds[i + 1];
            const wB = Number.isFinite(l) && Number.isFinite(r) ? (l + r) / 2 : Number.isFinite(l) ? l + 1 : Number.isFinite(r) ? r - 1 : 0;
            out.push({ l, r, wB, wA: meet(A, l, r) });
          }
          return { ps, out };
        };
        let scan = { key: null };
        const doScan = () => {
          if (scan.key === sub.value) return scan;
          const A = SUBS[sub.value], grid = []; for (let g = -24; g <= 32; g++) { const c = g / 8; if (inA(A, c)) grid.push(c); }
          let first = null, tested = 0;
          outer: for (let i = 0; i < grid.length; i++) for (let j = i; j < grid.length; j++) {
            const ps = [...new Set([grid[i], grid[j]])], bounds = [-Infinity, ...ps, Infinity];
            for (let k = 0; k + 1 < bounds.length; k++) { tested++; if (meet(A, bounds[k], bounds[k + 1]) == null) { first = { ps, l: bounds[k], r: bounds[k + 1] }; break outer; } }
          }
          scan = { key: sub.value, first, tested, grid: grid.length };
          return scan;
        };
        const qTex = (l, r) => (Number.isFinite(l) && Number.isFinite(r) ? `\\exists y\\,(${fmtQ(l)} < y < ${fmtQ(r)})` : Number.isFinite(l) ? `\\exists y\\,(${fmtQ(l)} < y)` : Number.isFinite(r) ? `\\exists y\\,(y < ${fmtQ(r)})` : '\\exists y\\,(y = y)');
        v.render(() => {
          const A = SUBS[sub.value], C = cells();
          S.line(-3.2, 0, 4.2, 0, { color: 'muted', width: 1.5 });
          for (let k = -3; k <= 4; k++) { S.line(k, -0.06, k, 0.06, { color: 'muted', width: 1 }); S.text(String(k).replace('-', '−'), k, -0.32, { align: 'center', size: 11, color: 'muted' }); }
          // cells
          C.out.forEach((c) => { const a = Math.max(-3.2, c.l), b = Math.min(4.2, c.r); S.rect(a, -0.62, b, 0.62, { fill: c.wA == null ? 'red' : 'green', fillAlpha: 0.1, stroke: false }); });
          // the set A
          if (A.ints) for (let k = -3; k <= 4; k++) S.dot(k, 0, { r: 5.5, color: 'accent' });
          else for (const [p, q, pc, qc] of A.pieces) {
            const a = Math.max(-3.2, p), b = Math.min(4.2, q);
            S.line(a, 0, b, 0, { color: 'accent', width: 7, alpha: 0.75 });
            if (Number.isFinite(p)) S.dot(p, 0, { r: 5, color: 'accent', hollow: !pc, width: 2 });
            if (Number.isFinite(q)) S.dot(q, 0, { r: 5, color: 'accent', hollow: !qc, width: 2 });
          }
          for (const e of A.except || []) S.dot(e, 0, { r: 5, color: 'accent', hollow: true, width: 2 });
          // witnesses
          C.out.forEach((c) => {
            if (Math.abs(c.wB) <= 4.1) S.text('b', c.wB, 0.42, { align: 'center', size: 11, color: 'muted', math: true });
            if (c.wA != null && Math.abs(c.wA) <= 4.1) S.dot(c.wA, 0, { r: 4, color: 'green' });
          });
          S.corner('green cell: 𝔄 meets it · red cell: 𝔅 has a witness there, 𝔄 has none', 'bl', { size: 11 });
          TB.draw({
            rows: C.out.length, rowLabels: C.out.map((c) => `$${qTex(c.l, c.r)}$`),
            value: (i, j) => { const c = C.out[i]; return j === 0 ? fmtQ(c.wB) : j === 1 ? (c.wA == null ? '—' : fmtQ(c.wA)) : c.wA == null ? 'fails' : 'passes'; },
            fill: (i, j) => (j === 2 ? [C.out[i].wA == null ? 'red' : 'green', 0.25] : null),
            textColor: (i, j) => (j === 2 ? (C.out[i].wA == null ? 'red' : 'green') : null),
          });
        });
        v.readout(() => {
          const A = SUBS[sub.value], C = cells(), sc = doScan(), bad = C.out.filter((c) => c.wA == null);
          const here = bad.length ? `With these parameters the test **fails**: $\\Q$ answers $${qTex(bad[0].l, bad[0].r)}$ with $${fmtQ(bad[0].wB)}$, and $${A.tex}$ has no witness.` : 'With these parameters every question has a witness in $\\mathfrak A$.';
          const glob = sc.first ? `Scanning all pairs of parameters from $\\mathfrak A \\cap \\tfrac18\\Z$ (${sc.grid} points), the first failure is at $${sc.first.ps.map(fmtQ).join(', ')}$: **$${A.tex} \\not\\preceq \\Q$**.` : `Scanning all ${sc.tested.toLocaleString('en')} gap questions over parameter pairs from $\\mathfrak A\\cap\\tfrac18\\Z$ finds no failure. Every gap between points of $\\mathfrak A$ contains a point of $\\mathfrak A$, and there is no first or last point, so the criterion holds for all parameters: **$${A.tex} \\preceq \\Q$**.`;
          return `${here} ${glob}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Theorem',
      name: 'Prenex normal form',
      statement: String.raw`Every formula $\varphi$ is logically equivalent to a formula in **prenex normal form**
$$Q_1 x_1\, Q_2 x_2 \cdots Q_n x_n\ \psi, \qquad Q_i \in \{\forall, \exists\},$$
where $\psi$ is quantifier-free, and the prenex formula has the same free variables as $\varphi$. One can be found by the rules
$$\neg\forall x\,\alpha \equiv \exists x\,\neg\alpha,\quad (\forall x\,\alpha)\land\beta \equiv \forall x\,(\alpha\land\beta),\quad (\forall x\,\alpha)\to\beta \equiv \exists x\,(\alpha\to\beta),\quad \beta\to\forall x\,\alpha \equiv \forall x\,(\beta\to\alpha),$$
their duals with $\exists$ and $\lor$, valid whenever $x$ does not occur free in $\beta$. Renaming bound variables (logic-3.2) always makes that side condition true.`,
      idea: String.raw`Each rule is a logical equivalence (logic-3.5): for instance $(\forall x\,\alpha)\to\beta$ fails iff $\alpha$ holds for all $x$ and $\beta$ fails, iff $\exists x\,(\alpha\to\beta)$ fails, provided $\beta$ does not depend on $x$. Since equivalence is preserved by replacing a subformula with an equivalent one, applying the rules anywhere is safe, and each application moves a quantifier one step towards the root, so the process ends. Two things can go wrong when doing this by hand: pulling a quantifier across a side where its variable is free, which captures it, and forgetting that a quantifier in the antecedent of $\to$ changes from $\forall$ to $\exists$ or back.`,
      caption: String.raw`Type a formula (↔ is expanded first) and step through the rewriting. The highlighted rule in the panel is the one used at each step. The tree shows the current formula, with the quantifier prefix in gold. Every intermediate formula is compared with the original on all structures with up to 3 elements under every assignment, and the strip along the bottom turns red at the first step that is not an equivalence. Choose **skip renaming** or **forget the flip** to make one of the two classic mistakes. The checker then prints the structure in which the step changes the truth value.`,
      deps: ['logic-3.5', 'logic-3.2'],
      refs: ['Enderton §2.4'],
      tags: ['normal forms', 'syntax'],
      viz(v) {
        const mode = v.select('rewriting', [{ value: 'correct', label: 'correct' }, { value: 'norename', label: 'skip renaming' }, { value: 'noflip', label: 'forget the flip' }], 'correct', { onChange: () => S.reset(null, { at: 'end' }) });
        const fld = foField(v, 'formula', '∀x E(x,y) → ∃y (E(y,x) ∧ ¬∀x E(x,x))', { width: 330, onChange: () => S.reset(null, { at: 'end' }) });
        const strip = v.stage({ x: [0, 10], y: [0, 2], axes: false, height: 96, full: true });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300 });
        let steps = [], checks = [];
        const build = () => {
          steps = prenexSteps(fld.ast, mode.value);
          checks = steps.map((st) => equivalent(fld.ast, st.ast, { maxN: 3, cap: 600 }));
          return steps.map((st, i) => ({ i, line: st.line || [], note: i === 0 ? 'the formula as typed' : `${st.note}${checks[i].ok ? ' — still equivalent ✓' : ' — **no longer equivalent ✗**'}` }));
        };
        const S = v.steps({
          frames: build, start: 'end', still: 'end', speed: 1.2,
          code: ['expand α ↔ β into (α → β) ∧ (β → α)', '¬∀x α ⇒ ∃x ¬α   and   ¬∃x α ⇒ ∀x ¬α', '(Qx α) □ β ⇒ Qx (α □ β),  β □ (Qx α) ⇒ Qx (β □ α)   (□ ∈ ∧ ∨ →, Qx on the right of →)', '(∀x α) → β ⇒ ∃x (α → β)   and   (∃x α) → β ⇒ ∀x (α → β)', 'side condition: x not free in β — otherwise rename the bound x first'],
          codeTitle: 'prenex rewriting rules', codePos: 'side',
        });
        v.render(() => {
          const i = S.frame.i ?? steps.length - 1, st = steps[i], ok = checks[i];
          const L = layoutFO(st.ast), prefix = new Set(); let n = st.ast; while (isQ(n)) { prefix.add(n.id); n = n.a; }
          fitFO(T, L, { minW: 5 });
          drawFO(T, L, {
            fill: (nd) => (prefix.has(nd.e.id) ? 'gold' : isQ(nd.e) ? 'orange' : nd.e.op === 'rel' ? 'accent' : null),
          });
          T.corner(isPrenex(st.ast) ? 'prenex ✓' : `${preorder(st.ast).filter(isQ).length - prefix.size} quantifier(s) still inside`, 'bl', { size: 11.5, color: isPrenex(st.ast) ? 'green' : 'muted' });
          // strip: the formula and a timeline of the steps
          strip.tex(toTex(st.ast), 5, 1.45, { align: 'center', size: steps.length && toStr(st.ast).length > 60 ? 13 : 15, color: ok.ok ? 'ink' : 'red' });
          const m = steps.length, w = Math.min(0.55, 9 / Math.max(m, 1));
          steps.forEach((_, k) => {
            const x = 5 + (k - (m - 1) / 2) * w, c = checks[k].ok ? 'green' : 'red';
            strip.dot(x, 0.45, { r: k === i ? 7 : 4.5, color: c, hollow: k > i, width: 1.6 });
          });
          strip.text(`step ${i} of ${m - 1}`, 9.9, 0.45, { align: 'right', baseline: 'middle', size: 11, color: 'muted' });
        });
        v.readout(() => {
          const i = S.frame.i ?? steps.length - 1, ok = checks[i], firstBad = checks.findIndex((c) => !c.ok);
          const final = steps[steps.length - 1].ast, pre = []; let n = final; while (isQ(n)) { pre.push((n.op === 'all' ? '\\forall ' : '\\exists ') + n.v); n = n.a; }
          const head = `Prenex form after ${steps.length - 1} steps: prefix $${pre.join('\\,') || '\\text{(none)}'}$, free variables ${freeVars(final).map((x) => `$${x}$`).join(', ') || 'none'} (originally ${freeVars(fld.ast).map((x) => `$${x}$`).join(', ') || 'none'}).`;
          if (firstBad < 0) return `${head} Every step is an equivalence ✓ (each checked on ${checks[1] ? checks[1].tested.toLocaleString('en') : checks[0].tested.toLocaleString('en')} structure–assignment pairs with at most 3 elements).`;
          const c = checks[firstBad].counter, E = [];
          for (let a = 0; a < c.M.n; a++) for (let b = 0; b < c.M.n; b++) if (c.M.rel('E', [a, b])) E.push(`(${a},${b})`);
          return `${head} **Step ${firstBad} is wrong:** in the ${c.n}-element structure with $E = \\{${E.join(',')}\\}$ and ${Object.entries(c.env).map(([x, d]) => `$${x}=${d}$`).join(', ') || 'no free variables'}, the original is ${TF(c.a)} but the rewritten formula is ${TF(c.b)}.${ok.ok ? '' : ' (The formula shown is not equivalent to the original either.)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Definition',
      name: 'Theories, axioms and their models',
      statement: String.raw`A **theory** is a set $T$ of sentences closed under logical implication: if $T \models \sigma$ then $\sigma \in T$. A set $\Sigma$ of sentences **axiomatizes** the theory $\mathrm{Cn}\,\Sigma = \{\sigma : \Sigma \models \sigma\}$. A **model** of $\Sigma$ is a structure satisfying every sentence of $\Sigma$; $\mathrm{Mod}\,\Sigma$ is the class of its models. Conversely, every structure $\mathfrak A$ has its complete theory $\mathrm{Th}\,\mathfrak A = \{\sigma : \mathfrak A \models \sigma\}$. For example, the axioms of strict linear orders that are dense and have no endpoints axiomatize the theory DLO, whose countable model is $(\Q,<)$.`,
      idea: String.raw`Axioms carve a class of structures out of all structures for the language, and logical consequence (logic-3.5) is exactly what holds throughout that class. Adding axioms shrinks $\mathrm{Mod}$ and enlarges $\mathrm{Cn}$. Some axiom sets have no finite models at all. A dense strict linear order with at least two points has a point between any two, so it is infinite, and the counts below show this directly for small sizes. Questions about $\mathrm{Mod}\,\Sigma$ for finite sizes can be settled by counting, while questions about the infinite models need the theorems of chapters 4 and 5.`,
      caption: String.raw`Switch axioms on and off, and draw a relation $<$ on the left (click a point, then another; the same point twice for a loop). Each active axiom is checked on your structure, and the counterexample or failing witness is named. The table counts the models of the active axioms with 1 to 4 elements, by exhaustive search over all $2^{n^2}$ relations, both labelled and up to isomorphism. With all six axioms on, every count is 0: dense linear orders without endpoints have no finite models.`,
      deps: ['logic-3.5'],
      refs: ['Enderton §2.6'],
      tags: ['theories', 'models'],
      viz(v) {
        const on = {};
        const tg = AXIOMS.map((a) => v.toggle(a.name, ['irr', 'tr', 'tot', 'den'].includes(a.id), { onChange: (x) => { on[a.id] = x; } }));
        AXIOMS.forEach((a, i) => { on[a.id] = tg[i].value; });
        const A = v.stage({ x: [-1.45, 1.45], y: [-1.42, 1.42], equal: true, axes: false, height: 330, weight: 1 });
        const B = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 330, weight: 1.1 });
        const E = relEditor(v, A, { n: 3, radius: 0.95, edges: [[0, 1], [1, 2], [0, 2]] });
        const nS = v.slider('points', 1, 6, 3, { int: true, onChange: (k) => E.setN(k) });
        const TB = v.table(B, { rows: 4, cols: 2, square: false, maxCell: 30, cellAspect: 3.8, size: 13, labelSize: 12.5, region: [0, 0, 10, 4.6], colLabels: ['labelled models', 'up to ≅'], cornerLabel: 'size' });
        let memo = { key: null };
        const spectrum = () => {
          const act = AXIOMS.filter((a) => on[a.id]), key = act.map((a) => a.id).join(',');
          if (memo.key === key) return memo;
          const fs = act.map((a) => compile(a.ast)), rows = [];
          for (let n = 1; n <= 4; n++) {
            let lab = 0; const canon = new Set(), P = perms(n);
            for (const { M } of structures({ rels: new Map([['<', 2]]), funcs: new Map(), consts: new Set() }, { minN: n, maxN: n, cap: 70000 })) {
              if (!fs.every((f) => f(M, {}))) continue;
              lab++;
              let best = Infinity;
              for (const p of P) { let code = 0; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (M.rel('<', [a, b])) code += 2 ** (p[a] * n + p[b]); if (code < best) best = code; }
              canon.add(best);
            }
            rows.push({ n, lab, iso: canon.size });
          }
          memo = { key, rows }; return memo;
        };
        v.render(() => {
          const adj = E.adj(), M = graphStruct(E.n, adj), act = AXIOMS.filter((a) => on[a.id]);
          const res = act.map((a) => ({ a, val: holds(a.ast, M), line: explainLine(a.ast, M) }));
          const allOk = res.every((r) => r.val);
          E.G.draw({ nodeRing: E.ring, nodeColor: () => (allOk ? 'green' : null) });
          A.corner(allOk ? 'a model of the active axioms ✓' : 'not a model', 'bl', { size: 11.5, color: allOk ? 'green' : 'red', weight: 700 });
          // axiom checklist
          const rowsY = (k) => 9.4 - k * 0.78;
          if (!act.length) B.text('no axioms: every structure is a model', 5, 8, { align: 'center', size: 12, color: 'muted' });
          res.forEach((r, k) => {
            const y = rowsY(k);
            B.text(r.val ? '✓' : '✗', 0.4, y, { align: 'center', baseline: 'middle', size: 14, weight: 700, color: r.val ? 'green' : 'red' });
            B.text(r.a.name, 0.9, y, { align: 'left', baseline: 'middle', size: 12, weight: 600, color: 'ink' });
            const ce = r.line.filter((l) => l.role !== 'all' && l.d !== undefined).map((l) => `${l.x}=${l.d}`).join(', ');
            B.text(r.val ? '' : ce ? `fails at ${ce}` : 'fails', 4.1, y, { align: 'left', baseline: 'middle', size: 11.5, color: 'red' });
          });
          const S = spectrum();
          TB.draw({ rows: 4, rowLabels: S.rows.map((r) => `n = ${r.n}`), value: (i, j) => String(j ? S.rows[i].iso : S.rows[i].lab), fill: (i) => (S.rows[i].lab ? ['green', 0.18] : ['red', 0.1]) });
        });
        v.readout(() => {
          const S = spectrum(), act = AXIOMS.filter((a) => on[a.id]), adj = E.adj(), M = graphStruct(E.n, adj);
          const fails = act.filter((a) => !holds(a.ast, M));
          const fin = S.rows.filter((r) => r.lab).map((r) => r.n);
          const sp = fin.length ? `It has models of size ${fin.join(', ')} among sizes 1–4 (${S.rows.map((r) => r.iso).join(', ')} up to isomorphism).` : `It has **no models of size 1–4**${act.length === 6 ? ' — and none of any finite size: its models, like $(\\Q,<)$, are infinite' : ''}.`;
          const you = fails.length ? `Your ${E.n}-element structure fails ${fails.map((a) => a.name).join(', ')}.` : `Your ${E.n}-element structure is a model ✓.`;
          return `Axioms: ${act.length ? act.map((a) => `$${toTex(a.ast)}$`).join(', ') : 'none'}. ${sp} ${you}`;
        });
      },
    },
  ],
};
