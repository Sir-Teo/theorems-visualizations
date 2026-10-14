// Rudin, Functional Analysis — Chapter 9: Tauberian theory (part 1: Wiener's theorem)
//
// Numbering of 9.1–9.7 checked against Google Books snippet view of the 2nd edition (1991); items still carry `verify: true`.

// ---------------------------------------------------------------- shared helpers
const sinc = (t) => (Math.abs(t) < 1e-9 ? 1 : Math.sin(t) / t);
/** Kernel samples K(j·dx), j = −J..J, with trapezoid half-weights at the two ends. */
function kernelSamples(K, dx, R) {
  const J = Math.round(R / dx), Kv = new Float64Array(2 * J + 1);
  for (let j = -J; j <= J; j++) Kv[j + J] = K(j * dx) * (Math.abs(j) === J ? 0.5 : 1);
  return { J, Kv, mass: Kv.reduce((s, x) => s + x, 0) * dx };
}
/** (K*φ)(x_i) = ∫ K(y) φ(x_i − y) dy on the grid x_i = x0 + i·dx, i < n (kernel from kernelSamples). */
function convGrid(phi, ks, x0, n, dx) {
  const { J, Kv } = ks, P = new Float64Array(n + 2 * J), out = new Float64Array(n);
  for (let i = 0; i < P.length; i++) P[i] = phi(x0 + (i - J) * dx);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j <= 2 * J; j++) s += Kv[j] * P[i + 2 * J - j]; out[i] = s * dx; }
  return out;
}
/** r[i] = max − min of y over the index window [i, i + w] (monotone deques, right to left). */
function windowRange(y, w) {
  const n = y.length, out = new Float64Array(n), qa = new Int32Array(n), qb = new Int32Array(n);
  let ha = 0, ta = 0, hb = 0, tb = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (ta > ha && y[qa[ta - 1]] <= y[i]) ta--; qa[ta++] = i;
    while (tb > hb && y[qb[tb - 1]] >= y[i]) tb--; qb[tb++] = i;
    while (qa[ha] > i + w) ha++;
    while (qb[hb] > i + w) hb++;
    out[i] = y[qa[ha]] - y[qb[hb]];
  }
  return out;
}
/** Suffix supremum: out[i] = max_{j ≥ i} y[j]. */
function suffixMax(y) { const out = new Float64Array(y.length); let m = -Infinity; for (let i = y.length - 1; i >= 0; i--) { m = Math.max(m, y[i]); out[i] = m; } return out; }
/** Partial sums S(x) = Σ_{1≤k≤x} (−1)^k k^{−1/2}; S(∞) = −η(1/2) = −0.604899… */
const ALT = (() => { const s = [0]; for (let k = 1; k <= 400; k++) s.push(s[k - 1] + (k % 2 ? -1 : 1) / Math.sqrt(k)); return s; })();
const altS = (x) => (x < 1 ? 0 : ALT[Math.min(400, Math.floor(x))]);
const ALT_LIM = -0.6048986434;
/** Solve the symmetric positive definite system G c = b (Cholesky). */
function cholSolve(G, b) {
  const m = b.length, L = G.map((r) => Float64Array.from(r));
  for (let j = 0; j < m; j++) {
    let d = L[j][j]; for (let k = 0; k < j; k++) d -= L[j][k] * L[j][k];
    d = Math.sqrt(Math.max(d, 1e-300)); L[j][j] = d;
    for (let i = j + 1; i < m; i++) { let s = L[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k]; L[i][j] = s / d; }
  }
  const y = new Float64Array(m), c = new Float64Array(m);
  for (let i = 0; i < m; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i][k] * y[k]; y[i] = s / L[i][i]; }
  for (let i = m - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < m; k++) s -= L[k][i] * c[k]; c[i] = s / L[i][i]; }
  return c;
}
const decadeTicks = (lo, hi) => { const out = []; for (let k = Math.ceil(lo); k <= Math.floor(hi); k++) out.push([k, k === 0 ? '1' : k === 1 ? '10' : `1e${k}`]); return out; };

