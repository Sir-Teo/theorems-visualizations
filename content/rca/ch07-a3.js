// Rudin, Real and Complex Analysis — Chapter 7 (part 3): singular measures, absolute continuity,
// and the fundamental theorem of calculus for Lebesgue integrals.

// ---------------------------------------------------------------- shared helpers (batch 3)
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
function logTicks(a, b, step = 1) {
  const out = [];
  for (let k = Math.ceil(a); k <= b; k += step) out.push([k, k === 0 ? '1' : k === 1 ? '10' : k === -1 ? '0.1' : '10' + String(k).split('').map((c) => SUP[c]).join('')]);
  return out;
}
const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => Math.pow(10, a + (b - a) * i / (n - 1)));
function pieces(S, f, a, b, breaks, st) {
  const cuts = [a, ...breaks.filter((c) => c > a && c < b).sort((u, w) => u - w), b];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i] + (i > 0 ? 1e-9 : 0), hi = cuts[i + 1] - (i + 2 < cuts.length ? 1e-9 : 0);
    if (hi > lo) S.fn(f, { ...st, domain: [lo, hi] });
  }
}
/** Cantor function c on [0,1] (extended by 0 and 1) and its antiderivative I(x) = ∫_0^x c (self-similarity: I(1/3)=1/12, I(2/3)=1/4). */
function cantor(x, depth = 34) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  let y = 0, s = 0.5;
  for (let i = 0; i < depth; i++) { x *= 3; if (x < 1) { /* left */ } else if (x < 2) return y + s; else { y += s; x -= 2; } s /= 2; }
  return y;
}
function cantorInt(x, depth = 30) {
  if (x <= 0) return 0; if (x >= 1) return 0.5 + (x - 1);
  if (depth === 0) return x * cantor(x);
  if (x < 1 / 3) return cantorInt(3 * x, depth - 1) / 6;
  if (x < 2 / 3) return 1 / 12 + (x - 1 / 3) / 2;
  return 0.25 + (x - 2 / 3) / 2 + cantorInt(3 * x - 2, depth - 1) / 6;
}
/** ∫_a^b g for g with an integrable |t − c|^{-1/2} singularity at c: substitute t = c ± s² on each side (Simpson in s). */
function intSing(g, a, b, c, n = 160) {
  if (b <= a) return 0;
  const simpson = (h, lo, hi) => { let m = n; const d = (hi - lo) / m; let s = h(lo) + h(hi); for (let i = 1; i < m; i++) s += h(lo + i * d) * (i % 2 ? 4 : 2); return s * d / 3; };
  const piece = (p, q) => (q <= c
    ? simpson((s) => g(c - s * s) * 2 * s, Math.max(1e-6, Math.sqrt(c - q)), Math.sqrt(c - p))
    : simpson((s) => g(c + s * s) * 2 * s, Math.max(1e-6, Math.sqrt(p - c)), Math.sqrt(q - c)));
  return b <= c || a >= c ? piece(a, b) : piece(a, c) + piece(c, b);
}
/** Level-n intervals of the middle-thirds construction. */
function cantorLevel(n) { let I = [[0, 1]]; for (let k = 0; k < n; k++) I = I.flatMap(([a, b]) => { const d = (b - a) / 3; return [[a, a + d], [b - d, b]]; }); return I; }

