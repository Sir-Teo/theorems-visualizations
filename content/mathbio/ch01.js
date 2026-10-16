// Mathematical Biology — Chapter 1: Growth of a single population
import { traj1, roots1, d1 } from './ch01.shared.js';

export default {
  collection: 'mathbio',
  chapter: 1,
  title: 'Growth of a single population',
  summary: String.raw`A population changes by births, deaths and migration, and writing that balance as a differential equation is the first act of mathematical biology. Exponential growth is the null model; density dependence bends it into the logistic curve, and linearizing about equilibria tells us which ones the population actually settles on. Allee effects, outbreaks with hysteresis, harvesting and time delays show how much behaviour one equation can hold — including collapse of a fishery and oscillations created purely by a lag.`,
  items: [
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Per-capita growth rate and the population balance law',
      statement: String.raw`Let $N(t)$ be the size (or density) of a population. In a small interval $\Delta t$ the change in $N$ is births minus deaths plus immigration minus emigration, so in the limit
$$\frac{dN}{dt} = B - D + I - E .$$
The **per-capita growth rate** is $g = \dfrac1N\dfrac{dN}{dt}$. If births and deaths are proportional to $N$ ($B = bN$, $D = dN$) and migration is a fixed inflow and outflow, then $\dfrac{dN}{dt} = (b-d)N + (I-E)$ and $g = (b-d) + (I-E)/N$.`,
      idea: String.raw`This is bookkeeping, not a law of nature: whatever enters the population and whatever leaves it must add up to the net change. All modelling content lies in how each flow depends on $N$. Dividing by $N$ asks the question the rest of the chapter keeps returning to: how does each individual's contribution to growth depend on how many others there are?`,
      caption: String.raw`Slide the four rates; the arrow widths are proportional to the flows. The middle panel integrates $N(t)$; the right panel shows the per-capita rate against $N$, which is the constant $b-d$ only when there is no net migration.`,
      deps: [],
      tags: ['balance law', 'per-capita rate'],
      refs: ['Murray I ch. 1', 'Edelstein-Keshet ch. 4'],
      viz(v) {
        const b = v.slider('birth rate $b$', 0, 1, 0.45, { step: 0.01 });
        const d = v.slider('death rate $d$', 0, 1, 0.3, { step: 0.01 });
        const I = v.slider('immigration $I$', 0, 40, 8, { step: 0.5 });
        const E = v.slider('emigration $E$', 0, 40, 2, { step: 0.5 });
        const N0 = v.slider('population now $N$', 10, 300, 80, { step: 1 });
        const A = v.stage({ x: [0, 10], y: [0, 7], axes: false, height: 300, weight: 1.15, minWidth: 300, title: 'the four flows into and out of the population' });
        const B = v.stage({ x: [0, 12], y: [0, 300], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xlabel: 't', ylabel: 'N(t)', title: 'trajectory' });
        const C = v.stage({ x: [0, 300], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 240, weight: 1, minWidth: 260, xlabel: 'N', ylabel: 'g', title: 'per-capita rate $g(N)$' });
        let net = 0, g = 0;
        v.render(() => {
          const bv = b.value, dv = d.value, Iv = I.value, Ev = E.value, N = N0.value;
          const F = (t, n) => (bv - dv) * n + Iv - Ev;
          net = F(0, N); g = net / N;
          const big = Math.max(bv * N, dv * N, Iv, Ev, 1);
          const w = (x) => 2 + (13 * x) / big;
          A.rect(4.0, 2.0, 6.0, 4.2, { fill: 'accent', fillAlpha: 0.12, color: 'accent', width: 2, radius: 10 });
          A.text(`N = ${Math.round(N)}`, 5, 3.5, { size: 20, color: 'ink', align: 'center', math: true });
          A.text(`dN/dt = ${net >= 0 ? '+' : '−'}${v.fix(Math.abs(net), 1)}`, 5, 2.75, { size: 14, color: net >= 0 ? 'green' : 'red', align: 'center', math: true });
          A.arrow(5, 6.0, 5, 4.25, { color: 'green', width: w(bv * N), head: 12 + w(bv * N) });
          A.arrow(0.3, 3.1, 3.95, 3.1, { color: 'teal', width: w(Iv), head: 12 + w(Iv) });
          A.arrow(5, 1.95, 5, 0.95, { color: 'red', width: w(dv * N), head: 12 + w(dv * N) });
          A.arrow(6.05, 3.1, 9.7, 3.1, { color: 'orange', width: w(Ev), head: 12 + w(Ev) });
          A.tex(`\\text{births } bN = ${v.fix(bv * N, 1)}`, 5, 6.15, { color: 'green', size: 14, align: 'center', baseline: 'bottom' });
          A.tex(`\\text{immigration } I = ${v.fix(Iv, 1)}`, 0.3, 2.5, { color: 'teal', size: 14, align: 'left' });
          A.tex(`\\text{deaths } dN = ${v.fix(dv * N, 1)}`, 5, 0.1, { color: 'red', size: 14, align: 'center', baseline: 'bottom' });
          A.tex(`\\text{emigration } E = ${v.fix(Ev, 1)}`, 9.7, 2.5, { color: 'orange', size: 14, align: 'right' });

          const T = 12, tr = traj1(F, N, T, 240, 0);
          const ymax = Math.max(20, ...tr.map((p) => p[1])) * 1.08;
          B.setView([0, T], [0, ymax]);
          const star = dv > bv ? (Iv - Ev) / (dv - bv) : null;
          if (star != null && star > 0 && star < ymax) { B.hline(star, { color: 'green', dash: true, width: 1.4 }); B.text('N*', T, star, { color: 'green', align: 'right', dx: -6, dy: -10, math: true }); }
          B.path(tr, { color: 'accent', width: 2.8 });
          B.line(0, N, 2.2, N + 2.2 * net, { color: 'gold', width: 2 });
          B.dot(0, N, { r: 5, color: 'gold' });

          const gf = (n) => bv - dv + (Iv - Ev) / n;
          const ys = [bv - dv, gf(8), gf(300)];
          const lim = Math.max(0.2, Math.min(1.5, Math.max(...ys.map(Math.abs)))) * 1.15;
          C.setView([0, 300], [-lim, lim]);
          C.hline(bv - dv, { color: 'muted', dash: true });
          C.tex('b-d', 300, bv - dv, { color: 'muted', align: 'right', baseline: 'bottom', dy: -4 });
          C.fn(gf, { domain: [6, 300], color: 'accent', width: 2.8 });
          C.dot(N, g, { r: 6, color: 'gold' });
        });
        v.readout(() => String.raw`$\dfrac{dN}{dt} = (b-d)N + I - E = ${v.fix(net, 2)}$ at $N=${Math.round(N0.value)}$
 per-capita rate $g = \dfrac1N\dfrac{dN}{dt} = ${v.fix(g, 3)}$, versus $b-d = ${v.fix(b.value - d.value, 3)}$ (equal only when $I=E$)`);
      },
    },
    {
      num: '1.2',
      kind: 'Model',
      name: 'Exponential (Malthusian) growth',
      credit: 'Malthus, 1798',
      statement: String.raw`If births and deaths are proportional to the population and there is no migration, $\dfrac{dN}{dt} = rN$ with constant $r = b-d$. For $N(0)=N_0$ the solution is $N(t)=N_0e^{rt}$: it grows without bound if $r>0$, decays to $0$ if $r<0$, and $\ln N$ is a straight line in $t$ with slope $r$.`,
      idea: String.raw`The equation says the relative rate of change $N'/N = (\ln N)'$ is constant, so $\ln N$ is linear in $t$ — integrate once. It is the right null model when resources are unlimited (a young culture in rich broth, an invasion at low density) and it fails exactly when individuals start to interfere with each other.`,
      scope: String.raw`Holds while per-capita birth and death rates do not depend on density: early phases of growth, with unlimited resources and no Allee effects.`,
      caption: String.raw`Set $r$ and $N_0$ and switch the vertical axis between linear and logarithmic. Drag the two gold points along the curve: the slope of the line between them is $\ln(N_2/N_1)/(t_2-t_1)$, which on the log axis is the actual slope of the curve and always equals $r$.`,
      deps: ['mathbio-1.1', 'pma-8.6'],
      tags: ['exponential growth', 'Malthus'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const r = v.slider('$r$ (per hour)', -0.4, 1.2, 0.5, { step: 0.01 });
        const N0 = v.slider('$N_0$', 1, 100, 10, { log: true });
        const ax = v.select('vertical axis', [{ value: 'lin', label: 'linear' }, { value: 'log', label: 'logarithmic' }], 'lin');
        const T = 12;
        const S = v.stage({ x: [0, T], y: [0, 100], axes: 'box', gutter: true, height: 340, weight: 1.5, minWidth: 320, xlabel: 't (hours)', ylabel: 'N(t)', title: 'population against time' });
        const D = v.stage({ x: [-1.2, 1.2], y: [-1.35, 1.2], equal: true, axes: false, height: 340, weight: 0.8, minWidth: 240, title: 'the culture dish' });
        const Nf = (t) => N0.value * Math.exp(r.value * t);
        const h1 = S.handle(3, 10, { color: 'gold', label: '1', labelPos: 'n', constrain: (x) => { const t = v.M.clamp(x, 0, T - 0.5); return [t, Nf(t)]; } });
        const h2 = S.handle(8, 10, { color: 'gold', label: '2', labelPos: 'n', constrain: (x) => { const t = v.M.clamp(x, 0.3, T); return [t, Nf(t)]; } });
        const rg = v.rng(11), cells = [];
        for (let i = 0; i < 500; i++) { const a = 2 * Math.PI * rg(), rr = 1.02 * Math.sqrt(rg()); cells.push([rr * Math.cos(a), rr * Math.sin(a)]); }
        let slope = 0, N2 = 0;
        v.render(() => {
          const rv = r.value, n0 = N0.value, log = ax.value === 'log';
          const NT = Nf(T), hi = Math.max(n0, NT) * 1.08, lo = Math.min(n0, NT) / 1.5;
          S.setScale({ ylog: log, y: log ? [Math.max(lo, 1e-3), hi * 1.5] : [0, hi] });
          h1.set(h1.x, Nf(h1.x)); h2.set(h2.x, Nf(h2.x));
          S.fn(Nf, { color: 'accent', width: 3 });
          const t1 = h1.x, t2 = h2.x;
          S.line(t1, Nf(t1), t2, Nf(t2), { color: 'gold', width: 2, dash: [6, 4] });
          S.hline(n0, { color: 'faint', dash: true });
          slope = (Math.log(Nf(t2)) - Math.log(Nf(t1))) / (t2 - t1);
          N2 = Nf(t2);
          D.circle(0, 0, 1.1, { color: 'muted', width: 2.5, fill: 'muted', fillAlpha: 0.06 });
          const n = Math.min(500, Math.max(0, Math.round(N2)));
          for (let i = 0; i < n; i++) D.dot(cells[i][0], cells[i][1], { r: 3, color: 'green' });
          D.text(N2 > 500 ? `N ≈ ${v.fmt(N2, 3)} (each dot ≈ ${v.fmt(N2 / 500, 2)} cells)` : `N = ${Math.round(N2)} cells`, 0, -1.28, { align: 'center', color: 'ink', size: 13 });
        });
        v.readout(() => String.raw`measured slope of $\ln N$ between the gold points: $${v.fix(slope, 4)}$ = $r$ = $${v.fix(r.value, 4)}$
 doubling time $\ln 2/r = ${r.value > 0 ? v.fix(Math.log(2) / r.value, 2) + '\\text{ h}' : '\\infty'}$; the dish shows the population at point 2, $N_2 = ${v.fmt(N2, 4)}$`);
      },
    },
    {
      num: '1.3',
      kind: 'Concept',
      name: 'Doubling time and the rule of 70',
      statement: String.raw`Under exponential growth $N=N_0e^{rt}$ the doubling time is $T_2=\ln 2/r$, independent of $N_0$. Since $\ln 2 = 0.693\ldots$, a continuous growth rate of $p\%$ per period doubles the population in $T_2 \approx 70/p$ periods, with relative error $\approx 1\%$ (the rule of $72$ errs by $+3.9\%$ but is easier to divide). If instead the percentage is a compound rate per period, $T_2=\ln 2/\ln(1+p/100)$, and the rule loses accuracy as $p$ grows.`,
      idea: String.raw`Solve $e^{rT}=2$. For a continuous rate $r=p/100$ this gives $T_2 = 69.3/p$, so $70/p$ is a convenient overestimate. For a compound rate, $\ln(1+x) = x - x^2/2+\cdots$ makes the true $r$ slightly smaller than $x$, so the exact doubling time is longer than $69.3/p$ and the rule underestimates it, increasingly so for large $p$.`,
      scope: String.raw`Valid for exponential growth only; the shortcut is within a few percent for rates up to about $10\%$ per period.`,
      caption: String.raw`Choose whether $p$ is a continuous or a compound rate and drag $p$. The lower plot shows the percentage error of the rules of 70 and 72 against the exact doubling time; the green band is $\pm5\%$.`,
      deps: ['mathbio-1.2'],
      tags: ['doubling time', 'exponential growth'],
      refs: ['Edelstein-Keshet ch. 4'],
      viz(v) {
        const p = v.slider('rate $p$ (% per period)', 0.5, 30, 4, { step: 0.1 });
        const mode = v.select('rate means', [{ value: 'cont', label: 'continuous: $r=p/100$' }, { value: 'comp', label: 'compound: $(1+p/100)$ per period' }], 'comp');
        const A = v.stage({ x: [0, 30], y: [0, 80], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 280, xlabel: 'p (% per period)', ylabel: 'doubling time', title: 'doubling time against rate' });
        const B = v.stage({ x: [0, 30], y: [-16, 6], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 280, xlabel: 'p (% per period)', ylabel: 'error (%)', title: 'error of the rule' });
        const exact = (x) => (mode.value === 'cont' ? Math.LN2 / (x / 100) : Math.LN2 / Math.log(1 + x / 100));
        const err = (k) => (x) => (100 * (k / x - exact(x))) / exact(x);
        const hp = A.handle(4, 0, { color: 'gold', constrain: (x) => { const q = v.M.clamp(x, 0.5, 30); return [q, exact(q)]; } });
        let pv = 4;
        v.legend([['accent', 'exact $\\ln 2/r$'], ['orange', '$70/p$', { dash: true }], ['purple', '$72/p$', { dash: true }], ['green', '$\\pm5\\%$', { area: true }]]);
        v.render(() => {
          hp.set(v.M.clamp(p.value, 0.5, 30), exact(p.value)); pv = p.value;
          A.fn(exact, { domain: [0.5, 30], color: 'accent', width: 3 });
          A.fn((x) => 70 / x, { domain: [0.5, 30], color: 'orange', width: 2, dash: [6, 4] });
          A.fn((x) => 72 / x, { domain: [0.5, 30], color: 'purple', width: 2, dash: [3, 4] });
          A.vline(pv, { color: 'faint', dash: true });
          A.dot(pv, exact(pv), { r: 6, color: 'accent' });
          B.hband(-5, 5, { color: 'green', alpha: 0.12 });
          B.hline(0, { color: 'muted' });
          B.fn(err(70), { domain: [0.5, 30], color: 'orange', width: 2.4 });
          B.fn(err(72), { domain: [0.5, 30], color: 'purple', width: 2.4 });
          B.vline(pv, { color: 'faint', dash: true });
          B.dot(pv, err(70)(pv), { r: 5, color: 'orange' });
          B.dot(pv, err(72)(pv), { r: 5, color: 'purple' });
        });
        v.readout(() => String.raw`$p=${v.fix(pv, 1)}\%$: exact $T_2 = ${v.fix(exact(pv), 3)}$ periods; rule of 70 gives $${v.fix(70 / pv, 3)}$ (error $${v.fix(err(70)(pv), 2)}\%$); rule of 72 gives $${v.fix(72 / pv, 3)}$ (error $${v.fix(err(72)(pv), 2)}\%$)
 the rule of 70 ${Math.abs(err(70)(pv)) < 5 ? 'is within' : 'is outside'} the $\pm5\%$ band at this rate`);
      },
    },
    {
      num: '1.4',
      kind: 'Model',
      name: 'Logistic growth (Verhulst)',
      credit: 'Verhulst, 1838',
      statement: String.raw`Suppose each individual's growth rate falls linearly with crowding, $\dfrac1N\dfrac{dN}{dt} = r\bigl(1-N/K\bigr)$, i.e.
$$\frac{dN}{dt}=rN\Bigl(1-\frac NK\Bigr),\qquad r>0,\ K>0 .$$
Here $r$ is the intrinsic growth rate at low density and $K$ the carrying capacity. The equilibria are $N=0$ (unstable) and $N=K$ (stable): every solution with $N(0)>0$ tends to $K$.`,
      idea: String.raw`For $0<N<K$ the right-hand side is positive, so $N$ increases and cannot pass $K$; for $N>K$ it is negative, so $N$ decreases. A bounded monotone function converges (the monotone convergence theorem), and the limit must be an equilibrium, so it is $K$. Near $0$ the term $N/K$ is negligible and growth is exponential.`,
      scope: String.raw`A phenomenological model: it assumes a linear fall of the per-capita rate with density, no delays, no Allee effect and a fixed environment.`,
      caption: String.raw`Left: the per-capita rate falls linearly with $N$; each dot is one culture moving along the line as time runs. Right: their trajectories. Drag the gold handle (initial size of one culture) and change $r$ and $K$: every culture converges to $K$, from above as well as below.`,
      deps: ['mathbio-1.2', 'ode-1.6'],
      tags: ['logistic growth', 'carrying capacity'],
      refs: ['Murray I ch. 1', 'Edelstein-Keshet ch. 6'],
      viz(v) {
        const r = v.slider('$r$', 0.2, 2, 0.8, { step: 0.01 });
        const K = v.slider('$K$', 50, 200, 100, { step: 1 });
        const TM = 14;
        const L = v.stage({ x: [0, 150], y: [-0.5, 1], axes: 'box', gutter: true, height: 320, weight: 0.9, minWidth: 260, xlabel: 'N', ylabel: 'per-capita rate', title: 'per-capita growth rate $r(1-N/K)$' });
        const R = v.stage({ x: [0, TM], y: [0, 160], axes: 'box', gutter: true, height: 320, weight: 1.2, minWidth: 300, xlabel: 't', ylabel: 'N(t)', title: 'cultures started at different sizes' });
        const H = R.handle(0, 8, { color: 'gold', label: '$N_0$', labelPos: 'ne', constrain: (x, y) => [0, v.M.clamp(y, 0.5, 1.5 * K.value)] });
        const FR = [0.02, 0.1, 0.3, 0.7, 1.25, 1.5];
        const Nt = (n0, t) => K.value / (1 + (K.value / n0 - 1) * Math.exp(-r.value * t));
        let now = 0, tt = 0;
        v.legend([['gold', 'your culture', { dot: true }], ['accent', 'other cultures'], ['green', '$K$', { dash: true }]]);
        v.animate((t) => {
          const Kv = K.value, rv = r.value;
          tt = t;
          L.setView([0, 1.55 * Kv], [-0.5 * rv, 1.1 * rv]);
          R.setView([0, TM], [0, 1.55 * Kv]);
          L.fn((n) => rv * (1 - n / Kv), { domain: [0, 1.55 * Kv], color: 'accent', width: 2.5 });
          L.vline(Kv, { color: 'green', dash: [6, 4] });
          R.hline(Kv, { color: 'green', dash: [6, 4], width: 1.4 });
          for (const f of FR) {
            const n0 = f * Kv;
            R.fn((s) => Nt(n0, s), { domain: [0, TM], color: 'accent', width: 1.6, alpha: 0.7 });
            const n = Nt(n0, t); L.dot(n, rv * (1 - n / Kv), { r: 5, color: 'accent' });
          }
          R.fn((s) => Nt(H.y, s), { domain: [0, TM], color: 'gold', width: 3 });
          now = Nt(H.y, t); L.dot(now, rv * (1 - now / Kv), { r: 7, color: 'gold' });
          R.vline(t, { color: 'faint', dash: true });
          R.dot(t, now, { r: 6, color: 'gold' });
        }, { period: TM, still: 5 });
        v.readout(() => String.raw`at $t=${v.fix(tt, 1)}$: your culture has $N=${v.fix(now, 1)}$, per-capita rate $${v.fix(r.value * (1 - now / K.value), 3)}$
 limit $N(\infty)=K=${Math.round(K.value)}$ for every start $N_0>0$; the gap $K-N$ shrinks like $e^{-rt}$ once $N$ is near $K$`);
      },
    },
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Linear stability of equilibria in one dimension',
      statement: String.raw`Let $\dot N=f(N)$ with $f$ continuously differentiable and $f(N^*)=0$. If $f'(N^*)<0$ then $N^*$ is asymptotically stable: solutions starting close enough to $N^*$ converge to it, and the distance decays like $e^{f'(N^*)t}$. If $f'(N^*)>0$ then $N^*$ is unstable. If $f'(N^*)=0$ the linearization is inconclusive.`,
      idea: String.raw`Put $N=N^*+\eta$. Taylor's theorem (pma-5.15) gives $\dot\eta = f'(N^*)\eta + o(\eta)$. For $\eta$ small the remainder is dominated by the linear term, so $\eta$ shrinks if $f'(N^*)<0$ and grows if $f'(N^*)>0$; the linear equation $\dot\eta=\lambda\eta$ has the solution $\eta_0e^{\lambda t}$ with $\lambda = f'(N^*)$.`,
      caption: String.raw`Drag the gold nodes to draw any smooth $f(N)$. Arrows on the axis show the flow; zeros of $f$ are green dots (stable) or hollow red dots (unstable). Choose an equilibrium and a small kick $\delta$: the actual trajectory (gold) hugs the linearized prediction $N^*+\delta e^{\lambda t}$ (dashed) while it is near $N^*$.`,
      deps: ['mathbio-1.1', 'pma-5.15'],
      tags: ['stability', 'linearization'],
      refs: ['Murray I ch. 1', 'Edelstein-Keshet ch. 5'],
      viz(v) {
        const XS = Array.from({ length: 9 }, (_, i) => i * 1.25);
        const g0 = (n) => -((n - 2) * (n - 5) * (n - 8)) / 20;
        const L = v.stage({ x: [0, 10], y: [-6, 6], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 'N', ylabel: 'f(N)', title: 'draw the growth function $f(N)$' });
        const R = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 280, xlabel: 't', ylabel: 'N(t)', title: 'solutions' });
        const hs = XS.map((x) => L.handle(x, g0(x), { color: 'accent', r: 6, constrain: 'y' }));
        const which = v.slider('equilibrium number', 1, 5, 1, { int: true });
        const delta = v.slider('kick $\\delta$', -1, 1, 0.3, { step: 0.01 });
        const cr = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
        const f = (n) => {
          const x = v.M.clamp(n, 0, 10), h = 1.25, i = Math.min(7, Math.floor(x / h)), t = x / h - i;
          const y = hs.map((q) => q.y);
          return cr(y[Math.max(0, i - 1)], y[i], y[i + 1], y[Math.min(8, i + 2)], t);
        };
        let eq = [], info = '';
        const F = (t, n) => ((n <= 0 && f(0) < 0) || (n >= 10 && f(10) > 0) ? 0 : f(n));
        v.legend([['accent', '$f(N)$'], ['green', 'stable', { dot: true }], ['red', 'unstable', { dot: true }], ['gold', 'kicked solution'], ['orange', 'linearization', { dash: true }]]);
        v.render(() => {
          L.hline(0, { color: 'muted' });
          L.fn(f, { domain: [0, 10], color: 'accent', width: 3 });
          eq = roots1(f, 0, 10, 800).map((x) => ({ x, lam: d1(f, x, 1e-4) }));
          which.el.hidden = eq.length === 0;
          for (let x = 0.25; x < 10; x += 0.5) { const s = Math.sign(f(x)); if (s) L.arrow(x - 0.14 * s, 0, x + 0.14 * s, 0, { color: s > 0 ? 'green' : 'red', width: 2.5, head: 7 }); }
          for (const q of [0.4, 1.2, 2.4, 3.4, 4.4, 5.6, 6.6, 7.6, 8.8, 9.6]) R.path(traj1(F, q, 10, 200), { color: 'muted', width: 1.2, alpha: 0.6 });
          eq.forEach((e) => { R.hline(e.x, { color: e.lam < 0 ? 'green' : 'red', dash: [5, 5], alpha: 0.6 }); });
          eq.forEach((e) => L.dot(e.x, 0, { r: 6, color: e.lam < 0 ? 'green' : 'red', hollow: e.lam > 0 }));
          info = '';
          if (eq.length) {
            const k = Math.min(eq.length, which.value) - 1, e = eq[k];
            L.line(e.x - 1, e.lam * -1, e.x + 1, e.lam * 1, { color: 'orange', width: 2, dash: [5, 4] });
            const n0 = e.x + delta.value, tr = traj1(F, n0, 10, 400);
            R.path(tr, { color: 'gold', width: 4.5, alpha: 0.9 });
            R.fn((t) => e.x + delta.value * Math.exp(e.lam * t), { domain: [0, 10], color: 'orange', width: 2, dash: [6, 4] });
            R.dot(0, n0, { r: 5, color: 'gold' });
            const t1 = Math.min(3, 0.3 / Math.max(Math.abs(e.lam), 1e-3));
            const tr2 = traj1(F, n0, t1, 200), end = tr2[tr2.length - 1];
            const meas = Math.log(Math.abs(end[1] - e.x) / Math.abs(delta.value)) / end[0];
            info = String.raw`
 equilibrium ${k + 1} at $N^*=${v.fix(e.x, 3)}$ with $f'(N^*)=${v.fix(e.lam, 3)}$: ${e.lam < 0 ? 'stable' : 'unstable'}; measured early rate of $\ln|N-N^*|$: $${v.fix(meas, 3)}$ (prediction $${v.fix(e.lam, 3)}$)`;
          }
        });
        v.readout(() => String.raw`${eq.length} equilibri${eq.length === 1 ? 'um' : 'a'}: ` + eq.map((e) => String.raw`$N^*=${v.fix(e.x, 2)}$ (${e.lam < 0 ? 'stable' : 'unstable'})`).join(', ') + info);
      },
    },
    {
      num: '1.6',
      kind: 'Theorem',
      name: 'Logistic solution: sigmoid approach to carrying capacity',
      statement: String.raw`The initial-value problem $\dot N = rN(1-N/K)$, $N(0)=N_0>0$ has the unique solution
$$N(t)=\frac{K}{1+\bigl(K/N_0-1\bigr)e^{-rt}} .$$
It increases to $K$ if $0<N_0<K$, decreases to $K$ if $N_0>K$. If $N_0<K/2$ the curve is sigmoid: the growth rate $\dot N$ is largest, and $N$ has its inflection point, exactly when $N=K/2$, at time $t^*=\frac1r\ln\bigl(K/N_0-1\bigr)$.`,
      idea: String.raw`The equation is separable. With the substitution $u=1/N$ it becomes linear, $\dot u=-ru+r/K$, whose solution is $u=1/K+(1/N_0-1/K)e^{-rt}$; inverting gives the formula. The speed $\dot N=rN(1-N/K)$ is a parabola in $N$ with its maximum at $N=K/2$ (pma-5.8), so $N$ is steepest when it crosses $K/2$.`,
      caption: String.raw`Drag $N_0$ (gold) below and above $K/2$. The closed form (blue) is overlaid on a numerical solution (gold dots; choose Euler or RK4 and the step). The right panel shows the speed $\dot N(t)$: its peak sits at $N=K/2$ at the predicted time, and for $N_0\ge K/2$ there is no inflection.`,
      deps: ['mathbio-1.4', 'mathbio-1.5'],
      tags: ['logistic growth', 'inflection point'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const r = v.slider('$r$', 0.2, 1.5, 0.7, { step: 0.01 });
        const K = v.slider('$K$', 50, 200, 100, { step: 1 });
        const method = v.select('numerical method', [{ value: 'rk4', label: 'RK4' }, { value: 'euler', label: 'Euler' }], 'euler');
        const hstep = v.slider('step $h$', 0.1, 2, 0.6, { step: 0.05 });
        const TM = 16;
        const A = v.stage({ x: [0, TM], y: [0, 160], axes: 'box', gutter: true, height: 330, weight: 1.2, minWidth: 300, xlabel: 't', ylabel: 'N(t)', title: 'closed form and numerics' });
        const B = v.stage({ x: [0, TM], y: [0, 30], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 't', ylabel: 'dN/dt', title: 'speed of growth' });
        const H = A.handle(0, 6, { color: 'gold', label: '$N_0$', labelPos: 'ne', constrain: (x, y) => [0, v.M.clamp(y, 0.5, 1.5 * K.value)] });
        let rep = {};
        v.legend([['accent', 'closed form'], ['gold', 'numerical', { dot: true }], ['orange', '$K/2$ and inflection', { dash: true }]]);
        v.render(() => {
          const rv = r.value, Kv = K.value, n0 = H.y, h = hstep.value;
          const Nt = (t) => Kv / (1 + (Kv / n0 - 1) * Math.exp(-rv * t));
          const f = (t, n) => rv * n * (1 - n / Kv);
          A.setView([0, TM], [0, 1.55 * Kv]);
          B.setView([0, TM], [0, 0.3 * rv * Kv]);
          A.hline(Kv, { color: 'green', dash: [6, 4] });
          A.hline(Kv / 2, { color: 'orange', dash: [4, 4], width: 1.2 });
          A.fn(Nt, { domain: [0, TM], color: 'accent', width: 3 });
          const pts = [[0, n0]]; let n = n0, err = 0;
          for (let k = 0; (k + 1) * h <= TM + 1e-9; k++) {
            const t = k * h;
            if (method.value === 'euler') n += h * f(t, n);
            else { const k1 = f(t, n), k2 = f(t, n + (h / 2) * k1), k3 = f(t, n + (h / 2) * k2), k4 = f(t, n + h * k3); n += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); }
            pts.push([(k + 1) * h, n]); err = Math.max(err, Math.abs(n - Nt((k + 1) * h)));
          }
          A.path(pts, { color: 'gold', width: 1.6, alpha: 0.7 });
          A.dots(pts, { r: 3.5, color: 'gold' });
          const speed = (t) => f(0, Nt(t));
          B.fn(speed, { domain: [0, TM], color: 'accent', width: 3 });
          B.hline(rv * Kv / 4, { color: 'orange', dash: [4, 4], width: 1.2 });
          const tstar = n0 < Kv / 2 ? Math.log(Kv / n0 - 1) / rv : null;
          // measured: time of largest speed on a fine grid
          let bi = 0, bs = -1; const fine = 4000;
          for (let i = 0; i <= fine; i++) { const s = speed((TM * i) / fine); if (s > bs) { bs = s; bi = i; } }
          const tm = (TM * bi) / fine;
          if (tstar != null && tstar < TM) { A.dot(tstar, Kv / 2, { r: 7, color: 'orange', hollow: true, width: 2.4 }); B.dot(tstar, rv * Kv / 4, { r: 7, color: 'orange', hollow: true, width: 2.4 }); A.vline(tstar, { color: 'orange', dash: [3, 5], alpha: 0.6 }); }
          rep = { tstar, tm, Nm: Nt(tm), err, peak: bs, edge: bi === 0 || bi === fine };
        });
        v.readout(() => rep.tstar == null ? String.raw`$N_0\ge K/2$: the speed $\dot N$ only decreases, so there is no inflection point (the curve is concave); max numerical error $${v.fix(rep.err, 3)}$` : String.raw`$t^*=\frac1r\ln(K/N_0-1)=${v.fix(rep.tstar, 3)}$; the speed peaks at $t=${v.fix(rep.tm, 2)}$ where $N=${v.fix(rep.Nm, 2)}$ and $K/2=${v.fix(K.value / 2, 2)}$; peak speed $${v.fix(rep.peak, 2)}$ vs $rK/4=${v.fix((r.value * K.value) / 4, 2)}$
 max numerical error at the grid points: $${v.fix(rep.err, 3)}$`);
      },
    },
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Nondimensionalization and scaling',
      statement: String.raw`Choose a characteristic population $K$ and a characteristic time $1/r$ and set $u=N/K$, $\tau=rt$. The logistic equation becomes the parameter-free equation $du/d\tau=u(1-u)$ with a single remaining parameter $u_0=N_0/K$. Three dimensional parameters $(r,K,N_0)$ collapse to one dimensionless group, and every logistic curve is the same curve $u=1/(1+e^{-(\tau-\tau_0)})$ shifted in time.`,
      idea: String.raw`Units are arbitrary, so only dimensionless combinations of parameters can matter for the shape of a solution. Choosing scales that make the terms of the equation $O(1)$ both removes redundant parameters and exposes which regime is slow or fast, large or small. Here the scales are forced by the equation: $K$ is the only population and $1/r$ the only time.`,
      caption: String.raw`Twelve logistic cultures with random $r$, $K$, $N_0$. Slide “rescaling” from $0$ to $1$ to divide each population by $K^s$ and multiply time by $r^s$: at $s=1$ every curve has the same shape. The last step, “shift time”, moves each curve so it reaches $u=\tfrac12$ at $\tau=0$ and they lie on top of each other.`,
      deps: ['mathbio-1.4'],
      tags: ['nondimensionalization', 'scaling'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const s = v.slider('rescaling $s$', 0, 1, 0, { step: 0.01 });
        const shift = v.toggle('shift time to $u=\\tfrac12$', false);
        let seed = 5;
        let P = [];
        const draw = () => {
          const rg = v.rng(seed);
          P = Array.from({ length: 12 }, () => ({ r: Math.exp(Math.log(0.3) + rg() * Math.log(6)), K: Math.exp(Math.log(20) + rg() * Math.log(100)), u0: 0.01 + 0.3 * rg() }));
        };
        draw();
        v.button('New random cultures', () => { seed++; draw(); });
        const S = v.stage({ x: [0, 16], y: [0, 1], axes: 'box', gutter: true, height: 380, full: true, xlabel: 'time', ylabel: 'population', title: 'twelve logistic cultures' });
        let dev = 0, sp = 0;
        v.render(() => {
          const sv = s.value, sh = shift.value;
          const pts = P.map((q) => ({ q, th: Math.log(1 / q.u0 - 1), xs: Math.pow(q.r, sv - 1), ys: Math.pow(q.K, 1 - sv) }));
          // curves as functions of tau in [0, 14], optionally shifted
          let xmax = 0, ymax = 0;
          const curves = pts.map(({ q, th, xs, ys }) => {
            const arr = [];
            for (let k = 0; k <= 280; k++) {
              const tau = (14 * k) / 280, u = 1 / (1 + (1 / q.u0 - 1) * Math.exp(-tau));
              const X = (tau - (sh ? th : 0)) * xs, Y = u * ys; arr.push([X, Y]); xmax = Math.max(xmax, X); ymax = Math.max(ymax, Y);
            }
            return arr;
          });
          const xmin = Math.min(...curves.map((c) => c[0][0]));
          S.setView([Math.min(0, xmin), xmax * 1.03], [0, ymax * 1.06]);
          S.setLabels(sv === 0 ? 'time $t$' : sv === 1 ? (sh ? 'scaled time $\\tau-\\tau_{1/2}$' : 'scaled time $\\tau=rt$') : 'time $r^st$', sv === 0 ? 'population $N$' : sv === 1 ? 'population $u=N/K$' : 'population $N/K^s$');
          if (sv === 1) S.hline(1, { color: 'green', dash: [6, 4] });
          curves.forEach((c, i) => S.path(c, { color: ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red'][i % 8], width: 2, alpha: 0.85 }));
          // deviation from the master curve (only meaningful at s = 1 with the shift)
          dev = 0;
          for (const { q, th } of pts) for (let k = 0; k <= 56; k++) { const tau = (14 * k) / 56, u = 1 / (1 + (1 / q.u0 - 1) * Math.exp(-tau)); dev = Math.max(dev, Math.abs(u - 1 / (1 + Math.exp(-(tau - th))))); }
          const ymaxs = pts.map(({ q, ys }) => ys), spread = Math.max(...ymaxs) / Math.min(...ymaxs);
          sp = spread;
        });
        v.readout(() => String.raw`ratio of largest to smallest plateau on screen: $${v.fmt(sp, 3)}$ (it equals $1$ at $s=1$)
 parameters needed to describe a curve: $3$ before scaling ($r,K,N_0$), $1$ after ($u_0$); max distance of any curve from $1/(1+e^{-(\tau-\tau_{1/2})})$: $${v.sci(dev, 2)}$`);
      },
    },
    {
      num: '1.8',
      kind: 'Model',
      name: 'Gompertz growth',
      credit: 'Gompertz, 1825',
      statement: String.raw`The Gompertz model $\dfrac{dN}{dt}=aN\ln\dfrac KN$ ($a,K>0$) has solution $N(t)=K\exp\bigl(\ln(N_0/K)\,e^{-at}\bigr)$. It is sigmoid and tends to $K$ like the logistic curve, but asymmetric: the growth rate is largest, and the inflection point lies, at $N=K/e\approx0.37K$ rather than $K/2$. The per-capita rate falls like $\ln(K/N)$, not linearly.`,
      idea: String.raw`Put $y=\ln(N/K)$: then $\dot y=-ay$, a linear equation with solution $y_0e^{-at}$, which gives the formula. The speed $aN\ln(K/N)$ is maximal where its derivative $a\ln(K/N)-a=0$, i.e. $N=K/e$. Gompertz is often a better empirical fit to tumours and to organ growth, where growth slows before half the plateau is reached.`,
      scope: String.raw`Empirical: it describes sigmoid growth with early deceleration; it is not derived from resource limitation. The data here are synthetic and illustrative.`,
      caption: String.raw`Synthetic tumour volumes (dots, noise you control) are fitted by least squares on $\ln N$ with both models. Choose which model generated the data and resample the noise: the residual plot and the sum of squares show which one fits better, and the circled points mark each fit's inflection ($K/2$ for the logistic, $K/e$ for Gompertz).`,
      deps: ['mathbio-1.4'],
      tags: ['Gompertz', 'tumour growth', 'model fitting'],
      refs: ['Murray I ch. 1'],
      viz(v) {
        const src = v.select('data generated by', [{ value: 'gom', label: 'Gompertz' }, { value: 'log', label: 'logistic' }], 'gom');
        const noise = v.slider('noise level', 0.02, 0.3, 0.08, { step: 0.01 });
        let seed = 3;
        v.button('Resample noise', () => { seed++; });
        const TM = 60;
        const A = v.stage({ x: [0, TM], y: [0, 2000], axes: 'box', gutter: true, height: 330, weight: 1.3, minWidth: 300, xlabel: 'day', ylabel: 'tumour volume (mm³)', title: 'tumour volume and two fits' });
        const B = v.stage({ x: [0, TM], y: [-0.6, 0.6], axes: 'box', gutter: true, height: 330, weight: 0.9, minWidth: 260, xlabel: 'day', ylabel: 'residual ln(data/fit)', title: 'residuals' });
        const T = Array.from({ length: 16 }, (_, i) => 3 + i * 3.6);
        const gomF = (p, t) => { const [K, a, N0] = p; return K * Math.exp(Math.log(N0 / K) * Math.exp(-a * t)); };
        const logF = (p, t) => { const [K, r, N0] = p; return K / (1 + (K / N0 - 1) * Math.exp(-r * t)); };
        let cache = { key: '' }, rep = {};
        const fit = (F, data, start) => {
          const obj = (q) => { const p = q.map(Math.exp); if (p[2] >= p[0] * 0.999) return 1e9; let s = 0; for (let i = 0; i < T.length; i++) { const e = Math.log(data[i] / F(p, T[i])); s += e * e; } return s; };
          let best = null;
          for (const k of [1, 0.5, 2]) {
            const q0 = start.map((x, j) => Math.log(j === 1 ? x * k : x));
            const o = v.M.nelderMead(obj, q0, { step: 0.4, tol: 1e-12, maxIt: 1500 });
            if (!best || o.fx < best.fx) best = o;
          }
          return { p: best.x.map(Math.exp), sse: best.fx };
        };
        v.legend([['ink', 'data', { dot: true }], ['accent', 'logistic fit'], ['orange', 'Gompertz fit'], ['faint', 'true curve', { dash: true }]]);
        v.render(() => {
          const key = `${src.value}|${noise.value}|${seed}`;
          if (cache.key !== key) {
            const rg = v.rng(seed * 7 + (src.value === 'gom' ? 1 : 2));
            const truth = src.value === 'gom' ? (t) => gomF([1600, 0.07, 40], t) : (t) => logF([1500, 0.16, 40], t);
            const data = T.map((t) => truth(t) * Math.exp(noise.value * rg.normal()));
            const L = fit(logF, data, [Math.max(...data) * 1.1, 0.12, data[0] * 0.8]);
            const G = fit(gomF, data, [Math.max(...data) * 1.1, 0.06, data[0] * 0.8]);
            cache = { key, truth, data, L, G };
          }
          const { truth, data, L, G } = cache;
          A.setView([0, TM], [0, Math.max(...data, L.p[0], G.p[0]) * 1.1]);
          A.fn(truth, { domain: [0, TM], color: 'faint', dash: [5, 4], width: 1.6 });
          A.fn((t) => logF(L.p, t), { domain: [0, TM], color: 'accent', width: 2.6 });
          A.fn((t) => gomF(G.p, t), { domain: [0, TM], color: 'orange', width: 2.6 });
          A.dots(T.map((t, i) => [t, data[i]]), { r: 4.5, color: 'ink' });
          const tL = Math.log(L.p[0] / L.p[2] - 1) / L.p[1], tG = Math.log(Math.log(G.p[0] / G.p[2])) / G.p[1];
          if (tL > 0 && tL < TM) A.dot(tL, L.p[0] / 2, { r: 8, hollow: true, color: 'accent', width: 2.2 });
          if (tG > 0 && tG < TM) A.dot(tG, G.p[0] / Math.E, { r: 8, hollow: true, color: 'orange', width: 2.2 });
          B.hline(0, { color: 'muted' });
          T.forEach((t, i) => { B.dot(t - 0.45, Math.log(data[i] / logF(L.p, t)), { r: 4, color: 'accent' }); B.dot(t + 0.45, Math.log(data[i] / gomF(G.p, t)), { r: 4, color: 'orange' }); });
          rep = { sL: L.sse, sG: G.sse, kL: L.p[0], kG: G.p[0] };
        });
        v.readout(() => String.raw`sum of squared residuals (log scale): logistic $${v.fix(rep.sL, 4)}$, Gompertz $${v.fix(rep.sG, 4)}$ — ${rep.sG < rep.sL ? 'Gompertz' : 'logistic'} fits better
 fitted plateaus: $K_{\text{logistic}}=${v.fix(rep.kL, 0)}$, $K_{\text{Gompertz}}=${v.fix(rep.kG, 0)}$; inflection at $K/2$ versus $K/e = ${v.fix(0.3679, 3)}K$`);
      },
    },
    {
      num: '1.9',
      kind: 'Phenomenon',
      name: 'Allee effect',
      credit: 'Allee, 1931',
      statement: String.raw`When individuals help one another at low density (finding mates, group defence, cooperative feeding) the per-capita growth rate $\dot N/N$ can be an increasing function of $N$ at small $N$: an **Allee effect**. In the strong case, $\dot N = rN\bigl(\tfrac NA-1\bigr)\bigl(1-\tfrac NK\bigr)$ with $0<A<K$, the population has three equilibria $0$ and $K$ (stable) and the threshold $A$ (unstable): populations that start below $A$ go extinct, those above it grow to $K$. A weak Allee effect (positive per-capita rate everywhere, but still increasing at small $N$) creates no threshold.`,
      idea: String.raw`Linear stability (1.5): $f'(0)=-r<0$ makes extinction stable, $f'(A)=r(1-A/K)>0$ makes $A$ unstable and $f'(K)=-r(1-A/K)<0$ makes $K$ stable. The unstable equilibrium divides the line into two basins of attraction. Raising $A$ moves the threshold up and shrinks the basin of the persistent state; as $A\to K$ the two equilibria merge and annihilate.`,
      scope: String.raw`Single-species model with a deterministic threshold; in real populations the threshold is blurred by randomness, so populations near it can go either way.`,
      caption: String.raw`Drag the gold handle (released population size) along the $N$-axis, change the threshold $A$ or switch to a weak Allee effect. Trajectories that start above the threshold turn green and recover; those below turn red and go extinct. The right panel compares the per-capita rate with the ordinary logistic line.`,
      deps: ['mathbio-1.4', 'mathbio-1.5'],
      tags: ['Allee effect', 'extinction threshold'],
      refs: ['Murray I ch. 1', 'Edelstein-Keshet ch. 6'],
      viz(v) {
        const type = v.select('type', [{ value: 'strong', label: 'strong' }, { value: 'weak', label: 'weak' }], 'strong');
        const A = v.slider('threshold $A$ (or $c$ if weak)', 0.02, 0.8, 0.25, { step: 0.01 });
        const TM = 40, r = 0.4;
        const f = (n) => (type.value === 'strong' ? r * n * (n / A.value - 1) * (1 - n) : r * n * (1 - n) * (n + A.value) / (1 + A.value));
        const L = v.stage({ x: [0, 1.15], y: [-0.06, 0.06], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 260, xlabel: 'N / K', ylabel: 'dN/dt', title: 'growth rate' });
        const M = v.stage({ x: [0, TM], y: [0, 1.15], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 260, xlabel: 't', ylabel: 'N / K', title: 'trajectories' });
        const P = v.stage({ x: [0, 1.15], y: [-0.5, 0.45], axes: 'box', gutter: true, height: 320, weight: 0.8, minWidth: 240, xlabel: 'N / K', ylabel: 'per-capita rate', title: 'per-capita rate $\\dot N/N$' });
        const H = L.handle(0.15, 0, { color: 'gold', label: '$N_0$', labelPos: 'n', constrain: (x) => [v.M.clamp(x, 0.01, 1.1), 0] });
        let eq = [], fate = '';
        v.legend([['green', 'recovers'], ['red', 'goes extinct'], ['gold', 'your release'], ['muted', 'logistic', { dash: true }]]);
        v.render(() => {
          const Av = A.value, n0 = H.x;
          eq = roots1(f, 0, 1.2, 1200).map((x) => ({ x, lam: d1(f, x, 1e-5) }));
          const ext = (tr) => tr[tr.length - 1][1] < 0.02;
          L.hline(0, { color: 'muted' });
          { let lo = 0, hi = 0; for (let k = 0; k <= 230; k++) { const y = f((1.15 * k) / 230); lo = Math.min(lo, y); hi = Math.max(hi, y); } L.setView([0, 1.15], [lo * 1.25 - 0.003, hi * 1.2 + 0.003]); }
          L.fn(f, { domain: [0, 1.15], color: 'accent', width: 3 });
          if (type.value === 'strong') L.vband(0, Av, { color: 'red', alpha: 0.08 });
          for (const e of eq) L.dot(e.x, 0, { r: 6, color: e.lam < 0 ? 'green' : 'red', hollow: e.lam > 0 });
          const F = (t, n) => f(n);
          for (const q of [0.05, 0.12, 0.2, 0.3, 0.4, 0.55, 0.8, 1.1]) { const tr = traj1(F, q, TM, 300); M.path(tr, { color: ext(tr) ? 'red' : 'green', width: 1.3, alpha: 0.5 }); }
          const tr = traj1(F, n0, TM, 400); const x = ext(tr);
          M.path(tr, { color: 'gold', width: 3.2 });
          M.dot(0, n0, { r: 5, color: 'gold' });
          fate = x ? 'goes extinct' : 'recovers to $K$';
          for (const e of eq) if (e.lam > 0) M.hline(e.x, { color: 'red', dash: [5, 5], alpha: 0.6 });
          P.hline(0, { color: 'muted' });
          P.fn((n) => r * (1 - n), { domain: [0.003, 1.15], color: 'muted', dash: [6, 4], width: 1.8 });
          P.fn((n) => f(n) / n, { domain: [0.003, 1.15], color: 'accent', width: 3 });
          P.dot(n0, f(n0) / n0, { r: 6, color: 'gold' });
        });
        v.readout(() => `equilibria: ` + eq.map((e) => String.raw`$N^*/K=${v.fix(e.x, 3)}$ (${e.lam < 0 ? 'stable' : 'unstable'})`).join(', ') + String.raw`
 released at $N_0/K=${v.fix(H.x, 3)}$ the population ${fate}` + (type.value === 'weak' ? String.raw`; weak Allee effect: only $0$ (unstable) and $K$` : ''));
      },
    },
  ],
};
