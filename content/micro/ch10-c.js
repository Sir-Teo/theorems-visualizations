// Microeconomics — Chapter 10: Market power: monopoly and oligopoly — items 10.13–10.17
import { clamp, fx, bisect, argmax, plateText, bar, lin, mstage, tag, integ, tween } from './ch10.shared.js';

/** Global leader solution including follower exit; candidates are the two quadratic maxima and their kink. */
export function stackelbergOutcome(a, b, c1, c2) {
  const reply = q => Math.max(0, (a - c2 - b * q) / (2 * b));
  const profit = q => q * (a - b * (q + reply(q)) - c1);
  const candidates = [0, Math.max(0, (a - c2) / b), Math.max(0, (a - c1) / (2 * b)), Math.max(0, (a - 2 * c1 + c2) / (2 * b))];
  let q1 = 0; for (const q of candidates) if (profit(q) > profit(q1)) q1 = q;
  return { q1, q2: reply(q1), profit: profit(q1) };
}

export default {
  collection: 'micro',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.13
    {
      num: '10.13', kind: 'Model', name: 'Stackelberg leadership',
      statement: String.raw`In the **Stackelberg** model one firm (the **leader**) commits to its quantity first; the other (the **follower**) observes it and then picks its best reply, $q_2 = R_2(q_1)$. The leader therefore maximizes its profit along the follower's reaction curve, $\max_{q_1}\; \pi_1\bigl(q_1, R_2(q_1)\bigr)$. With $P = a - bQ$ and constant costs, if both firms are active and the optimum is on the interior follower branch,
$$q_1^S = \frac{a - 2c_1 + c_2}{2b}, \qquad q_2^S = \frac{a - 3c_2 + 2c_1}{4b}.$$
For equal costs below the demand intercept, compared with Cournot the leader produces more and earns more, the follower produces less and earns less, total output is larger and the price lower: there is a **first-mover advantage**, which comes from commitment (a leader that could revise its output would end up at the Cournot point).`,
      idea: String.raw`The leader knows that every output it picks will be met by $R_2$, which falls with $q_1$ (10.10): extra output crowds the follower out. So the leader's choice set is the follower's reaction line, and it picks the point on that line touching its highest iso-profit curve, which lies at a tangency, not at the intersection of the two reaction lines. The Cournot point is on the line too, so the leader can only do at least as well as at Cournot. The displayed closed form must be replaced by a boundary solution if the follower exits.`,
      caption: String.raw`The orange line is the follower's reaction curve, the purple curves are the leader's iso-profit curves (profit rises toward the lower left). **Drag the gold point** along the follower's line: the leader's profit is read off the iso-profit curve through it (right panel plots the same profit against $q_1$). The Stackelberg optimum is where an iso-profit curve is tangent to the line; the Cournot equilibrium (green) lies on a lower curve. Change the costs to see the advantage shrink or grow.`,
      deps: ['micro-10.10'],
      see: ['game-1.3'],
      refs: ['Varian Ch. 28'], tags: ['oligopoly'],
      credit: 'H. von Stackelberg, Marktform und Gleichgewicht, Vienna: Springer, 1934',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stackelberg_competition' },
      viz(v) {
        const c1S = v.slider('leader cost $c_1$', 0, 5, 2, { step: 0.05 });
        const c2S = v.slider('follower cost $c_2$', 0, 5, 2, { step: 0.05 });
        const a = 12, b = 1;
        const s = v.stage({ x: [0, 12], y: [0, 12], axes: 'box', gutter: true, equal: true, xlabel: 'leader output $q_1$', ylabel: 'follower output $q_2$', height: 420, title: 'output plane' });
        const G = v.stage({ x: [0, 12], y: [-4, 30], axes: 'box', gutter: true, xlabel: 'leader output $q_1$', ylabel: 'leader profit', height: 420, title: 'leader\'s profit along the follower\'s reply', weight: 0.8, minWidth: 250 });
        v.legend([['accent', 'leader reaction line'], ['orange', 'follower reaction line'], ['purple', 'leader iso-profit curves'], ['green', 'Cournot', { dot: true }], ['gold', 'chosen $q_1$', { dot: true }]]);
        const R2f = () => (q1) => Math.max(0, (a - c2S.value - b * q1) / (2 * b));
        const H = s.handle(2, 4, { color: 'gold', r: 9, label: 'q₁', labelPos: 'ne', constrain: (x) => { const q = clamp(x, 0.05, 11.9); return [q, R2f()(q)]; } });
        let st = {};
        v.button('go to the optimum', () => { const c1 = c1S.value, R2 = R2f(); const o = stackelbergOutcome(a, b, c1, c2S.value); H.set(o.q1, o.q2); });
        v.render(() => {
          const c1 = c1S.value, c2 = c2S.value, R2 = R2f(), R1 = (q2) => Math.max(0, (a - c1 - b * q2) / (2 * b));
          const pi1 = (q1, q2) => q1 * (a - b * (q1 + q2) - c1), pi2 = (q1, q2) => q2 * (a - b * (q1 + q2) - c2);
          const lead = (q) => pi1(q, R2(q));
          const exact = stackelbergOutcome(a, b, c1, c2), o = { x: exact.q1, f: exact.profit };
          const [e1, e2] = v.M.solve([[2 * b, b], [b, 2 * b]], [a - c1, a - c2]);
          H.set(H.x, R2(H.x));
          const q1 = H.x, q2 = H.y;
          s.clip(() => s.contour((x, y) => pi1(x, y), [pi1(q1, q2), lead(o.x), pi1(e1, e2)], { color: 'purple', width: 1.8, res: 100 }));
          s.line(R1(0), 0, 0, a - c1, { color: 'accent', width: 2, alpha: 0.7 }); s.line(0, R2(0), a - c2, 0, { color: 'orange', width: 2.8 });
          s.dot(e1, e2, { r: 8, color: 'green' }); s.dot(o.x, R2(o.x), { r: 8, color: 'purple' });
          tag(s, 'Stackelberg', o.x, R2(o.x), 'purple', { dy: -18, dx: 20 }); tag(s, 'Cournot', e1, e2, 'green', { dy: 18, dx: -22 });
          s.dot(q1, q2, { r: 6, color: 'gold' });
          G.setView([0, 12], [Math.min(-4, lead(12)) * 1.1, Math.max(30, o.f) * 1.1]);
          G.hline(0, { color: 'muted' }); G.fn(lead, { domain: [0, 12], color: 'ink', width: 2.4 });
          G.hline(pi1(e1, e2), { color: 'green', width: 1.5, dash: [4, 3] });
          G.dot(o.x, o.f, { r: 7, color: 'purple' }); G.dot(q1, lead(q1), { r: 6, color: 'gold' });
          const Q = o.x + R2(o.x);
          st = { q1, q2, o, e1, e2, p1: lead(q1), pS1: o.f, pS2: pi2(o.x, R2(o.x)), pC1: pi1(e1, e2), pC2: pi2(e1, e2), QS: Q, QC: e1 + e2, PS: a - b * Q, PC: a - b * (e1 + e2), q2S: R2(o.x), cf: exact.q2 > 1e-8 ? (a - 2 * c1 + c2) / (2 * b) : null };
        });
        v.readout(() => `Leader at your $q_1 = ${fx(st.q1)}$ earns $${fx(st.p1)}$. Optimum: $q_1^S = ${fx(st.o.x, 3)}$ (${st.cf === null ? 'boundary solution: follower exits' : `interior formula $${fx(st.cf, 3)}$`}), follower $q_2 = ${fx(st.q2S, 3)}$, profits $${fx(st.pS1)}$ and $${fx(st.pS2)}$, price $${fx(st.PS)}$.\nCournot: outputs $(${fx(st.e1)}, ${fx(st.e2)})$, profits $${fx(st.pC1)}$ and $${fx(st.pC2)}$, price $${fx(st.PC)}$. First-mover gain for the leader $${fx(st.pS1 - st.pC1)}$; total output $${fx(st.QS)}$ against $${fx(st.QC)}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.14
    {
      num: '10.14', kind: 'Model', name: 'Bertrand competition',
      statement: String.raw`Two firms with the same constant marginal cost $c$ sell an identical good and choose **prices** simultaneously; every buyer buys from the cheaper firm and demand is split equally if the prices are equal. With market demand $D(p)$ the profit of firm $i$ is $(p_i - c)D(p_i)$ if $p_i < p_j$, half of it if $p_i = p_j$, and zero if $p_i > p_j$. Assume continuous prices, unlimited capacity, and continuous demand positive at $c$, with $c$ below the choke price. The unique Nash equilibrium (in pure strategies) is $p_1^* = p_2^* = c$: both firms price at marginal cost and earn zero profit, the competitive outcome, already with two firms.`,
      idea: String.raw`If $p_j > c$ is the rival's price, firm $i$ gains by pricing just below it (it takes the whole market for a negligible loss of margin), as long as the undercut price is above $c$ (or the monopoly price, if the rival charges more than that). So no price above $c$ is a best reply to itself: any common price above cost invites an undercut, which invites another. At $p = c$ the profit is zero either way, undercutting would make a loss and raising the price loses all customers. The result is the contrast to Cournot (10.10): the choice variable (price rather than quantity) turns two sellers into perfect competitors.`,
      caption: String.raw`Demand is $D(p) = 10 - p$. Left: the price plane $(p_1, p_2)$; press play and the firms **undercut one another** in steps of $\delta$ from the monopoly price down to marginal cost (the path ends at $(c, c)$). Right: the profit of the firm about to move, as a function of its own price when the rival's price is fixed at the current value: profit **jumps** at the rival's price (the market is all or nothing), so a profitable undercut can be chosen just below it; with continuous prices a best reply need not exist at an arbitrary rival price. Change the step $\delta$ or the cost $c$.`,
      deps: ['micro-10.2', 'game-1.2'],
      see: ['game-1.2'],
      refs: ['Varian Ch. 28'], tags: ['oligopoly'],
      credit: 'J. Bertrand, review of Walras and Cournot in the Journal des savants, 1883',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bertrand_competition' },
      viz(v) {
        const cS = v.slider('marginal cost $c$', 1, 5, 2, { step: 0.05 });
        const dS = v.slider('undercut step $\\delta$', 0.05, 1, 0.25, { step: 0.05 });
        const D = (p) => Math.max(0, 10 - p), PER = 8;
        const s = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, equal: true, xlabel: 'price of firm 1, $p_1$', ylabel: 'price of firm 2, $p_2$', height: 400, title: 'price plane' });
        const G = v.stage({ x: [0, 10], y: [0, 18], axes: 'box', gutter: true, xlabel: 'own price', ylabel: 'profit of the firm about to move', height: 400, title: 'the jump in profit', weight: 0.8, minWidth: 250 });
        v.legend([['accent', 'sequence of undercuts'], ['green', 'equilibrium $(c, c)$', { dot: true }], ['gold', 'current prices', { dot: true }], ['red', 'best reply: just below the rival', { dot: true }]]);
        let st = {};
        v.animate((t) => {
          const c = cS.value, dl = dS.value, pm = (10 + c) / 2;
          let p = [pm, pm]; const path = [p.slice()]; let turn = 0;
          for (let k = 0; k < 800; k++) { const i = turn % 2, o = 1 - i, nxt = Math.max(c, p[o] - dl); if (p[i] <= nxt + 1e-9 && p[o] <= c + 1e-9) break; p[i] = nxt; path.push(p.slice()); turn++; }
          const L = path.length - 1, k = Math.min(L, Math.floor(Math.min(1, t / PER) * L + 1e-9)), cur = path[k], mover = k % 2 === 0 ? 0 : 1, rv = cur[1 - mover];
          s.line(0, 0, 10, 10, { color: 'muted', width: 1, dash: [3, 3] });
          s.path(path.slice(0, k + 1), { color: 'accent', width: 1.8 });
          s.dot(c, c, { r: 8, color: 'green', hollow: true }); s.dot(cur[0], cur[1], { r: 7, color: 'gold' });
          tag(s, '$(c, c)$', c, c, 'green', { dx: 28, dy: 14 });
          const own = (x) => (x < rv - 1e-9 ? (x - c) * D(x) : x > rv + 1e-9 ? 0 : 0.5 * (x - c) * D(x));
          G.hline(0, { color: 'muted' });
          G.fn((x) => (x - c) * D(x), { domain: [c, Math.min(rv - 1e-3, 10)], color: 'accent', width: 2.6 });
          G.line(Math.min(rv, 10), 0, 10, 0, { color: 'accent', width: 2.6 });
          G.dot(Math.min(rv, 10), 0.5 * (rv - c) * D(rv), { r: 5, color: 'accent' });
          G.dot(Math.min(rv, 10), (rv - c) * D(rv), { r: 5, hollow: true, color: 'accent' });
          G.vline(rv, { color: 'muted', width: 1, dash: [3, 3] });
          const br = Math.max(c, rv - dl); G.dot(br, own(br), { r: 6, color: 'red' });
          G.dot(cur[mover], own(cur[mover]), { r: 6, color: 'gold' });
          const prof = (i) => { const pi = cur[i], pj = cur[1 - i]; return pi < pj - 1e-9 ? (pi - c) * D(pi) : pi > pj + 1e-9 ? 0 : 0.5 * (pi - c) * D(pi); };
          let dev = 0; for (let x = c; x <= 10; x += 0.01) dev = Math.max(dev, (x < c - 1e-9 ? 0 : x < c + 1e-9 ? 0.5 * (x - c) * D(x) : 0));
          st = { k, L, cur, pm, p1: prof(0), p2: prof(1), done: k === L, dev };
        }, { period: PER + 1.5, once: true, still: 4 });
        v.readout(() => `Step ${st.k} of ${st.L}: prices $(${fx(st.cur[0], 2)}, ${fx(st.cur[1], 2)})$ from the monopoly price $${fx(st.pm, 2)}$; profits $${fx(st.p1)}$ and $${fx(st.p2)}$.${st.done ? ' Equilibrium: both at marginal cost, zero profit; no deviation does better (best deviation profit $0$ when the rival sits at $c$).' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 10.15
    {
      num: '10.15', kind: 'Paradox', name: 'Bertrand paradox',
      statement: String.raw`The **Bertrand paradox**: two (or any number $\ge 2$ of) firms selling a homogeneous good at equal constant marginal cost, competing in prices with no capacity limit, price at marginal cost and earn nothing (10.14), which is far from the quantity-competition (Cournot, 10.10) result and from what is seen in many concentrated industries. The paradox disappears when one of its assumptions is relaxed. With **capacity limits** a firm cannot serve the whole market at a low price, so the rival can raise its price safely and the pure-strategy equilibrium either lies **above** cost or does not exist. With **product differentiation** buyers do not all switch for a small price cut, and equilibrium prices exceed marginal cost, rising as the products become less substitutable. If firms first choose capacities and then prices, then under suitable conditions (efficient rationing, decreasing concave inverse demand and convex capacity costs strictly positive on the margin) the outcome is that of Cournot (Kreps and Scheinkman).`,
      idea: String.raw`The undercutting argument needs two things: that a small price cut wins the entire market, and that the firm can serve it. Differentiation breaks the first: with demands $q_i = [(a - p_i) - s(a - p_j)]/(1 - s^2)$ the best reply $p_i = [(1-s)a + c + s\,p_j]/2$ has slope $s/2 < 1$ and the equilibrium markup shrinks to zero only as $s \to 1$. Capacity breaks the second: if the rival cannot serve more than $k$ units, the residual demand $D(p) - k$ at a higher price is still positive, so raising the price pays and the common price $c$ cannot be an equilibrium unless $k$ is as large as $D(c)$. Whether the markup survives is therefore an empirical matter of how substitutable the products are and how fast capacity can be added.`,
      caption: String.raw`Choose what to relax. **Differentiation:** slide the substitutability $s$ from $0$ (independent products) to $1$ (identical); the Bertrand price falls from the monopoly price to $c$; it is never above the Cournot price, the two coincide at $s = 0$ and the gap is widest at $s = 1$, the paradox. **Capacity:** slide the capacity $k$ of each firm (demand $D(p) = 10 - p$, $c = 2$, efficient rationing): where a pure equilibrium exists it is plotted; in the shaded range a deviation to a higher price pays and no pure equilibrium exists. The right panel shows the test at the chosen $k$ (or the reaction lines at the chosen $s$).`,
      deps: ['micro-10.14', 'micro-10.10'],
      refs: ['Varian Ch. 28'], tags: ['oligopoly'],
      credit: 'J. Bertrand, 1883; D. Kreps & J. Scheinkman, Bell Journal of Economics 14 (2): 326–337, 1983 (capacity-constrained subgames and capacity-first game)',
      scope: String.raw`Linear demand, equal constant costs, and (for the capacity mode) efficient rationing; the pure-equilibrium test is computed numerically for the stated rationing rule only.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bertrand_paradox_(economics)' },
      viz(v) {
        const mode = v.select('relax', [{ value: 'diff', label: 'product differentiation' }, { value: 'cap', label: 'capacity limits' }], 'diff');
        const sS = v.slider('substitutability $s$', 0, 1, 0.5, { step: 0.01 });
        const kS = v.slider('capacity $k$ of each firm', 0.5, 9, 2, { step: 0.05 });
        const a = 10, c = 2;
        const S = v.stage({ x: [0, 1], y: [0, 7], axes: 'box', gutter: true, xlabel: 'substitutability $s$', ylabel: 'equilibrium price', height: 400, title: 'equilibrium price' });
        const T = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, equal: true, xlabel: '$p_1$', ylabel: '$p_2$', height: 400, title: 'reaction lines', weight: 0.8, minWidth: 250 });
        v.legend([['ink', 'Bertrand price'], ['purple', 'Cournot price'], ['muted', 'monopoly price'], ['orange', 'marginal cost'], ['gold', 'this setting', { dot: true }]]);
        const Dm = (p) => Math.max(0, a - p);
        // pure-strategy equilibrium test with capacity k (efficient rationing): candidate price, deviation payoff
        const capEq = (k) => {
          const ph = Math.max(c, a - 2 * k), own = (ph - c) * Math.min(k, Dm(ph) / 2);
          let dev = 0; for (let p = ph + 1e-3; p <= a; p += 0.01) dev = Math.max(dev, (p - c) * Math.max(0, Dm(p) - k));
          return { ph, own, dev, ok: dev <= own + 1e-6 };
        };
        let st = {};
        v.render(() => {
          const diff = mode.value === 'diff';
          sS.el.hidden = !diff; kS.el.hidden = diff;
          const kmax = 9;
          if (diff) {
            S.setView([0, 1], [0, 7]); S.setLabels('substitutability $s$', 'equilibrium price'); S.setTitle('equilibrium price against substitutability');
            const BR = (s_, pj) => ((1 - s_) * a + c + s_ * pj) / 2;
            const eqB = (s_) => { let p = c; for (let i = 0; i < 80; i++) p = BR(s_, p); return p; };
            const pC = (s_) => a - ((1 + s_) * (a - c)) / (2 + s_);
            S.fn(eqB, { domain: [0, 1], color: 'ink', width: 2.6 }); S.fn(pC, { domain: [0, 1], color: 'purple', width: 2.6 });
            S.hline((a + c) / 2, { color: 'muted', width: 1.4, dash: [4, 3] }); S.hline(c, { color: 'orange', width: 2.2 });
            const s_ = sS.value, p = eqB(s_); S.dot(s_, p, { r: 8, color: 'gold' });
            T.setView([0, 10], [0, 10]); T.setLabels('$p_1$', '$p_2$'); T.setTitle('best replies in prices');
            T.line(0, BR(s_, 0), 10, BR(s_, 10), { color: 'accent', width: 2.4 }); T.line(BR(s_, 0), 0, BR(s_, 10), 10, { color: 'orange', width: 2.4 });
            T.dot(p, p, { r: 8, color: 'gold' }); T.line(0, 0, 10, 10, { color: 'muted', width: 1, dash: [3, 3] });
            st = { diff, s: s_, p, pc: pC(s_), markup: (p - c) / p, };
          } else {
            S.setView([0, kmax], [0, 10]); S.setLabels('capacity $k$ of each firm', 'pure-equilibrium price'); S.setTitle('equilibrium price against capacity');
            S.rect(8 / 3, 0, 8, 7, { fill: 'red', fillAlpha: 0.08, stroke: false }); plateText(S, 'no pure equilibrium', 5.3, 6.2, { color: 'red', align: 'center' });
            S.path([[0.05, a - 0.1], [8 / 3, a - 16 / 3]], { color: 'ink', width: 2.6 }); S.path([[8, c], [kmax, c]], { color: 'ink', width: 2.6 });
            S.hline((a + 2 * c) / 3, { color: 'purple', width: 1.6, dash: [4, 3] }); S.hline((a + c) / 2, { color: 'muted', width: 1.4, dash: [4, 3] }); S.hline(c, { color: 'orange', width: 2.2 });
            const k = kS.value, e = capEq(k);
            S.dot(k, e.ok ? e.ph : (a + c) / 2, { r: 8, color: e.ok ? 'gold' : 'red', hollow: !e.ok });
            T.setView([2, 10], [0, 12]); T.setLabels('own price $p$', 'profit'); T.setTitle('deviation test: own profit as the price varies');
            T.fn((p) => (p - c) * Math.max(0, Dm(p) - k), { domain: [Math.max(e.ph, 2) + 0.001, a], color: 'accent', width: 2.6 });
            T.hline(e.own, { color: 'green', width: 2, dash: [4, 3] }); T.dot(e.ph, e.own, { r: 7, color: 'green' });
            st = { diff, k, e };
          }
        });
        v.readout(() => st.diff ? `$s = ${fx(st.s)}$: Bertrand price $${fx(st.p, 3)}$ (markup $(P - c)/P = ${fx(st.markup, 3)}$); Cournot price $${fx(st.pc, 3)}$. At $s = 1$ the Bertrand price is $c = ${c}$, the paradox.` : `Capacity $k = ${fx(st.k)}$ each (demand at cost $D(c) = ${a - c}$). Candidate price $${fx(st.e.ph)}$ earns $${fx(st.e.own)}$ per firm; the best deviation to a higher price earns $${fx(st.e.dev)}$. ${st.e.ok ? 'No profitable deviation: a pure equilibrium.' : 'A deviation pays: no pure-strategy equilibrium here (firms randomize or price cycles).'}`);
      },
    },
    // ------------------------------------------------------------------ 10.16
    {
      num: '10.16', kind: 'Concept', name: 'Collusion and cartel instability',
      statement: String.raw`A **cartel** of $n$ identical firms that jointly maximize profit would produce the monopoly output $Q^m$, each firm $Q^m/n$, and earn $\pi^M$ each. But each member does better by **cheating**: given that the others hold to their quotas, its best reply is to produce more, earning $\pi^D > \pi^M$, so the agreement is not a Nash equilibrium of the one-shot quantity game, which has the lower Cournot profit $\pi^N$. In **repeated** play, firms can sustain the cartel with the threat of reverting to Cournot forever after a deviation (a trigger strategy) if they value the future enough:
$$\frac{\pi^M}{1-\delta} \;\ge\; \pi^D + \frac{\delta\,\pi^N}{1-\delta} \iff \delta \;\ge\; \delta^* = \frac{\pi^D - \pi^M}{\pi^D - \pi^N}.$$
With linear demand and $n = 2$, $\delta^* = 9/17 \approx 0.53$; $\delta^*$ rises with $n$, so collusion is harder to sustain among many firms.`,
      idea: String.raw`The joint-profit-maximizing point lies on the diagonal below the Cournot point (less total output), where each firm's marginal revenue exceeds its marginal cost: at the cartel quota, one more unit earns more than it costs because the price fall it causes is borne partly by the rivals. The one-period gain from cheating is $\pi^D - \pi^M$; the loss is the stream of lower profits $\pi^M - \pi^N$ in every later period, discounted by $\delta$. Comparing them gives the threshold. An agreement that firms cannot enforce in court must be self-enforcing in this way, which is the content of the folk theorem (game-5.3 for the repeated-game machinery).`,
      caption: String.raw`The plane shows firm $i$'s output $q_i$ against the total output $Q_{-i}$ of its rivals. Purple curves: firm $i$'s iso-profit curves through the cartel point (grey), the Cournot point (green) and the best deviation (red). Slide the **number of firms** and the **discount factor** $\delta$: the red point (cheating) always has higher profit than the grey one, but the right panel plots the present value of keeping the cartel minus that of cheating once and being punished by Cournot play for ever, which is positive exactly when $\delta \ge \delta^*$.`,
      deps: ['micro-10.10'],
      see: ['game-1.4', 'game-5.3'],
      refs: ['Varian Ch. 28', 'Mankiw Ch. 17'], tags: ['oligopoly', 'cartels'],
      credit: 'G. J. Stigler, A Theory of Oligopoly, Journal of Political Economy 72 (1): 44–61, 1964 (secret price cutting as the cartel\'s central problem)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cartel' },
      viz(v) {
        const nS = v.slider('number of firms $n$', 2, 10, 2, { int: true });
        const dS = v.slider('discount factor $\\delta$', 0, 0.99, 0.6, { step: 0.01 });
        const a = 12, b = 1, c = 2;
        const s = v.stage({ x: [0, 5], y: [0, 6], axes: 'box', gutter: true, xlabel: 'own output $q_i$', ylabel: 'rivals\' total output $Q_{-i}$', height: 400, title: 'one firm against its rivals' });
        const G = v.stage({ x: [0, 1], y: [0, 100], axes: 'box', gutter: true, xlabel: 'discount factor $\\delta$', ylabel: 'value of keeping the cartel − value of cheating', height: 400, title: 'cooperate or cheat?', weight: 0.8, minWidth: 250 });
        v.legend([['muted', 'cartel point', { dot: true }], ['green', 'Cournot point', { dot: true }], ['red', 'best cheating output', { dot: true }], ['accent', 'gain from keeping the cartel (present value)']]);
        let st = {};
        v.render(() => {
          const n = nS.value, dl = dS.value, Qm = (a - c) / (2 * b), qm = Qm / n, qn = (a - c) / ((n + 1) * b);
          const pi = (q, Qo) => q * (a - b * (q + Qo) - c);
          const Qo = (n - 1) * qm, qd = Math.max(0, (a - c - b * Qo) / (2 * b));
          const piM = pi(qm, Qo), piN = pi(qn, (n - 1) * qn), piD = pi(qd, Qo), dstar = (piD - piM) / (piD - piN);
          s.clip(() => s.contour((x, y) => pi(x, y), [piM, piN, piD], { color: 'purple', width: 1.8, res: 100 }));
          s.dot(qm, Qo, { r: 8, color: 'muted' }); s.dot(qn, (n - 1) * qn, { r: 8, color: 'green' }); s.dot(qd, Qo, { r: 8, color: 'red' });
          tag(s, 'cartel', qm, Qo, 'muted', { dy: 18 }); tag(s, 'Cournot', qn, (n - 1) * qn, 'green', { dy: -16, dx: 24 }); tag(s, 'cheat', qd, Qo, 'red', { dy: -16 });
          const Vc = (d) => piM / (1 - d), Vd = (d) => piD + (d * piN) / (1 - d);
          const diff = (d) => Vc(d) - Vd(d), top = Math.max(1, diff(0.95) * 1.1), bot = Math.min(-1, diff(0) * 1.2);
          G.setView([0, 1], [bot, top]);
          G.hline(0, { color: 'muted', width: 1.2 }); G.fn(diff, { domain: [0, 0.95], color: 'accent', width: 2.6 });
          G.vline(dstar, { color: 'green', width: 1.8, dash: [4, 3] }); G.dot(dl, diff(dl), { r: 7, color: diff(dl) >= 0 ? 'green' : 'red' });
          tag(G, `$\\delta^* = ${fx(dstar, 3)}$`, dstar, 0, 'green', { dy: -16, dx: 30 });
          st = { n, dl, piM, piN, piD, dstar, Vc: Vc(dl), Vd: Vd(dl), qm, qn, qd, suck: n === 2 ? pi(qm, qd) : null };
        });
        v.readout(() => `Per firm: cartel $${fx(st.piM)}$ (output $${fx(st.qm)}$), Cournot $${fx(st.piN)}$ (output $${fx(st.qn)}$), best cheat $${fx(st.piD)}$ (output $${fx(st.qd)}$).${st.suck !== null ? ` The cheated partner gets $${fx(st.suck)}$.` : ''}\nCritical $\\delta^* = (\\pi^D - \\pi^M)/(\\pi^D - \\pi^N) = ${fx(st.dstar, 3)}$ (for $n = 2$: $9/17 = ${fx(9 / 17, 3)}$). At $\\delta = ${fx(st.dl)}$: keep $${fx(st.Vc)}$ against cheat $${fx(st.Vd)}$, so the cartel is ${st.dl >= st.dstar ? 'self-enforcing' : 'not self-enforcing'}.`);
      },
    },
    // ------------------------------------------------------------------ 10.17
    {
      num: '10.17', kind: 'Model', name: 'Hotelling’s linear city',
      statement: String.raw`Customers are spread uniformly along a street $[0, 1]$ and each buys one unit from the seller with the lowest delivered cost: price plus a transport cost that grows with distance. Two sellers choose where to locate. With **prices fixed** (and equal) the customers split at the midpoint $(a + b)/2$ between the sellers at $a \le b$, so each seller gains by moving towards the other, and the equilibrium has both at the centre: **minimum differentiation** (Hotelling's principle). When sellers also **compete in price** with transport cost $t(x - \text{location})^2$, equilibrium prices are $p_A = c + t(b-a)(2 + a + b)/3$ and $p_B = c + t(b-a)(4 - a - b)/3$ and the profit of the left seller is $t(b-a)(2 + a + b)^2/18$, which **falls** as it moves towards its rival: the sellers locate at the **opposite ends** of the street (maximum differentiation), because proximity triggers price competition (10.14).`,
      idea: String.raw`With fixed prices moving a little toward the rival captures customers (the indifferent customer moves toward the rival) at no price cost, so there is nothing to lose until the sellers coincide. With price competition there are two opposing forces: moving closer takes market share but makes the two products closer substitutes, so prices fall, as in Bertrand competition (10.14): at equal locations the equilibrium price is $c$ with zero profit. The price effect wins for every location pair, so profit is largest at the extreme positions. Hotelling's original (1929) analysis used linear transport costs, for which d'Aspremont, Gabszewicz and Thisse showed that no price equilibrium exists when sellers are close, undermining the principle; the quadratic cost used here restores existence.`,
      caption: String.raw`**Drag the two sellers** along the street. Mode **fixed prices**: the customers left of the midpoint go to the left seller (blue), the rest to the right one (orange); the lower panel plots the left seller's customers against its own location, which is largest at the centre. Mode **price competition**: the equilibrium prices of the two sellers (computed for the positions chosen) and shares are drawn, and the lower panel shows the left seller's profit, which is highest at the left end. The readout says which way it would like to move.`,
      deps: ['micro-10.14'],
      refs: ['Varian Ch. 26'], tags: ['oligopoly', 'differentiation'],
      credit: 'H. Hotelling, Stability in Competition, Economic Journal 39 (153): 41–57, 1929; C. d\'Aspremont, J. J. Gabszewicz & J.-F. Thisse, On Hotelling\'s "Stability in Competition", Econometrica 47 (5): 1145–1150, 1979',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hotelling%27s_law' },
      viz(v) {
        const mode = v.select('model', [{ value: 'fixed', label: 'fixed prices' }, { value: 'price', label: 'price competition' }], 'fixed');
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, title: 'the street', full: true });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'location of the left seller', ylabel: 'left seller\'s payoff', height: 300, title: 'what the left seller gains by moving', full: true });
        v.legend([['accent', 'left seller and its customers'], ['orange', 'right seller and its customers'], ['gold', 'indifferent customer', { dot: true }]]);
        const HA = s.handle(0.25, 0.55, { color: 'accent', r: 10, label: 'A', labelPos: 'n', constrain: 'x' });
        const HB = s.handle(0.75, 0.55, { color: 'orange', r: 10, label: 'B', labelPos: 'n', constrain: 'x' });
        const t = 1, c = 0;
        let st = {};
        v.render(() => {
          let a = clamp(HA.x, 0.01, 0.97), b = clamp(HB.x, 0.03, 0.99);
          if (a > b - 0.02) { if (HA.dragging) a = b - 0.02; else b = a + 0.02; }
          HA.set(a, 0.55); HB.set(b, 0.55);
          const fixed = mode.value === 'fixed';
          const pA = fixed ? 1 : c + (t * (b - a) * (2 + a + b)) / 3, pB = fixed ? 1 : c + (t * (b - a) * (4 - a - b)) / 3;
          const xh = (a + b) / 2 + (pB - pA) / (2 * t * (b - a) * (fixed ? Infinity : 1));
          const x_ = fixed ? (a + b) / 2 : xh;
          s.rect(0, 0.08, x_, 0.3, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 }); s.rect(x_, 0.08, 1, 0.3, { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1 });
          s.dot(x_, 0.19, { r: 7, color: 'gold' }); s.vline(x_, { color: 'gold', width: 1.5, dash: [3, 3] });
          if (!fixed) { tag(s, `$p_A = ${fx(pA, 3)}$`, a, 0.85, 'accent', { dy: -4 }); tag(s, `$p_B = ${fx(pB, 3)}$`, b, 0.85, 'orange', { dy: -4 }); }
          const payoff = (aa) => (fixed ? (aa + b) / 2 : (t * (b - aa) * (2 + aa + b) ** 2) / 18);
          const top = fixed ? 1 : 0.35;
          G.setView([0, 1], [0, top]);
          G.fn(payoff, { domain: [0, b - 0.02], color: 'accent', width: 2.6 });
          G.dot(a, payoff(a), { r: 7, color: 'accent' }); G.vline(b, { color: 'orange', width: 1.5, dash: [4, 3] });
          const best = argmax(payoff, 0, b - 0.02, 80);
          st = { fixed, a, b, pA, pB, x: x_, payoff: payoff(a), best, profB: fixed ? 1 - x_ : (pB - c) * (1 - x_) };
        });
        v.readout(() => st.fixed ? `A at $${fx(st.a, 3)}$, B at $${fx(st.b, 3)}$: A serves the customers up to $${fx(st.x, 3)}$ (a share $${fx(st.x, 3)}$), B the rest ($${fx(1 - st.x, 3)}$). A's profit-maximizing location given B is $${fx(st.best.x, 3)}$, right next to B: each seller gains by stepping towards the other, and the standoff is at the centre.` : `A at $${fx(st.a, 3)}$, B at $${fx(st.b, 3)}$: prices $${fx(st.pA, 3)}$ and $${fx(st.pB, 3)}$, A serves up to $${fx(st.x, 3)}$ and earns $${fx(st.payoff, 4)}$ (formula $t(b-a)(2+a+b)^2/18$); B earns $${fx(st.profB, 4)}$. A's best location given B is $${fx(st.best.x, 3)}$ (the left end): proximity is penalized by price competition.`);
      },
    },
  ],
};
