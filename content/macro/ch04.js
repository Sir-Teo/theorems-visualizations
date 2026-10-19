// Macroeconomics — Chapter 4: Growth II: optimal saving, ideas and history (items 4.1–4.5; 4.6–4.9 are in ch04-b.js)
import { clamp, pc, fx, capitalSavingPath } from './ch04.shared.js';

/** Ramsey–Cass–Koopmans with f(k) = A k^a: steady state, golden rule, saddle-path table and trajectories by RK4 shooting. */
function rckModel(A, a, d, rho, th) {
  const f = (k) => A * k ** a, fp = (k) => a * A * k ** (a - 1);
  const ks = (a * A / (d + rho)) ** (1 / (1 - a)), kg = (a * A / d) ** (1 / (1 - a));
  const F = (k, c) => [f(k) - d * k - c, (c * (fp(k) - d - rho)) / th];
  /** Integrate from (k0, c0); stop when the verdict is clear: 'high' (k̇ turns the wrong way / k crosses k* the wrong way) or 'low'. */
  function traj(k0, c0, T = 160, dt = 0.25, keep = true) {
    const dir = k0 <= ks ? 1 : -1, pts = [[0, k0, c0]];
    let k = k0, c = c0, verdict = 'ok';
    for (let t = dt; t <= T + 1e-9; t += dt) {
      const k1 = F(k, c), k2 = F(k + 0.5 * dt * k1[0], c + 0.5 * dt * k1[1]), k3 = F(k + 0.5 * dt * k2[0], c + 0.5 * dt * k2[1]), k4 = F(k + dt * k3[0], c + dt * k3[1]);
      k += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); c += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      if (!(isFinite(k) && isFinite(c))) { if (verdict === 'ok') verdict = 'high'; break; }
      if (keep) pts.push([t, k, c]);
      if (k <= 1e-3 || c <= 1e-6 || c > 4 * f(kg)) { if (verdict === 'ok') verdict = k <= 1e-3 ? 'high' : 'low'; break; }
      if (verdict === 'ok') {
        const kd = f(k) - d * k - c;
        if (dir > 0) { if (k >= ks) verdict = 'low'; else if (kd < 0) verdict = 'high'; }
        else { if (k <= ks) verdict = 'high'; else if (kd > 0) verdict = 'low'; }
        if (verdict !== 'ok' && !keep) break;
      }
    }
    return { pts, verdict };
  }
  /** Saddle-path consumption c_s(k0) by bisection on the verdict. */
  function saddle(k0) {
    if (Math.abs(k0 - ks) < 1e-9 * ks) return f(ks) - d * ks;
    let lo = 0, hi = 2 * f(k0) + 1;
    for (let i = 0; i < 38; i++) { const m = (lo + hi) / 2; if (traj(k0, m, 260, 0.4, false).verdict === 'high') hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  return { f, fp, ks, kg, F, traj, saddle, cs: f(ks) - d * ks };
}

export default {
  collection: 'macro',
  chapter: 4,
  title: 'Growth II: optimal saving, ideas and history',
  summary: String.raw`Making saving a choice gives the Ramsey model of optimal growth and the Diamond model of overlapping generations, which can oversave. To explain long-run growth itself, endogenous-growth theory treats ideas as non-rival goods produced by research. Before 1800 the economy behaved in a Malthusian way, with technology raising population rather than living standards, and today’s income gaps reflect institutions as well as capital and ideas.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Model', name: 'Ramsey–Cass–Koopmans optimal growth',
      statement: String.raw`A representative household with infinite horizon chooses consumption $c(t)$ to maximise $\int_0^\infty e^{-\rho t}\,\frac{c^{1-\theta}}{1-\theta}\,dt$ subject to the resource constraint of the Solow economy,
$$\dot k = f(k) - \delta k - c .$$
The first-order condition is the consumption Euler equation $\dot c / c = \big(f'(k) - \delta - \rho\big)/\theta$. The system $(k, c)$ has a unique steady state $k^*$ with $f'(k^*) = \delta + \rho$, and it is a **saddle point**: for each $k_0$ exactly one initial consumption $c_0 = c_s(k_0)$ puts the economy on the **stable arm** that converges to $(k^*, c^*)$. Any higher $c_0$ exhausts the capital stock in finite time; any lower $c_0$ overshoots $k^*$ and ends with consumption falling toward zero, which violates the transversality condition. Because $\rho > 0$ the steady state lies *below* the Solow golden rule, $k^* < k_{\mathrm{gold}}$ where $f'(k_{\mathrm{gold}}) = \delta$.

Scope: a closed, one-good economy with no growth in technology or labour (adding them rescales the variables per effective worker), complete markets and a social planner or equivalent competitive equilibrium.`,
      idea: String.raw`The planner trades consumption today against more capital tomorrow; the Euler equation says consumption rises exactly when the marginal product of capital, net of depreciation, exceeds impatience $\rho$ (scaled by how much the household dislikes an uneven path, $\theta$). Along $\dot c = 0$ the marginal product is pinned down, so that locus is vertical at $k^*$; along $\dot k = 0$ consumption equals net output, a hump. Linearising at their intersection gives one stable and one unstable eigenvalue (a saddle), so convergence needs the jump variable $c$ to land on the stable arm. The two-period Euler equation of the Fisher problem reappears here in continuous time, and the capital dynamics are the Solow model with the saving rate now chosen.`,
      caption: String.raw`**Left:** the phase diagram in $(k, c)$. The red hump is $\dot k = 0$, the vertical gold line is $\dot c = 0$, arrows show the flow and the green curve is the saddle path (computed by shooting). Drag the **gold handle** to choose starting capital $k_0$ and consumption $c_0$; the trajectory turns green only if you sit on the saddle path. Tick *start on the saddle path* to let the household choose $c_0$ optimally. **Right:** $k(t)$ and $c(t)$ relative to their steady-state values. Raise $\rho$ and watch the steady state move left of the golden rule.`,
      deps: ['macro-3.2', 'macro-2.11'], refs: ['Romer ch. 2'], tags: ['growth', 'optimal control', 'saddle path'],
      verify: true, // Historical credit and textbook pointers await primary-source review.
      credit: 'Frank Ramsey, 1928; David Cass and Tjalling Koopmans, 1965',
      scope: String.raw`Closed economy, infinitely lived representative household, CRRA utility, no technological progress in the version drawn here.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ramsey%E2%80%93Cass%E2%80%93Koopmans_model' },
      viz(v) {
        const rhoS = v.slider('impatience $\\rho$', 0.005, 0.1, 0.03, { step: 0.001 });
        const thS = v.slider('curvature $\\theta$', 0.5, 5, 2, { step: 0.05 });
        const aS = v.slider('capital share $\\alpha$', 0.2, 0.5, 0.33, { step: 0.01 });
        const onS = v.toggle('start on the saddle path', false);
        const P = v.stage({ x: [0, 40], y: [0, 3], axes: 'box', gutter: true, height: 360, weight: 1.15, minWidth: 290, xlabel: 'capital per worker k', ylabel: 'consumption per worker c', title: 'phase diagram' });
        const T = v.stage({ x: [0, 120], y: [0, 2], axes: 'box', gutter: true, height: 360, weight: 0.85, minWidth: 250, xlabel: 'years', ylabel: 'relative to steady state', title: 'time paths from the handle' });
        const h = P.handle(5, 1, { color: 'gold', label: 'start', labelPos: 'se' });
        let M = null, key = '', tab = null, st = null, first = true;
        const A = 1, d = 0.05;
        v.button('snap to saddle path', () => { if (M && tab) h.set(h.x, M.saddle(h.x)); });
        v.render(() => {
          const rho = rhoS.value, th = thS.value, a = aS.value, k2 = `${rho}|${th}|${a}`;
          if (k2 !== key) {
            key = k2; M = rckModel(A, a, d, rho, th);
            const kmax = 2 * M.kg, N = 36; tab = [];
            for (let i = 0; i <= N; i++) { const k = Math.max(0.05 * M.ks, (kmax * i) / N); tab.push([k, M.saddle(k)]); }
            tab.sort((p, q) => p[0] - q[0]);
            if (first) { first = false; h.set(0.45 * M.ks, 1.1 * M.saddle(0.45 * M.ks)); }
          }
          const kmax = 2 * M.kg, cmax = 1.3 * (M.f(M.kg) - d * M.kg);
          P.setView([0, kmax], [0, cmax]);
          const csAt = (k) => { if (k <= tab[0][0]) return tab[0][1]; for (let i = 1; i < tab.length; i++) if (k <= tab[i][0]) { const f = (k - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]); return tab[i - 1][1] + f * (tab[i][1] - tab[i - 1][1]); } return tab[tab.length - 1][1]; };
          const k0 = clamp(h.x, 0.03 * kmax, 0.98 * kmax);
          const c0 = onS.value ? csAt(k0) : clamp(h.y, 0.02, cmax * 0.98);
          h.set(k0, c0);
          P.fn((k) => M.f(k) - d * k, { color: 'red', width: 2.4, domain: [0, Math.min(kmax, (A / d) ** (1 / (1 - a)))], n: 300 });
          P.vline(M.ks, { color: 'gold', width: 2.2 });
          P.vline(M.kg, { color: 'faint', dash: [4, 4] });
          P.path(tab.filter((p) => p[0] >= 0.05 * M.ks), { color: 'green', width: 2.8 });
          P.field((k, c) => { const [u, w] = M.F(k, c); const n1 = Math.hypot(u / kmax, w / cmax) || 1; return [(u / kmax) / n1, (w / cmax) / n1]; }, { spacing: 44, color: 'faint' });
          P.dot(M.ks, M.cs, { r: 6, color: 'gold' });
          P.text('k*', M.ks, 0, { dy: -10, dx: 4, align: 'left', color: 'gold', weight: 700, size: 12 });
          P.text('golden rule', M.kg, 0, { dy: -10, dx: 4, align: 'left', color: 'muted', size: 11 });
          P.text('k̇ = 0', 0.18 * kmax, M.f(0.18 * kmax) - d * 0.18 * kmax, { dy: -10, color: 'red', weight: 700, align: 'left' });
          P.text('ċ = 0', M.ks, cmax, { dx: 6, dy: 12, align: 'left', color: 'gold', weight: 700 });
          P.text('saddle path', 0.7 * M.ks, csAt(0.7 * M.ks), { dx: 8, dy: 16, align: 'left', color: 'green', weight: 700, size: 12 });
          let path, verdict;
          if (onS.value) {
            // drift-free: follow the 1-D flow on the saddle curve
            path = [[0, k0, c0]]; let k = k0; const dt = 0.5;
            for (let t = dt; t <= 160; t += dt) { const g1 = M.f(k) - d * k - csAt(k); k = Math.max(1e-3, k + dt * g1); path.push([t, k, csAt(k)]); }
            verdict = 'saddle';
          } else { const r = M.traj(k0, c0, 160, 0.25, true); path = r.pts; verdict = r.verdict; }
          const col = verdict === 'saddle' ? 'green' : verdict === 'ok' ? 'accent' : 'purple';
          P.path(path.map((p) => [p[1], p[2]]), { color: col, width: 2.4 });
          const sh = path.filter((p) => p[0] <= 120);
          const ymax = Math.max(1.5, ...sh.map((p) => Math.max(p[1] / M.ks, p[2] / M.cs)));
          T.setView([0, 120], [0, Math.min(ymax * 1.05, 4)]);
          T.hline(1, { color: 'faint', dash: [4, 4] });
          T.path(sh.map((p) => [p[0], p[1] / M.ks]), { color: 'orange', width: 2.4 });
          T.path(sh.map((p) => [p[0], p[2] / M.cs]), { color: 'accent', width: 2.4 });
          T.text('k / k*', 2, sh[0][1] / M.ks, { color: 'orange', weight: 700, size: 12, dy: 16, dx: 4, align: 'left' });
          T.text('c / c*', 2, sh[0][2] / M.cs, { color: 'accent', weight: 700, size: 12, dy: -10, dx: 4, align: 'left' });
          st = { verdict, k0, c0, cs: csAt(k0), end: path[path.length - 1] };
        });
        v.legend([['red', 'k̇ = 0'], ['gold', 'ċ = 0 (k*)'], ['green', 'saddle path'], ['purple', 'off the saddle path']]);
        v.readout(() => {
          if (!st) return '';
          const w = { saddle: 'On the stable arm: $c$ and $k$ converge to $(k^*, c^*)$.', high: 'Consumption too high: capital is run down to zero in finite time.', low: 'Consumption too low: capital overshoots $k^*$ and consumption heads for zero (transversality fails).', ok: 'Still approaching the steady state.' }[st.verdict];
          return `$k^* = ${fx(M.ks, 2)}$, $c^* = ${fx(M.cs, 2)}$; golden rule $k_{\\mathrm{gold}} = ${fx(M.kg, 2)}$ (${pc(M.ks / M.kg - 1, 0)} relative). At $k_0 = ${fx(st.k0, 2)}$ the optimal $c_0 = ${fx(st.cs, 3)}$; yours is ${fx(st.c0, 3)}. ${w}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Model', name: 'The Diamond overlapping-generations model',
      statement: String.raw`Each period a cohort of $1+n$ times the previous size is born. A young person supplies one unit of labour, earns the wage $w_t$, saves and consumes the savings with interest when old; with log utility $\ln c_1 + \beta \ln c_2$ the saving of the young is $s_t = \frac{\beta}{1+\beta}\,w_t$. With Cobb–Douglas production $y = k^{\alpha}$ and full depreciation of capital within a period, wages are $w = (1-\alpha)k^{\alpha}$ and the capital stock per young worker evolves by
$$k_{t+1} = \frac{\beta}{(1+\beta)(1+n)}\,(1-\alpha)\,k_t^{\alpha}.$$
This map has a unique positive fixed point $k^* = \big[\tfrac{\beta(1-\alpha)}{(1+\beta)(1+n)}\big]^{1/(1-\alpha)}$ that is globally stable. Competition need not deliver the best steady state: steady-state consumption per worker $k^\alpha - (1+n)k$ is largest at $k_{\mathrm{gold}} = (\alpha/(1+n))^{1/(1-\alpha)}$, and when $\frac{\beta(1-\alpha)}{1+\beta} > \alpha$ we have $k^* > k_{\mathrm{gold}}$: the economy is **dynamically inefficient** and could make everyone better off by saving less.

Scope: log utility, Cobb–Douglas technology and full depreciation (one period is a generation, about 30 years); the inefficiency condition depends on those functional forms.`,
      idea: String.raw`Young workers save out of wages for retirement, and the next generation's capital equals what they saved. The saving map is increasing and concave with $k_{t+1}(0)=0$ and infinite slope there, so iterating it converges monotonically to its single fixed point, as in the Solow model. The difference from Solow is that nobody chooses the *aggregate* saving rate for the good of the dynasty: each household saves for its own retirement, so the fixed point has no reason to sit at or below the golden rule. When it lies above it, the dynamic-inefficiency result of Solow's model holds in a genuine competitive equilibrium, and a pay-as-you-go pension or government debt that crowds out capital would be a Pareto improvement.`,
      caption: String.raw`**Left:** the saving map $k_{t+1}(k_t)$ (blue) against the 45° line, with the cobweb from the **gold handle** $k_0$ for the number of generations you choose. **Right:** steady-state consumption per worker as a function of $k$; the fixed point is green when it lies below the golden rule and red when beyond it. Raise $\beta$ (patience over a generation) or lower $\alpha$ until the dot slips past the peak. With a 30-year period, $\beta$ near 1 means little impatience over a lifetime.`,
      deps: ['macro-3.5', 'macro-2.10'], refs: ['Romer ch. 2'], tags: ['growth', 'overlapping generations', 'dynamic inefficiency'],
      verify: true, // Historical credit and textbook pointers await primary-source review.
      credit: 'Peter Diamond, 1965 (after Samuelson, 1958)',
      scope: String.raw`Log utility, Cobb–Douglas production, full depreciation, two-period-lived households (young, then old); no bequests.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Overlapping_generations_model' },
      viz(v) {
        const aS = v.slider('capital share $\\alpha$', 0.1, 0.6, 0.25, { step: 0.005 });
        const bS = v.slider('patience $\\beta$ (per generation)', 0.2, 3, 0.9, { step: 0.01 });
        const nS = v.slider('population growth $n$ (per generation)', 0, 0.8, 0.2, { step: 0.01 });
        const gS = v.slider('generations shown', 2, 30, 12, { step: 1, int: true });
        const P = v.stage({ x: [0, 0.2], y: [0, 0.2], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'capital per worker  kₜ', ylabel: 'kₜ₊₁', title: 'the saving map and its cobweb' });
        const C = v.stage({ x: [0, 0.4], y: [0, 0.4], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'capital per worker k', ylabel: 'steady-state consumption per worker', title: 'what a steady state delivers' });
        const h = P.handle(0.02, 0, { color: 'gold', label: 'k₀', labelPos: 'n', constrain: (x) => [Math.max(0.0005, x), 0] });
        let st = null;
        v.render(() => {
          const a = aS.value, b = bS.value, n = nS.value, g = gS.value;
          const sv = (b * (1 - a)) / ((1 + b) * (1 + n)), map = (k) => sv * k ** a;
          const ks = sv ** (1 / (1 - a)), kg = (a / (1 + n)) ** (1 / (1 - a)), kmax = 2 * Math.max(ks, kg);
          P.setView([0, kmax], [0, kmax]);
          P.fn(map, { color: 'accent', width: 2.6, domain: [0, kmax], n: 300 });
          P.line(0, 0, kmax, kmax, { color: 'ink', width: 1.2, dash: [5, 4] });
          const k0 = clamp(h.x, 0.01 * kmax, 0.98 * kmax); h.set(k0, 0);
          let k = k0; const pts = [[k0, 0]];
          for (let i = 0; i < g; i++) { const kn = map(k); pts.push([k, kn], [kn, kn]); k = kn; }
          P.path(pts, { color: 'gold', width: 1.6 });
          P.dot(ks, ks, { r: 6, color: ks > kg ? 'red' : 'green' });
          P.vline(kg, { color: 'faint', dash: [3, 3] });
          P.text('k*', ks, ks, { dx: 8, dy: 14, align: 'left', color: ks > kg ? 'red' : 'green', weight: 700, size: 12 });
          P.text('golden rule', kg, 0, { dx: 4, dy: -10, align: 'left', color: 'muted', size: 11 });
          const cf = (x) => x ** a - (1 + n) * x, cg = cf(kg), kz = (1 + n) ** (-1 / (1 - a));
          C.setView([0, 1.05 * kz], [0, cg * 1.25]);
          C.fn(cf, { color: 'accent', width: 2.6, domain: [0, kz] });
          C.vline(kg, { color: 'muted', dash: [4, 4] });
          C.dot(kg, cg, { r: 5, color: 'gold' });
          C.dot(ks, Math.max(cf(ks), 0), { r: 6, color: ks > kg ? 'red' : 'green' });
          C.text('golden rule', kg, cg, { dy: -12, color: 'gold', weight: 700, align: 'center', size: 12 });
          C.text('competitive k*', ks, Math.max(cf(ks), 0), { dy: ks > kg ? 18 : 16, dx: ks > kg ? 6 : -6, align: ks > kg ? 'left' : 'right', color: ks > kg ? 'red' : 'green', weight: 700, size: 12 });
          st = { ks, kg, c: cf(ks), cg, k };
        });
        v.legend([['accent', 'saving map'], ['gold', 'cobweb path'], ['green', 'efficient steady state', { dot: true }], ['red', 'dynamically inefficient', { dot: true }]]);
        v.readout(() => st && `fixed point $k^* = ${fx(st.ks, 4)}$ vs golden rule $k_{\\mathrm{gold}} = ${fx(st.kg, 4)}$: ${st.ks > st.kg ? '**oversaving** (' + pc(st.c / st.cg - 1, 0) + ' consumption relative to the golden rule)' : 'efficient (' + pc(st.c / st.cg, 0) + ' of golden-rule consumption)'}. After ${gS.value} generations $k = ${fx(st.k, 4)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Model', name: 'The AK model',
      statement: String.raw`Let output depend linearly on the broad capital stock, $Y = AK$ (equivalently, per worker $y = Ak$): the reproducible factor may include physical, human or knowledge capital. Constant aggregate returns can be assumed directly or arise through an accumulation externality. With a constant saving rate $s$, depreciation $\delta$ and population growth $n$,
$$\dot k = sAk - (n+\delta)k, \qquad \frac{\dot k}{k} = \frac{\dot y}{y} = sA - n - \delta .$$
If $sA > n+\delta$ the economy grows forever at the constant rate $\gamma = sA - n - \delta$, there is no transition in this constant-saving model, and countries with identical parameters retain their initial proportional income differences, and **the saving rate permanently changes the long-run growth rate**. With $y = Ak^{\alpha}$ and $\alpha < 1$ the same economy returns to a steady state with zero growth per capita.

Scope: the model asserts constant returns to the reproducible factor; it is a deliberate caricature, ordinary physical capital alone need not satisfy this assumption.`,
      idea: String.raw`In the Solow model the investment curve $s f(k)$ is concave and crosses the straight break-even line $(n+\delta)k$ once, which makes growth die out. If $f$ is linear the saving curve is a straight line that is steeper than the break-even line, so it never crosses: capital per worker grows at the constant rate $sA-n-\delta$. Dividing by $k$ shows the same thing as a horizontal comparison: the "return per unit of capital" $sf(k)/k$ no longer falls with $k$. Growth is then a choice variable (through $s$) and a level difference at the start is never closed. The cost of this tidy answer is the strong assumption that returns to accumulation do not diminish.`,
      caption: String.raw`**Left:** saving per unit of capital $s f(k)/k$ (green) against the break-even rate $n+\delta$ (red). Slide **$\alpha$** from $0.5$ to $1$: for $\alpha<1$ they cross at the steady state (possibly outside the visible range). At $\alpha=1$ the lines are horizontal: capital grows, stays constant or shrinks according to the sign of $sA-n-\delta$. **Right:** $\ln k(t)$ when the saving rate changes from $s$ to $s'$ in year 50. For $\alpha = 1$ the slope of the line changes for ever; for $\alpha<1$ the level moves but the long-run growth rate stays at zero.`,
      deps: ['macro-3.2'], refs: ['Rebelo (1991), JPE 99(3):500–521; https://doi.org/10.1086/261764', 'Frankel (1962), AER 52(5):996–1022; https://www.scribd.com/document/78724522/Frankel-1962-the-Production-Function-in-Allocation-and-Growth'], tags: ['growth', 'endogenous growth', 'constant returns'],
      credit: 'Marvin Frankel, 1962; Sergio Rebelo, 1991',
      scope: String.raw`Needs constant returns to the reproducible factors (broad capital), exogenous constant saving within each regime; $sA>n+\delta$ is required for positive growth, not for the model to be defined.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/AK_model' },
      viz(v) {
        const aS = v.slider('returns to capital $\\alpha$', 0.5, 1, 1, { step: 0.01 });
        const s1 = v.slider('saving rate $s$', 0.05, 0.4, 0.2, { step: 0.005 });
        const s2 = v.slider("saving rate after year 50, $s'$", 0.05, 0.4, 0.3, { step: 0.005 });
        const nd = v.slider('$n+\\delta$', 0.02, 0.12, 0.06, { step: 0.002 });
        const L = v.stage({ x: [0.5, 30], y: [0, 0.2], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'capital per worker k (log scale)', ylabel: 'rate per unit of capital', title: 's f(k)/k  against  n + δ' });
        const R = v.stage({ x: [0, 150], y: [0, 6], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'years', ylabel: 'ln k(t) − ln k(0)', title: 'effect of a permanent saving change' });
        const A = 0.35;
        let st = null;
        v.render(() => {
          const a = aS.value, sa = s1.value, sb = s2.value, d = nd.value;
          const r1 = (k) => (sa * A) * k ** (a - 1), r2 = (k) => (sb * A) * k ** (a - 1);
          L.setView([0.5, 30], [0, Math.max(0.05, r2(0.5) * 1.15, r1(0.5) * 1.15, d * 1.4)]);
          L.fn(r1, { color: 'green', width: 2.6, domain: [0.5, 30], n: 200 });
          L.fn(r2, { color: 'teal', width: 2.4, domain: [0.5, 30], n: 200, dash: [6, 4] });
          L.hline(d, { color: 'red', width: 2.4 });
          L.text('n + δ', 20, d, { dy: -10, color: 'red', weight: 700, size: 12 });
          L.text('s f(k)/k', 1.0, r1(1.0), { dx: 8, dy: -12, align: 'left', color: 'green', weight: 700, size: 12 });
          L.text("s' f(k)/k", 1.0, r2(1.0), { dx: 8, dy: -12, align: 'left', color: 'teal', weight: 700, size: 12 });
          const base = capitalSavingPath(a, A, d, sa, sa), chg = capitalSavingPath(a, A, d, sa, sb);
          const ys = [...base, ...chg].map(p => p[1]);
          R.setView([0, 150], [Math.min(0, ...ys) - .1, Math.max(1, ...ys) + .1]);
          R.vline(50, { color: 'faint', dash: [4, 4] });
          R.path(base, { color: 'green', width: 2.2, dash: [6, 4] });
          R.path(chg, { color: 'teal', width: 2.8 });
          const slope = (arr, t0, t1) => (arr.find((p) => p[0] >= t1)[1] - arr.find((p) => p[0] >= t0)[1]) / (t1 - t0);
          st = { g0: slope(chg, 30, 50), g1: slope(chg, 130, 150), ak: a === 1, gAK: sa * A - d, gAK2: sb * A - d };
        });
        v.legend([['green', 'saving rate s'], ['teal', "after the change to s'"]]);
        v.readout(() => st && (st.ak ? `**AK** ($\\alpha=1$): growth rate of $k$ and $y$ is $sA-n-\\delta = ${pc(st.gAK)}$ before year 50 and $s'A-n-\\delta = ${pc(st.gAK2)}$ afterwards: measured slopes ${pc(st.g0)} and ${pc(st.g1)}.` : `$\\alpha<1$: diminishing returns. Growth rate of $k$ measured before year 50: ${pc(st.g0)}, in years 130–150: ${pc(st.g1)}; it dies out and only the level changes.`) + ` (Productivity $A=0.35$ fixed.)`);
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Model', name: 'Romer’s endogenous growth: non-rival ideas',
      statement: String.raw`Output is produced from ideas $A$ and the labour $L_Y$ used to make goods, $Y = A L_Y$, while ideas are produced by researchers, $\dot A = \bar\delta\,L_A A$, with $L_A + L_Y = L$ and a constant research share $s_R = L_A/L$. Ideas are **non-rival**: one more user does not use up the idea, so all of $A$ is available to every researcher and every producer, which is what makes the production function for ideas linear in $A$. Then ideas, and output per worker $y = (1-s_R)A$, grow at the constant rate
$$g = \frac{\dot A}{A} = \bar\delta\,s_R\,L .$$
A larger research share raises the growth rate permanently, while a larger population $L$ raises it too (a *scale effect*). A higher $s_R$ lowers output per worker at once, because fewer people produce goods, but beyond a crossing date income is higher for ever.

Scope: a deliberately simple version of Romer (1990) without monopolistic competition for intermediates; the knife-edge assumption is that output of new ideas per researcher is proportional to the existing stock $A$ (its exponent is exactly 1), so research productivity measured as proportional growth per researcher stays constant.`,
      idea: String.raw`Capital accumulation stalls because its returns diminish; ideas do not stall, because each new idea raises the productivity of every future researcher. If a research worker's output is proportional to $A$, then $\dot A/A$ is proportional to the number of researchers, which is a level that policy or population can raise. That turns the exogenous technology growth of Solow's model into the output of a sector, and the Solow residual of the growth-accounting exercise into something that has a price and an input. The balanced path is the AK model, with the stock of ideas playing the role of the broad capital stock.`,
      caption: String.raw`**Right:** the growth rate $g(s_R) = \bar\delta s_R L$ as a straight line; drag the **gold handle** to move the research share from the baseline $s_R = 0.05$ to a new value, and raise $L$ to see the dashed scale-effect line move up. **Left:** $\ln y(t)$ under the baseline and the new research share: income starts lower (fewer producers) but the steeper path overtakes at the crossing date marked in gold.`,
      deps: ['macro-4.3'], refs: ['Romer ch. 3', 'P. Romer (1990), Endogenous Technological Change; https://www.nber.org/papers/w3210'], tags: ['growth', 'ideas', 'non-rivalry'],
      credit: 'Paul Romer, 1990 (Journal of Political Economy 98(5), S71–S102)',
      scope: String.raw`New ideas per researcher proportional to the stock of ideas (linear in $A$); the coefficient of proportionality is constant. Semi-endogenous variants (4.5) relax this.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Endogenous_growth_theory' },
      viz(v) {
        const LS = v.slider('population (research scale) $L$', 1, 4, 1, { step: 0.05 });
        const dS = v.slider('research productivity $\\bar\\delta$', 0.2, 0.8, 0.4, { step: 0.01 });
        const R = v.stage({ x: [0, 0.2], y: [0, 0.12], axes: 'box', gutter: true, height: 330, weight: 0.95, minWidth: 250, xlabel: 'research share  s_R', ylabel: 'growth rate g', title: 'the growth rate is set by research effort' });
        const Lf = v.stage({ x: [0, 100], y: [0, 4], axes: 'box', gutter: true, height: 330, weight: 1.05, minWidth: 270, xlabel: 'years', ylabel: 'ln y(t) (output per worker, log scale)', title: 'income paths' });
        const s0 = 0.05, h = R.handle(0.12, 0, { color: 'gold', label: 'new s_R', labelPos: 'n', constrain: (x) => [clamp(x, 0.006, 0.19), 0] });
        let st = null;
        v.render(() => {
          const L = LS.value, dl = dS.value, g = (s) => dl * s * L, s1 = clamp(h.x, 0.006, 0.19);
          h.set(s1, 0);
          R.setView([0, 0.2], [0, Math.max(0.1, dl * 0.2 * L * 1.05)]);
          R.fn(g, { color: 'accent', width: 2.6, domain: [0, 0.2] });
          R.fn((s) => dl * s * 2 * L, { color: 'muted', width: 1.6, dash: [5, 4], domain: [0, 0.2] });
          R.text('population × 2', 0.2, dl * 0.2 * 2 * L, { dx: -4, dy: 14, align: 'right', color: 'muted', size: 11 });
          R.vline(s0, { color: 'faint', dash: [4, 4] });
          R.dot(s0, g(s0), { r: 5, color: 'ink' }); R.text('baseline', s0, g(s0), { dx: 8, dy: 14, align: 'left', color: 'ink', size: 11 });
          R.dot(s1, g(s1), { r: 6, color: 'gold' });
          R.hline(g(s1), { color: 'gold', alpha: 0.35, dash: [3, 3] });
          const g0 = g(s0), g1 = g(s1), lv0 = Math.log(1 - s0), lv1 = Math.log(1 - s1), tc = g1 > g0 ? (lv0 - lv1) / (g1 - g0) : Infinity;
          const y0 = (t) => lv0 + g0 * t, y1 = (t) => lv1 + g1 * t;
          Lf.setView([0, 100], [Math.min(-0.2, lv1 - 0.1), Math.max(0.5, y0(100), y1(100)) * 1.05]);
          Lf.path([[0, y0(0)], [100, y0(100)]], { color: 'ink', width: 2.2 });
          Lf.path([[0, y1(0)], [100, y1(100)]], { color: 'accent', width: 2.8 });
          if (isFinite(tc) && tc > 0 && tc < 100) { Lf.vline(tc, { color: 'gold', dash: [4, 4] }); Lf.dot(tc, y0(tc), { r: 6, color: 'gold' }); Lf.text('crossing', tc, y0(tc), { dx: 10, dy: 20, align: 'left', color: 'gold', weight: 700, size: 12 }); }
          Lf.text('baseline s_R = 0.05', 98, y0(98), { dy: 16, color: 'ink', align: 'right', weight: 700, size: 12 });
          Lf.text('new s_R', 98, y1(98), { dy: -10, color: 'accent', align: 'right', weight: 700, size: 12 });
          st = { g0, g1, tc, L, s1, drop: 1 - (1 - s1) / (1 - s0) };
        });
        v.legend([['ink', 'baseline research share'], ['accent', 'new research share'], ['gold', 'crossing date', { dot: true }]]);
        v.readout(() => st && `Growth $g = \\bar\\delta s_R L$: ${pc(st.g0)} at the baseline, ${pc(st.g1)} at $s_R = ${fx(st.s1, 3)}$ (permanent). Income per worker starts ${pc(Math.abs(st.drop))} ${st.drop >= 0 ? 'lower' : 'higher'} and the paths ${isFinite(st.tc) && st.tc > 0 ? 'cross after ' + fx(st.tc, 1) + ' years' : 'never cross'}. Doubling $L$ doubles $g$ (scale effect; see 4.5). Illustrative units.`);
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Concept', name: 'Scale effects and the Jones critique',
      statement: String.raw`In Romer's model the growth rate $g = \bar\delta s_R L$ rises in proportion to the population: more researchers means faster growth *for ever*. But the number of researchers in the U.S. and other rich economies has risen many-fold since the 1950s while trend growth in output per person has been flat or lower. Charles Jones (1995) resolved the conflict by weakening the idea production function to
$$\dot A = \bar\delta\,L_A^{\lambda}\,A^{\phi}, \qquad \phi < 1 \;(\text{ideas get harder to find}),$$
the **semi-endogenous** model. Its balanced growth rate is $g_A^* = \dfrac{\lambda\,n}{1-\phi}$, where $n$ is the growth rate of research effort; it depends on the *growth* of the population, not its level or the research share, so permanent policy changes shift levels but not long-run growth. Bloom, Jones, Van Reenen and Webb (2020) report that U.S. effective research effort rose by a factor of about 23 between the 1930s and 2014 while research productivity fell by a factor of about 41.

Scope: a stylised calibration, not an estimate; with $\phi<1$ positive balanced growth requires sustained growth of research effort; if research effort eventually stops growing, the long-run growth rate tends to zero.`,
      idea: String.raw`Differentiate the idea production function: $g_A = \bar\delta L_A^\lambda A^{\phi-1}$. If $\phi=1$ the growth rate follows $L_A$ and explodes with it; if $\phi<1$ the term $A^{\phi-1}$ shrinks as ideas accumulate, so the growth rate settles where $\lambda\dot L_A/L_A = (1-\phi)\,g_A$. The empirical content is the *decomposition* of the data into research input and research output: growth = effort × productivity, so with effort up ×23 and growth roughly constant, productivity per researcher had to fall by about the same factor (the paper reports ×41, because growth itself also slowed a little, by a factor of $23/41\approx 0.56$).`,
      caption: String.raw`**Left (log scale):** the growth rate of ideas implied by the idea production function with research effort rising $23$-fold in 84 years. The red line is Romer ($\phi=1$): growth explodes with the number of researchers. The blue line uses the $\phi$ you choose; lower $\phi$ flattens it, and the dashed line is its balanced-growth rate $\lambda n/(1-\phi)$. **Right:** research productivity $g_A/L_A$ relative to year 0; the gold mark is the empirical fall of Bloom et al. Reduce $\phi$ until the blue growth curve is flat, then read off what productivity decline that needs.`,
      deps: ['macro-4.4'], refs: ['Romer ch. 3', 'Bloom et al. (2020), p. 1110, Fig. 2; https://web.stanford.edu/~chadj/IdeaPF.pdf'], tags: ['growth', 'ideas', 'semi-endogenous growth'],
      credit: 'Charles Jones, 1995 (Journal of Political Economy 103(4), 759–784); Bloom, Jones, Van Reenen & Webb, 2020 (American Economic Review 110(4), 1104–1144)',
      scope: String.raw`Aggregate U.S. data 1930–2014 in Bloom et al.; the simulation here is an illustration with $g(0)=2\%$ chosen for display, not their series.`,
      links: { doi: 'https://doi.org/10.1257/aer.20180338' },
      viz(v) {
        const pS = v.slider('ideas exponent $\\phi$', -2, 1, -0.9, { step: 0.01 });
        const lS = v.slider('researcher exponent $\\lambda$', 0.3, 1, 1, { step: 0.01 });
        const nS = v.slider('growth of research effort $n$', 0, 0.05, Math.log(23) / 84, { step: 0.0005 });
        const G = v.stage({ x: [0, 84], y: [0.004, 1], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'years since the start', ylabel: 'growth rate of ideas  g_A (log scale)', title: 'what the idea production function predicts' });
        const Q = v.stage({ x: [0, 84], y: [0.01, 10], ylog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'years since the start', ylabel: 'research productivity (index, start = 1)', title: 'output of ideas per unit of research effort' });
        const g0 = 0.02;
        let st = null;
        v.render(() => {
          const phi = pS.value, lam = lS.value, n = nS.value;
          const run = (ph) => {
            const out = []; let lnA = 0; const dt = 0.1;
            for (let t = 0; t <= 84 + 1e-9; t += dt) {
              const g = g0 * Math.exp(lam * n * t + (ph - 1) * lnA);
              out.push([t, Math.min(g, 50)]); lnA += g * dt;
              if (lnA > 50) break;
            }
            return out;
          };
          const romer = run(1), mine = run(phi);
          const fl = (arr) => arr.filter((p) => p[1] > 0.004 && p[1] < 1);
          G.path(fl(romer), { color: 'red', width: 2.6 });
          G.path(fl(mine), { color: 'accent', width: 2.8 });
          if (phi < 1 && n > 0) { const gs = (lam * n) / (1 - phi); if (gs > 0.004 && gs < 1) { G.hline(gs, { color: 'accent', dash: [5, 4], alpha: 0.7 }); } }
          G.hline(g0, { color: 'faint', dash: [3, 3] });
          G.text('Romer (φ = 1)', 2, 0.55, { color: 'red', weight: 700, align: 'left', size: 12 });
          G.text('your φ', 2, 0.28, { color: 'accent', weight: 700, align: 'left', size: 12 });
          const prod = (arr) => arr.map((p) => [p[0], p[1] / g0 / Math.exp(n * p[0])]);
          Q.path(prod(romer).filter((p) => p[1] > 0.01 && p[1] < 10), { color: 'red', width: 2.2 });
          Q.path(prod(mine).filter((p) => p[1] > 0.01 && p[1] < 10), { color: 'accent', width: 2.8 });
          Q.hline(1, { color: 'faint', dash: [3, 3] });
          Q.dot(84, 1 / 41, { r: 6, color: 'gold' });
          Q.text('empirical ×1/41 (BJVW)', 82, 1 / 41, { dy: -12, align: 'right', color: 'gold', weight: 700, size: 12 });
          const last = mine[mine.length - 1];
          st = { effort: Math.exp(n * 84), gEnd: last[1], gRatio: last[1] / g0, prod: last[1] / g0 / Math.exp(n * last[0]), phi, lam, n };
        });
        v.legend([['red', 'Romer, φ = 1'], ['accent', 'semi-endogenous, your φ'], ['gold', 'Bloom et al. research productivity', { dot: true }]]);
        v.readout(() => st && `Research effort grows ×${fx(st.effort, 1)} (the paper's factor is 23). With your $\\phi=${fx(st.phi, 2)}$: growth at the end is ${pc(st.gEnd)} (×${fx(st.gRatio, 2)} of its start), research productivity ×${fx(st.prod, 3)} (data: ×${fx(1 / 41, 3)}); balanced-growth rate $\\lambda n/(1-\\phi) = ${pc(st.phi < 1 ? (st.lam * st.n) / (1 - st.phi) : NaN)}$. Romer's $\\phi=1$ predicts growth × ${fx(Math.exp(st.lam * st.n * 84), 1)}.`);
      },
    },
  ],
};
