// Rudin, Real and Complex Analysis — Chapter 2, part 4: Lebesgue measure on R^k (2.19–2.23).

function inPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function polyArea(poly) { let a = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]; return Math.abs(a / 2); }
function tnum(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e5) return String(Number(x.toPrecision(d)));
  const k = Math.floor(Math.log10(a)), m = x / Math.pow(10, k);
  return `${Number(m.toPrecision(d))}\\times 10^{${k}}`;
}
/** Liang–Barsky: does segment pq meet the closed box [x0,x1]×[y0,y1]? */
function segHitsBox(p, q, x0, y0, x1, y1) {
  let t0 = 0, t1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
  const P = [-dx, dx, -dy, dy], Q = [p[0] - x0, x1 - p[0], p[1] - y0, y1 - p[1]];
  for (let i = 0; i < 4; i++) {
    if (P[i] === 0) { if (Q[i] < 0) return false; }
    else { const r = Q[i] / P[i]; if (P[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } }
  }
  return true;
}
/** 'in' | 'out' | 'bd' for the box [x0,x0+s)×[y0,y0+s) relative to the set bounded by polys */
function classifyBox(polys, inside, x0, y0, s) {
  const x1 = x0 + s, y1 = y0 + s;
  for (const poly of polys) for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j], b = poly[i];
    if (Math.max(a[0], b[0]) < x0 || Math.min(a[0], b[0]) > x1 || Math.max(a[1], b[1]) < y0 || Math.min(a[1], b[1]) > y1) continue;
    if (segHitsBox(a, b, x0, y0, x1, y1)) return 'bd';
  }
  return inside([x0 + s / 2, y0 + s / 2]) ? 'in' : 'out';
}
/**
 * Rudin's decomposition (2.19 d): boxes of Ω_1, then of Ω_2 not inside earlier ones, … up to level nmax.
 * Returns {chosen: [[x0,y0,s,level]], bd: [[x0,y0,s]]} (bd = boundary boxes still undecided at level nmax).
 */
function dyadic(polys, inside, bbox, nmax, n0 = 1) {
  const s0 = Math.pow(2, -n0);
  let cand = [];
  for (let x = Math.floor(bbox[0] / s0) * s0; x < bbox[2]; x += s0) for (let y = Math.floor(bbox[1] / s0) * s0; y < bbox[3]; y += s0) cand.push([x, y]);
  const chosen = []; let bd = [];
  for (let n = n0; n <= nmax; n++) {
    const s = Math.pow(2, -n); bd = [];
    for (const [x, y] of cand) { const c = classifyBox(polys, inside, x, y, s); if (c === 'in') chosen.push([x, y, s, n]); else if (c === 'bd') bd.push([x, y, s]); }
    if (n < nmax) { cand = []; for (const [x, y] of bd) { const h = s / 2; cand.push([x, y], [x + h, y], [x, y + h], [x + h, y + h]); } }
  }
  return { chosen, bd };
}
function fatCantor(level) { // Smith–Volterra–Cantor: at step k remove the middle open interval of length 4^-k from each piece
  let I = [[0, 1]];
  for (let k = 1; k <= level; k++) { const g = Math.pow(4, -k); I = I.flatMap(([a, b]) => { const m = (a + b) / 2; return [[a, m - g / 2], [m + g / 2, b]]; }); }
  return I;
}
const LEVEL_COLS = ['accent', 'teal', 'green', 'gold', 'orange', 'pink', 'purple', 'red'];

