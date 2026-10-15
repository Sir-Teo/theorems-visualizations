// Microeconomics — Chapter 3: Elasticity, surplus and government intervention

// ---------- shared helpers ----------
/** Composite Simpson rule on [a, b] (oriented: b < a gives the negative). */
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
/** Points of y = f(x) for x running from a to b. */
function trace(f, a, b, n = 48) { const out = []; for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; out.push([x, f(x)]); } return out; }
/** Shade the region between the graphs top(x) and bot(x) over [a, b]. */
function band(s, top, bot, a, b, color, alpha = 0.25) {
  if (!(Math.abs(b - a) > 1e-9)) return;
  s.poly([...trace(top, a, b), ...trace(bot, b, a)], { fill: color, fillAlpha: alpha, stroke: false });
}
/** TeX price label just right of the box axis' tick numbers; TeX quantity label just above the Q axis numbers. */
function plab(s, y, tex, color = 'ink') { s.tex(tex, s.bounds.x[0], y, { dx: 30, dy: -1, color, size: 14, align: 'left', baseline: 'bottom' }); }
function qlab(s, x, tex, color = 'ink', dx = 3) { s.tex(tex, x, s.bounds.y[0], { dx, dy: -19, color, size: 14, align: dx < 0 ? 'right' : 'left', baseline: 'bottom' }); }
/** Bold area label, drawn only when the region is big enough on screen (w, h in data units). */
function tag(s, text, x, y, color, w = Infinity, h = Infinity, size = 12) {
  if (Math.abs(w * s.scale) < 34 || Math.abs(h * (s.height / (s.bounds.y[1] - s.bounds.y[0]))) < 14) return;
  s.text(text, x, y, { color, size, weight: 700, align: 'center' });
}
/** Elasticity class of a (negative or positive) elasticity. */
function elClass(e) {
  const a = Math.abs(e);
  if (!isFinite(a)) return 'perfectly elastic';
  if (a < 1e-9) return 'perfectly inelastic';
  if (Math.abs(a - 1) < 0.015) return 'unit elastic';
  return a > 1 ? 'elastic' : 'inelastic';
}
const pct = (x, d = 1) => `${x >= 0 ? '+' : '−'}${Math.abs(100 * x).toFixed(d)}%`;
const sgn = (x, d = 2) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;
/** Free-market equilibrium of inverse demand D and inverse supply S on [0, qmax]. */
function equilibrium(D, S, qmax = 100) { const q = bisect((x) => D(x) - S(x), 0, qmax); return q == null ? null : { q, p: D(q) }; }
/** Quantity at which the increasing or decreasing function F(q) equals p, clamped to [0, qmax]. */
function qAt(F, p, qmax = 100) { const r = bisect((x) => F(x) - p, 0, qmax); if (r != null) return r; const up = F(qmax) > F(0); return (up ? F(0) >= p : F(0) <= p) ? 0 : qmax; }

