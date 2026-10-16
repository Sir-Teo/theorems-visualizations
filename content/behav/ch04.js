// Behavioural Economics — Chapter 4: Mental accounting (items 4.1–4.4; 4.5–4.7 in ch04-b.js)
//
// Sources checked (Oct 2026):
// - Kahneman & Tversky 1984 (American Psychologist 39: 341–350), read in the scanned PDF with text layer:
//   Problem 7 (jacket $125 and calculator $15, saving $5 at a branch 20 minutes away): 68% (N = 88) would go for the $15
//   calculator, 29% (N = 93) for the $125 calculator (prices interchanged); Problem 8 (lost $10 ticket, N = 200): 46% would
//   pay $10 again; Problem 9 (lost $10 bill, N = 183): 88% would still buy a ticket.
// - Thaler & Johnson 1990 (Management Science 36: 643–660), read in a full-text copy: Table 1 (Thaler 1985's four pairs of
//   scenarios, N = 87: 64/18/17, 75/16/8, 25/70/5, 29/72/6 percent for A / B / no difference) and Table 4 (Experiment 4).
// - Thaler 1985 (Marketing Science 4(3): 199–214), Thaler 1999 (J. Behavioral Decision Making 12(3): 183–206),
//   Shefrin & Thaler 1988 (Economic Inquiry 26(4): 609–643), Arkes & Blumer 1985 (OBHDP 35(1): 124–140): bibliographic
//   details confirmed in Crossref. Their content is described qualitatively from abstracts and secondary summaries.
// - Thaler 1980 (J. Economic Behavior & Organization 1: 39–60): the snowstorm/basketball-tickets example is quoted from
//   secondary sources citing p. 11; not read in the original.
// - Not verified: the marginal propensities to consume, the sunk-cost sensitivity and the lognormal value-of-the-play
//   distribution below are illustrative models (the last is fitted to the two observed shares), not estimates from data.
import { clamp, num, pct, usdC, usdR, vPT, wilson, errBar, lognormalFromTwo, hbars } from './ch04.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [4, 4] };

