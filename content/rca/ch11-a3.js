import {poissonMaximalLp} from './poisson-boundary.shared.js';
// Rudin, Real and Complex Analysis — Chapter 11 (part 3): boundary behaviour of Poisson integrals.

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
/** P(z, e^{it}) = (1 − |z|²)/|e^{it} − z|² at z = x + iy. */
const Pz = (x, y, t) => { const dx = Math.cos(t) - x, dy = Math.sin(t) - y; return (1 - x * x - y * y) / (dx * dx + dy * dy); };
/** Harmonic measure at z = x+iy of the arc {e^{it} : a < t < b} = P[χ_arc](z), exact. */
function arcMeasure(x, y, a, b) {
  const d = Math.atan2(Math.sin(b) - y, Math.cos(b) - x) - Math.atan2(Math.sin(a) - y, Math.cos(a) - x);
  return (((d % TAU) + TAU) % TAU) / Math.PI - (b - a) / TAU;
}
const wrap = (t) => ((((t + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
/**
 * Boundary of the approach region Ω_α(e^{iθ}) = convex hull of D(0;α) ∪ {e^{iθ}}: the two tangent segments
 * (sampled geometrically towards e^{iθ}, which is excluded) and the far arc of |z| = α.
 */
function stolzBoundary(th, al, nSeg = 36, nArc = 48) {
  const ph = Math.acos(al), Z = [Math.cos(th), Math.sin(th)], pts = [];
  for (const s of [1, -1]) {
    const T = [al * Math.cos(th + s * ph), al * Math.sin(th + s * ph)];
    for (let k = 0; k <= nSeg; k++) { const lam = 10 ** (-4 + (4 * k) / nSeg); pts.push([Z[0] + lam * (T[0] - Z[0]), Z[1] + lam * (T[1] - Z[1])]); }
  }
  for (let k = 0; k <= nArc; k++) { const t = th + ph + ((TAU - 2 * ph) * k) / nArc; pts.push([al * Math.cos(t), al * Math.sin(t)]); }
  return pts;
}
/** Closed polygon outlining Ω_α(e^{iθ}) (for drawing). */
function stolzPoly(th, al, n = 80) {
  const ph = Math.acos(al), pts = [[Math.cos(th), Math.sin(th)]];
  for (let k = 0; k <= n; k++) { const t = th + ph + ((TAU - 2 * ph) * k) / n; pts.push([al * Math.cos(t), al * Math.sin(t)]); }
  return pts;
}
/** Is z in Ω_α(e^{iθ})? */
function inStolz(x, y, th, al) {
  if (x * x + y * y < al * al) return true;
  const c = Math.cos(th), s = Math.sin(th);
  if (x * c + y * s < al * al) return false;
  const dx = x - c, dy = y - s, d = Math.hypot(dx, dy);
  return d > 1e-12 && -(dx * c + dy * s) / d >= Math.sqrt(1 - al * al);
}
/** A cached colour-mapped scalar field with iso-lines on stage S; call the returned function inside render. */
function fieldLayer(v, S) {
  let cache = null;
  return (fn, { key, res = 2, range = [-1, 1], cmap = 'diverging', step = 0, offset = 0, lines = 0.35, alpha = 1 }) => {
    const W = Math.ceil(S.width / res), H = Math.ceil(S.height / res), ink = v.rgb('ink');
    const k = `${W}x${H}|${S.bounds.x}|${S.bounds.y}|${key}|${range}|${step}|${offset}|${cmap}|${ink}`;
    if (!cache || cache.k !== k) {
      const val = new Float64Array(W * H);
      for (let j = 0; j < H; j++) { const y = S.invY((j + 0.5) * res); for (let i = 0; i < W; i++) val[j * W + i] = fn(S.invX((i + 0.5) * res), y); }
      const cols = new Array(W * H);
      for (let p = 0; p < W * H; p++) {
        const z = val[p]; if (!isFinite(z)) { cols[p] = null; continue; }
        let c = v.M.cmap((z - range[0]) / (range[1] - range[0]), cmap);
        if (step && z >= range[0] && z <= range[1]) {
          const lv = (q) => Math.floor((q - offset) / step), L = lv(z), i = p % W, q1 = i + 1 < W ? val[p + 1] : NaN, q2 = p + W < W * H ? val[p + W] : NaN;
          if ((isFinite(q1) && lv(q1) !== L) || (isFinite(q2) && lv(q2) !== L)) c = c.map((x, m) => x + (ink[m] - x) * lines);
        }
        cols[p] = c;
      }
      cache = { k, cols };
    }
    let n = 0; const cols = cache.cols;
    S.raster(() => cols[n++], { key: cache.k, res, alpha, id: 'field' });
  };
}
const PI_TICKS = [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']];
const onCircle = (x, y) => { const m = Math.hypot(x, y) || 1; return [x / m, y / m]; };

import { poissonLp, poissonZeroDerivative, approachComparisonConstant } from './poisson-boundary.shared.js';

export default {
  collection: 'rca',
  chapter: 11,
  items: [poissonMaximalLp,
    poissonLp,
    poissonZeroDerivative,
    {
      num: '11.18',
      kind: 'Definition',
      name: 'Nontangential approach regions and maximal functions',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Sections 11.18–11.19 and 11.21, pp. 240–243'],
      statement: String.raw`For $0<\alpha<1$ let $\Omega_\alpha$ be the open convex region formed by $D(0;\alpha)$ and the segments from $1$ to its points, with the boundary point $1$ excluded, and let $\Omega_\alpha(e^{i\theta})$ be its rotation by $e^{i\theta}$. Near $e^{i\theta}$ it is an angle of half-opening $\arcsin\alpha$ bisected by the radius.

A function $F$ in $U$ has **nontangential limit** $\lambda$ at $e^{i\theta}$ if $F(z_j)\to\lambda$ for every $\alpha<1$ and every sequence $z_j\to e^{i\theta}$ inside $\Omega_\alpha(e^{i\theta})$; its **radial limit** uses $z_j=r_je^{i\theta}$ only. For $u$ in $U$ define the nontangential and radial maximal functions
$$(N_\alpha u)(e^{i\theta})=\sup_{z\in\Omega_\alpha(e^{i\theta})}|u(z)|,\qquad (M_{\rm rad}u)(e^{i\theta})=\sup_{0\le r<1}|u(re^{i\theta})|,$$
and, for a complex Borel measure $\mu$ on $T$, $(M\mu)(e^{i\theta})=\max\{\|\mu\|,\sup_{0<h<\pi}|\mu|(I_h)/\sigma(I_h)\}$ with $I_h$ the open arc of length $2h$ centred at $e^{i\theta}$. The term $\|\mu\|$ includes the whole circle, as required in the definition.`,
      idea: String.raw`Inside $\Omega_\alpha(e^{i\theta})$ the distance to $e^{i\theta}$ is comparable to the distance to $T$: $|e^{i\theta}-z|\le c\,(1-|z|)$ with $c$ depending only on $\alpha$. This is exactly what lets the Poisson kernel at $z$ be dominated by an approximate identity centred at $e^{i\theta}$ — the source of the estimates in 11.20 and of the a.e. limits that follow. Tangential approach (along curves touching $T$) escapes every $\Omega_\alpha$, and there the Poisson integral can misbehave. Clearly $M_{\rm rad}u\le N_\alpha u$, and $N_\alpha u$ grows with $\alpha$.`,
      caption: String.raw`Drag the boundary point $\zeta=e^{i\theta}$ and change $\alpha$: the green region is $\Omega_\alpha(\zeta)$; the teal radius stays inside it, the red tangential curve leaves it near $\zeta$. Drag $z$ to test membership and watch the ratio $|\zeta-z|/(1-|z|)$, bounded on $\Omega_\alpha(\zeta)$. Bottom: for $u=P[f]$ (shown in the disc) the maximal functions $N_\alpha u\ge M_{\rm rad}u$ around the circle, with $|f|$ for comparison.`,
      deps: ['rca-11.5', 'rca-7.2'],
      tags: ['nontangential limits', 'maximal functions'],
      viz(v) {
        const A1 = [0.6, 2.2, 0.9], A2 = [-2.4, -1.3, -0.7];
        const fB = (t) => 0.05 + (t > A1[0] && t < A1[1] ? A1[2] : 0) + (t > A2[0] && t < A2[1] ? A2[2] : 0) + 0.35 * Math.cos(3 * t);
        const U = (x, y) => 0.05 + A1[2] * arcMeasure(x, y, A1[0], A1[1]) + A2[2] * arcMeasure(x, y, A2[0], A2[1]) + 0.35 * (x ** 3 - 3 * x * y * y);
        const aS = v.slider('$\\alpha$', 0.1, 0.95, 0.45, { step: 0.01 });
        const D = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 330, axes: false, title: '$u=P[f]$ and the region $\\Omega_\\alpha(\\zeta)$' });
        const Z = v.stage({ x: [-0.32, 0.32], y: [-0.25, 0.25], equal: true, height: 330, axes: false, title: 'zoom at $\\zeta$: radial vs tangential approach' });
        const B = v.stage({ x: [-Math.PI, Math.PI], y: [0, 1.6], height: 170, full: true, axes: 'box', xticks: PI_TICKS, title: '$N_\\alpha u$, $M_{\\rm rad}u$ and $|f|$ on $T$' });
        const zeta = D.handle(Math.cos(0.35), Math.sin(0.35), { color: 'ink', r: 6.5, label: 'ζ', labelPos: 'ne', constrain: onCircle });
        const z = D.handle(0.62, 0.05, { color: 'accent', label: 'z', labelPos: 'sw', constrain: (x, y) => { const m = Math.hypot(x, y); return m > 0.995 ? [0.995 * x / m, 0.995 * y / m] : [x, y]; } });
        const heat = fieldLayer(v, D);
        const NT = 360, ths = Array.from({ length: NT }, (_, i) => -Math.PI + (TAU * (i + 0.5)) / NT);
        const radii = Array.from({ length: 19 }, (_, k) => 0.05 * k).concat(Array.from({ length: 41 }, (_, k) => 1 - 10 ** (-1 - (3 * k) / 40)));
        const Mrad = ths.map((t) => Math.max(...radii.map((r) => Math.abs(U(r * Math.cos(t), r * Math.sin(t))))));
        let cache = { al: null }, st = null;
        v.render(() => {
          const al = aS.value, th = Math.atan2(zeta.y, zeta.x);
          if (cache.al !== al) cache = { al, N: ths.map((t) => Math.max(...stolzBoundary(t, al).map(([x, y]) => Math.abs(U(x, y))))) };
          // ---- disc
          heat((x, y) => (x * x + y * y < 1 ? U(x, y) : NaN), { key: 'u', range: [-1.3, 1.3], step: 0.2, offset: 0.1 });
          D.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          const poly = stolzPoly(th, al);
          D.poly(poly, { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1.8 });
          D.line(0, 0, Math.cos(th), Math.sin(th), { color: 'teal', width: 2.2 });
          const tang = (s) => { const r = 1 - 1.1 * s * s; return [r * Math.cos(th + s), r * Math.sin(th + s)]; };
          D.curve(tang, 0, 0.75, { color: 'red', width: 2, dash: [5, 3] });
          // ---- zoom at ζ (rotated so that ζ sits at the right)
          const rot = (x, y) => { const c = Math.cos(-th), s = Math.sin(-th); return [x * c - y * s - 1, x * s + y * c]; };
          Z.poly(poly.map(([x, y]) => rot(x, y)), { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1.8 });
          Z.curve((t) => [Math.cos(t) - 1, Math.sin(t)], -0.6, 0.6, { color: 'ink', width: 2 });
          Z.line(-1, 0, 0, 0, { color: 'teal', width: 2.2 });
          Z.curve((s) => { const p = tang(s); return rot(p[0], p[1]); }, 0, 0.6, { color: 'red', width: 2.2, dash: [5, 3], n: 300 });
          Z.dot(0, 0, { color: 'ink', r: 4.5, label: 'ζ', labelPos: 'e' });
          Z.tex('\\Omega_\\alpha(\\zeta)', -0.2, -0.02, { color: 'green', size: 14 });
          Z.tex('T', 0.02, 0.21, { color: 'ink', size: 14, align: 'left' });
          const be = Math.asin(al);
          Z.tex(`\\text{half-angle } \\arcsin\\alpha = ${v.fix((be * 180) / Math.PI, 1)}^\\circ`, -0.3, -0.21, { color: 'green', size: 12, align: 'left' });
          // ---- strip
          cache.N = cache.N.map((value,i)=>Math.max(value,Mrad[i]));
          const top = Math.max(...cache.N) * 1.12;
          B.setView(null, [0, top]);
          B.path(ths.map((t) => [t, Math.abs(fB(t))]), { color: 'faint', width: 1.6 });
          B.path(ths.map((t, i) => [t, Mrad[i]]), { color: 'teal', width: 2.2 });
          B.path(ths.map((t, i) => [t, cache.N[i]]), { color: 'accent', width: 2.4 });
          B.vline(th, { color: 'ink', width: 1, dash: [3, 3] });
          const inside = inStolz(z.x, z.y, th, al), ratio = Math.hypot(z.x - Math.cos(th), z.y - Math.sin(th)) / (1 - Math.hypot(z.x, z.y));
          D.corner(inside ? 'z ∈ Ωα(ζ)' : 'z ∉ Ωα(ζ)', 'tl', { color: inside ? 'green' : 'red', weight: 600 });
          const i0 = Math.min(NT - 1, Math.max(0, Math.round(((th + Math.PI) / TAU) * NT - 0.5)));
          st = { inside, ratio, al, N: cache.N[i0], Mr: Mrad[i0], f: fB(th), lim: (1 + al) / (1 - al) };
          v.legend([['green', '$\\Omega_\\alpha(\\zeta)$', { area: true }], ['teal', 'radius / $M_{\\rm rad}u$'], ['red', 'tangential path', { dash: true }], ['accent', '$N_\\alpha u$'], ['faint', '$|f|$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `Finite-sample estimates near $\\zeta$: $N_\\alpha u=${v.fix(s.N, 3)}\\ge M_{\\rm rad}u=${v.fix(s.Mr, 3)}$, $\\;|f(\\zeta)|=${v.fix(Math.abs(s.f), 3)}$. $\\;|\\zeta-z|/(1-|z|)=${v.fix(s.ratio, 2)}$ — ${s.inside ? 'inside $\\Omega_\\alpha(\\zeta)$ this ratio never exceeds a bound depending only on $\\alpha$' : 'outside $\\Omega_\\alpha(\\zeta)$ it can be arbitrarily large'}.`;
        });
      },
    },
    {
      num: '11.20',
      kind: 'Theorem',
      name: 'The nontangential maximal function is dominated by Mμ',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 11.20 and complete proof, pp. 242–243'],
      statement: String.raw`For each $0<\alpha<1$ there is a constant $c_\alpha<\infty$ with the following property: if $\mu$ is a complex Borel measure on $T$ and $u=P[d\mu]$, then
$$(N_\alpha u)(e^{i\theta})\le c_\alpha\,(M\mu)(e^{i\theta})\qquad\text{for every }e^{i\theta}\in T.$$
Consequently, by the maximal theorem (7.4), $\sigma\{N_\alpha u>\lambda\}\le 3c_\alpha\|\mu\|/\lambda$ for all $\lambda>0$.`,
      idea: String.raw`It suffices to treat $\theta=0$ and $\mu\ge0$ (replace $\mu$ by $|\mu|$). For $z\in\Omega_\alpha$, dominate $t\mapsto P(z,e^{it})$ by its least even majorant $\Psi_z$ that decreases in $|t|$. Such a $\Psi_z$ is an average of normalised indicators of arcs centred at $1$, so $\int\Psi_z\,d\mu\le\big(\int\Psi_z\,d\sigma\big)\,(M\mu)(1)$. The geometry of $\Omega_\alpha$ ($|1-z|\le c(1-|z|)$) keeps $\int\Psi_z\,d\sigma$ bounded by a constant depending only on $\alpha$ — that is $c_\alpha$. Radially $\Psi_r=P_r$ itself, so in fact $M_{\rm rad}u\le M\mu$.`,
      caption: String.raw`$\mu$ is a positive density plus two point masses (red). Drag $\zeta$ and change $\alpha$. The conservative constant $c_\alpha=(1+2/(1-\alpha))^2$ follows from the geometric kernel comparison in the proof; it is not fitted to the plotted data. Bottom (log scale): finite-sample estimates of $N_\alpha u$ (blue), $M_{\rm rad}u$ (teal), and $M\mu$ (orange), with the conservative comparison line; near an atom all three blow up like $1/|\theta-t_k|$. The gold dot marks the largest sampled value in the approach region; no sampled supremum certifies the exact maximum. At an atom the exact maximal functions are unbounded; the finite-scale plot is truncated.`,
      deps: ['rca-11.18', 'rca-11.4', 'rca-7.4'],
      tags: ['maximal functions', 'Poisson integral'],
      viz(v) {
        const ATOMS = [[0.85, 0.35], [-2.1, 0.2]];
        const dens = (t) => 1 + 0.8 * Math.cos(t - 2);
        const U = (x, y) => 1 + 0.8 * (x * Math.cos(2) + y * Math.sin(2)) + ATOMS.reduce((s, [t, w]) => s + w * Pz(x, y, t), 0);
        const Mmu = (th) => {
          let best = 1 + ATOMS.reduce((sum,atom)=>sum+atom[1],0); const hs = [];
          for (let k = 0; k <= 120; k++) hs.push(Math.PI * 10 ** (-4 + (4 * k) / 120));
          for (const [t] of ATOMS) { const d = Math.abs(wrap(th - t)); if (d > 0 && d < Math.PI) hs.push(d * (1 + 1e-9)); }
          for (const h of hs) {
            let m = 1 + (0.8 * Math.cos(th - 2) * Math.sin(h)) / h;
            for (const [t, w] of ATOMS) if (Math.abs(wrap(th - t)) < h) m += (Math.PI * w) / h;
            best = Math.max(best, m);
          }
          return best;
        };
        // |1-z|/(1-|z|) <= (1+alpha)/(1-alpha) on the convex approach region.
        // Thus |z-|z||/(1-|z|) <= 2/(1-alpha); RCA's kernel comparison gives this conservative bound.
        const cAlpha = approachComparisonConstant;
        const aS = v.slider('$\\alpha$', 0.1, 0.9, 0.5, { step: 0.01 });
        const D = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 320, axes: false, title: '$u=P[d\\mu]$ (log colour) and $\\Omega_\\alpha(\\zeta)$' });
        const NT = 300, ths = Array.from({ length: NT }, (_, i) => -Math.PI + (TAU * (i + 0.5)) / NT);
        const LOGT = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500].map((x) => [Math.log10(x), String(x)]);
        const B = v.stage({ x: [-Math.PI, Math.PI], y: [-0.4, 2.5], height: 320, axes: 'box', xticks: PI_TICKS, yticks: LOGT, title: '$N_\\alpha u$, $M_{\\rm rad}u$, $M\\mu$, $c_\\alpha M\\mu$ (log scale)' });
        const zeta = D.handle(Math.cos(1.6), Math.sin(1.6), { color: 'ink', r: 6.5, label: 'ζ', labelPos: 'ne', constrain: onCircle });
        const heat = fieldLayer(v, D);
        const MM = ths.map(Mmu);
        const radii = Array.from({ length: 19 }, (_, k) => 0.05 * k).concat(Array.from({ length: 41 }, (_, k) => 1 - 10 ** (-1 - (3 * k) / 40)));
        const MR = ths.map((t) => Math.max(...radii.map((r) => U(r * Math.cos(t), r * Math.sin(t)))));
        let cache = { al: null }, st = null;
        v.render(() => {
          const al = aS.value, th = Math.atan2(zeta.y, zeta.x);
          if (cache.al !== al) cache = { al, c: cAlpha(al), N: ths.map((t) => Math.max(...stolzBoundary(t, al).map(([x, y]) => U(x, y)))) };
          const c = cache.c;
          B.setView(null,[-.4,Math.log10(c*Math.max(...MM))+0.15]);
          heat((x, y) => (x * x + y * y < 1 ? Math.log10(U(x, y)) : NaN), { key: 'u', range: [-0.4, 1.3], cmap: 'magma', step: 0.1, offset: 0.05 });
          D.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          D.poly(stolzPoly(th, al), { fill: 'green', fillAlpha: 0.16, color: 'green', width: 1.8 });
          for (const [t, w] of ATOMS) { D.arrow(Math.cos(t), Math.sin(t), (1.1 + w) * Math.cos(t), (1.1 + w) * Math.sin(t), { color: 'red', width: 2.6, head: 8 }); D.dot(Math.cos(t), Math.sin(t), { color: 'red', r: 4.5 }); }
          // where the sup over Ω_α(ζ) is attained
          const bd = stolzBoundary(th, al); let arg = bd[0], best = -Infinity;
          for (const p of bd) { const val = U(p[0], p[1]); if (val > best) { best = val; arg = p; } }
          D.dot(arg[0], arg[1], { color: 'gold', r: 5.5 });
          // ---- log plot
          const lg = (x) => Math.log10(Math.max(x, 1e-9));
          B.path(ths.map((t, i) => [t, lg(c * MM[i])]), { color: 'orange', width: 1.8, dash: [6, 4] });
          B.path(ths.map((t, i) => [t, lg(MM[i])]), { color: 'orange', width: 2 });
          B.path(ths.map((t, i) => [t, lg(MR[i])]), { color: 'teal', width: 2 });
          B.path(ths.map((t, i) => [t, lg(cache.N[i])]), { color: 'accent', width: 2.4 });
          for (const [t] of ATOMS) B.vline(t, { color: 'red', width: 1, dash: [2, 3] });
          B.vline(th, { color: 'ink', width: 1, dash: [3, 3] });
          let worst = 0; for (let i = 0; i < NT; i++) worst = Math.max(worst, cache.N[i] / MM[i]);
          const i0 = Math.min(NT - 1, Math.max(0, Math.round(((th + Math.PI) / TAU) * NT - 0.5)));
          st = { c, worst, N: cache.N[i0], M: MM[i0], Mr: MR[i0], al };
          v.legend([['accent', '$N_\\alpha u$'], ['teal', '$M_{\\rm rad}u$'], ['orange', '$M\\mu$'], ['orange', '$c_\\alpha M\\mu$', { dash: true }], ['gold', 'largest sampled value in the approach region', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$c_\\alpha=${v.fix(s.c, 3)}$ for $\\alpha=${v.fix(s.al, 2)}$; on the sampled circle $\\max_\\theta N_\\alpha u/M\\mu = ${v.fix(s.worst, 3)}\\le c_\\alpha$. Finite-sample estimates near $\\zeta$: $N_\\alpha u=${v.fix(s.N, 3)}$, $M_{\\rm rad}u=${v.fix(s.Mr, 3)}\\le M\\mu=${v.fix(s.M, 3)}$.`;
        });
      },
    },
    {
      num: '11.23',
      kind: 'Theorem',
      name: 'Poisson integrals converge nontangentially at Lebesgue points',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 11.23 and proof, p. 244'],
      statement: String.raw`If $f\in L^1(T)$, then $u=P[f]$ has nontangential limit $f(e^{i\theta})$ at every Lebesgue point $e^{i\theta}$ of $f$ — in particular at $\sigma$-almost every point of $T$.`,
      idea: String.raw`At a Lebesgue point, subtract the constant $f(e^{i\theta})$ (whose Poisson integral is itself) and split $f-f(e^{i\theta})$ into a piece supported on a small arc $I$ around $e^{i\theta}$ and the rest. The rest has a Poisson integral that is continuous up to $e^{i\theta}$ and vanishes there. The small piece is a measure $\nu$ with $(M\nu)(e^{i\theta})$ small — that is the Lebesgue point condition — so by 11.20 its Poisson integral is at most $c_\alpha(M\nu)(e^{i\theta})$ throughout $\Omega_\alpha(e^{i\theta})$. Almost every point is a Lebesgue point (7.7).`,
      caption: String.raw`$f$ is smooth except for jumps at $t=0.9$ and $t=2.6$. Drag $\zeta$ along $T$: seven straight paths approach it at angles from $-60^\circ$ to $60^\circ$ to the radius, and on the right $u$ along each path is plotted against the distance to $\zeta$ (log scale, decreasing to the right). At a Lebesgue point (any point but the two jumps) all seven converge to $f(\zeta)$. Snap $\zeta$ onto a jump: the paths reach different limits, spread across the interval between the one-sided values — no nontangential limit there, on a set of measure zero.`,
      deps: ['rca-11.20', 'rca-7.7', 'rca-11.5'],
      tags: ['nontangential limits', 'Lebesgue points', 'Fatou'],
      viz(v) {
        const J = [0.9, 2.6], H = 1.0;
        const fB = (t) => 0.3 + (t > J[0] && t < J[1] ? H : 0) + 0.4 * Math.sin(2 * t);
        const U = (x, y) => 0.3 + H * arcMeasure(x, y, J[0], J[1]) + 0.8 * x * y;
        const D = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 340, axes: false, title: '$u=P[f]$ and straight paths into $\\zeta$' });
        const R = v.stage({ x: [0, 4.2], y: [-0.5, 2], height: 340, axes: 'box', xlabel: '|z − ζ|', xticks: [[1, '0.1'], [2, '0.01'], [3, '0.001'], [4, '0.0001']], title: '$u$ along each path, approaching $\\zeta$ (to the right)' });
        const zeta = D.handle(Math.cos(-0.5), Math.sin(-0.5), { color: 'ink', r: 6.5, label: 'ζ', labelPos: 'se', constrain: (x, y) => {
          const t = Math.atan2(y, x); for (const j of J) if (Math.abs(wrap(t - j)) < 0.05) return [Math.cos(j), Math.sin(j)]; return onCircle(x, y);
        } });
        const heat = fieldLayer(v, D);
        const BETAS = [-60, -40, -20, 0, 20, 40, 60].map((d) => (d * Math.PI) / 180);
        let st = null;
        v.render(() => {
          const th = Math.atan2(zeta.y, zeta.x), c = Math.cos(th), s = Math.sin(th);
          heat((x, y) => (x * x + y * y < 1 ? U(x, y) : NaN), { key: 'u', range: [-1.6, 1.6], step: 0.2, offset: 0.1 });
          D.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          D.curve((t) => [Math.cos(t), Math.sin(t)], J[0], J[1], { color: 'red', width: 4, alpha: 0.6 });
          const atJump = J.find((j) => Math.abs(wrap(th - j)) < 1e-9);
          const path = (be, sd) => { const ex = Math.cos(be), ey = Math.sin(be); const dx = -(c * ex - s * ey), dy = -(s * ex + c * ey); return [c + sd * dx, s + sd * dy]; };
          const lims = [];
          let lo = Infinity, hi = -Infinity;
          BETAS.forEach((be, j) => {
            const col = v.mix('purple', 'teal', j / (BETAS.length - 1));
            D.curve((sd) => path(be, sd), 0, 0.75, { color: 'panel', width: 4.5 });
            D.curve((sd) => path(be, sd), 0, 0.75, { color: col, width: 2.2 });
            const pts = [];
            for (let k = 0; k <= 160; k++) { const lx = 0.13 + (4.07 * k) / 160, sd = 10 ** -lx, p = path(be, sd), val = U(p[0], p[1]); pts.push([lx, val]); lo = Math.min(lo, val); hi = Math.max(hi, val); }
            R.path(pts, { color: col, width: 2.2 });
            lims.push(pts[pts.length - 1][1]);
          });
          const fz = fB(th);
          if (atJump != null) {
            const fm = fB(atJump - 1e-6), fp = fB(atJump + 1e-6);
            R.hline(fm, { color: 'red', width: 1.5, dash: [6, 4] }); R.hline(fp, { color: 'red', width: 1.5, dash: [6, 4] });
            R.tex('f(\\zeta^-)', 0.1, fm, { color: 'red', size: 13, align: 'left', baseline: fm < fp ? 'top' : 'bottom', dy: fm < fp ? 3 : -3 });
            R.tex('f(\\zeta^+)', 0.1, fp, { color: 'red', size: 13, align: 'left', baseline: fp > fm ? 'bottom' : 'top', dy: fp > fm ? -3 : 3 });
            lo = Math.min(lo, fm, fp); hi = Math.max(hi, fm, fp);
          } else {
            R.hline(fz, { color: 'green', width: 1.8, dash: [6, 4] });
            R.tex('f(\\zeta)', 4.15, fz, { color: 'green', size: 13, align: 'right', baseline: 'bottom', dy: -3 });
            lo = Math.min(lo, fz); hi = Math.max(hi, fz);
          }
          const pad = Math.max(0.15, 0.12 * (hi - lo));
          R.setView(null, [lo - pad, hi + pad]);
          D.corner(atJump != null ? 'ζ is a jump of f — not a Lebesgue point' : 'ζ is a Lebesgue point of f', 'tl', { color: atJump != null ? 'red' : 'green', weight: 600 });
          st = { atJump, fz, lims };
          v.legend([['purple', 'path at $-60^\\circ$'], ['teal', 'path at $+60^\\circ$'], [atJump != null ? 'red' : 'green', atJump != null ? 'one-sided values $f(\\zeta^\\pm)$' : 'the value $f(\\zeta)$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const mn = Math.min(...s.lims), mx = Math.max(...s.lims);
          if (s.atJump != null) return `At the jump, the values at distance $10^{-4}$ along the seven paths range from $${v.fix(mn, 3)}$ to $${v.fix(mx, 3)}$: the limit depends on the angle of approach, so $u$ has no nontangential limit at this single point.`;
          return `$f(\\zeta)=${v.fix(s.fz, 4)}$; at distance $10^{-4}$ the seven paths give values in $[${v.fix(mn, 4)},\\,${v.fix(mx, 4)}]$ — one common nontangential limit.`;
        });
      },
    },
    {
      num: '11.24',
      kind: 'Theorem',
      name: 'Fatou: P[dμ] tends to dμ/dσ almost everywhere',
      credit: 'Fatou, 1906',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 11.24 and proof, p. 244'],
      statement: String.raw`Let $\mu$ be a complex Borel measure on $T$ with Lebesgue decomposition $d\mu=f\,d\sigma+d\mu_s$, where $f\in L^1(T)$ and $\mu_s\perp\sigma$. Then $P[d\mu]$ has nontangential limit $f(e^{i\theta})$ at $\sigma$-almost every point of $T$. In particular, if $\mu\perp\sigma$, then $P[d\mu]\to0$ nontangentially $\sigma$-a.e.`,
      idea: String.raw`By 11.23 it is enough to show that $P[d\mu_s]\to0$ nontangentially a.e. Since $\mu_s\perp\sigma$, the symmetric derivative of $|\mu_s|$ with respect to $\sigma$ is $0$ at $\sigma$-almost every point (Chapter 7); at such a point $|\mu_s|$ restricted to a small arc has a small maximal function there, and 11.20 bounds its Poisson integral by $c_\alpha$ times that inside $\Omega_\alpha$, while the part of $\mu_s$ away from the arc contributes something continuous that vanishes at the point. The singular part can only make itself felt on the $\sigma$-null set where it lives — where, for positive $\mu_s$, $P[d\mu_s]$ typically blows up.`,
      caption: String.raw`$\mu=f\,d\sigma+\mu_s$ with a smooth density $f$ and a singular part: a Cantor measure on the red arc (mass $0.6$, carried by a set of length $0$) and a point mass. Bottom: $u_r(\theta)=P[d\mu](re^{i\theta})$ for $r=0.9,0.97,0.99,0.997$ (lighter to darker gold) against $f$ (ink): away from the Cantor set and the atom they settle on $f$; on them they blow up. Drag $\zeta$ to read the radial values.`,
      deps: ['rca-11.23', 'rca-11.20', 'rca-7.14', 'rca-6.10'],
      see: ['rca-7.15'],
      tags: ['Fatou', 'singular measures', 'Poisson integral'],
      viz(v) {
        const CA = [1.25, 2.45], CM = 0.6, ATOM = [-1.9, 0.25], LEV = 10;
        const cant = [];
        (function rec(a, b, l) { if (l === LEV) { cant.push((a + b) / 2); return; } const d = (b - a) / 3; rec(a, a + d, l + 1); rec(b - d, b, l + 1); })(CA[0], CA[1], 0);
        const wC = CM / cant.length;
        const cc = cant.map(Math.cos), cs = cant.map(Math.sin);
        const fB = (t) => 0.9 + 0.4 * Math.cos(t + 0.5);
        const U = (x, y) => {
          let s = 0.9 + 0.4 * (x * Math.cos(0.5) - y * Math.sin(0.5)) + ATOM[1] * Pz(x, y, ATOM[0]);
          const q = 1 - x * x - y * y;
          for (let k = 0; k < cant.length; k++) { const dx = cc[k] - x, dy = cs[k] - y; s += (wC * q) / (dx * dx + dy * dy); }
          return s;
        };
        const D = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 300, axes: false, title: '$u=P[d\\mu]$, log colour scale' });
        const Z = v.stage({ x: [0, 3.4], y: [0, 4], height: 300, axes: 'box', xlabel: '1 − r', xticks: [[0, '1'], [1, '0.1'], [2, '0.01'], [3, '0.001']], title: 'radial values $u(r\\zeta)$ as $r\\to1$' });
        const B = v.stage({ x: [-Math.PI, Math.PI], y: [0, 3.2], height: 190, full: true, axes: 'box', xticks: PI_TICKS, title: '$u_r(\\theta)$ for $r\\to1$, against the density $f(\\theta)$' });
        const zeta = D.handle(Math.cos(0.2), Math.sin(0.2), { color: 'ink', r: 6.5, label: 'ζ', labelPos: 'e', constrain: onCircle });
        const heat = fieldLayer(v, D);
        const NT = 900, ths = Array.from({ length: NT }, (_, i) => -Math.PI + (TAU * (i + 0.5)) / NT);
        const RS = [0.9, 0.97, 0.99, 0.997];
        const curves = RS.map((r) => ths.map((t) => [t, U(r * Math.cos(t), r * Math.sin(t))]));
        let st = null;
        v.render(() => {
          const th = Math.atan2(zeta.y, zeta.x);
          heat((x, y) => (x * x + y * y < 1 ? Math.log10(U(x, y)) : NaN), { key: 'u', range: [-0.35, 1.1], cmap: 'magma', step: 0.1, offset: 0.05, res: 3 });
          D.circle(0, 0, 1, { color: 'ink', width: 1.4 });
          D.curve((t) => [1.06 * Math.cos(t), 1.06 * Math.sin(t)], CA[0], CA[1], { color: 'red', width: 1.5, alpha: 0.6 });
          for (let k = 0; k < cant.length; k += 8) D.line(cc[k], cs[k], 1.06 * cc[k], 1.06 * cs[k], { color: 'red', width: 1.2 });
          D.arrow(Math.cos(ATOM[0]), Math.sin(ATOM[0]), 1.25 * Math.cos(ATOM[0]), 1.25 * Math.sin(ATOM[0]), { color: 'red', width: 2.6, head: 8 });
          D.line(0, 0, Math.cos(th), Math.sin(th), { color: 'gold', width: 2, dash: [5, 3] });
          // radial profile
          const prof = []; let pm = 0;
          for (let k = 0; k <= 300; k++) { const rr = Math.min(1 - 10 ** (-3.3 * (k / 300)), 0.9995); const val = U(rr * Math.cos(th), rr * Math.sin(th)); prof.push([-Math.log10(1 - rr), val]); pm = Math.max(pm, val); }
          const top = Math.max(2, Math.min(12, pm * 1.1));
          Z.setView(null, [0, top]);
          Z.hline(fB(th), { color: 'ink', width: 1.6, dash: [6, 4] });
          Z.path(prof, { color: 'gold', width: 2.4 });
          Z.tex('f(\\zeta)', 0.02, fB(th), { color: 'ink', size: 13, align: 'left', baseline: 'bottom', dy: -3 });
          // strip
          B.vband(CA[0], CA[1], { color: 'red', alpha: 0.07 });
          B.vline(ATOM[0], { color: 'red', width: 1, dash: [2, 3] });
          curves.forEach((pts, j) => B.path(pts.map(([t, y]) => [t, Math.min(y, 3.3)]), { color: 'gold', width: 1.4 + 0.4 * j, alpha: 0.3 + 0.23 * j }));
          B.fn(fB, { color: 'ink', width: 2.4, domain: [-Math.PI, Math.PI] });
          B.vline(th, { color: 'ink', width: 1, dash: [3, 3] });
          B.text('Cantor part of μ', (CA[0] + CA[1]) / 2, 3.0, { color: 'red', size: 12, align: 'center' });
          B.text('atom', ATOM[0], 3.0, { color: 'red', size: 12, align: 'center' });
          const vals = [0.99, 0.999, 0.9999].map((r) => U(r * Math.cos(th), r * Math.sin(th)));
          const onSing = Math.abs(wrap(th - ATOM[0])) < 0.02 || (th > CA[0] - 0.01 && th < CA[1] + 0.01);
          st = { f: fB(th), vals, onSing };
          v.legend([['ink', 'density $f$'], ['gold', '$u_r$, $r=0.9,\\,0.97,\\,0.99,\\,0.997$'], ['red', 'support of $\\mu_s$', { area: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `At $\\zeta$: $f(\\zeta)=${v.fix(s.f, 4)}$; $\\;u(r\\zeta)=${s.vals.map((x) => v.fix(x, 4)).join(',\\ ')}$ for $r=0.99,\\,0.999,\\,0.9999$. ` + (s.onSing ? 'Here $\\zeta$ lies on (or next to) the support of $\\mu_s$, a $\\sigma$-null set where the radial values need not approach $f$.' : 'The radial values approach the density $f(\\zeta)$, the Radon–Nikodym derivative $d\\mu/d\\sigma$.');
        });
      },
    },
  ],
};
