import { measureWeightTerm } from './measure-weight.shared.js';
// Rudin, Real and Complex Analysis — Chapter 6 (part 2): absolute continuity and the Lebesgue–Radon–Nikodym theorem
const TAU = 2 * Math.PI;

/** Catmull–Rom spline through equally spaced values ys on [0,1]. */
function spline(ys) {
  const n = ys.length - 1;
  return (x) => {
    const u = Math.min(Math.max(x, 0), 1) * n, i = Math.min(n - 1, Math.floor(u)), t = u - i;
    const p0 = ys[Math.max(0, i - 1)], p1 = ys[i], p2 = ys[i + 1], p3 = ys[Math.min(n, i + 2)];
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  };
}
/** Running integral of a real function on [0,1] (trapezoid on N cells), returned as a function. */
function antideriv(f, N = 4000) {
  const A = new Float64Array(N + 1); let p = f(0);
  for (let k = 1; k <= N; k++) { const q = f(k / N); A[k] = A[k - 1] + (p + q) / (2 * N); p = q; }
  return (t) => { const u = Math.min(Math.max(t, 0), 1) * N, k = Math.min(N - 1, Math.floor(u)), r = u - k; return A[k] + (A[k + 1] - A[k]) * r; };
}
/** Merge sorted cell indices into maximal runs [i0, i1]. */
function runs(idx) {
  const out = []; let s = null, prev = null;
  for (const i of idx) { if (s === null) { s = prev = i; } else if (i === prev + 1) prev = i; else { out.push([s, prev]); s = prev = i; } }
  if (s !== null) out.push([s, prev]);
  return out;
}

