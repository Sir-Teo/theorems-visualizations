// Microeconomics — Chapter 8: Profit maximization and perfect competition (items 8.7–8.11; 8.1–8.6 in ch08.js)
import { clamp, GUIDE, LBL, fx, sgn, bisect, argmax, argmin, plateText, sample, bar, CTECH, firm, clearing, drawCosts, profitRect, priceLine } from './ch08.shared.js';

const T0 = CTECH();
/** The representative firm of the industry items: plant K̄ = 6 (right for the efficient scale y = 6), w = r = 10. */
const F6 = firm(T0, 10, 10, 6);
/** Simpson's rule. */
function simpson(f, a, b, n = 200) { if (b <= a) return 0; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return (s * h) / 3; }
/** Short-run market supply of N identical firms, drawn as Q against p, with the jump at the shutdown price. */
function srSupply(s, N, pTop, st) {
  const F = F6;
  s.line(0, 0, 0, F.pShut, st);
  s.line(0, F.pShut, N * F.qShut, F.pShut, { ...st, dash: [4, 4], width: 1.2 });
  s.path(sample((p) => p, F.pShut, pTop, 80).map(([, p]) => [N * F.qMC(p), p]), st);
}
/** Market equilibrium with N firms of type F6 and demand D. */
const eqm = (N, D) => { const e = clearing(F6.supply, N, D, 200); return { ...e, pi: F6.profit(e.p), q: F6.supply(e.p) }; };

