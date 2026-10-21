// Macroeconomics — Chapter 4 (part b): the Malthusian economy and its escape, human-capital Solow and institutions (items 4.6–4.9)
import { clamp, pc, fx, ols, rows, XS_PWT, AJR_DATA, iv1, growthRegressions, escapePath } from './ch04.shared.js';

const XS = rows(XS_PWT.flat(), 10); // code, name, y60, y19, s, n, hc60, hc19, oecd, irr
const AJR = AJR_DATA.split(' ').map((r) => { const f = r.split(','); return { code: f[0], x: +f[1], y: +f[2], z: +f[3], g: +f[4] }; });
const GROUP = ['other (mostly Latin America, Caribbean)', 'Africa', 'Asia', 'neo-Europes (AUS, CAN, NZL, USA)'];
const GCOL = ['accent', 'orange', 'teal', 'green'];

/** Malthusian economy: y = A T^{1-a} N^{a-1} (T = 1), subsistence 1, dlnN/dt = eta ln y, clipped. Returns [[t, N, y, lnA]]. */
export function malthus(a, eta, boost, gA, T = 1500) {
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
A permanent rise in $A$ therefore raises **population, not living standards**: income per head jumps up, then is pushed back to $\bar y$ as population grows by the factor $(A'/A)^{1/(1-\alpha)}$. If technology grows at a constant rate $g$, the balanced-growth population rate is $g/(1-\alpha)$ and income per head approaches the constant $y_{BG}=\bar y\exp[g/(\eta(1-\alpha))]$, **above subsistence when $g>0$**. This requires the population-growth rate to remain within the simulation’s demographic cap.

Scope: a stylised pre-industrial economy with fixed land and a fertility/mortality response to income; it is a model for the long Malthusian epoch, not a description of any one country.`,
      idea: String.raw`Diminishing returns to labour on fixed land mean that more people lower the average product, so the income curve slopes down in $N$; the demographic response slopes the other way, making population rise when income is above subsistence. The two forces meet at one point, and the dynamics are those of a stable one-dimensional system, as in the Solow model with land in place of capital. A technology shock shifts the curve up; the economy slides back down the new curve to the same income level and a larger population. The model reproduces the broad pattern of the world before about 1800: technologically more advanced societies were denser, but not much richer. Between technology jumps, in the uncapped logarithmic demographic-response regime put $z=\ln(y/\bar y)$. The model gives $\dot z=g-\eta(1-\alpha)z$. Subtracting $z_{BG}=g/[\eta(1-\alpha)]$ gives the exponential decay equation ode 1.5, so $z-z_{BG}$ decays at rate $\eta(1-\alpha)$. This proves the stated local regime's return or balanced income level; once the demographic cap binds, this linear equation no longer applies.`,
      caption: String.raw`**Left (log population axis):** income per head against population. The dashed curve is the economy before the technology jump, the solid curve after it; the red line is subsistence, and the gold dot moves along the path (play/pause). **Right:** the same history against time. Raise the jump or the land share $1-\alpha$ and see how large the population gain is; add steady technological progress $g$ and population grows while income approaches a constant **above** subsistence. The two income curves use the current background technology, with and without the jump. Illustrative parameters, not data.`,
      deps: ['demo-7.1', 'macro-2.1', 'ode-1.5'], refs: ['CORE The Economy 1.0, Unit 2; https://books.core-econ.org/the-economy-v1/book/text/02.html', 'Malthus (1798), An Essay on the Principle of Population; https://www.econlib.org/library/Malthus/malPop.html'], tags: ['growth', 'Malthus', 'population'],
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
          D.fn((N) => Math.exp(g * tau) * N ** (a - 1), { color: 'ink', dash: [5, 4], width: 2, domain: [0.5, lim], n: 200 });
          if (b > 1.001) D.fn((N) => b * Math.exp(g * tau) * N ** (a - 1), { color: 'accent', width: 2.6, domain: [0.5, lim], n: 200 });
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
          st = { yBG: Math.exp(g / (eta * (1 - a))), N: cur[1], y: cur[2], tau, Nstar, g, a, b, Nend: path[1500][1], yend: path[1500][2] };
        }, { period: 14, still: 11 });
        v.legend([['accent', 'population'], ['orange', 'income per head'], ['red', 'subsistence'], ['purple', 'path in the diagram']]);
        v.readout(() => st && `Year ${fx(st.tau, 0)}: population ×${fx(st.N, 2)}, income per head ${fx(st.y, 2)}× subsistence. ${st.g === 0 ? `A technology jump of ×${fx(st.b, 2)} raises the long-run population by ×$${fx(st.b, 2)}^{1/(1-\\alpha)}$ = ×${fx(st.Nstar, 2)} and leaves income per head at subsistence.` : `With steady progress $g$, population grows at $g/(1-\\alpha) = ${pc(st.g / (1 - st.a), 3)}$ a year and income approaches $\\bar y\\exp[g/(\\eta(1-\\alpha))] = ${fx(st.yBG, 2)}$× subsistence (${fx(st.yend, 2)}× in year 1500).`}`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Concept', name: 'Escaping the Malthusian trap',
      statement: String.raw`Let technology advance at a rate $g_A$ and let population growth be capped at a biological maximum $n_{\max}$. In the Malthusian economy of 4.6, income per head is $y \propto A\,N^{-(1-\alpha)}$, so
$$\frac{\dot y}{y} = g_A - (1-\alpha)\,\frac{\dot N}{N}.$$
For constant $g_A>0$ below $(1-\alpha)n_{\max}$ and with no demographic transition, the response $\dot N/N=\eta\ln(y/\bar y)$ can balance progress at $y/\bar y=\exp[g_A/(\eta(1-\alpha))]$, above subsistence. Only zero progress returns income to subsistence. If $g_A$ rises above $(1-\alpha)\,n_{\max}$, however (for instance because a larger population means more ideas, as in Romer's model), population cannot keep pace and income per head takes off. A **demographic transition**, represented here by a decline in population growth at high income, reduces the population drag. Income growth approaches $g_A$ as that drag approaches zero: the *hockey stick* of world income (1.10).

Scope: a stylised reduced form in the spirit of Galor and Weil (2000) and Kremer (1993); the parameters are chosen for illustration, not estimated.`,
      idea: String.raw`This illustration combines population-driven ideas with a ceiling on population growth. More people increase the rate of technological progress, while the demographic response to income is bounded. These are chosen mechanisms for the picture, not necessary conditions for every theory of escape. The race between $g_A$ and $(1-\alpha)\dot N/N$ decides the outcome; once $g_A$ wins, income rises, and in the second stage lower fertility at high income (the transition) shifts the effort from quantity to quality of children and lets the gains stay in income per head. Ashraf and Galor (2011) report positive effects of technology and land productivity on population density, with insignificant effects on living standards, in their cross-country analysis of 1–1500 CE.`,
      caption: String.raw`**Left (log scale):** income per head over 1,600 simulated years; red is subsistence. **Right:** the race: progress $g_A$ (green) against the drag $(1-\alpha)\dot N/N$ (orange). The gold marker moves with time. The difference between the two curves is current income growth. The dashed orange line is the drag at maximum population growth: crossing it guarantees rising income even at that maximum, and the marker records this crossing. Lower spillovers $\nu$ or $g_0$ to delay or avoid it within the displayed horizon. Switch the demographic transition off to see population absorb part of the gains. Illustrative parameters.`,
      deps: ['macro-4.6', 'macro-4.4', 'demo-7.4'], refs: ['Galor & Weil (2000), AER 90(4):806–828; https://www.aeaweb.org/articles?id=10.1257/aer.90.4.806', 'Ashraf & Galor (2011), AER 101(5):2003–2041; https://www.aeaweb.org/articles?id=10.1257/aer.101.5.2003', 'Kremer (1993), QJE 108(3), 681–716, §III; https://www.steveambler.uqam.ca/511/readings/kremer.1993.pdf'], tags: ['growth', 'Malthus', 'demographic transition'],
      credit: 'Oded Galor and David Weil, 2000 (American Economic Review 90(4), 806–828)',
      scope: String.raw`Illustrative annual log-step simulation, not a reconstruction of Galor–Weil or Kremer. Progress is $g_A=\min(g_0N^\nu,0.02)$; population responds to $\ln(y/\bar y)$ with labour share $\alpha=0.7$, slope 0.02 and cap $n_{\max}$. The optional transition smoothly reduces this response around the chosen income threshold. Timing and parameters are illustrative; the cap-crossing marker is a sufficient condition, not the only way income can rise.`,
      links: { doi: 'https://doi.org/10.1257/aer.90.4.806' },
      viz(v) {
        const nuS = v.slider('idea spillover from population $\\nu$', 0, 2, 1.5, { step: 0.05 });
        const g0S = v.slider('progress at start $g_0$ (per year)', 0.0001, 0.0006, 0.0003, { step: 0.00001, decimals: 5 });
        const nmS = v.slider('maximum population growth $n_{\\max}$', 0.002, 0.012, 0.006, { step: 0.0005, decimals: 4 });
        const trS = v.toggle('demographic transition', true);
        const tauS = v.slider('transition at income (× subsistence)', 1.3, 5, 2.2, { step: 0.05 });
        const A = 0.7, T = 1600;
        const I = v.stage({ x: [0, T], y: [0.8, 300], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 270, xlabel: 'years', ylabel: 'income per head (subsistence = 1, log scale)', title: 'the hockey stick' });
        const Rr = v.stage({ x: [0, T], y: [0, 0.02], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'years', ylabel: 'rate per year', title: 'progress against population drag' });
        let st = null;
        v.animate((t) => {
          const nu = nuS.value, g0 = g0S.value, nm = nmS.value, tr = trS.value;
          const {pts,esc} = escapePath(nu,g0,nm,tr,tauS.value,T);
          const tp = Math.min(T, (t / 11) * T), cur = pts[Math.round(tp)];
          const ymax = Math.max(...pts.map((p) => p[1])), rmax = Math.max(...pts.map((p) => Math.max(p[2], p[3])));
          I.setView([0, T], [0.8, Math.max(10, ymax * 1.3)]);
          I.hline(1, { color: 'red', width: 2 });
          I.path(pts.map((p) => [p[0], p[1]]), { color: 'orange', width: 2.8 });
          I.vline(tp, { color: 'gold', width: 1.6 });
          I.dot(cur[0], cur[1], { r: 6, color: 'gold' });
          if (esc !== null) { I.vline(esc, { color: 'faint', dash: [4, 4] }); I.text('cap crossed', esc, 1, { dx: 6, dy: -14, align: 'left', color: 'muted', size: 12 }); }
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
        v.readout(() => st && `Year ${fx(st.tp, 0)}: income ${fx(st.cur[1], 2)}× subsistence, progress ${pc(st.cur[2], 2)} a year, drag ${pc(st.cur[3], 2)}. Escape threshold $(1-\\alpha) n_{\\max} = ${pc(st.thr, 2)}$; ${st.esc === null ? 'progress does not exceed this cap threshold within 1,600 years; this does not mean income is exactly at subsistence.' : `progress overtakes it around year ${st.esc}, and income reaches ${fx(st.end[1], 0)}× subsistence by year 1,600.`}`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8', kind: 'Model', name: 'Human-capital-augmented Solow (Mankiw–Romer–Weil)',
      statement: String.raw`Let output be $Y = K^{\alpha} H^{\beta} (AL)^{1-\alpha-\beta}$ with physical capital $K$ and human capital $H$ accumulated at the rates $s_k$ and $s_h$ of output, with $\alpha+\beta<1$. In the steady state income per worker is
$$\ln\frac{Y}{L} = \ln A(0) + gt - \frac{\alpha+\beta}{1-\alpha-\beta}\ln(n+g+\delta) + \frac{\alpha}{1-\alpha-\beta}\ln s_k + \frac{\beta}{1-\alpha-\beta}\ln s_h .$$
Mankiw, Romer and Weil (1992) estimate this on cross-country data for 1960–1985. Without human capital the data imply a capital share $\alpha$ of about $0.6$ (twice the national-accounts value of about one third); with schooling added, the fit improves from an adjusted $R^2$ of $0.59$ to $0.78$ in the same 98-country non-oil sample (Tables I–II) and the implied shares fall to $\alpha \approx 0.31$, $\beta \approx 0.28$, close to their prior values.

Scope: the original uses secondary-school enrolment as a proxy for the human-capital investment rate and assumes $g+\delta = 0.05$. Unobserved initial technology enters the regression error and is assumed uncorrelated with saving, population growth and schooling; this identifying assumption can fail.`,
      idea: String.raw`In the textbook model, saving and population growth must explain all of the cross-country variation in income through a single exponent $\alpha/(1-\alpha)$, which comes out too big if the omitted variable is correlated with them: countries that save more also tend to be better educated, so the saving coefficient absorbs the effect of human capital. Adding human capital as a third factor spreads the same variation over three inputs, lowering the implied capital share to a plausible value while raising the fit. The test is a *restriction*: the coefficients on $\ln s_k$, $\ln s_h$ and $\ln(n+g+\delta)$ should sum to zero, which the data do not reject.`,
      caption: String.raw`Separate modern illustration using Penn World Table 10.0 (85 countries; income per worker in 2019, mean investment share and population growth over 1960–2019, human-capital index in 2019). Choose a **model** and compare fitted with actual income on log axes (45° line = perfect fit; orange = OECD members by 1973). **Right:** adjusted $R^2$ of all four models, including negative values when the imposed slopes fit worse than a constant. Change $g+\delta$ (MRW fix it at 0.05) or restrict the sample to see how the fit changes. The human-capital index is a *level* of efficiency per worker: the restricted illustration uses $Y=K^\alpha(AhL)^{1-\alpha}$, giving a coefficient of 1 on $\ln h$. It does not estimate MRW's separate human-capital accumulation equation.`,
      deps: ['macro-3.7'], refs: ['Mankiw, Romer & Weil (1992), Tables I–II, pp. 414 and 420; https://gente.itam.mx/rahul.giri/uploads/1/1/3/6/113608/contrbtntoempiricsofecongrwth_mankiwromerweil_qje1992.pdf', 'Feenstra, Inklaar & Timmer (2015), The Next Generation of the Penn World Table, AER 105(10), 3150–3182; PWT 10.0, CC BY 4.0; https://www.rug.nl/ggdc/productivity/pwt/pwt-releases/pwt100'], tags: ['growth', 'empirics', 'human capital'],
      credit: 'N. Gregory Mankiw, David Romer and David Weil, 1992 (Quarterly Journal of Economics 107(2), 407–437)',
      scope: String.raw`The original MRW steady-state cross-section assumes common technology growth and depreciation, with unobserved technology uncorrelated with the regressors. The visualization is a separate PWT 10.0 level regression with human-capital efficiency $h$, using population growth as a proxy for labour growth. Its 85-country sample requires population above one million in 2019, positive GDP, employment and human-capital observations in 1960 and 2019, and complete investment shares over those 60 years with positive mean. Figures are rounded source values.`,
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
          const n = data.length, res = growthRegressions(data, gd);
          const cur = res[sel.value];
          const pts = data.map((r, i) => ({ code: r[0], name: r[1], y: r[3], f: Math.exp(cur.pred[i]), oecd: r[8] === 1 }));
          const extent = pts.flatMap(q => [q.f,q.y]);
          const lo = Math.min(...extent)/1.25, hi = Math.max(...extent)*1.25;
          P.setView([lo,hi],[lo,hi]);
          P.line(lo, lo, hi, hi, { color: 'ink', dash: [5, 4], width: 1.2 });
          for (const q of pts) P.dot(q.f, q.y, { r: 4.5, color: q.oecd ? 'orange' : 'accent' });
          if (pick) { const q = pts.find((r) => r.code === pick.code); if (q) { P.dot(q.f, q.y, { r: 7, color: 'gold', hollow: true }); P.text(`${q.name}`, q.f, q.y, { dy: -12, color: 'gold', weight: 700, size: 12, align: 'center' }); } }
          const r2s = [res.sol, res.sol3, res.aug, res.aug3].map(m => m.adjR2);
          const names = ['sol', 'sol3', 'aug', 'aug3'];
          B.setView([0.4, 4.6], [Math.min(0, ...r2s) - 0.05, 1]);
          B.hline(0, {color:'muted',width:1});
          B.bars(r2s, { x0: 1, dx: 1, color: (val, i) => (names[i] === sel.value ? 'accent' : 'faint'), });
          r2s.forEach((r, i) => B.text(fx(r, 2), i + 1, Math.max(r,0), { dy: -8, align: 'center', color: names[i] === sel.value ? 'accent' : 'muted', weight: 700, size: 12 }));
          const bs = res.sol.b, bA = res.aug.b;
          st = { pts, n, r2s, a1: bs[1] / (1 + bs[1]), a3: bA[1] / (1 + bA[1]), b1: bs, bA, hcCoef: bA[3] };
        });
        v.legend([['accent', 'country'], ['orange', 'long-standing OECD'], ['ink', 'perfect fit', { dash: true }]]);
        v.readout(() => st && `${st.n} countries. Free textbook model: coefficient on $\\ln s$ is ${fx(st.b1[1], 2)}, implying $\\alpha = ${fx(st.a1, 2)}$ (MRW, 98-country non-oil sample: $\\alpha\\approx0.60$, adjusted $R^2$ 0.59); adding human capital: coefficient on $\\ln s$ ${fx(st.bA[1], 2)} ($\\alpha = ${fx(st.a3, 2)}$), on $\\ln h$ ${fx(st.hcCoef, 2)} (theory: 1). Adjusted $R^2$: ${st.r2s.map((r) => fx(r, 2)).join(' → ')} across the four models. Click a dot to name the country.`);
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9', kind: 'Concept', name: 'Institutions as a fundamental cause (debated)',
      statement: String.raw`Capital, schooling and ideas explain much of the variation in income across countries, but why do some countries accumulate more of them? One answer is that societies differ in **institutions**: secure property rights and constraints on the powerful encourage investment and innovation, while extractive institutions do not. Because rich countries may also afford better institutions, Acemoglu, Johnson and Robinson (2001) use European **settler mortality** in the colonies as an instrument: where Europeans died in large numbers they set up extractive institutions, and these persisted. In their 64-country sample a one-point improvement in protection against expropriation (0–10 scale) is associated with about $0.9$ log points higher income today by two-stage least squares, nearly twice the ordinary least squares slope of about $0.5$. The finding is **debated**: critics question the mortality data and the exclusion restriction (mortality may affect income through disease or human capital as well).

Scope: an identification argument for colonised countries only; effect size and instrument validity are contested.`,
      idea: String.raw`If institutions were fixed by income alone, a regression of income on institutional quality would only record reverse causation, and measurement error in an index of expropriation risk would bias it. The instrument has to satisfy two conditions: it must predict institutions (relevance: here the first-stage slope is about $-0.6$) and affect income only through institutions (exclusion). The two-stage estimate is the ratio of the reduced-form to the first-stage slope. The strongest criticisms are that 36 of the 64 mortality values were assigned from other countries (Albouy, 2012), that the result depends on a few groups of countries, and that the instrument might act through other channels, which AJR answer in their reply. A frequently cited illustration of the idea (not used in the regression) is the divergence of North and South Korea after partition.`,
      caption: String.raw`The authors' base sample of 64 former colonies (data from their replication file, rounded to two decimals). **Left:** log income per head in 1995 against protection from expropriation, with the OLS line (blue) and the 2SLS line (green). **Right:** the first stage, institutions against log settler mortality. Drop a group of countries with the switches and watch the first stage and the 2SLS slope move: dropping Africa or the four neo-Europes is the standard sensitivity test. Click a dot to see which country it is.`,
      deps: ['macro-4.8'], refs: ['Acemoglu, Johnson & Robinson (2001), Table 4, p. 1386; https://economics.mit.edu/research/publications/colonial-origins-comparative-development-empirical-investigation', 'Authors’ replication data, maketable4.dta; https://economics.mit.edu/people/faculty/daron-acemoglu/data-archive', 'Albouy (2012), AER 102(6), 3059–3076; https://www.aeaweb.org/articles?id=10.1257/aer.102.6.3059', 'Acemoglu, Johnson & Robinson (2012), Reply; https://www.aeaweb.org/articles?id=10.1257/aer.102.6.3077'], tags: ['development', 'institutions', 'instrumental variables'],
      credit: 'Daron Acemoglu, Simon Johnson and James Robinson, 2001 (American Economic Review 91(5), 1369–1401); critique by David Albouy, 2012 (American Economic Review 102(6), 3059–3076)',
      scope: String.raw`Estimates depend on the sample and instrument; a debated causal claim rather than a settled result.`,
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
        v.readout(() => st && st.e && `${st.data.length} countries. OLS slope ${fx(st.e.ols.slope, 2)}; first stage ${fx(st.e.fs.slope, 2)} (R² ${fx(st.e.fs.r2, 2)}); 2SLS slope ${fx(st.e.tsls.slope, 2)} (homoskedastic se ${fx(st.e.tsls.se, 2)}). Full base sample: OLS 0.52, first stage −0.61, 2SLS 0.94, as in AJR's Table 4 (replicated here from their file).`);
      },
    },
  ],
};
