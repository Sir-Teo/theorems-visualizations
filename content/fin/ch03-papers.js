// Finance — Chapter 3, landmark paper: Markowitz (1952).
//
// Data: none — the paper's figures are schematic three- and four-security diagrams without numbers. The securities
// below are illustrative (means, standard deviations, correlations chosen by the reader). The geometry follows the
// paper: in the plane of X₁, X₂ (X₃ = 1 − X₁ − X₂, all Xᵢ ≥ 0) isomean lines are parallel straight lines, isovariance
// curves are concentric ellipses around the minimum-variance point, and the efficient set is the "critical line"
// through the points of tangency, bent along the edges of the triangle where a weight would turn negative.
// "Today": estimation error — mean–variance weights built from estimated means are unstable, and DeMiguel, Garlappi &
// Uppal (2009, Review of Financial Studies 22: 1915–1953) found that none of 14 optimised models consistently beat the
// naive 1/N portfolio out of sample.

/** Variance and mean of weights x for means mu and covariance S (3 assets). */
const pm = (x, mu) => x[0] * mu[0] + x[1] * mu[1] + x[2] * mu[2];
const pv = (x, S) => { let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += x[i] * x[j] * S[i][j]; return s; };
function covOf(sd, rho) { const [r12, r13, r23] = rho; const R = [[1, r12, r13], [r12, 1, r23], [r13, r23, 1]]; return R.map((row, i) => row.map((r, j) => r * sd[i] * sd[j])); }
/** Minimum-variance portfolio with mean E, weights summing to 1, no short sales (active-set enumeration for 3 assets). */
function minVarAt(E, mu, S, M) {
  const cands = [];
  // interior: minimise x'Sx s.t. x·mu = E, x·1 = 1  →  x = S⁻¹[mu 1] (A⁻¹)[E 1]
  const Si = M.inverse(S), one = [1, 1, 1];
  const a = M.dot(mu, M.matVec(Si, mu)), b = M.dot(mu, M.matVec(Si, one)), c = M.dot(one, M.matVec(Si, one)), det = a * c - b * b;
  if (Math.abs(det) > 1e-12) { const l1 = (c * E - b) / det, l2 = (a - b * E) / det; const x = M.vadd(M.vscale(M.matVec(Si, mu), l1), M.vscale(M.matVec(Si, one), l2)); cands.push(x); }
  // edges: one weight zero, the other two fixed by the two constraints
  for (let k = 0; k < 3; k++) { const i = (k + 1) % 3, j = (k + 2) % 3; if (Math.abs(mu[i] - mu[j]) < 1e-12) continue; const xi = (E - mu[j]) / (mu[i] - mu[j]); const x = [0, 0, 0]; x[i] = xi; x[j] = 1 - xi; cands.push(x); }
  for (let k = 0; k < 3; k++) if (Math.abs(mu[k] - E) < 1e-9) { const x = [0, 0, 0]; x[k] = 1; cands.push(x); }
  let best = null, bv = Infinity;
  for (const x of cands) if (x.every((w) => w > -1e-9) && Math.abs(pm(x, mu) - E) < 1e-7) { const vv = pv(x, S); if (vv < bv) { bv = vv; best = x; } }
  return best;
}

