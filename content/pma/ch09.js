// Rudin, Principles of Mathematical Analysis — Chapter 9: Functions of Several Variables
// Part 1: linear algebra in R^n (9.1–9.5). Further parts: ch09-a2.js (operator norm,
// invertible operators, matrices, the derivative), ch09-a3.js (chain rule to the
// contraction principle). Items 9.24 onward are written in separate part files.

/** Draw the vector p→q as an arrow with a KaTeX label just beyond its tip. */
function vecArrow(S, p, q, color, label, o = {}) {
  S.arrow(p[0], p[1], q[0], q[1], { color, width: o.width ?? 2.6, head: o.head ?? 10, dash: o.dash, alpha: o.alpha });
  if (label) {
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx * S.scale, dy * S.scale) || 1;
    const off = o.off ?? 15;
    S.tex(label, q[0], q[1], { color, size: o.size ?? 15, dx: (dx * S.scale) / L * off + (o.dx || 0), dy: -(dy * S.scale) / L * off + (o.dy || 0) });
  }
}
/** Solve c0 p + c1 q = y for 2-vectors (det assumed nonzero). */
function solve2(p, q, y) {
  const d = p[0] * q[1] - p[1] * q[0];
  return [(y[0] * q[1] - y[1] * q[0]) / d, (p[0] * y[1] - p[1] * y[0]) / d];
}
const det2 = (p, q) => p[0] * q[1] - p[1] * q[0];
/** A number for TeX with d decimals and no "-0". */
function tn(x, d = 2) { const s = (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d); return s; }
/** Set an equal-aspect window centred at (cx, cy) with half-width hw on a non-equal stage. */
function fitEqual(S, cx, cy, hw) { const a = S.height / S.width; S.setView([cx - hw, cx + hw], [cy - hw * a, cy + hw * a]); }
/** Lines of the lattice {s b1 + t b2} visible in the stage window. */
function lattice(S, b1, b2, st1, st2) {
  const d = det2(b1, b2); if (Math.abs(d) < 1e-9) return;
  const { x, y } = S.bounds; const corners = [[x[0], y[0]], [x[1], y[0]], [x[0], y[1]], [x[1], y[1]]].map((c) => solve2(b1, b2, c));
  const lo0 = Math.floor(Math.min(...corners.map((c) => c[0]))), hi0 = Math.ceil(Math.max(...corners.map((c) => c[0])));
  const lo1 = Math.floor(Math.min(...corners.map((c) => c[1]))), hi1 = Math.ceil(Math.max(...corners.map((c) => c[1])));
  if (hi0 - lo0 < 60) for (let k = lo0; k <= hi0; k++) S.line(k * b1[0] + lo1 * b2[0], k * b1[1] + lo1 * b2[1], k * b1[0] + hi1 * b2[0], k * b1[1] + hi1 * b2[1], k === 0 ? { ...st1, alpha: Math.min(1, (st1.alpha ?? 0.3) * 2) } : st1);
  if (hi1 - lo1 < 60) for (let k = lo1; k <= hi1; k++) S.line(lo0 * b1[0] + k * b2[0], lo0 * b1[1] + k * b2[1], hi0 * b1[0] + k * b2[0], hi0 * b1[1] + k * b2[1], k === 0 ? { ...st2, alpha: Math.min(1, (st2.alpha ?? 0.3) * 2) } : st2);
}
/** 3×3 determinant of column vectors. */
const det3 = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - b[0] * (a[1] * c[2] - a[2] * c[1]) + c[0] * (a[1] * b[2] - a[2] * b[1]);

