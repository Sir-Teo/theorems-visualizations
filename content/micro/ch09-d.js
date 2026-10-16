// Microeconomics — Chapter 9: General equilibrium and welfare (items 9.17–9.21; 9.1–9.6 in ch09.js, 9.7–9.11 in ch09-b.js, 9.12–9.16 in ch09-c.js)
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
      credit: 'Léon Walras, 1874',
      verify: true,
      statement: String.raw`Walras (first edition, 1874–77) formulated, for the first time, the economy as a **system of simultaneous markets**: with $n$ goods there are $n$ prices (one a numéraire) and $n$ market equations, one of which is implied by the others (**Walras' law**), and the equilibrium prices solve the system. He also proposed how a market could find them: the **tâtonnement** ("groping"), in which a crier calls prices, traders announce what they would buy and sell, and the crier **raises the price of goods in excess demand and lowers the price of those in excess supply** until every market clears; no trade takes place before equilibrium is reached. Modern treatments formalise it as $\dot p_k = z_k(p)$; counting equations against unknowns suggests but does not prove existence (9.7), and Walras' own argument that groping converges was heuristic; convergence is proved under gross substitutability (Arrow, Block and Hurwicz, 1959) and fails in general (9.8).`,
      idea: String.raw`Before Walras, economists analysed one market at a time (partial equilibrium, 2.5). His insight is that the markets are linked by budgets: the value of everything a trader demands equals the value of everything he or she supplies, so excess demands cannot all be positive at once, and the quantity demanded of one good depends on all prices. The tâtonnement shows how a decentralised process could, in principle, find the prices without anyone knowing preferences: only excess-demand announcements are needed. He introduced the demand-and-supply equations for $n$ goods, the numéraire, the law of the auction, and the tâtonnement itself, ideas later formalised as price adjustment (2.7) and the Walras' law and Walrasian equilibrium of 9.5–9.6. What counts as "the" first edition's content (an exchange model in 1874, production in 1877) is simplified here; the picture is the modern reconstruction, not a figure of the book.`,
      caption: String.raw`A **model reconstruction** (not a figure from the book): three goods, three Cobb–Douglas traders with the endowments shown in the readout, good 3 as numéraire. **Drag the gold starting prices** $(p_1, p_2)$ in the left panel; the crier raises each price at the rate of its excess demand, $\dot p_k = z_k$ (arrows: the direction field), and the path winds in to the equilibrium (green). Middle: the three excess demands shrink to zero together. Right: the value of each good's excess demand and their **sum, always exactly zero** (Walras' law), at the moment shown.`,
      deps: ['micro-2.5', 'micro-4.9'],
      see: ['micro-9.5', 'micro-9.6'],
      refs: [], tags: ['general equilibrium', 'history', 'price adjustment'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/T%C3%A2tonnement' },
      viz(v) {
        const TMAX = 14;
        const L = v.stage({ x: [0, 3], y: [0, 3], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'price of good 1 (good 3 = 1)', ylabel: 'price of good 2', title: 'tâtonnement in the price plane', weight: 1.1 });
        const T = v.stage({ x: [0, TMAX], y: [-3, 5], axes: 'box', gutter: true, height: 380, xlabel: 'time (rounds of the crier)', ylabel: 'excess demand', title: 'excess demands over time', weight: 1.1 });
        const B = v.stage({ x: [0.4, 4.6], y: [-3, 3], axes: 'box', gutter: true, height: 380, ylabel: 'value p_k z_k', title: 'Walras’ law at this moment', weight: 0.8, minWidth: 240, xticks: [[1, 'good 1'], [2, 'good 2'], [3, 'good 3'], [4, 'sum']] });
        v.legend([['blue', 'good 1'], ['orange', 'good 2'], ['teal', 'good 3'], ['green', 'equilibrium'], ['gold', 'starting prices']]);
        const H = L.handle(2.4, 0.5, { color: 'gold', r: 9, label: 'p(0)', labelPos: 'ne', constrain: { x: [0.1, 2.9], y: [0.1, 2.9] } });
        const zf = (p1, p2) => excess([p1, p2, 1]);
        // equilibrium: long run of the same dynamics from (1, 1)
        const eq = (() => { let q = [1, 1]; for (let i = 0; i < 20000; i++) { const z = zf(q[0], q[1]); q = [clamp(q[0] + 0.01 * z[0], 0.02, 20), clamp(q[1] + 0.01 * z[1], 0.02, 20)]; } return q; })();
        const DT = 0.02, NS = Math.round(TMAX / DT); let cache = { key: '', tr: [] };
        const traj = (p0) => {
          const key = p0.join('|'); if (cache.key === key) return cache.tr;
          const f = (q) => { const z = zf(clamp(q[0], 0.02, 30), clamp(q[1], 0.02, 30)); return [z[0], z[1]]; };
          let q = [...p0]; const tr = [q];
          for (let k = 0; k < NS; k++) {
            const a = f(q), b = f([q[0] + (DT / 2) * a[0], q[1] + (DT / 2) * a[1]]), c = f([q[0] + (DT / 2) * b[0], q[1] + (DT / 2) * b[1]]), d = f([q[0] + DT * c[0], q[1] + DT * c[1]]);
            q = [clamp(q[0] + (DT / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]), 0.02, 30), clamp(q[1] + (DT / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1]), 0.02, 30)]; tr.push(q);
          }
          cache = { key, tr }; return tr;
        };
        let st = {};
        v.animate((t) => {
          const tr = traj([Math.round(H.x * 100) / 100, Math.round(H.y * 100) / 100]), n = Math.min(NS, Math.round(((t / 12) * TMAX) / DT)), q = tr[n];
          // direction field
          for (let i = 1; i <= 8; i++) for (let j = 1; j <= 8; j++) { const x = 0.37 * i, y = 0.37 * j, z = zf(x, y); arrowPx(L, x, y, z[0], z[1], 11, { color: 'muted', width: 1.2, alpha: 0.55 }); }
          L.path(tr.slice(0, n + 1).filter((_, i) => i % 4 === 0), { color: 'accent', width: 2.6 });
          L.dot(eq[0], eq[1], { r: 8, color: 'green' }); L.dot(H.x, H.y, { r: 6, color: 'gold' }); L.dot(q[0], q[1], { r: 6, color: 'accent' });
          T.hline(0, { color: 'muted', width: 1 });
          const col = ['blue', 'orange', 'teal'];
          for (let g = 0; g < 3; g++) T.path(tr.filter((_, i) => i % 5 === 0 && i <= n).map((r, i) => [i * 5 * DT, excess([r[0], r[1], 1])[g]]), { color: col[g], width: 2.4 });
          T.vline((n * DT), { color: 'gold', width: 1.4, dash: [4, 4] });
          const z = excess([q[0], q[1], 1]), pz = [q[0] * z[0], q[1] * z[1], z[2]], sum = pz[0] + pz[1] + pz[2];
          B.hline(0, { color: 'muted', width: 1 });
          pz.forEach((val, g) => bar(B, g + 1, 0.55, 0, val, col[g]));
          bar(B, 4, 0.55, 0, sum, 'green', { fillAlpha: 0.9 });
          B.text('Σ = 0', 4, 0, { dy: -14, size: 12, weight: 700, color: 'green', align: 'center', plate: true });
          st = { q, z, sum, t: n * DT };
        }, { period: 12, still: 11.5 });
        v.readout(() => {
          const { q, z, sum, t } = st;
          return `Round ${f2(t, 1)}: prices $(p_1, p_2, p_3) = (${f2(q[0], 3)}, ${f2(q[1], 3)}, 1)$, excess demands $(${f2(z[0], 3)}, ${f2(z[1], 3)}, ${f2(z[2], 3)})$. The value of excess demand $\\sum_k p_k z_k = ${f2(sum, 6)}$ at every price vector, not just in equilibrium. Equilibrium: $p^* = (${f2(eq[0], 3)}, ${f2(eq[1], 3)}, 1)$. Model economy: Cobb–Douglas traders with budget shares $(0.5, 0.3, 0.2)$, $(0.2, 0.5, 0.3)$, $(0.3, 0.2, 0.5)$ and endowments $(3, 0.5, 1)$, $(0.5, 2.5, 1)$, $(1, 0.5, 3)$; gross substitutes, so the groping converges from every start.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.21
    {
      num: '9.21', kind: 'Paper', name: 'Existence of an Equilibrium for a Competitive Economy',
      paper: { authors: 'Kenneth J. Arrow and Gerard Debreu', year: 1954, title: 'Existence of an Equilibrium for a Competitive Economy', venue: 'Econometrica 22 (3): 265–290', doi: '10.2307/1907353' },
      introduces: ['micro-9.7'],
      credit: 'K. J. Arrow & G. Debreu, 1954 (independently: L. McKenzie, 1954)',
      verify: true,
      statement: String.raw`Arrow and Debreu (1954) proved that a competitive equilibrium exists in a general model with many goods, consumers with convex preferences and **producers with convex production sets**: there are prices $p^* \ge 0$ at which every consumer maximises utility on his or her budget set (income includes shares in the producers' profits), every producer maximises profit over a convex set of feasible input-output plans, and every market clears (free goods allowed). The proof reduces the economy to an **abstract economy** (a game with constrained strategies, in which the "auctioneer" chooses prices to raise the price of goods in excess demand) and applies Kakutani's fixed-point theorem. Lionel McKenzie proved a similar theorem independently in the same year. Convexity of preferences and of the production sets is essential: with increasing returns or a fixed cost no equilibrium need exist.`,
      idea: String.raw`Before the paper, existence was argued by counting equations (Walras) or proved only in special models (Wald, 1936). Arrow and Debreu saw that the equilibrium conditions say that a certain correspondence from a set of price-and-choice vectors into itself has a fixed point, and that Kakutani's theorem (the set-valued version of Brouwer's, game-2.4) supplies one as soon as the choice sets are convex and the best-response correspondences are convex-valued and upper-hemicontinuous, which convexity assumptions guarantee. The price player gets the payoff $p\cdot z$ (raise prices of goods in excess demand), so a fixed point has $z \le 0$ and, with Walras' law (9.6), $z = 0$ for goods with positive price. The picture below is not the paper's argument but the textbook version of the same idea: a continuous map of the price simplex into itself whose fixed points are equilibria.`,
      caption: String.raw`A **model reconstruction**, not a table from the paper: three goods, three Cobb–Douglas consumers and one firm turning good 1 into good 2. The triangle is the **price simplex** ($p_1 + p_2 + p_3 = 1$; the corners are the pure-good prices); brightness shows how far each price vector is from resting under the price-raising map $p \mapsto (p + \lambda z^+)/(1 + \lambda\sum z^+)$, arrows show where it moves, and the **green dot** is the fixed point, an equilibrium. **Drag the start** and watch the iteration run in. Switch the firm to **increasing returns** (non-convex technology): its supply jumps, no price is at rest, the iteration chatters and the readout reports the smallest displacement found.`,
      deps: ['micro-9.20', 'micro-9.5', 'micro-4.6', 'game-2.4'],
      see: ['micro-9.7'],
      refs: [], tags: ['general equilibrium', 'existence', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Arrow%E2%80%93Debreu_model' },
      viz(v) {
        const tech = v.select('the firm’s technology', [{ value: 'cvx', label: 'convex (decreasing returns)' }, { value: 'inc', label: 'non-convex (increasing returns)' }], 'cvx');
        const kS = v.slider('productivity $k$ of the firm', 1, 3, 1.5, { step: 0.05 });
        const lS = v.slider('step size $\\lambda$ of the price map', 0.02, 0.3, 0.06, { step: 0.01 });
        const R3 = Math.sqrt(3) / 2;
        const s = v.stage({ x: [-0.12, 1.12], y: [-0.1, 0.98], equal: true, axes: false, height: 440, title: 'the price simplex and the price-raising map', weight: 1.3 });
        const G = v.stage({ x: [0, 40], y: [0, 0.6], axes: 'box', gutter: true, height: 440, xlabel: 'iteration', ylabel: 'displacement ‖T(p) − p‖', title: 'does the iteration come to rest?', weight: 0.8, minWidth: 250 });
        v.legend([['accent', 'iterates of the map'], ['green', 'fixed point = equilibrium', { dot: true }], ['gold', 'starting prices'], ['red', 'no rest point', { dot: true }]]);
        const toXY = (p) => [p[1] + 0.5 * p[2], R3 * p[2]];
        const toP = (x, y) => { const p3 = y / R3, p2 = x - 0.5 * p3; return [1 - p2 - p3, p2, p3]; };
        const clampP = (p) => { let q = p.map((c) => Math.max(c, 0.02)); const sum = q[0] + q[1] + q[2]; return q.map((c) => c / sum); };
        const H = s.handle(...toXY([0.6, 0.15, 0.25]), { color: 'gold', r: 9, label: 'p(0)', labelPos: 'ne', constrain: (x, y) => toXY(clampP(toP(x, y))) });
        const firmOf = () => {
          const k = kS.value, a = tech.value === 'cvx' ? 0.5 : 1.6, Lmax = tech.value === 'cvx' ? 1e3 : 3;
          return (p) => {
            const profL = (Lc) => p[1] * k * Lc ** a - p[0] * Lc;
            const Lc = a < 1 ? Math.min(Lmax, ((a * k * p[1]) / p[0]) ** (1 / (1 - a))) : (profL(Lmax) > 0 ? Lmax : 0);
            return { y: [-Lc, k * Lc ** a, 0], pi: profL(Lc), L: Lc };
          };
        };
        const mapT = (z, p, l) => { const zp = z.map((c) => Math.max(0, c)), S = zp[0] + zp[1] + zp[2]; return p.map((c, i) => (c + l * zp[i]) / (1 + l * S)); };
        const disp = (F, p, l) => { const q = mapT(excess(p, F), p, l); return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); };
        let cache = { key: '', rest: null };
        const rest = (F, l) => {
          const key = `${tech.value}|${kS.value}|${l}`; if (cache.key === key) return cache.rest;
          let best = { d: Infinity, p: null }; const N = 60;
          for (let i = 1; i < N; i++) for (let j = 1; j < N - i; j++) { const p = [i / N, j / N, 1 - i / N - j / N], d = disp(F, p, 1); if (d < best.d) best = { d, p }; }
          let p = best.p, d = disp(F, p, 1), h = 0.02;
          for (let it = 0; it < 500; it++) { let moved = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const q = [p[0] + dx * h, p[1] + dy * h, 1 - (p[0] + dx * h) - (p[1] + dy * h)]; if (q.some((c) => c <= 1e-3)) continue; const w = disp(F, q, 1); if (w < d) { d = w; p = q; moved = true; } } if (!moved) h *= 0.6; }
          return (cache = { key, rest: { p, d } }).rest;
        };
        let this_state = { found: true, rp: { d: 0, p: [1 / 3, 1 / 3, 1 / 3] }, last: [1 / 3, 1 / 3, 1 / 3], dLast: 0, Lq: 0, steps: 0 };
        v.animate((t) => {
          const F = firmOf(), l = lS.value, steps = Math.min(40, Math.floor(t * 3.4));
          const rp = rest(F, l);
          // brightness: displacement of the map from each price vector
          const key = `${tech.value}|${kS.value}|${l}`;
          s.raster((x, y) => { const p = toP(x, y); if (p[0] < 0 || p[1] < 0 || p[2] < 0) return null; const d = disp(F, p, 1), c = v.ramp(0.9 * Math.exp(-d / 0.12), 'accent', 'panel'); return [c[0], c[1], c[2], 255]; }, { key: `simplex|${key}`, res: 3 });
          s.path([[0, 0], [1, 0], [0.5, R3]], { close: true, color: 'ink', width: 2 });
          s.text('good 1', 0, 0, { dy: 16, size: 12, weight: 700, color: 'ink', align: 'center' }); s.text('good 2', 1, 0, { dy: 16, size: 12, weight: 700, color: 'ink', align: 'center' }); s.text('good 3', 0.5, R3, { dy: -14, size: 12, weight: 700, color: 'ink', align: 'center' });
          for (let a = 0; a <= 9; a++) for (let b = 0; b + a <= 9; b++) {
            const p = clampP([(a + 0.5) / 10.5, (b + 0.5) / 10.5, 1 - (a + 0.5) / 10.5 - (b + 0.5) / 10.5]), q = mapT(excess(p, F), p, 1), xy = toXY(p), xy2 = toXY(q);
            arrowPx(s, xy[0], xy[1], xy2[0] - xy[0], xy2[1] - xy[1], 11, { color: 'muted', width: 1.2, alpha: 0.7 });
          }
          // iterates
          let p = clampP(toP(H.x, H.y)); const path = [p], ds = [disp(F, p, l)];
          for (let i = 0; i < 40; i++) { p = mapT(excess(p, F), p, l); path.push(p); ds.push(disp(F, p, l)); }
          s.path(path.slice(0, steps + 1).map(toXY), { color: 'accent', width: 2.4 });
          path.slice(0, steps + 1).forEach((q, i) => { const xy = toXY(q); s.dot(xy[0], xy[1], { r: i === steps ? 6 : 3, color: 'accent' }); });
          const found = rp.d < 2e-3, xr = toXY(rp.p);
          s.dot(xr[0], xr[1], { r: 8, color: found ? 'green' : 'red', hollow: !found });
          if (!found) plateText(s, 'no rest point', xr[0], xr[1], { dy: 20, color: 'red', align: 'center' });
          s.dot(H.x, H.y, { r: 6, color: 'gold' });
          // displacement over iterations
          G.fn(() => 0, { domain: [0, 40], color: 'muted', width: 1 });
          G.path(ds.map((d, i) => [i, Math.min(d, 0.59)]), { color: 'accent', width: 2.4 });
          G.dot(steps, Math.min(ds[steps], 0.59), { r: 6, color: 'accent' });
          this_state = { found, rp, F, steps, last: path[steps], dLast: ds[steps], Lq: F(path[steps]).L, fp: path };
        }, { period: 14, still: 13 });
        v.readout(() => {
          const { found, rp, last, dLast, Lq, steps } = this_state;
          return `Iteration ${steps}: prices $(${f2(last[0], 3)}, ${f2(last[1], 3)}, ${f2(last[2], 3)})$, displacement $\\lVert T(p) - p\\rVert = ${f2(dLast, 4)}$, the firm uses ${f2(Lq, 2)} units of good 1. ${found ? `**A fixed point exists**: $p^* = (${rp.p.map((c) => f2(c, 3)).join(', ')})$, displacement ${rp.d < 1e-9 ? 'below 1e-9' : rp.d.toExponential(1)} (zero up to the search tolerance), so excess demand is zero there.` : `**No price vector is at rest**: the smallest displacement found anywhere on the simplex is ${f2(rp.d, 3)}. With increasing returns the firm's supply jumps from zero to its capacity as prices cross a threshold, so excess demand is discontinuous and Brouwer's and Kakutani's theorems no longer apply.`}`;
        });
      },
    },
  ],
};
