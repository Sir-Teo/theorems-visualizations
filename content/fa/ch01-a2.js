// Rudin, Functional Analysis — Chapter 1, part 2: closures, balanced neighbourhoods, linear maps,
// finite-dimensional subspaces (1.13–1.21).

const TAU = 2 * Math.PI;
function circlePoly(cx, cy, r, n = 96) { const out = []; for (let i = 0; i < n; i++) { const t = TAU * i / n; out.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return out; }
function ellipsePoly(cx, cy, a, b, phi, n = 96) {
  const c = Math.cos(phi), s = Math.sin(phi), out = [];
  for (let i = 0; i < n; i++) { const t = TAU * i / n, u = a * Math.cos(t), w = b * Math.sin(t); out.push([cx + c * u - s * w, cy + s * u + c * w]); }
  return out;
}
function segDist(px, py, ax, ay, bx, by) {
  const ex = bx - ax, ey = by - ay, L = ex * ex + ey * ey || 1;
  let t = ((px - ax) * ex + (py - ay) * ey) / L; t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - ax - t * ex, py - ay - t * ey);
}
function edgeDist(px, py, poly) { let d = Infinity; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) d = Math.min(d, segDist(px, py, poly[j][0], poly[j][1], poly[i][0], poly[i][1])); return d; }
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function rayExit(poly, ux, uy) {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const ax = poly[j][0], ay = poly[j][1], ex = poly[i][0] - ax, ey = poly[i][1] - ay;
    const den = ux * ey - uy * ex; if (Math.abs(den) < 1e-12) continue;
    const t = (ax * ey - ay * ex) / den, s = (ax * uy - ay * ux) / den;
    if (s >= -1e-9 && s <= 1 + 1e-9 && t > 1e-12 && t < best) best = t;
  }
  return best;
}
function isConvexPoly(poly, tol = 1e-9) {
  let sgn = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], c = poly[(i + 2) % poly.length];
    const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    const sc = Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1]);
    if (Math.abs(cr) <= tol * (sc || 1)) continue;
    if (!sgn) sgn = Math.sign(cr); else if (Math.sign(cr) !== sgn) return false;
  }
  return true;
}
/** Balanced core of a polygon U containing 0: radial function min(ρ(θ), ρ(θ+π)) over ℝ, or the inscribed disc about 0 over ℂ. */
function balancedCore(U, complex, n = 360) {
  if (complex) { const r = edgeDist(0, 0, U); return circlePoly(0, 0, r, 180); }
  const out = [];
  for (let i = 0; i < n; i++) { const t = TAU * i / n, c = Math.cos(t), s = Math.sin(t); const r = Math.min(rayExit(U, c, s), rayExit(U, -c, -s)); out.push([r * c, r * s]); }
  return out;
}
const supNorm = (f, n = 400) => { let m = 0; for (let i = 0; i <= n; i++) m = Math.max(m, Math.abs(f(i / n))); return m; };