export default {
  collection: 'rca',
  chapter: 2,
  items: [
    // ------------------------------------------------------------ 2.19
    {
      num: '2.19',
      kind: 'Definition',
      name: 'Euclidean space, k-cells and dyadic boxes',
      statement: String.raw`$\R^k$ carries the inner product $x\cdot y=\sum_i\xi_i\eta_i$ and the metric $|x-y|$. A *$k$-cell* is a set $W=\{x:\alpha_i<\xi_i<\beta_i,\ 1\le i\le k\}$ (or the same with some or all of the $<$ replaced by $\le$), with volume $\operatorname{vol}(W)=\prod_i(\beta_i-\alpha_i)$. For $\delta>0$, a *$\delta$-box* is $\{x:\alpha_i\le\xi_i<\alpha_i+\delta\}$. Let $\Omega_n$ be the collection of $2^{-n}$-boxes whose corners have coordinates in $2^{-n}\Z$. Then:
(a) for fixed $n$, every $x\in\R^k$ lies in exactly one member of $\Omega_n$;
(b) if $Q'\in\Omega_n$, $Q''\in\Omega_r$ and $r<n$, then either $Q'\subset Q''$ or $Q'\cap Q''=\emptyset$;
(c) each $Q\in\Omega_r$ has volume $2^{-rk}$ and, for $n>r$, contains exactly $2^{(n-r)k}$ boxes of $\Omega_n$;
(d) every nonempty open set in $\R^k$ is a countable union of disjoint boxes from $\Omega_1\cup\Omega_2\cup\cdots$.`,
      idea: String.raw`For (d): every point $x$ of an open $V$ lies in boxes of $\Omega_n$ of diameter $2^{-n}\sqrt k$, which fit inside $V$ once $n$ is large. Take all boxes of $\Omega_1$ inside $V$, then the boxes of $\Omega_2$ inside $V$ but not inside a box already chosen, and so on. Property (b) makes the chosen boxes disjoint, and every point of $V$ is eventually caught.`,
      caption: String.raw`An open set $V$ (with a hole) and Rudin's decomposition into dyadic boxes: first every box of $\Omega_1$ inside $V$, then the boxes of $\Omega_2$ not already covered, and so on, coloured by level. Raise the depth: the chosen boxes stay disjoint and their total area climbs to the area of $V$. The faint red boxes are the ones still undecided along $\partial V$.`,
      deps: [],
      see: ['pma-11.8'],
      tags: ['Euclidean space', 'dyadic boxes'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.15, 2.15], y: [-1.45, 1.45], equal: true, height: 380, axes: false, full: true });
        const depth = v.slider('depth $n$', 1, 8, 5, { int: true });
        const outer = M.blob(0.0, 0.0, 1.25, 41, 0.28, 140), hole = M.blob(0.35, 0.15, 0.36, 3, 0.25, 70);
        const inside = (p) => inPoly(p, outer) && !inPoly(p, hole);
        const area = polyArea(outer) - polyArea(hole);
        const cache = {};
        let st = {};
        v.render(() => {
          const n = depth.value;
          const D = cache[n] ||= dyadic([outer, hole], inside, [-2, -1.5, 2, 1.5], n);
          // faint grid of Ω_1
          for (let x = -2; x <= 2; x += 0.5) S.line(x, -1.5, x, 1.5, { color: 'grid', width: 1 });
          for (let y = -1.5; y <= 1.5; y += 0.5) S.line(-2, y, 2, y, { color: 'grid', width: 1 });
          for (const [x, y, s, lv] of D.chosen) S.rect(x, y, x + s, y + s, { fill: LEVEL_COLS[(lv - 1) % 8], fillAlpha: 0.45, color: LEVEL_COLS[(lv - 1) % 8], width: s > 0.05 ? 1.2 : 0.6 });
          for (const [x, y, s] of D.bd) S.rect(x, y, x + s, y + s, { color: 'red', width: 0.6, alpha: 0.5 });
          S.poly(outer, { color: 'ink', width: 2 }); S.poly(hole, { color: 'ink', width: 2 });
          S.tex('V', 1.18, 1.0, { color: 'ink', size: 18 });
          const counts = []; let covered = 0;
          for (const [, , s, lv] of D.chosen) { counts[lv] = (counts[lv] || 0) + 1; covered += s * s; }
          st = { counts, covered, n, bdA: D.bd.reduce((a, [, , s]) => a + s * s, 0) };
        });
        v.legend(M.range(8).map((i) => [LEVEL_COLS[i], `$\\Omega_${i + 1}$`, { area: true }]));
        v.readout(() => `Boxes chosen per level: ${st.counts.map((c, i) => (c ? `$\\Omega_{${i}}$: ${c}` : null)).filter(Boolean).join(', ')}. Total area $${v.fix(st.covered, 4)}$ of $m(V)=${v.fix(area, 4)}$; the undecided boundary boxes have area $${v.fix(st.bdA, 4)}$, which halves with each level.`);
      },
    },
    // ------------------------------------------------------------ 2.20
    {
      num: '2.20',
      kind: 'Theorem',
      name: 'Existence and properties of Lebesgue measure',
      credit: 'Lebesgue, 1902',
      statement: String.raw`There is a positive complete measure $m$ on a $\sigma$-algebra $\mathfrak M$ in $\R^k$ such that:
(a) $m(W)=\operatorname{vol}(W)$ for every $k$-cell $W$;
(b) $\mathfrak M$ contains all Borel sets: in fact $E\in\mathfrak M$ exactly when there are an $F_\sigma$ set $A$ and a $G_\delta$ set $B$ with $A\subset E\subset B$ and $m(B-A)=0$; and $m$ is regular;
(c) $m$ is translation invariant: $m(E+x)=m(E)$ for all $E\in\mathfrak M$, $x\in\R^k$;
(d) if $\mu$ is a positive translation-invariant Borel measure on $\R^k$ with $\mu(K)<\infty$ for every compact $K$, then $\mu(E)=c\,m(E)$ for some constant $c$ and all Borel sets $E$;
(e) for every linear map $T:\R^k\to\R^k$ there is a number $\Delta(T)\ge0$ with $m(T(E))=\Delta(T)\,m(E)$ for all $E\in\mathfrak M$; in particular $m(T(E))=m(E)$ when $T$ is a rotation.`,
      idea: String.raw`Apply the Riesz theorem 2.14 to $\Lambda f=\int f$, the Riemann integral on $C_c(\R^k)$. Squeezing $\chi_W$ between continuous functions gives (a), and 2.17 with completeness (2.14(e)) gives (b). Translation invariance of $\Lambda$ and (a) give $m(E+x)=m(E)$ on boxes, hence on open sets by 2.19(d), hence everywhere by regularity. For (d), invariance forces $\mu(Q)=2^{-nk}\mu(Q_0)$ for every $Q\in\Omega_n$, so $\mu=c\,m$ on open sets and then, by 2.18, on all Borel sets. Part (e) applies (d) to $E\mapsto m(T(E))$.`,
      caption: String.raw`Lebesgue measure through dyadic boxes. For $E$ (left) and its translate $E+x$ (drag the handle), boxes of $\Omega_n$ inside the set are green and boxes meeting the boundary are orange. The fixed grid cuts the two sets very differently. Still, the inner sums (green) and outer sums (green plus orange) of both sets squeeze to the same number as $n$ grows: translation invariance (c), computed.`,
      deps: ['rca-2.14', 'rca-2.17', 'rca-2.18', 'rca-2.19'],
      see: ['pma-11.8', 'rca-2.23', 'rca-7.26'],
      tags: ['Lebesgue measure', 'translation invariance'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.6, 3.0], y: [-1.35, 1.35], equal: true, height: 360, axes: false, full: true });
        const depth = v.slider('level $n$', 1, 6, 3, { int: true });
        const base = M.blob(0, 0, 0.82, 52, 0.3, 120).map(([x, y]) => [x - 1.25, y]);
        const hx = S.handle(1.53, 0.17, { color: 'gold', label: 'x' });
        const cache = new Map();
        const sums = (poly, n) => {
          const key = `${poly[0][0].toFixed(4)},${poly[0][1].toFixed(4)},${n}`;
          if (cache.has(key)) return cache.get(key);
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
          const D = dyadic([poly], (p) => inPoly(p, poly), [x0 - 0.01, y0 - 0.01, x1 + 0.01, y1 + 0.01], n, 0);
          const lo = D.chosen.reduce((a, [, , s]) => a + s * s, 0), hi = lo + D.bd.reduce((a, [, , s]) => a + s * s, 0);
          const r = { D, lo, hi }; if (cache.size > 60) cache.clear(); cache.set(key, r); return r;
        };
        const exact = polyArea(base);
        let st = {};
        v.render(() => {
          const n = depth.value, s = Math.pow(2, -n);
          const shift = [hx.x + 1.25, hx.y]; // the translation vector x moves the centre of E to the handle
          const moved = base.map(([x, y]) => [x + shift[0], y + shift[1]]);
          // grid
          for (let x = Math.ceil(-2.6 / s) * s; x <= 3.0; x += s) S.line(x, -1.35, x, 1.35, { color: 'grid', width: 1 });
          for (let y = Math.ceil(-1.35 / s) * s; y <= 1.35; y += s) S.line(-2.6, y, 3.0, y, { color: 'grid', width: 1 });
          const A = sums(base, n), B = sums(moved, n);
          for (const R of [A, B]) {
            for (const [x, y, ss] of R.D.chosen) S.rect(x, y, x + ss, y + ss, { fill: 'green', fillAlpha: 0.38, stroke: false });
            for (const [x, y, ss] of R.D.bd) S.rect(x, y, x + ss, y + ss, { fill: 'orange', fillAlpha: 0.33, stroke: false });
          }
          S.poly(base, { color: 'accent', width: 2.2 });
          S.poly(moved, { color: 'accent', width: 2.2, dash: [6, 4] });
          S.arrow(-1.25, 0.0, -1.25 + shift[0], shift[1], { color: 'gold', width: 1.6, head: 10, dash: [4, 4] });
          S.tex('E', -1.25 - 0.95, 0.75, { color: 'accent', size: 17 });
          S.tex('E+x', -1.25 + shift[0] + 0.95, shift[1] + 0.75, { color: 'accent', size: 17 });
          st = { A, B, n };
        });
        v.legend([['green', 'boxes of $\\Omega_n$ inside the set', { area: true }], ['orange', 'boxes meeting the boundary', { area: true }], ['accent', '$E$ and $E+x$']]);
        v.readout(() => `Level ${st.n}: $\\;${v.fix(st.A.lo, 4)}\\le m(E)\\le ${v.fix(st.A.hi, 4)}$ and $\\;${v.fix(st.B.lo, 4)}\\le m(E+x)\\le ${v.fix(st.B.hi, 4)}$. Both brackets close in on $${v.fix(exact, 4)}$.`);
      },
    },
    // ------------------------------------------------------------ 2.21
    {
      num: '2.21',
      kind: 'Definition',
      name: 'Lebesgue measurable sets and Lebesgue measure',
      credit: 'Lebesgue, 1902',
      statement: String.raw`The members of the $\sigma$-algebra $\mathfrak M$ of Theorem 2.20 are the *Lebesgue measurable* subsets of $\R^k$, and $m$ is *Lebesgue measure* on $\R^k$; a function is Lebesgue measurable if it is measurable with respect to $\mathfrak M$. Because $m$ is complete, every subset of a set of measure $0$ is Lebesgue measurable. Consequently $\mathfrak M$ is strictly larger than the Borel $\sigma$-algebra. For example, the Cantor set has measure $0$ but the cardinality of $\R$, so it alone has $2^{\mathfrak c}$ measurable subsets, while there are only $\mathfrak c$ Borel sets.`,
      idea: String.raw`Completeness comes from 2.14(e). The Cantor set $C$ is covered by $2^n$ intervals of total length $(2/3)^n$ for every $n$, so $m(C)=0$, yet $C$ is uncountable. A cardinality count then shows that some Lebesgue measurable sets are not Borel.`,
      caption: String.raw`The Cantor set at stage $n$: $2^n$ closed intervals of total length $(2/3)^n$, which tends to $0$. The gold points form an arbitrary subset of $C$ (resample it). By completeness every such subset is Lebesgue measurable with measure $0$, no matter how wild it is.`,
      deps: ['rca-2.20', 'rca-1.36'],
      tags: ['Lebesgue measure', 'completeness', 'Cantor set'],
      verify: true,
      viz(v) {
        const M = v.M;
        const lev = v.slider('stage $n$', 0, 9, 4, { int: true });
        const S = v.stage({ x: [-0.03, 1.03], y: [-0.2, 1.1], height: 230, axes: false, full: true });
        let seed = 3;
        v.button('Resample the subset', () => { seed++; });
        let st = {};
        v.render(() => {
          const gap = 0.8 / Math.max(lev.value, 4);
          for (let k = 0; k <= Math.min(lev.value, 9); k++) {
            const y = 1 - k * gap;
            for (const [a, b] of M.cantorIntervals(k)) S.line(a, y, b, y, { color: k === lev.value ? 'accent' : 'faint', width: k === lev.value ? 7 : 4, cap: 'butt' });
          }
          // a random subset of C: points with random ternary digits in {0,2}
          const R = M.rng(seed), pts = [];
          for (let i = 0; i < 90; i++) { let x = 0, p = 1; for (let d = 0; d < 26; d++) { p /= 3; if (R() < 0.5) x += 2 * p; } pts.push([x, -0.08]); }
          S.line(0, -0.08, 1, -0.08, { color: 'faint', width: 1 });
          S.dots(pts, { color: 'gold', r: 2.6 });
          S.tex('A\\subset C', 1.02, -0.08, { color: 'gold', align: 'right', dy: -14, size: 13 });
          st = { n: lev.value, L: Math.pow(2 / 3, lev.value) };
        });
        v.readout(() => `Stage ${st.n}: $2^{${st.n}}=${2 ** st.n}$ intervals of total length $(2/3)^{${st.n}}=${v.fix(st.L, 4)}$. So $m(C)=0$, and every $A\\subset C$ satisfies $A\\in\\mathfrak M$ with $m(A)=0$.`);
      },
    },
    // ------------------------------------------------------------ 2.22
    {
      num: '2.22',
      kind: 'Theorem',
      name: 'Sets all of whose subsets are measurable are null',
      credit: 'Vitali, 1905',
      statement: String.raw`If $A\subset\R$ and every subset of $A$ is Lebesgue measurable, then $m(A)=0$.`,
      idea: String.raw`Choose a set $E$ containing exactly one point of each coset $x+\Q$ (axiom of choice). The translates $E+r$, $r\in\Q$, are disjoint and cover $\R$, so $A=\bigcup_r A\cap(E+r)$. Fix $t$, let $B\subset A\cap(E+t)$ be bounded, and suppose $B$ is measurable. Its translates $B+r$ for rational $r\in[0,1]$ are disjoint, all lie in one bounded interval, and all have measure $m(B)$. Countable additivity then forces $m(B)=0$, and a countable union of null sets is null.`,
      caption: String.raw`The circle $\R/\Z$, with a schematic stand-in for a bounded piece $B$ of a Vitali-type set; a genuine one cannot be drawn. Its rotations by the rationals $p/q$ with $q\le N$ are pairwise disjoint and lie in a set of measure $1$. So $K_N\cdot m(B)\le1$, where $K_N$ is the number of rotations. Raise $N$: the bound $1/K_N$ collapses to $0$, so a measurable $B$ must be null.`,
      deps: ['rca-2.20'],
      see: ['rca-2.22a'],
      tags: ['nonmeasurable', 'Lebesgue measure'],
      viz(v) {
        const M = v.M;
        const N = v.slider('largest denominator $N$', 1, 14, 5, { int: true });
        const C = v.stage({ x: [-1.25, 1.25], y: [-1.2, 1.2], equal: true, height: 340, axes: false, minWidth: 300, title: 'disjoint rotations $B+p/q$ on $\\R/\\Z$' });
        const P = v.stage({ x: [0.3, 14.7], y: [-0.08, 1.08], height: 340, axes: 'box', minWidth: 260, title: 'forced bound $m(B)\\le 1/K_N$', xticks: [1, 2, 4, 6, 8, 10, 12, 14] });
        const R = M.rng(17); const B = M.range(14).map(() => R.uniform(0, 0.11)).concat(M.range(6).map(() => R.uniform(0.3, 0.33)));
        const rats = (n) => { const out = []; for (let q = 1; q <= n; q++) for (let p = 0; p < q; p++) { let a = p, b = q; while (b) [a, b] = [b, a % b]; if (a === 1 || p === 0 && q === 1) out.push(p / q); } return out; };
        const COLS = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
        let st = {};
        v.render(() => {
          const rs = rats(N.value);
          C.circle(0, 0, 1, { color: 'faint', width: 6 });
          rs.forEach((r, i) => {
            const col = COLS[i % COLS.length];
            const pts = B.map((b) => { const t = 2 * Math.PI * (b + r); return [Math.cos(t), Math.sin(t)]; });
            C.dots(pts, { color: col, r: i === 0 ? 3.2 : 2.4, alpha: i === 0 ? 1 : 0.85 });
          });
          C.tex('B', Math.cos(0.4), Math.sin(0.4), { color: 'accent', dx: 14, dy: -8, size: 15 });
          C.corner(`${rs.length} disjoint rotations`, 'bl', { color: 'muted' });
          // bound plot
          const pts = M.range(14).map((i) => [i + 1, 1 / rats(i + 1).length]);
          P.path(pts, { color: 'faint', width: 1.2 });
          for (const [x, y] of pts) P.dot(x, y, { color: x === N.value ? 'gold' : 'accent', r: x === N.value ? 6 : 3.5 });
          st = { K: rs.length };
        });
        v.legend([['accent', 'stand-in for $B$', { dot: true }], ['orange', 'its rational rotations', { dot: true }], ['gold', 'current bound $1/K_N$', { dot: true }]]);
        v.readout(() => `$K_N=${st.K}$ disjoint translates of equal measure inside a set of measure $1$, so $m(B)\\le 1/${st.K}=${v.fix(1 / st.K, 4)}$. Letting $N\\to\\infty$ gives $m(B)=0$.`);
      },
    },
    // ------------------------------------------------------------ 2.22a
    {
      num: '2.22a',
      kind: 'Corollary',
      name: 'Every set of positive measure has a nonmeasurable subset',
      statement: String.raw`Every Lebesgue measurable set $A\subset\R$ with $m(A)>0$ contains a subset that is not Lebesgue measurable.`,
      idea: String.raw`This is the contrapositive of Theorem 2.22: if all subsets of $A$ were measurable, $m(A)$ would be $0$. So positive measure, however thinly spread, always hides a nonmeasurable piece. Measure zero is the only exception, by completeness (2.21).`,
      caption: String.raw`Compare the middle-thirds Cantor set with a "fat" Cantor set, which removes intervals of length $4^{-k}$ at step $k$. Both are compact, nowhere dense and uncountable. The thin one has measure $0$, so every subset is measurable. The fat one keeps measure $\tfrac12$, so by 2.22 it must contain nonmeasurable subsets, even though it contains no interval at all.`,
      deps: ['rca-2.22'],
      tags: ['nonmeasurable', 'Cantor set'],
      viz(v) {
        const M = v.M;
        const lev = v.slider('stage $n$', 1, 10, 5, { int: true });
        const S = v.stage({ x: [-0.03, 1.03], y: [-0.2, 1.25], height: 280, axes: false, minWidth: 320, weight: 1.4 });
        const P = v.stage({ x: [0.4, 10.6], y: [0, 1.05], height: 280, axes: 'box', minWidth: 240, title: 'measure after $n$ steps', xticks: [2, 4, 6, 8, 10] });
        let st = {};
        v.render(() => {
          const n = lev.value;
          const thin = M.cantorIntervals(n), fat = fatCantor(n);
          S.text('middle-thirds Cantor set C', 0, 1.13, { color: 'muted', size: 12 });
          S.text('fat Cantor set F', 0, 0.48, { color: 'muted', size: 12 });
          for (const [a, b] of thin) S.rect(a, 0.78, b, 1.0, { fill: 'red', fillAlpha: 0.7, stroke: false });
          for (const [a, b] of fat) S.rect(a, 0.13, b, 0.35, { fill: 'accent', fillAlpha: 0.75, stroke: false });
          S.text(`m = ${v.fmt((2 / 3) ** n, 3)} → 0`, 1.0, 0.68, { color: 'red', size: 12, align: 'right', weight: 600 });
          const fm = fat.reduce((s, [a, b]) => s + b - a, 0);
          S.text(`m = ${fm.toFixed(4)} → 1/2`, 1.0, 0.03, { color: 'accent', size: 12, align: 'right', weight: 600 });
          P.hline(0.5, { color: 'accent', dash: [5, 4], width: 1.2 });
          P.hline(0, { color: 'red', dash: [5, 4], width: 1.2 });
          const tp = M.range(10).map((i) => [i + 1, (2 / 3) ** (i + 1)]), fp = M.range(10).map((i) => [i + 1, 0.5 + 2 ** -(i + 2)]);
          P.path(tp, { color: 'red', width: 2 }); P.path(fp, { color: 'accent', width: 2 });
          P.dot(n, (2 / 3) ** n, { color: 'red', r: 5 }); P.dot(n, 0.5 + 2 ** -(n + 2), { color: 'accent', r: 5 });
          st = { fm, n };
        });
        v.legend([['red', 'Cantor set $C$: every subset measurable'], ['accent', 'fat Cantor set: contains nonmeasurable subsets']]);
        v.readout(() => `After ${st.n} steps the fat set has measure $${v.fix(st.fm, 4)}$, and in the limit exactly $\\tfrac12>0$. Theorem 2.22 forbids all of its subsets from being measurable.`);
      },
    },
    // ------------------------------------------------------------ 2.23
    {
      num: '2.23',
      kind: 'Proposition',
      name: 'Linear maps scale Lebesgue measure by |det T|',
      statement: String.raw`The constant $\Delta(T)$ of Theorem 2.20(e) is $|\det T|$: for every linear $T:\R^k\to\R^k$ and every Lebesgue measurable $E$,
$$m(T(E))=|\det T|\,m(E).$$`,
      idea: String.raw`Both sides are multiplicative in $T$ ($\Delta(T_1T_2)=\Delta(T_1)\Delta(T_2)$), and every invertible $T$ is a product of elementary maps: scaling one coordinate, swapping two coordinates, and a shear. For each of these $\Delta$ can be computed directly on the unit cube, and it equals $|\det|$. A singular $T$ maps $\R^k$ into a proper subspace, which has measure $0$.`,
      caption: String.raw`Left: a set $E$ with its dyadic boxes. Right: $T(E)$ and the images of the same boxes, which are parallelograms each of area $|\det T|$ times the area of the box. Drag the gold arrows $Te_1$ and $Te_2$. Every box is scaled by the same factor, so $m(T(E))/m(E)=|\det T|$ whatever the shape. Make the arrows parallel and everything collapses to measure $0$.`,
      deps: ['rca-2.20'],
      see: ['pma-10.9', 'rca-7.26'],
      tags: ['Lebesgue measure', 'determinant'],
      verify: true,
      viz(v) {
        const M = v.M;
        const shape = v.select('$E$', [{ value: 'blob', label: 'blob' }, { value: 'disc', label: 'disc' }, { value: 'L', label: 'L-shape' }], 'blob');
        const depth = v.slider('box level $n$', 1, 6, 4, { int: true });
        const L = v.stage({ x: [-1.45, 1.45], y: [-1.45, 1.45], equal: true, height: 330, axes: false, minWidth: 280, title: '$E$ and its dyadic boxes' });
        const R = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 330, axes: false, minWidth: 280, title: '$T(E)$ and the images of the boxes' });
        const e1 = R.handle(1.3, 0.25, { color: 'gold', label: 'Te₁' });
        const e2 = R.handle(0.55, 0.95, { color: 'gold', label: 'Te₂' });
        const SH = {
          blob: M.blob(0.05, 0, 0.95, 64, 0.3, 120),
          disc: M.range(120).map((i) => [1.0 * Math.cos(2 * Math.PI * i / 120), 1.0 * Math.sin(2 * Math.PI * i / 120)]),
          L: [[-0.97, -0.98], [1.02, -0.98], [1.02, -0.27], [-0.28, -0.27], [-0.28, 1.03], [-0.97, 1.03]],
        };
        const cache = {};
        let st = {};
        v.render(() => {
          const P = SH[shape.value], n = depth.value;
          const key = shape.value + n;
          const D = cache[key] ||= dyadic([P], (p) => inPoly(p, P), [-1.3, -1.3, 1.3, 1.3], n, 0);
          const T = ([x, y]) => [e1.x * x + e2.x * y, e1.y * x + e2.y * y];
          const det = e1.x * e2.y - e2.x * e1.y;
          for (const [x, y, s, lv] of D.chosen) {
            const col = LEVEL_COLS[lv % 8];
            L.rect(x, y, x + s, y + s, { fill: col, fillAlpha: 0.45, color: col, width: 0.6 });
            R.poly([T([x, y]), T([x + s, y]), T([x + s, y + s]), T([x, y + s])], { fill: col, fillAlpha: 0.45, color: col, width: 0.6 });
          }
          L.poly(P, { color: 'ink', width: 2 }); R.poly(P.map(T), { color: 'ink', width: 2 });
          L.arrow(0, 0, 1, 0, { color: 'muted', width: 1.4, head: 8 }); L.arrow(0, 0, 0, 1, { color: 'muted', width: 1.4, head: 8 });
          R.arrow(0, 0, e1.x, e1.y, { color: 'gold', width: 2, head: 10 }); R.arrow(0, 0, e2.x, e2.y, { color: 'gold', width: 2, head: 10 });
          const mE = polyArea(P), mT = polyArea(P.map(T));
          const boxes = D.chosen.reduce((a, [, , s]) => a + s * s, 0);
          st = { det, mE, mT, boxes };
        });
        v.legend([['ink', 'boundary of $E$ and of $T(E)$'], ['gold', 'columns $Te_1,\\,Te_2$ of $T$']]);
        v.readout(() => `$|\\det T|=${v.fix(Math.abs(st.det), 4)}$. Boxes: $\\sum|Q|=${v.fix(st.boxes, 4)}$, $\\sum|T(Q)|=${v.fix(Math.abs(st.det) * st.boxes, 4)}$. Exactly: $m(E)=${v.fix(st.mE, 4)}$, $m(T(E))=${v.fix(st.mT, 4)}$, ratio $${st.mE > 0 ? v.fix(st.mT / st.mE, 4) : '—'}$.`);
      },
    },
  ],
};
