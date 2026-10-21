// Behavioural Economics — Chapter 1, part b: items 1.9–1.16 (dominance, Savage, Allais, common ratio, Ellsberg, maxmin, the two papers).
//
// Sources checked: Allais 1953 (Econometrica 21: 503–546) examples as quoted by Andreoni & Sprenger ("Certain and uncertain
// utility: the Allais paradox and five decision theory phenomena"): A = 100 million francs for sure; B = 10% of 500 million,
// 89% of 100 million, 1% nothing; C = 11% of 100 million; D = 10% of 500 million; second example 100 million for sure against 98%
// of 500 million, and 1% of 100 million against 0.98% of 500 million; Savage chose A and D (Savage 1954, p. 103).
// Kahneman & Tversky 1979 Problems 1–4 (82%, 83%, 80%, 65%; see ch02-papers.js). Blavatskyy, Ortmann & Panchenko 2022
// (AEJ: Micro 14: 143–163): 81 experiments in 29 studies; the common-consequence effect is fragile, most likely with large
// hypothetical payoffs. Ellsberg 1961 (QJE 75: 643–669): 90 balls, 30 red, 60 black and yellow in unknown proportion, $100 bets.
// Bernoulli 1738, Sommer's translation (Econometrica 22, 1954): §15 Caius (10,000 rubles of goods, 5 ships in 100 lost, premium
// 800: insure below a fortune of 5,043; insurer needs 14,243; at 600: 20,478 and 29,878), §16 Sempronius (4,000 + 8,000 ducats,
// one ship in ten lost: 6,751 with one ship, 7,033 with two, never above 7,200), §19 Paul's game (2, ≈3, ≈4, ≈6 ducats);
// all recomputed below.
import { clamp, money, bernValue, bernPrice, makePref, intoTri, indiffThrough, drawIndiff, drawTriangle } from './ch01.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [4, 4] };

