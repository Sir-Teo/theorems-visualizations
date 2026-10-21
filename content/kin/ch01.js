// Chemical Kinetics — Chapter 1: Rates and rate laws
import { clamp, DATA, solve, noiser, fitFirst, fitSecond, sse, kUnit, nice, GasBox } from './ch01.shared.js';

// Scan of event counts against concentration for the particle box (shared by items 1.3; computed once, on demand).
let SCAN = null;
const scanBox = () => {
  if (SCAN) return SCAN;
  SCAN = [30, 45, 70, 105, 160].map((N) => {
    const g = new GasBox(N, 11 + N); for (let i = 0; i < 12000; i++) g.step(0.004);
    return { N, T: g.time, n: g.count.slice(), rate: g.count.map((c) => c / g.time) };
  });
  return SCAN;
};

export default {
  collection: 'kin',
  chapter: 1,
  title: 'Rates and rate laws',
  summary: String.raw`A rate law says how fast a reaction runs as a function of concentrations; its orders are found by experiment, not read off the balanced equation. Integrating the simple orders gives the straight-line plots and half-lives used to analyse data, and reactions that run both ways relax toward the equilibrium constant at a rate set by the sum of the forward and backward rate constants. Fast-reaction methods and detailed balance close the chapter.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Definition', name: 'Rate of reaction',
      statement: String.raw`For a reaction written $0 = \sum_i \nu_i\,\mathrm{X}_i$ (stoichiometric numbers $\nu_i<0$ for reactants, $>0$ for products) the **extent of reaction** $\xi$ is defined by $n_i = n_i(0)+\nu_i\xi$, and the **rate of reaction** (at constant volume) is
$$v \;=\; \frac{1}{V}\frac{d\xi}{dt} \;=\; \frac1{\nu_i}\frac{d[\mathrm X_i]}{dt}\qquad\text{for every species } i .$$
It is one number per reaction, in $\mathrm{mol\,L^{-1}\,s^{-1}}$, independent of which species is followed. The rates of change $d[\mathrm X_i]/dt$ of the individual species differ by their stoichiometric numbers (and are negative for reactants); the rate of consumption or formation of a species is $|d[\mathrm X_i]/dt|$. The definition presupposes a closed system of fixed volume and no accumulating intermediates.`,
      idea: String.raw`Atoms are conserved, so the amounts of all species move in lock-step along one coordinate, the extent $\xi$: every species' concentration is an affine function of the single variable $[\mathrm X_i]=[\mathrm X_i]_0+\nu_i\xi/V$. Differentiating gives the same $d\xi/dt$ for all of them after division by $\nu_i$. Dividing by the coefficient is what turns many time-courses into one rate.`,
      caption: String.raw`Pick a reaction and drag the time slider. Tangent lines are finite-difference slopes of the numerically integrated curves. The raw slopes (left bars) differ with the coefficients and sign; divided by $\nu_i$ (right bars) all agree with each other and with the rate law. The $\mathrm{N_2+3H_2}$ rate law is illustrative, not elementary.`,
      deps: [],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['rate', 'extent of reaction'],
      credit: 'IUPAC Gold Book, "rate of reaction"; extent of reaction by De Donder, 1920s',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Reaction_rate' },
      viz(v) {
        const RX = {
          n2o5: { sp: ['N₂O₅', 'NO₂', 'O₂'], nu: [-2, 4, 1], c0: [0.0365, 0, 0], T: 6500, law: (c) => 0.5 * 4.82e-4 * c[0],
            note: 'rate law $v=\\tfrac12 k[\\mathrm{N_2O_5}]$ with $k=4.82\\times10^{-4}\\,\\mathrm{s^{-1}}$ (CCl₄, 45 °C, textbook data)', eq: String.raw`2\,\mathrm{N_2O_5}\to4\,\mathrm{NO_2}+\mathrm{O_2}` },
          hi: { sp: ['H₂', 'I₂', 'HI'], nu: [-1, -1, 2], c0: [0.02, 0.02, 0], T: 400, law: (c) => 0.5 * c[0] * c[1],
            note: 'illustrative rate law $v=k[\\mathrm{H_2}][\\mathrm{I_2}]$, $k=0.5\\,\\mathrm{M^{-1}s^{-1}}$', eq: String.raw`\mathrm{H_2}+\mathrm{I_2}\to2\,\mathrm{HI}` },
          nh3: { sp: ['N₂', 'H₂', 'NH₃'], nu: [-1, -3, 2], c0: [0.10, 0.30, 0], T: 160, law: (c) => 0.05 * c[0] * c[1],
            note: 'illustrative rate law $v=k[\\mathrm{N_2}][\\mathrm{H_2}]$, $k=0.05\\,\\mathrm{M^{-1}s^{-1}}$ (not the Haber mechanism)', eq: String.raw`\mathrm{N_2}+3\,\mathrm{H_2}\to2\,\mathrm{NH_3}` },
        };
        const rx = v.select('reaction', [{ value: 'n2o5', label: '2 N₂O₅ → 4 NO₂ + O₂' }, { value: 'hi', label: 'H₂ + I₂ → 2 HI' }, { value: 'nh3', label: 'N₂ + 3 H₂ → 2 NH₃' }], 'n2o5');
        const tS = v.slider('time $t$ (fraction of run)', 0.02, 0.98, 0.18, { step: 0.01 });
        const cache = {};
        const sol = () => {
          const R = RX[rx.value];
          return cache[rx.value] || (cache[rx.value] = solve((t, c) => { const w = R.law(c); return R.nu.map((n) => n * w); }, R.c0, R.T, 1200));
        };
        const col = ['accent', 'orange', 'green'];
        const sc = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'concentration (M)', title: 'concentration–time curves and their slopes', weight: 1.35 });
        const sb = v.stage({ x: [0, 9], y: [-1, 1], height: 340, axes: 'box', gutter: true, xlabel: 'raw slopes (left)  ·  divided by ν (right)', ylabel: 'rate', title: 'slope of each curve, raw and divided by $\\nu_i$', weight: 1, minWidth: 260 });
        let info = null;
        v.render(() => {
          const R = RX[rx.value], S = sol(), t = tS.value * R.T, c = S.at(t), dc = S.deriv(t);
          const cmax = Math.max(...R.c0, ...S.at(R.T)) * 1.08;
          sc.setView([0, R.T], [0, cmax]);
          R.sp.forEach((nm, i) => {
            sc.path(S.y.map((y, j) => [S.T * j / S.n, y[i]]), { color: col[i], width: 2.4 });
            const half = 0.11 * R.T; // tangent drawn over +-half
            sc.line(t - half, c[i] - dc[i] * half, t + half, c[i] + dc[i] * half, { color: col[i], width: 1.4, dash: [6, 4] });
            sc.dot(t, c[i], { r: 5, color: col[i] });
            sc.text(nm, S.T * 0.985, Math.max(S.y[S.n][i], 0) + cmax * 0.03, { color: col[i], size: 12, align: 'right', weight: 600 });
          });
          sc.vline(t, { color: 'faint', dash: [3, 4], width: 1 });
          // bars: raw slopes and slopes divided by nu
          const raw = dc, norm = dc.map((d, i) => d / R.nu[i]);
          const mx = Math.max(...raw.map(Math.abs));
          const unit = Math.pow(10, Math.floor(Math.log10(mx)));
          const sy = (x) => x / unit;
          sb.setView([0, 9], [-1.15 * Math.max(...raw.map((x) => Math.abs(sy(x)))) , 1.15 * Math.max(...raw.map((x) => Math.abs(sy(x))), ...norm.map((x) => Math.abs(sy(x))))]);
          sb.setLabels(undefined, `rate (${v.M.pow10Text(Math.round(Math.log10(unit)))} M/s)`);
          sb.setTicks(R.sp.flatMap((nm, i) => [[1 + i + 0.5, nm], [5 + i + 0.5, nm]]), null);
          sb.hline(0, { color: 'faint' });
          sb.bars(raw.map(sy), { x0: 1, dx: 1, color: (val, i) => v.color(col[i], 0.85) });
          sb.bars(norm.map(sy), { x0: 5, dx: 1, color: (val, i) => v.color(col[i], 0.85) });
          sb.corner('one rate →', 'tr', { color: 'green', weight: 650 });
          info = { R, t, c, dc, norm, law: R.law(c), xi: (c[0] - R.c0[0]) / R.nu[0] };
        });
        v.readout(() => {
          if (!info) return '';
          const { R, t, norm, law, xi } = info;
          const rates = norm.map((x) => x).map((x) => nice(v, x * 1, 3));
          return `$${R.eq}$ · ${R.note}\n$t=${v.fix(t, 0)}$ s · extent $\\xi=${nice(v, xi, 3)}\\ \\mathrm M$ · $v=\\frac1{\\nu_i}\\frac{d[\\mathrm X_i]}{dt}$ from the three slopes: ${rates.map((r) => `$${r}$`).join(', ')} M/s · from the rate law: **$${nice(v, law, 3)}$ M/s**`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Definition', name: 'Rate law, rate constant and reaction order',
      statement: String.raw`For a reaction $a\mathrm A+b\mathrm B\to\text{products}$ a **rate law** is an experimental relation between the rate $v$ and the concentrations of the species present, most often a power law
$$v = k\,[\mathrm A]^{m}[\mathrm B]^{n}\cdots .$$
The exponents $m,n$ are the **orders** with respect to A and B (integers, halves, zero or even negative), $m+n+\cdots$ is the **overall order**, and $k$ is the **rate constant**, independent of concentrations (it depends on temperature and medium) with units $\mathrm{M}^{1-(m+n)}\,\mathrm{s}^{-1}$. The orders are determined by experiment; they need not equal the stoichiometric coefficients $a,b$ unless the reaction is a single elementary step (1.3). Not every reaction has a power-law rate law at all.`,
      idea: String.raw`A rate law is a measured function $v([\mathrm A],[\mathrm B])$ and a power law is simply its local description on a log–log scale: $\partial\ln v/\partial\ln[\mathrm A]=m$. The balanced equation says how much of each species is consumed (1.1) but says nothing about how many molecular encounters, steps and intermediates sit behind the overall change, so the orders encode the mechanism rather than the stoichiometry.`,
      caption: String.raw`The map shows $\log_{10}v$ over the concentration plane; contours of a power law are straight lines on these log axes, with slope $-m/n$. **Drag the state** or press the presets, then compare the measured factors on doubling a concentration (bars) with what the stoichiometric coefficients of the equation would predict (hollow marks). Real reactions rarely agree.`,
      deps: ['kin-1.1'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['rate law', 'order'],
      credit: 'Rate laws by Wilhelmy (1850) and Guldberg & Waage (1864); rate laws classified by molecularity and order by van \'t Hoff (1884; the word "order" is Ostwald’s, 1887)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rate_equation' },
      viz(v) {
        const PRE = {
          custom: { m: 1, n: 1, a: 1, b: 1, name: 'custom' },
          h2i2: { m: 1, n: 1, a: 1, b: 1, name: 'H₂ + I₂ → 2 HI' },
          no2: { m: 2, n: 1, a: 2, b: 1, name: '2 NO + O₂ → 2 NO₂' },
          cocl: { m: 1, n: 1.5, a: 1, b: 1, name: 'CO + Cl₂ → COCl₂' },
          h2br: { m: 1, n: 0.5, a: 1, b: 1, name: 'H₂ + Br₂ → 2 HBr (early)' },
          noh2: { m: 2, n: 1, a: 2, b: 2, name: '2 NO + 2 H₂ → N₂ + 2 H₂O' },
          zero: { m: 0, n: 1, a: 1, b: 1, name: 'A + B, zero order in A' },
        };
        const sel = v.select('example', [{ value: 'custom', label: 'custom' }, { value: 'h2i2', label: 'H₂+I₂ (1,1)' }, { value: 'no2', label: '2NO+O₂ (2,1)' }, { value: 'cocl', label: 'CO+Cl₂ (1,3/2)' }, { value: 'noh2', label: '2NO+2H₂ (2,1)' }], 'noh2', {
          onChange: () => { const p = PRE[sel.value]; if (sel.value !== 'custom') { mS.set(p.m); nS.set(p.n); aS.set(p.a); bS.set(p.b); } } });
        const mS = v.slider('order in A, $m$', -1, 3, 2, { step: 0.5, onChange: () => { sel.value = 'custom'; } });
        const nS = v.slider('order in B, $n$', -1, 3, 1, { step: 0.5, onChange: () => { sel.value = 'custom'; } });
        const aS = v.slider('coefficient $a$ in the equation', 1, 3, 2, { step: 1, int: true });
        const bS = v.slider('coefficient $b$', 1, 3, 2, { step: 1, int: true });
        const kS = v.slider('$k$ (in its own units)', 0.01, 100, 1, { log: true });
        const s = v.stage({ x: [0.01, 1], y: [0.01, 1], xlog: true, ylog: true, height: 340, axes: 'box', gutter: true, xlabel: '[A] (M)', ylabel: '[B] (M)', title: '$\\log_{10}$ of the rate over the concentration plane', weight: 1.15 });
        const sb = v.stage({ x: [0, 5], y: [0, 1], height: 340, axes: 'box', gutter: true, xticks: [], ylabel: 'rate multiplied by', title: 'what happens to $v$ when…', weight: 1, minWidth: 260 });
        const h = s.handle(0.2, 0.1, { color: 'gold', label: 'state' });
        let info = null;
        v.render(() => {
          const m = mS.value, n = nS.value, k = kS.value;
          const rate = (A, B) => k * Math.pow(A, m) * Math.pow(B, n);
          const f = (A, B) => Math.log10(rate(A, B));
          const lo = Math.min(f(0.01, 0.01), f(1, 1), f(0.01, 1), f(1, 0.01)), hi = Math.max(f(0.01, 0.01), f(1, 1), f(0.01, 1), f(1, 0.01));
          s.heat((A, B) => f(A, B), { range: [lo - 0.2, hi + 0.2], cmap: 'theme', color: 'accent', res: 3, key: `r${m},${n},${k}` });
          const lv = []; for (let q = Math.ceil(lo); q <= hi; q++) lv.push(q);
          s.contour(f, lv, { color: 'ink', width: 0.9, alpha: 0.45, res: 100, labels: true, fmt: (x) => v.M.pow10Text(x) });
          const A = h.x, B = h.y;
          s.line(A, B, 2 * A, B, { color: 'orange', width: 2.4 }); s.line(A, B, A, 2 * B, { color: 'green', width: 2.4 });
          s.dot(2 * A, B, { r: 4, color: 'orange' }); s.dot(A, 2 * B, { r: 4, color: 'green' });
          const v0 = rate(A, B), fa = rate(2 * A, B) / v0, fb = rate(A, 2 * B) / v0, fab = rate(2 * A, 2 * B) / v0, f10 = rate(10 * A, B) / v0;
          const vals = [fa, fb, fab], naive = [Math.pow(2, aS.value), Math.pow(2, bS.value), Math.pow(2, aS.value + bS.value)];
          const top = Math.max(...vals, ...naive) * 1.1;
          sb.setView([0, 5], [0, top * 1.1]);
          const cols = ['orange', 'green', 'accent'];
          sb.bars(vals, { x0: 0.6, dx: 1.4, color: (_, i) => v.color(cols[i], 0.8) });
          const lbl = ['[A]×2', '[B]×2', 'both ×2'];
          sb.setTicks(lbl.map((t, i) => [0.6 + 1.4 * i + 0.7, t]), null);
          vals.forEach((y, i) => { const x = 0.6 + 1.4 * i + 0.7; sb.text(v.fmt(y, 3), x, Math.max(y, naive[i]), { size: 12, align: 'center', dy: -16, color: 'ink', weight: 650 });
            sb.dot(x, naive[i], { r: 5, hollow: true, color: 'red' }); });
          info = { v0, m, n, k, fa, fb };
        });
        v.legend([['orange', 'double [A]'], ['green', 'double [B]'], ['red', 'exponents taken from the equation', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { v0, m, n, k, fa, fb } = info, p = m + n;
          return `$v=k[\\mathrm A]^{${m}}[\\mathrm B]^{${n}}$ · overall order **${p}** · $k$ has units $${kUnit(p)}$ · at the state $v=${nice(v, v0, 3)}$ in these units · doubling A multiplies $v$ by $2^{${m}}=${v.fmt(fa, 3)}$, doubling B by $2^{${n}}=${v.fmt(fb, 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Definition', name: 'Elementary reactions and molecularity',
      statement: String.raw`An **elementary reaction** is a single molecular event with no intermediates; its **molecularity** is the number of reactant molecules taking part: one (unimolecular, $\mathrm A\to\mathrm P$), two (bimolecular, $\mathrm A+\mathrm B\to\mathrm P$) or, rarely, three (termolecular). For an elementary step, and only for one, the rate law follows from the equation by the **law of mass action**: the rate is $k$ times the product of the reactant concentrations, one factor for each molecule, so the order equals the molecularity. Higher molecularities are not observed because the simultaneous encounter of four or more molecules is vanishingly improbable, and termolecular steps are rare and slow compared with bimolecular ones.`,
      idea: String.raw`In a dilute gas or solution molecules are placed independently at random, so the chance that one given molecule is in a small region is proportional to the concentration $c$, and the chance that $m$ given molecules meet at once is proportional to $c^m$. The number of $m$-fold encounters per unit volume and time is then $\propto c^{m}$, which is mass action. Each additional molecule required costs another factor of the probability $\sim c\,d^{3}$ of finding a partner within contact distance $d$, which is tiny for dilute systems. The product rule in prob 2.1.1a is the probabilistic input: under the stated independent-placement idealization, simultaneous occupancy events for distinct reactant molecules have probability equal to the product of their individual probabilities. This supplies the concentration factors; it does not derive independence in a dense or correlated fluid.`,
      caption: String.raw`A two-dimensional box of fast molecules (contact distance $d=0.02$ of the box side). Flashes mark unimolecular events (green rings, a molecule reacts with probability $k\,dt$), bimolecular contacts (orange) and termolecular contacts (red). Change the number of molecules: the counted event rate on the right follows $c^1$, $c^2$, $c^3$, and the termolecular events are rare unless you crowd the box. Reacted molecules are replaced, keeping the concentration fixed.`,
      deps: ['kin-1.2', 'prob-2.1.1a'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['molecularity', 'mass action'],
      credit: 'Law of mass action: Guldberg & Waage, 1864',
      scope: String.raw`Mass-action rate laws hold for elementary steps in ideal gases or dilute ideal solutions, where molecules move independently between events.`,
      viz(v) {
        const mode = v.select('count events of molecularity', [{ value: 0, label: '1  A → P' }, { value: 1, label: '2  A + A → P' }, { value: 2, label: '3  A + A + A → P' }], 1);
        const nS = v.slider('number of molecules $N$ (box area 1)', 20, 200, 60, { step: 1, int: true, onChange: () => S.reset() });
        const sb = v.stage({ x: [-0.03, 1.03], y: [-0.03, 1.03], equal: true, height: 360, axes: false, title: 'molecules in a box', weight: 1, minWidth: 300 });
        const sr = v.stage({ x: [20, 300], y: [0.3, 3000], xlog: true, ylog: true, height: 360, axes: 'box', gutter: true, xlabel: 'molecules $N$ (concentration)', ylabel: 'events per unit time', title: 'counted event rate against concentration', weight: 1.1 });
        const S = v.sim(() => ({ g: new GasBox(nS.value, 5, 0.02, 0.5, 1), t0: 0 }), (st, dt) => { st.g.step(dt, true); st.g.flash.forEach((f) => { f.age += dt; }); st.g.flash = st.g.flash.filter((f) => f.age < 0.35); }, { dt: 0.004 });
        let info = null;
        v.animate((t) => {
          S.advance(Math.min(t, 40));
          const g = S.state.g, N = g.N;
          sb.rect(0, 0, 1, 1, { color: 'muted', stroke: true, fill: false, width: 1.2 });
          for (let i = 0; i < N; i++) sb.dot(g.x[i], g.y[i], { r: 3.3, color: 'accent' });
          for (const f of g.flash) {
            const a = 1 - f.age / 0.35;
            if (f.type === 0) sb.circle(f.x, f.y, 0.012 + 0.03 * f.age / 0.35, { color: 'green', alpha: a, width: 2, fill: false });
            else if (f.type === 1) { sb.line(f.x, f.y, f.x2, f.y2, { color: 'orange', width: 3, alpha: a }); sb.circle((f.x + f.x2) / 2, (f.y + f.y2) / 2, 0.025, { color: 'orange', alpha: a, fill: false, width: 1.5 }); }
            else sb.circle(f.x, f.y, 0.05, { color: 'red', alpha: a, width: 3, fill: false });
          }
          // scan data
          const sc = scanBox(), m = +mode.value + 1;
          const pts = sc.map((e) => [e.N, e.rate[m - 1]]).filter((p) => p[1] > 0);
          const fit = v.M.linreg(pts.map((p) => Math.log(p[0])), pts.map((p) => Math.log(p[1])));
          const ref = pts[Math.floor(pts.length / 2)], line = (x) => ref[1] * Math.pow(x / ref[0], m);
          const colr = ['green', 'orange', 'red'][m - 1];
          sr.fn((x) => Math.exp(fit.intercept) * Math.pow(x, fit.slope), { color: colr, width: 2.2, domain: [20, 300] });
          sr.fn(line, { color: 'muted', width: 1.4, dash: [6, 4], domain: [20, 300] });
          sr.dots(pts, { r: 5, color: 'gold' });
          sc.forEach((e) => { const cnt = e.n[m - 1], se = cnt > 0 ? 1 / Math.sqrt(cnt) : 0, y = e.rate[m - 1]; if (y > 0) sr.line(e.N, y * (1 - se), e.N, y * (1 + se), { color: 'gold', width: 1.4 }); });
          // live point
          const tt = g.time, live = [0, 1, 2].map((q) => g.count[q] / Math.max(tt, 1e-9));
          if (tt > 2 && live[m - 1] > 0) sr.dot(N, live[m - 1], { r: 6, color: 'accent', label: 'live', labelPos: 'se' });
          sr.corner('fitted slope ' + v.fix(fit.slope, 2), 'br', { color: colr, weight: 650, plate: true });
          info = { slope: fit.slope, se: fit.seSlope, live, tt, m, N };
        }, { period: 40, still: 14 });
        v.legend([['gold', 'counted rates (Poisson error bars)', { dot: true }], ['green', 'fitted power law'], ['muted', 'mass action: slope = molecularity', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { slope, se, live, tt, m, N } = info;
          if (tt < 1) return `molecularity ${m}: fitted log–log slope **${v.fix(slope, 2)} ± ${v.fix(se, 2)}** against the mass-action value ${m} · the live box is warming up (press play)`;
          return `molecularity ${m}: fitted log–log slope **${v.fix(slope, 2)} ± ${v.fix(se, 2)}** against the mass-action value ${m}\nlive box at $N=${N}$, $t=${v.fix(tt, 1)}$: events per unit time — unimolecular ${v.fix(live[0], 1)}, bimolecular ${v.fix(live[1], 1)}, termolecular ${v.fix(live[2], 2)} (ratio ter/bi ≈ ${v.fix(live[2] / Math.max(live[1], 1e-9), 3)}, which grows with crowding $N$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4', kind: 'Proposition', name: 'Zero-order kinetics',
      statement: String.raw`If the rate does not depend on the reactant concentration, $v=-d[\mathrm A]/dt=k$, then
$$[\mathrm A](t)=[\mathrm A]_0-kt\qquad(0\le t\le [\mathrm A]_0/k),\qquad t_{1/2}=\frac{[\mathrm A]_0}{2k},$$
a straight line in $t$ that reaches zero at $t=[\mathrm A]_0/k$; $k$ has units $\mathrm{M\,s^{-1}}$ and the half-life is proportional to the initial concentration. Zero order is always an effective, limiting behaviour: it arises when a surface, enzyme or light source is **saturated**, as in the Langmuir–Hinshelwood form $v=k\,K[\mathrm A]/(1+K[\mathrm A])$, which is zero order for $K[\mathrm A]\gg1$ and first order for $K[\mathrm A]\ll1$, so the line bends as the substrate runs out.`,
      idea: String.raw`With $v$ independent of $[\mathrm A]$ the differential equation of 1.2 integrates at once. The saturated rate $k$ is the capacity of the catalyst: a fixed number of sites, each turning over at a fixed frequency, is fully occupied as long as the gas pressure or concentration is high enough that $\theta=K c/(1+Kc)\approx1$. When $c$ falls to the order of $1/K$ the sites empty and the true order drifts from $0$ to $1$.`,
      caption: String.raw`Left: the numerically integrated concentration (blue) against the ideal zero-order line (dashed). Right: the rate against concentration with the running order $d\ln v/d\ln c=1/(1+Kc)$. Drag the **time** slider to move along the run; weaken the binding $K$ or lower $c_0$ and watch the straight line turn into an exponential tail.`,
      deps: ['kin-1.2'],
      refs: ['Houston'],
      tags: ['zero order', 'saturation', 'catalysis'],
      credit: 'Zero-order surface decompositions: Hinshelwood and co-workers, 1920s (NH₃ on tungsten, N₂O on gold)',
      scope: String.raw`Zero order is observed over the range of concentrations where the catalyst is saturated; it fails once the reactant is depleted.`,
      viz(v) {
        const kS = v.slider('capacity $k$ (M/s)', 0.001, 0.1, 0.01, { log: true });
        const KS = v.slider('binding constant $K$ (1/M)', 0.5, 2000, 40, { log: true });
        const cS = v.slider('$[\\mathrm A]_0$ (M)', 0.01, 1, 0.5, { log: true });
        const tS = v.slider('time (fraction of run)', 0, 1, 0.35, { step: 0.005 });
        const sc = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: '[A] (M)', title: 'concentration against time', weight: 1.2 });
        const sr = v.stage({ x: [0, 1], y: [0, 1], height: 330, axes: 'box', gutter: true, xlabel: '[A] (M)', ylabel: 'rate $v$ (M/s)', title: 'rate against concentration', weight: 1, minWidth: 260 });
        let info = null;
        v.render(() => {
          const k = kS.value, K = KS.value, c0 = cS.value;
          const T = 1.25 * c0 / k + 4 / (k * K);
          const rate = (c) => k * K * c / (1 + K * c);
          const S = solve((t, y) => [-rate(Math.max(y[0], 0))], [c0], T, 800);
          const t = tS.value * T, c = S.at(t)[0], dc = S.deriv(t)[0];
          sc.setView([0, T], [0, c0 * 1.06]);
          sc.line(0, c0, c0 / k, 0, { color: 'red', width: 1.8, dash: [7, 5] });
          sc.path(S.y.map((y, i) => [S.T * i / S.n, y[0]]), { color: 'accent', width: 2.6 });
          sc.vline(c0 / k, { color: 'faint', dash: [3, 4] });
          sc.text('$[\\mathrm A]_0/k$', c0 / k, 0, { baseline: 'bottom', dy: -4, align: 'left', dx: 4, color: 'muted', size: 11 });
          sc.dot(t, c, { r: 6, color: 'gold' });
          const half = 0.1 * T; sc.line(t - half, c - dc * half, t + half, c + dc * half, { color: 'gold', width: 1.8 });
          sr.setView([0, c0], [0, k * 1.1]);
          sr.hline(k, { color: 'red', dash: [7, 5], width: 1.6 });
          sr.fn(rate, { domain: [0, c0], color: 'accent', width: 2.6 });
          sr.dot(c, rate(c), { r: 6, color: 'gold' });
          const ord = 1 / (1 + K * c);
          sr.text(`order ${v.fix(ord, 2)}`, c, rate(c), { dy: 18, dx: 6, color: 'gold', size: 12, weight: 650, align: c > 0.7 * c0 ? 'right' : 'left' });
          // measured half-life from the numerical solution
          let th = null; for (let i = 0; i <= S.n; i++) if (S.y[i][0] <= c0 / 2) { th = S.T * i / S.n; break; }
          info = { T, c, dc, ord, th, th0: c0 / (2 * k), tz: c0 / k, K, c0, k };
        });
        v.legend([['accent', 'saturable rate law (numerical)'], ['red', 'ideal zero order', { dash: true }], ['gold', 'state and tangent', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const I = info;
          return `$t=${v.fix(I.c0 > 0 ? (tS.value * I.T) : 0, 1)}$ s: slope $d[\\mathrm A]/dt=${nice(v, I.dc, 3)}$ M/s against the capacity $-k=${nice(v, -I.k, 3)}$ · running order **${v.fix(I.ord, 2)}** · half-life measured ${I.th == null ? '—' : v.fix(I.th, 1) + ' s'} against the zero-order $[\\mathrm A]_0/2k=${v.fix(I.th0, 1)}$ s · ideal line ends at ${v.fix(I.tz, 1)} s`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5', kind: 'Proposition', name: 'First-order kinetics and half-life',
      statement: String.raw`If $v=-d[\mathrm A]/dt=k[\mathrm A]$ then
$$[\mathrm A](t)=[\mathrm A]_0e^{-kt},\qquad \ln[\mathrm A]=\ln[\mathrm A]_0-kt,\qquad t_{1/2}=\frac{\ln2}{k}=\frac{0.693}{k}.$$
$k$ has units $\mathrm{s^{-1}}$. A plot of $\ln[\mathrm A]$ against $t$ is a straight line of slope $-k$, and the half-life is independent of the initial concentration: after every interval $t_{1/2}$ half of what remains is gone, $[\mathrm A]=[\mathrm A]_0/2^{n}$ after $n$ half-lives. This is the unique order for which the half-life is constant; the mean lifetime is $\tau=1/k$.`,
      idea: String.raw`The equation $[\mathrm A]'=-k[\mathrm A]$ is the linear ODE of ode-1.5 and its solution is the exponential. Taking logarithms linearises it, which is why $\ln[\mathrm A]$ against $t$ is the diagnostic plot; setting $[\mathrm A]=[\mathrm A]_0/2$ gives $t_{1/2}=\ln 2/k$ with no dependence on $[\mathrm A]_0$, since scaling the solution by a constant solves the same equation.`,
      caption: String.raw`Choose the **real** textbook data (N₂O₅ in CCl₄ at 45 °C) or synthetic data with a rate-constant slider, noise and *Resample*. Both panels show the same data: concentration with the fitted exponential and its half-life ladder, and $\ln[\mathrm A]$ with the least-squares line. Switch the true law to *second order* to break the hypothesis: the logarithm bends and the measured half-lives are no longer equal.`,
      deps: ['kin-1.2', 'pma-8.6', 'ode-1.5'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['first order', 'half-life', 'exponential decay'],
      credit: 'First-order law of decay: Wilhelmy, 1850 (inversion of sucrose); N₂O₅ shown first order by Daniels & Johnston, 1921',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rate_equation#First-order_reactions' },
      viz(v) {
        const src = v.select('data', [{ value: 'real', label: 'N₂O₅ in CCl₄, 45 °C (textbook)' }, { value: 'syn', label: 'synthetic' }], 'real');
        const truth = v.select('true law (synthetic)', [{ value: 1, label: 'first order' }, { value: 2, label: 'second order' }], 1);
        const kS = v.slider('$k$ (s⁻¹)', 0.005, 0.5, 0.05, { log: true });
        const noise = v.slider('noise (relative)', 0, 0.15, 0.04, { step: 0.005 });
        let seed = 3; v.button('Resample', () => { seed++; });
        const sc = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: '[A] (M)', title: 'concentration and half-life ladder', weight: 1.1 });
        const sl = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'ln([A]/M)', title: 'linearisation', weight: 1, minWidth: 260 });
        let info = null;
        v.render(() => {
          const real = src.value === 'real';
          truth.el.hidden = real; kS.el.hidden = real; noise.el.hidden = real;
          let ts, cs, T, c0;
          if (real) { ts = DATA.n2o5.t; cs = DATA.n2o5.c; T = 4300; c0 = cs[0]; }
          else {
            const k = kS.value, ord = +truth.value; c0 = 1;
            const n = 10; T = 4 * Math.LN2 / k; const g = noiser(v, seed * 31 + ord);
            ts = Array.from({ length: n + 1 }, (_, i) => T * i / n * 0.95);
            // true curve: second order uses the same initial rate k [A]0 (so that half-life t1/2(1) = 1/(k c0) ... matched to first-order ln2/k)
            const k2 = k / Math.LN2 * 1; // second-order constant with equal first half-life ln2/k at c0 = 1
            cs = ts.map((t) => (ord === 1 ? c0 * Math.exp(-k * t) : c0 / (1 + k2 * c0 * t)) * Math.exp(noise.value * g()));
          }
          const fit = fitFirst(v.M, ts, cs), k = fit.k, th = Math.LN2 / k;
          const model = (t) => fit.c0 * Math.exp(-k * t);
          sc.setView([0, T], [0, Math.max(...cs, c0) * 1.1]);
          sc.fn(model, { color: 'accent', width: 2.4, domain: [0, T] });
          // half-life ladder
          for (let j = 1; j <= 4; j++) { const cj = fit.c0 / 2 ** j, tj = j * th; if (tj > T) break;
            sc.line(0, cj, tj, cj, { color: 'orange', width: 1.2, dash: [4, 4] }); sc.line(tj, cj, tj, 0, { color: 'orange', width: 1.2, dash: [4, 4] });
            sc.text(`${j}t½`, tj, 0, { size: 10.5, color: 'orange', baseline: 'bottom', dy: -3, dx: 3 }); }
          sc.dots(ts.map((t, i) => [t, cs[i]]), { r: 4.5, color: 'ink' });
          const lc = cs.map((c) => (c > 0 ? Math.log(c) : NaN)), lo = Math.min(...lc.filter(isFinite)), hi = Math.max(...lc.filter(isFinite));
          sl.setView([0, T], [lo - 0.6, hi + 0.3]);
          sl.fn((t) => Math.log(fit.c0) - k * t, { color: 'green', width: 2.4, domain: [0, T] });
          sl.dots(ts.map((t, i) => [t, lc[i]]).filter((p) => isFinite(p[1])), { r: 4.5, color: 'ink' });
          // measured successive half-lives from the data curve by interpolation of the (noisy) fitted-free data
          const thm = []; { let target = cs[0] / 2, last = 0; for (let i = 1; i < ts.length && thm.length < 3; i++) while (cs[i] <= target && thm.length < 3) { const f = (cs[i - 1] - target) / (cs[i - 1] - cs[i]); const tt = ts[i - 1] + f * (ts[i] - ts[i - 1]); thm.push(tt - last); last = tt; target /= 2; } }
          info = { k, se: fit.se, th, r2: fit.r2, thm, real, kSt: DATA.n2o5.kStated };
        });
        v.legend([['accent', 'fitted exponential'], ['orange', 'half-life ladder', { dash: true }], ['green', 'fitted line, slope $-k$'], ['ink', 'data', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { k, se, th, r2, thm, real, kSt } = info;
          return `slope of $\\ln[\\mathrm A]$: $k=${v.sci(k, 4)}\\pm${v.sci(se, 2)}\\ \\mathrm{s^{-1}}$ ($R^2=${v.fix(r2, 4)}$)${real ? ` · textbook value $${v.sci(kSt, 4)}$` : ''} · $t_{1/2}=\\ln2/k=${v.fix(th, 1)}$ s\nmeasured successive half-lives from the data: ${thm.map((x) => v.fix(x, 1)).join(' s, ')} s ${thm.length > 1 && Math.abs(thm[1] / thm[0] - 1) > 0.2 ? '— **unequal: not first order**' : '— equal, as first order requires'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6', kind: 'Proposition', name: 'Second-order kinetics',
      statement: String.raw`If $-d[\mathrm A]/dt=k[\mathrm A]^2$ (a single reactant, or $\mathrm A+\mathrm B$ with equal concentrations) then
$$\frac1{[\mathrm A]}=\frac1{[\mathrm A]_0}+kt,\qquad t_{1/2}=\frac1{k[\mathrm A]_0},$$
so $1/[\mathrm A]$ plotted against $t$ is a straight line of slope $k$ (units $\mathrm{M^{-1}s^{-1}}$). The half-life **lengthens** as the reaction proceeds: successive half-lives are $t_{1/2},\,2t_{1/2},\,4t_{1/2},\dots$ and the half-life is inversely proportional to the initial concentration. (Here $k$ is defined through the rate of disappearance of A; for $2\mathrm A\to$ products the IUPAC rate constant $k_v$ with $v=k_v[\mathrm A]^2$ is $k/2$.)`,
      idea: String.raw`Separating variables, $d[\mathrm A]/[\mathrm A]^2=-k\,dt$ integrates to the reciprocal law. Because the instantaneous rate falls with the square of the concentration, each halving of $[\mathrm A]$ takes twice as long as the last: the decay is a power law $\sim1/(kt)$ rather than an exponential, and its tail is much heavier than the first-order one. On any finite time interval with positive concentration, the antiderivative of $A^{-2}$ is $-A^{-1}$. The fundamental theorem pma 6.21 therefore evaluates the separated integral as $1/A(t)-1/A_0=kt$; the reciprocal formula stays positive for $t\ge0$ when $A_0,k>0$.`,
      caption: String.raw`Real data: the decomposition of NO₂ at 330 °C (textbook). Slide the number of points used for fitting: the second-order straight line in $1/[\mathrm A]$ (green) holds for all of them, while a first-order exponential fitted to the same early points (red) bends away. The grey ladder shows the doubling half-lives.`,
      deps: ['kin-1.2', 'pma-6.21'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['second order', 'half-life'],
      credit: 'Bodenstein, 1894–99 (H₂ + I₂ and HI decomposition as the classical second-order examples)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rate_equation#Second-order_reactions' },
      viz(v) {
        const src = v.select('data', [{ value: 'real', label: '2 NO₂ at 330 °C (textbook)' }, { value: 'syn', label: 'synthetic' }], 'real');
        const kS = v.slider('$k$ (M⁻¹s⁻¹)', 0.1, 5, 0.8, { log: true });
        const noise = v.slider('noise (relative)', 0, 0.12, 0.03, { step: 0.005 });
        const nfit = v.slider('points used in the fits', 3, 7, 4, { step: 1, int: true });
        let seed = 5; v.button('Resample', () => { seed++; });
        const sc = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: '[A] (mM)', title: 'concentration: two fits to the same early data', weight: 1.15 });
        const sl = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: '1/[A] (1/mM)', title: 'second-order linearisation', weight: 1, minWidth: 260 });
        let info = null;
        v.render(() => {
          const real = src.value === 'real';
          kS.el.hidden = real; noise.el.hidden = real;
          let ts, cs;
          if (real) { ts = DATA.no2.t; cs = DATA.no2.c.slice(); }
          else { const k = kS.value, c0 = 0.01, g = noiser(v, seed * 17); ts = Array.from({ length: 7 }, (_, i) => i * 60); cs = ts.map((t) => c0 / (1 + k * c0 * t) * Math.exp(noise.value * g())); }
          const n = Math.min(nfit.value, ts.length), tf = ts.slice(0, n), cf = cs.slice(0, n);
          const f2 = fitSecond(v.M, tf, cf), f1 = fitFirst(v.M, tf, cf), c0 = cs[0], T = ts[ts.length - 1] * 1.6;
          const m2 = (t) => 1 / (1 / f2.c0 + f2.k * t), m1 = (t) => f1.c0 * Math.exp(-f1.k * t);
          const mM = 1e3;
          sc.setView([0, T], [0, c0 * mM * 1.1]);
          const th = 1 / (f2.k * f2.c0);
          for (let j = 1; j <= 3; j++) { const tj = th * (2 ** j - 1), cj = f2.c0 / 2 ** j; if (tj > T) break;
            sc.line(0, cj * mM, tj, cj * mM, { color: 'muted', width: 1.1, dash: [4, 4] }); sc.line(tj, cj * mM, tj, 0, { color: 'muted', width: 1.1, dash: [4, 4] });
            sc.text(`${j}`, tj, 0, { size: 10.5, color: 'muted', baseline: 'bottom', dy: -3, dx: 3 }); }
          sc.fn((t) => m1(t) * mM, { color: 'red', width: 2.2, domain: [0, T] });
          sc.fn((t) => m2(t) * mM, { color: 'green', width: 2.4, domain: [0, T] });
          sc.dots(ts.map((t, i) => [t, cs[i] * mM]), { r: 4.6, color: 'ink' });
          ts.forEach((t, i) => { if (i < n) sc.dot(t, cs[i] * mM, { r: 4.6, color: 'gold' }); });
          const inv = cs.map((c) => 1 / c / mM);
          sl.setView([0, T], [0, Math.max(...inv, 1 / m2(T) / mM) * 1.1]);
          sl.fn((t) => 1 / m2(t) / mM, { color: 'green', width: 2.4, domain: [0, T] });
          sl.fn((t) => 1 / m1(t) / mM, { color: 'red', width: 2, domain: [0, T] });
          sl.dots(ts.map((t, i) => [t, inv[i]]), { r: 4.6, color: 'ink' });
          ts.forEach((t, i) => { if (i < n) sl.dot(t, inv[i], { r: 4.6, color: 'gold' }); });
          const all2 = sse(ts, cs, m2), all1 = sse(ts, cs, m1);
          info = { k: f2.k, se: f2.se, th, k1: f1.k, r2: f2.r2, all2, all1, c0: f2.c0 };
        });
        v.legend([['green', 'second order fit ($1/[\\mathrm A]$ linear)'], ['red', 'first-order fit ($\\ln[\\mathrm A]$ linear)'], ['gold', 'points used in the fits', { dot: true }], ['muted', 'half-lives 1, 2, 4 …', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { k, se, th, k1, r2, all2, all1, c0 } = info;
          return `slope of $1/[\\mathrm A]$: $k=${v.fix(k * 1e-3 * 1e3, 3)}\\pm${v.fix(se, 3)}\\ \\mathrm{M^{-1}s^{-1}}$ ($R^2=${v.fix(r2, 4)}$) · $t_{1/2}=1/(k[\\mathrm A]_0)=${v.fix(th, 0)}$ s, then ${v.fix(2 * th, 0)} s, ${v.fix(4 * th, 0)} s …\nsum of squared residuals over **all** the data (mM²): second-order model $${v.sci(all2 * 1e6, 2)}$, first-order model $${v.sci(all1 * 1e6, 2)}$ — the wrong order extrapolates badly`;
        });
      },
    },
  ],
};
