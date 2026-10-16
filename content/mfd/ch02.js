// Manifolds & Riemannian Geometry — Chapter 2: Tangent spaces and bundles (items 2.1–2.6; 2.7–2.11 in ch02-b.js)
import {
  PI, TAU, clamp, wrap, minus, dot3, cross3, add3, sub3, sc3, nrm3, sph, eastAt, northAt,
  stNinv, stSinv, gexp, det2, mul22, mulv, inv22, jac, pmat, pvec, MAPS, gridImage, imageView,
} from './ch02.shared.js';

// ---- 2.1: functions on the sphere and bijections of the line
const FUNS = {
  poly: { label: '$x^2-yz$', f: (p) => p[0] * p[0] - p[1] * p[2], where: '' },
  height: { label: '$z$', f: (p) => p[2], where: '' },
  bump: { label: '$e^{-1/(1+z)}$', f: (p) => gexp(1 + p[2]), where: '' },
  angle: { label: '$\\theta$ (angle from $N$)', f: (p) => Math.atan2(Math.hypot(p[0], p[1]), p[2]), where: 'a cone point at each pole' },
  absz: { label: '$|z|$', f: (p) => Math.abs(p[2]), where: 'a crease along the equator' },
  absx: { label: '$|x|$', f: (p) => Math.abs(p[0]), where: 'a crease along the great circle $x=0$ (through both poles)' },
};
const bis = (F, y) => { let a = -40, b = 40; for (let i = 0; i < 90; i++) { const m = (a + b) / 2; if (F(m) < y) a = m; else b = m; } return (a + b) / 2; };
const LINE = {
  cube: { label: '$x^3$', F: (x) => x * x * x, Fi: (y) => Math.cbrt(y) },
  sin: { label: '$x+\\tfrac12\\sin x$', F: (x) => x + 0.5 * Math.sin(x), Fi: null },
  cubic: { label: '$x^3+x$', F: (x) => x * x * x + x, Fi: null },
};
Object.values(LINE).forEach((o) => { if (!o.Fi) o.Fi = (y) => bis(o.F, y); });
/** Largest second difference of g(t) over t in [-2.2, 2.2]. */
function d2max(g, h) {
  let m = 0;
  for (let i = 0; i <= 880; i++) { const t = -2.2 + (4.4 * i) / 880; m = Math.max(m, Math.abs(g(t + h) - 2 * g(t) + g(t - h)) / (h * h)); }
  return m;
}

