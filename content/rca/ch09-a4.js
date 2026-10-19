// Rudin, Real and Complex Analysis — Chapter 9, part 4: the Banach algebra L¹ (9.19–9.21).
// Normalisation: dm = dx/√(2π). The Gaussian bumps γ_σ(x) = σ⁻¹ e^{−x²/(2σ²)} have ∫γ_σ dm = 1,
// γ_σ * γ_τ = γ_√(σ²+τ²) and γ̂_σ(t) = e^{−σ²t²/2}, so every convolution below is exact.

const S = 1 / Math.sqrt(2 * Math.PI);
const gam = (s, c = 0) => (x) => Math.exp(-((x - c) ** 2) / (2 * s * s)) / s;
// (f*h_λ)(x) = (1/π) ∫ f(x − λ tan θ) dθ
function convH(f, x, l, n = 500) { let s = 0; for (let k = 0; k < n; k++) s += f(x - l * Math.tan(-Math.PI / 2 + (Math.PI * (k + 0.5)) / n)); return s / n; }
// ∫ F dm over [a,b] by the midpoint rule
function intm(F, a, b, n) { const h = (b - a) / n; let s = 0; for (let k = 0; k < n; k++) s += F(a + (k + 0.5) * h); return s * h * S; }
const cmul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
const cabs = (p) => Math.hypot(p[0], p[1]);
const ctex = (v, z, d = 3) => `${v.fix(z[0], d)} ${z[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(z[1]), d)}\\,i`;

