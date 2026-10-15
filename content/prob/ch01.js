// Durrett, Probability: Theory and Examples (5th ed.) — Chapter 1: Measure Theory (part A: §§1.1–1.2, first half)

// ---------- shared helpers ----------
const ATOMS = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'gray'];
const bitsOf = (m, n) => { const out = []; for (let i = 0; i < n; i++) if ((m >> i) & 1) out.push(i); return out; };
const popc = (m) => { let c = 0; while (m) { c += m & 1; m >>>= 1; } return c; };
const maskOf = (idx) => idx.reduce((m, i) => m | (1 << i), 0);
/** σ-fields on Ω = {1,…,6}, given by their atoms (0-based outcome indices); used by 1.1.1a and 1.2.1a. */
const SIX = [
  { value: 'triv', label: 'trivial', atoms: [[0, 1, 2, 3, 4, 5]] },
  { value: 'par', label: 'odd / even', atoms: [[0, 2, 4], [1, 3, 5]] },
  { value: 'low', label: String.raw`$\{1\},\{2,3\},\{4,5,6\}$`, atoms: [[0], [1, 2], [3, 4, 5]] },
  { value: 'all', label: 'all subsets', atoms: [[0], [1], [2], [3], [4], [5]] },
];
const atomOf = (atoms) => { const a = []; atoms.forEach((E, k) => E.forEach((i) => (a[i] = k))); return a; };
/** every union of atoms, as a bit mask over the outcomes, smallest sets first */
const eventsOf = (atoms) => { const out = []; for (let s = 0; s < 1 << atoms.length; s++) out.push(bitsOf(s, atoms.length).reduce((m, j) => m | maskOf(atoms[j]), 0)); return out.sort((a, b) => popc(a) - popc(b) || a - b); };
const unionOfAtoms = (m, atoms) => atoms.every((E) => { const e = maskOf(E); return (m & e) === 0 || (m & e) === e; });
const setTeX = (m, n = 6) => { const b = bitsOf(m, n); return b.length ? `\\{${b.map((i) => i + 1).join(',')}\\}` : '\\varnothing'; };
/** Mini strip of n cells for a subset (bit mask) of an n-point Ω, centred at (cx, cy) in data units, `w` wide. */
function strip(S, m, cx, cy, w, n, colOf, hgt) {
  const d = w / n, hh = hgt ?? Math.min(d * S.width / S.height, 0.9);
  for (let i = 0; i < n; i++) {
    const x0 = cx - w / 2 + i * d, on = (m >> i) & 1;
    S.rect(x0 + d * 0.06, cy - hh / 2, x0 + d * 0.94, cy + hh / 2, on ? { fill: colOf(i), fillAlpha: 0.85, stroke: false } : { color: 'faint', width: 1 });
  }
}
/** Draw the half-open interval (a, b] at height y; infinite ends become arrows. */
function halfOpen(S, a, b, y, col, st = {}) {
  const [x0, x1] = S.bounds.x, pad = (x1 - x0) * 0.012, lo = Math.max(a, x0 + pad), hi = Math.min(b, x1 - pad), w = st.width ?? 4;
  if (!(hi > lo)) return;
  S.line(lo, y, hi, y, { color: col, width: w, alpha: st.alpha, cap: 'butt' });
  if (a === -Infinity || a < x0) S.arrow(lo + pad * 2, y, lo, y, { color: col, head: 8, width: w * 0.5, alpha: st.alpha });
  else S.dot(a, y, { r: st.r ?? 4, hollow: true, color: col, alpha: st.alpha });
  if (b === Infinity || b > x1) S.arrow(hi - pad * 2, y, hi, y, { color: col, head: 8, width: w * 0.5, alpha: st.alpha });
  else S.dot(b, y, { r: st.r ?? 4, color: col, alpha: st.alpha });
}
const numTeX = (x, d = 2) => (x === Infinity ? '\\infty' : x === -Infinity ? '-\\infty' : (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '-'));
const ivTeX = ([a, b], d = 2) => `(${numTeX(a, d)},\\,${numTeX(b, d)}${b === Infinity ? ')' : ']'}`;
/** Lists of half-open intervals (a, b] (ends may be infinite): pairwise intersections and complements. */
const IV = {
  cap: (P, Q) => { const out = []; for (const [a, b] of P) for (const [c, d] of Q) { const lo = Math.max(a, c), hi = Math.min(b, d); if (lo < hi) out.push([lo, hi]); } return out.sort((x, y) => x[0] - y[0]); },
  comp1: ([a, b]) => [[-Infinity, a], [b, Infinity]].filter(([p, q]) => p < q),
  comp: (P) => P.reduce((acc, S) => IV.cap(acc, IV.comp1(S)), [[-Infinity, Infinity]]),
  tex: (P, d = 2) => (P.length ? P.map((I) => ivTeX(I, d)).join('\\cup') : '\\varnothing'),
};
/** A law on ℝ: continuous part with distribution G (mass G(∞)) and density g, plus atoms [[c, p], …]. */
function mixedLaw(G, g, atoms) {
  const F = (x) => G(x) + atoms.reduce((s, [c, p]) => s + (x >= c ? p : 0), 0);
  const Fm = (x) => G(x) + atoms.reduce((s, [c, p]) => s + (x > c ? p : 0), 0);
  const mass = (a, b, cl = false, cr = true) => Math.max(0, (cr ? F(b) : Fm(b)) - (cl ? Fm(a) : F(a)));
  return { F, Fm, mass, g, G, atoms };
}
/**
 * Editable nondecreasing right-continuous F on a stage: knots {x, lo = F(x−), hi = F(x)}, linear from (x_i, hi_i) to
 * (x_{i+1}, lo_{i+1}) and constant outside. Blue handles set F(x_i); dragging one up opens a jump whose orange partner is F(x_i−).
 * pin01: F(−∞) = 0 and F(∞) = 1 (a distribution function).
 */
