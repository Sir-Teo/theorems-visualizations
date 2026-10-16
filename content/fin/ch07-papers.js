// Finance — Chapter 7, landmark paper: Merton (1973).
//
// Data: none — the paper derives restrictions that hold for any prices consistent with no dominance; the option prices
// below are set by the reader (default: Black–Scholes prices for S = 100, r = 5%, σ = 25%, T = 1, an illustrative
// choice). The restrictions shown are the paper's Theorems 1–8 for calls on a non-dividend-paying stock in modern
// form: C ≥ max(0, S − K e^{−rT}), C ≤ S, C non-increasing and convex in K with slope ≥ −e^{−rT}, and the American call
// is never exercised early (Theorem 1 and its corollary), so its price equals the European price.

const SPOT = 100, RATE = 0.05, TMAT = 1, VOL = 0.25;
const STRIKES = [70, 85, 100, 115, 130];
function bsCall(M, S, K, r, s, T) { if (T <= 0) return Math.max(0, S - K); const d1 = (Math.log(S / K) + (r + (s * s) / 2) * T) / (s * Math.sqrt(T)), d2 = d1 - s * Math.sqrt(T); const N = (x) => 0.5 * M.erfc(-x / Math.SQRT2); return S * N(d1) - K * Math.exp(-r * T) * N(d2); }

/** Find the first violated restriction and the riskless trade that exploits it. Positions: [{type:'C'|'S'|'B', K?, q}] (q > 0 buy). */
function findArb(C, disc) {
  const n = C.length;
  for (let i = 0; i < n; i++) {
    const K = STRIKES[i];
    if (C[i] > SPOT + 1e-9) return { rule: `upper bound C(${K}) ≤ S`, pos: [{ type: 'C', K, q: -1 }, { type: 'S', q: 1 }], cash: C[i] - SPOT };
    if (C[i] < Math.max(0, SPOT - K * disc) - 1e-9) return { rule: `lower bound C(${K}) ≥ S − K e^{−rT}`, pos: [{ type: 'C', K, q: 1 }, { type: 'S', q: -1 }, { type: 'B', K, q: 1 }], cash: SPOT - K * disc - C[i] };
  }
  for (let i = 0; i + 1 < n; i++) {
    const K1 = STRIKES[i], K2 = STRIKES[i + 1];
    if (C[i + 1] > C[i] + 1e-9) return { rule: `monotone: C(${K1}) ≥ C(${K2})`, pos: [{ type: 'C', K: K1, q: 1 }, { type: 'C', K: K2, q: -1 }], cash: C[i + 1] - C[i] };
    if (C[i] - C[i + 1] > (K2 - K1) * disc + 1e-9) return { rule: `slope: C(${K1}) − C(${K2}) ≤ (K₂ − K₁) e^{−rT}`, pos: [{ type: 'C', K: K1, q: -1 }, { type: 'C', K: K2, q: 1 }, { type: 'B', K: K2 - K1, q: 1 }], cash: C[i] - C[i + 1] - (K2 - K1) * disc };
  }
  for (let i = 0; i + 2 < n; i++) {
    const K1 = STRIKES[i], K2 = STRIKES[i + 1], K3 = STRIKES[i + 2], w = (K3 - K2) / (K3 - K1);
    const lin = w * C[i] + (1 - w) * C[i + 2];
    if (C[i + 1] > lin + 1e-9) return { rule: `convexity in K at ${K2}`, pos: [{ type: 'C', K: K1, q: w }, { type: 'C', K: K2, q: -1 }, { type: 'C', K: K3, q: 1 - w }], cash: C[i + 1] - lin };
  }
  return null;
}
const payoff = (pos, ST) => pos.reduce((s, p) => s + p.q * (p.type === 'C' ? Math.max(0, ST - p.K) : p.type === 'S' ? ST : p.K), 0);

