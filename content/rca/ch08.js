// Rudin, Real and Complex Analysis — Chapter 8: Integration on Product Spaces

// ---------------------------------------------------------------- shared helpers: sections of planar sets
// A "shape" is a list of closed polygons combined by the even–odd rule (so a ring inside a ring is a hole);
// a "set" is a list of shapes whose union is meant. axis = 0 cuts by the vertical line {x = c} (returns
// y-intervals), axis = 1 cuts by the horizontal line {y = c} (returns x-intervals).
function crossings(ring, c, axis) {
  const o = 1 - axis, out = [];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const p = ring[j], q = ring[i];
    if ((p[axis] > c) !== (q[axis] > c)) out.push(p[o] + (c - p[axis]) * (q[o] - p[o]) / (q[axis] - p[axis]));
  }
  return out;
}
function mergeIv(ivs) {
  const s = ivs.filter(([a, b]) => b > a).sort((u, w) => u[0] - w[0]), out = [];
  for (const [a, b] of s) { const l = out[out.length - 1]; if (l && a <= l[1] + 1e-12) l[1] = Math.max(l[1], b); else out.push([a, b]); }
  return out;
}
function shapeSection(rings, c, axis) {
  const t = rings.flatMap((r) => crossings(r, c, axis)).sort((a, b) => a - b), out = [];
  for (let k = 0; k + 1 < t.length; k += 2) out.push([t[k], t[k + 1]]);
  return out;
}
const section = (set, c, axis) => mergeIv(set.flatMap((sh) => shapeSection(sh, c, axis)));
const ivLen = (ivs) => ivs.reduce((s, [a, b]) => s + b - a, 0);
/** Complement of a union of intervals inside [lo, hi]. */
function complementIv(ivs, lo = 0, hi = 1) {
  const out = []; let p = lo;
  for (const [a, b] of ivs) { if (a > p) out.push([p, Math.min(a, hi)]); p = Math.max(p, b); }
  if (p < hi) out.push([p, hi]);
  return out.filter(([a, b]) => b - a > 1e-9);
}
/** TeX for a finite union of intervals, e.g. [0.12, 0.40] ∪ [0.55, 0.81]. */
function ivTeX(ivs, d = 2) {
  if (!ivs.length) return '\\varnothing';
  const f = (x) => x.toFixed(d);
  const parts = ivs.slice(0, 4).map(([a, b]) => `[${f(a)},\\,${f(b)}]`);
  return parts.join('\\cup') + (ivs.length > 4 ? '\\cup\\cdots' : '');
}
const discRing = (cx, cy, r, n = 180) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), cy + r * Math.sin((2 * Math.PI * i) / n)]);
/** Midpoint-rule integral over [0,1] of a function of one variable (N cells). */
const avg01 = (g, N = 1000) => { let s = 0; for (let i = 0; i < N; i++) s += g((i + 0.5) / N); return s / N; };
/** Draw a union of intervals along a vertical (axis 0, at x = c) or horizontal (axis 1, at y = c) line. */
function drawIv(S, ivs, c, axis, st) {
  for (const [a, b] of ivs) {
    if (axis === 0) S.line(c, a, c, b, { cap: 'butt', ...st });
    else S.line(a, c, b, c, { cap: 'butt', ...st });
  }
}