function fEditor(v, S, init, { pin01 = false, ymax = 1, gap = 0.2 } = {}) {
  const K = init.map(([x, lo, hi]) => ({ x, lo, hi })), m = K.length - 1;
  const clampX = (i, x) => v.M.clamp(x, i > 0 ? K[i - 1].x + gap : S.bounds.x[0] + 0.1, i < m ? K[i + 1].x - gap : S.bounds.x[1] - 0.1);
  const loMin = (i) => (i > 0 ? K[i - 1].hi : 0), hiMax = (i) => (i < m ? K[i + 1].lo : ymax);
  const sync = () => K.forEach((k, i) => { L[i].x = U[i].x = k.x; L[i].y = k.lo; U[i].y = k.hi; });
  const L = K.map((k, i) => S.handle(k.x, k.lo, { color: 'orange', r: 5.5, constrain: (x, y) => [clampX(i, x), v.M.clamp(y, loMin(i), pin01 && i === 0 ? 0 : hiMax(i))],
    onDrag: (h) => { K[i].x = h.x; K[i].lo = h.y; if (K[i].hi < h.y) K[i].hi = h.y; sync(); } }));
  const U = K.map((k, i) => S.handle(k.x, k.hi, { color: 'accent', r: 6.5, constrain: (x, y) => [clampX(i, x), v.M.clamp(y, pin01 && i === m ? 1 : loMin(i), hiMax(i))],
    onDrag: (h) => { K[i].x = h.x; K[i].hi = h.y; if (K[i].lo > h.y) K[i].lo = h.y; sync(); } }));
  if (pin01) { L[0].visible = false; U[m].visible = false; }
  const F = (x) => { if (x < K[0].x) return K[0].lo; for (let i = 0; i < m; i++) if (x < K[i + 1].x) return K[i].hi + ((K[i + 1].lo - K[i].hi) * (x - K[i].x)) / (K[i + 1].x - K[i].x); return K[m].hi; };
  const Fm = (x) => { for (const k of K) if (x === k.x) return k.lo; return F(x); };
  const dens = (x) => { for (let i = 0; i < m; i++) if (x > K[i].x && x < K[i + 1].x) return (K[i + 1].lo - K[i].hi) / (K[i + 1].x - K[i].x); return 0; };
  const Q = (u) => { // inf{x : F(x) ≥ u}, the generalized inverse of Theorem 1.2.2
    if (u <= K[0].lo) return K[0].x;
    for (let i = 0; i <= m; i++) {
      if (u <= K[i].hi) return K[i].x;
      if (i < m && u <= K[i + 1].lo && K[i + 1].lo > K[i].hi) return K[i].x + ((u - K[i].hi) / (K[i + 1].lo - K[i].hi)) * (K[i + 1].x - K[i].x);
    }
    return K[m].x;
  };
  const jumps = () => K.filter((k) => k.hi - k.lo > 1e-6);
  /** draw F: ramps, open/closed dots at jumps (closed on top: right-continuity), dotted risers */
  const draw = (st = {}) => {
    const [x0, x1] = S.bounds.x, col = st.color || 'ink', rc = st.rightCont !== false;
    S.line(x0, K[0].lo, K[0].x, K[0].lo, { color: col, width: 2.4 });
    for (let i = 0; i < m; i++) S.line(K[i].x, K[i].hi, K[i + 1].x, K[i + 1].lo, { color: col, width: 2.4 });
    S.line(K[m].x, K[m].hi, x1, K[m].hi, { color: col, width: 2.4 });
    for (const k of jumps()) {
      S.line(k.x, k.lo, k.x, k.hi, { color: 'muted', width: 1, dash: [2, 3] });
      S.dot(k.x, rc ? k.lo : k.hi, { r: 4.5, hollow: true, color: rc ? col : 'red' });
      S.dot(k.x, rc ? k.hi : k.lo, { r: 4.5, color: rc ? col : 'red' });
    }
  };
  const set = (init2) => { init2.forEach(([x, lo, hi], i) => Object.assign(K[i], { x, lo, hi })); sync(); v.invalidate(); };
  return { K, F, Fm, Q, dens, jumps, draw, set, sync, handles: [...L, ...U], L, U };
}

