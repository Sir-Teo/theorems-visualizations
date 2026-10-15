// Networks & Collective Behavior — Chapter 1, part b: tipping, binary choices and threshold models (1.6–1.9, 1.11).
//
// Verified against Granovetter (1978), AJS 83 (6): 1420–1443 (full text):
// - threshold = "the proportion of the group he would have to see join before he would do so" (p. 1422); thresholds
//   adapted from Schelling's segregation models (fn. 2); numbers or proportions interchangeable, groups of 100 (fn. 3).
// - p. 1424–1425: 100 people, thresholds 0, 1, 2, …, 99 → "all 100 people have joined. The equilibrium is 100"; remove the
//   person with threshold 1 and replace him by one with threshold 2 → "the riot ends at that point, with one rioter";
//   headlines "A crowd of radicals engaged in riotous behavior" vs "A demented troublemaker broke a window while a group
//   of solid citizens looked on".
// - p. 1425–1427: r(t + 1) = F[r(t)] with F the c.d.f. of thresholds; equilibrium where the c.d.f. "first crosses the 45°
//   line from above" (Fig. 1, due to C. Winship).
// - p. 1427 and Fig. 2 (analysis by B. Phillips): N = 100, thresholds normal with mean 25 (below 0 counted as 0); as the
//   standard deviation rises, the equilibrium "increases gradually to about six", then at a critical point "approximately
//   12.2" jumps "to nearly 100, after which it declines" (limit 50 as σ → ∞).
// - p. 1429: friends count double; threshold 50%, 48 of 100 rioting, 15 of 20 friends → perceived 63/120 = .525.
// - p. 1431: crowds of 100 drawn from a population with the uniform distribution: P(no instigator) = (.99)^100 = .37;
//   one instigator and no one-percenter ≈ .14; "in over half the cases (.37 + .14 = .51)" zero or one rioter.
// - p. 1438–1439, Fig. 3: net benefit crossing zero once at the threshold (38% in his example); two crossings need other models.
// Schelling (1973), "Hockey Helmets, Concealed Weapons, and Daylight Saving: A Study of Binary Choices with Externalities",
// J. Conflict Resolution 17 (3): 381–428 — the diagrams (payoff to Left and to Right against the number choosing Right) and
// the uniform multi-person prisoner's dilemma with its minimum coalition k, as restated in secondary sources (the paper's
// full text was not available to check wording; nothing here quotes it).

import { rng32, gauss, Phi, PhiInv, cascade, firstCrossing } from './ch01.shared.js';

const pc = (x) => `${Math.round(100 * x)}%`;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** Thresholds of a crowd of N whose distribution is normal(μ, σ), taken at the quantiles (j + ½)/N, rounded, clipped to [0, 99]. */
function normalCrowd(N, mu, sig) { const out = []; for (let j = 0; j < N; j++) out.push(clamp(Math.round(mu + sig * PhiInv((j + 0.5) / N)), 0, 99)); return out; }
/** Granovetter's normal case: equilibrium of N·Φ((x − μ)/σ) (thresholds below 0 count as 0), and the critical σ (tangency). */
const normalEq = (mu, sig, N = 100) => firstCrossing((x) => N * Phi((x - mu) / sig), N);
function criticalSigma(mu, N = 100) {
  const smax = (N / Math.sqrt(2 * Math.PI)) * 0.999;
  const g = (s) => { const z0 = Math.sqrt(-2 * Math.log((s * Math.sqrt(2 * Math.PI)) / N)); return N * Phi(-z0) - (mu - s * z0); };
  let lo = 0.5, hi = smax; if (g(lo) >= 0) return { s: NaN, x: NaN };
  for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (g(m) < 0) lo = m; else hi = m; }
  const s = (lo + hi) / 2, z0 = Math.sqrt(-2 * Math.log((s * Math.sqrt(2 * Math.PI)) / N));
  return { s, x: mu - s * z0 };
}
/** Step graph of a finite c.d.f. F (Int32Array on 0…N) as polyline points, for x in [0, xmax]. */
function stepPts(F, xmax) { const pts = []; const N = F.length - 1; for (let x = 0; x <= Math.min(N, xmax); x++) { pts.push([x, F[x]], [x + 1, F[x]]); } return pts; }
/** Cobweb staircase for r(t+1) = F(r(t)) from the list of levels rs = [0, r1, r2, …]. */
function cobweb(rs) { const pts = [[rs[0], rs[0]]]; for (let t = 1; t < rs.length; t++) { pts.push([rs[t - 1], rs[t]], [rs[t], rs[t]]); } return pts; }

