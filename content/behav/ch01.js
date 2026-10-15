// Behavioural Economics — Chapter 1: Expected utility and its paradoxes (items 1.1–1.8; 1.9–1.16 in ch01-b.js)
//
// Sources checked: D. Bernoulli 1738, Sommer's translation (Econometrica 22, 1954): the game pays 1, 2, 4, 8, … ducats (§17),
// Nicolaus Bernoulli's "would sell his chance … for twenty ducats", the owner's value worth "approximately three ducats" with
// a fortune of 10, four with 100 and six with 1,000 (§19; exact values 3.04, 4.39, 5.97), Menger's footnote formula for it.
// M. Rabin 2000 (Econometrica 68: 1281–1292): Table I (rows L = $400 … $20,000, columns g = $101, $105, $110, $125), the
// corollary's bounds U(w) − U(w − 2kl) ≥ 2Σ_{i=1}^{k}(g/l)^{i−1} r and U(w + mg) − U(w) ≤ Σ_{i=0}^{m−1}(l/g)^i r (r = U(w) − U(w − l));
// computing them reproduces all 40 entries of Table I (entries rounded down to $10), and Table III's CARA coefficients
// (.0000990, .0004760, .0009084, .0019917). J. W. Pratt 1964 (Econometrica 32: 122–136) for the risk premium.
import { clamp, money, usd, big, bernValue, bernPrice, spBanker, makePref, intoTri, indiffThrough, drawIndiff, drawTriangle } from './ch01.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [4, 4] };
const lse = (arr) => { const m = Math.max(...arr); if (!isFinite(m)) return m; let s = 0; for (const a of arr) s += Math.exp(a - m); return m + Math.log(s); };

/** Certainty equivalent of the game stopped after N tosses (no heads by then: no payout), for utility 'lin' | 'sqrt' | 'log'.
 *  game 'sp': toss k pays 2^{k−1}; 'menger': toss k pays w(e^{2^{k−1}} − 1). Computed in logs, so astronomically large values stay finite. */
function ceStopped(util, game, w, N) {
  const L = (k) => (game === 'sp' ? Math.log(w + Math.pow(2, k - 1)) : Math.log(w) + Math.pow(2, k - 1)); // ln(w + x_k)
  if (util === 'lin') {
    if (game === 'sp') return N / 2;
    const t = []; for (let k = 1; k <= N; k++) t.push(-k * Math.LN2 + L(k) + Math.log1p(-w * Math.exp(-L(k))));
    return Math.exp(lse(t));
  }
  if (util === 'log') { let e = Math.pow(2, -N) * Math.log(w); for (let k = 1; k <= N; k++) e += Math.pow(2, -k) * L(k); return Math.exp(e) - w; }
  const t = [-N * Math.LN2 + 0.5 * Math.log(w)]; for (let k = 1; k <= N; k++) t.push(-k * Math.LN2 + 0.5 * L(k));
  return Math.exp(2 * lse(t)) - w;
}
/** Cramer's square root: certainty equivalent of the full game. */
const sqrtValue = (w) => { let s = 0; for (let k = 1; k <= 160; k++) s += Math.pow(2, -k) * Math.sqrt(w + Math.pow(2, k - 1)); return s * s - w; };

/** Bernstein (Bézier) graph through control values c at equally spaced x on [0, X]. */
function bern(c, x, X) {
  const t = clamp(x / X, 0, 1), n = c.length - 1; let s = 0, b = 1;
  for (let i = 0; i <= n; i++) { b = i === 0 ? 1 : (b * (n - i + 1)) / i; s += c[i] * b * Math.pow(t, i) * Math.pow(1 - t, n - i); }
  return s;
}

/** Utility families for 1.5–1.7. */
function crra(g) {
  const one = Math.abs(g - 1) < 1e-9;
  return {
    u: (x) => (one ? Math.log(x) : (Math.pow(x, 1 - g) - 1) / (1 - g)), up: (x) => Math.pow(x, -g), A: (x) => g / x,
    ce: (w, h) => (one ? Math.sqrt((w - h) * (w + h)) : Math.pow(0.5 * Math.pow(w - h, 1 - g) + 0.5 * Math.pow(w + h, 1 - g), 1 / (1 - g))),
    inv: (y) => (one ? Math.exp(y) : Math.pow(1 + (1 - g) * y, 1 / (1 - g))),
  };
}
function cara(a) {
  return {
    u: (x) => (1 - Math.exp(-a * x)) / a, up: (x) => Math.exp(-a * x), A: () => a,
    ce: (w, h) => w - (Math.abs(a * h) < 1e-6 ? (a * h * h) / 2 : (a * h + Math.log1p(Math.exp(-2 * a * h)) - Math.LN2) / a),
    inv: (y) => -Math.log(1 - a * y) / a,
  };
}

/** Rabin's corollary (all wealth levels): the largest G such that rejecting 50–50 lose l / gain g implies rejecting lose L / gain G. */
function rabinLoss(l, g, L) { const k = Math.floor(L / (2 * l) + 1e-9); let s = 0; for (let i = 1; i <= k; i++) s += 2 * Math.pow(g / l, i - 1); return s; }
function rabinG(l, g, L) {
  const LB = rabinLoss(l, g, L), r = l / g;
  if (1 / (1 - r) <= LB) return Infinity;
  return Math.floor(Math.log(1 - LB * (1 - r)) / Math.log(r) + 1e-12) * g;
}
const RABIN_L = [400, 600, 800, 1000, 2000, 4000, 6000, 8000, 10000, 20000], RABIN_g = [101, 105, 110, 125];
const RABIN_TABLE = [[400, 420, 550, 1250], [600, 730, 990, Infinity], [800, 1050, 2090, Infinity], [1010, 1570, Infinity, Infinity], [2320, Infinity, Infinity, Infinity],
  [5750, Infinity, Infinity, Infinity], [11810, Infinity, Infinity, Infinity], [34940, Infinity, Infinity, Infinity], [Infinity, Infinity, Infinity, Infinity], [Infinity, Infinity, Infinity, Infinity]];

