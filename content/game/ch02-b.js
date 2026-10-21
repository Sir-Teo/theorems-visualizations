// Game Theory & Social Choice — Chapter 2 (part b): volunteer's dilemma, sport, correlated, perfect, purification
import { C1, C2, nm, idx, expU, supportEnum, G2, d1, d2, indiff, TRI, triPt, triBary, triClamp, drawTriangle } from './ch02.shared.js';

const clamp = (t, a, b) => Math.min(b, Math.max(a, t));

export default {
  collection: 'game',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Model',
      name: 'Volunteer’s dilemma (reporting a crime)',
      credit: 'Andreas Diekmann, 1985',
      statement: String.raw`Each of $n\ge2$ bystanders may call for help. Help arrives if at least one calls; it is worth $v$ to each bystander, and calling costs the caller $c$, with $0<c<v$. Payoffs: $v-c$ to a caller; $v$ to a non-caller if somebody else calls; $0$ if nobody calls. There are $n$ pure equilibria (exactly one person calls), all asymmetric. The **symmetric** equilibrium has every bystander call with probability
$$p^*=1-\Bigl(\frac cv\Bigr)^{1/(n-1)},$$
fixed by indifference: $v-c=v\bigl(1-(1-p^*)^{n-1}\bigr)$. The probability that **someone** calls is $1-(c/v)^{n/(n-1)}$, which *decreases* in $n$ towards $1-c/v$, while each individual's $p^*$ falls to $0$: a bigger crowd is not safer.`,
      idea: String.raw`A bystander who calls pays $c$ for sure; one who stays silent gains $v$ only if somebody else calls. In a mixed equilibrium she must be indifferent between the two (game-2.2): $c/v$ equals the probability $(1-p)^{n-1}$ that nobody else calls. Solving for $p$ gives the formula; the more others there are, the less each needs to do, and the force is strong enough that the total chance of help falls rather than rises with $n$. The asymmetric pure equilibria need a coordination device that bystanders typically lack, which is why the symmetric mixed one is the focus.`,
      caption: String.raw`Slide the crowd size $n$ and the cost-to-value ratio $c/v$ (take $v=1$). Left: the individual calling probability $p^*$ and the probability that help arrives, against $n$, with the limit $1-c/v$ dashed. Right: payoff of calling (flat) against the payoff of waiting as a function of the others' common $p$; they cross at $p^*$. Press *simulate* to draw 3000 independent rounds in which everyone follows $p^*$ and compare the observed frequency of help with the formula. Set $c/v$ near $0$ or $1$ and see what changes.`,
      scope: String.raw`Symmetric players, one-shot simultaneous choice, help is a pure public good (one call suffices), no communication; $n$ equals the number who could call.`,
      deps: ['game-2.2'],
      refs: ['Osborne §4.8'],
      tags: ['public goods', 'mixed equilibrium'],
      links: { wikipedia: "https://en.wikipedia.org/wiki/Volunteer's_dilemma" },
      viz(v) {
        const A = v.stage({ x: [2, 20], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'number of bystanders n', ylabel: 'probability', title: 'a larger crowd is no safer' });
        const B = v.stage({ x: [0, 1], y: [0, 1.02], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'others’ calling probability p', ylabel: 'my payoff (v = 1)', title: 'indifference at n and c/v' });
        const N = v.slider('bystanders $n$', 2, 20, 5, { int: true });
        const R = v.slider('cost / value $c/v$', 0.05, 0.95, 0.3, { step: 0.01 });
        let seed = 1, sim = null;
        v.button('Simulate 3000 rounds', () => { seed += 1; sim = null; });
        const pstar = (n, r) => 1 - r ** (1 / (n - 1)), anyCall = (n, r) => 1 - r ** (n / (n - 1));
        let st = null;
        v.render(() => {
          const n = N.value, r = R.value, p = pstar(n, r), P = anyCall(n, r);
          A.fn((x) => pstar(Math.max(x, 2), r), { domain: [2, 20], color: C1, width: 2.5 });
          A.fn((x) => anyCall(Math.max(x, 2), r), { domain: [2, 20], color: 'green', width: 2.5 });
          A.hline(1 - r, { color: 'green', dash: true, width: 1.5 });
          A.text('limit $1-c/v$', 19.8, 1 - r, { align: 'right', dy: 16, size: 11.5, color: 'green' });
          for (let k = 2; k <= 20; k++) { A.dot(k, pstar(k, r), { r: 3, color: C1 }); A.dot(k, anyCall(k, r), { r: 3, color: 'green' }); }
          A.vline(n, { color: 'gold', dash: true, width: 1.5 });
          A.dot(n, p, { r: 7, color: C1 }); A.dot(n, P, { r: 7, color: 'green' });
          B.hline(1 - r, { color: C1, width: 3 }); B.text('call: $1-c/v$', 0.02, 1 - r, { dy: -12, size: 12, weight: 700, color: C1 });
          B.fn((x) => 1 - (1 - x) ** (n - 1), { domain: [0, 1], color: 'purple', width: 3 });
          B.text('wait: $1-(1-p)^{n-1}$', 0.98, 0.15, { align: 'right', size: 12, weight: 700, color: 'purple' });
          B.vline(p, { color: 'gold', dash: true, width: 1.5 }); B.dot(p, 1 - r, { r: 8, color: 'green' });
          if (!sim) { const rg = v.rng(seed * 977 + n); let hits = 0; for (let t = 0; t < 3000; t++) { let any = false; for (let i = 0; i < n; i++) if (rg() < p) { any = true; break; } if (any) hits++; } sim = { hits, key: `${seed}|${n}|${r}` }; }
          st = { n, r, p, P, hits: sim.hits };
        });
        v.legend([[C1, 'individual $p^*$'], ['green', 'someone calls'], ['purple', 'payoff of waiting']]);
        v.readout(() => {
          if (!st) return '';
          const { n, r, p, P, hits } = st;
          return `$n=${n}$, $c/v=${v.fix(r, 2)}$: $p^*=${v.fix(p, 4)}$ each; help arrives with probability **${v.fix(P, 4)}** (limit as $n\\to\\infty$: ${v.fix(1 - r, 2)}; for $n=2$: ${v.fix(1 - r * r, 4)})\nSimulation (seed ${seed}): ${hits} of 3000 rounds had a caller = ${v.fix(hits / 3000, 4)} — formula ${v.fix(P, 4)} ✓ · calling gives $${v.fix(1 - r, 3)}$, waiting gives $${v.fix(1 - (1 - p) ** (n - 1), 3)}$ at $p^*$: indifferent`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Phenomenon',
      name: 'Mixed equilibria in sport: penalty kicks and serves',
      credit: 'Ignacio Palacios-Huerta, 2003; numerical table from his expanded 2017 study',
      statement: String.raw`A penalty kick is a $2\times2$ zero-sum game between kicker and goalkeeper: the kicker aims left or right, the goalkeeper dives left or right at the same moment, and the payoff to the kicker is the probability $S_{ij}$ of a goal. With $S_{LL},S_{RR}$ (keeper guesses correctly) lower than $S_{LR},S_{RL}$, there is no pure equilibrium and the unique equilibrium mixes so that each player is indifferent (game-2.2); in particular, **the kicker's scoring probability is the same whichever side she aims at**, and so is the goalkeeper's save probability. Studies of professional data find that scoring rates by side are statistically very close, and that choices look unpredictable — striking support for the theory, though not perfect: kickers are close to but not exactly at the equilibrium mixture, and some studies reject serial independence in other settings.`,
      idea: String.raw`For the zero-sum payoffs $S$, kicker's $p^*=\dfrac{S_{RR}-S_{RL}}{S_{LL}-S_{LR}-S_{RL}+S_{RR}}$ and the keeper's $q^*$ come from the indifference equations; the value of the game is the equalised scoring rate. What makes sport a good test is that stakes are high, the actions are clear, and payoffs (win probability) are naturally measured on a cardinal scale. Observed frequencies need not be exactly the equilibrium ones: a small shift of one player's mixture changes nothing for him in equilibrium, so the **success rates** — not the frequencies — are the sharper test, and they are close to equal.`,
      caption: String.raw`The editable scoring probabilities start from Palacios-Huerta’s expanded sample of **9,017 kicks, September 1995–June 2012**, reported in *Strictly Competitive Strategic Situations* (2017), p. 22: rows are the kicker’s L/R choice and columns the keeper’s L/R choice. These are not the smaller 2003 sample. The gold point starts at the reported empirical mixture (kicker L 38.97%, keeper L 41.17%); drag it to try your own mixture. The green point is the equilibrium computed from the displayed payoffs. The bars compare success rates by action, which become equal at equilibrium.`,
      scope: String.raw`Holds for the stylised two-action game: it ignores the centre of the goal, the kicker's strong and weak side being tied to foot, game state and pressure, and pooling many kickers.`,
      deps: ['game-2.2'],
      refs: ['Palacios-Huerta (2017), Economía Industrial 403:19–28, p. 22; https://www.mintur.gob.es/Publicaciones/Publicacionesperiodicas/EconomiaIndustrial/RevistaEconomiaIndustrial/403/PALACIOS%20HUERTA.pdf', 'Osborne §4.6'],
      tags: ['minimax', 'empirical'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Penalty_kick_(association_football)#Game_theory' },
      viz(v) {
        const M = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'p = P(kicker aims left)', ylabel: 'q = P(keeper dives left)', title: 'probability of a goal' });
        const Bar = v.stage({ x: [0, 6], y: [0, 100], axes: 'box', gutter: true, height: 340, weight: 1, ylabel: 'per cent', title: 'success rate by choice' });
        const sLL = v.slider('goal if kicker L, keeper L (%)', 30, 100, 59.11, { step: 0.1 }), sLR = v.slider('kicker L, keeper R', 30, 100, 94.10, { step: 0.1 });
        const sRL = v.slider('kicker R, keeper L', 30, 100, 93.10, { step: 0.1 }), sRR = v.slider('kicker R, keeper R', 30, 100, 71.22, { step: 0.1 });
        const h = M.handle(0.3897, 0.4117, { color: 'gold', label: 'trial', constrain: { x: [0, 1], y: [0, 1] }, r: 8 });
        const eq = () => { const a = sLL.value, b = sLR.value, c = sRL.value, d = sRR.value, den = a - b - c + d; if (Math.abs(den) < 1e-9) return null; const p = (d - c) / den, q = (d - b) / den; return p > 0 && p < 1 && q > 0 && q < 1 ? { p, q, val: (a * d - b * c) / den } : null; };
        const S = (p, q) => p * q * sLL.value + p * (1 - q) * sLR.value + (1 - p) * q * sRL.value + (1 - p) * (1 - q) * sRR.value;
        let st = null;
        v.render(() => {
          const e = eq();
          M.heat(S, { cmap: 'theme', color: 'green', range: [Math.min(sLL.value, sLR.value, sRL.value, sRR.value), 100], res: 3, key: `${sLL.value}|${sLR.value}|${sRL.value}|${sRR.value}` });
          M.contour(S, Array.from({ length: 8 }, (_, k) => 60 + 5 * k), { color: 'ink', alpha: 0.3, width: 1 });
          if (e) { M.dot(e.p, e.q, { r: 9, color: 'green' }); M.text('equilibrium', e.p, e.q, { dx: 12, dy: 18, align: 'left', color: 'green', weight: 700, size: 12 }); }
          const p = h.x, q = h.y;
          const kL = q * sLL.value + (1 - q) * sLR.value, kR = q * sRL.value + (1 - q) * sRR.value;
          const gL = p * sLL.value + (1 - p) * sRL.value, gR = p * sLR.value + (1 - p) * sRR.value; // goal % against dive L / dive R
          const bars = [[1, kL, C1, 'kick L'], [2, kR, 'teal', 'kick R'], [4, 100 - gL, C2, 'dive L'], [5, 100 - gR, 'pink', 'dive R']];
          bars.forEach(([x, y, c, t]) => { Bar.rect(x - 0.38, 0, x + 0.38, y, { fill: c, fillAlpha: 0.55, color: c, width: 1.5 }); Bar.text(`${v.fix(y, 1)}`, x, y, { align: 'center', dy: -10, size: 12, weight: 700, color: c }); Bar.text(t, x, 0, { align: 'center', dy: 14, size: 11.5, color: c, weight: 600, baseline: 'top' }); });
          Bar.text('kicker: goal %', 1.5, 100, { align: 'center', size: 11.5, color: 'muted', dy: 10, baseline: 'top' }); Bar.text('keeper: save %', 4.5, 100, { align: 'center', size: 11.5, color: 'muted', dy: 10, baseline: 'top' });
          if (e) { Bar.hline(e.val, { color: 'green', dash: true, width: 1.5 }); }
          st = { e, p, q, kL, kR, gL, gR };
        });
        v.readout(() => {
          if (!st) return '';
          const { e, p, q, kL, kR, gL, gR } = st;
          const eqs = e ? `equilibrium: kicker aims left with probability **${v.fix(100 * e.p, 1)}%**, keeper dives left with **${v.fix(100 * e.q, 1)}%**, goal probability **${v.fix(e.val, 1)}%** whichever side is chosen` : 'no completely mixed equilibrium for these numbers: one action is dominant';
          return `${eqs}\nAt your point $(p,q)=(${v.fix(p, 2)},${v.fix(q, 2)})$: kicking left scores ${v.fix(kL, 1)}%, right ${v.fix(kR, 1)}% (gap ${v.fix(Math.abs(kL - kR), 1)} points); keeper saves ${v.fix(100 - gL, 1)}% diving left, ${v.fix(100 - gR, 1)}% right · at equilibrium both gaps are $0$ — the source tests reported success-rate equality, rather than asserting that these aggregate payoffs describe every individual`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Definition',
      name: 'Correlated equilibrium',
      credit: 'Robert J. Aumann, 1974',
      statement: String.raw`A **correlated equilibrium** of a finite game is a probability distribution $\mu$ on the set $A$ of action profiles such that, when a mediator draws $a\sim\mu$ and privately recommends $a_i$ to each player $i$, no player gains by disobeying: for every player $i$ and all actions $a_i,a_i'$,
$$\begin{gathered}\sum_{a_{-i}}\mu(a_i,a_{-i})\bigl[\\
 u_i(a_i,a_{-i})-\\
 u_i(a_i',a_{-i})\bigr]\ \ge\ 0 .\end{gathered}$$
These are finitely many linear inequalities in $\mu$, so the set of correlated equilibria is a nonempty convex polytope (a linear-programming feasible set, algo-11.15). Every Nash equilibrium is one (take $\mu$ a product distribution), as is every convex combination of Nash equilibria; but the polytope is generally larger, and can contain outcomes with higher payoffs than any Nash equilibrium.`,
      idea: String.raw`Each obedience inequality says: *conditional on being told $a_i$, following it is a best reply*, with the other players' behaviour computed from $\mu$. A Nash equilibrium satisfies them because the conditional distribution of $a_{-i}$ does not depend on the recommendation. Correlation can do more: in Chicken a traffic light that says "go" to one driver and "stop" to the other, with the third state (both stop) as likely as each of the others, gives each driver $5$, better than the mixed equilibrium's $4\tfrac23$ — and no driver wants to disobey. Nonemptiness is immediate from Nash's theorem (game-2.3).

The finite-partition formula in prob 4.1.1a turns obedience into conditional expected utility. On a positive-probability recommendation event, divide the weighted payoff difference in the displayed inequality by its recommendation probability; the result is the conditional gain from obeying rather than switching. Since this divisor is positive, the sign is unchanged. If that recommendation has zero mass, every joint term in its inequality is zero, so the inequality is vacuous and no conditional distribution at a null event is required. Correlated recommendations need not factor into independent player mixtures.`,
      caption: String.raw`Chicken with Aumann's payoffs (switch to other games). Pick the probability $\mu(\text{both dare})$ with the slider; the triangle then shows all distributions on the other three cells, and the shaded region is where all four obedience inequalities hold. Drag the gold point: the right panel plots the resulting pair of expected payoffs against the polygon of all correlated-equilibrium payoffs, with the Nash payoffs (rings) and their convex hull, which is smaller. Outside the shaded region a red message names the inequality that fails — a player would rather disobey the light.`,
      deps: ['game-2.3', 'algo-11.15', 'prob-4.1.1a'],
      refs: ['MSZ §8.2'],
      tags: ['correlated equilibrium', 'mediator'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Correlated_equilibrium' },
      viz(v) {
        let g = G2.chicken;
        const T = v.stage({ x: [-0.15, 1.15], y: [-0.2, 1.0], equal: true, axes: false, height: 340, weight: 1, title: 'distributions on three cells' });
        const P = v.stage({ x: [0, 8], y: [0, 8], axes: 'box', gutter: true, height: 340, weight: 1, equal: true, xlabel: 'row player’s expected payoff', ylabel: 'column player’s', title: 'what the players get' });
        const dd = v.slider('$\\mu(\\text{last cell})$', 0, 0.5, 0, { step: 0.005 });
        v.select('game', ['chicken', 'bos', 'stag', 'pd'].map((k) => ({ value: k, label: G2[k].label })), 'chicken', { onChange: (k) => { g = G2[k]; } });
        const hT = T.handle(0.4, 0.3, { color: 'gold', label: 'μ', constrain: triClamp, r: 8 });
        // constraints: list of coefficient vectors c (over cells 00, 01, 10, 11) with c . mu >= 0
        const cons = () => {
          const A = g.A, B = g.B, out = [];
          for (const i of [0, 1]) { const k = 1 - i; out.push({ c: [0, 1].flatMap((ii) => [0, 1].map((j) => (ii === i ? A[i][j] - A[k][j] : 0))), name: `row told ${g.R[i]} prefers ${g.R[k]}` }); }
          for (const j of [0, 1]) { const k = 1 - j; out.push({ c: [0, 1].flatMap((i) => [0, 1].map((jj) => (jj === j ? B[i][j] - B[i][k] : 0))), name: `column told ${g.C[j]} prefers ${g.C[k]}` }); }
          return out;
        };
        const mu4 = (b, d) => [(1 - d) * b[0], (1 - d) * b[1], (1 - d) * b[2], d];
        const pay = (m) => [0, 1].reduce((s, i) => s + [0, 1].reduce((t, j) => t + m[2 * i + j] * g.A[i][j], 0), 0).valueOf();
        const pay2 = (m) => [0, 1].reduce((s, i) => s + [0, 1].reduce((t, j) => t + m[2 * i + j] * g.B[i][j], 0), 0);
        const lastName = () => `(${g.R[1]}, ${g.C[1]})`;
        const vertices = () => {
          const cs = cons(), ineq = [...[0, 1, 2, 3].map((k) => ({ c: [0, 1, 2, 3].map((t) => (t === k ? 1 : 0)) })), ...cs], out = [];
          const pick = (arr, k, s = 0, cur = []) => (cur.length === k ? [cur.slice()] : arr.slice(s).flatMap((_, i) => pick(arr, k, s + i + 1, [...cur, s + i])));
          for (const comb of pick(ineq, 3)) {
            const M = [[1, 1, 1, 1], ...comb.map((i) => ineq[i].c)];
            const sol = v.M.solve(M, [1, 0, 0, 0]);
            if (!sol || sol.some((x) => !isFinite(x))) continue;
            if (sol.every((x) => x > -1e-9) && cs.every((q) => q.c.reduce((s, a, i) => s + a * sol[i], 0) > -1e-9)) out.push(sol);
          }
          return out;
        };
        let st = null;
        v.render(() => {
          const cs = cons(), d = dd.value, A = g.A, B = g.B, VT = vertices();
          // the region in the triangle
          const key = `${g.label}|${d}`;
          T.raster((x, y) => { const b = triBary(x, y); if (b.some((t) => t < 0)) return null; const m = mu4(b, d); const ok = cs.every((q) => q.c.reduce((s, a, i) => s + a * m[i], 0) >= -1e-9); const c = v.rgb(ok ? 'green' : 'faint'); return [c[0], c[1], c[2], ok ? 0.35 : 0.1]; }, { res: 3, key });
          const names = [`(${g.R[0]},${g.C[0]})`, `(${g.R[0]},${g.C[1]})`, `(${g.R[1]},${g.C[0]})`];
          drawTriangle(T, v, { labels: names });
          T.text(`last cell ${lastName()} has probability ${nm(d, 3)}; the rest is split here`, 0.5, -0.12, { align: 'center', size: 11.5, color: 'muted' });
          // Nash equilibria that put probability d on the last cell
          const NE = supportEnum(A, B);
          NE.forEach((e) => { const m = [0, 1].flatMap((i) => [0, 1].map((j) => e.x[i] * e.y[j])); if (Math.abs(m[3] - d) < 0.02 && d < 1) { const b = [m[0], m[1], m[2]].map((t) => t / (1 - d)); const q = triPt(b); T.dot(q[0], q[1], { r: 10, hollow: true, color: 'green', width: 2.5 }); } });
          const b = triBary(hT.x, hT.y).map((t) => Math.max(0, t)), sb = b.reduce((a, c) => a + c) || 1, m = mu4(b.map((t) => t / sb), d);
          const viol = cs.filter((q) => q.c.reduce((s, a, i) => s + a * m[i], 0) < -1e-9);
          // payoff panel
          const pts = VT.map((s) => [pay(s), pay2(s)]);
          const hull = pts.length >= 3 ? v.M.hull(pts) : pts;
          const lo = Math.min(...[...A.flat(), ...B.flat()]), hi = Math.max(...[...A.flat(), ...B.flat()]);
          P.setView([lo - 0.5, hi + 0.8], [lo - 0.5, hi + 0.8]);
          if (hull.length > 2) P.poly(hull, { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2 });
          const nep = NE.map((e) => [expU(A, B, e.x, e.y)[0], expU(A, B, e.x, e.y)[1]]);
          if (nep.length > 2) P.poly(v.M.hull(nep), { fill: 'accent', fillAlpha: 0.08, color: 'accent', dash: true, width: 1.5 });
          nep.forEach((q, i) => P.dot(q[0], q[1], { r: 9, hollow: true, color: 'accent', width: 2.5 }));
          const u = [pay(m), pay2(m)];
          P.dot(u[0], u[1], { r: 8, color: viol.length ? 'red' : 'gold' });
          const best = pts.length ? Math.max(...pts.map((q) => q[0] + q[1])) : 0, bestNE = Math.max(...nep.map((q) => q[0] + q[1]));
          st = { m, u, viol, best, bestNE, n: VT.length };
        });
        v.legend([['green', 'correlated-equilibrium payoffs'], ['accent', 'Nash payoffs and their hull', { dot: true }], ['gold', 'your $\\mu$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { m, u, viol, best, bestNE } = st;
          const ok = viol.length === 0;
          return `$\\mu=(${m.map((t) => v.fix(t, 3)).join(',\\,')})$ on (both ${g.R[0]}, ${g.R[0]}/${g.C[1]}, ${g.R[1]}/${g.C[0]}, both ${g.R[1]}) · payoffs $(${v.fix(u[0], 2)}, ${v.fix(u[1], 2)})$, total ${v.fix(u[0] + u[1], 2)}\n${ok ? '**Every obedience inequality holds: a correlated equilibrium ✓**' : '**Disobedience pays:** ' + viol.map((q) => q.name).join('; ')} · best total over all correlated equilibria **${v.fix(best, 2)}** vs best Nash **${v.fix(bestNE, 2)}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Definition',
      name: 'Trembling-hand perfect equilibrium',
      credit: 'Reinhard Selten, 1975',
      statement: String.raw`For a finite strategic game, an **action-specific perturbation** chooses positive lower bounds $\eta_i(a)>0$ for each player's pure actions, with $\sum_a\eta_i(a)<1$, and requires $\sigma_i(a)\ge\eta_i(a)$. A profile is a **trembling-hand perfect equilibrium** if it is a limit of equilibria of such perturbed games along a sequence whose every lower bound tends to zero. Requiring the same epsilon on all actions is one particular perturbation family, used in the illustration; its limits are perfect, but need not include every perfect equilibrium. Every finite game has a perfect equilibrium; every perfect equilibrium is a Nash equilibrium; in a two-player game a Nash equilibrium is perfect iff neither player's strategy is weakly dominated. Perfection therefore rules out equilibria that rely on a weakly dominated action being played "because nobody can lose by it".`,
      idea: String.raw`A weakly dominated pure action can be a best reply only when the opponents assign zero probability to the profiles where its dominator does strictly better. Positive trembles give those profiles positive mass, so the dominated action is strictly worse in expected payoff and receives only its required lower-bound probability in a perturbed equilibrium. Existence can use the special common-epsilon family: apply Nash's theorem to each sufficiently small perturbed game and select a convergent subsequence by compactness. This does not assert that this particular family reaches every perfect equilibrium.

The distinction has a finite witness. Let the row payoffs be A=(0,1,0), B=(0,0,2), and let the column player receive (1,0,0) against either row, so L is strictly dominant. The profile (A,L) is Nash and undominated. For $0<\delta<1/5$, row probabilities $(1-\delta,\delta)$ and column probabilities $(1-4\delta,3\delta,\delta)$ are equilibria when the positive lower bounds are $(\delta,\delta)$ for the row and $(\delta,3\delta,\delta)$ for the column. A beats B by delta and L strictly beats R and S; the required smaller probabilities are exactly the binding lower bounds. These equilibria converge to (A,L). Under common epsilon, however, the column must use $(1-2\varepsilon,\varepsilon,\varepsilon)$ and B beats A by epsilon, so that family's limit cannot be (A,L). The illustration's finite small-epsilon ring test is a diagnostic for its displayed family, not a definition or proof of full perfection.

The existence proof needs a sequence argument beyond Nash existence. If player i has m_i actions, choose a sequence of positive trembles tending to zero, each smaller than $1/\max_i m_i$. Write every feasible mixture as $\sigma_i(a)=\varepsilon+(1-m_i\varepsilon)q_i(a)$ with q_i in the ordinary simplex. Payoffs remain affine in each q_i separately, so evaluating them at pure q-profiles defines a finite game to which game-2.3 applies. The resulting perturbed equilibria lie in the compact product of the original probability simplices. PMA 3.6 therefore supplies a convergent subsequence, whose trembles still tend to zero. For any pure deviation, its feasible approximation puts epsilon on the other actions and the remaining probability on that action. The perturbed best-response inequality holds against this approximation; continuity of finite expected payoffs lets the inequality pass to the subsequence limit. Thus that limit is Nash. Compactness provides the limiting profile, not uniqueness, convergence of every chosen equilibrium sequence or a numerical cutoff certificate.`,
      caption: String.raw`Pick a shown two-action game and shrink the common epsilon (log scale). This illustration uses the **uniform family**, confining each player's first-action probability to $[\varepsilon,1-\varepsilon]$. The blue and orange steps are best-reply correspondences within that square, and green dots are its equilibria. The right panel samples these equilibria for epsilon from0.001 to0.5, with p in blue and q in orange; it does not compute a limit at zero. Rings mark Nash equilibria of the unperturbed game: green means within Euclidean distance0.004 of an equilibrium sampled at epsilon0.001; red means outside that finite threshold. Neither verdict proves a limiting classification. Full perfection allows general action-specific lower bounds as in the definition; a particular uniform family need not reach every perfect equilibrium.`,
      deps: ['game-2.3', 'pma-3.6'],
      refs: ['MSZ §7.3'],
      tags: ['refinement', 'perfection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Trembling_hand_perfect_equilibrium' },
      viz(v) {
        const games = {
          weak: { label: 'weak dominance', R: ['T', 'B'], C: ['L', 'R'], A: [[1, 0], [0, 0]], B: [[1, 0], [0, 0]] },
          chicken: G2.chicken, bos: G2.bos, pennies: G2.pennies,
        };
        let g = games.weak;
        const SQ = v.stage({ x: [-0.14, 1.1], y: [-0.2, 1.1], axes: false, height: 340, weight: 1, title: 'perturbed best replies' });
        const SE = v.stage({ x: [1e-3, 0.5], y: [-0.05, 1.05], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'tremble ε', ylabel: 'equilibrium p (blue), q (orange)', title: 'equilibria of the perturbed games' });
        v.select('game', [{ value: 'weak', label: 'weakly dominated NE' }, { value: 'chicken', label: 'Chicken' }, { value: 'bos', label: 'Bach or Stravinsky' }, { value: 'pennies', label: 'Matching Pennies' }], 'weak', { onChange: (k) => { g = games[k]; } });
        const E = v.slider('tremble $\\varepsilon$', 1e-3, 0.45, 0.12, { log: true, sig: 2 });
        const eqEps = (e) => {
          const A = g.A, B = g.B, tol = 1e-9, out = [];
          const t1 = indiff((q) => d1(A, q)), t2 = indiff((p) => d2(B, p));
          const Ps = [e, 1 - e], Qs = [e, 1 - e];
          if (t2 != null && t2 > e && t2 < 1 - e) Ps.push(t2); if (t1 != null && t1 > e && t1 < 1 - e) Qs.push(t1);
          const ok = (own, dv) => (dv > tol ? Math.abs(own - (1 - e)) < tol : dv < -tol ? Math.abs(own - e) < tol : true);
          for (const p of Ps) for (const q of Qs) if (ok(p, d1(A, q)) && ok(q, d2(B, p))) out.push([p, q]);
          return out;
        };
        const curve = (() => { const o = []; for (let k = 0; k <= 60; k++) { o.push(1e-3 * (0.5 / 1e-3) ** (k / 60)); } return o; })();
        const br = (dv, e) => (dv > 1e-9 ? [1 - e, 1 - e] : dv < -1e-9 ? [e, e] : [e, 1 - e]);
        let st = null;
        v.render(() => {
          const e = E.value, A = g.A, B = g.B;
          SQ.rect(e, e, 1 - e, 1 - e, { fill: 'muted', fillAlpha: 0.06, color: 'muted', width: 1.2, dash: true });
          SQ.rect(0, 0, 1, 1, { color: 'muted', width: 1 });
          [0, 0.5, 1].forEach((t) => { SQ.text(String(t), t, -0.03, { align: 'center', baseline: 'top', size: 10.5, color: 'muted' }); SQ.text(String(t), -0.03, t, { align: 'right', size: 10.5, color: 'muted' }); });
          SQ.text('p = P(row plays ' + g.R[0] + ')', 0.5, -0.1, { align: 'center', baseline: 'top', size: 11.5, color: C1, weight: 600 });
          SQ.text('q = P(column plays ' + g.C[0] + ')', -0.12, 1.07, { align: 'left', size: 11.5, color: C2, weight: 600 });
          // correspondences, sampled in the confined square
          const N = 240;
          const pts1 = [], pts2 = [];
          for (let k = 0; k <= N; k++) { const q = e + (1 - 2 * e) * (k / N), s = br(d1(A, q), e); pts1.push([s[0], q], [s[1], q], null); const p = e + (1 - 2 * e) * (k / N), s2 = br(d2(B, p), e); pts2.push([p, s2[0]], [p, s2[1]], null); }
          const segs1 = [], segs2 = [];
          for (let k = 0; k <= N; k++) { const q = e + (1 - 2 * e) * (k / N), s = br(d1(A, q), e); SQ.line(s[0], q, s[1], q, { color: C1, width: 5, alpha: 0.5 }); const p = e + (1 - 2 * e) * (k / N), s2 = br(d2(B, p), e); SQ.line(p, s2[0], p, s2[1], { color: C2, width: 2.5, alpha: 0.9 }); }
          const eqs = eqEps(e);
          eqs.forEach(([p, q]) => SQ.dot(p, q, { r: 8, color: 'green' }));
          // Nash equilibria of the unperturbed game: perfect or not
          const NE = supportEnum(A, B).map((s) => [s.x[0], s.y[0]]);
          const small = curve[0], lim = eqEps(small);
          const status = NE.map(([p, q]) => ({ p, q, perfect: lim.some(([a, b]) => Math.hypot(a - p, b - q) < 4 * small) }));
          status.forEach((s) => SQ.dot(s.p, s.q, { r: 14, hollow: true, color: s.perfect ? 'green' : 'red', width: 2.5 }));
          // right panel
          for (const x of curve) for (const [p, q] of eqEps(x)) { SE.dot(x, p, { r: 4, color: C1 }); SE.dot(x, q, { r: 2, color: C2 }); }
          SE.vline(e, { color: 'gold', dash: true, width: 1.5 });
          status.forEach((s) => { SE.dot(1.1e-3, s.p, { r: 7, hollow: true, color: s.perfect ? 'green' : 'red', width: 2 }); });
          st = { eqs, status, e };
        });
        v.legend([[C1, 'row best replies'], [C2, 'column best replies'], ['green', 'ε-equilibrium', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { eqs, status, e } = st;
          const nm2 = (s) => `(${v.fix(s.p, 2)}, ${v.fix(s.q, 2)}) ${s.perfect ? '**perfect ✓**' : '**not perfect ✗**'}`;
          return `$\\varepsilon=${v.fix(e, 4)}$: the perturbed game has **${eqs.length}** equilibri${eqs.length === 1 ? 'um' : 'a'}: ${eqs.map(([p, q]) => `$(${v.fix(p, 3)}, ${v.fix(q, 3)})$`).join(', ') || 'none'}\nNash equilibria $(p,q)$ of the original game: ${status.map(nm2).join(' · ')}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Harsanyi purification',
      credit: 'John C. Harsanyi, 1973',
      statement: String.raw`Take a finite game and let each player $i$ observe, before choosing, a private payoff shock: her payoff from action $a$ becomes $u_i(a,\cdot)+\varepsilon\,\theta_i^a$, where the $\theta_i^a$ are independent across players and actions with a smooth density, and $\varepsilon>0$ is small. In this game of incomplete information every equilibrium consists of **pure** decision rules: given her shock, a player chooses the action with the highest perturbed expected payoff, and with probability one there is no tie. Harsanyi showed that for **almost every** payoff vector, every mixed equilibrium $\sigma^*$ of the original game is the limit, as $\varepsilon\to0$, of the induced *action frequencies* in such equilibria. A mixed strategy can thus be read as a pure plan that depends on tiny unobserved differences between players.`,
      idea: String.raw`Player $i$'s decision is a threshold rule: choose the first action iff her payoff advantage $D_i$ exceeds minus her shock, so the frequency with which she plays it is $F(D_i/\varepsilon)$, a smoothed version of the best-reply step. The equilibrium is the crossing of these two smooth curves (game-2.4's correspondences, softened). As $\varepsilon\to0$ the curves become the step correspondences, and the crossing must approach a crossing of steps, i.e. a Nash equilibrium (game-2.3): in the interior this means the advantage tends to zero (indifference, game-2.2) at exactly the mixing probabilities, which a generic game's regular equilibria keep. The 'almost every' is genuine: for special payoff vectors such a limit may not exist.`,
      caption: String.raw`A $2\times2$ game with a unique mixed equilibrium. Each player's advantage from the first action is perturbed by a private shock with the chosen distribution (standard deviation one) scaled by $\varepsilon$. Left: the shock density of the row player at the equilibrium belief; the shaded part is where she plays her first action, its area being her mixing probability. Centre: the smoothed best replies, crossing at the induced action frequencies, over the original steps. Right: as $\varepsilon\to0$ the frequencies converge to the mixed equilibrium (dashed). *Draw* 2000 shock pairs: every player used a pure rule, yet the frequencies match.`,
      deps: ['game-2.3'],
      refs: ['MSZ §9.5'],
      tags: ['purification', 'incomplete information'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Purification_theorem' },
      viz(v) {
        const games = {
          pennies: { label: 'Matching Pennies', R: ['Heads', 'Tails'], C: ['Heads', 'Tails'], A: [[1, -1], [-1, 1]], B: [[-1, 1], [1, -1]] },
          asym: { label: 'asymmetric zero-sum', R: ['H', 'T'], C: ['H', 'T'], A: [[3, -1], [-1, 1]], B: [[-3, 1], [1, -1]] },
          nonzero: { label: 'non-zero-sum', R: ['U', 'D'], C: ['L', 'R'], A: [[3, 0], [1, 2]], B: [[0, 3], [2, 1]] },
        };
        let g = games.asym;
        const SD = v.stage({ x: [-3.5, 3.5], y: [0, 0.8], axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: 'row player’s shock θ', ylabel: 'density', title: 'a private shock' });
        const SQ = v.stage({ x: [-0.14, 1.1], y: [-0.2, 1.1], axes: false, height: 320, weight: 1, title: 'smoothed best replies' });
        const SC = v.stage({ x: [0.01, 3], y: [-0.05, 1.05], xlog: true, axes: 'box', gutter: true, height: 320, weight: 0.9, xlabel: 'shock size ε', ylabel: 'frequency of first action', title: 'ε → 0' });
        v.select('game', Object.keys(games).map((k) => ({ value: k, label: games[k].label })), 'asym', { onChange: (k) => { g = games[k]; } });
        const dist = v.select('shock distribution', [{ value: 'normal', label: 'normal' }, { value: 'unif', label: 'uniform' }, { value: 'logis', label: 'logistic' }], 'normal');
        const E = v.slider('shock size $\\varepsilon$', 0.01, 3, 0.4, { log: true, sig: 2 });
        let seed = 1;
        v.button('Draw 2000 shocks', () => { seed += 1; });
        const s3 = Math.sqrt(3);
        const F = (z) => (dist.value === 'normal' ? 0.5 * (1 + v.M.erf(z / Math.SQRT2)) : dist.value === 'unif' ? clamp(0.5 + z / (2 * s3), 0, 1) : 1 / (1 + Math.exp((-z * Math.PI) / s3)));
        const f = (z) => (dist.value === 'normal' ? Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) : dist.value === 'unif' ? (Math.abs(z) <= s3 ? 1 / (2 * s3) : 0) : (() => { const k = Math.PI / s3, e = Math.exp(-k * z); return (k * e) / (1 + e) ** 2; })());
        const solve = (e) => {
          const A = g.A, B = g.B, q = (p) => F(d2(B, p) / e), h = (p) => F(d1(A, q(p)) / e) - p;
          let lo = 0, hi = 1; for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (h(mid) > 0) lo = mid; else hi = mid; }
          const p = (lo + hi) / 2; return [p, q(p)];
        };
        const grid = (() => { const o = []; for (let k = 0; k <= 50; k++) o.push(0.01 * 300 ** (k / 50)); return o; })();
        let st = null;
        v.render(() => {
          const e = E.value, A = g.A, B = g.B, [p, q] = solve(e);
          const ps = indiff((t) => d2(B, t)), qs = indiff((t) => d1(A, t));
          // density panel
          const thr = -d1(A, q) / e;
          SD.fn(f, { domain: [-3.5, 3.5], color: 'ink', width: 2 });
          SD.fn(f, { domain: [Math.max(thr, -3.5), 3.5], color: C1, fill: true, fillAlpha: 0.3, width: 0 });
          SD.vline(thr, { color: 'gold', width: 2.5 }); SD.text('threshold', thr, 0.72, { align: 'center', size: 11.5, color: 'gold', weight: 700, dy: 0 });
          // square
          SQ.rect(0, 0, 1, 1, { color: 'muted', width: 1 });
          [0, 0.5, 1].forEach((t) => { SQ.text(String(t), t, -0.03, { align: 'center', baseline: 'top', size: 10.5, color: 'muted' }); SQ.text(String(t), -0.03, t, { align: 'right', size: 10.5, color: 'muted' }); });
          SQ.text('p = P(row plays ' + g.R[0] + ')', 0.5, -0.1, { align: 'center', baseline: 'top', size: 11.5, color: C1, weight: 600 });
          if (qs != null) SQ.line(0, qs, 1, qs, { color: C1, width: 2, alpha: 0.35, dash: true });
          if (ps != null) SQ.line(ps, 0, ps, 1, { color: C2, width: 2, alpha: 0.35, dash: true });
          SQ.curve((t) => [F(d1(A, t) / e), t], 0, 1, { n: 200, color: C1, width: 4 });
          SQ.curve((t) => [t, F(d2(B, t) / e)], 0, 1, { n: 200, color: C2, width: 3 });
          if (ps != null && qs != null) SQ.dot(ps, qs, { r: 13, hollow: true, color: 'accent', width: 2.5 });
          SQ.dot(p, q, { r: 6, color: 'green' });
          // convergence panel
          const P = grid.map((x) => [x, solve(x)]);
          SC.path(P.map(([x, s]) => [x, s[0]]), { color: C1, width: 3 }); SC.path(P.map(([x, s]) => [x, s[1]]), { color: C2, width: 3 });
          if (ps != null) SC.hline(ps, { color: C1, dash: true, width: 1.5 }); if (qs != null) SC.hline(qs, { color: C2, dash: true, width: 1.5 });
          SC.vline(e, { color: 'gold', dash: true, width: 1.5 });
          // draw shocks
          const rg = v.rng(seed * 31 + 5), draw = () => { const u = Math.min(1 - 1e-9, Math.max(1e-9, rg())); return dist.value === 'normal' ? (() => { let lo = -8, hi = 8; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (F(m) < u) lo = m; else hi = m; } return lo; })() : dist.value === 'unif' ? (2 * u - 1) * s3 : (-s3 / Math.PI) * Math.log(1 / u - 1); };
          let c1 = 0, c2 = 0;
          for (let t = 0; t < 2000; t++) { if (d1(A, q) + e * draw() > 0) c1++; if (d2(B, p) + e * draw() > 0) c2++; }
          st = { e, p, q, ps, qs, c1, c2 };
        });
        v.legend([[C1, 'row: frequency of first action'], [C2, 'column'], ['green', 'induced frequencies', { dot: true }], ['accent', 'mixed equilibrium', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { e, p, q, ps, qs, c1, c2 } = st;
          return `$\\varepsilon=${v.fix(e, 3)}$: equilibrium of the shocked game induces $(p_\\varepsilon,q_\\varepsilon)=(${v.fix(p, 4)},${v.fix(q, 4)})$; mixed equilibrium of the original game $(p^*,q^*)=(${v.fix(ps, 4)},${v.fix(qs, 4)})$ — distance ${v.fix(Math.hypot(p - ps, q - qs), 4)}\nDrawing 2000 shock pairs (seed ${seed}), everyone playing a **pure** threshold rule: first action chosen ${c1} times by the row player (${v.fix(c1 / 2000, 3)} vs ${v.fix(p, 3)}) and ${c2} times by the column player (${v.fix(c2 / 2000, 3)} vs ${v.fix(q, 3)})`;
        });
      },
    },
  ],
};
