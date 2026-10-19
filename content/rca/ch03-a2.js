// Rudin, Real and Complex Analysis — Chapter 3: L^p-Spaces
// Part 2 of 3: the spaces L^p and L^∞, Hölder and Minkowski in L^p, the metric, completeness (3.6–3.11).

/** L^p norm on [0,1] (Lebesgue measure) of sampled values (midpoint rule); p may be Infinity. */
function lpNorm(vals, p) {
  if (p === Infinity) { let m = 0; for (const x of vals) m = Math.max(m, Math.abs(x)); return m; }
  let s = 0; for (const x of vals) s += Math.abs(x) ** p; return (s / vals.length) ** (1 / p);
}
/** ℓ^p norm of a vector (p may be Infinity, or any p > 0). */
function lp(a, p) {
  if (p === Infinity) return Math.max(...a.map(Math.abs));
  return a.reduce((s, x) => s + Math.abs(x) ** p, 0) ** (1 / p);
}
/** The point of the ℓ^p unit sphere where ⟨x, G⟩ is largest, for G on the ℓ^q unit sphere. */
function extremal(G, p) {
  if (p === Infinity) return G.map((g) => (g < 0 ? -1 : 1));
  if (p === 1) { const j = Math.abs(G[0]) >= Math.abs(G[1]) ? 0 : 1; return G.map((g, i) => (i === j ? Math.sign(G[j]) || 1 : 0)); }
  const q = p / (p - 1);
  return G.map((g) => Math.sign(g) * Math.abs(g) ** (q - 1));
}
const fmtP = (p) => (p === Infinity ? '\\infty' : Number.isInteger(p) ? String(p) : p.toFixed(2).replace(/0$/, ''));

