// Pharmacology — Chapter 2: One-compartment kinetics
import { LN2, halfLife, integrateSegs, crossUp, crossDown, clamp, logSlope, idxAt, memo, sig, box, wire } from './ch02.shared.js';

const nice = (x) => (x >= 100 ? Math.round(x) : x >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100);

export default {
  collection: 'pharm',
  chapter: 2,
  title: 'One-compartment kinetics',
  summary: String.raw`Treating the body as a single well-mixed compartment with first-order elimination explains half-lives, the approach to a plateau under constant infusion, loading doses and the rise and fall after an oral dose. The key lesson is that half-life depends on both clearance and volume, and that the time to reach steady state depends on half-life alone. Every drug value in this chapter is a rounded teaching figure, not dosing advice.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'One-compartment model after an intravenous bolus',
      statement: String.raw`Treat the body as one well-mixed pool of volume $V$. A dose $D$ injected at $t=0$ is mixed instantly, so the concentration jumps to $C(0)=D/V$. Elimination is **first-order**: the rate at which drug leaves is proportional to what is there, $\dfrac{dA}{dt}=-\mathrm{CL}\cdot C=-kA$, with elimination rate constant $k=\mathrm{CL}/V$. Then $A(t)=D\,e^{-kt}$ and $C(t)=\dfrac{D}{V}\,e^{-kt}$: the concentration decays exponentially, so $\ln C$ is a straight line in $t$ with slope $-k$. The total exposure is $\mathrm{AUC}_{0\to\infty}=\dfrac{C(0)}{k}=\dfrac{D}{\mathrm{CL}}$, which is the relation $D=\mathrm{CL}\cdot\mathrm{AUC}$ of 1.5.`,
      idea: String.raw`The model is the definition of clearance (1.4) put into a mass balance: the amount in the body changes only by elimination, and the elimination rate is $\mathrm{CL}\cdot C=(\mathrm{CL}/V)\,A$ because $A=VC$ (1.3). That is the linear ODE $A'=-kA$ of first-order kinetics (kin-1.5), solved by an exponential. Dividing by $V$ gives the concentration; integrating it gives $C(0)/k=D/\mathrm{CL}$ without any new assumption. The straight line on the semilog plot is the practical test of the model: if real data bend, one compartment is not enough (chapter 3).`,
      caption: String.raw`A tank of volume $V$ (its width) holds the drug as dots; each dot is $D/60$ of the dose, so dot density is concentration. Drug leaves through the outflow at the bottom in proportion to how crowded the tank is. The **linear** plot is an exponential decay, the **semilog** plot a straight line. Change $D$, $V$ and CL: the line moves up with $D$ and down with $V$ (through $C_0=D/V$) but its slope depends only on the ratio $\mathrm{CL}/V$. The readout also integrates $A'=-kA$ numerically (RK4) and compares it with the formula.`,
      scope: String.raw`Holds when the drug distributes instantly and uniformly, elimination is first-order (CL independent of concentration), and the dose is given as an instantaneous intravenous bolus. Real injections take seconds to minutes, and many drugs show a faster early phase (chapter 3).`,
      credit: 'Teorell, 1937 (first compartmental treatment of drug distribution)',
      deps: ['pharm-1.3', 'pharm-1.4', 'kin-1.5'],
      refs: ['Rowland–Tozer'],
      tags: ['one-compartment', 'first-order'],
      viz(v) {
        const D = v.slider('dose $D$ (mg)', 50, 600, 300, { step: 10 });
        const V = v.slider('volume $V$ (L)', 10, 150, 40, { step: 1 });
        const CL = v.slider('clearance CL (L/h)', 0.5, 20, 5, { step: 0.1 });
        const sT = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 330, weight: 0.8, minWidth: 220 });
        const sL = v.stage({ x: [0, 48], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 330, weight: 1, minWidth: 250 });
        const sS = v.stage({ x: [0, 48], y: [0.01, 10], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L, log)', height: 330, weight: 1, minWidth: 250 });
        const r = v.rng(7);
        const spots = Array.from({ length: 60 }, () => [r(), r()]);
        let info = null;
        v.animate((tt) => {
          const k = CL.value / V.value, t12 = halfLife(CL.value, V.value), C0 = D.value / V.value;
          const tMax = nice(6 * t12);
          const th = tMax * clamp(tt / 8, 0, 1);
          const C = (t) => C0 * Math.exp(-k * t);
          // independent numerical check: RK4 on A' = -kA
          const num = integrateSegs(k, [[th || 1e-9, 0]], D.value, 200);
          const Anum = num.A[num.A.length - 1];
          info = { k, t12, C0, th, Cth: C(th), err: Math.abs(Anum / V.value - C(th)), tMax };
          // tank
          const W = 1.6 + 5 * (V.value / 150), cx = 5, bot = 2.2, top = 8.6;
          sT.rect(cx - W / 2, bot, cx + W / 2, top, { fill: 'accent', fillAlpha: 0.06, color: 'ink', width: 2 });
          const n = Math.round(60 * Math.exp(-k * th));
          const pts = [];
          for (let i = 0; i < n; i++) pts.push([cx - W / 2 + 0.15 + spots[i][0] * (W - 0.3), bot + 0.15 + spots[i][1] * (top - bot - 0.3)]);
          sT.dots(pts, { r: 3.2, color: 'accent' });
          const flow = CL.value * C(th);
          sT.arrow(cx, bot, cx, 0.5, { color: 'orange', width: 1.5 + 0.55 * flow, head: 9 });
          sT.text(`${v.fix(flow, 1)} mg/h`, cx + 0.7, 1.4, { size: 11, color: 'orange', align: 'left', baseline: 'middle', weight: 600 });
          sT.text('out', cx + 0.7, 0.8, { size: 10, color: 'muted', align: 'left', baseline: 'middle' });
          sT.text(`V = ${v.fix(V.value, 0)} L`, cx, top + 0.6, { size: 12, color: 'ink', align: 'center', baseline: 'middle', weight: 600 });
          sT.text(`t = ${v.fix(th, 1)} h · ${v.fix(100 * Math.exp(-k * th), 0)} % of dose left`, cx, 9.6, { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
          // linear
          sL.setView([0, tMax], [0, C0 * 1.12]);
          sL.fn(C, { domain: [0, tMax], color: 'accent', width: 2.2 });
          sL.fn(C, { domain: [0, th], color: 'accent', width: 0, fill: true, fillAlpha: 0.12 });
          sL.dot(th, C(th), { r: 5.5, color: 'gold' });
          sL.text('$C(0)=D/V$', tMax * 0.03, C0 * 0.99, { size: 11, color: 'muted', align: 'left', baseline: 'top', dx: 6, dy: 4 });
          sL.dot(0, C0, { r: 4, color: 'accent', hollow: true });
          sL.vline(t12, { color: 'green', dash: true, alpha: 0.7 });
          sL.text('$t_{1/2}$', t12, C0 * 0.06, { size: 11, color: 'green', align: 'left', baseline: 'bottom', dx: 5 });
          // semilog
          sS.setView([0, tMax], [C0 * 0.004, C0 * 1.6]);
          sS.fn(C, { domain: [0, tMax], color: 'accent', width: 2.2 });
          sS.dot(th, C(th), { r: 5.5, color: 'gold' });
          sS.dot(0, C0, { r: 4, color: 'accent', hollow: true });
          sS.hline(C0 / 2, { color: 'green', dash: true, alpha: 0.6 });
          sS.vline(t12, { color: 'green', dash: true, alpha: 0.6 });
          sS.corner(`slope = −k = −${v.fix(k, 3)} /h`, 'tr', { color: 'accent' });
        }, { period: 11, still: 3 });
        v.readout(() => `$C_0=D/V=${v.fix(info.C0, 2)}$ mg/L, $k=\\mathrm{CL}/V=${v.fix(info.k, 3)}\\ \\mathrm{h}^{-1}$, $t_{1/2}=${v.fix(info.t12, 1)}$ h, $\\mathrm{AUC}=D/\\mathrm{CL}=${v.fix(D.value / CL.value, 1)}$ mg·h/L.\nAt $t=${v.fix(info.th, 1)}$ h: $C=${v.fix(info.Cth, 3)}$ mg/L; RK4 on $A'=-kA$ differs by $${v.sci(info.err + 1e-12, 2)}$ mg/L.`);
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'Half-life: t½ = 0.693·V/CL',
      statement: String.raw`In the one-compartment model with first-order elimination the time for the concentration to fall by half is the same at every concentration: $t_{1/2}=\dfrac{\ln 2}{k}=\dfrac{\ln 2\,V}{\mathrm{CL}}\approx 0.693\,\dfrac{V}{\mathrm{CL}}$. Half-life is therefore not a property of the drug alone: it is the ratio of the volume the drug has to be cleared from to the rate at which the body clears it. Doubling $V$ at fixed CL doubles $t_{1/2}$; doubling CL at fixed $V$ halves it; doubling both changes nothing.`,
      idea: String.raw`From 2.1, $C(t)=C(0)e^{-kt}$ with $k=\mathrm{CL}/V$. Setting $C(t_{1/2})=C(0)/2$ gives $e^{-kt_{1/2}}=\tfrac12$, so $t_{1/2}=\ln 2/k$, and substituting $k=\mathrm{CL}/V$ gives the formula. The exponential has no memory: starting from any concentration, the same time halves it. Clearance and volume are separate physiological quantities (blood flow and enzymes versus tissue binding), so the half-life moves when either changes; a long half-life can mean low clearance or a huge volume.`,
      caption: String.raw`The map shows the half-life (colour, and the straight iso-lines) for every combination of volume (horizontal, log) and clearance (vertical, log). **Drag the handle**: the semilog plot on the right shows its decline (a 100 mg bolus) against the starting curve (dashed grey, $V=40$ L, CL $=5$ L/h). The buttons double $V$ or CL alone. Moving along a line of constant colour keeps the half-life, however much $V$ and CL change. The half-life is measured by integrating the ODE until the amount has halved, not read from the formula.`,
      scope: String.raw`Applies to first-order elimination in a single compartment. For drugs with several compartments there are several half-lives (the terminal one is what is usually quoted), and for saturable elimination the half-life depends on concentration.`,
      deps: ['pharm-2.1'],
      refs: ['Rowland–Tozer'],
      tags: ['half-life', 'clearance'],
      viz(v) {
        const D = 100, V0 = 40, CL0 = 5;
        const sM = v.stage({ x: [5, 500], y: [0.5, 50], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'volume $V$ (L, log)', ylabel: 'clearance CL (L/h, log)', height: 330, weight: 1, minWidth: 260 });
        const sS = v.stage({ x: [0, 100], y: [0.01, 30], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L, log)', height: 330, weight: 1, minWidth: 260 });
        const h = sM.handle(V0, CL0, { color: 'gold', r: 8, label: 'drug', labelPos: 'ne', constrain: { x: [5, 500], y: [0.5, 50] } });
        v.button('double $V$', () => h.set(Math.min(500, h.x * 2), h.y));
        v.button('double CL', () => h.set(h.x, Math.min(50, h.y * 2)));
        v.button('reset', () => h.set(V0, CL0));
        const measure = (CLx, Vx) => {
          const k = CLx / Vx, run = integrateSegs(k, [[10 * LN2 / k, 0]], D, 3000);
          return crossDown(run.t, run.A, D / 2);
        };
        let info = null;
        v.render(() => {
          const Vx = h.x, CLx = h.y, k = CLx / Vx, t12 = halfLife(CLx, Vx), meas = measure(CLx, Vx);
          info = { Vx, CLx, t12, meas };
          sM.heat((x, y) => Math.log10((LN2 * x) / y), { range: [-1.2, 2.6], cmap: 'viridis', res: 3, key: 'th' });
          for (const c of [0.3, 1, 3, 10, 30, 100]) {
            const f = (V) => (LN2 * V) / c;
            sM.line(5, f(5), 500, f(500), { color: 'panel', width: 1, alpha: 0.7 });
            let lx = 7, ly = f(lx);
            if (ly > 40) { ly = 40; lx = (c * ly) / LN2; }
            if (ly < 0.7) { ly = 0.7; lx = (c * ly) / LN2; }
            if (lx > 80 && f(80) < 50 && f(80) > 0.5) { lx = 80; ly = f(80); }
            if (lx <= 450) sM.text(`${c} h`, lx, ly, { size: 10, color: 'ink', align: 'left', baseline: 'bottom', weight: 600, plate: true });
          }
          sM.dot(V0, CL0, { r: 4, color: 'ink', hollow: true });
          sM.text('start', V0, CL0, { size: 10, color: 'ink', dx: -8, dy: 10, align: 'right' });
          sM.corner(`$t_{1/2}$ = ${sig(t12, 3)} h`, 'tl', { color: 'ink', plate: true });
          const tMax = Math.max(6 * t12, 6 * halfLife(CL0, V0));
          sS.setView([0, Math.min(1e4, nice(tMax))], [0.01, 30]);
          const Cr = (t) => (D / V0) * Math.exp(-(CL0 / V0) * t), Cn = (t) => (D / Vx) * Math.exp(-k * t);
          sS.fn(Cr, { domain: [0, 1e4], color: 'muted', dash: true, width: 1.5 });
          sS.fn(Cn, { domain: [0, 1e4], color: 'accent', width: 2.4 });
          sS.vline(t12, { color: 'green', dash: true });
          sS.dot(t12, D / Vx / 2, { r: 5.5, color: 'green' });
          sS.hline(D / Vx, { color: 'accent', alpha: 0.25, dash: [3, 4] });
          sS.hline(D / Vx / 2, { color: 'green', alpha: 0.4, dash: [3, 4] });
          sS.text('$C(0)/2$', 0, D / Vx / 2, { size: 10.5, color: 'green', align: 'left', baseline: 'top', dx: 4, dy: 5 });
        });
        v.legend([['accent', 'current drug'], ['muted', 'starting drug', { dash: true }], ['green', 'half-life', { dot: true }]]);
        v.readout(() => `$V=${v.fix(info.Vx, 1)}$ L, $\\mathrm{CL}=${v.fix(info.CLx, 2)}$ L/h: formula $0.693\\,V/\\mathrm{CL}=${v.fix(info.t12, 2)}$ h; half-life measured on the integrated ODE $=${v.fix(info.meas, 2)}$ h. Ratio to the starting drug: $${v.fix(info.t12 / halfLife(CL0, V0), 2)}\\times$.`);
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Method',
      name: 'Estimating the elimination rate from a semilog plot',
      statement: String.raw`Given plasma concentrations $C_i$ at times $t_i$ after an intravenous bolus, the elimination rate constant is estimated by regressing $\ln C_i$ on $t_i$: the fitted slope is $-\hat k$, the intercept is $\ln\hat C_0$, and $\hat t_{1/2}=\ln 2/\hat k$, $\hat V=D/\hat C_0$, $\widehat{\mathrm{CL}}=\hat k\hat V$. For fixed uncensored sampling times with independent normal log-errors of common variance, $n>2$ reportable samples and distinct times, the estimated slope standard error is $s_b$ and the nominal $95\,\%$ interval is $\hat k\pm t_{n-2,0.975}\,s_b$. The interval is narrow when the samples cover a long stretch of time (a large spread of the $t_i$) and when assay noise is small.`,
      idea: String.raw`Taking logarithms turns the exponential $C_0e^{-kt}$ into the line $\ln C_0-kt$ (2.1), so least squares applies. In ordinary regression the slope's standard error is $\sigma/\sqrt{\sum(t_i-\bar t)^2}$, which is why samples far apart in time carry most of the information and why dropping the late ones widens the interval most. The method also assumes noise that is multiplicative (a constant percentage error), which is what makes it additive after the logarithm; the lognormal noise used here has that property.

For positive reported concentrations, put $y_i=\log C_i$ and let U be the span of the constant vector and the sampling-time vector. The closest-subspace theorem ladr 6.61 makes the fitted line the unique orthogonal projection of y onto U when the times are not all equal; residual orthogonality gives the usual slope with denominator $S_{tt}=\sum(t_i-\bar t)^2$. For fixed, uncensored times with independent normal log-errors of common variance, the standardized slope error is normal and independent of the residual sum of squares divided by that variance, which is chi-squared with n-2 degrees of freedom. The normal/independent-chi-squared ratio in stat 1.10 then gives the stated Student interval using $s_b=\hat\sigma/\sqrt{S_{tt}}$. This is a conditional model result: removing observations below an assay limit selects their errors, so the widget's resulting nominal interval need not have exact 95-percent coverage.`,
      caption: String.raw`Eleven blood samples of a drug with true half-life 5 h (dashed green line) are generated with lognormal assay noise. The accent line is the least-squares fit; its shaded band is the nominal 95 % interval for the slope. Choose whether to **keep the earliest or the latest** $n$ samples and slide $n$: the right panel plots the estimated half-life with its nominal 95 % interval for every $n$ (current one in gold). **New sample** draws fresh noise. Samples under the assay limit of 0.1 mg/L (hollow) are not reported. This outcome-dependent exclusion breaks the uncensored Gaussian pivot assumptions; the displayed intervals then have no exact 95 % coverage guarantee. The right panel displays 0–30 h only: finite endpoints inside the range have caps; a top ∞ marks an unbounded upper endpoint and a top > a finite upper endpoint above 30 h. P> marks a positive point estimate above 30 h that is omitted from the plotted points. A bottom × means that the rate interval contains no positive elimination rate; nonpositive point estimates are omitted. These glyphs are status labels, not finite half-life estimates.`,
      scope: String.raw`The nominal Student interval requires an uncensored fixed design with independent Gaussian errors of constant variance on the log scale and all observations on one exponential phase. Proportional noise alone does not imply that distribution or independence. The chosen lognormal generator meets the Gaussian log-error assumption before assay-limit exclusion; fitting only reportable concentrations can introduce selection bias. Curved profiles and other error models require a different analysis.`,
      deps: ['pharm-2.1', 'ladr-6.61', 'stat-1.10'],
      refs: ['Rowland–Tozer'],
      tags: ['regression', 'half-life'],
      viz(v) {
        const T = [0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 24], C0 = 20, LOQ = 0.1;
        const t12 = v.slider('true half-life $t_{1/2}$ (h)', 2, 12, 5, { step: 0.5 });
        const cv = v.slider('assay noise (ln-scale s.d.)', 0.02, 0.5, 0.15, { step: 0.01 });
        const nS = v.slider('samples used $n$', 3, 11, 8, { int: true });
        const keep = v.select('keep', [{ value: 'first', label: 'earliest $n$' }, { value: 'last', label: 'latest $n$' }], 'first');
        let seed = 3;
        v.button('new sample', () => { seed++; });
        const sA = v.stage({ x: [0, 25], y: [0.05, 40], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L, log)', height: 330, weight: 1.15, minWidth: 260 });
        const sB = v.stage({ x: [2.5, 11.5], y: [0, 30], axes: 'box', gutter: true, xlabel: 'samples used $n$', ylabel: '$t_{1/2}$ (h; 0–30 display)', height: 330, weight: 1, minWidth: 250, xticks: [3, 4, 5, 6, 7, 8, 9, 10, 11] });
        const draw = memo();
        const fitOf = (idx, ts, ys) => {
          const x = idx.map((i) => ts[i]), y = idx.map((i) => Math.log(ys[i]));
          const R = v.M.linreg(x, y), df = idx.length - 2;
          const tq = df >= 1 ? v.M.dist.studentT(df).quantile(0.975) : NaN;
          return { R, k: -R.slope, se: R.seSlope, tq, tbar: v.M.mean(x), ybar: v.M.mean(y), n: idx.length };
        };
        let info = null;
        v.render(() => {
          const data = draw(`${seed}|${t12.value}|${cv.value}`, () => {
            const r = v.rng(seed * 101 + 5), k = LN2 / t12.value;
            return T.map((t) => C0 * Math.exp(-k * t + cv.value * r.normal()));
          });
          const ok = T.map((_, i) => i).filter((i) => data[i] >= LOQ);
          const sel = (m) => (keep.value === 'first' ? ok.slice(0, m) : ok.slice(Math.max(0, ok.length - m)));
          const m = Math.min(nS.value, ok.length), use = sel(m);
          const f = use.length >= 3 ? fitOf(use, T, data) : null;
          const ktrue = LN2 / t12.value;
          sA.fn((t) => C0 * Math.exp(-ktrue * t), { domain: [0, 25], color: 'green', dash: true, width: 1.6 });
          T.forEach((t, i) => sA.dot(t, Math.max(data[i], 0.0501), { r: 4.5, color: use.includes(i) ? 'gold' : 'muted', hollow: !use.includes(i) }));
          if (f) {
            const b = Math.exp(f.R.intercept);
            const x0 = Math.min(...use.map((i) => T[i])), x1 = Math.max(...use.map((i) => T[i]));
            const w = f.tq * f.se;
            const line = (kk, t) => Math.exp(f.ybar) * Math.exp(-kk * (t - f.tbar));
            const pts = [];
            for (let j = 0; j <= 40; j++) { const t = (j / 40) * 25; pts.push([t, line(f.k + w, t)]); }
            for (let j = 40; j >= 0; j--) { const t = (j / 40) * 25; pts.push([t, line(f.k - w, t)]); }
            sA.poly(pts, { fill: 'accent', fillAlpha: 0.14, stroke: false });
            sA.fn((t) => b * Math.exp(-f.k * t), { domain: [0, 25], color: 'accent', width: 2.2 });
            sA.vband(x0, x1, { color: 'gold', alpha: 0.07 });
          }
          // right: interval vs n
          sB.hline(t12.value, { color: 'green', width: 1.6, dash: true });
          const lim = 30;
          for (let q = 3; q <= ok.length; q++) {
            const g = fitOf(sel(q), T, data), kc = g.k, w = g.tq * g.se;
            const cur = q === m, col = cur ? 'gold' : 'accent';
            if (!(kc + w > 0)) {
              sB.text('×', q, 1.5, { color: 'red', size: 13, align: 'center' });
              continue;
            }
            const lo = LN2 / (kc + w), hi = kc - w > 0 ? LN2 / (kc - w) : Infinity;
            if (lo <= lim) {
              sB.segment([q, lo], [q, Math.min(lim, hi)], { color: col, width: cur ? 3 : 2 });
              sB.segment([q - 0.15, lo], [q + 0.15, lo], { color: col, width: 2 });
            }
            if (hi <= lim) sB.segment([q - 0.15, hi], [q + 0.15, hi], { color: col, width: 2 });
            else sB.text(isFinite(hi) ? '>' : '∞', q, lim - 0.4, { color: col, size: 11, align: 'center', baseline: 'top' });
            if (kc > 0) {
              const point = LN2 / kc;
              if (point <= lim) sB.dot(q, point, { r: 4, color: col });
              else sB.text('P>', q, lim - 3.5, { color: col, size: 8, align: 'center', baseline: 'top' });
            }
          }
          info = f ? { f, m, w: f.tq * f.se, ok: ok.length } : { f: null, m, ok: ok.length };
        });
        v.legend([['green', 'true value', { dash: true }], ['accent', 'fit and nominal 95 % interval'], ['gold', 'samples used', { dot: true }]]);
        v.readout(() => {
          if (!info.f) return 'fewer than three reportable samples';
          const { f, w } = info, rateLo = f.k - w, rateHi = f.k + w;
          const rate = `$n=${info.m}$: $\\hat k=${v.fix(f.k, 3)}\\pm${v.fix(w, 3)}$ h$^{-1}$ (nominal 95 %)`;
          if (!(rateHi > 0)) return `${rate}. The rate interval contains no positive elimination rate, so it supports no positive-decay half-life.`;
          const lo = LN2 / rateHi, hi = rateLo > 0 ? LN2 / rateLo : Infinity;
          const point = f.k > 0 ? `$\\hat t_{1/2}=${v.fix(LN2 / f.k, 1)}$ h` : 'no positive-decay point estimate';
          return `${rate}, so ${point} with positive-rate half-life interval $[${v.fix(lo, 1)},\\ ${isFinite(hi) ? v.fix(hi, 1) + ']' : '\\infty)'}$ h; $\\hat C_0=${v.fix(Math.exp(f.R.intercept), 1)}$ mg/L (true $20$), $r^2=${v.fix(f.R.r2, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Model',
      name: 'Constant-rate infusion and the plateau principle',
      statement: String.raw`If drug is infused at a constant rate $R$ (mg/h) into the one-compartment body, then $\dfrac{dA}{dt}=R-kA$ and, starting from zero, $C(t)=\dfrac{R}{\mathrm{CL}}\bigl(1-e^{-kt}\bigr)$. The concentration rises toward the **plateau** (steady state) $C_{ss}=R/\mathrm{CL}$, where the input rate equals the elimination rate $\mathrm{CL}\cdot C_{ss}$. If the infusion stops at time $T$, the concentration then falls as $C(T)\,e^{-k(t-T)}$; after a long infusion the decline is the mirror image of the rise.`,
      idea: String.raw`The mass balance $A'=R-kA$ has a constant source and a loss proportional to the amount, so $A$ approaches the point where the two cancel, $A_{ss}=R/k$, and the gap to the plateau decays like $e^{-kt}$ (2.1). In concentration terms $C_{ss}=A_{ss}/V=R/\mathrm{CL}$: the plateau depends on rate and clearance only, not on volume. Once the input is off the equation is the bolus decay of 2.1 started from $C(T)$. Subtracting, $C_{ss}-C_{\text{rise}}(t)=C_{ss}e^{-kt}$ is exactly the decline from the plateau, which is the mirror symmetry.

Apply the integrating-factor formula ode 1.4 to $A'+kA=R$ on the constant-input interval. Multiplication by $e^{kt}$ gives $(e^{kt}A)'=Re^{kt}$, hence $A=R(1-e^{-kt})/k$ from zero. After the switch-off, use the actual continuous amount A(T) as the new initial value with zero source. Positive k is needed for a finite plateau; with zero elimination the same formula's limiting equation is linear accumulation, not convergence to a steady concentration.`,
      caption: String.raw`Left: concentration under an infusion of rate $R$ that **stops after the chosen number of half-lives**. The dashed curve is $C_{ss}$ minus the rise, shifted to the stop time: it lies on the decline when the infusion ran long enough to reach the plateau. Right: the **balance of flows**, input rate $R$ (flat) against elimination rate $\mathrm{CL}\cdot C(t)$; the plateau is where they meet, and the shaded gap is the drug still accumulating. The curve comes from RK4 on $A'=R-kA$; the readout compares it with the formula.`,
      scope: String.raw`One compartment, first-order elimination, constant infusion into the blood. A real infusion pump holds the rate only on average, and with several compartments the rise has several time scales.`,
      deps: ['pharm-2.2', 'ode-1.4'],
      refs: ['Rowland–Tozer'],
      tags: ['infusion', 'steady state'],
      viz(v) {
        const R = v.slider('infusion rate $R$ (mg/h)', 5, 100, 50, { step: 1 });
        const CL = v.slider('clearance CL (L/h)', 1, 20, 5, { step: 0.1 });
        const V = v.slider('volume $V$ (L)', 10, 100, 40, { step: 1 });
        const nT = v.slider('infusion stops after (half-lives)', 0.5, 8, 6, { step: 0.1 });
        const sA = v.stage({ x: [0, 100], y: [0, 14], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 320, weight: 1.2, minWidth: 260 });
        const sB = v.stage({ x: [0, 100], y: [0, 60], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'rate (mg/h)', height: 320, weight: 1, minWidth: 250 });
        let info = null;
        v.render(() => {
          const k = CL.value / V.value, t12 = halfLife(CL.value, V.value), Css = R.value / CL.value, Ts = nT.value * t12, tMax = nice(12 * t12 > Ts * 1.6 ? 12 * t12 : Ts * 1.6);
          const run = integrateSegs(k, [[Ts, R.value], [tMax, 0]], 0, 600);
          const Cn = run.A.map((a) => a / V.value);
          const Cf = (t) => (t <= Ts ? Css * (1 - Math.exp(-k * t)) : Css * (1 - Math.exp(-k * Ts)) * Math.exp(-k * (t - Ts)));
          let err = 0; for (let i = 0; i < run.t.length; i += 7) err = Math.max(err, Math.abs(Cn[i] - Cf(run.t[i])));
          info = { k, t12, Css, Ts, err, Cs: Cf(Ts) };
          sA.setView([0, tMax], [0, Math.max(Css * 1.18, 1)]);
          sA.hline(Css, { color: 'green', dash: true, width: 1.6 });
          sA.text('$C_{ss}=R/\\mathrm{CL}$', tMax * 0.99, Css, { size: 11.5, color: 'green', align: 'right', baseline: 'bottom', dy: -3 });
          sA.fn((t) => Css - Css * (1 - Math.exp(-k * (t - Ts))) * (t >= Ts ? 1 : NaN), { domain: [Ts, tMax], color: 'orange', dash: true, width: 1.8 });
          sA.fn((t) => Css * (1 - Math.exp(-k * t)), { domain: [0, Ts], color: 'accent', width: 2.4 });
          sA.fn((t) => Cf(t), { domain: [Ts, tMax], color: 'purple', width: 2.4 });
          sA.vline(Ts, { color: 'faint', dash: true });
          sA.text('infusion stops', Ts, Css * 1.15, { size: 10.5, color: 'muted', align: 'center', baseline: 'top', dx: 38 });
          for (let j = 1; j <= Math.min(10, Math.floor(tMax / t12)); j++) sA.dot(j * t12, 0, { r: 2.5, color: 'muted' });
          // balance
          sB.setView([0, tMax], [0, Math.max(R.value * 1.25, 1)]);
          const out = (t) => CL.value * Cf(t), inn = (t) => (t <= Ts ? R.value : 0);
          sB.between((t) => (t <= Ts ? out(t) : NaN), (t) => (t <= Ts ? inn(t) : NaN), 0, Ts, { fill: 'gold', fillAlpha: 0.2 });
          sB.fn(inn, { domain: [0, tMax], color: 'orange', width: 2.2 });
          sB.fn(out, { domain: [0, tMax], color: 'accent', width: 2.2 });
          sB.text('input $R$', tMax * 0.02, R.value, { size: 11, color: 'orange', align: 'left', baseline: 'bottom', dy: -3 });
          sB.text('elimination CL·C', Ts * 0.5, out(Ts * 0.5), { size: 11, color: 'accent', align: 'left', baseline: 'top', dx: 8, dy: 8 });
        });
        v.legend([['accent', 'rising during infusion'], ['purple', 'decline after stopping'], ['orange', 'mirror of the rise', { dash: true }], ['green', 'plateau', { dash: true }]]);
        v.readout(() => `$k=${v.fix(info.k, 3)}$ h$^{-1}$, $t_{1/2}=${v.fix(info.t12, 1)}$ h, plateau $C_{ss}=R/\\mathrm{CL}=${v.fix(info.Css, 2)}$ mg/L (independent of $V$). At the stop time ($${v.fix(info.Ts, 1)}$ h) the concentration is $${v.fix(100 * info.Cs / info.Css, 1)}$ % of the plateau. RK4 versus formula: largest difference $${v.sci(info.err + 1e-12, 2)}$ mg/L.`);
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Time to plateau depends only on half-life',
      statement: String.raw`For a constant infusion into a one-compartment body with first-order elimination, the fraction of the plateau reached at time $t$ is $f(t)=C(t)/C_{ss}=1-e^{-kt}=1-2^{-t/t_{1/2}}$. It depends on $t$ only through the number of half-lives $t/t_{1/2}$: it is $50\,\%$ after one half-life, $90\,\%$ after $\log_2 10\approx 3.3$, and about $97\,\%$ after five. The infusion rate sets the **height** of the plateau but not the **time** needed to approach it; neither does the volume except through $t_{1/2}$.`,
      idea: String.raw`From 2.4, $C_{ss}-C(t)=C_{ss}e^{-kt}$, so the remaining distance to the plateau shrinks by a factor $e^{-k\,t}$ regardless of $R$: the rate $R$ cancels when the equation is divided by $C_{ss}=R/\mathrm{CL}$. Writing $e^{-kt}=2^{-t/t_{1/2}}$ (2.2) turns the time axis into half-lives. This is why all linear drugs are about 97 % of the way to steady state after five half-lives, and why doubling the dose rate doubles the plateau without hastening it.`,
      caption: String.raw`Left: the concentration for three infusion rates ($R$, $3R$, $10R$) in real time; the plateaus differ tenfold. Right: the same curves as a fraction of their own plateau against **time in half-lives**; they fall on one curve passing through 50, 90 and about 97 % at 1, 3.3 and 5 half-lives. Change $V$ or CL and only the left time scale moves. Now switch on **saturable elimination** (Michaelis–Menten, with the same clearance at low concentration): the curves separate, higher rates take longer to approach a higher plateau, and once $R$ exceeds the maximum elimination rate $V_{max}$ there is no plateau at all. The readout measures the time to 90 % on the ODE solution.`,
      scope: String.raw`Holds for linear (first-order) kinetics. For saturable elimination the time to steady state does depend on the dose rate (this is why the plateau principle fails for phenytoin and ethanol).`,
      deps: ['pharm-2.4'],
      refs: ['Rowland–Tozer'],
      tags: ['steady state', 'half-life'],
      viz(v) {
        const R0 = v.slider('base rate $R$ (mg/h)', 2, 10, 5, { step: 0.5 });
        const CL = v.slider('clearance CL (L/h)', 1, 10, 5, { step: 0.1 });
        const V = v.slider('volume $V$ (L)', 10, 100, 40, { step: 1 });
        const mm = v.toggle('saturable elimination', false);
        const sA = v.stage({ x: [0, 60], y: [0, 12], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 320, weight: 1.1, minWidth: 260 });
        const sB = v.stage({ x: [0, 6], y: [0, 1.05], axes: 'box', gutter: true, xlabel: 'time in half-lives $t/t_{1/2}$', ylabel: 'fraction of own plateau', height: 320, weight: 1, minWidth: 250, xticks: [0, 1, 2, 3, 4, 5, 6], yticks: [0, 0.25, 0.5, 0.75, 0.9, 1] });
        const MULT = [1, 3, 10], COL = ['accent', 'orange', 'purple'], Km = 10;
        let info = null;
        // elimination rate (mg/h): linear CL*C, or Michaelis-Menten with the same initial slope: Vmax = CL*Km
        const sim = (R, k, CLv, Vv, tEnd) => {
          const n = 1500, h = tEnd / n, el = (c) => (mm.value ? (CLv * Km * c) / (Km + c) : CLv * c);
          const f = (A) => R - el(A / Vv);
          let A = 0; const t = [], c = [];
          for (let i = 0; i <= n; i++) {
            t.push(i * h); c.push(A / Vv);
            const k1 = f(A), k2 = f(A + (h / 2) * k1), k3 = f(A + (h / 2) * k2), k4 = f(A + h * k3);
            A += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
          }
          return { t, c };
        };
        v.render(() => {
          const k = CL.value / V.value, t12 = halfLife(CL.value, V.value), tEnd = 10 * t12, Vmax = CL.value * Km;
          const rows = MULT.map((m) => {
            const R = R0.value * m, S = sim(R, k, CL.value, V.value, tEnd);
            const Css = mm.value ? (R < Vmax ? (Km * R) / (Vmax - R) : Infinity) : R / CL.value;
            const t90 = isFinite(Css) ? crossUp(S.t, S.c, 0.9 * Css) : NaN;
            return { m, R, S, Css, t90 };
          });
          info = { t12, rows, Vmax };
          sA.setView([0, 6 * t12], [0, (12 * R0.value) / CL.value * 0.95 + 1e-6]);
          rows.forEach((o, i) => {
            if (isFinite(o.Css)) sA.hline(o.Css, { color: COL[i], alpha: 0.35, dash: [4, 4] });
            sA.path(o.S.t.map((t, j) => [t, o.S.c[j]]), { color: COL[i], width: 2.2 });
          });
          if (mm.value) sA.corner(`$V_{max}=${v.fix(Vmax, 0)}$ mg/h`, 'tl', { color: 'red' });
          // right: normalised
          [0.5, 0.9, 0.97].forEach((f) => sB.hline(f, { color: 'faint', dash: [3, 4] }));
          rows.forEach((o, i) => {
            if (!isFinite(o.Css)) return;
            sB.path(o.S.t.map((t, j) => [t / t12, o.S.c[j] / o.Css]), { color: COL[i], width: i === 0 ? 4 : 2, alpha: i === 0 ? 0.55 : 1 });
          });
          if (!mm.value) for (const n of [1, Math.log2(10), 5]) sB.dot(n, 1 - Math.pow(2, -n), { r: 5, color: 'green' });
          if (!mm.value) sB.text('50 %', 1.1, 0.46, { size: 10.5, color: 'green', align: 'left', baseline: 'top' });
          if (!mm.value) sB.text('90 %', 3.32, 0.86, { size: 10.5, color: 'green', align: 'left', baseline: 'top', dx: 6 });
          if (!mm.value) sB.text('97 %', 5, 0.93, { size: 10.5, color: 'green', align: 'center', baseline: 'top', dy: 8 });
        });
        v.legend([['accent', '$R$'], ['orange', '$3R$'], ['purple', '$10R$']]);
        v.readout(() => `$t_{1/2}=${v.fix(info.t12, 1)}$ h. Time to 90 % of the plateau (measured on the ODE): ` + info.rows.map((o) => `$${o.m}R$: ` + (isFinite(o.t90) ? `$${v.fix(o.t90, 1)}$ h $=${v.fix(o.t90 / info.t12, 2)}\\,t_{1/2}$` : 'no plateau')).join(' · ') + (mm.value ? '. Saturated: the times differ.' : `. Predicted: $\\log_2 10=${v.fix(Math.log2(10), 2)}$ half-lives for every rate.`));
      },
    },
  ],
};
