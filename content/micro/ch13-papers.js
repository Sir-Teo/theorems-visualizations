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
            L.vline(p, { color: 'accent', width: 2.4 });
            const side = (x) => (x < 1.2 ? { dx: 6, align: 'left' } : { dx: -6, align: 'right' });
            L.text(`price p = ${pf(p)}`, p, ymax * 0.95, { color: 'accent', weight: 700, size: 12.5, ...side(p) });
            if (isFinite(f.m)) {
              L.vline(f.m, { color: 'blue', width: 1.8, dash: [6, 4] });
              L.text(`μ = ${pf(f.m)}`, f.m, ymax * 0.79, { color: 'blue', weight: 600, size: 12, ...side(f.m) });
              const nx = Math.min(f.next, 2.14);
              L.vline(nx, { color: 'orange', width: 2.2 });
              L.text(`b·μ = ${pf(f.next)}`, nx, ymax * 0.87, { color: 'orange', weight: 700, size: 12, ...side(nx) });
              if (f.next < p - 0.03) L.arrow(p, ymax * 0.71, f.next, ymax * 0.71, { color: 'red', width: 2, head: 8 });
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
  ],
};
