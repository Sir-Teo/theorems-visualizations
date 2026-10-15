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
    {
      num: '1.1.4',
      kind: 'Theorem',
      name: 'Stieltjes measure functions give measures on ℝ',
      credit: 'Stieltjes, 1894; Lebesgue, 1902',
      statement: String.raw`Call $F:\R\to\R$ a **Stieltjes measure function** if it is nondecreasing and right-continuous, $\lim_{y\downarrow x}F(y)=F(x)$. For each such $F$ there is exactly one measure $\mu$ on $(\R,\mathcal R)$ with
$$\mu((a,b])=F(b)-F(a)\qquad\text{for all } a<b.$$
For $F(x)=x$ this measure is **Lebesgue measure**.`,
      idea: String.raw`The half-open intervals $(a,b]$, $-\infty\le a<b\le\infty$, form a semialgebra and the formula defines $\mu$ on it, so the result follows from the extension theorem 1.1.9 once finite additivity and countable subadditivity are checked. Finite additivity is a telescoping sum. Countable subadditivity is where right-continuity is used. Shrink $(a,b]$ to the compact $[a+\delta,b]$ and enlarge each covering $(a_i,b_i]$ to the open $(a_i,b_i+\eta_i)$, losing at most $\eps$ and $\eps2^{-i}$. Heine–Borel then leaves finitely many intervals, where Lemma 1.1.10 applies. Single points get $\mu(\{x\})=F(x)-F(x-)$, the jump of $F$.`,
      caption: String.raw`Drag the blue points to reshape $F$; dragging one up opens a jump, and its orange partner marks $F(x-)$. Drag $a$ and $b$ along the bottom; they snap onto the knots. The rise of $F$ over the interval is its mass: the blue density part plus the red point masses inside. Change the interval type to see which endpoint atoms count, since $(a,b]$ keeps the atom at $b$ and drops the one at $a$. Turn off right-continuity and $F$ takes its jumps one step late: countable additivity then fails, as the readout shows.`,
      deps: ['prob-1.1.2a'],
      see: ['prob-1.1.9', 'rca-2.20'],
      tags: ['measure', 'lebesgue-stieltjes'],
      viz(v) {
        const typ = v.select('interval', [{ value: 'oc', label: '$(a,b]$' }, { value: 'cc', label: '$[a,b]$' }, { value: 'oo', label: '$(a,b)$' }, { value: 'co', label: '$[a,b)$' }], 'oc');
        const rc = v.toggle('right-continuous', true);
        const sF = v.stage({ x: [-0.5, 10.4], y: [-0.62, 2.72], height: 300, full: true, axes: false });
        const sD = v.stage({ x: [-0.5, 10.4], y: [0, 1], height: 150, full: true, axes: false, title: 'the measure $\\mu$: density $F\'$ (blue) and point masses (red)' });
        const E = fEditor(v, sF, [[1, 0, 0], [3, 0.7, 0.7], [4.5, 0.7, 1.15], [6, 1.15, 1.15], [7.5, 1.5, 1.5], [9, 1.85, 2.3]], { ymax: 2.6 });
        const snap = (x) => { for (const k of E.K) if (Math.abs(x - k.x) < 0.18) return k.x; return x; };
        const YA = -0.36;
        const ha = sF.handle(2.2, YA, { color: 'gold', r: 6, label: 'a', labelPos: 'w', constrain: (x) => [snap(Math.min(x, hb.x - 0.1)), YA] });
        const hb = sF.handle(4.5, YA, { color: 'gold', r: 6, label: 'b', labelPos: 'e', constrain: (x) => [snap(Math.max(x, ha.x + 0.1)), YA] });
        let st = {};
        v.render(() => {
          const a = ha.x, b = hb.x, R = rc.value, F = R ? E.F : E.Fm, Fm = E.Fm, t = typ.value;
          const cl = t === 'cc' || t === 'co', cr = t === 'oc' || t === 'cc';
          const lo = R ? (cl ? Fm(a) : F(a)) : F(a), hi = R ? (cr ? F(b) : Fm(b)) : F(b);
          // axis and grid
          sF.line(-0.5, 0, 10.4, 0, { color: 'faint', width: 1 });
          for (let x = 0; x <= 10; x += 2) sF.text(String(x), x, -0.12, { size: 10.5, align: 'center', color: 'muted' });
          [0.5, 1, 1.5, 2, 2.5].forEach((y) => { sF.line(-0.5, y, 10.4, y, { color: 'grid', width: 1 }); sF.text(String(y), -0.42, y, { size: 10, color: 'muted', baseline: 'bottom', dy: -2 }); });
          sF.vband(a, b, { color: 'gold', alpha: 0.1 });
          sF.line(a, YA, a, F(a), { color: 'gold', width: 1, dash: [3, 3] }); sF.line(b, YA, b, Math.max(F(b), E.F(b)), { color: 'gold', width: 1, dash: [3, 3] });
          E.draw({ rightCont: R });
          const xm = b < 9.3 ? b + 0.45 : a - 0.45;
          sF.line(Math.min(a, xm), lo, Math.max(b, xm), lo, { color: 'gold', width: 1.2, dash: [4, 3] });
          sF.line(Math.min(a, xm), hi, Math.max(b, xm), hi, { color: 'gold', width: 1.2, dash: [4, 3] });
          if (hi - lo > 0.02) sF.measure(xm, lo, xm, hi, 'μ', { color: 'gold', offset: 12 });
          // the measure
          const ks = E.K, m = ks.length - 1;
          let dmax = 0.05; for (let i = 0; i < m; i++) dmax = Math.max(dmax, (ks[i + 1].lo - ks[i].hi) / (ks[i + 1].x - ks[i].x));
          sD.setView(null, [-dmax * 0.28, dmax * 1.75]);
          sD.vband(a, b, { color: 'gold', alpha: 0.12 });
          for (let i = 0; i < m; i++) { const d = (ks[i + 1].lo - ks[i].hi) / (ks[i + 1].x - ks[i].x); if (d > 0) sD.rect(ks[i].x, 0, ks[i + 1].x, d, { fill: 'blue', fillAlpha: 0.25, color: 'blue', width: 1.5 }); }
          const inside = (c) => (cl ? c >= a : c > a) && (cr ? c <= b : c < b);
          let atomSum = 0;
          for (const k of E.jumps()) {
            const p = k.hi - k.lo, inn = R ? inside(k.x) : k.x >= a && k.x < b;
            if (inn) atomSum += p;
            sD.arrow(k.x, 0, k.x, dmax * 1.45, { color: 'red', width: inn ? 3 : 1.6, alpha: inn ? 1 : 0.4 });
            sD.text(v.fix(p, 2), k.x + 0.1, dmax * 1.5, { size: 11, color: 'red', alpha: inn ? 1 : 0.5 });
          }
          sD.line(-0.5, 0, 10.4, 0, { color: 'faint', width: 1 });
          sD.interval(a, b, -dmax * 0.15, { open: [!cl, !cr], color: 'gold', width: 3, r: 4 });
          // without right-continuity: (c, b] = ⋃ (c + h/(k+1), c + h/k] loses the jump at c
          let c = null;
          if (!R) { const J = E.jumps().filter((k) => k.x >= a && k.x < b); if (J.length) c = J[0]; }
          if (c) for (let k = 1; k <= 9; k++) { const h = b - c.x; sD.line(c.x + h / (k + 1), dmax * 0.12, c.x + h / k, dmax * 0.12, { color: k % 2 ? 'purple' : 'teal', width: 5, cap: 'butt' }); }
          st = { a, b, lo, hi, atomSum, cl, cr, R, c };
          v.legend([['ink', '$F$'], ['gold', 'the interval and its mass'], ['blue', 'density part', { area: true }], ['red', 'point masses']]);
        });
        v.readout(() => {
          const { a, b, lo, hi, atomSum, cl, cr, R, c } = st;
          if (!R) {
            if (!c) return 'This $F$ is not right-continuous at its jumps. Move $a$ onto a jump (it snaps) to watch countable additivity fail.';
            const h = b - c.x, whole = E.Fm(b) - E.Fm(c.x), parts = E.Fm(b) - c.hi;
            return `With the jump at $c=${v.fix(c.x, 2)}$ taken late ($F(c)=${v.fix(c.lo, 3)}$), the formula gives $(c,b]$ the mass $F(b)-F(c)=${v.fix(whole, 3)}$. But $(c,b]=\\bigcup_k\\big(c+\\tfrac{${v.fix(h, 2)}}{k+1},\\,c+\\tfrac{${v.fix(h, 2)}}{k}\\big]$, and these pieces (purple/teal) add up to only $F(b)-F(c+)=${v.fix(parts, 3)}$. The jump ${v.fix(c.hi - c.lo, 3)}$ is lost, so no measure has these interval masses.`;
          }
          const L = cl ? 'F(a-)' : 'F(a)', U = cr ? 'F(b)' : 'F(b-)', I = `${cl ? '[' : '('}a,b${cr ? ']' : ')'}`;
          return `$\\mu(${I}) = ${U}-${L} = ${v.fix(hi, 3)}-${v.fix(lo, 3)} = ${v.fix(hi - lo, 3)}$: density part $${v.fix(hi - lo - atomSum, 3)}$ plus point masses $${v.fix(atomSum, 3)}$.`;
        });
      },
    },
    {
      num: '1.1.4a',
      kind: 'Definition',
      name: 'Semialgebras and algebras of sets',
      statement: String.raw`A collection $\mathcal S$ of subsets of $\Omega$ is a **semialgebra** if (i) $S,T\in\mathcal S$ implies $S\cap T\in\mathcal S$, and (ii) for each $S\in\mathcal S$ the complement $S^c$ is a finite disjoint union of sets in $\mathcal S$. A collection $\mathcal A$ is an **algebra** (or field) if $A,B\in\mathcal A$ implies $A^c\in\mathcal A$ and $A\cup B\in\mathcal A$; then also $A\cap B=(A^c\cup B^c)^c\in\mathcal A$. Every σ-algebra is an algebra.

Example 1.1.5: $\mathcal S_d$, the empty set together with all rectangles $(a_1,b_1]\times\cdots\times(a_d,b_d]\subset\R^d$ with $-\infty\le a_i<b_i\le\infty$, is a semialgebra. Example 1.1.6: on $\Omega=\Z$, the sets $A$ with $A$ or $A^c$ finite form an algebra that is not a σ-algebra.`,
      idea: String.raw`The intersection of two products is the product of the coordinatewise intersections, and two half-open intervals meet in a half-open interval or not at all. That gives (i). The complement of a rectangle splits into at most $2d$ disjoint slabs, each again a product of half-open intervals with possibly infinite ends, which gives (ii). Half-open intervals are chosen so that pieces such as $(a,b]$ and $(b,c]$ fit together with no overlap and no gap. A semialgebra need not be closed under unions, since two rectangles rarely form a rectangle; that is why Lemma 1.1.7 passes to finite disjoint unions.`,
      caption: String.raw`Drag the corners of the rectangles $S$ (blue) and $T$ (red). Solid edges belong to a rectangle and dashed edges do not, the convention $(a,b]$ in each coordinate. $S\cap T$ is again a rectangle. $S^c$ splits into four disjoint rectangles reaching off to infinity (arrows). $S\setminus T$ and $S\cup T$ are finite disjoint unions of rectangles, and the readout says when $S\cup T$ happens to be a rectangle itself.`,
      deps: ['prob-1.1.1a'],
      verify: true,
      tags: ['measure', 'sigma-fields'],
      viz(v) {
        const op = v.select('show', [{ value: 'cap', label: '$S\\cap T$' }, { value: 'comp', label: '$S^c$' }, { value: 'diff', label: '$S\\setminus T$' }, { value: 'cup', label: '$S\\cup T$' }], 'comp');
        const s = v.stage({ x: [-0.5, 9.5], y: [-0.5, 4.5], equal: true, height: 380, axes: false });
        const corner = (x, y, col, other, lower) => s.handle(x, y, { color: col, r: 6, constrain: (px, py) => (lower ? [Math.min(px, other().x - 0.3), Math.min(py, other().y - 0.3)] : [Math.max(px, other().x + 0.3), Math.max(py, other().y + 0.3)]) });
        const S1 = corner(1.2, 0.8, 'blue', () => S2, true), S2 = corner(4.6, 3.0, 'blue', () => S1, false);
        const T1 = corner(3.3, 1.7, 'red', () => T2, true), T2 = corner(7.8, 3.9, 'red', () => T1, false);
        const PC = ['teal', 'purple', 'gold', 'pink', 'green'];
        const inter = (R, Q) => { const r = [Math.max(R[0], Q[0]), Math.min(R[1], Q[1]), Math.max(R[2], Q[2]), Math.min(R[3], Q[3])]; return r[0] < r[1] && r[2] < r[3] ? r : null; };
        const comp = (R) => [[-Infinity, R[0], -Infinity, Infinity], [R[1], Infinity, -Infinity, Infinity], [R[0], R[1], -Infinity, R[2]], [R[0], R[1], R[3], Infinity]];
        function draw(R, col, st = {}) {
          const [X0, X1] = s.bounds.x, [Y0, Y1] = s.bounds.y;
          const x0 = Math.max(R[0], X0 - 1), x1 = Math.min(R[1], X1 + 1), y0 = Math.max(R[2], Y0 - 1), y1 = Math.min(R[3], Y1 + 1);
          s.rect(x0, y0, x1, y1, { fill: col, fillAlpha: st.alpha ?? 0.24, stroke: false });
          if (st.edges === false) return;
          if (isFinite(R[1])) s.line(R[1], y0, R[1], y1, { color: col, width: 2.4 });
          if (isFinite(R[3])) s.line(x0, R[3], x1, R[3], { color: col, width: 2.4 });
          if (isFinite(R[0])) s.line(R[0], y0, R[0], y1, { color: col, width: 1.6, dash: [5, 4] });
          if (isFinite(R[2])) s.line(x0, R[2], x1, R[2], { color: col, width: 1.6, dash: [5, 4] });
          const cx = (Math.max(x0, X0) + Math.min(x1, X1)) / 2, cy = (Math.max(y0, Y0) + Math.min(y1, Y1)) / 2;
          if (R[0] === -Infinity) s.arrow(X0 + 0.45, cy, X0 + 0.08, cy, { color: col, width: 2, head: 8 });
          if (R[1] === Infinity) s.arrow(X1 - 0.45, cy, X1 - 0.08, cy, { color: col, width: 2, head: 8 });
          if (R[2] === -Infinity) s.arrow(cx, Y0 + 0.45, cx, Y0 + 0.08, { color: col, width: 2, head: 8 });
          if (R[3] === Infinity) s.arrow(cx, Y1 - 0.45, cx, Y1 - 0.08, { color: col, width: 2, head: 8 });
          if (st.label) s.tex(st.label, cx, cy, { color: col, size: 15 });
        }
        let info = {};
        v.render(() => {
          const S = [S1.x, S2.x, S1.y, S2.y], T = [T1.x, T2.x, T1.y, T2.y], o = op.value;
          T1.visible = T2.visible = o !== 'comp';
          let pieces = [];
          if (o === 'cap') { const r = inter(S, T); draw(S, 'blue', { alpha: 0.08 }); draw(T, 'red', { alpha: 0.08 }); if (r) { draw(r, 'green', { alpha: 0.35, label: 'S\\cap T' }); pieces = [r]; } }
          else if (o === 'comp') { pieces = comp(S); pieces.forEach((P, i) => draw(P, PC[i], { alpha: 0.2, label: `P_${i + 1}` })); draw(S, 'blue', { alpha: 0.06 }); }
          else if (o === 'diff') { draw(T, 'red', { alpha: 0.06, edges: true }); pieces = comp(T).map((P) => inter(S, P)).filter(Boolean); pieces.forEach((P, i) => draw(P, PC[i], { alpha: 0.32, label: `P_${i + 1}` })); s.rect(S[0], S[2], S[1], S[3], { color: 'blue', width: 1, dash: [2, 3] }); }
          else { pieces = [S, ...comp(S).map((P) => inter(T, P)).filter(Boolean)]; draw(S, 'blue', { alpha: 0.3 }); pieces.slice(1).forEach((P, i) => draw(P, PC[i], { alpha: 0.32, label: `P_${i + 1}` })); }
          s.tex('S', S[0], S[3], { color: 'blue', align: 'right', baseline: 'bottom', dx: -4, dy: -2 });
          if (o !== 'comp') s.tex('T', T[1], T[3], { color: 'red', align: 'left', baseline: 'bottom', dx: 4, dy: -2 });
          const area = (R) => (R[1] - R[0]) * (R[3] - R[2]), I = inter(S, T);
          const bb = [Math.min(S[0], T[0]), Math.max(S[1], T[1]), Math.min(S[2], T[2]), Math.max(S[3], T[3])];
          info = { o, pieces, isRect: Math.abs(area(bb) - (area(S) + area(T) - (I ? area(I) : 0))) < 1e-9, I };
          v.legend([['ink', 'solid edge: included'], ['ink', 'dashed edge: excluded', { dash: true }]]);
        });
        v.readout(() => {
          const { o, pieces, isRect, I } = info, R = (P) => `(${numTeX(P[0], 1)},${numTeX(P[1], 1)}${P[1] === Infinity ? ')' : ']'}\\times(${numTeX(P[2], 1)},${numTeX(P[3], 1)}${P[3] === Infinity ? ')' : ']'}`;
          if (o === 'cap') return I ? `$S\\cap T=${R(I)}$ is again a half-open rectangle: $\\mathcal S_2$ is closed under intersection.` : '$S\\cap T=\\varnothing$, which also belongs to $\\mathcal S_2$.';
          if (o === 'comp') return `$S^c=P_1+P_2+P_3+P_4$, four disjoint sets of $\\mathcal S_2$: ${pieces.map((P, i) => `$P_${i + 1}=${R(P)}$`).join(', ')}.`;
          if (o === 'diff') return `$S\\setminus T=S\\cap T^c$ is a disjoint union of ${pieces.length} set${pieces.length === 1 ? '' : 's'} of $\\mathcal S_2$ (the intersections of $S$ with the slabs of $T^c$). In general it is not a rectangle.`;
          return `$S\\cup T=S+(T\\setminus S)$, a disjoint union of ${pieces.length} sets of $\\mathcal S_2$. ` + (isRect ? 'Here it happens to be a rectangle.' : 'It is **not** a rectangle, so $\\mathcal S_2$ is not an algebra; finite disjoint unions repair this (Lemma 1.1.7).');
        });
      },
    },
    {
      num: '1.1.7',
      kind: 'Lemma',
      name: 'Finite disjoint unions of a semialgebra form an algebra',
      statement: String.raw`If $\mathcal S$ is a semialgebra, then
$$\bar{\mathcal S}=\{\text{finite disjoint unions of sets in }\mathcal S\}$$
is an algebra, the **algebra generated by** $\mathcal S$. For example (1.1.8), $\bar{\mathcal S}_1$ consists of $\varnothing$ and all finite unions $\bigcup_{i=1}^k(a_i,b_i]$ with $-\infty\le a_i<b_i\le\infty$.`,
      idea: String.raw`If $A=\sum_i S_i$ and $B=\sum_j T_j$ are finite disjoint unions, then $A\cap B=\sum_{i,j}S_i\cap T_j$, and each $S_i\cap T_j$ lies in $\mathcal S$; so $\bar{\mathcal S}$ is closed under intersection. For complements, $A^c=\bigcap_i S_i^c$. Each $S_i^c$ is in $\bar{\mathcal S}$ by the second semialgebra axiom, and closure under intersection (with induction) puts their intersection there too. Unions follow from $A\cup B=(A^c\cap B^c)^c$.`,
      caption: String.raw`Drag the endpoints of $A=S_1+S_2$ (blue) and $B=T_1+T_2$ (red), unions of half-open intervals. Choose an operation and the rows below carry out the proof: they intersect the pieces pairwise, or intersect the complements $S_i^c$. The bottom row is the result, again a finite disjoint union of half-open intervals, written out in the readout.`,
      deps: ['prob-1.1.4a'],
      tags: ['measure', 'sigma-fields'],
      viz(v) {
        const op = v.select('form', [{ value: 'cap', label: '$A\\cap B$' }, { value: 'comp', label: '$A^c$' }, { value: 'cup', label: '$A\\cup B$' }, { value: 'diff', label: '$A\\setminus B$' }], 'cap');
        const s = v.stage({ x: [-2.2, 10.6], y: [-5.45, 1.45], height: 400, axes: false });
        const YA = 0.45, YB = -0.3;
        const mk = (xs, y, col) => { const H = []; xs.forEach((x, i) => H.push(s.handle(x, y, { color: col, r: 5.5, constrain: (px) => [v.M.clamp(px, i ? H[i - 1].x + 0.25 : -0.8, i < xs.length - 1 ? H[i + 1].x - 0.25 : 9.8), y] }))); return H; };
        const hA = mk([0.6, 3.0, 5.0, 7.2], YA + 0.33, 'blue'), hB = mk([1.8, 5.8, 6.6, 9.2], YB - 0.33, 'red');
        const PC = ['teal', 'purple', 'gold', 'pink', 'green', 'orange'];
        let res = [];
        v.render(() => {
          const A = [[hA[0].x, hA[1].x], [hA[2].x, hA[3].x]], B = [[hB[0].x, hB[1].x], [hB[2].x, hB[3].x]], o = op.value;
          for (let x = 0; x <= 10; x += 2) { s.line(x, -5.3, x, 1.1, { color: 'grid', width: 1 }); s.text(String(x), x, 1.28, { size: 10, align: 'center', color: 'muted' }); }
          hA.forEach((h) => s.line(h.x, h.y, h.x, YA, { color: 'blue', width: 1, alpha: 0.5 })); hB.forEach((h) => s.line(h.x, h.y, h.x, YB, { color: 'red', width: 1, alpha: 0.5 }));
          const row = (y, tex, list, col, st) => { s.tex(tex, -2.1, y, { align: 'left', color: typeof col === 'string' ? col : 'ink', size: 14 }); list.forEach((I, i) => halfOpen(s, I[0], I[1], y, typeof col === 'string' ? col : col(i), st)); if (!list.length) s.tex('\\varnothing', 0, y, { color: 'muted', size: 14 }); };
          row(YA, 'A=S_1+S_2', A, 'blue'); row(YB, 'B=T_1+T_2', B, 'red');
          s.line(-2.2, -0.9, 10.6, -0.9, { color: 'faint', width: 1 });
          let y = -1.35;
          if (o === 'cap') {
            const pieces = [];
            for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const p = IV.cap([A[i]], [B[j]]); row(y, `S_${i + 1}\\cap T_${j + 1}`, p, PC[2 * i + j], { width: 3, r: 3 }); p.forEach((I) => pieces.push([I, 2 * i + j])); y -= 0.85; }
            res = pieces.map((q) => q[0]).sort((a, b) => a[0] - b[0]);
            s.line(-2.2, y + 0.42, 10.6, y + 0.42, { color: 'faint', width: 1 });
            s.tex('A\\cap B', -2.1, y - 0.3, { align: 'left', color: 'green', size: 14 }); pieces.forEach(([I, c]) => halfOpen(s, I[0], I[1], y - 0.3, PC[c], { width: 6 }));
          } else if (o === 'comp' || o === 'diff') {
            const P = o === 'comp' ? A : B, nm = o === 'comp' ? 'S' : 'T';
            P.forEach((S, i) => { row(y, `${nm}_${i + 1}^c`, IV.comp1(S), PC[i], { width: 3, r: 3 }); y -= 0.85; });
            const C = IV.comp(P);
            row(y, `${nm}_1^c\\cap ${nm}_2^c`, C, 'orange', { width: 3, r: 3 }); y -= 0.85;
            res = o === 'comp' ? C : IV.cap(A, C);
            s.line(-2.2, y + 0.42, 10.6, y + 0.42, { color: 'faint', width: 1 });
            row(y - 0.3, o === 'comp' ? 'A^c' : 'A\\setminus B', res, 'green', { width: 6 });
          } else {
            const Ac = IV.comp(A), Bc = IV.comp(B), both = IV.cap(Ac, Bc);
            row(y, 'A^c', Ac, 'teal', { width: 3, r: 3 }); y -= 0.85;
            row(y, 'B^c', Bc, 'purple', { width: 3, r: 3 }); y -= 0.85;
            row(y, 'A^c\\cap B^c', both, 'orange', { width: 3, r: 3 }); y -= 0.85;
            res = IV.comp(both);
            s.line(-2.2, y + 0.42, 10.6, y + 0.42, { color: 'faint', width: 1 });
            row(y - 0.3, '(A^c\\cap B^c)^c', res, 'green', { width: 6 });
          }
        });
        v.readout(() => `${{ cap: '$A\\cap B$', comp: '$A^c$', cup: '$A\\cup B$', diff: '$A\\setminus B$' }[op.value]} $=${IV.tex(res)}$: a disjoint union of ${res.length} half-open interval${res.length === 1 ? '' : 's'}, so it lies in $\\bar{\\mathcal S}_1$ again.`);
      },
    },
    {
      num: '1.1.9',
      kind: 'Theorem',
      name: 'Extending a measure from a semialgebra',
      credit: 'Carathéodory, 1918',
      statement: String.raw`Let $\mathcal S$ be a semialgebra and let $\mu:\mathcal S\to[0,\infty]$ satisfy $\mu(\varnothing)=0$ and

(i) if $S\in\mathcal S$ is a finite disjoint union of sets $S_i\in\mathcal S$, then $\mu(S)=\sum_i\mu(S_i)$;
(ii) if $S\in\mathcal S$ is a countable disjoint union $S=\sum_{i\ge1}S_i$ of sets $S_i\in\mathcal S$, then $\mu(S)\le\sum_{i\ge1}\mu(S_i)$.

Then $\mu$ has a unique extension $\bar\mu$ that is a measure on the algebra $\bar{\mathcal S}$ generated by $\mathcal S$. If $\bar\mu$ is σ-finite, there is a unique extension $\nu$ that is a measure on $\sigma(\mathcal S)$.`,
      idea: String.raw`On $\bar{\mathcal S}$ the extension is forced: $\bar\mu(\sum_i S_i)=\sum_i\mu(S_i)$. Condition (i) makes this independent of the decomposition, since two decompositions have a common refinement. Condition (ii) upgrades finite to countable additivity, and Lemma 1.1.10 helps to check it. Carathéodory's construction then defines the outer measure $\mu^*(E)=\inf\{\sum_i\bar\mu(A_i):E\subset\bigcup_iA_i,\ A_i\in\bar{\mathcal S}\}$ and shows it is a measure on a σ-field containing $\sigma(\mathcal S)$; σ-finiteness gives uniqueness. The details are in Appendix A.1.`,
      caption: String.raw`The set function is area on half-open squares of side $2^{-n}$. The green squares inside $E$ form one set of the algebra $\bar{\mathcal S}$, with measure a finite sum. Adding the orange squares that meet the boundary gives a cover of $E$. Raise the level $n$: the inner sums increase and the cover sums decrease to the same number, the measure of $E$. Drag the disc (centre and rim) or switch to a triangle and drag its corners.`,
      deps: ['prob-1.1.7', 'prob-1.1.4a'],
      see: ['prob-10.1.1', 'prob-10.1.3'],
      tags: ['measure', 'extension'],
      viz(v) {
        const shape = v.select('set $E$', [{ value: 'disc', label: 'disc' }, { value: 'tri', label: 'triangle' }], 'disc');
        const lev = v.slider('level $n$ (squares of side $2^{-n}$)', 1, 8, 4, { int: true });
        const sS = v.stage({ x: [-0.03, 1.03], y: [-0.03, 1.03], equal: true, height: 360, axes: false, minWidth: 300 });
        const sP = v.stage({ x: [0.5, 8.5], y: [0, 1.04], height: 360, axes: 'box', gutter: true, xlabel: '$n$', title: 'inner sums, cover sums and the area', minWidth: 260 });
        const C = sS.handle(0.46, 0.5, { color: 'accent', r: 6, constrain: (x, y) => { const r = Math.hypot(Rh.x - C.x, Rh.y - C.y); return [v.M.clamp(x, r + 0.01, 0.99 - r), v.M.clamp(y, r + 0.01, 0.99 - r)]; }, onDrag: () => {} });
        const Rh = sS.handle(0.8, 0.5, { color: 'accent', r: 5, constrain: (x, y) => { const d = Math.hypot(x - C.x, y - C.y) || 1e-9, rmax = Math.min(C.x, C.y, 1 - C.x, 1 - C.y) - 0.01, r = v.M.clamp(d, 0.06, rmax); return [C.x + ((x - C.x) * r) / d, C.y + ((y - C.y) * r) / d]; } });
        let lastC = [C.x, C.y];
        const T = [[0.1, 0.12], [0.9, 0.3], [0.38, 0.9]].map(([x, y]) => sS.handle(x, y, { color: 'accent', r: 6, constrain: { x: [0.01, 0.99], y: [0.01, 0.99] } }));
        const sat = (P, Q) => { for (const poly of [P, Q]) for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length], nx = y2 - y1, ny = x1 - x2; let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity; for (const [x, y] of P) { const t = nx * x + ny * y; a = Math.min(a, t); b = Math.max(b, t); } for (const [x, y] of Q) { const t = nx * x + ny * y; c = Math.min(c, t); d = Math.max(d, t); } if (b <= c || d <= a) return false; } return true; };
        const inTri = (p, t) => { const s1 = Math.sign((t[1][0] - t[0][0]) * (p[1] - t[0][1]) - (t[1][1] - t[0][1]) * (p[0] - t[0][0])), s2 = Math.sign((t[2][0] - t[1][0]) * (p[1] - t[1][1]) - (t[2][1] - t[1][1]) * (p[0] - t[1][0])), s3 = Math.sign((t[0][0] - t[2][0]) * (p[1] - t[2][1]) - (t[0][1] - t[2][1]) * (p[0] - t[2][0])); return (s1 >= 0 && s2 >= 0 && s3 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0); };
        let cache = null;
        function compute() {
          const sh = shape.value, cx = C.x, cy = C.y, r = Math.hypot(Rh.x - C.x, Rh.y - C.y), tri = T.map((h) => [h.x, h.y]);
          const key = sh === 'disc' ? `d${cx.toFixed(4)},${cy.toFixed(4)},${r.toFixed(4)}` : 't' + tri.flat().map((z) => z.toFixed(4)).join(',');
          if (cache && cache.key === key) return cache;
          const inside = sh === 'disc' ? (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].every(([x, y]) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r) : (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].every((p) => inTri(p, tri));
          const meets = sh === 'disc' ? (x0, y0, x1, y1) => (v.M.clamp(cx, x0, x1) - cx) ** 2 + (v.M.clamp(cy, y0, y1) - cy) ** 2 < r * r : (x0, y0, x1, y1) => sat([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], tri);
          const levels = [];
          for (let n = 1; n <= 8; n++) {
            const N = 1 << n, d = 1 / N, cls = new Uint8Array(N * N); let ni = 0, nb = 0;
            for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x0 = i * d, y0 = j * d, c = inside(x0, y0, x0 + d, y0 + d) ? 2 : meets(x0, y0, x0 + d, y0 + d) ? 1 : 0; cls[i * N + j] = c; if (c === 2) ni++; else if (c === 1) nb++; }
            levels.push({ N, cls, ni, nb, inner: ni * d * d, outer: (ni + nb) * d * d });
          }
          const area = sh === 'disc' ? Math.PI * r * r : Math.abs((tri[1][0] - tri[0][0]) * (tri[2][1] - tri[0][1]) - (tri[2][0] - tri[0][0]) * (tri[1][1] - tri[0][1])) / 2;
          cache = { key, levels, area, sh, cx, cy, r, tri };
          return cache;
        }
        v.render(() => {
          const sh = shape.value; C.visible = Rh.visible = sh === 'disc'; T.forEach((h) => (h.visible = sh === 'tri'));
          if (sh === 'disc' && (C.x !== lastC[0] || C.y !== lastC[1])) { Rh.x += C.x - lastC[0]; Rh.y += C.y - lastC[1]; lastC = [C.x, C.y]; }
          const K = compute(), n = lev.value, L = K.levels[n - 1], N = L.N;
          const gIn = v.ramp(0.55, 'green'), gB = v.ramp(0.5, 'orange');
          sS.raster((x, y) => { const i = Math.min(N - 1, Math.floor(x * N)), j = Math.min(N - 1, Math.floor(y * N)); if (x < 0 || y < 0 || x > 1 || y > 1) return null; const c = L.cls[i * N + j]; return c === 2 ? gIn : c === 1 ? gB : null; }, { key: K.key + '|' + n, res: 1, rect: [0, 0, 1, 1] });
          if (n <= 6) for (let k = 0; k <= N; k++) { sS.line(k / N, 0, k / N, 1, { color: 'panel', width: n <= 4 ? 1.4 : 0.8 }); sS.line(0, k / N, 1, k / N, { color: 'panel', width: n <= 4 ? 1.4 : 0.8 }); }
          sS.rect(0, 0, 1, 1, { color: 'muted', width: 1.2 });
          if (sh === 'disc') sS.circle(K.cx, K.cy, K.r, { color: 'ink', width: 2.2 }); else sS.poly(K.tri, { color: 'ink', width: 2.2 });
          sS.tex('E', sh === 'disc' ? K.cx : (K.tri[0][0] + K.tri[1][0] + K.tri[2][0]) / 3, sh === 'disc' ? K.cy + K.r * 0.45 : (K.tri[0][1] + K.tri[1][1] + K.tri[2][1]) / 3, { size: 18 });
          // convergence plot
          const pts = (f) => K.levels.map((Lv, i) => [i + 1, f(Lv)]);
          sP.hline(K.area, { color: 'ink', dash: [5, 4], width: 1.4 });
          sP.vline(n, { color: 'faint', width: 6, alpha: 0.6 });
          sP.path(pts((Lv) => Lv.outer), { color: 'orange', width: 2 }); sP.path(pts((Lv) => Lv.inner), { color: 'green', width: 2 });
          K.levels.forEach((Lv, i) => { sP.dot(i + 1, Lv.outer, { r: i + 1 === n ? 5 : 3, color: 'orange' }); sP.dot(i + 1, Lv.inner, { r: i + 1 === n ? 5 : 3, color: 'green' }); });
          sP.text('λ(E)', 8.4, K.area, { size: 12, align: 'right', baseline: 'bottom', dy: -3 });
          v.legend([['green', 'inner: a set in $\\bar{\\mathcal S}$', { area: true }], ['orange', 'boundary squares (inner + these = a cover)', { area: true }], ['ink', 'area $\\lambda(E)$', { dash: true }]]);
        });
        v.readout(() => {
          const K = compute(), L = K.levels[lev.value - 1];
          return `Level ${lev.value}: ${L.ni} inside squares give $\\bar\\mu=${v.fix(L.inner, 4)}$ $\\le\\lambda(E)=${v.fix(K.area, 4)}\\le$ ${L.ni + L.nb} cover squares, $${v.fix(L.outer, 4)}$. The gap $${v.fix(L.outer - L.inner, 4)}$ is the boundary squares, and it roughly halves at each level.`;
        });
      },
    },
    {
      num: '1.1.10',
      kind: 'Lemma',
      name: 'Additivity and subadditivity on the generated algebra',
      statement: String.raw`Let $\mu$ be a set function on a semialgebra $\mathcal S$ satisfying only condition (i) of Theorem 1.1.9, extended to $\bar{\mathcal S}$ by $\bar\mu(\sum_iS_i)=\sum_i\mu(S_i)$.

(a) If $A,B_1,\dots,B_n\in\bar{\mathcal S}$ and $A=\sum_{i=1}^nB_i$ is a disjoint union, then $\bar\mu(A)=\sum_i\bar\mu(B_i)$.
(b) If $A,B_1,\dots,B_n\in\bar{\mathcal S}$ and $A\subset\bigcup_{i=1}^nB_i$, then $\bar\mu(A)\le\sum_i\bar\mu(B_i)$.`,
      idea: String.raw`(a) Write each $B_i$ as a disjoint union of sets $S_{i,j}$ of $\mathcal S$. Together these pieces decompose $A$, so both sides equal $\sum_{i,j}\mu(S_{i,j})$. (b) For a single set, $B=A+(B\cap A^c)$ gives $\bar\mu(A)\le\bar\mu(B)$. In general, disjointify with $F_k=B_1^c\cap\cdots\cap B_{k-1}^c\cap B_k\in\bar{\mathcal S}$. Then $\bar\mu(A)=\sum_k\bar\mu(A\cap F_k)\le\sum_k\bar\mu(F_k)\le\sum_k\bar\mu(B_k)$ by (a) and the one-set case. This finite inequality is what the compactness argument in Theorem 1.1.4 reduces countable subadditivity to.`,
      caption: String.raw`Masses are increments of a fixed distribution function $F$, whose density and two point masses are sketched above the line. In (a), cut $A=(a,b]$ at the three cuts and press *Regroup*: however the pieces are bundled into sets $B_i$, the stacked bars reach exactly $\bar\mu(A)$. In (b), cover $A$ by $B_1,B_2,B_3$: the rows show the disjoint $F_k$ and $A\cap F_k$, and the bars climb from $\bar\mu(A)$ to $\sum\bar\mu(B_k)$. Drag a $B_k$ away to leave part of $A$ uncovered (red): the hypothesis fails and the inequality can fail with it.`,
      deps: ['prob-1.1.7'],
      see: ['prob-1.1.4'],
      tags: ['measure', 'extension'],
      viz(v) {
        const mode = v.select('', [{ value: 'a', label: '(a) additivity' }, { value: 'b', label: '(b) subadditivity' }], 'b');
        const s = v.stage({ x: [-1.6, 10.3], y: [-4.8, 0.95], height: 380, axes: false, weight: 2 });
        const sB = v.stage({ x: [0.4, 4.6], y: [0, 1], height: 380, axes: 'box', gutter: { l: 36, r: 6, t: 8, b: 26 }, weight: 1, minWidth: 220 });
        const G = (x) => { const t = Math.min(1, Math.max(0, x / 10)); return (0.8 * (1 - Math.cos(Math.PI * t))) / 2; };
        const g = (x) => (x <= 0 || x >= 10 ? 0 : 0.04 * Math.PI * Math.sin((Math.PI * x) / 10));
        const law = mixedLaw(G, g, [[3, 0.08], [6, 0.12]]);
        const mu = (I) => law.mass(I[0], I[1]), muL = (P) => P.reduce((t, I) => t + mu(I), 0);
        const HY = -0.42;
        const ha = s.handle(1.5, HY, { color: 'blue', r: 6, label: 'a', labelPos: 'w', constrain: (x) => [v.M.clamp(x, -0.5, (mode.value === 'a' ? cuts[0].x : hb.x) - 0.15), HY] });
        const hb = s.handle(8.5, HY, { color: 'blue', r: 6, label: 'b', labelPos: 'e', constrain: (x) => [v.M.clamp(x, (mode.value === 'a' ? cuts[2].x : ha.x) + 0.15, 9.9), HY] });
        const cuts = [3.0, 5.2, 6.8].map((x, i) => s.handle(x, HY, { color: 'ink', r: 4.5, constrain: (px) => [v.M.clamp(px, (i ? cuts[i - 1].x : ha.x) + 0.12, (i < 2 ? cuts[i + 1].x : hb.x) - 0.12), HY] }));
        const YB = [-1.25, -2.1, -2.95];
        const BH = [[0.8, 4.2], [3.5, 7.0], [6.2, 9.4]].map(([x0, x1], k) => { const H = []; [x0, x1].forEach((x, i) => H.push(s.handle(x, YB[k] - 0.36, { color: 'orange', r: 5.5, constrain: (px) => [i ? Math.max(px, H[0].x + 0.15) : Math.min(px, H[1] ? H[1].x - 0.15 : px), YB[k] - 0.36] }))); return H; });
        let grp = [0, 1, 0, 2];
        const rb = v.button('Regroup', () => { do { grp = grp.map(() => Math.floor(Math.random() * 3)); } while (new Set(grp).size < 2); });
        const PC = ATOMS.slice(0, 4), GC = ['purple', 'teal', 'pink'], FC = ['green', 'teal', 'gold'];
        let info = {};
        v.render(() => {
          const md = mode.value, a = ha.x, b = hb.x, A = [a, b];
          cuts.forEach((h) => (h.visible = md === 'a')); BH.flat().forEach((h) => (h.visible = md === 'b')); rb.hidden = md !== 'a';
          // the law, sketched above the line
          const gm = 0.04 * Math.PI;
          s.fn((x) => 0.12 + (0.55 * g(x)) / gm, { domain: [0, 10], color: 'blue', width: 1.2, alpha: 0.6, fill: 'blue', fillAlpha: 0.1, base: 0.12 });
          law.atoms.forEach(([c, p]) => s.line(c, 0.12, c, 0.12 + p * 5.5, { color: 'red', width: 2.5, alpha: 0.7 }));
          s.line(-0.6, 0, 10.2, 0, { color: 'faint', width: 1 });
          for (let x = 0; x <= 10; x += 2) s.text(String(x), x, -0.17, { size: 10, align: 'center', color: 'muted' });
          [ha, hb, ...(md === 'a' ? cuts : [])].forEach((h) => s.line(h.x, HY, h.x, 0, { color: 'muted', width: 1, alpha: 0.6 }));
          if (md === 'b') BH.forEach((H, k) => H.forEach((h) => s.line(h.x, h.y, h.x, YB[k], { color: 'orange', width: 1, alpha: 0.6 })));
          const lab = (t, y, col) => s.tex(t, -1.55, y, { align: 'left', color: col, size: 14 });
          lab('A', 0, 'blue');
          if (md === 'a') {
            const ends = [a, ...cuts.map((h) => h.x), b], P = [0, 1, 2, 3].map((j) => [ends[j], ends[j + 1]]);
            P.forEach((I, j) => halfOpen(s, I[0], I[1], 0, PC[j], { width: 5 }));
            const groups = [0, 1, 2].map((k) => P.filter((_, j) => grp[j] === k));
            groups.forEach((Gs, k) => { lab(`B_${k + 1}`, YB[k], GC[k]); Gs.forEach((I) => halfOpen(s, I[0], I[1], YB[k], GC[k], { width: 4 })); if (!Gs.length) s.tex('\\varnothing', 0, YB[k], { color: 'muted' }); });
            s.text('pieces of A bundled into finite disjoint unions B₁, B₂, B₃', -1.5, -3.8, { size: 12, color: 'muted' });
            const mA = mu(A), mB = groups.map(muL), mP = P.map(mu);
            sB.setView(null, [0, mA * 1.2]); sB.setTicks([[1, 'μ(A)'], [2, 'Σ μ(B_i)'], [3, 'Σ μ(S_j)']], null);
            sB.rect(0.7, 0, 1.3, mA, { fill: 'blue', fillAlpha: 0.55, stroke: false });
            let y = 0; mB.forEach((m, k) => { sB.rect(1.7, y, 2.3, y + m, { fill: GC[k], fillAlpha: 0.6, color: 'panel', width: 1 }); y += m; });
            y = 0; mP.forEach((m, j) => { sB.rect(2.7, y, 3.3, y + m, { fill: PC[j], fillAlpha: 0.6, color: 'panel', width: 1 }); y += m; });
            sB.hline(mA, { color: 'blue', dash: [4, 4], width: 1 });
            info = { md, mA, sum: mB.reduce((t, m) => t + m, 0), groups };
          } else {
            const B = BH.map(([h0, h1]) => [h0.x, h1.x]);
            const Fk = B.map((Bk, k) => IV.cap([Bk], IV.comp(B.slice(0, k))));
            const AF = Fk.map((P) => IV.cap([A], P)), unc = IV.cap([A], IV.comp(B));
            halfOpen(s, a, b, 0, 'blue', { width: 5 });
            unc.forEach((I) => halfOpen(s, I[0], I[1], 0, 'red', { width: 7 }));
            B.forEach((Bk, k) => { lab(`B_${k + 1}`, YB[k], 'orange'); halfOpen(s, Bk[0], Bk[1], YB[k], 'orange', { width: 3.5 }); });
            lab('F_k', -3.8, 'green'); Fk.forEach((P, k) => P.forEach((I) => halfOpen(s, I[0], I[1], -3.8, FC[k], { width: 5 })));
            lab('A\\cap F_k', -4.5, 'green'); AF.forEach((P, k) => P.forEach((I) => halfOpen(s, I[0], I[1], -4.5, FC[k], { width: 5 })));
            const mA = mu(A), mAF = AF.map(muL), mF = Fk.map(muL), mB = B.map(mu), tot = mB.reduce((t, m) => t + m, 0);
            sB.setView(null, [0, Math.max(mA, tot) * 1.15]); sB.setTicks([[1, 'μ(A)'], [2, 'Σ μ(A∩F)'], [3, 'Σ μ(F)'], [4, 'Σ μ(B)']], null);
            sB.rect(0.7, 0, 1.3, mA, { fill: 'blue', fillAlpha: 0.55, stroke: false });
            [[2, mAF], [3, mF]].forEach(([x, ms]) => { let y = 0; ms.forEach((m, k) => { sB.rect(x - 0.3, y, x + 0.3, y + m, { fill: FC[k], fillAlpha: 0.6, color: 'panel', width: 1 }); y += m; }); });
            let y = 0; mB.forEach((m) => { sB.rect(3.7, y, 4.3, y + m, { fill: 'orange', fillAlpha: 0.55, color: 'panel', width: 1 }); y += m; });
            sB.hline(mA, { color: 'blue', dash: [4, 4], width: 1 });
            info = { md, mA, mAF: mAF.reduce((t, m) => t + m, 0), mF: mF.reduce((t, m) => t + m, 0), tot, unc: muL(unc), uncLen: unc.length };
          }
        });
        v.readout(() => {
          const I = info;
          if (I.md === 'a') return `$\\bar\\mu(A)=${v.fix(I.mA, 4)}$ and $\\sum_i\\bar\\mu(B_i)=${v.fix(I.sum, 4)}$, whatever the grouping. Each $B_i$ is the union of the pieces of one colour, a finite disjoint union of intervals.`;
          const chain = `$\\bar\\mu(A)=${v.fix(I.mA, 4)}${I.uncLen ? '' : '='}${I.uncLen ? '' : `\\sum_k\\bar\\mu(A\\cap F_k)`}$` + (I.uncLen ? `, but $\\sum_k\\bar\\mu(A\\cap F_k)=${v.fix(I.mAF, 4)}$` : '') + ` $\\le\\sum_k\\bar\\mu(F_k)=${v.fix(I.mF, 4)}\\le\\sum_k\\bar\\mu(B_k)=${v.fix(I.tot, 4)}$.`;
          if (!I.uncLen) return chain + ' The cover overlaps, so the last step loses the overlaps.';
          return chain + ` Part of $A$ (red, mass $${v.fix(I.unc, 4)}$) is not covered, so the lemma does not apply` + (I.mA > I.tot + 1e-9 ? ': indeed $\\bar\\mu(A)>\\sum\\bar\\mu(B_k)$.' : '; here the overlaps still make up for it.');
        });
      },
    },
    {
      num: '1.1.11',
      kind: 'Theorem',
      name: 'Distribution functions on ℝᵈ determine measures',
      statement: String.raw`Let $F:\R^d\to[0,1]$ satisfy

(i) $F$ is nondecreasing: $x\le y$ (coordinatewise) implies $F(x)\le F(y)$;
(ii) $F$ is right-continuous: $F(y)\to F(x)$ as $y\downarrow x$ (each coordinate);
(iii) $F(x_n)\downarrow0$ if every coordinate of $x_n$ decreases to $-\infty$, and $F(x_n)\uparrow1$ if every coordinate increases to $\infty$;
(iv) $\Delta_AF=\sum_{v\in V}\operatorname{sgn}(v)F(v)\ge0$ for every finite rectangle $A=(a_1,b_1]\times\cdots\times(a_d,b_d]$, where $V=\{a_1,b_1\}\times\cdots\times\{a_d,b_d\}$ is its set of vertices and $\operatorname{sgn}(v)=(-1)^{\#\text{ of }a\text{'s in }v}$.

Then there is a unique probability measure $\mu$ on $(\R^d,\mathcal R^d)$ with $\mu(A)=\Delta_AF$ for every finite rectangle $A$.`,
      idea: String.raw`The corner formula is forced by inclusion–exclusion: the mass of $(a,b]$ is the mass of the quadrant below $b$, minus the quadrants below the two lower corners on the boundary, plus the doubly removed one. Condition (iv) is genuinely new in $d\ge2$. Durrett's counterexample, with values $0,\tfrac23,1$, satisfies (i)–(iii) but gives a small square at $(1,1)$ mass $1-\tfrac23-\tfrac23=-\tfrac13$. With (iv), finite additivity is checked on grids, where $\Delta$ telescopes, and countable subadditivity by the compactness argument of Theorem 1.1.4. Theorem 1.1.9 then extends $\mu$. For a product $F=\prod_iF_i$ (Example 1.1.12), $\Delta_AF=\prod_i(F_i(b_i)-F_i(a_i))$.`,
      caption: String.raw`Drag the corners $a$ and $b$ of the rectangle. The four corner values of $F$ are added with the signs shown, and the result $\Delta_AF$ is compared with the fraction of 1500 sampled points that fall inside. Try independent coordinates (a product $F$), a dependent pair (the FGM family, slider $\theta$), the singular law $X=Y$ on the diagonal, and Durrett's counterexample, where small squares at $(1,1)$ get $\Delta_AF<0$ and no measure exists.`,
      deps: ['prob-1.1.9', 'prob-1.1.10', 'prob-1.1.4'],
      tags: ['measure', 'multivariate'],
      viz(v) {
        const law = v.select('$F$', [{ value: 'ind', label: 'product' }, { value: 'fgm', label: 'FGM' }, { value: 'diag', label: '$X=Y$' }, { value: 'bad', label: 'counterexample' }], 'fgm', { onChange: (x) => { if (x === 'bad') { P.set(0.55, 0.6); Q.set(1.12, 1.15); } else if (P.x > 1.05 || Q.x > 1.2) { P.set(0.2, 0.3); Q.set(0.65, 0.75); } } });
        const th = v.slider('$\\theta$', -1, 1, 0.9, { step: 0.05 });
        const s = v.stage({ x: [-0.28, 1.38], y: [-0.25, 1.35], equal: true, height: 400, axes: true, ticks: true, weight: 1.35, minWidth: 320 });
        const sI = v.stage({ x: [-0.28, 1.38], y: [-0.25, 1.35], equal: true, height: 400, axes: false, weight: 1, minWidth: 260, title: 'why the corner signs: net count of each region' });
        const P = s.handle(0.2, 0.3, { color: 'orange', r: 6, label: 'a', labelPos: 'sw', constrain: (x, y) => [Math.min(x, Q.x - 0.03), Math.min(y, Q.y - 0.03)] });
        const Q = s.handle(0.65, 0.75, { color: 'orange', r: 6, label: 'b', labelPos: 'ne', constrain: (x, y) => [Math.max(x, P.x + 0.03), Math.max(y, P.y + 0.03)] });
        const B1 = v.M.dist.beta(2, 2), B2 = v.M.dist.beta(2, 5), cl = (t) => Math.min(1, Math.max(0, t));
        const Fof = (k, t) => ({
          ind: (x, y) => B1.cdf(cl(x)) * B2.cdf(cl(y)),
          fgm: (x, y) => { const u = cl(x), w = cl(y); return u * w * (1 + t * (1 - u) * (1 - w)); },
          diag: (x, y) => cl(Math.min(x, y)),
          bad: (x, y) => (x >= 1 && y >= 1 ? 1 : (x >= 1 && y >= 0) || (y >= 1 && x >= 0) ? 2 / 3 : 0),
        })[k];
        let pts = null, ptsKey = null;
        const sample = (k, t) => {
          const key = k + t; if (ptsKey === key) return pts; ptsKey = key;
          const r = v.rng(11), out = [];
          if (k === 'bad') return (pts = []);
          for (let i = 0; i < 1500; i++) {
            if (k === 'ind') out.push([B1.sample(r), B2.sample(r)]);
            else if (k === 'diag') { const u = r(); out.push([u, u]); }
            else { const u = r(), w = r(), c = t * (1 - 2 * u); out.push([u, Math.abs(c) < 1e-9 ? w : (1 + c - Math.sqrt((1 + c) ** 2 - 4 * c * w)) / (2 * c)]); }
          }
          return (pts = out);
        };
        let info = {};
        v.render(() => {
          const k = law.value, t = th.value, F = Fof(k, t);
          th.el.hidden = k !== 'fgm';
          s.heat(F, { cmap: 'theme', color: 'blue', range: [-0.15, 1.6], res: 3, key: k + t });
          if (k !== 'bad') s.contour(F, [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9], { color: 'blue', width: 1, res: 90 });
          else { [[0.5, 1.22, '2/3'], [1.2, 0.5, '2/3'], [1.2, 1.22, '1'], [0.5, 0.5, '0']].forEach(([x, y, l]) => s.text(l, x, y, { size: 16, align: 'center', color: 'blue', weight: 700 })); s.rect(0, 0, 1, 1, { color: 'blue', width: 1, dash: [3, 3] }); }
          s.axes();
          const a1 = P.x, a2 = P.y, b1 = Q.x, b2 = Q.y;
          const S = sample(k, t); let inn = 0;
          const inPts = [], outPts = [];
          for (const p of S) { const ins = p[0] > a1 && p[0] <= b1 && p[1] > a2 && p[1] <= b2; if (ins) { inn++; inPts.push(p); } else outPts.push(p); }
          s.dots(outPts, { r: 1.6, color: 'muted', alpha: 0.55 }); s.dots(inPts, { r: 2.2, color: 'gold' });
          s.rect(a1, a2, b1, b2, { fill: 'orange', fillAlpha: 0.08, stroke: false });
          s.line(b1, a2, b1, b2, { color: 'orange', width: 2.4 }); s.line(a1, b2, b1, b2, { color: 'orange', width: 2.4 });
          s.line(a1, a2, a1, b2, { color: 'orange', width: 1.6, dash: [5, 4] }); s.line(a1, a2, b1, a2, { color: 'orange', width: 1.6, dash: [5, 4] });
          const cs = [[b1, b2, '+', 'ne'], [a1, b2, '−', 'nw'], [b1, a2, '−', 'se'], [a1, a2, '+', 'sw']];
          let D = 0;
          cs.forEach(([x, y, sg, pos]) => {
            const val = F(x, y); D += (sg === '+' ? 1 : -1) * val;
            const dx = pos.includes('e') ? 8 : -8, dy = pos.includes('n') ? -10 : 10;
            if (pos !== 'ne' && pos !== 'sw') s.dot(x, y, { r: 4, color: 'orange' });
            s.text(`${sg}${v.fix(val, 3)}`, x, y, { size: 12, color: sg === '+' ? 'green' : 'red', align: dx > 0 ? 'left' : 'right', dx: dx + (pos === 'ne' || pos === 'sw' ? (dx > 0 ? 8 : -8) : 0), dy, plate: true, weight: 600 });
          });
          // inclusion–exclusion picture: quadrants below the four corners, with their signs
          const [x0] = sI.bounds.x, [y0] = sI.bounds.y;
          sI.rect(x0, y0, b1, b2, { fill: 'green', fillAlpha: 0.13, stroke: false });
          sI.rect(x0, y0, a1, b2, { fill: 'red', fillAlpha: 0.05, hatch: 'red', hatchAlpha: 0.35, stroke: false });
          sI.rect(x0, y0, b1, a2, { fill: 'red', fillAlpha: 0.05, hatch: 'red', hatchAngle: -45, hatchAlpha: 0.35, stroke: false });
          sI.rect(x0, y0, a1, a2, { fill: 'green', fillAlpha: 0.2, stroke: false });
          sI.rect(a1, a2, b1, b2, { color: 'orange', width: 2.4 });
          [[b1, b2, '+F(b)'], [a1, b2, '−F(a₁,b₂)'], [b1, a2, '−F(b₁,a₂)'], [a1, a2, '+F(a)']].forEach(([x, y, l], i) => { sI.dot(x, y, { r: 3.5, color: 'orange' }); sI.text(l, x, y, { size: 11, color: i % 3 ? 'red' : 'green', align: i % 2 ? 'left' : 'right', dx: i % 2 ? 6 : -6, dy: i < 2 ? -9 : 9 }); });
          const mid = (p, q) => (p + q) / 2;
          sI.text('1', mid(a1, b1), mid(a2, b2), { size: 15, align: 'center', weight: 700, color: 'ink', plate: true });
          sI.text('1−1 = 0', mid(x0, a1), mid(a2, b2), { size: 11, align: 'center', color: 'muted', plate: true });
          sI.text('1−1 = 0', mid(a1, b1), mid(y0, a2), { size: 11, align: 'center', color: 'muted', plate: true });
          sI.text('1−1−1+1 = 0', mid(x0, a1), mid(y0, a2), { size: 11, align: 'center', color: 'muted', plate: true });
          info = { D, inn, n: S.length, k };
          v.legend(k === 'bad' ? [['blue', 'values of $F$ (Durrett, Figure 1.1)']] : [['blue', 'contours of $F$'], ['gold', 'samples inside $(a,b]$', { dot: true }], ['orange', 'the rectangle $A=(a,b]$']]);
        });
        v.readout(() => {
          const { D, inn, n, k } = info;
          if (k === 'bad') return `$\\Delta_AF=F(b_1,b_2)-F(a_1,b_2)-F(b_1,a_2)+F(a_1,a_2)=${v.fix(D, 4)}$.` + (D < -1e-9 ? ' This is **negative**: conditions (i)–(iii) hold, but (iv) fails and no measure can give $A$ this mass.' : ' Move the rectangle so that it contains $(1,1)$ but not $(1,0)$ or $(0,1)$ to get $-\\tfrac13$.');
          const f = inn / n, se = Math.sqrt(Math.max(f * (1 - f), 1e-4) / n);
          return `$\\mu(A)=\\Delta_AF=${v.fix(D, 4)}$; the samples give $${inn}/${n}=${v.fix(f, 4)}\\pm${v.fix(2 * se, 3)}$.` + (k === 'diag' ? ' All the mass sits on the diagonal, a set of area $0$, yet the corner formula still computes it.' : '');
        });
      },
    },
  ],
};
