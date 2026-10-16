// Macroeconomics — Chapter 4 (part b): the Malthusian economy and its escape, human-capital Solow and institutions (items 4.6–4.9)
import { clamp, pc, fx, ols, olsMulti, rows, XS_PWT, AJR_DATA, iv1 } from './ch04.shared.js';

const XS = rows(XS_PWT.flat(), 10); // code, name, y60, y19, s, n, hc60, hc19, oecd, irr
const AJR = AJR_DATA.split(' ').map((r) => { const f = r.split(','); return { code: f[0], x: +f[1], y: +f[2], z: +f[3], g: +f[4] }; });
const GROUP = ['other (mostly Latin America, Caribbean)', 'Africa', 'Asia', 'neo-Europes (AUS, CAN, NZL, USA)'];
const GCOL = ['accent', 'orange', 'teal', 'green'];

/** Malthusian economy: y = A T^{1-a} N^{a-1} (T = 1), subsistence 1, dlnN/dt = eta ln y, clipped. Returns [[t, N, y, lnA]]. */
function malthus(a, eta, boost, gA, T = 1500) {
  const out = []; let lnN = 0;
  for (let t = 0; t <= T; t++) {
    const lnA = (t > 300 ? Math.log(boost) : 0) + gA * t, lny = lnA - (1 - a) * lnN;
    out.push([t, Math.exp(lnN), Math.exp(lny), lnA]);
    lnN += clamp(eta * lny, -0.02, 0.02);
  }
  return out;
}

