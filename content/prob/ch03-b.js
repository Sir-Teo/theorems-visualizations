// Probability: Theory and Examples (Durrett) — Chapter 3, part B: §3.3 Characteristic functions
import { clampN, cornerIn, PHI, PhiN, logInts, fr, sciT, walkLaw, discCdf, cadd, csub, cmul, cscale, cabs, cexpi, cfmt, LAWS, lawOpts, empPhi, unitCircle, stems, ringPx, polyaPdf, samplePolya, t3Pdf, t3Phi, SQ3, sampleCauchy, Si } from './ch03.shared.js';

// ---------- helpers local to §3.3 ----------
/** Points of the curve t ↦ φ(t) on [t0, t1] as [x, y] pairs. */
const curvePts = (phi, t0, t1, n = 600) => Array.from({ length: n + 1 }, (_, i) => phi(t0 + ((t1 - t0) * i) / n));
/** Simpson integral of a real function. */
function simp(f, a, b, n = 400) { if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h); return (s * h) / 3; }
/** Real symmetric stable law with exponent α: φ(t) = exp(−|t|^α). */
const stablePhi = (al) => (t) => [Math.exp(-(Math.abs(t) ** al)), 0];
const binom = (k, j) => { let r = 1; for (let i = 1; i <= j; i++) r = (r * (k - j + i)) / i; return r; };

