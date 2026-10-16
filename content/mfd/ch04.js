// Manifolds & Riemannian Geometry — Chapter 4: Vector fields and flows (items 4.1–4.4, 4.6; 4.7–4.12 in ch04-b.js)
import {
  PI, TAU, clamp, minus, flowN, flow2, bracket2, PAIRS, cutoff,
} from './ch04.shared.js';

const f3 = (v, x) => minus(v.fix(Math.abs(x) < 5e-5 ? 0 : x, 3));

/** Points of the integral curve through p of X, sampled with n RK4 steps up to time T (stops at escape). */
function traj(X, p, T, n = 400) {
  const out = [p.slice()];
  let q = p.slice();
  const h = T / n;
  for (let i = 0; i < n; i++) {
    q = flowN((a) => X(a[0], a[1]), q, h, 1, 1e3);
    if (!q) break;
    out.push(q);
  }
  return out;
}

// ---- 4.1: planar fields
const F41 = {
  rot: { label: 'rotation', f: (x, y) => [-y, x] },
  sad: { label: 'saddle', f: (x, y) => [x, -y] },
  wave: { label: 'wave', f: (x, y) => [1, 0.9 * Math.sin(2.2 * x)] },
  spir: { label: 'spiral sink', f: (x, y) => [-0.3 * x - y, x - 0.3 * y] },
  jump: { label: 'jump (not smooth)', f: (x, y) => [1, x > 0.3 ? 0.9 : -0.9] },
};

// ---- 4.2: fields for integral curves
const F42 = {
  pend: { label: 'pendulum $(y,-\\sin x)$', f: (x, y) => [y, -Math.sin(x)] },
  cell: { label: 'cells $(\\sin y,\\sin x)$', f: (x, y) => [Math.sin(y), Math.sin(x)] },
  spir: { label: 'spiral sink', f: (x, y) => [-0.25 * x - y, x - 0.25 * y] },
};

// ---- 4.3: complete and incomplete fields
const F43 = {
  swirl: { label: 'complete: $(-y+0.3\\sin x,\\ x)$', f: (x, y) => [-y + 0.3 * Math.sin(x), x] },
  blow: { label: 'incomplete: $(x^2,\\ -y)$', f: (x, y) => [x * x, -y] },
};