export default {
  collection: 'rca',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.14
    {
      num: '7.14',
      kind: 'Theorem',
      name: 'Differentiating a measure: the Lebesgue decomposition',
      statement: String.raw`Suppose that to each $x\in\R^k$ is assigned a sequence $\{E_i(x)\}$ that shrinks to $x$ nicely, and let $\mu$ be a complex Borel measure on $\R^k$ with Lebesgue decomposition $d\mu=f\,dm+d\mu_s$ ($f\in L^1(\R^k)$, $\mu_s\perp m$). Then
$$\lim_{i\to\infty}\frac{\mu(E_i(x))}{m(E_i(x))}=f(x)\qquad\text{a.e. }[m].$$
In particular, $\mu\perp m$ if and only if $D\mu=0$ a.e. $[m]$.`,
      idea: String.raw`By 7.10 the absolutely continuous part $f\,dm$ contributes $f(x)$ almost everywhere, so it suffices to show $\mu_s(E_i(x))/m(E_i(x))\to0$ a.e. Since $|\mu_s(E_i)|\le|\mu_s|(B(x,r_i))$ and $m(E_i)\ge\alpha\,m(B(x,r_i))$, it is enough to prove $D\lambda=0$ a.e. for a *positive* $\lambda\perp m$. Such a $\lambda$ lives on a Borel set of Lebesgue measure $0$; by regularity it lives, up to $\eps$, on a compact $K$ with $m(K)=0$. Off $K$, for small $r$, the quotients of $\lambda$ are those of $\lambda$ restricted to $\R^k\setminus K$, a measure of norm $<\eps$, and the maximal theorem 7.4 shows that they exceed $1/j$ only on a set of measure at most $3^kj\eps$. For the last assertion: if $D\mu=0$ a.e., then $f=0$ a.e., so $\mu=\mu_s$.`,
      caption: String.raw`On the line, $\mu=f\,dm+0.6\,\kappa+0.25\,\delta_q$, where $\kappa$ is the Cantor measure placed on $[1.2,2.1]$ (top: the distribution function, with its singular part dashed). Lower panel: $\mu(E)/m(E)$ at every $x$, for sets $E=E_r(x)$ of the chosen nicely shrinking family, against the density $f$ (green). Shrink $r$: the red set where the two differ by more than $\eta$ clings to the Cantor set and the atom, and its measure tends to $0$. Switch off the absolutely continuous part: then $\mu\perp m$ and the quotients tend to $0$ almost everywhere.`,
      deps: ['rca-6.10', 'rca-7.9', 'rca-7.10', 'rca-7.4', 'rca-2.18'],
      tags: ['Lebesgue decomposition', 'derivative of a measure', 'singular measures'],
      viz(v) {
        const M = v.M;
        const QA = 0.6, CA = 0.25, S0 = 1.2, SL = 0.9, CS = 0.6;
        const fac = (t) => (t < 0 || t > 3 ? 0 : 0.4 + 0.3 * Math.sin(2.2 * t));
        const Fac = (t) => { const u = M.clamp(t, 0, 3); return 0.4 * u - (0.3 / 2.2) * (Math.cos(2.2 * u) - 1); };
        const Fs = (t) => CS * cantor((t - S0) / SL);
        const FAM = {
          ball: { label: '$(x-r,x+r)$', E: (x, r) => [x - r, x + r] },
          right: { label: '$(x,x+r)$', E: (x, r) => [x, x + r] },
          away: { label: '$(x+\\frac r2,x+r)$', E: (x, r) => [x + r / 2, x + r] },
        };
        const fam = v.select('$E_r(x)=$', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'right');
        const acT = v.toggle('include the part $f\\,dm$', true);
        const rS = v.slider('size $r$', 0.0002, 0.3, 0.003, { log: true, fmt: (x) => v.fmt(x, 2) });
        const eta = v.slider('$\\eta$', 0.05, 0.5, 0.15, { step: 0.01 });
        const top = v.stage({ x: [-0.1, 3.1], y: [-0.1, 2.35], height: 200, full: true, title: 'distribution function $t\\mapsto\\mu((-\\infty,t])$' });
        const bot = v.stage({ x: [-0.1, 3.1], y: [-0.25, 2.2], height: 240, weight: 2.4, title: '$\\mu(E_r(x))/m(E_r(x))$ at every $x$, and the density $f$' });
        const ins = v.stage({ x: [-3.75, -0.45], y: [-2.1, 0.15], height: 240, weight: 1, minWidth: 200, axes: 'box', xticks: logTicks(-3, -1), yticks: logTicks(-2, 0), title: 'measure of the red set against $r$' });
        const RS = logspace(-3.7, -0.55, 26), cacheB = {};
        const NX = 2400, XS = M.linspace(-0.1, 3.1, NX), DX = 3.2 / (NX - 1);
        let st = {};
        v.legend([['ink', 'distribution function of $\\mu$'], ['purple', 'its singular part', { dash: true }], ['accent', 'quotient $\\mu(E)/m(E)$'], ['green', 'density $f$'], ['red', 'where they differ by $>\\eta$', { area: true }]]);
        v.render(() => {
          const ac = acT.value, r = rS.value, e = eta.value, F = FAM[fam.value];
          const muI = (a, b) => (ac ? Fac(b) - Fac(a) : 0) + Fs(b) - Fs(a) + (a < QA && QA < b ? CA : 0);
          const dist = (t) => (ac ? Fac(t) : 0) + Fs(t) + (t >= QA ? CA : 0);
          const fd = (t) => (ac ? fac(t) : 0);
          // top
          top.vband(S0, S0 + SL, { color: 'purple', alpha: 0.06 });
          pieces(top, dist, -0.1, 3.1, [QA], { color: 'ink', width: 2.2, n: 1600 });
          top.fn(Fs, { color: 'purple', width: 1.6, dash: [5, 4], n: 1600 });
          top.dot(QA, dist(QA), { color: 'ink', r: 3.5 }); top.dot(QA, dist(QA - 1e-9), { hollow: true, r: 3.5, color: 'ink' });
          top.text('atom', QA, dist(QA), { dx: 10, dy: 12, size: 11, color: 'muted' });
          top.text('Cantor part', S0 + SL / 2, 2.25, { align: 'center', size: 11, color: 'purple' });
          // bottom
          const qs = XS.map((x) => { const [a, b] = F.E(x, r); return muI(a, b) / (b - a); });
          let bad = 0; const runs = []; let run = null;
          XS.forEach((x, i) => { const isBad = Math.abs(qs[i] - fd(x)) > e; if (isBad) bad += DX; if (isBad && run === null) run = x; if (!isBad && run !== null) { runs.push([run, x]); run = null; } });
          if (run !== null) runs.push([run, 3.1]);
          for (const [a, b] of runs) bot.rect(a, -0.22, Math.max(b, a + 0.003), -0.1, { fill: 'red', fillAlpha: 0.85, stroke: false });
          bot.path(XS.map((x, i) => [x, Math.min(qs[i], 9)]), { color: 'accent', width: 1.3 });
          pieces(bot, fd, -0.1, 3.1, [0, 3], { color: 'green', width: 2.4 });
          bot.vband(S0, S0 + SL, { color: 'purple', alpha: 0.06 });
          const key = [fam.value, ac, e.toFixed(2)].join(':');
          if (!cacheB[key]) cacheB[key] = RS.map((s) => { let b = 0; for (const x of XS) { const [a, c] = F.E(x, s); if (Math.abs(muI(a, c) / (c - a) - fd(x)) > e) b += DX; } return b; });
          ins.path(RS.map((s, i) => [Math.log10(s), Math.log10(Math.max(cacheB[key][i], 0.008))]), { color: 'red', width: 2.2 });
          ins.dot(Math.log10(r), Math.log10(Math.max(bad, 0.008)), { color: 'red', r: 5 });
          st = { r, bad, ac };
        });
        v.readout(() => `$r=${v.fmt(st.r, 3)}$: the quotients differ from ${st.ac ? '$f$' : '$0$'} by more than $\\eta$ on a set of measure $${v.fix(st.bad, 4)}$, which tends to $0$ as $r\\to0$` + (st.ac ? '.' : ' — so $D\\mu=0$ a.e. $[m]$, as it must be for $\\mu\\perp m$.'));
      },
    },
    // ------------------------------------------------------------------ 7.15
    {
      num: '7.15',
      kind: 'Theorem',
      name: 'Singular measures have infinite derivative μ-a.e.',
      verify: true,
      statement: String.raw`If $\mu$ is a positive (finite) Borel measure on $\R^k$ and $\mu\perp m$, then
$$(D\mu)(x)=\lim_{r\to0}\frac{\mu(B(x,r))}{m(B(x,r))}=\infty\qquad\text{for }\mu\text{-almost every }x .$$`,
      idea: String.raw`Let $\mu$ be concentrated on a Borel set $S$ with $m(S)=0$, and fix $N$. Consider the set $E$ of points $x\in S$ where $Q_r\mu(x)<N$ for arbitrarily small $r$. Given an open $V\supset S$ with $m(V)$ tiny, every $x$ in a compact $K\subset E$ is the centre of a ball $B(x,r)\subset V$ with $\mu(B(x,r))<N\,m(B(x,r))$. Apply the covering lemma 7.3 to the concentric balls of radius $r/3$ (finitely many cover $K$): it leaves disjoint balls $B(x_i,r_i/3)\subset V$ whose triples $B(x_i,r_i)$ still cover $K$, so
$$\mu(K)\le\sum_i\mu(B(x_i,r_i))<N\sum_i m(B(x_i,r_i))=3^kN\sum_i m(B(x_i,r_i/3))\le3^kN\,m(V),$$
which can be made arbitrarily small. Hence $\mu(E)=0$, i.e. $\liminf_{r\to0}Q_r\mu\ge N$ $\mu$-a.e., for every $N$.`,
      caption: String.raw`Two singular measures on $[0,1]$: the Cantor measure, and the Bernoulli measure $\mu_p$ that gives each binary digit the value $1$ with probability $p$ (for $p\ne\frac12$ it is singular although its distribution function is strictly increasing). Gold curves: $Q_r\mu(x)$ against $r$, log–log, at twelve points $x$ drawn at random *from $\mu$*; they climb to $\infty$ roughly like $r^{d-1}$, $d$ the dimension of $\mu$. The blue curve is at your draggable point — a typical point for $m$ — and sinks to $0$, as 7.14 predicts. At $p=\frac12$, $\mu_p=m$ and everything flattens to $1$.`,
      deps: ['rca-7.3', 'rca-7.2', 'rca-2.18'],
      tags: ['singular measures', 'derivative of a measure'],
      viz(v) {
        const M = v.M;
        const which = v.select('$\\mu$', [{ value: 'cantor', label: 'Cantor measure' }, { value: 'bern', label: 'Bernoulli $\\mu_p$' }], 'cantor');
        const pS = v.slider('$p$', 0.1, 0.5, 0.25, { step: 0.01 });
        let seed = 3;
        v.button('Resample μ-points', () => { seed = (seed * 48271) % 2147483647; });
        const top = v.stage({ x: [-0.03, 1.03], y: [-0.12, 1.08], height: 220, full: true, title: 'distribution function of $\\mu$; gold ticks: points sampled from $\\mu$' });
        const bot = v.stage({ x: [-8.2, 0.1], y: [-3.2, 3.2], height: 260, full: true, axes: 'box', xticks: logTicks(-8, 0), yticks: logTicks(-2, 3), title: '$Q_r\\mu(x)=\\mu(B(x,r))/m(B(x,r))$ against $r$ (both axes logarithmic)' });
        const xh = top.handle(0.37, -0.06, { color: 'accent', label: 'x', labelPos: 'e', constrain: (x) => [M.clamp(x, 0.01, 0.99), -0.06] });
        const bernF = (p) => (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let F = 0, w = 1; for (let k = 0; k < 46; k++) { x *= 2; if (x >= 1) { F += w * (1 - p); w *= p; x -= 1; } else w *= 1 - p; if (w < 1e-300) break; } return F; };
        const RS = logspace(-8, 0, 90);
        let st = {};
        v.legend([['gold', 'at points drawn from $\\mu$'], ['accent', 'at the point $x$'], ['muted', 'slope $d-1$', { dash: true }]]);
        v.render(() => {
          const cant = which.value === 'cantor', p = pS.value;
          pS.el.hidden = cant;
          const F = cant ? (x) => cantor(x) : bernF(p);
          const d = cant ? Math.log(2) / Math.log(3) : (p > 0 && p < 1 ? -(p * Math.log(p) + (1 - p) * Math.log(1 - p)) / Math.log(2) : 0);
          const R = M.rng(seed + (cant ? 0 : Math.round(p * 1000)));
          const pts = M.range(12).map(() => { let x = 0; if (cant) { let s = 1; for (let k = 0; k < 32; k++) { s /= 3; if (R() < 0.5) x += 2 * s; } } else { let s = 1; for (let k = 0; k < 48; k++) { s /= 2; if (R() < p) x += s; } } return x; });
          // top
          top.fn(F, { color: 'ink', width: 2, n: 1400, domain: [0, 1] });
          for (const x of pts) top.line(x, -0.11, x, -0.01, { color: 'gold', width: 2 });
          // bottom
          const Q = (x, r) => (F(x + r) - F(x - r)) / (2 * r);
          const lq = (q) => (q > 0 ? Math.log10(q) : -9);
          bot.line(-8.2, (d - 1) * -8.2, 0.1, (d - 1) * 0.1, { color: 'muted', dash: [6, 4], width: 1.4 });
          bot.hline(0, { color: 'faint', width: 1 });
          const finals = [];
          for (const x of pts) { const ys = RS.map((r) => lq(Q(x, r))); bot.path(RS.map((r, i) => [Math.log10(r), ys[i]]), { color: 'gold', width: 1.4, alpha: 0.85 }); finals.push(Q(x, 1e-7)); }
          const ym = RS.map((r) => lq(Q(xh.x, r)));
          bot.path(RS.map((r, i) => [Math.log10(r), Math.max(ym[i], -3.15)]), { color: 'accent', width: 2.8 });
          if (ym[0] < -3.1) bot.text('Q = 0 for small r: x lies in a gap of C', -8.1, -2.75, { color: 'accent', size: 11.5, baseline: 'bottom' });
          bot.text(`slope d − 1 = ${v.fmt(d - 1, 3)}`, -4, (d - 1) * -4, { align: 'left', dx: 6, dy: -12, color: 'muted', size: 11.5 });
          finals.sort((a, b) => a - b);
          st = { med: finals[6], qx: Q(xh.x, 1e-7), d, x: xh.x, cant, p };
        });
        v.readout(() => `At $r=10^{-7}$: median of $Q_r\\mu$ over the $\\mu$-sampled points $=${v.sci(st.med, 3)}$; at $x=${v.fix(st.x, 3)}$, $Q_r\\mu(x)=${v.sci(st.qx, 3)}$. Dimension $d=${v.fix(st.d, 3)}$` + (!st.cant && Math.abs(st.p - 0.5) < 1e-9 ? ' — here $\\mu_p=m$ is not singular, and all quotients equal $1$.' : '.'));
      },
    },
    // ------------------------------------------------------------------ 7.17
    {
      num: '7.17',
      kind: 'Definition',
      name: 'Absolutely continuous functions',
      credit: 'Vitali, 1905',
      statement: String.raw`A complex function $f$ on an interval $I=[a,b]$ is **absolutely continuous** on $I$ (briefly, $f$ is AC on $I$) if to every $\eps>0$ there corresponds $\delta>0$ such that
$$\sum_{i=1}^n|f(\beta_i)-f(\alpha_i)|<\eps$$
for every $n$ and every choice of disjoint segments $(\alpha_1,\beta_1),\dots,(\alpha_n,\beta_n)$ in $I$ with $\sum_{i=1}^n(\beta_i-\alpha_i)<\delta$.`,
      idea: String.raw`With $n=1$ this is uniform continuity, so AC functions are continuous; allowing many small segments at once is what makes the notion strictly stronger. Every indefinite integral $x\mapsto\int_a^x g\,dm$ with $g\in L^1$ is AC (absolute continuity of the integral). The Cantor function is continuous and nondecreasing but not AC: the $2^n$ intervals of the $n$-th stage of the construction have total length $(2/3)^n$, yet $f$ rises by $1$ across them.`,
      caption: String.raw`Choose $f$, then $\delta$. The orange segments on the axis are disjoint, have total length $<\delta$, and are chosen to make $\sum|f(\beta_i)-f(\alpha_i)|$ as large as possible (blue rises, stacked in the bar on the right). For $\sqrt x$ the best is the single segment $(0,\delta)$, giving $\sqrt\delta$, so $\delta=\eps^2$ works. For the Cantor function the stage-$n$ intervals give $1$ no matter how small $\delta$ is. For $x\sin(1/x)$ the sum grows without bound as more segments (between consecutive extrema near $0$) are used.`,
      deps: ['rca-2.20'],
      tags: ['absolute continuity'],
      viz(v) {
        const M = v.M;
        const FN = {
          sqrt: { label: '$\\sqrt{x}$', f: (x) => Math.sqrt(Math.max(0, x)), y: [-0.13, 1.12] },
          cantor: { label: 'Cantor function', f: (x) => cantor(x), y: [-0.13, 1.12] },
          xsin: { label: '$x\\sin(1/x)$', f: (x) => (x <= 0 ? 0 : x * Math.sin(1 / x)), y: [-0.4, 1.12] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'cantor');
        const dS = v.slider('$\\delta$', 0.0005, 0.5, 0.03, { log: true, fmt: (x) => v.fmt(x, 2) });
        const eS = v.slider('$\\varepsilon$', 0.05, 1.5, 0.3, { step: 0.01 });
        const nS = v.slider('number of segments $n$', 1, 4000, 300, { log: true, fmt: (x) => String(Math.round(x)) });
        const S = v.stage({ x: [-0.03, 1.32], y: [-0.13, 1.12], height: 330, full: true, xticks: [0.25, 0.5, 0.75, 1], yticks: [0.5, 1] });
        let st = {};
        v.legend([['ink', '$y=f(x)$'], ['orange', 'disjoint segments, total length $<\\delta$', { area: true }], ['accent', 'rises $|f(\\beta_i)-f(\\alpha_i)|$'], ['red', '$\\varepsilon$', { dash: true }]]);
        v.render(() => {
          const F = FN[which.value], d = dS.value, e = eS.value;
          nS.el.hidden = which.value !== 'xsin';
          S.setView(null, F.y);
          let segs;
          if (which.value === 'sqrt') segs = [[0, d * 0.999]];
          else if (which.value === 'cantor') { let n = 0; while (Math.pow(2 / 3, n) >= d && n < 30) n++; segs = cantorLevel(n); }
          else {
            const K = Math.max(1, Math.ceil(1 / (Math.PI * d))), n = Math.round(nS.value);
            const xk = (k) => 1 / (Math.PI * (k + 0.5));
            segs = M.range(n).map((j) => [xk(K + j + 1), xk(K + j)]);
          }
          const len = segs.reduce((s, [a, b]) => s + b - a, 0);
          const rises = segs.map(([a, b]) => Math.abs(F.f(b) - F.f(a)));
          const tot = rises.reduce((s, x) => s + x, 0);
          // segments and the graph over them
          const px = 1.35 / S.width;
          for (const [a, b] of segs) { S.rect(a, F.y[0] + 0.015, Math.max(b, a + px * 0.8), F.y[0] + 0.065, { fill: 'orange', fillAlpha: 0.9, stroke: false }); }
          S.fn(F.f, { color: 'ink', width: 2, domain: [0, 1], n: which.value === 'xsin' ? 6000 : 1600 });
          if (segs.length <= 64) for (const [a, b] of segs) S.line(b, F.f(a), b, F.f(b), { color: 'accent', width: 2.2 });
          // stacked bar of rises
          const X0 = 1.12, X1 = 1.22, base = 0, scale = 1;
          let y = base;
          const top = Math.min(tot, F.y[1] - 0.05);
          if (rises.length > 40) S.rect(X0, base, X1, top, { fill: 'accent', fillAlpha: 0.6, stroke: false });
          else rises.forEach((h, i) => { const y1 = Math.min(y + h * scale, top); if (y1 > y) S.rect(X0, y, X1, y1, { fill: 'accent', fillAlpha: i % 2 ? 0.45 : 0.75, stroke: false }); y += h * scale; });
          S.rect(X0, base, X1, top, { color: 'accent', width: 1.2 });
          if (tot > F.y[1] - 0.05) S.text('▲ ' + v.fmt(tot, 3), (X0 + X1) / 2, F.y[1] - 0.05, { align: 'center', dy: 8, color: 'accent', size: 11.5, weight: 600 });
          S.line(1.08, e, 1.26, e, { color: 'red', width: 2, dash: [5, 3] });
          S.text('ε', 1.27, e, { color: 'red', math: true });
          S.text('Σ rises', (X0 + X1) / 2, base, { align: 'center', dy: 12, size: 11, color: 'muted' });
          const ok = tot < e;
          S.corner(ok ? 'sum < ε for these segments' : 'sum ≥ ε although total length < δ', 'tl', { color: ok ? 'green' : 'red', weight: 600 });
          st = { n: segs.length, len, tot, d, e, which: which.value };
        });
        v.readout(() => `${st.n} segment${st.n === 1 ? '' : 's'}, total length $${v.sci(st.len, 3)}<\\delta=${v.sci(st.d, 3)}$; $\\;\\sum|f(\\beta_i)-f(\\alpha_i)|=${v.fix(st.tot, 4)}$` + (st.which === 'sqrt' ? ` $=\\sqrt{\\text{length}}$: AC, and $\\delta=\\varepsilon^2=${v.fix(st.e * st.e, 4)}$ works.` : st.which === 'cantor' ? ' — always $1$: not AC.' : ' — unbounded as $n$ grows: not AC (not even of bounded variation).'));
      },
    },
    // ------------------------------------------------------------------ 7.18
    {
      num: '7.18',
      kind: 'Theorem',
      name: 'Three characterisations of AC for increasing functions',
      statement: String.raw`Let $I=[a,b]$ and let $f:I\to\R$ be continuous and nondecreasing. Then each of the following statements implies the other two:
(a) $f$ is AC on $I$;
(b) $f$ maps sets of Lebesgue measure $0$ to sets of Lebesgue measure $0$;
(c) $f$ is differentiable a.e. on $I$, $f'\in L^1$, and $f(x)-f(a)=\int_a^x f'\,dm$ for $a\le x\le b$.`,
      idea: String.raw`(a)⇒(b): cover a null set by open segments of total length $<\delta$; their images are segments of total length $<\eps$. (b)⇒(c): $g(x)=x+f(x)$ is a homeomorphism of $I$ onto an interval, it still maps null sets to null sets, and $\mu(E)=m(g(E))$ defines a finite measure with $\mu\ll m$. By Radon–Nikodym (6.10) $d\mu=h\,dm$, and taking $E=[a,x]$ gives $f(x)-f(a)=\int_a^x(h-1)\,dm$; Theorem 7.11 then identifies $f'=h-1$ a.e. (c)⇒(a): the indefinite integral of an $L^1$ function is AC (6.11).`,
      caption: String.raw`Choose $f$ and the stage $n$. The null set $C$ (the Cantor set) is covered by the $2^n$ orange intervals of total length $(2/3)^n$; their image under $f$ is marked in blue on the vertical axis. On the right, $f(x)-f(0)$ is compared with $\int_0^xf'\,dm$. For the AC function the image of the cover shrinks to measure $0$ and the two curves coincide. For the Cantor function the image is all of $[0,1]$ and $\int f'=0$; for $\frac12(x+c(x))$, strictly increasing, half the range is still carried by $C$.`,
      deps: ['rca-7.17', 'rca-6.10', 'rca-7.11', 'rca-6.11'],
      see: ['pma-6.21'],
      tags: ['absolute continuity', 'fundamental theorem of calculus'],
      viz(v) {
        const M = v.M;
        const N0 = 0.5 + Math.SQRT1_2;
        const acF = (x) => { const t = M.clamp(x, 0, 1); return (0.5 * t + 0.5 * (Math.SQRT1_2 + Math.sign(t - 0.5) * Math.sqrt(Math.abs(t - 0.5)))) / N0; };
        const acD = (x) => (0.5 + 0.25 / Math.sqrt(Math.abs(x - 0.5))) / N0;
        const FN = {
          ac: { label: 'an AC function', f: acF, intD: (x) => intSing(acD, 0, M.clamp(x, 0, 1), 0.5), flags: [true, true, true] },
          cantor: { label: 'Cantor function $c$', f: (x) => cantor(x), intD: () => 0, flags: [false, false, false] },
          mix: { label: '$\\frac12(x+c(x))$', f: (x) => 0.5 * (M.clamp(x, 0, 1) + cantor(x)), intD: (x) => 0.5 * M.clamp(x, 0, 1), flags: [false, false, false] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'cantor');
        const nS = v.slider('stage $n$', 1, 9, 3, { int: true });
        const L = v.stage({ x: [-0.12, 1.05], y: [-0.08, 1.06], equal: true, height: 330, weight: 1.15, xticks: [0.5, 1], yticks: [0.5, 1], title: 'the cover of $C$ and its image' });
        const R = v.stage({ x: [-0.03, 1.03], y: [-0.06, 1.06], height: 330, weight: 1, minWidth: 240, xticks: [0.5, 1], yticks: [0.5, 1], title: '$f(x)-f(0)$ and $\\int_0^x f\'\\,dm$' });
        let st = {};
        v.legend([['orange', 'cover of $C$, measure $(2/3)^n$', { area: true }], ['accent', 'its image under $f$', { area: true }], ['ink', '$f(x)-f(0)$'], ['green', '$\\int_0^x f\'\\,dm$', { dash: true }]]);
        v.render(() => {
          const F = FN[which.value], n = nS.value, I = cantorLevel(n);
          let img = 0;
          for (const [a, b] of I) {
            const fa = F.f(a), fb = F.f(b); img += fb - fa;
            L.rect(a, -0.07, b, -0.025, { fill: 'orange', fillAlpha: 0.9, stroke: false });
            L.rect(-0.11, fa, -0.065, Math.max(fb, fa + 0.002), { fill: 'accent', fillAlpha: 0.85, stroke: false });
            if (n <= 4) L.rect(a, 0, b, fb, { fill: 'orange', fillAlpha: 0.06, stroke: false });
            L.fn(F.f, { domain: [a, b], color: 'accent', width: 3.2, n: 200 });
          }
          L.fn(F.f, { domain: [0, 1], color: 'ink', width: 1.4, n: 1500 });
          // right panel
          R.between((x) => F.f(x) - F.f(0), (x) => F.intD(x), 0, 1, { fill: 'red', fillAlpha: 0.14, n: 600 });
          R.fn((x) => F.f(x) - F.f(0), { domain: [0, 1], color: 'ink', width: 2.2, n: 1500 });
          R.fn(F.intD, { domain: [0, 1], color: 'green', width: 2.4, dash: [7, 4] });
          const tick = (b) => (b ? '✓' : '✗');
          R.corner(`(a) ${tick(F.flags[0])}  (b) ${tick(F.flags[1])}  (c) ${tick(F.flags[2])}`, 'tl', { color: F.flags[0] ? 'green' : 'red', weight: 700, size: 13 });
          st = { n, cov: Math.pow(2 / 3, n), img, gap: F.f(1) - F.f(0) - F.intD(1), which: which.value };
        });
        v.readout(() => `Stage $${st.n}$: $m(\\text{cover})=(2/3)^{${st.n}}=${v.fix(st.cov, 4)}$, $\\;m(f(\\text{cover}))=${v.fix(st.img, 4)}$; $\\;f(1)-f(0)-\\int_0^1f'\\,dm=${v.fix(st.gap, 4)}$` + (st.which === 'ac' ? ' — (b) and (c) hold.' : st.which === 'cantor' ? ' — the null set $C$ is mapped onto a set of measure $1$.' : ' — $f(C)$ has measure $\\tfrac12$.'));
      },
    },
    // ------------------------------------------------------------------ 7.19
    {
      num: '7.19',
      kind: 'Theorem',
      name: 'The variation function of an AC function',
      statement: String.raw`Let $I=[a,b]$ and let $f:I\to\R$ be AC. Define
$$F(x)=\sup\sum_{i=1}^N|f(t_i)-f(t_{i-1})|\qquad(a\le x\le b),$$
the supremum taken over all $N$ and all partitions $a=t_0<t_1<\dots<t_N=x$. Then $F$, $F+f$ and $F-f$ are nondecreasing and AC on $I$.`,
      idea: String.raw`Absolute continuity with $\eps=1$ gives a $\delta$ such that $f$ has variation $\le1$ on every interval of length $<\delta$; cutting $I$ into finitely many such pieces shows $F<\infty$. For $x<y$, $F(y)\ge F(x)+|f(y)-f(x)|$ (append $y$ to a partition of $[a,x]$), so $F\pm f$ are nondecreasing. A partition of disjoint segments $(\alpha_i,\beta_i)$ refines into one whose variation sum still stays below $\eps$ when $\sum(\beta_i-\alpha_i)<\delta$; hence $F$ is AC, and so are $F\pm f$. This writes $f=\frac12(F+f)-\frac12(F-f)$ as a difference of nondecreasing AC functions.`,
      caption: String.raw`Top: $f$ and the inscribed polygon of a uniform partition with $N$ pieces. Bottom: the variation function $F$ (black), $F+f$ (green) and $F-f$ (teal) — all nondecreasing — and the partition sums $V_N(x)$ (gold), which increase to $F$ as the partition is refined. $x^{3/2}\sin(1/x)$ oscillates infinitely often but is AC, and $F$ stays finite. $x\sin(1/x)$ is continuous but not AC: its partition sums grow without bound, so $F=\infty$.`,
      deps: ['rca-7.17'],
      tags: ['absolute continuity', 'bounded variation'],
      viz(v) {
        const M = v.M;
        const FN = {
          wave: { label: 'a smooth wave', f: (x) => 0.55 * Math.sin(5 * x) + 0.25 * Math.cos(13 * x) * x, ac: true },
          osc: { label: '$x^{3/2}\\sin(1/x)$', f: (x) => (x <= 0 ? 0 : Math.pow(x, 1.5) * Math.sin(1 / x)), ac: true },
          bad: { label: '$x\\sin(1/x)$', f: (x) => (x <= 0 ? 0 : x * Math.sin(1 / x)), ac: false },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'wave');
        const nS = v.slider('pieces $N$', 2, 600, 12, { log: true, fmt: (x) => String(Math.round(x)) });
        const top = v.stage({ x: [-0.02, 1.02], y: [-0.9, 0.9], height: 180, full: true, title: '$f$ and the inscribed polygon' });
        const bot = v.stage({ x: [-0.02, 1.02], y: [-0.6, 3], height: 250, full: true, title: '$F$, $F\\pm f$ and the partition sums $V_N(x)$' });
        // the variation function on a grid that resolves the oscillation (uniform in x and in 1/x), plus the tail on (0, x_min]
        const cache = {};
        function variation(key) {
          if (cache[key]) return cache[key];
          const f = FN[key].f;
          const set = M.linspace(0, 1, 2001);
          if (key !== 'wave') for (let u = 1; u < 6000; u += Math.PI / 24) set.push(1 / u);
          const xs = [...new Set(set)].sort((a, b) => a - b);
          const Fv = [0]; for (let i = 1; i < xs.length; i++) Fv.push(Fv[i - 1] + Math.abs(f(xs[i]) - f(xs[i - 1])));
          // variation on (0, x1]: zero for the wave; Σ 2x_k^{3/2} over the extrema x_k ≈ 1/(πk) below x1 for x^{3/2} sin(1/x); infinite for x sin(1/x)
          const x1 = xs[1], K = Math.ceil(1 / (Math.PI * x1));
          let tail = 0; if (key === 'osc') for (let k = K; k < K + 200000; k++) tail += 2 * Math.pow(Math.PI * k, -1.5);
          if (key === 'bad') tail = Infinity;
          return (cache[key] = { xs, Fv: Fv.map((y, i) => (i === 0 ? 0 : y + tail)), tail });
        }
        let st = {};
        v.render(() => {
          const key = which.value, Fd = FN[key], f = Fd.f, N = Math.round(nS.value);
          v.legend(Fd.ac ? [['ink', '$F$'], ['green', '$F+f$'], ['teal', '$F-f$'], ['gold', 'partition sums $V_N$']] : [['gold', 'partition sums $V_N$ (no finite $F$)']]);
          top.setView(null, key === 'wave' ? [-0.9, 0.9] : key === 'osc' ? [-0.75, 0.95] : [-0.3, 0.95]);
          top.fn(f, { color: 'ink', width: 1.8, domain: [0, 1], n: 5000 });
          const T = M.linspace(0, 1, N + 1);
          top.path(T.map((t) => [t, f(t)]), { color: 'gold', width: 1.6 });
          if (N <= 60) top.dots(T.map((t) => [t, f(t)]), { color: 'gold', r: 2.6 });
          // partition sums
          const VN = [0]; for (let i = 1; i <= N; i++) VN.push(VN[i - 1] + Math.abs(f(T[i]) - f(T[i - 1])));
          const D = variation(key);
          const Ftot = D.Fv[D.Fv.length - 1];
          const ymax = Fd.ac ? Math.max(1.2, Ftot + 1) * 1.08 : Math.max(3, VN[N] * 1.25);
          bot.setView(null, [-0.25 * ymax, ymax]);
          if (Fd.ac) {
            bot.path(D.xs.map((x, i) => [x, D.Fv[i]]), { color: 'ink', width: 2.6 });
            bot.path(D.xs.map((x, i) => [x, D.Fv[i] + f(x)]), { color: 'green', width: 2 });
            bot.path(D.xs.map((x, i) => [x, D.Fv[i] - f(x)]), { color: 'teal', width: 2 });
          } else bot.corner('F(x) = ∞ for every x > 0', 'tl', { color: 'red', weight: 600 });
          const stepPts = []; for (let i = 0; i <= N; i++) { stepPts.push([T[i], VN[i]]); if (i < N) stepPts.push([T[i + 1], VN[i]]); }
          bot.path(stepPts, { color: 'gold', width: 1.8 });
          let mono = Infinity;
          if (Fd.ac) for (let i = 1; i < D.xs.length; i++) { const dF = D.Fv[i] - D.Fv[i - 1], df = f(D.xs[i]) - f(D.xs[i - 1]); mono = Math.min(mono, dF + df, dF - df); }
          st = { N, VN: VN[N], F: Ftot, ac: Fd.ac, mono };
        });
        v.readout(() => (st.ac
          ? `$V_N(1)=${v.fix(st.VN, 4)}\\le F(1)=${v.fix(st.F, 4)}$ — refining the partition pushes $V_N$ up to $F$; $F+f$ and $F-f$ never decrease, since $F$ grows at least as fast as $|f|$ changes.`
          : `$V_N(1)=${v.fix(st.VN, 4)}$ grows like $\\frac{2}{\\pi}\\log N$ along suitable partitions: $x\\sin(1/x)$ has infinite variation, hence is not AC.`));
      },
    },
    // ------------------------------------------------------------------ 7.20
    {
      num: '7.20',
      kind: 'Theorem',
      name: 'Fundamental theorem of calculus for AC functions',
      statement: String.raw`If $f:[a,b]\to\R$ is AC, then $f$ is differentiable at almost every point of $[a,b]$, $f'\in L^1(m)$, and
$$f(x)-f(a)=\int_a^x f'\,dm\qquad(a\le x\le b).$$`,
      idea: String.raw`By 7.19, $f=\frac12(F+f)-\frac12(F-f)$ with $F\pm f$ nondecreasing and AC. Each of these satisfies (c) of Theorem 7.18, and the conclusion is linear in $f$. Without absolute continuity the integral formula can fail even for continuous increasing $f$ that are differentiable a.e.: the Cantor function is the standard example.`,
      caption: String.raw`The difference quotients $q_h(x)=\frac{f(x+h)-f(x)}{h}$ (gold) converge to $f'$ almost everywhere, and their integrals $\int_0^xq_h\,dm$ are averages of $f$ that tend to $f(x)-f(0)$. For an AC function $q_h\to f'$ in $L^1$ as well (readout), so $\int_0^xf'\,dm=f(x)-f(0)$. For the Cantor function, $q_h\to0$ a.e., yet $\int_0^1q_h\,dm\approx1$: as $h\to0$ the mass of $q_h$ piles up on the null set $C$, and none of it survives in $\int f'=0$.`,
      deps: ['rca-7.19', 'rca-7.18'],
      see: ['pma-6.21'],
      tags: ['fundamental theorem of calculus', 'absolute continuity'],
      viz(v) {
        const M = v.M;
        const A0 = 0.4;
        const sg = (t) => Math.sign(t - A0) * Math.sqrt(Math.abs(t - A0));
        // AC example: f = ∫ g with g = 0.6 + 0.25|t−0.4|^{-1/2} + 0.3cos 8t (unbounded but integrable)
        const acF = (x) => { const t = M.clamp(x, 0, 1); return 0.6 * t + 0.5 * (sg(t) - sg(0)) + 0.3 * (Math.sin(8 * t) / 8); };
        const acD = (x) => 0.6 + 0.25 / Math.sqrt(Math.abs(x - A0)) + 0.3 * Math.cos(8 * x);
        const acI = (x) => { // ∫_0^x acF for x ≥ 0 (f extended by f(1) beyond 1)
          const t = Math.min(x, 1), ab = (s) => (2 / 3) * Math.pow(Math.abs(s - A0), 1.5);
          const base = 0.3 * t * t + 0.5 * (ab(t) - ab(0)) - 0.5 * sg(0) * t - 0.3 * (Math.cos(8 * t) - 1) / 64;
          return base + (x > 1 ? (x - 1) * acF(1) : 0);
        };
        const FN = {
          ac: { label: 'an AC function', f: acF, I: acI, d: acD, ymid: [-1, 6] },
          cantor: { label: 'Cantor function', f: (x) => cantor(x), I: (x) => cantorInt(x), d: () => 0, ymid: [-0.4, 8] },
        };
        const which = v.select('$f$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'cantor');
        const hS = v.slider('$h$', 0.0003, 0.2, 0.02, { log: true, fmt: (x) => v.fmt(x, 2) });
        const top = v.stage({ x: [-0.02, 1.02], y: [-0.08, 1.12], height: 150, full: true, title: '$f$' });
        const mid = v.stage({ x: [-0.02, 1.02], y: [-1, 6], height: 200, full: true, title: 'difference quotients $q_h$ and the derivative $f\'$' });
        const bot = v.stage({ x: [-0.02, 1.02], y: [-0.08, 1.12], height: 170, full: true, title: '$\\int_0^x q_h\\,dm$, $\\;f(x)-f(0)$ and $\\int_0^x f\'\\,dm$' });
        let st = {};
        v.legend([['gold', '$q_h$ and $\\int_0^x q_h$'], ['accent', '$f\'$ (a.e.)'], ['ink', '$f(x)-f(0)$'], ['green', '$\\int_0^x f\'\\,dm$', { dash: true }]]);
        v.render(() => {
          const F = FN[which.value], h = hS.value, f = F.f;
          const q = (x) => (f(x + h) - f(x)) / h;
          const Iq = (x) => (F.I(x + h) - F.I(x) - (F.I(h) - F.I(0))) / h; // ∫_0^x q_h
          const yTop = Math.max(1.12, (f(1) - f(0)) * 1.1);
          top.setView(null, [-0.08 * yTop, yTop]); bot.setView(null, [-0.08 * yTop, yTop]);
          top.fn(f, { domain: [0, 1], color: 'ink', width: 2, n: 1500 });
          mid.setView(null, F.ymid);
          mid.fn(q, { domain: [0, 1], color: 'gold', width: 1.3, n: 3000, fill: 'gold', fillAlpha: 0.15 });
          if (which.value === 'ac') pieces(mid, F.d, 0, 1, [A0], { color: 'accent', width: 2.2 });
          else mid.hline(0, { color: 'accent', width: 2.2 });
          const ID = which.value === 'ac' ? (x) => intSing(F.d, 0, x, A0) : () => 0;
          bot.fn((x) => f(x) - f(0), { domain: [0, 1], color: 'ink', width: 2, n: 1500 });
          bot.fn(Iq, { domain: [0, 1], color: 'gold', width: 2.2, n: 800 });
          bot.fn(ID, { domain: [0, 1], color: 'green', width: 2.4, dash: [7, 4] });
          // L¹ distance between q_h and f' on [0,1] (midpoint rule; for the Cantor function q_h ≥ 0 and the distance is ∫ q_h exactly)
          let L1;
          if (which.value === 'cantor') L1 = Iq(1);
          else { const n = 20000; L1 = 0; for (let i = 0; i < n; i++) { const x = (i + 0.5) / n; L1 += Math.abs(q(x) - F.d(x)); } L1 /= n; }
          st = { h, L1, I1: Iq(1), which: which.value };
        });
        v.readout(() => `$h=${v.fmt(st.h, 3)}$: $\\;\\int_0^1q_h\\,dm=${v.fix(st.I1, 4)}$, $\\;\\|q_h-f'\\|_{L^1[0,1]}=${v.fix(st.L1, 4)}$` + (st.which === 'ac' ? ' $\\to0$: the quotients converge in $L^1$.' : ' — does not tend to $0$, although $q_h\\to0=f\'$ a.e.'));
      },
    },
    // ------------------------------------------------------------------ 7.21
    {
      num: '7.21',
      kind: 'Theorem',
      name: 'Integrating a derivative that exists everywhere',
      statement: String.raw`If $f:[a,b]\to\R$ is differentiable at every point of $[a,b]$ and $f'\in L^1(m)$ on $[a,b]$, then
$$f(x)-f(a)=\int_a^x f'(t)\,dt\qquad(a\le x\le b).$$`,
      idea: String.raw`It suffices to take $x=b$ and prove $f(b)-f(a)\le\int_a^bf'\,dm$ (apply it to $-f$ as well). The Vitali–Carathéodory theorem 2.25 gives a lower semicontinuous $g>f'$ with $\int_a^b g<\int_a^bf'+\eps$. For $\eta>0$, the function $\Phi(x)=\int_a^x g\,dm-f(x)+f(a)+\eta(x-a)$ is continuous and $\ge0$ near $a$; at the largest $x$ with $\Phi\ge0$ on $[a,x]$, if $x<b$, the inequalities $g(x)>f'(x)$ and lower semicontinuity of $g$ push $\Phi$ above $0$ a little further — a contradiction. Hence $f(b)-f(a)\le\int_a^b g+\eta(b-a)$. Differentiability at *every* point is essential: the Cantor function is differentiable a.e. with $f'=0\in L^1$.`,
      caption: String.raw`Middle: $f'$ (blue) and a lower semicontinuous step function $g>f'$ (orange), built cell by cell from the supremum of $f'$ plus $\eta$. Bottom: $\Phi(x)=\int_0^xg\,dm-(f(x)-f(0))$, which the proof shows is $\ge0$. For $x^{6/5}\sin(x^{-1/2})$ — differentiable everywhere, $f'$ unbounded but integrable — $\Phi\ge0$ and $\int(g-f')$ is small, so $f(1)-f(0)\le\int_0^1f'+$ small. For $x^2\sin(x^{-2})$ the derivative exists everywhere but is not integrable: $\int_\eps^1|f'|$ grows like $\frac4\pi\log\frac1\eps$. For the Cantor function, $g=\eta>0=f'$ a.e., and $\Phi$ goes negative.`,
      deps: ['rca-2.25', 'rca-2.8'],
      see: ['pma-6.21'],
      tags: ['fundamental theorem of calculus', 'semicontinuity'],
      viz(v) {
        const M = v.M;
        const good = (x) => (x <= 0 ? 0 : Math.pow(x, 1.2) * Math.sin(1 / Math.sqrt(x)));
        const goodD = (x) => (x <= 0 ? 0 : 1.2 * Math.pow(x, 0.2) * Math.sin(1 / Math.sqrt(x)) - 0.5 * Math.pow(x, -0.3) * Math.cos(1 / Math.sqrt(x)));
        const bad = (x) => (x <= 0 ? 0 : x * x * Math.sin(1 / (x * x)));
        const badD = (x) => (x <= 0 ? 0 : 2 * x * Math.sin(1 / (x * x)) - (2 / x) * Math.cos(1 / (x * x)));
        const which = v.select('$f$', [{ value: 'good', label: '$x^{6/5}\\sin(x^{-1/2})$' }, { value: 'bad', label: '$x^2\\sin(x^{-2})$' }, { value: 'cantor', label: 'Cantor function' }], 'good');
        const etaS = v.slider('$\\eta$', 0.005, 0.3, 0.05, { log: true, fmt: (x) => v.fmt(x, 2) });
        const epsS = v.slider('$\\varepsilon$ (cut-off at $0$)', 1e-6, 0.1, 0.001, { log: true, fmt: (x) => v.fmt(x, 2) });
        const top = v.stage({ x: [-0.02, 1.02], y: [-0.9, 1.1], height: 150, full: true, title: '$f$' });
        const mid = v.stage({ x: [-0.02, 1.02], y: [-4, 6], height: 190, full: true, title: '$f\'$ and a lower semicontinuous majorant $g$' });
        const bot = v.stage({ x: [-0.02, 1.02], y: [-0.3, 1], height: 170, full: true, title: '$\\Phi(x)=\\int_0^x g\\,dm-(f(x)-f(0))$' });
        // cells uniform in u = x^{-1/2} (one oscillation of f' per 2π in u); below x = 1e-6 use the explicit bound |f'| ≤ 1.2 + 0.5 x^{-0.3}
        const XMIN = 1e-6;
        const cells = []; for (let u = 1; u < 1 / Math.sqrt(XMIN); u += M.TAU / 28) cells.push(1 / (u * u));
        cells.push(XMIN); cells.reverse(); // increasing x from XMIN to 1
        const SUPS = cells.slice(0, -1).map((a, i) => { const b = cells[i + 1]; let s = -Infinity; for (let k = 0; k <= 8; k++) s = Math.max(s, goodD(a + (b - a) * k / 8)); return s; });
        // ∫_{XMIN}^1 f' computed independently of f: with x = u^{-2}, f'(x)dx becomes (2.4u^{-3.4} sin u − u^{-2.4} cos u) du, smooth in u
        const intGood = M.integrate((u) => 2.4 * Math.pow(u, -3.4) * Math.sin(u) - Math.pow(u, -2.4) * Math.cos(u), 1, 1 / Math.sqrt(XMIN), 120000);
        // ∫_ε^1 |f'| for x² sin(x^{-2}): with u = x^{-2}, |f'|dx = |sin u/u² − cos u/u| du; numerically up to U0, then (2/π) log(U/U0)
        const U0 = 4000, NB = 160000;
        const badCum = (() => { const us = [], cs = [0]; const h = (U0 - 1) / NB; for (let i = 0; i <= NB; i++) us.push(1 + i * h); for (let i = 1; i <= NB; i++) { const a = us[i - 1], b = us[i], m = (a + b) / 2; cs.push(cs[i - 1] + h * Math.abs(Math.sin(m) / (m * m) - Math.cos(m) / m)); } return { us, cs, h }; })();
        const badVar = (eps) => { const U = 1 / (eps * eps); if (U <= U0) { const i = Math.min(NB, Math.floor((U - 1) / badCum.h)); return badCum.cs[i]; } return badCum.cs[NB] + (2 / Math.PI) * Math.log(U / U0); };
        let st = {};
        v.render(() => {
          const key = which.value, eta = etaS.value;
          etaS.el.hidden = key === 'bad'; epsS.el.hidden = key !== 'bad';
          if (key === 'good') {
            v.legend([['ink', '$f$'], ['accent', '$f\'$'], ['orange', '$g>f\'$, lower semicontinuous'], ['green', '$\\Phi\\ge0$', { area: true }]]);
            top.setView(null, [-0.9, 1.1]); top.fn(good, { domain: [0, 1], color: 'ink', width: 1.8, n: 6000 });
            mid.setView(null, [-4, 6]); mid.setTicks(undefined, null);
            bot.setTitle('$\\Phi(x)=\\int_0^x g\\,dm-(f(x)-f(0))$');
            mid.fn(goodD, { domain: [XMIN, 1], color: 'accent', width: 1.2, n: 8000 });
            // g: cell values sup + η; on (0, XMIN): 1.2 + 0.5x^{-0.3} + η
            const gPts = []; cells.slice(0, -1).forEach((a, i) => { gPts.push([a, SUPS[i] + eta], [cells[i + 1], SUPS[i] + eta]); });
            mid.path(gPts, { color: 'orange', width: 1.4 });
            // Φ on the cell endpoints
            let G = 0.5 * Math.pow(XMIN, 0.7) / 0.7 + (1.2 + eta) * XMIN;
            const phi = [[0, 0], [XMIN, G - good(XMIN)]]; let minPhi = phi[1][1];
            cells.slice(0, -1).forEach((a, i) => { const b = cells[i + 1]; G += (SUPS[i] + eta) * (b - a); const p = G - good(b); phi.push([b, p]); minPhi = Math.min(minPhi, p); });
            const top_ = Math.max(...phi.map((p) => p[1])) * 1.15 + 0.02;
            bot.setView([-0.02, 1.02], [-0.2 * top_, top_]);
            bot.path(phi.concat([[1, 0], [0, 0]]), { fill: 'green', fillAlpha: 0.2, stroke: false, close: true });
            bot.path(phi, { color: 'green', width: 2.2 }); bot.hline(0, { color: 'ink', width: 1 });
            st = { key, eta, minPhi, Ig: G, If: intGood + good(XMIN), f1: good(1) };
          } else if (key === 'bad') {
            v.legend([['ink', '$f$'], ['accent', '$f\'$ (clipped)'], ['red', '$\\int_\\varepsilon^1|f\'|\\,dm$ against $\\varepsilon$']]);
            top.setView(null, [-0.9, 1.1]); top.fn(bad, { domain: [0, 1], color: 'ink', width: 1.6, n: 8000 });
            mid.setView(null, [-12, 12]); mid.setTicks(undefined, null);
            mid.fn((x) => M.clamp(badD(x), -11.5, 11.5), { domain: [0.002, 1], color: 'accent', width: 1, n: 9000 });
            const eps = epsS.value;
            bot.setView([-6.2, 0.1], [-0.6, 12]);
            bot.setTitle('$\\varepsilon\\mapsto\\int_\\varepsilon^1|f\'|\\,dm$, against $\\log_{10}\\varepsilon$');
            const ES = logspace(-6, -0.05, 120);
            bot.path(ES.map((e) => [Math.log10(e), badVar(e)]), { color: 'red', width: 2.4 });
            bot.dot(Math.log10(eps), badVar(eps), { color: 'red', r: 5 });
            st = { key, eps, V: badVar(eps) };
          } else {
            v.legend([['ink', '$f=c$'], ['accent', '$f\'=0$ off $C$'], ['orange', '$g=\\eta>f\'$ a.e.'], ['red', '$\\Phi<0$', { area: true }]]);
            top.setView(null, [-0.1, 1.1]); top.fn((x) => cantor(x), { domain: [0, 1], color: 'ink', width: 2, n: 1500 });
            mid.setView(null, [-0.3, 0.6]); mid.setTicks(undefined, [0, 0.2, 0.4]);
            mid.hline(0, { color: 'accent', width: 2.2 }); mid.hline(eta, { color: 'orange', width: 1.8 });
            for (const [a, b] of cantorLevel(5)) mid.rect(a, -0.25, b, -0.18, { fill: 'red', fillAlpha: 0.7, stroke: false });
            mid.text('f′ fails to exist on C (red)', 0.99, -0.12, { align: 'right', size: 11, color: 'red' });
            const phi = (x) => eta * x - cantor(x);
            bot.setView([-0.02, 1.02], [-1.05, 0.25]);
            bot.setTitle('$\\Phi(x)=\\int_0^x g\\,dm-(f(x)-f(0))$');
            bot.between(phi, () => 0, 0, 1, { fill: 'red', fillAlpha: 0.22, n: 800 });
            bot.fn(phi, { domain: [0, 1], color: 'red', width: 2.2, n: 1500 }); bot.hline(0, { color: 'ink', width: 1 });
            st = { key, eta, phi1: phi(1) };
          }
        });
        v.readout(() => (st.key === 'good'
          ? `$\\min\\Phi=${v.fix(Math.max(st.minPhi, 0), 5)}\\ge0$; $\\;f(1)-f(0)=${v.fix(st.f1, 4)}\\le\\int_0^1g=${v.fix(st.Ig, 4)}$, while $\\int_0^1f'=${v.fix(st.If, 4)}$ — the gap $\\int(g-f')$ shrinks with $\\eta$.`
          : st.key === 'bad'
            ? `$\\varepsilon=${v.sci(st.eps, 2)}$: $\\;\\int_\\varepsilon^1|f'|\\,dm\\approx${v.fix(st.V, 3)}$ — unbounded as $\\varepsilon\\to0$, so $f'\\notin L^1$ although $f'$ exists everywhere.`
            : `$\\Phi(1)=\\eta-1=${v.fix(st.phi1, 3)}<0$: with $f'$ defined only a.e., $f(1)-f(0)=1>\\int_0^1f'=0$.`));
      },
    },
  ],
};
