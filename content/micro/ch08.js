// Microeconomics — Chapter 8: Profit maximization and perfect competition (items 8.1–8.6; 8.7–8.11 in ch08-b.js)
import { clamp, GUIDE, LBL, fx, sgn, bisect, argmax, dif, plateText, slopeLine, sample, bar, CTECH, firm, drawCosts, profitRect, priceLine } from './ch08.shared.js';

const T0 = CTECH();
/** Firms memoized by plant size and wage (the cost curves are recomputed only when these change). */
const FIRMS = {};
const firmAt = (Kb = 6, w = 10) => { const k = `${Kb.toFixed(3)}|${w.toFixed(3)}`; return FIRMS[k] || (FIRMS[k] = firm(T0, w, 10, Kb)); };
/** Simpson's rule. */
function simpson(f, a, b, n = 200) { if (b <= a) return 0; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; }

export default {
  collection: 'micro',
  chapter: 8,
  title: 'Profit maximization and perfect competition',
  summary: String.raw`A price-taking firm produces where price equals rising marginal cost, as long as price covers average variable cost; below that it shuts down and loses only its fixed cost. Sweeping the price traces the firm's supply curve, with a jump at the shutdown point, and the profit function, the upper envelope of straight lines, is convex with the supply curve as its slope (Hotelling's lemma). Market supply is the horizontal sum of the firms' supply curves. With free entry and exit, profits attract firms and losses drive them out until price rests at the bottom of average cost, so long-run economic profit is zero; the long-run supply curve is flat, rising or falling as industry expansion leaves input prices unchanged, bids them up or brings them down, and any lasting surplus is rent earned by scarce inputs. Every curve in the chapter is computed from one production function.`,
  items: [
    // ------------------------------------------------------------------ 8.1
    {
      num: '8.1', kind: 'Definition', name: 'Perfect competition',
      statement: String.raw`A market is **perfectly competitive** when
(a) there are many buyers and many sellers, each so small relative to the market that its own quantity has a negligible effect on the price;
(b) the good is homogeneous: buyers regard every seller's output as identical;
(c) buyers and sellers know the market price, and trading costs are negligible, so one price prevails;
(d) in the long run, firms can enter and leave the industry freely.
Under these conditions every agent is a **price taker**: it treats the market price $p$ as given. For a firm this means that the demand curve it faces is (to an excellent approximation) **horizontal** at $p$: it can sell any amount it is able to produce at $p$, and nothing at a higher price. Its marginal revenue is then $MR = p$.`,
      idea: String.raw`The firm does not face the market demand curve; it faces what is left of it after its rivals have sold, the **residual demand**. If the other $N - 1$ firms keep their output, residual demand has the same slope $dp/dQ$ as market demand, but over the tiny range of one firm's output that slope moves the price almost not at all. In elasticity terms, if the firm sells the share $1/N$ of the market, its residual demand elasticity is $N$ times the market elasticity (larger still if rivals expand when the price rises), so with thousands of firms it is practically infinite: the curve is flat. Market supply and demand (micro-2.5) set $p$; each firm takes it as given.`,
      caption: String.raw`Left: market demand and the equilibrium price $p = 20$, with $N$ identical firms each selling 6 units. The gold sliver is the range one firm could move the market by changing its own output from 0 to 12. Right: that sliver blown up to full width: the **residual demand** this firm faces (blue), its marginal revenue (purple, dashed) and its marginal cost (orange). **Slide the number of firms**: with many firms the blue line is indistinguishable from the flat line $p = 20$ and the profit-maximizing output (green) coincides with $P = MC$ (gold ring); with one or a few firms the line tilts, marginal revenue falls below price, and the firm restricts output and marks up its price.`,
      deps: ['micro-2.5'], refs: ['Mankiw Ch. 14', 'Varian Ch. 23'], tags: ['competition'],
      credit: 'Augustin Cournot, 1838 (the limit of many sellers); conditions codified by Frank Knight, 1921',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Perfect_competition' },
      viz(v) {
        const F = firmAt(6);
        const Ns = v.slider('number of firms $N$', 1, 10000, 60, { log: true, sig: 2 });
        const m = v.stage({ x: [0, 720], y: [0, 45], height: 340, axes: 'box', gutter: true, xlabel: 'market output Q', ylabel: 'price', title: 'the market: demand slopes down', weight: 1 });
        const f = v.stage({ x: [0, 12], y: [0, 45], height: 340, axes: 'box', gutter: true, xlabel: 'this firm’s output q', ylabel: 'price', title: 'one firm: the demand left over for it', weight: 1 });
        v.legend([['blue', 'demand (market / residual)'], ['ink', 'flat price line p = 20', { dash: true }], ['purple', 'marginal revenue of the firm', { dash: true }], ['orange', 'marginal cost'], ['green', 'profit-maximizing output'], ['gold', 'P = MC output', { dot: true }]]);
        let st = {};
        v.render(() => {
          const N = Math.max(1, Math.round(Ns.value)), Qm = 12 * N, Qo = 6 * (N - 1);
          const P = (Q) => 40 * (1 - Q / Qm), pr = (q) => P(Qo + q), MR = (q) => 40 * (1 - (Qo + 2 * q) / Qm);
          // market
          m.setView([0, Qm], [0, 45]);
          m.fn(P, { domain: [0, Qm], color: 'blue', width: 2.8 });
          m.line(0, 20, 6 * N, 20, GUIDE); m.line(6 * N, 0, 6 * N, 20, GUIDE);
          const px = m.X(Qo + 12) - m.X(Qo);
          if (px >= 3) m.vband(Qo, Qo + 12, { color: 'gold', alpha: 0.3 }); else m.line(Qo + 6, 0, Qo + 6, 45, { color: 'gold', width: 3, alpha: 0.85 });
          m.dot(6 * N, 20, { r: 6, color: 'ink' });
          plateText(m, `p = 20, Q = ${v.fmt(6 * N, 6)}`, 6 * N, 20, { dx: 10, dy: -14, align: 'left', color: 'ink' });
          plateText(m, N === 1 ? 'one firm = the whole market' : `one firm’s range: 1/${N} of the axis`, Qo + 12, 41, { align: 'left', dx: 8, color: 'gold' });
          // firm
          f.hline(20, { color: 'ink', width: 1.6, dash: [6, 4] });
          f.fn(F.C.MC, { domain: [0.01, 12], color: 'orange', width: 2.6, n: 240 });
          f.fn(MR, { domain: [0, 12], color: 'purple', width: 2, dash: [6, 4] });
          f.fn(pr, { domain: [0, 12], color: 'blue', width: 3 });
          const best = argmax((q) => pr(q) * q - F.C.TC(q), 0.01, 12, 240, 70), qm = best.x, pm = pr(qm);
          const qc = bisect((q) => pr(q) - F.C.MC(q), F.mMC.x, 12) ?? qm;
          f.line(qm, 0, qm, pm, { color: 'green', width: 1, dash: [3, 3] });
          f.dot(qc, pr(qc), { r: 8, color: 'gold', hollow: true });
          f.dot(qm, pm, { r: 6, color: 'green' });
          plateText(f, `q = ${v.fix(qm, 2)}, p = ${v.fix(pm, 2)}`, qm, pm, { dx: -10, dy: -16, align: 'right', color: 'green' });
          const fl = F.C.MC(qm);
          if (pm - fl > 0.6) f.line(qm, fl, qm, pm, { color: 'red', width: 4, alpha: 0.6 });
          plateText(f, 'MC', 9.7, F.C.MC(9.7) > 43 ? 43 : F.C.MC(9.7), { dx: -8, color: 'orange', align: 'right' });
          const eM = (Qm / 40) * (20 / (6 * N)), eR = (Qm / 40) * (pm / qm);
          st = { N, qm, pm, mc: fl, eM, eR, dp: (40 * 6) / Qm, qc };
        });
        v.readout(() => {
          const { N, qm, pm, mc, eM, eR, dp, qc } = st, f2 = (x) => v.fix(x, 2);
          const lerner = (pm - mc) / pm;
          return `$N = ${N}$ firms. Market elasticity at the equilibrium: $|\\varepsilon| = ${f2(eM)}$. If this firm doubled its output from 6 to 12 the price would fall by $${v.fix(dp, dp < 0.01 ? 4 : 3)}$ (${v.fix((dp / 20) * 100, dp / 20 < 1e-3 ? 4 : 2)}%). Residual demand elasticity at its best output: $${v.fmt(eR, 4)}$, about $N|\\varepsilon|$. Best output (MR = MC): $q = ${f2(qm)}$ at $p = ${f2(pm)}$ vs. $q = ${f2(qc)}$ from $P = MC$; markup $(p - MC)/p = ${v.fix(lerner, 4)} = 1/${v.fmt(eR, 4)}$. ${N >= 1000 ? 'The firm is, for all purposes, a **price taker**.' : N <= 3 ? 'With so few firms the firm has real **market power**.' : 'Add firms and the markup vanishes.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.2
    {
      num: '8.2', kind: 'Principle', name: 'Profit maximization: price equals marginal cost',
      statement: String.raw`A price-taking firm with cost function $TC(q)$ chooses output to maximize profit $\pi(q) = pq - TC(q)$. If the optimum $q^* > 0$ is interior and $TC$ is differentiable, then
$$p = MC(q^*) \qquad\text{(first-order condition)}, \qquad MC'(q^*) \ge 0 \qquad\text{(second-order condition)}:$$
price equals marginal cost on a **non-falling** part of the marginal cost curve. A crossing of $p$ and $MC$ where $MC$ is falling is a local **minimum** of profit. Profit itself is the rectangle $\pi = (p - AC(q^*))\,q^*$ between the price line and average cost. Whether producing beats shutting down is a separate comparison (8.3).`,
      idea: String.raw`Selling one more unit adds $p$ to revenue (the firm is a price taker, 8.1) and $MC(q)$ to cost, so $\pi'(q) = p - MC(q)$. While $p > MC$ an extra unit adds to profit, while $p < MC$ it subtracts, so at an interior maximum $\pi'(q^*) = 0$ (Fermat, Rudin 5.8). The second derivative is $\pi'' = -MC'$; at a crossing on the falling branch $\pi'' > 0$, profit has a valley there, not a peak: the firm should expand through it until rising marginal cost catches up with the price again.`,
      caption: String.raw`**Drag the gold point along the price line** to choose an output. Top: the short-run cost curves (capital fixed) of a homothetic technology like chapter 7's, whose total cost is a cubic in output; the rectangle between the price and average cost at the chosen output is the profit (green) or loss (red). Bottom: profit as a function of output, with the tangent whose slope is $p - MC(q)$. Profit peaks at the crossing on **rising** marginal cost (green dot) and has a local minimum at the crossing on **falling** marginal cost (red ring). Move the price and the plant size: the maximum always sits where $p = MC$ with $MC$ rising.`,
      deps: ['micro-8.1', 'micro-7.11', 'pma-5.8'], refs: ['Varian Ch. 20', 'Mankiw Ch. 14'], tags: ['competition', 'optimization'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Profit_maximization' },
      viz(v) {
        const pS = v.slider('price $p$', 4, 40, 25, { step: 0.1 });
        const KS = v.slider('plant size $\\bar K$ (fixed cost $10\\bar K$)', 3, 9, 4, { step: 0.1 });
        const X = 9;
        const s = v.stage({ x: [0, X], y: [0, 50], height: 330, axes: 'box', gutter: true, xlabel: 'output q', ylabel: 'price, cost per unit', title: 'price, marginal and average cost; profit = rectangle', full: true });
        const g = v.stage({ x: [0, X], y: [-100, 50], height: 230, axes: 'box', gutter: true, xlabel: 'output q', ylabel: 'profit', title: 'profit $\\pi(q) = pq - TC(q)$ and its slope $p - MC(q)$', full: true });
        v.legend([['ink', 'price line p = MR'], ['orange', 'MC'], ['accent', 'AC'], ['teal', 'AVC'], ['green', 'profit (rectangle), maximum'], ['red', 'loss, local minimum of profit']]);
        const H = s.handle(5.2, 25, { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0.05, X - 0.05), pS.value] });
        let st = {};
        v.render(() => {
          const F = firmAt(KS.value), C = F.C, p = pS.value, q = clamp(H.x, 0.05, X - 0.05);
          H.set(q, p);
          drawCosts(s, F, X);
          const ac = C.AC(q);
          profitRect(s, q, p, Math.min(ac, 60));
          priceLine(s, p, `p = MR = ${v.fix(p, 1)}`);
          const qHi = F.qMC(p), qLo = p > F.mMC.f && p < C.MC(0.01) ? bisect((x) => C.MC(x) - p, 0.01, F.mMC.x) : null;
          s.line(q, 0, q, Math.max(p, Math.min(ac, 50)), GUIDE);
          if (qLo != null) { s.dot(qLo, p, { r: 7, color: 'red', hollow: true }); }
          if (qHi > 0) s.dot(qHi, p, { r: 6.5, color: 'green' });
          if (C.MC(q) < 50) s.dot(q, C.MC(q), { r: 4.5, color: 'orange' });
          // profit panel
          const pi = (x) => p * x - C.TC(x);
          let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 90; i++) { const y = pi((X * i) / 90); lo = Math.min(lo, y); hi = Math.max(hi, y); }
          const pad = 0.12 * (hi - lo + 20);
          g.setView([0, X], [Math.max(lo - pad, -400), hi + 2.2 * pad]);
          g.hline(0, { color: 'muted', width: 1 });
          g.hline(-C.FC, { color: 'muted', width: 1, dash: [4, 4] });
          g.text(`−F = ${v.fix(-C.FC, 0)}: profit at q = 0`, qHi > 0 ? qHi : X / 2, -C.FC, { dy: 13, size: 11, color: 'muted', align: 'center' });
          g.fn(pi, { domain: [0, X], color: 'ink', width: 2.8 });
          slopeLine(g, q, pi(q), p - C.MC(q), 70, { color: 'gold', width: 2 });
          g.dot(q, pi(q), { r: 6, color: 'gold' });
          if (qHi > 0) { g.dot(qHi, pi(qHi), { r: 6.5, color: 'green' }); plateText(g, 'max', qHi, pi(qHi), { dy: -16, color: 'green', align: 'center' }); }
          if (qLo != null) { g.dot(qLo, pi(qLo), { r: 7, color: 'red', hollow: true }); plateText(g, 'local min', qLo, pi(qLo), { dy: 18, color: 'red', align: 'center' }); }
          const srch = argmax(pi, 1e-3, X, 300, 70);
          st = { p, q, mc: C.MC(q), ac, pi: pi(q), dpi: dif(pi, q, 1e-4), qHi, qLo, srch, F };
        });
        v.readout(() => {
          const { p, q, mc, ac, pi, dpi, qHi, qLo, srch, F } = st, f2 = (x) => v.fix(x, 2), f3 = (x) => v.fix(x, 3);
          const here = `At $q = ${f2(q)}$: $p - MC = ${f2(p)} - ${f2(mc)} = ${fx(p - mc, 2)}$ and the measured slope of profit is $\\pi'(q) = ${fx(dpi, 2)}$, so one more unit ${p > mc ? '**raises**' : '**lowers**'} profit. Profit $= (p - AC)\\,q = (${f2(p)} - ${f2(ac)}) \\times ${f2(q)} = ${fx(pi, 2)}$.`;
          const opt = qHi > 0 ? ` Search over all outputs finds the peak at $q = ${f3(srch.x)}$; the rising crossing of $p = MC$ is at $q = ${f3(qHi)}$.` : ' The price is below the bottom of marginal cost: profit falls with every unit.';
          const low = qLo != null ? ` The crossing on falling MC, $q = ${f3(qLo)}$, is a local minimum ($\\pi'' = -MC' = ${fx(-dif(F.C.MC, qLo, 1e-4), 2)} > 0$).` : ' (No crossing on the falling branch at this price: it exists only while $p$ is between the bottom of MC and its starting value.)';
          return here + opt + low;
        });
      },
    },
    // ------------------------------------------------------------------ 8.3
    {
      num: '8.3', kind: 'Proposition', name: 'Shutdown rule',
      statement: String.raw`In the short run, with a fixed cost $F$ that is **sunk** (paid whether or not the firm produces), a price-taking firm produces at $p = MC$ if
$$p \ge \min_q AVC(q),$$
and shuts down ($q = 0$, profit $-F$) if $p < \min AVC$. Between the **shutdown point** $\min AVC$ and the **break-even point** $\min AC$ the firm operates at a loss, because that loss is smaller than $F$: revenue covers all of the variable cost and part of the fixed cost. If instead the fixed cost is avoidable by shutting down (as it is in the long run), the threshold is $\min AC$: the firm then produces only if it makes a non-negative profit.`,
      idea: String.raw`Producing $q$ gives $pq - VC(q) - F$; shutting down gives $-F$. The fixed cost is on both sides and cancels, as sunk costs always do (micro-7.13), so the firm produces iff $pq - VC(q) \ge 0$ for some $q$, i.e. iff $p \ge VC(q)/q = AVC(q)$ for some $q$, i.e. iff $p \ge \min AVC$. At that minimum $MC = AVC$ (micro-7.12), so the $P = MC$ output is exactly the bottom of the AVC curve. When $F$ can be escaped, it no longer cancels and $AVC$ is replaced by $AC$.`,
      caption: String.raw`**Lower the price.** At the best output the revenue rectangle $p \cdot q$ is split into variable cost (teal), the part of fixed cost it covers (grey) and the profit or loss (green or red). The coloured strip on the price axis marks the three regimes: profit above the break-even point $\min AC$, losses but production between $\min AC$ and $\min AVC$, shutdown below the shutdown point $\min AVC$. The bars compare the profit from producing with the profit from shutting down. Untick **fixed cost is sunk** (the plant can be returned) and the threshold jumps up to $\min AC$.`,
      deps: ['micro-8.2', 'micro-7.13', 'micro-7.12'], refs: ['Mankiw Ch. 14', 'Varian Ch. 23'], tags: ['competition'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shutdown_(economics)' },
      viz(v) {
        const pS = v.slider('price $p$', 3, 32, 14, { step: 0.1 });
        const sunk = v.toggle('fixed cost is sunk (short run)', true);
        const X = 9;
        const s = v.stage({ x: [0, X], y: [0, 40], height: 360, axes: 'box', gutter: true, xlabel: 'output q', ylabel: 'price, cost per unit', title: 'where does revenue go?', weight: 1.45 });
        const b = v.stage({ x: [0, 3], y: [-80, 80], height: 360, axes: 'box', gutter: true, ylabel: 'profit', xticks: [[1, 'produce'], [2, 'shut down']], title: 'produce or shut down?', weight: 0.6, minWidth: 200 });
        v.legend([['teal', 'variable cost', { area: true }], ['muted', 'fixed cost covered', { area: true }], ['green', 'profit', { area: true }], ['red', 'loss: fixed cost not covered', { area: true }], ['orange', 'MC'], ['accent', 'AC'], ['teal', 'AVC']]);
        let st = {};
        v.render(() => {
          const F = firmAt(6), C = F.C, p = pS.value, sk = sunk.value;
          const thr = sk ? F.pShut : F.pBE;
          const qM = F.qMC(p), qTry = qM > 0 ? qM : F.qShut, produce = p >= thr && qM > 0;
          // regime strip on the price axis
          const top = 40, w0 = 0.16;
          s.rect(0, 0, w0, F.pShut, { fill: 'red', fillAlpha: 0.45, stroke: false });
          s.rect(0, F.pShut, w0, F.pBE, { fill: sk ? 'gold' : 'red', fillAlpha: sk ? 0.55 : 0.3, stroke: false });
          s.rect(0, F.pBE, w0, top, { fill: 'green', fillAlpha: 0.45, stroke: false });
          // revenue decomposition at the trial output
          const q = qTry, avc = C.AVC(q), ac = C.AC(q), ghost = !produce;
          const al = ghost ? 0.1 : 0.32;
          s.rect(w0, 0, q, Math.min(avc, p), { fill: 'teal', fillAlpha: al, stroke: false });
          if (p > avc) s.rect(w0, avc, q, Math.min(p, ac), { fill: 'muted', fillAlpha: al, stroke: false });
          if (p >= ac) s.rect(w0, ac, q, p, { fill: 'green', fillAlpha: ghost ? 0.1 : 0.32, stroke: false });
          else s.rect(w0, Math.max(p, avc) > ac ? ac : Math.max(p, 0), q, ac, { fill: 'red', fillAlpha: ghost ? 0.08 : 0.22, stroke: false, hatch: 'red', hatchAlpha: ghost ? 0.12 : 0.3 });
          if (p < avc) s.rect(w0, p, q, avc, { fill: 'red', fillAlpha: ghost ? 0.12 : 0.3, stroke: false });
          s.rect(0, 0, q, p, { color: 'gold', width: 1.6, dash: ghost ? [5, 4] : undefined });
          drawCosts(s, F, X);
          priceLine(s, p, `p = ${v.fix(p, 2)}`);
          s.dot(F.qShut, F.pShut, { r: 7, color: 'teal', hollow: true }); plateText(s, `shutdown point: min AVC = ${v.fix(F.pShut, 2)}`, F.qShut, F.pShut, { dx: -12, dy: 14, color: 'teal', align: 'right' });
          s.dot(F.qBE, F.pBE, { r: 7, color: 'accent', hollow: true }); plateText(s, `break-even: min AC = ${v.fix(F.pBE, 2)}`, F.qBE, F.pBE, { dx: -12, dy: -16, color: 'accent', align: 'right' });
          if (produce) s.dot(q, p, { r: 6.5, color: 'green' });
          else plateText(s, 'q = 0: shut down', 0.3, p, { dy: -14, color: 'red', align: 'left' });
          // bars
          const piP = qTry > 0 ? p * qTry - C.TC(qTry) : -C.FC, piS = sk ? -C.FC : 0;
          const lim = Math.max(80, Math.ceil(Math.max(Math.abs(piP), Math.abs(piS)) / 20) * 20 + 20);
          b.setView([0, 3], [-lim, lim]);
          b.hline(0, { color: 'muted', width: 1 });
          const bestP = piP >= piS;
          bar(b, 1, 0.62, 0, piP, bestP ? 'green' : 'muted', { fillAlpha: bestP ? 0.7 : 0.35 });
          bar(b, 2, 0.62, 0, piS, bestP ? 'muted' : 'green', { fillAlpha: bestP ? 0.35 : 0.7 });
          b.text(fx(piP, 1), 1, piP, { dy: piP >= 0 ? -10 : 12, size: 11.5, weight: 700, color: 'ink', align: 'center' });
          b.text(fx(piS, 1), 2, piS, { dy: piS >= 0 ? -10 : 12, size: 11.5, weight: 700, color: 'ink', align: 'center' });
          st = { p, sk, F, qTry, produce, piP, piS, avc, ac };
        });
        v.readout(() => {
          const { p, sk, F, qTry, produce, piP, piS, avc } = st, f2 = (x) => v.fix(x, 2);
          const cmp = `Best producing option $q = ${f2(qTry)}$: profit ${fx(piP, 2)}; shutting down: ${fx(piS, 2)}.`;
          if (!sk) return `${cmp} With the fixed cost **avoidable**, shutting down earns 0, so the firm produces only if $p \\ge \\min AC = ${f2(F.pBE)}$: here it ${produce ? 'produces' : 'shuts down'}. The shutdown and break-even points coincide.`;
          if (p >= F.pBE) return `${cmp} Price is above the break-even point ${f2(F.pBE)}: the firm makes a profit.`;
          if (produce) return `${cmp} Price is between $\\min AVC = ${f2(F.pShut)}$ and $\\min AC = ${f2(F.pBE)}$: the firm **produces at a loss**, because revenue ${f2(p * qTry)} covers the variable cost ${f2(avc * qTry)} and ${f2(p * qTry - avc * qTry)} of the fixed cost ${f2(F.FC)}; shutting down would lose all of $F$.`;
          return `${cmp} Price is below $\\min AVC = ${f2(F.pShut)}$: revenue would not even cover variable cost (dashed rectangle), so producing loses more than $F$. The firm **shuts down**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.4
    {
      num: '8.4', kind: 'Concept', name: 'Supply curve of a competitive firm',
      statement: String.raw`The short-run **supply curve** of a price-taking firm gives its profit-maximizing output at each price:
$$q^s(p) = \begin{cases} MC^{-1}(p) \text{ on the rising branch of } MC, & p \ge \min AVC,\\ 0, & p < \min AVC.\end{cases}$$
It is the part of the marginal cost curve above the shutdown point, together with the vertical axis below it; at $p = \min AVC$ it **jumps** from $0$ to the output at the bottom of $AVC$. The area to the left of the supply curve up to the price $p$ is the firm's **producer surplus**, revenue minus variable cost: $\int_0^p q^s(x)\,dx = pq^s(p) - VC(q^s(p)) = \pi(p) + F$.`,
      idea: String.raw`At each price the firm applies the $P = MC$ rule (8.2) and then the shutdown rule (8.3); the two together trace the curve. Above the shutdown point the rule reads output off the rising part of $MC$, so the supply curve slopes up because marginal cost rises (diminishing returns, micro-7.15). Below it, the best interior output loses more than the fixed cost, so the firm jumps to zero. The surplus identity is Hotelling's lemma (8.5) integrated from the shutdown price, where profit is $-F$.`,
      caption: String.raw`The price sweeps upward. Left: at each price the firm's best output, **found by searching all outputs** rather than by the formula, is dropped as a gold dot; the dots fall on the vertical axis below the shutdown point, then jump and climb the marginal cost curve, drawing the supply curve (green). The orange area to its left is the producer surplus. Right: profit as a function of output at the current price; the best interior output (gold) is compared with shutting down (the dashed line at $-F$). Change the plant size and the sweep restarts.`,
      deps: ['micro-8.3', 'micro-8.2'], refs: ['Varian Ch. 23'], tags: ['competition', 'supply'],
      see: ['micro-3.7'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Supply_(economics)' },
      viz(v) {
        const KS = v.slider('plant size $\\bar K$', 3, 10, 6, { step: 0.1, onChange: () => v.restart() });
        const X = 9, PER = 12, PMAX = 40;
        const s = v.stage({ x: [0, X], y: [0, PMAX + 2], height: 360, axes: 'box', gutter: true, xlabel: 'output q', ylabel: 'price p', title: 'the supply curve, price by price', weight: 1.2 });
        const g = v.stage({ x: [0, X], y: [-160, 160], height: 360, axes: 'box', gutter: true, xlabel: 'output q', ylabel: 'profit', title: 'profit vs output at the current price', weight: 0.9 });
        v.legend([['green', 'supply curve'], ['gold', 'best output found by search', { dot: true }], ['orange', 'producer surplus', { area: true }], ['orange', 'MC'], ['teal', 'AVC'], ['muted', 'shut down: −F', { dash: true }]]);
        const cache = {};
        let st = {};
        v.animate((t) => {
          const Kb = KS.value, F = firmAt(Kb), C = F.C;
          const p = 2 + (PMAX - 2) * clamp(t / (PER - 1.5), 0, 1);
          const key = Kb.toFixed(3);
          const pts = cache[key] || (cache[key] = Array.from({ length: 77 }, (_, i) => { const pk = 2 + i * 0.5, b = F.best(pk); return [b.q, pk, b.pi]; }));
          // producer surplus area
          const qs = F.supply(p);
          if (qs > 0) {
            const poly = [[0, 0], [0, F.pShut], [F.qShut, F.pShut]];
            for (let i = 1; i <= 40; i++) { const pk = F.pShut + ((p - F.pShut) * i) / 40; poly.push([F.qMC(pk), pk]); }
            poly.push([0, p]);
            s.poly(poly, { fill: 'orange', fillAlpha: 0.16, stroke: false });
          }
          drawCosts(s, F, X, { ac: false });
          s.fn(C.AC, { domain: [0.5, X], color: 'accent', width: 1.4, alpha: 0.4 });
          // the supply curve so far
          s.line(0, 0, 0, Math.min(p, F.pShut), { color: 'green', width: 5 });
          if (p >= F.pShut) {
            s.line(0, F.pShut, F.qShut, F.pShut, { color: 'green', width: 1.6, dash: [4, 4] });
            s.path(sample((pk) => pk, F.pShut, p, 60).map(([, pk]) => [F.qMC(pk), pk]), { color: 'green', width: 5 });
            s.dot(0, F.pShut, { r: 5, color: 'green', hollow: true }); s.dot(F.qShut, F.pShut, { r: 5, color: 'green' });
          }
          for (const [q, pk] of pts) if (pk <= p + 1e-9) s.dot(q, pk, { r: 3.2, color: 'gold' });
          priceLine(s, p, `p = ${v.fix(p, 1)}`, { width: 1.6 });
          s.dot(qs, p, { r: 7, color: 'gold' });
          plateText(s, `shutdown point (${v.fix(F.qShut, 2)}, ${v.fix(F.pShut, 2)})`, F.qShut, F.pShut, { dx: -12, dy: 16, color: 'teal', align: 'right' });
          // profit vs output
          const pi = (q) => p * q - C.TC(q), b = F.best(p), inner = argmax(pi, F.mMC.x, X, 200, 60);
          g.hline(0, { color: 'muted', width: 1 });
          g.hline(-C.FC, { color: 'muted', width: 1.4, dash: [5, 4] });
          plateText(g, `shut down: −F = ${v.fix(-C.FC, 0)}`, 0.2, -C.FC, { dy: -14, size: 11, color: 'muted', align: 'left' });
          g.fn(pi, { domain: [0, X], color: 'ink', width: 2.6 });
          g.dot(inner.x, inner.f, { r: 6.5, color: inner.f >= -C.FC ? 'green' : 'red', hollow: inner.f < -C.FC });
          plateText(g, inner.f >= -C.FC ? 'best: produce' : 'best interior point loses more than F', inner.x, inner.f, { dy: inner.f > 60 ? 18 : -16, color: inner.f >= -C.FC ? 'green' : 'red', align: 'center' });
          if (b.q === 0) g.dot(0, -C.FC, { r: 7, color: 'green' });
          const PS = simpson(F.supply, F.pShut, Math.max(p, F.pShut), 200);
          st = { p, qs, b, F, PS, PS2: qs > 0 ? p * qs - C.VC(qs) : 0 };
        }, { period: PER, once: true, still: PER });
        v.readout(() => {
          const { p, qs, b, F, PS, PS2 } = st, f3 = (x) => v.fix(x, 3);
          const ps = qs > 0 ? ` Producer surplus: area left of the supply curve $= ${v.fix(PS, 2)}$; revenue minus variable cost $= ${v.fix(PS2, 2)} = \\pi + F$.` : ' Producer surplus is zero.';
          return `$p = ${v.fix(p, 2)}$: the search over all outputs picks $q = ${f3(b.q)}$; the rule ($MC^{-1}(p)$ above $\\min AVC = ${v.fix(F.pShut, 2)}$, else 0) gives $q^s = ${f3(qs)}$.${ps} The jump at the shutdown point is from 0 to ${v.fix(F.qShut, 2)}: no price makes the firm produce less than that.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.5
    {
      num: '8.5', kind: 'Theorem', name: 'Hotelling’s lemma',
      statement: String.raw`Let $\pi(p, w) = \max_{q, L}\{pq - wL - r\bar K : q \le f(L, \bar K)\}$ be the **profit function** of a price-taking firm. Where it is differentiable (the optimal plan is unique),
$$\frac{\partial \pi}{\partial p}(p, w) = q^*(p, w), \qquad \frac{\partial \pi}{\partial w}(p, w) = -L^*(p, w):$$
the slope of profit in the output price is the supply, and its slope in an input price is minus the demand for that input. At a price where two plans are optimal (the shutdown price), $\pi$ has a kink and its one-sided derivatives are the two optimal outputs. The same holds in the long run with every input variable.`,
      idea: String.raw`This is the envelope theorem (micro-7.9) once more: the objective $pq - wL$ has derivative $q$ in $p$ and $-L$ in $w$, and re-optimizing the plan has no first-order effect at the optimum. Geometrically, a fixed plan $(q_0, L_0)$ earns $pq_0 - wL_0 - r\bar K$, a straight line in $p$ with slope $q_0$, and $\pi$ is the upper envelope of these lines (8.6), tangent to the line of the optimal plan. It is the producer's twin of Shephard's lemma (micro-7.10) and Roy's identity.`,
      caption: String.raw`Choose which price varies. Left: the firm's cost curves at the current prices, with profit as the green or red rectangle. Middle: the profit function, computed by re-optimizing at every price, with the tangent at the current point (orange). Right: the slope of $\pi$, measured by re-solving the firm's problem at nearby prices, next to the optimal output (or, for the wage, minus the labour hired). **Move the price** across the shutdown point (ringed): there $\pi$ has a kink, and the left and right slopes are the two optimal outputs, $0$ and the output at the bottom of $AVC$.`,
      deps: ['micro-8.2', 'micro-7.9'], refs: ['Varian Ch. 20'], tags: ['duality', 'supply'],
      see: ['micro-7.10', 'micro-5.13'],
      credit: 'Harold Hotelling, 1932',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hotelling%27s_lemma' },
      viz(v) {
        const mode = v.select('vary', [{ value: 'p', label: 'output price $p$' }, { value: 'w', label: 'wage $w$' }], 'p');
        const pS = v.slider('price $p$', 2, 40, 26, { step: 0.05 });
        const wS = v.slider('wage $w$', 2, 40, 10, { step: 0.05 });
        const X = 9, Kb = 6;
        const s = v.stage({ x: [0, X], y: [0, 45], height: 330, axes: 'box', gutter: true, xlabel: 'output q', ylabel: 'price, cost', title: 'the firm at the current prices', weight: 0.95 });
        const g = v.stage({ x: [0, 40], y: [-80, 200], height: 330, axes: 'box', gutter: true, xlabel: 'price p', ylabel: 'maximum profit', title: 'the profit function and its tangent', weight: 1.15 });
        const b = v.stage({ x: [0, 3], y: [0, 10], height: 330, axes: 'box', gutter: true, xticks: [[1, 'slope'], [2, 'demand']], title: 'slope vs plan', weight: 0.45, minWidth: 170 });
        v.legend([['ink', 'profit function π'], ['orange', 'tangent at the current price'], ['green', 'profit', { area: true }], ['teal', 'shutdown kink', { dot: true }]]);
        const piAt = (p, w) => firmAt(Kb, w).profit(p);
        const cache = {};
        let st = {};
        v.render(() => {
          const md = mode.value, p = pS.value, w = wS.value, F = firmAt(Kb, w), C = F.C;
          // left: firm
          s.setView([0, X], [0, Math.max(45, Math.ceil(p / 5) * 5 + 5)]);
          drawCosts(s, F, X);
          const q = F.supply(p);
          if (q > 0) profitRect(s, q, p, C.AC(q));
          priceLine(s, p, `p = ${v.fix(p, 1)}`);
          if (q > 0) s.dot(q, p, { r: 6, color: 'green' }); else plateText(s, 'shut down', 0.3, p, { dy: -14, color: 'red', align: 'left' });
          // middle: π as a function of p or w
          const key = md === 'p' ? `p|${w.toFixed(2)}` : `w|${p.toFixed(2)}`;
          const curve = cache[key] || (cache[key] = md === 'p' ? sample((x) => piAt(x, w), 0.5, 40, 240) : sample((x) => piAt(p, x), 2, 40, 120));
          const xv = md === 'p' ? p : w, yv = piAt(p, w);
          const ys = curve.map((c) => c[1]), lo = Math.min(...ys), hi = Math.max(...ys);
          g.setView(md === 'p' ? [0, 40] : [0, 40], [lo - 0.12 * (hi - lo) - 5, hi + 0.12 * (hi - lo) + 5]);
          g.setLabels(md === 'p' ? 'price p' : 'wage w', undefined);
          g.hline(0, { color: 'muted', width: 1 });
          g.path(curve, { color: 'ink', width: 3 });
          // kink: shutdown price (p-mode) or shutdown wage (w-mode)
          const kx = md === 'p' ? F.pShut : (10 * p) / firmAt(Kb, 10).pShut; // AVC is proportional to the wage
          if (kx != null && kx < 40) { g.dot(kx, md === 'p' ? piAt(kx, w) : piAt(p, kx), { r: 7, color: 'teal', hollow: true }); plateText(g, 'shutdown kink', kx, md === 'p' ? piAt(kx, w) : piAt(p, kx), { dy: 18, color: 'teal', align: 'center' }); }
          const h = md === 'p' ? 1e-3 : 1e-3;
          const fR = md === 'p' ? (piAt(p + h, w) - yv) / h : (piAt(p, w + h) - yv) / h;
          const fL = md === 'p' ? (yv - piAt(p - h, w)) / h : (yv - piAt(p, w - h)) / h;
          const kink = Math.abs(fR - fL) > 0.05 * Math.max(1, Math.abs(fR));
          const dC = (fR + fL) / 2, plan = md === 'p' ? q : -(q > 0 ? C.VC(q) / w : 0);
          slopeLine(g, xv, yv, kink ? fR : dC, 80, { color: 'orange', width: 2.2 });
          if (kink) slopeLine(g, xv, yv, fL, 80, { color: 'orange', width: 1.6, dash: [5, 4] });
          { const sl = kink ? fR : dC, dx = md === 'p' ? 6 : -6, x1 = clamp(xv + dx, 0.3, 39.7); g.line(xv, yv, x1, yv, { color: 'orange', width: 1.4 }); g.line(x1, yv, x1, yv + (x1 - xv) * sl, { color: 'orange', width: 1.4 }); }
          g.dot(xv, yv, { r: 6.5, color: 'green' });
          plateText(g, `slope ${fx(kink ? fR : dC, 3)}`, xv, yv, { dx: md === 'p' ? -12 : 12, dy: -16, color: 'orange', align: md === 'p' ? 'right' : 'left' });
          // bars
          const vals = [kink ? fR : dC, plan], m = Math.max(1, ...vals.map(Math.abs)) * 1.3;
          b.setView([0, 3], md === 'p' ? [0, Math.ceil(m)] : [-Math.ceil(m), 0]);
          b.setTicks([[1, md === 'p' ? '∂π/∂p' : '∂π/∂w'], [2, md === 'p' ? 'q*' : '−L*']], null);
          bar(b, 1, 0.6, 0, vals[0], 'orange'); bar(b, 2, 0.6, 0, vals[1], 'green');
          vals.forEach((val, i) => b.text(fx(val, 3), i + 1, val, { dy: val >= 0 ? -10 : 12, size: 11, weight: 700, color: 'ink', align: 'center' }));
          st = { md, p, w, q, yv, dC, fR, fL, kink, plan, L: q > 0 ? C.VC(q) / w : 0 };
        });
        v.readout(() => {
          const { md, p, w, q, yv, dC, fR, fL, kink, plan, L } = st, f4 = (x) => fx(x, 4);
          if (kink) return `At this ${md === 'p' ? 'price' : 'wage'} the firm is exactly at its **shutdown point**: producing ${v.fix(q, 2)} and producing nothing earn the same profit ${fx(yv, 2)}. The profit function has a kink, with slope ${f4(fL)} on the left and ${f4(fR)} on the right — the two optimal ${md === 'p' ? 'outputs' : 'labour demands (with a minus sign)'}. Hotelling's lemma holds on each side.`;
          if (md === 'p') return `$p = ${v.fix(p, 2)}$, $w = ${v.fix(w, 2)}$: maximum profit $\\pi = ${fx(yv, 3)}$. Slope measured by re-optimizing at $p \\pm 0.001$: $\\partial\\pi/\\partial p = ${f4(dC)}$; optimal output $q^* = ${f4(plan)}$ (difference $${v.sci(Math.abs(dC - plan), 1)}$). ${q === 0 ? 'Below the shutdown price the firm produces nothing, and $\\pi = -F$ is flat.' : 'Raising the price by 1 raises profit by about the current output.'}`;
          return `$p = ${v.fix(p, 2)}$, $w = ${v.fix(w, 2)}$: maximum profit $\\pi = ${fx(yv, 3)}$. Measured slope $\\partial\\pi/\\partial w = ${f4(dC)}$; labour hired $L^* = ${f4(L)}$, so $-L^* = ${f4(plan)}$ (difference $${v.sci(Math.abs(dC - plan), 1)}$). ${q === 0 ? 'At this wage the firm has shut down and hires nobody: $\\pi$ is flat.' : 'A wage rise of 1 costs the firm about one unit per worker it employs.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.6
    {
      num: '8.6', kind: 'Proposition', name: 'Convex profit function and upward-sloping supply',
      statement: String.raw`The profit function $\pi(p) = \max_{y \in Y}(pq - c)$ of a price taker choosing among feasible plans $y = (q, c)$ (output and its cost) is **convex** in $p$, whatever the technology: for $p_1, p_2$ and $0 \le \lambda \le 1$,
$$\pi(\lambda p_1 + (1 - \lambda) p_2) \le \lambda \pi(p_1) + (1 - \lambda)\pi(p_2).$$
Consequently supply never falls when the price rises: $(p_2 - p_1)(q^*(p_2) - q^*(p_1)) \ge 0$ for any optimal choices (the **law of supply**), and where $\pi$ is twice differentiable, $dq^*/dp = \pi''(p) \ge 0$. The technology need not be convex, smooth or even continuous: a finite list of plans suffices.`,
      idea: String.raw`For each fixed plan, $p \mapsto pq - c$ is a straight line. A pointwise maximum of affine functions is convex (Rudin, Real and Complex Analysis, 3.1–3.2), so $\pi$ is convex, and its slope, the supply by Hotelling's lemma (8.5), is non-decreasing. The law of supply also follows directly by revealed profitability: $p_1 q_1 - c_1 \ge p_1 q_2 - c_2$ and $p_2 q_2 - c_2 \ge p_2 q_1 - c_1$; adding them gives $(p_2 - p_1)(q_2 - q_1) \ge 0$.`,
      caption: String.raw`Top: each faint purple line is the profit of one **fixed** production plan as the price varies; the black curve $\pi(p)$ is their upper envelope. **Drag the two gold points**: the chord between them (dashed) always lies above the curve, and the orange lines are the plans that are optimal there. Bottom: the supply $q^*(p)$, the slope of the envelope, with gold dots measured as difference quotients of $\pi$: it never falls. Switch to **four discrete plans**: the envelope becomes a polygon and supply a staircase, still convex and still non-decreasing, though nothing is smooth.`,
      deps: ['micro-8.5', 'rca-3.1'], refs: ['Varian Ch. 20'], tags: ['supply', 'convexity'],
      see: ['micro-7.10'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Profit_function' },
      viz(v) {
        const F = firmAt(6), C = F.C, PMAX = 45;
        const DISC = [[0, 60], [3, 96], [5, 130], [6.5, 172], [8, 226]];
        const kind = v.select('technology', [{ value: 'smooth', label: 'smooth cost curve (the chapter’s firm)' }, { value: 'disc', label: 'four discrete plans (and shutdown)' }], 'smooth');
        const g = v.stage({ x: [0, PMAX], y: [-100, 200], height: 330, axes: 'box', gutter: true, xlabel: 'price p', ylabel: 'profit', title: 'π(p): the upper envelope of straight lines', full: true });
        const q = v.stage({ x: [0, PMAX], y: [0, 9], height: 210, axes: 'box', gutter: true, xlabel: 'price p', ylabel: 'output', title: 'supply = slope of π: never falls', full: true });
        v.legend([['purple', 'profit of one fixed plan'], ['ink', 'π(p), the envelope'], ['purple', 'chord', { dash: true }], ['orange', 'optimal plan at a gold point'], ['green', 'supply q*(p)'], ['gold', 'slope of π measured', { dot: true }]]);
        const plans = () => (kind.value === 'disc' ? DISC : Array.from({ length: 19 }, (_, i) => { const qq = i * 0.5; return [qq, qq > 0 ? C.TC(qq) : C.FC]; }));
        const piOf = (p) => (kind.value === 'disc' ? Math.max(...DISC.map(([a, c]) => p * a - c)) : F.profit(p));
        const qOf = (p) => (kind.value === 'disc' ? DISC.reduce((bst, pl) => (p * pl[0] - pl[1] > p * bst[0] - bst[1] + 1e-12 ? pl : bst), DISC[0])[0] : F.supply(p));
        const A = g.handle(5, 0, { color: 'gold', r: 7, constrain: (x) => { const p = clamp(x, 0.5, PMAX - 0.5); return [p, piOf(p)]; } });
        const B = g.handle(30, 0, { color: 'gold', r: 7, constrain: (x) => { const p = clamp(x, 0.5, PMAX - 0.5); return [p, piOf(p)]; } });
        let st = {};
        v.render(() => {
          const P = plans();
          for (const [a, c] of P) g.fn((p) => p * a - c, { domain: [0, PMAX], color: v.color('purple', P.length < 8 ? 0.6 : 0.35), width: P.length < 8 ? 1.6 : 1.1 });
          const env = sample(piOf, 0, PMAX, 360);
          g.path(env, { color: 'ink', width: 3.2 });
          const p1 = clamp(A.x, 0.5, PMAX - 0.5), p2 = clamp(B.x, 0.5, PMAX - 0.5);
          A.set(p1, piOf(p1)); B.set(p2, piOf(p2));
          const q1 = qOf(p1), q2 = qOf(p2);
          const line = (qq, p0) => { const c = p0 * qq - piOf(p0); g.fn((p) => p * qq - c, { domain: [0, PMAX], color: 'orange', width: 2 }); };
          line(q1, p1); line(q2, p2);
          g.line(p1, piOf(p1), p2, piOf(p2), { color: 'purple', width: 2.2, dash: [7, 5] });
          const pm = (p1 + p2) / 2, chord = (piOf(p1) + piOf(p2)) / 2;
          g.dot(pm, piOf(pm), { r: 5, color: 'green' }); g.dot(pm, chord, { r: 5, color: 'purple' });
          if (Math.abs(g.Y(chord) - g.Y(piOf(pm))) > 6) g.line(pm, piOf(pm), pm, chord, { color: 'green', width: 1.4 });
          // supply
          q.path(sample(qOf, 0, PMAX, 450).map((c, i, arr) => c), { color: 'green', width: 3 });
          const dq = [];
          for (let i = 0; i <= 44; i++) { const p = 0.75 + i, h = 0.25, sl = (piOf(p + h) - piOf(p - h)) / (2 * h); dq.push([p, sl]); q.dot(p, sl, { r: 3, color: 'gold' }); }
          q.vline(p1, { color: 'gold', width: 1, dash: [3, 3] }); q.vline(p2, { color: 'gold', width: 1, dash: [3, 3] });
          let mono = Infinity; const gs = sample(qOf, 0.2, PMAX, 600); for (let i = 1; i < gs.length; i++) mono = Math.min(mono, gs[i][1] - gs[i - 1][1]);
          let conv = Infinity; for (let i = 1; i < env.length - 1; i++) conv = Math.min(conv, env[i + 1][1] - 2 * env[i][1] + env[i - 1][1]);
          st = { p1, p2, q1, q2, pm, piM: piOf(pm), chord, mono, conv, disc: kind.value === 'disc' };
        });
        v.readout(() => {
          const { p1, p2, q1, q2, pm, piM, chord, mono, conv, disc } = st, f2 = (x) => v.fix(x, 2);
          return `Midpoint $p = ${f2(pm)}$: $\\pi = ${fx(piM, 2)} \\le$ chord ${fx(chord, 2)} (gap ${v.fix(chord - piM, 2)}). Optimal plans: $q^*(${f2(p1)}) = ${f2(q1)}$, $q^*(${f2(p2)}) = ${f2(q2)}$; $(p_2 - p_1)(q_2 - q_1) = ${fx((p2 - p1) * (q2 - q1), 2)} \\ge 0$. Over the whole sampled range the smallest second difference of $\\pi$ is ${v.sci(Math.abs(conv) < 1e-9 ? 0 : conv, 2)} and the smallest step of supply is ${v.sci(Math.abs(mono) < 1e-9 ? 0 : mono, 2)}: ${conv > -1e-7 && mono > -1e-7 ? 'convex and non-decreasing' : 'violation!'}.${disc ? ' With discrete plans supply jumps between the plans; at a jump price two plans are optimal and π has a corner.' : ''}`;
        });
      },
    },
  ],
};
