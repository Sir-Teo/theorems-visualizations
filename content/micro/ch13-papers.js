// Microeconomics — Chapter 13: landmark paper written early as a flagship item (13.19, Akerlof 1970).
//
// Verified against the paper (QJE 84 (3): 488–500, §II.B–C, pp. 490–492): two groups of traders with
// U1 = M + Σ xᵢ and U2 = M + Σ (3/2) xᵢ; group one owns N cars of quality uniform on [0, 2]; at price p the cars
// offered are those with x ≤ p, so S1 = pN/2 and the average quality offered is μ = p/2; group two buys only if
// 3μ/2 > p, hence "at no price will any trade take place at all". Symmetric information: p = 1, Y2/N or 3/2
// (eqs. 3–5) and a utility gain of N/2 when N < Y2. §IV lists guarantees, brand names, chains and licensing.

// ---------- quality distributions as weighted atoms (x, w), with cumulative sums for μ(p) = E[x | x ≤ p] ----------
const QMAX = 2;
function makeDist(kind, q) {
  let atoms;
  if (kind === 'two') atoms = [[0.4, 1 - q], [1.6, q]];
  else {
    const n = 800, lo = kind === 'uhi' ? 1 : 0, dens = kind === 'bell' ? (x) => Math.exp(-0.5 * ((x - 1) / 0.35) ** 2) : (x) => (x >= lo ? 1 : 0);
    atoms = [];
    for (let i = 0; i < n; i++) { const x = (i + 0.5) * QMAX / n; atoms.push([x, dens(x)]); }
  }
  const W = atoms.reduce((s, a) => s + a[1], 0);
  atoms = atoms.map(([x, w]) => [x, w / W]).filter((a) => a[1] > 0);
  const cw = [], cxw = []; let a = 0, b = 0;
  for (const [x, w] of atoms) { a += w; b += x * w; cw.push(a); cxw.push(b); }
  const idx = (p) => { let lo = 0, hi = atoms.length; while (lo < hi) { const m = (lo + hi) >> 1; if (atoms[m][0] <= p) lo = m + 1; else hi = m; } return lo - 1; };
  const F = (p) => { const k = idx(p); return k < 0 ? 0 : cw[k]; };
  const mu = (p) => { const k = idx(p); return k < 0 || cw[k] <= 1e-12 ? NaN : cxw[k] / cw[k]; };
  const quant = (u) => { const k = cw.findIndex((c) => c >= u - 1e-12); return atoms[Math.max(0, k)][0]; };
  return { atoms, F, mu, quant, mean: b, min: atoms[0][0], max: atoms[atoms.length - 1][0] };
}
/** Rounds of exit: buyers first offer b × (mean quality of all cars), sellers with x ≤ p stay, buyers re-price at b × μ(p), … */
function rounds(D, b) {
  const R = []; let p = b * D.mean;
  for (let k = 0; k < 60; k++) {
    const m = D.mu(p), share = D.F(p), next = isFinite(m) ? b * m : NaN, r = { k, p, m, share, next };
    R.push(r);
    if (!isFinite(next) || share < 0.01) { r.closed = true; break; }
    if (next >= p - 1e-6) { r.trade = true; break; }
    if (k === 59) r.capped = true;
    p = next;
  }
  return R;
}
const pf = (x, d = 2) => (isFinite(x) ? x.toFixed(d) : '—');
const pct = (x) => `${Math.round(100 * x)}%`;