export default {
  collection: 'fin',
  chapter: 3,
  items: [
    {
      num: '3.15',
      kind: 'Paper',
      name: 'Portfolio Selection',
      paper: { authors: 'Harry Markowitz', year: 1952, title: 'Portfolio Selection', venue: 'Journal of Finance 7 (1): 77–91', doi: '10.1111/j.1540-6261.1952.tb01525.x' },
      introduces: ['fin-3.7'],
      statement: String.raw`An investor who likes expected return $E$ and dislikes its variance $V$ should hold only **efficient** portfolios: those with minimum variance for their expected return and maximum expected return for their variance. For weights $X_i \ge 0$, $\sum X_i = 1$, on securities with expected returns $\mu_i$ and covariances $\sigma_{ij}$,
$$E = \sum_i X_i \mu_i,\qquad V = \sum_{i,j} X_i X_j \sigma_{ij},$$
and because $V$ depends on the covariances, not only on each security's own risk, **diversification** across imperfectly correlated securities lowers risk at no cost in expected return. With three securities the efficient set is a piecewise-linear "critical line" in the plane of two weights, through the points where isomean lines touch isovariance ellipses; its image in the $(V, E)$ plane is the efficient frontier.

Scope: a single-period model in which means and covariances are known and investors care only about mean and variance (exact for normal returns or quadratic utility).`,
      idea: String.raw`Before 1952 the textbook rule (from J. B. Williams) was to buy the security with the highest discounted expected return, which implies holding a single stock; diversification was practised but not explained. Markowitz, then a graduate student, saw that maximising expected return alone ignores risk, and that maximising the expected return of a portfolio subject to its variance depends on covariances (fin-3.3) — so a security's worth depends on how it moves with the others. He drew the three- and four-security cases geometrically and later gave the critical-line algorithm for many securities, a quadratic programme (micro-13.2). Mean–variance analysis became the foundation of modern portfolio theory (fin-3.7), of Tobin's separation theorem and of the CAPM, and earned him the 1990 Nobel Prize. In practice the inputs are estimated with large errors, especially the means, so naively optimised portfolios are unstable, which motivates shrinkage, robust and Bayesian versions.`,
      caption: String.raw`**Left**: Markowitz's diagram. Each point of the triangle is a portfolio ($X_1$ across, $X_2$ up, $X_3 = 1 - X_1 - X_2$); grey lines are isomean lines, ellipses isovariance curves around the minimum-variance point, the green path the efficient set. Drag the **portfolio** (gold) anywhere. **Right**: the same portfolios in the risk–return plane: all feasible portfolios (cloud), the efficient frontier (green) and your portfolio. Drag the three **securities** to change their means and risks and use the **correlation** sliders; low correlation bends the frontier far to the left — diversification. Press **Estimate from 60 months** to rebuild the efficient set from a simulated sample of returns (orange) and see how much it moves.`,
      deps: ['fin-3.3', 'micro-13.2'],
      refs: [],
      tags: ['portfolio theory', 'diversification', 'optimisation'],
      credit: 'Harry Markowitz, 1952',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Modern_portfolio_theory' },
      viz(v) {
        const M = v.M;
        const r12 = v.slider('ρ₁₂', -0.9, 0.95, 0.3, { step: 0.01 });
        const r13 = v.slider('ρ₁₃', -0.9, 0.95, 0.1, { step: 0.01 });
        const r23 = v.slider('ρ₂₃', -0.9, 0.95, 0.4, { step: 0.01 });
        let est = null, seed = 1;
        v.button('Estimate from 60 months', () => { est = seed++; });
        v.button('True parameters', () => { est = null; });
        const T = v.stage({ x: [-0.08, 1.08], y: [-0.08, 1.08], equal: true, axes: false, height: 360, weight: 1, minWidth: 260, title: 'the three-security diagram' });
        const R = v.stage({ x: [0, 32], y: [0, 16], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 260, xlabel: 'risk σ (% per year)', ylabel: 'expected return E (% per year)', title: 'the E–V frontier' });
        const sec = [R.handle(14, 5, { color: 'blue', label: '1' }), R.handle(22, 9, { color: 'orange', label: '2' }), R.handle(30, 13, { color: 'purple', label: '3' })];
        const port = T.handle(0.55, 0.15, { color: 'gold', label: 'portfolio', constrain: (x, y) => { x = Math.max(0, x); y = Math.max(0, y); const s = x + y; return s > 1 ? [x / s, y / s] : [x, y]; } });
        const tri = (x) => [x[0], x[1]];
        let st = null;
        v.render(() => {
          for (const h of sec) h.set(M.clamp(h.x, 2, 31), M.clamp(h.y, 0.5, 15.5));
          let mu = sec.map((h) => h.y), sd = sec.map((h) => h.x), rho = [r12.value, r13.value, r23.value];
          let S = covOf(sd, rho);
          const pd = M.det(S) > 1e-6 && S[0][0] * S[1][1] - S[0][1] ** 2 > 0;
          if (!pd) { T.corner('these correlations are impossible together (matrix not positive definite)', 'tl', { color: 'red', size: 12, weight: 700 }); return; }
          // optional: estimated parameters from 60 simulated monthly returns
          let muE = null, SE = null;
          if (est !== null) {
            const r = v.rng(est * 97 + 5), L = M.cholesky(S.map((row) => row.map((x) => x / 12))), n = 60, xs = [];
            for (let k = 0; k < n; k++) { const z = [r.normal(), r.normal(), r.normal()]; xs.push(M.vadd(mu.map((m) => m / 12), M.matVec(L, z))); }
            const mm = [0, 1, 2].map((i) => M.mean(xs.map((x) => x[i])));
            muE = mm.map((m) => m * 12);
            SE = [0, 1, 2].map((i) => [0, 1, 2].map((j) => (12 * xs.reduce((s2, x) => s2 + (x[i] - mm[i]) * (x[j] - mm[j]), 0)) / (n - 1)));
          }
          // ---- triangle: isovariance contours and isomean lines (in X1, X2)
          const P = (X1, X2) => [X1, X2, 1 - X1 - X2];
          const vmax = Math.max(...sd) ** 2;
          T.poly([[0, 0], [1, 0], [0, 1]], { fill: 'faint', fillAlpha: 0.12, color: 'muted', width: 1.4 });
          T.clip(() => {
            T.contour((x, y) => (x < -0.002 || y < -0.002 || x + y > 1.002 ? NaN : Math.sqrt(pv(P(x, y), S))), [0.4, 0.55, 0.7, 0.85, 1].map((f) => f * Math.sqrt(vmax) * 0.9), { color: 'accent', width: 1.2, res: 90 });
            const levels = [0, 1, 2, 3, 4, 5, 6].map((k) => Math.min(...mu) + ((Math.max(...mu) - Math.min(...mu)) * k) / 6);
            T.contour((x, y) => (x < -0.002 || y < -0.002 || x + y > 1.002 ? NaN : pm(P(x, y), mu)), levels, { color: 'muted', width: 1, res: 60 });
          }, [-0.08, 1.08], [-0.08, 1.08]);
          // efficient set: minimum-variance portfolios for E from the global minimum up to the best mean
          const effPath = (m, Sx) => {
            const emin = Math.min(...m), emax = Math.max(...m); let best = Infinity, e0 = emin;
            for (let k = 0; k <= 200; k++) { const E = emin + ((emax - emin) * k) / 200, x = minVarAt(E, m, Sx, M); if (x) { const vv = pv(x, Sx); if (vv < best) { best = vv; e0 = E; } } }
            const pts = []; for (let k = 0; k <= 120; k++) { const E = e0 + ((emax - e0) * k) / 120, x = minVarAt(E, m, Sx, M); if (x) pts.push(x); }
            return pts;
          };
          const eff = effPath(mu, S);
          T.path(eff.map(tri), { color: 'green', width: 3.2 });
          if (eff.length) { T.dot(eff[0][0], eff[0][1], { r: 5, color: 'green' }); T.text('min. variance', eff[0][0], eff[0][1], { dx: 8, dy: 12, align: 'left', size: 11, color: 'green', weight: 600 }); }
          let effE = null; if (muE) { effE = effPath(muE, SE); T.path(effE.map(tri), { color: 'orange', width: 2.4, dash: [6, 4] }); }
          [['X₁ = 1', 1, 0], ['X₂ = 1', 0, 1], ['X₃ = 1', 0, 0]].forEach(([lab, x, y], i) => T.text(lab, x, y, { dx: i === 0 ? 4 : -4, dy: i === 1 ? -8 : 14, align: i === 0 ? 'left' : 'right', size: 11.5, color: ['blue', 'orange', 'purple'][i], weight: 700 }));
          const x = P(port.x, port.y), Ex = pm(x, mu), Vx = pv(x, S);
          // ---- risk-return plane
          const r = v.rng(3);
          for (let k = 0; k < 900; k++) { const a = -Math.log(r()), b = -Math.log(r()), c = -Math.log(r()), s = a + b + c, w = [a / s, b / s, c / s]; R.dot(Math.sqrt(pv(w, S)), pm(w, mu), { r: 1.4, color: 'muted', alpha: 0.35 }); }
          R.path(eff.map((w) => [Math.sqrt(pv(w, S)), pm(w, mu)]), { color: 'green', width: 3 });
          if (effE) R.path(effE.map((w) => [Math.sqrt(pv(w, S)), pm(w, mu)]), { color: 'orange', width: 2, dash: [6, 4] });
          R.dot(Math.sqrt(Vx), Ex, { r: 7, color: 'gold' });
          const naive = [1 / 3, 1 / 3, 1 / 3];
          R.dot(Math.sqrt(pv(naive, S)), pm(naive, mu), { r: 5, color: 'ink', hollow: true });
          R.text('1/N', Math.sqrt(pv(naive, S)), pm(naive, mu), { dx: 8, align: 'left', size: 11, color: 'muted', weight: 600 });
          // efficiency of the chosen portfolio: minimum variance at its mean
          const xm = minVarAt(Ex, mu, S, M), vmin = xm ? pv(xm, S) : Vx;
          st = { x, Ex, sdx: Math.sqrt(Vx), sdmin: Math.sqrt(vmin), avgsd: x[0] * sd[0] + x[1] * sd[1] + x[2] * sd[2], est: effE ? effE[effE.length > 0 ? Math.floor(effE.length / 2) : 0] : null, effMid: eff[Math.floor(eff.length / 2)] };
        });
        v.legend([['green', 'efficient set (true parameters)'], ['orange', 'efficient set from 60 months of data', { dash: true }], ['accent', 'isovariance'], ['muted', 'isomean / feasible portfolios'], ['gold', 'your portfolio', { dot: true }]]);
        v.readout(() => {
          if (!st) return 'choose correlations that can occur together';
          const { x, Ex, sdx, sdmin, avgsd } = st;
          const eff = sdx - sdmin < 0.02;
          const w = (a) => a.map((z) => `${Math.round(100 * z)}%`).join(' / ');
          return `portfolio ${w(x)}: E = ${v.fix(Ex, 2)}%, σ = ${v.fix(sdx, 2)}% — the weighted average of the three σ's would be ${v.fix(avgsd, 2)}%, so diversification removes ${v.fix(avgsd - sdx, 2)} points of risk · ${eff ? '**efficient**' : `not efficient: the critical line offers the same E with σ = ${v.fix(sdmin, 2)}%`}${st.est ? ` · estimated from 60 months, the middle of the efficient set moves from ${w(st.effMid)} to ${w(st.est)}` : ''}`;
        });
      },
    },
  ],
};