export default {
  collection: 'micro',
  chapter: 3,
  title: 'Elasticity, surplus and government intervention',
  summary: String.raw`Elasticities measure how strongly quantities respond to prices and income, and they decide both how revenue moves with price and who really pays a tax. Consumer and producer surplus turn the supply–demand diagram into a welfare ledger: with it one sees that a competitive equilibrium maximizes the total gains from trade, and one can measure the deadweight loss caused by taxes, quotas, price ceilings and price floors — and the gains and losses when a country opens to trade or protects itself with tariffs and quotas.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Concept',
      name: 'Price elasticity of demand',
      credit: 'Alfred Marshall, 1890',
      statement: String.raw`The **price elasticity of demand** measures how strongly the quantity demanded of a good responds to its own price: it is the percentage change in quantity per percentage change in price. At a point of a differentiable demand curve $Q = Q(P)$,
$$\varepsilon = \frac{dQ}{dP}\cdot\frac{P}{Q} = \frac{d\ln Q}{d\ln P},$$
and for a finite step one uses the ratio of the percentage changes (the *midpoint* or arc version measures each change relative to the average of its two values). By the law of demand $\varepsilon \le 0$. Demand is **elastic** where $|\varepsilon| > 1$, **unit elastic** where $|\varepsilon| = 1$ and **inelastic** where $|\varepsilon| < 1$; the limiting cases are *perfectly inelastic* demand ($\varepsilon = 0$, a vertical curve) and *perfectly elastic* demand ($|\varepsilon| = \infty$, a horizontal one). Unlike the slope, the elasticity does not depend on the units in which price and quantity are measured.`,
      idea: String.raw`The slope $dQ/dP$ is a rate in units (kilograms per euro); multiplying by $P/Q$ turns it into a ratio of *relative* changes, which is unit-free and is the limit of $\%\Delta Q/\%\Delta P$ as the step shrinks — the derivative of $\ln Q$ with respect to $\ln P$. Along a straight demand line $P = a - bQ$ the slope is constant but $P/Q$ is not, so $|\varepsilon| = P/(a-P)$ runs from $\infty$ at the choke price down to $0$ at the quantity intercept and equals $1$ exactly at the midpoint. Only the curves $Q = AP^{-e}$ keep the same elasticity $e$ everywhere; the vertical and horizontal lines are the limits $e \to 0$ and $e\to\infty$.`,
      caption: String.raw`Drag the point $A$ along the demand curve and set the size of the price step. The step's percentage changes, their ratio and the midpoint version close in on the point elasticity as the step shrinks. The curve is purple where demand is elastic and teal where it is inelastic, and the right panel plots $|\varepsilon|$ along it: a straight line has *every* elasticity. Switch to a constant-elasticity curve, or to the perfectly inelastic and perfectly elastic extremes.`,
      deps: ['micro-2.1'],
      refs: ['Mankiw Ch. 5', 'Varian Ch. 15'],
      tags: ['elasticity'],
      viz(v) {
        const M = v.M;
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.2 });
        const g = v.stage({ x: [0, 100], y: [0, 4], height: 340, axes: 'box', xlabel: 'Q', title: 'elasticity $|\\varepsilon|$ along the curve', weight: 1 });
        const kind = v.select('demand', [{ value: 'lin', label: 'linear' }, { value: 'ce', label: 'constant elasticity' }, { value: 'vert', label: 'perfectly inelastic' }, { value: 'flat', label: 'perfectly elastic' }], 'lin', { onChange: (k) => home(k) });
        const e = v.slider('curve elasticity $e$', 0.3, 3, 1.6, { step: 0.05 });
        const step = v.slider('price step $\\Delta P/P$', 0.01, 0.4, 0.2, { step: 0.01, fmt: (x) => `+${Math.round(x * 100)}%` });
        const model = (k) => {
          const E = e.value;
          if (k === 'lin') return { P: (q) => 90 - 0.9 * q, Q: (p) => Math.max(0, (90 - p) / 0.9), el: (p) => p / (90 - p) };
          if (k === 'ce') return { P: (q) => 45 * Math.pow(q / 50, -1 / E), Q: (p) => 50 * Math.pow(p / 45, -E), el: () => E };
          if (k === 'vert') return { Q: () => 50, el: () => 0 };
          return { P: () => 45, Q: (p) => (p > 45 + 1e-9 ? 0 : 100), el: () => Infinity };
        };
        const snapK = (k, x, y) => {
          const m = model(k);
          if (k === 'vert') return [50, M.clamp(y, 6, 86)];
          let lo = 2, hi = 98;
          if (k === 'ce') { lo = Math.max(1, m.Q(90)); hi = Math.min(96, m.Q(4)); }
          if (k === 'lin') hi = 94;
          const q = M.clamp(x, lo, hi); return [q, m.P(q)];
        };
        const A = s.handle(40, 54, { color: 'accent', label: 'A', labelPos: 'se', constrain: (x, y) => snapK(kind.value, x, y) });
        function home(k) { const p = { lin: [40, 0], ce: [42, 0], vert: [50, 40], flat: [45, 45] }[k]; const [x, y] = snapK(k, p[0], p[1]); A.set(x, y); }
        let st = null;
        v.render(() => {
          const k = kind.value, m = model(k), E = e.value;
          e.el.hidden = k !== 'ce';
          [A.x, A.y] = snapK(k, A.x, A.y);
          const P0 = A.y, Q0 = A.x, P1 = Math.min(P0 * (1 + step.value), 99.5), Q1 = m.Q(P1);
          const dP = (P1 - P0) / P0, dQ = (Q1 - Q0) / Q0;
          const mid = ((Q1 - Q0) / ((Q1 + Q0) / 2)) / ((P1 - P0) / ((P1 + P0) / 2));
          const point = -m.el(P0);
          st = { k, P0, Q0, P1, Q1, dP, dQ, ratio: dQ / dP, mid, point };
          // ----- the demand curve, coloured by elasticity
          const col = (x) => (Math.abs(x - 1) < 0.015 ? 'gold' : x > 1 ? 'purple' : 'teal');
          if (k === 'lin') {
            s.fn(m.P, { domain: [0, 50], color: 'purple', width: 3.2 }); s.fn(m.P, { domain: [50, 100], color: 'teal', width: 3.2 });
            s.dot(50, 45, { r: 5, color: 'gold' }); s.tex('|\\varepsilon| = 1', 50, 45, { dx: 10, dy: -4, align: 'left', baseline: 'bottom', color: 'gold', size: 13 });
            s.text('elastic', 9, m.P(9), { dx: 6, dy: 10, align: 'left', baseline: 'top', color: 'purple', size: 12, weight: 600 });
            s.text('inelastic', 80, m.P(80), { dx: 6, dy: 10, align: 'left', baseline: 'top', color: 'teal', size: 12, weight: 600 });
          } else if (k === 'ce') {
            s.fn(m.P, { domain: [0.3, 100], color: col(E), width: 3.2 });
            s.tex(`Q = A\\,P^{-${E.toFixed(2)}}`, 96, m.P(96), { dy: -10, align: 'right', baseline: 'bottom', color: col(E), size: 14 });
          } else if (k === 'vert') {
            s.vline(50, { color: 'teal', width: 3.2 }); s.tex('\\varepsilon = 0', 50, 94, { dx: 8, align: 'left', color: 'teal', size: 14 });
          } else {
            s.hline(45, { color: 'purple', width: 3.2 }); s.tex('|\\varepsilon| = \\infty', 96, 45, { dy: 8, align: 'right', baseline: 'top', color: 'purple', size: 14 });
          }
          // ----- the step from A to B
          const gd = { color: 'muted', width: 1, dash: [3, 3] };
          s.line(0, P0, Q0, P0, gd); s.line(Q0, 0, Q0, P0, gd); s.line(0, P1, Math.max(Q0, Q1), P1, gd); s.line(Q1, 0, Q1, P1, gd);
          s.arrow(Q0, P0, Q0, P1, { color: 'red', width: 2.2, head: 7 });
          if (Math.abs(Q1 - Q0) > 0.3) s.arrow(Q0, P1, Q1, P1, { color: 'blue', width: 2.2, head: 7 });
          s.tex('\\Delta P', Q0, (P0 + P1) / 2, { dx: 8, align: 'left', color: 'red', size: 13 });
          if (Math.abs(Q1 - Q0) > 0.3) s.tex('\\Delta Q', (Q0 + Q1) / 2, P1, { dy: -6, baseline: 'bottom', color: 'blue', size: 13 });
          s.dot(Q1, P1, { r: 5, color: 'gold', hollow: true, label: 'B', labelPos: Q1 < 8 ? 'ne' : 'nw' });
          if (k !== 'flat') plab(s, P0, 'P'); qlab(s, Q0, 'Q', 'ink', Q1 < Q0 ? 3 : -3);
          // ----- |ε| along the curve
          g.hband(1, 4, { color: 'purple', alpha: 0.07 }); g.hband(0, 1, { color: 'teal', alpha: 0.07 });
          g.hline(1, { color: 'gold', dash: [6, 4], width: 1.4 });
          g.text('elastic', 97, 3.75, { align: 'right', color: 'purple', size: 12, weight: 600 });
          g.text('inelastic', 97, 0.62, { align: 'right', color: 'teal', size: 12, weight: 600 });
          if (k === 'lin') { g.fn((q) => (100 - q) / q, { domain: [0.5, 50], color: 'purple', width: 2.6 }); g.fn((q) => (100 - q) / q, { domain: [50, 100], color: 'teal', width: 2.6 }); }
          else if (k === 'ce') g.hline(E, { color: col(E), width: 2.6 });
          else if (k === 'vert') g.hline(0.02, { color: 'teal', width: 3 });
          else { g.arrow(50, 3.3, 50, 3.95, { color: 'purple', width: 2.2 }); g.tex('|\\varepsilon| = \\infty \\text{ at every point}', 50, 3.2, { baseline: 'top', color: 'purple', size: 14 }); }
          const ae = Math.abs(point);
          if (k !== 'flat') {
            if (ae <= 3.95) g.dot(Q0, ae, { r: 5.5, color: 'accent', label: 'A', labelPos: 'ne' });
            else { g.arrow(Q0, 3.55, Q0, 3.97, { color: 'accent', width: 2.2, head: 7 }); g.text(`${ae.toFixed(1)}`, Q0, 3.5, { dx: 7, align: 'left', color: 'accent', size: 12 }); }
          }
        });
        v.legend([['purple', 'elastic stretch $|\\varepsilon| > 1$'], ['teal', 'inelastic stretch $|\\varepsilon| < 1$'], ['red', 'price step $\\Delta P$'], ['blue', 'quantity response $\\Delta Q$']]);
        v.readout(() => {
          if (!st) return '';
          const { k, P0, Q0, dP, dQ, ratio, mid, point } = st, f = (x) => v.fix(x, 2);
          const head = `$P = ${v.fix(P0, 1)}$, $Q = ${v.fix(Q0, 1)}$ · a ${pct(dP, 0)} price step changes $Q$ by ${pct(dQ)}`;
          if (k === 'flat') return `${head}: every buyer leaves, so the ratio of percentage changes is unbounded — **perfectly elastic**, $|\\varepsilon| = \\infty$`;
          return `${head} · ratio $\\%\\Delta Q/\\%\\Delta P = ${f(ratio)}$, midpoint ${f(mid)} · point elasticity $\\tfrac{dQ}{dP}\\tfrac{P}{Q} = ${f(point)}$${k === 'lin' ? ` $= -P/(90-P)$` : ''} → **${elClass(point)}**${k === 'lin' ? ' (on a straight line the ratio based at $A$ is exact; the midpoint version is not)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Proposition',
      name: 'Total revenue and elasticity',
      statement: String.raw`Let $Q(P)$ be a differentiable demand curve with price elasticity $\varepsilon(P) = Q'(P)\,P/Q(P)$. Total revenue (= total expenditure of the buyers) $R(P) = P\,Q(P)$ satisfies
$$R'(P) = Q(P)\,\bigl(1 + \varepsilon(P)\bigr).$$
Hence, wherever $Q > 0$: raising the price **raises** revenue where demand is inelastic ($|\varepsilon| < 1$), **lowers** it where demand is elastic ($|\varepsilon| > 1$), and an interior revenue maximum can occur only where $|\varepsilon| = 1$. In terms of quantity, marginal revenue is $MR = P\,(1 + 1/\varepsilon)$.`,
      idea: String.raw`A price rise $\Delta P$ has two effects on the revenue rectangle $P\times Q$: the units still sold bring in $\Delta P$ more each (a gain of about $Q\,\Delta P$), while the units no longer sold lose $P$ each (a loss of about $P\,|\Delta Q|$). The gain wins exactly when $P|\Delta Q| < Q\Delta P$, i.e. when $|\varepsilon| < 1$. In the limit this is the product rule, $R' = Q + PQ' = Q(1+\varepsilon)$, and the sign of the derivative decides where $R$ rises and falls (pma 5.11).`,
      caption: String.raw`Drag the price point on the demand curve and choose the size of the price rise. The green strip is the revenue gained on the units still sold, the red strip the revenue lost on the units given up. On the right, revenue is plotted against price: it rises along the teal (inelastic) stretch, falls along the purple (elastic) one, and the orange tangent has slope $Q(1+\varepsilon)$. With constant elasticity the revenue curve never turns: try $e < 1$, $e = 1$ and $e > 1$.`,
      deps: ['micro-3.1', 'pma-5.11'],
      refs: ['Mankiw Ch. 5', 'Varian Ch. 15'],
      tags: ['elasticity', 'revenue'],
      viz(v) {
        const M = v.M;
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 330, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.1 });
        const g = v.stage({ x: [0, 100], y: [0, 2700], height: 330, axes: 'box', xlabel: 'P', ylabel: 'R', title: 'revenue $R = P\\,Q(P)$ against price', weight: 1 });
        const kind = v.select('demand', [{ value: 'lin', label: 'linear' }, { value: 'ce', label: 'constant elasticity' }], 'lin', { onChange: () => { const [x, y] = snap(kind.value === 'lin' ? 36 : 50); A.set(x, y); } });
        const e = v.slider('curve elasticity $e$', 0.4, 2.5, 0.6, { step: 0.05 });
        const dp = v.slider('price rise $\\Delta P$', 1, 15, 7, { step: 0.5 });
        const model = () => kind.value === 'lin'
          ? { P: (q) => 90 - 0.9 * q, Q: (p) => Math.max(0, (90 - p) / 0.9), eps: (p) => -p / (90 - p), pr: [4, 86] }
          : { P: (q) => 45 * Math.pow(q / 50, -1 / e.value), Q: (p) => 50 * Math.pow(p / 45, -e.value), eps: () => -e.value, pr: [9, 82] };
        const snap = (x) => { const m = model(); const q = M.clamp(x, m.Q(m.pr[1]), Math.min(97, m.Q(m.pr[0]))); return [q, m.P(q)]; };
        const A = s.handle(36, 57.6, { color: 'accent', label: 'A', constrain: (x) => snap(x) });
        let st = null;
        v.render(() => {
          const m = model(), lin = kind.value === 'lin';
          e.el.hidden = lin;
          [A.x, A.y] = snap(A.x);
          const P0 = A.y, Q0 = A.x, P1 = Math.min(99, P0 + dp.value), Q1 = m.Q(P1);
          const R = (p) => p * m.Q(p), R0 = R(P0), R1 = R(P1), gain = (P1 - P0) * Q1, loss = P0 * (Q0 - Q1);
          const eps = m.eps(P0), slope = Q0 * (1 + eps), numSlope = (R(P0 + 1e-4) - R(P0 - 1e-4)) / 2e-4;
          st = { P0, Q0, P1, Q1, R0, R1, gain, loss, eps, slope, numSlope };
          // revenue rectangle and the two strips
          s.rect(0, 0, Q0, P0, { fill: 'green', fillAlpha: 0.12, stroke: false });
          s.rect(0, P0, Q1, P1, { fill: 'green', fillAlpha: 0.45, stroke: false });
          s.rect(Q1, 0, Q0, P0, { fill: 'red', fillAlpha: 0.38, stroke: false });
          s.rect(0, 0, Q0, P0, { color: 'green', width: 1.4 });
          s.tex('R = PQ', Q1 / 2, P0 / 2, { color: 'green', size: 15 });
          if ((Q0 - Q1) * s.scale > 30) s.text('lost', (Q0 + Q1) / 2, P0 / 2, { color: 'red', size: 12, weight: 700, align: 'center' });
          if ((P1 - P0) * s.height / 100 > 13) s.text('gained', Q1 * 0.62, (P0 + P1) / 2, { color: 'green', size: 12, weight: 700, align: 'center' });
          const col = lin ? null : Math.abs(e.value - 1) < 0.015 ? 'gold' : e.value > 1 ? 'purple' : 'teal';
          if (lin) { s.fn(m.P, { domain: [0, 50], color: 'purple', width: 3 }); s.fn(m.P, { domain: [50, 100], color: 'teal', width: 3 }); }
          else s.fn(m.P, { domain: [0.3, 100], color: col, width: 3 });
          s.line(0, P1, Q1, P1, { color: 'muted', dash: [3, 3], width: 1 });
          s.dot(Q1, P1, { r: 5, color: 'gold', hollow: true, label: 'B', labelPos: 'ne' });
          plab(s, P0, 'P'); plab(s, P1, 'P + \\Delta P', 'muted');
          // R(P)
          const Rmax = lin ? 3000 : 1.12 * Math.max(R(m.pr[0]), R(m.pr[1]), 2400);
          g.setView(null, [0, Rmax]);
          if (lin) {
            g.fn(R, { domain: [0, 45], color: 'teal', width: 2.8 }); g.fn(R, { domain: [45, 90], color: 'purple', width: 2.8 });
            g.dot(45, 2250, { r: 5, color: 'gold' }); g.tex('|\\varepsilon| = 1', 45, 2250, { dx: -9, dy: -5, align: 'right', baseline: 'bottom', color: 'gold', size: 14 });
            g.text('inelastic: R rises', 4, Rmax * 0.95, { align: 'left', color: 'teal', size: 12, weight: 600 });
            g.text('elastic: R falls', 97, Rmax * 0.95, { align: 'right', color: 'purple', size: 12, weight: 600 });
          } else {
            g.fn(R, { domain: [m.pr[0] * 0.7, 100], color: col, width: 2.8 });
            g.text(e.value < 0.985 ? 'inelastic everywhere: R always rises' : e.value > 1.015 ? 'elastic everywhere: R always falls' : 'unit elastic: R is constant', 50, Rmax * 0.93, { align: 'center', color: col, size: 12, weight: 600 });
          }
          const w = 11; g.line(P0 - w, R0 - slope * w, P0 + w, R0 + slope * w, { color: 'orange', width: 2.2 });
          g.line(P0, 0, P0, R0, { color: 'muted', dash: [3, 3], width: 1 });
          g.dot(P1, R1, { r: 4.5, color: 'gold', hollow: true });
          g.dot(P0, R0, { r: 5.5, color: 'accent', label: 'A', labelPos: 'sw' });
        });
        v.legend([['green', 'revenue gained on units still sold'], ['red', 'revenue lost on units no longer sold'], ['orange', 'tangent: slope $Q(1+\\varepsilon)$']]);
        v.readout(() => {
          if (!st) return '';
          const { R0, gain, loss, eps, slope, numSlope, P1, P0 } = st, f0 = (x) => v.fix(x, 0);
          const verdict = Math.abs(1 + eps) < 0.015 ? 'unit elastic: revenue is flat here' : eps > -1 ? 'inelastic: a higher price raises revenue' : 'elastic: a higher price lowers revenue';
          return `$R = PQ = ${f0(R0)}$ · raise $P$ by ${v.fix(P1 - P0, 1)}: gained $\\Delta P\\cdot Q_B = +${f0(gain)}$, lost $P\\cdot|\\Delta Q| = −${f0(loss)}$, net $\\Delta R = ${sgn(gain - loss, 0)}$ · $\\varepsilon = ${v.fix(eps, 2)}$, so $R'(P) = Q(1+\\varepsilon) = ${v.fix(slope, 2)}$ (numerical slope ${v.fix(numSlope, 2)} ✓) → **${verdict}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Income elasticity of demand',
      statement: String.raw`With prices held fixed, let $Q(m)$ be the quantity of a good demanded at income $m$ (its *Engel curve*). The **income elasticity of demand** is
$$\eta = \frac{dQ}{dm}\cdot\frac{m}{Q} = \frac{d\ln Q}{d\ln m}.$$
A good is **normal** at $m$ if $\eta > 0$ and **inferior** if $\eta < 0$. A normal good with $0 < \eta < 1$ is a **necessity**: its quantity rises less than proportionally, so its share of the budget falls as income rises. A good with $\eta > 1$ is a **luxury**: its budget share rises. The classification is local — the same good can be normal at low incomes and inferior at high ones.`,
      idea: String.raw`It is the elasticity idea of 3.1 applied to the income shifter of 2.2. On log–log axes the Engel curve's slope *is* $\eta$, so the thresholds become geometry: slope $0$ (flat) separates normal from inferior, slope $1$ (parallel to the rays $Q \propto m$) separates necessities from luxuries. The budget share $s = pQ/m$ has $d\ln s/d\ln m = \eta - 1$, so a share rises exactly when $\eta > 1$. Because the budget is spent in full, the income elasticities weighted by budget shares average to $1$ (Engel aggregation): not every good can be a luxury.`,
      caption: String.raw`Slide income. Left: the three Engel curves on log–log axes with their tangents at the current income — the tangent slope is $\eta$; the faint diagonals have slope $1$. Right: the share of income spent on each good. Food is a necessity throughout, air travel a luxury, and bus rides turn inferior once income passes $60$, where their Engel curve peaks.`,
      deps: ['micro-3.1', 'micro-2.2'],
      refs: ['Mankiw Ch. 5'],
      tags: ['elasticity', 'income'],
      viz(v) {
        const s = v.stage({ x: [10, 250], y: [0.1, 80], xlog: true, ylog: true, height: 330, xlabel: 'm', ylabel: 'Q', title: 'Engel curves (log–log): slope $= \\eta$', weight: 1.15 });
        const g = v.stage({ x: [10, 250], y: [0, 70], xlog: true, height: 330, axes: 'box', xlabel: 'm', ylabel: '%', title: 'budget share $pQ/m$ (prices $= 1$)', weight: 1 });
        const m = v.slider('income $m$', 10, 250, 40, { log: true, fmt: (x) => x.toFixed(0) });
        const GOODS = [
          { name: 'food', color: 'green', Q: (x) => 12 * Math.log(1 + x / 15) },
          { name: 'air travel', color: 'purple', Q: (x) => (0.0015 * x * x) / (1 + x / 400) },
          { name: 'bus rides', color: 'orange', Q: (x) => 0.4 * x * Math.exp(-x / 60) },
        ];
        const eta = (f, x) => { const h = 1e-4; return (Math.log(f(x * (1 + h))) - Math.log(f(x * (1 - h)))) / (Math.log(1 + h) - Math.log(1 - h)); };
        const cls = (n) => (n < -0.005 ? 'inferior' : n < 0.005 ? 'on the edge (η = 0)' : n < 0.995 ? 'necessity' : n <= 1.005 ? 'unit elastic' : 'luxury');
        let st = [];
        v.render(() => {
          const x = m.value;
          for (const c of [0.004, 0.012, 0.04, 0.12, 0.4, 1.2]) s.fn((t) => c * t, { color: 'grid', width: 1.2 });
          s.text('slope 1', 120, 0.004 * 120, { dy: 10, align: 'center', color: 'muted', size: 11 });
          s.vline(x, { color: 'gold', dash: [5, 4], width: 1.4 });
          g.vline(x, { color: 'gold', dash: [5, 4], width: 1.4 });
          st = GOODS.map((G) => {
            const q = G.Q(x), n = eta(G.Q, x);
            s.fn(G.Q, { color: G.color, width: 2.6, alpha: 0.85 });
            s.fn((t) => q * Math.pow(t / x, n), { domain: [x / 2.4, x * 2.4], color: 'ink', width: 1.4, dash: [5, 3], alpha: 0.75 });
            s.dot(x, q, { r: 5, color: G.color });
            g.fn((t) => (100 * G.Q(t)) / t, { color: G.color, width: 2.6 });
            g.dot(x, (100 * q) / x, { r: 5, color: G.color });
            return { ...G, q, n, up10: G.Q(1.1 * x) / q - 1 };
          });
          s.dot(60, GOODS[2].Q(60), { r: 3.5, color: 'orange', hollow: true });
          s.text('η = 0', 60, GOODS[2].Q(60), { dy: -10, align: 'center', color: 'orange', size: 11.5, math: true });
          for (const G of st) s.text(G.name, 245, G.Q(245), { dy: G.name === 'bus rides' ? 12 : -12, align: 'right', color: G.color, size: 12, weight: 600 });
          for (const [i, G] of st.entries()) { const xl = i === 2 ? 115 : 245; g.text(G.name, xl, (100 * G.Q(xl)) / xl, { dy: i === 0 ? 12 : -11, align: 'right', color: G.color, size: 12, weight: 600 }); }
        });
        v.legend([['green', 'food (necessity)'], ['purple', 'air travel (luxury)'], ['orange', 'bus rides (inferior at high income)'], ['ink', 'tangent: slope $\\eta$', { dash: true }]]);
        v.readout(() => st.length && `at $m = ${m.value.toFixed(0)}$: ` + st.map((G) => `${G.name} $\\eta = ${v.fix(G.n, 2)}$ → **${cls(G.n)}**`).join(' · ') + ` · a 10% raise changes the quantities by ${st.map((G) => pct(G.up10)).join(', ')} — compare each with $+10\\%$ (η = 1) and $0\\%$ (η = 0)`);
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Concept',
      name: 'Cross-price elasticity of demand',
      statement: String.raw`The **cross-price elasticity** of the demand for good $i$ with respect to the price of good $j$ is
$$\varepsilon_{ij} = \frac{\partial Q_i}{\partial P_j}\cdot\frac{P_j}{Q_i},$$
the percentage change in the quantity of $i$ per percentage change in the price of $j$, with the other prices and income held fixed. If $\varepsilon_{ij} > 0$ the goods are (gross) **substitutes**: a dearer $j$ shifts demand for $i$ outwards (tea when coffee becomes expensive). If $\varepsilon_{ij} < 0$ they are (gross) **complements**: a dearer $j$ shifts demand for $i$ inwards (milk taken in coffee). If $\varepsilon_{ij} = 0$ the goods are unrelated in demand.`,
      idea: String.raw`The price of a related good is one of the demand shifters of 2.2, and the elasticity of 3.1 turns the size of the shift into a unit-free number whose **sign** carries the classification. A dearer coffee makes people buy less coffee; whatever they drink instead gains buyers, whatever they consume with coffee loses them. The sign need not be symmetric between $\varepsilon_{ij}$ and $\varepsilon_{ji}$, because income effects differ; the symmetric notion uses compensated demands (chapter 6).`,
      caption: String.raw`Drag the coffee price along the coffee demand curve (the hollow point is the starting price $4$). Tea and milk keep their own prices, but their demand curves move: dashed is where they started. The sliders set how each good responds to the coffee price; push one across zero and watch the pair change from substitutes to complements.`,
      deps: ['micro-3.1', 'micro-2.2'],
      refs: ['Mankiw Ch. 5'],
      tags: ['elasticity'],
      viz(v) {
        const M = v.M, H = 285;
        const sc = v.stage({ x: [0, 45], y: [0, 10], height: H, axes: 'box', xlabel: 'Q', ylabel: 'P', title: 'coffee', minWidth: 235 });
        const sT = v.stage({ x: [0, 45], y: [0, 8], height: H, axes: 'box', xlabel: 'Q', ylabel: 'P', title: 'tea', minWidth: 235 });
        const sM = v.stage({ x: [0, 45], y: [0, 6], height: H, axes: 'box', xlabel: 'Q', ylabel: 'P', title: 'milk', minWidth: 235 });
        const kT = v.slider('tea: exponent of $P_{coffee}$', -1, 1, 0.7, { step: 0.05 });
        const kM = v.slider('milk: exponent of $P_{coffee}$', -1, 1, -0.5, { step: 0.05 });
        const PC0 = 4, PT = 3, PM = 2;
        const Qc = (p) => 40 * Math.pow(p, -0.8), Pc = (q) => Math.pow(q / 40, -1.25);
        const H0 = sc.handle(Qc(6), 6, { color: 'accent', constrain: (x) => { const q = M.clamp(x, Qc(9.4), Qc(1.3)); return [q, Pc(q)]; } });
        // Q_i = A_i P_i^{-own} P_c^{k}, calibrated so that Q_i = 15 at the starting coffee price
        const good = (own, Pi, k) => { const A = 15 / (Math.pow(Pi, -own) * Math.pow(PC0, k)); return { Q: (p, pc) => A * Math.pow(p, -own) * Math.pow(pc, k), P: (q, pc) => Math.pow(q / (A * Math.pow(pc, k)), -1 / own) }; };
        const arc = (q0, q1, p0, p1) => ((q1 - q0) / ((q1 + q0) / 2)) / ((p1 - p0) / ((p1 + p0) / 2));
        const kind = (e) => (e > 0.02 ? 'substitutes' : e < -0.02 ? 'complements' : 'unrelated');
        let st = null;
        v.render(() => {
          const pc = H0.y, tea = good(1.2, PT, kT.value), milk = good(0.6, PM, kM.value);
          // coffee
          sc.fn(Pc, { domain: [3, 45], color: 'blue', width: 2.6 });
          sc.dot(Qc(PC0), PC0, { r: 5, color: 'muted', hollow: true });
          sc.line(0, pc, H0.x, pc, { color: 'muted', dash: [3, 3], width: 1 });
          sc.text(`P = ${pc.toFixed(2)}`, H0.x, pc, { dx: 12, dy: 2, align: 'left', baseline: 'top', color: 'accent', size: 12 });
          sc.text('D coffee', 44, Pc(44), { dy: -10, align: 'right', color: 'blue', size: 12, math: true });
          const out = {};
          for (const [S, G, Pi, key, col, ymax] of [[sT, tea, PT, 'tea', 'teal', 8], [sM, milk, PM, 'milk', 'purple', 6]]) {
            const q0 = 15, q1 = G.Q(Pi, pc), e = Math.abs(pc - PC0) > 0.05 ? arc(q0, q1, PC0, pc) : (key === 'tea' ? kT.value : kM.value);
            S.fn((q) => G.P(q, PC0), { domain: [0.5, 45], color: col, width: 1.6, dash: [6, 4], alpha: 0.7 });
            S.fn((q) => G.P(q, pc), { domain: [0.5, 45], color: col, width: 2.8 });
            S.hline(Pi, { color: 'muted', dash: [3, 3], width: 1 });
            S.dot(q0, Pi, { r: 4.5, color: 'muted', hollow: true });
            if (Math.abs(q1 - q0) > 0.4) S.arrow(q0, Pi, Math.min(q1, 44.5), Pi, { color: q1 > q0 ? 'green' : 'red', width: 2.4, head: 8 });
            S.dot(Math.min(q1, 44.5), Pi, { r: 5, color: col });
            S.text(`own price ${Pi}`, 44, Pi, { dy: -9, align: 'right', color: 'muted', size: 11 });
            S.setTitle(`${key}: **${kind(e)}**`);
            S.tex(`\\varepsilon_{${key},\\,c} = ${e >= 0 ? '+' : ''}${v.fix(e, 2)}`, S.bounds.x[1], S.bounds.y[1], { dx: -8, dy: 8, align: 'right', baseline: 'top', color: col, size: 15 });
            out[key] = { q0, q1, e };
          }
          st = { pc, ...out };
        });
        v.legend([['blue', 'coffee demand'], ['muted', 'tea and milk demand before the change', { dash: true }], ['green', 'demand gained'], ['red', 'demand lost']]);
        v.readout(() => {
          if (!st) return '';
          const { pc, tea, milk } = st, moved = Math.abs(pc - PC0) > 0.05;
          const dP = moved ? (pc - PC0) / ((pc + PC0) / 2) : 0;
          if (!moved) return `coffee is at its starting price $4$ — drag it to measure the cross elasticities (point values: tea ${sgn(tea.e)}, milk ${sgn(milk.e)})`;
          return `coffee price $4 \\to ${v.fix(pc, 2)}$ (${pct(dP)} midpoint) · tea at its own price $3$: $15 \\to ${v.fix(tea.q1, 1)}$, so $\\varepsilon_{tea,coffee} = ${v.fix(tea.e, 2)}$ → **${kind(tea.e)}** · milk at price $2$: $15 \\to ${v.fix(milk.q1, 1)}$, so $\\varepsilon_{milk,coffee} = ${v.fix(milk.e, 2)}$ → **${kind(milk.e)}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Concept',
      name: 'Price elasticity of supply',
      statement: String.raw`The **price elasticity of supply** is the percentage change in quantity supplied per percentage change in price, $\varepsilon_S = \dfrac{dQ_S}{dP}\cdot\dfrac{P}{Q_S} \ge 0$ for an upward-sloping supply curve. Supply is elastic if $\varepsilon_S > 1$ and inelastic if $\varepsilon_S < 1$; a vertical supply curve (a fixed stock) is perfectly inelastic. Supply is typically far more elastic in the long run than in the short run, because firms can adjust capacity and new firms can enter. Consequently a given demand shock moves the price a lot and the quantity little at first, and the reverse once supply has had time to respond.`,
      idea: String.raw`The definition is that of 3.1 applied to the supply curve of 2.3. Geometrically, $\varepsilon_S = (P/Q)\big/(dP/dQ)$ is the slope of the ray from the origin to the point divided by the slope of the supply curve there: a straight supply line through the origin has $\varepsilon_S = 1$ at every point whatever its steepness, one that meets the price axis is elastic, one that meets the quantity axis inelastic. When demand shifts, the new equilibrium slides along the supply curve, so the split of the shock between price and quantity is governed by how steep that curve is.`,
      caption: String.raw`Shift demand with the slider and choose the time horizon. The same shock hits a fixed stock (market period), a steep short-run supply curve and a flat long-run one; the bars compare the percentage changes in price and quantity for all three. The dashed ray from the origin through the new equilibrium, compared with the slope of the supply curve, gives the point elasticity.`,
      deps: ['micro-2.3', 'micro-3.1'],
      refs: ['Mankiw Ch. 5'],
      tags: ['elasticity', 'supply'],
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.2 });
        const b = v.stage({ x: [0.45, 3.55], y: [-70, 70], height: 340, axes: 'box', ylabel: '% change', title: 'the same shock at three horizons', weight: 0.95, xticks: [[1, 'market period'], [2, 'short run'], [3, 'long run']] });
        const hz = v.select('horizon', [{ value: 0, label: 'market period' }, { value: 1, label: 'short run' }, { value: 2, label: 'long run' }], 1);
        const sh = v.slider('demand shift', -25, 30, 20, { step: 0.5 });
        const K = [0, 0.4, 3], NAMES = ['market period', 'short run', 'long run'], COLS = ['purple', 'orange', 'teal'];
        // supply Q = 50 + k (P − 50) through the old equilibrium (50, 50); demand Q = 100 − P + Δ
        const eq = (k, d) => { const P = 50 + d / (1 + k); return { P, Q: 50 + k * (P - 50) }; };
        let st = null;
        v.render(() => {
          const d = sh.value, sel = +hz.value;
          s.fn((q) => 100 - q, { color: 'blue', width: 1.5, dash: [6, 4], alpha: 0.6 });
          s.fn((q) => 100 - q + d, { color: 'blue', width: 2.8 });
          K.forEach((k, i) => {
            const on = i === sel, sty = { color: COLS[i], width: on ? 3 : 1.6, alpha: on ? 1 : 0.45, dash: on ? null : [5, 4] };
            if (k === 0) s.vline(50, sty); else s.fn((q) => 50 + (q - 50) / k, sty);
          });
          s.text('market', 50, 97, { dx: 5, align: 'left', color: COLS[0], size: 11.5, alpha: sel === 0 ? 1 : 0.6 });
          s.text('short run', 50 + 0.4 * 46, 96, { dx: 5, align: 'left', color: COLS[1], size: 11.5, alpha: sel === 1 ? 1 : 0.6 });
          s.text('long run', 98, 50 + 48 / 3, { dy: -10, align: 'right', color: COLS[2], size: 11.5, alpha: sel === 2 ? 1 : 0.6 });
          const r = eq(K[sel], d);
          const kr = Math.min(100 / r.Q, 100 / r.P); s.line(0, 0, r.Q * kr, r.P * kr, { color: 'ink', dash: [1, 4], width: 1.8, alpha: 0.6 });
          s.text('ray from 0', r.Q * kr * 0.93, r.P * kr * 0.93, { dx: -6, align: 'right', color: 'muted', size: 11 });
          s.dot(50, 50, { r: 5, color: 'ink', hollow: true });
          if (Math.abs(r.P - 50) > 0.6) s.arrow(50 - 2.5, 50, 50 - 2.5, r.P, { color: 'red', width: 2, head: 7 });
          if (Math.abs(r.Q - 50) > 0.6) s.arrow(50, 50 - 3, r.Q, 50 - 3, { color: 'blue', width: 2, head: 7 });
          s.dot(r.Q, r.P, { r: 5.5, color: COLS[sel] });
          s.line(0, r.P, r.Q, r.P, { color: 'muted', dash: [3, 3], width: 1 }); s.line(r.Q, 0, r.Q, r.P, { color: 'muted', dash: [3, 3], width: 1 });
          plab(s, r.P, 'P_1', 'ink'); plab(s, 50, 'P_0', 'muted');
          s.text('D′', 98, 100 - 98 + d, { dy: -10, align: 'right', color: 'blue', size: 15, math: true });
          // bars
          b.hline(0, { color: 'faint', width: 1 });
          const rows = K.map((k, i) => { const e = eq(k, d); return { dP: (e.P - 50) / 50, dQ: (e.Q - 50) / 50 }; });
          rows.forEach((rw, i) => {
            const a = i === sel ? 0.85 : 0.3, x = i + 1;
            b.rect(x - 0.34, 0, x - 0.02, 100 * rw.dP, { fill: 'red', fillAlpha: a, stroke: false });
            b.rect(x + 0.02, 0, x + 0.34, 100 * rw.dQ, { fill: 'blue', fillAlpha: a, stroke: false });
            if (i === sel) {
              const lab = (val, xx) => b.text(`${val >= 0 ? '+' : '−'}${Math.abs(100 * val).toFixed(0)}%`, xx, 100 * val, { dy: val >= 0 ? -9 : 9, align: 'center', color: 'ink', size: 11.5, weight: 600 });
              lab(rw.dP, x - 0.18); lab(rw.dQ, x + 0.18);
            }
          });
          const k = K[sel], mid = rows[sel], arcE = Math.abs(r.P - 50) < 1e-9 ? NaN : ((r.Q - 50) / ((r.Q + 50) / 2)) / ((r.P - 50) / ((r.P + 50) / 2));
          st = { sel, r, k, arcE, rows, ray: r.P / r.Q, curve: k ? 1 / k : Infinity };
        });
        v.legend([['red', '% change in price'], ['blue', '% change in quantity'], ['ink', 'ray from the origin', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { sel, r, k, arcE, rows, ray, curve } = st, f = (x) => v.fix(x, 2);
          const pe = k * r.P / r.Q;
          const geo = k === 0 ? 'vertical supply: $\\varepsilon_S = 0$' : `ray slope $P/Q = ${f(ray)}$ ÷ supply slope $${f(curve)}$ $= ${f(pe)}$`;
          return `**${NAMES[sel]}**: price ${pct(rows[sel].dP)}, quantity ${pct(rows[sel].dQ)} · arc elasticity of supply ${isFinite(arcE) ? f(arcE) : '—'} · point elasticity at the new equilibrium: ${geo} → **${elClass(pe) === 'perfectly elastic' ? 'elastic' : elClass(pe)}** · the price moves ${pct(rows[0].dP, 0)}, ${pct(rows[1].dP, 0)}, ${pct(rows[2].dP, 0)} as the horizon lengthens`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Concept',
      name: 'Consumer surplus',
      credit: 'Jules Dupuit, 1844; Alfred Marshall, 1890',
      statement: String.raw`A buyer's **willingness to pay** (reservation price) for a unit is the most she would pay for it. When she buys at price $P$, her **consumer surplus** is her willingness to pay minus $P$. With unit-demand buyers whose reservation prices are $v_1 \ge v_2 \ge \dots$, market consumer surplus at price $P$ is
$$CS(P) = \sum_i \max(v_i - P,\,0),$$
the area between the stepped demand curve and the price line; for a smooth inverse demand curve $D(Q)$ it is $CS(P) = \int_0^{Q(P)} \bigl(D(q) - P\bigr)\,dq$. A price cut from $P_0$ to $P_1$ raises consumer surplus by a rectangle — $(P_0 - P_1)$ for each buyer who was already buying — plus a roughly triangular piece from the new buyers.`,
      idea: String.raw`The demand curve of 2.1 lists reservation prices from the highest down, so the height of the curve above the price line *is* each marginal buyer's gain. Summing the gains of everyone who buys gives the area between the curve and the price; as the buyers become numerous the steps shrink and the sum becomes an integral (a Riemann sum converging). Using the area as a money measure of welfare is exact for unit-demand buyers, and more generally when income effects are negligible (quasilinear utility).`,
      caption: String.raw`Each bar is one buyer's willingness to pay, sorted from the highest; drag the price handle $P$ on the right. The shaded tops of the bars are the individual surpluses. Switch to *price cut from $P_0$* to split the gain into the rectangle of the existing buyers and the piece of the new ones. Increase the number of buyers and the staircase approaches the smooth demand curve (dashed), the sum its integral.`,
      deps: ['micro-2.1'],
      refs: ['Mankiw Ch. 7', 'Varian Ch. 14'],
      tags: ['welfare'],
      viz(v) {
        const M = v.M, P0 = 60;
        const s = v.stage({ x: [0, 14], y: [0, 100], height: 350, axes: 'box', xlabel: 'buyers', ylabel: 'P', full: true, xticks: [] });
        const mode = v.select('show', [{ value: 'cs', label: 'surplus at price $P$' }, { value: 'cut', label: 'price cut from $P_0 = 60$' }], 'cs');
        const nB = v.slider('number of buyers', 5, 120, 14, { int: true });
        const D = (u) => 94 - 1.45 * u; // smooth reservation prices, u in [0, 60]
        let cacheN = -1, vals = [];
        const values = (n) => {
          if (n === cacheN) return vals;
          const r = v.rng(11 + n); vals = Array.from({ length: n }, (_, i) => M.clamp(D((60 * (i + 0.5)) / n) + 5 * (r() - 0.5) * 2, 3, 98)).sort((a, b) => b - a);
          cacheN = n; return vals;
        };
        const hP = s.handle(14, 38, { color: 'red', label: 'P', labelPos: 'w', constrain: (x, y) => [s.bounds.x[1] * 0.972, M.clamp(y, 4, 96)] });
        let st = null;
        v.render(() => {
          const n = nB.value, vs = values(n), P = hP.y, cut = mode.value === 'cut';
          s.setView([0, n * 1.06], [0, 100]); hP.x = n * 1.03;
          const gap = n <= 30 ? 0.1 : 0.02, Ds = (x) => D((60 * x) / n);
          let cs = 0, buyers = 0, old = 0, newG = 0, nOld = 0, nNew = 0, cs0 = 0;
          vs.forEach((val, i) => {
            const x0 = i + gap, x1 = i + 1 - gap;
            s.rect(x0, 0, x1, val, { fill: 'blue', fillAlpha: 0.08, color: 'blue', width: 0.8, alpha: 0.35 });
            if (val > P) { cs += val - P; buyers++; }
            if (val > P0) cs0 += val - P0;
            if (!cut) { if (val > P) s.rect(x0, P, x1, val, { fill: 'blue', fillAlpha: 0.5, stroke: false }); }
            else {
              const lo = Math.min(P, P0), hi = Math.max(P, P0);
              if (val > hi) { s.rect(x0, hi, x1, val, { fill: 'blue', fillAlpha: 0.22, stroke: false }); s.rect(x0, lo, x1, hi, { fill: P < P0 ? 'green' : 'red', fillAlpha: 0.5, stroke: false }); old += hi - lo; nOld++; }
              else if (val > lo) { s.rect(x0, lo, x1, val, { fill: P < P0 ? 'teal' : 'pink', fillAlpha: 0.55, stroke: false }); newG += val - lo; nNew++; }
            }
            if (n <= 16) s.text(val.toFixed(0), i + 0.5, val, { dy: -8, align: 'center', color: 'muted', size: 10.5 });
          });
          s.fn(Ds, { domain: [0, n], color: 'ink', width: 1.4, dash: [6, 4], alpha: 0.7 });
          if (cut) { s.hline(P0, { color: 'muted', width: 1.6, dash: [7, 4] }); plab(s, P0, 'P_0', 'muted'); }
          s.hline(P, { color: 'red', width: 2 });
          const xs = Math.max(0, Math.min(n, ((94 - P) / 1.45) * (n / 60))), smooth = simpson((x) => Ds(x) - P, 0, xs);
          st = { n, P, cs, buyers, smooth, old, newG, nOld, nNew, cs0 };
        });
        v.legend([['blue', 'consumer surplus of each buyer'], ['green', 'price cut: gain of existing buyers'], ['teal', 'price cut: gain of new buyers'], ['ink', 'smooth demand curve', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { n, P, cs, buyers, smooth, old, newG, nOld, nNew, cs0 } = st, f = (x) => v.fix(x, 0);
          if (mode.value === 'cs') return `$P = ${v.fix(P, 1)}$ · ${buyers} of ${n} buyers have $v_i > P$ and buy · $CS = \\sum_i \\max(v_i - P, 0) = ${v.fix(cs, 1)}$ · area under the smooth curve $\\int (D - P) = ${v.fix(smooth, 1)}$ (closer as the number of buyers grows)`;
          const dir = P < P0 ? 'cut' : 'rise';
          if (Math.abs(P - P0) < 0.05) return 'drag $P$ away from $P_0 = 60$ to see the change in consumer surplus';
          return `price ${dir} $60 \\to ${v.fix(P, 1)}$: ${nOld} existing buyers ${P < P0 ? 'gain' : 'lose'} $${nOld} \\times ${v.fix(Math.abs(P0 - P), 1)} = ${f(old)}$ · ${nNew} buyers ${P < P0 ? 'enter, gaining' : 'drop out, losing'} ${f(newG)} · $\\Delta CS = ${sgn(P < P0 ? old + newG : -(old + newG), 1)}$ $= CS(${v.fix(P, 1)}) - CS(60) = ${v.fix(cs, 1)} - ${v.fix(cs0, 1)}$ ✓`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Concept',
      name: 'Producer surplus',
      statement: String.raw`A seller's **cost** (reservation price) for a unit is the least she would accept for it. Selling at price $P$ earns her a **producer surplus** of $P$ minus that cost. With unit-supply sellers of costs $c_1 \le c_2 \le \dots$, market producer surplus at price $P$ is
$$PS(P) = \sum_j \max(P - c_j,\,0) = \int_0^{P} Q_S(p)\,dp,$$
the area between the price line and the (stepped) supply curve; for a smooth inverse supply curve $S(Q)$ it is $\int_0^{Q_S(P)} \bigl(P - S(q)\bigr)\,dq$. In particular $PS$ is increasing and convex in $P$, with slope $PS'(P) = Q_S(P)$: a price rise adds a strip of height $\Delta P$ for every active seller and brings in the sellers whose costs it passes.`,
      idea: String.raw`The supply curve of 2.3 lists the sellers' costs from the cheapest up, so the gap between the price and the curve is each seller's gain, and the sum is an area. Slicing that area horizontally instead of vertically gives the second formula: at each price level $p < P$ the slice is as long as the number of sellers willing to sell at $p$. Differentiating in $P$ (the integral as a function of its upper limit) shows that the slope of $PS(P)$ is the quantity supplied — kinks appear exactly where a new seller enters.`,
      caption: String.raw`Each bar is one seller's cost, sorted from the cheapest; drag the price handle $P$. Sellers whose cost is below the price produce, and the shaded gaps are their surpluses; bars above the price stay idle. The right panel plots producer surplus against the price: its slope (blue tangent) equals the number of active sellers, and its kinks sit at the sellers' costs (ticks on the axis).`,
      deps: ['micro-2.3', 'pma-6.20'],
      refs: ['Mankiw Ch. 7', 'Varian Ch. 14'],
      tags: ['welfare'],
      viz(v) {
        const M = v.M;
        const s = v.stage({ x: [0, 10], y: [0, 100], height: 330, axes: 'box', xlabel: 'sellers', ylabel: 'P', weight: 1.15, xticks: [] });
        const g = v.stage({ x: [0, 100], y: [0, 500], height: 330, axes: 'box', xlabel: 'price P', ylabel: 'PS', title: 'producer surplus as a function of price', weight: 1 });
        const nS = v.slider('number of sellers', 4, 60, 10, { int: true });
        let cacheN = -1, cs = [];
        const costs = (n) => {
          if (n === cacheN) return cs;
          const r = v.rng(5 + 3 * n); cs = Array.from({ length: n }, (_, i) => M.clamp(9 + (78 * (i + 0.5)) / n + 6 * (r() - 0.5) * 2, 2, 97)).sort((a, b) => a - b);
          cacheN = n; return cs;
        };
        const hP = s.handle(10, 55, { color: 'red', label: 'P', labelPos: 'w', constrain: (x, y) => [s.bounds.x[1] * 0.963, M.clamp(y, 3, 97)] });
        const PS = (c, P) => c.reduce((a, x) => a + Math.max(0, P - x), 0);
        let st = null;
        v.render(() => {
          const n = nS.value, c = costs(n), P = hP.y, gap = n <= 30 ? 0.1 : 0.02;
          s.setView([0, n * 1.08], [0, 100]); hP.x = n * 1.04;
          let k = 0;
          c.forEach((x, i) => {
            const act = x < P;
            s.rect(i + gap, 0, i + 1 - gap, x, { fill: act ? 'orange' : 'gray', fillAlpha: act ? 0.16 : 0.1, color: act ? 'orange' : 'gray', width: 0.8, alpha: 0.45 });
            if (act) { k++; s.rect(i + gap, x, i + 1 - gap, P, { fill: 'orange', fillAlpha: 0.55, stroke: false }); }
            if (n <= 14) s.text(x.toFixed(0), i + 0.5, x, { dy: act ? 9 : -8, align: 'center', color: 'muted', size: 10.5 });
          });
          s.hline(P, { color: 'red', width: 2 });
          if (k < n) s.text(`${n - k} idle`, (k + n) / 2, 96, { align: 'center', color: 'muted', size: 12, weight: 600, baseline: 'top' });
          if (k > 0) s.text(`${k} produce`, k / 2, Math.max(P - 4, 3), { align: 'center', color: 'orange', size: 12, weight: 600, baseline: 'top' });
          // PS(P)
          const top = PS(c, 100) * 1.08; g.setView(null, [0, top]);
          g.fn((p) => PS(c, p), { domain: [0, 100], color: 'orange', width: 2.6, n: 800 });
          for (const x of c) g.line(x, 0, x, top * 0.03, { color: 'orange', width: 1.2 });
          const ps = PS(c, P), w = 14;
          g.line(P - w, ps - k * w, P + w, ps + k * w, { color: 'blue', width: 2.2 });
          g.line(P, 0, P, ps, { color: 'red', dash: [3, 3], width: 1.2 });
          g.dot(P, ps, { r: 5.5, color: 'red' });
          g.text(`slope ${k}`, P + w, ps + k * w, { dx: 4, align: 'left', color: 'blue', size: 12, weight: 600 });
          const num = (PS(c, P + 1e-3) - PS(c, P - 1e-3)) / 2e-3;
          st = { n, P, k, ps, num };
        });
        v.legend([['orange', 'producer surplus of each active seller'], ['gray', 'idle sellers (cost above the price)'], ['blue', 'tangent to $PS(P)$']]);
        v.readout(() => st && `$P = ${v.fix(st.P, 1)}$ · ${st.k} of ${st.n} sellers have $c_j < P$ and produce · $PS = \\sum_j \\max(P - c_j, 0) = ${v.fix(st.ps, 1)}$ · slope of $PS(P)$ here $= ${v.fix(st.num, 2)}$ = quantity supplied $Q_S(P) = ${st.k}$ ✓`);
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Proposition',
      name: 'Competitive equilibrium maximizes total surplus',
      statement: String.raw`Let $D(Q)$ be a decreasing inverse demand curve and $S(Q)$ an increasing inverse supply curve that cross at the competitive equilibrium $(Q^*, P^*)$. Suppose the units traded go to the buyers with the highest willingness to pay and are produced by the sellers with the lowest costs. Then the total surplus from trading the quantity $Q$,
$$TS(Q) = \int_0^{Q} \bigl(D(q) - S(q)\bigr)\,dq = CS + PS,$$
is maximized exactly at $Q = Q^*$. Trading less leaves gains untaken; trading more creates units whose cost exceeds their value to any buyer. The competitive market also achieves the efficient allocation of who buys and who sells, so the equilibrium attains the largest total surplus of any allocation.`,
      idea: String.raw`The price is only a transfer between buyer and seller, so it cancels from $CS + PS$, leaving the area between demand and supply. By the fundamental theorem of calculus $TS'(Q) = D(Q) - S(Q)$: the marginal unit is worth $D(Q)$ to its buyer and costs $S(Q)$ to make. This is positive before $Q^*$ and negative after (2.5), so $TS$ rises and then falls and peaks where the curves cross. At the market price only buyers with $v \ge P^*$ buy and only sellers with $c \le P^*$ sell, which is the efficient selection (3.6, 3.7).`,
      caption: String.raw`Force the quantity traded with the slider (or drag the curves' handles). Green is the surplus actually realized; light red marks gains left untaken when $Q < Q^*$; solid red marks value destroyed when $Q > Q^*$, on units that cost more than buyers think they are worth. Right: $TS(Q)$ peaks at $Q^*$, where the slope $D - S$ of the marginal unit is zero.`,
      scope: String.raw`Holds in a competitive (price-taking) market for a single good with no externalities, when surplus is an adequate welfare measure (unit demands or quasilinear utility, so no income effects) and the traded units go to the highest-value buyers and lowest-cost sellers. It says nothing about the distribution of the surplus.`,
      deps: ['micro-2.5', 'micro-3.6', 'micro-3.7', 'pma-6.20'],
      refs: ['Mankiw Ch. 7'],
      tags: ['welfare', 'efficiency'],
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.15 });
        const g = v.stage({ x: [0, 100], y: [-1000, 3000], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'TS', title: 'total surplus $TS(Q) = \\int_0^Q (D - S)$', weight: 1 });
        const q = v.slider('quantity traded $Q$', 0, 100, 28, { step: 0.5 });
        const E = v.curves(s, { demand: { points: [[5, 93], [45, 52], [95, 20]] }, supply: { points: [[5, 10], [50, 40], [95, 90]] } });
        v.button('trade $Q^*$', () => { const r = equilibrium(E.D, E.S); if (r) q.set(r.q); });
        let st = null;
        v.render(() => {
          const D = E.D, S = E.S, r = equilibrium(D, S), Q = q.value;
          if (!r) { E.draw({ shade: [] }); st = null; return; }
          const lo = Math.min(Q, r.q);
          band(s, D, S, 0, lo, 'green', 0.3);
          if (Q < r.q) band(s, D, S, Q, r.q, 'red', 0.12);
          if (Q > r.q) band(s, S, D, r.q, Q, 'red', 0.45);
          E.draw({ shade: [], guides: true });
          s.line(Q, 0, Q, Math.max(D(Q), S(Q)), { color: 'gold', width: 1.4, dash: [4, 3] });
          s.line(Q, S(Q), Q, D(Q), { color: D(Q) >= S(Q) ? 'green' : 'red', width: 3.2 });
          s.dot(Q, D(Q), { r: 4, color: 'blue' }); s.dot(Q, S(Q), { r: 4, color: 'orange' });
          tag(s, 'TS', lo * 0.55, 0.65 * D(lo * 0.55) + 0.35 * S(lo * 0.55), 'green', lo * 0.5, 20);
          if (Q < r.q) tag(s, 'untaken', (Q + 2 * r.q) / 3, (D((Q + 2 * r.q) / 3) + S((Q + 2 * r.q) / 3)) / 2 + 0, 'red', r.q - Q, 6, 11);
          if (Q > r.q) tag(s, 'destroyed', (2 * Q + r.q) / 3 + 3, (D((2 * Q + r.q) / 3) + S((2 * Q + r.q) / 3)) / 2, 'red', (Q - r.q) * 0.9, 8, 11);
          // TS(Q) by cumulative Simpson on a grid
          const N = 200, xs = [], ts = [0]; for (let i = 0; i <= N; i++) xs.push(i / 2);
          for (let i = 1; i <= N; i++) ts.push(ts[i - 1] + simpson((x) => D(x) - S(x), xs[i - 1], xs[i], 4));
          const T = (x) => simpson((u) => D(u) - S(u), 0, x, 200), ts0 = T(r.q), tq = T(Q);
          const ymin = Math.min(...ts), ymax = Math.max(...ts);
          g.setView(null, [Math.min(0, ymin) - 0.08 * (ymax - Math.min(0, ymin)), ymax * 1.15]);
          g.hline(0, { color: 'faint', width: 1 });
          g.path(xs.map((x, i) => [x, ts[i]]), { color: 'green', width: 2.6 });
          g.line(r.q, g.bounds.y[0], r.q, ts0, { color: 'muted', dash: [3, 3], width: 1 });
          g.dot(r.q, ts0, { r: 4.5, color: 'ink', hollow: true }); g.tex('Q^*', r.q, ts0, { dy: -8, baseline: 'bottom', size: 14 });
          const sl = D(Q) - S(Q), w = 10; g.line(Q - w, tq - sl * w, Q + w, tq + sl * w, { color: 'gold', width: 2.2 });
          g.dot(Q, tq, { r: 5.5, color: Q <= r.q ? 'green' : 'red' });
          st = { Q, r, tq, ts0, sl, D, S };
        });
        v.legend([['green', 'surplus realized'], ['red', 'surplus lost'], ['gold', 'marginal unit: $D(Q) - S(Q)$']]);
        v.readout(() => {
          if (!st) return 'The curves do not cross in view — drag a handle back.';
          const { Q, r, tq, ts0, sl, D, S } = st, f = (x) => v.fix(x, 1);
          return `$Q = ${f(Q)}$ (equilibrium $Q^* = ${f(r.q)}$) · marginal unit: worth $D = ${f(D(Q))}$, costs $S = ${f(S(Q))}$, net ${sgn(sl, 1)} · $TS(Q) = ${v.fix(tq, 0)}$ vs $TS(Q^*) = ${v.fix(ts0, 0)}$ → ${Math.abs(Q - r.q) < 0.3 ? '**maximal**' : `**${v.fix(ts0 - tq, 0)} lost** (${Q < r.q ? 'gains left untaken' : 'units that cost more than they are worth'})`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Concept',
      name: 'Deadweight loss',
      credit: 'Jules Dupuit, 1844',
      statement: String.raw`The **deadweight loss** of a policy or market distortion is the fall in total surplus (consumer surplus + producer surplus + any tax revenue or rents) compared with the efficient competitive outcome — surplus that no one receives. When a distortion cuts the quantity traded from $Q^*$ to $Q$ and the units still traded go to the highest-value buyers and lowest-cost sellers,
$$DWL = \int_{Q}^{Q^*} \bigl(D(q) - S(q)\bigr)\,dq,$$
the "Harberger triangle" between demand and supply over the units no longer traded. It depends only on how much trade is lost, not on whether a tax, a quota, a price ceiling or a price floor caused the loss; misallocating the remaining units (3.14, 3.15) adds further losses.`,
      idea: String.raw`By 3.8, $TS(Q) = \int_0^Q (D - S)$ when the traded units are allocated efficiently, and it peaks at $Q^*$. Taxes and quota rents only move surplus between buyers, sellers and the government or licence holders, so they cancel in the total; what remains is the surplus of the units that are no longer traded, each worth $D(q) - S(q) > 0$. Every policy that cuts trade to the same $Q$ therefore lands at the same point of one curve — the deadweight loss as a function of the quantity traded.`,
      caption: String.raw`Choose a distortion and strengthen it with its slider (drag the curve handles too). The red region is the deadweight loss; blue, orange and green are consumer surplus, producer surplus and the tax revenue or quota rents. Right: deadweight loss against the quantity traded — all four policies, at their current settings, sit on the same curve. Set the ceiling above or the floor below $P^*$, or the quota above $Q^*$, and it stops binding.`,
      deps: ['micro-3.8'],
      refs: ['Mankiw Ch. 8', 'Varian Ch. 16'],
      tags: ['welfare'],
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'P', weight: 1.2 });
        const g = v.stage({ x: [0, 100], y: [0, 1500], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'DWL', title: 'deadweight loss depends only on the quantity traded', weight: 1 });
        const pol = v.select('distortion', ['tax', 'quota', 'ceiling', 'floor'], 'tax');
        const tS = v.slider('tax per unit $t$', 0, 60, 26, { step: 0.5 });
        const qS = v.slider('quota $\\bar Q$', 0, 100, 25, { step: 0.5 });
        const cS = v.slider('price ceiling', 0, 100, 38, { step: 0.5 });
        const fS = v.slider('price floor', 0, 100, 74, { step: 0.5 });
        const E = v.curves(s, { demand: { linear: [[8, 92], [92, 12]] }, supply: { linear: [[8, 12], [92, 84]] } });
        const COL = { tax: 'green', quota: 'purple', ceiling: 'red', floor: 'pink' };
        // outcome of a policy: traded quantity q, buyers' price pb, sellers' price ps (transfer = (pb − ps) q)
        const outcome = (p, D, S, r) => {
          if (p === 'tax') { const t = tS.value; const q = t <= 0 ? r.q : (bisect((x) => D(x) - S(x) - t, 0, r.q) ?? 0); return { q, pb: D(q), ps: S(q), bind: t > 0 }; }
          if (p === 'quota') { const Qb = qS.value; if (Qb >= r.q) return { q: r.q, pb: r.p, ps: r.p, bind: false }; return { q: Qb, pb: D(Qb), ps: S(Qb), bind: true }; }
          if (p === 'ceiling') { const c = cS.value; if (c >= r.p) return { q: r.q, pb: r.p, ps: r.p, bind: false }; const q = qAt(S, c); return { q, pb: c, ps: c, bind: true, short: qAt(D, c) - q }; }
          const f = fS.value; if (f <= r.p) return { q: r.q, pb: r.p, ps: r.p, bind: false }; const q = qAt(D, f); return { q, pb: f, ps: f, bind: true, excess: qAt(S, f) - q };
        };
        const dwlAt = (D, S, r, q) => simpson((x) => D(x) - S(x), q, r.q);
        let st = null;
        v.render(() => {
          const p = pol.value, D = E.D, S = E.S, r = equilibrium(D, S);
          tS.el.hidden = p !== 'tax'; qS.el.hidden = p !== 'quota'; cS.el.hidden = p !== 'ceiling'; fS.el.hidden = p !== 'floor';
          if (!r) { E.draw({ shade: [] }); st = null; return; }
          const o = outcome(p, D, S, r), q = o.q;
          band(s, D, (x) => o.pb, 0, q, 'blue', 0.22);
          band(s, (x) => o.ps, S, 0, q, 'orange', 0.22);
          if (o.pb - o.ps > 1e-9) s.rect(0, o.ps, q, o.pb, { fill: 'green', fillAlpha: 0.24, stroke: false });
          if (r.q - q > 1e-9) band(s, D, S, q, r.q, 'red', 0.42);
          tag(s, 'CS', q * 0.35, o.pb + 0.6 * (D(q * 0.35) - o.pb), 'blue', q * 0.5, D(q * 0.35) - o.pb);
          tag(s, 'PS', q * 0.35, o.ps - 0.6 * (o.ps - S(q * 0.35)), 'orange', q * 0.5, o.ps - S(q * 0.35));
          if (o.pb - o.ps > 1e-9) tag(s, p === 'tax' ? 'revenue' : 'quota rents', q * 0.62, (o.pb + o.ps) / 2, 'green', q, o.pb - o.ps, 11.5);
          // policy marks
          if (p === 'tax' && tS.value > 0) s.fn((x) => S(x) + tS.value, { color: 'orange', width: 1.5, dash: [7, 4] });
          if (p === 'quota') { s.vline(qS.value, { color: 'purple', width: 1.8, dash: [8, 4] }); s.text('quota', qS.value, 97, { dx: 5, align: 'left', color: 'purple', size: 11.5 }); }
          if (p === 'ceiling') { s.hline(cS.value, { color: 'red', width: 1.8, dash: [8, 4] }); s.text('ceiling', 99, cS.value, { dy: -9, align: 'right', color: 'red', size: 11.5 }); }
          if (p === 'floor') { s.hline(fS.value, { color: 'pink', width: 1.8, dash: [8, 4] }); s.text('floor', 99, fS.value, { dy: -9, align: 'right', color: 'pink', size: 11.5 }); }
          if (o.short > 1e-6) { s.arrow(q, o.pb, q + o.short, o.pb, { color: 'red', both: true, head: 6, width: 1.5 }); s.text('shortage', q + o.short / 2, o.pb, { dy: 10, align: 'center', color: 'red', size: 11 }); }
          if (o.excess > 1e-6) { s.arrow(q, o.pb, q + o.excess, o.pb, { color: 'pink', both: true, head: 6, width: 1.5 }); s.text('unsold', q + o.excess / 2, o.pb, { dy: -10, align: 'center', color: 'pink', size: 11 }); }
          E.draw({ shade: [], guides: false });
          s.dot(r.q, r.p, { r: 4.5, color: 'ink', hollow: o.bind });
          if (o.bind) { s.dot(q, o.pb, { r: 4.5, color: 'blue' }); s.dot(q, o.ps, { r: 4.5, color: 'orange' }); }
          // DWL against quantity traded
          const W = (x) => Math.abs(dwlAt(D, S, r, x));
          const all = ['tax', 'quota', 'ceiling', 'floor'].map((k) => ({ k, o: outcome(k, D, S, r) }));
          const top = Math.max(150, 1.8 * Math.max(...all.map((a) => W(a.o.q))));
          g.setView(null, [0, top]);
          g.fn(W, { domain: [0, 100], color: 'red', width: 2.6 });
          g.line(r.q, 0, r.q, top, { color: 'muted', dash: [3, 3], width: 1 }); g.tex('Q^*', r.q, top, { dy: 6, dx: 4, align: 'left', baseline: 'top', size: 14 });
          for (const { k, o: oo } of all) if (k !== p) { g.dot(oo.q, W(oo.q), { r: 4.5, color: COL[k] }); g.text(k, oo.q, W(oo.q), { dx: 8, align: 'left', color: COL[k], size: 11 }); }
          g.dot(q, W(q), { r: 7, color: COL[p], label: p, labelPos: q < r.q * 0.35 ? 'ne' : 'nw' });
          st = { p, o, r, dwl: dwlAt(D, S, r, q), cs: simpson((x) => D(x) - o.pb, 0, q), ps: simpson((x) => o.ps - S(x), 0, q), tr: (o.pb - o.ps) * q, ts0: simpson((x) => D(x) - S(x), 0, r.q) };
        });
        v.legend([['blue', 'consumer surplus'], ['orange', 'producer surplus'], ['green', 'tax revenue / quota rents'], ['red', 'deadweight loss']]);
        v.readout(() => {
          if (!st) return 'The curves do not cross in view — drag a handle back.';
          const { p, o, r, dwl, cs, ps, tr, ts0 } = st, f = (x) => v.fix(x, 0);
          if (!o.bind) return `the ${p} does not bind: trade stays at $Q^* = ${v.fix(r.q, 1)}$ and the deadweight loss is $0$ · total surplus ${f(ts0)}`;
          return `binding ${p}: trade falls from $Q^* = ${v.fix(r.q, 1)}$ to $Q = ${v.fix(o.q, 1)}$ · **DWL $= \\int_Q^{Q^*}(D - S) = ${f(dwl)}$** · CS ${f(cs)} + PS ${f(ps)}${tr > 0.5 ? ` + ${p === 'tax' ? 'revenue' : 'rents'} ${f(tr)}` : ''} + DWL ${f(dwl)} = ${f(cs + ps + tr + dwl)} = free-market surplus ${f(ts0)} ✓${p === 'ceiling' ? ' (scarce units assumed to reach the highest-value buyers)' : p === 'floor' ? ' (sales assumed to go to the lowest-cost sellers)' : ''}`;
        });
      },
    },
  ],
};
