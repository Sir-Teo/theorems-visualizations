// Behavioural Economics — Chapter 3, part b: items 3.11–3.20 (hot hand, regression, overconfidence, planning, hindsight,
// decoys, preference reversals, take-the-best, and the two papers).
//
// Sources checked (Oct 2026):
// - Miller & Sanjurjo 2018 (Econometrica 86: 2019–2047), arXiv 1902.01265, Table 2: Gilovich, Vallone & Tversky's (1985)
//   Cornell shooting data, 26 players (14 men, 12 women), P̂(hit | 3 hits), P̂(hit | 3 misses), GVT estimate and bias-adjusted
//   difference per player; averages .49 vs .45 (+.03 raw, +.13 adjusted); expected bias −8 points at n = 100, p = .5.
// - Buehler, Griffin & Ross 1994 (JPSP 67: 366–381), Study 1: 37 honours students; predicted 33.9 days (best case 27.4,
//   worst case 48.6), actual 55.5; finished by the prediction 29.7%, by the best case 10.8%, by the worst case 48.7%.
// - Flyvbjerg, Holm & Buhl 2002 (J. Am. Planning Assoc. 68: 279–295), arXiv 1303.6604: cost escalation rail 44.7% (SD 38.4,
//   58 projects), fixed links 33.8% (SD 62.4, 33), roads 20.4% (SD 29.9, 167), all 27.6% (SD 38.7, 258). The page draws each
//   reference class as a log-normal with that mean and SD: the shape is an assumption, the two moments are the paper's.
// - Tversky & Kahneman 1974 (as reprinted in Kahneman 2011, App. A): 98% intervals missed ≈ 30% of the time; median products
//   2,250 (descending) and 512 (ascending), true 40,320; wheel medians 25 / 45; hospital answers 21 / 21 / 53.
// - Fischhoff 1975 (JEP:HPP 1: 288–299): British–Gurkha war of 1814 with four outcomes (design, via Blank, Musch & Pohl 2007);
//   meta-analyses: Guilbault et al. 2004, 95 studies, mean d = .39 (CI .36–.42); Christensen-Szalanski & Willham 1991, r = .17.
// - Grether & Plott 1979 (AER 69: 623–638), Tables 5–6 as reproduced by Braga (2003): choice × higher price, % of responses;
//   the P/$ pair (35/36 win $4, 1/36 lose $1 vs 9/36 win $16, 25/36 lose $1.50); Lichtenstein & Slovic 1971.
// - Gigerenzer & Goldstein 1996 (Psych. Review 103: 650–669), Table 1: the nine cues' ecological validities and
//   discrimination rates for the 83 German cities over 100,000.
// - Huber, Payne & Puto 1982 (J. Consumer Research 9: 90–98). The Economist menu (16 / 0 / 84% and 68 / 32%) is reported in
//   Ariely's book Predictably Irrational (2008), not in a refereed paper: flagged in the item.
// - Simon 1955 (QJE 69: 99–118): house seller, aspiration levels adjusting to experience (no numbers in the paper's example).
import { clamp, inside, num, pct, card, binomPmf, reservation, satisficeValue, satisficeLooks, hbars } from './ch03.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [4, 4] };

/** Shared normal skill plus independent normal luck in each season; both scores have variance one. */
export function gaussianRegressionLeague(luckShare, count, rng) {
  return Array.from({ length: count }, () => {
    const skill = rng.normal() * Math.sqrt(1 - luckShare);
    return [skill + rng.normal() * Math.sqrt(luckShare), skill + rng.normal() * Math.sqrt(luckShare)];
  });
}

/** Proportion of hits immediately after k consecutive hits within one sequence (null if undefined). */
function propAfter(seq, k) {
  let a = 0, b = 0;
  for (let i = k; i < seq.length; i++) {
    let ok = true; for (let j = 1; j <= k; j++) if (!seq[i - j]) { ok = false; break; }
    if (ok) { a++; if (seq[i]) b++; }
  }
  return a ? b / a : null;
}
/** Expected value of that proportion over sequences where it is defined: exact by enumeration for n ≤ 16. */
function expectedProp(n, k, p) {
  let s = 0, w = 0; const seq = new Array(n);
  for (let m = 0; m < 1 << n; m++) {
    let h = 0; for (let i = 0; i < n; i++) { seq[i] = (m >> i) & 1; h += seq[i]; }
    const q = propAfter(seq, k); if (q == null) continue;
    const pr = Math.pow(p, h) * Math.pow(1 - p, n - h); s += pr * q; w += pr;
  }
  return w ? s / w : NaN;
}
function expectedPropMC(n, k, p, sims, seed) {
  const r = v_rng(seed); let s = 0, c = 0; const seq = new Array(n);
  for (let t = 0; t < sims; t++) { for (let i = 0; i < n; i++) seq[i] = r() < p ? 1 : 0; const q = propAfter(seq, k); if (q != null) { s += q; c++; } }
  return s / c;
}
/** Small seeded generator (mulberry32) for use outside viz(). */
function v_rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** GVT (1985) shooting data as tabulated by Miller & Sanjurjo (2018, Table 2): [player, P(hit), P(hit|3 hits), n, P(hit|3 misses), n, GVT diff, bias-adjusted]. */
const GVT = [['M1', .54, .50, 12, .44, 9, .06, .14], ['M2', .35, .00, 3, .43, 28, -.43, -.33], ['M3', .60, .60, 25, .67, 6, -.07, .02], ['M4', .40, .33, 3, .47, 15, -.13, -.03], ['M5', .42, .33, 6, .75, 12, -.42, -.33],
  ['M6', .57, .65, 23, .25, 12, .40, .48], ['M7', .56, .65, 17, .29, 7, .36, .47], ['M8', .50, .57, 7, .50, 6, .07, .24], ['M9', .54, .83, 30, .35, 20, .48, .56], ['M10', .60, .57, 21, .57, 7, .00, .09],
  ['M11', .58, .62, 21, .57, 7, .05, .14], ['M12', .44, .43, 7, .41, 17, .02, .10], ['M13', .61, .50, 18, .40, 5, .10, .19], ['M14', .59, .60, 20, .50, 6, .10, .19],
  ['F1', .48, .33, 9, .67, 9, -.33, -.25], ['F2', .34, .40, 5, .43, 28, -.03, .07], ['F3', .39, .50, 8, .36, 25, .14, .23], ['F4', .32, .33, 3, .27, 30, .07, .17], ['F5', .36, .20, 5, .22, 27, -.02, .08],
  ['F6', .46, .29, 7, .54, 11, -.26, -.18], ['F7', .41, .62, 13, .32, 25, .30, .39], ['F8', .53, .73, 15, .67, 9, .07, .15], ['F9', .45, .50, 8, .46, 13, .04, .12], ['F10', .46, .71, 14, .32, 19, .40, .48], ['F11', .53, .39, 13, .50, 10, -.12, -.04]];

