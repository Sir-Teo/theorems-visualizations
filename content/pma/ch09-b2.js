// Rudin, Principles of Mathematical Analysis — Chapter 9 (part b2): 9.32–9.38
// The rank theorem, determinants (definition, column rules, product rule, invertibility)
// and the Jacobian. The chapter title lives in ch09.js.

// ---------------------------------------------------------------- shared helpers
const mv2 = (A, p) => [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]];
const det2 = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
const mul2 = (A, B) => [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]];
const inv2 = (A) => { const d = det2(A); return Math.abs(d) < 1e-13 ? null : [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]; };
const det3 = (c1, c2, c3) => c1[0] * (c2[1] * c3[2] - c2[2] * c3[1]) - c2[0] * (c1[1] * c3[2] - c1[2] * c3[1]) + c3[0] * (c1[1] * c2[2] - c1[2] * c2[1]);
const fmtM = (v, A, d = 2) => `\\begin{pmatrix}${A.map((r) => r.map((x) => v.fix(x, d)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
/** Signed area of a closed polygon. */
const sarea = (P) => { let a = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) a += P[j][0] * P[i][1] - P[i][0] * P[j][1]; return a / 2; };
/** A few arrowheads along a closed polyline, to show its orientation. */
function orient(S, P, st = {}) {
  const n = P.length, len = 16 / S.scale;
  for (const f of st.at || [0.08, 0.41, 0.74]) {
    const i = Math.floor(f * n), a = P[i], b = P[(i + 3) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const u = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
    S.arrow(a[0] - u[0] * len / 2, a[1] - u[1] * len / 2, a[0] + u[0] * len / 2, a[1] + u[1] * len / 2, { color: st.color || 'ink', head: 11, width: 2.2 });
  }
}
/** TeX for a quantity that should be zero up to rounding. */
const tiny = (v, x) => (Math.abs(x) < 1e-12 ? '<10^{-12}' : '=' + sci(v, x));
/** A number in TeX, using ×10^k for very small or very large magnitudes. */
function sci(v, x, d = 2) {
  if (x === 0 || (Math.abs(x) >= 1e-3 && Math.abs(x) < 1e5)) return v.fmt(x, 3);
  const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e;
  return `${v.fix(m, d - 1)}\\times10^{${e}}`;
}
/** Snap a handle onto the line spanned by another vector when they are almost parallel. */
const snapParallel = (other, tol = 0.035) => (x, y) => {
  const o = other(); const n = Math.hypot(o[0], o[1]), r = Math.hypot(x, y);
  if (n < 1e-9 || r < 1e-9) return [x, y];
  if (Math.abs((o[0] * y - o[1] * x) / (n * r)) < tol) { const t = (x * o[0] + y * o[1]) / (n * n); return [t * o[0], t * o[1]]; }
  return [x, y];
};

export default {
  book: 'pma',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.32 rank theorem
    {
      num: '9.32',
      kind: 'Theorem',
      name: 'Rank theorem',
      statement: String.raw`Let $m,n,r$ be nonnegative integers with $m\ge r$, $n\ge r$, let $\mathbf F$ be a $\mathscr C'$-mapping of an open set $E\subset\R^n$ into $\R^m$, and suppose $\mathbf F'(\mathbf x)$ has rank $r$ for **every** $\mathbf x\in E$. Fix $\mathbf a\in E$, put $A=\mathbf F'(\mathbf a)$, let $Y_1=\mathscr R(A)$, let $P$ be a projection in $\R^m$ with $\mathscr R(P)=Y_1$, and let $Y_2=\mathscr N(P)$. Then there are open sets $U,V\subset\R^n$ with $\mathbf a\in U\subset E$, and a one-to-one $\mathscr C'$-mapping $\mathbf H$ of $V$ onto $U$ whose inverse is also $\mathscr C'$, such that