export default {
  collection: 'prob',
  chapter: 1,
  title: 'Measure Theory',
  summary: String.raw`Probability rests on measure theory. A probability space is a measure space of total mass one; laws on the line are manufactured from distribution functions by extending $\mu((a,b]) = F(b) - F(a)$ from half-open intervals, first to finite disjoint unions and then to the whole Borel σ-field. Random variables are measurable maps, each with a distribution and a distribution function, and these come in three pure types: absolutely continuous, discrete and singular, the last represented by the Cantor law. Expectation is then built as the Lebesgue integral, starting from simple functions, which gives the working toolkit of Jensen, Hölder, Chebyshev, Fatou, monotone and dominated convergence and the change of variables formula. The chapter ends with product measures and Fubini's theorem.`,
  items: [
    // ------------------------------------------------------------------ 1.1 probability spaces
    {
      num: '1.1.1a',
      kind: 'Definition',
      name: 'Probability space',
      credit: 'Kolmogorov, 1933',
      statement: String.raw`A **probability space** is a triple $(\Omega,\mathcal F,P)$. Here $\Omega$ is a set of outcomes. $\mathcal F$ is a **σ-field** (σ-algebra) of subsets of $\Omega$, the events: a nonempty collection that contains $A^c$ whenever it contains $A$, and contains $\bigcup_i A_i$ for every countable sequence $A_1,A_2,\ldots$ of its members. $P$ is a probability measure on $\mathcal F$.

A **measure** on the measurable space $(\Omega,\mathcal F)$ is a function $\mu:\mathcal F\to[0,\infty]$ with $\mu(\varnothing)=0$ that is countably additive: $\mu\big(\bigcup_i A_i\big)=\sum_i\mu(A_i)$ for every sequence of pairwise disjoint $A_i\in\mathcal F$. It is a **probability measure** when $\mu(\Omega)=1$. A σ-field is closed under countable intersections as well, because $\bigcap_i A_i=\big(\bigcup_i A_i^c\big)^c$.`,
      idea: String.raw`When $\Omega$ is finite, every σ-field comes from a partition of $\Omega$ into **atoms**. Its events are exactly the unions of atoms, so $k$ atoms give $2^k$ events, and a probability is the same thing as $k$ nonnegative masses on the atoms that add up to one. A set that splits an atom is not an event, and $P$ assigns it nothing at all. The discrete spaces of Example 1.1.2 are the case where $\mathcal F$ is every subset, every point is an atom and $P(A)=\sum_{\omega\in A}p(\omega)$.`,
      caption: String.raw`Choose a σ-field on $\Omega=\{1,\dots,6\}$. The outcomes are coloured by atom, and the right panel lists every event in $\mathcal F$ as a strip of six cells, filled where an outcome belongs, with its probability when there is room. Drag the bars to move mass between atoms. Click outcomes to build a set $A$: it is an event only if it is a union of whole atoms. The last choice is a collection that is *not* a σ-field, and its missing complements are flagged.`,
      deps: [],
      see: ['rca-1.3', 'rca-1.18'],
      verify: true,
      tags: ['measure', 'foundations'],
      viz(v) {
        const OPTS = [...SIX, { value: 'bad', label: 'not a σ-field' }];
        const BAD = [0, 0b000011, 0b000111, 0b111111]; // ∅, {1,2}, {1,2,3}, Ω
        const which = v.select('$\\mathcal F$', OPTS.map(({ value, label }) => ({ value, label })), 'low', { onChange: () => reset() });
        const sT = v.stage({ x: [-0.6, 5.6], y: [-0.55, 0.55], height: 110, axes: false, full: true });
        const sM = v.stage({ x: [-0.7, 5.7], y: [0, 1.18], height: 270, axes: 'box', gutter: { l: 36, r: 8, t: 8, b: 8 }, xticks: [], yticks: [0, 0.25, 0.5, 0.75, 1], weight: 0.85, title: 'masses on the atoms (drag)' });
        const sE = v.stage({ x: [0, 1], y: [0, 1], height: 270, axes: false, weight: 1.3, title: 'every event in $\\mathcal F$ and its probability' });
        const cur = () => OPTS.find((o) => o.value === which.value);
        const slot = (k) => { const K = cur().atoms?.length || 1; return -0.5 + ((k + 0.5) * 6) / K; };
        const H = ATOMS.slice(0, 6).map((c, k) => sM.handle(k, 0.2, { color: c, constrain: (x, y) => [slot(k), v.M.clamp(y, 0, 1)] }));
        let A = 0b000110;
        function reset() { const o = cur(); H.forEach((h, k) => { h.visible = !!o.atoms && k < o.atoms.length; if (h.visible) h.set(slot(k), o.atoms[k].length / 6); }); }
        reset();
        sT.onClick((x, y) => { const i = Math.round(x); if (i >= 0 && i < 6 && Math.abs(y) < 0.48 && Math.abs(x - i) < 0.45) A ^= 1 << i; });
        v.button('Normalize masses', () => { const o = cur(); if (!o.atoms) return; const hs = H.slice(0, o.atoms.length), s = hs.reduce((t, h) => t + h.y, 0); if (s > 0) hs.forEach((h) => h.set(h.x, h.y / s)); });
        const P = (m, o) => o.atoms.reduce((t, E, k) => t + (m & maskOf(E) ? H[k].y : 0), 0);
        v.render(() => {
          const o = cur(), at = o.atoms ? atomOf(o.atoms) : null;
          for (let i = 0; i < 6; i++) {
            const col = at ? ATOMS[at[i]] : 'gray', inA = (A >> i) & 1;
            sT.rect(i - 0.42, -0.42, i + 0.42, 0.42, { fill: col, fillAlpha: 0.28, color: inA ? 'ink' : col, width: inA ? 3.2 : 1.2, radius: 9 });
            sT.text(String(i + 1), i, 0.06, { size: 24, align: 'center', color: 'ink', math: true });
            if (inA) sT.text('in A', i, -0.27, { size: 11, align: 'center', color: 'ink' });
          }
          // masses
          if (o.atoms) {
            let tot = 0;
            o.atoms.forEach((E, k) => {
              const y = H[k].y, x = slot(k), hw = Math.min(0.32, 1.6 / o.atoms.length); tot += y;
              sM.rect(x - hw, 0, x + hw, y, { fill: ATOMS[k], fillAlpha: 0.55, stroke: false });
              sM.tex(setTeX(maskOf(E)), x, Math.min(y, 1.02) + 0.07, { color: ATOMS[k], size: o.atoms.length > 4 ? 12 : 14, baseline: 'bottom' });
            });
            sM.hline(1, { color: 'muted', dash: [4, 4], width: 1 });
            const ok = Math.abs(tot - 1) < 0.005;
            sM.corner(`total ${v.fix(tot, 2)}${ok ? ' = P(Ω)' : ' ≠ 1'}`, 'tr', { color: ok ? 'green' : 'red', weight: 600 });
          } else sM.corner('no σ-field, so no probability', 'tl', { color: 'red', weight: 600 });
          // the list of events
          let list, missing = [];
          if (o.atoms) list = eventsOf(o.atoms);
          else { list = BAD.slice(); missing = BAD.map((m) => 63 & ~m).filter((m) => !BAD.includes(m)); }
          const all = [...list, ...missing], n = all.length;
          const cols = n <= 4 ? 2 : n <= 6 ? 3 : n <= 8 ? 4 : 8, rows = Math.ceil(n / cols), big = n <= 16;
          all.forEach((m, j) => {
            const r = Math.floor(j / cols), c = j % cols, cx = (c + 0.5) / cols, cy = 1 - (r + (big ? 0.42 : 0.5)) / rows, w = 0.82 / cols;
            const miss = j >= list.length, colOf = (i) => (at ? ATOMS[at[i]] : miss ? 'red' : 'gray');
            strip(sE, m, cx, cy, w, 6, colOf, Math.min((w / 6) * sE.width / sE.height, 0.3 / rows));
            if (m === A) sE.rect(cx - w / 2 - 0.012, cy - 0.2 / rows, cx + w / 2 + 0.012, cy + 0.2 / rows, { color: 'ink', width: 2.2, radius: 4 });
            if (miss) sE.rect(cx - w / 2 - 0.012, cy - 0.2 / rows, cx + w / 2 + 0.012, cy + 0.2 / rows, { color: 'red', width: 1.6, dash: [4, 3], radius: 4 });
            if (big) sE.text(miss ? 'missing' : o.atoms ? `P = ${v.fix(P(m, o), 2)}` : '', cx, cy - 0.25 / rows, { size: 11.5, align: 'center', baseline: 'top', color: miss ? 'red' : 'muted' });
          });
          sE.corner(`${list.length} sets`, 'br', { size: 11 });
        });
        v.readout(() => {
          const o = cur();
          if (!o.atoms) return String.raw`The collection $\{\varnothing,\{1,2\},\{1,2,3\},\Omega\}$ is closed under unions but not under complements: $\{3,4,5,6\}$ and $\{4,5,6\}$ are missing, so it is not a σ-field and there is nothing for $P$ to be defined on. (Item 1.1.2a closes such a collection up.)`;
          const ev = unionOfAtoms(A, o.atoms), split = o.atoms.find((E) => { const e = maskOf(E); return (A & e) && (A & e) !== e; });
          const k = o.atoms.length;
          return `$A=${setTeX(A)}$ ` + (ev ? `is an event, a union of atoms, with $P(A)=${v.fix(P(A, o), 3)}$.` : `is **not** an event: it splits the atom $${setTeX(maskOf(split))}$, so $P(A)$ is not defined.`) + ` This σ-field has $k=${k}$ atom${k > 1 ? 's' : ''} and $2^{${k}}=${2 ** k}$ events.`;
        });
      },
    },
    {
      num: '1.1.1',
      kind: 'Theorem',
      name: 'Monotonicity, subadditivity and continuity of measures',
      statement: String.raw`Let $\mu$ be a measure on $(\Omega,\mathcal F)$; all sets below are in $\mathcal F$.

(i) *Monotonicity*: if $A\subset B$ then $\mu(A)\le\mu(B)$.
(ii) *Subadditivity*: if $A\subset\bigcup_{m=1}^\infty A_m$ then $\mu(A)\le\sum_{m=1}^\infty\mu(A_m)$.
(iii) *Continuity from below*: if $A_1\subset A_2\subset\cdots$ and $\bigcup_i A_i=A$, then $\mu(A_i)\uparrow\mu(A)$.
(iv) *Continuity from above*: if $A_1\supset A_2\supset\cdots$ and $\bigcap_i A_i=A$, and $\mu(A_1)<\infty$, then $\mu(A_i)\downarrow\mu(A)$.`,
      idea: String.raw`Each part comes from rewriting sets as disjoint unions. For (i), $B$ is the disjoint union of $A$ and $B\setminus A$. For (ii), the sets $B_m=(A_m\cap A)\setminus\bigcup_{j<m}A_j$ are disjoint, have union $A$ and satisfy $B_m\subset A_m$. For (iii), the rings $A_n\setminus A_{n-1}$ are disjoint and $\mu(A_n)$ is a partial sum of their measures. Part (iv) follows from (iii) applied to $A_1\setminus A_n\uparrow A_1\setminus A$, which needs $\mu(A_1)<\infty$ in order to subtract.`,
      caption: String.raw`The measure $\mu$ has a density on $[0,1]$ (blue) plus a point mass $\tfrac14$ at $0.6$ (red arrow). Increase $n$ and watch the bars $\mu(A_n)$ approach the green limit. From below, the limit set $(0.1,0.6)$ is open at $0.6$, so it misses the atom. From above, it is $(0.1,0.6]$ and keeps it. With Lebesgue measure and $B_n=[n,\infty)$, every $\mu(B_n)$ is infinite but the intersection is empty. *Subadditivity* shows the disjoint pieces $B_m$ of the proof inside an overlapping cover.`,
      deps: ['prob-1.1.1a'],
      see: ['rca-1.19'],
      tags: ['measure'],
      viz(v) {
        const mode = v.select('', [{ value: 'below', label: 'continuity from below' }, { value: 'above', label: 'from above' }, { value: 'inf', label: String.raw`from above, $\mu(A_1)=\infty$` }, { value: 'sub', label: 'subadditivity' }], 'below');
        const nS = v.slider('$n$', 1, 30, 6, { int: true });
        const top = v.stage({ x: [-0.14, 1.05], y: [-1.08, 1.55], height: 300, full: true, axes: false });
        const bot = v.stage({ x: [0, 31], y: [0, 1], height: 170, full: true, axes: 'box', gutter: true });
        const G = (x) => { const t = Math.min(1, Math.max(0, x)); return 0.75 * (t + (0.6 * (1 - Math.cos(2 * Math.PI * t))) / (2 * Math.PI)); };
        const dens = (x) => (x < 0 || x > 1 ? 0 : 0.75 * (1 + 0.6 * Math.sin(2 * Math.PI * x)));
        const C = 0.6, PM = 0.25;
        const mu = (a, b, cl = false, cr = true) => Math.max(0, G(b) - G(a)) + ((cl ? a <= C : a < C) && (cr ? C <= b : C < b) ? PM : 0);
        const SETS = {
          below: { k: (k) => [0.1, C - 0.45 / k], lim: [0.1, C], limOpen: [true, true], limTeX: 'A=\\textstyle\\bigcup_k A_k', name: 'A' },
          above: { k: (k) => [0.1, C + 0.35 / k], lim: [0.1, C], limOpen: [true, false], limTeX: 'B=\\textstyle\\bigcap_k B_k', name: 'B' },
        };
        const cover = (n) => { const r = (0.7 / (2 * n)) * 1.5, c = (m) => 0.15 + (0.7 * (m - 0.5)) / n; return Array.from({ length: n }, (_, i) => [c(i + 1) - r, c(i + 1) + r]); };
        let last = null, state = {};
        v.render(() => {
          const md = mode.value, n = nS.value;
          if (md !== last) {
            last = md;
            top.setView(md === 'inf' ? [-2.6, 31.5] : [-0.14, 1.05], null);
            if (md === 'sub') { bot.setView([0.35, 3.65], [0, 1.4]); bot.setTicks([[1, 'μ(A)'], [2, 'Σ μ(B_m)'], [3, 'Σ μ(A_m)']], null); }
            else { bot.setView([0.3, 30.7], [0, 1]); bot.setTicks(null, null); }
          }
          const lab = (t, y, col = 'ink') => top.tex(t, top.bounds.x[0], y, { align: 'left', color: col, size: 14, dx: 6 });
          if (md === 'inf') {
            top.rect(0, 0, 31.5, 0.45, { fill: 'blue', fillAlpha: 0.18, stroke: false });
            top.line(-0.5, 0, 31.5, 0, { color: 'faint', width: 1 });
            [0, 5, 10, 15, 20, 25, 30].forEach((t) => top.text(String(t), t, -0.08, { size: 10.5, align: 'center', color: 'muted' }));
            top.text('Lebesgue measure on [0, ∞): every ray has infinite length', 0.5, 0.75, { size: 12.5, color: 'blue' });
            for (let k = 1; k <= n; k++) {
              const y = -0.25 - (0.6 * (k - 1)) / Math.max(n - 1, 1);
              top.line(k, y, 31.3, y, { color: 'accent', width: k === n ? 3.5 : 1.8, alpha: k === n ? 1 : 0.4 });
              top.dot(k, y, { r: k === n ? 4 : 2.5, color: 'accent', alpha: k === n ? 1 : 0.5 });
            }
            lab('B_k=[k,\\infty)', -0.25, 'accent');
            lab('\\textstyle\\bigcap_k B_k=\\varnothing', -0.98, 'green');
            for (let k = 1; k <= n; k++) {
              bot.rect(k - 0.35, 0, k + 0.35, 1, { fill: 'red', fillAlpha: 0.12, hatch: 'red', hatchAlpha: 0.35, stroke: false });
              if (n <= 12) bot.text('∞', k, 0.9, { size: 13, align: 'center', color: 'red' });
            }
            bot.hline(0.004, { color: 'green', width: 3 });
            bot.corner('μ(B_k) = ∞ for every k, yet μ(⋂ B_k) = μ(∅) = 0', 'tr', { color: 'red', weight: 600 });
            state = { md };
            v.legend([['accent', '$B_k$'], ['red', '$\\mu(B_k)=\\infty$', { area: true }], ['green', '$\\mu(\\bigcap B_k)=0$']]);
            return;
          }
          // the measure: density on [0,1] and a point mass at 0.6
          top.fn(dens, { domain: [0, 1], color: 'blue', width: 1.8, fill: 'blue', fillAlpha: 0.16 });
          top.line(-0.02, 0, 1.03, 0, { color: 'faint', width: 1 });
          [0, 0.5, 1].forEach((t) => top.text(String(t), t, -0.08, { size: 10.5, align: 'center', color: 'muted' }));
          top.arrow(C, 0, C, 1.42, { color: 'red', width: 2.5 });
          top.text('mass 1/4', C + 0.012, 1.42, { size: 11.5, color: 'red' });
          if (md === 'sub') {
            const A = [0.15, 0.85], Am = cover(n);
            const Bm = Am.map(([a, b], i) => [i ? Am[i - 1][1] : A[0], Math.min(b, A[1])]);
            halfOpen(top, A[0], A[1], -0.24, 'accent'); lab('A', -0.24, 'accent');
            Am.forEach(([a, b], i) => halfOpen(top, a, b, i % 2 ? -0.56 : -0.46, 'orange', { width: 3, r: 3 })); lab('A_m', -0.51, 'orange');
            Bm.forEach(([a, b], i) => halfOpen(top, a, b, -0.86, i % 2 ? 'teal' : 'green', { width: 5, r: 3 })); lab('B_m', -0.86, 'green');
            const sA = mu(...A), sB = Bm.map((I) => mu(...I)), sAm = Am.map((I) => mu(...I));
            bot.rect(0.7, 0, 1.3, sA, { fill: 'accent', fillAlpha: 0.6, stroke: false });
            let y = 0; sB.forEach((s, i) => { bot.rect(1.7, y, 2.3, y + s, { fill: i % 2 ? 'teal' : 'green', fillAlpha: 0.6, color: 'panel', width: 0.6 }); y += s; });
            y = 0; sAm.forEach((s, i) => { bot.rect(2.7, y, 3.3, y + s, { fill: i % 2 ? 'gold' : 'orange', fillAlpha: 0.6, color: 'panel', width: 0.6 }); y += s; });
            bot.hline(sA, { color: 'accent', dash: [4, 4], width: 1 });
            state = { md, sA, sB: sB.reduce((a, b) => a + b, 0), sAm: sAm.reduce((a, b) => a + b, 0) };
            v.legend([['accent', '$A$'], ['orange', 'cover $A_m$'], ['green', 'disjoint pieces $B_m=(A_m\\cap A)\\setminus\\bigcup_{j<m}A_j$']]);
            return;
          }
          const S = SETS[md];
          for (let k = 1; k <= n; k++) {
            const [a, b] = S.k(k), y = -0.24 - (0.56 * (k - 1)) / Math.max(n - 1, 1);
            halfOpen(top, a, b, y, 'accent', { width: k === n ? 4 : 1.8, alpha: k === n ? 1 : 0.4, r: k === n ? 4 : 2.5 });
          }
          lab(`${S.name}_k`, -0.24, 'accent');
          const [la, lb] = S.lim, yl = -0.96;
          top.line(la, yl, lb, yl, { color: 'green', width: 4, cap: 'butt' });
          top.dot(la, yl, { r: 4, hollow: true, color: 'green' }); top.dot(lb, yl, { r: 4, hollow: S.limOpen[1], color: 'green' });
          lab(S.limTeX, yl, 'green');
          const vals = Array.from({ length: n }, (_, i) => mu(...S.k(i + 1))), lim = mu(la, lb, false, !S.limOpen[1]);
          bot.setView(null, [0, Math.max(...vals, lim) * 1.18]);
          bot.bars(vals, { color: 'accent', fillAlpha: 0.55 });
          bot.hline(lim, { color: 'green', width: 2, dash: [6, 4] });
          bot.text(md === 'below' ? 'μ(A)' : 'μ(B)', 30.6, lim, { size: 12, align: 'right', baseline: 'bottom', dy: -3, color: 'green' });
          state = { md, cur: vals[n - 1], lim };
          v.legend([['blue', 'density part of $\\mu$', { area: true }], ['red', 'point mass at $0.6$'], ['accent', md === 'below' ? '$A_k\\uparrow$ and $\\mu(A_k)$' : '$B_k\\downarrow$ and $\\mu(B_k)$'], ['green', 'the limit']]);
        });
        v.readout(() => {
          const s = state, n = nS.value;
          if (s.md === 'inf') return String.raw`$\mu(B_n)=\infty$ for every $n$, but $\bigcap_n B_n=\varnothing$ has measure $0$. Continuity from above fails here, which is why (iv) assumes $\mu(A_1)<\infty$.`;
          if (s.md === 'sub') return `$\\mu(A)=${v.fix(s.sA, 4)}=\\sum_m\\mu(B_m)$ $\\le\\sum_{m=1}^{${n}}\\mu(A_m)=${v.fix(s.sAm, 4)}$. The overlaps of the cover are counted twice, adding $${v.fix(s.sAm - s.sA, 4)}$.`;
          if (s.md === 'below') return `$\\mu(A_{${n}})=${v.fix(s.cur, 4)}\\uparrow\\mu(A)=${v.fix(s.lim, 4)}$ (gap $${v.fix(s.lim - s.cur, 4)}$). The union $(0.1,0.6)$ never reaches $0.6$, so the point mass $\\tfrac14$ is not counted.`;
          return `$\\mu(B_{${n}})=${v.fix(s.cur, 4)}\\downarrow\\mu(B)=${v.fix(s.lim, 4)}$ (gap $${v.fix(s.cur - s.lim, 4)}$). Every $B_k$ contains $0.6$, so the limit keeps the point mass $\\tfrac14$.`;
        });
      },
    },
    {
      num: '1.1.2a',
      kind: 'Definition',
      name: 'Generated σ-field; Borel sets',
      statement: String.raw`Any intersection $\bigcap_{i\in I}\mathcal F_i$ of σ-fields on $\Omega$ is again a σ-field, for any nonempty index set $I$, countable or not. So for every collection $\mathcal A$ of subsets of $\Omega$ there is a smallest σ-field containing $\mathcal A$: the intersection of all σ-fields that contain it. It is called the **σ-field generated by $\mathcal A$** and written $\sigma(\mathcal A)$.

The **Borel sets** $\mathcal R^d$ form the σ-field on $\R^d$ generated by the open sets; for $d=1$ one writes $\mathcal R$.`,
      idea: String.raw`Each defining property (containing $A^c$ and countable unions) survives intersection, so the intersection of all σ-fields containing $\mathcal A$ is the smallest one. When $\mathcal A$ is a finite family $A_1,\dots,A_n$, $\sigma(\mathcal A)$ can be computed. The sets $A_1^{\pm}\cap\cdots\cap A_n^{\pm}$ (each $A_i$ or its complement) that are nonempty are the atoms, and $\sigma(\mathcal A)$ consists of all unions of atoms. Closing up under complements, unions and intersections round by round reaches the same family after finitely many rounds. For the Borel sets no such recipe exists; one works with generators such as the half-lines $(-\infty,x]$.`,
      caption: String.raw`Drag the discs $A_1,A_2,A_3$ around the square $\Omega$. Their nonempty Venn regions are the atoms. The right panel has one cell for each union of atoms, $2^k$ in all, drawn as the atoms it contains. Raise the round counter to close the generators up under complements, unions and intersections: new sets in each round are outlined in gold, and the count stops at $2^k$. Click a region on the left to pick a set and see in which round it first appears.`,
      deps: ['prob-1.1.1a'],
      see: ['rca-1.10', 'rca-1.11'],
      verify: true,
      tags: ['measure', 'sigma-fields'],
      viz(v) {
        const nG = v.select('generators', [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }], 3);
        const rounds = v.slider('rounds of closing up', 0, 6, 2, { int: true });
        const sV = v.stage({ x: [0, 1], y: [0, 1], equal: true, height: 340, axes: false, title: 'generators and the atoms they cut out of $\\Omega$' });
        const sC = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: false, title: 'the unions of atoms, by round of appearance' });
        const RAD = [0.27, 0.25, 0.23], NAMES = ['A_1', 'A_2', 'A_3'];
        const Hs = [[0.37, 0.6], [0.63, 0.6], [0.5, 0.37]].map(([x, y], i) => sV.handle(x, y, { color: 'ink', r: 6, label: '$' + NAMES[i] + '$', labelPos: ['nw', 'ne', 's'][i] }));
        let chosen = new Set();
        const sig = (x, y, n) => { let s = 0; for (let i = 0; i < n; i++) if ((x - Hs[i].x) ** 2 + (y - Hs[i].y) ** 2 < RAD[i] ** 2) s |= 1 << i; return s; };
        let cache = null;
        function analyse() {
          const n = nG.value, key = [n, ...Hs.slice(0, n).flatMap((h) => [h.x.toFixed(4), h.y.toFixed(4)])].join('|');
          if (cache && cache.key === key) return cache;
          const cnt = new Map(), N = 150;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const s = sig((i + 0.5) / N, (j + 0.5) / N, n); cnt.set(s, (cnt.get(s) || 0) + 1); }
          const sigs = [...cnt.keys()].filter((s) => cnt.get(s) >= 3).sort((a, b) => a - b), k = sigs.length, full = (1 << k) - 1;
          const gens = Array.from({ length: n }, (_, i) => sigs.reduce((m, s, j) => ((s >> i) & 1 ? m | (1 << j) : m), 0));
          const first = new Int8Array(1 << k).fill(-1); let S = [...new Set(gens)]; S.forEach((m) => (first[m] = 0));
          let r = 0;
          while (r < 12) {
            const add = [];
            for (const a of S) { const c = full & ~a; if (first[c] < 0) { first[c] = r + 1; add.push(c); } for (const b of S) for (const m of [a | b, a & b]) if (first[m] < 0) { first[m] = r + 1; add.push(m); } }
            if (!add.length) break; S = S.concat(add); r++;
          }
          const order = Array.from({ length: 1 << k }, (_, m) => m).sort((a, b) => popc(a) - popc(b) || a - b);
          cache = { key, sigs, k, gens, first, stable: r, order, n };
          return cache;
        }
        sV.onClick((x, y) => { const A = analyse(), j = A.sigs.indexOf(sig(x, y, A.n)); if (j < 0) return; if (chosen.has(j)) chosen.delete(j); else chosen.add(j); });
        let lastKey = null;
        v.render(() => {
          const A = analyse(), n = A.n;
          Hs.forEach((h, i) => (h.visible = i < n));
          if (A.key !== lastKey) { if (lastKey && lastKey.split('|')[0] !== A.key.split('|')[0]) chosen = new Set(); lastKey = A.key; chosen = new Set([...chosen].filter((j) => j < A.k)); }
          const ch = [...chosen].reduce((m, j) => m | (1 << j), 0);
          const cols = A.sigs.map((s, j) => ATOMS[j % ATOMS.length]);
          sV.raster((x, y) => { const j = A.sigs.indexOf(sig(x, y, n)); if (j < 0) return null; return v.ramp((ch >> j) & 1 ? 0.75 : 0.32, cols[j]); }, { key: A.key + '|' + ch, res: 2, rect: [0, 0, 1, 1] });
          for (let i = 0; i < n; i++) sV.circle(Hs[i].x, Hs[i].y, RAD[i], { color: 'ink', width: 1.8 });
          sV.rect(0, 0, 1, 1, { color: 'muted', width: 1.5 });
          sV.tex('\\Omega', 0.02, 0.97, { align: 'left', baseline: 'top', color: 'muted' });
          // the cells
          const k = A.k, N = 1 << k, cc = k <= 2 ? 2 : k <= 4 ? 4 : k <= 6 ? 8 : 16, rr = Math.ceil(N / cc), R = rounds.value;
          const g = Math.ceil(Math.sqrt(k)), gr = Math.ceil(k / g);
          const cw = 1 / cc, chh = 1 / rr, px = Math.min(cw * sC.width, chh * sC.height);
          A.order.forEach((m, idx) => {
            const r = Math.floor(idx / cc), c = idx % cc, x0 = c * cw, y1 = 1 - r * chh, f = A.first[m], on = f >= 0 && f <= R;
            const sw = (0.78 * px) / g / sC.width, sh = (0.78 * px) / g / sC.height, ox = x0 + cw / 2 - (sw * g) / 2, oy = y1 - chh / 2 + (sh * gr) / 2;
            if (!on) { sC.rect(ox + sw * 0.3, oy - gr * sh + sh * 0.3, ox + g * sw - sw * 0.3, oy - sh * 0.3, { color: 'faint', width: 0.8, alpha: 0.6, radius: 2 }); return; }
            for (let j = 0; j < k; j++) {
              const gx = j % g, gy = Math.floor(j / g), inc = (m >> j) & 1;
              sC.rect(ox + gx * sw + sw * 0.08, oy - (gy + 1) * sh + sh * 0.08, ox + (gx + 1) * sw - sw * 0.08, oy - gy * sh - sh * 0.08, inc ? { fill: cols[j], fillAlpha: on ? 0.9 : 0.12, stroke: false } : { color: 'faint', width: 0.8, alpha: on ? 1 : 0.35 });
            }
            const box = [ox - sw * 0.12, oy - gr * sh - sh * 0.12, ox + g * sw + sw * 0.12, oy + sh * 0.12];
            if (on && f === R && R > 0) sC.rect(...box, { color: 'gold', width: 2.2, radius: 3 });
            if (f === 0) sC.rect(...box, { color: 'ink', width: 1.6, radius: 3, dash: [3, 2] });
            if (m === ch && ch) sC.rect(box[0] - sw * 0.15, box[1] - sh * 0.15, box[2] + sw * 0.15, box[3] + sh * 0.15, { color: 'ink', width: 2.6, radius: 4 });
          });
          v.legend([['ink', 'generators (round 0)', { dash: true }], ['gold', 'new in this round'], ['ink', 'the set you picked']]);
        });
        v.readout(() => {
          const A = analyse(), R = rounds.value, have = A.first.reduce((s, f) => s + (f >= 0 && f <= R ? 1 : 0), 0), N = 1 << A.k;
          const ch = [...chosen].reduce((m, j) => m | (1 << j), 0);
          return `$k=${A.k}$ nonempty atoms, so $\\sigma(\\mathcal A)$ has $2^{${A.k}}=${N}$ sets. After ${R} round${R === 1 ? '' : 's'}: **${have}** sets` + (have === N ? ' (closed: nothing new can appear).' : '.') + ` The closure stops growing after ${A.stable} rounds.` + (ch ? ` Your union of ${popc(ch)} atom${popc(ch) > 1 ? 's' : ''} first appears in round ${A.first[ch]}.` : ' Click regions to pick a union of atoms.');
        });
      },
    },
  ],
};
