// Microeconomics — Chapter 3 (part b): taxes, price controls and trade policy

// ---------- shared helpers (part b) ----------
/** Composite Simpson rule on [a, b] (oriented). */
function simpson(f, a, b, n = 200) {
  if (a === b) return 0;
  if (b < a) return -simpson(f, b, a, n);
  n += n % 2; const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}
/** Root of f on [a, b] by bisection; null when f does not change sign. */
function bisect(f, a, b, it = 90) {
  let fa = f(a); const fb = f(b);
  if (fa === 0) return a; if (fb === 0) return b;
  if (!(fa * fb < 0)) return null;
  for (let i = 0; i < it; i++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
  return (a + b) / 2;
}
function trace(f, a, b, n = 48) { const out = []; for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; out.push([x, f(x)]); } return out; }
/** Shade between the graphs top(x) and bot(x) over [a, b]. */
function band(s, top, bot, a, b, color, alpha = 0.25) {
  if (!(Math.abs(b - a) > 1e-9)) return;
  s.poly([...trace(top, a, b), ...trace(bot, b, a)], { fill: color, fillAlpha: alpha, stroke: false });
}
function plab(s, y, tex, color = 'ink') { s.tex(tex, s.bounds.x[0], y, { dx: 30, dy: -1, color, size: 14, align: 'left', baseline: 'bottom' }); }
/** Bold area label, drawn only when the region is big enough on screen (w, h in data units). */
function tag(s, text, x, y, color, w = Infinity, h = Infinity, size = 12) {
  if (Math.abs(w * s.scale) < 34 || Math.abs(h * (s.height / (s.bounds.y[1] - s.bounds.y[0]))) < 14) return;
  s.text(text, x, y, { color, size, weight: 700, align: 'center' });
}
const pct = (x, d = 1) => `${(100 * x).toFixed(d)}%`;
const sgn = (x, d = 0) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;
function equilibrium(D, S, qmax = 100) { const q = bisect((x) => D(x) - S(x), 0, qmax); return q == null ? null : { q, p: D(q) }; }
function qAt(F, p, qmax = 100) { const r = bisect((x) => F(x) - p, 0, qmax); if (r != null) return r; const up = F(qmax) > F(0); return (up ? F(0) >= p : F(0) <= p) ? 0 : qmax; }
/**
 * Demand and supply written as quantities Q(P) through the equilibrium (Q*, P*) = (50, 50) with given elasticities there.
 * 'lin': straight lines (Q clipped at 0); 'ce': constant-elasticity curves Q = 50 (P/50)^{∓ε}.
 */
function elMarket(kind, ed, es) {
  if (kind === 'lin') return { QD: (p) => Math.max(0, 50 - ed * (p - 50)), QS: (p) => Math.max(0, 50 + es * (p - 50)) };
  return { QD: (p) => 50 * Math.pow(Math.max(p, 1e-9) / 50, -ed), QS: (p) => (p <= 0 ? 0 : 50 * Math.pow(p / 50, es)) };
}
/** Per-unit tax t on such a market: buyers' price Pb, sellers' price Ps = Pb − t, quantity Q (null if both curves are vertical). */
function taxed(Mk, t, ed, es) {
  if (ed + es < 1e-9) return null;
  const Pb = bisect((p) => Mk.QD(p) - Mk.QS(p - t), Math.max(t, 0) + 1e-9, 2000) ?? 50 + t;
  return { Pb, Ps: Pb - t, Q: Mk.QD(Pb) };
}
/** Draw a curve given as Q(P) (so vertical curves are fine). */
function drawQ(s, Qf, st, p0 = 0.3, p1 = 120) { const pts = []; for (let i = 0; i <= 160; i++) { const p = p0 + ((p1 - p0) * i) / 160, q = Qf(p); pts.push(isFinite(q) && q > 1e-9 && q < 400 ? [q, p] : null); } s.path(pts, st); }

// domestic market used for the trade items: D: P = 100 − Q, S: P = 10 + 0.8 Q, autarky (50, 50)
const TD = (q) => 100 - q, TS = (q) => 10 + 0.8 * q;
const tQd = (p) => Math.max(0, 100 - p), tQs = (p) => Math.max(0, (p - 10) / 0.8);
const tCS = (p) => 0.5 * tQd(p) ** 2, tPS = (p) => 0.5 * tQs(p) * (p - 10) * (p > 10 ? 1 : 0);

