// Optimization — Chapter 3: Convex functions (items 3.8–3.13; 3.1–3.7 in ch03.js)
import {
  clamp, mulberry, chordTest1, chordTest2, grad2, conjugateOnGrid, envelope, linspace, pwl, memo, rgbA, descend, d1, d2, levelsOf,
} from './ch03.shared.js';

const fmt = (v, x, d = 3) => v.fix(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);

export default {
  collection: 'opt',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Fenchel’s inequality and the biconjugate',
      statement: String.raw`For every $f$ and all $x,y$, **Fenchel's inequality** $f(x)+f^*(y)\ge y^{\mathsf T}x$ holds, with equality exactly when the affine function $z\mapsto yz-f^*(y)$ touches the graph of $f$ at $x$, i.e. when $y$ is a subgradient of $f$ at $x$ (for differentiable convex $f$: $y=\nabla f(x)$). The **biconjugate** $f^{**}=(f^*)^*$ satisfies $f^{**}\le f$, and $f^{**}$ is the largest closed convex function below $f$ (the supremum of all affine minorants of $f$). If $f$ is proper, convex and closed (lower semicontinuous), then $f^{**}=f$; for a general $f$ with a bounded domain, $f^{**}$ is the **lower convex envelope** of $f$.`,
      idea: String.raw`Fenchel's inequality is the definition of the supremum: $f^*(y)\ge y^{\mathsf T}x-f(x)$ for each fixed $x$. Rearranged, $x\mapsto y^{\mathsf T}x-f^*(y)$ is an affine minorant of $f$ for each $y$, and every affine minorant arises this way; so $f^{**}(x)=\sup_y\big(y^{\mathsf T}x-f^*(y)\big)$ is the supremum of all affine minorants. A closed convex function is the supremum of its affine minorants, which is the supporting hyperplane theorem (opt-2.8) applied to the epigraph; that gives $f^{**}=f$. For a nonconvex $f$ the supremum of the minorants is the greatest convex function below it.`,
      caption: String.raw`Choose $f$ (defined on $[-3,3]$; it is $+\infty$ outside) and drag the point $x_0$ on the graph and the slope $y$. The orange line $x\mapsto yx-f^*(y)$ is an affine minorant of $f$; its height at $x_0$ lies below $f(x_0)$ by the **Fenchel gap** $f(x_0)+f^*(y)-yx_0\ge0$. The button sets $y=f'(x_0)$: the gap closes only where $f$ agrees with its convex envelope. The green curve is $f^{**}$ computed by conjugating twice on a grid; it is compared with an independent lower-hull envelope. For the double well it bridges the two wells with a straight segment; for a convex $f$ it coincides with $f$.`,
      credit: 'Fenchel, 1949 (conjugate convex functions; the one-variable case is Young\'s inequality, 1912); the biconjugate theorem is known as the Fenchel–Moreau theorem',
      deps: ['opt-3.7', 'opt-2.8'],
      refs: ['Boyd–Vandenberghe §3.3'],
      tags: ['conjugate', 'convex envelope', 'biconjugate'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fenchel%E2%80%93Moreau_theorem' },
      viz(v) {
        const PF = {
          well: { label: 'double well', f: (x) => x ** 4 / 12 - x * x / 1.2 + 2 },
          tilt: { label: 'tilted well', f: (x) => (x * x - 1.5) ** 2 / 3 + 0.35 * x },
          wave: { label: 'sine wave', f: (x) => 0.5 * x + Math.sin(1.6 * x) + 2 },
          tent: { label: 'concave tent', f: (x) => 3 - 1.3 * Math.abs(x) },
          conv: { label: 'convex $e^{x/1.6}$', f: (x) => Math.exp(x / 1.6) },
        };
        const sel = v.select('function $f$', Object.entries(PF).map(([k, o]) => ({ value: k, label: o.label })), 'well');
        const yS = v.slider('slope $y$', -6, 6, 1.4, { step: 0.01 });
        const L = v.stage({ x: [-3.3, 3.3], y: [-5, 7], axes: 'box', gutter: true, grid: true, height: 380, title: '$f$, $f^{**}$ and an affine minorant' });
        const R = v.stage({ x: [-6, 6], y: [-4, 8], axes: 'box', gutter: true, grid: true, height: 380, title: '$f^*(y)$', xlabel: '$y$' });
        let F = PF.well.f;
        const X0 = L.handle(-1.2, 0, { color: 'gold', label: '$x_0$', labelPos: 'nw', constrain: (x) => [clamp(x, -3, 3), F(clamp(x, -3, 3))] });
        v.button('set $y=f\'(x_0)$', () => yS.set(clamp(d1(F, X0.x), -6, 6)));
        const XS = linspace(-3, 3, 601), YS = linspace(-14, 14, 1121);
        const mc = memo();
        let info = {};
        v.render(() => {
          F = PF[sel.value].f;
          const C = mc(sel.value, () => {
            const fs = XS.map(F), cj = conjugateOnGrid(XS, fs, YS), fss = XS.map((x) => { let b = -Infinity; for (let j = 0; j < YS.length; j++) { const t = YS[j] * x - cj.conj[j]; if (t > b) b = t; } return b; });
            const env = envelope(XS, fs);
            let dm = 0; for (let i = 0; i < XS.length; i++) dm = Math.max(dm, Math.abs(fss[i] - env[i]));
            let ds = 0; for (let i = 0; i < XS.length; i++) ds = Math.max(ds, fs[i] - fss[i] < -1e-9 ? 1 : 0, Math.abs(fs[i] - fss[i]));
            return { fs, cj, fss, dm, ds };
          });
          X0.set(X0.x, F(X0.x));
          const y = yS.value, j = Math.round(((y + 14) / 28) * 1120), fstar = C.cj.conj[j], x0 = X0.x, f0 = F(x0);
          L.fn(F, { domain: [-3, 3], color: 'accent', width: 2.6, n: 300 });
          L.path(XS.map((x, i) => [x, C.fss[i]]), { color: 'green', width: 2.6 });
          L.line(-3.3, -3.3 * y - fstar, 3.3, 3.3 * y - fstar, { color: 'orange', width: 2 });
          const aff = y * x0 - fstar;
          L.segment([x0, aff], [x0, f0], { color: 'red', width: 4 });
          L.dot(x0, aff, { r: 4, color: 'orange' });
          // conjugate
          const ys = YS.filter((yy) => Math.abs(yy) <= 6.2);
          const vals = ys.map((yy) => C.cj.conj[Math.round(((yy + 14) / 28) * 1120)]);
          R.setView([-6, 6], [Math.min(...vals) - 1, Math.max(...vals) + 1]);
          R.path(ys.map((yy, i) => [yy, vals[i]]), { color: 'purple', width: 2.6 });
          R.dot(y, fstar, { r: 6, color: 'orange' });
          info = { gap: f0 + fstar - y * x0, f0, fstar, aff, dm: C.dm, ds: C.ds, y, x0 };
        });
        v.legend([['accent', '$f$'], ['green', '$f^{**}$'], ['orange', 'affine minorant $yx-f^*(y)$'], ['red', 'Fenchel gap at $x_0$']]);
        v.readout(() => {
          const { gap, f0, fstar, dm, ds, y, x0 } = info;
          return `Fenchel: $f(x_0)+f^*(y)-yx_0=${fmt(v, f0)}+${fmt(v, fstar)}-(${fmt(v, y * x0)})=${fmt(v, gap)}\\ge0$${gap < 0.01 ? ' (equality: the line touches $f$ at $x_0$)' : ''}.\n$\\max|f^{**}-\\operatorname{conv}f|=${v.sci(Math.max(dm, 1e-16), 2)}$ against an independent lower-hull envelope; $\\max|f-f^{**}|=${fmt(v, ds)}$${ds < 1e-3 ? ' — $f$ is convex and closed, so $f^{**}=f$' : ' — $f$ is not convex, so $f^{**}<f$ somewhere'}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'Quasiconvex functions',
      statement: String.raw`A function $f:C\to\R$ on a convex set $C$ is **quasiconvex** if every sublevel set $\{x\in C: f(x)\le\alpha\}$ is convex; equivalently $f(\theta x+(1-\theta)y)\le\max\{f(x),f(y)\}$ for $\theta\in[0,1]$. It is **quasiconcave** if $-f$ is quasiconvex, and **quasilinear** if both. Every convex function is quasiconvex (opt-3.5), but not conversely. On $\R$, a function is quasiconvex iff it is nonincreasing and then nondecreasing, so every sublevel set is an interval. A quasiconvex problem $\min f$ over a convex set can be solved by **bisection on the level**: for each trial $t$, decide whether $\{f\le t\}$ is nonempty (a convex feasibility problem).`,
      idea: String.raw`The two characterizations are the same statement: if $f(\theta x+(1-\theta)y)\le\max\{f(x),f(y)\}=:\alpha$ then both points of $\{f\le\alpha\}$ have all their combinations in it, and conversely. The class keeps sublevel sets but loses other convex properties: a quasiconvex function can have a flat stretch or a stationary point that is not a minimizer, so $\nabla f=0$ no longer certifies optimality, and a sum of quasiconvex functions need not be quasiconvex. Bisection works because the feasibility question "is $\{f\le t\}$ nonempty?" has a monotone answer in $t$: yes above the optimal value, no below it, so each answer halves the bracket.`,
      caption: String.raw`Drag the orange knots to sketch a piecewise-linear function (or press a preset). The level $\alpha$ slides a horizontal line, and the green bars on the axis are the sublevel intervals. The page scans 150 levels and counts the connected pieces of each sublevel set: if every level gives one interval the function is quasiconvex, otherwise a second piece appears and the counter says so. Presets: a unimodal function with a flat bottom and a concave stretch (quasiconvex, not convex), and a bimodal one. The slider *bisection steps* runs the bracketing on the level: the oracle here is brute-force scanning of the graph, which in several variables is replaced by a convex feasibility problem.`,
      credit: 'de Finetti, 1949 (sublevel-set definition; the name "quasiconvex" came later)',
      deps: ['opt-3.5'],
      refs: ['Boyd–Vandenberghe §3.4'],
      tags: ['quasiconvex', 'bisection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quasiconvex_function' },
      viz(v) {
        const X0 = [-3, -2, -1, 0, 1, 2, 3];
        const PRE = { uni: [5.5, 5.0, 2.0, 0.6, 0.6, 3.0, 3.2], bi: [4, 1.2, 3, 4, 1, 2.5, 4] };
        const S = v.stage({ x: [-3.3, 3.3], y: [-1.4, 7], axes: 'box', gutter: true, grid: true, height: 380, title: 'a sketched function and its sublevel set' });
        const H = X0.map((x0, i) => S.handle(x0, PRE.uni[i], { color: 'orange', r: 6, constrain: (x, y) => [x0, clamp(y, 0, 6.8)] }));
        v.button('unimodal preset', () => H.forEach((h, i) => h.set(X0[i], PRE.uni[i])));
        v.button('bimodal preset', () => H.forEach((h, i) => h.set(X0[i], PRE.bi[i])));
        const al = v.slider('level $\\alpha$', 0.1, 6.5, 2.5, { step: 0.01 });
        const kS = v.slider('bisection steps', 0, 9, 0, { step: 1, int: true });
        let info = {};
        const comps = (f, a) => {
          let c = 0, inRun = false; const iv = [];
          let st = 0;
          for (let i = 0; i <= 600; i++) {
            const x = -3 + (6 * i) / 600, ok = f(x) <= a + 1e-9;
            if (ok && !inRun) { inRun = true; st = x; }
            if ((!ok || i === 600) && inRun) { inRun = false; c++; iv.push([st, ok ? x : x - 0.01]); }
          }
          return iv;
        };
        v.render(() => {
          const f = pwl(H.map((h) => [h.x, h.y]));
          S.fn(f, { domain: [-3, 3], color: 'accent', width: 2.6, n: 400 });
          const a = al.value, iv = comps(f, a);
          S.hline(a, { color: 'orange', width: 1.4, dash: true });
          iv.forEach(([p, q]) => { S.segment([p, -0.7], [q, -0.7], { color: iv.length > 1 ? 'red' : 'green', width: 6 }); });
          // quasiconvexity scan
          let maxc = 0, worstA = null;
          for (let k = 0; k <= 150; k++) { const lv = 0.05 + (6.8 * k) / 150, c = comps(f, lv).length; if (c > maxc) { maxc = c; worstA = lv; } }
          // bisection
          let fmin = Infinity, xmin = 0; for (let i = 0; i <= 600; i++) { const x = -3 + (6 * i) / 600, z = f(x); if (z < fmin) { fmin = z; xmin = x; } }
          let lo = -1, hi = Math.max(...H.map((h) => h.y));
          const steps = [];
          for (let s = 0; s < kS.value; s++) {
            const mid = (lo + hi) / 2, feas = comps(f, mid).length > 0;
            steps.push([mid, feas]); if (feas) hi = mid; else lo = mid;
          }
          if (kS.value > 0) {
            S.hline(lo, { color: 'red', width: 1.6 }); S.hline(hi, { color: 'green', width: 1.6 });
            S.hband(lo, hi, { color: 'purple', alpha: 0.1 });
            steps.forEach(([m, ok]) => S.dot(3.1, m, { r: 3, color: ok ? 'green' : 'red' }));
            S.dot(xmin, fmin, { r: 5, color: 'gold' });
          }
          info = { n: iv.length, maxc, worstA, lo, hi, fmin, k: kS.value };
        });
        v.readout(() => {
          const { n, maxc, worstA, lo, hi, fmin, k } = info;
          return `At $\\alpha$ the sublevel set has **${n}** piece${n === 1 ? '' : 's'}. Over 150 levels the most pieces seen is **${maxc}**${maxc <= 1 ? ': every sublevel set is an interval, so $f$ is quasiconvex' : ` (at $\\alpha\\approx${v.fix(worstA, 2)}$): $f$ is **not** quasiconvex`}.\n${k > 0 ? `After ${k} bisection step${k === 1 ? '' : 's'}: $p^\\star\\in[${v.fix(lo, 3)},${v.fix(hi, 3)}]$ (width $${v.sci(hi - lo, 2)}$); true minimum $${v.fix(fmin, 3)}$ (gold).` : 'Raise the bisection steps to bracket the minimum value.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'Log-concave functions',
      statement: String.raw`A function $f:C\to\R_{\ge0}$ is **log-concave** if $f>0$ on a convex set (and $0$ elsewhere) and $\log f$ is concave there; equivalently $f(\theta x+(1-\theta)y)\ge f(x)^{\theta}f(y)^{1-\theta}$. It is **log-convex** if $\log f$ is convex. Examples: the Gaussian and Laplace densities and the uniform density on an interval are log-concave; the Cauchy density is not. Products of log-concave functions are log-concave; convolutions of log-concave functions are log-concave (Prékopa–Leindler); sums (mixtures) of log-concave functions need **not** be.`,
      idea: String.raw`Taking logarithms turns the product rule into a sum, and a sum of concave functions is concave (opt-3.6), so products stay log-concave; this is why the class is the natural home of likelihoods, where independent observations multiply. The convolution rule is the Prékopa–Leindler inequality, a deeper fact from the Brunn–Minkowski circle of ideas. A sum can fail: two bumps far apart leave a valley, and $\log$ of a valley is not concave. The geometric programs of opt-4.11 use the same logarithmic change of variables.`,
      caption: String.raw`Choose two densities $A$ and $B$ (shifted by $d$) and an operation: product, convolution or equal mixture. The left panel shows $A$, $B$ (dashed) and the result (areas normalized); the right panel shows $\log$ of the result. A chord test is run on $\log f$ over its support (a chord whose midpoint falls in a gap counts as a violation): green when concave, red otherwise. Two Gaussians multiply and convolve to Gaussians at any shift, but their mixture becomes bimodal as $d$ grows and fails; the Cauchy density fails by itself, since $-\log(1+x^2)$ is convex for $|x|>1$.`,
      deps: ['opt-3.6'],
      refs: ['Boyd–Vandenberghe §3.5'],
      tags: ['log-concave', 'densities'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Logarithmically_concave_function' },
      viz(v) {
        const BASE = {
          gauss: { label: 'Gaussian', f: (x) => Math.exp(-x * x / 2) },
          lap: { label: 'Laplace', f: (x) => Math.exp(-Math.abs(x) / 0.8) },
          unif: { label: 'uniform', f: (x) => (Math.abs(x) <= 1.5 ? 1 : 0) },
          logi: { label: 'logistic', f: (x) => { const e = Math.exp(-Math.abs(x)); return (4 * e) / ((1 + e) * (1 + e)); } },
          cau: { label: 'Cauchy', f: (x) => 1 / (1 + x * x) },
        };
        const opts = Object.entries(BASE).map(([k, o]) => ({ value: k, label: o.label }));
        const sA = v.select('$A$', opts, 'gauss'), sB = v.select('$B$ (shifted)', opts, 'gauss');
        const op = v.select('operation', [{ value: 'prod', label: 'product $A\\cdot B$' }, { value: 'conv', label: 'convolution $A*B$' }, { value: 'mix', label: 'mixture $(A+B)/2$' }], 'mix');
        const dS = v.slider('shift $d$ of $B$', 0, 5, 3.2, { step: 0.05 });
        const N = 801, XS = linspace(-8, 8, N), h = 16 / (N - 1);
        const L = v.stage({ x: [-8, 8], y: [-0.05, 1.1], axes: 'box', gutter: true, grid: true, height: 340, title: 'densities (normalized)' });
        const R = v.stage({ x: [-8, 8], y: [-8, 1], axes: 'box', gutter: true, grid: true, height: 340, title: '$\\log$ of the result' });
        const mc = memo();
        let info = {};
        v.render(() => {
          const fa = BASE[sA.value].f, fb0 = BASE[sB.value].f, d = dS.value, fb = (x) => fb0(x - d), o = op.value;
          const key = [sA.value, sB.value, o, d.toFixed(3)].join('|');
          const Z = mc(key, () => {
            const a = XS.map(fa), b = XS.map(fb);
            let r;
            if (o === 'prod') r = a.map((t, i) => t * b[i]);
            else if (o === 'mix') r = a.map((t, i) => (t + b[i]) / 2);
            else r = XS.map((xk) => { let s = 0; for (let i = 0; i < N; i++) s += a[i] * fb(xk - XS[i]); return s * h; });
            const norm = (z) => { const s = z.reduce((p, q) => p + q, 0) * h || 1; return z.map((q) => q / s); };
            const na = norm(a), nb = norm(b), nr = norm(r), mx = Math.max(...nr);
            const sup = nr.map((q) => q > 1e-5 * mx);
            let pieces = 0; for (let i = 0; i < N; i++) if (sup[i] && !sup[i - 1]) pieces++;
            const lg = nr.map((q, i) => (sup[i] ? Math.log(q) : -Infinity));
            const rnd = mulberry(4), idx = XS.map((_, i) => i).filter((i) => sup[i]);
            let bad = 0, tested = 0, worst = 0;
            if (idx.length > 8) for (let k = 0; k < 1500; k++) {
              const i = idx[(rnd() * idx.length) | 0], j = idx[(rnd() * idx.length) | 0], t = 0.15 + 0.7 * rnd(), m = Math.round(t * i + (1 - t) * j);
              tested++;
              const chord = t * lg[i] + (1 - t) * lg[j], mid = lg[m];
              const ex = chord - mid;
              if (ex > 0.02) { bad++; worst = Math.max(worst, Math.min(ex, 99)); }
            }
            return { na, nb, nr, lg, bad, tested, pieces, worst, mx };
          });
          const ymax = Math.max(Math.max(...Z.na), Math.max(...Z.nb), Z.mx) * 1.1;
          L.setView([-8, 8], [-0.05 * ymax, ymax]);
          L.path(XS.map((x, i) => [x, Z.na[i]]), { color: 'teal', width: 1.4, dash: true });
          L.path(XS.map((x, i) => [x, Z.nb[i]]), { color: 'orange', width: 1.4, dash: true });
          const ok = Z.bad === 0 && Z.pieces === 1;
          L.path(XS.map((x, i) => [x, Z.nr[i]]), { color: ok ? 'green' : 'red', width: 2.8 });
          const lgp = []; Z.lg.forEach((q, i) => lgp.push(Number.isFinite(q) ? [XS[i], q] : null));
          R.setView([-8, 8], [Math.max(-9, Math.min(...Z.lg.filter(Number.isFinite)) - 0.5), Math.max(...Z.lg.filter(Number.isFinite)) + 1]);
          R.path(lgp, { color: ok ? 'green' : 'red', width: 2.8 });
          info = { Z, ok };
        });
        v.readout(() => {
          const { Z, ok } = info;
          return `Support has **${Z.pieces}** piece${Z.pieces === 1 ? '' : 's'}; chords of $\\log f$ whose midpoint falls below the chord (by more than $0.02$): **${Z.bad}** of ${Z.tested}.\n${ok ? 'No violation: consistent with **log-concave**.' : '**Not log-concave**: ' + (Z.pieces > 1 ? 'the support is not an interval.' : '$\\log f$ has a convex stretch.')}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Local minima of convex functions are global',
      statement: String.raw`Let $f$ be convex on a convex set $C$. If $x^\star\in C$ is a local minimizer of $f$ over $C$, then it is a global minimizer. The set of minimizers is convex, and if $f$ is strictly convex the minimizer is unique. Without convexity the conclusion fails: a nonconvex $f$ may have many local minimizers with different values, and a descent method then reaches whichever one lies at the bottom of the basin where it starts.`,
      idea: String.raw`Suppose $x^\star$ is a local minimizer but $f(y)<f(x^\star)$ for some $y\in C$. The points $z_\theta=\theta y+(1-\theta)x^\star$ lie in $C$ and approach $x^\star$ as $\theta\to0$, while convexity gives $f(z_\theta)\le\theta f(y)+(1-\theta)f(x^\star)<f(x^\star)$: there are points arbitrarily close to $x^\star$ with strictly smaller value, contradicting local minimality (opt-1.3). The same chord inequality shows that the minimizers form a convex set.`,
      caption: String.raw`Gradient descent with backtracking line search is started from many seeded random points (thin paths; their end points are the dots). On a **convex** landscape all runs end at one point and the sorted final values on the right form a flat line; on a **nonconvex** one they spread over several local minima and the bars step. The readout counts distinct end points and the spread of the final values. Add more starts, resample, or change the landscape; *log-sum-exp* and *tilted bowl* are convex, *Himmelblau* and *egg crate* are not.`,
      deps: ['opt-3.1', 'opt-1.3'],
      refs: ['Boyd–Vandenberghe §4.2'],
      tags: ['local minimum', 'global minimum'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_function#Properties' },
      viz(v) {
        const view = { x: [-5, 5], y: [-4, 4] };
        const FS = {
          lse: { label: 'log-sum-exp', f: (x, y) => Math.log(Math.exp(x / 2) + Math.exp(y / 2) + Math.exp(-(x + y) / 2)) * 3 },
          bowl: { label: 'tilted bowl', f: (x, y) => 0.25 * x * x + 0.5 * y * y + 0.3 * x * y + 0.3 * x },
          himm: { label: 'Himmelblau', f: (x, y) => ((x * x + y - 11) ** 2 + (x + y * y - 7) ** 2) / 12 },
          egg: { label: 'egg crate', f: (x, y) => 0.06 * (x * x + y * y) + Math.sin(x) * Math.cos(y) },
        };
        const sel = v.select('landscape', Object.entries(FS).map(([k, o]) => ({ value: k, label: o.label })), 'egg');
        const nS = v.slider('starts', 4, 40, 20, { step: 1, int: true });
        let seed = 3;
        v.button('resample', () => { seed += 1; });
        const showP = v.toggle('show paths', true);
        const S = v.stage({ ...view, equal: true, axes: 'box', gutter: true, height: 380, title: 'descent from random starts' });
        const R = v.stage({ x: [0, 41], y: [0, 1], axes: 'box', gutter: true, grid: true, height: 380, title: 'final value of each run, sorted', xlabel: 'run' });
        const mc = memo();
        let info = {};
        v.render(() => {
          const O = FS[sel.value], f = O.f, n = nS.value;
          const key = [sel.value, n, seed].join('|');
          const Z = mc(key, () => {
            const r = mulberry(seed * 7919 + 13), runs = [];
            for (let i = 0; i < n; i++) {
              const x = view.x[0] + (view.x[1] - view.x[0]) * r(), y = view.y[0] + (view.y[1] - view.y[0]) * r();
              runs.push(descend(f, x, y, { iters: 700, box: [view.x[0], view.y[0], view.x[1], view.y[1]] }));
            }
            const cl = [];
            runs.forEach((q) => { let c = cl.find((k) => Math.hypot(k.x - q.x, k.y - q.y) < 0.25); if (!c) { c = { x: q.x, y: q.y, f: q.f, n: 0 }; cl.push(c); } c.n++; q.cl = cl.indexOf(c); });
            const fv = runs.map((q) => q.f).sort((a, b) => a - b);
            return { runs, cl, fv };
          });
          S.clip(() => S.contour(f, levelsOf(f, view.x[0], view.x[1], view.y[0], view.y[1], 16), { color: 'ink', alpha: 0.3, width: 1, res: 110 }));
          const cols = ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'];
          Z.runs.forEach((q) => { if (showP.value) S.path(q.path, { color: cols[q.cl % cols.length], width: 1.1, alpha: 0.55 }); S.dot(q.path[0][0], q.path[0][1], { r: 2.5, color: 'muted' }); });
          Z.cl.forEach((c, i) => S.dot(c.x, c.y, { r: 7, color: cols[i % cols.length], hollow: true, width: 2.4 }));
          const lo = Z.fv[0], hi = Z.fv[Z.fv.length - 1], span = Math.max(hi - lo, 0.3);
          R.setView([0, n + 1], [Math.min(0, lo) - 0.05 * span, hi + 0.2 * span + 0.2]);
          R.bars(Z.fv, { x0: 1, color: (val) => { const i = Z.runs.findIndex((q) => q.f === val); return cols[(i < 0 ? 0 : Z.runs[i].cl) % cols.length]; } });
          R.hline(lo, { color: 'green', width: 1.4, dash: true });
          info = { Z, lo, hi };
        });
        v.readout(() => {
          const { Z, lo, hi } = info;
          const g = Z.cl.length;
          return `**${g}** distinct end point${g === 1 ? '' : 's'} among ${Z.runs.length} runs; final values range over $[${fmt(v, lo)},${fmt(v, hi)}]$ (spread $${v.sci(Math.max(hi - lo, 1e-12), 2)}$).\n${g === 1 && hi - lo < 1e-3 ? 'Every run reaches the same value: consistent with "local minima of a convex function are global".' : 'The runs get stuck at different local minima: the landscape is not convex.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Definition',
      name: 'Strong convexity and Lipschitz gradients',
      statement: String.raw`A differentiable $f$ is **$m$-strongly convex** ($m>0$) if $f(y)\ge f(x)+\nabla f(x)^{\mathsf T}(y-x)+\frac m2\|y-x\|^2$ for all $x,y$ (equivalently $f-\frac m2\|x\|^2$ is convex; for twice differentiable $f$, $\nabla^2f\succeq mI$). Its gradient is **$M$-Lipschitz** ($M$-smooth) if $\|\nabla f(x)-\nabla f(y)\|\le M\|x-y\|$, which gives $f(y)\le f(x)+\nabla f(x)^{\mathsf T}(y-x)+\frac M2\|y-x\|^2$ (for twice differentiable $f$, $\nabla^2f\preceq MI$). Together, $mI\preceq\nabla^2f\preceq MI$ and the ratio $\kappa=M/m$ is the **condition number**. Gradient descent with step $1/M$ then satisfies $f(x_{k+1})-f^\star\le(1-m/M)\,(f(x_k)-f^\star)$.`,
      idea: String.raw`Taylor's formula with integral remainder gives $f(y)=f(x)+\nabla f(x)^{\mathsf T}(y-x)+\int_0^1(1-t)(y-x)^{\mathsf T}\nabla^2f(x+t(y-x))(y-x)\,dt$, and bounding the Hessian between $mI$ and $MI$ sandwiches $f$ between two quadratics touching at $x$. The descent rate follows by minimizing the upper quadratic (the step $1/M$ decreases $f$ by at least $\|\nabla f\|^2/2M$) and the lower one (it shows $\|\nabla f(x)\|^2\ge2m(f(x)-f^\star)$, the Polyak–Łojasiewicz inequality); combining the two gives the factor $1-m/M$.`,
      caption: String.raw`Choose a function and the window half-width $R$ (the curvature bounds are taken over $[-R,R]$ because one of the examples has none globally). Drag $x_0$: the lower parabola has curvature $m=\min f''$ and the upper $M=\max f''$, both touching $f$ at $x_0$, and $f$ stays between them on the window. **Right:** gradient descent with step $1/M$ from $x_0$: the error $f(x_k)-f^\star$ (dots, log scale) against the guaranteed envelope $(1-m/M)^k\,(f(x_0)-f^\star)$. A larger window increases $\kappa$ and flattens the envelope.`,
      deps: ['opt-3.3'],
      refs: ['Boyd–Vandenberghe §9.1'],
      tags: ['strong convexity', 'condition number', 'smoothness'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_function#Strongly_convex_functions' },
      viz(v) {
        const FS = {
          lc: { label: '$\\log\\cosh x+0.1x^2$', f: (x) => Math.log(Math.cosh(x)) + 0.1 * x * x },
          wig: { label: '$\\tfrac12x^2+0.3\\cos1.5x$', f: (x) => 0.5 * x * x + 0.3 * Math.cos(1.5 * x) },
          sq: { label: '$\\sqrt{1+x^2}+0.05x^2$', f: (x) => Math.sqrt(1 + x * x) + 0.05 * x * x },
        };
        const sel = v.select('function', Object.entries(FS).map(([k, o]) => ({ value: k, label: o.label })), 'lc');
        const rS = v.slider('window half-width $R$', 0.8, 3, 2.5, { step: 0.05 });
        const L = v.stage({ x: [-3.2, 3.2], y: [-0.5, 6], axes: 'box', gutter: true, grid: true, height: 360, title: '$f$ sandwiched between two parabolas' });
        const G = v.stage({ x: [0, 40], y: [1e-8, 10], ylog: true, axes: 'box', gutter: true, grid: true, height: 360, title: 'gradient descent, step $1/M$', xlabel: 'iteration $k$' });
        let R = 2.5;
        const P = L.handle(1.8, 0, { color: 'gold', label: '$x_0$', labelPos: 'nw', constrain: (x) => [clamp(x, -R, R), FS[sel.value].f(clamp(x, -R, R))] });
        let info = {};
        v.render(() => {
          const f = FS[sel.value].f; R = rS.value;
          P.set(clamp(P.x, -R, R), f(clamp(P.x, -R, R)));
          let m = Infinity, M = -Infinity;
          for (let i = 0; i <= 400; i++) { const x = -R + (2 * R * i) / 400, c = d2(f, x); m = Math.min(m, c); M = Math.max(M, c); }
          const x0 = P.x, f0 = f(x0), g0 = d1(f, x0);
          const lo = (x) => f0 + g0 * (x - x0) + 0.5 * m * (x - x0) ** 2, hi = (x) => f0 + g0 * (x - x0) + 0.5 * M * (x - x0) ** 2;
          L.vband(-R, R, { color: 'muted', alpha: 0.07 });
          L.fn(hi, { domain: [-R, R], color: 'red', width: 1.8, dash: true });
          L.fn(lo, { domain: [-R, R], color: 'green', width: 1.8, dash: true });
          L.fn(f, { domain: [-R, R], color: 'accent', width: 2.8, n: 300 });
          L.dot(x0, f0, { r: 6, color: 'gold' });
          let ok = true; for (let i = 0; i <= 200; i++) { const x = -R + (2 * R * i) / 200; if (f(x) < lo(x) - 1e-9 || f(x) > hi(x) + 1e-9) ok = false; }
          // gradient descent, minimizer is x = 0 for all three examples (f is even)
          const fstar = f(0), err = [];
          let x = x0;
          for (let k = 0; k <= 40; k++) { err.push(Math.max(f(x) - fstar, 1e-16)); x -= d1(f, x) / M; }
          const rate = 1 - m / M;
          G.setView([0, 40], [1e-9, Math.max(err[0] * 2, 1e-3)]);
          G.fn((k) => Math.max(rate ** k * err[0], 1e-16), { domain: [0, 40], color: 'red', width: 1.8, dash: true, n: 80 });
          G.dots(err.map((e, k) => [k, e]), { r: 3.2, color: 'accent' });
          let viol = 0; for (let k = 0; k < 40; k++) if (err[k + 1] > rate * err[k] * (1 + 1e-6) + 1e-14 && err[k] > 1e-12) viol++;
          info = { m, M, ok, rate, viol, kappa: M / m };
        });
        v.legend([['green', 'lower parabola, curvature $m$', { dash: true }], ['red', 'upper parabola / guaranteed rate, curvature $M$', { dash: true }]]);
        v.readout(() => {
          const { m, M, ok, rate, viol, kappa } = info;
          return `On the window: $m=\\min f''=${fmt(v, m)}$, $M=\\max f''=${fmt(v, M)}$, condition number $\\kappa=M/m=${v.fix(kappa, 2)}$. $f$ ${ok ? 'lies between the two parabolas on the whole window' : 'leaves the sandwich (numerical issue)'}.\nGuaranteed contraction per step: $1-m/M=${v.fix(rate, 3)}$; steps that fail to contract at least that much: **${viol}** of 40.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Definition',
      name: 'Subgradients and the subdifferential',
      statement: String.raw`A vector $g$ is a **subgradient** of $f$ at $x$ if $f(y)\ge f(x)+g^{\mathsf T}(y-x)$ for all $y$ in the domain: the affine function with slope $g$ through $(x,f(x))$ is a global underestimator. The set of all subgradients is the **subdifferential** $\partial f(x)$, a closed convex set. For convex $f$ it is nonempty at every interior point of the domain; it is the single point $\{\nabla f(x)\}$ where $f$ is differentiable, and for $f(x)=|x|$ it is $[-1,1]$ at $0$. Moreover $x$ minimizes $f$ if and only if $0\in\partial f(x)$. For a non-convex $f$ the subdifferential can be empty.`,
      idea: String.raw`For a convex $f$ the epigraph is a convex set (opt-3.1) and $(x,f(x))$ lies on its boundary, so the supporting hyperplane theorem (opt-2.8) gives a non-vertical supporting hyperplane at interior points; its slope is a subgradient. In one variable the set of slopes of supporting lines at $x$ is exactly $[f'_-(x),f'_+(x)]$, the interval between the one-sided derivatives. The minimality test is immediate from the definition: $0\in\partial f(x)$ says $f(y)\ge f(x)$ for all $y$. Smooth first-order conditions (opt-3.2) are the case where the interval shrinks to one point.`,
      caption: String.raw`Drag $x_0$ along the graph (it snaps to the kinks) and pick a function. The interval of slopes $g$ for which the line through $(x_0,f(x_0))$ stays below the whole graph is computed by brute force on a grid and drawn as a fan of orange lines (the extreme slopes in red); the slider chooses one line inside the fan. **Right:** the set-valued map $x\mapsto\partial f(x)$ for the whole function: vertical bars where it is an interval, gaps where it is **empty** (non-convex examples). The points where the bar crosses $g=0$ are exactly the global minimizers.`,
      deps: ['opt-3.2', 'opt-2.8'],
      refs: ['Boyd–Vandenberghe ch. 3'],
      tags: ['subgradient', 'subdifferential'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Subderivative' },
      viz(v) {
        const FS = {
          abs: { label: '$|x|$', f: (x) => 1.2 * Math.abs(x), kinks: [0] },
          max3: { label: '$\\max$ of three', f: (x) => Math.max(-x - 0.5, 0.2 * x * x, 1.3 * x - 1.8), kinks: [-0.5505, 2] },
          sq: { label: '$x^2/2$ (smooth)', f: (x) => x * x / 2 + 0.3 * x, kinks: [] },
          well: { label: 'double well (not convex)', f: (x) => x ** 4 / 12 - x * x / 1.2 + 2, kinks: [] },
          tent: { label: 'concave tent', f: (x) => 3 - 1.3 * Math.abs(x), kinks: [0] },
        };
        const sel = v.select('function', Object.entries(FS).map(([k, o]) => ({ value: k, label: o.label })), 'max3');
        const tS = v.slider('line inside the fan', 0, 1, 0.5, { step: 0.01 });
        const L = v.stage({ x: [-3.2, 3.2], y: [-1.5, 6], axes: 'box', gutter: true, grid: true, height: 380, title: 'supporting lines at $x_0$' });
        const R = v.stage({ x: [-3.2, 3.2], y: [-4, 4], axes: 'box', gutter: true, grid: true, height: 380, title: '$\\partial f(x)$', xlabel: '$x$', ylabel: '$g$' });
        let cur = FS.max3;
        const P = L.handle(0.6, 0, { color: 'gold', label: '$x_0$', labelPos: 'nw', constrain: (x) => { let xx = clamp(x, -3, 3); for (const k of cur.kinks) if (Math.abs(xx - k) < 0.1) xx = k; return [xx, cur.f(xx)]; } });
        const XS = linspace(-3, 3, 601);
        const sub = (f, x0, xs) => {
          let lo = -Infinity, hi = Infinity; const f0 = f(x0);
          for (const x of xs) {
            const dx = x - x0; if (Math.abs(dx) < 1e-9) continue;
            const s = (f(x) - f0) / dx;
            if (dx < 0) lo = Math.max(lo, s); else hi = Math.min(hi, s);
          }
          return [lo, hi];
        };
        const mc = memo();
        let info = {};
        v.render(() => {
          cur = FS[sel.value]; const f = cur.f;
          P.set(P.x, f(P.x));
          const xs = XS.concat(cur.kinks, [P.x]).sort((a, b) => a - b);
          const x0 = P.x, f0 = f(x0), tol = 2e-3;
          let [lo, hi] = sub(f, x0, xs);
          const empty = lo > hi + tol;
          L.fn(f, { domain: [-3, 3], color: 'accent', width: 2.8, n: 400 });
          if (!empty) {
            if (hi < lo) { const mm = (lo + hi) / 2; lo = hi = mm; }
            const nfan = 7;
            if (hi - lo > 1e-6) for (let i = 0; i <= nfan; i++) { const g = lo + ((hi - lo) * i) / nfan; L.line(-3.2, f0 + g * (-3.2 - x0), 3.2, f0 + g * (3.2 - x0), { color: 'orange', width: 1, alpha: 0.55 }); }
            L.line(-3.2, f0 + lo * (-3.2 - x0), 3.2, f0 + lo * (3.2 - x0), { color: 'red', width: 1.6 });
            L.line(-3.2, f0 + hi * (-3.2 - x0), 3.2, f0 + hi * (3.2 - x0), { color: 'red', width: 1.6 });
            const g = lo + tS.value * (hi - lo);
            L.line(-3.2, f0 + g * (-3.2 - x0), 3.2, f0 + g * (3.2 - x0), { color: 'green', width: 3 });
          } else L.corner('no supporting line: $\\partial f(x_0)=\\varnothing$', 'tl', { color: 'red' });
          L.dot(x0, f0, { r: 6, color: 'gold' });
          // set-valued map
          const M = mc(sel.value, () => {
            const xs2 = linspace(-3, 3, 241), bars = [];
            for (const x of xs2) { const [a, b] = sub(f, x, XS.concat(cur.kinks)); bars.push([x, a, b, a <= b + tol]); }
            // exact kinks as well
            for (const k of cur.kinks) { const [a, b] = sub(f, k, XS.concat(cur.kinks)); bars.push([k, a, b, a <= b + tol]); }
            let fm = Infinity; XS.forEach((x) => { fm = Math.min(fm, f(x)); });
            return { bars, fm };
          });
          M.bars.forEach(([x, a, b, ok]) => {
            if (!ok) { R.dot(x, 0, { r: 1.6, color: 'red', alpha: 0.35 }); return; }
            const A = clamp(Math.min(a, b), -4, 4), B = clamp(Math.max(a, b), -4, 4);
            R.segment([x, A], [x, B], { color: A <= 0 && B >= 0 ? 'green' : 'purple', width: B - A < 0.05 ? 2 : 3 });
          });
          R.hline(0, { color: 'ink', width: 1.2 });
          R.vline(x0, { color: 'gold', width: 1.2, dash: true });
          info = { lo, hi, empty, glob: f0 <= M.fm + 1e-3, zero: !empty && lo <= tol && hi >= -tol, x0 };
        });
        v.readout(() => {
          const { lo, hi, empty, glob, zero, x0 } = info;
          if (empty) return `At $x_0=${fmt(v, x0, 2)}$ no line through the point stays below the graph: $\\partial f(x_0)=\\varnothing$ (so $f$ is not convex).`;
          return `At $x_0=${fmt(v, x0, 2)}$: $\\partial f(x_0)\\approx[${fmt(v, lo)},${fmt(v, hi)}]$${hi - lo < 0.01 ? ' (a single slope: $f$ is differentiable here)' : ''}. $0\\in\\partial f(x_0)$: ${zero ? 'yes' : 'no'}; $x_0$ is a global minimizer on the window: ${glob ? 'yes' : 'no'}${zero === glob ? ' (the two agree)' : ' (for a non-convex $f$ a point can have $0\\in\\partial f$ only if it is a global minimizer)'}.`;
        });
      },
    },
  ],
};