export default {
  collection: 'behav',
  chapter: 4,
  title: 'Mental accounting',
  summary: String.raw`People keep money in mental accounts labelled by source and purpose, which makes money less fungible than economics assumes. Thaler showed how prospect theory then tells us how to present gains and losses, why sunk costs feel binding, and why a lost ticket and lost cash are treated differently. Narrow bracketing — evaluating each choice on its own — is the same mechanism that makes people refuse attractive bets.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Concept', name: 'Mental accounting',
      statement: String.raw`**Mental accounting** is the set of cognitive operations people use to organize, evaluate and keep track of financial activity. Three features matter. (i) Money is **labelled** by source and purpose (salary, windfall, vacation fund, retirement) and **not fungible**: the propensity to spend a dollar depends on the account it sits in, whereas in standard theory a dollar is a dollar and only total wealth matters. (ii) Outcomes are **posted** to **topical accounts**: a cost is evaluated against the benefit it buys and the reference level of that account, not against the whole budget. (iii) Accounts are **balanced** periodically and a closed account at a loss hurts, which is why sunk costs bind (behav-4.3). A saving of \$5 is therefore judged relative to the price of the item it is attached to: in the 1984 calculator problem 68% (N = 88) would drive 20 minutes to save \$5 on a \$15 calculator but only 29% (N = 93) to save the same \$5 on a \$125 one.`,
      scope: String.raw`Mental accounts are a description of behaviour, not a single model; the strength of the effect depends on how salient the labels are. The propensities in the picture are illustrative.`,
      idea: String.raw`Accounts are a bookkeeping device that reduces the cost of thinking and of self-control: a rule such as "the vacation fund is for vacations" is easy to follow. The price is that the reference point and the value function of prospect theory (behav-2.1, behav-2.3) are applied account by account, so identical dollars are valued differently depending on where they sit, and a gain or loss is judged against the account's reference rather than total wealth. Shefrin and Thaler's behavioural life-cycle hypothesis builds this into saving: current income is tempting to spend, accumulated assets less so, and future income barely at all.`,
      caption: String.raw`**Drag the coin** onto a jar (or use the slider for the amount). The left panel shows what is spent out of the same sum when it lands in each jar, using made-up marginal propensities to consume (sliders); a fungible dollar would give three equal bars at the dashed level. The right panel is the calculator problem: drag the price along the curve and watch the \$5 saving shrink as a share of the price, the quantity that the topical account responds to (data from Kahneman and Tversky, 1984).`,
      deps: ['behav-2.1', 'behav-2.3'], refs: ['Kahneman ch. 32', 'W&K ch. 6'], tags: ['mental accounting', 'fungibility', 'framing'],
      see: ['behav-4.7', 'behav-2.9'],
      credit: 'Richard Thaler, 1980–1985; Kahneman & Tversky, 1984',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mental_accounting', doi: 'https://doi.org/10.1287/mksc.4.3.199' },
      viz(v) {
        const amt = v.slider('amount received (\\$)', 100, 5000, 1000, { step: 100, int: true });
        const m1 = v.slider('spent out of current income (share)', 0, 1, 0.75, { step: 0.01 });
        const m2 = v.slider('spent out of a windfall / savings jar', 0, 1, 0.4, { step: 0.01 });
        const m3 = v.slider('spent out of the retirement jar', 0, 1, 0.05, { step: 0.01 });
        const fung = v.slider('what a fungible dollar would do (share)', 0, 1, 0.3, { step: 0.01 });
        const A = v.stage({ x: [0, 3], y: [0, 3.2], axes: false, height: 330, title: 'the same money in three jars' });
        const B = v.stage({ x: [10, 500], y: [0, 40], axes: 'box', gutter: true, xlog: true, height: 330, xlabel: 'price of the calculator (dollars)', ylabel: 'saving as % of the price', title: 'topical account: \\$5 off, relative to what?', hover: false });
        const jars = [['current income', m1, 'blue'], ['windfall / savings', m2, 'gold'], ['retirement', m3, 'purple']];
        let jar = 0;
        const coin = A.handle(0.5, 2.85, { color: 'orange', r: 11, label: '$', constrain: (x, y) => [clamp(x, 0.15, 2.85), clamp(y, 2.55, 3.1)] });
        coin.onDrag = () => { jar = clamp(Math.floor(coin.x), 0, 2); };
        const pr = B.handle(15, 33.3, { color: 'orange', r: 8, constrain: (x) => [clamp(x, 10, 500), 500 / clamp(x, 10, 500)] });
        v.legend([['accent', 'spent'], ['faint', 'kept'], ['green', 'observed willingness to drive (1984 study)', { dot: true }]]);
        v.render(() => {
          const a = amt.value;
          if (!coin.dragging) coin.set(jar + 0.5, 2.85);
          jars.forEach(([name, m, col], i) => {
            const sel = i === jar, x0 = i + 0.14, x1 = i + 0.86, top = 2.1, bot = 0.45, hgt = top - bot;
            A.rect(x0, bot, x1, top, { fill: 'panel', fillAlpha: 1, color: sel ? 'orange' : 'faint', width: sel ? 2.8 : 1.4, radius: 10 });
            const spent = m.value * hgt;
            A.rect(x0 + 0.03, bot + 0.03, x1 - 0.03, bot + 0.03 + hgt - spent - 0.06 + 0.03, { fill: 'grid', fillAlpha: 0.7, stroke: false });
            A.rect(x0 + 0.03, top - spent + 0.03 - 0.03, x1 - 0.03, top - 0.03, { fill: 'accent', fillAlpha: 0.55, stroke: false });
            A.line(x0, top - fung.value * hgt, x1, top - fung.value * hgt, { ...GUIDE, width: 1.6 });
            A.text(name, i + 0.5, bot, { dy: 18, align: 'center', size: 12, weight: 700, color: sel ? 'orange' : 'ink' });
            A.text(usdC(a * m.value), i + 0.5, top - spent / 2 + 0.02, { align: 'center', size: 13, weight: 800, color: 'ink', plate: true });
            A.text('spent', i + 0.5, top - spent / 2 - 0.2, { align: 'center', size: 10, color: 'muted' });
          });
          A.text('standard theory: the same spending in every jar (dashed)', 1.5, 0.45, { dy: 36, align: 'center', size: 11, color: 'muted' });
          B.fn((p) => 500 / p, { color: 'blue', width: 2.4 });
          [[15, 0.68, 88], [125, 0.29, 93]].forEach(([p, sh, n]) => {
            B.dot(p, 500 / p, { r: 7, color: 'green' });
            B.text(`$${p} calculator: ${Math.round(sh * 100)}% go (N = ${n})`, p, 500 / p, p === 15 ? { dx: 12, dy: 4, size: 11, weight: 700, color: 'green', plate: true } : { dx: -12, dy: -14, align: 'right', size: 11, weight: 700, color: 'green', plate: true });
          });
          B.vline(pr.x, { ...GUIDE });
        });
        v.readout(() => {
          const a = amt.value, sp = jars.map(([, m]) => a * m.value);
          return `Out of ${usdR(a)}: spent ${usdR(sp[0])} from current income, ${usdR(sp[1])} from the windfall jar, ${usdR(sp[2])} from the retirement jar, against ${usdR(a * fung.value)} in each if money were fungible. Gap between the largest and smallest jar: **${usdR(Math.max(...sp) - Math.min(...sp))}**.\nA \\$5 saving on a ${usdR(pr.x)} calculator is **${(500 / pr.x).toFixed(1)}%** of the price (a comprehensive account would see the same \\$5 in both problems).`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Principle', name: 'Hedonic editing: segregate gains, integrate losses',
      statement: String.raw`Thaler's **hedonic editing** hypothesis says people combine or separate the outcomes of a transaction in the way that makes them feel best, as if maximizing the value-function total. With a value function $v$ that is concave for gains, convex for losses and steeper for losses than gains (behav-2.3), the rules are:
(i) **segregate gains**: $v(x)+v(y)>v(x+y)$ for $x,y>0$;
(ii) **integrate losses**: $v(-x)+v(-y)<v(-x-y)$ for $x,y>0$;
(iii) **cancel** a smaller loss against a larger gain, $v(x-y)>v(x)+v(-y)$ when $x>y$;
(iv) **silver lining**: keep a small gain apart from a much larger loss, $v(x)+v(-y)>v(x-y)$ when $x\ll y$.
Rules (i) and (ii) follow from concavity and convexity alone; (iii) and (iv) depend on loss aversion and on how flat the loss branch is. In Thaler's survey (N = 87), 64% judged a man who won \$50 and \$25 in two lotteries happier than one who won \$75 in one, and 75% judged a man who owed \$100 and \$50 in two tax letters more upset than one who owed \$150.`,
      scope: String.raw`A description of how people frame outcomes, not a law: Thaler and Johnson (1990) found that real choices after a prior outcome were not described by hedonic editing alone, and the silver-lining rule needs a loss branch flatter than the standard $\alpha=0.88$ estimate. The survey figures are for hypothetical judgements of happiness.`,
      idea: String.raw`Everything follows from the shape of the value function. Concave gains make two small gains worth more than their sum; convex losses make one big loss hurt less than two small ones; and the kink at zero makes mixed outcomes ambiguous: whether a small gain softens a large loss (silver lining) depends on how quickly the loss branch flattens out. The principle is the practical use of prospect theory (behav-2.3) and of the mental-account idea that the way an outcome is posted changes how it feels (behav-4.1).`,
      caption: String.raw`Pick one of Thaler's four scenarios, or "your own", and read the survey bars. The curve is the value function. Dots on it are the two events of Mr A (segregated) and the single event of Mr B; the gold ring is Mr A's two events integrated. Change the curvature $\alpha$ and loss aversion $\lambda$: with the median estimates three of the four survey majorities are predicted, and the silver-lining case switches on only when $\alpha$ is lowered below about 0.75.`,
      deps: ['behav-2.3', 'behav-4.1'], refs: ['W&K ch. 6'], tags: ['hedonic editing', 'value function', 'framing'],
      see: ['behav-2.7'],
      credit: 'Richard Thaler, 1985',
      links: { doi: 'https://doi.org/10.1287/mksc.4.3.199' },
      viz(v) {
        const SC = [
          { id: 'lot', label: 'two lotteries', A: [50, 25], B: [75], q: 'Who was happier?', who: 'happier', pc: [64, 18, 17], text: 'A: won \\$50 and \\$25 in two lotteries · B: won \\$75 in one' },
          { id: 'irs', label: 'two tax letters', A: [-100, -50], B: [-150], q: 'Who was more upset?', who: 'upset', pc: [75, 16, 8], text: 'A: owes \\$100 (IRS) and \\$50 (state) · B: owes \\$150' },
          { id: 'car', label: 'repair and a win', A: [-200, 25], B: [-175], q: 'Who was more upset?', who: 'upset', pc: [25, 70, 5], text: 'A: \\$200 repair, won \\$25 the same day · B: \\$175 repair' },
          { id: 'rug', label: 'win and a mishap', A: [100, -80], B: [20], q: 'Who was happier?', who: 'happier', pc: [29, 72, 6], text: 'A: won \\$100 and paid \\$80 for a rug · B: won \\$20' },
          { id: 'own', label: 'your own', A: null, B: null },
        ];
        const sel = v.select('scenario', SC.map((s) => ({ value: s.id, label: s.label })), 'lot');
        const al = v.slider('curvature $\\alpha$ of the value function', 0.3, 1, 0.88, { step: 0.01 });
        const lam = v.slider('loss aversion $\\lambda$', 1, 4, 2.25, { step: 0.05 });
        const x1 = v.slider('your own event 1 (\\$)', -200, 200, 40, { step: 5, int: true });
        const x2 = v.slider('your own event 2 (\\$)', -200, 200, 40, { step: 5, int: true });
        const A = v.stage({ x: [-210, 210], y: [-150, 100], axes: true, height: 340, weight: 1.4, title: 'the value function $v(x)$ (dollars of change)' });
        const Bst = v.stage({ x: [0, 100], y: [0, 4.2], axes: false, height: 340, title: 'what 87 respondents said (Thaler 1985)' });
        v.legend([['accent', 'Mr A, events separate', { dot: true }], ['gold', 'Mr A, events combined', { dot: true }], ['green', 'Mr B', { dot: true }]]);
        let st = {};
        const cur = () => SC.find((s) => s.id === sel.value);
        v.render(() => {
          const c = cur(), own = c.id === 'own', a = al.value, l = lam.value;
          x1.el.hidden = x2.el.hidden = !own;
          const Aev = own ? [x1.value, x2.value] : c.A, Bev = own ? [x1.value + x2.value] : c.B;
          const vf = (x) => vPT(x, a, l, a); // value in "dollars^alpha"
          A.setView([-210, 210], [vf(-210) - 15, vf(210) + 15]);
          A.fn(vf, { color: 'ink', width: 2.2, domain: [-210, 210] });
          const seg = Aev.reduce((s, e) => s + vf(e), 0), integ = vf(Aev[0] + Aev[1]), bval = vf(Bev[0]);
          Aev.forEach((e, i) => { A.dot(e, vf(e), { r: 7, color: 'accent' }); A.text(`${i ? 'A2' : 'A1'}`, e, vf(e), { dx: 10, dy: -10, size: 11, weight: 700, color: 'accent' }); });
          A.dot(Aev[0] + Aev[1], integ, { r: 8, color: 'gold', hollow: true, width: 2.4 });
          A.dot(Bev[0], bval, { r: 8, color: 'green' });
          A.text('B', Bev[0], bval, { dx: 10, dy: 12, size: 11, weight: 700, color: 'green' });
          A.hline(seg, { color: 'accent', width: 1, dash: [4, 4], alpha: 0.7 });
          A.text(`separate total ${v.fix(seg, 1)}`, 210, seg, { dx: -4, dy: -8, align: 'right', size: 11, color: 'accent', weight: 700 });
          st = { seg, integ, bval, c, own, Aev, Bev };
          // survey
          if (!own) {
            const rows = [{ label: 'Mr A', value: c.pc[0], color: 'accent' }, { label: 'Mr B', value: c.pc[1], color: 'green' }, { label: 'no difference', value: c.pc[2], color: 'muted' }];
            Bst.text(c.q, 50, 4.1, { align: 'center', size: 13, weight: 800, color: 'ink' });
            Bst.text(c.text.replace(/\\/g, ''), 50, 3.55, { align: 'center', size: 10.5, color: 'muted' });
            hbars(Bst, rows, { x0: 30, x1: 90, yTop: 3.1, rowH: 0.8, max: 100, size: 12, fmt: (x) => x + '%' });
          } else Bst.text('no survey for your own numbers', 50, 2, { align: 'center', size: 13, color: 'muted' });
        });
        v.readout(() => {
          const { seg, integ, bval, c, own, Aev, Bev } = st; if (!c) return '';
          const better = seg > bval + 1e-9 ? 'A' : seg < bval - 1e-9 ? 'B' : 'neither';
          const rule = Aev[0] * Aev[1] > 0 ? (Aev[0] > 0 ? 'segregate gains' : 'integrate losses') : 'mixed outcomes';
          const sepVsInt = seg > integ + 1e-9 ? 'separate beats combined' : 'combined beats separate';
          const pred = c.who === 'upset' ? (seg < bval - 1e-9 ? 'A' : seg > bval + 1e-9 ? 'B' : 'a tie') : (better === 'neither' ? 'a tie' : better);
          const maj = c.pc ? (c.pc[0] > c.pc[1] ? 'A' : 'B') : '';
          const sv = own ? '' : ` Survey majority: ${maj}; the value function predicts ${pred}${pred === maj ? ' (match)' : ' (no match with these parameters)'}.`;
          return `Total value for Mr A with events separate **${v.fix(seg, 1)}**, combined **${v.fix(integ, 1)}** (${sepVsInt}; ${rule}); Mr B **${v.fix(bval, 1)}**. The value function says ${c.who === 'upset' ? (seg < bval ? 'A is more upset' : seg > bval ? 'B is more upset' : 'a tie') : (seg > bval ? 'A is happier' : seg < bval ? 'B is happier' : 'a tie')}.` + sv;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Phenomenon', name: 'The sunk-cost fallacy',
      statement: String.raw`A cost already paid and not recoverable (a **sunk cost**) should not affect a forward-looking decision: only the future benefits and costs of each option matter (micro-7.13). The **sunk-cost fallacy** is the tendency to let it matter anyway, continuing an activity because of what has already been put in. In Thaler's 1980 example a family that paid \$40 for tickets to a basketball game 60 miles away goes in a snowstorm, while they say they would have stayed home had the tickets been free. Arkes and Blumer (1985) found that theatre-series subscribers who paid the full price attended more plays than those who got a discount, and that people given a choice between a \$100 and a \$50 ski trip tended to pick the trip they had paid more for even when they expected to enjoy it less.`,
      scope: String.raw`There are rational reasons for apparent sunk-cost behaviour (signalling, reputation, hidden information, or a price that proxies for quality). The fallacy is the case where none applies. The prediction of "no effect" assumes the ticket cannot be resold.`,
      idea: String.raw`Mental accounting (behav-4.1) posts the ticket's price to the account "this game". Skipping the game closes the account with the cost unmatched by any benefit, which is felt as a loss; going lets the cost be "used". With a free ticket there is no cost in the account and nothing to redeem. Formally, the person goes when the net enjoyment $N$ of the evening, after the snowstorm, satisfies $N+sP\ge0$, where $P$ is the price paid and $s\ge0$ measures how much of it is posted; a rational agent has $s=0$ and goes exactly when $N\ge 0$.`,
      caption: String.raw`Horizontal axis: how much you would enjoy the game on the night, net of the snowstorm hassle (negative means you would rather stay home). Vertical axis: what you paid. **Drag the dot** and change the sunk-cost weight $s$. The red triangle is the fallacy region: staying home is better, yet money already spent drags you out. A free ticket sits on the bottom axis, where both rules agree. The weight $s$ is an illustrative parameter, not an estimate.`,
      deps: ['behav-4.1', 'micro-7.13'], refs: ['Kahneman ch. 32'], tags: ['sunk cost', 'mental accounting', 'rationality'],
      see: ['behav-4.7'],
      credit: 'Thaler, 1980; Arkes & Blumer, 1985',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sunk_cost' },
      viz(v) {
        const s = v.slider('sunk-cost weight $s$ (0 = rational)', 0, 1, 0.5, { step: 0.01 });
        const S = v.stage({ x: [-300, 100], y: [0, 400], axes: 'box', gutter: true, height: 360, weight: 1.4, xlabel: 'net enjoyment of going tonight (dollars), after the snowstorm', ylabel: 'price paid for the ticket (dollars)', title: 'go or stay home?' });
        const h = S.handle(-120, 400, { color: 'orange', r: 10, label: 'you', labelPos: 'ne', constrain: { x: [-300, 100], y: [0, 400] } });
        v.legend([['green', 'go (rational and sunk-cost agree)'], ['red', 'go only because of the sunk cost'], ['grid', 'stay home (both)']]);
        v.render(() => {
          const sv = s.value;
          S.rect(-300, 0, 0, 400, { fill: 'grid', fillAlpha: 0.35, stroke: false });
          S.rect(0, 0, 100, 400, { fill: 'green', fillAlpha: 0.12, stroke: false });
          // the fallacy region: N < 0 and N + sP >= 0  -> between the line N = -sP and N = 0
          if (sv > 0) S.poly([[0, 0], [0, 400], [-sv * 400, 400]], { fill: 'red', fillAlpha: 0.2, color: 'red', width: 1.5 });
          S.line(0, 0, 0, 400, { color: 'ink', width: 2 });
          S.text('rational boundary: $N=0$', 0, 400, { dx: 6, dy: 14, size: 11, weight: 700 });
          if (sv > 0) S.text('the fallacy region', -sv * 100, 300, { dx: 0, size: 12, weight: 800, color: 'red', align: 'center', plate: true });
          S.line(h.x, 0, h.x, h.y, { color: 'orange', width: 1.2, dash: [4, 4] });
          S.dot(h.x, 0, { r: 6, color: 'gold', label: 'free ticket', labelPos: 'n' });
        });
        v.readout(() => {
          const N = h.x, P = h.y, sv = s.value, rational = N >= 0, paid = N + sv * P >= 0, free = N >= 0;
          const verdict = (ok) => (ok ? 'go' : 'stay home');
          return `Net enjoyment ${usdR(N)}, price paid ${usdR(P)}. Rational rule (ignore the price): **${verdict(rational)}**. With sunk-cost weight ${sv.toFixed(2)} and the ticket bought: **${verdict(paid)}**; with a free ticket: **${verdict(free)}**. ${paid && !rational ? 'This is the fallacy: you go and lose ' + usdR(-N) + ' of enjoyment because ' + usdR(P) + ' was already spent.' : rational === paid ? 'Both rules agree here.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Phenomenon', name: 'Lost ticket versus lost cash',
      statement: String.raw`Kahneman and Tversky (1984) gave two groups a play-going story that differs only in what is lost on the way. Problem 8 ($N=200$): you paid \$10 for a ticket and lose it before entering; **46%** would pay \$10 for another. Problem 9 ($N=183$): you are about to buy a \$10 ticket and lose a \$10 bill; **88%** would still buy it. Wealth has fallen by \$10 in both cases and the choice, a play for \$10 given that you are \$10 poorer, is the same, so standard theory predicts the same share. The authors attribute the gap to the topical organization of mental accounts: the ticket's cost is posted to the account of the play, doubling its price to \$20, whereas the bill is a loss to general wealth.`,
      scope: String.raw`Hypothetical questions answered by two separate groups. Replications and variants (a lost voucher, a cheaper ticket) generally find the gap but with different sizes; the explanation by "posting to the play account" is an interpretation rather than a test.`,
      idea: String.raw`Treat each person as having a value $V$ for the evening and buying if $V$ exceeds the cost perceived by their account (behav-4.1). With the bill lost, the perceived price of the play is \$10; with the ticket lost, the earlier \$10 is added to it and the play is "costing \$20". If the shares who accept a price of \$10 and \$20 are 88% and 46%, then a lognormal distribution of $V$ fitted to those two numbers describes everyone in between, including what happens when only part of the loss is posted to the play account.`,
      caption: String.raw`Left: the two observed shares, with 95% Wilson intervals. Right: a lognormal "value of the evening" distribution **fitted to those two shares** (a reconstruction, not data); the curve is the share who would buy at each perceived price. Slide the fraction of the lost \$10 that you post to the play account from 0 (the bill) to 1 (the ticket). Answer the two questions at the bottom to see where you fall.`,
      deps: ['behav-4.1'], refs: ['W&K ch. 6'], tags: ['mental accounting', 'topical account', 'framing'],
      see: ['behav-3.3', 'behav-4.3'],
      credit: 'Kahneman & Tversky, 1984',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mental_accounting' },
      viz(v) {
        const M = v.M;
        const { mu, sigma } = lognormalFromTwo(M, 10, 0.88, 20, 0.46);
        const N = M.dist.normal(0, 1);
        const share = (p) => 1 - N.cdf((Math.log(p) - mu) / sigma);
        const post = v.slider('share of the lost \\$10 posted to the play account', 0, 1, 1, { step: 0.01 });
        const q1 = v.select('you lost the ticket: pay \\$10 for another?', [{ value: '-', label: '—' }, { value: 'y', label: 'yes' }, { value: 'n', label: 'no' }], '-');
        const q2 = v.select('you lost a \\$10 bill: still buy a ticket?', [{ value: '-', label: '—' }, { value: 'y', label: 'yes' }, { value: 'n', label: 'no' }], '-');
        const A = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', gutter: true, height: 320, ylabel: 'share who would (still) buy', xlabel: '', title: 'Kahneman & Tversky (1984)', xticks: [], yticks: [[0, '0%'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']] });
        const B = v.stage({ x: [4, 40], y: [0, 1], axes: 'box', gutter: true, height: 320, weight: 1.3, xlabel: 'perceived price of the evening (dollars)', ylabel: 'share who would buy', title: 'reconstruction: distribution of the value of the evening', yticks: [[0, '0%'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']] });
        v.legend([['green', 'lost a $10 bill (N = 183)', { dot: true }], ['red', 'lost the ticket (N = 200)', { dot: true }], ['blue', 'fitted lognormal (illustrative)']]);
        const data = [[1, 0.88, 183, 'green', 'bill'], [2, 0.46, 200, 'red', 'ticket']];
        v.render(() => {
          data.forEach(([x, p, n, col, nm]) => {
            A.rect(x - 0.4, 0, x + 0.4, p, { fill: col, fillAlpha: 0.5, color: col, width: 1.4 });
            const [lo, hi] = wilson(Math.round(p * n), n);
            errBar(A, x, lo, hi, { color: 'ink', cap: 0.08 });
            A.text(`${Math.round(p * 100)}%`, x, p, { dy: -30, dx: 0, align: 'center', size: 13, weight: 800, color: col });
            A.text(`lost ${nm}`, x, 0, { dy: -16, align: 'center', size: 11.5, weight: 700, color: 'ink', plate: true });
          });
          B.fn(share, { color: 'blue', width: 2.4, domain: [4, 40] });
          [[10, 'green'], [20, 'red']].forEach(([p, col]) => { B.vline(p, { color: col, width: 1, dash: [4, 4] }); B.dot(p, share(p), { r: 7, color: col }); });
          const eff = 10 + 10 * post.value;
          B.dot(eff, share(eff), { r: 10, color: 'orange', hollow: true, width: 2.6, label: `${Math.round(100 * share(eff))}%`, labelPos: 'ne' });
          B.text(`median value ≈ $${Math.exp(mu).toFixed(0)}`, 40, 0.9, { align: 'right', dx: -6, size: 11, color: 'muted' });
        });
        v.readout(() => {
          const eff = 10 + 10 * post.value, you = (a, b) => (a === '-' ? '' : b);
          return `Perceived price ${usdR(eff)} gives a predicted buying share of **${pct(share(eff))}**. A fungible-money decision maker has the same share in both problems; the observed gap is **${(88 - 46)}** points. The fit has median value ${usdR(Math.exp(mu))} and log-sd ${sigma.toFixed(2)}.` + (q1.value === '-' || q2.value === '-' ? '' : ` You answered ${q1.value === q2.value ? 'the same in both problems (fungible money)' : 'differently in the two problems (like most respondents)'}.`);
        });
      },
    },
  ],
};
