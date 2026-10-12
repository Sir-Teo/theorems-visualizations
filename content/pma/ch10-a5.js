// Rudin, Principles of Mathematical Analysis — Chapter 10 (part 5: 10.22–10.24)
// Pullbacks: compatibility with sums, products and d; composition; integrals over surfaces.

function divRGB(v, pos = 'blue', neg = 'red', gain = 0.8) {
  const P = v.rgb('panel'), A = v.rgb(pos), B = v.rgb(neg);
  return (t) => {
    if (!isFinite(t)) return null;
    const w = Math.pow(Math.min(1, Math.abs(t)), 0.75) * gain, C = t >= 0 ? A : B;
    return [P[0] + (C[0] - P[0]) * w, P[1] + (C[1] - P[1]) * w, P[2] + (C[2] - P[2]) * w];
  };
}
const themeKey = (v) => v.color('panel') + v.color('blue');
/** Raster of level lines {f = k·step} for each entry {f, step, color}; about 1 px wide. */
function levelLines(v, S, list, key, id = 'lv') {
  const cols = list.map((L) => v.rgb(L.color));
  S.raster((x, y) => {
    const px = (S.bounds.x[1] - S.bounds.x[0]) / S.width;
    for (let k = 0; k < list.length; k++) {
      const { f, step } = list[k], z = f(x, y);
      if (!isFinite(z)) continue;
      const gx = (f(x + px, y) - z) / px, gy = (f(x, y + px) - z) / px, g = Math.hypot(gx, gy) / step * px;
      const d = Math.abs(z / step - Math.round(z / step));
      if (d < 0.6 * g) return [cols[k][0], cols[k][1], cols[k][2], list[k].alpha ?? 225];
    }
    return null;
  }, { key: key + themeKey(v), res: 1, id });
}
const H = 1e-5;
/** Jacobian matrix of F: R^2 -> R^2 at (x, y), by central differences. */
function jac(F, x, y, h = H) {
  const a = F(x + h, y), b = F(x - h, y), c = F(x, y + h), d = F(x, y - h);
  return [[(a[0] - b[0]) / (2 * h), (c[0] - d[0]) / (2 * h)], [(a[1] - b[1]) / (2 * h), (c[1] - d[1]) / (2 * h)]];
}
const rowTimes = (r, J) => [r[0] * J[0][0] + r[1] * J[1][0], r[0] * J[0][1] + r[1] * J[1][1]];
const matVec = (J, w) => [J[0][0] * w[0] + J[0][1] * w[1], J[1][0] * w[0] + J[1][1] * w[1]];
const fmtMat = (v, J, d = 3) => `\\begin{pmatrix}${v.fix(J[0][0], d)}&${v.fix(J[0][1], d)}\\\\ ${v.fix(J[1][0], d)}&${v.fix(J[1][1], d)}\\end{pmatrix}`;