export default {
  collection: 'micro',
  chapter: 13,
  items: [
    // ------------------------------------------------------------------ 13.19
    {
      num: '13.19',
      kind: 'Paper',
      name: 'The Market for “Lemons”',
      paper: { authors: 'George A. Akerlof', year: 1970, title: 'The Market for “Lemons”: Quality Uncertainty and the Market Mechanism', venue: 'Quarterly Journal of Economics 84 (3): 488–500', doi: '10.2307/1879431' },
      introduces: ['micro-13.6'],
      statement: String.raw`When sellers know the quality of what they sell and buyers know only the distribution, all goods must sell at one price, buyers will pay only for the **average** quality on offer, and that average itself falls with the price, because the best goods are the first to be withdrawn. Akerlof showed that this can shrink a market or close it altogether, even though every unit is worth more to some buyer than to its owner.

His worked example: group one owns $N$ used cars whose quality $x$ is uniform on $[0,2]$ and values a car at $x$; group two values it at $\tfrac32 x$ and owns none; utility is linear. At price $p$ exactly the cars with $x\le p$ are offered, so
$$S_1(p)=\frac{pN}{2},\qquad \mu(p)=\frac p2,$$
and buyers want a car only if $\tfrac32\mu(p)>p$, i.e. $\tfrac34p>p$, which never holds: **at no price is any car traded.** With symmetric information every car trades, at $p=1$, $Y_2/N$ or $\tfrac32$ per unit of quality depending on buyers' income $Y_2$, and total utility rises by $N/2$ when $N<Y_2$.

The paper applies the argument to health insurance for people over 65, the employment of minorities, the cost of dishonesty and credit in developing countries; it holds whenever quality is private, prices cannot depend on it, and nothing (a guarantee, a brand, a licence) certifies it.`,
      idea: String.raw`Before 1970, price theory assumed that buyers and sellers know what is being traded; imperfect information was treated as noise that dulls a market, not something that can destroy it. Akerlof's point is a feedback loop. Demand depends on price **and** on expected quality, $D(p,\mu)$, while the quality offered depends on price, $\mu(p)$; equilibrium needs $S(p)=D(p,\mu(p))$, and if lowering the price lowers quality faster than buyers' valuation falls, "the bad driving out the not-so-bad driving out the medium …" leaves no market at all (a version of Gresham's law). The paper named adverse selection as a general phenomenon (micro-13.6), using the supply–demand logic of micro-2.5 with expected values (micro-13.1), and its §IV read guarantees, brand names, chains and licensing as institutions that exist to counteract quality uncertainty. Three journals rejected it before the *QJE* accepted it; it became one of the founding papers of information economics, and Akerlof shared the 2001 Nobel memorial prize with Spence and Stiglitz for analyses of markets with asymmetric information.`,
      caption: String.raw`Left: 200 used cars placed by quality. Step through the **rounds of exit**: buyers first offer $b\times$ the average quality of all cars; the owners of cars worth more than that withdraw (grey), the average of what is still offered drops, and buyers re-price. Right: the same dynamics as a cobweb between the price $p$ and what buyers will pay, $b\,\mu(p)$; trade survives only where the curve reaches the diagonal. Akerlof's case is **uniform on [0, 2]** with $b=\tfrac32$: the price shrinks by $b/2$ every round, to zero. Raise $b$ past 2, change the distribution, or switch on **symmetric information** to see trade return.`,
      deps: ['micro-2.5', 'micro-13.1'],
      refs: [],
      tags: ['information', 'adverse selection'],
      credit: 'Akerlof, 1970',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/The_Market_for_Lemons' },
      viz(v) {
        const NC = 200;
        const distSel = v.select('qualities', [{ value: 'uni', label: 'uniform [0, 2] (Akerlof)' }, { value: 'uhi', label: 'uniform [1, 2]' }, { value: 'two', label: 'good or lemon' }, { value: 'bell', label: 'bell-shaped' }], 'uni', { onChange: () => { qS.el.hidden = distSel.value !== 'two'; rebuild(); } });
        const bS = v.slider('buyers’ value ÷ sellers’ value $b$', 1, 3, 1.5, { step: 0.05, onChange: () => rebuild() });
        const qS = v.slider('share of good cars $q$', 0.05, 0.95, 0.5, { step: 0.01, onChange: () => rebuild() });
        qS.el.hidden = true;
        const sym = v.toggle('symmetric information', false);
        const L = v.stage({ x: [-0.06, 2.16], y: [0, 1], height: 330, axes: 'box', yticks: [], xlabel: 'quality x  (= its owner’s value)', title: 'the cars, and who still offers one', weight: 1.15 });
        const R = v.stage({ x: [0, 3.2], y: [0, 3.2], height: 330, axes: 'box', xlabel: 'price p', ylabel: 'buyers will pay b·μ(p)', title: 'round by round: p → b·μ(p)', weight: 0.85, minWidth: 250 });
        let D = null, cars = [], ymax = 1, run = [];
        const frames = () => run.map((r) => ({ ...r, note: noteFor(r) }));
        function noteFor(r) {
          const b = bS.value;
          const head = `Round ${r.k}: at $p=${pf(r.p)}$ the owners of cars with $x\\le ${pf(r.p)}$ offer them (${pct(r.share)} of all cars)`;
          if (r.closed) return `${head}: the market has **effectively closed** — the price keeps shrinking toward 0 and so does what is offered.`;
          const tail = r.trade ? `at least $p$: everyone still offering is happy to sell — **trade at $p=${pf(r.p)}$**${r.share < 0.999 ? ', but only for the cars worth at most that' : ''}.` : `less than $p$: the best of these owners withdraw and the price falls${r.capped ? ' (still falling after 60 rounds)' : ''}.`;
          return `${head}, average quality $\\mu=${pf(r.m)}$; buyers will pay $b\\mu=${pf(b)}\\times${pf(r.m)}=${pf(r.next)}$, ${tail}`;
        }
        function rebuild() {
          D = makeDist(distSel.value, qS.value);
          cars = []; const bins = new Map(); const BW = 0.1;
          for (let i = 0; i < NC; i++) {
            const x = D.quant((i + 0.5) / NC);
            if (distSel.value === 'two') { cars.push({ x, col: 0, row: 0, atom: true }); continue; }
            const bk = Math.min(19, Math.floor(x / BW)), h = bins.get(bk) || 0; bins.set(bk, h + 1);
            cars.push({ x, bx: (bk + 0.5) * BW, row: h });
          }
          if (distSel.value === 'two') { // two blocks of dots, 10 per row, around each quality level
            const k = { 0.4: 0, 1.6: 0 };
            for (const c of cars) { const n = k[c.x]++; c.bx = c.x - 0.225 + 0.05 * (n % 10); c.row = Math.floor(n / 10); }
          }
          ymax = (Math.max(...cars.map((c) => c.row)) + 1) * 1.45 + 1;
          run = rounds(D, bS.value);
          if (S) S.reset(frames(), { at: Math.min(S.i, run.length - 1) });
        }
        let S = null;
        rebuild();
        S = v.steps({ frames: frames(), start: 2, still: 2, speed: 1.2, counter: 'round', code: [
          'buyers offer $p_0 = b\\cdot E[x]$  ▷ the value of an average car',
          'sellers with $x \\le p$ keep their car on the market',
          'average quality offered: $\\mu(p) = E[x \\mid x \\le p]$',
          'buyers re-price: $p \\leftarrow b\\,\\mu(p)$',
          'stop when $b\\,\\mu(p) \\ge p$ (trade) or nothing is offered',
        ], codeTitle: 'rounds of exit', codePos: 'below' });
        v.legend([['gold', 'car still offered', { dot: true }], ['faint', 'withdrawn', { dot: true }], ['accent', 'price p'], ['blue', 'average quality offered μ(p)', { dash: true }], ['orange', 'what buyers pay, b·μ(p)']]);
        v.render(() => {
          const b = bS.value, f = S.frame, p = f.p ?? 0, symOn = sym.value;
          // ---- left: the cars
          L.setView([-0.06, 2.16], [-0.15 * ymax, ymax]);
          if (distSel.value !== 'two') {
            for (let k = 0; k < 20; k++) { const x0 = k * 0.1, x1 = x0 + 0.1, mass = D.F(x1 - 1e-9) - D.F(x0 - 1e-9); L.rect(x0 + 0.004, 0, x1 - 0.004, mass * NC, { fill: 'grid', fillAlpha: 0.9, stroke: false }); }
          }
          const rowH = 1;
          for (const c of cars) {
            const traded = symOn || c.x <= p + 1e-9;
            L.dot(c.bx + (distSel.value === 'two' ? 0 : ((c.row * 7) % 5 - 2) * 0.006), (c.row + 0.55) * rowH, { r: 3.4, color: symOn ? 'green' : traded ? 'gold' : 'faint', ring: false });
          }
          if (!symOn) {
            const cl = (x) => Math.min(x, 2.13);
            L.vline(cl(p), { color: 'accent', width: 2.4 });
            const side = (x) => (x < 1.2 ? { dx: 6, align: 'left' } : { dx: -6, align: 'right' });
            L.text(`price p = ${pf(p)}`, cl(p), ymax * 0.95, { color: 'accent', weight: 700, size: 12.5, ...side(p) });
            if (isFinite(f.m)) {
              L.vline(f.m, { color: 'blue', width: 1.8, dash: [6, 4] });
              L.text(`μ = ${pf(f.m)}`, f.m, ymax * 0.79, { color: 'blue', weight: 600, size: 12, ...side(f.m) });
              const nx = cl(f.next);
              L.vline(nx, { color: 'orange', width: 2.2 });
              L.text(`b·μ = ${pf(f.next)}`, nx, ymax * 0.87, { color: 'orange', weight: 700, size: 12, ...side(nx) });
              if (f.next < p - 0.03) L.arrow(cl(p), ymax * 0.71, f.next, ymax * 0.71, { color: 'red', width: 2, head: 8 });
            }
          } else {
            L.corner('every car trades at a price between x and b·x', 'tl', { color: 'green', weight: 700 });
          }
          // ---- right: cobweb between p and b·μ(p)
          const P = Math.max(3.2, b * D.mean * 1.1);
          R.setView([0, P], [0, P]);
          R.line(0, 0, P, P, { color: 'muted', width: 1.4, dash: [5, 4] });
          R.text('b·μ(p) = p', P * 0.86, P * 0.86, { color: 'muted', dx: -6, dy: 12, align: 'right', size: 12 });
          R.fn((x) => (x >= D.min ? b * D.mu(x) : NaN), { domain: [D.min, P], color: 'orange', width: 2.6 });
          if (!symOn) {
            const pts = [];
            for (let i = 0; i <= S.i && i < run.length; i++) { const r = run[i]; if (!isFinite(r.next)) break; pts.push([r.p, i === 0 ? 0 : r.p], [r.p, r.next]); if (i < S.i) pts.push([r.next, r.next]); }
            if (pts.length) R.path(pts, { color: 'gold', width: 2 });
            if (isFinite(f.next)) R.dot(p, f.next, { r: 5, color: 'gold' });
            R.dot(p, 0, { r: 4.5, color: 'accent' });
          }
          // fixed points with trade (b μ(p) = p for p ≥ min quality)
          const fx = []; let prev = null;
          for (let i = 1; i <= 600; i++) { const x = D.min + (P - D.min) * i / 600, g = b * D.mu(x) - x; if (prev && Math.sign(g) !== Math.sign(prev.g) && isFinite(g) && isFinite(prev.g)) fx.push((x + prev.x) / 2); prev = { x, g }; }
          if (!fx.length && b * D.mu(P) >= P) fx.push(P);
          fx.forEach((x) => R.dot(x, x, { r: 5.5, color: 'green', hollow: true, width: 2.4 }));
        });
        v.readout(() => {
          const b = bS.value, f = S.frame, last = run[run.length - 1];
          const unravel = !last || last.closed || last.capped;
          const ak = distSel.value === 'uni' ? ` · uniform on $[0,2]$: $\\mu(p)=p/2$, so each round multiplies the price by $b/2$ = ${pf(b / 2, 3)}${b < 2 ? `: **no trade at any price**, as Akerlof found for $b=\\tfrac32$ (“at no price will any trade take place at all”), although at every price below 3 some owner would sell to some buyer` : ': with $b\\ge 2$ the market survives (every car trades at $p=2$)'}` : '';
          if (sym.value) {
            const gain = (b - 1) * D.mean;
            return `**Symmetric information:** every car can be sold, each owner gaining from a buyer who values it at $b x > x$; the gain is $(b-1)\\,E[x]$ = ${pf(gain, 3)} per car${distSel.value === 'uni' && Math.abs(b - 1.5) < 1e-9 ? ' = $\\tfrac12$, Akerlof’s utility gain of $N/2$ for $N$ cars (when buyers’ income $Y_2$ exceeds $N$; his equilibrium price per quality unit is 1, $Y_2/N$ or $\\tfrac32$, eqs. 3–5)' : ''}. Switch it off to see what asymmetry destroys.`;
          }
          const end = unravel ? `the market **unravels**: it closes or shrinks toward the worst cars (${pct(last ? last.share : 0)} still offered after ${run.length} rounds)` : `the rounds stop at $p$ = ${pf(last.p)} with ${pct(last.share)} of the cars traded${last.share < 0.999 ? ' (the best cars never reach the market)' : ''}`;
          return `Round ${f.k}: price ${pf(f.p)}, ${pct(f.share)} of cars offered, average quality ${pf(f.m)}, buyers pay ${pf(f.next)} · with these settings ${end}${ak} · today: adverse selection is standard theory (Akerlof shared the 2001 Nobel memorial prize for it), and the paper's §IV remedies (guarantees, brand names, chains, licensing) are what certify quality in such markets`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 13.20
    // Verified against the paper (QJE 87 (3): 355–374, pp. 362–367; JSTOR scan via sfu.ca/~allen): Table I — Group I
    // marginal product 1, share q₁, cost of education y; Group II product 2, share 1 − q₁, cost y/2; employer believes
    // productivity 1 for y < y*, 2 for y ≥ y*; Group I sets y = 0 if 1 > 2 − y*, Group II sets y* if 2 − y*/2 > 1, so
    // "1 < y* < 2"; with no signalling everyone is paid q₁ + 2(1 − q₁) = 2 − q₁; Group II gains from signalling iff y* < 2q₁;
    // with costs a₁y and a₂y the condition is 1/a₁ < y* < 1/a₂ and Group II can gain iff q₁ > a₂/a₁; pooling at y = 0 is
    // self-confirming if y* > 2q₁, pooling at y* if y* < 1 − q₁.
    {
      num: '13.20',
      kind: 'Paper',
      name: 'Job Market Signaling',
      paper: { authors: 'Michael Spence', year: 1973, title: 'Job Market Signaling', venue: 'Quarterly Journal of Economics 87 (3): 355–374', doi: '10.2307/1882010' },
      introduces: ['micro-13.7'],
      statement: String.raw`Spence showed how an observable, costly activity can transmit hidden information in a market, even when it is useless in itself. In his numerical example an employer cannot see a worker's productivity, 1 (Group I, a share $q_1$) or 2 (Group II), but can see education $y$, which costs $y$ to Group I and $y/2$ to Group II and adds nothing to output. If the employer pays 2 to anyone with $y\ge y^*$ and 1 otherwise, Group I chooses $y=0$ when $1>2-y^*$ and Group II chooses $y^*$ when $2-y^*/2>1$, so the beliefs are confirmed by what the employer then observes for every
$$1<y^*<2 .$$
This **signalling equilibrium** sorts workers perfectly, but there is a continuum of them, and they differ in welfare: Group I gets 1, less than the uniform wage $2-q_1$ it would get with no signal, and Group II gets $2-y^*/2$, which beats $2-q_1$ only if $y^*<2q_1$. Other self-confirming beliefs give **pooling** equilibria in which education conveys nothing: everyone at $y=0$ (if $y^*>2q_1$) or everyone at $y^*$ (if $y^*<1-q_1$).

The essential condition is that the signal's cost falls with productivity: with costs $a_1y$ and $a_2y$ separation needs $1/a_1<y^*<1/a_2$, impossible if $a_1=a_2$.`,
      idea: String.raw`Akerlof's market for lemons (micro-13.6, 1970) had shown that hidden quality can destroy a market. Spence, in his Harvard thesis, asked how markets cope: the informed side can take an action that the uninformed side reads as a signal, provided it is cheaper for the better types. The novelty was the equilibrium concept, beliefs that are confirmed by the data they generate, which later became the perfect Bayesian equilibrium of signalling games, and the uncomfortable welfare results: education can be privately rewarding and socially wasteful, and everyone can be worse off than without signalling. The paper introduced job-market signalling (micro-13.7), later applied to warranties, advertising, dividends and costly displays in biology, and earned Spence a share of the 2001 Nobel memorial prize with Akerlof and Stiglitz.`,
      caption: String.raw`**Left**: the job market. The black step is the employer's wage offer for each level of education; the orange and blue lines are what each group keeps after paying for education (wage minus cost). Each group picks its best point (dots): if what they choose confirms the employer's beliefs, the readout says **equilibrium**. Switch between the **separating** beliefs and the two **pooling** ones. **Right**: Spence's map of equilibria in the plane of the education standard $y^*$ and the share $q_1$ of low-productivity workers; **drag the gold point**. Blue: separating equilibria exist; green inside it: Group II gains from signalling. Hatched: pooling at $y=0$; purple: pooling at $y^*$. Raise Group II's **cost per year** toward Group I's and the separating band closes.`,
      deps: ['micro-13.6'],
      refs: [],
      tags: ['signalling', 'asymmetric information', 'labour'],
      credit: 'Michael Spence, 1973',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Signalling_(economics)' },
      viz(v) {
        const reg = v.select('employer believes', [{ value: 'sep', label: 'separating' }, { value: 'p0', label: 'pooling at y = 0' }, { value: 'py', label: 'pooling at y*' }], 'sep');
        const a2 = v.slider('Group II cost per unit of education', 0.2, 1, 0.5, { step: 0.01 });
        const Lm = v.stage({ x: [-0.08, 3], y: [-0.6, 2.35], axes: 'box', height: 360, weight: 1.05, xlabel: 'education y', ylabel: 'wage, and what is kept after paying for y', title: 'the job market' });
        const Mp = v.stage({ x: [0, 3], y: [0, 1], axes: 'box', height: 360, weight: 0.95, minWidth: 260, xlabel: 'education standard y*', ylabel: 'share of Group I, q₁', title: 'which equilibria exist' });
        const H = Mp.handle(1.5, 0.5, { color: 'gold', r: 8, constrain: { x: [0.02, 2.98], y: [0.02, 0.98] } });
        let st = null;
        v.render(() => {
          const ys = H.x, q1 = H.y, c2 = a2.value, r = reg.value, pool = 2 - q1;
          const lowW = r === 'p0' ? pool : 1, highW = r === 'py' ? pool : 2;
          const W = (y) => (y < ys ? lowW : highW);
          // ---- left: wage schedule and net returns
          Lm.hline(0, { color: 'faint', width: 1 });
          Lm.hline(pool, { color: 'muted', width: 1.2, dash: [2, 3] }); Lm.text(`no signal: everyone paid 2 − q₁ = ${v.fix(pool, 2)}`, r === 'py' ? 0.05 : 2.95, pool, { dy: -9, size: 11, color: 'muted', align: r === 'py' ? 'left' : 'right' });
          Lm.path([[0, lowW], [ys, lowW], null, [ys, highW], [3, highW]], { color: 'ink', width: 3 });
          Lm.line(ys, lowW, ys, highW, { color: 'ink', width: 1, dash: [3, 3] });
          const net1 = (y) => W(y) - y, net2 = (y) => W(y) - c2 * y;
          Lm.path([[0, net1(0)], [ys, net1(ys - 1e-9)], null, [ys, net1(ys)], [3, net1(3)]], { color: 'orange', width: 2.2 });
          Lm.path([[0, net2(0)], [ys, net2(ys - 1e-9)], null, [ys, net2(ys)], [3, net2(3)]], { color: 'blue', width: 2.2 });
          const ch1 = net1(ys) > net1(0) ? ys : 0, ch2 = net2(ys) > net2(0) ? ys : 0;
          Lm.dot(ch1, net1(ch1), { r: 7, color: 'orange' }); Lm.dot(ch2, net2(ch2), { r: 7, color: 'blue' });
          Lm.text(`Group I keeps ${v.fix(net1(ch1), 2)}`, ch1, net1(ch1), { dx: 12, dy: 18, size: 11.5, weight: 700, color: 'orange', align: 'left', plate: true });
          Lm.text(`Group II keeps ${v.fix(net2(ch2), 2)}`, ch2, net2(ch2), { dx: 10, dy: -13, size: 11.5, weight: 700, color: 'blue', align: 'left', plate: true });
          Lm.text('wage offered', Math.min(2.9, ys + 0.08), highW, { dy: -10, size: 11, weight: 600, color: 'ink', align: 'left' });
          // equilibrium check: do the choices confirm the beliefs?
          const want = r === 'sep' ? [0, ys] : r === 'p0' ? [0, 0] : [ys, ys];
          const eq = ch1 === want[0] && ch2 === want[1];
          Lm.corner(eq ? 'beliefs confirmed: an equilibrium' : 'beliefs contradicted: not an equilibrium', 'bl', { color: eq ? 'green' : 'red', weight: 700, size: 12.5, dy: -24 });
          // ---- right: the map
          const sepLo = 1, sepHi = 1 / c2;
          Mp.rect(sepLo, 0, Math.min(3, sepHi), 1, { fill: 'blue', fillAlpha: r === 'sep' ? 0.2 : 0.08, stroke: false });
          Mp.poly([[sepLo, Math.min(1, sepLo * c2)], [Math.min(3, sepHi), Math.min(1, Math.min(3, sepHi) * c2)], [Math.min(3, sepHi), 1], [sepLo, 1]], { fill: 'green', fillAlpha: r === 'sep' ? 0.25 : 0.1, stroke: false });
          Mp.poly(3 * c2 < 1 ? [[0, 0], [3, 3 * c2], [3, 0]] : [[0, 0], [1 / c2, 1], [3, 1], [3, 0]], { fill: 'muted', fillAlpha: 0.04, hatch: r === 'p0' ? 'ink' : 'muted', hatchAlpha: r === 'p0' ? 0.45 : 0.2, stroke: false });
          Mp.poly([[0, 0], [0, 1], [1, 0]], { fill: 'purple', fillAlpha: r === 'py' ? 0.28 : 0.1, stroke: false });
          Mp.line(sepLo, 0, sepLo, 1, { color: 'blue', width: 1.4 }); if (sepHi < 3) Mp.line(sepHi, 0, sepHi, 1, { color: 'blue', width: 1.4 });
          Mp.fn((x) => x * c2, { color: 'green', width: 1.4, dash: [5, 4] });
          Mp.text('separating', (sepLo + Math.min(3, sepHi)) / 2, 0.06, { size: 11.5, weight: 700, color: 'blue', align: 'center' });
          if (sepHi > 1.25) Mp.text('II gains', (sepLo + Math.min(3, sepHi)) / 2, 0.93, { size: 11.5, weight: 700, color: 'green', align: 'center' });
          Mp.text('pool at y*', 0.12, 0.08, { size: 11, weight: 700, color: 'purple', align: 'left' });
          Mp.text('pool at 0', 2.9, 0.22, { size: 11, weight: 700, color: 'ink', align: 'right', plate: true });
          st = { ys, q1, c2, r, eq, ch1, ch2, n1: net1(ch1), n2: net2(ch2), pool, sepHi };
        });
        v.legend([['ink', 'wage offered'], ['orange', 'Group I keeps (cost y)'], ['blue', 'Group II keeps (cost a₂y)'], ['green', 'Group II better off than with no signal', { area: true }], ['purple', 'pooling at y* possible', { area: true }], ['muted', 'hatched: pooling at 0 possible', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { ys, q1, c2, r, eq, ch1, ch2, n1, n2, pool, sepHi } = st;
          const name = r === 'sep' ? 'separating' : r === 'p0' ? 'pooling at 0' : 'pooling at y*';
          const why = eq ? '' : ` — Group I chooses y = ${v.fix(ch1, 2)}, Group II y = ${v.fix(ch2, 2)}, so the employer's beliefs would be contradicted`;
          const band = sepHi > 1 ? `separating equilibria for ${v.fix(1, 1)} < y* < ${v.fix(sepHi, 2)} (Spence, with cost y/2: 1 < y* < 2)` : 'no separating equilibrium: Group II’s education is as costly as Group I’s, so nothing can sort them';
          const welfare = eq ? ` · compared with no signal (both paid ${v.fix(pool, 2)}): Group I ${n1 < pool - 1e-9 ? 'loses' : n1 > pool + 1e-9 ? 'gains' : 'is unchanged'} (${v.fix(n1, 2)}), Group II ${n2 < pool - 1e-9 ? 'loses' : n2 > pool + 1e-9 ? 'gains' : 'is unchanged'} (${v.fix(n2, 2)}); education spent per worker ${v.fix((r === 'sep' ? (1 - q1) * c2 * ys : r === 'py' ? (q1 + (1 - q1) * c2) * ys : 0), 2)} with no gain in output` : '';
          return `$y^* = ${v.fix(ys, 2)}$, $q_1 = ${v.fix(q1, 2)}$, Group II cost ${v.fix(c2, 2)}$\\,y$: ${name} beliefs give **${eq ? 'an equilibrium' : 'no equilibrium'}**${why}${welfare} · ${band}; Group II can gain from signalling only if $y^* < q_1/a_2$ = ${v.fix(q1 / c2, 2)} (Spence: $y^* < 2q_1$) · today: the theory of signalling games; Spence shared the 2001 Nobel memorial prize`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 13.21
    // Verified against the paper (J. Finance 16 (1): 8–37; scan via cs.princeton.edu cos444): Appendix I, the homogeneous
    // rectangular game: N bidders with values uniform on (0, 1); Dutch (first-price) bids [(N − 1)/N] vᵢ, expected price
    // (N − 1)/(N + 1); progressive (English, second-highest value) expected price (N − 1)/(N + 1), "the same as for the
    // Dutch auction", bidders' surplus 1/(N + 1); variances (N − 1)²/[N(N + 1)²(N + 2)] (Dutch) and 2(N − 1)/[(N + 2)(N + 1)²]
    // (progressive); §III: the second-price sealed bid reproduces the progressive auction and makes bidding one's true
    // value the best strategy.
    {
      num: '13.21',
      kind: 'Paper',
      name: 'Counterspeculation, Auctions, and Competitive Sealed Tenders',
      paper: { authors: 'William Vickrey', year: 1961, title: 'Counterspeculation, Auctions, and Competitive Sealed Tenders', venue: 'Journal of Finance 16 (1): 8–37', doi: '10.1111/j.1540-6261.1961.tb02789.x' },
      introduces: ['micro-13.13', 'micro-13.15'],
      statement: String.raw`Vickrey analysed auctions as games between bidders with private values and proved two results that founded auction theory.

(a) **Second-price sealed bids are truthful.** If the highest bidder wins but pays the second-highest bid, bidding one's true value is a dominant strategy: raising the bid only adds wins at prices above one's value, lowering it only loses wins that would have been profitable, whatever the others do. The outcome reproduces the progressive (English) auction, and the item goes to the bidder who values it most.

(b) **Revenue equivalence.** With $N$ bidders whose values are independent and uniform on $(0,1)$, the first-price ("Dutch") equilibrium bid is $b(v)=\frac{N-1}{N}v$, and the expected price is
$$\mathbb E[p]=\frac{N-1}{N+1}$$
in **both** formats, with the same expected surplus $1/(N+1)$ for the winner. The formats differ in risk: the price varies with variance $\frac{(N-1)^2}{N(N+1)^2(N+2)}$ in the first-price auction against $\frac{2(N-1)}{(N+2)(N+1)^2}$ in the second-price one.

Truthfulness (micro-13.13) needs only private values; equivalence (micro-13.15) needs risk-neutral, symmetric bidders with independent values.`,
      idea: String.raw`Vickrey's paper was about "counterspeculation": a public agency that would make markets efficient by bidding against speculators, which led him to ask how to design sales so that bidders reveal their true valuations. In a first-price sealed bid each bidder must guess what others will bid and shade accordingly (micro-13.12), an incentive to speculate; Vickrey's second-price rule removes it, an idea later generalised by Clarke and Groves to the VCG mechanisms of public choice. His computation for uniform values found that the strategic shading in first price exactly offsets the lower price paid in second price; Myerson (1981) and Riley and Samuelson (1981) proved that this revenue equivalence holds for any standard auction under the same assumptions, and its failures (risk aversion, correlated values, asymmetric bidders) organise modern auction design. Vickrey shared the 1996 Nobel memorial prize, and died three days after it was announced.`,
      caption: String.raw`**Left**: you, with value $v$, against $N-1$ rivals whose bids are a fixed fraction of their own values. Your expected surplus as a function of your bid: in the **second-price** auction (blue) it peaks at $b=v$ whatever the rivals do, so drag the rivals' **bid fraction** and watch only the first-price curve (orange) and its optimum move; with rivals at the first-price equilibrium fraction $(N-1)/N$ your best first-price bid is exactly theirs. **Right**: auctions played live with $N$ bidders drawing uniform values (seeded simulation): the distribution of the price in each format, with the running averages below converging to the same $\frac{N-1}{N+1}$ while the first-price prices stay more tightly bunched.`,
      deps: ['micro-13.12'],
      refs: [],
      tags: ['auctions', 'mechanism design', 'game theory'],
      credit: 'William Vickrey, 1961',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vickrey_auction' },
      viz(v) {
        const nS = v.slider('bidders N', 2, 10, 4, { int: true, step: 1, onChange: () => v.restart() });
        const val = v.slider('your value v', 0.05, 1, 0.7, { step: 0.01 });
        const th = v.slider('rivals bid this fraction of their value', 0.3, 1.2, 0.75, { step: 0.01 });
        v.button('equilibrium rivals', () => th.set((nS.value - 1) / nS.value));
        const U = v.stage({ x: [0, 1], y: [0, 0.32], axes: 'box', height: 330, weight: 1, xlabel: 'your bid b', ylabel: 'your expected surplus', title: 'what should you bid?' });
        const Hs = v.stage({ x: [0, 1], y: [0, 7], axes: 'box', height: 330, weight: 1, xlabel: 'price paid', ylabel: 'density', title: 'the price, auction after auction' });
        const Ru = v.stage({ x: [1, 5000], xlog: true, y: [0.2, 1], axes: 'box', height: 210, full: true, xlabel: 'auctions played', ylabel: 'average price', title: 'running averages' });
        let sim = null;
        const reset = (n) => { sim = { n, rng: v.rng(1961 + n), fp: [], sp: [], sf: 0, ss: 0, hist: [] }; };
        let st = null;
        v.animate((t) => {
          const n = nS.value, vv = val.value, k = th.value;
          if (!sim || sim.n !== n || (t < 0.05 && sim.fp.length > 50)) reset(n);
          // ---- play auctions up to the clock (≈ 600 per second, capped at 5,000)
          const target = Math.min(5000, Math.floor(30 * Math.exp(t * 0.9)));
          while (sim.fp.length < target) {
            let m1 = 0, m2 = 0; for (let j = 0; j < n; j++) { const x = sim.rng(); if (x > m1) { m2 = m1; m1 = x; } else if (x > m2) m2 = x; }
            const pf = ((n - 1) / n) * m1, ps = m2; sim.fp.push(pf); sim.sp.push(ps); sim.sf += pf; sim.ss += ps;
            const c = sim.fp.length; if (c <= 20 || c % Math.max(1, Math.floor(c / 60)) === 0) sim.hist.push([c, sim.sf / c, sim.ss / c]);
          }
          // ---- left: expected surplus against your bid
          const Fb = (x) => (x <= 0 ? 0 : x >= k ? 1 : (x / k) ** (n - 1)); // P(highest rival bid < x)
          const sp = (b) => { const up = Math.min(b, k), m = 200; let s = 0, prev = 0; for (let i = 1; i <= m; i++) { const x = (up * i) / m, F = Fb(x); s += (vv - (x - up / (2 * m))) * (F - prev); prev = F; } return s; };
          const fp = (b) => (vv - b) * Fb(b);
          let bS = 0, mS = -1, bF = 0, mF = -1; for (let i = 0; i <= 400; i++) { const b = i / 400, s1 = sp(b), s2 = fp(b); if (s1 > mS + 1e-12) { mS = s1; bS = b; } if (s2 > mF + 1e-12) { mF = s2; bF = b; } }
          const ymax = Math.max(0.05, mS, mF) * 1.25; U.setView([0, 1], [Math.min(0, -0.02), ymax]);
          U.hline(0, { color: 'faint', width: 1 });
          U.vline(vv, { color: 'ink', width: 1.2, dash: [4, 3] }); U.text('your value', vv, ymax * 0.95, { dx: 5, size: 11, align: 'left', color: 'ink' });
          U.fn(sp, { color: 'blue', width: 2.6, n: 160 }); U.fn(fp, { color: 'orange', width: 2.6, n: 200 });
          U.dot(vv, sp(vv), { r: 6, color: 'blue' }); U.dot(bF, mF, { r: 6, color: 'orange' });
          U.text(`second price: best at b = v`, vv, sp(vv), { dx: -8, dy: -12, size: 11.5, weight: 700, color: 'blue', align: 'right', plate: true });
          U.text(`first price: best at ${v.fix(bF, 2)}`, bF, mF, { dx: -8, dy: 14, size: 11.5, weight: 700, color: 'orange', align: 'right', plate: true });
          // ---- right: histograms of prices
          const nn = sim.fp.length;
          Hs.hist(sim.sp, { bins: 40, range: [0, 1], density: true, color: 'blue', fillAlpha: 0.25 });
          Hs.hist(sim.fp, { bins: 40, range: [0, 1], density: true, color: 'orange', fillAlpha: 0.3 });
          const Ep = (n - 1) / (n + 1); Hs.vline(Ep, { color: 'ink', width: 1.6, dash: [5, 4] }); Hs.text(`(N−1)/(N+1) = ${v.fix(Ep, 3)}`, Ep, 6.6, { dx: -6, size: 11.5, weight: 700, align: 'right' });
          // ---- running averages
          Ru.hline(Ep, { color: 'ink', width: 1.4, dash: [5, 4] });
          Ru.path(sim.hist.map((h) => [h[0], h[1]]), { color: 'orange', width: 2.2 }); Ru.path(sim.hist.map((h) => [h[0], h[2]]), { color: 'blue', width: 2.2 });
          const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length, varc = (a) => { const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1); };
          st = { n, nn, mf: sim.sf / nn, ms: sim.ss / nn, vf: varc(sim.fp), vs: varc(sim.sp), bS, bF, k, vv };
        }, { still: 7, period: 1e9 });
        v.legend([['blue', 'second price (pay the second-highest bid)'], ['orange', 'first price (pay your bid)'], ['ink', 'Vickrey’s expected price (N−1)/(N+1)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, nn, mf, ms, vf, vs, bF, k, vv } = st, Ep = (n - 1) / (n + 1);
          const vd = (n - 1) ** 2 / (n * (n + 1) ** 2 * (n + 2)), vc = (2 * (n - 1)) / ((n + 2) * (n + 1) ** 2);
          return `your bid: second price — bid your value (${v.fix(vv, 2)}) whatever the rivals do; first price — best bid ${v.fix(bF, 2)} against rivals bidding ${v.fix(k, 2)}× their values (equilibrium: $\\frac{N-1}{N}v$ = ${v.fix(((n - 1) / n) * vv, 2)}) · after ${nn.toLocaleString('en-US')} auctions with $N = ${n}$: average price **${v.fix(mf, 4)}** (first) and **${v.fix(ms, 4)}** (second) against Vickrey’s $\\frac{N-1}{N+1}$ = **${v.fix(Ep, 4)}** for both; variance ${v.fix(vf, 4)} and ${v.fix(vs, 4)} against his ${v.fix(vd, 4)} and ${v.fix(vc, 4)} · today: Myerson (1981) and Riley & Samuelson (1981) proved revenue equivalence for all standard auctions; the Vickrey–Clarke–Groves mechanisms generalise his rule; he shared the 1996 Nobel memorial prize`;
        });
      },
    },
  ],
};
