// Manifolds & Riemannian Geometry — Chapter 4: Vector fields and flows (items 4.7–4.12; 4.1–4.6 in ch04.js)
import {
  PI, TAU, clamp, minus, flowN, flow2, bracket2, PAIRS, DISTS, bracket3, nrm3, cross3, dot3, sub3, sc3, add3,
} from './ch04.shared.js';

const f3 = (v, x) => minus(v.fix(Math.abs(x) < 5e-5 ? 0 : x, 3));
const css = (c) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

/** Flow of a planar field for time t, falling back to the start point on escape (these fields are complete for small t). */
const fl = (X, p, t) => flow2(X, p, t, 80) || p;
/** Differential of the time-t flow applied to w at p: d/de flow(p + e w) by central differences. */
function dflow(X, p, t, w, e = 1e-4) {
  const a = fl(X, [p[0] + e * w[0], p[1] + e * w[1]], t), b = fl(X, [p[0] - e * w[0], p[1] - e * w[1]], t);
  return [(a[0] - b[0]) / (2 * e), (a[1] - b[1]) / (2 * e)];
}
/** Pull-back of Y along the flow of X: (phi_t^* Y)_p = d(phi_{-t}) Y(phi_t p). */
function pullback(X, Y, p, t) {
  const q = fl(X, p, t), w = Y(q[0], q[1]);
  return dflow(X, q, -t, w);
}

// ---- 4.8: fields X for the Lie derivative
const XS = {
  rot: { label: 'rotation $(-y,x)$', f: (x, y) => [-y, x] },
  dil: { label: 'dilation $\\tfrac12(x,y)$', f: (x, y) => [0.5 * x, 0.5 * y] },
  shear: { label: 'shear $(y,0)$', f: (x, y) => [y, 0] },
  wave: { label: '$(0.6\\sin y,\\ 0.6\\cos x)$', f: (x, y) => [0.6 * Math.sin(y), 0.6 * Math.cos(x)] },
};
const fFun = (x, y) => Math.sin(1.2 * x) * Math.cos(1.1 * y) + 0.15 * x;
const fGrad = (x, y) => [1.2 * Math.cos(1.2 * x) * Math.cos(1.1 * y) + 0.15, -1.1 * Math.sin(1.2 * x) * Math.sin(1.1 * y)];
const Y8 = (x, y) => [0.8 * Math.cos(y), 0.8 * Math.sin(x)];

