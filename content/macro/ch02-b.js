// Macroeconomics — Chapter 2 (part b): consumption and saving, and the Cobb–Douglas paper (items 2.8–2.14)
import { clamp, pc, fx, ols, CY_US, CY_START, LABSHARE_PWT, pairs } from './ch02.shared.js';

// CRRA utility g(c) = (c^(1−θ) − 1)/(1 − θ) (log at θ = 1) and its inverse.
const isLog = (th) => Math.abs(th - 1) < 0.005;
const gU = (c, th) => (isLog(th) ? Math.log(c) : (c ** (1 - th) - 1) / (1 - th));
const gInv = (z, th) => (isLog(th) ? Math.exp(z) : (1 + (1 - th) * z) > 0 ? (1 + (1 - th) * z) ** (1 / (1 - th)) : NaN);
/** Optimal two-period consumption for incomes y1, y2, interest r, patience β and CRRA θ. */
function fisher(y1, y2, r, be, th) {
  const W = y1 + y2 / (1 + r), c1 = W / (1 + be ** (1 / th) * (1 + r) ** (1 / th - 1)), c2 = (1 + r) * (W - c1);
  return { W, c1, c2, U: gU(c1, th) + be * gU(c2, th) };
}
/** Gaussian draw from a v.rng generator. */
const gauss = (r) => r.normal();

// Cobb & Douglas (1928), Table I: indexes of the American manufacturing sector, 1899 = 100: fixed capital C, employed labour L, product P.
// Checked year by year against a published reproduction of the table (Knill, Harvard Math handout data03: all 24 rows identical); endpoints 1922: 431, 161, 240.
// The regression below reproduces the published fit P = 1.01 L^0.75 C^0.25 (a check, see the readout).
const CD = {
  C: [100, 107, 114, 122, 131, 138, 149, 163, 176, 185, 198, 208, 216, 226, 236, 244, 266, 298, 335, 366, 387, 407, 417, 431],
  L: [100, 105, 110, 118, 123, 116, 125, 133, 138, 121, 140, 144, 145, 152, 154, 149, 154, 182, 196, 200, 193, 193, 147, 161],
  P: [100, 101, 112, 122, 124, 122, 143, 152, 151, 126, 155, 159, 153, 177, 184, 169, 189, 225, 227, 223, 218, 231, 179, 240],
};