export default {
  collection: 'mfd',
  chapter: 4,
  title: 'Vector fields and flows',
  summary: String.raw`A vector field integrates to a flow, a one-parameter family of diffeomorphisms, at least locally and for all time when the field has compact support. Near a non-zero point every field looks constant. The Lie bracket measures how far two flows are from commuting, Lie derivatives differentiate anything along a flow, and Frobenius’ theorem says exactly when a field of planes is tangent to a family of surfaces.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Vector fields',
      statement: String.raw`A **vector field** on a smooth manifold $M$ is a map $X$ that assigns to every $p\in M$ a tangent vector $X_p\in T_pM$. It is a **smooth vector field** if $X\colon M\to TM$ is smooth, equivalently if in every chart $(x^i)$ the components in $X=X^i\,\partial_i$ are smooth functions. Equivalently, $X$ is a smooth **section** of the tangent bundle: $\pi\circ X=\mathrm{id}_M$. The smooth vector fields form a real vector space and a module over $C^\infty(M)$, denoted $\mathfrak X(M)$; each $X$ acts on functions as the derivation $(Xf)(p)=X_pf$.`,
      idea: String.raw`A section of $TM\to M$ is just a choice of one vector in each fibre. In the local trivialisation by a chart, $TM|_U\cong U\times\R^n$ (2.7), so the section is the graph of the vector-valued function $p\mapsto(X^1(p),\dots,X^n(p))$ and "smooth section" means "smooth components". The chart-independence of that condition is the smoothness of the transition maps of $TM$: the components change by the Jacobian, which is smooth. The module structure is pointwise multiplication; and since $X_p$ is a derivation at $p$ (2.2), $Xf$ is again a function, smooth when $X$ and $f$ are.`,
      caption: String.raw`Choose a field on the plane (a model chart) and drag $p$. Left: the arrows and the streamlines they generate. Right: the **section** — the components $X^1,X^2$ along the horizontal line through $p$, which is the graph of $X$ in the trivialised bundle $\R^2\times\R^2$. The last field has a jump: its components are discontinuous, it is a section of $TM$ only in the set-theoretic sense, and the readout reports the jump across $p$.`,
      deps: ['mfd-2.7'],
      refs: ['Lee SM Ch. 8'],
      tags: ['vector field', 'tangent bundle'],
      viz(v) {
        const sel = v.select('field $X$', Object.entries(F41).map(([value, o]) => ({ value, label: o.label })), 'wave');
        const L = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 330, xlabel: 'x', ylabel: 'y', title: 'the field and its streamlines' });
        const R = v.stage({ x: [-2.2, 2.2], y: [-2.5, 2.5], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'x (along the line y = y(p))', ylabel: 'components', title: 'the section along a line: $X^1(x,y_p)$ and $X^2(x,y_p)$' });
        const p = L.handle(0.4, 0.8, { color: 'gold', label: 'p', constrain: { x: [-2.1, 2.1], y: [-2.1, 2.1] } });
        v.legend([['blue', '$X^1$'], ['orange', '$X^2$'], ['accent', 'streamline']]);
        v.render(() => {
          const F = F41[sel.value].f;
          L.field(F, { color: 'muted', spacing: 34, alpha: 0.6 });
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
            const s0 = [i * 0.9, j * 0.9];
            const fw = traj(F, s0, 3.2, 120), bw = traj(F, s0, -3.2, 120);
            L.clip(() => L.path(bw.reverse().concat(fw), { color: 'accent', width: 1.1, alpha: 0.5 }));
          }
          const X = F(p.x, p.y);
          L.arrow(p.x, p.y, p.x + 0.6 * X[0], p.y + 0.6 * X[1], { color: 'gold', width: 2.6 });
          L.dot(p.x, p.y, { r: 5, color: 'gold' });
          R.fn((x) => F(x, p.y)[0], { color: 'blue', width: 2.2, domain: [-2.2, 2.2], n: 400 });
          R.fn((x) => F(x, p.y)[1], { color: 'orange', width: 2.2, domain: [-2.2, 2.2], n: 400 });
          R.vline(p.x, { color: 'gold', dash: true });
          R.dot(p.x, X[0], { r: 4, color: 'blue' }); R.dot(p.x, X[1], { r: 4, color: 'orange' });
        });
        v.readout(() => {
          const F = F41[sel.value].f, X = F(p.x, p.y), a = F(p.x - 1e-3, p.y), b = F(p.x + 1e-3, p.y);
          const jump = Math.hypot(b[0] - a[0], b[1] - a[1]);
          return `$X_p=(${f3(v, X[0])},\\ ${f3(v, X[1])})$ at $p=(${f3(v, p.x)},\\ ${f3(v, p.y)})$, $|X_p|=${v.fix(Math.hypot(X[0], X[1]), 3)}$.\nJump of $X$ across $p$ (over $\\pm10^{-3}$): $${v.fix(jump, 3)}$ — ${jump > 0.05 ? '**not continuous, so not a smooth section**' : 'continuous here (smooth section)'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Integral curves',
      statement: String.raw`Let $X$ be a smooth vector field on $M$. An **integral curve** of $X$ is a smooth curve $\gamma\colon J\to M$, $J\subset\R$ an interval, with $\gamma'(t)=X_{\gamma(t)}$ for all $t\in J$; it starts at $p$ if $0\in J$ and $\gamma(0)=p$. In a chart this is the autonomous system $\dot x^i(t)=X^i(x(t))$. Through every point there is an integral curve, and any two integral curves starting at the same point agree on the intersection of their domains (see 4.3); a **maximal** integral curve is one that cannot be extended to a larger interval.`,
      idea: String.raw`In a chart the definition is an autonomous ODE system, so existence and uniqueness of a local solution through each point is the Picard–Lindelöf theorem (ode 2.4), which applies because the components of a smooth field are locally Lipschitz. Changing chart multiplies $\dot x$ by the Jacobian, the same way as the components of $X$, so the notion does not depend on the chart. Gluing local solutions along overlaps — possible by uniqueness — produces the maximal integral curve through $p$. Numerically one solves the ODE in a chart by steps of a Runge–Kutta method; the higher the order, the more faithfully the curve stays tangent to the arrows.`,
      caption: String.raw`**Click** in the left panel to start integral curves (up to eight; the last one is analysed). The blue curve is a fine RK4 solution. Choose **Euler** and enlarge the step $h$: the orange polyline leaves the true curve because each step follows a tangent line but forgets that the field turns. Right: the distance between the chosen method and the reference along the last curve, and the readout lists the tangency defect $\max|\gamma'-X(\gamma)|$ of the reference solution (numerical noise).`,
      deps: ['mfd-4.1', 'ode-2.4'],
      refs: ['Lee SM Ch. 9'],
      tags: ['integral curve', 'ODE'],
      viz(v) {
        const sel = v.select('field', Object.entries(F42).map(([value, o]) => ({ value, label: o.label })), 'pend');
        const meth = v.select('method', [{ value: 'rk4', label: 'RK4' }, { value: 'euler', label: 'Euler' }], 'euler');
        const hS = v.slider('step $h$', 0.02, 0.6, 0.25, { step: 0.01 });
        const TS = v.slider('time $T$', 1, 14, 8, { step: 0.1 });
        const clear = v.button('Clear curves', () => { pts.length = 0; pts.push([1, 0.5]); });
        const L = v.stage({ x: [-3.4, 3.4], y: [-3, 3], axes: 'box', gutter: true, height: 380, weight: 1.3, minWidth: 340, xlabel: 'x', ylabel: 'y', title: 'click to start integral curves' });
        const R = v.stage({ x: [0, 14], y: [0, 3], axes: 'box', gutter: true, height: 380, weight: 0.8, minWidth: 260, xlabel: 't', ylabel: 'error', title: 'distance from the RK4 reference (last curve)' });
        const pts = [[1, 0.5]];
        L.onClick((x, y) => { if (pts.length >= 8) pts.shift(); pts.push([x, y]); v.invalidate(); });
        let defect = 0, endErr = 0;
        const euler = (F, p, T, h) => { const o = [p.slice()]; let q = p.slice(); const n = Math.ceil(T / h); for (let i = 0; i < n; i++) { const k = F(q[0], q[1]); const hh = Math.min(h, T - i * h); q = [q[0] + hh * k[0], q[1] + hh * k[1]]; o.push(q); if (!(Math.abs(q[0]) < 1e3 && Math.abs(q[1]) < 1e3)) break; } return o; };
        const rk4s = (F, p, T, h) => { const o = [p.slice()]; let q = p.slice(); const n = Math.ceil(T / h); for (let i = 0; i < n; i++) { q = flowN((a) => F(a[0], a[1]), q, Math.min(h, T - i * h), 1, 1e3); if (!q) break; o.push(q); } return o; };
        v.legend([['blue', 'reference (RK4, fine)'], ['orange', 'chosen method', { dot: true }]]);
        v.render(() => {
          const F = F42[sel.value].f, T = TS.value, h = hS.value;
          R.setView([0, Math.max(T, 1)], [0, 3]);
          L.field(F, { color: 'muted', spacing: 36, alpha: 0.45 });
          pts.forEach((p0, i) => {
            const last = i === pts.length - 1;
            const ref = traj(F, p0, T, 700);
            L.clip(() => L.path(ref, { color: 'blue', width: last ? 2.4 : 1.3, alpha: last ? 1 : 0.55 }));
            L.dot(p0[0], p0[1], { r: 4, color: 'gold' });
            if (last) {
              const alt = meth.value === 'euler' ? euler(F, p0, T, h) : rk4s(F, p0, T, h);
              L.clip(() => { L.path(alt, { color: 'orange', width: 1.4 }); L.dots(alt, { r: 2.6, color: 'orange' }); });
              // tangency defect of the reference and distance curve
              let dm = 0;
              for (let k = 1; k + 1 < ref.length; k++) {
                const dt = T / 700, dx = (ref[k + 1][0] - ref[k - 1][0]) / (2 * dt), dy = (ref[k + 1][1] - ref[k - 1][1]) / (2 * dt), Xv = F(ref[k][0], ref[k][1]);
                dm = Math.max(dm, Math.hypot(dx - Xv[0], dy - Xv[1]));
              }
              defect = dm;
              // error vs time: interpolate chosen path at its nodes
              const err = [];
              const hh = meth.value === 'euler' ? h : h;
              for (let k = 0; k < alt.length; k++) {
                const t = Math.min(k * hh, T), r = ref[Math.min(ref.length - 1, Math.round((t / T) * 700))];
                if (r) err.push([t, Math.hypot(alt[k][0] - r[0], alt[k][1] - r[1])]);
              }
              R.setView([0, Math.max(T, 1)], [0, Math.max(0.5, Math.min(6, ...[Math.max(...err.map((e) => e[1]), 0.3) * 1.15]))]);
              R.path(err, { color: 'orange', width: 2.2 });
              endErr = err.length ? err[err.length - 1][1] : 0;
            }
          });
        });
        v.readout(() => `${pts.length} curve(s). Tangency defect of the reference, $\\max|\\gamma'(t)-X(\\gamma(t))|=${v.sci(Math.max(defect, 1e-12), 2)}$ (finite differences of the sampled curve).\nEnd-point error of ${meth.value === 'euler' ? 'Euler with $h=' + v.fix(hS.value, 2) + '$' : 'RK4 with $h=' + v.fix(hS.value, 2) + '$'}: $${v.sci(Math.max(endErr, 1e-14), 2)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Fundamental theorem on flows',
      statement: String.raw`Let $X$ be a smooth vector field on $M$. There is a unique **maximal flow** $\theta\colon\mathcal D\to M$, where $\mathcal D\subset\R\times M$ is open and contains $\{0\}\times M$, such that for each $p$ the set $\mathcal D^{(p)}=\{t:(t,p)\in\mathcal D\}$ is an open interval and $t\mapsto\theta_t(p)=\theta(t,p)$ is the maximal integral curve of $X$ starting at $p$. Moreover: (a) $\theta$ is smooth; (b) $\theta_s(\theta_t(p))=\theta_{s+t}(p)$ whenever the left side is defined (**group law**), and $\theta_0=\mathrm{id}$; (c) for each $t$, $M_t=\{p:(t,p)\in\mathcal D\}$ is open and $\theta_t\colon M_t\to M_{-t}$ is a diffeomorphism with inverse $\theta_{-t}$.`,
      idea: String.raw`Uniqueness of integral curves (4.2) makes the group law almost tautological: $t\mapsto\theta_{s+t}(p)$ and $t\mapsto\theta_t(\theta_s(p))$ are two integral curves with the same value at $t=0$. Openness of $\mathcal D$ and smoothness of $\theta$ are smooth dependence of ODE solutions on initial data (ode 2.6, 5.1): a solution that exists up to time $t$ for one starting point exists for nearby ones, and varies smoothly. The inverse of $\theta_t$ is $\theta_{-t}$ by the group law, which is also smooth, so $\theta_t$ is a diffeomorphism onto its image. The flow need not be defined for all $t$: the domain $\mathcal D$ is the region where integral curves have not escaped.`,
      caption: String.raw`A blob of points (a disc centred at the draggable handle) is flowed by time $t$ (green) and, separately, by time $s$ first and then $t$. The gold dots are the blob flowed by $s+t$ in one go; they coincide with the green ones, and the readout gives the largest discrepancy (RK4 error only). Switch to the incomplete field $(x^2,-y)$: points with $x>0$ escape to infinity at time $1/x$ and turn red when $t$ passes it. Right: the maximal flow domain $\mathcal D$ in the $(x,t)$ plane (shaded) bounded by the hyperbola $t=1/x$.`,
      deps: ['mfd-4.2'],
      see: ['ode-5.1'],
      refs: ['Lee SM Ch. 9'],
      tags: ['flow', 'group law'],
      credit: 'Picard–Lindelöf (ODE existence and uniqueness), 1890s',
      viz(v) {
        const sel = v.select('field', Object.entries(F43).map(([value, o]) => ({ value, label: o.label })), 'swirl');
        const tS = v.slider('time $t$', -3, 3, 1.2, { step: 0.02 });
        const sS = v.slider('first time $s$', -3, 3, 0.8, { step: 0.02 });
        const L = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: 'box', gutter: true, height: 360, weight: 1.2, minWidth: 320, xlabel: 'x', ylabel: 'y', title: 'a blob flowed by $s$, then $t$, versus by $s+t$' });
        const R = v.stage({ x: [-2.5, 2.5], y: [-3.4, 3.4], axes: 'box', gutter: true, height: 360, weight: 0.9, minWidth: 280, xlabel: 'x (initial point)', ylabel: 't', title: 'flow domain $\\mathcal D$ for $(x^2,-y)$' });
        const c = L.handle(0.2, 0.3, { color: 'gold', label: 'centre', constrain: { x: [-2, 2], y: [-2, 2] } });
        const NB = 90;
        const blob = []; for (let i = 0; i < NB; i++) { const r = 0.75 * Math.sqrt((i + 0.5) / NB), a = i * 2.39996323; blob.push([r * Math.cos(a), r * Math.sin(a)]); }
        let st = { err: 0, esc: 0 };
        v.legend([['muted', 'initial blob'], ['green', '$\\theta_t\\circ\\theta_s$'], ['gold', '$\\theta_{s+t}$ in one go', { dot: true }], ['red', 'escaped']]);
        v.render(() => {
          const F = F43[sel.value].f, blow = sel.value === 'blow';
          const t = tS.value, s = sS.value;
          let err = 0, esc = 0;
          for (const b of blob) {
            const p0 = [c.x + b[0], c.y + b[1]];
            L.dot(p0[0], p0[1], { r: 2.4, color: 'muted' });
            const q1 = flow2(F, p0, s), q2 = q1 && flow2(F, q1, t), q3 = flow2(F, p0, s + t);
            if (!q1 || !q2) { esc++; continue; }
            if (q2 && q3) err = Math.max(err, Math.hypot(q2[0] - q3[0], q2[1] - q3[1]));
            if (Math.abs(q2[0]) < 8 && Math.abs(q2[1]) < 8) L.dot(q2[0], q2[1], { r: 3.4, color: 'green' });
            if (q3 && Math.abs(q3[0]) < 8 && Math.abs(q3[1]) < 8) L.dot(q3[0], q3[1], { r: 1.6, color: 'gold' });
          }
          if (blow) {
            // points whose time-t flow (alone) has escaped: draw their initial positions in red
            for (const b of blob) { const p0 = [c.x + b[0], c.y + b[1]]; if (!flow2(F, p0, t)) L.dot(p0[0], p0[1], { r: 3, color: 'red', hollow: true }); }
            R.raster((x, tt) => (x * tt < 1 ? v.rgb('green').slice(0, 3).concat([0.16]) : null), { res: 3, key: 'dom' });
            R.curve((u) => [1 / u, u], 0.2, 20, { color: 'red', width: 2 });
            R.curve((u) => [1 / u, u], -20, -0.2, { color: 'red', width: 2 });
            R.hline(t, { color: 'accent', dash: true });
            R.dot(c.x, t, { r: 5, color: 'gold' });
            R.text('$\\mathcal D$', -1.7, 1.6, { size: 18, color: 'green' });
            R.text('$t=1/x$', 1.5, 2.9, { size: 14, color: 'red' });
          } else {
            R.rect(-2.5, -3.4, 2.5, 3.4, { fill: 'green', fillAlpha: 0.16, stroke: false });
            R.text('$\\mathcal D=\\R\\times\\R^2$ (complete)', 0, 0, { size: 15, color: 'green', align: 'center' });
            R.hline(t, { color: 'accent', dash: true });
          }
          st = { err, esc };
        });
        v.readout(() => `Group law: $\\max_p|\\theta_t(\\theta_s p)-\\theta_{s+t}(p)|=${v.sci(Math.max(st.err, 1e-15), 2)}$ over the blob (RK4 error, no genuine discrepancy).\n${sel.value === 'blow' ? `${st.esc} of ${NB} points have left $\\mathcal D$ (escaped to infinity) before time $s$ or $s+t$.` : 'Every point flows for all time: the flow is global.'} Each $\\theta_t$ moves the blob rigidly-ish but smoothly and invertibly ($\\theta_{-t}$ undoes it).`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Compactly supported vector fields are complete',
      statement: String.raw`Let $X$ be a smooth vector field on $M$ whose support $\operatorname{supp}X=\overline{\{p:X_p\neq0\}}$ is compact. Then $X$ is **complete**: its maximal flow is defined on all of $\R\times M$, that is, every maximal integral curve is defined for all $t\in\R$. More generally, every smooth vector field on a compact manifold is complete.`,
      idea: String.raw`Outside the support the field vanishes, so a point there is a constant curve. A point $p$ in the support $K$ has an integral curve defined at least on a time interval $(-\varepsilon,\varepsilon)$ whose length is uniform over the compact set $K$ (by the openness of the flow domain 4.3 and a finite subcover). If the maximal curve ended at a finite time $b$, restarting it at time $b-\varepsilon/2$ and using the group law would extend it past $b$: contradiction. Equivalently, an integral curve can only fail to exist for all time by leaving every compact set (the escape lemma, ode 2.11), and it cannot leave a compact set that contains all the motion.`,
      caption: String.raw`On the line the field $x^2\partial_x$ sends the curve through $x_0>0$ to infinity at time $1/x_0$ (red dots). Tick **cut off**: the field is multiplied by a smooth bump $\rho$ equal to $1$ on $[-R,R]$ and $0$ outside $[-R-1,R+1]$, so it has compact support. Now every curve exists for all $t$ in the plotted range: those starting inside creep towards the edge of the support, a zero of the field, but never reach it. Drag the handle (initial point) and change $R$.`,
      deps: ['mfd-4.3'],
      see: ['ode-2.11'],
      refs: ['Lee SM Ch. 9'],
      tags: ['complete field', 'compact support'],
      viz(v) {
        const cut = v.toggle('multiply by the bump $\\rho$ (compact support)', false);
        const Rs = v.slider('inner radius $R$', 0.3, 2.5, 1.0, { step: 0.05 });
        const Ts = v.slider('time horizon', 1, 8, 4, { step: 0.1 });
        const A = v.stage({ x: [0, 4], y: [-4, 4], axes: 'box', gutter: true, height: 360, weight: 1.3, minWidth: 330, xlabel: 't', ylabel: 'x(t)', title: 'integral curves $x(t)$ for many initial points' });
        const B = v.stage({ x: [-4, 4], y: [-1, 8], axes: 'box', gutter: true, height: 360, weight: 0.9, minWidth: 280, xlabel: 'x', ylabel: 'field', title: 'the field $X(x)$ and the bump $\\rho$' });
        const h = A.handle(0, 0.9, { color: 'gold', label: 'x₀', constrain: (x, y) => [0, clamp(y, -3.5, 3.5)] });
        let st = { nEsc: 0, tEsc: null };
        const run = (x0, F, T) => {
          const o = [[0, x0]]; let x = x0; const n = Math.ceil(T * 100), dt = T / n;
          for (let i = 0; i < n; i++) {
            const k1 = F(x), k2 = F(x + (dt / 2) * k1), k3 = F(x + (dt / 2) * k2), k4 = F(x + dt * k3);
            x += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
            if (!(Math.abs(x) < 6)) { o.push([(i + 1) * dt, x > 0 ? 6 : -6]); return { o, esc: (i + 1) * dt }; }
            o.push([(i + 1) * dt, x]);
          }
          return { o, esc: null };
        };
        v.legend([['blue', '$x(t)$'], ['red', 'escape', { dot: true }], ['muted', '$x^2$'], ['accent', '$X$'], ['orange', '$\\rho$']]);
        v.render(() => {
          const T = Ts.value, R = Rs.value, c = cut.value;
          A.setView([0, T], [-4, 4]);
          const F = c ? (x) => cutoff(x, R) * x * x : (x) => x * x;
          let nEsc = 0;
          for (let x0 = -3.5; x0 <= 3.5001; x0 += 0.5) {
            const r = run(x0, F, T);
            A.path(r.o, { color: 'blue', width: 1.3, alpha: 0.6 });
            if (r.esc != null) { nEsc++; A.dot(r.esc, r.o[r.o.length - 1][1] > 0 ? 3.9 : -3.9, { r: 3.4, color: 'red' }); }
          }
          const r = run(h.y, F, T);
          A.path(r.o, { color: 'gold', width: 2.8 });
          if (r.esc != null) A.dot(r.esc, r.o[r.o.length - 1][1] > 0 ? 3.9 : -3.9, { r: 5, color: 'red' });
          st = { nEsc, tEsc: r.esc, x0: h.y };
          B.fn((x) => x * x, { color: 'muted', width: 1.4, dash: true, domain: [-4, 4] });
          B.fn((x) => F(x), { color: 'accent', width: 2.4, domain: [-4, 4], n: 500 });
          B.fn((x) => cutoff(x, R) * 4, { color: 'orange', width: 1.2, alpha: c ? 1 : 0.25, domain: [-4, 4], n: 400 });
          if (c) { B.vband(-R - 1, R + 1, { color: 'green', alpha: 0.06 }); }
        });
        v.readout(() => `${st.nEsc} of 15 sampled curves escape to $\\pm\\infty$ before $t=${v.fix(Ts.value, 1)}$.\nHandle $x_0=${f3(v, st.x0)}$: ` + (cut.value ? (st.tEsc == null ? '**exists for all time in the window** (the field vanishes outside $[-R-1,R+1]$, a compact set).' : 'escapes.') : (st.x0 > 0 ? `exact solution $x=x_0/(1-tx_0)$ blows up at $t=1/x_0=${v.fix(1 / st.x0, 3)}$; ${st.tEsc == null ? 'this is beyond the time horizon.' : 'the numerical curve passes $|x|=6$ at $t\\approx' + v.fix(st.tEsc, 2) + '$.'}` : 'a point with $x_0\\le0$ is fine for $t\\ge0$ (it blows up backwards in time if $x_0<0$).')));
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'Lie bracket',
      statement: String.raw`For smooth vector fields $X,Y$ on $M$ the **Lie bracket** (commutator) $[X,Y]$ is the vector field defined by
$$[X,Y]f=X(Yf)-Y(Xf),\qquad f\in C^\infty(M).$$
It is a derivation of $C^\infty(M)$, hence a smooth vector field; in coordinates $[X,Y]=\bigl(X^j\partial_jY^i-Y^j\partial_jX^i\bigr)\partial_i$. It is $\R$-bilinear, antisymmetric, satisfies the Jacobi identity $[X,[Y,Z]]+[Y,[Z,X]]+[Z,[X,Y]]=0$ and $[fX,gY]=fg[X,Y]+f(Xg)Y-g(Yf)X$. The bracket of coordinate fields vanishes: $[\partial_i,\partial_j]=0$.`,
      idea: String.raw`Each of $X$ and $Y$ is a first-order differential operator, and the second-order parts of $XY$ and $YX$ are both $X^iY^j\partial_{ij}$ (up to the order of the factors), so they cancel in the commutator and what is left is first order: a derivation, i.e. a vector field. The coordinate formula is the product rule applied to $X^i\partial_i(Y^j\partial_jf)-Y^j\partial_j(X^i\partial_if)$, where the mixed second derivatives of $f$ cancel by equality of mixed partials. That is exactly the reason $[\partial_i,\partial_j]=0$.`,
      caption: String.raw`Choose a pair of fields; $X$ (blue), $Y$ (orange) and their bracket (green) are drawn as arrow fields. Drag $p$: the readout evaluates $[X,Y]_p$ from the coordinate formula and, independently, from $X(Yf)-Y(Xf)$ applied to the test function $f=\sin x+\tfrac12y^2+0.3xy$ by differences, and the two agree. The pairs coordinate fields, rotation and dilation have zero bracket; rotation with a translation does not; the last one is nonlinear.`,
      deps: ['mfd-4.1'],
      refs: ['Lee SM Ch. 8'],
      tags: ['Lie bracket', 'commutator'],
      credit: 'Sophus Lie (transformation groups) and Carl Jacobi (Jacobi identity), 19th century',
      verify: true,
      viz(v) {
        const sel = v.select('pair $(X,Y)$', Object.entries(PAIRS).map(([value, o]) => ({ value, label: o.label })), 'rottr');
        const mk = (title) => v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: 'box', gutter: true, height: 290, weight: 1, minWidth: 250, xlabel: 'x', ylabel: 'y', title });
        const A = mk('$X$'), B = mk('$Y$'), C = mk('$[X,Y]$');
        const p = A.handle(0.9, 0.6, { color: 'gold', label: 'p', constrain: { x: [-1.9, 1.9], y: [-1.9, 1.9] } });
        const fg = (x, y) => [Math.cos(x) + 0.3 * y, y + 0.3 * x];
        let st = null;
        v.render(() => {
          const P = PAIRS[sel.value], X = P.X, Y = P.Y;
          const Br = (x, y) => bracket2(X, Y, x, y);
          A.field(X, { color: 'blue', spacing: 30 }); B.field(Y, { color: 'orange', spacing: 30 });
          const zero = sel.value === 'coord' || sel.value === 'rotdil';
          if (zero) C.text('$[X,Y]\\equiv0$', 0, 0, { size: 22, color: 'green', align: 'center' }); else C.field(Br, { color: 'green', spacing: 30, normalize: false, scale: 14 });
          for (const S of [B, C]) S.dot(p.x, p.y, { r: 4, color: 'gold' });
          const Xp = X(p.x, p.y), Yp = Y(p.x, p.y), Bp = Br(p.x, p.y);
          A.arrow(p.x, p.y, p.x + 0.4 * Xp[0], p.y + 0.4 * Xp[1], { color: 'gold', width: 2.6 });
          B.arrow(p.x, p.y, p.x + 0.4 * Yp[0], p.y + 0.4 * Yp[1], { color: 'gold', width: 2.6 });
          if (!zero) C.arrow(p.x, p.y, p.x + 0.4 * Bp[0], p.y + 0.4 * Bp[1], { color: 'gold', width: 2.6 });
          // operator form on f
          const h = 1e-3, Yf = (x, y) => { const g = fg(x, y), yv = Y(x, y); return yv[0] * g[0] + yv[1] * g[1]; }, Xf = (x, y) => { const g = fg(x, y), xv = X(x, y); return xv[0] * g[0] + xv[1] * g[1]; };
          const XYf = Xp[0] * (Yf(p.x + h, p.y) - Yf(p.x - h, p.y)) / (2 * h) + Xp[1] * (Yf(p.x, p.y + h) - Yf(p.x, p.y - h)) / (2 * h);
          const YXf = Yp[0] * (Xf(p.x + h, p.y) - Xf(p.x - h, p.y)) / (2 * h) + Yp[1] * (Xf(p.x, p.y + h) - Xf(p.x, p.y - h)) / (2 * h);
          const g0 = fg(p.x, p.y);
          st = { Bp, op: XYf - YXf, coord: Bp[0] * g0[0] + Bp[1] * g0[1], exact: P.br(p.x, p.y), note: P.note, XYf, YXf };
        });
        v.readout(() => `${st.note}.\n$[X,Y]_p=(${f3(v, st.Bp[0])},\\ ${f3(v, st.Bp[1])})$ from the coordinate formula; known exact value $(${f3(v, st.exact[0])},\\ ${f3(v, st.exact[1])})$.\nOn $f$: $X(Yf)=${f3(v, st.XYf)}$, $Y(Xf)=${f3(v, st.YXf)}$, difference $${f3(v, st.op)}$ versus $[X,Y]_pf=${f3(v, st.coord)}$ (agreement to $\\sim10^{-6}$).`);
      },
    },
  ],
};