export default {
  collection: 'mfd',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'The bracket measures non-commuting flows',
      statement: String.raw`Let $X,Y$ be smooth vector fields with flows $\theta,\psi$, and $p\in M$. Following $X$ for time $t$, then $Y$ for time $t$, then $X$ backwards for time $t$, then $Y$ backwards for time $t$ returns a point $c(t)=\psi_{-t}\theta_{-t}\psi_t\theta_t(p)$ with
$$c(t)=p+t^2\,[X,Y]_p+O(t^3)\quad(t\to0)$$
in any chart. In particular $[X,Y]_p=\tfrac12 c''(0)$ for the curve $c$ (which satisfies $c(0)=p$, $c'(0)=0$), and if the flows commute, $\theta_s\psi_t=\psi_t\theta_s$ for all $s,t$, the loop closes and $[X,Y]=0$.`,
      idea: String.raw`Expand each flow in a Taylor series in the time variable in a chart: $\theta_t(q)=q+tX(q)+\tfrac12t^2(DX\cdot X)(q)+\cdots$. Composing the four maps, the first-order terms cancel in pairs (that is the loop closing to first order) and the $t^2$ terms leave $DY\cdot X-DX\cdot Y$, which is the coordinate formula for $[X,Y]$ (4.6). The converse direction, that vanishing bracket gives commuting flows, is 4.10; the link with differentiation along the flow is 4.9. The sign depends on the order of the four legs; with the order above the displacement is $+t^2[X,Y]$.`,
      caption: String.raw`Choose a pair of fields, drag $p$ and the time $t$. The loop goes along $X$ (blue), $Y$ (orange), back along $X$ (dashed blue) and back along $Y$ (dashed orange); the end point (red) misses $p$ by about $t^2[X,Y]_p$ (green marker). Right: the gap $|c(t)-p|$ against $t$ on log axes lies on a line of slope $2$ whenever $[X,Y]_p\ne0$; for a pair of commuting fields it sits at numerical noise.`,
      deps: ['mfd-4.6', 'mfd-4.3'],
      refs: ['Lee SM Ch. 9'],
      tags: ['Lie bracket', 'commutator of flows'],
      viz(v) {
        const sel = v.select('pair $(X,Y)$', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'shear');
        const tS = v.slider('time $t$', 0.05, 1.2, 0.9, { step: 0.01 });
        const L = v.stage({ x: [-2.2, 2.6], y: [-1.6, 2.4], equal: true, axes: 'box', gutter: true, height: 360, weight: 1.15, minWidth: 340, xlabel: 'x', ylabel: 'y', title: 'the four-leg loop' });
        const R = v.stage({ x: [0.02, 1.2], y: [1e-10, 10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, weight: 0.95, minWidth: 300, xlabel: 't', ylabel: 'gap |c(t) − p|', title: 'gap against $t$ (log–log)' });
        const p = L.handle(0.2, 0.3, { color: 'gold', label: 'p', constrain: { x: [-2, 2.4], y: [-1.4, 2.2] } });
        v.legend([['blue', 'along $X$'], ['orange', 'along $Y$'], ['green', '$p+t^2[X,Y]$', { dot: true }], ['red', 'end point', { dot: true }]]);
        let st = null;
        const leg = (F, a, t, n = 24) => { const o = []; for (let i = 0; i <= n; i++) o.push(fl(F, a, (t * i) / n)); return o; };
        const loop = (X, Y, p0, t) => {
          const a = fl(X, p0, t), b = fl(Y, a, t), c = fl(X, b, -t), d = fl(Y, c, -t);
          return [p0, a, b, c, d];
        };
        v.render(() => {
          const P = PAIRS[sel.value], X = P.X, Y = P.Y, t = tS.value, p0 = [p.x, p.y];
          const [, a, b, c, d] = loop(X, Y, p0, t);
          L.path(leg(X, p0, t), { color: 'blue', width: 2.4 });
          L.path(leg(Y, a, t), { color: 'orange', width: 2.4 });
          L.path(leg(X, b, -t), { color: 'blue', width: 2.4, dash: true });
          L.path(leg(Y, c, -t), { color: 'orange', width: 2.4, dash: true });
          const br = bracket2(X, Y, p.x, p.y);
          L.dot(p.x + t * t * br[0], p.y + t * t * br[1], { r: 6, color: 'green', hollow: true });
          L.dot(d[0], d[1], { r: 4.5, color: 'red' });
          L.dot(p.x, p.y, { r: 5, color: 'gold' });
          const FL = 1e-11, pts = [];
          for (let k = 0; k <= 36; k++) {
            const tt = Math.exp(Math.log(0.02) + (Math.log(1.2) - Math.log(0.02)) * (k / 36)), e = loop(X, Y, p0, tt)[4];
            pts.push([tt, Math.max(FL, Math.hypot(e[0] - p0[0], e[1] - p0[1]))]);
          }
          R.path(pts, { color: 'accent', width: 2.4 });
          const B = Math.hypot(br[0], br[1]);
          if (B > 1e-6) R.fn((x) => B * x * x, { color: 'green', dash: true, width: 1.6, domain: [0.02, 1.2], n: 40 });
          R.dot(t, Math.max(FL, Math.hypot(d[0] - p.x, d[1] - p.y)), { r: 5, color: 'red' });
          st = { br, gap: [(d[0] - p.x) / (t * t), (d[1] - p.y) / (t * t)], B, note: P.note };
        });
        v.readout(() => `${st.note}.\n$(c(t)-p)/t^2=(${f3(v, st.gap[0])},\\ ${f3(v, st.gap[1])})$ against $[X,Y]_p=(${f3(v, st.br[0])},\\ ${f3(v, st.br[1])})$ ${st.B < 1e-6 ? '— the bracket vanishes and the loop closes (gap on the plot is just integrator noise, floored at $10^{-11}$)' : '— they agree up to $O(t)$; the dashed green line $|[X,Y]_p|\\,t^2$ has slope $2$'}.`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Definition',
      name: 'Lie derivative',
      statement: String.raw`Let $X$ be a smooth vector field with flow $\theta$ and let $T$ be a smooth function, vector field, or covariant tensor field. The **Lie derivative** of $T$ along $X$ is the rate of change of $T$ when it is dragged back along the flow:
$$(\mathcal L_XT)_p=\frac{d}{dt}\Big|_{t=0}(\theta_t^*T)_p,$$
where $\theta_t^*f=f\circ\theta_t$, $(\theta_t^*Y)_p=d(\theta_{-t})_{\theta_t(p)}Y_{\theta_t(p)}$ and $(\theta_t^*g)_p(w,w)=g_{\theta_t(p)}(d\theta_tw,d\theta_tw)$. For functions $\mathcal L_Xf=Xf$. For a metric the derivative vanishes exactly when the flow acts by isometries ($X$ is a Killing field).`,
      idea: String.raw`The definition uses only the flow, so it needs no chart and no extra structure; the price is that one must know how to transport each kind of object. A function is transported by composition. A vector is transported by the differential of the inverse flow (the minus sign, so that the whole assignment is a pull-back along $\theta_t$). A covariant tensor is transported by evaluating on pushed-forward arguments. In each case the dependence on $t$ is smooth because $\theta$ is smooth (4.3), so the derivative at $0$ exists. The three cases are computed in coordinates in 4.9 and in chapters 6 and 8.`,
      caption: String.raw`Pick the kind of object and the field $X$; the slider $t$ is the flow time of the difference quotient $(\theta_t^*T-T)/t$. Left: the object (contours of $f$; the field $Y$ in blue and its pull-back in orange; or the unit circles of $g$ in blue and of $\theta_t^*g$ in orange). Right: the difference quotient as a heat map or arrow field. It converges to the exact $\mathcal L_XT$ as $t\to0$ (the readout gives the largest deviation over a grid); for the metric and a rotation it is zero for every $t$: a Killing field.`,
      deps: ['mfd-4.3'],
      refs: ['Lee SM Ch. 9'],
      tags: ['Lie derivative', 'pull-back'],
      credit: 'W. Ślebodziński, 1931; named after Lie by D. van Dantzig',
      verify: true,
      viz(v) {
        const kind = v.select('object', [{ value: 'f', label: 'function $f$' }, { value: 'Y', label: 'vector field $Y$' }, { value: 'g', label: 'metric $g$' }], 'f');
        const xs = v.select('field $X$', Object.entries(XS).map(([value, o]) => ({ value, label: o.label })), 'rot');
        const tS = v.slider('time $t$', -1.2, 1.2, 0.2, { step: 0.01 });
        const aS = v.slider('direction of $w$ (metric)', 0, PI, 0.6, { step: 0.01 });
        const L = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 320, xlabel: 'x', ylabel: 'y', title: 'the object, dragged back along the flow' });
        const R = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 320, xlabel: 'x', ylabel: 'y', title: 'difference quotient $(\\theta_t^*T-T)/t$' });
        let dev = 0, mx = 0;
        v.render(() => {
          const X = XS[xs.value].f, t = tS.value === 0 ? 1e-3 : tS.value, k = kind.value;
          aS.el.hidden = k !== 'g';
          const w = [Math.cos(aS.value), Math.sin(aS.value)];
          const xk = xs.value;
          // left: flow lines of X faintly
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
            const s0 = [i * 1.1, j * 1.1], a = [], b = [s0];
            let q = s0; for (let m = 0; m < 25; m++) { q = flow2(X, q, 0.12, 8); if (!q) break; b.push(q); }
            q = s0; for (let m = 0; m < 25; m++) { q = flow2(X, q, -0.12, 8); if (!q) break; a.push(q); }
            L.clip(() => L.path(a.reverse().concat(b), { color: 'faint', width: 1, alpha: 0.5 }));
          }
          let quot, exact;
          if (k === 'f') {
            quot = (x, y) => { const q = fl(X, [x, y], t); return (fFun(q[0], q[1]) - fFun(x, y)) / t; };
            exact = (x, y) => { const g = fGrad(x, y), a = X(x, y); return g[0] * a[0] + g[1] * a[1]; };
            L.contour((x, y) => fFun(x, y), [-0.9, -0.45, 0, 0.45, 0.9], { color: 'accent', width: 1.4 });
            L.contour((x, y) => { const q = fl(X, [x, y], t); return fFun(q[0], q[1]); }, [-0.9, -0.45, 0, 0.45, 0.9], { color: 'orange', width: 1.4, alpha: 0.8 });
            R.heat(quot, { range: [-2, 2], cmap: 'diverging', res: 6, key: `f|${xk}|${t.toFixed(3)}` });
            R.contour(exact, [-1.5, -1, -0.5, 0.5, 1, 1.5], { color: 'ink', width: 1, alpha: 0.4 });
            mx = 2;
          } else if (k === 'Y') {
            quot = (x, y) => { const a = pullback(X, Y8, [x, y], t), b = Y8(x, y); return [(a[0] - b[0]) / t, (a[1] - b[1]) / t]; };
            exact = (x, y) => bracket2(X, Y8, x, y);
            L.field(Y8, { color: 'blue', spacing: 40 });
            L.field((x, y) => pullback(X, Y8, [x, y], t), { color: 'orange', spacing: 40, alpha: 0.6 });
            R.field(quot, { color: 'orange', spacing: 40, normalize: false, scale: 14 });
            R.field(exact, { color: 'green', spacing: 40, normalize: false, scale: 14, alpha: 0.5, width: 3 });
          } else {
            const q2 = (x, y, ww, tt) => { const d = dflow(X, [x, y], tt, ww); return d[0] * d[0] + d[1] * d[1]; };
            quot = (x, y) => (q2(x, y, w, t) - 1) / t;
            exact = (x, y) => { const e = 1e-4, a = X(x + e * w[0], y + e * w[1]), b = X(x - e * w[0], y - e * w[1]), D = [(a[0] - b[0]) / (2 * e), (a[1] - b[1]) / (2 * e)]; return 2 * (w[0] * D[0] + w[1] * D[1]); };
            for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
              const cx = i * 1.2, cy = j * 1.2, c1 = [], c2 = [];
              for (let m = 0; m <= 48; m++) {
                const th = (TAU * m) / 48, u = [Math.cos(th), Math.sin(th)], d = dflow(X, [cx, cy], t, u), r = 1 / Math.max(1e-6, Math.hypot(d[0], d[1]));
                c1.push([cx + 0.42 * u[0], cy + 0.42 * u[1]]); c2.push([cx + 0.42 * r * u[0], cy + 0.42 * r * u[1]]);
              }
              L.path(c1, { color: 'blue', width: 1.2, alpha: 0.7 }); L.path(c2, { color: 'orange', width: 1.8 });
            }
            R.heat(quot, { range: [-2, 2], cmap: 'diverging', res: 6, key: `g|${xk}|${t.toFixed(3)}|${aS.value.toFixed(3)}` });
            mx = 2;
          }
          let d = 0;
          for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
            const x = i * 0.7, y = j * 0.7, a = quot(x, y), b = exact(x, y);
            d = Math.max(d, Array.isArray(a) ? Math.hypot(a[0] - b[0], a[1] - b[1]) : Math.abs(a - b));
          }
          dev = d;
        });
        v.readout(() => {
          const t = tS.value;
          const what = { f: '$\\mathcal L_Xf=Xf$ (colour: quotient; grey contours: exact)', Y: '$\\mathcal L_XY=[X,Y]$ (green: exact; orange arrows: quotient)', g: '$(\\mathcal L_Xg)(w,w)=2g(w,DX\\,w)$ for the Euclidean $g$ and the direction $w$ above' }[kind.value];
          return `${what}.\nWith $t=${v.fix(t, 2)}$ the quotient differs from the exact Lie derivative by at most $${v.sci(Math.max(dev, 1e-12), 2)}$ on the grid — the error is proportional to $t$ (first-order difference quotient).` + (kind.value === 'g' && xs.value === 'rot' ? '\nRotation: the quotient is $0$ for every $t$ — a Killing field.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'The Lie derivative of a vector field is the bracket',
      statement: String.raw`For smooth vector fields $X,Y$ on $M$,
$$\mathcal L_XY=[X,Y],$$
that is, $\dfrac d{dt}\big|_{t=0}\,d(\theta_{-t})_{\theta_t(p)}\bigl(Y_{\theta_t(p)}\bigr)=X(Yf)-Y(Xf)$ acting on functions, in terms of the flow $\theta$ of $X$. Consequently $\mathcal L_XY=-\mathcal L_YX$, and $\mathcal L_XY\equiv0$ if and only if $Y$ is invariant under the flow of $X$.`,
      idea: String.raw`Differentiate $f(\,d\theta_{-t}Y_{\theta_t p})$ at $t=0$ by the product rule. Writing $f\circ\theta_{-t}$ as a smooth family $f_t$ with $f_0=f$ and $\partial_tf_t|_0=-Xf$, one gets $Y_p$ differentiated against $f_t$ plus $Y$ differentiated along the flow; these two terms are $-Y(Xf)$ and $X(Yf)$. Equivalently, in a chart, the displacement $c(t)-p$ of 4.7 is $\int$ of the same expression: the pull-back of $Y$ differs from $Y$ at first order by $t\,(DY\cdot X-DX\cdot Y)$. So the geometric notion "rate of change of $Y$ along the flow" and the algebraic commutator are the same thing.`,
      caption: String.raw`Green: the bracket $[X,Y]$ from the coordinate formula. Gold: the Lie derivative computed from the flow alone, as the difference quotient of the pulled-back field. They coincide as $t\to0$. Right: the error at $p$ against $t$ on log axes for the one-sided quotient $(\theta_t^*Y-Y)/t$ (slope $1$) and the symmetric quotient $(\theta_t^*Y-\theta_{-t}^*Y)/2t$ (slope $2$).`,
      deps: ['mfd-4.8', 'mfd-4.6'],
      refs: ['Lee SM Ch. 9'],
      tags: ['Lie derivative', 'bracket'],
      viz(v) {
        const sel = v.select('pair $(X,Y)$', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'nonlin');
        const tS = v.slider('time $t$', 0.05, 1, 0.3, { step: 0.01 });
        const sym = v.toggle('symmetric quotient', true);
        const L = v.stage({ x: [-2.4, 2.4], y: [-2.4, 2.4], equal: true, axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 320, xlabel: 'x', ylabel: 'y', title: '$[X,Y]$ (green) and the flow quotient (gold)' });
        const R = v.stage({ x: [0.03, 1], y: [1e-9, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 300, xlabel: 't', ylabel: 'error at p', title: 'error of the quotient at $p$' });
        const p = L.handle(0.8, 0.7, { color: 'gold', label: 'p', constrain: { x: [-2.2, 2.2], y: [-2.2, 2.2] } });
        let st = null;
        v.render(() => {
          const P = PAIRS[sel.value], X = P.X, Y = P.Y, t = tS.value;
          const q1 = (x, y, tt) => { const a = pullback(X, Y, [x, y], tt), b = Y(x, y); return [(a[0] - b[0]) / tt, (a[1] - b[1]) / tt]; };
          const q2 = (x, y, tt) => { const a = pullback(X, Y, [x, y], tt), b = pullback(X, Y, [x, y], -tt); return [(a[0] - b[0]) / (2 * tt), (a[1] - b[1]) / (2 * tt)]; };
          const Q = (x, y, tt) => (sym.value ? q2(x, y, tt) : q1(x, y, tt));
          const zero = sel.value === 'coord' || sel.value === 'rotdil';
          L.field((x, y) => bracket2(X, Y, x, y), { color: 'green', spacing: 36, normalize: false, scale: 14, width: 4, alpha: 0.55 });
          L.field((x, y) => Q(x, y, t), { color: 'gold', spacing: 36, normalize: false, scale: 14, width: 1.5, alpha: 1 });
          if (zero) L.text('$[X,Y]\\equiv0$: nothing to see, the quotient is 0 too', 0, 2.1, { size: 14, color: 'green', align: 'center' });
          L.dot(p.x, p.y, { r: 5, color: 'gold' });
          const br = bracket2(X, Y, p.x, p.y), err = (tt, s) => { const a = (s ? q2 : q1)(p.x, p.y, tt); return Math.max(1e-9, Math.hypot(a[0] - br[0], a[1] - br[1])); };
          const e1 = [], e2 = [];
          for (let k = 0; k <= 24; k++) { const tt = Math.exp(Math.log(0.03) + (Math.log(1) - Math.log(0.03)) * (k / 24)); e1.push([tt, err(tt, false)]); e2.push([tt, err(tt, true)]); }
          R.path(e1, { color: 'orange', width: 2.2 }); R.path(e2, { color: 'blue', width: 2.2 });
          R.dot(t, err(t, sym.value), { r: 5, color: 'gold' });
          const a = Q(p.x, p.y, t);
          st = { br, a, err: err(t, sym.value), zero };
        });
        v.legend([['orange', 'one-sided (slope 1)'], ['blue', 'symmetric (slope 2)']]);
        v.readout(() => `At $p$: $[X,Y]_p=(${f3(v, st.br[0])},\\ ${f3(v, st.br[1])})$ and the pulled-back quotient at $t=${v.fix(tS.value, 2)}$ gives $(${f3(v, st.a[0])},\\ ${f3(v, st.a[1])})$; difference $${v.sci(st.err, 2)}$.\nThe two fields agree as $t\\to0$, as the theorem asserts, with no use of the coordinate formula on the flow side.`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Commuting flows and coordinate frames',
      statement: String.raw`Let $X,Y$ be smooth vector fields on $M$ with flows $\theta,\psi$. The following are equivalent: (a) $[X,Y]=0$; (b) $Y$ is invariant under the flow of $X$, i.e. $d(\theta_t)Y=Y\circ\theta_t$; (c) the flows commute, $\theta_s\circ\psi_t=\psi_t\circ\theta_s$ wherever defined. Moreover, if $X,Y$ are linearly independent at $p$ and $[X,Y]=0$, there are coordinates $(s,t)$ near $p$ with $X=\partial_s$, $Y=\partial_t$, given by $(s,t)\mapsto\theta_s\psi_t(p)$. More generally, linearly independent commuting fields $X_1,\dots,X_k$ are the first $k$ coordinate fields of a chart.`,
      idea: String.raw`(a)$\Leftrightarrow$(b) is 4.9: $\mathcal L_XY=[X,Y]=0$ says that $\theta_t^*Y$ does not change, so $Y$ is carried to itself. (b)$\Rightarrow$(c): $\psi_t(q)$ and $\theta_{s}$ then carry the integral curve of $Y$ through $q$ to the integral curve through $\theta_s(q)$ and uniqueness of integral curves gives the commutation. For the chart, $F(s,t)=\theta_s\psi_t(p)$ has $\partial_sF=X$ trivially, and $\partial_tF=d\theta_s(Y)=Y$ by (b); the inverse function theorem applies since $X,Y$ are independent. If the bracket is nonzero this fails: $\partial_tF=d\theta_s(Y)\ne Y$ and the grids built in the two orders differ.`,
      caption: String.raw`The grids are $F_A(s,t)=\theta_s\psi_t(q)$ (blue; lines $s$ and $t$ constant) and $F_B(s,t)=\psi_t\theta_s(q)$ (dashed orange): flow along $Y$ first or along $X$ first. For commuting pairs (coordinate fields; rotation and dilation, giving a log-polar grid) the two grids are the same and form a coordinate chart; otherwise they come apart and the readout shows the largest mismatch and the failure of $\partial_tF_A=Y$. Drag $q$, enlarge the patch with $S$.`,
      deps: ['mfd-4.7'],
      see: ['mfd-4.9'],
      refs: ['Lee SM Ch. 9'],
      tags: ['commuting flows', 'coordinates'],
      viz(v) {
        const sel = v.select('pair $(X,Y)$', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'rotdil');
        const SS = v.slider('patch size $S$', 0.2, 1.4, 0.8, { step: 0.02 });
        const L = v.stage({ x: [-3.2, 3.2], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 420, weight: 1, minWidth: 360, xlabel: 'x', ylabel: 'y', title: 'coordinate grids from the two orders of flowing' });
        const q = L.handle(1, 0, { color: 'gold', label: 'q', constrain: { x: [-2.4, 2.4], y: [-2.4, 2.4] } });
        let st = null;
        v.legend([['blue', '$X$ first (lines of constant $s$, $t$)'], ['orange', '$Y$ first, dashed']]);
        v.render(() => {
          const P = PAIRS[sel.value], X = P.X, Y = P.Y, S = SS.value, q0 = [q.x, q.y];
          const FA = (s, t) => fl(X, fl(Y, q0, t), s), FB = (s, t) => fl(Y, fl(X, q0, s), t);
          const N = 6, M = 30;
          for (let i = -N; i <= N; i++) {
            const c = (i / N) * S;
            const sl = [], tl = [], sl2 = [], tl2 = [];
            for (let m = 0; m <= M; m++) { const u = -S + (2 * S * m) / M; sl.push(FA(c, u)); tl.push(FA(u, c)); sl2.push(FB(c, u)); tl2.push(FB(u, c)); }
            L.path(sl, { color: 'blue', width: 1.6 }); L.path(tl, { color: 'blue', width: 1.6 });
            L.path(sl2, { color: 'orange', width: 1.5, dash: true }); L.path(tl2, { color: 'orange', width: 1.5, dash: true });
          }
          const a = FA(S, S), b = FB(S, S);
          L.dot(a[0], a[1], { r: 5, color: 'blue' }); L.dot(b[0], b[1], { r: 5, color: 'orange', hollow: true });
          L.dot(q.x, q.y, { r: 5, color: 'gold' });
          let mm = 0;
          for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const A = FA((i / 4) * S, (j / 4) * S), B = FB((i / 4) * S, (j / 4) * S); mm = Math.max(mm, Math.hypot(A[0] - B[0], A[1] - B[1])); }
          // dt F_A at (S,S) versus Y(F_A)
          const e = 1e-4, A1 = FA(S, S + e), A0 = FA(S, S - e), Yv = Y(a[0], a[1]), dt = [(A1[0] - A0[0]) / (2 * e), (A1[1] - A0[1]) / (2 * e)];
          const det = X(q.x, q.y)[0] * Y(q.x, q.y)[1] - X(q.x, q.y)[1] * Y(q.x, q.y)[0];
          st = { mm, res: Math.hypot(dt[0] - Yv[0], dt[1] - Yv[1]), det, br: bracket2(X, Y, q.x, q.y) };
        });
        v.readout(() => `$\\det[X\\,|\\,Y]_q=${f3(v, st.det)}$ ${Math.abs(st.det) < 0.05 ? '(nearly dependent: no chart here)' : '(independent, so $F$ is a local diffeomorphism)'}; $[X,Y]_q=(${f3(v, st.br[0])},\\ ${f3(v, st.br[1])})$.\nMismatch between the two orders $\\max|F_A-F_B|=${v.sci(Math.max(st.mm, 1e-12), 2)}$; failure of $\\partial_tF_A=Y$ at the far corner: $${v.sci(Math.max(st.res, 1e-12), 2)}$ — ${st.mm < 1e-5 && st.res < 1e-4 ? '**commuting: a genuine coordinate chart with $X=\\partial_s$, $Y=\\partial_t$**' : '**non-commuting: the grid cannot be completed**'}.`);
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Definition',
      name: 'Distributions and involutivity',
      statement: String.raw`A (tangent) **distribution** of rank $k$ on $M$ is a rank-$k$ subbundle $D\subset TM$: a choice of a $k$-dimensional subspace $D_p\subset T_pM$ at each point, depending smoothly on $p$, equivalently locally spanned by $k$ pointwise independent smooth vector fields $X_1,\dots,X_k$. $D$ is **involutive** if $[X,Y]$ is a section of $D$ whenever $X,Y$ are. It suffices to test this on a local frame: $[X_i,X_j]\in D$ for all $i,j$. In $\R^3$ a plane field is $D=\ker\alpha$ for a $1$-form $\alpha$, and $D$ is involutive iff $\alpha\wedge d\alpha=0$.`,
      idea: String.raw`The bracket of two sections of $D$ always exists as a vector field on $M$; involutivity asks that it again stays in $D$. Because $[fX,gY]=fg[X,Y]+f(Xg)Y-g(Yf)X$ (4.6), the extra terms lie in $D$, so checking brackets of a frame $X_i$ is enough: the bracket of general sections is a $C^\infty$-combination of the $[X_i,X_j]$ plus terms in $D$. The reason to care is the next item: involutivity is a necessary condition for $D$ to be tangent to a family of surfaces, because brackets of fields tangent to a submanifold are tangent to it (naturality of the bracket).`,
      caption: String.raw`Choose a plane field in $\R^3$ and a height $z_0$. Left: small discs show the planes $D_p$ on a lattice at that height (they are spanned by the fields $X_1$ blue, $X_2$ orange drawn at the probe point $p$, which you move with the sliders); the red arrow is their bracket $[X_1,X_2]_p$. Right: the heat map is the normal component $\alpha([X_1,X_2])/|\alpha|$ of the bracket over the whole slice $z=z_0$. It is identically $0$ for $\ker dz$, $\ker(dz-d\tfrac{x^2+y^2}2)$ and $\ker(x\,dy-y\,dx)$ (involutive) and nonzero for the two contact-type fields $\ker(dz-y\,dx)$ and $\ker(\cos z\,dx+\sin z\,dy)$.`,
      deps: ['mfd-4.6'],
      refs: ['Lee SM Ch. 19'],
      tags: ['distribution', 'involutive'],
      viz(v) {
        const sel = v.select('plane field', Object.entries(DISTS).map(([value, o]) => ({ value, label: o.label })), 'contact');
        const zS = v.slider('height $z_0$', -1.5, 1.5, 0.3, { step: 0.05 });
        const pxS = v.slider('probe $p_x$', -1.4, 1.4, 0.6, { step: 0.05 });
        const pyS = v.slider('probe $p_y$', -1.4, 1.4, -0.3, { step: 0.05 });
        const S3 = v.stage3d({ range: 1.7, height: 400, yaw: -0.65, pitch: 0.5, axes: true, labels: ['x', 'y', 'z'], weight: 1.2, minWidth: 340, title: 'the planes $D_p$ at height $z_0$' });
        const H = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: 'box', gutter: true, height: 400, weight: 0.9, minWidth: 300, xlabel: 'x', ylabel: 'y', title: 'normal part of $[X_1,X_2]$ on the slice' });
        let st = null;
        const frame = (D, p) => {
          const a = nrm3(D.X1(...p)); let b = D.X2(...p); b = sub3(b, sc3(a, dot3(a, b))); return [a, nrm3(b)];
        };
        const normN = (D, p) => nrm3(D.alpha(...p));
        v.legend([['blue', '$X_1$'], ['orange', '$X_2$'], ['red', '$[X_1,X_2]$']]);
        v.render(() => {
          const D = DISTS[sel.value], z = zS.value;
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
            const c = [i * 0.62, j * 0.62, z], [a, b] = frame(D, c), ring = [];
            for (let m = 0; m < 16; m++) { const th = (TAU * m) / 16; ring.push(add3(c, add3(sc3(a, 0.27 * Math.cos(th)), sc3(b, 0.27 * Math.sin(th))))); }
            S3.poly(ring, { fill: 'accent', fillAlpha: 0.35, color: 'accent' });
          }
          const p = [pxS.value, pyS.value, z], x1 = D.X1(...p), x2 = D.X2(...p), br = bracket3(D, p);
          const k = 0.7;
          S3.arrow(p, add3(p, sc3(nrm3(x1), k)), { color: 'blue', width: 2.6 }); S3.arrow(p, add3(p, sc3(nrm3(x2), k)), { color: 'orange', width: 2.6 });
          const nb = Math.hypot(...br); if (nb > 1e-6) S3.arrow(p, add3(p, sc3(br, k / Math.max(1, nb))), { color: 'red', width: 3 });
          S3.dot(p, { color: 'gold', r: 5 });
          const val = (x, y) => dot3(bracket3(D, [x, y, z]), normN(D, [x, y, z]));
          H.heat(val, { range: [-1.5, 1.5], cmap: 'diverging', res: 6, key: `${sel.value}|${z.toFixed(3)}` });
          H.dot(p[0], p[1], { r: 5, color: 'gold' });
          let mx = 0; for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) mx = Math.max(mx, Math.abs(val(i * 0.25, j * 0.25)));
          st = { br, nrm: val(p[0], p[1]), mx, form: D.form };
        });
        v.readout(() => `$D=\\ker(${st.form})$. At $p$: $[X_1,X_2]_p=(${f3(v, st.br[0])},\\ ${f3(v, st.br[1])},\\ ${f3(v, st.br[2])})$, normal component $${f3(v, st.nrm)}$.\nLargest $|\\alpha([X_1,X_2])|/|\\alpha|$ on the slice: $${v.sci(Math.max(st.mx, 1e-12), 2)}$ — ${st.mx < 1e-5 ? '**involutive** (the bracket stays in the planes)' : '**not involutive** (the bracket leaves the planes)'}.`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Theorem',
      name: 'Frobenius theorem',
      statement: String.raw`Let $D\subset TM$ be a smooth distribution of rank $k$. The following are equivalent: (a) $D$ is involutive; (b) $D$ is **integrable**, i.e. through every point there is an integral manifold, an immersed $k$-dimensional submanifold $N$ with $T_qN=D_q$ for all $q\in N$; (c) around every point there is a **flat chart** $(x^1,\dots,x^n)$ in which $D=\operatorname{span}(\partial_1,\dots,\partial_k)$. In this case $M$ is partitioned into maximal connected integral manifolds (a foliation), and the integral manifolds in a flat chart are the slices $x^{k+1},\dots,x^n=\text{const}$. For $k=1$ every line field is integrable (the integral curves of 4.2).`,
      idea: String.raw`(b)$\Rightarrow$(a): brackets of fields tangent to a submanifold stay tangent, by the naturality of the bracket. (a)$\Rightarrow$(c) is built from flows. Choose a frame which, after a change of the spanning fields, has pairwise zero brackets (possible exactly because $D$ is involutive: one corrects the frame by a $C^\infty$-matrix, induction on $k$ using the flow-box theorem). Commuting independent fields are the first $k$ coordinate fields of a chart (4.10), and its slices are integral manifolds. In the picture below the same mechanism appears as: build a patch $F(s,t)=\psi_t\theta_s(p)$ by flowing along $X_1$ and then $X_2$; its tangent plane is $D$ exactly when $d\psi_t(X_1)$ stays in $D$, which is involutivity.`,
      caption: String.raw`Choose a plane field and a base point $p$ (sliders). The surface is the patch $F(s,t)=\psi_t\theta_s(p)$, $|s|,|t|\le S$, obtained by flowing along $X_1$ and then $X_2$; its colour is the angle by which its tangent plane misses $D$ (green: tangent, red: transverse). For the involutive fields the patch is an integral surface — a horizontal sheet for $\ker dz$, a paraboloid for $\ker(dz-x\,dx-y\,dy)$, a half-plane through the $z$-axis for $\ker(x\,dy-y\,dx)$. For the contact field $\ker(dz-y\,dx)$ no surface fits: the patch twists away from $D$ and the misalignment grows with $S$. Right: that misalignment against $S$.`,
      deps: ['mfd-4.11', 'mfd-4.10'],
      refs: ['Lee SM Ch. 19'],
      tags: ['Frobenius', 'foliation', 'integrability'],
      credit: 'F. Deahna 1840; A. Clebsch 1866; F. G. Frobenius 1877 (Pfaffian systems)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Frobenius_theorem_(differential_topology)' },
      viz(v) {
        const sel = v.select('plane field', Object.entries(DISTS).map(([value, o]) => ({ value, label: o.label })), 'dh');
        const SS = v.slider('patch size $S$', 0.2, 1.6, 0.9, { step: 0.02 });
        const pxS = v.slider('base point $p_x$', -1, 1, 0.3, { step: 0.05 });
        const pyS = v.slider('base point $p_y$', -1, 1, -0.2, { step: 0.05 });
        const S3 = v.stage3d({ range: 1.9, height: 420, yaw: -0.6, pitch: 0.5, axes: true, labels: ['x', 'y', 'z'], weight: 1.25, minWidth: 340, title: 'the patch $F(s,t)=\\psi_t\\theta_s(p)$' });
        const R = v.stage({ x: [0, 1.6], y: [0, 1.6], axes: 'box', gutter: true, height: 420, weight: 0.8, minWidth: 280, xlabel: 'patch size S', ylabel: 'misalignment', title: 'misalignment of the patch with $D$' });
        const F3 = (G, p, t) => (t === 0 ? p.slice() : flowN((q) => G(...q), p, t, Math.max(6, Math.ceil(Math.abs(t) * 50)), 50) || p);
        let st = null;
        const patch = (D, p0, s, t) => F3(D.X2, F3(D.X1, p0, s), t);
        // misalignment at (s,t): sin of angle between d_s F and D (alpha normalised)
        const mis = (D, p0, s, t) => {
          const e = 1e-4, a = patch(D, p0, s + e, t), b = patch(D, p0, s - e, t), q = patch(D, p0, s, t);
          const ds = nrm3(sub3(a, b)), n = nrm3(D.alpha(...q));
          return Math.abs(dot3(ds, n));
        };
        v.render(() => {
          const D = DISTS[sel.value], S = SS.value, p0 = [pxS.value, pyS.value, 0];
          const cA = v.rgb('green'), cB = v.rgb('red');
          S3.surface((s, t) => patch(D, p0, s, t), [-S, S], [-S, S], { nu: 22, nv: 22, alpha: 0.95, colorFn: (s, t) => { const m = clamp(mis(D, p0, s, t) * 3, 0, 1); return css(cA.map((c, i) => (i < 3 ? c * (1 - m) + cB[i] * m : 1))); } });
          S3.dot(p0, { color: 'gold', r: 5 });
          const X1 = D.X1(...p0), X2 = D.X2(...p0);
          S3.arrow(p0, add3(p0, sc3(nrm3(X1), 0.6)), { color: 'blue', width: 2.4 }); S3.arrow(p0, add3(p0, sc3(nrm3(X2), 0.6)), { color: 'orange', width: 2.4 });
          const pts = []; let top = 0;
          for (let k = 0; k <= 16; k++) {
            const SSk = (1.6 * k) / 16; let m = 0;
            for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) m = Math.max(m, mis(D, p0, (i / 3) * SSk, (j / 3) * SSk));
            pts.push([SSk, m]); top = Math.max(top, m);
          }
          R.setView([0, 1.6], [0, Math.max(0.2, top * 1.15)]);
          R.path(pts, { color: 'red', width: 2.4 });
          const cur = pts[Math.round((S / 1.6) * 16)];
          R.dot(S, cur ? cur[1] : 0, { r: 5, color: 'gold' });
          st = { max: cur ? cur[1] : 0, br: bracket3(D, p0), form: D.form };
        });
        v.readout(() => `$D=\\ker(${st.form})$; patch of size $S=${v.fix(SS.value, 2)}$ about $p$.\nLargest misalignment $|\\hat n\\cdot\\partial_sF|$ over the patch: $${v.sci(Math.max(st.max, 1e-12), 2)}$ — ${st.max < 1e-5 ? '**the patch is tangent to $D$: an integral surface** (involutive)' : '**the patch leaves $D$: no integral surface through this construction** (not involutive)'}.`);
      },
    },
  ],
};
