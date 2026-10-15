// Finance — Chapter 9: landmark paper written early as a flagship item (9.13, Black & Scholes 1973).
//
// Verified against the paper (J. Polit. Econ. 81 (3): 637–654): Fig. 1 "The relation between option value and stock
// price", exercise price $20, stock price $0–40, line A (value = stock price, the maximum), line B (max(x − c, 0), the
// minimum), curves T1, T2, T3 for successively shorter maturities (p. 638); notation w(x, t), x stock price, c exercise
// price, t* maturity, r interest rate, v² variance rate; PDE (7) w₂ = r w − r x w₁ − ½ v² x² w₁₁; formula (13)
// w = x N(d₁) − c e^{r(t − t*)} N(d₂) (p. 644); "Empirical Tests" (p. 653): option buyers pay prices consistently higher
// than the formula, writers receive about the formula, and the market underestimates the effect of differences in
// variance rate. Today's comparison: since 1987, index-option implied volatilities slope downward across strikes
// (Rubinstein, J. Finance 1994; Jackwerth's review).

const C = 20; // exercise price, as in the paper's Figure 1
const Phi = (M, z) => 0.5 * M.erfc(-z / Math.SQRT2);
/** Black–Scholes call value w(x, τ) and hedge ratio w₁ = N(d₁) (τ = t* − t in years). */
function bs(M, x, tau, v, r) {
  if (tau <= 1e-9) return { w: Math.max(x - C, 0), d1: x > C ? Infinity : -Infinity, delta: x > C ? 1 : 0 };
  if (x <= 1e-12) return { w: 0, delta: 0 };
  const s = v * Math.sqrt(tau), d1 = (Math.log(x / C) + (r + v * v / 2) * tau) / s, d2 = d1 - s;
  return { w: x * Phi(M, d1) - C * Math.exp(-r * tau) * Phi(M, d2), d1, delta: Phi(M, d1) };
}
/** One delta hedge: sell the option at the formula price, hold w₁ shares, rest in bonds, rebalance n times. */
function hedgePath(M, R, x0, T, v, r, mu, n) {
  const dt = T / n, xs = [x0], ws = [], pis = [];
  let x = x0, { w, delta } = bs(M, x, T, v, r), B = w - delta * x;
  ws.push(w); pis.push(w);
  for (let i = 1; i <= n; i++) {
    x *= Math.exp((mu - v * v / 2) * dt + v * Math.sqrt(dt) * R.normal());
    B *= Math.exp(r * dt);
    const pi = delta * x + B, tau = T - i * dt, b = bs(M, x, tau, v, r);
    xs.push(x); pis.push(pi); ws.push(b.w);
    delta = b.delta; B = pi - delta * x;
  }
  return { xs, ws, pis, payoff: Math.max(x - C, 0), err: pis[n] - Math.max(x - C, 0) };
}
const usd = (x, d = 2) => `$\\$${x.toFixed(d)}$`; // dollars inside TeX (a bare $ would open math)

