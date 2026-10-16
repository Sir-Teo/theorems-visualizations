// Computational Geometry & Graphics — Chapter 4: Linear programming and duality (§§4.6–4.9; §§4.1–4.5 in ch04.js)
import { lineEnds, randLines, zoneOf, pixelPattern, discAt, discrepancy, areaLeft, clipHalf } from './ch04.shared.js';

const f2 = (x) => (Math.abs(x) < 0.005 ? '0.00' : x.toFixed(2)).replace('-', '−');
const sg = (x) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2);
const PATS = [['random', 'random', 'pink'], ['jittered', 'jittered grid', 'orange'], ['regular', 'regular grid', 'teal'], ['halton', 'Halton', 'purple']];

export default {
  collection: 'cg',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Definition', name: 'Point–line duality',
      statement: String.raw`The **duality transform** sends a point $p=(a,b)$ to the non-vertical line $p^*:\ y=ax-b$, and a non-vertical line $\ell:\ y=mx+c$ to the point $\ell^*=(m,-c)$. It is an involution ($p^{**}=p$) and has these properties, each reading the same in both directions:
(a) incidence is kept: $p\in\ell$ if and only if $\ell^*\in p^*$;
(b) order is reversed in the following sense: $p$ lies above $\ell$ if and only if $\ell^*$ lies above $p^*$, and the vertical distance between the two is the same in both pictures;
(c) the line through $p$ and $q$ dualizes to the intersection point $p^*\cap q^*$, whose $x$-coordinate is the slope of $pq$;
(d) three points are collinear if and only if their three dual lines pass through one point.
Vertical lines have no dual, which is why dualizing assumes general position (or a rotation).`,
      idea: String.raw`Everything follows from one symmetric equation. Put $p=(a,b)$ and $\ell:y=mx+c$. Then $b-(ma+c)$ is the signed vertical gap of $p$ above $\ell$, and evaluating $p^*$ at $x=m$ gives $am-b$, so $\ell^*$ sits at height $-c-(am-b)=b-ma-c$ above $p^*$: the same number. Zero gap is incidence; the sign is the order; the number itself is the vertical distance. Applying the rule to the line through $p$ and $q$ (which is incident to both) shows that its dual lies on both $p^*$ and $q^*$. So a question about points and lines becomes the same question about lines and points, and a problem about collinear points becomes one about concurrent lines.`,
      caption: String.raw`Left: three draggable points $p_1,p_2,p_3$, the line $\ell$ through the two gold handles, and the line $p_1p_2$ (purple, dashed). Right: the dual picture, with a line $p_i^*$ for each point, the point $\ell^*$ (gold) and the point $(p_1p_2)^*$ (purple), which always sits where $p_1^*$ and $p_2^*$ cross. The coloured vertical bars show the gaps of $p_i$ above $\ell$ and, at $x=m$, of $\ell^*$ above $p_i^*$: always equal. **Make $p_3$ collinear** puts $p_3$ on $p_1p_2$, and the three dual lines meet in one point.`,
      deps: ['cg-1.1'], refs: ['de Berg §8.2'], tags: ['duality', 'arrangements'],
      viz(v) {
        const P = v.stage({ x: [-4, 4], y: [-3, 3], axes: true, height: 340, minWidth: 300, title: 'primal: points and a line' });
        const D = v.stage({ x: [-4, 4], y: [-7, 7], axes: true, height: 340, minWidth: 300, title: 'dual: lines and a point' });
        const COL = ['blue', 'orange', 'teal'];
        const p = [P.handle(-2.2, 1.2, { color: 'blue', label: 'p₁' }), P.handle(0.4, 2.0, { color: 'orange', label: 'p₂' }), P.handle(2.3, -0.7, { color: 'teal', label: 'p₃' })];
        const u = P.handle(-3.3, -1.6, { color: 'gold', label: 'ℓ' }), w = P.handle(3.2, 0.9, { color: 'gold' });
        v.button('make p₃ collinear with p₁p₂', () => {
          if (Math.abs(p[1].x - p[0].x) < 0.05) return;
          const m = (p[1].y - p[0].y) / (p[1].x - p[0].x), c = p[0].y - m * p[0].x;
          p[2].set(p[2].x, Math.max(-2.9, Math.min(2.9, m * p[2].x + c)));
        });
        v.button('reset', () => { [[-2.2, 1.2], [0.4, 2.0], [2.3, -0.7]].forEach(([x, y], i) => p[i].set(x, y)); u.set(-3.3, -1.6); w.set(3.2, 0.9); });
        v.legend([['blue', 'p₁, p₁*'], ['orange', 'p₂, p₂*'], ['teal', 'p₃, p₃*'], ['gold', 'ℓ, ℓ*'], ['purple', 'line p₁p₂ and its dual point', { dash: true }]]);
        let info = '';
        v.render(() => {
          const vertical = Math.abs(w.x - u.x) < 0.02;
          const m = vertical ? 0 : (w.y - u.y) / (w.x - u.x), c = u.y - m * u.x;
          const has12 = Math.abs(p[1].x - p[0].x) > 0.02, m12 = has12 ? (p[1].y - p[0].y) / (p[1].x - p[0].x) : 0, c12 = p[0].y - m12 * p[0].x;
          if (!vertical) P.fn((x) => m * x + c, { color: 'gold', width: 2.5 });
          if (has12) P.fn((x) => m12 * x + c12, { color: 'purple', width: 1.8, dash: true });
          const lines = [];
          p.forEach((q, i) => {
            const a = q.x, b = q.y;
            D.fn((x) => a * x - b, { color: COL[i], width: 2 });
            if (!vertical) {
              const gap = b - (m * a + c);
              P.segment([a, b], [a, m * a + c], { color: COL[i], width: 3, alpha: 0.7 });
              D.segment([m, a * m - b], [m, -c], { color: COL[i], width: 5, alpha: 0.7 });
              lines.push(`$p_${i + 1}$ is $${v.fix(Math.abs(gap), 2)}$ ${gap >= 0 ? 'above' : 'below'} $\\ell$ ⇔ $\\ell^*$ is $${v.fix(Math.abs(-c - (a * m - b)), 2)}$ ${gap >= 0 ? 'above' : 'below'} $p_${i + 1}^*$`);
            }
          });
          if (!vertical) D.dot(m, -c, { r: 7, color: 'gold', label: 'ℓ*', labelPos: 'ne' });
          if (has12) {
            D.dot(m12, -c12, { r: 6, color: 'purple', label: '(p₁p₂)*', labelPos: 'se' });
            D.vline(m12, { color: 'purple', dash: [4, 4], alpha: 0.5 });
            const g3 = p[2].y - (m12 * p[2].x + c12);
            lines.push(`slope of $p_1p_2$ = $${v.fix(m12, 2)}$ = $x$-coordinate of $p_1^*\\cap p_2^*$. $p_3$ is $${sg(g3)}$ from $p_1p_2$ ⇔ $p_3^*$ passes $${sg(-g3)}$ from that crossing${Math.abs(g3) < 0.03 ? ' — **concurrent**' : ''}`);
          }
          info = vertical ? 'The line ℓ is vertical, and vertical lines have no dual point: nudge a handle.' : lines.join('\n');
        });
        v.readout(() => info);
      },
    },
    // ------------------------------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Theorem', name: 'Arrangements of lines and the zone theorem',
      statement: String.raw`A set $L$ of $m$ lines in general position cuts the plane into an **arrangement** with $\binom m2$ vertices, $m^2$ edges and $1+m+\binom m2$ faces. The **zone** of another line $\ell$ is the set of faces that $\ell$ crosses. **Zone theorem:** the total number of edges of the faces in the zone of $\ell$ is $O(m)$, with a small constant (the best known bound is about $9.5\,m$). Consequently one can build the whole arrangement by inserting the lines one at a time into a doubly connected edge list, since the $i$-th line costs only the size of its zone, $O(i)$, for $O(m^2)$ in total, which is optimal because the output has size $\Theta(m^2)$.`,
      idea: String.raw`Count only the edges that bound a zone face on its left side; the right side is symmetric. Induction on $m$: remove the line of $L$ that crosses $\ell$ furthest to the right. In the smaller arrangement the zone has at most $5(m-1)$ left-bounding edges by induction; putting the line back splits at most a constant number of zone edges and adds a constant number of new ones, and the constant works out to $5$ more. Hence $\le5m$ per side. Intuitively, a face of a line arrangement is convex, so the line $\ell$ can only graze a face's long boundary a bounded number of times before the faces it enters become unrelated to the previous ones.`,
      caption: String.raw`Drag the gold line $\ell$ over the arrangement; the faces it crosses (its zone) are shaded orange and their edges are counted. The bars on the right show what building the arrangement line by line cost: the $i$-th bar is the zone of line $i$ in the arrangement of the first $i-1$ lines, which grows linearly (the dashed line is the $9.5\,(i-1)$ bound); the gold dot is the zone of your $\ell$. **New lines** redraws the arrangement.`,
      credit: 'B. Chazelle, L. J. Guibas & D. T. Lee, 1985; H. Edelsbrunner, J. O’Rourke & R. Seidel, 1986 (constant sharpened by Bern, Eppstein, Plassmann & Yao, 1991)',
      verify: true,
      deps: ['cg-4.6'], refs: ['de Berg §8.3'], tags: ['arrangements', 'zone theorem'],
      links: { doi: 'https://doi.org/10.1007/BF01934990' },
      viz(v) {
        const s = v.stage({ x: [-5, 5], y: [-3.6, 3.6], equal: true, axes: false, height: 380, minWidth: 340 });
        const G = v.stage({ x: [0, 12], y: [0, 40], axes: 'box', gutter: true, xlabel: 'line number i', ylabel: 'edges in the zone', title: 'cost of inserting line i', height: 380, minWidth: 280 });
        let seed = 1, L = [], ins = [], ymax = 40;
        const msl = v.slider('lines $m$', 3, 30, 10, { int: true, onChange: () => regen() });
        const regen = () => {
          const m = msl.value;
          L = randLines(v.rng(seed * 17 + m), m);
          ins = L.map((l, i) => { const P0 = [l[0] * l[2], l[1] * l[2]]; return zoneOf(L.slice(0, i), P0, [P0[0] - l[1], P0[1] + l[0]]).total; });
          ymax = Math.min(9.5 * (m - 1) + 4, Math.max(...ins) * 2.2 + 6);
        };
        v.button('new lines', () => { seed++; regen(); });
        const u = s.handle(-4.4, -1.9, { color: 'gold', label: 'ℓ' }), w = s.handle(4.3, 2.3, { color: 'gold' });
        regen();
        v.legend([['accent', 'cost of inserting line i'], ['gold', 'zone of ℓ', { dot: true }], ['muted', '9.5·(i−1)', { dash: true }]]);
        let info = '';
        v.render(() => {
          const m = msl.value, dx = w.x - u.x, dy = w.y - u.y, len = Math.hypot(dx, dy) || 1;
          const a = -dy / len, b = dx / len, c = a * u.x + b * u.y;
          const Z = zoneOf(L, [u.x, u.y], [w.x, w.y]);
          Z.faces.forEach((f) => { if (f.poly.length) s.poly(f.poly, { fill: 'orange', fillAlpha: 0.17, color: 'orange', width: 1.2, alpha: 0.9 }); });
          L.forEach((l) => { const e = lineEnds(l[0], l[1], l[2], [-5, 5], [-3.6, 3.6]); if (e) s.segment(e[0], e[1], { color: 'blue', width: 1.5, alpha: 0.75 }); });
          const e = lineEnds(a, b, c, [-5, 5], [-3.6, 3.6]);
          if (e) s.segment(e[0], e[1], { color: 'gold', width: 3.5 });
          G.setView([0, m + 2], [0, Math.max(ymax, Z.total * 1.2 + 2)]);
          G.fn((x) => 9.5 * (x - 1), { domain: [1, m], color: 'muted', dash: true, width: 1.5 });
          G.bars(ins, { x0: 1, dx: 1, color: 'accent' });
          G.dot(m + 1, Z.total, { r: 7, color: 'gold' });
          const tot = ins.reduce((t, x) => t + x, 0);
          info = `Zone of $\\ell$: ${Z.faces.length} faces (= $m+1$), **${Z.total} edges** = $${v.fix(Z.total / m, 2)}\\,m$ (worst-case bound about $9.5\\,m=${v.fix(9.5 * m, 0)}$). Building the arrangement line by line cost $\\sum_i \\text{zone}_i=${tot}$ edge visits, against $m^2=${m * m}$ edges in the final arrangement.`;
        });
        v.readout(() => info);
      },
    },
    // ------------------------------------------------------------------------------------------ 4.8
    {
      num: '4.8', kind: 'Concept', name: 'Discrepancy and supersampling',
      statement: String.raw`A pixel is the unit square, and a straight edge crossing it covers the part lying in a half-plane $h$. Estimating the coverage with $n$ sample points $P$ gives $|P\cap h|/n$, and the error is $\bigl|\,\mathrm{area}(h\cap[0,1]^2)-|P\cap h|/n\,\bigr|$. The **half-plane discrepancy** $D(P)$ is the largest such error over all half-planes $h$: the worst-case error of the sample pattern over every possible edge. It can be computed exactly by dualizing the points (4.6): $D$ is attained by a half-plane whose boundary passes through points of $P$, that is, at a vertex of the dual arrangement (4.7), so only the cells of that arrangement need to be examined.`,
      idea: String.raw`For a fixed direction, sweeping the boundary of $h$ across the square makes the true area grow continuously while the point count jumps by one at each sample, so the error is largest just before or just after a jump; only $n$ offsets per direction need testing. Over all directions the boundary can be assumed to touch samples, which is what the dual arrangement enumerates. Patterns that look equally good to the eye differ greatly in $D$: a regular grid is badly aligned with edges parallel to its rows, a purely random set clumps, and jittered or low-discrepancy sets (Halton, chapter 9) keep $D$ small. This is why anti-aliasing patterns are designed by discrepancy.`,
      caption: String.raw`Pick a sample pattern and the number $n=k^2$ of points. The red half-plane is the worst edge (for the direction selected by the gold handle on the right graph, initially the worst of all); its true area is compared with the fraction of points inside. The right graph shows the worst error $D(\theta)$ for each edge direction; the bottom graph compares the four patterns for growing $n$. Discrepancy is scanned over 720 directions (a very slightly low estimate of the exact value).`,
      credit: 'D. P. Dobkin, D. Eppstein & D. P. Mitchell, 1996 (computing the discrepancy and its use for supersampling patterns)',
      deps: ['cg-4.7'], refs: ['de Berg §8.1', 'de Berg §8.4'], tags: ['discrepancy', 'sampling'],
      links: { doi: 'https://doi.org/10.1145/234535.234536' },
      viz(v) {
        const s = v.stage({ x: [-0.12, 1.12], y: [-0.12, 1.12], equal: true, axes: false, height: 360, minWidth: 300 });
        const G = v.stage({ x: [0, 360], y: [0, 0.4], axes: 'box', gutter: true, xlabel: 'direction of the edge normal θ (degrees)', ylabel: 'worst error D(θ)', title: 'error against edge direction', height: 360, minWidth: 300 });
        const H = v.stage({ x: [3, 160], y: [0.015, 0.7], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'number of samples n = k²', ylabel: 'discrepancy D', title: 'discrepancy of the four patterns', height: 300, full: true });
        const pat = v.select('pattern', PATS.map(([value, label]) => ({ value, label })), 'jittered', { onChange: () => build() });
        const ksl = v.slider('points per side $k$', 2, 8, 4, { int: true, onChange: () => build() });
        let seed = 3, pts = [], res = null;
        const dh = G.handle(0, 0.1, { color: 'gold', r: 7, constrain: 'x' });
        const build = () => {
          pts = pixelPattern(pat.value, ksl.value, v.rng(seed * 7 + ksl.value));
          res = discrepancy(pts, 720);
          dh.set((res.th * 180) / Math.PI, res.d);
          G.setView([0, 360], [0, Math.max(0.08, res.d * 1.35)]);
        };
        v.button('resample', () => { seed++; build(); });
        v.button('snap to the worst edge', () => dh.set((res.th * 180) / Math.PI, res.d));
        build();
        // scaling of every pattern with n (computed once, 120 directions)
        const KS = [2, 3, 4, 5, 6, 8, 10, 12], SER = {};
        PATS.forEach(([key]) => {
          SER[key] = KS.map((k) => {
            const reps = key === 'random' || key === 'jittered' ? 3 : 1;
            let acc = 0;
            for (let r = 0; r < reps; r++) acc += discrepancy(pixelPattern(key, k, v.rng(40 + k * 5 + r)), 120).d;
            return [k * k, acc / reps];
          });
        });
        v.legend(PATS.map(([, label, col]) => [col, label]));
        const guide = (e, a) => [[4, a * Math.pow(4, e)], [144, a * Math.pow(144, e)]];
        v.render(() => {
          const th = (Math.max(0, Math.min(360, dh.x)) * Math.PI) / 180, q = discAt(pts, th), a = Math.cos(th), b = Math.sin(th);
          const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
          s.poly(sq, { color: 'ink', width: 2 });
          const half = clipHalf(sq, a, b, q.c);
          if (half.length > 2) s.poly(half, { fill: 'red', fillAlpha: 0.14, color: 'red', width: 0 });
          const e = lineEnds(a, b, q.c, [-0.12, 1.12], [-0.12, 1.12]);
          if (e) s.segment(e[0], e[1], { color: 'red', width: 2.5 });
          pts.forEach((p) => { const pr = a * p[0] + b * p[1]; s.dot(p[0], p[1], { r: 5, color: pr < q.c - 1e-12 ? 'red' : Math.abs(pr - q.c) < 1e-12 ? 'gold' : 'accent' }); });
          G.path(res.curve.map((d, j) => [j * 0.5, d]).concat([[360, res.curve[0]]]), { color: 'accent', width: 2.5 });
          G.dot((res.th * 180) / Math.PI, res.d, { r: 5, color: 'green', hollow: true });
          dh.set(dh.x, q.d);
          PATS.forEach(([key, , col]) => { H.path(SER[key], { color: col, width: 2.5 }); H.dots(SER[key], { r: 4, color: col }); });
          H.path(guide(-0.5, 0.9), { color: 'muted', width: 1, dash: [5, 5] });
          H.path(guide(-0.75, 1.2), { color: 'muted', width: 1, dash: [5, 5] });
          H.text('slope −½', 120, 0.9 * Math.pow(120, -0.5) * 1.35, { size: 11, color: 'muted' });
          H.text('slope −¾', 120, 1.2 * Math.pow(120, -0.75) * 0.55, { size: 11, color: 'muted' });
          H.dot(pts.length, res.d, { r: 7, color: 'gold' });
        });
        v.readout(() => {
          const th = (Math.max(0, Math.min(360, dh.x)) * Math.PI) / 180, q = discAt(pts, th), A = areaLeft(th, q.c);
          return `${pts.length} samples. Selected edge: area of the red part $${v.fix(A, 3)}$, fraction of samples in it $${q.k}/${pts.length}=${v.fix(q.k / pts.length, 3)}$, error $${v.fix(q.d, 3)}$ (in samples: ${v.fix(q.d * pts.length, 2)}).\nDiscrepancy of this pattern $D=${v.fix(res.d, 3)}$, i.e. any straight edge through the pixel is estimated to within ${v.fix(res.d * 100, 1)}% coverage. Dashed guides are slopes −½ and −¾ for comparison.`;
        });
      },
    },
    // ------------------------------------------------------------------------------------------ 4.9
    {
      num: '4.9', kind: 'Theorem', name: '3SUM-hardness of geometric problems',
      statement: String.raw`The **3SUM** problem asks, for $n$ distinct numbers, whether three of them sum to zero; it is solved in $O(n^2)$ time and conjectured to need $\Omega(n^{2-\varepsilon})$ for every $\varepsilon>0$ (cplx-12.6). A problem is **3SUM-hard** if 3SUM reduces to it in $o(n^2)$ time. **Theorem.** Deciding whether three of $n$ given points in the plane are **collinear** is 3SUM-hard. The reduction maps each number $a$ to the point $(a,a^3)$ on the cubic $y=x^3$: for distinct $a,b,c$ the three points are collinear if and only if $a+b+c=0$. By duality (4.6) the same holds for “do three of $n$ lines pass through one point?”. Hence a sub-quadratic algorithm for any of these problems would refute the 3SUM conjecture, and the $O(n^2)$ algorithm known for collinearity is believed optimal.`,
      idea: String.raw`The orientation determinant (1.2) of the three points factors completely: $\det\begin{pmatrix}b-a&b^3-a^3\\c-a&c^3-a^3\end{pmatrix}=(b-a)(c-a)(c-b)(a+b+c)$. For distinct numbers the first three factors are non-zero, so the determinant vanishes exactly when $a+b+c=0$. Making the points takes $O(n)$ time, and the answers coincide, so a fast collinearity test would solve 3SUM quickly. Dually, the points $(a,a^3)$ become lines, and collinear triples become concurrent triples. Gajentaan and Overmars used this to put many problems of computational geometry in one hardness class, so a single conjecture explains why none of them has beaten $n^2$.`,
      caption: String.raw`Type a list of integers (up to 14 distinct values between −12 and 12). Each number $a$ becomes the point $(a,a^3)$ on the cubic (left); the zero-sum triples (listed at right, drawn as rows on the number line) are exactly the triples of points lying on one straight line (green). The three gold sliders pick a probe triple $a,b,c$: the vertical distance of the third point from the chord through the first two is $(c-a)(c-b)(a+b+c)$, which is zero precisely when $a+b+c=0$.`,
      credit: 'A. Gajentaan & M. H. Overmars, 1995 (On a class of O(n²) problems in computational geometry)',
      deps: ['cg-4.6', 'cg-1.2', 'cplx-12.6'], refs: ['de Berg §8.2'], tags: ['3SUM', 'hardness'],
      links: { doi: 'https://doi.org/10.1016/0925-7721(95)00022-2' },
      viz(v) {
        const s = v.stage({ x: [-10, 10], y: [-1000, 1000], axes: true, height: 380, minWidth: 340, title: 'the points (a, a³) on the cubic' });
        const N = v.stage({ x: [-10, 10], y: [0, 1], axes: false, height: 240, minWidth: 300, title: 'zero-sum triples on the number line' });
        const inp = v.input('numbers', '-7, -5, -3, -2, 1, 2, 4, 6, 9', { width: 290, placeholder: 'e.g. -7, -5, 1, 6, 9', onChange: () => v.invalidate() });
        const A = v.slider('probe $a$', -12, 12, 4, { int: true }), B = v.slider('probe $b$', -12, 12, 6, { int: true }), C = v.slider('probe $c$', -12, 12, -10, { int: true });
        v.button('random instance', () => {
          const r = v.rng(Math.floor(Math.random() * 1e6)), set = new Set();
          while (set.size < 10) set.add(r.int(-12, 12));
          inp.set([...set].sort((x, y) => x - y).join(', '));
          v.invalidate();
        });
        const parse = () => {
          const out = [];
          for (const t of String(inp.value).split(/[\s,;]+/)) { const x = parseInt(t, 10); if (Number.isFinite(x) && Math.abs(x) <= 12 && !out.includes(x)) out.push(x); }
          return out.slice(0, 14).sort((x, y) => x - y);
        };
        let info = '';
        v.render(() => {
          const S = parse(), a = A.value, b = B.value, c = C.value;
          const M = Math.max(4, ...S.map(Math.abs), Math.abs(a), Math.abs(b), Math.abs(c)) + 1;
          s.setView([-M, M], [-1.12 * M ** 3, 1.12 * M ** 3]); N.setView([-M, M], [0, 1]);
          s.fn((x) => x * x * x, { color: 'faint', width: 1.5 });
          const trip = [];
          for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) for (let k = j + 1; k < S.length; k++) if (S[i] + S[j] + S[k] === 0) trip.push([S[i], S[j], S[k]]);
          const inT = new Set(trip.flat());
          trip.forEach(([x, y, z]) => s.segment([x, x ** 3], [z, z ** 3], { color: 'green', width: 2, alpha: 0.8 }));
          S.forEach((x) => { s.dot(x, x ** 3, { r: inT.has(x) ? 6 : 4.5, color: inT.has(x) ? 'green' : 'accent' }); if (S.length <= 14) s.text(String(x), x, x ** 3, { size: 10, color: 'muted', dx: x >= 0 ? -10 : 10, dy: x >= 0 ? 10 : -10 }); });
          if (a !== b) {
            const m = (b ** 3 - a ** 3) / (b - a), e = m * (c - a) + a ** 3;
            s.fn((x) => a ** 3 + m * (x - a), { color: 'gold', width: 2, dash: [6, 4] });
            s.segment([c, c ** 3], [c, e], { color: 'red', width: 3 });
          }
          [a, b, c].forEach((x, i) => s.dot(x, x ** 3, { r: 8, color: 'gold', hollow: true }));
          // number line
          N.segment([-M, 0.12], [M, 0.12], { color: 'muted', width: 1.5 });
          S.forEach((x) => { N.dot(x, 0.12, { r: 4, color: inT.has(x) ? 'green' : 'accent' }); N.text(String(x), x, 0.12, { size: 10, color: 'muted', dy: 12 }); });
          trip.slice(0, 6).forEach((t, r) => {
            const y = 0.3 + r * 0.115;
            N.segment([t[0], y], [t[2], y], { color: 'green', width: 2, alpha: 0.6 });
            t.forEach((x) => N.dot(x, y, { r: 5, color: 'green' }));
            N.text(`${t[0]} + (${t[1]}) + (${t[2]}) = 0`.replace(/\+ \(-/g, '+ (−').replace(/^-/, '−'), -M + 0.3, y + 0.05, { size: 11, color: 'ink', align: 'left' });
          });
          if (trip.length > 6) N.corner(`+ ${trip.length - 6} more`, 'tr', { color: 'muted' });
          if (!trip.length) N.corner('no zero-sum triple: no three points are collinear', 'tl', { color: 'muted' });
          const n = S.length, det = a === b ? 0 : (b - a) * (c - a) * (c - b) * (a + b + c);
          const distinct = a !== b && a !== c && b !== c;
          info = `$n=${n}$ numbers, ${trip.length} zero-sum triple${trip.length === 1 ? '' : 's'} = ${trip.length} collinear triple${trip.length === 1 ? '' : 's'} of points (brute force checks $\\binom n3=${(n * (n - 1) * (n - 2)) / 6}$ triples; the quadratic algorithm about $n^2=${n * n}$ steps).\nProbe $a,b,c=${a},${b},${c}$: $a+b+c=${a + b + c}$; orientation determinant $(b-a)(c-a)(c-b)(a+b+c)=${det}$ — ${!distinct ? 'not distinct, the factorization argument needs distinct numbers' : det === 0 ? 'collinear, as the sum is zero' : 'not collinear'}.`;
        });
        v.readout(() => info);
      },
    },
  ],
};
