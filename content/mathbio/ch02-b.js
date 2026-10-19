// Mathematical Biology — Chapter 2, part b: items 2.8–2.14
import { MAPS, orbitOf, cobwebPts, lyapunovOf, roots1, hostParasitoid, juryStable } from './ch02.shared.js';

/** Möbius function for small n. */
function mobius(n) { let m = 1; for (let p = 2; p <= n; p++) { if (n % p === 0) { n /= p; if (n % p === 0) return 0; m = -m; } } return m; }

import { aggregation, aggregationRun } from './mathbio-source-audit-competition.js';

export default {
  collection: 'mathbio',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Phenomenon',
      name: 'Sensitive dependence and the Lyapunov exponent',
      statement: String.raw`For a one-dimensional map $x_{t+1}=f(x_t)$ the **Lyapunov exponent** of the orbit of $x_0$ is
$$\Lambda=\lim_{n\to\infty}\frac1n\sum_{t=0}^{n-1}\ln|f'(x_t)|.$$
Two orbits that start a small distance $\delta_0$ apart separate roughly as $\delta_t\approx\delta_0e^{\Lambda t}$ as long as they stay close. For the logistic map $\Lambda<0$ on stable cycles and $\Lambda>0$ on chaotic bands, and $\Lambda=\ln2$ at $r=4$. Where $\Lambda>0$ the error in any measurement of the initial state is amplified exponentially, so prediction is possible only for a time of order $\ln(1/\delta_0)/\Lambda$.`,
      idea: String.raw`Linearize: if $\delta_t=y_t-x_t$ is small, $\delta_{t+1}\approx f'(x_t)\,\delta_t$, so after $n$ steps the separation is multiplied by $\prod f'(x_t)$ and $\frac1n\ln$ of that product is the average of $\ln|f'|$ along the orbit. On a stable cycle the multiplier is below 1 (mathbio-2.4) and $\Lambda<0$; the exponent changes sign at the chaos threshold. The growth stops when the separation reaches the size of the attractor, after which the two orbits are unrelated.`,
      scope: String.raw`$\Lambda$ is computed along one orbit (almost every orbit of the logistic map at $r=4$ has $\Lambda=\ln2$). The exponential law holds only while $\delta_t$ is small; afterwards the separation saturates at the size of the attractor.`,
      caption: String.raw`Left: two orbits starting $\delta_0$ apart; their separation on a logarithmic axis rises along the dashed line of slope $\Lambda$ until it saturates. Right: $\Lambda(r)$ for the whole range of $r$ (computed from $4000$ iterates per point); the gold dot is the current $r$, click the curve to move it. Notice $\Lambda<0$ on each periodic window and $\Lambda>0$ in the chaotic bands.`,
      deps: ['mathbio-2.5', 'ode-11.7'],
      tags: ['Lyapunov exponent', 'chaos', 'sensitivity'],
      refs: ['Murray I ch. 2'],
      viz(v) {
        const r = v.slider('growth parameter $r$', 2.8, 4, 3.9, { step: 0.001 });
        const d0 = v.slider('initial separation $\\delta_0$', 1e-12, 1e-3, 1e-9, { log: true, fmt: (x) => x.toExponential(0) });
        const A = v.stage({ x: [0, 60], y: [1e-13, 3], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 300, xlabel: 't', ylabel: '$|x_t-y_t|$', title: 'two nearby orbits' });
        const B = v.stage({ x: [2.8, 4], y: [-1.6, 0.9], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'r', ylabel: '$\\Lambda(r)$', title: 'Lyapunov exponent against $r$' });
        const NR = 500, curve = [];
        for (let i = 0; i <= NR; i++) { const rr = 2.8 + (1.2 * i) / NR; curve.push([rr, lyapunovOf((x) => rr * x * (1 - x), (x) => rr * (1 - 2 * x), 0.3 + 1e-3 * Math.sqrt(2), 3000, 300)]); }
        B.onClick((x) => r.set(v.M.clamp(x, 2.8, 4)));
        let Lam = 0, meas = NaN, horizon = NaN;
        v.render(() => {
          const rv = r.value, g = (x) => rv * x * (1 - x), dg = (x) => rv * (1 - 2 * x), dl = d0.value;
          const xo = orbitOf(g, 0.3, 60), yo = orbitOf(g, 0.3 + dl, 60);
          const sep = xo.map((x, t) => Math.max(Math.abs(x - yo[t]), 1e-13));
          Lam = lyapunovOf(g, dg, 0.3, 5000, 300);
          A.fn((t) => dl * Math.exp(Lam * t), { color: 'purple', dash: true, width: 1.8, domain: [0, 60], n: 120 });
          A.hline(1, { color: 'faint', dash: true });
          A.path(sep.map((y, t) => [t, y]), { color: 'orange', width: 2.2 });
          sep.forEach((y, t) => A.dot(t, y, { r: 3, color: 'gold' }));
          B.hline(0, { color: 'muted', width: 1.2 });
          B.path(curve.map(([x, y]) => [x, Math.max(y, -1.6)]), { color: 'accent', width: 1.6 });
          B.dot(rv, Math.max(Lam, -1.6), { r: 6, color: 'gold' });
          let k = 0; while (k < 59 && sep[k + 1] < 0.1) k++;
          meas = k > 3 ? Math.log(sep[k] / sep[0]) / k : NaN;
          horizon = Lam > 0 ? Math.log(0.1 / dl) / Lam : NaN;
        });
        v.readout(() => String.raw`$r=${v.fix(r.value, 3)}$: $\Lambda=${v.fix(Lam, 4)}$ ${Lam > 0 ? '(positive: chaos)' : '(negative: stable cycle, orbits converge)'}${Math.abs(r.value - 4) < 1e-9 ? String.raw`; $\ln2=${v.fix(Math.LN2, 4)}$` : ''}
 measured growth rate of $\ln|x_t-y_t|$ before saturation: ${isFinite(meas) ? '$' + v.fix(meas, 3) + '$' : 'n/a (no early growth)'}${isFinite(horizon) ? String.raw`; separation reaches $0.1$ after about $${v.fix(horizon, 1)}$ generations` : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Period three implies chaos (Li–Yorke, Sharkovskii)',
      credit: 'Sharkovskii, 1964; Li & Yorke, 1975',
      statement: String.raw`Let $f:I\to I$ be a continuous map of an interval. **Sharkovskii:** order the positive integers
$$3\prec5\prec7\prec\cdots\prec2\cdot3\prec2\cdot5\prec\cdots\prec4\cdot3\prec4\cdot5\prec\cdots\prec\cdots\prec8\prec4\prec2\prec1 .$$
If $f$ has a point of least period $m$, then it has points of every least period $n$ with $m\prec n$. In particular a period-3 point forces points of **every** period (**Li–Yorke**), together with an uncountable set of points whose orbits neither converge to a cycle nor stay together. The logistic map $rx(1-x)$ acquires a period-3 cycle at $r=1+2\sqrt2\approx3.8284$.`,
      idea: String.raw`The proof tracks which intervals the map must stretch over each other: a 3-cycle $a<b<c$ gives two intervals $[a,b]$ and $[b,c]$, and by the intermediate value theorem (pma-4.23) $f$ maps one onto the other and the other onto both. These covering relations form a graph whose closed walks of length $n$ produce a periodic point of every period $n$. The ordering says which cycle lengths force which others; being first in the order, 3 forces all.`,
      scope: String.raw`Continuous maps of an interval (or the real line) only; the periodic points guaranteed by the theorem need not be stable, so for the logistic map they do not show up in a simulation except in their own window. The picture here counts the periodic points of $f^n$ numerically (periods up to $10$), so it checks consistency with the ordering rather than proving it.`,
      caption: String.raw`Left: the graph of the third iterate $f^3$ against the diagonal; at $r=1+2\sqrt2$ a pair of new crossings appears (a tangency), which is the 3-cycle. Right: the Sharkovskii ladder, with a rung lit if the map at this $r$ has a point of that least period (counted from the crossings of $f^n$ with the diagonal, so the number of cycles shown is approximate near $r=4$). Raise $r$ through $3.8284$ and watch all periods light up together; below it find the first parameter where period 6 or 5 exists but 3 does not.`,
      deps: ['mathbio-2.5', 'pma-4.23', 'ode-11.10'],
      tags: ['Sharkovskii', 'Li-Yorke', 'chaos'],
      refs: ['Murray I ch. 2'],
      viz(v) {
        const r = v.slider('growth parameter $r$', 3.2, 4, 3.84, { step: 0.0005 });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: '$x$', ylabel: '$f^3(x)$', title: 'the third iterate and the diagonal' });
        const ORDER = [3, 5, 7, 9, 6, 10, 8, 4, 2, 1];
        const B = v.stage({ x: [0, ORDER.length], y: [0, 3], axes: false, height: 340, weight: 1, minWidth: 300, title: 'Sharkovskii ladder (periods up to 10)' });
        const cache = new Map();
        const count = (rv) => {
          const key = Math.round(rv * 2000);
          if (cache.has(key)) return cache.get(key);
          const g = (x) => rv * x * (1 - x), fixed = [0];
          for (let n = 1; n <= 10; n++) fixed.push(roots1((x) => { let y = x; for (let i = 0; i < n; i++) y = g(y); return y - x; }, 0, 1, 30000).length);
          const exact = [0];
          for (let n = 1; n <= 10; n++) { let s = 0; for (let d = 1; d <= n; d++) if (n % d === 0) s += mobius(n / d) * fixed[d]; exact.push(s); }
          cache.set(key, exact); return exact;
        };
        let exact = [], ok = true, firstIdx = -1;
        v.render(() => {
          const rv = r.value, g = (x) => rv * x * (1 - x);
          A.fn((x) => x, { color: 'muted', width: 1.5 });
          A.fn((x) => g(g(g(x))), { color: 'accent', width: 2.2, n: 1200 });
          const fps = roots1((x) => g(g(g(x))) - x, 0, 1, 6000);
          for (const x of fps) { const y1 = g(x), y2 = g(y1); const m = rv * (1 - 2 * x) * rv * (1 - 2 * y1) * rv * (1 - 2 * y2); A.dot(x, x, { r: 4.5, color: Math.abs(m) < 1 ? 'green' : 'red' }); }
          exact = count(rv);
          ORDER.forEach((p, i) => {
            const has = exact[p] > 0;
            B.rect(i + 0.08, 0.6, i + 0.92, 1.8, { fill: has ? 'green' : 'faint', fillAlpha: has ? 0.35 : 0.12, color: has ? 'green' : 'faint', width: 1.5, radius: 6 });
            B.text(String(p), i + 0.5, 1.3, { align: 'center', size: 17, color: has ? 'ink' : 'muted' });
            B.text(has ? `×${Math.round(exact[p] / p)}` : '–', i + 0.5, 0.85, { align: 'center', size: 12, color: has ? 'green' : 'muted' });
          });
          B.text('Sharkovskii order, left to right (×n = number of cycles found)', ORDER.length / 2, 2.4, { align: 'center', size: 13, color: 'muted' });
          firstIdx = ORDER.findIndex((p) => exact[p] > 0);
          ok = firstIdx < 0 || ORDER.slice(firstIdx).every((p) => exact[p] > 0);
        });
        v.readout(() => String.raw`$r=${v.fix(r.value, 4)}$ (period-3 window opens at $1+2\sqrt2=${v.fix(1 + 2 * Math.SQRT2, 5)}$): periods present among $1,\dots,10$: ${ORDER.filter((p) => exact[p] > 0).sort((a, b) => a - b).join(', ') || 'none'}
 ${firstIdx < 0 ? 'no cycle in the ladder is found' : `first rung present: $${ORDER[firstIdx]}$; every later rung present: **${ok ? 'yes' : 'NO (numerical miss near a tangency)'}**`}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Model',
      name: 'Ricker model',
      credit: 'Ricker, 1954',
      statement: String.raw`The Ricker model is $N_{t+1}=N_t\exp\bigl[r(1-N_t/K)\bigr]$: each generation is the previous one multiplied by $e^{r}$ at low density, with the factor falling exponentially as $N$ approaches and exceeds $K$. The positive fixed point is $N^*=K$, with multiplier $f'(K)=1-r$, so it is stable for $0<r<2$. Beyond $r=2$ it loses stability by period doubling, and for large $r$ the dynamics become chaotic, after the accumulation point $r\approx2.692$. Because the factor never makes $N$ negative and decreases for $N>K$, the map is **overcompensating**: a large stock produces few recruits. In fisheries it is written as a stock–recruitment curve $R=Se^{a-bS}$, with $\ln(R/S)$ linear in $S$.`,
      idea: String.raw`Differentiating $f(N)=Ne^{r(1-N/K)}$ gives $f'=e^{r(1-N/K)}(1-rN/K)$, which equals $1-r$ at $N=K$; mathbio-2.4 then gives stability for $|1-r|<1$. Since $\ln(R/S)=a-bS$ is a straight line, the Ricker curve is fitted to stock–recruitment data by ordinary linear regression with $r=a$ and $K=a/b$. The hump of the curve (maximum at $S=K/r$) is what produces the cobweb overshoots of mathbio-2.5.`,
      scope: String.raw`Ricker introduced the curve for fisheries, where cannibalism or disease of recruits depend on parent stock. The thresholds $r=2$ and $r\approx2.692$ are those listed by May (1976) for this map. The data points on screen are **synthetic** (generated by the model with multiplicative lognormal noise), not a real fishery.`,
      caption: String.raw`Left: synthetic stock–recruitment data (drawn from a Ricker curve with noise) and the curve fitted by regressing $\ln(R/S)$ on $S$; change the true rate or noise, or press Resample. Right: the fitted model projected forward from a small stock. Raise $r$ and the projection goes from smooth approach to a cycle to irregular boom and bust, even though nothing random is happening in the projection.`,
      deps: ['mathbio-2.4'],
      tags: ['Ricker', 'stock-recruitment', 'overcompensation'],
      refs: ['Edelstein-Keshet ch. 3'],
      viz(v) {
        const rt = v.slider('true rate $r$', 0.3, 3.4, 2.3, { step: 0.01 });
        const sg = v.slider('noise level $\\sigma$', 0, 0.5, 0.15, { step: 0.01 });
        let seed = 7; v.button('Resample', () => { seed += 1; });
        const K = 1000;
        const A = v.stage({ x: [0, 2500], y: [0, 3000], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'stock $S$ (thousands)', ylabel: 'recruits $R$ (thousands)', title: 'synthetic stock–recruitment data' });
        const B = v.stage({ x: [0, 50], y: [0, 3000], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'generation t', ylabel: 'stock', title: 'projection with the fitted model' });
        v.legend([['gold', 'data (synthetic)'], ['muted', 'true curve', { dash: true }], ['accent', 'fitted Ricker curve'], ['green', 'replacement line $R=S$', { dash: true }]]);
        let fit = { a: 0, K: 0 }, rhat = 0;
        v.render(() => {
          const rg = v.rng(seed), r0 = rt.value, s = sg.value;
          const S = [], R = [];
          for (let i = 0; i < 30; i++) { const x = 100 + 2200 * rg(); S.push(x); R.push(x * Math.exp(r0 * (1 - x / K) + s * rg.normal())); }
          const lr = v.M.linreg(S, R.map((y, i) => Math.log(y / S[i])));
          rhat = lr.intercept; fit = { a: lr.intercept, K: lr.slope < 0 ? -lr.intercept / lr.slope : Infinity };
          const tr = (x) => x * Math.exp(r0 * (1 - x / K)), fr = (x) => x * Math.exp(lr.intercept + lr.slope * x);
          const top = Math.max(...R, ...Array.from({ length: 60 }, (_, i) => tr(i * 40)), 500) * 1.08;
          A.setView([0, 2500], [0, top]);
          A.fn((x) => x, { color: 'green', dash: true, width: 1.4 });
          A.fn(tr, { color: 'muted', dash: true, width: 2, domain: [0, 2500], n: 300 });
          A.fn(fr, { color: 'accent', width: 3, domain: [0, 2500], n: 300 });
          S.forEach((x, i) => A.dot(x, R[i], { r: 4, color: 'gold' }));
          const orb = orbitOf(fr, 100, 50);
          B.setView([0, 50], [0, Math.max(1500, ...orb) * 1.08]);
          if (isFinite(fit.K)) B.hline(fit.K, { color: 'green', dash: true, width: 1.5 });
          B.path(orb.map((y, t) => [t, y]), { color: 'orange', width: 1.6 });
          orb.forEach((y, t) => B.dot(t, y, { r: 3, color: 'gold' }));
        });
        v.readout(() => String.raw`regression of $\ln(R/S)$ on $S$: $\hat r=${v.fix(rhat, 3)}$ (true $${v.fix(rt.value, 2)}$), $\hat K=${isFinite(fit.K) ? v.fix(fit.K, 0) : '\\infty'}$ (true $${K}$)
 the fitted model has $f'(\hat K)=1-\hat r=${v.fix(1 - rhat, 3)}$: ${rhat < 2 ? 'stable equilibrium ($\\hat r<2$)' : rhat < 2.6924 ? 'a stable cycle ($2\\le\\hat r<2.692$)' : 'in the chaotic region ($\\hat r>2.692$)'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Model',
      name: 'Beverton–Holt model',
      credit: 'Beverton & Holt, 1957',
      statement: String.raw`The Beverton–Holt model is $N_{t+1}=\dfrac{RN_t}{1+(R-1)N_t/K}$ with $R>1$ the density-free growth factor and $K$ the equilibrium. Its fixed points are $0$ (unstable) and $K$, and every orbit starting at $N_0>0$ converges monotonically to $K$, **for every $R>1$**: the map is increasing, so orbits cannot oscillate about $K$. The solution is explicit: $1/N_t$ satisfies the linear recursion $\dfrac1{N_{t+1}}=\dfrac1R\dfrac1{N_t}+\dfrac{R-1}{RK}$, so $\dfrac1{N_t}-\dfrac1K=R^{-t}\Bigl(\dfrac1{N_0}-\dfrac1K\Bigr)$.`,
      idea: String.raw`The map is a Möbius (fractional linear) transformation, so inverting $N$ linearizes it. Because the map $f$ is increasing with $f'(K)=1/R\in(0,1)$, cobwebs are monotone staircases with no overshoot (mathbio-2.4). Compare the Ricker map (mathbio-2.10), which has the same low-density growth factor $R=e^{r}$ and the same equilibrium but a hump; it is overcompensating (a large stock reduces the next generation) whereas Beverton–Holt is compensating (the next generation saturates at $RK/(R-1)$).`,
      scope: String.raw`Derived in fisheries from the assumption that mortality of recruits is proportional to their density; it is also the discrete-time analogue of the logistic equation (mathbio-1.4) with an explicit solution.`,
      caption: String.raw`The same growth factor $R$ and the same $K=1$ in both maps. Raise $R$: the Beverton–Holt cobweb (middle) stays a monotone staircase into $K$ however large $R$ is, while the Ricker cobweb (left, $r=\ln R$) spirals out into cycles beyond $R=e^{2}\approx7.4$ and is chaotic beyond $R\approx e^{2.692}\approx14.8$. The right panel shows both time series from the same $N_0$.`,
      deps: ['mathbio-2.4'],
      tags: ['Beverton-Holt', 'compensation', 'stock-recruitment'],
      refs: ['Edelstein-Keshet ch. 3'],
      viz(v) {
        const R = v.slider('growth factor $R$', 1.2, 60, 12, { log: true, sig: 3 });
        const N0 = v.slider('start $N_0/K$', 0.02, 0.9, 0.1, { step: 0.01 });
        const A = v.stage({ x: [0, 2], y: [0, 2], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: '$N_t$', ylabel: '$N_{t+1}$', title: 'Ricker, $r=\\ln R$' });
        const B = v.stage({ x: [0, 3], y: [0, 3], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: '$N_t$', ylabel: '$N_{t+1}$', title: 'Beverton–Holt' });
        const C = v.stage({ x: [0, 30], y: [0, 2], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 250, xlabel: 't', ylabel: '$N_t/K$', title: 'time series' });
        v.legend([['accent', 'Beverton–Holt'], ['orange', 'Ricker'], ['green', '$K$', { dash: true }]]);
        let rk = 0, bh = [], ri = [], mono = true, resid = 0;
        v.render(() => {
          const Rv = R.value, r = Math.log(Rv);
          const fr = (x) => x * Math.exp(r * (1 - x)), fb = (x) => (Rv * x) / (1 + (Rv - 1) * x);
          const topR = Math.max(1.5, Math.exp(r - 1) / r * 1.05);
          A.setView([0, topR], [0, topR]);
          A.fn((x) => x, { color: 'muted', width: 1.4 });
          A.fn(fr, { color: 'orange', width: 2.6, n: 400 });
          A.path(cobwebPts(fr, N0.value, 25), { color: 'orange', width: 1.2, alpha: 0.8 });
          const topB = Rv / (Rv - 1) * 1.05 + 0.3;
          B.setView([0, Math.max(1.5, topB)], [0, Math.max(1.5, topB)]);
          B.fn((x) => x, { color: 'muted', width: 1.4 });
          B.fn(fb, { color: 'accent', width: 2.6, n: 400 });
          B.path(cobwebPts(fb, N0.value, 25), { color: 'accent', width: 1.2, alpha: 0.8 });
          B.hline(Rv / (Rv - 1), { color: 'faint', dash: true, width: 1 });
          bh = orbitOf(fb, N0.value, 30); ri = orbitOf(fr, N0.value, 30);
          C.setView([0, 30], [0, Math.max(1.5, ...ri.map((y) => (isFinite(y) ? y : 0)), 1.1) * 1.05]);
          C.hline(1, { color: 'green', dash: true, width: 1.5 });
          C.path(ri.map((y, t) => [t, y]), { color: 'orange', width: 1.6 });
          C.path(bh.map((y, t) => [t, y]), { color: 'accent', width: 2.4 });
          bh.forEach((y, t) => C.dot(t, y, { r: 3, color: 'accent' }));
          mono = bh.every((y, t) => t === 0 || y >= bh[t - 1] - 1e-12) && bh.every((y) => y <= 1 + 1e-9);
          const invK = 1; resid = Math.max(...bh.map((y, t) => Math.abs((1 / y - invK) - Math.pow(Rv, -t) * (1 / N0.value - invK)) / Math.abs(1 / y - invK + 1e-9)));
          rk = r;
        });
        v.readout(() => String.raw`$R=${v.fix(R.value, 2)}$, so the Ricker rate is $r=\ln R=${v.fix(rk, 3)}$ (${rk < 2 ? 'stable' : rk < 2.6924 ? 'cycles' : 'chaotic region'}); Beverton–Holt: $N_{30}=${v.fix(bh[30], 5)}$, monotone and $\le K$: **${mono ? 'yes' : 'no'}**
 check of $1/N_t-1/K=R^{-t}(1/N_0-1/K)$: largest relative deviation $${v.sci(resid, 2)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Theorem',
      name: 'Stability of planar maps: the Jury conditions',
      credit: 'Jury & Blanchard, 1961 (tabular stability test)',
      statement: String.raw`Let $x^*$ be a fixed point of a planar map $\mathbf x_{t+1}=F(\mathbf x_t)$ with Jacobian $J=DF(x^*)$, trace $T$ and determinant $D$. Both eigenvalues of $J$ lie strictly inside the unit circle (so $x^*$ is asymptotically stable) if and only if
$$|D|<1,\qquad 1-T+D>0,\qquad 1+T+D>0,$$
i.e. $(T,D)$ lies in the open triangle with vertices $(-2,1)$, $(2,1)$ and $(0,-1)$. Crossing $1-T+D=0$ puts an eigenvalue at $+1$ (fold, transcritical or pitchfork), crossing $1+T+D=0$ puts one at $-1$ (period doubling), and crossing $D=1$ with $|T|<2$ puts a complex pair on the unit circle (Neimark–Sacker, an invariant closed curve). If some eigenvalue lies outside the circle the point is unstable.`,
      idea: String.raw`The eigenvalues are the roots of $p(z)=z^2-Tz+D$ with $p(1)=1-T+D$ and $p(-1)=1+T+D$. For a complex pair $|z|^2=D$, so they are inside the circle iff $D<1$. For real roots, both lie in $(-1,1)$ iff $p(\pm1)>0$ and the vertex lies between $\pm1$, which (with $|D|<1$) is the triangle. The conditions are the two-dimensional case of the linearization theorem for maps (the derivative is the Jacobian matrix, pma-9.17), and they are the counterpart for maps of the Routh–Hurwitz conditions of chapter 3.`,
      scope: String.raw`Gives linear (local) stability; on the boundary of the triangle linearization is inconclusive and nonlinear terms decide. The orbit shown is the linear map $\mathbf x\mapsto J\mathbf x$ with $J=\begin{pmatrix}0&-D\\1&T\end{pmatrix}$, a matrix with the chosen trace and determinant.`,
      caption: String.raw`Drag the gold point in the trace–determinant plane. Left: the stability triangle (green), with the parabola $D=T^2/4$ separating real from complex eigenvalues. Middle: the eigenvalues against the unit circle. Right: the orbit of $\mathbf x_0=(1,0)$ under $J$: it spirals in or out when the eigenvalues are complex and tilts to a straight run when they are real. Cross each edge and note which eigenvalue reaches the circle.`,
      deps: ['mathbio-2.4', 'pma-9.17'],
      tags: ['Jury conditions', 'stability triangle', 'planar maps'],
      refs: ['Edelstein-Keshet ch. 2'],
      viz(v) {
        const A = v.stage({ x: [-3, 3], y: [-1.6, 2], axes: true, height: 340, weight: 1, minWidth: 280, xlabel: 'T', ylabel: 'D', title: 'trace–determinant plane' });
        const B = v.stage({ x: [-2.6, 2.6], y: [-2.1, 2.1], equal: true, axes: true, height: 340, weight: 1, minWidth: 240, title: 'eigenvalues' });
        const C = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 340, weight: 1, minWidth: 240, title: 'orbit of $(1,0)$' });
        const h = A.handle(0.8, 0.5, { color: 'gold', r: 8, constrain: (x, y) => [v.M.clamp(x, -3, 3), v.M.clamp(y, -1.6, 2)] });
        let T = 0, D = 0, ev = [], stab = false, edge = '';
        v.render(() => {
          T = h.x; D = h.y;
          A.poly([[-2, 1], [2, 1], [0, -1]], { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2 });
          A.fn((x) => (x * x) / 4, { color: 'muted', dash: true, width: 1.4, domain: [-3, 3], n: 120 });
          A.line(-3, 1, 3, 1, { color: 'muted', width: 1 });
          A.text('$D=1$', 2.95, 1.2, { align: 'right', size: 12, color: 'muted' });
          A.text('$1+T+D=0$', -0.75, -0.4, { align: 'right', size: 12, color: 'muted' });
          A.text('$1-T+D=0$', 0.75, -0.4, { align: 'left', size: 12, color: 'muted' });
          A.text('stable', 0, 0.2, { align: 'center', size: 14, color: 'green' });
          const disc = T * T - 4 * D;
          ev = disc >= 0 ? [[(T + Math.sqrt(disc)) / 2, 0], [(T - Math.sqrt(disc)) / 2, 0]] : [[T / 2, Math.sqrt(-disc) / 2], [T / 2, -Math.sqrt(-disc) / 2]];
          stab = juryStable(T, D);
          B.circle(0, 0, 1, { color: 'muted', width: 1.8, dash: true });
          ev.forEach(([re, im]) => B.dot(re, im, { r: 7, color: Math.hypot(re, im) < 1 ? 'green' : 'red' }));
          const J = [[0, -D], [1, T]];
          let x = [1, 0]; const pts = [[1, 0]];
          for (let i = 0; i < 40; i++) { x = [J[0][0] * x[0] + J[0][1] * x[1], J[1][0] * x[0] + J[1][1] * x[1]]; if (Math.hypot(x[0], x[1]) > 50) break; pts.push(x); }
          C.clip(() => { C.path(pts, { color: 'orange', width: 1.5 }); pts.forEach(([a, b], i) => C.dot(a, b, { r: i === 0 ? 5 : 3, color: i === 0 ? 'gold' : 'orange' })); });
          const e1 = 1 - T + D, e2 = 1 + T + D;
          edge = stab ? '' : Math.abs(D) >= 1 && D > 0 ? 'beyond $D=1$ (a complex pair or both real eigenvalues outside the unit circle)' : e1 <= 0 ? 'past $1-T+D=0$: an eigenvalue exceeds $+1$' : e2 <= 0 ? 'past $1+T+D=0$: an eigenvalue is below $-1$' : 'determinant below $-1$';
        });
        v.readout(() => String.raw`$T=${v.fix(T, 2)}$, $D=${v.fix(D, 2)}$: $|D|<1$: ${Math.abs(D) < 1 ? 'yes' : 'no'}; $1-T+D=${v.fix(1 - T + D, 2)}$ ${1 - T + D > 0 ? '>0' : '≤0'}; $1+T+D=${v.fix(1 + T + D, 2)}$ ${1 + T + D > 0 ? '>0' : '≤0'} ⇒ **${stab ? 'stable' : 'unstable'}** ${edge}
 eigenvalues ${ev.map(([a, b]) => (Math.abs(b) < 1e-9 ? v.fix(a, 3) : `${v.fix(a, 3)}${b < 0 ? '−' : '+'}${v.fix(Math.abs(b), 3)}i`)).join(', ')}; largest modulus $${v.fix(Math.max(...ev.map(([a, b]) => Math.hypot(a, b))), 3)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Model',
      name: 'Nicholson–Bailey host–parasitoid model',
      credit: 'Nicholson & Bailey, 1935',
      statement: String.raw`Let $N_t$ hosts and $P_t$ parasitoids be counted each generation. If each parasitoid searches at random (encounters per host are Poisson with mean $aP_t$) and each host that escapes reproduces $\lambda>1$-fold, while each parasitized host yields $c$ parasitoids, then
$$N_{t+1}=\lambda N_te^{-aP_t},\qquad P_{t+1}=cN_t\bigl(1-e^{-aP_t}\bigr).$$
The coexistence equilibrium is $aP^*=\ln\lambda$, $N^*=\lambda\ln\lambda/\bigl(ac(\lambda-1)\bigr)$. Its Jacobian has trace $1+\ln\lambda/(\lambda-1)$ and determinant $\lambda\ln\lambda/(\lambda-1)>1$ for every $\lambda>1$, so the equilibrium is **always unstable**, with a complex pair of eigenvalues spiralling outwards (growing oscillations of both species).`,
      idea: String.raw`At the equilibrium $\partial N'/\partial N=1$, $\partial N'/\partial P=-aN^*$, $\partial P'/\partial N=c(1-1/\lambda)$ and $\partial P'/\partial P=\ln\lambda/(\lambda-1)$, so $D=\lambda\ln\lambda/(\lambda-1)$; and $\ln\lambda>1-1/\lambda$ makes $D>1$, outside the Jury triangle of mathbio-2.12 (the product of the two eigenvalues exceeds 1). Hosts and parasitoids chase each other with a delay of one generation, and the amplitude grows until one population is so small that, in a real system, it vanishes.`,
      scope: String.raw`A deliberately minimal model: random search, no host density dependence, one attack per host, discrete synchronized generations. Nicholson and Bailey, Proc. Zool. Soc. London 105 (1935) 551–598. The stochastic version here draws survivors binomially from a finite integer population, and declares extinction when a population falls below one individual.`,
      caption: String.raw`Drag the gold point (the starting state, in logarithmic units relative to the equilibrium) and choose $\lambda$ and the equilibrium host number $H$. The deterministic orbit spirals outward in the $(\ln N,\ln P)$ plane; the time series (log axis) show oscillations of growing amplitude until a species falls below one individual. Switch on demographic noise to run the finite-population version.`,
      deps: ['mathbio-2.12'],
      tags: ['host-parasitoid', 'Nicholson-Bailey', 'instability'],
      refs: ['Edelstein-Keshet ch. 3', 'Murray I ch. 3'],
      viz(v) {
        const lam = v.slider('host reproduction $\\lambda$', 1.2, 6, 2, { step: 0.05 });
        const H = v.slider('equilibrium host number $H=N^*$', 20, 2000, 200, { log: true, sig: 2 });
        const noise = v.toggle('demographic noise (integer populations)', false);
        let seed = 3; v.button('New random run', () => { seed += 1; });
        const A = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: true, height: 340, weight: 1, minWidth: 280, xlabel: '$\\ln(N/N^*)$', ylabel: '$\\ln(P/P^*)$', title: 'phase plane (log coordinates)' });
        const B = v.stage({ x: [0, 40], y: [1e-3, 1e3], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 300, xlabel: 'generation t', ylabel: 'density relative to equilibrium', title: 'hosts and parasitoids' });
        v.legend([['accent', 'hosts $N_t/N^*$'], ['red', 'parasitoids $P_t/P^*$']]);
        const h = A.handle(0.1, 0, { color: 'gold', r: 8, constrain: (x, y) => [v.M.clamp(x, -2, 2), v.M.clamp(y, -2, 2)] });
        let eig = 0, slope = NaN, extinct = null, hostRes = { D: 0, T: 0, N: 0, P: 0, L: 2 };
        v.render(() => {
          const L = lam.value, M = hostParasitoid(L, Infinity), Hn = H.value, s = Hn / M.Ns;
          let n = M.Ns * Math.exp(h.x), p = M.Ps * Math.exp(h.y), N = n * s, P = p * s; // absolute counts; a = 1/s
          const rg = v.rng(seed);
          const traj = [[N, P]]; extinct = null;
          const binom = (m, q) => { if (m < 250) { let k = 0; for (let i = 0; i < m; i++) if (rg() < q) k++; return k; } return Math.max(0, Math.min(m, Math.round(m * q + Math.sqrt(m * q * (1 - q)) * rg.normal()))); };
          for (let t = 0; t < 40; t++) {
            const esc = Math.exp(-P / s);
            let N2, P2;
            if (noise.value) { const Ni = Math.round(N), surv = binom(Ni, esc); N2 = Math.floor(L * surv + rg()); P2 = Ni - surv; }
            else { N2 = L * N * esc; P2 = N * (1 - esc); }
            N = N2; P = P2;
            if (N < 1 || P < 1) { extinct = [t + 1, N < 1 ? 'hosts' : 'parasitoids']; traj.push([Math.max(N, 0), Math.max(P, 0)]); break; }
            if (N > 1e6 * Hn) break;
            traj.push([N, P]);
          }
          const lg = (x, base) => Math.log(Math.max(x, 1e-9) / base);
          const ph = traj.map(([a, b]) => [lg(a, Hn), lg(b, M.Ps * s)]);
          A.clip(() => { A.path(ph, { color: 'orange', width: 1.6 }); ph.forEach(([a, b], i) => A.dot(a, b, { r: i === 0 ? 0 : 3, color: 'gold' })); });
          A.dot(0, 0, { r: 6, color: 'red', hollow: true });
          B.hline(1, { color: 'faint', dash: true });
          B.path(traj.map(([a], t) => [t, Math.max(a / Hn, 1e-3)]), { color: 'accent', width: 2.2 });
          B.path(traj.map(([, b], t) => [t, Math.max(b / (M.Ps * s), 1e-3)]), { color: 'red', width: 2.2 });
          const jc = M.jac(); eig = Math.sqrt(jc.D);
          const sample = ph.slice(0, 15).map(([a, b]) => Math.hypot(a, b)).filter((x) => x > 1e-9);
          if (!noise.value && sample.length > 6) { const lr = v.M.linreg(sample.map((_, i) => i), sample.map((x) => Math.log(x))); slope = Math.exp(lr.slope); } else slope = NaN;
          hostRes = { D: jc.D, T: jc.T, N: M.Ns * s, P: M.Ps * s, L };
        });
        v.readout(() => String.raw`$\lambda=${v.fix(lam.value, 2)}$: determinant $D=\lambda\ln\lambda/(\lambda-1)=${v.fix(hostRes.D, 4)}>1$, trace $T=${v.fix(hostRes.T, 3)}$; complex eigenvalues of modulus $\sqrt D=${v.fix(eig, 4)}$ ⇒ **unstable**
 ${noise.value ? 'stochastic run' : 'small-oscillation growth factor measured from the orbit: ' + (isFinite(slope) ? '$' + v.fix(slope, 3) + '$ per generation' : 'n/a')}; ${extinct ? `**${extinct[1]} fall below one individual in generation ${extinct[0]}**` : 'no extinction within 40 generations'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Phenomenon',
      name: 'Nicholson–Bailey instability and stabilization by aggregation',
      credit: 'May, 1978 (negative-binomial attack model)',
      statement: String.raw`Replacing Poisson attacks by a negative-binomial attack count gives escape probability $g(P)=(1+aP/k)^{-k}$ and the map $N_{t+1}=\lambda N_tg(P_t)$, $P_{t+1}=cN_t(1-g(P_t))$, for $\lambda>1$, $a,c,k>0$. Its coexistence equilibrium is **locally asymptotically stable for every $\lambda>1$ if $0<k<1$**, and linearly unstable for $k>1$. At $k=1$ the eigenvalues have unit modulus; strict linear stability fails, and this is a nonhyperbolic boundary rather than an exponentially growing spiral. The Poisson limit $k\to\infty$ recovers Nicholson–Bailey instability.`,
      idea: String.raw`Write $D=k(1-\lambda^{-1/k})/(1-\lambda^{-1})$ and $T=1+D/\lambda$ for the determinant and trace. The two nontrivial Jury inequalities are $D<1$ and $1-T+D=D(1-1/\lambda)>0$. The latter is automatic; $D$ increases strictly with $k$ and equals one at $k=1$, proving the threshold. Stable perturbations can decay monotonically or oscillate: not every stable case is a spiral. May’s original Appendix 2 gives this local proof and distinguishes it from numerical evidence about large disturbances.`,
      scope: String.raw`May’s phenomenological model summarizes aggregated attacks across patches; small $k$ means more overdispersion, and $k=\infty$ is Poisson. A fixed yield $c$ rescales population units and does not change this local criterion. Finite trajectories from a log displacement $0.3$ are illustrative and do not establish global attraction. At $k=1$ the map preserves area in logarithmic coordinates, precluding asymptotic attraction of an open neighborhood.`,
      caption: String.raw`Left: exact local classification over $k$ (log axis) and $\lambda$; drag the gold point. Green is stable, red unstable and the $k=1$ line is the nonhyperbolic boundary (dragging within $0.02$ log units snaps to it). Right: finite log-population trajectories relative to each model’s own equilibrium, with the Poisson comparison dashed. Numerical iteration stops before a coordinate exceeds $8$ in magnitude; a stopped trajectory is not a biological extinction claim.`,
      deps: ['mathbio-2.13'],
      verify: false,
      tags: ['aggregation', 'negative binomial', 'stabilization'],
      refs: ['May (1978), Host-Parasitoid Systems in Patchy Environments: A Phenomenological Model, pp. 838–839, equations (3)–(7); Appendix 2 pp. 843–844'],
      links: {doi:'https://doi.org/10.2307/3674'},
      viz(v) {
        const A=v.stage({x:[-1.4,1.4],y:[.7,12.4],axes:'box',gutter:true,height:340,minWidth:300,xlabel:'clumping k (log scale)',ylabel:'host reproduction λ',title:'exact local stability',xticks:[[-1,'0.1'],[0,'1'],[1,'10']]});
        const B=v.stage({x:[-3,3],y:[-3,3],equal:true,axes:true,height:340,minWidth:280,xlabel:'ln(N/N*)',ylabel:'ln(P/P*)',title:'120-generation orbit or display stop'});
        const h=A.handle(-.4,3,{color:'gold',r:8,constrain:(x,y)=>[Math.abs(x)<.02?0:v.M.clamp(x,-1.3,1.3),v.M.clamp(y,1.1,12)]});let info=null;
        v.legend([['green','locally asymptotically stable',{area:true}],['red','linearly unstable',{area:true}],['orange','aggregated attacks'],['purple','Poisson comparison',{dash:true}]]);
        const green=v.rgb('green'),red=v.rgb('red');
        v.render(()=>{const k=10**h.x,L=h.y,M=aggregation(L,k),Q=aggregationRun(L,k),P=aggregationRun(L,Infinity);info={...M,stopped:Q.stopped};
          A.raster((x,y)=>x< -1.3||x>1.3||y<1.1||y>12?[0,0,0,0]:x<0?[...green,.5]:x>0?[...red,.28]:[0,0,0,0],{res:4,key:'exact-clumping'});A.vline(0,{color:'ink',dash:true});A.text('$k=1$',.03,11.4,{align:'left',size:12});
          const pts=[...Q.path,...P.path],xm=Math.max(1,...pts.map(p=>Math.abs(p[0])))*1.12,ym=Math.max(1,...pts.map(p=>Math.abs(p[1])))*1.12;const bound=Math.max(xm,ym);B.setView([-bound,bound],[-bound,bound]);B.path(P.path,{color:'purple',dash:true,width:1.4});B.path(Q.path,{color:'orange',width:2});Q.path.forEach((q,i)=>{if(i%2===0)B.dot(...q,{r:i===0?5:2.8,color:i===0?'gold':'orange'});});B.dot(0,0,{r:6,color:k<1?'green':k>1?'red':'muted',hollow:true});
        });
        v.readout(()=>{const M=info;return `clumping $k=${v.fmt(M.k,3)}$, $\\lambda=${v.fix(M.L,2)}$: exact determinant $D=${v.fix(M.D,6)}$, trace $T=${v.fix(M.T,6)}$ → **${M.classification==='boundary'?'nonhyperbolic boundary (unit-modulus linear eigenvalues)':M.classification==='stable'?'locally asymptotically stable':'linearly unstable'}**. ${M.stopped?'Iteration stopped at the declared display threshold.':'120 generations shown; this is finite numerical evidence.'}`;});
      },
    },
  ],
};