export default {
  collection: 'rca',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ absolute continuity
    {
      num: '6.7',
      kind: 'Definition',
      name: 'Absolute continuity, concentration, mutual singularity',
      statement: String.raw`Let $\mu$ be a positive measure and $\lambda$ a positive or complex measure on a σ-algebra $\mathfrak M$.
(a) $\lambda$ is **absolutely continuous** with respect to $\mu$, written $\lambda\ll\mu$, if $\lambda(E)=0$ for every $E\in\mathfrak M$ with $\mu(E)=0$.
(b) $\lambda$ is **concentrated on** $A\in\mathfrak M$ if $\lambda(E)=\lambda(E\cap A)$ for every $E\in\mathfrak M$ — equivalently, $\lambda(E)=0$ whenever $E\cap A=\varnothing$.
(c) Two measures $\lambda_1,\lambda_2$ on $\mathfrak M$ are **mutually singular**, written $\lambda_1\perp\lambda_2$, if there are disjoint sets $A,B\in\mathfrak M$ with $\lambda_1$ concentrated on $A$ and $\lambda_2$ concentrated on $B$.`,
      idea: String.raw`Absolute continuity says $\lambda$ cannot see what $\mu$ cannot see; mutual singularity says the two measures live on disjoint sets. With $\mu=m$ Lebesgue measure on $[0,1]$: every $f\,dm$ is $\ll m$, while a point mass $\delta_p$ and the Cantor measure are $\perp m$ — they are concentrated on the $m$-null sets $\{p\}$ and $C$, and $m$ is concentrated on the complement. Theorem 6.10 shows that every measure is a sum of one of each kind.`,
      caption: String.raw`Choose $\lambda$ and an $m$-null set $N$ (the Cantor set $C$ or the point $p$), and cover $N$ by sets $E_n$ with $m(E_n)=(2/3)^n$ (orange). Top: the distribution function $t\mapsto\lambda([0,t])$; its rise over $E_n$ (thick red) is $\lambda(E_n)$. Bottom: as $n$ grows, $m(E_n)\to0$ while $\lambda(E_n)\to\lambda(N)$. A density never charges $N$ ($\lambda\ll m$); a point mass or the Cantor measure puts all its mass there ($\lambda\perp m$).`,
      deps: ['rca-1.18', 'rca-6.1'],
      tags: ['absolute continuity', 'singular measures'],
      viz(v) {
        const M = v.M;
        const P = 0.62;
        const f = (x) => 1 + 0.75 * Math.sin(TAU * x);
        const Fa = (x) => x + 0.75 * (1 - Math.cos(TAU * x)) / TAU;
        const LAM = {
          ac: { label: '$f\\,dm$', wf: 1, wc: 0, wp: 0 },
          atom: { label: '$\\delta_p$', wf: 0, wc: 0, wp: 1 },
          cantor: { label: 'Cantor measure', wf: 0, wc: 1, wp: 0 },
          mix: { label: 'mixture', wf: 0.45, wc: 0.35, wp: 0.2 },
        };
        const which = v.select('$\\lambda=$', Object.entries(LAM).map(([value, o]) => ({ value, label: o.label })), 'mix');
        const nullSet = v.select('$N=$', [{ value: 'C', label: 'Cantor set $C$' }, { value: 'p', label: '$\\{p\\}$' }], 'C');
        const nS = v.slider('$n$', 0, 12, 3, { int: true });
        const T = v.stage({ x: [-0.02, 1.02], y: [-0.06, 1.1], height: 270, full: true, axes: 'box', xlabel: 't', title: 'distribution function $t\\mapsto\\lambda([0,t])$ and the cover $E_n\\supset N$' });
        const B = v.stage({ x: [-0.5, 12.5], y: [-0.06, 1.1], height: 190, full: true, axes: 'box', xlabel: 'n', xticks: M.range(13), title: '$m(E_n)$ and $\\lambda(E_n)$' });
        const lamI = (L, a, b) => L.wf * (Fa(b) - Fa(a)) + L.wc * (M.cantorFn(b) - M.cantorFn(a)) + (a <= P && P <= b ? L.wp : 0);
        const cdf = (L, t) => L.wf * Fa(t) + L.wc * M.cantorFn(t) + (t >= P ? L.wp : 0);
        const cover = (N, n) => { if (N === 'C') return M.cantorIntervals(n); const len = Math.pow(2 / 3, n), a = M.clamp(P - len / 2, 0, 1 - len); return [[a, a + len]]; };
        let st = null;
        v.legend([['orange', '$E_n$, with $m(E_n)=(2/3)^n$', { area: true }], ['red', 'rise of $\\lambda$ over $E_n$ = $\\lambda(E_n)$'], ['accent', '$\\lambda(E_n)$'], ['orange', '$m(E_n)$']]);
        v.render(() => {
          const L = LAM[which.value], N = nullSet.value, n = nS.value;
          const E = cover(N, n);
          for (const [a, b] of E) T.vband(a, b, { color: 'orange', alpha: 0.16 });
          if (N === 'C' && n >= 5) T.text('E_n = level-n Cantor intervals', 0.5, 1.05, { color: 'orange', align: 'center', size: 11 });
          // the distribution function, with a jump at p
          const ts = M.linspace(0, 1, 1201);
          const pts = [];
          let prevT = -1;
          for (const t of ts) { if (L.wp && prevT < P && t >= P) pts.push([P, cdf(L, P - 1e-12)], null, [P, cdf(L, P)]); pts.push([t, cdf(L, t)]); prevT = t; }
          T.path(pts, { color: 'ink', width: 2 });
          if (L.wp) { T.line(P, cdf(L, P - 1e-12), P, cdf(L, P), { color: 'muted', width: 1.2, dash: [3, 3] }); T.dot(P, cdf(L, P), { color: 'ink', r: 3.5 }); }
          // rise over E_n
          let lamE = 0;
          for (const [a, b] of E) {
            const aa = Math.max(0, a), bb = Math.min(1, b);
            lamE += lamI(L, aa, bb);
            const k = Math.max(2, Math.ceil(60 * (bb - aa)));
            const seg = M.linspace(aa, bb, k + 1).map((t) => [t, cdf(L, t)]);
            T.path(seg, { color: 'red', width: 3.6 });
            if (L.wp && aa <= P && P <= bb) T.line(P, cdf(L, P - 1e-12), P, cdf(L, P), { color: 'red', width: 3.6 });
          }
          if (L.wp || N === 'p') { T.vline(P, { color: 'gold', width: 1, dash: [2, 4] }); T.tex('p', P, 1.1, { color: 'gold', baseline: 'top', align: 'left', dx: 4, dy: 2, size: 14 }); }
          // bottom: m(E_k), λ(E_k) for k = 0..12
          const ms = [], ls = [];
          for (let k = 0; k <= 12; k++) { ms.push([k, Math.pow(2 / 3, k)]); ls.push([k, cover(N, k).reduce((s, [a, b]) => s + lamI(L, Math.max(0, a), Math.min(1, b)), 0)]); }
          const lim = N === 'C' ? L.wc : L.wp;
          B.hline(lim, { color: lim > 0 ? 'red' : 'green', width: 1.4, dash: [6, 4] });
          B.tex(`\\lambda(N)=${v.fix(lim, 2)}`, 12.4, lim, { color: lim > 0 ? 'red' : 'green', align: 'right', baseline: 'bottom', dy: -3, size: 13 });
          B.path(ms, { color: 'orange', width: 2 }); ms.forEach(([x, y]) => B.dot(x, y, { color: 'orange', r: 3 }));
          B.path(ls, { color: 'accent', width: 2.2 }); ls.forEach(([x, y]) => B.dot(x, y, { color: 'accent', r: 3.2 }));
          B.vline(n, { color: 'muted', width: 1, dash: [3, 3] });
          const verdict = L.wc === 0 && L.wp === 0 ? 'λ ≪ m' : L.wf === 0 ? 'λ ⊥ m' : 'λ is neither ≪ m nor ⊥ m';
          T.corner(verdict, 'tl', { color: L.wc === 0 && L.wp === 0 ? 'green' : L.wf === 0 ? 'red' : 'orange', weight: 600, dx: 30 });
          st = { n, mE: Math.pow(2 / 3, n), lamE, lim, N };
        });
        v.readout(() => {
          if (!st) return '';
          const Nn = st.N === 'C' ? 'C' : '\\{p\\}';
          return String.raw`$m(E_{${st.n}})=${v.fix(st.mE, 4)}$, $\;\lambda(E_{${st.n}})=${v.fix(st.lamE, 4)}$; $\;m(${Nn})=0$ and $\lambda(${Nn})=${v.fix(st.lim, 2)}$` + (st.lim > 0 ? ' — an $m$-null set with positive $\\lambda$-measure, so $\\lambda\\not\\ll m$.' : ' — this null set is not charged.');
        });
      },
    },
    {
      num: '6.8',
      kind: 'Proposition',
      name: 'Calculus of absolute continuity and singularity',
      statement: String.raw`Let $\mu,\lambda,\lambda_1,\lambda_2$ be measures on $\mathfrak M$, with $\mu$ positive.
(a) If $\lambda$ is concentrated on $A$, so is $|\lambda|$.
(b) If $\lambda_1\perp\lambda_2$, then $|\lambda_1|\perp|\lambda_2|$.
(c) If $\lambda_1\perp\mu$ and $\lambda_2\perp\mu$, then $\lambda_1+\lambda_2\perp\mu$.
(d) If $\lambda_1\ll\mu$ and $\lambda_2\ll\mu$, then $\lambda_1+\lambda_2\ll\mu$.
(e) If $\lambda\ll\mu$, then $|\lambda|\ll\mu$.
(f) If $\lambda_1\ll\mu$ and $\lambda_2\perp\mu$, then $\lambda_1\perp\lambda_2$.
(g) If $\lambda\ll\mu$ and $\lambda\perp\mu$, then $\lambda=0$.`,
      idea: String.raw`For (a): if $E\cap A=\varnothing$ and $\{E_j\}$ partitions $E$, every $\lambda(E_j)=0$, so $|\lambda|(E)=0$; (b) follows. For (c), if $\lambda_i$ lives on $A_i$ and $\mu$ on $B_i$ with $A_i\cap B_i=\varnothing$, then $\lambda_1+\lambda_2$ lives on $A_1\cup A_2$ and $\mu$ on $B_1\cap B_2$. (d) is immediate. For (e), if $\mu(E)=0$ then every piece of a partition of $E$ is $\mu$-null, so all $\lambda(E_j)=0$. For (f), $\lambda_2$ lives on a $\mu$-null set $A$; by (a)-type reasoning $\lambda_1(E)=0$ for every $E\subset A$, so $\lambda_1$ lives on the complement of $A$. (g) applies (f) with $\lambda_1=\lambda_2=\lambda$: a measure singular to itself is $0$.`,
      caption: String.raw`Part (f) in the unit square, $\mu$ = area. $\lambda_1$ has a density (blue cloud; drag its centre), $\lambda_2$ is spread uniformly along a circle plus a point mass (red; drag both). Their supports overlap, yet they are mutually singular: $\lambda_2$ lives on the area-null set $N$ = circle ∪ $\{p\}$, so $\lambda_1(N)=0$ and $\lambda_1$ lives on the complement. Shrink the orange neighbourhood $E_\delta\supset N$: its area and its $\lambda_1$-mass go to $0$, its $\lambda_2$-mass stays $1$.`,
      deps: ['rca-6.7', 'rca-6.1', 'rca-6.2'],
      tags: ['absolute continuity', 'singular measures'],
      viz(v) {
        const M = v.M;
        const SIG = 0.13;
        const S = v.stage({ x: [-0.03, 1.03], y: [-0.03, 1.03], equal: true, height: 400, axes: false, weight: 1.25, title: 'area $\\mu$, a density $\\lambda_1$ and a singular $\\lambda_2$' });
        const R = v.stage({ x: [-3.92, -0.92], y: [-0.04, 1.08], height: 400, axes: 'box', weight: 1, xlabel: 'δ', title: 'masses of $E_\\delta$ as $\\delta\\to0$ (log scale)',
          xticks: [[-3, '0.001'], [-2, '0.01'], [-1, '0.1']] });
        const c1 = S.handle(0.4, 0.45, { color: 'blue', label: 'λ₁', labelPos: 'nw', constrain: { x: [0.05, 0.95], y: [0.05, 0.95] } });
        const rS = v.slider('circle radius', 0.12, 0.32, 0.24, { step: 0.01 });
        const dS = v.slider('$\\delta$', 0.002, 0.12, 0.04, { log: true, decimals: 3 });
        const c2 = S.handle(0.56, 0.52, { color: 'red', r: 6, constrain: (x, y) => { const r = rS.value + 0.01; return [M.clamp(x, r, 1 - r), M.clamp(y, r, 1 - r)]; } });
        const p = S.handle(0.2, 0.8, { color: 'red', label: 'p', labelPos: 'ne', constrain: { x: [0.04, 0.96], y: [0.04, 0.96] } });
        let Zc = null, Zkey = '';
        const rho = (x, y) => Math.exp(-((x - c1.x) ** 2 + (y - c1.y) ** 2) / (2 * SIG * SIG));
        const norm = () => {
          const key = `${c1.x.toFixed(4)},${c1.y.toFixed(4)}`;
          if (key !== Zkey) { let s = 0; const n = 120; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += rho((i + 0.5) / n, (j + 0.5) / n); Zc = s / (n * n); Zkey = key; }
          return Zc;
        };
        const inSq = (x, y) => x >= 0 && x <= 1 && y >= 0 && y <= 1;
        // masses of E_δ = {dist to circle < δ} ∪ B(p, δ) by polar quadrature
        const masses = (d) => {
          const r = rS.value, Z = norm();
          let area = 0, l1 = 0;
          const ns = 24, na = 240;
          for (let i = 0; i < ns; i++) {
            const s = r - d + 2 * d * (i + 0.5) / ns, ds = 2 * d / ns;
            for (let j = 0; j < na; j++) { const a = TAU * j / na, x = c2.x + s * Math.cos(a), y = c2.y + s * Math.sin(a); if (!inSq(x, y)) continue; const w = s * ds * TAU / na; area += w; l1 += w * rho(x, y) / Z; }
          }
          for (let i = 0; i < ns; i++) {
            const s = d * (i + 0.5) / ns, ds = d / ns;
            for (let j = 0; j < 90; j++) {
              const a = TAU * j / 90, x = p.x + s * Math.cos(a), y = p.y + s * Math.sin(a);
              if (!inSq(x, y) || Math.abs(Math.hypot(x - c2.x, y - c2.y) - r) < d) continue;
              const w = s * ds * TAU / 90; area += w; l1 += w * rho(x, y) / Z;
            }
          }
          return { area, l1, l2: 1 };
        };
        let st = null, curveCache = null;
        v.legend([['blue', '$\\lambda_1=\\rho\\,d\\mu\\ll\\mu$', { area: true }], ['red', '$\\lambda_2\\perp\\mu$: $0.7\\times$ arc length $+\\,0.3\\,\\delta_p$'], ['orange', '$E_\\delta\\supset N$', { area: true }]]);
        v.render(() => {
          const r = rS.value, d = dS.value;
          c2.x = M.clamp(c2.x, r + 0.01, 0.99 - r); c2.y = M.clamp(c2.y, r + 0.01, 0.99 - r);
          const blue = v.rgb('blue');
          const Z = norm();
          S.raster((x, y) => { if (!inSq(x, y)) return null; const t = rho(x, y) / Z / 9.5; return [blue[0], blue[1], blue[2], Math.round(255 * Math.min(0.85, t))]; }, { key: `${Zkey}|${blue}`, res: 3 });
          S.rect(0, 0, 1, 1, { color: 'muted', width: 1.2 });
          // E_δ
          const ring = (rad) => M.linspace(0, TAU, 181).map((a) => [c2.x + rad * Math.cos(a), c2.y + rad * Math.sin(a)]);
          S.rings([ring(r + d), ring(Math.max(0, r - d)).reverse()], { fill: 'orange', fillAlpha: 0.28, stroke: false });
          S.circle(p.x, p.y, d, { fill: 'orange', fillAlpha: 0.28, stroke: false });
          S.circle(c2.x, c2.y, r, { color: 'red', width: 2.6 });
          S.dot(p.x, p.y, { color: 'red', r: 3 });
          // right panel: masses as functions of δ
          const ckey = [c1.x, c1.y, c2.x, c2.y, p.x, p.y, r].map((z) => z.toFixed(4)).join();
          if (!curveCache || curveCache.key !== ckey) curveCache = { key: ckey, curves: M.linspace(-3, 0, 37).map((e) => Math.pow(10, e) * 0.12).map((dd) => [Math.log10(dd), masses(dd)]) };
          const curves = curveCache.curves;
          R.setView([Math.log10(0.12 / 1000), Math.log10(0.12)], [-0.04, 1.08]);
          R.path(curves.map(([x, m]) => [x, m.area]), { color: 'orange', width: 2.2 });
          R.path(curves.map(([x, m]) => [x, m.l1]), { color: 'blue', width: 2.2 });
          R.path(curves.map(([x, m]) => [x, m.l2]), { color: 'red', width: 2.2 });
          const now = masses(d);
          R.vline(Math.log10(d), { color: 'muted', width: 1, dash: [3, 3] });
          R.dot(Math.log10(d), now.area, { color: 'orange', r: 4.5 });
          R.dot(Math.log10(d), now.l1, { color: 'blue', r: 4.5 });
          R.dot(Math.log10(d), now.l2, { color: 'red', r: 4.5 });
          R.tex('\\lambda_2(E_\\delta)', R.bounds.x[0], 1, { color: 'red', align: 'left', baseline: 'top', dx: 30, dy: 6, size: 13 });
          const lab = curves[curves.length - 7];
          R.tex('\\lambda_1(E_\\delta)', lab[0], lab[1].l1, { color: 'blue', align: 'right', baseline: 'bottom', dx: -6, dy: -4, size: 13 });
          R.tex('\\mu(E_\\delta)', lab[0], lab[1].area, { color: 'orange', align: 'left', baseline: 'top', dx: 8, dy: 4, size: 13 });
          st = { d, ...now };
        });
        v.readout(() => {
          if (!st) return '';
          return String.raw`$\delta=${v.fix(st.d, 3)}$: $\;\mu(E_\delta)=${v.fix(st.area, 4)}$, $\;\lambda_1(E_\delta)=${v.fix(st.l1, 4)}$, $\;\lambda_2(E_\delta)=1$. Letting $\delta\to0$: $\mu(N)=\lambda_1(N)=0$ and $\lambda_2(N^c)=0$, so $\lambda_1\perp\lambda_2$.`;
        });
      },
    },
    {
      num: '6.9',
      kind: 'Lemma',
      name: 'A σ-finite measure has an integrable positive weight',
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Lemma 6.9 and proof, p. 121 (construction rescaled by 1/2 to cover the zero measure)'],
      statement: String.raw`If $\mu$ is a positive σ-finite measure on a σ-algebra $\mathfrak M$ in $X$, then there is $w\in L^1(\mu)$ with $0<w(x)<1$ for every $x\in X$.`,
      idea: String.raw`Write $X=\bigcup_n E_n$ with $\mu(E_n)<\infty$ and set
$$w=\sum_{n=1}^\infty w_n,\qquad w_n=\frac{2^{-n-1}}{1+\mu(E_n)}\,\chi_{E_n}.$$
Each $x$ lies in some $E_n$, so $w(x)>0$; also $w\le\sum 2^{-n-1}=1/2<1$, and $\int w\,d\mu=\sum 2^{-n-1}\mu(E_n)/(1+\mu(E_n))<1$ by monotone convergence (1.27). The factor $1/2$ rescales the book's construction so the strict upper bound also holds when $\mu=0$. The point: $d\tilde\mu=w\,d\mu$ is a *finite* measure with exactly the same null sets as $\mu$, which lets 6.10 and 6.16 reduce to finite measures.`,
      caption: String.raw`Pick a σ-finite measure and its exhausting sets $E_n$, and add the terms $w_n$ one by one (stacked layers, one colour per $n$). Top: the partial sums $w_N$ on a linear scale. Bottom: $\log_{10}w_N$, which shows that every point eventually gets a positive weight, however small, while the total $\int w\,d\mu$ stays below $1$.`,
      deps: ['rca-2.16', 'rca-1.27', 'rca-1.30'],
      tags: ['σ-finite measures', 'weights'],
      viz(v) {
        const M = v.M;
        const COLS = ['blue', 'orange', 'purple', 'teal', 'pink', 'gold', 'green'];
        const SETS = {
          nest: { label: 'Lebesgue, $E_n=[-n,n]$', disc: false, inE: (x, n) => Math.abs(x) <= n, mu: (n) => 2 * n },
          disj: { label: 'Lebesgue, $E_n=\\{n-1\\le|x|<n\\}$', disc: false, inE: (x, n) => Math.abs(x) >= n - 1 && Math.abs(x) < n, mu: () => 2 },
          count: { label: 'counting on $\\mathbb Z$, $E_n=\\{|k|\\le n\\}$', disc: true, inE: (x, n) => Math.abs(x) <= n, mu: (n) => 2 * n + 1 },
        };
        const which = v.select('', Object.entries(SETS).map(([value, o]) => ({ value, label: o.label })), 'nest');
        const NS = v.slider('terms $N$', 1, 12, 4, { int: true });
        const T = v.stage({ x: [-8.6, 8.6], y: [0, 0.3], height: 250, full: true, axes: 'box', xlabel: 'x', title: 'stacked terms $w_n=\\frac{2^{-n-1}}{1+\\mu(E_n)}\\chi_{E_n}$, $n\\le N$' });
        const B = v.stage({ x: [-8.6, 8.6], y: [-9, 0], height: 190, full: true, axes: 'box', xlabel: 'x', title: '$\\log_{10} w_N(x)$ (dashed: the full sum $w$)' });
        let st = null;
        v.render(() => {
          const S = SETS[which.value], N = NS.value;
          const h = (n) => measureWeightTerm(n, S.mu(n));
          const wN = (x, NN) => { let s = 0; for (let n = 1; n <= NN; n++) if (S.inE(x, n)) s += h(n); return s; };
          const top = Math.max(wN(0, 40), wN(0.5, 40)) * 1.15;
          T.setView(null, [-0.07 * top, top]);
          // stacked layers, cell by cell
          const cells = S.disc ? M.range(17, -8).map((k) => [k - 0.3, k + 0.3, k]) : M.range(17, -8).flatMap((m) => [[m - 0.5, m, m - 0.25], [m, m + 0.5, m + 0.25]]);
          for (const [a, b, xm] of cells) {
            if (b < -8.6 || a > 8.6) continue;
            let base = 0;
            for (let n = 1; n <= N; n++) {
              if (!S.inE(xm, n)) continue;
              T.rect(a, base, b, base + h(n), { fill: COLS[(n - 1) % COLS.length], fillAlpha: 0.7, color: 'panel', width: 0.6 });
              base += h(n);
            }
          }
          for (let n = 1; n <= Math.min(N, 2); n++) {
            const xm = S.disc ? n : n - 0.25;
            if (h(n) > 0.12 * top) T.tex(`w_${n}`, xm, h(n) / 2, { color: 'panel', size: 14 });
          }
          // log panel
          const xs = S.disc ? M.range(17, -8) : M.linspace(-8.6, 8.6, 1400);
          const logPts = (NN) => xs.map((x) => { const w = wN(x, NN); return w > 0 ? [x, Math.log10(w)] : null; });
          if (S.disc) {
            xs.forEach((x) => { const w = wN(x, 60); B.dot(x, Math.log10(w), { color: 'muted', r: 3, hollow: true }); const wn = wN(x, N); if (wn > 0) B.dot(x, Math.log10(wn), { color: 'accent', r: 3.5 }); });
          } else {
            B.path(logPts(60), { color: 'muted', width: 1.6, dash: [5, 4] });
            B.path(logPts(N), { color: 'accent', width: 2.4 });
          }
          const integral = M.range(N, 1).reduce((s, n) => s + Math.pow(2, -n - 1) * S.mu(n) / (1 + S.mu(n)), 0);
          const full = M.range(60, 1).reduce((s, n) => s + Math.pow(2, -n - 1) * S.mu(n) / (1 + S.mu(n)), 0);
          const covered = S.disc ? `|k| ≤ ${N}` : which.value === 'nest' ? `|x| ≤ ${N}` : `|x| < ${N}`;
          B.corner(`w_N > 0 exactly where ${covered}`, 'bl', { color: 'accent', weight: 600, dx: 22, dy: -14 });
          st = { N, integral, full, w0: wN(0, 60), w8: wN(8, 60) };
        });
        v.readout(() => {
          if (!st) return '';
          return String.raw`$\int w_{${st.N}}\,d\mu=${v.fix(st.integral, 4)}$, $\;\int w\,d\mu=\sum_n 2^{-n-1}\frac{\mu(E_n)}{1+\mu(E_n)}=${v.fix(st.full, 4)}<1$; $\;w(0)=${v.fmt(st.w0, 3)}$, $\;w(8)=${v.fmt(st.w8, 3)}>0$.`;
        });
      },
    },
    {
      num: '6.10',
      kind: 'Theorem',
      name: 'Lebesgue–Radon–Nikodym theorem',
      credit: 'Radon & Nikodym, 1913',
      statement: String.raw`Let $\mu$ be a positive σ-finite measure on a σ-algebra $\mathfrak M$ in $X$, and let $\lambda$ be a complex measure on $\mathfrak M$.
(a) There is a unique pair of complex measures $\lambda_a,\lambda_s$ on $\mathfrak M$ with
$$\lambda=\lambda_a+\lambda_s,\qquad\lambda_a\ll\mu,\qquad\lambda_s\perp\mu .$$
If $\lambda$ is positive and finite, so are $\lambda_a$ and $\lambda_s$.
(b) There is a unique $h\in L^1(\mu)$ with $\lambda_a(E)=\int_E h\,d\mu$ for every $E\in\mathfrak M$.

The pair $(\lambda_a,\lambda_s)$ is the **Lebesgue decomposition** of $\lambda$ relative to $\mu$; part (b) is the **Radon–Nikodym theorem**, and $h=d\lambda_a/d\mu$ is the Radon–Nikodym derivative.`,
      idea: String.raw`Uniqueness: two decompositions give $\lambda_a-\lambda_a'=\lambda_s'-\lambda_s$, a measure both $\ll\mu$ and $\perp\mu$, hence $0$ by 6.8. Existence (von Neumann) for positive bounded $\lambda$: with $w$ from 6.9 put $d\varphi=d\lambda+w\,d\mu$. By Schwarz, $f\mapsto\int f\,d\lambda$ is bounded on $L^2(\varphi)$, so 4.12 gives $g$ with $\int f\,d\lambda=\int fg\,d\varphi$. Averages over sets show $0\le g\le1$ (1.40). The set $B=\{g=1\}$ has $\int_B w\,d\mu=0$, i.e. $\mu(B)=0$: put $\lambda_s=\lambda|_B$. On $A=\{g<1\}$, $(1-g)\,d\lambda=gw\,d\mu$, and $h=gw/(1-g)$ gives $\lambda_a=\lambda|_A=h\,d\mu$ by monotone convergence. Complex $\lambda$: split into real and imaginary, positive and negative parts.`,
      caption: String.raw`$\mu$ = Lebesgue measure on $[0,1]$; $\lambda=h\,dx+a\,\delta_p+c\cdot$(Cantor measure). Shape $h$ with the green handles and move the atom $p$. Top: the ratios $\lambda(I)/\mu(I)$ on $3^k$ bins. Where only $\lambda_a$ lives they settle on $h$; bins carrying singular mass (red) blow up as $k$ grows, while their total length shrinks to $0$. Bottom: von Neumann's $g=d\lambda/d(\lambda+\mu)$, which tends to $1$ exactly on the carrier $B$ of $\lambda_s$; on $A$ one recovers $h=g/(1-g)$.`,
      deps: ['rca-6.9', 'rca-4.12', 'rca-6.8', 'rca-1.40', 'rca-1.29', 'rca-6.7'],
      see: ['pma-6.17'],
      tags: ['Radon–Nikodym', 'Lebesgue decomposition'],
      viz(v) {
        const M = v.M;
        const kS = v.slider('bins $3^k$, $k=$', 1, 7, 4, { int: true });
        const aS = v.slider('atom mass $a$', 0, 0.5, 0.25, { step: 0.01 });
        const cS = v.slider('Cantor part $c$', 0, 0.6, 0.3, { step: 0.01 });
        const T = v.stage({ x: [-0.02, 1.02], y: [-0.25, 3.6], height: 260, full: true, axes: 'box', title: 'ratios $\\lambda(I)/\\mu(I)$ over the bins $I$; green: $h=d\\lambda_a/d\\mu$' });
        const Bt = v.stage({ x: [-0.02, 1.02], y: [-0.1, 1.14], height: 200, full: true, axes: 'box', title: 'von Neumann\'s $g=d\\lambda/d(\\lambda+\\mu)$ on the same bins' });
        const Y0 = [1.1, 1.6, 0.7, 0.45, 1.3];
        const knots = Y0.map((y, i) => T.handle(i / 4, y, { color: 'green', r: 6, constrain: (x, yy) => [i / 4, M.clamp(yy, 0.08, 2.6)] }));
        const atom = T.handle(0.62, 0, { color: 'red', label: 'p', labelPos: 'n', constrain: (x) => [M.clamp(x, 0.01, 0.99), 0] });
        let st = null;
        v.legend([['accent', 'bins with only $\\lambda_a$', { area: true }], ['red', 'bins carrying singular mass', { area: true }], ['green', '$h$ and $g=h/(1+h)$']]);
        v.render(() => {
          const h = spline(knots.map((k) => k.y));
          const H = antideriv(h);
          const k = kS.value, n = Math.pow(3, k), a = aS.value, c = cS.value, p = atom.x;
          const top = 3.6;
          let sing = 0, maxR = 0;
          const bins = [];
          for (let i = 0; i < n; i++) {
            const x0 = i / n, x1 = (i + 1) / n;
            const ac = H(x1) - H(x0), cm = c * (M.cantorFn(x1) - M.cantorFn(x0)), am = p >= x0 && p < x1 ? a : 0;
            const lam = ac + cm + am, r = lam * n, s = cm + am > 1e-12;
            if (s) sing++;
            maxR = Math.max(maxR, r);
            bins.push([x0, x1, r, s]);
          }
          for (const [x0, x1, r, s] of bins) {
            T.rect(x0, 0, x1, Math.min(r, top), { fill: s ? 'red' : 'accent', fillAlpha: s ? 0.55 : 0.3, stroke: false });
            Bt.rect(x0, 0, x1, r / (r + 1), { fill: s ? 'red' : 'accent', fillAlpha: s ? 0.55 : 0.3, stroke: false });
          }
          T.fn(h, { color: 'green', width: 2.6, domain: [0, 1] });
          T.line(p, 0, p, top, { color: 'red', width: 1, dash: [2, 4], alpha: 0.6 });
          if (maxR > top) T.corner(`max ratio ${v.fmt(maxR, 3)} (clipped)`, 'tr', { color: 'red', weight: 600 });
          Bt.hline(1, { color: 'red', width: 1.4, dash: [6, 4] });
          Bt.text('g = 1 on B, the carrier of λ_s', 1, 1, { color: 'red', align: 'right', dy: -10, dx: -4, size: 11.5 });
          Bt.fn((x) => h(x) / (1 + h(x)), { color: 'green', width: 2.4, domain: [0, 1] });
          st = { k, n, sing, len: sing / n, la: H(1), ls: a + c };
        });
        v.readout(() => {
          if (!st) return '';
          return String.raw`$\lambda_a(X)=\int_0^1h\,dx=${v.fix(st.la, 3)}$, $\;\lambda_s(X)=a+c=${v.fix(st.ls, 3)}$. At $k=${st.k}$: ${st.sing} of ${st.n} bins carry singular mass; their total length is $${v.fix(st.len, 4)}\to0=\mu(B)$.`;
        });
      },
    },
    {
      num: '6.11',
      kind: 'Theorem',
      name: 'Absolute continuity as an ε–δ condition',
      statement: String.raw`Let $\mu$ be a positive measure and $\lambda$ a complex measure on $\mathfrak M$. Then $\lambda\ll\mu$ if and only if for every $\eps>0$ there is a $\delta>0$ such that $|\lambda(E)|<\eps$ for every $E\in\mathfrak M$ with $\mu(E)<\delta$.`,
      idea: String.raw`If the $\eps$–$\delta$ condition holds and $\mu(E)=0$, then $|\lambda(E)|<\eps$ for every $\eps$. Conversely, if it fails, there are $\eps>0$ and sets $E_n$ with $\mu(E_n)<2^{-n}$ but $|\lambda|(E_n)\ge|\lambda(E_n)|\ge\eps$. The set $A=\bigcap_n\bigcup_{i\ge n}E_i$ has $\mu(A)=0$, yet $|\lambda|(A)\ge\eps$ by continuity from above (1.19), which is legitimate because $|\lambda|$ is finite (6.4). This contradicts $|\lambda|\ll\mu$ (6.8(e)). Finiteness is essential: $d\lambda=dt/t$ on $(0,1)$ is $\ll m$, yet sets of tiny length near $0$ carry unbounded mass.`,
      caption: String.raw`$\mu$ = Lebesgue measure on $(0,1]$, $\lambda\ge0$. For a given $\eps$ the worst set of measure $\delta$ is a superlevel set of the density (orange), so $\Phi(\delta)=\sup\{\lambda(E):\mu(E)\le\delta\}$ is computed from the decreasing rearrangement (bottom). When $\Phi(\delta)\to0$ the largest admissible $\delta(\eps)$ is marked in green. Try the unbounded $dt/t$ (absolutely continuous but infinite) and a measure with an atom (not absolutely continuous): for both no $\delta$ works.`,
      deps: ['rca-6.8', 'rca-6.4', 'rca-1.19', 'rca-6.7'],
      tags: ['absolute continuity', 'ε–δ'],
      viz(v) {
        const M = v.M;
        const NC = 4000;
        const EX = {
          sqrt: { label: '$\\frac{1}{2\\sqrt t}\\,dt$', f: (t) => 0.5 / Math.sqrt(t), F: (t) => Math.sqrt(t), ymax: 6 },
          wave: { label: '$(1+0.9\\sin 5\\pi t)\\,dt$', f: (t) => 1 + 0.9 * Math.sin(5 * Math.PI * t), F: (t) => t - 0.9 * Math.cos(5 * Math.PI * t) / (5 * Math.PI), ymax: 2.4 },
          inv: { label: '$\\frac{dt}{t}$ (infinite)', f: (t) => 1 / t, F: (t) => (t <= 0 ? -Infinity : Math.log(t)), ymax: 12, infinite: true },
          atom: { label: '$dt+\\frac12\\delta_{1/2}$', f: () => 1, F: (t) => t, ymax: 2.4, atom: 0.5 },
        };
        const which = v.select('$\\lambda=$', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'sqrt');
        const eS = v.slider('$\\varepsilon$', 0.05, 0.6, 0.3, { step: 0.01 });
        const T = v.stage({ x: [-0.01, 1.01], y: [0, 6], height: 240, full: true, axes: 'box', xlabel: 't', title: 'density of $\\lambda$ and a worst set $E$ with $\\mu(E)=\\delta$' });
        const B = v.stage({ x: [0, 0.5], y: [0, 1], height: 210, full: true, axes: 'box', xlabel: 'δ', title: '$\\Phi(\\delta)=\\sup\\{\\lambda(E):\\mu(E)\\le\\delta\\}$' });
        let st = null, cache = null;
        v.legend([['ink', 'density'], ['orange', 'worst set $E$ (superlevel set)', { area: true }], ['accent', '$\\varepsilon$', { dash: true }], ['green', '$\\delta(\\varepsilon)$']]);
        v.render(() => {
          const E = EX[which.value], eps = eS.value;
          if (!cache || cache.w !== which.value) {
            // exact cell masses, then the decreasing rearrangement of the cell averages
            const cells = [];
            for (let i = 0; i < NC; i++) { const a = i / NC, b = (i + 1) / NC; let m = E.F(b) - E.F(a); if (!isFinite(m)) m = Infinity; cells.push({ i, m }); }
            const order = cells.slice().sort((p, q) => q.m - p.m);
            const cum = [0]; for (const c of order) cum.push(cum[cum.length - 1] + c.m);
            cache = { w: which.value, order, cum };
          }
          const { order, cum } = cache;
          const atom = E.atom ? 0.5 : 0;
          const Phi = (d) => atom + cum[Math.min(NC, Math.round(d * NC))];
          // largest δ with Φ(δ) < ε
          let dEps = 0;
          if (atom < eps && !E.infinite) { let lo = 0, hi = NC; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (atom + cum[mid] < eps) lo = mid; else hi = mid - 1; } dEps = lo / NC; }
          const ok = dEps > 0;
          const dShow = ok ? dEps : 0.02;
          // top: density, worst set
          T.setView(null, [0, E.ymax]);
          const sel = order.slice(0, Math.max(1, Math.round(dShow * NC))).map((c) => c.i).sort((p, q) => p - q);
          for (const [i0, i1] of runs(sel)) T.vband(i0 / NC, (i1 + 1) / NC, { color: 'orange', alpha: 0.28 });
          T.fn(E.f, { color: 'ink', width: 2.2, domain: [1e-4, 1], fill: 'ink', fillAlpha: 0.06 });
          if (E.atom) { T.arrow(0.5, 0, 0.5, E.ymax * 0.85, { color: 'red', width: 3, head: 10 }); T.tex('\\tfrac12\\delta_{1/2}', 0.5, E.ymax * 0.88, { color: 'red', align: 'left', baseline: 'bottom', dx: 6, size: 14 }); }
          // bottom: Φ
          const ds = M.linspace(0, 0.5, 400);
          const yTop = E.infinite ? 2 : Math.max(eps * 1.5, Phi(0.5) * 1.08);
          B.setView(null, [0, yTop]);
          B.hband(0, eps, { color: 'accent', alpha: 0.08 });
          B.hline(eps, { color: 'accent', width: 1.6, dash: [6, 4] });
          if (E.infinite) {
            B.corner('Φ(δ) = ∞ for every δ > 0 — no δ works', 'tl', { color: 'red', weight: 600, dx: 30 });
            B.line(0, yTop * 0.97, 0.5, yTop * 0.97, { color: 'red', width: 2.4 });
          } else {
            B.path(ds.map((d) => [d, Phi(d)]), { color: 'ink', width: 2.2 });
            if (E.atom) B.dot(0, atom, { color: 'red', r: 4.5, hollow: true });
            if (ok) {
              B.vline(dEps, { color: 'green', width: 1.6 });
              B.dot(dEps, Phi(dEps), { color: 'green', r: 5 });
              B.tex('\\delta(\\varepsilon)', dEps, yTop, { color: 'green', align: 'left', baseline: 'top', dx: 5, dy: 4, size: 14 });
            } else B.corner(`Φ(δ) ≥ ${v.fix(atom, 2)} for every δ > 0 — no δ works for this ε`, 'tl', { color: 'red', weight: 600, dx: 30 });
          }
          st = { ok, dEps, eps, inf: E.infinite, atom, lamE: E.infinite ? Infinity : Phi(dShow), dShow };
        });
        v.readout(() => {
          if (!st) return '';
          if (st.inf) return String.raw`$\lambda((0,\delta))=\int_0^\delta dt/t=\infty$ for every $\delta>0$: $\lambda\ll\mu$, but $\lambda$ is not a complex measure (it is unbounded), and the $\varepsilon$–$\delta$ condition fails.`;
          if (!st.ok) return String.raw`$\mu(\{1/2\})=0<\delta$ but $\lambda(\{1/2\})=${v.fix(st.atom, 2)}\ge\varepsilon=${v.fix(st.eps, 2)}$: $\lambda\not\ll\mu$, and no $\delta$ works.`;
          return String.raw`$\varepsilon=${v.fix(st.eps, 2)}$: every $E$ with $\mu(E)<\delta=${v.fix(st.dEps, 4)}$ has $\lambda(E)\le\Phi(\delta)<\varepsilon$; the orange set attains $\lambda(E)=${v.fix(st.lamE, 4)}$.` + (st.atom ? String.raw` But for $\varepsilon\le\frac12$ no $\delta$ exists, so $\lambda\not\ll\mu$.` : '');
        });
      },
    },
  ],
};
