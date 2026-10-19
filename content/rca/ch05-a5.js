// Rudin, Real and Complex Analysis — Chapter 5, part 5: an abstract approach to the Poisson integral (5.23–5.25).
// Section numbers checked against the third edition, pp. 108–112.
import { polynomialMaximum } from './polynomial-maximum.shared.js';

// Poisson kernel P_r(t) and the density of the representing measure of z = re^{iθ} at e^{it}
const poissonAt = (z, t) => { const r2 = z[0] * z[0] + z[1] * z[1]; return (1 - r2) / (1 - 2 * (z[0] * Math.cos(t) + z[1] * Math.sin(t)) + r2); };

// complex helpers on [re, im] pairs
const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cabs = (a) => Math.hypot(a[0], a[1]);

export default {
  collection: 'rca',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.22
    {
      num: '5.22',
      kind: 'Theorem',
      name: 'Representing measures from the maximum modulus property',
      statement: String.raw`Let $K$ be a compact Hausdorff space, $H$ a subspace of $C(K)$ containing the constant function $1$, and $B$ a closed subset of $K$ such that
$$\norm{f}_K=\norm{f}_B\qquad(f\in H)$$
(a maximum modulus property). Then to each $z\in K$ there corresponds a **positive** regular Borel measure $\mu_z$ on $B$ such that
$$f(z)=\int_B f\,d\mu_z\qquad(f\in H).$$`,
      idea: String.raw`By hypothesis, $f\mapsto f(z)$ is a well-defined linear functional on $H$, viewed as a subspace of $C(B)$, of norm at most $1$, and its value at $1$ is $1$. Extend it by Hahn–Banach (5.16) to $\Lambda\in C(B)^*$ with $\norm\Lambda=1=\Lambda1$. Such a functional is positive: if $0\le f\le1$ and $\Lambda f=\alpha+i\beta$, test $\Lambda$ on $f-\tfrac12+ir$ ($r$ real) to get $(\alpha-\tfrac12)^2+(\beta+r)^2\le\tfrac14+r^2$ for all $r$, whence $\beta=0$ and $0\le\alpha\le1$. The Riesz representation theorem (2.14) then turns $\Lambda$ into a positive measure.`,
      caption: String.raw`A finite instance: $K$ is a quadrilateral, $H$ the complex affine functions $a+bx+cy$ (whose modulus is maximised at a vertex), and $B$ the four vertices, so $C(B)=\C^4$. Every extension of $f\mapsto f(z)$ is a weight vector $w$ with $\sum w_i=1$ and $\sum w_iv_i=z$ — a complex one-parameter family $w_0+\tau k$. Move $\operatorname{Re}\tau$, $\operatorname{Im}\tau$ and drag $z$. Right: the values $\Lambda f$ for all $0\le f\le1$ (gold), and the discs from the proof, which all pass through $0$ and $1$. Exactly when $\norm\Lambda=\sum\abs{w_i}=1$ the weights are positive and the gold set sits inside $[0,1]$.`,
      deps: ['rca-5.16', 'rca-2.14', 'rca-5.2'],
      see: ['rca-6.19'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Section 5.22, pp. 108–110'],
      tags: ['Hahn–Banach', 'representing measure', 'positivity'],
      viz(v) {
        const M = v.M;
        const V = [[-1.0, -0.68], [1.05, -0.52], [0.75, 0.75], [-0.82, 0.6]];
        const sS = v.slider('$\\operatorname{Re}\\tau$ (positive weights for $0\\ldots1$)', -0.6, 1.6, 0.35, { step: 0.01 });
        const uS = v.slider('$\\operatorname{Im}\\tau$', -0.6, 0.6, 0, { step: 0.01 });
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.25, 1.35], equal: true, height: 330, axes: false, title: '$K$, the boundary set $B$ (vertices) and the weights $w_i$' });
        const R = v.stage({ x: [-0.9, 1.9], y: [-1.15, 1.15], equal: true, height: 330, title: 'values $\\Lambda f$, $0\\le f\\le1$, and the discs of the proof' });
        const zh = L.handle(0.1, 0.04, { color: 'gold', label: 'z', constrain: (x, y) => M.closestOnConvexPoly([x, y], V) });
        // null vector k of A = [[x_i],[y_i],[1]] (3×4)
        const A = [V.map((p) => p[0]), V.map((p) => p[1]), [1, 1, 1, 1]];
        const minor = (j) => M.det(A.map((row) => row.filter((_, i) => i !== j)));
        let k = [0, 1, 2, 3].map((j) => (j % 2 ? -1 : 1) * minor(j));
        const kn = Math.hypot(...k); k = k.map((x) => x / kn);
        let st = null;
        v.render(() => {
          const z = [zh.x, zh.y];
          const w0 = M.solve([[V[0][0], V[1][0], V[2][0]], [V[0][1], V[1][1], V[2][1]], [1, 1, 1]], [z[0], z[1], 1]).concat([0]);
          let lo = -Infinity, hi = Infinity;
          for (let i = 0; i < 4; i++) { if (k[i] > 1e-12) lo = Math.max(lo, -w0[i] / k[i]); else if (k[i] < -1e-12) hi = Math.min(hi, -w0[i] / k[i]); }
          const span = Math.max(hi - lo, 0);
          const tau = [lo + sS.value * span, uS.value * span];
          const w = w0.map((x, i) => [x + tau[0] * k[i], tau[1] * k[i]]);
          const tv = w.reduce((s, c) => s + cabs(c), 0);
          const pos = w.every((c) => c[0] >= -1e-9 && Math.abs(c[1]) < 1e-9);
          // left panel
          L.poly(V, { fill: 'accent', fillAlpha: 0.1, color: 'accent', width: 2 });
          V.forEach((p, i) => {
            const c = w[i], mag = cabs(c), good = c[0] >= -1e-9 && Math.abs(c[1]) < 1e-9;
            L.line(z[0], z[1], p[0], p[1], { color: good ? 'green' : 'red', width: 0.6 + 6 * mag, alpha: 0.35 });
            L.circle(p[0], p[1], 0.06 + 0.32 * Math.sqrt(mag), { fill: good ? 'green' : 'red', fillAlpha: 0.35, color: good ? 'green' : 'red', width: 1.4 });
            const lab = Math.abs(c[1]) < 1e-9 ? v.fix(c[0], 2) : `${v.fix(c[0], 2)}${c[1] < 0 ? '−' : '+'}${v.fix(Math.abs(c[1]), 2)}i`;
            L.text(`w${'₁₂₃₄'[i]} = ${lab}`, p[0], p[1], { dx: p[0] > 0 ? 12 : -12, dy: p[1] > 0 ? -18 : 20, align: p[0] > 0 ? 'left' : 'right', color: good ? 'green' : 'red', size: 12 });
          });
          // right panel: lens of discs through 0 and 1
          for (const r of [-2.5, -1.2, -0.6, -0.25, 0.25, 0.6, 1.2, 2.5]) R.circle(0.5, -r, Math.sqrt(0.25 + r * r), { color: 'muted', width: 1, alpha: 0.5 });
          R.line(0, 0, 1, 0, { color: 'green', width: 5 });
          const sums = [];
          for (let S = 0; S < 16; S++) { let s = [0, 0]; for (let i = 0; i < 4; i++) if (S & (1 << i)) s = [s[0] + w[i][0], s[1] + w[i][1]]; sums.push(s); }
          const hull = M.hull(sums);
          if (hull.length >= 3) R.poly(hull, { fill: 'gold', fillAlpha: 0.3, color: 'gold', width: 1.6 });
          else R.path(hull, { color: 'gold', width: 3 });
          R.dots(sums, { r: 3, color: pos ? 'gold' : 'red' });
          R.dot(1, 0, { color: 'ink', r: 4, label: 'Λ1 = 1', labelPos: 'ne' });
          R.dot(0, 0, { color: 'ink', r: 3 });
          // check the representation on a sample affine function h = (0.3+0.2i) + (1−0.5i)x + (0.4+0.9i)y
          const h = (p) => [0.3 + p[0] + 0.4 * p[1], 0.2 - 0.5 * p[0] + 0.9 * p[1]];
          const hz = h(z), rep = w.reduce((acc, c, i) => { const m = cmul(c, h(V[i])); return [acc[0] + m[0], acc[1] + m[1]]; }, [0, 0]);
          st = { tv, pos, w, hz, rep };
        });
        v.legend([['green', 'positive weights; the segment $[0,1]$'], ['red', 'non-positive weights'], ['gold', '$\\{\\Lambda f: 0\\le f\\le 1\\}$', { area: true }], ['muted', 'discs $|w-\\frac12+ir|\\le\\sqrt{\\frac14+r^2}$']]);
        v.readout(() => {
          if (!st) return '';
          const cs = (c) => `${v.fix(c[0], 3)} ${c[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(c[1]), 3)}i`;
          return `$\\|\\Lambda\\| = \\sum|w_i| = ${v.fix(st.tv, 3)}$, $\\;\\Lambda 1 = \\sum w_i = 1$; for the affine $h = (0.3+0.2i)+(1-0.5i)x+(0.4+0.9i)y$: $h(z) = ${cs(st.hz)}$, $\\sum w_ih(v_i) = ${cs(st.rep)}$. ` + (st.pos
            ? 'Norm-preserving, hence positive: $\\mu_z=\\sum w_i\\delta_{v_i}$ is a representing measure, and $\\Lambda f\\in[0,1]$ whenever $0\\le f\\le1$. For four vertices it is not unique.'
            : 'This extension still reproduces $h(z)$ for affine $h$, but its norm exceeds $1$ — it is not a Hahn–Banach extension, and positivity fails.');
        });
      },
    },
    polynomialMaximum,
    // ------------------------------------------------------------------ 5.24
    {
      num: '5.24',
      kind: 'Theorem',
      name: 'Representing measures for the disc are unique',
      statement: String.raw`Let $\bar U$ be the closed unit disc and $T$ its boundary. For every $z\in U$ there is exactly one positive Borel measure $\mu_z$ on $T$ with
$$P(z)=\int_T P\,d\mu_z$$
for every polynomial $P$; its Fourier coefficients are $\hat\mu_z(-n)=z^n$ and $\hat\mu_z(n)=\bar z^{\,n}$ for $n\ge0$. The same formula holds for every uniform limit of polynomials on $\bar U$. More generally it holds simultaneously for every member of a linear subspace $A\subset C(\bar U)$ that contains all polynomials and satisfies $\|f\|_{\bar U}=\|f\|_T$ for every $f\in A$.`,
      idea: String.raw`Existence is 5.22 with $K=\bar U$, $B=T$ and $H$ the polynomials, which satisfy the maximum modulus property $\norm{P}_{\bar U}=\norm{P}_T$. Taking $P(\zeta)=\zeta^n$ gives $\int e^{int}d\mu_z=z^n$, and because $\mu_z$ is real, conjugation gives $\int e^{-int}d\mu_z=\bar z^{\,n}$. So every Fourier coefficient of $\mu_z$ is forced; since trigonometric polynomials are dense in $C(T)$ (4.25), $\mu_z$ is determined.`,
      caption: String.raw`Drag $z$ inside the disc. Left: the density of $\mu_z$ on the circle, drawn as a radial profile (scaled); it piles up near $z/|z|$ as $|z|\to1$ and is uniform at $z=0$. Right: the real parts of $\hat\mu_z(n)$, computed by quadrature from that density (bars), against the values forced by the argument (dots): $z^{|n|}$ for $n<0$ — read off from $P(\zeta)=\zeta^{|n|}$ — and $\bar z^{\,n}$ for $n>0$, forced by positivity.`,
      deps: ['rca-5.22', 'rca-5.23', 'rca-4.25'],
      see: ['rca-11.5'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Section 5.24, pp. 110–111'],
      tags: ['Poisson integral', 'representing measure', 'Fourier coefficients'],
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, height: 330, axes: false, title: 'the measure $\\mu_z$ on $T$ (density, scaled)' });
        const R = v.stage({ x: [-10.8, 10.8], y: [-1.15, 1.15], height: 330, axes: 'box', xticks: [-10, -5, 0, 5, 10], title: '$\\operatorname{Re}\\hat\\mu_z(n)$: quadrature (bars) vs. forced values (dots)' });
        const zh = L.handle(0.45, 0.3, { color: 'gold', label: 'z', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.95 ? [0.95 * x / r, 0.95 * y / r] : [x, y]; } });
        let st = null;
        v.render(() => {
          const z = [zh.x, zh.y], r = Math.hypot(z[0], z[1]);
          const dens = (t) => poissonAt(z, t);
          const pmax = (1 + r) / (1 - r), sc = 0.6 / pmax;
          L.circle(0, 0, 1, { fill: 'accent', fillAlpha: 0.06, color: 'accent', width: 2 });
          // density profile and radial hatching
          const ts = M.linspace(0, M.TAU, 361);
          L.path(ts.map((t) => { const q = 1 + sc * dens(t); return [q * Math.cos(t), q * Math.sin(t)]; }), { color: 'green', width: 2.2, fill: 'green', fillAlpha: 0.12 });
          for (let i = 0; i < 360; i += 6) { const t = ts[i], q = 1 + sc * dens(t); L.line(Math.cos(t), Math.sin(t), q * Math.cos(t), q * Math.sin(t), { color: 'green', width: 1, alpha: 0.45 }); }
          L.dot(0, 0, { color: 'muted', r: 2.5 });
          if (r > 1e-3) L.line(0, 0, z[0] / r, z[1] / r, { color: 'muted', width: 1, dash: [3, 4] });
          L.tex('T', -0.72, -0.72, { color: 'accent', size: 15 });
          // Fourier coefficients by quadrature
          const NQ = 2048, bars = [], exact = [];
          for (let n = -10; n <= 10; n++) {
            let re = 0, im = 0;
            for (let j = 0; j < NQ; j++) { const t = M.TAU * j / NQ, d = dens(t); re += d * Math.cos(n * t); im -= d * Math.sin(n * t); }
            bars.push([n, re / NQ, im / NQ]);
            // forced: μ̂(-m) = z^m, μ̂(m) = conj(z)^m  (m ≥ 0)
            let p = [1, 0]; const base = n <= 0 ? z : [z[0], -z[1]];
            for (let m = 0; m < Math.abs(n); m++) p = cmul(p, base);
            exact.push([n, p[0], p[1]]);
          }
          R.hline(0, { color: 'faint', width: 1 });
          bars.forEach(([n, re]) => R.rect(n - 0.32, 0, n + 0.32, re, { fill: n < 0 ? 'blue' : n > 0 ? 'purple' : 'ink', fillAlpha: 0.55, stroke: false }));
          R.dots(exact.map(([n, re]) => [n, re]), { r: 3.5, color: 'gold' });
          R.tex('\\text{from } P(\\zeta)=\\zeta^{|n|}', -9.6, 1.0, { color: 'blue', size: 13, align: 'left' });
          R.tex('\\text{from } \\mu_z\\ge0', 10.4, 1.0, { color: 'purple', size: 13, align: 'right' });
          const err = Math.max(...bars.map((b, i) => Math.hypot(b[1] - exact[i][1], b[2] - exact[i][2])));
          st = { r, err, mass: bars[10][1] };
        });
        v.legend([['green', 'density of $\\mu_z$', { area: true }], ['blue', '$n<0$: $\\hat\\mu_z(n)=z^{|n|}$', { area: true }], ['purple', '$n>0$: $\\hat\\mu_z(n)=\\bar z^{\\,n}$', { area: true }], ['gold', 'forced values', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$|z| = ${v.fix(st.r, 3)}$, $\\;\\mu_z(T) = \\hat\\mu_z(0) = ${v.fix(st.mass, 6)}$; largest discrepancy between quadrature and the forced coefficients ($|n|\\le10$): $${v.fmt(st.err, 2)}$. All coefficients are determined, so $\\mu_z$ is unique.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.25
    {
      num: '5.25',
      kind: 'Theorem',
      name: 'The Poisson integral formula',
      statement: String.raw`Let $A$ be a complex vector subspace of $C(\bar U)$ that contains all polynomials and satisfies $\|f\|_{\bar U}=\|f\|_T$ for every $f\in A$. For $0\le r<1$ and real $t$ let $P_r(t)=\sum_{n=-\infty}^{\infty}r^{\abs n}e^{int}=\dfrac{1-r^2}{1-2r\cos t+r^2}$. Then every $f\in A$ satisfies
$$f(re^{i\theta})=\frac1{2\pi}\int_{-\pi}^{\pi}P_r(\theta-t)\,f(e^{it})\,dt\qquad(0\le r<1).$$
Moreover $P_r>0$, $\frac1{2\pi}\int P_r=1$, and $P_r(t)\to0$ uniformly on $\delta\le\abs t\le\pi$ as $r\to1$.`,
      idea: String.raw`Section 5.22 gives one positive representing measure for evaluation at $z$ on all of $A$. The measure $\frac1{2\pi}P_r(\theta-t)\,dt$ has the Fourier coefficients $r^{\abs n}e^{-in\theta}$ forced on that measure in 5.24. Trigonometric polynomials are dense in $C(T)$, so the measures coincide and the representation holds for every $f\in A$. The displayed polynomials and exponential are examples; polynomial approximation is not an additional hypothesis on each $f$. The closed form of the kernel comes from two geometric series.`,
      caption: String.raw`Drag $z=re^{i\theta}$ in the disc (left, a phase portrait of $f$). Right: the kernel $P_r(\theta-t)$ as a function of $t$, together with the boundary values $\operatorname{Re}f(e^{it})$ and $\operatorname{Im}f(e^{it})$. Averaging the boundary values against the kernel reproduces $f(z)$ to quadrature precision. Push $z$ toward the circle: the kernel becomes a tall narrow spike of area $2\pi$ — an approximate identity — and $f(z)$ approaches the boundary value $f(e^{i\theta})$.`,
      deps: ['rca-5.24'],
      see: ['rca-11.5'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 5.25, p. 112; Section 5.24, p. 111'],
      tags: ['Poisson integral', 'approximate identity'],
      viz(v) {
        const M = v.M;
        const FN = {
          cub: { label: '$z^3-\\tfrac12 z$', f: (w) => cmul(cmul(w, w), w).map((x, i) => x - 0.5 * w[i]) },
          quad: { label: '$(z-0.4)(z+0.5i)$', f: (w) => cmul([w[0] - 0.4, w[1]], [w[0], w[1] + 0.5]) },
          exp: { label: '$e^{2z}$ (a limit of polynomials)', f: (w) => { const e = Math.exp(2 * w[0]); return [e * Math.cos(2 * w[1]), e * Math.sin(2 * w[1])]; } },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'quad');
        const L = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, height: 320, axes: false, title: 'phase portrait of $f$ on $\\bar U$' });
        const R = v.stage({ x: [-Math.PI, Math.PI], y: [-3, 12], height: 320, axes: 'box', xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: 'kernel $P_r(\\theta-t)$ and the boundary values of $f$' });
        const zh = L.handle(0.55, 0.35, { color: 'ink', label: 'z', constrain: (x, y) => { const r = Math.hypot(x, y); return r > 0.97 ? [0.97 * x / r, 0.97 * y / r] : [x, y]; } });
        let st = null;
        v.render(() => {
          const f = FN[which.value].f;
          L.raster((x, y) => {
            if (x * x + y * y > 1) return null;
            const w = f([x, y]), mod = cabs(w);
            const l = 0.42 + 0.2 * Math.pow(M.fract(Math.log2(mod + 1e-300)), 0.7);
            return M.hsl2rgb(Math.atan2(w[1], w[0]) / M.TAU, 0.62, l);
          }, { key: which.value, res: 2 });
          L.circle(0, 0, 1, { color: 'ink', width: 2 });
          const z = [zh.x, zh.y], r = Math.hypot(z[0], z[1]), th = Math.atan2(z[1], z[0]);
          L.line(0, 0, Math.cos(th), Math.sin(th), { color: 'panel', width: 3, alpha: 0.7 });
          L.line(0, 0, Math.cos(th), Math.sin(th), { color: 'ink', width: 1.2, dash: [4, 3] });
          L.dot(Math.cos(th), Math.sin(th), { color: 'ink', r: 4 });
          L.tex('e^{i\\theta}', 1.08 * Math.cos(th), 1.08 * Math.sin(th), { color: 'ink', align: Math.cos(th) >= 0 ? 'left' : 'right', size: 14 });
          // Poisson integral by the trapezoid rule (spectrally accurate for periodic integrands)
          const NQ = 4096; let I = [0, 0], area = 0;
          for (let j = 0; j < NQ; j++) {
            const t = -Math.PI + M.TAU * j / NQ, k = poissonAt(z, t), w = f([Math.cos(t), Math.sin(t)]);
            I = [I[0] + k * w[0], I[1] + k * w[1]]; area += k;
          }
          I = [I[0] / NQ, I[1] / NQ]; area /= NQ;
          const fz = f(z);
          // right panel
          const kmax = (1 + r) / (1 - r);
          const bmax = Math.max(...M.linspace(-Math.PI, Math.PI, 200).map((t) => cabs(f([Math.cos(t), Math.sin(t)]))));
          R.setView(null, [-Math.max(1.2, bmax * 1.15), Math.max(kmax * 1.08, bmax * 1.15, 2)]);
          R.fn((t) => poissonAt(z, t), { color: 'green', width: 2.2, fill: 'green', fillAlpha: 0.14, n: 1200 });
          R.fn((t) => f([Math.cos(t), Math.sin(t)])[0], { color: 'blue', width: 1.8 });
          R.fn((t) => f([Math.cos(t), Math.sin(t)])[1], { color: 'purple', width: 1.8, dash: [6, 4] });
          R.vline(th, { color: 'muted', width: 1, dash: [3, 4] });
          R.text('t = θ', th, R.bounds.y[1], { dx: 5, dy: 12, color: 'muted', size: 12 });
          st = { r, th, I, fz, area, err: Math.hypot(I[0] - fz[0], I[1] - fz[1]) };
        });
        v.legend([['green', '$P_r(\\theta-t)$', { area: true }], ['blue', '$\\operatorname{Re}f(e^{it})$'], ['purple', '$\\operatorname{Im}f(e^{it})$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const cs = (c) => `${v.fix(c[0], 5)} ${c[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(c[1]), 5)}i`;
          return `$r = ${v.fix(st.r, 3)}$: $\\;\\frac1{2\\pi}\\int P_r = ${v.fix(st.area, 6)}$, $\\;\\frac1{2\\pi}\\int P_r(\\theta-t)f(e^{it})\\,dt = ${cs(st.I)}$, $\\;f(z) = ${cs(st.fz)}$ (difference $${v.fmt(st.err, 2)}$).`;
        });
      },
    },
  ],
};
