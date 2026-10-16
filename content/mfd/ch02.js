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
  ],
};