export default {
  collection: 'behav',
  chapter: 1,
  title: 'Expected utility and its paradoxes',
  summary: String.raw`Expected value fails on the St Petersburg game, and Bernoulli's answer, to maximize the expectation of a concave utility, became von Neumann and Morgenstern's theory of rational choice under risk. Concavity is risk aversion, measured locally by the Arrow–Pratt coefficient, and two families, constant absolute and constant relative risk aversion, carry most applications. The theory's cracks are systematic: its independence axiom is violated in the Allais and common-ratio patterns, unknown probabilities are treated differently from known ones (Ellsberg), and, as Rabin showed, modest risk aversion over small stakes implies absurd risk aversion over large ones.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Paradox', name: 'The St Petersburg paradox',
      statement: String.raw`Peter tosses a fair coin until it first lands heads. If that happens on toss $k$ he pays Paul $2^{k-1}$ ducats: 1, 2, 4, 8, … The game ends with probability one and every payout is finite, yet its expected value diverges,
$$E[X]=\sum_{k\ge 1}2^{-k}\,2^{k-1}=\tfrac12+\tfrac12+\tfrac12+\cdots=\infty .$$
A player who values a gamble by its expected payout should therefore pay any finite price to play, while, as Nicolaus Bernoulli wrote to his cousin Daniel, "any fairly reasonable man would sell his chance, with great pleasure, for twenty ducats". Because the mean is infinite, the law of large numbers gives no fair price: the average payout of $n$ independent games keeps drifting upward, roughly like $\tfrac12\log_2 n$ (in Feller's form, $S_n/(n\log_2 n)\to\tfrac12$ in probability). If the banker can pay at most $B$ ducats, the expected value is finite and small, $\tfrac12L+B\,2^{-L}$ with $L=\lfloor\log_2B\rfloor+1$: about 11 ducats against a bank of a million ducats, 16 against a billion.`,
      idea: String.raw`The expected value is a series (pma-3.21) whose terms do not shrink: every possible length of game contributes exactly half a ducat, because a payout twice as large comes with half the probability. The large payouts are so rare that a finite run almost never sees them. In $n$ games the longest run of tails is about $\log_2 n$, and each of the roughly $\log_2 n$ game lengths seen so far contributes about half a ducat, so sample averages understate the mean and creep up only logarithmically. A banker with a finite fortune can honour only the first $\log_2B$ of the half-ducats. The paradox is that expected value (micro-13.1), the natural rule for fair prices, gives an answer nobody accepts; Bernoulli's resolution (behav-1.2) changes the scale on which the outcomes are averaged.`,
      caption: String.raw`First set the price you would pay to play once. Then play 1, 100 or 10,000 games at a time (**new run** reseeds); the coin row shows the last game. Left: the average payout per game split by the toss on which heads came. Theory says every toss contributes half a ducat (dashed line), forever, and the bars match it only up to about $\log_2 n$, beyond which no game has lasted that long yet. Right: the running average, on a logarithmic scale of games, creeps up along $\tfrac12\log_2 n$ and never settles; your price is the orange line, and the marker estimates when the average would reach it. Switch on a finite banker and the expected value collapses to a few ducats.`,
      deps: ['micro-13.1', 'pma-3.21'], refs: ['Kahneman ch. 25', 'W&K ch. 5'], tags: ['risk', 'expected value', 'paradoxes'],
      see: ['prob-2.2.16'],
      credit: 'Nicolaus Bernoulli, 1713',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/St._Petersburg_paradox' },
      viz(v) {
        const CAP = 3e6;
        const price = v.slider('your price to play once (ducats)', 1, 40, 8, { step: 1 });
        let seed = 1, rng = v.rng(seed), K = new Uint8Array(1 << 15), n = 0, cache = null;
        const play = (m) => {
          m = Math.min(m, CAP - n); if (m <= 0) return;
          if (n + m > K.length) { let L = K.length; while (L < n + m) L *= 2; const K2 = new Uint8Array(L); K2.set(K.subarray(0, n)); K = K2; }
          for (let i = 0; i < m; i++) { let k = 1; while (rng() < 0.5 && k < 250) k++; K[n++] = k; }
          cache = null;
        };
        play(2000);
        v.button('play 1 game', () => play(1));
        v.button('play 100', () => play(100));
        v.button('play 10,000', () => play(10000));
        v.button('new run', () => { seed++; rng = v.rng(seed); n = 0; play(2000); });
        const fin = v.toggle('the banker’s fortune is finite', false);
        const Bs = v.slider('banker’s fortune $B$ (ducats)', 100, 1e12, 1e6, { log: true, fmt: (x) => big(x, 2) });
        const coin = v.stage({ x: [0, 100], y: [0, 1], axes: false, height: 58, full: true });
        const bars = v.stage({ x: [-1.4, 26.5], y: [-0.1, 1.25], axes: 'box', height: 310, xlabel: 'toss k on which heads first came', ylabel: 'ducats per game', title: 'average payout by toss k (theory: ½ from every k)' });
        const run = v.stage({ x: [0.35, 1e4], xlog: true, y: [0, 12], axes: 'box', height: 310, weight: 1.25, xlabel: 'games played n', ylabel: 'average payout (ducats)', title: 'running average payout' });
        v.legend([['gold', 'what your games paid'], ['muted', 'theory: ½ per toss / ½ log₂ n', { dash: true }], ['orange', 'your price'], ['green', 'expected value, finite banker', { dash: true }]]);
        const stats = () => {
          const B = fin.value ? Bs.value : Infinity, key = `${n}|${B}`;
          if (cache && cache.key === key) return cache;
          const cnt = new Float64Array(64); let sum = 0, mark = 1, top = 0, tail = 0; const pts = [];
          for (let i = 0; i < n; i++) {
            const k = K[i]; cnt[Math.min(k, 63)]++; sum += Math.min(Math.pow(2, k - 1), B);
            if (i + 1 >= mark) { const a = sum / (i + 1); pts.push([i + 1, a]); top = Math.max(top, a); if (i + 1 >= Math.min(64, n)) tail = Math.max(tail, a); mark = Math.max(mark + 1, mark * 1.012); }
          }
          if (n && pts[pts.length - 1][0] !== n) pts.push([n, sum / n]);
          let kmax = 0; for (let k = 63; k > 0; k--) if (cnt[k]) { kmax = k; break; }
          cache = { key, B, cnt, avg: n ? sum / n : 0, pts, top: Math.max(top, n ? sum / n : 0), tail: Math.max(tail, n ? sum / n : 0), kmax };
          return cache;
        };
        let st = {};
        v.render(() => {
          Bs.el.hidden = !fin.value;
          const S = stats(), p = price.value, B = S.B, last = n ? K[n - 1] : 1;
          // ---- the last game as a row of coins
          const X0 = coin.X(0) + 86, R = 10.5, gap = 25, room = Math.floor((coin.X(100) - X0 - 300) / gap);
          coin.text('last game:', 0, 0.5, { dx: 4, size: 12.5, weight: 600, color: 'muted' });
          const shown = Math.min(last, room), skip = last - shown;
          for (let i = 0; i < shown; i++) {
            const heads = i === shown - 1, [x] = coin.inv(X0 + i * gap + (skip && i > 0 ? 22 : 0), 0);
            coin.dot(x, 0.5, { r: R, color: heads ? 'gold' : 'muted', alpha: heads ? 1 : 0.35 });
            coin.text(heads ? 'H' : 'T', x, 0.5, { align: 'center', size: 11.5, weight: 700, color: heads ? 'ink' : 'ink', halo: false });
            if (skip && i === 0) coin.text(`… ${skip} more tails …`, coin.inv(X0 + gap + 2, 0)[0], 0.5, { size: 11, color: 'muted' });
          }
          const pay = Math.min(Math.pow(2, last - 1), B);
          coin.text(`heads on toss ${last} → Paul wins 2${String(last - 1).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')} = ${money(pay)} ducat${pay === 1 ? '' : 's'}${pay < Math.pow(2, last - 1) ? ' (all the bank has)' : ''}`,
            coin.inv(X0 + shown * gap + (skip ? 22 : 0) + 8, 0)[0], 0.5, { size: 12.5, weight: 600 });
          // ---- contributions by toss
          const lg = Math.log2(Math.max(n, 1));
          bars.vband(0.5, Math.min(lg + 0.5, 26.5), { color: 'green', alpha: 0.05 });
          for (let k = 1; k <= 26; k++) {
            const payk = Math.min(Math.pow(2, k - 1), B), e = Math.pow(2, -k) * payk, c = n ? (S.cnt[k] * payk) / n : 0;
            if (c > 0) {
              const h = Math.min(c, 1.2);
              bars.rect(k - 0.36, 0, k + 0.36, h, { fill: 'gold', fillAlpha: 0.75, color: 'gold', width: 1 });
              if (c > 1.2) bars.text(v.fix(c, 1), k, 1.2, { dy: -8, align: 'center', size: 10.5, weight: 700, color: 'gold' });
            }
            bars.line(k - 0.48, e, k + 0.48, e, { color: 'muted', width: 1.6, dash: [4, 3] });
          }
          if (lg < 25) { bars.vline(lg + 0.5, GUIDE); bars.text(`k ≈ log₂ n = ${v.fix(lg, 1)}`, lg + 0.5, 1.12, { dx: 5, size: 11, color: 'muted' }); }
          bars.setTitle(fin.value ? 'average payout by toss k (theory: ½ until the bank runs out)' : 'average payout by toss k (theory: ½ from every k)');
          // ---- running average
          const xmax = Math.max(1e4, Math.pow(10, Math.ceil(Math.log10(Math.max(n, 2)) + 1e-9)));
          const ev = fin.value ? spBanker(B).ev : Infinity;
          const ymax = Math.ceil(Math.max(p + 2, 0.5 * Math.log2(xmax) + 3, S.tail * 1.15, isFinite(ev) ? ev + 1.5 : 0));
          run.setView([0.35, xmax], [0, ymax]);
          run.fn((x) => 0.5 * Math.log2(x), { color: 'muted', width: 1.4, dash: [6, 4], domain: [1, xmax] });
          const xl = Math.pow(xmax, 0.72);
          run.text('½ log₂ n', xl, 0.5 * Math.log2(xl), { dy: 12, dx: 8, align: 'left', size: 11, color: 'muted', weight: 600 });
          run.hline(p, { color: 'orange', width: 2 });
          run.text(`your price: ${p}`, 0.35, p, { dx: 30, dy: -9, size: 11.5, weight: 600, color: 'orange' });
          const nStar = Math.pow(4, p);
          if (nStar < xmax) { run.line(nStar, 0, nStar, p, { color: 'orange', width: 1, dash: [3, 3] }); run.dot(nStar, p, { r: 4, color: 'orange' }); }
          else run.text(`break-even near 4^${p} ≈ ${big(nStar, 2)} games →`, xmax, p, { dx: -4, dy: -9, align: 'right', size: 11, color: 'orange', weight: 600 });
          if (isFinite(ev)) { run.hline(ev, { color: 'green', width: 1.8, dash: [7, 4] }); run.text(`expected value ${v.fix(ev, 2)}`, xmax, ev, { dx: -4, dy: ev > p ? -9 : 11, align: 'right', size: 11.5, weight: 600, color: 'green' }); }
          if (S.pts.length) { run.clip(() => run.path(S.pts, { color: 'gold', width: 2.2 })); run.dot(n, S.avg, { r: 4.5, color: 'gold' }); }
          st = { S, p, ev, nStar, lg, off: S.top > ymax };
        });
        v.readout(() => {
          const { S, p, ev, nStar, off } = st; if (!S) return '';
          const net = S.avg - p;
          return `**${money(n)} games** played: average payout **${v.fix(S.avg, 2)}** ducats against $\\tfrac12\\log_2 n = ${v.fix(0.5 * Math.log2(Math.max(n, 1)), 2)}$; longest game ${S.kmax} tosses${off ? ` (one early long game pushed the average up to ${v.fix(S.top, 0)}, off the top of the chart)` : ''}. At your price of ${p} you are ${net >= 0 ? 'ahead' : 'behind'} by ${v.fix(Math.abs(net), 2)} per game. ` +
            (isFinite(ev) ? `With a banker worth ${big(S.B, 3)} ducats only the first ${spBanker(S.B).L} payouts can be paid in full, and the expected value is just **${v.fix(ev, 2)}** ducats.` : `Expected value: $\\tfrac12+\\tfrac12+\\cdots=\\infty$, so expected-value reasoning says pay any price.`) +
            ` A typical run's average reaches ${p} only after about $4^{${p}}\\approx$ ${big(nStar, 2)} games.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Model', name: 'Bernoulli’s logarithmic utility',
      statement: String.raw`Bernoulli's hypothesis: the utility of a small gain $dx$ is proportional to the gain and inversely proportional to the wealth $w$ already held, $du=b\,dx/w$, so utility is logarithmic, $u(w)=b\ln(w/\alpha)$, and a risky prospect is worth the sure amount whose utility equals the prospect's expected utility (its **certainty equivalent**). Equal *proportional* gains are worth the same to rich and poor. For the St Petersburg game (behav-1.1) played with wealth $w$, the expected utility gain $\sum_k2^{-k}\ln\!\big(1+2^{k-1}/w\big)$ is finite, and the game is worth
$$D(w)=\prod_{k\ge1}(w+2^{k-1})^{2^{-k}}-w$$
to its owner: exactly 2 ducats at $w=0$, about 3.04 at $w=10$, 4.39 at $w=100$ and 5.97 at $w=1000$, rising like $\tfrac12\log_2w$; a buyer should pay slightly less.`,
      scope: String.raw`A concave utility defuses this game but not every game: for any unbounded utility the payouts can be raised (Menger's super-Petersburg game, here $w(e^{2^{k-1}}-1)$ on toss $k$) until the expected utility is infinite again. Only a bounded utility rules out every such paradox. As a description of behaviour, utility of total wealth is the target of chapter 2 (gains and losses relative to a reference point).`,
      idea: String.raw`While the prize $2^{k-1}$ is small next to $w$, $\ln(1+x/w)\approx x/w$, so toss $k$ still contributes about half a ducat's worth. Once the prize exceeds the player's wealth its utility grows only like $(k-1)\ln2$ while its probability keeps halving, so the contributions fall geometrically and the series converges. Roughly the first $\log_2w$ tosses count, which is why the certainty equivalent grows like $\tfrac12\log_2w$, the same logarithm that governed the running average in behav-1.1. The exponential function (pma-8.6) turns the expected logarithm into Menger's product formula for $D$. Cramer's square root (1728) does the same job; the logarithm returns in finance as the growth-optimal Kelly criterion.`,
      caption: String.raw`Pick a utility and your wealth. Left: the game stopped after $N$ tosses (no heads by then, no payout). Its expected payout $N/2$ (red) grows without bound, while the certainty equivalents under Cramer's square root (purple) and Bernoulli's logarithm (blue) level off; the selected utility is drawn thick. Right: the full game's certainty equivalent against wealth, with Bernoulli's own "about 3, 4 and 6 ducats" at fortunes 10, 100 and 1,000 as gold rings. Switch to **Menger's super-game**, whose payouts are raised so that every toss adds the same expected log-utility, and the logarithm's certainty equivalent grows without bound too (the left axis turns logarithmic).`,
      deps: ['behav-1.1', 'pma-8.6'], refs: ['Kahneman ch. 25'], tags: ['utility', 'risk', 'expected utility'],
      see: ['micro-4.9', 'fin-11.3', 'phil-5.8'],
      credit: 'Daniel Bernoulli, 1738 (Gabriel Cramer, 1728)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/St._Petersburg_paradox' },
      viz(v) {
        const U = v.select('utility of wealth', [{ value: 'lin', label: 'money (linear)' }, { value: 'sqrt', label: '$\\sqrt{w}$ (Cramer)' }, { value: 'log', label: '$\\ln w$ (Bernoulli)' }], 'log');
        const G = v.select('game', [{ value: 'sp', label: 'St Petersburg' }, { value: 'menger', label: 'Menger’s super-game' }], 'sp');
        const W = v.slider('your wealth $w$ (ducats)', 1, 1e6, 100, { log: true, fmt: (x) => money(x) });
        const A = v.stage({ x: [-2.5, 40.5], y: [0, 22], axes: 'box', height: 320, xlabel: 'tosses allowed N', ylabel: 'ducats', title: 'the game stopped after N tosses' });
        const B = v.stage({ x: [0.3, 1e6], xlog: true, y: [-1.3, 14], axes: 'box', height: 320, xlabel: 'wealth w (ducats)', ylabel: 'certainty equivalent (ducats)', title: 'what the full game is worth' });
        const grid = Array.from({ length: 161 }, (_, i) => Math.pow(10, (6 * i) / 160));
        const curves = { D: grid.map((w) => [w, bernValue(w)]), P: grid.map((w) => [w, bernPrice(w)]), S: grid.map((w) => [w, sqrtValue(w)]) };
        const COL = { lin: 'red', sqrt: 'purple', log: 'blue' }, NAME = { lin: 'money', sqrt: '√w', log: 'ln w' };
        v.legend([['red', 'money: expected payout'], ['purple', '√w (Cramer)'], ['blue', 'ln w (Bernoulli)'], ['blue', 'ln w, buyer’s price', { dash: true }], ['gold', 'Bernoulli’s reckoning', { dot: true }]]);
        let st = {};
        v.render(() => {
          const w = W.value, g = G.value, u = U.value, NM = 40;
          if (g === 'sp') { A.setScale({ ylog: false }); A.setView([-2.5, NM + 0.5], [-1, 22]); A.setLabels(undefined, 'ducats'); }
          else { A.setScale({ ylog: true }); A.setView([-2.5, NM + 0.5], [1, 1e16]); A.setLabels(undefined, 'ducats (log scale)'); }
          const lines = {};
          for (const k of ['lin', 'sqrt', 'log']) {
            const pts = [];
            for (let N = 1; N <= NM; N++) { let c = ceStopped(k, g, w, N); if (!isFinite(c) || c > 1e18) c = 1e18; pts.push([N, Math.max(c, g === 'sp' ? 0 : 1)]); }
            lines[k] = pts;
          }
          A.clip(() => {
            for (const k of ['lin', 'sqrt', 'log']) {
              const sel = k === u;
              A.path(lines[k], { color: COL[k], width: sel ? 3 : 1.4, alpha: sel ? 1 : 0.55, dash: k === 'lin' ? [7, 4] : undefined });
              if (sel) A.dots(lines[k], { r: 2.6, color: COL[k] });
            }
          });
          if (g === 'sp') {
            const lim = u === 'log' ? bernValue(w) : u === 'sqrt' ? sqrtValue(w) : Infinity;
            if (isFinite(lim) && lim < 21.5) { A.hline(lim, { color: COL[u], width: 1, dash: [3, 3] }); A.text(`limit ${v.fix(lim, 2)}`, NM, lim, { dx: -4, dy: 12, align: 'right', size: 11.5, color: COL[u], weight: 600 }); }
            A.text('expected payout N/2 → ∞', 23, 8.6, { size: 11.5, color: 'red', weight: 600 });
          } else A.text('every toss adds ½ to E[ln]: no limit', 40, 3e14, { align: 'right', size: 11.5, color: 'blue', weight: 600 });
          // ---- right panel: certainty equivalent against wealth
          const off = g === 'menger';
          B.path(curves.S, { color: 'purple', width: u === 'sqrt' ? 3 : 1.6, alpha: off ? 0.25 : 1 });
          B.path(curves.D, { color: 'blue', width: u === 'log' ? 3 : 1.6, alpha: off ? 0.25 : 1 });
          B.path(curves.P, { color: 'blue', width: 1.4, dash: [6, 4], alpha: off ? 0.25 : 0.9 });
          for (const [a, val] of [[10, 3], [100, 4], [1000, 6]]) { B.dot(a, val, { r: 6, hollow: true, color: 'gold', width: 2.2 }); B.text(`≈${val}`, a, val, { dx: -9, dy: -12, size: 11.5, weight: 700, color: 'gold', align: 'right' }); }
          B.vline(w, GUIDE);
          const dw = u === 'log' ? bernValue(w) : u === 'sqrt' ? sqrtValue(w) : NaN;
          if (!off && isFinite(dw)) B.dot(w, dw, { r: 5, color: COL[u] });
          if (!off && u === 'lin') B.text('money: ∞ at every wealth', 1e6, 12.6, { align: 'right', dx: -6, size: 12, weight: 700, color: 'red' });
          if (off) B.text('Menger’s game: ∞ for ln, √ and money', 1e3, 9, { align: 'center', size: 13, weight: 700, color: 'red', plate: true });
          st = { w, g, u, D: bernValue(w), P: bernPrice(w), S: sqrtValue(w), c40: lines[u][NM - 1][1] };
        });
        v.readout(() => {
          const { w, g, u, D, P, S, c40 } = st; if (!st.w) return '';
          if (g === 'menger') return `Menger's game pays $w\\,(e^{2^{k-1}}-1)$ if heads comes on toss $k$, so each toss adds exactly $\\tfrac12$ to the expected log-utility: stopped after $N$ tosses, $\\ln(1+c_N/w)=N/2$, i.e. $c_N = w(e^{N/2}-1)$, which is ${big(w * Math.expm1(20), 3)} ducats at $N = 40$ and unbounded as $N\\to\\infty$. A concave but unbounded utility only moves the paradox; a bounded utility is needed to stop it everywhere.`;
          return `Wealth $w = ${money(w)}$. Under **ln** the game is worth $D(w) = ${v.fix(D, 2)}$ ducats to its owner and a buyer should pay at most ${v.fix(P, 2)}; under **√** ${v.fix(S, 2)}; in money, $\\infty$. Stopped after 40 tosses, the expected payout is 20 ducats and the ${NAME[u]} certainty equivalent ${v.fix(c40, 2)}. Bernoulli's reckoning, "about 3, 4 and 6 ducats" at fortunes 10, 100 and 1,000; exact: ${v.fix(bernValue(10), 2)}, ${v.fix(bernValue(100), 2)}, ${v.fix(bernValue(1000), 2)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Definition', name: 'The von Neumann–Morgenstern axioms',
      statement: String.raw`A **lottery** over prizes $x_1<x_2<\dots<x_n$ is a probability vector $p=(p_1,\dots,p_n)$; the **mixture** $\alpha p+(1-\alpha)q$ is the compound lottery that plays $p$ with probability $\alpha$ and $q$ otherwise. A preference $\succsim$ on lotteries satisfies the **von Neumann–Morgenstern axioms** if it is
(a) **complete** and **transitive** (a weak order, micro-4.3);
(b) **continuous**: whenever $p\succ q\succ r$ there are $\alpha,\beta\in(0,1)$ with $\alpha p+(1-\alpha)r\succ q\succ\beta p+(1-\beta)r$;
(c) **independent**: for all lotteries $p,q,r$ and every $\alpha\in(0,1]$, $p\succsim q\iff\alpha p+(1-\alpha)r\succsim\alpha q+(1-\alpha)r$.

These hold exactly when $\succsim$ ranks lotteries by **expected utility** $\sum_ip_iu(x_i)$ (the vNM theorem, micro-13.2), with $u$ unique up to $a+bu$, $b>0$: utility becomes **cardinal**, where in consumer theory it was only ordinal (micro-4.7). With three prizes a lottery is a point $(p_1,p_3)$ of the Marschak–Machina triangle, and the axioms say exactly that the indifference curves are **parallel straight lines** of slope $(u_2-u_1)/(u_3-u_2)$; steeper lines mean more risk aversion.`,
      idea: String.raw`Independence is the axiom with teeth. Mixing two lotteries with the same third lottery $r$ shrinks the segment from $p$ to $q$ toward $r$ by the factor $\alpha$ without turning it, so if indifference lines are parallel the two mixtures stand in the same relation as $p$ and $q$. Conversely, independence forces indifference curves to be straight (mix a lottery with an equivalent one) and parallel (slide a pair of equivalent lotteries toward any other point). Continuity rules out lexicographic tastes and supplies the utility numbers: $u(x_2)$ is the probability $q$ at which $x_2$ for sure is matched by a $q$ chance of $x_3$ and $1-q$ of $x_1$. Observed choices break independence in a patterned way, with indifference lines that **fan out**, steeper toward the best prize, which is the Allais paradox (behav-1.11).`,
      caption: String.raw`Drag $P$, $Q$ and $R$ in the triangle and set the mixing weight $\alpha$; the rings $P'=\alpha P+(1-\alpha)R$ and $Q'=\alpha Q+(1-\alpha)R$ are the mixtures, and $P'Q'$ stays parallel to $PQ$. Each of the four lotteries carries its own indifference line. Under **expected utility** (parallel lines; $u(x_2)$ sets their slope) the right panel always finds the mixtures in the same order as $P$ and $Q$. Switch to **fanning out** or **fanning in**, preferences whose indifference lines are straight but not parallel, and the default positions already flip the order: independence fails. **Allais's lotteries** loads the case of behav-1.11. The gold point on the hypotenuse is the lottery between $x_1$ and $x_3$ that is as good as $x_2$ for sure (continuity), at height $u(x_2)$ under expected utility.`,
      deps: ['micro-13.2', 'micro-4.3', 'micro-13.1'], refs: ['W&K ch. 5'], tags: ['expected utility', 'axioms'],
      see: ['micro-4.7', 'behav-1.11'],
      credit: 'von Neumann & Morgenstern, 1947; Marschak, 1950',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Von_Neumann%E2%80%93Morgenstern_utility_theorem' },
      viz(v) {
        const kind = v.select('preferences', [{ value: 'eu', label: 'expected utility' }, { value: 'out', label: 'fanning out' }, { value: 'in', label: 'fanning in' }], 'eu');
        const m = v.slider('$u(x_2)$, with $u(x_1)=0,\\ u(x_3)=1$', 0.1, 0.95, 0.5, { step: 0.01 });
        const fs = v.slider('fanning strength', 0.15, 1, 0.75, { step: 0.01 });
        const al = v.slider('mixing weight $\\alpha$', 0.02, 1, 0.35, { step: 0.01 });
        const T = v.stage({ x: [-0.13, 1.1], y: [-0.17, 1.1], equal: true, axes: false, height: 420, title: 'lotteries over prizes $x_1 < x_2 < x_3$' });
        const Rk = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 420, weight: 0.85, title: 'is the order kept after mixing?' });
        const hP = T.handle(0.15, 0.45, { color: 'accent', label: 'P', constrain: intoTri });
        const hQ = T.handle(0.33, 0.62, { color: 'orange', label: 'Q', constrain: intoTri });
        const hR = T.handle(1, 0, { color: 'purple', label: 'R', labelPos: 'n', constrain: intoTri });
        v.button('Allais’s lotteries', () => { hP.set(0, 0); hQ.set(1 / 11, 10 / 11); hR.set(1, 0); al.set(0.11); m.set(0.91); });
        v.legend([['blue', 'indifference lines'], ['accent', 'P and P′', { dot: true }], ['orange', 'Q and Q′', { dot: true }], ['purple', 'R', { dot: true }], ['gold', 'as good as x₂ for sure', { dot: true }]]);
        let st = {};
        v.render(() => {
          fs.el.hidden = kind.value === 'eu';
          const pref = makePref(kind.value, m.value, fs.value), a = al.value;
          const P = [hP.x, hP.y], Q = [hQ.x, hQ.y], R = [hR.x, hR.y];
          const P2 = [a * P[0] + (1 - a) * R[0], a * P[1] + (1 - a) * R[1]], Q2 = [a * Q[0] + (1 - a) * R[0], a * Q[1] + (1 - a) * R[1]];
          drawTriangle(T, ['x₁', 'x₂', 'x₃']);
          drawIndiff(T, pref, { n: 15, color: 'blue', alpha: 0.28, width: 1 });
          for (const [pt, col] of [[P, 'accent'], [Q, 'orange'], [P2, 'accent'], [Q2, 'orange']]) {
            const seg = indiffThrough(pref, pt[0], pt[1]);
            if (seg) T.line(seg[0][0], seg[0][1], seg[1][0], seg[1][1], { color: col, width: 1.6, alpha: 0.85 });
          }
          if (pref.F) T.text(kind.value === 'out' ? 'the lines meet far below-left ↙' : 'the lines meet far above-right ↗', 1.08, 1.03, { size: 11, color: 'blue', align: 'right', weight: 600 });
          T.line(P[0], P[1], R[0], R[1], { color: 'muted', width: 1, dash: [3, 4] });
          T.line(Q[0], Q[1], R[0], R[1], { color: 'muted', width: 1, dash: [3, 4] });
          T.line(P[0], P[1], Q[0], Q[1], { color: 'ink', width: 1.6 });
          T.line(P2[0], P2[1], Q2[0], Q2[1], { color: 'ink', width: 1.6, dash: [5, 3] });
          T.dot(P2[0], P2[1], { r: 5.5, hollow: true, color: 'accent', width: 2.4, label: 'P′', labelPos: 'sw' });
          T.dot(Q2[0], Q2[1], { r: 5.5, hollow: true, color: 'orange', width: 2.4, label: 'Q′', labelPos: 'ne' });
          // continuity: the point on the hypotenuse indifferent to x2 for sure
          const seg0 = indiffThrough(pref, 0, 0);
          if (seg0) { const [q1, q3] = seg0[1][0] + seg0[1][1] > 0.999 ? seg0[1] : seg0[0]; T.dot(q1, q3, { r: 5, color: 'gold' }); T.text(`${v.fix(q3, 2)}`, q1, q3, { dx: 8, dy: -2, size: 11, weight: 700, color: 'gold' }); }
          T.text('better ↖', 0.62, 0.66, { size: 11, color: 'muted', align: 'left' });
          // ---- right panel: the two comparisons
          const V = (p) => pref.value(p[0], p[1]);
          const rows = [[V(P), V(Q), 'P', 'Q', 0.74], [V(P2), V(Q2), 'P′', 'Q′', 0.37]];
          const sgn = (d) => (Math.abs(d) < 1e-6 ? 0 : Math.sign(d));
          const s1 = sgn(rows[0][0] - rows[0][1]), s2 = sgn(rows[1][0] - rows[1][1]);
          const show = (x) => (pref.F ? v.fix(x, 3) : v.fix(pref.m + (1 - pref.m) * x, 3));
          rows.forEach(([va, vb, la, lb, y], i) => {
            const d = va - vb, mid = (va + vb) / 2, half = Math.max(Math.abs(d), 1e-9), X = (val) => 0.5 + (0.32 * (val - mid)) / half;
            Rk.text(i === 0 ? 'before mixing' : `after mixing with R (α = ${v.fix(a, 2)})`, 0.04, y + 0.15, { size: 12.5, weight: 700 });
            Rk.line(0.08, y, 0.92, y, { color: 'faint', width: 2 });
            Rk.dot(X(va), y, { r: 7, color: 'accent', label: la, labelPos: 'n' });
            Rk.dot(X(vb), y, { r: 7, color: 'orange', label: lb, labelPos: 'n' });
            const s = sgn(d);
            Rk.text(s === 0 ? `${la} ∼ ${lb}` : s > 0 ? `${la} ≻ ${lb}` : `${lb} ≻ ${la}`, 0.5, y - 0.07, { align: 'center', size: 14, weight: 700, color: 'ink' });
            Rk.text(`${pref.F ? 'index' : 'EU'}: ${show(va)} vs ${show(vb)}`, 0.5, y - 0.125, { align: 'center', size: 11, color: 'muted' });
          });
          Rk.text('(gap magnified to the same width in both rows)', 0.5, 0.94, { align: 'center', size: 10.5, color: 'muted' });
          const ok = s1 === s2;
          Rk.rect(0.06, 0.04, 0.94, 0.15, { fill: ok ? 'green' : 'red', fillAlpha: 0.14, color: ok ? 'green' : 'red', width: 1.4, radius: 8 });
          Rk.text(ok ? 'same order: independence holds here' : 'order flipped: independence fails', 0.5, 0.095, { align: 'center', size: 13, weight: 700, color: ok ? 'green' : 'red' });
          st = { pref, s1, s2, ok, P, Q, R, a };
        });
        v.readout(() => {
          const { pref, ok, s1 } = st; if (!pref) return '';
          const kindTxt = pref.F ? `These preferences have straight indifference lines through one point outside the triangle, so they are complete, transitive and continuous but not parallel.` : `Expected utility with $u(x_2) = ${v.fix(pref.m, 2)}$: parallel lines of slope $u_2/(u_3-u_2) = ${v.fix(pref.k, 2)}$.`;
          return `${kindTxt} ${s1 === 0 ? 'P and Q are indifferent.' : ok ? 'The mixtures keep the order of P and Q' + (pref.F ? ' at these positions; move them to find a flip.' : ': the segment P′Q′ is PQ shrunk toward R, and parallel lines rank its ends the same way for every P, Q, R and α.') : '**Mixing with R reverses the ranking**: the two segments are parallel but the indifference lines through them are not, which is exactly a violation of the independence axiom.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4', kind: 'Theorem', name: 'Risk aversion is concavity (via Jensen)',
      statement: String.raw`Let an expected-utility maximizer have an increasing utility $u$ of wealth. She is **risk averse**, weakly preferring the expected value $E[X]$ for sure to the lottery $X$ for every lottery $X$, if and only if $u$ is concave. Equivalently, the certainty equivalent $c(X)=u^{-1}\big(E[u(X)]\big)$ never exceeds $E[X]$, so the **risk premium** $\pi(X)=E[X]-c(X)$ is non-negative for every $X$. Strict concavity gives strict aversion to every non-degenerate lottery; a convex $u$ gives risk seeking ($\pi\le0$), and a utility that is concave on some stretches and convex on others dislikes some gambles and likes others.`,
      idea: String.raw`Concavity says the chord between $(a,u(a))$ and $(b,u(b))$ lies below the graph, which is Jensen's inequality for two-point lotteries; Jensen's inequality in general (rca-3.3) gives $E[u(X)]\le u(E[X])$ for every $X$, so the sure mean is weakly preferred. Conversely, if $u$ is not concave there are $a<b$ and a probability $p$ for which the chord lies above the curve at $(1-p)a+pb$, and that lottery beats its own mean. Reading the vertical gap $u(E X)-E\,u(X)$ horizontally turns the utility shortfall into money: the risk premium of micro-13.3 and micro-13.4.`,
      caption: String.raw`Drag the five control points (hollow) to bend the utility, or pick a preset; the curve is their smooth Bernstein blend, which is concave whenever the control polygon is. Drag the outcomes $a$ and $b$ along the wealth axis; the slider sets the chance of $b$. On the chord, the gold point is the gamble's expected utility and the green point above it the utility of its mean: the vertical gap is the Jensen gap. Read across to the curve for the certainty equivalent; the orange bar is the risk premium. The right panel tests every gamble $(a,b)$ with the same probability at once: green where it is disliked (positive premium), red where it is liked. It is entirely green exactly when the curve is concave.`,
      deps: ['micro-13.3', 'rca-3.3'], refs: ['W&K ch. 5'], tags: ['risk aversion', 'concavity', 'expected utility'],
      see: ['prob-1.6.2', 'micro-13.4'],
      viz(v) {
        const PRE = { concave: [0, 0.45, 0.72, 0.89, 1], linear: [0, 0.25, 0.5, 0.75, 1], convex: [0, 0.06, 0.17, 0.4, 1], fs: [0, 0.4, 0.42, 0.9, 1] };
        const XS = [0, 25, 50, 75, 100];
        const pre = v.select('utility', [{ value: 'concave', label: 'concave' }, { value: 'linear', label: 'linear' }, { value: 'convex', label: 'convex' }, { value: 'fs', label: 'Friedman–Savage' }], 'concave',
          { onChange: (k) => PRE[k].forEach((y, i) => H[i].set(XS[i], y)) });
        const pS = v.slider('chance of $b$', 0.05, 0.95, 0.5, { step: 0.01 });
        const s = v.stage({ x: [-10, 104], y: [-0.2, 1.06], axes: 'box', height: 360, weight: 1.25, xlabel: 'wealth', ylabel: 'utility u', title: 'a gamble on the utility curve' });
        const mp = v.stage({ x: [-13, 101], y: [-9, 101], equal: true, axes: 'box', height: 360, xlabel: 'outcome a', ylabel: 'outcome b', title: 'all gambles: disliked (green) or liked (red)' });
        const c = () => H.map((h) => h.y);
        const H = XS.map((x, i) => s.handle(x, PRE.concave[i], {
          color: 'muted', r: 6, constrain: (_, y) => { const cc = c(); const lo = i ? cc[i - 1] + 0.01 : 0, hi = i < 4 ? cc[i + 1] - 0.01 : 1; return [x, clamp(y, lo, Math.max(lo, hi))]; },
        }));
        const hA = s.handle(18, 0, { color: 'accent', label: 'a', labelPos: 'n', constrain: (x) => [clamp(x, 0, 100), 0] });
        const hB = s.handle(82, 0, { color: 'accent', label: 'b', labelPos: 'n', constrain: (x) => [clamp(x, 0, 100), 0] });
        v.legend([['ink', 'utility u'], ['accent', 'chord of the gamble'], ['gold', 'E u(X)', { dot: true }], ['green', 'u(E X)', { dot: true }], ['orange', 'risk premium', { area: true }]]);
        let st = {};
        v.render(() => {
          const cc = c(), p = pS.value, u = (x) => bern(cc, x, 100);
          const N = 400, tab = Array.from({ length: N + 1 }, (_, i) => u((100 * i) / N));
          const inv = (y) => { let lo = 0, hi = N; if (y <= tab[0]) return 0; if (y >= tab[N]) return 100; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tab[mid] < y) lo = mid; else hi = mid; } const f = (y - tab[lo]) / (tab[hi] - tab[lo] || 1); return (100 * (lo + f)) / N; };
          s.path(cc.map((y, i) => [XS[i], y]), { color: 'faint', width: 1, dash: [3, 3] });
          s.fn(u, { domain: [0, 100], color: 'ink', width: 2.6 });
          const a = hA.x, b = hB.x, ua = u(a), ub = u(b), EX = (1 - p) * a + p * b, EU = (1 - p) * ua + p * ub, uEX = u(EX), CE = inv(EU), pi = EX - CE;
          s.line(a, 0, a, ua, GUIDE); s.line(b, 0, b, ub, GUIDE);
          s.line(a, ua, b, ub, { color: 'accent', width: 2 });
          s.dot(a, ua, { r: 4, color: 'accent' }); s.dot(b, ub, { r: 4, color: 'accent' });
          s.line(EX, 0, EX, Math.max(uEX, EU), GUIDE);
          s.line(EX, EU, EX, uEX, { color: uEX >= EU ? 'green' : 'red', width: 3 });
          s.line(CE, EU, EX, EU, { color: 'orange', width: 1.4, dash: [5, 3] });
          s.line(CE, 0, CE, EU, { color: 'orange', width: 1, dash: [2, 3] });
          s.dot(CE, EU, { r: 4.5, color: 'orange' });
          s.dot(EX, uEX, { r: 5, color: 'green' });
          s.dot(EX, EU, { r: 5.5, color: 'gold' });
          s.rect(Math.min(CE, EX), -0.115, Math.max(CE, EX), -0.08, { fill: pi >= 0 ? 'orange' : 'red', fillAlpha: 0.75, stroke: false });
          s.text(`risk premium π = ${v.fix(pi, 1)}`, Math.max(CE, EX), -0.0975, { dx: 6, size: 11.5, weight: 700, color: pi >= 0 ? 'orange' : 'red' });
          s.text('CE', CE, EU, { dx: -6, dy: -10, align: 'right', size: 11, weight: 700, color: 'orange' });
          // ---- map of all gambles with this p
          const key = cc.map((y) => y.toFixed(4)).join(',') + '|' + p.toFixed(3);
          const scale = 8;
          mp.raster((x, y) => {
            const ea = u(x), eb = u(y), m = (1 - p) * x + p * y, pr = m - inv((1 - p) * ea + p * eb);
            if (Math.abs(x - y) < 0.4 || Math.abs(pr) < 0.03) return null;
            return v.diverge(Math.sign(pr) * (0.3 + 0.7 * Math.min(1, Math.abs(pr) / scale)), 'red', 'green');
          }, { key, res: 3, rect: [0, 0, 100, 100] });
          mp.line(0, 0, 100, 100, { color: 'muted', width: 1.2, dash: [4, 4] });
          mp.text('a = b: no risk', 70, 70, { dx: 6, dy: 8, size: 11, color: 'muted' });
          mp.dot(a, b, { r: 6, color: 'accent' });
          // concavity check on the curve itself
          let concave = true; for (let i = 1; i < N; i++) if (tab[i - 1] - 2 * tab[i] + tab[i + 1] > 1e-12) { concave = false; break; }
          let liked = 0, tot = 0;
          for (let i = 0; i <= 40; i++) for (let j = 0; j <= 40; j++) { if (i === j) continue; const x = 2.5 * i, y = 2.5 * j; tot++; if ((1 - p) * x + p * y - inv((1 - p) * u(x) + p * u(y)) < -1e-3) liked++; }
          st = { a, b, p, EX, CE, pi, EU, uEX, concave, liked, tot };
        });
        v.readout(() => {
          const { a, b, p, EX, CE, pi, EU, uEX, concave, liked, tot } = st; if (EX == null) return '';
          return `Gamble: ${v.fix(a, 1)} with probability ${v.fix(1 - p, 2)}, ${v.fix(b, 1)} with probability ${v.fix(p, 2)}. Mean $E X = ${v.fix(EX, 1)}$, certainty equivalent ${v.fix(CE, 1)}, **risk premium $\\pi = ${v.fix(pi, 2)}$** (Jensen gap $u(EX) - Eu(X) = ${v.fix(uEX - EU, 4)}$): this gamble is ${pi > 0.005 ? 'disliked' : pi < -0.005 ? '**liked**' : 'a matter of indifference'}. The curve is ${concave ? '**concave**, and none' : '**not concave**, and ' + liked} of ${tot} sampled gambles with this probability ${concave ? 'is' : 'are'} liked${concave ? ': risk aversion everywhere, as Jensen promises' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5', kind: 'Definition', name: 'Arrow–Pratt measures of risk aversion',
      statement: String.raw`For a twice-differentiable increasing utility $u$, the **coefficient of absolute risk aversion** at wealth $w$ is
$$A(w)=-\frac{u''(w)}{u'(w)},$$
and the **coefficient of relative risk aversion** is $R(w)=w\,A(w)$. Unlike $u''$ alone, both are unchanged when $u$ is replaced by $a+bu$ ($b>0$), so they measure the curvature of the preferences rather than of one particular utility scale. **Pratt's theorem**: for increasing utilities $u_1,u_2$ the following are equivalent:
(i) $A_1(w)\ge A_2(w)$ for every $w$;
(ii) $u_1=\varphi\circ u_2$ for some increasing concave $\varphi$;
(iii) at every wealth and for every risk, the risk premium of $u_1$ is at least that of $u_2$.

$A$ governs attitudes to gambles of a fixed dollar size, $R$ to gambles proportional to wealth.`,
      idea: String.raw`Normalizing $u(w)=0$ and $u'(w)=1$ removes the arbitrary scale; what remains near $w$ is the second-order term of Taylor's theorem (pma-5.15), $\tfrac12u''(w)/u'(w)\,(x-w)^2=-\tfrac12A(w)(x-w)^2$. For (i)⇒(ii), $\varphi=u_1\circ u_2^{-1}$ has $\frac{d}{dx}\ln\varphi'\big(u_2(x)\big)=A_2(x)-A_1(x)\le0$, so $\varphi'$ decreases and $\varphi$ is concave; then Jensen's inequality for $\varphi$ (behav-1.4) puts $u_1$'s certainty equivalent below $u_2$'s for every risk, which is (iii). If the coefficients cross, so do the risk premia: neither utility is more risk averse overall.`,
      caption: String.raw`Choose a family and parameter for the blue and the orange utility. Left: both rescaled to agree in level and slope at the current wealth $w$ (slider), with the 50–50 gamble $w\pm h$ marked; the dashed line is risk neutrality. Middle: each utility's absolute risk aversion $A$ across wealth. Right: the risk premium each demands for the gamble $w\pm h$ as its size $h$ grows. When one $A$ curve lies above the other everywhere, its premium is larger for every gamble. CRRA against CARA (the default) has crossing $A$ curves: move $w$ across the crossing and the ranking of risk premia flips.`,
      deps: ['behav-1.4', 'pma-5.15'], refs: ['W&K ch. 5'], tags: ['risk aversion', 'Arrow–Pratt'],
      see: ['micro-13.18'],
      credit: 'Pratt, 1964; Arrow, 1965',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Risk_aversion' },
      viz(v) {
        const f1 = v.select('blue utility', ['CRRA', 'CARA'], 'CRRA');
        const g1 = v.slider('blue: relative risk aversion $\\gamma$', 0.3, 6, 2, { step: 0.05 });
        const a1 = v.slider('blue: absolute risk aversion $a$', 0.005, 0.2, 0.08, { step: 0.001 });
        const f2 = v.select('orange utility', ['CRRA', 'CARA'], 'CARA');
        const g2 = v.slider('orange: relative risk aversion $\\gamma$', 0.3, 6, 1, { step: 0.05 });
        const a2 = v.slider('orange: absolute risk aversion $a$', 0.005, 0.2, 0.04, { step: 0.001 });
        const W = v.slider('wealth $w$ (thousand dollars)', 10, 95, 30, { step: 0.5 });
        const Hs = v.slider('gamble size $h$', 1, 30, 15, { step: 0.5 });
        const s1 = v.stage({ x: [-12, 100], y: [-40, 30], axes: 'box', height: 300, xlabel: 'wealth', ylabel: 'u, rescaled at w', title: 'two utilities, matched at w' });
        const s2 = v.stage({ x: [-17, 100], y: [0, 0.2], axes: 'box', height: 300, xlabel: 'wealth', ylabel: 'A = −u″/u′', title: 'absolute risk aversion' });
        const s3 = v.stage({ x: [0, 30], y: [0, 10], axes: 'box', height: 300, xlabel: 'gamble size h', ylabel: 'risk premium', title: 'premium for w ± h' });
        const mk = (f, g, a) => (f.value === 'CRRA' ? crra(g.value) : cara(a.value));
        const lab = (f, g, a) => (f.value === 'CRRA' ? (Math.abs(g.value - 1) < 1e-9 ? 'log' : `CRRA γ = ${v.fix(g.value, 2)}`) : `CARA a = ${v.fix(a.value, 3)}`);
        v.legend([['blue', 'blue utility'], ['orange', 'orange utility'], ['muted', 'risk neutral', { dash: true }]]);
        let st = {};
        v.render(() => {
          g1.el.hidden = f1.value !== 'CRRA'; a1.el.hidden = f1.value !== 'CARA'; g2.el.hidden = f2.value !== 'CRRA'; a2.el.hidden = f2.value !== 'CARA';
          const U1 = mk(f1, g1, a1), U2 = mk(f2, g2, a2), w = W.value, hmax = Math.min(30, 0.95 * w), h = Math.min(Hs.value, hmax);
          const n1 = (x) => (U1.u(x) - U1.u(w)) / U1.up(w), n2 = (x) => (U2.u(x) - U2.u(w)) / U2.up(w);
          s1.setView([-12, 100], [-w - 12, 100 - w + 8]);
          s1.fn((x) => x - w, { color: 'muted', width: 1.2, dash: [5, 4], domain: [0, 100] });
          s1.fn(n1, { color: 'blue', width: 2.4, domain: [0.4, 100] });
          s1.fn(n2, { color: 'orange', width: 2.4, domain: [0.4, 100] });
          for (const [nf, U, col] of [[n1, U1, 'blue'], [n2, U2, 'orange']]) {
            const lo = nf(w - h), hi = nf(w + h), mid = (lo + hi) / 2, ce = U.ce(w, h);
            s1.line(w - h, lo, w + h, hi, { color: col, width: 1.2, alpha: 0.7 });
            s1.dot(w, mid, { r: 4, color: col }); s1.line(ce, mid, w, mid, { color: col, width: 3, alpha: 0.7 });
          }
          s1.vline(w, GUIDE); s1.dot(w, 0, { r: 4, color: 'ink' });
          // A(w)
          const Amax = Math.max(0.02, 1.6 * Math.max(U1.A(w), U2.A(w), U1.A(70), U2.A(70)));
          s2.setView([-17, 100], [0, Amax]);
          s2.fn((x) => U1.A(x), { color: 'blue', width: 2.4, domain: [1, 100] });
          s2.fn((x) => U2.A(x), { color: 'orange', width: 2.4, domain: [1, 100] });
          s2.vline(w, GUIDE); s2.dot(w, U1.A(w), { r: 4.5, color: 'blue' }); s2.dot(w, U2.A(w), { r: 4.5, color: 'orange' });
          let cross = null; for (let x = 1.5; x < 100; x += 0.5) { const d0 = U1.A(x - 0.5) - U2.A(x - 0.5), d1 = U1.A(x) - U2.A(x); if (d0 * d1 <= 0 && d0 !== d1 && d0 !== 0) { cross = x - 0.5 * (d1 / (d1 - d0)); break; } }
          if (cross) { s2.dot(cross, U1.A(cross), { r: 5, hollow: true, color: 'red', width: 2 }); s2.text(`cross at w = ${v.fix(cross, 1)}`, cross, U1.A(cross), { dx: 8, dy: -10, size: 11.5, color: 'red', weight: 600 }); }
          // premium vs h
          const pr1 = (x) => w - U1.ce(w, x), pr2 = (x) => w - U2.ce(w, x);
          const pmax = Math.max(0.5, 1.15 * Math.max(pr1(hmax), pr2(hmax)));
          s3.setView([-0.17 * hmax, hmax], [0, pmax]);
          s3.fn((x) => 0.5 * x * x * U1.A(w), { color: 'blue', width: 1, dash: [3, 3], domain: [0, hmax] });
          s3.fn((x) => 0.5 * x * x * U2.A(w), { color: 'orange', width: 1, dash: [3, 3], domain: [0, hmax] });
          s3.fn(pr1, { color: 'blue', width: 2.4, domain: [0, hmax] });
          s3.fn(pr2, { color: 'orange', width: 2.4, domain: [0, hmax] });
          s3.vline(h, GUIDE); s3.dot(h, pr1(h), { r: 4.5, color: 'blue' }); s3.dot(h, pr2(h), { r: 4.5, color: 'orange' });
          s3.text('dotted: ½h²A(w)', 0, 0.82 * pmax, { dx: 4, size: 10.5, color: 'muted' });
          let always = 0; for (let x = 1; x <= 100; x += 0.5) always += Math.sign(U1.A(x) - U2.A(x));
          st = { w, h, A1: U1.A(w), A2: U2.A(w), p1: pr1(h), p2: pr2(h), cross, l1: lab(f1, g1, a1), l2: lab(f2, g2, a2), dom: Math.abs(always) === 199 ? Math.sign(always) : 0 };
        });
        v.readout(() => {
          const { w, h, A1, A2, p1, p2, cross, l1, l2, dom } = st; if (!w) return '';
          const head = `At $w = ${v.fix(w, 1)}$: blue (${l1}) has $A = ${v.fix(A1, 4)}$, $R = ${v.fix(w * A1, 2)}$; orange (${l2}) has $A = ${v.fix(A2, 4)}$, $R = ${v.fix(w * A2, 2)}$. For the 50–50 gamble $\\pm ${v.fix(h, 1)}$ the premia are **${v.fix(p1, 2)}** (blue) and **${v.fix(p2, 2)}** (orange).`;
          const tail = dom ? ` The ${dom > 0 ? 'blue' : 'orange'} $A$ lies above the other at every wealth, so by Pratt's theorem its premium is larger for every gamble at every wealth (the other utility is a concave transform of it).` : cross ? ` The $A$ curves cross at $w = ${v.fix(cross, 1)}$, so neither is more risk averse overall: below the crossing ${A1 > A2 === w < cross ? 'blue' : 'orange'} demands more, above it the other.` : '';
          return head + tail;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6', kind: 'Theorem', name: 'Pratt’s approximation of the risk premium',
      statement: String.raw`Let $\tilde\varepsilon$ be a fair risk ($E\tilde\varepsilon=0$, variance $\sigma^2$) added to wealth $w$, and let $u$ be increasing and twice continuously differentiable. The risk premium $\pi$ defined by $u(w-\pi)=E\,u(w+\tilde\varepsilon)$ satisfies, as the risk shrinks,
$$\pi=\tfrac12\,\sigma^2A(w)+o(\sigma^2),\qquad A(w)=-\frac{u''(w)}{u'(w)} .$$
So for small risks the premium is proportional to the *variance*: halving the stake quarters the premium, and an expected-utility maximizer with a smooth utility is approximately risk neutral toward small fair bets (**second-order risk aversion**). The approximation degrades once the risk is large compared with the scale over which $A$ changes, and it fails if $u$ has a kink at $w$: there $\pi$ is proportional to $\sigma$ itself (**first-order risk aversion**).`,
      idea: String.raw`Expand both sides around $w$ (Taylor's theorem, pma-5.15): $u(w-\pi)\approx u(w)-\pi u'(w)$, and $E\,u(w+\tilde\varepsilon)\approx u(w)+\tfrac12\sigma^2u''(w)$, the first-order term vanishing because the risk is fair. Equating gives $\pi\approx\tfrac12\sigma^2\big(-u''/u'\big)$: the Arrow–Pratt coefficient (behav-1.5) times half the variance, which is the Jensen gap of behav-1.4 converted into money (micro-13.4). At a kink the left and right slopes differ, the first-order terms no longer cancel, and the premium is of order $\sigma$. That is why kinked, loss-averse preferences can produce noticeable aversion to small bets, which smooth expected utility cannot (behav-1.8).`,
      caption: String.raw`Choose a utility, a fair risk (a 50–50 bet $\pm\sigma$ or a uniform spread with standard deviation $\sigma$) and its size. Left: the utility near $w=50$ with the risk's expected utility, the certainty equivalent, the exact risk premium (orange bar) and Pratt's $\tfrac12\sigma^2A(w)$ (purple bar). Right, on logarithmic axes: both against $\sigma$; for a smooth utility they coincide for small risks along a line of slope 2 and separate for large ones. Choose the **kinked** utility (losses weighted $\lambda$ times) and the exact premium follows a line of slope 1, far above the quadratic prediction.`,
      deps: ['behav-1.5', 'micro-13.4', 'pma-5.15'], refs: ['W&K ch. 5'], tags: ['risk aversion', 'Arrow–Pratt', 'approximation'],
      credit: 'Pratt, 1964',
      viz(v) {
        const W0 = 50;
        const fam = v.select('utility', [{ value: 'crra', label: 'CRRA' }, { value: 'cara', label: 'CARA' }, { value: 'kink', label: 'kinked at $w$' }], 'crra');
        const gS = v.slider('relative risk aversion $\\gamma$', 0.5, 8, 4, { step: 0.05 });
        const aS = v.slider('absolute risk aversion $a$', 0.01, 0.3, 0.05, { step: 0.001 });
        const lS = v.slider('loss weight $\\lambda$ below $w$', 1, 3, 2, { step: 0.05 });
        const dist = v.select('risk', [{ value: 'bet', label: '50–50 bet ±σ' }, { value: 'unif', label: 'uniform' }], 'bet');
        const sS = v.slider('size $\\sigma$', 0.1, 28, 12, { log: true });
        const s1 = v.stage({ x: [W0 - 32, W0 + 32], y: [0, 1], axes: 'box', height: 320, xlabel: 'wealth', ylabel: 'utility, rescaled at w', title: 'the risk premium as a Jensen gap' });
        const s2 = v.stage({ x: [0.1, 28], xlog: true, y: [1e-5, 60], ylog: true, axes: 'box', height: 320, xlabel: 'σ (log scale)', ylabel: 'premium (log scale)', title: 'exact premium against ½σ²A(w)' });
        v.legend([['ink', 'utility'], ['orange', 'exact risk premium'], ['purple', '½σ²A(w)', { dash: true }]]);
        const util = () => {
          const k = fam.value;
          if (k === 'crra') { const U = crra(gS.value); return { u: U.u, inv: U.inv, A: U.A(W0) }; }
          if (k === 'cara') { const U = cara(aS.value); return { u: U.u, inv: U.inv, A: U.A(W0) }; }
          const l = lS.value, g0 = Math.log(W0);
          return { u: (x) => (x >= W0 ? Math.log(x) : g0 + l * (Math.log(x) - g0)), inv: (y) => (y >= g0 ? Math.exp(y) : Math.exp(g0 + (y - g0) / l)), A: 1 / W0, kink: true };
        };
        const Eu = (U, sig) => {
          if (dist.value === 'bet') return 0.5 * U.u(W0 - sig) + 0.5 * U.u(W0 + sig);
          const c = sig * Math.sqrt(3);
          return (v.M.integrate((e) => U.u(W0 + e), -c, 0, 200) + v.M.integrate((e) => U.u(W0 + e), 0, c, 200)) / (2 * c);
        };
        const prem = (U, sig) => W0 - U.inv(Eu(U, sig));
        let st = {};
        v.render(() => {
          gS.el.hidden = fam.value !== 'crra'; aS.el.hidden = fam.value !== 'cara'; lS.el.hidden = fam.value !== 'kink';
          const U = util(), sig = sS.value, c = dist.value === 'bet' ? sig : sig * Math.sqrt(3);
          const u0 = U.u(W0), slope = (U.u(W0 + 1e-4) - u0) / 1e-4, d = (x) => (U.u(x) - u0) / slope; // utility rescaled to money units at w
          const lo = W0 - 32, hi = W0 + 32, y0 = d(lo + 1), y1 = d(hi);
          const yb = y0 - 0.34 * (y1 - y0);
          s1.setView([lo - 5, hi], [yb, y1 + 0.06 * (y1 - y0)]);
          s1.fn(d, { domain: [lo + 0.5, hi], color: 'ink', width: 2.4 });
          s1.fn((x) => x - W0, { domain: [lo + 0.5, hi], color: 'muted', width: 1, dash: [4, 4] });
          const eu = Eu(U, sig), pi = W0 - U.inv(eu), pa = 0.5 * sig * sig * U.A, deu = (eu - u0) / slope;
          if (dist.value === 'bet') { s1.line(W0 - sig, d(W0 - sig), W0 + sig, d(W0 + sig), { color: 'accent', width: 1.8 }); s1.dot(W0 - sig, d(W0 - sig), { r: 4, color: 'accent' }); s1.dot(W0 + sig, d(W0 + sig), { r: 4, color: 'accent' }); }
          else { s1.vband(W0 - c, W0 + c, { color: 'accent', alpha: 0.08 }); s1.text('uniform spread', W0, y1, { dy: 12, align: 'center', size: 11, color: 'accent' }); }
          s1.line(W0, yb, W0, 0, GUIDE);
          s1.dot(W0, deu, { r: 5, color: 'gold' }); s1.dot(W0, 0, { r: 4.5, color: 'green' });
          s1.line(W0 - pi, deu, W0, deu, { color: 'orange', width: 1.4, dash: [5, 3] }); s1.dot(W0 - pi, deu, { r: 4, color: 'orange' });
          const h = 0.04 * (y1 - y0);
          s1.rect(W0 - pi, yb + 4.6 * h, W0, yb + 5.6 * h, { fill: 'orange', fillAlpha: 0.8, stroke: false });
          s1.rect(W0 - pa, yb + 3 * h, W0, yb + 4 * h, { fill: 'purple', fillAlpha: 0.65, stroke: false });
          s1.text(`exact π = ${v.fix(pi, 3)}`, W0, yb + 5.1 * h, { dx: 6, size: 11.5, weight: 700, color: 'orange' });
          s1.text(`½σ²A = ${v.fix(pa, 3)}`, W0, yb + 3.5 * h, { dx: 6, size: 11.5, weight: 700, color: 'purple' });
          // log–log panel
          const xs = Array.from({ length: 120 }, (_, i) => 0.1 * Math.pow(280, i / 119));
          const ex = xs.map((x) => [x, Math.max(prem(U, x), 1e-12)]), ap = xs.map((x) => [x, 0.5 * x * x * U.A]);
          s2.path(ap, { color: 'purple', width: 2, dash: [6, 4] });
          s2.path(ex, { color: 'orange', width: 2.6 });
          s2.vline(sig, GUIDE); s2.dot(sig, Math.max(pi, 1e-12), { r: 5, color: 'orange' }); s2.dot(sig, pa, { r: 4, color: 'purple' });
          s2.text(U.kink ? 'slope 1: π ∝ σ' : 'slope 2: π ∝ σ²', 0.13, U.kink ? 0.4 : 3e-4, { size: 11.5, color: 'muted', weight: 600 });
          st = { sig, pi, pa, A: U.A, kink: U.kink, small: prem(U, 0.2), smallA: 0.5 * 0.04 * U.A };
        });
        v.readout(() => {
          const { sig, pi, pa, A, kink, small, smallA } = st; if (!sig) return '';
          const err = (100 * (pa - pi)) / pi;
          if (kink) return `Kinked utility: $A(w)$ is not defined at the kink (the slope drops by the factor $\\lambda$ = ${v.fix(lS.value, 2)}), and the premium is first order: **π = ${v.fix(pi, 3)}** for $\\sigma$ = ${v.fix(sig, 2)}, while the quadratic formula with the smooth part's $A = ${v.fix(A, 4)}$ gives only ${v.fix(pa, 4)}. At $\\sigma$ = 0.2 the ratio is ${v.fix(small / smallA, 0)} to 1: halving the risk only halves the premium.`;
          const exact = fam.value === 'crra' && Math.abs(gS.value - 2) < 1e-9 && dist.value === 'bet' ? ' (For $\\gamma = 2$ and a 50–50 bet the formula happens to be exact: the certainty equivalent is the harmonic mean, $w - \\sigma^2/w$.)' : '';
          return `$A(w) = ${v.fix(A, 4)}$, $\\sigma$ = ${v.fix(sig, 2)}: exact premium **${v.fix(pi, 4)}**, Pratt's $\\tfrac12\\sigma^2A$ = **${v.fix(pa, 4)}** (${err >= 0 ? '+' : '−'}${v.fix(Math.abs(err), 1)}%). At $\\sigma$ = 0.2 they agree to ${v.fix(Math.abs((100 * (smallA - small)) / small), 3)}%: the error is of higher order than $\\sigma^2$.${exact}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7', kind: 'Definition', name: 'CARA and CRRA utility',
      statement: String.raw`**CARA** (constant absolute risk aversion) utility is $u(w)=-e^{-aw}/a$ with $a>0$: $A(w)=a$ at every wealth. **CRRA** (constant relative risk aversion) utility is $u(w)=\dfrac{w^{1-\gamma}}{1-\gamma}$ with $\gamma>0$ ($\ln w$ when $\gamma=1$): $R(w)=\gamma$ and $A(w)=\gamma/w$, decreasing in wealth. Up to positive affine transformations these are the only utilities with constant $A$ (besides the linear one) and constant $R$. Consequences:
- under CARA, the risk premium for a gamble of fixed dollar size, and the dollar amount invested in a risky asset, do not depend on wealth (with normally distributed returns the optimal holding is $(\mu-r)/(a\sigma^2)$ dollars);
- under CRRA, the premium for a gamble proportional to wealth, as a fraction of the stake, and the *share* of wealth invested do not depend on wealth (close to Merton's $(\mu-r)/(\gamma\sigma^2)$).`,
      idea: String.raw`Constant $A$ means $u''/u'$ is constant, so $u'$ is an exponential and adding a sure amount to wealth multiplies $u$ by a constant: preferences over additive gambles ignore the level of wealth. Constant $R$ means $u'(w)\propto w^{-\gamma}$, so scaling wealth multiplies $u$ by a constant: preferences over proportional gambles ignore the scale. The portfolio results follow by maximizing $E\,u\big(w(1+r)+\alpha(\tilde R-r)\big)$ over the dollar holding $\alpha$: the wealth term factors out of CARA and scales out of CRRA. Their Arrow–Pratt coefficients (behav-1.5) are the simplest possible, which is why these two families carry most applied work in finance and macroeconomics.`,
      caption: String.raw`A risky asset with mean return 6.4% and standard deviation 20% (a normal distribution truncated at four standard deviations) against a safe 0.5%, the assumptions of Rabin's Table III. For each wealth the page numerically finds the holding that maximizes expected utility. Left: dollars held, on logarithmic axes: flat under CARA (blue), proportional to wealth under CRRA (orange). Middle: the same holdings as a share of wealth: falling under CARA, flat under CRRA. Right: the risk premium as a percentage of the stake, for a 50–50 bet of $\pm\$1{,}000$ (solid) and of $\pm10\%$ of wealth (dashed): one curve of each family is flat. Drag the parameters and the wealth marker.`,
      deps: ['behav-1.5'], refs: ['W&K ch. 5'], tags: ['risk aversion', 'utility', 'portfolio'],
      see: ['fin-3.14', 'fin-11.9'],
      viz(v) {
        const MU = 0.064, SD = 0.2, RF = 0.005;
        const nodes = Array.from({ length: 41 }, (_, i) => -4 + 0.2 * i), wts0 = nodes.map((z) => Math.exp(-z * z / 2)), ws = wts0.reduce((s, x) => s + x, 0);
        const Q = nodes.map((z, i) => [MU + SD * z - RF, wts0[i] / ws]); // excess returns and weights
        const xmin = MU - 4 * SD - RF;
        const aS = v.slider('CARA: $a$ (per dollar)', 1e-6, 1e-3, 5e-5, { log: true, fmt: (x) => x.toExponential(1) });
        const gS = v.slider('CRRA: $\\gamma$', 1.5, 10, 3, { step: 0.1 });
        const wS = v.slider('wealth (dollars)', 2e3, 1e7, 1e5, { log: true, fmt: (x) => '$' + big(x, 3) });
        const P1 = v.stage({ x: [5e2, 1e7], xlog: true, y: [1e2, 1e8], ylog: true, axes: 'box', height: 290, xlabel: 'wealth ($)', ylabel: 'dollars in stocks', title: 'amount invested' });
        const P2 = v.stage({ x: [5e2, 1e7], xlog: true, y: [0, 1.6], axes: 'box', height: 290, xlabel: 'wealth ($)', ylabel: 'share of wealth', title: 'share invested' });
        const P3 = v.stage({ x: [5e2, 1e7], xlog: true, y: [-7, 100], axes: 'box', height: 290, xlabel: 'wealth ($)', ylabel: '% of the stake', title: 'risk premium of a 50–50 bet' });
        v.legend([['blue', 'CARA'], ['orange', 'CRRA'], ['ink', '±$1,000 bet'], ['ink', '±10% of wealth bet', { dash: true }]]);
        // golden-section maximization of a concave function on [lo, hi]
        const argmax = (f, lo, hi) => { const r = (Math.sqrt(5) - 1) / 2; let a = lo, b = hi, c = b - r * (b - a), d = a + r * (b - a), fc = f(c), fd = f(d); for (let i = 0; i < 70; i++) { if (fc > fd) { b = d; d = c; fd = fc; c = b - r * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = a + r * (b - a); fd = f(d); } } return (a + b) / 2; };
        let cache = {};
        const solve = () => {
          const a = aS.value, g = gS.value, key = `${a}|${g}`;
          if (cache.key === key) return cache;
          const caraDollars = argmax((al) => -Q.reduce((s, [x, q]) => s + q * Math.exp(-a * al * x), 0), 0, 50 / (a * SD * SD));
          const smax = (1 + RF) / -xmin * 0.999;
          const crraShare = argmax((sh) => Q.reduce((s, [x, q]) => { const W = 1 + RF + sh * x; return s + q * (Math.abs(g - 1) < 1e-9 ? Math.log(W) : Math.pow(W, 1 - g) / (1 - g)); }, 0), 0, smax);
          cache = { key, caraDollars, crraShare, smax };
          return cache;
        };
        let st = {};
        v.render(() => {
          const S = solve(), a = aS.value, g = gS.value, w = wS.value;
          const grid = Array.from({ length: 81 }, (_, i) => 2e3 * Math.pow(5000, i / 80));
          // amounts
          P1.path(grid.map((x) => [x, S.caraDollars]), { color: 'blue', width: 2.6 });
          P1.path(grid.map((x) => [x, S.crraShare * x]), { color: 'orange', width: 2.6 });
          P1.path(grid.map((x) => [x, x]), { color: 'muted', width: 1, dash: [4, 4] });
          P1.text('all wealth', 3e6, 3e6, { dx: -4, dy: -10, align: 'right', size: 10.5, color: 'muted' });
          P1.vline(w, GUIDE); P1.dot(w, S.caraDollars, { r: 4.5, color: 'blue' }); P1.dot(w, S.crraShare * w, { r: 4.5, color: 'orange' });
          // shares
          P2.hline(1, { color: 'muted', width: 1, dash: [4, 4] }); P2.text('100% (above: borrowing)', 1e7, 1, { dx: -6, dy: -9, align: 'right', size: 10.5, color: 'muted' });
          P2.clip(() => { P2.path(grid.map((x) => [x, S.caraDollars / x]), { color: 'blue', width: 2.6 }); });
          P2.path(grid.map((x) => [x, S.crraShare]), { color: 'orange', width: 2.6 });
          P2.vline(w, GUIDE); if (S.caraDollars / w < 1.6) P2.dot(w, S.caraDollars / w, { r: 4.5, color: 'blue' }); P2.dot(w, S.crraShare, { r: 4.5, color: 'orange' });
          // risk premia, % of stake
          const prc = (U, ww, h) => (100 * (ww - U.ce(ww, h))) / h;
          const C = cara(a), R = crra(g);
          P3.clip(() => {
            P3.path(grid.map((x) => [x, prc(C, x, 1000)]), { color: 'blue', width: 2.4 });
            P3.path(grid.filter((x) => x > 1100).map((x) => [x, prc(R, x, 1000)]), { color: 'orange', width: 2.4 });
            P3.path(grid.map((x) => [x, prc(C, x, 0.1 * x)]), { color: 'blue', width: 2, dash: [6, 4] });
            P3.path(grid.map((x) => [x, prc(R, x, 0.1 * x)]), { color: 'orange', width: 2, dash: [6, 4] });
          });
          P3.vline(w, GUIDE);
          st = { S, w, a, g, pc1: prc(C, w, 1000), pr1: prc(R, w, 1000), pc10: prc(C, w, 0.1 * w), pr10: prc(R, w, 0.1 * w) };
        });
        v.readout(() => {
          const { S, w, a, g, pc1, pr1, pc10, pr10 } = st; if (!S) return '';
          return `At wealth ${usd(w)}: **CARA** ($a$ = ${a.toExponential(1)}) holds **${usd(S.caraDollars)}** in stocks at every wealth (formula $(\\mu-r)/(a\\sigma^2)$ = ${usd(0.059 / (a * 0.04))} for untruncated normal returns), ${v.fix((100 * S.caraDollars) / w, 1)}% of wealth here. **CRRA** ($\\gamma$ = ${v.fix(g, 1)}) holds **${v.fix(100 * S.crraShare, 1)}%** of wealth at every wealth (Merton: ${v.fix((100 * 0.059) / (g * 0.04), 1)}%), ${usd(S.crraShare * w)} here. Risk premium of a $\\pm\\$1{,}000$ bet: CARA ${v.fix(pc1, 2)}%, CRRA ${v.fix(pr1, 2)}% of the stake; of a $\\pm10\\%$ bet: CARA ${v.fix(pc10, 2)}%, CRRA ${v.fix(pr10, 2)}%.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8', kind: 'Theorem', name: 'Rabin’s calibration theorem',
      statement: String.raw`Let $U$ be strictly increasing and concave, and suppose that at **every** wealth level the expected-utility maximizer turns down the 50–50 gamble "lose $l$, gain $g$", with $g>l>0$. Then for every wealth $w$ and every positive integer $k$,
$$U(w)-U(w-2kl)\ \ge\ 2\sum_{i=1}^{k}\Big(\frac gl\Big)^{i-1}r,\qquad U(w+mg)-U(w)\ \le\ \sum_{i=0}^{m-1}\Big(\frac lg\Big)^{i}r,$$
where $r=U(w)-U(w-l)$, so she also turns down "lose $L=2kl$, gain $G$" for every $G$ below a computable bound. Utility gains are capped at $\frac{g}{g-l}\,r$, so once the loss bound passes the cap no gain at all can compensate. Rabin's Table I: rejecting "lose $\$100$, gain $\$110$" at all wealth levels implies rejecting "lose $\$800$, gain $\$2{,}090$" and "lose $\$1{,}000$, gain any amount". Knowing the small bet is rejected only for wealth below $\$300{,}000$ does not save the theory: from $\$290{,}000$ the person still rejects "lose $\$1{,}000$, gain $\$718{,}190$" (Table II).`,
      idea: String.raw`Rejecting the small bet at wealth $w$ means the $g$ dollars above $w$ are worth less than the $l$ dollars below it; by concavity (behav-1.4) the marginal utility of money must fall by the factor $l/g$ over every stretch of about $l+g$ dollars. Repeating this at every wealth makes marginal utility decay *geometrically*: for $l=100$, $g=110$, by roughly 9% per \$210, so that dollars a few thousand above current wealth are almost worthless and dollars a few thousand below are precious. That is wildly implausible for lifetime wealth. Rabin's conclusion is that aversion to modest-stakes risk is not diminishing marginal utility of wealth; loss aversion relative to a reference point (behav-2.2) explains it without the absurd large-stakes implications.`,
      caption: String.raw`First answer the question in the controls: would you take a 50–50 bet that loses $\$100$ or gains $\$g$ (slider, default $\$110$)? If you would turn it down at any wealth, the table gives Rabin's Table I, computed live from the corollary's bounds (every entry matches the paper; ∞ means no gain is enough), with your column and the selected loss $L$ outlined. The right panel draws the utility at Rabin's bounds, in units of $r=U(w)-U(w-\$100)$ (gains at their upper bound, losses at their lower bound): it can never rise more than $g/(g-l)$ units above today (green dashed line), while losing $L$ costs at least the red amount. The chord of the bet "lose $L$, gain $G$" passes below today's utility, so it is rejected.`,
      deps: ['behav-1.4'], refs: ['W&K ch. 5'], tags: ['risk aversion', 'calibration', 'expected utility'],
      see: ['behav-2.2', 'behav-1.6'],
      credit: 'Rabin, 2000',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rabin%27s_calibration_theorem' },
      viz(v) {
        const l = 100;
        const ans = v.select('lose $\\$100$ or gain $\\$g$, 50–50: would you take it?', [{ value: 'q', label: 'not sure yet' }, { value: 'yes', label: 'take it' }, { value: 'no', label: 'turn it down' }], 'q');
        const gS = v.slider('gain $g$ (dollars)', 101, 150, 110, { step: 1 });
        const LS = v.slider('larger loss $L$ (dollars)', 200, 3000, 1000, { step: 200 });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 370, weight: 1.05, title: 'Rabin’s Table I: the largest G you must also refuse' });
        const ut = v.stage({ x: [-3000, 3000], y: [-14, 14], axes: 'box', height: 370, xlabel: 'change in wealth ($)', ylabel: 'utility (units of r)', title: 'Rabin’s bounds on the utility function' });
        const T = v.table(tb, { rows: RABIN_L.length, cols: 4, square: false, cellAspect: 2.1, maxCell: 30, size: 12.5, rowLabels: RABIN_L.map((x) => '$' + money(x)), colLabels: RABIN_g.map((g) => 'g = $' + g), cornerLabel: 'L \\ g', region: [0, 0, 1, 0.94] });
        v.legend([['blue', 'utility bound (concave)'], ['green', 'cap on any gain', { dash: true }], ['red', 'utility lost by losing L', { area: true }], ['accent', 'chord of lose L / gain G']]);
        let st = {};
        v.render(() => {
          const g = gS.value, L = LS.value, rej = ans.value === 'no';
          // the table, computed from the corollary
          const vals = RABIN_L.map((LL) => RABIN_g.map((gg) => rabinG(l, gg, LL)));
          const agree = vals.every((row, i) => row.every((x, j) => (x === Infinity ? RABIN_TABLE[i][j] === Infinity : Math.floor(x / 10) * 10 === RABIN_TABLE[i][j])));
          const jSel = RABIN_g.indexOf(g), iSel = RABIN_L.indexOf(L);
          T.draw({
            value: (i, j) => (vals[i][j] === Infinity ? '∞' : '$' + money(Math.floor(vals[i][j] / 10) * 10)),
            fill: (i, j) => (vals[i][j] === Infinity ? ['red', rej ? 0.22 : 0.08] : ['orange', rej ? 0.12 : 0.05]),
            textColor: () => (rej ? 'ink' : 'muted'),
            activeCol: jSel >= 0 ? jSel : undefined, activeRow: iSel >= 0 ? iSel : undefined,
            highlight: jSel >= 0 && iSel >= 0 ? [[iSel, jSel]] : [],
          });
          tb.text(agree ? 'computed from the bounds; all 40 entries equal the paper’s Table I' : 'computed from the bounds', 0.5, 0.975, { align: 'center', size: 11, color: agree ? 'green' : 'muted', weight: 600 });
          // the extremal utility: gains block j adds (l/g)^j over g dollars, losses block i removes 2(g/l)^{i-1} over 2l dollars
          const r = l / g, cap = g / (g - l), G = rabinG(l, g, L), lossU = rabinLoss(l, g, L);
          const gainPts = [[0, 0]]; let sum = 0; for (let j = 0; j < 400 && j * g < 3000; j++) { sum += Math.pow(r, j); gainPts.push([(j + 1) * g, sum]); }
          const lossPts = [[0, 0]]; let ls = 0; for (let i = 1; 2 * i * l <= 3000; i++) { ls += 2 * Math.pow(g / l, i - 1); lossPts.push([-2 * i * l, -ls]); }
          const ymin = Math.max(-40, -1.15 * Math.max(lossU, cap * 1.3)), ymax = cap * 1.35;
          const xmin = -Math.max(1.5 * L, 700);
          ut.setView([xmin, 3000], [ymin, ymax]);
          ut.hline(cap, { color: 'green', width: 1.6, dash: [6, 4] });
          ut.text(`no gain is worth more than g/(g−l) = ${v.fix(cap, 1)}`, xmin, cap, { dx: 40, dy: -9, size: 11, color: 'green', weight: 600 });
          ut.hline(0, { color: 'muted', width: 1 }); ut.vline(0, { color: 'muted', width: 1 });
          ut.rect(-L, -lossU, 0, 0, { fill: 'red', fillAlpha: 0.1, stroke: false });
          ut.clip(() => { ut.path(lossPts.slice().reverse().concat(gainPts), { color: 'blue', width: 2.6 }); });
          ut.dot(-L, -lossU, { r: 5, color: 'red' });
          ut.text(`losing $${money(L)} costs ≥ ${v.fix(lossU, 1)}`, -L, -lossU, { dx: 8, dy: 10, size: 11, color: 'red', weight: 600 });
          const Gx = isFinite(G) ? Math.min(G, 3000) : 3000, uG = isFinite(G) ? Math.min(cap, gainPts.reduce((s, p) => (p[0] <= G ? p[1] : s), 0)) : cap;
          ut.line(-L, -lossU, Gx, uG, { color: 'accent', width: 1.8 });
          const mid = [(-L + Gx) / 2, (-lossU + uG) / 2];
          ut.dot(mid[0], mid[1], { r: 5, color: 'accent' });
          if (isFinite(G) && G <= 3000) ut.text(`G = $${money(G)}`, Gx, uG, { dx: 8, dy: 13, size: 11, color: 'accent', weight: 600 });
          else ut.text(isFinite(G) ? `G = $${money(G)} →` : 'G = any amount →', 3000, cap, { dx: -4, dy: -9, align: 'right', size: 11, color: 'accent', weight: 600 });
          ut.text('½U(w−L) + ½U(w+G) < U(w)', mid[0], mid[1], { dx: 12, dy: 15, align: 'left', size: 10.5, color: 'accent' });
          // CARA cross-check: the coefficient that makes the small bet just acceptable
          let lo = 1e-9, hi = 0.1; for (let it = 0; it < 100; it++) { const m = (lo + hi) / 2; if (0.5 * Math.exp(m * l) + 0.5 * Math.exp(-m * g) - 1 > 0) hi = m; else lo = m; }
          st = { g, L, G, rej, a: lo, cap, lossU, agree };
        });
        v.readout(() => {
          const { g, L, G, rej, a, cap, lossU } = st; if (!g) return '';
          if (ans.value === 'q') return `Decide first: would you accept a 50–50 bet that loses $\\$100$ or wins $\\$${g}$? Its expected value is $+\\$${v.fix((g - 100) / 2, 1)}$. Then choose an answer above to see what expected-utility theory infers from it.`;
          if (ans.value === 'yes') return `Then expected utility is comfortable with you: accepting a favourable small bet is what a smooth concave utility predicts, since it is nearly linear over \\$200 (behav-1.6). Rabin's argument starts from the many people who say *no*: choose "turn it down" to see what that would imply.`;
          return `If you turn down lose $\\$100$ / gain $\\$${g}$ **at every wealth**, expected utility forces marginal utility to fall by the factor ${v.fix(100 / g, 3)} every $\\$${g}$, so no gain can ever add more than ${v.fix(cap, 2)} units of $r$, while losing ${usd(L)} costs at least ${v.fix(lossU, 2)}. Hence you must also turn down lose ${usd(L)} / gain **${isFinite(G) ? usd(G) : 'any amount whatsoever'}**. A CARA utility rejecting the small bet has $a \\ge ${a.toFixed(7)}$ (Rabin's Table III) and refuses to risk ${usd(Math.log(2) / a)} against an infinite gain.`;
        });
      },
    },
  ],
};