export default {
  collection: 'micro',
  chapter: 8,
  items: [
    // ------------------------------------------------------------------ 8.7
    {
      num: '8.7', kind: 'Model', name: 'Long-run equilibrium with free entry and exit',
      statement: String.raw`Consider an industry of identical price-taking firms with access to the same technology, facing market demand $D(p)$. In the short run the number of firms $N$ is fixed and the price clears the market, $N\,q^s(p) = D(p)$. In the long run firms enter when incumbents earn positive economic profit and leave when they make losses. A **long-run competitive equilibrium** is a price $p^*$ and number of firms $N^*$ such that
(a) each firm maximizes profit: $p^* = MC(q^*)$, with $q^*$ on its supply curve;
(b) the market clears: $N^* q^* = D(p^*)$;
(c) no firm wants to enter or exit: profit is zero, $p^* = AC(q^*)$, which together with (a) puts $p^*$ at the **minimum of long-run average cost** and $q^*$ at the efficient scale.`,
      scope: String.raw`A model: it assumes free entry and exit, identical access to technology, input prices unaffected by industry size (relaxed in 8.9) and enough firms that the integer number of firms barely matters (here the price can stop a fraction above min AC, where one more entrant would make a loss). The speed of adjustment is not part of the theory; myopic entry can overshoot.`,
      idea: String.raw`Positive profit is a signal that resources earn more here than elsewhere (economic profit already counts the opportunity cost, micro-1.2), so firms come in; their extra output shifts short-run supply right and pushes the price down. Losses work the other way, after the shutdown logic of 8.3 has run its course. The process stops only when profit is zero, and since each firm also sets $p = MC$, the rest point is where marginal cost cuts average cost, at its minimum (micro-7.12, micro-7.14). The level of demand determines only how many firms there are.`,
      caption: String.raw`An industry of 100 firms in long-run equilibrium at $p = 20$ is hit by a demand shock in period 3. Each period the market clears given the firms present (top left: short-run supply in orange, old demand dashed), each firm earns the profit rectangle shown top right, and up to the chosen **entry capacity** of new firms come in one by one while the next entrant would still profit (or incumbents leave while they lose). Bottom: the firms as dots (gold = entered this period, red = losing money, crossed = leaving) and the price period by period, returning to the bottom of average cost. Tick **myopic entry** to let entrants react only to today's profit: with a large capacity the industry overshoots and keeps cycling.`,
      deps: ['micro-8.3', 'micro-7.14', 'micro-2.5'], refs: ['Mankiw Ch. 14', 'Varian Ch. 24'], tags: ['competition', 'entry'],
      credit: 'Alfred Marshall, Principles of Economics, 1890',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Long-run_equilibrium' },
      viz(v) {
        const shock = v.select('demand shock', [{ value: 'up', label: 'demand rises 50%' }, { value: 'down', label: 'demand falls 35%' }], 'up', { onChange: () => v.restart() });
        const cap = v.slider('entry / exit capacity (firms per period)', 1, 25, 6, { int: true, onChange: () => v.restart() });
        const myo = v.toggle('myopic entry (react to today’s profit only)', false, { onChange: () => v.restart() });
        const PERIODS = 36, DT = 0.32, SHOCK = 3, N0 = 100;
        const D0 = (p) => 15 * Math.max(0, 60 - p);
        const m = v.stage({ x: [0, 1300], y: [0, 50], height: 300, axes: 'box', gutter: true, xlabel: 'market output Q', ylabel: 'price', title: 'the market', weight: 1.15 });
        const f = v.stage({ x: [0, 9], y: [0, 50], height: 300, axes: 'box', gutter: true, xlabel: 'output of one firm q', ylabel: 'price, cost', title: 'a typical firm', weight: 0.85 });
        const d = v.stage({ x: [0, 20], y: [0, 9], height: 230, axes: false, title: 'the industry', weight: 0.9 });
        const ts = v.stage({ x: [0, PERIODS], y: [0, 40], height: 230, axes: 'box', gutter: true, xlabel: 'period', ylabel: 'price', title: 'price period by period', weight: 1.1 });
        v.legend([['blue', 'demand (old dashed)'], ['orange', 'short-run supply N·q(p)'], ['green', 'long-run price: min AC', { dash: true }], ['gold', 'entrants / equilibrium'], ['red', 'losing firms']]);
        const cache = {};
        const path = () => {
          const key = `${shock.value}|${cap.value}|${myo.value}`;
          if (cache[key]) return cache[key];
          const mult = shock.value === 'up' ? 1.5 : 0.65, out = [];
          let N = N0;
          for (let k = 0; k <= PERIODS; k++) {
            const D = k < SHOCK ? D0 : (p) => mult * D0(p), e = eqm(N, D);
            let n = 0;
            if (myo.value) { if (e.pi > 1e-6) n = cap.value; else if (e.pi < -1e-6) n = -Math.min(cap.value, N - 1); }
            else if (e.pi > 1e-6) { while (n < cap.value && eqm(N + n + 1, D).pi >= -1e-6) n++; }
            else if (e.pi < -1e-6) { while (-n < cap.value && N + n > 1 && eqm(N + n, D).pi < -1e-6) n--; }
            out.push({ k, N, D, ...e, n });
            N += n;
          }
          return (cache[key] = out);
        };
        let st = {};
        v.animate((t) => {
          const P = path(), k = clamp(Math.floor(t / DT), 0, PERIODS), c = P[k], prev = P[Math.max(0, k - 1)];
          // market
          m.hline(F6.pBE, { color: 'green', width: 1.6, dash: [6, 4] });
          m.fn((Q) => 60 - Q / 15, { domain: [0, 900], color: 'blue', width: 1.6, dash: [6, 4], alpha: k >= SHOCK ? 0.7 : 1 });
          if (k >= SHOCK) { const mult = shock.value === 'up' ? 1.5 : 0.65; m.fn((Q) => 60 - Q / (15 * mult), { domain: [0, 900 * mult], color: 'blue', width: 2.8 }); }
          if (k > 0 && prev.N !== c.N) srSupply(m, prev.N, 48, { color: 'orange', width: 1.4, alpha: 0.4 });
          srSupply(m, c.N, 48, { color: 'orange', width: 2.8 });
          m.dot(c.Q, c.p, { r: 7, color: 'gold' });
          plateText(m, `p = ${v.fix(c.p, 2)}`, c.Q, c.p, { dx: 12, dy: -14, align: 'left', color: 'ink' });
          plateText(m, 'long run: min AC = 20', 1290, F6.pBE, { dy: 14, align: 'right', color: 'green' });
          // firm
          drawCosts(f, F6, 9);
          if (c.q > 0) profitRect(f, c.q, c.p, F6.C.AC(c.q));
          priceLine(f, c.p, `p = ${v.fix(c.p, 2)}`);
          if (c.q > 0) f.dot(c.q, c.p, { r: 6, color: 'gold' });
          f.dot(F6.qBE, F6.pBE, { r: 6, color: 'accent', hollow: true });
          // industry dots: 20 per row
          const shown = Math.max(c.N, c.N + c.n);
          for (let i = 0; i < shown; i++) {
            const x = (i % 20) + 0.5, y = 8.5 - Math.floor(i / 20);
            const leaving = c.n < 0 && i >= c.N + c.n, entered = k > 0 && prev.n > 0 && i >= c.N - prev.n && i < c.N, future = i >= c.N;
            if (future) { d.dot(x, y, { r: 4.5, color: 'gold', hollow: true, alpha: 0.6 }); continue; }
            d.dot(x, y, { r: 5, color: entered ? 'gold' : c.pi < -1e-6 ? 'red' : c.pi > 1e-6 ? 'green' : 'teal' });
            if (leaving) { d.line(x - 0.35, y - 0.35, x + 0.35, y + 0.35, { color: 'ink', width: 1.6 }); d.line(x - 0.35, y + 0.35, x + 0.35, y - 0.35, { color: 'ink', width: 1.6 }); }
          }
          d.text(`N = ${c.N} firms · period ${k}${k === SHOCK ? ' (shock)' : ''}`, 10, 0.35, { size: 12, weight: 700, color: 'ink', align: 'center' });
          // time series
          ts.hline(F6.pBE, { color: 'green', width: 1.4, dash: [6, 4] });
          ts.vline(SHOCK - 0.5, { color: 'muted', width: 1, dash: [3, 3] });
          const ser = P.slice(0, k + 1).map((o) => [o.k, o.p]);
          ts.path(ser, { color: 'accent', width: 2.4 }); ts.dots(ser, { r: 2.6, color: 'accent' });
          ts.dot(k, c.p, { r: 6, color: 'gold' });
          plateText(ts, 'demand shock', SHOCK - 0.3, 37, { align: 'left', color: 'muted' });
          st = { c, k, P };
        }, { period: PERIODS * DT + 1.5, once: true, still: PERIODS * DT + 1.5 });
        v.readout(() => {
          const { c, k, P } = st, f2 = (x) => v.fix(x, 2);
          const last = P[P.length - 1], next = eqm(c.N + 1, c.D);
          const status = c.pi > 1e-6 ? `incumbents earn ${f2(c.pi)} each, so ${c.n > 0 ? `${c.n} firm${c.n > 1 ? 's' : ''} enter` : 'firms want to enter'}` : c.pi < -1e-6 ? `incumbents lose ${f2(-c.pi)} each, so ${c.n < 0 ? `${-c.n} firm${c.n < -1 ? 's' : ''} leave` : 'firms want to leave'}` : 'profit is zero';
          return `Period ${k}: $N = ${c.N}$, $p = ${f2(c.p)}$, each firm makes $q = ${f2(c.q)}$; ${status}. One more firm would bring the price to ${f2(next.p)} (profit ${fx(next.pi, 2)} each). After ${PERIODS} periods: $N = ${last.N}$, $p = ${f2(last.p)}$ vs $\\min AC = ${f2(F6.pBE)}$ at $q = ${f2(F6.qBE)}$ — ${Math.abs(last.p - F6.pBE) < 0.4 && last.n === 0 ? 'the long-run equilibrium, up to the last indivisible firm.' : 'the industry has not settled.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.8
    {
      num: '8.8', kind: 'Proposition', name: 'Zero economic profit in the long run',
      statement: String.raw`In a long-run competitive equilibrium with free entry and identical firms (8.7), every firm earns **zero economic profit**: price equals the minimum of long-run average cost, $p^* = \min_q LAC(q)$, so the profit rectangle $(p^* - LAC(q^*))\,q^*$ has zero height. Economic cost includes the opportunity cost of every input the owners supply themselves (their time, their capital), so zero economic profit is compatible with positive **accounting profit**: accounting profit equals the implicit costs exactly, the normal return that keeps the owners in this industry rather than their next best alternative.`,
      idea: String.raw`If profit were positive, entrants with the same technology would come in and lower the price (8.7); if negative, firms would leave. So only zero profit is stable, and with $p = MC$ the price is at the bottom of $LAC$ (micro-7.12). The opportunity-cost view of micro-1.2 explains why owners stay: an owner who could earn a salary $S$ elsewhere counts it as a cost; when $S$ rises, the long-run price rises with it until the business again pays exactly $S$ on top of its explicit costs.`,
      caption: String.raw`The firm can vary all inputs (long run). Its **economic** average cost (solid blue) includes the owner's forgone salary; its **accounting** average cost (dashed) counts only the bills it pays. The long-run price is set at the bottom of the economic curve, found by minimization: the economic profit rectangle is flat (zero area), while the gold rectangle, accounting profit, is exactly the salary. **Raise the forgone salary**: the price rises, the efficient scale grows, accounting profit grows, and economic profit stays at zero. Nudge the price off its long-run value to see the profit or loss that would trigger entry or exit.`,
      deps: ['micro-8.7', 'micro-1.2', 'micro-7.12'], refs: ['Mankiw Ch. 14', 'Varian Ch. 24'], tags: ['competition', 'entry'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Profit_(economics)' },
      viz(v) {
        const SS = v.slider('owner’s forgone salary $S$', 0, 100, 40, { step: 1 });
        const dS = v.slider('price minus long-run price', -6, 6, 0, { step: 0.1 });
        v.button('back to long run', () => dS.set(0));
        const X = 14;
        const s = v.stage({ x: [0, X], y: [0, 45], height: 360, axes: 'box', gutter: true, xlabel: 'output q', ylabel: 'price, cost per unit', title: 'long-run costs: economic vs accounting', weight: 1.35 });
        const b = v.stage({ x: [0, 5.6], y: [0, 300], height: 360, axes: 'box', gutter: true, xticks: [[1, 'revenue'], [2.2, 'explicit'], [3.4, 'implicit'], [4.6, 'profit']], title: 'the ledger', weight: 0.7, minWidth: 230 });
        v.legend([['accent', 'economic LAC (with salary)'], ['accent', 'accounting LAC (bills only)', { dash: true }], ['orange', 'LMC'], ['gold', 'accounting profit', { area: true }], ['green', 'economic profit', { area: true }]]);
        const LTC = (q) => T0.cmin(10, 10, q).c, LMC = (q) => (LTC(q + 1e-5) - LTC(q - 1e-5)) / 2e-5;
        let st = {};
        v.render(() => {
          const S = SS.value, ACe = (q) => (LTC(q) + S) / q, ACx = (q) => LTC(q) / q;
          const mn = argmin(ACe, 0.3, 40, 300, 70), p = mn.f + dS.value;
          const opt = argmax((q) => p * q - LTC(q) - S, 0.01, 40, 300, 70), stay = opt.f >= 0 || dS.value >= -1e-9;
          const q = opt.x, top = Math.max(45, Math.ceil((p + 12) / 5) * 5);
          s.setView([0, X], [0, top]);
          s.fn(ACx, { domain: [0.2, X], color: 'accent', width: 2, dash: [6, 4] });
          s.fn(ACe, { domain: [0.2, X], color: 'accent', width: 2.8 });
          s.fn(LMC, { domain: [0.05, X], color: 'orange', width: 2.6 });
          // accounting profit (gold), economic profit (green/red)
          s.rect(0, Math.min(p, ACx(q)), q, Math.max(p, ACx(q)), { fill: 'gold', fillAlpha: 0.22, color: 'gold', width: 1.4 });
          if (Math.abs(p - ACe(q)) > 1e-6) profitRect(s, q, p, ACe(q));
          else { s.line(0, p, q, p, { color: 'green', width: 4 }); }
          priceLine(s, p, `p = ${v.fix(p, 2)}`);
          s.dot(q, p, { r: 6.5, color: 'green' });
          s.dot(mn.x, mn.f, { r: 7.5, color: 'accent', hollow: true });
          plateText(s, Math.abs(dS.value) < 1e-9 ? 'economic profit: zero area' : 'economic profit', q / 2, p, { dy: -16, color: 'green', align: 'center' });
          plateText(s, 'accounting profit', q / 2, (p + ACx(q)) / 2, { color: 'gold', align: 'center' });
          plateText(s, 'with salary', X - 0.3, ACe(X - 0.3), { dx: -4, dy: -14, color: 'accent', align: 'right' });
          plateText(s, 'bills only', X - 0.3, ACx(X - 0.3), { dx: -4, dy: 14, color: 'accent', align: 'right' });
          // ledger
          const R = p * q, E = LTC(q), acc = R - E, eco = acc - S;
          const ymax = Math.max(300, Math.ceil((R * 1.15) / 50) * 50), ymin = Math.min(0, Math.floor((eco * 1.3) / 20) * 20);
          b.setView([0, 5.6], [ymin, ymax]);
          b.hline(0, { color: 'muted', width: 1 });
          bar(b, 1, 0.8, 0, R, 'ink', { fillAlpha: 0.25 });
          bar(b, 2.2, 0.8, 0, E, 'accent', { fillAlpha: 0.45 });
          bar(b, 2.2, 0.8, E, R, 'gold', { fillAlpha: 0.55 });
          bar(b, 3.4, 0.8, 0, S, 'purple', { fillAlpha: 0.5 });
          bar(b, 4.6, 0.8, 0, eco, eco >= 0 ? 'green' : 'red', { fillAlpha: 0.7 });
          b.text(v.fix(R, 0), 1, R, { dy: -10, size: 11, weight: 700, color: 'ink', align: 'center' });
          b.text(`${v.fix(E, 0)} + ${v.fix(acc, 0)}`, 2.2, R, { dy: -10, size: 11, weight: 700, color: 'ink', align: 'center' });
          b.text(v.fix(S, 0), 3.4, S, { dy: -10, size: 11, weight: 700, color: 'ink', align: 'center' });
          b.text(fx(eco, 1), 4.6, Math.max(eco, 0), { dy: -10, size: 11, weight: 700, color: 'ink', align: 'center' });
          st = { S, p, q, pstar: mn.f, qstar: mn.x, acc, eco, d: dS.value, R, E };
        });
        v.readout(() => {
          const { S, p, q, pstar, qstar, acc, eco, d, R, E } = st, f2 = (x) => v.fix(x, 2);
          const lr = `Long-run price $p^* = \\min LAC = ${f2(pstar)}$ at $q = ${f2(qstar)}$ (with $S = ${v.fix(S, 0)}$).`;
          const led = `Revenue ${f2(R)} − explicit cost ${f2(E)} = accounting profit ${f2(acc)}; minus the salary ${v.fix(S, 0)} gives economic profit ${fx(eco, 2)}.`;
          if (Math.abs(d) < 1e-9) return `${lr} ${led} Economic profit is zero and accounting profit equals the forgone salary: the owner earns exactly what she would elsewhere.`;
          return `${lr} At $p = ${f2(p)}$ the firm makes $q = ${f2(q)}$. ${led} ${eco > 0 ? 'Positive economic profit: **entrants** would come in and push the price back down.' : 'Economic loss: owners can do better elsewhere, so firms **exit** and the price recovers.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.9
    {
      num: '8.9', kind: 'Concept', name: 'Long-run industry supply',
      statement: String.raw`The **long-run industry supply curve** gives, for each price, the industry output once the number of firms has fully adjusted (8.7). Its shape depends on how industry expansion affects the costs of the individual firm:
(a) **constant-cost industry**: input prices do not change with industry output, every long-run equilibrium sits at the same $\min LAC$, and long-run supply is **horizontal**;
(b) **increasing-cost industry**: expansion bids up the price of an input the industry uses intensively (specialized labour, land), raising every firm's cost curves, so long-run supply **slopes up**;
(c) **decreasing-cost industry**: expansion lowers input prices (a larger supplier industry with economies of scale, shared know-how), and long-run supply **slopes down**.
In each case the long-run supply price is $p(Q) = \min_q LAC(q; w(Q))$, the minimum average cost at the input prices that industry output $Q$ brings about.`,
      scope: String.raw`Assumes that entrants are identical and that the cost changes are external to each firm (pecuniary or technological externalities); a falling long-run supply curve is consistent with competition only if no single firm can capture the economies itself.`,
      idea: String.raw`Free entry pins the price to the bottom of the average cost curve in every long-run equilibrium (8.8). If that bottom does not move as the industry grows, all equilibria lie at one price. If the wage rises with industry output, $w = w(Q)$, the whole cost curve shifts up with $Q$; with the homothetic technology used here the efficient scale stays at the same output and only the height $\min LAC = \kappa(w(Q), r)$ moves, so $p(Q)$ inherits the direction of $w(Q)$. The number of firms is $Q$ divided by the efficient scale.`,
      caption: String.raw`**Shift demand out** step by step (the buttons). Each new long-run equilibrium (numbered dots) is where demand meets the long-run supply curve (green), whose height at each industry output is the minimum of the firm's average cost at the wage that output brings about. The right panel shows those average cost curves: each equilibrium's curve is drawn, with its minimum ringed. Choose a **constant-, increasing- or decreasing-cost** industry, or set the input-price elasticity $\gamma$ directly ($w = 10\,(Q/600)^{\gamma}$).`,
      deps: ['micro-8.8', 'micro-7.14'], refs: ['Varian Ch. 24', 'Mankiw Ch. 14'], tags: ['competition', 'supply'],
      credit: 'Alfred Marshall, 1890 (external economies); Jacob Viner, 1931',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Long-run_industry_supply' },
      viz(v) {
        const PRE = { const: 0, inc: 0.6, dec: -0.4 };
        const kind = v.select('industry', [{ value: 'const', label: 'constant cost' }, { value: 'inc', label: 'increasing cost' }, { value: 'dec', label: 'decreasing cost' }], 'inc', { onChange: (k) => gS.set(PRE[k]) });
        const gS = v.slider('input-price elasticity $\\gamma$', -0.6, 0.9, 0.6, { step: 0.01 });
        let K = 4;
        v.button('shift demand out', () => { K = Math.min(5, K + 1); });
        v.button('reset demand', () => { K = 0; });
        const QM = 2100;
        const m = v.stage({ x: [0, QM], y: [0, 45], height: 360, axes: 'box', gutter: true, xlabel: 'industry output Q', ylabel: 'price', title: 'long-run equilibria trace long-run supply', weight: 1.25 });
        const f = v.stage({ x: [0, 12], y: [0, 45], height: 360, axes: 'box', gutter: true, xlabel: 'output of one firm q', ylabel: 'cost per unit', title: 'the firm’s LAC at each equilibrium wage', weight: 0.85 });
        v.legend([['blue', 'demand, shifted step by step'], ['green', 'long-run supply p(Q)'], ['gold', 'long-run equilibria'], ['accent', 'LAC at the equilibrium wage']]);
        const r = 10, Q0 = 600;
        const wOf = (Q, g) => 10 * (Math.max(Q, 1) / Q0) ** g;
        const pLR = (Q, g) => T0.cmin(wOf(Q, g), r, 6).c / 6; // min LAC: the efficient scale is y = 6 at any input prices
        const Dk = (k) => (p) => 15 * Math.max(0, 60 - p) * (1 + 0.4 * k);
        let st = {};
        v.render(() => {
          const g = gS.value;
          const eqs = [];
          for (let k = 0; k <= K; k++) { const D = Dk(k), Q = bisect((q) => D(pLR(q, g)) - q, 1, 6000) ?? 0; eqs.push({ k, Q, p: pLR(Q, g), w: wOf(Q, g), N: Q / 6 }); }
          const pTop = Math.max(45, Math.ceil((Math.max(...eqs.map((e) => e.p)) + 10) / 5) * 5);
          m.setView([0, QM], [0, pTop]); f.setView([0, 12], [0, pTop]);
          for (let k = 0; k <= K; k++) m.fn((Q) => 60 - Q / (15 * (1 + 0.4 * k)), { domain: [0, QM], color: 'blue', width: k === K ? 2.6 : 1.4, alpha: k === K ? 1 : 0.45 });
          m.fn((Q) => pLR(Q, g), { domain: [30, QM], color: 'green', width: 3.4 });
          m.path(eqs.map((e) => [e.Q, e.p]), { color: 'gold', width: 1.4, dash: [3, 3] });
          eqs.forEach((e) => { m.dot(e.Q, e.p, { r: 6, color: 'gold' }); m.text(String(e.k + 1), e.Q, e.p, { dy: -14, size: 11.5, weight: 700, color: 'ink', align: 'center' }); });
          plateText(m, 'long-run supply', QM * 0.97, pLR(QM * 0.97, g), { dy: g >= 0 ? -16 : 16, align: 'right', color: 'green' });
          // firm panel
          eqs.forEach((e, i) => {
            const LAC = (q) => T0.cmin(e.w, r, q).c / q, cur = i === eqs.length - 1;
            f.fn(LAC, { domain: [0.5, 12], color: 'accent', width: cur ? 2.8 : 1.3, alpha: cur ? 1 : 0.45 });
            f.dot(6, e.p, { r: 5.5, color: 'gold', hollow: !cur });
            if (cur || i === 0) f.text(`${i + 1}: w = ${v.fix(e.w, 1)}`, 11.6, LAC(11.6), { dx: -4, dy: cur ? -10 : 12, size: 11, weight: 700, color: 'accent', align: 'right' });
          });
          f.vline(6, GUIDE);
          plateText(f, 'efficient scale q = 6', 6, 3, { color: 'muted', align: 'center' });
          st = { eqs, g };
        });
        v.readout(() => {
          const { eqs, g } = st, f1 = (x) => v.fix(x, 1);
          const rows = eqs.map((e) => `${e.k + 1}: $Q = ${v.fix(e.Q, 0)}$, $N = ${v.fix(e.N, 0)}$, $w = ${v.fix(e.w, 2)}$, $p = ${v.fix(e.p, 2)}$`).join(' · ');
          const kind = Math.abs(g) < 0.005 ? '**constant-cost** industry: every equilibrium at the same price, long-run supply is flat' : g > 0 ? '**increasing-cost** industry: expansion bids up the wage and long-run supply rises' : '**decreasing-cost** industry: expansion lowers the wage and long-run supply falls';
          return `$\\gamma = ${fx(g, 2)}$ — a ${kind}. ${rows}. Long-run price elasticity of supply: $1/(\\gamma/2) ${Math.abs(g) < 0.005 ? '= \\infty' : `= ${f1(2 / g)}`}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.10
    {
      num: '8.10', kind: 'Concept', name: 'Economic rent',
      statement: String.raw`**Economic rent** is the payment to a factor in excess of the minimum needed to keep it in its current use (its opportunity cost). When firms differ because some own scarce inputs, such as land of better quality, the market price is set by the **marginal** firm, the one that just covers its costs; the inframarginal firms earn surpluses, and in a competitive market for the scarce input those surpluses are capitalized into its rent: each farm's land rents for exactly the surplus it makes possible, and every farmer, after paying the rent, earns zero economic profit. The **producer surplus** of the industry, the area to the left of the market supply curve up to the price, equals the sum of the rents (plus the fixed costs that are not sunk).`,
      idea: String.raw`Market supply is the horizontal sum of the farms' supply curves (micro-2.4), with farms entering in order of land quality as the price rises past each one's break-even price. A farm's surplus at price $p$ is $\int q_i(x)\,dx$ from its entry price to $p$ (Hotelling, 8.5), so summing over farms gives the area left of the market supply curve. Long-run zero profit (8.8) still holds for the farmer: a farmer who keeps the surplus is merely collecting the opportunity cost of the land, since it could be leased to someone else for that amount. Ricardo's point: corn is not dear because rents are high; rents are high because corn is dear.`,
      caption: String.raw`Ten farms with land of decreasing quality (productivity $A$) use the same technology $q = A\sqrt{L}$ on one acre; each also needs the farmer's time, worth 40. Left: market supply (black) is the **horizontal sum** of the farms' supply curves, with a jump each time a farm enters; the stripes to its left are the farms' rents, one stripe per farm. Right: each farm's surplus over variable cost, split into the farmer's opportunity cost (grey) and the rent of the land (green); farms that would lose money stay out (red). **Raise the price**: more farms enter, the marginal farm's rent is near zero, and every gain shows up as higher rent, not as profit.`,
      deps: ['micro-8.8', 'micro-2.4', 'micro-8.5'], refs: ['Varian Ch. 24'], tags: ['competition', 'rent'],
      see: ['micro-3.7'],
      credit: 'David Ricardo, 1817 (differential rent); Alfred Marshall, 1890 (quasi-rent)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Economic_rent' },
      viz(v) {
        const w = 2.5, FARM = 40, NF = 10;
        const A = Array.from({ length: NF }, (_, i) => 1.6 - 0.1 * i);
        // technology q = A·√L on one acre → labour (q/A)², variable cost w(q/A)²; profit-maximizing output found by search
        const VC = (i, q) => w * (q / A[i]) ** 2;
        const qBest = (i, p) => argmax((q) => p * q - VC(i, q), 0, 80, 80, 50).x;
        const pEnter = A.map((a, i) => bisect((p) => { const q = qBest(i, p); return p * q - VC(i, q) - FARM; }, 0.5, 200));
        const qi = (i, p) => (p >= pEnter[i] ? (p * A[i] ** 2) / (2 * w) : 0); // closed form, checked against qBest in the readout
        const Ssum = (p, upto = NF - 1) => { let s = 0; for (let i = 0; i <= upto; i++) s += qi(i, p); return s; };
        const pS = v.slider('crop price $p$', 10, 34, 21, { step: 0.05 });
        const s = v.stage({ x: [0, 100], y: [0, 36], height: 360, axes: 'box', gutter: true, xlabel: 'market output Q', ylabel: 'price', title: 'market supply = horizontal sum; rents to its left', weight: 1.15 });
        const b = v.stage({ x: [0.3, NF + 0.7], y: [-60, 300], height: 360, axes: 'box', gutter: true, xticks: A.map((a, i) => [i + 1, v.fix(a, 1)]), xlabel: 'farm (land quality A)', ylabel: 'surplus over variable cost', title: 'who gets the surplus?', weight: 0.95 });
        v.legend([['ink', 'market supply'], ['green', 'rent of each farm’s land', { area: true }], ['muted', 'farmer’s time (opportunity cost)', { area: true }], ['red', 'would lose money: stays out', { area: true }], ['gold', 'marginal farm']]);
        let st = {};
        v.render(() => {
          const p = pS.value;
          // rent stripes: farm i occupies Q between S_{i−1}(x) and S_i(x) for x from its entry price to p
          let marg = -1;
          for (let i = 0; i < NF; i++) {
            if (p < pEnter[i]) continue;
            marg = i;
            const L = [], R = [];
            for (let j = 0; j <= 30; j++) { const x = pEnter[i] + ((p - pEnter[i]) * j) / 30; L.push([Ssum(x, i - 1), x]); R.push([Ssum(x, i), x]); }
            s.poly([...L, ...R.reverse()], { fill: 'green', fillAlpha: i % 2 ? 0.2 : 0.42, color: 'green', width: 0.8 });
          }
          // the supply staircase, sampled between entry prices
          const cuts = [0.01, ...pEnter.filter((x) => x < 36), 36].sort((a, c) => a - c);
          for (let j = 0; j < cuts.length - 1; j++) {
            const a = cuts[j], c = cuts[j + 1];
            s.path(sample((x) => x, a + 1e-9, c - 1e-9, 24).map(([, x]) => [Ssum(x), x]), { color: 'ink', width: 2.8 });
            if (j > 0) s.line(Ssum(a - 1e-6), a, Ssum(a + 1e-6), a, { color: 'ink', width: 1.2, dash: [3, 3] });
          }
          priceLine(s, p, `p = ${v.fix(p, 2)}`, { color: 'gold' });
          const Q = Ssum(p);
          s.dot(Q, p, { r: 6, color: 'gold' });
          if (marg + 1 < NF) plateText(s, `next farm enters at p = ${v.fix(pEnter[marg + 1], 2)}`, Ssum(pEnter[marg + 1] - 1e-6), pEnter[marg + 1], { dx: 10, align: 'left', color: 'muted' });
          // bars
          const rents = [];
          let top = 100;
          for (let i = 0; i < NF; i++) { const q = qBest(i, p), surplus = p * q - VC(i, q); top = Math.max(top, surplus); rents.push({ q, surplus, rent: surplus - FARM, on: p >= pEnter[i] }); }
          b.setView([0.3, NF + 0.7], [-60, Math.ceil((top * 1.15) / 50) * 50]);
          b.hline(0, { color: 'muted', width: 1 });
          rents.forEach((o, i) => {
            const x = i + 1;
            if (o.on) {
              bar(b, x, 0.66, 0, FARM, 'muted', { fillAlpha: 0.45 });
              bar(b, x, 0.66, FARM, o.surplus, 'green', { fillAlpha: 0.65 });
              if (i === marg) b.rect(x - 0.4, 0, x + 0.4, o.surplus, { color: 'gold', width: 2.4 });
              b.text(v.fix(o.rent, 0), x, o.surplus, { dy: -10, size: 10.5, weight: 700, color: 'ink', align: 'center' });
            } else {
              bar(b, x, 0.66, 0, Math.max(o.rent, -58), 'red', { fillAlpha: 0.35 });
              b.text('out', x, 0, { dy: -10, size: 10.5, color: 'red', align: 'center' });
            }
          });
          if (marg >= 0) plateText(b, 'marginal farm', marg + 1, rents[marg].surplus, { dy: -28, color: 'gold', align: 'center' });
          const total = rents.reduce((a, o) => a + (o.on ? o.rent : 0), 0);
          const area = simpson((x) => Ssum(x), 0.01, p, 1200);
          const chk = Math.max(...rents.map((o, i) => Math.abs(o.q - qi(i, p)) * (o.on ? 1 : 0)));
          st = { p, Q, marg, rents, total, area, chk, n: marg + 1 };
        });
        v.readout(() => {
          const { p, Q, marg, rents, total, area, n, chk } = st, f2 = (x) => v.fix(x, 2);
          if (marg < 0) return `At $p = ${f2(p)}$ no farm covers its costs: even the best land (entry price ${f2(pEnter[0])}) stays idle.`;
          const h = 0.01, dRent = (A.reduce((a, _, i) => { const r = (pp) => (pp >= pEnter[i] ? (pp * pp * A[i] ** 2) / (4 * w) - FARM : 0); return a + r(p + h) - r(p - h); }, 0)) / (2 * h);
          return `$p = ${f2(p)}$: ${n} farm${n > 1 ? 's' : ''} in production, market output $Q = ${f2(Q)}$. Marginal farm (A = ${v.fix(A[marg], 1)}): rent ${f2(rents[marg].rent)}${marg + 1 < NF ? `; the next farm would lose ${f2(-rents[marg + 1].rent)}` : ''}. Sum of rents ${f2(total)}; area left of the supply curve ${f2(area)}. A price rise of 1 raises total rent by $${f2(dRent)} \\approx Q$ and farmers' economic profit by 0. (Outputs found by search match $q = pA^2/2w$ to ${v.sci(chk + 1e-16, 1)}.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 8.11
    {
      num: '8.11', kind: 'Model', name: 'Short-run and long-run response to a demand shift',
      statement: String.raw`In a constant-cost competitive industry starting in long-run equilibrium, an increase in demand raises the price **in the short run** along the steep short-run supply curve $N\,q^s(p)$ (the horizontal sum of the incumbents' marginal cost curves), and incumbents earn positive profits. Over the **long run** those profits attract entrants; each entrant shifts short-run supply to the right, and the price falls back until it reaches $\min AC$ again. The new long-run equilibrium has the old price, the old output per firm, and more firms: all of the extra output comes from entry. A fall in demand works in reverse, with temporary losses and exit. The long-run supply curve is flat, so long-run supply is far more elastic than short-run supply.`,
      scope: String.raw`Constant-cost industry with identical firms and a fixed plant per firm; in an increasing- or decreasing-cost industry the price ends above or below its old level (8.9). Short-run price spikes are larger the more inelastic the incumbents' marginal cost.`,
      idea: String.raw`In the short run only the incumbents can respond, each moving up its marginal cost curve (8.4), so price must rise enough to call forth the extra output from a fixed set of plants. Profit is then positive (price above min AC), which by 8.7 attracts entry; entry continues while one more firm would still make a profit. Because entrants can replicate the incumbents' technology at unchanged input prices, the process ends only at the same minimum average cost, so price returns exactly to where it started (8.8, 8.9).`,
      caption: String.raw`Step through the story. Left: the market, with the old demand (dashed), the new demand, the short-run supply curve of the firms now present (orange; the faint one is the original 20 firms) and the flat long-run supply at $\min AC$ (green); gold dots trace the equilibria. Middle: one firm, with its profit or loss rectangle. Right: the price at each step. After the shift the price jumps, then each step adds (or removes) **one firm** until the price is back at the bottom of average cost. Choose a fall in demand to watch losses and exit instead.`,
      deps: ['micro-8.4', 'micro-8.9', 'micro-8.7'], refs: ['Mankiw Ch. 14', 'CORE Unit 11'], tags: ['competition', 'dynamics'],
      see: ['micro-3.2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Long_run_and_short_run' },
      viz(v) {
        const N0 = 20, D0 = (p) => 3 * Math.max(0, 60 - p);
        const shock = v.select('demand', [{ value: 'up', label: 'rises 40%' }, { value: 'down', label: 'falls 30%' }], 'up', { onChange: () => S.reset(frames(), { at: 'end' }) });
        const frames = () => {
          const mult = shock.value === 'up' ? 1.4 : 0.7, D1 = (p) => mult * D0(p), out = [];
          const e0 = eqm(N0, D0);
          out.push({ N: N0, D: D0, e: e0, line: 1, note: `Long-run equilibrium: ${N0} firms, price ${v.fix(e0.p, 2)} = min AC, zero profit.` });
          let N = N0, e = eqm(N, D1);
          out.push({ N, D: D1, e, line: 2, note: `Demand ${shock.value === 'up' ? 'rises' : 'falls'}. Short run: the same ${N} firms move along their MC curves; price ${shock.value === 'up' ? 'jumps' : 'drops'} to ${v.fix(e.p, 2)} and each firm ${e.pi >= 0 ? 'earns' : 'loses'} ${v.fix(Math.abs(e.pi), 2)}.` });
          for (let g = 0; g < 40; g++) {
            if (e.pi > 1e-6 && eqm(N + 1, D1).pi >= -1e-6) N++;
            else if (e.pi < -1e-6) N--;
            else break;
            e = eqm(N, D1);
            out.push({ N, D: D1, e, line: 3, note: `${shock.value === 'up' ? 'A firm enters' : 'A firm exits'}: ${N} firms, price ${v.fix(e.p, 2)}, profit per firm ${fx(e.pi, 2)}.` });
          }
          out[out.length - 1] = { ...out[out.length - 1], line: 4, note: `New long-run equilibrium: ${N} firms (${N > N0 ? '+' : ''}${N - N0}), price ${v.fix(e.p, 2)} = min AC again, output per firm ${v.fix(e.q, 2)} as before.` };
          return out;
        };
        const S = v.steps({ frames: frames(), speed: 1.4, start: 'end', still: 'end', codePos: 'below', code: ['start in long-run equilibrium: p = min AC', 'demand shifts: price moves along short-run supply N·q(p)', 'while one more firm would profit (or incumbents lose): one enters (exits)', 'stop: price back at min AC, all the change is in N'] });
        const m = v.stage({ x: [0, 260], y: [0, 50], height: 320, axes: 'box', gutter: true, xlabel: 'market output Q', ylabel: 'price', title: 'the market', weight: 1.2 });
        const f = v.stage({ x: [0, 9], y: [0, 50], height: 320, axes: 'box', gutter: true, xlabel: 'output of one firm q', ylabel: 'price, cost', title: 'one firm', weight: 0.9 });
        const ts = v.stage({ x: [-0.5, 12.5], y: [0, 50], height: 320, axes: 'box', gutter: true, xlabel: 'step', ylabel: 'price', title: 'price, step by step', weight: 0.8, minWidth: 200 });
        v.legend([['blue', 'demand (old dashed)'], ['orange', 'short-run supply of the firms present'], ['green', 'long-run supply: min AC', { dash: true }], ['gold', 'equilibria']]);
        v.render(() => {
          const fr = S.frame, all = S.frames, i = S.i;
          if (!fr || !fr.e) return;
          const mult = shock.value === 'up' ? 1.4 : 0.7;
          m.hline(F6.pBE, { color: 'green', width: 2, dash: [6, 4] });
          m.fn((Q) => 60 - Q / 3, { domain: [0, 180], color: 'blue', width: 1.6, dash: [6, 4] });
          if (i >= 1) m.fn((Q) => 60 - Q / (3 * mult), { domain: [0, 180 * mult], color: 'blue', width: 2.8 });
          if (fr.N !== N0) srSupply(m, N0, 48, { color: 'orange', width: 1.4, alpha: 0.4 });
          srSupply(m, fr.N, 48, { color: 'orange', width: 2.8 });
          m.text(`N = ${fr.N}`, fr.N * F6.qMC(46), 46, { dx: 6, size: 11.5, weight: 700, color: 'orange', align: 'left' });
          const pts = all.slice(0, i + 1).map((o) => [o.e.Q, o.e.p]);
          m.path(pts, { color: 'gold', width: 1.2, dash: [3, 3] }); m.dots(pts, { r: 3, color: 'gold' });
          m.dot(fr.e.Q, fr.e.p, { r: 7, color: 'gold' });
          plateText(m, `p = ${v.fix(fr.e.p, 2)}`, fr.e.Q, fr.e.p, { dx: 12, dy: fr.e.p > 20.5 ? -14 : 14, align: 'left', color: 'ink' });
          // firm
          drawCosts(f, F6, 9);
          if (fr.e.q > 0) profitRect(f, fr.e.q, fr.e.p, F6.C.AC(fr.e.q));
          priceLine(f, fr.e.p, `p = ${v.fix(fr.e.p, 2)}`);
          f.dot(fr.e.q, fr.e.p, { r: 6, color: 'gold' });
          // series
          ts.setView([-0.5, Math.max(12.5, all.length - 0.5)], [0, 50]);
          ts.hline(F6.pBE, { color: 'green', width: 1.4, dash: [6, 4] });
          const ser = all.map((o, k) => [k, o.e.p]);
          ts.path(ser, { color: 'faint', width: 1.4 });
          ts.path(ser.slice(0, i + 1), { color: 'accent', width: 2.4 }); ts.dots(ser.slice(0, i + 1), { r: 3.2, color: 'accent' });
          ts.dot(i, fr.e.p, { r: 6, color: 'gold' });
          ts.text('short run', 1, all[1].e.p, { dx: 8, dy: shock.value === 'up' ? -10 : 14, size: 11, weight: 700, color: 'ink', align: 'left' });
          ts.text('long run', all.length - 1, F6.pBE, { dy: shock.value === 'up' ? 14 : -10, size: 11, weight: 700, color: 'green', align: 'right' });
        });
        v.readout(() => {
          const fr = S.frame, all = S.frames; if (!fr || !fr.e) return '';
          const e1 = all[1].e, eL = all[all.length - 1].e, NL = all[all.length - 1].N, f2 = (x) => v.fix(x, 2);
          const eSR = ((e1.Q - all[0].e.Q) / all[0].e.Q) / ((e1.p - all[0].e.p) / all[0].e.p);
          return `Step ${S.i}: $N = ${fr.N}$, $p = ${f2(fr.e.p)}$, $Q = ${f2(fr.e.Q)}$, output per firm ${f2(fr.e.q)}, profit per firm ${fx(fr.e.pi, 2)}. Short-run response: price ${f2(all[0].e.p)} → ${f2(e1.p)} (arc supply elasticity ${v.fix(eSR, 2)}); long run: price ${f2(eL.p)} with ${NL} firms, so long-run supply is flat at min AC = ${f2(F6.pBE)}.`;
        });
      },
    },
  ],
};