export default {
  collection: 'rca',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'The spaces Lᵖ(μ) and the Lᵖ-norm',
      credit: 'F. Riesz, 1910',
      statement: String.raw`Let $\mu$ be a positive measure on $X$ and $0<p<\infty$. For a complex measurable function $f$ on $X$ put
$$\|f\|_p=\Big(\int_X|f|^p\,d\mu\Big)^{1/p},$$
and let $L^p(\mu)$ be the set of all such $f$ with $\|f\|_p<\infty$; $\|f\|_p$ is the $L^p$-norm of $f$. For Lebesgue measure on $\R^k$ one writes $L^p(\R^k)$, and for counting measure on a set $A$ one writes $\ell^p(A)$ (just $\ell^p$ when $A$ is countable): its elements are the functions $x$ on $A$ with $\sum_{\alpha\in A}|x(\alpha)|^p<\infty$.`,
      idea: String.raw`Whether $f\in L^p$ is a question of how fast $|f|$ blows up (near a singularity) or decays (at infinity) compared with the power $p$. The model case $f(x)=x^{-\alpha}$ shows that on $(0,1]$ membership improves as $p$ decreases ($f\in L^p$ iff $\alpha p<1$), while on $[1,\infty)$ it improves as $p$ increases ($f\in L^p$ iff $\alpha p>1$); so on an infinite measure space no $L^p$ contains another.`,
      caption: String.raw`Drag the point $(p,\alpha)$ in the right panel; the left panel shows $|f|^p=x^{-\alpha p}$ and the area $\int|f|^p$ over the part of the domain cut off at $\varepsilon$ (or $R$). Shrink $\varepsilon$ (grow $R$): the area settles down exactly when $(p,\alpha)$ lies in the green region. Switch between the singularity at $0$ and the tail at $\infty$ to see the green region flip across the hyperbola $\alpha p=1$.`,
      deps: [],
      tags: ['Lp spaces'],
      viz(v) {
        const M = v.M;
        const mode = v.select('$f(x)=x^{-\\alpha}$', [{ value: 'zero', label: 'on $(0,1]$' }, { value: 'inf', label: 'on $[1,\\infty)$' }], 'zero');
        const cut = v.slider('cut-off', 0, 1, 0.55, { step: 0.001, fmt: () => '' });
        const L = v.stage({ x: [-0.03, 1.05], y: [-0.4, 8], height: 330, weight: 1.35, axes: 'box', title: 'the integrand $|f|^p=x^{-\\alpha p}$' });
        const R = v.stage({ x: [0, 4.2], y: [0, 2.3], height: 330, axes: 'box', xlabel: 'p', ylabel: 'α', title: 'which $(p,\\alpha)$ give $f\\in L^p$?' });
        const H = R.handle(2, 0.35, { color: 'accent', label: '(p, α)', constrain: { x: [0.25, 4.1], y: [0.05, 2.2] } });
        let last = null, st = {};
        v.render(() => {
          const p = H.x, a = H.y, e = a * p, zero = mode.value === 'zero';
          if (last !== mode.value) { last = mode.value; L.setView(zero ? [-0.03, 1.05] : [0.6, 12.5], zero ? [-0.4, 8] : [-0.06, 1.2]); }
          // cut-off: ε from 0.5 down to 1e-6, or R from 2 up to 1e6 (log scale)
          const c = cut.value;
          const eps = 10 ** (-0.3 - 5.7 * c), Rr = 10 ** (0.3 + 5.7 * c);
          const g = (x) => x ** -e;
          let I, lim, fin;
          if (zero) {
            I = Math.abs(1 - e) < 1e-9 ? Math.log(1 / eps) : (1 - eps ** (1 - e)) / (1 - e);
            fin = e < 1; lim = fin ? 1 / (1 - e) : Infinity;
            L.fn(g, { domain: [eps, 1], stroke: false, fill: 'accent', fillAlpha: 0.22 });
            L.fn(g, { domain: [1e-4, 1], color: 'ink', width: 2.2 });
            L.vline(eps, { color: 'orange', width: 1.5, dash: [4, 3] });
            L.tex(`\\varepsilon = 10^{${v.fix(Math.log10(eps), 1)}}`, Math.max(eps, 0.02), L.bounds.y[1], { color: 'orange', align: 'left', baseline: 'top', dx: 5, dy: 6, size: 13 });
          } else {
            I = Math.abs(e - 1) < 1e-9 ? Math.log(Rr) : (Rr ** (1 - e) - 1) / (1 - e);
            fin = e > 1; lim = fin ? 1 / (e - 1) : Infinity;
            L.fn(g, { domain: [1, Math.min(Rr, 13)], stroke: false, fill: 'accent', fillAlpha: 0.22 });
            L.fn(g, { domain: [1, 13], color: 'ink', width: 2.2 });
            if (Rr < 12.5) L.vline(Rr, { color: 'orange', width: 1.5, dash: [4, 3] });
            else L.arrow(10.6, 0.55, 12.3, 0.55, { color: 'orange', width: 1.5, head: 8 });
            L.tex(`R = 10^{${v.fix(Math.log10(Rr), 1)}}`, Math.min(Rr, 12.3), L.bounds.y[1], { color: 'orange', align: 'right', baseline: 'top', dx: -5, dy: 6, size: 13 });
          }
          L.corner(fin ? `area → ${v.fix(lim, 3)} as the cut-off is removed: f ∈ Lᵖ` : 'area → ∞ as the cut-off is removed: f ∉ Lᵖ', zero ? 'tr' : 'tr', { color: fin ? 'green' : 'red', weight: 600 });
          // parameter plane
          const hyp = (x) => 1 / x;
          if (zero) R.between((x) => Math.min(2.4, hyp(x)), () => 0, 0.01, 4.2, { fill: 'green', fillAlpha: 0.16 });
          else R.between(() => 2.3, (x) => Math.min(2.3, hyp(x)), 0.43, 4.2, { fill: 'green', fillAlpha: 0.16 });
          R.fn(hyp, { domain: [0.43, 4.2], color: 'ink', width: 2 });
          R.tex('\\alpha p = 1', 3.2, hyp(3.2), { color: 'ink', dy: -12, size: 14 });
          R.tex(zero ? 'f\\in L^p' : 'f\\in L^p', zero ? 0.9 : 3.3, zero ? 0.3 : 1.7, { color: 'green', size: 16 });
          R.tex('f\\notin L^p', zero ? 3.3 : 0.9, zero ? 1.7 : 0.3, { color: 'red', size: 16 });
          R.line(p, 0, p, a, { color: 'accent', width: 1, dash: [3, 3] });
          st = { p, a, e, I, lim, fin, zero, eps, Rr };
          v.legend([['ink', '$x^{-\\alpha p}$'], ['accent', 'area up to the cut-off', { area: true }], ['green', '$f\\in L^p$', { area: true }]]);
        });
        v.readout(() => {
          const s = st;
          const lhs = s.zero ? `\\int_{\\varepsilon}^{1} x^{-\\alpha p}\\,dx` : `\\int_{1}^{R} x^{-\\alpha p}\\,dx`;
          return `$p = ${v.fix(s.p, 2)},\\ \\alpha = ${v.fix(s.a, 2)},\\ \\alpha p = ${v.fix(s.e, 3)}$: $\\;${lhs} = ${v.fix(s.I, 3)}$ — ` + (s.fin ? `limit $${v.fix(s.lim, 3)}$, so $\\|f\\|_p = ${v.fix(s.lim ** (1 / s.p), 3)}$.` : 'no finite limit, so $\\|f\\|_p=\\infty$.');
        });
      },
    },

    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Definition',
      name: 'Essential supremum and L∞(μ)',
      statement: String.raw`Let $g:X\to[0,\infty]$ be measurable and let $S$ be the set of real $\alpha$ with $\mu\big(g^{-1}((\alpha,\infty])\big)=0$. The **essential supremum** of $g$ is $\inf S$ (and $\infty$ if $S=\emptyset$); the infimum belongs to $S$, because $g^{-1}((\beta,\infty])$ is the countable union of the null sets $g^{-1}((\beta+1/n,\infty])$. For complex measurable $f$ one sets $\|f\|_\infty=\operatorname{ess\,sup}|f|$ and lets $L^\infty(\mu)$ be the set of *essentially bounded* $f$, those with $\|f\|_\infty<\infty$. Thus $|f(x)|\le\|f\|_\infty$ for almost every $x$, and $\|f\|_\infty$ is the smallest number with this property. For counting measure, $L^\infty$ is written $\ell^\infty$.`,
      idea: String.raw`The ordinary supremum can be changed by redefining $f$ on a set of measure zero; the essential supremum cannot. It is the lowest level $\alpha$ for which the part of $f$ above $\alpha$ is invisible to $\mu$.`,
      caption: String.raw`Drag the level $\alpha$. The orange marks show the set $\{|f|>\alpha\}$ on the axis and its measure. The isolated spikes (click in the panel to add more) carry no measure, so they raise $\sup|f|$ (red) but not $\|f\|_\infty$ (green). Widen the plateau to give the tall piece positive measure: then the essential supremum jumps up to it.`,
      deps: ['rca-3.6'],
      tags: ['Lp spaces', 'measure zero'],
      viz(v) {
        const M = v.M;
        const W = v.slider('plateau width', 0, 0.08, 0, { step: 0.001, decimals: 3 });
        const S = v.stage({ x: [-0.02, 1.02], y: [-0.36, 2.75], height: 350, full: true });
        const base = (x) => 0.95 + 0.38 * Math.sin(2 * Math.PI * (1.4 * x + 0.1)) * Math.exp(-0.6 * x) + 0.12 * Math.sin(2 * Math.PI * 5 * x);
        const PL = 0.62, PH = 1.95;
        let spikes = [[0.18, 2.45], [0.43, 1.85], [0.86, 2.2]];
        const lev = S.handle(0.985, 1.2, { color: 'accent', label: 'α', constrain: (x, y) => [0.985, M.clamp(y, 0, 2.6)] });
        lev.labelPos = 'nw';
        S.onClick((x, y) => { if (x > 0 && x < 0.95 && y > 0 && y < 2.7) spikes.push([x, Math.max(y, base(x) + 0.05)]); });
        v.button('clear spikes', () => { spikes = []; });
        const NS = 4000, X = M.range(NS).map((i) => (i + 0.5) / NS), BV = X.map(base);
        let st = {};
        v.render(() => {
          const w = W.value, a = lev.y;
          const f = (x) => (w > 0 && x >= PL && x <= PL + w ? PH : base(x));
          // measure of {|f| > α}
          let cnt = 0; const runs = []; let run = null;
          for (let i = 0; i < NS; i++) {
            const x = X[i], val = w > 0 && x >= PL && x <= PL + w ? PH : BV[i];
            if (val > a) { cnt++; if (!run) run = [x - 0.5 / NS, x + 0.5 / NS]; else run[1] = x + 0.5 / NS; } else if (run) { runs.push(run); run = null; }
          }
          if (run) runs.push(run);
          const meas = cnt / NS;
          const bmax = Math.max(...BV);
          const ess = w > 0 ? Math.max(bmax, PH) : bmax;
          const sup = Math.max(ess, PH, ...spikes.map((s) => s[1]));
          // drawing
          S.hband(a, 2.75, { color: 'accent', alpha: 0.05 });
          S.fn(f, { domain: [0, 1], color: 'ink', width: 2.2, n: 1600 });
          if (w === 0) { S.line(PL, base(PL), PL, PH, { color: 'ink', width: 1, dash: [2, 3], alpha: 0.6 }); S.dot(PL, PH, { color: 'ink', r: 4.5 }); S.dot(PL, base(PL), { hollow: true, color: 'ink', r: 3.5 }); }
          for (const [x, y] of spikes) { S.line(x, base(x), x, y, { color: 'ink', width: 1, dash: [2, 3], alpha: 0.6 }); S.dot(x, y, { color: 'ink', r: 4.5 }); S.dot(x, base(x), { hollow: true, color: 'ink', r: 3.5 }); }
          S.hline(sup, { color: 'red', dash: [7, 5], width: 1.5 });
          S.hline(ess, { color: 'green', width: 2 });
          S.tex('\\sup|f|', 0.035, sup, { color: 'red', align: 'left', baseline: 'bottom', dy: -2, size: 14 });
          S.tex('\\|f\\|_\\infty = \\operatorname{ess\\,sup}|f|', 0.035, ess, { color: 'green', align: 'left', baseline: 'bottom', dy: -2, size: 14 });
          S.hline(a, { color: 'accent', width: 1.6 });
          for (const [l, r] of runs) S.line(Math.max(0, l), -0.25, Math.min(1, r), -0.25, { color: 'orange', width: 6, cap: 'butt' });
          for (const [x, y] of spikes.concat(w === 0 ? [[PL, PH]] : [])) if (y > a) S.dot(x, -0.25, { color: 'orange', r: 3.2, ring: false });
          S.corner(`μ({|f| > α}) = ${v.fix(meas, 4)}` + (meas === 0 ? '  →  α ≥ ess sup' : ''), 'tr', { color: meas === 0 ? 'green' : 'orange', weight: 600 });
          st = { a, meas, ess, sup };
          v.legend([['ink', '$|f|$ (dots: values on a null set)'], ['orange', '$\\{|f|>\\alpha\\}$'], ['green', '$\\|f\\|_\\infty$'], ['red', '$\\sup|f|$', { dash: true }]]);
        });
        v.readout(() => `$\\alpha = ${v.fix(st.a, 3)}$, $\\;\\mu(\\{|f|>\\alpha\\}) = ${v.fix(st.meas, 4)}$. $\\;\\|f\\|_\\infty = ${v.fix(st.ess, 3)}$` + (st.sup > st.ess + 1e-9 ? `$\\;<\\;\\sup|f| = ${v.fix(st.sup, 3)}$: the excess lives on a set of measure $0$.` : `$\\; = \\sup|f|$.`));
      },
    },

    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: "Hölder's inequality in Lᵖ",
      credit: 'Hölder, 1889',
      statement: String.raw`Let $p$ and $q$ be conjugate exponents with $1\le p\le\infty$. If $f\in L^p(\mu)$ and $g\in L^q(\mu)$, then $fg\in L^1(\mu)$ and
$$\|fg\|_1\le\|f\|_p\,\|g\|_q .$$`,
      idea: String.raw`For $1<p<\infty$ apply 3.5(a) to $|f|$ and $|g|$. For $p=\infty$ (or $p=1$) use that $|f(x)|\le\|f\|_\infty$ for almost every $x$ (3.7): then $|fg|\le\|f\|_\infty|g|$ a.e. and integration gives the claim. Geometrically, for $\|g\|_q=1$ the functional $f\mapsto\int fg$ is at most $1$ on the unit ball of $L^p$, with the maximum attained at $\operatorname{sgn}(g)\,|g|^{q-1}$.`,
      caption: String.raw`Here $\mu$ is counting measure on two points, so $L^p(\mu)=\ell^p$ is $\R^2$ with the $\ell^p$ norm. Drag $f$ (left) and $g$ (right) and change $p$. With $F=f/\|f\|_p$ and $G=g/\|g\|_q$, the green line $\{\langle x,G\rangle=1\}$ only touches the unit ball $B_p$ — at $\operatorname{sgn}(G)|G|^{q-1}$ — so $\langle F,G\rangle\le1$; the right panel is the mirror picture in $\ell^q$. Press the button to move $f$ to the equality case.`,
      deps: ['rca-3.5', 'rca-3.6', 'rca-3.7', 'rca-3.4'],
      see: ['pma-1.35', 'rca-6.16'],
      tags: ['inequalities', 'Lp spaces', 'duality'],
      viz(v) {
        const M = v.M;
        const PS = { '1': [1, Infinity], '1.25': [1.25, 5], '1.5': [1.5, 3], '2': [2, 2], '3': [3, 1.5], '5': [5, 1.25], inf: [Infinity, 1] };
        const sel = v.select('$p$', [{ value: '1', label: '$1$' }, { value: '1.25', label: '$\\tfrac54$' }, { value: '1.5', label: '$\\tfrac32$' }, { value: '2', label: '$2$' }, { value: '3', label: '$3$' }, { value: '5', label: '$5$' }, { value: 'inf', label: '$\\infty$' }], '3');
        const L = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, height: 330, title: '$f$ and the unit ball $B_p$ of $\\ell^p$' });
        const R = v.stage({ x: [-1.75, 1.75], y: [-1.75, 1.75], equal: true, height: 330, title: '$g$ and the unit ball $B_q$ of $\\ell^q$' });
        const hf = L.handle(1.15, 0.35, { color: 'accent', label: 'f' });
        const hg = R.handle(0.45, 1.2, { color: 'orange', label: 'g' });
        let st = {};
        v.button('move $f$ to the equality case', () => {
          const [p, q] = PS[sel.value]; const g = [hg.x, hg.y], ng = Math.max(1e-9, lp(g, q));
          const xs = extremal(g.map((t) => t / ng), p), nf = Math.max(0.3, lp([hf.x, hf.y], p));
          let fx = xs[0] * nf, fy = xs[1] * nf; const k = Math.max(Math.abs(fx), Math.abs(fy)) / 1.6; if (k > 1) { fx /= k; fy /= k; }
          hf.x = fx; hf.y = fy;
        });
        const support = (S, P, G, ext, col) => {
          // the line {x : <x, G> = 1} through the extremal point
          const n = Math.hypot(G[0], G[1]) || 1, t = [-G[1] / n, G[0] / n];
          S.line(ext[0] - 4 * t[0], ext[1] - 4 * t[1], ext[0] + 4 * t[0], ext[1] + 4 * t[1], { color: col, width: 2.2 });
          S.dot(ext[0], ext[1], { color: col, r: 5.5 });
        };
        v.render(() => {
          const [p, q] = PS[sel.value];
          const f = [hf.x, hf.y], g = [hg.x, hg.y];
          const nf = Math.max(1e-9, lp(f, p)), ng = Math.max(1e-9, lp(g, q));
          const F = f.map((t) => t / nf), G = g.map((t) => t / ng);
          const xs = extremal(G, p), ys = extremal(F, q);
          // left: B_p, the functional G, its supporting line, and F
          L.ball(0, 0, 1, { p, fill: 'accent', fillAlpha: 0.13, color: 'accent', width: 2 });
          const n = Math.hypot(G[0], G[1]) || 1, tt = [-G[1] / n, G[0] / n], c = F[0] * G[0] + F[1] * G[1];
          const base = [G[0] * c / (n * n), G[1] * c / (n * n)];
          L.line(base[0] - 4 * tt[0], base[1] - 4 * tt[1], base[0] + 4 * tt[0], base[1] + 4 * tt[1], { color: 'muted', width: 1.2, dash: [5, 4] });
          support(L, p, G, xs, 'green');
          L.tex('\\operatorname{sgn}(G)|G|^{q-1}', xs[0], xs[1], { color: 'green', align: xs[0] >= 0 ? 'left' : 'right', baseline: xs[1] >= 0 ? 'bottom' : 'top', dx: xs[0] >= 0 ? 8 : -8, dy: xs[1] >= 0 ? -6 : 6, size: 13 });
          L.arrow(0, 0, G[0] * 0.55 / n, G[1] * 0.55 / n, { color: 'orange', width: 1.6, head: 7 });
          L.text('G', G[0] * 0.55 / n, G[1] * 0.55 / n, { color: 'orange', math: true, dx: 9, dy: -7 });
          L.line(0, 0, f[0], f[1], { color: 'accent', width: 1.2, dash: [2, 3] });
          L.dot(F[0], F[1], { color: 'accent', r: 4.5, label: 'F', labelPos: 'sw' });
          // right: B_q, the functional F, its supporting line, and G
          R.ball(0, 0, 1, { p: q, fill: 'orange', fillAlpha: 0.13, color: 'orange', width: 2 });
          support(R, q, F, ys, 'green');
          R.tex('\\operatorname{sgn}(F)|F|^{p-1}', ys[0], ys[1], { color: 'green', align: ys[0] >= 0 ? 'left' : 'right', baseline: ys[1] >= 0 ? 'bottom' : 'top', dx: ys[0] >= 0 ? 8 : -8, dy: ys[1] >= 0 ? -6 : 6, size: 13 });
          const m = Math.hypot(F[0], F[1]) || 1;
          R.arrow(0, 0, F[0] * 0.55 / m, F[1] * 0.55 / m, { color: 'accent', width: 1.6, head: 7 });
          R.text('F', F[0] * 0.55 / m, F[1] * 0.55 / m, { color: 'accent', math: true, dx: 9, dy: -7 });
          R.line(0, 0, g[0], g[1], { color: 'orange', width: 1.2, dash: [2, 3] });
          R.dot(G[0], G[1], { color: 'orange', r: 4.5, label: 'G', labelPos: 'sw' });
          L.corner(`p = ${p === Infinity ? '∞' : p}`, 'tl', { color: 'accent', weight: 600 });
          R.corner(`q = ${q === Infinity ? '∞' : v.fmt(q, 3)}`, 'tl', { color: 'orange', weight: 600 });
          const l1 = Math.abs(f[0] * g[0]) + Math.abs(f[1] * g[1]);
          st = { p, q, nf, ng, l1, pair: c };
          v.legend([['accent', '$B_p$ and $f$', { area: true }], ['orange', '$B_q$ and $g$', { area: true }], ['green', 'supporting line $\\{\\langle x,G\\rangle=1\\}$ (resp. $\\langle F,y\\rangle=1$)'], ['muted', 'level line through $F$', { dash: true }]]);
        });
        v.readout(() => `$\\|fg\\|_1 = |f_1g_1|+|f_2g_2| = ${v.fix(st.l1, 4)} \\;\\le\\; \\|f\\|_{${fmtP(st.p)}}\\,\\|g\\|_{${fmtP(st.q)}} = ${v.fix(st.nf, 3)}\\cdot${v.fix(st.ng, 3)} = ${v.fix(st.nf * st.ng, 4)}$` + (Math.abs(st.l1 - st.nf * st.ng) < 2e-3 * st.nf * st.ng ? ' — equality.' : ` $\\;(\\langle F,G\\rangle = ${v.fix(st.pair, 3)})$`));
      },
    },

    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: "Minkowski's inequality in Lᵖ",
      credit: 'Minkowski, 1896',
      statement: String.raw`Let $1\le p\le\infty$. If $f,g\in L^p(\mu)$, then $f+g\in L^p(\mu)$ and
$$\|f+g\|_p\le\|f\|_p+\|g\|_p .$$`,
      idea: String.raw`For $1<p<\infty$ this is 3.5(b) applied to $|f|$ and $|g|$, since $|f+g|\le|f|+|g|$. For $p=1$ integrate $|f+g|\le|f|+|g|$; for $p=\infty$ note that $|f+g|\le\|f\|_\infty+\|g\|_\infty$ off the union of two null sets (3.7). Geometrically the inequality says the ball of radius $\|g\|_p$ about $f$ sits inside the ball of radius $\|f\|_p+\|g\|_p$ about $0$ — equivalently, the unit ball is convex. For $0<p<1$ it is not, and the inequality fails.`,
      caption: String.raw`In $\ell^p$ of two points ($\R^2$), drag $f$ and $g$; $f+g$ is the tip of the orange arrow. The orange ball $B(f,\|g\|_p)$ must lie inside the green ball $B(0,\|f\|_p+\|g\|_p)$, so $f+g$ cannot escape it. Lower $p$ below $1$: the balls become non-convex stars and $f+g$ pokes out (red). At $p=1$ and $p=\infty$ the flat sides of the balls allow equality for non-parallel $f,g$.`,
      deps: ['rca-3.5', 'rca-3.6', 'rca-3.7'],
      see: ['pma-1.37'],
      tags: ['inequalities', 'Lp spaces'],
      viz(v) {
        const M = v.M;
        const P = v.slider('$p$', 0.25, 64, 2, { log: true, decimals: 2 });
        const inf = v.toggle('$p=\\infty$', false);
        const S = v.stage({ x: [-3.3, 3.3], y: [-2.9, 2.9], equal: true, height: 420, full: true });
        const box = { x: [-1.6, 1.6], y: [-1.6, 1.6] };
        const hf = S.handle(1.5, 0.25, { color: 'accent', label: 'f', constrain: box });
        const hg = S.handle(0.3, 1.25, { color: 'orange', label: 'g', constrain: box });
        let st = {};
        v.render(() => {
          const p = inf.value ? Infinity : P.value;
          const f = [hf.x, hf.y], g = [hg.x, hg.y], h = [f[0] + g[0], f[1] + g[1]];
          const nf = lp(f, p), ng = lp(g, p), nh = lp(h, p), Rr = nf + ng;
          const ok = nh <= Rr * (1 + 1e-9);
          S.ball(0, 0, Rr, { p, fill: 'green', fillAlpha: 0.07, color: 'green', width: 2, dash: [7, 5] });
          S.ball(0, 0, nf, { p, color: 'accent', width: 1.2, alpha: 0.6 });
          S.ball(f[0], f[1], ng, { p, fill: 'orange', fillAlpha: 0.16, color: 'orange', width: 1.6 });
          S.arrow(0, 0, g[0], g[1], { color: 'orange', width: 1.3, dash: [4, 4], alpha: 0.7 });
          S.arrow(0, 0, f[0], f[1], { color: 'accent', width: 2.4 });
          S.arrow(f[0], f[1], h[0], h[1], { color: 'orange', width: 2.4 });
          S.arrow(0, 0, h[0], h[1], { color: ok ? 'green' : 'red', width: 2.4 });
          S.dot(h[0], h[1], { color: ok ? 'green' : 'red', r: 6, label: 'f + g', labelPos: 'ne' });
          S.dot(0, 0, { color: 'ink', r: 3.5 });
          S.corner(p < 1 ? 'p < 1: ‖·‖ₚ is not a norm — its balls are not convex' : `p = ${p === Infinity ? '∞' : v.fix(p, 2)}: the balls are convex`, 'tl', { color: p < 1 ? 'red' : 'green', weight: 600 });
          st = { p, nf, ng, nh, ok };
          v.legend([['accent', '$f$ and $B(0,\\|f\\|_p)$'], ['orange', '$g$ and $B(f,\\|g\\|_p)$', { area: true }], ['green', '$B(0,\\|f\\|_p+\\|g\\|_p)$', { dash: true }]]);
        });
        v.readout(() => `$\\|f+g\\|_{${fmtP(st.p)}} = ${v.fix(st.nh, 4)}$ ${st.ok ? '$\\le$' : '$>$'} $${v.fix(st.nf + st.ng, 4)} = \\|f\\|_{${fmtP(st.p)}}+\\|g\\|_{${fmtP(st.p)}}$` + (st.ok ? (Math.abs(st.nh - st.nf - st.ng) < 1e-6 ? ' — equality.' : '') : ' — the triangle inequality fails for $p<1$.'));
      },
    },

    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Lᵖ(μ) as a metric space (functions equal a.e.)',
      statement: String.raw`Fix $1\le p\le\infty$. Since $\|\alpha f\|_p=|\alpha|\,\|f\|_p$, Minkowski's inequality (3.9) makes $L^p(\mu)$ a complex vector space, and $d(f,g)=\|f-g\|_p$ satisfies $d(f,h)\le d(f,g)+d(g,h)$. Moreover $d(f,g)=0$ exactly when $f=g$ almost everywhere. Identifying functions that agree a.e. (that is, working with equivalence classes) turns $d$ into a genuine metric, and $L^p(\mu)$ into a normed space. (Rudin states these facts as remarks.)`,
      idea: String.raw`Symmetry and the triangle inequality come from homogeneity and 3.9. The only axiom that fails before identification is $d(f,g)=0\Rightarrow f=g$: changing $f$ on a null set changes nothing measured by $\int|f-g|^p$ or by the essential supremum. Passing to classes modulo "$=$ a.e." removes exactly this defect.`,
      caption: String.raw`The orange $g$ equals the blue $f$ except on three spikes of width $w$. As $w\to0$ the distance $\|f-g\|_p$ tends to $0$, and at $w=0$ — where $g$ differs from $f$ only at three points — it *is* $0$, even in $L^\infty$: $f$ and $g$ are the same element of $L^p$. Note that $\sup|f-g|$ does not see this.`,
      deps: ['rca-3.9', 'rca-3.6', 'rca-3.7'],
      tags: ['Lp spaces', 'metric spaces'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Remarks 3.10, pp. 66–67'],
      viz(v) {
        const M = v.M;
        const Wd = v.slider('spike width $w$', 0, 0.08, 0.04, { step: 0.001, decimals: 3 });
        const Ps = v.select('$p$', [{ value: 1, label: '$1$' }, { value: 2, label: '$2$' }, { value: 4, label: '$4$' }, { value: Infinity, label: '$\\infty$' }], 2);
        const S = v.stage({ x: [-0.02, 1.02], y: [-0.36, 2.4], height: 330, full: true });
        const f = (x) => 0.7 + 0.35 * Math.sin(2 * Math.PI * x) + 0.15 * Math.cos(6 * Math.PI * x);
        const sp = [[0.2, 1.3], [0.55, 1.0], [0.81, 1.25]];
        const tri = (x, c, h, w) => (w > 0 ? Math.max(0, h * (1 - Math.abs(x - c) / (w / 2))) : 0);
        let st = {};
        v.render(() => {
          const w = Wd.value, p = Ps.value;
          const g = (x) => f(x) + sp.reduce((s, [c, h]) => s + tri(x, c, h, w), 0);
          S.fn(f, { domain: [0, 1], color: 'accent', width: 3.2 });
          if (w > 0) S.fn(g, { domain: [0, 1], color: 'orange', width: 1.8, n: 2000 });
          else for (const [c, h] of sp) { S.dot(c, f(c) + h, { color: 'orange', r: 5 }); S.dot(c, f(c), { hollow: true, color: 'accent', r: 4 }); S.line(c, f(c), c, f(c) + h, { color: 'orange', width: 1, dash: [2, 3] }); }
          for (const [c] of sp) { if (w > 0) S.line(c - w / 2, -0.26, c + w / 2, -0.26, { color: 'orange', width: 6, cap: 'butt' }); else S.dot(c, -0.26, { color: 'orange', r: 3, ring: false }); }
          const d = p === Infinity ? (w > 0 ? Math.max(...sp.map((s) => s[1])) : 0) : (sp.reduce((s, [, h]) => s + w * h ** p / (p + 1), 0)) ** (1 / p);
          const sup = Math.max(...sp.map((s) => s[1]));
          S.corner(w > 0 ? `{f ≠ g} has measure ${v.fix(3 * w, 3)}` : '{f ≠ g} = three points: a null set', 'tr', { color: w > 0 ? 'orange' : 'green', weight: 600 });
          st = { w, p, d, sup };
          v.legend([['accent', '$f$'], ['orange', '$g$ (agrees with $f$ off the spikes)'], ['orange', '$\\{f\\ne g\\}$', { area: true }]]);
        });
        v.readout(() => `$d(f,g) = \\|f-g\\|_{${fmtP(st.p)}} = ${v.fix(st.d, 4)}$, $\\;\\sup|f-g| = ${v.fix(st.sup, 2)}$` + (st.w === 0 ? ' — distance $0$ although $f\\ne g$: they are identified in $L^p$.' : ''));
      },
    },

    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Completeness of Lᵖ (Riesz–Fischer)',
      credit: 'F. Riesz & Fischer, 1907',
      statement: String.raw`For $1\le p\le\infty$ and every positive measure $\mu$, $L^p(\mu)$ is a complete metric space: every Cauchy sequence in $L^p(\mu)$ converges in the $L^p$ metric to an element of $L^p(\mu)$.`,
      idea: String.raw`For $p<\infty$: pick $n_1<n_2<\cdots$ with $\|f_{n_{i+1}}-f_{n_i}\|_p<2^{-i}$ and put $g_k=\sum_{i\le k}|f_{n_{i+1}}-f_{n_i}|$. Minkowski (3.9) gives $\|g_k\|_p<1$, and Fatou's lemma gives $\|g\|_p\le1$ for $g=\lim g_k$; so $g<\infty$ a.e., the telescoping series $f_{n_1}+\sum(f_{n_{i+1}}-f_{n_i})$ converges absolutely a.e., and its sum $f$ is the $L^p$-limit (Fatou once more). For $p=\infty$ the sequence converges uniformly off a null set.`,
      caption: String.raw`The sequence is the Fourier partial sums $f_n$ of a square or sawtooth wave on $[0,1]$: continuous functions, Cauchy in $L^p$ for $p<\infty$, whose limit is discontinuous — completeness is what guarantees a limit exists. The proof's fast subsequence $n_1<n_2<\cdots$ is computed live (using $\|f_m-f_{m'}\|_p\le2\sup_{k\ge n}\|f_k-f\|_p$ for $m,m'\ge n$, over the first $256$ terms): note how sparse it must be. Bottom right: the dominating function $g_k$, with $\|g_k\|_p<1$. Choose $p=\infty$ to see the hypothesis fail.`,
      deps: ['rca-3.10', 'rca-3.9', 'rca-1.28'],
      see: ['pma-3.11', 'pma-7.15', 'pma-11.42'],
      tags: ['completeness', 'Lp spaces'],
      viz(v) {
        const M = v.M;
        const FN = {
          sq: { label: 'square wave', f: (x) => (x < 0.5 ? 1 : -1), term: (k, x) => (4 / Math.PI) * Math.sin(2 * Math.PI * (2 * k - 1) * x) / (2 * k - 1) },
          saw: { label: 'sawtooth', f: (x) => 0.5 - x, term: (k, x) => Math.sin(2 * Math.PI * k * x) / (Math.PI * k) },
        };
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'sq');
        const Ps = v.select('$p$', [{ value: 1, label: '$1$' }, { value: 1.5, label: '$1.5$' }, { value: 2, label: '$2$' }, { value: 3, label: '$3$' }, { value: Infinity, label: '$\\infty$' }], 1);
        const K = v.slider('steps $k$', 1, 7, 4, { int: true });
        const T = v.stage({ x: [-0.01, 1.01], y: [-1.4, 1.75], height: 260, full: true, yticks: [-1, -0.5, 0.5, 1], title: 'the fast subsequence $f_{n_1}, f_{n_2},\\dots$ approaching $f$' });
        const Bb = v.stage({ x: [0.4, 7.6], y: [-0.09, 0.56], height: 200, axes: true, title: '$\\|f_{n_{i+1}}-f_{n_i}\\|_p$ (bars) against $2^{-i}$', xticks: [1, 2, 3, 4, 5, 6, 7].map((i) => [i, `i=${i}`]) });
        const G = v.stage({ x: [-0.01, 1.01], y: [-0.05, 2.6], height: 200, axes: 'box', title: '$g_k=\\sum_{i<k}|f_{n_{i+1}}-f_{n_i}|$' });
        const NS = 4096, N = 256, X = M.range(NS).map((i) => (i + 0.5) / NS);
        const cache = {};
        const series = (key) => {
          if (cache[key]) return cache[key];
          const F = FN[key]; const S = [new Float32Array(NS)]; let cur = new Float32Array(NS);
          for (let k = 1; k <= N; k++) { const nx = new Float32Array(NS); for (let j = 0; j < NS; j++) nx[j] = cur[j] + F.term(k, X[j]); S.push(nx); cur = nx; }
          const fv = X.map(F.f);
          return (cache[key] = { S, fv, tails: {} });
        };
        const tails = (D, p) => {
          if (D.tails[p]) return D.tails[p];
          const t = new Float64Array(N + 2);
          if (p === Infinity) {
            // not Cauchy in L^∞: record ‖f_m − f_{2m}‖_∞ instead
            for (let m = 1; m <= N / 2; m++) { let mx = 0; const a = D.S[m], b = D.S[2 * m]; for (let j = 0; j < NS; j++) mx = Math.max(mx, Math.abs(a[j] - b[j])); t[m] = mx; }
          } else {
            for (let m = 1; m <= N; m++) { let s = 0; const a = D.S[m]; for (let j = 0; j < NS; j++) s += Math.abs(a[j] - D.fv[j]) ** p; t[m] = (s / NS) ** (1 / p); }
            for (let m = N - 1; m >= 1; m--) t[m] = Math.max(t[m], t[m + 1]); // suffix sup
          }
          return (D.tails[p] = t);
        };
        const diffNorm = (a, b, p) => { let s = 0; if (p === Infinity) { for (let j = 0; j < NS; j++) s = Math.max(s, Math.abs(a[j] - b[j])); return s; } for (let j = 0; j < NS; j++) s += Math.abs(a[j] - b[j]) ** p; return (s / NS) ** (1 / p); };
        let st = {};
        v.render(() => {
          const D = series(which.value), p = Ps.value, t = tails(D, p);
          const F = FN[which.value];
          T.fn(F.f, { domain: [0, 1], color: 'green', width: 3.2, n: 800 });
          if (p === Infinity) {
            const ms = [4, 8, 16, 32, 64];
            ms.forEach((m, i) => T.path(X.filter((_, j) => j % 2 === 0).map((x, j) => [x, D.S[m][2 * j]]), { color: 'accent', width: 1.4, alpha: 0.3 + 0.7 * i / (ms.length - 1) }));
            Bb.setView([0.4, 5.6], [-0.18, 1.1]); Bb.o.xticks = ms.map((m, i) => [i + 1, `m=${m}`]);
            Bb.setTitle('$\\|f_m-f_{2m}\\|_\\infty$ for $m=4,8,\\dots,64$: no decay');
            ms.forEach((m, i) => Bb.rect(i + 1 - 0.3, 0, i + 1 + 0.3, t[m], { fill: 'red', fillAlpha: 0.6, stroke: false }));
            T.corner('p = ∞: the Gibbs overshoot never shrinks — not Cauchy in L∞', 'tl', { color: 'red', weight: 600 });
            Bb.corner('stays ≈ ' + v.fix(t[64], 2), 'tr', { color: 'red', weight: 600 });
            // bottom right: |f_64 − f_128| — its sup does not shrink, so no dominating g_k can be built
            G.setView(null, [-0.05, 1.25]);
            G.setTitle('$|f_{64}-f_{128}|$: the sup-distance does not shrink');
            G.path(X.filter((_, j) => j % 2 === 0).map((x, j) => [x, Math.abs(D.S[64][2 * j] - D.S[128][2 * j])]), { color: 'red', width: 1.4 });
            G.corner('not Cauchy in L∞: no fast subsequence exists', 'tr', { color: 'red', weight: 600 });
            st = { inf: true, d: t[64] };
            v.legend([['green', 'limit $f$'], ['accent', '$f_4, f_8, \\dots, f_{64}$'], ['red', 'sup-distances', { area: true }]]);
            return;
          }
          G.setTitle('$g_k=\\sum_{i<k}|f_{n_{i+1}}-f_{n_i}|$');
          Bb.setView([0.4, 7.6], [-0.09, 0.56]); Bb.o.xticks = [1, 2, 3, 4, 5, 6, 7].map((i) => [i, `i=${i}`]);
          Bb.setTitle('$\\|f_{n_{i+1}}-f_{n_i}\\|_p$ (bars) against $2^{-i}$ (orange)');
          // choose n_i: the first n with 2·sup_{m≥n}‖f_m − f‖_p < 2^{-i}
          const ns = []; let n = 1;
          for (let i = 1; i <= 8; i++) { while (n <= N && 2 * t[n] >= 2 ** -i) n++; if (n > N) break; ns.push(n); n++; }
          const k = Math.min(K.value, ns.length);
          const shown = ns.slice(0, k + 1);
          shown.forEach((m, i) => {
            const last = i === shown.length - 1;
            T.path(X.filter((_, j) => j % 2 === 0).map((x, j) => [x, D.S[m][2 * j]]), { color: 'accent', width: last ? 2.2 : 1.2, alpha: last ? 1 : 0.25 + 0.5 * i / Math.max(1, shown.length - 1) });
          });
          T.corner(`n₁, n₂, … = ${ns.join(', ')}` + (ns.length < 8 ? `  (next index > ${N})` : ''), 'tl', { color: 'accent', weight: 600 });
          // bars
          const dn = [];
          for (let i = 0; i + 1 < shown.length; i++) dn.push(diffNorm(D.S[shown[i + 1]], D.S[shown[i]], p));
          for (let i = 1; i <= 7; i++) Bb.line(i - 0.38, 2 ** -i, i + 0.38, 2 ** -i, { color: 'orange', width: 2.4 });
          dn.forEach((d, i) => Bb.rect(i + 1 - 0.28, 0, i + 1 + 0.28, d, { fill: 'gold', fillAlpha: 0.75, stroke: false }));
          // g_k
          const gk = new Float64Array(NS);
          for (let i = 0; i + 1 < shown.length; i++) { const a = D.S[shown[i + 1]], b = D.S[shown[i]]; for (let j = 0; j < NS; j++) gk[j] += Math.abs(a[j] - b[j]); }
          const gmax = Math.max(0.3, ...gk);
          G.setView(null, [-0.05 * gmax, gmax * 1.12]);
          G.path(X.filter((_, j) => j % 2 === 0).map((x, j) => [x, gk[2 * j]]), { color: 'purple', width: 1.6, fill: 'purple', fillAlpha: 0.12 });
          const ng = lpNorm(gk, p);
          G.texPx(`\\|g_k\\|_p = ${v.fix(ng, 3)} < 1`, G.width - 10, 8, { color: 'purple', align: 'right', baseline: 'top', size: 14 });
          if (K.value > ns.length) Bb.corner(`only ${ns.length} indices ≤ ${N} — the next one lies further out`, 'tr', { color: 'muted' });
          st = { inf: false, ns, k: shown.length - 1, ng, dn, p };
          v.legend([['green', 'limit $f$ (discontinuous)'], ['accent', '$f_{n_1},\\dots,f_{n_k}$ (continuous)'], ['gold', '$\\|f_{n_{i+1}}-f_{n_i}\\|_p$', { area: true }], ['orange', '$2^{-i}$'], ['purple', '$g_k$', { area: true }]]);
        });
        v.readout(() => st.inf
          ? `In $L^\\infty$ the partial sums are not Cauchy ($\\|f_{64}-f_{128}\\|_\\infty\\approx ${v.fix(st.d, 2)}$), so 3.11 says nothing — and indeed a uniform limit of continuous functions could not jump.`
          : `$\\sum_{i<k}\\|f_{n_{i+1}}-f_{n_i}\\|_p = ${v.fix(st.dn.reduce((a, b) => a + b, 0), 4)} < \\sum 2^{-i} < 1$, hence $\\|g_k\\|_p = ${v.fix(st.ng, 4)} < 1$ for every $k$ (Minkowski), and the telescoping series converges a.e. (Fatou).`);
      },
    },
  ],
};