export default {
  collection: 'fa',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Theorem',
      name: 'Closures of subspaces, convex, balanced and bounded sets',
      statement: String.raw`Let $X$ be a topological vector space.
(a) If $A\subset X$, then $\overline A=\bigcap(A+V)$, the intersection taken over all neighbourhoods $V$ of $0$.
(b) If $A,B\subset X$, then $\overline A+\overline B\subset\overline{A+B}$.
(c) If $Y$ is a subspace of $X$, so is $\overline Y$.
(d) If $C$ is convex, so are $\overline C$ and the interior $C^\circ$.
(e) If $B$ is balanced, so is $\overline B$; if moreover $0\in B^\circ$, then $B^\circ$ is balanced.
(f) If $E$ is bounded, so is $\overline E$.`,
      idea: String.raw`(a) $x\in\overline A$ iff $x-V$ meets $A$ for every $V$, iff $x\in A+V$ for every $V$ (replace $V$ by $-V$). (b) By continuity of addition, a neighbourhood of $a+b$ contains $W_1+W_2$ with $W_1\ni a$, $W_2\ni b$; these meet $A$ and $B$. (c)–(e) combine (b) with continuity of scalar multiplication, e.g. $t\overline C+(1-t)\overline C\subset\overline{tC+(1-t)C}\subset\overline C$; for interiors one uses that $tC^\circ+(1-t)C^\circ$ is open. (f) Pick $W$ with $\overline W\subset V$ (1.11); then $E\subset tW$ gives $\overline E\subset t\overline W\subset tV$.`,
      caption: String.raw`Choose a part of the theorem.
(a) Drag $q$ and shrink $V=rB$: $q$ survives in every $A+V$ exactly when $\dist(q,A)=0$. Here $A$ is a slit open disc together with a sequence; the slit, the rim and the limit point $p$ are not in $A$ but are in $\overline A$.
(b) Two closed sets whose sum is not closed: $A+B$ is the open upper half-plane, so the $x$-axis lies in $\overline{A+B}$ but not in $\overline A+\overline B$. Drag $a$ along $A$ and $b$ along $B$.
(e) The double cone $|y|\le|x|$ is balanced over $\R$, but its interior misses $0$ and is not balanced — until a disc around $0$ is added.`,
      deps: ['fa-1.6', 'fa-1.4', 'fa-1.11'],
      tags: ['closure', 'convexity', 'balanced sets'],
      viz(v) {
        const mode = v.select('part', [{ value: 'a', label: 'a: $\\overline A=\\bigcap(A+V)$' }, { value: 'b', label: 'b: $\\overline A+\\overline B\\subset\\overline{A+B}$' }, { value: 'e', label: 'e: balanced interior' }], 'a');
        const rS = v.slider('$r$ (part a)', 0.02, 0.8, 0.35, { step: 0.01 });
        const disc = v.toggle('add a disc $D$ around $0$ (part e)', false);
        const S = v.stage({ x: [-3, 3], y: [-1.7, 1.7], equal: true, height: 360, ticks: false });
        const q = S.handle(0.35, 0.95, { color: 'gold', label: 'q' });
        const ha = S.handle(0.8, 1.25, { color: 'blue', label: 'a', constrain: (x) => { const t = Math.min(6, Math.max(0.18, x)); return [t, 1 / t]; } });
        const hb = S.handle(-0.9, 0, { color: 'purple', label: 'b', constrain: 'x' });
        const hx = S.handle(1.2, 0.45, { color: 'accent', label: 'x' });
        const DC = [-1.35, 0], DR = 0.95;
        const seq = Array.from({ length: 80 }, (_, i) => { const k = i + 1; return [0.75 + 1.7 / k, (k % 2 ? 0.55 : -0.55) / k]; });
        const P = [0.75, 0];
        const dA = (x, y) => { let d = Math.max(0, Math.hypot(x - DC[0], y - DC[1]) - DR); for (const s of seq) d = Math.min(d, Math.hypot(x - s[0], y - s[1])); return d; };
        let st = {};
        v.render(() => {
          const m = mode.value;
          q.visible = m === 'a'; ha.visible = hb.visible = m === 'b'; hx.visible = m === 'e';
          if (m === 'a') {
            const r = rS.value, acc = v.rgb('accent');
            S.raster((x, y) => (dA(x, y) < r ? [acc[0], acc[1], acc[2], 46] : null), { res: 2, key: `${r}|${acc}` });
            S.circle(DC[0], DC[1], DR, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1.6, dash: [5, 4] });
            S.line(DC[0], DC[1], DC[0] + DR, DC[1], { color: 'panel', width: 3 });
            S.line(DC[0], DC[1], DC[0] + DR, DC[1], { color: 'red', width: 1, dash: [2, 3] });
            S.text('slit ∉ A', DC[0] + DR * 0.5, 0, { size: 11, color: 'red', dy: -10, align: 'center' });
            S.dots(seq, { color: 'accent', r: 2.6 });
            S.dot(P[0], P[1], { hollow: true, color: 'red', r: 4.5, label: 'p ∉ A', labelPos: 's', math: false, labelSize: 12 });
            S.tex('A', DC[0] - 0.45, 0.45, { color: 'accent', size: 18 });
            const d = dA(q.x, q.y);
            S.circle(q.x, q.y, r, { color: 'orange', width: 1.2, dash: [3, 3] });
            const b = S.bounds;
            S.circle(b.x[1] - 0.25 - r, b.y[1] - 0.25 - r, r, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.4 });
            S.tex('V', b.x[1] - 0.25 - 2 * r, b.y[1] - 0.25 - r, { color: 'orange', align: 'right', dx: -5 });
            st = { m, d, r };
          } else if (m === 'b') {
            const b = S.bounds;
            S.rect(b.x[0] - 1, 0, b.x[1] + 1, b.y[1] + 1, { fill: 'green', fillAlpha: 0.1, stroke: false });
            S.hline(0, { color: 'purple', width: 2.6 });
            S.hline(0, { color: 'green', width: 1.2, dash: [5, 5] });
            S.fn((x) => 1 / x, { domain: [0.05, 20], color: 'blue', width: 2.6 });
            S.tex('A=\\{(t,1/t):t>0\\}', 1.25, 1.35, { color: 'blue', align: 'left', size: 15 });
            S.tex('B=\\R\\times\\{0\\}', b.x[0] + 0.15, -0.3, { color: 'purple', align: 'left', size: 15 });
            S.tex('A+B=\\{y>0\\}', -2.1, 1.2, { color: 'green', size: 15 });
            const sx = ha.x + hb.x, sy = ha.y + hb.y;
            S.line(hb.x, hb.y, sx, sy, { color: 'faint', dash: [3, 4], width: 1.2 });
            S.line(ha.x, ha.y, sx, sy, { color: 'faint', dash: [3, 4], width: 1.2 });
            S.dot(sx, sy, { color: 'green', r: 5, label: 'a+b', labelPos: 'n' });
            S.text('x-axis ⊂ closure of A+B, but not in A+B', b.x[1] - 0.1, -0.55, { align: 'right', size: 12, color: 'red' });
            st = { m, sy };
          } else {
            const b = S.bounds, L = 6;
            const cone = [[[0, 0], [L, L], [L, -L]], [[0, 0], [-L, L], [-L, -L]]];
            for (const c of cone) S.poly(c, { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 1.6 });
            const withDisc = disc.value, R0 = 0.55;
            if (withDisc) S.circle(0, 0, R0, { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 1.6 });
            const inInt = (x, y) => Math.abs(y) < Math.abs(x) - 1e-12 || (withDisc && Math.hypot(x, y) < R0);
            // the set {αx : α ∈ [-1,1]}
            const seg = []; let bad = null;
            for (let i = 0; i <= 200; i++) { const a = -1 + 2 * i / 200; const p = [a * hx.x, a * hx.y]; seg.push(p); if (!inInt(p[0], p[1]) && !bad) bad = p; }
            S.path(seg, { color: 'orange', width: 3 });
            S.dot(-hx.x, -hx.y, { color: 'orange', r: 3.5, label: '−x', labelPos: 'sw' });
            const okX = inInt(hx.x, hx.y);
            if (bad && okX) S.dot(bad[0], bad[1], { hollow: true, color: 'red', r: 6, width: 2.4, label: withDisc ? '' : '0 ∉ B°', labelPos: 'n', math: false, labelSize: 12 });
            S.tex(withDisc ? 'B=\\{|y|\\le|x|\\}\\cup D' : 'B=\\{|y|\\le|x|\\}', b.x[1] - 0.15, b.y[1] - 0.15, { color: 'accent', align: 'right', baseline: 'top', size: 15 });
            st = { m, okX, bad: !!bad, withDisc };
          }
        });
        v.readout(() => {
          const s = st; if (!s.m) return '';
          if (s.m === 'a') return `$\\dist(q,A) = ${v.fix(s.d, 3)}$, $r = ${v.fix(s.r, 2)}$: $q ${s.d < s.r ? '\\in' : '\\notin'} A+V$. ` + (s.d < 1e-9 ? 'Since the distance is $0$, $q$ lies in every $A+V$, i.e. $q\\in\\overline A$.' : `Every $r\\le ${v.fix(s.d, 3)}$ excludes $q$, so $q\\notin\\overline A$.`);
          if (s.m === 'b') return `$a+b$ has height $${v.fix(s.sy, 3)}>0$: every point of $A+B$ lies strictly above the axis, yet $(x,0)=\\lim\\big((x-t,0)+(t,1/t)\\big)$ as $t\\to\\infty$.`;
          if (!s.okX) return 'Drag $x$ into the interior $B^\\circ$.';
          return s.withDisc ? 'Now $0\\in B^\\circ$ and the whole segment $\\{\\alpha x: |\\alpha|\\le1\\}$ stays in $B^\\circ$: the interior is balanced.' : '$x\\in B^\\circ$, but $0\\cdot x=0\\notin B^\\circ$: the interior of a balanced set need not be balanced when $0\\notin B^\\circ$. The closure $\\overline B=B$ is balanced.';
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Theorem',
      name: 'Balanced neighbourhoods exist',
      statement: String.raw`In a topological vector space $X$:
(a) every neighbourhood of $0$ contains a balanced neighbourhood of $0$;
(b) every convex neighbourhood of $0$ contains a balanced convex neighbourhood of $0$.`,
      idea: String.raw`(a) Continuity of $(\alpha,x)\mapsto\alpha x$ at $(0,0)$ gives $\delta>0$ and a neighbourhood $V$ with $\alpha V\subset U$ whenever $\abs{\alpha}<\delta$; then $W=\bigcup_{\abs\alpha<\delta}\alpha V$ is a balanced neighbourhood inside $U$. (b) For convex $U$ put $A=\bigcap_{\abs\alpha=1}\alpha U$. It contains the balanced $W$ from (a), so it is a neighbourhood; it is convex as an intersection of convex sets, and it is balanced, hence so is its interior (1.13(e)).`,
      caption: String.raw`Drag the vertices of the neighbourhood $U$ of $0$ (blue). Green is the largest balanced set $W=\{x:\alpha x\in U\text{ for all }\abs\alpha\le1\}$ inside it. Over $\R$ it is $\{x:[-x,x]\subset U\}$, which equals $U\cap(-U)$ (dashed) when $U$ is convex; over $\C$ it is the largest disc about $0$ in $U$. Make $U$ non-convex and the core may lose convexity — part (b) needs convex $U$.`,
      deps: ['fa-1.6', 'fa-1.4', 'fa-1.13'],
      tags: ['balanced sets', 'neighbourhoods'],
      viz(v) {
        const field = v.select('scalars', [{ value: 'R', label: '$\\R$' }, { value: 'C', label: '$\\C$' }], 'R');
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.8, 1.8], equal: true, height: 370, ticks: false });
        const init = [[1.75, 0.25], [0.65, 1.3], [-0.85, 1.05], [-1.35, -0.25], [-0.35, -1.15], [1.15, -0.95]];
        const H = init.map(([x, y]) => S.handle(x, y, { color: 'blue', r: 6 }));
        let st = {};
        v.render(() => {
          const U = H.map((h) => [h.x, h.y]);
          const zeroIn = inPoly(0, 0, U);
          const C = field.value === 'C';
          S.poly(U, { fill: 'blue', fillAlpha: 0.1, color: 'blue', width: 2 });
          if (!C) S.poly(U.map(([x, y]) => [-x, -y]), { color: 'faint', width: 1.4, dash: [5, 4] });
          let W = null, convW = false;
          if (zeroIn) {
            W = balancedCore(U, C);
            convW = isConvexPoly(W, 1e-6);
            S.poly(W, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2.2 });
            S.tex('W', 0.12, 0.12, { color: 'green', align: 'left', baseline: 'bottom', size: 16 });
          }
          S.dot(0, 0, { color: 'ink', r: 3 });
          S.tex('U', U[0][0], U[0][1], { color: 'blue', dx: 16, size: 16 });
          if (!C) S.tex('-U', -U[0][0], -U[0][1], { color: 'muted', dx: -18, size: 14 });
          st = { zeroIn, convU: isConvexPoly(U), convW, C };
        });
        v.legend([['blue', 'neighbourhood $U$', { area: true }], ['faint', '$-U$', { dash: true }], ['green', 'balanced core $W$', { area: true }]]);
        v.readout(() => {
          const s = st; if (s.zeroIn == null) return '';
          if (!s.zeroIn) return 'Keep $0$ inside $U$.';
          return `$U$ ${s.convU ? 'is convex' : 'is **not** convex'}; $W$ ${s.convW ? 'is convex' : 'is not convex'}` + (s.C ? ' (over $\\C$ the core is a disc, hence always convex).' : (s.convU ? ' — as (b) predicts, $W=U\\cap(-U)$.' : ' — without convexity of $U$, only (a) is guaranteed.'));
        });
      },
    },
    // ------------------------------------------------------------------ 1.14a
    {
      num: '1.14a',
      kind: 'Corollary',
      name: 'Balanced (convex) local bases',
      statement: String.raw`(a) Every topological vector space has a balanced local base.
(b) Every locally convex space has a balanced convex local base.`,
      idea: String.raw`Replace each member $U$ of a local base (convex in case (b)) by a balanced (convex) neighbourhood $W\subset U$ supplied by 1.14. Every neighbourhood of $0$ contains some $U$, hence the smaller $W$, so the new family is again a local base.`,
      caption: String.raw`Orange outlines: a local base $U_n=(0.6)^nU$ of convex but lopsided triangles. Green: the balanced convex sets $W_n=U_n\cap(-U_n)$. Drag the corner of the target neighbourhood $G$ (an ellipse about $0$): the first $U_n$ and the first $W_n$ inside $G$ are highlighted, and $W_n\subset U_n$ means the balanced family is never slower. Switch to a non-convex $U$ to see a balanced but non-convex base.`,
      deps: ['fa-1.14', 'fa-1.8'],
      tags: ['balanced sets', 'local base', 'local convexity'],
      viz(v) {
        const shape = v.select('$U$', [{ value: 'tri', label: 'convex triangle' }, { value: 'dart', label: 'non-convex dart' }], 'tri');
        const S = v.stage({ x: [-2.4, 2.4], y: [-1.7, 1.7], equal: true, height: 370, ticks: false });
        const g = S.handle(0.5, 0.26, { color: 'red', label: 'G', r: 6 });
        const SH = { tri: [[-0.55, -0.7], [2.1, -0.35], [-0.25, 1.55]], dart: [[-0.6, -0.8], [2.1, -0.2], [0.2, 0.15], [-0.15, 1.55]] };
        let st = {};
        v.render(() => {
          const U0 = SH[shape.value];
          const a = Math.max(0.08, Math.SQRT2 * Math.abs(g.x)), b = Math.max(0.08, Math.SQRT2 * Math.abs(g.y));
          const inG = (p) => (p[0] / a) ** 2 + (p[1] / b) ** 2 < 1;
          let nU = null, nW = null;
          for (let n = 0; n <= 9; n++) {
            const s = Math.pow(0.6, n), Un = U0.map(([x, y]) => [s * x, s * y]);
            const Wn = balancedCore(Un, false, 240);
            if (nU == null && Un.every(inG)) nU = n;
            if (nW == null && Wn.every(inG)) nW = n;
          }
          for (let n = 0; n <= 5; n++) {
            const s = Math.pow(0.6, n), Un = U0.map(([x, y]) => [s * x, s * y]);
            const Wn = balancedCore(Un, false, 240);
            S.poly(Wn, { fill: 'green', fillAlpha: n === nW ? 0.45 : 0.07, color: 'green', width: n === nW ? 2.4 : 1 });
            S.poly(Un, { color: 'orange', width: n === nU ? 2.6 : 1.1, alpha: n === nU ? 1 : 0.75 });
          }
          S.poly(ellipsePoly(0, 0, a, b, 0, 120), { color: 'red', width: 1.8, dash: [6, 4], fill: 'red', fillAlpha: 0.05 });
          S.dot(0, 0, { color: 'ink', r: 2.5 });
          S.tex('U_0', 2.1, -0.35, { color: 'orange', align: 'left', dx: 6, size: 14 });
          st = { nU, nW, conv: shape.value === 'tri' };
        });
        v.legend([['orange', 'local base $U_n$'], ['green', 'balanced core $W_n=U_n\\cap(-U_n)$', { area: true }], ['red', 'neighbourhood $G$', { dash: true }]]);
        v.readout(() => {
          const { nU, nW, conv } = st; if (nU === undefined) return '';
          return `First $U_n\\subset G$: $n=${nU ?? '>9'}$; first $W_n\\subset G$: $n=${nW ?? '>9'}$. ` + (conv ? 'Each $W_n$ is balanced and convex.' : 'The cores are balanced, but not convex: (b) needs a convex base.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Theorem',
      name: 'Neighbourhoods absorb; compact sets are bounded',
      statement: String.raw`Let $V$ be a neighbourhood of $0$ in a topological vector space $X$.
(a) If $0<r_1<r_2<\cdots$ and $r_n\to\infty$, then $X=\bigcup_n r_nV$.
(b) Every compact subset of $X$ is bounded.
(c) If $V$ is bounded and $\delta_1>\delta_2>\cdots$ with $\delta_n\to 0$, then $\{\delta_nV:n=1,2,\dots\}$ is a local base for $X$.`,
      idea: String.raw`(a) For fixed $x$, $\alpha\mapsto\alpha x$ is continuous, so $x/r_n\in V$ for large $n$. (b) Given $V$, take a balanced $W\subset V$ (1.14); then $K\subset\bigcup nW$ by (a), compactness gives $K\subset nW$ for one $n$, and balance gives $K\subset tW\subset tV$ for all $t>n$. (c) If $U$ is any neighbourhood of $0$, boundedness of $V$ gives $V\subset sU$, so $\delta_nV\subset U$ once $s\delta_n<1$.`,
      caption: String.raw`Left, (a) and (b): the dilates $nV$ of a thin neighbourhood. Drag the point $x$ and the compact set $K$; the readout finds the first $n$ with $x\in nV$ and with $K\subset nV$. Right, (c): the shrinking copies $\delta_nV$, $\delta_n=1/n$, and a small disc $U$ (drag its rim). A bounded $V$ eventually fits inside $U$; the unbounded strip never does, so its dilates are not a local base.`,
      deps: ['fa-1.14', 'fa-1.6'],
      tags: ['boundedness', 'compactness', 'local base'],
      viz(v) {
        const kind = v.select('$V$ on the right', [{ value: 'ell', label: 'bounded ellipse' }, { value: 'strip', label: 'unbounded strip' }], 'ell');
        const L = v.stage({ x: [-3, 3], y: [-2.2, 2.2], equal: true, height: 340, ticks: false, title: '(a), (b): $X=\\bigcup nV$, and $K\\subset nV$' });
        const R = v.stage({ x: [-1.6, 1.6], y: [-1.2, 1.2], equal: true, height: 340, ticks: false, title: '(c): $\\delta_n V$ with $\\delta_n=1/n$' });
        const V0 = ellipsePoly(0, 0, 0.42, 0.14, 0.5, 100);
        const hx = L.handle(-1.2, -0.3, { color: 'gold', label: 'x' });
        const hk = L.handle(1.7, 0.5, { color: 'blue', label: 'K' });
        const Kshape = v.M.blob(0, 0, 0.3, 3, 0.3, 60);
        const hu = R.handle(0.55, 0, { color: 'red', r: 6 });
        const gauge = (P, x, y) => { const r = Math.hypot(x, y); return r < 1e-12 ? 0 : r / rayExit(P, x / r, y / r); };
        let st = {};
        v.render(() => {
          // left
          const nx = Math.ceil(gauge(V0, hx.x, hx.y) + 1e-9);
          const K = Kshape.map(([x, y]) => [hk.x + x, hk.y + y]);
          const nK = Math.ceil(Math.max(...K.map(([x, y]) => gauge(V0, x, y))) + 1e-9);
          const top = Math.min(12, Math.max(nx, nK));
          for (let n = 1; n <= top; n++) {
            const hi = n === nx || n === nK;
            L.poly(V0.map(([x, y]) => [n * x, n * y]), { color: n === nK ? 'blue' : n === nx ? 'gold' : 'orange', width: hi ? 2.2 : 0.9, alpha: hi ? 1 : 0.55, fill: n === 1 ? 'orange' : null, fillAlpha: 0.35 });
          }
          L.poly(K, { fill: 'blue', fillAlpha: 0.3, color: 'blue', width: 1.6 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          L.tex('V', 0.42 * Math.cos(0.5), 0.42 * Math.sin(0.5), { color: 'orange', size: 13, dx: 6, dy: -6 });
          // right
          const strip = kind.value === 'strip';
          const rU = Math.max(0.08, Math.hypot(hu.x, hu.y));
          let first = null;
          const b = R.bounds;
          for (let n = 1; n <= 12; n++) {
            const d = 1 / n;
            let inside;
            if (strip) inside = false;
            else { const P = V0.map(([x, y]) => [x * 2.4 * d, y * 2.4 * d]); inside = P.every(([x, y]) => Math.hypot(x, y) < rU); }
            if (inside && first == null) first = n;
            const col = first === n ? 'green' : 'orange', w = first === n ? 2.4 : 1, al = first === n ? 1 : 0.6;
            if (strip) { const hgt = 0.5 * d; R.rect(b.x[0] - 1, -hgt, b.x[1] + 1, hgt, { color: col, width: w, alpha: al, fill: n === 1 ? 'orange' : null, fillAlpha: 0.12 }); }
            else R.poly(V0.map(([x, y]) => [x * 2.4 * d, y * 2.4 * d]), { color: col, width: w, alpha: al, fill: first === n ? 'green' : n === 1 ? 'orange' : null, fillAlpha: 0.2 });
          }
          R.circle(0, 0, rU, { color: 'red', width: 1.8, dash: [6, 4] });
          R.tex('U', rU * 0.72, rU * 0.72, { color: 'red', dx: 8, dy: -8 });
          R.dot(0, 0, { color: 'ink', r: 2.5 });
          if (strip) R.corner('no δₙV fits in U', 'tl', { color: 'red', weight: 600 });
          st = { nx, nK, first, strip };
        });
        v.legend([['orange', '$nV$ / $\\delta_nV$'], ['gold', 'first $nV\\ni x$'], ['blue', 'first $nV\\supset K$'], ['green', 'first $\\delta_nV\\subset U$'], ['red', 'target $U$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (s.nx == null) return '';
          return `Left: $x\\in ${s.nx}V$ and $K\\subset ${s.nK}V$ (and in every larger $nV$, since $V$ is balanced). Right: ` + (s.strip ? 'the strip is not bounded: $\\delta_nV$ always contains the whole horizontal axis, so no $\\delta_nV$ lies in $U$.' : `$\\delta_{${s.first ?? '>12'}}V\\subset U$ — bounded $V$ shrinks into every neighbourhood.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.17
    {
      num: '1.17',
      kind: 'Theorem',
      name: 'Linear maps continuous at 0 are uniformly continuous',
      statement: String.raw`Let $X$ and $Y$ be topological vector spaces. If $\Lambda:X\to Y$ is linear and continuous at $0$, then $\Lambda$ is continuous. In fact $\Lambda$ is uniformly continuous: for every neighbourhood $W$ of $0$ in $Y$ there is a neighbourhood $V$ of $0$ in $X$ such that $y-x\in V$ implies $\Lambda y-\Lambda x\in W$.`,
      idea: String.raw`Continuity at $0$ gives $V$ with $\Lambda(V)\subset W$. Linearity does the rest: if $y-x\in V$ then $\Lambda y-\Lambda x=\Lambda(y-x)\in W$, with the same $V$ at every base point $x$. For non-linear maps nothing of the sort holds.`,
      caption: String.raw`Left: $X=\R^2$; right: $Y=\R^2$. Drag the images $\Lambda e_1,\Lambda e_2$ to set the matrix, drag $x$ and $y$ in $X$. The orange set $V=\Lambda^{-1}(W)$ works at every $x$: the image of $x+V$ (orange, right) is exactly $\Lambda x+\Lambda V\subset\Lambda x+W$. Switch to the non-linear map $f(v)=\Lambda v+(v_1^2,0)$: a $V$ that works at $0$ fails at points far from $0$.`,
      deps: ['fa-1.6', 'fa-1.7'],
      see: ['rca-5.3'],
      tags: ['linear maps', 'continuity'],
      viz(v) {
        const map = v.select('map', [{ value: 'lin', label: 'linear $\\Lambda$' }, { value: 'non', label: 'non-linear $f$' }], 'lin');
        const eps = v.slider('$W$: radius $\\varepsilon$', 0.15, 0.9, 0.55, { step: 0.01 });
        const L = v.stage({ x: [-2.5, 0.9], y: [-1.0, 1.5], equal: true, height: 330, ticks: false, title: '$X$: $x+V$ and $y$' });
        const R = v.stage({ x: [-2.4, 2.4], y: [-1.9, 1.9], equal: true, height: 330, ticks: false, title: '$Y$: image of $x+V$ and $\\Lambda x+W$' });
        const hx = L.handle(-1.9, 0.6, { color: 'accent', label: 'x' });
        const hy = L.handle(-1.72, 0.52, { color: 'gold', label: 'y' });
        const c1 = R.handle(1.2, -0.35, { color: 'gray', label: 'Λe₁', r: 6 });
        const c2 = R.handle(0.35, 0.95, { color: 'gray', label: 'Λe₂', r: 6 });
        let st = {};
        v.render(() => {
          const A = [[c1.x, c2.x], [c1.y, c2.y]], e = eps.value, non = map.value === 'non';
          const Lam = (p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
          const F = (p) => { const q = Lam(p); return non ? [q[0] + p[0] * p[0], q[1]] : q; };
          // V: linear preimage of W (scaled to e/2 and cut to |v1| ≤ sqrt(e/2) in the non-linear case)
          const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
          const n = 180, V = [];
          for (let i = 0; i < n; i++) {
            const t = TAU * i / n, u = [Math.cos(t), Math.sin(t)], lu = Math.hypot(...Lam(u));
            let rr = (non ? e / 2 : e) / Math.max(lu, 1e-6);
            if (non && Math.abs(u[0]) > 1e-9) rr = Math.min(rr, Math.sqrt(e / 2) / Math.abs(u[0]));
            rr = Math.min(rr, 9); V.push([rr * u[0], rr * u[1]]);
          }
          L.poly(V, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1.2, dash: [4, 3] });
          L.tex('V', 0.08, -0.08, { color: 'orange', align: 'left', baseline: 'top', size: 13 });
          L.poly(V.map(([a, b]) => [hx.x + a, hx.y + b]), { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 2 });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          const yIn = inPoly(hy.x - hx.x, hy.y - hx.y, V);
          // right
          const fx = F([hx.x, hx.y]), fy = F([hy.x, hy.y]);
          R.circle(0, 0, e, { color: 'green', width: 1.1, dash: [4, 3] });
          R.tex('W', e * 0.7, -e * 0.7, { color: 'green', size: 13, dx: 8, dy: 6 });
          R.poly(V.map((p) => F(p)), { color: 'orange', width: 1, dash: [4, 3] });
          R.circle(fx[0], fx[1], e, { fill: 'green', fillAlpha: 0.12, color: 'green', width: 1.8 });
          const img = V.map(([a, b]) => F([hx.x + a, hx.y + b]));
          let worst = 0; for (const p of img) worst = Math.max(worst, Math.hypot(p[0] - fx[0], p[1] - fx[1]));
          R.poly(img, { fill: 'orange', fillAlpha: 0.22, color: worst > e + 1e-6 ? 'red' : 'orange', width: 2 });
          R.arrow(0, 0, c1.x, c1.y, { color: 'gray', width: 1.3, head: 7 });
          R.arrow(0, 0, c2.x, c2.y, { color: 'gray', width: 1.3, head: 7 });
          R.dot(fx[0], fx[1], { color: 'accent', r: 4.5, label: non ? 'f(x)' : 'Λx', labelPos: 'nw' });
          R.dot(fy[0], fy[1], { color: 'gold', r: 4.5 });
          const dy = Math.hypot(fy[0] - fx[0], fy[1] - fx[1]);
          st = { worst, e, yIn, dy, non, det };
        });
        v.legend([['orange', '$x+V$ and its image', { area: true }], ['green', '$\\Lambda x+W$', { area: true }], ['gold', '$y$ and its image', { dot: true }]]);
        v.readout(() => {
          const s = st; if (s.e == null) return '';
          const head = `$\\sup_{v\\in V}|${s.non ? 'f(x+v)-f(x)' : '\\Lambda(x+v)-\\Lambda x'}| = ${v.fix(s.worst, 3)}$ vs $\\varepsilon = ${v.fix(s.e, 2)}$`;
          return head + (s.worst <= s.e + 1e-6 ? ' — inside $W$' : ' — **escapes** $W$: $f$ is continuous at $0$ but not uniformly') + `. For $y$: $y-x${s.yIn ? '\\in ' : '\\notin '}V$ and $|${s.non ? 'f(y)-f(x)' : '\\Lambda y-\\Lambda x'}| = ${v.fix(s.dy, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.18
    {
      num: '1.18',
      kind: 'Theorem',
      name: 'Continuity of linear functionals',
      statement: String.raw`Let $\Lambda$ be a linear functional on a topological vector space $X$, with $\Lambda x\ne 0$ for some $x$. Each of the following four properties implies the other three:
(a) $\Lambda$ is continuous.
(b) The null space $N(\Lambda)$ is closed.
(c) $N(\Lambda)$ is not dense in $X$.
(d) $\Lambda$ is bounded on some neighbourhood of $0$.`,
      idea: String.raw`(a)⇒(b)⇒(c) are immediate since $N(\Lambda)=\Lambda^{-1}(\{0\})\ne X$. For (c)⇒(d), pick $x$ and a balanced $V$ (1.14) with $(x+V)\cap N(\Lambda)=\emptyset$; then $\Lambda V$ is a balanced subset of the scalars, so it is either bounded or everything — and in the latter case some $y\in V$ has $\Lambda y=-\Lambda x$, putting $x+y$ in $N(\Lambda)$. (d)⇒(a): if $\abs{\Lambda}<M$ on $V$, then $\abs{\Lambda}<\eps$ on $(\eps/M)V$.`,
      caption: String.raw`Left: on $\R^2$ every functional $\Lambda x=\langle a,x\rangle$ is continuous — drag $a$; the kernel is a closed line and $\abs{\Lambda}\le\abs a$ on the unit disc. Right: on $C^1[0,\pi]$ with the sup norm, $\Lambda f=f'(0)$ is not. For the fixed $g$, the functions $h_n=g-g'(0)\,\tfrac{\sin nt}{n}$ lie in $N(\Lambda)$ (flat at $0$) and converge uniformly to $g$: the kernel is dense, so (c) fails, and with it (a), (b), (d).`,
      deps: ['fa-1.14', 'fa-1.17'],
      tags: ['linear functionals', 'continuity'],
      viz(v) {
        const nS = v.slider('$n$', 1, 60, 8, { int: true });
        const L = v.stage({ x: [-2, 2], y: [-1.7, 1.7], equal: true, height: 330, ticks: false, title: 'continuous: $\\Lambda x=\\langle a,x\\rangle$ on $\\R^2$' });
        const R = v.stage({ x: [-0.08, Math.PI + 0.05], y: [-0.25, 1.55], height: 330, axes: 'box', title: 'discontinuous: $\\Lambda f=f\'(0)$ on $(C^1[0,\\pi],\\|\\cdot\\|_\\infty)$' });
        const ha = L.handle(0.9, 0.55, { color: 'green', label: 'a' });
        const g = (t) => 0.3 + 0.8 * t / Math.PI + 0.35 * Math.sin(2 * t);
        const g0 = 0.8 / Math.PI + 0.7;
        let st = {};
        v.render(() => {
          const a = [ha.x, ha.y], na = Math.hypot(...a) || 1e-9, u = [-a[1] / na, a[0] / na];
          for (let k = -4; k <= 4; k++) {
            if (!k) continue;
            const c = k * 0.5, p = [a[0] * c / (na * na), a[1] * c / (na * na)];
            L.line(p[0] - u[0] * 9, p[1] - u[1] * 9, p[0] + u[0] * 9, p[1] + u[1] * 9, { color: k > 0 ? 'green' : 'purple', width: 0.9, alpha: 0.4 });
          }
          L.circle(0, 0, 1, { fill: 'orange', fillAlpha: 0.12, color: 'orange', width: 1.4 });
          L.line(-u[0] * 9, -u[1] * 9, u[0] * 9, u[1] * 9, { color: 'ink', width: 2.4 });
          L.tex('N(\\Lambda)', u[0] * 1.35 - a[0] / na * 0.28, u[1] * 1.35 - a[1] / na * 0.28, { color: 'ink', size: 14 });
          L.arrow(0, 0, a[0], a[1], { color: 'green', width: 2 });
          L.tex('|\\Lambda|\\le|a|\\text{ on }V', -0.0, -1.0, { color: 'orange', baseline: 'top', dy: 6, size: 13 });
          // right panel
          const n = nS.value;
          const h = (t) => g(t) - g0 * Math.sin(n * t) / n;
          R.between((t) => g(t) + g0 / n, (t) => g(t) - g0 / n, 0, Math.PI, { fill: 'green', fillAlpha: 0.13, n: 300 });
          R.fn(g, { domain: [0, Math.PI], color: 'accent', width: 2.2 });
          R.fn(h, { domain: [0, Math.PI], color: 'green', width: 2, n: 1200 });
          const tl = 0.32;
          R.line(0, g(0), tl, g(0) + g0 * tl, { color: 'accent', width: 1.4, dash: [4, 3] });
          R.line(0, h(0), tl, h(0), { color: 'green', width: 1.6, dash: [4, 3] });
          R.dot(0, g(0), { color: 'ink', r: 3 });
          R.tex('g', 2.55, g(2.55), { color: 'accent', dy: -14 });
          R.tex('h_n', 1.35, g(1.35) - 0.2, { color: 'green' });
          R.tex("g'(0)=" + g0.toFixed(3) + ",\\ h_n'(0)=0", 0.12, 0.02, { color: 'ink', align: 'left', size: 12.5 });
          st = { n, dist: g0 / n, na };
        });
        v.legend([['accent', '$g$, $\\Lambda g=g\'(0)$'], ['green', '$h_n\\in N(\\Lambda)$ and the band $g\\pm |g\'(0)|/n$']]);
        v.readout(() => {
          const s = st; if (s.n == null) return '';
          return `Left: $N(\\Lambda)$ is closed and $|\\Lambda x|\\le ${v.fix(s.na, 2)}$ on the unit disc. Right: $\\Lambda h_n = 0$ and $\\|h_n-g\\|_\\infty = ${v.fix(s.dist, 4)}\\to 0$; equivalently $f_n=\\sin(nt)/n$ has $\\|f_n\\|_\\infty = 1/n$ but $\\Lambda f_n = 1$ — $\\Lambda$ is unbounded on every ball.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.20
    {
      num: '1.20',
      kind: 'Lemma',
      name: 'Linear maps out of ℂⁿ are continuous',
      statement: String.raw`If $X$ is a complex topological vector space, $e_1,\dots,e_n\in X$ are arbitrary, and $f:\C^n\to X$ is defined by $f(z)=z_1e_1+\cdots+z_ne_n$, then $f$ is continuous.`,
      idea: String.raw`Each map $z\mapsto z_ke_k$ is continuous because scalar multiplication is continuous and $z\mapsto z_k$ is; $f$ is their sum, and addition is continuous. In a normed space one even gets the explicit bound $\norm{f(z)-f(w)}\le\sum\abs{z_k-w_k}\norm{e_k}\le\abs{z-w}\big(\sum\norm{e_k}^2\big)^{1/2}$.`,
      caption: String.raw`Take $X=C[0,1]$ with the sup norm and two fixed functions $e_1,e_2$ (choose a pair); real coefficients are used for the picture. Drag $z$ in the coefficient plane and shrink the disc of radius $\delta$ around it: every $f(w)$ with $\abs{w-z}\le\delta$ (faint curves on the right) stays in the orange band $f(z)\pm\delta(\norm{e_1}^2+\norm{e_2}^2)^{1/2}$.`,
      deps: ['fa-1.6'],
      verify: true,
      tags: ['finite dimension', 'continuity'],
      viz(v) {
        const PAIRS = {
          poly: { label: '$1,\\ t$', e: [() => 1, (t) => t] },
          trig: { label: '$\\sin\\pi t,\\ \\cos 3\\pi t$', e: [(t) => Math.sin(Math.PI * t), (t) => Math.cos(3 * Math.PI * t)] },
          mono: { label: '$t^2,\\ t^5$', e: [(t) => t * t, (t) => t ** 5] },
        };
        const which = v.select('$e_1,e_2$', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'trig');
        const del = v.slider('$\\delta$', 0.02, 0.6, 0.25, { step: 0.01 });
        const L = v.stage({ x: [-1.8, 1.8], y: [-1.5, 1.5], equal: true, height: 320, title: 'coefficients $z\\in\\R^2$' });
        const R = v.stage({ x: [0, 1], y: [-2.6, 2.6], height: 320, axes: 'box', title: '$f(w)=w_1e_1+w_2e_2$ in $C[0,1]$' });
        const hz = L.handle(0.8, 0.55, { color: 'accent', label: 'z' });
        let st = {};
        v.render(() => {
          const [e1, e2] = PAIRS[which.value].e, d = del.value;
          const n1 = supNorm(e1), n2 = supNorm(e2), B = d * Math.hypot(n1, n2);
          const fz = (t) => hz.x * e1(t) + hz.y * e2(t);
          L.circle(hz.x, hz.y, d, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.6 });
          L.tex('\\delta', hz.x + d, hz.y, { color: 'orange', align: 'left', dx: 4 });
          R.between((t) => fz(t) + B, (t) => fz(t) - B, 0, 1, { fill: 'orange', fillAlpha: 0.15, n: 240 });
          let worst = 0;
          for (let k = 0; k < 24; k++) {
            const th = TAU * k / 24, w = [hz.x + d * Math.cos(th), hz.y + d * Math.sin(th)];
            const fw = (t) => w[0] * e1(t) + w[1] * e2(t);
            R.fn(fw, { color: 'gold', width: 1, alpha: 0.55, n: 200 });
            for (let i = 0; i <= 200; i++) { const t = i / 200; worst = Math.max(worst, Math.abs(fw(t) - fz(t))); }
            L.dot(w[0], w[1], { color: 'gold', r: 2 });
          }
          R.fn(fz, { color: 'accent', width: 2.6 });
          R.tex('f(z)', 0.97, fz(0.97), { color: 'accent', align: 'right', dy: -22 });
          st = { worst, B, n1, n2 };
        });
        v.legend([['accent', '$f(z)$'], ['gold', '$f(w)$, $|w-z|=\\delta$'], ['orange', 'bound $\\delta\\sqrt{\\|e_1\\|^2+\\|e_2\\|^2}$', { area: true }]]);
        v.readout(() => {
          const s = st; if (s.B == null) return '';
          return `$\\max_{|w-z|=\\delta}\\|f(w)-f(z)\\|_\\infty = ${v.fix(s.worst, 3)} \\le ${v.fix(s.B, 3)}$ $(\\|e_1\\|_\\infty = ${v.fix(s.n1, 2)},\\ \\|e_2\\|_\\infty = ${v.fix(s.n2, 2)})$ — shrinking $\\delta$ squeezes the band to $f(z)$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.21
    {
      num: '1.21',
      kind: 'Theorem',
      name: 'Finite-dimensional subspaces are closed',
      statement: String.raw`Let $Y$ be an $n$-dimensional subspace of a complex topological vector space $X$, $n\ge 1$. Then
(a) every isomorphism of $\C^n$ onto $Y$ is a homeomorphism, and
(b) $Y$ is closed in $X$.`,
      idea: String.raw`Let $f:\C^n\to Y$ be an isomorphism; it is continuous by 1.20. The image $K=f(S)$ of the unit sphere is compact and misses $0$, so some balanced neighbourhood $V$ of $0$ misses $K$; balance forces $f^{-1}(V\cap Y)$ into the open unit ball. Hence the coordinate functionals of $f^{-1}$ are bounded on a neighbourhood and continuous (1.18). For (b), a point of $\overline Y$ lies in some $tV$, hence in the closure of $f(t\overline B)$, which is compact and therefore closed.`,
      caption: String.raw`$X=C[0,1]$ with the sup norm, $Y=\operatorname{span}\{e_1,e_2\}$, real coefficients. The blue curve plots $\norm{f(u)}_\infty$ in each direction $u$ of the unit circle; its minimum $c>0$ (green) gives $\abs z\le\norm{f(z)}/c$, i.e. $f^{-1}$ is continuous. A nearly dependent basis makes $c$ tiny but still positive. In the third option $Y$ is the infinite-dimensional space of all polynomials: the Bernstein polynomials of $\abs{t-\tfrac12}$ converge uniformly, yet their coefficients explode and the limit is not a polynomial — $Y$ is not closed.`,
      deps: ['fa-1.20', 'fa-1.18', 'fa-1.14', 'fa-1.12', 'fa-1.15'],
      see: ['pma-2.41'],
      tags: ['finite dimension', 'closed subspaces'],
      viz(v) {
        const M = v.M;
        const BASES = {
          good: { label: '$e_1=1,\\ e_2=t$', e: [() => 1, (t) => t] },
          bad: { label: '$e_1=t,\\ e_2=t+0.08t^2$', e: [(t) => t, (t) => t + 0.08 * t * t] },
          poly: { label: 'all polynomials' },
        };
        const which = v.select('$Y$', Object.entries(BASES).map(([value, o]) => ({ value, label: o.label })), 'good');
        const nS = v.slider('$n$ (polynomials)', 2, 40, 24, { int: true });
        const L = v.stage({ x: [-2.2, 2.2], y: [-1.6, 1.6], equal: true, height: 330, ticks: false, title: 'coefficient plane' });
        const R = v.stage({ x: [0, 1], y: [-1.6, 1.6], height: 330, axes: 'box', title: 'functions in $C[0,1]$' });
        const hz = L.handle(1.0, 0.45, { color: 'accent', label: 'z' });
        const tgt = (t) => Math.abs(t - 0.5);
        let last = null, st = {};
        v.render(() => {
          const k = which.value;
          if (k !== last) {
            last = k;
            if (k === 'poly') { L.setTitle('$\\log_{10}$ of $|$coefficient of $t^m|$ in $B_n$'); R.setView([0, 1], [-0.1, 0.6]); R.setTitle('$B_n\\to|t-\\tfrac12|$ uniformly'); }
            else { L.setView([-2.2, 2.2], [-1.6, 1.6]); L.setTitle('coefficient plane: $\\|f(u)\\|_\\infty$ for $|u|=1$'); R.setView([0, 1], [-1.6, 1.6]); R.setTitle('$f(z)=z_1e_1+z_2e_2$ in $C[0,1]$'); }
            hz.visible = k !== 'poly';
          }
          if (k === 'poly') {
            const n = nS.value;
            const fk = Array.from({ length: n + 1 }, (_, j) => tgt(j / n));
            const coef = [];
            for (let m = 0; m <= n; m++) { let s = 0; for (let j = 0; j <= m; j++) s += fk[j] * M.binom(n, j) * M.binom(n - j, m - j) * ((m - j) % 2 ? -1 : 1); coef.push(s); }
            const logs = coef.map((c) => Math.log10(Math.abs(c) + 1e-300));
            const top = Math.max(3, Math.ceil(Math.max(...logs)) + 1);
            L.setView([-1.5, n + 1], [-2.6, top]);
            for (let j = 0; j <= top; j += top > 8 ? 2 : 1) { L.hline(j, { color: 'grid', width: 1 }); L.text('10' + String(j).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]).join(''), -1.3, j, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom', dy: -1 }); }
            L.bars(logs.map((x) => Math.max(-2, x)), { x0: 0, dx: 1, color: (x) => (x > 2 ? 'red' : 'accent'), base: -2 });
            L.hline(0, { color: 'faint', width: 1 });
            const B = (t) => { let s = 0; for (let j = 0; j <= n; j++) s += fk[j] * M.binom(n, j) * t ** j * (1 - t) ** (n - j); return s; };
            R.fn(tgt, { color: 'red', width: 2, dash: [5, 4] });
            R.fn(B, { color: 'accent', width: 2.4 });
            let err = 0; for (let i = 0; i <= 400; i++) err = Math.max(err, Math.abs(B(i / 400) - tgt(i / 400)));
            R.tex('|t-\\tfrac12|\\notin Y', 0.5, 0.32, { color: 'red', size: 14 });
            st = { k, n, err, maxlog: Math.max(...logs) };
          } else {
            const [e1, e2] = BASES[k].e;
            const nf = (u) => supNorm((t) => u[0] * e1(t) + u[1] * e2(t), 200);
            const pts = []; let c = Infinity, cu = null;
            for (let i = 0; i < 360; i++) { const th = TAU * i / 360, u = [Math.cos(th), Math.sin(th)], r = nf(u); pts.push([r * u[0], r * u[1]]); if (r < c) { c = r; cu = u; } }
            L.circle(0, 0, 1, { color: 'accent', width: 1.2, dash: [5, 4] });
            L.poly(pts, { color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.06 });
            L.circle(0, 0, c, { color: 'green', width: 1.4, dash: [3, 3] });
            L.dot(c * cu[0], c * cu[1], { color: 'green', r: 5, label: 'c', labelPos: 'e' });
            L.dot(-c * cu[0], -c * cu[1], { color: 'green', r: 4 });
            L.tex('S', 0.71, -0.71, { color: 'accent', dx: 8, dy: 8, size: 14 });
            const fz = (t) => hz.x * e1(t) + hz.y * e2(t);
            for (let i = 0; i < 12; i++) { const th = TAU * i / 12; R.fn((t) => Math.cos(th) * e1(t) + Math.sin(th) * e2(t), { color: 'faint', width: 1, alpha: 0.7 }); }
            R.fn(fz, { color: 'accent', width: 2.6 });
            R.fn((t) => cu[0] * e1(t) + cu[1] * e2(t), { color: 'green', width: 2 });
            const nz = supNorm(fz), z = Math.hypot(hz.x, hz.y);
            st = { k, c, nz, z };
          }
        });
        v.readout(() => {
          const s = st; if (!s.k) return '';
          if (s.k === 'poly') return `$\\|B_n-|t-\\tfrac12|\\,\\|_\\infty = ${v.fix(s.err, 4)}$ while the largest monomial coefficient of $B_n$ is about $10^{${v.fix(s.maxlog, 1)}}$: the coordinates are not continuous on this infinite-dimensional $Y$, and $Y$ is not closed.`;
          return `$c=\\min_{|u|=1}\\|f(u)\\|_\\infty = ${v.fix(s.c, 4)}>0$ (green function). For $z$: $|z| = ${v.fix(s.z, 3)} \\le \\|f(z)\\|_\\infty/c = ${v.fix(s.nz / s.c, 3)}$, so $f^{-1}$ is continuous.`;
        });
      },
    },
  ],
};
