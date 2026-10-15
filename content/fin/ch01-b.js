// Finance — Chapter 1: The time value of money (items 1.7–1.13; 1.1–1.6 are in ch01.js)
import { clamp, pct, fx, sg, money, usd, npv, dated, irrs, annuityFactor, niceUp } from './ch01.shared.js';

const pctTicks = (xs, d = 0) => xs.map((x) => [x, pct(x, d)]);
/** Hatched rectangle with an outline (two passes: the runtime's hatch must not be combined with a stroke). */
function hatchRect(S, x0, y0, x1, y1, col, alpha = 0.3) {
  S.rect(x0, y0, x1, y1, { fill: col, fillAlpha: alpha, hatch: col, stroke: false });
  S.rect(x0, y0, x1, y1, { color: col, width: 1.2 });
}
/** y-window [lo, hi] around values (always including 0), padded by a fraction. */
function around(vals, padFrac = 0.12) {
  const fin = vals.filter(Number.isFinite), lo = Math.min(0, ...fin), hi = Math.max(0, ...fin), p = padFrac * (hi - lo || 1);
  return [lo - p, hi + p];
}
/** Running balance of an account paying r that receives the flows cs[t] at the end of each year t. */
function balances(cs, r) { const out = []; let b = 0; cs.forEach((c, t) => { b = (t ? b * (1 + r) : 0) + c; out.push(b); }); return out; }
/** Monthly mortgage schedule: loan L, annual rate y, n months, extra principal E a month. */
function schedule(L, y, n, E) {
  const i = y / 12, pay = i > 0 ? (L * i) / (1 - Math.pow(1 + i, -n)) : L / n, rows = [];
  let B = L;
  for (let k = 1; k <= n + 1 && B > 1e-6; k++) {
    const I = B * i, P = Math.min(pay - I, B), X = Math.min(E, B - P);
    B = B - P - X;
    rows.push({ k, I, P, X, B: Math.max(0, B) });
  }
  return { pay, rows, total: rows.reduce((s, q) => s + q.I, 0) };
}