$$\mathbf F(\mathbf H(\mathbf x))=A\mathbf x+\varphi(A\mathbf x)\qquad(\mathbf x\in V),$$
where $\varphi$ is a $\mathscr C'$-mapping of the open set $A(V)\subset Y_1$ into $Y_2$.`,
      idea: String.raw`Choose a linear $S:Y_1\to\R^n$ with $AS\mathbf y=\mathbf y$ and set $\mathbf G(\mathbf x)=\mathbf x+SP[\mathbf F(\mathbf x)-A\mathbf x]$. Since $\mathbf G'(\mathbf a)=I$, the inverse function theorem (9.24) makes $\mathbf G$ a $\mathscr C'$ bijection of a neighbourhood $U$ of $\mathbf a$ onto an open $V$; let $\mathbf H=\mathbf G^{-1}$. A one-line computation gives $A\mathbf G(\mathbf x)=P\mathbf F(\mathbf x)$, i.e. $P\mathbf F(\mathbf H(\mathbf x))=A\mathbf x$, so $\mathbf F\circ\mathbf H=A+\psi$ with $\psi=(I-P)\mathbf F\circ\mathbf H$ valued in $Y_2$. Only now is the *constant* rank used: $(\mathbf F\circ\mathbf H)'(\mathbf x)$ has rank $r$ and $P$ already maps its range onto $Y_1$, so $P$ is one-to-one there; for $\mathbf h\in\mathscr N(A)$ this forces $\psi'(\mathbf x)\mathbf h=\mathbf 0$. Hence $\psi$ is constant on each coset of $\mathscr N(A)$ (after shrinking $V$), which says $\psi(\mathbf x)=\varphi(A\mathbf x)$.`,
      caption: String.raw`Here $n=m=2$, $r=1$, with $\mathbf F(x,y)=\gamma(x+0.4y^2)$ and $\gamma$ a circle, so $\mathbf F'$ has rank $1$ everywhere and each gold level curve of $x+0.4y^2$ is a fibre, crushed to one point. Slide $s$ to deform $U$ by $\mathbf x\mapsto(1-s)\mathbf x+s\,\mathbf G(\mathbf x)$: at $s=1$ the fibres are straight lines parallel to $\mathscr N(A)$, i.e. in the new coordinates $\mathbf F$ sees only $A\mathbf x$. Right: $\mathbf F(U)$ is the graph of $\varphi$ over $Y_1$ (blue), with values in $Y_2$ (purple). Switch to the fold $(x,y^2)$, whose rank jumps from $1$ to $2$ off the axis: nothing straightens and $\mathbf F(U)$ is a region, not a curve.`,
      deps: ['pma-9.24', 'pma-9.30', 'pma-9.31', 'pma-9.15', 'pma-9.19'],
      tags: ['rank theorem', 'several variables'],
      viz(v) {
        const M = v.M;
        const R0 = 1.55, om = 0.95, ph = 0.6;
        const MAPS = {
          rank1: {
            label: 'rank $1$: $\\gamma(x+0.4y^2)$', a: [-0.2, 0.5], r: 0.75,
            t: (x, y) => x + 0.4 * y * y,
            F: (x, y) => { const t = x + 0.4 * y * y; return [R0 * Math.cos(om * t + ph), R0 * Math.sin(om * t + ph)]; },
            J: (x, y) => { const t = x + 0.4 * y * y, g = [-R0 * om * Math.sin(om * t + ph), R0 * om * Math.cos(om * t + ph)]; return [[g[0], 0.8 * y * g[0]], [g[1], 0.8 * y * g[1]]]; },
          },
          fold: {
            label: 'rank jumps: $(x,y^2)$', a: [0.2, 0], r: 0.75,
            F: (x, y) => [x, y * y], J: (x, y) => [[1, 0], [0, 2 * y]],
          },
        };
        const which = v.select('$\\mathbf F$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'rank1');
        const sS = v.slider('straighten: $s$', 0, 1, 0.5, { step: 0.01 });
        const rS = v.slider('radius of $U$', 0.2, 1.1, 0.75, { step: 0.01 });
        const L = v.stage({ x: [-1.9, 1.5], y: [-0.9, 1.9], equal: true, height: 350, title: '$U$ deformed by $(1-s)\\,\\mathbf x+s\\,\\mathbf G(\\mathbf x)$' });
        const R = v.stage({ x: [-2.3, 2.3], y: [-2.1, 2.1], equal: true, height: 350, title: '$\\mathbf F(U)$, $Y_1=\\mathscr R(A)$ and $Y_2=\\mathscr N(P)$' });
        const ha = L.handle(-0.2, 0.5, { color: 'accent', label: 'a', labelPos: 'nw' });
        let last = null, st = null;
        v.render(() => {
          const Mp = MAPS[which.value];
          if (last !== which.value) { last = which.value; ha.x = Mp.a[0]; ha.y = Mp.a[1]; rS.value = Mp.r; }
          sS.el.hidden = !Mp.t;
          const a = [ha.x, ha.y], r = rS.value, s = Mp.t ? sS.value : 0;
          const A = Mp.J(a[0], a[1]);
          // Y1 = range of the rank-one matrix A; e its unit vector; z with A z = e (minimal norm)
          const cols = [[A[0][0], A[1][0]], [A[0][1], A[1][1]]];
          const ci = Math.hypot(...cols[0]) >= Math.hypot(...cols[1]) ? 0 : 1;
          const e = M.normalize(cols[ci]), ATe = [A[0][0] * e[0] + A[1][0] * e[1], A[0][1] * e[0] + A[1][1] * e[1]];
          const nz = ATe[0] ** 2 + ATe[1] ** 2, z = [ATe[0] / nz, ATe[1] / nz];
          const e2 = [-e[1], e[0]];
          const G = (x, y) => { const Fx = Mp.F(x, y), Ax = mv2(A, [x, y]), c = (Fx[0] - Ax[0]) * e[0] + (Fx[1] - Ax[1]) * e[1]; return [x + c * z[0], y + c * z[1]]; };
          const Phi = (p) => { const g = G(p[0], p[1]); return [(1 - s) * p[0] + s * g[0], (1 - s) * p[1] + s * g[1]]; };
          const inU = (p) => Math.hypot(p[0] - a[0], p[1] - a[1]) < r;
          // keep the deformed picture in view
          const ga = Phi(a); L.setView([ga[0] - 1.7, ga[0] + 1.7], [ga[1] - 1.4, ga[1] + 1.4]);
          // U and its boundary
          const bd = []; for (let k = 0; k <= 160; k++) { const th = (2 * Math.PI * k) / 160; bd.push(Phi([a[0] + r * Math.cos(th), a[1] + r * Math.sin(th)])); }
          L.path(bd, { color: 'orange', width: 1.8, fill: 'orange', fillAlpha: 0.08, close: true });
          // faint transversal grid lines (y = const) inside U
          for (let k = -4; k <= 4; k++) { const yy = a[1] + (r * k) / 5, w = Math.sqrt(r * r - (yy - a[1]) ** 2); const pts = []; for (let i = 0; i <= 40; i++) pts.push(Phi([a[0] - w + (2 * w * i) / 40, yy])); L.path(pts, { color: 'faint', width: 0.9 }); }
          let maxDet = 0, maxStr = 0, rank2 = false;
          if (Mp.t) {
            // fibres: level curves of t, i.e. x = c − 0.4 y², clipped to U
            const t0 = Mp.t(a[0], a[1]);
            for (let k = -7; k <= 7; k++) {
              const c = t0 + (k * r) / 4.5, pts = [];
              for (let i = 0; i <= 120; i++) { const yy = a[1] - r + (2 * r * i) / 120, p = [c - 0.4 * yy * yy, yy]; pts.push(inU(p) ? Phi(p) : null); }
              L.path(pts, { color: k === 0 ? 'gold' : 'gold', width: k === 0 ? 3 : 1.6, alpha: k === 0 ? 1 : 0.8 });
            }
            // checks on a sample of U: rank 1 and A G(x) = P F(x)
            for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) {
              const p = [a[0] + (r * i) / 6, a[1] + (r * j) / 6]; if (!inU(p)) continue;
              maxDet = Math.max(maxDet, Math.abs(det2(Mp.J(p[0], p[1]))));
              const AG = mv2(A, G(p[0], p[1])), Fp = Mp.F(p[0], p[1]), PF = (Fp[0] * e[0] + Fp[1] * e[1]);
              maxStr = Math.max(maxStr, Math.hypot(AG[0] - PF * e[0], AG[1] - PF * e[1]));
            }
          } else {
            // the fold: fibres are pairs {(x, y), (x, −y)}
            for (let i = -3; i <= 3; i++) for (const yy of [0.25, 0.5]) {
              const p = [a[0] + (r * i) / 4, a[1] + yy * r], q = [p[0], -p[1]];
              if (inU(p) && inU(q)) { L.line(p[0], p[1], q[0], q[1], { color: 'gold', width: 1.2, dash: [3, 3] }); L.dot(p[0], p[1], { color: 'gold', r: 3 }); L.dot(q[0], q[1], { color: 'gold', r: 3 }); }
            }
            for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) { const p = [a[0] + (r * i) / 6, a[1] + (r * j) / 6]; if (inU(p) && Math.abs(det2(Mp.J(p[0], p[1]))) > 1e-9) rank2 = true; }
            L.hline(0, { color: 'red', width: 1.6 });
            L.text('rank 1 only here', L.bounds.x[1], 0, { color: 'red', align: 'right', dx: -6, dy: -10, size: 11.5 });
          }
          // the direction of N(A) through the image of a
          { const ker = Math.hypot(A[0][0], A[0][1]) > Math.hypot(A[1][0], A[1][1]) ? M.normalize([-A[0][1], A[0][0]]) : M.normalize([-A[1][1], A[1][0]]); const g0 = Phi(a), Lk = 2.2;
            L.line(g0[0] - Lk * ker[0], g0[1] - Lk * ker[1], g0[0] + Lk * ker[0], g0[1] + Lk * ker[1], { color: 'purple', width: 1.2, dash: [6, 4], alpha: 0.8 });
            L.text('𝒩(A)', g0[0] + 1.25 * ker[0], g0[1] + 1.25 * ker[1], { color: 'purple', dx: 8, size: 12 }); }
          // right panel: Y1, Y2 and F(U)
          const ext = 6;
          R.line(-ext * e[0], -ext * e[1], ext * e[0], ext * e[1], { color: 'blue', width: 1.6 });
          R.line(-ext * e2[0], -ext * e2[1], ext * e2[0], ext * e2[1], { color: 'purple', width: 1.4, dash: [6, 4] });
          R.tex('Y_1', 2.0 * e[0], 2.0 * e[1], { color: 'blue', size: 16, dx: 14 });
          { const Fa0 = Mp.F(a[0], a[1]), sg = Fa0[0] * e2[0] + Fa0[1] * e2[1] > 0 ? -1 : 1; R.tex('Y_2', 1.9 * sg * e2[0], 1.9 * sg * e2[1], { color: 'purple', size: 16, dy: 14 }); }
          if (Mp.t) {
            R.circle(0, 0, R0, { color: 'faint', width: 1, dash: [3, 4] });
            let tmin = Infinity, tmax = -Infinity;
            for (let k = 0; k < 400; k++) { const th = (2 * Math.PI * k) / 400; for (const rr of [r * 0.999, r * 0.5]) { const tt = Mp.t(a[0] + rr * Math.cos(th), a[1] + rr * Math.sin(th)); tmin = Math.min(tmin, tt); tmax = Math.max(tmax, tt); } }
            const arc = (t) => [R0 * Math.cos(om * t + ph), R0 * Math.sin(om * t + ph)];
            R.curve(arc, tmin, tmax, { color: 'green', width: 4.5 });
            for (let k = 0; k <= 8; k++) {
              const w = arc(tmin + ((tmax - tmin) * k) / 8), pw = w[0] * e[0] + w[1] * e[1];
              R.line(pw * e[0], pw * e[1], w[0], w[1], { color: 'purple', width: 1, alpha: 0.6 });
              R.dot(pw * e[0], pw * e[1], { color: 'blue', r: 2.5 });
            }
          } else {
            // F(U) = {(u, v) : 0 ≤ v < r² − (u − a₁)² − …}: the image of the disc, filled honestly via its grid
            for (let k = -12; k <= 12; k++) { const yy = a[1] + (r * k) / 13, w = Math.sqrt(Math.max(0, r * r - (yy - a[1]) ** 2)); const pts = []; for (let i = 0; i <= 30; i++) pts.push(Mp.F(a[0] - w + (2 * w * i) / 30, yy)); R.path(pts, { color: 'green', width: 1, alpha: 0.6 }); }
            const top = []; for (let i = 0; i <= 120; i++) { const u = a[0] - r + (2 * r * i) / 120, hgt = Math.max(0, r * r - (u - a[0]) ** 2); top.push([u, Math.max(Mp.F(u, a[1] + Math.sqrt(hgt))[1], Mp.F(u, a[1] - Math.sqrt(hgt))[1])]); }
            R.path(top.concat([[a[0] + r, Math.min(0, top[top.length - 1][1])], [a[0] - r, 0]]), { color: 'green', width: 1.8, fill: 'green', fillAlpha: 0.18, close: true });
            R.corner('F(U) has interior: not a graph over Y₁', 'br', { color: 'red', weight: 600 });
          }
          const Fa = Mp.F(a[0], a[1]);
          R.dot(Fa[0], Fa[1], { color: 'accent', r: 5, label: 'F(a)', labelPos: 'ne' });
          st = { A, maxDet, maxStr, rank2, t: !!Mp.t };
          v.legend([['gold', 'fibres of $\\mathbf F$ in $U$'], ['purple', '$\\mathscr N(A)$ / $Y_2$', { dash: true }], ['blue', '$Y_1=\\mathscr R(A)$'], ['green', '$\\mathbf F(U)$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$A=\\mathbf F'(\\mathbf a)=${fmtM(v, s.A)}$, rank $1$. ` + (s.t
            ? `On $U$: $\\max|\\det\\mathbf F'|${tiny(v, s.maxDet)}$ (the rank stays $1$) and $\\max|A\\mathbf G(\\mathbf x)-P\\mathbf F(\\mathbf x)|${tiny(v, s.maxStr)}$, so $P\\mathbf F(\\mathbf H(\\mathbf x))=A\\mathbf x$.`
            : 'Off the axis $\\det\\mathbf F\'=2y\\ne0$: the rank is not constant on any neighbourhood of $\\mathbf a$, and the conclusion fails.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.33 determinant
    {
      num: '9.33',
      kind: 'Definition',
      name: 'Determinant',
      statement: String.raw`For an ordered $n$-tuple of integers put $s(j_1,\dots,j_n)=\prod_{p<q}\sgn(j_q-j_p)$; it is $+1$ or $-1$ when the $j$'s are a permutation of $1,\dots,n$ (according to the parity of the permutation) and $0$ when two of them coincide. If $[A]$ is the matrix of an operator $A$ on $\R^n$ with entries $a(i,j)$, the **determinant** of $[A]$ is
$$\det[A]=\sum s(j_1,\dots,j_n)\,a(1,j_1)\,a(2,j_2)\cdots a(n,j_n),$$
the sum running over all ordered $n$-tuples with $1\le j_r\le n$. Writing the columns of $[A]$ as $\mathbf x_1,\dots,\mathbf x_n$ we also write $\det[A]=\det(\mathbf x_1,\dots,\mathbf x_n)$.`,
      idea: String.raw`Of the $n^n$ terms, only the $n!$ coming from permutations survive; the others are killed by $s=0$. The determinant is a polynomial in the entries, hence continuous. Its meaning appears in 9.34–9.36 and in chapter 10: $|\det[A]|$ is the factor by which $A$ multiplies volumes, and its sign records whether $A$ preserves orientation.`,
      caption: String.raw`Drag the columns $\mathbf x_1=(a(1,1),a(2,1))$ and $\mathbf x_2=(a(1,2),a(2,2))$. Right: all $n^n=4$ index pairs $(j_1,j_2)$ with their terms $s(j_1,j_2)\,a(1,j_1)\,a(2,j_2)$; the two with a repeated index vanish, and the sum (green) is $\det[A]$. It equals the signed area of the parallelogram $A([0,1]^2)$ on the left — blue when $\mathbf x_1\to\mathbf x_2$ turns counterclockwise, pink when the orientation is reversed.`,
      deps: ['pma-9.9'],
      see: ['rca-2.20'],
      tags: ['determinants', 'linear algebra'],
      viz(v) {
        const L = v.stage({ x: [-2.2, 2.6], y: [-1.3, 2.3], equal: true, height: 340, title: 'columns and the parallelogram $A([0,1]^2)$' });
        const R = v.stage({ x: [0.35, 5.65], y: [-2, 2], height: 340, axes: 'box', xticks: [[1, '(1,1)'], [2, '(1,2)'], [3, '(2,1)'], [4, '(2,2)'], [5, 'sum']], title: 'terms $s(j_1,j_2)\\,a(1,j_1)\\,a(2,j_2)$' });
        const h1 = L.handle(1.5, 0.35, { color: 'blue', label: 'x₁', labelPos: 'se' });
        const h2 = L.handle(0.55, 1.3, { color: 'teal', label: 'x₂', labelPos: 'nw' });
        let st = null;
        v.render(() => {
          const a11 = h1.x, a21 = h1.y, a12 = h2.x, a22 = h2.y;
          const terms = [0, a11 * a22, -a12 * a21, 0], D = a11 * a22 - a12 * a21;
          const pos = D >= 0, col = Math.abs(D) < 1e-9 ? 'red' : pos ? 'accent' : 'pink';
          L.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { color: 'muted', width: 1, dash: [4, 4], fill: 'gray', fillAlpha: 0.06 });
          const P = [[0, 0], [a11, a21], [a11 + a12, a21 + a22], [a12, a22]];
          L.poly(P, { color: col, width: 2, fill: col, fillAlpha: 0.18 });
          L.arrow(0, 0, a11, a21, { color: 'blue', width: 2.4 }); L.arrow(0, 0, a12, a22, { color: 'teal', width: 2.4 });
          // orientation arc from x1 to x2
          const t1 = Math.atan2(a21, a11); let dt = Math.atan2(a22, a12) - t1; if (dt > Math.PI) dt -= 2 * Math.PI; if (dt < -Math.PI) dt += 2 * Math.PI;
          const rr = 0.38; L.curve((u) => [rr * Math.cos(t1 + u * dt), rr * Math.sin(t1 + u * dt)], 0, 0.88, { color: col, width: 1.6, n: 40 });
          { const u1 = t1 + 0.88 * dt, u2 = t1 + dt; L.arrow(rr * Math.cos(u1), rr * Math.sin(u1), rr * Math.cos(u2), rr * Math.sin(u2), { color: col, head: 8, width: 0.01 }); }
          const cx = (a11 + a12) / 2, cy = (a21 + a22) / 2;
          L.tex(`\\det=${v.fix(D, 2)}`, cx, cy, { color: col, size: 15 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          // bar chart of the four terms
          const lo = Math.min(-0.45, ...terms, D) * 1.35, hi = Math.max(0.45, ...terms, D) * 1.3;
          R.setView(null, [lo, hi]);
          R.hline(0, { color: 'ink', width: 1 });
          const S = [0, 1, -1, 0], bc = (i) => (S[i] === 0 ? 'gray' : S[i] > 0 ? 'blue' : 'pink');
          R.bars(terms, { x0: 1, dx: 1, color: (_, i) => bc(i), barWidth: 0.6, fillAlpha: 0.8 });
          R.bars([D], { x0: 5, dx: 1, color: 'green', barWidth: 0.6, fillAlpha: 0.85 });
          const lab = ['s = 0', 's = +1', 's = −1', 's = 0'];
          terms.forEach((tv, i) => R.text(lab[i], i + 1, 0, { color: bc(i) === 'gray' ? 'muted' : bc(i), align: 'center', dy: tv >= 0 ? 14 : -14, size: 11.5 }));
          R.text('a₁₁a₂₂', 2, terms[1], { color: 'blue', align: 'center', dy: terms[1] >= 0 ? -10 : 12, size: 12 });
          R.text('−a₁₂a₂₁', 3, terms[2], { color: 'pink', align: 'center', dy: terms[2] >= 0 ? -10 : 12, size: 12 });
          R.text(v.fix(D, 3), 5, D, { color: 'green', align: 'center', dy: D >= 0 ? -10 : 12, size: 12, weight: 600 });
          st = { a11, a12, a21, a22, D, area: sarea(P) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\det[A]=s(1,2)\\,a(1,1)a(2,2)+s(2,1)\\,a(1,2)a(2,1)=${v.fix(s.a11 * s.a22, 4)}-(${v.fix(s.a12 * s.a21, 4)})=${v.fix(s.D, 4)}$; $\\;$ signed area of the parallelogram $=${v.fix(s.area + 0, 4)}$. For $n=3$ the sum has $27$ terms, of which only $3!=6$ survive.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.34 column rules
    {
      num: '9.34',
      kind: 'Theorem',
      name: 'Determinant: normalised, multilinear, alternating',
      statement: String.raw`(a) $\det[I]=\det(\mathbf e_1,\dots,\mathbf e_n)=1$.
(b) $\det(\mathbf x_1,\dots,\mathbf x_n)$ is a linear function of each column $\mathbf x_j$ when the other columns are held fixed.
(c) If $[A]_1$ is obtained from $[A]$ by interchanging two columns, then $\det[A]_1=-\det[A]$.
(d) If $[A]$ has two equal columns, then $\det[A]=0$.`,
      idea: String.raw`(a) For the identity only the term with $(j_1,\dots,j_n)=(1,\dots,n)$ is nonzero, and it equals $1$. (b) Every term of the defining sum contains exactly one entry from each column, so it is linear in that column. (c) Swapping two columns amounts to swapping two indices in each $n$-tuple, which flips the sign of $s$. (d) follows from (c): swapping two equal columns changes nothing, so $\det[A]=-\det[A]$. Together, (b) and (d) show that adding a multiple of one column to another does not change the determinant.`,
      caption: String.raw`The parallelepiped spanned by the columns $\mathbf x_1$ (blue), $\mathbf x_2$ (teal), $\mathbf x_3$ (purple) of a $3\times3$ matrix; drag to rotate. Pick a rule and move $t$; the right panel plots $\det$ of the moving matrix against $t$, computed directly from the definition. Linear in a column: a straight line. Sliding $\mathbf x_1$ and $\mathbf x_2$ into each other's place: the volume shrinks to $0$ when they coincide (d) and reappears with the opposite orientation (c). Shear: constant.`,
      deps: ['pma-9.33'],
      tags: ['determinants', 'linear algebra'],
      viz(v) {
        const M = v.M;
        const X = [[1.05, 0.15, -0.1], [0.3, 1.0, 0.2], [0.1, 0.3, 0.95]], Wv = [-0.55, 0.45, 0.6];
        const E3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        const MODES = {
          a: { label: '(a) $\\det I=1$', range: null, cols: () => E3 },
          b: { label: '(b) $\\mathbf x_1+t\\mathbf w$', range: [-1.5, 1.5], cols: (t) => [M.vadd(X[0], M.vscale(Wv, t)), X[1], X[2]] },
          c: { label: '(c) swap $\\mathbf x_1\\leftrightarrow\\mathbf x_2$', range: [0, 1], cols: (t) => [M.vlerp(X[0], X[1], t), M.vlerp(X[1], X[0], t), X[2]] },
          d: { label: '(d) $\\mathbf x_2\\to\\mathbf x_1$', range: [0, 1], cols: (t) => [X[0], M.vlerp(X[1], X[0], t), X[2]] },
          s: { label: 'shear $\\mathbf x_1+t\\mathbf x_2$', range: [-1.5, 1.5], cols: (t) => [M.vadd(X[0], M.vscale(X[1], t)), X[1], X[2]] },
        };
        const mode = v.select('', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'c');
        const sl = { b: v.slider('$t$', -1.5, 1.5, 0.7, { step: 0.01 }), c: v.slider('$t$', 0, 1, 0.3, { step: 0.005 }), d: v.slider('$t$', 0, 1, 0.6, { step: 0.005 }), s: v.slider('$t$', -1.5, 1.5, 0.8, { step: 0.01 }) };
        const S3 = v.stage3d({ range: 1.55, height: 340, yaw: -0.55, pitch: 0.42, axes: false, title: 'the parallelepiped spanned by the columns' });
        const P = v.stage({ x: [-1.6, 1.6], y: [-1.5, 1.5], height: 340, axes: true, xlabel: 't', title: '$\\det$ of the moving matrix against $t$' });
        let st = null;
        v.render(() => {
          const Mo = MODES[mode.value];
          for (const k of Object.keys(sl)) sl[k].el.hidden = k !== mode.value;
          const t = Mo.range ? sl[mode.value].value : 0;
          const C = Mo.cols(t), D = det3(...C);
          const col = Math.abs(D) < 2e-3 ? 'red' : D > 0 ? 'accent' : 'pink';
          // parallelepiped (the scene is shifted so that the base box sits in the middle of the panel)
          const sh = M.vscale(M.vadd(M.vadd(X[0], X[1]), X[2]), -0.5), at = (q) => M.vadd(q, sh);
          const box = (Cs) => { const V = []; for (const i of [0, 1]) for (const j of [0, 1]) for (const k of [0, 1]) V.push(at([0, 1, 2].map((q) => i * Cs[0][q] + j * Cs[1][q] + k * Cs[2][q]))); return V; };
          const FACES = [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]];
          const O = at([0, 0, 0]);
          [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((u, i) => { S3.line(M.vadd(O, M.vscale(u, -0.35)), M.vadd(O, M.vscale(u, 0.55)), { color: 'faint', width: 1 }); });
          if (mode.value !== 'a') { const G = box(X); for (const f of FACES) S3.path(f.map((i) => G[i]), { close: true, color: 'muted', width: 0.8, dash: [3, 4], alpha: 0.6 }); }
          const V = box(C);
          for (const f of FACES) S3.poly(f.map((i) => V[i]), { fill: col, fillAlpha: 0.14, color: col, alpha: 0.5, width: 1 });
          S3.arrow(O, at(C[0]), { color: 'blue', width: 2.6 }); S3.arrow(O, at(C[1]), { color: 'teal', width: 2.6 }); S3.arrow(O, at(C[2]), { color: 'purple', width: 2.6 });
          S3.text('x₁', at(M.vscale(C[0], 1.12)), { color: 'blue', math: true }); S3.text('x₂', at(M.vscale(C[1], 1.12)), { color: 'teal', math: true }); S3.text('x₃', at(M.vscale(C[2], 1.12)), { color: 'purple', math: true });
          if (mode.value === 'b') { S3.line(at(M.vadd(X[0], M.vscale(Wv, -1.5))), at(M.vadd(X[0], M.vscale(Wv, 1.5))), { color: 'blue', width: 1.2, dash: [4, 3], alpha: 0.7 }); }
          // det against t
          if (Mo.range) {
            const [lo, hi] = Mo.range, ts = M.linspace(lo, hi, 121), ds = ts.map((u) => det3(...Mo.cols(u)));
            const ymax = Math.max(0.5, ...ds.map(Math.abs)) * 1.2, pad = (hi - lo) * 0.06;
            P.setView([lo - pad, hi + pad], [-ymax, ymax]);
            P.path(ts.map((u, i) => [u, ds[i]]), { color: 'green', width: 2.4 });
            P.vline(t, { color: 'muted', dash: [3, 3], width: 1 });
            P.dot(t, D, { color: col, r: 6 });
            if (mode.value === 'c') { P.dot(0.5, 0, { color: 'red', r: 4, hollow: true, label: 'x₁ = x₂', labelPos: 'ne' }); }
            if (mode.value === 'd') { P.dot(1, 0, { color: 'red', r: 4, hollow: true, label: 'x₂ = x₁', labelPos: 'nw' }); }
          } else {
            P.setView([-1.6, 1.6], [-1.5, 1.5]);
            P.corner('only the term (j₁, j₂, j₃) = (1, 2, 3) survives: det I = 1', 'tl', { color: 'green', weight: 600 });
            P.dot(0, 1, { color: 'accent', r: 6, label: 'det I = 1', labelPos: 'e' });
          }
          st = { t, D, D0: det3(...X), Dw: det3(Wv, X[1], X[2]), mode: mode.value };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const d = `$\\det=${v.fix(s.D, 4)}$`;
          switch (s.mode) {
            case 'a': return `${d}: the unit cube.`;
            case 'b': return `${d} $=\\det(\\mathbf x_1,\\mathbf x_2,\\mathbf x_3)+t\\det(\\mathbf w,\\mathbf x_2,\\mathbf x_3)=${v.fix(s.D0, 3)}+t\\cdot(${v.fix(s.Dw, 3)})$ — linear in $t$.`;
            case 'c': return `${d} $=(1-2t)\\det[A]$ with $\\det[A]=${v.fix(s.D0, 3)}$: zero at $t=\\tfrac12$ (equal columns), $-\\det[A]$ at $t=1$ (swapped).`;
            case 'd': return `${d} $=(1-t)\\det[A]$: it vanishes when $\\mathbf x_2=\\mathbf x_1$.`;
            default: return `${d} $=\\det[A]=${v.fix(s.D0, 3)}$ for every $t$: by (b) and (d), adding $t\\mathbf x_2$ to $\\mathbf x_1$ changes nothing.`;
          }
        });
      },
    },
    // ------------------------------------------------------------------ 9.35 product rule
    {
      num: '9.35',
      kind: 'Theorem',
      name: 'Determinant of a product',
      statement: String.raw`If $[A]$ and $[B]$ are $n\times n$ matrices, then $\det([B][A])=\det[B]\,\det[A]$.`,
      idea: String.raw`Fix $[B]$ and regard $\det([B][A])=\det(B\mathbf x_1,\dots,B\mathbf x_n)$ as a function of the columns $\mathbf x_j$ of $[A]$; it inherits the column rules (b)–(d) of 9.34. Expanding each $\mathbf x_j=\sum_ia(i,j)\mathbf e_i$ by linearity and collapsing the resulting determinants $\det(B\mathbf e_{i_1},\dots,B\mathbf e_{i_n})$ with (c) and (d) to $\pm\det(B\mathbf e_1,\dots,B\mathbf e_n)=\pm\det[B]$ or $0$, one gets $\det([B][A])=\det[B]$ times a sum that does not involve $B$; the case $B=I$ identifies that sum as $\det[A]$. Geometrically, areas are scaled by $|\det A|$ and then by $|\det B|$, and orientation reversals are counted with signs.`,
      caption: String.raw`A region $E$ (with its unit square, dashed) is mapped by $A$ and then by $B$. Drag the columns of $A$ (middle) and of $B$ (right). The readout compares area ratios with $|\det A|$ and $|\det B|$ and checks $\det(BA)=\det B\det A$. The arrows on the boundary show orientation: it flips (pink) once for each factor with negative determinant, so the sign of $\det(BA)$ is the product of the signs.`,
      deps: ['pma-9.34', 'pma-9.33'],
      see: ['rca-2.20'],
      tags: ['determinants', 'linear algebra'],
      viz(v) {
        const M = v.M;
        const E = M.blob(0.5, 0.48, 0.36, 7, 0.28, 140);
        const P0 = v.stage({ x: [-0.4, 1.4], y: [-0.4, 1.4], equal: true, height: 270, minWidth: 220, title: '$E$' });
        const P1 = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, height: 270, minWidth: 220, title: '$A(E)$ — drag the columns of $A$' });
        const P2 = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 270, minWidth: 220, title: '$B(A(E))$ — drag the columns of $B$' });
        const a1 = P1.handle(-0.35, 1.25, { color: 'blue', label: 'Ae₁', labelPos: 'nw' }), a2 = P1.handle(1.35, 0.3, { color: 'teal', label: 'Ae₂', labelPos: 'ne' });
        const b1 = P2.handle(1.2, -0.5, { color: 'orange', label: 'Be₁' }), b2 = P2.handle(0.6, 1.4, { color: 'pink', label: 'Be₂', labelPos: 'nw' });
        let st = null;
        v.render(() => {
          const A = [[a1.x, a2.x], [a1.y, a2.y]], B = [[b1.x, b2.x], [b1.y, b2.y]], BA = mul2(B, A);
          const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
          const draw = (S, T, col) => {
            const Q = sq.map((p) => mv2(T, p)), EE = E.map((p) => mv2(T, p));
            S.poly(Q, { color: 'muted', width: 1, dash: [4, 4], fill: 'gray', fillAlpha: 0.05 });
            S.poly(EE, { color: col, width: 2, fill: col, fillAlpha: 0.2 });
            orient(S, EE, { color: col });
            S.dot(0, 0, { color: 'ink', r: 2.5 });
            return EE;
          };
          const I = [[1, 0], [0, 1]];
          const dA = det2(A), dB = det2(B), dBA = det2(BA);
          const oc = (d) => (Math.abs(d) < 1e-9 ? 'red' : d > 0 ? 'accent' : 'pink');
          const e0 = draw(P0, I, 'accent');
          const e1 = draw(P1, A, oc(dA));
          P1.line(0, 0, a1.x, a1.y, { color: 'blue', width: 2 }); P1.line(0, 0, a2.x, a2.y, { color: 'teal', width: 2 });
          const e2 = draw(P2, BA, oc(dBA));
          P2.line(0, 0, b1.x, b1.y, { color: 'orange', width: 2 }); P2.line(0, 0, b2.x, b2.y, { color: 'pink', width: 2 });
          P1.corner(`det A = ${v.fix(dA, 2)}`, 'bl', { color: dA < 0 ? 'pink' : 'muted', weight: 600 });
          P2.corner(`det B = ${v.fix(dB, 2)}`, 'bl', { color: dB < 0 ? 'pink' : 'muted', weight: 600 });
          P0.corner(`area ${v.fix(Math.abs(sarea(e0)), 3)}`, 'bl', { color: 'muted' });
          st = { A0: sarea(e0), A1: sarea(e1), A2: sarea(e2), dA, dB, dBA, BA };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\dfrac{|A(E)|}{|E|}=${v.fix(Math.abs(s.A1 / s.A0), 4)}=|\\det A|$, $\\;\\dfrac{|BA(E)|}{|A(E)|}=${Math.abs(s.A1) > 1e-9 ? v.fix(Math.abs(s.A2 / s.A1), 4) : '—'}=|\\det B|$; $\\;\\det(BA)=\\det${fmtM(v, s.BA)}=${v.fix(s.dBA, 4)}=(${v.fix(s.dB, 4)})(${v.fix(s.dA, 4)})$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.36 invertible iff det ≠ 0
    {
      num: '9.36',
      kind: 'Theorem',
      name: 'Invertible if and only if det ≠ 0',
      statement: String.raw`A linear operator $A$ on $\R^n$ is invertible if and only if $\det[A]\ne0$.`,
      idea: String.raw`If $A$ is invertible, the product rule (9.35) gives $\det[A]\det[A^{-1}]=\det[I]=1$, so $\det[A]\ne0$. If $A$ is not invertible, its columns are linearly dependent (9.5, 9.3), say $\mathbf x_k=\sum_{j\ne k}c_j\mathbf x_j$; substituting into the $k$-th column and using linearity (9.34(b)) writes $\det[A]$ as a sum of determinants with two equal columns, each $0$ by 9.34(d). Since $\det$ of a matrix does not depend on the basis used to write it (Rudin's remark 9.37), the statement makes sense for operators.`,
      caption: String.raw`Left: drag the columns $\mathbf x_1$ (blue) and $\mathbf x_2$ (teal). The background shades $\mathbf p\mapsto\det(\mathbf x_1,\mathbf p)$ (blue $>0$, red $<0$), a linear function of $\mathbf p$ (9.34(b)) that vanishes exactly on the red line $\R\mathbf x_1$. Right: $A^{-1}$ applied to the unit square, a parallelogram of area $1/|\det A|$. Drag $\mathbf x_2$ toward the red line: the inverse blows up, and on the line (it snaps) $A$ kills a nonzero vector and has no inverse at all.`,
      deps: ['pma-9.35', 'pma-9.34', 'pma-9.5', 'pma-9.3'],
      tags: ['determinants', 'linear algebra'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-2.4, 2.4], y: [-2, 2], equal: true, height: 330, title: '$\\mathbf p\\mapsto\\det(\\mathbf x_1,\\mathbf p)$ and the columns of $A$' });
        const R = v.stage({ x: [-3, 3], y: [-2.5, 2.5], equal: true, height: 330, title: '$A^{-1}([0,1]^2)$' });
        let h1 = null, h2 = null;
        h1 = L.handle(1.4, 0.45, { color: 'blue', label: 'x₁', labelPos: 'se' });
        h2 = L.handle(0.4, 1.2, { color: 'teal', label: 'x₂', labelPos: 'ne', constrain: snapParallel(() => [h1.x, h1.y]) });
        let st = null;
        v.render(() => {
          const x1 = [h1.x, h1.y], x2 = [h2.x, h2.y];
          const A = [[x1[0], x2[0]], [x1[1], x2[1]]], D = det2(A), sing = Math.abs(D) < 1e-9;
          const rng = 2.4 * Math.hypot(...x1) + 0.1;
          L.heat((x, y) => x1[1] * x - x1[0] * y, { range: [-rng, rng], cmap: 'diverging', res: 3, alpha: 0.4, key: `${x1}|${v.color('panel')}` });
          const n1 = M.normalize(x1);
          L.line(-8 * n1[0], -8 * n1[1], 8 * n1[0], 8 * n1[1], { color: 'red', width: 2 });
          L.text('det(x₁, p) = 0', -1.6 * n1[0], -1.6 * n1[1], { color: 'red', dy: 14, align: 'center', size: 11.5 });
          L.poly([[0, 0], x1, M.vadd(x1, x2), x2], { color: sing ? 'red' : 'ink', width: 1.4, fill: 'gray', fillAlpha: 0.12 });
          L.arrow(0, 0, x1[0], x1[1], { color: 'blue', width: 2.4 }); L.arrow(0, 0, x2[0], x2[1], { color: 'teal', width: 2.4 });
          L.dot(0, 0, { color: 'ink', r: 3 });
          L.corner(sing ? 'det A = 0' : `det A = ${v.fix(D, 3)}`, 'tl', { color: sing ? 'red' : 'ink', weight: 600 });
          // right: the inverse
          if (!sing) {
            const Ai = inv2(A), Q = [[0, 0], [1, 0], [1, 1], [0, 1]].map((p) => mv2(Ai, p));
            R.poly([[0, 0], [1, 0], [1, 1], [0, 1]], { color: 'muted', width: 1, dash: [4, 4] });
            R.poly(Q, { color: 'green', width: 2, fill: 'green', fillAlpha: 0.18 });
            R.arrow(0, 0, Ai[0][0], Ai[1][0], { color: 'green', width: 2.2 }); R.arrow(0, 0, Ai[0][1], Ai[1][1], { color: 'green', width: 2.2 });
            const tipLab = (sx, q) => { const n = Math.hypot(q[0], q[1]) || 1; R.tex(sx, q[0] + 0.32 * q[0] / n, q[1] + 0.32 * q[1] / n, { color: 'green', size: 13 }); };
            tipLab('A^{-1}\\mathbf e_1', [Ai[0][0], Ai[1][0]]); tipLab('A^{-1}\\mathbf e_2', [Ai[0][1], Ai[1][1]]);
            R.corner(`area = 1/|det A| = ${v.fmt(1 / Math.abs(D), 3)}`, 'tl', { color: 'green', weight: 600 });
          } else {
            // a null vector: x2 = λ x1, so A(λ, −1) = 0
            const lam = (x2[0] * x1[0] + x2[1] * x1[1]) / (x1[0] ** 2 + x1[1] ** 2), nv = [lam, -1];
            R.line(-8 * nv[0], -8 * nv[1], 8 * nv[0], 8 * nv[1], { color: 'red', width: 1.2, dash: [5, 4] });
            R.arrow(0, 0, nv[0], nv[1], { color: 'red', width: 2.6 });
            R.tex('A\\mathbf n=\\mathbf 0', nv[0], nv[1], { color: 'red', size: 14, dx: 14, dy: 10 });
            R.corner('A is not one-to-one: no inverse', 'tl', { color: 'red', weight: 600 });
          }
          R.dot(0, 0, { color: 'ink', r: 3 });
          st = { D, sing };
          v.legend([['red', 'zero set of $\\det(\\mathbf x_1,\\cdot)$'], ['green', '$A^{-1}$ of the unit square', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return s.sing ? '$\\mathbf x_2$ lies on $\\R\\mathbf x_1$: the columns are dependent, $\\det[A]=0$, and $A$ is not invertible.'
            : `$\\det[A]=${v.fix(s.D, 4)}$, $\\;\\det[A^{-1}]=${v.fmt(1 / s.D, 4)}$, $\\;\\det[A]\\det[A^{-1}]=${v.fix(s.D * (1 / s.D), 6)}=\\det[I]$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.38 Jacobian
    {
      num: '9.38',
      kind: 'Definition',
      name: 'Jacobian',
      statement: String.raw`If $\mathbf f$ maps an open set $E\subset\R^n$ into $\R^n$ and is differentiable at $\mathbf x\in E$, the **Jacobian** of $\mathbf f$ at $\mathbf x$ is the determinant of the linear operator $\mathbf f'(\mathbf x)$:
$$J_{\mathbf f}(\mathbf x)=\det\mathbf f'(\mathbf x),\qquad\text{also written}\quad\frac{\partial(y_1,\dots,y_n)}{\partial(x_1,\dots,x_n)}\ \text{ when }(y_1,\dots,y_n)=\mathbf f(x_1,\dots,x_n).$$`,
      idea: String.raw`By 9.36, $J_{\mathbf f}(\mathbf a)\ne0$ is exactly the hypothesis "$\mathbf f'(\mathbf a)$ is invertible" of the inverse function theorem (9.24), and in the implicit function theorem (9.28) the condition on $A_x$ reads $\partial(f_1,\dots,f_n)/\partial(x_1,\dots,x_n)\ne0$. Geometrically $|J_{\mathbf f}(\mathbf x)|$ is the local factor by which $\mathbf f$ multiplies volume and its sign tells whether orientation is kept — the source of the $|J|$ in the change of variables formula (10.9).`,
      caption: String.raw`Left: the sign and size of $J_{\mathbf f}$ (blue $>0$, red $<0$, white on the curve $J_{\mathbf f}=0$) and a small square $Q$ of side $h$ centred at the draggable point $\mathbf p$, corners numbered counterclockwise. Right, zoomed: $\mathbf f(Q)$ (green) against the parallelogram $\mathbf f(\mathbf p)+\mathbf f'(\mathbf p)(Q-\mathbf p)$ (dashed). Shrink $h$: the signed area ratio $|\mathbf f(Q)|/|Q|$ tends to $J_{\mathbf f}(\mathbf p)$, and where $J_{\mathbf f}<0$ the corners come out clockwise.`,
      deps: ['pma-9.33', 'pma-9.11'],
      see: ['pma-10.9', 'rca-7.26'],
      tags: ['determinants', 'Jacobian', 'differentiation'],
      viz(v) {
        const M = v.M;
        const MAPS = {
          polar: { label: 'polar $(r\\cos\\theta,\\,r\\sin\\theta)$', f: (x, y) => [x * Math.cos(y), x * Math.sin(y)], J: (x, y) => [[Math.cos(y), -x * Math.sin(y)], [Math.sin(y), x * Math.cos(y)]], view: [[-0.6, 2.6], [-0.4, 3.4]], p: [1.3, 0.8], xl: 'r', yl: 'θ', range: 2.6 },
          sq: { label: '$z^2$', f: (x, y) => [x * x - y * y, 2 * x * y], J: (x, y) => [[2 * x, -2 * y], [2 * y, 2 * x]], view: [[-1.6, 1.6], [-1.3, 1.3]], p: [0.9, 0.45], xl: 'x', yl: 'y', range: 8 },
          cusp: { label: 'fold $(x,\\,y^3-3y)$', f: (x, y) => [x, y ** 3 - 3 * y], J: (x, y) => [[1, 0], [0, 3 * y * y - 3]], view: [[-1.6, 1.6], [-1.8, 1.8]], p: [0.2, 0.45], xl: 'x', yl: 'y', range: 6 },
        };
        const which = v.select('$\\mathbf f$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const hS = v.slider('side $h$ of $Q$', 0.02, 0.9, 0.35, { log: true });
        const L = v.stage({ x: MAPS.sq.view[0], y: MAPS.sq.view[1], equal: true, height: 340, title: '$J_{\\mathbf f}$ and the square $Q$ at $\\mathbf p$' });
        const R = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, height: 340, title: '$\\mathbf f(Q)$ and its linear approximation (zoomed)' });
        const hp = L.handle(...MAPS.sq.p, { color: 'gold', label: 'p', labelPos: 'nw' });
        const blue = v.rgb('blue'), red = v.rgb('red'), panel = v.rgb('panel');
        let last = null, st = null;
        v.render(() => {
          const F = MAPS[which.value];
          if (last !== which.value) { last = which.value; L.setView(...F.view); hp.x = F.p[0]; hp.y = F.p[1]; }
          const p = [hp.x, hp.y], h = hS.value;
          L.raster((x, y) => {
            const j = det2(F.J(x, y)), t = Math.tanh(Math.abs(j) / (0.35 * F.range)), c = j >= 0 ? blue : red;
            return [panel[0] + (c[0] - panel[0]) * t * 0.42, panel[1] + (c[1] - panel[1]) * t * 0.42, panel[2] + (c[2] - panel[2]) * t * 0.42];
          }, { key: `${which.value}|${v.color('panel')}`, res: 3 });
          L.axes();
          // square Q (counterclockwise corners 1..4) and its boundary
          const C = [[p[0] - h / 2, p[1] - h / 2], [p[0] + h / 2, p[1] - h / 2], [p[0] + h / 2, p[1] + h / 2], [p[0] - h / 2, p[1] + h / 2]];
          const bnd = []; for (let k = 0; k < 4; k++) for (let i = 0; i < 40; i++) bnd.push(M.vlerp(C[k], C[(k + 1) % 4], i / 40));
          L.poly(C, { color: 'gold', width: 2, fill: 'gold', fillAlpha: 0.2 });
          C.forEach((c, k) => L.text(String(k + 1), c[0], c[1], { color: 'ink', size: 11, dx: k === 0 || k === 3 ? -8 : 8, dy: k < 2 ? 8 : -8, align: 'center' }));
          // image and its linearisation
          const img = bnd.map((q) => F.f(q[0], q[1]));
          const fp = F.f(p[0], p[1]), Jp = F.J(p[0], p[1]), lin = C.map((c) => M.vadd(fp, mv2(Jp, [c[0] - p[0], c[1] - p[1]])));
          const all = img.concat(lin), xs = all.map((q) => q[0]), ys = all.map((q) => q[1]);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
          const half = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 0.62 + 1e-6;
          R.setView([cx - half, cx + half], [cy - half, cy + half]);
          R.poly(lin, { color: 'ink', width: 1.4, dash: [5, 4] });
          R.poly(img, { color: 'green', width: 2.2, fill: 'green', fillAlpha: 0.18 });
          const corners = C.map((c) => F.f(c[0], c[1]));
          const ctr = img.reduce((s, q) => [s[0] + q[0] / img.length, s[1] + q[1] / img.length], [0, 0]);
          corners.forEach((c, k) => { const d = M.normalize([c[0] - ctr[0], c[1] - ctr[1]]); R.dot(c[0], c[1], { color: 'green', r: 3.5 }); R.text(String(k + 1), c[0], c[1], { color: 'ink', size: 11, dx: 11 * d[0], dy: -11 * d[1], align: 'center' }); });
          const ratio = sarea(img) / (h * h), J = det2(Jp);
          L.setTitle(`$J_{\\mathbf f}$ and the square $Q$ at $\\mathbf p$ $\\;(${F.xl}, ${F.yl})$ coordinates`);
          st = { ratio, J, h, polar: which.value === 'polar' };
          v.legend([['gold', 'the square $Q$', { area: true }], ['green', '$\\mathbf f(Q)$', { area: true }], ['ink', '$\\mathbf f(\\mathbf p)+\\mathbf f\'(\\mathbf p)(Q-\\mathbf p)$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$h=${v.fix(s.h, 3)}$: $\\;\\dfrac{\\text{signed area of }\\mathbf f(Q)}{h^2}=${v.fix(s.ratio, 4)}$, $\\;J_{\\mathbf f}(\\mathbf p)=\\det\\mathbf f'(\\mathbf p)=${v.fix(s.J, 4)}$, $\\;$ difference $${sci(v, Math.abs(s.ratio - s.J))}$` + (s.polar ? ' — exactly $0$ up to quadrature error: here $J=r$ is linear, so its average over $Q$ is $J(\\mathbf p)$.' : ' — of order $h^2$, since $Q$ is centred at $\\mathbf p$.') + (s.J < 0 ? ' Orientation is reversed: the corners of $\\mathbf f(Q)$ run clockwise.' : '');
        });
      },
    },
  ],
};
