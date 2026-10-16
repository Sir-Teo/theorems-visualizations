// Mathematical Biology — Chapter 2: Discrete-time models and chaos (items 2.1–2.7; 2.8–2.14 in ch02-b.js, 2.15 in ch02-papers.js)
import { MAPS, mapPicker, orbitOf, cobwebPts, periodOf, roots1, logisticDoublings, superstable } from './ch02.shared.js';

export default {
  collection: 'mathbio',
  chapter: 2,
  title: 'Discrete-time models and chaos',
  summary: String.raw`Many organisms breed in seasons, so the natural model is a map from one generation to the next. Cobwebs make fixed points and their stability visible, and the innocent-looking logistic map then walks through period doubling into chaos with universal constants. The same tools, extended to two dimensions, explain why the classic host–parasitoid model is violently unstable and what real biology does to calm it.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'Geometric growth in discrete generations',
      statement: String.raw`If generations do not overlap and each individual is replaced on average by $\lambda$ individuals of the next generation, then $N_{t+1}=\lambda N_t$ and $N_t=\lambda^tN_0$. The population grows without bound if $\lambda>1$, is constant if $\lambda=1$ and dies out if $\lambda<1$. At the integer times it agrees exactly with the continuous Malthusian curve $N_0e^{rt}$ of rate $r=\ln\lambda$. If instead the same per-capita increase $\rho=\lambda-1$ is spread over $m$ equal breeding episodes per generation, the multiplier per generation is $(1+\rho/m)^m$, which increases to $e^{\rho}$ as $m\to\infty$ (the continuous model with rate $\rho$).`,
      idea: String.raw`Iterating the multiplication gives the power $\lambda^t$ at once, and $\lambda^t=e^{t\ln\lambda}$ rewrites it as an exponential. The difference between discrete and continuous models is only in the clock: finer breeding steps compound the same rate more often, and $(1+\rho/m)^m\to e^{\rho}$ is the limit $(1+1/n)^n\to e$ (pma-3.31) in disguise. The continuous equation of mathbio-1.2 is therefore the limit of its discrete counterparts.`,
      scope: String.raw`Holds while the per-capita reproduction $\lambda$ does not depend on density, with no immigration or age structure (those come in chapter 4).`,
      caption: String.raw`Drag $\lambda-1$ and watch the gold generation points stay exactly on the blue curve $e^{(\ln\lambda)t}$. Then raise $m$: the orange staircase of $m$ breeding episodes per generation climbs from the generation points up to the green dashed curve $e^{\rho t}$, which it approaches as $m\to\infty$. Switch to a logarithmic axis to see straight lines of slope $\ln\lambda$ and $\rho$.`,
      deps: ['mathbio-1.2', 'pma-3.31'],
      tags: ['geometric growth', 'discrete generations'],
      refs: ['Edelstein-Keshet ch. 1'],
      viz(v) {
        const rho = v.slider('growth per generation $\\lambda-1$', 0.05, 1.5, 0.6, { step: 0.01 });
        const m = v.slider('breeding episodes per generation $m$', 1, 24, 1, { int: true });
        const ax = v.select('vertical axis', [{ value: 'lin', label: 'linear' }, { value: 'log', label: 'logarithmic' }], 'lin');
        const T = 8;
        const S = v.stage({ x: [0, T], y: [0, 100], axes: 'box', gutter: true, height: 380, minWidth: 320, xlabel: 't (generations)', ylabel: 'N(t), with N(0)=1', title: 'population against time' });
        v.legend([['accent', '$\\lambda^t=e^{(\\ln\\lambda)t}$'], ['gold', 'generation points $N_t$'], ['orange', '$m$ breeding episodes per generation'], ['green', '$e^{\\rho t}$, the limit $m\\to\\infty$', { dash: true }]]);
        let lam = 1, per = 1;
        v.render(() => {
          const rv = rho.value, mv = m.value, log = ax.value === 'log';
          lam = 1 + rv; per = Math.pow(1 + rv / mv, mv);
          const hi = Math.max(Math.exp(rv * T), Math.pow(lam, T)) * 1.05;
          S.setScale({ ylog: log, y: log ? [0.9, hi * 1.5] : [0, hi] });
          S.fn((t) => Math.exp(rv * t), { color: 'green', width: 2.2, dash: true });
          S.fn((t) => Math.pow(lam, t), { color: 'accent', width: 3 });
          const pts = [];
          for (let k = 0; k < T * mv; k++) { const N = Math.pow(1 + rv / mv, k); pts.push([k / mv, N], [(k + 1) / mv, N]); }
          pts.push([T, Math.pow(1 + rv / mv, T * mv)]);
          S.path(pts, { color: 'orange', width: 2 });
          for (let t = 0; t <= T; t++) S.dot(t, Math.pow(lam, t), { r: 5, color: 'gold' });
        });
        v.readout(() => String.raw`$\lambda=${v.fix(lam, 3)}$, so $r=\ln\lambda=${v.fix(Math.log(lam), 4)}$ and $N_8=\lambda^8=${v.fmt(Math.pow(lam, 8), 4)}$ (also $e^{8r}$)
 per generation with $m=${m.value}$ episodes: $(1+\rho/m)^m=${v.fix(per, 4)}$, against the limit $e^{\rho}=${v.fix(Math.exp(rho.value), 4)}$ and the one-episode value $\lambda=${v.fix(lam, 4)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Model',
      name: 'Fibonacci’s rabbits and the golden ratio',
      credit: 'Fibonacci (Leonardo of Pisa), Liber abaci, 1202',
      statement: String.raw`Fibonacci's rabbit problem: a pair of rabbits becomes mature after one month and from then on produces one new pair every month, and no rabbit dies. With $A_n$ mature and $J_n$ juvenile pairs in month $n$, $A_{n+1}=A_n+J_n$ and $J_{n+1}=bA_n$ (here $b=1$), so the total $x_n=A_n+J_n$ obeys $x_{n+1}=x_n+bx_{n-1}$; for $b=1$ it is the sequence $1,1,2,3,5,8,13,\dots$ in which each total is the sum of the two before. The ratio $x_{n+1}/x_n$ converges to the positive root $\lambda=\tfrac12\bigl(1+\sqrt{1+4b}\bigr)$ of $\lambda^2=\lambda+b$, which for $b=1$ is the golden ratio $\varphi=\tfrac12(1+\sqrt5)=1.6180339887\ldots$, whatever the initial pair.`,
      idea: String.raw`Look for solutions $x_n=\lambda^n$: the recursion becomes the characteristic equation $\lambda^2=\lambda+b$ with roots $\lambda_\pm$, $|\lambda_-|<1<\lambda_+$. Every solution is $c_+\lambda_+^n+c_-\lambda_-^n$, and the second term dies away geometrically, so ratios converge to $\lambda_+$ at the rate $|\lambda_-/\lambda_+|^n$ (the dominant root is the geometric growth rate of mathbio-2.1). This is the smallest example of an age-structured model; chapter 4 generalizes it to Leslie matrices.`,
      scope: String.raw`An idealized model: no deaths, a strictly fixed maturation delay and litter size, and no density dependence. Real rabbits do none of these; the model is a classic example of a linear recursion, not a description of rabbit populations.`,
      caption: String.raw`The bars show mature (blue) and juvenile (gold) pairs month by month; raise the litter size $b$ or switch the starting pair. The right plot shows the ratio of successive totals closing in on the dominant root (green line), which is $1.6180\ldots$ for $b=1$ however you start.`,
      deps: ['mathbio-2.1'],
      tags: ['Fibonacci', 'golden ratio', 'age structure'],
      refs: ['Edelstein-Keshet ch. 1'],
      viz(v) {
        const b = v.slider('pairs born per mature pair per month $b$', 1, 3, 1, { int: true });
        const N = v.slider('months shown', 4, 18, 12, { int: true });
        const st = v.select('start with', [{ value: 'J', label: 'one newborn pair' }, { value: 'A', label: 'one mature pair' }], 'J');
        const A = v.stage({ x: [-0.6, 18.6], y: [0, 100], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 300, xlabel: 'month n', ylabel: 'pairs', title: 'mature and juvenile pairs' });
        const B = v.stage({ x: [0, 18], y: [0, 4], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 'n', ylabel: '$x_{n+1}/x_n$', title: 'ratio of successive totals' });
        v.legend([['accent', 'mature pairs', { area: true }], ['gold', 'juvenile pairs', { area: true }], ['green', 'dominant root $\\lambda$', { dash: true }]]);
        let tot = [], lam = 1;
        v.render(() => {
          const bv = b.value, n = N.value;
          lam = (1 + Math.sqrt(1 + 4 * bv)) / 2;
          let a = st.value === 'A' ? 1 : 0, j = 1 - a; tot = [];
          const rows = [];
          for (let i = 0; i <= n; i++) { rows.push([a, j]); tot.push(a + j); const na = a + j; j = bv * a; a = na; }
          const top = Math.max(...tot) * 1.08;
          A.setView([-0.6, n + 0.6], [0, top]);
          rows.forEach(([a1, j1], i) => {
            A.rect(i - 0.38, 0, i + 0.38, a1, { fill: 'accent', fillAlpha: 0.7, color: 'accent', width: 1 });
            A.rect(i - 0.38, a1, i + 0.38, a1 + j1, { fill: 'gold', fillAlpha: 0.7, color: 'gold', width: 1 });
          });
          if (n <= 12) tot.forEach((x, i) => A.text(String(x), i, x, { size: 11, color: 'ink', align: 'center', dy: -10 }));
          B.setView([0, n], [0, Math.max(4, lam + 0.8)]);
          B.hline(lam, { color: 'green', dash: true, width: 2 });
          const pts = [];
          for (let i = 0; i < n; i++) pts.push([i, tot[i + 1] / tot[i]]);
          B.path(pts, { color: 'accent', width: 2 });
          pts.forEach(([x, y]) => B.dot(x, y, { r: 4, color: 'gold' }));
        });
        v.readout(() => {
          const n = tot.length - 1, r = tot[n] / tot[n - 1];
          return String.raw`totals $x_0,\dots,x_{${n}}$ = ${tot.slice(0, 13).join(', ')}${n > 12 ? ', …' : ''}
 $x_{${n}}/x_{${n - 1}}=${v.fix(r, 6)}$ against $\lambda=\tfrac12(1+\sqrt{1+4b})=${v.fix(lam, 6)}$; error $${v.sci(Math.abs(r - lam), 2)}$`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Method',
      name: 'Cobwebbing a one-dimensional map',
      statement: String.raw`To iterate $x_{t+1}=f(x_t)$ graphically, draw the graph of $f$ and the diagonal $y=x$. From the point $(x_0,0)$ go vertically to the graph at $(x_0,f(x_0))$, horizontally to the diagonal at $(f(x_0),f(x_0))$, and repeat: the corners of this staircase on the diagonal are the iterates $x_1,x_2,\dots$. Fixed points are the intersections of graph and diagonal. Near a fixed point the cobweb spirals if $f'<0$ and staircases monotonically if $f'>0$, in or out according to whether the graph is flatter or steeper than the diagonal.`,
      idea: String.raw`The diagonal does the job of turning an output $f(x_t)$ back into the next input $x_{t+1}=f(x_t)$ without any computation, so one picture contains the whole orbit. A fixed point is where $f(x)=x$ (the graph meets the diagonal), and the sign of the slope there decides whether the path alternates sides (negative slope) or keeps to one side (positive slope); its steepness against the diagonal's slope $1$ decides in or out, which mathbio-2.4 turns into a theorem.`,
      caption: String.raw`Drag the gold point along the axis to choose $x_0$, pick a map and change its parameter, and set how many steps are drawn. Fixed points are marked green when the cobweb is attracted to them and red when it is repelled; the right panel shows the same orbit as a time series.`,
      deps: ['mathbio-2.1'],
      tags: ['cobweb', 'iteration', 'fixed point'],
      refs: ['Edelstein-Keshet ch. 2', 'Murray I ch. 2'],
      viz(v) {
        const P = mapPicker(v, ['logistic', 'ricker', 'sine', 'tent'], { logistic: 2.8, ricker: 1.8, sine: 0.8, tent: 1.5 });
        const n = v.slider('steps drawn', 1, 60, 14, { int: true });
        const A = v.stage({ x: [0, 1], y: [0, 1], equal: false, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 300, xlabel: '$x_t$', ylabel: '$x_{t+1}$', title: 'cobweb' });
        const B = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', gutter: true, height: 380, weight: 0.85, minWidth: 260, xlabel: 't', ylabel: '$x_t$', title: 'time series' });
        const h = A.handle(0.2, 0, { color: 'gold', label: '$x_0$', labelPos: 'n', constrain: (x) => [v.M.clamp(x, 0.005, hmax), 0] });
        let hmax = 1, orb = [], fps = [];
        v.render(() => {
          P.sync();
          const mp = P.m(), p = P.p(), g = P.g(), xm = mp.xmax(p), ym = mp.ymax(p);
          hmax = xm * 0.995;
          A.setView([0, xm], [0, Math.max(xm, ym)]);
          A.fn((x) => x, { color: 'muted', width: 1.5 });
          A.fn(g, { color: 'accent', width: 3, domain: [0, xm], n: 400 });
          const x0 = Math.min(h.x, hmax);
          A.path(cobwebPts(g, x0, n.value), { color: 'orange', width: 1.6 });
          orb = orbitOf(g, x0, 60);
          fps = roots1((x) => g(x) - x, 0, xm, 800).map((x) => +x.toFixed(9));
          fps = [...new Set(fps)];
          for (const x of fps) A.dot(x, x, { r: 5, color: Math.abs(mp.df(p, x)) < 1 ? 'green' : 'red' });
          if (Math.abs(g(0)) < 1e-12 && !fps.some((x) => Math.abs(x) < 1e-6)) A.dot(0, 0, { r: 5, color: Math.abs(mp.df(p, 0)) < 1 ? 'green' : 'red' });
          A.dot(x0, 0, { r: 5, color: 'gold' });
          const ymax = Math.max(1, ...orb.map((q) => (isFinite(q) ? q : 0)), xm) * 1.05;
          B.setView([0, 60], [0, ymax]);
          B.path(orb.slice(0, n.value + 1).map((y, t) => [t, y]), { color: 'orange', width: 1.5 });
          orb.slice(0, n.value + 1).forEach((y, t) => B.dot(t, y, { r: 3.5, color: 'gold' }));
          for (const x of fps) if (x > 1e-6) B.hline(x, { color: Math.abs(mp.df(p, x)) < 1 ? 'green' : 'red', dash: true, width: 1.2 });
        });
        v.readout(() => {
          const mp = P.m(), p = P.p();
          const fp = fps.filter((x) => x > 1e-6).map((x) => `$x^*=${v.fix(x, 4)}$ with $f'(x^*)=${v.fix(mp.df(p, x), 3)}$`).join('; ');
          return String.raw`$x_0=${v.fix(h.x, 3)}$, $x_{${n.value}}=${v.fix(orb[Math.min(n.value, 60)], 5)}$
 ${fp || 'no positive fixed point'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Stability of fixed points: |f′(x*)| < 1',
      statement: String.raw`Let $f$ be continuously differentiable near a fixed point $x^*=f(x^*)$ of $x_{t+1}=f(x_t)$. If $|f'(x^*)|<1$, then $x^*$ is locally asymptotically stable: there is a neighbourhood of $x^*$ from which every orbit converges to $x^*$, and the error shrinks by about the factor $|f'(x^*)|$ per step. If $|f'(x^*)|>1$, $x^*$ is unstable: orbits starting arbitrarily close leave a neighbourhood of $x^*$. If $|f'(x^*)|=1$, the derivative does not decide (for example $x\mapsto x-x^3$ and $x\mapsto x+x^3$ both have $f'(0)=1$ but the first attracts and the second repels).`,
      idea: String.raw`Write the error $e_t=x_t-x^*$. By the mean value theorem (pma-5.10), $e_{t+1}=f(x_t)-f(x^*)=f'(\xi_t)e_t$ with $\xi_t$ between $x_t$ and $x^*$. If $|f'(x^*)|<1$, continuity of $f'$ gives a neighbourhood where $|f'|\le q<1$, so $|e_t|\le q^t|e_0|$: this is the contraction principle (pma-9.23) on a small interval. If $|f'(x^*)|>1$ the same estimate with $|f'|\ge q>1$ makes errors grow while the orbit stays near $x^*$.`,
      scope: String.raw`A local statement: it says nothing about orbits starting far from $x^*$, and it is silent when $|f'(x^*)|=1$.`,
      caption: String.raw`The gold tangent line at $x^*$ has slope $f'(x^*)$. Choose a map, slide its parameter and the starting offset: the right panel plots the error $|x_t-x^*|$ on a logarithmic axis with the predicted line $|e_0||f'(x^*)|^t$ (dashed). Where $|f'|<1$ the error falls along that line, where $|f'|>1$ it grows until the orbit settles onto some other attractor (the plot floors at $10^{-16}$).`,
      deps: ['mathbio-2.3', 'pma-9.23', 'pma-5.10'],
      tags: ['stability', 'fixed point', 'contraction'],
      refs: ['Edelstein-Keshet ch. 2'],
      viz(v) {
        const P = mapPicker(v, ['logistic', 'ricker', 'sine'], { logistic: 2.6, ricker: 1.6, sine: 0.75 });
        const d0 = v.slider('starting offset $x_0-x^*$', -0.3, 0.3, 0.12, { step: 0.005 });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 300, xlabel: '$x_t$', ylabel: '$x_{t+1}$', title: 'tangent line and cobweb at $x^*$' });
        const B = v.stage({ x: [0, 40], y: [1e-16, 10], ylog: true, axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 280, xlabel: 't', ylabel: '$|x_t-x^*|$', title: 'distance to the fixed point' });
        v.legend([['orange', 'cobweb / error'], ['gold', 'tangent, slope $f\'(x^*)$'], ['purple', '$|e_0||f\'(x^*)|^t$', { dash: true }]]);
        let slope = 0, xs = 0, obs = NaN;
        v.render(() => {
          P.sync();
          const mp = P.m(), p = P.p(), g = P.g(), xm = mp.xmax(p), ym = mp.ymax(p);
          xs = mp.fixed(p); slope = mp.df(p, xs);
          A.setView([0, xm], [0, Math.max(xm, ym)]);
          A.fn((x) => x, { color: 'muted', width: 1.5 });
          A.fn(g, { color: 'accent', width: 3, domain: [0, xm], n: 400 });
          const x0 = v.M.clamp(xs + d0.value, 0.002, xm * 0.998);
          A.path(cobwebPts(g, x0, 30), { color: 'orange', width: 1.4 });
          A.line(xs - 0.35, xs - 0.35 * slope + (xs - xs), xs + 0.35, xs + 0.35 * slope, { color: 'gold', width: 2.2 });
          A.dot(xs, xs, { r: 6, color: Math.abs(slope) < 1 ? 'green' : 'red' });
          A.dot(x0, 0, { r: 5, color: 'gold' });
          const orb = orbitOf(g, x0, 40), e = orb.map((x) => Math.max(Math.abs(x - xs), 1e-16));
          B.path(e.map((y, t) => [t, y]), { color: 'orange', width: 2 });
          const e0 = e[0]; B.fn((t) => e0 * Math.pow(Math.abs(slope) + 1e-300, t), { color: 'purple', dash: true, width: 1.8, domain: [0, 40], n: 80 });
          let k = 0; while (k < 12 && e[k + 1] > 1e-13 && e[k + 1] < 0.4) k++;
          obs = k > 1 ? Math.pow(e[k] / e[0], 1 / k) : NaN;
        });
        v.readout(() => String.raw`$x^*=${v.fix(xs, 5)}$, $f'(x^*)=${v.fix(slope, 4)}$ so $|f'(x^*)|${Math.abs(slope) < 1 ? '<' : '>'}1$: **${Math.abs(slope) < 1 ? 'stable' : 'unstable'}**
 measured error factor per step over the early steps: ${Math.abs(slope) > 1 ? 'not meaningful here: the error saturates after a few steps, so shrink the offset to see the growth factor' : isFinite(obs) ? '$' + v.fix(obs, 4) + '$' : 'not defined (the orbit leaves the neighbourhood at once)'}, against $|f'(x^*)|=${v.fix(Math.abs(slope), 4)}$`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Model',
      name: 'Discrete logistic map',
      statement: String.raw`The discrete logistic map is $x_{t+1}=rx_t(1-x_t)$ on $[0,1]$ with $0<r\le4$, where $x_t$ is the population as a fraction of its maximum possible size. The origin is a fixed point, stable for $r<1$. For $r>1$ there is a second fixed point $x^*=1-1/r$ with $f'(x^*)=2-r$, stable exactly for $1<r<3$. For $r>3$ it is unstable and the long-run behaviour is a cycle or irregular motion: period 2 for $3<r<1+\sqrt6\approx3.449$, then period 4, 8, …, then chaos beyond $r\approx3.5699$. For $r\le4$ the interval $[0,1]$ is mapped into itself; for $r>4$ almost every orbit leaves it.`,
      idea: String.raw`Compared with the continuous logistic equation (mathbio-1.4), which can only approach its carrying capacity monotonically, a map has no continuity constraint along the orbit: a large population produces a small next generation through overcompensation. Linear stability (mathbio-2.4) gives the slope $2-r$ at $x^*$, which passes through $-1$ at $r=3$; beyond that the second iterate $f^2$ has new fixed points, which is the start of the period-doubling cascade of mathbio-2.6.`,
      scope: String.raw`A caricature of populations with non-overlapping generations and strong overcompensation, valid as a model only for $0<x<1$ and $r\le 4$. May (1976) popularized it; ecological data rarely show its chaotic regimes.`,
      caption: String.raw`Slide $r$ from 1 to 4 and read the long-run behaviour off the time series: a constant, then 2 values, then 4, then irregular. The right panel is the histogram of $6000$ iterates after a transient, so the number of spikes counts the period and chaos fills bands. Move $x_0$ to confirm the attractor does not depend on it.`,
      deps: ['mathbio-2.4', 'mathbio-1.4'],
      tags: ['logistic map', 'cycles', 'chaos'],
      refs: ['Murray I ch. 2', 'Edelstein-Keshet ch. 2'],
      viz(v) {
        const r = v.slider('growth parameter $r$', 0.5, 4, 3.3, { step: 0.001 });
        const x0 = v.slider('start $x_0$', 0.01, 0.99, 0.2, { step: 0.01 });
        const A = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 320, xlabel: 't', ylabel: '$x_t$', title: 'time series' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: '$x$', ylabel: 'density', title: 'where the orbit spends its time' });
        let per = 0;
        v.render(() => {
          const rv = r.value, g = (x) => rv * x * (1 - x);
          const orb = orbitOf(g, x0.value, 60);
          if (rv > 1) A.hline(1 - 1 / rv, { color: Math.abs(2 - rv) < 1 ? 'green' : 'red', dash: true, width: 1.3 });
          A.path(orb.map((y, t) => [t, y]), { color: 'orange', width: 1.5 });
          orb.forEach((y, t) => A.dot(t, y, { r: 3.5, color: 'gold' }));
          let x = x0.value; const vals = [];
          for (let i = 0; i < 6600; i++) { x = g(x); if (i >= 600) vals.push(x); }
          const H = v.M.histogram(vals, { bins: 100, range: [0, 1] });
          const dm = Math.max(...H.density) * 1.1;
          B.setView([0, 1], [0, dm]);
          B.hist(vals, { bins: 100, range: [0, 1], density: true, color: 'accent', fillAlpha: 0.5 });
          per = periodOf(g, x0.value, 64, 6000);
        });
        v.readout(() => String.raw`$r=${v.fix(r.value, 3)}$: ${r.value <= 1 ? 'the population dies out ($r\le1$)' : `fixed point $x^*=1-1/r=${v.fix(1 - 1 / r.value, 4)}$, slope $f'(x^*)=2-r=${v.fix(2 - r.value, 3)}$ (dashed line: ${Math.abs(2 - r.value) < 1 ? 'stable' : 'unstable'})`}
 long-run behaviour: ${per ? `a cycle of period $${per}$` : 'no cycle of period $\\le64$ found, i.e. chaotic or very long-period motion'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Phenomenon',
      name: 'Period-doubling route to chaos',
      statement: String.raw`As $r$ increases the logistic map $x\mapsto rx(1-x)$ passes through a sequence of bifurcations at $r_1=3<r_2=1+\sqrt6\approx3.4495<r_3\approx3.5441<r_4\approx3.5644<\cdots$: at $r_n$ the stable cycle of period $2^{n-1}$ loses stability (its multiplier passes through $-1$) and a stable cycle of period $2^n$ is born. The $r_n$ increase to a limit $r_\infty\approx3.5699$, beyond which there are infinitely many cycles and chaotic bands. The gaps $r_{n}-r_{n-1}$ shrink geometrically.`,
      idea: String.raw`A cycle of period $p$ is a fixed point of the iterate $f^p$ and is stable when $|(f^p)'|<1$ (mathbio-2.4). When the slope of $f^p$ at the fixed point reaches $-1$, the graph of $f^p$ bends over so that it crosses the diagonal two more times: a pitchfork of $f^p$, i.e. a stable cycle of twice the period, while the old one turns unstable. The picture of $f^{2}$ near $r_1$ and of $f^4$ near $r_2$ is the same one repeated at smaller scale (mathbio-2.7).`,
      scope: String.raw`Computed here for the logistic map; $r_1$ and $r_2$ are exact, the later $r_n$ are found numerically by solving $F^p(x)=x$, $(F^p)'(x)=-1$ for $(x,r)$ with Newton's method.`,
      caption: String.raw`Left: the bifurcation diagram, with the long-run values of $x$ for each $r$; click it (or use the slider) to set $r$, and switch to the zoomed view of the cascade. Right: the graph of the iterate $f^{p}$ against the diagonal; green dots are stable fixed points of $f^p$ (cycles with $|(f^p)'|<1$), red are unstable. Walk $r$ across $3$ with $p=2$ and watch a pitchfork open.`,
      deps: ['mathbio-2.5', 'ode-11.4'],
      tags: ['period doubling', 'bifurcation', 'chaos'],
      refs: ['Murray I ch. 2'],
      viz(v) {
        const r = v.slider('growth parameter $r$', 2.8, 4, 3.3, { step: 0.0005 });
        const zoom = v.select('bifurcation diagram', [{ value: 'all', label: 'full: $2.8\\le r\\le4$' }, { value: 'cas', label: 'cascade: $3.4\\le r\\le3.58$' }], 'all');
        const pw = v.select('iterate $f^p$', [{ value: 1, label: '$p=1$' }, { value: 2, label: '$p=2$' }, { value: 4, label: '$p=4$' }, { value: 8, label: '$p=8$' }], 2);
        const A = v.stage({ x: [2.8, 4], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.6, minWidth: 320, xlabel: 'r', ylabel: '$x$', title: 'bifurcation diagram' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 280, xlabel: '$x$', ylabel: '$f^p(x)$', title: 'the iterate against the diagonal' });
        const R = logisticDoublings(8);
        const NC = 700, NR = 360, cache = {};
        const build = (z) => {
          if (cache[z]) return cache[z];
          const [r0, r1, y0, y1] = z === 'all' ? [2.8, 4, 0, 1] : [3.4, 3.58, 0.3, 0.9];
          const cnt = new Float32Array(NC * NR);
          for (let c = 0; c < NC; c++) {
            const rr = r0 + ((r1 - r0) * (c + 0.5)) / NC; let x = 0.3;
            for (let i = 0; i < 500; i++) x = rr * x * (1 - x);
            for (let i = 0; i < 400; i++) { x = rr * x * (1 - x); const row = Math.floor(((x - y0) / (y1 - y0)) * NR); if (row >= 0 && row < NR) cnt[row * NC + c]++; }
          }
          return (cache[z] = { r0, r1, y0, y1, cnt });
        };
        let shown = [], per = 0;
        A.onClick((x) => { r.set(v.M.clamp(x, 2.8, 4)); });
        v.render(() => {
          const z = build(zoom.value), rv = r.value;
          A.setView([z.r0, z.r1], [z.y0, z.y1]);
          const col = v.rgb('accent');
          A.raster((x, y) => { const c = Math.floor(((x - z.r0) / (z.r1 - z.r0)) * NC), q = Math.floor(((y - z.y0) / (z.y1 - z.y0)) * NR); if (c < 0 || c >= NC || q < 0 || q >= NR) return null; const k = z.cnt[q * NC + c]; return k ? [col[0], col[1], col[2], Math.min(1, 0.55 + k / 10)] : null; }, { res: 2, key: 'bif-' + zoom.value });
          for (const rn of R) if (rn >= z.r0 && rn <= z.r1) A.vline(rn, { color: 'faint', width: 1, dash: true });
          A.vline(rv, { color: 'gold', width: 2 });
          const p = +pw.value, g = (x) => rv * x * (1 - x);
          const F = (x) => { for (let i = 0; i < p; i++) x = g(x); return x; };
          B.fn((x) => x, { color: 'muted', width: 1.5 });
          B.fn(F, { color: 'accent', width: 2.5, n: 900 });
          const fps = roots1((x) => F(x) - x, 0, 1, 3000);
          shown = [];
          for (const x of fps) {
            let m = 1, y = x; for (let i = 0; i < p; i++) { m *= rv * (1 - 2 * y); y = g(y); }
            B.dot(x, x, { r: 5, color: Math.abs(m) < 1 ? 'green' : 'red' }); shown.push(Math.abs(m) < 1);
          }
          per = periodOf(g, 0.3, 128, 8000);
        });
        v.readout(() => String.raw`$r=${v.fix(r.value, 4)}$: attractor of period ${per ? '$' + per + '$' : 'none up to 128 (chaotic)'}; $f^{${pw.value}}$ has ${shown.length} fixed points, ${shown.filter(Boolean).length} stable
 bifurcation values $r_1,\dots,r_8$ = ${R.map((x) => v.fix(x, 5)).join(', ')}
 ratios $(r_{n-1}-r_{n-2})/(r_n-r_{n-1})$ for $n=3\ldots8$: ${R.slice(2).map((x, i) => v.fix((R[i + 1] - R[i]) / (x - R[i + 1]), 3)).join(', ')}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Phenomenon',
      name: 'Feigenbaum universality',
      credit: 'Feigenbaum, 1978',
      statement: String.raw`For a smooth one-parameter family of maps of an interval with a single quadratic maximum, the parameters $R_n$ at which cycles of period $2^n$ appear (or are superstable) converge geometrically to a limit $R_\infty$, and the ratio of successive gaps tends to the same number for every such family:
$$\delta=\lim_{n\to\infty}\frac{R_{n}-R_{n-1}}{R_{n+1}-R_{n}}=4.669201609\ldots$$
Feigenbaum also found a universal scaling $\alpha\approx2.5029$ of the cycle's points in space. The logistic map $rx(1-x)$, the Ricker map $xe^{r(1-x)}$ and the sine map $a\sin\pi x$ have different $R_\infty$ but the same $\delta$.`,
      idea: String.raw`Iterating a map $2^n$ times and rescaling space turns a unimodal map near its period-doubling point into another unimodal map; Feigenbaum's renormalization argument says this operation has a fixed point whose single unstable direction has eigenvalue $\delta$. That is why only the shape of the maximum (quadratic) matters, not the formula. Here we do not prove it: we compute the superstable parameters (where the critical point lies on a $2^n$-cycle) for the three maps and watch the same ratios appear (mathbio-2.6).`,
      scope: String.raw`For one-humped maps with a quadratic maximum (the generic case). A maximum of different order gives a different constant. The value $\delta=4.6692016\ldots$ is quoted from the literature; the ratios in the picture are computed from the maps, using superstable parameters (their ratios converge to the same $\delta$).`,
      caption: String.raw`Left: the ratio $(R_n-R_{n-1})/(R_{n+1}-R_n)$ for the three maps against $n$; all tend to the dashed line $4.669$. Right: the gaps $R_n-R_{n-1}$ on a log axis fall along parallel straight lines, geometric with the same factor. Use the slider to choose how many doublings are shown.`,
      deps: ['mathbio-2.6', 'ode-11.8'],
      tags: ['Feigenbaum', 'universality', 'renormalization'],
      refs: ['Murray I ch. 2'],
      viz(v) {
        const nmax = v.slider('doublings used', 3, 9, 8, { int: true });
        const cfg = [['logistic', 'logistic $rx(1-x)$', 2, 4, 'accent'], ['ricker', 'Ricker $xe^{r(1-x)}$', 1, Infinity, 'orange'], ['sine', 'sine $a\\sin\\pi x$', 0.5, 1, 'purple']];
        const data = cfg.map(([k, label, R0, cap, col]) => ({ label, col, R: superstable(MAPS[k], R0, 9, cap) }));
        const A = v.stage({ x: [0.5, 9.5], y: [3, 5], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'n', ylabel: '$(R_n-R_{n-1})/(R_{n+1}-R_n)$', title: 'ratio of successive gaps' });
        const B = v.stage({ x: [0.5, 9.5], y: [1e-8, 3], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'n', ylabel: '$R_n-R_{n-1}$', title: 'the gaps shrink geometrically' });
        v.legend(data.map((d) => [d.col, d.label]).concat([[ 'green', '$\\delta=4.6692\\ldots$', { dash: true }]]));
        v.render(() => {
          A.hline(4.669201609, { color: 'green', dash: true, width: 2 });
          for (const d of data) {
            const R = d.R, top = Math.min(nmax.value, R.length - 2), pts = [];
            for (let n = 1; n <= top; n++) pts.push([n, (R[n] - R[n - 1]) / (R[n + 1] - R[n])]);
            A.path(pts, { color: d.col, width: 2 }); pts.forEach(([x, y]) => A.dot(x, y, { r: 4, color: d.col }));
            const gaps = []; for (let n = 1; n <= Math.min(nmax.value + 1, R.length - 1); n++) gaps.push([n, R[n] - R[n - 1]]);
            B.path(gaps, { color: d.col, width: 2 }); gaps.forEach(([x, y]) => B.dot(x, y, { r: 4, color: d.col }));
          }
        });
        v.readout(() => {
          const rows = data.map((d) => { const R = d.R, n = Math.min(nmax.value, R.length - 2); return `${d.label}: $R_\\infty\\approx${v.fix(R[R.length - 1], 5)}$, ratio at $n=${n}$ is $${v.fix((R[n] - R[n - 1]) / (R[n + 1] - R[n]), 4)}$`; });
          return rows.join('\n ') + String.raw`
 limit value quoted from the literature: $\delta=4.669201609\ldots$`;
        });
      },
    },
  ],
};