/** A clickable choice card on a stage: r = [x0, y0, x1, y1] in data units; segs = [[prob, colour, label], …] for a stacked probability bar. */
function card(s, r, { tag, lines = [], segs, chosen = false, dim = false, sub }) {
  const [x0, y0, x1, y1] = r;
  s.rect(x0, y0, x1, y1, { fill: chosen ? 'accent' : 'panel', fillAlpha: chosen ? 0.13 : 1, color: chosen ? 'accent' : 'faint', width: chosen ? 2.6 : 1.2, radius: 9 });
  s.text(tag, x0, y1, { dx: 12, dy: 17, size: 17, weight: 800, color: chosen ? 'accent' : dim ? 'faint' : 'muted' });
  lines.forEach((t, i) => s.text(t, x0, y1, { dx: 40, dy: 15 + 17 * i, size: 12.5, weight: 500, color: dim ? 'muted' : 'ink' }));
  if (sub && segs) s.text(sub, x1, y1, { dx: -10, dy: 15, size: 11, align: 'right', color: chosen ? 'accent' : 'muted', weight: 600 });
  else if (sub) s.text(sub, x0, y0, { dx: 40, dy: -12, size: 11, color: chosen ? 'accent' : 'muted', weight: 600 });
  if (segs) {
    const bx0 = s.X(x0) + 12, bx1 = s.X(x1) - 12, by = s.Y(y0) - 16;
    let acc = 0;
    for (const [p, col, lab] of segs) {
      if (p <= 0) continue;
      const a = bx0 + (bx1 - bx0) * acc, b = bx0 + (bx1 - bx0) * (acc + p);
      const [xa] = s.inv(a, 0), [xb] = s.inv(b, 0), [, ya] = s.inv(0, by - 7), [, yb] = s.inv(0, by + 7);
      s.rect(xa, ya, xb, yb, { fill: col, fillAlpha: 0.75, color: 'panel', width: 1 });
      if (b - a > 34 && lab) s.text(lab, (xa + xb) / 2, (ya + yb) / 2, { align: 'center', size: 10.5, weight: 700, color: 'ink', halo: false });
      acc += p;
    }
  }
}
const inside = (r, x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
const PRIZE = { 0: 'faint', 100: 'teal', 500: 'purple' };

export default {
  collection: 'behav',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9', kind: 'Definition', name: 'First- and second-order stochastic dominance',
      statement: String.raw`Let lotteries $A$ and $B$ have cumulative distribution functions $F_A$ and $F_B$ on an interval $[a,b]$.
(a) $A$ **first-order stochastically dominates** $B$ if $F_A(x)\le F_B(x)$ for every $x$: at every threshold, $A$ is at least as likely to pay more than $x$. Equivalently, $E\,u(A)\ge E\,u(B)$ for **every increasing** $u$.
(b) $A$ **second-order stochastically dominates** $B$ if $\int_a^xF_A(t)\,dt\le\int_a^xF_B(t)\,dt$ for every $x$. Equivalently, $E\,u(A)\ge E\,u(B)$ for every **increasing concave** $u$: every risk-averse expected-utility maximizer prefers $A$. When the means are equal this says that $B$ is a **mean-preserving spread** of $A$ (Rothschild–Stiglitz): $B$ is riskier than $A$ in the strongest sense compatible with equal means.

First-order dominance implies second-order dominance; the CDFs of a pair related only by second-order dominance cross, and those of an unranked pair have integrals that cross too.`,
      idea: String.raw`Integrating by parts, $E\,u(A)-E\,u(B)=\int_a^b u'(x)\,[F_B(x)-F_A(x)]\,dx$, which is non-negative for all increasing $u$ exactly when $F_B-F_A\ge0$ everywhere (test with step utilities). Integrating once more, $=u'(b)\!\int_a^b(F_B-F_A)-\int_a^b u''(x)\Big[\int_a^x(F_B-F_A)\Big]dx$, so a concave $u$ ($u''\le0$) prefers $A$ whenever every partial integral of $F_B-F_A$ is non-negative. Jensen's inequality (behav-1.4) is the special case of a sure amount against a lottery with the same mean. Dominance lets one rank lotteries knowing only the sign of $u'$ or $u''$, without a utility function. For the second integration, set $H(x)=\int_a^x(F_B-F_A)(t)\,dt$. With continuous CDFs and $u\in C^2$, integration by parts (pma-6.22), applied to $u'$ and $H$, gives $\int_a^b u'H'=u'(b)H(b)-\int_a^b u''H$, since $H(a)=0$. Thus $u'\ge0$, $u''\le0$ and $H\ge0$ make both terms nonnegative. For the finite lotteries pictured, apply the same formula separately between the finitely many atom locations; $H$ and $u'$ are continuous there, so intermediate boundary terms cancel. This smooth-utility calculation supplies the sign argument, rather than assuming that a step CDF is differentiable at its atoms.`,
      caption: String.raw`Drag the four equally likely outcomes of lottery $A$ (blue, top row) and of $B$ (orange), or load an example. Middle left: the two CDFs, shaded green where $A$'s lies below (good for $A$) and red where it lies above. Middle right: their running integrals, shaded the same way. Right: $E\,u(A)-E\,u(B)$ for nine utilities, from strongly convex (risk loving) through linear to strongly concave (risk averse). First-order dominance turns every bar green; a mean-preserving spread turns the linear bar to zero and the concave ones green; with no dominance some concave utility prefers each lottery.`,
      deps: ['behav-1.4', 'micro-13.1', 'pma-6.22'], refs: ['W&K ch. 5'], tags: ['risk', 'dominance', 'expected utility'],
      see: ['phil-5.2'],
      credit: 'Hadar & Russell, 1969; Hanoch & Levy, 1969; Rothschild & Stiglitz, 1970',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stochastic_dominance' },
      viz(v) {
        const PRE = { fosd: [[30, 50, 70, 90], [20, 40, 60, 80]], sosd: [[40, 45, 55, 60], [20, 35, 65, 80]], neither: [[10, 55, 70, 85], [35, 45, 55, 65]] };
        const pre = v.select('example', [{ value: 'fosd', label: 'first-order' }, { value: 'sosd', label: 'mean-preserving spread' }, { value: 'neither', label: 'neither' }], 'fosd',
          { onChange: (k) => { PRE[k][0].forEach((x, i) => hA[i].set(x, 1)); PRE[k][1].forEach((x, i) => hB[i].set(x, 0)); } });
        const top = v.stage({ x: [-6, 102], y: [-0.5, 1.55], axes: false, height: 118, full: true, title: 'four equally likely outcomes each (drag them)' });
        const cs = v.stage({ x: [-10, 100], y: [-0.1, 1.06], axes: 'box', height: 290, xlabel: 'outcome x', ylabel: 'F(x)', title: 'CDFs' });
        const is = v.stage({ x: [-10, 100], y: [-5, 60], axes: 'box', height: 290, xlabel: 'outcome x', ylabel: '∫₀ˣ F', title: 'integrated CDFs' });
        const us = v.stage({ x: [-0.7, 8.7], y: [-1.25, 1.25], axes: false, height: 290, weight: 0.85, title: 'E u(A) − E u(B)' });
        const hA = PRE.fosd[0].map((x) => top.handle(x, 1, { color: 'blue', r: 8, constrain: (x2) => [clamp(x2, 0, 100), 1] }));
        const hB = PRE.fosd[1].map((x) => top.handle(x, 0, { color: 'orange', r: 8, constrain: (x2) => [clamp(x2, 0, 100), 0] }));
        const CS = [-6, -3, -1.5, 0, 1.5, 3, 6, 12, 24];
        const uc = (c) => (Math.abs(c) < 1e-9 ? (x) => x / 100 : (x) => (1 - Math.exp((-c * x) / 100)) / (1 - Math.exp(-c)));
        v.legend([['blue', 'lottery A'], ['orange', 'lottery B'], ['green', 'A ahead', { area: true }], ['red', 'B ahead', { area: true }]]);
        let st = {};
        v.render(() => {
          void pre;
          const A = hA.map((h) => h.x), B = hB.map((h) => h.x);
          const F = (xs, x) => xs.filter((a) => a <= x).length / 4, I = (xs, x) => xs.reduce((s, a) => s + Math.max(0, x - a), 0) / 4;
          // top strip
          top.line(0, 1, 100, 1, { color: 'faint', width: 2 }); top.line(0, 0, 100, 0, { color: 'faint', width: 2 });
          for (const t of [0, 25, 50, 75, 100]) { top.line(t, -0.12, t, 0, { color: 'faint', width: 1 }); top.text(String(t), t, -0.12, { dy: 9, align: 'center', size: 10, color: 'muted' }); }
          top.text('A', -2.5, 1, { align: 'right', size: 14, weight: 800, color: 'blue' }); top.text('B', -2.5, 0, { align: 'right', size: 14, weight: 800, color: 'orange' });
          const mA = A.reduce((s, x) => s + x, 0) / 4, mB = B.reduce((s, x) => s + x, 0) / 4;
          top.line(mA, 1.3, mA, 1.12, { color: 'blue', width: 2 }); top.text(`mean ${v.fix(mA, 1)}`, mA, 1.38, { align: 'center', size: 10.5, color: 'blue', weight: 600 });
          top.line(mB, 0.12, mB, 0.3, { color: 'orange', width: 2 }); top.text(`mean ${v.fix(mB, 1)}`, mB, 0.38, { align: 'center', size: 10.5, color: 'orange', weight: 600 });
          // CDF panel with shading
          const N = 400; let fosdAB = true, fosdBA = true, sosdAB = true, sosdBA = true, strict = false;
          for (let i = 0; i < N; i++) {
            const x0 = (100 * i) / N, x1 = (100 * (i + 1)) / N, xm = (x0 + x1) / 2, fa = F(A, xm), fb = F(B, xm);
            if (fa > fb + 1e-12) { fosdAB = false; cs.rect(x0, fb, x1, fa, { fill: 'red', fillAlpha: 0.22, stroke: false }); }
            else if (fb > fa + 1e-12) { fosdBA = false; strict = true; cs.rect(x0, fa, x1, fb, { fill: 'green', fillAlpha: 0.22, stroke: false }); }
            const ia = I(A, xm), ib = I(B, xm);
            if (ia > ib + 1e-9) { sosdAB = false; is.rect(x0, ib, x1, ia, { fill: 'red', fillAlpha: 0.22, stroke: false }); }
            else if (ib > ia + 1e-9) { sosdBA = false; is.rect(x0, ia, x1, ib, { fill: 'green', fillAlpha: 0.22, stroke: false }); }
          }
          const step = (xs) => { const s = xs.slice().sort((p, q) => p - q), pts = [[0, 0]]; s.forEach((x, i) => { pts.push([x, i / 4], [x, (i + 1) / 4]); }); pts.push([100, 1]); return pts; };
          cs.path(step(B), { color: 'orange', width: 2.4 }); cs.path(step(A), { color: 'blue', width: 2.4, dash: [7, 3] });
          const imax = Math.max(I(A, 100), I(B, 100)) * 1.08; is.setView([-10, 100], [-0.09 * imax, imax]);
          is.fn((x) => I(B, x), { color: 'orange', width: 2.4, domain: [0, 100] }); is.fn((x) => I(A, x), { color: 'blue', width: 2.4, dash: [7, 3], domain: [0, 100] });
          // utility test
          let pos = 0, neg = 0, conc = true;
          const d = CS.map((c) => { const u = uc(c); return (A.reduce((s, x) => s + u(x), 0) - B.reduce((s, x) => s + u(x), 0)) / 4; });
          const sc = Math.max(0.02, ...d.map(Math.abs));
          us.hline(0, { color: 'muted', width: 1 });
          d.forEach((x, i) => {
            const col = x > 1e-9 ? 'green' : x < -1e-9 ? 'red' : 'muted';
            if (x > 1e-9) pos++; else if (x < -1e-9) { neg++; if (CS[i] > 0) conc = false; }
            us.rect(i - 0.32, 0, i + 0.32, x / sc, { fill: col, fillAlpha: 0.7, stroke: false });
          });
          us.text('convex', 1, -1.2, { align: 'center', size: 10.5, color: 'muted' }); us.text('linear', 3, -1.2, { align: 'center', size: 10.5, color: 'muted' }); us.text('concave →', 6, -1.2, { align: 'center', size: 10.5, color: 'muted' });
          us.line(2.5, -1.05, 2.5, 1.05, GUIDE); us.line(3.5, -1.05, 3.5, 1.05, GUIDE);
          st = { fosd: fosdAB && strict, fosdBA: fosdBA && !fosdAB, sosd: sosdAB && !sosdBA, sosdBA: sosdBA && !sosdAB, mA, mB, pos, neg, conc, d };
        });
        v.readout(() => {
          const { fosd, sosd, mA, mB, pos, neg, d } = st; if (mA == null) return '';
          let verdict;
          if (fosd) verdict = `$F_A \\le F_B$ everywhere: **A first-order dominates B**, and all nine utilities prefer A (${pos} green bars).`;
          else if (sosd) verdict = `The CDFs cross but every running integral favours A: **A second-order dominates B**${Math.abs(mA - mB) < 0.05 ? ', and with equal means B is a mean-preserving spread of A' : ''}. Every concave utility prefers A; ${neg ? 'some convex (risk-loving) ones prefer B' : 'here the convex ones happen to agree'}.`;
          else if (st.fosdBA) verdict = '**B first-order dominates A**: every increasing utility prefers B.';
          else if (st.sosdBA) verdict = '**B second-order dominates A**: every concave utility prefers B.';
          else verdict = `**No dominance either way**: the running integrals cross, so some concave utilities prefer A and others B (${pos} bars favour A, ${neg} favour B).`;
          return `Means: A ${v.fix(mA, 1)}, B ${v.fix(mB, 1)}. ${verdict} Linear utility (expected value): ${d[3] >= 0 ? '+' : '−'}${v.fix(Math.abs(d[3] * 100), 2)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10', kind: 'Definition', name: 'Subjective expected utility (Savage)',
      statement: String.raw`Savage's framework has a set $S$ of **states** of the world (exactly one obtains, and nobody gives their probabilities), a set of **consequences**, and **acts** $f:S\to$ consequences, such as bets on events. A preference over acts satisfying Savage's postulates — a weak order (P1), the **sure-thing principle** (P2: the ranking of two acts does not depend on states where they agree), state-independent tastes (P3, P4), non-triviality (P5), a continuity condition (P6) and dominance (P7) — is represented by **subjective expected utility**: there are a unique finitely additive probability $\mu$ on $S$ and a utility $u$, unique up to $a+bu$ with $b>0$, such that
$$f\succsim g\iff\int_Su\big(f(s)\big)\,d\mu(s)\ \ge\ \int_Su\big(g(s)\big)\,d\mu(s).$$
Probabilities are not assumed but **revealed by betting**: event $E$ is more likely than $F$ when you prefer a prize on $E$ to the same prize on $F$, and $\mu(E)$ is the chance $q$ at which you are indifferent between a prize on $E$ and the same prize with known probability $q$.`,
      idea: String.raw`Savage combined von Neumann and Morgenstern's utility (behav-1.3) with de Finetti's and Ramsey's idea that degrees of belief show up in betting. P2 and P4 let one compare events by comparing bets on them, P6 makes that comparative likelihood fine enough to be measured by a number, and the result is a probability: additive because a coherent bettor must avoid a **Dutch book**, a set of bets she accepts at her own prices that loses money in every state. With beliefs fixed, the vNM construction then supplies $u$. Bayes' theorem (stat-10.1) becomes the rule for updating $\mu$. The theory's weak point is its claim that all uncertainty can be reduced to a single probability, which Ellsberg tested (behav-1.13).`,
      caption: String.raw`The states are tomorrow's noon temperature where you are: $A$ below 10 °C, $B$ 10–20 °C, $C$ above 20 °C. For each event set the chance $q$ at which you would be indifferent between a $\$100$ ticket on that event and a $\$100$ lottery with known probability $q$; under subjective expected utility these are your probabilities. The bars lay them end to end against the unit interval, and compare your number for "A or B" with $A$ plus $B$. If they are not additive the table builds the bookie's Dutch book at your own prices (buy means you pay $100q$ for the ticket, sell means you receive it) and shows your net payoff in each state: a sure loss. **make them additive** fixes the numbers.`,
      deps: ['behav-1.3', 'stat-10.1'], refs: ['W&K ch. 5'], tags: ['subjective probability', 'expected utility', 'uncertainty'],
      see: ['phil-5.1', 'behav-1.13'],
      credit: 'Savage, 1954; Ramsey, 1926; de Finetti, 1937',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Subjective_expected_utility' },
      viz(v) {
        const qA = v.slider('$q(A)$: below 10 °C', 0, 1, 0.3, { step: 0.01 });
        const qB = v.slider('$q(B)$: 10–20 °C', 0, 1, 0.45, { step: 0.01 });
        const qC = v.slider('$q(C)$: above 20 °C', 0, 1, 0.35, { step: 0.01 });
        const qAB = v.slider('$q(A \\text{ or } B)$: below 20 °C', 0, 1, 0.7, { step: 0.01 });
        v.button('make them additive', () => { const s = qA.value + qB.value + qC.value || 1; qA.set(+(qA.value / s).toFixed(4)); qB.set(+(qB.value / s).toFixed(4)); qC.set(+(1 - qA.value - qB.value).toFixed(4)); qAB.set(+(qA.value + qB.value).toFixed(4)); });
        const bar = v.stage({ x: [-0.08, 1.42], y: [0, 2.2], axes: false, height: 175, full: true, title: 'your matching probabilities, laid end to end' });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 250, full: true, title: 'the bookie’s bets at your prices ($100 tickets): your net payoff in each state' });
        const T = v.table(tb, { rows: 5, cols: 4, square: false, cellAspect: 3.4, maxCell: 40, size: 13, rowLabels: ['ticket on A', 'ticket on B', 'ticket on C', 'ticket on A or B', 'total'], colLabels: ['your position', 'if A', 'if B', 'if C'], cornerLabel: '' });
        const COL = { A: 'blue', B: 'teal', C: 'orange' };
        let st = {};
        v.render(() => {
          const q = { A: qA.value, B: qB.value, C: qC.value, AB: qAB.value }, s = q.A + q.B + q.C, dAB = q.AB - q.A - q.B;
          // laid end to end
          bar.line(0, 1.45, 1, 1.45, { color: 'ink', width: 1 }); bar.line(0, 1.3, 0, 1.6, { color: 'ink', width: 1.4 }); bar.line(1, 1.3, 1, 1.6, { color: 'ink', width: 1.4 });
          bar.text('0', 0, 1.3, { dy: 8, align: 'center', size: 10.5, color: 'muted' }); bar.text('1', 1, 1.3, { dy: 8, align: 'center', size: 10.5, color: 'muted' });
          let x = 0;
          for (const e of ['A', 'B', 'C']) { bar.rect(x, 1.62, x + q[e], 1.98, { fill: COL[e], fillAlpha: 0.6, color: 'panel', width: 1.5 }); if (q[e] > 0.05) bar.text(`${e}: ${v.fix(q[e], 2)}`, x + q[e] / 2, 1.8, { align: 'center', size: 11.5, weight: 700, halo: false }); x += q[e]; }
          if (s > 1.0005) { bar.rect(1, 1.6, s, 2.0, { color: 'red', width: 2, hatch: 'red', fill: 'red', fillAlpha: 0.08 }); bar.text(`sum ${v.fix(s, 2)} > 1`, s, 1.8, { dx: 8, size: 12, weight: 700, color: 'red' }); }
          else if (s < 0.9995) { bar.rect(s, 1.6, 1, 2.0, { color: 'red', width: 2, dash: [4, 3] }); bar.text(`sum ${v.fix(s, 2)} < 1`, 1, 1.8, { dx: 8, size: 12, weight: 700, color: 'red' }); }
          else bar.text('sum = 1 ✓', 1, 1.8, { dx: 8, size: 12, weight: 700, color: 'green' });
          // A or B against A + B
          bar.rect(0, 0.75, q.A, 1.05, { fill: COL.A, fillAlpha: 0.6, color: 'panel', width: 1.5 }); bar.rect(q.A, 0.75, q.A + q.B, 1.05, { fill: COL.B, fillAlpha: 0.6, color: 'panel', width: 1.5 });
          bar.rect(0, 0.3, q.AB, 0.6, { fill: 'purple', fillAlpha: 0.55, color: 'panel', width: 1.5 });
          bar.text('A + B', 0, 0.9, { dx: -6, align: 'right', size: 11.5, weight: 600 }); bar.text('A or B', 0, 0.45, { dx: -6, align: 'right', size: 11.5, weight: 600 });
          const okU = Math.abs(dAB) < 0.0005;
          bar.text(okU ? `q(A or B) = q(A) + q(B) = ${v.fix(q.AB, 2)} ✓` : `q(A or B) = ${v.fix(q.AB, 2)} ≠ q(A) + q(B) = ${v.fix(q.A + q.B, 2)}`, Math.max(q.AB, q.A + q.B), 0.67, { dx: 12, size: 12, weight: 700, color: okU ? 'green' : 'red' });
          // the Dutch book: positions x_E (+ buy, − sell)
          const sg = (d) => (Math.abs(d) < 0.0005 ? 0 : Math.sign(d));
          const s1 = sg(s - 1), s2 = sg(dAB);
          const pos = { A: s1 - s2, B: s1 - s2, C: s1, AB: s2 };
          const ev = { A: ['A'], B: ['B'], C: ['C'], AB: ['A', 'B'] }, keys = ['A', 'B', 'C', 'AB'];
          const cash = (e, state) => pos[e] * (100 * (ev[e].includes(state) ? 1 : 0) - 100 * q[e]);
          const tot = ['A', 'B', 'C'].map((state) => keys.reduce((acc, e) => acc + cash(e, state), 0));
          const posTxt = (n, e) => (n === 0 ? '—' : `${n > 0 ? 'buy' : 'sell'} ${Math.abs(n)} at $${v.fix(100 * q[e], 0)}`);
          T.draw({
            value: (i, j) => {
              if (i < 4) { const e = keys[i]; if (j === 0) return posTxt(pos[e], e); return pos[e] === 0 ? '0' : (cash(e, ['A', 'B', 'C'][j - 1]) >= 0 ? '+' : '−') + v.fix(Math.abs(cash(e, ['A', 'B', 'C'][j - 1])), 0); }
              if (j === 0) return s1 || s2 ? 'sure loss' : 'no book';
              const t = tot[j - 1]; return (t > 0.4 ? '+' : t < -0.4 ? '−' : '') + v.fix(Math.abs(t), 0);
            },
            fill: (i, j) => (i === 4 && j > 0 ? (tot[j - 1] < -0.4 ? ['red', 0.3] : ['green', 0.18]) : i === 4 ? ['grid', 0.6] : null),
            weight: (i) => (i === 4 ? 800 : 500), colWeights: [1.6, 1, 1, 1],
          });
          st = { q, s, dAB, tot, booked: s1 !== 0 || s2 !== 0 };
        });
        v.readout(() => {
          const { q, s, dAB, tot, booked } = st; if (!q) return '';
          if (!booked) return `Your numbers are additive: $\\mu(A)=${v.fix(q.A, 2)}$, $\\mu(B)=${v.fix(q.B, 2)}$, $\\mu(C)=${v.fix(q.C, 2)}$. No combination of bets at these prices loses in every state, and a Savage decision maker with these beliefs ranks every bet on the weather by its subjective expected utility, e.g. $\\$100$ if $A$ or $B$ is worth exactly a $\\$100$ lottery with probability ${v.fix(q.AB, 2)}.`;
          const why = [];
          if (Math.abs(s - 1) >= 0.0005) why.push(`your three probabilities sum to ${v.fix(s, 2)}`);
          if (Math.abs(dAB) >= 0.0005) why.push(`$q(A\\text{ or }B)$ differs from $q(A)+q(B)$ by ${v.fix(dAB, 2)}`);
          return `**Dutch book**: ${why.join(' and ')}. Accepting the bookie's trades, each fair by your own numbers, you end with ${tot.map((t) => '$' + (t < 0 ? '-' : '') + '\\$' + v.fix(Math.abs(t), 0) + '$').join(', ')} if $A$, $B$, $C$ happens: a sure loss. Savage's postulates rule this out, which is why subjective probabilities must be additive.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11', kind: 'Paradox', name: 'The Allais paradox',
      statement: String.raw`Allais (1953) proposed two choices with prizes in millions of (old) French francs:
- **Choice 1.** $A$: 100 million for sure. $B$: 500 million with probability 0.10, 100 million with 0.89, nothing with 0.01.
- **Choice 2.** $C$: 100 million with probability 0.11, nothing with 0.89. $D$: 500 million with probability 0.10, nothing with 0.90.

Many people choose $A$ and $D$. No expected-utility maximizer can: with $u(0)=0$,
$$EU(A)-EU(B)=0.11\,u(100)-0.10\,u(500)=EU(C)-EU(D),$$
so whatever the utility, $A\succ B$ exactly when $C\succ D$. The two pairs differ only in a **common consequence**, an 0.89 chance of 100 million in choice 1 and of nothing in choice 2, which the independence axiom (behav-1.3) and Savage's sure-thing principle say should not matter. In the probability triangle the segments $AB$ and $CD$ are parallel, so parallel indifference lines rank them the same way; the pattern $A$, $D$ requires lines that fan out.`,
      idea: String.raw`Write every lottery as an 0.11 chance of a "core" lottery plus an 0.89 chance of a common prize: the core is 100 million for sure in $A$ and $C$, and a 10/11 chance of 500 million in $B$ and $D$; the common prize is 100 million in choice 1 and nothing in choice 2. Independence says only the cores matter. Allais argued that a prudent person rightly values certainty itself (the **certainty effect**), so the common prize changes the attraction of the safe core. The pattern became the founding anomaly of non-expected-utility theory: fanning-out preferences (Machina), rank-dependent utility, and prospect theory's probability weights (behav-2.6). How often people show it depends on the stakes and the presentation (behav-1.16).`,
      caption: String.raw`Click the option you would choose in each pair; the stacked bars show each lottery's probabilities of nothing (grey), 100 million (teal) and 500 million (purple). The triangle plots the four lotteries (probability of nothing to the right, of 500 million up): $AB$ and $CD$ are parallel. The blue indifference lines are those of an expected-utility maximizer with the utility of 100 million set by the slider (0 for nothing, 1 for 500 million). The right panel shows why no slider position fits the pattern $A$, $D$: the two expected-utility differences are the same line. Turn on **fanning out** to see indifference lines that are steeper near $A$ and flatter near $C$, which rationalize it.`,
      deps: ['behav-1.3'], refs: ['W&K ch. 5', 'Kahneman ch. 29'], tags: ['expected utility', 'independence', 'paradoxes'],
      see: ['phil-5.9', 'behav-2.6', 'behav-1.16'],
      credit: 'Maurice Allais, 1953',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Allais_paradox' },
      viz(v) {
        const uS = v.slider('expected utility: $u(100\\text{M})$, with $u(0)=0,\\ u(500\\text{M})=1$', 0.5, 0.99, 0.8, { step: 0.005 });
        const fan = v.toggle('fanning-out preferences', false);
        const cs = v.stage({ x: [0, 100], y: [0, 44], axes: false, height: 214, full: true, title: 'choose one option in each pair (prizes in millions of francs)' });
        const T = v.stage({ x: [-0.12, 1.1], y: [-0.17, 1.1], equal: true, axes: false, height: 380, title: 'the four lotteries in the triangle' });
        const E = v.stage({ x: [0.42, 1], y: [-0.06, 0.06], axes: 'box', height: 380, xlabel: 'u(100M)', ylabel: 'EU difference', title: 'whatever the utility' });
        const ans = { 1: null, 2: null };
        const R = { A: [2, 24.5, 49, 40.5], B: [51, 24.5, 98, 40.5], C: [2, 3, 49, 19], D: [51, 3, 98, 19] };
        cs.onClick((x, y) => { for (const k of ['A', 'B', 'C', 'D']) if (inside(R[k], x, y)) ans[k === 'A' || k === 'B' ? 1 : 2] = k; });
        const L = { A: [0, 0], B: [0.01, 0.1], C: [0.89, 0], D: [0.9, 0.1] };
        v.legend([['blue', 'indifference lines'], ['accent', 'your choice', { dot: true }], ['green', 'EU(A) − EU(B) = EU(C) − EU(D)']]);
        let st = {};
        v.render(() => {
          const u = uS.value;
          const segs = { A: [[1, PRIZE[100], '100: 100%']], B: [[0.01, PRIZE[0], ''], [0.89, PRIZE[100], '100: 89%'], [0.1, PRIZE[500], '500: 10%']], C: [[0.89, PRIZE[0], 'nothing: 89%'], [0.11, PRIZE[100], '11%']], D: [[0.9, PRIZE[0], 'nothing: 90%'], [0.1, PRIZE[500], '10%']] };
          const lines = { A: ['100 million for sure'], B: ['500 million with probability 10%', '100 million with 89%, nothing with 1%'], C: ['100 million with probability 11%', 'nothing with 89%'], D: ['500 million with probability 10%', 'nothing with 90%'] };
          for (const k of ['A', 'B', 'C', 'D']) {
            const pair = k === 'A' || k === 'B' ? 1 : 2;
            card(cs, R[k], { tag: k, lines: lines[k], segs: segs[k], chosen: ans[pair] === k, dim: ans[pair] && ans[pair] !== k, sub: `EU = ${v.fix(k === 'A' ? u : k === 'B' ? 0.1 + 0.89 * u : k === 'C' ? 0.11 * u : 0.1, 3)}` });
          }
          cs.text('choice 1', 50, 42.4, { align: 'center', size: 11, color: 'muted', weight: 600 }); cs.text('choice 2', 50, 21.8, { align: 'center', size: 11, color: 'muted', weight: 600 });
          // triangle
          const pref = fan.value ? makePref('out', 10 / 11, 0.85, [0.45, 0.05]) : makePref('eu', u);
          drawTriangle(T, ['0', '100M', '500M']);
          drawIndiff(T, pref, { n: 24, color: 'blue', alpha: 0.3 });
          for (const k of ['A', 'C']) { const seg = indiffThrough(pref, L[k][0], L[k][1]); if (seg) T.line(seg[0][0], seg[0][1], seg[1][0], seg[1][1], { color: 'blue', width: 1.8, alpha: 0.9 }); }
          T.line(L.A[0], L.A[1], L.B[0], L.B[1], { color: 'ink', width: 2 }); T.line(L.C[0], L.C[1], L.D[0], L.D[1], { color: 'ink', width: 2 });
          for (const k of ['A', 'B', 'C', 'D']) {
            const pair = k === 'A' || k === 'B' ? 1 : 2, chosen = ans[pair] === k;
            T.dot(L[k][0], L[k][1], { r: 6, color: chosen ? 'accent' : 'ink', hollow: !chosen && ans[pair] != null, width: 2, label: k, labelPos: k === 'A' ? 'ne' : k === 'B' ? 'e' : k === 'C' ? 'nw' : 'e' });
          }
          const better = (p, q) => pref.value(p[0], p[1]) - pref.value(q[0], q[1]);
          const pr1 = better(L.A, L.B) > 0 ? 'A' : 'B', pr2 = better(L.C, L.D) > 0 ? 'C' : 'D';
          T.text('these preferences', 0.5, 0.8, { size: 12, weight: 700, color: pr1 === 'A' && pr2 === 'D' ? 'purple' : 'blue' });
          T.text(`choose ${pr1} and ${pr2}`, 0.5, 0.72, { size: 12, weight: 700, color: pr1 === 'A' && pr2 === 'D' ? 'purple' : 'blue' });
          // EU differences as functions of u
          E.fn((x) => 0.11 * x - 0.1, { color: 'green', width: 3.2, domain: [0.5, 1] });
          E.fn((x) => 0.11 * x - 0.1, { color: 'teal', width: 1.4, dash: [6, 5], domain: [0.5, 1] });
          E.hline(0, { color: 'muted', width: 1 });
          E.vline(10 / 11, GUIDE); E.text('u = 10/11', 10 / 11, 0.018, { dx: 5, size: 11, color: 'muted' });
          E.text('A ≻ B and C ≻ D', 0.99, 0.045, { align: 'right', size: 11.5, weight: 600, color: 'green' });
          E.text('B ≻ A and D ≻ C', 0.52, -0.045, { size: 11.5, weight: 600, color: 'green' });
          E.text('A and D: needs the first difference > 0', 0.52, 0.045, { size: 10.5, color: 'red' });
          E.text('and the second < 0, the same line', 0.52, 0.036, { size: 10.5, color: 'red' });
          if (!fan.value) { E.vline(u, { color: 'blue', width: 1.4 }); E.dot(u, 0.11 * u - 0.1, { r: 5, color: 'blue' }); }
          st = { u, pr1, pr2, a1: ans[1], a2: ans[2] };
        });
        v.readout(() => {
          const { u, pr1, pr2, a1, a2 } = st; if (!u) return '';
          const base = fan.value ? `Fanning-out preferences choose **${pr1}** and **${pr2}**: steep lines near certainty favour $A$, flatter lines near the "nothing" corner favour $D$.` : `An expected-utility maximizer with $u(100\\text{M}) = ${v.fix(u, 3)}$ chooses **${pr1}** and **${pr2}**; $A$ and $C$ when $u > 10/11$, $B$ and $D$ when $u < 10/11$, never $A$ and $D$.`;
          if (!a1 || !a2) return `Click your choice in each pair first. ${base}`;
          const ok = (a1 === 'A') === (a2 === 'C');
          return `You chose **${a1}** and **${a2}**: ${ok ? 'consistent with expected utility (some utility function makes both choices).' : '**the Allais pattern**' + (a1 === 'A' ? '' : ' in reverse') + ', which no utility function can produce: it contradicts the independence axiom.'} ${base}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12', kind: 'Phenomenon', name: 'The common-ratio effect',
      statement: String.raw`Take a sure prize $x$ and a riskier option paying $y>x$ with probability $r<1$. Scale *both* winning probabilities by the same factor $\lambda\in(0,1)$: $S_\lambda$ pays $x$ with probability $\lambda$, $R_\lambda$ pays $y$ with probability $r\lambda$. Expected utility predicts the same choice at every $\lambda$, since
$$EU(S_\lambda)-EU(R_\lambda)=\lambda\,\big[u(x)-r\,u(y)\big]\qquad(u(0)=0).$$
Yet many people choose $S$ when $\lambda=1$ and $R_\lambda$ when $\lambda$ is small. In Kahneman and Tversky's (1979) version, 80% of 95 respondents preferred 3,000 for sure to an 80% chance of 4,000, while 65% preferred a 20% chance of 4,000 to a 25% chance of 3,000 ($\lambda=1/4$); Allais's own pair was 100 million francs for sure against a 98% chance of 500 million, then 1% against 0.98%.`,
      scope: String.raw`Robust in hypothetical and incentivized experiments when the safe option starts at certainty, much weaker when neither option is certain; the size varies a lot between studies and presentations.`,
      idea: String.raw`In the probability triangle, $S_\lambda=(1-\lambda,0)$ and $R_\lambda=(1-r\lambda,\,r\lambda)$, so scaling by $\lambda$ slides the pair toward the "nothing" corner along rays from it while keeping the segment $S_\lambda R_\lambda$ parallel to itself. Parallel indifference lines (behav-1.3) therefore give the same ranking for every $\lambda$; the observed switch needs lines that are steeper near certainty and flatter near the "nothing" corner, the same fanning out as in the Allais paradox (behav-1.11). Prospect theory reads it as probability weighting: going from 0.8 to 1 matters more than going from 0.2 to 0.25 (behav-2.4).`,
      caption: String.raw`Choose a pair, set the scale $\lambda$ with the slider and click the option you prefer; do this at several scales. The triangle shows the pair at every scale (the current one bold), sliding toward the "nothing" corner with the segment always parallel. The strip on the right records your choices against $\lambda$, with the paper's majority where it exists, and the predictions of expected utility (blue band: the same answer at every scale, whichever utility the slider sets) and of fanning-out preferences (purple).`,
      deps: ['behav-1.3'], refs: ['W&K ch. 5'], tags: ['expected utility', 'independence', 'probability'],
      see: ['behav-2.4', 'behav-1.11'],
      credit: 'Allais, 1953; Kahneman & Tversky, 1979',
      viz(v) {
        const SETS = {
          kt: { x: '3,000', y: '4,000', xv: 3000, yv: 4000, unit: '', r: 0.8, labs: ['0', '3,000', '4,000'], data: { 0: [80, 'S'], 2: [65, 'R'] }, k0: 4 },
          allais: { x: '100 million', y: '500 million', xv: 100, yv: 500, unit: ' million', r: 0.98, labs: ['0', '100M', '500M'], data: {}, k0: 49 },
        };
        const LAD = [1, 0.5, 0.25, 0.1, 0.05, 0.01];
        const ds = v.select('pair', [{ value: 'kt', label: 'Kahneman–Tversky: 3,000 vs 4,000' }, { value: 'allais', label: 'Allais: 100M vs 500M' }], 'kt');
        const lS = v.slider('scale $\\lambda$', 0, LAD.length - 1, 0, { int: true, fmt: (i) => String(LAD[Math.round(i)]) });
        const uS = v.slider('expected utility: $u(x)/u(y)$', 0.5, 0.995, 0.85, { step: 0.005 });
        const cs = v.stage({ x: [0, 100], y: [0, 20], axes: false, height: 98, full: true, title: 'which do you prefer?' });
        const T = v.stage({ x: [-0.12, 1.1], y: [-0.17, 1.1], equal: true, axes: false, height: 370, title: 'the pair at every scale' });
        const C = v.stage({ x: [0.0032, 1.6], xlog: true, y: [-0.7, 1.7], axes: 'box', height: 370, xlabel: 'scale λ (log)', title: 'choices across scales', yticks: [[0, 'R (risky)'], [1, 'S (safe)']] });
        const ans = { kt: {}, allais: {} };
        const RS = [2, 2, 49, 18], RR = [51, 2, 98, 18];
        cs.onClick((x, y) => { const i = Math.round(lS.value); if (inside(RS, x, y)) ans[ds.value][i] = 'S'; else if (inside(RR, x, y)) ans[ds.value][i] = 'R'; });
        v.legend([['accent', 'your choices', { dot: true }], ['blue', 'expected utility', { area: true }], ['purple', 'fanning out', { dash: true }], ['gold', 'paper’s majority', { dot: true }]]);
        let st = {};
        v.render(() => {
          const D = SETS[ds.value], i = Math.round(lS.value), lam = LAD[i], r = D.r, A = ans[ds.value];
          const pc = (p) => `${+(100 * p).toFixed(3)}%`;
          const ev = (x) => `expected value ${x.toLocaleString('en-US', { maximumFractionDigits: 2 })}${D.unit}`;
          card(cs, RS, { tag: 'S', lines: [lam === 1 ? `${D.x} for sure` : `${D.x} with probability ${pc(lam)}`], segs: [[lam, 'teal', ''], [1 - lam, 'faint', '']], chosen: A[i] === 'S', dim: A[i] === 'R', sub: ev(D.xv * lam) });
          card(cs, RR, { tag: 'R', lines: [`${D.y} with probability ${pc(r * lam)}`], segs: [[r * lam, 'purple', ''], [1 - r * lam, 'faint', '']], chosen: A[i] === 'R', dim: A[i] === 'S', sub: ev(D.yv * r * lam) });
          // triangle
          const eu = makePref('eu', uS.value), fanPref = makePref('out', D.k0 / (1 + D.k0), 0.9, [0.4, 0.04]);
          drawTriangle(T, D.labs);
          drawIndiff(T, eu, { n: 18, color: 'blue', alpha: 0.25 });
          LAD.forEach((L, j) => {
            const S = [1 - L, 0], R = [1 - r * L, r * L], cur = j === i;
            T.line(S[0], S[1], R[0], R[1], { color: cur ? 'ink' : 'muted', width: cur ? 2.4 : 1.2, alpha: cur ? 1 : 0.7 });
            const ch = A[j];
            T.dot(S[0], S[1], { r: cur ? 6 : 4, color: ch === 'S' ? 'accent' : 'muted', hollow: ch === 'R', width: 1.8 });
            T.dot(R[0], R[1], { r: cur ? 6 : 4, color: ch === 'R' ? 'accent' : 'muted', hollow: ch === 'S', width: 1.8 });
          });
          T.line(1, 0, 1 - r, r, { color: 'faint', width: 1, dash: [3, 4] });
          T.corner(`bold: λ = ${lam}`, 'tr', { color: 'ink', weight: 700 });
          // choices strip
          const euS = uS.value > r;
          C.hband(euS ? 0.75 : -0.25, euS ? 1.25 : 0.25, { color: 'blue', alpha: 0.12 });
          const fp = LAD.map((L) => [L, fanPref.value(1 - L, 0) > fanPref.value(1 - r * L, r * L) ? 1 : 0]);
          const fpPath = []; fp.forEach(([L, y], j) => { fpPath.push([L, y]); if (j + 1 < fp.length && fp[j + 1][1] !== y) { const mid = Math.sqrt(L * fp[j + 1][0]); fpPath.push([mid, y], [mid, fp[j + 1][1]]); } });
          C.path(fpPath, { color: 'purple', width: 2, dash: [6, 4] });
          for (const [j, [pct, w]] of Object.entries(D.data)) { const L = LAD[+j], y = w === 'S' ? 1 : 0; C.dot(L, y, { r: 9, hollow: true, color: 'gold', width: 2.4 }); C.text(`${pct}%`, L, y, { dx: 0, dy: y ? -18 : 18, align: 'center', size: 11, weight: 700, color: 'gold' }); }
          LAD.forEach((L, j) => { if (A[j]) C.dot(L, A[j] === 'S' ? 1 : 0, { r: 5.5, color: 'accent' }); });
          C.vline(lam, GUIDE);
          const mine = LAD.map((L, j) => A[j]).filter(Boolean);
          st = { lam, r, D, i, euS, switched: mine.includes('S') && mine.includes('R'), A, fp };
        });
        v.readout(() => {
          const { lam, r, D, euS, switched, A, fp } = st; if (!D) return '';
          const lab = (c) => (c === 'S' ? 'S (safe)' : 'R (risky)');
          const yours = LAD.map((L, j) => (A[j] ? `λ = ${L}: ${A[j]}` : null)).filter(Boolean).join(', ');
          const sw = fp.findIndex(([, y]) => y === 0);
          let s = `At $\\lambda = ${lam}$: $EU(S) - EU(R) = \\lambda\\,[u(x) - ${r}\\,u(y)]$, so with $u(x)/u(y) = ${v.fix(uS.value, 3)}$ expected utility picks **${lab(euS ? 'S' : 'R')}** at every scale. The fanning-out preferences ${sw > 0 ? `switch to R by λ = ${LAD[sw]}` : sw === 0 ? 'pick R throughout' : 'pick S throughout'}.`;
          s += yours ? ` Your choices: ${yours}${switched ? ' — **a switch**, which expected utility cannot produce.' : '.'}` : ' Click S or R to record your choice at this scale.';
          if (D === SETS.kt) s += ' Kahneman & Tversky (1979, Problems 3 and 4, N = 95): 80% chose S at λ = 1, 65% chose R at λ = 1/4.';
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13', kind: 'Paradox', name: 'The Ellsberg paradox (ambiguity aversion)',
      statement: String.raw`An urn holds 90 balls: 30 red and 60 black or yellow in an **unknown** proportion. One ball is drawn. Compare
- bet I, $\$100$ if red, with bet II, $\$100$ if black;
- bet III, $\$100$ if red or yellow, with bet IV, $\$100$ if black or yellow.

Most people prefer I to II and IV to III (Ellsberg 1961). No single subjective probability supports this: with $\mu(\text{red})=1/3$ and $\mu(\text{black})=b$, preferring I to II needs $b<1/3$, while preferring IV to III needs $b+\mu(\text{yellow})>1/3+\mu(\text{yellow})$, that is $b>1/3$. The pattern violates Savage's sure-thing principle (behav-1.10): the two pairs differ only in what is paid on yellow, where both bets of a pair agree. People prefer bets whose probabilities are known, **ambiguity aversion**; in Ellsberg's two-urn version they prefer to bet on a known 50–50 urn whichever colour they bet on.`,
      idea: String.raw`Subjective expected utility (behav-1.10) treats an unknown proportion exactly like a known one with the same mean, so the composition of the 60 balls should matter only through one number $b$. Each bet's chance of winning is linear in $b$, and both pairs flip at the same point $b=1/3$, so every probability assignment yields either I and III or II and IV. Choosing I and IV means evaluating each bet by its own unfavourable composition (few black balls for bet II, few yellow balls for bet III), as if the decision maker held a whole set of possible distributions and feared the worst one: the maxmin model of behav-1.14.`,
      caption: String.raw`Click your choice in each pair. The urn shows 30 red balls and 60 whose colours you do not know; the slider fills them in with one hypothetical composition (black count $b$), which changes nothing about the bets you are offered. The chart plots each bet's chance of winning against the black count: I and IV are flat (their chances are known), II and III cross them at 30 black balls. The strips under it shade the compositions under which your choices maximize expected utility; for the common pattern I, IV they do not overlap.`,
      deps: ['behav-1.10'], refs: ['W&K ch. 5'], tags: ['ambiguity', 'subjective probability', 'paradoxes'],
      see: ['phil-5.10', 'behav-1.14'],
      credit: 'Daniel Ellsberg, 1961',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ellsberg_paradox' },
      viz(v) {
        const bS = v.slider('hypothetical number of black balls $b$', 0, 60, 20, { step: 1 });
        const us = v.stage({ x: [0, 100], y: [0, 50], axes: false, height: 240, full: true, title: 'the urn and the four bets: click one bet in each pair' });
        const ch = v.stage({ x: [-6, 60], y: [-0.42, 1.06], axes: 'box', height: 320, full: true, xlabel: 'number of black balls b (of the 60 unknown)', ylabel: 'chance of winning', title: 'each bet’s chance of winning, for every composition', yticks: [0, [1 / 3, '1/3'], [2 / 3, '2/3'], 1], xticks: [0, 10, 20, 30, 40, 50, 60] });
        const ans = { 1: null, 2: null };
        const R = { I: [27, 26.5, 62, 47], II: [64, 26.5, 99, 47], III: [27, 3, 62, 23.5], IV: [64, 3, 99, 23.5] };
        us.onClick((x, y) => { for (const k of ['I', 'II', 'III', 'IV']) if (inside(R[k], x, y)) ans[k === 'I' || k === 'II' ? 1 : 2] = k; });
        const COL = { I: 'red', II: 'ink', III: 'orange', IV: 'teal' };
        v.legend([['red', 'I: red'], ['ink', 'II: black'], ['orange', 'III: red or yellow'], ['teal', 'IV: black or yellow'], ['green', 'compositions where your choice is best', { area: true }]]);
        let st = {};
        v.render(() => {
          const b = bS.value;
          // urn: 90 balls in a 9 × 10 grid
          us.rect(1, 3, 24, 47, { fill: 'grid', fillAlpha: 0.5, color: 'muted', width: 1.4, radius: 14 });
          const cols = 9, dx = 21 / cols, dy = 3.15;
          for (let n = 0; n < 90; n++) {
            const c = n % cols, rr = Math.floor(n / cols), x = 2 + dx * (c + 0.5), y = 41.5 - dy * rr;
            if (n < 30) us.dot(x, y, { r: 6.5, color: 'red' });
            else { const isB = n - 30 < b; us.dot(x, y, { r: 6.5, color: isB ? 'ink' : 'gold', alpha: 0.35 }); us.text('?', x, y, { align: 'center', size: 9.5, weight: 700, color: 'ink', halo: false }); }
          }
          us.text('30 red', 12.5, 45, { align: 'center', size: 11, weight: 700, color: 'red' });
          us.text('60 of unknown colour', 12.5, 8.4, { align: 'center', size: 10.5, color: 'muted', weight: 600 });
          us.text(`(shown: ${b} black, ${60 - b} yellow)`, 12.5, 5.6, { align: 'center', size: 10, color: 'muted' });
          const lines = { I: ['$100 if the ball is red'], II: ['$100 if the ball is black'], III: ['$100 if the ball is red', 'or yellow'], IV: ['$100 if the ball is black', 'or yellow'] };
          for (const k of ['I', 'II', 'III', 'IV']) {
            const pair = k === 'I' || k === 'II' ? 1 : 2;
            card(us, R[k], { tag: k, lines: lines[k], chosen: ans[pair] === k, dim: ans[pair] && ans[pair] !== k, sub: k === 'I' ? 'chance 1/3, known' : k === 'IV' ? 'chance 2/3, known' : 'chance unknown' });
          }
          us.text('or', 63, 36.7, { align: 'center', size: 11, color: 'muted', weight: 600 }); us.text('or', 63, 13.2, { align: 'center', size: 11, color: 'muted', weight: 600 });
          // chart
          const pw = { I: 30 / 90, II: b / 90, III: (90 - b) / 90, IV: 60 / 90 };
          ch.fn(() => 1 / 3, { color: COL.I, width: 2.6, domain: [0, 60] });
          ch.fn((x) => x / 90, { color: COL.II, width: 2.6, domain: [0, 60] });
          ch.fn((x) => (90 - x) / 90, { color: COL.III, width: 2.6, domain: [0, 60] });
          ch.fn(() => 2 / 3, { color: COL.IV, width: 2.6, domain: [0, 60] });
          ch.text('I', 60, 1 / 3, { dx: -6, dy: 12, align: 'right', size: 12, weight: 800, color: COL.I }); ch.text('II', 60, 60 / 90, { dx: -6, dy: 12, align: 'right', size: 12, weight: 800, color: COL.II });
          ch.text('III', 8, 82 / 90, { dy: -11, size: 12, weight: 800, color: COL.III }); ch.text('IV', 0, 2 / 3, { dx: 8, dy: -9, size: 12, weight: 800, color: COL.IV });
          ch.vline(30, GUIDE); ch.text('b = 30', 30, 1.04, { dx: 5, size: 10.5, color: 'muted' });
          ch.vline(b, { color: 'gold', width: 1.4 });
          for (const k of ['I', 'II', 'III', 'IV']) ch.dot(b, pw[k], { r: 4, color: COL[k] });
          // feasibility strips
          const fit = (c) => (c === 'I' || c === 'III' ? [0, 30] : [30, 60]);
          for (const [c, y, lab] of [[ans[1], -0.09, 'choice 1'], [ans[2], -0.2, 'choice 2']]) {
            ch.text(lab, -6, y, { dx: 4, size: 10, color: 'muted', weight: 600 });
            if (!c) { ch.text('not chosen yet', 30, y, { align: 'center', size: 10.5, color: 'muted' }); continue; }
            const [a, z] = fit(c); ch.rect(a, y - 0.04, z, y + 0.04, { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1 });
            ch.text(`${c} is best if b ${c === 'I' || c === 'III' ? '≤' : '≥'} 30`, (a + z) / 2, y, { align: 'center', size: 10.5, weight: 700 });
          }
          if (ans[1] && ans[2] && (ans[1] === 'I') !== (ans[2] === 'III')) ch.text('no composition fits both choices', 30, -0.31, { align: 'center', size: 11.5, weight: 700, color: 'red', plate: true });
          st = { b, a1: ans[1], a2: ans[2], pw };
        });
        v.readout(() => {
          const { b, a1, a2, pw } = st; if (b == null) return '';
          const head = `With ${b} black balls the chances are I ${v.fix(pw.I, 3)}, II ${v.fix(pw.II, 3)}, III ${v.fix(pw.III, 3)}, IV ${v.fix(pw.IV, 3)}.`;
          if (!a1 || !a2) return `Click your choice in each pair first. ${head}`;
          const ok = (a1 === 'I') === (a2 === 'III');
          if (ok) return `You chose **${a1}** and **${a2}**: consistent with subjective expected utility for every composition with ${a1 === 'I' ? 'at most' : 'at least'} 30 black balls. ${head}`;
          return `You chose **${a1}** and **${a2}**: ${a1 === 'I' ? 'the Ellsberg pattern.' : 'the reverse Ellsberg pattern (ambiguity seeking).'} ${a1} is best only if $b ${a1 === 'I' ? '<' : '>'} 30$, ${a2} only if $b ${a2 === 'IV' ? '>' : '<'} 30$: **no probability for black fits both**, so the choices cannot come from a single subjective probability. ${head}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14', kind: 'Model', name: 'Maxmin expected utility (Gilboa–Schmeidler)',
      statement: String.raw`A decision maker with **maxmin expected utility** holds a closed convex set $\mathcal C$ of probability distributions over the states, rather than one, and ranks acts by their worst-case expected utility:
$$V(f)=\min_{P\in\mathcal C}\int u(f)\,dP .$$
Gilboa and Schmeidler (1989) showed that this representation, with $u$ unique up to $a+bu$ ($b>0$) and $\mathcal C$ unique, characterizes preferences satisfying Savage-style axioms in which independence is weakened to mixtures with constant acts and an axiom of **uncertainty aversion** is added (mixing two indifferent acts can only help). With $\mathcal C$ a single prior it is subjective expected utility (behav-1.10). The **α-maxmin** extension weights the worst case by $\alpha$ and the best by $1-\alpha$.`,
      scope: String.raw`Describes ambiguity aversion (Ellsberg, behav-1.13); with $\alpha<1/2$ the α-version also allows ambiguity seeking, which experiments often find for unlikely events. Maxmin ignores everything about $\mathcal C$ except its extreme points, which smooth models of ambiguity (weighting the priors) relax.`,
      idea: String.raw`In Ellsberg's urn, red is known to be 1/3 and the black share $b$ is unsure, so take $\mathcal C$ to be the priors with $b$ in an interval around 1/3. Expected payoffs are linear in $b$, so each bet's worst case sits at an end of the interval: bet II (black) is judged as if few balls were black, bet III (red or yellow) as if many were black, while I and IV, whose chances are known, are unaffected. Hence I beats II and IV beats III for any interval of positive width: the Ellsberg pattern with no contradiction, because each act is evaluated with its own worst prior. Shrinking the interval to a point recovers expected utility. In this finite-state urn, a nonempty closed interval of admissible $b$ values is compact, and each act's expected utility is a continuous affine function of $b$. The extreme value theorem (pma-4.16) ensures that the worst prior is attained, so the minimum is a genuine minimum. An affine function with positive slope has its minimum at the left endpoint, one with negative slope at the right endpoint, and a constant one at every prior. Compactness and continuity justify attainment here; a closed set of priors on an unrestricted infinite state space needs additional topology and continuity assumptions.`,
      caption: String.raw`The triangle is the simplex of all beliefs about the colour of the drawn ball (red, black, yellow); every belief consistent with "30 of 90 are red" lies on the dashed line, and the thick segment is the decision maker's set of priors, whose width (in balls) the slider sets. The worst prior for each bet is marked. Right: each bet's range of expected payoff (chance of winning $\$100$) over the set, with its α-maxmin value as a dot (α = 1 is pure maxmin). Any positive width with α above 1/2 reproduces the choices I over II and IV over III; zero width is expected utility, and α below 1/2 reverses both.`,
      deps: ['behav-1.13', 'pma-4.16'], refs: ['W&K ch. 5'], tags: ['ambiguity', 'decision theory'],
      see: ['phil-5.3', 'phil-5.10'],
      credit: 'Gilboa & Schmeidler, 1989',
      viz(v) {
        const kS = v.slider('prior set: black count $30 \\pm k$', 0, 30, 15, { step: 1 });
        const aS = v.slider('weight on the worst case $\\alpha$', 0, 1, 1, { step: 0.01 });
        const S = v.stage({ x: [-0.12, 1.12], y: [-0.14, 0.98], equal: true, axes: false, height: 360, title: 'beliefs about the drawn ball' });
        const B = v.stage({ x: [-0.6, 3.5], y: [0, 1.1], axes: 'box', height: 360, ylabel: 'P(win)', title: 'each bet over the prior set', xticks: [[0, 'I: red'], [1, 'II: black'], [2, 'III: red/yellow'], [3, 'IV: black/yellow']] });
        const Vr = [0.5, Math.sqrt(3) / 2], Vb = [0, 0], Vy = [1, 0];
        const P = (r, b) => { const y = 1 - r - b; return [r * Vr[0] + b * Vb[0] + y * Vy[0], r * Vr[1] + b * Vb[1] + y * Vy[1]]; };
        const COL = ['red', 'ink', 'orange', 'teal'];
        const win = [(r) => r, (r, b) => b, (r, b) => 1 - b, (r, b) => 1 - r];
        v.legend([['accent', 'set of priors'], ['muted', 'all beliefs with 30 red', { dash: true }], ['purple', 'α-maxmin value', { dot: true }]]);
        let st = {};
        v.render(() => {
          const k = kS.value, a = aS.value, r = 1 / 3, b0 = (30 - k) / 90, b1 = (30 + k) / 90;
          S.poly([Vr, Vb, Vy], { fill: 'grid', fillAlpha: 0.35, color: 'ink', width: 1.4 });
          S.text('all red', Vr[0], Vr[1], { dy: -10, align: 'center', size: 11.5, weight: 700, color: 'red' });
          S.text('all black', 0, 0, { dy: 13, align: 'center', size: 11.5, weight: 700 });
          S.text('all yellow', 1, 0, { dy: 13, align: 'center', size: 11.5, weight: 700, color: 'gold' });
          const L0 = P(r, 0), L1 = P(r, 2 / 3);
          S.line(L0[0], L0[1], L1[0], L1[1], { color: 'muted', width: 1.4, dash: [5, 4] });
          S.text('red = 1/3', L0[0], L0[1], { dx: 8, size: 11, color: 'muted' });
          const C0 = P(r, b0), C1 = P(r, b1), Cm = P(r, 1 / 3);
          S.line(C0[0], C0[1], C1[0], C1[1], { color: 'accent', width: 6, alpha: 0.75 });
          S.dot(Cm[0], Cm[1], { r: 4, color: 'ink' });
          S.text(`b ∈ [${30 - k}, ${30 + k}]/90`, (C0[0] + C1[0]) / 2, C0[1], { dy: -16, align: 'center', size: 11.5, weight: 700, color: 'accent' });
          // worst priors for II and III
          if (k > 0) {
            S.dot(C1[0], C1[1], { r: 6, hollow: true, color: 'orange', width: 2.4 }); S.text('worst for III', C1[0], C1[1], { dx: -8, dy: 16, align: 'right', size: 10.5, color: 'orange', weight: 600 });
            S.dot(C0[0], C0[1], { r: 6, hollow: true, color: 'ink', width: 2.4 }); S.text('worst for II', C0[0], C0[1], { dx: 8, dy: 16, size: 10.5, color: 'ink', weight: 600 });
          }
          // bets over the set
          const vals = win.map((f, i) => {
            const lo = Math.min(f(r, b0), f(r, b1)), hi = Math.max(f(r, b0), f(r, b1)), val = a * lo + (1 - a) * hi;
            B.rect(i - 0.18, lo, i + 0.18, Math.max(hi, lo + 0.004), { fill: COL[i], fillAlpha: 0.3, color: COL[i], width: 1.4 });
            B.dot(i, val, { r: 6.5, color: 'purple' });
            B.text(v.fix(val, 3), i, val, { dx: 12, size: 11.5, weight: 700, color: 'purple' });
            return val;
          });
          const cmp = (x, y) => (Math.abs(x - y) < 1e-9 ? '∼' : x > y ? '≻' : '≺');
          const say = (x, y, a, b) => (cmp(x, y) === '≺' ? `${b} ≻ ${a}` : `${a} ${cmp(x, y)} ${b}`);
          B.text(say(vals[0], vals[1], 'I', 'II'), 0.5, 1.03, { align: 'center', size: 13, weight: 700, color: vals[0] > vals[1] + 1e-9 ? 'green' : 'ink' });
          B.text(say(vals[2], vals[3], 'III', 'IV'), 2.5, 1.03, { align: 'center', size: 13, weight: 700, color: vals[3] > vals[2] + 1e-9 ? 'green' : 'ink' });
          st = { k, a, vals };
        });
        v.readout(() => {
          const { k, a, vals } = st; if (!vals) return '';
          const ell = vals[0] > vals[1] + 1e-9 && vals[3] > vals[2] + 1e-9, rev = vals[1] > vals[0] + 1e-9 && vals[2] > vals[3] + 1e-9;
          return `Prior set: black count between ${30 - k} and ${30 + k}; weight on the worst case α = ${v.fix(a, 2)}. Values (chance of winning $\\$100$): I ${v.fix(vals[0], 3)}, II ${v.fix(vals[1], 3)}, III ${v.fix(vals[2], 3)}, IV ${v.fix(vals[3], 3)}. ` +
            (k === 0 ? 'With a single prior this is subjective expected utility: I ∼ II and III ∼ IV, and no strict Ellsberg pattern is possible.' : ell ? '**The Ellsberg choices, I over II and IV over III, are reproduced**: each bet is judged by its own worst composition.' : rev ? 'With α below 1/2 the decision maker is ambiguity seeking: II over I and III over IV.' : 'At α = 1/2 the best and worst cases balance: indifference in both pairs.');
        });
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15', kind: 'Paper', name: 'Exposition of a New Theory on the Measurement of Risk',
      paper: { authors: 'Daniel Bernoulli', year: 1738, title: 'Specimen theoriae novae de mensura sortis', venue: 'Commentarii Academiae Scientiarum Imperialis Petropolitanae 5; English trans. by L. Sommer, Econometrica 22 (1): 23–36 (1954)', doi: '10.2307/1909829' },
      introduces: ['behav-1.2'],
      statement: String.raw`Bernoulli argued that a risky prospect should be valued not by its expected payout but by its **mean utility** ("emolumentum medium"), where the utility of a small gain is proportional to the gain and inversely proportional to the fortune already owned, so that utility is the logarithm of wealth (behav-1.2). He worked out three applications in which the answer depends on the person's wealth:
(a) **Paul's game** (the St Petersburg problem posed by his cousin Nicolaus, behav-1.1): with a fortune of 0, 10, 100 or 1,000 ducats the game is worth exactly 2, about 3, about 4 and about 6 ducats to its owner, so only an enormous fortune would justify paying 20.
(b) **Caius's insurance**: goods worth 10,000 rubles shipped from Amsterdam to Petersburg, 5 ships in 100 lost, insurance at 800 rubles: Caius should insure only if his other wealth is below about 5,043 rubles, and an insurer needs at least about 14,243 rubles to offer the policy; at a premium of 600 the thresholds are 20,478 and 29,878.
(c) **Sempronius's ships**: 4,000 ducats at home and 8,000 in goods abroad, one ship in ten lost: the goods are worth 6,751 ducats in one ship, 7,033 split between two, and never more than 7,200 however finely they are split, so diversification pays.`,
      idea: String.raw`Before Bernoulli, from Pascal and Fermat to Huygens and Montmort, the value of a risk was its mathematical expectation, and the St Petersburg game (infinite expectation, small price) was a puzzle without a solution. Bernoulli's move was to separate the **price** of an item, the same for everyone, from its **utility**, which depends on the owner's circumstances, and to average utilities instead of money. That one idea gave diminishing marginal utility, risk aversion as a consequence of it, a theory of insurance in which both sides gain, and the advantage of diversification. Gabriel Cramer had reached the same idea in 1728 with a square-root utility, as Bernoulli acknowledged. The paper was little read by economists until Sommer's translation of 1954, when it became, through von Neumann and Morgenstern (behav-1.3), the ancestor of expected utility theory; the logarithm itself returned as the growth-optimal Kelly criterion.`,
      caption: String.raw`Choose one of Bernoulli's three applications; the table compares the paper's numbers with today's exact computation. **Paul's game** recreates Bernoulli's figure: the logarithmic curve through his fortune $B$, the ordinates of the possible gains (the game stopped after $N$ tosses), and their probability-weighted mean $PO$, whose abscissa $BP$ is the game's value; drag the fortune and add tosses. **Caius** plots the utility gain from buying the policy (blue) and from selling it (orange) against the fortune of each, crossing zero at Bernoulli's thresholds; change the premium or the loss rate. **Sempronius** shows the value of the goods as they are spread over more ships, rising toward the expected value 7,200.`,
      deps: ['behav-1.1'], refs: [], tags: ['history', 'utility', 'risk'],
      credit: 'Daniel Bernoulli, 1738',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/St._Petersburg_paradox' },
      viz(v) {
        const mode = v.select('application', [{ value: 'paul', label: 'Paul’s game (§17–19)' }, { value: 'caius', label: 'Caius insures (§15)' }, { value: 'semp', label: 'Sempronius’s ships (§16)' }], 'paul');
        const aS = v.slider('Paul’s fortune $a$ (ducats)', 1, 1000, 10, { log: true, fmt: (x) => money(x) });
        const nS = v.slider('tosses shown $N$', 1, 12, 6, { int: true });
        const pS = v.slider('premium (rubles)', 400, 1000, 800, { step: 10 });
        const qS = v.slider('ships lost per hundred', 1, 15, 5, { step: 1 });
        const sS = v.slider('ships lost per ten (Sempronius)', 0.5, 3, 1, { step: 0.1 });
        const M = v.stage({ x: [0, 100], y: [-1, 1], axes: 'box', height: 360, weight: 1.35, title: '' });
        const tb = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, weight: 0.9, title: 'the paper against an exact computation' });
        const T = v.table(tb, { rows: 4, cols: 3, square: false, cellAspect: 2.2, maxCell: 46, size: 12.5, colLabels: ['', '1738', 'exact'], colWeights: [1.8, 1, 1], region: [0, 0.04, 1, 0.96] });
        const sup = (n) => String(n).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join('');
        const drawT = (rows, title) => { tb.setTitle(title); T.draw({ value: (i, j) => rows[i][j], textColor: (i, j) => (j === 1 ? 'gold' : 'ink'), weight: (i, j) => (j ? 700 : 500) }); };
        const bis = (f, lo, hi) => { let flo = f(lo); for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2, fm = f(m); if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } } return (lo + hi) / 2; };
        const caius = (P, q) => bis((x) => Math.log(x + 10000 - P) - ((1 - q) * Math.log(x + 10000) + q * Math.log(x)), 1e-6, 1e8);
        const insurer = (P, q) => bis((y) => (1 - q) * Math.log(y + P) + q * Math.log(y + P - 10000) - Math.log(y), 10000 - P + 1e-6, 1e9);
        const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
        const semp = (n, q) => { let s = 0; for (let j = 0; j <= n; j++) s += binom(n, j) * Math.pow(1 - q, j) * Math.pow(q, n - j) * Math.log(4000 + (8000 * j) / n); return Math.exp(s) - 4000; };
        let st = {};
        v.render(() => {
          const md = mode.value;
          aS.el.hidden = nS.el.hidden = md !== 'paul'; pS.el.hidden = qS.el.hidden = md !== 'caius'; sS.el.hidden = md !== 'semp';
          if (md === 'paul') {
            const a = aS.value, N = nS.value, xmax = a + Math.pow(2, N - 1) * 1.08, u = (x) => Math.log(x / a);
            const ymin = u(Math.max(a * 0.25, 0.3)), ymax = u(xmax) * 1.12;
            M.setView([-0.07 * xmax, xmax], [ymin, ymax]); M.setTitle("Bernoulli's figure: utility b·log(x/a), value of the risk BP");
            M.setLabels('fortune x (ducats)', 'utility');
            M.fn(u, { domain: [Math.max(a * 0.25, 0.3), xmax], color: 'ink', width: 2.4 });
            M.hline(0, { color: 'muted', width: 1 });
            let eu = 0, lastX = -1e9;
            for (let k = 1; k <= N; k++) {
              const x = a + Math.pow(2, k - 1), y = u(x); eu += Math.pow(2, -k) * y;
              M.line(x, 0, x, y, { color: 'teal', width: 1 + 2.5 * Math.pow(2, -k + 1), alpha: 0.85 });
              if (M.X(x) - lastX > 24 || k === N) { M.text(k === 1 ? '½' : k === 2 ? '¼' : `2⁻${sup(k)}`, x, y, { dy: -9, align: 'center', size: 10, color: 'teal' }); lastX = M.X(x); }
            }
            const ce = a * Math.exp(eu) - a;
            M.hline(eu, { color: 'orange', width: 1.4, dash: [5, 4] });
            M.dot(a, 0, { r: 5, color: 'ink', label: 'B', labelPos: 's' });
            M.dot(a + ce, 0, { r: 5, color: 'orange', label: 'P', labelPos: 's' });
            M.line(a + ce, 0, a + ce, eu, { color: 'orange', width: 2 }); M.dot(a + ce, eu, { r: 4.5, color: 'orange', label: 'O', labelPos: 'nw' });
            M.text(`mean utility PO; BP = ${v.fix(ce, 3)} ducats`, xmax, eu, { dx: -6, dy: -14, align: 'right', size: 11.5, weight: 600, color: 'orange', plate: true });
            M.text('A', 0, 0, { dx: 4, dy: 10, size: 11, color: 'muted', weight: 600 });
            drawT([['fortune 0', '2', v.fix(bernValue(0), 3)], ['fortune 10', '≈ 3', v.fix(bernValue(10), 3)], ['fortune 100', '≈ 4', v.fix(bernValue(100), 3)], ['fortune 1,000', '≈ 6', v.fix(bernValue(1000), 3)]], 'value of Paul’s game to its owner (§19)');
            st = { md, a, N, ce, full: bernValue(a), price: bernPrice(a) };
          } else if (md === 'caius') {
            const P = pS.value, q = qS.value / 100, x0 = caius(P, q), y0 = insurer(P, q), xmax = Math.max(32000, 1.25 * y0);
            const dC = (x) => 1000 * (Math.log(x + 10000 - P) - ((1 - q) * Math.log(x + 10000) + q * Math.log(x)));
            const dI = (y) => (y + P - 10000 > 0 ? 1000 * ((1 - q) * Math.log(y + P) + q * Math.log(y + P - 10000) - Math.log(y)) : NaN);
            M.setView([0, xmax], [-25, 25]); M.setTitle('utility gain from the policy (thousandths of a log unit)'); M.setLabels('fortune apart from the cargo (rubles)', 'gain ×1000');
            M.hband(0, 25, { color: 'green', alpha: 0.04 });
            M.hline(0, { color: 'muted', width: 1 });
            M.clip(() => { M.fn(dC, { domain: [30, xmax], color: 'blue', width: 2.6, n: 500 }); M.fn(dI, { domain: [10000 - P + 1, xmax], color: 'orange', width: 2.6, n: 500 }); });
            M.dot(x0, 0, { r: 5.5, color: 'blue' }); M.text('Caius should insure', x0, 0, { dx: 8, dy: -28, size: 11.5, weight: 700, color: 'blue' }); M.text(`if his fortune is below ${money(x0)}`, x0, 0, { dx: 8, dy: -13, size: 11.5, weight: 700, color: 'blue' });
            M.dot(y0, 0, { r: 5.5, color: 'orange' }); M.text(`insurer gains above ${money(y0)}`, y0, 0, { dx: 8, dy: 14, size: 11.5, weight: 700, color: 'orange' });
            M.text('blue: Caius buys the policy · orange: the insurer sells it', xmax, 23, { align: 'right', dx: -6, size: 11, color: 'muted' });
            drawT([['Caius, premium 800', '5,043', money(caius(800, 0.05), 1)], ['insurer, premium 800', '14,243', money(insurer(800, 0.05), 1)], ['Caius, premium 600', '20,478', money(caius(600, 0.05), 1)], ['insurer, premium 600', '29,878', money(insurer(600, 0.05), 1)]], 'fortune thresholds in rubles, 5 ships in 100 lost (§15)');
            st = { md, P, q, x0, y0 };
          } else {
            const q = sS.value / 10, nmax = 12, ev = 8000 * (1 - q);
            const base = Math.min(6000, Math.floor((semp(1, q) - 300) / 500) * 500);
            M.setView([-1, nmax + 0.7], [base, ev + 0.14 * (ev - base)]); M.setTitle('the goods spread over n ships: their value to Sempronius'); M.setLabels('number of ships n', 'value (ducats)');
            for (let n = 1; n <= nmax; n++) { const val = semp(n, q); M.rect(n - 0.32, base, n + 0.32, val, { fill: 'teal', fillAlpha: 0.55, color: 'teal', width: 1 }); if (n <= 2) M.text(money(val, 1), n, val, { dy: -10, align: n === 1 ? 'left' : 'center', dx: n === 1 ? -14 : 0, size: 10.5, weight: 600 }); }
            M.hline(ev, { color: 'green', width: 1.8, dash: [6, 4] }); M.text(`expected value ${money(ev)}: never reached`, nmax + 0.6, ev, { align: 'right', dy: -9, size: 11.5, weight: 600, color: 'green' });
            if (Math.abs(q - 0.1) < 1e-9) { M.dot(1, 6751, { r: 6, hollow: true, color: 'gold', width: 2.4 }); M.dot(2, 7033, { r: 6, hollow: true, color: 'gold', width: 2.4 }); }
            drawT([['one ship', '6,751', money(semp(1, 0.1), 1)], ['two ships', '7,033', money(semp(2, 0.1), 1)], ['ten ships', '—', money(semp(10, 0.1), 1)], ['the limit', '7,200', money(7200, 1)]], 'value of 8,000 ducats of goods, 1 ship in 10 lost (§16)');
            st = { md, q, v1: semp(1, q), v2: semp(2, q), ev };
          }
        });
        v.readout(() => {
          const s = st; if (!s.md) return '';
          if (s.md === 'paul') return `With a fortune of ${money(s.a)} ducats and the game stopped after ${s.N} tosses, the mean utility $PO$ corresponds to a sure gain $BP$ = ${v.fix(s.ce, 3)} ducats (expected payout ${v.fix(s.N / 2, 1)}). With every toss allowed the game is worth ${v.fix(s.full, 3)} to its owner and a buyer should pay at most ${v.fix(s.price, 3)}. Bernoulli's "approximately three, four and six ducats" for fortunes of 10, 100 and 1,000 compare with exact values 3.043, 4.389 and 5.972: his rounding, not his theory, is the only error.`;
          if (s.md === 'caius') return `Premium ${money(s.P)} rubles, ${v.fix(100 * s.q, 0)} ships in 100 lost (expected loss ${money(10000 * s.q)}): Caius gains from insuring if his other wealth is below **${money(s.x0)}** rubles, and an insurer gains from selling if his wealth exceeds **${money(s.y0)}**. Bernoulli's 5,043 and 14,243 for 800 rubles and 5% losses are exact to within a ruble (5,042.4 and 14,242.4). Both sides can gain at once: the premium exceeds the expected loss, which a rich insurer, for whom the risk is small, accepts gladly, while for a poorer merchant shedding the risk is worth more than the premium.`;
          return `With ${v.fix(10 * s.q, 1)} ships in ten lost, one ship makes the 8,000 ducats of goods worth ${money(s.v1, 1)}, two ships ${money(s.v2, 1)}; more ships approach the expected value ${money(s.ev)} from below. Bernoulli's 6,751 and 7,033 (for one in ten) match the exact 6,751.5 and 7,033.5: under a concave utility spreading the risk raises its value, the first statement of diversification.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.16
    {
      num: '1.16', kind: 'Paper', name: 'Le comportement de l’homme rationnel devant le risque',
      paper: { authors: 'M. Allais', year: 1953, title: 'Le comportement de l’homme rationnel devant le risque: critique des postulats et axiomes de l’école américaine', venue: 'Econometrica 21 (4): 503–546', doi: '10.2307/1907921' },
      introduces: ['behav-1.11', 'behav-1.12'],
      statement: String.raw`Allais attacked the "American school" (von Neumann–Morgenstern, Savage, Marschak, Friedman) and its claim that rational choice under risk must maximize expected utility. He argued that a rational person may value the dispersion of outcomes and, above all, **security near certainty**, and he offered thought experiments in which such a person violates the independence axiom (Savage's sure-thing principle):
- **First example (common consequence).** $A$: 100 million francs for sure, against $B$: 10% chance of 500 million, 89% of 100 million, 1% of nothing; and $C$: 11% chance of 100 million against $D$: 10% chance of 500 million. Choosing $A$ and $D$, as he expected prudent people to do, is inconsistent with expected utility (behav-1.11).
- **Second example (common ratio).** 100 million for sure against a 98% chance of 500 million; then a 1% chance of 100 million against a 0.98% chance of 500 million. Preferring the sure 100 million but the 0.98% chance of 500 million is again inconsistent (behav-1.12).

His claims were normative as well as descriptive, and concerned large sums relative to wealth.`,
      idea: String.raw`In the early 1950s expected utility had just been axiomatized (behav-1.3) and Savage was completing his subjective version; at a 1952 Paris colloquium Allais put his questions to its proponents, and Savage himself chose $A$ and $D$ before deciding that his choice had been an error. The paper made the independence axiom, which looked innocuous, the centre of the debate. Its examples became the **Allais paradox** and the **common-ratio effect**, the touchstones of every non-expected-utility theory since: Kahneman and Tversky's prospect theory (behav-2.13) began by reproducing them with smaller stakes, and rank-dependent utility and fanning-out preferences were built to accommodate them. Allais received the 1988 Nobel memorial prize, mainly for his work on markets and efficient allocation.`,
      caption: String.raw`Answer Allais's questions yourself: click one situation in each pair. The ticket grids use Savage's reformulation with 100 numbered tickets: ticket 1 is the 1% outcome, tickets 2–11 the 10%, and the outlined block of tickets 12–100 the common consequence, which is the same within each pair and is the only difference between the pairs. The second example shows the 1% versions as a 1-in-100 chance of being offered the first pair. The triangle locates all eight situations: in each example the two pairs lie on parallel segments, so expected utility must rank them alike. The readout compares the paper's prediction with later evidence.`,
      deps: ['behav-1.3'], refs: [], tags: ['history', 'expected utility', 'independence'],
      credit: 'Maurice Allais, 1953',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Allais_paradox' },
      viz(v) {
        const ex = v.select('example', [{ value: 1, label: 'first: common consequence' }, { value: 2, label: 'second: common ratio' }], 1);
        const G = v.stage({ x: [0, 100], y: [0, 36], axes: false, height: 262, full: true, title: 'Savage’s 100 tickets: click the situation you prefer in each pair' });
        const T = v.stage({ x: [-0.12, 1.1], y: [-0.17, 1.1], equal: true, axes: false, height: 330, title: 'both pairs in the triangle' });
        const R = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 330, title: 'your answers and the evidence' });
        const ans = { 1: { p: null, q: null }, 2: { p: null, q: null } };
        const SL = { 1: ['A', 'B', 'C', 'D'], 2: ['E', 'F', 'G', 'H'] };
        // ticket prizes (index 0 = ticket 1) for each situation
        const tick = (k) => (t) => {
          if (k === 'A') return 100; if (k === 'B') return t === 0 ? 0 : t <= 10 ? 500 : 100;
          if (k === 'C') return t <= 10 ? 100 : 0; if (k === 'D') return t === 0 ? 0 : t <= 10 ? 500 : 0;
          if (k === 'E') return 100; if (k === 'F') return t < 98 ? 500 : 0; return 0;
        };
        const LOT = { A: [0, 0], B: [0.01, 0.1], C: [0.89, 0], D: [0.9, 0.1], E: [0, 0], F: [0.02, 0.98], G: [0.99, 0], H: [0.9902, 0.0098] };
        const DESC = { A: '100M for sure', B: '10%: 500M · 89%: 100M · 1%: 0', C: '11%: 100M · 89%: 0', D: '10%: 500M · 90%: 0', E: '100M for sure', F: '98%: 500M · 2%: 0', G: '1% chance of E', H: '1% chance of F' };
        const boxes = [[1, 2, 24.5, 32], [25.5, 2, 49, 32], [51, 2, 74.5, 32], [75.5, 2, 99, 32]];
        G.onClick((x, y) => { const e = ex.value; boxes.forEach((b, i) => { if (inside(b, x, y)) ans[e][i < 2 ? 'p' : 'q'] = SL[e][i]; }); });
        v.legend([['faint', 'nothing', { area: true }], ['teal', '100 million', { area: true }], ['purple', '500 million', { area: true }], ['accent', 'your choice', { dot: true }]]);
        let st = {};
        const grid = (b, f, chosen, dimmed, label, desc, common, mini) => {
          const [x0, y0, x1, y1] = b;
          G.rect(x0, y0, x1, y1, { fill: chosen ? 'accent' : 'panel', fillAlpha: chosen ? 0.12 : 1, color: chosen ? 'accent' : 'faint', width: chosen ? 2.6 : 1.1, radius: 8 });
          G.text(label, x0, y1, { dx: 9, dy: 15, size: 16, weight: 800, color: chosen ? 'accent' : dimmed ? 'faint' : 'muted' });
          G.text(desc, x0, y1, { dx: 30, dy: 15, size: 10.5, weight: 600, color: dimmed ? 'muted' : 'ink' });
          const px0 = G.X(x0) + 14, py0 = G.Y(y1) + 32, side = Math.min(G.X(x1) - G.X(x0) - 28, G.Y(y0) - py0 - 10), c = side / 10;
          const cell = (t, col, alpha) => { const i = t % 10, j = Math.floor(t / 10); const [ax, ay] = G.inv(px0 + i * c + 1, py0 + j * c + 1), [bx, by] = G.inv(px0 + (i + 1) * c - 1, py0 + (j + 1) * c - 1); G.rect(ax, by, bx, ay, { fill: col, fillAlpha: alpha, stroke: false }); };
          for (let t = 0; t < 100; t++) {
            if (mini && t === 0) continue;
            const pz = f(t); cell(t, PRIZE[pz], pz === 0 ? 0.45 : 0.8);
          }
          if (mini) { // ticket 1 holds the whole first-pair lottery in miniature
            const [ax, ay] = G.inv(px0 + 1, py0 + 1), [bx, by] = G.inv(px0 + c - 1, py0 + c - 1);
            G.rect(ax, by, bx, ay, { fill: 'gold', fillAlpha: 0.9, stroke: false });
            G.text(mini, (ax + bx) / 2, (ay + by) / 2, { align: 'center', size: 9.5, weight: 800, halo: false });
          }
          if (common) { // outline tickets 12–100
            const pts = [[1, 1], [10, 1], [10, 10], [0, 10], [0, 2], [1, 2], [1, 1]].map(([i, j]) => G.inv(px0 + i * c, py0 + j * c));
            G.path(pts, { color: 'ink', width: 1.6, dash: [4, 3] });
          }
          G.text(common ? `tickets 12–100: ${common}` : mini ? `ticket 1: play ${mini}; 2–100: nothing` : '', x0, y0, { dx: 9, dy: -8, size: 10.5, color: 'muted' });
        };
        v.render(() => {
          const e = ex.value, L = SL[e], A = ans[e];
          L.forEach((k, i) => {
            const pair = i < 2 ? 'p' : 'q', chosen = A[pair] === k, dim = A[pair] && A[pair] !== k;
            const common = e === 1 ? (i < 2 ? 'common, 100M' : 'common, nothing') : null;
            grid(boxes[i], tick(k), chosen, dim, k, DESC[k], common, e === 2 && i >= 2 ? (i === 2 ? 'E' : 'F') : null);
          });
          G.text('pair 1', 25, 34.2, { align: 'center', size: 10.5, color: 'muted', weight: 600 }); G.text('pair 2', 75, 34.2, { align: 'center', size: 10.5, color: 'muted', weight: 600 });
          // triangle
          drawTriangle(T, ['0', '100M', '500M'], { size: 11 });
          drawIndiff(T, makePref('eu', e === 1 ? 0.915 : 0.985), { n: 16, color: 'blue', alpha: 0.22 });
          const segs = e === 1 ? [['A', 'B'], ['C', 'D']] : [['E', 'F'], ['G', 'H']];
          for (const [p, q] of segs) T.line(LOT[p][0], LOT[p][1], LOT[q][0], LOT[q][1], { color: 'ink', width: 2 });
          L.forEach((k, i) => { const pair = i < 2 ? 'p' : 'q', chosen = A[pair] === k; T.dot(LOT[k][0], LOT[k][1], { r: 6, color: chosen ? 'accent' : 'ink', hollow: A[pair] != null && !chosen, width: 2, label: k, labelPos: i % 2 ? 'e' : i === 0 ? 'ne' : 'nw' }); });
          T.text(e === 1 ? 'AB ∥ CD' : 'EF ∥ GH', 0.5, 0.62, { size: 13, weight: 700, color: 'ink' });
          // evidence panel
          const pat = A.p && A.q ? `${A.p}, ${A.q}` : null, allais = e === 1 ? A.p === 'A' && A.q === 'D' : A.p === 'E' && A.q === 'H';
          const consistent = A.p && A.q ? (L.indexOf(A.p) === 0) === (L.indexOf(A.q) === 2) : null;
          R.text('your answers', 0.04, 0.93, { size: 12.5, weight: 700 });
          R.text(pat ? `${pat}: ${consistent ? 'consistent with expected utility' : allais ? 'Allais’s pattern' : 'the reverse pattern'}` : 'click one situation in each pair', 0.04, 0.85, { size: 12, color: pat ? (consistent ? 'green' : 'red') : 'muted', weight: 600 });
          R.text('Allais’s prediction', 0.04, 0.73, { size: 12.5, weight: 700 });
          R.text(e === 1 ? 'a prudent person picks A and D' : 'a prudent person picks E and H', 0.04, 0.65, { size: 12, color: 'purple', weight: 600 });
          R.text('later evidence', 0.04, 0.53, { size: 12.5, weight: 700 });
          const ev = e === 1
            ? [['Savage (1952) chose A and D, then', 'called his choice an error (1954, p. 103)'], ['Kahneman–Tversky 1979, with 2,400 / 2,500:', '82% took the sure amount, 83% the long shot'], ['Blavatskyy et al. 2022, 81 experiments:', 'fragile; likeliest with big hypothetical stakes']]
            : [['Kahneman–Tversky 1979, 3,000 vs 4,000:', '80% safe at certainty, 65% risky at λ = 1/4'], ['Common-ratio reversals are strongest when', 'one option is certain (see behav-1.12)'], ['The size of the effect varies widely across', 'studies, stakes and presentation formats']];
          ev.forEach(([l1, l2], i) => { R.text(l1, 0.04, 0.44 - i * 0.15, { size: 11.5, weight: 600 }); R.text(l2, 0.04, 0.38 - i * 0.15, { size: 11.5, color: 'muted' }); });
          st = { e, A, allais, consistent, pat };
        });
        v.readout(() => {
          const { e, A, consistent, pat } = st; if (!e) return '';
          const head = e === 1
            ? `Expected utility: $EU(A)-EU(B) = 0.11\\,u(100) - 0.10\\,u(500) = EU(C) - EU(D)$, the same number whatever $u$ is, so A goes with C and B with D.`
            : `Expected utility: $EU(E)-EU(F) = u(100) - 0.98\\,u(500)$ and $EU(G) - EU(H) = 0.01\\,[u(100) - 0.98\\,u(500)]$, the same sign whatever $u$ is.`;
          const yours = pat ? ` You chose **${pat}**: ${consistent ? 'consistent with expected utility.' : 'a violation of the independence axiom.'}` : ' Click your choices to compare.';
          return head + yours + (e === 1 ? ` The paper predicted the pattern for prudent people facing large sums; today it is regarded as real but fragile: in Blavatskyy, Ortmann and Panchenko's 2022 review of 81 experiments it appears most reliably with large hypothetical payoffs like Allais's and with lotteries shown as simple probability distributions, and is often absent or even reversed in other designs.` : ` The second example is the common-ratio effect; Kahneman and Tversky's Problems 3 and 4 (1979) reproduced it with 80% and 65% majorities.`);
        });
      },
    },
  ],
};
