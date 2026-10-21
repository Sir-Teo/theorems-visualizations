// Finance — Chapter 3: Risk, return and mean–variance portfolios (items 3.8–3.14; 3.1–3.7 are in ch03.js, 3.15 in ch03-papers.js)
//
// Sources and honesty notes (verified Oct 2026 against Crossref / publisher pages): Tobin, Review of Economic Studies 25(2):65– (1958);
// Merton, J. Financial and Quantitative Analysis 7(4):1851–1872 (1972); Cass & Stiglitz, J. Economic Theory 2(2):122–160 (1970);
// Sharpe, J. Business 39(1, supplement):119– (1966) and J. Portfolio Management 21(1):49–58 (1994); Michaud, Financial Analysts Journal
// 45(1):31–42 (1989); Chamberlain, J. Economic Theory 29(1):185–201 (1983). Real pictures (3.7-style frontiers, 3.12, 3.13) use the
// monthly returns of Kenneth R. French's ten industry portfolios, the market and the T-bill rate (1963-07 … 2026-08; see ch04.shared.js).
// 3.8–3.11, 3.14 and the simulation panel of 3.13 are models (the five-industry inputs are in-sample estimates; the utility models are stylised).
import { clamp, pct, fx, sg, pctTicks, data, marketTotal, mean, sdev, solveLin, matVec, dot, quad, frontierConsts, frontierSd, frontierWeights, tangency, minVarLong, longFrontier, universe, covOf, gmv, mvLong, rng, fanLabels, idxOf, IND_NAMES, IND_LONG } from './ch03.shared.js';