export default {
  collection: 'macro',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8', kind: 'Model', name: 'Two-period consumption and saving (Fisher)',
      statement: String.raw`A household with incomes $y_1$ now and $y_2$ later, who can borrow or lend at the real interest rate $r$, faces the **intertemporal budget constraint**
$$c_1+\frac{c_2}{1+r}=y_1+\frac{y_2}{1+r}\;(=W),$$
a line in the $(c_1,c_2)$ plane with slope $-(1+r)$ through the endowment point $(y_1,y_2)$. It chooses the point that maximises $U=u(c_1)+\beta\,u(c_2)$; at an interior optimum the indifference curve is tangent to the budget line, $\mathrm{MRS}=1+r$. Saving is $s=y_1-c_1$: positive for a lender, negative for a borrower. A rise in $r$ has a **substitution effect** (consumption today is dearer: save more) and an **income effect** (a lender is richer, a borrower poorer), which cancel for log utility when $y_2=0$ and in general go in opposite directions for lenders.

Scope: perfect capital markets (no borrowing limit), certainty, time-separable CRRA utility $u(c)=(c^{1-\theta}-1)/(1-\theta)$.`,
      idea: String.raw`Present value does the work (fin-1.5): future income is discounted at $1+r$, so the two periods' consumption and income are pieces of one budget. The optimisation is then the micro consumer problem of micro-11.8 with the "price" of period-2 consumption equal to $1/(1+r)$. Changing $r$ rotates the budget line around the endowment point; Slutsky splits the movement of the optimum into a move along the original indifference curve (substitution) and a parallel shift to the new budget (income).`,
      caption: String.raw`Drag the **endowment** point (an income stream $y_1,y_2$) and the sliders for $r$, patience $\beta$ and curvature $\theta$. The solid budget line pivots on the endowment as $r$ changes; dashed is the reference rate. With **decomposition** on, the compensated line (same utility as before, new prices) separates the substitution effect (reference → compensated point) from the income effect (compensated → new). Put the endowment above the 45° line to be a saver, below it a borrower, and watch the income effect change sign.`,
      deps: ['micro-11.8', 'fin-1.5'], refs: ['Mankiw ch. 20', 'Romer ch. 8'], tags: ['consumption', 'saving', 'interest rate'],
      credit: 'Irving Fisher, 1930',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Intertemporal_budget_constraint' },
      viz(v) {
        const rS = v.slider('interest rate $r$ (%)', -5, 25, 12, { step: 0.5 });
        const r0S = v.slider('reference rate (%)', -5, 25, 3, { step: 0.5 });
        const bS = v.slider('patience $\\beta$', 0.7, 1, 0.95, { step: 0.005 });
        const tS = v.slider('curvature $\\theta$ (1/elasticity of substitution)', 0.3, 4, 0.6, { step: 0.05 });
        const dec = v.toggle('decomposition (substitution / income)', true);
        const S = v.stage({ x: [0, 3.2], y: [0, 3.2], axes: 'box', gutter: true, height: 420, weight: 1.3, xlabel: 'consumption today  c₁', ylabel: 'consumption tomorrow  c₂' });
        const E = S.handle(1.9, 0.8, { color: 'gold', label: 'endowment (y₁, y₂)', labelPos: 'ne', constrain: { x: [0.2, 3], y: [0.2, 3] } });
        let st = {};
        v.render(() => {
          const r = rS.value / 100, r0 = r0S.value / 100, be = bS.value, th = tS.value, y1 = E.x, y2 = E.y;
          const A = fisher(y1, y2, r0, be, th), B = fisher(y1, y2, r, be, th);
          const line = (R, col, w, dash) => S.line(0, y2 + (1 + R) * y1, (y1 + y2 / (1 + R)), 0, { color: col, width: w, dash });
          line(r0, 'muted', 1.8, [6, 4]); line(r, 'accent', 2.8);
          // indifference curves through A and B
          const iso = (U) => (c1) => gInv((U - gU(c1, th)) / be, th);
          S.fn(iso(A.U), { color: 'muted', width: 1.8, domain: [0.15, 3.2], n: 200 }); S.fn(iso(B.U), { color: 'green', width: 2.4, domain: [0.15, 3.2], n: 200 });
          S.line(0, 0, 3.2, 3.2, { color: 'faint', width: 1, dash: [3, 5] });
          S.dot(y1, y2, { color: 'faint', r: 5 });
          S.dot(A.c1, A.c2, { color: 'muted', r: 6, label: 'at reference rate', labelPos: 's' });
          S.dot(B.c1, B.c2, { color: 'green', r: 8, label: 'new optimum', labelPos: 'ne' });
          let C = null;
          if (dec.value) {
            const rho = (be * (1 + r)) ** (1 / th);
            const c1C = isLog(th) ? Math.exp((A.U - be * Math.log(rho)) / (1 + be)) : (((1 - th) * A.U + 1 + be) / (1 + be * rho ** (1 - th))) ** (1 / (1 - th));
            C = { c1: c1C, c2: rho * c1C };
            const cc = C.c1 + C.c2 / (1 + r);
            S.line(0, (1 + r) * cc, cc, 0, { color: 'orange', width: 1.8, dash: [3, 4] });
            S.dot(C.c1, C.c2, { color: 'orange', r: 6, label: 'compensated', labelPos: 'nw' });
            S.arrow(A.c1, A.c2, C.c1, C.c2, { color: 'orange', width: 2 }); S.arrow(C.c1, C.c2, B.c1, B.c2, { color: 'blue', width: 2 });
          }
          st = { A, B, C, y1, y2, r, r0 };
        });
        v.legend([['accent', 'budget line at r'], ['muted', 'budget at reference', { dash: true }], ['green', 'indifference curve through new optimum'], ['orange', 'substitution effect'], ['blue', 'income effect']]);
        v.readout(() => {
          const { A, B, C, y1, r } = st;
          const sA = y1 - A.c1, sB = y1 - B.c1;
          return `At the optimum $c_2/c_1=(\\beta(1+r))^{1/\\theta}=${fx(B.c2 / B.c1, 3)}$ and the budget holds: $c_1+c_2/(1+r)=${fx(B.c1 + B.c2 / (1 + r), 3)}=W=${fx(B.W, 3)}$ ✓. Saving $y_1-c_1$: ${fx(sA, 3)} → **${fx(sB, 3)}**${C ? ` (substitution ${fx(A.c1 - C.c1, 3)} more saving, income effect ${fx(C.c1 - B.c1, 3)}${C.c1 - B.c1 >= 0 ? ' also more saving, a borrower’s' : ' less saving, a lender’s'} extra wealth effect)` : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9', kind: 'Hypothesis', name: 'The permanent-income hypothesis',
      statement: String.raw`Households smooth consumption: they spend an annuity value of lifetime resources, so consumption depends on **permanent income** — the constant flow equivalent to current assets and expected future income — rather than on current income. If income is $y_t=P_t+\varepsilon_t$ with a permanent component $P_t$ (a random walk) and a transitory component $\varepsilon_t$ (here AR(1) with persistence $\rho$), a household with interest rate $r$ consumes
$$c_t=\frac{r}{1+r}a_t+P_t+\frac{r}{1+r-\rho}\,\varepsilon_t ,$$
so a one-unit permanent income shock raises consumption one-for-one, whereas a transitory shock raises it by only $r/(1+r-\rho)$, a few per cent, and the rest is saved.

Scope: certainty-equivalent behaviour (quadratic utility or no precautionary motive), perfect borrowing and lending, known income process; a hypothesis whose predictions have been tested and partly rejected (macro-2.13).`,
      idea: String.raw`It is the Fisher problem (macro-2.8) with many periods: the household can smooth over its whole life, so the marginal propensity to consume out of a shock equals the share of the extra wealth that is annuitised each period. For a permanent shock the present value is large — the whole stream of future income rises, $(1+r)/r$ times the shock — and the annuity of it is the shock itself. For a transitory shock the present value is of the order of the shock, whose annuity is only $r/(1+r-\rho)$ of it. Friedman (1957) used this to explain why the long-run consumption function is steeper than the short-run one. For the displayed range $r>0$ and $0\le\rho<1$, the geometric sum pma 3.26 gives $\sum_{j\ge0}(\rho/(1+r))^j=(1+r)/(1+r-\rho)$. Annuitising that present value by $r/(1+r)$ gives the coefficient $r/(1+r-\rho)$; setting $\rho=1$ instead gives one for a permanent shock. This uses the stated certainty-equivalent model and convergent discounted income sums, not a general precautionary-saving result.`,
      caption: String.raw`**Top:** one household's income $y_t$ (gold), its permanent component (dashed) and consumption (blue), which follows the permanent component and ignores most of the wiggle. **Bottom:** across 300 periods, the change in consumption plotted against the permanent shocks (blue) and against the transitory innovations (orange); the fitted slopes are the marginal propensities to consume. Switch the consumer to **consume current income** and both slopes become one. Press **resample** to draw new shocks.`,
      deps: ['macro-2.8', 'pma-3.26'], refs: ['Mankiw ch. 20', 'Romer ch. 8'], tags: ['consumption', 'permanent income'],
      credit: 'Milton Friedman, 1957',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Permanent_income_hypothesis' },
      viz(v) {
        const sp = v.slider('permanent shocks, s.d. (% of income)', 0, 6, 3, { step: 0.1 });
        const st_ = v.slider('transitory shocks, s.d. (% of income)', 0, 20, 10, { step: 0.5 });
        const rho = v.slider('persistence of transitory part $\\rho$', 0, 0.9, 0.3, { step: 0.05 });
        const rS = v.slider('interest rate $r$ (%)', 1, 8, 3, { step: 0.25 });
        const who = v.select('consumer', [{ value: 'pih', label: 'permanent-income' }, { value: 'cur', label: 'consume current income' }], 'pih');
        let seed = 5; v.button('resample', () => { seed += 1; });
        const T = 300, W = 80;
        const A = v.stage({ x: [0, W], y: [0.4, 1.8], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'period', ylabel: 'income, consumption' });
        const B = v.stage({ x: [-0.15, 0.15], y: [-0.12, 0.12], axes: 'box', gutter: true, height: 330, full: true, xlabel: 'shock to income', ylabel: 'change in consumption Δc', xticks: [-0.1, -0.05, 0, 0.05, 0.1].map((x) => [x, `${100 * x}%`]), yticks: [-0.1, -0.05, 0, 0.05, 0.1].map((x) => [x, `${100 * x}%`]) });
        v.legend([['gold', 'income y'], ['muted', 'permanent income P', { dash: true }], ['accent', 'consumption c'], ['blue', 'Δc vs permanent shock', { dot: true }], ['orange', 'Δc vs transitory innovation', { dot: true }]]);
        let res = {};
        v.render(() => {
          const r = rS.value / 100, rh = rho.value, mode = who.value, R = v.rng(seed);
          let P = 1, e = 0, a = 0, cPrev = null; const y = [], P_ = [], c = [], dP = [], dE = [], dC = [];
          for (let t = 0; t < T; t++) {
            const eta = (sp.value / 100) * gauss(R), inn = (st_.value / 100) * gauss(R);
            P = t === 0 ? 1 : P + eta; e = rh * e + (t === 0 ? 0 : inn);
            const yt = P + e;
            let ct = mode === 'cur' ? yt : (r / (1 + r)) * a + P + (r / (1 + r - rh)) * e;
            a = (1 + r) * (a + yt - ct);
            if (t > 0) { dP.push(eta); dE.push(inn); dC.push(ct - cPrev); }
            y.push(yt); P_.push(P); c.push(ct); cPrev = ct;
          }
          const ymin = Math.min(...y.slice(0, W), ...c.slice(0, W)) - 0.1, ymax = Math.max(...y.slice(0, W), ...c.slice(0, W)) + 0.1;
          A.setView([0, W], [ymin, ymax]);
          A.path(y.slice(0, W).map((q, i) => [i, q]), { color: 'gold', width: 2 });
          A.path(P_.slice(0, W).map((q, i) => [i, q]), { color: 'muted', width: 1.8, dash: [5, 4] });
          A.path(c.slice(0, W).map((q, i) => [i, q]), { color: 'accent', width: 3 });
          B.line(-0.15, -0.15, 0.15, 0.15, { color: 'faint', dash: [4, 4] }); B.text('slope 1', 0.1, 0.04, { color: 'faint', size: 11 });
          B.dots(dP.map((x, i) => [x, dC[i]]), { r: 3, color: 'blue', alpha: 0.6 }); B.dots(dE.map((x, i) => [x, dC[i]]), { r: 3, color: 'orange', alpha: 0.6 });
          const fP = ols(dP, dC), fE = ols(dE, dC);
          if (sp.value > 0.2) B.line(-0.15, fP.intercept - 0.15 * fP.slope, 0.15, fP.intercept + 0.15 * fP.slope, { color: 'blue', width: 2.4 });
          if (st_.value > 0.5) B.line(-0.15, fE.intercept - 0.15 * fE.slope, 0.15, fE.intercept + 0.15 * fE.slope, { color: 'orange', width: 2.4 });
          res = { fP, fE, th: r / (1 + r - rh), mode, sdc: ols(dP, dC) };
        });
        v.readout(() => {
          const { fP, fE, th, mode } = res;
          return `Fitted MPC out of a **permanent** shock: ${fx(fP.slope, 2)} (theory ${mode === 'pih' ? '1' : '1'}); out of a **transitory** innovation: ${fx(fE.slope, 2)} (theory ${mode === 'pih' ? `$r/(1+r-\\rho)=${fx(th, 3)}$` : '1'}).${mode === 'pih' ? ' Consumption is far smoother than income: the transitory part is almost entirely saved.' : ' A consumer who spends current income has no smoothing: consumption is as volatile as income.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10', kind: 'Hypothesis', name: 'The life-cycle hypothesis',
      statement: String.raw`Households choose consumption to be smooth over their whole lives. With a hump-shaped earnings profile that ends at retirement age $R$ and a horizon of $D$ years, consumption is roughly constant at the annuity value of lifetime resources, so people **borrow when young, save during their working years, and dissave in retirement**: wealth rises to a peak at retirement and falls to zero at death. At the level of the economy, national saving depends on the age structure. In a stationary population, the saving of the working generations is offset by the dissaving of the retired and net saving is zero; if the population is growing moderately (or the working-age share is rising), more people are in their saving years than in retirement and the aggregate saving rate is positive; an **ageing** population (slower growth, more retirees) lowers it. (If growth is so fast that the young, who borrow, dominate, the rate falls again.)

Scope: no bequests, no uncertainty, perfect capital markets, a stationary profile of incomes by age and equal discount and interest rates; illustrative earnings profile, not measured data.`,
      idea: String.raw`Combine the two-period consumption smoothing of macro-2.8 over many periods: the household's budget constraint is the present value of its earnings and pension against the present value of consumption over $D$ years, and the optimal flat consumption is the total present value divided by the sum of the discount factors. Wealth is the running sum of income minus consumption (with interest). Aggregation weights each age by its population share; with cohorts growing at rate $n$ the weight of age $a$ is $e^{-na}$, which tilts the population toward the young savers. Demographic transitions therefore change national saving (demo-5.2).`,
      caption: String.raw`**Left:** earnings $y$ (gold), flat consumption $c$ (blue) and wealth (green) by age; green shading marks saving, red dissaving. Drag **retirement age** and **life expectancy** (longer retirement means more saving to fund it) and the **pension**. **Right:** the economy-wide saving rate as a function of population growth: at $n=0$ it is exactly zero; it is positive for moderate growth, and negative for a shrinking population (many retirees) or very fast growth (many young borrowers). The dot follows the **population growth** slider.`,
      deps: ['macro-2.8', 'demo-5.2'], refs: ['Mankiw ch. 20'], tags: ['consumption', 'saving', 'demography'],
      credit: 'Franco Modigliani & Richard Brumberg, 1954; Albert Ando & Modigliani, 1963',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Life-cycle_hypothesis' },
      viz(v) {
        const Rt = v.slider('retirement age', 55, 75, 65, { step: 1, int: true });
        const Dt = v.slider('age at death', 70, 100, 85, { step: 1, int: true });
        const pen = v.slider('pension (% of final earnings)', 0, 100, 40, { step: 5 });
        const rS = v.slider('interest rate $r$ (%)', 0, 6, 2, { step: 0.25 });
        const nS = v.slider('population growth $n$ (% a year)', -2, 3, 0.5, { step: 0.1 });
        const A = v.stage({ x: [20, 100], y: [0, 14], axes: 'box', gutter: true, height: 340, weight: 1.35, xlabel: 'age', ylabel: 'per year (average earnings = 1)' });
        const B = v.stage({ x: [-2, 3], y: [-8, 4], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 240, xlabel: 'population growth n (% a year)', ylabel: 'national saving / income (%)' });
        v.legend([['gold', 'earnings + pension'], ['accent', 'consumption'], ['green', 'wealth (× average earnings)'], ['green', 'saving', { area: true }], ['red', 'dissaving', { area: true }]]);
        const hump = (a) => 0.35 + 1.55 * Math.exp(-(((a - 50) / 17) ** 2));
        let st = {};
        const solve = (R, D, penr, r) => {
          const ages = []; for (let a = 20; a < D; a++) ages.push(a);
          const last = hump(R - 1), y = ages.map((a) => (a < R ? hump(a) : (penr / 100) * last));
          const df = (a) => (1 + r) ** -(a - 20), PVy = ages.reduce((q, a, i) => q + y[i] * df(a), 0), ann = ages.reduce((q, a) => q + df(a), 0), c = PVy / ann;
          let w = 0; const W = [], S = [];
          ages.forEach((a, i) => { W.push(w); const sv = r * w + y[i] - c; S.push(sv); w += sv; });
          return { ages, y, c, W, S };
        };
        const agg = (m, n, r) => { let s = 0, inc = 0; m.ages.forEach((a, i) => { const wgt = Math.exp(-n * (a - 20)); s += wgt * m.S[i]; inc += wgt * (m.y[i] + r * m.W[i]); }); return (100 * s) / inc; };
        v.render(() => {
          const R = Rt.value, D = Math.max(Dt.value, R + 3), r = rS.value / 100, n = nS.value / 100;
          const m = solve(R, D, pen.value, r);
          const pts = m.ages.map((a, i) => [a, m.y[i]]);
          for (let i = 0; i < m.ages.length; i++) { const a = m.ages[i], y = m.y[i]; A.rect(a, Math.min(y, m.c), a + 1, Math.max(y, m.c), { fill: y >= m.c ? 'green' : 'red', fillAlpha: 0.22, stroke: false }); }
          A.path(m.ages.flatMap((a, i) => [[a, m.y[i]], [a + 1, m.y[i]]]), { color: 'gold', width: 2.6 });
          A.line(20, m.c, D, m.c, { color: 'accent', width: 3 });
          A.path(m.ages.map((a, i) => [a, m.W[i]]), { color: 'green', width: 2.6 });
          A.vline(R, { color: 'muted', dash: [4, 4] }); A.text('retirement', R, 13.2, { align: 'center', color: 'muted', size: 11 });
          A.vline(D, { color: 'faint', dash: [4, 4] }); A.text('death', D, 13.2, { align: 'center', color: 'muted', size: 11 });
          const peak = Math.max(...m.W);
          // aggregate
          const xs = []; for (let k = -2; k <= 3.001; k += 0.1) xs.push(k);
          B.path(xs.map((k) => [k, agg(m, k / 100, r)]), { color: 'accent', width: 3 });
          B.hline(0, { color: 'faint', dash: [4, 4] }); B.vline(0, { color: 'faint', dash: [4, 4] });
          B.dot(nS.value, agg(m, n, r), { color: 'gold', r: 8 });
          // share of population over R
          let old = 0, tot = 0; m.ages.forEach((a) => { const w = Math.exp(-n * (a - 20)); tot += w; if (a >= R) old += w; });
          st = { m, c: m.c, peak, S: agg(m, n, r), S0: agg(m, 0, r), old: old / tot, endW: m.W[m.W.length - 1] + m.S[m.S.length - 1], R, D };
        });
        v.readout(() => {
          const { c, peak, S, S0, old, endW, R, D } = st;
          return `Consumption is flat at ${fx(c, 2)} (average earnings = 1); wealth peaks at ${fx(peak, 1)} years of average earnings around age ${R} and is ${fx(endW, 3)} at death (age ${D}) ✓. Economy-wide saving rate: **${fx(S, 1)}%** at the chosen $n$ (**${fx(S0, 2)}%** at $n=0$: saving of the working is offset by dissaving of the retired). ${pc(old, 0)} of adults are retired.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11', kind: 'Theorem', name: 'The consumption Euler equation',
      statement: String.raw`A household that maximises $\sum_t\beta^{t}u(c_t)$ subject to the budget $a_{t+1}=(1+r)(a_t+y_t-c_t)$ and can borrow and lend at the real rate $r$ satisfies, at every date and at an interior optimum, the first-order condition
$$u'(c_t)=\beta(1+r)\,\mathbb E_t\,u'(c_{t+1}).$$
Under certainty the expectation drops out. For CRRA utility $u'(c)=c^{-\theta}$ this gives the consumption-growth rule
$$\frac{c_{t+1}}{c_t}=\bigl[\beta(1+r)\bigr]^{1/\theta},\qquad\Delta\ln c\approx\frac{r-\rho}{\theta}\quad(\beta=1/(1+\rho)),$$
so consumption rises when the interest rate exceeds the rate of time preference, at a speed set by the elasticity of intertemporal substitution $1/\theta$.

Scope: time-separable utility, no binding borrowing constraint, rational expectations.`,
      idea: String.raw`Perturb the optimum: cut $c_t$ by a small $\epsilon$, invest it, and consume the proceeds $(1+r)\epsilon$ next period. The loss in utility is $u'(c_t)\epsilon$; the gain is $\beta(1+r)u'(c_{t+1})\epsilon$. If they differ, the household gains by shifting, so at an optimum they are equal (the calculus of pma-5.8 applied to a concave objective on a budget line). Equality of marginal utilities, not of consumption levels, is the condition; with concave $u$ it implies smooth consumption only when $\beta(1+r)=1$. Under certainty, take logs of the exact positive CRRA growth ratio: $\Delta\ln c=[\ln(1+r)-\ln(1+\rho)]/\theta$. Taylor's theorem pma 5.15 gives $\ln(1+x)=x+O(x^2)$ near zero, so this becomes $(r-\rho)/\theta+O((r^2+\rho^2)/\theta)$ for fixed $\theta>0$. The displayed linear rule is a small-rate approximation; it is not the uncertain Euler equation with its expectation removed.`,
      caption: String.raw`**Left:** total utility $U(c_1)=u(c_1)+\beta u(c_2)$ along the budget line (resources fixed); drag the dot to choose consumption today and watch utility peak exactly at the Euler point. **Middle:** the two sides of the Euler equation as bars: the marginal cost of a unit moved to tomorrow, $u'(c_1)$, against its discounted return $\beta(1+r)u'(c_2)$; the bars are equal at the optimum and the tall bar tells which way to move. **Right:** consumption growth as a function of $r$ for several $\theta$.`,
      deps: ['macro-2.8', 'pma-5.8', 'pma-5.15'], refs: ['Romer ch. 8'], tags: ['consumption', 'optimisation', 'Euler equation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Euler_equation_(economics)' },
      viz(v) {
        const rS = v.slider('interest rate $r$ (%)', -2, 15, 5, { step: 0.25 });
        const bS = v.slider('patience $\\beta$', 0.8, 1, 0.97, { step: 0.005 });
        const tS = v.slider('curvature $\\theta$', 0.3, 4, 2, { step: 0.05 });
        const Y1 = 1, Y2 = 1;
        const A = v.stage({ x: [0.05, 2.1], y: [-6, 1], axes: 'box', gutter: true, height: 330, weight: 1.1, xlabel: 'consumption today c₁ (c₂ from the budget)', ylabel: 'total utility U' });
        const h = A.handle(1.1, 0, { color: 'gold', label: 'your choice', labelPos: 'ne' });
        const B = v.stage({ x: [0, 3], y: [0, 4], axes: 'box', gutter: true, height: 330, weight: 0.7, minWidth: 230, xlabel: '', ylabel: 'marginal utility', xticks: [] , title: 'the two sides of the Euler equation' });
        const C = v.stage({ x: [-2, 15], y: [-4, 10], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, xlabel: 'interest rate r (%)', ylabel: 'consumption growth (% per period)', title: 'consumption growth vs r' });
        let st = {};
        v.render(() => {
          const r = rS.value / 100, be = bS.value, th = tS.value, W = Y1 + Y2 / (1 + r), opt = fisher(Y1, Y2, r, be, th);
          const c2f = (c1) => (1 + r) * (W - c1), U = (c1) => { const c2 = c2f(c1); return c1 > 0 && c2 > 0 ? gU(c1, th) + be * gU(c2, th) : NaN; };
          const hi = Math.min(2.05, W * 0.99), lo = Math.max(0.06, W - 3 / (1 + r) * 0 - 0.0);
          const ymaxv = U(opt.c1);
          A.setView([0.05, Math.min(2.1, W)], [ymaxv - 1.4, ymaxv + 0.25]);
          A.fn(U, { color: 'accent', width: 3, domain: [0.06, hi], n: 300 });
          A.vline(opt.c1, { color: 'green', dash: [5, 4], width: 1.6 }); A.dot(opt.c1, ymaxv, { color: 'green', r: 5, hollow: true });
          const c1 = clamp(h.x, 0.08, hi); h.set(c1, U(c1));
          const c2 = c2f(c1), mu1 = c1 ** -th, mu2 = be * (1 + r) * c2 ** -th;
          // bars
          B.setView([0, 3], [0, Math.max(4, 1.2 * Math.max(mu1, mu2))]);
          B.rect(0.3, 0, 1.2, mu1, { fill: 'blue', fillAlpha: 0.5, color: 'blue' }); B.rect(1.7, 0, 2.6, mu2, { fill: 'orange', fillAlpha: 0.5, color: 'orange' });
          B.text("u′(c₁)", 0.75, 0, { align: 'center', baseline: 'top', dy: 4, color: 'blue', size: 12, weight: 650 }); B.text("β(1+r)·u′(c₂)", 2.15, 0, { align: 'center', baseline: 'top', dy: 4, color: 'orange', size: 12, weight: 650 });
          B.text(fx(mu1, 3), 0.75, mu1, { align: 'center', dy: -6, size: 12 }); B.text(fx(mu2, 3), 2.15, mu2, { align: 'center', dy: -6, size: 12 });
          // growth vs r
          for (const [t, col] of [[0.5, 'teal'], [1, 'accent'], [2, 'orange'], [4, 'purple']]) {
            C.fn((x) => 100 * (((be * (1 + x / 100)) ** (1 / t)) - 1), { color: col, width: Math.abs(t - th) < 0.06 ? 3 : 1.6, alpha: Math.abs(t - th) < 0.06 ? 1 : 0.55, domain: [-2, 15] });
            C.text(`θ = ${t}`, 15, 100 * ((be * 1.15) ** (1 / t) - 1), { align: 'right', dy: -7, color: col, size: 11 });
          }
          C.hline(0, { color: 'faint', dash: [4, 4] });
          C.dot(rS.value, 100 * ((be * (1 + r)) ** (1 / th) - 1), { color: 'gold', r: 7 });
          st = { opt, c1, c2, mu1, mu2, g: (be * (1 + r)) ** (1 / th) - 1, th, be, r };
        });
        v.readout(() => {
          const { opt, c1, c2, mu1, mu2, g } = st;
          const d = mu2 - mu1;
          return `Optimum: $c_1=${fx(opt.c1, 3)}$, $c_2=${fx(opt.c2, 3)}$, growth $[\\beta(1+r)]^{1/\\theta}-1=${fx(100 * g, 2)}\\%$. Your choice $c_1=${fx(c1, 3)}$: $u'(c_1)=${fx(mu1, 3)}$ vs $\\beta(1+r)u'(c_2)=${fx(mu2, 3)}$ → ${Math.abs(d) < 0.01 ? '**equal: the Euler equation holds**' : d > 0 ? 'moving a unit to tomorrow pays more than it costs: **save more**' : 'a unit moved to tomorrow earns less than it costs: **consume more today**'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12', kind: 'Theorem', name: 'Hall’s random walk of consumption',
      statement: String.raw`If households maximise expected lifetime utility with quadratic utility and $\beta(1+r)=1$, the Euler equation (macro-2.11) becomes $\mathbb E_t\,c_{t+1}=c_t$: consumption is a **martingale**,
$$c_{t+1}=c_t+\varepsilon_{t+1},\qquad \mathbb E_t\,\varepsilon_{t+1}=0,$$
and no variable known at date $t$ — in particular lagged income or its growth — helps to predict the change in consumption. The only news is the innovation $\varepsilon_{t+1}$, the revision of permanent income. With CRRA utility the same holds for $\Delta\ln c$ up to a constant and a small variance term.

Scope: rational expectations, no binding liquidity constraints, a representative consumer. A regression of $\Delta c_t$ on $\Delta y_{t-1}$ is Hall's test; a significantly positive coefficient is called **excess sensitivity** (macro-2.13).`,
      idea: String.raw`Under the Euler equation the best forecast of tomorrow's consumption is today's, because the household has already set its level to use all the information it has — including the predictable part of income. So any variable known at $t$, such as last quarter's income growth, has zero coefficient in the regression of $\Delta c_{t+1}$. Hall (1978) ran exactly this test on U.S. data and found that lagged income did not matter, while a stock-price index did (a sign of news arriving). Later work with longer samples finds a positive coefficient on income growth, of roughly 0.4–0.5 for U.S. data (lower in some other countries) for the share of "rule-of-thumb" consumers (Campbell and Mankiw, 1989). With quadratic marginal utility $u\prime(c)=a-bc$, $b>0$, conditional linearity in prob 4.1.9 turns the Euler equation at $\beta(1+r)=1$ into $E[c_{t+1}\mid\mathcal F_t]=c_t$, assuming integrable consumption. For a date-t measurable predictor Z with the required integrable products, taking out what is known (prob 4.1.14) gives $E[Z\Delta c_{t+1}\mid\mathcal F_t]=Z E[\Delta c_{t+1}\mid\mathcal F_t]=0$. Averaging gives the zero predictor moment; finite second moments and nonsingular regressor covariance then give zero population regression slopes. Innovations need not be independent or have constant variance.`,
      caption: String.raw`Choose **simulation** or **U.S. data**. In the simulation, income growth is predictable (positive autocorrelation) and a share $\lambda$ of households simply spend their income; the PIH consumers (share $1-\lambda$) follow the random walk. **Top:** the series; **bottom:** the regression of $\Delta\ln c_t$ on $\Delta\ln y_{t-1}$. With $\lambda=0$ the fitted slope is zero up to sampling error (resample to see it scatter around zero); raise $\lambda$ and it appears. The U.S. data (real personal consumption and real disposable income, quarterly 1947–2026) are regressed honestly in the browser.`,
      deps: ['macro-2.11', 'prob-4.1.9', 'prob-4.1.14'], refs: ['Romer ch. 8', 'Mankiw ch. 20'], tags: ['consumption', 'rational expectations', 'martingale'],
      credit: 'Robert E. Hall, 1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Random_walk_model_of_consumption' },
      viz(v) {
        const src = v.select('source', [{ value: 'sim', label: 'simulation' }, { value: 'us', label: 'U.S. data 1947–2026' }], 'sim');
        const lam = v.slider('share of rule-of-thumb consumers $\\lambda$', 0, 1, 0, { step: 0.05 });
        const phi = v.slider('predictability of income growth $\\phi$', 0, 0.8, 0.4, { step: 0.05 });
        let seed = 21; v.button('resample', () => { seed += 1; });
        const A = v.stage({ x: [0, 100], y: [-3, 3], axes: 'box', gutter: true, height: 270, full: true, xlabel: 'quarter', ylabel: 'growth, % per quarter' });
        const B = v.stage({ x: [-3, 3], y: [-3, 3], axes: 'box', gutter: true, height: 340, full: true, xlabel: 'income growth last quarter  Δln y(t−1), %', ylabel: 'consumption growth  Δln c(t), %' });
        v.legend([['gold', 'income growth'], ['accent', 'consumption growth']]);
        const us = (() => { const n = CY_US.length / 2, c = [], y = []; for (let i = 1; i < n; i++) { c.push(100 * Math.log(CY_US[2 * i] / CY_US[2 * i - 2])); y.push(100 * Math.log(CY_US[2 * i + 1] / CY_US[2 * i - 1])); } return { c, y }; })();
        let res = {};
        v.render(() => {
          let dc, dy, label;
          if (src.value === 'us') { dc = us.c; dy = us.y; label = 'U.S. 1947Q2–2026Q2'; lam.el.hidden = true; phi.el.hidden = true; }
          else {
            lam.el.hidden = false; phi.el.hidden = false;
            const R = v.rng(seed), n = 400, ph = phi.value, l = lam.value; dy = []; dc = []; let g = 0.5;
            const kappa = 1 / (1 - ph * 0.25);
            for (let t = 0; t < n; t++) { const e = 0.9 * gauss(R); g = 0.5 * (1 - ph) + ph * g + e; dy.push(g); dc.push(0.5 + (1 - l) * (kappa * e + 0.25 * gauss(R)) + l * g - 0.5 * l + 0.0); }
            label = `simulation, ${n} quarters`;
          }
          const x = dy.slice(0, -1), yv = dc.slice(1), f = ols(x, yv);
          const show = src.value === 'us' ? 100 : 100, off = src.value === 'us' ? dc.length - 100 : 0;
          A.setView([0, 100], src.value === 'us' ? [-9, 9] : [-3.2, 4.2]);
          A.path(dy.slice(off, off + show).map((q, i) => [i, q]), { color: 'gold', width: 1.8 }); A.path(dc.slice(off, off + show).map((q, i) => [i, q]), { color: 'accent', width: 2.4 });
          if (src.value === 'us') A.text(`the most recent 100 quarters (to 2026 Q2)`, 2, 8, { color: 'muted', size: 11 });
          B.setView([-3, 3], [-3, 3]);
          const idx = x.map((q, i) => i).filter((i) => Math.abs(x[i]) < 3.2 && Math.abs(yv[i]) < 3.2);
          B.dots(idx.map((i) => [x[i], yv[i]]), { r: 2.6, color: 'accent', alpha: 0.5 });
          B.line(-3, f.intercept - 3 * f.slope, 3, f.intercept + 3 * f.slope, { color: 'red', width: 2.8 });
          B.hline(f.intercept, { color: 'faint', dash: [4, 4] });
          res = { f, label, n: x.length };
        });
        v.readout(() => {
          const { f, label, n } = res;
          return `${label} (n = ${n}): $\\Delta\\ln c_t=${fx(f.intercept, 2)}+${fx(f.slope, 3)}\\,\\Delta\\ln y_{t-1}$, standard error ${fx(f.se, 3)}, $t=${fx(f.t, 1)}$, $R^2=${fx(f.r2, 3)}$. Hall's theorem predicts a slope of **zero**; ${Math.abs(f.t) < 2 ? 'here it cannot be distinguished from zero.' : 'here it is significantly different from zero: excess sensitivity.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13', kind: 'Phenomenon', name: 'Excess sensitivity and hand-to-mouth consumers',
      statement: String.raw`Consumption responds to **predictable** changes in income, which the permanent-income model with perfect borrowing and lending (macro-2.12) says it should not. The cleanest evidence is the response to tax rebates, which arrive on a date known months ahead: many households raise spending sharply when the money arrives, not when it is announced, and the response is largest among households with little liquid wealth. A model that matches this mixes **unconstrained** permanent-income households with **hand-to-mouth** households, who spend their income as it comes (because they are liquidity constrained or hold illiquid wealth), and with present-biased households who spend windfalls on receipt.

Scope: stylised mixture model, with the parameters (population shares, extent of present bias) illustrative; empirical estimates of the share of a rebate spent within a few months vary by study, sample and definition of spending.`,
      idea: String.raw`The Euler equation (macro-2.11) holds only for households who can move resources through time: a household that can neither borrow nor has liquid savings has a binding constraint, so its marginal propensity to consume out of income it can foresee is one. Aggregate consumption therefore moves with predictable income in proportion to the hand-to-mouth share (Campbell–Mankiw's $\lambda$ of macro-2.12). Present bias (behav-5.5) adds a second route: a household that values the present more than its own long-run plan spends windfalls early. Rebate studies (Johnson, Parker and Souleles for the 2001 rebates; Parker and co-authors for 2008) find that a considerable fraction of the rebate is spent in the quarter it arrives.`,
      caption: String.raw`A rebate is **announced** in quarter 0 and **paid** in quarter 2. Bars show aggregate extra spending per quarter as a fraction of the rebate, stacked by household type; the dashed line is what the pure permanent-income model predicts (a tiny, spread-out response with no jump at receipt). Drag the **population shares** of hand-to-mouth and present-biased households and the **present bias**. **Right:** spending in the quarter of receipt as a function of the hand-to-mouth share, against the range of empirical estimates for the 2001 and 2008 rebates.`,
      deps: ['macro-2.12', 'behav-5.5'], refs: ['Romer ch. 8'], tags: ['consumption', 'liquidity constraints', 'fiscal policy'],
      credit: 'Campbell & Mankiw, 1989; Johnson, Parker & Souleles, 2006',
      viz(v) {
        const hS = v.slider('hand-to-mouth households (share)', 0, 0.7, 0.25, { step: 0.01 });
        const pS = v.slider('present-biased households (share)', 0, 0.5, 0.15, { step: 0.01 });
        const bS = v.slider('present bias $\\beta$ (1 = none)', 0.4, 1, 0.7, { step: 0.01 });
        const A = v.stage({ x: [-0.5, 6.5], y: [0, 0.6], axes: 'box', gutter: true, height: 340, weight: 1.3, xlabel: 'quarter (rebate announced at 0, paid at 2)', ylabel: 'extra spending / rebate', xticks: [0, 1, 2, 3, 4, 5, 6].map((x) => [x, String(x)]) });
        const B = v.stage({ x: [0, 0.7], y: [0, 0.8], axes: 'box', gutter: true, height: 340, weight: 0.8, minWidth: 240, xlabel: 'hand-to-mouth share', ylabel: 'spent in the quarter of receipt', xticks: [0, 0.2, 0.4, 0.6].map((x) => [x, `${100 * x}%`]), yticks: [0, 0.2, 0.4, 0.6, 0.8].map((x) => [x, `${100 * x}%`]) });
        v.legend([['green', 'unconstrained (PIH)', { area: true }], ['red', 'hand-to-mouth', { area: true }], ['purple', 'present-biased', { area: true }], ['ink', 'PIH-only prediction', { dash: true }]]);
        const H = 40, pihQ = 1 / H; // an unconstrained household spreads a windfall over about 40 quarters (illustrative horizon)
        const mpc = (h, p, b) => (1 - h - p) * pihQ + h * 1 + p * (1 - b);
        let st = {};
        v.render(() => {
          const h = hS.value, p = pS.value, b = bS.value, u = 1 - h - p;
          for (let q = 0; q <= 6; q++) {
            const pih = q >= 0 ? u * pihQ : 0, htm = q === 2 ? h : 0, pb = q === 2 ? p * (1 - b) : q > 2 ? p * pihQ : q === 0 || q === 1 ? 0 : 0;
            A.rect(q - 0.3, 0, q + 0.3, pih, { fill: 'green', fillAlpha: 0.6, color: 'green' });
            A.rect(q - 0.3, pih, q + 0.3, pih + htm, { fill: 'red', fillAlpha: 0.6, color: 'red' });
            A.rect(q - 0.3, pih + htm, q + 0.3, pih + htm + pb, { fill: 'purple', fillAlpha: 0.6, color: 'purple' });
            A.line(q - 0.38, pihQ, q + 0.38, pihQ, { color: 'ink', width: 1.6, dash: [4, 3] });
          }
          A.vline(0, { color: 'muted', dash: [3, 4], width: 1 }); A.text('announcement', 0.08, 0.57, { color: 'muted', size: 11 });
          A.vline(2, { color: 'muted', dash: [3, 4], width: 1 }); A.text('rebate arrives', 2.08, 0.57, { color: 'muted', size: 11 });
          B.rect(0, 0.2, 0.7, 0.4, { fill: 'gold', fillAlpha: 0.15, stroke: false }); B.text('typical estimates', 0.015, 0.395, { size: 11, color: 'muted' });
          B.path([0, 0.7].map((x) => [x, mpc(x, p, b)]), { color: 'accent', width: 3 });
          B.dot(h, mpc(h, p, b), { color: 'gold', r: 8 });
          st = { h, p, b, u, at2: mpc(h, p, b) - 0 };
        });
        v.readout(() => {
          const { h, p, b, u, at2 } = st;
          return `Spent in the quarter of receipt: **${pc(at2, 0)}** of the rebate (${pc(u * pihQ, 1)} from unconstrained, ${pc(h, 0)} from hand-to-mouth, ${pc(p * (1 - b), 0)} from present-biased). The permanent-income model predicts only ${pc(pihQ, 1)} and, above all, **no jump** at receipt, since the money was announced two quarters earlier. Empirical estimates for U.S. rebates (shaded band) are roughly 20–40% of the rebate spent on non-durable goods within the quarter of receipt for 2001 (Johnson, Parker and Souleles) and somewhat lower, about 12–30%, for 2008 (Parker and co-authors); the shaded band is the 2001 range, and spending on durables raises the totals considerably.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14', kind: 'Paper', name: 'A Theory of Production',
      paper: { authors: 'Charles W. Cobb and Paul H. Douglas', year: 1928, title: 'A Theory of Production', venue: 'American Economic Review 18 (1, Supplement): 139–165', url: 'https://www.jstor.org/stable/1811556' },
      introduces: ['macro-2.1'],
      statement: String.raw`Cobb and Douglas fitted an aggregate production function to annual U.S. manufacturing data for 1899–1922, with indexes (1899 = 100) of fixed capital $C$, employed labour $L$ and physical product $P$, imposing constant returns to scale. Their estimate was
$$P=1.01\,L^{3/4}\,C^{1/4},$$
with the labour exponent close to labour's share of the product in the national data, so that the exponents could be read as the factors' marginal-productivity shares. In modern terms: output elasticities of $0.75$ for labour and $0.25$ for capital, together summing to one.

Scope: a single time series of one sector over 24 years, in which capital, labour and output all trend upwards together (so the fit is dominated by common trends); it is not evidence on the production function's form beyond that.`,
      idea: String.raw`Economists had long argued that each factor earns its marginal product, and Wicksell and earlier writers had used functions of this form, but no one had measured one. Douglas, with the mathematician Cobb, fitted $\log P-\log L$ on $\log C-\log L$ and found a slope near $1/4$ and a good fit; their idea was that the same exponent was the share of labour in national income (macro-2.2), so a function with constant exponents "explains" the stability of factor shares. The paper introduced the **Cobb–Douglas** form (macro-2.1) that became the workhorse of growth and macroeconomics, and also the practice of testing a production function against data. Its limits were noted at once (no price data, spurious trends, aggregation), and the later question of why the share fell below $0.75$ is the subject of macro-2.2.`,
      caption: String.raw`**Left:** the indexes of capital (orange), labour (purple) and product (blue) for 1899–1922, with the fitted $P^*=b\,L^{k}C^{1-k}$ in green; the product index and the fit track each other. Drag the **labour exponent** $k$ away from $3/4$ and the fit worsens; the **right** panel plots the root-mean-square log error against $k$, with its minimum near the paper's value. Choose whether the constant $b$ is the paper's 1.01 or refitted for each $k$. The three series are the 1899–1922 indexes of the paper's table, as reproduced in textbooks and course handouts.`,
      deps: ['micro-7.1', 'micro-7.5'], refs: [], tags: ['production', 'history', 'econometrics'],
      credit: 'Charles W. Cobb & Paul H. Douglas, 1928',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cobb%E2%80%93Douglas_production_function' },
      viz(v) {
        const kS = v.slider('labour exponent $k$ (capital gets $1-k$)', 0.3, 1, 0.75, { step: 0.01 });
        const bm = v.select('constant $b$', [{ value: 'paper', label: 'paper’s 1.01' }, { value: 'refit', label: 're-fitted for each k' }], 'paper');
        const N = CD.P.length, yrs = Array.from({ length: N }, (_, i) => 1899 + i);
        const lg = (a) => a.map((x) => Math.log(x));
        const lC = lg(CD.C), lL = lg(CD.L), lP = lg(CD.P);
        const rms = (k, b) => Math.sqrt(lP.reduce((q, y, i) => q + (y - Math.log(b) - k * lL[i] - (1 - k) * lC[i]) ** 2, 0) / N);
        const bfit = (k) => Math.exp(lP.reduce((q, y, i) => q + (y - k * lL[i] - (1 - k) * lC[i]), 0) / N);
        const free = ols(lC.map((c, i) => c - lL[i]), lP.map((p, i) => p - lL[i]));
        const A = v.stage({ x: [1899, 1922], y: [0, 450], axes: 'box', gutter: true, height: 340, weight: 1.35, xlabel: 'year', ylabel: 'index (1899 = 100)' });
        const B = v.stage({ x: [0.3, 1], y: [0, 30], axes: 'box', gutter: true, height: 340, weight: 0.85, minWidth: 240, xlabel: 'labour exponent k', ylabel: 'RMS error of the fit (%)', title: 'fit quality vs the exponent' });
        v.legend([['orange', 'capital C'], ['purple', 'labour L'], ['blue', 'product P (data)'], ['green', 'fitted P*']]);
        const share = pairs(LABSHARE_PWT);
        let st = {};
        v.render(() => {
          const k = kS.value, b = bm.value === 'paper' ? 1.01 : bfit(k), fit = yrs.map((_, i) => b * CD.L[i] ** k * CD.C[i] ** (1 - k));
          A.path(yrs.map((y, i) => [y, CD.C[i]]), { color: 'orange', width: 2 }); A.path(yrs.map((y, i) => [y, CD.L[i]]), { color: 'purple', width: 2 });
          A.path(yrs.map((y, i) => [y, CD.P[i]]), { color: 'blue', width: 3 }); A.path(yrs.map((y, i) => [y, fit[i]]), { color: 'green', width: 2.8, dash: [6, 4] });
          A.dots(yrs.map((y, i) => [y, CD.P[i]]), { r: 3, color: 'blue' });
          for (const [lab, arr, col] of [['C', CD.C, 'orange'], ['L', CD.L, 'purple']]) A.text(lab, 1922, arr[N - 1], { dx: 8, align: 'left', color: col, size: 12, weight: 650 });
          A.text('P', 1922, CD.P[N - 1], { dx: 8, align: 'left', color: 'blue', size: 12, weight: 650 });
          B.path(Array.from({ length: 71 }, (_, i) => 0.3 + i * 0.01).map((kk) => [kk, 100 * rms(kk, bm.value === 'paper' ? 1.01 : bfit(kk))]), { color: 'accent', width: 3 });
          B.vline(0.75, { color: 'muted', dash: [4, 4] }); B.text('paper: 0.75', 0.75, 28, { dx: 6, color: 'muted', size: 11 });
          B.dot(k, 100 * rms(k, b), { color: 'gold', r: 8 });
          st = { k, b, e: rms(k, b), e75: rms(0.75, 1.01), fit22: fit[N - 1] };
        });
        v.readout(() => {
          const { k, b, e, e75, fit22 } = st, last = share[share.length - 1];
          return `Fit $P^*=${fx(b, 3)}\\,L^{${fx(k, 2)}}C^{${fx(1 - k, 2)}}$: RMS log error **${fx(100 * e, 1)}%** (the paper's 0.75 with 1.01: ${fx(100 * e75, 1)}%); 1922 fit ${fx(fit22, 0)} vs data 240. Check on the typed data: unconstrained regression gives capital exponent ${fx(free.slope, 3)} (so labour ${fx(1 - free.slope, 3)}) and constant ${fx(Math.exp(free.intercept), 3)}, matching the published 1/4, 3/4 and 1.01. **Then and now:** the paper's labour exponent 0.75 against the U.S. labour share of GDP of ${pc(last[1], 0)} in ${last[0]} (Penn World Table; macro-2.2).`;
        });
      },
    },
  ],
};