export default {
  book: 'fa',
  chapter: 9,
  title: 'Tauberian Theory',
  summary: String.raw`Wiener's theorem: a closed translation-invariant subspace of $L^1(\R^n)$ whose Fourier transforms have no common zero is all of $L^1$, so the translates of $K$ are dense exactly when $\hat K$ never vanishes. Its Tauberian form says that if one average $K*\varphi$ of a bounded function converges, with $\hat K$ zero-free, then every average $f*\varphi$ converges, and for slowly oscillating $\varphi$ so does $\varphi$ itself. Two applications follow: the prime number theorem, where the zero-free kernel comes from the non-vanishing of $\zeta$ on the line $\Re s=1$, and the asymptotics of the renewal equation.`,
  items: [
    // ------------------------------------------------------------------ 9.2
    {
      num: '9.2',
      kind: 'Lemma',
      name: 'Locally, f̂(t₀) − f̂ is the transform of a small function',
      statement: String.raw`Let $f\in L^1(\R^n)$, $t_0\in\R^n$ and $\eps>0$. Then there is an $h\in L^1(\R^n)$ with $\|h\|_1<\eps$ such that
$$\hat h(t)=\hat f(t_0)-\hat f(t)$$
for every $t$ in some neighbourhood of $t_0$.`,
      idea: String.raw`Multiplying $f$ by a character shifts $\hat f$ (7.2), so one may take $t_0=0$. Fix $g\in L^1$ whose transform is $1$ near $0$ and has compact support, and dilate: $g_\lambda(x)=\lambda^n g(\lambda x)$ has $\hat g_\lambda(t)=\hat g(t/\lambda)$, equal to $1$ on a $\lambda$-neighbourhood of $0$, while $\|g_\lambda\|_1=\|g\|_1$ for every $\lambda$. Put $h_\lambda=\hat f(0)g_\lambda-f*g_\lambda$; its transform is $(\hat f(0)-\hat f)\hat g_\lambda$, as required. Writing $h_\lambda(x)=\int f(y)\,[g_\lambda(x)-g_\lambda(x-y)]\,dy$ gives $\|h_\lambda\|_1\le\int|f(y)|\,\|g-\tau_{\lambda y}g\|_1\,dy$, which tends to $0$ as $\lambda\to0$ by continuity of translation in $L^1$ and dominated convergence.`,
      caption: String.raw`An instance on $\R$ (transforms taken with plain $dx$). Top: drag $t_0$ along $\hat f$. The orange curve is $\hat f(t_0)\hat g_\lambda$, the purple one is $\hat f\,\hat g_\lambda$, and the green gap between them is $\hat h_\lambda$, which equals $\hat f(t_0)-\hat f$ on the inner window $|t-t_0|\le\lambda$. Bottom left: the same three functions on the space side, plotted against $u=\lambda x$ so that areas are $L^1$ norms. $f*g_\lambda$ nearly cancels $\hat f(t_0)g_\lambda$ because $g_\lambda$ is spread over a length $1/\lambda$. Bottom right: shrink $\lambda$ until $\|h_\lambda\|_1<\eps$.`,
      deps: ['fa-7.2', 'fa-7.7'],
      see: ['rca-9.5', 'rca-9.2'],
      tags: ['Wiener', 'Fourier transform', 'L¹'],
      verify: true,
      viz(v) {
        const M = v.M;
        const FS = {
          wig: { label: '$e^{-|x|}(1+\\cos 2x)$', F: (t) => 2 / (1 + t * t) + 1 / (1 + (t - 2) ** 2) + 1 / (1 + (t + 2) ** 2), y: [-0.3, 2.9], t0: 1.3 },
          box: { label: '$\\chi_{[-1,1]}$', F: (t) => 2 * sinc(t), y: [-0.75, 2.45], t0: 2.2 },
        };
        let last = 'wig';
        const which = v.select('$f=$', Object.entries(FS).map(([value, o]) => ({ value, label: o.label })), 'wig');
        const lamS = v.slider('window $\\lambda$', 0.02, 2, 0.4, { log: true, fmt: (x) => v.fmt(x, 2) });
        const epsS = v.slider('$\\varepsilon$', 0.003, 0.3, 0.03, { log: true, fmt: (x) => v.fmt(x, 2) });
        const A = v.stage({ x: [-7.5, 7.5], y: FS.wig.y, height: 250, full: true, xlabel: 't', title: 'frequency side: $\\hat h_\\lambda=\\hat f(t_0)\\hat g_\\lambda-\\hat f\\,\\hat g_\\lambda$' });
        const B = v.stage({ x: [-12, 12], y: [0, 1], height: 230, axes: 'box', title: 'space side, against $u=\\lambda x$ (areas $=L^1$ norms)' });
        const C = v.stage({ x: [-2.15, 0.45], y: [-4, 0.5], height: 230, axes: 'box', xlabel: 'λ', title: '$\\|h_\\lambda\\|_1$ against $\\lambda$ (log–log)' });
        const t0h = A.handle(FS.wig.t0, FS.wig.F(FS.wig.t0), { color: 'blue', label: 't₀', constrain: (x) => { const t = M.clamp(x, -7, 7); return [t, FS[which.value].F(t)]; } });
        // window: 1 on |s| ≤ 1, 0 for |s| ≥ 2, C² quintic in between
        const W = (s) => { const a = Math.abs(s); if (a <= 1) return 1; if (a >= 2) return 0; const u = 2 - a; return u * u * u * (10 - 15 * u + 6 * u * u); };
        const NS = 121, sig = M.linspace(-2, 2, NS), hs = 4 / (NS - 1);
        const wq = sig.map((_, j) => ((j === 0 || j === NS - 1) ? 1 : j % 2 ? 4 : 2) * hs / 3 / M.TAU);
        const NU = 601, U = 60, us = M.linspace(-U, U, NU), du = 2 * U / (NU - 1);
        const CT = new Float64Array(NU * NS), ST = new Float64Array(NU * NS);
        for (let k = 0; k < NU; k++) for (let j = 0; j < NS; j++) { CT[k * NS + j] = Math.cos(us[k] * sig[j]); ST[k * NS + j] = Math.sin(us[k] * sig[j]); }
        // |(1/2π) ∫ A(σ) e^{iuσ} dσ| on the u-grid, A given at the σ-nodes
        const absInv = (Av) => {
          const a = Av.map((x, j) => x * wq[j]), out = new Float64Array(NU);
          for (let k = 0; k < NU; k++) { let re = 0, im = 0; const o = k * NS; for (let j = 0; j < NS; j++) { re += a[j] * CT[o + j]; im += a[j] * ST[o + j]; } out[k] = Math.hypot(re, im); }
          return out;
        };
        const l1 = (arr) => { let s = 0; for (let k = 0; k < NU; k++) s += arr[k] * (k === 0 || k === NU - 1 ? 0.5 : 1); return s * du; };
        const Wv = sig.map(W), gAbs = absInv(Wv), gNorm = l1(gAbs);
        const lams = M.linspace(-2, Math.log10(2.6), 30).map((e) => 10 ** e);
        let curveKey = '', curve = [];
        let st = {};
        v.render(() => {
          const key = which.value, Fo = FS[key], F = Fo.F;
          if (key !== last) { last = key; t0h.x = Fo.t0; A.setView(null, Fo.y); }
          const t0 = t0h.x, c0 = F(t0), lam = lamS.value, eps = epsS.value;
          t0h.y = c0;
          const D = (lm) => sig.map((s, j) => (c0 - F(t0 + lm * s)) * Wv[j]);
          const ck = `${key}|${t0.toFixed(4)}`;
          if (ck !== curveKey) { curveKey = ck; curve = lams.map((lm) => [Math.log10(lm), Math.log10(Math.max(1e-6, l1(absInv(D(lm)))))]); }
          // ---- frequency side
          const Wt = (t) => W((t - t0) / lam);
          A.vband(t0 - 2 * lam, t0 + 2 * lam, { color: 'orange', alpha: 0.05 });
          A.vband(t0 - lam, t0 + lam, { color: 'orange', alpha: 0.1, edges: true });
          A.hline(c0, { color: 'muted', dash: [4, 4], width: 1 });
          A.fn(F, { color: 'blue', width: 1.8 });
          const n = Math.max(120, Math.round(800 * lam));
          A.between((t) => c0 * Wt(t), (t) => F(t) * Wt(t), t0 - 2 * lam, t0 + 2 * lam, { fill: 'green', fillAlpha: 0.45, n });
          A.fn((t) => c0 * Wt(t), { color: 'orange', width: 2.2, domain: [t0 - 2 * lam, t0 + 2 * lam], n });
          A.fn((t) => F(t) * Wt(t), { color: 'purple', width: 2, domain: [t0 - 2 * lam, t0 + 2 * lam], n });
          A.tex('\\hat f', -6.3, F(-6.3), { color: 'blue', dy: -14 });
          A.tex('\\hat f(t_0)', 7.3, c0, { color: 'muted', align: 'right', baseline: c0 > 0.3 ? 'bottom' : 'top', dy: c0 > 0.3 ? -3 : 3, size: 13 });
          // ---- space side (u = λx)
          const fg = absInv(sig.map((s, j) => F(t0 + lam * s) * Wv[j]));
          const hh = absInv(D(lam));
          const top = Math.max(0.05, Math.abs(c0) * gAbs[(NU - 1) / 2], fg[(NU - 1) / 2]) * 1.12;
          B.setView(null, [0, top]);
          const pts = (arr) => { const p = []; for (let k = 0; k < NU; k++) if (Math.abs(us[k]) <= 12.5) p.push([us[k], arr[k]]); return p; };
          const hp = pts(hh);
          B.poly([[hp[0][0], 0], ...hp, [hp[hp.length - 1][0], 0]], { fill: 'green', fillAlpha: 0.45, stroke: false });
          B.path(hp, { color: 'green', width: 1.6 });
          B.path(pts(gAbs.map((x) => Math.abs(c0) * x)), { color: 'orange', width: 2.2 });
          B.path(pts(fg), { color: 'purple', width: 1.8, dash: [6, 4] });
          // ---- norm curve
          const hn = l1(hh), fgn = l1(fg);
          const ys = curve.map((p) => p[1]);
          const lo = Math.min(Math.log10(eps), ...ys) - 0.3, hi = Math.max(Math.log10(eps), ...ys) + 0.3;
          C.setView(null, [lo, hi]);
          C.setTicks([[-2, '0.01'], [-1, '0.1'], [0, '1']], decadeTicks(lo, hi));
          let i = 0; while (i < curve.length && curve[i][1] < Math.log10(eps)) i++;
          const lamEps = i > 0 ? curve[i - 1][0] : null;   // every grid λ up to here has ‖h_λ‖₁ < ε
          if (lamEps != null) C.vband(-2.1, lamEps, { color: 'green', alpha: 0.1 });
          C.hline(Math.log10(eps), { color: 'accent', dash: [6, 4], width: 1.5 });
          C.tex('\\varepsilon', -2, Math.log10(eps), { color: 'accent', align: 'left', baseline: 'bottom', dx: 4, dy: -2, size: 14 });
          C.path(curve, { color: 'green', width: 2.2 });
          C.dot(Math.log10(lam), Math.log10(Math.max(1e-6, hn)), { color: 'orange', r: 5.5 });
          st = { c0, t0, lam, eps, hn, fgn, lamEps, ok: hn < eps };
        });
        v.legend([['blue', '$\\hat f$'], ['orange', '$\\hat f(t_0)\\,g_\\lambda$ (both sides)'], ['purple', '$f*g_\\lambda$ (both sides)'], ['green', '$h_\\lambda$ and $\\hat h_\\lambda$', { area: true }]]);
        v.readout(() => {
          const s = st; if (s.hn == null) return '';
          return `$t_0=${v.fix(s.t0, 2)}$, $\\hat f(t_0)=${v.fix(s.c0, 3)}$. $\\;\\|g_\\lambda\\|_1=${v.fix(gNorm, 3)}$ for every $\\lambda$, $\\;\\|f*g_\\lambda\\|_1=${v.fix(s.fgn, 3)}$, but $\\|h_\\lambda\\|_1=${v.fix(s.hn, 4)}$ ` +
            (s.ok ? `$<\\varepsilon=${v.fix(s.eps, 3)}$: this $h=h_\\lambda$ works, and $\\hat h=\\hat f(t_0)-\\hat f$ on $|t-t_0|\\le\\lambda$.` : `$\\ge\\varepsilon=${v.fix(s.eps, 3)}$` + (s.lamEps != null ? ` — take $\\lambda\\lesssim${v.fix(10 ** s.lamEps, 3)}$.` : ' — shrink $\\lambda$.'));
        });
      },
    },
    // ------------------------------------------------------------------ 9.4
    {
      num: '9.4',
      kind: 'Theorem',
      name: "Wiener's theorem on translation-invariant subspaces",
      statement: String.raw`For $Y\subset L^1(\R^n)$ let $Z(Y)$ be the set of all $t\in\R^n$ at which $\hat f(t)=0$ for **every** $f\in Y$. If $Y$ is a closed subspace of $L^1(\R^n)$ that is invariant under all translations ($f\in Y\Rightarrow\tau_xf\in Y$ for every $x\in\R^n$) and $Z(Y)=\emptyset$, then $Y=L^1(\R^n)$.`,
      idea: String.raw`(i) $Y$ is an ideal: if $f\in Y$ and $g\in L^1$ then $f*g\in Y$. Otherwise Hahn–Banach (3.5) gives $\Lambda\in(L^1)^*=L^\infty$ vanishing on $Y$ with $\Lambda(f*g)\ne0$, yet $\Lambda(f*g)=\int g(y)\,\Lambda(\tau_yf)\,dy=0$.
(ii) Fix $t_0$ and pick $f\in Y$ with $c=\hat f(t_0)\ne0$. Lemma 9.2 gives $h$ with $\|h\|_1<|c|$ and $\hat f=c-\hat h$ near $t_0$, so the Neumann series $u=\sum_k c^{-k-1}h^{*k}*g$ converges for every $g$. If $\hat g$ is supported in that neighbourhood, $\hat u=\hat g/\hat f$ there, and $f*u=g$ lies in $Y$ by (i).
(iii) A partition of unity over the compact support of $\hat g$ puts every $g$ with compactly supported $\hat g$ into $Y$, and such $g$ are dense in $L^1$.
A shorter route goes through 9.3: if a bounded functional on $L^1$ vanishes on $Y$, translation invariance turns it into a bounded $\varphi$ with $f*\varphi=0$ for all $f\in Y$. Then $\operatorname{supp}\hat\varphi\subset Z(Y)=\emptyset$, so $\varphi=0$, and Hahn–Banach gives $Y=L^1$.`,
      caption: String.raw`On $\R$, $Y$ is the closed span of the translates of one or two generators. The top panel shows the least-squares combination of $N$ translates of the generator(s), placed at the gold ticks, approximating a fixed target $g$. Bottom left: $|\hat f|$ of each generator, with the common zeros $Z(Y)$ in red. Bottom right: the $L^1$ error against $N$. When $Z(Y)\ne\emptyset$ the error can never fall below $\sup_{t\in Z(Y)}|\hat g(t)|$ (red floor), because $e^{-it_0x}\in L^\infty$ annihilates $Y$. The last option uses two generators, each with zeros, whose zeros do not overlap. Then $Z(Y)=\emptyset$ and the error goes to $0$.`,
      deps: ['fa-9.2', 'fa-9.3', 'fa-3.5', 'fa-7.2'],
      see: ['rca-9.16', 'rca-9.21', 'rca-18.21'],
      tags: ['Wiener', 'ideals', 'translation invariance'],
      verify: true,
      viz(v) {
        const M = v.M;
        const NX = 561, xs = M.linspace(-7, 7, NX), dx = 14 / (NX - 1);
        const g = (x) => (1 + x) * Math.exp(-2 * x * x);
        const gv = Float64Array.from(xs, g);
        const gNorm = gv.reduce((s, y) => s + Math.abs(y), 0) * dx;
        const ghat = (t) => { let re = 0, im = 0; for (let i = 0; i < NX; i++) { re += gv[i] * Math.cos(t * xs[i]); im -= gv[i] * Math.sin(t * xs[i]); } return Math.hypot(re, im) * dx; };
        const s3 = Math.sqrt(Math.PI / 3);
        const fOdd = (x) => x * Math.exp(-3 * x * x), fHat = (x) => (1 - 9 * x * x) * Math.exp(-3 * x * x);
        const hOdd = (t) => s3 * Math.abs(t) / 6 * Math.exp(-t * t / 12), hHat = (t) => s3 * Math.abs(t * t / 4 - 0.5) * Math.exp(-t * t / 12);
        const GEN = {
          gauss: { label: '$e^{-3x^2}$', fs: [(x) => Math.exp(-3 * x * x)], ft: [(t) => s3 * Math.exp(-t * t / 12)], Z: [], zl: '\\emptyset' },
          box: { label: '$\\chi_{[-1,1]}$', fs: [(x) => (Math.abs(x) <= 1 ? 1 : 0)], ft: [(t) => 2 * Math.abs(sinc(t))], Z: [-2, -1, 1, 2].map((k) => k * Math.PI), zl: '\\pi\\Z\\setminus\\{0\\}' },
          odd: { label: '$xe^{-3x^2}$', fs: [fOdd], ft: [hOdd], Z: [0], zl: '\\{0\\}' },
          hat: { label: '$(1-9x^2)e^{-3x^2}$', fs: [fHat], ft: [hHat], Z: [-Math.SQRT2, Math.SQRT2], zl: '\\{\\pm\\sqrt2\\}' },
          pair: { label: 'both of the last two', fs: [fOdd, fHat], ft: [hOdd, hHat], Z: [], zl: '\\{0\\}\\cap\\{\\pm\\sqrt2\\}=\\emptyset' },
        };
        const which = v.select('generators', Object.entries(GEN).map(([value, o]) => ({ value, label: o.label })), 'box');
        const nS = v.slider('translates per generator $N$', 1, 40, 12, { int: true });
        const A = v.stage({ x: [-4, 4], y: [-0.35, 1.35], height: 250, full: true, xlabel: 'x', title: 'target $g$ and its best combination of $N$ translates' });
        const B = v.stage({ x: [-8, 8], y: [-0.08, 1.12], height: 220, xlabel: 't', title: '$|\\hat f|$ and $|\\hat g|$ (each scaled to max 1)' });
        const C = v.stage({ x: [0, 42.5], y: [-4, 0.3], height: 220, axes: 'box', xlabel: 'N', title: '$L^1$ error $\\|g-\\sum_k c_k\\tau_{a_k}f\\|_1$ (log scale)' });
        const pos = (N) => M.range(N).map((k) => -3 + 6 * (k + 0.5) / N);
        function fit(fs, N) {
          const cols = [];
          for (const f of fs) for (const a of pos(N)) cols.push(Float64Array.from(xs, (x) => f(x - a)));
          const m = cols.length, G = M.range(m).map(() => new Float64Array(m)), b = new Float64Array(m);
          let mx = 0;
          for (let i = 0; i < m; i++) {
            for (let j = 0; j <= i; j++) { let s = 0; const ci = cols[i], cj = cols[j]; for (let k = 0; k < NX; k++) s += ci[k] * cj[k]; G[i][j] = G[j][i] = s * dx; }
            let s = 0; for (let k = 0; k < NX; k++) s += cols[i][k] * gv[k]; b[i] = s * dx; mx = Math.max(mx, G[i][i]);
          }
          for (let i = 0; i < m; i++) G[i][i] += 1e-11 * mx;
          const c = cholSolve(G, b), ap = new Float64Array(NX);
          for (let i = 0; i < m; i++) for (let k = 0; k < NX; k++) ap[k] += c[i] * cols[i][k];
          let e = 0; for (let k = 0; k < NX; k++) e += Math.abs(gv[k] - ap[k]);
          return { ap, err: e * dx };
        }
        const cache = {};
        function errCurve(key) {
          if (!cache[key]) cache[key] = M.range(40, 1).map((N) => [N, Math.log10(Math.max(1e-5, fit(GEN[key].fs, N).err))]);
          return cache[key];
        }
        const gmax = Math.max(...M.linspace(0, 8, 161).map(ghat));
        let st = {};
        v.render(() => {
          const key = which.value, Gn = GEN[key], N = nS.value;
          const { ap, err } = fit(Gn.fs, N);
          const floor = Gn.Z.length ? Math.max(...Gn.Z.map(ghat)) : 0;
          // ---- top: target and approximant
          A.between((x) => g(x), (x) => { const i = Math.round((x + 7) / dx); return ap[M.clamp(i, 0, NX - 1)]; }, -4, 4, { fill: 'red', fillAlpha: 0.16, n: 320 });
          A.fn(g, { color: 'ink', width: 2.4 });
          A.path(xs.map((x, i) => [x, ap[i]]), { color: 'accent', width: 2.2 });
          for (const a of pos(N)) A.line(a, -0.35, a, -0.27, { color: 'gold', width: 2 });
          A.tex('g', -0.62, g(-0.62) + 0.13, { color: 'ink' });
          // ---- transforms
          const tcol = ['purple', 'teal'];
          Gn.ft.forEach((F, i) => { const mx = Math.max(...M.linspace(0, 8, 161).map(F)); B.fn((t) => F(t) / mx, { color: tcol[i], width: 2.2 }); });
          B.fn((t) => ghat(t) / gmax, { color: 'ink', width: 1.6, dash: [5, 4], n: 260 });
          Gn.ft.forEach((F, i) => { const mx = Math.max(...M.linspace(0, 8, 161).map(F)); for (let t = -8; t <= 8.001; t += 0.01) { /* zeros of this generator */ if (F(t) / mx < 0.004 && F(t) <= F(t - 0.01) && F(t) <= F(t + 0.01)) B.dot(t, 0, { color: tcol[i], r: 3.5 }); } });
          for (const z of Gn.Z) B.dot(z, 0, { color: 'red', r: 6, hollow: true, width: 2.4 });
          B.corner(`Z(Y) = ${Gn.Z.length ? (key === 'box' ? 'πℤ \\ {0}' : key === 'odd' ? '{0}' : '{±√2}') : '∅'}`, 'tr', { color: Gn.Z.length ? 'red' : 'green', weight: 600 });
          // ---- error curve
          const curve = errCurve(key);
          const lo = Math.min(...curve.map((p) => p[1]), floor > 0 ? Math.log10(floor) : 0) - 0.45, hi = Math.max(...curve.map((p) => p[1]), Math.log10(gNorm)) + 0.15;
          C.setView(null, [lo, hi]);
          C.setTicks(null, decadeTicks(lo, hi));
          C.hline(Math.log10(gNorm), { color: 'muted', dash: [3, 4], width: 1 });
          C.tex('\\|g\\|_1', 42.3, Math.log10(gNorm), { color: 'muted', align: 'right', baseline: 'top', dy: 3, size: 13 });
          if (floor > 0) { C.hband(lo - 1, Math.log10(floor), { color: 'red', alpha: 0.08 }); C.hline(Math.log10(floor), { color: 'red', width: 1.8, dash: [6, 4] }); C.tex('\\sup_{Z(Y)}|\\hat g|', 1.2, Math.log10(floor), { color: 'red', align: 'left', baseline: 'top', dy: 4, size: 13 }); }
          C.path(curve, { color: 'accent', width: 2 });
          C.dots(curve, { color: 'accent', r: 2 });
          C.dot(N, Math.log10(Math.max(1e-5, err)), { color: 'gold', r: 6 });
          st = { key, N, err, floor, zl: Gn.zl };
        });
        v.legend([['ink', 'target $g$'], ['accent', '$\\sum_k c_k\\tau_{a_k}f$ (least squares)'], ['red', 'error region', { area: true }], ['purple', '$|\\hat f|$ (generators)'], ['red', 'common zeros $Z(Y)$', { dot: true }]]);
        v.readout(() => {
          const s = st; if (s.err == null) return '';
          const head = `$Z(Y)=${s.zl}$. With $N=${s.N}$: $\\|g-\\sum c_k\\tau_{a_k}f\\|_1=${v.fix(s.err, 4)}$`;
          if (s.floor > 0) return `${head} $\\ge\\sup_{t\\in Z(Y)}|\\hat g(t)|=${v.fix(s.floor, 4)}$ — every $h\\in Y$ has $\\hat h=0$ on $Z(Y)$, so $\\|g-h\\|_1\\ge|\\hat g(t_0)|$ and $Y\\ne L^1$.`;
          return `${head}. No common zero, so by Wiener's theorem $Y=L^1(\\R)$ and the error tends to $0$ as $N\\to\\infty$ (here until the floating-point floor).`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.5
    {
      num: '9.5',
      kind: 'Theorem',
      name: 'Translates of K are dense iff K̂ has no zero',
      statement: String.raw`Suppose $K\in L^1(\R^n)$ and $Y$ is the smallest closed translation-invariant subspace of $L^1(\R^n)$ that contains $K$, the closed span of the translates of $K$. Then
$$Y=L^1(\R^n)\quad\text{if and only if}\quad\hat K(t)\ne0\ \text{for every }t\in\R^n .$$`,
      idea: String.raw`Every element of $Y$ is a limit of combinations $\sum c_jK(x-s_j)$, whose transforms are $\hat K(t)\sum c_je^{-is_j\cdot t}$. So $Z(Y)$ is exactly the zero set of $\hat K$. If that set is empty, Theorem 9.4 gives $Y=L^1$. If $\hat K(t_0)=0$, every $h\in Y$ has $\hat h(t_0)=0$, while the Gaussian $g$ has $\hat g(t_0)\ne0$; since $|\hat g(t_0)-\hat h(t_0)|\le\norm{g-h}_1$, $g$ stays at distance at least $|\hat g(t_0)|$ from $Y$. Dually, the bounded function $e^{it_0\cdot x}$ annihilates every translate of $K$: $K*e^{it_0\cdot x}=\hat K(t_0)e^{it_0\cdot x}=0$.`,
      caption: String.raw`The duality behind 9.5, on $\R$. Choose a kernel $K$ and a bounded $\varphi$. Top: $\varphi$ and the normalised averages $(K*\varphi)/\hat K(0)$ and $(f*\varphi)/\hat f(0)$, where $f$ is a narrow Gaussian. Bottom: $\hat K$, $\hat f$ and the frequencies in $\varphi-1$ (gold). For the tone $\varphi=1+\sin\omega x$, $K*\varphi=\hat K(0)+\operatorname{Im}(\hat K(\omega)e^{i\omega x})$. Press the button to put $\omega$ in $Z(K)$: the tone vanishes from every translate's average. Then $\sin\omega x$ is a nonzero bounded function orthogonal to all translates of $K$, so they are not dense. The Gaussian and $\frac12e^{-|x|}$ have no zeros, no tone is invisible to them, and their translates are dense. For the chirp, every average converges; that is Wiener's Tauberian theorem 9.7.`,
      deps: ['fa-9.4', 'fa-7.2'],
      see: ['rca-9.16'],
      tags: ['Wiener', 'Tauberian', 'convolution'],
      verify: true,
      viz(v) {
        const M = v.M;
        const dx = 0.025, X0 = 0, X1 = 80, NO = Math.round((X1 - X0) / dx) + 1;
        const lowK = (x) => M.integrate((t) => (1 - t * t) ** 3 * Math.cos(x * t), 0, 1, 120) / Math.PI;
        const KS = {
          gauss: { label: 'Gaussian', K: (x) => Math.exp(-x * x) / Math.sqrt(Math.PI), Kh: (t) => Math.exp(-t * t / 4), R: 5, zero: null },
          exp: { label: '$\\frac12e^{-|x|}$', K: (x) => 0.5 * Math.exp(-Math.abs(x)), Kh: (t) => 1 / (1 + t * t), R: 22, zero: null },
          box: { label: '$\\frac12\\chi_{[-1,1]}$', K: (x) => (Math.abs(x) <= 1 + 1e-9 ? 0.5 : 0), Kh: sinc, R: 1, zero: Math.PI },
          low: { label: 'low-pass', K: lowK, Kh: (t) => Math.max(0, 1 - t * t) ** 3, R: 40, zero: 1.6 },
        };
        const sf = 0.3, fK = (x) => Math.exp(-x * x / (2 * sf * sf)) / (sf * Math.sqrt(M.TAU)), fh = (t) => Math.exp(-sf * sf * t * t / 2);
        const PH = {
          tone: { label: 'tone $1+\\sin\\omega x$', f: (w) => (x) => 1 + Math.sin(w * x), tones: [1] },
          chirp: { label: 'chirp $1+\\sin\\frac{x^2}{8}$', f: () => (x) => 1 + Math.sin(x * x / 8), tones: [], chirp: 1 },
          mix: { label: 'tone + chirp', f: (w) => (x) => 1 + 0.5 * Math.sin(w * x) + 0.5 * Math.sin(x * x / 8), tones: [0.5], chirp: 0.5 },
        };
        const kS = v.select('kernel $K$', Object.entries(KS).map(([value, o]) => ({ value, label: o.label })), 'box');
        const pS = v.select('$\\varphi$', Object.entries(PH).map(([value, o]) => ({ value, label: o.label })), 'tone');
        const wS = v.slider('$\\omega$', 0.2, 5, Math.PI, { step: 0.01 });
        let snapped = Math.PI;
        const snapB = v.button('put $\\omega$ in $Z(K)$', () => { const z = KS[kS.value].zero; if (z != null) { snapped = z; wS.set(z); } });
        const A = v.stage({ x: [X0, X1], y: [-0.25, 2.35], height: 270, full: true, axes: 'box', xlabel: 'x', title: 'normalised averages of $\\varphi$' });
        const B = v.stage({ x: [0, 6], y: [-0.3, 1.12], height: 190, full: true, axes: 'box', xlabel: 't', title: 'transforms $\\hat K/\\hat K(0)$, $\\hat f/\\hat f(0)$ and the spectrum of $\\varphi-1$' });
        const kcache = {}, ks = (key) => (kcache[key] ||= kernelSamples(KS[key].K, dx, KS[key].R));
        const fks = kernelSamples(fK, dx, 1.6);
        let ck = '', res = null, st = {};
        v.render(() => {
          const Ko = KS[kS.value], Po = PH[pS.value];
          const w = snapped != null && Math.abs(wS.value - snapped) < 0.006 ? snapped : wS.value;
          if (snapped != null && w !== snapped) snapped = null;
          wS.el.hidden = !Po.tones.length; snapB.hidden = !Po.tones.length || Ko.zero == null;
          const key = `${kS.value}|${pS.value}|${Po.tones.length ? w : 0}`;
          if (key !== ck) {
            ck = key;
            const phi = Po.f(w), kk = ks(kS.value);
            const Kc = convGrid(phi, kk, X0, NO, dx).map((y) => y / kk.mass), Fc = convGrid(phi, fks, X0, NO, dx).map((y) => y / fks.mass);
            const tail = (arr) => { let lo = Infinity, hi = -Infinity; for (let i = Math.round(60 / dx); i < NO; i++) { lo = Math.min(lo, arr[i]); hi = Math.max(hi, arr[i]); } return [lo, hi]; };
            res = { phi, Kc, Fc, kt: tail(Kc), ft: tail(Fc) };
          }
          A.vband(60, 80, { color: 'gray', alpha: 0.08 });
          A.text('tail window', 70, 2.22, { align: 'center', color: 'muted', size: 11 });
          A.fn(res.phi, { color: 'faint', width: 1, n: 3200 });
          A.hline(1, { color: 'green', dash: [6, 4], width: 1.4 });
          A.path(Array.from(res.Fc, (y, i) => [X0 + i * dx, y]), { color: 'purple', width: 1.8 });
          A.path(Array.from(res.Kc, (y, i) => [X0 + i * dx, y]), { color: 'blue', width: 2.4 });
          // ---- frequency panel
          if (Ko.zero != null) {
            if (kS.value === 'low') B.vband(1, 6, { color: 'red', alpha: 0.08 });
            else for (let k = 1; k * Math.PI < 6; k++) B.dot(k * Math.PI, 0, { color: 'red', r: 5, hollow: true, width: 2 });
          }
          B.fn(fh, { color: 'purple', width: 2 });
          B.fn(Ko.Kh, { color: 'blue', width: 2.4, n: 400 });
          for (const amp of Po.tones) {
            B.line(w, 0, w, amp, { color: 'gold', width: 4 });
            B.dot(w, amp, { color: 'gold', r: 4 });
            B.tex('\\omega', w, amp, { color: 'gold', align: 'left', dx: 7, size: 15 });
            B.dot(w, Ko.Kh(w), { color: 'blue', r: 4.5 });
          }
          if (Po.chirp) { B.arrow(4.6, 0.82, 5.85, 0.82, { color: 'gold', width: 3, head: 10 }); B.text('chirp frequency x/4 → ∞', 5.85, 0.95, { align: 'right', color: 'gold', size: 11.5 }); }
          B.text(kS.value === 'low' ? 'Z(K) = {|t| ≥ 1}' : Ko.zero != null ? 'Z(K) = πℤ \\ {0}' : 'Z(K) = ∅', 5.9, 0.62, { align: 'right', color: Ko.zero != null ? 'red' : 'green', size: 12, weight: 600 });
          st = { kt: res.kt, ft: res.ft, w, Kw: Ko.Kh(w), tones: Po.tones.length, zeroFree: Ko.zero == null };
        });
        v.legend([['faint', '$\\varphi$'], ['blue', '$(K*\\varphi)/\\hat K(0)$ and $\\hat K/\\hat K(0)$'], ['purple', '$(f*\\varphi)/\\hat f(0)$ and $\\hat f/\\hat f(0)$'], ['gold', 'spectrum of $\\varphi-1$'], ['green', 'the limit $a=1$', { dash: true }]]);
        v.readout(() => {
          const s = st; if (!s.kt) return '';
          const osc = (r) => r[1] - r[0];
          const Kok = osc(s.kt) < 0.01, Fok = osc(s.ft) < 0.01;
          const rng = (r) => `[${v.fix(r[0], 3)},\\,${v.fix(r[1], 3)}]`;
          let msg = `On the tail $60\\le x\\le80$: $\\;(K*\\varphi)/\\hat K(0)\\in${rng(s.kt)}$, $\\;(f*\\varphi)/\\hat f(0)\\in${rng(s.ft)}$`;
          if (s.tones) msg += `; $\\;|\\hat K(\\omega)|/\\hat K(0)=${v.fix(Math.abs(s.Kw), 4)}$`;
          msg += '. ';
          if (Kok && Fok) msg += s.zeroFree ? '$\\hat K$ has no zero, so the translates of $K$ are dense, and here every average converges (9.7).' : 'Both averages converge here, although $\\hat K$ has zeros.';
          else if (Kok && !Fok) msg += 'The tone is invisible to $K$ (it converges) but not to $f$: $\\hat K(\\omega)=0$, so $\\sin\\omega x$ annihilates every translate of $K$, and those translates are not dense in $L^1$.';
          else msg += '$K*\\varphi$ does not converge, so the theorem makes no prediction.';
          return msg;
        });
      },
    },
    // ------------------------------------------------------------------ 9.6
    {
      num: '9.6',
      kind: 'Definition',
      name: 'Slowly oscillating function',
      statement: String.raw`A function $\varphi$ on $\R$ is **slowly oscillating** (at $+\infty$) if for every $\eps>0$ there exist $A$ and $\delta>0$ such that
$$|\varphi(s)-\varphi(t)|<\eps\qquad\text{whenever } s>A,\ t>A,\ |s-t|<\delta;$$
equivalently, $\varphi(s)-\varphi(t)\to0$ as $s,t\to+\infty$ with $s-t\to0$.`,
      idea: String.raw`The condition is uniform continuity at infinity and nothing more. Jumps are allowed if they shrink, and convergence is not required: $\sin x$ and $\sin2\sqrt x$ qualify. What it rules out is oscillation on ever shorter scales, like $\sin(x^2)$. It is exactly what lets one recover $\varphi(x)$ from its short averages $\frac1\delta\int_{x-\delta}^x\varphi$, which is how it enters the Tauberian theorem 9.7.`,
      caption: String.raw`Top: $\varphi$, the threshold $A$ (drag it), and the worst pair $s,t>A$ with $|s-t|<\delta$ (gold). Bottom: the oscillation $\omega(A,\delta)=\sup\{|\varphi(s)-\varphi(t)|:s,t>A,\ |s-t|<\delta\}$ over the $(A,\delta)$ plane, green where it is below $\eps$. Drag the dot there too. $\varphi$ is slowly oscillating iff the green region is non-empty for every $\eps>0$. For $\sin(x^2/4)$ and $(-1)^{\lfloor x\rfloor}$ it is empty for every $\eps<2$.`,
      deps: [],
      tags: ['Tauberian', 'oscillation'],
      verify: true,
      viz(v) {
        const M = v.M;
        const EX = {
          sqrt: { label: '$\\sin2\\sqrt x$', f: (x) => Math.sin(2 * Math.sqrt(Math.max(0, x))), so: true, lim: false },
          sin: { label: '$\\sin x$', f: Math.sin, so: true, lim: false },
          alt: { label: '$\\sum_{k\\le x}\\frac{(-1)^k}{\\sqrt k}+c$', f: (x) => altS(x) - ALT_LIM, so: true, lim: true },
          chirp: { label: '$\\sin\\frac{x^2}{4}$', f: (x) => Math.sin(x * x / 4), so: false, lim: false, inf: 2 },
          flip: { label: '$(-1)^{\\lfloor x\\rfloor}$', f: (x) => (Math.floor(x) % 2 === 0 ? 1 : -1), so: false, lim: false },
        };
        const which = v.select('$\\varphi=$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'sqrt');
        const epsS = v.slider('$\\varepsilon$', 0.02, 1.5, 0.25, { step: 0.01 });
        const A = v.stage({ x: [0, 60], y: [-1.45, 1.45], height: 240, full: true, axes: 'box', xlabel: 'x', title: '$\\varphi$ and the worst pair beyond $A$' });
        const LD = [Math.log10(0.02), Math.log10(4)];
        const B = v.stage({ x: [0, 50], y: LD, height: 230, full: true, axes: 'box', xlabel: 'A', title: 'the oscillation $\\omega(A,\\delta)$; green where $\\omega<\\varepsilon$',
          ylabel: 'δ', yticks: [[Math.log10(0.05), '0.05'], [-1, '0.1'], [Math.log10(0.5), '0.5'], [0, '1'], [Math.log10(2), '2']] });
        const hA = A.handle(12, -1.3, { color: 'accent', label: 'A', constrain: (x) => [M.clamp(x, 0, 50), -1.3] });
        const hB = B.handle(12, Math.log10(0.6), { color: 'ink', constrain: (x, y) => [M.clamp(x, 0, 50), M.clamp(y, LD[0], LD[1])] });
        hA.onDrag = () => { hB.x = hA.x; };
        hB.onDrag = () => { hA.x = hB.x; };
        const dx = 0.01, XE = 120, NX = Math.round(XE / dx) + 1;
        const ND = 40, dls = M.linspace(LD[0], LD[1], ND), AG = 0.5, NA = 101;
        const tables = {};
        function table(key) {
          if (tables[key]) return tables[key];
          const f = EX[key].f, y = new Float64Array(NX);
          for (let i = 0; i < NX; i++) y[i] = f(i * dx);
          const T = dls.map((ld) => {
            const w = Math.max(1, Math.round(10 ** ld / dx));
            const r = windowRange(y, w);
            for (let i = NX - w; i < NX; i++) r[i] = 0;          // windows must fit inside [0, XE]
            const sm = suffixMax(r);
            return { w, r, row: Float64Array.from(M.range(NA), (k) => (EX[key].inf ?? sm[Math.round(k * AG / dx)])) };
          });
          return (tables[key] = { y, T });
        }
        const look = (T, Av, ld) => { const j = M.clamp(Math.round((ld - LD[0]) / (LD[1] - LD[0]) * (ND - 1)), 0, ND - 1); return T[j].row[M.clamp(Math.round(Av / AG), 0, NA - 1)]; };
        const G = v.rgb('green'), R = v.rgb('red');
        let st = {};
        v.render(() => {
          const key = which.value, E = EX[key], eps = epsS.value, { y, T } = table(key);
          const Av = hB.x, jd = M.clamp(Math.round((hB.y - LD[0]) / (LD[1] - LD[0]) * (ND - 1)), 0, ND - 1), ld = dls[jd], del = 10 ** ld;
          hA.x = Av;
          // ---- bottom: (A, δ) plane
          B.raster((a, l) => { const o = look(T, a, l); return o < eps ? [G[0], G[1], G[2], 125] : [R[0], R[1], R[2], Math.round(40 + 110 * Math.min(1, o / 2))]; }, { key: `${key}|${eps}`, res: 3 });
          B.axes();
          const om = look(T, Av, ld);
          B.dot(Av, ld, { color: om < eps ? 'green' : 'red', r: 4 });
          B.corner(om < eps ? `ω(A, δ) = ${v.fmt(om, 3)} < ε` : `ω(A, δ) = ${v.fmt(om, 3)} ≥ ε`, 'tr', { color: om < eps ? 'green' : 'red', weight: 600 });
          // ---- top: φ, region beyond A, worst pair in view
          A.vband(Av, 60, { color: 'accent', alpha: 0.06 });
          A.vline(Av, { color: 'accent', width: 1.2, dash: [4, 4] });
          A.hline(0, { color: 'grid', width: 1 });
          A.fn(E.f, { color: 'ink', width: 1.6, n: 3000 });
          // worst window [s, s+δ] with A ≤ s, s + δ ≤ 60 (visible part)
          const { w, r } = T[jd], i0 = Math.round(Av / dx), i1 = Math.round(60 / dx) - w;
          let best = -1, bi = i0;
          for (let i = i0; i <= i1; i++) if (r[i] > best + 1e-12) { best = r[i]; bi = i; }
          let im = bi, iM = bi; for (let k = bi; k <= bi + w; k++) { if (y[k] < y[im]) im = k; if (y[k] > y[iM]) iM = k; }
          A.vband(bi * dx, (bi + w) * dx, { color: 'gold', alpha: 0.25 });
          A.line(im * dx, y[im], iM * dx, y[iM], { color: 'gold', width: 2 });
          A.dot(im * dx, y[im], { color: 'gold', r: 4.5 }); A.dot(iM * dx, y[iM], { color: 'gold', r: 4.5 });
          if (E.inf) A.corner('true sup = 2: the frequency x/2 grows without bound', 'tr', { color: 'red', weight: 600 });
          st = { key, eps, om, del, Av, E, inView: best };
        });
        v.legend([['ink', '$\\varphi$'], ['accent', '$x>A$', { area: true }], ['gold', 'worst pair, $|s-t|<\\delta$'], ['green', '$\\omega(A,\\delta)<\\varepsilon$', { area: true }], ['red', '$\\omega(A,\\delta)\\ge\\varepsilon$', { area: true }]]);
        v.readout(() => {
          const s = st; if (!s.E) return '';
          const verdict = s.E.so ? `This $\\varphi$ **is** slowly oscillating${s.E.lim ? ' (and converges)' : ', although it has no limit'}.` : 'This $\\varphi$ is **not** slowly oscillating: $\\omega(A,\\delta)=2$ for all $A$ and $\\delta$.';
          return `$A=${v.fix(s.Av, 1)}$, $\\delta=${v.fix(s.del, 3)}$: $\\;\\omega(A,\\delta)=${v.fix(s.om, 3)} ${s.om < s.eps ? '<' : '\\ge'} \\varepsilon=${v.fix(s.eps, 2)}$. ${verdict}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.7
    {
      num: '9.7',
      kind: 'Theorem',
      name: "Wiener's Tauberian theorem",
      statement: String.raw`Suppose $\varphi\in L^\infty(\R^n)$, $K\in L^1(\R^n)$, $\hat K(t)\ne0$ for every $t\in\R^n$, and
$$\lim_{x\to\infty}(K*\varphi)(x)=a\hat K(0).$$
(a) Then $\lim_{x\to\infty}(f*\varphi)(x)=a\hat f(0)$ for **every** $f\in L^1(\R^n)$.
(b) If, in addition, $\varphi$ is slowly oscillating (9.6), then $\varphi(x)\to a$ as $x\to\infty$.
(On $\R$ everything holds with $x\to+\infty$ in place of $|x|\to\infty$.)`,
      idea: String.raw`(a) Let $Y$ be the set of $f\in L^1$ with $(f*\varphi)(x)-a\hat f(0)\to0$. It is a subspace, closed because $\norm{(f-g)*\varphi}_\infty\le\norm{f-g}_1\norm\varphi_\infty$, and translation-invariant because $(\tau_sf)*\varphi=\tau_s(f*\varphi)$ while $\widehat{\tau_sf}(0)=\hat f(0)$. It contains $K$, so it is all of $L^1$ by 9.5. (b) Take for $f$ the indicator of $[0,\delta]$, normalised so that $(f*\varphi)(x)/\hat f(0)=A_\delta\varphi(x)=\frac1\delta\int_{x-\delta}^x\varphi$. Then
$$|\varphi(x)-a|\le|\varphi(x)-A_\delta\varphi(x)|+|A_\delta\varphi(x)-a|.$$
The first term is at most $\omega(x-\delta,\delta)$, which is below $\eps$ for large $x$ once $\delta$ is chosen by slow oscillation. The second tends to $0$ by Wiener.`,
      caption: String.raw`$a=1$. Top: $\varphi$ (grey), $(K*\varphi)/\hat K(0)$ (blue) and the backward average $A_\delta\varphi$ (green). At the draggable point the bars split $|\varphi(x)-1|$ into the slow-oscillation term $|\varphi-A_\delta\varphi|$ (orange) and the Wiener term $|A_\delta\varphi-1|$ (green). Bottom: the tail suprema $\sup_{y\ge x}|\cdot-1|$ on a log scale. The staircase satisfies every hypothesis and converges, slowly. The chirp is not slowly oscillating, so the orange term never shrinks. The tone at $\pi$ is slowly oscillating, but with the box kernel $\hat K(\pi)=0$, so the green term never shrinks.`,
      deps: ['fa-9.5', 'fa-9.6', 'fa-9.4'],
      tags: ['Tauberian', 'Wiener', 'oscillation'],
      verify: true,
      viz(v) {
        const M = v.M;
        const dx = 0.02, X1 = 90, NO = Math.round(X1 / dx) + 1;
        const KS = {
          gauss: { label: 'Gaussian $K$', K: (x) => Math.exp(-x * x) / Math.sqrt(Math.PI), R: 5, zf: true },
          box: { label: 'box $K=\\frac12\\chi_{[-1,1]}$', K: (x) => (Math.abs(x) <= 1 + 1e-9 ? 0.5 : 0), R: 1, zf: false },
        };
        const EX = {
          alt: { label: 'staircase', f: (x) => 1 + 0.9 * (altS(x) - ALT_LIM), so: true, y: [0.5, 1.62] },
          chirp: { label: '$1+\\sin\\frac{x^2}{8}$', f: (x) => 1 + Math.sin(x * x / 8), so: false, y: [-0.12, 2.12] },
          tone: { label: '$1+0.8\\sin\\pi x$', f: (x) => 1 + 0.8 * Math.sin(Math.PI * x), so: true, y: [0.08, 1.92] },
        };
        const eS = v.select('$\\varphi$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'alt');
        const kS = v.select('', Object.entries(KS).map(([value, o]) => ({ value, label: o.label })), 'gauss');
        const dS = v.slider('averaging length $\\delta$', 0.1, 3, 0.4, { step: 0.05 });
        const A = v.stage({ x: [0, 60], y: [-0.15, 2.2], height: 270, full: true, axes: 'box', xlabel: 'x', title: '$\\varphi$, $(K*\\varphi)/\\hat K(0)$ and $A_\\delta\\varphi=\\frac1\\delta\\int_{x-\\delta}^x\\varphi$' });
        const B = v.stage({ x: [0, 60], y: [-4, 0.4], height: 210, full: true, axes: 'box', xlabel: 'x', title: 'tails $\\sup_{y\\ge x}|\\,\\cdot\\,-1|$ (log scale)', yticks: decadeTicks(-4, 0.4) });
        const hx = A.handle(24, 1, { color: 'ink', r: 6, constrain: (x) => { const t = M.clamp(x, 4, 57); return [t, EX[eS.value].f(t)]; } });
        const kc = {};
        let ck = '', R = null, st = {};
        v.render(() => {
          const E = EX[eS.value], Ko = KS[kS.value], del = dS.value;
          const key = `${eS.value}|${kS.value}|${del}`;
          if (key !== ck) {
            ck = key;
            const kk = (kc[kS.value] ||= kernelSamples(Ko.K, dx, Ko.R));
            const Kc = convGrid(E.f, kk, 0, NO, dx).map((y) => y / kk.mass);
            const fk = kernelSamples((x) => (x >= -1e-9 && x <= del + 1e-9 ? 1 / del : 0), dx, del);   // backward average
            const Ac = convGrid(E.f, fk, 0, NO, dx).map((y) => y / fk.mass);
            const ph = Float64Array.from(M.range(NO), (i) => E.f(i * dx));
            const tl = (arr) => suffixMax(Float64Array.from(arr, (y) => Math.abs(y - 1)));
            R = { Kc, Ac, ph, tK: tl(Kc), tA: tl(Ac), tP: tl(ph), tO: suffixMax(Float64Array.from(ph, (y, i) => Math.abs(y - Ac[i]))) };
          }
          const x0 = hx.x, i0 = Math.round(x0 / dx);
          hx.y = E.f(x0);
          A.setView(null, E.y);
          A.vband(x0 - del, x0, { color: 'green', alpha: 0.12 });
          A.hline(1, { color: 'muted', dash: [6, 4], width: 1.2 });
          A.fn(E.f, { color: 'faint', width: 1.3, n: 3000 });
          const P = (arr) => Array.from(arr, (y, i) => [i * dx, y]).filter((p) => p[0] <= 61);
          A.path(P(R.Ac), { color: 'green', width: 2 });
          A.path(P(R.Kc), { color: 'blue', width: 2.4 });
          const pv = R.ph[i0], av = R.Ac[i0];
          A.line(x0 + 0.8, pv, x0 + 0.8, av, { color: 'orange', width: 6 });
          A.line(x0 + 1.7, av, x0 + 1.7, 1, { color: 'green', width: 6 });
          A.line(x0, pv, x0 + 0.8, pv, { color: 'orange', width: 1, dash: [2, 2] });
          A.line(x0, av, x0 + 1.7, av, { color: 'green', width: 1, dash: [2, 2] });
          A.dot(x0, av, { color: 'green', r: 4 });
          // tails (log)
          const L = (arr) => Array.from(arr, (y, i) => [i * dx, Math.log10(Math.max(1e-4, y))]).filter((p) => p[0] <= 60);
          B.path(L(R.tP), { color: 'ink', width: 2 });
          B.path(L(R.tO), { color: 'orange', width: 1.8, dash: [6, 4] });
          B.path(L(R.tA), { color: 'green', width: 2 });
          B.path(L(R.tK), { color: 'blue', width: 2 });
          B.vline(x0, { color: 'muted', width: 1, dash: [3, 3] });
          const tailK = R.tK[Math.round(50 / dx)], tailA = R.tA[Math.round(50 / dx)], tailO = R.tO[Math.round(50 / dx)], tailP = R.tP[Math.round(50 / dx)];
          st = { E, Ko, pv, av, x0, tailK, tailA, tailO, tailP };
        });
        v.legend([['faint', '$\\varphi$'], ['blue', '$(K*\\varphi)/\\hat K(0)$'], ['green', '$A_\\delta\\varphi$ (Wiener term)'], ['orange', '$|\\varphi-A_\\delta\\varphi|$ (oscillation term)'], ['ink', '$|\\varphi-1|$ in the tail plot']]);
        v.readout(() => {
          const s = st; if (!s.E) return '';
          const ok = (b) => (b ? '✓' : '✗');
          const hypK = s.tailK < 0.01;
          return `At $x=${v.fix(s.x0, 1)}$: $|\\varphi-1|=${v.fix(Math.abs(s.pv - 1), 3)}\\le|\\varphi-A_\\delta\\varphi|+|A_\\delta\\varphi-1|=${v.fix(Math.abs(s.pv - s.av), 3)}+${v.fix(Math.abs(s.av - 1), 3)}$. ` +
            `Hypotheses: slowly oscillating ${ok(s.E.so)}, $\\hat K\\ne0$ ${ok(s.Ko.zf)}, $K*\\varphi\\to\\hat K(0)$ ${ok(hypK)} (tail beyond 50: $${v.sci(s.tailK, 2)}$). ` +
            `Conclusion $\\varphi\\to1$: ${s.tailP < 0.12 ? 'yes, slowly' : 'no'} (tail beyond 50: $${v.fix(s.tailP, 3)}$).`;
        });
      },
    },
  ],
};
