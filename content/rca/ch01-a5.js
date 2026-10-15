// Rudin, Real and Complex Analysis — Chapter 1, part 5: the role played by sets of measure zero.

/** Maximal intervals in [a,b] on which pred holds (sampled, endpoints refined by bisection). */
function intervalsWhere(pred, a, b, n = 1200) {
  const out = []; let prevX = a, prevIn = !!pred(a), start = prevIn ? a : null;
  for (let i = 1; i <= n; i++) {
    const x = a + (b - a) * i / n, inn = !!pred(x);
    if (inn !== prevIn) {
      let lo = prevX, hi = x;
      for (let k = 0; k < 28; k++) { const m = (lo + hi) / 2; if (!!pred(m) === prevIn) lo = m; else hi = m; }
      const t = (lo + hi) / 2;
      if (inn) start = t; else { out.push([start, t]); start = null; }
    }
    prevX = x; prevIn = inn;
  }
  if (start != null) out.push([start, b]);
  return out;
}
const totalLength = (ivs) => ivs.reduce((s, [a, b]) => s + (b - a), 0);
function mid(f, a, b, n = 4000) { const h = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; }
/** Dyadic enumeration 1/2, 1/4, 3/4, 1/8, 3/8, … of the dyadic rationals in (0,1). */
function dyadic(n) { const k = Math.floor(Math.log2(n)) + 1, j = n - 2 ** (k - 1); return (2 * j + 1) / 2 ** k; }

