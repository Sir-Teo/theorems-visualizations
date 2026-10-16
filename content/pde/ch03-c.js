// Partial Differential Equations — Chapter 3: The diffusion equation (part c: 3.11–3.15)
import { G, gaussLegendre, cosineCoeffs, convolveQuad } from './ch03.shared.js';

// ---- helpers for 3.11 (heat balls, k = 1, one space dimension) ---------------------------------------------------
const GLA = gaussLegendre(80), GLZ = gaussLegendre(48), A_MAX = 50;
/**
 * Weighted average (1/4r) ∬_{E(x,t;r)} u(y,s) (x−y)²/(t−s)² dy ds over the heat ball E = {(y,s): s < t, Φ(x−y, t−s) ≥ 1/r}
 * (Φ the kernel of u_t = u_xx). Substitution τ = t − s = (r²/4π) e^{−a}. Also returns the running average against depth.
 */
function heatBallAverage(u, x, t, r) {
  const tmax = (r * r) / (4 * Math.PI), nodes = [];
  let tot = 0;
  for (let i = 0; i < GLA.xs.length; i++) {
    const a = (A_MAX * (GLA.xs[i] + 1)) / 2, tau = tmax * Math.exp(-a), dtau = tau * (A_MAX / 2) * GLA.ws[i];
    const Z = Math.sqrt(2 * tau * a);
    let inner = 0;
    for (let j = 0; j < GLZ.xs.length; j++) { const z = Z * GLZ.xs[j]; inner += GLZ.ws[j] * Z * u(x + z, t - tau) * (z * z) / (tau * tau); }
    const w = (inner * dtau) / (4 * r);
    tot += w; nodes.push({ tau, w });
  }
  return { avg: tot, nodes, tmax };
}
/** Half-width of the heat ball at depth τ = t − s: |y − x| ≤ √(2τ ln(r²/(4πτ))). */
const ballZ = (tau, r) => { const q = (r * r) / (4 * Math.PI * tau); return q > 1 ? Math.sqrt(2 * tau * Math.log(q)) : 0; };

// ---- helpers for 3.12 (Tychonoff's series) ----------------------------------------------------------------------
const TM = 256, TKM = 120, TRHO = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.55, 0.7, 0.85];
let tyTables = null;
/** Derivatives g^{(k)}(t), k ≤ K, of g(t) = exp(−t^{−α}) by Cauchy's integral on circles of radius ρt (ρ chosen per k to minimise the bound), with an a-priori rounding-error bound per k. */
function tyDerivs(al, t, K) {
  if (!tyTables) {
    tyTables = { C: new Float64Array(TM * (TKM + 1)), S: new Float64Array(TM * (TKM + 1)) };
    for (let k = 0; k <= TKM; k++) for (let j = 0; j < TM; j++) { const p = (2 * Math.PI * j * k) / TM; tyTables.C[k * TM + j] = Math.cos(p); tyTables.S[k * TM + j] = Math.sin(p); }
  }
  const { C, S } = tyTables;
  const circ = TRHO.map((rho) => {
    const r = rho * t, re = new Float64Array(TM), im = new Float64Array(TM);
    for (let j = 0; j < TM; j++) {
      const ph = (2 * Math.PI * j) / TM, zr = t + r * Math.cos(ph), zi = r * Math.sin(ph);
      const m = Math.hypot(zr, zi), a = Math.atan2(zi, zr), p = Math.pow(m, -al);
      const e = Math.exp(-p * Math.cos(al * a)), w = p * Math.sin(al * a);   // exp(−z^{−α}) = e^{−p cos(αa)} · e^{+i p sin(αa)}
      re[j] = e * Math.cos(w); im[j] = e * Math.sin(w);
    }
    return { r, re, im, mx: Math.exp(-Math.pow((1 + rho) * t, -al)) };
  });
  const d = new Float64Array(K + 2), err = new Float64Array(K + 2);
  let kf = 1;
  for (let k = 0; k <= K + 1; k++) {
    if (k > 0) kf *= k;
    let best = 0, bb = Infinity;
    circ.forEach((c, i) => { const b = c.mx / Math.pow(c.r, k); if (b < bb) { bb = b; best = i; } });
    const c = circ[best]; let s = 0;
    for (let j = 0; j < TM; j++) s += c.re[j] * C[k * TM + j] + c.im[j] * S[k * TM + j];
    d[k] = (kf * s) / TM / Math.pow(c.r, k); err[k] = 1.2e-16 * kf * bb;
  }
  return { d, err, K };
}
/** u(x,t) = Σ_{k≤K} g^{(k)}(t) x^{2k}/(2k)! from precomputed derivatives; returns {u, err (rounding bound + next-term size)}. */
function tyEval(D, x) {
  let s = 0, e = 0, tf = 1, recent = 0;
  for (let k = 0; k <= D.K; k++) {
    if (k > 0) tf *= (x * x) / ((2 * k - 1) * (2 * k));
    const term = D.d[k] * tf; s += term; e += D.err[k] * tf;
    if (k > D.K - 12) recent = Math.max(recent, Math.abs(term));
  }
  const tail = Math.abs(D.d[D.K + 1]) * tf * (x * x) / ((2 * D.K + 1) * (2 * D.K + 2));
  return { u: s, err: e + tail + 12 * recent };   // the last twelve terms must already be negligible
}
const tyOK = (r) => r.err < 1e-4 * Math.max(Math.abs(r.u), 1e-10);