export default {
  collection: 'prob',
  chapter: 3,
  items: [
    // ======================================================================== §3.3.1 Definition, inversion formula
    {
      num: '3.3.1a',
      kind: 'Definition',
      name: 'Characteristic function',
      verify: true,
      statement: String.raw`The **characteristic function** of a random variable $X$ is
$$\varphi(t)=Ee^{itX}=E\cos tX+i\,E\sin tX,\qquad t\in\R,$$
where the expectation of a complex variable is taken separately on its real and imaginary parts. It depends only on the distribution of $X$. Durrett's examples (3.3.3–3.3.10):

- coin flips $\pm1$: $\cos t$; Poisson$(\lambda)$: $\exp(\lambda(e^{it}-1))$; standard normal: $e^{-t^2/2}$;
- uniform on $(a,b)$: $(e^{itb}-e^{ita})/it(b-a)$; triangular density $1-|x|$ on $(-1,1)$: $2(1-\cos t)/t^2$;
- exponential $e^{-x}$ on $(0,\infty)$: $1/(1-it)$; two-sided exponential $\tfrac12e^{-|x|}$: $1/(1+t^2)$.`,
      idea: String.raw`For each $t$, $e^{itX}$ is a random point on the unit circle, and $\varphi(t)$ is its centre of mass. As $t$ moves, the points wind around the circle at speeds proportional to the values of $X$. The centre of mass traces a curve inside the unit disc that starts at $\varphi(0)=1$. The point of the transform is Theorem 3.3.2: independent sums become products. Inversion (Theorem 3.3.11) shows nothing about the law is lost.`,
      caption: String.raw`Left, in the complex plane: the gold dots are $e^{itX_j}$ for 300 of the seeded samples at the current $t$, and their average is the empirical $\varphi(t)$ (gold ring). The blue curve is the exact $t\mapsto\varphi(t)$ for $t\ge0$, and the dashed gold curve is the empirical average traced over the same range. Right: real (blue) and imaginary (orange) parts against $t$. Drag $t$ to watch the cloud spread around the circle. More samples bring the empirical curve onto the exact one, with an error of order $1/\sqrt n$.`,
      deps: ['prob-1.6.1a'],
      see: ['rca-9.1'],
      tags: ['characteristic functions'],
      viz(v) {
        const KEYS = ['exp', 'unif', 'pois', 'norm', 'bern'], TM = { exp: 14, unif: 30, pois: 2 * Math.PI, norm: 7, bern: 2 * Math.PI };
        const law = v.select('law', lawOpts(KEYS), 'exp');
        const tS = v.slider('$t$', 0, 14, 1.2, { step: 0.01 });
        const nS = v.slider('samples $n$', 30, 5000, 400, { log: true, int: true });
        let seed = 1; v.button('Resample', () => { seed++; });
        const C = v.stage({ x: [-1.2, 1.2], y: [-1.2, 1.2], equal: true, axes: true, xticks: [-0.5, 0.5], yticks: [-0.5, 0.5], height: 340, title: '$e^{itX_j}$ and $\\varphi(t)$ in $\\mathbb C$' });
        const R = v.stage({ x: [-14, 14], y: [-1.1, 1.1], axes: 'box', gutter: true, height: 340, weight: 1.15, xlabel: '$t$', title: '$\\mathrm{Re}\\,\\varphi$ (blue), $\\mathrm{Im}\\,\\varphi$ (orange); dashed: empirical' });
        let cache = null, st = null, last = '';
        v.render(() => {
          const L = LAWS[law.value], Tm = TM[law.value], n = nS.value;
          if (last !== law.value) { last = law.value; tS.set(Math.min(tS.value, Tm)); R.setView([-Tm, Tm], null); }
          const key = `${law.value}|${n}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 61 + 5), xs = Array.from({ length: n }, () => L.sample(r));
            cache = { key, xs, emp: curvePts((t) => empPhi(xs, t), -Tm, Tm, 500) };
          }
          const t = Math.min(tS.value, Tm);
          unitCircle(C);
          C.dots(cache.xs.slice(0, 300).map((x) => cexpi(t * x)), { r: 2.4, color: 'gold', alpha: 0.45 });
          C.path(curvePts(L.phi, 0, Tm, 900), { color: 'accent', width: 2.2 });
          C.path(cache.emp.slice(250), { color: 'gold', width: 1.4, dash: [5, 4] });
          const ex = L.phi(t), em = empPhi(cache.xs, t);
          C.line(0, 0, ex[0], ex[1], { color: 'accent', width: 1, alpha: 0.6 });
          C.dot(ex[0], ex[1], { r: 6, color: 'accent', label: '$\\varphi(t)$', labelPos: 'ne' });
          ringPx(v, C, em[0], em[1], 8, 'gold', 2.2);
          C.dot(1, 0, { r: 3.5, color: 'ink' });
          R.hline(0, { color: 'grid', width: 1 });
          R.fn((s) => L.phi(s)[0], { color: 'accent', width: 2.2, n: 800 });
          R.fn((s) => L.phi(s)[1], { color: 'orange', width: 2.2, n: 800 });
          R.path(cache.emp.map((z, i) => [-Tm + (2 * Tm * i) / 500, z[0]]), { color: 'accent', width: 1.2, dash: [5, 4], alpha: 0.8 });
          R.path(cache.emp.map((z, i) => [-Tm + (2 * Tm * i) / 500, z[1]]), { color: 'orange', width: 1.2, dash: [5, 4], alpha: 0.8 });
          R.vline(t, { color: 'gold', dash: [4, 4], width: 1.2 });
          st = { t, ex, em, n };
          v.legend([['gold', '$e^{itX_j}$', { dot: true }], ['accent', 'exact $\\varphi$'], ['gold', 'empirical average', { dash: [5, 4] }]]);
        });
        v.readout(() => st && `$t=${fr(st.t, 2)}$: exact $\\varphi(t)=${cfmt(st.ex)}$, empirical $${cfmt(st.em)}$, gap $${fr(cabs(csub(st.ex, st.em)), 4)}$ (compare $1/\\sqrt n=${fr(1 / Math.sqrt(st.n), 4)}$). $|\\varphi(t)|=${fr(cabs(st.ex), 4)}\\le1$.`);
      },
    },
    {
      num: '3.3.1',
      kind: 'Theorem',
      name: 'Basic properties of characteristic functions',
      statement: String.raw`Every characteristic function $\varphi(t)=Ee^{itX}$ satisfies:

(a) $\varphi(0)=1$;

(b) $\varphi(-t)=\overline{\varphi(t)}$;

(c) $|\varphi(t)|\le E|e^{itX}|=1$;

(d) $|\varphi(t+h)-\varphi(t)|\le E|e^{ihX}-1|$, so $\varphi$ is uniformly continuous on $\R$;

(e) $Ee^{it(aX+b)}=e^{itb}\varphi(at)$ for real $a,b$.`,
      idea: String.raw`(a) and (e) are immediate, and (b) holds because cosine is even and sine is odd. (c) is Jensen's inequality for the convex function $|z|$. For (d), write $e^{i(t+h)X}-e^{itX}=e^{itX}(e^{ihX}-1)$, so the difference is at most $E|e^{ihX}-1|$, a bound free of $t$. It tends to $0$ as $h\to0$ by bounded convergence (dominated by $2$).`,
      caption: String.raw`Left: edit a law with four atoms by dragging the stem tops (position and weight; weights are normalized). Middle: its characteristic function in $\mathbb C$, for $t\ge0$ in blue and $t\le0$ in dashed orange, which is the mirror image (b). The curve stays in the unit disc (c), and the green curve is the law of $aX+b$ from (e). Right: the modulus of continuity $\sup_t|\varphi(t+h)-\varphi(t)|$ (blue) never exceeds $E|e^{ihX}-1|$ (orange), whatever the law (d).`,
      deps: ['prob-3.3.1a', 'prob-1.6.7', 'prob-1.6.2'],
      tags: ['characteristic functions'],
      viz(v) {
        const aS = v.slider('$a$', -2, 2, 0.6, { step: 0.01 });
        const bS = v.slider('$b$', -2, 2, 0.5, { step: 0.01 });
        const hS = v.slider('$h$', 0.02, 2.5, 0.5, { step: 0.01 });
        const A = v.stage({ x: [-3.3, 3.3], y: [0, 1.08], axes: 'box', gutter: true, height: 300, xlabel: '$x$', title: 'atoms of $X$ (drag the tips)' });
        const C = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, axes: true, xticks: [-0.5, 0.5], yticks: [-0.5, 0.5], height: 300, title: '$\\varphi(t)$, $t\\in[-15,15]$' });
        const R = v.stage({ x: [0, 2.5], y: [0, 2.05], axes: 'box', gutter: true, height: 300, xlabel: '$h$', title: 'continuity modulus vs bound' });
        const init = [[-2, 0.5], [-0.4, 0.9], [1, 0.35], [2.4, 0.6]];
        const H = init.map(([x, y], i) => A.handle(x, y, { color: ['accent', 'orange', 'purple', 'teal'][i], constrain: (x, y) => [clampN(x, -3.1, 3.1), clampN(y, 0.04, 1)] }));
        const ts = Array.from({ length: 1501 }, (_, i) => -15 + (30 * i) / 1500);
        let st = null;
        v.render(() => {
          const raw = H.map((h) => h.y), tot = raw.reduce((s, w) => s + w, 0), at = H.map((h, i) => [h.x, raw[i] / tot]);
          const phi = (t) => at.reduce((z, [x, p]) => [z[0] + p * Math.cos(t * x), z[1] + p * Math.sin(t * x)], [0, 0]);
          H.forEach((h, i) => { A.line(h.x, 0, h.x, h.y, { color: 'muted', width: 1, dash: [3, 3] }); A.line(h.x, 0, h.x, at[i][1], { color: ['accent', 'orange', 'purple', 'teal'][i], width: 4 }); A.text(fr(at[i][1], 2), h.x, at[i][1], { dy: -12, align: 'center', size: 11, color: 'muted' }); });
          unitCircle(C, { disc: true });
          C.path(ts.filter((t) => t >= 0).map(phi), { color: 'accent', width: 1.6 });
          C.path(ts.filter((t) => t <= 0).map(phi), { color: 'orange', width: 1.4, dash: [5, 4] });
          const a = aS.value, b = bS.value, phiT = (t) => at.reduce((z, [x, p]) => [z[0] + p * Math.cos(t * (a * x + b)), z[1] + p * Math.sin(t * (a * x + b))], [0, 0]);
          C.path(ts.filter((t) => t >= 0).map(phiT), { color: 'green', width: 1.2, alpha: 0.7 });
          C.dot(1, 0, { r: 5, color: 'ink', label: '$\\varphi(0)=1$', labelPos: 'sw' });
          // (d): modulus of continuity over t ∈ [0, 80] versus E|e^{ihX} − 1|
          const hs = Array.from({ length: 101 }, (_, i) => 0.025 * i), grid = Array.from({ length: 2001 }, (_, i) => (80 * i) / 2000);
          const vals = grid.map(phi), om = (h) => grid.reduce((m, t, i) => Math.max(m, cabs(csub(phi(t + h), vals[i]))), 0);
          const bd = (h) => at.reduce((s, [x, p]) => s + p * 2 * Math.abs(Math.sin((h * x) / 2)), 0);
          R.path(hs.map((h) => [h, bd(h)]), { color: 'orange', width: 2.2 });
          R.path(hs.map((h) => [h, om(h)]), { color: 'accent', width: 2.2 });
          const h0 = hS.value, o0 = om(h0), b0 = bd(h0);
          R.vline(h0, { color: 'gold', dash: [4, 4], width: 1 });
          R.dot(h0, o0, { r: 5, color: 'accent' }); R.dot(h0, b0, { r: 5, color: 'orange' });
          let mx = 0, sym = 0, eErr = 0;
          for (const t of ts) { const z = phi(t), w = phi(-t); mx = Math.max(mx, cabs(z)); sym = Math.max(sym, cabs(csub(w, [z[0], -z[1]]))); eErr = Math.max(eErr, cabs(csub(phiT(t), cmul(cexpi(t * b), phi(a * t))))); }
          st = { mx, sym, eErr, h0, o0, b0 };
          v.legend([['accent', '$t\\ge0$ / modulus'], ['orange', '$t\\le0$ / $E|e^{ihX}-1|$', { dash: [5, 4] }], ['green', '$aX+b$']]);
        });
        v.readout(() => st && `(a) $\\varphi(0)=1$. (b) $\\max_t|\\varphi(-t)-\\overline{\\varphi(t)}|=${sciT(st.sym)}$. (c) $\\max_t|\\varphi(t)|=${fr(st.mx, 4)}$. (d) at $h=${fr(st.h0, 2)}$: $\\sup_t|\\varphi(t+h)-\\varphi(t)|=${fr(st.o0, 4)}\\le E|e^{ihX}-1|=${fr(st.b0, 4)}$. (e) $\\max_t|\\varphi_{aX+b}(t)-e^{itb}\\varphi(at)|=${sciT(st.eErr)}$.`);
      },
    },
    {
      num: '3.3.2',
      kind: 'Theorem',
      name: 'Characteristic functions of independent sums multiply',
      statement: String.raw`If $X_1$ and $X_2$ are independent with characteristic functions $\varphi_1$ and $\varphi_2$, then $X_1+X_2$ has characteristic function $\varphi_1(t)\varphi_2(t)$.`,
      idea: String.raw`$e^{it(X_1+X_2)}=e^{itX_1}e^{itX_2}$, and the two factors are independent (bounded) complex variables. The expectation of a product of independent variables factors (Theorem 2.1.13, applied to real and imaginary parts). Convolution of laws, an integral, becomes multiplication of transforms. This is why characteristic functions suit sums of independent variables.`,
      caption: String.raw`$X$ and $Y$ share the chosen law. With probability $\rho$ the pair is fully dependent ($Y=X$); otherwise $Y$ is an independent copy, so the marginals never change. Left, in $\mathbb C$: the product $\varphi_X\varphi_Y=\varphi^2$ (green), the exact $\varphi_{X+Y}=(1-\rho)\varphi(t)^2+\rho\varphi(2t)$ (blue) and an estimate from 4000 seeded pairs (gold dashed). Right: the gap $|\varphi_{X+Y}-\varphi_X\varphi_Y|$ along $t$. Drag $\rho$ to $0$: only sampling noise is left. Any dependence opens a gap that the samples detect.`,
      deps: ['prob-3.3.1a', 'prob-2.1.13'],
      tags: ['characteristic functions', 'independence'],
      viz(v) {
        const KEYS = ['exp', 'unif', 'bern', 'pois'], TM = { exp: 10, unif: 20, bern: Math.PI, pois: Math.PI };
        const law = v.select('law of $X$ and $Y$', lawOpts(KEYS), 'unif');
        const rS = v.slider('dependence $\\rho$', 0, 1, 0.3, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const C = v.stage({ x: [-1.15, 1.15], y: [-1.15, 1.15], equal: true, axes: true, xticks: [-0.5, 0.5], yticks: [-0.5, 0.5], height: 330, title: '$\\varphi_{X+Y}$ vs $\\varphi_X\\varphi_Y$' });
        const R = v.stage({ x: [0, 20], y: [0, 0.6], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: '$t$', title: '$|\\varphi_{X+Y}(t)-\\varphi_X(t)\\varphi_Y(t)|$' });
        const N = 4000; let cache = null, st = null;
        v.render(() => {
          const L = LAWS[law.value], Tm = TM[law.value], rho = rS.value;
          R.setView([0, Tm], null);
          const key = `${law.value}|${rho}|${seed}`;
          if (!cache || cache.key !== key) {
            const r = v.rng(seed * 89 + 3), s = new Float64Array(N);
            for (let i = 0; i < N; i++) { const x = L.sample(r), y = r() < rho ? x : L.sample(r); s[i] = x + y; }
            cache = { key, s: Array.from(s) };
          }
          const prod = (t) => cmul(L.phi(t), L.phi(t)), exact = (t) => cadd(cscale(prod(t), 1 - rho), cscale(L.phi(2 * t), rho)), emp = (t) => empPhi(cache.s, t);
          unitCircle(C);
          C.path(curvePts(prod, 0, Tm, 600), { color: 'green', width: 3, alpha: 0.75 });
          C.path(curvePts(exact, 0, Tm, 600), { color: 'accent', width: 1.8 });
          C.path(curvePts(emp, 0, Tm, 300), { color: 'gold', width: 1.4, dash: [5, 4] });
          const ts = Array.from({ length: 301 }, (_, i) => (Tm * i) / 300);
          const gE = ts.map((t) => [t, cabs(csub(exact(t), prod(t)))]), gS = ts.map((t) => [t, cabs(csub(emp(t), prod(t)))]);
          const ymax = Math.max(0.08, ...gE.map((p) => p[1]), ...gS.map((p) => p[1])) * 1.15; R.setView(null, [0, ymax]);
          R.path(gS, { color: 'gold', width: 1.4 });
          R.path(gE, { color: 'accent', width: 2.2 });
          R.hline(2 / Math.sqrt(N), { color: 'muted', dash: [3, 4], width: 1 });
          R.text('sampling noise ≈ 2/√n', Tm * 0.98, 2 / Math.sqrt(N), { align: 'right', dy: -9, size: 11, color: 'muted' });
          st = { rho, gE: Math.max(...gE.map((p) => p[1])), gS: Math.max(...gS.map((p) => p[1])) };
          v.legend([['green', '$\\varphi_X\\varphi_Y$'], ['accent', 'exact $\\varphi_{X+Y}$'], ['gold', 'from 4000 pairs', { dash: [5, 4] }]]);
        });
        v.readout(() => st && `$\\rho=${fr(st.rho, 2)}$: $\\max_t|\\varphi_{X+Y}-\\varphi_X\\varphi_Y|=${fr(st.gE, 4)}$ exactly, $${fr(st.gS, 4)}$ from samples` + (st.rho === 0 ? ': independent, so the product rule holds; what is left is sampling noise.' : ': dependent, and the product rule fails.'));
      },
    },
    {
      num: '3.3.9',
      kind: 'Lemma',
      name: 'Mixtures have mixed characteristic functions',
      statement: String.raw`If $F_1,\dots,F_n$ have characteristic functions $\varphi_1,\dots,\varphi_n$ and $\lambda_i\ge0$ with $\lambda_1+\dots+\lambda_n=1$, then the mixture $\sum_i\lambda_iF_i$ has characteristic function $\sum_i\lambda_i\varphi_i$.`,
      idea: String.raw`Integration is linear in the measure: $\int f\,d(\sum\lambda_i\mu_i)=\sum\lambda_i\int f\,d\mu_i$. Apply it to $f(x)=e^{itx}$. With Theorem 3.3.1(b) this gives the two-sided exponential: mix an exponential variable $X$ with $-X$, half and half, to get $\tfrac12\bigl(\tfrac1{1-it}+\tfrac1{1+it}\bigr)=\tfrac1{1+t^2}$. The same linearity, passed to limits, drives Pólya's criterion (Theorem 3.3.22).`,
      caption: String.raw`Drag the gold point in the triangle to choose the weights $\lambda_1,\lambda_2,\lambda_3$ of three laws: normal$(-2,0.5^2)$ (blue), exponential (orange) and a point mass at $1.5$ (purple). Middle: their characteristic functions in $\mathbb C$, and the mixture's (green). At the chosen $t$, the three points $\varphi_i(t)$ span a triangle, and $\varphi(t)$ sits inside it with the same barycentric weights. Right: the mixture law. The readout checks the lemma against a direct numerical integral of $e^{itx}$ over the mixture.`,
      deps: ['prob-3.3.1a'],
      tags: ['characteristic functions'],
      viz(v) {
        const tS = v.slider('$t$', 0, 8, 1.1, { step: 0.01 });
        const T = v.stage({ x: [-0.28, 1.28], y: [-0.14, 1.0], equal: true, axes: false, height: 290, title: 'weights $\\lambda_i$' });
        const C = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, axes: true, xticks: [-0.5, 0.5], yticks: [-0.5, 0.5], height: 290, title: '$\\varphi_i$ and $\\sum\\lambda_i\\varphi_i$' });
        const D = v.stage({ x: [-4, 6], y: [0, 0.9], axes: 'box', gutter: true, height: 290, xlabel: '$x$', title: 'mixture law' });
        const V = [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]], COL = ['accent', 'orange', 'purple'], NAMES = ['normal', 'exponential', 'mass at 1.5'];
        const bary = (x, y) => { const l3 = y / V[2][1], l2 = x - 0.5 * l3, l1 = 1 - l2 - l3; return [l1, l2, l3]; };
        const hW = T.handle(0.45, 0.3, { color: 'gold', constrain: (x, y) => { let [a, b, c] = bary(x, y); a = Math.max(0, a); b = Math.max(0, b); c = Math.max(0, c); const s = a + b + c; a /= s; b /= s; c /= s; return [b + 0.5 * c, c * V[2][1]]; } });
        const phis = [(t) => { const a = Math.exp(-t * t / 8); return [a * Math.cos(-2 * t), a * Math.sin(-2 * t)]; }, (t) => [1 / (1 + t * t), t / (1 + t * t)], (t) => cexpi(1.5 * t)];
        const dens = [(x) => PHI((x + 2) / 0.5) / 0.5, (x) => (x < 0 ? 0 : Math.exp(-x)), null];
        let st = null;
        v.render(() => {
          const lam = bary(hW.x, hW.y).map((l) => Math.max(0, l));
          T.poly(V, { fill: 'grid', fillAlpha: 0.25, color: 'muted', width: 1.2 });
          V.forEach((p, i) => { T.dot(p[0], p[1], { r: 7, color: COL[i] }); T.text(NAMES[i], p[0], p[1], { dy: i === 2 ? -16 : 18, align: 'center', size: 11, color: COL[i] }); });
          T.text(`λ = (${lam.map((l) => fr(l, 2)).join(', ')})`, 0.5, -0.09, { align: 'center', size: 12, color: 'ink' });
          const mix = (t) => phis.reduce((z, f, i) => cadd(z, cscale(f(t), lam[i])), [0, 0]);
          unitCircle(C);
          phis.forEach((f, i) => C.path(curvePts(f, 0, 8, 500), { color: COL[i], width: 1.2, alpha: 0.55 }));
          C.path(curvePts(mix, 0, 8, 600), { color: 'green', width: 2.4 });
          const t = tS.value, P = phis.map((f) => f(t)), m = mix(t);
          C.poly(P, { fill: 'gold', fillAlpha: 0.12, color: 'gold', width: 1.2, dash: [4, 3] });
          P.forEach((p, i) => C.dot(p[0], p[1], { r: 5, color: COL[i] }));
          C.dot(m[0], m[1], { r: 6.5, color: 'green', label: '$\\varphi(t)$', labelPos: 'ne' });
          const f = (x) => lam[0] * dens[0](x) + lam[1] * dens[1](x);
          D.fn(f, { color: 'green', width: 2.2, fill: 'green', fillAlpha: 0.15, n: 600 });
          if (lam[2] > 0) stems(D, [[1.5, lam[2]]], { scale: 0.8, color: 'purple' });
          // direct numerical check: ∫ e^{itx} dμ_mix
          const part = (g) => lam[0] * simp((x) => dens[0](x) * g(t * x), -6, 2, 4000) + lam[1] * simp((x) => dens[1](x) * g(t * x), 0, 40, 8000);
          const re = part(Math.cos) + lam[2] * Math.cos(1.5 * t), im = part(Math.sin) + lam[2] * Math.sin(1.5 * t);
          st = { t, m, d: [re, im], err: cabs(csub(m, [re, im])), lam };
          v.legend([['accent', 'normal'], ['orange', 'exponential'], ['purple', 'point mass'], ['green', 'mixture']]);
        });
        v.readout(() => st && `$t=${fr(st.t, 2)}$: $\\sum\\lambda_i\\varphi_i(t)=${cfmt(st.m, 4)}$; direct $\\int e^{itx}\\,d\\mu=${cfmt(st.d, 4)}$; difference $${sciT(st.err)}$.`);
      },
    },
    {
      num: '3.3.11',
      kind: 'Theorem',
      name: 'Lévy’s inversion formula',
      statement: String.raw`Let $\varphi(t)=\int e^{itx}\,\mu(dx)$ for a probability measure $\mu$. If $a<b$, then
$$\lim_{T\to\infty}\frac1{2\pi}\int_{-T}^{T}\frac{e^{-ita}-e^{-itb}}{it}\,\varphi(t)\,dt=\mu(a,b)+\tfrac12\mu(\{a,b\}).$$
The limit exists; the integral need not converge absolutely (for $\mu=\delta_0$, $a=-1$, $b=1$ the integrand is $2\sin t/t$).`,
      idea: String.raw`The factor $(e^{-ita}-e^{-itb})/it=\int_a^be^{-ity}\,dy$ is bounded by $b-a$, so Fubini's theorem may swap the $t$- and $x$-integrals. The inner integral is $R(x-a,T)-R(x-b,T)$, where $R(\theta,T)=\int_{-T}^T\sin(\theta t)/t\,dt=2\,\mathrm{sgn}(\theta)\,S(T|\theta|)$ and $S(y)=\int_0^y\sin u/u\,du\to\pi/2$. Divided by $2\pi$, this kernel tends to $1$ inside $(a,b)$, $\tfrac12$ at the endpoints and $0$ outside, with a uniform bound. Bounded convergence finishes. So $\varphi$ determines $\mu$.`,
      caption: String.raw`The law (left, blue) is $0.6\cdot$normal$(-0.5,1)$ plus atoms $0.25$ at $0$ and $0.15$ at $1.5$. Drag the gold handles to choose $(a,b)$; they snap to the atoms. The orange curve is the proof's kernel $\bigl(R(x-a,T)-R(x-b,T)\bigr)/2\pi$ at the current $T$: a smoothed indicator of $(a,b)$ with Gibbs ripples, passing through $\tfrac12$ at $a$ and at $b$. Right: the truncated integral as $T$ grows. It settles on $\mu(a,b)+\tfrac12\mu(\{a,b\})$ (green), between $\mu(a,b)$ and $\mu[a,b]$ (dashed), when an endpoint sits on an atom.`,
      deps: ['prob-3.3.1a', 'prob-1.7.2', 'prob-1.5.3'],
      see: ['rca-9.11'],
      tags: ['characteristic functions', 'inversion'],
      credit: 'Lévy, 1925',
      viz(v) {
        const TS = v.slider('$T$', 1, 60, 8, { log: true });
        const L = v.stage({ x: [-3.5, 3.5], y: [-0.18, 1.2], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: '$x$', title: 'law, interval and kernel' });
        const R = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', gutter: true, height: 320, xlabel: '$T$', title: '$\\frac1{2\\pi}\\int_{-T}^{T}\\cdots\\,dt$' });
        const AT = [[0, 0.25], [1.5, 0.15]], W = 0.6, MU = -0.5;
        const snap = (x) => { for (const [p] of AT) if (Math.abs(x - p) < 0.1) return p; return Math.round(x * 20) / 20; };
        const ha = L.handle(0, -0.12, { color: 'gold', label: 'a', labelPos: 'n', constrain: (x) => [snap(clampN(x, -3.3, 3.3)), -0.12] });
        const hb = L.handle(1.2, -0.12, { color: 'gold', label: 'b', labelPos: 'n', constrain: (x) => [snap(clampN(x, -3.3, 3.3)), -0.12] });
        const M = v.M;
        const phi = (t) => { const g = W * Math.exp(-t * t / 2); return AT.reduce((z, [x, p]) => cadd(z, cscale(cexpi(t * x), p)), [g * Math.cos(MU * t), g * Math.sin(MU * t)]); };
        let cache = null, st = null;
        v.render(() => {
          const a = Math.min(ha.x, hb.x), b = Math.max(ha.x, hb.x), T = TS.value;
          // cumulative integral (1/π)∫₀^T Re[(e^{−ita} − e^{−itb})/(it) φ(t)] dt on a fine grid
          const key = a + '|' + b;
          if (!cache || cache.key !== key) {
            const dt = 0.004, n = Math.ceil(60 / dt), cum = new Float64Array(n + 1);
            const g = (t) => { if (t < 1e-9) return b - a; const q = cmul(csub(cexpi(-t * a), cexpi(-t * b)), [0, -1 / t]); return cmul(q, phi(t))[0]; };
            let prev = g(0); for (let i = 1; i <= n; i++) { const cur = g(i * dt), mid = g((i - 0.5) * dt); cum[i] = cum[i - 1] + (dt / 6) * (prev + 4 * mid + cur) / Math.PI; prev = cur; }
            cache = { key, cum, dt };
          }
          const IT = (T0) => { const i = Math.min(cache.cum.length - 1, Math.round(T0 / cache.dt)); return cache.cum[i]; };
          const cont = W * (PhiN(M, b - MU) - PhiN(M, a - MU));
          const inner = AT.filter(([x]) => x > a + 1e-9 && x < b - 1e-9).reduce((s, [, p]) => s + p, 0), ends = AT.filter(([x]) => Math.abs(x - a) < 1e-9 || Math.abs(x - b) < 1e-9).reduce((s, [, p]) => s + p, 0);
          const open = cont + inner, target = open + ends / 2, closed = open + ends;
          L.vband(a, b, { color: 'gold', alpha: 0.1 });
          L.line(a, -0.12, b, -0.12, { color: 'gold', width: 5 });
          L.fn((x) => W * PHI(x - MU), { color: 'accent', width: 2, fill: 'accent', fillAlpha: 0.12 });
          stems(L, AT, { scale: 1.6, color: 'accent' });
          const K = (x) => (Math.sign(x - a) * Si(T * Math.abs(x - a)) - Math.sign(x - b) * Si(T * Math.abs(x - b))) / Math.PI;
          L.fn(K, { color: 'orange', width: 2, n: 900 });
          L.dot(a, K(a), { r: 4, color: 'orange' }); L.dot(b, K(b), { r: 4, color: 'orange' });
          L.hline(0.5, { color: 'orange', dash: [2, 4], width: 1, alpha: 0.6 });
          const pts = []; for (let t = 0.05; t <= 60; t += 0.05) pts.push([t, IT(t)]);
          const lo = Math.min(open, ...pts.map((p) => p[1])), hi = Math.max(closed, ...pts.map((p) => p[1]));
          R.setView(null, [Math.max(-0.1, lo - 0.08), Math.min(1.2, hi + 0.08)]);
          R.hline(open, { color: 'muted', dash: [5, 4], width: 1.2 }); R.hline(closed, { color: 'muted', dash: [5, 4], width: 1.2 });
          R.hline(target, { color: 'green', width: 2 });
          R.path(pts, { color: 'accent', width: 2 });
          R.vline(T, { color: 'gold', dash: [4, 4], width: 1 }); R.dot(T, IT(T), { r: 5, color: 'accent' });
          st = { a, b, T, I: IT(T), I60: IT(60), open, closed, target, ends };
          v.legend([['accent', 'law / truncated integral'], ['orange', 'kernel at $T$'], ['green', '$\\mu(a,b)+\\frac12\\mu\\{a,b\\}$'], ['muted', '$\\mu(a,b)$, $\\mu[a,b]$', { dash: [5, 4] }]]);
        });
        v.readout(() => st && `$(a,b)=(${fr(st.a, 2)},${fr(st.b, 2)})$: integral at $T=${fr(st.T, 1)}$ is $${fr(st.I, 4)}$, at $T=60$ it is $${fr(st.I60, 4)}$; $\\mu(a,b)+\\tfrac12\\mu\\{a,b\\}=${fr(st.target, 4)}$` + (st.ends > 0 ? ` (atoms at the endpoints carry $${fr(st.ends, 2)}$, of which half is counted).` : ' (no atom at the endpoints).'));
      },
    },
    {
      num: '3.3.12',
      kind: 'Corollary',
      name: 'Real characteristic function ⇔ symmetric law',
      statement: String.raw`If the characteristic function $\varphi$ of $X$ is real-valued, then $X$ and $-X$ have the same distribution. (Conversely, a symmetric law has $E\sin tX=0$, so its $\varphi$ is real.)`,
      idea: String.raw`$-X$ has characteristic function $\varphi(-t)=\overline{\varphi(t)}$ (Theorem 3.3.1(b)). If $\varphi$ is real, this equals $\varphi(t)$, so $X$ and $-X$ have the same characteristic function. The inversion formula (Theorem 3.3.11) then forces equal laws. Mean zero is not enough: a centred exponential has $EX=0$, yet $\mathrm{Im}\,\varphi\ne0$.`,
      caption: String.raw`Left: the law of $X+c$ (blue) and its mirror image, the law of $-(X+c)$ (orange dashed). Middle: $\varphi$ in $\mathbb C$ for $t\in[0,8]$. Right: $\mathrm{Im}\,\varphi(t)$. Shifting by $c$ multiplies $\varphi$ by $e^{itc}$, which rotates the curve off the real axis. At $c=0$ the symmetric laws collapse onto the real axis. The centred exponential has mean $0$ but is not symmetric, and its curve stays off the axis for every $c$.`,
      deps: ['prob-3.3.11', 'prob-3.3.1'],
      tags: ['characteristic functions', 'symmetry'],
      viz(v) {
        const LW = {
          bi: { label: 'two bumps', pdf: (x) => 0.5 * (PHI((x + 1.2) / 0.45) + PHI((x - 1.2) / 0.45)) / 0.45, atoms: [], phi: (t) => [Math.cos(1.2 * t) * Math.exp(-0.10125 * t * t), 0] },
          at: { label: 'three atoms', pdf: null, atoms: [[-1, 0.3], [0, 0.4], [1, 0.3]], phi: (t) => [0.4 + 0.6 * Math.cos(t), 0] },
          cexp: { label: 'centred exponential', pdf: (x) => (x < -1 ? 0 : Math.exp(-(x + 1))), atoms: [], phi: (t) => cmul([1 / (1 + t * t), t / (1 + t * t)], cexpi(-t)) },
        };
        const lw = v.select('law of $X$', Object.entries(LW).map(([value, o]) => ({ value, label: o.label })), 'bi');
        const cS = v.slider('shift $c$', -1.5, 1.5, 0.4, { step: 0.01 });
        const A = v.stage({ x: [-4, 4], y: [0, 1.0], axes: 'box', gutter: true, height: 290, xlabel: '$x$', title: '$X+c$ and its mirror' });
        const C = v.stage({ x: [-1.1, 1.1], y: [-1.1, 1.1], equal: true, axes: true, xticks: [-0.5, 0.5], yticks: [-0.5, 0.5], height: 290, title: '$\\varphi_{X+c}$ in $\\mathbb C$' });
        const R = v.stage({ x: [0, 8], y: [-0.8, 0.8], axes: 'box', gutter: true, height: 290, xlabel: '$t$', title: '$\\mathrm{Im}\\,\\varphi_{X+c}(t)$' });
        let st = null;
        v.render(() => {
          const L = LW[lw.value], c = cS.value, phi = (t) => cmul(L.phi(t), cexpi(t * c));
          if (L.pdf) { A.fn((x) => L.pdf(x - c), { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.12, n: 600 }); A.fn((x) => L.pdf(-x - c), { color: 'orange', width: 2, dash: [6, 4], n: 600 }); }
          else { stems(A, L.atoms.map(([x, p]) => [x + c, p]), { scale: 2, color: 'accent' }); stems(A, L.atoms.map(([x, p]) => [-(x + c), p]), { scale: 2, color: 'orange', alpha: 0.7, r: 5, width: 1.5 }); }
          A.vline(0, { color: 'muted', dash: [3, 4], width: 1 });
          unitCircle(C);
          C.path(curvePts(phi, 0, 8, 800), { color: 'accent', width: 2 });
          C.dot(1, 0, { r: 4, color: 'ink' });
          R.hline(0, { color: 'green', width: 1.6 });
          R.fn((t) => phi(t)[1], { color: 'orange', width: 2.2, n: 800 });
          let im = 0; for (let t = 0; t <= 8; t += 0.01) im = Math.max(im, Math.abs(phi(t)[1]));
          let tv = 0;
          if (L.pdf) { for (let x = -8; x < 8; x += 0.002) tv += 0.5 * Math.abs(L.pdf(x - c) - L.pdf(-x - c)) * 0.002; }
          else { const pts = new Map(); for (const [x, p] of L.atoms) { const k1 = (x + c).toFixed(6), k2 = (-(x + c)).toFixed(6); pts.set(k1, (pts.get(k1) || 0) + p); pts.set(k2, (pts.get(k2) || 0) - p); } for (const d of pts.values()) tv += 0.5 * Math.abs(d); }
          st = { c, im, tv };
          v.legend([['accent', 'law of $X+c$ / $\\varphi$'], ['orange', 'law of $-(X+c)$ / $\\mathrm{Im}\\,\\varphi$', { dash: [6, 4] }]]);
        });
        v.readout(() => st && `$c=${fr(st.c, 2)}$: $\\max_{t\\le8}|\\mathrm{Im}\\,\\varphi(t)|=${fr(st.im, 4)}$; total variation between $X+c$ and $-(X+c)$: $${fr(st.tv, 4)}$` + (st.im < 1e-9 ? ': $\\varphi$ is real and the law is symmetric.' : ': $\\varphi$ is not real, and the law is not symmetric.'));
      },
    },
    {
      num: '3.3.13',
      kind: 'Corollary',
      name: 'Independent centred normals add',
      statement: String.raw`If $X_1$ and $X_2$ are independent and normal with mean $0$ and variances $\sigma_1^2$ and $\sigma_2^2$, then $X_1+X_2$ is normal with mean $0$ and variance $\sigma_1^2+\sigma_2^2$.`,
      idea: String.raw`By scaling (Theorem 3.3.1(e)), $X_i$ has characteristic function $e^{-\sigma_i^2t^2/2}$. Independence multiplies them (Theorem 3.3.2), giving $e^{-(\sigma_1^2+\sigma_2^2)t^2/2}$, the characteristic function of normal$(0,\sigma_1^2+\sigma_2^2)$. The inversion formula (Theorem 3.3.11) identifies the law. Doing the same with densities would take a Gaussian convolution integral; here it is one line of algebra.`,
      caption: String.raw`Left: the two characteristic functions (blue, orange), their product (green) and $e^{-(\sigma_1^2+\sigma_2^2)t^2/2}$ (black dashed), which coincide. Right: the density recovered from the product by numerical inversion (green), the normal$(0,\sigma_1^2+\sigma_2^2)$ density (black dashed) and a histogram of 4000 seeded sums $X_1+X_2$. Drag $\sigma_1$, $\sigma_2$.`,
      deps: ['prob-3.3.11', 'prob-3.3.2'],
      tags: ['characteristic functions', 'normal'],
      viz(v) {
        const s1 = v.slider('$\\sigma_1$', 0.2, 2, 0.6, { step: 0.01 });
        const s2 = v.slider('$\\sigma_2$', 0.2, 2, 1.2, { step: 0.01 });
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [-6, 6], y: [-0.03, 1.06], axes: 'box', gutter: true, height: 310, xlabel: '$t$', title: 'characteristic functions' });
        const R = v.stage({ x: [-7, 7], y: [0, 0.75], axes: 'box', gutter: true, height: 310, xlabel: '$x$', title: 'law of $X_1+X_2$' });
        let st = null;
        v.render(() => {
          const a = s1.value, b = s2.value, s = Math.hypot(a, b);
          const p1 = (t) => Math.exp(-a * a * t * t / 2), p2 = (t) => Math.exp(-b * b * t * t / 2);
          L.fn(p1, { color: 'accent', width: 1.8 }); L.fn(p2, { color: 'orange', width: 1.8 });
          L.fn((t) => p1(t) * p2(t), { color: 'green', width: 4, alpha: 0.7 });
          L.fn((t) => Math.exp(-s * s * t * t / 2), { color: 'ink', width: 1.6, dash: [6, 4] });
          const tmax = Math.min(60, 9 / s), inv = (x) => simp((t) => Math.cos(t * x) * p1(t) * p2(t), 0, tmax, 600) / Math.PI;
          const r = v.rng(seed * 17 + 1), xs = Array.from({ length: 4000 }, () => a * r.normal() + b * r.normal());
          const peak = 1 / (s * Math.sqrt(2 * Math.PI)); R.setView([-Math.max(4, 4 * s), Math.max(4, 4 * s)], [0, peak * 1.3]);
          R.hist(xs, { bins: 50, range: R.xr, density: true, color: 'gold', fillAlpha: 0.35 });
          R.fn(inv, { color: 'green', width: 4, alpha: 0.75, n: 240 });
          R.fn((x) => PHI(x / s) / s, { color: 'ink', width: 1.6, dash: [6, 4] });
          let err = 0; for (let x = -4 * s; x <= 4 * s; x += s / 10) err = Math.max(err, Math.abs(inv(x) - PHI(x / s) / s));
          const m = xs.reduce((u, x) => u + x, 0) / xs.length, sv = xs.reduce((u, x) => u + (x - m) ** 2, 0) / (xs.length - 1);
          st = { a, b, s, err, sv };
          v.legend([['accent', '$\\varphi_1$'], ['orange', '$\\varphi_2$'], ['green', 'product / its inversion'], ['ink', 'normal, variance $\\sigma_1^2+\\sigma_2^2$', { dash: [6, 4] }], ['gold', '4000 sums', { area: true }]]);
        });
        v.readout(() => st && `$\\sigma_1^2+\\sigma_2^2=${fr(st.s * st.s, 3)}$; sample variance of the sums $${fr(st.sv, 3)}$. $\\max_x|\\text{inverted density}-\\text{normal density}|=${sciT(st.err)}$.`);
      },
    },
    {
      num: '3.3.14',
      kind: 'Theorem',
      name: 'Integrable characteristic function gives a density',
      statement: String.raw`If $\int|\varphi(t)|\,dt<\infty$, then $\mu$ has a bounded continuous density
$$f(y)=\frac1{2\pi}\int e^{-ity}\varphi(t)\,dt.$$`,
      idea: String.raw`With $\varphi$ integrable, the inversion integral converges absolutely and gives $\mu(a,b)+\tfrac12\mu\{a,b\}\le(b-a)\int|\varphi|/2\pi$. Letting $b\downarrow a$ shows there are no atoms. Fubini then writes $\mu(x,x+h)$ as $\int_x^{x+h}f(y)\,dy$, and dominated convergence makes $f$ continuous and bounded by $\int|\varphi|/2\pi$. Durrett uses this to read off two new pairs: the triangle $(1-|t|)^+$ is the characteristic function of Pólya's density $(1-\cos x)/\pi x^2$, and $e^{-|t|}$ that of the Cauchy density $1/\pi(1+x^2)$.`,
      caption: String.raw`Pick a characteristic function and a truncation $T$. The green curve is $f_T(y)=\frac1{2\pi}\int_{-T}^{T}e^{-ity}\varphi(t)\,dt$, over a histogram of 4000 seeded samples and the true density (black dashed). For the triangle the integral is exact once $T\ge1$, and it recovers Pólya's density. For $e^{-|t|}$ and $e^{-t^2/2}$ it converges uniformly. Two choices break the hypothesis. $\sin t/t$ (uniform law) is not integrable, and $f_T$ converges with Gibbs overshoots at the jumps of a discontinuous density. $\cos t$ (coin flips) has no density at all, and $f_T(\pm1)$ grows like $T/2\pi$.`,
      deps: ['prob-3.3.11'],
      see: ['rca-9.11'],
      tags: ['characteristic functions', 'inversion'],
      viz(v) {
        const PH = {
          tri: { label: '$(1-|t|)^+$', f: polyaPdf, samp: samplePolya, int: true },
          cau: { label: '$e^{-|t|}$', f: (x) => 1 / (Math.PI * (1 + x * x)), samp: sampleCauchy, int: true },
          nor: { label: '$e^{-t^2/2}$', f: PHI, samp: (r) => r.normal(), int: true },
          sinc: { label: '$\\sin t/t$', f: (x) => (Math.abs(x) < 1 ? 0.5 : 0), samp: (r) => 2 * r() - 1, int: false },
          cos: { label: '$\\cos t$', f: null, samp: (r) => (r() < 0.5 ? -1 : 1), int: false },
        };
        const ph = v.select('$\\varphi(t)=$', Object.entries(PH).map(([value, o]) => ({ value, label: o.label })), 'tri');
        const TS = v.slider('$T$', 0.3, 200, 3, { log: true });
        const L = v.stage({ x: [-8, 8], y: [-0.04, 0.22], axes: 'box', gutter: true, height: 320, weight: 1.3, xlabel: '$y$', title: '$f_T(y)$ against the samples' });
        const R = v.stage({ x: [-8, 8], y: [-0.4, 1.05], axes: 'box', gutter: true, height: 320, xlabel: '$t$', title: '$\\varphi$ on $[-T,T]$' });
        const phiF = { tri: (t) => Math.max(0, 1 - Math.abs(t)), cau: (t) => Math.exp(-Math.abs(t)), nor: (t) => Math.exp(-t * t / 2), sinc: (t) => (Math.abs(t) < 1e-9 ? 1 : Math.sin(t) / t), cos: Math.cos };
        // f_T(y) = (1/π)∫₀^T cos(ty) φ(t) dt, in closed form where possible
        const fT = (k, T, y) => {
          if (k === 'cos') { const g = (u) => (Math.abs(u) < 1e-9 ? T : Math.sin(T * u) / u); return (g(y - 1) + g(y + 1)) / (2 * Math.PI); }
          if (k === 'sinc') return (Si(T * (1 + y)) + Si(T * (1 - y))) / (2 * Math.PI);
          if (k === 'cau') { const d = 1 + y * y, e = Math.exp(-T); return (1 / Math.PI) * ((1 - e * Math.cos(T * y)) * 1 + e * Math.sin(T * y) * y) / d; }
          const top = k === 'tri' ? Math.min(T, 1) : Math.min(T, 9);
          return simp((t) => Math.cos(t * y) * phiF[k](t), 0, top, k === 'tri' ? 120 : 360) / Math.PI;
        };
        const cache = {};
        let st = null;
        v.render(() => {
          const k = ph.value, P = PH[k], T = TS.value;
          if (!cache[k]) { const r = v.rng(23); cache[k] = Array.from({ length: 4000 }, () => P.samp(r)); }
          L.setView(null, { tri: [-0.04, 0.22], cau: [-0.05, 0.42], nor: [-0.05, 0.5], sinc: [-0.1, 0.66], cos: [-0.15, 0.62] }[k]);
          if (P.f) L.hist(cache[k], { bins: 64, range: [-8, 8], density: true, color: 'gold', fillAlpha: 0.3 });
          else { stems(L, [[-1, 0.5], [1, 0.5]], { scale: 0.9, color: 'gold' }); L.text('atoms ½ at ±1', 2.2, 0.56, { size: 11, color: 'gold' }); }
          if (P.f) L.fn(P.f, { color: 'ink', width: 1.5, dash: [6, 4], n: 700 });
          L.hline(0, { color: 'grid', width: 1 });
          L.fn((y) => fT(k, T, y), { color: 'green', width: 2.4, n: k === 'cos' || k === 'sinc' ? 1400 : 500 });
          R.setView([-Math.max(2, Math.min(T * 1.15, 30)), Math.max(2, Math.min(T * 1.15, 30))], null);
          R.vband(-T, T, { color: 'green', alpha: 0.08, edges: true });
          R.fn(phiF[k], { color: 'accent', width: 2.2, n: 1200 });
          R.hline(0, { color: 'grid', width: 1 });
          const absInt = simp((t) => Math.abs(phiF[k](t)), 0, T, Math.max(400, Math.ceil(T * 40))) * 2;
          let sup = 0; if (P.f) for (let y = -8; y <= 8; y += 0.02) { if (k === 'sinc' && Math.abs(Math.abs(y) - 1) < 0.15) continue; sup = Math.max(sup, Math.abs(fT(k, T, y) - P.f(y))); }
          st = { k, T, absInt, sup, peak: k === 'cos' ? fT(k, T, 1) : null, int: P.int };
          v.legend([['green', '$f_T$'], ['ink', 'true density', { dash: [6, 4] }], ['gold', 'samples', { area: true }], ['accent', '$\\varphi$']]);
        });
        v.readout(() => st && `$T=${fr(st.T, 1)}$: $\\int_{-T}^{T}|\\varphi|=${fr(st.absInt, 3)}$` + (st.int ? ` (bounded as $T\\to\\infty$: integrable). $\\sup_y|f_T-f|=${sciT(st.sup)}$.` : st.k === 'sinc' ? ` (grows like $\\log T$: not integrable). Away from $\\pm1$, $\\sup|f_T-f|=${sciT(st.sup)}$, but the limit density jumps.` : ` (grows like $T$). $f_T(1)=${fr(st.peak, 2)}\\approx T/2\\pi$: the mass sits in atoms and there is no density.`));
      },
    },
    {
      num: '3.3.16',
      kind: 'Definition',
      name: 'Cauchy distribution',
      statement: String.raw`The (standard) **Cauchy distribution** has density $\dfrac1{\pi(1+x^2)}$ on $\R$ and characteristic function $e^{-|t|}$ (Example 3.3.16, obtained from the two-sided exponential by Theorem 3.3.14). It has no mean: $E|X|=\infty$. If $X_1,\dots,X_n$ are independent standard Cauchy, then $(X_1+\dots+X_n)/n$ is again standard Cauchy (Exercise 3.3.6).`,
      idea: String.raw`The two-sided exponential density $\tfrac12e^{-|x|}$ has the integrable characteristic function $1/(1+t^2)$. Inverting it (Theorem 3.3.14) gives $\frac1{2\pi}\int\frac{e^{-ity}}{1+s^2}\,ds=\tfrac12e^{-|y|}$. Read backwards, this says the density $1/\pi(1+x^2)$ has characteristic function $e^{-|t|}$. For averages, Theorem 3.3.2 gives $\varphi_{S_n/n}(t)=\varphi(t/n)^n=e^{-|t|}$: averaging does not concentrate. The law of large numbers needs $E|X|<\infty$, and this law shows the condition cannot be dropped.`,
      caption: String.raw`Left: running averages $S_n/n$ of six seeded Cauchy sequences, on a log scale in $n$. Single huge values knock them around forever. Right: the histogram of $S_n/n$ over 3000 seeded replicates for the chosen $n$, against the Cauchy density (green). It is the same curve for every $n$. Switch on the normal comparison: averages of normal samples settle, and their histogram shrinks like $1/\sqrt n$.`,
      deps: ['prob-3.3.14', 'prob-3.3.2'],
      tags: ['distributions', 'heavy tails'],
      viz(v) {
        const nS = v.slider('$n$ (right panel)', 1, 1000, 50, { log: true, int: true });
        const nor = v.toggle('compare: normal samples', false);
        let seed = 1; v.button('Resample', () => { seed++; });
        const L = v.stage({ x: [1, 1e4], xlog: true, y: [-8, 8], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: '$n$', title: 'running averages $S_n/n$' });
        const R = v.stage({ x: [-8, 8], y: [0, 0.45], axes: 'box', gutter: true, height: 320, xlabel: '$x$', title: 'histogram of $S_n/n$' });
        let pc = null, hc = null, st = null;
        const draw = (r) => (nor.value ? r.normal() : sampleCauchy(r));
        v.render(() => {
          const pk = `${seed}|${nor.value}`;
          if (!pc || pc.key !== pk) {
            const paths = [];
            for (let j = 0; j < 6; j++) { const r = v.rng(seed * 100 + j), pts = []; let s = 0, next = 1; for (let n = 1; n <= 10000; n++) { s += draw(r); if (n >= next) { pts.push([n, s / n]); next = Math.ceil(next * 1.03 + 0.5); } } paths.push(pts); }
            pc = { key: pk, paths };
          }
          const n = nS.value, hk = `${seed}|${nor.value}|${n}`;
          if (!hc || hc.key !== hk) { const r = v.rng(seed * 7 + n), xs = []; for (let k = 0; k < 3000; k++) { let s = 0; for (let i = 0; i < n; i++) s += draw(r); xs.push(s / n); } hc = { key: hk, xs }; }
          L.hline(0, { color: 'green', width: 1.2, dash: [5, 4] });
          const cols = ['accent', 'orange', 'purple', 'teal', 'gold', 'pink'];
          pc.paths.forEach((p, j) => L.path(p, { color: cols[j], width: 1.4 }));
          const peak = nor.value ? Math.max(0.45, Math.sqrt(n) * 0.399 * 1.15) : 0.45;
          R.setView(null, [0, Math.min(peak, 15)]);
          const hr = nor.value ? Math.min(8, 5 / Math.sqrt(n)) : 8;
          R.hist(hc.xs, { bins: nor.value ? 60 : 80, range: [-hr, hr], density: true, color: nor.value ? 'accent' : 'gold', fillAlpha: 0.4 });
          R.fn((x) => 1 / (Math.PI * (1 + x * x)), { color: 'green', width: 2.2 });
          const inside = hc.xs.filter((x) => Math.abs(x) <= 1).length / hc.xs.length;
          st = { n, inside, nor: nor.value };
          v.legend([['green', 'Cauchy density'], [nor.value ? 'accent' : 'gold', `${nor.value ? 'normal' : 'Cauchy'} averages`, { area: true }]]);
        });
        v.readout(() => st && `$n=${st.n}$: fraction of replicates with $|S_n/n|\\le1$ is $${fr(st.inside, 3)}$` + (st.nor ? `; for normal samples it tends to $1$.` : ` vs $P(|X_1|\\le1)=\\tfrac12$ for one Cauchy variable, the same for every $n$.`));
      },
    },
    // ======================================================================== §3.3.2 Weak convergence
    {
      num: '3.3.17',
      kind: 'Theorem',
      name: 'Lévy’s continuity theorem',
      statement: String.raw`Let $\mu_n$, $1\le n\le\infty$, be probability measures with characteristic functions $\varphi_n$.

(i) If $\mu_n\Rightarrow\mu_\infty$, then $\varphi_n(t)\to\varphi_\infty(t)$ for every $t$.

(ii) If $\varphi_n(t)$ converges pointwise to a limit $\varphi(t)$ that is continuous at $0$, then $(\mu_n)$ is tight and converges weakly to the probability measure $\mu$ whose characteristic function is $\varphi$.`,
      idea: String.raw`(i) is Theorem 3.2.9 with the bounded continuous functions $\cos tx$ and $\sin tx$. For (ii), Fubini gives the inequality
$$\mu_n\{|x|>2/u\}\le\frac1u\int_{-u}^{u}(1-\varphi_n(t))\,dt.$$
Continuity of $\varphi$ at $0$ makes the right side small for small $u$, and bounded convergence keeps it small for large $n$: the sequence is tight. Helly and tightness (Theorems 3.2.12, 3.2.13) give convergent subsequences, and by (i) every limit has characteristic function $\varphi$. Inversion makes the limit unique, and the sub-subsequence argument (Theorem 3.2.15) finishes.`,
      caption: String.raw`Left: $\varphi_n$ on $[-6,6]$ for the chosen $n$ (blue, earlier $n$ faint) and the pointwise limit (green). Right: the proof's tightness bound. For the chosen $u$, the mass $\mu_n\{|x|>2/u\}$ (blue) sits under $\frac1u\int_{-u}^u(1-\varphi_n)$ (orange) for every $n$. For standardized binomials, $\cos(t/\sqrt n)^n\to e^{-t^2/2}$ and the bound stays small. For uniform laws on $[-n,n]$, or normal$(0,n)$ (Durrett's remark), the limit is $1_{\{0\}}$, which is discontinuous at $0$. The bound tends to $2$, all the mass escapes, and there is no weak limit.`,
      deps: ['prob-3.3.11', 'prob-3.2.13', 'prob-3.2.12', 'prob-3.2.9', 'prob-3.2.15'],
      tags: ['characteristic functions', 'weak convergence'],
      credit: 'Lévy, 1925',
      viz(v) {
        const FAM = { bin: 'standardized binomial', unif: 'uniform $[-n,n]$', norm: 'normal$(0,n)$' };
        const fam = v.select('$\\mu_n$', Object.entries(FAM).map(([value, label]) => ({ value, label })), 'bin');
        const nS = v.slider('$n$', 1, 1000, 6, { int: true, log: true });
        const uS = v.slider('$u$', 0.1, 3, 1, { step: 0.01 });
        const L = v.stage({ x: [-6, 6], y: [-0.3, 1.08], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: '$t$', title: '$\\varphi_n(t)$ and the pointwise limit' });
        const R = v.stage({ x: [1, 1000], xlog: true, y: [0, 2.05], axes: 'box', gutter: true, height: 320, xlabel: '$n$', title: 'mass beyond $2/u$ and its bound' });
        const M = v.M;
        const phi = (f, n, t) => (f === 'bin' ? Math.cos(t / Math.sqrt(n)) ** n : f === 'unif' ? (Math.abs(n * t) < 1e-9 ? 1 : Math.sin(n * t) / (n * t)) : Math.exp(-n * t * t / 2));
        const lim = (f, t) => (f === 'bin' ? Math.exp(-t * t / 2) : t === 0 ? 1 : 0);
        const wc = new Map();
        const tail = (f, n, c) => { if (f === 'unif') return Math.max(0, 1 - c / n); if (f === 'norm') return 2 * (1 - PhiN(M, c / Math.sqrt(n))); if (!wc.has(n)) wc.set(n, walkLaw(n)); const W = wc.get(n); let s = 0; for (let i = 0; i <= n; i++) if (Math.abs(W.xs[i]) > c) s += W.ps[i]; return s; };
        const bound = (f, n, u) => (2 / u) * simp((t) => 1 - phi(f, n, t), 0, u, 400);
        const ns = logInts(1, 1000, 60);
        let st = null;
        v.render(() => {
          const f = fam.value, n = nS.value, u = uS.value;
          L.hline(0, { color: 'grid', width: 1 });
          for (const m of [1, 2, 3].map((k) => Math.max(1, Math.round(n / 3 ** k))).filter((m, i, a) => m < n && a.indexOf(m) === i)) L.fn((t) => phi(f, m, t), { color: 'accent', width: 1, alpha: 0.3, n: 800 });
          if (f === 'bin') L.fn((t) => lim(f, t), { color: 'green', width: 3, alpha: 0.75 });
          else { L.line(-6, 0, 6, 0, { color: 'green', width: 3, alpha: 0.75 }); L.dot(0, 1, { r: 5, color: 'green' }); L.dot(0, 0, { r: 4.5, hollow: true, color: 'green' }); }
          L.fn((t) => phi(f, n, t), { color: 'accent', width: 2.2, n: 1500 });
          L.vband(-u, u, { color: 'orange', alpha: 0.08, edges: true });
          const T = ns.map((m) => [m, tail(f, m, 2 / u)]), B = ns.map((m) => [m, bound(f, m, u)]);
          R.path(B, { color: 'orange', width: 2.2 }); R.path(T, { color: 'accent', width: 2.2 });
          R.dot(n, tail(f, n, 2 / u), { r: 5, color: 'accent' }); R.dot(n, bound(f, n, u), { r: 5, color: 'orange' });
          st = { f, n, u, t: tail(f, n, 2 / u), b: bound(f, n, u), b1000: bound(f, 1000, u), t1000: tail(f, 1000, 2 / u), p1: phi(f, n, 1), l1: lim(f, 1) };
          v.legend([['accent', '$\\varphi_n$ / $\\mu_n\\{|x|>2/u\\}$'], ['green', 'pointwise limit'], ['orange', '$\\frac1u\\int_{-u}^u(1-\\varphi_n)$']]);
        });
        v.readout(() => st && `$\\varphi_{${st.n}}(1)=${fr(st.p1, 4)}$ vs limit $${fr(st.l1, 4)}$. With $u=${fr(st.u, 2)}$: $\\mu_{${st.n}}\\{|x|>${fr(2 / st.u, 2)}\\}=${fr(st.t, 4)}\\le${fr(st.b, 4)}$; at $n=1000$: $${fr(st.t1000, 4)}\\le${fr(st.b1000, 4)}$` + (st.f === 'bin' ? '. The limit is continuous at $0$: tight, and the laws converge to the normal.' : '. The limit jumps at $0$: the bound tends to $2$, the mass escapes, and there is no weak limit.'));
      },
    },
    // ======================================================================== §3.3.3 Moments and derivatives
    {
      num: '3.3.18',
      kind: 'Theorem',
      name: 'Moments give derivatives of the characteristic function',
      statement: String.raw`If $\int|x|^n\,\mu(dx)<\infty$, then the characteristic function $\varphi$ of $\mu$ has a continuous $n$-th derivative, given by
$$\varphi^{(n)}(t)=\int(ix)^ne^{itx}\,\mu(dx).$$
In particular $\varphi^{(n)}(0)=i^nEX^n$, and $\varphi(t)=\sum_{m=0}^{n}E(itX)^m/m!+o(t^n)$ as $t\to0$.`,
      idea: String.raw`Differentiate under the integral $n$ times. The difference quotients of $e^{itx}$ are bounded by $|x|^k$ (since $|e^{ihx}-1|\le|hx|$), which is integrable, so dominated convergence (Theorem 1.6.7; Appendix Theorem A.5.1) justifies each step. Continuity of $\varphi^{(n)}$ is dominated convergence again. Smoothness of $\varphi$ at $0$ thus reflects how fast the tails of $\mu$ decay.`,
      caption: String.raw`Left: difference quotients for the $k$-th derivative at $0$ as the step $h$ shrinks (log scale). Central differences are blue, one-sided forward and backward ones orange and purple. The green line is $i^kEX^k$ when that moment exists. The plotted part is real, except for the odd orders of the shifted normal, where it is imaginary. For the Laplace and normal laws all quotients converge to the moment. Student $t_3$ has $EX^2=3$ but $E|X|^3=\infty$: at $k=3$ the forward and backward quotients tend to $\pm6\sqrt3$, so $\varphi'''(0)$ does not exist, and at $k=4$ the central quotient blows up. The Cauchy law already fails at $k=1$. Right: $\varphi$ near $0$ with its Taylor polynomial built from the moments.`,
      deps: ['prob-3.3.1a', 'prob-1.6.7'],
      see: ['prob-10.5.3'],
      tags: ['characteristic functions', 'moments'],
      viz(v) {
        const LW = {
          nor: { label: 'normal$(\\frac12,1)$', phi: (t) => { const a = Math.exp(-t * t / 2); return [a * Math.cos(t / 2), a * Math.sin(t / 2)]; }, mom: [1, 0.5, 1.25, 1.625, 4.5625], real: false },
          lap: { label: 'Laplace', phi: LAWS.lap.phi, mom: [1, 0, 2, 0, 24], real: true },
          t3: { label: 'Student $t_3$', phi: LAWS.t3.phi, mom: [1, 0, 3, NaN, NaN], real: true },
          cau: { label: 'Cauchy', phi: LAWS.cauchy.phi, mom: [1, NaN, NaN, NaN, NaN], real: true },
        };
        const lw = v.select('law', Object.entries(LW).map(([value, o]) => ({ value, label: o.label })), 't3');
        const kS = v.select('order $k$', [1, 2, 3, 4].map((k) => ({ value: String(k), label: `$k=${k}$` })), '3');
        const L = v.stage({ x: [2e-3, 1], xlog: true, y: [-15, 15], axes: 'box', gutter: true, height: 320, weight: 1.2, xlabel: '$h$', title: 'difference quotients for $\\varphi^{(k)}(0)$' });
        const R = v.stage({ x: [-2, 2], y: [-0.2, 1.1], axes: 'box', gutter: true, height: 320, xlabel: '$t$', title: '$\\varphi$ near $0$ and its Taylor polynomial' });
        const ipow = (k) => [[1, 0], [0, 1], [-1, 0], [0, -1]][k % 4];
        const hs = Array.from({ length: 120 }, (_, i) => 2e-3 * 500 ** (i / 119));
        let st = null;
        v.render(() => {
          const W = LW[lw.value], k = +kS.value, phi = W.phi;
          const comp = (z) => (W.real || k % 2 === 0 ? z[0] : z[1]);
          const fwd = (h) => { let z = [0, 0]; for (let j = 0; j <= k; j++) z = cadd(z, cscale(phi(j * h), (k - j) % 2 ? -binom(k, j) : binom(k, j))); return comp(z) / h ** k; };
          const bwd = (h) => { let z = [0, 0]; for (let j = 0; j <= k; j++) z = cadd(z, cscale(phi(-j * h), (k - j) % 2 ? -binom(k, j) : binom(k, j))); return comp(z) / (-h) ** k; };
          const cen = (h) => {
            const P = (m) => phi(m * h); let z;
            if (k === 1) z = cscale(csub(P(1), P(-1)), 0.5); else if (k === 2) z = cadd(csub(P(1), cscale(P(0), 2)), P(-1));
            else if (k === 3) z = cscale(cadd(csub(P(2), cscale(P(1), 2)), csub(cscale(P(-1), 2), P(-2))), 0.5);
            else z = cadd(cadd(csub(P(2), cscale(P(1), 4)), cscale(P(0), 6)), csub(P(-2), cscale(P(-1), 4)));
            return comp(z) / h ** k;
          };
          const mk = W.mom[k], target = isFinite(mk) ? comp(cscale(ipow(k), mk)) : NaN;
          const C = hs.map((h) => [h, cen(h)]), F = hs.map((h) => [h, fwd(h)]), B = hs.map((h) => [h, bwd(h)]);
          const vals = [...C, ...F, ...B].map((p) => p[1]).filter(isFinite).filter((y) => Math.abs(y) < 1e4);
          let lo = Math.min(...vals, isFinite(target) ? target : 0), hi = Math.max(...vals, isFinite(target) ? target : 0);
          lo = Math.max(lo, -60); hi = Math.min(hi, 60); const pad = Math.max(0.5, 0.12 * (hi - lo)); L.setView(null, [lo - pad, hi + pad]);
          if (isFinite(target)) L.hline(target, { color: 'green', width: 2 });
          L.path(F, { color: 'orange', width: 1.6 }); L.path(B, { color: 'purple', width: 1.6 }); L.path(C, { color: 'accent', width: 2.4 });
          // right panel: φ near 0 with the Taylor polynomial of order k (or the largest order available)
          let kk = k; while (kk > 0 && !isFinite(W.mom[kk])) kk--;
          const tay = (t) => { let z = [0, 0]; for (let m = 0; m <= kk; m++) { let f = 1; for (let j = 2; j <= m; j++) f *= j; z = cadd(z, cscale(ipow(m), (W.mom[m] * t ** m) / f)); } return z; };
          R.hline(0, { color: 'grid', width: 1 });
          R.fn((t) => phi(t)[0], { color: 'accent', width: 2.4 });
          if (!W.real) R.fn((t) => phi(t)[1], { color: 'orange', width: 2.4 });
          R.fn((t) => tay(t)[0], { color: 'green', width: 1.6, dash: [6, 4] });
          if (!W.real) R.fn((t) => tay(t)[1], { color: 'green', width: 1.6, dash: [2, 4] });
          st = { k, target, c: cen(2e-3), f: fwd(2e-3), b: bwd(2e-3), kk, part: W.real || k % 2 === 0 ? '\\mathrm{Re}' : '\\mathrm{Im}' };
          v.legend([['accent', 'central'], ['orange', 'forward'], ['purple', 'backward'], ['green', '$i^kEX^k$ / Taylor polynomial']]);
        });
        v.readout(() => st && `$k=${st.k}$, at $h=0.002$ ($${st.part}$ part): central $${fr(st.c, 3)}$, forward $${fr(st.f, 3)}$, backward $${fr(st.b, 3)}$` + (isFinite(st.target) ? `; $i^kEX^k$ gives $${fr(st.target, 3)}$.` : `; $E|X|^{${st.k}}=\\infty$, so the quotients need not agree or converge. Taylor polynomial on the right uses moments up to order $${st.kk}$.`));
      },
    },
    {
      num: '3.3.19',
      kind: 'Lemma',
      name: 'Taylor remainder bound for e^{ix}',
      statement: String.raw`For real $x$ and $n\ge0$,
$$\Bigl|e^{ix}-\sum_{m=0}^{n}\frac{(ix)^m}{m!}\Bigr|\le\min\Bigl(\frac{|x|^{n+1}}{(n+1)!},\ \frac{2|x|^n}{n!}\Bigr).$$`,
      idea: String.raw`Repeated integration by parts gives the exact remainder $\frac{i^{n+1}}{n!}\int_0^x(x-s)^ne^{is}\,ds$. Bounding $|e^{is}|\le1$ gives the first estimate, the usual Taylor size, which is good for small $|x|$. One more integration by parts turns the remainder into $\frac{i^n}{(n-1)!}\int_0^x(x-s)^{n-1}(e^{is}-1)\,ds$. Bounding $|e^{is}-1|\le2$ gives the second estimate, better for $|x|>2(n+1)$. The second estimate is what lets the central limit theorem get by with only two moments (Theorem 3.3.20).`,
      caption: String.raw`Left, log–log: the true remainder (blue), the Taylor bound $|x|^{n+1}/(n+1)!$ (orange dashed) and the second bound $2|x|^n/n!$ (purple dashed). The smaller of the two (green) always lies above the remainder, and they cross at $|x|=2(n+1)$. Right: the partial sums $\sum_{m\le k}(ix)^m/m!$, $k\le n$, form a polygon spiralling toward $e^{ix}$ on the unit circle. The red segment is the remainder for the chosen $x$.`,
      deps: [],
      tags: ['estimates'],
      viz(v) {
        const nS = v.slider('$n$', 0, 8, 2, { int: true });
        const xS = v.slider('$x$', 0.1, 12, 2.5, { step: 0.01 });
        const L = v.stage({ x: [0.01, 100], xlog: true, y: [1e-14, 1e6], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1.2, xlabel: '$|x|$', title: 'remainder and the two bounds' });
        const C = v.stage({ x: [-2.6, 2.6], y: [-2.2, 2.2], equal: true, axes: true, xticks: [-0.5, 0.5], yticks: [-0.5, 0.5], height: 330, title: 'partial sums in $\\mathbb C$' });
        const fact = (m) => { let f = 1; for (let j = 2; j <= m; j++) f *= j; return f; };
        const rem = (n, x) => { // tail Σ_{m>n} (ix)^m/m! summed directly for |x| < 25, else e^{ix} − partial sum
          if (Math.abs(x) < 25) { let re = 0, im = 0, term = 1; for (let m = 1; m <= n + 120; m++) { term *= x / m; if (m > n) { const r = m % 4; if (r === 0) re += term; else if (r === 1) im += term; else if (r === 2) re -= term; else im -= term; } if (m > n && Math.abs(term) < 1e-300) break; } return Math.hypot(re, im); }
          let re = Math.cos(x), im = Math.sin(x), term = 1; for (let m = 0; m <= n; m++) { if (m) term *= x / m; const r = m % 4; if (r === 0) re -= term; else if (r === 1) im -= term; else if (r === 2) re += term; else im += term; } return Math.hypot(re, im);
        };
        let st = null;
        v.render(() => {
          const n = nS.value, x0 = xS.value;
          const b1 = (x) => x ** (n + 1) / fact(n + 1), b2 = (x) => (2 * x ** n) / fact(n);
          L.setView(null, [clampN(rem(n, 0.01) / 30, 1e-16, 1e-3), 1e6]);
          L.fn(b1, { color: 'orange', width: 1.6, dash: [6, 4] });
          L.fn(b2, { color: 'purple', width: 1.6, dash: [6, 4] });
          L.fn((x) => Math.min(b1(x), b2(x)), { color: 'green', width: 3, alpha: 0.7 });
          L.fn((x) => Math.max(1e-15, rem(n, x)), { color: 'accent', width: 2.2, n: 500 });
          const xc = 2 * (n + 1); L.vline(xc, { color: 'muted', dash: [3, 4], width: 1 }); L.text(`2(n+1) = ${xc}`, xc, 1e5, { dx: 4, size: 11, color: 'muted' });
          L.vline(x0, { color: 'gold', dash: [4, 4], width: 1 }); L.dot(x0, rem(n, x0), { r: 5, color: 'accent' });
          // partial sums polygon
          unitCircle(C);
          const pts = [[0, 0]]; let z = [0, 0], term = 1;
          for (let m = 0; m <= n; m++) { if (m) term *= x0 / m; z = cadd(z, cscale([[1, 0], [0, 1], [-1, 0], [0, -1]][m % 4], term)); pts.push(z.slice()); }
          const ext = Math.max(2.2, ...pts.map((p) => Math.max(Math.abs(p[0]), Math.abs(p[1])) * 1.1)); C.setView([-ext * 1.2, ext * 1.2], [-ext, ext]);
          C.path(pts, { color: 'accent', width: 1.8 }); C.dots(pts.slice(1), { r: 3.2, color: 'accent' });
          const e = cexpi(x0); C.line(z[0], z[1], e[0], e[1], { color: 'red', width: 2.6 });
          C.dot(e[0], e[1], { r: 5.5, color: 'green', label: '$e^{ix}$', labelPos: 'ne' });
          st = { n, x0, r: rem(n, x0), b1: b1(x0), b2: b2(x0) };
          v.legend([['accent', 'remainder / partial sums'], ['orange', '$|x|^{n+1}/(n+1)!$', { dash: [6, 4] }], ['purple', '$2|x|^n/n!$', { dash: [6, 4] }], ['green', 'minimum'], ['red', 'remainder segment']]);
        });
        v.readout(() => st && `$n=${st.n}$, $x=${fr(st.x0, 2)}$: remainder $${sciT(st.r, 3)}$ $\\le\\min(${sciT(st.b1, 3)},\\ ${sciT(st.b2, 3)})$; the ${st.b1 <= st.b2 ? 'Taylor' : 'second'} bound is the smaller one here.`);
      },
    },
    {
      num: '3.3.20',
      kind: 'Theorem',
      name: 'Second-order expansion of the characteristic function',
      statement: String.raw`If $EX^2<\infty$, then as $t\to0$
$$\varphi(t)=1+itEX-\tfrac12t^2E(X^2)+o(t^2).$$`,
      idea: String.raw`Apply Lemma 3.3.19 with $n=2$ to $x=tX$, take expectations and use Jensen. The error is at most $t^2E\min(|t||X|^3,\,2|X|^2)$. The random variable inside is dominated by $2|X|^2$, which is integrable, and it tends to $0$ as $t\to0$, so dominated convergence makes the expectation $o(1)$. No third moment is needed, thanks to the second branch of the minimum. This expansion is the engine of the i.i.d. central limit theorem (Theorem 3.4.1).`,
      caption: String.raw`Left: zoom in on $t=0$, where $\varphi$ (blue real part, orange imaginary part) hugs the quadratic $1+itEX-t^2EX^2/2$ (green dashed). Right, log–log: the error divided by $t^2$ (blue) under the proof's bound $E\min(|t||X|^3,2X^2)$ (orange dashed); both tend to $0$. Student $t_3$ has no third moment, yet the expansion still holds. The stable law with $\varphi=e^{-|t|^{3/2}}$ has $EX^2=\infty$. No quadratic fits it: $|1-\varphi(t)|/t^2$ (red) blows up.`,
      deps: ['prob-3.3.19', 'prob-1.6.7'],
      tags: ['characteristic functions'],
      viz(v) {
        const c3 = (6 * SQ3) / Math.PI;
        const LW = {
          exp: { label: 'exponential', phi: LAWS.exp.phi, m1: 1, m2: 2, bnd: (t) => { const A = 2 / t, e = Math.exp(-A); return t * (6 - e * (A ** 3 + 3 * A * A + 6 * A + 6)) + 2 * e * (A * A + 2 * A + 2); } },
          t3: { label: 'Student $t_3$', phi: LAWS.t3.phi, m1: 0, m2: 3, bnd: (t) => { const A = 2 / t, u = 3 + A * A; return 2 * c3 * (t * 0.5 * (Math.log(u) + 3 / u - Math.log(3) - 1) + (Math.PI / (2 * SQ3) - Math.atan(A / SQ3) / SQ3 + A / u)); } },
          coin: { label: 'coin $\\pm1$', phi: LAWS.coin.phi, m1: 0, m2: 1, bnd: (t) => Math.min(t, 2) },
          st: { label: 'stable $\\alpha=\\frac32$', phi: stablePhi(1.5), m1: 0, m2: Infinity, bnd: null },
        };
        const lw = v.select('law', Object.entries(LW).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const wS = v.slider('zoom: $|t|\\le w$', 0.05, 3, 1.2, { log: true });
        const L = v.stage({ x: [-1.2, 1.2], y: [-1, 1.1], axes: 'box', gutter: true, height: 320, xlabel: '$t$', title: '$\\varphi$ and $1+itEX-t^2EX^2/2$' });
        const R = v.stage({ x: [1e-3, 3], xlog: true, y: [1e-4, 100], ylog: true, axes: 'box', gutter: true, height: 320, weight: 1.1, xlabel: '$|t|$', title: 'error$/t^2$ and the bound' });
        let st = null;
        v.render(() => {
          const W = LW[lw.value], w = wS.value, fin = isFinite(W.m2);
          const quad = (t) => [1 - (t * t * (fin ? W.m2 : 0)) / 2, t * W.m1];
          const re = [], ims = []; for (let i = 0; i <= 200; i++) { const t = -w + (2 * w * i) / 200; re.push(W.phi(t)[0]); ims.push(W.phi(t)[1]); }
          const lo = Math.min(...re, ...ims, fin ? quad(w)[0] : 0), hi = Math.max(...re, ...ims, 1); const pd = 0.08 * (hi - lo) + 1e-3;
          L.setView([-w, w], [lo - pd, hi + pd]);
          L.hline(0, { color: 'grid', width: 1 });
          L.fn((t) => W.phi(t)[0], { color: 'accent', width: 2.4 });
          L.fn((t) => W.phi(t)[1], { color: 'orange', width: 2.4 });
          if (fin) { L.fn((t) => quad(t)[0], { color: 'green', width: 1.6, dash: [6, 4] }); L.fn((t) => quad(t)[1], { color: 'green', width: 1.6, dash: [2, 4] }); }
          const ts = Array.from({ length: 160 }, (_, i) => 1e-3 * 3000 ** (i / 159));
          if (fin) {
            R.path(ts.map((t) => [t, cabs(csub(W.phi(t), quad(t))) / (t * t)]), { color: 'accent', width: 2.4 });
            R.path(ts.map((t) => [t, W.bnd(t)]), { color: 'orange', width: 1.8, dash: [6, 4] });
          } else R.path(ts.map((t) => [t, cabs(csub([1, 0], W.phi(t))) / (t * t)]), { color: 'red', width: 2.4 });
          R.vline(w, { color: 'gold', dash: [4, 4], width: 1 });
          const e = fin ? cabs(csub(W.phi(w), quad(w))) / (w * w) : cabs(csub([1, 0], W.phi(w))) / (w * w);
          st = { w, e, b: fin ? W.bnd(w) : NaN, fin, e3: fin ? cabs(csub(W.phi(1e-3), quad(1e-3))) / 1e-6 : cabs(csub([1, 0], W.phi(1e-3))) / 1e-6, m1: W.m1, m2: W.m2 };
          v.legend([['accent', '$\\mathrm{Re}\\,\\varphi$ / error$/t^2$'], ['orange', '$\\mathrm{Im}\\,\\varphi$ / bound'], ...(fin ? [['green', 'quadratic', { dash: [6, 4] }]] : [['red', '$|1-\\varphi|/t^2$']])]);
        });
        v.readout(() => st && (st.fin ? `$EX=${fr(st.m1, 2)}$, $EX^2=${fr(st.m2, 2)}$. At $t=${fr(st.w, 3)}$: $|\\varphi(t)-1-itEX+t^2EX^2/2|/t^2=${sciT(st.e, 3)}\\le E\\min(|t||X|^3,2X^2)=${sciT(st.b, 3)}$; at $t=0.001$ it is $${sciT(st.e3, 3)}$.` : `$EX^2=\\infty$: at $t=${fr(st.w, 3)}$, $|1-\\varphi(t)|/t^2=${sciT(st.e, 3)}$, and at $t=0.001$ it is $${sciT(st.e3, 3)}$, growing like $|t|^{-1/2}$. No quadratic expansion exists.`));
      },
    },
    {
      num: '3.3.21',
      kind: 'Theorem',
      name: 'Second difference of φ controls the variance',
      statement: String.raw`If
$$\limsup_{h\downarrow0}\frac{\varphi(h)-2\varphi(0)+\varphi(-h)}{h^2}>-\infty,$$
then $EX^2<\infty$.`,
      idea: String.raw`The second difference is an integral: $\frac{\varphi(h)-2\varphi(0)+\varphi(-h)}{h^2}=-\int\frac{2(1-\cos hx)}{h^2}\,dF(x)$. The integrand is $\ge0$ and tends to $x^2$ as $h\to0$. Fatou's lemma (Theorem 1.6.5) gives $\int x^2\,dF\le\liminf\int\frac{2(1-\cos hx)}{h^2}\,dF$, which is $-\limsup$ of the quotient, hence finite. So a "second derivative at $0$" of $\varphi$, even in this weak sense, forces a finite second moment.`,
      caption: String.raw`Left, log–log: minus the second difference quotient, $-\bigl(\varphi(h)-2+\varphi(-h)\bigr)/h^2$, as $h\downarrow0$, against $EX^2$ (green) when it is finite. Right: the proof's integrand $2(1-\cos hx)/h^2$ (blue) rising toward $x^2$ (black) as $h$ shrinks, over the density of $X$ (shaded). For the stable law ($\alpha=\tfrac32$) and the Cauchy law the quotient blows up like $h^{-1/2}$ and $h^{-1}$. By the theorem, a bounded quotient would have forced a finite variance.`,
      deps: ['prob-1.6.5', 'prob-3.3.1a'],
      tags: ['characteristic functions', 'moments'],
      viz(v) {
        const LW = {
          nor: { label: 'normal$(0,1.5^2)$', phi: (t) => Math.exp(-1.125 * t * t), m2: 2.25, pdf: (x) => PHI(x / 1.5) / 1.5 },
          lap: { label: 'Laplace', phi: (t) => 1 / (1 + t * t), m2: 2, pdf: LAWS.lap.pdf },
          t3: { label: 'Student $t_3$', phi: t3Phi, m2: 3, pdf: t3Pdf },
          st: { label: 'stable $\\alpha=\\frac32$', phi: (t) => Math.exp(-(Math.abs(t) ** 1.5)), m2: Infinity, pdf: null },
          cau: { label: 'Cauchy', phi: (t) => Math.exp(-Math.abs(t)), m2: Infinity, pdf: LAWS.cauchy.pdf },
        };
        const lw = v.select('law', Object.entries(LW).map(([value, o]) => ({ value, label: o.label })), 't3');
        const hS = v.slider('$h$', 0.01, 2, 0.5, { log: true });
        const L = v.stage({ x: [1e-3, 3], xlog: true, y: [0.1, 3000], ylog: true, axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: '$h$', title: '$-(\\varphi(h)-2+\\varphi(-h))/h^2$' });
        const R = v.stage({ x: [-8, 8], y: [0, 30], axes: 'box', gutter: true, height: 320, xlabel: '$x$', title: '$2(1-\\cos hx)/h^2$ vs $x^2$' });
        // the stable density by numerical inversion (once)
        let stPdf = null;
        const getSt = () => { if (!stPdf) { const xs = Array.from({ length: 321 }, (_, i) => -8 + i * 0.05); const ys = xs.map((x) => simp((t) => Math.cos(t * x) * Math.exp(-(t ** 1.5)), 0, 14, 1400) / Math.PI); stPdf = (x) => { const i = (x + 8) / 0.05, j = Math.floor(i); if (j < 0 || j >= 320) return 0; return ys[j] + (ys[j + 1] - ys[j]) * (i - j); }; } return stPdf; };
        let st = null;
        v.render(() => {
          const W = LW[lw.value], h = hS.value, Q = (s) => (2 * (1 - W.phi(s))) / (s * s);
          const hs = Array.from({ length: 160 }, (_, i) => 1e-3 * 3000 ** (i / 159));
          if (isFinite(W.m2)) L.hline(W.m2, { color: 'green', width: 2 });
          L.path(hs.map((s) => [s, Q(s)]), { color: 'accent', width: 2.4 });
          L.vline(h, { color: 'gold', dash: [4, 4], width: 1 }); L.dot(h, Q(h), { r: 5, color: 'accent' });
          const pdf = W.pdf || getSt();
          R.fn((x) => pdf(x) * 60, { color: 'muted', width: 1, fill: 'muted', fillAlpha: 0.15, n: 400 });
          R.fn((x) => x * x, { color: 'ink', width: 1.8 });
          R.fn((x) => (2 * (1 - Math.cos(h * x))) / (h * h), { color: 'accent', width: 2.2, n: 800 });
          st = { h, q: Q(h), q3: Q(1e-3), m2: W.m2 };
          v.legend([['accent', 'quotient / $2(1-\\cos hx)/h^2$'], ['green', '$EX^2$'], ['ink', '$x^2$'], ['muted', 'density (scaled)', { area: true }]]);
        });
        v.readout(() => st && `$h=${fr(st.h, 3)}$: $-\\text{quotient}=2\\int\\frac{1-\\cos hx}{h^2}dF=${fr(st.q, 3)}$; at $h=0.001$: $${fr(st.q3, 3)}$` + (isFinite(st.m2) ? `, tending to $EX^2=${fr(st.m2, 2)}$.` : `, unbounded, consistent with $EX^2=\\infty$.`));
      },
    },
    // ======================================================================== §3.3.4 Pólya's criterion
    {
      num: '3.3.22',
      kind: 'Theorem',
      name: 'Pólya’s criterion',
      statement: String.raw`Let $\varphi$ be real and nonnegative with $\varphi(0)=1$, $\varphi(-t)=\varphi(t)$, decreasing and convex on $(0,\infty)$, with $\lim_{t\downarrow0}\varphi(t)=1$ and $\lim_{t\to\infty}\varphi(t)=0$. Then there is a probability measure $\nu$ on $(0,\infty)$ with
$$\varphi(t)=\int_0^\infty\Bigl(1-\Bigl|\frac ts\Bigr|\Bigr)^+\nu(ds),$$
and hence $\varphi$ is a characteristic function.`,
      idea: String.raw`Each triangle $(1-|t/s|)^+$ is a characteristic function: it belongs to Pólya's density, rescaled (Example 3.3.15). The measure $\nu$ comes from the convexity: $d\nu=s\,d\varphi'(s)$, where $\varphi'$ is the increasing right derivative. Integrating twice with Fubini recovers $\varphi$, and $t=0$ shows $\nu$ has mass $1$. When $\varphi$ is piecewise linear, $\nu$ has finitely many atoms, and Lemma 3.3.9 shows the mixture is a characteristic function. In general, approximate $\nu$ by such measures and pass to the limit with the continuity theorem (Theorem 3.3.17). Example: $e^{-|t|^\alpha}$, $0<\alpha\le1$.`,
      caption: String.raw`Left: drag the three knots to shape a piecewise-linear $\varphi$ on $t\ge0$; convexity is enforced. The coloured triangles $\nu(\{s_i\})(1-t/s_i)^+$ have their corners at the knots, and they add up to $\varphi$. Right: the density $\sum_i\nu(\{s_i\})\,\frac{1-\cos(s_ix)}{\pi s_ix^2}$ (green), checked against direct numerical inversion of $\varphi$ (black dashed), over 4000 seeded samples drawn from the mixture. Switch off convexity (the middle knot jumps above the chord): a knot above the chord gives a negative weight, and the inverted "density" may dip below zero.`,
      deps: ['prob-3.3.14', 'prob-3.3.17', 'prob-3.3.9'],
      tags: ['characteristic functions'],
      credit: 'Pólya, 1949',
      viz(v) {
        const cvx = v.toggle('enforce convexity', true, { onChange: (on) => { if (on) { H[0].set(0.5, 0.55); H[1].set(1.5, 0.2); H[2].set(3.2, 0); } else H[1].set(1.5, 0.48); } });
        const P = v.stage({ x: [-0.15, 4.2], y: [-0.04, 1.08], axes: 'box', gutter: true, height: 320, xlabel: '$t$', title: '$\\varphi$ as a mixture of triangles' });
        const D = v.stage({ x: [-12, 12], y: [-0.05, 0.4], axes: 'box', gutter: true, height: 320, weight: 1.1, xlabel: '$x$', title: 'the density it inverts to' });
        const K = [[0.5, 0.55], [1.5, 0.2], [3.2, 0]];
        const H = [];
        const chord = (x0, y0, x1, y1, t) => y0 + ((y1 - y0) * (t - x0)) / (x1 - x0);
        H[0] = P.handle(K[0][0], K[0][1], { color: 'accent', constrain: (x, y) => {
          const t2 = H[1].x, y2 = H[1].y; const t = clampN(x, 0.08, t2 - 0.08);
          if (!cvx.value) return [t, clampN(y, y2, 1)];
          const m2 = -y2 / (H[2].x - t2), lo = Math.max(y2, y2 - m2 * (t2 - t)), hi = chord(0, 1, t2, y2, t); return [t, clampN(y, lo, Math.max(lo, hi))];
        } });
        H[1] = P.handle(K[1][0], K[1][1], { color: 'orange', constrain: (x, y) => {
          const t1 = H[0].x, y1 = H[0].y, t3 = H[2].x; const t = clampN(x, t1 + 0.08, t3 - 0.08);
          if (!cvx.value) return [t, clampN(y, 0, y1)];
          const m0 = (y1 - 1) / t1, lo = Math.max(0, y1 + m0 * (t - t1)), hi = Math.min(y1, chord(t1, y1, t3, 0, t)); return [t, clampN(y, Math.min(lo, hi), hi)];
        } });
        H[2] = P.handle(K[2][0], 0, { color: 'purple', constrain: (x) => {
          const t1 = H[0].x, y1 = H[0].y, t2 = H[1].x, y2 = H[1].y; let lo = t2 + 0.08;
          if (cvx.value) { const m1 = (y2 - y1) / (t2 - t1); if (m1 < -1e-9) lo = Math.max(lo, t2 - y2 / m1); }
          return [clampN(x, lo, 4), 0];
        } });
        let cache = null, st = null;
        v.render(() => {
          const s = H.map((h) => h.x), y = [H[0].y, H[1].y, 0];
          const m = [(y[0] - 1) / s[0], (y[1] - y[0]) / (s[1] - s[0]), (0 - y[1]) / (s[2] - s[1]), 0];
          const w = [0, 1, 2].map((i) => s[i] * (m[i + 1] - m[i]));
          const phi = (t) => { t = Math.abs(t); if (t <= s[0]) return 1 + m[0] * t; if (t <= s[1]) return y[0] + m[1] * (t - s[0]); if (t <= s[2]) return y[1] + m[2] * (t - s[1]); return 0; };
          const cols = ['accent', 'orange', 'purple'];
          // stacked triangles
          let base = () => 0;
          [2, 1, 0].forEach((i) => { const b0 = base, tri = (t) => b0(t) + w[i] * Math.max(0, 1 - Math.abs(t) / s[i]); P.between(tri, b0, 0, s[i], { fill: cols[i], fillAlpha: w[i] >= 0 ? 0.25 : 0.12, n: 200 }); base = tri; });
          P.fn((t) => phi(t), { domain: [-0.15, 4.2], color: 'ink', width: 2.4, n: 600 });
          P.dot(0, 1, { r: 4, color: 'ink' });
          H.forEach((h, i) => P.text(`$\\nu=${fr(w[i], 2)}$`, h.x, h.y, { dx: 8, dy: -14, size: 11, color: w[i] < -1e-9 ? 'red' : cols[i] }));
          const f = (x) => w.reduce((acc, wi, i) => acc + wi * (Math.abs(x) < 1e-4 ? s[i] / (2 * Math.PI) : (1 - Math.cos(s[i] * x)) / (Math.PI * s[i] * x * x)), 0);
          const finv = (x) => simp((t) => phi(t) * Math.cos(t * x), 0, s[2], 400) / Math.PI;
          const allPos = w.every((wi) => wi >= -1e-12);
          const key = s.join(',') + y.join(',');
          if (allPos && (!cache || cache.key !== key)) { const r = v.rng(5), cw = [w[0], w[0] + w[1], 1], xs = []; for (let k = 0; k < 4000; k++) { const u = r(); const i = u < cw[0] ? 0 : u < cw[1] ? 1 : 2; xs.push(samplePolya(r) / s[i]); } cache = { key, xs }; }
          if (allPos) D.hist(cache.xs, { bins: 72, range: [-12, 12], density: true, color: 'gold', fillAlpha: 0.3 });
          D.hline(0, { color: 'grid', width: 1 });
          D.fn(f, { color: 'green', width: 2.6, n: 700 });
          D.fn(finv, { color: 'ink', width: 1.4, dash: [6, 4], n: 160 });
          let mn = Infinity, dmax = 0; for (let x = -12; x <= 12; x += 0.05) { const fx = f(x); mn = Math.min(mn, fx); }
          for (let x = -12; x <= 12; x += 0.6) dmax = Math.max(dmax, Math.abs(f(x) - finv(x)));
          D.setView(null, [Math.min(-0.05, mn * 1.2), Math.max(0.2, f(0) * 1.2)]);
          st = { w, mn, dmax, allPos };
          v.legend([['ink', '$\\varphi$ / numerical inversion'], ['green', 'mixture of Pólya densities'], ['gold', 'samples', { area: true }]]);
        });
        v.readout(() => st && `Weights $\\nu(\\{s_i\\})=${st.w.map((x) => fr(x, 3)).join(',\\ ')}$ (sum $${fr(st.w.reduce((a, b) => a + b, 0), 3)}$). Minimum of the density: $${fr(st.mn, 4)}$; formula vs inversion: $${sciT(st.dmax)}$` + (st.allPos ? ': a genuine mixture, so $\\varphi$ is a characteristic function.' : st.mn < -1e-6 ? ': a negative weight, and the inverse transform goes negative, so this $\\varphi$ is not a characteristic function.' : ': a negative weight, yet the inverse is still $\\ge0$. Pólya is sufficient, not necessary.'));
      },
    },
    // ======================================================================== §3.3.5 The moment problem
    {
      num: '3.3.25',
      kind: 'Theorem',
      name: 'Moment growth condition for uniqueness',
      statement: String.raw`Let $\mu_k=\int x^k\,dF(x)$. If $\limsup_{k\to\infty}\mu_{2k}^{1/2k}/2k=r<\infty$, then $F$ is the only distribution function with these moments. (This is slightly stronger than Carleman's condition $\sum_k\mu_{2k}^{-1/2k}=\infty$, which also suffices.) Without such a condition uniqueness can fail: the lognormal density $f_0(x)=(2\pi)^{-1/2}x^{-1}e^{-(\log x)^2/2}$ and $f_a(x)=f_0(x)\bigl(1+a\sin(2\pi\log x)\bigr)$, $|a|\le1$, have the same moments (Heyde, 1963).`,
      idea: String.raw`Cauchy–Schwarz controls the odd absolute moments, $\nu_{2k+1}^2\le\mu_{2k}\mu_{2k+2}$, so $\nu_k^{1/k}/k$ stays bounded. Lemma 3.3.19 with the bound $|tX|^n/n!$ then shows that $\varphi$ equals its Taylor series around every $\theta$ on a disc of fixed radius $1/er$. Its derivatives there are moments (Theorem 3.3.18), so they are fixed by the $\mu_k$. Starting from $\varphi(0)=1$ and stepping outward by a fixed amount, any two candidates agree on all of $\R$. For the lognormal, $\mu_{2k}=e^{2k^2}$, so $\mu_{2k}^{1/2k}/2k=e^k/2k\to\infty$. The substitution $x=e^{s+r}$ turns $\int x^rf_0(x)\sin(2\pi\log x)\,dx$ into an odd integral, which vanishes.`,
      caption: String.raw`Left: the lognormal $f_0$ (blue) and the perturbed $f_a$ (orange); drag $a$. Right, log scale: $\mu_{2k}^{1/2k}/2k$ for the lognormal (red), which runs away, against the normal (green), which tends to $0$, and the exponential (blue), which tends to $1/e$. The criterion holds for the last two. The readout integrates the first moments of $f_0$ and $f_a$ numerically: two different densities with the same moments.`,
      deps: ['prob-3.3.18', 'prob-3.3.19'],
      tags: ['moment problem'],
      credit: 'Carleman, 1926; Heyde, 1963',
      viz(v) {
        const aS = v.slider('$a$', -1, 1, 0.6, { step: 0.01 });
        const L = v.stage({ x: [0, 5], y: [0, 1.3], axes: 'box', gutter: true, height: 320, weight: 1.15, xlabel: '$x$', title: 'lognormal $f_0$ and $f_a$' });
        const R = v.stage({ x: [0.5, 12.5], y: [0.05, 2e4], ylog: true, axes: 'box', gutter: true, height: 320, xlabel: '$k$', title: '$\\mu_{2k}^{1/2k}/2k$' });
        const f0 = (x) => (x <= 0 ? 0 : Math.exp(-(Math.log(x) ** 2) / 2) / (x * Math.sqrt(2 * Math.PI)));
        const lf = (k) => { let s = 0; for (let j = 2; j <= k; j++) s += Math.log(j); return s; };
        let st = null;
        v.render(() => {
          const a = aS.value, fa = (x) => f0(x) * (1 + a * Math.sin(2 * Math.PI * Math.log(x)));
          L.fn(f0, { domain: [0.001, 5], color: 'accent', width: 2.4, n: 800 });
          L.fn(fa, { domain: [0.001, 5], color: 'orange', width: 2.2, n: 1200, fill: 'orange', fillAlpha: 0.1 });
          const ks = Array.from({ length: 12 }, (_, i) => i + 1);
          const logN = ks.map((k) => [k, Math.exp((lf(2 * k) - lf(k) - k * Math.LN2) / (2 * k)) / (2 * k)]);
          const expo = ks.map((k) => [k, Math.exp(lf(2 * k) / (2 * k)) / (2 * k)]);
          const logn = ks.map((k) => [k, Math.exp(k) / (2 * k)]);
          R.hline(1 / Math.E, { color: 'accent', dash: [3, 4], width: 1 });
          [[logn, 'red'], [expo, 'accent'], [logN, 'green']].forEach(([p, c]) => { R.path(p, { color: c, width: 1.6 }); R.dots(p, { r: 3.5, color: c }); });
          // moments r = 0..4 in the variable s = log x: ∫ e^{rs} φ(s) (1 + a sin 2πs) ds
          const mom = (r, aa) => simp((s) => Math.exp(r * s) * PHI(s) * (1 + aa * Math.sin(2 * Math.PI * s)), r - 14, r + 14, 6000);
          const m0 = [0, 1, 2, 3, 4].map((r) => mom(r, 0)), ma = [0, 1, 2, 3, 4].map((r) => mom(r, a));
          let l1 = 0; for (let x = 0.0005; x < 30; x += 0.001) l1 += Math.abs(fa(x) - f0(x)) * 0.001;
          st = { m0, ma, l1, a };
          v.legend([['accent', '$f_0$ / exponential'], ['orange', '$f_a$'], ['red', 'lognormal'], ['green', 'normal']]);
        });
        v.readout(() => st && `Moments $\\int x^rf\\,dx$, $r=0,\\dots,4$: $f_0$: $${st.m0.map((x) => fr(x, 3)).join(',\\ ')}$; $f_a$: $${st.ma.map((x) => fr(x, 3)).join(',\\ ')}$ (exact $e^{r^2/2}$). Yet $\\int|f_a-f_0|\\,dx=${fr(st.l1, 3)}$.`);
      },
    },
    {
      num: '3.3.26',
      kind: 'Theorem',
      name: 'Method of moments for weak convergence',
      statement: String.raw`Suppose $\int x^k\,dF_n(x)$ has a limit $\mu_k$ for every $k\ge1$, and $\limsup_{k\to\infty}\mu_{2k}^{1/2k}/2k<\infty$. Then $F_n$ converges weakly to the unique distribution with moments $\mu_k$.`,
      idea: String.raw`Bounded second moments make the sequence tight (Theorem 3.2.14 with $\varphi=x^2$). By Exercise 3.2.5, every subsequential limit has moments $\mu_k$ (uniform integrability from the next even moment). Theorem 3.3.25 says there is only one such law, so every subsequence has a sub-subsequence converging to it. Theorem 3.2.15 finishes. The normal moments $(2k-1)!!$ satisfy the growth condition, so moment convergence alone proves central limit theorems.`,
      caption: String.raw`Standardized binomials $Z_n=(S_n-np)/\sqrt{np(1-p)}$. Left: the exact law as a density histogram against the normal curve. Right: the exact moments $EZ_n^k$ for $k=1,\dots,8$ beside the normal moments $0,1,0,3,0,15,0,105$; cells shade green as they agree. Push $n$ up and every moment converges, the histogram with it. A skewed $p$ slows the odd moments, since $EZ_n^3=(1-2p)/\sqrt{np(1-p)}$.`,
      deps: ['prob-3.3.25', 'prob-3.2.14', 'prob-3.2.15'],
      tags: ['moment problem', 'weak convergence'],
      viz(v) {
        const nS = v.slider('$n$', 1, 2000, 10, { int: true, log: true });
        const pS = v.slider('$p$', 0.05, 0.95, 0.5, { step: 0.01 });
        const L = v.stage({ x: [-4, 4], y: [0, 0.6], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: '$z$', title: 'law of $Z_n$ and the normal density' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: 'moments $EZ_n^k$' });
        const TB = v.table(T, { rows: 8, cols: 3, square: false, cellAspect: 2.4, maxCell: 34, size: 13, colLabels: ['$EZ_n^k$', 'normal', 'gap'], rowLabels: (i) => String(i + 1), cornerLabel: '$k$' });
        const NM = [0, 1, 0, 3, 0, 15, 0, 105];
        let st = null;
        v.render(() => {
          const n = nS.value, p = pS.value, q = 1 - p, sd = Math.sqrt(n * p * q);
          const lp = Math.log(p), lq = Math.log(q); let lf = [0]; for (let k = 1; k <= n; k++) lf.push(lf[k - 1] + Math.log(k));
          const pm = Array.from({ length: n + 1 }, (_, k) => Math.exp(lf[n] - lf[k] - lf[n - k] + k * lp + (n - k) * lq));
          const zs = pm.map((_, k) => (k - n * p) / sd), w = 1 / sd;
          const mom = NM.map((_, i) => pm.reduce((s, pk, k) => s + pk * zs[k] ** (i + 1), 0));
          const edges = [], dens = []; for (let k = 0; k <= n; k++) if (Math.abs(zs[k]) < 4.5) { edges.push(zs[k] - w / 2); dens.push(pm[k] / w); }
          if (edges.length) { edges.push(edges[edges.length - 1] + w); L.setView(null, [0, Math.max(0.5, ...dens) * 1.12]); L.hist({ edges, counts: dens, density: dens }, { density: true, color: 'accent', fillAlpha: 0.4, gap: w * 60 > 6 ? 1 : 0 }); }
          L.fn(PHI, { color: 'green', width: 2.4 });
          let cdf = 0, kd = 0; for (let k = 0; k <= n; k++) { const g = PhiN(v.M, zs[k]); kd = Math.max(kd, Math.abs(cdf - g)); cdf += pm[k]; kd = Math.max(kd, Math.abs(cdf - g)); }
          const fmt = (x) => (Math.abs(x) >= 1000 ? x.toExponential(1).replace('e+', 'e') : Math.abs(x) < 5e-4 ? '0' : x.toFixed(Math.abs(x) >= 100 ? 1 : 3)).replace('-', '−');
          TB.draw({
            value: (i, j) => (j === 0 ? fmt(mom[i]) : j === 1 ? String(NM[i]) : fmt(mom[i] - NM[i])),
            fill: (i, j) => (j === 1 ? null : [Math.abs(mom[i] - NM[i]) < 0.05 * Math.max(1, NM[i]) ? 'green' : 'red', 0.18]),
          });
          st = { n, p, kd, m3: mom[2], m4: mom[3] };
          v.legend([['accent', 'law of $Z_n$', { area: true }], ['green', 'normal density']]);
        });
        v.readout(() => st && `$n=${st.n}$, $p=${fr(st.p, 2)}$: $EZ_n^3=${fr(st.m3, 4)}$ $(=(1-2p)/\\sqrt{np(1-p)})$, $EZ_n^4=${fr(st.m4, 4)}$ $(\\to3)$; Kolmogorov distance to $\\Phi$: $${fr(st.kd, 4)}$.`);
      },
    },
  ],
};