export default {
  book: 'pma',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.22
    {
      num: '10.22',
      kind: 'Theorem',
      name: 'Pullbacks respect sums, products and d',
      statement: String.raw`Let $E$, $V$ and $T$ be as in 10.21, and let $\omega$ and $\lambda$ be a $k$-form and an $m$-form in $V$. Then
(a) $(\omega+\lambda)_T=\omega_T+\lambda_T$ when $k=m$;
(b) $(\omega\wedge\lambda)_T=\omega_T\wedge\lambda_T$;
(c) $d(\omega_T)=(d\omega)_T$ when $\omega$ is of class $\mathscr C'$ and $T$ is of class $\mathscr C''$.`,
      idea: String.raw`(a) and (b) are bookkeeping: both sides substitute $\mathbf y=T(\mathbf x)$ in the coefficients and replace $dy_i$ by $dt_i$, and the wedge product is computed by the same sign rules (10.16) before or after the substitution. For (c), first a $0$-form: $(df)_T=\sum_i(D_if)(T\mathbf x)\,dt_i=\sum_j D_j(f\circ T)\,dx_j=d(f_T)$ by the chain rule (9.15). Then for $\omega=f\,dy_I$: $\omega_T=f_T\,dt_I$, and $d(dt_i)=0$ by 10.20(b) because each $t_i$ is $\mathscr C''$; the product rule (10.20(a)) gives $d(\omega_T)=d(f_T)\wedge dt_I=(df)_T\wedge(dy_I)_T=(d\omega)_T$ by (b).`,
      caption: String.raw`The four panels form a commutative square: top row in $V$, bottom row in $E$; left column the forms, right column the result. In (c) the top-right heat map is $d\omega$; the bottom-right heat map is $d(\omega_T)$, computed by numerically differentiating the pulled-back coefficients, and the thin contour lines are those of $(d\omega)_T=(d\omega)(T\mathbf x)\,J_T(\mathbf x)$ — they follow the colour bands exactly. In (b) the right column is the $2$-form $\omega\wedge\lambda$ instead. Drag $\mathbf p$ in the lower left.`,
      deps: ['pma-10.21', 'pma-10.20', 'pma-10.17', 'pma-9.15'],
      tags: ['pullback', 'exterior derivative'],
      viz(v) {
        const M = v.M;
        const T = (x, y) => [x + 0.25 * y * y, y + 0.3 * Math.sin(1.5 * x)];
        const JT = (x, y) => [[1, 0.5 * y], [0.45 * Math.cos(1.5 * x), 1]];
        const det = (J) => J[0][0] * J[1][1] - J[0][1] * J[1][0];
        // forms on V
        const om = (y) => [0.6 * Math.sin(1.3 * y[1]) + 0.2 * y[0], 0.5 * y[0] * y[1] - 0.3 * Math.cos(y[0])];
        const la = (y) => [0.8 - 0.3 * y[1], 0.4 * y[0] + 0.3];
        const dOm = (y) => (om([y[0] + H, y[1]])[1] - om([y[0] - H, y[1]])[1]) / (2 * H) - (om([y[0], y[1] + H])[0] - om([y[0], y[1] - H])[0]) / (2 * H);
        const wedge = (a, b) => a[0] * b[1] - a[1] * b[0];
        const pull = (F) => (x, y) => rowTimes(F(T(x, y)), JT(x, y));
        const omT = pull(om), laT = pull(la);
        const dOmT = (x, y) => (omT(x + 1e-4, y)[1] - omT(x - 1e-4, y)[1]) / 2e-4 - (omT(x, y + 1e-4)[0] - omT(x, y - 1e-4)[0]) / 2e-4;
        const mode = v.select('', [{ value: 'c', label: '(c) $d(\\omega_T)=(d\\omega)_T$' }, { value: 'b', label: '(b) $(\\omega\\wedge\\lambda)_T=\\omega_T\\wedge\\lambda_T$' }], 'c');
        const ST = [0, 1, 2, 3].map(() => v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, height: 240, minWidth: 360, title: 'x' }));
        const [TL, TR, BL, BR] = ST;
        const p = BL.handle(0.4, -0.3, { color: 'gold', label: 'p' });
        const E0 = [[-1.4, -1.4], [1.4, -1.4], [1.4, 1.4], [-1.4, 1.4]];
        const bdV = []; for (let k = 0; k < 4; k++) for (let t = 0; t < 1; t += 0.02) { const a = M.vlerp(E0[k], E0[(k + 1) % 4], t); bdV.push(T(a[0], a[1])); }
        let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity]; for (const q of bdV) { lo = [Math.min(lo[0], q[0]), Math.min(lo[1], q[1])]; hi = [Math.max(hi[0], q[0]), Math.max(hi[1], q[1])]; }
        TL.setView([lo[0] - 0.1, hi[0] + 0.1], [lo[1] - 0.1, hi[1] + 0.1]); TR.setView([lo[0] - 0.1, hi[0] + 0.1], [lo[1] - 0.1, hi[1] + 0.1]);
        const inE = (x, y) => Math.abs(x) <= 1.4 && Math.abs(y) <= 1.4;
        const inV = (x, y) => M.pointInPoly([x, y], bdV);
        let st = {}, errC = null, errB = null;
        v.render(() => {
          const m = mode.value, col = divRGB(v, 'blue', 'red', 0.62);
          const q = T(p.x, p.y);
          if (m === 'c') {
            TL.setTitle('$\\omega$ on $V$'); TR.setTitle('$d\\omega$ on $V$'); BL.setTitle('$\\omega_T$ on $E$'); BR.setTitle('$d(\\omega_T)$ (colour), $(d\\omega)_T$ (contours)');
            TL.field((x, y) => (inV(x, y) ? om([x, y]) : [0, 0]), { spacing: 30, color: 'blue', alpha: 0.8 });
            TR.raster((x, y) => (inV(x, y) ? col(dOm([x, y]) / 1.6) : null), { key: 'c' + themeKey(v), res: 2 });
            BL.field((x, y) => (inE(x, y) ? omT(x, y) : [0, 0]), { spacing: 30, color: 'blue', alpha: 0.8 });
            BR.raster((x, y) => (inE(x, y) ? col(dOmT(x, y) / 1.6) : null), { key: 'c' + themeKey(v), res: 2 });
            levelLines(v, BR, [{ f: (x, y) => (inE(x, y) ? dOm(T(x, y)) * det(JT(x, y)) : NaN), step: 0.25, color: 'ink', alpha: 190 }], 'c');
            if (errC == null) { errC = 0; for (const x of M.linspace(-1.35, 1.35, 21)) for (const y of M.linspace(-1.35, 1.35, 21)) errC = Math.max(errC, Math.abs(dOmT(x, y) - dOm(T(x, y)) * det(JT(x, y)))); }
            st = { m, a: dOmT(p.x, p.y), b: dOm(q) * det(JT(p.x, p.y)), c: dOm(q), J: det(JT(p.x, p.y)), err: errC };
            v.legend([['blue', 'coefficient field of the $1$-form'], ['blue', 'coefficient of the $2$-form $>0$', { area: true }], ['red', '$<0$', { area: true }], ['ink', 'contours of $(d\\omega)_T$']]);
          } else {
            TL.setTitle('$\\omega$ (blue) and $\\lambda$ (orange) on $V$'); TR.setTitle('$\\omega\\wedge\\lambda$ on $V$'); BL.setTitle('$\\omega_T$ and $\\lambda_T$ on $E$'); BR.setTitle('$\\omega_T\\wedge\\lambda_T$ (colour), $(\\omega\\wedge\\lambda)_T$ (contours)');
            TL.field((x, y) => (inV(x, y) ? om([x, y]) : [0, 0]), { spacing: 34, color: 'blue', alpha: 0.8 });
            TL.field((x, y) => (inV(x, y) ? la([x, y]) : [0, 0]), { spacing: 34, color: 'orange', alpha: 0.8 });
            TR.raster((x, y) => (inV(x, y) ? col(wedge(om([x, y]), la([x, y])) / 1.2) : null), { key: 'b' + themeKey(v), res: 2 });
            BL.field((x, y) => (inE(x, y) ? omT(x, y) : [0, 0]), { spacing: 34, color: 'blue', alpha: 0.8 });
            BL.field((x, y) => (inE(x, y) ? laT(x, y) : [0, 0]), { spacing: 34, color: 'orange', alpha: 0.8 });
            BR.raster((x, y) => (inE(x, y) ? col(wedge(omT(x, y), laT(x, y)) / 1.2) : null), { key: 'b' + themeKey(v), res: 2 });
            levelLines(v, BR, [{ f: (x, y) => (inE(x, y) ? wedge(om(T(x, y)), la(T(x, y))) * det(JT(x, y)) : NaN), step: 0.2, color: 'ink', alpha: 190 }], 'b');
            if (errB == null) { errB = 0; for (const x of M.linspace(-1.35, 1.35, 21)) for (const y of M.linspace(-1.35, 1.35, 21)) errB = Math.max(errB, Math.abs(wedge(omT(x, y), laT(x, y)) - wedge(om(T(x, y)), la(T(x, y))) * det(JT(x, y)))); }
            st = { m, a: wedge(omT(p.x, p.y), laT(p.x, p.y)), b: wedge(om(q), la(q)) * det(JT(p.x, p.y)), c: wedge(om(q), la(q)), J: det(JT(p.x, p.y)), err: errB };
            v.legend([['blue', '$\\omega$, $\\omega_T$'], ['orange', '$\\lambda$, $\\lambda_T$'], ['blue', 'coefficient $>0$', { area: true }], ['red', '$<0$', { area: true }], ['ink', 'contours of $(\\omega\\wedge\\lambda)_T$']]);
          }
          TL.poly(bdV, { color: 'ink', width: 1.4 }); TR.poly(bdV, { color: 'ink', width: 1.4 });
          BL.rect(-1.4, -1.4, 1.4, 1.4, { color: 'ink', width: 1.4 }); BR.rect(-1.4, -1.4, 1.4, 1.4, { color: 'ink', width: 1.4 });
          for (const S of [TL, TR]) S.dot(q[0], q[1], { color: 'gold', r: 5, label: 'Tp' });
          BR.dot(p.x, p.y, { color: 'gold', r: 5, label: 'p' });
          BR.corner(`max |difference| = ${st.err.toExponential(1)}`, 'bl', { color: 'green', weight: 600, size: 11 });
        });
        v.readout(() => {
          const s = st, F = (x) => v.fix(x, 5);
          if (s.m === 'c') return `At $\\mathbf p$: $\\;d(\\omega_T)=${F(s.a)}\\,dx_1\\wedge dx_2$, $\\;(d\\omega)_T=(d\\omega)(T\\mathbf p)\\,J_T(\\mathbf p)=${F(s.c)}\\times${F(s.J)}=${F(s.b)}$ (coefficients of $dx_1\\wedge dx_2$).`;
          return `At $\\mathbf p$: $\\;\\omega_T\\wedge\\lambda_T=${F(s.a)}\\,dx_1\\wedge dx_2$, $\\;(\\omega\\wedge\\lambda)_T=${F(s.c)}\\times J_T(\\mathbf p)=${F(s.c)}\\times${F(s.J)}=${F(s.b)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.23
    {
      num: '10.23',
      kind: 'Theorem',
      name: 'Pulling back in stages',
      statement: String.raw`Let $T$ be a $\mathscr C'$-mapping of an open $E\subset\R^n$ into an open $V\subset\R^m$, let $S$ be a $\mathscr C'$-mapping of $V$ into an open $W\subset\R^p$, and let $\omega$ be a $k$-form in $W$. Then $\omega_S$ is a $k$-form in $V$, both $(\omega_S)_T$ and $\omega_{ST}$ are $k$-forms in $E$ (where $(ST)(\mathbf x)=S(T(\mathbf x))$), and
$$(\omega_S)_T=\omega_{ST}.$$`,
      idea: String.raw`By 10.22(a),(b) it suffices to treat $0$-forms and the $1$-forms $dz_i$. For a $0$-form, both sides are $f\circ S\circ T$. For $dz_i$: $(dz_i)_S=ds_i=\sum_r(D_rs_i)\,dy_r$, and pulling back by $T$ gives $\sum_{r,j}(D_rs_i)(T\mathbf x)(D_jt_r)(\mathbf x)\,dx_j$, which by the chain rule (9.15) is $\sum_jD_j(s_i\circ T)\,dx_j=(dz_i)_{ST}$. At a point this is just associativity of the matrix product $\mathbf c\,S'(T\mathbf x)\,T'(\mathbf x)=\mathbf c\,(ST)'(\mathbf x)$.`,
      caption: String.raw`Three planes $E\xrightarrow{T}V\xrightarrow{S}W$. In $W$ the coordinate lines are straight; in $V$ and $E$ the same lines are pulled back to level curves. The green covector $\omega(ST\mathbf p)$ is pulled back to $V$, then to $E$ (solid green); the dashed purple covector is $\omega_{ST}(\mathbf p)$, computed in one step from the Jacobian of the composite map — they coincide. Drag $\mathbf p$ and the tip of the gold vector $\mathbf w$: the readout shows that all three pairings agree.`,
      deps: ['pma-10.22', 'pma-10.21', 'pma-9.15'],
      tags: ['pullback', 'chain rule'],
      viz(v) {
        const M = v.M;
        const T = (x, y) => [x + 0.3 * y * y - 0.1, y + 0.3 * Math.sin(1.4 * x)];
        const S = (x, y) => [x + 0.25 * Math.sin(1.8 * y), y - 0.2 * x * x + 0.1];
        const STm = (x, y) => S(...T(x, y));
        const om = (z) => [z[1] + 0.2, 1 + 0.3 * z[0]];
        const which = v.select('$\\omega$', [{ value: 'gen', label: '$(z_2+0.2)\\,dz_1+(1+0.3z_1)\\,dz_2$' }, { value: 'dz1', label: '$dz_1$' }], 'gen');
        const PE = v.stage({ x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, height: 290, minWidth: 250, title: '$E$: $(\\omega_S)_T$ and $\\omega_{ST}$' });
        const PV = v.stage({ x: [-1.6, 1.9], y: [-1.6, 1.9], equal: true, height: 290, minWidth: 250, title: '$V$: $\\omega_S$' });
        const PW = v.stage({ x: [-1.8, 1.9], y: [-1.9, 1.8], equal: true, height: 290, minWidth: 250, title: '$W$: $\\omega$' });
        const p = PE.handle(0.3, 0.2, { color: 'ink', label: 'p', labelPos: 'sw' });
        const wt = PE.handle(0.85, 0.55, { color: 'gold', r: 6 });
        let prev = [p.x, p.y];
        p.onDrag = () => { wt.x += p.x - prev[0]; wt.y += p.y - prev[1]; prev = [p.x, p.y]; };
        let st = {};
        v.legend([['blue', 'lines $z_1=$ const and their pullbacks'], ['orange', 'lines $z_2=$ const and their pullbacks'], ['green', '$\\omega$, $\\omega_S$, $(\\omega_S)_T$'], ['purple', '$\\omega_{ST}$ in one step', { dash: true }], ['gold', '$\\mathbf w$ and its images']]);
        v.render(() => {
          prev = [p.x, p.y];
          const o = which.value === 'gen' ? om : () => [1, 0];
          levelLines(v, PE, [{ f: (x, y) => STm(x, y)[0], step: 0.3, color: 'blue' }, { f: (x, y) => STm(x, y)[1], step: 0.3, color: 'orange' }], 'E', 'E');
          levelLines(v, PV, [{ f: (x, y) => S(x, y)[0], step: 0.3, color: 'blue' }, { f: (x, y) => S(x, y)[1], step: 0.3, color: 'orange' }], 'V', 'V');
          for (let k = -10; k <= 10; k++) { PW.vline(k * 0.3, { color: 'blue', width: 1, alpha: 0.8 }); PW.hline(k * 0.3, { color: 'orange', width: 1, alpha: 0.8 }); }
          const q = T(p.x, p.y), r = S(...q);
          const JTp = jac(T, p.x, p.y), JSq = jac(S, q[0], q[1]), JSTp = jac(STm, p.x, p.y);
          const c = o(r), cS = rowTimes(c, JSq), cST2 = rowTimes(cS, JTp), cST1 = rowTimes(c, JSTp);
          const w = [wt.x - p.x, wt.y - p.y], w1 = matVec(JTp, w), w2 = matVec(JSq, w1);
          const sc = 0.4;
          const arrow = (P, at, vec, opt) => P.arrow(at[0], at[1], at[0] + vec[0] * sc, at[1] + vec[1] * sc, opt);
          arrow(PW, r, c, { color: 'green', width: 3, head: 10 });
          PW.arrow(r[0], r[1], r[0] + w2[0], r[1] + w2[1], { color: 'gold', width: 2.4, head: 9 });
          PW.dot(r[0], r[1], { color: 'ink', r: 5, label: 'STp', labelPos: 'sw' });
          arrow(PV, q, cS, { color: 'green', width: 3, head: 10 });
          PV.arrow(q[0], q[1], q[0] + w1[0], q[1] + w1[1], { color: 'gold', width: 2.4, head: 9 });
          PV.dot(q[0], q[1], { color: 'ink', r: 5, label: 'Tp', labelPos: 'sw' });
          arrow(PE, [p.x, p.y], cST2, { color: 'green', width: 4, head: 11 });
          arrow(PE, [p.x, p.y], cST1, { color: 'purple', width: 2, head: 9, dash: [5, 4] });
          PE.arrow(p.x, p.y, wt.x, wt.y, { color: 'gold', width: 2.4, head: 9 });
          st = { JTp, JSq, JSTp, c, cS, cST1, cST2, val: [c[0] * w2[0] + c[1] * w2[1], cS[0] * w1[0] + cS[1] * w1[1], cST2[0] * w[0] + cST2[1] * w[1]] };
        });
        v.readout(() => {
          const s = st, f = (x) => v.fix(x, 3);
          return `$S'(T\\mathbf p)\\,T'(\\mathbf p)=${fmtMat(v, s.JSq)}${fmtMat(v, s.JTp)}=${fmtMat(v, M.matMul(s.JSq, s.JTp))}$, $\\;(ST)'(\\mathbf p)=${fmtMat(v, s.JSTp)}$. $\\quad(\\omega_S)_T(\\mathbf p)=(${f(s.cST2[0])},${f(s.cST2[1])})$, $\\;\\omega_{ST}(\\mathbf p)=(${f(s.cST1[0])},${f(s.cST1[1])})$. $\\;$ Pairings with $\\mathbf w$ in $W$, $V$, $E$: $${s.val.map((z) => v.fix(z, 4)).join('=')}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 10.24
    {
      num: '10.24',
      kind: 'Theorem',
      name: 'Integrating a form by pulling it back to the parameter domain',
      statement: String.raw`Let $\omega$ be a $k$-form in an open set $E\subset\R^n$, let $\Phi$ be a $k$-surface in $E$ with parameter domain $D\subset\R^k$, and let $\Delta$ be the $k$-surface in $\R^k$ with the same parameter domain given by $\Delta(\mathbf u)=\mathbf u$. Then
$$\int_\Phi\omega=\int_\Delta\omega_\Phi .$$`,
      idea: String.raw`It suffices to take $\omega=a(\mathbf x)\,dx_{i_1}\wedge\cdots\wedge dx_{i_k}$. Then $\omega_\Phi=a(\Phi(\mathbf u))\,d\phi_{i_1}\wedge\cdots\wedge d\phi_{i_k}$, and expanding each $d\phi_{i_r}=\sum_j(D_j\phi_{i_r})\,du_j$ with the sign rules of 10.13/10.16 collapses the product to $\det\big[D_j\phi_{i_r}(\mathbf u)\big]\,du_1\wedge\cdots\wedge du_k$ — exactly the Jacobian $\partial(x_{i_1},\dots,x_{i_k})/\partial(u_1,\dots,u_k)$ in the definition 10.11. Since $\Delta$ has Jacobian $1$, $\int_\Delta\omega_\Phi$ is the integral over $D$ of that same function.`,
      caption: String.raw`Right: a $2$-surface $\Phi$ in $\R^3$ (drag to rotate) coloured by the integrand. Left: the parameter domain $D=[0,1]^2$, i.e. the identity surface $\Delta$, shaded by the coefficient $c(\mathbf u)$ of $\omega_\Phi=c(\mathbf u)\,du_1\wedge du_2$, which is computed by expanding $d\phi_i\wedge d\phi_j$ symbolically. At $\Phi(\mathbf u)$ the purple arrow is $D_1\Phi\times D_2\Phi$ and the green arrow is the vector field that corresponds to $\omega$; $c(\mathbf u)$ is their dot product. The readout compares $\int_\Phi\omega$ (from Definition 10.11, using Jacobian minors) with $\int_\Delta\omega_\Phi$.`,
      deps: ['pma-10.21', 'pma-10.11', 'pma-10.16', 'pma-9.33'],
      see: ['pma-10.25'],
      tags: ['pullback', 'surface integrals'],
      viz(v) {
        const M = v.M, PI = Math.PI;
        // forms as standard presentations: b12 dx1∧dx2 + b13 dx1∧dx3 + b23 dx2∧dx3
        const FORMS = {
          zdxdy: { label: '$z\\,dx\\wedge dy$', b: (x) => ({ 12: x[2], 13: 0, 23: 0 }) },
          pos: { label: '$x\\,dy\\wedge dz+y\\,dz\\wedge dx+z\\,dx\\wedge dy$', b: (x) => ({ 12: x[2], 13: -x[1], 23: x[0] }) },
          dxdy: { label: '$dx\\wedge dy$', b: () => ({ 12: 1, 13: 0, 23: 0 }) },
        };
        const SURF = {
          hemi: { label: 'hemisphere', P: (u, w) => [Math.sin(PI * u / 2) * Math.cos(2 * PI * w), Math.sin(PI * u / 2) * Math.sin(2 * PI * w), Math.cos(PI * u / 2)] },
          saddle: { label: 'saddle', P: (u, w) => { const x = 2 * u - 1, y = 2 * w - 1; return [x, y, 0.5 * (x * x - y * y) + 0.3]; } },
          helicoid: { label: 'helicoid', P: (u, w) => { const r = 0.2 + 0.9 * u, t = 3 * w; return [r * Math.cos(t), r * Math.sin(t), 0.45 * t - 0.6]; } },
        };
        const fw = v.select('$\\omega$', Object.entries(FORMS).map(([value, o]) => ({ value, label: o.label })), 'zdxdy');
        const sw = v.select('$\\Phi$', Object.entries(SURF).map(([value, o]) => ({ value, label: o.label })), 'saddle');
        const L = v.stage({ x: [-0.08, 1.08], y: [-0.08, 1.08], equal: true, height: 330, minWidth: 250, axes: 'box', xlabel: 'u₁', title: '$\\Delta(D)=D$ in the $(u_1,u_2)$-plane, shaded by $c(\\mathbf u)$' });
        const S = v.stage3d({ range: 1.5, height: 330, yaw: -0.7, pitch: 0.45, weight: 1.35, title: '$\\Phi(D)$ coloured by the integrand' });
        const u = L.handle(0.3, 0.62, { color: 'gold', label: 'u', constrain: { x: [0, 1], y: [0, 1] } });
        const PAIRS = [[0, 1, 12], [0, 2, 13], [1, 2, 23]];
        // Jacobian columns of Φ at u
        const dPhi = (P, a, b) => { const h = 1e-5; const A = P(a + h, b), B = P(a - h, b), C = P(a, b + h), D = P(a, b - h); return [0, 1, 2].map((i) => [(A[i] - B[i]) / (2 * h), (C[i] - D[i]) / (2 * h)]); };
        // Definition 10.11: sum of b_I(Φ(u)) times the Jacobian minors
        const integrandDef = (P, Bf, a, b) => { const J = dPhi(P, a, b), bb = Bf(P(a, b)); return PAIRS.reduce((s, [i, j, k]) => s + bb[k] * (J[i][0] * J[j][1] - J[i][1] * J[j][0]), 0); };
        // Pullback: expand dφ_i ∧ dφ_j = (Σ_r J[i][r] du_r) ∧ (Σ_s J[j][s] du_s) using du_r∧du_r = 0, du_2∧du_1 = −du_1∧du_2
        const wedge1 = (a, b) => { let c = 0; for (let r = 0; r < 2; r++) for (let s = 0; s < 2; s++) { if (r === s) continue; c += a[r] * b[s] * (r < s ? 1 : -1); } return c; };
        const coefPull = (P, Bf, a, b) => { const J = dPhi(P, a, b), bb = Bf(P(a, b)); return PAIRS.reduce((s, [i, j, k]) => s + bb[k] * wedge1(J[i], J[j]), 0); };
        const vecField = (Bf, x) => { const bb = Bf(x); return [bb[23], -bb[13], bb[12]]; }; // the flux form of (F1,F2,F3) has b23 = F1, b13 = −F2, b12 = F3
        let cache = {}, st = {};
        v.legend([['blue', 'integrand $>0$', { area: true }], ['red', 'integrand $<0$', { area: true }], ['purple', '$D_1\\Phi\\times D_2\\Phi$'], ['green', 'field of $\\omega$']]);
        v.render(() => {
          const P = SURF[sw.value].P, Bf = FORMS[fw.value].b, key = sw.value + fw.value;
          if (!cache[key]) {
            let mx = 1e-9; for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) mx = Math.max(mx, Math.abs(coefPull(P, Bf, i / 20, j / 20)));
            const I1 = M.integrate((a) => M.integrate((b) => integrandDef(P, Bf, a, b), 0, 1, 60), 0, 1, 60);
            const I2 = M.integrate((a) => M.integrate((b) => coefPull(P, Bf, a, b), 0, 1, 60), 0, 1, 60);
            cache[key] = { mx, I1, I2 };
          }
          const { mx, I1, I2 } = cache[key];
          const col = divRGB(v, 'blue', 'red', 0.75);
          L.raster((a, b) => (a < 0 || a > 1 || b < 0 || b > 1 ? null : col(coefPull(P, Bf, a, b) / mx)), { key: key + themeKey(v), res: 2 });
          L.rect(0, 0, 1, 1, { color: 'ink', width: 1.6 });
          L.axes();
          S.surface(P, [0, 1], [0, 1], { nu: 24, nv: 24, alpha: 0.8, wire: true, colorFn: (a, b) => col(coefPull(P, Bf, a + 1 / 48, b + 1 / 48) / mx) });
          const x = P(u.x, u.y), J = dPhi(P, u.x, u.y);
          const N = M.cross3([J[0][0], J[1][0], J[2][0]], [J[0][1], J[1][1], J[2][1]]), F = vecField(Bf, x);
          const nN = Math.max(1e-9, M.norm(N));
          S.arrow(x, M.vadd(x, M.vscale(N, 0.62 / nN)), { color: 'purple', width: 4, head: 10, bias: -0.4 });
          S.arrow(x, M.vadd(x, M.vscale(F, 0.8)), { color: 'green', width: 2.6, head: 9, bias: -0.5 });
          S.dot(x, { color: 'gold', r: 6, label: 'Φ(u)', bias: -0.6 });
          st = { c: coefPull(P, Bf, u.x, u.y), d: integrandDef(P, Bf, u.x, u.y), I1, I2, N, F, key };
        });
        v.readout(() => {
          const s = st, f = (z) => v.fix(z, 4);
          let extra = '';
          if (s.key === 'hemipos') extra = ' (for the unit hemisphere the field is the unit normal, so this is its area $2\\pi\\approx6.2832$)';
          return `At $\\mathbf u$: $\\;c(\\mathbf u)=${f(s.c)}$ (pullback), $\\;\\sum_Ib_I(\\Phi(\\mathbf u))\\frac{\\partial x_I}{\\partial\\mathbf u}=${f(s.d)}$ (definition). $\\quad\\int_\\Phi\\omega=${f(s.I1)}$, $\\;\\int_\\Delta\\omega_\\Phi=${f(s.I2)}$${extra}.`;
        });
      },
    },
  ],
};