export default {
  collection: 'soc',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Critical mass and tipping points',
      statement: String.raw`When each person's choice depends on how many others are making it, the collective outcome is governed by a **response curve**: the share $F(x)$ of people who will act if a share $x$ is acting. With people adjusting to the current level, the share acting evolves by $x_{t+1} = F(x_t)$, and its equilibria are the fixed points $F(x^*) = x^*$ — the crossings of the response curve with the 45° line. For a non-decreasing $F$, a crossing where the curve passes from above the line to below it ($F'(x^*) < 1$) is stable, and one where it passes from below to above is unstable.

When $F$ is S-shaped — few will act alone, most will act once many do — there are two stable equilibria, near 0 and near 1, separated by an unstable one $x_c$: the **critical mass** or **tipping point**. Any start above $x_c$ snowballs to the high equilibrium; any start below it collapses.

If a parameter $c$ shifts the curve, the low (or the high) equilibrium can merge with the tipping point and vanish, a fold: the state then jumps to the other equilibrium, and moving the parameter back does not undo the jump (**hysteresis**). For thresholds spread normally with standard deviation $\sigma$ (in units of the population share), folds and tipping exist exactly when $\sigma < 1/\sqrt{2\pi} \approx 0.40$.`,
      scope: String.raw`Holds for a monotone response curve and myopic adjustment to the current level of participation. Non-monotone curves (people who join a crowd but leave when it gets too big) can produce oscillation, and forward-looking people can coordinate on an equilibrium directly.`,
      idea: String.raw`Iterating a non-decreasing map moves the state monotonically in the direction in which $F(x) - x$ points, so the whole dynamic is read off the sign of $F(x) - x$ — a phase line for a map, drawn by cobwebbing (mathbio-2.3). Schelling's examples — a seminar that survives only if enough people come, a neighbourhood that tips (soc-1.5), a convention — share this geometry. With thresholds normal($\tfrac12 - c$, $\sigma$), $F_c(x) = \Phi((x + c - \tfrac12)/\sigma)$, and the equilibria form the curve $c = \tfrac12 - x + \sigma\,\Phi^{-1}(x)$; it folds back where $dc/dx = 0$, i.e. where $\varphi(\Phi^{-1}(x)) = \sigma$, which has solutions only if $\sigma < \varphi(0) = 1/\sqrt{2\pi}$. Those folds are saddle-node bifurcations of the fixed-point equation (ode-8.3), and the region between them is a hysteresis loop (ode-8.6).`,
      caption: String.raw`Left: the response curve (blue) and the 45° line. Drag the gold start $x_0$: the cobweb shows the share acting round by round, and the arrows under the axis are the phase line. Right: all equilibria against the incentive $c$ — solid green stable, dashed red the tipping point. Move $c$ and the state (black ring) follows its branch, jumping at a fold; the gold trail records where it has been (it starts with a full sweep, a hysteresis loop). Raise the spread $\sigma$ past 0.40 and the S-shape, the tipping point and the hysteresis disappear.`,
      deps: ['soc-1.5', 'mathbio-2.3'],
      see: ['ode-1.7', 'ode-8.3', 'ode-8.6', 'climate-5.7', 'soc-5.13', 'macro-12.7'],
      refs: ['Schelling ch. 3'],
      tags: ['tipping', 'critical mass', 'dynamics'],
      credit: 'Schelling, 1971–1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Critical_mass_(sociodynamics)' },
      viz(v) {
        let trail = [], state = 0;
        const sig = v.slider('spread of thresholds $\\sigma$', 0.04, 0.6, 0.15, { step: 0.005, onChange: () => settle() });
        const cS = v.slider('incentive $c$ (lowers every threshold by $c$)', -0.4, 0.4, 0, { step: 0.005, onChange: () => settle() });
        const F = (x) => Phi((x + cS.value - 0.5) / sig.value);
        const attract = (x, f = F) => { for (let k = 0; k < 20000; k++) { const y = f(x); if (Math.abs(y - x) < 1e-11) return y; x = y; } return x; };
        const L = v.stage({ x: [-0.07, 1.05], y: [-0.13, 1.05], height: 360, axes: 'box', title: 'share who act $F(x)$, if a share $x$ acts' });
        const Rr = v.stage({ x: [-0.43, 0.43], y: [-0.13, 1.05], height: 360, axes: 'box', title: 'equilibria against the incentive $c$' });
        const h = L.handle(0.45, 0, { color: 'gold', label: '$x_0$', labelPos: 'n', constrain: (x) => [clamp(x, 0, 1), 0] });
        h.onDrag = () => { state = attract(h.x); trail.push([cS.value, state]); };
        function settle() { h.set(state, 0); state = attract(state); trail.push([cS.value, state]); }
        function sweep(from) {
          const keep = cS.value; let s = from;
          const go = (a, b) => { const n = Math.round(Math.abs(b - a) / 0.005); for (let i = 0; i <= n; i++) { const c = a + ((b - a) * i) / n; s = attract(s, (x) => Phi((x + c - 0.5) / sig.value)); trail.push([c, s]); } };
          go(-0.4, 0.4); go(0.4, -0.4);
          return keep;
        }
        v.button('Sweep $c$ both ways', () => { trail = []; sweep(0); state = attract(state); });
        v.button('Clear trail', () => { trail = []; });
        sweep(0); state = attract(0.45); h.set(0.45, 0);
        v.legend([['blue', 'response curve $F(x)$'], ['gold', 'cobweb from $x_0$ / trail'], ['green', 'stable equilibrium', { dot: true }], ['red', 'tipping point', { dash: true }]]);
        let info = null;
        v.render(() => {
          const s = sig.value, c = cS.value;
          // ---- left: response curve, fixed points, cobweb, phase line
          L.line(0, 0, 1, 1, { color: 'muted', dash: [5, 4], width: 1.3 });
          L.text('45°: $F(x) = x$'.replace(/\$/g, ''), 0.93, 0.93, { color: 'muted', size: 11, align: 'right', dx: -4, dy: 12 });
          L.fn(F, { domain: [0, 1], color: 'blue', width: 2.6 });
          const fx = []; const n = 2000; let prev = F(0) - 0;
          for (let i = 1; i <= n; i++) { const x = i / n, g = F(x) - x; if (Math.sign(g) !== Math.sign(prev) && prev !== 0) { let lo = (i - 1) / n, hi = x; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (Math.sign(F(m) - m) === Math.sign(prev)) lo = m; else hi = m; } const xs = (lo + hi) / 2; fx.push([xs, prev > 0 ? 'stable' : 'unstable']); } prev = g; }
          // phase line
          for (let i = 0; i < 22; i++) { const x = (i + 0.5) / 22, g = F(x) - x; if (Math.abs(g) < 0.004) continue; L.arrow(x - 0.015 * Math.sign(g), -0.065, x + 0.015 * Math.sign(g), -0.065, { color: g > 0 ? 'green' : 'red', head: 6, width: 1.4 }); }
          // cobweb from x0
          const web = [[h.x, 0]]; let x = h.x;
          for (let k = 0; k < 60; k++) { const y = F(x); web.push([x, y], [y, y]); if (Math.abs(y - x) < 1e-5) break; x = y; }
          L.path(web, { color: 'gold', width: 1.8 });
          fx.forEach(([xs, k]) => { L.dot(xs, xs, { r: 6, color: k === 'stable' ? 'green' : 'red', hollow: k !== 'stable' }); });
          const tip = fx.find((f) => f[1] === 'unstable');
          if (tip) L.text(`tipping point ${v.fix(tip[0], 2)}`, tip[0], tip[0], { color: 'red', size: 11.5, dx: 10, dy: 10, weight: 600, plate: true });
          L.dot(state, state, { r: 8, hollow: true, color: 'ink', width: 2.2 });
          // ---- right: bifurcation curve c(x) = 1/2 − x + σ Φ⁻¹(x)
          const cx = (u) => 0.5 - u + s * PhiInv(u);
          const seg = { stable: [], unstable: [] }; let cur = null, run = [];
          for (let i = 1; i < 800; i++) {
            const u = i / 800, du = 1e-4, d = (cx(u + du) - cx(u - du)) / (2 * du), k = d > 0 ? 'stable' : 'unstable';
            if (k !== cur) { if (run.length) seg[cur].push(run); run = run.length ? [run[run.length - 1]] : []; cur = k; }
            run.push([cx(u), u]);
          }
          if (run.length) seg[cur].push(run);
          seg.stable.forEach((p) => Rr.path(p, { color: 'green', width: 2.6 }));
          seg.unstable.forEach((p) => Rr.path(p, { color: 'red', width: 2, dash: [6, 4] }));
          let folds = [];
          if (s < 1 / Math.sqrt(2 * Math.PI)) { const z = Math.sqrt(-2 * Math.log(s * Math.sqrt(2 * Math.PI))); folds = [[cx(Phi(-z)), Phi(-z)], [cx(Phi(z)), Phi(z)]]; folds.forEach(([a, b]) => { Rr.dot(a, b, { r: 4, color: 'red' }); }); Rr.text(`fold c = ${v.fix(folds[0][0], 3)}`, folds[0][0], folds[0][1], { color: 'red', size: 11, align: 'right', dx: -8, dy: 2 }); Rr.text(`fold c = ${v.fix(folds[1][0], 3)}`, folds[1][0], folds[1][1], { color: 'red', size: 11, align: 'left', dx: 8, dy: -2 }); }
          Rr.path(trail.slice(-3000), { color: 'gold', width: 2, alpha: 0.75 });
          Rr.vline(c, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.7 });
          Rr.dot(c, state, { r: 7, hollow: true, color: 'ink', width: 2.2 });
          info = { fx, folds, tip, web: x };
        });
        v.readout(() => {
          if (!info) return '';
          const { fx, folds } = info, tip = fx.find((f) => f[1] === 'unstable'), st = fx.filter((f) => f[1] === 'stable').map((f) => v.fix(f[0], 3));
          const from = attract(h.x);
          const mv = tip ? `from $x_0 = ${v.fix(h.x, 2)}$ the share acting ${from > tip[0] ? '**snowballs**' : '**collapses**'} to ${v.fix(from, 3)} — the critical mass is ${v.fix(tip[0], 3)}` : `from $x_0 = ${v.fix(h.x, 2)}$ it goes to ${v.fix(from, 3)}`;
          const fd = folds.length ? `folds at $c = ${v.fix(folds[1][0], 3)}$ and $${v.fix(folds[0][0], 3)}$: between them two outcomes are possible and history decides (hysteresis)` : `$\\sigma \\ge 1/\\sqrt{2\\pi} \\approx 0.40$: one equilibrium for every $c$, no tipping`;
          return `$c = ${v.fix(cS.value, 3)}$: stable equilibria ${st.join(' and ')}${tip ? `, tipping point ${v.fix(tip[0], 3)}` : ''} · ${mv} · the state now sits at ${v.fix(state, 3)} · ${fd}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Model',
      name: 'Schelling’s binary-choice diagrams',
      statement: String.raw`Schelling's diagrams describe $n$ people who each make the same binary choice, Left or Right, with payoffs that depend only on one's own choice and on how many others choose Right. On a horizontal axis measuring the number $x$ choosing Right ($0 \le x \le n$) draw $L(x)$ and $R(x)$, the payoff to someone choosing Left or Right when $x$ choose Right.

Where $R(x) > L(x)$ people gain by switching to Right, so $x$ grows; where $L(x) > R(x)$ it shrinks. The equilibria are $x = 0$ if $L(0) > R(0)$, $x = n$ if $R(n) > L(n)$, and the crossings of the curves; a crossing is stable when $R - L$ changes from positive to negative as $x$ increases, and unstable — a tipping point — otherwise. The average payoff $\bar u(x) = [x\,R(x) + (n - x)\,L(x)]/n$ is generally *not* maximised at an equilibrium.

In the **multi-person prisoner's dilemma** $L$ lies above $R$ at every $x$ and both rise with $x$: everyone chooses Left, yet all would be better off choosing Right if $R(n) > L(0)$. The smallest $k$ with $R(k) \ge L(0)$ is the **minimum coalition**: $k$ people choosing Right do better than in the all-Left equilibrium even if nobody else joins them.`,
      scope: String.raw`Assumes interchangeable people, payoffs that depend only on how many choose each side (not on who), and gradual adjustment by people switching to the better side. Schelling's diagrams also allow curved payoff schedules and differences between people.`,
      idea: String.raw`Because only the payoff difference $R(x) - L(x)$ decides the direction of motion, the diagram turns an $n$-person game into a one-dimensional phase line, like a response curve (soc-1.6). The two-person prisoner's dilemma (game-1.4) becomes the case where Left is better at every $x$; a coordination game (game-1.5) becomes curves that cross with Right rising faster, giving two stable conventions and a tipping point between them; and free riding (micro-12.10) is the gap between the equilibrium payoff and the best average payoff. The diagram also shows why people who would not choose Right on their own may welcome a rule that makes everyone do so — helmets for all players, one daylight-saving date for everyone — since the rule moves the group from the worst equilibrium to the best outcome.`,
      caption: String.raw`Drag the four handles at the ends of the payoff lines (blue: Left, orange: Right) or pick one of Schelling's situations. Shading shows which side gains — the group drifts right through orange, left through blue — and the arrows on the axis are the resulting phase line. Drag the gold start to choose how many begin on the Right; the strip shows the group at the equilibrium it reaches. The dashed purple curve is the average payoff, with its maximum marked; $k$ is the minimum coalition.`,
      deps: ['soc-1.6', 'micro-12.10', 'game-1.5', 'game-1.4'],
      see: ['game-1.9', 'micro-12.12'],
      refs: ['Schelling ch. 7'],
      tags: ['binary choice', 'externalities', 'game theory'],
      credit: 'Schelling, 1973',
      viz(v) {
        const n = 100;
        const PRE = {
          helmet: { L: [3, 7], R: [1, 5], l: 'no helmet', r: 'helmet', d: 'multi-person prisoner’s dilemma' },
          dst: { L: [6, 1], R: [1, 7], l: 'old hours', r: 'daylight time', d: 'coordination with a tipping point' },
          road: { L: [3, 6], R: [8, 2], l: 'old road', r: 'new road', d: 'self-limiting choice (congestion)' },
        };
        const pre = v.select('situation', [{ value: 'helmet', label: 'hockey helmets' }, { value: 'dst', label: 'daylight saving' }, { value: 'road', label: 'two roads' }], 'helmet', { onChange: (k) => load(k) });
        const S = v.stage({ x: [-6, 106], y: [-2.1, 10.4], height: 390, axes: 'box', full: true, title: 'payoff to choosing Left or Right, against the number $x$ choosing Right (of 100)' });
        const ln = (y) => clamp(y, 0, 10);
        const L0 = S.handle(0, 3, { color: 'blue', constrain: (x, y) => [0, ln(y)] }), L1 = S.handle(n, 7, { color: 'blue', constrain: (x, y) => [n, ln(y)] });
        const R0 = S.handle(0, 1, { color: 'orange', constrain: (x, y) => [0, ln(y)] }), R1 = S.handle(n, 5, { color: 'orange', constrain: (x, y) => [n, ln(y)] });
        const X0 = S.handle(30, -1.35, { color: 'gold', label: 'start', labelPos: 'n', constrain: (x) => [clamp(x, 0, n), -1.35] });
        function load(k) { const P = PRE[k]; L0.set(0, P.L[0]); L1.set(n, P.L[1]); R0.set(0, P.R[0]); R1.set(n, P.R[1]); }
        load('helmet');
        v.legend([['blue', 'Left payoff $L(x)$'], ['orange', 'Right payoff $R(x)$'], ['purple', 'average payoff', { dash: true }], ['green', 'stable equilibrium', { dot: true }], ['red', 'tipping point', { dot: true }]]);
        let info = null;
        v.render(() => {
          const P = PRE[pre.value];
          const Lf = (x) => L0.y + ((L1.y - L0.y) * x) / n, Rf = (x) => R0.y + ((R1.y - R0.y) * x) / n, D = (x) => Rf(x) - Lf(x), A = (x) => (x * Rf(x) + (n - x) * Lf(x)) / n;
          // who gains where
          const cuts = [0]; const xc = Math.abs(D(n) - D(0)) > 1e-9 ? (-D(0) * n) / (D(n) - D(0)) : NaN; if (xc > 0 && xc < n) cuts.push(xc); cuts.push(n);
          for (let i = 0; i + 1 < cuts.length; i++) { const m = (cuts[i] + cuts[i + 1]) / 2; S.rect(cuts[i], 0, cuts[i + 1], 10, { fill: D(m) > 0 ? 'orange' : 'blue', fillAlpha: 0.06, stroke: false }); }
          S.line(0, 0, n, 0, { color: 'faint', width: 1 });
          for (let i = 0; i < 20; i++) { const x = (i + 0.5) * (n / 20), g = D(x); if (Math.abs(g) < 0.05) continue; S.arrow(x - 1.4 * Math.sign(g), -0.42, x + 1.4 * Math.sign(g), -0.42, { color: g > 0 ? 'orange' : 'blue', head: 6, width: 1.3 }); }
          // average payoff and its maximum
          let best = 0, bx = 0; for (let x = 0; x <= n; x += 0.25) { const a = A(x); if (x === 0 || a > best) { best = a; bx = x; } }
          S.fn(A, { domain: [0, n], color: 'purple', width: 1.8, dash: [6, 4] });
          S.dot(bx, best, { r: 5, color: 'purple' });
          S.text(`best average ${v.fix(best, 2)}`, bx, best, { color: 'purple', size: 11, align: bx > 70 ? 'right' : 'left', dx: bx > 70 ? -8 : 8, dy: -12, weight: 600, plate: true });
          S.line(0, L0.y, n, L1.y, { color: 'blue', width: 2.8 }); S.line(0, R0.y, n, R1.y, { color: 'orange', width: 2.8 });
          S.text(`L: ${P.l}`, n, L1.y, { color: 'blue', size: 12, dx: 10, dy: L1.y >= R1.y ? -10 : 10, weight: 600, align: 'right' });
          S.text(`R: ${P.r}`, n, R1.y, { color: 'orange', size: 12, dx: 10, dy: R1.y > L1.y ? -10 : 10, weight: 600, align: 'right' });
          // equilibria
          const eq = [];
          if (D(0) < 0) eq.push([0, 'stable']); else if (D(0) > 0) eq.push([0, 'unstable']);
          if (xc > 0 && xc < n) eq.push([xc, D(0) > 0 ? 'stable' : 'unstable']);
          if (D(n) > 0) eq.push([n, 'stable']); else if (D(n) < 0) eq.push([n, 'unstable']);
          const pay = (x) => (x <= 0 ? Lf(0) : x >= n ? Rf(n) : Lf(x));
          eq.forEach(([x, k]) => { if (k === 'stable' || (x > 0 && x < n)) S.dot(x, pay(x), { r: 6.5, color: k === 'stable' ? 'green' : 'red', hollow: k !== 'stable' }); });
          // minimum coalition k: R(k) = L(0)
          let kk = null; if (Math.abs(R1.y - R0.y) > 1e-9) { const k = ((L0.y - R0.y) * n) / (R1.y - R0.y); if (k > 0 && k <= n && D(n / 2) < 0 && D(0) < 0 && D(n) < 0) kk = k; }
          if (kk != null) { S.line(0, L0.y, kk, L0.y, { color: 'muted', dash: [2, 3], width: 1.2 }); S.line(kk, 0, kk, Rf(kk), { color: 'muted', dash: [2, 3], width: 1.2 }); S.dot(kk, Rf(kk), { r: 3.5, color: 'ink' }); S.text(`k = ${Math.ceil(kk - 1e-9)}`, kk, 0, { color: 'ink', size: 12, dy: 13, weight: 600, align: 'center', plate: true }); }
          // from the start: follow the sign of R − L
          let x = X0.x; const g0 = D(x); if (Math.abs(g0) > 1e-9) { for (let s = 0; s < 4000; s++) { const g = D(x); if (Math.abs(g) < 1e-6) break; const nx = x + 0.05 * Math.sign(g); if (nx <= 0 || nx >= n) { x = nx <= 0 ? 0 : n; break; } if (Math.sign(D(nx)) !== Math.sign(g)) { x = xc; break; } x = nx; } }
          // the people strip
          const strip = -1.35, xe = Math.round(x);
          for (let i = 0; i < n; i++) S.rect(i + 0.1, strip - 0.32, i + 0.9, strip + 0.32, { fill: i < xe ? 'orange' : 'blue', fillAlpha: 0.75, stroke: false });
          if (Math.abs(x - X0.x) > 0.5) S.arrow(X0.x, strip + 0.62, x, strip + 0.62, { color: 'gold', width: 2.2, head: 8 });
          info = { eq, x, best, bx, kk, Lf, Rf, D, xc, P };
        });
        v.readout(() => {
          if (!info) return '';
          const { eq, x, best, bx, kk, Lf, Rf, P } = info;
          const st = eq.map(([e, k]) => `${e === 0 ? 'all Left' : e === n ? 'all Right' : `${v.fix(e, 1)} on the Right`} (${k === 'stable' ? 'stable' : 'tipping point'})`).join(', ');
          const end = x <= 0 ? `everyone chooses Left, each earning ${v.fix(Lf(0), 2)}` : x >= n ? `everyone chooses Right, each earning ${v.fix(Rf(n), 2)}` : `${v.fix(x, 0)} choose Right, everyone earning ${v.fix(Lf(x), 2)}`;
          const avg = x <= 0 ? Lf(0) : x >= n ? Rf(n) : Lf(x);
          const gap = best - avg > 0.01 ? ` · the best average, ${v.fix(best, 2)}, needs ${v.fix(bx, 0)} on the Right: at equilibrium each person loses ${v.fix(best - avg, 2)}` : ' · the equilibrium is also the best average';
          const kt = kk != null ? ` · minimum coalition $k = ${Math.ceil(kk - 1e-9)}$: that many ${P.r === 'helmet' ? 'helmet-wearers' : 'Right-choosers'} beat the all-Left payoff ${v.fix(Lf(0), 2)} on their own` : '';
          return `${P.d}: equilibria ${st} · from ${v.fix(X0.x, 0)} on the Right, ${end}${gap}${kt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Model',
      name: 'Granovetter’s threshold model of collective behaviour',
      statement: String.raw`In Granovetter's threshold model a group of $N$ people faces a binary decision, such as whether to join a riot. Person $i$ has a **threshold** $\theta_i$: the number (or proportion) of others who must already have joined before $i$ will join — the point where, for that person, the benefits of joining begin to exceed the costs. People with $\theta_i = 0$ act regardless (instigators). Let $F(x)$ be the number of people with threshold at most $x$, the cumulative distribution of thresholds.

Starting from nobody, the number acting evolves by $$r(t+1) = F\big(r(t)\big), \qquad r(0) = 0.$$ The sequence never decreases and stops at the equilibrium $r_e$, the smallest $r$ with $F(r) = r$: the point where the cumulative curve first meets the 45° line coming from above. The outcome is determined by the whole distribution of thresholds, not by its average.`,
      scope: String.raw`Everyone sees everyone (no network), thresholds stay fixed during the episode, nobody leaves once joined, and each person's net benefit crosses zero only once as participation grows — Granovetter's own conditions. Networks (soc-5.1), removals and two-crossing benefit curves need extended models.`,
      idea: String.raw`Because $F$ is non-decreasing, $r(1) = F(0) \ge r(0)$ and then by induction $r(t+1) = F(r(t)) \ge F(r(t-1)) = r(t)$; the sequence is bounded by $N$, so it settles. If $r^*$ is any fixed point, $r(t) \le r^*$ implies $r(t+1) = F(r(t)) \le F(r^*) = r^*$, so the process can never pass the *first* fixed point: it stops there. Graphically this is the cobweb between the cumulative curve and the diagonal (soc-1.6). The cascade moves through the distribution like a row of dominoes: each round recruits exactly the people whose thresholds lie between the previous two participation levels, and it halts at the first level $r$ where fewer than $r + 1$ people have thresholds at most $r$. Small gaps in the distribution can therefore stop a large cascade (soc-1.9).`,
      caption: String.raw`The crowd (left, sorted by threshold, each disc labelled with its threshold) joins round by round: red = rioting, gold ring = joined this round. The middle panel is the cumulative distribution of thresholds against the 45° line, with the cascade as a cobweb. Draw your own distribution by dragging on the histogram at the bottom (people per bin of five threshold values), or load a preset; ▶ replays the cascade.`,
      deps: ['soc-1.6'],
      see: ['soc-5.1', 'mathbio-7.3'],
      refs: ['E&K §19.6'],
      tags: ['thresholds', 'cascades', 'collective behaviour'],
      credit: 'Granovetter, 1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Threshold_model' },
      viz(v) {
        const NB = 20, BW = 5;
        const camps = () => [...normalCrowd(16, 4, 3.5), ...normalCrowd(84, 55, 14)];
        const PRE = { uniform: () => Array.from({ length: 100 }, (_, i) => i), n15: () => normalCrowd(100, 25, 15), n10: () => normalCrowd(100, 25, 10), camps };
        let th = PRE.n15();
        const pre = v.select('crowd', [{ value: 'n15', label: 'normal: mean 25, sd 15' }, { value: 'n10', label: 'normal: mean 25, sd 10' }, { value: 'uniform', label: 'uniform 0, 1, …, 99' }, { value: 'camps', label: 'radicals and moderates' }, { value: 'own', label: 'your own' }], 'n15',
          { onChange: (k) => { if (PRE[k]) th = PRE[k](); v.restart(); } });
        const C = v.stage({ x: [0, 10], y: [0, 10], height: 330, weight: 1, axes: false, equal: true, title: 'the crowd, by threshold' });
        const Fs = v.stage({ x: [-5, 104], y: [-5, 104], height: 330, weight: 1, axes: 'box', title: 'cumulative thresholds $F(x)$ and the 45° line' });
        const Hs = v.stage({ x: [-1, 101], y: [-1.5, 22], height: 150, axes: 'box', full: true, title: 'thresholds: people per bin (drag to draw)' });
        Hs.onDrag((x, y) => {
          const b = Math.floor(x / BW); if (b < 0 || b >= NB) return; const k = clamp(Math.round(y), 0, 30);
          th = th.filter((t) => Math.floor(t / BW) !== b); for (let j = 0; j < k; j++) th.push(b * BW + Math.floor((BW * j) / k));
          if (!th.length) th.push(0);
          pre.set('own'); v.restart();
        });
        v.legend([['red', 'rioting', { dot: true }], ['gold', 'joined this round', { dot: true }], ['blue', 'not (yet) rioting', { dot: true }], ['ink', 'cumulative $F(x)$'], ['gold', 'cascade (cobweb)']]);
        let info = null;
        v.animate((t) => {
          const sorted = th.slice().sort((a, b) => a - b), N = sorted.length, cas = cascade(sorted), { rs, F, final } = cas;
          const round = Math.min(rs.length - 1, Math.floor(t / 0.55));
          const now = rs[round], before = round > 0 ? rs[round - 1] : 0;
          // ---- crowd
          const cols = Math.ceil(Math.sqrt(N * 1.25)), rows = Math.ceil(N / cols), sc = Math.min(C.width / cols, C.height / rows);
          const wx = C.width / sc, wy = C.height / sc; C.setView([(cols - wx) / 2, (cols + wx) / 2], [(rows - wy) / 2, (rows + wy) / 2]);
          const rad = 0.4, big = sc > 26;
          for (let i = 0; i < N; i++) {
            const cx = (i % cols) + 0.5, cy = rows - Math.floor(i / cols) - 0.5, on = i < now, fresh = on && i >= before && round > 0;
            C.circle(cx, cy, rad, { fill: on ? 'red' : 'blue', fillAlpha: on ? 0.85 : 0.16, color: fresh ? 'gold' : on ? 'red' : 'blue', width: fresh ? 3 : 1.2 });
            if (big) C.text(String(sorted[i]), cx, cy, { size: sc > 34 ? 11 : 9.5, align: 'center', color: on ? 'panel' : 'ink', halo: false, weight: 600 });
          }
          // ---- cumulative curve and cobweb
          const top = Math.max(100, N);
          Fs.setView([-0.05 * top, top * 1.04], [-0.05 * top, top * 1.04]);
          Fs.line(0, 0, top, top, { color: 'muted', dash: [5, 4], width: 1.3 });
          Fs.path(stepPts(F, top), { color: 'ink', width: 2 });
          const web = cobweb(rs.slice(0, round + 1));
          Fs.path(web, { color: 'gold', width: 2 });
          if (round > 0) Fs.dot(before, now, { r: 4, color: 'gold' });
          if (round === rs.length - 1) { Fs.dot(final, final, { r: 6.5, color: 'green' }); Fs.text(`equilibrium ${final}`, final, final, { color: 'green', size: 12, weight: 600, align: final > top * 0.6 ? 'right' : 'left', dx: final > top * 0.6 ? -10 : 10, dy: final > top * 0.6 ? 12 : -12, plate: true }); }
          // ---- histogram
          const cnt = new Array(NB).fill(0), hot = new Array(NB).fill(0);
          sorted.forEach((x, i) => { const b = clamp(Math.floor(x / BW), 0, NB - 1); cnt[b]++; if (i < now) hot[b]++; });
          const ymax = Math.max(12, ...cnt) * 1.15; Hs.setView([-1, 101], [-ymax * 0.1, ymax]);
          for (let b = 0; b < NB; b++) { if (hot[b]) Hs.rect(b * BW + 0.3, 0, (b + 1) * BW - 0.3, hot[b], { fill: 'red', fillAlpha: 0.75, stroke: false }); if (cnt[b] > hot[b]) Hs.rect(b * BW + 0.3, hot[b], (b + 1) * BW - 0.3, cnt[b], { fill: 'blue', fillAlpha: 0.45, stroke: false }); }
          if (round === rs.length - 1 && final < N) { Hs.vline(final, { color: 'green', width: 1.6, dash: [4, 3] }); Hs.text(`stops at ${final}`, final, ymax * 0.88, { color: 'green', size: 11, dx: 6, weight: 600, plate: true }); }
          info = { N, rs, F, round, now, final, mean: sorted.reduce((a, b) => a + b, 0) / N };
        }, { still: 60 });
        v.readout(() => {
          if (!info) return '';
          const { N, rs, F, round, now, final, mean } = info, last = round === rs.length - 1;
          const nxt = F[Math.min(now, N)];
          return `${N} people, mean threshold ${v.fix(mean, 1)} · round ${round}: **${now}** rioting${last ? '' : ` → ${nxt} have thresholds ≤ ${now}, so ${nxt} riot next round`}${last ? ` · **equilibrium $r_e = ${final}$**: $F(${final}) = ${F[Math.min(final, N)]}$${final < N ? `, and only ${F[Math.min(final, N)]} people have thresholds ≤ ${final}, so nobody else joins` : ' — everybody joined'} · cascade levels ${rs.slice(0, 12).join(' → ')}${rs.length > 12 ? ' → …' : ''}` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Phenomenon',
      name: 'Fragile cascades: one changed threshold stops the riot',
      statement: String.raw`Because the outcome of a threshold model (soc-1.8) depends on the whole distribution, two crowds that differ by a single person can produce opposite results. Granovetter's example: 100 people with thresholds $0, 1, 2, \dots, 99$ riot to the last person, each new rioter tipping the next; replace the person with threshold 1 by one with threshold 2 and only the instigator riots.

More generally, sort a crowd's thresholds $\theta_{(0)} \le \theta_{(1)} \le \dots \le \theta_{(N-1)}$. If $\theta_{(k)} \le k$ for every $k < m$ and $\theta_{(m)} > m$, the riot stops at exactly $m$ people. The uniform crowd lies on the knife-edge $\theta_{(k)} = k$, so every one of its members is pivotal: raising any one person's threshold above his rank stops the riot right there.

Near a critical parameter value the same fragility appears in random crowds: among crowds drawn from the same family with the same average threshold, some end with almost nobody acting and others with almost everybody, so aggregate outcomes are a poor guide to individual dispositions.`,
      idea: String.raw`The $k$-th person in threshold order joins only if the $k$ people before him have, and only if $\theta_{(k)} \le k$; the condition is a chain, and a chain is as strong as its weakest link. A crowd whose sorted thresholds hug the diagonal has no slack anywhere, so any perturbation that pushes one link above the line breaks it, while the average threshold barely moves (49.50 against 49.51 in Granovetter's example). Across random crowds the same happens wherever the cumulative curve comes close to the 45° line: whether it touches the line early (a small riot) or clears it (a large one) is decided by sampling noise, so outcome probabilities jump from near 0 to near 1 across a narrow band of average thresholds. This sensitivity is the mirror image of tipping (soc-1.6): a fold in the infinite-population equilibrium becomes, for finite crowds, a fragile region.`,
      caption: String.raw`Left: the crowd's thresholds in increasing order (bars) against the diagonal "number already rioting". Bars on or under the diagonal join; the first bar above it (gold) stops the riot. Switch **change one person** off for Granovetter's uniform crowd, or pick which person and their new threshold. Right: 1,200 random crowds of 100 with normally distributed thresholds, each plotted at its average threshold and its final riot size; the gold curve is the share of crowds that riot (> 50 people) and the shaded band is the fragile region where it is neither near 0 nor near 1. The dashed line is the infinite-crowd prediction. Change the spread $\sigma$.`,
      deps: ['soc-1.8'],
      see: ['ode-8.3', 'soc-5.3'],
      refs: ['E&K §19.6'],
      tags: ['thresholds', 'cascades', 'fragility'],
      credit: 'Granovetter, 1978',
      viz(v) {
        const chg = v.toggle('change one person', true);
        const who = v.slider('person whose threshold is', 0, 99, 1, { int: true, step: 1 });
        const to = v.slider('changes it to', 0, 99, 2, { int: true, step: 1 });
        const zoom = v.select('view', [{ value: '20', label: 'first 20 people' }, { value: '100', label: 'all 100' }], '20');
        const sig = v.slider('spread $\\sigma$ of the random crowds', 4, 22, 12, { step: 0.5 });
        const Lt = v.stage({ x: [-0.5, 20.5], y: [-1, 21], height: 350, weight: 1, axes: 'box', title: 'sorted thresholds against the number already rioting' });
        const Rt = v.stage({ x: [-1, 46], y: [-8, 108], height: 350, weight: 1.15, axes: 'box', xlabel: 'average threshold of the crowd', title: 'final riot size of random crowds' });
        const cache = new Map();
        const crowds = (s) => {
          if (!cache.has(s)) {
            const R = rng32(1978 + Math.round(s * 10)), pts = [], M = 1200;
            for (let k = 0; k < M; k++) { const mu = (45 * (k + R())) / M; const th = []; let sum = 0; for (let i = 0; i < 100; i++) { const x = Math.max(0, Math.round(mu + s * gauss(R))); th.push(x); sum += x; } pts.push([sum / 100, cascade(th).final, (R() - 0.5) * 3]); }
            const B = 30, bw = 45 / B, bins = Array.from({ length: B }, () => [0, 0]);
            for (const [m, f] of pts) { const b = Math.floor(m / bw); if (b >= 0 && b < B) { bins[b][0]++; if (f > 50) bins[b][1]++; } }
            const frac = bins.map(([c, r], b) => [(b + 0.5) * bw, c >= 6 ? r / c : null]);
            const fr = frac.filter((f) => f[1] != null && f[1] > 0.05 && f[1] < 0.95).map((f) => f[0]);
            cache.set(s, { pts, frac, band: fr.length ? [Math.min(...fr) - bw / 2, Math.max(...fr) + bw / 2] : null, theory: Array.from({ length: 181 }, (_, i) => [i / 4, normalEq(i / 4, s)]) });
          }
          return cache.get(s);
        };
        v.legend([['red', 'joins the riot', { area: true }], ['gold', 'the person who stops it', { area: true }], ['blue', 'never joins', { area: true }], ['gold', 'share of crowds rioting'], ['ink', 'infinite crowd', { dash: true }]]);
        let info = null;
        v.render(() => {
          // ---- left: the uniform crowd, possibly with one change
          const th = Array.from({ length: 100 }, (_, i) => i); if (chg.value) th[who.value] = to.value;
          const sorted = th.slice().sort((a, b) => a - b), { final } = cascade(sorted);
          const Z = +zoom.value; Lt.setView([-0.04 * Z - 0.5, Z + 0.5], [-0.06 * Z - 0.5, Z * 1.05 + 0.5]);
          for (let k = 0; k < Math.min(100, Z + 1); k++) { const y = sorted[k], col = k < final ? 'red' : k === final ? 'gold' : 'blue'; Lt.rect(k + 0.12, 0, k + 0.88, Math.max(y, 0.12), { fill: col, fillAlpha: k === final ? 0.95 : 0.6, stroke: false }); }
          Lt.line(0, 0, Z + 0.5, Z + 0.5, { color: 'ink', width: 1.6, dash: [5, 4] });
          Lt.text('already rioting = rank', Z * 0.97, Z * 0.97, { color: 'ink', size: 11, align: 'right', dx: -6, dy: -12 });
          if (final < 100 && final <= Z) { Lt.text(`needs ${sorted[final]}, sees ${final}`, final + 0.5, sorted[final], { color: 'gold', size: 12, weight: 700, dx: 6, dy: -12, align: 'left', plate: true }); }
          const mean = th.reduce((a, b) => a + b, 0) / 100;
          // ---- right: random crowds
          const s = sig.value, D = crowds(s);
          if (D.band) { Rt.rect(D.band[0], -8, D.band[1], 108, { fill: 'gold', fillAlpha: 0.13, stroke: false }); Rt.text('fragile', (D.band[0] + D.band[1]) / 2, 104, { color: 'gold', size: 12, align: 'center', weight: 700 }); }
          Rt.dots(D.pts.filter((p) => p[1] <= 50).map((p) => [p[0], p[1] + p[2]]), { r: 2, color: 'blue', alpha: 0.45 });
          Rt.dots(D.pts.filter((p) => p[1] > 50).map((p) => [p[0], p[1] + p[2]]), { r: 2, color: 'red', alpha: 0.45 });
          Rt.path(D.theory, { color: 'ink', width: 1.6, dash: [6, 4] });
          Rt.path(D.frac.filter((f) => f[1] != null).map(([m, f]) => [m, 100 * f]), { color: 'gold', width: 2.6 });
          info = { final, mean, sorted, D };
        });
        v.readout(() => {
          if (!info) return '';
          const { final, mean, sorted, D } = info;
          const left = chg.value && who.value !== to.value ? `person ${who.value} now has threshold ${to.value}` : 'Granovetter’s uniform crowd, thresholds 0, 1, …, 99';
          const res = final >= 100 ? '**all 100 riot**' : `the riot **stops at ${final}** (the next person in line needs ${sorted[final]} but sees only ${final})`;
          const band = D.band ? `fragile band: average threshold ${v.fix(D.band[0], 1)}–${v.fix(D.band[1], 1)}, where crowds alike on average end with a handful of rioters or with nearly everybody` : 'no fragile band at this spread — the average predicts the outcome';
          return `${left}: average threshold ${v.fix(mean, 2)}, ${res} · random crowds with $\\sigma = ${v.fix(sig.value, 1)}$: ${band}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Paper',
      name: 'Threshold Models of Collective Behavior',
      paper: { authors: 'Mark Granovetter', year: 1978, title: 'Threshold Models of Collective Behavior', venue: 'American Journal of Sociology 83 (6): 1420–1443', doi: '10.1086/226707' },
      introduces: ['soc-1.8', 'soc-1.9'],
      statement: String.raw`Granovetter modelled collective behaviour — riots, strikes, the diffusion of innovations and rumours, voting, migration, leaving a boring lecture — as binary decisions in which the costs and benefits of acting depend on how many others act. Each actor has a **threshold**, the proportion (or number) of the group who must act before he does; from the frequency distribution of thresholds the equilibrium follows by iterating $r(t+1) = F(r(t))$, where $F$ is the cumulative distribution: it is the point where $F$ first crosses the 45° line from above. His examples show that outcomes depend on the exact distribution rather than on average preferences:

(a) 100 people with thresholds $0, 1, \dots, 99$ all riot, but replacing the person with threshold 1 by one with threshold 2 leaves a single rioter;

(b) with thresholds normally distributed with mean 25 in a group of 100, the equilibrium rises gradually to about six as the standard deviation grows to a critical value of about 12.2, then jumps to nearly 100, and declines towards 50 as the spread grows without bound;

(c) if crowds of 100 are random samples from a population with the uniform distribution, more than half of them end with no rioter or one.

Hence it is hazardous to infer individual dispositions, or shared norms, from aggregate outcomes. The model assumes that everyone responds to the whole group, that thresholds are fixed, and that each actor's net benefit crosses zero once.`,
      idea: String.raw`Sociological accounts of collective behaviour explained outcomes by norms: if most of a crowd rioted, most must have come to share a norm favouring it. Granovetter, adapting the thresholds of Schelling's segregation models (soc-1.10), argued that knowing preferences is necessary but not sufficient — one also needs a model of how they aggregate. The threshold model (soc-1.8) and its fragility (soc-1.9) made the point concrete: the two crowds of (a) are "essentially identical", yet the newspapers would report "a crowd of radicals" in one case and "a demented troublemaker" watched by "solid citizens" in the other. He sketched extensions — friends' actions weighted more than strangers' (with double weight, a person with threshold 50% who sees 48 of 100 rioting, 15 of them among his 20 friends, perceives $63/120 = .525$ and joins), sampling variability between crowds, and spatial dispersion — and the paper became a founding text for cascades, critical mass and diffusion on networks (soc-5.1). The graphical method of his Fig. 1 is credited to Christopher Winship and the normal-distribution analysis of Fig. 2 to Bob Phillips.`,
      caption: String.raw`Three of the paper's exhibits, recomputed. **Fig. 2**: thresholds normal with mean 25 in a crowd of 100; left, the cumulative distribution against the 45° line, with the cobweb from nobody to the equilibrium; right, the equilibrium against the standard deviation — drag $\sigma$ through the critical value, where the curve becomes tangent to the line and the equilibrium jumps. **The riot**: the uniform crowd (blue) and the crowd with one threshold changed (red), cumulative curves and rioters round by round. **Sampled crowds**: 4,000 crowds of 100 drawn from the uniform population, against the paper's probabilities.`,
      deps: ['soc-1.6', 'soc-1.10'],
      refs: [],
      tags: ['thresholds', 'cascades', 'collective behaviour'],
      credit: 'Granovetter, 1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Threshold_model' },
      viz(v) {
        const mode = v.select('exhibit', [{ value: 'fig2', label: 'Fig. 2: normal thresholds' }, { value: 'riot', label: 'the riot of 100' }, { value: 'sample', label: 'sampled crowds' }], 'fig2', { onChange: () => show() });
        const sig = v.slider('standard deviation $\\sigma$', 1, 40, 11.5, { step: 0.05 });
        const mu = v.slider('mean threshold', 10, 40, 25, { step: 0.5 });
        let crowdSeed = 3;
        const again = v.button('Draw another crowd', () => { crowdSeed++; });
        function show() { const m = mode.value; sig.el.hidden = m !== 'fig2'; mu.el.hidden = m !== 'fig2'; again.hidden = m !== 'sample'; }
        show();
        const Lf = v.stage({ x: [-5, 104], y: [-5, 104], height: 350, weight: 1, axes: 'box', title: 'cumulative distribution of thresholds' });
        const Rf = v.stage({ x: [-2, 52], y: [-6, 106], height: 350, weight: 1.1, axes: 'box', title: 'equilibrium number of rioters' });
        const curves = new Map();
        const fig2 = (m) => { if (!curves.has(m)) { const pts = []; for (let i = 0; i <= 400; i++) { const s = 0.25 + (49.75 * i) / 400; pts.push([s, normalEq(m, s)]); } curves.set(m, { pts, crit: criticalSigma(m) }); } return curves.get(m); };
        let samp = null;
        const sampled = () => {
          if (!samp) { const R = rng32(1431), hist = new Array(101).fill(0), M = 4000; for (let k = 0; k < M; k++) { const th = []; for (let i = 0; i < 100; i++) th.push(Math.floor(R() * 100)); hist[cascade(th).final]++; } samp = { hist: hist.map((c) => c / M), M }; }
          return samp;
        };
        v.legend([['ink', 'cumulative distribution $F$'], ['gold', 'cascade from nobody'], ['green', 'equilibrium', { dot: true }], ['red', 'paper’s value', { dash: true }]]);
        let info = null;
        v.render(() => {
          const m = mode.value;
          if (m === 'fig2') {
            const s = sig.value, M = mu.value, F = (x) => 100 * Phi((x - M) / s), re = normalEq(M, s), C = fig2(M);
            Lf.setView([-5, 104], [-5, 104]); Lf.setTitle('cumulative distribution $F(x) = 100\\,\\Phi((x - \\mu)/\\sigma)$');
            Lf.line(0, 0, 100, 100, { color: 'muted', dash: [5, 4], width: 1.3 });
            Lf.fn(F, { domain: [0, 100], color: 'ink', width: 2.2 });
            const web = [[0, 0]]; let r = 0; for (let k = 0; k < 400; k++) { const y = F(r); web.push([r, y], [y, y]); if (Math.abs(y - r) < 0.02) break; r = y; }
            Lf.path(web, { color: 'gold', width: 1.8 });
            Lf.dot(re, re, { r: 6, color: 'green' });
            Lf.text(`r = ${v.fix(re, 1)}`, re, re, { color: 'green', size: 12, weight: 700, dx: re > 60 ? -10 : 10, dy: re > 60 ? 14 : -12, align: re > 60 ? 'right' : 'left', plate: true });
            // right: Fig. 2
            Rf.setView([-2, 52], [-6, 106]); Rf.setTitle('equilibrium against $\\sigma$ (Fig. 2, mean ' + v.fix(M, 1) + ')'); Rf.setLabels('standard deviation $\\sigma$', null);
            Rf.hline(50, { color: 'muted', dash: [2, 4], width: 1 });
            Rf.text('limit 50', 51, 50, { color: 'muted', size: 11, align: 'right', dy: -9 });
            if (isFinite(C.crit.s)) { Rf.vline(C.crit.s, { color: 'red', dash: [5, 4], width: 1.2 }); if (Math.abs(M - 25) < 0.01) Rf.vline(12.2, { color: 'red', width: 1, alpha: 0.5 }); Rf.text(`σc = ${v.fix(C.crit.s, 2)}${Math.abs(M - 25) < 0.01 ? ' (paper ≈ 12.2)' : ''}`, C.crit.s, 30, { color: 'red', size: 11.5, dx: 8, weight: 600, plate: true }); }
            const pts = C.pts; const jump = pts.findIndex((p, i) => i > 0 && p[1] - pts[i - 1][1] > 20);
            if (jump > 0) { Rf.path(pts.slice(0, jump), { color: 'purple', width: 2.6 }); Rf.path(pts.slice(jump), { color: 'purple', width: 2.6 }); Rf.line(pts[jump - 1][0], pts[jump - 1][1], pts[jump][0], pts[jump][1], { color: 'purple', width: 1, dash: [2, 3] }); } else Rf.path(pts, { color: 'purple', width: 2.6 });
            Rf.dot(s, re, { r: 6, color: 'green' });
            info = { m, s, M, re, C };
          } else if (m === 'riot') {
            const uni = Array.from({ length: 100 }, (_, i) => i), per = uni.slice(); per[1] = 2;
            const A = cascade(uni), B = cascade(per.sort((a, b) => a - b)), Z = 12;
            Lf.setView([-0.6, Z], [-0.6, Z]); Lf.setTitle('the first dozen of 100: uniform (blue) and perturbed (red)');
            Lf.line(0, 0, Z, Z, { color: 'muted', dash: [5, 4], width: 1.3 });
            Lf.path(stepPts(A.F, Z), { color: 'blue', width: 3.4, alpha: 0.55 }); Lf.path(stepPts(B.F, Z), { color: 'red', width: 2 });
            Lf.path(cobweb(A.rs.slice(0, Z + 1)), { color: 'blue', width: 1.4, dash: [3, 3] }); Lf.path(cobweb(B.rs), { color: 'red', width: 2.2 });
            Lf.dot(1, 1, { r: 6, color: 'red' }); Lf.text('perturbed crowd stops: F(1) = 1', 1, 1, { color: 'red', size: 11.5, dx: 10, dy: 14, weight: 600, plate: true });
            Lf.text('uniform: F(x) = x + 1, one step ahead of the line all the way to 100', Z * 0.98, Z * 0.94, { color: 'blue', size: 11, align: 'right', plate: true });
            Rf.setView([-3, 104], [-6, 106]); Rf.setTitle('rioters after each round'); Rf.setLabels('round $t$', null);
            Rf.path(A.rs.map((r, t) => [t, r]), { color: 'blue', width: 2.6 }); Rf.path([[0, 0], [1, 1], [100, 1]], { color: 'red', width: 2.6 });
            Rf.dot(A.rs.length - 1, 100, { r: 6, color: 'green' }); Rf.dot(100, 1, { r: 6, color: 'green' });
            Rf.text('“A crowd of radicals engaged in riotous behavior”', 50, 76, { color: 'blue', size: 11.5, align: 'center', plate: true });
            Rf.text('“A demented troublemaker broke a window while a group of solid citizens looked on”', 52, 12, { color: 'red', size: 11, align: 'center', plate: true });
            info = { m, A, B };
          } else {
            const S = sampled(), R = rng32(crowdSeed * 7919 + 1), th = []; for (let i = 0; i < 100; i++) th.push(Math.floor(R() * 100));
            const one = cascade(th.slice().sort((a, b) => a - b));
            Lf.setView([-5, 104], [-5, 104]); Lf.setTitle('one sampled crowd: cumulative thresholds');
            Lf.line(0, 0, 100, 100, { color: 'muted', dash: [5, 4], width: 1.3 });
            Lf.path(stepPts(one.F, 100), { color: 'ink', width: 2 }); Lf.path(cobweb(one.rs), { color: 'gold', width: 2 });
            Lf.dot(one.final, one.final, { r: 6, color: 'green' }); Lf.text(`stops at ${one.final}`, one.final, one.final, { color: 'green', size: 12, weight: 700, dx: one.final > 60 ? -10 : 10, dy: one.final > 60 ? 14 : -12, align: one.final > 60 ? 'right' : 'left', plate: true });
            Rf.setView([-3, 104], [-0.03, 0.42]); Rf.setTitle(`final riot size in ${S.M.toLocaleString('en-US')} sampled crowds`); Rf.setLabels('rioters at equilibrium', null);
            S.hist.forEach((p, k) => { if (p) Rf.rect(k - 0.45, 0, k + 0.45, p, { fill: k <= 1 ? 'red' : k >= 90 ? 'green' : 'blue', fillAlpha: 0.8, stroke: false }); });
            Rf.line(-1.5, 0.37, 1.5, 0.37, { color: 'red', width: 2 }); Rf.text('paper .37', 1.5, 0.37, { color: 'red', size: 11, dx: 6, weight: 600 });
            Rf.line(-0.5, 0.14, 2.5, 0.14, { color: 'red', width: 2 }); Rf.text('paper .14', 2.5, 0.14, { color: 'red', size: 11, dx: 6, weight: 600 });
            info = { m, S, one };
          }
        });
        v.readout(() => {
          if (!info) return '';
          if (info.m === 'fig2') {
            const { s, M, re, C } = info, p25 = Math.abs(M - 25) < 0.01;
            return `$\\sigma = ${v.fix(s, 2)}$, mean ${v.fix(M, 1)}: equilibrium **${v.fix(re, 1)}** rioters · critical $\\sigma_c = ${v.fix(C.crit.s, 3)}$, where the cumulative curve touches the 45° line at ${v.fix(C.crit.x, 1)} rioters${p25 ? ' — Granovetter: “approximately 12.2”, the equilibrium having risen “gradually to about six”; just past it, nearly 100, declining towards 50 as $\\sigma$ grows' : ' (change the mean back to 25 for the paper’s case)'}`;
          }
          if (info.m === 'riot') return 'Uniform thresholds 0, 1, …, 99: each round adds one rioter and **all 100** join (the paper: “The equilibrium is 100”). Replace the person with threshold 1 by one with threshold 2: the instigator riots, nobody has threshold 1, and the riot ends “with one rioter”. Average thresholds: 49.50 and 49.51.';
          const { S, one } = info, h = S.hist, p0 = h[0], p1 = h[1], big = h.slice(90).reduce((a, b) => a + b, 0);
          return `simulated: no rioter in **${v.fix(p0, 3)}** of crowds (exact $0.99^{100} = 0.366$; paper .37), exactly one in **${v.fix(p1, 3)}** (exact $100 \\times 0.01 \\times 0.98^{99} = 0.135$; paper .14), together ${v.fix(p0 + p1, 2)} (paper: “over half”, .51) · only ${pc(big)} of crowds reach 90 or more, though every crowd comes from a population whose exact distribution riots completely · this crowd stops at ${one.final}`;
        });
      },
    },
  ],
};
