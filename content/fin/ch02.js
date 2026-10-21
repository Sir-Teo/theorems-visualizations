// Finance — Chapter 2: Bonds and the term structure (items 2.1–2.6; 2.7–2.12 are in ch02-b.js)
import { clamp, pct, fx, sg, money, dl, pctTicks, bondFlows, bondPrice, bondDerivs, ytm, macaulay, modified, convexity, interp } from './ch02.shared.js';

export default {
  collection: 'fin',
  chapter: 2,
  title: 'Bonds and the term structure',
  summary: String.raw`A bond’s price is the present value of its coupons and principal; the yield to maturity is the single rate that makes them match. Price falls convexly as yield rises, and duration and convexity measure that sensitivity, which lets a portfolio be immunized against rate changes. Rates differ by maturity: the spot curve, forward rates and the yield curve encode expectations and risk premia.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Definition',
      name: 'Bond prices and yield to maturity',
      statement: String.raw`A **bond** with face value $F$, coupon rate $c$ and $N$ coupon dates promises $F c/m$ at each of the dates $k=1,\dots,N$ ($m$ coupons a year) and $F$ extra at the last. Discounting each payment at one common periodic rate $y/m$ gives its **price as a function of the yield**
$$P(y)=\sum_{k=1}^{N}\frac{CF_k}{(1+y/m)^k},\qquad CF_k=\frac{Fc}{m}\ (k<N),\quad CF_N=\frac{Fc}{m}+F .$$
The **yield to maturity** of a bond trading at market price $P_0$ is the rate $y$ with $P(y)=P_0$. It exists and is unique whenever all cash flows are positive and $0<P_0<\sum_k CF_k$, because $P$ is then continuous and strictly decreasing in $y$ on $(-m,\infty)$. A bond sells at par ($P_0=F$) exactly when $y=c$, at a discount when $y>c$ and at a premium when $y<c$.`,
      idea: String.raw`The yield to maturity is just the internal rate of return (fin 1.7) of buying the bond at $P_0$ and holding it to maturity, with the price playing the role of the outlay. Each term $CF_k(1+y/m)^{-k}$ is strictly decreasing in $y$ and tends to $0$ as $y\to\infty$ and to $+\infty$ as $y\to -m$ along the left end, so the intermediate value theorem gives a solution and monotonicity makes it unique. Being a single number it assumes every payment is reinvested at that same rate; the zero curve of 2.6 relaxes this.`,
      caption: String.raw`Left: the price built up payment by payment. Each step is the present value of one cash flow at the solved yield; the gold step is the principal, and the stack always ends exactly at the dashed market price. Right: the price–yield curve; drag the gold point (or the price slider) and the yield is solved live. Move the point left of the grey line $y=c$ and the bond trades at a premium; right of it, at a discount.`,
      deps: ['fin-1.7', 'fin-1.9'],
      refs: ['Luenberger: Fixed-Income Securities', 'BKM ch. 14'],
      tags: ['bonds', 'yield'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Yield_to_maturity' },
      viz(v) {
        const cS = v.slider('coupon rate $c$', 0, 0.12, 0.06, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const nS = v.slider('maturity (years)', 1, 10, 5, { int: true });
        const fS = v.select('coupons a year', [{ value: '1', label: 'annual' }, { value: '2', label: 'semiannual' }], '1');
        const pS = v.slider('market price (per \\$100 face)', 50, 150, 95, { step: 0.05, fmt: (x) => fx(x, 2) });
        const XR = [-0.02, 0.2];
        const L = v.stage({ x: [0, 6], y: [0, 120], height: 320, axes: 'box', gutter: true, weight: 1.15, minWidth: 320, xlabel: 'years', ylabel: 'cumulative present value (USD)', title: 'the price, one discounted payment at a time' });
        const R = v.stage({ x: XR, y: [0, 200], height: 320, axes: 'box', gutter: true, weight: 1, minWidth: 280, xlabel: 'yield $y$', ylabel: 'price $P(y)$ (USD)', xticks: pctTicks(0, 0.2, 0.05), title: 'the price–yield curve' });
        const mm = () => +fS.value;
        const curve = (x) => bondPrice(bondFlows(cS.value, nS.value, mm()), x, mm());
        const h = R.handle(0.06, 100, { color: 'gold', label: 'y', labelPos: 'ne', constrain: (x) => { const xx = clamp(x, XR[0], XR[1]); return [xx, curve(xx)]; } });
        h.onDrag = () => pS.set(clamp(curve(h.x), 50, 150));
        v.legend([['accent', 'PV of a coupon', { area: true }], ['gold', 'PV of the principal', { area: true }], ['orange', 'market price', { dash: true }]]);
        let info = {};
        v.render(() => {
          const c = cS.value, n = nS.value, m = mm(), P0 = pS.value, fl = bondFlows(c, n, m), y = ytm(fl, P0, m);
          const ok = Number.isFinite(y), yy = ok ? y : 0;
          // left: waterfall of discounted payments
          const top = Math.max(P0, 100) * 1.1;
          L.setView([0.3 / m, n + 0.7 / m], [0, top]);
          let cum = 0;
          const w = 0.34 / m;
          for (const f of fl) {
            const pv = f.cf * Math.pow(1 + yy / m, -f.k), last = f.k === fl.length;
            L.rect(f.t - w, cum, f.t + w, cum + pv, { fill: last ? 'gold' : 'accent', fillAlpha: 0.75, color: last ? 'gold' : 'accent', width: 1 });
            if (fl.length <= 10) L.text(fx(pv, 2), f.t, cum + pv, { dy: -9, size: 11, color: 'muted', align: 'center' });
            cum += pv;
          }
          L.hline(P0, { color: 'orange', width: 1.6, dash: [6, 4] });
          L.text(`price ${money(P0, 2)}`, 0.3 / m, P0, { dx: 6, dy: 14, color: 'orange', align: 'left', size: 12, weight: 700 });
          // right: price-yield curve
          const ymax = Math.max(curve(XR[0]), P0) * 1.06;
          R.setView(XR, [0, ymax]);
          R.vline(c, { color: 'faint', width: 1.4 });
          R.text('y = c (par)', c, ymax, { dx: 4, dy: 12, align: 'left', size: 11, color: 'muted' });
          R.hline(100, { color: 'faint', width: 1, dash: [3, 3] });
          R.fn(curve, { color: 'accent', width: 2.6 });
          if (ok) {
            R.hline(P0, { color: 'orange', width: 1.4, dash: [6, 4] });
            R.vline(yy, { color: 'gold', width: 1.2, dash: [4, 3] });
            h.set(clamp(yy, XR[0], XR[1]), P0);
          }
          info = { ok, y, c, P0, m, sum: cum, eff: Math.pow(1 + yy / m, m) - 1, cur: (c * 100) / P0 };
        });
        v.readout(() => {
          const t = info;
          if (!t.ok) return String.raw`No yield solves this price (it lies outside what the cash flows can reach).`;
          const state = Math.abs(t.P0 - 100) < 0.005 ? 'par: $y=c$' : t.P0 > 100 ? 'premium: $y<c$' : 'discount: $y>c$';
          return String.raw`yield to maturity $y=${pct(t.y, 3)}$ (${t.m === 1 ? 'annual' : 'semiannual'} compounding; effective ${pct(t.eff, 3)})  ·  ${state}` + '\n' +
            String.raw`$\sum_k \mathrm{PV}(CF_k)=${dl(t.sum, 4)}$ vs market price ${dl(t.P0, 4)}  ·  current yield $c F/P_0=${pct(t.cur, 2)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Prices fall convexly as yields rise',
      statement: String.raw`Let $CF_1,\dots,CF_N\ge 0$ be the cash flows of a bond (not all zero) paid at times $t_k>0$, and let $P(y)=\sum_k CF_k(1+y)^{-t_k}$ for $y>-1$. Then $P$ is strictly decreasing and strictly convex:
$$P'(y)=-\sum_k t_k\,CF_k(1+y)^{-t_k-1}<0,\qquad P''(y)=\sum_k t_k(t_k+1)\,CF_k(1+y)^{-t_k-2}>0 .$$
So a given rise in yield lowers the price by *less* than the same fall in yield raises it, and every chord of the price–yield curve lies above the curve. The hypothesis $CF_k\ge0$ is essential: with negative payments (a loan embedded in the bond) convexity can fail.`,
      idea: String.raw`Each term $CF_k\,(1+y)^{-t_k}$ is a positive multiple of a convex decreasing function of $y$ (the exponential $e^{-t\ln(1+y)}$ composed with an increasing concave map keeps the sign of the second derivative positive), and a sum of convex functions with non-negative weights is convex (the Jensen inequality of rca 3.1 for each term). Differentiating term by term gives the formulas, all of whose summands are positive. Longer maturities carry larger $t_k$, hence larger $P''$ and a steeper, more curved graph.`,
      caption: String.raw`Choose a maturity; its curve is drawn bold among the others (same coupon). Drag the two gold points: the chord always lies above the curve, and the right panel shows $P''(y)$, positive everywhere. Now turn the knob *middle payment* below $1$: the payment in the middle of the bond's life is multiplied by that factor, and once it is negative $P''$ turns red on part of the axis and the chord dips below the curve there — convexity needs non-negative cash flows.`,
      deps: ['fin-2.1', 'rca-3.1'],
      refs: ['Luenberger: Fixed-Income Securities'],
      tags: ['bonds', 'convexity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bond_convexity' },
      viz(v) {
        const MATS = [2, 5, 10, 30], COL = ['teal', 'accent', 'orange', 'purple'];
        const XR = [0, 0.15];
        const cS = v.slider('coupon rate $c$ (annual)', 0, 0.10, 0.05, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const mS = v.select('maturity (years)', MATS.map((x) => ({ value: String(x), label: String(x) })), '10');
        const wS = v.slider('middle payment × (1 = ordinary bond)', -60, 1, 1, { step: 0.5, fmt: (x) => fx(x, 2) });
        const L = v.stage({ x: XR, y: [0, 300], height: 330, axes: 'box', gutter: true, weight: 1.2, minWidth: 320, xlabel: 'yield $y$', ylabel: 'price (USD per 100 face)', xticks: pctTicks(0, 0.15, 0.025, 1), title: 'price–yield curves and a chord' });
        const R = v.stage({ x: XR, y: [-1, 1], height: 330, axes: 'box', gutter: true, weight: 1, minWidth: 280, xlabel: 'yield $y$', ylabel: "$P''(y)$ (per 1 of face)", xticks: pctTicks(0, 0.15, 0.025, 1), title: 'the second derivative of the selected bond' });
        const flowsFor = (n, w) => { const fl = bondFlows(cS.value, n, 1); const mid = Math.max(1, Math.round(n / 2)); if (w !== 1 && mid < n) fl[mid - 1].cf *= w; return fl; };
        const cur = () => flowsFor(+mS.value, wS.value);
        const P = (x) => bondPrice(cur(), x, 1);
        const ca = L.handle(0.03, 100, { color: 'gold', label: 'a', labelPos: 'ne', constrain: (x) => { const xx = clamp(x, 0.002, 0.148); return [xx, P(xx)]; } });
        const cb = L.handle(0.10, 80, { color: 'gold', label: 'b', labelPos: 'ne', constrain: (x) => { const xx = clamp(x, 0.002, 0.148); return [xx, P(xx)]; } });
        v.legend([['teal', '2 years'], ['accent', '5 years'], ['orange', '10 years'], ['purple', '30 years'], ['gold', 'chord $ab$']]);
        let info = {};
        v.render(() => {
          const sel = +mS.value, w = wS.value, fl = cur();
          let lo = Infinity, hi = -Infinity;
          MATS.forEach((n) => { const f = n === sel ? fl : flowsFor(n, 1); for (const y of [0.005, 0.15]) { const p = bondPrice(f, y, 1); lo = Math.min(lo, p); hi = Math.max(hi, p); } });
          const f0 = bondPrice(fl, 0.005, 1), f1 = bondPrice(fl, 0.15, 1);
          lo = Math.min(lo, f0, f1, 0); hi = Math.max(hi, f0, f1);
          L.setView(XR, [lo - 0.04 * (hi - lo), hi * 1.06]);
          MATS.forEach((n, i) => { if (n !== sel) L.fn((y) => bondPrice(flowsFor(n, 1), y, 1), { color: COL[i], width: 1.4, alpha: 0.4 }); });
          L.fn(P, { color: COL[MATS.indexOf(sel)], width: 3 });
          ca.y = P(ca.x); cb.y = P(cb.x);
          const [xa, xb] = ca.x < cb.x ? [ca.x, cb.x] : [cb.x, ca.x];
          L.line(xa, P(xa), xb, P(xb), { color: 'gold', width: 2 });
          const xm = (xa + xb) / 2, pm = P(xm), cm = (P(xa) + P(xb)) / 2;
          L.dot(xm, pm, { r: 4.5, color: 'accent' });
          L.dot(xm, cm, { r: 4.5, color: 'gold' });
          // right: second derivative
          const D2 = (y) => bondDerivs(fl, y, 1)[1] / 100;
          const ys = v.M.linspace(0.002, 0.15, 120), d2 = ys.map(D2);
          const mx = Math.max(...d2.map(Math.abs), 1e-6);
          R.setView(XR, [-1.1 * mx, 1.1 * mx]);
          R.hline(0, { color: 'ink', width: 1 });
          R.fn((y) => Math.max(D2(y), 0), { domain: [0.002, 0.15], fill: 'green', fillAlpha: 0.25, color: 'green', width: 0, base: 0 });
          R.fn((y) => Math.min(D2(y), 0), { domain: [0.002, 0.15], fill: 'red', fillAlpha: 0.3, color: 'red', width: 0, base: 0 });
          R.fn(D2, { color: 'ink', width: 2.2 });
          const neg = d2.filter((x) => x < 0).length / d2.length;
          info = { sel, w, gap: cm - pm, xa, xb, pm, cm, neg, min: Math.min(...d2) };
        });
        v.readout(() => {
          const t = info;
          return String.raw`chord midpoint $${dl(t.cm, 3)}$ vs curve $${dl(t.pm, 3)}$ at $y=${pct((t.xa + t.xb) / 2, 2)}$: gap $${sg(t.gap, 3)}$ ${t.gap >= 0 ? '(chord above the curve, as the theorem says)' : '(the chord is BELOW the curve: not convex here)'}` + '\n' +
            String.raw`$P''<0$ on ${fx(100 * t.neg, 0)}% of $0\le y\le15\%$` + (t.neg > 0 ? String.raw`: a negative payment destroys convexity` : String.raw` ($\min P''=${fx(t.min, 1)}>0$)`);
        });
      },
    },

    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Definition',
      name: 'Macaulay and modified duration',
      statement: String.raw`For a bond with cash flows $CF_k$ at times $t_k$ and present value $P=\sum_k PV_k$ at yield $y$, the **Macaulay duration** is the present-value-weighted average payment date
$$D_{\mathrm{Mac}}=\sum_k t_k\,\frac{PV_k}{P},\qquad PV_k=\frac{CF_k}{(1+y/m)^{m t_k}} ,$$
and the **modified duration** is $D_{\mathrm{mod}}=D_{\mathrm{Mac}}/(1+y/m)$. They are related to the price sensitivity by
$$\frac{P'(y)}{P}=-D_{\mathrm{mod}},\qquad\text{so}\qquad \frac{\Delta P}{P}\approx -D_{\mathrm{mod}}\,\Delta y$$
for a small change $\Delta y$ in the yield. A zero-coupon bond has $D_{\mathrm{Mac}}=T$; every coupon bond has $D_{\mathrm{Mac}}<T$.`,
      idea: String.raw`Differentiate $P(y)=\sum_k CF_k(1+y/m)^{-mt_k}$ term by term (a finite sum, so this is just the chain rule): $P'=-\frac1{1+y/m}\sum_k t_k PV_k$, and dividing by $P$ turns the sum into the weighted average of dates with weights $PV_k/P$, which add to $1$. A weighted average lies between the earliest and latest date, strictly below $T$ when coupons carry positive weight. The first-order Taylor expansion of $P$ (pma 5.1 and the mean value theorem behind it) gives the price-change rule.`,
      caption: String.raw`Top: each payment is a weight on a see-saw, sitting at its payment date with height equal to its share $PV_k/P$ of the price. The beam balances exactly where the gold triangle sits at $D_{\mathrm{Mac}}$; drag the white fulcrum and watch it tilt (it snaps to the balance point). Bottom: the tangent to the price–yield curve at the current yield has slope $-D_{\mathrm{mod}}P$. Raise the coupon and the balance point moves left; a zero-coupon bond balances exactly at its maturity.`,
      deps: ['fin-2.2', 'pma-5.1'],
      refs: ['Luenberger: Fixed-Income Securities', 'BKM ch. 16'],
      tags: ['duration', 'bonds'],
      credit: 'Macaulay, 1938',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bond_duration' },
      viz(v) {
        const cS = v.slider('coupon rate $c$', 0, 0.12, 0.06, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const nS = v.slider('maturity (years)', 1, 30, 10, { int: true });
        const yS = v.slider('yield $y$', 0.005, 0.15, 0.06, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const mS = v.select('coupons a year', [{ value: '1', label: 'annual' }, { value: '2', label: 'semiannual' }], '2');
        const A = v.stage({ x: [0, 11], y: [-0.2, 0.5], height: 250, axes: 'box', gutter: true, full: true, xlabel: 'time (years)', ylabel: 'share of the price', title: 'cash flows as weights on a see-saw' });
        const B = v.stage({ x: [0, 0.15], y: [0, 200], height: 290, axes: 'box', gutter: true, weight: 1, minWidth: 300, xlabel: 'yield $y$', ylabel: 'price (USD)', xticks: pctTicks(0, 0.15, 0.025, 1), title: 'the slope of the price–yield curve' });
        const hf = A.handle(5, 0, { color: 'ink', r: 8, constrain: (x) => [clamp(x, 0, 30), 0] });
        let D = 5;
        const snapFulcrum = () => { if (Math.abs(hf.x - D) < 0.06 * Math.max(1, nS.value / 10)) hf.set(D, 0); };
        hf.onDrag = snapFulcrum;
        v.legend([['accent', 'weights $PV_k/P$', { area: true }], ['gold', 'balance point $D_{\\mathrm{Mac}}$', { dot: true }], ['ink', 'fulcrum (drag me)', { dot: true }], ['orange', 'tangent at $y$']]);
        let info = {};
        v.render(() => {
          const m = +mS.value, n = nS.value, y = yS.value, fl = bondFlows(cS.value, n, m);
          const P = bondPrice(fl, y, m), q = 1 + y / m;
          const wts = fl.map((f) => (f.cf * Math.pow(q, -f.k)) / P);
          D = macaulay(fl, y, m);
          const Dm = D / q, wmax = Math.max(...wts);
          if (hf.x > n + 0.5) hf.set(n, 0);
          const f0 = clamp(hf.x, 0, n + 0.5);
          const tau = fl.reduce((s2, f, i) => s2 + wts[i] * (f.t - f0), 0);
          const W = Math.max(wmax, 0.15);
          const kap = (0.55 * W * clamp(tau / (n / 3), -1, 1)) / n; // beam slope: data-units of height per year
          const beam = (x) => -kap * (x - f0);
          A.setView([-0.4, n + 0.6], [-0.5 * W, 1.2 * W]);
          A.setTicks(undefined, [[0, '0'], [W * 0.5, fx(W * 0.5, 2)], [W, fx(W, 2)]]);
          const th = 0.28 * W, hw = 0.03 * n + 0.1;
          A.poly([[f0, 0], [f0 - hw, -th], [f0 + hw, -th]], { fill: 'muted', fillAlpha: 0.4, color: 'muted' });
          A.line(-0.3, beam(-0.3), n + 0.5, beam(n + 0.5), { color: 'ink', width: 4 });
          const bw = 0.32 / m;
          fl.forEach((f, i) => { const b0 = beam(f.t); A.rect(f.t - bw, b0, f.t + bw, b0 + wts[i], { fill: 'accent', fillAlpha: 0.7, color: 'accent', width: 1 }); });
          A.vline(D, { color: 'gold', width: 1.4, dash: [5, 3] });
          A.dot(D, beam(D), { r: 7, color: 'gold' });
          A.text(`$D_{\\mathrm{Mac}}$ = ${fx(D, 2)} y`, D, 1.2 * W, { dx: D > n * 0.7 ? -8 : 8, dy: 14, align: D > n * 0.7 ? 'right' : 'left', color: 'gold', weight: 700, size: 12.5 });
          // tangent panel
          const curve = (x) => bondPrice(bondFlows(cS.value, n, m), x, m);
          const [d1] = bondDerivs(fl, y, m);
          B.setView([0, 0.15], [0, Math.max(curve(0.0), 1) * 1.05]);
          B.fn(curve, { color: 'accent', width: 2.6 });
          B.fn((x) => P + d1 * (x - y), { color: 'orange', width: 2, domain: [Math.max(0, y - 0.05), Math.min(0.15, y + 0.05)] });
          B.dot(y, P, { r: 5.5, color: 'gold' });
          info = { D, Dm, P, d1, tau, f0, wsum: wts.reduce((a, b) => a + b, 0), num: (curve(y + 1e-5) - curve(y - 1e-5)) / (2e-5 * P) };
        });
        v.readout(() => {
          const t = info;
          return String.raw`$D_{\mathrm{Mac}}=${fx(t.D, 3)}$ years  ·  $D_{\mathrm{mod}}=${fx(t.Dm, 3)}$  ·  weights sum to $${fx(t.wsum, 4)}$` + '\n' +
            String.raw`$P'/P$ by a finite difference $=${fx(t.num, 3)}$ vs $-D_{\mathrm{mod}}=${fx(-t.Dm, 3)}$  ·  net torque of the fulcrum at ${fx(t.f0, 2)} y: $${sg(t.tau, 3)}$  ·  a $+1$ bp move changes the price by about $${fx(-t.Dm * 1e-4 * 100, 3)}\%$`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Definition',
      name: 'Convexity of a bond',
      statement: String.raw`The **convexity** of a bond with price $P(y)$ is the normalised second derivative
$$C=\frac{P''(y)}{P(y)}=\frac1P\sum_k t_k(t_k+\tfrac1m)\,\frac{CF_k}{(1+y/m)^{m t_k+2}} ,$$
measured in years$^2$. Together with the duration it gives the second-order Taylor approximation of the price after a yield shock $\Delta y$:
$$\frac{\Delta P}{P}\approx -D_{\mathrm{mod}}\,\Delta y+\tfrac12\,C\,(\Delta y)^2 .$$
The duration-only (first-order) error is of order $(\Delta y)^2$; including convexity makes it of order $(\Delta y)^3$. For a bond with non-negative cash flows $C>0$, so the correction always *raises* the price estimate.`,
      idea: String.raw`This is Taylor's theorem for $P$ at the current yield (pma 5.15) with the remainder of order $|\Delta y|^3$ because $P$ is smooth: the linear term is $-D_{\mathrm{mod}}P\Delta y$ from 2.3 and the quadratic term is $\tfrac12P''\Delta y^2$. Since $P''>0$ by 2.2, the duration line is a tangent that lies below the curve, and adding $\tfrac12 C\Delta y^2$ bends it up to follow the curve. Long, low-coupon bonds spread their payments far into the future and have the largest $C$ — it grows roughly like $T^2$ against $D\sim T$.`,
      caption: String.raw`Left: the true price–yield curve (blue), the duration tangent (orange) and the duration-plus-convexity parabola (green). Drag the gold point along the axis to shock the yield: the tangent underestimates the price on both sides, the parabola hugs the curve. Right: absolute pricing error against the size of the shock on log–log axes — slope 2 for duration alone, slope 3 with convexity. The vertical line marks your current shock.`,
      deps: ['fin-2.3', 'pma-5.15'],
      refs: ['Luenberger: Fixed-Income Securities'],
      tags: ['convexity', 'bonds'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bond_convexity' },
      viz(v) {
        const cS = v.slider('coupon rate $c$', 0, 0.12, 0.04, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const nS = v.slider('maturity (years)', 1, 30, 20, { int: true });
        const yS = v.slider('base yield $y_0$', 0.01, 0.12, 0.05, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const L = v.stage({ x: [-0.05, 0.05], y: [0, 200], height: 330, axes: 'box', gutter: true, weight: 1.15, minWidth: 320, xlabel: 'yield shock $\\Delta y$', ylabel: 'price (USD)', xticks: pctTicks(-0.05, 0.05, 0.025, 1), title: 'true price, tangent, and second-order fit' });
        const R = v.stage({ x: [1e-4, 0.1], y: [1e-8, 100], xlog: true, ylog: true, height: 330, axes: 'box', gutter: true, weight: 1, minWidth: 300, xlabel: 'size of shock $|\\Delta y|$', ylabel: '|pricing error| (USD)', title: 'error against the size of the shock' });
        const flows = () => bondFlows(cS.value, nS.value, 1);
        const price = (x) => bondPrice(flows(), x, 1);
        const hs = L.handle(0.025, 100, { color: 'gold', label: 'shock', labelPos: 'ne', constrain: (x) => { const d = clamp(x, -0.049, 0.049); return [d, price(yS.value + d)]; } });
        v.legend([['accent', 'true price'], ['orange', 'duration only'], ['green', 'duration + convexity'], ['gold', 'your shock', { dot: true }]]);
        let info = {};
        v.render(() => {
          const fl = flows(), y0 = yS.value, P0 = bondPrice(fl, y0, 1), [d1, d2] = bondDerivs(fl, y0, 1);
          const lin = (d) => P0 + d1 * d, quad = (d) => P0 + d1 * d + 0.5 * d2 * d * d, tru = (d) => bondPrice(fl, y0 + d, 1);
          const xr = [Math.max(-0.05, 0.002 - y0), 0.05];
          L.setView([-0.05, 0.05], [0, Math.max(tru(-0.05 > -y0 ? -0.05 : 0.001 - y0), P0) * 1.08]);
          L.fn(lin, { color: 'orange', width: 2 });
          L.fn(quad, { color: 'green', width: 2.2 });
          L.fn(tru, { color: 'accent', width: 3, domain: xr });
          const d = clamp(hs.x, xr[0] + 1e-4, xr[1]);
          if (Math.abs(d - hs.x) > 1e-9) hs.set(d, tru(d)); else hs.y = tru(d);
          L.dot(d, lin(d), { r: 4, color: 'orange' }); L.dot(d, quad(d), { r: 4, color: 'green' });
          L.vline(0, { color: 'faint', width: 1 });
          // error panel
          const floor = 1e-10, ds = [];
          for (let i = 0; i <= 60; i++) ds.push(Math.pow(10, -4 + (3 * i) / 60));
          const sgn = d >= 0 ? 1 : -1;
          R.fn((a) => Math.max(Math.abs(tru(sgn * a) - lin(sgn * a)), floor), { color: 'orange', width: 2.2 });
          R.fn((a) => Math.max(Math.abs(tru(sgn * a) - quad(sgn * a)), floor), { color: 'green', width: 2.2 });
          if (Math.abs(d) >= 1e-4) R.vline(Math.abs(d), { color: 'gold', width: 1.5, dash: [4, 3] });
          // empirical slopes of the two error curves between 2e-4 and 2e-3
          const sl = (g) => (Math.log(Math.max(g(2e-3), floor)) - Math.log(Math.max(g(2e-4), floor))) / Math.log(10);
          info = { d, P0, tru: tru(d), lin: lin(d), quad: quad(d), Dm: -d1 / P0, C: d2 / P0, s1: sl((a) => Math.abs(tru(a) - lin(a))), s2: sl((a) => Math.abs(tru(a) - quad(a))) };
        });
        v.readout(() => {
          const t = info, e1 = t.lin - t.tru, e2 = t.quad - t.tru;
          return String.raw`$D_{\mathrm{mod}}=${fx(t.Dm, 2)}$, convexity $C=${fx(t.C, 1)}$ yr²  ·  shock $\Delta y=${pct(t.d, 2)}$: true $\Delta P=${sg(t.tru - t.P0, 3)}$, duration says $${sg(t.lin - t.P0, 3)}$ (off by $${sg(e1, 3)}$), with convexity $${sg(t.quad - t.P0, 3)}$ (off by $${sg(e2, 3)}$)` + '\n' +
            String.raw`log–log slopes of the error: ${fx(t.s1, 2)} (duration alone), ${fx(t.s2, 2)} (with convexity)`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Method',
      name: 'Immunization (Redington)',
      statement: String.raw`A liability $L$ due at date $H$ is to be funded by a portfolio of bonds. At the current yield $y_0$ the portfolio is **immunized** against small *parallel* shifts of the yield curve if (i) its present value equals that of the liability, $A(y_0)=L(y_0)$; (ii) its duration equals the liability's, $D_A=D_L=H$; and (iii) its convexity is at least the liability's, $C_A\ge C_L$. Then $S(y)=A(y)-L(y)$ has $S(y_0)=0$, $S'(y_0)=0$ and $S''(y_0)\ge0$, so the surplus is non-negative for every small shift of the yield. Two zero-coupon bonds of maturities $T_1<H<T_2$ with present-value weights $w_2=\frac{H-T_1}{T_2-T_1}$, $w_1=1-w_2$ meet (i)–(iii) (a *barbell*).`,
      idea: String.raw`Expand the surplus to second order as in 2.4: $S(y_0+\Delta)\approx S(y_0)+S'(y_0)\Delta+\tfrac12S''(y_0)\Delta^2$. Condition (i) kills the constant, condition (ii) kills the slope because $S'=-(D_AA-D_LL)/(1+y)$, and (iii) makes $\tfrac12S''=\tfrac12(C_AA-C_LL)\ge0$. A barbell's convexity exceeds the single date $H$ because $\sum w_iT_i(T_i+1)\ge H(H+1)$ whenever $\sum w_iT_i=H$ (Jensen). The method only controls parallel shifts: a twist changes rates at $T_1$ and $T_2$ differently from the rate at $H$, so the first-order term no longer vanishes and the surplus can be negative.`,
      caption: String.raw`Left: surplus against a parallel shift of the curve for the chosen strategy. The barbell touches zero at no shift and rises on both sides (green); the red curve adds a twist of the size you set, pivoting at $H$. Right: the shocked yield curve for the shift you pick with the gold handle. Try the other strategies: a zero maturing exactly at $H$ is immune to everything (cash-flow matching); a single longer zero with the same present value is hurt by rate rises.`,
      deps: ['fin-2.3', 'fin-2.4'],
      refs: ['Luenberger: Fixed-Income Securities', 'BKM ch. 16'],
      tags: ['immunization', 'duration'],
      credit: 'Redington, 1952',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Immunization_(finance)' },
      viz(v) {
        const hS = v.slider('liability date $H$ (years)', 5, 10, 7, { int: true });
        const t1S = v.slider('short bond $T_1$', 1, 4, 2, { int: true });
        const t2S = v.slider('long bond $T_2$', 11, 20, 14, { int: true });
        const yS = v.slider('flat yield $y_0$', 0.02, 0.09, 0.05, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const bS = v.slider('twist (steepening per 10 y)', -0.04, 0.04, 0.01, { step: 0.0025, fmt: (x) => sg(100 * x, 2) + ' pts' });
        const sS = v.select('strategy', [{ value: 'barbell', label: 'barbell $T_1,T_2$' }, { value: 'match', label: 'zero at $H$' }, { value: 'long', label: 'one zero at $H+3$' }], 'barbell');
        const XR = [-0.04, 0.04];
        const L = v.stage({ x: XR, y: [-5, 20], height: 330, axes: 'box', gutter: true, weight: 1.15, minWidth: 320, xlabel: 'parallel shift $a$ of all yields', ylabel: 'surplus $A-L$ (USD)', xticks: pctTicks(-0.04, 0.04, 0.02, 0), title: 'surplus after a shift' });
        const R = v.stage({ x: [0, 21], y: [0, 0.14], height: 330, axes: 'box', gutter: true, weight: 1, minWidth: 280, xlabel: 'maturity (years)', ylabel: 'yield', yticks: pctTicks(0, 0.14, 0.02, 0), title: 'the curve before and after' });
        const ha = L.handle(0.015, 0, { color: 'gold', label: 'a', labelPos: 'nw', constrain: (x) => [clamp(x, XR[0], XR[1]), 0] });
        v.legend([['green', 'parallel shifts only'], ['red', 'with the twist'], ['gold', 'your shift', { dot: true }]]);
        const LIAB = 1000;
        function setup() {
          const H = hS.value, y0 = yS.value, T1 = t1S.value, T2 = t2S.value, pvL = LIAB / Math.pow(1 + y0, H);
          let pos;
          if (sS.value === 'barbell') { const w2 = (H - T1) / (T2 - T1); pos = [[T1, (1 - w2) * pvL], [T2, w2 * pvL]]; }
          else if (sS.value === 'match') pos = [[H, pvL]];
          else pos = [[H + 3, pvL]];
          return { H, y0, pvL, pos };
        }
        const shockAt = (t, a, b, H) => a + (b * (t - H)) / 10;
        function surplus(S, a, b) {
          // asset i buys pv_i at today's price and holds a zero face pv_i (1+y0)^T_i paying at T_i
          let A = 0;
          for (const [T, pv] of S.pos) A += pv * Math.pow(1 + S.y0, T) * Math.pow(1 + S.y0 + shockAt(T, a, b, S.H), -T);
          return A - LIAB * Math.pow(1 + S.y0 + shockAt(S.H, a, b, S.H), -S.H);
        }
        let info = {};
        v.render(() => {
          const S = setup(), b = bS.value;
          const sp = (a) => surplus(S, a, 0), st = (a) => surplus(S, a, b);
          const xs = v.M.linspace(XR[0], XR[1], 161);
          const vals = xs.flatMap((a) => [sp(a), st(a)]);
          const ymin = Math.min(...vals, -1), ymax = Math.max(...vals, 1);
          L.setView(XR, [ymin - 0.08 * (ymax - ymin), ymax + 0.08 * (ymax - ymin)]);
          L.hline(0, { color: 'ink', width: 1 });
          L.fn(sp, { color: 'green', width: 2.6 });
          if (Math.abs(b) > 1e-9) L.fn(st, { color: 'red', width: 2.4 });
          ha.y = Math.abs(b) > 1e-9 ? st(ha.x) : sp(ha.x);
          // right panel
          const a = ha.x, curve = (t) => S.y0 + shockAt(t, a, b, S.H);
          R.hline(S.y0, { color: 'faint', width: 1.4, dash: [4, 3] });
          R.fn(curve, { color: 'orange', width: 2.4, domain: [0.2, 20.8] });
          R.vline(S.H, { color: 'red', width: 1.4, dash: [5, 3] });
          R.text('liability', S.H, 0.14, { dx: 4, dy: 12, align: 'left', color: 'red', size: 11.5, weight: 700 });
          S.pos.forEach(([T, pv]) => { R.vline(T, { color: 'accent', width: 1.2, dash: [3, 3] }); R.dot(T, curve(T), { r: 5, color: 'accent' }); R.text(money(pv, 0), T, 0, { dy: -8, size: 11, color: 'accent', align: 'center' }); });
          R.dot(S.H, curve(S.H), { r: 5, color: 'red' });
          // conditions
          const Dc = S.pos.reduce((s, [T, pv]) => s + T * pv, 0) / S.pvL;
          const Cc = S.pos.reduce((s, [T, pv]) => s + (T * (T + 1) * pv) / (1 + S.y0) ** 2, 0) / S.pvL, Cl = (S.H * (S.H + 1)) / (1 + S.y0) ** 2;
          let mn = Infinity; xs.forEach((x) => { mn = Math.min(mn, sp(x)); });
          info = { S, Dc, Cc, Cl, mn, now: surplus(S, a, b), a, b, pvA: S.pos.reduce((s, [, pv]) => s + pv, 0), slope: (sp(1e-4) - sp(-1e-4)) / 2e-4, slopeT: (st(1e-4) - st(-1e-4)) / 2e-4 };
        });
        v.readout(() => {
          const t = info;
          return String.raw`(i) $A=${dl(t.pvA, 2)}$ vs $L=${dl(t.S.pvL, 2)}$  ·  (ii) $D_A=${fx(t.Dc, 3)}$ vs $D_L=${t.S.H}$  ·  (iii) $C_A=${fx(t.Cc, 1)}$ vs $C_L=${fx(t.Cl, 1)}$` + '\n' +
            String.raw`surplus at your shift ($a=${pct(t.a, 2)}$, twist ${sg(100 * t.b, 2)} pts): $${(t.now < -0.005 ? '-' : '+') + '\\$' + Math.abs(t.now).toFixed(2)}$  ·  worst surplus over parallel shifts $\pm4\%$: $${(t.mn < -0.005 ? '-' : '') + '\\$' + Math.abs(t.mn).toFixed(2)}$  ·  slope of the surplus at $a=0$ per percentage point of shift: $${fx(t.slope / 100, 2)}$ (parallel), $${fx(t.slopeT / 100, 2)}$ (twisted)`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Definition',
      name: 'Spot rates and the zero curve',
      statement: String.raw`The **spot rate** $s_t$ is the annually compounded yield of a zero-coupon bond that pays \$1 at date $t$: its price is the **discount factor** $Z(t)=(1+s_t)^{-t}$. The graph $t\mapsto s_t$ is the **zero** (or spot) **curve**. No-arbitrage forces any bond with cash flows $CF_t$ to be priced by discounting each payment at the spot rate of its own date,
$$P=\sum_t \frac{CF_t}{(1+s_t)^t}=\sum_t CF_t\,Z(t),$$
whereas its yield to maturity (2.1) applies a single rate $y$ to all of them. When the curve is not flat the yield of a coupon bond is a weighted average of spot rates, not equal to the spot rate of its maturity: with an upward-sloping curve the yield of a coupon bond lies below the spot rate of the same maturity.`,
      idea: String.raw`A coupon bond is a portfolio of zero-coupon bonds, one per payment, so by the law of one price (fin 1.9, via the present-value formula of fin 1.5) its price is the sum of the prices of its pieces; this fixes the right discounting rate of each payment. The yield $y$ then solves $\sum CF_t(1+y)^{-t}=\sum CF_tZ(t)$, so it is an average of the $s_t$ weighted by the present value of each payment; for an upward curve the weight sits on earlier, lower rates, and for the final payment alone (a zero) $y=s_T$.`,
      caption: String.raw`Drag the six handles to shape the zero curve (blue) or pick a preset; between handles the curve is linearly interpolated. The orange curve is the yield to maturity of a coupon bond of each maturity: it departs from the spot curve whenever the curve is not flat. Right: the bond of your chosen maturity, each coupon discounted at its own spot rate (bars) versus at the single yield (dots) — the two columns sum to the same price.`,
      deps: ['fin-1.5'],
      refs: ['Luenberger: Term Structure', 'Hull ch. 4'],
      tags: ['term structure', 'spot rates'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Yield_curve' },
      viz(v) {
        const KN = [1, 3, 5, 10, 20, 30];
        const PRE = {
          normal: [0.030, 0.034, 0.037, 0.042, 0.047, 0.048],
          flat: [0.04, 0.04, 0.04, 0.04, 0.04, 0.04],
          inverted: [0.055, 0.050, 0.047, 0.043, 0.041, 0.040],
          humped: [0.030, 0.045, 0.050, 0.048, 0.043, 0.040],
        };
        const cS = v.slider('coupon rate $c$ (annual)', 0, 0.10, 0.05, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const nS = v.slider('bond maturity (years)', 2, 30, 10, { int: true });
        const pS = v.select('preset', [{ value: 'normal', label: 'normal' }, { value: 'flat', label: 'flat' }, { value: 'inverted', label: 'inverted' }, { value: 'humped', label: 'humped' }], 'normal', {
          onChange: (k) => hs.forEach((h, i) => h.set(KN[i], PRE[k][i])),
        });
        const L = v.stage({ x: [0, 31], y: [0.02, 0.065], height: 320, axes: 'box', gutter: true, weight: 1.15, minWidth: 320, xlabel: 'maturity $t$ (years)', ylabel: 'rate', yticks: pctTicks(0.02, 0.07, 0.01, 0), title: 'the zero curve and coupon-bond yields' });
        const R = v.stage({ x: [0, 11], y: [0, 10], height: 320, axes: 'box', gutter: true, weight: 1, minWidth: 280, xlabel: 'payment date (years)', ylabel: 'present value (USD)', title: 'discounting at spot rates vs one yield' });
        const hs = KN.map((t, i) => L.handle(t, PRE.normal[i], { color: 'accent', r: 6.5, constrain: (x, y) => [t, clamp(y, 0.005, 0.09)] }));
        const knots = () => hs.map((h, i) => [KN[i], h.y]);
        const spot = (t) => interp(knots(), t);
        const yieldFor = (n) => { const fl = bondFlows(cS.value, n, 1); const P = fl.reduce((s, f) => s + f.cf * Math.pow(1 + spot(f.t), -f.t), 0); return { P, y: ytm(fl, P, 1) }; };
        v.legend([['accent', 'spot rate $s_t$'], ['orange', 'yield of a $c$-coupon bond'], ['accent', 'PV at its own $s_t$', { area: true }], ['orange', 'PV at the single yield', { dot: true }]]);
        let info = {};
        v.render(() => {
          const ks = knots(), vals = ks.map((k) => k[1]);
          const lo = Math.min(...vals) - 0.006, hi = Math.max(...vals) + 0.006;
          L.setView([0, 31], [lo, hi]);
          L.fn(spot, { color: 'accent', width: 2.8, domain: [1, 30] });
          const ns = Array.from({ length: 30 }, (_, i) => i + 1);
          L.path(ns.map((n) => [n, yieldFor(n).y]), { color: 'orange', width: 2.2 });
          const n = nS.value, { P, y } = yieldFor(n), fl = bondFlows(cS.value, n, 1);
          L.dot(n, spot(n), { r: 5, color: 'accent', hollow: true });
          L.dot(n, y, { r: 5, color: 'orange' });
          L.vline(n, { color: 'faint', width: 1, dash: [3, 3] });
          // right panel
          const pvs = fl.map((f) => f.cf * Math.pow(1 + spot(f.t), -f.t)), pvy = fl.map((f) => f.cf * Math.pow(1 + y, -f.t));
          const coup = fl.slice(0, -1).map((f, i) => pvs[i]);
          const mx = Math.max(...coup, ...fl.slice(0, -1).map((f, i) => pvy[i]), 1) * 1.15;
          R.setView([0, Math.min(n, 30) + 1], [0, mx]);
          fl.forEach((f, i) => {
            if (i === fl.length - 1) return;
            R.rect(f.t - 0.32, 0, f.t + 0.32, pvs[i], { fill: 'accent', fillAlpha: 0.6, color: 'accent', width: 1 });
            R.dot(f.t, pvy[i], { r: 4, color: 'orange' });
          });
          const lt = fl[fl.length - 1].t;
          R.rect(lt - 0.32, 0, lt + 0.32, mx * 0.97, { fill: 'gold', fillAlpha: 0.3, hatch: 'gold', stroke: false });
          R.rect(lt - 0.32, 0, lt + 0.32, mx * 0.97, { color: 'gold', width: 1 });
          R.text(`${fx(pvs[fl.length - 1], 1)} ↑`, lt, mx * 0.97, { dy: 12, size: 11, color: 'gold', align: 'center', weight: 700 });
          info = { n, P, y, sn: spot(n), Z: Math.pow(1 + spot(n), -n), sum: pvs.reduce((a, b) => a + b, 0), sumy: pvy.reduce((a, b) => a + b, 0) };
        });
        v.readout(() => {
          const t = info;
          return String.raw`$s_{${t.n}}=${pct(t.sn, 3)}$, a zero paying \$100 in ${t.n} years costs $${dl(100 * t.Z, 2)}$ (discount factor $Z=${fx(t.Z, 4)}$)` + '\n' +
            String.raw`coupon bond price $\sum CF\,Z=${dl(t.P, 3)}$; its yield to maturity $${pct(t.y, 3).replace('%', '\\%')}$ is ${t.y < t.sn ? 'below' : t.y > t.sn ? 'above' : 'equal to'} $s_{${t.n}}$ by ${fx(Math.abs(t.y - t.sn) * 1e4, 1)} bp  ·  discounting at the single yield gives $${dl(t.sumy, 3)}$ — the same price`;
        });
      },
    },
  ],
};
