// Manifolds & Riemannian Geometry — Chapter 2: Tangent spaces and bundles (items 2.7–2.11; 2.1–2.6 in ch02.js)
import {
  PI, TAU, clamp, wrap, minus, dot3, cross3, add3, sub3, sc3, nrm3, sph, eastAt, northAt,
  stN, stS, stNinv, stSinv, det2, mul22, mulv, inv22, jac, pmat, pvec, gridImage, imageView,
} from './ch02.shared.js';

const PAL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink'];
/** Numerical differential of F: R^m -> R^n in direction d at u. */
const dirDeriv = (F, u, d, h = 1e-6) => { const a = F(u.map((c, i) => c + h * d[i])), b = F(u.map((c, i) => c - h * d[i])); return a.map((c, i) => (c - b[i]) / (2 * h)); };

// ---- 2.8: maps with a critical set, and local inverses by continuation along rays
const IFT = {
  sq: { label: '$z\\mapsto z^2/2$', F: (x, y) => [(x * x - y * y) / 2, x * y], crit: () => [0, 0], tr: [0, 0], det: (x, y) => x * x + y * y, p0: [1.2, 0.6] },
  fold: { label: 'fold $(x,\\,y^2-x)$', F: (x, y) => [x, y * y - x], crit: (t) => [t, 0], tr: [-2.2, 2.2], det: (x, y) => 2 * y, p0: [0.4, 0.9] },
  cusp: { label: 'cusp $(x,\\,y^3-xy)$', F: (x, y) => [x, y * y * y - x * y], crit: (t) => [3 * t * t, t], tr: [-1.3, 1.3], det: (x, y) => 3 * y * y - x, p0: [0.2, 0.9] },
};
function rayInverse(F, p, q0, ang, rho, steps) {
  const d = [Math.cos(ang), Math.sin(ang)]; let x = [...p]; const pts = [[...x]];
  for (let k = 1; k <= steps; k++) {
    const t = (rho * k) / steps, tg = [q0[0] + t * d[0], q0[1] + t * d[1]], x0 = [...x]; let ok = false;
    for (let it = 0; it < 30; it++) {
      const f = F(x[0], x[1]), r = [f[0] - tg[0], f[1] - tg[1]];
      if (Math.hypot(r[0], r[1]) < 1e-11) { ok = true; break; }
      const J = jac(F, x[0], x[1]);
      if (Math.abs(det2(J)) < 1e-9) break;
      const dx = mulv(inv22(J), r), nn = Math.hypot(dx[0], dx[1]), s = nn > 0.3 ? 0.3 / nn : 1;
      x = [x[0] - s * dx[0], x[1] - s * dx[1]];
    }
    if (!ok || !Number.isFinite(x[0]) || Math.hypot(x[0] - x0[0], x[1] - x0[1]) > 0.35) return { pts, fail: true };
    pts.push([...x]);
  }
  return { pts, fail: false };
}
function rhoStar(F, p) {
  const q0 = F(p[0], p[1]), ok = (rho) => { for (let j = 0; j < 16; j++) if (rayInverse(F, p, q0, (TAU * j) / 16, rho, 40).fail) return false; return true; };
  if (!ok(0.02)) return 0;
  let a = 0.02, b = 3.5;
  if (ok(b)) return b;
  for (let i = 0; i < 12; i++) { const m = (a + b) / 2; if (ok(m)) a = m; else b = m; }
  return a;
}

