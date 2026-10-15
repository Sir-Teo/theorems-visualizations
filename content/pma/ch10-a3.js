// Rudin, Principles of Mathematical Analysis — Chapter 10 (part 3: 10.13–10.17)
// The algebra of differential forms: anticommutativity, basic forms, uniqueness, products.

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n) => String(n).split('').map((d) => SUB[+d]).join('');

export default {
  collection: 'pma',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.13
    {
      num: '10.13',
      kind: 'Definition',
      name: 'Equality of forms; anticommutativity',
      statement: String.raw`Two $k$-forms $\omega_1,\omega_2$ in $E$ are **equal** if $\int_\Phi\omega_1=\int_\Phi\omega_2$ for every $k$-surface $\Phi$ in $E$; in particular $\omega=0$ means that every such integral vanishes. Sums and real multiples are defined through the integrals: $\int_\Phi(\omega_1+\omega_2)=\int_\Phi\omega_1+\int_\Phi\omega_2$ and $\int_\Phi c\,\omega=c\int_\Phi\omega$. Because a determinant changes sign when two rows are swapped, interchanging two of the differentials changes the sign of a form:
$$dx_i\wedge dx_j=-dx_j\wedge dx_i,\qquad dx_i\wedge dx_i=0 .$$
More generally $a(\mathbf x)\,dx_{i_1}\wedge\cdots\wedge dx_{i_k}=0$ whenever two of the indices coincide, and every $k$-form in an open subset of $\R^n$ is $0$ if $k>n$.`,
      idea: String.raw`In $\int_\Phi a\,dx_{i_1}\wedge\cdots\wedge dx_{i_k}$ the indices only choose the rows of the Jacobian matrix $\partial(x_{i_1},\dots,x_{i_k})/\partial(u_1,\dots,u_k)$. Swapping two indices swaps two rows (9.34), so the integrand changes sign for every $\Phi$; if two indices are equal the matrix has two equal rows and determinant $0$. With $k>n$ some index must repeat.`,
      caption: String.raw`Left: an affine $2$-surface $\Phi(\mathbf u)=\mathbf p+u_1\mathbf a+u_2\mathbf b$ in $\R^2$ ($D=[0,1]^2$); drag $\mathbf p$ and the tips of $\mathbf a,\mathbf b$. Right: the "shadow" $\mathbf u\mapsto(\phi_i(\mathbf u),\phi_j(\mathbf u))$ that $dx_i\wedge dx_j$ actually measures; its signed area is $\int_\Phi dx_i\wedge dx_j$ (blue: positively oriented, red: reversed). $dy\wedge dx$ mirrors the shadow and flips the sign; $dx\wedge dx$ flattens it onto the diagonal, area $0$; the last option shows $dx\wedge dy+dy\wedge dx=0$.`,
      deps: ['pma-10.11', 'pma-9.34'],
      verify: true,
      tags: ['differential forms', 'determinants'],
      viz(v) {
        const M = v.M;
        const F = {
          xy: { label: '$dx\\wedge dy$', terms: [[0, 1, 1]] },
          yx: { label: '$dy\\wedge dx$', terms: [[1, 0, 1]] },
          xx: { label: '$dx\\wedge dx$', terms: [[0, 0, 1]] },
          sum: { label: '$dx\\wedge dy+dy\\wedge dx$', terms: [[0, 1, 1], [1, 0, 1]] },
        };
        const which = v.select('$\\omega$', Object.entries(F).map(([value, o]) => ({ value, label: o.label })), 'yx');
        const L = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 330, title: 'the $2$-surface $\\Phi(D)$ in the $(x,y)$-plane' });
        const R = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 330, title: 'its shadow $(\\phi_i,\\phi_j)$' });
        const p = L.handle(-0.9, -0.7, { color: 'ink', label: 'p', labelPos: 'sw' });
        const A = L.handle(0.7, -0.4, { color: 'orange', label: 'p+a' });
        const B = L.handle(-0.2, 1.0, { color: 'purple', label: 'p+b', labelPos: 'nw' });
        const NAMES = ['x', 'y'];
        let st = {};
        v.legend([['orange', 'image of $u_1$-direction'], ['purple', 'image of $u_2$-direction'], ['blue', 'positively oriented shadow', { area: true }], ['red', 'reversed shadow', { area: true }]]);
        const quad = (S, q0, a, b, col, alpha) => {
          const P = [q0, M.vadd(q0, a), M.vadd(M.vadd(q0, a), b), M.vadd(q0, b)];
          S.poly(P, { fill: col, fillAlpha: alpha, color: col, width: 1.6 });
          // orientation: walk the boundary u1 then u2
          for (let k = 0; k < 4; k++) { const s = P[k], e = P[(k + 1) % 4]; const m = M.vlerp(s, e, 0.55), m0 = M.vlerp(s, e, 0.42); S.arrow(m0[0], m0[1], m[0], m[1], { color: col, head: 9, width: 0.1 }); }
          S.arrow(q0[0], q0[1], q0[0] + a[0], q0[1] + a[1], { color: 'orange', width: 2.4, head: 9 });
          S.arrow(q0[0], q0[1], q0[0] + b[0], q0[1] + b[1], { color: 'purple', width: 2.4, head: 9 });
        };
        v.render(() => {
          const q0 = [p.x, p.y], a = [A.x - p.x, A.y - p.y], b = [B.x - p.x, B.y - p.y];
          const det = a[0] * b[1] - a[1] * b[0];
          quad(L, q0, a, b, det >= 0 ? 'blue' : 'red', 0.12);
          L.tex('\\Phi(D)', q0[0] + (a[0] + b[0]) / 2, q0[1] + (a[1] + b[1]) / 2, { color: 'ink' });
          const terms = F[which.value].terms, vals = [];
          R.line(-5, -5, 5, 5, { color: 'faint', width: 1, dash: [4, 4] });
          for (const [i, j] of terms) {
            const s0 = [q0[i], q0[j]], sa = [a[i], a[j]], sb = [b[i], b[j]];
            const d = sa[0] * sb[1] - sa[1] * sb[0];
            vals.push({ i, j, d, sa, sb });
            if (Math.abs(d) < 1e-9) { R.line(...s0, s0[0] + sa[0] + sb[0], s0[1] + sa[1] + sb[1], { color: 'muted', width: 3 }); quad(R, s0, sa, sb, 'muted', 0); }
            else quad(R, s0, sa, sb, d > 0 ? 'blue' : 'red', terms.length > 1 ? 0.16 : 0.2);
          }
          const tot = vals.reduce((s, z) => s + z.d, 0);
          const names = terms.map(([i, j]) => `(${NAMES[i]}, ${NAMES[j]})`).join(' and ');
          R.setTitle(`its shadow $\\mathbf u\\mapsto${terms.map(([i, j]) => `(\\phi_${i + 1},\\phi_${j + 1})`).join(',\\ ')}$`);
          R.corner(`axes: ${names}`, 'bl', { color: 'muted' });
          R.corner(Math.abs(tot) < 1e-9 ? '∫ = 0' : tot > 0 ? '∫ > 0' : '∫ < 0', 'tl', { color: Math.abs(tot) < 1e-9 ? 'green' : tot > 0 ? 'blue' : 'red', weight: 600 });
          st = { vals, tot, det };
        });
        v.readout(() => {
          const f = (x) => v.fix(x, 2);
          const parts = st.vals.map(({ i, j, sa, sb, d }) => `\\frac{\\partial(${NAMES[i]},${NAMES[j]})}{\\partial(u_1,u_2)}=\\det\\begin{pmatrix}${f(sa[0])}&${f(sb[0])}\\\\ ${f(sa[1])}&${f(sb[1])}\\end{pmatrix}=${v.fix(d, 3)}`);
          return `$${parts.join(',\\quad ')}$. $\\;$ Since the Jacobian is constant and $|D|=1$: $\\int_\\Phi\\omega=${v.fix(st.tot, 3)}$` + (which.value === 'yx' ? ` $=-\\int_\\Phi dx\\wedge dy$.` : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 10.14
    {
      num: '10.14',
      kind: 'Definition',
      name: 'Basic k-forms and the standard presentation',
      statement: String.raw`If $i_1<i_2<\dots<i_k$ are integers in $\{1,\dots,n\}$, $I=\{i_1,\dots,i_k\}$ is an **increasing $k$-index** and $dx_I=dx_{i_1}\wedge\cdots\wedge dx_{i_k}$ is a **basic $k$-form**; there are $\binom nk$ of them in $\R^n$. Using 10.13 (drop terms with a repeated index, reorder the others at the cost of a sign, and collect), every $k$-form can be written as
$$\omega=\sum_I b_I(\mathbf x)\,dx_I,$$
the sum running over increasing $k$-indices; this is the **standard presentation** of $\omega$.`,
      idea: String.raw`For $k=2$ in $\R^3$: a term $a_{ji}\,dx_j\wedge dx_i$ with $j>i$ equals $-a_{ji}\,dx_i\wedge dx_j$, and $a_{ii}\,dx_i\wedge dx_i=0$, so $\sum_{i,j}a_{ij}\,dx_i\wedge dx_j=\sum_{i<j}(a_{ij}-a_{ji})\,dx_i\wedge dx_j$. Geometrically, $\int_\Phi dx_i\wedge dx_j$ is the signed area of the shadow of $\Phi$ on the $(x_i,x_j)$-coordinate plane, and only the three increasing pairs are needed.`,
      caption: String.raw`Left: the nine coefficients $a_{ij}$ of a $2$-form $\sum_{i,j}a_{ij}\,dx_i\wedge dx_j$ in $\R^3$ — click a tile to change it. The diagonal never contributes, and each pair $a_{ij},a_{ji}$ collapses to one standard coefficient $b_{ij}=a_{ij}-a_{ji}$ (right column). Right: a parallelogram $\Phi$ in $\R^3$ (drag to rotate, "new parallelogram" to resample) with its shadows on the three coordinate planes; their signed areas $A_{12},A_{13},A_{23}$ are the integrals of the basic forms. The readout evaluates $\int_\Phi\omega$ from all nine terms and from the standard presentation.`,
      deps: ['pma-10.13', 'pma-10.11'],
      tags: ['differential forms', 'basic forms'],
      viz(v) {
        const M = v.M;
        const T = v.stage({ x: [-0.2, 5.6], y: [-0.55, 3.55], equal: true, height: 320, axes: false, minWidth: 280, title: 'coefficients $a_{ij}$ (click) $\\to$ $b_{ij}=a_{ij}-a_{ji}$' });
        const S = v.stage3d({ range: 1.55, height: 320, yaw: -1.0, pitch: 0.42, labels: ['x₁', 'x₂', 'x₃'], weight: 1.3, title: 'a parallelogram $\\Phi$ and its three shadows' });
        const a = [[0, 2, -1], [1, 0, 0], [0, 1, 0]];
        let rnd = v.rng(4);
        const newPar = () => { const r = () => Math.round(rnd.uniform(-1, 1) * 100) / 100; const c = [0.1 * r(), 0.1 * r(), 0.2 + 0.1 * r()]; return { c, A: [0.9 + 0.2 * r(), 0.25 * r(), 0.45 * r()], B: [0.3 * r(), 0.8 + 0.2 * r(), 0.5 + 0.3 * r()] }; };
        let par = newPar();
        v.button('new parallelogram', () => { rnd = v.rng(Math.floor(Math.random() * 1e9)); par = newPar(); });
        T.onClick((x, y) => {
          const j = Math.floor(x + 0.0), i = Math.floor(3 - y);
          if (i >= 0 && i < 3 && j >= 0 && j < 3 && i !== j) a[i][j] = a[i][j] >= 2 ? -2 : a[i][j] + 1;
        });
        const PAIR = { '01': 'blue', '02': 'orange', '12': 'purple' };
        let st = {};
        v.legend([['blue', 'pair $(1,2)$: $dx_1\\wedge dx_2$', { area: true }], ['orange', 'pair $(1,3)$: $dx_1\\wedge dx_3$', { area: true }], ['purple', 'pair $(2,3)$: $dx_2\\wedge dx_3$', { area: true }]]);
        v.render(() => {
          // ---- coefficient table
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            const x0 = j, y0 = 2 - i;
            if (i === j) { T.rect(x0 + 0.06, y0 + 0.06, x0 + 0.94, y0 + 0.94, { fill: 'faint', fillAlpha: 0.18, color: 'faint', width: 1 }); T.text('0', x0 + 0.5, y0 + 0.5, { color: 'muted', align: 'center', size: 13 }); continue; }
            const key = i < j ? `${i}${j}` : `${j}${i}`, col = PAIR[key];
            T.rect(x0 + 0.06, y0 + 0.06, x0 + 0.94, y0 + 0.94, { fill: col, fillAlpha: i < j ? 0.22 : 0.1, color: col, width: 1.4, dash: i < j ? null : [3, 3] });
            T.text(String(a[i][j]).replace('-', '−'), x0 + 0.5, y0 + 0.5, { color: 'ink', align: 'center', size: 17, weight: 600 });
          }
          for (let k = 0; k < 3; k++) { T.text(`i=${k + 1}`, -0.12, 2.5 - k, { color: 'muted', align: 'right', size: 11 }); T.text(`j=${k + 1}`, k + 0.5, 3.18, { color: 'muted', align: 'center', size: 11 }); }
          const bs = [['01', a[0][1] - a[1][0]], ['02', a[0][2] - a[2][0]], ['12', a[1][2] - a[2][1]]];
          bs.forEach(([k, b], r) => {
            const y0 = 2 - r;
            T.rect(3.9, y0 + 0.06, 5.5, y0 + 0.94, { fill: PAIR[k], fillAlpha: 0.22, color: PAIR[k], width: 1.4 });
            T.tex(`b_{${+k[0] + 1}${+k[1] + 1}}=${String(b).replace('-', '-')}`, 4.7, y0 + 0.5, { color: 'ink', size: 15 });
          });
          T.arrow(3.15, 1.5, 3.75, 1.5, { color: 'muted', width: 1.4, head: 8 });
          T.text('diagonal: dxᵢ∧dxᵢ = 0', 1.5, -0.3, { color: 'muted', align: 'center', size: 11.5 });
          // ---- 3D parallelogram and shadows
          const { c, A, B } = par;
          const P = [c, M.vadd(c, A), M.vadd(M.vadd(c, A), B), M.vadd(c, B)];
          const W = 1.25;
          // planes: x3 = -W (shadow (1,2)), x2 = W (shadow (1,3)), x1 = -W (shadow (2,3))
          const proj = { '01': (q) => [q[0], q[1], -W], '02': (q) => [q[0], W, q[2]], '12': (q) => [-W, q[1], q[2]] };
          const areas = {};
          for (const k of ['01', '02', '12']) {
            const i = +k[0], j = +k[1];
            const d = A[i] * B[j] - A[j] * B[i]; areas[k] = d;
            const sh = P.map(proj[k]);
            S.poly(sh, { fill: d >= 0 ? PAIR[k] : 'red', fillAlpha: 0.35, color: PAIR[k], width: 1.6 });
            for (const q of P) S.line(q, proj[k](q), { color: PAIR[k], width: 0.8, alpha: 0.35, dash: [2, 4] });
            const cen = sh.reduce((s, q) => M.vadd(s, M.vscale(q, 0.25)), [0, 0, 0]);
            S.text(`A${sub(i + 1)}${sub(j + 1)}`, cen, { color: PAIR[k], size: 12, weight: 600 });
          }
          S.poly(P, { fill: 'ink', fillAlpha: 0.18, color: 'ink', width: 2 });
          S.arrow(c, M.vadd(c, A), { color: 'ink', width: 2.2, head: 8 });
          S.arrow(c, M.vadd(c, B), { color: 'ink', width: 2.2, head: 8 });
          S.text('Φ', M.vadd(c, M.vscale(M.vadd(A, B), 0.5)), { math: true, size: 18 });
          // integrals
          let full = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) full += a[i][j] * (A[i] * B[j] - A[j] * B[i]);
          const std = bs.reduce((s, [k, b]) => s + b * areas[k], 0);
          st = { full, std, areas, bs };
        });
        v.readout(() => `$A_{12}=${v.fix(st.areas['01'], 3)},\\ A_{13}=${v.fix(st.areas['02'], 3)},\\ A_{23}=${v.fix(st.areas['12'], 3)}$. $\\quad\\sum_{i,j}a_{ij}\\frac{\\partial(x_i,x_j)}{\\partial(u_1,u_2)}=${v.fix(st.full, 4)}$, $\\quad\\sum_{i<j}b_{ij}A_{ij}=${v.fix(st.std, 4)}$ — the same integral from $3$ instead of $9$ terms.`);
      },
    },
    // ------------------------------------------------------------------ 10.15
    {
      num: '10.15',
      kind: 'Theorem',
      name: 'Uniqueness of the standard presentation',
      statement: String.raw`Let $\omega=\sum_Ib_I(\mathbf x)\,dx_I$ be the standard presentation of a $k$-form $\omega$ in an open set $E\subset\R^n$. If $\omega=0$ in $E$, then $b_I(\mathbf x)=0$ for every increasing $k$-index $I$ and every $\mathbf x\in E$. Consequently the coefficients of the standard presentation are determined by $\omega$.`,
      idea: String.raw`Suppose $b_J(\mathbf v)>0$ for some $J=\{j_1<\dots<j_k\}$ and $\mathbf v\in E$. By continuity $b_J>0$ near $\mathbf v$. Take the small coordinate cube $\Phi(\mathbf u)=\mathbf v+\sum_ru_r\mathbf e_{j_r}$, $\mathbf u\in[0,h]^k$. For $I\ne J$ the Jacobian $\partial(x_I)/\partial(\mathbf u)$ has a zero row, while for $I=J$ it is $1$; hence $\int_\Phi\omega=\int_{[0,h]^k}b_J(\Phi(\mathbf u))\,d\mathbf u>0$, contradicting $\omega=0$. The same computation shows $h^{-k}\int_\Phi\omega\to b_J(\mathbf v)$.`,
      caption: String.raw`A $2$-form in $\R^3$, $\omega=b_{12}\,dx_1\wedge dx_2+b_{13}\,dx_1\wedge dx_3+b_{23}\,dx_2\wedge dx_3$ with variable coefficients. Choose a coordinate plane $J$ and the point $\mathbf v$; the orange square of side $h$ through $\mathbf v$ is the surface $\Phi$ of the proof. The bars show $h^{-2}$ times the contribution of each basic form: two of them are exactly $0$. The lower panel shows $h^{-2}\int_\Phi\omega\to b_J(\mathbf v)$ as $h\to0$, so a form that integrates to $0$ over every surface has all coefficients $0$.`,
      deps: ['pma-10.14', 'pma-10.11', 'pma-10.13'],
      tags: ['differential forms', 'basic forms'],
      viz(v) {
        const M = v.M;
        const b = {
          '12': (x) => 0.6 + x[2] + 0.5 * Math.sin(2 * x[0]),
          '13': (x) => 1.1 - x[1] * x[1] - 0.4 * x[0],
          '23': (x) => x[0] * x[1] - 0.35 + 0.3 * x[2],
        };
        const KEYS = ['12', '13', '23'], COL = { '12': 'blue', '13': 'orange', '23': 'purple' };
        const J = v.select('plane $J$', KEYS.map((k) => ({ value: k, label: `$J=\\{${k[0]},${k[1]}\\}$` })), '13');
        const PTS = [[0.3, -0.4, 0.2], [-0.5, 0.5, -0.3], [0.6, 0.6, 0.5]];
        let vi = 0;
        v.button('move $\\mathbf v$', () => { vi = (vi + 1) % PTS.length; });
        const hS = v.slider('$h$', 0.02, 1, 0.6, { log: true, decimals: 3 });
        const S = v.stage3d({ range: 1.5, height: 300, yaw: -0.6, pitch: 0.38, labels: ['x₁', 'x₂', 'x₃'], weight: 1.3, title: 'the coordinate square $\\Phi(\\mathbf u)=\\mathbf v+u_1\\mathbf e_{j_1}+u_2\\mathbf e_{j_2}$' });
        const Bp = v.stage({ x: [0.4, 3.6], y: [-0.5, 1.5], height: 300, axes: true, minWidth: 240, xticks: [[1, '{1,2}'], [2, '{1,3}'], [3, '{2,3}']], title: '$h^{-2}\\int_\\Phi b_I\\,dx_I$ for each $I$' });
        const C = v.stage({ x: [0, 1.02], y: [-0.5, 1.5], height: 170, full: true, axes: 'box', xlabel: 'h', title: '$h^{-2}\\int_\\Phi\\omega$ as a function of $h$' });
        let st = {};
        // Integral of a basic form over Φ: Jacobian of (x_i, x_j) w.r.t. (u1, u2) is 1 if {i,j} = J, else 0.
        const contrib = (I, Jk, vv, h) => {
          if (I !== Jk) return 0;
          const j1 = +Jk[0] - 1, j2 = +Jk[1] - 1;
          return M.integrate((u1) => M.integrate((u2) => { const x = vv.slice(); x[j1] += u1; x[j2] += u2; return b[I](x); }, 0, h, 16), 0, h, 16) / (h * h);
        };
        v.legend([['orange', 'the square $\\Phi(D)$, $D=[0,h]^2$', { area: true }], ['green', '$b_J(\\mathbf v)$', { dash: true }]]);
        v.render(() => {
          const vv = PTS[vi], Jk = J.value, h = hS.value, j1 = +Jk[0] - 1, j2 = +Jk[1] - 1;
          const e1 = [0, 0, 0], e2 = [0, 0, 0]; e1[j1] = h; e2[j2] = h;
          // faint coordinate planes through v
          for (const k of KEYS) {
            const i1 = +k[0] - 1, i2 = +k[1] - 1, f1 = [0, 0, 0], f2 = [0, 0, 0]; f1[i1] = 0.45; f2[i2] = 0.45;
            const Q = [M.vsub(M.vsub(vv, f1), f2), M.vsub(M.vadd(vv, f1), f2), M.vadd(M.vadd(vv, f1), f2), M.vadd(M.vsub(vv, f1), f2)];
            S.poly(Q, { fill: COL[k], fillAlpha: k === Jk ? 0.1 : 0.04, color: COL[k], alpha: 0.4, width: 0.8 });
          }
          const sq = [vv, M.vadd(vv, e1), M.vadd(M.vadd(vv, e1), e2), M.vadd(vv, e2)];
          S.poly(sq, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 2, bias: -0.05 });
          S.arrow(vv, M.vadd(vv, e1), { color: 'ink', width: 2, head: 7, bias: -0.1 });
          S.arrow(vv, M.vadd(vv, e2), { color: 'ink', width: 2, head: 7, bias: -0.1 });
          S.dot(vv, { color: 'ink', r: 5, label: 'v', bias: -0.2 });
          // bars
          const vals = KEYS.map((I) => contrib(I, Jk, vv, h));
          const lo = Math.min(-0.2, ...vals, b[Jk](vv)) - 0.2, hi = Math.max(0.4, ...vals, b[Jk](vv)) + 0.3;
          Bp.setView(null, [lo, hi]); C.setView(null, [lo, hi]);
          vals.forEach((z, k) => {
            const I = KEYS[k];
            if (I === Jk) Bp.rect(k + 1 - 0.3, 0, k + 1 + 0.3, z, { fill: COL[I], fillAlpha: 0.75, stroke: false });
            else { Bp.line(k + 1 - 0.3, 0, k + 1 + 0.3, 0, { color: COL[I], width: 4, cap: 'butt' }); Bp.text('Jacobian = 0', k + 1, 0, { color: 'muted', size: 10.5, align: 'center', dy: -12 }); }
          });
          Bp.hline(b[Jk](vv), { color: 'green', dash: [5, 4], width: 1.4 });
          // convergence
          const hs = M.linspace(0.01, 1, 80), cs = hs.map((t) => contrib(Jk, Jk, vv, t));
          C.hline(b[Jk](vv), { color: 'green', dash: [5, 4], width: 1.4 });
          C.text(`b${sub(Jk[0])}${sub(Jk[1])}(v) = ${v.fix(b[Jk](vv), 3)}`, 0.99, b[Jk](vv), { color: 'green', align: 'right', baseline: 'bottom', dy: -3, size: 11.5 });
          C.path(hs.map((t, i) => [t, cs[i]]), { color: 'orange', width: 2.2 });
          C.dot(h, vals[KEYS.indexOf(Jk)], { color: 'orange', r: 5 });
          st = { vv, Jk, vals, bJ: b[Jk](vv), h, others: KEYS.map((I) => b[I](vv)) };
        });
        v.readout(() => {
          const s = st; const f = (x) => v.fix(x, 3);
          return `$\\mathbf v=(${s.vv.map(f).join(',')})$: $\\;b_{12}(\\mathbf v)=${f(s.others[0])},\\ b_{13}(\\mathbf v)=${f(s.others[1])},\\ b_{23}(\\mathbf v)=${f(s.others[2])}$. $\\quad h^{-2}\\int_\\Phi\\omega=${v.fix(s.vals.reduce((a, c) => a + c, 0), 4)}\\to b_{${s.Jk}}(\\mathbf v)=${v.fix(s.bJ, 4)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.16
    {
      num: '10.16',
      kind: 'Definition',
      name: 'Products of basic forms',
      statement: String.raw`For increasing indices $I=\{i_1,\dots,i_p\}$ and $J=\{j_1,\dots,j_q\}$ in $\{1,\dots,n\}$ define
$$dx_I\wedge dx_J=dx_{i_1}\wedge\cdots\wedge dx_{i_p}\wedge dx_{j_1}\wedge\cdots\wedge dx_{j_q}.$$
If $I$ and $J$ have a common member this is $0$ (10.13). Otherwise let $[I,J]$ be the increasing $(p+q)$-index formed by the members of $I\cup J$; then
$$dx_I\wedge dx_J=(-1)^\alpha\,dx_{[I,J]},$$
where $\alpha$ is the number of pairs $(i,j)\in I\times J$ with $i>j$. This product is associative: $(dx_I\wedge dx_J)\wedge dx_K=dx_I\wedge(dx_J\wedge dx_K)$.`,
      idea: String.raw`Sort the concatenated list by moving each $dx_j$ leftwards past the $dx_i$ that are larger than it; every move is an adjacent interchange, which costs a factor $-1$ (10.13), and there are exactly $\alpha$ of them. Associativity holds because both sides reduce to the same sorted list, and the inversions of $(I,J,K)$ are counted the same way whichever pair is merged first.`,
      caption: String.raw`Click the numbers in the top strip to put an index in $I$ (blue), in $J$ (orange), in both (red), or in neither. The middle row is $dx_I\wedge dx_J$ as written; each string carries a differential to its place in the sorted product $dx_{[I,J]}$. Every crossing of a blue and an orange string is one adjacent interchange, so the number of crossings is $\alpha$ and the sign is $(-1)^\alpha$. A shared index forces a repeated differential and the product vanishes.`,
      deps: ['pma-10.13', 'pma-10.14'],
      verify: true,
      tags: ['differential forms', 'exterior product'],
      viz(v) {
        const n = 7;
        const state = [0, 2, 1, 2, 0, 1, 2, 0]; // index 1..7: 0 none, 1 in I, 2 in J, 3 both
        const S = v.stage({ x: [0, 8], y: [0, 4.2], height: 300, full: true, axes: false });
        S.onClick((x, y) => { if (y > 3.25 && y < 4.15) { const k = Math.round(x); if (k >= 1 && k <= n) state[k] = (state[k] + 1) % 4; } });
        let st = {};
        v.legend([['blue', '$I$'], ['orange', '$J$'], ['red', 'in both: product $=0$'], ['ink', 'crossings $=\\alpha$']]);
        v.render(() => {
          const I = [], Jx = [];
          for (let k = 1; k <= n; k++) { if (state[k] === 1 || state[k] === 3) I.push(k); if (state[k] === 2 || state[k] === 3) Jx.push(k); }
          // top strip
          for (let k = 1; k <= n; k++) {
            const col = ['faint', 'blue', 'orange', 'red'][state[k]];
            S.rect(k - 0.38, 3.3, k + 0.38, 4.1, { fill: col, fillAlpha: state[k] ? 0.3 : 0.08, color: col, width: 1.4 });
            S.text(String(k), k, 3.7, { align: 'center', size: 16, weight: 600, color: state[k] ? 'ink' : 'muted' });
          }
          S.text('click:', 0.15, 3.7, { color: 'muted', size: 11.5 });
          const list = I.map((k) => ({ k, s: 'I' })).concat(Jx.map((k) => ({ k, s: 'J' })));
          const m = list.length; if (!m) { st = { empty: true }; return; }
          const xs = (r) => 4 - (m - 1) * 0.5 + r;
          const sorted = list.map((o, r) => ({ ...o, r })).sort((a, b) => a.k - b.k || (a.s < b.s ? -1 : 1));
          const pos = new Array(m); sorted.forEach((o, q) => { pos[o.r] = q; });
          const dup = I.some((k) => Jx.includes(k));
          // strings (cubic curves) from row y=2.6 to y=0.7
          let alpha = 0;
          for (let r = 0; r < m; r++) for (let r2 = r + 1; r2 < m; r2++) if (list[r].s === 'I' && list[r2].s === 'J' && list[r].k > list[r2].k) alpha++;
          list.forEach((o, r) => {
            const x0 = xs(r), x1 = xs(pos[r]);
            const col = dup && Jx.includes(o.k) && I.includes(o.k) ? 'red' : o.s === 'I' ? 'blue' : 'orange';
            S.curve((t) => { const e = t * t * (3 - 2 * t); return [x0 + (x1 - x0) * e, 2.55 - 1.75 * t]; }, 0, 1, { color: col, width: 2.4, n: 40 });
          });
          list.forEach((o, r) => {
            const col = dup && I.includes(o.k) && Jx.includes(o.k) ? 'red' : o.s === 'I' ? 'blue' : 'orange';
            S.tex(`dx_{${o.k}}`, xs(r), 2.78, { color: col, size: 17 });
            if (r < m - 1) S.tex('\\wedge', xs(r) + 0.5, 2.78, { color: 'muted', size: 14 });
          });
          sorted.forEach((o, q) => {
            const col = dup && I.includes(o.k) && Jx.includes(o.k) ? 'red' : o.s === 'I' ? 'blue' : 'orange';
            S.tex(`dx_{${o.k}}`, xs(q), 0.55, { color: col, size: 17 });
            if (q < m - 1) S.tex('\\wedge', xs(q) + 0.5, 0.55, { color: 'muted', size: 14 });
          });
          S.text('as written', 0.15, 2.78, { color: 'muted', size: 11.5 });
          S.text('sorted', 0.15, 0.55, { color: 'muted', size: 11.5 });
          S.corner(dup ? 'repeated index: the product is 0' : `α = ${alpha} crossings, sign (−1)^α = ${alpha % 2 ? '−1' : '+1'}`, 'br', { color: dup ? 'red' : alpha % 2 ? 'orange' : 'green', weight: 600 });
          st = { I, J: Jx, alpha, dup, sorted: sorted.map((o) => o.k) };
        });
        v.readout(() => {
          const s = st; if (s.empty) return 'Choose some indices.';
          const d = (L) => (L.length ? `dx_{\\{${L.join(',')}\\}}` : '1');
          if (s.dup) return `$I=\\{${s.I.join(',')}\\}$ and $J=\\{${s.J.join(',')}\\}$ share an index, so $${d(s.I)}\\wedge ${d(s.J)}=0$.`;
          return `$${d(s.I)}\\wedge ${d(s.J)}=(-1)^{${s.alpha}}\\,${d(s.sorted)}=${s.alpha % 2 ? '-' : ''}dx_{${s.sorted.join('}\\wedge dx_{')}}$, where $\\alpha=\\#\\{(i,j)\\in I\\times J: i>j\\}=${s.alpha}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.17
    {
      num: '10.17',
      kind: 'Definition',
      name: 'Exterior product of forms',
      statement: String.raw`If $\omega=\sum_Ib_I(\mathbf x)\,dx_I$ is a $p$-form and $\lambda=\sum_Jc_J(\mathbf x)\,dx_J$ is a $q$-form in $E$ (standard presentations), their **product** is the $(p+q)$-form
$$\omega\wedge\lambda=\sum_{I,J}b_I(\mathbf x)\,c_J(\mathbf x)\,dx_I\wedge dx_J,$$
with $dx_I\wedge dx_J$ as in 10.16. The product is bilinear and associative, it satisfies $\lambda\wedge\omega=(-1)^{pq}\,\omega\wedge\lambda$, and for a $0$-form $f$ one sets $f\wedge\omega=\omega\wedge f=f\omega$.`,
      idea: String.raw`Everything reduces to products of basic forms (10.16). For two $1$-forms in $\R^2$, $(a_1dx+a_2dy)\wedge(c_1dx+c_2dy)=(a_1c_2-a_2c_1)\,dx\wedge dy$: the product of two covectors is their determinant. Picture each constant $1$-form by its level lines $\{\omega=\text{integer}\}$; the two families cut the plane into cells, each of area $1/|a_1c_2-a_2c_1|$, so $\int_\Phi\omega\wedge\lambda$ counts cells, with a sign recording orientation.`,
      caption: String.raw`Drag the tips of the covectors $\mathbf a$ (blue, $\omega=a_1dx+a_2dy$) and $\mathbf c$ (orange, $\lambda=c_1dx+c_2dy$). Their level lines $\omega\in\Z$ and $\lambda\in\Z$ tile the plane by cells. Drag the square $\Phi$ (and resize it): $\int_\Phi\omega\wedge\lambda=(a_1c_2-a_2c_1)\cdot\text{area}$ is close to the number of cells inside it (shaded). Make $\mathbf a$ and $\mathbf c$ parallel and the product vanishes; switch to $\lambda\wedge\omega$ and every cell changes sign.`,
      deps: ['pma-10.16', 'pma-10.14'],
      tags: ['differential forms', 'exterior product'],
      viz(v) {
        const M = v.M;
        const order = v.select('', [{ value: 'wl', label: '$\\omega\\wedge\\lambda$' }, { value: 'lw', label: '$\\lambda\\wedge\\omega$' }], 'wl');
        const side = v.slider('side of $\\Phi$', 0.5, 2.6, 1.6, { step: 0.01 });
        const S = v.stage({ x: [-2.6, 2.6], y: [-2.1, 2.1], equal: true, height: 380, full: true, axes: false });
        const O = [-2.0, -1.55]; // base point for the covector arrows (in a corner inset)
        const A = S.handle(O[0] + 1.4, O[1] + 0.5, { color: 'blue', label: 'a' });
        const C = S.handle(O[0] - 0.2, O[1] + 1.3, { color: 'orange', label: 'c' });
        const Q = S.handle(0.5, -0.2, { color: 'ink', r: 6, label: 'Φ', labelPos: 'se' });
        let st = {};
        v.legend([['blue', 'level lines $\\omega=a_1x+a_2y\\in\\Z$'], ['orange', 'level lines $\\lambda=c_1x+c_2y\\in\\Z$'], ['green', 'cells inside $\\Phi$, positive', { area: true }], ['red', 'cells inside $\\Phi$, negative', { area: true }]]);
        v.render(() => {
          const a = [A.x - O[0], A.y - O[1]], c = [C.x - O[0], C.y - O[1]];
          const det0 = a[0] * c[1] - a[1] * c[0], sgn = order.value === 'wl' ? 1 : -1, det = sgn * det0;
          const s = side.value, x0 = Q.x - s / 2, y0 = Q.y - s / 2;
          const inSq = (p) => p[0] > x0 && p[0] < x0 + s && p[1] > y0 && p[1] < y0 + s;
          // cells: preimages of unit squares under L(x) = (a·x, c·x)
          let count = 0;
          if (Math.abs(det0) > 1e-3) {
            const inv = [[c[1] / det0, -a[1] / det0], [-c[0] / det0, a[0] / det0]]; // L^{-1}
            const Linv = (m, k) => [inv[0][0] * m + inv[0][1] * k, inv[1][0] * m + inv[1][1] * k];
            const vals = [[-2.7, -2.2], [2.7, -2.2], [2.7, 2.2], [-2.7, 2.2]].map((p) => [a[0] * p[0] + a[1] * p[1], c[0] * p[0] + c[1] * p[1]]);
            const m0 = Math.floor(Math.min(...vals.map((z) => z[0]))) - 1, m1 = Math.ceil(Math.max(...vals.map((z) => z[0]))) + 1;
            const k0 = Math.floor(Math.min(...vals.map((z) => z[1]))) - 1, k1 = Math.ceil(Math.max(...vals.map((z) => z[1]))) + 1;
            if ((m1 - m0) * (k1 - k0) < 6000) for (let m = m0; m < m1; m++) for (let k = k0; k < k1; k++) {
              const cen = Linv(m + 0.5, k + 0.5);
              if (inSq(cen)) { count++; S.poly([Linv(m, k), Linv(m + 1, k), Linv(m + 1, k + 1), Linv(m, k + 1)], { fill: det > 0 ? 'green' : 'red', fillAlpha: 0.2, stroke: false }); }
            }
          }
          const lines = (w, col) => {
            const n2 = w[0] * w[0] + w[1] * w[1]; if (n2 < 1e-6) return;
            const t = [-w[1], w[0]];
            const span = Math.abs(w[0]) * 2.7 + Math.abs(w[1]) * 2.2;
            for (let m = Math.floor(-span); m <= Math.ceil(span); m++) { const p = [w[0] * m / n2, w[1] * m / n2]; S.line(p[0] - t[0] * 10, p[1] - t[1] * 10, p[0] + t[0] * 10, p[1] + t[1] * 10, { color: col, width: 1.2, alpha: 0.75 }); }
          };
          lines(a, 'blue'); lines(c, 'orange');
          S.rect(x0, y0, x0 + s, y0 + s, { color: 'ink', width: 2.4 });
          // orientation arrows on Φ (u1 then u2)
          S.arrow(x0, y0, x0 + s * 0.6, y0, { color: 'ink', width: 2.4, head: 9 });
          S.arrow(x0, y0, x0, y0 + s * 0.6, { color: 'ink', width: 2.4, head: 9 });
          // covector inset
          S.circle(O[0], O[1], 0.12, { fill: 'panel', fillAlpha: 0.9, stroke: false });
          S.arrow(O[0], O[1], A.x, A.y, { color: 'blue', width: 2.6, head: 10 });
          S.arrow(O[0], O[1], C.x, C.y, { color: 'orange', width: 2.6, head: 10 });
          S.dot(O[0], O[1], { color: 'ink', r: 3 });
          S.text('covectors a, c', O[0], O[1], { color: 'muted', size: 11, dy: 14, align: 'center' });
          const area = s * s;
          st = { a, c, det, area, count: count * Math.sign(det || 1), sgn };
        });
        v.readout(() => {
          const s = st, f = (x) => v.fix(x, 2);
          const lab = s.sgn > 0 ? '\\omega\\wedge\\lambda' : '\\lambda\\wedge\\omega';
          return `$\\mathbf a=(${f(s.a[0])},${f(s.a[1])}),\\ \\mathbf c=(${f(s.c[0])},${f(s.c[1])})$: $\\;${lab}=${v.fix(s.det, 3)}\\,dx\\wedge dy$. $\\quad\\int_\\Phi${lab}=${v.fix(s.det, 3)}\\times${v.fix(s.area, 3)}=${v.fix(s.det * s.area, 2)}$; signed count of cells inside $\\Phi$: $${s.count}$.`;
        });
      },
    },
  ],
};