export default {
  collection: 'fin',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.13
    {
      num: '9.13',
      kind: 'Paper',
      name: 'The Pricing of Options and Corporate Liabilities',
      paper: { authors: 'Fischer Black and Myron Scholes', year: 1973, title: 'The Pricing of Options and Corporate Liabilities', venue: 'Journal of Political Economy 81 (3): 637–654', doi: '10.1086/260062' },
      introduces: ['fin-9.1', 'fin-9.3', 'fin-7.9'],
      statement: String.raw`Black and Scholes derived the value of a European call option from an argument that needs no forecast of the stock's return. Assume the stock price $x$ follows a geometric Brownian motion with constant variance rate $v^2$, the short interest rate $r$ is constant, trading is continuous and frictionless, and there are no dividends. Holding one share and short $1/w_1$ options (where $w_1=\partial w/\partial x$) is riskless over an instant, so it must earn $r$; this forces the option value $w(x,t)$ to satisfy
$$w_2 = r w - r x w_1 - \tfrac12 v^2 x^2 w_{11},\qquad w(x,t^*)=\max(x-c,0),$$
whose unique solution is
$$w(x,t)=x\,N(d_1)-c\,e^{r(t-t^*)}N(d_2),\quad d_{1,2}=\frac{\ln(x/c)+(r\pm\tfrac12v^2)(t^*-t)}{v\sqrt{t^*-t}} .$$
The expected return on the stock does not appear. The same reasoning values corporate liabilities: a company's stock is a call on its assets with the face value of its debt as exercise price, so bonds, warrants and other claims can be priced as options.`,
      idea: String.raw`Earlier formulas for warrants (Sprenkle, Samuelson and others, all cited in the paper) discounted an expected payoff and needed unknown parameters for the stock's expected return and for risk. Black and Scholes, helped by Merton, removed them: because the option and the stock move together, a continuously adjusted hedge cancels the risk, and an asset without risk can only earn the riskless rate. That turns pricing into a heat-equation boundary-value problem, which they solved in closed form (the Black–Scholes–Merton PDE and formula, fin-9.1 and fin-9.3, built on Itô's formula, stoch-13.13, lognormal prices, fin-8.7, and the hedging idea of the binomial tree, fin-8.5). Their reading of stock as a call on the firm (fin-7.9) founded structural credit models. The Chicago Board Options Exchange opened in 1973, practitioners adopted the formula almost at once, and Scholes and Merton received the 1997 Nobel memorial prize (Black had died in 1995).`,
      caption: String.raw`Top left: the price surface $w(x,\tau)$ over stock price and time to maturity (drag to rotate), with the payoff $\max(x-c,0)$ at $\tau=0$. Top right: the paper's Figure 1, exercise price $\$20$, lines A and B bounding the curves $T_1>T_2>T_3$; drag the gold handle to move the stock price and read the hedge ratio from the tangent. Bottom: one simulated price path and the **delta hedge**: starting from the formula price, hold $w_1$ shares and bonds, rebalance $n$ times, and the portfolio (orange) tracks the option value (blue) to the payoff. Change the drift $\mu$: the hedge still works, which is why $\mu$ is not in the formula.`,
      deps: ['fin-8.5', 'fin-8.7', 'stoch-13.13'],
      refs: [],
      tags: ['options', 'history'],
      credit: 'Black & Scholes, 1973',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Black%E2%80%93Scholes_model' },
      viz(v) {
        const M = v.M;
        const vS = v.slider('volatility $v$', 0.05, 0.8, 0.3, { step: 0.01 });
        const rS = v.slider('interest rate $r$', 0, 0.15, 0.05, { step: 0.0025, fmt: (x) => `${(100 * x).toFixed(1)}%` });
        const TS = v.slider('longest maturity $T_1$ (years)', 0.1, 3, 1, { step: 0.05 });
        const muS = v.slider('stock drift $\\mu$', -0.3, 0.5, 0.15, { step: 0.01, fmt: (x) => `${(100 * x).toFixed(0)}%` });
        const nS = v.slider('rebalances $n$', 4, 1000, 52, { log: true, int: true });
        let pathSeed = 1;
        v.button('New path', () => { pathSeed++; });
        const S3 = v.stage3d({ height: 310, range: 1.6, yaw: -0.85, pitch: 0.38, axes: false, weight: 1, minWidth: 380, title: 'the price surface w(x, τ)' });
        const F = v.stage({ x: [0, 40], y: [0, 40], height: 310, axes: 'box', xlabel: 'stock price x ($)', ylabel: 'option value w ($)', weight: 1, minWidth: 380, title: 'Figure 1: exercise price c = 20 dollars' });
        const P = v.stage({ x: [0, 1], y: [10, 30], height: 250, axes: 'box', ylabel: 'stock ($)', weight: 1, minWidth: 380, title: 'a simulated stock path (time in years →)' });
        const H = v.stage({ x: [0, 1], y: [0, 10], height: 250, axes: 'box', ylabel: 'value ($)', weight: 1, minWidth: 380, title: 'the delta hedge: portfolio vs option value' });
        const hx = F.handle(20, 0, { color: 'gold', label: 'x₀', labelPos: 'n', constrain: (x) => [M.clamp(x, 4, 38), 0] });
        // caches
        let mcKey = '', mc = null, rmsKey = '', rms = null;
        const monteCarlo = (x0, T, v0, r) => {
          const R = M.rng(1973), N = 20000; let s = 0, s2 = 0;
          for (let i = 0; i < N; i++) { const xT = x0 * Math.exp((r - v0 * v0 / 2) * T + v0 * Math.sqrt(T) * R.normal()), y = Math.exp(-r * T) * Math.max(xT - C, 0); s += y; s2 += y * y; }
          const m = s / N; return { m, se: Math.sqrt((s2 / N - m * m) / N), N };
        };
        v.legend([['blue', 'T₁ (longest)'], ['teal', 'T₂ = T₁/3'], ['purple', 'T₃ = T₁/12'], ['green', 'payoff at expiry', { dot: true }], ['ink', 'line B: max(x − c, 0)'], ['muted', 'line A: w = x', { dash: true }], ['orange', 'replicating portfolio'], ['gold', 'stock path']]);
        let st = null;
        v.render(() => {
          const v0 = vS.value, r = rS.value, T = TS.value, mu = muS.value, n = nS.value, x0 = hx.x;
          const taus = [T, T / 3, T / 12], cols = ['blue', 'teal', 'purple'];
          // ---- surface, scaled into the cube [−1, 1]³: x ∈ [0, 40] → X, τ ∈ [0, T] → Y, w ∈ [0, 25] → Z
          const X = (x) => x / 20 - 1, Y = (t) => (t / T) * 2 - 1, Z = (w) => w / 12.5 - 1;
          S3.surface((x, t) => [X(x), Y(t), Z(Math.min(bs(M, x, t, v0, r).w, 25))], [0, 40], [0, T], { nu: 30, nv: 16, color: 'blue', alpha: 0.85, wire: true });
          S3.path(Array.from({ length: 41 }, (_, i) => [X(i), Y(0), Z(Math.max(i - C, 0))]), { color: 'ink', width: 2.6 });
          taus.forEach((t, k) => S3.path(Array.from({ length: 81 }, (_, i) => [X(i / 2), Y(t), Z(Math.min(bs(M, i / 2, t, v0, r).w, 25)) + 0.01]), { color: cols[k], width: 2.4 }));
          S3.path([[X(x0), Y(0), Z(0)], [X(x0), Y(T), Z(0)]], { color: 'gold', width: 1.6 });
          const box = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, -1]];
          S3.path(box, { color: 'faint', width: 1 }); S3.path([[-1, -1, -1], [-1, -1, 1]], { color: 'faint', width: 1 });
          S3.text('stock price x', [0, -1.3, -1], { color: 'muted', size: 12 }); S3.text('τ = t* − t', [1.3, 0, -1], { color: 'muted', size: 12 }); S3.text('w = 25', [-1, -1, 1.1], { color: 'muted', size: 11 });
          S3.text('$40', [1, -1.12, -1], { color: 'muted', size: 11 }); S3.text(`${T.toFixed(2)} yr`, [1.15, 1, -1], { color: 'muted', size: 11 });
          // ---- Figure 1
          F.line(0, 0, 40, 40, { color: 'muted', width: 1.5, dash: [7, 5] });
          F.fn((x) => Math.max(x - C, 0), { color: 'ink', width: 2.2 });
          F.text('A', 37.5, 37.5, { color: 'muted', weight: 700, dx: -12 }); F.text('B', 38.5, 18.5, { color: 'ink', weight: 700, dy: 10 });
          taus.forEach((t, k) => { F.fn((x) => bs(M, x, t, v0, r).w, { color: cols[k], width: 2.4 }); });
          const b0 = bs(M, x0, T, v0, r);
          F.clip(() => F.line(x0 - 9, b0.w - 9 * b0.delta, x0 + 9, b0.w + 9 * b0.delta, { color: 'gold', width: 1.8 }));
          F.vline(x0, { color: 'gold', width: 1, dash: [3, 4] });
          F.dot(x0, b0.w, { r: 5.5, color: 'gold' });
          const tx = Math.min(x0 + 7, 30), ty = b0.w + (tx - x0) * b0.delta;
          F.text(`slope w₁ = N(d₁) = ${b0.delta.toFixed(3)}`, tx, ty, { color: 'gold', weight: 700, size: 12, dx: -4, dy: -12, align: 'right' });
          // ---- one hedge
          const h = hedgePath(M, M.rng(9130 + pathSeed), x0, T, v0, r, mu, n);
          const ts = h.xs.map((_, i) => (i * T) / n);
          const lo = Math.min(...h.xs, C), hi = Math.max(...h.xs, C), pad = 0.08 * (hi - lo + 1);
          P.setView([0, T], [lo - pad, hi + pad]);
          P.hline(C, { color: 'muted', width: 1.2, dash: [5, 4] }); P.text('exercise price c = $20', T * 0.02, C, { color: 'muted', size: 11.5, dy: -9 });
          P.path(ts.map((t, i) => [t, h.xs[i]]), { color: 'gold', width: 1.8 });
          if (n <= 80) P.dots(ts.map((t, i) => [t, h.xs[i]]), { r: 2.4, color: 'gold' });
          const top = Math.max(...h.ws, ...h.pis, 1) * 1.15, bot = Math.min(0, ...h.pis) - 0.05 * top;
          H.setView([0, T], [bot, top]);
          H.path(ts.map((t, i) => [t, h.ws[i]]), { color: 'blue', width: 2.2 });
          H.path(ts.map((t, i) => [t, h.pis[i]]), { color: 'orange', width: 1.6 });
          if (n <= 80) H.dots(ts.map((t, i) => [t, h.pis[i]]), { r: 2.6, color: 'orange' });
          H.dot(T, h.payoff, { r: 7, color: 'green', hollow: true, width: 2.6 });
          H.text('payoff', T, h.payoff, { color: 'green', weight: 700, size: 12, dx: -12, dy: -14, align: 'right' });
          H.dot(T, h.pis[n], { r: 4, color: 'orange' });
          // ---- Monte Carlo and RMS hedging error (cached)
          const k1 = [x0.toFixed(3), T, v0, r].join('|');
          if (k1 !== mcKey) { mcKey = k1; mc = monteCarlo(x0, T, v0, r); }
          const k2 = [x0.toFixed(3), T, v0, r, mu, n].join('|');
          if (k2 !== rmsKey) { rmsKey = k2; const R = M.rng(42); let s2 = 0; const K = 200; for (let i = 0; i < K; i++) { const e = hedgePath(M, R, x0, T, v0, r, mu, n).err; s2 += e * e; } rms = Math.sqrt(s2 / K); }
          st = { x0, T, v0, r, mu, n, b0, h };
        });
        v.readout(() => {
          if (!st) return '';
          const { x0, T, v0, mu, n, b0, h } = st;
          return `At $x_0$ = ${usd(x0)}, $T_1$ = ${T.toFixed(2)} yr, $v$ = ${(100 * v0).toFixed(0)}%: formula (13) gives **${usd(b0.w, 3)}**; Monte Carlo over ${mc.N.toLocaleString('en-US')} risk-neutral paths gives **${usd(mc.m, 3)} ± ${mc.se * 1.96 < 0.0005 ? '0.000' : (mc.se * 1.96).toFixed(3)}** (95%) · hedge ratio $w_1=N(d_1)$ = ${b0.delta.toFixed(3)} shares per option · this path: the hedge, rebalanced ${n} times, ends at ${usd(h.pis[n])} against a payoff of ${usd(h.payoff)} (error ${h.err >= 0 ? '+' : '−'}${usd(Math.abs(h.err))}); over 200 paths the RMS error is ${usd(rms, 3)}, shrinking like $1/\\sqrt n$ · the drift $\\mu$ = ${(100 * mu).toFixed(0)}% changes the path, not the price · the paper's own tests: buyers paid consistently more than the formula, writers about the formula, and the market underweighted differences in variance · today: the formula is the market's quoting language, but since the 1987 crash index options trade with a volatility skew it does not have (Rubinstein 1994)`;
        });
      },
    },
  ],
};