export default {
  collection: 'pde',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Mean-value property on heat balls',
      statement: String.raw`For $u_t=\Delta u$ and $r>0$ define the **heat ball** $E(x,t;r)=\{(y,s):\ s\le t,\ \Phi(x-y,t-s)\ge r^{-n}\}$ ($\Phi$ the heat kernel with $k=1$, $n$ the space dimension; it is a teardrop-shaped region reaching back from $(x,t)$ to the time $t-r^2/(4\pi)$). If $u\in C^2_1$ solves the heat equation in a region containing $E(x,t;r)$, then
$$u(x,t)=\frac1{4r^n}\iint_{E(x,t;r)}u(y,s)\,\frac{|x-y|^2}{(t-s)^2}\,dy\,ds .$$
So the value at the *top* point of a heat ball is a weighted average of the values inside. (For $n=1$, $u(x,t)=\frac1{4r}\iint_{E}u\,\frac{(x-y)^2}{(t-s)^2}\,dy\,ds$.) The weight has total mass $1$, which is why $u\equiv1$ reproduces itself.`,
      idea: String.raw`The proof differentiates the right-hand side $\phi(r)$ with respect to $r$ and shows $\phi'(r)=0$; the computation uses the heat equation twice (once through an integration by parts on the boundary $\partial E$, where $\Phi=r^{-n}$ is constant) and the limit $\phi(r)\to u(x,t)$ as $r\to0$ comes from the weights tending to a point mass. The picture is the heat analogue of the spherical mean value property of harmonic functions (the Laplace case, chapter 5), with spheres replaced by level sets of the backward kernel. Fulks (1966) proved a mean-value theorem for the heat equation in the form of an average over level surfaces of the kernel; the heat-ball version stated here is usually credited to Watson (1973).`,
      caption: String.raw`Drag the gold point (the top of the ball) and change $r$. The orange teardrop is the heat ball $E(x,t;r)$ drawn over the chosen solution (colour = value $u$). The right panel accumulates the weighted average from the top of the ball downward in time (depth $t-s$): it ends at $u(x,t)$ (dashed). The readout compares the two numbers. Switch to *constant 1* (the weights sum to 1) or to $x^3+6xt$ and $e^{-t}\cos x$: always equal. Choose $x^2$, which is **not** a solution ($u_t-u_{xx}=-2$), and the equality fails by an amount that grows with $r$.`,
      deps: ['pde-3.3'],
      refs: ['Evans §2.3'],
      tags: ['mean value property', 'heat ball'],
      credit: 'Fulks, 1966; Watson, 1973 (heat balls)',
      verify: true,
      scope: String.raw`Stated for $u_t=\Delta u$ (diffusivity $k=1$); the attribution of the heat-ball form to Watson and of the earlier level-surface form to Fulks follows secondary sources and has not been checked against the papers.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_equation' },
      viz(v) {
        const M = v.M;
        const sol = v.select('function', [
          { value: 'a', label: '$x^2+2t$' }, { value: 'b', label: '$e^{-t}\\cos x$' }, { value: 'c', label: '$x^3+6xt$' }, { value: 'd', label: '$\\Phi(x,t+2)$' }, { value: 'e', label: '$1$' }, { value: 'f', label: '$x^2$ (not a solution)' },
        ], 'a');
        const rS = v.slider('radius $r$', 0.5, 5, 3, { step: 0.05 });
        const P1 = v.stage({ x: [-4, 4], y: [-0.3, 5], axes: 'box', gutter: true, height: 300, xlabel: 'x', ylabel: 't', title: 'heat ball $E(x,t;r)$ over the solution', minWidth: 330 });
        const P2 = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, xlabel: 'depth $(t-s)\\,4\\pi/r^2$', title: 'weighted average accumulated from the top', minWidth: 300 });
        const hp = P1.handle(0.5, 3.6, { color: 'gold', r: 8, label: 'top', constrain: (x, y) => [M.clamp(x, -2.5, 2.5), M.clamp(y, 0.6, 4.6)] });
        const U = {
          a: (y, s) => y * y + 2 * s, b: (y, s) => Math.exp(-s) * Math.cos(y), c: (y, s) => y * y * y + 6 * y * s,
          d: (y, s) => G(y, s + 2, 1), e: () => 1, f: (y) => y * y,
        };
        let info = null;
        v.render(() => {
          const u = U[sol.value], x0 = hp.x, t0 = hp.y, r = rS.value;
          // colour map of the solution (fixed window, clipped to t >= -1.2)
          let lo = Infinity, hi = -Infinity;
          for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) { const z = u(-4 + (8 * i) / 12, -0.3 + (5.3 * j) / 12); lo = Math.min(lo, z); hi = Math.max(hi, z); }
          if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
          P1.heat((y, s) => u(y, s), { range: [lo, hi], cmap: 'viridis', res: 4, key: sol.value });
                    const tmax = (r * r) / (4 * Math.PI), pts = [];
          for (let i = 0; i <= 120; i++) { const tau = tmax * (i / 120) ** 1.0; pts.push([x0 + ballZ(Math.max(tau, 1e-12), r), t0 - tau]); }
          const left = []; for (let i = 120; i >= 0; i--) { const tau = tmax * (i / 120); left.push([x0 - ballZ(Math.max(tau, 1e-12), r), t0 - tau]); }
          P1.poly(pts.concat(left), { fill: 'orange', fillAlpha: 0.38, color: 'orange', width: 2.4 });
          P1.dot(x0, t0, { color: 'gold', r: 6 });
          const R = heatBallAverage(u, x0, t0, r);
          // accumulate from the top (τ → 0 first)
          const nodes = R.nodes.slice().sort((a, b) => a.tau - b.tau);
          let cum = 0; const curve = [[0, 0]];
          for (const nd of nodes) { cum += nd.w; curve.push([nd.tau / R.tmax, cum]); }
          const ex = u(x0, t0);
          const span = Math.max(Math.abs(ex), Math.abs(R.avg), 1e-6);
          P2.setView([0, 1], [Math.min(0, ex - 0.1 * span) - (ex < 0 ? 0.1 * span : 0), Math.max(ex, R.avg, 0) + 0.15 * span]);
          P2.path(curve.map((p) => [p[0], p[1]]), { color: 'accent', width: 3 });
          P2.hline(ex, { color: 'green', width: 1.6, dash: [6, 4] });
          P2.dot(1, R.avg, { color: 'accent', r: 6 });
          info = { avg: R.avg, ex, diff: R.avg - ex, sol: sol.value, t0, tdeep: t0 - R.tmax };
        });
        v.legend([['orange', 'heat ball $E(x,t;r)$'], ['accent', 'running weighted average'], ['green', '$u(x,t)$', { dash: true }]]);
        v.readout(() => info && `weighted average over the ball $=${v.fix(info.avg, 6)}$ · $u(x,t)=${v.fix(info.ex, 6)}$ · difference $${v.sci(Math.abs(info.diff), 2)}$` + (info.sol === 'f' ? ' — $x^2$ does not solve the heat equation, so the identity fails' : ' (quadrature error only)') + (info.tdeep < 0 ? '\nthe ball reaches below $t=0$: the formula is evaluated with the exact solution continued to negative times (all these solutions exist for $t<0$ in the window shown)' : ''));
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Paradox',
      name: 'Tychonoff’s example: non-uniqueness without growth bounds',
      statement: String.raw`Let $1<\alpha<2$, $g(t)=e^{-t^{-\alpha}}$ for $t>0$, $g(t)=0$ for $t\le0$ ($g\in C^\infty$, all derivatives vanish at $0$), and
$$u(x,t)=\sum_{k=0}^\infty\frac{g^{(k)}(t)}{(2k)!}\,x^{2k}.$$
The series converges for all $x$ and $t$ (because $g$ is of Gevrey class of order $1+1/\alpha<2$), $u$ is $C^\infty$, solves $u_t=u_{xx}$ for all $t$, satisfies $u(x,0)=0$, and is not identically zero. So the Cauchy problem for the heat equation on $\R$ has more than one solution: $u$ and $0$. By the uniqueness theorem for solutions with $|u|\le Ae^{ax^2}$, this $u$ must grow faster than $e^{ax^2}$ for every $a$ as $|x|\to\infty$. Uniqueness on the line therefore needs a growth condition.`,
      idea: String.raw`Formally $u=\cosh(x\sqrt{\partial_t})\,g$: termwise $u_t=\sum g^{(k+1)}x^{2k}/(2k)!$ and $u_{xx}=\sum_{k\ge1}g^{(k)}x^{2k-2}/(2k-2)!$ are the same series, so the equation holds as soon as the series converges nicely. Convergence needs derivative bounds $|g^{(k)}(t)|\lesssim C^k(k!)^{s}$ with $s<2$ (so that $(k!)^s/(2k)!$ is summable against $x^{2k}$); the function $e^{-t^{-\alpha}}$ has $s=1+1/\alpha$, which is why $\alpha>1$. Because $g$ is flat at $t=0$ (every derivative vanishes) the initial values are $0$. Nothing contradicts the maximum principle (3.1): the sup of $u$ over an unbounded strip is not attained. The maximum principle and uniqueness on $\R$ hold only in a class that excludes this growth (compare 3.2 and 3.4).`,
      caption: String.raw`The series is evaluated in double precision, with $g^{(k)}$ computed by Cauchy's integral on circles of radius $\rho t$ ($\rho$ chosen for each $k$). Every value carries a rounding-error bound and a convergence check, and is drawn only if the bound is below $10^{-4}$ of the value (gaps in a curve, or the red dotted line in the middle panel, mark where that fails). Left: $|u(x,t)|$ against $t$ for four values of $x$. For small $x$ the curve dives towards $0$ as $t\to0^+$, like the flat function $g$ (grey, dashed); for larger $x$ the dive starts at smaller $t$ than double precision can follow, and before it the values are orders of magnitude above $1$. Middle: $u(\cdot,t_0)$ against $x$: far from zero. Right: $g$ against $t^2,t^4,t^8$: flatter than any power. The readout checks the equation at $(x_0,t_0)$ in two ways (the termwise identity and central differences). The growth faster than $e^{ax^2}$ in $x$ is forced by the uniqueness theorem; it lies beyond double precision and is not drawn`,
      deps: ['pde-3.2'],
      refs: ['Evans §2.3'],
      tags: ['non-uniqueness', 'Tychonoff', 'growth conditions'],
      credit: 'A. N. Tychonoff, 1935',
      verify: true,
      scope: String.raw`The construction with $g(t)=e^{-t^{-\alpha}}$, $1<\alpha<2$ is the standard textbook form of Tychonoff's example; the exact parameter range in a given textbook was not checked against it. Tychonoff's 1935 paper (Mat. Sb. 42, 199–216) proved uniqueness in classes of exponential growth in $x$ and gave non-uniqueness examples beyond them.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Andrey_Tikhonov_(mathematician)' },
      viz(v) {
        const M = v.M;
        const aS = v.slider('exponent $\\alpha$', 1.2, 1.9, 1.5, { step: 0.05 });
        const x0S = v.slider('probe $x_0$', 0.5, 5, 2, { step: 0.1 });
        const t0S = v.slider('time $t_0$', 0.15, 2, 0.8, { step: 0.01 });
        const P1 = v.stage({ x: [0.05, 2], y: [1e-14, 1e6], xlog: true, ylog: true, axes: 'box', gutter: true, height: 250, xlabel: 't', title: '$|u(x,t)|$ against $t$', minWidth: 260 });
        const P2 = v.stage({ x: [0, 8], y: [-0.3, 2], axes: 'box', gutter: true, height: 250, xlabel: 'x', title: '$u(x,t_0)$', minWidth: 260 });
        const P3 = v.stage({ x: [0.02, 2], y: [1e-30, 2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 250, xlabel: 't', title: '$g(t)=e^{-t^{-\\alpha}}$ against powers', minWidth: 260 });
        let cache = { al: null, ts: null, D: null };
        let info = null;
        v.render(() => {
          const al = aS.value, K = 100;
          if (cache.al !== al) {
            const ts = M.range(60).map((i) => 0.05 * Math.pow(40, i / 59));
            cache = { al, ts, D: ts.map((t) => tyDerivs(al, t, K)) };
          }
          const xs = [0.5, 1, 2, 3], cols = ['accent', 'orange', 'purple', 'teal'];
          xs.forEach((x, i) => {
            const pts = []; cache.ts.forEach((t, j) => { const r = tyEval(cache.D[j], x); if (tyOK(r)) pts.push([t, Math.max(1e-13, Math.abs(r.u))]); else pts.push(null); });
            P1.path(pts, { color: cols[i], width: 2.4 });
          });
          P1.path(cache.ts.map((t) => [t, Math.max(1e-13, Math.exp(-Math.pow(t, -al)))]), { color: 'muted', width: 1.6, dash: [5, 4] });
          const t0 = t0S.value, D0 = tyDerivs(al, t0, K), xg = M.range(161).map((i) => (8 * i) / 160);
          let firstBad = null; const trusted = [];
          for (const x of xg) { const r = tyEval(D0, x); if (tyOK(r) && firstBad === null) trusted.push([x, r.u]); else if (firstBad === null) firstBad = x; }
          const hi = Math.max(1.2, ...trusted.map((p) => p[1])), lo = Math.min(-0.1, ...trusted.map((p) => p[1]));
          P2.setView([0, 8], [lo - 0.1 * (hi - lo), hi + 0.15 * (hi - lo)]);
          P2.hline(0, { color: 'faint', width: 1 });
          P2.path(trusted, { color: 'accent', width: 3 });
          if (firstBad !== null) { P2.vline(firstBad, { color: 'red', width: 1.3, dash: [2, 4] }); P2.text('beyond double precision', Math.min(7.9, firstBad + 0.1), hi * 0.5, { color: 'red', size: 11, align: firstBad > 5 ? 'right' : 'left' }); }
          const ts3 = M.range(80).map((i) => 0.02 * Math.pow(100, i / 79));
          P3.path(ts3.map((t) => [t, Math.max(1e-29, Math.exp(-Math.pow(t, -al)))]), { color: 'ink', width: 2.8 });
          for (const m of [2, 4, 8]) { P3.path(ts3.map((t) => [t, Math.pow(t, m)]), { color: 'muted', width: 1.2, dash: [4, 4] }); }
          [2, 4, 8].forEach((m) => P3.text(`t^${m}`, 0.024, Math.pow(0.02, m) * 4, { color: 'muted', size: 11, align: 'left' }));
          // equation check at (x0, t0): termwise series and central differences of the evaluated u
          const x0 = x0S.value, ru = tyEval(D0, x0);
          const h = 0.01, up = tyEval(tyDerivs(al, t0 + h, K), x0).u, um = tyEval(tyDerivs(al, t0 - h, K), x0).u;
          const ut = (up - um) / (2 * h), uxx = (tyEval(D0, x0 + h).u - 2 * ru.u + tyEval(D0, x0 - h).u) / (h * h);
          let ut2 = 0, uxx2 = 0, tf = 1; for (let k = 0; k <= K; k++) { if (k > 0) tf *= (x0 * x0) / ((2 * k - 1) * (2 * k)); ut2 += D0.d[k + 1] * tf; }
          tf = 1; for (let k = 1; k <= K; k++) { tf = k === 1 ? 1 : tf * (x0 * x0) / ((2 * k - 3) * (2 * k - 2)); uxx2 += D0.d[k] * tf; }
          info = { u: ru.u, ok: tyOK(ru), err: ru.err, ut, uxx, ut2, uxx2, x0, t0 };
        });
        v.legend([['accent', '$x=0.5$'], ['orange', '$x=1$'], ['purple', '$x=2$'], ['teal', '$x=3$'], ['muted', '$g(t)$', { dash: true }]]);
        v.readout(() => info && `$u(x_0,t_0)=${v.sci(info.u, 3)}$ at $(x_0,t_0)=(${v.fix(info.x0, 1)},${v.fix(info.t0, 2)})$${info.ok ? '' : ' (not reliable here)'} — $u\\not\\equiv0$ although $u(\\cdot,0)=0\\ (g^{(k)}(0)=0$ for all $k)$\n` +
          `equation check: termwise $u_t=${v.sci(info.ut2, 4)}$, $u_{xx}=${v.sci(info.uxx2, 4)}$ (the same series) · central differences: $u_t\\approx${v.sci(info.ut, 3)}$, $u_{xx}\\approx${v.sci(info.uxx, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Phenomenon',
      name: 'The backward heat equation is ill posed',
      statement: String.raw`Fix $T>0$ and consider $u_t=ku_{xx}$ on the circle $\mathbb R/2\pi\mathbb Z$. The forward map $S_T:u(\cdot,0)\mapsto u(\cdot,T)$ multiplies the $n$-th Fourier coefficient by $e^{-kn^2T}$. Its inverse (the *backward* problem: find the earlier temperature from today's) multiplies it by $e^{+kn^2T}$, which is unbounded in $n$. Consequently an arbitrarily small change of the final data, e.g. of size $\varepsilon e^{-kn^2T}$ in the mode $n$, changes the recovered initial state by $\varepsilon$, which is $e^{kn^2T}$ times larger than the perturbation of the data. The final state is moreover in $C^\infty$ (3.5), so most smooth-looking data have **no** solution backwards. The backward problem violates Hadamard's stability (1.7).`,
      idea: String.raw`Forward diffusion is a contraction that destroys information: high frequencies are exponentially damped (3.5), so two very different initial states can give final states that differ by less than rounding error. Inverting the map must undo that damping and amplifies any error in the final data by the same factor, $e^{kn^2T}$ in mode $n$. Existence fails too: a final state whose coefficients decay slower than $e^{-kn^2T}$ is not the image of anything. Regularisation, such as truncating at a cutoff $N_c$, trades the amplification $e^{kN_c^2T}$ against the lost modes beyond $N_c$.`,
      caption: String.raw`Left: yesterday's temperature $f_0$ (green) is run forward to today (blue dashed), then white-noise of size $\varepsilon$ is added to each Fourier coefficient (measurement error, or just rounding if $\varepsilon\approx10^{-16}$) and the equation is solved backward with all modes up to the cutoff $N_c$: the red curve is what we recover. Right: the spectrum (log scale). Signal $|c_n|e^{-kn^2T}$ (blue) falls below the noise floor (flat grey line) at $n^*$; beyond it, the backward factor $e^{kn^2T}$ (red dashed, applied to the noise) dominates. Take $N_c<n^*$ to recover a smoothed past; take $N_c>n^*$ and the answer is garbage, even for $\varepsilon=10^{-12}$.`,
      deps: ['pde-3.5', 'pde-1.7'],
      refs: ['Evans §2.3'],
      tags: ['ill-posedness', 'backward heat', 'regularisation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Well-posed_problem' },
      viz(v) {
        const M = v.M, NS = 256, NM = 80, k = 1;
        const dat = v.select('yesterday', [{ value: 'smooth', label: 'smooth bumps' }, { value: 'box', label: 'box (jumps)' }], 'smooth');
        const TS = v.slider('elapsed time $T$', 0.005, 0.3, 0.05, { log: true });
        const eS = v.slider('noise $\\varepsilon$', 1e-15, 1e-2, 1e-10, { log: true, fmt: (z) => z.toExponential(0) });
        const nS = v.slider('cutoff $N_c$', 1, NM, 20, { int: true });
        const P1 = v.stage({ x: [0, 2 * Math.PI], y: [-0.4, 2.6], axes: 'box', gutter: true, height: 260, xlabel: 'x', title: 'yesterday, today, recovered', minWidth: 300 });
        const P2 = v.stage({ x: [0, NM], y: [1e-17, 1e12], ylog: true, axes: 'box', gutter: true, height: 260, xlabel: 'n', title: 'Fourier modes', minWidth: 300 });
        const r = v.rng(5), noise = Array.from({ length: NM + 1 }, () => [r.normal() / Math.SQRT2, r.normal() / Math.SQRT2]);
        const xs = M.range(NS).map((i) => (2 * Math.PI * i) / NS);
        const f0 = { smooth: (x) => Math.exp(2 * (Math.cos(x - 1.6) - 1)) * 2 + 0.9 * Math.exp(4 * (Math.cos(x + 1.9) - 1)), box: (x) => (Math.abs(x - 2) < 0.9 ? 2 : 0.2) };
        const cc = {};
        const coefs = (name) => {
          if (cc[name]) return cc[name];
          const a = new Float64Array(NM + 1), b = new Float64Array(NM + 1);
          for (let n = 0; n <= NM; n++) { let sa = 0, sb = 0; for (let j = 0; j < NS; j++) { sa += f0[name](xs[j]) * Math.cos(n * xs[j]); sb += f0[name](xs[j]) * Math.sin(n * xs[j]); } a[n] = 2 * sa / NS; b[n] = 2 * sb / NS; }
          b[0] = 0; return (cc[name] = { a, b });
        };
        const synth = (a, b, x, nmax, gain = null) => { let s = a[0] / 2; for (let n = 1; n <= nmax; n++) s += (gain ? gain(n) : 1) * (a[n] * Math.cos(n * x) + b[n] * Math.sin(n * x)); return s; };
        let info = null;
        v.render(() => {
          const T = TS.value, eps = eS.value, Nc = nS.value, { a, b } = coefs(dat.value);
          const dmp = (n) => Math.exp(-k * n * n * T);
          // today's data with noise (each coefficient perturbed by eps, random phase)
          const A2 = Array.from(a, (z, n) => z * (n ? dmp(n) : 1) + eps * noise[n][0]), B2 = Array.from(b, (z, n) => z * (n ? dmp(n) : 1) + eps * noise[n][1]);
          const rec = (x) => { let s = A2[0] / 2; for (let n = 1; n <= Nc; n++) { const g = Math.exp(Math.min(600, k * n * n * T)); s += g * (A2[n] * Math.cos(n * x) + B2[n] * Math.sin(n * x)); } return s; };
          P1.fn(f0[dat.value], { color: 'green', width: 2.4, n: 400 });
          P1.fn((x) => synth(A2, B2, x, NM), { color: 'accent', width: 2.4, dash: [6, 4], n: 400 });
          P1.setView([0, 2 * Math.PI], [-0.4, 2.6]);
          P1.clip(() => P1.fn(rec, { color: 'red', width: 2.6, n: 500 }));
          let err = 0; for (const x of xs) err = Math.max(err, Math.abs(rec(x) - f0[dat.value](x)));
          const ns = M.range(NM).map((i) => i + 1), sig = ns.map((n) => Math.max(1e-17, Math.hypot(a[n], b[n]) * dmp(n))), cl = (z) => Math.min(1e11, Math.max(1e-16, z));
          P2.path(ns.map((n) => [n, Math.hypot(a[n], b[n])]).filter((p) => p[1] > 1e-15), { color: 'muted', width: 1.6 });
          P2.path(ns.map((n, i) => [n, sig[i]]).filter((p) => p[1] > 1e-15), { color: 'accent', width: 2.8 });
          P2.hline(eps, { color: 'ink', width: 1.5, alpha: 0.7 });
          P2.path(ns.map((n) => [n, cl(eps * Math.exp(Math.min(600, k * n * n * T)))]), { color: 'red', width: 2.2, dash: [6, 4] });
          P2.vline(Nc, { color: 'gold', width: 1.6 });
          let nstar = NM; for (let i = 0; i < ns.length; i++) if (sig[i] < eps) { nstar = ns[i]; break; }
          P2.vline(nstar, { color: 'green', width: 1.2, dash: [3, 4] });
          info = { err, gain: Math.exp(k * Nc * Nc * T), nstar, Nc, eps, T };
        });
        v.legend([['green', 'yesterday $f_0$'], ['accent', 'today (with noise)', { dash: true }], ['red', 'recovered backwards'], ['muted', '$|c_n|$ (yesterday)'], ['ink', 'noise level $\\varepsilon$']]);
        v.readout(() => info && `largest error of the recovered past: $${v.sci(info.err, 2)}$ · amplification of the top retained mode $e^{kN_c^2T}=${info.gain > 1e15 ? v.sci(info.gain, 2) : v.fix(info.gain, 1)}$ · the signal drops below the noise at $n^*=${info.nstar}$ (green dotted line)${info.Nc > info.nstar ? ' — cutoff beyond $n^*$: the noise is amplified into the answer' : ' — cutoff below $n^*$: stable, but only a smoothed past is recovered'}`);
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Theorem',
      name: 'Conservation of heat and decay',
      statement: String.raw`Let $g\in L^1(\R)\cap L^\infty(\R)$ and $u=\Phi(\cdot,t)*g$. Then for all $t>0$
$$\int_{\R}u(x,t)\,dx=\int_{\R}g\,dx\qquad(\text{conservation of heat}),\qquad \sup_x|u(x,t)|\le\frac{\|g\|_{L^1}}{\sqrt{4\pi kt}}\ \ (\text{decay}),$$
and the solution looks like the kernel at large times: $\sqrt{4\pi kt}\;u(x,t)\to\int g$ uniformly on sets $|x|\le c\sqrt t$ as $t\to\infty$. On an insulated bar $[0,L]$ (Neumann ends) the total heat $\int_0^Lu$ is again constant and $u(x,t)\to\frac1L\int_0^Lg$ uniformly as $t\to\infty$.`,
      idea: String.raw`Fubini and $\int\Phi(x-y,t)\,dx=1$ give $\int u\,dx=\int g\,dy$. The height bound is $\sup\Phi=(4\pi kt)^{-1/2}$ together with $\int|g|$. For the long-time profile, the data look like a point mass $M\delta_0$ seen from the distance $\sqrt{kt}\gg$ the size of the support, so $u\approx M\Phi$. On the bar the eigenfunctions are $\cos(n\pi x/L)$ with eigenvalues $(n\pi/L)^2>0$ for $n\ge1$ and $0$ for $n=0$: every mode except the constant decays, and the constant is the average, which is conserved.`,
      caption: String.raw`Place up to three Gaussian lumps of heat with the gold handles (centre and height; width slider) and watch time $t$ run (log scale). *Line*: the area under $u$ (green curve, middle panel, scaled by the initial area) stays $1$ while the peak falls like $t^{-1/2}$ (right panel, log–log, dashed line = the bound with slope $-\tfrac12$ for the mass $M=\int g$), and the solution tends to a single Gaussian of mass $M$ (dotted, left). *Insulated bar* ($[-4,4]$ with Neumann ends): the area is still conserved but nothing escapes, and the solution flattens to the average (dashed line).`,
      deps: ['pde-3.4'],
      refs: ['Strauss §2.4'],
      tags: ['conservation', 'decay', 'long-time behaviour'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_equation' },
      viz(v) {
        const M = v.M, k = 0.5, L = 8, XR = 4;
        const dom = v.select('domain', [{ value: 'line', label: 'whole line' }, { value: 'bar', label: 'insulated bar' }], 'line');
        const wS = v.slider('lump width $w$', 0.2, 1.2, 0.5, { step: 0.05 });
        const tS = v.slider('time $t$', 0.01, 40, 0.3, { log: true });
        const P1 = v.stage({ x: [-XR - 0.5, XR + 0.5], y: [0, 2.2], axes: 'box', gutter: true, height: 250, xlabel: 'x', title: 'temperature', minWidth: 280 });
        const P2 = v.stage({ x: [0.01, 40], y: [0.01, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 250, xlabel: 't', title: 'total heat and peak', minWidth: 280 });
        const cx = [-2, 0.2, 2.2], ch = [1.5, 0.8, 1.0];
        const hs = cx.map((c, i) => P1.handle(c, ch[i], { color: 'gold', r: 7, label: ['A', 'B', 'C'][i], constrain: (x, y) => [M.clamp(x, -XR + 0.3, XR - 0.3), M.clamp(y, 0, 2)] }));
        let cache = null, info = null;
        const xg = M.range(241).map((i) => -XR - 0.5 + ((2 * XR + 1) * i) / 240);
        v.render(() => {
          const w = wS.value, key = [dom.value, w, ...hs.map((h) => h.x.toFixed(3) + h.y.toFixed(3))].join('|');
          const a = hs.map((h) => h.y), c = hs.map((h) => h.x);
          let M0 = a.reduce((s, z) => s + z * w * Math.sqrt(Math.PI), 0); const xc = a.reduce((s, z, i) => s + z * c[i], 0) / Math.max(1e-9, a.reduce((s, z) => s + z, 0));
          let u;
          if (dom.value === 'line') {
            u = (x, t) => { let s = 0; for (let i = 0; i < 3; i++) { const q = w * w + 4 * k * t; s += (a[i] * w) / Math.sqrt(q) * Math.exp(-((x - c[i]) ** 2) / q); } return s; };
          } else {
            if (!cache || cache.key !== key) {
              const f = (xi) => { const x = -XR + L * 0 + (xi * 2 * XR); let s = 0; for (let i = 0; i < 3; i++) s += a[i] * Math.exp(-(((x - c[i]) / w) ** 2)); return s; };
              cache = { key, co: cosineCoeffs(f, 120, 1600) };
            }
            const co = cache.co; M0 = co[0] * 2 * XR;
            u = (x, t) => { const xi = (x + XR) / (2 * XR); let s = co[0]; for (let n = 1; n <= 120; n++) { const e = Math.exp(-k * ((n * Math.PI) / (2 * XR)) ** 2 * t); if (e < 1e-14) break; s += co[n] * e * Math.cos(n * Math.PI * xi); } return s; };
          }
          const t = tS.value;
          const inside = (x) => dom.value === 'line' || (x >= -XR && x <= XR);
          P1.fn((x) => (inside(x) ? u(x, 1e-6) : NaN), { color: 'faint', width: 2, n: 400 });
          P1.fn((x) => (inside(x) ? u(x, t) : NaN), { color: 'accent', width: 3.2, fill: true, fillAlpha: 0.15, n: 300 });
          if (dom.value === 'line') P1.fn((x) => (M0 / Math.sqrt(4 * Math.PI * k * t)) * Math.exp(-((x - xc) ** 2) / (4 * k * t)), { color: 'orange', width: 1.8, dash: [2, 4] });
          else P1.hline(M0 / (2 * XR), { color: 'green', width: 1.6, dash: [6, 4] });
          const ts = M.range(70).map((i) => 0.01 * Math.pow(4000, i / 69));
          const massAt = (tt) => (dom.value === 'line' ? M.integrate((x) => u(x, tt), -XR - 14 * Math.sqrt(k * tt) - 3, XR + 14 * Math.sqrt(k * tt) + 3, 600) : M.integrate((x) => u(x, tt), -XR, XR, 400));
          const peakAt = (tt) => { let m = 0; for (let x = -XR; x <= XR; x += 0.05) m = Math.max(m, u(x, tt)); return m; };
          const ms = ts.map((tt) => massAt(tt) / M0), pk = ts.map(peakAt);
          P2.path(ts.map((tt, i) => [tt, ms[i]]), { color: 'green', width: 2.8 });
          P2.path(ts.map((tt, i) => [tt, Math.max(1e-4, pk[i])]), { color: 'accent', width: 2.8 });
          P2.path(ts.map((tt) => [tt, M0 / Math.sqrt(4 * Math.PI * k * tt)]), { color: 'orange', width: 1.6, dash: [5, 4] });
          if (dom.value === 'bar') P2.hline(M0 / (2 * XR), { color: 'muted', width: 1.2, dash: [4, 4] });
          P2.vline(t, { color: 'gold', width: 1.2 });
          info = { M0, mass: massAt(t) / M0, peak: peakAt(t), bound: M0 / Math.sqrt(4 * Math.PI * k * t), avg: M0 / (2 * XR), dom: dom.value, dev: (() => { let m = 0; for (let x = -XR; x <= XR; x += 0.1) m = Math.max(m, Math.abs(u(x, t) - M0 / (2 * XR))); return m; })() };
        });
        v.legend([['green', 'total heat / initial'], ['accent', 'peak temperature'], ['orange', '$M/\\sqrt{4\\pi kt}$', { dash: true }]]);
        v.readout(() => info && `initial heat $M=\\int g=${v.fix(info.M0, 3)}$ · heat now / initial $=${v.fix(info.mass, 5)}$ · peak $=${v.fix(info.peak, 4)}$ versus $M/\\sqrt{4\\pi kt}=${v.fix(info.bound, 4)}$ (peak $\\le$ bound ${info.peak <= info.bound * 1.0005 ? '✓' : '✗'})` + (info.dom === 'bar' ? `\naverage temperature $M/L=${v.fix(info.avg, 4)}$ · largest deviation of $u$ from it: $${v.sci(info.dev, 2)}$` : ''));
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Model',
      name: 'Brownian motion behind the heat equation',
      statement: String.raw`Let $B_t$ be standard Brownian motion (independent Gaussian increments, $B_t-B_s\sim N(0,t-s)$) and $X_t=x+\sqrt{2k}\,B_t$. Then $X_t\sim N(x,2kt)$ has density $\Phi(\cdot-x,t)$ and, for bounded continuous $f$,
$$u(x,t)=\mathbb E\,f(x+\sqrt{2k}\,B_t)=\int_{\R}f(y)\,\Phi(y-x,t)\,dy=(\Phi(\cdot,t)*f)(x),$$
which solves $u_t=ku_{xx}$, $u(x,0)=f(x)$. The mean-square displacement is $\mathbb E|X_t-x|^2=2kt$: the diffusivity is the displacement per unit time of a random walker.`,
      idea: String.raw`Many small independent random steps add up (central limit theorem) to a Gaussian whose variance grows linearly in time; the Gaussian density with variance $2kt$ is precisely the heat kernel (3.3). Averaging $f$ over where the walker ends up is therefore the convolution of 3.4. Einstein (1905) derived the diffusion equation for the density of suspended particles from the molecular-kinetic picture and the law that the mean-square displacement grows linearly in $t$; the rigorous construction of Brownian paths came later.`,
      caption: String.raw`Left: independent random walkers (Brownian paths, time horizontal, position vertical) all start at $x=0$; the gold dots are their positions at time $t$. Middle: the histogram of the positions of the first $N$ walkers (blue) against the heat kernel (orange). Right: the Monte-Carlo average $\frac1N\sum f(x+X^{(i)}_t)$ at each $x$ (blue dots) against the exact convolution (curve): the difference shrinks like $1/\sqrt N$. Increase $N$, change $f$ and $k$, or press *resample* to draw fresh paths. The paths are one fixed sample (seeded) until you resample; the recorded variance of the displacement is compared with $2kt$.`,
      deps: ['pde-3.3'],
      refs: ['Strauss ch. 2'],
      tags: ['Brownian motion', 'random walk', 'Monte Carlo'],
      credit: 'A. Einstein, 1905',
      scope: String.raw`The identification of the heat equation with Brownian motion holds for the standard model of independent Gaussian increments (continuous paths); the picture uses $150$ time steps and $2000$ simulated walkers, so every statistic carries sampling error.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Brownian_motion' },
      viz(v) {
        const M = v.M, NP = 2000, NSTEP = 150, TT = 3, dt = TT / NSTEP;
        let seed = 3, Bm = null;
        const gen = () => { const r = v.rng(seed); Bm = new Float32Array(NP * (NSTEP + 1)); for (let i = 0; i < NP; i++) { let b = 0; for (let j = 1; j <= NSTEP; j++) { b += Math.sqrt(dt) * r.normal(); Bm[i * (NSTEP + 1) + j] = b; } } };
        gen();
        const fsel = v.select('function $f$', [{ value: 'box', label: 'box $|x|<1$' }, { value: 'step', label: 'step $x>0$' }, { value: 'cos', label: '$\\cos2x$' }], 'box');
        const kS = v.slider('diffusivity $k$', 0.1, 1.5, 0.5, { step: 0.05 });
        const tS = v.slider('time $t$', 0.05, TT, 1.2, { step: 0.05 });
        const nS = v.slider('walkers $N$', 20, NP, 300, { log: true, int: true });
        v.button('resample', () => { seed += 1; gen(); });
        const P1 = v.stage({ x: [0, TT], y: [-5, 5], axes: 'box', gutter: true, height: 250, xlabel: 't', ylabel: 'position', title: 'Brownian paths $x+\\sqrt{2k}B_t$', minWidth: 260 });
        const P2 = v.stage({ x: [-5, 5], y: [0, 1.2], axes: 'box', gutter: true, height: 250, xlabel: 'x', title: 'positions at time $t$', minWidth: 260 });
        const P3 = v.stage({ x: [-4, 4], y: [-0.2, 1.1], axes: 'box', gutter: true, height: 250, xlabel: 'x', title: '$u(x,t)=\\mathbb E f(x+X_t)$', minWidth: 260 });
        const fs = { box: (x) => (Math.abs(x) < 1 ? 1 : 0), step: (x) => (x > 0 ? 1 : 0), cos: (x) => Math.cos(2 * x) };
        let info = null;
        v.render(() => {
          const k = kS.value, t = tS.value, N = Math.round(nS.value), f = fs[fsel.value], sc = Math.sqrt(2 * k), jt = Math.min(NSTEP, Math.round(t / dt));
          const tt = M.range(jt + 1).map((j) => j * dt);
          for (let i = 0; i < 30; i++) P1.path(tt.map((x, j) => [x, sc * Bm[i * (NSTEP + 1) + j]]), { color: 'accent', width: 1, alpha: 0.45 });
          const pos = new Float64Array(N); for (let i = 0; i < N; i++) pos[i] = sc * Bm[i * (NSTEP + 1) + jt];
          const dots = []; for (let i = 0; i < Math.min(N, 200); i++) dots.push([jt * dt, pos[i]]);
          P1.dots(dots, { color: 'gold', r: 2.4 });
          P1.vline(jt * dt, { color: 'gold', width: 1, dash: [4, 4] });
          const tc = Math.max(jt * dt, 1e-9);
          P1.path(tt.map((x) => [x, 2 * Math.sqrt(2 * k * x)]), { color: 'orange', width: 1.4, dash: [5, 4] }); P1.path(tt.map((x) => [x, -2 * Math.sqrt(2 * k * x)]), { color: 'orange', width: 1.4, dash: [5, 4] });
          P2.hist(Array.from(pos), { bins: 30, range: [-5, 5], density: true, color: 'accent', fillAlpha: 0.35 });
          P2.fn((x) => G(x, tc, k), { color: 'orange', width: 2.8 });
          // Monte Carlo solution
          const xg = M.range(81).map((i) => -4 + (8 * i) / 80), mc = xg.map((x) => { let s = 0; for (let i = 0; i < N; i++) s += f(x + pos[i]); return s / N; });
          const ex = xg.map((x) => convolveQuad(f, -4 - 12 * Math.sqrt(2 * k * tc) - 2, 4 + 12 * Math.sqrt(2 * k * tc) + 2, x, tc, k, 800));
          P3.fn(f, { color: 'faint', width: 2, n: 300 });
          P3.path(xg.map((x, i) => [x, ex[i]]), { color: 'orange', width: 2.8 });
          P3.dots(xg.map((x, i) => [x, mc[i]]), { color: 'accent', r: 2.6 });
          let err = 0, rms = 0; xg.forEach((x, i) => { const e = Math.abs(mc[i] - ex[i]); err = Math.max(err, e); rms += e * e; });
          let m2 = 0; for (let i = 0; i < N; i++) m2 += pos[i] * pos[i];
          info = { err, rms: Math.sqrt(rms / xg.length), N, msd: m2 / N, th: 2 * k * jt * dt, t: jt * dt, bound: 0.5 / Math.sqrt(N) };
        });
        v.legend([['accent', 'Monte Carlo'], ['orange', 'heat kernel / exact convolution'], ['gold', 'walkers at time $t$']]);
        v.readout(() => info && `$N=${info.N}$ walkers at $t=${v.fix(info.t, 2)}$: mean-square displacement $${v.fix(info.msd, 3)}$ versus $2kt=${v.fix(info.th, 3)}$ · Monte-Carlo vs exact convolution: largest error $${v.fix(info.err, 3)}$, rms $${v.fix(info.rms, 3)}$ (a standard error of order $\\sqrt{p(1-p)/N}\\le${v.fix(info.bound, 3)}$ for an indicator $f$)`);
      },
    },
  ],
};
