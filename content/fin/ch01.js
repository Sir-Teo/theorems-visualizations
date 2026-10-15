// Finance — Chapter 1: The time value of money (items 1.1–1.6; 1.7–1.13 are in ch01-b.js)
import { clamp, pct, fx, sg, money, usd, npv, irrs, labelColumn, niceUp } from './ch01.shared.js';

const LN2 = Math.LN2;
/** Hatched rectangle with an outline (drawn in two passes: the runtime's hatch must not be combined with a stroke). */
function hatchRect(S, x0, y0, x1, y1, col, alpha = 0.3) {
  S.rect(x0, y0, x1, y1, { fill: col, fillAlpha: alpha, hatch: col, stroke: false });
  S.rect(x0, y0, x1, y1, { color: col, width: 1.2 });
}
const pctTicks = (xs, d = 0) => xs.map((x) => [x, pct(x, d)]);

export default {
  collection: 'fin',
  chapter: 1,
  title: 'The time value of money',
  summary: String.raw`A dollar today is worth more than a dollar next year because it can earn interest, and compounding makes that difference grow exponentially; compounded ever more often it converges to $e^{rt}$. Discounting turns any stream of cash flows into one present value, which gives the net-present-value rule for investment decisions and closed forms for annuities, perpetuities, mortgages and growing dividends. The internal rate of return is a popular one-number summary with well-known pathologies, and the law of one price — identical cash flows must cost the same — is the no-arbitrage principle on which the rest of finance is built.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Simple and compound interest',
      statement: String.raw`A deposit $P$ earns interest at rate $r$ per period. Under **simple interest** only the original principal earns interest, so after $t$ periods the balance is
$$A_{\text{simple}}(t)=P\,(1+rt),$$
a straight line. Under **compound interest** each period's interest is added to the balance and earns interest from then on, so
$$A_{\text{comp}}(t)=P\,(1+r)^t,$$
a geometric sequence. For $r>0$ and every whole number of periods $t\ge 2$ the compound balance is strictly larger; the gap $P\,[(1+r)^t-1-rt]$ and the ratio $(1+r)^t/(1+rt)$ both grow without bound. On a logarithmic scale compound growth is a straight line of slope $\ln(1+r)$ per period.`,
      idea: String.raw`Expand the compound factor with the binomial theorem: $(1+r)^t=\sum_{j=0}^{t}\binom{t}{j}r^j = 1+rt+\binom t2 r^2+\cdots$. The $j=0$ term is the principal and $j=1$ is exactly the simple interest; every term with $j\ge2$ is interest earned on earlier interest, a "$j$-th generation" of interest, and all of them are positive. The geometric sequence (pma 3.26) grows exponentially, $(1+r)^t=e^{t\ln(1+r)}$, so it eventually outruns the straight line by any factor. As $t$ grows the bulk of the balance moves into ever higher generations.`,
      caption: String.raw`Left: each bar is the balance after that year, split into the principal (grey), simple interest $rkP$ (orange) and interest on interest (gold); the orange line is the simple balance, the blue curve the compound one. Drag the gold handle to pick a year $k$ and switch the axis to log to see compound growth become a straight line. Right: the same year-$k$ balance split by the binomial theorem into generations of interest — at small $rk$ almost everything is principal and simple interest; at large $rk$ the money sits in high generations.`,
      deps: ['pma-3.26'],
      see: ['macro-5.4', 'bighist-8.1'],
      refs: ['Luenberger: Basic Theory of Interest', 'Hull ch. 4'],
      tags: ['interest', 'growth'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Compound_interest' },
      viz(v) {
        const M = v.M, TM = 50, J = 12;
        const rS = v.slider('interest rate $r$ per year', 0.005, 0.25, 0.08, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const axS = v.select('vertical axis', ['linear', 'log'], 'linear');
        const L = v.stage({ x: [0, TM + 1.5], y: [0, 50], height: 330, axes: 'box', weight: 1.45, minWidth: 340, xlabel: 'years', ylabel: '$ thousands', title: String.raw`a $\$1{,}000$ deposit: the balance after each year` });
        const R = v.stage({ x: [-0.7, J + 1.7], y: [0, 1], height: 330, axes: 'box', weight: 1, minWidth: 260, xlabel: 'generation j', ylabel: '$ thousands', title: String.raw`year $k$, term by term: $\binom{k}{j}r^j P$` });
        const g = (t) => Math.pow(1 + rS.value, t);
        const hk = L.handle(30, g(30), { color: 'gold', label: 'k', labelPos: 'nw', constrain: (x) => { const k = M.clamp(Math.round(x), 1, TM); return [k, g(k)]; } });
        v.legend([['muted', 'principal ($j=0$)', { area: true }], ['orange', 'simple interest $rkP$ ($j=1$)', { area: true }], ['gold', 'interest on interest ($j\\ge2$)', { area: true }], ['accent', 'compound $P(1+r)^t$'], ['orange', 'simple $P(1+rt)$']]);
        let st = null, tickSig = '';
        v.render(() => {
          const r = rS.value, log = axS.value === 'log', k = Math.round(hk.x), top = g(TM);
          const yv = log ? [0.5, top * 1.8] : [-0.045 * top, top * 1.08];
          if (L.ly !== log) L.setScale({ ylog: log, y: yv });
          L.setView([0, TM + 1.5], yv);
          hk.y = g(k);
          const lo = log ? 0.72 : 0;
          for (let t = 1; t <= TM; t++) {
            const on = t === k, a = on ? 1 : 0.5, x0 = t - 0.36, x1 = t + 0.36, s = 1 + r * t, c = g(t);
            L.rect(x0, lo, x1, 1, { fill: 'muted', fillAlpha: on ? 0.55 : 0.3, stroke: false });
            L.rect(x0, 1, x1, s, { fill: 'orange', fillAlpha: 0.8 * a, stroke: false });
            if (c > s) L.rect(x0, s, x1, c, { fill: 'gold', fillAlpha: 0.85 * a, stroke: false });
            if (on) L.rect(x0, lo, x1, c, { color: 'ink', width: 1.3 });
          }
          L.fn((t) => 1 + r * t, { domain: [0, TM], color: 'orange', width: 2.2 });
          L.fn(g, { domain: [0, TM], color: 'accent', width: 2.6 });
          L.text('compound', TM, top, { align: 'right', dx: -10, dy: -2, color: 'accent', weight: 700, size: 12 });
          L.text('simple', 0.72 * TM, 1 + r * 0.72 * TM, { align: 'center', dy: -12, color: 'orange', weight: 700, size: 12 });
          const sk = 1 + r * k, ck = g(k);
          if (Math.abs(L.Y(sk) - L.Y(ck)) > 34) {
            L.arrow(k + 1.2, sk, k + 1.2, ck, { both: true, color: 'gold', width: 1.5, head: 6 });
            L.text('interest on interest', k + 1.8, Math.sqrt(sk * ck), { color: 'gold', weight: 700, size: 11.5, align: k > 36 ? 'right' : 'left', dx: k > 36 ? -30 : 0 });
          }
          // right: binomial generations of interest
          const Jk = Math.min(k, J), terms = [];
          let acc = 0;
          for (let j = 0; j <= Jk; j++) { const tj = M.binom(k, j) * Math.pow(r, j); terms.push(tj); acc += tj; }
          const rest = Math.max(0, ck - acc), hasRest = k > J && rest > 0.004 * Math.max(...terms);
          const ymax = niceUp(Math.max(...terms, hasRest ? rest : 0) * 1.12);
          const ticks = []; for (let j = 0; j <= Jk; j++) if (j <= 2 || j % 2 === 0) ticks.push([j, String(j)]);
          if (hasRest) ticks.push([Jk + 1, `>${J}`]);
          const sig = JSON.stringify(ticks);
          if (sig !== tickSig) { tickSig = sig; R.setTicks(ticks, undefined); v.invalidate(); }
          R.setView([-0.7, Jk + (hasRest ? 1.7 : 0.7)], [0, ymax]);
          terms.forEach((tj, j) => R.rect(j - 0.36, 0, j + 0.36, tj, { fill: j === 0 ? 'muted' : j === 1 ? 'orange' : 'gold', fillAlpha: j === 0 ? 0.55 : 0.85, stroke: false }));
          if (hasRest) hatchRect(R, Jk + 1 - 0.36, 0, Jk + 1 + 0.36, rest, 'gold', 0.35);
          R.corner(`year ${k}: total ${money(1000 * ck)}`, 'tr', { color: 'accent', weight: 650 });
          st = { r, k, sk, ck, log, share: (ck - sk) / ck };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, k, sk, ck, log, share } = st;
          return `Year ${k} at ${pct(r, 2)}: simple ${usd(1000 * sk)}, compound ${usd(1000 * ck)}. The gap ${usd(1000 * (ck - sk))} is interest earned on interest — ${pct(share, 0)} of the compound balance — and compound/simple = ${fx(ck / sk, 2)}, a ratio that keeps growing. Binomial check: $\\sum_j \\binom{${k}}{j} r^j P$ = ${usd(1000 * ck)} ✓` + (log ? ` · on the log axis the compound line rises by $\\ln(1+r)$ = ${fx(Math.log1p(r), 4)} per year, a constant slope.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Theorem',
      name: 'Continuous compounding and eʳᵗ',
      statement: String.raw`A nominal annual rate $r$ compounded $m$ times a year turns $\$1$ into $(1+r/m)^{mt}$ after $t$ years. For fixed $r>0$ and $t>0$ this amount increases with $m$ and
$$\lim_{m\to\infty}\Big(1+\frac rm\Big)^{mt}=e^{rt},\qquad 0<e^{rt}-\Big(1+\frac rm\Big)^{mt}\le \frac{r^2t}{2m}\,e^{rt}.$$
The limit is **continuous compounding**: the balance $A(t)=A(0)\,e^{rt}$ grows at the instantaneous rate $A'(t)=rA(t)$, and a continuously compounded rate $r$ is equivalent to a once-a-year rate $e^r-1$.`,
      idea: String.raw`Write $(1+r/m)^{mt}=\exp\!\big(mt\ln(1+r/m)\big)$. Since $x-\tfrac{x^2}{2}\le\ln(1+x)\le x$ for $x\ge0$, the exponent lies between $rt-\tfrac{r^2t}{2m}$ and $rt$, which squeezes the amount to $e^{rt}$ and, with $e^{-u}\ge1-u$, gives the error bound; it is the same limit that defines $e$ (pma 3.31) with $n=m/r$. Monotonicity is the AM–GM inequality applied to $m$ copies of $1+r/m$ and one copy of $1$: their arithmetic mean is $1+r/(m+1)$, so $(1+r/m)^m\le\big(1+r/(m+1)\big)^{m+1}$. Continuity of $\exp$ and its differential equation (pma 8.6) give $A'=rA$.`,
      caption: String.raw`Left: one dollar compounded annually (red), twice a year, quarterly, monthly and daily (blue): each balance is a staircase that jumps on its compounding dates, and the staircases climb toward the smooth green curve $e^{rt}$. The default $r=100\%$, $t=1$ is Jacob Bernoulli's 1683 question, whose answer is $e$. Right: the shortfall from $e^{rt}$ on log–log axes falls like $1/m$, hugging the dashed prediction $r^2te^{rt}/(2m)$. Lower $r$ to realistic rates and see how little continuous compounding adds.`,
      deps: ['fin-1.1', 'pma-3.31', 'pma-8.6'],
      refs: ['Luenberger: Basic Theory of Interest', 'Hull ch. 4'],
      tags: ['interest', 'exponential'],
      credit: 'Jacob Bernoulli, 1683',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Compound_interest#Continuous_compounding' },
      viz(v) {
        const FREQ = [1, 2, 4, 12, 365], COL = ['red', 'orange', 'gold', 'teal', 'blue'];
        const rS = v.slider('nominal rate $r$', 0.01, 1, 1, { step: 0.01, fmt: (x) => pct(x, 0) });
        const tS = v.slider('years $t$', 0.25, 5, 1, { step: 0.25, fmt: (x) => x.toFixed(2) });
        const mS = v.select('highlight', [...FREQ.map((m) => ({ value: String(m), label: `$m=${m}$` })), { value: 'inf', label: '$m\\to\\infty$' }], '12');
        const A = v.stage({ x: [0, 1.4], y: [0.9, 2.9], height: 330, axes: 'box', weight: 1.35, minWidth: 340, xlabel: 'years', ylabel: 'balance per $1', title: String.raw`$\$1$ compounded $m$ times a year` });
        const B = v.stage({ x: [1, 1e5], y: [1e-6, 1], xlog: true, ylog: true, height: 330, axes: 'box', weight: 1, minWidth: 270, xlabel: 'm, compoundings a year', title: String.raw`shortfall $e^{rt}-(1+r/m)^{mt}$` });
        const bal = (r, m, t) => Math.exp(m * t * Math.log1p(r / m));
        v.legend([...FREQ.map((m, i) => [COL[i], `$m=${m}$`]), ['green', '$e^{rt}$'], ['muted', '$r^2te^{rt}/(2m)$', { dash: true }]]);
        let st = null;
        v.render(() => {
          const r = rS.value, T = tS.value, E = Math.exp(r * T), sel = mS.value;
          A.setView([0, T * 1.42], [1 - 0.1 * (E - 1), 1 + (E - 1) * 1.08]);
          FREQ.forEach((m, i) => {
            const on = sel === String(m), n = Math.floor(m * T + 1e-9), q = 1 + r / m, pts = [];
            let val = 1;
            for (let k = 0; k <= n; k++) { pts.push([k / m, val], [Math.min((k + 1) / m, T), val]); val *= q; }
            A.path(pts, { color: COL[i], width: on ? 3 : 1.6, alpha: on ? 1 : 0.5 });
            if (on) A.dot(T, bal(r, m, T), { r: 5, color: COL[i] });
          });
          A.fn((t) => Math.exp(r * t), { domain: [0, T], color: 'green', width: sel === 'inf' ? 3.2 : 2, dash: sel === 'inf' ? null : [7, 4] });
          A.vline(T, { color: 'faint', width: 1 });
          labelColumn(A, T, [...FREQ.map((m, i) => [bal(r, m, T), `m = ${m}: ${bal(r, m, T).toFixed(4)}`, COL[i]]), [E, `eʳᵗ: ${E.toFixed(4)}`, 'green']], { gap: 15, leader: v.color('faint') });
          // right: the shortfall on log–log axes
          const gap = (m) => E - bal(r, m, T);
          const gHi = gap(1), gLo = gap(1e5);
          B.setView([1, 1e5], [gLo / 4, gHi * 4]);
          B.fn((m) => (E * r * r * T) / (2 * m), { color: 'muted', dash: [6, 4], width: 1.6 });
          B.fn(gap, { color: 'green', width: 2.4 });
          FREQ.forEach((m, i) => B.dot(m, gap(m), { r: sel === String(m) ? 6.5 : 4.5, color: COL[i] }));
          if (sel !== 'inf') { const m = +sel; B.text(`short by ${gap(m).toPrecision(3)}`, m, gap(m), { dx: 10, dy: -10, color: COL[FREQ.indexOf(m)], weight: 700, size: 12 }); }
          B.corner('slope −1: ten times as often, ten times closer', 'tr', { color: 'muted', size: 11.5 });
          st = { r, T, E, sel, gap };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, T, E, sel, gap } = st;
          const list = FREQ.map((m) => `$m=${m}$: ${bal(r, m, T).toFixed(5)}`).join(' · ');
          const m = sel === 'inf' ? 365 : +sel;
          return `${list} · limit $e^{rt}$ = **${E.toFixed(5)}** · shortfall × $m$: ${(gap(m) * m).toFixed(4)} at $m=${m}$, ${(gap(1e4) * 1e4).toFixed(4)} at $m=10^4$, tending to $r^2te^{rt}/2$ = ${((r * r * T * E) / 2).toFixed(4)}` + (Math.abs(r - 1) < 1e-9 && Math.abs(T - 1) < 1e-9 ? ' · with $r=100\\%$ for one year the limit is $e = 2.71828\\ldots$, Bernoulli\'s answer.' : ` · continuous compounding adds ${pct((E - bal(r, 1, T)) / bal(r, 1, T), 3)} to annual compounding here.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Effective annual rate',
      statement: String.raw`The **effective annual rate** (EAR, or annual percentage yield) of a nominal annual rate $r$ compounded $m$ times a year is the once-a-year rate that produces the same growth:
$$\text{EAR}=\Big(1+\frac rm\Big)^m-1,\qquad\text{and }\ \text{EAR}=e^r-1\ \text{ for continuous compounding.}$$
Conversely, an effective rate $R$ corresponds to the nominal rate $m\big[(1+R)^{1/m}-1\big]$ with $m$ compoundings, or $\ln(1+R)$ continuously. Two quoted rates can be ranked only after they are converted to a common basis such as the EAR; a quoted rate alone (an "APR") says nothing until its compounding frequency is known.`,
      idea: String.raw`Rates with different compounding conventions are different units for the same thing, a growth factor per year. Converting each to the factor it produces, $(1+r/m)^m$, puts them on one scale. For a fixed quote the EAR rises with $m$ and levels off at $e^r-1$ (fin 1.2), so a lower quote compounded more often can cost more than a higher one compounded annually.`,
      caption: String.raw`Left: one quoted rate (slider) compounded $m$ times a year; the effective rate climbs with $m$ toward the continuous limit $e^r-1$. Right: four loan offers. Drag a hollow handle to change an offer's quoted rate and click its label to change how often it compounds. The filled dot is the effective rate; the green one is the truly cheapest loan, which is often not the one with the lowest quote.`,
      deps: ['fin-1.2'],
      refs: ['Luenberger: Basic Theory of Interest'],
      tags: ['interest', 'rates'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Effective_interest_rate' },
      viz(v) {
        const M = v.M;
        const FR = [{ m: 1, name: 'annual' }, { m: 2, name: 'semiannual' }, { m: 4, name: 'quarterly' }, { m: 12, name: 'monthly' }, { m: 365, name: 'daily' }, { m: Infinity, name: 'continuous' }];
        const ear = (r, m) => (m === Infinity ? Math.expm1(r) : Math.expm1(m * Math.log1p(r / m)));
        const rS = v.slider('quoted rate (left panel)', 0.01, 0.3, 0.12, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const L = v.stage({ x: [1, 1e4], y: [11, 13], xlog: true, height: 330, axes: 'box', weight: 1, minWidth: 300, xlabel: 'compoundings a year m', ylabel: 'EAR (%)', title: 'one quote, many effective rates' });
        const R = v.stage({ x: [0.35, 4.6], y: [9.55, 14.2], height: 330, axes: 'box', weight: 1.15, minWidth: 330, xticks: [], title: 'four loan offers, rates in %: which is cheapest?' });
        const offers = [{ id: 'A', r: 12, f: 0 }, { id: 'B', r: 11.8, f: 3 }, { id: 'C', r: 11.7, f: 4 }, { id: 'D', r: 11.6, f: 5 }];
        const hs = offers.map((o, i) => R.handle(i + 1, o.r, { color: 'accent', r: 6.5, constrain: (x, y) => [i + 1, Math.round(M.clamp(y, 10.6, 13) * 20) / 20] }));
        R.onClick((x, y) => {
          const i = Math.round(x) - 1;
          if (i >= 0 && i < 4 && Math.abs(x - (i + 1)) < 0.45 && y < 10.35) offers[i].f = (offers[i].f + 1) % FR.length;
        });
        v.legend([['accent', 'quoted (nominal) rate', { dot: true }], ['purple', 'effective annual rate', { dot: true }], ['green', 'cheapest by EAR', { dot: true }]]);
        let st = null;
        v.render(() => {
          // left: EAR as a function of m
          const r = rS.value, lim = 100 * Math.expm1(r), lo = 100 * r, pad = 0.2 * (lim - lo);
          L.setView([1, 1e4], [lo - pad, lim + pad]);
          L.hline(lim, { color: 'green', width: 1.6, dash: [7, 4] });
          L.text(`continuous: eʳ − 1 = ${lim.toFixed(3)}%`, 40, lim, { dy: -11, color: 'green', weight: 650, size: 11.5 });
          L.hline(lo, { color: 'accent', width: 1, dash: [3, 4] });
          L.text(`quoted ${pct(r, 2)}`, 60, lo, { dy: -10, color: 'accent', size: 11.5, weight: 600 });
          L.fn((m) => 100 * ear(r, m), { color: 'purple', width: 2.4 });
          [[1, 'annual'], [2, 'semi'], [4, 'quarterly'], [12, 'monthly'], [365, 'daily']].forEach(([m, nm]) => {
            const y = 100 * ear(r, m);
            L.dot(m, y, { r: 4.5, color: 'purple' });
            L.text(`${nm} ${y.toFixed(2)}%`, m, y, { dx: 7, dy: 11, color: 'purple', size: 11, weight: 600 });
          });
          // right: offers
          const rows = offers.map((o, i) => { const nom = hs[i].y / 100, e = ear(nom, FR[o.f].m); return { ...o, i, nom, e }; });
          const byE = rows.slice().sort((a, b) => a.e - b.e), byN = rows.slice().sort((a, b) => a.nom - b.nom);
          const best = byE[0];
          rows.forEach((q) => {
            const x = q.i + 1, isBest = q === best, col = isBest ? 'green' : 'purple';
            if (Math.abs(R.Y(100 * q.e) - R.Y(100 * q.nom)) > 12) R.arrow(x, 100 * q.nom, x, 100 * q.e, { color: col, width: 1.8, head: 7, alpha: 0.7 });
            R.dot(x, 100 * q.e, { r: isBest ? 8 : 6.5, color: col });
            R.text(`EAR ${(100 * q.e).toFixed(2)}%`, x, 100 * q.e, { dy: -16, align: 'center', color: col, weight: 700, size: 11.5 });
            R.text(`quote ${(100 * q.nom).toFixed(2)}%`, x, 100 * q.nom, { dy: 17, align: 'center', color: 'accent', weight: 600, size: 11 });
            R.text(`${q.id} · ${FR[q.f].name}`, x, 9.95, { align: 'center', color: 'ink', weight: 650, size: 11.5, plate: true });
            const kE = byE.indexOf(q) + 1, kN = byN.indexOf(q) + 1;
            R.text(`by quote #${kN}`, x, 14.05, { align: 'center', color: 'muted', size: 10.5, weight: 600 });
            R.text(`by EAR #${kE}`, x, 13.78, { align: 'center', color: kE === 1 ? 'green' : 'ink', size: 11, weight: 700 });
          });
          st = { rows, best, cheapQ: byN[0] };
        });
        v.readout(() => {
          if (!st) return '';
          const { rows, best, cheapQ } = st;
          const list = rows.map((q) => `${q.id}: ${pct(q.nom, 2)} ${FR[q.f].name} → EAR **${pct(q.e, 3)}**`).join(' · ');
          return `${list}. Lowest quote: **${cheapQ.id}**; cheapest once compounding is counted: **${best.id}**` + (cheapQ !== best ? ' — the ranking flips.' : '.') + ` For the left panel's ${pct(rS.value, 2)} quote the EAR runs from ${pct(rS.value, 2)} (annual) to ${pct(Math.expm1(rS.value), 3)} (continuous).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Principle',
      name: 'The rule of 72',
      statement: String.raw`Money compounding once a year at $r$ percent doubles in
$$T=\frac{\ln 2}{\ln(1+r/100)}\ \text{years}\;\approx\;\frac{72}{r}.$$
The rule is within about 2% of the exact doubling time for rates between roughly 4% and 12% and is exact near $r\approx7.85\%$; it overestimates at lower rates and underestimates at higher ones. With continuous compounding the exact rule is $T=69.3/r$ (since $100\ln2=69.3$), the "rule of 70". More generally the numerator that makes the rule exact is $N(r)=r\,T=100\ln 2\cdot\frac{r/100}{\ln(1+r/100)}\approx 69.3\,(1+\tfrac{r}{200})$.`,
      idea: String.raw`Solve $(1+i)^T=2$: $T=\ln2/\ln(1+i)$ with $i=r/100$. Taylor's theorem (pma 5.15) gives $\ln(1+i)=i-\tfrac{i^2}{2}+\cdots$, so $\frac{i}{\ln(1+i)}=1+\tfrac i2-\tfrac{i^2}{12}+\cdots$ and $N\approx 69.3(1+i/2)$, which equals $72$ at $i\approx 8\%$. That is why 72 — handy also because it has many divisors — suits typical interest rates, while continuously compounded growth (fin 1.2) has $N=69.3$ exactly at every rate.`,
      caption: String.raw`Left: one dollar compounding over two doublings, with the exact doubling times (green), the rule of 72 (orange) and $69.3/r$ (purple). Right: the numerator $N(r)$ that would make "$N/r$" exact, for yearly, monthly and continuous compounding; with yearly compounding it crosses 72 at 7.85%, and the dashed Taylor approximation $69.3(1+r/2)$ follows it closely. Move the rate and the compounding.`,
      deps: ['fin-1.2', 'pma-5.15'],
      see: ['demo-1.4', 'mathbio-1.3', 'bighist-8.1'],
      refs: ['Luenberger: Basic Theory of Interest'],
      tags: ['interest', 'approximation'],
      credit: 'Luca Pacioli, 1494',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rule_of_72' },
      viz(v) {
        const M = v.M;
        const rS = v.slider('interest rate $r$', 0.005, 0.3, 0.06, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const cS = v.select('compounding', [{ value: 'y', label: 'yearly' }, { value: 'm', label: 'monthly' }, { value: 'c', label: 'continuous' }], 'y');
        const L = v.stage({ x: [0, 30], y: [0, 5], height: 330, axes: 'box', weight: 1.15, minWidth: 320, xlabel: 'years', ylabel: 'balance per $1', title: 'two doublings: exact and by rule of thumb' });
        const R = v.stage({ x: [0, 0.3], y: [67, 81], height: 330, axes: 'box', weight: 1, minWidth: 300, xlabel: 'interest rate r', ylabel: 'N', xticks: pctTicks([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]), title: String.raw`the exact numerator $N(r)=r\cdot T_{\text{exact}}$` });
        const Tex = (r, c) => (c === 'y' ? LN2 / Math.log1p(r) : c === 'm' ? LN2 / (12 * Math.log1p(r / 12)) : LN2 / r);
        const N = (r, c) => 100 * r * Tex(r, c);
        // where the yearly numerator equals 72
        const r72 = M.bisect((r) => N(r, 'y') - 72, 0.01, 0.2);
        v.legend([['accent', 'balance'], ['green', 'exact doubling time'], ['orange', '$72/r$', { dash: true }], ['purple', '$69.3/r$', { dash: true }], ['muted', 'Taylor $69.3(1+r/2)$', { dash: true }]]);
        let st = null;
        v.render(() => {
          const r = rS.value, c = cS.value, T = Tex(r, c), X = 2.3 * T, rp = 100 * r;
          L.setView([0, X], [0, 5]);
          const pts = [];
          if (c === 'c') { for (let i = 0; i <= 300; i++) { const t = (X * i) / 300; pts.push([t, Math.exp(r * t)]); } }
          else {
            const per = c === 'y' ? 1 : 1 / 12, q = c === 'y' ? 1 + r : 1 + r / 12, n = Math.ceil(X / per);
            let val = 1; for (let k = 0; k < n; k++) { pts.push([k * per, val], [Math.min((k + 1) * per, X), val]); val *= q; }
          }
          L.path([...pts, [X, 0], [0, 0]], { fill: 'accent', fillAlpha: 0.1, stroke: false, close: true });
          L.path(pts, { color: 'accent', width: 2.3 });
          [2, 4].forEach((y) => { L.hline(y, { color: 'muted', width: 1, dash: [4, 4] }); L.text(`×${y}`, 0.3 * X, y, { dy: -9, align: 'center', color: 'muted', weight: 700, size: 11.5 }); });
          const lines = [[T, 'green', `exact ${fx(T, 2)} yr`, null], [72 / rp, 'orange', `72/r = ${fx(72 / rp, 2)}`, [7, 4]], [100 * LN2 / rp, 'purple', `69.3/r = ${fx(69.3147 / rp, 2)}`, [2, 3]]];
          lines.forEach(([x, col, , dash], i) => {
            L.line(x, 0, x, 2, { color: col, width: 2, dash });
            L.line(2 * x, 0, 2 * x, 4, { color: col, width: 1.4, dash: dash || [1, 0], alpha: 0.7 });
            L.dot(x, 2, { r: i === 0 ? 4.5 : 3, color: col });
          });
          lines.forEach(([x, col, lab], i) => L.text(lab, x, 4.82 - 0.26 * i, { dx: 4, color: col, weight: 700, size: 11.5, align: x > 0.62 * X ? 'right' : 'left' }));
          if (c === 'y' && Math.ceil(T - 1e-9) - T > 0.02) { const k = Math.ceil(T); L.dot(k, Math.pow(1 + r, k), { r: 4, color: 'accent' }); L.text(`whole years: ${k}`, k, Math.pow(1 + r, k), { dx: 6, dy: 10, color: 'accent', size: 11, weight: 600 }); }
          // right: the exact numerator
          [[72, 'orange', 'rule of 72', [7, 4]], [70, 'muted', 'rule of 70', [2, 3]], [100 * LN2, 'purple', '69.3 = 100 ln 2', [2, 3]]].forEach(([y, col, lab, dash]) => {
            R.hline(y, { color: col, width: 1.4, dash });
            if (y > 69.5) R.text(lab, 0.16, y, { dy: -8, color: col, weight: 650, size: 11 });
            else R.text(lab, 0.297, y, { align: 'right', dy: 10, color: col, weight: 650, size: 11 });
          });
          R.fn((x) => 100 * LN2 * (1 + x / 2), { domain: [0.001, 0.3], color: 'muted', width: 1.5, dash: [6, 4] });
          [['y', 'accent', 'yearly'], ['m', 'teal', 'monthly'], ['c', 'purple', 'continuous']].forEach(([k, col, lab]) => {
            const on = k === c;
            R.fn((x) => N(x, k), { domain: [0.002, 0.3], color: col, width: on ? 3 : 1.6, alpha: on ? 1 : 0.55 });
            if (k !== 'c') R.text(lab, 0.3, N(0.3, k), { align: 'right', dx: -4, dy: -10, color: col, size: 11, weight: on ? 700 : 500 });
          });
          R.dot(r72, 72, { r: 5, color: 'green' });
          R.text(`72 is exact at ${pct(r72, 2)}`, r72, 72, { dx: 8, dy: 13, color: 'green', weight: 700, size: 11.5 });
          R.vline(r, { color: 'gold', width: 1.2, dash: [3, 3] });
          R.dot(r, N(r, c), { r: 6, color: 'gold' });
          R.text(`N = ${fx(N(r, c), 2)}`, r, N(r, c), r < 0.045 ? { dx: 8, dy: 14, color: 'gold', weight: 700, size: 12 } : { dx: -8, dy: -12, align: 'right', color: 'gold', weight: 700, size: 12 });
          st = { r, c, T, rp };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, c, T, rp } = st;
          const err = (x) => `${sg(100 * (x / T - 1), 1)}%`;
          const how = c === 'y' ? '$\\ln 2/\\ln(1+r)$' : c === 'm' ? '$\\ln 2/(12\\ln(1+r/12))$' : '$\\ln 2/r$';
          return `At ${pct(r, 2)} compounded ${c === 'y' ? 'yearly' : c === 'm' ? 'monthly' : 'continuously'}: exact doubling time ${how} = **${fx(T, 3)} years** · $72/r$ = ${fx(72 / rp, 2)} (${err(72 / rp)}) · $70/r$ = ${fx(70 / rp, 2)} (${err(70 / rp)}) · $69.3/r$ = ${fx(69.3147 / rp, 2)} (${err(69.3147 / rp)}) · exact numerator $N$ = ${fx(rp * T, 2)}` + (c === 'y' ? `; Taylor $69.3(1+r/2)$ = ${fx(69.3147 * (1 + r / 2), 2)}.` : c === 'c' ? ' — the rule of 69.3 is exact for continuous growth.' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Present value and discount factors',
      statement: String.raw`With an interest rate $r$ per year (compounded annually), the **discount factor** for a date $t$ years away is $d(t)=(1+r)^{-t}$: the amount that, invested today, grows to $\$1$ at time $t$. The **present value** of a cash flow $c$ at time $t$ is $c\,d(t)$, and the present value of a stream of cash flows $c_{t_1},\dots,c_{t_n}$ (positive for money received, negative for money paid) is
$$PV=\sum_{k} c_{t_k}\,(1+r)^{-t_k}.$$
Present value is linear: the value of a sum of streams is the sum of their values. With continuous compounding $d(t)=e^{-rt}$, and with a term structure of rates each date has its own factor.`,
      idea: String.raw`Compounding runs forward: $\$1$ today becomes $(1+r)^t$ (fin 1.1, 1.2). Discounting runs it backward, so a payment of $c$ at $t$ is worth exactly what you would have to deposit today to produce it, $c/(1+r)^t$. Because you can lend or borrow at $r$ (micro 11.9), any two streams with the same present value can be traded into each other; that is why one number summarises the whole stream. Distant payments shrink geometrically, and a higher rate shrinks them faster.`,
      caption: String.raw`Drag the tip of an arrow to change a cash flow's amount and date, click empty space to add one, or pick a preset. Each payment slides back to today along its dotted discount curve and arrives as its present value (the translucent bar at its date shows how much of it survives). At the left the present values stack head to tail into the net present value. The lower panel is the discount factor $(1+r)^{-t}$ applied to each date.`,
      deps: ['fin-1.2', 'micro-11.9'],
      see: ['behav-5.1'],
      refs: ['Luenberger: Basic Theory of Interest'],
      tags: ['discounting', 'present value'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Present_value' },
      viz(v) {
        const M = v.M, NMAX = 12, X0 = -3.6, X1 = 10.6;
        const PRESETS = {
          project: [[0, -100], [1, 40], [2, 45], [3, 45], [4, 30]],
          bond: [[0, -87], ...Array.from({ length: 9 }, (_, k) => [k + 1, 6]), [10, 106]],
          single: [[10, 100]],
          loan: [[0, 100], [1, -26], [2, -26], [3, -26], [4, -26], [5, -26]],
        };
        const rS = v.slider('discount rate $r$', 0, 0.25, 0.08, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const xt = Array.from({ length: 11 }, (_, k) => [k, String(k)]);
        const T = v.stage({ x: [X0, X1], y: [-128, 128], height: 340, axes: 'box', full: true, xticks: xt, title: 'cash flows over time (top) and their present values stacked at today (left)' });
        const D = v.stage({ x: [X0, X1], y: [0, 1.2], height: 150, axes: 'box', full: true, xticks: xt, xlabel: 'years from today', ylabel: 'd(t)' });
        const snap = (x, y) => [M.clamp(Math.round(x * 4) / 4, 0, 10), M.clamp(Math.round(y), -120, 120)];
        const pool = Array.from({ length: NMAX }, () => { const h = T.handle(0, 0, { color: 'blue', r: 6, constrain: snap }); h.visible = false; return h; });
        const act = () => pool.filter((h) => h.visible);
        const load = (k) => pool.forEach((h, i) => { const f = PRESETS[k][i]; h.visible = !!f; if (f) { h.x = f[0]; h.y = f[1]; } });
        v.select('preset', [{ value: 'project', label: 'a project' }, { value: 'bond', label: 'a bond' }, { value: 'single', label: 'one payment' }, { value: 'loan', label: 'a loan (borrower)' }], 'project', { onChange: load });
        v.button('Remove last flow', () => { const a = act(); if (a.length > 1) a[a.length - 1].visible = false; });
        load('project');
        T.onClick((x, y) => {
          if (x < -0.1 || x > 10.3) return;
          if (act().some((h) => Math.abs(T.X(h.x) - T.X(x)) < 14 && Math.abs(T.Y(h.y) - T.Y(y)) < 16)) return; // that was a click on a tip
          const [sx, sy] = snap(x, y); if (Math.abs(sy) < 3) return;
          const h = pool.find((q) => !q.visible); if (!h) return;
          h.x = sx; h.y = sy; h.visible = true;
        });
        v.legend([['blue', 'money received'], ['red', 'money paid'], ['muted', 'path back to today, shrinking by $(1+r)^{-t}$', { dash: true }], ['green', 'net present value']]);
        let st = null;
        v.render(() => {
          const r = rS.value;
          const F = act().map((h) => { const t = h.x, c = h.y, d = Math.pow(1 + r, -t); h.color = c >= 0 ? 'blue' : 'red'; return { t, c, d, pv: c * d, col: h.color }; }).sort((a, b) => a.t - b.t);
          T.hline(0, { color: 'ink', width: 1.1 });
          T.vline(0, { color: 'muted', width: 1, dash: [4, 4] });
          T.text('today', 0, 128, { dy: 9, dx: 4, color: 'muted', size: 11, weight: 600 });
          T.rect(X0 + 0.75, -126, -0.2, 126, { fill: 'muted', fillAlpha: 0.06, stroke: false, radius: 6 });
          T.text('present values, stacked', -1.65, 126, { dy: 10, align: 'center', color: 'muted', size: 11, weight: 600 });
          const few = F.length <= 6;
          for (const q of F) {
            if (q.t > 0) T.fn((s) => q.c * Math.pow(1 + r, s - q.t), { domain: [0, q.t], color: q.col, width: 1.2, dash: [3, 4], alpha: 0.65 });
            T.rect(q.t - 0.15, 0, q.t + 0.15, q.pv, { fill: q.col, fillAlpha: 0.2, color: q.col, alpha: 0.45, width: 1 });
            T.arrow(q.t, 0, q.t, q.c, { color: q.col, width: 2.6, head: 10 });
            T.text(`${q.c > 0 ? '+' : '−'}${Math.abs(q.c)}`, q.t, q.c, { dy: q.c >= 0 ? -16 : 16, align: 'center', color: q.col, weight: 700, size: 11.5 });
            if (few && q.t > 0 && Math.abs(T.Y(q.pv) - T.Y(0)) > 26) T.text(`PV ${fx(q.pv, 1)}`, q.t + 0.2, q.pv / 2, { color: q.col, size: 10.5, weight: 600, alpha: 0.85 });
          }
          // the present values stacked head to tail, then the net
          const n = F.length, xa = -2.6, xb = -1.25, w = n > 1 ? Math.min(0.34, (xb - xa) / (n - 1)) : 0;
          let lev = 0;
          T.clip(() => {
            F.forEach((q, i) => {
              const x = xa + i * w;
              T.arrow(x, lev, x, lev + q.pv, { color: q.col, width: 2.6, head: 7, alpha: 0.7 });
              if (i < n - 1) T.line(x, lev + q.pv, x + w, lev + q.pv, { color: 'muted', width: 1, dash: [2, 3] });
              lev += q.pv;
            });
            const nc = lev >= 0 ? 'green' : 'red';
            T.line(xa + (n - 1) * w, lev, -0.62, lev, { color: nc, width: 1, dash: [2, 3] });
            T.arrow(-0.62, 0, -0.62, lev, { color: nc, width: 4.5, head: 12 });
          });
          const NPV = lev, nc = NPV >= 0 ? 'green' : 'red';
          T.text(`NPV ${NPV >= 0 ? '+' : '−'}${fx(Math.abs(NPV), 2)}`, -1.05, M.clamp(NPV, -112, 112), { dy: NPV >= 0 ? -15 : 15, align: 'center', color: nc, weight: 750, size: 12.5, plate: true });
          // discount factors
          D.fn((t) => Math.pow(1 + r, -t), { domain: [0, X1], color: 'accent', width: 2.3 });
          D.hline(1, { color: 'faint', width: 1, dash: [3, 3] });
          const seen = new Set();
          for (const q of F) {
            D.line(q.t, 0, q.t, q.d, { color: q.col, width: 1, alpha: 0.5 });
            D.dot(q.t, q.d, { r: 4, color: q.col });
            if (!seen.has(q.t) && (few || q.t === F[F.length - 1].t)) { seen.add(q.t); D.text(q.d.toFixed(3), q.t, q.d, { dy: -11, align: 'center', color: 'ink', size: 10.5, weight: 600 }); }
          }
          D.text('$1 at year t', -1.55, 0.8, { align: 'center', color: 'muted', size: 11, weight: 600 });
          D.text('is worth (1+r)⁻ᵗ today', -1.55, 0.56, { align: 'center', color: 'muted', size: 11, weight: 600 });
          st = { r, F, NPV };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, F, NPV } = st;
          const terms = F.slice(0, 7).map((q) => `${q.c >= 0 ? '+' : '−'}${Math.abs(q.c)}×${q.d.toFixed(3)}`).join(' ') + (F.length > 7 ? ' …' : '');
          const far = F[F.length - 1];
          return `At $r$ = ${pct(r, 2)}: $PV=\\sum_t c_t(1+r)^{-t}$ = ${terms} = **${usd(NPV, 2)}** · ${usd(1, 0)} at year ${far.t} is worth ${usd(far.d, 3)} today · raise $r$ and every distant arrow arrives smaller.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Principle',
      name: 'The net-present-value rule',
      statement: String.raw`Let a project have cash flows $c_0,c_1,\dots,c_N$ (with $c_0<0$ the initial outlay) and let $r$ be the opportunity cost of capital — the return available on comparable investments in the market. Its **net present value** is $\mathrm{NPV}(r)=\sum_{t=0}^N c_t(1+r)^{-t}$. The **NPV rule**: undertake the project if and only if $\mathrm{NPV}(r)>0$, and among mutually exclusive projects choose the one with the largest NPV. In a market where one can borrow and lend freely at $r$, a project's NPV is exactly the increase in its owner's wealth today, whatever the owner's preferences about when to consume.`,
      idea: String.raw`Borrow today the present value of the project's future cash flows, $\sum_{t\ge1}c_t(1+r)^{-t}$, and repay the loan with exactly those cash flows: every future payment cancels, and what is left today is $c_0+\sum_{t\ge1}c_t(1+r)^{-t}=\mathrm{NPV}$. So a positive-NPV project is cash in hand now, and lending or borrowing at $r$ can then move that cash to whichever dates the owner prefers — Fisher's separation of investment from consumption (micro 11.12). Values add (fin 1.5), so choosing the largest NPV maximises wealth. The rule is only as good as the cash-flow forecasts and the rate $r$.`,
      caption: String.raw`Type the project's yearly cash flow $c(t)$ — for example “250”, “400 0.8^t” or “150 + 40 t” — and set the cost and the horizon. Left: the project's cash flows (blue and red) and the offsetting loan (orange, hatched) — the net (green) is the NPV today and zero afterwards. Right: NPV against the discount rate; drag the gold handle along the curve. The project is accepted wherever the curve is in the green region.`,
      deps: ['fin-1.5'],
      see: ['micro-11.12'],
      refs: ['Luenberger: Basic Theory of Interest'],
      tags: ['capital budgeting', 'present value'],
      credit: 'Irving Fisher, 1930',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Net_present_value' },
      viz(v) {
        const M = v.M, RMAX = 0.4;
        const c0S = v.slider('cost today $c_0$', 0, 2000, 1000, { step: 10, fmt: (x) => money(-x) });
        const cf = v.input('cash flow $c(t)$, years $t=1..N$', '150 + 40 t', { vars: ['t'], width: 150 });
        const nS = v.slider('years $N$', 1, 15, 5, { int: true });
        const fin = v.toggle('borrow against the project', true);
        const L = v.stage({ x: [-1.1, 5.7], y: [-1200, 1200], height: 330, axes: 'box', weight: 1.2, minWidth: 320, xlabel: 'year', title: 'the project, and a loan that turns it into cash today' });
        const R = v.stage({ x: [0, RMAX], y: [-500, 600], height: 330, axes: 'box', weight: 1, minWidth: 290, ylabel: 'NPV ($)', xticks: pctTicks([0, 0.1, 0.2, 0.3, 0.4]), title: 'NPV against the discount rate' });
        const flows = () => {
          const f = cf.fn, out = [[0, -c0S.value]];
          for (let t = 1; t <= nS.value; t++) { let c = f ? f(t) : 0; if (!Number.isFinite(c)) c = 0; out.push([t, c]); }
          return out;
        };
        const hr = R.handle(0.08, 0, { color: 'gold', label: 'r', labelPos: 'ne', constrain: (x) => { const r = M.clamp(Math.round(x * 400) / 400, 0, RMAX); return [r, npv(flows(), r)]; } });
        v.legend([['blue', 'project inflow', { area: true }], ['red', 'project outflow', { area: true }], ['orange', 'loan: proceeds today, repaid by the project', { area: true }], ['green', 'net to you']]);
        let st = null;
        v.render(() => {
          const N = nS.value, F = flows(), r = hr.x, on = fin.value;
          const futPV = npv(F.slice(1), r), NPV = F[0][1] + futPV;
          // left
          const vals = F.map(([, c]) => c).concat(on ? [futPV, NPV, ...F.slice(1).map(([, c]) => -c)] : [], [0]);
          const lo = Math.min(...vals), hi = Math.max(...vals), pad = 0.14 * (hi - lo || 1);
          L.setTicks(Array.from({ length: N + 1 }, (_, t) => [t, String(t)]), undefined);
          L.setView([-1.1 - 0.03 * N, N + 0.7], [lo - pad, hi + pad]);
          L.hline(0, { color: 'ink', width: 1 });
          const bw = on ? 0.11 : 0.2;
          for (const [t, c] of F) {
            const col = c >= 0 ? 'blue' : 'red', xp = on ? t - 0.24 : t;
            L.rect(xp - bw, 0, xp + bw, c, { fill: col, fillAlpha: 0.8, stroke: false });
            if (!on && t > 0) L.rect(xp - bw, 0, xp + bw, c * Math.pow(1 + r, -t), { color: col, width: 1.3, dash: [3, 2] });
            if (on) {
              const fl = t === 0 ? futPV : -c;
              hatchRect(L, t - bw, 0, t + bw, fl, 'orange', 0.25);
              if (t === 0) L.rect(t + 0.24 - bw, 0, t + 0.24 + bw, NPV, { fill: NPV >= 0 ? 'green' : 'red', fillAlpha: 0.85, stroke: false });
              else L.dot(t + 0.24, 0, { r: 3, color: 'green' });
            }
          }
          if (on) {
            const yl = (y) => (y >= 0 ? -10 : 10);
            L.text('cost', -0.24, F[0][1], { dy: yl(F[0][1]), align: 'center', color: 'red', size: 10.5, weight: 650 });
            L.text('loan', 0, futPV, { dy: yl(futPV), align: 'center', color: 'orange', size: 10.5, weight: 650 });
            L.text(`NPV ${fx(NPV, 0)}`, 0.14, 0, { dy: NPV >= 0 ? 14 : -14, align: 'left', color: NPV >= 0 ? 'green' : 'red', size: 11, weight: 750, plate: true });
          }
          // right: NPV(r)
          const f = (x) => npv(F, x), grid = M.linspace(0, RMAX, 161).map(f);
          const ylo = Math.min(...grid, 0), yhi = Math.max(...grid, 0), p2 = 0.1 * (yhi - ylo || 1);
          R.setView([0, RMAX], [ylo - p2, yhi + p2]);
          R.clip(() => R.fn(f, { fill: 'green', fillAlpha: 0.2, stroke: false }), [0, RMAX], [0, yhi + p2]);
          R.clip(() => R.fn(f, { fill: 'red', fillAlpha: 0.16, stroke: false }), [0, RMAX], [ylo - p2, 0]);
          R.hline(0, { color: 'ink', width: 1 });
          R.fn(f, { color: 'accent', width: 2.6 });
          const roots = irrs(F, -0.9, 4).filter((x) => x >= 0 && x <= RMAX);
          roots.forEach((x) => { R.dot(x, 0, { r: 5, hollow: true, color: 'ink', width: 2 }); R.text(`IRR ${pct(x, 1)}`, x, 0, { dy: 14, dx: 4, color: 'ink', size: 11, weight: 650 }); });
          hr.y = f(r);
          R.vline(r, { color: 'gold', width: 1.2, dash: [3, 3] });
          R.corner('accept: NPV > 0', 'tr', { color: 'green', weight: 700 });
          R.text('reject: NPV < 0', RMAX, 0, { align: 'right', dx: -10, dy: 15, color: 'red', weight: 700, size: 12 });
          st = { r, F, futPV, NPV, roots, on };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, F, futPV, NPV, roots, on } = st;
          return `At $r$ = ${pct(r, 2)}: the future cash flows are worth ${usd(futPV)} today against a cost of ${usd(-F[0][1])}, so **NPV = ${usd(NPV)}** → **${NPV > 0 ? 'accept' : 'reject'}**.` + (on ? ` Borrow ${usd(futPV)} now at ${pct(r, 2)} and let the project's own cash flows repay it: you pocket ${usd(NPV)} today and owe nothing later.` : '') + (roots.length === 1 ? ` The curve crosses zero at the IRR, ${pct(roots[0], 2)}: the rule accepts for every $r$ below it.` : roots.length ? ` The curve crosses zero ${roots.length} times (fin 1.8).` : ' The curve never crosses zero on this range.');
        });
      },
    },
  ],
};