// ---- 2.11: vector fields on S^2 and their zeros
const fib = (n) => Array.from({ length: n }, (_, i) => { const z = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - z * z), a = i * 2.399963229728653; return [r * Math.cos(a), r * Math.sin(a), z]; });
const SEEDS = fib(260);
function frameAt(p) { const a = Math.abs(p[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]; const e1 = nrm3(cross3(a, p)); return [e1, cross3(p, e1)]; }

export default {
  collection: 'mfd',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Definition',
      name: 'The tangent bundle',
      statement: String.raw`The **tangent bundle** of a smooth $n$-manifold $M$ is the disjoint union $TM=\bigsqcup_{p\in M}T_pM$ with the projection $\pi\colon TM\to M$. It carries a unique topology and smooth structure of dimension $2n$ for which every chart $(U,\varphi=(x^i))$ of $M$ gives a chart
$$\widetilde\varphi\colon\pi^{-1}(U)\to\varphi(U)\times\R^n,\qquad \sum_i v^i\,\partial_i|_p\ \longmapsto\ (x^1(p),\dots,x^n(p),v^1,\dots,v^n),$$
and $\pi$ is smooth. Over $U$ the bundle is a product, $\pi^{-1}(U)\cong U\times\R^n$ (a **local trivialization**), and two such charts are related by $(x,v)\mapsto(\tilde\varphi\varphi^{-1}(x),\ D(\tilde\varphi\varphi^{-1})_x\,v)$.`,
      idea: String.raw`The set $TM$ has no topology until we give it one; the atlas $\{\widetilde\varphi\}$ supplies it, once we check that the transition maps between the induced charts are smooth. They are: by 2.6 the base coordinates change by the transition map of $M$, which is smooth, and the fibre coordinates change by its Jacobian matrix, whose entries are smooth functions of $x$. So the new charts are compatible and $TM$ is a smooth $2n$-manifold, and in these coordinates $\pi$ is $(x,v)\mapsto x$, visibly smooth. The circle's tangent bundle is a cylinder $S^1\times\R$; for $S^2$ there is no global splitting, but over each stereographic chart the bundle is a product.`,
      caption: String.raw`**$S^1$**: drag the point $(\theta,s)$ of the strip (the unrolled $TS^1$); it is the tangent vector $s\,\partial_\theta$ drawn on the circle, and a point of the cylinder on the right. **$S^2$**: drag the base point $u$ and the tip of the vector in the stereographic chart $N$ — that is the chart $\widetilde\varphi_N$ of $TS^2$; the same tangent vector in chart $S$ is $(\psi(u),D\psi_u v)$ with $\psi(u)=u/|u|^2$. The readout checks that both coordinate descriptions give the same vector in $\R^3$.`,
      deps: ['mfd-2.4'],
      refs: ['Lee SM Ch. 3'],
      tags: ['tangent bundle', 'local trivialization'],
      viz(v) {
        const mode = v.select('manifold', [{ value: 'S1', label: '$S^1$' }, { value: 'S2', label: '$S^2$' }], 'S1');
        const A1 = v.stage({ x: [0, TAU], y: [-1.7, 1.7], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], xlabel: 'θ', ylabel: 's', title: '$TS^1$ unrolled: the point $(\\theta,s)$' });
        const B1 = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 340, weight: 1, minWidth: 250, title: 'the tangent lines of the circle' });
        const A2 = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 340, weight: 1, minWidth: 250, title: 'chart $N$: $(u,v)\\in\\mathbb R^2\\times\\mathbb R^2$' });
        const B2 = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 340, weight: 1, minWidth: 250, title: 'chart $S$: $(\\psi(u),D\\psi_u v)$' });
        const S3 = v.stage3d({ range: 1.6, height: 340, yaw: -0.7, pitch: 0.4, axes: false, weight: 1, minWidth: 250, title: '$TS^1$ as a cylinder; $S^2$ with $p$ and $v$' });
        const hq = A1.handle(1.2, 0.8, { color: 'gold', label: '(p,v)', constrain: { x: [0.02, TAU - 0.02], y: [-1.6, 1.6] } });
        const hu = A2.handle(0.8, 0.5, { color: 'gold', label: 'u', constrain: (x, y) => { const r = Math.hypot(x, y); return r < 0.4 ? [(0.4 * x) / (r || 1), (0.4 * y) / (r || 1)] : r > 2.4 ? [(2.4 * x) / r, (2.4 * y) / r] : [x, y]; } });
        let vx = 0.7, vy = 0.5;
        const ht = A2.handle(1.5, 1.0, { color: 'accent', label: 'v' });
        ht.onDrag = () => { vx = ht.x - hu.x; vy = ht.y - hu.y; };
        let st = null;
        v.render(() => {
          const S1 = mode.value === 'S1';
          [A1, B1].forEach((s) => { s.el.style.display = S1 ? '' : 'none'; }); [A2, B2].forEach((s) => { s.el.style.display = S1 ? 'none' : ''; });
          hq.visible = S1; hu.visible = !S1; ht.visible = !S1;
          if (S1) {
            const th = hq.x, s = hq.y;
            for (let k = 0; k <= 12; k++) A1.vline((TAU * k) / 12, { color: 'faint', width: 0.8, alpha: 0.6 });
            A1.hline(0, { color: 'muted', width: 1.4, dash: [4, 4] });
            A1.segment([th, -1.7], [th, 1.7], { color: 'accent', width: 1.6 });
            A1.text('zero section', 0.3, 0.12, { size: 11, color: 'muted' });
            B1.circle(0, 0, 1, { color: 'ink', width: 2 });
            for (let k = 0; k < 16; k++) { const a = (TAU * k) / 16; B1.line(Math.cos(a) + 0.5 * Math.sin(a), Math.sin(a) - 0.5 * Math.cos(a), Math.cos(a) - 0.5 * Math.sin(a), Math.sin(a) + 0.5 * Math.cos(a), { color: 'faint', width: 0.9 }); }
            const p = [Math.cos(th), Math.sin(th)], t = [-Math.sin(th), Math.cos(th)];
            B1.line(p[0] - 1.1 * t[0], p[1] - 1.1 * t[1], p[0] + 1.1 * t[0], p[1] + 1.1 * t[1], { color: 'accent', width: 1.6 });
            B1.arrow(p[0], p[1], p[0] + s * t[0], p[1] + s * t[1], { color: 'gold', width: 3 });
            B1.dot(p[0], p[1], { r: 5.5, color: 'ink' });
            S3.surface((a, b) => [Math.cos(a), Math.sin(a), 0.7 * b], [0, TAU], [-1.7, 1.7], { nu: 48, nv: 6, alpha: 0.35, color: 'accent', wire: true });
            S3.curve((a) => [Math.cos(a), Math.sin(a), 0], 0, TAU, { n: 80, color: 'muted', width: 1.4 });
            S3.line([Math.cos(th), Math.sin(th), -1.2], [Math.cos(th), Math.sin(th), 1.2], { color: 'accent', width: 1.8 });
            S3.dot([Math.cos(th), Math.sin(th), 0.7 * s], { r: 6.5, color: 'gold', label: '(p,v)' });
            st = { S1, th, s };
          } else {
            const u = [hu.x, hu.y], tip = [hu.x + vx, hu.y + vy];
            ht.set(u[0] + vx, u[1] + vy);
            const r2 = u[0] * u[0] + u[1] * u[1], uh = [u[0] / Math.sqrt(r2), u[1] / Math.sqrt(r2)];
            const Jp = [[(1 - 2 * uh[0] * uh[0]) / r2, (-2 * uh[0] * uh[1]) / r2], [(-2 * uh[0] * uh[1]) / r2, (1 - 2 * uh[1] * uh[1]) / r2]];
            const us = [u[0] / r2, u[1] / r2], vs = mulv(Jp, [vx, vy]);
            // chart N: grid of base points with fibre discs
            A2.circle(0, 0, 1, { color: 'faint', width: 1, dash: [4, 4] });
            A2.arrow(u[0], u[1], u[0] + vx, u[1] + vy, { color: 'accent', width: 2.8 }); A2.dot(u[0], u[1], { r: 6, color: 'gold' });
            B2.circle(0, 0, 1, { color: 'faint', width: 1, dash: [4, 4] });
            B2.arrow(us[0], us[1], us[0] + vs[0], us[1] + vs[1], { color: 'accent', width: 2.8 }); B2.dot(us[0], us[1], { r: 6, color: 'gold' });
            B2.path([[u[0] * 0, 0], us], { color: 'faint', width: 0.8 });
            // the vector in R^3 from both charts
            const v3N = dirDeriv(stNinv, u, [vx, vy]), v3S = dirDeriv(stSinv, us, vs), p = stNinv(u);
            S3.surface((a, b) => sph(a, b), [0, TAU], [-PI / 2 + 0.001, PI / 2 - 0.001], { nu: 36, nv: 18, alpha: 0.35, color: 'muted', wire: true });
            const e1 = nrm3(v3N), e2 = nrm3(cross3(p, e1));
            S3.poly([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => add3(add3(sc3(p, 1.02), sc3(e1, 0.8 * a)), sc3(e2, 0.8 * b))), { fill: 'ink', fillAlpha: 0.12, color: 'ink', width: 1.1, bias: 0.05 });
            S3.arrow(sc3(p, 1.02), add3(sc3(p, 1.02), v3N), { color: 'accent', width: 2.6 });
            S3.dot(p, { r: 5.5, color: 'gold', label: 'p' });
            st = { S1, u, us, vs, v3N, v3S, p, Jp, dim: 4 };
          }
        });
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3));
          if (st.S1) return `The tangent vector $s\\,\\partial_\\theta$ at $p=(\\cos\\theta,\\sin\\theta)$ has bundle coordinates $(\\theta,s)=(${f(st.th)},${f(st.s)})$ in $\\widetilde\\varphi$, and the point $(\\cos\\theta,\\sin\\theta,\\,0.7s)$ of the cylinder. A second angle chart changes $\\theta$ by a constant and $s$ by the Jacobian $1$, so $TS^1\\cong S^1\\times\\mathbb R$ globally. Dimension: $\\dim TS^1=2=2\\cdot1$.`;
          const df = Math.hypot(...sub3(st.v3N, st.v3S));
          return `Chart $N$: $(u;v)=(${f(st.u[0])},${f(st.u[1])};\\,${f(vx)},${f(vy)})$. Chart $S$: $(\\psi(u);D\\psi_uv)=(${f(st.us[0])},${f(st.us[1])};\\,${f(st.vs[0])},${f(st.vs[1])})$ with $D\\psi_u=\\tfrac1{|u|^2}(I-2\\hat u\\hat u^T)$.\nThe same vector in $\\mathbb R^3$ computed from the two charts: $(${st.v3N.map(f).join(',')})$ and $(${st.v3S.map(f).join(',')})$, difference $${v.sci(df + 1e-16, 2)}$. $\\dim TS^2=4$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Inverse function theorem for manifolds',
      statement: String.raw`Let $F\colon M\to N$ be a smooth map between manifolds of the same dimension and $p\in M$. If $dF_p\colon T_pM\to T_{F(p)}N$ is invertible, then there are open neighbourhoods $U\ni p$ and $V\ni F(p)$ such that $F|_U\colon U\to V$ is a diffeomorphism. (Consequently a smooth map whose differential is invertible at every point is a local diffeomorphism, and $F$ is an open map.)`,
      idea: String.raw`In charts around $p$ and $F(p)$ the map is a smooth map between open subsets of $\R^n$ whose Jacobian is invertible at the base point, since the Jacobian is the matrix of $dF_p$. The inverse function theorem of $\mathrm{pma}$ 9.24 gives a smooth local inverse there; pulling it back by the charts gives a smooth local inverse on $M$. The theorem needs only the pointwise condition $\det dF_p\ne0$ and delivers a neighbourhood whose size is not controlled — it can shrink to nothing as $p$ approaches the set where the differential degenerates.`,
      caption: String.raw`Pick a map and drag $p$ (domain, left). The solver builds the **local inverse** $G$ of $F$ around $F(p)$: in the image panel it takes the disc of radius $\rho$ about $F(p)$ with its polar grid, and continues the preimage of each ray from $p$ by Newton's method. Blue: the grid pulled back to the domain; the orange region is $U=G(\text{disc})$. Red curve: the critical set $\det dF=0$ and its image (critical values). Enlarge $\rho$ past the radius $\rho^*$ at which a ray reaches a critical value: the inverse stops existing and the failed rays (red) end at the fold. Near the critical set $\rho^*\to0$.`,
      deps: ['mfd-2.4', 'pma-9.24'],
      refs: ['Lee SM Ch. 4'],
      tags: ['inverse function theorem', 'local diffeomorphism'],
      viz(v) {
        const msel = v.select('map $F$', Object.entries(IFT).map(([value, o]) => ({ value, label: o.label })), 'fold');
        const rho = v.slider('radius $\\rho$ of the image disc', 0.1, 3, 0.7, { step: 0.01 });
        const A = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: true, height: 380, weight: 1, minWidth: 280, title: 'domain: $p$, the critical set and $U=G(\\text{disc})$' });
        const B = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: true, height: 380, weight: 1, minWidth: 280, title: 'image: the disc about $F(p)$ and the critical values' });
        const P = A.handle(0.4, 0.9, { color: 'gold', label: 'p', constrain: { x: [-2.3, 2.3], y: [-2.3, 2.3] } });
        let key = '', st = null, rs = { k: '', v: 0 };
        v.render(() => {
          const M = IFT[msel.value], F = M.F;
          if (key !== msel.value) { key = msel.value; P.set(...M.p0); }
          const p = [P.x, P.y], q0 = F(p[0], p[1]);
          const hw = Math.max(1.6, rho.value * 1.35); B.setView([q0[0] - hw, q0[0] + hw], [q0[1] - hw, q0[1] + hw]);
          // critical set and critical values
          const cp = [], cq = [];
          if (M.tr[0] === M.tr[1]) { A.dot(0, 0, { r: 5, color: 'red' }); B.dot(0, 0, { r: 5, color: 'red' }); cq.push([0, 0]); } else { for (let i = 0; i <= 120; i++) { const t = M.tr[0] + ((M.tr[1] - M.tr[0]) * i) / 120, c = M.crit(t); cp.push(c); cq.push(F(c[0], c[1])); } A.path(cp, { color: 'red', width: 2 }); B.path(cq, { color: 'red', width: 2 }); }
          const k = msel.value + p[0].toFixed(3) + p[1].toFixed(3);
          if (rs.k !== k) rs = { k, v: rhoStar(F, p) };
          // rays
          const R = rho.value, NR = 48, STEPS = 48, rays = [];
          for (let j = 0; j < NR; j++) rays.push(rayInverse(F, p, q0, (TAU * j) / NR, R, STEPS));
          const all = rays.every((r) => !r.fail);
          if (all) A.poly(rays.map((r) => r.pts[STEPS]), { fill: 'orange', fillAlpha: 0.25, color: 'orange', width: 1.4 });
          B.circle(q0[0], q0[1], R, { fill: all ? 'green' : 'red', fillAlpha: 0.08, color: all ? 'green' : 'red', width: 1.6 });
          // image polar grid
          for (let j = 0; j < NR; j += 2) { const a = (TAU * j) / NR; B.line(q0[0], q0[1], q0[0] + R * Math.cos(a), q0[1] + R * Math.sin(a), { color: 'muted', width: 0.8, alpha: 0.5 }); }
          [0.25, 0.5, 0.75, 1].forEach((f) => B.circle(q0[0], q0[1], R * f, { color: 'muted', width: 0.8, alpha: 0.5 }));
          // pulled back
          rays.forEach((r, j) => { if (j % 2 === 0 || r.fail) A.path(r.pts, { color: r.fail ? 'red' : 'accent', width: r.fail ? 1.6 : 1, alpha: r.fail ? 0.9 : 0.6 }); if (r.fail) { const e = r.pts[r.pts.length - 1]; A.dot(e[0], e[1], { r: 3, color: 'red' }); const q = F(e[0], e[1]); B.dot(q[0], q[1], { r: 3, color: 'red' }); } });
          [0.25, 0.5, 0.75, 1].forEach((f) => { const idx = Math.round(STEPS * f); A.path(rays.concat([rays[0]]).map((r) => (r.pts[idx] ? r.pts[idx] : null)), { color: 'accent', width: 1, alpha: 0.6 }); });
          A.dot(p[0], p[1], { r: 6, color: 'gold' }); B.dot(q0[0], q0[1], { r: 6, color: 'gold' });
          let dc = Infinity; cq.forEach((c) => { dc = Math.min(dc, Math.hypot(c[0] - q0[0], c[1] - q0[1])); });
          const nFail = rays.filter((r) => r.fail).length;
          st = { det: M.det(p[0], p[1]), rs: rs.v, dc, all, nFail, R };
        });
        v.legend([['accent', 'pulled-back polar grid $G(\\text{rays, rings})$'], ['orange', '$U=G(\\text{disc})$', { area: true }], ['red', 'critical set / critical values']]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3));
          return `$\\det dF_p=${f(st.det)}$. Largest image disc on which the local inverse exists: $\\rho^*\\approx${f(st.rs)}$; distance from $F(p)$ to the nearest critical value $=${f(st.dc)}$.\n` + (st.all ? `With $\\rho=${f(st.R)}\\le\\rho^*$ every ray lifts: $F\\colon U\\to$ disc is a diffeomorphism, $G$ is its smooth inverse.` : `With $\\rho=${f(st.R)}>\\rho^*$, **${st.nFail} of 48 rays** cannot be lifted: the inverse breaks down where $\\det dF=0$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'Local diffeomorphisms and smooth covering maps',
      statement: String.raw`A smooth map $F\colon M\to N$ is a **local diffeomorphism** if every $p\in M$ has an open neighbourhood $U$ such that $F(U)$ is open and $F|_U\colon U\to F(U)$ is a diffeomorphism; by 2.8 this holds iff $\dim M=\dim N$ and $dF_p$ is invertible for all $p$. A **smooth covering map** is a smooth surjection $\pi\colon E\to B$ (with $E,B$ connected) such that every point of $B$ has a neighbourhood $V$ that is **evenly covered**: $\pi^{-1}(V)$ is a disjoint union of open sets each mapped *diffeomorphically* onto $V$ by $\pi$. Every smooth covering map is a local diffeomorphism; the converse fails.`,
      idea: String.raw`By the inverse function theorem a smooth map is a local diffeomorphism exactly when its differential is invertible. A covering asks for much more, a *uniform* neighbourhood $V$ over which all the local inverses (the sheets) exist at once. $z\mapsto z^k$ on the circle is a $k$-fold covering: the preimage of an arc is $k$ disjoint arcs, each mapped diffeomorphically since the derivative is $k\ne0$. Delete a point from the domain and the map is still a local diffeomorphism but no longer a covering: near the image of the missing point one sheet loses a point. The quotient $S^2\to\R P^2$, $p\mapsto[p]$, is a $2$-fold smooth covering: a small disc around $p$ and the one around $-p$ both map diffeomorphically onto the same disc.`,
      caption: String.raw`**Circle**: drag the point $q$ on the target circle, choose the degree $k$ and the arc half-width $\delta$. The $k$ preimage arcs (one colour each, left) each map diffeomorphically onto the arc around $q$; the graph (right) shows $\theta\mapsto k\theta\bmod2\pi$ with the sheets as vertical strips. Tick **puncture** and move $q$ to $\theta=0$: the map is still a local diffeomorphism, but one sheet now misses a point — not a covering. **$S^2\to\mathbb RP^2$**: drag $p$ and the disc radius; both discs (blue around $p$, orange around $-p$) land on the same region of the affine chart $(x/z,y/z)$ of $\mathbb RP^2$ — until the radius exceeds $90^\circ$ and a disc contains an antipodal pair.`,
      deps: ['mfd-2.8', 'top-9.1'],
      refs: ['Lee SM Ch. 4'],
      tags: ['covering map', 'local diffeomorphism'],
      viz(v) {
        const mode = v.select('example', [{ value: 'circle', label: '$z\\mapsto z^k$ on $S^1$' }, { value: 'rp2', label: '$S^2\\to\\mathbb RP^2$' }], 'circle');
        const kk = v.slider('degree $k$', 1, 6, 3, { int: true, step: 1 });
        const dl = v.slider('arc half-width $\\delta$', 0.05, 3.5, 0.8, { step: 0.01 });
        const pun = v.toggle('puncture the domain at $\\theta=0$', false);
        const rr = v.slider('disc radius (degrees)', 5, 110, 30, { step: 1 });
        const A = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 340, weight: 1, minWidth: 240, title: 'the domain circle: the sheets over the arc' });
        const B = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: false, height: 340, weight: 1, minWidth: 240, title: 'the target circle: the arc around $q$' });
        const C = v.stage({ x: [0, TAU], y: [0, TAU], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 240, xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], yticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], xlabel: 'θ (domain)', ylabel: 'kθ mod 2π (target)', title: 'the graph of the map' });
        const D = v.stage({ x: [-PI, PI], y: [-PI / 2, PI / 2], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 240, xticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], yticks: [[-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2']], xlabel: 'longitude', ylabel: 'latitude', title: '$S^2$: base point $p$ and the discs around $\\pm p$' });
        const S3 = v.stage3d({ range: 1.3, height: 340, yaw: -0.7, pitch: 0.4, axes: false, weight: 1, minWidth: 240, title: '$S^2$ with the discs about $p$ and $-p$' });
        const E = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: true, grid: true, height: 340, weight: 1, minWidth: 240, title: 'the chart $(x/z,\\,y/z)$ of $\\mathbb RP^2$: images of both discs' });
        const Q = B.handle(Math.cos(1), Math.sin(1), { color: 'gold', label: 'q', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        const Pp = D.handle(0.5, 0.8, { color: 'gold', label: 'p', constrain: { x: [-PI, PI], y: [0.05, 1.5] } });
        let st = null;
        v.render(() => {
          const circ = mode.value === 'circle';
          [A, B, C].forEach((s) => { s.el.style.display = circ ? '' : 'none'; }); [D, S3, E].forEach((s) => { s.el.style.display = circ ? 'none' : ''; });
          kk.el.hidden = !circ; dl.el.hidden = !circ; pun.el.hidden = !circ; rr.el.hidden = circ; Q.visible = circ; Pp.visible = !circ;
          if (circ) {
            const k = kk.value, d = dl.value, phi0 = wrap(Math.atan2(Q.y, Q.x)), punct = pun.value;
            B.circle(0, 0, 1, { color: 'ink', width: 2 }); A.circle(0, 0, 1, { color: 'ink', width: 2 });
            B.curve((a) => [1.08 * Math.cos(a), 1.08 * Math.sin(a)], phi0 - d, phi0 + d, { n: 60, color: 'accent', width: 6, alpha: 0.9 });
            const centres = [], holes = [];
            for (let j = 0; j < k; j++) {
              const c = (phi0 + TAU * j) / k, hw = d / k, col = PAL[j % 6];
              centres.push(c);
              const dc = Math.abs(wrap(0 - c + PI) - PI), hole = punct && dc < hw;
              if (hole) holes.push(j);
              A.curve((a) => [1.08 * Math.cos(a), 1.08 * Math.sin(a)], c - hw, c + hw, { n: 40, color: hole ? 'red' : col, width: 6, alpha: 0.9 });
              A.dot(1.08 * Math.cos(c), 1.08 * Math.sin(c), { r: 3.5, color: 'ink' });
              // graph strip
              const lo = c - hw, hi = c + hw;
              [-TAU, 0, TAU].forEach((sh) => { const a0 = lo + sh, a1 = hi + sh; if (a1 > 0 && a0 < TAU) C.vband(Math.max(a0, 0), Math.min(a1, TAU), { color: hole ? 'red' : col, alpha: 0.18 }); });
            }
            // preimages of q
            for (let j = 0; j < k; j++) { const c = centres[j]; A.dot(Math.cos(c), Math.sin(c), { r: 5.5, color: 'gold' }); }
            B.dot(Math.cos(phi0), Math.sin(phi0), { r: 6, color: 'gold' });
            if (punct) { A.dot(1, 0, { r: 6, hollow: true, color: 'red' }); B.dot(1, 0, { r: 4, hollow: true, color: 'red' }); }
            // graph of theta -> k theta mod 2pi
            for (let j = 0; j < k; j++) C.line((TAU * j) / k, 0, (TAU * (j + 1)) / k, TAU, { color: 'ink', width: 2.2 });
            if (punct) C.dot(0, 0, { r: 5, hollow: true, color: 'red' });
            [phi0 - d, phi0 + d].forEach((y) => { [-TAU, 0, TAU].forEach((sh) => { const yy = y + sh; if (yy >= 0 && yy <= TAU) C.hline(yy, { color: 'accent', width: 1, alpha: 0.6, dash: [4, 4] }); }); });
            const preq = k - (punct && Math.abs(wrap(phi0 + PI) - PI) < 1e-9 ? 1 : 0);
            st = { circ, k, d, holes, overlap: d > PI, preq, phi0, punct };
          } else {
            const lon = Pp.x, lat = Pp.y, p = sph(lon, lat), r = (rr.value * PI) / 180;
            const [e1, e2] = frameAt(p);
            const pt = (rho, ph, s = 1) => sc3(add3(sc3(p, Math.cos(rho)), add3(sc3(e1, Math.sin(rho) * Math.cos(ph)), sc3(e2, Math.sin(rho) * Math.sin(ph)))), s);
            const ll = (q) => [Math.atan2(q[1], q[0]), Math.asin(clamp(q[2], -1, 1))];
            const gn = (q) => (Math.abs(q[2]) < 0.04 ? null : [q[0] / q[2], q[1] / q[2]]);
            S3.surface((a, b) => sph(a, b), [0, TAU], [-PI / 2 + 0.001, PI / 2 - 0.001], { nu: 36, nv: 18, alpha: 0.28, color: 'muted', wire: true });
            S3.surface((rho, ph) => pt(rho, ph, 1.01), [0, r], [0, TAU], { nu: 8, nv: 40, alpha: 0.85, color: 'accent' });
            S3.surface((rho, ph) => pt(rho, ph, -1.01), [0, r], [0, TAU], { nu: 8, nv: 40, alpha: 0.85, color: 'orange' });
            S3.dot(p, { r: 5, color: 'gold', label: 'p' }); S3.dot(sc3(p, -1), { r: 5, color: 'gold', label: '−p' });
            // chart of the domain
            const bd = (s) => { const pts = []; let prev = null; for (let i = 0; i <= 160; i++) { const q = ll(pt(r, (TAU * i) / 160, s)); if (prev && Math.abs(q[0] - prev[0]) > PI) pts.push(null); pts.push(q); prev = q; } return pts; };
            D.path(bd(1), { color: 'accent', width: 2.2 }); D.path(bd(-1), { color: 'orange', width: 2.2 });
            const pl = ll(p), al = ll(sc3(p, -1)); D.dot(al[0], al[1], { r: 5, color: 'orange' }); D.dot(pl[0], pl[1], { r: 5, color: 'gold' });
            // image in RP^2 chart
            [[1, 'accent', 2.4, false], [-1, 'orange', 2.4, [6, 4]]].forEach(([s, col, w, dash]) => {
              for (let j = 1; j <= 3; j++) { const rho = (r * j) / 3; E.path(Array.from({ length: 121 }, (_, i) => gn(pt(rho, (TAU * i) / 120, s))), { color: col, width: j === 3 ? w : 1, alpha: j === 3 ? 1 : 0.5, dash }); }
              for (let i = 0; i < 12; i++) E.path(Array.from({ length: 21 }, (_, j2) => gn(pt((r * j2) / 20, (TAU * i) / 12, s))), { color: col, width: 0.9, alpha: 0.5, dash });
            });
            const g0 = gn(p); if (g0) E.dot(g0[0], g0[1], { r: 6, color: 'gold' });
            // differential of the covering map at p in the graph chart (x,y) -> (x/z, y/z)
            const Fg = (x, y) => { const z = Math.sqrt(Math.max(1e-12, 1 - x * x - y * y)); return [x / z, y / z]; };
            const Jd = jac(Fg, p[0], p[1]);
            st = { circ, r: rr.value, p, det: det2(Jd), expect: 1 / (p[2] ** 4), inChart: p[2] > Math.sin(r) };
          }
        });
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3));
          if (st.circ) {
            return `$z\\mapsto z^{${st.k}}$ has derivative $${st.k}\\ne0$ everywhere: a local diffeomorphism. Preimages of $q$: **${st.preq}**; each of the ${st.k} sheets over the arc has width $2\\delta/k=${f((2 * st.d) / st.k)}$ and maps diffeomorphically onto the arc.\n` + (st.overlap ? 'The arc is longer than the circle: the sheets overlap — not an evenly covered neighbourhood.' : st.holes.length ? `**The punctured sheet** (red) loses a point: it is not mapped onto the whole arc, so the arc is not evenly covered and the restriction is **not a covering** (only a local diffeomorphism).` : st.punct ? 'The puncture is outside this neighbourhood, so it is evenly covered here; move $q$ to $\\theta=0$.' : 'This arc is evenly covered: $k$ disjoint sheets.');
          }
          return `$p=(${st.p.map(f).join(',')})$. $\\det d\\pi_p=${f(st.det)}$ in the graph chart $(x,y)\\mapsto(x/z,y/z)$ (formula $1/z^4=${f(st.expect)}$): nonzero, so $\\pi$ is a local diffeomorphism. Each point of $\\mathbb RP^2$ has exactly 2 preimages, $\\pm p$.\n` + (st.r < 90 ? `Radius $${st.r}^\\circ<90^\\circ$: the two discs are disjoint and each maps diffeomorphically onto the same region — evenly covered.` : `Radius $${st.r}^\\circ\\ge90^\\circ$: a disc contains an antipodal pair $\\{x,-x\\}$, so $\\pi$ is **not injective** on it.`) + (st.inChart ? '' : ' (Part of the disc leaves the chart $z>0$; those points run off to infinity in the picture.)');
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Definition',
      name: 'Vector bundles and sections',
      statement: String.raw`A smooth **vector bundle of rank $k$** over $M$ is a smooth manifold $E$ with a smooth surjection $\pi\colon E\to M$ such that every fibre $E_p=\pi^{-1}(p)$ is a $k$-dimensional real vector space and every point has a neighbourhood $U$ with a diffeomorphism $\Phi\colon\pi^{-1}(U)\to U\times\R^k$ (a **local trivialization**) that is linear on each fibre. On overlaps the trivializations differ by a smooth map $g\colon U\cap U'\to GL_k(\R)$. A **section** is a smooth map $s\colon M\to E$ with $\pi\circ s=\mathrm{id}_M$; sections form a module over $C^\infty(M)$. The bundle is **trivial** if it is globally $M\times\R^k$, equivalently if it has $k$ sections linearly independent at every point.`,
      idea: String.raw`The tangent bundle is the model; the definition abstracts "a vector space attached smoothly to each point". Locally every bundle is a product, so locally there are many nowhere-vanishing sections (a constant one in a trivialization). Whether one exists *globally* depends on how the local pieces are glued. Over the circle a line bundle is glued from one trivialization by a single sign $g=\pm1$ at the gluing point. With $g=+1$ it is the cylinder $S^1\times\R$ and the constant section $1$ never vanishes; with $g=-1$ it is the **Möbius bundle**, and a section is a function with $s(2\pi)=-s(0)$, which by the intermediate value theorem must cross zero. So the Möbius bundle is not trivial.`,
      caption: String.raw`The graph (left) shows a section in the trivialization over $0\le\theta\le2\pi$: drag the six knot values (the spline passes through them). Choose the **bundle**: for the **cylinder** the value at $2\pi$ must equal the value at $0$; for the **Möbius band** the section is glued with a flip, $s(2\pi)=-s(0)$ (the hollow dot at $2\pi$ is forced). The strip on the right shows the section as a curve over the bundle. Try to make the section nowhere zero: on the cylinder pull all knots positive; on the Möbius band the readout counts the zeros and you will never find fewer than one.`,
      deps: ['mfd-2.7'],
      refs: ['Lee SM Ch. 10'],
      tags: ['vector bundle', 'section', 'Möbius bundle'],
      viz(v) {
        const kind = v.select('line bundle over $S^1$', [{ value: 'cyl', label: 'cylinder (trivial)' }, { value: 'mob', label: 'Möbius band' }], 'mob');
        const M = 6;
        const A = v.stage({ x: [0, TAU], y: [-1.7, 1.7], axes: 'box', gutter: true, height: 360, weight: 1.1, minWidth: 280, xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], xlabel: 'θ', ylabel: 's(θ)', title: 'a section in the trivialization over $[0,2\\pi]$' });
        const S3 = v.stage3d({ range: 1.6, height: 360, yaw: -0.5, pitch: 0.7, axes: false, weight: 1, minWidth: 280, title: 'the bundle and the section' });
        const init = [0.9, 0.5, -0.2, -0.8, -0.3, 0.6];
        const hs = init.map((c, i) => A.handle((TAU * i) / M, c, { color: PAL[i % 6], r: 7, constrain: { x: [(TAU * i) / M, (TAU * i) / M], y: [-1.6, 1.6] } }));
        const cr = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
        let st = null;
        v.render(() => {
          const sg = kind.value === 'mob' ? -1 : 1, c = hs.map((h) => h.y);
          const K = (i) => { const w = Math.floor(i / M), r = ((i % M) + M) % M; return Math.pow(sg, ((w % 2) + 2) % 2) * c[r]; };
          const s = (th) => { const x = (th / TAU) * M, i = Math.min(M - 1, Math.floor(x)), t = x - i; return cr(K(i - 1), K(i), K(i + 1), K(i + 2), t); };
          A.hline(0, { color: 'muted', width: 1.2, dash: [4, 4] });
          A.fn(s, { color: 'accent', width: 2.8, domain: [0, TAU], n: 400 });
          A.dot(TAU, sg * c[0], { r: 6, hollow: true, color: sg < 0 ? 'red' : 'accent' });
          A.dot(0, c[0], { r: 3, color: 'accent' });
          // zeros
          const zs = []; let prev = s(0);
          const N = 2400;
          for (let i = 1; i <= N; i++) { const th = (TAU * i) / N, cur = s(th); if (prev * cur < 0) { let a = (TAU * (i - 1)) / N, b = th; for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (s(a) * s(m) <= 0) b = m; else a = m; } zs.push((a + b) / 2); } prev = cur; }
          // exact zero at the start (value 0) counts as a zero too
          if (Math.abs(c[0]) < 1e-9) zs.unshift(0);
          zs.forEach((z) => A.dot(z, 0, { r: 5.5, color: 'red' }));
          // 3D
          const mob = sg < 0, W = 0.3;
          const Pf = (th, w) => (mob ? [(1 + W * w * Math.cos(th / 2)) * Math.cos(th), (1 + W * w * Math.cos(th / 2)) * Math.sin(th), W * w * Math.sin(th / 2)] : [Math.cos(th), Math.sin(th), W * w * 1.6]);
          S3.surface(Pf, [0, TAU], [-1.7, 1.7], { nu: 72, nv: 6, alpha: 0.4, color: 'accent', wire: true });
          S3.curve((th) => Pf(th, 0), 0, TAU, { n: 120, color: 'muted', width: 1.2 });
          S3.curve((th) => Pf(th, clamp(s(th), -1.7, 1.7)), 0, TAU, { n: 240, color: 'gold', width: 3.2 });
          zs.forEach((z) => S3.dot(Pf(z, 0), { r: 6, color: 'red' }));
          let mn = Infinity; for (let i = 0; i <= 600; i++) mn = Math.min(mn, Math.abs(s((TAU * i) / 600)));
          st = { sg, zs, mn };
        });
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3));
          return `Gluing: $s(2\\pi)=${st.sg < 0 ? '-' : '+'}s(0)$. The section has **${st.zs.length}** zero${st.zs.length === 1 ? '' : 's'}${st.zs.length ? ` (at $\\theta=${st.zs.map(f).join(',\\ ')}$)` : ''}; $\\min|s|=${f(st.mn)}$.\n` + (st.sg < 0 ? 'On the Möbius band the values at the two ends of $[0,2\\pi]$ have opposite signs, so by the intermediate value theorem the number of sign changes is always **odd** (at least one): there is no nowhere-zero section, so the bundle is not trivial.' : st.zs.length === 0 ? 'No zeros: a nowhere-zero section $\\Rightarrow$ the cylinder is a trivial bundle.' : 'Even number of sign changes on the cylinder; pull all knots to one side of $0$ to remove them.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Proposition',
      name: 'Parallelizable manifolds; TS² is not trivial',
      statement: String.raw`A manifold $M$ of dimension $n$ is **parallelizable** if $TM$ is trivial, equivalently if there are $n$ smooth vector fields (a **global frame**) that form a basis of $T_pM$ at every $p$. Examples: $\R^n$, the circle $S^1$ (frame $\partial_\theta$), the torus $T^n$ (frame $\partial_{\theta^1},\dots,\partial_{\theta^n}$), every Lie group (left-invariant fields) — in particular $S^3$, the unit quaternions, with the frame $p\mapsto(pi,pj,pk)$. The sphere $S^2$ is **not** parallelizable: every smooth tangent vector field on $S^2$ vanishes somewhere (hairy ball theorem), so $TS^2$ has no nowhere-zero section and is nontrivial.`,
      idea: String.raw`For $S^1$ and $T^n$ the coordinate fields are global because the angle coordinates are defined up to constants. On $S^3$, multiplication by a unit quaternion $p$ is an isometry of $\R^4$ carrying the orthonormal triple $(1;i,j,k)$ to $(p;pi,pj,pk)$, so $pi,pj,pk$ are orthonormal and tangent to $S^3$ (with $\langle a,b\rangle=\mathrm{Re}(\bar a b)$: $\langle p,pi\rangle=\mathrm{Re}(i)=0$, $\langle pi,pj\rangle=\mathrm{Re}(-ij)=\mathrm{Re}(-k)=0$): a frame. On $S^2$ no such thing can exist: a nowhere-zero field would give a homotopy from the identity to the antipodal map, impossible since their degrees are $1$ and $-1$ (this is the hairy ball theorem, top-13.12). More quantitatively, the **Poincaré–Hopf theorem** says that the indices of the zeros of any field on $S^2$ add up to $\chi(S^2)=2\neq0$, so zeros can be moved but never removed.`,
      caption: String.raw`Switch between the four manifolds. **$S^1$, $T^2$**: the frame is drawn at a grid of points and at the draggable point; the readout shows it has no zeros. **$S^3$**: stereographic image of the Hopf torus at height $\eta$; drag the point (three angles) and see the three quaternion fields $pi,pj,pk$ (conformally mapped, so they stay orthogonal); the Gram matrix of $(p,pi,pj,pk)$ in $\mathbb R^4$ is the identity. **$S^2$**: build a tangent field $V=P_p(m+Bp)+s\,(e_z\times p)$ with the sliders and the direction handle of $m$; the solver finds all zeros and their indices — try to make the field vanish nowhere and watch the index sum stay at $2$.`,
      deps: ['mfd-2.10', 'top-13.12'],
      refs: ['Lee SM Ch. 8', 'Lee SM Ch. 10'],
      tags: ['parallelizable', 'global frame', 'hairy ball'],
      viz(v) {
        const mode = v.select('manifold', [{ value: 'S1', label: '$S^1$' }, { value: 'T2', label: '$T^2$' }, { value: 'S3', label: '$S^3$' }, { value: 'S2', label: '$S^2$ (try!)' }], 'S2');
        const eta = v.slider('Hopf torus height $\\eta$', 0.15, 0.75, 0.55, { step: 0.01 });
        const xi1 = v.slider('angle $\\xi_1$', 0, TAU, 0.8, { step: 0.01 });
        const xi2 = v.slider('angle $\\xi_2$', 0, TAU, 2.0, { step: 0.01 });
        const mu = v.slider('constant part $|m|$', 0, 1.5, 0.3, { step: 0.01 });
        const qq = v.slider('quadratic part $q$', -1.5, 1.5, 0.8, { step: 0.01 });
        const tw = v.slider('twist $s$', -1.5, 1.5, 0.0, { step: 0.01 });
        const C1 = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, axes: false, height: 380, weight: 1, minWidth: 260, title: '$S^1$ with the frame $\\partial_\\theta$' });
        const F2 = v.stage({ x: [0, TAU], y: [0, TAU], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], yticks: [[0, '0'], [PI, 'π'], [TAU, '2π']], xlabel: 'θ₁', ylabel: 'θ₂', title: 'the flat torus: choose the point' });
        const MP = v.stage({ x: [-PI, PI], y: [-PI / 2, PI / 2], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], yticks: [[-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2']], xlabel: 'longitude', ylabel: 'latitude', title: '$|V|$ on the sphere (dark = small); handle: direction of $m$' });
        const S3 = v.stage3d({ range: 1.5, height: 380, yaw: -0.7, pitch: 0.5, axes: false, weight: 1.1, minWidth: 280 });
        const hp = C1.handle(Math.cos(0.9), Math.sin(0.9), { color: 'gold', label: 'p', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [x / r, y / r]; } });
        const ht = F2.handle(1.0, 0.7, { color: 'gold', label: 'p' });
        const hm = MP.handle(0.4, 0.5, { color: 'accent', label: 'm', constrain: { x: [-PI, PI], y: [-PI / 2, PI / 2] } });
        const R = 1.0, r0 = 0.42;
        const torus = (a, b) => [(R + r0 * Math.cos(b)) * Math.cos(a), (R + r0 * Math.cos(b)) * Math.sin(a), r0 * Math.sin(b)];
        const qmul = (p, q) => [p[0] * q[0] - p[1] * q[1] - p[2] * q[2] - p[3] * q[3], p[0] * q[1] + p[1] * q[0] + p[2] * q[3] - p[3] * q[2], p[0] * q[2] - p[1] * q[3] + p[2] * q[0] + p[3] * q[1], p[0] * q[3] + p[1] * q[2] - p[2] * q[1] + p[3] * q[0]];
        const stereo = (q) => [q[1], q[2], q[3]].map((c) => c / (1 - q[0]));
        const hopf = (e, a, b) => [Math.sin(e) * Math.cos(b), Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e) * Math.sin(b)];
        let st = null;
        v.render(() => {
          const m = mode.value;
          C1.el.style.display = m === 'S1' ? '' : 'none'; F2.el.style.display = m === 'T2' ? '' : 'none'; MP.el.style.display = m === 'S2' ? '' : 'none'; S3.el.style.display = m === 'S1' ? 'none' : '';
          eta.el.hidden = m !== 'S3'; xi1.el.hidden = m !== 'S3'; xi2.el.hidden = m !== 'S3';
          [mu, qq, tw].forEach((c) => { c.el.hidden = m !== 'S2'; });
          hp.visible = m === 'S1'; ht.visible = m === 'T2'; hm.visible = m === 'S2';
          if (m === 'S1') {
            C1.circle(0, 0, 1, { color: 'ink', width: 2 });
            for (let k = 0; k < 16; k++) { const a = (TAU * k) / 16; C1.arrow(Math.cos(a), Math.sin(a), Math.cos(a) - 0.4 * Math.sin(a), Math.sin(a) + 0.4 * Math.cos(a), { color: 'blue', width: 1.6, alpha: 0.7 }); }
            const th = Math.atan2(hp.y, hp.x);
            C1.arrow(Math.cos(th), Math.sin(th), Math.cos(th) - 0.7 * Math.sin(th), Math.sin(th) + 0.7 * Math.cos(th), { color: 'gold', width: 3.2 });
            C1.tex('\\partial_\\theta', Math.cos(th) * 1.5, Math.sin(th) * 1.5, { color: 'gold', size: 16 });
            st = { m, th };
          } else if (m === 'T2') {
            const a = ht.x, b = ht.y;
            S3.surface(torus, [0, TAU], [0, TAU], { nu: 48, nv: 24, alpha: 0.3, color: 'muted', wire: true });
            const e1 = (a0, b0) => nrm3([-(Math.sin(a0)), Math.cos(a0), 0]), e2 = (a0, b0) => nrm3([-Math.sin(b0) * Math.cos(a0), -Math.sin(b0) * Math.sin(a0), Math.cos(b0)]);
            for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) { const a0 = (TAU * (i + 0.5)) / 12, b0 = (TAU * (j + 0.5)) / 6, p0 = torus(a0, b0); S3.arrow(p0, add3(p0, sc3(e1(a0, b0), 0.22)), { color: 'blue', width: 1.4 }); S3.arrow(p0, add3(p0, sc3(e2(a0, b0), 0.22)), { color: 'orange', width: 1.4 }); }
            const p = torus(a, b);
            S3.arrow(p, add3(p, sc3(e1(a, b), 0.5)), { color: 'blue', width: 3.2 }); S3.arrow(p, add3(p, sc3(e2(a, b), 0.5)), { color: 'orange', width: 3.2 }); S3.dot(p, { r: 5.5, color: 'gold' });
            for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) { const a0 = (TAU * (i + 0.5)) / 8, b0 = (TAU * (j + 0.5)) / 6; F2.arrow(a0, b0, a0 + 0.42, b0, { color: 'blue', width: 1.4, alpha: 0.7 }); F2.arrow(a0, b0, a0, b0 + 0.42, { color: 'orange', width: 1.4, alpha: 0.7 }); }
            F2.dot(a, b, { r: 6, color: 'gold' });
            F2.arrow(a, b, a + 0.7, b, { color: 'blue', width: 2.4 }); F2.arrow(a, b, a, b + 0.7, { color: 'orange', width: 2.4 });
            const n1 = R + r0 * Math.cos(b);
            st = { m, n1, n2: r0, a, b };
          } else if (m === 'S3') {
            const e = eta.value, a1 = xi1.value, a2 = xi2.value;
            S3.surface((x, y) => stereo(hopf(e, x, y)), [0, TAU], [0, TAU], { nu: 48, nv: 32, alpha: 0.16, color: 'accent', wire: true });
            const frame = (p) => [[0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]].map((q) => qmul(p, q));
            const arrows = (p, L, w) => {
              const P0 = stereo(p), cols = ['red', 'green', 'blue'];
              frame(p).forEach((E, i) => {
                const h = 1e-6, Q = nrm3_4(p.map((c, k) => c + h * E[k])), d = stereo(Q).map((c, k) => (c - P0[k]) / h), nn = Math.hypot(...d) || 1;
                S3.arrow(P0, add3(P0, sc3(d, L / nn)), { color: cols[i], width: w });
              });
            };
            const nrm3_4 = (q) => { const r = Math.hypot(...q); return q.map((c) => c / r); };
            for (let k = 0; k < 14; k++) arrows(hopf(e, a1 + (TAU * k) / 14, a2), 0.28 * Math.max(0.6, 1), 1.4);
            const p = hopf(e, a1, a2); arrows(p, 0.6, 3.2);
            S3.dot(stereo(p), { r: 6, color: 'gold', label: 'p' });
            const Fr = [p, ...frame(p)];
            const G = Fr.map((a) => Fr.map((b) => a.reduce((s, c, i) => s + c * b[i], 0)));
            let err = 0; G.forEach((row, i) => row.forEach((x, j) => { err = Math.max(err, Math.abs(x - (i === j ? 1 : 0))); }));
            st = { m, err, p };
          } else {
            const lon = hm.x, lat = hm.y, mv = sc3(sph(lon, lat), mu.value), q = qq.value, s = tw.value;
            const B = (p) => [q * p[0], -0.5 * q * p[1], -0.5 * q * p[2]];
            const Vf = (p) => { const w = add3(mv, B(p)); const t = sub3(w, sc3(p, dot3(w, p))); return add3(t, sc3(cross3([0, 0, 1], p), s)); };
            // zeros by multi-start Newton in tangent coordinates
            const zeros = [];
            SEEDS.forEach((p0) => {
              let p = p0; const [e1, e2] = frameAt(p0);
              if (Math.hypot(...Vf(p0)) > 1.2 * 1.2 + 3) return;
              let u = [0, 0], ok = false;
              const X = (uu) => nrm3(add3(p0, add3(sc3(e1, uu[0]), sc3(e2, uu[1])))), G2 = (uu) => { const x = X(uu), w = Vf(x); return [dot3(w, e1), dot3(w, e2)]; };
              for (let it = 0; it < 25; it++) {
                const g0 = G2(u);
                if (Math.hypot(...g0) < 1e-12) { ok = true; break; }
                const h = 1e-6, a = G2([u[0] + h, u[1]]), b = G2([u[0] - h, u[1]]), c = G2([u[0], u[1] + h]), d = G2([u[0], u[1] - h]);
                const J = [[(a[0] - b[0]) / (2 * h), (c[0] - d[0]) / (2 * h)], [(a[1] - b[1]) / (2 * h), (c[1] - d[1]) / (2 * h)]];
                if (Math.abs(det2(J)) < 1e-12) break;
                const dx = mulv(inv22(J), g0), nn = Math.hypot(...dx), sc = nn > 0.3 ? 0.3 / nn : 1;
                u = [u[0] - sc * dx[0], u[1] - sc * dx[1]];
                if (Math.hypot(...u) > 1.2) break;
              }
              if (ok) { const z = X(u); if (!zeros.some((w) => Math.hypot(...sub3(w, z)) < 1e-4)) zeros.push(z); }
            });
            // indices by winding of V in a tangent frame around each zero
            const idx = zeros.map((z, i) => {
              let dmin = Infinity; zeros.forEach((w, j) => { if (j !== i) dmin = Math.min(dmin, Math.acos(clamp(dot3(z, w), -1, 1))); });
              const rr = Math.min(0.05, 0.4 * dmin), [e1, e2] = frameAt(z); let tot = 0, prev = null;
              for (let k = 0; k <= 64; k++) { const a = (TAU * k) / 64, x = nrm3(add3(z, sc3(add3(sc3(e1, Math.cos(a)), sc3(e2, Math.sin(a))), rr))), w = Vf(x), ang = Math.atan2(dot3(w, e2), dot3(w, e1)); if (prev !== null) { let d = ang - prev; while (d > PI) d -= TAU; while (d < -PI) d += TAU; tot += d; } prev = ang; }
              return Math.round(tot / TAU);
            });
            MP.heat((x, y) => Math.hypot(...Vf(sph(x, y))), { cmap: 'theme', range: [0, 2.2], res: 3, key: `${lon.toFixed(2)}${lat.toFixed(2)}${mu.value}${q}${s}` });
            MP.axes();
            zeros.forEach((z, i) => { const lo = Math.atan2(z[1], z[0]), la = Math.asin(clamp(z[2], -1, 1)); MP.dot(lo, la, { r: 6.5, color: idx[i] > 0 ? 'red' : idx[i] < 0 ? 'purple' : 'ink' }); MP.text(`${idx[i] > 0 ? '+' : '−'}${Math.abs(idx[i])}`, lo, la + 0.16, { size: 11, color: idx[i] > 0 ? 'red' : 'purple', align: 'center' }); });
            // 3D: sphere with arrows
            S3.surface((a, b) => sph(a, b), [0, TAU], [-PI / 2 + 0.001, PI / 2 - 0.001], { nu: 36, nv: 18, alpha: 0.3, color: 'muted', wire: true });
            fib(190).forEach((p) => { const w = Vf(p), n = Math.hypot(...w); if (n > 1e-6) S3.arrow(sc3(p, 1.01), add3(sc3(p, 1.01), sc3(w, Math.min(0.22, 0.2 * n) / n)), { color: 'blue', width: 1.4 }); });
            zeros.forEach((z, i) => S3.dot(sc3(z, 1.03), { r: 6, color: idx[i] > 0 ? 'red' : idx[i] < 0 ? 'purple' : 'ink' }));
            const triv = mu.value === 0 && q === 0 && s === 0;
            st = { m, zeros: zeros.length, idx, sum: idx.reduce((a, b) => a + b, 0), triv };
          }
        });
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3));
          if (st.m === 'S1') return `$S^1$: the field $\\partial_\\theta$ has length 1 at every point of the circle — a global frame, so $TS^1\\cong S^1\\times\\mathbb R$ is trivial. At $\\theta=${f(st.th)}$ the frame vector is $(${f(-Math.sin(st.th))},${f(Math.cos(st.th))})$.`;
          if (st.m === 'T2') return `$T^2$: the frame $(\\partial_{\\theta_1},\\partial_{\\theta_2})$ has lengths $R+r\\cos\\theta_2=${f(st.n1)}$ and $r=${f(st.n2)}$ here, both $>0$ and orthogonal at every point: a global frame, $TT^2$ is trivial.`;
          if (st.m === 'S3') return `$S^3$: Gram matrix of $(p,\\,pi,\\,pj,\\,pk)$ in $\\mathbb R^4$ is the identity up to $${v.sci(st.err + 1e-16, 2)}$: the three fields are orthonormal and tangent at every point, a global frame. (Arrows are drawn at equal length in the conformal stereographic picture.)`;
          if (st.triv) return 'With $m=0,\\ q=0,\\ s=0$ the field is identically zero (not an example).';
          return `$S^2$: the field has **${st.zeros}** zero${st.zeros === 1 ? '' : 's'}, with indices $${st.idx.map((i) => (i > 0 ? '+' : '') + String(i).replace('-', '-')).join(',\\ ')}$, sum $=${st.sum}$. Poincaré–Hopf: the sum is always $\\chi(S^2)=2$, so the field must vanish somewhere — $TS^2$ has no nowhere-zero section.`;
        });
      },
    },
  ],
};