/** Log-normal with given mean m and standard deviation sd (of the variable itself). */
function lognormFromMoments(m, sd) { const s2 = Math.log(1 + (sd * sd) / (m * m)); return { mu: Math.log(m) - s2 / 2, s: Math.sqrt(s2) }; }
const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
function Phi(z) { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp(-z * z / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
function PhiInv(q) { let lo = -8, hi = 8; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (Phi(m) < q) lo = m; else hi = m; } return (lo + hi) / 2; }

export default {
  collection: 'behav',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11', kind: 'Paradox', name: 'The hot hand: fallacy and reversal',
      statement: String.raw`Players and fans believe that a basketball shooter who has just hit several shots is "hot", more likely to hit the next. Gilovich, Vallone and Tversky (1985) tested this in the Cornell shooting experiment (26 players, about 100 shots each from a distance at which they hit about half) and found that players hit 49% after three hits and 45% after three misses, a difference indistinguishable from zero: the hot hand looked like a cognitive illusion, a celebrated **hot-hand fallacy**. Miller and Sanjurjo (2018) showed that the test was biased: in a finite sequence of independent shots, the *expected* proportion of hits that immediately follow a streak of $k$ hits is **below** the hit probability. For $p=\tfrac12$, $n=100$ and $k=3$ the expected difference between the rates after three hits and after three misses is about $-8$ percentage points, so GVT's $+4$ points is actually about $+12$ above what a consistent shooter would produce. With a bias-corrected test the average effect in GVT's own data is about $+13$ points, significant at 1%.`,
      idea: String.raw`Selecting the shots that follow a streak inside a fixed sequence is a subtle form of sampling without replacement. Take four flips of a fair coin and, in each sequence, the proportion of heads among flips that follow a heads: averaged over the 14 sequences where it is defined, it is $17/42\approx0.405$, not $\tfrac12$. A streak "uses up" heads from the finite sequence, and sequences with many heads, where the proportion would be high, contribute only one proportion each, however many streaks they contain. The bias shrinks as $n$ grows and increases with $k$. So the gambler's-fallacy intuition (behav-3.10) is wrong for the next independent flip, yet the naive test of the hot hand inherited exactly this kind of finite-sample effect.`,
      caption: String.raw`Answer the four-flip puzzle first. Left: the expected proportion of hits right after $k$ hits within a sequence of $n$ shots, for a consistent shooter with hit rate $p$ (exact enumeration up to $n=16$, simulation beyond); every curve lies below $p$ and approaches it slowly. Right: GVT's 25 Cornell players with enough data, each dot the difference between their hit rates after three hits and after three misses; switch on the correction to shift each player by the bias expected for their own hit rate and shot counts (values from Miller and Sanjurjo's Table 2).`,
      deps: ['behav-3.10'], refs: ['W&K ch. 4'], tags: ['hot hand', 'sampling bias', 'sequences'],
      see: ['behav-3.9'],
      credit: 'Gilovich, Vallone & Tversky, 1985; Miller & Sanjurjo, 2018',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hot_hand' },
      viz(v) {
        const pS = v.slider('hit probability p of a consistent shooter', 0.3, 0.7, 0.5, { step: 0.01 });
        const adj = v.toggle('correct for the streak-selection bias', false);
        const C = v.stage({ x: [0, 100], y: [0, 20], axes: false, height: 96, full: true, title: 'Puzzle: flip a fair coin 4 times; in each sequence, take the share of heads among flips that follow a heads.' });
        const A = v.stage({ x: [2, 101], xlog: true, y: [0.1, 0.62], axes: 'box', gutter: true, height: 320, xlabel: 'shots in the sequence n (log)', ylabel: 'expected P̂(hit | k hits)', title: 'a consistent shooter, measured the GVT way' });
        const B = v.stage({ x: [-0.6, 0.7], y: [-0.5, 28], axes: 'box', gutter: true, height: 320, xlabel: 'P̂(hit | 3 hits) − P̂(hit | 3 misses)', title: 'Cornell players (GVT 1985)', yticks: [] });
        let ans = null;
        const R = [[1.5, 1.5, 33, 11], [34, 1.5, 66, 11], [67, 1.5, 98.5, 11]], LAB = ['its average is 50%', 'its average is below 50%', 'its average is above 50%'];
        C.onClick((x, y) => R.forEach((r, i) => { if (inside(r, x, y)) ans = i; }));
        const exact4 = expectedProp(4, 1, 0.5);
        let cache = null;
        const curves = (p) => {
          if (cache && cache.p === p) return cache;
          const ns = [3, 4, 5, 6, 7, 8, 10, 12, 14, 16], big = [20, 30, 50, 100], out = {};
          for (const k of [1, 2, 3]) {
            out[k] = ns.filter((n) => n > k).map((n) => [n, expectedProp(n, k, p)]);
            for (const n of big) out[k].push([n, expectedPropMC(n, k, p, n >= 50 ? 6000 : 10000, 7 + n + 100 * k)]);
          }
          cache = { p, out }; return cache;
        };
        v.render(() => {
          C.text('Is the expected value of that share 50%? (Sequences with no heads before the last flip are skipped.)', 50, 16, { align: 'center', size: 12 });
          R.forEach((r, i) => card(C, r, { lines: [LAB[i]], chosen: ans === i, dim: ans != null && ans !== i, sub: ans != null && i === 1 ? `exact: 17/42 = ${v.fix(exact4, 3)}` : null, subColor: 'green' }));
          const p = pS.value, cv = curves(p).out;
          A.setView([2, 160], [Math.max(0, p - 0.42), Math.min(1, p + 0.1)]);
          A.hline(p, { color: 'ink', width: 1.4, dash: [6, 4] }); A.text(`p = ${v.fix(p, 2)}`, 160, p, { dx: -4, dy: -9, align: 'right', size: 11, weight: 700 });
          const col = { 1: 'blue', 2: 'purple', 3: 'red' };
          for (const k of [1, 2, 3]) { A.path(cv[k], { color: col[k], width: 2.2 }); A.dots(cv[k], { r: 3, color: col[k] }); const last = cv[k][cv[k].length - 1]; A.text(`k = ${k}`, last[0], last[1], { dx: 6, size: 11, weight: 700, color: col[k] }); }
          A.vline(100, GUIDE);
          // players
          const rows = GVT.map((r, i) => ({ r, i })).sort((a, b) => a.r[6] - b.r[6]);
          B.vline(0, { color: 'muted', width: 1 });
          const meanRaw = GVT.reduce((s, r) => s + r[6], 0) / GVT.length, meanAdj = GVT.reduce((s, r) => s + r[7], 0) / GVT.length;
          rows.forEach(({ r }, j) => {
            const y = j + 0.5, x0 = r[6], x1 = r[7];
            if (adj.value) { B.arrow(x0, y, x1, y, { color: 'faint', width: 1.2, head: 6 }); B.dot(x1, y, { r: 4.5, color: x1 > 0 ? 'green' : 'red' }); }
            else B.dot(x0, y, { r: 4.5, color: x0 > 0 ? 'green' : 'red' });
          });
          const m = adj.value ? meanAdj : meanRaw;
          B.vline(m, { color: 'gold', width: 2.4 }); B.text(`players’ mean ${m > 0 ? '+' : ''}${v.fix(100 * m, 0)} points`, m, 27, { dx: 6, size: 11.5, weight: 700, color: 'gold' });
          if (!adj.value) { B.vline(-0.08, { color: 'purple', width: 1.4, dash: [5, 4] }); B.text('consistent shooter: −8', -0.08, 27, { dx: -4, align: 'right', size: 10.5, weight: 700, color: 'purple' }); }
        });
        v.legend([['blue', 'k = 1'], ['purple', 'k = 2'], ['red', 'k = 3'], ['gold', 'players’ mean']]);
        v.readout(() => {
          const p = pS.value, cv = curves(p).out, e100 = cv[3][cv[3].length - 1][1];
          const you = ans == null ? 'Answer the puzzle first. ' : ans === 1 ? 'Right. ' : 'Not quite. ';
          return you + `For four fair flips the expected share is **${v.fix(exact4, 3)}**. A consistent shooter with $p = ${v.fix(p, 2)}$ taking 100 shots has expected $\\hat P(\\text{hit}\\mid 3\\text{ hits}) \\approx ${v.fix(e100, 3)}$, ${v.fix(100 * (p - e100), 1)} points below $p$ (simulated). GVT's players averaged .49 after three hits and .45 after three misses: **+3 points raw, +13 after correcting for the bias** (Miller & Sanjurjo).`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12', kind: 'Phenomenon', name: 'Regression to the mean mistaken for causation',
      statement: String.raw`Selecting unusually high or low outcomes partly produced by transient luck can create **regression to the mean** on a later measurement, even if nothing changes. In the **jointly normal model shown here**, standardized scores with correlation $\rho$ satisfy $E[X_2\mid X_1=x]=\rho x$ (stat-1.19). Correlation alone does not imply this conditional-mean formula for arbitrary score distributions; it specifies the best linear predictor. People can mistake the return toward the mean for a causal effect: flight instructors concluded that praise after a good landing makes cadets worse and harsh criticism after a bad one makes them better (Kahneman's experience in the Israeli air force); athletes on a magazine cover "suffer a jinx"; a treatment given to the sickest patients appears to work even without an effect.`,
      idea: String.raw`In this simulation, a season's standardized performance is $X_j=S+L_j$, with mutually independent, mean-zero **normal** skill $S$ of variance $1-\ell$ and luck $L_1,L_2$ of variance $\ell$. Skill persists and luck is redrawn, so both scores have variance one and their covariance is $1-\ell$. The Gaussian conditional-mean formula gives $E[X_2\mid X_1=x]=(1-\ell)x$. Thus the conditional expected average of athletes selected on their season-1 scores is $(1-\ell)$ times their season-1 average; a finite league's realized season-2 average fluctuates around that prediction. Uncorrelated residuals alone would establish only a linear prediction, not the exact conditional mean. No feedback, pressure or change in skill is built into this model. A comparison group selected the same way but not treated is needed to assess an actual treatment effect.`,
      caption: String.raw`Answer the instructors' question first. Each dot is one of 400 athletes with normal skill and independent normal luck: season 1 across, season 2 up. The top performers of season 1 (gold) are selected for the "cover". Purple shows their conditional expected season-2 average; red shows the finite sample's realized average. Every athlete's skill is unchanged. Set luck to 0 and both scores coincide; at luck 1 the conditional prediction is the population mean, while a new league's observed mean can fall on either side of it.`,
      deps: ['stat-12.9', 'stat-1.19'], refs: ['Kahneman ch. 17'], tags: ['regression to the mean', 'causation', 'luck'],
      credit: 'Galton, 1886; Kahneman, 1970s (flight instructors)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Regression_toward_the_mean' },
      viz(v) {
        const lS = v.slider('share of luck in a season’s performance ℓ', 0, 1, 0.5, { step: 0.01 });
        const kS = v.slider('athletes on the “cover” (top of season 1)', 5, 80, 20, { int: true });
        v.button('new league', () => { seed++; });
        const C = v.stage({ x: [0, 100], y: [0, 20], axes: false, height: 96, full: true, title: 'Flight instructors: cadets praised after a smooth landing usually do worse next time; cadets criticised after a rough one usually improve.' });
        const S = v.stage({ x: [-3.5, 3.5], y: [-3.5, 3.5], equal: true, axes: 'box', gutter: true, height: 340, xlabel: 'season 1 (standardized)', ylabel: 'season 2', title: '400 athletes, skill unchanged' });
        const B = v.stage({ x: [0, 1], y: [0, 2.8], axes: false, height: 340, title: 'the cover stars, before and after' });
        let ans = null, seed = 1;
        const R = [[1.5, 1.5, 49, 11], [51, 1.5, 98.5, 11]], LAB = ['so criticism works and praise backfires', 'this happens even if feedback does nothing'];
        C.onClick((x, y) => R.forEach((r, i) => { if (inside(r, x, y)) ans = i; }));
        let st = {};
        v.render(() => {
          C.text('What should the instructors conclude?', 50, 16, { align: 'center', size: 12.5, weight: 600 });
          R.forEach((r, i) => card(C, r, { lines: [LAB[i]], chosen: ans === i, dim: ans != null && ans !== i }));
          const l = lS.value, pts = gaussianRegressionLeague(l, 400, v.rng(seed));
          const idx = pts.map((_, i) => i).sort((a, b) => pts[b][0] - pts[a][0]).slice(0, kS.value), top = new Set(idx);
          S.dots(pts.filter((_, i) => !top.has(i)).map((p) => p.map((z) => clamp(z, -3.45, 3.45))), { r: 2.6, color: 'muted', alpha: 0.6 });
          S.line(-3.5, -3.5, 3.5, 3.5, { color: 'faint', width: 1, dash: [4, 4] });
          S.fn((x) => (1 - l) * x, { color: 'purple', width: 2.2, domain: [-3.5, 3.5] });
          S.dots(idx.map((i) => pts[i].map((z) => clamp(z, -3.45, 3.45))), { r: 3.6, color: 'gold' });
          const m1 = idx.reduce((s, i) => s + pts[i][0], 0) / idx.length, m2 = idx.reduce((s, i) => s + pts[i][1], 0) / idx.length;
          S.dot(m1, m2, { r: 7, color: 'red' }); S.arrow(m1, m1, m1, m2 + (m1 > m2 ? 0.12 : -0.12), { color: 'red', width: 2, head: 9 });
          S.text('slope 1 − ℓ', -3.3, -3.3 * (1 - l), { dx: 4, dy: -12, align: 'left', size: 11, weight: 700, color: 'purple' });
          const bars = [['season 1', m1, 'gold'], ['season 2', m2, 'red'], ['conditional mean', (1 - l) * m1, 'purple']];
          const xmin = Math.min(-0.25, m2 * 1.15), xmax = Math.max(3, m1 * 1.15);
          const barX = x => 0.45 + 0.4 * (x - xmin) / (xmax - xmin), zero = barX(0);
          B.line(zero, 0.2, zero, 2.7, { color: 'muted', width: 1 });
          bars.forEach(([label, value, color], i) => {
            const y = 2.3 - 0.8 * i, end = barX(value);
            B.text(label, 0.43, y, { align: 'right', size: 11.5 });
            B.rect(Math.min(zero, end), y - 0.23, Math.max(zero, end), y + 0.23, { fill: color, fillAlpha: 0.75, stroke: false });
            B.text(v.fix(value, 2), 0.88, y, { align: 'left', size: 11.5, weight: 700, color });
          });
          st = { m1, m2, l };
        });
        v.readout(() => {
          const { m1, m2, l } = st; if (m1 == null) return '';
          const you = ans == null ? 'Answer the instructors’ question first. ' : ans === 1 ? 'Right: chance alone produces the pattern. ' : 'That is the instructors’ mistake: chance alone produces the pattern. ';
          return you + `In this normal skill-plus-luck model, ℓ = ${v.fix(l, 2)}: the top ${kS.value} averaged **${v.fix(m1, 2)}** in season 1 and **${v.fix(m2, 2)}** in season 2. Their conditional expected season-2 average is $(1-\\ell)\\times${v.fix(m1, 2)} = ${v.fix((1 - l) * m1, 2)}$; the observed change is ${v.fix(m2 - m1, 2)} standard deviations, with no change in anyone's skill.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13', kind: 'Phenomenon', name: 'Overconfidence and calibration',
      statement: String.raw`A judge is **calibrated** if events assigned probability $q$ happen a fraction $q$ of the time: if $Y$ is the outcome indicator and $Q$ the reported probability, calibration means $P(Y=1\mid Q)=Q$ almost surely; for interval estimates, $90\%$ confidence intervals should contain the truth 9 times in 10. People's intervals are much too narrow: in the studies Tversky and Kahneman (1974) summarized, the true value fell outside subjects' 98% intervals (between their 1st and 99th percentiles) about 30% of the time instead of 2%, for naive and expert subjects alike and despite incentives through proper scoring rules. This **overprecision** is the most robust form of overconfidence; the others are overestimating one's own performance and overplacement (believing oneself better than others).`,
      scope: String.raw`Overprecision is robust for interval estimates of quantities. Overestimation and overplacement depend on task difficulty: people overestimate themselves on hard tasks and underestimate on easy ones (the hard–easy effect). Calibration improves with fast, clear feedback, as in weather forecasting.`,
      idea: String.raw`Interval estimates are typically made by anchoring on a best guess and adjusting outward (behav-3.4); the adjustment is insufficient, so the intervals are too tight. People also fail to imagine how their knowledge could be wrong. A good check is to count: for $n$ **independent** intervals, each with coverage 90%, the number of hits is $\text{Bin}(n,0.9)$, so with 10 questions 9 or 10 hits is typical and 6 or fewer happens with probability under 2%. Marginal 90% coverage alone does not imply a binomial hit count: errors across questions can be correlated.`,
      caption: String.raw`For each of the ten questions, drag the two handles to make an interval you are 90% sure contains the true value, then press **lock in** to see the answer (green inside, red outside). Move between questions with the buttons. The right panel counts your hits against the binomial distribution of hits under an ideal independent-90%-coverage model. The fixed quiz can have correlated errors; its displayed tail probability is a model comparison, not a diagnostic test of your calibration.`,
      deps: ['stat-2.1', 'prob-2.1.1a'], refs: ['W&K ch. 4'], tags: ['overconfidence', 'calibration', 'probability'],
      see: ['behav-3.4', 'behav-3.14'],
      credit: 'Alpert & Raiffa, 1969 (published 1982); Lichtenstein, Fischhoff & Phillips, 1982',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Overconfidence_effect' },
      viz(v) {
        const Qs = [
          ['height of Mount Everest (metres)', 8849, 3000, 15000], ['year Newton’s Principia was first published', 1687, 1400, 1900], ['average Earth–Moon distance (thousand km)', 384.4, 50, 1000],
          ['bones in an adult human skeleton', 206, 50, 500], ['member states of the United Nations', 193, 50, 300], ['speed of sound in air at 20 °C (m/s)', 343, 100, 1000],
          ['keys on a standard piano', 88, 40, 150], ['year the Magna Carta was sealed', 1215, 800, 1600], ['mean diameter of the Earth (km)', 12742, 2000, 40000], ['melting point of iron (°C)', 1538, 300, 4000]];
        let q = 0; const iv = Qs.map(([, , lo, hi]) => [lo + 0.35 * (hi - lo), lo + 0.55 * (hi - lo)]), locked = Qs.map(() => false), touched = Qs.map(() => false);
        const S = v.stage({ x: [0, 1], y: [0.15, 1], axes: false, height: 190, full: true });
        const B = v.stage({ x: [-0.5, 10.5], y: [0, 0.5], axes: 'box', gutter: true, height: 250, weight: 1.2, xlabel: 'hits among locked-in intervals', ylabel: 'probability', title: 'your hits vs independent 90% coverage' });
        const T = v.stage({ x: [0, 1], y: [0, 10], axes: false, height: 250, title: 'your ten intervals (scaled to each question’s range)' });
        const X0 = 0.06, X1 = 0.94, toX = (val) => X0 + ((val - Qs[q][2]) / (Qs[q][3] - Qs[q][2])) * (X1 - X0), fromX = (x) => Qs[q][2] + ((clamp(x, X0, X1) - X0) / (X1 - X0)) * (Qs[q][3] - Qs[q][2]);
        const hL = S.handle(toX(iv[0][0]), 0.45, { color: 'blue', constrain: (x) => [clamp(x, X0, X1), 0.45], label: 'low', labelPos: 's' });
        const hH = S.handle(toX(iv[0][1]), 0.45, { color: 'blue', constrain: (x) => [clamp(x, X0, X1), 0.45], label: 'high', labelPos: 's' });
        const sync = () => { hL.set(toX(iv[q][0]), 0.45); hH.set(toX(iv[q][1]), 0.45); };
        hL.onDrag = () => { if (!locked[q]) { iv[q][0] = fromX(hL.x); touched[q] = true; } else sync(); };
        hH.onDrag = () => { if (!locked[q]) { iv[q][1] = fromX(hH.x); touched[q] = true; } else sync(); };
        v.button('◀ previous question', () => { q = (q + 9) % 10; sync(); });
        v.button('next question ▶', () => { q = (q + 1) % 10; sync(); });
        v.button('lock in this interval', () => { locked[q] = true; });
        v.button('reveal all (demo)', () => { locked.fill(true); });
        const fmtv = (x) => (Math.abs(x) >= 1000 && Qs[q][1] > 1900 ? num(x) : Math.abs(x) >= 1000 ? String(Math.round(x)) : num(x, x < 10 ? 2 : x < 100 ? 1 : 0));
        let st = {};
        v.render(() => {
          const [nm, tru, lo, hi] = Qs[q], [a, b] = [Math.min(...iv[q]), Math.max(...iv[q])];
          S.text(`question ${q + 1} of 10: ${nm}`, 0.5, 0.9, { align: 'center', size: 14, weight: 700 });
          S.line(X0, 0.45, X1, 0.45, { color: 'faint', width: 4 });
          for (let i = 0; i <= 4; i++) { const x = X0 + (i / 4) * (X1 - X0); S.line(x, 0.41, x, 0.49, { color: 'muted', width: 1 }); S.text(fmtv(lo + (i / 4) * (hi - lo)), x, 0.3, { align: 'center', size: 10.5, color: 'muted' }); }
          const hit = tru >= a && tru <= b;
          S.rect(toX(a), 0.4, toX(b), 0.5, { fill: locked[q] ? (hit ? 'green' : 'red') : 'blue', fillAlpha: 0.35, stroke: false });
          S.text(`your 90% interval: ${fmtv(a)} to ${fmtv(b)}${touched[q] ? '' : ' (drag the handles)'}`, 0.5, 0.7, { align: 'center', size: 12.5, color: 'blue', weight: 600 });
          if (locked[q]) { S.line(toX(tru), 0.36, toX(tru), 0.6, { color: hit ? 'green' : 'red', width: 2.5 }); S.text(`true: ${fmtv(tru)}`, toX(tru), 0.62, { align: 'center', size: 12, weight: 700, color: hit ? 'green' : 'red' }); }
          // overview
          Qs.forEach(([, t, l0, h0], i) => {
            const y = 9.5 - i, s = (x) => 0.12 + 0.84 * ((x - l0) / (h0 - l0)), [aa, bb] = [Math.min(...iv[i]), Math.max(...iv[i])], ok = t >= aa && t <= bb;
            T.text(String(i + 1), 0.05, y, { align: 'center', size: 11, weight: i === q ? 800 : 500, color: i === q ? 'accent' : 'muted' });
            T.line(0.12, y, 0.96, y, { color: 'grid', width: 3 });
            T.line(s(aa), y, s(bb), y, { color: locked[i] ? (ok ? 'green' : 'red') : 'blue', width: 6, alpha: 0.7 });
            if (locked[i]) T.dot(s(t), y, { r: 3.5, color: 'ink' });
          });
          const n = locked.filter(Boolean).length, hits = Qs.filter(([, t], i) => locked[i] && t >= Math.min(...iv[i]) && t <= Math.max(...iv[i])).length;
          let ymax = 0; const pb = []; for (let k = 0; k <= n; k++) { pb.push(binomPmf(n, k, 0.9)); ymax = Math.max(ymax, pb[k]); }
          B.setView([-0.5, 10.5], [0, n ? Math.max(0.3, ymax * 1.2) : 0.5]);
          if (n) { pb.forEach((p, k) => B.rect(k - 0.38, 0, k + 0.38, p, { fill: k === hits ? 'red' : 'green', fillAlpha: k === hits ? 0.9 : 0.45, stroke: false })); B.text(`you: ${hits} of ${n}`, hits, ymax * 1.12, { align: 'center', size: 11.5, weight: 700, color: 'red' }); }
          else { const p10 = []; for (let k = 0; k <= 10; k++) p10.push(binomPmf(10, k, 0.9)); B.setView([-0.5, 10.5], [0, 0.5]); p10.forEach((p, k) => B.rect(k - 0.38, 0, k + 0.38, p, { fill: 'green', fillAlpha: 0.3, stroke: false })); B.text('independent 90% coverage, 10 questions', 0.2, 0.42, { size: 11.5, weight: 600, color: 'green' }); B.text('lock in intervals to add yours', 0.2, 0.37, { size: 11, color: 'muted' }); }
          let cdf = 0; for (let k = 0; k <= hits; k++) cdf += pb[k] || 0;
          st = { n, hits, cdf };
        });
        v.readout(() => {
          const { n, hits, cdf } = st; if (n == null) return '';
          if (!n) return 'Set an interval and lock it in to start. The bars assume independent intervals with 90% coverage; in the studies Tversky and Kahneman (1974) summarized, 98% intervals missed about 30% of the time.';
          return `Hit rate **${hits} of ${n}** (${pct(hits / n)}) against the 90% you intended. Under independent 90% coverage, P(at most ${hits} hits in ${n}) ${cdf < 0.001 ? '< 0.001' : '= ' + v.fix(cdf, 3)}${cdf < 0.05 ? ' — a small lower tail under this model.' : '.'} Correlated errors can change this benchmark; the fixed quiz does not diagnose calibration. In the studies Tversky and Kahneman (1974) summarized, 98% intervals missed the truth about 30% of the time.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14', kind: 'Phenomenon', name: 'The planning fallacy and the outside view',
      statement: String.raw`People predict that their own projects will finish sooner and cost less than similar projects did, even when they know that most similar projects ran late: the **planning fallacy** (Kahneman and Tversky 1979). Buehler, Griffin and Ross (1994) asked 37 psychology honours students when they would submit their thesis: on average they predicted 33.9 days (27.4 "if everything went as well as possible", 48.6 "if everything went as poorly as possible"); the theses took 55.5 days, and only 29.7% were finished by the predicted date. Large projects show the same pattern: in 258 transport projects, actual costs exceeded estimates by 27.6% on average (rail 44.7%, bridges and tunnels 33.8%, roads 20.4%; Flyvbjerg, Holm and Buhl 2002). The remedy is the **outside view**, or reference-class forecasting: start from the distribution of outcomes of similar past projects and adjust from there.`,
      idea: String.raw`The inside view builds a scenario for this project, step by step, and every step is imagined going roughly to plan; the many independent ways things can go wrong are each unlikely and are left out, though together they are likely (the conjunctive-events bias of behav-3.20). Overconfidence (behav-3.13) makes the scenario's range too narrow. The outside view replaces the scenario with a base rate (behav-3.7): if past projects of this type overran by a factor with a known distribution, the budget that gives, say, an 80% chance of not overrunning is the estimate times the 80th percentile of that factor. Flyvbjerg's later "optimism-bias uplifts" for UK transport projects work exactly this way.`,
      caption: String.raw`Left: the thesis study, predictions against the actual mean completion time, with the share finished by each predicted date. Right: choose a reference class and set the contingency you would add to an inside-view estimate. The curve is the distribution of actual/estimated cost for that class, drawn as a log-normal with the paper's mean and standard deviation (the shape is an assumption); the red area is the chance of exceeding your budget, and the readout gives the uplift needed for the acceptable risk you set.`,
      deps: ['behav-3.13'], refs: ['Kahneman ch. 23'], tags: ['planning', 'forecasting', 'optimism'],
      see: ['behav-3.7'],
      credit: 'Kahneman & Tversky, 1979; Buehler, Griffin & Ross, 1994; Flyvbjerg, 2002',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Planning_fallacy' },
      viz(v) {
        const cls = v.select('reference class', [{ value: 'rail', label: 'rail (58)' }, { value: 'fixed', label: 'bridges & tunnels (33)' }, { value: 'road', label: 'roads (167)' }, { value: 'all', label: 'all 258' }], 'rail');
        const cS = v.slider('contingency you add to the estimate (%)', 0, 150, 10, { step: 1 });
        const rS = v.slider('acceptable chance of overrunning the budget (%)', 5, 50, 20, { step: 1 });
        const RC = { rail: [1.447, 0.384, 'rail'], fixed: [1.338, 0.624, 'bridges & tunnels'], road: [1.204, 0.299, 'roads'], all: [1.276, 0.387, 'all projects'] };
        const A = v.stage({ x: [0, 1], y: [0, 4.4], axes: false, height: 300, title: 'thesis completion (Buehler et al. 1994, Study 1)' });
        const D = v.stage({ x: [0.3, 3.5], y: [0, 2.2], axes: 'box', gutter: true, height: 300, weight: 1.3, xlabel: 'actual cost ÷ estimated cost', ylabel: 'density', title: 'the outside view: cost overruns in the class' });
        let st = {};
        v.render(() => {
          const rows = [{ label: 'best case', value: 27.4, color: 'green', note: '27.4 d · 10.8% on time' }, { label: 'best guess', value: 33.9, color: 'blue', note: '33.9 d · 29.7% on time' },
            { label: 'worst case', value: 48.6, color: 'orange', note: '48.6 d · 48.7% on time' }, { label: 'actual (mean)', value: 55.5, color: 'red', note: '55.5 days', bold: true }];
          hbars(A, rows, { x0: 0.26, x1: 0.56, yTop: 4.3, rowH: 1.05, max: 60, size: 11.5 });
          const [m, sd, name] = RC[cls.value], ln = lognormFromMoments(m, sd), pdf = (x) => (x <= 0 ? 0 : phi((Math.log(x) - ln.mu) / ln.s) / (x * ln.s));
          const ymax = pdf(Math.exp(ln.mu - ln.s * ln.s)) * 1.15;
          D.setView([0.3, 3.5], [0, ymax]);
          const bud = 1 + cS.value / 100;
          D.between(pdf, () => 0, bud, 3.5, { fill: 'red', fillAlpha: 0.25 });
          D.fn(pdf, { color: 'blue', width: 2.4, domain: [0.31, 3.5], n: 300 });
          D.vline(1, { color: 'muted', width: 1.2, dash: [5, 4] }); D.text('estimate', 1, ymax, { dx: -4, dy: 12, align: 'right', size: 11, color: 'muted' });
          D.vline(bud, { color: 'red', width: 2 }); D.text(`your budget +${cS.value}%`, bud, ymax, { dx: 5, dy: 12, size: 11.5, weight: 700, color: 'red' });
          const q = Math.exp(ln.mu + ln.s * PhiInv(1 - rS.value / 100));
          D.vline(q, { color: 'green', width: 2, dash: [6, 4] }); D.text(`needed: +${Math.round(100 * (q - 1))}%`, q, ymax, { dx: 5, dy: 30, size: 11.5, weight: 700, color: 'green' });
          D.text(`mean ${v.fix(m, 3)}, SD ${v.fix(sd, 3)}`, 3.45, ymax * 0.6, { align: 'right', size: 11, color: 'blue', weight: 600 });
          st = { pOver: 1 - Phi((Math.log(bud) - ln.mu) / ln.s), q, name };
        });
        v.readout(() => {
          const { pOver, q, name } = st; if (q == null) return '';
          return `Students' best guesses were 21.6 days short of the actual mean, and even their worst cases were 6.9 days short. For ${name}, a ${cS.value}% contingency leaves a **${pct(pOver)}** chance of overrunning (log-normal fit); keeping that chance to ${rS.value}% needs an uplift of **${Math.round(100 * (q - 1))}%** on the inside-view estimate.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15', kind: 'Phenomenon', name: 'Hindsight bias',
      statement: String.raw`Once people know how events turned out, they overestimate how predictable the outcome was and misremember their own earlier predictions as closer to it: **hindsight bias**, or the "I knew it all along" effect. Fischhoff (1975) gave subjects an account of the 1814 war between the British and the Gurkhas of Nepal with four possible outcomes (British victory, Gurkha victory, stalemate without a peace settlement, stalemate with one). Groups told that a given outcome had happened rated that outcome as more likely in foresight than uninformed subjects did, even when asked to ignore what they had been told; Fischhoff called it *creeping determinism*. In the memory design (Fischhoff and Beyth 1975) people recall their own predictions as having been closer to the outcome. Meta-analyses put the effect at a mean $d=0.39$ over 95 studies (Guilbault et al. 2004).`,
      idea: String.raw`Outcome knowledge is integrated into what one knows and cannot be switched off; the story that leads to the actual outcome becomes coherent and the alternatives fade. When asked for an earlier judgment, people reconstruct it from present knowledge, anchoring on the outcome (behav-3.4) and adjusting insufficiently. The bias makes decision makers be judged by outcomes rather than by the quality of the decision (outcome bias), and it hides how uncertain the world was, feeding overconfidence (behav-3.13).`,
      caption: String.raw`Step 1: split the bar between the four outcomes by dragging the three handles (your foresight probabilities). Step 2: you are told an outcome (chosen with the second control, as in Fischhoff's design where different groups heard different outcomes); your foresight bar is hidden and you set, from memory, the probability you gave that outcome. Step 3 compares the two. Below: two normal distributions separated by the meta-analytic effect size, the typical shift between foresight and hindsight judgments.`,
      deps: [], refs: ['Kahneman ch. 19'], tags: ['hindsight', 'memory', 'judgment'],
      see: ['behav-3.13'],
      credit: 'Fischhoff, 1975',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hindsight_bias' },
      viz(v) {
        const OUT = ['British victory', 'Gurkha victory', 'stalemate, no peace', 'stalemate, peace settlement'], COL = ['blue', 'red', 'orange', 'purple'];
        const step = v.select('step', [{ value: 1, label: '1. foresight' }, { value: 2, label: '2. outcome told' }, { value: 3, label: '3. compare' }], 1);
        const told = v.select('outcome you are told', OUT.map((o, i) => ({ value: i, label: o })), 0);
        const rec = v.slider('from memory: the probability you gave this outcome', 0, 1, 0.5, { step: 0.01 });
        const S = v.stage({ x: [0, 1], y: [0.08, 0.95], axes: false, height: 170, full: true, title: 'the British–Gurkha war of 1814: how likely was each outcome, before the war?' });
        const M = v.stage({ x: [-3, 3.6], y: [0, 0.48], axes: 'box', gutter: true, height: 220, full: true, xlabel: 'judged probability of the reported outcome (standardized)', ylabel: 'density', title: 'foresight vs hindsight judgments: meta-analytic shift d = 0.39 (95 studies)' });
        const X0 = 0.05, X1 = 0.95, Y = 0.5;
        const hs = [0.25, 0.5, 0.75].map((t) => S.handle(X0 + t * (X1 - X0), Y, { color: 'ink', r: 7, constrain: (x) => [clamp(x, X0, X1), Y] }));
        const cuts = () => { const c = hs.map((h) => (h.x - X0) / (X1 - X0)).sort((a, b) => a - b); return [0, ...c, 1]; };
        v.render(() => {
          const sp = +step.value, c = cuts(), pr = [0, 1, 2, 3].map((i) => c[i + 1] - c[i]), k = +told.value;
          rec.el.hidden = sp !== 2;
          hs.forEach((h) => { h.visible = sp === 1; });
          if (sp !== 2) {
            for (let i = 0; i < 4; i++) {
              const a = X0 + c[i] * (X1 - X0), b = X0 + c[i + 1] * (X1 - X0);
              S.rect(a, Y - 0.12, b, Y + 0.12, { fill: COL[i], fillAlpha: sp === 3 && i !== k ? 0.2 : 0.6, color: 'panel', width: 2 });
              if (b - a > 0.07) S.text(`${Math.round(100 * pr[i])}%`, (a + b) / 2, Y, { align: 'center', size: 12, weight: 700, halo: false });
              S.text(OUT[i], X0 + (i + 0.5) * (X1 - X0) / 4, 0.18, { align: 'center', size: 11.5, weight: 600, color: COL[i] });
              S.line(X0 + (i + 0.5) * (X1 - X0) / 4, 0.24, (a + b) / 2, Y - 0.13, { color: COL[i], width: 1, alpha: 0.6 });
            }
          } else {
            S.rect(X0, Y - 0.12, X1, Y + 0.12, { fill: 'grid', fillAlpha: 0.6, color: 'faint', width: 1 });
            S.text('your foresight bar is hidden', 0.5, Y, { align: 'center', size: 13, color: 'muted' });
            S.text(`You learn: the war ended in “${OUT[k]}”.  Use the slider: what probability did you give it?`, 0.5, 0.2, { align: 'center', size: 13, weight: 700, color: COL[k] });
          }
          if (sp === 3) {
            const f = pr[k], h = rec.value;
            S.text(`foresight: ${Math.round(100 * f)}%   →   recalled: ${Math.round(100 * h)}%   (${h > f + 0.005 ? '+' : ''}${Math.round(100 * (h - f))} points)`, 0.5, 0.85, { align: 'center', size: 13.5, weight: 700, color: h > f + 0.02 ? 'red' : 'green', plate: true });
          }
          // meta-analytic shift
          const d = 0.39;
          M.fn((x) => phi(x), { color: 'blue', width: 2.2, fill: 'blue', fillAlpha: 0.12, domain: [-3, 3.6] });
          M.fn((x) => phi(x - d), { color: 'red', width: 2.2, fill: 'red', fillAlpha: 0.12, domain: [-3, 3.6] });
          M.vline(0, { color: 'blue', width: 1, dash: [4, 4] }); M.vline(d, { color: 'red', width: 1, dash: [4, 4] });
          M.text('without outcome knowledge', -0.1, 0.43, { align: 'right', size: 11.5, weight: 700, color: 'blue' });
          M.text('told the outcome', d + 0.1, 0.43, { size: 11.5, weight: 700, color: 'red' });
          M.text(`P(a hindsight judgment exceeds a foresight one) = ${v.fix(Phi(d / Math.SQRT2), 2)}`, 3.5, 0.3, { align: 'right', size: 11, color: 'ink', plate: true });
        });
        v.legend([['blue', 'foresight'], ['red', 'hindsight']]);
        v.readout(() => {
          const sp = +step.value, c = cuts(), k = +told.value, f = c[k + 1] - c[k];
          if (sp === 1) return `Your foresight probabilities: ${OUT.map((o, i) => `${o} ${Math.round(100 * (c[i + 1] - c[i]))}%`).join(', ')}. Then go to step 2.`;
          if (sp === 2) return `Set from memory the probability you gave “${OUT[k]}”, then go to step 3.`;
          const h = rec.value;
          return `You gave “${OUT[k]}” **${Math.round(100 * f)}%** and recalled **${Math.round(100 * h)}%**${h > f + 0.02 ? ': your memory moved toward the outcome, the hindsight bias.' : Math.abs(h - f) <= 0.02 ? ': accurate recall (not easy once the bar has been seen moving — in the lab the gap is days).' : '.'} The meta-analytic shift $d = 0.39$ means a random hindsight judgment exceeds a random foresight judgment ${pct(Phi(0.39 / Math.SQRT2))} of the time.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16', kind: 'Phenomenon', name: 'The decoy (attraction) effect',
      statement: String.raw`Adding an option that is **asymmetrically dominated**, worse than one existing option $A$ on every attribute but not worse than the other option $B$, increases the share of people choosing $A$ (Huber, Payne and Puto 1982). This violates *regularity* (adding an option can never raise another option's share) and Luce's choice axiom (psych-3.8), under which the ratio of the choice probabilities of $A$ and $B$ does not depend on what else is offered. A widely retold illustration (from Ariely's book *Predictably Irrational*, 2008; not a refereed study): offered a web-only magazine subscription for \$59, print only for \$125, or print and web for \$125, 16% of 100 students chose web only, 0% print only and 84% print and web; without the print-only decoy, 68% chose web only and 32% print and web.`,
      scope: String.raw`The effect is robust with stylized attribute descriptions in the laboratory; with realistic, perceptual or familiar stimuli it is often much weaker, and some 2014 replications found it hard to obtain.`,
      idea: String.raw`Choices are made by comparing options with each other, not by valuing each on its own. The decoy gives $A$ a clear, easily justified win ("$A$ beats $D$ on everything"), while $B$'s comparison with $D$ is a trade-off. Models of context-dependent choice capture this with comparison-based utilities, attention that shifts to the dominance relation, or sequential sampling (decision field theory). Any such model must break Luce's independence from irrelevant alternatives, the property that makes logit choice tractable.`,
      caption: String.raw`First choose a subscription from the three-option menu, then from the two-option menu. Below, two options in attribute space (quality up, cheapness right). Drag the decoy $D$: inside $A$'s shaded dominance region it is dominated by $A$ only. The bars compare choice shares without a decoy, Luce's prediction with $D$ (logit with the same utilities: $A$ and $B$ keep their ratio) and a simple comparison model in which an option gains utility for each option it dominates (strength on the slider).`,
      deps: ['psych-3.8'], refs: ['W&K ch. 3'], tags: ['context effects', 'choice', 'Luce axiom'],
      credit: 'Huber, Payne & Puto, 1982',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Decoy_effect' },
      viz(v) {
        const menu = v.select('menu', [{ value: 3, label: 'three options' }, { value: 2, label: 'two options' }], 3);
        const dS = v.slider('comparison model: utility bonus per dominated option', 0, 2, 0.8, { step: 0.05 });
        const C = v.stage({ x: [0, 100], y: [0, 20], axes: false, height: 78, full: true, title: 'The Economist: choose a subscription' });
        const P = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, equal: true, height: 320, xlabel: 'cheapness →', ylabel: 'quality →', title: 'attribute space' });
        const B = v.stage({ x: [0, 1], y: [0, 3.3], axes: false, height: 320, weight: 1.25, title: 'choice shares' });
        const ans = { 3: null, 2: null };
        const OPT = [['web only', '\$59', 'web'], ['print only', '\$125', 'print'], ['print & web', '\$125', 'both']];
        C.onClick((x, y) => { const m = +menu.value, opts = m === 3 ? [0, 1, 2] : [0, 2]; const w = 97 / opts.length; opts.forEach((o, j) => { if (inside([1.5 + j * w, 2, 1.5 + (j + 1) * w - 1.5, 18], x, y)) ans[m] = o; }); });
        const A = [0.3, 0.8], Bp = [0.8, 0.3];
        const D = P.handle(0.22, 0.62, { color: 'gold', label: 'D', labelPos: 'e', constrain: (x, y) => [clamp(x, 0.02, 0.98), clamp(y, 0.02, 0.98)] });
        const DATA = { 3: [16, 0, 84], 2: [68, null, 32] };
        let st = {};
        v.render(() => {
          const m = +menu.value, opts = m === 3 ? [0, 1, 2] : [0, 2], w = 97 / opts.length;
          opts.forEach((o, j) => card(C, [1.5 + j * w, 2, 1.5 + (j + 1) * w - 1.5, 18], { lines: [`${OPT[o][0]}: ${OPT[o][1]} a year`], chosen: ans[m] === o, dim: ans[m] != null && ans[m] !== o, sub: ans[m] != null ? `${DATA[m][o]}% (Ariely)` : null }));
          // attribute space
          P.rect(0, 0, A[0], A[1], { fill: 'blue', fillAlpha: 0.08, stroke: false }); P.rect(0, 0, Bp[0], Bp[1], { fill: 'red', fillAlpha: 0.08, stroke: false });
          P.text('dominated by A', 0.015, 0.5, { size: 10.5, color: 'blue', weight: 600 }); P.text('dominated by B', Bp[0] - 0.02, 0.04, { align: 'right', size: 10.5, color: 'red', weight: 600 });
          P.line(0.1, 1, 1, 0.1, { color: 'faint', width: 1, dash: [4, 4] });
          P.dot(A[0], A[1], { r: 8, color: 'blue', label: 'A', labelPos: 'ne' }); P.dot(Bp[0], Bp[1], { r: 8, color: 'red', label: 'B', labelPos: 'ne' });
          const Dp = [D.x, D.y], dom = (p, q) => p[0] >= q[0] && p[1] >= q[1] && (p[0] > q[0] || p[1] > q[1]);
          const u = (p) => 3 * (p[0] + p[1]);
          const items = [A, Bp, Dp], dB = dS.value;
          const exps = (bonus) => items.map((p, i) => Math.exp(u(p) + (bonus ? dB * items.filter((q, j) => j !== i && dom(p, q)).length : 0)));
          const sh = (e) => { const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
          const two = sh([Math.exp(u(A)), Math.exp(u(Bp))]), luce = sh(exps(false)), comp = sh(exps(true));
          const rows = [{ label: 'no decoy: A', value: two[0], color: 'blue' }, { label: 'no decoy: B', value: two[1], color: 'red' },
            { label: 'Luce with D: A', value: luce[0], color: 'blue', alpha: 0.45 }, { label: 'Luce with D: B', value: luce[1], color: 'red', alpha: 0.45 }, { label: 'Luce with D: D', value: luce[2], color: 'gold', alpha: 0.45 },
            { label: 'comparison: A', value: comp[0], color: 'blue', bold: true }, { label: 'comparison: B', value: comp[1], color: 'red', bold: true }, { label: 'comparison: D', value: comp[2], color: 'gold', bold: true }];
          hbars(B, rows, { x0: 0.4, x1: 0.82, yTop: 3.25, rowH: 0.4, max: 1, size: 10.5 });
          st = { two, luce, comp, dA: dom(A, Dp) && !dom(Bp, Dp), dB: dom(Bp, Dp) && !dom(A, Dp) };
        });
        v.readout(() => {
          const { two, luce, comp, dA, dB } = st; if (!two) return '';
          const where = dA ? 'D is dominated by A only (a decoy for A)' : dB ? 'D is dominated by B only (a decoy for B)' : 'D is not asymmetrically dominated';
          return `${where}. A : B ratio without D ${v.fix(two[0] / two[1], 2)}, under Luce with D ${v.fix(luce[0] / luce[1], 2)} (unchanged), in the comparison model ${v.fix(comp[0] / comp[1], 2)}. A's share goes from ${pct(two[0])} to ${pct(comp[0])}${comp[0] > two[0] + 1e-9 ? ' — **up**, which regularity forbids.' : '.'} Ariely's menu: print & web 32% → 84% once the dominated print-only offer was added.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17', kind: 'Phenomenon', name: 'Preference reversals (P-bet vs $-bet)',
      statement: String.raw`Offered a **P-bet** (high probability of a modest win: 35/36 to win \$4, else lose \$1) and a **\$-bet** (low probability of a large win: 9/36 to win \$16, 25/36 to lose \$1.50, otherwise nothing), many people choose the P-bet but name a higher selling price for the \$-bet (Lichtenstein and Slovic 1971). In Lichtenstein and Slovic's first experiment, 42.5% of all responses were of this "standard" reversal type and 3.1% the opposite. Grether and Plott (1979) set out to debunk the finding with real incentives and found it again: with incentives, 26.4% of responses chose P but priced \$ higher, against 8.4% choosing \$ but pricing P higher. Since any preference over the two bets implies one ranking for both tasks, these responses cannot come from a single utility function: either preferences are intransitive or, as later work concluded, the elicitation procedure itself changes the preference (a failure of *procedure invariance*).`,
      idea: String.raw`Under expected utility (behav-1.3) each bet has a certainty equivalent, the sure amount with the same utility; choosing compares the certainty equivalents and pricing reports them, so the two tasks cannot disagree. People, however, weigh attributes differently by task: when stating a price in dollars they anchor on the dollar amount to win and adjust insufficiently for the probability (behav-3.4), the *compatibility* effect; when choosing they attend more to the probability of winning. The pattern helped persuade economists that preferences can be constructed in the act of eliciting them.`,
      caption: String.raw`Choose the bet you would rather play, then set the lowest price at which you would sell each one. The page detects a reversal. Middle: the certainty equivalent of each bet for an expected-utility maximizer with constant absolute risk aversion $r$: whichever curve is higher is both chosen and priced higher, at every $r$; your two prices are the horizontal lines. Right: Grether and Plott's choice × price table without and with incentives (percentages of responses; red cells are reversals).`,
      deps: ['behav-1.3'], refs: ['Kahneman ch. 33'], tags: ['preference reversal', 'procedure invariance', 'risk'],
      see: ['behav-3.4'],
      credit: 'Lichtenstein & Slovic, 1971; Grether & Plott, 1979',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Preference_reversal' },
      viz(v) {
        const prP = v.slider('your selling price for the P-bet (\\$)', 0, 16, 3.5, { step: 0.25 });
        const prD = v.slider('your selling price for the \\$-bet (\\$)', 0, 16, 5, { step: 0.25 });
        const C = v.stage({ x: [0, 100], y: [0, 20], axes: false, height: 84, full: true, title: 'Which bet would you rather play?' });
        const E = v.stage({ x: [-0.6, 0.6], y: [-2, 8], axes: 'box', gutter: true, height: 300, weight: 1.2, xlabel: 'absolute risk aversion r', ylabel: 'certainty equivalent ($)', title: 'expected utility: one number per bet' });
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, title: 'Grether & Plott (1979): choice × higher price, % of responses' });
        const P = [[4, 35 / 36], [-1, 1 / 36]], Dl = [[16, 9 / 36], [-1.5, 25 / 36], [0, 2 / 36]];
        const ce = (L, r) => (Math.abs(r) < 1e-6 ? L.reduce((s, [x, p]) => s + x * p, 0) : -Math.log(L.reduce((s, [x, p]) => s + p * Math.exp(-r * x), 0)) / r);
        let ans = null;
        const RP = [1.5, 2, 49, 18], RD = [51, 2, 98.5, 18];
        C.onClick((x, y) => { if (inside(RP, x, y)) ans = 'P'; else if (inside(RD, x, y)) ans = 'D'; });
        const T1 = v.table(T, { rows: 2, cols: 2, region: [0.02, 0.02, 0.49, 0.86], square: false, cellAspect: 1.4, maxCell: 76, rowLabels: ['chose P', 'chose $'], colLabels: ['P higher', '$ higher'], size: 14, labelSize: 11 });
        const T2 = v.table(T, { rows: 2, cols: 2, region: [0.51, 0.02, 0.98, 0.86], square: false, cellAspect: 1.4, maxCell: 76, rowLabels: ['chose P', 'chose $'], colLabels: ['P higher', '$ higher'], size: 14, labelSize: 11 });
        v.render(() => {
          card(C, RP, { tag: 'P', lines: ['35/36 chance to win $4, 1/36 to lose $1', 'expected value $3.86'], chosen: ans === 'P', dim: ans === 'D' });
          card(C, RD, { tag: '$', lines: ['9/36 chance to win $16, 25/36 to lose $1.50', 'expected value $2.96'], chosen: ans === 'D', dim: ans === 'P' });
          E.hline(0, { color: 'muted', width: 1 });
          E.fn((r) => ce(P, r), { color: 'blue', width: 2.4, domain: [-0.6, 0.6] }); E.fn((r) => ce(Dl, r), { color: 'purple', width: 2.4, domain: [-0.6, 0.6] });
          E.text('P-bet', 0.58, ce(P, 0.58), { dx: -4, dy: -10, align: 'right', size: 11.5, weight: 700, color: 'blue' });
          E.text('$-bet', 0.58, ce(Dl, 0.58), { dx: -4, dy: 12, align: 'right', size: 11.5, weight: 700, color: 'purple' });
          E.hline(prP.value, { color: 'blue', width: 1.4, dash: [6, 4] }); E.hline(prD.value, { color: 'purple', width: 1.4, dash: [6, 4] });
          E.text('your P price', -0.6, prP.value, { dx: 4, dy: prP.value > prD.value ? -8 : 10, size: 10.5, color: 'blue' }); E.text('your \$ price', 0.6, prD.value, { dx: -4, dy: prD.value >= prP.value ? -8 : 10, align: 'right', size: 10.5, color: 'purple' });
          const tab = (d, rev) => ({ value: (i, j) => v.fix(d[i][j], 1), fill: (i, j) => ((i === 0 && j === 1) || (i === 1 && j === 0) ? ['red', i === 0 ? 0.35 : 0.15] : ['green', 0.15]) });
          T.text('higher selling price →', 0.5, 0.06, { align: 'center', size: 11, color: 'muted' }); T.text('no incentives', 0.255, 0.95, { align: 'center', size: 12, weight: 700 }); T.text('with incentives', 0.745, 0.95, { align: 'center', size: 12, weight: 700 });
          T1.draw(tab([[20.0, 29.0], [5.7, 45.3]])); T2.draw(tab([[9.9, 26.4], [8.4, 55.3]]));
        });
        v.readout(() => {
          const r0 = 0, cP = ce(P, r0), cD = ce(Dl, r0), cross = (() => { let lo = -0.6, hi = 0.6; const f = (r) => ce(P, r) - ce(Dl, r); if (f(lo) * f(hi) > 0) return null; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; })();
          const pricedP = prP.value > prD.value, pricedD = prD.value > prP.value;
          const rev = ans && ((ans === 'P' && pricedD) || (ans === 'D' && pricedP));
          const you = !ans ? 'Choose a bet first. ' : rev ? `**Preference reversal:** you chose the ${ans === 'P' ? 'P' : '\\$'}-bet but priced the ${ans === 'P' ? '\\$' : 'P'}-bet higher, the ${ans === 'P' ? 'standard' : 'rarer'} pattern. ` : 'Your choice and prices agree. ';
          return you + `Risk-neutral values: P \\$${v.fix(cP, 2)}, \\$-bet \\$${v.fix(cD, 2)}${cross != null ? `; the certainty equivalents cross at $r \\approx ${v.fix(cross, 3)}$ (risk-seeking), so an expected-utility maximizer can prefer either bet but always prices the one it chooses higher` : ''}. With incentives, 72.6% of Grether and Plott's P-choices were priced below the \\$-bet.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18', kind: 'Method', name: 'Fast-and-frugal heuristics (take-the-best)',
      statement: String.raw`**Take-the-best** (Gigerenzer and Goldstein 1996) infers which of two objects has the larger value of a criterion (which city is bigger?) from binary cues: (1) look up the cues in order of their *validity* (the share of correct inferences among pairs the cue discriminates); (2) stop at the first cue that discriminates between the two objects; (3) choose the object that cue favours. It ignores all other cues and makes no trade-offs. On 83 German cities with nine cues (national capital, exposition site, top-league soccer team, intercity train, state capital, one-letter licence plate, university, industrial belt, former East Germany; validities from 1.00 down to 0.51), it drew as many correct inferences as multiple regression and weighted tallying while looking up far fewer cues, and in later tests on 20 data sets (Czerlinski, Gigerenzer and Goldstein 1999) it predicted held-out cases as well as or better than regression. Heuristics that fit the structure of the environment are **ecologically rational**.`,
      scope: String.raw`Take-the-best does well when cue validities are very unequal (noncompensatory environments) and when samples are small, where complex models overfit. When many cues are about equally valid, or with abundant data, linear models and machine learning do better.`,
      idea: String.raw`A heuristic trades bias for variance. Regression estimates one weight per cue and, from a small training sample, those weights are noisy, so its out-of-sample accuracy falls well below its in-sample fit. Take-the-best estimates only an ordering of the cues, which is learned reliably from few examples; in environments where each cue outweighs all lower cues combined, the ordering is all that matters. This is the ecological-rationality answer to the biases programme: a shortcut is not an error if it is matched to the environment (behav-3.1).`,
      caption: String.raw`Top: two cities of a simulated 83-city world whose nine cues are generated to mimic Gigerenzer and Goldstein's Table 1 (the validities actually realized are computed and shown in the header). Click the city you think is larger; take-the-best's search is highlighted: it checks the cues from left to right and stops at the first column where the cities differ. Bottom: accuracy on held-out pairs as the training set grows, averaged over 12 random splits, for take-the-best, tallying and multiple regression; the dotted line is regression's fit to its own training data.`,
      deps: ['behav-3.1'], refs: ['W&K ch. 4'], tags: ['heuristics', 'ecological rationality', 'prediction'],
      see: ['behav-3.19', 'stat-3.2'],
      credit: 'Gigerenzer & Goldstein, 1996',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Take-the-best_heuristic' },
      viz(v) {
        const CUES = ['capital', 'expo', 'soccer', 'train', 'state cap.', 'plate', 'univ.', 'industry', 'east'];
        const DR = [0.02, 0.25, 0.30, 0.38, 0.30, 0.34, 0.51, 0.30, 0.27], LOAD = [0, 0.85, 0.8, 0.6, 0.62, 0.55, 0.5, 0.15, 0.04];
        const N = 83, r = v.rng(21);
        const z = Array.from({ length: N }, () => r.normal()).sort((a, b) => b - a), pop = z.map((x) => Math.round(Math.exp(12.6 + 0.85 * x)));
        const cue = z.map((zz, i) => DR.map((d, k) => {
          if (k === 0) return i === 0 ? 1 : 0;
          const p = (1 - Math.sqrt(1 - 2 * d)) / 2, t = PhiInv(1 - p);
          return LOAD[k] * zz + Math.sqrt(1 - LOAD[k] ** 2) * r.normal() > t ? 1 : 0;
        }));
        const validity = (ids) => DR.map((_, k) => { let ok = 0, all = 0; for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) { const i = ids[a], j = ids[b]; if (cue[i][k] !== cue[j][k]) { all++; if ((cue[i][k] > cue[j][k]) === (z[i] > z[j])) ok++; } } return all ? ok / all : 0.5; });
        const VAL = validity(z.map((_, i) => i)), ORDER = VAL.map((x, k) => k).sort((a, b) => VAL[b] - VAL[a]);
        const ttb = (i, j, order) => { for (const k of order) if (cue[i][k] !== cue[j][k]) return cue[i][k] > cue[j][k] ? 1 : -1; return 0; };
        const evalSplit = (frac, seed) => {
          const rr = v.rng(seed), ids = rr.shuffle(z.map((_, i) => i));
          const m = Math.max(3, Math.round(frac * N)), tr = ids.slice(0, m), te = ids.slice(m);
          const val = validity(tr), ord = val.map((x, k) => k).sort((a, b) => val[b] - val[a]);
          const X = tr.map((i) => [1, ...cue[i]]), y = tr.map((i) => Math.log(pop[i]));
          const w = v.M.lstsq(X, y), pred = (i) => w[0] + cue[i].reduce((s, c, k) => s + c * w[k + 1], 0);
          const score = (set) => { let a = 0, b = 0, c = 0, n = 0; for (let x = 0; x < set.length; x++) for (let yv = x + 1; yv < set.length; yv++) { const i = set[x], j = set[yv], truth = z[i] > z[j] ? 1 : -1; const t = ttb(i, j, ord); a += t === 0 ? 0.5 : t === truth ? 1 : 0; const ti = cue[i].reduce((s, q) => s + q, 0) - cue[j].reduce((s, q) => s + q, 0); b += ti === 0 ? 0.5 : Math.sign(ti) === truth ? 1 : 0; const d = pred(i) - pred(j); c += Math.abs(d) < 1e-9 ? 0.5 : Math.sign(d) === truth ? 1 : 0; n++; } return [a / n, b / n, c / n]; };
          return { test: score(te), train: score(tr) };
        };
        const FR = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
        const CURVE = FR.map((f) => { const acc = [0, 0, 0, 0]; for (let s = 0; s < 12; s++) { const e = evalSplit(f, 100 + s); acc[0] += e.test[0]; acc[1] += e.test[1]; acc[2] += e.test[2]; acc[3] += e.train[2]; } return [f, ...acc.map((x) => x / 12)]; });
        let pair = [3, 40], ans = null, pseed = 1;
        v.button('new pair of cities', () => { const rr = v.rng(++pseed); let a = rr.int(0, N - 1), b = rr.int(0, N - 1); while (b === a) b = rr.int(0, N - 1); pair = [a, b]; ans = null; });
        const showP = v.toggle('show populations', false);
        const TS = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true, title: 'which city is larger? (click a row)' });
        const A = v.stage({ x: [0, 0.85], y: [0.5, 0.92], axes: 'box', gutter: true, height: 300, full: true, xlabel: 'share of the 83 cities used for training', ylabel: 'accuracy on held-out pairs', title: 'generalization: simple beats complex on small samples' });
        const Tb = v.table(TS, { rows: 2, cols: 9, region: [0.2, 0.02, 0.99, 0.9], square: false, cellAspect: 1.25, maxCell: 54, colLabels: CUES.map((c, k) => c), size: 14, labelSize: 10.5 });
        TS.onClick((x, y) => { const h = Tb.hit(x, y); if (h && h.i >= 0) ans = h.i; else if (x < 0.2 && y < 0.7) ans = y > 0.37 ? 0 : 1; });
        v.legend([['green', 'take-the-best'], ['orange', 'tallying'], ['purple', 'multiple regression (held-out)'], ['purple', 'regression, fit to its training data', { dash: true }]]);
        v.render(() => {
          const [i, j] = pair, ord = ORDER;
          let stopK = null; for (const k of ord) if (cue[i][k] !== cue[j][k]) { stopK = k; break; }
          const pick = stopK == null ? null : cue[i][stopK] > cue[j][stopK] ? 0 : 1, truth = z[i] > z[j] ? 0 : 1;
          Tb.draw({ value: (a, k) => (cue[pair[a]][k] ? '+' : '−'), fill: (a, k) => (k === stopK ? [a === pick ? 'green' : 'red', 0.35] : ord.indexOf(k) < ord.indexOf(stopK ?? 99) ? ['muted', 0.15] : null), colLabels: CUES.map((c, k) => `${c} ${v.fix(VAL[k], 2)}`), highlight: ans != null ? [[ans, 0, 'accent']] : [] });
          [0, 1].forEach((a) => { const [cx, cy] = Tb.cellCenter(a, 0); TS.text(`city ${pair[a] + 1}${showP.value || ans != null ? `  (${num(pop[pair[a]])})` : ''}`, 0.01, cy, { size: 12.5, weight: ans === a ? 800 : 600, color: ans === a ? 'accent' : 'ink' }); void cx; });
          TS.text(stopK == null ? 'no cue discriminates: take-the-best guesses' : `take-the-best stops at “${CUES[stopK]}” and picks city ${pair[pick] + 1}${ans != null ? (pick === truth ? ' ✓' : ' ✗') : ''}`, 0.6, 0.96, { align: 'center', size: 12, weight: 700, color: 'green' });
          // curves
          const col = ['green', 'orange', 'purple'], nm = ['take-the-best', 'tallying', 'multiple regression'];
          for (let a = 0; a < 3; a++) { const pts = CURVE.map((c) => [c[0], c[a + 1]]); A.path(pts, { color: col[a], width: 2.4 }); A.dots(pts, { r: 3.5, color: col[a] }); }
          A.path(CURVE.map((c) => [c[0], c[4]]), { color: 'purple', width: 1.4, dash: [3, 3] });
        });
        v.readout(() => {
          const sm = CURVE[1], lg = CURVE[CURVE.length - 1];
          return `Realized cue validities ${VAL.map((x) => v.fix(x, 2)).join(', ')} (Table 1 targets 1.00 … .51). Trained on ${Math.round(sm[0] * 83)} cities: take-the-best **${pct(sm[1], 1)}**, tallying ${pct(sm[2], 1)}, regression **${pct(sm[3], 1)}** on held-out pairs (regression fits its own training pairs at ${pct(sm[4], 1)}). Trained on ${Math.round(lg[0] * 83)} cities: ${pct(lg[1], 1)}, ${pct(lg[2], 1)}, ${pct(lg[3], 1)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.19
    {
      num: '3.19', kind: 'Paper', name: 'A Behavioral Model of Rational Choice',
      paper: { authors: 'Herbert A. Simon', year: 1955, title: 'A Behavioral Model of Rational Choice', venue: 'Quarterly Journal of Economics 69 (1): 99–118', doi: '10.2307/1884852' },
      introduces: ['behav-3.1'],
      statement: String.raw`Simon argued that the "economic man" of classical theory, who knows all alternatives, their consequences and a complete utility ordering, and computes the best choice, is a poor model of any real decision maker. He proposed to replace global rationality with a kind of rational behaviour compatible with limited information and computing capacity: payoffs simplified to "satisfactory" or "unsatisfactory"; alternatives examined *sequentially* rather than given all at once; search stopped at the first satisfactory alternative; and an **aspiration level** that defines "satisfactory" and adjusts to experience, rising when satisfactory alternatives are easy to find and falling when they are not. His example was a person selling a house who does not know the distribution of offers. The paper is a programme, not an experiment; the term *satisficing* appeared in his 1956 follow-up.`,
      idea: String.raw`In 1955 economists modelled choice as maximization of expected utility (micro-13.2) and treated information and computation as free. Simon, trained in political science and studying organizations, observed that firms and administrators search until something good enough turns up. He showed that simple procedures with adaptive aspirations can approach the performance of optimal rules (behav-3.1) in stable environments, and adapt better when the environment changes. The paper founded **bounded rationality**, influenced organization theory, artificial intelligence and behavioural economics, and was cited in Simon's 1978 Nobel memorial prize; its descendants include search theory, the fast-and-frugal heuristics programme (behav-3.18) and models of rational inattention.`,
      caption: String.raw`Simon's house seller, simulated over 200 sales (seeded). Offers are uniform on a range that may shift halfway (toggle); waiting costs a fixed amount per week. The satisficer starts each sale with its aspiration, lowers it by the drift per unsuccessful week, and starts the next sale at what it last obtained plus a small step up. The optimizer computes the reservation price once from the original distribution. Left: the satisficer's aspiration over time (orange) against the optimal reservation price (green). Right: average net payoff and weeks searched before and after the shift. The comparison of computation needed is in the readout.`,
      deps: ['micro-13.2'], refs: [], tags: ['bounded rationality', 'history', 'search'],
      credit: 'Herbert Simon, 1955',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bounded_rationality' },
      viz(v) {
        const cS = v.slider('cost of waiting one week', 0.5, 8, 2, { step: 0.25 });
        const dS = v.slider('satisficer: aspiration drop per unsuccessful week', 0.5, 10, 3, { step: 0.25 });
        const shift = v.toggle('the market rises by 40 after sale 100', false);
        v.button('new run', () => { seed++; });
        let seed = 1;
        const A = v.stage({ x: [0, 200], y: [150, 300], axes: 'box', gutter: true, height: 310, weight: 1.4, xlabel: 'sale number', ylabel: 'price level (thousands)', title: 'aspiration level adapts; the computed rule does not' });
        const B = v.stage({ x: [0, 1], y: [0, 4.4], axes: false, height: 310, title: 'average net payoff and search time' });
        let st = {};
        v.render(() => {
          const c = cS.value, d = dS.value, r = v.rng(seed);
          const L0 = 150, H0 = 250, rOld = reservation(L0, H0, c);
          let asp = 240; const path = [], res = [];
          for (let t = 0; t < 200; t++) {
            const up = shift.value && t >= 100 ? 40 : 0, L = L0 + up, H = H0 + up;
            const offers = []; for (let w = 0; w < 400; w++) offers.push(L + (H - L) * r());
            // satisficer
            let a = asp, w = 0; path.push([t, a]);
            while (offers[w] < a && w < 399) { w++; a -= d; }
            const sNet = offers[w] - c * (w + 1);
            asp = offers[w] + d; // start the next sale a step above what this one obtained
            // optimizer (computed once for the original market)
            let wo = 0; while (offers[wo] < rOld && wo < 399) wo++;
            res.push({ t, sNet, sW: w + 1, oNet: offers[wo] - c * (wo + 1), oW: wo + 1, rNow: reservation(L, H, c) });
          }
          A.path(res.map((x) => [x.t, x.rNow]), { color: 'green', width: 1.4, dash: [5, 4] });
          A.hline(rOld, { color: 'green', width: 2.2 });
          A.path(path, { color: 'orange', width: 1.6 });
          A.text('optimizer’s computed r*', 2, rOld, { dy: 14, size: 11, weight: 700, color: 'green', plate: true });
          if (shift.value) { A.vline(100, GUIDE); A.text('market shift', 100, 296, { dx: 5, size: 11, color: 'muted' }); A.text('new optimal r*', 198, rOld + 40, { dy: -9, align: 'right', size: 11, weight: 700, color: 'green' }); }
          const avg = (arr, f) => arr.reduce((s, x) => s + f(x), 0) / arr.length, a1 = res.slice(0, 100), a2 = res.slice(100);
          const rows = [{ label: 'satisficer, sales 1–100', value: avg(a1, (x) => x.sNet), color: 'orange', note: `${v.fix(avg(a1, (x) => x.sNet), 1)} · ${v.fix(avg(a1, (x) => x.sW), 1)} wk` },
            { label: 'optimizer, sales 1–100', value: avg(a1, (x) => x.oNet), color: 'green', note: `${v.fix(avg(a1, (x) => x.oNet), 1)} · ${v.fix(avg(a1, (x) => x.oW), 1)} wk` },
            { label: 'satisficer, 101–200', value: avg(a2, (x) => x.sNet), color: 'orange', note: `${v.fix(avg(a2, (x) => x.sNet), 1)} · ${v.fix(avg(a2, (x) => x.sW), 1)} wk`, bold: true },
            { label: 'optimizer, 101–200', value: avg(a2, (x) => x.oNet), color: 'green', note: `${v.fix(avg(a2, (x) => x.oNet), 1)} · ${v.fix(avg(a2, (x) => x.oW), 1)} wk`, bold: true }];
          hbars(B, rows, { x0: 0.42, x1: 0.72, yTop: 4.3, rowH: 1.05, max: 300, size: 11 });
          st = { rOld, s1: avg(a1, (x) => x.sNet), o1: avg(a1, (x) => x.oNet), s2: avg(a2, (x) => x.sNet), o2: avg(a2, (x) => x.oNet), best: satisficeValue(L0, H0, c, rOld), looks: satisficeLooks(L0, H0, rOld) };
        });
        v.readout(() => {
          const { rOld, s1, o1, s2, o2 } = st; if (rOld == null) return '';
          return `Optimizer: needs the offer distribution and the cost, solves $c = E[(X-r)^+]$ once ($r^* = ${v.fix(rOld, 1)}$), then one comparison per offer. Satisficer: one comparison per offer and a running aspiration, no model of the market. Sales 1–100: satisficer ${v.fix(s1, 1)} vs optimizer ${v.fix(o1, 1)}; sales 101–200: ${v.fix(s2, 1)} vs ${v.fix(o2, 1)}${shift.value ? ' — after the market moves, the adaptive aspiration follows it while the stale computed rule sells too cheaply.' : '.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.20
    {
      num: '3.20', kind: 'Paper', name: 'Judgment under Uncertainty: Heuristics and Biases',
      paper: { authors: 'Amos Tversky and Daniel Kahneman', year: 1974, title: 'Judgment under Uncertainty: Heuristics and Biases', venue: 'Science 185 (4157): 1124–1131', doi: '10.1126/science.185.4157.1124' },
      introduces: ['behav-3.4'],
      statement: String.raw`Tversky and Kahneman argued that people assess probabilities and predict values with a few heuristics that reduce complex judgments to simpler operations, and that each produces systematic, predictable errors. **Representativeness** (judging by similarity) causes insensitivity to base rates, sample size and predictability, misconceptions of chance and regression. **Availability** (judging by ease of recall) causes biases from retrievability, imaginability and illusory correlation. **Adjustment and anchoring** (starting from a value and adjusting insufficiently) causes anchoring on arbitrary numbers, overestimation of conjunctive and underestimation of disjunctive events, and overly narrow probability distributions. Among the demonstrations: a wheel of fortune stopping at 10 or 65 led to median estimates of 25% and 45% for the share of African countries in the UN; high-school students given five seconds estimated $8\times7\times6\times5\times4\times3\times2\times1$ at a median of 2,250 and $1\times2\times\dots\times8$ at 512 (true value 40,320); and 53 of 95 students thought a small and a large hospital equally likely to record days with over 60% boys.`,
      idea: String.raw`Before 1974 the dominant view, from Edwards's studies of "conservative" Bayesian updating, was that people are roughly intuitive statisticians. This short paper in *Science* reframed judgment as heuristic and bias-prone, with errors that reveal the underlying processes as visual illusions reveal perception. It introduced anchoring and adjustment (behav-3.4), consolidated representativeness (behav-3.6) and availability (behav-3.5), and became one of the most cited papers in the social sciences. Critics (Gigerenzer and colleagues, behav-3.18) answered that frequency formats and ecologically valid tasks make many biases shrink; replication projects found anchoring robust and the conjunction and base-rate effects sensitive to presentation and incentives.`,
      caption: String.raw`The paper's five-second multiplication. Pick the order and give your own five-second estimate on the logarithmic slider, before turning on the data. The bars show the partial products after each step of left-to-right multiplication: the descending order reaches large numbers quickly. If people compute $k$ steps and then adjust from that partial product toward the answer only part of the way (a share $\lambda$ of the remaining distance on the log scale), the model's estimates are the coloured markers; the paper's medians are gold and the true value 40,320 is green. The table below lists the paper's other numbers beside what later work found.`,
      deps: ['behav-3.5', 'behav-3.6'], refs: [], tags: ['heuristics', 'history', 'anchoring'],
      credit: 'Tversky & Kahneman, 1974',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heuristics_in_judgment_and_decision-making' },
      viz(v) {
        const ord = v.select('order on the blackboard', [{ value: 'desc', label: '8 × 7 × 6 × … × 1' }, { value: 'asc', label: '1 × 2 × 3 × … × 8' }], 'desc');
        const est = v.slider('your 5-second estimate', 10, 1e6, 1000, { log: true, fmt: (x) => num(x) });
        const show = v.toggle('show the paper’s medians', false);
        const kS = v.slider('model: steps computed before extrapolating k', 1, 5, 3, { int: true });
        const gS = v.slider('model: share λ of the remaining (log) distance covered by the adjustment', 0, 1, 0.45, { step: 0.01 });
        const P = v.stage({ x: [0.3, 10.3], y: [1, 2e5], ylog: true, axes: 'box', gutter: true, height: 320, full: true, xlabel: 'multiplication step', ylabel: 'partial product (log)', title: 'partial products and five-second estimates' });
        const T = v.stage({ x: [0, 1], y: [0, 5], axes: false, height: 230, full: true, title: 'the paper’s numbers, then and now' });
        v.render(() => {
          const seqs = { desc: [8, 7, 6, 5, 4, 3, 2, 1], asc: [1, 2, 3, 4, 5, 6, 7, 8] }, k = kS.value, g = gS.value;
          const partial = (s) => { const out = []; let p = 1; for (const f of s) { p *= f; out.push(p); } return out; };
          const model = (s) => Math.exp(Math.log(partial(s)[k - 1]) + g * (Math.log(40320) - Math.log(partial(s)[k - 1])));
          for (const key of ['desc', 'asc']) {
            const pp = partial(seqs[key]), cur = key === ord.value, off = key === 'desc' ? -0.18 : 0.18, col = key === 'desc' ? 'blue' : 'orange';
            pp.forEach((p, i) => P.rect(i + 1 + off - 0.16, 1, i + 1 + off + 0.16, p, { fill: col, fillAlpha: cur ? 0.7 : 0.25, color: col, width: cur ? 1.5 : 0.8 }));
            P.dot(8.85, model(seqs[key]), { r: 6, color: col }); P.text(`model ${num(Math.round(model(seqs[key])))}`, 8.85, model(seqs[key]), { dx: 10, size: 10.5, weight: 700, color: col });
          }
          P.vline(k + 0.5, GUIDE); P.text(`adjust after step ${k}`, k + 0.5, 1.2e5, { dx: 5, size: 10.5, color: 'muted' });
          P.hline(40320, { color: 'green', width: 2 }); P.text('true 40,320', 0.35, 40320, { dx: 4, dy: -9, size: 11, weight: 700, color: 'green' });
          if (show.value) { for (const [m, lab] of [[2250, 'median 2,250 (descending)'], [512, 'median 512 (ascending)']]) { P.hline(m, { color: 'gold', width: 1.6, dash: [6, 4] }); P.text(lab, 0.35, m, { dx: 4, dy: -9, size: 11, weight: 700, color: 'gold' }); } }
          P.hline(est.value, { color: 'red', width: 1.6 }); P.text(`you: ${num(Math.round(est.value))}`, 0.35, est.value, { dx: 4, dy: 10, size: 11, weight: 700, color: 'red' });
          // then and now
          const rows = [['anchoring (wheel 10 / 65)', 'median 25% vs 45%: index 0.36', 'replicated by Many Labs (2014)'],
            ['5-second product', 'medians 2,250 and 512 vs 40,320', 'the canonical anchoring-by-partial-computation result'],
            ['hospital problem', '53 of 95: “about the same”', 'exact: 55 vs 25 such days a year'],
            ['engineers & lawyers', 'same judgments at 70% and 30%', 'Bayes requires odds 5.44× higher'],
            ['98% intervals', 'missed ≈ 30% of the time', 'overprecision remains the most robust overconfidence']];
          T.text('finding', 0.02, 4.7, { size: 11.5, weight: 700, color: 'muted' }); T.text('1974', 0.3, 4.7, { size: 11.5, weight: 700, color: 'muted' }); T.text('check / today', 0.62, 4.7, { size: 11.5, weight: 700, color: 'muted' });
          rows.forEach((r, i) => { const y = 3.95 - i * 0.85; T.line(0.01, y + 0.42, 0.99, y + 0.42, { color: 'grid', width: 1 }); T.text(r[0], 0.02, y, { size: 11.5, weight: 600 }); T.text(r[1], 0.3, y, { size: 11.5 }); T.text(r[2], 0.62, y, { size: 11.5, color: 'teal' }); });
        });
        v.legend([['blue', '8 × 7 × … (descending)'], ['orange', '1 × 2 × … (ascending)'], ['gold', 'paper’s medians'], ['green', 'true value'], ['red', 'your estimate']]);
        v.readout(() => {
          const k = kS.value, g = gS.value, part = (s) => { let p = 1; for (let i = 0; i < k; i++) p *= s[i]; return p; }, m = (s) => Math.exp(Math.log(part(s)) + g * (Math.log(40320) - Math.log(part(s))));
          const L = Math.log, pd = part([8, 7, 6, 5, 4, 3, 2, 1]), pa = part([1, 2, 3, 4, 5, 6, 7, 8]), lamD = (L(2250) - L(pd)) / (L(40320) - L(pd)), lamA = (L(512) - L(pa)) / (L(40320) - L(pa));
          const md = m([8, 7, 6, 5, 4, 3, 2, 1]), ma = m([1, 2, 3, 4, 5, 6, 7, 8]);
          return `Your estimate ${num(Math.round(est.value))} is ${est.value < 40320 ? v.fix(40320 / est.value, 1) + '× below' : v.fix(est.value / 40320, 1) + '× above'} the true value. Model ($k = ${k}$ steps, then cover a share $\\lambda = ${v.fix(g, 2)}$ of the remaining log-distance): descending ${num(Math.round(md))}, ascending ${num(Math.round(ma))}; the paper's medians 2,250 and 512 correspond to $\\lambda = ${v.fix(lamD, 2)}$ and $${v.fix(lamA, 2)}$ at this $k$. With $\\lambda < 1$ both orders are underestimated, and the larger early partial products of the descending order leave its estimate higher.`;
        });
      },
    },
  ],
};
