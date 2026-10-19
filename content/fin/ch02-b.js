// Finance — Chapter 2: Bonds and the term structure (items 2.7–2.12; 2.1–2.6 are in ch02.js)
import { clamp, pct, fx, sg, bp, dl, pctTicks, bondFlows, bondPrice, ytm, YC, YC_START, RECESSIONS } from './ch02.shared.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Month index i into the YC table → "Jan 1980". */
const monthName = (i) => `${MON[(i + YC_START[1] - 1) % 12]} ${YC_START[0] + Math.floor((i + YC_START[1] - 1) / 12)}`;
/** Month index → decimal year at mid-month. */
const decYear = (i) => YC_START[0] + (i + YC_START[1] - 0.5) / 12;
const NM = YC.length;

export default {
  collection: 'fin',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Method',
      name: 'Bootstrapping the zero curve',
      statement: String.raw`Suppose coupon bonds with annual coupons $c_1,\dots,c_N$ (face 100) and maturities $1,\dots,N$ trade at prices $P_1,\dots,P_N$. The discount factors $Z(1),\dots,Z(N)$, and hence the spot rates $s_n=Z(n)^{-1/n}-1$, are found one maturity at a time: given $Z(1),\dots,Z(n-1)$,
$$Z(n)=\frac{P_n-\sum_{t<n}c_t\,Z(t)}{100+c_n},$$
because the $n$-year bond is worth the present value of its early coupons (already known) plus the discounted final payment (the only unknown). The $N$ prices determine the $N$ discount factors uniquely. The procedure presumes a bond for every maturity and that the quoted prices are consistent: if a computed $Z(n)$ exceeds $Z(n-1)$, the implied forward rate is negative and the prices leave an arbitrage unless the data are wrong.`,
      idea: String.raw`The market price of each bond is a linear equation in the unknown discount factors (law of one price, fin 1.9), $P_n=\sum_{t\le n}CF^{(n)}_t Z(t)$. The system is triangular — the $n$-year bond only involves dates $\le n$ — so back-substitution solves it, shortest bond first; the 1-year bond is effectively a zero. Because each step reuses the earlier solutions, a pricing error in one bond contaminates every later $Z$.`,
      caption: String.raw`Step through the six bonds. At each step the table fills in one discount factor and one spot rate; the middle panel shows the price as a stack of present values — grey for coupons already discounted with known factors, gold for the remainder that must come from the final payment. The dashed curve is the true curve the prices were generated from (prices rounded to cents). Now give the 4-year bond a price error with the slider: $s_4$ jumps and the error leaks into $s_5$ and $s_6$, and a bad $Z$ turns red when it exceeds the one before.`,
      deps: ['fin-2.6'],
      refs: ['Hull ch. 4'],
      tags: ['term structure', 'algorithm'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bootstrapping_(finance)' },
      viz(v) {
        const CP = [2, 3, 3.5, 4, 4.5, 5], N = CP.length;
        const TRUE = { normal: [0.030, 0.034, 0.037, 0.039, 0.040, 0.041], inverted: [0.050, 0.047, 0.045, 0.044, 0.043, 0.0425], humped: [0.030, 0.040, 0.045, 0.046, 0.045, 0.044] };
        let S = null;
        const again = () => S && S.reset(undefined, { at: 'keep' });
        const cS = v.select('true curve behind the prices', [{ value: 'normal', label: 'normal' }, { value: 'inverted', label: 'inverted' }, { value: 'humped', label: 'humped' }], 'normal', { onChange: again });
        const eS = v.slider('error in the 4-year bond price (USD)', -3, 3, 0, { step: 0.05, fmt: (x) => sg(x, 2), onChange: again });
        const TB = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: false, weight: 1.25, minWidth: 330, title: 'market data and what has been solved' });
        const W = v.stage({ x: [0, N + 1], y: [0, 120], height: 290, axes: 'box', gutter: true, weight: 1, minWidth: 260, xlabel: 'payment date (years)', ylabel: 'cumulative PV (USD)', title: 'the current bond: known PVs, then the remainder' });
        const C = v.stage({ x: [0, N + 1], y: [0.02, 0.06], height: 290, axes: 'box', gutter: true, weight: 1, minWidth: 260, xlabel: 'maturity (years)', ylabel: 'spot rate', yticks: pctTicks(0.02, 0.06, 0.01, 0), title: 'the zero curve so far' });
        const prices = () => { const s = TRUE[cS.value]; return CP.map((c, i) => { let p = 0; for (let t = 1; t <= i + 1; t++) p += (t === i + 1 ? 100 + c : c) * Math.pow(1 + s[t - 1], -t); p = Math.round(p * 100) / 100; return i === 3 ? p + eS.value : p; }); };
        function build() {
          const P = prices(), Z = [], sp = [], frames = [{ k: 0, Z: [], s: [], P, note: String.raw`Six annual-coupon bonds with prices $P_1,\dots,P_6$. Press ▶ to peel off one discount factor at a time.` }];
          for (let k = 1; k <= N; k++) {
            const pv = Z.slice(0, k - 1).map((z) => CP[k - 1] * z), known = pv.reduce((a, b) => a + b, 0), rem = P[k - 1] - known, Zk = rem / (100 + CP[k - 1]), sk = Math.pow(Zk, -1 / k) - 1;
            Z.push(Zk); sp.push(sk);
            const bad = k > 1 && Zk >= Z[k - 2];
            frames.push({ k, Z: Z.slice(), s: sp.slice(), P, pv, known, rem, Zk, sk, bad, line: [2, 3, 4],
              note: k === 1 ? String.raw`The 1-year bond pays $${CP[0]}+100$ once: $Z(1)=${fx(P[0], 2)}/102=${fx(Zk, 4)}$, so $s_1=${pct(sk, 3)}$.`
                : String.raw`Known coupons are worth $${fx(known, 3)}$; the rest of the price, $${fx(P[k - 1], 2)}-${fx(known, 3)}=${fx(rem, 3)}$, must be the present value of the final payment $${100 + CP[k - 1]}$: $Z(${k})=${fx(Zk, 4)}$, $s_${k}=${pct(sk, 3)}$.` + (bad ? String.raw` **$Z(${k})\ge Z(${k - 1})$: a negative forward rate — these prices are inconsistent.**` : ''),
              vars: { n: k, Z: fx(Zk, 4), s: pct(sk, 3) } });
          }
          return frames;
        }
        S = v.steps({ frames: build, still: 4, speed: 1, codePos: 'below', codeTitle: 'bootstrap(P, c)',
          code: ['for n = 1, 2, …, N', '  known ← Σ_{t<n} c_t · Z(t)            // coupons already discounted', '  Z(n) ← (P_n − known) / (100 + c_n)        // only the last payment is unknown', '  s_n ← Z(n)^(−1/n) − 1', 'return s_1, …, s_N'] });
        const T = v.table(TB, { rows: N, cols: 5, square: false, maxCell: 34, cellAspect: 2.4, size: 13, colLabels: ['years', 'coupon', 'price', '$Z(n)$', '$s_n$'], colWeights: [0.8, 0.9, 1.1, 1.1, 1.1] });
        v.legend([['muted', 'known PV of coupons', { area: true }], ['gold', 'left for the last payment', { area: true }], ['accent', 'solved $s_n$', { dot: true }], ['muted', 'true curve', { dash: true }]]);
        v.render(() => {
          const f = S.frame, k = f.k, tr = TRUE[cS.value], P = f.P || prices();
          T.draw({
            value: (i, j) => (j === 0 ? i + 1 : j === 1 ? fx(CP[i], 1) + '%' : j === 2 ? fx(P[i], 2) : i < k ? (j === 3 ? fx(f.Z[i], 4) : pct(f.s[i], 3)) : ''),
            fill: (i, j) => (i < k && j >= 3 ? [i === k - 1 ? (f.bad ? 'red' : 'gold') : 'green', i === k - 1 ? 0.4 : 0.15] : null),
            activeRow: k ? k - 1 : undefined,
          });
          // PV stack
          if (k) {
            let cum = 0; const w = 0.32;
            for (let t = 1; t < k; t++) { W.rect(t - w, cum, t + w, cum + f.pv[t - 1], { fill: 'muted', fillAlpha: 0.55, color: 'muted', width: 1 }); cum += f.pv[t - 1]; }
            W.rect(k - w, cum, k + w, cum + f.rem, { fill: 'gold', fillAlpha: 0.7, color: 'gold', width: 1 });
            W.hline(f.P[k - 1], { color: 'orange', width: 1.5, dash: [6, 4] });
            W.text(`price ${fx(f.P[k - 1], 2)}`, 0.2, f.P[k - 1], { dx: 4, dy: -9, color: 'orange', size: 12, weight: 700, align: 'left' });
            W.text(`left: ${fx(f.rem, 2)}`, k, cum + f.rem / 2, { dy: 0, color: 'ink', size: 11.5, weight: 700, align: 'center' });
          }
          // curve
          C.path(tr.map((s, i) => [i + 1, s]), { color: 'muted', width: 1.6, dash: [5, 4] });
          for (let i = 0; i < k; i++) C.dot(i + 1, clamp(f.s[i], 0.0205, 0.0595), { r: 6, color: i === k - 1 ? (f.bad ? 'red' : 'gold') : 'accent' });
          if (k > 1) C.path(f.s.map((s, i) => [i + 1, clamp(s, 0.0205, 0.0595)]), { color: 'accent', width: 2 });
        });
        v.readout(() => {
          const f = S.frame, k = f.k;
          if (!k) return String.raw`No discount factor is known yet.`;
          const tr = TRUE[cS.value][k - 1];
          return String.raw`$s_${k}=${pct(f.sk, 3)}$ recovered vs $${pct(tr, 3)}$ in the curve that generated the prices (difference ${fx((f.sk - tr) * 1e4, 1)} bp)  ·  check: $${fx(f.known, 3)}+${fx(100 + CP[k - 1], 1)}\times${fx(f.Zk, 4)}=${fx(f.known + (100 + CP[k - 1]) * f.Zk, 3)}$ $=P_${k}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Definition',
      name: 'Forward rates',
      statement: String.raw`The **forward rate** $f(T_1,T_2)$ between dates $T_1<T_2$ is the annual rate that, if it applied between $T_1$ and $T_2$, would make rolling over equal to holding the longer zero. With annually compounded spot rates $s_T$,
$$(1+s_{T_2})^{T_2}=(1+s_{T_1})^{T_1}\,\bigl(1+f(T_1,T_2)\bigr)^{T_2-T_1}\quad\Longleftrightarrow\quad f(T_1,T_2)=\Bigl[\frac{(1+s_{T_2})^{T_2}}{(1+s_{T_1})^{T_1}}\Bigr]^{1/(T_2-T_1)}-1 .$$
Equivalently $f=\bigl(Z(T_1)/Z(T_2)\bigr)^{1/(T_2-T_1)}-1$: the forward rate is the rate of return that today's prices of zeros lock in for the future period. If a forward contract on the period were quoted at any other rate, one could earn a riskless profit by combining it with the two zeros (no arbitrage). A spot rate is the geometric average of the one-period forward rates up to that date.`,
      idea: String.raw`Two ways to turn \$1 into money at $T_2$: buy the $T_2$-zero, or buy the $T_1$-zero and reinvest the proceeds from $T_1$ to $T_2$. The first has a known payoff; the second is known only if the reinvestment rate is locked in today, which is what a forward contract does. By the law of one price (fin 1.9) both must cost the same, which pins down the locked-in rate. An upward-sloping spot curve implies forward rates above the spot curve (the longer zero pays more per year, so the future years must pay more still); an inverted curve implies forwards below it.`,
      caption: String.raw`Drag the five blue handles to change the spot curve (right); the orange steps are the one-year forward rates, and the gold bar spans the forward period you chose with the sliders. Left: the two routes to year $T_2$ — hold the long zero (blue) or roll the short zero into the forward (orange) — end at the same value. Now quote the forward away from its fair value with the third slider: the routes no longer meet and the gap is an arbitrage profit.`,
      deps: ['fin-2.6'],
      refs: ['Luenberger: Term Structure', 'Hull ch. 4'],
      tags: ['forward rates', 'term structure'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Forward_rate' },
      viz(v) {
        const KN = [1, 2, 4, 7, 10], T = 10;
        const t1S = v.slider('forward period starts $T_1$', 0, 8, 2, { int: true });
        const t2S = v.slider('and ends $T_2$', 2, 10, 6, { int: true });
        const qS = v.slider('quoted forward minus fair value (bp)', -150, 150, 0, { step: 5, fmt: (x) => sg(x, 0) + ' bp' });
        const L = v.stage({ x: [0, 10], y: [1, 2], height: 320, axes: 'box', gutter: true, weight: 1, minWidth: 300, xlabel: 'time (years)', ylabel: 'value of 1 USD invested today', title: 'two routes to the same date' });
        const R = v.stage({ x: [0, T + 0.6], y: [0, 0.08], height: 320, axes: 'box', gutter: true, weight: 1.1, minWidth: 320, xlabel: 'maturity (years)', ylabel: 'rate', yticks: pctTicks(0, 0.1, 0.01, 0), title: 'spot curve and one-year forward rates' });
        const base = [0.030, 0.036, 0.042, 0.046, 0.048];
        const hs = KN.map((t, i) => R.handle(t, base[i], { color: 'accent', r: 6.5, constrain: (x, y) => [t, clamp(y, -0.005, 0.12)] }));
        const knots = () => hs.map((h, i) => [KN[i], h.y]);
        const spot = (t) => { if (t <= 0) return 0; const k = knots(); if (t <= KN[0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return k[i - 1][1] + ((k[i][1] - k[i - 1][1]) * (t - k[i - 1][0])) / (k[i][0] - k[i - 1][0]); return k[k.length - 1][1]; };
        const growth = (t) => (t <= 0 ? 1 : Math.pow(1 + spot(t), t));
        const fwd = (a, b) => Math.pow(growth(b) / growth(a), 1 / (b - a)) - 1;
        v.legend([['accent', 'hold the $T_2$-zero'], ['orange', 'roll the $T_1$-zero at the forward'], ['accent', 'spot rate', { dot: true }], ['orange', 'one-year forwards', { area: true }], ['gold', 'chosen forward period', { area: true }]]);
        let info = {};
        v.render(() => {
          const T1 = t1S.value, T2 = Math.max(t2S.value, T1 + 1), fair = fwd(T1, T2), fq = fair + qS.value * 1e-4;
          const sA = spot(T2);
          const routeA = (t) => Math.pow(1 + sA, t);
          const s1 = spot(T1), routeB = (t) => (t <= T1 ? Math.pow(1 + s1, t) : growth(T1) * Math.pow(1 + fq, t - T1));
          const hiV = Math.max(routeA(T2), routeB(T2)) * 1.03;
          L.setView([0, T2 + 0.2], [1, hiV]);
          L.fn(routeA, { color: 'accent', width: 2.8, domain: [0, T2] });
          L.fn(routeB, { color: 'orange', width: 2.8, domain: [0, T2] });
          L.vline(T1, { color: 'faint', width: 1.2, dash: [4, 3] });
          L.dot(T2, routeA(T2), { r: 6, color: 'accent' }); L.dot(T2, routeB(T2), { r: 6, color: 'orange', hollow: true });
          L.text(`T₁`, T1, 1, { dy: -10, size: 12, color: 'muted', align: 'center' });
          if (Math.abs(routeA(T2) - routeB(T2)) > 1e-4) L.arrow(T2 - 0.12, routeA(T2), T2 - 0.12, routeB(T2), { both: true, color: 'red', width: 2, head: 6 });
          // right panel
          const ymax = Math.max(0.06, ...hs.map((h) => h.y), ...v.M.range(0, T - 1).map((i) => fwd(i, i + 1))) * 1.12, ymin = Math.min(0, ...hs.map((h) => h.y), ...v.M.range(0, T - 1).map((i) => fwd(i, i + 1)));
          R.setView([0, T + 0.6], [ymin * 1.2 - 0.003, ymax]);
          R.hline(0, { color: 'faint', width: 1 });
          for (let t = 1; t <= T; t++) { const f = fwd(t - 1, t); R.rect(t - 1 + 0.08, 0, t - 0.08, f, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1 }); }
          R.fn(spot, { color: 'accent', width: 2.4, domain: [1, T] });
          R.rect(T1, ymax * 0.93, T2, ymax * 0.97, { fill: 'gold', fillAlpha: 0.7, color: 'gold', width: 1 });
          R.text(`f = ${pct(fair, 2)}`, (T1 + T2) / 2, ymax * 0.93, { dy: 14, color: 'gold', weight: 700, size: 12, align: 'center' });
          info = { T1, T2, fair, fq, s1, sA, endA: routeA(T2), endB: routeB(T2), approx: (T2 * sA - T1 * s1) / (T2 - T1), avg: Math.pow(v.M.range(0, T2 - 1).reduce((p, i) => p * (1 + fwd(i, i + 1)), 1), 1 / T2) - 1 };
        });
        v.readout(() => {
          const t = info, gap = t.endB - t.endA;
          return String.raw`$f(${t.T1},${t.T2})=\bigl[(1+s_{${t.T2}})^{${t.T2}}/(1+s_{${t.T1}})^{${t.T1}}\bigr]^{1/${t.T2 - t.T1}}-1=${pct(t.fair, 3)}$ (rough guide $\frac{T_2s_{T_2}-T_1s_{T_1}}{T_2-T_1}=${pct(t.approx, 2)}$)` + '\n' +
            String.raw`at year ${t.T2}: hold the zero $${fx(t.endA, 4)}$, roll at the quoted forward $${fx(t.endB, 4)}$` + (Math.abs(gap) < 5e-5 ? String.raw` — equal` : String.raw`: gap $${sg(gap, 4)}$ per \$1, a riskless profit ${gap > 0 ? '(borrow long, lend short and lock the forward)' : '(the reverse trade)'}`) ;
        });
      },
    },

    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Concept',
      name: 'The yield curve and its inversions',
      statement: String.raw`The **yield curve** plots the yield of (nearly) riskless bonds against maturity on one date. Its usual shape slopes upward (long rates above short rates), but it can be flat, humped or **inverted** (short rates above long ones). Its slope is summarised by a **spread** such as the 10-year yield minus the 3-month yield. In US data since the 1970s the spread has gone negative before most recessions, so an inversion is often read as a warning; but it is an empirical regularity, not a law, and episodes without a recession followed also occur. Nothing guarantees that the pattern persists.`,
      idea: String.raw`By 2.8 a long yield is an average of expected future short rates plus a premium. When the market expects the central bank to cut rates, because policy is tight now and activity is expected to slow, the forward rates fall below today's short rate and the curve inverts (2.10 asks how much of the slope is expectations and how much premium). A recession is also what typically follows tight policy, hence the association; the same inversion can arise from the premium alone, which is why the signal is imperfect.`,
      caption: String.raw`Left: the Treasury curve at the month chosen with the date slider (or press play, or click the spread chart); the faint curve is the same month a year earlier. Right: the chosen spread since 1976 with US recessions shaded and inversions (spread below zero) in red. Switch the spread and read the scorecard under the picture: it counts, from the data shown, how many inversion episodes were followed by a recession start within 24 months and how many were not. Data: monthly averages of constant-maturity Treasury yields (FRED, series TB3MS, GS1, GS2, GS5, GS10), recession months from NBER dating (FRED USREC), through September 2026.`,
      deps: ['fin-2.6'],
      refs: ['BKM ch. 15'],
      tags: ['yield curve', 'recessions'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inverted_yield_curve' },
      viz(v) {
        const SP = {
          '10y−3m': (r) => r[4] - r[0], '10y−2y': (r) => r[4] - r[2], '10y−1y': (r) => r[4] - r[1],
        };
        const kS = v.select('spread', Object.keys(SP).map((k) => ({ value: k, label: k })), '10y−3m');
        const dS = v.slider('date', 0, NM - 1, 367, { int: true, fmt: monthName });
        const recStarts = RECESSIONS.map((r) => r[0]);
        const MATS = [0.25, 1, 2, 5, 10];
        const L = v.stage({ x: [0, 10.6], y: [0, 17], height: 300, axes: 'box', gutter: true, weight: 1, minWidth: 300, xlabel: 'maturity (years)', ylabel: 'yield (%)', xticks: [[0.25, '3m'], [1, '1'], [2, '2'], [5, '5'], [10, '10']], title: 'the curve on the chosen date' });
        const R = v.stage({ x: [1976, 2027], y: [-4, 5], height: 300, axes: 'box', gutter: true, weight: 2.1, minWidth: 380, xlabel: 'year', ylabel: 'spread (percentage points)', title: 'the spread and US recessions' });
        const cache = {};
        function episodes(key) {
          if (cache[key]) return cache[key];
          const sp = YC.map(SP[key]), runs = [];
          let cur = null;
          sp.forEach((x, i) => { if (x < 0) { if (cur && i - cur[1] <= 3) cur[1] = i; else { cur = [i, i]; runs.push(cur); } } });
          const eps = runs.map(([a, b]) => ({ a, b, hit: recStarts.some((r) => r >= a && r <= a + 24) }));
          const pre = recStarts.map((r) => eps.some((e) => e.a >= r - 24 && e.a <= r));
          return (cache[key] = { sp, eps, pre });
        }
        let timer = null;
        const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
        v.button('▶ play / pause', () => {
          if (timer) return stop();
          if (dS.value >= NM - 1) dS.set(0);
          timer = setInterval(() => { if (dS.value >= NM - 1) return stop(); dS.set(dS.value + 1); v.invalidate(); }, 55);
        });
        v.onCleanup(stop);
        R.onClick((x) => { dS.set(clamp(Math.round((x - YC_START[0]) * 12 - YC_START[1] + 0.5), 0, NM - 1)); });
        v.legend([['accent', 'curve (month shown)'], ['muted', 'a year earlier', { dash: true }], ['red', 'inverted: spread < 0', { area: true }], ['muted', 'recession', { area: true }]]);
        v.render(() => {
          const i = dS.value, key = kS.value, { sp, eps, pre } = episodes(key);
          const row = YC[i], prev = YC[Math.max(0, i - 12)];
          L.setView([0, 10.6], [0, Math.max(...row, ...prev) + 2]);
          L.path(MATS.map((m, j) => [m, prev[j]]), { color: 'muted', width: 1.6, dash: [5, 4] });
          L.path(MATS.map((m, j) => [m, row[j]]), { color: 'accent', width: 2.8 });
          MATS.forEach((m, j) => { L.dot(m, row[j], { r: 5, color: 'accent' }); L.text(fx(row[j], 2), m, row[j], { dy: j % 2 ? -22 : -11, size: 11, color: 'muted', align: m > 9 ? 'right' : 'center' }); });
          const lo = Math.min(...sp), hi = Math.max(...sp);
          R.setView([1976.2, 2027], [Math.floor(lo - 0.3), Math.ceil(hi + 0.3)]);
          RECESSIONS.forEach(([a, b]) => R.vband(decYear(a) - 0.5 / 12, decYear(b) + 0.5 / 12, { color: 'muted', alpha: 0.28 }));
          R.hline(0, { color: 'ink', width: 1 });
          sp.forEach((x, k) => R.rect(decYear(k) - 0.5 / 12, 0, decYear(k) + 0.5 / 12, x, { fill: x < 0 ? 'red' : 'accent', fillAlpha: x < 0 ? 0.8 : 0.35, stroke: false }));
          R.vline(decYear(i), { color: 'gold', width: 2 });
          R.dot(decYear(i), sp[i], { r: 5.5, color: 'gold' });
        });
        v.readout(() => {
          const i = dS.value, key = kS.value, { sp, eps, pre } = episodes(key), row = YC[i];
          const hits = eps.filter((e) => e.hit).length, nrec = RECESSIONS.length, npre = pre.filter(Boolean).length;
          const late = eps.filter((e) => !e.hit).map((e) => monthName(e.a));
          return String.raw`${monthName(i)}: 3-month ${fx(row[0], 2)}%, 2-year ${fx(row[2], 2)}%, 10-year ${fx(row[4], 2)}%  ·  ${key} spread $=${sg(sp[i], 2)}$ points ${sp[i] < 0 ? '(inverted)' : ''}` + '\n' +
            String.raw`scorecard for ${key}, ${monthName(0)}–${monthName(NM - 1)}: ${eps.length} inversion episodes, ${hits} followed by a recession start within 24 months; ${npre} of the ${nrec} recessions had an inversion start in the 24 months before` + (late.length ? String.raw`; not followed by one: ${late.join(', ')}` : '');
        });
      },
    },

    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Hypothesis',
      name: 'The expectations hypothesis',
      statement: String.raw`The **(pure) expectations hypothesis** asserts that forward rates (2.8) are unbiased forecasts of future spot rates: $f(T_1,T_2)=E\bigl[s(T_1,T_2)\bigr]$, where $s(T_1,T_2)$ is the rate that will prevail on a zero for the period $T_1$ to $T_2$. Then long yields are averages of expected short rates and the slope of the curve contains no risk premium. The alternative **liquidity-preference** or **term-premium** view adds a premium: $f=E[s]+\text{premium}$, usually positive because investors pay for the safety of short-term bonds. The hypothesis is testable: regress realised rates on the forwards that predicted them — it predicts slope 1 and equal averages. It is a hypothesis about risk-neutral pricing, not a theorem: arbitrage fixes the forward from today's prices, not its relation to the future.`,
      idea: String.raw`No-arbitrage only ties the forward rate to *today's* zero prices (2.8). Whether it also equals the expected future spot rate requires that investors be indifferent between rolling over short bonds and buying a long bond, i.e. do not demand compensation for the risk that rates move (the long bond's price varies more, by duration, 2.3). If they do demand it, forwards exceed expected spot rates by a term premium. The picture compares the two sides directly: each month's forward is paired with the rate that actually materialised.`,
      caption: String.raw`Each dot or point is one month: the horizontal axis is the forward rate the Treasury curve implied then, the vertical axis the yield that actually prevailed a year (or five years) later. Under the hypothesis the cloud centres on the dashed 45-degree line; the solid line is the fitted regression. Narrow the sample with the two year sliders and see how much the answer depends on the era. Left: the same data through time (forward at the quote date in orange; what happened later, in blue). Caveat: constant-maturity yields are par yields, treated here as spot rates, and overlapping observations are strongly autocorrelated, so no significance claims are made.`,
      deps: ['fin-2.8'],
      refs: ['Luenberger: Term Structure', 'BKM ch. 15'],
      tags: ['forward rates', 'forecasting'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Term_structure_of_interest_rates' },
      viz(v) {
        const HOR = {
          '1y': { h: 12, label: '1-year rate in 1 year (from 1y and 2y yields)', fwd: (r) => { const a = r[1] / 100, b = r[2] / 100; return 100 * ((1 + b) ** 2 / (1 + a) - 1); }, real: (r) => r[1] },
          '5y': { h: 60, label: '5-year rate in 5 years (from 5y and 10y yields)', fwd: (r) => { const a = r[3] / 100, b = r[4] / 100; return 100 * (((1 + b) ** 10 / (1 + a) ** 5) ** 0.2 - 1); }, real: (r) => r[3] },
        };
        const hS = v.select('forecast', [{ value: '1y', label: '1y rate in 1 y' }, { value: '5y', label: '5y rate in 5 y' }], '1y');
        const aS = v.slider('quoted from year', 1976, 2020, 1976, { int: true });
        const bS = v.slider('quoted until year', 1985, 2026, 2026, { int: true });
        const L = v.stage({ x: [1976, 2027], y: [0, 16], height: 310, axes: 'box', gutter: true, weight: 1.35, minWidth: 340, xlabel: 'date the forward was quoted', ylabel: 'rate (%)', title: 'forward quoted vs rate that materialised' });
        const R = v.stage({ x: [0, 16], y: [0, 16], equal: true, height: 310, axes: 'box', gutter: true, weight: 1, minWidth: 280, xlabel: 'forward rate quoted (%)', ylabel: 'rate that materialised (%)', title: 'realised against forward' });
        v.legend([['orange', 'forward quoted'], ['accent', 'realised later'], ['muted', '45° line: forward = outcome', { dash: true }], ['red', 'regression of outcome on forward']]);
        let info = {};
        v.render(() => {
          const H = HOR[hS.value], a = aS.value, b = Math.max(bS.value, a + 3);
          const pts = [];
          for (let i = 0; i + H.h < NM; i++) { const yr = Math.floor(decYear(i)); if (yr < a || yr > b) continue; pts.push({ i, f: H.fwd(YC[i]), r: H.real(YC[i + H.h]) }); }
          const hi = Math.max(16, ...pts.map((p) => Math.max(p.f, p.r))) * 1.02, lo = Math.min(0, ...pts.map((p) => Math.min(p.f, p.r)));
          L.setView([1976, 2027], [lo, hi]);
          L.path(pts.map((p) => [decYear(p.i), p.f]), { color: 'orange', width: 2 });
          L.path(pts.map((p) => [decYear(p.i), p.r]), { color: 'accent', width: 2 });
          R.setView([lo, hi], [lo, hi]);
          R.line(lo, lo, hi, hi, { color: 'muted', width: 1.4, dash: [5, 4] });
          R.dots(pts.map((p) => [p.f, p.r]), { r: 2.6, color: 'accent', alpha: 0.5 });
          const n = pts.length, mf = pts.reduce((s, p) => s + p.f, 0) / n, mr = pts.reduce((s, p) => s + p.r, 0) / n;
          const reg = n > 5 ? v.M.linreg(pts.map((p) => p.f), pts.map((p) => p.r)) : null;
          if (reg) R.line(lo, reg.predict(lo), hi, reg.predict(hi), { color: 'red', width: 2.2 });
          info = { n, mf, mr, reg, over: pts.filter((p) => p.f > p.r).length / n, a, b };
        });
        v.readout(() => {
          const t = info;
          if (!t.reg) return 'Too few months in this window.';
          return String.raw`${HOR[hS.value].label}; ${t.n} monthly observations quoted ${t.a}–${t.b}` + '\n' +
            String.raw`mean forward $${fx(t.mf, 2)}\%$, mean outcome $${fx(t.mr, 2)}\%$: average gap $${sg(t.mf - t.mr, 2)}$ points (the hypothesis says $0$)  ·  forward above the outcome in ${fx(100 * t.over, 0)}% of months  ·  regression slope $${fx(t.reg.slope, 2)}$ (hypothesis: $1$), $R^2=${fx(t.reg.r2, 2)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Model',
      name: 'Vasicek short-rate model',
      statement: String.raw`In the **Vasicek model** the instantaneous short rate follows the mean-reverting diffusion
$$dr_t=a\,(b-r_t)\,dt+\sigma\,dW_t ,$$
with speed $a>0$, long-run mean $b$ and volatility $\sigma$. Then $r_t$ is Gaussian with $E[r_t]=b+(r_0-b)e^{-at}$ and $\operatorname{Var}r_t=\sigma^2(1-e^{-2at})/(2a)$. If bonds are priced by $P(0,T)=E\bigl[e^{-\int_0^Tr_u\,du}\bigr]$ (risk-neutral expectation under the model dynamics), then
$$P(0,T)=e^{-B(T)\,r_0-(T-B(T))\,y_\infty-\sigma^2B(T)^2/4a},\quad B(T)=\frac{1-e^{-aT}}{a},\quad y_\infty=b-\frac{\sigma^2}{2a^2},$$
and the yield curve $y(T)=-\ln P(0,T)/T$ rises, falls or is humped according to where $r_0$ lies relative to $y_\infty$ and how large $\sigma$ is. The model allows negative interest rates, and it has one source of randomness, so all yields are perfectly correlated.`,
      scope: String.raw`The closed form assumes constant parameters and that $a,b,\sigma$ already describe the pricing (risk-neutral) dynamics; real-world and risk-neutral values differ by a risk premium. Rates can go negative with probability $\Phi(-E[r_t]/\mathrm{sd}\,r_t)$.`,
      idea: String.raw`The short rate is an Ornstein–Uhlenbeck process (stoch 13.15): it is pulled toward $b$ at speed $a$ and shaken by Brownian noise, so it is Gaussian with the mean and variance above. The bond price is the expectation of $e^{-\int r}$; the integral $\int_0^Tr\,du$ is also Gaussian, and $E[e^{-X}]=e^{-E X+\frac12\mathrm{Var}X}$ for Gaussian $X$ gives the closed form. The curve starts at $r_0$ for $T\to0$ and tends to $y_\infty<b$ for large $T$ (the convexity term $\sigma^2/2a^2$ pulls long yields below the mean); in between it is humped when $r_0$ sits just below $y_\infty$.`,
      caption: String.raw`Left: thirty simulated paths (exact Gaussian transitions, monthly steps) with the mean and a $\pm2$ standard-deviation band; drag the gold handle to set $r_0$, and move $a$, $b$, $\sigma$. Right: the model yield curve for your $r_0$ (bold), and for a very low and a high starting rate (faint). The readout compares the closed-form 5-year zero price with a Monte Carlo average of $e^{-\int r}$ over 1,500 simulated paths, and shows the probability that the rate is negative at year 5.`,
      deps: ['fin-2.10', 'stoch-13.15', 'prob-2.7.1a'],
      refs: ['Hull ch. 31'],
      tags: ['short rate', 'stochastic models'],
      credit: 'Vasicek, 1977',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vasicek_model' },
      viz(v) {
        const M = v.M;
        const aS = v.slider('reversion speed $a$', 0.05, 1.5, 0.3, { step: 0.01, fmt: (x) => fx(x, 2) });
        const bS = v.slider('long-run mean $b$', 0.01, 0.08, 0.05, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const sS = v.slider('volatility $\\sigma$', 0.002, 0.03, 0.012, { step: 0.001, fmt: (x) => pct(x, 2) });
        let seed = 7;
        v.button('Resample paths', () => { seed += 1; });
        const L = v.stage({ x: [0, 10], y: [-2, 10], height: 330, axes: 'box', gutter: true, weight: 1.15, minWidth: 320, xlabel: 'years', ylabel: 'short rate (%)', title: 'simulated short-rate paths' });
        const R = v.stage({ x: [0, 30], y: [0, 8], height: 330, axes: 'box', gutter: true, weight: 1, minWidth: 300, xlabel: 'maturity $T$ (years)', ylabel: 'zero yield (%)', title: 'the yield curve the model implies' });
        const h0 = L.handle(0, 2, { color: 'gold', r: 8, label: '$r_0$', labelPos: 'ne', constrain: (x, y) => [0, clamp(y, -1, 10)] });
        v.legend([['accent', 'sample path'], ['orange', 'mean ± 2 sd', { area: true }], ['accent', 'curve from your $r_0$'], ['muted', 'long yield $y_\\infty$', { dash: true }]]);
        const yld = (T, r0, a, b, s) => { const B = (1 - Math.exp(-a * T)) / a, yi = b - (s * s) / (2 * a * a); return yi + ((r0 - yi) * B) / T + (s * s * B * B) / (4 * a * T); };
        let mc = { key: '' };
        function simulate(a, b, s, r0) {
          const key = [a, b, s, r0, seed].join('|');
          if (mc.key === key) return mc;
          const rng = v.rng(seed), dt = 1 / 12, NS = 120, NP = 1500, e = Math.exp(-a * dt), sd = s * Math.sqrt((1 - e * e) / (2 * a));
          const paths = [];
          let sumP = 0, neg = 0, sumP2 = 0;
          for (let p = 0; p < NP; p++) {
            let r = r0, I = 0; const path = p < 30 ? new Float32Array(NS + 1) : null;
            if (path) path[0] = r;
            for (let k = 1; k <= NS; k++) {
              const r1 = b + (r - b) * e + sd * rng.normal();
              if (k <= 60) I += 0.5 * (r + r1) * dt;
              r = r1; if (path) path[k] = r;
              if (k === 60 && r < 0) neg++;
            }
            const x = Math.exp(-I); sumP += x; sumP2 += x * x;
            if (path) paths.push(path);
          }
          const mean = sumP / NP, se = Math.sqrt((sumP2 / NP - mean * mean) / NP);
          return (mc = { key, paths, mean, se, neg: neg / NP });
        }
        let info = {};
        v.render(() => {
          const a = aS.value, b = bS.value, s = sS.value, r0 = h0.y / 100, S = simulate(a, b, s, r0);
          const mean = (t) => 100 * (b + (r0 - b) * Math.exp(-a * t)), sdv = (t) => 100 * s * Math.sqrt((1 - Math.exp(-2 * a * t)) / (2 * a));
          const band = [];
          for (let k = 0; k <= 60; k++) band.push([k / 6, mean(k / 6) + 2 * sdv(k / 6)]);
          for (let k = 60; k >= 0; k--) band.push([k / 6, mean(k / 6) - 2 * sdv(k / 6)]);
          const ymin = Math.min(-1, ...band.map((p) => p[1]), r0 * 100) - 0.5, ymax = Math.max(8, ...band.map((p) => p[1]), r0 * 100) + 0.5;
          L.setView([0, 10], [ymin, ymax]);
          L.hline(0, { color: 'ink', width: 1 });
          L.poly(band, { fill: 'orange', fillAlpha: 0.14, color: 'orange', width: 1 });
          S.paths.forEach((p) => L.path(Array.from(p, (x, k) => [k / 12, 100 * x]), { color: 'accent', width: 1, alpha: 0.4 }));
          L.fn(mean, { color: 'orange', width: 2.4, domain: [0, 10] });
          L.hline(b * 100, { color: 'muted', width: 1, dash: [5, 4] });
          // curves
          const yi = b - (s * s) / (2 * a * a), curves = [[0.005, 0.4, 'low $r_0$'], [Math.max(b + 0.035, 0.09), 0.4, 'high $r_0$']];
          const f = (r) => (T) => 100 * yld(T, r, a, b, s);
          const all = M.linspace(0.05, 30, 120).flatMap((T) => [f(r0)(T), f(0.005)(T), f(Math.max(b + 0.035, 0.09))(T)]);
          R.setView([0, 30], [Math.min(0, ...all) - 0.3, Math.max(...all) + 0.5]);
          R.hline(0, { color: 'faint', width: 1 });
          R.hline(yi * 100, { color: 'muted', width: 1.2, dash: [5, 4] });
          R.fn(f(0.005), { color: 'accent', width: 1.4, alpha: 0.35, domain: [0.05, 30] });
          R.fn(f(Math.max(b + 0.035, 0.09)), { color: 'accent', width: 1.4, alpha: 0.35, domain: [0.05, 30] });
          R.fn(f(r0), { color: 'accent', width: 3, domain: [0.05, 30] });
          const ys = M.linspace(0.05, 30, 300).map(f(r0));
          let amax = 0; ys.forEach((y, k) => { if (y > ys[amax]) amax = k; });
          const T = M.linspace(0.05, 30, 300), interior = amax > 2 && amax < 297;
          const shape = interior && ys[amax] - Math.max(ys[0], ys[299]) > 0.02 ? 'humped' : ys[299] > ys[0] ? 'upward-sloping' : 'downward-sloping';
          const pEx = Math.exp(-5 * yld(5, r0, a, b, s)), m5 = b + (r0 - b) * Math.exp(-5 * a), s5 = s * Math.sqrt((1 - Math.exp(-10 * a)) / (2 * a));
          info = { shape, yi, pEx, mc: S.mean, se: S.se, negMC: S.neg, negEx: M.dist.normal(m5, s5).cdf(0), r0, humpT: interior ? T[amax] : null };
        });
        v.readout(() => {
          const t = info;
          return String.raw`curve from $r_0=${pct(t.r0, 2)}$: ${t.shape}${t.humpT ? ` (peak near ${fx(t.humpT, 1)} y)` : ''}; $y_\infty=b-\sigma^2/2a^2=${pct(t.yi, 2)}$` + '\n' +
            String.raw`5-year zero: closed form $${fx(100 * t.pEx, 3)}$, Monte Carlo $${fx(100 * t.mc, 3)}\pm${fx(200 * t.se, 3)}$ (95%, per 100)  ·  $P(r_5<0)$: exact ${fx(100 * t.negEx, 1)}%, simulated ${fx(100 * t.negMC, 1)}%`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Concept',
      name: 'Credit spreads and default probabilities',
      statement: String.raw`A bond that may default yields more than a default-free bond of the same maturity; the difference is its **credit spread** $s=y-r$. Model default by an annual default probability $q$ (the hazard rate) and a **recovery rate** $R$ (the fraction of face value paid after default). For a $T$-year zero-coupon bond the risk-neutral expected payoff per \$1 of face is $X=(1-q)^T+R\bigl(1-(1-q)^T\bigr)$, so with a flat riskless rate $r$ the price is $X/(1+r)^T$ and the yield satisfies $1+y=(1+r)\,X^{-1/T}$. For small $q$, $s\approx(1-R)\,q$: the spread pays for the expected loss given default. Read backwards, an observed spread and an assumed recovery imply a default probability $q\approx s/(1-R)$.`,
      scope: String.raw`The implied $q$ is a *risk-neutral* probability: spreads also pay for liquidity and for the risk of default clustering in bad times, so real-world default frequencies are lower than the implied $q$. The picture assumes recovery paid at maturity, constant $q$ and a flat riskless curve.`,
      idea: String.raw`Today's price is the discounted risk-neutral expected payoff (law of one price, as for forwards in 2.8), and the bond is a promise that pays $1$ in the no-default state and $R$ in the default state. Since the bond price is increasing in $X$ and $X$ is decreasing in $q$, a unique $q$ reproduces any observed spread between $0$ and the value for $q\to1$. Expanding $X\approx1-(1-R)qT$ for small $qT$ gives the rule of thumb $s\approx(1-R)q$, which breaks down as default becomes likely.`,
      caption: String.raw`Left: the spread produced by each default probability (solid) against the rule of thumb $(1-R)q$ (dashed). Set the market spread with the slider, or drag the gold point along the curve; the vertical line is the implied $q$. The rule of thumb is accurate for small $q$ and visibly off for large spreads, long maturities or low recovery. Right: the probability of defaulting in each year given the implied $q$, with the cumulative default probability over the bond's life.`,
      deps: ['fin-2.1', 'pma-5.15'],
      refs: ['Hull ch. 24'],
      tags: ['credit', 'default'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Credit_spread_(bond)' },
      viz(v) {
        const sS = v.slider('observed credit spread (bp)', 0, 1500, 250, { step: 5, fmt: (x) => fx(x, 0) + ' bp' });
        const rS = v.slider('recovery rate $R$', 0, 0.9, 0.4, { step: 0.05, fmt: (x) => pct(x, 0) });
        const tS = v.slider('maturity $T$ (years)', 1, 10, 5, { int: true });
        const rfS = v.slider('riskless rate $r$', 0, 0.08, 0.03, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const QM = 0.25;
        const L = v.stage({ x: [0, QM], y: [0, 1500], height: 320, axes: 'box', gutter: true, weight: 1.1, minWidth: 320, xlabel: 'annual default probability $q$', ylabel: 'credit spread (bp)', xticks: pctTicks(0, QM, 0.05, 0), title: 'spread produced by a default probability' });
        const R = v.stage({ x: [0.3, 10.7], y: [0, 1], height: 320, axes: 'box', gutter: true, weight: 1, minWidth: 280, xlabel: 'year', ylabel: 'probability', title: 'when the bond defaults, given the implied $q$' });
        const spreadOf = (q, Rr, T, r) => { const sv = Math.pow(1 - q, T), X = sv + Rr * (1 - sv); return (1 + r) * Math.pow(X, -1 / T) - 1 - r; };
        const implied = (s, Rr, T, r) => { let lo = 0, hi = 0.999; if (spreadOf(hi, Rr, T, r) < s) return NaN; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (spreadOf(m, Rr, T, r) < s) lo = m; else hi = m; } return (lo + hi) / 2; };
        const hq = L.handle(0.04, 250, { color: 'gold', label: '$q$', labelPos: 'ne', constrain: (x) => { const q = clamp(x, 0.0005, QM); return [q, 1e4 * spreadOf(q, rS.value, tS.value, rfS.value)]; } });
        hq.onDrag = () => sS.set(clamp(Math.round((1e4 * spreadOf(hq.x, rS.value, tS.value, rfS.value)) / 5) * 5, 0, 1500));
        v.legend([['accent', 'exact spread for $q$'], ['orange', 'rule of thumb $(1-R)q$', { dash: true }], ['muted', 'observed spread', { dash: true }], ['red', 'default in year $t$', { area: true }]]);
        let info = {};
        v.render(() => {
          const s = sS.value * 1e-4, Rr = rS.value, T = tS.value, r = rfS.value, q = implied(s, Rr, T, r), ok = Number.isFinite(q);
          const top = 1500;
          L.setView([0, QM], [0, top]);
          L.fn((x) => 1e4 * spreadOf(x, Rr, T, r), { color: 'accent', width: 2.8, domain: [0, QM] });
          L.fn((x) => 1e4 * (1 - Rr) * x, { color: 'orange', width: 2, dash: [6, 4], domain: [0, QM] });
          L.hline(s * 1e4, { color: 'muted', width: 1.4, dash: [4, 4] });
          if (ok && q <= QM) { L.vline(q, { color: 'gold', width: 1.4, dash: [4, 3] }); hq.set(q, s * 1e4); } else hq.set(QM, 1e4 * spreadOf(QM, Rr, T, r));
          // timing bars
          const qq = ok ? q : 0;
          let surv = 1;
          R.setView([0.3, T + 0.7], [0, Math.max(0.12, qq * 1.25)]);
          for (let t = 1; t <= T; t++) { const d = surv * qq; R.rect(t - 0.34, 0, t + 0.34, d, { fill: 'red', fillAlpha: 0.6, color: 'red', width: 1 }); if (T <= 10) R.text(pct(d, 1), t, d, { dy: -9, size: 11, color: 'muted', align: 'center' }); surv *= 1 - qq; }
          const cum = 1 - surv;
          R.text(`default by year ${T}: ${pct(cum, 1)}   survival: ${pct(surv, 1)}`, (T + 1) / 2, Math.max(0.12, qq * 1.25), { dy: 14, size: 12.5, color: 'ink', weight: 700, align: 'center' });
          const X = Math.pow(1 - qq, T) + Rr * (1 - Math.pow(1 - qq, T));
          info = { ok, q, approx: s / (1 - Rr), cum, s, Rr, T, price: X / Math.pow(1 + r, T), pf: 1 / Math.pow(1 + r, T), loss: (1 - Rr) * cum };
        });
        v.readout(() => {
          const t = info;
          if (!t.ok) return 'No default probability reproduces this spread (it exceeds even certain default).';
          return String.raw`implied annual default probability $q=${pct(t.q, 3)}$ (rule of thumb $s/(1-R)=${pct(t.approx, 3)}$)  ·  probability of default within ${t.T} years ${pct(t.cum, 2)}` + '\n' +
            String.raw`zero-coupon price ${dl(100 * t.price, 2)} per 100 vs ${dl(100 * t.pf, 2)} riskless; expected loss ${pct(t.loss, 2)} of face over the life; the spread is ${bp(t.s)}`;
        });
      },
    },
  ],
};
