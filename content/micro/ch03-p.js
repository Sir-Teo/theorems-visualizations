// Microeconomics — Chapter 3 (papers): Marshall, Principles of Economics (1890)

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
/** Line through two points as p(q); vertical lines are nudged to stay functions. */
function lineThrough(a, b) { const dq = Math.abs(b.x - a.x) < 1e-6 ? 1e-6 : b.x - a.x, s = (b.y - a.y) / dq; return { s, at: (q) => a.y + s * (q - a.x) }; }
/** Intersection of two lines p = a1 + s1 q and p = a2 + s2 q. */
function meet(L1, L2) { const a1 = L1.at(0), a2 = L2.at(0); if (Math.abs(L1.s - L2.s) < 1e-9) return null; const q = (a2 - a1) / (L1.s - L2.s); return { q, p: L1.at(q) }; }
// Marshall's elasticity figure: a demand curve that bends (constant shape, elasticity varying along it)
const DEM = (q) => 100 * Math.max(0, 1 - q / 120) ** 1.6;
const DEMd = (q) => -(100 * 1.6 / 120) * Math.max(0, 1 - q / 120) ** 0.6;

export default {
  collection: 'micro',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.18
    {
      num: '3.18',
      kind: 'Paper',
      name: 'Principles of Economics',
      paper: { authors: 'Alfred Marshall', year: 1890, title: 'Principles of Economics', venue: 'London: Macmillan (vol. 1)', url: 'https://archive.org/details/principlesecono00marsgoog' },
      introduces: ['micro-3.1', 'micro-7.6'],
      credit: 'Alfred Marshall, 1890',
      statement: String.raw`Marshall's *Principles* built the partial-equilibrium analysis of a single market that is still taught: value is determined jointly by demand and supply, the price at which the amount buyers will take equals the amount sellers will bring. Its main analytical contributions:

(a) **Elasticity of demand** (Book III): demand is elastic or inelastic as the amount demanded responds much or little to a given change in price; geometrically, if the tangent to the demand curve at $P$ meets the axes $Ox$ and $Oy$ in $T$ and $t$, the elasticity at $P$ is the ratio $PT/Pt$ (micro-3.1).

(b) **Consumers' surplus** (called consumers' rent in 1890): the excess of what a buyer would be willing to pay over what he does pay, measured by the area under the demand curve above the price.

(c) **Time** (Book V): the shorter the period considered, the more value is governed by demand, and the longer the period, the more by cost of production — from the market day, when the stock is fixed, through the short period, when output can change only with existing plant, to the long period, when plant itself adjusts (micro-7.6).

(d) The **scissors**: the "final utility" and "cost of production" principles are each one blade of a pair of scissors (a footnote of Book VI, ch. VI in 1890) — in the eighth edition's words, one might as reasonably dispute "whether it is the upper or the under blade of a pair of scissors that cuts a piece of paper, as whether value is governed by utility or cost of production".

Scope: one market at a time, other prices and incomes held fixed (*ceteris paribus*), with the marginal utility of money taken as constant when surplus is measured in money.`,
      idea: String.raw`In 1890 economics was split between the classical view that value is set by cost of production (Smith, Ricardo, Mill) and the marginalists of the 1870s (Jevons, Menger, Walras) who derived it from utility. Marshall, a Cambridge mathematician turned economist, reconciled them: utility lies behind demand, cost behind supply, and which one seems to "govern" depends on the time allowed for supply to respond. He drew on Cournot's demand function (micro-10.22) and on the marginal utility of the 1870s (micro-4.9), but kept the mathematics in footnotes and an appendix and wrote for business readers, with diagrams in which amounts run along $Ox$ and prices up $Oy$ — the reason price is still the vertical axis. The *Principles* (eight editions to 1920) made economics a professional discipline at Cambridge and fixed the vocabulary of elasticity, consumers' surplus, short and long period, external economies and the representative firm. Hicks and others later grounded consumer surplus in compensating variation, and general-equilibrium theory showed when the *ceteris paribus* single-market picture is a good approximation.`,
      caption: String.raw`Left, in Marshall's style: drag the ends of the demand curve $DD'$ and the supply curve $SS'$. The amount-index $R$ (drag it along $Ox$) shows the demand price $Rd$ and the supply price $Rs$; the arrow is the way the amount moves until they meet at $A$. Blue: consumers' surplus. Raise demand with the slider and pick the **period**: on the market day the stock is fixed and the whole rise goes into price, in the short period supply follows $SS'$, and in the long period (constant cost) price returns to cost of production. Right: Marshall's measure of elasticity. Drag $P$ along the demand curve; the tangent meets $Ox$ in $T$ and $Oy$ in $t$, and $PT/Pt$ is compared with $-\frac{dq}{dp}\frac{p}{q}$ computed from the curve.`,
      deps: ['micro-2.5', 'micro-4.9', 'micro-10.22'],
      see: ['micro-3.6', 'micro-8.11'],
      refs: [],
      tags: ['supply and demand', 'elasticity', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Principles_of_Economics_(Marshall_book)' },
      viz(v) {
        const per = v.select('period', [{ value: 'market', label: 'market day' }, { value: 'short', label: 'short period' }, { value: 'long', label: 'long period' }], 'short');
        const dS = v.slider('rise in demand (amount at each price)', 0, 30, 15, { step: 0.5 });
        const S1 = v.stage({ x: [-4, 100], y: [-6, 100], axes: true, height: 360, weight: 1.15, minWidth: 300, xlabel: 'amount', ylabel: 'price', title: 'the scissors: demand $DD\'$ and supply $SS\'$' });
        const S2 = v.stage({ x: [-5, 125], y: [-7, 124], axes: true, height: 360, weight: 1, minWidth: 280, xlabel: 'amount', ylabel: 'price', title: 'elasticity at $P$ = $PT/Pt$' });
        const box = (x, y) => [clamp(x, 2, 98), clamp(y, 2, 98)];
        const D0 = S1.handle(8, 88, { color: 'ink', constrain: box }), D1 = S1.handle(90, 22, { color: 'ink', constrain: box });
        const Sa = S1.handle(8, 14, { color: 'ink', constrain: box }), Sb = S1.handle(90, 80, { color: 'ink', constrain: box });
        const R = S1.handle(26, 0, { color: 'accent', label: 'R', labelPos: 'n', constrain: (x) => [clamp(x, 1, 99), 0] });
        const P = S2.handle(30, DEM(30), { color: 'accent', label: 'P', labelPos: 'ne', constrain: (x) => { const q = clamp(x, 4, 110); return [q, DEM(q)]; } });
        const market = () => {
          const D = lineThrough(D0, D1), S = lineThrough(Sa, Sb), A = meet(D, S);
          const Dn = { s: D.s, at: (q) => D.at(q - dS.value) }; // demand shifted right
          let An = null;
          if (A) {
            if (per.value === 'market') An = { q: A.q, p: Dn.at(A.q) };
            else if (per.value === 'long') An = { q: A.q + dS.value, p: A.p };
            else An = meet(Dn, S);
          }
          const rises = A ? { market: Dn.at(A.q) - A.p, short: (meet(Dn, S) || A).p - A.p, long: 0 } : null;
          return { D, S, A, Dn, An, rises };
        };
        v.render(() => {
          const { D, S, A, Dn, An } = market(), shift = dS.value;
          const ok = A && A.q > 0 && A.q < 100 && A.p > 0 && A.p < 100 && D.s < 0 && S.s > 0;
          // consumers' surplus under the original demand
          if (ok) S1.poly([[0, D.at(0)], [A.q, A.p], [0, A.p]], { fill: 'accent', fillAlpha: 0.16, stroke: false });
          S1.clip(() => {
            S1.fn((q) => D.at(q), { domain: [0, 100], color: 'ink', width: 2 });
            S1.fn((q) => S.at(q), { domain: [0, 100], color: 'ink', width: 2 });
            if (shift > 0) S1.fn((q) => Dn.at(q), { domain: [0, 100], color: 'ink', width: 1.4, dash: [6, 4] });
            if (ok && shift > 0) {
              if (per.value === 'market') S1.vline(A.q, { color: 'orange', width: 2.2 });
              if (per.value === 'long') S1.hline(A.p, { color: 'orange', width: 2.2 });
              if (per.value === 'short') S1.fn((q) => S.at(q), { domain: [0, 100], color: 'orange', width: 2.2 });
            }
          });
          S1.text('D', D0.x - 4.5, D0.y - 5, { size: 15, math: true, color: 'ink' }); S1.text('D′', D1.x + 1.5, D1.y - 4, { size: 15, math: true, color: 'ink' });
          S1.text('S', Sa.x - 2.5, Sa.y - 4, { size: 15, math: true, color: 'ink' }); S1.text('S′', Sb.x + 1.5, Sb.y + 4, { size: 15, math: true, color: 'ink' });
          if (ok) {
            S1.line(A.q, 0, A.q, A.p, { color: 'muted', width: 1, dash: [2, 3] }); S1.line(0, A.p, A.q, A.p, { color: 'muted', width: 1, dash: [2, 3] });
            S1.dot(A.q, A.p, { r: 5, color: 'ink' }); S1.text('A', A.q + 1.6, A.p + 3.5, { size: 15, math: true, color: 'ink' });
            S1.text('H', A.q, -0.5, { size: 13, math: true, color: 'muted', align: 'center', baseline: 'top', dy: 2 });
            S1.text("consumers' surplus", Math.max(9, A.q * 0.22), A.p + Math.min(5, (D.at(0) - A.p) * 0.2), { size: 10.5, color: 'accent', align: 'left' });
            if (shift > 0 && An && An.q < 100 && An.p > 0 && An.p < 100) {
              S1.dot(An.q, An.p, { r: 5.5, color: 'green' });
              S1.text('A′', An.q + 1.6, An.p + 3.5, { size: 15, math: true, color: 'green' });
              if (Math.abs(An.p - A.p) > 0.6) { S1.arrow(-1.8, A.p, -1.8, An.p, { color: 'green', width: 2.2, head: 7 }); S1.text((An.p > A.p ? '+' : '−') + v.fix(Math.abs(An.p - A.p), 1), -0.8, (A.p + An.p) / 2, { size: 11, color: 'green', weight: 700 }); }
            }
          }
          // the amount-index R with demand price Rd and supply price Rs
          const rd = D.at(R.x), rs = S.at(R.x);
          S1.line(R.x, 0, R.x, Math.max(rd, rs), { color: 'accent', width: 1, dash: [3, 3] });
          if (rd > 0 && rd < 100) { S1.dot(R.x, rd, { r: 4, color: 'accent' }); S1.text('d', R.x + 1.4, rd + 2.5, { size: 14, math: true, color: 'accent' }); }
          if (rs > 0 && rs < 100) { S1.dot(R.x, rs, { r: 4, color: 'accent' }); S1.text('s', R.x + 1.4, rs - 2.5, { size: 14, math: true, color: 'accent' }); }
          if (ok && Math.abs(R.x - A.q) > 2) { const dir = rd > rs ? 1 : -1; S1.arrow(R.x + dir * 2, 5, R.x + dir * 9, 5, { color: 'accent', width: 2, head: 7 }); }
          // ---- elasticity figure
          const q0 = P.x, p0 = DEM(q0), sl = DEMd(q0), T = q0 - p0 / sl, t = p0 - sl * q0;
          S2.fn(DEM, { domain: [0, 120], color: 'ink', width: 2 });
          S2.text('D', 14, DEM(14) + 6, { size: 15, math: true, color: 'ink' }); S2.text('D′', 98, DEM(98) + 8, { size: 15, math: true, color: 'ink' });
          S2.line(0, t, T, 0, { color: 'muted', width: 1 });
          S2.line(q0, p0, T, 0, { color: 'accent', width: 3.2 });
          S2.line(q0, p0, 0, t, { color: 'orange', width: 3.2 });
          S2.text('T', T, 0, { size: 15, math: true, color: 'accent', align: 'center', baseline: 'bottom', dy: -4 });
          S2.text('t', 0, t, { size: 15, math: true, color: 'orange', align: 'right', dx: -6 });
          const qU = 75 / 1.625; S2.dot(qU, DEM(qU), { r: 3.5, color: 'muted', hollow: true }); S2.text('unit elasticity', qU + 2.5, DEM(qU) + 4, { size: 10, color: 'muted' });

        });
        v.legend([['ink', 'Marshall’s curves'], ['accent', "consumers' surplus", { area: true }], ['orange', 'supply in the chosen period'], ['green', 'new equilibrium', { dot: true }]]);
        v.readout(() => {
          const { A, rises } = market(), q0 = P.x, p0 = DEM(q0), sl = DEMd(q0), T = q0 - p0 / sl, t = p0 - sl * q0;
          const PT = Math.hypot(T - q0, p0), Pt = Math.hypot(q0, t - p0), eps = -(1 / sl) * (p0 / q0);
          let s = '';
          if (A && A.q > 0 && A.q < 100) {
            const D = lineThrough(D0, D1), cs = 0.5 * A.q * (D.at(0) - A.p);
            s = `equilibrium $A$: amount ${v.fix(A.q, 1)}, price ${v.fix(A.p, 1)}; consumers' surplus ${v.fix(cs, 0)} · at $R$: demand price $Rd = ${v.fix(D.at(R.x), 1)}$, supply price $Rs = ${v.fix(lineThrough(Sa, Sb).at(R.x), 1)}$ → the amount ${D.at(R.x) > lineThrough(Sa, Sb).at(R.x) ? 'increases' : 'decreases'} · a rise in demand of ${v.fix(dS.value, 1)} raises the price by ${v.fix(rises.market, 1)} on the market day, ${v.fix(rises.short, 1)} in the short period, ${v.fix(rises.long, 1)} in the long period (constant cost) · `;
          } else s = 'the curves do not cross inside the figure · ';
          return s + `at $P$: $PT/Pt = ${v.fix(PT, 1)}/${v.fix(Pt, 1)} = ${v.fix(PT / Pt, 3)}$, and $-\\frac{dq}{dp}\\frac{p}{q} = ${v.fix(eps, 3)}$ — demand is ${eps > 1.005 ? 'elastic' : eps < 0.995 ? 'inelastic' : 'unit-elastic'} here`;
        });
      },
    },
  ],
};