export default {
  collection: 'fin',
  chapter: 7,
  items: [
    {
      num: '7.10',
      kind: 'Paper',
      name: 'Theory of Rational Option Pricing',
      paper: { authors: 'Robert C. Merton', year: 1973, title: 'Theory of Rational Option Pricing', venue: 'Bell Journal of Economics and Management Science 4 (1): 141–183', doi: '10.2307/3003143' },
      introduces: ['fin-7.3', 'fin-7.4', 'fin-7.5'],
      statement: String.raw`Without any model of stock prices, the mere absence of dominated securities (no portfolio that pays at least as much in every state and more in some can cost less) restricts option prices. For calls on a stock paying no dividends, with riskless rate $r$ and maturity $T$:
$$\max\!\big(0,\ S - K e^{-rT}\big) \le C(S, K, T) \le S,$$
$C$ is non-increasing and **convex** in the strike, with slope at least $-e^{-rT}$, and non-decreasing in maturity for American options. Since $C \ge S - Ke^{-rT} > S - K$, an American call on a non-dividend-paying stock is worth more alive than exercised: it is **never optimal to exercise it early**, so its price equals the European price. Puts satisfy similar bounds, and early exercise of an American put can be optimal.

Under the further assumptions of continuous trading and a log-normal stock price, Merton derived the Black–Scholes formula by a dynamic replication argument and extended it to dividends, stochastic interest rates and other contracts.`,
      idea: String.raw`Black and Scholes (1973) had priced options by forming a riskless hedge; Merton, who helped make that argument rigorous, used the same paper to separate what follows from no-arbitrage alone from what needs a model. Each restriction is proved by exhibiting a dominating portfolio (fin-7.1): for example a call at strike $K$ plus $Ke^{-rT}$ in bonds pays at least the stock at expiry, so it cannot cost less than the stock. This "rational pricing" (fin-7.3) style of argument — bounds and parity relations (fin-7.4) that hold for any price process, with the continuous-time hedging argument (fin-1.13) for exact prices (fin-7.5) — became the method of financial engineering. Merton and Scholes received the 1997 Nobel Prize; Black had died in 1995.`,
      caption: String.raw`Five call prices at strikes 70–130 (gold handles, starting from Black–Scholes prices with σ = 25%, grey, except that the middle one is pushed up by 6, which breaks convexity). The shaded band is Merton's no-arbitrage region between $\max(0, S - Ke^{-rT})$ and $S$. **Drag a price** out of the band, make prices rise with strike, make the slope too steep or bend them non-convex: the first violated restriction is named and the **riskless trade** that exploits it appears on the right, with its payoff at expiry in every state (never negative) and the cash it pays today. **Middle**: the value of an American call over time to maturity versus exercising now: holding is always worth more than $S - K$.`,
      deps: ['fin-7.1', 'fin-1.13'],
      refs: [],
      tags: ['options', 'arbitrage', 'history'],
      credit: 'Robert C. Merton, 1973',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rational_pricing' },
      viz(v) {
        const M = v.M;
        const disc = Math.exp(-RATE * TMAT);
        const bs = STRIKES.map((K) => bsCall(M, SPOT, K, RATE, VOL, TMAT));
        const P = v.stage({ x: [60, 140], y: [0, 105], axes: 'box', gutter: true, height: 330, weight: 1.1, minWidth: 260, xlabel: 'strike K', ylabel: 'call price C', title: 'call prices across strikes (S = 100)' });
        const H = STRIKES.map((K, i) => P.handle(K, bs[i] + (i === 2 ? 6 : 0), { color: 'gold', constrain: (x, y) => [K, M.clamp(y, 0, 108)] }));
        v.button('Reset to Black–Scholes', () => H.forEach((h, i) => h.set(STRIKES[i], bs[i])));
        v.button('Example: non-convex', () => { H.forEach((h, i) => h.set(STRIKES[i], bs[i])); H[2].set(100, bs[2] + 6); });
        const E = v.stage({ x: [0, 1], y: [0, 30], axes: 'box', gutter: true, height: 330, weight: 0.9, minWidth: 230, xlabel: 'time to maturity τ (years)', ylabel: 'value (K = 100)', title: 'never exercise early' });
        const A = v.stage({ x: [0, 200], y: [-20, 60], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, xlabel: 'stock price at expiry S_T', ylabel: 'payoff of the trade', title: 'the riskless trade' });
        let st = null;
        v.render(() => {
          const C = H.map((h) => h.y);
          // no-arbitrage band
          P.between((K) => SPOT, (K) => Math.max(0, SPOT - K * disc), 60, 140, { fill: 'green', fillAlpha: 0.1 });
          P.fn((K) => Math.max(0, SPOT - K * disc), { color: 'green', width: 1.6 });
          P.hline(SPOT, { color: 'green', width: 1.6 });
          P.text('C ≤ S', 138, SPOT, { dy: -8, align: 'right', size: 11.5, color: 'green', weight: 600 });
          P.text('C ≥ S − K e^(−rT)', 64, SPOT - 64 * disc, { dx: 4, dy: -4, align: 'left', size: 11.5, color: 'green', weight: 600, baseline: 'bottom' });
          P.fn((K) => bsCall(M, SPOT, K, RATE, VOL, TMAT), { color: 'muted', width: 1.4, dash: [6, 4], domain: [60, 140] });
          P.path(STRIKES.map((K, i) => [K, C[i]]), { color: 'gold', width: 2 });
          const arb = findArb(C, disc);
          if (arb) { const ks = arb.pos.filter((p) => p.type === 'C').map((p) => p.K); for (const K of ks) { const i = STRIKES.indexOf(K); P.dot(K, C[i], { r: 11, hollow: true, color: 'red', width: 2 }); } }
          // early exercise panel: American call value (= European, no dividends) against tau, intrinsic value at S = 100, K = 100 and S = 120
          for (const [S0, col] of [[100, 'accent'], [120, 'purple']]) {
            E.fn((tau) => bsCall(M, S0, 100, RATE, VOL, tau), { color: col, width: 2.4, domain: [0, 1] });
            E.fn((tau) => S0 - 100 * Math.exp(-RATE * tau), { color: col, width: 1.2, dash: [5, 4], domain: [0, 1] });
            E.hline(Math.max(0, S0 - 100), { color: col, width: 1, alpha: 0.6 });
            E.text(`S = ${S0}: exercise now = ${Math.max(0, S0 - 100)}`, 0.98, Math.max(0, S0 - 100), { dy: S0 === 100 ? -8 : 14, align: 'right', size: 10.5, color: col, weight: 600 });
          }
          // arbitrage panel
          if (arb) {
            A.hline(0, { color: 'faint', width: 1 });
            A.fn((ST) => payoff(arb.pos, ST), { color: 'green', width: 2.6, domain: [0, 200], n: 400 });
            A.fn((ST) => payoff(arb.pos, ST) + arb.cash / disc, { color: 'teal', width: 1.4, dash: [6, 4], domain: [0, 200], n: 400 });
            A.corner(`cash today: +${v.fix(arb.cash, 2)}`, 'tl', { size: 12.5, weight: 700, color: 'green' });
          } else {
            A.hline(0, { color: 'faint', width: 1 });
            A.text('no riskless trade:', 100, 30, { size: 13, weight: 700, color: 'green', align: 'center' });
            A.text('all of Merton’s restrictions hold', 100, 22, { size: 12, color: 'green', align: 'center' });
          }
          st = { arb, C };
        });
        v.legend([['green', 'no-arbitrage bounds / arbitrage payoff'], ['muted', 'Black–Scholes reference', { dash: true }], ['accent', 'American call, S = 100'], ['purple', 'S = 120'], ['teal', 'payoff + cash invested', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { arb, C } = st;
          const prices = C.map((c, i) => `C(${STRIKES[i]}) = ${v.fix(c, 2)}`).join(', ');
          if (!arb) return `${prices}: inside every bound — a price system with no dominated portfolio. American call at S = K = 100, τ = 1: ${v.fix(bsCall(M, 100, 100, RATE, VOL, 1), 2)} > $S - Ke^{-rT}$ = ${v.fix(100 - 100 * disc, 2)} > $S - K$ = 0, so exercising early throws away value.`;
          const legs = arb.pos.map((p) => `${p.q > 0 ? 'buy' : 'sell'} ${Math.abs(p.q) === 1 ? '' : v.fix(Math.abs(p.q), 2) + ' × '}${p.type === 'C' ? `call ${p.K}` : p.type === 'S' ? 'stock' : `bond paying ${p.K}`}`).join(', ');
          let mn = Infinity; for (let s = 0; s <= 300; s += 0.5) mn = Math.min(mn, payoff(arb.pos, s));
          return `violated: **${arb.rule}** → ${legs}: receive **${v.fix(arb.cash, 2)} today** and the payoff at expiry is never below ${v.fix(Math.max(0, mn), 2)} — free money, so such prices cannot persist.`;
        });
      },
    },
  ],
};
