// Microeconomics — Chapter 9: General equilibrium and welfare (items 9.17–9.21; 9.1–9.6 in ch09.js, 9.7–9.11 in ch09-b.js, 9.12–9.16 in ch09-c.js)
import { WALRAS_EQUILIBRIUM, walrasFlow, walrasTrajectory } from './source-audit-walras.js';
import { adMarket, adConvexEquilibrium, adNonconvexCertificate, adPriceMap, adProjectStart, adTrajectory } from './source-audit-arrow-debreu.js';
import { clamp, GUIDE, bisect, argmax, plateText, bar, W1, W2, pref, market, boxStage, drawBox, drawA, drawB, drawLens, priceLineBox, improvements, f2 } from './ch09.shared.js';

const cd = (a) => pref('cd', { a });
const ua = (F) => (x, y) => F.u(x, y);
const ub = (F) => (x, y) => F.u(W1 - x, W2 - y);
/** Arrow of a given pixel length from (x, y) in data direction (dx, dy). */
function arrowPx(s, x, y, dx, dy, len, st) {
  const X = s.X(x), Y = s.Y(y), ex = s.X(x + dx) - X, ey = s.Y(y + dy) - Y, L = Math.hypot(ex, ey);
  if (!(L > 0) || !(len > 1)) return;
  const [x2, y2] = s.inv(X + (ex / L) * len, Y + (ey / L) * len);
  s.arrow(x, y, x2, y2, st);
}
/** Cubic Hermite interpolation through control points [[x, z], …] sorted by x (Catmull-Rom tangents); constant outside. */
function hermite(pts) {
  const n = pts.length, xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  const m = xs.map((_, i) => (i === 0 ? (zs[1] - zs[0]) / (xs[1] - xs[0]) : i === n - 1 ? (zs[n - 1] - zs[n - 2]) / (xs[n - 1] - xs[n - 2]) : (zs[i + 1] - zs[i - 1]) / (xs[i + 1] - xs[i - 1])));
  return (x) => {
    if (x <= xs[0]) return zs[0]; if (x >= xs[n - 1]) return zs[n - 1];
    let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * zs[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * zs[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// ---- three-good economies used by 9.20 and 9.21 (Cobb–Douglas consumers: closed-form demands, gross substitutes) ----
const ALPHA = [[0.5, 0.3, 0.2], [0.2, 0.5, 0.3], [0.3, 0.2, 0.5]];   // budget shares of the three consumers
const OMEGA = [[3, 0.5, 1], [0.5, 2.5, 1], [1, 0.5, 3]];             // their endowments
const TOTAL = [0, 1, 2].map((g) => OMEGA[0][g] + OMEGA[1][g] + OMEGA[2][g]);
/** Excess demand of the exchange economy at prices p (all three prices > 0); `prof(p)` = extra income share handed out (profits), y = firm's net output. */
function excess(p, firm) {
  const sup = firm ? firm(p) : { y: [0, 0, 0], pi: 0 }, TH = [0.5, 0.2, 0.3], z = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const m = p[0] * OMEGA[i][0] + p[1] * OMEGA[i][1] + p[2] * OMEGA[i][2] + TH[i] * sup.pi;
    for (let g = 0; g < 3; g++) z[g] += (ALPHA[i][g] * m) / p[g];
  }
  return z.map((v, g) => v - TOTAL[g] - sup.y[g]);
}

export default {
  collection: 'micro',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.17
    {
      num: '9.17', kind: 'Theorem', name: 'Gorman aggregation and the representative consumer',
      statement: String.raw`Aggregate demand for a good is, in general, a function of the whole distribution of income across consumers, not only of total income. **Gorman's theorem** gives the conditions under which total income is enough: aggregate demand $X(p, m_1 + \dots + m_I)$ depends only on prices and the sum of incomes, **for every distribution of that total**, if and only if consumers' preferences admit indirect utilities of the **Gorman polar form** $v_i(p, m_i) = (m_i - a_i(p))/b(p)$ with the *same* $b$. Equivalently, every consumer's Engel curves are **straight lines with the same slope $\beta(p)$**, $x^i(p, m_i) = \alpha_i(p) + \beta(p)\, m_i$ (parallel Engel curves, with consumer-specific intercepts). In that case a **representative consumer** with income $\sum m_i$ has the aggregate demand and the same welfare ranking of price changes.`,
      idea: String.raw`Write aggregate demand as $\sum_i x^i(p, m_i)$ and ask when it does not move as income is shifted from one consumer to another: $\partial x^i/\partial m_i = \partial x^j/\partial m_j$ for every pair and every income pair, which forces every Engel curve to have the same slope at every income. A function whose derivative is the same number $\beta(p)$ at every income is a straight line, and so each Engel curve is $\alpha_i(p) + \beta(p) m_i$, the form that Cobb–Douglas, quasi-linear (in the unconstrained region) and Stone–Geary preferences share. Homothetic preferences with different budget shares have straight but non-parallel Engel curves, and aggregation fails: redistributing income toward the consumer who spends the larger share moves aggregate demand (4.x, 5.14).`,
      caption: String.raw`Left: the two consumers' **Engel curves** for good 1 at the current price (curve = demand against income) with their current incomes marked. Right: **aggregate demand for good 1 as income is transferred** from consumer 2 to consumer 1 (total income fixed at 10). Pair a Cobb–Douglas and a Stone–Geary consumer with the **same** taste parameter $\theta$ and the curve is flat: the Engel curves are parallel lines and only total income matters. Change one $\theta$, or choose quasi-linear tastes (an Engel curve that bends at the income where the consumer saturates), and the aggregate drifts with the transfer; the readout gives the size of the drift.`,
      deps: ['micro-2.4', 'micro-5.12', 'micro-5.14'],
      refs: ['Varian Ch. 15'], tags: ['aggregation', 'demand'],
      credit: 'W. M. Gorman, 1953 (Econometrica 21: 63–80)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gorman_polar_form' },
      viz(v) {
        const OPT = [{ value: 'cd', label: 'Cobb–Douglas' }, { value: 'sg', label: 'Stone–Geary' }, { value: 'ql', label: 'quasi-linear' }];
        const DEM = {
          cd: (p, m, th) => (th * m) / p,
          sg: (p, m, th) => { const g = 0.5; return m >= p * g ? g + (th * (m - p * g)) / p : m / p; },
          ql: (p, m, th) => { const a = 8 * th; return m >= a ? a / p : m / p; },
        };
        const t1 = v.select('consumer 1', OPT, 'cd'), t2 = v.select('consumer 2', OPT, 'sg');
        const th1 = v.slider('$\\theta_1$', 0.1, 0.9, 0.5, { step: 0.01 }), th2 = v.slider('$\\theta_2$', 0.1, 0.9, 0.5, { step: 0.01 });
        const pS = v.slider('price $p_1$ (good 2 is the numéraire)', 0.5, 2, 1, { step: 0.01 });
        const sS = v.slider('share of the total income 10 held by consumer 1', 0.1, 0.9, 0.5, { step: 0.01 });
        const M = 10;
        const E = v.stage({ x: [0, M], y: [0, 10], axes: 'box', gutter: true, height: 360, xlabel: 'income m', ylabel: 'demand for good 1', title: 'Engel curves (at the current price)', weight: 1 });
        const A = v.stage({ x: [0.1, 0.9], y: [0, 10], axes: 'box', gutter: true, height: 360, xlabel: 'share of income held by consumer 1', ylabel: 'aggregate demand for good 1', title: 'aggregate demand as income is redistributed', weight: 1 });
        v.legend([['accent', 'consumer 1'], ['orange', 'consumer 2'], ['ink', 'aggregate X'], ['gold', 'current allocation of income']]);
        let st = {};
        v.render(() => {
          const p = pS.value, s = sS.value, f1 = (m) => DEM[t1.value](p, m, th1.value), f2_ = (m) => DEM[t2.value](p, m, th2.value);
          const X = (q) => f1(q * M) + f2_((1 - q) * M);
          let top = 0; for (let i = 0; i <= 40; i++) top = Math.max(top, f1((M * i) / 40), f2_((M * i) / 40));
          E.setView([0, M], [0, top * 1.12]);
          E.fn(f1, { domain: [0.001, M], color: 'accent', width: 3 }); E.fn(f2_, { domain: [0.001, M], color: 'orange', width: 3 });
          const m1 = s * M, m2 = (1 - s) * M;
          E.line(m1, 0, m1, f1(m1), GUIDE); E.line(m2, 0, m2, f2_(m2), GUIDE);
          E.dot(m1, f1(m1), { r: 7, color: 'accent' }); E.dot(m2, f2_(m2), { r: 7, color: 'orange' });
          let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 80; i++) { const q = 0.1 + (0.8 * i) / 80, x = X(q); lo = Math.min(lo, x); hi = Math.max(hi, x); }
          const pad = Math.max(0.1 * (hi - lo), 0.6);
          A.setView([0.1, 0.9], [Math.max(0, lo - pad), hi + pad]);
          A.fn(X, { domain: [0.1, 0.9], color: 'ink', width: 3 });
          A.hline(X(s), { color: 'gold', width: 1.4, dash: [5, 4] }); A.vline(s, { color: 'gold', width: 1.4, dash: [5, 4] }); A.dot(s, X(s), { r: 7, color: 'gold' });
          const sl = (f, m) => (f(m + 0.5) - f(m - 0.5)) / 1;
          st = { x: X(s), drift: hi - lo, sl1: [sl(f1, 2), sl(f1, 8)], sl2: [sl(f2_, 2), sl(f2_, 8)], lo, hi };
        });
        v.readout(() => {
          const { x, drift, sl1, sl2 } = st;
          const par = drift < 1e-6 * 10 + 0.003;
          return `Engel-curve slopes at incomes 2 and 8: consumer 1 $(${f2(sl1[0], 3)}, ${f2(sl1[1], 3)})$, consumer 2 $(${f2(sl2[0], 3)}, ${f2(sl2[1], 3)})$. Aggregate demand now ${f2(x, 3)}; over all income distributions it ranges over $[${f2(st.lo, 3)}, ${f2(st.hi, 3)}]$, a drift of **${f2(drift, 3)}** ${par ? '(none: the Engel curves are straight and parallel, so only total income matters)' : '(so the distribution of income matters: no representative consumer exists)'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.18
    {
      num: '9.18', kind: 'Theorem', name: 'Sonnenschein–Mantel–Debreu theorem',
      statement: String.raw`Individual rationality puts strong restrictions on one consumer's demand (the Slutsky matrix is negative semidefinite), but almost none survive aggregation. **Sonnenschein–Mantel–Debreu:** let $z: P \to \R^n$ be a continuous function on a compact set $P$ of strictly positive prices that is homogeneous of degree zero and satisfies Walras' law, $p\cdot z(p) = 0$. Then there is an exchange economy with at least $n$ consumers, each having continuous, strictly convex, strongly monotone preferences, whose aggregate excess demand coincides with $z$ on $P$. Consequently, equilibrium theory on its own implies nothing about the **number** or **stability** of equilibria beyond existence (9.7), Walras' law and homogeneity: any finite number of zeros, stable or not, is possible.`,
      idea: String.raw`In two goods the theorem can be proved by hand. A homothetic consumer is described by his or her budget share $\sigma(p)$ of good 1; preferences are convex exactly when the unit expenditure function $e(p) = \exp\int\sigma\,d\ln p$ is concave, which only caps how fast $\sigma$ can **rise**: $d\sigma/d\ln p \le \sigma(1-\sigma)$. Let consumer $S$ own $\Omega$ units of good 1 and nothing else, so $z_S = \Omega(\sigma_S(p) - 1)$, and consumer $D$ own only good 2 with Leontief tastes and a huge kink, so $z_D \approx \Omega/2$ is almost flat. Choose $\sigma_S = 1 + (z - z_D)/\Omega$: it stays close to $\tfrac12$, so for large $\Omega$ its slope is far below the cap, and $z_S + z_D = z$ **exactly**. What makes the construction work are the huge, opposing gross trades: a wiggly aggregate comes from consumers who each trade far more than the net.`,
      caption: String.raw`**Drag the seven gold handles** to sketch any continuous excess-demand curve $z_1(p)$ for good 1 on a log price axis; $z_2 = -p\,z_1$ follows from Walras' law. Left: your sketch, its zeros marked stable or unstable. Right: the economy the tool builds, **two** consumers: the budget share $\sigma_S(p)$ of the seller $S$ (a smooth curve that always satisfies the convexity cap, green margin $\ge 0$) and the flat-demand buyer $D$. The readout confirms that their summed demand reproduces the sketch and Walras' law holds for each. (Leontief preferences for $D$ are only weakly monotone; the theorem proper uses strongly monotone preferences.)`,
      deps: ['micro-9.6', 'micro-9.17'],
      see: ['micro-9.8'],
      refs: ['Varian Ch. 32'], tags: ['general equilibrium', 'aggregation'],
      credit: 'H. Sonnenschein, 1973; R. Mantel, 1974; G. Debreu, 1974',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sonnenschein%E2%80%93Mantel%E2%80%93Debreu_theorem' },
      viz(v) {
        const P0 = [0.25, 0.4, 0.65, 1, 1.6, 2.5, 4], V0 = [2.4, 0.6, -1.2, 0.3, 1.5, -0.8, -2.2];
        const Z = v.stage({ x: [0.25, 4], y: [-4, 4], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'relative price p₁/p₂', ylabel: 'excess demand z₁', title: 'sketch an excess-demand curve', weight: 1.15 });
        const S = v.stage({ x: [0.25, 4], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'relative price p₁/p₂', ylabel: 'seller’s budget share σ_S', title: 'the seller S: always a convex consumer', weight: 1, minWidth: 260 });
        v.legend([['gold', 'your sketch z₁(p)'], ['ink', 'aggregate of S + D'], ['green', 'stable zero', { dot: true }], ['red', 'unstable zero', { dot: true }], ['accent', 'σ_S(p)'], ['green', 'convexity margin σ(1−σ) − dσ/dln p', { dash: true }]]);
        const hs = P0.map((p, i) => Z.handle(p, V0[i], { color: 'gold', r: 8, constrain: (x, y) => [p, clamp(y, -3.8, 3.8)] }));
        v.button('Add a wiggle (reset to three zeros)', () => hs.forEach((h, i) => h.set(P0[i], V0[i])));
        v.button('Flatten (one zero)', () => hs.forEach((h, i) => h.set(P0[i], 1.8 - 1.0 * Math.log2(P0[i] / 0.25) * 0.8 / 2)));
        let st = {};
        v.render(() => {
          const pts = hs.map((h, i) => [Math.log(P0[i]), h.y]), Zf = hermite(pts);
          const G = 260, lp = (i) => Math.log(0.25) + (Math.log(16) * i) / G;
          const dZ = (l) => (Zf(l + 1e-4) - Zf(l - 1e-4)) / 2e-4;
          // the buyer D: Leontief with a huge kink Θ and endowment of good 2 only, z_D(p) = (Ω/2) Θ/(p + Θ)
          const Th = 400, zD = (p, Om) => ((Om / 2) * Th) / (p + Th), dzD = (p, Om) => (-(Om / 2) * Th * p) / (p + Th) ** 2; // d/dln p
          let Om = 8 * (1 + Math.max(...Array.from({ length: G + 1 }, (_, i) => Math.abs(Zf(lp(i))))));
          const margin = (Om_) => { let mn = Infinity; for (let i = 0; i <= G; i++) { const l = lp(i), p = Math.exp(l), sg = 1 + (Zf(l) - zD(p, Om_)) / Om_, sl = (dZ(l) - dzD(p, Om_)) / Om_; mn = Math.min(mn, sg * (1 - sg) - sl); } return mn; };
          for (let k = 0; k < 80 && margin(Om) < 0.01; k++) Om *= 1.15;
          const sigma = (p) => 1 + (Zf(Math.log(p)) - zD(p, Om)) / Om;
          // the sketch and its zeros
          Z.hline(0, { color: 'muted', width: 1 });
          Z.fn((p) => Zf(Math.log(p)), { domain: [0.25, 4], color: 'gold', width: 2.4, n: 240 });
          const zS = (p) => Om * (sigma(p) - 1), agg = (p) => zS(p) + zD(p, Om);
          Z.fn(agg, { domain: [0.25, 4], color: 'ink', width: 1.6, n: 240, dash: [5, 4] });
          const roots = []; let pa = 0.25, fa = Zf(Math.log(0.25));
          for (let i = 1; i <= 400; i++) { const p = 0.25 * 16 ** (i / 400), f = Zf(Math.log(p)); if (fa * f < 0) { const r = bisect((q) => Zf(Math.log(q)), pa, p, 50); roots.push({ p: r, stable: f < fa }); } pa = p; fa = f; }
          for (const r of roots) { Z.dot(r.p, 0, { r: 7, color: r.stable ? 'green' : 'red', hollow: !r.stable }); }
          // seller's share and the cap
          S.fn(sigma, { domain: [0.25, 4], color: 'accent', width: 2.8, n: 240 });
          S.fn((p) => { const l = Math.log(p), sg = sigma(p), sl = (dZ(l) - dzD(p, Om)) / Om; return clamp(sg * (1 - sg) - sl, 0, 1); }, { domain: [0.25, 4], color: 'green', width: 1.8, n: 240, dash: [5, 4] });
          S.hline(0.5, { color: 'muted', width: 1, dash: [3, 3] });
          // checks
          let err = 0, wal = 0;
          for (let i = 0; i <= 60; i++) {
            const p = 0.25 * 16 ** (i / 60), sg = sigma(p);
            err = Math.max(err, Math.abs(agg(p) - Zf(Math.log(p))));
            // consumer S: income pΩ, spends share σ on good 1: x1 = Ωσ, x2 = (1−σ) pΩ ; consumer D: income c = ΩΘ/2, x1 = c/(p+Θ), x2 = Θ x1
            const c = (Om * Th) / 2, x1D = c / (p + Th), x2D = Th * x1D, z1 = Om * sg - Om + x1D, z2 = (1 - sg) * p * Om + x2D - c;
            wal = Math.max(wal, Math.abs(p * z1 + z2));
          }
          st = { roots, Om, err, wal, mg: margin(Om), sD: zD(1, Om) };
        });
        v.readout(() => {
          const { roots, Om, err, wal, mg, sD } = st;
          const ns = roots.filter((r) => r.stable).length;
          return `Your sketch has **${roots.length} zero${roots.length === 1 ? '' : 's'}** (${ns} stable, ${roots.length - ns} unstable). The construction: seller $S$ owns $\\Omega = ${f2(Om, 0)}$ units of good 1 and sells about half of them, buyer $D$ buys about ${f2(sD, 0)}; their net excess demand reproduces the sketch to within $${f2(err, 6)}$ and $p z_1 + z_2$ is within $${f2(wal, 6)}$ of zero. The convexity margin of $S$'s preferences is at least $${f2(mg, 3)} \\ge 0$: individually perfectly well-behaved consumers produce an arbitrary-looking market.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.19
    {
      num: '9.19', kind: 'Proposition', name: 'Equal-division competitive equilibrium is fair',
      statement: String.raw`Call an allocation **envy-free** if no consumer prefers another consumer's bundle to his or her own, and **fair** if it is both envy-free and Pareto efficient. **Proposition.** Suppose preferences are locally non-satiated and the endowment is an **equal division**, $\omega^i = \bar\omega / I$ for every consumer $i$. Then every Walrasian equilibrium allocation is fair. It is efficient by the first welfare theorem (9.9), and envy-free because every consumer has the same budget set $\{x : p \cdot x \le p\cdot\bar\omega/I\}$: whatever bundle another consumer chose was affordable to him or her too. With unequal endowments the equilibrium is still efficient, but the poorer consumer may envy the richer.`,
      idea: String.raw`If $A$ preferred $B$'s bundle $x^B$ to his or her own $x^A$, then $x^B$ must have been unaffordable to $A$, since $A$ chose the best affordable bundle. But $B$ paid for $x^B$ out of the same budget as $A$: $p\cdot x^B \le p\cdot\omega^B = p \cdot\omega^A$, so $x^B$ was affordable after all, a contradiction. Equal incomes, not equal tastes, are what is used, and the argument is another use of the fact that a Walrasian consumer's choice reveals his or her ranking of everything in the common budget set. In the box, the two bundles of an equilibrium are mirror images in the centre, and envy is a question of which side of an indifference curve the mirror image falls on.`,
      caption: String.raw`Start with $\omega$ at the centre of the box (gold). The market equilibrium $E$ (green) is found by clearing the markets; the hollow point $E'$ is $E$ reflected through the centre of the box: **$A$'s view of $B$'s bundle** (and, in $B$'s own coordinates, $B$'s view of $A$'s). $A$ envies $B$ if $E'$ lies above $A$'s blue curve through $E$, $B$ envies $A$ if $E'$ lies on the better side of $B$'s orange curve. At the centre neither does. **Drag $\omega$ away** from the centre: the poorer trader's envy bar turns negative.`,
      deps: ['micro-9.5', 'micro-9.9'],
      see: ['micro-9.9'],
      refs: ['Varian Ch. 34'], tags: ['welfare', 'fairness'],
      credit: 'D. Foley, 1967; H. Varian, 1974',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fair_division' },
      viz(v) {
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.65, { step: 0.01 });
        const bS = v.slider('$B$: weight on good 1', 0.15, 0.85, 0.3, { step: 0.01 });
        const s = boxStage(v, { title: 'the equilibrium and its reflection through the centre', height: 420, weight: 1.2 });
        const G = v.stage({ x: [0.4, 2.6], y: [-3, 3], axes: 'box', gutter: true, height: 420, ylabel: 'utility margin: own bundle − other’s', title: 'envy test', weight: 0.8, minWidth: 240, xticks: [[1, 'A'], [2, 'B']] });
        v.legend([['green', 'equilibrium E'], ['green', 'E′ = E reflected', { dot: true }], ['accent', 'A’s curve through E'], ['orange', 'B’s curve through E']]);
        const H = s.handle(5, 5, { color: 'gold', r: 9, label: 'ω', labelPos: 'ne', constrain: { x: [0.4, W1 - 0.4], y: [0.4, W2 - 0.4] } });
        v.button('Reset to equal division', () => H.set(5, 5));
        let st = {};
        v.render(() => {
          const FA = cd(aS.value), FB = cd(bS.value), M = market(FA, FB, [H.x, H.y]), roots = M.roots(0.05, 20);
          drawBox(s);
          s.dot(5, 5, { r: 3, color: 'muted' });
          if (!roots.length) { st = { none: true }; return; }
          const p = roots[0].p, E = M.demA(p), Ep = [W1 - E[0], W2 - E[1]];
          priceLineBox(s, H.x, H.y, p, { width: 1.4, alpha: 0.75 });
          drawA(s, FA, FA.u(...E)); drawB(s, FB, FB.u(W1 - E[0], W2 - E[1]));
          s.line(E[0], E[1], Ep[0], Ep[1], { color: 'muted', width: 1.3, dash: [4, 4] });
          s.dot(H.x, H.y, { r: 6, color: 'gold' }); s.dot(E[0], E[1], { r: 8, color: 'green' }); s.dot(Ep[0], Ep[1], { r: 7, color: 'green', hollow: true });
          plateText(s, 'E', E[0], E[1], { dx: -13, dy: -13, color: 'green' }); plateText(s, 'E′', Ep[0], Ep[1], { dx: 14, dy: 13, color: 'green' });
          // A: own bundle E vs B's bundle (W − E) in A's coordinates = Ep.  B: own bundle (W − E) vs A's bundle E.
          const mA = FA.u(E[0], E[1]) - FA.u(Ep[0], Ep[1]), mB = FB.u(W1 - E[0], W2 - E[1]) - FB.u(E[0], E[1]);
          G.hline(0, { color: 'muted', width: 1 });
          bar(G, 1, 0.6, 0, mA, mA >= 0 ? 'accent' : 'red'); bar(G, 2, 0.6, 0, mB, mB >= 0 ? 'orange' : 'red');
          G.text(mA >= 0 ? 'no envy' : 'ENVY', 1, mA, { dy: mA >= 0 ? -14 : 16, size: 12, weight: 700, color: mA >= 0 ? 'green' : 'red', align: 'center', plate: true });
          G.text(mB >= 0 ? 'no envy' : 'ENVY', 2, mB, { dy: mB >= 0 ? -14 : 16, size: 12, weight: 700, color: mB >= 0 ? 'green' : 'red', align: 'center', plate: true });
          const imp = improvements(ua(FA), ub(FB), E[0], E[1], 50);
          st = { p, E, Ep, mA, mB, equal: Math.hypot(H.x - 5, H.y - 5) < 0.06, imp };
        });
        v.readout(() => {
          if (st.none) return 'No equilibrium found.';
          const { p, E, mA, mB, equal, imp } = st;
          return `Equilibrium $p^* = ${f2(p, 3)}$: $A$ holds $(${f2(E[0])}, ${f2(E[1])})$ and $B$ holds $(${f2(W1 - E[0])}, ${f2(W2 - E[1])})$. Envy margins: $u_A(\\text{own}) - u_A(B\\text{'s}) = ${f2(mA, 3)}$, $u_B(\\text{own}) - u_B(A\\text{'s}) = ${f2(mB, 3)}$. The allocation is ${imp.area < 0.001 ? 'Pareto efficient' : 'not efficient'} and ${mA >= -1e-9 && mB >= -1e-9 ? '**envy-free, hence fair**' : '**not envy-free**'}${equal ? ' (equal division: the proposition guarantees both)' : mA < 0 || mB < 0 ? ': with unequal incomes the poorer trader can envy the richer one' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.20
    {
      num: '9.20', kind: 'Paper', name: 'Éléments d’économie politique pure',
      paper: { authors: 'Léon Walras', year: 1874, title: 'Éléments d’économie politique pure, ou théorie de la richesse sociale', venue: 'Lausanne: L. Corbaz', url: 'https://archive.org/details/lmentsdconomiep00walrgoog' },
      introduces: ['micro-9.5', 'micro-9.6', 'micro-2.7'],
      credit: 'Léon Walras, 1874, Lessons 9 and21–23; the displayed simultaneous ODE is an authored reconstruction',
      verify: false,
      statement: String.raw`Walras's 1874 text describes auction prices rising under excess demand and falling under excess supply (Lesson 9), then links many markets through individual exchange budgets (Lessons 21–22). His value identity implies that one clearing equation is redundant when all prices are positive. Lesson 22 describes successive proportional price adjustments and gives a heuristic argument for approaching equilibrium; it is not the simultaneous differential equation drawn here.

The picture is an **authored three-good exchange economy**, with good 3 as numéraire, $p_3=1$. Each Cobb–Douglas trader spends fixed shares of endowment income, so
$$x_{ig}(p)=\alpha_{ig}\frac{p\cdot\omega_i}{p_g},$$
$$z_g=\sum_i x_{ig}-W_g,\qquad\sum_g p_gz_g=0.$$
The chosen model dynamics are $\dot p_1=z_1$, $\dot p_2=z_2$ in model time. Its exact clearing prices are
$$p^*=\left(\frac{892}{797},\frac{1160}{797},1\right).$$
For this particular ODE, all strictly positive starting prices converge to $p^*$ by the explicit contraction argument below. This conclusion is proved for the model; it is not inferred from a finite plotted path or asserted for arbitrary economies.`,
      idea: String.raw`Apply the multiplier equations of 5.4 to $\sum_g\alpha_{ig}\log x_{ig}$ on the budget $\sum_g p_gx_{ig}=p\cdot\omega_i$. They give $\alpha_{ig}/x_{ig}=\lambda_i p_g$ and, because each row of shares sums to one, $\lambda_i=1/(p\cdot\omega_i)$. Thus each individual budget is exhausted and summing budgets proves Walras's value identity at every positive price, including away from equilibrium.

Let $C_{gh}=\sum_i\alpha_{ig}\omega_{ih}$. For the displayed shares and endowments,
$$C=\begin{pmatrix}19/10&9/10&8/5\\27/20&3/2&7/5\\5/4&11/10&2\end{pmatrix}.$$
Then $z_g=(Cp)_g/p_g-W_g$. The first two clearing equations with $p_3=1$ are linear:
$$\frac{13}{5}p_1-\frac9{10}p_2=\frac85,$$
$$-\frac{27}{20}p_1+2p_2=\frac75.$$
Their unique solution is the stated rational pair; the third market clears by the value identity. No long numerical run is used to locate this equilibrium.

For the model-specific convergence proof, put $r_i=p_i/p_i^*$ for $i=1,2$ and fix $r_3=1$. Define $a_{ih}=C_{ih}p_h^*/(p_i^*)^2>0$. Using the equilibrium equations gives
$$\dot r_i=\frac1{r_i}\sum_{h\ne i}a_{ih}(r_h-r_i).$$
The rectangle $[m,R]^2$, where $m=\min\{1,r_1(0),r_2(0)\}>0$ and $R=\max\{1,r_1(0),r_2(0)\}$, is invariant: each boundary derivative points inward. Smoothness on this compact positive rectangle gives global continuation. Set $V=\max_i|r_i-1|$. At every active maximum, including ties, the other ratio term has the favorable sign while the fixed anchor contributes strict decay:
$$D^+V\le-\kappa V,\qquad\kappa=\frac{\min\{a_{13},a_{23}\}}R>0.$$
Integrating the scalar comparison yields $V(t)\le V(0)e^{-\kappa t}$. This is a strict contraction, rather than just nonincreasing price extrema. It concerns the exact ODE. The finite integration and its step-doubling error estimate are separate numerical evidence.`,
      caption: String.raw`Move the gold **starting prices** or their sliders; the third slider selects **model time** 0–14. The left panel shows the complete finite price path, its current point and the exact green equilibrium ring. Arrows use the physical excess-demand direction. The middle panel retains all three complete excess-demand histories, including their starting peaks; dots mark the selected time. Signed bars on the right show the actual value terms and their floating-point sum at that time. **Start at exact equilibrium** selects the rational solution. No prices, histories or bars are clipped to an artificial range.`,
      scope: String.raw`Illustrative shares $(0.5,0.3,0.2)$, $(0.2,0.5,0.3)$, $(0.3,0.2,0.5)$; endowments $(3,0.5,1)$, $(0.5,2.5,1)$, $(1,0.5,3)$; totals $(4.5,3.5,5)$. These are authored model numbers, not data from the book. The model holds endowments fixed throughout price adjustment. Offered starting prices are $0.1\le p_1,p_2\le2.9$; model time is an arbitrary adjustment parameter, not measured trading rounds. The numerical path uses positive-stage RK4 with step doubling, sampled every 0.05 model-time unit; its local error target $2\times10^{-11}$ is an estimate, not a rigorous global numerical-error bound. The analytic contraction applies to every strictly positive start for this fixed ODE and its chosen adjustment speeds. The book's historical market-by-market process and a general convergence theorem are not simulated.`,
      deps: ['micro-2.5', 'micro-4.9', 'micro-5.4'],
      see: ['micro-9.5', 'micro-9.6'],
      refs: ['Walras (1874), Lesson 9 §§40–43 pp.47–51; Lessons 21–23 §§116–136 pp.119–137', 'https://archive.org/download/lmentsdconomiep00walrgoog/lmentsdconomiep00walrgoog.pdf'], tags: ['general equilibrium', 'history', 'price adjustment'],
      links: { source: 'https://archive.org/download/lmentsdconomiep00walrgoog/lmentsdconomiep00walrgoog.pdf', wikipedia: 'https://en.wikipedia.org/wiki/T%C3%A2tonnement' },
      viz(v) {
        const p1=v.slider('starting relative price $p_1$',.1,2.9,2.4,{step:.1,decimals:7}),p2=v.slider('starting relative price $p_2$',.1,2.9,.5,{step:.1,decimals:7});
        const time=v.slider('model time',0,14,7,{step:.05,decimals:2});
        const L=v.stage({x:[-.25,3.25],y:[-.25,3.25],equal:true,axes:'box',gutter:true,height:380,xlabel:'relative price p₁',ylabel:'p₂ (good 3 = 1)',title:'complete finite price path',xticks:[0,1,2,3],yticks:[0,1,2,3],weight:1.1});
        const T=v.stage({x:[-.6,14.6],y:[-3,5],axes:'box',gutter:true,height:380,xlabel:'time (model units)',ylabel:'excess demand',title:'all three complete demand histories',weight:1.1});
        const B=v.stage({x:[.45,4.55],y:[-3,3],axes:'box',gutter:true,height:380,ylabel:'value pᵢ zᵢ',title:'signed value terms at selected time',weight:.85,minWidth:240,xticks:[[1,'good 1'],[2,'good 2'],[3,'good 3'],[4,'sum']]});
        v.legend([['blue','good 1'],['orange','good 2'],['teal','good 3'],['green','exact equilibrium ring'],['gold','starting prices'],['accent','current prices / path']]);
        const H=L.handle(p1.value,p2.value,{color:'gold',r:9,constrain:{x:[.1,2.9],y:[.1,2.9]}});H.onDrag=()=>{p1.set(H.x);p2.set(H.y);};
        v.button('Start at exact equilibrium',()=>{p1.set(WALRAS_EQUILIBRIUM[0]);p2.set(WALRAS_EQUILIBRIUM[1]);});
        let cache={key:'',trace:null},info={};
        const range=(values,pad)=>{const lo=Math.min(0,...values),hi=Math.max(0,...values),margin=Math.max(.25,(hi-lo)*pad);return[lo-margin,hi+margin];};
        v.render(()=>{
          H.set(p1.value,p2.value);const key=`${p1.value}|${p2.value}`;if(key!==cache.key)cache={key,trace:walrasTrajectory([p1.value,p2.value])};
          const trace=cache.trace,index=Math.min(trace.points.length-1,Math.round(time.value/.05)),current=trace.points[index],colors=['blue','orange','teal'];
          for(let i=0;i<8;i++)for(let j=0;j<8;j++){const x=.2+.36*i,y=.2+.36*j,z=walrasFlow([x,y]);arrowPx(L,x,y,z[0],z[1],11,{color:'muted',width:1.2,alpha:.5});}
          L.path(trace.points.map(q=>q.p.slice(0,2)),{color:'accent',width:2.6});L.dot(...WALRAS_EQUILIBRIUM.slice(0,2),{color:'green',r:14,hollow:true});L.dot(...current.p.slice(0,2),{color:'accent',r:6});
          T.setView([-.6,14.6],range(trace.points.flatMap(q=>q.z),.14));T.hline(0,{color:'muted',width:1});
          for(let g=0;g<3;g++){T.path(trace.points.map(q=>[q.t,q.z[g]]),{color:colors[g],width:2.4});T.dot(current.t,current.z[g],{color:colors[g],r:5});}T.vline(current.t,{color:'gold',width:1.2,dash:[4,4]});
          B.setView([.45,4.55],range([...current.valueTerms,current.value],.22));B.hline(0,{color:'muted',width:1});current.valueTerms.forEach((q,g)=>bar(B,g+1,.55,0,q,colors[g]));bar(B,4,.55,0,current.value,'green',{fillAlpha:.9});
          const certificate=trace.certificate,deviation=Math.max(...current.p.slice(0,2).map((q,g)=>Math.abs(q/WALRAS_EQUILIBRIUM[g]-1)));
          const state={...current,start:[p1.value,p2.value],certificate,deviation,bound:certificate.initial*Math.exp(-certificate.rate*current.t),largestErrorRatio:trace.largestErrorRatio};info=state;
        });
        v.readout(()=>{const q=info;return `Model time ${f2(q.t,2)}: prices $(${q.p.map(p=>f2(p,7)).join(',')})$; excess demands $(${q.z.map(z=>f2(z,7)).join(',')})$. Value terms $(${q.valueTerms.map(z=>f2(z,7)).join(',')})$; computed sum $${v.sci(q.value,4)}$ (the exact budget identity is zero).\nExact equilibrium: $(892/797,1160/797,1)$. Normalized price deviation $V=${v.sci(q.deviation,4)}$; analytic bound $V(0)e^{-\\kappa t}=${v.sci(q.bound,4)}$, with $\\kappa=${f2(q.certificate.rate,6)}$. This bound proves the model ODE’s convergence; a finite numerical trace alone does not.\nAll 281 output times and all three demand histories are retained. Accepted local error estimates stay within their target (largest ratio ${f2(q.largestErrorRatio,5)}); this is not a formal global numerical-error certificate.`;});
      },
    },
    // ------------------------------------------------------------------ 9.21
    {
      num: '9.21', kind: 'Paper', name: 'Existence of an Equilibrium for a Competitive Economy',
      paper: { authors: 'Kenneth J. Arrow and Gerard Debreu', year: 1954, title: 'Existence of an Equilibrium for a Competitive Economy', venue: 'Econometrica 22 (3): 265–290', doi: '10.2307/1907353' },
      introduces: ['micro-9.7'],
      credit: 'K. J. Arrow and G. Debreu, 1954',
      verify: false,
      statement: String.raw`**Theorem I** gives sufficient conditions for competitive equilibrium with finitely many commodities, consumers and firms. Each production set $Y_j$ is closed, convex and contains $0$; aggregate production $Y=\sum_jY_j$ satisfies $Y\cap\R_+^\ell=\{0\}$ (no output without input) and $Y\cap(-Y)=\{0\}$ (irreversibility). Each consumption set $X_i$ is closed, convex and bounded below. Utility is continuous, nonsatiated and **semistrictly quasiconcave**: mixing a better bundle with a worse one strictly improves on the worse bundle. Each endowment $\omega_i$ strictly exceeds some feasible bundle in every coordinate; profit shares $\theta_{ij}\ge0$ sum to $1$ for each firm. Then there are prices $p^*\ge0$, $\sum_gp_g^*=1$, utility-maximizing affordable consumptions and profit-maximizing production plans with
$$z^*\le0,\qquad p^*\cdot z^*=0.$$
Thus every positive-price market clears; a zero-price good may remain in surplus. These are sufficient hypotheses, not necessary conditions for every economy.`,
      idea: String.raw`The original proof adds a **market participant** who maximizes $p\cdot z$ over the price simplex. Consumers choose within budgets that include their shares of firm profits, so this is an **abstract economy** whose feasible actions depend on other participants' choices. The production assumptions and lower bounds on consumption make resource-feasible choices bounded. The authors truncate to a compact cube, verify the abstract-economy lemma (including continuity of budget sets), then use convexity to extend the resulting optimum beyond the cube. Budget exhaustion gives $p\cdot z=0$; the market participant can put all price weight on any good, forcing each $z_g\le0$ (§§2–3). The paper does not investigate uniqueness or stability.

The authored illustration has utilities $u_i(x)=\prod_g x_g^{\alpha_{ig}}$, with the following budget shares and endowments (rows denote consumers),
$$\alpha=\begin{pmatrix}.5&.3&.2\\.2&.5&.3\\.3&.2&.5\end{pmatrix},$$
$$\omega=\begin{pmatrix}3&.5&1\\.5&2.5&1\\1&.5&3\end{pmatrix},\qquad\theta=(.5,.2,.3).$$
For decreasing returns the feasible set is the **whole hypograph** $Y=\{(-L,y,0):0\le L\le1000,\ 0\le y\le k\sqrt L\}$, a closed convex set. The positive root $u$ of $1159ku^2+2230u-1450k=0$ gives equilibrium input $L=u^2$; it stays below $0.711$ throughout the control range. For increasing returns, replace $\sqrt L$ by $L^{1.6}$ and the input cap by $3$. Profit maximization then permits only $L=0$ or $L=3$, both at a tie. Let $F=k3^{1.6}$ and $r=p_1/p_2$. Market clearing conditional on these choices requires respectively $r=1115/1450$ or $r=(1115+409F)/427$. At the first price capacity profit is positive; at the second it is negative, so neither choice is optimal. This exhausts the true production branches, including the tie. Boundary prices cannot rescue equilibrium: each strictly endowed consumer has positive wealth and no finite optimum when a desired good is free.`,
      caption: String.raw`**Authored production economy.** The green ring marks the analytically certified convex equilibrium. Under increasing returns, the two red rings mark market-clearing candidates conditional on $L=0$ or $L=3$; each fails the firm's profit test. The orange ring marks a profit-tie price, where both true firm choices leave a nonzero market gap. Drag the gold **start**, or use a preset, then choose **iteration 0–40**. The complete displacement history stays visible, with the selected iteration highlighted. Brightness and arrows describe $T_\lambda(p)=(p+\lambda z^+)/(1+\lambda\sum_gz_g^+)$ at strictly positive prices; the thin uncolored boundary strip is excluded from numerical evaluation. The iteration illustrates price adjustment; the existence and nonexistence conclusions come from the model’s exact calculations.`,
      scope: String.raw`The original result shown is Theorem I (§§1–3, pp. 265–279). The illustration has positive prices, strictly positive endowments, $k\in[1,3]$ and $\lambda\in[.02,.3]$. The starting handle has $p_g\ge.02$; later iterates remain positive but can be much smaller. No convergence claim follows from a finite path.`,
      deps: ['micro-9.6', 'micro-9.5', 'micro-4.6', 'game-2.4'],
      see: ['micro-9.7', 'micro-9.20'],
      refs: ['Arrow and Debreu (1954), §§1–3'], tags: ['general equilibrium', 'existence', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Arrow%E2%80%93Debreu_model', paper: 'https://web.stanford.edu/class/msande311/arrow-debreu.pdf' },
      viz(v) {
        const tech = v.select('the firm’s technology', [{ value: 'cvx', label: 'convex (decreasing returns)' }, { value: 'inc', label: 'non-convex (increasing returns)' }], 'cvx');
        const kS = v.slider('productivity $k$', 1, 3, 1.5, { step: .05 });
        const lS = v.slider('step size $\\lambda$', .02, .3, .06, { step: .01 });
        const nS = v.slider('selected iteration', 0, 40, 40, { step: 1 });
        const R3 = Math.sqrt(3) / 2, toXY = p => [p[1] + .5 * p[2], R3 * p[2]];
        const toP = (x, y) => { const p3 = y / R3, p2 = x - .5 * p3; return [1 - p2 - p3, p2, p3]; };
        const s = v.stage({ x: [-.22, 1.22], y: [-.2, 1.1], equal: true, axes: false, height: 440, title: 'prices and exact equilibrium certificates', weight: 1.2 });
        const G = v.stage({ x: [-3, 43], y: [-.08, 1.5], axes: 'box', gutter: true, height: 440, xlabel: 'iteration', ylabel: 'displacement ‖T(p) − p‖', title: 'the complete 40-step path', weight: 1, minWidth: 270 });
        const H = s.handle(...toXY([.6, .15, .25]), { color: 'gold', r: 9, constrain: (x, y) => toXY(adProjectStart(toP(x, y))) });
        const setStart = p => { H.set(...toXY(p)); nS.set(0); };
        v.button('start at the convex equilibrium', () => { tech.set('cvx'); setStart(adConvexEquilibrium(kS.value).p); });
        v.button('start at the firm’s tie price', () => { tech.set('inc'); setStart(adNonconvexCertificate(kS.value).tiePrice); });
        v.button('L=0 clearing candidate', () => { tech.set('inc'); setStart(adNonconvexCertificate(kS.value).branches[0].p); });
        v.button('L=3 clearing candidate', () => { tech.set('inc'); setStart(adNonconvexCertificate(kS.value).branches[1].p); });
        v.legend([['accent', 'selected path'], ['green', 'certified equilibrium', { dot: true }], ['gold', 'starting prices'], ['red', 'clearing candidate fails profit test', { dot: true }], ['orange', 'firm profit-tie price', { dot: true }]]);
        let info = {};
        v.render(() => {
          const k = kS.value, lambda = lS.value, kind = tech.value, n = nS.value, start = toP(H.x, H.y);
          const trajectory = adTrajectory(k, kind, start, lambda), current = trajectory.markets[n], equilibrium = adConvexEquilibrium(k), certificate = adNonconvexCertificate(k);
          s.raster((x, y) => { const p = toP(x, y); if (p.some(c => c < .005)) return null; const market = adMarket(k, kind, p), q = adPriceMap(p, market.z, lambda), d = Math.hypot(...q.map((c, g) => c - p[g])); const c = v.ramp(.9 * Math.exp(-d / .2), 'accent', 'panel'); return [...c, 255]; }, { key: `ad-simplex|${kind}|${k}|${lambda}`, res: 4 });
          s.path([[0, 0], [1, 0], [.5, R3]], { close: true, color: 'ink', width: 2 });
          s.text('p1=1', 0, 0, { dy: 22, align: 'center', size: 12, weight: 700 }); s.text('p2=1', 1, 0, { dy: 22, align: 'center', size: 12, weight: 700 }); s.text('p3=1', .5, R3, { dy: -22, align: 'center', size: 12, weight: 700 });
          for (let a = 0; a <= 8; a++) for (let b = 0; a + b <= 8; b++) {
            const p = adProjectStart([(a + .5) / 9.5, (b + .5) / 9.5, 1 - (a + b + 1) / 9.5]), q = adPriceMap(p, adMarket(k, kind, p).z, lambda), xy = toXY(p), end = toXY(q);
            arrowPx(s, ...xy, end[0] - xy[0], end[1] - xy[1], 9, { color: 'muted', width: 1.1, alpha: .65 });
          }
          s.path(trajectory.path.map(toXY), { color: 'muted', width: 1.3, alpha: .45 });
          s.path(trajectory.path.slice(0, n + 1).map(toXY), { color: 'accent', width: 2.4 });
          trajectory.path.slice(0, n + 1).forEach((p, i) => s.dot(...toXY(p), { r: i === n ? 6 : 2.5, color: 'accent' }));
          const ring = (p, color, label) => { const xy = toXY(p), near = Math.hypot(s.X(xy[0]) - s.X(H.x), s.Y(xy[1]) - s.Y(H.y)) < 22; s.dot(...xy, { r: near ? 18 : 8, hollow: true, color, width: 2 }); if (label) s.text(label, ...xy, { dy: -27, align: 'center', size: 12, weight: 700, color }); };
          if (kind === 'cvx') ring(equilibrium.p, 'green', 'equilibrium');
          else { certificate.branches.forEach(b => ring(b.p, 'red', `L=${b.L}`)); ring(certificate.tiePrice, 'orange'); }
          s.text('start', H.x, H.y, { dx: 20, dy: 4, align: 'left', size: 12, weight: 700, color: 'gold' });
          G.hline(0, { color: 'muted', width: 1 });
          G.path(trajectory.displacements.map((d, i) => [i, d]), { color: 'muted', width: 1.5, alpha: .5 });
          G.path(trajectory.displacements.slice(0, n + 1).map((d, i) => [i, d]), { color: 'accent', width: 2.5 });
          G.dot(n, trajectory.displacements[n], { r: 6, color: 'accent' });
          info = { k, lambda, kind, n, start, ...trajectory, current, equilibrium, certificate };
        });
        const number = x => ((Math.abs(x) !== 0 && Math.abs(x) < .0001) || Math.abs(x) >= 10000) ? x.toExponential(3).replace(/e([+-]?\d+)/, String.raw`\times10^{$1}`) : f2(x, 4);
        v.readout(() => {
          const { k, lambda, kind, n, current: c, displacements, equilibrium: e, certificate: cert } = info;
          const prices = c.p.map((p, g) => `$p_${g + 1}=${number(p)}$`).join(', '), error = Math.max(...c.z.map(Math.abs));
          const result = kind === 'cvx' ? `**Exact convex equilibrium:** $L^*=${f2(e.L, 6)}$, with maximum market residual $${number(Math.max(...e.z.map(Math.abs)))}$. The green ring comes from the analytic root; a finite iteration may remain far away.` : `**No equilibrium in this authored increasing-returns family.** At the $L=0$ clearing candidate, capacity would earn ${f2(cert.branches[0].capacityGain, 4)}; at the $L=3$ clearing candidate, capacity would earn ${f2(cert.branches[1].capacityGain, 4)} and shutting down earns zero. Both true choices at the orange tie price leave nonzero excess demand.`;
          return `Iteration **${n}** of 40: ${prices}. Displacement $${number(displacements[n])}$; maximum absolute excess demand $${number(error)}$; firm input $L=${number(c.L)}$${c.firm.tie ? ' (the tie has two maximizing choices; this path selects zero input)' : ''}. Step $\\lambda=${f2(lambda, 2)}$, productivity $k=${f2(k, 2)}$.\n\n${result}`;
        });
      },
    },
  ],
};