export default {
  collection: 'mfd',
  chapter: 2,
  title: 'Tangent spaces and bundles',
  summary: String.raw`Tangent vectors on an abstract manifold are defined intrinsically, as derivations of smooth functions or as velocities of curves, and smooth maps have differentials between tangent spaces. Bundling all tangent spaces together gives the tangent bundle, the first example of a vector bundle. The inverse function theorem carries over unchanged, and the question of whether a bundle is trivial already has topological teeth.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Smooth maps and diffeomorphisms',
      statement: String.raw`Let $M,N$ be smooth manifolds. A map $F\colon M\to N$ is **smooth** if for every $p\in M$ there are charts $(U,\varphi)$ of $M$ around $p$ and $(V,\psi)$ of $N$ around $F(p)$ with $F(U)\subset V$ such that the **coordinate representative** $\psi\circ F\circ\varphi^{-1}\colon\varphi(U)\to\psi(V)$ is smooth in the sense of calculus on $\R^n$. (Then it is smooth in *every* pair of charts, because the transition maps are smooth.) Smooth real functions $f\colon M\to\R$ are the case $N=\R$. A **diffeomorphism** is a smooth bijection $F\colon M\to N$ whose inverse is also smooth.`,
      idea: String.raw`Smoothness is tested in coordinates, and the definition is consistent because changing a chart composes the representative with a transition map, which is a diffeomorphism between open sets of $\R^n$ and so preserves smoothness (chain rule from $\mathrm{pma}$ 9). A kink hiding at a point is invisible in one chart if that point is outside it, so a function must be checked in an atlas, not in one chart: $\theta$, the angle from the north pole, is perfectly smooth away from the poles but has a cone point at each. A smooth bijection can fail to be a diffeomorphism: $x\mapsto x^3$ is a smooth homeomorphism of $\R$ with a vertical tangent in its inverse at $0$, which is why "diffeomorphism" is a stronger word than "smooth homeomorphism".`,
      caption: String.raw`Choose a function on the sphere. Its **chart representatives** $f_N=f\circ\varphi_N^{-1}$ and $f_S=f\circ\varphi_S^{-1}$ are plotted along a line through the origin of each chart (the slice direction is the slider; the great circle it corresponds to is drawn on the sphere). The readout scans six slices of each chart for the largest second difference at step $h$ and at $h/4$: for a smooth function the two numbers agree, at a kink the second grows about four times. Pick $\theta$, $|z|$ or $|x|$ and find the creases. In the second mode drag $p$ along the graph of a bijection $F$ of the line and compare the slopes of $F$ and $F^{-1}$: for $x^3$ the inverse has slope $\infty$ at $0$.`,
      deps: ['mfd-1.2'],
      refs: ['Lee SM Ch. 2'],
      tags: ['smooth map', 'diffeomorphism', 'chart representative'],
      viz(v) {
        const mode = v.select('situation', [{ value: 'S2', label: 'functions on $S^2$' }, { value: 'R', label: 'bijections of $\\mathbb R$' }], 'S2');
        const fs = v.select('function $f$', Object.entries(FUNS).map(([value, o]) => ({ value, label: o.label })), 'poly');
        const gs = v.select('bijection $F$', Object.entries(LINE).map(([value, o]) => ({ value, label: o.label })), 'cube');
        const ang = v.slider('slice direction (degrees)', 0, 180, 25, { step: 1 });
        const S3 = v.stage3d({ range: 1.35, height: 330, yaw: -0.7, pitch: 0.35, axes: false, weight: 1, minWidth: 260, title: '$f$ on the sphere' });
        const A = v.stage({ x: [-2.2, 2.2], y: [-1, 1], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 't', ylabel: '' });
        const B = v.stage({ x: [-2.2, 2.2], y: [-1, 1], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 't', ylabel: '' });
        let curF = LINE.cube.F;
        const hp = A.handle(0.8, 0.51, { color: 'gold', label: 'p', constrain: (x) => { const t = clamp(x, -1.7, 1.7); return [t, curF(t)]; } });
        const cache = {};
        const scanS = (key) => {
          if (!cache[key]) {
            const f = FUNS[key].f, dirs = [0, 30, 60, 90, 120, 150].map((d) => (d * PI) / 180);
            const one = (chart) => (h) => Math.max(...dirs.map((a) => d2max((t) => f(chart([t * Math.cos(a), t * Math.sin(a)])), h)));
            const N = one(stNinv), S = one(stSinv);
            cache[key] = { N: [N(0.04), N(0.01)], S: [S(0.04), S(0.01)] };
          }
          return cache[key];
        };
        const scanL = (key) => {
          if (!cache['L' + key]) { const { F, Fi } = LINE[key]; cache['L' + key] = { F: [d2max(F, 0.04), d2max(F, 0.01)], Fi: [d2max(Fi, 0.04), d2max(Fi, 0.01)] }; }
          return cache['L' + key];
        };
        let info = null;
        v.render(() => {
          const R = mode.value === 'R';
          fs.el.hidden = R; ang.el.hidden = R; gs.el.hidden = !R; hp.visible = R;
          S3.el.style.display = R ? 'none' : '';
          if (!R) {
            const F = FUNS[fs.value], a = (ang.value * PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
            let mx = 1e-9, neg = false;
            for (let i = 0; i <= 40; i++) for (let j = 0; j <= 20; j++) { const p = sph((TAU * i) / 40, -PI / 2 + (PI * j) / 20); const y = F.f(p); mx = Math.max(mx, Math.abs(y)); if (y < -1e-9) neg = true; }
            S3.surface((th, ph) => sph(th, ph), [0, TAU], [-PI / 2 + 0.001, PI / 2 - 0.001], {
              nu: 44, nv: 22, alpha: 0.95, colorFn: (th, ph, p) => (neg ? v.diverge(F.f(p) / mx, 'blue', 'orange') : v.ramp(F.f(p) / mx, 'orange')),
            });
            S3.curve((s) => [Math.cos(a) * Math.cos(s), Math.sin(a) * Math.cos(s), Math.sin(s)].map((c) => c * 1.012), 0, TAU, { n: 120, color: 'ink', width: 2.2 });
            S3.dot([0, 0, 1], { r: 4, color: 'ink', label: 'N' }); S3.dot([0, 0, -1], { r: 4, color: 'ink', label: 'S' });
            const plot = (st, chart, col, title) => {
              const g = (t) => F.f(chart([t * ca, t * sa]));
              const ys = []; for (let i = 0; i <= 400; i++) ys.push(g(-2.2 + (4.4 * i) / 400));
              const a0 = Math.min(...ys), b0 = Math.max(...ys), pad = 0.12 * (b0 - a0) + 0.05;
              st.setView([-2.2, 2.2], [a0 - pad, b0 + pad]);
              st.setTitle(title); st.setLabels('$t$ along the slice', null);
              st.vband(-1.0001, -0.9999, { color: 'faint', alpha: 0.5 }); st.vband(0.9999, 1.0001, { color: 'faint', alpha: 0.5 });
              st.vline(0, { color: 'faint', width: 1, dash: [4, 4] });
              st.fn(g, { color: col, width: 2.6, n: 600, domain: [-2.2, 2.2] });
              st.dot(0, g(0), { r: 4.5, color: col, hollow: true });
            };
            plot(A, stNinv, 'accent', '$f_N=f\\circ\\varphi_N^{-1}$ (origin = south pole)');
            plot(B, stSinv, 'orange', '$f_S=f\\circ\\varphi_S^{-1}$ (origin = north pole)');
            info = { R, sc: scanS(fs.value), key: fs.value };
          } else {
            const L = LINE[gs.value]; curF = L.F;
            hp.set(clamp(hp.x, -1.7, 1.7), L.F(clamp(hp.x, -1.7, 1.7)));
            const x = hp.x, y = L.F(x), s = (L.F(x + 1e-6) - L.F(x - 1e-6)) / 2e-6;
            A.setView([-2.2, 2.2], [-2.2, 2.2]); B.setView([-2.2, 2.2], [-2.2, 2.2]);
            A.setTitle('$F$ and its tangent at $p$'); B.setTitle('the inverse $F^{-1}$ and its tangent at $F(p)$');
            A.setLabels('$x$', '$F(x)$'); B.setLabels('$y$', '$F^{-1}(y)$');
            A.fn(L.F, { color: 'accent', width: 2.6, domain: [-2.2, 2.2] }); A.line(-2.2, -2.2, 2.2, 2.2, { color: 'faint', width: 1, dash: [4, 4] });
            B.fn(L.Fi, { color: 'orange', width: 2.6, domain: [-2.2, 2.2], n: 800 }); B.line(-2.2, -2.2, 2.2, 2.2, { color: 'faint', width: 1, dash: [4, 4] });
            const tl = (st, x0, y0, m, col) => { if (Math.abs(m) < 40) st.line(x0 - 1.2, y0 - 1.2 * m, x0 + 1.2, y0 + 1.2 * m, { color: col, width: 1.6, dash: [5, 4] }); else st.vline(x0, { color: col, width: 1.6, dash: [5, 4] }); };
            A.clip(() => tl(A, x, y, s, 'green'));
            B.dot(y, x, { r: 7, color: 'gold' });
            B.clip(() => tl(B, y, x, Math.abs(s) < 1e-6 ? 1e9 : 1 / s, 'green'));
            info = { R, x, y, s, sc: scanL(gs.value), key: gs.value };
          }
        });
        v.readout(() => {
          if (!info) return '';
          const f = (x) => (Number.isFinite(x) ? (x > 9999 ? v.sci(x, 2) : minus(v.fix(x, 2))) : '\\infty');
          if (!info.R) {
            const { sc } = info, F = FUNS[info.key];
            const rN = sc.N[1] / sc.N[0], rS = sc.S[1] / sc.S[0];
            const bad = rN > 2 || rS > 2;
            return `Largest second difference over six slices, at $h=0.04$ → $h=0.01$: chart $N$: $${f(sc.N[0])}\\to${f(sc.N[1])}$ ($\\times${v.fix(rN, 1)}$), chart $S$: $${f(sc.S[0])}\\to${f(sc.S[1])}$ ($\\times${v.fix(rS, 1)}$).\n` + (bad ? `Growth by about $4$ means a kink: **not smooth** — ${F.where}.` : 'The numbers do not grow as $h$ shrinks: smooth in both charts, hence smooth on $S^2$.');
          }
          const { sc } = info, rF = sc.F[1] / sc.F[0], rI = sc.Fi[1] / sc.Fi[0];
          return `At $p=(${f(info.x)},${f(info.y)})$: $F'(x)=${f(info.s)}$ and $(F^{-1})'(y)=${Math.abs(info.s) < 1e-6 ? '\\infty' : f(1 / info.s)}$.\nSecond differences $h=0.04\\to0.01$: for $F$ $\\times${v.fix(rF, 1)}$, for $F^{-1}$ $\\times${v.fix(rI, 1)}$. ` + (rI > 2 ? '$F^{-1}$ has a kink-like singularity: $F$ is a smooth bijection but **not a diffeomorphism**.' : 'Both stay bounded: $F$ is a diffeomorphism of $\\mathbb R$.');
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Definition',
      name: 'Tangent vectors as derivations',
      statement: String.raw`Let $M$ be a smooth manifold and $p\in M$. A **tangent vector** at $p$ is a **derivation at $p$**: a linear map $D\colon C^\infty(M)\to\R$ satisfying the Leibniz rule $D(fg)=f(p)\,D(g)+g(p)\,D(f)$. The set $T_pM$ of all of them is a real vector space; if $(x^1,\dots,x^n)$ are coordinates around $p$ then the operators $\partial/\partial x^i|_p\colon f\mapsto\partial_i(f\circ\varphi^{-1})(\varphi(p))$ form a basis, so $\dim T_pM=n$. For $M\subset\R^N$ a submanifold, $D_v f=\nabla f\cdot v$ with $v$ in the usual tangent plane is such a derivation.`,
      idea: String.raw`The definition needs no ambient space: the Leibniz rule is the algebraic shadow of "first order". Linearity plus Leibniz forces $D(1)=0$, hence $D$ kills constants, and a Taylor expansion with remainder (Hadamard's lemma) in a chart shows that $Df$ depends only on the first partials of $f$ at $p$, so $D=\sum_i D(x^i)\,\partial_i$: dimension $n$. Conversely each directional derivative obeys Leibniz because it is differentiation of a product, by the product rule of ordinary calculus. Second derivatives do not satisfy the rule — they pick up the cross term $2\,f'g'$ — and that is exactly why they are not tangent vectors.`,
      caption: String.raw`Drag the base point $p$ on the longitude–latitude chart and the vector $v$ in the tangent plane (components along east and north). The readout evaluates the operator $D=D_v$ on two test functions $f,g$ and on their product $fg$ and checks $D(fg)=f(p)D(g)+g(p)D(f)$. Then switch the **operator** to a second derivative or to $D_v f+c\,f(p)$: both are linear, both fail Leibniz, and the residual is exactly the missing term. The green arrow in the plane is the tangent gradient of $f$; $D_vf$ is its pairing with $v$.`,
      deps: ['mfd-2.1'],
      refs: ['Lee SM Ch. 3'],
      tags: ['tangent vector', 'derivation'],
      viz(v) {
        const TF = {
          x: { label: '$x$', f: (p) => p[0] }, y: { label: '$y$', f: (p) => p[1] }, z: { label: '$z$', f: (p) => p[2] },
          xy: { label: '$xy$', f: (p) => p[0] * p[1] }, q: { label: '$x^2-z$', f: (p) => p[0] * p[0] - p[2] },
          s: { label: '$\\sin 3y$', f: (p) => Math.sin(3 * p[1]) },
        };
        const opts = Object.entries(TF).map(([value, o]) => ({ value, label: o.label }));
        const fsel = v.select('$f$', opts, 'x');
        const gsel = v.select('$g$', opts, 'q');
        const op = v.select('operator $D$', [{ value: 'D', label: 'directional derivative $D_v$' }, { value: 'D2', label: 'second derivative (not a derivation)' }, { value: 'Dc', label: '$D_v f + c\\,f(p)$' }], 'D');
        const A = v.stage({ x: [-PI, PI], y: [-PI / 2, PI / 2], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 250, xticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], yticks: [[-PI / 2, '−π/2'], [0, '0'], [PI / 2, 'π/2']], title: 'base point $p$ (longitude, latitude)', xlabel: 'λ', ylabel: 'φ' });
        const Bp = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: true, grid: true, height: 300, weight: 1, minWidth: 250, title: 'the tangent plane $T_pS^2$ (east, north)' });
        const S3 = v.stage3d({ range: 1.35, height: 300, yaw: -0.8, pitch: 0.4, axes: false, weight: 1, minWidth: 250, title: '$f$ on the sphere, $v$ and the tangent plane' });
        const P = A.handle(0.6, 0.45, { color: 'gold', label: 'p' });
        const W = Bp.handle(0.9, 0.5, { color: 'accent', label: 'v', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 1.5 ? [(1.5 * x) / r, (1.5 * y) / r] : [x, y]; } });
        let st = null;
        v.render(() => {
          const lon = P.x, lat = P.y, p = sph(lon, lat), e = eastAt(lon), n = northAt(lon, lat);
          const v3 = add3(sc3(e, W.x), sc3(n, W.y));
          const curve = (t) => nrm3(add3(p, sc3(v3, t)));
          const fn = TF[fsel.value].f, gn = TF[gsel.value].f, hh = 1e-5;
          const c = 0.7;
          const D = (f) => {
            if (op.value === 'D2') return (f(curve(1e-3)) - 2 * f(p) + f(curve(-1e-3))) / 1e-6;
            const d1 = (f(curve(hh)) - f(curve(-hh))) / (2 * hh);
            return op.value === 'Dc' ? d1 + c * f(p) : d1;
          };
          const fg = (q) => fn(q) * gn(q);
          const Df = D(fn), Dg = D(gn), Dfg = D(fg), rhs = fn(p) * Dg + gn(p) * Df;
          const lin = D((q) => 2 * fn(q) - 3 * gn(q)), linR = 2 * Df - 3 * Dg;
          // gradient of f tangent to the sphere
          const gr = [0, 1, 2].map((i) => { const a = [...p], b = [...p]; a[i] += 1e-5; b[i] -= 1e-5; return (fn(a) - fn(b)) / 2e-5; });
          const gt = sub3(gr, sc3(p, dot3(gr, p)));
          const ge = dot3(gt, e), gn2 = dot3(gt, n);
          // chart expression: D = (vE / cos lat) d/dlon + vN d/dlat
          const X = (l, ph) => sph(l, ph), hc = 1e-5;
          const dl = (fn(X(lon + hc, lat)) - fn(X(lon - hc, lat))) / (2 * hc), dp = (fn(X(lon, lat + hc)) - fn(X(lon, lat - hc))) / (2 * hc);
          const coord = (W.x / Math.cos(lat)) * dl + W.y * dp;
          // sphere
          let mx = 1e-9;
          for (let i = 0; i < 24; i++) for (let j = 0; j <= 12; j++) mx = Math.max(mx, Math.abs(fn(sph((TAU * i) / 24, -PI / 2 + (PI * j) / 12))));
          A.heat((x, y) => fn(sph(x, y)) / mx, { cmap: 'theme-diverging', range: [-1, 1], res: 3, key: 'f' + fsel.value });
          A.axes();
          A.dot(lon, lat, { r: 6, color: 'gold' });
          S3.surface((a, b) => sph(a, b), [0, TAU], [-PI / 2 + 0.001, PI / 2 - 0.001], { nu: 40, nv: 20, alpha: 0.95, colorFn: (a, b, q) => v.diverge(fn(q) / mx, 'blue', 'orange') });
          const sq = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => add3(add3(sc3(p, 1.02), sc3(e, 0.7 * a)), sc3(n, 0.7 * b)));
          S3.poly(sq, { fill: 'ink', fillAlpha: 0.12, color: 'ink', width: 1.2, bias: 0.05 });
          S3.curve((t) => sc3(curve(t * 0.9), 1.01), -1, 1, { n: 40, color: 'green', width: 2 });
          S3.arrow(p, add3(p, sc3(v3, 1)), { color: 'accent', width: 2.4 });
          S3.dot(p, { r: 5, color: 'gold' });
          // plane
          Bp.circle(0, 0, 1, { color: 'faint', width: 1, dash: [4, 4] });
          Bp.arrow(0, 0, ge, gn2, { color: 'green', width: 2.2 });
          Bp.arrow(0, 0, W.x, W.y, { color: 'accent', width: 2.6 });
          Bp.text('east', 1.12, -0.12, { size: 11, color: 'muted', align: 'center' }); Bp.text('north', 0.22, 1.45, { size: 11, color: 'muted', align: 'center' });
          Bp.line(-1.6, W.y, W.x, W.y, { color: 'accent', width: 1, dash: [3, 3], alpha: 0.5 });
                    st = { Df, Dg, Dfg, rhs, lin, linR, ge, gn2, coord, c };
        });
        v.legend([['accent', '$v\\in T_pS^2$'], ['green', 'tangent gradient of $f$'], ['green', 'curve with velocity $v$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(Math.abs(x) < 5e-6 ? 0 : x, 4));
          const res = st.Dfg - st.rhs, ok = Math.abs(res) < 1e-6;
          return `$D f=${f(st.Df)}$, $D g=${f(st.Dg)}$, $D(fg)=${f(st.Dfg)}$ and $f(p)Dg+g(p)Df=${f(st.rhs)}$: Leibniz residual $=${f(res)}$ ${ok ? '— **Leibniz holds**' : '— **Leibniz fails**'}.\nLinearity: $D(2f-3g)-(2Df-3Dg)=${f(st.lin - st.linR)}$. ` + (op.value === 'D' ? `In the chart $(\\lambda,\\varphi)$, $D=\\tfrac{v_E}{\\cos\\varphi}\\partial_\\lambda+v_N\\partial_\\varphi$ gives $${f(st.coord)}$, and $\\nabla_Tf\\cdot v=${f(st.ge * W.x + st.gn2 * W.y)}$.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Proposition',
      name: 'Tangent vectors as velocities of curves',
      statement: String.raw`Let $p\in M$ and let $\gamma\colon(-\varepsilon,\varepsilon)\to M$ be a smooth curve with $\gamma(0)=p$. Its **velocity** $\gamma'(0)\in T_pM$ is the derivation $f\mapsto (f\circ\gamma)'(0)$. Every tangent vector is the velocity of some curve, and two curves have the same velocity at $p$ exactly when in one (hence every) chart they have the same ordinary derivative at $0$: $(\varphi\circ\gamma_1)'(0)=(\varphi\circ\gamma_2)'(0)$. In particular $\gamma'(0)=\sum_i (x^i\circ\gamma)'(0)\,\partial_i|_p$.`,
      idea: String.raw`That $f\mapsto (f\circ\gamma)'(0)$ is a derivation is the product rule for the real functions $f\circ\gamma$ and $g\circ\gamma$. By the chain rule $(f\circ\gamma)'(0)=\sum_i\partial_i(f\circ\varphi^{-1})(\varphi(p))\,(x^i\circ\gamma)'(0)$, so the operator depends on $\gamma$ only through the numbers $(x^i\circ\gamma)'(0)$ — the second- and higher-order behaviour of the curve is invisible to every smooth function. Surjectivity: given $v=\sum v^i\partial_i$, the curve $t\mapsto\varphi^{-1}(\varphi(p)+tv)$ has exactly that velocity. So "equivalence class of curves with equal first-order jets" and "derivation" are the same notion of tangent vector.`,
      caption: String.raw`In the chart plane, drag $p$ and the tip of $v$. The straight line, a circle of adjustable curvature and a curve with a wiggle of adjustable amplitude all pass through $p$ with the same velocity $v$. Right: the graph of $f\circ\gamma_i$ for each curve — different curves, the same slope at $t=0$ (green dashed). Turn on the **different velocity** curve $\gamma_4$ (red) by tilting its velocity and watch its slope separate from the others: it is a different derivation.`,
      deps: ['mfd-2.2'],
      refs: ['Lee SM Ch. 3'],
      tags: ['tangent vector', 'curve', 'velocity'],
      viz(v) {
        const TF = {
          a: { label: '$x^2+y$', f: (x, y) => x * x + y }, b: { label: '$\\sin x\\cos y$', f: (x, y) => Math.sin(x) * Math.cos(y) },
          c: { label: '$xy$', f: (x, y) => x * y }, d: { label: '$e^{x}-y^2$', f: (x, y) => Math.exp(x) - y * y },
        };
        const fsel = v.select('test function $f$', Object.entries(TF).map(([value, o]) => ({ value, label: o.label })), 'b');
        const kap = v.slider('bend of $\\gamma_2$', -2, 2, 1.2, { step: 0.01 });
        const amp = v.slider('wiggle of $\\gamma_3$', -1.5, 1.5, 0.8, { step: 0.01 });
        const tilt = v.slider('tilt of $\\gamma_4$ velocity (degrees)', -90, 90, 0, { step: 1 });
        const A = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: true, grid: true, height: 340, weight: 1.05, minWidth: 280, title: 'a chart: curves through $p$' });
        const B = v.stage({ x: [-1, 1], y: [-2, 2], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 280, xlabel: '$t$', ylabel: '$f(\\gamma_i(t))$', title: '$f\\circ\\gamma_i$' });
        const P = A.handle(-0.3, -0.2, { color: 'gold', label: 'p' });
        let vx = 1.0, vy = 0.6;
        const T = A.handle(0.7, 0.4, { color: 'accent', label: 'v' });
        T.onDrag = () => { vx = T.x - P.x; vy = T.y - P.y; };
        const cols = ['accent', 'orange', 'purple', 'red'];
        let st = null;
        v.render(() => {
          T.set(P.x + vx, P.y + vy);
          const p = [P.x, P.y], vv = [vx, vy], vp = [-vy, vx], tl = (tilt.value * PI) / 180;
          const curves = [
            (t) => [p[0] + t * vv[0], p[1] + t * vv[1]],
            (t) => [p[0] + t * vv[0] + 0.5 * kap.value * t * t * vp[0], p[1] + t * vv[1] + 0.5 * kap.value * t * t * vp[1]],
            (t) => [p[0] + t * vv[0] + amp.value * (0.9 * t * t - 0.6 * t * t * t) * 1.0, p[1] + t * vv[1] + amp.value * (-0.7 * t * t + 0.9 * t * t * t * 1.0) + 0.5 * amp.value * Math.sin(5 * t) * t * t * 1.0],
            (t) => [p[0] + t * (vv[0] * Math.cos(tl) - vv[1] * Math.sin(tl)), p[1] + t * (vv[0] * Math.sin(tl) + vv[1] * Math.cos(tl))],
          ];
          const f = TF[fsel.value].f;
          curves.forEach((c, i) => {
            if (i === 3 && Math.abs(tilt.value) < 0.5) return;
            A.curve((t) => c(t), -1, 1, { n: 120, color: cols[i], width: 2.4, dash: i === 3 ? [6, 4] : false });
            [-0.5, 0.5].forEach((t) => A.dot(...c(t), { r: 3.2, color: cols[i] }));
          });
          A.arrow(p[0], p[1], p[0] + vx, p[1] + vy, { color: 'ink', width: 1.6 });
          const sl = [];
          const gr = [(f(p[0] + 1e-6, p[1]) - f(p[0] - 1e-6, p[1])) / 2e-6, (f(p[0], p[1] + 1e-6) - f(p[0], p[1] - 1e-6)) / 2e-6];
          const pred = gr[0] * vx + gr[1] * vy;
          const vals = [];
          curves.forEach((c, i) => {
            if (i === 3 && Math.abs(tilt.value) < 0.5) { sl.push(null); return; }
            const g = (t) => f(...c(t));
            sl.push((g(1e-5) - g(-1e-5)) / 2e-5);
            for (let k = 0; k <= 40; k++) vals.push(g(-1 + (2 * k) / 40));
          });
          const f0 = f(...p), lo = Math.min(...vals, f0 - 0.5), hi = Math.max(...vals, f0 + 0.5), pd = 0.08 * (hi - lo);
          B.setView([-1, 1], [lo - pd, hi + pd]);
          B.line(-1, f0 - pred, 1, f0 + pred, { color: 'green', width: 1.6, dash: [5, 4] });
          curves.forEach((c, i) => { if (i === 3 && Math.abs(tilt.value) < 0.5) return; B.fn((t) => f(...c(t)), { color: cols[i], width: 2.2, domain: [-1, 1], n: 160, dash: i === 3 ? [6, 4] : false }); });
          B.dot(0, f0, { r: 5, color: 'gold' });
          st = { sl, pred };
        });
        v.legend([['accent', '$\\gamma_1$ straight'], ['orange', '$\\gamma_2$ bent'], ['purple', '$\\gamma_3$ wiggly'], ['red', '$\\gamma_4$ other velocity', { dash: true }], ['green', '$\\nabla f\\cdot v$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 5));
          const nm = ['\\gamma_1', '\\gamma_2', '\\gamma_3', '\\gamma_4'];
          const parts = st.sl.map((s, i) => (s === null ? null : `$(f\\circ${nm[i]})'(0)=${f(s)}$`)).filter(Boolean);
          const spread = Math.max(...st.sl.slice(0, 3)) - Math.min(...st.sl.slice(0, 3));
          return `${parts.join(', ')}; chart prediction $\\sum_i\\partial_if\\,v^i=${f(st.pred)}$.\nThe three curves with velocity $v$ agree to within $${v.sci(spread + 1e-16, 2)}$ — one derivation, however they bend.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Differential of a smooth map',
      statement: String.raw`Let $F\colon M\to N$ be smooth and $p\in M$. The **differential** (or pushforward) of $F$ at $p$ is the linear map $dF_p\colon T_pM\to T_{F(p)}N$ defined on derivations by $(dF_p\,v)(g)=v(g\circ F)$ for $g\in C^\infty(N)$. Equivalently, $dF_p(\gamma'(0))=(F\circ\gamma)'(0)$ for every curve $\gamma$ through $p$. In charts its matrix is the Jacobian $\bigl(\partial\hat F^j/\partial x^i\bigr)$ of the coordinate representative $\hat F$, with respect to the coordinate bases.`,
      idea: String.raw`$dF_p v$ is a derivation at $F(p)$ because $g\mapsto v(g\circ F)$ is linear and satisfies the Leibniz rule: $(gh)\circ F=(g\circ F)(h\circ F)$ and $v$ is itself a derivation. Taking $v=\gamma'(0)$ gives $(g\circ F\circ\gamma)'(0)=((F\circ\gamma)'(0))(g)$, the velocity of the image curve; and the chain rule in a chart shows the matrix is the Jacobian. The differential is the "best linear approximation" that makes sense without any ambient space.`,
      caption: String.raw`Choose a map $F$ from the plane (the domain panel) to the plane (the image panel), drag $p$ and the vector $v$. The curve $\gamma$ through $p$ with velocity $v$ is carried to the curve $F\circ\gamma$ and the arrow $v$ to the arrow $dF_p\,v$ (the matrix is in the readout). A small circle in the domain goes to a curved oval, and the ellipse $dF_p$(circle) (dashed green) approximates it: the differential is the linearization. At the fold $F=(x,y^2-1)$ the ellipse collapses to a segment at $y=0$.`,
      deps: ['mfd-2.2'],
      refs: ['Lee SM Ch. 3'],
      tags: ['differential', 'pushforward', 'Jacobian'],
      viz(v) {
        const msel = v.select('map $F$', Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label })), 'swirl');
        const bend = v.slider('bend of $\\gamma$', -2, 2, 0.8, { step: 0.01 });
        const A = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 350, weight: 1, minWidth: 280, title: 'domain: $p$, $v$ and $\\gamma$' });
        const B = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 350, weight: 1, minWidth: 280, title: 'image: $F(p)$, $dF_p\\,v$ and $F\\circ\\gamma$' });
        const P = A.handle(0.5, 0.3, { color: 'gold', label: 'p' });
        let vx = 0.9, vy = 0.5;
        const T = A.handle(1.4, 0.8, { color: 'accent', label: 'v' });
        T.onDrag = () => { vx = T.x - P.x; vy = T.y - P.y; };
        let viewKey = '', st = null;
        const gfun = (u, w) => Math.sin(u) + u * w;
        v.render(() => {
          T.set(P.x + vx, P.y + vy);
          const M = MAPS[msel.value], F = M.F;
          if (viewKey !== msel.value) { viewKey = msel.value; const vw = imageView(F, M.dom ? [M.dom[0], M.dom[1]] : [-2, 2], [-2, 2]); B.setView(vw.x, vw.y); }
          gridImage(A, (x, y) => [x, y], [-2.2, 2.2], [-2.2, 2.2], 11, { alpha: 0.4 });
          gridImage(B, F, [-2.2, 2.2], [-2.2, 2.2], 11, { alpha: 0.45 });
          const p = [P.x, P.y], vv = [vx, vy], vp = [-vy, vx];
          const gam = (t) => [p[0] + t * vv[0] + 0.5 * bend.value * t * t * vp[0], p[1] + t * vv[1] + 0.5 * bend.value * t * t * vp[1]];
          A.curve(gam, -1, 1, { n: 100, color: 'orange', width: 2.4 });
          B.curve((t) => F(...gam(t)), -1, 1, { n: 100, color: 'orange', width: 2.4 });
          const J = jac(F, p[0], p[1]), Fp = F(p[0], p[1]), dv = mulv(J, vv);
          // small circle and its linearisation
          const rr = 0.35;
          A.curve((a) => [p[0] + rr * Math.cos(a), p[1] + rr * Math.sin(a)], 0, TAU, { n: 80, color: 'purple', width: 1.8 });
          B.curve((a) => F(p[0] + rr * Math.cos(a), p[1] + rr * Math.sin(a)), 0, TAU, { n: 80, color: 'purple', width: 1.8 });
          B.curve((a) => [Fp[0] + J[0][0] * rr * Math.cos(a) + J[0][1] * rr * Math.sin(a), Fp[1] + J[1][0] * rr * Math.cos(a) + J[1][1] * rr * Math.sin(a)], 0, TAU, { n: 80, color: 'green', width: 1.8, dash: [5, 4] });
          A.arrow(p[0], p[1], p[0] + vx, p[1] + vy, { color: 'accent', width: 2.8 });
          B.arrow(Fp[0], Fp[1], Fp[0] + dv[0], Fp[1] + dv[1], { color: 'accent', width: 2.8 });
          B.dot(Fp[0], Fp[1], { r: 6, color: 'gold' });
          // checks
          const fd = [(F(...gam(1e-5))[0] - F(...gam(-1e-5))[0]) / 2e-5, (F(...gam(1e-5))[1] - F(...gam(-1e-5))[1]) / 2e-5];
          const lhs = (() => { const h = 1e-5, a = (t) => gfun(...F(p[0] + t * vx, p[1] + t * vy)); return (a(h) - a(-h)) / (2 * h); })();
          const gr = [(gfun(Fp[0] + 1e-6, Fp[1]) - gfun(Fp[0] - 1e-6, Fp[1])) / 2e-6, (gfun(Fp[0], Fp[1] + 1e-6) - gfun(Fp[0], Fp[1] - 1e-6)) / 2e-6];
          st = { J, dv, fd, lhs, rhs: gr[0] * dv[0] + gr[1] * dv[1], det: det2(J) };
        });
        v.legend([['accent', '$v$ and $dF_p v$'], ['orange', '$\\gamma$ and $F\\circ\\gamma$'], ['purple', 'small circle and its image'], ['green', '$dF_p$(circle)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 4));
          return `$dF_p=${pmat(st.J, 3)}$, $\\det=${f(st.det)}$, $dF_p\\,v=${pvec(st.dv, 3)}$ — and $(F\\circ\\gamma)'(0)=(${f(st.fd[0])},${f(st.fd[1])})$ by finite differences.\nDerivation test with $g(u,w)=\\sin u+uw$: $v(g\\circ F)=${f(st.lhs)}$ and $(dF_pv)(g)=${f(st.rhs)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Chain rule for differentials',
      statement: String.raw`Let $F\colon M\to N$ and $G\colon N\to P$ be smooth maps and $p\in M$. Then $G\circ F$ is smooth and
$$d(G\circ F)_p=dG_{F(p)}\circ dF_p\colon T_pM\to T_{G(F(p))}P,$$
and $d(\mathrm{id}_M)_p=\mathrm{id}_{T_pM}$. Consequently a diffeomorphism $F$ has invertible differential at every point, with $(dF_p)^{-1}=d(F^{-1})_{F(p)}$, and $\dim M=\dim N$.`,
      idea: String.raw`With the derivation definition it is one line: $d(G\circ F)_p(v)(h)=v(h\circ G\circ F)=dF_p(v)(h\circ G)=dG(dF_p v)(h)$ — each differential just moves the function one step back. In coordinates it says that the Jacobian of a composite is the product of the Jacobians, the chain rule of multivariable calculus ($\mathrm{pma}$ 9.15), which is why the abstract differential is consistent with the old one. Applied to $F^{-1}\circ F=\mathrm{id}$ it shows diffeomorphisms have invertible differentials.`,
      caption: String.raw`Choose two maps $F,G$ of the plane and push the tangent vector $v$ (drag $p$ and the tip of $v$) through $F$ into the middle panel and through $G$ into the right panel. The readout compares $dG\,dF\,v$ with the velocity of the composite curve $(G\circ F\circ\gamma)'(0)$ computed by finite differences, and the product of the two Jacobians with the Jacobian of $G\circ F$. Take the fold for $G$ and see rank drop: a composite cannot have larger rank than either factor.`,
      deps: ['mfd-2.4'],
      see: ['pma-9.15'],
      refs: ['Lee SM Ch. 3'],
      tags: ['chain rule', 'differential', 'Jacobian'],
      viz(v) {
        const fo = Object.entries(MAPS).map(([value, o]) => ({ value, label: o.label }));
        const fsel = v.select('$F$', fo, 'swirl');
        const gsel = v.select('$G$', fo, 'sine');
        const X = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: false, height: 300, weight: 1, minWidth: 220, title: '$M$: $p$, $v$' });
        const Y = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 300, weight: 1, minWidth: 220, title: '$N$: $dF_p\\,v$' });
        const Z = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 300, weight: 1, minWidth: 220, title: '$P$: $dG\\,dF_p\\,v=d(G\\circ F)_p\\,v$' });
        const P = X.handle(0.4, -0.2, { color: 'gold', label: 'p' });
        let vx = 0.8, vy = 0.7;
        const T = X.handle(1.2, 0.5, { color: 'accent', label: 'v' });
        T.onDrag = () => { vx = T.x - P.x; vy = T.y - P.y; };
        let key = '', st = null;
        v.render(() => {
          T.set(P.x + vx, P.y + vy);
          const F = MAPS[fsel.value].F, G = MAPS[gsel.value].F, GF = (x, y) => G(...F(x, y));
          if (key !== fsel.value + gsel.value) { key = fsel.value + gsel.value; const a = imageView(F, [-2.2, 2.2], [-2.2, 2.2]), b = imageView(GF, [-2.2, 2.2], [-2.2, 2.2]); Y.setView(a.x, a.y); Z.setView(b.x, b.y); }
          gridImage(X, (x, y) => [x, y], [-2.2, 2.2], [-2.2, 2.2], 11, { alpha: 0.4 });
          gridImage(Y, F, [-2.2, 2.2], [-2.2, 2.2], 11, { alpha: 0.45, cx: 'teal', cy: 'muted' });
          gridImage(Z, GF, [-2.2, 2.2], [-2.2, 2.2], 11, { alpha: 0.45, cx: 'teal', cy: 'muted' });
          const p = [P.x, P.y], vv = [vx, vy];
          const gam = (t) => [p[0] + t * vv[0], p[1] + t * vv[1]];
          X.curve(gam, -1, 1, { n: 2, color: 'orange', width: 2.2 });
          Y.curve((t) => F(...gam(t)), -1, 1, { n: 100, color: 'orange', width: 2.2 });
          Z.curve((t) => GF(...gam(t)), -1, 1, { n: 100, color: 'orange', width: 2.2 });
          const JF = jac(F, p[0], p[1]), q = F(p[0], p[1]), JG = jac(G, q[0], q[1]), r = G(q[0], q[1]), JGF = jac(GF, p[0], p[1]);
          const dv = mulv(JF, vv), ddv = mulv(JG, dv);
          X.arrow(p[0], p[1], p[0] + vx, p[1] + vy, { color: 'accent', width: 2.8 }); X.dot(p[0], p[1], { r: 5.5, color: 'gold' });
          Y.arrow(q[0], q[1], q[0] + dv[0], q[1] + dv[1], { color: 'accent', width: 2.8 }); Y.dot(q[0], q[1], { r: 5.5, color: 'gold' });
          Z.arrow(r[0], r[1], r[0] + ddv[0], r[1] + ddv[1], { color: 'accent', width: 2.8 }); Z.dot(r[0], r[1], { r: 5.5, color: 'gold' });
          const h = 1e-5, a = GF(...gam(h)), b = GF(...gam(-h));
          const prod = mul22(JG, JF);
          st = { JF, JG, JGF, prod, ddv, fd: [(a[0] - b[0]) / (2 * h), (a[1] - b[1]) / (2 * h)], err: Math.max(...[0, 1].flatMap((i) => [0, 1].map((j) => Math.abs(prod[i][j] - JGF[i][j])))) };
        });
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 4));
          return `$J_G\\,J_F=${pmat(st.JG, 2)}${pmat(st.JF, 2)}=${pmat(st.prod, 3)}$ and $J_{G\\circ F}=${pmat(st.JGF, 3)}$ (largest entry difference $${v.sci(st.err + 1e-16, 2)}$).\n$dG\\,dF\\,v=(${f(st.ddv[0])},${f(st.ddv[1])})$ and $(G\\circ F\\circ\\gamma)'(0)=(${f(st.fd[0])},${f(st.fd[1])})$. Determinants: $\\det J_G\\cdot\\det J_F=${f(det2(st.JG) * det2(st.JF))}=\\det J_{G\\circ F}=${f(det2(st.JGF))}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Definition',
      name: 'Coordinate vectors and change of coordinates',
      statement: String.raw`If $(U,\varphi=(x^1,\dots,x^n))$ is a chart and $p\in U$, the **coordinate vectors** are $\partial/\partial x^i|_p=d(\varphi^{-1})_{\varphi(p)}(e_i)\in T_pM$: the velocities of the coordinate lines through $p$. They form a basis of $T_pM$, and a tangent vector is written $v=\sum_i v^i\,\partial/\partial x^i|_p$ with $v^i=v(x^i)$. If $(\tilde x^j)$ is another chart then