export default {
  collection: 'rca',
  chapter: 8,
  title: 'Integration on Product Spaces',
  summary: String.raw`How to integrate over $X\times Y$ when $X$ and $Y$ carry measures. Rudin builds the product $\sigma$-algebra from measurable rectangles, uses monotone classes to show that every product-measurable set and function has measurable sections, defines $\mu\times\lambda$ by integrating the measures of sections, and proves the Fubini theorem: for $\sigma$-finite spaces, iterated integrals of nonnegative or integrable functions may be taken in either order. Counterexamples show that neither integrability nor $\sigma$-finiteness can be dropped. The chapter then identifies Lebesgue measure on $\R^k$ with the completed product of lower-dimensional ones, extends Fubini to completed products, and applies everything to convolutions in $L^1(\R)$ and to the distribution function $t\mapsto\mu\{|f|>t\}$.`,
  items: [
    // ------------------------------------------------------------------ measurability on cartesian products
    {
      num: '8.1',
      kind: 'Definition',
      name: 'Rectangles, elementary sets, monotone classes, sections',
      statement: String.raw`Let $(X,\mathscr S)$ and $(Y,\mathscr T)$ be measurable spaces.
(a) A **measurable rectangle** is a product $A\times B$ with $A\in\mathscr S$ and $B\in\mathscr T$.
(b) A set $Q\subset X\times Y$ is **elementary**, $Q\in\mathscr E$, if it is a finite union of pairwise disjoint measurable rectangles.
(c) $\mathscr S\times\mathscr T$ denotes the smallest $\sigma$-algebra in $X\times Y$ that contains every measurable rectangle.
(d) A **monotone class** is a collection $\mathfrak M$ of sets that contains $\bigcup_i A_i$ whenever $A_1\subset A_2\subset\cdots$ all lie in $\mathfrak M$, and contains $\bigcap_i B_i$ whenever $B_1\supset B_2\supset\cdots$ all lie in $\mathfrak M$.
(e) For $E\subset X\times Y$, $x\in X$ and $y\in Y$, the **$x$-section** of $E$ is $E_x=\{y\in Y:(x,y)\in E\}$ and the **$y$-section** is $E^y=\{x\in X:(x,y)\in E\}$; thus $E_x\subset Y$ and $E^y\subset X$.`,
      idea: String.raw`Rectangles are the sets whose product measure must obviously be $\mu(A)\lambda(B)$. From $(A_1\times B_1)\cap(A_2\times B_2)=(A_1\cap A_2)\times(B_1\cap B_2)$ and $(A_1\times B_1)\setminus(A_2\times B_2)=[(A_1\setminus A_2)\times B_1]\cup[(A_1\cap A_2)\times(B_1\setminus B_2)]$ (a disjoint union) one sees that $\mathscr E$ is closed under finite intersections, differences and unions: it is an algebra, but not a $\sigma$-algebra. Monotone classes are the bridge from $\mathscr E$ to $\mathscr S\times\mathscr T$ (Theorem 8.3), and sections turn a question about $X\times Y$ into questions about $X$ and $Y$ separately.`,
      caption: String.raw`Here $X=Y=[0,1]$. Drag the corners of $R_1=A\times B$ (blue) and $R_2=C\times D$ (red) and choose an operation: the result $E$ is always elementary — the green pieces are disjoint rectangles, numbered. Drag the gold point: the purple and orange segments are the sections $E_x\subset Y$ and $E^y\subset X$ through it.`,
      deps: ['rca-1.3', 'rca-1.10'],
      tags: ['product spaces', 'σ-algebras'],
      viz(v) {
        const M = v.M;
        const op = v.select('$E=$', [
          { value: 'u', label: '$R_1\\cup R_2$' }, { value: 'i', label: '$R_1\\cap R_2$' },
          { value: 'd', label: '$R_1\\setminus R_2$' }, { value: 'c', label: '$(R_1\\cup R_2)^c$' }], 'd');
        const S = v.stage({ x: [-0.12, 1.1], y: [-0.12, 1.1], equal: true, height: 430, axes: false });
        const box = { x: [0, 1], y: [0, 1] };
        const a0 = S.handle(0.1, 0.16, { color: 'blue', r: 6, constrain: box }), a1 = S.handle(0.6, 0.66, { color: 'blue', r: 6, constrain: box });
        const c0 = S.handle(0.36, 0.4, { color: 'red', r: 6, constrain: box }), c1 = S.handle(0.88, 0.9, { color: 'red', r: 6, constrain: box });
        const g = S.handle(0.5, 0.24, { color: 'gold', constrain: box });
        let st = {};
        const iv = (p, q, k) => [Math.min(p[k], q[k]), Math.max(p[k], q[k])];
        v.render(() => {
          const A = iv(a0, a1, 'x'), B = iv(a0, a1, 'y'), C = iv(c0, c1, 'x'), D = iv(c0, c1, 'y');
          const inR = (I, J, x, y) => x > I[0] && x < I[1] && y > J[0] && y < J[1];
          const inE = (x, y) => {
            const r1 = inR(A, B, x, y), r2 = inR(C, D, x, y);
            return op.value === 'u' ? r1 || r2 : op.value === 'i' ? r1 && r2 : op.value === 'd' ? r1 && !r2 : !(r1 || r2);
          };
          const xs = [...new Set([0, ...A, ...C, 1])].sort((p, q) => p - q), ys = [...new Set([0, ...B, ...D, 1])].sort((p, q) => p - q);
          // column-wise runs, merged across columns with identical y-runs → disjoint rectangles
          const pieces = []; let open = new Map();
          for (let i = 0; i + 1 < xs.length; i++) {
            if (xs[i + 1] - xs[i] < 1e-9) continue;
            const mx = (xs[i] + xs[i + 1]) / 2, runs = [];
            for (let j = 0; j + 1 < ys.length; j++) {
              if (ys[j + 1] - ys[j] < 1e-9) continue;
              if (inE(mx, (ys[j] + ys[j + 1]) / 2)) { const l = runs[runs.length - 1]; if (l && Math.abs(l[1] - ys[j]) < 1e-12) l[1] = ys[j + 1]; else runs.push([ys[j], ys[j + 1]]); }
            }
            const next = new Map();
            for (const [y0, y1] of runs) {
              const k = `${y0},${y1}`, p = open.get(k);
              if (p && Math.abs(p.x1 - xs[i]) < 1e-12) { p.x1 = xs[i + 1]; next.set(k, p); } else { const q = { x0: xs[i], x1: xs[i + 1], y0, y1 }; pieces.push(q); next.set(k, q); }
            }
            open = next;
          }
          // sections through the gold point
          const Ex = mergeIv(ys.slice(0, -1).map((y, j) => [y, ys[j + 1]]).filter(([p, q]) => q - p > 1e-9 && inE(g.x, (p + q) / 2)));
          const Ey = mergeIv(xs.slice(0, -1).map((x, i) => [x, xs[i + 1]]).filter(([p, q]) => q - p > 1e-9 && inE((p + q) / 2, g.y)));
          // draw
          S.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          pieces.forEach((p, k) => {
            S.rect(p.x0, p.y0, p.x1, p.y1, { fill: 'green', fillAlpha: k % 2 ? 0.2 : 0.34, color: 'green', width: 1.3 });
            if (p.x1 - p.x0 > 0.06 && p.y1 - p.y0 > 0.06) S.text(String(k + 1), (p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2, { color: 'green', weight: 700, size: 13, align: 'center' });
          });
          S.rect(A[0], B[0], A[1], B[1], { color: 'blue', width: 2, dash: [6, 4] });
          S.rect(C[0], D[0], C[1], D[1], { color: 'red', width: 2, dash: [6, 4] });
          S.tex('R_1', A[0], B[1], { color: 'blue', align: 'left', baseline: 'bottom', dx: 3, dy: -2, size: 14 });
          S.tex('R_2', C[1], D[1], { color: 'red', align: 'right', baseline: 'bottom', dx: -3, dy: -2, size: 14 });
          // the factors on the axes
          S.line(A[0], -0.035, A[1], -0.035, { color: 'blue', width: 4, cap: 'butt' }); S.line(C[0], -0.075, C[1], -0.075, { color: 'red', width: 4, cap: 'butt' });
          S.line(-0.035, B[0], -0.035, B[1], { color: 'blue', width: 4, cap: 'butt' }); S.line(-0.075, D[0], -0.075, D[1], { color: 'red', width: 4, cap: 'butt' });
          S.tex('A', A[0], -0.035, { color: 'blue', align: 'right', dx: -4, size: 13 }); S.tex('C', C[0], -0.075, { color: 'red', align: 'right', dx: -4, size: 13 });
          S.tex('B', -0.035, B[1], { color: 'blue', baseline: 'bottom', dy: -2, size: 13 }); S.tex('D', -0.075, D[1], { color: 'red', baseline: 'bottom', dy: -2, size: 13 });
          // sections
          S.line(g.x, 0, g.x, 1, { color: 'purple', width: 1, dash: [3, 4], alpha: 0.8 });
          S.line(0, g.y, 1, g.y, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.8 });
          drawIv(S, Ex, g.x, 0, { color: 'purple', width: 5, alpha: 0.9 });
          drawIv(S, Ey, g.y, 1, { color: 'orange', width: 5, alpha: 0.9 });
          S.tex('E_x', g.x, 1, { color: 'purple', baseline: 'bottom', dy: -3, size: 14 });
          S.tex('E^y', 1, g.y, { color: 'orange', align: 'left', dx: 4, size: 14 });
          S.corner(`${pieces.length} disjoint rectangle${pieces.length === 1 ? '' : 's'}`, 'tr', { color: 'green', weight: 600 });
          st = { n: pieces.length, Ex, Ey };
        });
        v.legend([['green', 'elementary set $E$', { area: true }], ['purple', 'section $E_x\\subset Y$'], ['orange', 'section $E^y\\subset X$']]);
        v.readout(() => `$E$ is the disjoint union of $${st.n}$ measurable rectangle${st.n === 1 ? '' : 's'}. At $x=${v.fix(g.x, 2)}$: $E_x=${ivTeX(st.Ex)}$; at $y=${v.fix(g.y, 2)}$: $E^y=${ivTeX(st.Ey)}$ — sections of an elementary set are finite unions of the factor sets $B, D$ resp. $A, C$ and their differences.`);
      },
    },
    {
      num: '8.2',
      kind: 'Theorem',
      name: 'Sections of product-measurable sets are measurable',
      statement: String.raw`If $E\in\mathscr S\times\mathscr T$, then $E_x\in\mathscr T$ and $E^y\in\mathscr S$ for every $x\in X$ and every $y\in Y$.`,
      idea: String.raw`Let $\Omega$ be the class of all $E\in\mathscr S\times\mathscr T$ with $E_x\in\mathscr T$ for every $x$. A rectangle $A\times B$ is in $\Omega$, since its $x$-section is $B$ or $\varnothing$. Sections commute with set operations: $(E^c)_x=(E_x)^c$ and $\big(\bigcup_n E_n\big)_x=\bigcup_n (E_n)_x$. Hence $\Omega$ is a $\sigma$-algebra containing all measurable rectangles, so $\Omega=\mathscr S\times\mathscr T$ by minimality (1.10). The same argument works for $E^y$.`,
      caption: String.raw`$E=\bigcup_{n\le N}A_n\times B_n$, a union of rectangles over shrinking intervals $A_n$ centred at the rationals $\tfrac12,\tfrac13,\tfrac23,\tfrac14,\dots$. Drag $x$: the right panel lists the $B_n$ of the rectangles the line meets, and their union is exactly $E_x$ (purple). In complement mode the section of $E^c$ is the complement of $E_x$. Sections of countable unions and complements are again countable unions and complements — which is the whole proof.`,
      deps: ['rca-8.1', 'rca-1.10'],
      tags: ['product spaces', 'measurability'],
      viz(v) {
        const M = v.M;
        // the rectangles A_n × B_n
        const R = v.rng(11), rects = [];
        outer: for (let q = 2; q < 40; q++) for (let p = 1; p < q; p++) {
          let a = p, b = q; while (b) [a, b] = [b, a % b]; if (a !== 1) continue;
          const n = rects.length, c = p / q, w = 0.16 * Math.pow(0.9, n) + 0.012;
          const b0 = R.uniform(0.02, 0.8), len = R.uniform(0.07, 0.3);
          rects.push({ n: n + 1, p, q, A: [Math.max(0, c - w), Math.min(1, c + w)], B: [b0, Math.min(0.99, b0 + len)] });
          if (rects.length >= 40) break outer;
        }
        const mode = v.select('', [{ value: 'u', label: '$E=\\bigcup_n A_n\\times B_n$' }, { value: 'c', label: 'the complement $E^c$' }], 'u');
        const N = v.slider('rectangles $N$', 1, 40, 16, { int: true });
        const L = v.stage({ x: [-0.03, 1.03], y: [-0.11, 1.1], equal: true, height: 380, axes: false, weight: 1.15, title: 'the set in $X\\times Y=[0,1]^2$' });
        const P = v.stage({ x: [0, 6], y: [-0.11, 1.1], height: 380, axes: false, title: 'sections $(A_n\\times B_n)_x=B_n$ and their union' });
        const xh = L.handle(0.36, -0.06, { color: 'gold', label: 'x', labelPos: 'e', constrain: (x) => [M.clamp(x, 0.002, 0.998), -0.06] });
        let st = {};
        v.render(() => {
          const used = rects.slice(0, N.value), x = xh.x, comp = mode.value === 'c';
          const hits = used.filter((r) => x > r.A[0] && x < r.A[1]);
          const Ex = mergeIv(hits.map((r) => [...r.B])), sec = comp ? complementIv(Ex) : Ex;
          // left
          if (comp) L.rect(0, 0, 1, 1, { fill: 'red', fillAlpha: 0.16, stroke: false });
          for (const r of used) L.rect(r.A[0], r.B[0], r.A[1], r.B[1], comp ? { fill: 'panel', fillAlpha: 1, stroke: false } : { fill: 'accent', fillAlpha: 0.14, stroke: false });
          for (const r of used) {
            const hit = hits.includes(r);
            L.rect(r.A[0], r.B[0], r.A[1], r.B[1], { color: comp ? 'muted' : 'accent', width: hit ? 1.8 : 0.8, alpha: hit ? 1 : 0.45 });
          }
          L.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          L.line(x, 0, x, 1, { color: 'gold', width: 1.2, dash: [4, 4] });
          drawIv(L, sec, x, 0, { color: comp ? 'red' : 'purple', width: 5 });
          L.text('0', 0, -0.06, { size: 11, color: 'muted', align: 'center' }); L.text('1', 1, -0.06, { size: 11, color: 'muted', align: 'center' });
          L.tex(comp ? '(E^c)_x' : 'E_x', x, 1, { color: comp ? 'red' : 'purple', baseline: 'bottom', dy: -2, size: 14 });
          // right: one column per rectangle met by the line, then the union
          const K = hits.length, U = K + 1.9;
          P.setView([0, U + 1.1], null);
          P.line(0.3, 0, U + 0.8, 0, { color: 'faint', width: 1 }); P.line(0.3, 1, U + 0.8, 1, { color: 'faint', width: 1, dash: [2, 4] });
          P.text('0', 0.22, 0, { size: 11, color: 'muted', align: 'right' }); P.text('1', 0.22, 1, { size: 11, color: 'muted', align: 'right' });
          hits.forEach((r, k) => {
            P.line(k + 1, r.B[0], k + 1, r.B[1], { color: 'accent', width: 7, cap: 'butt' });
            P.text(String(r.n), k + 1, -0.06, { size: 11, color: 'accent', align: 'center' });
          });
          if (K) P.text('n', 0.45, -0.06, { size: 11, color: 'muted', align: 'center', math: true });
          P.vline(U - 0.55, { color: 'grid', width: 1 });
          if (comp) drawIv(P, Ex, U, 0, { color: 'purple', width: 7, alpha: 0.3 });
          drawIv(P, sec, U, 0, { color: comp ? 'red' : 'purple', width: 9 });
          P.tex(comp ? '(E_x)^c' : 'E_x', U, -0.06, { color: comp ? 'red' : 'purple', size: 13 });
          if (!K) P.corner('no rectangle meets this line, so E_x = ∅', 'tl', { color: 'muted' });
          st = { K, Ex, sec, comp };
        });
        v.legend([['accent', 'rectangles $A_n\\times B_n$', { area: true }], ['gold', 'the vertical line $\\{x\\}\\times Y$'], ['purple', '$E_x=\\bigcup_n (A_n\\times B_n)_x$'], ['red', '$(E^c)_x=(E_x)^c$']]);
        v.readout(() => {
          const s = st;
          const head = `The line at $x=${v.fix(xh.x, 3)}$ meets $${s.K}$ of the $${N.value}$ rectangles, so $E_x=\\bigcup B_n=${ivTeX(s.Ex)}$, with $\\lambda(E_x)=${v.fix(ivLen(s.Ex), 3)}$.`;
          return s.comp ? head + ` Its complement $(E^c)_x=${ivTeX(s.sec)}$ has measure $${v.fix(ivLen(s.sec), 3)}$.` : head;
        });
      },
    },
    {
      num: '8.3',
      kind: 'Theorem',
      name: 'S × T is the monotone class generated by elementary sets',
      statement: String.raw`$\mathscr S\times\mathscr T$ is the smallest monotone class in $X\times Y$ that contains all elementary sets.`,
      idea: String.raw`Let $\mathfrak M$ be the smallest monotone class containing $\mathscr E$; since $\mathscr S\times\mathscr T$ is a $\sigma$-algebra (hence a monotone class) containing $\mathscr E$, $\mathfrak M\subset\mathscr S\times\mathscr T$. For the reverse inclusion one shows that $\mathfrak M$ is an algebra: for fixed $P$ the class of all $Q$ with $P\setminus Q,\;Q\setminus P,\;P\cup Q\in\mathfrak M$ is itself a monotone class, contains $\mathscr E$ when $P\in\mathscr E$ (because $\mathscr E$ is an algebra), hence contains $\mathfrak M$; a symmetry argument then gives it for all $P\in\mathfrak M$. Finally, a monotone class that is an algebra is a $\sigma$-algebra, since a countable union is the increasing union of finite unions.`,
      caption: String.raw`A disc or triangle $Q$ is not elementary: no finite union of rectangles has a curved or slanted edge. But it is a monotone limit of elementary sets: the dyadic squares inside $Q$ form an increasing sequence $P_n$ whose union is the interior of $Q$, and the squares meeting $Q$ form a decreasing sequence $O_n$ whose intersection is $Q$ itself. Move $Q$ and the level $n$; the right panel tracks the areas, which squeeze the area of $Q$.`,
      deps: ['rca-8.1', 'rca-1.10'],
      tags: ['monotone class', 'product spaces'],
      viz(v) {
        const M = v.M;
        const shape = v.select('$Q$', [{ value: 'disc', label: 'disc' }, { value: 'tri', label: 'triangle' }], 'disc');
        const mode = v.select('', [{ value: 'in', label: 'increasing $P_n\\uparrow$' }, { value: 'out', label: 'decreasing $O_n\\downarrow$' }, { value: 'both', label: 'both' }], 'both');
        const lev = v.slider('dyadic level $n$', 1, 7, 3, { int: true });
        const L = v.stage({ x: [-0.02, 1.02], y: [-0.09, 1.02], equal: true, height: 370, axes: false, weight: 1.1 });
        const R = v.stage({ x: [0.4, 8.6], y: [-0.06, 1.05], height: 370, axes: 'box', xlabel: 'n', xticks: [1, 2, 3, 4, 5, 6, 7, 8], title: 'areas of the elementary sets $P_n\\subset Q\\subset O_n$' });
        const box = { x: [0.02, 0.98], y: [0.02, 0.98] };
        const ctr = L.handle(0.47, 0.52, { color: 'accent', constrain: box }), rad = L.handle(0.8, 0.52, { color: 'gray', r: 6, constrain: box });
        const tv = [[0.12, 0.15], [0.9, 0.3], [0.38, 0.9]].map(([x, y]) => L.handle(x, y, { color: 'accent', r: 6, constrain: box }));
        let prevC = [ctr.x, ctr.y];
        ctr.onDrag = () => { rad.x = M.clamp(rad.x + ctr.x - prevC[0], 0, 1); rad.y = M.clamp(rad.y + ctr.y - prevC[1], 0, 1); prevC = [ctr.x, ctr.y]; };
        // SAT test: does the axis-parallel square [x0,x1]×[y0,y1] meet the convex polygon T?
        function meetsPoly(T, x0, y0, x1, y1) {
          const C = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
          const axes = [[1, 0], [0, 1]];
          for (let i = 0; i < T.length; i++) { const p = T[i], q = T[(i + 1) % T.length]; axes.push([q[1] - p[1], p[0] - q[0]]); }
          for (const a of axes) {
            const pa = C.map((p) => a[0] * p[0] + a[1] * p[1]), pb = T.map((p) => a[0] * p[0] + a[1] * p[1]);
            if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
          }
          return true;
        }
        let cache = { key: null }, st = {};
        function geometry() {
          if (shape.value === 'disc') {
            const r = M.clamp(Math.hypot(rad.x - ctr.x, rad.y - ctr.y), 0.05, Math.min(ctr.x, 1 - ctr.x, ctr.y, 1 - ctr.y));
            const cx = ctr.x, cy = ctr.y;
            return {
              key: `d${cx},${cy},${r}`, area: Math.PI * r * r, ring: discRing(cx, cy, r),
              inside: (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].every(([x, y]) => Math.hypot(x - cx, y - cy) < r),
              meets: (x0, y0, x1, y1) => Math.hypot(M.clamp(cx, x0, x1) - cx, M.clamp(cy, y0, y1) - cy) <= r,
            };
          }
          let T = tv.map((h) => [h.x, h.y]); if (M.polyArea(T) < 0) T = T.reverse();
          return {
            key: `t${T.flat().join(',')}`, area: Math.abs(M.polyArea(T)), ring: T,
            inside: (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].every((p) => M.pointInPoly(p, T)),
            meets: (x0, y0, x1, y1) => meetsPoly(T, x0, y0, x1, y1),
          };
        }
        v.render(() => {
          const disc = shape.value === 'disc';
          ctr.visible = rad.visible = disc; tv.forEach((h) => { h.visible = !disc; });
          const G = geometry();
          if (cache.key !== G.key) {
            const inA = [], outA = [];
            for (let n = 1; n <= 8; n++) {
              const k = 1 << n, h = 1 / k; let ni = 0, no = 0;
              for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
                const x0 = i * h, y0 = j * h;
                if (G.meets(x0, y0, x0 + h, y0 + h)) { no++; if (G.inside(x0, y0, x0 + h, y0 + h)) ni++; }
              }
              inA.push(ni * h * h); outA.push(no * h * h);
            }
            cache = { key: G.key, inA, outA };
          }
          const n = lev.value, k = 1 << n, h = 1 / k;
          let ni = 0, no = 0;
          for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) {
            const x0 = i * h, y0 = j * h;
            if (!G.meets(x0, y0, x0 + h, y0 + h)) continue;
            no++;
            const ins = G.inside(x0, y0, x0 + h, y0 + h); if (ins) ni++;
            if (mode.value !== 'in' && !ins) L.rect(x0, y0, x0 + h, y0 + h, { fill: 'orange', fillAlpha: 0.32, color: 'orange', width: 0.7, alpha: 0.6 });
            if (mode.value !== 'out' && ins) L.rect(x0, y0, x0 + h, y0 + h, { fill: 'green', fillAlpha: 0.42, color: 'panel', width: n > 5 ? 0.4 : 1 });
            if (mode.value === 'out' && ins) L.rect(x0, y0, x0 + h, y0 + h, { fill: 'orange', fillAlpha: 0.32, color: 'orange', width: 0.7, alpha: 0.6 });
          }
          L.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          L.poly(G.ring, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.08 });
          if (disc) L.line(ctr.x, ctr.y, rad.x, rad.y, { color: 'gray', width: 1, dash: [3, 3] });
          const c = G.ring.reduce((s, p) => [s[0] + p[0] / G.ring.length, s[1] + p[1] / G.ring.length], [0, 0]);
          if (!disc) L.tex('Q', c[0], c[1], { color: 'accent', size: 18 });
          L.tex(`n=${n}:\\ \\text{dyadic squares of side } 2^{-${n}}`, 0.5, -0.05, { color: 'muted', size: 13 });
          // right: areas
          const { inA, outA } = cache;
          R.hline(G.area, { color: 'accent', dash: [6, 4], width: 1.5 });
          R.tex(`m(Q)=${G.area.toFixed(3)}`, 8.5, G.area, { color: 'accent', align: 'right', baseline: 'bottom', dy: -4, size: 13 });
          R.line(n, 0, n, 1.05, { color: 'grid', width: 6 });
          R.path(outA.map((a, i) => [i + 1, a]), { color: 'orange', width: 1.6 });
          R.path(inA.map((a, i) => [i + 1, a]), { color: 'green', width: 1.6 });
          outA.forEach((a, i) => R.dot(i + 1, a, { color: 'orange', r: i + 1 === n ? 6 : 3.5 }));
          inA.forEach((a, i) => R.dot(i + 1, a, { color: 'green', r: i + 1 === n ? 6 : 3.5 }));
          st = { n, ni, no, h, area: G.area, inArea: ni * h * h, outArea: no * h * h };
        });
        v.legend([['green', '$P_n$: squares inside $Q$', { area: true }], ['orange', '$O_n\\setminus P_n$: squares meeting $\\partial Q$', { area: true }], ['accent', '$Q$']]);
        v.readout(() => `$P_${st.n}$ is a union of $${st.ni}$ dyadic squares, area $${v.fix(st.inArea, 4)}$; $O_${st.n}$ uses $${st.no}$ squares, area $${v.fix(st.outArea, 4)}$; $m(Q)=${v.fix(st.area, 4)}$. Since $P_n\\uparrow \\operatorname{int}Q$ and $O_n\\downarrow Q$, both lie in every monotone class containing $\\mathscr E$ — although neither is elementary.`);
      },
    },
    {
      num: '8.4',
      kind: 'Definition',
      name: 'Sections of a function',
      statement: String.raw`To a function $f$ on $X\times Y$ and a point $x\in X$ we associate the function $f_x$ on $Y$ given by $f_x(y)=f(x,y)$; similarly, for $y\in Y$, $f^y$ is the function on $X$ with $f^y(x)=f(x,y)$. For a set $E\subset X\times Y$ one has $(\chi_E)_x=\chi_{E_x}$ and $(\chi_E)^y=\chi_{E^y}$.`,
      idea: String.raw`Freezing one variable turns a function of two variables into a family of functions of one variable. Iterated integrals are built from them: first integrate each $f_x$ over $Y$, obtaining a function of $x$, then integrate that over $X$. For indicator functions the sections are the indicators of the set sections of 8.1, so everything proved for sets transfers to functions.`,
      caption: String.raw`Left: the graph of $f$ over $[0,1]^2$ (drag to rotate). The purple curve is the slice $x=x_0$, i.e. the graph of $f_{x_0}$; the orange curve is the slice $y=y_0$, the graph of $f^{y_0}$. Right: the same two functions of one variable. They meet in the value $f(x_0,y_0)$.`,
      deps: ['rca-8.1'],
      tags: ['product spaces', 'sections'],
      viz(v) {
        const FN = {
          bumps: { label: 'two bumps', f: (x, y) => 0.95 * Math.exp(-((x - 0.3) ** 2 + (y - 0.66) ** 2) / 0.025) + 0.65 * Math.exp(-((x - 0.7) ** 2 + (y - 0.32) ** 2) / 0.04), lo: 0, hi: 1 },
          wave: { label: 'a wave', f: (x, y) => 0.6 * Math.sin(2 * Math.PI * x) * Math.cos(1.6 * Math.PI * y) + 0.25 * x * y, lo: -0.6, hi: 0.85 },
          jump: { label: 'a jump', f: (x, y) => (x + y > 1.1 ? 0.75 : 0.15) + 0.12 * Math.sin(5 * y), lo: 0, hi: 0.9 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'bumps');
        const x0 = v.slider('$x_0$', 0, 1, 0.3, { step: 0.01 });
        const y0 = v.slider('$y_0$', 0, 1, 0.55, { step: 0.01 });
        const S3 = v.stage3d({ range: 1.55, height: 360, yaw: -0.75, pitch: 0.5, labels: null, axes: false, title: 'the graph of $f$ and two slices' });
        const P = v.stage({ x: [-0.02, 1.02], y: [-0.1, 1.1], height: 360, axes: 'box', xlabel: 't', title: '$t\\mapsto f_{x_0}(t)$ and $t\\mapsto f^{y_0}(t)$' });
        const Z = 1.2;
        const W = (x, y, z) => [2 * x - 1, 2 * y - 1, Z * z];
        let st = {};
        v.render(() => {
          const F = FN[which.value], f = F.f, a = x0.value, b = y0.value;
          // floor frame and axes labels
          S3.path([W(0, 0, F.lo), W(1, 0, F.lo), W(1, 1, F.lo), W(0, 1, F.lo)], { color: 'faint', width: 1, close: true });
          S3.text('x', W(1.1, -0.06, F.lo), { color: 'muted', math: true }); S3.text('y', W(-0.06, 1.1, F.lo), { color: 'muted', math: true });
          const tint = (p) => v.mix('accent', 'teal', M2(p));
          const M2 = (z) => Math.max(0, Math.min(1, (z - F.lo) / (F.hi - F.lo)));
          S3.surface((u, w) => W(u, w, f(u, w)), [0, 1], [0, 1], { n: 34, alpha: 0.78, colorFn: (u, w) => tint(f(u, w)) });
          // slicing planes (translucent)
          S3.poly([W(a, 0, F.lo), W(a, 1, F.lo), W(a, 1, F.hi), W(a, 0, F.hi)], { fill: 'purple', fillAlpha: 0.07, color: 'purple', alpha: 0.35, width: 1, bias: 0.4 });
          S3.poly([W(0, b, F.lo), W(1, b, F.lo), W(1, b, F.hi), W(0, b, F.hi)], { fill: 'orange', fillAlpha: 0.07, color: 'orange', alpha: 0.35, width: 1, bias: 0.4 });
          S3.curve((t) => W(a, t, f(a, t)), 0, 1, { color: 'purple', width: 3.2, bias: -2, n: 160 });
          S3.curve((t) => W(t, b, f(t, b)), 0, 1, { color: 'orange', width: 3.2, bias: -2, n: 160 });
          S3.dot(W(a, b, f(a, b)), { color: 'gold', r: 5.5, bias: -3 });
          // right panel
          P.setView(null, [F.lo - 0.08 * (F.hi - F.lo), F.hi + 0.12 * (F.hi - F.lo)]);
          P.fn((t) => f(a, t), { domain: [0, 1], color: 'purple', width: 2.6, n: 500 });
          P.fn((t) => f(t, b), { domain: [0, 1], color: 'orange', width: 2.6, n: 500 });
          const val = f(a, b);
          P.vline(b, { color: 'purple', width: 1, dash: [3, 4], alpha: 0.6 }); P.vline(a, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.6 });
          P.dot(b, val, { color: 'purple', r: 5 }); P.dot(a, val, { color: 'orange', r: 5 });
          P.hline(val, { color: 'gold', width: 1, dash: [2, 3] });
          st = { val };
        });
        v.legend([['purple', '$f_{x_0}$, a function on $Y$'], ['orange', '$f^{y_0}$, a function on $X$'], ['gold', '$f(x_0,y_0)$', { dot: true }]]);
        v.readout(() => `$f_{x_0}(y_0)=f^{y_0}(x_0)=f(${v.fix(x0.value, 2)},\\,${v.fix(y0.value, 2)})=${v.fix(st.val, 3)}$ — the purple dot sits at $t=y_0$, the orange one at $t=x_0$.`);
      },
    },
    {
      num: '8.5',
      kind: 'Theorem',
      name: 'Sections of product-measurable functions are measurable',
      statement: String.raw`Let $f$ be an $(\mathscr S\times\mathscr T)$-measurable function on $X\times Y$. Then
(a) for each $x\in X$, $f_x$ is a $\mathscr T$-measurable function on $Y$;
(b) for each $y\in Y$, $f^y$ is an $\mathscr S$-measurable function on $X$.`,
      idea: String.raw`For an open set $V$ in the range, put $Q=f^{-1}(V)\in\mathscr S\times\mathscr T$. A point $y$ satisfies $f_x(y)\in V$ exactly when $(x,y)\in Q$, so $(f_x)^{-1}(V)=Q_x$, which lies in $\mathscr T$ by Theorem 8.2. The same identity with $Q^y$ gives (b).`,
      caption: String.raw`Choose a target interval $V=(c_1,c_2)$ with the sliders. Left: the set $Q=f^{-1}(V)$ (blue) over a grey rendering of $f$. Right: the graph of the section $f_x$ with the band $V$. The purple set $\{y: f_x(y)\in V\}$ on the right is the same set as the section $Q_x$ on the left — drag $x$ to compare.`,
      deps: ['rca-8.2', 'rca-8.4', 'rca-1.3'],
      tags: ['product spaces', 'measurability'],
      viz(v) {
        const M = v.M;
        const FN = {
          bumps: { label: 'smooth', f: (x, y) => 0.95 * Math.exp(-((x - 0.3) ** 2 + (y - 0.66) ** 2) / 0.03) + 0.7 * Math.exp(-((x - 0.72) ** 2 + (y - 0.3) ** 2) / 0.05), lo: 0, hi: 1 },
          saw: { label: '$\\operatorname{frac}(2x+3y)$', f: (x, y) => M.fract(2 * x + 3 * y), lo: 0, hi: 1 },
          ring: { label: 'distance to a point', f: (x, y) => Math.min(1, 1.25 * Math.hypot(x - 0.42, y - 0.55)), lo: 0, hi: 1 },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'bumps');
        const c1 = v.slider('$c_1$', 0, 1, 0.3, { step: 0.01 });
        const c2 = v.slider('$c_2$', 0, 1, 0.62, { step: 0.01 });
        const L = v.stage({ x: [-0.03, 1.03], y: [-0.11, 1.1], equal: true, height: 360, axes: false, title: '$Q=f^{-1}(V)\\subset X\\times Y$' });
        const P = v.stage({ x: [-0.03, 1.03], y: [-0.14, 1.12], height: 360, axes: 'box', xlabel: 'y', xticks: [0.2, 0.4, 0.6, 0.8], title: 'the section $f_x$ on $Y$' });
        const xh = L.handle(0.33, -0.06, { color: 'gold', label: 'x', labelPos: 'e', constrain: (x) => [M.clamp(x, 0, 1), -0.06] });
        let st = {};
        v.render(() => {
          const F = FN[which.value], f = F.f;
          const lo = Math.min(c1.value, c2.value), hi = Math.max(c1.value, c2.value);
          const pan = v.rgb('panel'), mu = v.rgb('muted'), ac = v.rgb('accent');
          L.raster((x, y) => {
            if (x < 0 || x > 1 || y < 0 || y > 1) return null;
            const z = f(x, y), t = (z - F.lo) / (F.hi - F.lo);
            if (z > lo && z < hi) return [0.45 * ac[0] + 0.55 * pan[0], 0.45 * ac[1] + 0.55 * pan[1], 0.45 * ac[2] + 0.55 * pan[2]];
            const k = 0.08 + 0.3 * t; return [pan[0] + (mu[0] - pan[0]) * k, pan[1] + (mu[1] - pan[1]) * k, pan[2] + (mu[2] - pan[2]) * k];
          }, { key: `${which.value}|${lo}|${hi}|${pan}`, res: 1 });
          L.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          // section of Q by sampling along the line
          const n = 1200, x = xh.x, ivs = [];
          let start = null;
          for (let i = 0; i <= n; i++) {
            const y = i / n, inside = i < n && (() => { const z = f(x, (i + 0.5) / n); return z > lo && z < hi; })();
            if (inside && start == null) start = y; if (!inside && start != null) { ivs.push([start, y]); start = null; }
          }
          L.line(x, 0, x, 1, { color: 'gold', width: 1.2, dash: [4, 4] });
          drawIv(L, ivs, x, 0, { color: 'purple', width: 5 });
          L.tex('Q_x', x, 1, { color: 'purple', baseline: 'bottom', dy: -2, size: 14 });
          // right: graph of f_x with the band V
          P.setView(null, [F.lo - 0.14, F.hi + 0.12]);
          P.hband(lo, hi, { color: 'accent', alpha: 0.13, edges: true });
          P.tex('V', 1.02, (lo + hi) / 2, { color: 'accent', align: 'right', dx: -4, size: 14 });
          P.fn((y) => f(x, y), { domain: [0, 1], color: 'ink', width: 2, n: 900 });
          for (const [a, b] of ivs) P.fn((y) => f(x, y), { domain: [a, b], color: 'purple', width: 3.6, n: 300 });
          drawIv(P, ivs, F.lo - 0.08, 1, { color: 'purple', width: 6 });
          st = { ivs };
        });
        v.legend([['accent', '$Q=f^{-1}(V)$', { area: true }], ['purple', '$Q_x=(f_x)^{-1}(V)$'], ['ink', 'graph of $f_x$']]);
        v.readout(() => `At $x=${v.fix(xh.x, 3)}$: $(f_x)^{-1}(V)=Q_x=${ivTeX(st.ivs)}$, a Borel subset of $Y$ with $\\lambda(Q_x)=${v.fix(ivLen(st.ivs), 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ product measures
    {
      num: '8.6',
      kind: 'Theorem',
      name: 'Measures of sections integrate to the same number',
      statement: String.raw`Let $(X,\mathscr S,\mu)$ and $(Y,\mathscr T,\lambda)$ be $\sigma$-finite measure spaces and let $Q\in\mathscr S\times\mathscr T$. Put
$$\varphi(x)=\lambda(Q_x),\qquad \psi(y)=\mu(Q^y)\qquad(x\in X,\ y\in Y).$$
Then $\varphi$ is $\mathscr S$-measurable, $\psi$ is $\mathscr T$-measurable, and
$$\int_X\varphi\,d\mu=\int_Y\psi\,d\lambda .$$`,
      idea: String.raw`Let $\Omega$ be the class of all $Q\in\mathscr S\times\mathscr T$ for which the conclusion holds. Rectangles are in $\Omega$: both integrals equal $\mu(A)\lambda(B)$. $\Omega$ is closed under increasing unions by the monotone convergence theorem, under countable disjoint unions, and — when everything sits inside a rectangle of finite measure — under decreasing intersections by dominated convergence. So $\Omega$ contains the monotone class generated by $\mathscr E$, which is $\mathscr S\times\mathscr T$ by 8.3; $\sigma$-finiteness removes the finite-measure restriction. Without it the theorem fails: on the diagonal of $[0,1]^2$, with $\lambda$ = counting measure, $\int\varphi\,d\mu=1$ but $\int\psi\,d\lambda=0$.`,
      caption: String.raw`Lebesgue measure on both factors of $[0,1]^2$. Drag the gold point. Below the square, $\varphi(x)=\lambda(Q_x)$ is the length of the purple vertical section; to the right, $\psi(y)=\mu(Q^y)$ is the length of the orange horizontal section. The shaded areas under $\varphi$ and $\psi$ are equal — both are the area of $Q$. The last option uses counting measure for $\lambda$, which is not $\sigma$-finite, and the equality breaks.`,
      deps: ['rca-8.3', 'rca-8.2', 'rca-1.26', 'rca-1.34', 'rca-1.19'],
      tags: ['product measure', 'σ-finite'],
      viz(v) {
        const M = v.M;
        const SETS = {
          blob: { label: 'a blob', set: () => [[M.blob(0.5, 0.5, 0.33, 4, 0.42)]] },
          ann: { label: 'disc with a hole', set: () => [[discRing(0.5, 0.5, 0.42), discRing(0.6, 0.42, 0.2)]] },
          two: { label: 'union of two sets', set: () => [[M.blob(0.36, 0.62, 0.25, 9, 0.3)], [[[0.3, 0.1], [0.95, 0.18], [0.75, 0.68]]]] },
          diag: { label: 'diagonal, $\\lambda$ = counting', set: () => [] },
        };
        const which = v.select('$Q$', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'ann');
        // one canvas: square [0,1]², ψ to the right (x = 1.1 + 0.5ψ), φ below (y = −0.66 + 0.5φ)
        const S = v.stage({ x: [-0.1, 1.68], y: [-0.74, 1.06], equal: true, height: 520, axes: false });
        const g = S.handle(0.36, 0.62, { color: 'gold', constrain: { x: [0, 1], y: [0, 1] } });
        const PX = 1.1, PY = -0.66, K = 0.5;
        let st = {}, cache = { key: null };
        v.render(() => {
          const diag = which.value === 'diag';
          const set = SETS[which.value].set();
          const phi = diag ? () => 1 : (x) => ivLen(section(set, x, 0));
          const psi = diag ? () => 0 : (y) => ivLen(section(set, y, 1));
          if (cache.key !== which.value) {
            cache = { key: which.value, I1: avg01(phi, 4000), I2: diag ? 0 : avg01(psi, 4000), xs: M.linspace(0, 1, 401) };
            cache.ph = cache.xs.map(phi); cache.ps = cache.xs.map(psi);
          }
          // frames
          S.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          S.line(0, PY, 1, PY, { color: 'muted', width: 1 }); S.line(0, PY + K, 1, PY + K, { color: 'grid', width: 1, dash: [3, 4] });
          S.line(PX, 0, PX, 1, { color: 'muted', width: 1 }); S.line(PX + K, 0, PX + K, 1, { color: 'grid', width: 1, dash: [3, 4] });
          S.text('0', -0.02, PY, { size: 11, color: 'muted', align: 'right' }); S.text('1', -0.02, PY + K, { size: 11, color: 'muted', align: 'right' });
          S.text('0', PX, -0.03, { size: 11, color: 'muted', align: 'center', baseline: 'top' }); S.text('1', PX + K, -0.03, { size: 11, color: 'muted', align: 'center', baseline: 'top' });
          S.text('x', 1.02, PY, { size: 14, color: 'muted', math: true, align: 'left' }); S.text('y', PX - 0.02, 1, { size: 14, color: 'muted', math: true, align: 'right' });
          // the set
          if (diag) {
            S.line(0, 0, 1, 1, { color: 'accent', width: 3 });
            S.tex('Q=\\{(t,t)\\}', 0.66, 0.28, { color: 'accent', size: 14, align: 'left' });
          } else {
            for (const sh of set) S.rings(sh, { fill: 'accent', fillAlpha: 0.22, color: 'accent', width: 1.6, evenodd: true });
            S.tex('Q', 0.08, 0.92, { color: 'accent', size: 17 });
          }
          // φ and ψ profiles with shaded areas
          const { xs, ph, ps } = cache;
          S.path([[0, PY], ...xs.map((x, i) => [x, PY + K * ph[i]]), [1, PY]], { fill: 'purple', fillAlpha: 0.2, stroke: false, close: true });
          S.path(xs.map((x, i) => [x, PY + K * ph[i]]), { color: 'purple', width: 2 });
          S.path([[PX, 0], ...xs.map((y, i) => [PX + K * ps[i], y]), [PX, 1]], { fill: 'orange', fillAlpha: 0.2, stroke: false, close: true });
          S.path(xs.map((y, i) => [PX + K * ps[i], y]), { color: 'orange', width: 2 });
          S.tex('\\varphi(x)=\\lambda(Q_x)', 0.02, PY + K + 0.03, { color: 'purple', align: 'left', baseline: 'bottom', size: 13 });
          S.tex('\\psi(y)=\\mu(Q^y)', PX, -0.1, { color: 'orange', align: 'left', baseline: 'top', size: 13 });
          // the sections through the gold point
          const x = g.x, y = g.y;
          const Qx = diag ? [] : section(set, x, 0), Qy = diag ? [] : section(set, y, 1);
          S.line(x, PY, x, 1, { color: 'purple', width: 1, dash: [3, 4], alpha: 0.7 });
          S.line(0, y, PX + K, y, { color: 'orange', width: 1, dash: [3, 4], alpha: 0.7 });
          drawIv(S, Qx, x, 0, { color: 'purple', width: 5 });
          drawIv(S, Qy, y, 1, { color: 'orange', width: 5 });
          if (diag) {
            S.dot(x, x, { color: 'purple', r: 5 }); S.dot(y, y, { color: 'orange', r: 5 });
            S.tex('Q_x=\\{x\\}', x, x, { color: 'purple', align: 'left', dx: 8, dy: 10, size: 13 });
            S.tex('Q^y=\\{y\\}', y, y, { color: 'orange', align: 'right', dx: -8, dy: -12, size: 13 });
          }
          const fx = phi(x), fy = psi(y);
          S.dot(x, PY + K * fx, { color: 'purple', r: 5 }); S.dot(PX + K * fy, y, { color: 'orange', r: 5 });
          st = { diag, fx, fy, I1: cache.I1, I2: cache.I2 };
          S.corner(diag ? `∫φ dμ = 1  ≠  ∫ψ dλ = 0` : `∫φ dμ = ${v.fix(cache.I1, 4)} = ∫ψ dλ = ${v.fix(cache.I2, 4)}`, 'br', { color: diag ? 'red' : 'green', weight: 600 });
        });
        v.legend([['accent', '$Q$', { area: true }], ['purple', '$Q_x$ and $\\varphi$'], ['orange', '$Q^y$ and $\\psi$']]);
        v.readout(() => {
          const s = st;
          if (s.diag) return `With $\\lambda$ = counting measure on $[0,1]$: $\\varphi(x)=\\lambda(\\{x\\})=1$ for every $x$, while $\\psi(y)=\\mu(\\{y\\})=0$ for every $y$. So $\\int_X\\varphi\\,d\\mu=1$ but $\\int_Y\\psi\\,d\\lambda=0$ — counting measure on an uncountable set is not $\\sigma$-finite.`;
          return `$\\varphi(${v.fix(g.x, 2)})=${v.fix(s.fx, 3)}$, $\\;\\psi(${v.fix(g.y, 2)})=${v.fix(s.fy, 3)}$. $\\;\\int_0^1\\varphi\\,dx=${v.fix(s.I1, 4)}$ and $\\int_0^1\\psi\\,dy=${v.fix(s.I2, 4)}$: slicing vertically or horizontally gives the same total.`;
        });
      },
    },
    {
      num: '8.7',
      kind: 'Definition',
      name: 'The product measure μ × λ',
      statement: String.raw`Let $(X,\mathscr S,\mu)$ and $(Y,\mathscr T,\lambda)$ be $\sigma$-finite measure spaces. For $Q\in\mathscr S\times\mathscr T$ define
$$(\mu\times\lambda)(Q)=\int_X\lambda(Q_x)\,d\mu(x)=\int_Y\mu(Q^y)\,d\lambda(y),$$
the two integrals being equal by Theorem 8.6. Then $\mu\times\lambda$ is a $\sigma$-finite measure on $\mathscr S\times\mathscr T$, the **product measure**, and $(\mu\times\lambda)(A\times B)=\mu(A)\lambda(B)$ for measurable rectangles.`,
      idea: String.raw`Countable additivity is inherited from the integral: if $Q=\bigcup Q_i$ disjointly, then $\lambda(Q_x)=\sum_i\lambda((Q_i)_x)$ for each $x$, and termwise integration of nonnegative series (1.27) gives $(\mu\times\lambda)(Q)=\sum_i(\mu\times\lambda)(Q_i)$. If $X=\bigcup X_n$ and $Y=\bigcup Y_m$ with finite measures, the rectangles $X_n\times Y_m$ show that $\mu\times\lambda$ is $\sigma$-finite.`,
      caption: String.raw`The factors need not be Lebesgue measure. Pick $\mu$ (drawn above the square) and $\lambda$ (drawn to its right): a density or a few atoms. The square shows how $\mu\times\lambda$ distributes its mass. Drag the set $Q$: a rectangle $A\times B$, where the product rule $\mu(A)\lambda(B)$ holds, or a disc. Right: the two integrands $x\mapsto\lambda(Q_x)$ against $d\mu$ and $y\mapsto\mu(Q^y)$ against $d\lambda$, drawn as weighted areas (for atoms, as weighted stems). Their totals always agree.`,
      deps: ['rca-8.6', 'rca-1.27', 'rca-1.18'],
      tags: ['product measure'],
      viz(v) {
        const M = v.M;
        // measures on [0,1]: mass of an interval, ∫ g dμ, and how to draw them
        const MU = {
          leb: { label: 'Lebesgue', mass: (a, b) => b - a, int: (g) => avg01(g, 600), dens: () => 1, max: 1 },
          dens: { label: 'density $2x$', mass: (a, b) => b * b - a * a, int: (g) => avg01((x) => 2 * x * g(x), 600), dens: (x) => 2 * x, max: 2 },
          atoms: { label: 'three atoms', atoms: [[0.18, 0.5], [0.55, 0.3], [0.84, 0.2]] },
        };
        const LA = {
          leb: { label: 'Lebesgue', mass: (a, b) => b - a, int: (g) => avg01(g, 600), dens: () => 1, max: 1 },
          dens: { label: 'density $\\frac{\\pi}{2}\\sin\\pi y$', mass: (a, b) => (Math.cos(Math.PI * a) - Math.cos(Math.PI * b)) / 2, int: (g) => avg01((y) => (Math.PI / 2) * Math.sin(Math.PI * y) * g(y), 600), dens: (y) => (Math.PI / 2) * Math.sin(Math.PI * y), max: Math.PI / 2 },
          atoms: { label: 'two atoms', atoms: [[0.28, 0.4], [0.7, 0.6]] },
        };
        for (const T of [MU.atoms, LA.atoms]) {
          T.mass = (a, b) => T.atoms.reduce((s, [p, w]) => s + (p >= a && p <= b ? w : 0), 0);
          T.int = (g) => T.atoms.reduce((s, [p, w]) => s + w * g(p), 0);
        }
        const mS = v.select('$\\mu$', Object.entries(MU).map(([value, o]) => ({ value, label: o.label })), 'dens');
        const lS = v.select('$\\lambda$', Object.entries(LA).map(([value, o]) => ({ value, label: o.label })), 'atoms');
        const qS = v.select('$Q$', [{ value: 'rect', label: 'rectangle $A\\times B$' }, { value: 'disc', label: 'disc' }], 'rect');
        const S = v.stage({ x: [-0.08, 1.5], y: [-0.1, 1.5], equal: true, height: 430, axes: false, weight: 1.25 });
        const R = v.stage({ x: [-0.05, 1.05], y: [-0.12, 1.24], height: 430, axes: false, title: 'integrands of the two iterated integrals' });
        const box = { x: [0, 1], y: [0, 1] };
        const r0 = S.handle(0.3, 0.16, { color: 'accent', r: 6, constrain: box }), r1 = S.handle(0.7, 0.58, { color: 'accent', r: 6, constrain: box });
        const dc = S.handle(0.52, 0.5, { color: 'accent', constrain: box });
        const rad = v.slider('disc radius', 0.05, 0.5, 0.3, { step: 0.01 });
        const TOP = 1.08, RIGHT = 1.08, H = 0.36;
        let st = {};
        v.render(() => {
          const mu = MU[mS.value], la = LA[lS.value], rect = qS.value === 'rect';
          r0.visible = r1.visible = rect; dc.visible = !rect; rad.el.hidden = rect;
          // mass picture inside the square
          const ac = v.rgb('accent'), pan = v.rgb('panel');
          if (mu.atoms && la.atoms) {
            for (const [p, w] of mu.atoms) for (const [q, u] of la.atoms) S.dot(p, q, { color: 'teal', r: 3 + 22 * Math.sqrt(w * u) * 0.9, alpha: 0.6 });
          } else if (mu.atoms) {
            for (const [p, w] of mu.atoms) for (let j = 0; j < 60; j++) { const y = (j + 0.5) / 60; S.line(p, j / 60, p, (j + 1) / 60, { color: 'teal', width: 2 + 14 * w, alpha: 0.15 + 0.6 * la.dens(y) / la.max, cap: 'butt' }); }
          } else if (la.atoms) {
            for (const [q, u] of la.atoms) for (let i = 0; i < 60; i++) { const x = (i + 0.5) / 60; S.line(i / 60, q, (i + 1) / 60, q, { color: 'teal', width: 2 + 14 * u, alpha: 0.15 + 0.6 * mu.dens(x) / mu.max, cap: 'butt' }); }
          } else {
            const tl = v.rgb('teal');
            S.raster((x, y) => {
              if (x < 0 || x > 1 || y < 0 || y > 1) return null;
              const t = 0.12 + 0.5 * (mu.dens(x) * la.dens(y)) / (mu.max * la.max);
              return [pan[0] + (tl[0] - pan[0]) * t, pan[1] + (tl[1] - pan[1]) * t, pan[2] + (tl[2] - pan[2]) * t];
            }, { key: `${mS.value}|${lS.value}|${pan}`, res: 3 });
          }
          S.rect(0, 0, 1, 1, { color: 'faint', width: 1.2 });
          // marginals
          S.line(0, TOP, 1, TOP, { color: 'muted', width: 1 }); S.line(RIGHT, 0, RIGHT, 1, { color: 'muted', width: 1 });
          if (mu.atoms) for (const [p, w] of mu.atoms) { S.line(p, TOP, p, TOP + H * w / 0.6, { color: 'blue', width: 3 }); S.dot(p, TOP + H * w / 0.6, { color: 'blue', r: 3.5 }); }
          else S.fn((x) => TOP + H * mu.dens(x) / 2, { domain: [0, 1], color: 'blue', width: 2, fill: 'blue', fillAlpha: 0.15, base: TOP });
          if (la.atoms) for (const [q, u] of la.atoms) { S.line(RIGHT, q, RIGHT + H * u / 0.6, q, { color: 'red', width: 3 }); S.dot(RIGHT + H * u / 0.6, q, { color: 'red', r: 3.5 }); }
          else { const ys = M.linspace(0, 1, 200); S.path([[RIGHT, 0], ...ys.map((y) => [RIGHT + H * la.dens(y) / 2, y]), [RIGHT, 1]], { color: 'red', width: 2, fill: 'red', fillAlpha: 0.15, close: true }); }
          S.tex('\\mu', -0.02, TOP + 0.12, { color: 'blue', align: 'right', size: 16 });
          S.tex('\\lambda', RIGHT + 0.2, -0.02, { color: 'red', baseline: 'top', size: 16 });
          // the set Q, its sections, and the two iterated formulas
          let secX, secY, ringQ;
          if (rect) {
            const A = [Math.min(r0.x, r1.x), Math.max(r0.x, r1.x)], B = [Math.min(r0.y, r1.y), Math.max(r0.y, r1.y)];
            secX = (x) => (x >= A[0] && x <= A[1] ? [B] : []); secY = (y) => (y >= B[0] && y <= B[1] ? [A] : []);
            ringQ = [[A[0], B[0]], [A[1], B[0]], [A[1], B[1]], [A[0], B[1]]];
            S.line(A[0], TOP, A[1], TOP, { color: 'accent', width: 5, cap: 'butt' }); S.line(RIGHT, B[0], RIGHT, B[1], { color: 'accent', width: 5, cap: 'butt' });
            S.tex('A', (A[0] + A[1]) / 2, TOP, { color: 'accent', baseline: 'top', dy: 3, size: 13 }); S.tex('B', RIGHT, (B[0] + B[1]) / 2, { color: 'accent', align: 'right', dx: -4, size: 13 });
            st.prod = mu.mass(A[0], A[1]) * la.mass(B[0], B[1]); st.muA = mu.mass(A[0], A[1]); st.laB = la.mass(B[0], B[1]);
          } else {
            const r = rad.value, cx = dc.x, cy = dc.y;
            const cut = (c, d) => { const h = r * r - (c - d) ** 2; if (h <= 0) return []; const s = Math.sqrt(h); return [[Math.max(0, d - s), Math.min(1, d + s)]].filter(([a, b]) => b > a); };
            secX = (x) => cut(x, cx).length ? [[Math.max(0, cy - Math.sqrt(r * r - (x - cx) ** 2)), Math.min(1, cy + Math.sqrt(r * r - (x - cx) ** 2))]] : [];
            secY = (y) => cut(y, cy).length ? [[Math.max(0, cx - Math.sqrt(r * r - (y - cy) ** 2)), Math.min(1, cx + Math.sqrt(r * r - (y - cy) ** 2))]] : [];
            ringQ = discRing(cx, cy, r).map(([x, y]) => [M.clamp(x, 0, 1), M.clamp(y, 0, 1)]);
            st.prod = null;
          }
          S.poly(ringQ, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.12 });
          if (rect) S.tex('Q', ringQ[3][0], ringQ[3][1], { color: 'accent', align: 'left', baseline: 'top', dx: 5, dy: 4, size: 16 });
          else S.tex('Q', dc.x, dc.y, { color: 'accent', align: 'left', dx: 10, dy: -12, size: 16 });
          const phi = (x) => secX(x).reduce((s, [a, b]) => s + la.mass(a, b), 0), psi = (y) => secY(y).reduce((s, [a, b]) => s + mu.mass(a, b), 0);
          const I1 = mu.int(phi), I2 = la.int(psi);
          st.I1 = I1; st.I2 = I2; st.rect = rect;
          // right: the integrands, weighted by the measure they are integrated against
          const plot = (m, g, y0, color, lab, val) => {
            const hgt = 0.42, xs = M.linspace(0, 1, 301);
            const vals = m.atoms ? m.atoms.map(([p, w]) => g(p) * w) : xs.map((x) => g(x) * m.dens(x));
            const top = Math.max(0.05, ...vals) * 1.08, k = hgt / top;
            R.line(0, y0, 1, y0, { color: 'muted', width: 1 });
            if (m.atoms) m.atoms.forEach(([p, w], i) => { R.line(p, y0, p, y0 + k * vals[i], { color, width: 4, cap: 'butt' }); R.dot(p, y0 + k * vals[i], { color, r: 4 }); });
            else R.path([[0, y0], ...xs.map((x, i) => [x, y0 + k * vals[i]]), [1, y0]], { color, width: 2, fill: color, fillAlpha: 0.2, close: true });
            R.tex(`${lab}=${val.toFixed(4)}`, 0, y0 + hgt + 0.02, { color, align: 'left', baseline: 'bottom', size: 13 });
          };
          plot(mu, phi, 0.68, 'purple', mu.atoms ? '\\textstyle\\sum_i \\mu_i\\,\\lambda(Q_{x_i})' : '\\int_X \\lambda(Q_x)\\,d\\mu(x)', I1);
          plot(la, psi, 0.04, 'orange', la.atoms ? '\\textstyle\\sum_j \\lambda_j\\,\\mu(Q^{y_j})' : '\\int_Y \\mu(Q^y)\\,d\\lambda(y)', I2);
          R.text('x', 1.03, 0.68, { size: 14, color: 'muted', math: true, align: 'left', dy: -8 });
          R.text('y', 1.03, 0.04, { size: 14, color: 'muted', math: true, align: 'left', dy: -8 });
        });
        v.legend([['blue', '$\\mu$ on $X$'], ['red', '$\\lambda$ on $Y$'], ['teal', 'mass of $\\mu\\times\\lambda$', { area: true }], ['accent', '$Q$', { area: true }], ['purple', '$\\lambda(Q_x)\\,d\\mu(x)$', { area: true }], ['orange', '$\\mu(Q^y)\\,d\\lambda(y)$', { area: true }]]);
        v.readout(() => {
          const s = st;
          const it = `$\\int_X\\lambda(Q_x)\\,d\\mu(x)=${v.fix(s.I1, 4)}$, $\\;\\int_Y\\mu(Q^y)\\,d\\lambda(y)=${v.fix(s.I2, 4)}$`;
          return s.rect ? `$\\mu(A)\\,\\lambda(B)=${v.fix(s.muA, 3)}\\times${v.fix(s.laB, 3)}=${v.fix(s.prod, 4)}$; ` + it + '.' : it + ' — the same number, which is $(\\mu\\times\\lambda)(Q)$.';
        });
      },
    },
  ],
};
