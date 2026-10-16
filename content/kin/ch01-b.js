// Chemical Kinetics — Chapter 1: Rates and rate laws (part b: methods, opposed reactions, detailed balance)
import { clamp, DATA, solve, noiser, fitFirst, nice } from './ch01.shared.js';

export default {
  collection: 'kin',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7', kind: 'Method', name: 'Isolation and pseudo-first-order conditions',
      statement: String.raw`For $\mathrm A+\mathrm B\to\mathrm P$ with $v=k[\mathrm A][\mathrm B]$, make $[\mathrm B]_0\gg[\mathrm A]_0$. Then $[\mathrm B]$ is practically constant, $[\mathrm B]\approx[\mathrm B]_0$, and the decay of A is exponential,
$$[\mathrm A]\approx[\mathrm A]_0e^{-k't},\qquad k'=k[\mathrm B]_0,$$
a **pseudo-first-order** reaction. Measuring $k'$ at several $[\mathrm B]_0$ and plotting it against $[\mathrm B]_0$ gives the order in B and the true rate constant $k$ as the slope. Isolation applies the same way to any component of a rate law. The approximation error in $k'$ is of order $[\mathrm A]_0/(2[\mathrm B]_0)$ over the first stretch and grows if the fit runs far into the reaction or if the excess is smaller than about tenfold. The exact solution is $[\mathrm A]=[\mathrm A]_0\,\Delta/([\mathrm B]_0e^{k\Delta t}-[\mathrm A]_0)$ with $\Delta=[\mathrm B]_0-[\mathrm A]_0$.`,
      idea: String.raw`Reactant B is consumed in step with A, so $[\mathrm B]=[\mathrm B]_0-([\mathrm A]_0-[\mathrm A])$ changes by at most the fraction $[\mathrm A]_0/[\mathrm B]_0$ of its value; freezing it turns the second-order equation into the linear one of 1.5. The exact two-concentration solution shows how $\ln[\mathrm A]$ curves, slightly, as B depletes.`,
      caption: String.raw`The exact bimolecular kinetics is computed from the closed form with noisy sampling (units: $[\mathrm A]_0=1$, $k=1$). **Drag the excess** $[\mathrm B]_0/[\mathrm A]_0$: at large excess $\ln[\mathrm A]$ is straight and the fitted $k'$ matches $k[\mathrm B]_0$; below about ten it curves and $k'$ drifts. The right panel is the fitting error against the excess, noise-free, over the fit window to 90% conversion.`,
      deps: ['kin-1.5', 'kin-1.6'],
      refs: ['Houston'],
      tags: ['pseudo-first order', 'isolation'],
      credit: 'Isolation method: Ostwald, 1890s',
      scope: String.raw`Valid when one reactant is in large excess and the rate law is a power law in both; the excess must not enter the mechanism otherwise (e.g. be consumed by a side reaction).`,
      viz(v) {
        const rS = v.slider('excess $[\\mathrm B]_0/[\\mathrm A]_0$', 1, 1000, 4, { log: true });
        const nS = v.slider('noise (relative)', 0, 0.05, 0.01, { step: 0.0025 });
        let seed = 4; v.button('Resample', () => { seed++; });
        const sc = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: 'time (units of $1/k[\\mathrm A]_0$)', ylabel: 'conc. / initial', title: 'A and B', weight: 1, minWidth: 250 });
        const sl = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: 'time', ylabel: '$\\ln([\\mathrm A]/[\\mathrm A]_0)$', title: 'pseudo-first-order plot', weight: 1, minWidth: 250 });
        const se = v.stage({ x: [1, 1000], y: [-0.8, 0.05], xlog: true, height: 300, axes: 'box', gutter: true, xlabel: 'excess $[\\mathrm B]_0/[\\mathrm A]_0$', ylabel: "$k'/(k[\\mathrm B]_0)-1$", title: 'error of the pseudo-first-order constant', weight: 1, minWidth: 250 });
        // exact solution, k = 1, a0 = 1
        const Aof = (t, r) => { const rr = Math.max(r, 1.000001), d = rr - 1; return d / (rr * Math.exp(d * t) - 1); };
        const tEnd = (r) => { let lo = 0, hi = 1; while (Aof(hi, r) > 0.1) hi *= 2; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (Aof(m, r) > 0.1) lo = m; else hi = m; } return hi; };
        const fitK = (r, g, sig) => { const T = tEnd(r), ts = Array.from({ length: 15 }, (_, i) => T * i / 14), cs = ts.map((t) => Aof(t, r) * Math.exp(sig * g())); const f = fitFirst(v.M, ts, cs); return { T, ts, cs, f }; };
        let info = null;
        v.render(() => {
          const r = rS.value, g = noiser(v, seed * 13), { T, ts, cs, f } = fitK(r, g, nS.value), kp = f.k;
          sc.setView([0, T], [0, 1.08]);
          sc.fn((t) => Aof(t, r), { color: 'accent', width: 2.4, domain: [0, T] });
          sc.fn((t) => (r - 1 + Aof(t, r)) / r, { color: 'orange', width: 2.4, domain: [0, T] });
          sc.hline(1, { color: 'faint', dash: [3, 4] });
          sc.dots(ts.map((t, i) => [t, cs[i]]), { r: 4, color: 'ink' });
          sc.text('[A]/[A]₀', T * 0.5, Aof(T * 0.5, r), { color: 'accent', dx: 6, dy: -10, size: 12, weight: 600 });
          sc.text('[B]/[B]₀', T * 0.5, (r - 1 + Aof(T * 0.5, r)) / r, { color: 'orange', dx: 6, dy: -10, size: 12, weight: 600 });
          sl.setView([0, T], [Math.log(0.07), 0.15]);
          sl.line(0, 0, T, -r * T, { color: 'green', width: 2, dash: [7, 5] });
          sl.fn((t) => Math.log(Aof(t, r)), { color: 'accent', width: 2.4, domain: [0, T] });
          sl.dots(ts.map((t, i) => [t, Math.log(cs[i])]), { r: 4, color: 'ink' });
          sl.line(0, Math.log(f.c0), T, Math.log(f.c0) - kp * T, { color: 'red', width: 1.8 });
          // error curve (noise-free)
          const zero = () => 0, errAt = (rr) => { const q = fitK(rr, zero, 0); return q.f.k / rr - 1; };
          const pts = []; for (let i = 0; i <= 60; i++) { const rr = Math.pow(1000, i / 60); pts.push([rr, errAt(rr)]); }
          se.path(pts, { color: 'accent', width: 2.4 });
          se.hband(-0.05, 0.05, { color: 'green', alpha: 0.12 });
          se.hline(0, { color: 'faint' });
          se.dot(r, errAt(r), { r: 6, color: 'gold' });
          const ok5 = pts.find((q) => Math.abs(q[1]) < 0.05);
          info = { r, kp, se: f.se, err: kp / r - 1, e0: errAt(r), r5: ok5 ? ok5[0] : NaN };
        });
        v.legend([['accent', '[A]'], ['orange', '[B]'], ['green', "ideal $k'=k[\\mathrm B]_0$", { dash: true }], ['red', 'fitted line, slope $-k\'$'], ['gold', 'noise-free error at this excess', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { r, kp, se: s, err, e0, r5 } = info;
          return `$[\\mathrm B]_0/[\\mathrm A]_0=${v.fix(r, 1)}$ · fitted $k'=${v.fix(kp, 3 + (r > 30 ? 0 : 0))}\\pm${v.fix(s, 3)}$ against $k[\\mathrm B]_0=${v.fix(r, 3)}$ → recovered $k=k'/[\\mathrm B]_0=${v.fix(kp / r, 4)}$ (true 1) · error ${v.fix(100 * err, 1)}% with noise, ${v.fix(100 * e0, 1)}% without (the noise-free error is inside ±5% for excess ≳ ${v.fix(r5, 0)})`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8', kind: 'Method', name: 'Method of initial rates and log–log analysis',
      statement: String.raw`To find the orders in $v=k[\mathrm A]^m[\mathrm B]^n$, run a series of experiments that vary one initial concentration at a time and measure the **initial rate** $v_0$ from the slope of product (or reactant) against time over the first few percent of conversion, where concentrations are still their starting values. Since $\log v_0=\log k+m\log[\mathrm A]_0+n\log[\mathrm B]_0$, a plot of $\log v_0$ against $\log[\mathrm A]_0$ at fixed $[\mathrm B]_0$ is a line of slope $m$, and likewise for $n$; $k$ follows from the intercept. For two runs the order is $m=\log(v_2/v_1)/\log([\mathrm A]_2/[\mathrm A]_1)$. The slopes carry an uncertainty from the scatter of the rate measurements, and the method needs a conversion window small enough that $v$ has not yet changed.`,
      idea: String.raw`A power law becomes linear in logarithms, so the orders are slopes of straight lines, the same trick as in a Hammett or Arrhenius plot. Working at the start of the reaction removes the unknown effect of product and of changing concentrations, at the price of measuring a slope from a small, noisy signal: the order is a regression slope and has a standard error.`,
      caption: String.raw`Choose **virtual experiments** (true orders set by the sliders but hidden from the analysis; each run is simulated from the rate law, noisy product readings, initial rate from a regression over the window) or the **textbook NO + H₂ data**. Raise the noise or widen the conversion window and watch the error bars and the bias grow; step through *experiment number* to see each run's initial-rate fit.`,
      deps: ['kin-1.2'],
      refs: ['Houston'],
      tags: ['initial rates', 'log–log'],
      credit: 'Initial-rate method: van\'t Hoff, 1884',
      viz(v) {
        const sciTxt = (x) => { const e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e); return `${v.fix(m, 2)}×10${v.M.pow10Text(e).slice(2)}`; };
        const dsel = v.select('data', [{ value: 'virt', label: 'virtual experiments' }, { value: 'real', label: '2NO + 2H₂ at 1280 °C (textbook)' }], 'virt');
        const mT = v.slider('true order in A', 0, 3, 1.5, { step: 0.5 });
        const nT = v.slider('true order in B', 0, 3, 1, { step: 0.5 });
        const noise = v.slider('noise on [P] readings', 0, 0.3, 0.06, { step: 0.01 });
        const win = v.slider('conversion window', 0.02, 0.6, 0.06, { log: true });
        const ex = v.slider('experiment number', 1, 5, 3, { step: 1, int: true });
        const ser = v.select('series shown in the left panel', [{ value: 'A', label: 'vary [A]' }, { value: 'B', label: 'vary [B]' }], 'A');
        let seed = 8; v.button('Run new experiments', () => { seed++; });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: 'time (s)', ylabel: '[P] (M)', title: 'one experiment: initial slope', weight: 1, minWidth: 250 });
        const s2 = v.stage({ x: [0.005, 0.4], y: [1e-7, 1e-2], xlog: true, ylog: true, height: 300, axes: 'box', gutter: true, xlabel: '[A]₀ (M)', ylabel: 'initial rate (M/s)', title: 'vary [A]', weight: 1, minWidth: 230 });
        const s3 = v.stage({ x: [0.005, 0.4], y: [1e-7, 1e-2], xlog: true, ylog: true, height: 300, axes: 'box', gutter: true, xlabel: '[B]₀ (M)', ylabel: 'initial rate (M/s)', title: 'vary [B]', weight: 1, minWidth: 230 });
        const CS = [0.01, 0.02, 0.04, 0.08, 0.16];
        const run = (A0, B0, m, n, g, sig, f) => {
          const k = 1e-4 / Math.pow(0.05, m + n), v0 = k * Math.pow(A0, m) * Math.pow(B0, n), cmin = Math.min(A0, B0), tw = f * cmin / v0;
          const S = solve((t, y) => [k * Math.pow(Math.max(A0 - y[0], 0), m) * Math.pow(Math.max(B0 - y[0], 0), n)], [0], tw, 200);
          const ts = Array.from({ length: 9 }, (_, i) => tw * i / 8), P = ts.map((t) => S.at(t)[0] + sig * f * cmin * g());
          const fit = v.M.linreg(ts, P);
          return { A0, B0, ts, P, rate: Math.max(fit.slope, 1e-12), se: fit.seSlope, fit, tw, v0 };
        };
        let info = null;
        v.render(() => {
          const real = dsel.value === 'real';
          [mT, nT, noise, win, ser].forEach((c) => { c.el.hidden = real; });
          let RA, RB, hl = null;
          if (real) {
            const D = DATA.noh2;
            RA = [0, 1].map((i) => ({ A0: D.no[i], B0: D.h2[i], rate: D.rate[i], se: 0 }));
            RB = [1, 2].map((i) => ({ A0: D.no[i], B0: D.h2[i], rate: D.rate[i], se: 0 }));
          } else {
            const g = noiser(v, seed * 7);
            RA = CS.map((a) => run(a, 0.05, mT.value, nT.value, g, noise.value, win.value));
            RB = CS.map((b) => run(0.05, b, mT.value, nT.value, g, noise.value, win.value));
          }
          const fitSeries = (R, key) => { const xs = R.map((q) => Math.log10(q[key])), ys = R.map((q) => Math.log10(q.rate)); return v.M.linreg(xs, ys); };
          const fA = fitSeries(RA, 'A0'), fB = fitSeries(RB, 'B0');
          const plotSeries = (st, R, key, f, col) => {
            const ys = R.map((q) => q.rate), lo = Math.min(...ys) / 4, hi = Math.max(...ys) * 4;
            const xlo = Math.min(...R.map((q) => q[key])) / 1.6, xhi = Math.max(...R.map((q) => q[key])) * 1.6;
            st.setView([xlo, xhi], [lo, hi]);
            st.fn((x) => Math.pow(10, f.intercept + f.slope * Math.log10(x)), { color: col, width: 2.2, domain: [xlo, xhi] });
            R.forEach((q) => { st.dot(q[key], q.rate, { r: 5, color: 'ink' }); if (q.se > 0) st.line(q[key], Math.max(q.rate - q.se, lo * 1.01), q[key], q.rate + q.se, { color: 'ink', width: 1.4 }); });
            st.corner(`slope ${v.fix(f.slope, 2)}${R.length > 2 ? ' ± ' + v.fix(f.seSlope, 2) : ''}`, 'tl', { color: col, weight: 650, plate: true });
          };
          plotSeries(s2, RA, 'A0', fA, 'accent'); plotSeries(s3, RB, 'B0', fB, 'orange');
          // left panel
          const Rsel = ser.value === 'A' ? RA : RB, q = Rsel[clamp(ex.value - 1, 0, Rsel.length - 1)];
          if (real) {
            s1.setView([0, 1], [0, 1]); s1.setTicks([], []); s1.setLabels(null, null);
            const D = DATA.noh2;
            s1.text('textbook runs (1280 °C), initial rates:', 0.03, 0.94, { color: 'muted', size: 12 });
            [0, 1, 2].forEach((i) => { const y = 0.72 - 0.25 * i, on = i === clamp(ex.value - 1, 0, 2); if (on) s1.rect(0.01, y - 0.13, 0.99, y + 0.11, { fill: 'gold', fillAlpha: 0.15, stroke: false });
              s1.text(`run ${i + 1}:  [NO]₀ = ${D.no[i]} M,  [H₂]₀ = ${D.h2[i]} M`, 0.03, y + 0.03, { size: 12, color: 'ink' });
              s1.text(`v₀ = ${sciTxt(D.rate[i])} M/s`, 0.03, y - 0.07, { size: 12, color: 'ink', weight: 650 }); });
            s1.text('[NO] ×2 → rate ×4;  [H₂] ×2 → rate ×2', 0.03, 0.06, { size: 12, color: 'green', weight: 600 });
            hl = null;
          } else {
            s1.setTicks(null, null); s1.setLabels('time (s)', '[P] (M)');
            s1.setView([0, q.tw * 1.05], [Math.min(0, ...q.P) * 1.1, Math.max(...q.P) * 1.3]);
            s1.line(0, q.fit.intercept, q.tw * 1.05, q.fit.intercept + q.fit.slope * q.tw * 1.05, { color: 'red', width: 2 });
            s1.dots(q.ts.map((t, i) => [t, q.P[i]]), { r: 4.5, color: 'ink' });
            s1.corner(`[A]₀=${q.A0}, [B]₀=${q.B0}`, 'tl', { color: 'muted' });
            s1.corner(`window = ${v.fix(win.value * 100, 0)}% conversion`, 'br', { color: 'muted' });
            hl = q;
          }
          info = { fA, fB, real, q };
        });
        v.legend([['ink', 'measured initial rates', { dot: true }], ['accent', 'fit vs [A]'], ['orange', 'fit vs [B]']]);
        v.readout(() => {
          if (!info) return '';
          const { fA, fB, real } = info;
          const rd = (x) => Math.round(2 * x) / 2;
          return `$m=${v.fix(fA.slope, 2)}${real ? '' : '\\pm' + v.fix(fA.seSlope, 2)}$ → order in A ≈ **${rd(fA.slope)}**; $n=${v.fix(fB.slope, 2)}${real ? '' : '\\pm' + v.fix(fB.seSlope, 2)}$ → order in B ≈ **${rd(fB.slope)}** · overall order ${rd(fA.slope) + rd(fB.slope)}${real ? ' · rate $=k[\\mathrm{NO}]^2[\\mathrm H_2]$, $k=250\\ \\mathrm{M^{-2}s^{-1}}$ from run 1' : ` · true orders ${mT.value}, ${nT.value}`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9', kind: 'Proposition', name: 'Opposed reactions: relaxation to equilibrium',
      statement: String.raw`For the reversible first-order reaction $\mathrm A\underset{k_b}{\overset{k_f}{\rightleftharpoons}}\mathrm B$ with $[\mathrm A]+[\mathrm B]=c$ fixed, $d[\mathrm A]/dt=-k_f[\mathrm A]+k_b[\mathrm B]$ has the solution
$$[\mathrm A]-[\mathrm A]_{\rm eq}=\big([\mathrm A]_0-[\mathrm A]_{\rm eq}\big)e^{-(k_f+k_b)t},\qquad [\mathrm A]_{\rm eq}=\frac{k_b}{k_f+k_b}\,c .$$
The deviation from equilibrium decays exponentially with the **relaxation rate** $1/\tau=k_f+k_b$ (not $k_f$), from whichever side the reaction starts, and the final ratio is $[\mathrm B]_{\rm eq}/[\mathrm A]_{\rm eq}=k_f/k_b=K$. The equilibrium constant therefore equals the ratio of the rate constants (a kinetic derivation of the law of mass action, pchem-7.4), while their sum sets the speed.`,
      idea: String.raw`With the conservation law the system is one-dimensional and linear: $x=[\mathrm A]-[\mathrm A]_{\rm eq}$ obeys $x'=-(k_f+k_b)x$, the equation of 1.5 for the deviation. Equilibrium is where the forward and backward rates are equal, $k_f[\mathrm A]=k_b[\mathrm B]$, which gives $K=k_f/k_b$ as in the law of mass action.`,
      caption: String.raw`**Drag the starting point** on the vertical axis and change $k_f$ and $k_b$ (log sliders). Left: $[\mathrm A]$ from your start and from the two pure starts, all relaxing to the same equilibrium. Right: $\ln|[\mathrm A]-[\mathrm A]_{\rm eq}|$ is a family of parallel lines of slope $-(k_f+k_b)$ (green), clearly steeper than the slope $-k_f$ that a naive first-order reading suggests (red dotted). The ODE is integrated numerically and the slopes are fitted.`,
      deps: ['kin-1.5', 'pchem-7.4'],
      refs: ['Houston', 'Steinfeld et al.'],
      tags: ['reversible reaction', 'relaxation', 'equilibrium'],
      credit: 'Kinetic derivation of K = k_f/k_b: Guldberg & Waage, 1864; van\'t Hoff, 1877',
      viz(v) {
        const kf = v.slider('$k_f$', 0.02, 5, 0.6, { log: true });
        const kb = v.slider('$k_b$', 0.02, 5, 0.2, { log: true });
        const sc = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 'time (arb. units)', ylabel: 'fraction of total', title: 'approach to equilibrium', weight: 1.1 });
        const sl = v.stage({ x: [0, 1], y: [-9, 0.3], height: 320, axes: 'box', gutter: true, xlabel: 'time', ylabel: '$\\ln|[\\mathrm A]-[\\mathrm A]_{\\rm eq}|$', title: 'distance from equilibrium', weight: 1, minWidth: 260 });
        const h = sc.handle(0, 0.9, { color: 'gold', label: 'start', labelPos: 'ne', constrain: { x: [0, 0], y: [0.02, 0.98] } });
        let info = null;
        v.render(() => {
          const f = kf.value, b = kb.value, T = 7 / (f + b);
          const traj = (a0) => solve((t, y) => [-f * y[0] + b * (1 - y[0])], [a0], T, 600);
          const S = [traj(h.y), traj(1), traj(0)], cols = ['gold', 'accent', 'orange'];
          const Aeq = solve((t, y) => [-f * y[0] + b * (1 - y[0])], [h.y], 10 * T, 200).at(10 * T)[0];
          sc.setView([0, T], [0, 1.02]);
          sc.hline(b / (f + b), { color: 'green', dash: [6, 4], width: 1.6 });
          sc.text('equilibrium', T * 0.98, b / (f + b), { align: 'right', dy: -8, color: 'green', size: 11 });
          [1, 2, 0].forEach((j) => { sc.path(S[j].y.map((y, i) => [T * i / S[j].n, y[0]]), { color: cols[j], width: j === 0 ? 2.8 : 2, alpha: j === 0 ? 1 : 0.75 });
            sc.path(S[j].y.map((y, i) => [T * i / S[j].n, 1 - y[0]]), { color: cols[j], width: 1.2, dash: [4, 4], alpha: 0.6 }); });
          sc.text('[A] solid, [B] dashed', T * 0.98, 0.02, { align: 'right', size: 11, color: 'muted', baseline: 'bottom' });
          const fits = S.map((s) => {
            const xs = [], ys = [];
            for (let i = 0; i <= s.n; i += 6) { const d = Math.abs(s.y[i][0] - Aeq); if (d > 2e-4) { xs.push(T * i / s.n); ys.push(Math.log(d)); } }
            return xs.length > 4 ? v.M.linreg(xs, ys) : null;
          });
          sl.setView([0, T], [-9, 0.3]);
          S.forEach((s, j) => { const pts = []; for (let i = 0; i <= s.n; i += 4) { const d = Math.abs(s.y[i][0] - Aeq); if (d > 1e-4) pts.push([T * i / s.n, Math.log(d)]); } sl.path(pts, { color: cols[j], width: j === 0 ? 2.8 : 2 });
            if (fits[j] && j === 1) sl.line(0, fits[j].intercept, T, fits[j].intercept - (f + b) * T, { color: 'green', width: 1.4, dash: [7, 5] }); });
          const x0 = Math.log(Math.abs(h.y - Aeq) + 1e-12);
          sl.line(0, x0, T, x0 - f * T, { color: 'red', width: 2, dash: [2, 4] });
          sl.text('slope $-k_f$', T * 0.3, x0 - f * T * 0.3, { color: 'red', size: 11.5, dx: 8, dy: -10 });
          const Tl = Aeq;
          info = { slope: fits[1] ? -fits[1].slope : NaN, f, b, Aeq, K: (1 - Tl) / Tl, tau: 1 / (f + b) };
        });
        v.legend([['gold', 'your start'], ['accent', 'pure A start'], ['orange', 'pure B start'], ['green', 'equilibrium / slope $-(k_f+k_b)$']]);
        v.readout(() => {
          if (!info) return '';
          const { slope, f, b, Aeq, K } = info;
          return `fitted relaxation rate **${v.fix(slope, 4)}** against $k_f+k_b=${v.fix(f + b, 4)}$ (not $k_f=${v.fix(f, 3)}$) · final ratio $[\\mathrm B]/[\\mathrm A]=${v.fix(K, 4)}$ from the run, $k_f/k_b=${v.fix(f / b, 4)}$ · $[\\mathrm A]_{\\rm eq}=${v.fix(Aeq, 4)}$ whichever side you start from`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10', kind: 'Method', name: 'Relaxation methods: temperature jump',
      statement: String.raw`In a **temperature-jump** experiment an equilibrium mixture is heated by a few kelvin in a microsecond or less (Joule heating by a capacitor discharge, or a laser pulse). The equilibrium constant changes to its value $K(T_1)$ while the composition has not yet moved, and the system relaxes to the new equilibrium. For a small jump the approach is a single exponential $y(t)-y_\infty\propto e^{-t/\tau}$ whose relaxation time is set by the *sum* of rate constants at the new temperature: $1/\tau=k_f+k_b$ for $\mathrm A\rightleftharpoons\mathrm B$, or $1/\tau=k_d+k_r([\mathrm H^+]+[\mathrm{OH}^-])$ for $\mathrm{H_2O}\rightleftharpoons\mathrm H^++\mathrm{OH}^-$. The plateau $y_\infty$ gives $K$, so measuring $\tau$ and $K$ yields both rate constants, even for reactions complete within microseconds. For large jumps the relaxation is not a pure exponential.`,
      idea: String.raw`Linearising the rate equations about the new equilibrium (1.9) leaves $x'=-x/\tau$ for the small deviation $x$, with $1/\tau$ the sum of rate constants weighted by the concentrations. Because the measurement perturbs equilibrium rather than mixing reagents, its time resolution is that of the heating pulse (µs to ns), far faster than the diffusion-limited mixing that bounds ordinary methods (1.11); this is how Eigen measured proton transfer.`,
      caption: String.raw`Choose the **illustrative A ⇌ B** reaction or the **autoprotolysis of water** (rate constant after Eigen & De Maeyer, 1955, see Scope). Set the jump size and the noise: the fit of a single exponential gives $\tau$ and the plateau, from which both rate constants are recovered and compared with the true values at the new temperature. Increase the jump for water: the nonlinear $c^2$ term makes the extracted $k_r$ drift.`,
      deps: ['kin-1.9'],
      refs: ['Steinfeld et al.'],
      tags: ['temperature jump', 'relaxation', 'fast reactions'],
      credit: 'Manfred Eigen (with De Maeyer), 1954–55; Nobel Prize in Chemistry 1967 (shared with Norrish and Porter)',
      scope: String.raw`Single-exponential analysis holds for small perturbations; the water numbers are $k_r=1.4\times10^{11}\,\mathrm{M^{-1}s^{-1}}$ (quoted from memory, textbooks give 1.3–1.4$\times10^{11}$), $K_w=10^{-14}$ at 25 °C and $\Delta H=55.8$ kJ/mol, $\tau\approx36\ \mu$s; the A ⇌ B rate constants are illustrative.`,
      viz(v) {
        const sys = v.select('system', [{ value: 'ab', label: 'A ⇌ B (illustrative)' }, { value: 'w', label: 'H₂O ⇌ H⁺ + OH⁻' }], 'w');
        const dT = v.slider('temperature jump $\\Delta T$ (K)', 0.5, 40, 5, { log: true });
        const nz = v.slider('noise (fraction of signal change)', 0, 0.15, 0.03, { step: 0.005 });
        let seed = 21; v.button('Resample', () => { seed++; });
        const s1 = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 'time', ylabel: 'signal', title: 'relaxation after the jump', weight: 1.15 });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', gutter: true, xlabel: 'time', ylabel: '$\\ln|y-y_\\infty|$', title: 'linearisation', weight: 1, minWidth: 250 });
        const Rg = 8.314462618, T0 = 298.15;
        const model = (w, T) => {
          if (!w) { // A <-> B: kf = 1e3, kb = 4e3 per s at 298 K, Ef = 60, Eb = 20 kJ/mol
            const kf = 1e3 * Math.exp(-60e3 / Rg * (1 / T - 1 / T0)), kb = 4e3 * Math.exp(-20e3 / Rg * (1 / T - 1 / T0));
            return { kf, kb, K: kf / kb, tscale: 1e-3, unit: 'ms', eq: kf / (kf + kb), tauLin: 1 / (kf + kb) };
          }
          const Kw = 1e-14 * Math.exp(-55.8e3 / Rg * (1 / T - 1 / T0)), kr = 1.4e11, c = Math.sqrt(Kw);
          return { kr, Kw, c, tscale: 1e-6, unit: 'µs', eq: c / 1e-7, tauLin: 1 / (2 * kr * c) };
        };
        let info = null;
        v.render(() => {
          const w = sys.value === 'w', M0 = model(w, T0), M1 = model(w, T0 + dT.value);
          const T = 6 * M1.tauLin; // seconds
          let y0 = M0.eq, F;
          if (!w) F = (t, y) => [M1.kf * (1 - y[0]) - M1.kb * y[0]]; else F = (t, y) => [M1.kr * (M1.Kw - (y[0] * 1e-7) ** 2) / 1e-7];
          const S = solve(F, [y0], T, 600), yinf = M1.eq, amp = Math.abs(yinf - y0) || 1e-9;
          const g = noiser(v, seed * 5), n = 40, ts = Array.from({ length: n }, (_, i) => T * (i + 0.5) / n), ys = ts.map((t) => S.at(t)[0] + nz.value * amp * g());
          // fit y = yinf + A exp(-t/tau) by Nelder-Mead on (yinf, A, ln tau)
          const sse = (p) => ts.reduce((a, t, i) => a + (ys[i] - (p[0] + p[1] * Math.exp(-t / Math.exp(p[2])))) ** 2, 0);
          const last = ys.slice(-5).reduce((a, b) => a + b, 0) / 5;
          const fit = v.M.nelderMead(sse, [last, ys[0] - last, Math.log(T / 6)], { step: [amp * 0.1, amp * 0.3, 0.4], tol: 1e-14, maxIt: 2000 });
          const [yi, A, lt] = fit.x, tau = Math.exp(lt), tu = M1.tscale;
          s1.setView([0, T / tu], [Math.min(y0, yinf) - amp * 0.35, Math.max(y0, yinf) + amp * 0.35]);
          s1.setLabels(`time (${M1.unit})`, w ? 'conductivity ∝ [H⁺]/10⁻⁷ M' : 'fraction B');
          s1.hline(y0, { color: 'muted', dash: [5, 4], width: 1.4 }); s1.hline(yinf, { color: 'green', dash: [5, 4], width: 1.4 });
          s1.text('equilibrium at T₀', T / tu * 0.98, y0, { align: 'right', dy: y0 < yinf ? 14 : -8, size: 11, color: 'muted' });
          s1.text('new equilibrium at T₁', T / tu * 0.02, yinf, { align: 'left', dx: 8, dy: y0 < yinf ? -8 : 14, size: 11, color: 'green' });
          s1.fn((t) => yi + A * Math.exp(-t * tu / tau), { color: 'red', width: 2.2, domain: [0, T / tu] });
          s1.dots(ts.map((t, i) => [t / tu, ys[i]]), { r: 3.6, color: 'ink' });
          s1.vline(0, { color: 'gold', width: 2.5 });
          // linearisation
          const L = ts.map((t, i) => [t / tu, Math.abs(ys[i] - yi)]).filter((p) => p[1] > 2.5 * nz.value * amp && p[1] > 1e-9);
          s2.setView([0, T / tu], [Math.log(Math.max(nz.value * amp, amp * 1e-3)) - 0.5, Math.log(amp) + 0.5]);
          s2.setLabels(`time (${M1.unit})`, undefined);
          s2.dots(L.map((p) => [p[0], Math.log(p[1])]), { r: 3.8, color: 'ink' });
          s2.line(0, Math.log(Math.abs(A)), T / tu, Math.log(Math.abs(A)) - T / tau, { color: 'red', width: 2 });
          s2.line(0, Math.log(Math.abs(A)), T / tu, Math.log(Math.abs(A)) - T / M1.tauLin, { color: 'green', width: 1.4, dash: [6, 4] });
          // extracted constants
          let ext;
          if (!w) { const K = yi / (1 - yi); ext = { a: `$k_f=${nice(v, K / (1 + K) / tau, 3)}$, $k_b=${nice(v, 1 / (1 + K) / tau, 3)}\\ \\mathrm{s^{-1}}$ (true ${nice(v, M1.kf, 3)}, ${nice(v, M1.kb, 3)})` }; }
          else { const cinf = yi * 1e-7; ext = { a: `$k_r=1/(2c_\\infty\\tau)=${v.sci(1 / (2 * cinf * tau), 3)}\\ \\mathrm{M^{-1}s^{-1}}$ (true $${v.sci(M1.kr, 3)}$)` }; }
          info = { tau, tauLin: M1.tauLin, tu, unit: M1.unit, K1: w ? M1.Kw : M1.K, ext, w, T1: T0 + dT.value };
        });
        v.legend([['red', 'fitted single exponential'], ['green', 'linearised rate $1/\\tau$ (dashed in right panel)'], ['gold', 'jump at $t=0$'], ['muted', 'old equilibrium', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { tau, tauLin, tu, unit, ext, w, K1, T1 } = info;
          return `$T_0=298.15\\to${v.fix(T1, 2)}$ K · fitted $\\tau=${v.fix(tau / tu, 3)}$ ${unit}, linearised prediction $${v.fix(tauLin / tu, 3)}$ ${unit} · ${ext.a}\n${w ? '$K_w(T_1)=' + v.sci(K1, 3) + '$' : '$K(T_1)=k_f/k_b=' + v.fix(K1, 3) + '$'} from the new plateau`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11', kind: 'Method', name: 'Flash photolysis and stopped flow',
      statement: String.raw`A kinetic experiment can follow a reaction only after it has been started and before it is over. In **hand mixing** the reagents are combined by hand and sampled (dead time of seconds); in **stopped flow** (Chance, 1940; Gibson) two solutions are driven together into a mixing chamber and flow is abruptly stopped, so the reaction can be followed from about a millisecond; in **flash photolysis** (Norrish and Porter, 1949) an intense light or laser pulse creates the reactive species in place within a pulse of microseconds to nanoseconds, and pump–probe versions reach femtoseconds. Each technique has a **dead time** $t_d$, hiding the first part of the trace, and an observation window ending at $t_{\max}$. A first-order rate constant $k$ can be measured only if a substantial part of the decay lies inside the window, roughly $1/t_{\max}\lesssim k\lesssim 2/t_d$.`,
      idea: String.raw`The rate constant sets the time scale $1/k$ of the signal $e^{-kt}$; a method is blind to a process that is over before it begins to record ($k\,t_d\gg1$) or has hardly started before the record ends ($k\,t_{\max}\ll1$). Reaching faster reactions therefore means shortening the time it takes to start the reaction — by replacing mixing, which is limited by diffusion and fluid flow, with a light pulse or a perturbation (1.10).`,
      caption: String.raw`Slide the rate constant $k$ over seventeen decades and choose an instrument. The pale curve is the true signal on a logarithmic time axis; grey marks the dead time and window end, the dots are the noisy data the instrument can see, and the red line is a first-order fit to them only. The lower panel shows which range of $k$ each method can measure; when the true decay is hidden the fit fails, and the readout says so. Dead times and windows are typical round numbers (illustrative).`,
      deps: ['kin-1.1'],
      refs: ['Steinfeld et al.'],
      tags: ['stopped flow', 'flash photolysis', 'dead time'],
      credit: 'Chance (stopped flow), 1940; Norrish & Porter (flash photolysis), 1949; Nobel Prize in Chemistry 1967',
      scope: String.raw`Dead times and windows are typical, not instrument specifications; the criterion for "measurable" is that at least 15% of the amplitude decays inside the window.`,
      viz(v) {
        const METH = {
          hand: { name: 'hand mixing', td: 10, te: 1e4, col: 'purple' },
          sf: { name: 'stopped flow', td: 1e-3, te: 1e2, col: 'orange' },
          fl: { name: 'nanosecond flash photolysis', td: 1e-8, te: 1, col: 'accent' },
          fs: { name: 'femtosecond pump–probe', td: 1e-13, te: 1e-9, col: 'green' },
        };
        const mSel = v.select('method', Object.keys(METH).map((k) => ({ value: k, label: METH[k].name })), 'sf');
        const kS = v.slider('rate constant $k$ (s⁻¹)', 1e-5, 1e12, 300, { log: true });
        const nS = v.slider('noise', 0.005, 0.1, 0.02, { step: 0.005 });
        let seed = 31; v.button('Resample', () => { seed++; });
        const s1 = v.stage({ x: [1e-14, 1e5], y: [-0.1, 1.15], xlog: true, height: 320, axes: 'box', gutter: true, xlabel: 'time since the reaction was started (s)', ylabel: 'signal', title: 'a first-order decay on a logarithmic time axis', weight: 1.3 });
        const s2 = v.stage({ x: [-6, 14], y: [0, 4.4], height: 250, axes: 'box', gutter: true, xlabel: '$\\log_{10}(k/\\mathrm{s^{-1}})$', ylabel: '', yticks: [], title: 'measurable range of $k$ by method', full: true });
        let info = null;
        const vis = (m, k) => Math.exp(-k * m.td) - Math.exp(-k * m.te);
        v.render(() => {
          const m = METH[mSel.value], k = kS.value;
          s1.setView([1e-14, 1e5], [-0.1, 1.15]);
          s1.rect(1e-14, -0.1, m.td, 1.15, { fill: 'muted', fillAlpha: 0.22, stroke: false });
          s1.rect(m.te, -0.1, 1e5, 1.15, { fill: 'muted', fillAlpha: 0.22, stroke: false });
          s1.text('dead time', Math.sqrt(1e-14 * m.td) * (m.td < 1e-9 ? 1 : 1), 1.08, { color: 'muted', size: 11, align: 'center' });
          s1.text('record ended', Math.sqrt(m.te * 1e5), 1.08, { color: 'muted', size: 11, align: 'center' });
          s1.fn((t) => Math.exp(-k * t), { color: 'ink', alpha: 0.3, width: 2.6, n: 400 });
          const g = noiser(v, seed * 3), n = 40, ts = Array.from({ length: n }, (_, i) => m.td * Math.pow(m.te / m.td, (i + 0.5) / n)), ys = ts.map((t) => Math.exp(-k * t) + nS.value * g());
          s1.dots(ts.map((t, i) => [t, ys[i]]), { r: 3.8, color: m.col });
          // fit A exp(-k t) on visible points; parameters (ln A, ln k)
          const sse = (p) => ts.reduce((a, t, i) => a + (ys[i] - Math.exp(p[0] - Math.exp(p[1]) * t)) ** 2, 0);
          let best = null;
          for (const lk of [Math.log(1 / m.td), Math.log(1 / Math.sqrt(m.td * m.te)), Math.log(1 / m.te)]) { const r = v.M.nelderMead(sse, [0, lk], { step: [0.3, 1.2], tol: 1e-12, maxIt: 1500 }); if (!best || r.fx < best.fx) best = r; }
          const kf = Math.exp(best.x[1]), A = Math.exp(best.x[0]), ok = Math.abs(kf / k - 1) < 0.25 && vis(m, k) > 0.15;
          if (isFinite(kf) && kf > 0) s1.fn((t) => A * Math.exp(-kf * t), { color: ok ? 'red' : 'faint', width: 2, dash: ok ? false : [5, 4], n: 400, domain: [m.td, m.te] });
          s1.vline(1 / k, { color: 'gold', dash: [4, 4], width: 1.4 });
          s1.text('$1/k$', 1 / k, 0.62, { color: 'gold', size: 12, dx: 6, plate: true });
          // coverage panel
          const keys = Object.keys(METH);
          keys.forEach((key, i) => {
            const mm = METH[key], y0 = 0.5 + 1.0 * (3 - i), lo = Math.log10(0.16 / mm.te), hi = Math.log10(1.9 / mm.td);
            s2.rect(lo, y0, hi, y0 + 0.7, { fill: mm.col, fillAlpha: key === mSel.value ? 0.6 : 0.28, color: mm.col, width: key === mSel.value ? 2 : 1 });
            s2.text(mm.name, (lo + hi) / 2, y0 + 0.35, { align: 'center', baseline: 'middle', size: 11.5, color: 'ink', weight: 600 });
          });
          s2.vline(Math.log10(k), { color: 'gold', width: 2.4 });
          info = { m, k, kf, ok, lost: 1 - Math.exp(-k * m.td), seen: vis(m, k) };
        });
        v.legend([['ink', 'true signal'], ['red', 'first-order fit to the visible data'], ['gold', '$1/k$ and current $k$']]);
        v.readout(() => {
          if (!info) return '';
          const { m, k, kf, ok, lost, seen } = info;
          return `${m.name}: dead time $${v.sci(m.td, 1)}$ s, record to $${v.sci(m.te, 1)}$ s · true $k=${v.sci(k, 3)}\\ \\mathrm{s^{-1}}$ · decay hidden in the dead time: **${v.fix(100 * lost, 1)}%**, decay visible: ${v.fix(100 * seen, 1)}%\nfit to visible data: $k=${v.sci(kf, 3)}$ → ${ok ? '**resolved**' : '**not measurable with this method** (hidden or barely started)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12', kind: 'Principle', name: 'Detailed balance (microscopic reversibility)',
      statement: String.raw`At thermodynamic equilibrium every elementary process is balanced by its reverse: for each pair of states, $k_{ij}\,p_i^{\rm eq}=k_{ji}\,p_j^{\rm eq}$, so the net flux through each individual step vanishes (not only the sum into each state). For rate constants $k_{ij}$ among the species of a reaction network this requires, for every closed cycle, the **Wegscheider condition**
$$\prod_{\text{around the cycle}}k_{i\to j}=\prod_{\text{around the cycle}}k_{j\to i},$$
equivalently that $\ln(K)$ is path-independent: the equilibrium constants multiply consistently around a loop. If the product ratio $\Gamma\ne1$, the steady state carries a non-zero circulating current $J$, dissipating free energy at rate $\propto J\ln\Gamma$; this can persist only in an open system driven from outside (a fuel), never in an isolated one at equilibrium.`,
      idea: String.raw`Detailed balance is the kinetic expression of time-reversal symmetry of the microscopic dynamics (Tolman, Onsager): at equilibrium forward and backward traffic in each channel are equal. Combined with a Boltzmann population $p_i\propto e^{-G_i/RT}$, it forces $k_{ij}/k_{ji}=e^{-(G_j-G_i)/RT}$, a ratio of a state function, and so the product around any loop is $e^{0}=1$. Rate constants chosen freely have no such guarantee.`,
      caption: String.raw`A cycle $\mathrm A\to\mathrm B\to\mathrm C\to\mathrm A$ with all reverse steps. In **free rate constants** mode drag the six sliders (log scale): the steady state is solved exactly, and when $\Gamma\ne1$ the dots circulate and the red gap in the free-energy ladder (right) opens. In **energy landscape** mode the constants come from well energies and barriers, so detailed balance holds identically and nothing circulates.`,
      deps: ['kin-1.9', 'pchem-7.4'],
      refs: ['Steinfeld et al.'],
      tags: ['detailed balance', 'microscopic reversibility'],
      credit: 'Wegscheider, 1901; Tolman, 1925; Onsager, 1931',
      scope: String.raw`Holds at equilibrium of a closed system with time-reversal-symmetric dynamics (no magnetic field, or with it reversed); driven open systems may violate it.`,
      viz(v) {
        const mode = v.select('rate constants', [{ value: 'free', label: 'free rate constants' }, { value: 'en', label: 'from an energy landscape' }], 'free');
        const names = ['kAB', 'kBA', 'kBC', 'kCB', 'kCA', 'kAC'];
        const labs = ['$k_{AB}$', '$k_{BA}$', '$k_{BC}$', '$k_{CB}$', '$k_{CA}$', '$k_{AC}$'];
        const def = [4, 1, 4, 1, 4, 1];
        const kS = names.map((n, i) => v.slider(labs[i], 0.1, 10, def[i], { log: true }));
        const eS = ['A', 'B', 'C'].map((n, i) => v.slider(`well energy $G_${n}$ (kJ/mol)`, -10, 10, [0, 3, -2][i], { step: 0.5 }));
        const bS = ['AB', 'BC', 'CA'].map((n, i) => v.slider(`barrier top $G^\\ddagger_{${n}}$ (kJ/mol)`, 8, 25, [14, 17, 12][i], { step: 0.5 }));
        const RT = 2.4790; // kJ/mol at 298.15 K
        const st = v.stage({ x: [-1.5, 1.5], y: [-1.15, 1.45], equal: true, axes: false, height: 340, title: 'steady-state fluxes of the reaction triangle', weight: 1.1 });
        const sg = v.stage({ x: [-0.3, 3.3], y: [-1, 1], height: 340, axes: 'box', gutter: true, xticks: [[0, 'A'], [1, 'B'], [2, 'C'], [3, 'A']], ylabel: '$G$ built up along the cycle (kJ/mol)', title: 'free-energy ladder around the cycle', weight: 1, minWidth: 260 });
        const P = [[0, 1.0], [-0.95, -0.55], [0.95, -0.55]];
        let info = null;
        v.render(() => {
          const en = mode.value === 'en';
          kS.forEach((c) => { c.el.hidden = en; }); eS.forEach((c) => { c.el.hidden = !en; }); bS.forEach((c) => { c.el.hidden = !en; });
          let k;
          if (en) {
            const G = eS.map((c) => c.value), B = bS.map((c) => c.value), kk = (Gb, Gi) => Math.exp(-(Gb - Gi) / RT);
            // barriers are absolute tops, measured from the same zero as the wells
            k = [kk(B[0], G[0]), kk(B[0], G[1]), kk(B[1], G[1]), kk(B[1], G[2]), kk(B[2], G[2]), kk(B[2], G[0])];
            k = k.map((x) => x * 1);
          } else k = kS.map((c) => c.value);
          const [kAB, kBA, kBC, kCB, kCA, kAC] = k;
          // generator: dp/dt = Q p with Q[j][i] = rate i->j
          const Q = [[-(kAB + kAC), kBA, kCA], [kAB, -(kBA + kBC), kCB], [kAC, kBC, -(kCA + kCB)]];
          const Mx = [Q[0], Q[1], [1, 1, 1]], p = v.M.solve(Mx, [0, 0, 1]);
          const Jab = kAB * p[0] - kBA * p[1], Jbc = kBC * p[1] - kCB * p[2], Jca = kCA * p[2] - kAC * p[0];
          let J = (Jab + Jbc + Jca) / 3; const Gam = (kAB * kBC * kCA) / (kBA * kCB * kAC);
          if (Math.abs(J) < 1e-9 * Math.max(kAB * p[0], 1e-12)) J = 0;
          const fl = [[kAB * p[0], kBA * p[1]], [kBC * p[1], kCB * p[2]], [kCA * p[2], kAC * p[0]]];
          const fmax = Math.max(...fl.flat());
          // draw edges: forward arrow offset to one side, reverse to the other
          [[0, 1], [1, 2], [2, 0]].forEach(([i, j], e) => {
            const a = P[i], b = P[j], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, o = 0.07;
            const sh = 0.2 / L; // shorten by node radius
            const A1 = [a[0] + dx * sh + nx * o, a[1] + dy * sh + ny * o], B1 = [b[0] - dx * sh + nx * o, b[1] - dy * sh + ny * o];
            const A2 = [b[0] - dx * sh - nx * o, b[1] - dy * sh - ny * o], B2 = [a[0] + dx * sh - nx * o, a[1] + dy * sh - ny * o];
            st.arrow(A1[0], A1[1], B1[0], B1[1], { color: 'accent', width: 1 + 7 * fl[e][0] / fmax, head: 9 });
            st.arrow(A2[0], A2[1], B2[0], B2[1], { color: 'orange', width: 1 + 7 * fl[e][1] / fmax, head: 9 });
          });
          // circulating dots: speed proportional to the net cycle flux
          const per = 3, u0 = (v.t || 0) * 0.8 * Math.sign(J) * Math.tanh(6 * Math.abs(J) / fmax);
          for (let q = 0; q < 12; q++) {
            const u = (((u0 + q * per / 12) % per) + per) % per, e = Math.floor(u), f = u - e, a = P[e], b = P[(e + 1) % 3];
            if (Math.abs(J) > 1e-3 * fmax) st.dot(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, { r: 3.5, color: 'gold' });
          }
          ['A', 'B', 'C'].forEach((nm, i) => { st.dot(P[i][0], P[i][1], { r: 14 + 34 * p[i], color: 'teal' }); st.text(nm, P[i][0], P[i][1], { size: 15, color: 'ink', weight: 700, align: 'center', baseline: 'middle' }); });
          st.corner(Math.abs(J) < 1e-3 * fmax ? 'no net circulation' : `net cycle flux J = ${nice(v, J, 3)}`, 'bl', { color: Math.abs(J) < 1e-3 * fmax ? 'green' : 'red', weight: 650, plate: true });
          // ladder
          const d1 = -RT * Math.log(kAB / kBA), d2 = -RT * Math.log(kBC / kCB), d3 = -RT * Math.log(kCA / kAC);
          const lv = [0, d1, d1 + d2, d1 + d2 + d3], gap = lv[3];
          const ext = Math.max(...lv.map(Math.abs), 2) * 1.35;
          sg.setView([-0.3, 3.3], [-ext, ext]);
          sg.hline(0, { color: 'faint', dash: [3, 4] });
          for (let i = 0; i < 3; i++) { sg.curve((t) => [i + t, lv[i] + (lv[i + 1] - lv[i]) * (0.5 - 0.5 * Math.cos(Math.PI * t))], 0, 1, { color: 'accent', width: 2.2, n: 40 }); }
          lv.forEach((y, i) => sg.dot(i, y, { r: 6, color: i === 3 ? (Math.abs(gap) < 0.05 ? 'green' : 'red') : 'teal' }));
          if (Math.abs(gap) > 0.05) sg.measure(3.18, 0, 3.18, gap, `${v.fix(gap, 1)}`);
          info = { Gam, J, p, gap, kAB, kBA, kBC, kCB, kCA, kAC, fmax };
        }, { still: 1.5 });
        v.legend([['accent', 'forward flux $k_{ij}p_i$ (arrow width)'], ['orange', 'backward flux'], ['gold', 'circulating current', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { Gam, J, p, gap } = info, sig = J * Math.log(Gam);
          return `$\\Gamma=\\dfrac{k_{AB}k_{BC}k_{CA}}{k_{BA}k_{CB}k_{AC}}=${v.fix(Gam, 4)}$ ${Math.abs(Gam - 1) < 1e-6 ? '(= 1: detailed balance)' : '(≠ 1: **violated**)'} · steady state $p=(${p.map((x) => v.fix(x, 3)).join(', ')})$ · cycle flux $J=${nice(v, J, 3)}$ · entropy production $J\\ln\\Gamma=${nice(v, sig, 3)}\\ \\ (\\ge0)$ · free energy gained per circuit $-RT\\ln\\Gamma=${v.fix(gap, 2)}$ kJ/mol`.replace('−0.00 kJ', '0.00 kJ');
        });
      },
    },
  ],
};