export default {
  collection: 'macro',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Model', name: 'The Malthusian economy',
      statement: String.raw`Output is produced from a fixed amount of land $T$ and labour $N$ with technology $A$: $Y = A\,T^{1-\alpha}N^{\alpha}$, so income per head is $y = A\,(T/N)^{1-\alpha}$, falling in population. Population responds to living standards: births exceed deaths when $y$ is above a **subsistence level** $\bar y$ and fall short when it is below, for example $\dot N/N = \eta\,\ln(y/\bar y)$. The only steady state has $y = \bar y$, with population
$$N^* = T\,\Big(\frac{A}{\bar y}\Big)^{1/(1-\alpha)} .$$
A permanent rise in $A$ therefore raises **population, not living standards**: income per head jumps up, then is pushed back to $\bar y$ as population grows by the factor $(A'/A)^{1/(1-\alpha)}$. If technology grows at a constant rate $g$, population grows at $g/(1-\alpha)$ and income per head stays at $\bar y$.

Scope: a stylised pre-industrial economy with fixed land and a fertility/mortality response to income; it is a model for the long Malthusian epoch, not a description of any one country.`,
      idea: String.raw`Diminishing returns to labour on fixed land mean that more people lower the average product, so the income curve slopes down in $N$; the demographic response slopes the other way, making population rise when income is above subsistence. The two forces meet at one point, and the dynamics are those of a stable one-dimensional system, as in the Solow model with land in place of capital. A technology shock shifts the curve up; the economy slides back down the new curve to the same income level and a larger population. The model reproduces the broad pattern of the world before about 1800: technologically more advanced societies were denser, but not much richer.`,
      caption: String.raw`**Left (log population axis):** income per head against population. The dashed curve is the economy before the technology jump, the solid curve after it; the red line is subsistence, and the gold dot moves along the path (play/pause). **Right:** the same history against time. Raise the jump or the land share $1-\alpha$ and see how large the population gain is; add a small steady technological progress $g$ and income stays at subsistence while population grows without limit. Illustrative parameters, not data.`,
      deps: ['demo-7.1', 'macro-2.1'], refs: ['CORE The Economy 1.0 U2'], tags: ['growth', 'Malthus', 'population'],
      credit: 'Thomas Malthus, 1798 (An Essay on the Principle of Population)',
      scope: String.raw`Fixed land, population responding to income through births and deaths, technology that does not itself depend on population (that link is added in 4.7).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Malthusian_trap' },
      viz(v) {
        const aS = v.slider('labour share $\\alpha$', 0.5, 0.9, 0.7, { step: 0.01 });
        const eS = v.slider('population response $\\eta$', 0.003, 0.03, 0.01, { step: 0.001 });
        const bS = v.slider('technology jump in year 300 (×)', 1, 3, 1.8, { step: 0.05 });
        const gS = v.slider('steady technical progress $g$ (per year)', 0, 0.002, 0, { step: 0.00005, decimals: 5 });
        const D = v.stage({ x: [0.5, 100], y: [0.5, 2.4], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'population N (relative to start, log scale)', ylabel: 'income per head (subsistence = 1)', title: 'the Malthusian diagram' });
        const R = v.stage({ x: [0, 1500], y: [0.5, 100], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'years', ylabel: 'relative to the start (log scale)', title: 'history' });
        let st = null;
        v.animate((t) => {
          const a = aS.value, eta = eS.value, b = bS.value, g = gS.value, path = malthus(a, eta, b, g);
          const tau = Math.min(1500, (t / 11) * 1500), cur = path[Math.round(tau)];
          const Nmax = Math.max(...path.map((p) => p[1])), Ymax = Math.max(...path.map((p) => p[2]));
          D.setView([0.5, Math.max(10, Nmax * 1.5)], [0.4, Math.max(2, Ymax * 1.1)]);
          const lim = Math.max(10, Nmax * 1.5);
          D.hline(1, { color: 'red', width: 2.2 });
          D.text('subsistence', 1.7, 1, { dy: -10, align: 'left', color: 'red', weight: 700, size: 12 });
          D.fn((N) => N ** (a - 1), { color: 'ink', dash: [5, 4], width: 2, domain: [0.5, lim], n: 200 });
          if (b > 1.001) D.fn((N) => b * N ** (a - 1), { color: 'accent', width: 2.6, domain: [0.5, lim], n: 200 });
          D.path(path.filter((p, i) => i % 5 === 0).map((p) => [p[1], p[2]]), { color: 'purple', width: 2.2 });
          D.dot(cur[1], cur[2], { r: 7, color: 'gold' });
          const Nstar = b ** (1 / (1 - a));
          if (g === 0) { D.dot(1, 1, { r: 5, color: 'ink' }); D.dot(Nstar, 1, { r: 6, color: 'green' }); D.text('N* after', Nstar, 1, { dy: 16, align: 'center', color: 'green', weight: 700, size: 12 }); }
          R.setView([0, 1500], [0.5, Math.max(30, Nmax * 1.3, Ymax * 1.3)]);
          R.vline(300, { color: 'faint', dash: [4, 4] });
          R.hline(1, { color: 'red', alpha: 0.5, dash: [4, 4] });
          R.path(path.map((p) => [p[0], p[2]]), { color: 'orange', width: 2.6 });
          R.path(path.map((p) => [p[0], p[1]]), { color: 'accent', width: 2.6 });
          R.vline(tau, { color: 'gold', width: 1.6 });
          R.text('population', 1480, path[1500][1], { dy: -10, align: 'right', color: 'accent', weight: 700, size: 12 });
          R.text('income per head', 1480, path[1500][2], { dy: 16, align: 'right', color: 'orange', weight: 700, size: 12 });
          st = { N: cur[1], y: cur[2], tau, Nstar, g, a, b, Nend: path[1500][1], yend: path[1500][2] };
        }, { period: 14, still: 11 });
        v.legend([['accent', 'population'], ['orange', 'income per head'], ['red', 'subsistence'], ['purple', 'path in the diagram']]);
        v.readout(() => st && `Year ${fx(st.tau, 0)}: population ×${fx(st.N, 2)}, income per head ${fx(st.y, 2)}× subsistence. ${st.g === 0 ? `A technology jump of ×${fx(st.b, 2)} raises the long-run population by ×$${fx(st.b, 2)}^{1/(1-\\alpha)}$ = ×${fx(st.Nstar, 2)} and leaves income per head at subsistence.` : `With steady progress $g$, population grows at $g/(1-\\alpha) = ${pc(st.g / (1 - st.a), 3)}$ a year and income stays near subsistence (${fx(st.yend, 2)}× in year 1500).`}`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Concept', name: 'Escaping the Malthusian trap',
      statement: String.raw`Let technology advance at a rate $g_A$ and let population growth be capped at a biological maximum $n_{\max}$. In the Malthusian economy of 4.6, income per head is $y \propto A\,N^{-(1-\alpha)}$, so
$$\frac{\dot y}{y} = g_A - (1-\alpha)\,\frac{\dot N}{N}.$$
While $g_A < (1-\alpha)\,n_{\max}$ population can absorb all of the progress and income per head returns to subsistence. If $g_A$ rises above $(1-\alpha)\,n_{\max}$, however (for instance because a larger population means more ideas, as in Romer's model), population cannot keep pace and income per head takes off. A **demographic transition**, in which fertility falls once income is high, then removes the drag of population growth, so that income grows at the full rate $g_A$: the *hockey stick* of world income (1.10).

Scope: a stylised reduced form in the spirit of Galor and Weil (2000) and Kremer (1993); the parameters are chosen for illustration, not estimated.`,
      idea: String.raw`The escape needs two ingredients. First, the rate of technological progress must itself rise with the size of the world, since more people create more ideas (the non-rivalry of 4.4), so the growth rate of $A$ is not constant but accelerates. Second, population growth must hit a ceiling, because the biological response to income is bounded. The race between $g_A$ and $(1-\alpha)\dot N/N$ decides the outcome; once $g_A$ wins, income rises, and in the second stage lower fertility at high income (the transition) shifts the effort from quantity to quality of children and lets the gains stay in income per head. Ashraf and Galor (2011) find cross-country evidence for the Malthusian regime, in which technology raises density rather than income, in the pre-1500 data.`,
      caption: String.raw`**Left (log scale):** income per head over 1,600 simulated years; red is subsistence. **Right:** the race: progress $g_A$ (green) against the drag $(1-\alpha)\dot N/N$ (orange). The gold marker moves with time. Lower *spillovers* $\nu$ or the technology scale $g_0$ and the economy stays trapped; lift them and income escapes about when the green curve crosses the orange one. Switch the demographic transition off to see population absorb part of the gains. Illustrative parameters.`,
      deps: ['macro-4.6', 'macro-4.4', 'demo-7.4'], refs: ['CORE The Economy 1.0 U2'], tags: ['growth', 'Malthus', 'demographic transition'],
      credit: 'Oded Galor and David Weil, 2000 (American Economic Review 90(4), 806–828)',
      scope: String.raw`Stylised long-run story; the timing of the escape in the simulation is fixed by the parameters shown, not by history.`,
      links: { doi: 'https://doi.org/10.1257/aer.90.4.806' },
      viz(v) {
        const nuS = v.slider('idea spillover from population $\\nu$', 0, 2, 1.5, { step: 0.05 });
        const g0S = v.slider('progress at start $g_0$ (per year)', 0.0001, 0.0006, 0.0003, { step: 0.00001, decimals: 5 });
        const nmS = v.slider('maximum population growth $n_{\\max}$', 0.002, 0.012, 0.006, { step: 0.0005, decimals: 4 });
        const trS = v.toggle('demographic transition', true);
        const tauS = v.slider('transition at income (× subsistence)', 1.3, 5, 2.2, { step: 0.05 });
        const A = 0.7, eta = 0.02, T = 1600;
        const I = v.stage({ x: [0, T], y: [0.8, 300], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'years', ylabel: 'income per head (subsistence = 1, log scale)', title: 'the hockey stick' });
        const Rr = v.stage({ x: [0, T], y: [0, 0.02], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'years', ylabel: 'rate per year', title: 'progress against population drag' });
        let st = null;
        v.animate((t) => {
          const nu = nuS.value, g0 = g0S.value, nm = nmS.value, tr = trS.value, tau = Math.log(tauS.value);
          const pts = []; let lnA = 0, lnN = 0, esc = null;
          for (let s = 0; s <= T; s++) {
            const lny = lnA - (1 - A) * lnN;
            let n = Math.max(-0.02, Math.min(eta * lny, nm));
            if (tr) n *= 1 / (1 + Math.exp((lny - tau) / 0.15));
            const g = Math.min(g0 * Math.exp(nu * lnN), 0.02);
            pts.push([s, Math.exp(lny), g, (1 - A) * n, Math.exp(lnN)]);
            if (esc === null && lny > 0.4 && g > (1 - A) * nm) esc = s;
            lnA += g; lnN += n;
          }
          const tp = Math.min(T, (t / 11) * T), cur = pts[Math.round(tp)];
          const ymax = Math.max(...pts.map((p) => p[1])), rmax = Math.max(...pts.map((p) => Math.max(p[2], p[3])));
          I.setView([0, T], [0.8, Math.max(10, ymax * 1.3)]);
          I.hline(1, { color: 'red', width: 2 });
          I.path(pts.map((p) => [p[0], p[1]]), { color: 'orange', width: 2.8 });
          I.vline(tp, { color: 'gold', width: 1.6 });
          I.dot(cur[0], cur[1], { r: 6, color: 'gold' });
          if (esc !== null) { I.vline(esc, { color: 'faint', dash: [4, 4] }); I.text('escape', esc, 1, { dx: 6, dy: 18, align: 'left', color: 'muted', size: 12 }); }
          I.text('subsistence', 20, 1, { dy: -10, align: 'left', color: 'red', weight: 700, size: 12 });
          Rr.setView([0, T], [0, Math.max(0.01, rmax * 1.15)]);
          Rr.hline((1 - A) * nm, { color: 'orange', alpha: 0.4, dash: [4, 4] });
          Rr.path(pts.map((p) => [p[0], p[2]]), { color: 'green', width: 2.6 });
          Rr.path(pts.map((p) => [p[0], p[3]]), { color: 'orange', width: 2.6 });
          Rr.vline(tp, { color: 'gold', width: 1.6 });
          Rr.text('progress g_A', T * 0.02, pts[Math.round(T * 0.02)][2], { dy: -12, dx: 4, align: 'left', color: 'green', weight: 700, size: 12 });
          Rr.text('(1−α)·pop. growth', T * 0.3, (1 - A) * nm, { dy: -10, align: 'center', color: 'orange', weight: 700, size: 12 });
          st = { cur, esc, nm, thr: (1 - A) * nm, tp, end: pts[T] };
        }, { period: 14, still: 11 });
        v.legend([['orange', 'income per head / population drag'], ['green', 'technical progress g_A'], ['red', 'subsistence']]);
        v.readout(() => st && `Year ${fx(st.tp, 0)}: income ${fx(st.cur[1], 2)}× subsistence, progress ${pc(st.cur[2], 2)} a year, drag ${pc(st.cur[3], 2)}. Escape threshold $(1-\\alpha) n_{\\max} = ${pc(st.thr, 2)}$; ${st.esc === null ? 'progress never exceeds it in 1,600 years: the economy stays trapped.' : `progress overtakes it around year ${st.esc}, and income reaches ${fx(st.end[1], 0)}× subsistence by year 1,600.`}`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8', kind: 'Model', name: 'Human-capital-augmented Solow (Mankiw–Romer–Weil)',
      statement: String.raw`Let output be $Y = K^{\alpha} H^{\beta} (AL)^{1-\alpha-\beta}$ with physical capital $K$ and human capital $H$ accumulated at the rates $s_k$ and $s_h$ of output, with $\alpha+\beta<1$. In the steady state income per worker is
$$\ln\frac{Y}{L} = \ln A(0) + gt - \frac{\alpha+\beta}{1-\alpha-\beta}\ln(n+g+\delta) + \frac{\alpha}{1-\alpha-\beta}\ln s_k + \frac{\beta}{1-\alpha-\beta}\ln s_h .$$
Mankiw, Romer and Weil (1992) estimate this on cross-country data for 1960–1985. Without human capital the data imply a capital share $\alpha$ of about $0.6$ (twice the national-accounts value of about one third); with schooling added, the fit improves from an adjusted $R^2$ of $0.59$ (75-country intermediate sample) to $0.78$ (98 non-oil countries) and the implied shares fall to $\alpha \approx 0.31$, $\beta \approx 0.28$, close to their prior values.

Scope: the original uses secondary-school enrolment as a proxy for the human-capital investment rate and assumes $g+\delta = 0.05$ and common technology levels across countries; both are strong, and later work (conditional convergence, 3.10) questions the second.`,
      idea: String.raw`In the textbook model, saving and population growth must explain all of the cross-country variation in income through a single exponent $\alpha/(1-\alpha)$, which comes out too big if the omitted variable is correlated with them: countries that save more also tend to be better educated, so the saving coefficient absorbs the effect of human capital. Adding human capital as a third factor spreads the same variation over three inputs, lowering the implied capital share to a plausible value while raising the fit. The test is a *restriction*: the coefficients on $\ln s_k$, $\ln s_h$ and $\ln(n+g+\delta)$ should sum to zero, which the data do not reject.`,
      caption: String.raw`Re-estimation on Penn World Table 10 (85 countries; income per worker in 2019, investment share and population growth averaged over 1960–2019, PWT human-capital index in 2019). Choose a **model** and see fitted against actual log income per worker (45° line = perfect fit; orange = long-standing OECD members). **Right:** adjusted $R^2$ of all four models. Change $g+\delta$ (MRW fix it at 0.05) or restrict to OECD members to see how fragile the textbook fit is. The human-capital index is a *level* of efficiency per worker, so theory predicts a coefficient of 1 on its log, unlike MRW's enrolment-rate proxy.`,
      deps: ['macro-3.7'], refs: ['Romer ch. 4'], tags: ['growth', 'empirics', 'human capital'],
      credit: 'N. Gregory Mankiw, David Romer and David Weil, 1992 (Quarterly Journal of Economics 107(2), 407–437)',
      scope: String.raw`Steady-state cross-section; assumes identical technology paths and the same $g+\delta$ everywhere. Estimates here are a modern re-estimation, not MRW's table.`,
      links: { doi: 'https://doi.org/10.2307/2118477' },
      viz(v) {
        const MODELS = [
          { value: 'sol', label: 'Solow, free' }, { value: 'sol3', label: 'Solow, α = ⅓' },
          { value: 'aug', label: 'Augmented, free' }, { value: 'aug3', label: 'Augmented, α = ⅓' },
        ];
        const sel = v.select('model', MODELS, 'sol');
        const gS = v.slider('$g+\\delta$', 0.02, 0.1, 0.05, { step: 0.0025 });
        const oecd = v.toggle('long-standing OECD members only', false);
        const P = v.stage({ x: [0.8, 150], y: [0.8, 150], xlog: true, ylog: true, equal: false, axes: 'box', gutter: true, height: 360, weight: 1.1, minWidth: 290, xlabel: 'fitted GDP per worker, thousand 2017 USD', ylabel: 'actual GDP per worker (2019)', title: 'fitted against actual' });
        const B = v.stage({ x: [0.4, 4.6], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 0.8, minWidth: 230, ylabel: 'adjusted R²', title: 'fit of the four models', xticks: [[1, 'Solow'], [2, 'Solow α=⅓'], [3, 'Aug.'], [4, 'Aug. α=⅓']] });
        let pick = null, st = null;
        P.onClick((x, y) => { let best = null, bd = 1e9; if (!st) return; for (const r of st.pts) { const d = Math.hypot(Math.log(x / r.f), Math.log(y / r.y)); if (d < bd) { bd = d; best = r; } } pick = bd < 0.4 ? best : null; v.invalidate(); });
        v.render(() => {
          const gd = gS.value, data = XS.filter((r) => !oecd.value || r[8] === 1);
          const ly = data.map((r) => Math.log(r[3])), ls = data.map((r) => Math.log(r[4])), lh = data.map((r) => Math.log(r[7]));
          const lnd = data.map((r) => Math.log(Math.exp(r[5]) - 1 + gd)); // ln(n + g + δ) with n from the mean log growth rate
          const n = data.length, tss = ly.reduce((s, y) => s + (y - ly.reduce((a, b) => a + b, 0) / n) ** 2, 0);
          const adj = (r2, p) => 1 - (1 - r2) * (n - 1) / (n - p);
          const fit = (cols) => { const X = ly.map((_, i) => [1, ...cols.map((c) => c[i])]); const o = olsMulti(X, ly); return { o, pred: X.map((row) => row.reduce((s, x, j) => s + x * o.b[j], 0)) }; };
          const imposed = (coefs) => { const raw = ly.map((_, i) => coefs.reduce((s, [c, col]) => s + c * col[i], 0)); const c0 = ly.reduce((s, y, i) => s + y - raw[i], 0) / n; const pred = raw.map((r) => r + c0); const rss = ly.reduce((s, y, i) => s + (y - pred[i]) ** 2, 0); return { r2: 1 - rss / tss, pred }; };
          const m1 = fit([ls, lnd]), m3 = fit([ls, lnd, lh]);
          const m2 = imposed([[0.5, ls], [-0.5, lnd]]), m4 = imposed([[0.5, ls], [-0.5, lnd], [1, lh]]);
          const res = { sol: { pred: m1.pred, r2: m1.o.r2, p: 3 }, sol3: { pred: m2.pred, r2: m2.r2, p: 1 }, aug: { pred: m3.pred, r2: m3.o.r2, p: 4 }, aug3: { pred: m4.pred, r2: m4.r2, p: 1 } };
          const cur = res[sel.value];
          const pts = data.map((r, i) => ({ code: r[0], name: r[1], y: r[3], f: Math.exp(cur.pred[i]), oecd: r[8] === 1 }));
          P.line(0.8, 0.8, 150, 150, { color: 'ink', dash: [5, 4], width: 1.2 });
          for (const q of pts) P.dot(q.f, q.y, { r: 4.5, color: q.oecd ? 'orange' : 'accent' });
          if (pick) { const q = pts.find((r) => r.code === pick.code); if (q) { P.dot(q.f, q.y, { r: 7, color: 'gold', hollow: true }); P.text(`${q.name}`, q.f, q.y, { dy: -12, color: 'gold', weight: 700, size: 12, align: 'center' }); } }
          const r2s = [res.sol, res.sol3, res.aug, res.aug3].map((m) => adj(m.r2, m.p === 1 ? 1 : m.p));
          const names = ['sol', 'sol3', 'aug', 'aug3'];
          B.setView([0.4, 4.6], [Math.min(0, ...r2s) - 0.05, 1]);
          B.bars(r2s.map((r) => Math.max(r, 0)), { x0: 1, dx: 1, color: (val, i) => (names[i] === sel.value ? 'accent' : 'faint'), });
          r2s.forEach((r, i) => B.text(fx(r, 2), i + 1, Math.max(r, 0), { dy: -8, align: 'center', color: names[i] === sel.value ? 'accent' : 'muted', weight: 700, size: 12 }));
          const bs = m1.o.b, bA = m3.o.b;
          st = { pts, n, r2s, a1: bs[1] / (1 + bs[1]), a3: bA[1] / (1 + bA[1]), b1: bs, bA, adjCur: adj(cur.r2, 3), hcCoef: bA[3] };
        });
        v.legend([['accent', 'country'], ['orange', 'long-standing OECD'], ['ink', 'perfect fit', { dash: true }]]);
        v.readout(() => st && `${st.n} countries. Free textbook model: coefficient on $\\ln s$ is ${fx(st.b1[1], 2)}, implying $\\alpha = ${fx(st.a1, 2)}$ (MRW, 75 countries: $\\alpha\\approx0.59$, adjusted $R^2$ 0.59); adding human capital: coefficient on $\\ln s$ ${fx(st.bA[1], 2)} ($\\alpha = ${fx(st.a3, 2)}$), on $\\ln h$ ${fx(st.hcCoef, 2)} (theory: 1). Adjusted $R^2$: ${st.r2s.map((r) => fx(r, 2)).join(' → ')} across the four models. Click a dot to name the country.`);
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9', kind: 'Concept', name: 'Institutions as a fundamental cause (debated)',
      statement: String.raw`Capital, schooling and ideas explain much of the variation in income across countries, but why do some countries accumulate more of them? One answer is that societies differ in **institutions**: secure property rights and constraints on the powerful encourage investment and innovation, while extractive institutions do not. Because rich countries may also afford better institutions, Acemoglu, Johnson and Robinson (2001) use European **settler mortality** in the colonies as an instrument: where Europeans died in large numbers they set up extractive institutions, and these persisted. In their 64-country sample a one-point improvement in protection against expropriation (0–10 scale) is associated with about $0.9$ log points higher income today by two-stage least squares, nearly twice the ordinary least squares slope of about $0.5$. The finding is **debated**: critics question the mortality data and the exclusion restriction (mortality may affect income through disease or human capital as well).

Scope: an identification argument for colonised countries only; effect size and instrument validity are contested.`,
      idea: String.raw`If institutions were fixed by income alone, a regression of income on institutional quality would only record reverse causation, and measurement error in an index of expropriation risk would bias it. The instrument has to satisfy two conditions: it must predict institutions (relevance: here the first-stage slope is about $-0.6$) and affect income only through institutions (exclusion). The two-stage estimate is the ratio of the reduced-form to the first-stage slope. The strongest criticisms are that many of the 64 mortality values are borrowed from neighbouring countries (Albouy, 2012), that the result depends on a few groups of countries, and that the instrument might act through other channels, which AJR answer in their reply. A frequently cited illustration of the idea (not used in the regression) is the divergence of North and South Korea after 1945 from the same starting point.`,
      caption: String.raw`The authors' base sample of 64 former colonies (data from their replication file). **Left:** log income per head in 1995 against protection from expropriation, with the OLS line (blue) and the 2SLS line (green). **Right:** the first stage, institutions against log settler mortality. Drop a group of countries with the switches and watch the first stage and the 2SLS slope move: dropping Africa or the four neo-Europes is the standard sensitivity test. Click a dot to see which country it is.`,
      deps: ['macro-4.8'], refs: ['Romer ch. 4', 'CORE Macro U9'], tags: ['development', 'institutions', 'instrumental variables'],
      credit: 'Daron Acemoglu, Simon Johnson and James Robinson, 2001 (American Economic Review 91(5), 1369–1401); critique by David Albouy, 2012 (American Economic Review 102(6), 3059–3076)',
      scope: String.raw`Estimates depend on the sample and instrument; a debated causal claim rather than a settled result.`,
      verify: true,
      links: { doi: 'https://doi.org/10.1257/aer.91.5.1369' },
      viz(v) {
        const dA = v.toggle('drop Africa', false), dN = v.toggle('drop the neo-Europes', false), dS = v.toggle('drop Asia', false);
        const L = v.stage({ x: [3, 10.5], y: [5.5, 10.6], axes: 'box', gutter: true, height: 360, weight: 1.05, minWidth: 280, xlabel: 'protection against expropriation risk (0–10)', ylabel: 'log GDP per head, 1995', title: 'institutions and income' });
        const R = v.stage({ x: [1.8, 8.2], y: [3, 10.5], axes: 'box', gutter: true, height: 360, weight: 0.95, minWidth: 260, xlabel: 'log settler mortality (per 1000)', ylabel: 'protection against expropriation risk', title: 'first stage' });
        let pick = null, st = null;
        L.onClick((x, y) => { if (!st) return; let b = null, bd = 1e9; for (const r of st.data) { const d = Math.hypot((r.x - x) / 7.5, (r.y - y) / 5); if (d < bd) { bd = d; b = r; } } pick = bd < 0.06 ? b : null; v.invalidate(); });
        R.onClick((x, y) => { if (!st) return; let b = null, bd = 1e9; for (const r of st.data) { const d = Math.hypot((r.z - x) / 6.4, (r.x - y) / 7.5); if (d < bd) { bd = d; b = r; } } pick = bd < 0.06 ? b : null; v.invalidate(); });
        v.render(() => {
          const data = AJR.filter((r) => !(dA.value && r.g === 1) && !(dN.value && r.g === 3) && !(dS.value && r.g === 2));
          const x = data.map((r) => r.x), y = data.map((r) => r.y), z = data.map((r) => r.z);
          const e = data.length > 4 ? iv1(x, y, z, ols) : null;
          for (const r of AJR) { const out = !data.includes(r); L.dot(r.x, r.y, { r: 4.5, color: GCOL[r.g], hollow: out, alpha: out ? 0.35 : 1 }); R.dot(r.z, r.x, { r: 4.5, color: GCOL[r.g], hollow: out, alpha: out ? 0.35 : 1 }); }
          if (e) {
            L.path([[3, e.ols.intercept + e.ols.slope * 3], [10.5, e.ols.intercept + e.ols.slope * 10.5]], { color: 'accent', width: 2.4 });
            L.path([[3, e.tsls.intercept + e.tsls.slope * 3], [10.5, e.tsls.intercept + e.tsls.slope * 10.5]], { color: 'green', width: 2.6 });
            R.path([[1.8, e.fs.intercept + e.fs.slope * 1.8], [8.2, e.fs.intercept + e.fs.slope * 8.2]], { color: 'ink', width: 2.4 });
          }
          for (const c of ['USA', 'NGA', 'HTI', 'SGP']) { const r = AJR.find((q) => q.code === c); L.text(c, r.x, r.y, { dx: c === 'USA' ? 8 : 6, dy: c === 'USA' ? 14 : -8, align: c === 'USA' ? 'right' : 'left', size: 11, color: 'muted' }); }
          if (pick) { L.dot(pick.x, pick.y, { r: 8, color: 'gold', hollow: true }); R.dot(pick.z, pick.x, { r: 8, color: 'gold', hollow: true }); L.text(pick.code, pick.x, pick.y, { dy: -12, color: 'gold', weight: 700, size: 12, align: 'center' }); R.text(pick.code, pick.z, pick.x, { dy: -12, color: 'gold', weight: 700, size: 12, align: 'center' }); }
          st = { data, e };
        });
        v.legend(GROUP.map((g, i) => [GCOL[i], g, { dot: true }]).concat([['accent', 'OLS line'], ['green', '2SLS line']]));
        v.readout(() => st && st.e && `${st.data.length} countries. OLS slope ${fx(st.e.ols.slope, 2)}; first stage ${fx(st.e.fs.slope, 2)} (R² ${fx(st.e.fs.r2, 2)}); 2SLS slope ${fx(st.e.tsls.slope, 2)} (se ${fx(st.e.tsls.se, 2)}). Full base sample: OLS 0.52, first stage −0.61, 2SLS 0.94, as in AJR's Table 4 (replicated here from their file).`);
      },
    },
  ],
};