export default {
  collection: 'pma',
  chapter: 9,
  title: 'Functions of Several Variables',
  summary: String.raw`Calculus moves from the line to maps between Euclidean spaces. The chapter opens with the linear algebra of $\R^n$ — bases and dimension, linear transformations, and the operator norm that turns $L(\R^n,\R^m)$ into a metric space in which the invertible operators form an open set. The derivative $f'(x)$ is then the linear map that best approximates $f(x+h)-f(x)$; it is unique, obeys the chain rule, is represented by the matrix of partial derivatives, and controls increments on convex sets. The contraction principle powers the inverse and implicit function theorems and the rank theorem, after which determinants and Jacobians, higher derivatives with the symmetry of mixed partials, and differentiation under the integral sign complete the chapter.`,
  items: [
    // ------------------------------------------------------------------ 9.1
    {
      num: '9.1',
      kind: 'Definition',
      name: 'Vector spaces, span, independence, dimension, basis',
      statement: String.raw`(a) A nonempty set $X\subset\R^n$ is a *vector space* if $x+y\in X$ and $cx\in X$ for all $x,y\in X$ and all scalars $c$.
(b) A *linear combination* of $x_1,\dots,x_k$ is a vector $c_1x_1+\dots+c_kx_k$. The set of all linear combinations of members of $S\subset\R^n$ is the *span* of $S$; every span is a vector space.
(c) $\{x_1,\dots,x_k\}$ is *independent* if $c_1x_1+\dots+c_kx_k=0$ forces $c_1=\dots=c_k=0$, and *dependent* otherwise. An independent set never contains $0$.
(d) $X$ has *dimension* $r$, written $\dim X=r$, if it contains an independent set of $r$ vectors but none of $r+1$ vectors; $\dim\{0\}=0$.
(e) An independent subset of $X$ that spans $X$ is a *basis* of $X$. If $\{x_1,\dots,x_r\}$ is a basis, each $x\in X$ is $\sum c_jx_j$ for exactly one choice of the *coordinates* $c_1,\dots,c_r$. The vectors $e_1,\dots,e_n$ of $\R^n$ (with $1$ in the $j$-th place and $0$ elsewhere) form the *standard basis*.`,
      idea: String.raw`Uniqueness of coordinates is just independence in disguise: if $\sum c_jx_j=\sum d_jx_j$ then $\sum (c_j-d_j)x_j=0$, so every $c_j=d_j$. Spanning gives existence of coordinates; independence gives uniqueness. Dimension is defined by counting independent vectors, and Theorem 9.2 is what makes this count behave.`,
      caption: String.raw`Drag the basis vectors $x_1,x_2$ and the point $x$. The skewed grid is the coordinate system they define; the coloured path reads off $x=c_1x_1+c_2x_2$. Line $x_2$ up with $x_1$ (it snaps) and the set becomes dependent: its span collapses to a line and coordinates stop existing or stop being unique.`,
      deps: ['pma-1.36'],
      tags: ['linear algebra', 'basis'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-1.8, 5.2], y: [-1.15, 2.35], equal: true, height: 370 });
        const b1 = S.handle(1.3, 0.35, { color: 'blue' });
        const b2 = S.handle(0.45, 1.05, {
          color: 'orange',
          constrain: (x, y) => {
            const n = Math.hypot(b1.x, b1.y) || 1, u = [b1.x / n, b1.y / n];
            const along = x * u[0] + y * u[1], perp = -u[1] * x + u[0] * y;
            return Math.abs(perp) < 0.07 ? [along * u[0], along * u[1]] : [x, y];
          },
        });
        const X = S.handle(2.6, 1.25, { color: 'gold' });
        v.button('standard basis', () => { b1.set(1, 0); b2.set(0, 1); });
        v.legend([['blue', '$x_1$, $c_1x_1$ and the grid lines parallel to $x_1$'], ['orange', '$x_2$, $c_2x_2$ and the grid lines parallel to $x_2$'], ['gold', 'the point $x$']]);
        let st = {};
        v.render(() => {
          const B1 = [b1.x, b1.y], B2 = [b2.x, b2.y], x = [X.x, X.y];
          const n1 = Math.hypot(...B1), n2 = Math.hypot(...B2);
          const dep = n1 < 0.06 || n2 < 0.06 || Math.abs(det2(B1, B2)) / (n1 * n2) < 1e-6;
          if (!dep) {
            lattice(S, B1, B2, { color: 'orange', width: 1, alpha: 0.28 }, { color: 'blue', width: 1, alpha: 0.28 });
            const c = solve2(B1, B2, x);
            const p = M.vscale(B1, c[0]);
            S.path([[0, 0], M.vscale(B2, c[1]), x], { color: 'muted', width: 1.2, dash: [4, 4] });
            S.line(0, 0, p[0], p[1], { color: 'blue', width: 8, alpha: 0.22 });
            S.line(p[0], p[1], x[0], x[1], { color: 'orange', width: 8, alpha: 0.22 });
            S.dot(p[0], p[1], { color: 'blue', r: 3.5 });
            S.tex(`c_1x_1`, p[0] * 0.8, p[1] * 0.8, { color: 'blue', size: 14, dx: 8, dy: 16 });
            S.tex(`c_2x_2`, (p[0] + x[0]) / 2, (p[1] + x[1]) / 2, { color: 'orange', size: 14, dx: 26 });
            st = { dep: false, c, d: det2(B1, B2) };
          } else {
            const u = n1 >= n2 ? B1 : B2, n = Math.max(n1, n2);
            if (n > 0.06) S.line(-u[0] / n * 20, -u[1] / n * 20, u[0] / n * 20, u[1] / n * 20, { color: 'red', width: 2.2, alpha: 0.7 });
            const dist = n > 0.06 ? Math.abs(-u[1] / n * x[0] + u[0] / n * x[1]) : Math.hypot(...x);
            const lam = n1 > 0.06 ? M.dot(B2, B1) / (n1 * n1) : null;
            S.corner('dependent — the span is only a line', 'tl', { color: 'red', weight: 600 });
            st = { dep: true, inSpan: dist < 0.04, lam };
          }
          vecArrow(S, [0, 0], B1, 'blue', null, { width: 3, head: 0 });
          S.tex('x_1', B1[0], B1[1], { color: 'blue', dx: 4, dy: 20 });
          vecArrow(S, [0, 0], B2, 'orange', 'x_2', { width: 3, head: 0, off: 20 });
          S.tex('x', x[0], x[1], { color: 'gold', dx: 13, dy: -13, size: 16 });
          S.dot(0, 0, { color: 'ink', r: 3.5 });
        });
        v.readout(() => {
          if (!st.dep) return `$\\{x_1,x_2\\}$ is independent ($\\det[x_1\\ x_2] = ${v.fix(st.d, 3)}\\ne0$), hence a basis of $\\R^2$: $\\;x = ${v.fix(st.c[0], 3)}\\,x_1 ${st.c[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(st.c[1]), 3)}\\,x_2$, and no other coordinates work.`;
          const rel = st.lam != null ? `$${v.fix(st.lam, 3)}\\,x_1 - x_2 = 0$ is a nontrivial relation, so the set is dependent. ` : 'A set containing $0$ is dependent. ';
          return rel + (st.inSpan ? 'Here $x$ lies on the span, but its coordinates are no longer unique.' : 'Here $x$ is not in the span at all: $\\{x_1,x_2\\}$ does not span $\\R^2$.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.2
    {
      num: '9.2',
      kind: 'Theorem',
      name: 'A space spanned by r vectors has dimension at most r',
      statement: String.raw`Let $r$ be a positive integer. If a vector space $X$ is spanned by some set of $r$ vectors, then $\dim X\le r$.`,
      idea: String.raw`Suppose instead that $X$ contains independent vectors $y_1,\dots,y_{r+1}$, and let $S_0=\{x_1,\dots,x_r\}$ span $X$. Feed in $y_1,y_2,\dots$ one at a time: $y_{i+1}$ is a combination of the current spanning set $S_i$, and since the $y$'s are independent some remaining $x_k$ must carry a nonzero coefficient, so that $x_k$ can be traded for $y_{i+1}$ without changing the span. After $r$ trades $S_r=\{y_1,\dots,y_r\}$ spans $X$, so $y_{r+1}$ is a combination of $y_1,\dots,y_r$ — contradicting independence.`,
      caption: String.raw`Here $X=\R^2$ is spanned by the blue $x_1,x_2$ ($r=2$); drag the orange $y_1,y_2,y_3$. The slider runs the exchange: at step $i$ the vector $y_i$ is written in the current spanning set (dashed path), and an $x$ with nonzero coefficient (red) is swapped out. At step 3 the green path is an explicit dependence among $y_1,y_2,y_3$: three vectors in $X$ can never be independent.`,
      deps: ['pma-9.1'],
      tags: ['linear algebra', 'dimension'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.2, 3.2], y: [-2.25, 2.25], equal: true, height: 380 });
        const X0 = [[1.5, 0.25], [0.35, 1.2]];
        const Y = [[0.95, 0.95], [-1.3, 0.7], [1.6, -1.25]].map(([x, y]) => S.handle(x, y, { color: 'orange', r: 6.5 }));
        const step = v.slider('insert $y_i$, $i=$', 1, 3, 2, { int: true });
        v.legend([['blue', 'the spanning set $S_0=\\{x_1,x_2\\}$'], ['orange', '$y_1,y_2,y_3\\in X$'], ['red', 'removed from $S_{i-1}$', { dash: true }], ['green', 'the forced dependence', { dash: true }]]);
        let st = {};
        // run the exchange on the current y's; returns the history
        function exchange(ys) {
          let set = [{ n: 'x_1', v: X0[0], k: 'x' }, { n: 'x_2', v: X0[1], k: 'x' }];
          const hist = [];
          for (let i = 0; i < 3; i++) {
            const y = ys[i];
            if (Math.hypot(...y) < 0.05) { hist.push({ i, set, zero: true }); return { hist, fail: i }; }
            const c = solve2(set[0].v, set[1].v, y);
            if (i === 2) { hist.push({ i, set, c, final: true }); return { hist, fail: null }; }
            const cand = [0, 1].filter((k) => set[k].k === 'x' && Math.abs(c[k]) > 1e-3);
            if (!cand.length) { hist.push({ i, set, c, early: true }); return { hist, fail: i }; }
            const k = cand.reduce((a, b) => (Math.abs(c[b]) > Math.abs(c[a]) ? b : a));
            hist.push({ i, set, c, removed: k });
            set = set.map((e, j) => (j === k ? { n: `y_${i + 1}`, v: y, k: 'y' } : e));
          }
          return { hist, fail: null };
        }
        v.render(() => {
          const ys = Y.map((h) => [h.x, h.y]);
          const { hist, fail } = exchange(ys);
          const want = step.value - 1;
          const H = hist[Math.min(want, hist.length - 1)];
          const col = (e) => (e.k === 'x' ? 'blue' : 'orange');
          // faint: all vectors
          const used = new Set([...H.set.map((e) => e.n), `y_${H.i + 1}`]);
          X0.forEach((x, j) => vecArrow(S, [0, 0], x, 'blue', used.has(`x_${j + 1}`) ? null : `x_${j + 1}`, { width: 1.6, alpha: 0.3 }));
          ys.forEach((y, j) => vecArrow(S, [0, 0], y, 'orange', used.has(`y_${j + 1}`) ? null : `y_${j + 1}`, { width: 1.6, alpha: 0.35, head: 0, off: 20 }));
          // current spanning set S_i (thick)
          H.set.forEach((e, j) => {
            const removed = H.removed === j;
            vecArrow(S, [0, 0], e.v, removed ? 'red' : col(e), e.n, { width: 3.2, dash: removed ? [7, 5] : undefined, head: e.k === 'y' ? 0 : 10, off: 20 });
          });
          // the incoming vector y_{i+1} and its expansion in S_i
          const y = ys[H.i];
          if (H.c) {
            const p = M.vscale(H.set[0].v, H.c[0]);
            const good = H.final || H.early ? 'green' : null;
            S.arrow(0, 0, p[0], p[1], { color: good || col(H.set[0]), width: 2, dash: [5, 4], head: 8 });
            S.arrow(p[0], p[1], y[0], y[1], { color: good || col(H.set[1]), width: 2, dash: [5, 4], head: 8 });
          }
          vecArrow(S, [0, 0], y, 'orange', `y_${H.i + 1}`, { width: 3.2, head: 0, off: 20 });
          S.dot(0, 0, { color: 'ink', r: 3.5 });
          if (want > H.i) S.corner(`stopped early at step ${H.i + 1}`, 'tl', { color: 'green', weight: 600 });
          else S.corner(`step ${H.i + 1}:  S${'₀₁₂'[H.i]} = {${H.set.map((e) => e.n.replace('_1', '₁').replace('_2', '₂')).join(', ')}}`, 'tl', { color: 'muted', weight: 600 });
          st = { H, fail, ys };
        });
        v.readout(() => {
          const { H } = st; if (!H) return '';
          const n = (e) => e.n;
          if (H.zero) return `$y_${H.i + 1}=0$, and a set containing $0$ is dependent — nothing to exchange.`;
          const [a, b] = H.c, [p, q] = H.set;
          const expr = `y_${H.i + 1} = ${v.fix(a, 2)}\\,${n(p)} ${b < 0 ? '-' : '+'} ${v.fix(Math.abs(b), 2)}\\,${n(q)}`;
          if (H.final) {
            const c1 = p.n === 'y_1' ? a : b, c2 = p.n === 'y_1' ? b : a;
            return `$S_2=\\{y_1,y_2\\}$ spans $X$, so $${expr}$. Hence $${v.fix(c1, 2)}\\,y_1 ${c2 < 0 ? '-' : '+'} ${v.fix(Math.abs(c2), 2)}\\,y_2 - y_3 = 0$: the $y$'s are dependent, and $\\dim X\\le 2$.`;
          }
          if (H.early) return `$${expr}$: the coefficient of the remaining $x$ vanishes, so $y_${H.i + 1}$ is a multiple of $y_1$ — the $y$'s are already dependent.`;
          const k = H.removed;
          return `$${expr}$. The coefficient of $${n(H.set[k])}$ is nonzero, so $${n(H.set[k])}$ is a combination of $y_${H.i + 1}$ and $${n(H.set[1 - k])}$; swapping it out leaves a set $S_${H.i + 1}$ that still spans $X$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.2a
    {
      num: '9.2a',
      kind: 'Corollary',
      name: 'The dimension of R^n is n',
      statement: String.raw`$\dim\R^n=n$.`,
      idea: String.raw`The standard basis $e_1,\dots,e_n$ spans $\R^n$, so Theorem 9.2 gives $\dim\R^n\le n$; it is independent, so $\dim\R^n\ge n$. Concretely: any $n+1$ vectors in $\R^n$ satisfy a nontrivial linear relation, while $n-1$ vectors never span.`,
      caption: String.raw`In $\R^3$ (drag to rotate). The $n+1$ view takes four vectors (dashed) and draws the relation $c_1y_1+c_2y_2+c_3y_3+c_4y_4=0$ as a closed chain of arrows $c_jy_j$, each parallel to its $y_j$, that returns to the origin — such a relation always exists. The $n-1$ view shows that two vectors span only a plane, missing the red normal vector. *Resample* draws new vectors.`,
      deps: ['pma-9.2', 'pma-9.1'],
      tags: ['linear algebra', 'dimension'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'basis', label: '$n$ vectors: $e_1,e_2,e_3$' }, { value: 'more', label: '$n+1$ vectors' }, { value: 'less', label: '$n-1$ vectors' }], 'more');
        const S = v.stage3d({ range: 1.3, height: 410, yaw: -0.75, pitch: 0.36, axes: false });
        let seed = 4;
        const gen = (s) => { const r = v.rng(s); return Array.from({ length: 4 }, () => [r.uniform(-1.1, 1.1), r.uniform(-1.1, 1.1), r.uniform(-0.6, 1.2)]); };
        let Y = gen(seed);
        v.button('Resample', () => { seed += 1; Y = gen(seed); });
        const COL = ['blue', 'orange', 'purple', 'teal'];
        let st = {};
        v.render(() => {
          const m = mode.value;
          // light coordinate frame
          for (const e of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) S.line(e.map((x) => -1.5 * x), e.map((x) => 1.5 * x), { color: 'faint', width: 1 });
          if (m === 'basis') {
            const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            const cube = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
            for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) S.line(cube[a], cube[b], { color: 'grid', width: 1 });
            E.forEach((e, i) => { S.arrow([0, 0, 0], e, { color: COL[i], width: 3 }); S.tex(`e_${i + 1}`, e.map((x) => x * 1.16), { color: COL[i] }); });
            const x = [0.7, 1.25, 0.85];
            S.path([[0, 0, 0], [x[0], 0, 0], [x[0], x[1], 0], x], { color: 'muted', width: 1.6, dash: [4, 4] });
            S.arrow([0, 0, 0], x, { color: 'gold', width: 2.6 });
            S.tex('x = x_1e_1+x_2e_2+x_3e_3', x.map((t) => t * 1.12), { color: 'gold', size: 14 });
            st = { m };
          } else if (m === 'more') {
            // null vector of the 3×4 matrix with columns Y: cofactor expansion
            const c = [0, 1, 2, 3].map((j) => { const o = Y.filter((_, k) => k !== j); return (j % 2 ? -1 : 1) * det3(o[0], o[1], o[2]); });
            const cm = Math.max(...c.map(Math.abs)); const cn = c.map((x) => x / cm);
            let P = [0, 0, 0]; const chain = [P];
            for (let j = 0; j < 4; j++) { P = M.vadd(P, M.vscale(Y[j], cn[j])); chain.push(P); }
            const ext = Math.max(...chain.map((p) => Math.max(...p.map(Math.abs))), 1e-9);
            const sc = Math.min(1, 1.35 / ext);
            Y.forEach((y, j) => { S.arrow([0, 0, 0], y, { color: COL[j], width: 1.6, alpha: 0.45, dash: [5, 4] }); S.tex(`y_${j + 1}`, y.map((t) => t * 1.12), { color: COL[j] }); });
            for (let j = 0; j < 4; j++) {
              const P0 = M.vscale(chain[j], sc), P1 = M.vscale(chain[j + 1], sc);
              S.arrow(P0, P1, { color: COL[j], width: 4, head: 12 });
              S.tex(`c_${j + 1}y_${j + 1}`, M.vscale(M.vadd(P0, P1), 0.5), { color: COL[j], size: 13, dx: 0, dy: -12 });
            }
            S.dot([0, 0, 0], { color: 'green', r: 6 });
            st = { m, c: cn };
          } else {
            const [a, b] = Y; const n = M.normalize(M.cross3(a, b));
            const L = 1.45; const u = M.normalize(a), w = M.normalize(M.cross3(n, u));
            const corner = (s, t) => M.vadd(M.vscale(u, s * L), M.vscale(w, t * L));
            S.poly([corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)], { fill: 'blue', fillAlpha: 0.12, color: 'blue', alpha: 0.4 });
            for (let k = -2; k <= 2; k++) { S.line(corner(-1, k / 2), corner(1, k / 2), { color: 'blue', width: 0.8, alpha: 0.25 }); S.line(corner(k / 2, -1), corner(k / 2, 1), { color: 'blue', width: 0.8, alpha: 0.25 }); }
            [a, b].forEach((y, j) => { S.arrow([0, 0, 0], y, { color: COL[j], width: 3 }); S.tex(`y_${j + 1}`, y.map((t) => t * 1.15), { color: COL[j] }); });
            S.arrow([0, 0, 0], M.vscale(n, 1.2), { color: 'red', width: 2.6 });
            S.tex('z\\notin\\operatorname{span}\\{y_1,y_2\\}', M.vscale(n, 1.42), { color: 'red', size: 14 });
            st = { m };
          }
          S.dot([0, 0, 0], { color: 'ink', r: 3 });
        });
        v.readout(() => {
          if (st.m === 'basis') return '$e_1,e_2,e_3$ are independent, so $\\dim\\R^3\\ge 3$; they span $\\R^3$, so Theorem 9.2 gives $\\dim\\R^3\\le3$.';
          if (st.m === 'more') return `A nontrivial relation: $${st.c.map((c, j) => `${j && c >= 0 ? '+' : ''}${v.fix(c, 3)}\\,y_${j + 1}`).join('')} = 0$. Four vectors in $\\R^3$ are always dependent, because $\\R^3$ is spanned by three.`;
          return 'Two vectors span at most a plane: the normal vector is not a combination of them, so fewer than $n$ vectors never span $\\R^n$.';
        });
      },
    },
    // ------------------------------------------------------------------ 9.3
    {
      num: '9.3',
      kind: 'Theorem',
      name: 'Bases in a space of dimension n',
      statement: String.raw`Let $X$ be a vector space with $\dim X=n$.
(a) A set $E$ of $n$ vectors in $X$ spans $X$ if and only if $E$ is independent.
(b) $X$ has a basis, and every basis of $X$ has exactly $n$ vectors.
(c) If $1\le r\le n$ and $\{y_1,\dots,y_r\}$ is an independent set in $X$, then $X$ has a basis containing $\{y_1,\dots,y_r\}$.`,
      idea: String.raw`(a) If $E$ is independent and $x\in X$, the $n+1$ vectors $E\cup\{x\}$ are dependent because $\dim X=n$; the coefficient of $x$ in a relation cannot vanish, so $x$ is in the span. If $E$ spans but is dependent, drop a vector that is a combination of the others; then $X$ is spanned by $n-1$ vectors and 9.2 gives $\dim X\le n-1$. (b) follows from (a) and 9.2. (c) Add a basis $\{x_1,\dots,x_n\}$ to the $y$'s; the enlarged set is dependent, and the exchange argument of 9.2 removes $x$'s that are combinations of the rest until $n$ vectors remain.`,
      caption: String.raw`(a) In $X=\R^3$: tilt $y_3$ out of the plane of $y_1,y_2$. The green box spanned by the three vectors has volume $|\det[y_1\,y_2\,y_3]|$; at tilt $0$ the set becomes dependent *and* stops spanning at the same moment.
(c) Start from the orange independent vectors and scan $e_1,e_2,e_3$, keeping each one not already in the span (green) and skipping the rest (grey): the result is always a basis with exactly $3$ vectors.`,
      deps: ['pma-9.2', 'pma-9.1'],
      tags: ['linear algebra', 'basis'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'a', label: '(a) span $\\Leftrightarrow$ independent' }, { value: 'c', label: '(c) extend to a basis' }], 'a');
        const tilt = v.slider('tilt of $y_3$ (part a)', -1, 1, 0.55, { step: 0.01 });
        const given = v.select('given (part c)', [{ value: 1, label: '$\\{y_1\\}$' }, { value: 2, label: '$\\{y_1,y_2\\}$' }, { value: 3, label: '$\\{y_1,y_2\\}$ in the $e_1e_3$-plane' }], 2);
        const S = v.stage3d({ range: 1.45, height: 420, yaw: -0.85, pitch: 0.34, axes: false });
        const y1 = [1.15, 0.15, 0.25], y2 = [0.25, 1.05, 0.15];
        const nrm = M.normalize(M.cross3(y1, y2));
        let st = {};
        const plane = (a, b, L, col, alpha) => {
          const u = M.normalize(a), w = M.normalize(M.cross3(M.cross3(a, b), a));
          const P = (s, t) => M.vadd(M.vscale(u, s * L), M.vscale(w, t * L));
          S.poly([P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)], { fill: col, fillAlpha: alpha, color: col, alpha: 0.35 });
        };
        v.render(() => {
          for (const e of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) S.line(e.map((x) => -1.4 * x), e.map((x) => 1.4 * x), { color: 'faint', width: 1 });
          if (mode.value === 'a') {
            const t = tilt.value;
            const p0 = M.vadd(M.vscale(y1, -0.45), M.vscale(y2, 0.75));
            const y3 = M.vadd(p0, M.vscale(nrm, 1.1 * t));
            const d = det3(y1, y2, y3), dep = Math.abs(d) < 1e-3;
            plane(y1, y2, 1.45, 'blue', 0.08);
            if (!dep) {
              const V = [[0, 0, 0], y1, M.vadd(y1, y2), y2].map((p) => [p, M.vadd(p, y3)]);
              const bot = V.map((p) => p[0]), top = V.map((p) => p[1]);
              S.poly(bot, { fill: 'green', fillAlpha: 0.1, color: 'green', alpha: 0.5 });
              S.poly(top, { fill: 'green', fillAlpha: 0.1, color: 'green', alpha: 0.5 });
              for (let k = 0; k < 4; k++) S.poly([bot[k], bot[(k + 1) % 4], top[(k + 1) % 4], top[k]], { fill: 'green', fillAlpha: 0.1, color: 'green', alpha: 0.5 });
            }
            [[y1, 'blue', 'y_1'], [y2, 'orange', 'y_2'], [y3, dep ? 'red' : 'purple', 'y_3']].forEach(([y, c, n]) => { S.arrow([0, 0, 0], y, { color: c, width: 3 }); S.tex(n, M.vscale(y, 1.16), { color: c }); });
            S.line(p0, y3, { color: 'muted', width: 1.2, dash: [3, 3] });
            st = { m: 'a', d, dep };
          } else {
            const g = given.value;
            const Ys = g === 1 ? [y1] : g === 2 ? [y1, y2] : [[1.1, 0, 0.35], [-0.3, 0, 1.0]];
            const basis = Ys.map((y) => ({ v: y, given: true })); const log = [];
            const E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
            const inSpan = (B, e) => {
              if (B.length === 1) return Math.hypot(...M.cross3(B[0].v, e)) < 1e-9;
              if (B.length === 2) return Math.abs(det3(B[0].v, B[1].v, e)) < 1e-9;
              return true;
            };
            E.forEach((e, j) => { if (basis.length < 3 && !inSpan(basis, e)) { basis.push({ v: e, j }); log.push([j, true]); } else log.push([j, false]); });
            if (Ys.length === 2) plane(Ys[0], Ys[1], 1.4, 'orange', 0.1);
            else S.line(M.vscale(M.normalize(Ys[0]), -1.6), M.vscale(M.normalize(Ys[0]), 1.6), { color: 'orange', width: 1.4, alpha: 0.5 });
            Ys.forEach((y, k) => { S.arrow([0, 0, 0], y, { color: 'orange', width: 3.2 }); S.tex(`y_${k + 1}`, M.vscale(y, 1.17), { color: 'orange' }); });
            log.forEach(([j, kept]) => { const e = E[j]; S.arrow([0, 0, 0], e, { color: kept ? 'green' : 'gray', width: kept ? 3 : 1.8, alpha: kept ? 1 : 0.7 }); S.tex(`e_${j + 1}`, M.vscale(e, 1.17), { color: kept ? 'green' : 'gray' }); });
            st = { m: 'c', log, r: Ys.length, nb: basis.length };
          }
          S.dot([0, 0, 0], { color: 'ink', r: 3 });
        });
        v.readout(() => {
          if (st.m === 'a') return st.dep ? '$\\det[y_1\\,y_2\\,y_3]=0$: the three vectors are dependent, and they span only the blue plane — both halves of (a) fail together.' : `$\\det[y_1\\,y_2\\,y_3] = ${v.fix(st.d, 3)}\\ne 0$: the set is independent and spans $\\R^3$ — both at once, as (a) predicts.`;
          const kept = st.log.filter((l) => l[1]).map((l) => `e_${l[0] + 1}`), skip = st.log.filter((l) => !l[1]).map((l) => `e_${l[0] + 1}`);
          return `Start with $r=${st.r}$ independent vectors; keep $${kept.join(',\\,')}$${skip.length ? `, skip $${skip.join(',\\,')}$ (already in the span or no longer needed)` : ''}. The result is a basis with $${st.nb}=\\dim\\R^3$ vectors, as (b) requires.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.4
    {
      num: '9.4',
      kind: 'Definition',
      name: 'Linear transformations; invertible operators',
      statement: String.raw`A map $A$ of a vector space $X$ into a vector space $Y$ is a *linear transformation* if
$$A(x_1+x_2)=Ax_1+Ax_2,\qquad A(cx)=cAx$$
for all $x,x_1,x_2\in X$ and all scalars $c$ (one writes $Ax$ for $A(x)$). Linear transformations of $X$ into $X$ are *linear operators* on $X$. A linear operator on $X$ that is one-to-one and maps $X$ onto $X$ is *invertible*; its inverse $A^{-1}$, defined by $A^{-1}(Ax)=x$, is again linear.

Always $A0=0$, and a linear transformation is completely determined by its values on a basis: if $\{x_1,\dots,x_n\}$ is a basis of $X$ then $A\big(\sum c_ix_i\big)=\sum c_iAx_i$, and any choice of the vectors $Ax_i\in Y$ defines such an $A$.`,
      idea: String.raw`Linearity means that $A$ respects the two operations that build every vector out of a basis, so knowing $Ae_1,\dots,Ae_n$ fixes $A$ everywhere. Geometrically, a linear map sends lines to lines, the origin to itself, and parallelograms to parallelograms; any curvature in the image grid is a certificate of non-linearity.`,
      caption: String.raw`Drag $x$, $y$ in the domain and the images $Ae_1$, $Ae_2$ in the target; these two images determine the whole map. The green parallelogram $0,x,y,x+y$ goes to a parallelogram, and $A(cx)=cAx$. Switch on the bent map $f$: the grid curves and the red segments measure $f(x+y)-f(x)-f(y)$ and $f(cx)-cf(x)$.`,
      deps: ['pma-9.1'],
      tags: ['linear algebra', 'linear maps'],
      viz(v) {
        const M = v.M;
        const D = v.stage({ x: [-2.6, 2.6], y: [-2.1, 2.1], equal: true, height: 330, title: 'domain $X=\\R^2$' });
        const T = v.stage({ x: [-3, 3], y: [-2.4, 2.4], equal: true, height: 330, title: 'target $Y=\\R^2$' });
        const hx = D.handle(1.25, 0.45, { color: 'blue' });
        const hy = D.handle(-0.5, 1.0, { color: 'orange' });
        const a1 = T.handle(1.0, -0.3, { color: 'ink', r: 6 });
        const a2 = T.handle(0.5, 0.9, { color: 'ink', r: 6 });
        const c = v.slider('$c$', -1.6, 1.6, -0.9, { step: 0.01 });
        const bent = v.toggle('bent map $f$ (not linear)', false);
        v.legend([['blue', '$x$, $Ax$'], ['orange', '$y$, $Ay$'], ['green', '$x+y$, $A(x+y)$'], ['purple', '$cx$, $A(cx)$'], ['red', 'defect of linearity']]);
        let st = {};
        v.render(() => {
          const A = [[a1.x, a2.x], [a1.y, a2.y]];
          const lin = (p) => M.matVec(A, p);
          const F = bent.value ? (p) => M.vadd(lin(p), [0.2 * p[0] * p[1], 0.14 * p[0] * p[0] - 0.08 * p[1] * p[1]]) : lin;
          // grids
          for (let k = -10; k <= 10; k++) {
            D.line(k * 0.5, -6, k * 0.5, 6, { color: 'grid', width: 1 }); D.line(-6, k * 0.5, 6, k * 0.5, { color: 'grid', width: 1 });
            if (Math.abs(k) > 6) continue;
            T.curve((s) => F([k * 0.5, s]), -3, 3, { color: 'muted', width: 1, alpha: k ? 0.4 : 0.8, n: 80 });
            T.curve((s) => F([s, k * 0.5]), -3, 3, { color: 'muted', width: 1, alpha: k ? 0.4 : 0.8, n: 80 });
          }
          const x = [hx.x, hx.y], y = [hy.x, hy.y], s = M.vadd(x, y), cx = M.vscale(x, c.value);
          // domain
          D.poly([[0, 0], x, s, y], { fill: 'green', fillAlpha: 0.1, stroke: false });
          vecArrow(D, [0, 0], cx, 'purple', 'cx', { width: 2, dash: [5, 4] });
          vecArrow(D, [0, 0], s, 'green', 'x+y', { width: 2.4 });
          vecArrow(D, [0, 0], x, 'blue', 'x', { width: 2.8, head: 0, off: 19 });
          vecArrow(D, [0, 0], y, 'orange', 'y', { width: 2.8, head: 0, off: 19 });
          vecArrow(D, [0, 0], [1, 0], 'ink', 'e_1', { width: 1.6, alpha: 0.6 });
          vecArrow(D, [0, 0], [0, 1], 'ink', 'e_2', { width: 1.6, alpha: 0.6 });
          // target
          const Fx = F(x), Fy = F(y), Fs = F(s), Fc = F(cx), sum = M.vadd(Fx, Fy), cF = M.vscale(Fx, c.value);
          T.poly([[0, 0], Fx, sum, Fy], { fill: 'green', fillAlpha: 0.1, stroke: false });
          T.path([Fx, sum, Fy], { color: 'green', width: 1.2, dash: [3, 4] });
          vecArrow(T, [0, 0], Fc, 'purple', bent.value ? 'f(cx)' : 'A(cx)', { width: 2, dash: [5, 4] });
          vecArrow(T, [0, 0], Fs, 'green', bent.value ? 'f(x+y)' : 'A(x+y)', { width: 2.4 });
          vecArrow(T, [0, 0], Fx, 'blue', bent.value ? 'f(x)' : 'Ax', { width: 2.8 });
          vecArrow(T, [0, 0], Fy, 'orange', bent.value ? 'f(y)' : 'Ay', { width: 2.8 });
          T.tex(bent.value ? 'f(e_1)' : 'Ae_1', a1.x, a1.y, { color: 'ink', size: 13, dx: 8, dy: 17, align: 'left' });
          T.tex(bent.value ? 'f(e_2)' : 'Ae_2', a2.x, a2.y, { color: 'ink', size: 13, dx: 10, dy: 0, align: 'left' });
          const g1 = M.dist(Fs, sum), g2 = M.dist(Fc, cF);
          if (bent.value) {
            T.line(Fs[0], Fs[1], sum[0], sum[1], { color: 'red', width: 3 }); T.dot(sum[0], sum[1], { color: 'red', r: 3.5 });
            T.line(Fc[0], Fc[1], cF[0], cF[1], { color: 'red', width: 3 }); T.dot(cF[0], cF[1], { color: 'red', r: 3.5 });
          }
          T.dot(0, 0, { color: 'ink', r: 3.5 }); D.dot(0, 0, { color: 'ink', r: 3.5 });
          st = { g1, g2, bent: bent.value, A };
        });
        v.readout(() => st.bent
          ? `$|f(x+y)-f(x)-f(y)| = ${v.fix(st.g1, 3)}$, $\\;|f(cx)-c\\,f(x)| = ${v.fix(st.g2, 3)}$: $f$ fixes $0$ but is not linear, and its values at $e_1,e_2$ no longer determine it.`
          : `$|A(x+y)-Ax-Ay| = ${v.fix(st.g1, 3)}$, $\\;|A(cx)-cAx| = ${v.fix(st.g2, 3)}$. The matrix with columns $Ae_1, Ae_2$ is $\\begin{pmatrix}${tn(st.A[0][0])}&${tn(st.A[0][1])}\\\\${tn(st.A[1][0])}&${tn(st.A[1][1])}\\end{pmatrix}$.`);
      },
    },
    // ------------------------------------------------------------------ 9.5
    {
      num: '9.5',
      kind: 'Theorem',
      name: 'For operators on finite-dimensional spaces, 1-1 ⇔ onto',
      statement: String.raw`A linear operator $A$ on a finite-dimensional vector space $X$ is one-to-one if and only if its range $\mathscr R(A)$ is all of $X$.`,
      idea: String.raw`Take a basis $\{x_1,\dots,x_n\}$ of $X$. By linearity the range is the span of $Q=\{Ax_1,\dots,Ax_n\}$, so by 9.3(a) $A$ is onto exactly when $Q$ is independent. And $Q$ is independent exactly when $A\big(\sum c_ix_i\big)=0$ forces all $c_i=0$, i.e. when the null space of $A$ is $\{0\}$, which is the same as $A$ being one-to-one.`,
      caption: String.raw`On $\R^2$: drag the columns $Ae_1$, $Ae_2$. While they are independent the image of the unit square has positive area, the range is everything and only $0$ maps to $0$. Line them up (they snap) and *both* properties fail at once: a red kernel line appears in the domain and the range collapses to a red line. The shift views drop finite dimensionality: on sequences the right shift is one-to-one but not onto, the left shift onto but not one-to-one.`,
      deps: ['pma-9.3', 'pma-9.4'],
      tags: ['linear algebra', 'linear maps'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'R2', label: 'operator on $\\R^2$' }, { value: 'R', label: 'right shift on sequences' }, { value: 'L', label: 'left shift on sequences' }], 'R2');
        const D = v.stage({ x: [-2.5, 2.5], y: [-2, 2], height: 320, title: 'domain' });
        const T = v.stage({ x: [-2.5, 2.5], y: [-2, 2], height: 320, title: 'range' });
        const a1 = T.handle(1.2, 0.35, { color: 'blue' });
        const a2 = T.handle(0.55, 1.1, {
          color: 'orange',
          constrain: (x, y) => { const n = Math.hypot(a1.x, a1.y) || 1, u = [a1.x / n, a1.y / n]; const al = x * u[0] + y * u[1], pe = -u[1] * x + u[0] * y; return Math.abs(pe) < 0.08 ? [al * u[0], al * u[1]] : [x, y]; },
        });
        const seq = [0.9, -0.5, 0.7, 0.35, -0.8, 0.55, -0.3, 0.6, 0.2];
        let st = {};
        v.render(() => {
          const m = mode.value;
          a1.visible = a2.visible = m === 'R2';
          if (m === 'R2') {
            D.setTitle('domain: unit square and kernel'); T.setTitle('target: image and range');
            fitEqual(D, 0, 0, 2.5); fitEqual(T, 0, 0, 2.5);
            const A = [[a1.x, a2.x], [a1.y, a2.y]], d = A[0][0] * A[1][1] - A[0][1] * A[1][0];
            const sing = Math.abs(d) < 1e-6;
            for (let k = -6; k <= 6; k++) { D.line(k * 0.5, -9, k * 0.5, 9, { color: 'grid', width: 1 }); D.line(-9, k * 0.5, 9, k * 0.5, { color: 'grid', width: 1 }); }
            D.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { fill: 'accent', fillAlpha: 0.15, color: 'accent', width: 1.4 });
            const c1 = [a1.x, a1.y], c2 = [a2.x, a2.y];
            if (!sing) {
              T.rect(-20, -20, 20, 20, { fill: 'green', fillAlpha: 0.07, stroke: false });
              lattice(T, c1, c2, { color: 'muted', width: 1, alpha: 0.25 }, { color: 'muted', width: 1, alpha: 0.25 });
              D.dot(0, 0, { color: 'green', r: 5 });
              D.corner('ker A = {0}: one-to-one', 'tl', { color: 'green', weight: 600 });
              T.corner('range = ℝ²: onto', 'tl', { color: 'green', weight: 600 });
            } else {
              // kernel: A k = 0 with k ⟂ rows
              let k = Math.hypot(A[0][0], A[0][1]) > 1e-9 ? [-A[0][1], A[0][0]] : [-A[1][1], A[1][0]];
              if (Math.hypot(...k) < 1e-9) k = [1, 0];
              const kn = M.normalize(k);
              D.line(-9 * kn[0], -9 * kn[1], 9 * kn[0], 9 * kn[1], { color: 'red', width: 2.6 });
              D.tex('\\ker A', 1.6 * kn[0], 1.6 * kn[1], { color: 'red', dx: 14, dy: 10 });
              const r = Math.hypot(...c1) > 1e-6 ? M.normalize(c1) : M.normalize(c2);
              T.line(-9 * r[0], -9 * r[1], 9 * r[0], 9 * r[1], { color: 'red', width: 2.6 });
              T.corner('range is only a line', 'tl', { color: 'red', weight: 600 });
              D.corner('not one-to-one', 'tl', { color: 'red', weight: 600 });
            }
            T.poly([[0, 0], c1, M.vadd(c1, c2), c2], { fill: 'accent', fillAlpha: 0.18, color: 'accent', width: 1.4 });
            vecArrow(D, [0, 0], [1, 0], 'blue', 'e_1', { width: 2.6 });
            vecArrow(D, [0, 0], [0, 1], 'orange', 'e_2', { width: 2.6 });
            vecArrow(T, [0, 0], c1, 'blue', null, { width: 2.6, head: 0 });
            vecArrow(T, [0, 0], c2, 'orange', null, { width: 2.6, head: 0 });
            T.tex('Ae_1', c1[0], c1[1], { color: 'blue', dx: 20, dy: 12 });
            T.tex('Ae_2', c2[0], c2[1], { color: 'orange', dx: 20, dy: -12 });
            st = { m, d, sing };
          } else {
            const R = m === 'R';
            D.setTitle(R ? 'a sequence $x=(x_1,x_2,\\dots)$' : 'the sequence $e_1=(1,0,0,\\dots)$ and another $x$');
            T.setTitle(R ? '$Sx=(0,x_1,x_2,\\dots)$: first slot is always $0$' : '$Lx=(x_2,x_3,\\dots)$ and $Le_1=0$');
            D.setView([0.3, 9.7], [-1.25, 1.35]); T.setView([0.3, 9.7], [-1.25, 1.35]);
            const x = seq;
            if (R) {
              D.bars(x, { x0: 1, dx: 1, color: 'blue', barWidth: 0.6 });
              const Sx = [0, ...x.slice(0, 8)];
              T.bars(Sx, { x0: 1, dx: 1, color: (val, i) => (i === 0 ? 'red' : 'blue'), barWidth: 0.6 });
              T.rect(0.55, -1.1, 1.45, 1.1, { color: 'red', width: 1.6, dash: [4, 3] });
              T.text('e₁ ∉ range', 1.6, 1.12, { color: 'red', weight: 600, size: 12 });
              D.corner('injective: Sx = Sy forces x = y', 'bl', { color: 'green', weight: 600 });
              T.corner('not onto', 'br', { color: 'red', weight: 600 });
            } else {
              D.bars([1, 0, 0, 0, 0, 0, 0, 0, 0], { x0: 1, dx: 1, color: 'red', barWidth: 0.35 });
              D.bars(x, { x0: 1.3, dx: 1, color: 'blue', barWidth: 0.35, fillAlpha: 0.55 });
              T.bars(x.slice(1), { x0: 1, dx: 1, color: 'blue', barWidth: 0.6 });
              T.text('Le₁ = 0', 1.0, 1.12, { color: 'red', weight: 600, size: 12 });
              T.corner('onto: every y is L(0, y₁, y₂, …)', 'bl', { color: 'green', weight: 600 });
              D.corner('not one-to-one', 'br', { color: 'red', weight: 600 });
            }
            st = { m };
          }
        });
        v.readout(() => {
          if (st.m === 'R2') return st.sing ? '$\\det A = 0$: $Ae_1, Ae_2$ are dependent, so $A$ kills a whole line and its range is a line. One-to-one and onto fail together.' : `$\\det A = ${v.fix(st.d, 3)} \\ne 0$: $\\{Ae_1, Ae_2\\}$ is independent, so it spans $\\R^2$ (onto) and $Ax=0$ only for $x=0$ (one-to-one).`;
          return st.m === 'R' ? 'On the infinite-dimensional space of sequences, the right shift $S$ is one-to-one but misses $e_1$: the dimension count of 9.3(a) is no longer available.' : 'The left shift $L$ maps onto the sequences, yet $Le_1=0$: onto without one-to-one. Finite dimensionality is essential in 9.5.';
        });
      },
    },
  ],
};
