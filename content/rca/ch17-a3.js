// Rudin, Real and Complex Analysis — Chapter 17 (part 3: factorization theorems)

// ---------------------------------------------------------------- helpers shared by this file
const TAU = 2 * Math.PI;
const PI_TICKS = [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']];
const rOf = (x) => 1 - Math.pow(10, -x);
const R_TICKS = [[0, '0'], [1, '0.9'], [2, '0.99'], [3, '0.999'], [4, '0.9999']];
function nodes(n = 480, c = 0, pw = 3) {
  const th = [], w = []; const h = 2 / n;
  for (let i = 0; i <= n; i++) {
    const s = -1 + i * h, jac = pw * Math.PI * Math.pow(Math.abs(s), pw - 1); if (!jac) continue;
    th.push(c + Math.PI * Math.sign(s) * Math.pow(Math.abs(s), pw)); w.push((i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * jac * h / 3 / TAU);
  }
  return { th, w };
}
function meanC(g, n = 480, c = 0) { const { th, w } = nodes(n, c); let s = 0; for (let i = 0; i < th.length; i++) s += w[i] * g(th[i]); return s; }
function logMeanExp(L, n = 480, c = 0) {
  const { th, w } = nodes(n, c); const vals = th.map(L); let mx = -Infinity;
  for (const x of vals) if (x > mx) mx = x;
  if (!isFinite(mx)) return mx;
  let s = 0; for (let i = 0; i < vals.length; i++) s += w[i] * Math.exp(vals[i] - mx);
  return mx + Math.log(s);
}
const poissonK = (r, t) => (1 - r * r) / (1 - 2 * r * Math.cos(t) + r * r);
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cexp = (a) => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
const cabs = (a) => Math.hypot(a[0], a[1]);
const cpow1m = (x, y, s) => { const u = 1 - x, w = -y; const lr = 0.5 * Math.log(u * u + w * w), th = Math.atan2(w, u); return cexp([s * lr, s * th]); };
const herg = (t, x, y) => { const c = Math.cos(t), s = Math.sin(t); return cdiv([c + x, s + y], [c - x, s - y]); };
const bfac = (a, x, y) => cdiv([x - a[0], y - a[1]], [1 - (a[0] * x + a[1] * y), a[1] * x - a[0] * y]);
/** (1/2π)∫ over the counterclockwise arc from t1 of length L of (e^{it}+z)/(e^{it}−z) dt, in closed form. */
function hergArc(t1, L, x, y) {
  const a = [Math.cos(t1), Math.sin(t1)], b = [Math.cos(t1 + L), Math.sin(t1 + L)];
  const q = cdiv([b[0] - x, b[1] - y], [a[0] - x, a[1] - y]);
  let arg = Math.atan2(q[1], q[0]); if (arg <= 0) arg += TAU;
  return [arg / Math.PI - L / TAU, -0.5 * Math.log(q[0] * q[0] + q[1] * q[1]) / Math.PI];
}
function phaseRGB(M, re, im) {
  if (!isFinite(re) || !isFinite(im)) return [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  return M.hsl2rgb(Math.atan2(im, re) / TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
}
function discPhase(v, S, F, key, res = 2) { S.raster((x, y) => { if (x * x + y * y >= 1) return null; const w = F(x, y); return phaseRGB(v.M, w[0], w[1]); }, { key, res }); }
const onCircle = (x, y) => { const t = Math.atan2(y, x); return [Math.cos(t), Math.sin(t)]; };
const inDisc = (m) => (x, y) => { const d = Math.hypot(x, y); return d > m ? [x * m / d, y * m / d] : [x, y]; };
const angle = (h) => Math.atan2(h.y, h.x);
/** Ticks for a log10 axis spanning [y0, y1]: labels are the actual values m·10^k. */
function logTicks(y0, y1, fmt) {
  const out = [];
  for (let k = Math.floor(y0) - 1; k <= Math.ceil(y1) + 1; k++) for (const m of [1, 1.5, 2, 3, 5, 7]) { const y = k + Math.log10(m); if (y >= y0 && y <= y1) out.push([y, fmt(m * 10 ** k)]); }
  if (out.length > 7) return out.filter(([y]) => Math.abs(y - Math.round(y)) < 1e-9 || Math.abs(y - Math.round(y) - Math.log10(2)) < 1e-9 || Math.abs(y - Math.round(y) - Math.log10(5)) < 1e-9);
  return out;
}
/** Counterclockwise arc length from angle a to angle b, in (0, 2π]. */
const ccw = (a, b) => { let L = b - a; while (L <= 0) L += TAU; while (L > TAU) L -= TAU; return L; };

import { boundaryNonvanishing } from './hardy-restorations.shared.js';

export default {
  collection: 'rca',
  chapter: 17,
  items: [
    boundaryNonvanishing,
    // ------------------------------------------------------------------ factorization theorems
    {
      num: '17.14',
      kind: 'Definition',
      name: 'Inner and outer functions',
      credit: 'Beurling, 1949',
      statement: String.raw`A function $M\in H^\infty$ is an **inner function** if $|M^*|=1$ a.e. on $\T$.

If $c$ is a constant with $|c|=1$ and $\varphi$ is a positive measurable function on $\T$ with $\log\varphi\in L^1(\T)$, the function
$$Q(z)=c\,\exp\Big\{\frac1{2\pi}\int_{-\pi}^{\pi}\frac{e^{it}+z}{e^{it}-z}\,\log\varphi(e^{it})\,dt\Big\}\qquad(z\in U)$$
is called an **outer function**.`,
      idea: String.raw`The two classes play the roles of "phase" and "modulus". An inner function has boundary values of modulus $1$, so all of its smallness lives *inside* the disc (zeros, or the singular decay of $e^{-\frac{1+z}{1-z}}$); its means $\int\log|M(re^{i\theta})|\,d\theta$ are negative and increase with $r$. An outer function is built from a prescribed modulus: $\log|Q|$ is the Poisson integral of $\log\varphi$, so $Q$ has no zeros, $|Q^*|=\varphi$ a.e. (17.16), and $\log|Q(0)|=\frac1{2\pi}\int\log\varphi$ — the mean of $\log|Q|$ is the same on every circle. Theorem 17.17 shows that every $f\in H^p$ is a product of the two.`,
      caption: String.raw`Choose a function and move $r$ toward $1$. Middle: $|F(re^{i\theta})|$ (blue) approaches its boundary modulus (black): the constant $1$ for the inner functions, $\varphi$ for the outer one. Right: the mean of $\log|F|$ over $|z|=r$. For an outer function it is *constant*; for the inner ones it is negative and increases toward $0$; for the product $S\cdot Q$ (neither inner nor outer) it stays strictly below $\frac1{2\pi}\int\log|F^*|$.`,
      deps: ['rca-17.7', 'rca-17.19b'],
      tags: ['inner functions', 'outer functions'],
      viz(v) {
        const ZB = [[0.55, 0.35], [-0.4, 0.6], [-0.2, -0.7]];
        const Bf = (x, y) => { let p = [1, 0]; for (const a of ZB) p = cmul(p, bfac(a, x, y)); return p; };
        const Sf = (x, y) => { const k = herg(0, x, y); return cexp([-0.8 * k[0], -0.8 * k[1]]); };
        const Qf = (x, y) => { const s = cexp([0.25 * Math.log((1 + x) ** 2 + y * y), 0.5 * Math.atan2(y, 1 + x)]); return cmul(s, cexp([0.5 * x, 0.5 * y])); };
        const logPhi = (t) => 0.5 * Math.log(Math.abs(2 * Math.cos(t / 2))) + 0.5 * Math.cos(t);
        const FN = {
          B: { label: 'Blaschke $B$ (inner)', f: Bf, star: () => 0, kind: 'inner' },
          S: { label: '$S=e^{-0.8\\frac{1+z}{1-z}}$ (inner)', f: Sf, star: () => 0, kind: 'inner' },
          Q: { label: '$Q=\\sqrt{1+z}\\,e^{z/2}$ (outer)', f: Qf, star: logPhi, kind: 'outer' },
          SQ: { label: '$S\\cdot Q$ (neither)', f: (x, y) => cmul(Sf(x, y), Qf(x, y)), star: logPhi, kind: 'neither' },
        };
        const which = v.select('$F$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'Q');
        const rS = v.slider('$r$', 0.3, 0.995, 0.85, { step: 0.005 });
        const L = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, height: 270, axes: false, minWidth: 220, title: 'phase portrait of $F$; the circle $|z|=r$' });
        const P = v.stage({ x: [-Math.PI, Math.PI], y: [0, 2], height: 270, axes: 'box', xticks: PI_TICKS, xlabel: 'θ', weight: 1.3, title: '$|F(re^{i\\theta})|$ and $|F^*(e^{i\\theta})|$' });
        const C = v.stage({ x: [0, 1], y: [-1, 0.5], height: 270, axes: 'box', xlabel: 'r', minWidth: 220, title: '$\\frac1{2\\pi}\\int\\log|F(re^{i\\theta})|\\,d\\theta$' });
        let st = null, cache = {};
        v.render(() => {
          const key = which.value, F = FN[key], r = rS.value;
          discPhase(v, L, F.f, key);
          L.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          L.circle(0, 0, r, { color: 'panel', width: 4.5 }); L.circle(0, 0, r, { color: 'ink', width: 2 });
          const prof = (rr) => (t) => cabs(F.f(rr * Math.cos(t), rr * Math.sin(t)));
          const ys = []; for (let k = 0; k <= 600; k++) { const t = -Math.PI + TAU * k / 600; ys.push(prof(r)(t), Math.exp(F.star(t))); }
          const top = Math.min(4, Math.max(1.3, ...ys.filter(isFinite)) * 1.1);
          P.setView(null, [0, top]);
          P.fn((t) => Math.exp(F.star(t)), { color: 'ink', width: 1.8, n: 800 });
          P.fn(prof(r), { color: 'accent', width: 2.4, n: 1200 });
          if (!cache[key]) {
            const rs = v.M.linspace(0, 0.999, 80);
            cache[key] = { pts: rs.map((rr) => [rr, meanC((t) => Math.log(prof(rr)(t)), 900, 0)]), star: meanC(F.star, 2000, Math.PI) };
          }
          const { pts, star } = cache[key];
          const all = pts.map((q) => q[1]).concat([star, 0]);
          const y0 = Math.min(...all), y1 = Math.max(...all), pd = Math.max(0.1, (y1 - y0) * 0.15);
          C.setView(null, [y0 - pd, y1 + pd]);
          C.hline(star, { color: 'ink', width: 1.4, dash: [6, 4] });
          C.tex('\\int\\log|F^*|', 0.98, star, { color: 'ink', size: 12, align: 'right', baseline: 'bottom', dy: -3 });
          C.path(pts, { color: F.kind === 'outer' ? 'green' : F.kind === 'inner' ? 'purple' : 'orange', width: 2.4 });
          const mr = meanC((t) => Math.log(prof(r)(t)), 900, 0);
          C.dot(r, mr, { color: 'accent', r: 5 });
          st = { r, mr, star, kind: F.kind };
          v.legend([['ink', 'boundary modulus $|F^*|$'], ['accent', '$|F(re^{i\\theta})|$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const z = (x) => v.fix(Math.abs(x) < 5e-5 ? 0 : x, 4);
          const head = `At $r = ${v.fix(s.r, 3)}$: mean of $\\log|F| = ${z(s.mr)}$; $\\;\\frac1{2\\pi}\\int\\log|F^*| = ${z(s.star)}$. `;
          if (s.kind === 'outer') return head + 'Outer: $\\log|Q|=P[\\log\\varphi]$, so the mean is the same on every circle.';
          if (s.kind === 'inner') return head + 'Inner: $|F^*|=1$, yet the means are negative — the deficit sits in the zeros or the singular point.';
          return head + 'Neither: the singular factor keeps every mean below $\\int\\log|F^*|$.';
        });
      },
    },
    {
      num: '17.15',
      kind: 'Theorem',
      name: 'Inner functions are c·B·S_μ',
      statement: String.raw`Let $c$ be a constant with $|c|=1$, $B$ a Blaschke product (possibly with zeros $\alpha_k$ repeated, possibly finite or $\equiv1$), $\mu$ a finite positive Borel measure on $\T$ which is singular with respect to Lebesgue measure, and
$$M(z)=c\,B(z)\exp\Big\{-\int_{-\pi}^{\pi}\frac{e^{it}+z}{e^{it}-z}\,d\mu(t)\Big\}\qquad(z\in U).$$
Then $M$ is an inner function, and every inner function has this form.`,
      idea: String.raw`The singular factor $S_\mu$ has $|S_\mu|=e^{-P[\mu]}\le1$, and $P[\mu]\to D\mu=0$ a.e. at the boundary because $\mu\perp m$ (the derivative of a singular measure vanishes a.e., chapter 7/11), so $|S_\mu^*|=1$ a.e.; with $|B^*|=1$ a.e. (15.24) $M$ is inner. Conversely, if $M$ is inner, divide out its zeros: $g=M/B$ is zero-free with $|g|\le1$, so $-\log|g|$ is a positive harmonic function, i.e. $P[\mu]$ for a positive measure $\mu$ (11.30). Its absolutely continuous part has density $-\log|g^*|=0$ a.e., so $\mu$ is singular, and $g=c\,e^{-H[\mu]}$.`,
      caption: String.raw`Build an inner function: drag the zeros $\alpha_1,\alpha_2$ (Blaschke part), the atoms $\zeta_1,\zeta_2$ of $\mu$ on the circle and their masses, and optionally add a Cantor-type measure spread over an arc (singular but without atoms, approximated by $2^7$ equal pieces). Right: $|M(re^{i\theta})|$ for $r=0.9$, $0.99$, $0.999$ — it is $1$ at almost every boundary point and collapses only at the support of $\mu$. The readout checks $\log|M(0)|=\sum_k\log|\alpha_k|-\mu(\T)$.`,
      deps: ['rca-17.14', 'rca-15.21', 'rca-15.24', 'rca-11.30', 'rca-11.24', 'rca-6.10'],
      tags: ['inner functions', 'singular measures', 'Blaschke products'],
      viz(v) {
        const m1 = v.slider('mass at $\\zeta_1$', 0, 1.5, 0.6, { step: 0.05 });
        const m2 = v.slider('mass at $\\zeta_2$', 0, 1.5, 0.3, { step: 0.05 });
        const cant = v.toggle('Cantor measure (mass $0.5$) on an arc', false);
        const L = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 330, axes: false, minWidth: 260, title: 'phase portrait of $M=B\\,S_\\mu$' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [0, 1.15], height: 330, axes: 'box', xticks: PI_TICKS, xlabel: 'θ', weight: 1.35, title: '$|M(re^{i\\theta})|$ for $r=0.9,\\ 0.99,\\ 0.999$' });
        const A1 = L.handle(0.45, 0.3, { color: 'ink', label: 'α₁', labelPos: 'ne', constrain: inDisc(0.95) });
        const A2 = L.handle(-0.35, -0.45, { color: 'ink', label: 'α₂', labelPos: 'sw', constrain: inDisc(0.95) });
        const Z1 = L.handle(Math.cos(0.4), Math.sin(0.4), { color: 'red', label: 'ζ₁', labelPos: 'e', constrain: onCircle });
        const Z2 = L.handle(Math.cos(2.5), Math.sin(2.5), { color: 'red', label: 'ζ₂', labelPos: 'nw', constrain: onCircle });
        // Cantor measure on the arc [T0, T0 + LC]: 2^7 atoms at the centres of the level-7 intervals
        const T0 = -2.3, LC = 1.5, CM = 0.5;
        const CAT = v.M.cantorIntervals(7).map(([a, b]) => T0 + LC * (a + b) / 2);
        let st = null;
        v.render(() => {
          const a1 = [A1.x, A1.y], a2 = [A2.x, A2.y], t1 = angle(Z1), t2 = angle(Z2), w1 = m1.value, w2 = m2.value, cn = cant.value;
          const H = (x, y) => {
            let re = 0, im = 0;
            const k1 = herg(t1, x, y), k2 = herg(t2, x, y);
            re += w1 * k1[0] + w2 * k2[0]; im += w1 * k1[1] + w2 * k2[1];
            if (cn) for (const t of CAT) { const k = herg(t, x, y); re += CM / CAT.length * k[0]; im += CM / CAT.length * k[1]; }
            return [re, im];
          };
          const Mf = (x, y) => { const h = H(x, y); return cmul(cmul(bfac(a1, x, y), bfac(a2, x, y)), cexp([-h[0], -h[1]])); };
          discPhase(v, L, Mf, [a1, a2, t1, t2, w1, w2, cn].join('|'));
          L.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          if (cn) { L.curve((s) => [1.04 * Math.cos(T0 + LC * s), 1.04 * Math.sin(T0 + LC * s)], 0, 1, { color: 'red', width: 2.5, dash: [2, 3] }); }
          // profiles
          const cols = [['faint', 0.9], ['muted', 0.99], ['accent', 0.999]];
          for (const [col, r] of cols) R.fn((t) => cabs(Mf(r * Math.cos(t), r * Math.sin(t))), { color: col, width: col === 'accent' ? 2.2 : 1.6, n: 2400 });
          R.hline(1, { color: 'green', width: 1.2, dash: [6, 4] });
          for (const [t, w] of [[t1, w1], [t2, w2]]) if (w > 0) { R.vline(t, { color: 'red', width: 1, dash: [3, 4] }); R.dot(t, 0, { color: 'red', r: 4.5 }); }
          if (cn) R.rect(T0, 0, T0 + LC, 0.035, { fill: 'red', fillAlpha: 0.35, stroke: false });
          const mu = w1 + w2 + (cn ? CM : 0);
          const formula = Math.log(Math.hypot(...a1)) + Math.log(Math.hypot(...a2)) - mu;
          const actual = Math.log(cabs(Mf(0, 0)));
          // fraction of the circle where |M(0.999 e^{iθ})| > 0.95
          let good = 0; const NG = 4000; for (let k = 0; k < NG; k++) { const t = -Math.PI + TAU * (k + 0.5) / NG; if (cabs(Mf(0.999 * Math.cos(t), 0.999 * Math.sin(t))) > 0.95) good++; }
          st = { mu, formula, actual, frac: good / NG };
          v.legend([['faint', '$r=0.9$'], ['muted', '$r=0.99$'], ['accent', '$r=0.999$'], ['red', 'support of $\\mu$', { dot: true }], ['green', '$|M^*|=1$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\log|M(0)| = ${v.fix(s.actual, 5)}$ and $\\log|\\alpha_1|+\\log|\\alpha_2|-\\mu(\\T) = ${v.fix(s.formula, 5)}$ ($\\mu(\\T) = ${v.fix(s.mu, 2)}$). At $r = 0.999$, $|M|>0.95$ on ${v.fix(100 * s.frac, 1)}% of the circle.`;
        });
      },
    },
    {
      num: '17.16',
      kind: 'Theorem',
      name: 'Outer functions have prescribed boundary modulus',
      statement: String.raw`Suppose $Q$ is an outer function built from $\varphi$ as in 17.14. Then
(a) $\log|Q|=P[\log\varphi]$, the Poisson integral of $\log\varphi$;
(b) $\lim_{r\to1}|Q(re^{i\theta})|=\varphi(e^{i\theta})$ for almost every $\theta$;
(c) $Q\in H^p$ if and only if $\varphi\in L^p(\T)$ $(0<p\le\infty)$, and in that case $\|Q\|_p=\|\varphi\|_p$.`,
      idea: String.raw`(a) is the real part of the Herglotz integral: $\Re\frac{e^{it}+z}{e^{it}-z}$ is the Poisson kernel. (b) follows because Poisson integrals of $L^1$ functions converge to them a.e. (chapter 11). For (c): if $\varphi\in L^p$, Jensen's inequality (3.3) for the probability measure $P_r(\theta-t)\,dt/2\pi$ gives $|Q(re^{i\theta})|^p=\exp\{P[p\log\varphi]\}\le P[\varphi^p](re^{i\theta})$, and integrating over $\theta$ yields $M_p(Q;r)\le\|\varphi\|_p$. Conversely, if $Q\in H^p$ then $\|\varphi\|_p=\|Q^*\|_p\le\|Q\|_p$ by Fatou's lemma (17.19b).`,
      caption: String.raw`$\varphi=e^{c}$ on the arc between the two red handles, $1$ elsewhere, times $|1-e^{i\theta}|^{-a}$; the outer function is then $Q=(1-z)^{-a}\exp\{c\,H_{\text{arc}}\}$, evaluated in closed form. Top right: $\log\varphi$ (black) and $\log|Q(re^{i\theta})|=P[\log\varphi]$ (blue) — a smoothed copy that sharpens as $r\to1$. Bottom: $M_p(Q;r)$ climbs to $\|\varphi\|_p$ exactly when $\varphi\in L^p$, i.e. when $ap<1$; otherwise both are infinite.`,
      deps: ['rca-17.14', 'rca-3.3', 'rca-11.24', 'rca-17.19b'],
      tags: ['outer functions', 'Poisson integral'],
      viz(v) {
        const cS = v.slider('level $c=\\log\\varphi$ on the arc', -2.5, 2, 1.2, { step: 0.05 });
        const aS = v.slider('singularity $a$', 0, 0.9, 0.35, { step: 0.01 });
        const pS = v.slider('$p$', 0.5, 4, 2, { step: 0.05 });
        const rS = v.slider('$r$', 0.5, 0.995, 0.9, { step: 0.005 });
        const L = v.stage({ x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 290, axes: false, minWidth: 240, title: 'phase portrait of the outer function $Q$' });
        const T = v.stage({ x: [-Math.PI, Math.PI], y: [-3, 3], height: 290, axes: 'box', xticks: PI_TICKS, xlabel: 'θ', weight: 1.4, title: '$\\log\\varphi(e^{i\\theta})$ and $\\log|Q(re^{i\\theta})|$' });
        const C = v.stage({ x: [0, 3.3], y: [0, 2], height: 190, axes: 'box', full: true, xticks: R_TICKS.slice(0, 4), xlabel: 'r', title: '$M_p(Q;r)$ against $r$ (log scale)' });
        const E1 = L.handle(Math.cos(1.2), Math.sin(1.2), { color: 'red', r: 6, constrain: onCircle });
        const E2 = L.handle(Math.cos(2.9), Math.sin(2.9), { color: 'red', r: 6, constrain: onCircle });
        let st = null;
        v.render(() => {
          const c = cS.value, a = aS.value, p = pS.value, r = rS.value;
          const t1 = angle(E1), Lr = ccw(t1, angle(E2));
          const inArc = (t) => { let d = t - t1; while (d < 0) d += TAU; while (d >= TAU) d -= TAU; return d < Lr; };
          const logPhi = (t) => (inArc(t) ? c : 0) - a * Math.log(Math.abs(2 * Math.sin(t / 2)));
          const Qf = (x, y) => { const h = hergArc(t1, Lr, x, y); return cmul(cpow1m(x, y, -a), cexp([c * h[0], c * h[1]])); };
          const logQ = (rr, t) => Math.log(cabs(Qf(rr * Math.cos(t), rr * Math.sin(t))));
          discPhase(v, L, Qf, [t1, Lr, c, a].join('|'));
          L.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          L.curve((s) => [1.05 * Math.cos(t1 + Lr * s), 1.05 * Math.sin(t1 + Lr * s)], 0, 1, { color: 'red', width: 3 });
          L.circle(0, 0, r, { color: 'panel', width: 4 }); L.circle(0, 0, r, { color: 'ink', width: 1.6, dash: [5, 4] });
          // profiles
          const lo = Math.min(-1, c - 0.6, -0.8), hi = Math.max(1, c + 0.6) + 1.2 * a;
          T.setView(null, [lo, hi]);
          T.fn(logPhi, { color: 'ink', width: 1.8, n: 2000 });
          T.fn((t) => logQ(r, t), { color: 'accent', width: 2.4, n: 1200 });
          // means
          const xs = v.M.linspace(0, 3.2, 60);
          const lm = xs.map((x) => [x, logMeanExp((t) => p * logQ(rOf(x), t), 1600, 0) / p / Math.LN10]);
          const member = a * p < 1;
          const lphi = member ? logMeanExp((t) => p * logPhi(t), 6000, 0) / p / Math.LN10 : Infinity;
          const ys = lm.map((q) => q[1]).concat(member ? [lphi] : []);
          const y0 = Math.min(...ys), y1 = Math.max(...ys), pd = Math.max(0.05, (y1 - y0) * 0.15);
          C.setView(null, [y0 - pd, y1 + pd]);
          C.setTicks(undefined, logTicks(y0 - pd, y1 + pd, (x) => v.fmt(x, 3)));
          if (member) { C.hline(lphi, { color: 'green', width: 1.5, dash: [6, 4] }); C.tex('\\|\\varphi\\|_p', 3.25, lphi, { color: 'green', size: 13, align: 'right', baseline: 'bottom', dy: -3 }); }
          C.path(lm, { color: member ? 'accent' : 'red', width: 2.4 });
          C.vline(-Math.log10(1 - r), { color: 'muted', width: 1, dash: [3, 4] });
          C.corner(member ? `ap = ${v.fix(a * p, 2)} < 1: φ ∈ Lᵖ and Q ∈ Hᵖ` : `ap = ${v.fix(a * p, 2)} ≥ 1: φ ∉ Lᵖ and Q ∉ Hᵖ`, 'tl', { color: member ? 'green' : 'red', weight: 600 });
          const meanLogQ = meanC((t) => logQ(r, t), 1600, 0), meanLogPhi = c * Lr / TAU; // ∫log|2 sin(t/2)| = 0
          st = { member, lphi, mEnd: lm[lm.length - 1][1], meanLogQ, meanLogPhi, q0: Math.log(cabs(Qf(0, 0))) };
          v.legend([['ink', '$\\log\\varphi$'], ['accent', '$\\log|Q(re^{i\\theta})|$ and $M_p(Q;r)$'], ['red', 'arc where $\\log\\varphi=c$'], ['green', '$\\|\\varphi\\|_p$', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `(a) $\\log|Q(0)| = ${v.fix(s.q0, 4)}$, mean of $\\log|Q|$ on $|z|=r$: $${v.fix(s.meanLogQ, 4)}$, $\\frac1{2\\pi}\\int\\log\\varphi = \\frac{cL}{2\\pi} = ${v.fix(s.meanLogPhi, 4)}$. ` +
            (s.member ? `(c) $M_p(Q;0.9994) = ${v.fmt(10 ** s.mEnd, 4)}$, $\\|\\varphi\\|_p = ${v.fmt(10 ** s.lphi, 4)}$.` : '(c) $\\varphi\\notin L^p$, and $M_p(Q;r)\\to\\infty$.');
        });
      },
    },
    {
      num: '17.17',
      kind: 'Theorem',
      name: 'Canonical factorization f = M_f · Q_f',
      statement: String.raw`Suppose $0<p\le\infty$, $f\in H^p$, and $f\not\equiv0$. Then
(a) $\log|f^*|\in L^1(\T)$;
(b) the outer function $Q_f(z)=\exp\big\{\frac1{2\pi}\int\frac{e^{it}+z}{e^{it}-z}\log|f^*(e^{it})|\,dt\big\}$ belongs to $H^p$;
(c) there is an inner function $M_f$ such that $f=M_fQ_f$;
(d) $\log|f(0)|\le\frac1{2\pi}\int_{-\pi}^{\pi}\log|f^*(e^{it})|\,dt$.

By 17.15, $M_f=c\,B\,S_\mu$, so $f=c\cdot B\cdot S_\mu\cdot Q_f$: Blaschke product × singular inner function × outer function.`,
      idea: String.raw`(a) is part of 17.19b, and (b) is 17.16(c) since $|f^*|\in L^p$. For (c), divide out the zeros: $f=Bg$ with $g$ zero-free in $H^p$ (17.9). Then $\log|g|$ is harmonic and dominated by the Poisson integral of $\log|g^*|=\log|f^*|$ (apply 17.6–17.11 to $g^{p/2}$ and Jensen's inequality), so $g/Q_f$ is zero-free with modulus $\le1$ and boundary modulus $1$ a.e.: it is a singular inner function. (d) is the statement $|M_f(0)|\le1$, with equality iff $f$ is outer up to a unimodular constant.`,
      caption: String.raw`$f=B\cdot S_\mu\cdot Q$ with two draggable zeros, one atom $\zeta$ of mass $m$ on the circle, and the outer factor $Q=(1-z)^{-1/4}(1+z/2)$. The four phase portraits are $f$ and its three factors. The bar below is the bookkeeping of (d): starting from $\frac1{2\pi}\int\log|f^*|=\log|Q(0)|$, the Blaschke factor costs $\sum\log\frac1{|\alpha_k|}$ and the singular factor costs $\mu(\T)=m$; what remains is exactly $\log|f(0)|$.`,
      deps: ['rca-17.15', 'rca-17.16', 'rca-17.9', 'rca-17.19b', 'rca-17.11'],
      see: ['rca-17.21'],
      tags: ['factorization', 'inner functions', 'outer functions'],
      viz(v) {
        const mS = v.slider('mass $m$ of the atom at $\\zeta$', 0, 1.5, 0.5, { step: 0.05 });
        const o = { x: [-1.12, 1.12], y: [-1.12, 1.12], equal: true, height: 220, axes: false, minWidth: 180 };
        const F = v.stage({ ...o, title: '$f=B\\,S_\\mu\\,Q$' });
        const Bs = v.stage({ ...o, title: 'Blaschke $B$' });
        const Ss = v.stage({ ...o, title: 'singular inner $S_\\mu$' });
        const Qs = v.stage({ ...o, title: 'outer $Q$' });
        const W = v.stage({ x: [-3, 1], y: [0, 1], height: 120, axes: false, full: true });
        const A1 = F.handle(0.5, 0.4, { color: 'ink', label: 'α₁', labelPos: 'ne', constrain: inDisc(0.96) });
        const A2 = F.handle(-0.3, -0.55, { color: 'ink', label: 'α₂', labelPos: 'sw', constrain: inDisc(0.96) });
        const Z = F.handle(Math.cos(2.3), Math.sin(2.3), { color: 'red', label: 'ζ', labelPos: 'nw', constrain: onCircle });
        const Qf = (x, y) => cmul(cpow1m(x, y, -0.25), [1 + x / 2, y / 2]);
        let st = null;
        v.render(() => {
          const a1 = [A1.x, A1.y], a2 = [A2.x, A2.y], tz = angle(Z), m = mS.value;
          const Bf = (x, y) => cmul(bfac(a1, x, y), bfac(a2, x, y));
          const Sf = (x, y) => { const k = herg(tz, x, y); return cexp([-m * k[0], -m * k[1]]); };
          discPhase(v, F, (x, y) => cmul(cmul(Bf(x, y), Sf(x, y)), Qf(x, y)), [a1, a2, tz, m].join('|'));
          discPhase(v, Bs, Bf, [a1, a2].join('|'));
          discPhase(v, Ss, Sf, [tz, m].join('|'));
          discPhase(v, Qs, Qf, 'q');
          for (const S of [F, Bs, Ss, Qs]) S.circle(0, 0, 1, { color: 'ink', width: 1.2 });
          Bs.dot(a1[0], a1[1], { color: 'ink', r: 3.5 }); Bs.dot(a2[0], a2[1], { color: 'ink', r: 3.5 });
          Ss.dot(Z.x, Z.y, { color: 'red', r: 4.5 });
          // bookkeeping bar
          const star = Math.log(cabs(Qf(0, 0)));
          const bl = -Math.log(Math.hypot(...a1)) - Math.log(Math.hypot(...a2));
          const f0 = Math.log(cabs(cmul(cmul(Bf(0, 0), Sf(0, 0)), Qf(0, 0))));
          const lo = Math.min(-3, f0 - 0.3);
          W.setView([lo, Math.max(0.6, star + 0.4)], [0, 1]);
          const y = 0.42, hgt = 0.26;
          W.rect(star - bl, y - hgt / 2, star, y + hgt / 2, { fill: 'purple', fillAlpha: 0.55, stroke: false });
          W.rect(star - bl - m, y - hgt / 2, star - bl, y + hgt / 2, { fill: 'red', fillAlpha: 0.5, stroke: false });
          W.line(star, y - hgt, star, y + hgt, { color: 'green', width: 2.4 });
          W.line(f0, y - hgt, f0, y + hgt, { color: 'ink', width: 2.4 });
          W.line(0, y - hgt * 1.4, 0, y + hgt * 1.4, { color: 'faint', width: 1, dash: [3, 3] });
          W.tex('\\int\\log|f^*|', star, y + hgt + 0.02, { color: 'green', size: 13, baseline: 'bottom' });
          W.tex('\\log|f(0)|', f0, y - hgt - 0.02, { color: 'ink', size: 13, baseline: 'top' });
          if (bl > 0.15) W.tex('\\textstyle\\sum\\log\\frac1{|\\alpha_k|}', star - bl / 2, y, { color: 'panel', size: 12 });
          if (m > 0.25) W.tex('\\mu(\\mathbb T)', star - bl - m / 2, y, { color: 'panel', size: 12 });
          W.text('0', 0, y - hgt * 1.4 - 0.04, { color: 'muted', size: 11, align: 'center', baseline: 'top' });
          st = { star, bl, m, f0 };
          v.legend([['purple', 'Blaschke deficit $\\sum\\log\\frac1{|\\alpha_k|}$', { area: true }], ['red', 'singular deficit $\\mu(\\T)$', { area: true }], ['green', '$\\frac1{2\\pi}\\int\\log|f^*|=\\log|Q(0)|$'], ['ink', '$\\log|f(0)|$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\log|f(0)| = ${v.fix(s.f0, 4)} = ${v.fix(s.star, 4)} - ${v.fix(s.bl, 4)} - ${v.fix(s.m, 2)}$ $\\;\\big(=\\int\\log|f^*| - \\sum\\log\\frac1{|\\alpha_k|} - \\mu(\\T)\\big)$, so (d) holds with a gap of $${v.fix(s.bl + s.m, 4)}$; it is an equality only when $f$ has no inner factor.`;
        });
      },
    },
    {
      num: '17.18a',
      kind: 'Theorem',
      name: 'Hᵖ functions with Lˢ boundary values lie in Hˢ',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Consequence of the factorization17.17 and outer-function norm result17.16(c), pp.343–345 (editorial consequence)'],
      statement: String.raw`Suppose $0<p<s\le\infty$, $f\in H^p$, and $f^*\in L^s(\T)$. Then $f\in H^s$.`,
      idea: String.raw`Factor $f=M_fQ_f$ (17.17). The outer factor is built from $|f^*|$, which lies in $L^s$, so $Q_f\in H^s$ by 17.16(c); and $|M_f|\le1$. Hence $M_s(f;r)\le M_s(Q_f;r)\le\|f^*\|_s$. The hypothesis $f\in H^p$ cannot be weakened to $f\in N$: dividing by a singular inner function does not change $|f^*|$ but can destroy every $H^p$ bound.`,
      caption: String.raw`Both functions below have the same boundary modulus $|f^*|=|Q^*|=|1-e^{i\theta}|^{-a}$, where $Q=(1-z)^{-a}$ and $S=e^{-m\frac{1+z}{1-z}}$. When $as<1$ the boundary function is in $L^s$, and $f=Q\,S\in H^{p}$ indeed has bounded $M_s$ (green) — but $f=Q/S$, which lies in $N$ and in no $H^p$, explodes (red): the radial profile shows the hidden spike at $\theta=0$ that vanishes on the circle itself.`,
      deps: ['rca-17.17', 'rca-17.16'],
      tags: ['Hardy spaces', 'factorization'],
      viz(v) {
        const aS = v.slider('$a$ in $|f^*|=|1-e^{i\\theta}|^{-a}$', 0, 0.8, 0.3, { step: 0.01 });
        const sS = v.slider('$s$', 0.5, 6, 2, { step: 0.05 });
        const mS = v.slider('mass $m$ of $S$', 0.05, 1, 0.3, { step: 0.05 });
        const P = v.stage({ x: [-Math.PI, Math.PI], y: [-3, 4], height: 280, axes: 'box', xticks: PI_TICKS, xlabel: 'θ', weight: 1.2, title: '$\\log|f(re^{i\\theta})|$ at $r=0.97$, and $\\log|f^*|$' });
        const C = v.stage({ x: [0, 3.3], y: [0, 3], height: 280, axes: 'box', xticks: R_TICKS.slice(0, 4), xlabel: 'r', title: '$\\log_{10}M_s(f;r)$' });
        let st = null;
        v.render(() => {
          const a = aS.value, s = sS.value, m = mS.value;
          const lq = (r, t) => -0.5 * a * Math.log(1 - 2 * r * Math.cos(t) + r * r);
          const lQS = (r, t) => lq(r, t) - m * poissonK(r, t), lQoS = (r, t) => lq(r, t) + m * poissonK(r, t);
          const lstar = (t) => -a * Math.log(Math.abs(2 * Math.sin(t / 2)));
          const r0 = 0.97;
          P.setView(null, [-2.2, Math.max(2, Math.min(14, m * (1 + r0) / (1 - r0) + 0.6))]);
          P.fn((t) => lQoS(r0, t), { color: 'red', width: 2.2, n: 1600 });
          P.fn((t) => lQS(r0, t), { color: 'green', width: 2.2, n: 1600 });
          P.fn(lstar, { color: 'ink', width: 1.6, dash: [5, 4], n: 1600 });
          const xs = v.M.linspace(0, 3.2, 56);
          const g = xs.map((x) => [x, logMeanExp((t) => s * lQS(rOf(x), t), 1400, 0) / s / Math.LN10]);
          const b = xs.map((x) => [x, logMeanExp((t) => s * lQoS(rOf(x), t), 1400, 0) / s / Math.LN10]);
          const inLs = a * s < 1;
          const bound = inLs ? logMeanExp((t) => s * lstar(t), 6000, 0) / s / Math.LN10 : null;
          const top = Math.max(1.2, (bound ?? 0) + 0.8, ...g.map((q) => q[1] + 0.3));
          const lo = Math.min(-0.3, ...g.map((q) => q[1]), ...b.map((q) => q[1])) - 0.1;
          C.setView(null, [lo, Math.min(top, 12)]);
          if (bound != null) { C.hline(bound, { color: 'ink', width: 1.4, dash: [6, 4] }); C.tex('\\|f^*\\|_s', 3.25, bound, { color: 'ink', size: 13, align: 'right', baseline: 'bottom', dy: -3 }); }
          const yT = C.bounds.y[1];
          C.path(b.map(([x, y]) => [x, Math.min(y, yT + 1)]), { color: 'red', width: 2.4 });
          const ib = b.findIndex((q) => q[1] > yT); if (ib > 0) C.arrow(b[ib - 1][0], b[ib - 1][1], b[ib - 1][0] + (b[ib][0] - b[ib - 1][0]) * (yT - b[ib - 1][1]) / (b[ib][1] - b[ib - 1][1]), yT - 0.02, { color: 'red', head: 9, width: 2.4 });
          C.path(g.map(([x, y]) => [x, Math.min(y, yT + 1)]), { color: 'green', width: 2.4 });
          const ig = g.findIndex((q) => q[1] > yT); if (ig > 0) C.arrow(g[ig - 1][0], g[ig - 1][1], g[ig - 1][0] + (g[ig][0] - g[ig - 1][0]) * (yT - g[ig - 1][1]) / (g[ig][1] - g[ig - 1][1]), yT - 0.02, { color: 'green', head: 9, width: 2.4 });
          C.corner(inLs ? `as = ${v.fix(a * s, 2)} < 1: f* ∈ Lˢ` : `as = ${v.fix(a * s, 2)} ≥ 1: f* ∉ Lˢ`, 'tr', { color: inLs ? 'green' : 'muted', weight: 600 });
          st = { inLs, g: g[g.length - 1][1], b: b[b.length - 1][1], bound };
          v.legend([['green', '$f=Q\\,S\\in H^p$'], ['red', '$f=Q/S\\in N$ only'], ['ink', '$\\log|f^*|$ (the same for both)', { dash: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const fm = (y) => (y > 300 ? '> 10^{300}' : '= ' + v.sci(10 ** y, 3));
          if (!s.inLs) return `Here $f^*\\notin L^s$, so the theorem says nothing; both means grow. At $r = 0.9994$: $M_s(QS) ${fm(s.g)}$.`;
          return `At $r = 0.9994$: $M_s(Q\\,S;r) ${fm(s.g)} \\le \\|f^*\\|_s = ${v.fix(10 ** s.bound, 4)}$, so $QS\\in H^s$; $\\;M_s(Q/S;r) ${fm(s.b)}$ — same boundary values, but $Q/S\\notin H^p$, so the theorem does not apply to it.`;
        });
      },
    },
  ],
};