const ptk = (lo, hi, step) => pctTicks(Math.ceil(lo / step - 1e-9) * step, hi, step);
const sq = (x) => x * x;
const COL = ['blue', 'orange', 'green', 'purple', 'teal', 'pink', 'red', 'gold'];
const SET5 = [0, 4, 3, 8, 5]; // NoDur HiTec Enrgy Utils Telcm
function idxLabel(i) { const k = 6 + i, y = 1963 + Math.floor(k / 12), m = (k % 12) + 1; return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`; }

// frontier engine for a fixed set of industries (cached): free (hyperbola) and long-only frontiers
const ENG = {};
function eng(idx) {
  const key = idx.join();
  if (ENG[key]) return ENG[key];
  const U = universe(idx), F = frontierConsts(U.mu, U.S), lf = longFrontier(U.mu, U.S, 80);
  const interp = (E) => { for (let i = 1; i < lf.length; i++) if (E <= lf[i].E) { const t = (E - lf[i - 1].E) / (lf[i].E - lf[i - 1].E || 1); return lf[i - 1].sd + t * (lf[i].sd - lf[i - 1].sd); } return lf[lf.length - 1].sd; };
  const e = {
    U, F, lf, m0: F.b / F.a, mMax: Math.max(...U.mu),
    lo: (ex) => (ex ? e.m0 : lf[0].E), hi: (ex) => (ex ? e.mMax + 0.04 : e.mMax),
    sd: (E, ex) => (ex ? frontierSd(F, E) : interp(E)),
    w: (E, ex) => (ex ? frontierWeights(F, E) : minVarLong(E, U.mu, U.S) || U.mu.map(() => 0)),
    view(ex) { const lo = Math.min(...U.mu), hi = Math.max(...U.mu), xl = Math.min(...U.sd) * 0.8, xh = Math.max(...U.sd) * (ex ? 1.7 : 1.18), yl = lo - (ex ? 0.03 : 0.012), yh = hi + (ex ? 0.045 : 0.012); return { x: [xl, xh], y: [yl, yh] }; },
  };
  ENG[key] = e; return e;
}
function hyper(S, F, m0, yl, yh, ex) { // both branches of the hyperbola, as point arrays
  const up = [], dn = [];
  for (let q = 0; q <= 120; q++) { const m = m0 + (q / 120) * (yh - m0), m2 = m0 - (q / 120) * (m0 - yl); up.push([frontierSd(F, m), m]); dn.push([frontierSd(F, m2), m2]); }
  return { up, dn };
}
function drawFrontier(L, e, ex, opts = {}) {
  const V = e.view(ex); L.setView(V.x, V.y); L.setTicks(ptk(V.x[0], V.x[1], 0.05), ptk(V.y[0], V.y[1], ex ? 0.04 : 0.01));
  if (ex) { const h = hyper(e.U.S, e.F, e.m0, V.y[0], V.y[1], ex); L.path(h.up, { color: opts.color || 'accent', width: 2.8 }); L.path(h.dn, { color: opts.color || 'accent', width: 1.6, dash: [6, 4] }); }
  else L.path(e.lf.map((p) => [p.sd, p.E]), { color: 'green', width: 3 });
  e.U.sd.forEach((s, i) => { L.dot(s, e.U.mu[i], { r: 4, color: 'ink' }); L.text(e.U.names[i], s, e.U.mu[i], { dx: 7, dy: -3, align: 'left', size: 10.5, color: 'muted', weight: 600 }); });
  return V;
}
/** Grouped bars: groups[k] = array of values for series k, colour list; x positions 1..n. */
function groupBars(S, groups, colors, w = 0.7) {
  const k = groups.length, bw = w / k;
  groups.forEach((g, s) => g.forEach((val, i) => { const x0 = i + 1 - w / 2 + s * bw; S.rect(x0 + 0.04, 0, x0 + bw - 0.04, val, { fill: colors[s], fillAlpha: 0.8, stroke: false }); }));
}

export default {
  collection: 'fin',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Theorem',
      name: 'Two-fund separation',
      statement: String.raw`If short sales are allowed, any two distinct portfolios $w^{(1)}\ne w^{(2)}$ on the minimum-variance frontier (with different means) generate the whole frontier: every frontier portfolio is $a\,w^{(1)}+(1-a)\,w^{(2)}$ for a real number $a$, and every such combination (weights summing to $1$) lies on the frontier. Hence investors who want frontier portfolios need only two mutual funds.

Scope: unrestricted weights and known means and covariances. With sign constraints the frontier is only piecewise a combination of the same two funds, and mixtures of two long-only efficient portfolios generally fall short of the long-only frontier.`,
      idea: String.raw`The frontier weights are affine in the target mean: $w(m)=\lambda(m)\Sigma^{-1}\mathbf 1+\gamma(m)\Sigma^{-1}\mu$ with $\lambda,\gamma$ affine in $m$ (fin-3.7). An affine map of the real line into $\mathbb R^n$ is determined by two of its values, so two frontier portfolios with different means, $w(m_1)$ and $w(m_2)$, give $w(m)=a\,w(m_1)+(1-a)\,w(m_2)$ with $a=(m_2-m)/(m_2-m_1)$, and conversely any such combination equals $w(m)$ for the mean $m=a m_1+(1-a)m_2$. With inequality constraints the map is no longer affine over the whole range, which is why the long-only case fails. Merton (1972) proved the mutual-fund form of this result and Cass and Stiglitz (1970) gave conditions on preferences and returns under which it holds beyond mean–variance.`,
      caption: String.raw`The five **real** industry portfolios of fin-3.7 (NoDur, HiTec, Enrgy, Utils, Telcm; in-sample 1963–2026). Drag **fund 1** and **fund 2** (they stay on the frontier) and slide the **mixing weight** $a$: the gold point is $a\cdot$fund 1 $+(1-a)\cdot$fund 2; with short selling allowed it never leaves the frontier and the readout's gap is $0$. **Switch short selling off**: the funds are now long-only efficient portfolios, and their mixes drift off the long-only frontier (red gap). The weight bars (right) show the two funds and the mix.`,
      deps: ['fin-3.7'],
      refs: ['Luenberger: Mean–Variance Portfolio Theory'],
      tags: ['mutual funds', 'frontier'],
      credit: 'Merton, 1972; Cass & Stiglitz, 1970 (generalisation)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mutual_fund_separation_theorem' },
      viz(v) {
        const E = eng(SET5), U = E.U;
        const short = v.toggle('allow short selling', true);
        const a = v.slider('mixing weight $a$ (in fund 1)', -0.5, 1.5, 0.5, { step: 0.01 });
        const L = v.stage({ x: [0.1, 0.3], y: [0.08, 0.2], axes: 'box', gutter: true, height: 350, weight: 1.4, minWidth: 300, xlabel: 'risk σ (annual)', ylabel: 'mean return', title: 'the frontier and a mix of two funds' });
        const W = v.stage({ x: [0.4, 5.6], y: [-1, 2], axes: 'box', gutter: true, height: 350, weight: 1, minWidth: 250, xlabel: 'asset', ylabel: 'weight', title: 'weights' });
        const snap = (y) => { const ex = short.value, Ey = clamp(y, E.lo(ex) + 1e-4, E.hi(ex) - 1e-4); return [E.sd(Ey, ex), Ey]; };
        const h1 = L.handle(0.14, 0.125, { color: 'blue', label: 'fund 1', constrain: (x, y) => snap(y) });
        const h2 = L.handle(0.2, 0.165, { color: 'orange', label: 'fund 2', constrain: (x, y) => snap(y) });
        let st = null;
        v.render(() => {
          const ex = short.value, V = drawFrontier(L, E, ex);
          const e1 = clamp(h1.y, E.lo(ex) + 1e-4, E.hi(ex) - 1e-4), e2 = clamp(h2.y, E.lo(ex) + 1e-4, E.hi(ex) - 1e-4);
          h1.set(...snap(e1)); h2.set(...snap(e2));
          const w1 = E.w(e1, ex), w2 = E.w(e2, ex), aa = a.value, wm = w1.map((x, i) => aa * x + (1 - aa) * w2[i]);
          const Em = dot(wm, U.mu), sm = Math.sqrt(quad(wm, U.S));
          L.line(h1.x, h1.y, h2.x, h2.y, { color: 'faint', width: 1.2, dash: [3, 3] });
          let gap = NaN;
          if (ex || (Em >= E.lo(false) && Em <= E.hi(false))) {
            const sf = E.sd(Em, ex); gap = sm - sf;
            if (Math.abs(gap) > 1e-6) { L.line(sf, Em, sm, Em, { color: 'red', width: 2 }); L.dot(sf, Em, { r: 4, color: 'red', hollow: true }); }
          }
          L.dot(sm, Em, { r: 7, color: 'gold' }); L.text('mix', sm, Em, { dx: 12, dy: 6, align: 'left', size: 12, color: 'gold', weight: 700, plate: true });
          const all = [...w1, ...w2, ...wm], lo = Math.min(0, ...all) - 0.1, hi = Math.max(0.5, ...all) + 0.1;
          W.setView([0.4, 5.6], [lo, hi]); W.setTicks(U.names.map((nm, i) => [i + 1, nm]), null);
          groupBars(W, [w1, w2, wm], ['blue', 'orange', 'gold']); W.hline(0, { color: 'ink', width: 1 });
          st = { gap, ex, Em, sm, neg: wm.some((x) => x < -1e-9), e1, e2 };
        });
        v.legend([['blue', 'fund 1'], ['orange', 'fund 2'], ['gold', 'mix'], ['red', 'gap to the frontier']]);
        v.readout(() => `fund 1: mean ${pct(st.e1, 2)} · fund 2: mean ${pct(st.e2, 2)} · mix: mean ${pct(st.Em, 2)}, σ ${pct(st.sm, 3)} · ${Number.isNaN(st.gap) ? 'the mix lies outside the range of the long-only frontier' : `distance of the mix from the ${st.ex ? '' : 'long-only '}frontier: ${fx(100 * st.gap, 4)} points of σ ${Math.abs(st.gap) < 1e-6 ? '(on the frontier)' : '(it is not efficient)'}`}${!st.ex && st.neg ? ' · the mix needs short positions, which long-only investors cannot hold' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Definition',
      name: 'The global minimum-variance portfolio',
      statement: String.raw`The **global minimum-variance portfolio** has the least variance among all portfolios whose weights sum to one, whatever their mean. With short sales allowed and $\Sigma$ positive definite it is unique,
$$w_{\rm gmv}=\frac{\Sigma^{-1}\mathbf 1}{\mathbf 1^{\top}\Sigma^{-1}\mathbf 1},\qquad \sigma^2_{\rm gmv}=\frac1{\mathbf 1^{\top}\Sigma^{-1}\mathbf 1},$$
the vertex of the frontier. Its weights depend only on $\Sigma$, **not** on the expected returns; every asset has the same marginal contribution to risk, $(\Sigma w_{\rm gmv})_i=\sigma_{\rm gmv}^2$ for all $i$.

Scope: weights unrestricted; with sign constraints the minimiser has some zero weights and the equal-marginal-risk property holds only for the assets actually held.`,
      idea: String.raw`Minimise $w^{\top}\Sigma w$ subject to $\mathbf 1^{\top}w=1$ with a Lagrange multiplier (micro-5.4): $2\Sigma w=\lambda\mathbf 1$, so $w\propto\Sigma^{-1}\mathbf 1$, normalised to sum $1$. The first-order condition says that moving a little wealth from one asset to another must not change the variance, which is the equality of the marginal contributions $(\Sigma w)_i$. Because $\mu$ never enters, the portfolio is the vertex of the frontier (fin-3.7) at whatever mean that happens to be; this is why practitioners like it, since covariances are estimated far more precisely than means (fin-3.13).`,
      caption: String.raw`Five **real** industry portfolios (in-sample 1963–2026). The **noise** slider adds random errors (a fixed pattern, rescaled; **resample** draws a new pattern) to the expected returns. **Left**: the frontier moves (orange) but its vertex stays at the same risk (vertical green line). **Middle**: the weights of the minimum-variance portfolio (blue) do not move at all, while the weights of the tangency portfolio for a 3% riskless rate (grey: true means, orange: with errors) jump about. **Right**: the marginal contributions $(\Sigma w)_i$ of the minimum-variance portfolio are equal, to $\sigma^2_{\rm gmv}$.`,
      deps: ['fin-3.7', 'micro-5.4'],
      refs: ['Luenberger: Mean–Variance Portfolio Theory'],
      tags: ['minimum variance', 'covariance'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Minimum-variance_portfolio' },
      viz(v) {
        const E = eng(SET5), U = E.U, n = U.mu.length, RF = 0.03;
        const noise = v.slider('errors in the means (σ, % a year)', 0, 6, 2.5, { step: 0.1, fmt: (x) => fx(x, 1) + '%' });
        let seed = 3; v.button('Resample errors', () => { seed++; });
        const L = v.stage({ x: [0.1, 0.3], y: [0.08, 0.2], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 270, xlabel: 'risk σ (annual)', ylabel: 'mean return', title: 'the frontier and its vertex' });
        const W = v.stage({ x: [0.4, 5.6], y: [-1, 2], axes: 'box', gutter: true, height: 340, weight: 1.1, minWidth: 250, xlabel: 'asset', ylabel: 'weight', title: 'weights' });
        const Mg = v.stage({ x: [0.4, 5.6], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 220, xlabel: 'asset', ylabel: '(Σw)ᵢ in %²', title: 'marginal risk contributions' });
        let st = null;
        v.render(() => {
          const r = rng(seed * 101 + 7), z = U.mu.map(() => r.normal()), mu2 = U.mu.map((m, i) => m + (noise.value / 100) * z[i]);
          const F2 = frontierConsts(mu2, U.S), wg = gmv(U.S), sg0 = Math.sqrt(quad(wg, U.S));
          const V = E.view(true); L.setView(V.x, V.y); L.setTicks(ptk(V.x[0], V.x[1], 0.05), ptk(V.y[0], V.y[1], 0.04));
          const h0 = hyper(U.S, E.F, E.m0, V.y[0], V.y[1], true); L.path(h0.up, { color: 'muted', width: 2 }); L.path(h0.dn, { color: 'muted', width: 1.2, dash: [6, 4] });
          if (noise.value > 0) { const h1 = hyper(U.S, F2, F2.b / F2.a, V.y[0], V.y[1], true); L.path(h1.up, { color: 'orange', width: 2.4 }); L.path(h1.dn, { color: 'orange', width: 1.2, dash: [6, 4] }); L.dot(sg0, dot(wg, mu2), { r: 5, color: 'orange', hollow: true }); }
          L.vline(sg0, { color: 'green', width: 1.6, dash: [5, 4] });
          L.dot(sg0, dot(wg, U.mu), { r: 7, color: 'green' }); L.text('minimum variance', sg0, V.y[1], { dx: 8, dy: 12, align: 'left', size: 11.5, color: 'green', weight: 700, plate: true });
          U.sd.forEach((s, i) => { L.dot(s, U.mu[i], { r: 3.5, color: 'ink' }); L.text(U.names[i], s, U.mu[i], { dx: 7, dy: -3, align: 'left', size: 10.5, color: 'muted', weight: 600 }); });
          const t0 = tangency(U.mu, U.S, RF), t1 = tangency(mu2, U.S, RF) || t0;
          const all = [...wg, ...(t0 || []), ...t1], lo = Math.min(0, ...all) - 0.1, hi = Math.max(0.5, ...all) + 0.1;
          W.setView([0.4, 5.6], [lo, hi]); W.setTicks(U.names.map((nm, i) => [i + 1, nm]), null);
          groupBars(W, [wg, t0 || wg, t1], ['blue', 'muted', 'orange']); W.hline(0, { color: 'ink', width: 1 });
          const g = matVec(U.S, wg).map((x) => 1e4 * x);
          Mg.setView([0.4, 5.6], [0, Math.max(...g) * 1.4]); Mg.setTicks(U.names.map((nm, i) => [i + 1, nm]), null);
          Mg.bars(g, { x0: 1, dx: 1, color: () => 'blue' }); Mg.hline(1e4 * sg0 * sg0, { color: 'green', width: 1.6, dash: [5, 4] });
          const dT = t0 ? Math.max(...t0.map((x, i) => Math.abs(x - t1[i]))) : NaN;
          st = { wg, sg0, dT, g, gmean: dot(wg, U.mu), gmean2: dot(wg, mu2) };
        });
        v.legend([['blue', 'minimum-variance weights'], ['muted', 'tangency, true means'], ['orange', 'tangency, means with errors'], ['green', 'vertex risk']]);
        v.readout(() => `minimum-variance weights ${st.wg.map((x) => fx(100 * x, 0) + '%').join(' / ')} (unchanged by the errors in the means; σ = ${pct(st.sg0, 2)}) · the tangency portfolio's weights move by up to ${fx(100 * st.dT, 0)} points · marginal risks $(\\Sigma w)_i$ in %²: ${st.g.map((x) => fx(x, 3)).join(', ')} — all equal to $\\sigma^2_{\\rm gmv}=${fx(1e4 * st.sg0 * st.sg0, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Model',
      name: 'The capital allocation line and the tangency portfolio',
      statement: String.raw`Add a riskless asset with return $r_f$ to the risky assets. Mixing a risky portfolio $P$ (mean $\mu_P$, risk $\sigma_P$) with the riskless asset traces the **capital allocation line** (CAL), a straight line from $(0,r_f)$ through $P$ with slope $(\mu_P-r_f)/\sigma_P$ — the Sharpe ratio of $P$ (fin-3.12); points beyond $P$ use borrowing at $r_f$. The CAL with the greatest slope is the line from $(0,r_f)$ tangent to the risky frontier, touching it at the **tangency portfolio**
$$w_T=\frac{\Sigma^{-1}(\mu-r_f\mathbf 1)}{\mathbf 1^{\top}\Sigma^{-1}(\mu-r_f\mathbf 1)},$$
and every investor can do best by mixing $T$ with the riskless asset. If borrowing costs more than lending, the best line bends at $T$.

Scope: $r_f$ below the mean of the minimum-variance portfolio (otherwise the tangency is on the lower, inefficient branch); unrestricted weights; one riskless rate for lending.`,
      idea: String.raw`Maximising the slope $(\mu_P-r_f)/\sigma_P$ over all risky portfolios: the first-order condition (set the gradient of $w^{\top}(\mu-r_f\mathbf 1)\big/\sqrt{w^{\top}\Sigma w}$ to zero, using Lagrange multipliers as in micro-5.4) gives $\Sigma w\propto\mu-r_f\mathbf 1$, whose normalised solution is $w_T$. Geometrically a line pivoting about $(0,r_f)$ stops improving when it touches the frontier hyperbola (fin-3.7): the CAL is tangent there, and any other risky portfolio $P$ lies on a flatter line. Tobin (1958) introduced the riskless asset into Markowitz's analysis and showed that this makes the choice of risky portfolio independent of the investor's risk aversion.`,
      caption: String.raw`Five **real** industry portfolios (in-sample 1963–2026). Drag the **riskless rate** with its slider, and drag the gold point **P** along the frontier: the line from $(0,r_f)$ through $P$ is its CAL, and the right panel plots its slope (the Sharpe ratio) against the mean of $P$; the slope peaks exactly at the tangency portfolio $T$ (green), where the CAL touches the frontier. Raise the **borrowing spread** and the efficient line bends at $T$: borrowers (beyond $T$) face a flatter line.`,
      deps: ['fin-3.7'],
      refs: ['BKM ch. 6', 'BKM ch. 7'],
      tags: ['capital allocation line', 'tangency'],
      credit: 'James Tobin, 1958',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Capital_allocation_line' },
      viz(v) {
        const E = eng(SET5), U = E.U;
        const rf = v.slider('riskless rate $r_f$', 0, 0.09, 0.03, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const spread = v.slider('borrowing spread', 0, 0.05, 0, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const L = v.stage({ x: [0, 0.3], y: [0, 0.2], axes: 'box', gutter: true, height: 350, weight: 1.4, minWidth: 300, xlabel: 'risk σ (annual)', ylabel: 'mean return', title: 'the frontier and the capital allocation line' });
        const S2 = v.stage({ x: [0.1, 0.2], y: [0, 1], axes: 'box', gutter: true, height: 350, weight: 1, minWidth: 250, xlabel: 'mean return of P', ylabel: 'slope of the line (Sharpe ratio)', title: 'slope of the line through P' });
        const hP = L.handle(0.2, 0.15, { color: 'gold', label: 'P', constrain: (x, y) => { const Ey = clamp(y, E.m0 + 1e-4, E.mMax + 0.04); return [frontierSd(E.F, Ey), Ey]; } });
        let st = null;
        v.render(() => {
          const r0 = rf.value, sp = spread.value, V = E.view(true), xh = V.x[1], yl = Math.min(0, r0 - 0.01);
          const xl = 0; L.setView([xl, xh], [yl, V.y[1]]); L.setTicks(ptk(xl, xh, 0.05), ptk(yl, V.y[1], 0.04));
          const h = hyper(U.S, E.F, E.m0, V.y[0], V.y[1], true); L.path(h.up, { color: 'accent', width: 2.8 }); L.path(h.dn, { color: 'accent', width: 1.4, dash: [6, 4] });
          U.sd.forEach((s, i) => { L.dot(s, U.mu[i], { r: 3.5, color: 'ink' }); L.text(U.names[i], s, U.mu[i], { dx: 7, dy: -3, align: 'left', size: 10.5, color: 'muted', weight: 600 }); });
          L.dot(0, r0, { r: 5, color: 'ink' }); L.text('$r_f$', 0, r0, { dx: 8, dy: 14, align: 'left', size: 11.5, color: 'muted' });
          const T = E.m0 > r0 ? tangency(U.mu, U.S, r0) : null;
          const Ep = clamp(hP.y, E.m0 + 1e-4, E.mMax + 0.04); hP.set(frontierSd(E.F, Ep), Ep);
          const slope = (Ep - r0) / hP.x;
          L.line(0, r0, xh, r0 + slope * xh, { color: 'gold', width: 1.8, dash: [6, 4] });
          let sT = NaN, eT = NaN, sdT = NaN;
          if (T) {
            eT = dot(T, U.mu); sdT = Math.sqrt(quad(T, U.S)); sT = (eT - r0) / sdT;
            L.line(0, r0, sdT, eT, { color: 'green', width: 3 });
            const sb = (eT - r0 - sp) / sdT; L.line(sdT, eT, xh, eT + sb * (xh - sdT), { color: sp > 0 ? 'red' : 'green', width: 3 });
            if (sp > 0) L.line(0, r0 + sp, sdT, eT, { color: 'faint', width: 1, dash: [3, 3] });
            L.dot(sdT, eT, { r: 7.5, color: 'green' }); L.text('tangency T', sdT, eT, { dx: -9, dy: -10, align: 'right', size: 12, color: 'green', weight: 700, plate: true });
          } else L.corner('$r_f$ is above the minimum-variance mean: no tangency on the efficient branch', 'tl', { color: 'red', size: 12, weight: 700 });
          // slope against the mean of P
          const lo = E.m0, hi = E.mMax + 0.04, f = (m) => (m - r0) / frontierSd(E.F, m), top = Math.max(sT || 0, f(hi), f(lo + 1e-3), 0.3) * 1.15;
          S2.setView([lo, hi], [Math.min(0, f(lo)) - 0.05, top]); S2.setTicks(ptk(lo, hi, 0.04), null);
          S2.fn((m) => f(m), { domain: [lo + 1e-4, hi], color: 'accent', width: 2.6 });
          S2.hline(0, { color: 'ink', width: 1 });
          if (T) { S2.dot(eT, sT, { r: 7, color: 'green' }); S2.text('max at T', eT, sT, { dy: -12, size: 11.5, color: 'green', weight: 700, plate: true }); }
          S2.dot(Ep, slope, { r: 7, color: 'gold' });
          st = { slope, sT, eT, sdT, wT: T, Ep, r0, sp, sb: T ? (eT - r0 - sp) / sdT : NaN };
        });
        v.legend([['accent', 'risky frontier'], ['gold', 'line through P', { dash: true }], ['green', 'tangent line (best)']]);
        v.readout(() => `P (mean ${pct(st.Ep, 2)}): slope $=${fx(st.slope, 3)}$ · ${st.wT ? `tangency portfolio: mean ${pct(st.eT, 2)}, σ ${pct(st.sdT, 2)}, slope $=${fx(st.sT, 3)}$ (no point of the frontier gives more); weights ${st.wT.map((x) => fx(100 * x, 0) + '%').join(' / ')}${st.sp > 0 ? ` · with borrowing at $r_f+${fx(100 * st.sp, 2)}\\%$ the slope beyond $T$ drops to ${fx(st.sb, 3)}` : ''}` : 'no tangency portfolio for this riskless rate'}`);
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Theorem',
      name: 'Tobin’s separation (one-fund) theorem',
      statement: String.raw`Suppose all investors share the same means $\mu$ and covariance $\Sigma$, can lend and borrow at the same riskless rate $r_f$ (below the mean of the minimum-variance portfolio), and maximise a mean–variance utility $\mu_p-\tfrac{A}{2}\sigma_p^2$ with their own risk aversion $A>0$. Then every investor holds the **same** risky portfolio, the tangency portfolio $T$ of fin-3.10, and the riskless asset; they differ only in the fraction
$$y=\frac{\mu_T-r_f}{A\,\sigma_T^2}$$
of wealth put in $T$ (more than $1$ means borrowing). The choice of the risky mix is separate from the choice of how much risk to take.

Scope: homogeneous beliefs and a single riskless rate for lending and borrowing; with different beliefs or a borrowing spread the risky mix depends on the investor.`,
      idea: String.raw`Every portfolio of the investor is $y$ in some risky mix $P$ and $1-y$ in the riskless asset, and for given $P$ the utility is $r_f+y(\mu_P-r_f)-\tfrac A2y^2\sigma_P^2$. Maximising over $y$ gives $y=(\mu_P-r_f)/(A\sigma_P^2)$ and utility $r_f+\mathrm{SR}_P^2/(2A)$ — increasing in the Sharpe ratio of $P$ (fin-3.12) and nothing else about $P$. So the best $P$ is the one with the highest Sharpe ratio, the tangency portfolio, whatever $A$ is. This is the content of Tobin's (1958) argument; it is two-fund separation (fin-3.8) with the riskless asset as one of the funds.`,
      caption: String.raw`Three investors with risk aversions you choose (five **real** industry portfolios, in-sample 1963–2026; parabolas are each investor's indifference curve through their choice). Each picks a point on the same capital allocation line; the bars on the right show their portfolios: riskless asset (grey, negative = borrowing) and the five risky assets, with an identical risky mix up to scale. Turn on **investor 3 disagrees** to give him different beliefs about the means (an arbitrary shift of a few points): his risky mix changes, and separation across investors is lost.`,
      deps: ['fin-3.10', 'fin-3.8'],
      refs: ['Luenberger: Mean–Variance Portfolio Theory'],
      tags: ['separation', 'tangency'],
      credit: 'James Tobin, 1958',
      scope: String.raw`Homogeneous beliefs, one riskless rate and mean–variance preferences (exact for CARA utility with normal returns, fin-3.14).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Separation_property_of_the_efficient_frontier' },
      viz(v) {
        const E = eng(SET5), U = E.U, n = 5;
        const A1 = v.slider('risk aversion $A_1$', 1, 20, 3, { log: true, step: 0.1 }), A2 = v.slider('risk aversion $A_2$', 1, 20, 6, { log: true }), A3 = v.slider('risk aversion $A_3$', 1, 20, 12, { log: true });
        const rf = v.slider('riskless rate $r_f$', 0, 0.07, 0.03, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const dis = v.toggle('investor 3 disagrees', false);
        const SHIFT = [-0.02, 0.03, 0.02, -0.03, 0.01];
        const L = v.stage({ x: [0, 0.3], y: [0, 0.2], axes: 'box', gutter: true, height: 350, weight: 1.35, minWidth: 300, xlabel: 'risk σ (annual)', ylabel: 'mean return', title: 'three choices on one line' });
        const B = v.stage({ x: [0.4, 3.6], y: [-1, 2], axes: 'box', gutter: true, height: 350, weight: 1, minWidth: 250, xlabel: 'investor', ylabel: 'share of wealth', title: 'portfolios (stacked)' });
        let st = null;
        v.render(() => {
          const r0 = rf.value, As = [A1.value, A2.value, A3.value];
          const V = E.view(true), T = E.m0 > r0 ? tangency(U.mu, U.S, r0) : null;
          const ys = T ? As.map((A_) => { const e_ = dot(T, U.mu), s_ = Math.sqrt(quad(T, U.S)), yy = (e_ - r0) / (A_ * s_ * s_); return [yy * s_, r0 + yy * (e_ - r0)]; }) : [];
          const xh = Math.max(V.x[1], ...ys.map((q) => q[0] * 1.2)), yh = Math.max(V.y[1], ...ys.map((q) => q[1] + 0.02)), yl = Math.min(0, r0 - 0.01);
          L.setView([0, xh], [yl, yh]); L.setTicks(ptk(0, xh, 0.05), ptk(yl, yh, 0.04));
          const h = hyper(U.S, E.F, E.m0, V.y[0], yh, true); L.path(h.up, { color: 'accent', width: 2.4 }); L.path(h.dn, { color: 'accent', width: 1.2, dash: [6, 4] });
          if (!T) { L.corner('$r_f$ is above the minimum-variance mean: no tangency', 'tl', { color: 'red', size: 12, weight: 700 }); st = null; return; }
          const eT = dot(T, U.mu), sdT = Math.sqrt(quad(T, U.S));
          L.line(0, r0, xh, r0 + ((eT - r0) / sdT) * xh, { color: 'green', width: 2.6 });
          L.dot(0, r0, { r: 4.5, color: 'ink' }); L.dot(sdT, eT, { r: 6, color: 'green' }); L.text('T', sdT, eT, { dx: 8, dy: -8, size: 12, color: 'green', weight: 700 });
          const invs = [];
          for (let k = 0; k < 3; k++) {
            const mu_k = k === 2 && dis.value ? U.mu.map((m, i) => m + SHIFT[i]) : U.mu, Tk = k === 2 && dis.value ? tangency(mu_k, U.S, r0) : T;
            const ek = dot(Tk, mu_k), sk = Math.sqrt(quad(Tk, U.S)), y = (ek - r0) / (As[k] * sk * sk), w = Tk.map((x) => y * x);
            const Etrue = r0 * (1 - y) + dot(w, U.mu), sdp = Math.abs(y) * sk, c = ['blue', 'orange', 'purple'][k];
            invs.push({ y, w, cash: 1 - y, Tk, sdp, Etrue, c });
            if (!(k === 2 && dis.value)) { const u0 = Etrue - As[k] * sdp * sdp / 2; L.fn((s) => u0 + As[k] * s * s / 2, { domain: [0, Math.min(xh, 0.3)], color: c, width: 1.4, dash: [4, 3], alpha: 0.9 }); }
            L.dot(sdp, Etrue, { r: 7, color: c, hollow: k === 2 && dis.value }); L.text('investor ' + (k + 1), sdp, Etrue, { dx: 9, dy: 14, align: 'left', size: 11.5, color: c, weight: 700, plate: true });
          }
          B.setView([0.4, 3.6], [Math.min(-0.6, ...invs.flatMap((q) => [q.cash, ...q.w])) - 0.15, Math.max(1.1, ...invs.map((q) => Math.max(q.cash, 0) + q.w.filter((x) => x > 0).reduce((a, b) => a + b, 0))) + 0.15]);
          B.setTicks([[1, 'investor 1'], [2, 'investor 2'], [3, 'investor 3']], null);
          invs.forEach((q, k) => {
            const parts = [['muted', q.cash], ...q.w.map((x, i) => [COL[i], x])]; let up = 0, dn = 0;
            for (const [c, val] of parts) { if (val >= 0) { B.rect(k + 0.62, up, k + 1.38, up + val, { fill: c, fillAlpha: 0.8, stroke: false }); up += val; } else { B.rect(k + 0.62, dn + val, k + 1.38, dn, { fill: c, fillAlpha: 0.8, stroke: false }); dn += val; } }
          });
          B.hline(0, { color: 'ink', width: 1 }); B.hline(1, { color: 'faint', width: 1, dash: [4, 3] });
          const mixOf = (q) => q.w.map((x) => x / q.y);
          st = { invs, dev: (k) => Math.max(...mixOf(invs[k]).map((x, i) => Math.abs(x - T[i]))), T };
        });
        v.legend([['muted', 'riskless asset'], ...U.names.map((nm, i) => [COL[i], nm])]);
        v.readout(() => st ? `fraction in the risky fund $T$: investor 1 ${fx(100 * st.invs[0].y, 0)}%, investor 2 ${fx(100 * st.invs[1].y, 0)}%, investor 3 ${fx(100 * st.invs[2].y, 0)}% (above 100% = borrowing) · risky mix of $T$: ${st.T.map((x) => fx(100 * x, 0) + '%').join(' / ')} · largest deviation of an investor's risky mix from $T$: ${fx(100 * st.dev(0), 2)}, ${fx(100 * st.dev(1), 2)}, ${fx(100 * st.dev(2), 2)} points` : 'no tangency portfolio for this riskless rate');
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Definition',
      name: 'The Sharpe ratio',
      statement: String.raw`For a portfolio with return $R$ and a riskless rate $r_f$, the **Sharpe ratio** is
$$\mathrm{SR}=\frac{\mathbb E[R-r_f]}{\sigma(R-r_f)},$$
the expected excess return per unit of standard deviation of the excess return; it is the slope of the line from $(0,r_f)$ to the portfolio in the $(\sigma,\mu)$ plane. Mixing with the riskless asset (leverage $L$: excess return $L(R-r_f)$) multiplies both the mean and the standard deviation of the excess return by $L$ and leaves the ratio unchanged; so rankings by Sharpe ratio do not depend on how much risk each fund takes. Annualising monthly values: $\mathrm{SR}_{\rm year}=\sqrt{12}\,\mathrm{SR}_{\rm month}$ when returns are uncorrelated over time.

Scope: a meaningful summary of performance only when return distributions are well described by mean and variance; sample Sharpe ratios are noisy and can be gamed by option-like or illiquid strategies.`,
      idea: String.raw`The ratio is homogeneous of degree zero in the leverage of the excess return, which is why it is the slope that characterises a whole capital allocation line (fin-3.10): the funds on the same ray from the riskless point differ only in leverage. The tangency portfolio is the one with the maximum Sharpe ratio. Sharpe introduced the idea in 1966 for ranking mutual funds under the name "reward-to-variability", and described it again in 1994 as the "Sharpe ratio". In a sample of $T$ periods the estimated ratio has a standard error of order $1/\sqrt{T/12}$ in annual units for modest ratios, so differences among funds over a few years are usually within noise.`,
      caption: String.raw`**Real** data: the market and the ten industry portfolios (Kenneth French's library), excess return over the T-bill rate. Choose the **start year** and the **length of the window**: dots are plotted in risk–return space, the Sharpe ratio is the slope from the origin (annual excess mean on the vertical axis); the bar chart ranks the series by ratio, and the ranking changes with the window. Pick a **fund** and slide its **leverage** $L$ (borrowing or lending at the T-bill rate): the dot moves along its own line; its ratio, recomputed from the leveraged series, does not change.`,
      deps: ['fin-3.10'],
      refs: ['BKM ch. 6'],
      tags: ['Sharpe ratio', 'performance'],
      credit: 'William F. Sharpe, 1966 ("reward-to-variability"); named in Sharpe, 1994',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sharpe_ratio' },
      viz(v) {
        const D = data(), tot = marketTotal(), names = ['market', ...IND_NAMES], N = D.n;
        const ser = (k) => (k === 0 ? tot : D.ind[k - 1]);
        const y0 = v.slider('start year', 1964, 2006, 1964, { step: 1, int: true });
        const len = v.slider('window (years)', 10, 62, 30, { step: 1, int: true });
        const sel = v.select('fund', names.map((nm, i) => ({ value: String(i), label: nm })), '0');
        const lev = v.slider('leverage $L$', 0, 2.5, 1, { step: 0.05 });
        const A = v.stage({ x: [0, 0.3], y: [0, 0.15], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 280, xlabel: 'risk σ of the excess return (annual)', ylabel: 'mean excess return (annual)', title: 'excess return against risk' });
        const B = v.stage({ x: [0.4, 11.6], y: [0, 0.7], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'series (ranked by Sharpe ratio)', ylabel: 'Sharpe ratio', title: 'ranking' });
        let st = null;
        v.render(() => {
          const i0 = Math.max(0, idxOf(y0.value, 1)), i1 = Math.min(N, i0 + 12 * len.value), T = i1 - i0;
          const stats = names.map((nm, k) => { const s = ser(k), ex = new Float64Array(T); for (let i = 0; i < T; i++) ex[i] = s[i0 + i] - D.rf[i0 + i]; const m = mean(ex), sd = sdev(ex); return { nm, k, m: 12 * m, sd: Math.sqrt(12) * sd, sr: (Math.sqrt(12) * m) / sd, ex }; });
          const xs = Math.max(...stats.map((s) => s.sd), 0.1) * 1.15, ys = Math.max(...stats.map((s) => s.m), 0.05) * 1.2, ym = Math.min(0, ...stats.map((s) => s.m)) * 1.3;
          A.setView([0, xs], [ym, ys]); A.setTicks(ptk(0, xs, 0.05), ptk(ym, ys, 0.02));
          A.hline(0, { color: 'ink', width: 1 });
          const c = stats[+sel.value];
          A.line(0, 0, xs, (c.m / c.sd) * xs, { color: 'green', width: 1.6, dash: [6, 4] });
          stats.forEach((s) => A.dot(s.sd, s.m, { r: s.k === c.k ? 7 : 4.5, color: s.k === c.k ? 'green' : s.k === 0 ? 'accent' : 'ink' }));
          fanLabels(A, stats.map((s) => ({ x: s.sd, y: s.m, text: s.nm, color: s.k === c.k ? v.color('green') : v.color('muted') })), { w: 44, h: 12, leader: v.color('faint') });
          const L = lev.value, lx = new Float64Array(T); for (let i = 0; i < T; i++) lx[i] = L * c.ex[i];
          const lm = 12 * mean(lx), lsd = Math.sqrt(12) * sdev(lx), lsr = lsd > 0 ? (Math.sqrt(12) * mean(lx)) / sdev(lx) : NaN;
          A.dot(lsd, lm, { r: 6.5, color: 'gold' }); A.text('$L$ = ' + fx(L, 2), lsd, lm, { dx: 10, dy: -14, align: 'left', size: 11.5, color: 'gold', weight: 700, plate: true });
          const rk = [...stats].sort((a, b) => b.sr - a.sr), top = Math.max(0.3, rk[0].sr) * 1.2, bot = Math.min(0, rk[rk.length - 1].sr) - 0.05;
          B.setView([0.4, 11.9], [bot, top]); B.setTicks(rk.map((s, i) => [i + 1, s.k === 0 ? 'Mkt' : s.nm.slice(0, 3)]), null);
          rk.forEach((s, i) => { B.rect(i + 0.64, 0, i + 1.36, s.sr, { fill: s.k === c.k ? 'green' : s.k === 0 ? 'accent' : 'muted', fillAlpha: 0.8, stroke: false }); B.text(fx(s.sr, 2), i + 1, Math.max(s.sr, 0), { dy: -8, size: 10, color: 'ink', weight: 600 }); });
          B.hline(0, { color: 'ink', width: 1 });
          st = { c, lsr, rk, i0, i1, L };
        });
        v.legend([['accent', 'market'], ['ink', 'industry'], ['green', 'selected fund / its line'], ['gold', 'leveraged fund', { dot: true }]]);
        v.readout(() => `window ${idxLabel(st.i0)} – ${idxLabel(st.i1 - 1)} · best: ${st.rk[0].nm} (${fx(st.rk[0].sr, 2)}), worst: ${st.rk[st.rk.length - 1].nm} (${fx(st.rk[st.rk.length - 1].sr, 2)}) · ${st.c.nm}: excess mean ${pct(st.c.m, 1)}, σ ${pct(st.c.sd, 1)}, Sharpe ratio ${fx(st.c.sr, 3)} · with leverage ${fx(st.L, 2)} its ratio is ${Number.isNaN(st.lsr) ? '—' : fx(st.lsr, 3)}`);
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Phenomenon',
      name: 'Estimation error: optimizers maximize mistakes',
      statement: String.raw`Mean–variance weights are computed from estimated means and covariances, and the optimiser puts the largest weights on the assets whose estimated returns are most favourable — which are also those whose estimation errors are most favourable. With $T$ monthly observations the standard error of an annual mean return is about $\sigma/\sqrt{T/12}$, typically far larger than the differences between the true means of similar assets; the optimal weights $\hat w\propto\hat\Sigma^{-1}(\hat\mu-r_f)$ therefore swing widely from sample to sample, and the resulting portfolio's *out-of-sample* performance can be worse than that of simple rules such as equal weights ($1/N$). Constraints, shrinkage and Bayesian methods reduce but do not remove the problem.

Scope: an empirical regularity in typical data sets with many assets and short histories (here five assets, a few years); it is not a theorem, and optimisation can win when data are plentiful relative to the number of assets.`,
      idea: String.raw`The map from data to weights is a nonlinear, error-amplifying one: the inverse of a covariance matrix of highly correlated assets magnifies small differences in estimated means into large offsetting long and short positions. Michaud (1989) described optimisers as "estimation-error maximisers" in this sense (the essay's argument is that optimisation tends to amplify errors in its inputs), and later work compared many refinements with the naive $1/N$ rule out of sample: DeMiguel, Garlappi and Uppal (2009) found that none of 14 models they studied consistently beat $1/N$ in their data sets (see fin-3.15). The remedy is to shrink the estimates or the weights toward a prior, such as equal weights or the minimum-variance portfolio (fin-3.9), whose weights do not use $\hat\mu$.`,
      caption: String.raw`**Left (simulation, truth known)**: the "true" means and covariances are the five **real** industry estimates of fin-3.7 for all 1963–2026; each dot is the unconstrained mean–variance weights computed from one simulated sample of the chosen **length**; the bar is the weights with the true parameters. Press **Resample**: the dots scatter widely around the bars. **Middle and right (real history)**: every month from the start, weights are re-estimated from the previous *window* of months and held for the next month; the lines are the five weights through time, and the right panel shows the growth of one dollar for the optimiser (in the chosen mode) and the equally weighted portfolio, both out of sample, with their Sharpe ratios. The outcome is whatever the data give — no claim is built in.`,
      deps: ['fin-3.7', 'fin-3.9'],
      refs: ['BKM ch. 7'],
      tags: ['estimation error', 'out of sample'],
      credit: 'Michaud, 1989; DeMiguel, Garlappi & Uppal, 2009',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Modern_portfolio_theory#Criticism' },
      viz(v) {
        const D = data(), N = D.n, U0 = universe(SET5), n = 5, ser = SET5.map((k) => D.ind[k]);
        const W = v.slider('estimation window (months)', 24, 180, 60, { step: 12, int: true });
        const gam = v.slider('risk aversion $\\gamma$', 2, 12, 5, { step: 0.5 });
        const mode = v.select('optimiser', [{ value: 'free', label: 'unconstrained' }, { value: 'long', label: 'long only' }], 'free');
        let seed = 1; v.button('Resample', () => { seed++; });
        const S1 = v.stage({ x: [0.4, 5.6], y: [-2, 3], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'asset', ylabel: 'weight', title: 'simulation: 12 samples vs the truth' });
        const S2 = v.stage({ x: [1964, 2027], y: [-3, 3], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 270, xlabel: 'year', ylabel: 'weight', title: 'weights re-estimated through history' });
        const S3 = v.stage({ x: [1964, 2027], y: [0, 100], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 270, xlabel: 'year', ylabel: 'growth of one dollar (log)', title: 'out of sample' });
        const wOf = (mu, S, rfA) => (mode.value === 'long' ? mvLong(mu.map((m) => m + rfA), S, gam.value) : (() => { const z = solveLin(S, mu.map((m) => m)); return z ? z.map((x) => x / gam.value) : mu.map(() => 0); })());
        let st = null;
        v.render(() => {
          const Wn = W.value, long = mode.value === 'long';
          // ---- simulation: truth = full-sample estimates
          const excessMu = U0.mu.map((m) => m - 12 * mean(D.rf)), wTrue = wOf(excessMu, U0.S, 12 * mean(D.rf));
          const Lc = (function chol(A) { const m = A.length, L = Array.from({ length: m }, () => new Array(m).fill(0)); for (let i = 0; i < m; i++) for (let j = 0; j <= i; j++) { let s = A[i][j]; for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k]; L[i][j] = i === j ? Math.sqrt(s) : s / L[j][j]; } return L; })(U0.S.map((r) => r.map((x) => x / 12)));
          const r = rng(seed * 977 + 13), sims = [];
          for (let q = 0; q < 12; q++) {
            const xs = []; for (let t = 0; t < Wn; t++) { const z = U0.mu.map(() => r.normal()), e = matVec(Lc, z); xs.push(e.map((x, i) => x + U0.mu[i] / 12)); }
            const cols = U0.mu.map((_, i) => xs.map((x) => x[i])), mu = cols.map((c) => 12 * mean(c) - 12 * mean(D.rf)), S = covOf(cols).map((rw) => rw.map((x) => 12 * x));
            sims.push(wOf(mu, S, 12 * mean(D.rf)));
          }
          const allw = [...wTrue, ...sims.flat()]; const lo = Math.min(0, ...allw) - 0.2, hi = Math.max(0.5, ...allw) + 0.2;
          S1.setView([0.4, 5.6], [lo, hi]); S1.setTicks(U0.names.map((nm, i) => [i + 1, nm]), null);
          S1.bars(wTrue, { x0: 1, dx: 1, color: () => 'blue' }); S1.hline(0, { color: 'ink', width: 1 });
          sims.forEach((w) => w.forEach((x, i) => S1.dot(i + 1 + (r() - 0.5) * 0.5, x, { r: 3.5, color: 'orange', alpha: 0.85 })));
          // ---- rolling
          const rows = [], wt = [], t0 = Wn;
          let wealthO = 1, wealthE = 1; const lo_ = [], le_ = [], ro = [], re = [];
          for (let t = t0; t < N; t++) {
            if ((t - t0) % 3 === 0 || t === t0) {
              const mu = ser.map((s) => 12 * mean(s, t - Wn, t) - 12 * mean(D.rf, t - Wn, t)), S = covOf(ser, t - Wn, t).map((rw) => rw.map((x) => 12 * x)), rfm = 12 * mean(D.rf, t - Wn, t);
              rows.push({ t, w: wOf(mu, S, rfm) });
            }
            const w = rows[rows.length - 1].w, sum = w.reduce((a, b) => a + b, 0);
            const rpo = long ? w.reduce((a, x, i) => a + x * ser[i][t], 0) : w.reduce((a, x, i) => a + x * ser[i][t], 0) + (1 - sum) * D.rf[t];
            const rpe = ser.reduce((a, s) => a + s[t] / n, 0);
            wealthO *= 1 + rpo; wealthE *= 1 + rpe; ro.push(rpo - D.rf[t]); re.push(rpe - D.rf[t]);
            const yr = 1963 + (6 + t) / 12 + 0.5 / 12; lo_.push([yr, Math.max(wealthO, 1e-3)]); le_.push([yr, wealthE]);
          }
          const wAll = rows.flatMap((q) => q.w), a0 = Math.min(0, ...wAll) - 0.1, a1 = Math.max(0.5, ...wAll) + 0.1;
          S2.setView([1963 + (6 + t0) / 12, 2027], [a0, a1]); S2.setTicks(null, null);
          for (let i = 0; i < n; i++) S2.path(rows.map((q) => [1963 + (6 + q.t) / 12, q.w[i]]), { color: COL[i], width: 1.6 });
          S2.hline(0, { color: 'ink', width: 1 });
          const top = Math.max(wealthO, wealthE, 2) * 1.6, bot = Math.min(...lo_.map((p) => p[1]), ...le_.map((p) => p[1]), 1) / 1.6;
          S3.setScale({ ylog: true, y: [Math.max(bot, 1e-3), top], x: [1963 + (6 + t0) / 12, 2027] });
          S3.path(le_, { color: 'blue', width: 2.4 }); S3.path(lo_, { color: 'orange', width: 2.4 }); S3.hline(1, { color: 'faint', width: 1 });
          const sr = (x) => (Math.sqrt(12) * mean(x)) / sdev(x), swing = Math.max(...U0.names.map((_, i) => Math.max(...rows.map((q) => q.w[i])) - Math.min(...rows.map((q) => q.w[i]))));
          st = { wealthO, wealthE, sro: sr(Float64Array.from(ro)), sre: sr(Float64Array.from(re)), swing, spread: Math.max(...U0.names.map((_, i) => Math.max(...sims.map((w) => w[i])) - Math.min(...sims.map((w) => w[i])))), se: Math.sqrt(sq(0.17) / (Wn / 12)), Wn };
        });
        v.legend([['blue', 'true weights / equal weights 1/N'], ['orange', 'sampled optimum / optimiser out of sample']]);
        v.readout(() => `with ${st.Wn} months of data the standard error of an annual mean return is about ${pct(st.se, 1)} (for σ = 17%), against true differences among the assets' means of a few points · simulation: one asset's weight varies by up to ${fx(100 * st.spread, 0)} points across the 12 samples · history: a weight moves by up to ${fx(100 * st.swing, 0)} points over time · out of sample: optimiser: one dollar becomes ${fx(st.wealthO, 1)} (Sharpe ${fx(st.sro, 2)}), equal weights: ${fx(st.wealthE, 1)} (Sharpe ${fx(st.sre, 2)})`);
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Proposition',
      name: 'When mean–variance analysis is rational',
      statement: String.raw`Mean–variance analysis ranks portfolios by $(\mu,\sigma^2)$ alone. It is consistent with expected-utility maximisation in two classical cases: (i) **quadratic utility** $u(x)=x-\tfrac b2x^2$, for any return distribution with finite variance, since $\mathbb E u=\mu-\tfrac b2(\mu^2+\sigma^2)$; and (ii) **any** utility if returns are jointly normal (more generally elliptically distributed; Chamberlain, 1983), because the distribution of every portfolio is then determined by its mean and variance. For exponential (CARA) utility $u(x)=-e^{-ax}$ and a normal return $X\sim N(\mu,\sigma^2)$,
$$\mathbb E\,u(X)=-\exp\!\bigl(-a(\mu-\tfrac a2\sigma^2)\bigr),\qquad \text{certainty equivalent } \mu-\tfrac a2\sigma^2 .$$
Outside these cases (skewed returns with CARA or CRRA utility) two portfolios with equal means and variances are generally ranked differently.

Scope: single period; the first case needs returns where the quadratic utility is increasing (below the bliss point).`,
      idea: String.raw`For normal $X$ the moment generating function gives $\mathbb Ee^{-aX}=e^{-a\mu+a^2\sigma^2/2}$, a function of $(\mu,\sigma^2)$ only; since a function of the first two moments is all that normality leaves free, mean–variance ranking is exact. For a non-normal return, $\mathbb Ee^{-aX}=\exp\bigl(\sum_k\kappa_k(-a)^k/k!\bigr)$ involves **all cumulants** $\kappa_k$; the third (skewness) enters with a sign that rewards right-skewed payoffs, so equal $(\mu,\sigma)$ no longer implies equal utility. With strongly left-skewed returns the expectation can even be infinite. The CARA family and its risk-tolerance are those of behav-1.7.`,
      caption: String.raw`Two return distributions with the **same mean and standard deviation**: the normal one (blue) and a skewed gamma-based one (orange; skewness you choose, $0$ = normal). **Left**: their densities. A mean–variance investor is indifferent between them; the CARA investor with risk aversion $a$ is not: the readout compares closed-form certainty equivalents with numerical integration of the density. **Right**: the difference of the two certainty equivalents against $a$ — positive for right skew (the skewed bet is preferred), negative for left skew, and for strong left skew expected utility becomes $-\infty$ beyond a critical $a$ (the curve ends). The bet parameters are illustrative.`,
      deps: ['fin-3.7', 'behav-1.7'],
      refs: ['Luenberger: General Principles'],
      tags: ['expected utility', 'skewness'],
      credit: 'Chamberlain, 1983 (characterisation of the distributions implying mean–variance utility)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Modern_portfolio_theory#Criticism' },
      viz(v) {
        const M = v.M;
        const a = v.slider('risk aversion $a$', 0.5, 12, 4, { step: 0.1 });
        const skew = v.slider('skewness of the orange bet', -1.6, 1.6, 1, { step: 0.05 });
        const mu = v.slider('mean $\\mu$', 0, 0.2, 0.08, { step: 0.005, fmt: (x) => pct(x, 1) });
        const sig = v.slider('standard deviation $\\sigma$', 0.05, 0.4, 0.2, { step: 0.005, fmt: (x) => pct(x, 1) });
        const P = v.stage({ x: [-0.8, 1.0], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 280, xlabel: 'return', ylabel: 'density', title: 'same mean and variance, different shape' });
        const Q = v.stage({ x: [0.5, 12], y: [-0.06, 0.06], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'risk aversion a', ylabel: 'CE(orange) − CE(blue)', title: 'preference for skewness' });
        // closed forms for X = m + σ s (G − k)/√k, G ~ Gamma(k,1), k = 4/skew², s = ±1
        const ce = (a_, m, s, g) => {
          if (Math.abs(g) < 1e-6) return m - (a_ * s * s) / 2;
          const k = 4 / (g * g), rk = Math.sqrt(k);
          if (g > 0) { const lnE = -a_ * m + a_ * s * rk - k * Math.log(1 + (a_ * s) / rk); return -lnE / a_; }
          const x = (a_ * s) / rk; if (x >= 1) return -Infinity;
          const lnE = -a_ * m - a_ * s * rk - k * Math.log(1 - x); return -lnE / a_;
        };
        let st = null;
        v.render(() => {
          const m = mu.value, s = sig.value, g = skew.value, aa = a.value;
          const k = 4 / (g * g), rk = Math.sqrt(k), gam = Math.abs(g) < 1e-6 ? null : M.dist.gamma(k, 1);
          
          const nrm = M.dist.normal(m, s), pdfS = (x) => (!gam ? nrm.pdf(x) : g > 0 ? (rk / s) * gam.pdf(k + ((x - m) * rk) / s) : (rk / s) * gam.pdf(k - ((x - m) * rk) / s));
          { let pk = nrm.pdf(m); for (let q = 0; q <= 200; q++) pk = Math.max(pk, pdfS(m - 4 * s + (8 * s * q) / 200)); P.setView([m - 4.2 * s, m + 4.2 * s], [0, pk * 1.12]); P.setTicks(null, null); }
          P.fn((x) => nrm.pdf(x), { color: 'accent', width: 2.6, fill: true, fillAlpha: 0.12 });
          if (gam) P.fn(pdfS, { color: 'orange', width: 2.6 });
          P.vline(m, { color: 'faint', width: 1.2, dash: [4, 3] });
          const ceN = ce(aa, m, s, 0), ceS = ce(aa, m, s, g);
          const num = (f) => M.integrate((x) => -Math.exp(-aa * x) * f(x), m - 9 * s, m + 9 * s, 4000);
          const eN = num(nrm.pdf), eS = Number.isFinite(ceS) && gam ? num(pdfS) : NaN;
          const cNum = (e) => (e < 0 ? -Math.log(-e) / aa : NaN);
          // difference curve over a
          const pts = []; let end = null;
          for (let q = 0; q <= 200; q++) { const x = 0.5 + (11.5 * q) / 200, d = ce(x, m, s, g) - ce(x, m, s, 0); if (Number.isFinite(d)) pts.push([x, d]); else { end = x; break; } }
          const dmax = Math.max(0.01, ...pts.map((p) => Math.abs(p[1]))) * 1.25;
          Q.setView([0.5, 12], [-dmax, dmax]); Q.setTicks(null, ptk(-dmax, dmax, dmax > 0.1 ? 0.05 : 0.01));
          Q.hline(0, { color: 'ink', width: 1 }); if (pts.length) Q.path(pts, { color: 'orange', width: 2.6 });
          if (end) Q.text('expected utility is −∞ beyond a ≈ ' + fx(end, 1), 11.8, 0, { align: 'right', dy: -14, size: 11, color: 'red', weight: 700 });
          const dNow = ceS - ceN; if (Number.isFinite(dNow)) Q.dot(aa, dNow, { r: 6.5, color: 'gold' });
          st = { ceN, ceS, eN, eS, cn: cNum(eN), cs: cNum(eS), g, aa, infinite: !Number.isFinite(ceS) && g < 0 };
        });
        v.legend([['accent', 'normal'], ['orange', 'skewed gamma-based']]);
        v.readout(() => `same mean and σ, so mean–variance sees no difference · certainty equivalents: normal ${pct(st.ceN, 2)} (numerical integration ${Number.isNaN(st.cn) ? '—' : pct(st.cn, 2)}); skewed ${st.infinite ? '−∞ (the expectation $\\mathbb E e^{-aX}$ diverges)' : `${pct(st.ceS, 2)}${Math.abs(st.g) < 1e-6 ? '' : ` (numerical ${Number.isNaN(st.cs) ? '—' : pct(st.cs, 2)})`}`} · ${Math.abs(st.g) < 1e-6 ? 'skewness 0: the two bets coincide' : st.infinite ? 'a CARA investor would refuse any exposure to this bet' : `the difference is ${sg(100 * (st.ceS - st.ceN), 2)} points: ${st.ceS > st.ceN ? 'right skew is preferred' : 'left skew is penalised'}`}`);
      },
    },
  ],
};