$$\frac{\partial}{\partial x^i}\Big|_p=\sum_j\frac{\partial\tilde x^j}{\partial x^i}(p)\,\frac{\partial}{\partial\tilde x^j}\Big|_p,\qquad \tilde v^j=\sum_i\frac{\partial\tilde x^j}{\partial x^i}(p)\,v^i,$$
the Jacobian of the transition map $\tilde\varphi\circ\varphi^{-1}$ acting on components.`,
      idea: String.raw`Coordinate vectors are the differential of the chart inverse applied to the standard basis, so they are a basis because $d(\varphi^{-1})$ is an isomorphism (chain rule, 2.5). The component $v^i=v(x^i)$ because $\partial_j x^i=\delta^i_j$. Changing charts inserts the transition map $\tilde\varphi\circ\varphi^{-1}$, and its differential — the Jacobian — converts components; the vector itself, a derivation, does not change. The classical statement "a vector transforms like $dx$" is exactly this.`,
      caption: String.raw`Pick a chart on the plane (polar, a parabolic shear, or a linear skew), drag $p$ and the tip of the fixed vector $v$. Left: the coordinate curves of the chart, the coordinate vectors $\partial_u,\partial_w$ at $p$ (orange, purple) and the Cartesian $\partial_x,\partial_y$ (grey). Right: the chart plane with the components $(v^u,v^w)=J\,v$ as a vector. The dashed parallelogram builds $v$ out of $v^u\partial_u$ and $v^w\partial_w$. Near the origin in polar coordinates $\partial_\theta$ becomes tiny and $v^\theta$ huge: the vector is fixed, the components change.`,
      deps: ['mfd-2.4'],
      refs: ['Lee SM Ch. 3'],
      tags: ['coordinate vector', 'change of coordinates', 'Jacobian'],
      viz(v) {
        const CH = {
          polar: { label: 'polar $(r,\\theta)$', names: ['r', '\\theta'], Psi: (x, y) => [Math.hypot(x, y), Math.atan2(y, x)], Phi: (u, w) => [u * Math.cos(w), u * Math.sin(w)], us: [0.5, 1, 1.5, 2, 2.5, 3], ws: Array.from({ length: 12 }, (_, i) => (i * PI) / 6), ur: [0, 3.2], wr: [0, TAU], view: [[-0.2, 3.6], [-0.5, 6.8]] },
          shear: { label: 'parabolic shear $(x+y^2,\\,y)$', names: ['u', 'w'], Psi: (x, y) => [x + y * y, y], Phi: (u, w) => [u - w * w, w], us: [-3, -2, -1, 0, 1, 2, 3], ws: [-2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5], ur: [-3.5, 3.5], wr: [-2.4, 2.4], view: [[-4, 4], [-3, 3]] },
          lin: { label: 'linear skew $(2x+y,\\,y-x)$', names: ['u', 'w'], Psi: (x, y) => [2 * x + y, y - x], Phi: (u, w) => [(u - w) / 3, (u + 2 * w) / 3], us: [-4, -3, -2, -1, 0, 1, 2, 3, 4], ws: [-4, -3, -2, -1, 0, 1, 2, 3, 4], ur: [-5, 5], wr: [-5, 5], view: [[-5, 5], [-5, 5]] },
        };
        const csel = v.select('chart', Object.entries(CH).map(([value, o]) => ({ value, label: o.label })), 'polar');
        const A = v.stage({ x: [-3.4, 3.4], y: [-3.4, 3.4], equal: true, axes: false, height: 380, weight: 1.15, minWidth: 300, title: 'the plane: coordinate curves and vectors at $p$' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], axes: true, grid: true, height: 380, weight: 0.9, minWidth: 260, title: 'the chart plane: the components of $v$' });
        const P = A.handle(1.3, 0.9, { color: 'gold', label: 'p', constrain: (x, y) => [clamp(x, -3.2, 3.2), clamp(y, -3.2, 3.2)] });
        let vx = 0.9, vy = -0.3;
        const T = A.handle(2.2, 0.6, { color: 'accent', label: 'v' });
        T.onDrag = () => { vx = T.x - P.x; vy = T.y - P.y; };
        let st = null, key = '';
        v.render(() => {
          T.set(P.x + vx, P.y + vy);
          const C = CH[csel.value];
          if (key !== csel.value) { key = csel.value; B.setView(C.view[0], C.view[1]); B.setLabels(`$${C.names[0]}$`, `$${C.names[1]}$`); }
          // coordinate curves
          C.us.forEach((u) => A.curve((w) => C.Phi(u, w), C.wr[0], C.wr[1], { n: 120, color: 'orange', width: 0.9, alpha: 0.35 }));
          C.ws.forEach((w) => A.curve((u) => C.Phi(u, w), C.ur[0], C.ur[1], { n: 120, color: 'purple', width: 0.9, alpha: 0.35 }));
          const p = [P.x, P.y], q = C.Psi(...p), Jp = jac(C.Psi, p[0], p[1]);
          const dPhi = jac(C.Phi, q[0], q[1]), du = [dPhi[0][0], dPhi[1][0]], dw = [dPhi[0][1], dPhi[1][1]];
          const comp = mulv(Jp, [vx, vy]);
          A.arrow(p[0], p[1], p[0] + 1, p[1], { color: 'muted', width: 1.4 }); A.arrow(p[0], p[1], p[0], p[1] + 1, { color: 'muted', width: 1.4 });
          A.tex('\\partial_x', p[0] + 1.2, p[1] - 0.18, { size: 13, color: 'muted' }); A.tex('\\partial_y', p[0] + 0.2, p[1] + 1.15, { size: 13, color: 'muted' });
          A.arrow(p[0], p[1], p[0] + du[0], p[1] + du[1], { color: 'orange', width: 2.6 });
          A.arrow(p[0], p[1], p[0] + dw[0], p[1] + dw[1], { color: 'purple', width: 2.6 });
          A.tex(`\\partial_{${C.names[0]}}`, p[0] + du[0] * 1.12, p[1] + du[1] * 1.12 - 0.12, { color: 'orange', size: 14 });
          A.tex(`\\partial_{${C.names[1]}}`, p[0] + dw[0] * 1.12, p[1] + dw[1] * 1.12 + 0.12, { color: 'purple', size: 14 });
          // parallelogram
          const m1 = [p[0] + comp[0] * du[0], p[1] + comp[0] * du[1]];
          A.segment(p, m1, { color: 'orange', width: 1.4, dash: [4, 3] }); A.segment(m1, [p[0] + vx, p[1] + vy], { color: 'purple', width: 1.4, dash: [4, 3] });
          A.arrow(p[0], p[1], p[0] + vx, p[1] + vy, { color: 'accent', width: 3 });
          A.dot(p[0], p[1], { r: 5.5, color: 'gold' });
          // chart plane
          C.us.forEach((u) => B.line(u, C.wr[0], u, C.wr[1], { color: 'orange', width: 0.9, alpha: 0.3 }));
          C.ws.forEach((w) => B.line(C.ur[0], w, C.ur[1], w, { color: 'purple', width: 0.9, alpha: 0.3 }));
          B.arrow(q[0], q[1], q[0] + comp[0], q[1] + comp[1], { color: 'accent', width: 2.8 });
          B.segment(q, [q[0] + comp[0], q[1]], { color: 'orange', width: 1.4, dash: [4, 3] }); B.segment([q[0] + comp[0], q[1]], [q[0] + comp[0], q[1] + comp[1]], { color: 'purple', width: 1.4, dash: [4, 3] });
          B.dot(q[0], q[1], { r: 5.5, color: 'gold' });
          const rec = [comp[0] * du[0] + comp[1] * dw[0], comp[0] * du[1] + comp[1] * dw[1]];
          st = { Jp, comp, q, rec, C, du, dw };
        });
        v.readout(() => {
          if (!st) return '';
          const f = (x) => minus(v.fix(x, 3)), { C } = st;
          return `$p$ has coordinates $(${C.names[0]},${C.names[1]})=(${f(st.q[0])},${f(st.q[1])})$. Cartesian components $v=(${f(vx)},${f(vy)})$; chart components $\\begin{pmatrix}v^{${C.names[0]}}\\\\v^{${C.names[1]}}\\end{pmatrix}=${pmat(st.Jp, 3)}v=(${f(st.comp[0])},${f(st.comp[1])})$.\nCheck: $v^{${C.names[0]}}\\partial_{${C.names[0]}}+v^{${C.names[1]}}\\partial_{${C.names[1]}}=(${f(st.rec[0])},${f(st.rec[1])})$ — the same vector. $|\\partial_{${C.names[0]}}|=${f(Math.hypot(...st.du))}$, $|\\partial_{${C.names[1]}}|=${f(Math.hypot(...st.dw))}$.`;
        });
      },
    },
  ],
};