export default {
  collection: 'micro',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Concept',
      name: 'Tax wedge',
      statement: String.raw`A per-unit tax $t$ on a good drives a **wedge** between the price buyers pay, $P_b$, and the price sellers keep, $P_s = P_b - t$. In the competitive market with the tax, the quantity traded $Q_t$ is the one at which the vertical gap between the demand and supply curves equals the tax,
$$D(Q_t) - S(Q_t) = t,\qquad P_b = D(Q_t),\quad P_s = S(Q_t).$$
The outcome does not depend on which side is legally required to pay: a tax collected from sellers shifts the supply curve up by $t$, a tax collected from buyers shifts the demand curve down by $t$, and both give the same $Q_t$, $P_b$ and $P_s$ — only the posted price differs. A subsidy is a negative tax: it makes $P_s$ exceed $P_b$.`,
      idea: String.raw`Buyers care only about what they pay in total, sellers only about what they keep, so the equilibrium conditions are $Q_D(P_b) = Q_S(P_s)$ and $P_b - P_s = t$, whoever hands the money to the government. Writing the first condition with inverse curves gives $D(Q) = P_b$ and $S(Q) = P_s$, hence $D(Q) - S(Q) = t$. Since $D - S$ is decreasing (2.5), this pins down a unique $Q_t < Q^*$ for $t > 0$; "$S + t$ meets $D$" and "$D - t$ meets $S$" are two ways of writing the same equation.`,
      caption: String.raw`Slide the tax (negative values are a subsidy) and switch who must pay it; drag the curves' handles. The shifted curve is dashed and the green wedge has length $t$. Switching the legal payer moves a different curve but leaves $P_b$, $P_s$ and $Q_t$ exactly where they were. Right: the gap $D(Q) - S(Q)$ is a falling curve, and the tax line cuts it at $Q_t$.`,
      deps: ['micro-2.5'],
      refs: ['Mankiw Ch. 6'],
      tags: ['taxation'],
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.2 });
        const g = v.stage({ x: [0, 100], y: [-40, 100], height: 340, axes: 'box', xlabel: 'Q', title: 'the gap $D(Q) - S(Q)$', weight: 1 });
        const who = v.select('tax collected from', ['sellers', 'buyers'], 'sellers');
        const t = v.slider('tax per unit $t$', -20, 40, 18, { step: 0.5 });
        const E = v.curves(s, { demand: { linear: [[8, 92], [92, 14]] }, supply: { linear: [[8, 14], [92, 82]] } });
        let st = null;
        v.render(() => {
          const D = E.D, S = E.S, tv = t.value, r = equilibrium(D, S), sell = who.value === 'sellers';
          if (!r) { s.fn(D, { color: 'blue', width: 2.4 }); s.fn(S, { color: 'orange', width: 2.4 }); st = null; return; }
          // two independent computations of the taxed equilibrium
          const qSel = bisect((q) => D(q) - (S(q) + tv), 0, 100) ?? 0, qBuy = bisect((q) => (D(q) - tv) - S(q), 0, 100) ?? 0;
          const q = sell ? qSel : qBuy, pb = D(q), ps = S(q), posted = sell ? pb : ps;
          if (q > 0) s.rect(0, Math.min(ps, pb), q, Math.max(ps, pb), { fill: tv >= 0 ? 'green' : 'purple', fillAlpha: 0.13, stroke: false });
          const lab = tv >= 0 ? ['S + t', 'D − t'] : ['S − s', 'D + s'];
          s.fn(D, { color: 'blue', width: 2.6 }); s.fn(S, { color: 'orange', width: 2.6 });
          s.text('D', 90, D(90), { dx: 6, dy: 4, align: 'left', baseline: 'top', color: 'blue', size: 15, math: true });
          s.text('S', 99, S(99), { dy: -10, align: 'right', color: 'orange', size: 15, math: true });
          if (sell) {
            s.fn((x) => S(x) + tv, { color: 'orange', width: 2, dash: [7, 4] });
            const xl = Math.min(96, bisect((x) => S(x) + tv - 93, 0, 100) ?? 96);
            s.text(lab[0], xl, S(xl) + tv, { dx: -8, align: 'right', color: 'orange', size: 15, math: true });
            if (Math.abs(tv) > 1.5) s.arrow(80, S(80), 80, S(80) + tv, { color: 'orange', width: 1.6, head: 7 });
          } else {
            s.fn((x) => D(x) - tv, { color: 'blue', width: 2, dash: [7, 4] });
            const xl = Math.min(96, bisect((x) => D(x) - tv - 6, 0, 100) ?? 96);
            s.text(lab[1], xl, D(xl) - tv, { dx: -8, align: 'right', color: 'blue', size: 15, math: true });
            if (Math.abs(tv) > 1.5) s.arrow(20, D(20), 20, D(20) - tv, { color: 'blue', width: 1.6, head: 7 });
          }
          s.dot(r.q, r.p, { r: 4.5, color: 'ink', hollow: true });
          const gd = { color: 'muted', width: 1, dash: [3, 3] };
          s.line(0, pb, q, pb, gd); s.line(0, ps, q, ps, gd); s.line(q, 0, q, Math.min(ps, pb), gd);
          s.line(0, posted, q, posted, { color: 'gold', width: 2.6 });
          s.text('posted price', q / 2 + 4, posted, { dy: sell === tv >= 0 ? -9 : 10, align: 'center', color: 'gold', size: 11.5, weight: 700 });
          if (Math.abs(pb - ps) > 0.5) s.line(q, ps, q, pb, { color: tv >= 0 ? 'green' : 'purple', width: 5, alpha: 0.85 });
          s.text(tv >= 0 ? 't' : 's', q, (pb + ps) / 2, { dx: 9, align: 'left', color: tv >= 0 ? 'green' : 'purple', size: 16, math: true });
          s.dot(q, pb, { r: 5, color: 'blue' }); s.dot(q, ps, { r: 5, color: 'orange' });
          plab(s, pb, 'P_b', 'blue'); plab(s, ps, 'P_s', 'orange');
          s.tex('Q_t', q, 0, { dx: 3, dy: -19, align: 'left', baseline: 'bottom', size: 14 });
          // gap panel
          const gap = (x) => D(x) - S(x), lo = Math.min(-30, gap(100)), hi = Math.max(50, gap(0), tv + 10);
          g.setView(null, [Math.max(lo, -100) * 1.05, hi * 1.05]);
          g.hline(0, { color: 'faint', width: 1 });
          g.fn(gap, { color: 'ink', width: 2.6 });
          g.hline(tv, { color: tv >= 0 ? 'green' : 'purple', width: 2, dash: [7, 4] });
          g.text(tv >= 0 ? `t = ${tv.toFixed(1)}` : `−s = ${tv.toFixed(1)}`, 98, tv, { dy: -10, align: 'right', color: tv >= 0 ? 'green' : 'purple', size: 12, weight: 600 });
          g.line(q, g.bounds.y[0], q, tv, gd); g.line(r.q, g.bounds.y[0], r.q, 0, gd);
          g.dot(r.q, 0, { r: 4, color: 'ink', hollow: true }); g.tex('Q^*', r.q, 0, { dx: -6, dy: 5, align: 'right', baseline: 'top', size: 13 });
          g.dot(q, tv, { r: 5.5, color: tv >= 0 ? 'green' : 'purple' }); g.tex('Q_t', q, tv, { dx: -6, dy: 5, align: 'right', baseline: 'top', size: 13 });
          st = { q, pb, ps, qSel, qBuy, sell, posted, r, tv };
        });
        v.legend([['blue', 'demand'], ['orange', 'supply'], ['green', 'wedge $P_b - P_s = t$'], ['gold', 'posted (sticker) price']]);
        v.readout(() => {
          if (!st) return 'The curves do not cross in view — drag a handle back.';
          const { q, pb, ps, qSel, qBuy, sell, tv } = st, f = (x) => v.fix(x, 2);
          return `buyers pay $P_b = ${f(pb)}$, sellers keep $P_s = ${f(ps)}$, $Q_t = ${f(q)}$ · solving $D = S + t$ gives $Q = ${f(qSel)}$, solving $D - t = S$ gives $Q = ${f(qBuy)}$ — **the same** · wedge $P_b - P_s = ${f(pb - ps)} = t$ ✓ · the price on the label is ${sell ? '$P_b$ (sellers pass the tax into the shelf price)' : '$P_s$ (buyers pay the tax on top at the till)'}${tv < 0 ? ' · with a subsidy $P_s > P_b$' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Proposition',
      name: 'Tax incidence follows relative elasticities',
      credit: 'Fleeming Jenkin, 1872',
      statement: String.raw`Impose a small per-unit tax $t$ on a competitive market whose demand and supply have elasticities $\varepsilon_D \le 0$ and $\varepsilon_S \ge 0$ at the equilibrium (not both zero). The buyers' price rises and the sellers' price falls by
$$\frac{\Delta P_b}{t} \approx \frac{\varepsilon_S}{\varepsilon_S + |\varepsilon_D|},\qquad \frac{-\Delta P_s}{t} \approx \frac{|\varepsilon_D|}{\varepsilon_S + |\varepsilon_D|},$$
with equality in the limit $t \to 0$, and exactly for every $t$ (short of a prohibitive tax) when both curves are straight lines. So the **less elastic side bears more of the tax** — regardless of who legally pays it (3.10). Perfectly inelastic demand puts the whole tax on buyers; perfectly elastic supply does the same.`,
      idea: String.raw`From 3.10, $Q_D(P_b) = Q_S(P_b - t)$. Differentiate with respect to $t$ at $t = 0$: $Q_D'\,dP_b = Q_S'\,(dP_b - dt)$, so $dP_b/dt = Q_S'/(Q_S' - Q_D')$. Multiplying numerator and denominator by $P^*/Q^*$ turns the slopes into the elasticities of 3.1 and 3.5. For straight lines the slopes are constant, so the same algebra holds for any finite $t$. Economically: the side that can more easily walk away from the market (the more elastic one) escapes the tax.`,
      caption: String.raw`Set the two elasticities and the tax. The tax revenue rectangle splits at $P^*$ into the buyers' burden (blue, above) and the sellers' burden (orange, below). The right panel follows the two shares as the tax grows from $0$ to $40$: with straight lines the boundary is flat and sits exactly on the elasticity formula (dashed); with constant-elasticity curves it starts on the formula and drifts away. Try $|\varepsilon_D| = 0$ or $\varepsilon_S = 0$.`,
      scope: String.raw`Partial-equilibrium, competitive market (price-taking on both sides) for a per-unit tax. The elasticity formula is a first-order approximation: exact for linear curves, approximate for large taxes on curved ones. With market power, general-equilibrium effects or tax evasion the incidence can differ.`,
      deps: ['micro-3.10', 'micro-3.1', 'micro-3.5'],
      refs: ['Mankiw Ch. 6', 'Varian Ch. 16'],
      tags: ['taxation', 'elasticity'],
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.25 });
        const g = v.stage({ x: [0, 40], y: [0, 1], height: 340, axes: 'box', xlabel: 't', title: 'who pays the tax, as the tax grows', weight: 0.95, yticks: [[0.25, '25%'], [0.5, '50%'], [0.75, '75%']] });
        const kind = v.select('curves', [{ value: 'lin', label: 'straight lines' }, { value: 'ce', label: 'constant elasticity' }], 'lin');
        const ed = v.slider('demand elasticity $|\\varepsilon_D|$', 0, 4, 0.6, { step: 0.05 });
        const es = v.slider('supply elasticity $\\varepsilon_S$', 0, 4, 1.8, { step: 0.05 });
        const t = v.slider('tax $t$', 0, 40, 16, { step: 0.5 });
        let st = null;
        v.render(() => {
          const k = kind.value, a = ed.value, b = es.value, tv = t.value, Mk = elMarket(k, a, b);
          drawQ(s, Mk.QD, { color: 'blue', width: 2.6 }); drawQ(s, Mk.QS, { color: 'orange', width: 2.6 });
          s.hline(50, { color: 'muted', width: 1, dash: [3, 3] });
          s.tex('P^*', 99, 50, { dy: -3, align: 'right', baseline: 'bottom', color: 'muted', size: 14 });
          const res = taxed(Mk, tv, a, b), pred = a + b > 1e-9 ? b / (a + b) : NaN;
          if (!res) { s.dot(50, 50, { r: 5, color: 'ink' }); st = { degenerate: true }; return; }
          const { Pb, Ps, Q } = res, prohibitive = Q < 1e-6;
          drawQ(s, (p) => Mk.QS(p - tv), { color: 'orange', width: 1.6, dash: [7, 4] }, tv + 0.3, 120);
          if (!prohibitive) {
            s.rect(0, 50, Q, Pb, { fill: 'blue', fillAlpha: 0.32, stroke: false });
            s.rect(0, Ps, Q, 50, { fill: 'orange', fillAlpha: 0.32, stroke: false });
            const dem = [], sup = []; for (let i = 0; i <= 40; i++) { const p = Pb + ((50 - Pb) * i) / 40; dem.push([Mk.QD(p), p]); } for (let i = 0; i <= 40; i++) { const p = 50 + ((Ps - 50) * i) / 40; sup.push([Mk.QS(p), p]); }
            s.poly([...dem, ...sup], { fill: 'red', fillAlpha: 0.35, stroke: false });
            const share = (Pb - 50) / tv;
            tag(s, `buyers ${pct(share, 0)}`, Q / 2, (Pb + 50) / 2, 'blue', Q, Pb - 50);
            tag(s, `sellers ${pct(1 - share, 0)}`, Q / 2, (Ps + 50) / 2, 'orange', Q, 50 - Ps);
            s.line(Q, 0, Q, Pb, { color: 'muted', width: 1, dash: [3, 3] });
            s.dot(Q, Pb, { r: 5, color: 'blue' }); s.dot(Q, Ps, { r: 5, color: 'orange' });
            plab(s, Pb, 'P_b', 'blue'); plab(s, Ps, 'P_s', 'orange');
          }
          s.dot(50, 50, { r: 4.5, color: 'ink', hollow: true });
          // shares of the tax as functions of t, against the elasticity formula
          const shareAt = (tt) => { const rr = taxed(Mk, tt, a, b); return rr && rr.Q > 1e-6 ? (rr.Pb - 50) / tt : NaN; };
          const xs = []; for (let i = 0; i <= 80; i++) xs.push(Math.max(1e-3, (40 * i) / 80));
          const sh = xs.map(shareAt), ok = xs.map((x, i) => [x, sh[i]]).filter((p) => isFinite(p[1]));
          if (ok.length > 1) {
            g.poly([[ok[0][0], 0], ...ok, [ok[ok.length - 1][0], 0]], { fill: 'blue', fillAlpha: 0.3, stroke: false });
            g.poly([[ok[0][0], 1], ...ok, [ok[ok.length - 1][0], 1]], { fill: 'orange', fillAlpha: 0.3, stroke: false });
            g.path(ok, { color: 'ink', width: 2.2 });
            const mid = ok[Math.floor(ok.length / 2)];
            if (mid[1] > 0.12) g.text('buyers pay', 3, mid[1] / 2, { align: 'left', color: 'blue', size: 12, weight: 700 });
            if (mid[1] < 0.88) g.text('sellers pay', 3, (1 + mid[1]) / 2, { align: 'left', color: 'orange', size: 12, weight: 700 });
          }
          g.hline(pred, { color: 'purple', width: 2, dash: [7, 4] });
          const endUp = ok.length ? ok[ok.length - 1][1] > pred + 0.005 : false, below = endUp ? pred > 0.12 : pred > 0.88;
          g.tex('\\varepsilon_S/(\\varepsilon_S + |\\varepsilon_D|)', 39, pred, { dy: below ? 6 : -5, align: 'right', baseline: below ? 'top' : 'bottom', color: 'purple', size: 14 });
          const meas = tv > 0 ? shareAt(tv) : shareAt(1e-3);
          g.vline(tv, { color: 'muted', width: 1, dash: [3, 3] });
          if (isFinite(meas)) g.dot(Math.max(tv, 0.2), meas, { r: 5.5, color: 'ink' });
          st = { k, a, b, tv, Pb, Ps, Q, prohibitive, pred, meas };
        });
        v.legend([['blue', 'buyers’ burden $(P_b - P^*)Q_t$'], ['orange', 'sellers’ burden $(P^* - P_s)Q_t$'], ['red', 'deadweight loss'], ['purple', 'elasticity formula', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          if (st.degenerate) return 'both curves vertical: the quantity cannot change, and any split of the tax is an equilibrium — the incidence is indeterminate';
          const { k, a, b, tv, Pb, Ps, prohibitive, pred, meas } = st, f = (x) => v.fix(x, 2);
          if (prohibitive) return `the tax $t = ${tv}$ is prohibitive: nothing is traded and there is no burden to share — lower it`;
          const formula = `$\\varepsilon_S/(\\varepsilon_S + |\\varepsilon_D|) = ${f(b)}/${f(a + b)}$ = ${pct(pred)}`;
          const tail = k === 'lin' ? ' ✓ (exact for straight lines)' : ` (gap ${v.fix(100 * (meas - pred), 1)} points: exact only as $t \\to 0$)`;
          return `buyers' price $50 \\to ${f(Pb)}$, sellers' price $50 \\to ${f(Ps)}$ · buyers bear $${f(Pb - 50)}$ of $t = ${tv}$ = **${pct(meas)}**, sellers ${pct(1 - meas)} · formula ${formula}${tail} · the ${a < b ? 'demand side is less elastic and pays more' : a > b ? 'supply side is less elastic and pays more' : 'two sides are equally elastic and split it evenly'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Proposition',
      name: 'Deadweight loss grows with the square of the tax',
      credit: 'Jules Dupuit, 1844; Arnold Harberger, 1964',
      statement: String.raw`Let $D$ and $S$ be smooth inverse demand and supply curves crossing at $(Q^*, P^*)$, with slopes $D'(Q^*) < 0 < S'(Q^*)$. The deadweight loss of a per-unit tax $t$ satisfies
$$DWL(t) = \frac{t^2}{2\,\bigl(S'(Q^*) - D'(Q^*)\bigr)} + O(t^3) = \frac{t^2}{2}\,\frac{Q^*}{P^*}\,\frac{\varepsilon_S\,|\varepsilon_D|}{\varepsilon_S + |\varepsilon_D|} + O(t^3)$$
(Harberger's formula). For straight-line curves the $O(t^3)$ term vanishes and $DWL(2t) = 4\,DWL(t)$ exactly. Doubling a small tax therefore roughly quadruples its deadweight loss, while its revenue roughly doubles.`,
      idea: String.raw`The loss is the area $\int_{Q_t}^{Q^*}(D - S)$ of 3.9. Near $Q^*$ the gap $D - S$ grows linearly, $D(Q) - S(Q) \approx (S' - D')(Q^* - Q)$, and by 3.10 the tax fixes the gap at $t$, so $\Delta Q \approx t/(S' - D')$. A triangle with height $t$ and base $\Delta Q$ has area $\tfrac12 t\,\Delta Q \approx t^2/(2(S'-D'))$; Taylor's theorem (pma 5.15) bounds the curvature correction by $O(t^3)$. Geometrically, doubling the tax doubles both the height and the base, and the larger triangle is four copies of the smaller one.`,
      caption: String.raw`Slide the tax; with the toggle on, the dashed triangle is the loss from a tax twice as large, cut into four copies of the red one (exact for straight lines). Switch to curved demand and supply (drag their handles) to see the ratio drift from $4$. Right: the exact deadweight loss against the tax (red), Harberger's parabola (dashed purple) and the points $t$ and $2t$.`,
      scope: String.raw`Competitive market, per-unit tax, efficient rationing, surplus as the welfare measure. Exactly quadratic for linear curves; for curved ones the quadratic law is the leading term for small taxes and Harberger's formula can be off for large ones.`,
      deps: ['micro-3.9', 'micro-3.10', 'pma-5.15'],
      refs: ['Mankiw Ch. 8'],
      tags: ['taxation', 'welfare'],
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.2 });
        const g = v.stage({ x: [0, 50], y: [0, 800], height: 340, axes: 'box', xlabel: 't', ylabel: 'DWL', title: 'deadweight loss against the tax', weight: 1 });
        const kind = v.select('curves', [{ value: 'lin', label: 'straight' }, { value: 'cur', label: 'curved' }], 'lin');
        const t = v.slider('tax $t$', 0, 25, 18, { step: 0.5 });
        const dbl = v.toggle('compare with $2t$', true);
        const E1 = v.curves(s, { demand: { linear: [[8, 92], [92, 14]] }, supply: { linear: [[8, 14], [92, 82]] } });
        const E2 = v.curves(s, { demand: { points: [[6, 96], [36, 54], [94, 30]] }, supply: { points: [[6, 16], [56, 30], [94, 90]] } });
        let st = null;
        v.render(() => {
          const lin = kind.value === 'lin', E = lin ? E1 : E2, O = lin ? E2 : E1;
          for (const c of Object.values(E.c)) for (const h of c.handles) h.visible = true;
          for (const c of Object.values(O.c)) for (const h of c.handles) h.visible = false;
          const D = E.D, S = E.S, tv = t.value, mk = (x) => v.econ('market', D, S, 100, { tax: x });
          const r1 = mk(tv), r2 = mk(2 * tv);
          if (!r1) { E.draw({ shade: [] }); st = null; return; }
          const tri = (r) => [...trace(D, r.q, r.q0, 30), ...trace(S, r.q0, r.q, 30)];
          if (tv > 0) s.rect(0, r1.ps, r1.q, r1.pb, { fill: 'green', fillAlpha: 0.1, stroke: false });
          if (tv > 0) s.poly(tri(r1), { fill: 'red', fillAlpha: 0.5, stroke: false });
          if (dbl.value && r2 && tv > 0 && r2.q > 0) {
            s.poly(tri(r2), { color: 'red', width: 1.6, dash: [6, 4] });
            if (lin) { // the medial triangle splits the 2t-triangle into four copies of the t-triangle
              const A = [r2.q, r2.pb], B = [r2.q, r2.ps], C = [r2.q0, r2.p0], mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
              s.poly([mid(A, B), mid(B, C), mid(C, A)], { color: 'red', width: 1.1, dash: [3, 3] });
              const cen = (P, Q, R) => [(P[0] + Q[0] + R[0]) / 3, (P[1] + Q[1] + R[1]) / 3];
              const parts = [cen(A, mid(A, B), mid(C, A)), cen(B, mid(A, B), mid(B, C)), cen(mid(A, B), mid(B, C), mid(C, A))];
              if ((r2.q0 - r2.q) * s.scale > 60) parts.forEach((p, i) => s.text(String(i + 2), p[0], p[1], { color: 'red', size: 11, weight: 700, align: 'center' }));
              if ((r2.q0 - r2.q) * s.scale > 60) { const p = cen(C, mid(B, C), mid(C, A)); s.text('1', p[0], p[1], { color: 'panel', size: 11, weight: 700, align: 'center', halo: false }); }
            }
            s.fn((x) => S(x) + 2 * tv, { color: 'orange', width: 1.2, dash: [3, 4], alpha: 0.7 });
            s.text('S + 2t', 97, S(97) + 2 * tv, { dy: -9, align: 'right', color: 'orange', size: 13, math: true, alpha: 0.8 });
          }
          if (tv > 0) { s.fn((x) => S(x) + tv, { color: 'orange', width: 1.6, dash: [7, 4] }); s.measure(r1.q - 1.5, r1.ps, r1.q - 1.5, r1.pb, 't', { color: 'green', offset: -10 }); }
          E.draw({ shade: [], guides: false });
          // DWL(t): exact, Harberger, and the two points
          const h = 1e-3, dD = (D(r1.q0 + h) - D(r1.q0 - h)) / (2 * h), dS = (S(r1.q0 + h) - S(r1.q0 - h)) / (2 * h), H = (x) => (x * x) / (2 * (dS - dD));
          const xs = [], ex = []; for (let i = 0; i <= 80; i++) { const x = (50 * i) / 80, rr = mk(x); xs.push(x); ex.push(rr ? rr.dwl : NaN); }
          const top = Math.max(...ex.filter(isFinite), H(50)) * 1.08; g.setView(null, [0, top]);
          g.path(xs.map((x, i) => [x, ex[i]]), { color: 'red', width: 2.6 });
          g.fn(H, { color: 'purple', width: 2, dash: [7, 4] });
          g.line(tv, 0, tv, r1.dwl, { color: 'muted', width: 1, dash: [3, 3] });
          g.dot(tv, r1.dwl, { r: 5.5, color: 'red' }); g.tex('t', tv, r1.dwl, { dx: -7, dy: -5, align: 'right', baseline: 'bottom', size: 14, color: 'red' });
          if (r2 && 2 * tv <= 50) { g.line(2 * tv, 0, 2 * tv, r2.dwl, { color: 'muted', width: 1, dash: [3, 3] }); g.dot(2 * tv, r2.dwl, { r: 5.5, color: 'red', hollow: true }); g.tex('2t', 2 * tv, r2.dwl, { dx: -7, dy: -5, align: 'right', baseline: 'bottom', size: 14, color: 'red' }); }
          st = { lin, tv, d1: r1.dwl, d2: r2 ? r2.dwl : NaN, H1: H(tv), rev1: r1.rev, rev2: r2 ? r2.rev : NaN };
        });
        v.legend([['red', 'exact deadweight loss'], ['purple', 'Harberger: $t^2/2(S\' - D\')$', { dash: true }], ['green', 'tax revenue']]);
        v.readout(() => {
          if (!st) return 'The curves do not cross in view — drag a handle back.';
          const { lin, tv, d1, d2, H1, rev1, rev2 } = st, f = (x) => v.fix(x, 1);
          if (tv <= 0) return 'with no tax there is no deadweight loss — raise $t$';
          return `$DWL(t) = ${f(d1)}$, $DWL(2t) = ${f(d2)}$ → ratio **${v.fix(d2 / d1, 3)}**${lin ? ' (exactly 4: four copies)' : ' (≈ 4 for small $t$)'} · revenue $${f(rev1)} \\to ${f(rev2)}$ (ratio ${v.fix(rev2 / rev1, 2)}) · Harberger $t^2/2(S' - D') = ${f(H1)}$ vs exact ${f(d1)}${lin ? ' ✓' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Concept',
      name: 'Laffer curve',
      credit: 'Arthur Laffer, 1974 (the idea goes back to Dupuit, 1844)',
      statement: String.raw`The **Laffer curve** is tax revenue $R(t) = t\,Q(t)$ as a function of the tax rate. It starts at $R(0) = 0$; if some tax is high enough to stop all trade, it returns to $0$ there, so in between it rises to a maximum and then falls: beyond the revenue-maximizing rate a *higher* tax raises *less* revenue, because the tax base shrinks faster than the rate grows. For a per-unit tax on linear supply and demand through $(Q^*, P^*)$ with elasticities $\varepsilon_S$, $|\varepsilon_D|$ there, the peak is at
$$t^{\max} = \frac{P^*}{2}\Bigl(\frac{1}{|\varepsilon_D|} + \frac{1}{\varepsilon_S}\Bigr),$$
half the prohibitive tax, and it moves to lower rates as either side becomes more elastic. With perfectly inelastic demand there is no peak at all.`,
      idea: String.raw`$R'(t) = Q(t) + t\,Q'(t) = Q\,(1 + \eta)$, where $\eta = tQ'/Q$ is the elasticity of the tax base with respect to the rate — the same "rectangle gains vs rectangle losses" logic as revenue and price elasticity (3.2). Revenue rises while the base is inelastic to the tax and falls once $|\eta| > 1$. Because the deadweight loss grows like $t^2$ (3.12) while revenue grows only like $t$, the loss per unit of revenue climbs steeply, and on the falling side of the curve the tax destroys surplus while raising less money.`,
      caption: String.raw`Sweep the tax with the slider. Left: the current revenue rectangle (green) with the rectangles for $t = 20, 40, \dots, 100$ outlined in gold — they grow and then shrink. Right: revenue (green) and deadweight loss (red) against $t$, with the peak marked. Make demand or supply more elastic and the peak slides left; set $|\varepsilon_D| = 0$ and the hump disappears. Constant-elasticity curves never reach zero trade, so their Laffer curve has a long tail.`,
      deps: ['micro-3.12', 'micro-3.2'],
      refs: ['Mankiw Ch. 8', 'Varian Ch. 15'],
      tags: ['taxation', 'revenue'],
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 120], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.1 });
        const g = v.stage({ x: [0, 150], y: [0, 2000], height: 340, axes: 'box', xlabel: 't', title: 'Laffer curve: revenue $tQ(t)$', weight: 1 });
        const kind = v.select('curves', [{ value: 'lin', label: 'straight lines' }, { value: 'ce', label: 'constant elasticity' }], 'lin');
        const ed = v.slider('demand elasticity $|\\varepsilon_D|$', 0, 3, 1.2, { step: 0.05 });
        const es = v.slider('supply elasticity $\\varepsilon_S$', 0.3, 3, 1, { step: 0.05 });
        const t = v.slider('tax $t$', 0, 150, 35, { step: 0.5 });
        let st = null;
        v.render(() => {
          const k = kind.value, a = ed.value, b = es.value, tv = t.value, Mk = elMarket(k, a, b);
          const at = (x) => {
            const r = taxed(Mk, x, a, b); let Q = Math.max(0, r.Q);
            if (k === 'lin' && Q < 1e-9) { Q = 0; r.Pb = a > 0 ? 50 + 50 / a : r.Pb; r.Ps = Math.max(0, 50 - 50 / b); } // prohibitive: no trade
            const dwl = simpson((p) => Mk.QD(p), 50, r.Pb, 60) + simpson((p) => Mk.QS(p), r.Ps, 50, 60) - x * Q; return { ...r, Q, R: x * Q, dwl: Math.max(0, dwl) }; };
          drawQ(s, Mk.QD, { color: 'blue', width: 2.6 }, 0.3, 125); drawQ(s, Mk.QS, { color: 'orange', width: 2.6 }, 0.3, 125);
          for (const x of [20, 40, 60, 80, 100]) { const r = at(x); if (r.Q > 0.05 && r.Pb < 118) s.rect(0, r.Ps, r.Q, r.Pb, { color: 'gold', width: 1.3, alpha: 0.75 }); }
          const c = at(tv);
          if (c.Q > 0 && tv > 0) {
            s.rect(0, c.Ps, c.Q, c.Pb, { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1.8 });
            tag(s, 'revenue', c.Q / 2, (c.Pb + c.Ps) / 2, 'green', c.Q, c.Pb - c.Ps);
            s.dot(c.Q, c.Pb, { r: 4.5, color: 'blue' }); s.dot(c.Q, c.Ps, { r: 4.5, color: 'orange' });
          }
          s.dot(50, 50, { r: 4.5, color: 'ink', hollow: true });
          // the Laffer curve
          const xs = [], R = [], W = []; for (let i = 0; i <= 150; i++) { const r = at(i); xs.push(i); R.push(r.R); W.push(r.dwl); }
          let im = 0; for (let i = 1; i < R.length; i++) if (R[i] > R[im]) im = i;
          const pk = bisect((x) => { const h = 0.01; return at(x + h).R - at(x - h).R; }, Math.max(0.5, im - 1), Math.min(149.5, im + 1)) ?? im;
          const top = Math.max(...R) * 1.3 || 1; g.setView(null, [0, top]);
          g.path(xs.map((x, i) => [x, Math.min(W[i], top * 2)]), { color: 'red', width: 2, alpha: 0.8 });
          g.path(xs.map((x, i) => [x, R[i]]), { color: 'green', width: 2.8 });
          const peakIn = pk > 0.6 && pk < 149.4;
          if (peakIn) { const rp = at(pk); g.line(pk, 0, pk, rp.R, { color: 'gold', width: 1.2, dash: [4, 3] }); g.dot(pk, rp.R, { r: 5, color: 'gold' }); g.text(`peak t = ${pk.toFixed(1)}`, pk, rp.R, { dy: -12, align: pk > 120 ? 'right' : pk < 25 ? 'left' : 'center', color: 'gold', size: 12, weight: 700 }); }
          const tmax = k === 'lin' && a > 0 ? 50 * (1 / a + 1 / b) : Infinity;
          if (tmax < 150) { g.dot(tmax, 0, { r: 4.5, color: 'red', hollow: true }); g.text('no trade', tmax, 0, { dy: -28, align: tmax > 130 ? 'right' : 'center', color: 'red', size: 11 }); }
          g.dot(tv, c.R, { r: 6, color: 'green' });
          { let i = W.findIndex((w) => w > top * 0.88); if (i < 0) i = 140; g.text('DWL', xs[i], Math.min(W[i], top * 0.88), { dx: 8, align: 'left', color: 'red', size: 11.5, weight: 700 }); }
          st = { k, a, b, tv, c, pk, peakIn, Rpk: at(pk).R, tmax };
        });
        v.legend([['green', 'tax revenue'], ['gold', 'revenue rectangles at $t = 20, 40, \\dots, 100$'], ['red', 'deadweight loss']]);
        v.readout(() => {
          if (!st) return '';
          const { k, a, b, tv, c, pk, peakIn, Rpk, tmax } = st, f = (x) => v.fix(x, 1);
          const head = `$t = ${f(tv)}$ (${pct(tv / 50, 0)} of $P^*$) · $Q = ${f(c.Q)}$ · revenue $tQ = ${v.fix(c.R, 0)}$ · DWL ${v.fix(c.dwl, 0)}`;
          if (a < 1e-9) return `${head} · demand is perfectly inelastic: the base never shrinks, so revenue rises without limit — **no Laffer peak**`;
          if (!peakIn) return `${head} · revenue still rising at $t = 150$: the peak lies further out`;
          const side = tv < pk - 0.5 ? 'rising side: a higher tax raises more' : tv > pk + 0.5 ? '**falling side: a lower tax would raise more revenue**' : 'at the peak';
          const form = k === 'lin' ? ` · formula $\\tfrac{P^*}{2}(1/|\\varepsilon_D| + 1/\\varepsilon_S) = ${f(25 * (1 / a + 1 / b))}$ ✓, half the prohibitive tax ${f(tmax)}` : ' · constant-elasticity curves: trade never stops, the curve has a long tail';
          return `${head} · revenue peaks at $t = ${f(pk)}$ ($R = ${v.fix(Rpk, 0)}$) — ${side}${form}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Concept',
      name: 'Price ceilings',
      statement: String.raw`A **price ceiling** is a legal maximum price. If it is set below the equilibrium price $P^*$ it **binds**: sellers supply only $Q_S(\bar P)$ while buyers want $Q_D(\bar P)$, leaving a **shortage** $Q_D(\bar P) - Q_S(\bar P)$. Trade falls to $Q_S(\bar P)$, causing at least the deadweight loss $\int_{Q_S(\bar P)}^{Q^*}(D - S)$ of 3.9 — and that much only if the scarce units reach the buyers who value them most. Any other rationing adds losses: a lottery gives units to buyers with lower values (misallocation), and queueing makes buyers burn time worth up to $D(Q_S(\bar P)) - \bar P$ per unit. A ceiling above $P^*$ does not bind and changes nothing.`,
      idea: String.raw`At the controlled price the short side of the market — supply — determines the quantity traded, and the surplus on the units no longer produced is lost exactly as with any other cut in trade (3.9). But the price no longer sorts buyers, so something else must decide who gets the goods. Under random rationing the average value of a lucky buyer is the average over all willing buyers, which is lower than the average over the highest-value buyers; the difference, times the quantity, is a further loss. Under queueing the effective price rises until demand equals supply, and the extra payment is in time, which benefits no one.`,
      caption: String.raw`Lower the ceiling below $P^*$. Each dot is a buyer, placed on the demand curve at her willingness to pay; filled dots get a unit, hollow red ones want one but miss out. Switch the rationing rule: *highest value first* gives the textbook triangle; *lottery* hands units to random willing buyers (draw again) and adds the pink misallocation strip; *queueing* burns the purple rectangle in waiting time. Raise the ceiling above $P^*$ and nothing happens.`,
      deps: ['micro-2.5', 'micro-3.9'],
      refs: ['Mankiw Ch. 6', 'Varian Ch. 1'],
      tags: ['price controls'],
      viz(v) {
        const D = (q) => 96 - 1.5 * q, S = (q) => 10 + 1.2 * q, Qd = (p) => Math.max(0, (96 - p) / 1.5), Qs = (p) => Math.max(0, (p - 10) / 1.2);
        const q0 = 86 / 2.7, p0 = D(q0), N = 60, vals = Array.from({ length: N }, (_, i) => D(i + 0.5));
        const s = v.stage({ x: [0, 64], y: [0, 100], height: 360, axes: 'box', xlabel: 'Q', ylabel: 'P', full: true });
        const rule = v.select('rationing', [{ value: 'eff', label: 'highest value first' }, { value: 'lot', label: 'lottery' }, { value: 'queue', label: 'queueing' }], 'lot');
        const cap = v.slider('price ceiling $\\bar P$', 12, 90, 30, { step: 0.5 });
        let seed = 7;
        const redraw = v.button('draw the lottery again', () => { seed += 1; });
        let st = null;
        v.render(() => {
          const P = cap.value, bind = P < p0, R = rule.value;
          redraw.hidden = R !== 'lot';
          const qs = bind ? Qs(P) : q0, qd = bind ? Qd(P) : q0, pb = bind ? P : p0;
          const ts0 = simpson((x) => D(x) - S(x), 0, q0), tri = simpson((x) => D(x) - S(x), qs, q0);
          const PS = simpson((x) => pb - S(x), 0, qs);
          let CS, extra = 0, mbar = 0, meff = 0, Pf = pb;
          if (!bind || R === 'eff') CS = simpson((x) => D(x) - pb, 0, qs);
          else if (R === 'lot') { mbar = (96 + P) / 2; meff = 96 - 0.75 * qs; CS = qs * (mbar - P); extra = qs * (meff - mbar); }
          else { Pf = D(qs); CS = simpson((x) => D(x) - Pf, 0, qs); extra = qs * (Pf - P); }
          // areas
          if (!bind || R === 'eff') band(s, D, () => pb, 0, qs, 'blue', 0.22);
          else if (R === 'lot') {
            s.rect(0, P, qs, mbar, { fill: 'blue', fillAlpha: 0.22, stroke: false });
            s.rect(0, mbar, qs, meff, { fill: 'pink', fillAlpha: 0.5, stroke: false });
            s.line(0, meff, qs, meff, { color: 'blue', width: 1.2, dash: [4, 3] }); s.line(0, mbar, qs, mbar, { color: 'pink', width: 1.6 });
            s.text(`average value of the ${Math.round(qs)} highest buyers`, Math.max(qs, Qd(meff)) + 2, meff, { dy: -1, align: 'left', color: 'blue', size: 11.5 });
            s.text('average value of lottery winners', Math.max(qs, Qd(mbar)) + 2, mbar, { dy: -1, align: 'left', color: 'pink', size: 11.5, weight: 700 });
            tag(s, 'misallocation', qs / 2, (meff + mbar) / 2, 'ink', qs, meff - mbar, 11.5);
          } else {
            band(s, D, () => Pf, 0, qs, 'blue', 0.22);
            s.rect(0, P, qs, Pf, { fill: 'purple', fillAlpha: 0.3, stroke: false });
            tag(s, 'time spent queueing', qs / 2, (P + Pf) / 2, 'purple', qs, Pf - P, 11.5);
            s.line(0, Pf, qs, Pf, { color: 'purple', width: 1.4, dash: [5, 3] });
          }
          band(s, () => pb, S, 0, qs, 'orange', 0.22);
          if (bind) band(s, D, S, qs, q0, 'red', 0.4);
          s.fn(D, { color: 'blue', width: 2.4, domain: [0, 64] }); s.fn(S, { color: 'orange', width: 2.4, domain: [0, 64] });
          s.text('D', 57, D(57), { dx: 6, dy: 4, align: 'left', baseline: 'top', color: 'blue', size: 15, math: true });
          s.text('S', 63.5, Math.min(97, S(63.5)), { dx: -8, align: 'right', color: 'orange', size: 15, math: true });
          s.hline(P, { color: 'red', width: 1.8, dash: [8, 4] }); s.text(bind ? 'ceiling' : 'ceiling (not binding)', 63.5, P, { dy: -9, align: 'right', color: 'red', size: 11.5 });
          if (bind) { s.arrow(qs, P, qd, P, { color: 'red', both: true, head: 6, width: 1.5 }); s.text('shortage', (qs + qd) / 2, P, { dy: 10, align: 'center', color: 'red', size: 11 }); }
          s.dot(q0, p0, { r: 4.5, color: 'ink', hollow: bind });
          // buyers
          const nServe = Math.round(qs), elig = []; vals.forEach((x, i) => { if (x >= pb - 1e-9) elig.push(i); });
          let served = new Set(elig.slice(0, nServe));
          if (bind && R === 'lot') { const r = v.rng(seed), pool = elig.slice(); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; } served = new Set(pool.slice(0, nServe)); }
          let realized = 0;
          vals.forEach((x, i) => {
            if (served.has(i)) { realized += x - P; s.dot(i + 0.5, x, { r: 3.6, color: 'blue' }); }
            else if (x >= pb) s.dot(i + 0.5, x, { r: 3.4, color: 'red', hollow: true, width: 1.6 });
            else s.dot(i + 0.5, x, { r: 2.2, color: 'faint' });
          });
          st = { bind, P, R, qs, qd, CS, PS, tri, extra, ts0, realized, nServe, nElig: elig.length };
        });
        v.legend([['blue', 'consumer surplus; filled dot = served buyer'], ['orange', 'producer surplus'], ['red', 'deadweight triangle; hollow dot = buyer left out'], ['pink', 'misallocation (lottery)'], ['purple', 'waiting cost (queue)']]);
        v.readout(() => {
          if (!st) return '';
          const { bind, P, R, qs, qd, CS, PS, tri, extra, ts0, realized, nServe, nElig } = st, f = (x) => v.fix(x, 0);
          if (!bind) return `the ceiling $${v.fix(P, 1)}$ is above $P^* = ${v.fix(p0, 1)}$: it does not bind, the market clears and total surplus stays at ${f(ts0)}`;
          const how = R === 'eff' ? 'the highest-value buyers are served' : R === 'lot' ? `a lottery among the ${nElig} willing buyers picks ${nServe} winners (this draw: their surplus ${f(realized)}, expected ${f(CS)})` : 'buyers queue until the time cost closes the gap to $D(Q_S)$';
          const add = R === 'eff' ? '' : ` + ${R === 'lot' ? 'misallocation' : 'waiting cost'} ${f(extra)}`;
          return `ceiling $${v.fix(P, 1)}$ < $P^* = ${v.fix(p0, 1)}$: sellers supply ${v.fix(qs, 1)}, buyers want ${v.fix(qd, 1)} → **shortage ${v.fix(qd - qs, 1)}** · ${how} · CS ${f(CS)}, PS ${f(PS)} · loss = triangle ${f(tri)}${add} = **${f(tri + extra)}** (CS + PS + loss = ${f(CS + PS + tri + extra)} = free-market ${f(ts0)} ✓)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Concept',
      name: 'Price floors',
      statement: String.raw`A **price floor** is a legal minimum price (a minimum wage, an agricultural support price). Set above the equilibrium price $P^*$ it **binds**: buyers take only $Q_D(\bar P)$ while sellers would like to sell $Q_S(\bar P)$, leaving an **excess supply** (unsold output, or unemployment in a labour market). If the surplus simply goes unsold and the sales go to the lowest-cost sellers, trade falls to $Q_D(\bar P)$ and the deadweight loss is the triangle $\int_{Q_D(\bar P)}^{Q^*}(D - S)$. If instead the government buys the excess at $\bar P$ and the output has no other use, producers gain but the loss grows by the entire production cost of the unwanted units, $\int_{Q_D(\bar P)}^{Q_S(\bar P)} S$, paid for out of the government's outlay $\bar P\,(Q_S - Q_D)$. A floor below $P^*$ does not bind.`,
      idea: String.raw`With the floor the short side is demand, so buyers determine how much is sold, and the units between $Q_D(\bar P)$ and $Q^*$ — each worth more to some buyer than it costs to make — are not traded (3.9). A purchase programme removes the unsold pile by paying for it: the payment is a transfer from taxpayers to producers and cancels in the welfare total, but the resources used to make output that nobody consumes are a pure loss, which is why support schemes that buy and store surpluses are so costly.`,
      caption: String.raw`Raise the floor above $P^*$ (drag the curves too) and choose what happens to the unsold output. Left: consumer surplus (blue), producer surplus (orange), deadweight loss (red); with the purchase programme the purple frame is the government's outlay and the red region under the supply curve is the cost of output nobody uses. Right: the welfare ledger, free market against floor — the outlay hangs below zero, and the gap between the two totals is the deadweight loss.`,
      deps: ['micro-2.5', 'micro-3.9'],
      refs: ['Mankiw Ch. 6'],
      tags: ['price controls'],
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 350, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.25 });
        const g = v.stage({ x: [0.3, 2.7], y: [-3000, 3000], height: 350, axes: 'box', title: 'welfare ledger', weight: 0.85, xticks: [[1, 'free market'], [2, 'with the floor']] });
        const mode = v.select('unsold output', [{ value: 'unsold', label: 'left unsold' }, { value: 'buy', label: 'government buys it' }], 'unsold');
        const fl = v.slider('price floor $\\bar P$', 0, 100, 64, { step: 0.5 });
        const E = v.curves(s, { demand: { linear: [[6, 95], [94, 18]] }, supply: { linear: [[6, 18], [94, 72]] } });
        let st = null;
        v.render(() => {
          const D = E.D, S = E.S, r = equilibrium(D, S), f = fl.value, buy = mode.value === 'buy';
          if (!r) { s.fn(D, { color: 'blue' }); s.fn(S, { color: 'orange' }); st = null; return; }
          const bind = f > r.p, qd = bind ? qAt(D, f) : r.q, qs = bind ? qAt(S, f) : r.q, P = bind ? f : r.p, qprod = bind && buy ? qs : qd;
          const ts0 = simpson((x) => D(x) - S(x), 0, r.q), cs0 = simpson((x) => D(x) - r.p, 0, r.q), ps0 = ts0 - cs0;
          const CS = simpson((x) => D(x) - P, 0, qd), PS = simpson((x) => P - S(x), 0, qprod), G = bind && buy ? P * (qs - qd) : 0;
          const W = CS + PS - G, dwl = ts0 - W, tri = bind ? simpson((x) => D(x) - S(x), qd, r.q) : 0, waste = bind && buy ? simpson(S, qd, qs) : 0;
          band(s, D, () => P, 0, qd, 'blue', 0.22);
          band(s, () => P, S, 0, qprod, 'orange', 0.22);
          if (bind) band(s, D, S, qd, r.q, 'red', 0.42);
          if (bind && buy) {
            band(s, S, () => 0, qd, qs, 'red', 0.3);
            s.rect(qd, 0, qs, P, { color: 'purple', width: 2, dash: [6, 3] });
            tag(s, 'outlay', (qd + qs) / 2, P * 0.12 + 3, 'purple', qs - qd, 10, 11.5);
            tag(s, 'wasted cost', (qd + qs) / 2, S((qd + qs) / 2) * 0.5, 'red', (qs - qd) * 0.8, 12, 11);
          }
          tag(s, 'CS', qd * 0.3, P + 0.6 * (D(qd * 0.3) - P), 'blue', qd * 0.5, D(qd * 0.3) - P);
          tag(s, 'PS', qd * 0.3, P - 0.55 * (P - S(qd * 0.3)), 'orange', qd * 0.5, P - S(qd * 0.3));
          s.fn(D, { color: 'blue', width: 2.4 }); s.fn(S, { color: 'orange', width: 2.4 });
          s.hline(f, { color: 'purple', width: 1.8, dash: [8, 4] }); s.text(bind ? 'floor' : 'floor (not binding)', 99, f, { dy: -9, align: 'right', color: 'purple', size: 11.5 });
          if (bind) { s.arrow(qd, f, qs, f, { color: 'purple', both: true, head: 6, width: 1.5 }); s.text(buy ? 'bought by the state' : 'unsold', (qd + qs) / 2, f, { dy: -10, align: 'center', color: 'purple', size: 11 }); }
          s.dot(r.q, r.p, { r: 4.5, color: 'ink', hollow: bind });
          if (bind) { s.dot(qd, f, { r: 4.5, color: 'blue' }); s.dot(qs, f, { r: 4.5, color: buy ? 'orange' : 'faint' }); }
          // ledger
          const hi = Math.max(ts0, CS + PS) * 1.15, lo = -Math.max(G, ts0 * 0.25) * 1.25; g.setView(null, [lo, hi]);
          g.hline(0, { color: 'faint', width: 1 });
          const col = (x, a, b, c, al = 0.6) => g.rect(x - 0.28, a, x + 0.28, b, { fill: c, fillAlpha: al, stroke: false });
          col(1, 0, cs0, 'blue'); col(1, cs0, ts0, 'orange');
          col(2, 0, CS, 'blue'); col(2, CS, CS + PS, 'orange');
          if (G > 0) { col(2, -G, 0, 'purple', 0.55); g.text('outlay', 2.32, -G / 2, { align: 'left', color: 'purple', size: 11, weight: 600 }); }
          g.line(0.62, ts0, 2.38, ts0, { color: 'ink', width: 1.2, dash: [5, 4] });
          g.line(1.6, W, 2.4, W, { color: 'ink', width: 2.6 });
          if (dwl > 1) { g.rect(2.3, W, 2.38, ts0, { fill: 'red', fillAlpha: 0.75, stroke: false }); g.text('DWL', 2.42, (W + ts0) / 2, { align: 'left', color: 'red', size: 11.5, weight: 700 }); }
          g.text(`total ${W.toFixed(0)}`, 1.66, W, { dy: W < ts0 * 0.15 ? -9 : 10, align: 'left', color: 'ink', size: 11, weight: 600 });
          g.text(`${ts0.toFixed(0)}`, 1, ts0, { dy: -9, align: 'center', color: 'ink', size: 11, weight: 600 });
          st = { bind, buy, f, r, qd, qs, CS, PS, G, W, dwl, tri, waste, ts0 };
        });
        v.legend([['blue', 'consumer surplus'], ['orange', 'producer surplus'], ['purple', 'government outlay'], ['red', 'deadweight loss']]);
        v.readout(() => {
          if (!st) return 'The curves do not cross in view — drag a handle back.';
          const { bind, buy, f, r, qd, qs, CS, PS, G, W, dwl, tri, waste, ts0 } = st, F = (x) => v.fix(x, 0);
          if (!bind) return `the floor $${v.fix(f, 1)}$ is below $P^* = ${v.fix(r.p, 1)}$: it does not bind · total surplus ${F(ts0)}`;
          return `floor $${v.fix(f, 1)}$ > $P^* = ${v.fix(r.p, 1)}$: buyers take ${v.fix(qd, 1)}, sellers offer ${v.fix(qs, 1)} → **excess supply ${v.fix(qs - qd, 1)}** · CS ${F(CS)} + PS ${F(PS)}${buy ? ` − outlay ${F(G)}` : ''} = ${F(W)} vs ${F(ts0)} free market → **DWL ${F(dwl)}**${buy ? ` = triangle ${F(tri)} + cost of unused output ${F(waste)}` : ''} ✓`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.16
    {
      num: '3.16',
      kind: 'Model',
      name: 'Gains and losses from opening to trade',
      statement: String.raw`A small country with domestic demand $D$ and supply $S$ has, in autarky, the equilibrium $(Q_A, P_A)$. If it opens to trade at a world price $P_w$ it cannot influence, the domestic price becomes $P_w$: consumers buy $Q_D(P_w)$, producers sell $Q_S(P_w)$, and the difference is imported (if $P_w < P_A$) or exported (if $P_w > P_A$). Then
$$\Delta CS + \Delta PS = \int_{P_w}^{P_A}\bigl(Q_D(p) - Q_S(p)\bigr)\,dp \;\ge\; 0,$$
with equality only at $P_w = P_A$. With imports, consumers gain more than producers lose; with exports, producers gain more than consumers lose. The country as a whole gains, by an amount that grows (roughly quadratically) with the distance between the world and the autarky price — but trade creates losers as well as winners.`,
      idea: String.raw`By 3.6 and 3.7, $CS$ and $PS$ change by the areas to the left of the demand and supply curves between the two prices; their difference is the area between the curves, the integral of excess demand. Excess demand is positive below $P_A$ and negative above it, so in both cases the integral from $P_w$ to $P_A$ is positive: the transfer between consumers and producers cancels, and what remains is the triangle of gains from trade. This is 3.8 applied to the market extended by the rest of the world, and the price-taking version of the gains from specialization (1.9).`,
      caption: String.raw`Slide the world price. Below the autarky price the country imports: the transfer from producers to consumers (dashed outline) is more than covered by the consumers' gain, leaving the green triangle as the national gain. Above it the country exports and the roles swap. Right: the change in consumer surplus, producer surplus and their sum against the world price — the sum touches zero only at $P_A$.`,
      scope: String.raw`A small open economy (a price taker in the world market) trading a homogeneous good competitively, with no transport costs or trade frictions, and surplus as the welfare measure (no income effects). It ignores adjustment costs and the distribution of gains: the gain is potential — winners could compensate losers. A large country also moves the world price (terms-of-trade effects).`,
      deps: ['micro-3.8', 'micro-1.9'],
      refs: ['Mankiw Ch. 9', 'CORE Unit 18'],
      tags: ['trade', 'welfare'],
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.2 });
        const g = v.stage({ x: [5, 90], y: [-1400, 3400], height: 340, axes: 'box', xlabel: 'Pw', title: 'who gains, as a function of the world price', weight: 1 });
        const pw = v.slider('world price $P_w$', 5, 88, 32, { step: 0.5 });
        const PA = 50, QA = 50;
        let st = null;
        v.render(() => {
          const P = pw.value, qd = tQd(P), qs = tQs(P), imp = P < PA;
          // surplus at the world price
          band(s, TD, () => P, 0, qd, 'blue', 0.18);
          if (qs > 0) band(s, () => P, TS, 0, qs, 'orange', 0.18);
          if (Math.abs(P - PA) > 0.2) {
            const gain = imp ? [[qs, P], ...trace(TS, qs, QA, 20), ...trace(TD, QA, qd, 20), [qd, P]] : [[qd, P], ...trace(TD, qd, QA, 20), ...trace(TS, QA, qs, 20), [qs, P]];
            s.poly(gain, { fill: 'green', fillAlpha: 0.55, stroke: false });
            const tr = imp ? [[0, P], [0, PA], [QA, PA], ...trace(TS, QA, qs, 20), [qs, P]] : [[0, PA], [0, P], [qd, P], ...trace(TD, qd, QA, 20), [QA, PA]];
            s.poly(tr, { color: imp ? 'orange' : 'blue', width: 1.6, dash: [5, 3] });
            const tx = imp ? Math.max(qs * 0.45, 6) : qd * 0.5;
            tag(s, imp ? 'transfer from producers' : 'transfer from consumers', tx + 9, (P + PA) / 2, imp ? 'orange' : 'blue', 40, Math.abs(P - PA), 11);
          }
          s.fn(TD, { color: 'blue', width: 2.6 }); s.fn(TS, { color: 'orange', width: 2.6, domain: [0, 100] });
          s.text('D', 90, TD(90), { dx: 6, dy: 4, align: 'left', baseline: 'top', color: 'blue', size: 15, math: true });
          s.text('S', 99, Math.min(97, TS(99)), { dx: -10, align: 'right', color: 'orange', size: 15, math: true });
          s.hline(P, { color: 'gold', width: 2.4 }); s.text('world price', 99, P, { dy: imp ? -9 : 10, align: 'right', color: 'gold', size: 11.5, weight: 700 });
          s.dot(QA, PA, { r: 4.5, color: 'ink', hollow: true }); s.tex('A', QA, PA, { dx: 7, dy: 2, align: 'left', baseline: 'top', size: 14 });
          if (Math.abs(qd - qs) > 0.5) { const y = imp ? P - 3.5 : P + 3.5; s.arrow(Math.min(qd, qs), y, Math.max(qd, qs), y, { color: 'green', both: true, head: 7, width: 1.8 }); s.text(imp ? 'imports' : 'exports', (qd + qs) / 2, y, { dy: imp ? 11 : -11, align: 'center', color: 'green', size: 12, weight: 700 }); }
          s.dot(qd, P, { r: 4.5, color: 'blue' }); if (qs > 0) s.dot(qs, P, { r: 4.5, color: 'orange' });
          plab(s, PA, 'P_A', 'muted');
          // winners and losers
          const dCS = (p) => tCS(p) - tCS(PA), dPS = (p) => tPS(p) - tPS(PA);
          g.hline(0, { color: 'faint', width: 1 });
          g.line(PA, -1400, PA, 3400, { color: 'muted', width: 1, dash: [3, 3] }); g.tex('P_A', PA, -1400, { dx: 4, dy: -18, align: 'left', baseline: 'bottom', size: 13, color: 'muted' });
          g.fn(dCS, { color: 'blue', width: 2.2 }); g.fn(dPS, { color: 'orange', width: 2.2 });
          g.fn((p) => dCS(p) + dPS(p), { color: 'green', width: 3 });
          g.line(P, -1400, P, 3400, { color: 'gold', width: 1.4 });
          for (const [y, c] of [[dCS(P), 'blue'], [dPS(P), 'orange'], [dCS(P) + dPS(P), 'green']]) g.dot(P, y, { r: 4.5, color: c });
          g.text('ΔCS', 8, dCS(8), { dx: 6, dy: 8, align: 'left', baseline: 'top', color: 'blue', size: 12, weight: 600 });
          g.text('ΔPS', 87, dPS(87), { dx: -6, dy: 8, align: 'right', baseline: 'top', color: 'orange', size: 12, weight: 600 });
          g.text('net', 12, dCS(12) + dPS(12), { dx: 4, dy: -10, align: 'left', color: 'green', size: 12, weight: 700 });
          st = { P, qd, qs, imp, dcs: dCS(P), dps: dPS(P) };
        });
        v.legend([['blue', 'consumer surplus'], ['orange', 'producer surplus'], ['green', 'net gain from trade'], ['gold', 'world price']]);
        v.readout(() => {
          if (!st) return '';
          const { P, qd, qs, imp, dcs, dps } = st, f = (x) => v.fix(x, 0), net = dcs + dps;
          if (Math.abs(P - PA) < 0.25) return `$P_w = P_A = 50$: no trade, nobody gains or loses`;
          const integral = simpson((p) => tQd(p) - tQs(p), P, PA);
          return `$P_w = ${v.fix(P, 1)}$ ${imp ? '<' : '>'} $P_A = 50$: consumers buy ${v.fix(qd, 1)}, producers sell ${v.fix(qs, 1)} → **${imp ? 'imports' : 'exports'} ${v.fix(Math.abs(qd - qs), 1)}** · consumers ${sgn(dcs)}, producers ${sgn(dps)} · **national gain ${sgn(net)}** $= \\int_{P_w}^{P_A}(Q_D - Q_S)\\,dp = ${f(integral)}$ ✓ — ${imp ? 'producers lose' : 'consumers lose'}, but less than the other side gains`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.17
    {
      num: '3.17',
      kind: 'Concept',
      name: 'Tariffs and import quotas',
      statement: String.raw`A small importing country facing world price $P_w$ imposes a **tariff** $t$ per unit imported. The domestic price rises to $P_w + t$ (or to the autarky price $P_A$ if the tariff is prohibitive): domestic production rises, consumption falls and imports shrink. Consumers lose, producers gain and the government collects $t \times$ imports; the net national loss is two deadweight triangles — a **production** distortion (domestic units made at a cost above $P_w$) and a **consumption** distortion (units no longer bought although worth more than $P_w$). An **import quota** that limits imports to the same amount produces the same domestic price, quantities and triangles, but the rectangle that was tariff revenue becomes **quota rents** for whoever holds the import licences; if the rights go to foreign exporters (a "voluntary export restraint"), that rectangle is lost to the country as well.`,
      idea: String.raw`With free trade the domestic price is pinned at $P_w$ (3.16). A tariff is a tax wedge (3.10) between the world price and the domestic price, applied only to imported units; a quota is a quantity limit, and the domestic price then rises until excess demand equals the quota. Either way the domestic price and quantities are the same for the same import level, so the surplus changes of consumers and producers coincide; the only difference is who captures $(P - P_w)\times$ imports. The triangles are the deadweight losses of 3.9 at the two margins where domestic decisions are now taken at the wrong price.`,
      caption: String.raw`Raise the tariff and watch imports shrink, the green revenue rectangle appear and the two red triangles open; at $t = 24$ the tariff is prohibitive and the country is back in autarky. Switch to a quota — it starts at the import level of the current tariff and gives the same picture with the rectangle going to licence holders, or abroad under an export restraint. Right: gains and losses relative to free trade; the national bar is split into the production triangle, the consumption triangle and (under an export restraint) the rents that leave the country.`,
      deps: ['micro-3.16', 'micro-3.10', 'micro-3.9'],
      refs: ['Mankiw Ch. 9'],
      tags: ['trade', 'policy'],
      viz(v) {
        const PW = 26, PA = 50, qs0 = tQs(PW), qd0 = tQd(PW), M0 = qd0 - qs0;
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.2 });
        const g = v.stage({ x: [-1500, 1500], y: [0.3, 4.7], height: 340, axes: false, title: 'changes relative to free trade', weight: 0.95 });
        const mode = v.select('policy', [{ value: 'tariff', label: 'tariff' }, { value: 'home', label: 'quota, licences at home' }, { value: 'ver', label: 'quota, rents abroad' }], 'tariff', { onChange: (m) => { if (m === 'tariff') tr.set(Math.max(0, Math.min(30, priceOfQuota(qu.value) - PW))); else qu.set(Math.max(0, Math.min(M0, importsAt(PW + tr.value)))); } });
        const tr = v.slider('tariff $t$', 0, 30, 10, { step: 0.5 });
        const qu = v.slider('import quota', 0, M0, 31.5, { step: 0.5 });
        function importsAt(p) { return Math.max(0, tQd(p) - tQs(p)); }
        function priceOfQuota(m) { return m >= M0 ? PW : Math.min(PA, (112.5 - m) / 2.25); }
        let st = null;
        v.render(() => {
          const m = mode.value, P = m === 'tariff' ? Math.min(PW + tr.value, PA) : priceOfQuota(qu.value);
          tr.el.hidden = m !== 'tariff'; qu.el.hidden = m === 'tariff';
          const qs = tQs(P), qd = tQd(P), M = qd - qs, rect = (P - PW) * M;
          const dCS = tCS(P) - tCS(PW), dPS = tPS(P) - tPS(PW), prod = 0.5 * (qs - qs0) * (P - PW), cons = 0.5 * (qd0 - qd) * (P - PW);
          const rc = m === 'tariff' ? 'green' : m === 'home' ? 'teal' : 'pink', rname = m === 'tariff' ? 'tariff revenue' : m === 'home' ? 'quota rents (licence holders)' : 'quota rents (abroad)';
          band(s, TD, () => P, 0, qd, 'blue', 0.17);
          band(s, () => P, TS, 0, qs, 'orange', 0.2);
          if (P > PW + 0.05) {
            s.rect(qs, PW, qd, P, { fill: rc, fillAlpha: 0.45, stroke: false });
            s.poly([[qs0, PW], [qs, PW], [qs, P]], { fill: 'red', fillAlpha: 0.55, stroke: false });
            s.poly([[qd, PW], [qd, P], [qd0, PW]], { fill: 'red', fillAlpha: 0.55, stroke: false });
            tag(s, m === 'tariff' ? 'revenue' : 'rents', (qs + qd) / 2, (P + PW) / 2, rc === 'pink' ? 'red' : rc, qd - qs, P - PW, 11.5);
          }
          s.fn(TD, { color: 'blue', width: 2.6 }); s.fn(TS, { color: 'orange', width: 2.6 });
          s.text('D', 90, TD(90), { dx: 6, dy: 4, align: 'left', baseline: 'top', color: 'blue', size: 15, math: true });
          s.text('S', 99, Math.min(97, TS(99)), { dx: -10, align: 'right', color: 'orange', size: 15, math: true });
          s.hline(PW, { color: 'gold', width: 2.2 }); s.text('world price', 99, PW, { dy: 10, align: 'right', color: 'gold', size: 11.5, weight: 700 });
          if (P > PW + 0.05) { s.hline(P, { color: 'gold', width: 1.8, dash: [7, 4] }); s.text(m === 'tariff' ? (P >= PA - 1e-9 ? 'prohibitive: autarky price' : 'world price + t') : 'domestic price', 99, P, { dy: -9, align: 'right', color: 'gold', size: 11.5, weight: 700 }); }
          s.dot(50, 50, { r: 4, color: 'ink', hollow: true });
          if (M > 0.5) { s.arrow(qs, P, qd, P, { color: 'green', both: true, head: 7, width: 1.6 }); s.text('imports', (qs + qd) / 2, P, { dy: -11, align: 'center', color: 'green', size: 11.5, weight: 700 }); }
          s.line(qs0, 0, qs0, PW, { color: 'muted', width: 1, dash: [3, 3] }); s.line(qd0, 0, qd0, PW, { color: 'muted', width: 1, dash: [3, 3] });
          // ledger bars
          const net = dCS + dPS + (m === 'ver' ? 0 : rect), X = Math.max(400, 1.25 * Math.max(Math.abs(dCS), dPS, rect)); g.setView([-X, X], null);
          g.line(0, 0.35, 0, 4.65, { color: 'faint', width: 1.2 });
          const rows = [[4, 'consumers', dCS, 'blue'], [3, 'producers', dPS, 'orange'], [2, m === 'tariff' ? 'government' : m === 'home' ? 'licence holders' : 'foreign exporters (abroad)', rect, rc], [1, 'the nation (net)', net, 'red']];
          for (const [y, name, val, c] of rows) {
            if (y === 1) { // the national loss, split into its pieces
              let x0 = 0; for (const [w, cc, al] of [[prod, 'red', 0.85], [cons, 'red', 0.55], [m === 'ver' ? rect : 0, 'pink', 0.6]]) { if (w > 0) g.rect(x0, y - 0.22, x0 - w, y + 0.22, { fill: cc, fillAlpha: al, stroke: false }); x0 -= w; }
            } else if (y === 2 && m === 'ver') g.rect(0, y - 0.22, val, y + 0.22, { fill: c, fillAlpha: 0.25, color: c, width: 1.4, dash: [5, 3] });
            else g.rect(0, y - 0.22, val, y + 0.22, { fill: c, fillAlpha: 0.6, stroke: false });
            g.text(name, -X * 0.97, y + 0.36, { align: 'left', color: 'ink', size: 11.5, weight: 600 });
            g.text(sgn(val), val, y, { dx: val >= 0 ? 6 : -6, align: val >= 0 ? 'left' : 'right', color: c === 'gold' ? 'ink' : c, size: 11.5, weight: 700 });
          }
          st = { m, P, M, dCS, dPS, rect, prod, cons, net, rname };
        });
        v.legend([['blue', 'consumer surplus'], ['orange', 'producer surplus'], ['green', 'tariff revenue / quota rents'], ['red', 'deadweight triangles']]);
        v.readout(() => {
          if (!st) return '';
          const { m, P, M, dCS, dPS, rect, prod, cons, net, rname } = st, f = (x) => v.fix(x, 0);
          if (P <= PW + 0.05) return `free trade at $P_w = ${PW}$: imports ${v.fix(M0, 1)}, no deadweight loss`;
          return `domestic price $${PW} \\to ${v.fix(P, 1)}$, imports $${v.fix(M0, 1)} \\to ${v.fix(M, 1)}$ · consumers ${sgn(dCS)}, producers ${sgn(dPS)}, ${rname} +${f(rect)} · triangles: production ${f(prod)} + consumption ${f(cons)} = ${f(prod + cons)} · **national change ${sgn(net)}**${m === 'ver' ? ` = −(triangles + rents abroad ${f(rect)})` : ' = −(the two triangles) ✓'}`;
        });
      },
    },
  ],
};