export default {
  collection: 'rca',
  chapter: 9,
  items: [
    {
      num: '9.18', kind: 'Definition', name: 'Banach algebras',
      statement: String.raw`A **Banach algebra** is a complex Banach space $A$ with an associative bilinear multiplication satisfying $\|xy\|\le\|x\|\|y\|$ for all $x,y\in A$. Commutativity and a multiplicative identity are additional properties, not part of this definition.`,
      idea: String.raw`The norm inequality makes multiplication continuous. Completeness then allows convergent series of powers, which is the tool behind the automatic boundedness of complex homomorphisms in 9.21. Convolution in 9.19 supplies a commutative example without a unit; matrix multiplication supplies a noncommutative example with a unit.`,
      deps: ['rca-5.1'], see: ['rca-9.19', 'rca-18.1'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Definition 9.18, p. 190'],
    },
    {
      num: '9.20', kind: 'Definition', name: 'Complex homomorphisms of a Banach algebra',
      statement: String.raw`A **complex homomorphism** of a Banach algebra $A$ is a complex-linear functional $\varphi:A\to\mathbb C$ such that $\varphi(xy)=\varphi(x)\varphi(y)$. Continuity is not assumed. The zero functional is allowed; Theorem 9.21 proves automatic boundedness.`,
      idea: String.raw`A homomorphism respects both the linear and multiplicative structures. Fourier evaluation on the convolution algebra is an example because $\widehat{f*g}(t)=\hat f(t)\hat g(t)$. Its continuity follows from the algebra and completeness, rather than being imposed in the definition.`,
      deps: ['rca-9.18'], see: ['rca-9.21', 'rca-9.23'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Section 9.20, p. 191'],
    },
    // ------------------------------------------------------------------ 9.19
    {
      num: '9.19',
      kind: 'Definition',
      name: 'The convolution algebra L¹ has no unit',
      statement: String.raw`With convolution as multiplication and the normalization $dm=dx/\sqrt{2\pi}$, $L^1(\mathbb R)$ is a commutative Banach algebra: $\|f*g\|_1\le\|f\|_1\|g\|_1$, and convolution is bilinear and associative. This algebra has no multiplicative unit. For every real $t$, the Fourier evaluation $f\mapsto\hat f(t)$ preserves multiplication.`,
      idea: String.raw`The norm inequality is Fubini–Tonelli applied to $|f(x-y)g(y)|$ (8.14); commutativity and associativity follow from the translation invariance of $m$. $L^1$ has no unit: $f*u=f$ for all $f$ would give $\hat f\hat u=\hat f$, so $\hat u\equiv1$, contradicting $\hat u\in C_0$ (9.6). The kernels $h_\lambda$ replace the missing unit: $f*h_\lambda\to f$ in $L^1$ (9.10) while $\hat h_\lambda=H(\lambda t)\to1$ pointwise but never uniformly.`,
      caption: String.raw`The fixed $f$ changes sign. Choose $g$: Top: $f$, $g$ and the product $f*g$ (exact Gaussian formulas, or the $\theta$-average for $h_\lambda$). Bottom: $|\hat f|$, $|\hat g|$ and $|\widehat{f*g}|=|\hat f||\hat g|$. The readout checks $\norm{f*g}_1\le\norm f_1\norm g_1$ and commutativity. With $g=h_\lambda$, shrinking $\lambda$ makes $f*h_\lambda$ indistinguishable from $f$ — an approximate unit — but $\hat h_\lambda=e^{-\lambda|t|}$ still tends to $0$ at infinity, so no true unit exists.`,
      deps: ['rca-9.18', 'rca-8.14', 'rca-9.2'],
      see: ['rca-9.10'],
      tags: ['Banach algebra', 'convolution'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Example 9.19(d), pp. 190–191'],
      viz(v) {
        const f = (x) => gam(0.6, -1.2)(x) - 0.7 * gam(0.9, 1.0)(x);
        const fh = (t) => { const a = Math.exp(-0.18 * t * t), b = 0.7 * Math.exp(-0.405 * t * t); return [a * Math.cos(1.2 * t) - b * Math.cos(t), a * Math.sin(1.2 * t) + b * Math.sin(t)]; };
        const G = {
          bump: { label: 'bump $\\gamma_{0.5}(x-1)$', g: gam(0.5, 1), gh: (t) => [Math.exp(-0.125 * t * t) * Math.cos(t), -Math.exp(-0.125 * t * t) * Math.sin(t)], conv: (x) => gam(Math.sqrt(0.61), -0.2)(x) - 0.7 * gam(Math.sqrt(1.06), 2.0)(x) },
          wave: { label: 'sign-changing $\\frac12\\big(\\gamma_{0.4}(x)-\\gamma_{0.4}(x-1)\\big)$', g: (x) => 0.5 * (gam(0.4)(x) - gam(0.4, 1)(x)), gh: (t) => { const e = 0.5 * Math.exp(-0.08 * t * t); return [e * (1 - Math.cos(t)), e * Math.sin(t)]; }, conv: (x) => 0.5 * (gam(Math.sqrt(0.52), -1.2)(x) - 0.7 * gam(Math.sqrt(0.97), 1)(x) - gam(Math.sqrt(0.52), -0.2)(x) + 0.7 * gam(Math.sqrt(0.97), 2)(x)) },
          hl: { label: 'approximate unit $h_\\lambda$', g: null, gh: null, conv: null },
        };
        const which = v.select('$g$', Object.entries(G).map(([value, o]) => ({ value, label: o.label })), 'wave');
        const lam = v.slider('$\\lambda$', 0.01, 1, 0.3, { log: true, decimals: 3 });
        const X = v.stage({ x: [-5, 6], y: [-1.4, 2.15], height: 240, full: true, axes: 'box', xlabel: 'x', yticks: [-1, 1, 2] });
        const T = v.stage({ x: [-8, 8], y: [-0.05, 1.15], height: 190, full: true, xlabel: 't', title: 'moduli of the transforms: $|\\widehat{f*g}|=|\\hat f|\\,|\\hat g|$' });
        let key = '', st = null;
        v.render(() => {
          const k = which.value, l = lam.value;
          lam.el.hidden = k !== 'hl';
          const hl = (x) => Math.sqrt(2 / Math.PI) * l / (l * l + x * x);
          const g = k === 'hl' ? hl : G[k].g;
          const gh = k === 'hl' ? (t) => [Math.exp(-l * Math.abs(t)), 0] : G[k].gh;
          const conv = k === 'hl' ? (x) => convH(f, x, l, 500) : G[k].conv;
          // space
          X.fn(f, { color: 'ink', width: 2, n: 900 });
          X.fn((x) => Math.min(g(x), 2.1), { color: 'orange', width: 1.8, n: 900, fill: 'orange', fillAlpha: 0.12 });
          X.fn(conv, { color: 'blue', width: 2.6, n: 500 });
          if (k === 'hl' && hl(0) > 2.1) X.text(`h_λ(0) = ${v.fix(hl(0), 1)} (clipped)`, 0.15, 1.95, { color: 'orange', size: 11.5, align: 'left' });
          // frequency
          const tmax = Math.max(...v.M.linspace(-8, 8, 161).map((t) => Math.max(cabs(fh(t)), cabs(gh(t)))));
          T.setView(null, [-0.05 * tmax, 1.12 * tmax]);
          T.fn((t) => cabs(fh(t)), { color: 'ink', width: 1.6, dash: [5, 4] });
          T.fn((t) => cabs(gh(t)), { color: 'orange', width: 1.8 });
          T.fn((t) => cabs(fh(t)) * cabs(gh(t)), { color: 'blue', width: 2.4, fill: 'blue', fillAlpha: 0.12 });
          // norms (cached per state)
          const kk = `${k}|${l}`;
          if (kk !== key) {
            key = kk;
            const n1 = (F) => intm((x) => Math.abs(F(x)), -30, 30, 6000);
            const nf = n1(f), ng = k === 'hl' ? 1 : n1(g), nc = n1(conv);
            const gf = k === 'hl' ? null : (x) => intm((y) => g(x - y) * f(y), -12, 12, 1600); // g*f by direct quadrature
            const comm = gf ? Math.max(...v.M.linspace(-4, 5, 19).map((x) => Math.abs(gf(x) - conv(x)))) : 0;
            const err = intm((x) => Math.abs(conv(x) - f(x)), -30, 30, 3000);
            st = { nf, ng, nc, comm, err, k, l };
          }
          v.legend([['ink', '$f$'], ['orange', '$g$'], ['blue', '$f*g$']]);
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const base = `$\\|f*g\\|_1=${v.fix(s.nc, 4)}\\;\\le\\;\\|f\\|_1\\|g\\|_1=${v.fix(s.nf * s.ng, 4)}$`;
          if (s.k === 'hl') return `${base}; $\\;\\|f*h_\\lambda-f\\|_1=${v.fix(s.err, 4)}\\to0$ as $\\lambda\\to0$, yet $\\hat h_\\lambda(t)=e^{-\\lambda|t|}\\to0$ as $|t|\\to\\infty$`;
          return `${base}; $\\;\\max_x|(g*f)(x)-(f*g)(x)|=${v.sci(s.comm, 2)}$ (commutative)`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.20
    {
      num: '9.21',
      kind: 'Theorem',
      name: 'Complex homomorphisms have norm at most 1',
      statement: String.raw`If $\varphi$ is a complex homomorphism of a Banach algebra $A$, then $|\varphi(x)|\le\norm x$ for every $x\in A$. In particular $\varphi$ is automatically continuous, with $\norm\varphi\le1$.`,
      idea: String.raw`Suppose $|\varphi(x_0)|>\norm{x_0}$ and put $x=x_0/\varphi(x_0)$, so $\varphi(x)=1$ and $\norm x<1$. Since $\norm{x^n}\le\norm x^n$, the partial sums $s_n=-x-x^2-\cdots-x^n$ form a Cauchy sequence; let $y$ be its limit (completeness). From $x+s_n=xs_{n-1}$ we get $x+y=xy$, and applying $\varphi$ gives $1+\varphi(y)=\varphi(y)$ — impossible. Only the algebraic properties of $\varphi$ are used; continuity comes out as a consequence.`,
      caption: String.raw`Here $A=L^1$ and $x=r\,\gamma_{0.45}(\cdot-1.2)$ is a Gaussian bump with $\norm x_1=r$. Each functional $\varphi(f)=\int f(s)e^{(\sigma-it)s}\,dm(s)$ is multiplicative on rapidly decreasing functions; $\sigma=0$ gives the genuine homomorphisms $f\mapsto\hat f(t)$ (blue curve: all of their values at $x$, inside the disc of radius $\norm x_1$). Make $\sigma>0$: $|\varphi(x)|$ leaves the disc, and the proof's series runs. Top: the normalised powers $x'^{\,n}$ ($x'=x/\varphi(x)$) shrink in $L^1$ (blue), but weighted by $e^{\sigma s}$ they keep mass at least $1$ (red). Right: $\norm{s_N}_1$ converges while $\varphi(s_N)=-N$ diverges — so $\varphi$ cannot be a complex homomorphism of all of $L^1$.`,
      deps: ['rca-9.18', 'rca-9.20'],
      tags: ['Banach algebra', 'complex homomorphism'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Theorem 9.21 and proof, p. 191'],
      viz(v) {
        const w = 0.45, c0 = 1.2;
        const rS = v.slider('$\\|x\\|_1=r$', 0.3, 0.95, 0.7, { step: 0.01 });
        const sS = v.slider('$\\sigma$', -1, 1.2, 0.8, { step: 0.01 });
        const tS = v.slider('$t$', -4, 4, 0.6, { step: 0.01 });
        const top = v.stage({ x: [-1.5, 13.5], y: [-0.05, 1.25], height: 210, full: true, axes: 'box', xlabel: 's', title: 'the terms of $s_N$: $|x^{\\prime n}|$ (blue, $L^1$-mass $\\to0$) and the integrands $|x^{\\prime n}|\\,e^{\\sigma s}$ of $\\varphi$ (red)' });
        const C = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, height: 290, title: 'values in $\\mathbb C$' });
        const N = v.stage({ x: [0, 21], y: [-0.5, 10.5], height: 290, axes: 'box', xlabel: 'N', title: '$\\|s_N\\|_1$ and $|\\varphi(s_N)|$' });
        let st = null;
        v.render(() => {
          const r = rS.value, sg = sS.value, t = tS.value;
          // φ(x) = r e^{z c0 + z² w²/2}, z = σ − i t
          const zr = sg, zi = -t;
          const er = zr * c0 + ((zr * zr - zi * zi) * w * w) / 2, ei = zi * c0 + zr * zi * w * w;
          const phx = [r * Math.exp(er) * Math.cos(ei), r * Math.exp(er) * Math.sin(ei)];
          const m = cabs(phx), bad = m > r + 1e-12;
          // complex plane
          const R = Math.max(1.3, m * 1.25);
          C.setView([-R, R], [-R, R]);
          C.circle(0, 0, 1, { color: 'muted', width: 1, dash: [4, 4] });
          C.circle(0, 0, r, { color: 'green', width: 1.6, fill: 'green', fillAlpha: 0.12 });
          C.curve((u) => { const a = r * Math.exp(-(u * u * w * w) / 2); return [a * Math.cos(-u * c0), a * Math.sin(-u * c0)]; }, -12, 12, { color: 'blue', width: 1.8, n: 900 });
          C.dot(phx[0], phx[1], { color: bad ? 'red' : 'gold', r: 6.5, label: 'φ(x)', labelPos: 'ne' });
          C.text('‖x‖₁', r * 0.71, -r * 0.71, { color: 'green', size: 11.5, align: 'left', dx: 4, dy: 6 });
          // e_n = γ_{w√n}(· − n c0) has mass 1 and φ(e_n) = (φ(x)/r)^n. The proof's series is s_N = −Σ c_n e_n with
          // c_n = r^n (x itself, when |φ(x)| ≤ ‖x‖) or c_n = (r/φ(x))^n (the normalised x' = x/φ(x), when |φ(x)| > ‖x‖).
          const NN = 20, q1 = bad ? [r * phx[0] / (m * m), -r * phx[1] / (m * m)] : [r, 0];
          const u = [phx[0] / r, phx[1] / r]; // φ(e_1)
          const rho = cabs(q1);
          const xs = v.M.linspace(-3, 3 + NN * c0 + 6, 2400), dx = xs[1] - xs[0];
          const re = new Float64Array(xs.length), im = new Float64Array(xs.length);
          const sN = [], phN = [];
          let cn = [1, 0], un = [1, 0], ph = [0, 0];
          for (let n = 1; n <= NN; n++) {
            cn = cmul(cn, q1); un = cmul(un, u);
            const gs = gam(w * Math.sqrt(n), n * c0);
            for (let k = 0; k < xs.length; k++) { const y = gs(xs[k]); re[k] -= cn[0] * y; im[k] -= cn[1] * y; }
            let nrm = 0; for (let k = 0; k < xs.length; k++) nrm += Math.hypot(re[k], im[k]);
            sN.push([n, nrm * dx * S]);
            const pn = cmul(cn, un); ph = [ph[0] - pn[0], ph[1] - pn[1]]; phN.push([n, cabs(ph)]);
          }
          const ymax = Math.max(2, ...phN.map((p) => Math.min(p[1], 30)), ...sN.map((p) => p[1])) * 1.1;
          N.setView(null, [-0.04 * ymax, ymax]);
          N.path(sN, { color: 'green', width: 2.4 }); N.dots(sN, { color: 'green', r: 3 });
          N.path(phN, { color: bad ? 'red' : 'gold', width: 2.4 }); N.dots(phN, { color: bad ? 'red' : 'gold', r: 3 });
          // top panel: |x'^n| and the weight
          // blue: |c_n| e_n (L¹ mass |c_n| = ρ^n); red: the integrand |c_n| e_n(s) e^{σ s} of |φ|, mass |c_n| e^{n(σc0 + σ²w²/2)}
          const K = Math.exp(sg * c0 + (sg * sg * w * w) / 2);
          let hmax = 0;
          const items = [];
          for (let n = 1; n <= 9; n++) {
            const a = Math.pow(rho, n), sgm = w * Math.sqrt(n), mw = a * Math.pow(K, n);
            items.push([n, a, sgm, mw]); hmax = Math.max(hmax, a / sgm, mw / sgm);
          }
          top.setView(null, [-0.04 * Math.min(hmax, 4), Math.min(hmax, 4) * 1.12]);
          top.setTicks(null, null);
          for (const [n, a, sgm, mw] of items) {
            // the weighted bump is again a Gaussian: centre n c0 + σ n w², same width, mass mw
            top.fn((s) => mw * gam(sgm, n * c0 + sg * n * w * w)(s), { color: 'red', width: 1.4, fill: 'red', fillAlpha: 0.07, n: 500 });
            top.fn((s) => a * gam(sgm, n * c0)(s), { color: 'blue', width: 1.8, fill: 'blue', fillAlpha: 0.12, n: 500 });
          }
          top.corner(bad ? `normalised x′ = x/φ(x): ‖x′‖₁ = ${v.fix(rho, 3)} < 1` : `powers of x: ‖x‖₁ = ${v.fix(rho, 3)}`, 'tr', { color: 'blue' });
          v.legend([['green', 'disc $|\\zeta|\\le\\|x\\|_1$; $\\|s_N\\|_1$'], ['blue', '$\\hat x(t)$ for all $t$ ($\\sigma=0$)'], [bad ? 'red' : 'gold', '$\\varphi(x)$; $|\\varphi(s_N)|$'], ['muted', 'unit circle', { dash: true }]]);
          st = { r, m, rho, bad, phx, last: phN[NN - 1][1], sl: sN[NN - 1][1] };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$\\varphi(x)=${ctex(v, s.phx)}$, $\\;|\\varphi(x)|=${v.fix(s.m, 4)}$ vs $\\|x\\|_1=${v.fix(s.r, 3)}$` + (s.bad
            ? `: too big. With $x'=x/\\varphi(x)$, $\\|x'\\|_1=${v.fix(s.rho, 3)}<1$ and $\\varphi(x')=1$, so $s_N=-\\sum_{n\\le N}x'^{\\,n}$ converges in $L^1$ ($\\|s_{20}\\|_1=${v.fix(s.sl, 3)}$) while $|\\varphi(s_{20})|=${v.fix(s.last, 2)}$.`
            : ' — inside the disc; the geometric series converges on both sides.');
        });
      },
    },
    // ------------------------------------------------------------------ 9.21
    {
      num: '9.23',
      kind: 'Theorem',
      name: 'The complex homomorphisms of L¹ are f ↦ f̂(t)',
      statement: String.raw`For every complex homomorphism $\varphi$ of $L^1$ other than $\varphi=0$ there is a unique real number $t$ such that $\varphi(f)=\hat f(t)$ for all $f\in L^1$. Thus the nonzero complex homomorphisms of the convolution algebra $L^1$ correspond exactly to the points of $\R$.`,
      idea: String.raw`By 9.21, $\varphi$ is a bounded linear functional, so $\varphi(f)=\int f\beta\,dm$ for some $\beta\in L^\infty$ (6.16). Writing out $\varphi(f*g)=\varphi(f)\varphi(g)$ with Fubini gives $\int g(y)\big[\varphi(f_y)-\beta(y)\varphi(f)\big]\,dm(y)=0$ for all $g$, so $\varphi(f_y)=\beta(y)\varphi(f)$ a.e. Choosing $f$ with $\varphi(f)\ne0$ shows that $\beta$ agrees a.e. with a continuous function (9.5) satisfying $\beta(x+y)=\beta(x)\beta(y)$. A bounded continuous solution with $\beta(0)=1$ is differentiable, solves $\beta'=c\beta$, and boundedness forces $c=-it$: $\beta(x)=e^{-itx}$.`,
      caption: String.raw`Choose a weight $\beta\in L^\infty$ and drag the centres of the two test bumps $f$ and $g$ (the bump $f*g$ sits at the sum of the centres). Right: the values $\varphi(f)$, $\varphi(g)$, the product $\varphi(f)\varphi(g)$ and $\varphi(f*g)$, all computed by quadrature of $\int(\cdot)\beta\,dm$. Only for the characters $\beta(x)=e^{-itx}$ do the last two coincide for every placement; $\cos tx$ or a damped character is bounded but not multiplicative, so $f\mapsto\int f\beta\,dm$ is not a complex homomorphism.`,
      deps: ['rca-9.21', 'rca-6.16', 'rca-9.2', 'rca-9.5', 'rca-8.8'],
      see: ['fa-11.9'],
      tags: ['Banach algebra', 'characters', 'Fourier transform'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Section 9.22 and Theorem 9.23, pp. 191–193'],
      viz(v) {
        const B = {
          chr: { label: '$e^{-itx}$', b: (x, t) => [Math.cos(t * x), -Math.sin(t * x)] },
          cos: { label: '$\\cos tx$', b: (x, t) => [Math.cos(t * x), 0] },
          damp: { label: '$e^{-itx}e^{-x^2/18}$', b: (x, t) => { const e = Math.exp(-x * x / 18); return [e * Math.cos(t * x), -e * Math.sin(t * x)]; } },
        };
        const which = v.select('$\\beta$', Object.entries(B).map(([value, o]) => ({ value, label: o.label })), 'chr');
        const tS = v.slider('$t$', -3, 3, 1.1, { step: 0.01 });
        const X = v.stage({ x: [-5.5, 5.5], y: [-1.25, 1.6], height: 290, xlabel: 'x', title: 'the weight $\\beta$ and the test functions' });
        const Cp = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, height: 290, title: '$\\varphi(h)=\\int h\\,\\beta\\,dm$' });
        const hf = X.handle(-1.4, -1.1, { color: 'teal', label: 'f', labelPos: 'n', constrain: (x) => [v.M.clamp(x, -2.6, 2.6), -1.1] });
        const hg = X.handle(2.0, -1.1, { color: 'pink', label: 'g', labelPos: 'n', constrain: (x) => [v.M.clamp(x, -2.6, 2.6), -1.1] });
        const sf = 0.4, sg = 0.5, sc = Math.hypot(sf, sg);
        let st = null;
        v.render(() => {
          const t = tS.value, bet = B[which.value].b, a = hf.x, b = hg.x;
          const phi = (s, c) => { // ∫ γ_s(x − c) β(x) dm(x)
            const g = gam(s, c); let re = 0, im = 0; const n = 1200, lo = c - 7 * s, hi = c + 7 * s, h = (hi - lo) / n;
            for (let k = 0; k < n; k++) { const x = lo + (k + 0.5) * h, y = g(x), z = bet(x, t); re += y * z[0]; im += y * z[1]; }
            return [re * h * S, im * h * S];
          };
          const pf = phi(sf, a), pg = phi(sg, b), pfg = phi(sc, a + b), pp = cmul(pf, pg);
          // space panel
          X.fn((x) => bet(x, t)[0], { color: 'blue', width: 2.2, n: 900 });
          X.fn((x) => bet(x, t)[1], { color: 'orange', width: 1.8, n: 900 });
          const sc1 = 0.32;
          X.fn((x) => sc1 * gam(sf, a)(x) - 1.1, { color: 'teal', width: 1.6, fill: 'teal', fillAlpha: 0.2, base: -1.1, n: 700 });
          X.fn((x) => sc1 * gam(sg, b)(x) - 1.1, { color: 'pink', width: 1.6, fill: 'pink', fillAlpha: 0.2, base: -1.1, n: 700 });
          X.fn((x) => sc1 * gam(sc, a + b)(x) - 1.1, { color: 'purple', width: 2, dash: [5, 3], n: 700 });
          X.text('f∗g', a + b, -1.1 + sc1 / sc + 0.08, { color: 'purple', align: 'center', baseline: 'bottom', size: 12 });
          // complex panel
          Cp.circle(0, 0, 1, { color: 'muted', width: 1, dash: [4, 4] });
          Cp.line(0, 0, pf[0], pf[1], { color: 'teal', width: 1.2, alpha: 0.6 });
          Cp.line(0, 0, pg[0], pg[1], { color: 'pink', width: 1.2, alpha: 0.6 });
          Cp.dot(pf[0], pf[1], { color: 'teal', r: 5, label: 'φ(f)', labelPos: 'ne' });
          Cp.dot(pg[0], pg[1], { color: 'pink', r: 5, label: 'φ(g)', labelPos: 'ne' });
          const gap = cabs([pfg[0] - pp[0], pfg[1] - pp[1]]), ok = gap < 1e-4;
          Cp.dot(pp[0], pp[1], { color: ok ? 'green' : 'red', r: 8, hollow: true, width: 2.4, label: 'φ(f)φ(g)', labelPos: 'sw' });
          Cp.dot(pfg[0], pfg[1], { color: 'purple', r: 4.5, label: 'φ(f∗g)', labelPos: 'se' });
          Cp.corner(ok ? 'multiplicative ✓' : 'φ(f∗g) ≠ φ(f)φ(g)', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          v.legend([['blue', '$\\Re\\beta$'], ['orange', '$\\Im\\beta$'], ['teal', '$f$'], ['pink', '$g$'], ['purple', '$f*g$', { dash: true }]]);
          const exact = which.value === 'chr' ? [Math.exp(-sf * sf * t * t / 2) * Math.cos(a * t), -Math.exp(-sf * sf * t * t / 2) * Math.sin(a * t)] : null;
          st = { gap, ok, pf, exact, t };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$|\\varphi(f*g)-\\varphi(f)\\varphi(g)|=${v.sci(s.gap, 2)}$` + (s.exact ? `; here $\\varphi(f)=${ctex(v, s.pf, 4)}$ equals $\\hat f(${v.fix(s.t, 2)})=${ctex(v, s.exact, 4)}$` : ' — not a complex homomorphism of $L^1$.');
        });
      },
    },
  ],
};
