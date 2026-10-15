// Microeconomics — Chapter 5 (part b): demand curves and duality (items 5.9–5.15)
import { clamp, GUIDE, argmax, bisect, prefs, powU, demand, indirect, hicks, icurve, drawLevel, trimArrow, budget } from './ch05.shared.js';

const LBL = { size: 12, weight: 700 };

export default {
  collection: 'micro',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9', kind: 'Definition', name: 'Price offer curve and the demand curve',
      statement: String.raw`Hold income and the other price fixed and let $p_1$ vary. The best bundles $x(p_1, p_2, m)$ trace the **price offer curve** in the commodity plane. Plotting the quantity of good 1 against its own price, $p_1 \mapsto x_1(p_1, p_2, m)$, gives the consumer's **demand curve** for good 1, usually drawn with price on the vertical axis. A good is **ordinary** if its demand curve slopes down. The **own-price elasticity** $\varepsilon = \frac{\partial x_1}{\partial p_1}\frac{p_1}{x_1}$ measures how strongly; the response of $x_2$ to $p_1$ classifies the goods as gross substitutes ($\partial x_2/\partial p_1 > 0$) or gross complements ($< 0$).`,
      idea: String.raw`Changing $p_1$ pivots the budget line about its fixed intercept $m/p_2$ on the $x_2$ axis (4.1). Each position of the line has its own best bundle, and the price offer curve joins them. The demand curve is the same information redrawn: read $x_1$ off each best bundle and plot it against the price that produced it. The shape of the offer curve tells the cross effects. A horizontal offer curve (Cobb–Douglas) means $x_2$ ignores $p_1$; one that rises toward the pivot means the goods are complements; one that falls means they are substitutes. With perfect substitutes demand jumps between the two corners at the price where the budget line is parallel to the indifference lines.`,
      caption: String.raw`Slide the price of good 1. The budget line pivots about its intercept on the $x_2$ axis (faint lines at other prices) and the best bundle traces the green price offer curve. The panel below shares the $x_1$ axis and draws the demand curve point by point, with price on the vertical axis. Compare the cross effect on good 2 for **Cobb–Douglas** (none), **complements** (good 2 rises as good 1 gets cheaper), **CES** with $\sigma = 2$ (good 2 falls) and **perfect substitutes**, where demand jumps at $p_1 = 1.25$.`,
      deps: ['micro-5.6'], refs: ['Varian Ch. 6'], tags: ['demand'],
      see: ['micro-2.1', 'micro-3.1', 'micro-3.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Price-consumption_curve' },
      viz(v) {
        const p2 = 2, m = 16, PMIN = 0.9, PMAX = 4;
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.5 }) },
          comp: { label: 'perfect complements', F: prefs('comp', { a: 1, b: 2 }) },
          ces: { label: 'CES, $\\sigma = 2$', F: prefs('ces', { a: 0.5, r: 0.5 }) },
          subs: { label: 'perfect substitutes', F: prefs('subs', { a: 1, b: 1.6 }) },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const p1 = v.slider('price $p_1$', PMIN, PMAX, 2, { step: 0.01 });
        const s = v.stage({ x: [-0.5, 18.5], y: [-0.25, 9.4], height: 290, axes: 'box', full: true, xlabel: 'x₁', ylabel: 'x₂', title: 'the price offer curve ($p_2 = 2$, $m = 16$)' });
        const d = v.stage({ x: [-0.5, 18.5], y: [0, 4.4], height: 230, axes: 'box', full: true, xlabel: 'x₁', ylabel: 'price p₁', title: 'the demand curve for good 1' });
        v.legend([['accent', 'budget line'], ['purple', 'indifference curve'], ['green', 'price offer curve'], ['orange', 'demand curve']]);
        const cache = {};
        const path = (k) => cache[k] || (cache[k] = (() => { const F = FAM[k].F, out = []; for (let i = 0; i <= 200; i++) { const P = PMAX - ((PMAX - PMIN) * i) / 200; out.push([P, demand(F, P, p2, m)]); } return out; })());
        const brk = (pts) => pts.flatMap((q, i) => (i && Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 3 ? [null, q] : [q]));
        let st = {};
        v.render(() => {
          const k = fam.value, F = FAM[k].F, P = p1.value, pts = path(k), xs = demand(F, P, p2, m), subs = k === 'subs';
          for (const q of [1, 1.5, 2, 2.5, 3, 3.5, 4]) { s.clip(() => s.line(m / q, 0, 0, m / p2, { color: 'accent', width: 1, alpha: 0.22 })); const x = demand(F, q, p2, m); if (x[0] <= 18.4) s.dot(x[0], x[1], { r: 3, color: 'green', alpha: 0.55 }); }
          budget(s, P, p2, m);
          drawLevel(s, F, F.u(...xs), { color: 'purple', width: 2.2 });
          const done = pts.filter((q) => q[0] >= P).map((q) => q[1]), rest = pts.filter((q) => q[0] <= P).map((q) => q[1]);
          s.clip(() => { s.path(brk(rest), { color: 'green', width: 1.6, dash: [5, 4], alpha: 0.7 }); s.path(brk([...done, xs]), { color: 'green', width: 3.2 }); });
          s.line(-0.5, 0, 18.5, 0, { color: 'ink', width: 1 }); s.line(0, -0.25, 0, 9.4, { color: 'ink', width: 1 });
          const atPivot = xs[0] < 0.3;
          s.dot(0, m / p2, { r: 4.5, color: 'accent', label: atPivot ? null : 'pivot m/p₂', labelPos: 'e', labelColor: 'accent', math: false });
          if (xs[0] <= 18.4) { s.line(xs[0], 0, xs[0], xs[1], GUIDE); s.dot(xs[0], xs[1], { r: 6.5, color: 'green', label: atPivot ? 'x* at the pivot' : 'x*', labelPos: atPivot ? 'se' : xs[1] < 0.6 ? 'n' : 'ne', math: !atPivot }); }
          else s.text(`x* = (${v.fix(xs[0], 1)}, 0) →`, 18.3, 0.5, { color: 'green', ...LBL, align: 'right' });
          // the demand curve, with price on the vertical axis
          const dc = pts.map((q) => [q[1][0], q[0]]);
          d.clip(() => {
            d.path(brk(dc), { color: 'orange', width: 1.6, alpha: 0.45 });
            d.path(brk([...dc.filter((q) => q[1] >= P), [xs[0], P]]), { color: 'orange', width: 3.2 });
            if (subs) d.line(0, 1.25, m / 1.25, 1.25, { color: 'orange', width: 1.6, dash: [4, 4] });
          });
          for (const q of [1, 1.5, 2, 2.5, 3, 3.5, 4]) { const x = demand(F, q, p2, m)[0]; if (x <= 18.4) d.dot(x, q, { r: 3, color: 'orange', alpha: 0.6 }); }
          d.line(0, P, Math.min(xs[0], 18.5), P, GUIDE); if (xs[0] <= 18.4) { d.line(xs[0], P, xs[0], 4.4, GUIDE); d.dot(xs[0], P, { r: 6.5, color: 'orange' }); }
          d.text(`p₁ = ${v.fix(P, 2)}`, 0, P, { dx: 34, dy: -9, color: 'accent', ...LBL, align: 'left' });
          d.line(0, 0, 0, 4.4, { color: 'ink', width: 1 });
          if (subs) d.text('at p₁ = 1.25 any split is best', 6.4, 1.25, { dy: -10, color: 'orange', size: 11.5, weight: 600, align: 'center' });
          const h = 1e-4, xa = demand(F, P - h, p2, m), xb = demand(F, P + h, p2, m);
          st = { k, P, xs, d1: (xb[0] - xa[0]) / (2 * h), d2: (xb[1] - xa[1]) / (2 * h) };
        });
        v.readout(() => {
          const { k, P, xs, d1, d2 } = st, f = (q) => v.fix(q, 2);
          if (k === 'subs') return `Perfect substitutes $u = x_1 + 1.6\\,x_2$: good 1 is bought only when its utility per dollar $1/p_1$ beats $1.6/p_2 = 0.8$, i.e. when $p_1 < 1.25$; then all income goes to it, $x_1 = m/p_1 = ${f(16 / Math.min(P, 1.25))}$. At $p_1 = ${f(P)}$ the best bundle is $(${f(xs[0])}, ${f(xs[1])})$: the demand curve has a jump, and the offer curve leaps from one axis to the other.`;
          const eps = (d1 * P) / xs[0], cross = Math.abs(d2) < 1e-6 ? 'does not respond to $p_1$' : d2 > 0 ? `rises with $p_1$ ($\\partial x_2/\\partial p_1 = ${f(d2)}$): **gross substitutes**` : `falls as $p_1$ rises ($\\partial x_2/\\partial p_1 = ${f(d2)}$): **gross complements**`;
          return `At $p_1 = ${f(P)}$ the best bundle is $(${f(xs[0])}, ${f(xs[1])})$. Own-price elasticity $\\varepsilon = ${f(eps)}$ (${Math.abs(eps) > 1.0001 ? 'elastic' : Math.abs(eps) < 0.9999 ? 'inelastic' : 'unit elastic: spending on good 1 is constant'}), and good 2 ${cross}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10', kind: 'Definition', name: 'Expenditure minimization and Hicksian demand',
      statement: String.raw`The **expenditure minimization problem** asks for the cheapest way to reach a target utility $\bar u$ at prices $p$:
$$\min\ p_1x_1 + p_2x_2 \quad\text{subject to}\quad u(x_1, x_2) \ge \bar u,\quad x \ge 0.$$
Its solution $h(p, \bar u) = (h_1, h_2)$ is the **Hicksian** (compensated) demand, and the minimum cost is the expenditure function $e(p, \bar u)$ (5.12). At an interior solution the cheapest budget line is tangent to the target indifference curve, $\mathrm{MRS} = p_1/p_2$. Hicksian demand moves only *along* one indifference curve, so its own-price effect is a pure substitution effect: $\partial h_1/\partial p_1 \le 0$ always. The change in Marshallian demand after a price change splits into this substitution effect plus an income effect (the Slutsky decomposition).`,
      idea: String.raw`Budget lines of cost $e$ at prices $p$ are parallel, and lowering $e$ slides the line toward the origin. The smallest $e$ at which the line still meets the set $\{u \ge \bar u\}$ is the minimum, and for smooth convex preferences the line then touches the curve at one point, with the same tangency condition as utility maximization (5.2). When $p_1$ rises the cheapest line on a *fixed* curve gets steeper, so the touching point slides along the curve toward less good 1, which is why compensated demand never slopes up. Ordinary demand, by contrast, also loses purchasing power when $p_1$ rises: go from the old bundle $A$ to the compensated bundle $B$ on the old curve (substitution effect), then shift the line in parallel to the actual budget, landing at $C$ (income effect).`,
      caption: String.raw`**Minimize expenditure**: fix a target indifference curve and move the expenditure slider. A line that misses the curve cannot reach the target; a line that cuts it is too expensive, since the gold arc reaches the target for less. The button pushes the line to the minimum, where it just touches at the Hicksian bundle $h$. The right panel is Hicksian demand $h_1(p_1, \bar u)$ against the price. **Hicks vs Marshall**: the price of good 1 changes from 1 to the slider value. The orange arrow from $A$ to $B$ is the substitution effect along the old indifference curve, the teal arrow from $B$ to $C$ is the income effect, and the bars below add them up. Try perfect complements, which have no substitution effect, and quasilinear tastes, which have no income effect.`,
      deps: ['micro-5.2'], refs: ['Varian Ch. 8'], tags: ['duality', 'demand'],
      see: ['micro-6.1', 'micro-6.2'],
      credit: 'John Hicks, 1939',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hicksian_demand_function' },
      viz(v) {
        const p2 = 1, P0 = 1;
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.5 }) },
          ces: { label: 'CES, $\\sigma = 2$', F: prefs('ces', { a: 0.5, r: 0.5 }) },
          comp: { label: 'perfect complements', F: prefs('comp', { a: 1, b: 1 }) },
          ql: { label: 'quasilinear', F: prefs('ql', { a: 3 }) },
        };
        const mode = v.select('show', [{ value: 'emp', label: 'minimize expenditure' }, { value: 'slu', label: 'Hicks vs Marshall' }], 'emp');
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const lvl = v.slider('target: the curve through $(t, t)$', 1.5, 7, 4, { step: 0.05 });
        const p1 = v.slider('price $p_1$', 0.5, 3, 1.6, { step: 0.01 });
        const e = v.slider('expenditure $e$', 2, 26, 15, { step: 0.05 });
        const m = v.slider('income $m$', 4, 14, 10, { step: 0.1 });
        let eStar = 8;
        const btn = v.button('push the line to the minimum', () => e.set(eStar));
        const s = v.stage({ x: [0, 14], y: [0, 14], height: 360, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.15 });
        const g = v.stage({ x: [0, 14], y: [0, 3.2], height: 360, axes: 'box', xlabel: 'x₁', ylabel: 'price p₁', title: 'demand curves' });
        const b = v.stage({ x: [-6, 6], y: [0, 3], height: 130, axes: false, full: true, title: 'change in $x_1$' });
        const cache = {};
        const hcurve = (k, L) => { const key = `${k}|${L}`; if (!cache[key]) { const F = FAM[k].F, out = []; for (let i = 0; i <= 50; i++) { const P = 0.45 + (2.75 * i) / 50, H = hicks(F, P, p2, L); if (H) out.push([H.x[0], P]); } cache[key] = out; } return cache[key]; };
        let st = {};
        v.render(() => {
          const emp = mode.value === 'emp', k = fam.value, F = FAM[k].F, P = p1.value;
          lvl.el.hidden = !emp; e.el.hidden = !emp; btn.hidden = !emp; m.el.hidden = emp;
          v.legend(emp ? [['accent', 'budget line of cost e'], ['purple', 'target indifference curve'], ['gold', 'reaches the target for less than e'], ['green', 'Hicksian bundle h', { dot: true }]] : [['muted', 'old budget line', { dash: true }], ['accent', 'new budget line'], ['orange', 'substitution effect'], ['teal', 'income effect']]);
          if (emp) {
            const L = F.u(lvl.value, lvl.value), H = hicks(F, P, p2, L), E = e.value; eStar = H.e;
            g.setTitle('Hicksian demand $h_1(p_1, \\bar u)$');
            s.clip(() => s.poly([[0, 0], [E / P, 0], [0, E / p2]], { fill: 'accent', fillAlpha: 0.09, stroke: false }));
            drawLevel(s, F, L, { color: 'purple', width: 2.8 });
            const tol = 0.004 * H.e, touch = Math.abs(E - H.e) < tol;
            if (E > H.e + tol) { // the part of the target curve that costs less than e
              const arc = icurve(F, L, 14, 14, 300).map((q) => (q && P * q[0] + p2 * q[1] < E ? q : null));
              s.clip(() => s.path(arc, { color: 'gold', width: 6, alpha: 0.75 }));
            }
            s.clip(() => s.line(H.e / P, 0, 0, H.e / p2, { color: 'green', width: 1.4, dash: [5, 4] }));
            s.clip(() => s.line(E / P, 0, 0, E / p2, { color: touch ? 'green' : 'accent', width: 3 }));
            s.dot(H.x[0], H.x[1], { r: 6.5, color: 'green', label: 'h', labelPos: 'ne' });
            const msg = touch ? 'the line just touches: minimum cost' : E < H.e ? 'too little: the target is out of reach' : 'too much: the gold bundles reach the target for less';
            s.corner(msg, 'tr', { color: touch ? 'green' : E < H.e ? 'red' : 'gold', weight: 700 });
            const hc = hcurve(k, L);
            g.setView([0, 14], [0, 3.2]);
            g.clip(() => g.path(hc, { color: 'orange', width: 2.8 }));
            g.line(0, P, H.x[0], P, GUIDE); g.line(H.x[0], 0, H.x[0], P, GUIDE); g.dot(H.x[0], P, { r: 6.5, color: 'green', label: 'h₁', labelPos: 'ne', math: false });
            // expenditure bars
            b.setView([0, 1.12 * Math.max(E, H.e)], [0, 3]); const W = b.bounds.x[1];
            b.rect(0, 1.75, E, 2.55, { fill: touch ? 'green' : 'accent', fillAlpha: 0.6, stroke: false, radius: 4 }); b.text(`spending e = ${v.fix(E, 2)}`, 0.01 * W, 2.15, { dx: 6, color: 'ink', ...LBL, align: 'left' });
            b.rect(0, 0.55, H.e, 1.35, { fill: 'green', fillAlpha: 0.6, stroke: false, radius: 4 }); b.text(`minimum e(p, ū) = ${v.fix(H.e, 2)}`, 0.01 * W, 0.95, { dx: 6, color: 'ink', ...LBL, align: 'left' });
            b.setTitle('expenditure: chosen and minimal');
            st = { emp, k, P, L, H, E, touch };
          } else {
            const M = m.value, A = demand(F, P0, p2, M), uA = F.u(...A), C = demand(F, P, p2, M), Hb = hicks(F, P, p2, uA), B = Hb.x;
            g.setTitle('Marshallian $x_1(p_1, m)$ and Hicksian $h_1(p_1, u_A)$');
            s.clip(() => s.line(M / P0, 0, 0, M / p2, { color: 'muted', width: 1.8, dash: [7, 5] }));
            s.clip(() => s.line(Hb.e / P, 0, 0, Hb.e / p2, { color: 'orange', width: 1.5, dash: [5, 4] }));
            budget(s, P, p2, M);
            drawLevel(s, F, uA, { color: 'purple', width: 2.4 }); drawLevel(s, F, F.u(...C), { color: 'purple', width: 1.4, alpha: 0.6 });
            trimArrow(s, A, B, { color: 'orange', width: 3, head: 10 });
            trimArrow(s, B, C, { color: 'teal', width: 3, head: 10 });
            s.dot(A[0], A[1], { r: 6, color: 'muted', label: 'A', labelPos: 'ne', labelColor: 'ink' });
            s.dot(B[0], B[1], { r: 6, color: 'orange', label: 'B', labelPos: P > P0 ? 'nw' : 'se' });
            s.dot(C[0], C[1], { r: 6.5, color: 'green', label: 'C', labelPos: 'sw' });
            // demand curves through A
            const mc = []; for (let i = 0; i <= 80; i++) { const q = 0.45 + (2.75 * i) / 80; mc.push([demand(F, q, p2, M)[0], q]); }
            g.setView([0, 14], [0, 3.2]);
            g.clip(() => { g.path(mc, { color: 'accent', width: 2.6 }); g.path(hcurve(k, uA), { color: 'orange', width: 2.6 }); });
            g.hline(P0, { color: 'muted', width: 1, dash: [3, 3] }); g.hline(P, { color: 'muted', width: 1, dash: [3, 3] });
            g.dot(A[0], P0, { r: 6, color: 'muted', label: 'A', labelPos: 'ne', labelColor: 'ink' }); g.dot(B[0], P, { r: 6, color: 'orange', label: 'B', labelPos: 'nw' }); g.dot(C[0], P, { r: 6.5, color: 'green', label: 'C', labelPos: 'se' });
            if (mc[0][0] < 13) g.text('Marshallian', mc[0][0], mc[0][1], { dx: 6, dy: 4, color: 'accent', ...LBL, align: 'left' });
            const hc = hcurve(k, uA); if (hc.length && hc[0][0] < 13) g.text('Hicksian', hc[0][0], hc[0][1], { dx: 6, dy: hc[0][0] > mc[0][0] - 2.5 && hc[0][0] < mc[0][0] + 2.5 ? -14 : 4, color: 'orange', ...LBL, align: 'left' });
            // decomposition bars
            const sub = B[0] - A[0], inc = C[0] - B[0], tot = C[0] - A[0], W = Math.max(1, Math.abs(sub), Math.abs(inc), Math.abs(tot)) * 1.25;
            b.setView([-W, W], [0, 3]); b.setTitle('change in $x_1$: substitution + income = total');
            b.line(0, 0.15, 0, 2.95, { color: 'ink', width: 1.2 });
            [[2.45, sub, 'orange', 'substitution'], [1.5, inc, 'teal', 'income'], [0.55, tot, 'green', 'total']].forEach(([y, val, col, nm]) => {
              b.rect(0, y - 0.32, val, y + 0.32, { fill: col, fillAlpha: 0.7, stroke: false, radius: 3 });
              b.text(`${nm} ${val >= 0 ? '+' : '−'}${v.fix(Math.abs(val), 2)}`, val >= 0 ? -0.02 * W : 0.02 * W, y, { color: col, ...LBL, align: val >= 0 ? 'right' : 'left' });
            });
            st = { emp, k, P, M, A, B, C, sub, inc, tot };
          }
        });
        v.readout(() => {
          const S = st, f = (q) => v.fix(q, 2);
          if (S.emp) {
            const where = S.touch ? `The line of cost ${f(S.E)} **just touches** the target: no cheaper bundle reaches $\\bar u$.` : S.E < S.H.e ? `A spending of ${f(S.E)} cannot reach the target: every bundle on the line is below the curve.` : `A spending of ${f(S.E)} is more than needed: the gold arc of the target curve costs less.`;
            return `${where} The cheapest bundle reaching $\\bar u = ${f(S.L)}$ at $p_1 = ${f(S.P)}$ is $h = (${f(S.H.x[0])}, ${f(S.H.x[1])})$, at cost $e(p, \\bar u) = ${f(S.H.e)}$. Raise $p_1$: the touching point slides along the same curve toward less good 1, so $h_1$ never rises with its own price.`;
          }
          const note = { cd: '', ces: '', comp: ' With perfect complements the old curve has a corner and $B = A$: there is no substitution effect, only an income effect.', ql: ' With quasilinear tastes extra income goes entirely to good 2, so $C$ is directly above or below $B$: no income effect on good 1, and Marshallian and Hicksian demand coincide.' }[S.k];
          return `Price of good 1 from 1 to ${f(S.P)} with income ${f(S.M)}: $A = (${f(S.A[0])}, ${f(S.A[1])})$, compensated $B = h(p', u_A) = (${f(S.B[0])}, ${f(S.B[1])})$, new $C = (${f(S.C[0])}, ${f(S.C[1])})$. Substitution effect ${f(S.sub)} + income effect ${f(S.inc)} = total ${f(S.tot)}.${note}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11', kind: 'Proposition', name: 'Duality: maximizing utility vs minimizing expenditure',
      statement: String.raw`Let $u$ be continuous and represent locally non-satiated preferences, and let $p \gg 0$. Then the two problems solve each other:
(a) if $x^*$ maximizes utility at income $m > 0$, then $x^*$ minimizes expenditure for the target $\bar u = u(x^*)$, and the minimum cost is $m$; so $h(p, v(p, m)) = x(p, m)$ and $e(p, v(p, m)) = m$;
(b) if $x^*$ minimizes expenditure for a target $\bar u$ above $u(0)$, then $x^*$ maximizes utility at income $m = p \cdot x^*$; so $x(p, e(p, \bar u)) = h(p, \bar u)$ and $v(p, e(p, \bar u)) = \bar u$.
Without local non-satiation this fails: a satiated consumer may leave money unspent, and then $e(p, v(p, m)) < m$.`,
      idea: String.raw`(a) If some cheaper bundle $y$ had $u(y) \ge u(x^*)$, then $p \cdot y < m$, and by local non-satiation a bundle near $y$ would be better still and remain affordable, contradicting the optimality of $x^*$; and non-satiation also makes $x^*$ spend all of $m$. (b) If some $y$ with $p \cdot y \le p \cdot x^*$ were strictly better than $x^*$, then by continuity a slightly scaled-down $ty$ ($t < 1$) would still beat $\bar u$ yet cost strictly less, contradicting cost minimality. Geometrically both problems are solved by the same tangency between a budget line and an indifference curve (5.2, 5.10), approached from opposite sides. A bliss point inside the budget set breaks the first argument: the best affordable bundle is the bliss point itself, which costs less than $m$.`,
      caption: String.raw`Left: maximize utility on the budget of income $m$. Right: minimize the cost of reaching the target $\bar u$. With the target **linked** to the maximized utility $v(p, m)$, both panels land on the same bundle and the strip below closes the loop $m \to v(p, m) \to e(p, v(p, m)) = m$. Unlink it and move the target: the bundles part and the loop does not close until **set $m = e(p, \bar u)$** is pressed, which runs duality the other way. Switch to **satiation**: when the bliss point is affordable, maximized utility is reached for less than $m$, and the loop breaks.`,
      deps: ['micro-5.10', 'micro-5.6'], refs: ['Varian Ch. 8'], tags: ['duality'],
      see: ['opt-5.2', 'opt-5.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Duality_(optimization)' },
      viz(v) {
        const p2 = 1;
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.4 }) },
          ces: { label: 'CES, $\\sigma = \\tfrac12$', F: prefs('ces', { a: 0.5, r: -1 }) },
          sat: { label: 'satiation (bliss point)', F: prefs('sat', { bx: 4, by: 4.5 }) },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const p1 = v.slider('price $p_1$', 0.5, 3, 1.2, { step: 0.01 });
        const m = v.slider('income $m$', 2, 16, 10, { step: 0.05 });
        const link = v.toggle('link the target to the maximized utility', true);
        const tl = v.slider('target $\\bar u$ (unlinked)', 1, 8, 3, { step: 0.02 });
        let eLast = 10;
        const set = v.button('set $m = e(p, \\bar u)$', () => m.set(clamp(eLast, 2, 16)));
        const s = v.stage({ x: [0, 11], y: [0, 11], height: 320, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', title: 'maximize $u$ subject to $p\\cdot x \\le m$' });
        const r = v.stage({ x: [0, 11], y: [0, 11], height: 320, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', title: 'minimize $p\\cdot x$ subject to $u \\ge \\bar u$' });
        const L = v.stage({ x: [0, 10], y: [0, 2.2], height: 150, axes: false, full: true, title: 'the duality loop' });
        v.legend([['accent', 'budget line'], ['purple', 'indifference curve'], ['green', 'utility-maximizing bundle x(p, m)', { dot: true }], ['gold', 'expenditure-minimizing bundle h(p, ū)', { dot: true }]]);
        const sat = (k) => k === 'sat';
        const ump = (k, F, P, M) => {
          if (!sat(k)) { const x = demand(F, P, p2, M); return { x, u: F.u(...x) }; }
          const [bx, by] = F.bliss; if (P * bx + p2 * by <= M) return { x: [bx, by], u: 0 };
          const c = (P * bx + p2 * by - M) / (P * P + p2 * p2), x = [bx - c * P, by - c * p2]; return { x, u: F.u(...x) };
        };
        const emp = (k, F, P, U) => {
          if (!sat(k)) return hicks(F, P, p2, U);
          const [bx, by] = F.bliss, rad = Math.sqrt(Math.max(-U, 0)), n = Math.hypot(P, p2), x = [bx - (rad * P) / n, by - (rad * p2) / n];
          return { x, e: P * x[0] + p2 * x[1] };
        };
        const target = (k, F, t) => (sat(k) ? -(((8 - t) / 2) ** 2) : F.u(t, t));
        let st = {};
        v.render(() => {
          const k = fam.value, F = FAM[k].F, P = p1.value, M = m.value;
          tl.el.hidden = link.value; set.hidden = link.value;
          const A = ump(k, F, P, M), U = link.value ? A.u : target(k, F, tl.value), H = emp(k, F, P, U); eLast = H.e;
          const lev = sat(k) ? [-1, -4, -9, -16] : [1.5, 3, 4.5, 6, 7.5].map((t) => F.u(t, t));
          for (const S of [s, r]) { for (const q of lev) drawLevel(S, F, q, { color: v.color('purple', 0.2), width: 1 }); if (F.bliss) S.dot(...F.bliss, { r: 4.5, color: 'ink', label: 'bliss', labelPos: 'n', math: false }); }
          // utility maximization
          budget(s, P, p2, M);
          if (!(sat(k) && A.u === 0)) drawLevel(s, F, A.u, { color: 'purple', width: 2.4 });
          s.dot(A.x[0], A.x[1], { r: 6.5, color: 'green', label: 'x(p, m)', labelPos: 'ne', math: false });
          s.corner(`v(p, m) = ${v.fix(A.u, 3)}`, 'tr', { color: 'purple', weight: 700 });
          // expenditure minimization
          if (!(sat(k) && U >= 0)) drawLevel(r, F, U, { color: 'purple', width: 2.4 });
          budget(r, P, p2, H.e, { fillAlpha: 0.06 });
          if (!link.value || Math.hypot(A.x[0] - H.x[0], A.x[1] - H.x[1]) > 1e-6) r.dot(A.x[0], A.x[1], { r: 5, hollow: true, color: 'green', width: 2 });
          r.dot(H.x[0], H.x[1], { r: 6.5, color: 'gold', label: 'h(p, ū)', labelPos: 'ne', math: false });
          r.corner(`e(p, ū) = ${v.fix(H.e, 3)}`, 'tr', { color: 'accent', weight: 700 });
          // the loop
          const ok = Math.abs(H.e - M) < 1e-4 * M, same = Math.hypot(A.x[0] - H.x[0], A.x[1] - H.x[1]) < 1e-3;
          const box = (x0, x1, top, bot, col) => L.rect(x0, bot, x1, top, { fill: col, fillAlpha: 0.12, color: col, width: 1.6, radius: 8 });
          box(0.2, 2.6, 1.95, 1.05, 'accent'); box(3.8, 6.2, 1.95, 1.05, 'purple'); box(7.4, 9.8, 1.95, 1.05, ok ? 'green' : 'red');
          L.text('income', 1.4, 1.72, { align: 'center', color: 'muted', size: 11.5 }); L.text(`m = ${v.fix(M, 3)}`, 1.4, 1.36, { align: 'center', color: 'accent', ...LBL, size: 13 });
          L.text(link.value ? 'maximized utility' : 'target utility', 5, 1.72, { align: 'center', color: 'muted', size: 11.5 }); L.text(`${link.value ? 'v(p, m)' : 'ū'} = ${v.fix(U, 3)}`, 5, 1.36, { align: 'center', color: 'purple', ...LBL, size: 13 });
          L.text('least cost of reaching it', 8.6, 1.72, { align: 'center', color: 'muted', size: 11.5 }); L.text(`e = ${v.fix(H.e, 3)}`, 8.6, 1.36, { align: 'center', color: ok ? 'green' : 'red', ...LBL, size: 13 });
          L.arrow(2.65, 1.5, 3.75, 1.5, { color: link.value ? 'ink' : 'faint', width: 2, head: 9 }); L.text(link.value ? 'max u' : 'unlinked', 3.2, 1.5, { dy: -10, align: 'center', size: 11, color: 'muted' });
          L.arrow(6.25, 1.5, 7.35, 1.5, { color: 'ink', width: 2, head: 9 }); L.text('min p·x', 6.8, 1.5, { dy: -10, align: 'center', size: 11, color: 'muted' });
          L.path([[8.6, 1.0], [8.6, 0.55], [1.4, 0.55], [1.4, 0.98]], { color: ok ? 'green' : 'red', width: 2, dash: ok ? null : [6, 4] }); L.arrow(1.4, 0.7, 1.4, 1.0, { color: ok ? 'green' : 'red', width: 2, head: 9 });
          L.text(ok ? `e(p, v(p, m)) = m ✓   and   h = x = (${v.fix(H.x[0], 2)}, ${v.fix(H.x[1], 2)}) ✓` : `e = ${v.fix(H.e, 3)} ≠ m = ${v.fix(M, 3)}   ${same ? 'same bundle' : 'different bundles'}`, 5, 0.55, { dy: 14, align: 'center', color: ok ? 'green' : 'red', ...LBL });
          st = { k, P, M, A, U, H, ok, same, linked: link.value };
        });
        v.readout(() => {
          const { k, M, A, U, H, ok, linked } = st, f = (q) => v.fix(q, 3);
          if (sat(k) && A.u === 0 && linked) return `The bliss point $(4, 4.5)$ costs $${f(p1.value * 4 + 4.5)} < m = ${f(M)}$, so the best affordable bundle is the bliss point and ${f(M - p1.value * 4 - 4.5)} of income is left unspent. The cheapest way to reach the same utility costs only $e(p, v(p, m)) = ${f(H.e)} < m$: without local non-satiation the loop does not close.`;
          if (ok) return `Maximizing utility with income ${f(M)} gives $x(p, m) = (${v.fix(A.x[0], 2)}, ${v.fix(A.x[1], 2)})$ and $v(p, m) = ${f(A.u)}$. Minimizing the cost of reaching ${linked ? 'that utility' : `$\\bar u = ${f(U)}$`} gives the same bundle, at cost exactly $m$: the two problems are solved by one tangency.`;
          return `The target $\\bar u = ${f(U)}$ differs from $v(p, m) = ${f(A.u)}$, so the cheapest way to reach it, $h = (${v.fix(H.x[0], 2)}, ${v.fix(H.x[1], 2)})$ at cost $e = ${f(H.e)}$, is not the utility-maximizing bundle at income ${f(M)}. Press **set $m = e(p, \\bar u)$**: then $x(p, e(p, \\bar u)) = h(p, \\bar u)$ and $v(p, e(p, \\bar u)) = \\bar u$, part (b) of the proposition.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12', kind: 'Definition', name: 'Indirect utility and expenditure functions',
      statement: String.raw`The **indirect utility function** $v(p, m) = \max\{u(x) : p \cdot x \le m\}$ is the highest utility affordable at prices $p$ and income $m$. The **expenditure function** $e(p, \bar u) = \min\{p \cdot x : u(x) \ge \bar u\}$ is the least money needed to reach utility $\bar u$. For continuous, locally non-satiated preferences:
(a) $v$ is homogeneous of degree 0 in $(p, m)$, non-increasing in $p$, strictly increasing in $m$, and quasi-convex in $p$;
(b) $e$ is homogeneous of degree 1 in $p$, non-decreasing in $p$, strictly increasing in $\bar u$, and **concave** in $p$;
(c) they are inverse to each other in the money and utility arguments: $e(p, v(p, m)) = m$ and $v(p, e(p, \bar u)) = \bar u$ (5.11).
Where $e$ is differentiable, $\partial e/\partial p_i = h_i(p, \bar u)$ (**Shephard's lemma**).`,
      idea: String.raw`Homogeneity is inherited from the budget set (5.6). Concavity of $e$ in $p$ has a one-line proof with a picture. Let $h$ be the cheapest bundle at prices $p$. At any other prices $p'$, buying the same $h$ costs $p' \cdot h$, a linear function of $p'$, and the cheapest bundle can only do better: $e(p', \bar u) \le p' \cdot h$, with equality at $p' = p$. So $e$ lies below each of these lines and touches it, which makes it concave. Where the touching line is a tangent, its slope is $h_i$, which is Shephard's lemma, the expenditure-side twin of Roy's identity (5.13). The gap between $e$ and the line is the saving from substitution. With perfect complements there is no substitution, and $e$ *is* the line.`,
      caption: String.raw`Move the prices, the income and the target. On the map, the highest indifference curve reached by the budget gives $v(p, m)$ (green bundle), and the cheapest dashed line touching the target curve gives $e(p, \bar u)$ (gold bundle). The upper right panel is the graph of $v(p, \cdot)$ against income; read from the other axis it is the graph of $e(p, \cdot)$, so the two functions undo each other. The bottom panel is $e$ against $p_1$ for the fixed target: a concave curve lying below the gold line of the "don't re-optimize" cost $p_1h_1 + p_2h_2$, which it touches with slope $h_1$.`,
      deps: ['micro-5.6', 'micro-5.10', 'micro-5.11'], refs: ['Varian Ch. 8', 'Varian Ch. 14'], tags: ['duality', 'demand'],
      see: ['opt-3.1'],
      credit: 'Ronald Shephard, 1953',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Expenditure_function' },
      viz(v) {
        const p2 = 1;
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: powU(prefs('cd', { a: 0.5 }), 0.7), tex: 'u = (x_1x_2)^{0.35}' },
          ces: { label: 'CES, $\\sigma = \\tfrac12$', F: powU(prefs('ces', { a: 0.5, r: -1 }), 0.7), tex: 'u = \\left(\\tfrac{2x_1x_2}{x_1 + x_2}\\right)^{0.7}' },
          comp: { label: 'perfect complements', F: powU(prefs('comp', { a: 1, b: 1 }), 0.7), tex: 'u = \\min(x_1, x_2)^{0.7}' },
          subs: { label: 'perfect substitutes', F: powU(prefs('subs', { a: 1, b: 1.25 }), 0.7), tex: 'u = (x_1 + 1.25\\,x_2)^{0.7}' },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const p1 = v.slider('price $p_1$', 0.4, 3, 1.4, { step: 0.01 });
        const m = v.slider('income $m$', 2, 16, 9, { step: 0.05 });
        const ub = v.slider('target $\\bar u$', 1, 4.5, 2.5, { step: 0.01 });
        const s = v.stage({ x: [0, 12], y: [0, 12], height: 330, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.05 });
        const iv = v.stage({ x: [0, 20], y: [0, 5], height: 330, axes: 'box', xlabel: 'money', ylabel: 'utility', title: 'graph of $v(p, \\cdot)$, read backwards: $e(p, \\cdot)$' });
        const ep = v.stage({ x: [0.3, 3.1], y: [0, 1], height: 200, axes: 'box', full: true, xlabel: 'price p₁', ylabel: 'money', title: 'the expenditure function $e(p_1, \\bar u)$ is concave in the price' });
        v.legend([['purple', 'curve u = v(p, m)'], ['teal', 'target curve ū'], ['accent', 'budget line / cheapest line', {}], ['gold', 'cost of keeping the bundle h']]);
        const cache = {};
        const ecurve = (k, U) => { const key = `${k}|${U}`; if (!cache[key]) { const F = FAM[k].F, out = []; for (let i = 0; i <= 70; i++) { const P = 0.3 + (2.8 * i) / 70, H = hicks(F, P, p2, U); out.push([P, H ? H.e : NaN]); } cache[key] = out; } return cache[key]; };
        let st = {};
        v.render(() => {
          const k = fam.value, o = FAM[k], F = o.F, P = p1.value, M = m.value, U = ub.value;
          s.setTitle(`$${o.tex}$`);
          const x = demand(F, P, p2, M), V = F.u(...x), H = hicks(F, P, p2, U);
          budget(s, P, p2, M);
          drawLevel(s, F, V, { color: 'purple', width: 2.4 });
          drawLevel(s, F, U, { color: 'teal', width: 2.4 });
          s.clip(() => s.line(H.e / P, 0, 0, H.e / p2, { color: 'accent', width: 1.8, dash: [6, 4] }));
          s.dot(x[0], x[1], { r: 6.5, color: 'green', label: 'v', labelPos: 'ne', math: false });
          s.dot(H.x[0], H.x[1], { r: 6, color: 'gold', label: 'e', labelPos: 'sw', math: false });
          // v(p, ·) and its inverse
          const top = Math.max(5, F.u(...demand(F, P, p2, 20)) * 1.05);
          iv.setView([0, 20], [0, top]);
          iv.fn((q) => F.u(...demand(F, P, p2, q)), { domain: [0.01, 20], color: 'purple', width: 2.6, n: 160 });
          iv.line(M, 0, M, V, { color: 'green', width: 1.4, dash: [4, 3] }); iv.arrow(M, V, 0.15, V, { color: 'green', width: 1.6, head: 8 });
          iv.dot(M, V, { r: 6, color: 'green' }); iv.text(`v(p, m) = ${v.fix(V, 2)}`, 0.3, V, { dy: V > 0.85 * top ? 12 : -10, color: 'green', ...LBL, align: 'left' });
          if (H.e <= 20) { iv.line(0, U, H.e, U, { color: 'gold', width: 1.4, dash: [4, 3] }); iv.arrow(H.e, U, H.e, 0.05 * top, { color: 'gold', width: 1.6, head: 8 }); iv.dot(H.e, U, { r: 6, color: 'gold' }); iv.text(`e(p, ū) = ${v.fix(H.e, 2)}`, H.e, 0.05 * top, { dx: 6, dy: -12, color: 'gold', ...LBL, align: 'left' }); }
          // e against p1, with the line of the fixed bundle
          const ec = ecurve(k, U), emax = Math.max(...ec.map((q) => q[1]).filter(isFinite));
          ep.setView([0.3, 3.1], [0, emax * 1.15]);
          ep.clip(() => ep.line(0.3, 0.3 * H.x[0] + p2 * H.x[1], 3.1, 3.1 * H.x[0] + p2 * H.x[1], { color: 'gold', width: 2, dash: [6, 4] }));
          ep.path(ec, { color: 'accent', width: 2.8 });
          ep.dot(P, H.e, { r: 6, color: 'gold' });
          ep.text(`slope h₁ = ${v.fix(H.x[0], 2)}`, P, H.e, { dx: 10, dy: 16, color: 'gold', ...LBL, align: 'left' });
          // checks
          const eV = hicks(F, P, p2, V).e, vE = F.u(...demand(F, P, p2, H.e));
          const d = 1e-3, slope = (hicks(F, P + d, p2, U).e - hicks(F, P - d, p2, U).e) / (2 * d);
          st = { k, P, M, U, V, H, eV, vE, slope };
        });
        v.readout(() => {
          const { k, M, U, V, H, eV, vE, slope } = st, f = (q) => v.fix(q, 3);
          const extra = k === 'comp' ? ' With perfect complements there is nothing to substitute, so $e$ is linear in $p_1$ and coincides with the gold line.' : k === 'subs' ? ' With perfect substitutes $e = \\bar u^{1/0.7}\\min(p_1, p_2/1.25)$ has a kink where the consumer switches goods; it is still concave.' : '';
          return `$v(p, m) = ${f(V)}$ and $e(p, v(p, m)) = ${f(eV)}$ (income was ${f(M)}); $e(p, \\bar u) = ${f(H.e)}$ and $v(p, e(p, \\bar u)) = ${f(vE)}$ (target ${f(U)}): each function undoes the other. Shephard's lemma: $\\partial e/\\partial p_1 = ${f(slope)}$ by a finite difference, and $h_1 = ${f(H.x[0])}$.${extra}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13', kind: 'Theorem', name: 'Roy’s identity',
      statement: String.raw`Suppose the indirect utility function $v(p, m)$ is differentiable at $(p, m)$ with $\partial v/\partial m > 0$. Then Marshallian demand can be recovered from it:
$$x_i(p, m) = -\,\frac{\partial v(p, m)/\partial p_i}{\partial v(p, m)/\partial m}.$$
The denominator is the marginal utility of income $\lambda$ (5.4). In words: a small rise $dp_i$ in a price costs the consumer about $x_i\,dp_i$ dollars of purchasing power, which is worth $\lambda x_i\,dp_i$ in utility.`,
      idea: String.raw`Differentiate the identity $v(p, e(p, \bar u)) = \bar u$ (5.11) with respect to $p_i$: $\partial v/\partial p_i + (\partial v/\partial m)\,\partial e/\partial p_i = 0$, and Shephard's lemma (5.12) gives $\partial e/\partial p_i = h_i = x_i$. Equivalently, by the envelope theorem (7.9) applied to the Lagrangian $u(x) - \lambda(p \cdot x - m)$, $\partial v/\partial p_i = -\lambda x_i$ and $\partial v/\partial m = \lambda$, because the induced change in the optimal bundle has no first-order effect on utility. A picture of the same fact: raising income by $\Delta m$ exactly offsets a price rise of about $\Delta m/x_i$, so the curve $v(\cdot, m + \Delta m)$ is the curve $v(\cdot, m)$ shifted right by $\Delta m/x_i$.`,
      caption: String.raw`Type a utility or pick a preset. The top panel plots indirect utility against $p_1$ (solid) and again with income raised by $\Delta m$ (dashed). Drag $P$ along the solid curve. The green tangent has slope $\partial v/\partial p_1$; the gold vertical gap is $\Delta v \approx \lambda\,\Delta m$; and the teal horizontal gap $\delta$ is the price rise that the extra income exactly pays for. Roy's identity says $-(\partial v/\partial p_1)/\lambda = x_1$, and $\Delta m/\delta \to x_1$. The bottom panel, on the same price axis, is the demand curve found by maximizing utility directly; the gold dots are computed from $v$ alone by Roy's formula and land on it.`,
      deps: ['micro-5.12', 'micro-7.9', 'micro-5.4'], refs: ['Varian Ch. 8'], tags: ['duality', 'demand'],
      credit: 'René Roy, 1947',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Roy%27s_identity' },
      viz(v) {
        const p2 = 1, PA = 0.3, PB = 4;
        const PRE = { cd: ['Cobb–Douglas', 'x1^0.3 x2^0.7'], ces: ['CES', '(sqrt(x1) + sqrt(x2))^2'], ql: ['quasilinear', '4 ln(x1) + x2'], comp: ['complements', 'min(x1, 2 x2)'] };
        let inp = null;
        v.select('preset', Object.entries(PRE).map(([value, [label]]) => ({ value, label })), 'cd', { onChange: (k) => inp.set(PRE[k][1]) });
        inp = v.input('$u(x_1, x_2) =$', PRE.cd[1], { vars: ['x1', 'x2', 'x', 'y'], width: 240 });
        const m = v.slider('income $m$', 4, 20, 10, { step: 0.1 });
        const dm = v.slider('income nudge $\\Delta m$', 0.1, 4, 1.5, { step: 0.05 });
        const a = v.stage({ x: [PA, PB], y: [0, 1], height: 280, axes: 'box', full: true, xlabel: 'price p₁', ylabel: 'v(p₁, m)', title: 'indirect utility against the price of good 1' });
        const d = v.stage({ x: [PA, PB], y: [0, 1], height: 210, axes: 'box', full: true, xlabel: 'price p₁', ylabel: 'x₁', title: 'demand for good 1: direct maximization (line) and Roy’s formula (dots)' });
        let pP = 1.2;
        const P = a.handle(1.2, 0.5, { color: 'accent', label: 'P', labelPos: 'sw', constrain: (x) => { pP = clamp(x, PA + 0.1, PB - 0.3); return [pP, VV(pP, m.value)]; } });
        v.legend([['ink', 'v(p₁, m)'], ['muted', 'v(p₁, m + Δm)', { dash: true }], ['green', 'tangent, slope ∂v/∂p₁'], ['gold', 'Δv and Roy’s formula'], ['teal', 'price rise δ paid for by Δm']]);
        const U = () => { const f = inp.fn; return f ? (x, y) => f(x, y, x, y) : (x, y) => x ** 0.3 * y ** 0.7; };
        const best = (u, P1, M) => { const r = argmax((t) => { const w = u((t * M) / P1, ((1 - t) * M) / p2); return isFinite(w) ? w : -1e300; }, 0, 1, 90); return { x1: (r.x * M) / P1, u: r.f }; };
        let VV = (q, M) => best(U(), q, M).u;
        let st = {};
        v.render(() => {
          const u = U(), M = m.value, D = dm.value; VV = (q, MM) => best(u, q, MM).u;
          const ps = []; for (let i = 0; i <= 110; i++) ps.push(PA + ((PB - PA) * i) / 110);
          const v0 = ps.map((q) => VV(q, M)), v1 = ps.map((q) => VV(q, M + D));
          const all = [...v0, ...v1].filter(isFinite), lo = Math.min(...all), hi = Math.max(...all), pd = 0.08 * (hi - lo || 1);
          a.setView([PA, PB], [lo - pd, hi + pd]);
          a.path(ps.map((q, i) => [q, v1[i]]), { color: 'muted', width: 2, dash: [7, 5] });
          a.path(ps.map((q, i) => [q, v0[i]]), { color: 'ink', width: 2.6 });
          const q = pP, h = 1e-3, vq = VV(q, M); P.x = q; P.y = vq;
          const vp = (VV(q + h, M) - VV(q - h, M)) / (2 * h), lam = (VV(q, M + h) - VV(q, M - h)) / (2 * h), roy = -vp / lam, x1 = best(u, q, M).x1;
          a.clip(() => a.line(q - 0.9, vq - 0.9 * vp, q + 0.9, vq + 0.9 * vp, { color: 'green', width: 2.2 }));
          const vq1 = VV(q, M + D); a.line(q, vq, q, vq1, { color: 'gold', width: 3 }); a.text('Δv', q, (vq + vq1) / 2, { dx: -8, color: 'gold', ...LBL, align: 'right' });
          const del = bisect((t) => VV(q + t, M + D) - vq, 0, PB + 2 - q, 50);
          if (del != null && q + del <= PB) { a.arrow(q, vq, q + del, vq, { color: 'teal', width: 2.6, head: 9 }); a.text(`δ = ${v.fix(del, 3)}`, q + del / 2, vq, { dy: 13, color: 'teal', ...LBL, align: 'center' }); }
          // the demand curve and Roy's dots
          const xs = ps.map((p) => best(u, p, M).x1), xmax = Math.max(...xs.filter(isFinite));
          d.setView([PA, PB], [0, Math.min(xmax * 1.08, 40)]);
          d.path(ps.map((p, i) => [p, xs[i]]), { color: 'accent', width: 2.6 });
          for (let j = 0; j < 14; j++) { const p = PA + 0.15 + ((PB - PA - 0.4) * j) / 13, rv = -(VV(p + h, M) - VV(p - h, M)) / (VV(p, M + h) - VV(p, M - h)); if (isFinite(rv)) d.dot(p, rv, { r: 4.5, color: 'gold' }); }
          d.line(q, 0, q, roy, GUIDE); d.dot(q, roy, { r: 6.5, color: 'gold', label: `x₁ = ${v.fix(roy, 2)}`, labelPos: 'ne', math: false });
          st = { q, vq, vp, lam, roy, x1, del, D, M };
        });
        v.readout(() => {
          const { q, vp, lam, roy, x1, del, D } = st, f = (z) => v.fix(z, 3);
          const err = inp.error ? ` (Formula error: ${inp.error}; using the last valid formula.)` : '';
          const comp = del != null ? ` The extra income $\\Delta m = ${v.fix(D, 2)}$ pays for a price rise of $\\delta = ${f(del)}$: $\\Delta m/\\delta = ${f(D / del)}$, which tends to $x_1$ as $\\Delta m \\to 0$.` : '';
          return `At $p_1 = ${v.fix(q, 2)}$: $\\partial v/\\partial p_1 = ${f(vp)}$ and $\\lambda = \\partial v/\\partial m = ${f(lam)}$ (both by finite differences of $v$ alone), so Roy's identity gives $x_1 = -(${f(vp)})/${f(lam)} = ${f(roy)}$. Maximizing utility directly gives $x_1 = ${f(x1)}$.${comp}${err}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.14
    {
      num: '5.14', kind: 'Definition', name: 'Homothetic preferences and linear Engel curves',
      statement: String.raw`Preferences are **homothetic** if scaling two indifferent bundles by the same factor keeps them indifferent: $x \sim y$ implies $tx \sim ty$ for every $t > 0$. Equivalently they can be represented by a utility function homogeneous of degree one, every indifference curve is a radial blow-up of every other, and the MRS is constant along each ray from the origin. Then demand is proportional to income, $x(p, m) = m\,x(p, 1)$: the income offer curve is a ray, Engel curves are straight lines through the origin, every income elasticity equals 1, and budget shares do not depend on income. Cobb–Douglas, CES, perfect substitutes and perfect complements are homothetic; quasilinear and Stone–Geary preferences are not.`,
      idea: String.raw`If $x^*$ is best at income $m$, then $tx^*$ is affordable at income $tm$, and anything better than $tx^*$ that was affordable at $tm$ would, scaled back by $1/t$, be better than $x^*$ and affordable at $m$, since scaling preserves the ranking. So $tx^*$ is best at $tm$, and the optimum moves along the ray through $x^*$. Equivalently, the tangency condition $\mathrm{MRS} = p_1/p_2$ picks out one ray (4.12), whatever the income. This is what makes homothetic preferences convenient for aggregation and for trade models: a population with the same homothetic tastes behaves like a single consumer whatever the distribution of income. Quasilinear preferences fail this: once income covers the satiating amount of good 1, all extra income goes to good 2.`,
      caption: String.raw`Slide income and the price. The green curve is the income expansion path, drawn over the full range of incomes. The purple curve is the indifference curve through the current best bundle, and the gold dashed curve is the curve through the best bundle at $m = 4$, scaled up by $m/4$. For homothetic preferences the two coincide and the path is a ray. For **quasilinear** and **Stone–Geary** preferences they separate, the path bends, and the Engel curves on the right are not straight lines through the origin; the bottom panel shows the budget share drifting with income.`,
      deps: ['micro-5.8', 'micro-4.12'], refs: ['Varian Ch. 6'], tags: ['demand', 'preferences'],
      see: ['micro-1.11'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Homothetic_preferences' },
      viz(v) {
        const p2 = 1, M0 = 4, MMAX = 16;
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.4 }), homo: true },
          ces: { label: 'CES, $\\sigma = \\tfrac12$', F: prefs('ces', { a: 0.5, r: -1 }), homo: true },
          comp: { label: 'perfect complements', F: prefs('comp', { a: 1, b: 1.5 }), homo: true },
          ql: { label: 'quasilinear', F: prefs('ql', { a: 3 }), homo: false },
          sg: { label: 'Stone–Geary', F: prefs('sg', { a: 0.3, g1: 2, g2: 1 }), homo: false },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const m = v.slider('income $m$', 1, MMAX, 11, { step: 0.05 });
        const p1 = v.slider('price $p_1$', 0.5, 2.5, 1, { step: 0.01 });
        const s = v.stage({ x: [0, 13], y: [0, 13], height: 360, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.15 });
        const e = v.stage({ x: [0, MMAX], y: [0, 12], height: 360, axes: 'box', xlabel: 'income m', ylabel: 'quantity', title: 'Engel curves' });
        const sh = v.stage({ x: [0, MMAX], y: [0, 1], height: 150, axes: 'box', full: true, xlabel: 'income m', ylabel: 'share s₁', title: 'the budget share of good 1 against income' });
        v.legend([['green', 'income expansion path'], ['purple', 'indifference curve now'], ['gold', 'curve at m = 4, scaled by m/4', { dash: true }], ['orange', 'x₁(m)'], ['teal', 'x₂(m)']]);
        let st = {};
        v.render(() => {
          const k = fam.value, o = FAM[k], F = o.F, M = m.value, P = p1.value;
          const ms = []; for (let i = 0; i <= 160; i++) ms.push(0.05 + ((MMAX - 0.05) * i) / 160);
          const path = ms.map((q) => demand(F, P, p2, q)), ok = path.map((q) => q && isFinite(q[0]) && q[0] >= 0 && q[1] >= 0);
          const xs = demand(F, P, p2, M), x0 = demand(F, P, p2, M0);
          // the ray through the current bundle, for comparison
          const th = Math.atan2(xs[1], xs[0]); s.line(0, 0, 20 * Math.cos(th), 20 * Math.sin(th), { color: 'muted', width: 1, dash: [3, 4] });
          budget(s, P, p2, M);
          s.clip(() => s.path(path.map((q, i) => (ok[i] ? q : null)), { color: 'green', width: 3 }));
          drawLevel(s, F, F.u(...x0), { color: v.color('purple', 0.35), width: 1.2 });
          drawLevel(s, F, F.u(...xs), { color: 'purple', width: 2.6 });
          const kf = M / M0, base = icurve(F, F.u(...x0), 13 / kf, 13 / kf, 220).map((q) => (q ? [kf * q[0], kf * q[1]] : null));
          s.clip(() => s.path(base, { color: 'gold', width: 2.2, dash: [7, 5] }));
          if (F.sub) s.dot(F.sub[0], F.sub[1], { r: 4, color: 'ink', label: 'subsistence', labelPos: 'sw', math: false });
          s.dot(x0[0], x0[1], { r: 4.5, color: 'green', alpha: 0.7 });
          s.dot(xs[0], xs[1], { r: 6.5, color: 'green', label: 'x*', labelPos: 'ne' });
          // Engel curves
          e.clip(() => { e.path(ms.map((q, i) => (ok[i] ? [q, path[i][0]] : null)), { color: 'orange', width: 2.6 }); e.path(ms.map((q, i) => (ok[i] ? [q, path[i][1]] : null)), { color: 'teal', width: 2.6 }); });
          e.vline(M, GUIDE); e.dot(M, xs[0], { r: 5.5, color: 'orange', label: 'x₁', labelPos: 'nw', math: false }); e.dot(M, xs[1], { r: 5.5, color: 'teal', label: 'x₂', labelPos: 'nw', math: false });
          // budget share of good 1
          sh.clip(() => sh.path(ms.map((q, i) => (ok[i] ? [q, (P * path[i][0]) / q] : null)), { color: 'orange', width: 2.6 }));
          sh.dot(M, (P * xs[0]) / M, { r: 5.5, color: 'orange' });
          // is demand proportional to income? compare x(m)/m across incomes
          const rat = path.map((q, i) => (ok[i] && ms[i] > 1 ? q[0] / ms[i] : null)).filter((z) => z != null), spread = (Math.max(...rat) - Math.min(...rat)) / Math.max(...rat);
          const gap = Math.max(...base.filter(Boolean).map((q) => Math.abs(F.u(q[0], q[1]) - F.u(...xs)))) / Math.max(1e-9, Math.abs(F.u(...xs)));
          st = { k, o, M, P, xs, x0, spread, gap, s1: (P * xs[0]) / M };
        });
        v.readout(() => {
          const { k, o, M, xs, x0, spread, s1 } = st, f = (q) => v.fix(q, 2);
          const head = `At $m = ${f(M)}$ the best bundle is $(${f(xs[0])}, ${f(xs[1])})$; at $m = 4$ it was $(${f(x0[0])}, ${f(x0[1])})$, and scaled by $m/4$ that would be $(${f((x0[0] * M) / 4)}, ${f((x0[1] * M) / 4)})$.`;
          if (o.homo) return `${head} They agree: **homothetic**. Demand is proportional to income ($x_1/m$ varies by ${v.fix(100 * spread, 4)}% across incomes), Engel curves are straight lines through the origin and the share $s_1 = ${f(s1)}$ never changes.`;
          if (k === 'ql') return `${head} They differ: **not homothetic**. Below $m = 3p_2 = 3$ only good 1 is bought; beyond that $x_1 = 3p_2/p_1$ is fixed, the expansion path turns vertical, and the share of good 1 falls toward zero as income grows.`;
          return `${head} They differ: **not homothetic**. Stone–Geary demand is $x_1 = 2 + 0.3(m - p_1\\cdot 2 - p_2\\cdot 1)/p_1$: subsistence quantities are bought first, so Engel curves are straight but do not pass through the origin, and the share $s_1 = ${f(s1)}$ drifts with income.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.15
    {
      num: '5.15', kind: 'Proposition', name: 'An income tax beats an equal-yield quantity tax',
      statement: String.raw`A consumer with income $m$ faces prices $p_1, p_2$. A **quantity tax** of $t$ per unit of good 1 raises $R = t\,x_1^q$, where $x^q$ is the bundle chosen at prices $(p_1 + t, p_2)$. An **income tax** that raises the same revenue $R$ leaves the consumer at least as well off: $v(p, m - R) \ge v(p_1 + t, p_2, m)$, strictly if the consumer substitutes away from good 1 (an indifference curve without a kink at $x^q$). The money value of the difference, the **excess burden** of the quantity tax, is $(m - R) - e(p, v(p_1 + t, p_2, m)) \ge 0$. The comparison is for one consumer with fixed producer prices; it says nothing about distribution across consumers or about taxes on labour supply.`,
      idea: String.raw`Under the quantity tax the consumer spends $(p_1 + t)x_1^q + p_2x_2^q = m$, that is $p_1x_1^q + p_2x_2^q = m - R$. So the bundle $x^q$ lies on the income-tax budget line $p \cdot x = m - R$, and the consumer could keep $x^q$ under the income tax (revealed preference, 4.2). But at $x^q$ the indifference curve has slope $-(p_1 + t)/p_2$, steeper than the income-tax line, so it cuts that line, and moving along it toward more good 1 reaches a higher curve. The quantity tax distorts the relative price the consumer acts on; the income tax collects the same money without that distortion. The loss is second order in $t$, roughly $\tfrac12 t\,\Delta x_1$ with $\Delta x_1$ the compensated response, which is the triangle of 3.12.`,
      caption: String.raw`Set the per-unit tax on good 1. The quantity tax pivots the budget line inward and the consumer moves to $q$ (red); the gold bar at $q$ is the revenue, measured in units of good 2. The teal income-tax line raises the same revenue: it is parallel to the original line and passes through $q$, and the consumer moves to $i$ on a higher indifference curve. The dashed purple line is the cheapest budget that reaches the quantity-tax indifference curve at the original prices; its distance below the teal line is the excess burden. Bars compare the two taxes; the bottom panel plots revenue and excess burden against the tax rate. With **perfect complements** the gain disappears.`,
      deps: ['micro-5.2', 'micro-4.2', 'micro-5.12'], refs: ['Varian Ch. 5'], tags: ['taxes', 'welfare'],
      see: ['micro-3.9', 'micro-3.12', 'micro-3.10'],
      credit: 'Harold Hotelling, 1938; Miles Joseph, 1939',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Excess_burden_of_taxation' },
      viz(v) {
        const m = 12, p1 = 1, p2 = 1;
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.5 }) },
          ces: { label: 'CES, $\\sigma = 2$', F: prefs('ces', { a: 0.5, r: 0.5 }) },
          ql: { label: 'quasilinear', F: prefs('ql', { a: 5 }) },
          comp: { label: 'perfect complements', F: prefs('comp', { a: 1, b: 1 }) },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const t = v.slider('tax per unit of good 1, $t$', 0, 2, 1, { step: 0.01 });
        const s = v.stage({ x: [0, 13], y: [0, 13], height: 370, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.25 });
        const b = v.stage({ x: [0, 1], y: [0, 13], height: 370, axes: false, weight: 0.7, minWidth: 220, title: 'same revenue, different welfare' });
        const c = v.stage({ x: [0, 2], y: [0, 1], height: 170, axes: 'box', full: true, xlabel: 'tax per unit t', ylabel: '$', title: 'revenue and excess burden of the quantity tax' });
        v.legend([['muted', 'no tax', { dash: true }], ['accent', 'quantity-tax budget'], ['teal', 'income tax, same revenue'], ['gold', 'revenue R'], ['red', 'excess burden']]);
        const solve = (F, T) => {
          const q = demand(F, p1 + T, p2, m), R = T * q[0], uq = F.u(...q), i = demand(F, p1, p2, m - R), ui = F.u(...i), H = hicks(F, p1, p2, uq);
          return { q, R, uq, i, ui, eq: H ? H.e : m - R, EB: H ? Math.max(0, m - R - H.e) : 0 };
        };
        const cache = {};
        const curve = (k) => cache[k] || (cache[k] = (() => { const F = FAM[k].F, out = []; for (let j = 0; j <= 60; j++) { const T = (2 * j) / 60, r = solve(F, T); out.push([T, r.R, r.EB]); } return out; })());
        let st = {};
        v.render(() => {
          const k = fam.value, F = FAM[k].F, T = t.value, r = solve(F, T), x0 = demand(F, p1, p2, m);
          s.clip(() => s.line(m / p1, 0, 0, m / p2, { color: 'muted', width: 1.6, dash: [7, 5] }));
          budget(s, p1 + T, p2, m);
          s.clip(() => s.line((m - r.R) / p1, 0, 0, (m - r.R) / p2, { color: 'teal', width: 2.6 }));
          if (r.EB > 1e-3) s.clip(() => s.line(r.eq / p1, 0, 0, r.eq / p2, { color: 'purple', width: 1.4, dash: [5, 4] }));
          drawLevel(s, F, r.uq, { color: 'purple', width: 2 });
          if (Math.abs(r.ui - r.uq) > 1e-6) drawLevel(s, F, r.ui, { color: 'purple', width: 2.6 });
          if (r.R > 0.02) { s.line(r.q[0], r.q[1], r.q[0], r.q[1] + r.R / p2, { color: 'gold', width: 5, alpha: 0.85 }); s.text('R', r.q[0], r.q[1] + r.R / (2 * p2), { dx: 8, color: 'gold', ...LBL, align: 'left' }); }
          s.dot(x0[0], x0[1], { r: 5, hollow: true, color: 'muted', width: 2, label: 'no tax', labelPos: 'ne', labelColor: 'muted', math: false });
          s.dot(r.q[0], r.q[1], { r: 6.5, color: 'red', label: 'q', labelPos: 'sw' });
          s.dot(r.i[0], r.i[1], { r: 6.5, color: 'green', label: 'i', labelPos: r.i[0] > r.q[0] ? 'ne' : 'nw' });
          // bars: money-metric welfare under each tax, at the original prices
          const top = m * 1.02;
          const bar = (x0b, x1b, h, col, txt) => { b.rect(x0b, 0, x1b, h, { fill: col, fillAlpha: 0.7, stroke: false, radius: 5 }); b.text(txt, (x0b + x1b) / 2, h, { dy: -10, align: 'center', color: col, ...LBL }); };
          b.setView([0, 1], [0, top * 1.12]);
          bar(0.08, 0.42, r.eq, 'red', `${v.fix(r.eq, 2)}`); bar(0.58, 0.92, m - r.R, 'teal', `${v.fix(m - r.R, 2)}`);
          if (r.EB > 0.01) b.rect(0.08, r.eq, 0.42, m - r.R, { fill: 'red', fillAlpha: 0.08, hatch: 'red', stroke: false });
          b.line(0.02, m - r.R, 0.98, m - r.R, { color: 'teal', width: 1, dash: [3, 3] });
          b.text('quantity tax', 0.25, 0, { dy: -12, align: 'center', color: 'ink', size: 11.5, weight: 600 });
          b.text('income tax', 0.75, 0, { dy: -12, align: 'center', color: 'ink', size: 11.5, weight: 600 });
          b.text('money-metric welfare e(p, u)', 0.5, top * 1.1, { align: 'center', color: 'muted', size: 11.5, baseline: 'top' });
          b.text(`revenue ${v.fix(r.R, 2)} in both cases`, 0.5, top * 1.03, { align: 'center', color: 'gold', ...LBL, baseline: 'top' });
          // revenue and excess burden against t
          const cv = curve(k), cmax = Math.max(...cv.map((z) => z[1])) * 1.12 || 1;
          c.setView([0, 2], [0, cmax]);
          c.path(cv.map((z) => [z[0], z[1]]), { color: 'gold', width: 2.6 });
          c.path(cv.map((z) => [z[0], z[2]]), { color: 'red', width: 2.6 });
          c.between((x) => { const j = Math.min(59, Math.floor(x * 30)), w = x * 30 - j; return cv[j][2] * (1 - w) + cv[j + 1][2] * w; }, () => 0, 0, T, { fill: 'red', fillAlpha: 0.12 });
          c.vline(T, GUIDE); c.dot(T, r.R, { r: 5.5, color: 'gold' }); c.dot(T, r.EB, { r: 5.5, color: 'red' });
          c.text('revenue R', 1.98, cv[60][1], { dy: -10, color: 'gold', ...LBL, align: 'right' }); c.text('excess burden', 1.98, cv[60][2], { dy: -10, color: 'red', ...LBL, align: 'right' });
          st = { k, T, r, x0 };
        });
        v.readout(() => {
          const { k, T, r } = st, f = (q) => v.fix(q, 2), f3 = (q) => v.fix(q, 3);
          if (T < 1e-9) return 'With no tax both budget lines coincide with the original one. Raise $t$.';
          const gain = r.ui - r.uq;
          const tail = k === 'comp' ? ' With perfect complements the consumer cannot substitute away from good 1: the indifference curve has a corner at $q$, so the income-tax line touches the same curve there and there is **no gain**.' : ` The excess burden grows roughly with the square of the tax: at $t = ${f(T)}$ it is ${f3(r.EB)}, about $${v.fix((100 * r.EB) / Math.max(r.R, 1e-9), 1)}\\%$ of the revenue.`;
          return `A tax of ${f(T)} per unit of good 1 moves the consumer to $q = (${f(r.q[0])}, ${f(r.q[1])})$ and raises $R = ${f3(r.R)}$. Taking $R$ as an income tax instead gives $i = (${f(r.i[0])}, ${f(r.i[1])})$, with utility ${f3(r.ui)} against ${f3(r.uq)}${gain > 1e-6 ? '' : ' (equal)'}. At the original prices the quantity-tax utility could be bought for $e(p, u_q) = ${f3(r.eq)}$, while the income tax leaves $m - R = ${f3(12 - r.R)}$: the excess burden is ${f3(r.EB)}.${tail}`;
        });
      },
    },
  ],
};