export default {
  collection: 'fin',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Definition',
      name: 'Internal rate of return',
      statement: String.raw`The **internal rate of return** (IRR) of cash flows $c_0,c_1,\dots,c_N$ is a rate $r^*>-1$ at which their net present value vanishes:
$$\sum_{t=0}^N \frac{c_t}{(1+r^*)^t}=0 .$$
Equivalently, an account paying interest $r^*$ that receives the flows as deposits and withdrawals ends at exactly zero, so $r^*$ is the rate the project earns on the money still tied up in it. If the sequence of cash flows changes sign exactly once, from outflows to inflows (a **conventional** project), there is exactly one IRR in $(-1,\infty)$, it is positive when $\sum_t c_t>0$, and $\mathrm{NPV}(r)>0$ precisely for $r<r^*$; then the IRR rule "accept if $r^*$ exceeds the cost of capital" agrees with the NPV rule (fin 1.6).`,
      idea: String.raw`For a conventional project the NPV is continuous on $(-1,\infty)$, tends to $+\infty$ as $r\downarrow-1$ (when the inflows dominate) and to $c_0<0$ as $r\to\infty$, so the intermediate value theorem (pma 4.23) gives a root; with one sign change the polynomial $\sum c_tx^t$ in $x=1/(1+r)$ has exactly one positive root (Descartes' rule of signs), so the root is unique. The same theorem drives **bisection**: if NPV has opposite signs at $a$ and $b$, evaluate the midpoint and keep the half where the sign still changes; every step halves the bracket, so 20 steps pin the IRR to about one part in a million of the starting width. The final balance of the account at rate $r$ is $\mathrm{NPV}(r)(1+r)^N$, which has the sign of the NPV — that is the test bisection applies.`,
      caption: String.raw`Drag the orange bracket ends $a$ and $b$ along the rate axis — bisection can start only if NPV changes sign between them — and step through. Each step evaluates NPV at the gold midpoint and keeps the half that still holds the sign change. Right: a zoom on the current bracket, where the curve straightens into a line. Bottom: the project as a bank account paying the midpoint rate; it ends above zero when the midpoint is below the IRR and below zero when it is above.`,
      deps: ['fin-1.6', 'pma-4.23'],
      refs: ['Luenberger: Basic Theory of Interest'],
      tags: ['capital budgeting', 'root finding'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Internal_rate_of_return' },
      viz(v) {
        const M = v.M, XR = [-0.1, 0.6];
        const PROJ = {
          conv: { label: 'conventional', cs: [-1000, 300, 400, 500, 200] },
          bond: { label: 'a bond bought at 95', cs: [-95, 6, 6, 6, 6, 106] },
          venture: { label: 'a venture', cs: [-1000, 0, 0, 0, 0, 0, 3000] },
        };
        let S = null;
        const pS = v.select('project', Object.entries(PROJ).map(([value, p]) => ({ value, label: p.label })), 'conv', { onChange: () => S && S.reset(undefined, { at: 'start' }) });
        const L = v.stage({ x: XR, y: [-600, 1200], height: 290, axes: 'box', weight: 1.25, minWidth: 320, ylabel: 'NPV ($)', xticks: pctTicks([0, 0.1, 0.2, 0.3, 0.4, 0.5]), title: 'NPV(r) and the bisection bracket' });
        const Z = v.stage({ x: [0, 1], y: [-1, 1], height: 290, axes: 'box', weight: 1, minWidth: 260, title: 'zoom on the current bracket' });
        const A = v.stage({ x: [-0.6, 6.6], y: [-1200, 600], height: 210, axes: 'box', full: true, xlabel: 'year', title: 'the project as a bank account paying the midpoint rate ($)' });
        const snap = (x) => [M.clamp(Math.round(x * 200) / 200, XR[0] + 0.005, XR[1] - 0.005), 0];
        const ha = L.handle(0, 0, { color: 'orange', label: 'a', labelPos: 'sw', constrain: snap });
        const hb = L.handle(0.5, 0, { color: 'orange', label: 'b', labelPos: 'se', constrain: snap });
        const cs = () => PROJ[pS.value].cs;
        const money2 = (x) => `${x < 0 ? '−' : '+'}$${Math.abs(x).toFixed(2)}`;
        function build() {
          const F = dated(cs()), f = (r) => npv(F, r);
          let lo = Math.min(ha.x, hb.x), hi = Math.max(ha.x, hb.x), flo = f(lo);
          const fhi = f(hi), frames = [];
          if (!(flo * fhi < 0)) {
            frames.push({ lo, hi, mid: null, bad: true, note: `NPV(a) = ${money2(flo)} and NPV(b) = ${money2(fhi)} have the same sign: the intermediate value theorem promises no root between them, so bisection cannot start. Move $a$ or $b$.` });
            return frames;
          }
          frames.push({ lo, hi, mid: null, note: `NPV(a) = ${money2(flo)} and NPV(b) = ${money2(fhi)} have opposite signs, so by the intermediate value theorem an IRR lies in $[a,b]$.`, vars: { a: pct(lo, 2), b: pct(hi, 2) } });
          for (let k = 1; k <= 20; k++) {
            const mid = (lo + hi) / 2, fm = f(mid), left = flo * fm < 0;
            frames.push({ lo, hi, mid, fm, k, note: `Step ${k}: NPV(${pct(mid, 5)}) = ${money2(fm)}, so the sign change is in the ${left ? 'left' : 'right'} half: ${left ? '$b$' : '$a$'} ← midpoint.`, vars: { a: pct(lo, 5), b: pct(hi, 5), 'width': pct(hi - lo, 5) } });
            if (left) hi = mid; else { lo = mid; flo = fm; }
          }
          frames.push({ lo, hi, mid: (lo + hi) / 2, done: true, note: `After 20 halvings the bracket is ${pct(hi - lo, 7)} wide: IRR ≈ ${pct((lo + hi) / 2, 5)}.`, vars: { a: pct(lo, 6), b: pct(hi, 6) } });
          return frames;
        }
        S = v.steps({ frames: build, still: 4, speed: 1.6 });
        ha.onDrag = hb.onDrag = () => S.reset(undefined, { at: 'start' });
        v.legend([['accent', 'NPV(r)'], ['orange', 'bracket [a, b]', { area: true }], ['gold', 'midpoint', { dot: true }], ['green', 'account in credit', { area: true }], ['red', 'account overdrawn', { area: true }]]);
        let st = null;
        v.render(() => {
          const c = cs(), F = dated(c), f = (r) => npv(F, r), fr = S.frame || {};
          const lo = fr.lo ?? Math.min(ha.x, hb.x), hi = fr.hi ?? Math.max(ha.x, hb.x), mid = fr.mid;
          // left: the whole curve
          L.setView(XR, around(M.linspace(XR[0], XR[1], 120).map(f), 0.1));
          L.vband(lo, hi, { color: fr.bad ? 'red' : 'orange', alpha: 0.12, edges: true });
          L.hline(0, { color: 'ink', width: 1 });
          L.fn(f, { color: 'accent', width: 2.5 });
          L.dot(lo, f(lo), { r: 4.5, color: 'orange' }); L.dot(hi, f(hi), { r: 4.5, color: 'orange' });
          if (mid != null) { L.vline(mid, { color: 'gold', width: 1.4, dash: [4, 3] }); L.dot(mid, f(mid), { r: 5.5, color: 'gold' }); }
          ha.y = hb.y = 0;
          // zoom
          const w = Math.max(hi - lo, 1e-12), zx = [lo - 0.18 * w, hi + 0.18 * w];
          const d = Math.max(1, Math.min(8, Math.ceil(-Math.log10(100 * w)) + 2));
          Z.setTicks([[lo, pct(lo, d)], [hi, pct(hi, d)]], undefined);
          Z.setView(zx, around(M.linspace(zx[0], zx[1], 60).map(f), 0.15));
          Z.vband(lo, hi, { color: fr.bad ? 'red' : 'orange', alpha: 0.1 });
          Z.hline(0, { color: 'ink', width: 1 });
          Z.fn(f, { domain: zx, color: 'accent', width: 2.5, n: 200 });
          Z.dot(lo, f(lo), { r: 5, color: 'orange' }); Z.dot(hi, f(hi), { r: 5, color: 'orange' });
          if (mid != null) { Z.vline(mid, { color: 'gold', width: 1.4, dash: [4, 3] }); Z.dot(mid, f(mid), { r: 6, color: 'gold' }); Z.text(pct(mid, d), mid, Z.bounds.y[1], { dy: 10, align: 'center', color: 'gold', weight: 700, size: 11.5, plate: true }); }
          Z.corner(`width ${pct(w, Math.min(9, d + 1))}`, 'bl', { color: 'orange', weight: 650 });
          // the account at the midpoint rate
          const rr = mid ?? (lo + hi) / 2, B = balances(c, rr);
          A.setView([-0.6, c.length - 0.4], around(B.concat(c.map((x) => Math.min(x, 0))), 0.16));
          A.setTicks(c.map((_, t) => [t, String(t)]), undefined);
          A.hline(0, { color: 'ink', width: 1 });
          B.forEach((b, t) => {
            const col = b >= 0 ? 'green' : 'red', last = t === B.length - 1;
            A.rect(t - 0.28, 0, t + 0.28, b, { fill: col, fillAlpha: last ? 0.75 : 0.35, color: last ? col : null, width: last ? 2 : 0, stroke: last });
            if (t > 0) A.line(t - 1 + 0.28, B[t - 1], t - 0.28, B[t - 1] * (1 + rr), { color: 'muted', width: 1.2, dash: [3, 3] });
            if (c[t] !== 0) A.text(`${c[t] > 0 ? '+' : '−'}${Math.abs(c[t])}`, t, 0, { dy: b >= 0 ? 12 : -12, align: 'center', color: c[t] > 0 ? 'blue' : 'red', size: 10.5, weight: 650 });
          });
          const fin = B[B.length - 1];
          A.text(`ends at ${money2(fin)}`, B.length - 1, fin, { dx: -34, dy: fin >= 0 ? -12 : 12, align: 'right', color: fin >= 0 ? 'green' : 'red', weight: 750, size: 12, plate: true });
          st = { F, lo, hi, mid, fr, fin, rr };
        });
        v.readout(() => {
          if (!st) return '';
          const { F, lo, hi, fr, fin, rr } = st;
          const roots = irrs(F, -0.9, 4);
          const exact = roots.length ? `the IRR is ${pct(roots[0], 6)}` : 'no IRR';
          if (fr.bad) return `No sign change on [${pct(lo, 2)}, ${pct(hi, 2)}]: bisection has nothing to work with. (For this project ${exact}.)`;
          return `Bracket [${pct(lo, 6)}, ${pct(hi, 6)}], width ${pct(hi - lo, 6)} · at the ${fr.mid == null ? 'centre' : 'midpoint'} ${pct(rr, 5)} the account ends at ${money2(fin)} $= \\mathrm{NPV}(r)(1+r)^N$, so the IRR is ${fin > 0 ? 'higher' : 'lower'} · exact: ${exact} · error after $k$ steps $\\le$ (b − a)/2$^{k+1}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Paradox',
      name: 'Multiple IRRs and NPV–IRR conflicts',
      statement: String.raw`The IRR can fail as a decision criterion in two ways.
(a) **Several or no IRRs.** NPV$(r)=\sum_t c_t x^t$ with $x=1/(1+r)$ is a polynomial of degree $N$, so it has at most $N$ roots (pma 8.8), and by Descartes' rule of signs at most as many positive roots in $x$ as the cash flows have sign changes. A project with a large final outflow — a mine with a clean-up bill — has cash flows $-,+,\dots,+,-$ and can have two IRRs, or none at all; "accept if IRR $>r$" is then meaningless, while the NPV rule still works.
(b) **Ranking conflicts.** For mutually exclusive projects, the one with the higher IRR can have the lower NPV at the cost of capital. Their NPV curves cross at the Fisher intersection; for rates below it the IRR ranking and the NPV ranking disagree, and the NPV ranking is the one that maximises wealth.`,
      idea: String.raw`The IRR is a root of a polynomial (fin 1.7), and polynomials can have several roots or none; nothing in the economics singles one out. With a clean-up cost, a low discount rate makes the distant outflow loom large (NPV $<0$), a moderate rate shrinks it (NPV $>0$), and a high rate shrinks the inflows too (NPV $<0$): two crossings. A ranking conflict arises because IRR ignores scale and timing: a quick, small return can have a high IRR while a longer stream earns more dollars of present value whenever money is cheap. The modified IRR or, better, the NPV itself resolves both problems.`,
      caption: String.raw`Left: a mine costing $\$1{,}000$ that pays $\$600$ a year for five years and then a clean-up bill. Drag the clean-up cost: at $\$0$ there is one IRR; around $\$2{,}200$ the NPV curve rises above zero and falls back, crossing twice; at $\$2{,}600$ it never crosses. Right: project A pays $\$1{,}300$ after one year, project B pays the slider amount for five years, both for $\$1{,}000$. The red band marks discount rates at which the higher-IRR project has the lower NPV. Move the cost of capital and compare the two rules.`,
      deps: ['fin-1.7', 'pma-8.8'],
      refs: ['Luenberger: Basic Theory of Interest'],
      tags: ['capital budgeting', 'polynomials'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Internal_rate_of_return#Multiple_IRRs' },
      viz(v) {
        const M = v.M, R1 = 0.7, R2 = 0.4;
        const kS = v.slider('clean-up cost $K$', 0, 3000, 2200, { step: 50, fmt: (x) => money(x) });
        const bS = v.slider('B pays each year (5 years)', 250, 450, 350, { step: 5, fmt: (x) => money(x) });
        const rS = v.slider('cost of capital $r$', 0, 0.4, 0.1, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const FM = v.stage({ x: [-0.6, 6.6], y: [-3700, 1300], height: 140, axes: 'box', weight: 1, minWidth: 300, yticks: [], xticks: [0, 1, 2, 3, 4, 5, 6].map((t) => [t, String(t)]), title: 'the mine: cash flows by year' });
        const FC = v.stage({ x: [-0.6, 5.6], y: [-1500, 1700], height: 140, axes: 'box', weight: 1, minWidth: 300, yticks: [], xticks: [0, 1, 2, 3, 4, 5].map((t) => [t, String(t)]), title: 'projects A (blue) and B (purple)' });
        const NM = v.stage({ x: [0, R1], y: [-400, 200], height: 280, axes: 'box', weight: 1, minWidth: 300, ylabel: 'NPV ($)', xticks: pctTicks([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]), title: 'the mine: NPV(r)' });
        const NC = v.stage({ x: [0, R2], y: [-400, 800], height: 280, axes: 'box', weight: 1, minWidth: 300, ylabel: 'NPV ($)', xticks: pctTicks([0, 0.1, 0.2, 0.3, 0.4]), title: 'A versus B: NPV(r)' });
        const mine = () => [-1000, 600, 600, 600, 600, 600, -kS.value];
        const projA = () => [-1000, 1300], projB = () => [-1000, ...Array(5).fill(bS.value)];
        v.legend([['accent', 'mine NPV'], ['blue', 'project A'], ['purple', 'project B'], ['green', 'NPV > 0', { area: true }], ['red', 'IRR and NPV rankings disagree', { area: true }]]);
        let st = null;
        v.render(() => {
          const r = rS.value, cm = mine(), Fm = dated(cm), fm = (x) => npv(Fm, x);
          // mine cash flows
          FM.hline(0, { color: 'ink', width: 1 });
          cm.forEach((c, t) => { FM.rect(t - 0.3, 0, t + 0.3, c, { fill: c >= 0 ? 'blue' : 'red', fillAlpha: 0.8, stroke: false }); if (Math.abs(c) > 0) FM.text(`${c > 0 ? '+' : '−'}${Math.abs(c)}`, t, c, { dy: c >= 0 ? -9 : 9, align: 'center', color: c >= 0 ? 'blue' : 'red', size: 10.5, weight: 650 }); });
          // mine NPV
          const grid = M.linspace(0, R1, 200).map(fm);
          const [y0, y1] = around(grid, 0.1);
          NM.setView([0, R1], [Math.max(y0, -1600), Math.min(y1, 2600)]);
          NM.clip(() => NM.fn(fm, { fill: 'green', fillAlpha: 0.22, stroke: false }), [0, R1], [0, NM.bounds.y[1]]);
          NM.hline(0, { color: 'ink', width: 1 });
          NM.fn(fm, { color: 'accent', width: 2.6 });
          const all = irrs(Fm, -0.9, 6), shown = all.filter((x) => x >= 0 && x <= R1);
          shown.forEach((x, i) => { NM.dot(x, 0, { r: 5.5, hollow: true, color: 'ink', width: 2 }); NM.text(`IRR ${pct(x, 1)}`, x, 0, { dy: i % 2 ? 16 : -14, align: 'center', color: 'ink', weight: 700, size: 11.5, plate: true }); });
          NM.vline(r, { color: 'gold', width: 1.5, dash: [4, 3] });
          NM.dot(r, fm(r), { r: 5, color: 'gold' });
          NM.corner(shown.length === 2 ? 'two IRRs: which one is "the" return?' : shown.length === 0 ? 'no IRR at all — yet NPV is defined' : 'one IRR on this range', 'tr', { color: shown.length === 1 ? 'muted' : 'red', weight: 650 });
          // projects A and B
          const a = projA(), b = projB(), FA = dated(a), FB = dated(b), fA = (x) => npv(FA, x), fB = (x) => npv(FB, x);
          FC.hline(0, { color: 'ink', width: 1 });
          for (let t = 0; t <= 5; t++) {
            if (a[t] != null) FC.rect(t - 0.32, 0, t - 0.02, a[t], { fill: 'blue', fillAlpha: 0.8, stroke: false });
            if (b[t] != null) FC.rect(t + 0.02, 0, t + 0.32, b[t], { fill: 'purple', fillAlpha: 0.8, stroke: false });
          }
          FC.text('A: +1300', 1 - 0.17, 1300, { dy: -9, align: 'center', color: 'blue', size: 10.5, weight: 650 });
          FC.text(`B: +${bS.value} ×5`, 3, bS.value, { dy: -9, align: 'center', color: 'purple', size: 10.5, weight: 650 });
          const iA = irrs(FA, -0.5, 3)[0], iB = irrs(FB, -0.5, 3)[0];
          const gA = M.linspace(0, R2, 120).map(fA), gB = M.linspace(0, R2, 120).map(fB);
          NC.setView([0, R2], around(gA.concat(gB), 0.1));
          // where the rankings disagree
          const conflict = (x) => Math.sign(fA(x) - fB(x)) !== Math.sign(iA - iB) && Math.abs(fA(x) - fB(x)) > 1e-9;
          let s0 = null;
          const xs = M.linspace(0, R2, 401);
          xs.forEach((x, i) => { const c = conflict(x); if (c && s0 == null) s0 = x; if ((!c || i === xs.length - 1) && s0 != null) { NC.vband(s0, c ? x : xs[i - 1], { color: 'red', alpha: 0.1 }); s0 = null; } });
          NC.hline(0, { color: 'ink', width: 1 });
          NC.fn(fA, { color: 'blue', width: 2.5 });
          NC.fn(fB, { color: 'purple', width: 2.5 });
          const cross = irrs([[0, 0], [1, 1300 - bS.value], ...[2, 3, 4, 5].map((t) => [t, -bS.value])], -0.5, 3).filter((x) => x > 0 && x < R2);
          cross.forEach((x) => { NC.dot(x, fA(x), { r: 5, color: 'gold' }); NC.text(`Fisher rate ${pct(x, 1)}`, x, fA(x), { dx: 8, dy: -12, color: 'gold', weight: 700, size: 11.5 }); });
          [[iA, 'blue', 'A'], [iB, 'purple', 'B']].forEach(([x, col, nm]) => { if (x >= 0 && x <= R2) { NC.dot(x, 0, { r: 5, hollow: true, color: col, width: 2 }); NC.text(`IRR ${nm} ${pct(x, 1)}`, x, 0, { dy: nm === 'A' ? 15 : -14, align: 'center', color: col, weight: 700, size: 11, plate: true }); } });
          NC.vline(r, { color: 'gold', width: 1.5, dash: [4, 3] });
          NC.dot(r, fA(r), { r: 4.5, color: 'blue' }); NC.dot(r, fB(r), { r: 4.5, color: 'purple' });
          st = { r, all, shown, fmr: fm(r), iA, iB, nA: fA(r), nB: fB(r), cross, conf: conflict(r) };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, all, shown, fmr, iA, iB, nA, nB, cross, conf } = st;
          const roots = all.length ? all.map((x) => pct(x, 2)).join(' and ') : 'none';
          const mineTxt = `**Mine** — IRRs: ${roots}${all.length > shown.length ? ' (counting negative rates)' : ''}. At $r$ = ${pct(r, 1)} its NPV is ${usd(fmr)}, so the NPV rule says **${fmr > 0 ? 'accept' : 'reject'}**` + (shown.length === 2 ? `; the IRR rule cannot decide which IRR to compare with $r$ — the project is worth taking only for rates between them.` : '.');
          const ab = `**A vs B** — IRR ranks ${iA > iB ? 'A' : 'B'} first (${pct(iA, 1)} vs ${pct(iB, 1)}); at $r$ = ${pct(r, 1)} NPV gives A ${usd(nA)}, B ${usd(nB)}: ${conf ? '**the rules conflict**, and NPV is right — the extra present value is money in the owner\'s pocket' : 'the rules agree here'}` + (cross.length ? `; the curves cross at the Fisher rate ${pct(cross[0], 2)}.` : '.');
          return `${mineTxt} ${ab}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Annuities and perpetuities',
      statement: String.raw`At an interest rate $r>0$ per period, a stream paying $C$ at the end of each of the next $n$ periods (an **annuity**) has present value
$$PV_n=\sum_{t=1}^n\frac{C}{(1+r)^t}=\frac Cr\Big[1-\frac1{(1+r)^n}\Big],$$
and a **perpetuity**, paying $C$ forever, has $PV_\infty=C/r$. If the payments grow at rate $g$, starting from $C$, then
$$PV_n=\frac{C}{r-g}\Big[1-\Big(\frac{1+g}{1+r}\Big)^n\Big]\quad(g\ne r),\qquad PV_\infty=\frac{C}{r-g}\ \text{ when } g<r,$$
while for $g\ge r$ the growing perpetuity has infinite value. The future value of the level annuity at time $n$ is $C\,[(1+r)^n-1]/r$.`,
      idea: String.raw`The discounted payments $C/(1+r)^t$ form a geometric sequence with ratio $q=1/(1+r)$ (or $(1+g)/(1+r)$ with growth), so the finite geometric sum (pma 3.26) gives $PV_n$ and letting $n\to\infty$ gives the perpetuity exactly when $q<1$. There is also a one-line argument without algebra: an annuity is a perpetuity starting now minus a perpetuity starting at $n$, and the second is worth $PV_\infty$ discounted $n$ periods (fin 1.5). The gap $PV_\infty-PV_n=q^nPV_\infty$ is the value of the payments after $n$, which shrinks geometrically.`,
      caption: String.raw`Top: payments of $\$100$ (outlines, growing at $g$) and their present values (filled), shrinking geometrically. Bottom: each present value becomes a horizontal strip that starts at its payment date, so the stack above year $n$ is exactly $PV_n$ and the staircase climbs toward the dashed perpetuity value $C/(r-g)$; the purple arrow is the tail still missing. Lengthen the term, switch on the perpetuity, and push $g$ up to $r$ to watch the limit run away.`,
      deps: ['fin-1.5', 'pma-3.26'],
      refs: ['Luenberger: Basic Theory of Interest'],
      tags: ['annuities', 'geometric series'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Annuity' },
      viz(v) {
        const C = 100, NM = 80;
        const rS = v.slider('interest rate $r$', 0.01, 0.2, 0.06, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const gS = v.slider('growth of payments $g$', -0.05, 0.1, 0, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const nS = v.slider('number of payments $n$', 1, NM, 20, { int: true });
        const perp = v.toggle('perpetuity ($n\\to\\infty$)', false);
        const xt = [0, 10, 20, 30, 40, 50, 60, 70, 80].map((t) => [t, String(t)]);
        const T = v.stage({ x: [-1, NM + 1], y: [0, 120], height: 200, axes: 'box', full: true, xticks: xt, title: String.raw`payments (outlines) and their present values (filled), $\$$` });
        const P = v.stage({ x: [-1, NM + 1], y: [0, 2000], height: 280, axes: 'box', full: true, xticks: xt, xlabel: 'n (payments)', title: String.raw`present value of the first $n$ payments, stacked, $\$$` });
        v.legend([['blue', 'payment', { area: true }], ['teal', 'its present value', { area: true }], ['green', 'perpetuity $C/(r-g)$', { dash: true }], ['purple', 'tail: payments after $n$']]);
        let st = null;
        v.render(() => {
          const r = rS.value, g = gS.value, inf = perp.value, n = inf ? NM : nS.value, conv = g < r;
          nS.el.style.opacity = inf ? 0.45 : 1;
          const pay = (t) => C * Math.pow(1 + g, t - 1), pv = (t) => pay(t) / Math.pow(1 + r, t);
          const lim = conv ? C / (r - g) : Infinity;
          const cum = [0]; for (let t = 1; t <= NM; t++) cum.push(cum[t - 1] + pv(t));
          // top: payments and present values
          const top = Math.min(4.2 * C, Math.max(C, pay(Math.min(n, NM))) * 1.12);
          T.setView([-1, NM + 1], [0, top]);
          for (let t = 1; t <= NM; t++) {
            const on = t <= n, col = t % 2 ? 'teal' : 'blue';
            T.rect(t - 0.38, 0, t + 0.38, pay(t), { color: 'blue', width: 1, alpha: on ? 0.55 : 0.18, dash: on ? null : [2, 2] });
            T.rect(t - 0.38, 0, t + 0.38, pv(t), { fill: col, fillAlpha: on ? 0.85 : 0.15, stroke: false });
          }
          if (top < pay(NM)) T.corner('payments run off the top: they grow faster than the window', 'tr', { color: 'muted', size: 11 });
          // bottom: strips
          const yTop = conv ? Math.max(lim, cum[NM]) * 1.15 : cum[NM] * 1.1;
          P.setView([-1, NM + 1], [0, yTop]);
          let base = 0;
          for (let t = 1; t <= NM; t++) {
            const h = pv(t), col = t % 2 ? 'teal' : 'blue', on = t <= n;
            P.rect(t - 0.5, base, on ? n + 0.5 : NM + 0.5, base + h, { fill: col, fillAlpha: on ? 0.75 : 0.12, stroke: false });
            if (on && n < NM) P.rect(n + 0.5, base, NM + 0.5, base + h, { fill: col, fillAlpha: 0.12, stroke: false });
            base += h;
          }
          const stair = []; for (let t = 0; t <= NM; t++) stair.push([t - 0.5, cum[t]], [t + 0.5, cum[t]]);
          P.path(stair, { color: 'ink', width: 1.4, alpha: 0.7 });
          if (conv) {
            P.hline(lim, { color: 'green', width: 2, dash: [8, 5] });
            P.text(`perpetuity C/(r − g) = ${money(lim, 2)}`, 1, lim, { dy: -10, color: 'green', weight: 700, size: 12 });
          } else P.corner(`g ≥ r: each discounted payment is at least the last — the sum grows without bound`, 'tl', { color: 'red', weight: 650 });
          const pvn = inf ? lim : cum[n];
          if (!inf) {
            P.dot(n + 0.5, cum[n], { r: 5, color: 'accent' });
            P.text(`PV of ${n} = ${money(cum[n], 2)}`, n + 0.5, cum[n], { dx: n > 55 ? -8 : 8, dy: -12, align: n > 55 ? 'right' : 'left', color: 'accent', weight: 700, size: 12, plate: true });
            if (conv && P.Y(cum[n]) - P.Y(lim) > 18) P.arrow(n + 0.5, cum[n], n + 0.5, lim, { both: true, color: 'purple', width: 1.6, head: 6 });
          }
          st = { r, g, n, inf, lim, pvn, conv, cumN: cum[n] };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, g, n, inf, lim, conv, cumN } = st;
          const q = (1 + g) / (1 + r);
          if (!conv) return `With $g$ = ${pct(g, 2)} ≥ $r$ = ${pct(r, 2)} the ratio $(1+g)/(1+r)$ = ${fx(q, 4)} ≥ 1: discounted payments never shrink and the growing perpetuity has no finite value (its first ${n} payments are already worth ${usd(cumN)}).`;
          if (inf) return `Perpetuity: $PV_\\infty = C/(r-g)$ = ${usd(100, 0)}/(${pct(r, 2)} − ${pct(g, 2)}) = **${usd(lim, 2)}** — the staircase reaches it only in the limit; after 80 payments it has ${pct(st.cumN / lim, 1)} of it.`;
          const formula = g === 0 ? `$\\frac{C}{r}[1-(1+r)^{-n}]$` : `$\\frac{C}{r-g}[1-q^n]$`;
          return `$PV_{${n}}$ = ${formula} = **${usd(cumN, 2)}**, which is ${pct(cumN / lim, 1)} of the perpetuity value ${usd(lim, 2)}; the tail (payments after year ${n}) is worth $q^n\\,PV_\\infty$ = ${usd(lim - cumN, 2)} with $q=(1+g)/(1+r)$ = ${fx(q, 4)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Method',
      name: 'Loan amortization',
      statement: String.raw`A loan $L$ at interest $i$ per period is **amortized** by $n$ equal payments
$$A=\frac{L\,i}{1-(1+i)^{-n}},$$
the payment that makes the loan the present value of an $n$-period annuity (fin 1.9). Each payment first covers the interest $iB_{k-1}$ on the outstanding balance and the rest, $A-iB_{k-1}$, repays principal, so $B_k=B_{k-1}(1+i)-A$. The balance after $k$ payments equals the present value of the $n-k$ payments still due; the interest share of each payment falls and the principal share rises geometrically (by the factor $1+i$ each period), and total interest paid is $nA-L$. Paying extra principal shortens the schedule and reduces total interest.`,
      idea: String.raw`Treat the loan as an account that charges $i$ and receives payments: $B_k=B_{k-1}(1+i)-A$. Solving this linear recursion, $B_k=L(1+i)^k-A\frac{(1+i)^k-1}{i}$; setting $B_n=0$ gives the payment formula, which is the annuity formula solved for $C$. The principal parts satisfy $P_{k+1}=P_k(1+i)$, since the interest saved by last period's repayment goes to principal. An extra payment reduces the balance on which all later interest is charged, which is why it saves much more than its face value in interest.`,
      caption: String.raw`Top: the monthly payment over the life of the mortgage, split into interest (red), principal (blue) and extra principal (green); the dashed line is the interest without extra payments. Drag the gold handle to pick a month. Middle: the outstanding balance and the interest paid so far, with and without the extra payment. Bottom: the schedule summed by year. Change the loan, rate, term and extra payment and watch the total interest.`,
      deps: ['fin-1.9'],
      refs: ['Luenberger: Basic Theory of Interest'],
      tags: ['loans', 'annuities'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Amortization_calculator' },
      viz(v) {
        const M = v.M;
        const lS = v.slider('loan $L$', 50000, 2000000, 400000, { log: true, sig: 2, fmt: (x) => money(x) });
        const yS = v.slider('interest rate (annual)', 0.01, 0.12, 0.065, { step: 0.00125, fmt: (x) => pct(x, 3) });
        const tS = v.select('term', [{ value: '15', label: '15 years' }, { value: '30', label: '30 years' }], '30');
        const eS = v.slider('extra principal a month', 0, 3000, 250, { step: 25, fmt: (x) => money(x) });
        const A = v.stage({ x: [0, 360], y: [0, 3000], height: 230, axes: 'box', weight: 1.3, minWidth: 340, xlabel: 'month', title: String.raw`each month's payment, $\$$` });
        const B = v.stage({ x: [0, 360], y: [0, 400000], height: 230, axes: 'box', weight: 1, minWidth: 280, xlabel: 'month', title: String.raw`balance and interest paid so far, $\$$ thousands` });
        const TB = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: false, full: true });
        const T = v.table(TB, { rows: 10, cols: 6, square: false, maxCell: 26, cellAspect: 6, size: 12.5, colWeights: [0.7, 1, 1, 1, 1.25, 1.1], colLabels: ['year', 'paid', 'interest', 'principal + extra', 'interest share', 'balance at end'] });
        const hm = A.handle(60, 0, { color: 'gold', label: 'k', labelPos: 'ne', constrain: (x) => [Math.round(x), 0] });
        v.legend([['red', 'interest', { area: true }], ['blue', 'principal', { area: true }], ['green', 'extra principal', { area: true }], ['muted', 'without the extra payment', { dash: true }]]);
        let st = null;
        v.render(() => {
          const L = lS.value, y = yS.value, n = 12 * +tS.value, E = eS.value;
          const base = schedule(L, y, n, 0), cur = schedule(L, y, n, E), R = cur.rows, m = R.length;
          // payments
          A.setView([0, n], [0, (base.pay + E) * 1.18]);
          A.setTicks(Array.from({ length: n / 60 + 1 }, (_, k) => [60 * k, String(60 * k)]), undefined);
          const area = (f0, f1) => { const top = [], bot = []; R.forEach((q, j) => { top.push([q.k - 1, f1(q)], [q.k, f1(q)]); bot.push([q.k - 1, f0(q)], [q.k, f0(q)]); }); return top.concat(bot.reverse()); };
          A.poly(area(() => 0, (q) => q.I), { fill: 'red', fillAlpha: 0.7, stroke: false });
          A.poly(area((q) => q.I, (q) => q.I + q.P), { fill: 'blue', fillAlpha: 0.6, stroke: false });
          if (E > 0) A.poly(area((q) => q.I + q.P, (q) => q.I + q.P + q.X), { fill: 'green', fillAlpha: 0.65, stroke: false });
          if (E > 0) { A.path(base.rows.map((q) => [q.k - 0.5, q.I]), { color: 'muted', width: 1.5, dash: [5, 4] }); A.vline(m, { color: 'green', width: 1.4, dash: [4, 3] }); A.text(`paid off: month ${m}`, m, A.bounds.y[1], { dy: 10, dx: m > 0.75 * n ? -6 : 6, align: m > 0.75 * n ? 'right' : 'left', color: 'green', weight: 700, size: 11.5 }); }
          const k = M.clamp(Math.round(hm.x), 1, m); hm.x = k; hm.y = R[k - 1].I;
          A.vline(k - 0.5, { color: 'gold', width: 1.2, dash: [3, 3] });
          // balance and cumulative interest
          const cI = []; let s = 0; R.forEach((q) => { s += q.I; cI.push(s); });
          const bI = []; let s2 = 0; base.rows.forEach((q) => { s2 += q.I; bI.push(s2); });
          B.setView([0, n], [0, (Math.max(L, base.total) * 1.12) / 1000]);
          B.setTicks(Array.from({ length: n / 60 + 1 }, (_, k2) => [60 * k2, String(60 * k2)]), undefined);
          B.path([[0, L / 1000], ...base.rows.map((q) => [q.k, q.B / 1000])], { color: 'muted', width: 1.5, dash: [5, 4] });
          B.path([[0, 0], ...base.rows.map((q, j) => [q.k, bI[j] / 1000])], { color: 'red', width: 1.4, dash: [5, 4], alpha: 0.6 });
          B.path([[0, L / 1000], ...R.map((q) => [q.k, q.B / 1000])], { color: 'accent', width: 2.4 });
          B.path([[0, 0], ...R.map((q, j) => [q.k, cI[j] / 1000])], { color: 'red', width: 2.4 });
          B.text('balance', n * 0.08, L / 1000, { dy: -10, color: 'accent', weight: 700, size: 11.5 });
          B.text(`interest paid ${money(cur.total / 1000, 0)}k`, m, cI[m - 1] / 1000, { dy: -12, dx: -4, align: 'right', color: 'red', weight: 700, size: 11.5 });
          if (E > 0) B.text(`without extra ${money(base.total / 1000, 0)}k`, n, base.total / 1000, { dy: 12, dx: -4, align: 'right', color: 'muted', weight: 600, size: 11 });
          B.dot(k, R[k - 1].B / 1000, { r: 4.5, color: 'gold' });
          // yearly table
          const years = +tS.value, ky = Math.ceil(k / 12);
          const marks = years === 30 ? [1, 2, 5, 10, 15, 20, 25, 30] : [1, 2, 3, 5, 8, 10, 12, 15];
          const rowsY = [...new Set([...marks, ky])].sort((a2, b2) => a2 - b2).slice(0, 9);
          const agg = (yr) => { const qs = R.filter((q) => Math.ceil(q.k / 12) === yr); if (!qs.length) return null; const I = qs.reduce((a2, q) => a2 + q.I, 0), P = qs.reduce((a2, q) => a2 + q.P + q.X, 0); return { I, P, paid: I + P, B: qs[qs.length - 1].B }; };
          const data = rowsY.map((yr) => ({ yr, a: agg(yr) }));
          const totP = R.reduce((a2, q) => a2 + q.P + q.X, 0);
          const nr = data.length + 1;
          T.set({ rows: nr });
          T.draw({
            value: (i, j) => {
              if (i === nr - 1) return ['total', money(cur.total + totP), money(cur.total), money(totP), pct(cur.total / (cur.total + totP), 1), money(0)][j];
              const { yr, a: q } = data[i];
              if (j === 0) return String(yr);
              if (!q) return j === 1 ? 'paid off' : '—';
              return [null, money(q.paid), money(q.I), money(q.P), pct(q.I / q.paid, 1), money(q.B)][j];
            },
            fill: (i, j) => { if (i === nr - 1) return ['muted', 0.12]; const q = data[i].a; return j === 4 && q ? ['red', 0.1 + 0.5 * (q.I / q.paid)] : null; },
            weight: (i) => (i === nr - 1 ? 700 : 500),
            activeRow: data.findIndex((d) => d.yr === ky) >= 0 ? data.findIndex((d) => d.yr === ky) : undefined,
            activeColor: 'gold',
          });
          st = { L, y, n, E, base, cur, m, k, q: R[k - 1] };
        });
        v.readout(() => {
          if (!st) return '';
          const { L, y, n, E, base, cur, m, k, q } = st;
          const pay = q.I + q.P + q.X;
          return `Payment $A = Li/(1-(1+i)^{-n})$ = **${usd(base.pay, 2)}** a month ($i$ = ${pct(y / 12, 4)}, $n$ = ${n}) · month ${k}: interest ${usd(q.I, 2)} (${pct(q.I / pay, 1)} of ${usd(pay, 2)}), principal ${usd(q.P + q.X, 2)}, balance left ${usd(q.B)} · total interest ${usd(cur.total)}` + (E > 0 ? ` with ${usd(E)} extra a month: paid off after ${Math.floor(m / 12)} years ${m % 12} months instead of ${n / 12} years, saving **${usd(base.total - cur.total)}** of interest (without it: ${usd(base.total)}, $nA-L$).` : ` $= nA - L$.`);
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Model',
      name: 'The Gordon growth (dividend discount) model',
      statement: String.raw`A share is worth the present value of its future dividends. If the next dividend, one period from now, is $D_1$, dividends grow at a constant rate $g$ forever, and investors require a return $r$, then provided $g<r$
$$P_0=\sum_{t=1}^\infty\frac{D_1(1+g)^{t-1}}{(1+r)^t}=\frac{D_1}{r-g}.$$
Equivalently the expected return is the dividend yield plus growth, $r=D_1/P_0+g$. The price is extremely sensitive when $g$ is close to $r$: $\partial P_0/\partial g=D_1/(r-g)^2$, and $P_0\to\infty$ as $g\uparrow r$; for $g\ge r$ the sum diverges and the model gives no price.`,
      idea: String.raw`It is the growing perpetuity of fin 1.9: the discounted dividends form a geometric series with ratio $q=(1+g)/(1+r)$, which converges exactly when $g<r$. Because $1-q\approx r-g$ is small when $g$ is near $r$, most of the value then comes from dividends far in the future — the share has a very long "duration", and small changes in assumed long-run growth move the price a lot. Constant perpetual growth above the discount rate is impossible, which is the model's own warning against extrapolating high growth.`,
      caption: String.raw`Left: the price $D_1/(r-g)$ of a share paying $\$2$ next year, as a function of the growth rate $g$. The orange box shows how far the price moves when $g$ is off by half a percentage point either way; push $g$ toward $r$ and the box explodes, past $r$ there is no price at all. Right: the present value of dividends received by year $t$, climbing to the price; the shaded part is the value of dividends after year 30, and the marker shows when half the value has been received.`,
      deps: ['fin-1.9'],
      see: ['fin-5.6', 'fin-5.11'],
      refs: ['BKM ch. 18'],
      tags: ['equity valuation', 'present value'],
      credit: 'Williams, 1938; Gordon & Shapiro, 1956',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gordon_growth_model' },
      viz(v) {
        const M = v.M, D1 = 2, GX = [-0.03, 0.16], TM = 100;
        const rS = v.slider('required return $r$', 0.04, 0.15, 0.09, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const gS = v.slider('dividend growth $g$', -0.03, 0.15, 0.05, { step: 0.0025, fmt: (x) => pct(x, 2) });
        const L = v.stage({ x: GX, y: [0, 220], height: 320, axes: 'box', weight: 1, minWidth: 300, ylabel: 'price ($)', xticks: pctTicks([0, 0.05, 0.1, 0.15]), xlabel: 'g', title: String.raw`price $P_0=D_1/(r-g)$ with $D_1=\$2$` });
        const R = v.stage({ x: [0, TM], y: [0, 60], height: 320, axes: 'box', weight: 1, minWidth: 300, xlabel: 'year t', title: 'present value of the dividends received by year t ($)' });
        v.legend([['accent', 'price'], ['orange', 'price range for g ± 0.5 pt', { area: true }], ['red', 'g ≥ r: no finite price', { area: true }], ['green', 'value received by year t'], ['purple', 'value from after year 30', { area: true }]]);
        let st = null;
        v.render(() => {
          const r = rS.value, g = gS.value, ok = g < r - 1e-9, P = ok ? D1 / (r - g) : Infinity, YM = 220;
          // left: price against g
          L.vband(r, GX[1], { color: 'red', alpha: 0.1 });
          L.vline(r, { color: 'red', width: 1.6, dash: [6, 4] });
          L.text('g = r', r, YM, { dx: 5, dy: 12, color: 'red', weight: 700, size: 11.5 });
          if (r < GX[1] - 0.02) L.text('no finite price', (r + GX[1]) / 2, YM * 0.5, { align: 'center', color: 'red', weight: 650, size: 11.5 });
          L.clip(() => L.fn((x) => (x < r ? D1 / (r - x) : NaN), { domain: [GX[0], r - 1e-6], color: 'accent', width: 2.6, n: 400 }));
          if (ok) {
            const g0 = g - 0.005, g1 = Math.min(g + 0.005, r - 1e-6), p0 = D1 / (r - g0), p1 = g + 0.005 < r ? D1 / (r - g1) : Infinity;
            L.rect(g0, p0, g1, Math.min(p1, YM * 1.5), { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 1.2 });
            L.dot(g, Math.min(P, YM), { r: 6, color: P > YM ? 'red' : 'accent' });
            const right = g > 0.08;
            L.text(P > YM ? `P = ${money(P)} (off the chart)` : `P = ${money(P, 2)}`, g, Math.min(P, YM), { dx: right ? -10 : 10, dy: P > YM * 0.9 ? 14 : -12, align: right ? 'right' : 'left', color: 'accent', weight: 750, size: 12, plate: true });
          } else L.dot(g, YM * 0.97, { r: 6, color: 'red', hollow: true, width: 2.4 });
          // right: cumulative value of dividends
          const q = (1 + g) / (1 + r), cum = [0];
          for (let t = 1; t <= TM; t++) cum.push(cum[t - 1] + (D1 * Math.pow(1 + g, t - 1)) / Math.pow(1 + r, t));
          const top = ok ? Math.max(P, cum[TM]) * 1.15 : cum[TM] * 1.12;
          R.setView([0, TM], [0, top]);
          if (ok) {
            R.between(() => P, (t) => (t >= 30 ? cum[Math.floor(t)] + (cum[Math.min(TM, Math.floor(t) + 1)] - cum[Math.floor(t)]) * (t - Math.floor(t)) : P), 30, TM, { fill: 'purple', fillAlpha: 0.16 });
            R.hline(P, { color: 'green', width: 1.8, dash: [7, 4] });
            R.text(`price ${money(P, 2)}`, TM, P, { align: 'right', dx: -6, dy: -10, color: 'green', weight: 700, size: 11.5 });
            const half = Math.log(0.5) / Math.log(q);
            if (half <= TM) { R.vline(half, { color: 'gold', width: 1.4, dash: [3, 3] }); R.dot(half, P / 2, { r: 5, color: 'gold' }); R.text(`half the value by year ${fx(half, 1)}`, half, P / 2, { dx: half > 60 ? -8 : 8, dy: 14, align: half > 60 ? 'right' : 'left', color: 'gold', weight: 700, size: 11.5, plate: true }); }
          } else R.corner('the sum keeps growing: no finite price', 'tl', { color: 'red', weight: 700 });
          R.path(cum.map((c, t) => [t, c]), { color: 'green', width: 2.4 });
          R.vline(30, { color: 'purple', width: 1, dash: [2, 3] });
          st = { r, g, ok, P, q, after30: ok ? 1 - cum[30] / P : null };
        });
        v.readout(() => {
          if (!st) return '';
          const { r, g, ok, P, q, after30 } = st;
          if (!ok) return `$g$ = ${pct(g, 2)} ≥ $r$ = ${pct(r, 2)}: the discounted dividends grow by the factor $(1+g)/(1+r)$ = ${fx(q, 4)} ≥ 1 each year, so their sum diverges — the model assigns no finite price, and perpetual growth faster than the discount rate is not a coherent assumption.`;
          const sens = D1 / ((r - g) * (r - g)) / 100;
          return `$P_0 = D_1/(r-g)$ = ${usd(2)}/(${pct(r, 2)} − ${pct(g, 2)}) = **${usd(P, 2)}** · dividend yield $D_1/P_0$ = ${pct(D1 / P, 2)} $= r-g$ · sensitivity $\\partial P/\\partial g = D_1/(r-g)^2$ ≈ ${usd(sens, 2)} per percentage point of growth (${pct(sens / P, 1)} of the price) · ${pct(after30, 0)} of the value comes from dividends paid after year 30.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Principle',
      name: 'No arbitrage and the law of one price',
      statement: String.raw`An **arbitrage** is a trading strategy that costs nothing or less than nothing today and never requires a payment later, with a strictly positive gain in at least one case. The **law of one price**: if two portfolios deliver identical cash flows at every date and in every state, they must have the same price today; otherwise buying the cheaper and selling the dearer pockets the difference now while the future cash flows cancel exactly. In a market without arbitrage, prices are linear — a portfolio costs the sum of its parts — so every asset can be priced by **replication**: find a combination of priced assets with the same cash flows. With deterministic cash flows this means pricing every payment with the discount factors implied by zero-coupon bonds.`,
      idea: String.raw`If $P_A<P_B$ for identical cash flows, buy $A$ and sell $B$ short: you receive $P_B-P_A>0$ today, and at every later date the payment you receive from $A$ is exactly the payment you owe on $B$. No forecast, no risk, no capital — so traders would repeat it until the buying pressure on $A$ and the selling pressure on $B$ closed the gap. Present value (fin 1.5) is the special case where the replicating portfolio is made of zero-coupon bonds, whose prices are the discount factors. The same argument, run state by state, gives put–call parity, forward prices and, ultimately, the fundamental theorem of asset pricing (fin 6.1, fin 6.7).`,
      caption: String.raw`Bond A pays $\$6$, $\$6$ and $\$106$ over three years; portfolio B holds zero-coupon bonds paying the same amounts (their prices are the discount factors $0.96$, $0.92$, $0.88$). The table shows the cash flows of buying the cheaper and selling the dearer: the future flows cancel and the net row is pure profit today. Press **Trade** repeatedly: each trade pockets the gap, and the price pressure narrows it, so the profits shrink geometrically and the two prices converge to one. Change B's last payment and the cash flows no longer match — the gap is then no longer free money.`,
      deps: ['fin-1.5'],
      see: ['fin-6.1', 'fin-6.7', 'fin-5.7'],
      refs: ['Luenberger: General Principles', 'Hull ch. 5'],
      tags: ['arbitrage', 'pricing'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Law_of_one_price' },
      viz(v) {
        const D0 = [0.96, 0.92, 0.88], IMPACT = 0.15;
        let PA, d, hist, pocket, msg;
        const reset = () => { PA = aS.value; d = D0.slice(); hist = []; pocket = []; msg = ''; };
        const aS = v.slider('market price of bond A', 95, 110, 101, { step: 0.25, fmt: (x) => money(x, 2), onChange: () => reset() });
        const qS = v.slider("B's year-3 payment", 100, 112, 106, { step: 1, fmt: (x) => money(x), onChange: () => reset() });
        reset();
        const flowsB = () => [6, 6, qS.value];
        const priceB = () => flowsB().reduce((s, c, t) => s + c * d[t], 0);
        v.button('Trade: buy the cheap one, sell the dear one', () => {
          const same = qS.value === 106, PB = priceB(), gap = PB - PA;
          if (!same) { msg = 'not an arbitrage: the trade leaves an open payment at year 3'; return; }
          if (Math.abs(gap) < 0.005) { msg = 'the prices agree: nothing left to arbitrage'; return; }
          hist.push({ PA, PB }); pocket.push(Math.abs(gap));
          // buying pressure raises the cheap price, selling pressure lowers the dear one (each closes 15% of the gap)
          const shift = IMPACT * gap; PA += shift; const s = 1 - shift / PB; d = d.map((x) => x * s); msg = '';
        });
        v.button('Reset', () => reset());
        const TB = v.stage({ x: [0, 1], y: [0, 1], height: 210, axes: false, full: true, title: 'cash flows of the trade ($): + received, − paid' });
        const H = v.stage({ x: [0, 10], y: [95, 110], height: 250, axes: 'box', weight: 1.4, minWidth: 330, xlabel: 'trades', ylabel: 'price ($)', title: 'the two prices, trade by trade' });
        const K = v.stage({ x: [0, 1], y: [0, 15], height: 250, axes: 'box', weight: 1, minWidth: 220, xticks: [], title: 'profit pocketed ($)' });
        const T = v.table(TB, { rows: 3, cols: 5, square: false, maxCell: 40, cellAspect: 3.4, size: 13.5, colWeights: [2.2, 1, 1, 1, 1], colLabels: ['', 'today', 'year 1', 'year 2', 'year 3'] });
        v.legend([['blue', 'bond A'], ['purple', 'portfolio B (zero-coupon strips)'], ['green', 'riskless profit', { area: true }], ['red', 'open position', { area: true }]]);
        let st = null;
        v.render(() => {
          const fB = flowsB(), PB = priceB(), gap = PB - PA, same = qS.value === 106, buyA = gap > 0;
          const sA = buyA ? 1 : -1, fA = [6, 6, 106];
          const rowA = [-sA * PA, ...fA.map((c) => sA * c)], rowB = [sA * PB, ...fB.map((c) => -sA * c)], net = rowA.map((x, j) => x + rowB[j]);
          const f2 = (x) => (Math.abs(x) < 0.005 ? '0' : `${x > 0 ? '+' : '−'}${Math.abs(x).toFixed(2)}`);
          T.draw({
            value: (i, j) => (j === 0 ? [buyA ? 'buy bond A' : 'sell bond A', buyA ? 'sell portfolio B' : 'buy portfolio B', 'net'][i] : f2([rowA, rowB, net][i][j - 1])),
            textColor: (i, j) => { if (j === 0) return i === 0 ? 'blue' : i === 1 ? 'purple' : 'ink'; const x = [rowA, rowB, net][i][j - 1]; return Math.abs(x) < 0.005 ? 'muted' : x > 0 ? 'blue' : 'red'; },
            fill: (i, j) => (i === 2 && j > 0 ? (j === 1 ? (Math.abs(net[0]) > 0.005 && same ? ['green', 0.3] : null) : Math.abs(net[j - 1]) > 0.005 ? ['red', 0.25] : ['green', 0.1]) : null),
            weight: (i) => (i === 2 ? 700 : 500),
          });
          // price history
          const pts = hist.concat([{ PA, PB }]), N = pts.length;
          const lo = Math.min(...pts.map((p) => Math.min(p.PA, p.PB))), hi = Math.max(...pts.map((p) => Math.max(p.PA, p.PB))), pad = Math.max(0.6, 0.15 * (hi - lo));
          H.setView([-0.4, Math.max(8, N + 0.6)], [lo - pad, hi + pad]);
          for (let k = 0; k < N; k++) H.line(k, pts[k].PA, k, pts[k].PB, { color: same ? 'green' : 'red', width: 6, alpha: 0.25 });
          H.path(pts.map((p, k) => [k, p.PA]), { color: 'blue', width: 2.2 }); H.dots(pts.map((p, k) => [k, p.PA]), { r: 3.5, color: 'blue' });
          H.path(pts.map((p, k) => [k, p.PB]), { color: 'purple', width: 2.2 }); H.dots(pts.map((p, k) => [k, p.PB]), { r: 3.5, color: 'purple' });
          H.text(`A ${money(PA, 2)}`, N - 1, PA, { dx: 8, dy: buyA ? 10 : -10, color: 'blue', weight: 700, size: 11.5 });
          H.text(`B ${money(PB, 2)}`, N - 1, PB, { dx: 8, dy: buyA ? -10 : 10, color: 'purple', weight: 700, size: 11.5 });
          if (msg) H.corner(msg, 'tr', { color: 'red', weight: 650, size: 11.5 });
          // pocket
          const g0 = hist.length ? Math.abs(hist[0].PB - hist[0].PA) : Math.abs(gap), limit = g0 / (2 * IMPACT);
          K.setView([0, 1], [0, Math.max(1, limit * 1.18)]);
          let base = 0;
          pocket.forEach((p, k) => { K.rect(0.25, base, 0.75, base + p, { fill: 'green', fillAlpha: k % 2 ? 0.5 : 0.8, stroke: false }); base += p; });
          K.rect(0.25, 0, 0.75, Math.max(base, 1e-9), { color: 'green', width: 1.4 });
          if (same) { K.hline(limit, { color: 'green', width: 1.4, dash: [6, 4] }); K.text(`limit ${money(limit, 2)}`, 0.5, limit, { dy: -10, align: 'center', color: 'green', weight: 700, size: 11.5 }); }
          K.text(`${pocket.length} trade${pocket.length === 1 ? '' : 's'}: ${money(base, 2)}`, 0.5, base, { dy: -12, align: 'center', color: 'ink', weight: 700, size: 11.5, plate: true });
          st = { PA, PB, gap, same, buyA, base, n: pocket.length, last: pocket[pocket.length - 1], fair: d[2] * (qS.value - 106) };
        });
        v.readout(() => {
          if (!st) return '';
          const { PA, PB, gap, same, buyA, base, n, last, fair } = st;
          if (!same) return `B now pays ${usd(qS.value)} at year 3, not ${usd(106)}: the cash flows differ, so the law of one price says nothing directly. Of the price gap ${usd(gap, 2)}, ${usd(fair, 2)} is the present value of the extra payment, $0.88\\times(${qS.value}-106)$; buying one and selling the other leaves an open position of ${usd(106 - qS.value)} at year 3 — not an arbitrage.`;
          return `Identical cash flows, prices ${usd(PA, 2)} (A) and ${usd(PB, 2)} (B): ${Math.abs(gap) < 0.005 ? 'one price — no arbitrage left.' : `**${buyA ? 'buy A, sell B' : 'sell A, buy B'}** for ${usd(Math.abs(gap), 2)} today with every future flow cancelling.`}` + (n ? ` After ${n} trade${n > 1 ? 's' : ''} you have pocketed **${usd(base, 2)}** (last trade ${usd(last, 2)}); each trade closes 30% of the gap, so the profits form a geometric series that converges.` : ' Press Trade.');
        });
      },
    },
  ],
};
