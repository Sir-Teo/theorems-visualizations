// Rudin, Real and Complex Analysis — Chapter 15 (part 3): Jensen's formula, Blaschke products, the class N

// ---------------------------------------------------------------- helpers shared by this file
function phaseRGB(M, re, im, fade = 0, bg = null) {
  if (!isFinite(re) || !isFinite(im)) return bg ? [bg[0], bg[1], bg[2]] : [250, 250, 250];
  const t = M.fract(Math.log2(Math.hypot(re, im) + 1e-300));
  const c = M.hsl2rgb(Math.atan2(im, re) / M.TAU, 0.62, 0.42 + 0.2 * Math.pow(t, 0.7));
  if (!fade || !bg) return c;
  return [c[0] + (bg[0] - c[0]) * fade, c[1] + (bg[1] - c[1]) * fade, c[2] + (bg[2] - c[2]) * fade];
}
function xMark(S, x, y, color = 'ink', size = 5.5) {
  const d = size / S.scale;
  for (const [col, w] of [['panel', 5], [color, 2.2]]) {
    S.line(x - d, y - d, x + d, y + d, { color: col, width: w });
    S.line(x - d, y + d, x + d, y - d, { color: col, width: w });
  }
}
// an unfilled ring of pixel radius px
function ring(v, S, x, y, px, color, width = 2.2) {
  const c = S.ctx, X = S.X(x), Y = S.Y(y);
  c.save();
  for (const [col, w] of [['panel', width + 2.5], [color, width]]) { c.beginPath(); c.arc(X, Y, px, 0, 2 * Math.PI); c.strokeStyle = v.color(col); c.lineWidth = w; c.stroke(); }
  c.restore();
}
// colour bar for a heat map, drawn in the bottom-left corner of a stage
function colorBar(S, M, cmap, lo, hi, labLo, labHi) {
  const c = S.ctx, x0 = 12, y0 = S.height - 20, w = 110, h = 8;
  for (let i = 0; i < w; i++) { const col = M.cmap(i / (w - 1), cmap); c.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`; c.fillRect(x0 + i, y0, 1, h); }
  S.textPx(labLo, x0, y0 - 8, { size: 10.5, color: 'muted' }); S.textPx(labHi, x0 + w, y0 - 8, { size: 10.5, color: 'muted', align: 'right' });
}
// mean of g(θ) over a full period by the midpoint rule (never samples θ = 0)
function circleMean(g, J = 2048) { let s = 0; for (let j = 0; j < J; j++) s += g(-Math.PI + 2 * Math.PI * (j + 0.5) / J); return s / J; }
// log |b_α(z)| for the Blaschke factor b_α(z) = (|α|/α)(α − z)/(1 − ᾱz)
function logBlaschke(ar, ai, x, y) { const nr = ar - x, ni = ai - y, dr = 1 - (ar * x + ai * y), di = -(ar * y - ai * x); return 0.5 * Math.log((nr * nr + ni * ni) / (dr * dr + di * di)); }
const GOLD = Math.PI * (3 - Math.sqrt(5));

export default {
  collection: 'rca',
  chapter: 15,
  items: [
    // ------------------------------------------------------------------ Jensen's formula
    {
      num: '15.17',
      kind: 'Lemma',
      name: '$\\int_{-\\pi}^{\\pi}\\log|1-e^{i\\theta}|\\,d\\theta=0$',
      statement: String.raw`$$\frac1{2\pi}\int_{-\pi}^{\pi}\log\big|1-e^{i\theta}\big|\,d\theta=0 .$$
(The integrand has a logarithmic singularity at $\theta=0$, but it is integrable.)`,
      idea: String.raw`In the half-plane $\Omega=\{\Re z<1\}$ the function $1-z$ has no zeros, so it has a holomorphic logarithm $h$ with $h(0)=0$; then $\Re h=\log|1-z|$ and $|\Im h|<\pi/2$. Integrate $h(z)/z$ around the unit circle with a small indentation $\gamma$ around $1$ that stays inside the disc: by Cauchy's theorem the circle part (which gives $\frac1{2\pi}\int_{\delta\le|\theta|\le\pi}\log|1-e^{i\theta}|\,d\theta$ after taking real parts) equals the integral over $\gamma$, whose length is $O(\delta)$ while $|h|=O(\log\frac1\delta)$ on it. Let $\delta\to0$.`,
      caption: String.raw`Left: the harmonic function $\log|1-z|$ (blue $<0$, red $>0$), the circle $|z|=r$ (gold), and Rudin's contour — the unit circle minus the arc $|\theta|<\delta$ (blue) closed by the small arc $\gamma$ about $1$ (orange). Right: $\log|1-re^{i\theta}|$ (gold) and the boundary values $\log|1-e^{i\theta}|$ (thin curve) with their positive and negative areas. For every $r\le1$ the two areas balance exactly; the orange strip is the piece the proof cuts out, worth only $O(\delta\log\frac1\delta)$.`,
      deps: ['rca-13.11', 'rca-10.35'],
      tags: ['Jensen', 'harmonic', 'integrals'],
      viz(v) {
        const rS = v.slider('$r$', 0, 1, 0.85, { step: 0.01 });
        const dS = v.slider('$\\delta$', 0.02, 1.2, 0.35, { step: 0.01 });
        const L = v.stage({ x: [-1.3, 1.55], y: [-1.25, 1.25], equal: true, height: 320, axes: false, weight: 0.9, title: '$\\log|1-z|$ and the contour of the proof' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [-3.2, 1.1], height: 320, axes: true, xlabel: 'θ', xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: '$\\log|1-re^{i\\theta}|$ on $[-\\pi,\\pi]$' });
        const lg = (r, t) => 0.5 * Math.log(1 - 2 * r * Math.cos(t) + r * r);
        let st = null;
        v.legend([['gold', '$|z|=r$ / $\\log|1-re^{i\\theta}|$'], ['ink', 'boundary values $\\log|1-e^{i\\theta}|$'], ['green', 'area $>0$', { area: true }], ['red', 'area $<0$', { area: true }], ['orange', 'cut out: $|\\theta|<\\delta$, arc $\\gamma$', { area: true }]]);
        v.render(() => {
          const r = rS.value, d = dS.value;
          const bg = v.rgb('panel');
          L.heat((x, y) => 0.5 * Math.log((1 - x) * (1 - x) + y * y), { range: [-1.6, 1.6], cmap: 'diverging', key: 'h', res: 2, alpha: 0.85 });
          L.circle(0, 0, 1, { color: 'ink', width: 1, alpha: 0.4 });
          // contour: Γ (unit circle minus |θ| < δ) and γ (arc about 1 inside the disc)
          L.curve((t) => [Math.cos(t), Math.sin(t)], d, 2 * Math.PI - d, { color: 'blue', width: 3 });
          const rho = 2 * Math.sin(d / 2);
          L.curve((t) => [1 + rho * Math.cos(t), rho * Math.sin(t)], Math.PI / 2 + d / 2, 1.5 * Math.PI - d / 2, { color: 'orange', width: 3 });
          if (r > 0) L.circle(0, 0, r, { color: 'gold', width: 2.2, dash: [6, 4] });
          xMark(L, 1, 0, 'ink', 5);
          L.tex('\\gamma', 1 - rho, 0, { color: 'orange', size: 15, dx: -12, dy: -12 });
          L.dot(0, 0, { color: 'ink', r: 3, label: '0', labelPos: 'sw', math: false });
          colorBar(L, v.M, 'diverging', -1.6, 1.6, '−1.6', '1.6');
          // right: areas for the boundary function, cut-out strip, the r-curve
          R.vband(-d, d, { color: 'orange', alpha: 0.16 });
          R.fn((t) => Math.max(0, lg(1, t)), { color: 'green', width: 0.1, fill: 'green', fillAlpha: 0.22, n: 800 });
          R.fn((t) => Math.min(0, lg(1, t)), { color: 'red', width: 0.1, fill: 'red', fillAlpha: 0.2, n: 1600 });
          R.fn((t) => lg(1, t), { color: 'ink', width: 2, n: 1600 });
          if (r < 1) R.fn((t) => lg(r, t), { color: 'gold', width: 2.6, n: 800 });
          // numbers
          const meanR = r < 1 ? circleMean((t) => lg(r, t), 4096) : circleMean((t) => lg(1, t), 1 << 16);
          const cut = v.M.integrate((t) => lg(1, t), d, Math.PI, 2000) / Math.PI; // (1/2π)∫_{δ≤|θ|≤π}
          st = { r, d, meanR, cut, pred: -(d / Math.PI) * (Math.log(d) - 1) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\frac1{2\\pi}\\int\\log|1-re^{i\\theta}|\\,d\\theta = ${v.sci(s.meanR, 2)}$ at $r=${v.fix(s.r, 2)}$ (mean value of a harmonic function for $r<1$). With the strip $|\\theta|<\\delta=${v.fix(s.d, 2)}$ removed: $\\frac1{2\\pi}\\int_{\\delta\\le|\\theta|\\le\\pi} = ${v.fix(s.cut, 4)}$, $\\approx -\\frac{\\delta}{\\pi}(\\log\\delta-1) = ${v.fix(s.pred, 4)}$ $\\to0$ as $\\delta\\to0$.`;
        });
      },
    },
    {
      num: '15.18',
      kind: 'Theorem',
      name: "Jensen's formula",
      statement: String.raw`Let $f\in H(D(0;R))$ with $f(0)\ne0$, let $0<r<R$, and let $\alpha_1,\dots,\alpha_N$ be the zeros of $f$ in the closed disc $\overline D(0;r)$, repeated according to multiplicity. Then
$$|f(0)|\prod_{n=1}^N\frac{r}{|\alpha_n|}=\exp\Big\{\frac1{2\pi}\int_{-\pi}^{\pi}\log\big|f(re^{i\theta})\big|\,d\theta\Big\}.$$
Equivalently, $\frac1{2\pi}\int\log|f(re^{i\theta})|\,d\theta=\log|f(0)|+\sum_{|\alpha_n|\le r}\log\frac{r}{|\alpha_n|}$.`,
      idea: String.raw`Divide out the zeros without changing $|f|$ on the circle: for zeros inside, multiply by the disc automorphisms $\frac{r^2-\bar\alpha_nz}{r(\alpha_n-z)}$, which have modulus $1$ on $|z|=r$; for zeros on the circle divide by $\alpha_n-z$. The result $g$ has no zeros in a slightly larger disc, so $\log|g|$ is harmonic and equals its mean over the circle. Comparing $|g(0)|=|f(0)|\prod r/|\alpha_n|$ with the mean of $\log|g|$ — which differs from that of $\log|f|$ only by integrals $\int\log|1-e^{i(\theta-\theta_n)}|\,d\theta=0$ (Lemma 15.17) — gives the formula. A consequence (15.20): for entire $f$, $n(r)\log2\le\log\frac{M(2r)}{|f(0)|}$, so the growth of $f$ bounds the number of zeros.`,
      caption: String.raw`Drag the four zeros of $f(z)=e^{cz}\prod_{k=1}^4(z-\alpha_k)$ and the radius $r$. Right: the circle mean $\frac1{2\pi}\int\log|f(re^{i\theta})|\,d\theta$, computed numerically for every $r$ (blue), lies exactly on Jensen's right-hand side $\log|f(0)|+\sum_{|\alpha_k|\le r}\log\frac r{|\alpha_k|}$ (green dashed): flat until $r$ reaches the first zero, then bending up by $\log r$ for each zero passed. Switching on the zero-free factor $e^{2z}$ repaints the phase portrait but leaves both curves untouched.`,
      deps: ['rca-15.17', 'rca-11.12', 'rca-13.11'],
      see: ['rca-15.19', 'rca-15.23'],
      tags: ['Jensen', 'zeros', 'harmonic'],
      viz(v) {
        const { Cx } = v.M;
        const one = new Cx(1, 0);
        const L = v.stage({ x: [-2.3, 2.3], y: [-1.75, 1.75], equal: true, height: 340, title: 'phase of $f$, its zeros and the circle $|z|=r$' });
        const R = v.stage({ x: [0, 2.3], y: [-2, 2], height: 340, axes: 'box', xlabel: 'r', title: 'circle mean of $\\log|f|$ vs Jensen' });
        const init = [[0.55, 0.32], [-0.85, 0.62], [-0.35, -1.18], [1.5, -0.75]];
        const Z = init.map(([x, y], i) => L.handle(x, y, { color: 'ink', r: 6, label: `α${'₁₂₃₄'[i]}`, labelPos: 'ne', constrain: (x2, y2) => { const m = Math.hypot(x2, y2); return m < 0.15 ? [x2 * 0.15 / (m || 1), y2 * 0.15 / (m || 1)] : [x2, y2]; } }));
        const rS = v.slider('$r$', 0.05, 2.2, 1.15, { step: 0.01 });
        const ex = v.toggle('multiply by the zero-free factor $e^{2z}$', false);
        let st = null;
        v.render(() => {
          const c = ex.value ? 2 : 0, r = rS.value;
          const A = Z.map((h) => new Cx(h.x, h.y));
          const logabs = (x, y) => { let s = c * x; for (const a of A) s += 0.5 * Math.log((x - a.re) ** 2 + (y - a.im) ** 2); return s; };
          L.domain((z) => A.reduce((p, a) => p.mul(z.sub(a)), one).mul(z.scale(c).exp()), { key: `${A.map((a) => a.re + ',' + a.im).join('|')},${c}`, res: 2 });
          L.circle(0, 0, r, { color: 'panel', width: 5 }); L.circle(0, 0, r, { color: 'ink', width: 2.2 });
          L.dot(0, 0, { color: 'ink', r: 3, label: '0', labelPos: 'sw', math: false });
          Z.forEach((h) => { h.color = Math.hypot(h.x, h.y) <= r ? 'green' : 'ink'; });
          // curves
          const lf0 = logabs(0, 0);
          const jensen = (rr) => lf0 + A.reduce((s, a) => s + (a.abs() <= rr ? Math.log(rr / a.abs()) : 0), 0);
          const num = [], jen = [];
          for (let i = 1; i <= 160; i++) { const rr = 2.3 * i / 160; num.push([rr, circleMean((t) => logabs(rr * Math.cos(t), rr * Math.sin(t)), 720)]); jen.push([rr, jensen(rr)]); }
          const ys = num.concat(jen).map((p) => p[1]);
          R.setView(null, [Math.min(...ys) - 0.3, Math.max(...ys) + 0.3]);
          for (const a of A) { const m = a.abs(); R.vline(m, { color: 'faint', width: 1, dash: [3, 4] }); }
          A.forEach((a, i) => R.text(`|α${'₁₂₃₄'[i]}|`, a.abs(), R.bounds.y[1], { color: 'muted', size: 11, align: 'center', baseline: 'top', dy: 4 }));
          R.path(num, { color: 'blue', width: 7, alpha: 0.4 });
          R.path(jen, { color: 'green', width: 2, dash: [6, 4] });
          R.vline(r, { color: 'gold', width: 1.3, dash: [4, 4] });
          const mr = circleMean((t) => logabs(r * Math.cos(t), r * Math.sin(t)), 4096);
          R.dot(r, mr, { color: 'blue', r: 5 });
          R.hline(lf0, { color: 'orange', width: 1, dash: [2, 4] });
          R.text('log|f(0)|', 0.04, lf0, { color: 'orange', size: 11, dy: 9 });
          // 15.20: n(r) log 2 ≤ log(M(2r)/|f(0)|)
          let M2 = -Infinity; for (let j = 0; j < 720; j++) { const t = 2 * Math.PI * j / 720; M2 = Math.max(M2, logabs(2 * r * Math.cos(t), 2 * r * Math.sin(t))); }
          const n = A.filter((a) => a.abs() <= r).length;
          st = { r, mr, jr: jensen(r), lf0, n, M2: M2 - lf0 };
          v.legend([['blue', 'numerical $\\frac1{2\\pi}\\int\\log|f(re^{i\\theta})|\\,d\\theta$'], ['green', '$\\log|f(0)|+\\sum_{|\\alpha_k|\\le r}\\log\\frac{r}{|\\alpha_k|}$', { dash: true }], ['green', 'zeros inside $|z|\\le r$', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `At $r=${v.fix(s.r, 2)}$: circle mean $= ${v.fix(s.mr, 5)}$, Jensen's right side $= ${v.fix(s.jr, 5)}$ (${s.n} zero${s.n === 1 ? '' : 's'} inside). The remark 15.20: $n(r)\\log2 = ${v.fix(s.n * Math.LN2, 3)} \\le \\log\\frac{M(2r)}{|f(0)|} = ${v.fix(s.M2, 3)}$.`;
        });
      },
    },
    {
      num: '15.19',
      kind: 'Theorem',
      name: 'Circle means of $\\log|f|$ for $f\\in H^\\infty$',
      verify: true,
      statement: String.raw`Let $f\in H^\infty$, $f\not\equiv0$, with radial limits $f^*$ (11.32), and put
$$\mu_r(f)=\frac1{2\pi}\int_{-\pi}^{\pi}\log|f(re^{i\theta})|\,d\theta\ (0<r<1),\qquad \mu^*(f)=\frac1{2\pi}\int_{-\pi}^{\pi}\log|f^*(e^{i\theta})|\,d\theta .$$
Then $\mu_r(f)\le\mu_s(f)$ for $0<r<s<1$, $\ \mu_r(f)\to\log|f(0)|$ as $r\to0$, and $\mu_r(f)\le\mu^*(f)$. In particular $\log|f^*|\in L^1(T)$ and $f^*\ne0$ a.e. on $T$.`,
      idea: String.raw`Write $f=z^mg$ with $g(0)\ne0$. By Jensen's formula $\mu_r(g)=\log|g(0)|+\sum_{|\alpha_n|\le r}\log\frac r{|\alpha_n|}$, visibly nondecreasing in $r$, and $\mu_r(f)=\mu_r(g)+m\log r$. Normalising $|f|\le1$ makes $\log(1/|f_r|)\ge0$, where $f_r(e^{i\theta})=f(re^{i\theta})$; Fatou's lemma (1.28) as $r\to0$ and as $r\to1$ (where $f_r\to f^*$ a.e.) gives the limit and the inequality. Choosing $r$ with no zeros on $|z|=r$ makes $\mu_r(f)$ finite, so $\mu^*(f)>-\infty$.`,
      caption: String.raw`Left: $\log|f|$ on the disc (dark $=$ small) with the circle $|z|=r$. Right: $\mu_r(f)$ computed numerically against $r$, starting at $\log|f(0)|$ (orange) and never exceeding $\mu^*(f)$ (green, computed from the boundary values). A Blaschke product climbs to $\mu^*=0$; the outer function $\frac{1+z}{2}$ has $\mu_r\equiv\mu^*=-\log2$; the singular inner function $\exp(-\frac{1+z}{1-z})$ has $|f^*|=1$ a.e., so $\mu^*=0$, yet $\mu_r\equiv-1$: the inequality can be strict. Drag the zeros in the Blaschke cases.`,
      deps: ['rca-15.18', 'rca-11.32', 'rca-1.28'],
      see: ['rca-15.24'],
      tags: ['Jensen', 'H-infinity', 'boundary values'],
      viz(v) {
        const MODES = {
          B: { label: 'Blaschke $B$', b: true, s: false, o: false },
          O: { label: 'outer $\\frac{1+z}{2}$', b: false, s: false, o: true },
          S: { label: 'singular $e^{-\\frac{1+z}{1-z}}$', b: false, s: true, o: false },
          BSO: { label: 'product of all three', b: true, s: true, o: true },
        };
        const which = v.select('$f$', Object.entries(MODES).map(([value, o]) => ({ value, label: o.label })), 'BSO');
        const rS = v.slider('$r$', 0.02, 0.99, 0.85, { step: 0.01 });
        const L = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 330, axes: false, weight: 0.85, title: '$\\log|f|$ in the disc' });
        const R = v.stage({ x: [0, 1], y: [-3, 0.3], height: 330, axes: 'box', xlabel: 'r', title: '$\\mu_r(f)$, with $\\log|f(0)|$ and $\\mu^*(f)$' });
        const Z = [[0.45, 0.4], [-0.3, -0.65]].map(([x, y], i) => L.handle(x, y, { color: 'ink', r: 6, label: `α${'₁₂'[i]}`, labelPos: 'ne', constrain: (x2, y2) => { const m = Math.hypot(x2, y2), c = v.M.clamp(m, 0.12, 0.92); return [x2 * c / (m || 1), y2 * c / (m || 1)]; } }));
        let st = null;
        v.render(() => {
          const M = MODES[which.value], r = rS.value;
          Z.forEach((h) => { h.visible = M.b; });
          const A = Z.map((h) => [h.x, h.y]);
          const lf = (x, y) => {
            let s = 0;
            if (M.b) for (const [a, b] of A) s += logBlaschke(a, b, x, y);
            if (M.s) { const q = (1 - x) * (1 - x) + y * y; s -= (1 - x * x - y * y) / q; }
            if (M.o) s += 0.5 * Math.log((1 + x) * (1 + x) + y * y) - Math.LN2;
            return s;
          };
          const lfStar = (t) => (M.o ? Math.log(Math.abs(Math.cos(t / 2))) : 0); // |B*| = |S*| = 1 for θ ≠ 0
          L.heat((x, y) => (x * x + y * y < 1 ? lf(x, y) : NaN), { range: [-3, 0], cmap: 'viridis', key: `${which.value},${A.join('|')}`, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          L.circle(0, 0, r, { color: 'panel', width: 4.5 }); L.circle(0, 0, r, { color: 'gold', width: 2.2 });
          if (M.s || M.o) xMark(L, M.s ? 1 : -1, 0, 'red', 5);
          if (M.s && M.o) xMark(L, -1, 0, 'red', 5);
          colorBar(L, v.M, 'viridis', -3, 0, 'log|f| = −3', '0');
          // μ_r curve
          const pts = [];
          for (let i = 1; i <= 99; i++) { const rr = i / 100; pts.push([rr, circleMean((t) => lf(rr * Math.cos(t), rr * Math.sin(t)), 4096)]); }
          const muStar = circleMean(lfStar, 1 << 14), l0 = lf(0, 0), mr = circleMean((t) => lf(r * Math.cos(t), r * Math.sin(t)), 4096);
          const ys = pts.map((p) => p[1]).concat([muStar, l0]);
          R.setView(null, [Math.min(...ys) - 0.25, Math.max(...ys) + 0.3]);
          R.hline(muStar, { color: 'green', width: 2, dash: [6, 4] });
          R.hline(l0, { color: 'orange', width: 1.4, dash: [3, 4] });
          if (M.b) for (const [a, b] of A) R.vline(Math.hypot(a, b), { color: 'faint', width: 1, dash: [3, 4] });
          R.path(pts, { color: 'blue', width: 3 });
          R.vline(r, { color: 'gold', width: 1.2, dash: [4, 4] });
          R.dot(r, mr, { color: 'blue', r: 5 });
          R.text('μ*(f)', 0.98, muStar, { color: 'green', size: 12, align: 'right', dy: -10, math: true });
          R.text('log |f(0)|', 0.98, l0, { color: 'orange', size: 12, align: 'right', dy: l0 > muStar - 0.15 && l0 < muStar + 0.15 ? 12 : -10, math: true });
          st = { r, mr, muStar, l0, M: which.value };
          v.legend([['blue', '$\\mu_r(f)$ (numerical)'], ['orange', '$\\log|f(0)|$', { dash: true }], ['green', '$\\mu^*(f)$ from boundary values', { dash: true }], ['red', 'singular boundary point', { dot: true }]]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const gap = s.muStar - s.mr;
          return `$\\log|f(0)| = ${v.fix(s.l0, 4)} \\le \\mu_{${v.fix(s.r, 2)}}(f) = ${v.fix(s.mr, 4)} \\le \\mu^*(f) = ${v.fix(s.muStar, 4)}$ (gap $${v.fix(gap, 4)}$${s.M === 'S' || s.M === 'BSO' ? '; the singular factor keeps a gap of at least $1$ for every $r$' : ''}).`;
        });
      },
    },
    // ------------------------------------------------------------------ Blaschke products
    {
      num: '15.21',
      kind: 'Theorem',
      name: 'Blaschke products',
      statement: String.raw`Let $\{\alpha_n\}$ be a sequence in $U$ with $\alpha_n\ne0$ and
$$\sum_{n=1}^\infty(1-|\alpha_n|)<\infty,$$
let $k\ge0$ be an integer, and put
$$B(z)=z^k\prod_{n=1}^\infty\frac{\alpha_n-z}{1-\bar\alpha_nz}\,\frac{|\alpha_n|}{\alpha_n}\qquad(z\in U).$$
Then $B\in H^\infty$ (indeed $|B|<1$ in $U$), and the zeros of $B$ are exactly the points $\alpha_n$ (with multiplicity equal to the number of repetitions), together with $0$ if $k>0$. Such a $B$ is called a **Blaschke product**.`,
      idea: String.raw`The $n$-th factor differs from $1$ by $\frac{\alpha_n+|\alpha_n|z}{(1-\bar\alpha_nz)\alpha_n}(1-|\alpha_n|)$, which for $|z|\le r<1$ is at most $\frac{1+r}{1-r}(1-|\alpha_n|)$. So the Blaschke condition is exactly what Theorem 15.6 needs: the product converges locally uniformly, $B\in H(U)$, and multiplicities add. Each factor is a disc automorphism (rotated so that it is positive at $0$), so $|B|<1$.`,
      caption: String.raw`Zeros $\alpha_n=(1-\frac{1}{2n^s})e^{in\phi}$ spiral out to the circle; $\sum(1-|\alpha_n|)<\infty$ exactly when $s>1$. Left: phase portrait of the partial product $B_N$ in $U$. Right, against $\log_{10}N$: $\log_{10}|B_N(0)|=\sum_{n\le N}\log_{10}|\alpha_n|$ (blue) and $\log_{10}|B_N(z_0)|$ at the draggable point $z_0$ (gold). For $s>1$ both settle at a nonzero limit; for $s\le1$ they sink without bound — the partial products tend to $0$ locally uniformly (compare 15.23).`,
      deps: ['rca-15.6', 'rca-15.5', 'rca-12.4'],
      see: ['rca-15.23', 'rca-15.24', 'rca-17.10'],
      tags: ['Blaschke products', 'H-infinity', 'zeros'],
      viz(v) {
        const sS = v.slider('exponent $s$', 0.6, 2.5, 1.4, { step: 0.01 });
        const Ns = v.slider('factors $N$', 1, 200, 60, { int: true });
        const L = v.stage({ x: [-1.06, 1.06], y: [-1.06, 1.06], equal: true, height: 340, axes: false, weight: 0.95, title: 'phase of $B_N$ in $U$' });
        const R = v.stage({ x: [-0.05, 4.05], y: [-3, 0.2], height: 340, axes: 'box', xlabel: 'N', xticks: [[0, '1'], [1, '10'], [2, '10²'], [3, '10³'], [4, '10⁴']], title: '$\\log_{10}|B_N(0)|$ and $\\log_{10}|B_N(z_0)|$' });
        const z0 = L.handle(0.32, -0.22, { color: 'gold', label: 'z₀', labelPos: 'ne', math: false, constrain: (x, y) => { const m = Math.hypot(x, y); return m > 0.9 ? [x * 0.9 / m, y * 0.9 / m] : [x, y]; } });
        const alpha = (s, n) => { const r = 1 - 0.5 * Math.pow(n, -s); return [r * Math.cos(n * GOLD), r * Math.sin(n * GOLD)]; };
        let st = null;
        v.render(() => {
          const s = sS.value, N = Ns.value;
          const A = Array.from({ length: N }, (_, i) => alpha(s, i + 1));
          L.raster((x, y) => {
            if (x * x + y * y >= 1) return null;
            let pr = 1, pi = 0;
            for (const [a, b] of A) {
              const m = Math.hypot(a, b), ur = a / m, ui = -b / m; // |α|/α = conj(α)/|α|
              const nr = a - x, ni = b - y, dr = 1 - (a * x + b * y), di = -(a * y - b * x), q = dr * dr + di * di;
              const fr = (nr * dr + ni * di) / q, fi = (ni * dr - nr * di) / q;
              const gr = fr * ur - fi * ui, gi = fr * ui + fi * ur;
              const t = pr * gr - pi * gi; pi = pr * gi + pi * gr; pr = t;
            }
            return phaseRGB(v.M, pr, pi);
          }, { key: `${s},${N}`, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.8 });
          L.dots(A.filter(([a, b]) => a * a + b * b < 0.985), { color: 'ink', r: 2.2 });
          L.dot(0, 0, { color: 'blue', r: 4 });
          // right: log10 |B_N(0)| and |B_N(z0)| for N up to 10^4
          const NS = 10000, marks = new Set(); for (let j = 0; j <= 300; j++) marks.add(Math.round(Math.pow(10, 4 * j / 300)));
          let l0 = 0, lz = 0, sum = 0; const p0 = [], pz = []; let atN0 = 0, atNz = 0;
          for (let n = 1; n <= NS; n++) {
            const [a, b] = alpha(s, n); const m = Math.hypot(a, b);
            l0 += Math.log10(m); lz += logBlaschke(a, b, z0.x, z0.y) / Math.LN10; sum += 1 - m;
            if (n === N) { atN0 = l0; atNz = lz; }
            if (marks.has(n)) { p0.push([Math.log10(n), l0]); pz.push([Math.log10(n), lz]); }
          }
          const lo = Math.min(l0, lz, -1);
          R.setView(null, [lo * 1.08 - 0.1, 0.15]);
          R.hline(0, { color: 'faint', width: 1 });
          R.path(p0, { color: 'blue', width: 2.8 });
          R.path(pz, { color: 'gold', width: 2.4 });
          R.vline(Math.log10(N), { color: 'gold', width: 1.2, dash: [4, 4] });
          R.dot(Math.log10(N), atN0, { color: 'blue', r: 4.5 }); R.dot(Math.log10(N), atNz, { color: 'gold', r: 4.5 });
          R.corner(s > 1 ? 'Σ(1 − |αₙ|) < ∞: B_N → B, B(0) ≠ 0' : 'Σ(1 − |αₙ|) = ∞: B_N → 0', 'bl', { color: s > 1 ? 'green' : 'red', weight: 600 });
          const rz = Math.hypot(z0.x, z0.y);
          st = { s, N, sum, b0: Math.pow(10, atN0), bz: Math.pow(10, atNz), b0end: Math.pow(10, l0), rz, bound: (1 + rz) / (1 - rz) * sum };
          v.legend([['ink', 'zeros $\\alpha_n$', { dot: true }], ['blue', '$\\log_{10}|B_N(0)|=\\sum_{n\\le N}\\log_{10}|\\alpha_n|$'], ['gold', '$\\log_{10}|B_N(z_0)|$']]);
        });
        v.readout(() => {
          const q = st; if (!q) return '';
          return `$s=${v.fix(q.s, 2)}$: $\\sum_{n\\le10^4}(1-|\\alpha_n|) = ${v.fix(q.sum, 3)}$; $\\;|B_{${q.N}}(0)| = ${v.sci(q.b0, 3)}$, $|B_{10^4}(0)| = ${v.sci(q.b0end, 3)}$; $\\;|B_{${q.N}}(z_0)| = ${v.sci(q.bz, 3)}$. On $|z|\\le|z_0|$: $\\sum_n|1-b_n(z)|\\le\\frac{1+r}{1-r}\\sum(1-|\\alpha_n|) = ${v.fmt(q.bound, 3)}$.`;
        });
      },
    },
    {
      num: '15.22',
      kind: 'Definition',
      name: 'The Nevanlinna class $N$',
      verify: true,
      statement: String.raw`For real $t$ put $\log^+t=\max(\log t,0)$ (with $\log^+0=0$). The **Nevanlinna class** $N$ consists of all $f\in H(U)$ for which
$$\sup_{0<r<1}\frac1{2\pi}\int_{-\pi}^{\pi}\log^+\big|f(re^{i\theta})\big|\,d\theta<\infty .$$
Clearly $H^\infty\subset N$ (and $H^p\subset N$ for every $p>0$).`,
      idea: String.raw`The condition limits how fast $|f|$ may grow near the boundary, in an averaged, logarithmic sense. The analogous condition with $\log$ instead of $\log^+$ restricts nothing: for $f=e^g$ the integral of $\log|f|$ over every circle equals $2\pi\,\Re g(0)$. Splitting off the positive part is what makes Jensen's formula usable in 15.23: zeros push $\int\log|f|$ up, and $\log^+$ caps it from above.`,
      caption: String.raw`Three functions in $U$. Right: the circle means of $\log^+|f|$ (orange) and of $\log|f|$ (blue) against $r$. For $\exp\frac{1+z}{1-z}$ (unbounded!) $\log^+|f|=P_r$ is the Poisson kernel, mean $1$: in $N$. For $(1-z)^{-2}$ the log singularity is integrable: in $N$. For $\exp\frac{1}{(1-z)^2}$ the mean of $\log^+$ blows up like $\frac{1}{1-r}$: not in $N$ — although the mean of $\log|f|$ is the constant $\Re g(0)=1$.`,
      deps: ['rca-11.32'],
      see: ['rca-15.23', 'rca-17.7'],
      tags: ['Nevanlinna class', 'growth', 'Hardy spaces'],
      viz(v) {
        const FN = {
          poi: { label: '$\\exp\\frac{1+z}{1-z}$', lf: (x, y) => (1 - x * x - y * y) / ((1 - x) * (1 - x) + y * y), inN: true },
          pole: { label: '$(1-z)^{-2}$', lf: (x, y) => -Math.log((1 - x) * (1 - x) + y * y), inN: true },
          ess: { label: '$\\exp\\frac{1}{(1-z)^2}$', lf: (x, y) => { const ar = 1 - x, ai = -y, q = ar * ar + ai * ai; return (ar * ar - ai * ai) / (q * q); }, inN: false },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'ess');
        const rS = v.slider('$r$', 0.05, 0.99, 0.8, { step: 0.01 });
        const L = v.stage({ x: [-1.08, 1.08], y: [-1.08, 1.08], equal: true, height: 320, axes: false, weight: 0.85, title: '$\\log|f|$ in $U$ (red $>0$, blue $<0$)' });
        const R = v.stage({ x: [0, 1], y: [-1, 12], height: 320, axes: 'box', xlabel: 'r', title: 'circle means of $\\log^+|f|$ and $\\log|f|$' });
        let st = null;
        v.legend([['orange', '$\\frac1{2\\pi}\\int\\log^+|f(re^{i\\theta})|\\,d\\theta$'], ['blue', '$\\frac1{2\\pi}\\int\\log|f(re^{i\\theta})|\\,d\\theta$']]);
        v.render(() => {
          const F = FN[which.value], r = rS.value;
          L.heat((x, y) => (x * x + y * y < 1 ? F.lf(x, y) : NaN), { range: [-4, 4], cmap: 'diverging', key: which.value, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 1.6 });
          L.circle(0, 0, r, { color: 'panel', width: 4.5 }); L.circle(0, 0, r, { color: 'gold', width: 2.2 });
          xMark(L, 1, 0, 'ink', 5);
          colorBar(L, v.M, 'diverging', -4, 4, '−4', '4');
          const mp = [], mm = [];
          for (let i = 1; i <= 99; i++) { const rr = i / 100; mp.push([rr, circleMean((t) => Math.max(0, F.lf(rr * Math.cos(t), rr * Math.sin(t))), 8192)]); mm.push([rr, circleMean((t) => F.lf(rr * Math.cos(t), rr * Math.sin(t)), 8192)]); }
          const top = Math.max(2, ...mp.map((p) => p[1])) * 1.1;
          R.setView(null, [Math.min(-0.5, ...mm.map((p) => p[1])) - 0.2, top]);
          R.path(mp, { color: 'orange', width: 3 });
          R.path(mm, { color: 'blue', width: 2.4 });
          R.vline(r, { color: 'gold', width: 1.2, dash: [4, 4] });
          const cp = circleMean((t) => Math.max(0, F.lf(r * Math.cos(t), r * Math.sin(t))), 8192), cm = circleMean((t) => F.lf(r * Math.cos(t), r * Math.sin(t)), 8192);
          R.dot(r, cp, { color: 'orange', r: 5 }); R.dot(r, cm, { color: 'blue', r: 5 });
          R.corner(F.inN ? 'bounded: f ∈ N' : 'unbounded as r → 1: f ∉ N', 'tl', { color: F.inN ? 'green' : 'red', weight: 600 });
          st = { r, cp, cm, F, top: mp[mp.length - 1][1] };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `At $r=${v.fix(s.r, 2)}$: mean of $\\log^+|f| = ${v.fix(s.cp, 3)}$, mean of $\\log|f| = ${v.fix(s.cm, 3)}$; at $r=0.99$ the first is $${v.fix(s.top, 2)}$. ${s.F.inN ? 'The supremum over $r$ is finite, so $f\\in N$.' : 'The supremum is infinite, so $f\\notin N$ — while the mean of $\\log|f|$ never moves.'}`;
        });
      },
    },
  ],
};