export default {
  collection: 'rca',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.38
    {
      num: '1.38',
      kind: 'Theorem',
      name: 'Termwise integration when Σ∫|fₙ| converges',
      statement: String.raw`Suppose $\{f_n\}$ is a sequence of complex measurable functions defined a.e. on $X$ such that
$$\sum_{n=1}^\infty\int_X|f_n|\,d\mu<\infty .$$
Then the series $f(x)=\sum_{n=1}^\infty f_n(x)$ converges for almost every $x$, $f\in L^1(\mu)$, and
$$\int_X f\,d\mu=\sum_{n=1}^\infty\int_X f_n\,d\mu .$$`,
      idea: String.raw`Let $\varphi=\sum_n|f_n|$ on the set where all $f_n$ are defined. By 1.27, $\int\varphi=\sum\int|f_n|<\infty$, so $\varphi<\infty$ a.e.: off a null set the series converges absolutely. There the partial sums are dominated by $\varphi\in L^1$, and the dominated convergence theorem (1.34) lets the integral pass through the sum.`,
      caption: String.raw`Here $f_n=(-1)^{n+1}a_n|x-q_n|^{-1/2}$ with the $q_n$ running through the dyadic rationals, so $\varphi=\sum|f_n|$ is $+\infty$ on a **dense** set — yet that set is countable, hence null. Drag the gold point $x$: the partial sums $S_N(x)$ (bottom left) settle down. With geometric weights $a_n$ the bars $\int|f_n|$ have a finite sum; with constant weights they do not, and the series diverges everywhere.`,
      deps: ['rca-1.27', 'rca-1.34', 'rca-1.35'],
      tags: ['series', 'measure zero'],
      viz(v) {
        const M = v.M, NB = 40, CL = 3.4;
        const W = {
          geo: { label: 'geometric weights $a_n=0.35\\cdot0.75^{\\,n-1}$', a: (n) => 0.35 * 0.75 ** (n - 1) },
          con: { label: 'constant weights $a_n=0.35$', a: () => 0.35 },
        };
        const which = v.select('', Object.entries(W).map(([value, o]) => ({ value, label: o.label })), 'geo');
        const nS = v.slider('$N$', 1, NB, 12, { int: true });
        const T = v.stage({ x: [-0.01, 1.01], y: [-CL - 0.2, CL + 0.2], height: 290, axes: true, full: true, title: 'the partial sum $S_N=\\sum_{n\\le N}f_n$ (spikes clipped at $\\pm3.4$)' });
        const BL = v.stage({ x: [0, NB + 1], y: [-1, 1], height: 190, axes: 'box', title: '$S_N(x)$ at the gold point, $N=1,\\dots,40$' });
        const BR = v.stage({ x: [0, NB + 1], y: [0, 1], height: 190, axes: 'box', title: '$\\int|f_n|$ and $\\sum_{n\\le N}\\int|f_n|$' });
        const hx = T.handle(0.3, -CL + 0.1, { color: 'gold', label: 'x', constrain: (x) => [M.clamp(x, 0.001, 0.999), -CL + 0.1] });
        const I1 = (q) => 2 * (Math.sqrt(q) + Math.sqrt(1 - q));
        let st = null;
        v.render(() => {
          const A = W[which.value].a, N = nS.value;
          const fn = (n, x) => (n % 2 ? 1 : -1) * A(n) / Math.sqrt(Math.abs(x - dyadic(n)) + 1e-12);
          const S = (K, x) => { let s = 0; for (let n = 1; n <= K; n++) s += fn(n, x); return s; };
          const phi = (K, x) => { let s = 0; for (let n = 1; n <= K; n++) s += Math.abs(fn(n, x)); return s; };
          T.fn((x) => Math.min(phi(N, x), CL), { domain: [0, 1], color: 'orange', width: 1, alpha: 0.5, n: 2400 });
          T.fn((x) => M.clamp(S(N, x), -CL, CL), { domain: [0, 1], color: 'accent', width: 1.6, n: 3000, connect: true });
          for (let n = 1; n <= Math.min(N, 15); n++) T.dot(dyadic(n), 0, { color: 'red', r: 2.6 });
          T.vline(hx.x, { color: 'gold', width: 1.2, dash: [4, 4] });
          // partial sums at x
          const seq = M.range(NB, 1).map((K) => S(K, hx.x));
          const yr = Math.max(1, ...seq.map(Math.abs)) * 1.15;
          BL.setView(null, [-yr, yr]);
          BL.hline(0, { color: 'faint', width: 1 });
          BL.path(seq.map((y, i) => [i + 1, y]), { color: 'gold', width: 1.2, alpha: 0.6 });
          BL.dots(seq.slice(0, N).map((y, i) => [i + 1, y]), { color: 'gold', r: 3.2 });
          BL.dots(seq.slice(N).map((y, i) => [N + i + 1, y]), { color: 'faint', r: 2.4 });
          // integrals
          const ints = M.range(NB, 1).map((n) => A(n) * I1(dyadic(n)));
          const cum = M.partialSums((k) => ints[k], NB);
          const ym = Math.max(...cum.slice(0, N), ints[0]) * 1.15;
          BR.setView(null, [-0.08 * ym, ym]);
          BR.bars(ints, { color: (val, i) => (i < N ? 'accent' : 'faint'), fillAlpha: 0.7 });
          BR.path(cum.slice(0, N).map((y, i) => [i + 1, y]), { color: 'ink', width: 1.4 });
          BR.dots(cum.slice(0, N).map((y, i) => [i + 1, y]), { color: 'ink', r: 2.8 });
          v.legend([['accent', '$S_N$'], ['orange', '$\\sum_{n\\le N}|f_n|$'], ['red', 'the poles $q_n$ (first 15)', { dot: true }], ['gold', 'the point $x$ and $S_N(x)$', { dot: true }]]);
          const signed = M.range(N, 1).reduce((s, n) => s + (n % 2 ? 1 : -1) * A(n) * I1(dyadic(n)), 0);
          const total = which.value === 'geo' ? M.range(400, 1).reduce((s, n) => s + A(n) * I1(dyadic(n)), 0) : Infinity;
          st = { N, x: hx.x, SN: seq[N - 1], cumN: cum[N - 1], total, signed, geo: which.value === 'geo' };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const tot = isFinite(s.total) ? v.fix(s.total, 3) : '\\infty';
          return `$S_{${s.N}}(${v.fix(s.x, 3)})=${v.fix(s.SN, 4)}$; $\\;\\sum_{n\\le ${s.N}}\\int|f_n|=${v.fix(s.cumN, 3)}$, full sum $${tot}$; $\\;\\int S_{${s.N}}=\\sum_{n\\le ${s.N}}\\int f_n=${v.fix(s.signed, 4)}$.` + (s.geo ? '' : ' Terms do not tend to $0$: no convergence anywhere.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.39
    {
      num: '1.39',
      kind: 'Theorem',
      name: 'Functions with vanishing integrals vanish a.e.',
      statement: String.raw`(a) If $f:X\to[0,\infty]$ is measurable, $E\in\mathfrak M$, and $\int_E f\,d\mu=0$, then $f=0$ a.e. on $E$.
(b) If $f\in L^1(\mu)$ and $\int_E f\,d\mu=0$ for every $E\in\mathfrak M$, then $f=0$ a.e. on $X$.
(c) If $f\in L^1(\mu)$ and $\big|\int_X f\,d\mu\big|=\int_X|f|\,d\mu$, then there is a constant $\alpha$ with $\alpha f=|f|$ a.e. on $X$.`,
      idea: String.raw`(a) With $A_n=\{x\in E:f(x)>1/n\}$ we get $\frac1n\mu(A_n)\le\int_E f=0$, and $\{f>0\}\cap E=\bigcup A_n$ is a countable union of null sets. (b) Write $f=u+iv$; taking $E=\{u\ge0\}$ gives $\int u^+=\Re\int_E f=0$, so $u^+=0$ a.e. by (a); likewise $u^-,v^\pm$. (c) In the proof of 1.33, equality forces $\int(|f|-\Re(\alpha f))=0$ with a nonnegative integrand, so $\Re(\alpha f)=|f|$ a.e. by (a), which means $\alpha f=|f|$ a.e.`,
      caption: String.raw`In (a), shrink $f\ge0$ with the scale $s$ and watch the Chebyshev rectangles: the gold box of height $\frac1n$ over $A_n=\{f>\frac1n\}$ sits under the graph, so $\mu(A_n)\le n\int f$. At $s=0$ the integral is $0$, and $f$ is still $2$ at the single point $p$ — zero *almost* everywhere. In (b), the witness sets $\{f>0\}$ and $\{f<0\}$ carry nonzero integrals unless $s=0$. In (c), $s$ controls the set where the phase of $f$ differs from a fixed $\theta_0$: equality $|\int f|=\int|f|$ holds exactly when that set is null — a single deviating point does not matter.`,
      deps: ['rca-1.24', 'rca-1.19', 'rca-1.33', 'rca-1.35'],
      tags: ['measure zero', 'integral'],
      viz(v) {
        const M = v.M, P = 0.22;
        const mode = v.select('', [{ value: 'a', label: '(a) $f\\ge0$' }, { value: 'b', label: '(b) real $f$' }, { value: 'c', label: '(c) equality in 1.33' }], 'a');
        const sS = v.slider('scale $s$', 0, 1, 0.6, { step: 0.01 });
        const nS = v.slider('$n$', 1, 20, 3, { int: true });
        const S = v.stage({ x: [-0.02, 1.02], y: [-0.4, 2.3], height: 320, axes: 'box', full: true, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: ' ' });
        const h = (x) => 1.6 * Math.exp(-(((x - 0.47) / 0.12) ** 2)) + 0.8 * Math.exp(-(((x - 0.82) / 0.06) ** 2));
        const g = (x) => Math.sin(2 * Math.PI * 1.5 * x) + 0.3;
        let st = null;
        v.render(() => {
          const md = mode.value, s = sS.value, n = nS.value;
          if (md === 'a') {
            S.setView(null, [-0.4, 2.3]); S.setTitle('$f=s\\,h$ on $E=[0,1]$, plus $f(p)=2$ at one point $p$');
            const f = (x) => s * h(x);
            const A = intervalsWhere((x) => f(x) > 1 / n, 0, 1, 2000);
            for (const [a, b] of A) S.rect(a, 0, b, 1 / n, { fill: 'gold', fillAlpha: 0.35, color: 'gold', width: 1 });
            S.fn(f, { domain: [0, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.15 });
            S.hline(1 / n, { color: 'orange', width: 1.2, dash: [5, 4] });
            S.tex('1/n', 1.0, 1 / n, { color: 'orange', align: 'right', baseline: 'bottom', dy: -3, size: 13 });
            S.line(P, 0, P, 2, { color: 'red', width: 1.2, dash: [2, 3] }); S.dot(P, 2, { color: 'red', r: 4.5 }); S.dot(P, s * h(P), { color: 'accent', r: 3.5, hollow: true });
            S.tex('f(p)=2', P, 2, { color: 'red', align: 'left', dx: 8, size: 13 });
            for (const [a, b] of A) S.rect(a, -0.3, b, -0.18, { fill: 'gold', fillAlpha: 0.9, stroke: false });
            S.tex('A_n=\\{f>1/n\\}', 0, -0.16, { color: 'gold', align: 'left', baseline: 'bottom', size: 12.5 });
            const I = s * M.integrate(h, 0, 1, 800);
            st = { md, mA: totalLength(A), I, n, s };
            v.legend([['accent', '$f$', { area: true }], ['gold', 'the box $\\frac1n\\chi_{A_n}\\le f$', { area: true }], ['red', 'a single point: measure $0$', { dot: true }]]);
          } else if (md === 'b') {
            S.setView(null, [-1.5, 2.3]); S.setTitle('real $f=s\\,g$, plus $f(p)=2$; the witnesses $E^\\pm=\\{\\pm f>0\\}$');
            const f = (x) => s * g(x);
            const Ep = intervalsWhere((x) => f(x) > 0, 0, 1, 2000), Em = intervalsWhere((x) => f(x) < 0, 0, 1, 2000);
            S.fn((x) => Math.max(f(x), 0), { domain: [0, 1], stroke: false, fill: 'green', fillAlpha: 0.25 });
            S.fn((x) => Math.min(f(x), 0), { domain: [0, 1], stroke: false, fill: 'red', fillAlpha: 0.22 });
            S.fn(f, { domain: [0, 1], color: 'accent', width: 2.2 });
            S.line(P, 0, P, 2, { color: 'red', width: 1.2, dash: [2, 3] }); S.dot(P, 2, { color: 'red', r: 4.5 });
            for (const [a, b] of Ep) S.rect(a, -1.42, b, -1.32, { fill: 'green', fillAlpha: 0.9, stroke: false });
            for (const [a, b] of Em) S.rect(a, -1.3, b, -1.2, { fill: 'red', fillAlpha: 0.9, stroke: false });
            const Ip = Ep.reduce((acc, [a, b]) => acc + M.integrate(f, a, b, 300), 0), Im = Em.reduce((acc, [a, b]) => acc + M.integrate(f, a, b, 300), 0);
            st = { md, Ip, Im, s };
            v.legend([['green', '$\\int_{E^+}f$', { area: true }], ['red', '$\\int_{E^-}f$', { area: true }], ['accent', '$f$']]);
          } else {
            S.setView(null, [-0.5, 2.9]); S.setTitle('phase $\\arg f-\\theta_0$ (radians, $\\theta_0=0.7$) and $|f|$; red: where the phase differs from $\\theta_0$');
            const r = (x) => 0.6 + 0.3 * Math.sin(4 * x);
            const w = 0.4 * s;
            const dev = (x) => (w > 0 && x > 0.55 && x < 0.55 + w ? 1.6 * Math.sin(Math.PI * (x - 0.55) / w) : 0);
            let zr = 0, zi = 0, L1 = 0; const K = 4000;
            for (let i = 0; i < K; i++) { const x = (i + 0.5) / K, ph = 0.7 + dev(x); zr += r(x) * Math.cos(ph) / K; zi += r(x) * Math.sin(ph) / K; L1 += r(x) / K; }
            const D = w > 0 ? [[0.55, 0.55 + w]] : [];
            for (const [a, b] of D) S.vband(a, b, { color: 'red', alpha: 0.12 });
            S.fn(r, { domain: [0, 1], color: 'ink', width: 1.6, dash: [5, 4] });
            S.fn(dev, { domain: [0, 1], color: 'accent', width: 2.4, n: 2400 });
            S.line(P, 0, P, 2.5, { color: 'red', width: 1.2, dash: [2, 3] }); S.dot(P, 2.5, { color: 'red', r: 4.5 });
            S.tex('\\text{one point }p', P, 2.5, { color: 'red', align: 'left', dx: 8, size: 13 });
            st = { md, z: Math.hypot(zr, zi), L1, m: totalLength(D), s };
            v.legend([['accent', '$\\arg f-\\theta_0$'], ['ink', '$|f|$', { dash: true }], ['red', 'where $e^{-i\\theta_0}f\\neq|f|$', { area: true }]]);
          }
        });
        v.readout(() => {
          const t = st; if (!t) return '';
          if (t.md === 'a') return `$\\int f=${v.fix(t.I, 4)}$; $\\;\\mu(A_{${t.n}})=${v.fix(t.mA, 4)}\\ \\le\\ n\\int f=${v.fix(t.n * t.I, 4)}$` + (t.s === 0 ? ' — so every $A_n$ is null and $f=0$ a.e. (though $f(p)=2$).' : '.');
          if (t.md === 'b') return `$\\int_{E^+}f=${v.fix(t.Ip, 4)}$, $\\;\\int_{E^-}f=${v.fix(t.Im, 4)}$` + (t.s === 0 ? ' — both $0$, and indeed $f=0$ a.e.' : ' — a nonzero witness, so not all $\\int_E f$ vanish.');
          return `$\\left|\\int f\\right|=${v.fix(t.z, 4)}$, $\\;\\int|f|=${v.fix(t.L1, 4)}$; the phase differs from $\\theta_0$ on a set of measure $${v.fix(t.m, 4)}$` + (t.m < 1e-9 ? ' — equality, with $\\alpha=e^{-i\\theta_0}$, although one point (measure $0$) still deviates.' : ' — strict inequality.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.40
    {
      num: '1.40',
      kind: 'Theorem',
      name: 'Averages in a closed set force values in it a.e.',
      statement: String.raw`Suppose $\mu(X)<\infty$, $f\in L^1(\mu)$, $S$ is a closed subset of $\C$, and the averages
$$A_E(f)=\frac{1}{\mu(E)}\int_E f\,d\mu$$
lie in $S$ for every $E\in\mathfrak M$ with $\mu(E)>0$. Then $f(x)\in S$ for almost every $x\in X$.`,
      idea: String.raw`Let $\Delta$ be a closed disc with centre $\alpha$ and radius $r$ inside the open set $S^c$, and $E=f^{-1}(\Delta)$. If $\mu(E)>0$, then $|A_E(f)-\alpha|\le\frac1{\mu(E)}\int_E|f-\alpha|\le r$, so the average lies in $\Delta\subset S^c$ — a contradiction. Hence $\mu(E)=0$, and since $S^c$ is a countable union of such discs, $f^{-1}(S^c)$ is a null set.`,
      caption: String.raw`Left: the closed set $S$ (green), the values of $f$ on $X=[0,1]$ (curve), and a closed disc $\Delta$ that you can drag (radius by slider). Right: the distance from $f(x)$ to $S$, with $E=f^{-1}(\Delta)$ in gold. When $f$ leaves $S$ on a set of positive measure, a disc $\Delta$ around the excursion catches it, and the average $A_E(f)$ (gold dot) lands inside $\Delta$ — outside $S$, so the hypothesis fails. When $f$ stays in $S$, every such $E$ is empty.`,
      deps: ['rca-1.33', 'rca-1.19', 'rca-1.12'],
      tags: ['measure zero', 'averages'],
      viz(v) {
        const M = v.M;
        const bump = (t) => (Math.abs(t) < 1 ? Math.cos(Math.PI * t / 2) ** 2 : 0);
        const SETS = {
          disc: { label: '$S=\\{|z|\\le1\\}$', inS: (x, y) => x * x + y * y <= 1, dist: (x, y) => Math.max(0, Math.hypot(x, y) - 1), discOK: (c, r) => Math.hypot(c[0], c[1]) - r > 1 },
          half: { label: '$S=\\{\\Re z\\ge0\\}$', inS: (x) => x >= 0, dist: (x) => Math.max(0, -x), discOK: (c, r) => c[0] + r < 0 },
        };
        const FN = {
          disc: {
            in: (x) => { const r = 0.55 + 0.35 * Math.sin(5 * x), t = 2 * Math.PI * 1.15 * x; return [r * Math.cos(t), r * Math.sin(t)]; },
            out: (x) => { const r = 0.55 + 0.35 * Math.sin(5 * x) + 0.85 * bump((x - 0.63) / 0.09), t = 2 * Math.PI * 1.15 * x; return [r * Math.cos(t), r * Math.sin(t)]; },
            c: [-0.25, -1.4],
          },
          half: {
            in: (x) => [0.15 + 0.85 * x * x, 1.1 * Math.sin(5 * x)],
            out: (x) => [0.15 + 0.85 * x * x - 0.9 * bump((x - 0.38) / 0.1), 1.1 * Math.sin(5 * x)],
            c: [-0.52, 1.02],
          },
        };
        const wS = v.select('', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'disc', { onChange: (k) => hc.set(...FN[k].c) });
        const wF = v.select('', [{ value: 'out', label: '$f$ leaves $S$' }, { value: 'in', label: '$f$ stays in $S$' }], 'out');
        const rS = v.slider('radius of $\\Delta$', 0.05, 0.8, 0.3, { step: 0.01 });
        const L = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, height: 360, ticks: false, title: 'values in $\\C$' });
        const R = v.stage({ x: [-0.02, 1.02], y: [-0.27, 1.2], height: 360, axes: 'box', title: '$\\operatorname{dist}(f(x),S)$ on $X=[0,1]$' });
        const hc = L.handle(-0.25, -1.4, { color: 'red', label: 'Δ' });
        let st = null;
        v.render(() => {
          const Sx = SETS[wS.value], f = FN[wS.value][wF.value], c = [hc.x, hc.y], r = rS.value;
          const g = v.rgb('green');
          L.raster((x, y) => (Sx.inS(x, y) ? [g[0], g[1], g[2], 40] : null), { key: wS.value + v.color('green'), res: 2 });
          if (wS.value === 'disc') L.circle(0, 0, 1, { color: 'green', width: 2 }); else L.vline(0, { color: 'green', width: 2 });
          L.tex('S', wS.value === 'disc' ? -0.55 : 1.2, wS.value === 'disc' ? 0.55 : -1.3, { color: 'green', size: 20 });
          const ok = Sx.discOK(c, r);
          L.circle(c[0], c[1], r, { color: ok ? 'red' : 'muted', width: 2, fill: ok ? 'red' : 'gray', fillAlpha: 0.12, dash: ok ? null : [4, 4] });
          L.curve(f, 0, 1, { color: 'ink', width: 1.8, n: 800 });
          const inD = (x) => { const [a, b] = f(x); return (a - c[0]) ** 2 + (b - c[1]) ** 2 <= r * r; };
          const E = intervalsWhere(inD, 0, 1, 3000);
          const mE = totalLength(E);
          L.path(M.linspace(0, 1, 1500).map((x) => (inD(x) ? f(x) : null)), { color: 'gold', width: 4 });
          let avg = null;
          if (mE > 1e-6) {
            let sr = 0, si = 0;
            for (const [a, b] of E) { sr += mid((x) => f(x)[0], a, b, 400); si += mid((x) => f(x)[1], a, b, 400); }
            avg = [sr / mE, si / mE];
            L.dot(avg[0], avg[1], { color: 'gold', r: 6 });
            L.tex('A_E(f)', avg[0], avg[1], { color: 'gold', dx: -12, dy: 4, align: 'right', baseline: 'top', size: 14 });
          }
          if (!ok) L.corner('Δ meets S — move it into the complement', 'tl', { color: 'muted' });
          // right
          R.fn((x) => Sx.dist(...f(x)), { domain: [0, 1], color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.15 });
          for (const [a, b] of E) { R.vband(a, b, { color: 'gold', alpha: 0.18 }); R.rect(a, -0.12, b, -0.05, { fill: 'gold', fillAlpha: 0.9, stroke: false }); }
          if (E.length) R.tex('E=f^{-1}(\\Delta)', E[E.length - 1][1] + 0.01, -0.085, { color: 'gold', align: 'left', size: 13 });
          v.legend([['green', '$S$', { area: true }], ['ink', '$f([0,1])$'], ['red', 'the disc $\\Delta\\subset S^c$', { area: true }], ['gold', '$E=f^{-1}(\\Delta)$ and $A_E(f)$']]);
          st = { mE, avg, ok, inS: avg ? Sx.inS(avg[0], avg[1]) : null, mOut: totalLength(intervalsWhere((x) => Sx.dist(...f(x)) > 0, 0, 1, 3000)) };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          const head = `$\\mu(f^{-1}(S^c))=${v.fix(s.mOut, 4)}$. `;
          if (!s.ok) return head + 'Place $\\Delta$ inside the complement of $S$.';
          if (!s.avg) return head + '$E=f^{-1}(\\Delta)=\\emptyset$: this disc tests nothing.';
          return head + `$\\mu(E)=${v.fix(s.mE, 4)}>0$ and $A_E(f)=${v.fix(s.avg[0], 3)}${s.avg[1] < 0 ? '-' : '+'}${v.fix(Math.abs(s.avg[1]), 3)}i\\in\\Delta$, so $A_E(f)\\notin S$: the hypothesis of the theorem fails.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.41
    {
      num: '1.41',
      kind: 'Theorem',
      name: 'Borel–Cantelli: summable measures, finitely many hits',
      credit: 'Borel & Cantelli, 1909',
      statement: String.raw`Let $\{E_k\}$ be a sequence of measurable sets in $X$ with
$$\sum_{k=1}^\infty\mu(E_k)<\infty .$$
Then almost every $x\in X$ lies in at most finitely many of the sets $E_k$.`,
      idea: String.raw`Count the hits: $g(x)=\sum_k\chi_{E_k}(x)$ is the number of $k$ with $x\in E_k$. By Theorem 1.27, $\int_X g\,d\mu=\sum_k\mu(E_k)<\infty$, so $g<\infty$ a.e. Equivalently, the set of points hit infinitely often is contained in $\bigcup_{k\ge m}E_k$ for every $m$, whose measure is at most the tail $\sum_{k\ge m}\mu(E_k)\to0$.`,
      caption: String.raw`Arcs $E_k$ of length $\ell_k=\min(1,\,1.5/k^p)$ are laid end to end around the circle $X=[0,1)$, so they keep sweeping over every point. Rows show $E_1,\dots,E_{24}$; the red row is the union of the tail $E_k$, $k>K/2$. Bottom: the hit count $N_K(x)=\#\{k\le K:x\in E_k\}$, with area $\sum_{k\le K}\ell_k$. For $p>1$ the counts stay bounded and the tail union shrinks; for $p=1$ the sum diverges and every point is hit again and again.`,
      deps: ['rca-1.27', 'rca-1.35'],
      tags: ['Borel–Cantelli', 'measure zero'],
      viz(v) {
        const M = v.M, NR = 24, G = 2000;
        const pSel = v.select('$p$', [{ value: 2, label: '$p=2$' }, { value: 1.5, label: '$p=1.5$' }, { value: 1, label: '$p=1$ (divergent)' }], 2);
        const kS = v.slider('$K$', 1, 3000, 200, { log: true, int: true });
        const T = v.stage({ x: [-0.01, 1.01], y: [-1.6, NR + 0.6], height: 300, axes: false, full: true, title: 'the arcs $E_k$ (rows $k=1,\\dots,24$) and the tail union $\\bigcup_{K/2<k\\le K}E_k$' });
        const B = v.stage({ x: [-0.01, 1.01], y: [0, 4], height: 190, axes: 'box', full: true, xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], title: 'the hit count $N_K(x)$' });
        let st = null;
        v.render(() => {
          const p = +pSel.value, K = kS.value;
          const ell = (k) => Math.min(1, 1.5 / k ** p);
          const cnt = new Int32Array(G), tail = new Uint8Array(G);
          let pos = 0, sum = 0;
          const arcs = [];
          for (let k = 1; k <= K; k++) {
            const l = ell(k), a = pos;
            arcs.push([a, l]);
            const i0 = Math.round(a * G), i1 = Math.round((a + l) * G);
            for (let i = i0; i < i1; i++) { cnt[((i % G) + G) % G]++; if (k > K / 2) tail[((i % G) + G) % G] = 1; }
            pos = (pos + l) % 1; sum += l;
          }
          // rows
          for (let k = 1; k <= Math.min(NR, K); k++) {
            const [a, l] = arcs[k - 1], y = NR - k + 0.5;
            T.rect(0, y - 0.32, 1, y + 0.32, { fill: 'grid', fillAlpha: 0.5, stroke: false });
            const segs = a + l <= 1 ? [[a, a + l]] : [[a, 1], [0, a + l - 1]];
            for (const [u, w] of segs) T.rect(u, y - 0.32, w, y + 0.32, { fill: 'accent', fillAlpha: 0.75, stroke: false });
          }
          T.rect(0, -1.4, 1, -0.7, { fill: 'grid', fillAlpha: 0.5, stroke: false });
          let tailM = 0;
          for (let i = 0; i < G;) { if (!tail[i]) { i++; continue; } let j = i; while (j < G && tail[j]) j++; T.rect(i / G, -1.4, j / G, -0.7, { fill: 'red', fillAlpha: 0.8, stroke: false }); tailM += (j - i) / G; i = j; }
          // count function
          let mx = 0; for (let i = 0; i < G; i++) mx = Math.max(mx, cnt[i]);
          B.setView(null, [-0.08 * Math.max(4, mx + 1), Math.max(4, mx + 1)]);
          const pts = []; for (let i = 0; i < G; i++) { pts.push([i / G, cnt[i]], [(i + 1) / G, cnt[i]]); }
          B.path(pts.concat([[1, 0], [0, 0]]), { fill: 'accent', fillAlpha: 0.2, stroke: false, close: true });
          B.path(pts, { color: 'accent', width: 1.4 });
          let mn = Infinity; for (let i = 0; i < G; i++) mn = Math.min(mn, cnt[i]);
          const tailSum = M.range(K - Math.floor(K / 2), Math.floor(K / 2) + 1).reduce((s, k) => s + ell(k), 0);
          v.legend([['accent', '$E_k$ and $N_K$', { area: true }], ['red', 'tail union $\\bigcup_{k>K/2}E_k$', { area: true }]]);
          st = { K, sum, mx, mn, tailM, tailSum, p };
        });
        v.readout(() => {
          const s = st; if (!s) return '';
          return `$K=${s.K}$: $\\int N_K=\\sum_{k\\le K}\\ell_k=${v.fix(s.sum, 3)}$, $\\;${s.mn}\\le N_K\\le ${s.mx}$; $\\;\\mu\\big(\\bigcup_{K/2<k\\le K}E_k\\big)=${v.fix(s.tailM, 3)}\\le\\sum_{K/2<k\\le K}\\ell_k=${v.fix(s.tailSum, 3)}$.`;
        });
      },
    },
  ],
};
